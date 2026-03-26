(function () {
  var shell = document.querySelector("[data-search-shell]");
  if (!shell) return;

  var input = shell.querySelector("[data-search-input]");
  var resultsNode = shell.querySelector("[data-search-results]");
  var statusNode = shell.querySelector("[data-search-status]");
  var openButtons = document.querySelectorAll("[data-search-open]");
  var closeButtons = document.querySelectorAll("[data-search-close]");
  var indexUrl = document.body.getAttribute("data-search-index");

  var documents = null;
  var loadPromise = null;
  var active = false;

  function normalize(value) {
    return (value || "")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();
  }

  function tokenize(query) {
    return normalize(query).split(" ").filter(Boolean);
  }

  function fuzzyTitleScore(text, query) {
    if (!text || !query) return 0;

    var textIndex = 0;
    var queryIndex = 0;
    var start = -1;
    var end = -1;

    while (textIndex < text.length && queryIndex < query.length) {
      if (text[textIndex] === query[queryIndex]) {
        if (start === -1) start = textIndex;
        end = textIndex;
        queryIndex += 1;
      }
      textIndex += 1;
    }

    if (queryIndex !== query.length) return 0;

    return Math.max(12, 52 - (end - start));
  }

  function scoreDocument(document, tokens, query) {
    var score = 0;
    var titleMatches = 0;
    var bodyMatches = 0;

    if (!tokens.length) return 0;

    if (document.titleNorm === query) score += 800;
    if (document.titleNorm.indexOf(query) === 0) score += 320;
    if (document.titleNorm.indexOf(query) !== -1) score += 180;
    if (document.sectionNorm.indexOf(query) !== -1) score += 60;

    score += fuzzyTitleScore(document.titleNorm, query);

    tokens.forEach(function (token) {
      if (document.titleNorm.indexOf(token) !== -1) {
        score += 90;
        titleMatches += 1;
      }
      if (document.sectionNorm.indexOf(token) !== -1) {
        score += 35;
      }
      if (document.summaryNorm.indexOf(token) !== -1) {
        score += 28;
        bodyMatches += 1;
      }
      if (document.contentNorm.indexOf(token) !== -1) {
        score += 10;
        bodyMatches += 1;
      }
    });

    if (!titleMatches && !bodyMatches && !fuzzyTitleScore(document.titleNorm, query)) {
      return 0;
    }

    return score;
  }

  function createSnippet(document, tokens) {
    var source = document.summary || document.content;
    if (!source) return "";

    var lowerSource = source.toLowerCase();
    var matchIndex = -1;

    tokens.some(function (token) {
      matchIndex = lowerSource.indexOf(token);
      return matchIndex !== -1;
    });

    if (matchIndex === -1) {
      return source.length > 150 ? source.slice(0, 147).trim() + "..." : source;
    }

    var start = Math.max(0, matchIndex - 48);
    var end = Math.min(source.length, matchIndex + 110);
    var snippet = source.slice(start, end).trim();

    if (start > 0) snippet = "..." + snippet;
    if (end < source.length) snippet += "...";

    return snippet;
  }

  function setStatus(message) {
    statusNode.textContent = message;
  }

  function clearResults() {
    resultsNode.innerHTML = "";
  }

  function renderResults(matches, tokens) {
    clearResults();

    if (!matches.length) {
      setStatus('No results for "' + input.value.trim() + '".');
      return;
    }

    setStatus(matches.length === 1 ? "1 result" : matches.length + " results");

    matches.forEach(function (match) {
      var item = document.createElement("li");
      var link = document.createElement("a");
      var meta = document.createElement("p");
      var title = document.createElement("p");
      var snippet = document.createElement("p");

      item.className = "search-result-item";
      link.className = "search-result-link";
      link.href = match.permalink;

      meta.className = "search-result-meta";
      meta.textContent = match.section;

      title.className = "search-result-title";
      title.textContent = match.title;

      snippet.className = "search-result-snippet";
      snippet.textContent = createSnippet(match, tokens);

      link.appendChild(meta);
      link.appendChild(title);
      link.appendChild(snippet);
      item.appendChild(link);
      resultsNode.appendChild(item);
    });
  }

  function hydrateDocuments(rawDocuments) {
    return rawDocuments.map(function (document) {
      return {
        title: document.title,
        section: document.section,
        permalink: document.permalink,
        summary: document.summary || "",
        content: document.content || "",
        titleNorm: normalize(document.title),
        sectionNorm: normalize(document.section),
        summaryNorm: normalize(document.summary),
        contentNorm: normalize(document.content)
      };
    });
  }

  function loadIndex() {
    if (documents) return Promise.resolve(documents);
    if (loadPromise) return loadPromise;

    setStatus("Loading search index...");

    loadPromise = fetch(indexUrl, { headers: { Accept: "application/json" } })
      .then(function (response) {
        if (!response.ok) {
          throw new Error("Search index request failed");
        }
        return response.json();
      })
      .then(function (payload) {
        documents = hydrateDocuments(payload);
        return documents;
      })
      .catch(function () {
        setStatus("Search is unavailable right now.");
        return [];
      });

    return loadPromise;
  }

  function runSearch() {
    var query = input.value.trim();
    var tokens = tokenize(query);

    if (!query) {
      clearResults();
      setStatus("Start typing to search the docs.");
      return;
    }

    loadIndex().then(function (loadedDocuments) {
      var normalizedQuery = normalize(query);

      var matches = loadedDocuments
        .map(function (document) {
          return {
            document: document,
            score: scoreDocument(document, tokens, normalizedQuery)
          };
        })
        .filter(function (entry) {
          return entry.score > 0;
        })
        .sort(function (left, right) {
          return right.score - left.score;
        })
        .slice(0, 8)
        .map(function (entry) {
          return entry.document;
        });

      renderResults(matches, tokens);
    });
  }

  function openSearch() {
    if (active) return;
    active = true;
    shell.hidden = false;
    document.body.classList.add("search-open");
    loadIndex();
    window.requestAnimationFrame(function () {
      input.focus();
      input.select();
    });
  }

  function closeSearch() {
    if (!active) return;
    active = false;
    shell.hidden = true;
    document.body.classList.remove("search-open");
  }

  openButtons.forEach(function (button) {
    button.addEventListener("click", openSearch);
  });

  closeButtons.forEach(function (button) {
    button.addEventListener("click", closeSearch);
  });

  document.addEventListener("keydown", function (event) {
    var isShortcut = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k";

    if (isShortcut) {
      event.preventDefault();
      if (active) {
        closeSearch();
      } else {
        openSearch();
      }
      return;
    }

    if (event.key === "Escape" && active) {
      closeSearch();
    }

    if (!active && event.key === "/") {
      var target = event.target;
      var tagName = target && target.tagName ? target.tagName.toLowerCase() : "";
      var isEditable = target && (target.isContentEditable || tagName === "input" || tagName === "textarea");

      if (!isEditable) {
        event.preventDefault();
        openSearch();
      }
    }
  });

  input.addEventListener("input", runSearch);
})();

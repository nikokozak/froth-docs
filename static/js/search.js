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

  function slugify(value) {
    return (value || "")
      .toLowerCase()
      .trim()
      .replace(/[`']/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function tokenize(query) {
    return normalize(query).split(" ").filter(Boolean);
  }

  function fuzzyTitleScore(text, query) {
    if (!text || !query || query.length < 4) return 0;

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

  function makeLocation(parts) {
    return parts.filter(Boolean).join(" / ");
  }

  function stripMarkdown(value) {
    return (value || "")
      .replace(/```[\s\S]*?```/g, function (block) {
        return block
          .replace(/^```[^\n]*\n?/, "")
          .replace(/\n?```$/, "");
      })
      .replace(/`([^`]+)`/g, "$1")
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/\*([^*]+)\*/g, "$1")
      .replace(/^\s{0,3}#{1,6}\s+/gm, "")
      .replace(/^\s*[-*]\s+/gm, "")
      .replace(/\[(.*?)\]\((.*?)\)/g, "$1")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  function parseWordEntries(document) {
    if (!document.rawContent || document.permalink !== "/reference/words/") {
      return [];
    }

    var lines = document.rawContent.split(/\r?\n/);
    var entries = [];
    var section = "";
    var subsection = "";
    var i = 0;

    while (i < lines.length) {
      var line = lines[i].trim();

      if (/^##\s+/.test(line)) {
        section = line.replace(/^##\s+/, "").trim();
        subsection = "";
        i += 1;
        continue;
      }

      if (/^###\s+/.test(line)) {
        subsection = line.replace(/^###\s+/, "").trim();
        i += 1;
        continue;
      }

      var signatureMatch = line.match(/^\*\*`(.+?)`\*\*\s+\*\((.+?)\)\*\s+`(.+?)`$/);

      if (!signatureMatch) {
        i += 1;
        continue;
      }

      var name = signatureMatch[1].trim();
      var badge = signatureMatch[2].trim();
      var stack = signatureMatch[3].trim();
      var block = [line];
      var description = [];
      var definition = [];
      var example = [];

      i += 1;

      while (i < lines.length) {
        var nextLine = lines[i];
        var trimmed = nextLine.trim();

        if (
          /^##\s+/.test(trimmed) ||
          /^###\s+/.test(trimmed) ||
          /^---\s*$/.test(trimmed) ||
          /^\*\*`(.+?)`\*\*\s+\*\((.+?)\)\*\s+`(.+?)`$/.test(trimmed)
        ) {
          break;
        }

        block.push(nextLine);

        if (trimmed === "**Definition**") {
          i += 1;
          while (i < lines.length) {
            var definitionLine = lines[i];
            var definitionTrimmed = definitionLine.trim();
            if (/^\s*```/.test(definitionTrimmed)) {
              block.push(definitionLine);
              i += 1;
              while (i < lines.length) {
                var fenceLine = lines[i];
                block.push(fenceLine);
                if (/^\s*```/.test(fenceLine.trim())) {
                  i += 1;
                  break;
                }
                definition.push(fenceLine);
                i += 1;
              }
              break;
            }
            if (definitionTrimmed) {
              definition.push(definitionLine);
            }
            i += 1;
          }
          continue;
        }

        if (trimmed === "**Example**") {
          i += 1;
          while (i < lines.length) {
            var exampleLine = lines[i];
            var exampleTrimmed = exampleLine.trim();
            if (/^\s*```/.test(exampleTrimmed)) {
              block.push(exampleLine);
              i += 1;
              while (i < lines.length) {
                var exampleFenceLine = lines[i];
                block.push(exampleFenceLine);
                if (/^\s*```/.test(exampleFenceLine.trim())) {
                  i += 1;
                  break;
                }
                example.push(exampleFenceLine);
                i += 1;
              }
              break;
            }
            if (exampleTrimmed) {
              example.push(exampleLine);
            }
            i += 1;
          }
          continue;
        }

        if (trimmed) {
          description.push(nextLine);
        }

        i += 1;
      }

      var detail = [];
      if (stack) detail.push(stack);
      if (badge) detail.push(badge);

      var location = makeLocation([document.section, document.title, section, subsection]);
      var summaryParts = [];

      if (description.length) {
        summaryParts.push(stripMarkdown(description.join(" ").trim()));
      }
      if (definition.length) {
        summaryParts.push("Definition: " + stripMarkdown(definition.join(" ").trim()));
      }
      if (example.length) {
        summaryParts.push("Example: " + stripMarkdown(example.join(" ").trim()));
      }

      entries.push({
        title: name,
        section: location,
        location: location,
        parentTitle: document.title,
        permalink: document.permalink + "#" + slugify(name),
        summary: summaryParts.join(" "),
        content: stripMarkdown(block.join("\n")),
        detail: detail.join("  "),
        kind: "word",
        titleNorm: normalize(name),
        sectionNorm: normalize(location),
        summaryNorm: normalize(summaryParts.join(" ")),
        contentNorm: normalize(stripMarkdown(block.join("\n"))),
        parentTitleNorm: normalize(document.title),
        detailNorm: normalize(detail.join(" "))
      });

      if (lines[i] && /^---\s*$/.test(lines[i].trim())) {
        i += 1;
      }
    }

    return entries;
  }

  function parseMarkdownSections(document) {
    if (!document.rawContent || document.permalink === "/reference/words/") {
      return [];
    }

    var lines = document.rawContent.split(/\r?\n/);
    var sections = [];
    var current = null;

    function flushCurrent() {
      if (!current) return;

      var content = stripMarkdown(current.body.join("\n"));
      if (!content) {
        current = null;
        return;
      }

      var location = makeLocation([document.section, document.title, current.heading]);

      sections.push({
        title: current.heading,
        section: location,
        location: location,
        parentTitle: document.title,
        permalink: document.permalink + "#" + slugify(current.heading),
        summary: content,
        content: content,
        detail: document.title,
        kind: "section",
        titleNorm: normalize(current.heading),
        sectionNorm: normalize(location),
        summaryNorm: normalize(content),
        contentNorm: normalize(content),
        parentTitleNorm: normalize(document.title),
        detailNorm: normalize(document.title)
      });

      current = null;
    }

    lines.forEach(function (line) {
      var trimmed = line.trim();
      var headingMatch = trimmed.match(/^##\s+(.+?)\s*$/);

      if (headingMatch) {
        flushCurrent();
        current = {
          heading: headingMatch[1].trim(),
          body: []
        };
        return;
      }

      if (current) {
        current.body.push(line);
      }
    });

    flushCurrent();

    return sections;
  }

  function hydratePageDocument(document) {
    var location = makeLocation([document.section, document.title]);

    return {
      title: document.title,
      section: location,
      location: location,
      parentTitle: document.title,
      permalink: document.permalink,
      summary: document.summary || "",
      content: document.content || "",
      detail: document.section,
      kind: "page",
      titleNorm: normalize(document.title),
      sectionNorm: normalize(location),
      summaryNorm: normalize(document.summary),
      contentNorm: normalize(document.content),
      parentTitleNorm: normalize(document.title),
      detailNorm: normalize(document.section)
    };
  }

  function hydrateDocuments(rawDocuments) {
    return rawDocuments.reduce(function (allDocuments, document) {
      var pageDocument = hydratePageDocument(document);
      var sectionDocuments = parseMarkdownSections(document);
      var wordDocuments = parseWordEntries(document);

      if (wordDocuments.length) {
        allDocuments.push.apply(allDocuments, wordDocuments);
      }

      if (sectionDocuments.length) {
        allDocuments.push.apply(allDocuments, sectionDocuments);
      }

      allDocuments.push(pageDocument);
      return allDocuments;
    }, []);
  }

  function scoreDocument(document, tokens, query) {
    var score = 0;
    var titleMatches = 0;
    var bodyMatches = 0;
    var titleFuzzy = fuzzyTitleScore(document.titleNorm, query);

    if (!tokens.length) return 0;

    if (document.titleNorm === query) score += 900;
    if (document.titleNorm.indexOf(query) === 0) score += 340;
    if (document.titleNorm.indexOf(query) !== -1) score += 190;
    if (document.sectionNorm.indexOf(query) !== -1) score += 70;
    if (document.parentTitleNorm.indexOf(query) !== -1) score += 40;
    if (document.detailNorm.indexOf(query) !== -1) score += 48;

    score += titleFuzzy;

    tokens.forEach(function (token) {
      if (document.titleNorm.indexOf(token) !== -1) {
        score += 96;
        titleMatches += 1;
      }
      if (document.detailNorm.indexOf(token) !== -1) {
        score += 42;
      }
      if (document.sectionNorm.indexOf(token) !== -1) {
        score += 28;
      }
      if (document.summaryNorm.indexOf(token) !== -1) {
        score += 28;
        bodyMatches += 1;
      }
      if (document.contentNorm.indexOf(token) !== -1) {
        score += 12;
        bodyMatches += 1;
      }
    });

    if (!titleMatches && !bodyMatches && !titleFuzzy) {
      return 0;
    }

    if (document.kind === "word") score += 56;
    if (document.kind === "section") score += 20;

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
      return source.length > 160 ? source.slice(0, 157).trim() + "..." : source;
    }

    var start = Math.max(0, matchIndex - 54);
    var end = Math.min(source.length, matchIndex + 116);
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
      var detail = document.createElement("p");
      var snippet = document.createElement("p");

      item.className = "search-result-item";
      link.className = "search-result-link";
      link.href = match.permalink;

      meta.className = "search-result-meta";
      meta.textContent = match.location || match.section;

      title.className = "search-result-title";
      title.textContent = match.title;

      detail.className = "search-result-detail";
      detail.textContent = match.detail || match.parentTitle || "";

      snippet.className = "search-result-snippet";
      snippet.textContent = createSnippet(match, tokens);

      link.appendChild(meta);
      link.appendChild(title);
      if (detail.textContent) {
        link.appendChild(detail);
      }
      link.appendChild(snippet);
      item.appendChild(link);
      resultsNode.appendChild(item);
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
      var seenPermalinks = Object.create(null);

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
          if (right.score !== left.score) {
            return right.score - left.score;
          }
          return left.document.title.localeCompare(right.document.title);
        })
        .filter(function (entry) {
          if (seenPermalinks[entry.document.permalink]) {
            return false;
          }
          seenPermalinks[entry.document.permalink] = true;
          return true;
        })
        .slice(0, 16)
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

  resultsNode.addEventListener("click", function (event) {
    var link = event.target.closest("a");
    if (link) {
      closeSearch();
    }
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

  window.addEventListener("hashchange", function () {
    if (active) closeSearch();
  });

  input.addEventListener("input", runSearch);
})();

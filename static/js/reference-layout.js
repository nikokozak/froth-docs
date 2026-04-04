(function () {
  function slugify(value) {
    return (value || "")
      .toLowerCase()
      .trim()
      .replace(/[`']/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function normalize(value) {
    return (value || "")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();
  }

  function textContent(node) {
    return (node && node.textContent ? node.textContent : "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function pluralize(count, noun) {
    return count + " " + noun + (count === 1 ? "" : "s");
  }

  function createNode(tagName, className, text) {
    var node = document.createElement(tagName);
    if (className) node.className = className;
    if (typeof text === "string") node.textContent = text;
    return node;
  }

  function ensureId(node, fallback, seenIds) {
    var base = node.id || slugify(fallback);
    if (!base) return "";

    if (!seenIds[base]) {
      seenIds[base] = 1;
      if (!node.id) node.id = base;
      return base;
    }

    if (node.id) {
      return node.id;
    }

    seenIds[base] += 1;
    node.id = base + "-" + seenIds[base];
    return node.id;
  }

  function wrapTables(root) {
    root.querySelectorAll("table").forEach(function (table) {
      if (table.parentElement && table.parentElement.classList.contains("ref-table-wrap")) {
        return;
      }
      var wrap = document.createElement("div");
      wrap.className = "ref-table-wrap";
      table.parentNode.insertBefore(wrap, table);
      wrap.appendChild(table);
    });
  }

  function groupWordEntries(root) {
    if (!root.closest(".page-words")) return;

    var content = root.querySelector(".content");
    if (!content) return;

    var children = Array.from(content.children);
    var current = null;
    var seenEntryIds = Object.create(null);
    var seenHeadingIds = Object.create(null);
    var currentSection = "";
    var currentSubsection = "";

    function isSignature(node) {
      return (
        node.tagName === "P" &&
        node.firstElementChild &&
        node.firstElementChild.tagName === "STRONG" &&
        node.firstElementChild.firstElementChild &&
        node.firstElementChild.firstElementChild.tagName === "CODE"
      );
    }

    function closesEntry(node) {
      return /^(H2|H3|HR)$/.test(node.tagName);
    }

    children.forEach(function (node) {
      if (node.tagName === "H2") {
        current = null;
        currentSection = textContent(node);
        currentSubsection = "";
        ensureId(node, currentSection, seenHeadingIds);
        return;
      }

      if (node.tagName === "H3") {
        current = null;
        currentSubsection = textContent(node);
        ensureId(node, currentSection + " " + currentSubsection, seenHeadingIds);
        return;
      }

      if (closesEntry(node)) {
        current = null;
        return;
      }

      if (isSignature(node)) {
        current = document.createElement("section");
        current.className = "ref-entry";
        current.dataset.sectionTitle = currentSection;
        current.dataset.subsectionTitle = currentSubsection;
        node.parentNode.insertBefore(current, node);
        current.appendChild(node);
        node.classList.add("ref-entry-signature");

        var wordCode = node.querySelector("strong code");
        var slug = wordCode ? slugify(wordCode.textContent) : "";

        if (slug) {
          if (seenEntryIds[slug]) {
            seenEntryIds[slug] += 1;
            slug += "-" + seenEntryIds[slug];
          } else {
            seenEntryIds[slug] = 1;
          }

          current.id = slug;
        }

        var badge = node.querySelector("em");
        if (badge) {
          badge.classList.add("ref-entry-badge");
          badge.textContent = badge.textContent.replace(/[()]/g, "").trim();
        }

        return;
      }

      if (current) {
        current.appendChild(node);

        if (node.tagName === "P" && node.textContent) {
          var label = node.textContent.trim();

          if (label === "Example" || label === "Definition") {
            node.remove();
          }
        }
      }
    });
  }

  function extractEntryMeta(entry) {
    var signature = entry.querySelector(".ref-entry-signature");
    if (!signature) return null;

    var nameNode = signature.querySelector("strong code");
    var badgeNode = signature.querySelector(".ref-entry-badge");
    var stackNode = Array.from(signature.children).filter(function (child) {
      return child.tagName === "CODE";
    }).pop();

    var summary = "";
    Array.from(entry.children).some(function (child) {
      if (child.tagName !== "P" || child.classList.contains("ref-entry-signature")) {
        return false;
      }

      summary = textContent(child);
      return !!summary;
    });

    return {
      id: entry.id,
      name: textContent(nameNode),
      kind: textContent(badgeNode),
      stack: textContent(stackNode),
      summary: summary,
      node: entry,
      item: null,
      visible: true
    };
  }

  function buildWordBrowser(root) {
    if (!root.closest(".page-words")) return;

    var content = root.querySelector(".content");
    if (!content || content.querySelector("[data-words-browser]")) return;

    var firstSectionHeading = content.querySelector("h2");
    if (!firstSectionHeading) return;

    var seenHeadingIds = Object.create(null);
    var sections = [];
    var entries = [];
    var currentSection = null;
    var currentGroup = null;

    Array.from(content.children).forEach(function (node) {
      if (node.tagName === "H2") {
        currentSection = {
          title: textContent(node),
          id: ensureId(node, textContent(node), seenHeadingIds),
          heading: node,
          groups: [],
          count: 0,
          jump: null,
          card: null,
          countNode: null
        };
        currentGroup = {
          title: "",
          id: "",
          heading: null,
          entries: [],
          bucket: null,
          countNode: null
        };
        currentSection.groups.push(currentGroup);
        sections.push(currentSection);
        return;
      }

      if (node.tagName === "H3") {
        if (!currentSection) return;

        currentGroup = {
          title: textContent(node),
          id: ensureId(node, currentSection.title + " " + textContent(node), seenHeadingIds),
          heading: node,
          entries: [],
          bucket: null,
          countNode: null
        };
        currentSection.groups.push(currentGroup);
        return;
      }

      if (node.classList && node.classList.contains("ref-entry")) {
        if (!currentSection) return;

        var meta = extractEntryMeta(node);
        if (!meta) return;

        meta.section = currentSection;
        meta.group = currentGroup || currentSection.groups[0];
        meta.searchText = normalize([
          meta.name,
          meta.kind,
          meta.stack,
          meta.summary,
          currentSection.title,
          meta.group.title
        ].join(" "));

        meta.group.entries.push(meta);
        currentSection.count += 1;
        entries.push(meta);
      }
    });

    sections = sections.filter(function (section) {
      return section.count > 0;
    });

    if (!sections.length) return;

    content.classList.add("words-detail-content");

    var browser = createNode("section", "words-browser");
    browser.setAttribute("data-words-browser", "true");

    var shell = createNode("div", "words-browser-shell");
    browser.appendChild(shell);

    var toolbar = createNode("div", "words-browser-toolbar");
    shell.appendChild(toolbar);

    var field = createNode("label", "words-browser-filter");
    field.setAttribute("for", "words-filter");
    toolbar.appendChild(field);
    field.appendChild(createNode("span", "words-browser-filter-label", "Filter this reference"));

    var input = document.createElement("input");
    input.id = "words-filter";
    input.type = "search";
    input.autocomplete = "off";
    input.spellcheck = false;
    input.placeholder = "Search by word, section, stack effect, or description";
    field.appendChild(input);

    var controls = createNode("div", "words-browser-toolbar-meta");
    toolbar.appendChild(controls);

    var status = createNode("p", "words-browser-status", pluralize(entries.length, "word") + " shown");
    status.setAttribute("aria-live", "polite");
    controls.appendChild(status);

    var clearButton = createNode("button", "words-browser-clear", "Clear");
    clearButton.type = "button";
    clearButton.disabled = true;
    controls.appendChild(clearButton);

    var jumps = createNode("nav", "words-browser-jumps");
    jumps.setAttribute("aria-label", "Word reference sections");
    shell.appendChild(jumps);

    var catalog = createNode("div", "words-browser-catalog");
    shell.appendChild(catalog);

    var emptyState = createNode("div", "words-browser-empty is-hidden");
    emptyState.appendChild(createNode("h3", "", "No matching words"));
    emptyState.appendChild(
      createNode(
        "p",
        "",
        "Try a broader term or clear the filter to scan the full vocabulary again."
      )
    );
    shell.appendChild(emptyState);

    sections.forEach(function (section) {
      var jump = createNode("a", "words-browser-jump");
      jump.href = "#browse-" + section.id;
      jump.appendChild(createNode("span", "words-browser-jump-label", section.title));
      jump.appendChild(createNode("span", "words-browser-jump-count", pluralize(section.count, "word")));
      jumps.appendChild(jump);
      section.jump = jump;

      var card = createNode("section", "words-browser-section");
      card.id = "browse-" + section.id;
      catalog.appendChild(card);
      section.card = card;

      var cardHeader = createNode("div", "words-browser-section-head");
      card.appendChild(cardHeader);

      var title = createNode("h3", "words-browser-section-title");
      cardHeader.appendChild(title);

      var titleLink = createNode("a", "", section.title);
      titleLink.href = "#" + section.id;
      title.appendChild(titleLink);

      section.countNode = createNode("span", "words-browser-section-count", pluralize(section.count, "word"));
      cardHeader.appendChild(section.countNode);

      section.groups
        .filter(function (group) {
          return group.entries.length > 0;
        })
        .forEach(function (group) {
          var bucket = createNode("div", "words-browser-group");
          card.appendChild(bucket);
          group.bucket = bucket;

          if (group.title) {
            var groupHeader = createNode("div", "words-browser-group-head");
            bucket.appendChild(groupHeader);
            groupHeader.appendChild(createNode("h4", "words-browser-group-title", group.title));
            group.countNode = createNode("span", "words-browser-group-count", pluralize(group.entries.length, "word"));
            groupHeader.appendChild(group.countNode);
          }

          var list = createNode("ul", "words-browser-list");
          bucket.appendChild(list);

          group.entries.forEach(function (meta) {
            var itemWrap = createNode("li", "words-browser-item-wrap");
            list.appendChild(itemWrap);

            var item = createNode("a", "words-browser-item");
            item.href = "#" + meta.id;
            itemWrap.appendChild(item);
            meta.item = itemWrap;

            var itemHeader = createNode("div", "words-browser-item-head");
            item.appendChild(itemHeader);

            var word = createNode("div", "words-browser-word");
            itemHeader.appendChild(word);

            var code = createNode("code", "words-browser-word-name", meta.name);
            word.appendChild(code);

            if (meta.kind) {
              word.appendChild(createNode("span", "words-browser-word-kind", meta.kind));
            }

            if (meta.stack) {
              itemHeader.appendChild(createNode("code", "words-browser-stack", meta.stack));
            }

            if (meta.summary) {
              item.appendChild(createNode("p", "words-browser-summary", meta.summary));
            }
          });
        });
    });

    function applyFilter() {
      var terms = normalize(input.value).split(" ").filter(Boolean);
      var visibleCount = 0;

      entries.forEach(function (meta) {
        var visible = !terms.length || terms.every(function (term) {
          return meta.searchText.indexOf(term) !== -1;
        });

        meta.visible = visible;
        meta.node.classList.toggle("is-hidden", !visible);
        if (meta.item) meta.item.classList.toggle("is-hidden", !visible);

        if (visible) visibleCount += 1;
      });

      sections.forEach(function (section) {
        var visibleInSection = 0;
        var sectionVisible = false;

        section.groups.forEach(function (group) {
          var visibleInGroup = group.entries.filter(function (meta) {
            return meta.visible;
          }).length;

          if (group.bucket) {
            group.bucket.classList.toggle("is-hidden", visibleInGroup === 0);
          }

          if (group.heading) {
            group.heading.classList.toggle("is-hidden", visibleInGroup === 0);
          }

          if (group.countNode) {
            group.countNode.textContent = pluralize(visibleInGroup, "word");
          }

          visibleInSection += visibleInGroup;
          if (visibleInGroup > 0) sectionVisible = true;
        });

        section.card.classList.toggle("is-hidden", !sectionVisible);
        section.jump.classList.toggle("is-hidden", !sectionVisible);
        section.heading.classList.toggle("is-hidden", !sectionVisible);
        section.countNode.textContent = pluralize(visibleInSection, "word");
      });

      clearButton.disabled = terms.length === 0;
      status.textContent = terms.length
        ? visibleCount + " of " + entries.length + " words shown"
        : pluralize(entries.length, "word") + " shown";
      emptyState.classList.toggle("is-hidden", visibleCount !== 0);
    }

    clearButton.addEventListener("click", function () {
      input.value = "";
      input.focus();
      applyFilter();
    });

    input.addEventListener("input", applyFilter);

    content.insertBefore(browser, firstSectionHeading);
    applyFilter();
  }

  document.querySelectorAll(".reference-page").forEach(function (page) {
    wrapTables(page);
    groupWordEntries(page);
    buildWordBrowser(page);
  });
})();

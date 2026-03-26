(function () {
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
      if (closesEntry(node)) {
        current = null;
        return;
      }

      if (isSignature(node)) {
        current = document.createElement("section");
        current.className = "ref-entry";
        node.parentNode.insertBefore(current, node);
        current.appendChild(node);
        node.classList.add("ref-entry-signature");
        return;
      }

      if (current) {
        current.appendChild(node);

        if (
          node.tagName === "P" &&
          node.textContent &&
          (node.textContent.trim() === "Definition" || node.textContent.trim() === "Example")
        ) {
          node.classList.add("ref-block-label");
        }
      }
    });
  }

  document.querySelectorAll(".reference-page").forEach(function (page) {
    wrapTables(page);
    groupWordEntries(page);
  });
})();

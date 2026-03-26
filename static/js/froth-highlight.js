(function () {
  var BUILTINS = new Set([
    "dangerous-reset", "restore", "release", "negate", "invert", "lshift", "rshift",
    "choose", "catch", "throw", "times", "while", "words", "emit", "key?", "keep",
    "call", "drop", "over", "swap", "tuck", "dup", "rot", "-rot", "nip", "dip",
    "set", "pat", "perm", "mark", "save", "wipe", "def", "get", "and", "xor",
    "abs", "key", "cr", "if", "bi", "or", "see", "info", "s.emit", "s.len", "s@",
    "s.=", "s.keep", "q.len", "q@", "/mod", ".s", ".", "+", "-", "*", "<", ">",
    "=", ">r", "r>", "r@"
  ]);

  function escapeHtml(value) {
    return value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function isBoundary(source, index) {
    return index === 0 || /\s/.test(source[index - 1]);
  }

  function scanWord(source, index) {
    var end = index;
    while (end < source.length && !/[\s\[\]"';]/.test(source[end])) {
      end += 1;
    }
    return source.slice(index, end);
  }

  function readString(source, index) {
    var end = index + 1;
    while (end < source.length) {
      if (source[end] === "\\") {
        end += 2;
        continue;
      }
      if (source[end] === "\"") {
        end += 1;
        break;
      }
      end += 1;
    }
    return end;
  }

  function readBlockComment(source, index) {
    var depth = 1;
    var end = index + 1;
    while (end < source.length && depth > 0) {
      if ((end === 0 || /\s/.test(source[end - 1])) && source[end] === "(") {
        depth += 1;
      } else if (source[end] === ")") {
        depth -= 1;
      }
      end += 1;
    }
    return end;
  }

  function readLineComment(source, index) {
    var end = index;
    while (end < source.length && source[end] !== "\n") {
      end += 1;
    }
    return end;
  }

  function wrap(className, value) {
    return '<span class="' + className + '">' + escapeHtml(value) + "</span>";
  }

  function highlightFroth(source) {
    var output = [];
    var index = 0;

    while (index < source.length) {
      if (source[index] === "\n") {
        output.push("\n");
        index += 1;
        continue;
      }

      if (isBoundary(source, index) && source[index] === "\\" && source[index + 1] === " ") {
        var commentEnd = readLineComment(source, index);
        output.push(wrap("tok-comment", source.slice(index, commentEnd)));
        index = commentEnd;
        continue;
      }

      if (isBoundary(source, index) && source[index] === "(") {
        var blockEnd = readBlockComment(source, index);
        output.push(wrap("tok-comment", source.slice(index, blockEnd)));
        index = blockEnd;
        continue;
      }

      if (source[index] === "\"") {
        var stringEnd = readString(source, index);
        output.push(wrap("tok-string", source.slice(index, stringEnd)));
        index = stringEnd;
        continue;
      }

      if (isBoundary(source, index) && source[index] === ":" && /\s/.test(source[index + 1] || "")) {
        output.push(wrap("tok-keyword", ":"));
        index += 1;

        while (index < source.length && /\s/.test(source[index]) && source[index] !== "\n") {
          output.push(escapeHtml(source[index]));
          index += 1;
        }

        var functionName = scanWord(source, index);
        if (functionName) {
          output.push(wrap("tok-function", functionName));
          index += functionName.length;
          continue;
        }
      }

      if (isBoundary(source, index) && source[index] === ";" && (!source[index + 1] || /\s/.test(source[index + 1]))) {
        output.push(wrap("tok-keyword", ";"));
        index += 1;
        continue;
      }

      if (isBoundary(source, index) && source[index] === "'") {
        var ticked = scanWord(source, index + 1);
        if (ticked) {
          output.push(wrap("tok-tick", "'"));
          output.push(wrap("tok-variable", ticked));
          index += ticked.length + 1;
          continue;
        }
      }

      if (isBoundary(source, index) && source.slice(index, index + 2) === "p[") {
        output.push(wrap("tok-bracket", "p["));
        index += 2;
        continue;
      }

      if (source[index] === "[" || source[index] === "]") {
        output.push(wrap("tok-bracket", source[index]));
        index += 1;
        continue;
      }

      if (isBoundary(source, index)) {
        var number = source.slice(index).match(/^-?(?:0x[0-9A-Fa-f]+|0b[01]+|\d+)(?!\S)/);
        if (number) {
          output.push(wrap("tok-number", number[0]));
          index += number[0].length;
          continue;
        }

        var word = scanWord(source, index);
        if (word && BUILTINS.has(word)) {
          output.push(wrap("tok-builtin", word));
          index += word.length;
          continue;
        }
      }

      output.push(escapeHtml(source[index]));
      index += 1;
    }

    return output.join("");
  }

  document.querySelectorAll("pre code.language-froth").forEach(function (node) {
    node.innerHTML = highlightFroth(node.textContent || "");
  });
})();

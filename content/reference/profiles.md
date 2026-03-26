---
title: "Profiles Reference"
weight: 2
---

A profile is an optional language extension. Profiles add syntax, semantics, or words without changing the core language. Each profile is activated per-file with a declaration at the top:

```froth
#profile FROTH-Named
```

Words defined before the declaration do not have access to the profile's features. Words defined after do.

Profiles exist to keep the core runtime small. On a microcontroller with 8–64 KB of RAM, the difference between including and excluding a profile matters. Include what the application needs; leave out the rest.

---

## FROTH-Core

**Status:** Mandatory. Always present.

The minimum runtime: data stack, return stack, heap allocator, slot table, and the core primitives. Every other profile depends on FROTH-Core.

**What it provides:**
- Stack primitives: `perm`, `call`, `choose`
- Pattern syntax: `p[...]`
- Arithmetic: `+`, `-`, `*`, `/mod`
- Comparisons: `<`, `>`, `=`
- Bitwise: `and`, `or`, `xor`, `invert`, `lshift`, `rshift`
- Quotation introspection: `q.len`, `q@`, `q.pack`
- Definition system: `def`, `get`
- Error handling: `throw`, `catch`
- I/O primitives: `emit`, `key`, `key?`
- Memory: `mark`, `release`
- Introspection: `.`, `.s`, `words`, `see`, `info`
- System: `dangerous-reset`

**Dependencies:** None.

---

## FROTH-Base

**Status:** Mandatory. Always loaded after FROTH-Core.

The standard library written in Froth itself. Defines every conventional stack word, control-flow combinator, and utility built on top of the FROTH-Core primitives.

**What it provides:**
- Stack shuffle words: `dup`, `swap`, `drop`, `over`, `rot`, `-rot`, `nip`, `tuck`
- Arithmetic stdlib: `negate`, `abs`
- Control flow: `if`, `when`, `while` (wraps the primitive)
- Combinators: `dip`, `keep`, `bi`, `times`, `set`
- I/O stdlib: `cr`

Readers of `core.froth` can see every definition. All words are plain Froth; no hidden C behind them.

**Dependencies:** FROTH-Core.

---

## FROTH-Named

**Status:** Optional.

Activates named stack bindings. When FROTH-Named is active, the names in a word's stack-effect comment become live variables inside the word's body. Each name, when used as a word, pushes its bound value onto the stack.

**What it adds:**
- Stack-effect comment names become bindings scoped to the word definition.
- Binding order matches `perm` label convention: the last name in the input list is TOS, the first is deepest.
- Named bindings work alongside explicit `perm` expressions; the two styles are freely mixed.

**When to use:** Words that consume the same input more than once, or words with several inputs where tracking positions by label (`a`, `b`, `c`) becomes unwieldy. See the perm-vs-Named heuristic in the guide.

**Example:**
```froth
#profile FROTH-Named
: hyp-squared ( a b -- n )
  a a * b b * + ;
```

**Dependencies:** FROTH-Core, FROTH-Base.

---

## FROTH-Checked

**Status:** Optional.

Adds runtime arity checking. When FROTH-Checked is active, calling a word with fewer stack values than its declared arity throws an error before the word body executes. Arity is declared with `arity!` or inferred from the stack-effect comment.

**What it adds:**
- Stack-depth guard at each word call.
- `arity!` primitive for manual arity annotation.
- Clearer error messages on stack underflow: the error identifies the word that required more than was available.

**When to use:** Development and debugging, especially when learning. On production firmware with constrained RAM, consider removing FROTH-Checked from the build; the guards add overhead per call.

**Dependencies:** FROTH-Core, FROTH-Base.

---

## FROTH-Region

**Status:** Optional.

Extends the memory model with explicit region management beyond the basic `mark` / `release` pair. Provides named regions, region handles as first-class values, and region scope annotations.

**What it adds:**
- Named region creation and lookup.
- Region handles that can be stored in slots and passed to words.
- Utilities for checking which region an allocation belongs to.

**When to use:** Long-running programs with multiple lifetime zones — e.g., a device that allocates per-connection state and needs to free it cleanly when the connection ends.

**Dependencies:** FROTH-Core.

---

## FROTH-Region-Strict

**Status:** Optional.

Extends FROTH-Region with use-after-free detection. References to memory in a released region are validated at access time; a detected violation throws a Froth error rather than producing undefined behavior.

**What it adds:**
- Region generation counter; all live references carry the generation at allocation time.
- Access words validate generation before dereferencing.
- Significant runtime overhead compared to FROTH-Region alone.

**When to use:** Debugging memory lifetime bugs. Not suitable for production firmware where access performance matters.

**Dependencies:** FROTH-Core, FROTH-Region.

---

## FROTH-String-Lite

**Status:** Optional.

Minimal string support: string literals, printing, length, and byte access. No comparison, no construction from runtime data.

**What it adds:**
- String literal syntax: `"..."` pushes a StringRef.
- `s.emit ( s -- )`: print a string.
- `s.len ( s -- n )`: string byte length.
- `s@ ( s i -- n )`: byte access by index.

**When to use:** Targets with very limited flash where full string support is too large, but print output using string literals is needed.

**Dependencies:** FROTH-Core.

---

## FROTH-String

**Status:** Optional.

Full string support. Superset of FROTH-String-Lite.

**What it adds:** Everything in FROTH-String-Lite, plus:
- `s.= ( s1 s2 -- flag )`: byte-for-byte string equality.
- Additional string utilities (verify current set against implementation).

**When to use:** Any target where string comparison or string-based dispatch is needed. The most common string profile for general embedded use.

**Dependencies:** FROTH-Core, FROTH-String-Lite.

---

## FROTH-REPL

**Status:** Optional. Included in standard board builds; may be excluded from headless deployments.

The interactive REPL — input parsing, word lookup by name, error reporting, and the prompt loop.

**What it adds:**
- Token scanner and word parser.
- Numeric literal parser.
- The `froth>` prompt and response cycle.
- Error recovery: on uncaught throw, prints the error and returns to the prompt.
- Introspection integration: `words`, `see`, `info` produce human-readable output.

**When to use:** Any build where a developer needs to interact with the device over serial. Exclude from production headless builds to reclaim the parser and prompt overhead.

**Dependencies:** FROTH-Core, FROTH-Base.

---

## FROTH-Stdlib

**Status:** Optional (recommended). Meta-profile that activates the full standard library combination.

Enabling FROTH-Stdlib is equivalent to enabling FROTH-Base plus the optional stdlib extensions that are considered standard for general-purpose use.

**What it adds:** The combined word set of FROTH-Base plus additional combinators and utility words not included in the mandatory base.

**When to use:** General-purpose development where the application is not severely constrained. If uncertain, start with FROTH-Stdlib and remove profiles during a size-reduction pass.

**Dependencies:** FROTH-Core, FROTH-Base.

---

## FROTH-Perf

**Status:** Optional.

Enables performance-oriented variants of core operations. On targets that support it, substitutes C-inline implementations for hot paths that are otherwise compiled from Froth bytecode.

**What it adds:**
- Faster dispatch for frequently used words.
- Optional inlining annotations that the compiler can act on.
- No new words; no semantic changes. Code that works without FROTH-Perf works identically with it.

**When to use:** Production firmware after correctness is established, on targets where interpreter throughput is the bottleneck. Profile first; FROTH-Perf has no effect on memory-bound or I/O-bound programs.

**Dependencies:** FROTH-Core. Target support varies; check the board build configuration.

---

## FROTH-Addr

**Status:** Optional.

Exposes direct memory address access and the return stack access words. Required for low-level hardware drivers and for words that manipulate the return stack intentionally.

**What it adds:**
- `>r ( a -- ) ( R: -- a )`: push data stack value to return stack.
- `r> ( -- a ) ( R: a -- )`: pop return stack value to data stack.
- `r@ ( -- a ) ( R: a -- a )`: copy return stack top to data stack.
- Memory read/write at raw addresses (verify current word names against implementation).

**When to use:** Board library code, hardware driver words, and any word that uses the return stack for temporary value storage (a common pattern in combinator implementations). Excluded from application code by default to prevent accidental return stack corruption.

**Dependencies:** FROTH-Core. Some features require platform support.

# What Makes Froth Different

Froth is not a Forth dialect. It inherits Forth's ideas about interactive hardware programming, postfix notation, and the stack. But its core semantics are different enough that code written for one will not run on the other. This page covers the design choices that distinguish Froth from Forth and from each other — intended for readers who already know Forth or who want a precise account of Froth's novel features before deciding whether it's worth their time.

---

## `perm`: one primitive to replace them all

**What Forth does:** Forth ships a vocabulary of stack shuffle words. `dup` copies the top value. `swap` reverses the top two. `rot` rotates the top three. `over` copies the second value to the top. `nip`, `tuck`, `2dup`, `2swap`, `2drop` — each one encodes a specific rearrangement, and you have to memorize which name does which thing.

The problem is not that these words are hard to understand one by one. The problem is that the set is arbitrary. There is no principled reason why Forth has `over` but not a word that copies the third-from-top value. Every rearrangement outside the predefined set requires building it from those primitives by hand, stacking shuffle operations whose interaction is hard to track mentally.

**What Froth does:** `perm` takes a count and a pattern. The count says how many values to consume from the stack. The pattern, written as `p[labels]`, describes what to push back. Labels are single lowercase letters: `a` is the top value consumed, `b` is the one below it, `c` the one below that. Labels can appear any number of times — including zero, which drops the value.

Every classic Forth shuffle word is defined this way in `core.froth`:

```froth
: dup  ( a -- a a )      1 p[a a] perm ;
: swap ( a b -- b a )    2 p[a b] perm ;
: drop ( a -- )          1 p[] perm ;
: over ( a b -- a b a )  2 p[b a b] perm ;
```

These are not compiler builtins with `perm` syntax bolted on. They are ordinary Froth words. `dup` works because `1 p[a a] perm` consumes one value and pushes two copies of it. `drop` works because `1 p[] perm` consumes one value and pushes nothing. Any rearrangement you need, including ones Forth has no word for, is a pattern.

**Why this matters:** The practical benefit is a smaller vocabulary to learn. But the design benefit runs deeper. Because every stack rearrangement is expressed through one operation with a well-defined structure, tooling can analyze `perm` patterns statically. Stack effect annotations become verifiable. The optimizer can see when two adjacent `perm` calls can be collapsed into one. Froth's ADR-012 describes the full design rationale and the pattern algebra that makes this work.

---

## Coherent redefinition via slots

**What Forth does:** Forth's dictionary is append-only. When you define a word, it becomes the current definition. When you redefine it, a new entry is appended. The old entry still exists; words compiled before the redefinition still point to the old entry. This is a deliberate design choice in Forth — it enables a kind of hygienic compilation — but it means that redefining a word during interactive development does not propagate to existing callers.

The failure mode is common and subtle: you discover a bug in a low-level word, fix it, and redefine it. Then you call a higher-level word that uses it, and see the old behavior. The higher-level word was compiled against the old definition. You have to recompile the entire dependency chain by retyping or reloading it.

**What Froth does:** Every word is a slot. A slot is a stable handle — an indirect reference rather than a direct address. When you define a word, the system creates a slot and binds the definition to it. When you redefine the word, the slot is updated in place. Every reference to that word — no matter when it was compiled — holds a reference to the slot, not to the definition. They all see the new definition immediately.

The consequences at the REPL are significant. Consider this sequence:

```froth
: A ( -- n )   42 ;
: B ( -- n )   A 1 + ;
B .          \ prints 43
: A ( -- n )   100 ;
B .          \ prints 101
```

The second call to `B` prints 101. When `A` was redefined, `B`'s slot reference to `A` started pointing to the new definition. There was no reload step, no recompilation of `B`. The change propagated automatically.

**Why this matters:** Coherent redefinition is what makes the REPL a genuine development environment rather than a toy. When you're iterating on hardware code, you want to change one word and immediately test its callers without managing dependency order. The slot table also enables the snapshot system (see below): persisting the slot table is sufficient to restore an entire session, because the slots are the semantic identity of words, not their addresses. ADR-006 covers the slot table design and the generation counter used to detect conflicts.

---

## Structured error handling with `catch` and `throw`

**What Forth does:** Standard Forth provides `ABORT` and `ABORT"` for signaling errors. An uncaught abort terminates the current computation and returns control to the top-level interpreter. On many embedded Forth systems, this means a hardware reset: the REPL session is gone, definitions are lost, and you start over. Even on implementations that don't reset, an uncaught error typically leaves the stack in an unknown state and the session unreliable.

The result is that error handling in Forth is defensive rather than structured. Programmers check preconditions manually and avoid calling words that might fail. Nested operations that might signal errors must be carefully orchestrated.

**What Froth does:** `throw` signals an error with a numeric code. `catch` wraps a quotation in error protection. If the quotation throws, `catch` intercepts it, restores the data stack to the state it had when `catch` was entered, and returns the error code. If the quotation completes normally, `catch` returns zero.

```froth
[ 1 0 /mod ] catch .   \ prints -10 (division by zero), REPL still alive
[ 3 4 + ] catch .      \ prints 0 (no error); 7 still on stack
```

The REPL itself is wrapped in a top-level `catch`. An unhandled error at the prompt prints the error code, restores the stack, and returns a fresh prompt. Your session, your definitions, your snapshot — none of it is affected. This is the behavior that makes exploratory development on hardware practical: you can make mistakes freely.

**Why this matters:** Error handling via `catch`/`throw` composes. An inner quotation can catch errors it knows how to handle and rethrow anything else. A hardware driver can catch timeout errors and return a sentinel value. The REPL can catch everything. Each layer handles what it can and passes the rest up. This is structurally different from Forth's abort model, where there is no partial recovery — an abort is terminal for the current context. ADR-015 covers the catch/throw semantics and stack restoration guarantees.

---

## Quotations as first-class values

**What Forth does:** Forth has execution tokens (XTs) — numeric handles to compiled words that can be passed as values and later executed with `EXECUTE`. This enables a limited form of higher-order programming. But XTs are addresses, not values: they point to compiled code, and manipulating them feels like C-style function pointers. Forth also has `COMPILE,` and friends for compile-time manipulation, but the run-time story is thin.

Anonymous code blocks require defining a named word somewhere, or using implementation-specific extensions.

**What Froth does:** A quotation is written as `[ ... ]`. When the interpreter encounters a quotation, it pushes the block onto the stack as a single value. Nothing is executed. The quotation is data until something consumes it.

`call` executes a quotation. `choose` selects between two values based on a flag. Together, `choose call` is conditional execution:

```froth
: if ( flag t f -- result )   choose call ;
```

This is the actual definition from `core.froth`. `if` is not a special form, not a compiler directive — it is an ordinary Froth word that takes a flag and two quotations and calls the right one. The definition is four tokens.

The standard combinators extend this further. `dip` calls a quotation while temporarily hiding the top value. `keep` calls a quotation and then restores the original value. `bi` applies two quotations to the same input. `times` calls a quotation N times. All of them are defined in `core.froth` as regular words, using `call` and stack operations. None require compiler magic.

**Why this matters:** First-class quotations let you pass behavior as data. A word that takes a quotation can apply it, repeat it, protect it under `catch`, or store it in a variable and call it later. This is higher-order programming within the stack model — no closures, no heap-allocated environments (a quotation is just a code reference plus, in the named-capture extension, a small binding frame). The model is simple enough to reason about, but expressive enough to define all of Froth's control flow in plain Froth.

---

## The profile system

Froth's features are organized into profiles. A profile is a named set of capabilities that can be activated per-file with a declaration at the top:

```froth
#profile FROTH-Named
```

Profiles exist for a concrete reason: Froth runs on microcontrollers where memory is measured in kilobytes. A device that only needs the base language should not pay for string handling or region-based allocation.

The defined profiles, from mandatory to optional:

- **FROTH-Core** — mandatory. The stack, arithmetic, comparisons, `perm`, quotations, `catch`/`throw`. Everything else builds on this.
- **FROTH-Base** — mandatory. Standard library words: shuffle aliases, combinators, `if`, `while`, `dip`, `keep`, `bi`, `times`.
- **FROTH-Named** — optional. Named stack bindings in word definitions. Stack-effect comment names become usable variables.
- **FROTH-Checked** — optional. Runtime stack-effect verification. Stack depths are checked at word boundaries against declared effects.
- **FROTH-Region / FROTH-Region-Strict** — optional. Region-based memory allocation with lexically scoped lifetimes.
- **FROTH-String-Lite / FROTH-String** — optional. String literals and string operations, in a lightweight or full variant.
- **FROTH-REPL** — optional. The interactive prompt, error reporter, and word listing tools.
- **FROTH-Stdlib** — optional. Extended numeric and collection utilities.
- **FROTH-Perf** — optional. Performance monitoring and timing instrumentation.
- **FROTH-Addr** — optional. Direct memory and address operations for low-level hardware access.

The formal guarantee is that profiles cannot change Core semantics. A word defined in FROTH-Core behaves identically whether or not any optional profile is active. Adding profiles does not break existing code; it only adds new capabilities.

**Why this matters:** This is a compatibility commitment, not just a configuration system. It means a library author can write code targeting FROTH-Core+Base and know it will run on any Froth implementation, no matter how minimal. Device firmware can include exactly the profiles it needs and nothing more. The profile list also makes the language's scope explicit: you can read the full profile manifest and understand every optional feature Froth ships.

---

## Snapshot persistence

Interactive development on a microcontroller has a structural problem: RAM is volatile. Every time the board loses power, the REPL session is gone. Traditional embedded development works around this by treating the device as a compile-once-flash target. Froth takes a different position.

A snapshot captures the current heap (word definitions, string literals, heap-allocated data) and the slot table (word name bindings) and writes them to flash. At boot, the snapshot is restored automatically before the REPL starts.

The workflow:

```
froth> : blink ( delay -- ) 1 LED_BUILTIN gpio.write dup ms 0 LED_BUILTIN gpio.write ms ;
froth> 500 blink
\ LED blinks once
froth> save
\ snapshot written to flash
```

Power cycle the board. The word `blink` is still there.

The snapshot system uses A/B rotation for atomic writes: two flash slots, alternating. If a write is interrupted by a power loss mid-write, the previous slot remains intact. The device will not boot into a corrupted state.

The `autorun` hook bridges the gap between development session and deployed device. Define a word named `autorun`, save a snapshot, and that word will be called on every subsequent boot before the REPL starts. A device with a saved `autorun` runs its program without any serial connection.

```froth
: autorun ( -- )
  1 LED_BUILTIN gpio.mode
  [ true ] [ 500 blink ] while ;
save
```

Unplug, replug. The LED blinks indefinitely. The REPL is still accessible if you connect over serial, but it does not need to be present.

**Why this matters:** Snapshots change what the REPL session *is*. Without persistence, the REPL is a scratch pad. With it, it's a development environment that produces deployable artifacts. The same session where you wrote and tuned your code becomes the deployed firmware. There's no separate build-and-flash step, because the snapshot *is* the firmware state. ADR-026 covers the snapshot format and the A/B rotation protocol.

---

## Modern tooling

Froth is designed to be tooled, not just typed. Three components form the tooling layer:

**The CLI** handles build configuration, firmware flashing, and board connection. `froth flash` writes the runtime to a connected device. `froth connect` opens a serial session. `froth run file.froth` uploads and executes a file. The CLI abstracts the ESP-IDF and RP2040 toolchains so you don't need to configure them directly.

**The VSCode extension** provides an integrated development environment with live code execution. You write Froth in the editor, send definitions to the board's REPL with a keystroke, and see the results inline. The extension understands Froth's word structure well enough to provide word completion and inline stack-effect display as you type. This is possible because Froth's syntax is regular and the slot model gives the extension a precise target to reflect.

**The daemon architecture** sits between the CLI/extension and the serial port. Rather than each tool managing its own serial connection — a common source of "port in use" errors in embedded development — a single background process holds the connection and multiplexes communication. The extension and CLI both talk to the daemon. You can flash a file from the CLI and continue using the REPL in the extension without disconnecting.

**Why this matters:** Most Forth systems assume the programmer will type directly into a serial terminal. This works, but it means every quality-of-life improvement — syntax highlighting, word completion, error messages with context, file-based workflows — requires custom tooling that almost never exists. Froth treats tooling as a first-class design concern. The daemon architecture, the structured error codes, the slot table's inspectability — these are not incidental properties. They were designed to support a real development environment.

---

## Outline notes

**For the writer:**

This page is aimed at thesis readers (audience 3) and Forth veterans (audience 4). The voice register is features-page: authoritative, direct, assumes programming language background, can reference Forth without apology.

Each section should begin with a concrete problem statement (what does Forth do and why is it insufficient?) before presenting Froth's answer. The "why this matters" angle at the end of each section is important — it connects the design choice to a practical consequence, preventing the page from reading like a feature checklist.

Key references to work into the text:
- ADR-006: slot table and coherent redefinition design
- ADR-012: `perm` design and pattern algebra
- ADR-015: `catch`/`throw` semantics
- ADR-026: snapshot format and persistence
- ADR-040: trampoline executor (relevant to the quotation model)

Avoid making comparisons beyond Forth. The audience for this page knows Forth. Comparisons to Python or C closures, etc., are out of register here.

Code examples should be exact. The `if`, `dup`, `swap`, `drop`, `over` definitions shown above are the real `core.froth` definitions and should be preserved as-is. The `autorun` example follows the pattern from `guide/09-snapshots-and-persistence.md` and is consistent with real API names.

The profile list should match the canonical spec listing exactly. The current list (FROTH-Core, FROTH-Base, FROTH-Named, FROTH-Checked, FROTH-Region, FROTH-Region-Strict, FROTH-String-Lite, FROTH-String, FROTH-REPL, FROTH-Stdlib, FROTH-Perf, FROTH-Addr) reflects the spec as of 2026-03-20 and should be verified against the reference before the page ships.

# Froth Website Content Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create the full content structure for the Froth website as .md files, with the homepage and opening guide chapter written in full, rich outlines for all other pages, and a voice guide governing the writing style.

**Architecture:** A flat-ish file tree with three content sections (guide/, reference/, tutorials/) plus standalone pages at the root. Working documents live in _internal/. The guide is a numbered book meant to be read front-to-back. Reference and tutorials are flat lookup/task-based sections. All writing follows a voice guide that defines three registers and an explicit anti-pattern list to prevent AI-sounding prose.

**Tech Stack:** Markdown files. The Froth language source lives at ../Froth and should be referenced for accurate code examples, word names, and feature descriptions.

**Spec:** `docs/superpowers/specs/2026-03-20-froth-website-content-structure-design.md`

---

## File Map

**New directories:**
- `guide/`
- `reference/`
- `tutorials/`
- `_internal/`

**Files to create (24 total):**

| File | Type | Task |
|---|---|---|
| `_internal/voice-guide.md` | Full working doc | 2 |
| `index.md` | Full content (replaces existing draft) | 3 |
| `guide/00-what-is-froth.md` | Full content | 4 |
| `guide/01-getting-started.md` | Rich outline | 5 |
| `guide/02-the-stack.md` | Rich outline | 5 |
| `guide/03-words-and-definitions.md` | Rich outline | 5 |
| `guide/04-perm-and-named.md` | Rich outline | 6 |
| `guide/05-quotations-and-control.md` | Rich outline | 6 |
| `guide/06-error-handling.md` | Rich outline | 6 |
| `guide/07-strings-and-io.md` | Rich outline | 7 |
| `guide/08-talking-to-hardware.md` | Rich outline | 7 |
| `guide/09-snapshots-and-persistence.md` | Rich outline | 7 |
| `guide/10-where-to-go-next.md` | Rich outline | 7 |
| `what-makes-froth-different.md` | Rich outline | 8 |
| `reference/words.md` | Rich outline | 9 |
| `reference/profiles.md` | Rich outline | 9 |
| `reference/cli.md` | Rich outline | 9 |
| `reference/vscode.md` | Rich outline | 9 |
| `reference/build-options.md` | Rich outline | 9 |
| `reference/snapshot-format.md` | Rich outline | 9 |
| `tutorials/build-a-calculator.md` | Rich outline | 10 |
| `tutorials/blink-an-led.md` | Rich outline | 10 |
| `tutorials/read-a-sensor.md` | Rich outline | 10 |
| `tutorials/interactive-workflow.md` | Rich outline | 10 |

**Files to move:**
- `website-references.md` → `_internal/website-references.md` (Task 1)

**Files to replace:**
- `index.md` (existing draft overwritten in Task 3)

---

### Task 1: Set up directory structure and move internal files

**Files:**
- Create directories: `guide/`, `reference/`, `tutorials/`, `_internal/`
- Move: `website-references.md` → `_internal/website-references.md`

- [ ] **Step 1: Create the four directories**

```bash
mkdir -p guide reference tutorials _internal
```

- [ ] **Step 2: Move website-references.md to _internal/**

```bash
mv website-references.md _internal/website-references.md
```

- [ ] **Step 3: Verify the structure**

```bash
ls -la
ls -la _internal/
```

Expected: four new empty directories, `_internal/` contains `website-references.md`, `index.md` remains at root.

- [ ] **Step 4: Commit**

```bash
git rm website-references.md
git add guide/ reference/ tutorials/ _internal/website-references.md
git commit -m "chore: set up website content directory structure"
```

---

### Task 2: Write the voice guide

This must be completed before any content writing. All subsequent tasks reference this document.

**Files:**
- Create: `_internal/voice-guide.md`

**Source material:**
- Spec sections: "Voice registers", "Anti-patterns: the AI voice", "Rhythm and structure to aim for", "General principles"
- Reference site analysis: `_internal/website-references.md`
- Real prose samples from: Rust Book (ownership chapter), Gleam FAQ, Svelte overview

**What this file must contain:**

1. **The four voice registers** (homepage, guide, reference, features page), each with:
   - A 2-3 sentence description of the register
   - A short sample paragraph (3-5 sentences) demonstrating that register writing about Froth. These samples should feel like real excerpts from the finished site. They set the bar for all subsequent writing.

2. **Anti-pattern quick-reference list.** The full list from the spec, formatted for scanning: structural habits, banned phrases, punctuation rules. No rationale needed here (that's in the spec). Just the rules.

3. **Before/after rewrites.** 3-4 examples where an AI-sounding paragraph about Froth is rewritten into the target voice. Each example should:
   - Show the "before" (a plausible AI-generated paragraph about a Froth concept)
   - Show the "after" (the same content rewritten to match the voice guide)
   - Include a 1-sentence note on what changed and why

4. **Draft checklist.** A short list (5-8 items) to run against any finished piece of writing before it ships. Things like: "Read every sentence aloud. Does any sentence sound like it could appear on any product's website? Rewrite it." and "Count em-dashes. More than 2 per page? Rewrite."

- [ ] **Step 1: Read the spec's voice and anti-pattern sections for reference**

Read: `docs/superpowers/specs/2026-03-20-froth-website-content-structure-design.md` (sections: Voice registers, Anti-patterns, Rhythm and structure, General principles)

- [ ] **Step 2: Read real Froth code and docs for sample-paragraph material**

Read these files from the Froth repo (at `../Froth`) to get accurate content for the sample paragraphs:
- `src/lib/core.froth` (the standard library, shows perm-based definitions)
- `docs/spec/Froth_Language_Spec_v1_1.md` lines 1-60 (design intent, mental model)
- `docs/perm-tutorial.md` lines 1-100 (how perm is taught)

- [ ] **Step 3: Write `_internal/voice-guide.md`**

Write the full document following the structure above. The sample paragraphs must use real Froth concepts and code. The before/after rewrites must be about Froth, not generic. Target length: 800-1200 words.

- [ ] **Step 4: Self-check against the spec's anti-pattern list**

Read through the voice guide itself and verify it doesn't violate its own rules. Specifically check for: em-dash overuse, three-part parallel structures, banned phrases, reflexive overview openings.

- [ ] **Step 5: Commit**

```bash
git add _internal/voice-guide.md
git commit -m "docs: add voice guide for website content"
```

---

### Task 3: Write the homepage (index.md)

**Files:**
- Overwrite: `index.md` (replacing the existing rough draft)

**Voice register:** Homepage (personal, first-person, opinionated, the creator speaking)

**Reference before writing:**
- `_internal/voice-guide.md` (read the homepage voice sample and anti-pattern list)
- `../Froth/src/lib/core.froth` (for the code example showing perm-based definitions)
- `../Froth/boards/esp32-devkit-v1/lib/board.froth` (for hardware interaction examples)
- `../Froth/docs/spec/Froth_Language_Spec_v1_1.md` lines 1-55 (design intent)

**Structure (from spec):**

1. **Opening tagline.** One sentence. Not a feature list. Something that makes you lean in. The existing draft has "Froth is a programming language for microcontrollers that turns them into fully interactive computers" which is a reasonable starting point but may need sharpening.

2. **Hook paragraph.** 3-4 sentences, personal voice. What this is, why it exists, why the reader should care. Creates curiosity without explaining the language mechanics. References the Forth heritage briefly. This is the creator speaking.

3. **A code example that earns respect.** A short REPL session (5-8 lines) showing something genuinely interesting. The ideal example shows:
   - Defining a word that controls hardware (e.g., an LED blink word using `gpio.write` and `ms`)
   - Calling it and seeing the result
   - Redefining it (e.g., changing the timing) and seeing the change take effect immediately
   - This demonstrates the interactive, live-on-hardware nature of Froth
   - Add a brief 2-3 sentence annotation below the code explaining what happened

   Use real Froth syntax from `core.froth` and the board library. Example pattern:
   ```froth
   : blink  2 1 gpio.write 200 ms 2 0 gpio.write 200 ms ;
   blink blink blink
   \ LED blinks three times at 200ms

   : blink  2 1 gpio.write 50 ms 2 0 gpio.write 50 ms ;
   blink blink blink
   \ Now it blinks fast — same word, new behavior, no recompile
   ```

4. **Three qualities, briefly.** 2-3 sentences each, as paragraphs (not a feature grid):
   - **Interactive:** You type, the hardware responds. Redefine words on the fly and the change takes effect immediately. No compile-flash-pray cycle.
   - **Tiny and transparent:** The entire language has ~30 primitives. The standard library fits on a page (verify exact line count from `core.froth` during writing). You can read and understand all of it.
   - **Yours to reshape:** Even `dup` and `swap` are defined in Froth using `perm`. The language gives you the building blocks; you decide what to build on top.

5. **Call to action.** Link to `guide/00-what-is-froth.md`. One primary path. A secondary "or install it now" link to `guide/01-getting-started.md` for the impatient.

6. **"Who is this for" line.** One sentence. Hobbyists, tinkerers, people who want to understand their hardware all the way down.

- [ ] **Step 1: Read the voice guide**

Read: `_internal/voice-guide.md` (full file). Pay attention to the homepage voice sample and the anti-pattern checklist.

- [ ] **Step 2: Read Froth source for accurate code examples**

Read:
- `../Froth/src/lib/core.froth` (full file, for the "dup is defined in Froth" claim)
- `../Froth/boards/esp32-devkit-v1/lib/board.froth` (for hardware word examples)
- `../Froth/docs/spec/Froth_Language_Spec_v1_1.md` lines 1-55 (for design intent phrasing)

- [ ] **Step 3: Write `index.md`**

Write the full homepage following the structure above. Target length: 400-600 words. Every code example must use real, valid Froth syntax. Check against the voice guide's anti-pattern list while writing.

- [ ] **Step 4: Run the draft checklist from the voice guide**

Read the voice guide's draft checklist and apply each item to the homepage. Fix anything that fails.

- [ ] **Step 5: Commit**

```bash
git add index.md
git commit -m "docs: write homepage content"
```

---

### Task 4: Write guide chapter 00 — What is Froth?

**Files:**
- Create: `guide/00-what-is-froth.md`

**Voice register:** Guide (warm, direct, "you" focused, teacher voice)

**Reference before writing:**
- `_internal/voice-guide.md` (guide voice sample, anti-pattern list)
- `../Froth/docs/spec/Froth_Language_Spec_v1_1.md` lines 1-180 (design intent, conformance profiles, reader forms)
- `../Froth/docs/perm-tutorial.md` lines 1-100 (how perm works, for a brief teaser)
- `../Froth/src/lib/core.froth` (the full stdlib, to show what "build everything yourself" means)
- `index.md` (the homepage, to ensure chapter 00 picks up where it left off)

**Structure (from spec):**

1. **The big idea, simply stated.** Froth is a language for microcontrollers where you build everything yourself from a small set of primitives. You type, the hardware responds, you iterate. 2-3 sentences that give the reader the core mental model. Not a sales pitch; just a clear picture.

2. **The Forth heritage, honestly.** A few paragraphs covering:
   - Forth was created in the 1970s by Charles Moore. It pioneered the idea that you could change a running system without resetting it.
   - What Forth got right: tiny, interactive, close to hardware, you build upward from nothing.
   - What Forth got wrong: redefining a word could silently break other words that used it. Errors crashed the session. Tooling couldn't reason about the code.
   - Froth keeps what works and fixes what doesn't. No need to know Forth.
   - Keep this honest, not dismissive of Forth. Froth inherits a real lineage.

3. **How Froth thinks.** The mental model, ~3 paragraphs:
   - Everything in Froth operates on a stack. You push values onto it, and words consume values from it and push results back.
   - A short annotated code example showing basic stack operations:
     ```froth
     3 4 +
     \ Stack: [7]

     2 *
     \ Stack: [14]

     dup +
     \ Stack: [28]
     ```
   - Froth code reads left to right. Each word does one thing. You compose behavior by putting words next to each other. This is concatenative programming.
   - Mention postfix notation briefly: "the operator comes after the operands, not between them."

4. **What you can do with it.** The practical picture in 2-3 paragraphs:
   - The development loop: plug in an ESP32, open VSCode, connect. You're talking to your hardware.
   - You define words in the REPL. They run immediately. You redefine them and the change takes effect without rebooting.
   - Snapshots: save your session to flash. Power off, power on, everything is still there.
   - Mention the VSCode extension and CLI as the tooling story, without going into detail (that's for chapter 01 and the reference pages).

5. **How this guide works.** One short paragraph:
   - This guide assumes no Forth knowledge.
   - It starts with the stack, builds up to defining words, and by chapter 08 you're controlling hardware.
   - Each chapter builds on the last. There are exercises.
   - Link to chapter 01.

6. **Navigation:** `→ Next: Getting Started`

- [ ] **Step 1: Read the voice guide and homepage**

Read:
- `_internal/voice-guide.md` (full file, focus on guide voice sample)
- `index.md` (to ensure continuity from homepage to chapter 00)

- [ ] **Step 2: Read Froth source material**

Read:
- `../Froth/docs/spec/Froth_Language_Spec_v1_1.md` lines 1-180
- `../Froth/docs/perm-tutorial.md` lines 1-50
- `../Froth/src/lib/core.froth` (full file)

- [ ] **Step 3: Write `guide/00-what-is-froth.md`**

Write the full chapter following the structure above. Target length: 800-1200 words. Use real Froth syntax in all code examples. The code example in section 3 should be runnable.

- [ ] **Step 4: Run the draft checklist from the voice guide**

Apply each checklist item. Fix anything that fails. Pay special attention to: does this sound like a person wrote it? Read paragraphs aloud.

- [ ] **Step 5: Commit**

```bash
git add guide/00-what-is-froth.md
git commit -m "docs: write guide chapter 00 — What is Froth?"
```

---

### Task 5: Write guide stubs — chapters 01 through 03

The early guide chapters that establish fundamentals: installing, the stack, and defining words.

**Files:**
- Create: `guide/01-getting-started.md`
- Create: `guide/02-the-stack.md`
- Create: `guide/03-words-and-definitions.md`

**Reference before writing:**
- `_internal/voice-guide.md` (for tone consistency)
- `../Froth/docs/spec/Froth_Language_Spec_v1_1.md` (sections on reader forms, abstract machine, core word set)
- `../Froth/src/lib/core.froth` (for code example ideas)
- `../Froth/tools/cli/` — run `ls ../Froth/tools/cli/` to see CLI structure for install steps
- `../Froth/tools/vscode/` — check `package.json` for extension commands

Each stub must contain: title, one-line description, detailed subsection breakdown, key concepts, specific code examples to include (described but not written as full prose), connections to other chapters, and prev/next navigation links.

- [ ] **Step 1: Read source material for these three chapters**

Read:
- `../Froth/docs/spec/Froth_Language_Spec_v1_1.md` lines 178-300 (reader forms, abstract machine model)
- `../Froth/tools/vscode/package.json` (for extension commands and install info)
- `../Froth/CLAUDE.md` (for build instructions)
- `../Froth/src/lib/core.froth` (for stack shuffle definitions to reference in ch02-03)

- [ ] **Step 2: Write `guide/01-getting-started.md` stub**

This chapter covers: installing the CLI and VSCode extension, connecting to hardware (or using the local POSIX target), running your first REPL session, typing your first numbers and seeing the stack.

Subsections to outline:
- What you need (hardware: ESP32 DevKit or nothing for local mode; software: VSCode, Froth CLI)
- Installing the Froth CLI (where to get it, how to verify)
- Installing the VSCode extension
- Connecting to your board (or "Try Local" for no hardware)
- Your first session: push some numbers, type `.s`, see the stack
- What just happened (brief explanation connecting back to chapter 00's mental model)

Code examples to describe:
- The REPL prompt with a few numbers pushed and `.s` showing the stack
- `42 .` printing a number
- `words` showing the available word list

Navigation: `← Previous: What is Froth?` / `→ Next: The Stack`

- [ ] **Step 3: Write `guide/02-the-stack.md` stub**

This chapter covers: the data stack in depth, pushing and consuming values, stack effects notation, basic arithmetic on the stack, the `.s` introspection word.

Subsections to outline:
- The stack is where everything lives (mental model: a column of values)
- Pushing values: numbers, how they land on the stack
- Consuming values: how `+` takes two and leaves one
- Stack effects notation: `( a b -- sum )` and how to read it
- Arithmetic: `+`, `-`, `*`, `/mod` with stack traces
- Seeing the stack: `.s` and `.` (print and consume vs. display without consuming)
- What happens when things go wrong: stack underflow
- Exercises: mental stack tracing (give 5-6 expressions, ask the reader to predict the stack state)

Code examples to describe:
- Step-by-step stack trace of `3 4 + 2 *` showing the stack after each word
- `/mod` showing both quotient and remainder on the stack
- Stack underflow error from trying `+` with one value

Connections: builds on chapter 00's brief intro, directly feeds into chapter 03 (defining words that operate on the stack)

Navigation: `← Previous: Getting Started` / `→ Next: Words and Definitions`

- [ ] **Step 4: Write `guide/03-words-and-definitions.md` stub**

This chapter covers: what a word is, defining words with `:` and `;` (sugar for `def`), the slot model, calling words, redefining words and coherent redefinition.

Subsections to outline:
- What is a word? (a named operation that transforms the stack)
- Your first definition: `: double 2 * ;` with stack trace
- `:` and `;` are sugar for quotation + def. Show the desugared form: `[ 2 * ] 'double def`
- Slots: every word name gets a slot. `def` binds a value to it. This is how Froth keeps redefinition safe.
- Calling words: when you type a word name, Froth looks up its slot and calls the value
- Redefining a word: define `double`, use it in `quadruple`, redefine `double`, and `quadruple` picks up the new definition. This is coherent redefinition. Contrast with Forth where the old definition would be frozen.
- Stack effect comments: the `( inputs -- outputs )` convention and why it matters
- Exercises: define 3-4 small words, predict behavior after redefinition

Code examples to describe:
- `: double 2 * ; 5 double .` → 10
- `: quadruple double double ; 3 quadruple .` → 12
- Redefine double to `3 *`, then `3 quadruple .` → 27 (coherent redefinition)
- The desugared `[ 2 * ] 'double def` form
- `see double` showing the word's body

Connections: builds on chapter 02 (stack operations), feeds into chapter 04 (perm replaces the standard shuffle words they might expect)

Navigation: `← Previous: The Stack` / `→ Next: Perm and Named`

- [ ] **Step 5: Commit**

```bash
git add guide/01-getting-started.md guide/02-the-stack.md guide/03-words-and-definitions.md
git commit -m "docs: add guide stubs for chapters 01-03"
```

---

### Task 6: Write guide stubs — chapters 04 through 06

The middle chapters covering Froth's distinctive features: perm/Named, quotations, and error handling.

**Files:**
- Create: `guide/04-perm-and-named.md`
- Create: `guide/05-quotations-and-control.md`
- Create: `guide/06-error-handling.md`

**Reference before writing:**
- `_internal/voice-guide.md`
- `../Froth/docs/perm-tutorial.md` (the existing 15-part perm tutorial — extensive source material)
- `../Froth/docs/spec/Froth_Language_Spec_v1_1.md` sections on FROTH-Named, quotations, catch/throw
- `../Froth/docs/concepts/catch-throw.md`
- `../Froth/src/lib/core.froth` (perm-based definitions, combinators, `if`, `while`)

- [ ] **Step 1: Read source material**

Read:
- `../Froth/docs/perm-tutorial.md` (full file — this is the primary source for chapter 04)
- `../Froth/docs/concepts/catch-throw.md` (for chapter 06)
- `../Froth/docs/spec/Froth_Language_Spec_v1_1.md` — search for sections on FROTH-Named, quotations (`[ ... ]`), `choose`, `while`, `catch`, `throw`

- [ ] **Step 2: Write `guide/04-perm-and-named.md` stub**

This is the most distinctive chapter. It covers `perm` (Froth's one-primitive-to-rule-them-all for stack manipulation) and introduces FROTH-Named as the profile concept.

Subsections to outline:
- The problem: other stack languages have a zoo of shuffle words (dup, swap, rot, over, nip, tuck...). Froth replaces them all with one operation.
- How `perm` works: you tell it how many items to look at, and give it a pattern describing the output. The pattern is a picture of the result.
- Reading patterns: `1 p[a a] perm` is dup. `2 p[a b] perm` is swap. `1 p[] perm` is drop. Walk through 5-6 examples with stack traces.
- Building the standard library: show how `core.froth` defines all the classic shuffle words using `perm`. This is the "dup is defined in Froth" payoff.
- When perm patterns get complex: the case for named stack frames
- Introducing profiles: Froth has optional extensions called profiles. FROTH-Named is the first one you'll want.
- FROTH-Named basics: stack-effect declarations become bindings. Instead of shuffling, you name the values and refer to them. Show a side-by-side: perm version vs. Named version of the same word.
- When to use perm vs. Named: short words, shuffle once → perm. Longer words, multiple references → Named.

Code examples to describe:
- The "swap" pattern: `2 p[a b] perm` with stack trace
- The "over" pattern: `2 p[b a b] perm` with stack trace
- The "drop" pattern: `1 p[] perm` with stack trace
- `core.froth`'s actual definitions (dup, swap, drop, over, rot, -rot, nip, tuck)
- A more complex perm: `3 p[a c b a] perm` (custom rearrangement)
- A Named version of a multi-value word contrasted with the perm-only version

Connections: builds on chapter 03 (word definitions), feeds into chapter 05 (quotations use the same stack concepts)

Navigation: `← Previous: Words and Definitions` / `→ Next: Quotations and Control Flow`

- [ ] **Step 3: Write `guide/05-quotations-and-control.md` stub**

This chapter covers quotations (first-class code blocks), control flow, and the core combinators.

Subsections to outline:
- What is a quotation? `[ ... ]` is a block of code as a value on the stack. It doesn't execute until you `call` it.
- Pushing vs. calling: `[ 2 * ]` pushes a quotation. `call` executes it. `[ 2 * ] call` is the same as `2 *`.
- Conditional execution: `choose` selects one of two values based on a flag without executing. `if` is `choose call`. Show the actual definition from core.froth.
- Loops with `while`: `[ condition ] [ body ] while`. The condition quotation must leave a flag. The body runs while the flag is true. Show a countdown loop.
- Combinators from core.froth: `dip`, `keep`, `bi`, `times`. Each one gets a paragraph and a stack-traced example. These replace most manual shuffle+call patterns.
- Composing quotations: building more complex behavior by combining small quotations with combinators.

Code examples to describe:
- `[ 2 * ] call` vs. `2 *` (quotation basics)
- `5 [ 10 ] [ 20 ] if .` → 10 (conditional)
- `5 0 > [ "positive" s.emit ] [ "negative" s.emit ] if` (practical conditional)
- `10 [ dup 0 > ] [ dup . 1 - ] while drop` (countdown loop with stack trace)
- `dip` example: `1 2 [ 10 + ] dip` → `11 2`
- `keep` example: `5 [ 2 * ] keep` → `10 5`
- `times` example: `3 [ 42 . ] times`

Connections: builds on chapters 02-04 (stack, words, perm), feeds into chapter 06 (catch uses quotations) and chapter 08 (hardware control uses loops and conditionals)

Navigation: `← Previous: Perm and Named` / `→ Next: Error Handling`

- [ ] **Step 4: Write `guide/06-error-handling.md` stub**

This chapter covers catch/throw, the error model, and how the REPL stays alive.

Subsections to outline:
- Errors happen: stack underflow, division by zero, undefined words. In many embedded languages, an error means a reset. Froth does better.
- How the REPL recovers: when you make a mistake at the REPL, Froth catches the error, prints a message, restores the stack, and gives you the prompt back. You don't lose your session.
- `throw`: signals an error with an error code. Standard error codes (from ADR-016).
- `catch`: wraps a quotation in error protection. `[ ... ] catch` runs the quotation; if it throws, catch captures the error code and restores the stacks to their state before the catch.
- Practical pattern: using catch to try something and handle failure gracefully.
- Error codes: the standard set (underflow, overflow, division by zero, undefined word, etc.)
- When to use catch/throw in your own code: input validation, hardware timeouts, recoverable failures.

Code examples to describe:
- A stack underflow error at the REPL and the recovery
- `[ 1 0 /mod ] catch .` (catching a division by zero)
- A custom word that validates input and throws on bad values
- Nested catch blocks

Connections: builds on chapter 05 (catch takes a quotation), feeds into chapter 08 (hardware operations that can fail) and chapter 09 (snapshots and error recovery)

Navigation: `← Previous: Quotations and Control Flow` / `→ Next: Strings and I/O`

- [ ] **Step 5: Commit**

```bash
git add guide/04-perm-and-named.md guide/05-quotations-and-control.md guide/06-error-handling.md
git commit -m "docs: add guide stubs for chapters 04-06"
```

---

### Task 7: Write guide stubs — chapters 07 through 10

The later chapters covering I/O, hardware, persistence, and next steps.

**Files:**
- Create: `guide/07-strings-and-io.md`
- Create: `guide/08-talking-to-hardware.md`
- Create: `guide/09-snapshots-and-persistence.md`
- Create: `guide/10-where-to-go-next.md`

**Reference before writing:**
- `_internal/voice-guide.md`
- `../Froth/docs/spec/Froth_Language_Spec_v1_1.md` — FROTH-String-Lite, FROTH-String sections; FROTH-Addr section
- `../Froth/docs/spec/Froth_Snapshot_Overlay_Spec_v0_5.md` (for chapter 09)
- `../Froth/docs/concepts/persistence.md`
- `../Froth/boards/esp32-devkit-v1/lib/board.froth` (for hardware examples)
- `../Froth/boards/esp32-devkit-v1/board.json` (for pin definitions)

- [ ] **Step 1: Read source material**

Read:
- `../Froth/docs/spec/Froth_Snapshot_Overlay_Spec_v0_5.md` lines 1-80
- `../Froth/docs/concepts/persistence.md`
- `../Froth/boards/esp32-devkit-v1/lib/board.froth` (full file)
- `../Froth/boards/esp32-devkit-v1/board.json`
- `../Froth/docs/spec/Froth_Language_Spec_v1_1.md` — search for "FROTH-String-Lite" and "FROTH-Addr" sections

- [ ] **Step 2: Write `guide/07-strings-and-io.md` stub**

This chapter covers character I/O, strings, and output.

Subsections to outline:
- Character I/O: `emit` sends a character, `key` reads one, `key?` checks if input is available
- `cr` (newline) and `.` (print a number) — the basics you've been using
- String literals: `"hello"` pushes a StringRef onto the stack
- String operations: `s.emit` (print a string), `s.len` (length), `s@` (byte at index), `s.=` (equality)
- Strings are immutable and heap-allocated. No garbage collector — strings live until a region release.
- Building output: combining `emit`, `s.emit`, and `.` to produce formatted output
- Reading input: using `key` and `key?` for interactive programs

Code examples to describe:
- `72 emit 105 emit cr` (printing "Hi" character by character)
- `"hello, froth" s.emit cr`
- `"hello" s.len .` → 5
- `"abc" 0 s@ .` → 97 (ASCII 'a')
- A small interactive program that reads characters and echoes them

Connections: builds on chapters 02-05, feeds into chapter 08 (printing hardware readings)

Navigation: `← Previous: Error Handling` / `→ Next: Talking to Hardware`

- [ ] **Step 3: Write `guide/08-talking-to-hardware.md` stub**

The chapter the primary audience (embedded hobbyists) has been waiting for.

Subsections to outline:
- The development setup: VSCode + a connected board (ESP32 DevKit as the example)
- GPIO basics: `gpio.mode` (set pin direction), `gpio.write` (set pin high/low), `gpio.read` (read pin state)
- Blinking an LED: the canonical first hardware program. Define a `blink` word step by step, with the LED actually blinking.
- Reading a button: `BOOT_BUTTON gpio.read .` — reading the boot button on the ESP32 DevKit
- Timing: `ms` (delay in milliseconds), `us` (delay in microseconds)
- PWM with LEDC: using the `ledc.setup`, `ledc.duty`, `ledc.freq` words from the board library. Dimming an LED. Playing a tone on a buzzer.
- The board library: how `lib/board.froth` provides convenience words on top of raw FFI
- Pin constants: how `board.json` generates named constants like `LED_BUILTIN` and `BOOT_BUTTON`
- Combining it all: a small interactive program (e.g., button-controlled LED, or a simple light pattern)

Code examples to describe:
- `2 1 gpio.mode` (set GPIO 2 as output), `2 1 gpio.write` (LED on), `2 0 gpio.write` (LED off)
- A `blink` word with configurable timing
- Button read loop: `[ BOOT_BUTTON gpio.read . 100 ms ] [ -1 ] while`
- PWM setup: `0 2 1000 ledc.setup` then `0 512 ledc.duty` (50% brightness)
- A combined program using button input to control LED behavior

Connections: builds on all previous chapters, the practical payoff. Feeds into chapter 09 (persisting your hardware configuration)

Navigation: `← Previous: Strings and I/O` / `→ Next: Snapshots and Persistence`

- [ ] **Step 4: Write `guide/09-snapshots-and-persistence.md` stub**

**Note:** The default `board.json` for ESP32 DevKit may have `has_snapshots: false`. The stub should mention that snapshot support requires the board config to enable it, and note how to verify (`FROTH_HAS_SNAPSHOTS` in the build). This prevents readers from hitting a dead end.

This chapter covers saving and restoring state to flash.

Subsections to outline:
- The problem: you've defined words, configured your hardware, built a small program in the REPL. Then you unplug the board. Everything is gone. Snapshots fix this.
- What a snapshot captures: the heap (all definitions, strings, quotations), the slot table (all word bindings), and a generation counter. It does NOT capture the data or return stacks.
- `save`: writes the current state to flash. On ESP32, this uses NVS with A/B rotation for safety.
- `restore`: reloads a saved snapshot. Usually happens automatically at boot.
- `wipe`: clears saved snapshots (start fresh).
- The boot sequence: kernel → stdlib → board library → snapshot restore → `autorun` hook → REPL
- `autorun`: define a word called `autorun` and it runs automatically after boot. This is how you make a standalone device.
- Safe boot: hold the boot button during the first 750ms to skip snapshot restore and autorun. This is your escape hatch.
- Practical workflow: develop interactively → save when it works → power cycle to verify → iterate

Code examples to describe:
- Define a few words, `save`, power cycle, verify they're still there
- Define an `autorun` word that blinks an LED, `save`, unplug/replug — the board blinks on its own
- Safe boot to recover from a bad `autorun`
- `wipe` to start clean

Connections: builds on chapter 08 (persisting hardware configurations), the culmination of the "interactive embedded development" story

Navigation: `← Previous: Talking to Hardware` / `→ Next: Where to Go Next`

- [ ] **Step 5: Write `guide/10-where-to-go-next.md` stub**

A short closing chapter pointing to further resources.

Subsections to outline:
- You've learned the language. Here's where to go deeper.
- The reference section: complete word list, all profiles, CLI and VSCode documentation
- Tutorials: task-specific guides (calculator, blink, sensor, interactive workflow)
- What Makes Froth Different: the technical case for Froth's design decisions (link to features page)
- The specification: for those who want the formal definition
- Contributing / getting involved (brief, placeholder for future community info)
- The Froth source code: reading the implementation as a learning exercise (link to repo)

This is short — mostly links with 1-2 sentence descriptions of where each link takes you.

Navigation: `← Previous: Snapshots and Persistence`

- [ ] **Step 6: Commit**

```bash
git add guide/07-strings-and-io.md guide/08-talking-to-hardware.md guide/09-snapshots-and-persistence.md guide/10-where-to-go-next.md
git commit -m "docs: add guide stubs for chapters 07-10"
```

---

### Task 8: Write the features page outline (what-makes-froth-different.md)

**Files:**
- Create: `what-makes-froth-different.md`

**Voice register:** Features page (authoritative, making a case, can reference Forth directly)

**Reference before writing:**
- `_internal/voice-guide.md` (features page voice)
- `../Froth/docs/spec/Froth_Language_Spec_v1_1.md` (conformance profiles, design intent)
- `../Froth/docs/adr/` — key ADRs: 004 (value tagging), 006 (slot table), 012 (perm), 015 (catch/throw), 017 (def accepts any), 026 (snapshots), 040 (trampoline executor)
- `../Froth/src/lib/core.froth`

- [ ] **Step 1: Read key ADRs for the design decisions behind each feature**

Read:
- `../Froth/docs/adr/006-slot-table.md` (coherent redefinition)
- `../Froth/docs/adr/012-perm-tos-right-reading.md` (perm design)
- `../Froth/docs/adr/015-catch-throw-c-return-propagation.md` (error handling)
- `../Froth/docs/adr/026-snapshot-persistence.md` (snapshots)

- [ ] **Step 2: Write `what-makes-froth-different.md` stub**

This is a rich outline for a page that makes the case that Froth is a new language, not a Forth dialect.

Sections to outline (each gets a feature name, 2-3 sentence description, a code example to include, and the "why this matters" angle):

1. **`perm`: one primitive to replace them all.** Froth replaces Forth's zoo of stack shuffle words with a single canonical operation. Every rearrangement is expressed as a pattern. Tooling can analyze and optimize perm patterns. Show: the core.froth definitions of dup/swap/drop/over using perm.

2. **Coherent redefinition via slots.** In Forth, redefining a word creates a new entry; old callers keep using the old definition. In Froth, every word is a slot. Redefining a slot updates all callers. Show: define A, define B that uses A, redefine A, call B and get the new behavior.

3. **Structured error handling (catch/throw).** Forth's traditional error handling is ABORT, which destroys the session. Froth provides catch/throw with stack restoration, keeping the REPL alive. Show: catching a division by zero.

4. **Quotations as first-class values.** Froth treats `[ ... ]` blocks as data that can be passed around, stored, and called. Combined with `choose`, `call`, and the combinators, this gives Froth higher-order programming without leaving the stack model. Show: `if` defined as `choose call`.

5. **The profile system.** Froth's features are layered into optional profiles (Named, Checked, Region, String, Perf, Addr). A minimal implementation needs only Core+Base. Profiles cannot change the meaning of Core programs. This is a formal compatibility guarantee.

6. **Snapshot persistence.** Save the entire runtime state to flash and restore it on boot. A/B rotation for atomic saves. The `autorun` hook turns a development session into a standalone device. Show: the save → power-cycle → restore workflow.

7. **Modern tooling.** CLI for build/flash/connect, VSCode extension for interactive development, daemon architecture for reliable device communication. Froth is designed to be tooled, not just typed.

- [ ] **Step 3: Commit**

```bash
git add what-makes-froth-different.md
git commit -m "docs: add features page outline"
```

---

### Task 9: Write reference section stubs

**Files:**
- Create: `reference/words.md`
- Create: `reference/profiles.md`
- Create: `reference/cli.md`
- Create: `reference/vscode.md`
- Create: `reference/build-options.md`
- Create: `reference/snapshot-format.md`

**Voice register:** Reference (clean, neutral, precise)

**Reference before writing:**
- `_internal/voice-guide.md` (reference voice)
- `../Froth/docs/spec/Froth_Language_Spec_v1_1.md` (word definitions, profiles)
- `../Froth/docs/spec/Froth_Snapshot_Overlay_Spec_v0_5.md`
- `../Froth/tools/cli/` and `../Froth/tools/vscode/package.json`
- `../Froth/CMakeLists.txt` (for build options)

- [ ] **Step 1: Read source material for reference pages**

Read:
- `../Froth/docs/spec/Froth_Language_Spec_v1_1.md` — search for the core word set (Section 5) and all profile sections
- `../Froth/tools/vscode/package.json` (for command names)
- `../Froth/CMakeLists.txt` lines 1-80 (for build option names and defaults)
- `../Froth/docs/spec/Froth_Snapshot_Overlay_Spec_v0_5.md` lines 1-60

- [ ] **Step 2: Write `reference/words.md` stub**

Outline for the complete word reference. Organize by category:

- Stack manipulation (perm, and the stdlib-defined shuffle words)
- Arithmetic (+, -, *, /mod)
- Comparisons (<, >, =)
- Bitwise (and, or, xor, invert, lshift, rshift)
- Quotations (q.len, q@, q.pack, call, choose)
- Patterns (pat, perm)
- Definitions (def, get, arity!)
- Control flow (while, if — note if is stdlib-defined)
- Error handling (catch, throw)
- Strings (s.emit, s.len, s@, s.=)
- I/O (emit, key, key?)
- Memory (mark, release)
- Introspection (., .s, words, see, info)
- Auxiliary stack (>r, r>, r@)
- Snapshots (save, restore, wipe)
- System (dangerous-reset)

The outline must enumerate every word from `Froth_Language_Spec_v1_1.md` Section 5 (core word set), Section 7 (FROTH-Base), and every definition from `core.froth`. For each word, specify the format: name, stack effect, one-line description, one-line example. Note which words are primitives (C) vs. stdlib (Froth).

- [ ] **Step 3: Write `reference/profiles.md` stub**

Outline covering every profile from the spec:
- FROTH-Core (mandatory), FROTH-Base (mandatory)
- FROTH-Named, FROTH-Checked, FROTH-Region (+ Region-Strict), FROTH-String-Lite, FROTH-String, FROTH-REPL, FROTH-Stdlib, FROTH-Perf, FROTH-Addr

For each: one paragraph summary, what it adds, when you'd want it, and its dependencies.

- [ ] **Step 4: Write `reference/cli.md` stub**

Outline covering each CLI command: connect, build, flash, send, reset, daemon, doctor. For each: syntax, what it does, common flags, example usage.

- [ ] **Step 5: Write `reference/vscode.md` stub**

Outline covering: installation, connecting to a device, "Try Local" mode, sending code (selection vs. file), the device sidebar, snapshot commands, keyboard shortcuts, daemon lifecycle.

- [ ] **Step 6: Write `reference/build-options.md` stub**

Outline covering CMake configuration: FROTH_BOARD, FROTH_PLATFORM, FROTH_CELL_SIZE_BITS, FROTH_DS_CAPACITY, FROTH_RS_CAPACITY, FROTH_HEAP_SIZE, FROTH_SLOT_TABLE_SIZE, FROTH_HAS_SNAPSHOTS, FROTH_HAS_LINK. For each: name, type, default, what it controls.

- [ ] **Step 7: Write `reference/snapshot-format.md` stub**

Outline for the technical snapshot format documentation. This page serves academic readers. Cover: what a snapshot contains (heap image, slot table, generation counter), the overlay model, A/B rotation, NVS storage on ESP32, the boot restore sequence.

- [ ] **Step 8: Commit**

```bash
git add reference/
git commit -m "docs: add reference section stubs"
```

---

### Task 10: Write tutorial stubs

**Files:**
- Create: `tutorials/build-a-calculator.md`
- Create: `tutorials/blink-an-led.md`
- Create: `tutorials/read-a-sensor.md`
- Create: `tutorials/interactive-workflow.md`

**Voice register:** Guide (warm, direct — tutorials use the same teacher voice as the guide)

**Reference before writing:**
- `_internal/voice-guide.md`
- `../Froth/src/lib/core.froth`
- `../Froth/boards/esp32-devkit-v1/lib/board.froth`

- [ ] **Step 1: Write `tutorials/build-a-calculator.md` stub**

No hardware required. This tutorial teaches: defining words for basic math operations, building a simple RPN calculator in the REPL, handling errors (division by zero), and composing words into a useful tool.

Subsections to outline:
- Prerequisites: chapters 00-06 of the guide
- What we're building: an RPN calculator with named operations
- Step-by-step: define `square`, `cube`, `factorial` (using `times` or `while`), `fib`
- Error handling: catch division by zero, provide a useful message
- Composing: build a `calculate` word that reads input and dispatches
- What you learned: word composition, error handling, interactive development

- [ ] **Step 2: Write `tutorials/blink-an-led.md` stub**

The classic first hardware tutorial. Requires an ESP32 DevKit (or similar).

Subsections to outline:
- Prerequisites: chapters 00-03, chapter 08 basics
- What we're building: a configurable LED blinker
- Step-by-step: set GPIO mode, write high/low, add timing, wrap in a word, add a loop, make timing configurable
- Extension: multiple LEDs, patterns, speed control via button
- Saving your work: snapshot the blink program (note: snapshot availability depends on board config; mention how to verify it's enabled)

- [ ] **Step 3: Write `tutorials/read-a-sensor.md` stub**

Connecting and reading from a hardware sensor (e.g., ADC read, or I2C temperature sensor if available).

Subsections to outline:
- Prerequisites: chapters 00-08
- What we're building: a continuous sensor reading display
- Step-by-step: read an analog pin, convert the reading, display it, add a read loop with timing, define a calibration word
- Extension: threshold alerts (LED turns on when value exceeds limit)

- [ ] **Step 4: Write `tutorials/interactive-workflow.md` stub**

A meta-tutorial about how to develop with Froth effectively. Not about a specific project, but about the process.

Subsections to outline:
- The REPL-first workflow: type → test → iterate, all on the device
- VSCode integration: send selection (Cmd+Enter), send file (Cmd+Shift+Enter), the feedback loop
- Building incrementally: start with small words, compose upward, test at each level
- Using snapshots as checkpoints: save before experimenting, restore if you mess up
- Debugging: `.s` everywhere, `see` to inspect words, `catch` to contain experiments
- When to use a file vs. the REPL: small experiments in REPL, larger programs in a .froth file sent via VSCode
- A worked example: walk through a 15-minute development session showing the full cycle

- [ ] **Step 5: Commit**

```bash
git add tutorials/
git commit -m "docs: add tutorial stubs"
```

---

### Task 11: Final verification pass

After all content is written, verify consistency across the full file tree.

**Files:**
- All 24 files created in Tasks 1-10

- [ ] **Step 1: Verify all 24 files exist**

```bash
find . -name '*.md' -not -path './docs/*' | sort
```

Expected: 24 .md files matching the spec's file tree.

- [ ] **Step 2: Check navigation links in guide chapters**

For each guide chapter (00-10), verify that the `← Previous` and `→ Next` links reference files that actually exist. Verify that the homepage's "Read the guide" link points to `guide/00-what-is-froth.md` and the secondary install link points to `guide/01-getting-started.md`.

- [ ] **Step 3: Check code example consistency**

Spot-check that hardware code examples across files use consistent conventions:
- Pin numbers: LED should be GPIO 2 (`LED_BUILTIN`) across homepage, chapter 08, and blink tutorial
- Word names: if a `blink` word is defined in multiple places, the syntax should be compatible
- Stack effect notation: same format everywhere `( inputs -- outputs )`

- [ ] **Step 4: Run the voice guide draft checklist against the two full-content files**

Apply the checklist from `_internal/voice-guide.md` to `index.md` and `guide/00-what-is-froth.md`. Fix any violations. If fixes are needed, amend the relevant commit.

- [ ] **Step 5: Final commit (if any fixes were made)**

```bash
git add -u
git commit -m "docs: fix consistency issues from verification pass"
```

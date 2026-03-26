# Quotations and Control Flow

_A quotation is a block of code you can pass around like a value. This chapter shows how quotations work, how to run them conditionally, and how the core combinators build from them._

---

## Outline and writing notes

Chapter 03 introduced quotations as "what `:` and `;` desugar into" — a block of code wrapped in `[ ]`. That was a brief mention in the context of desugaring. This chapter makes quotations first-class citizens of the reader's mental model.

The organizing insight is simple: a quotation is just a value. Like a number, it sits on the stack until something consumes it. Unlike a number, consuming it means executing its contents. Once the reader has this model, all of `if`, `while`, `dip`, `keep`, `bi`, and `times` fall out naturally — they're just words that take quotations and do something with them.

Resist the temptation to introduce every combinator at once. Introduce `call` first, then `choose`/`if`, then `while`, then the higher-order combinators. Each one should feel like a natural extension of what came before.

Tone: the section on `while` is the most procedurally intense. Use a worked countdown example and trace it step by step. Readers coming from imperative languages will feel at home with the concept but may find the spelling unfamiliar. Meet them where they are.

---

## Subsections

### 1. What is a quotation?

**Purpose:** Establish quotations as values — a block of code that sits on the stack without running.

**What to cover:**
- A quotation is written as `[ ... ]`. Everything between the brackets is code — words, numbers, other quotations — but it is not executed when the brackets are evaluated.
- Instead, the quotation itself is pushed onto the stack as a single value.
- Think of it as a deferred computation: "here is some code; I'll tell you when to run it."
- Compare to a number: `42` pushes 42 onto the stack. `[ 42 . ]` pushes a quotation that, when run, will push 42 and then print it. The quotation itself is not 42 — it's a thing that can produce 42 when called.
- Quotations can contain anything a word definition can contain: literals, word calls, other quotations. They can be arbitrarily nested.
- Stack effect notation for a word that takes a quotation uses `q` as a placeholder: `( q -- )` means "takes a quotation and leaves nothing."

**Code example to describe:**
```
froth> [ 2 * ]
Stack: [<quotation>]
```
Showing that the quotation lands on the stack as a single item, not executed.

**Writer note:** The REPL may display quotations differently — as `[ 2 * ]` literally, or as an opaque reference like `<quotation #3>`. Check actual REPL output and describe what the reader will see. The important point is that *something* is on the stack — one item — and it's not the result of running `2 *`.

---

### 2. Pushing vs. calling: `call`

**Purpose:** Introduce `call` as the word that executes a quotation, completing the push/call distinction.

**What to cover:**
- `call` takes a quotation from the top of the stack and executes its contents.
- Stack effect: `( q -- ... )` — the `...` depends on what the quotation does.
- Bare execution: `[ 2 * ] call` is exactly the same as just writing `2 *`. The quotation wrapper and the `call` cancel out.
- Why this matters: if `call` didn't exist, quotations would be inert. `call` is what makes them useful. Every higher-order word in this chapter is built from `call`.
- The symmetry: `[ body ] call` = `body`. Quotations are just a way to defer execution.

**Code example to describe:**
```
froth> 5 [ 2 * ] call .
10
```
Stack trace:
1. `5` pushes 5. Stack: `[5]`
2. `[ 2 * ]` pushes the quotation. Stack: `[5 <q>]`
3. `call` takes the quotation and executes it. Inside `2 *`: `2` pushes 2 → `[5 2]`; `*` multiplies → `[10]`.
4. `.` prints 10 and empties stack.

Also show the equivalence: `5 2 * .` → `10`. Same result.

**Writer note:** Some readers will ask "why not just write `2 *` directly?" The answer, which this section can preview and later sections will confirm, is: sometimes you don't know at call-site which code to run. That's where `choose`, `if`, and `while` come in. Keep this preview brief.

---

### 3. Conditional execution: `choose` and `if`

**Purpose:** Show the canonical conditional pattern in Froth.

**What to cover:**

**`choose` first:**
- `choose ( flag t f -- result )` — takes a boolean flag and two values. If the flag is true (non-zero), leaves `t`; if false (zero), leaves `f`. Does not execute anything.
- `choose` is not specific to quotations — it selects between any two values. But it's most useful with quotations.
- Stack trace for `1 [ 10 ] [ 20 ] choose`:
  - Stack before `choose`: `[1 <q:10> <q:20>]`
  - Flag is 1 (true): select `t`. Discard `f`. Stack: `[<q:10>]`

**`if` next:**
- `if ( flag t f -- result )` — wraps `choose call`. The standard definition from `core.froth`:
  ```froth
  : if ( flag t f -- result )   choose call ;
  ```
- `if` selects the quotation based on the flag, then calls it.
- `choose` + `call` = conditional execution.
- Show the full sequence: `5 [ 10 ] [ 20 ] if .` → prints `10` because `5` is truthy.

**Stack trace for `5 [ 10 ] [ 20 ] if .`:**
1. `5` → stack: `[5]`
2. `[ 10 ]` → stack: `[5 <q:10>]`
3. `[ 20 ]` → stack: `[5 <q:10> <q:20>]`
4. `if` → calls `choose`: flag is 5 (truthy), select `<q:10>`, discard `<q:20>`. Then `call` executes `[ 10 ]`: pushes 10. Stack: `[10]`
5. `.` → prints `10`, stack empty.

**False branch trace:** `0 [ 10 ] [ 20 ] if .` → prints `20`.

**Writer note:** The ordering of arguments to `if` — flag first, true branch second, false branch third — is opposite to many imperative language conventions (where the condition comes in the `if (...)` and branches follow). Acknowledge this directly. The key is that all three arguments are on the stack before `if` runs; `if` is just a word that consumes them.

Also: `choose` is worth showing on its own before `if`. Some readers will need `choose` without an immediate call (e.g., selecting between two non-quotation values). Establishing `choose` as independent makes its role in the `if` definition obvious.

---

### 4. Loops with `while`

**Purpose:** Introduce the core looping construct as a pattern of two quotations.

**What to cover:**
- `while ( condition-q body-q -- )` — the looping combinator. Takes two quotations: a condition and a body.
- Behavior: run the condition quotation; if it leaves a truthy value, run the body quotation, then repeat. Stop when the condition leaves zero (or false).
- Neither the condition nor the body quotation is called before `while` runs — both are passed as values.
- Pattern: `[ condition ] [ body ] while`

**Code example — countdown loop:**
```froth
10 [ dup 0 > ] [ dup . 1 - ] while drop
```
Walk through this carefully:
- Start: `10` on stack.
- Condition `[ dup 0 > ]`: `dup` copies the top; `0 >` checks if it's greater than zero. Leaves the original value plus a boolean. Wait — this leaves an extra value. Clarify: the condition quotation leaves a flag; the flag is consumed by `while`. The original value remains. Trace precisely.

**Precise trace for one iteration (starting with 10):**
- Stack before condition: `[10]`
- Condition executes `dup 0 >`: dup → `[10 10]`; `0 >` → `[10 1]` (10 > 0 is true)
- `while` consumes the flag (1). Flag is truthy. Stack: `[10]`
- Body executes `dup . 1 -`: dup → `[10 10]`; `.` prints `10`, consumes top → `[10]`; `1 -` → `[9]`
- Loop back to condition. Stack: `[9]`
- ... continues until stack has `[0]`
- Condition: `dup 0 >` → `[0 0]` (0 > 0 is false). `while` sees false, stops. Stack: `[0]`
- `drop` cleans up the remaining 0. Stack: `[]`

Output: `10 9 8 7 6 5 4 3 2 1`

**Writer note:** The while loop trace is the most involved code trace in this chapter. Write it out in full — don't skip steps. Readers who follow this trace will have a solid grasp of how condition-body looping works in Froth. Readers who skim it will be confused when they try to write their own loops.

Note that `while` is not a primitive — it is defined in `core.froth` using lower-level operations. Mention this (the actual definition appears in the reference), but don't get into that definition here. The reader just needs to use `while` correctly.

---

### 5. Combinators: `dip`, `keep`, `bi`, `times`

**Purpose:** Introduce the four most useful higher-order words from `core.froth`, each in a focused paragraph with a stack trace.

**What to cover:**

**`dip ( a q -- result a )` — call a quotation, keeping the top value out of the way:**
- Temporarily removes the top value from the stack, runs the quotation, then restores the value.
- Use case: you have a value on top that you want to protect while you operate on things below it.
- Example: `1 2 [ 10 + ] dip`
  - Stack before `dip`: `[1 2 <q:10+>]`
  - `dip` pulls `2` off (saves it), leaves `[1 <q:10+>]`... wait, re-read the stack effect. Actually with `[1 2]` on stack (2 on top): `a` = `2`, `q` = quotation. `dip` saves `2`, calls `[ 10 + ]` on `[1]` → `[11]`, then restores `2` → `[11 2]`.
  - Final stack: `[11 2]`
- `dip`'s definition from `core.froth`: `: dip ( a q -- result a ) swap >r call r> ;` — uses the return stack to stash the value. Mention this is the mechanism, but the reader doesn't need to understand return stack internals to use `dip`.

**`keep ( x q -- result x )` — call a quotation, then put the original value back:**
- Calls the quotation with `x` on the stack, then pushes `x` again after.
- Use case: "apply this operation to `x`, but I also still need `x` afterward."
- Example: `5 [ 2 * ] keep`
  - `x` = 5, `q` = `[ 2 * ]`. `keep` runs `[ 2 * ]` with 5 on stack → 10. Then pushes 5 back.
  - Final stack: `[10 5]`
- Definition from `core.froth`: `: keep ( x q -- result x ) over swap call swap ;`

**`bi ( x f g -- f(x) g(x) )` — apply two quotations to the same value:**
- Calls `f` with `x`, calls `g` with `x`, leaves both results.
- Use case: compute two different things from the same input without having to manage two copies.
- Example: `10 [ 2 * ] [ 1 + ] bi`
  - Applies `[ 2 * ]` to 10 → 20; applies `[ 1 + ]` to 10 → 11.
  - Final stack: `[20 11]`
- Definition from `core.froth`: `: bi ( x f g -- f(x) g(x) ) -rot keep rot call ;`

**`times ( n q -- )` — call a quotation `n` times:**
- Runs the quotation `n` times. The quotation typically does side effects or modifies the stack in a cumulative way.
- Example: `3 [ 42 . ] times`
  - Prints `42` three times.
- Example with stack effect: `0 5 [ 1 + ] times` — starts with 0, adds 1 five times. Final stack: `[5]`.
- Definition from `core.froth` uses `while` internally:
  ```froth
  : times ( n q -- )
    >r
    [ dup 0 > ] [ 1 - r@ call ] while
    drop r> drop
  ;
  ```
  Mention the definition is available in the reference; don't explain return-stack mechanics here.

**Writer note:** The four combinators form a natural progression: `dip` is the most fundamental (used to implement the others), then `keep`, then `bi`, then `times`. Present them in that order. For each, state the core use case in one sentence before the example. Readers should be able to scan this section and pick up whichever combinator they need without reading all four in sequence.

---

### 6. Composing quotations: building behavior from parts

**Purpose:** Show that small quotations combine naturally, and that this is how Froth programs grow.

**What to cover:**
- Quotations are values, so they can be stored, passed, and combined. A word can take a quotation as an argument and either call it directly or pass it onward.
- The combinators in section 5 are the standard vocabulary for this — `dip`, `keep`, `bi`, `times` are each ways of threading quotations through a computation.
- The deeper insight: when you write `: my-word ... ;`, the body is itself a quotation. The colon-semicolon syntax is sugar for `[ ... ] 'my-word def`. Every word definition is a stored quotation. Every call is a `call` in disguise.
- This means a quotation and a word are the same thing from the runtime's perspective — the difference is just whether the quotation has a name (a slot binding) or not.
- Practical implication: you can factor a word by extracting part of its body into a named helper, or by passing a quotation as an argument. Both techniques are normal Froth style.

**Code example to describe:**
Show a word that takes a quotation parameter:
```froth
: apply-twice ( n q -- result )   dup dip call ;
```
Usage: `5 [ 3 + ] apply-twice .` → `11` (5 + 3 + 3).
Walk through the stack trace to confirm.

**Writer note:** This section is shorter than the others — it's a synthesis, not a tutorial. Its job is to give the reader a sense of where quotation-based thinking leads. Don't introduce new words here; use only what the chapter has already taught. End with a forward pointer: "In chapter 08, you'll see how quotations and the slot model combine to build an object-like pattern. For now, the fundamentals are in hand."

---

### 7. Exercises

**Purpose:** The reader uses quotations, `if`, `while`, and combinators in small experiments that build confidence.

**Exercise 1 — Trace a quotation:**
Given `3 [ dup * ] call`, trace the stack. What is the final stack?
- `3` → `[3]`; `[ dup * ]` → `[3 <q>]`; `call` executes: `dup` → `[3 3]`, `*` → `[9]`.
- Answer: `[9]`

**Exercise 2 — Write an `if` expression:**
Write an expression that takes a number from the stack and prints "positive" if it's greater than 0, "nonpositive" if it's not. (Use `0 >` to get the flag. Use string literals or `.` — check what output words are available at this point in the guide and adjust accordingly. Alternatively, print `1` and `0` as stand-ins.)

**Exercise 3 — Trace a `while` loop:**
What does this print? Trace it before running.
```froth
3 [ dup 0 > ] [ dup . 1 - ] while drop
```
- Answer: prints `3 2 1`

**Exercise 4 — Use `dip`:**
You have `[2 3]` on the stack (3 on top). You want to add 10 to the second-from-top value without touching the top value. Write the expression.
- Answer: `[ 10 + ] dip` — result: `[12 3]`

**Exercise 5 — Use `times`:**
Write an expression that prints `hello` five times. (Use whatever output word is appropriate — if string printing isn't available yet, print the number 99 five times as a stand-in.)
- Answer: `5 [ 99 . ] times`

**Writer note:** Exercise 2 is open-ended on purpose — let the reader figure out the exact spelling for printing strings, since string output may not be covered until chapter 07. If the writer wants to make this exercise self-contained, use numbers and a note: "pretend 1 means positive and 0 means nonpositive for now." The important thing is that the reader writes the `if` expression correctly.

---

## Key concepts introduced in this chapter

- Quotation: `[ ... ]` — a deferred block of code, pushed as a value
- `call ( q -- ... )`: executes a quotation
- `choose ( flag t f -- result )`: selects one of two values based on a flag (no execution)
- `if ( flag t f -- result )`: `choose call` — conditional execution
- `while ( condition-q body-q -- )`: loop while condition is truthy
- `dip ( a q -- result a )`: call a quotation with the top value temporarily removed
- `keep ( x q -- result x )`: call a quotation, then restore `x`
- `bi ( x f g -- )`: apply two quotations to the same value
- `times ( n q -- )`: call a quotation `n` times
- Quotation composition: words and quotations are the same runtime entity

---

## Code examples (full list, for reference when writing)

1. `[ 2 * ]` landing on the stack without executing
2. `5 [ 2 * ] call .` → `10` — trace with equivalence to `5 2 * .`
3. `5 [ 10 ] [ 20 ] if .` → `10` — full stack trace
4. `0 [ 10 ] [ 20 ] if .` → `20` — false-branch trace
5. `1 [ 10 ] [ 20 ] choose` → leaves `<q:10>` on stack (not yet called)
6. `10 [ dup 0 > ] [ dup . 1 - ] while drop` — countdown, full trace for two iterations
7. `1 2 [ 10 + ] dip` → `[11 2]`
8. `5 [ 2 * ] keep` → `[10 5]`
9. `10 [ 2 * ] [ 1 + ] bi` → `[20 11]`
10. `3 [ 42 . ] times` — prints `42` three times
11. `apply-twice` definition and usage trace

---

## Connections to other chapters

- **Chapter 03 (Words and Definitions):** Quotations were briefly introduced there as what `:` desugars into. This chapter completes that picture. Readers who remember the desugaring will see the connection immediately.
- **Chapter 04 (Perm and Named):** `dip` is defined using `swap` and the return stack. The reader who understands perm-based stack manipulation from chapter 04 will be able to read that definition in the reference without confusion.
- **Chapter 06 (Error Handling):** `catch` takes a quotation, exactly like `call`. The error-handling model is a natural extension of the quotation model: instead of calling the quotation directly, `catch` calls it in a protected context.
- **Chapter 08 (Objects and Slots) — forward reference:** Quotations stored in slots is how Froth's object-like patterns work. The connection between "a word is a named quotation" and "an object method is a quotation stored in a slot" will be made in chapter 08.

---

## Navigation

[← Previous: Perm and Named](04-perm-and-named.md) | [→ Next: Error Handling](06-error-handling.md)

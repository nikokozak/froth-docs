# Words and Definitions

_A word is a named stack transformation. This chapter shows you how to create them, how Froth stores them, and why redefining one changes everything that uses it._

---

## Outline and writing notes

This chapter is where Froth starts to feel like a real programming language. The reader can push numbers and do arithmetic; now they learn how to name things. The payoff concept — coherent redefinition — is what makes Froth meaningfully better than Forth for interactive development. The writing should build toward that payoff without telegraphing it too early.

Resist the urge to overload this chapter. The slot model and coherent redefinition are the conceptual heavy lifts; everything else is setup. Give the slot model enough room to breathe.

Tone note: the desugaring section (`[ 2 * ] 'double def`) may feel intimidating to readers who are new to this style of thinking. Introduce it as "here's what the colon-semicolon syntax is shorthand for" rather than as a second thing to learn. The goal is to demystify, not to expand the surface area.

---

## Subsections

### 1. What is a word?

**Purpose:** Establish the definition precisely, then connect it to everything the reader already knows.

**What to cover:**
- A word is a named operation. When you type a word, Froth looks it up and executes whatever it finds there.
- Everything the reader has used so far — `+`, `-`, `.s`, `.`, `words` — is a word. Even number literals can be thought of as words whose only effect is to push a value.
- A word transforms the stack: it may consume values, produce values, both, or neither. The transformation is described by the word's stack effect.
- This is the core abstraction of Froth: instead of writing long sequences of operations inline, you give sequences names and refer to them by name. Programs grow by building new words out of existing ones.
- Connecting back: in chapter 00, the blink example was described as "a word that sets a GPIO pin high, another that waits 200ms, another that combines them." That's exactly what this chapter teaches.

**Writer note:** Keep this under a page. Its job is to prime the reader to absorb what follows. End it with a sentence like "Let's define one."

---

### 2. Your first definition: `: double 2 * ;`

**Purpose:** Show the definition syntax and immediately prove it works.

**What to cover:**
- The syntax for defining a word is: `: name body ;`
  - `:` (colon) opens a definition and is immediately followed by the word's name
  - The body is one or more words that will execute when `name` is called
  - `;` (semicolon) closes the definition
- Example to walk through step by step:
  ```froth
  : double ( n -- n ) 2 * ;
  ```
  Read this as: "Define a word called `double`. Its body is `2 *`. When called, it expects one value on the stack and leaves one value."

- Immediately test it:
  ```froth
  froth> : double ( n -- n ) 2 * ;
  froth> 5 double .
  10
  ```

- Walk through what happened:
  1. `5` pushes 5 onto the stack. Stack: `[5]`
  2. `double` executes its body: `2 *`. That pushes 2 (`[5, 2]`), then `*` multiplies (`[10]`).
  3. `.` prints and consumes `10`. Stack: `[]`

- The word is now part of the session. Type `words` and `double` appears in the list.

**Code example to include:**
Full REPL sequence:
```
froth> : double ( n -- n ) 2 * ;
froth> 5 double .
10
froth> 3 double .
6
```

**Writer note:** The stack effect comment `( n -- n )` in the definition is a convention, not a requirement. But introduce it here, consistently, and explain why: it documents what the word expects and promises. Readers who form the habit now will thank themselves later.

---

### 3. `:` and `;` are sugar: the desugared form

**Purpose:** Show the underlying mechanism so the reader understands what `:` and `;` actually do.

**What to cover:**
- `:` and `;` are syntactic sugar for two more primitive operations: quotation and `def`.
- A quotation is a block of code wrapped in `[` and `]`. It doesn't execute immediately — it pushes the block itself onto the stack as a value.
- `def` takes a quotation and a name and binds them: it stores the quotation under that name.
- The desugared form of `: double 2 * ;` is:
  ```froth
  [ 2 * ] 'double def
  ```
  Read this as: "Push the quotation `[ 2 * ]` onto the stack. Push the name `double` (quoted with `'` to prevent immediate lookup). Call `def` to bind the quotation to that name."
- The two forms are exactly equivalent. The colon-semicolon syntax exists because it reads more naturally.
- Why show the desugared form?
  - It reveals that words are values. A word definition is just a binding of a name to a quotation.
  - It explains the `'` (tick) syntax the reader will see in error messages and in `see` output.
  - It sets up the slot model in the next subsection.

**Code example to include:**
Show both forms producing the same result:
```
froth> : double ( n -- n ) 2 * ;
froth> 5 double .
10
froth> [ 2 * ] 'triple def
froth> 5 triple .   \ wait — this defines triple as 2 *, so it would give 10 too; choose a clearer example
```

**Writer note on the example above:** Pick an example that makes the desugaring clear without confusion. Consider defining a different word with `def` so the reader can see both a `:` definition and a `def` definition coexist and work the same way. For instance, define `double` with `:`, define `square` with `[ dup * ] 'square def`, and show both work. (Confirm `dup` is available or choose an alternative that doesn't use stack shuffle words — actually, since `dup` is not taught yet in this chapter, use a simpler body or mention in a writer's note to revisit after chapter 04.)

**Writer note on `'` (tick):** The tick prefix prevents the following name from being looked up and executed immediately. Without it, `double def` would try to execute `double` (which might not exist yet) instead of passing the name to `def`. Explain this briefly — it's the kind of detail that causes confusion if skipped.

---

### 4. Slots: how Froth stores words

**Purpose:** Build the mental model that explains coherent redefinition.

**What to cover:**
- Every word name in Froth corresponds to a slot. A slot is a named container that holds a value.
- When you `def` a name, Froth creates or updates the slot for that name and puts the new value in it.
- When you call a word, Froth finds the slot for that name and calls whatever is in it at the moment of the call — not at the moment of definition.
- Draw this out clearly:
  - After `: double 2 * ;` — there is a slot named `double` containing the quotation `[2 *]`
  - After `: quadruple double double ;` — there is a slot named `quadruple` containing `[double double]`
  - `quadruple` does not contain a copy of `double`'s body. It contains a reference to the name `double`. When `quadruple` runs, it looks up `double` in its slot. Every time.
- This is the key property. It means slots are indirected: calling `double` inside `quadruple` always goes through the `double` slot, not through a snapshot of what `double` did when `quadruple` was defined.
- Contrast with Forth (briefly, for context): in traditional Forth, defining a word inlines a reference to the current body of each sub-word. Later redefinition of `double` does not affect previously defined callers. This was the source of subtle bugs. Froth's slot model eliminates this class of problem.

**Visual to describe:**
A diagram showing two slots side by side:
```
Slot: double         Slot: quadruple
┌─────────┐          ┌──────────────────┐
│ [2 * ]  │    ←—    │ [double double]  │
└─────────┘          └──────────────────┘
                          │       │
                   both look up 'double' slot at call time
```

**Writer note:** The slot model is the conceptual underpinning for everything in this chapter and pays forward into later chapters (snapshots, the REPL dictionary, etc.). Don't rush it. The diagram above is a rough description — the actual writer should create a clean version in whatever format the guide uses (ASCII art, SVG, or described for screenshot).

---

### 5. Calling words

**Purpose:** Make explicit what the reader has been doing implicitly.

**What to cover:**
- When you type a word name in the REPL (or in a definition), Froth:
  1. Looks up the slot for that name
  2. If the slot holds a quotation (a callable), calls it
  3. If the slot is empty or the name doesn't exist, signals an error
- This lookup happens at call time, every time. This is what makes redefinition safe.
- You can confirm a word exists and see its body with `see`:
  ```froth
  froth> see double
  : double ( n -- n ) 2 * ;
  ```
  The `see` output is the definition in colon-semicolon syntax, reconstructed from the stored quotation.

**Code example to include:**
```
froth> : double ( n -- n ) 2 * ;
froth> see double
: double ( n -- n ) 2 * ;
```

**Writer note:** The actual output of `see` depends on implementation. Verify exact format before publication. If `see` outputs the desugared form instead of colon-semicolon, note that in the text and explain the mapping.

---

### 6. Redefining words: coherent redefinition

**Purpose:** This is the payoff of the chapter. Show why the slot model makes Froth better than Forth for interactive development.

**What to cover:**

Walk through the full sequence as a narrative, not just a code dump:

Step 1 — Define `double`:
```froth
froth> : double ( n -- n ) 2 * ;
```

Step 2 — Define `quadruple` in terms of `double`:
```froth
froth> : quadruple ( n -- n ) double double ;
froth> 3 quadruple .
12
```
`3 quadruple` calls `double` twice: `3 → 6 → 12`. ✓

Step 3 — Redefine `double` to triple instead of double:
```froth
froth> : double ( n -- n ) 3 * ;
```
Note: we're keeping the name `double` even though it now triples. This is intentional — it makes the coherent redefinition more dramatic and obvious.

Step 4 — Call `quadruple` again without redefining it:
```froth
froth> 3 quadruple .
27
```
`3 quadruple` now calls the new `double` twice: `3 → 9 → 27`. The change propagated automatically.

- Explain: `quadruple` was not redefined. Its body still says `[double double]`. But because it looks up the `double` slot at call time, it automatically uses the new definition.
- This is coherent redefinition: when you change a word, every word that calls it immediately reflects the change.
- Contrast with Forth explicitly: in Forth, redefining `double` would not affect `quadruple` because Forth compiles a direct reference to the old `double` into `quadruple`'s body at definition time. The old `quadruple` would continue producing 12. Froth's behavior is the more useful one for interactive development.

**Writer note:** This example is carefully chosen to make the behavior concrete and unmistakable. `27` is distinctly not `12`, so the reader can't miss that something changed. Make sure the prose walks through the arithmetic — don't assume the reader will do it in their head.

---

### 7. Stack effect comments: the convention and why it matters

**Purpose:** Reinforce the convention from chapter 02 in the context of word definitions.

**What to cover:**
- The `( inputs -- outputs )` comment inside a definition is a convention for documentation. Froth does not enforce it — you can omit it and the word will still work.
- But it's worth writing because:
  - It forces you to think about what your word promises
  - Other people reading your code (or you, six months later) will understand the interface without reading the body
  - The VSCode extension uses it to display inline hints as you type
- Convention for stack effect labels:
  - Use short, descriptive names: `n` for a generic number, `a b` for two numbers, `flag` for a boolean, `addr` for a memory address
  - If a word produces a meaningfully named result, use a descriptive label: `( n -- doubled )` or `( n -- product )`
- Show the pattern consistently: write the stack effect right after the word name, before the body:
  ```froth
  : square ( n -- n² ) dup * ;
  ```
  (Note: confirm whether `dup` is safe to use in this chapter or whether to avoid it; if `perm` is the right tool and `dup` is deprecated, adjust the example. See chapter 04 writer note.)

**Writer note:** The question of whether to use `dup` here is a real tension. Chapter 04 introduces `perm` as the replacement for Forth's shuffle words, which includes `dup`. If the guide's position is that `dup` should not be taught, then this example needs to use `perm` syntax or choose a body that doesn't need stack duplication. Coordinate with the chapter 04 outline. A safe alternative: `: square-approx ( n -- product ) 2 * ;` — crude, but avoids the issue. Alternatively, acknowledge that `dup` exists as a Forth heritage word and use it here, then formally supersede it in chapter 04.

---

### 8. Exercises

**Purpose:** The reader practices defining words and predicting behavior after redefinition. Mental modeling solidifies here.

**Exercise 1 — Define and test:**
Define `: triple ( n -- n ) 3 * ;`
- Call `4 triple .` — what prints?
- Call `2 triple triple .` — what prints?
- Answers: 12; 18

**Exercise 2 — Compose words:**
Define `triple` as above. Then define `: sextuple ( n -- n ) triple triple ;`
- Call `2 sextuple .` — what prints? (Answer: 12)
- Redefine `triple` as `4 *`. Now call `2 sextuple .` — what prints without redefining `sextuple`? (Answer: 32)
- If the reader expected 12, ask them: what does `sextuple`'s body say? What does it look up when it runs?

**Exercise 3 — Stack effect prediction:**
Show these definitions without stack effect comments. Ask the reader to write the correct `( -- )` for each:
- `: increment ( ? ) 1 + ;` — Answer: `( n -- n )`
- `: add3 ( ? ) + + ;` — Answer: `( a b c -- sum )`
- `: print-and-discard ( ? ) . ;` — Answer: `( n -- )`

**Exercise 4 — `see` inspection:**
Define any word, then run `see wordname`. The reader should verify that what `see` reports matches what they defined.

**Writer note:** Exercises 1 and 2 are the most important. They directly test whether the reader has internalized coherent redefinition. If they can predict the output of exercise 2's redefine step without running it, they have genuinely understood the slot model. Consider adding a call-out box for this exercise: "If you got 32, you've got it."

---

## Key concepts introduced in this chapter

- Word: a named operation; defined with `: name body ;`
- Colon-semicolon syntax as sugar for `[ body ] 'name def`
- Quotations: `[ body ]` — a deferred, callable value
- `def`: binds a quotation (or any value) to a name slot
- `'name` (tick): a quoted name, passed as a value rather than looked up
- Slots: named containers that hold word definitions; looked up at call time
- Coherent redefinition: redefining a word propagates to all callers automatically
- `see wordname`: inspect a word's definition
- Stack effect comments as a documentation convention: `( inputs -- outputs )`

---

## Code examples (full list, for reference when writing)

1. `: double ( n -- n ) 2 * ;` defined, then `5 double .` → 10
2. `3 double .` → 6 (confirm the word is reusable)
3. The desugared form: `[ 2 * ] 'double def` — equivalent definition
4. `: quadruple ( n -- n ) double double ; 3 quadruple .` → 12
5. Redefine `double` to `3 *`, then `3 quadruple .` → 27 (coherent redefinition payoff)
6. `see double` showing the word's body
7. Three stack-effect comment exercises (define a word, write the correct `( -- )`)

---

## Connections to other chapters

- **Chapter 02 (The Stack):** Stack effect notation introduced there is used throughout this chapter. If the reader is uncertain about `( a b -- sum )` syntax, direct them back to chapter 02 section 4.
- **Chapter 04 (Perm and Named):** The exercises in this chapter may tempt the reader to ask "how do I use a value twice in one word without retyping it?" That requires stack duplication, which is where chapter 04 begins. At the end of this chapter, the writer can plant the seed: "Right now, each value can only be used once — it gets consumed. Chapter 04 introduces `perm`, which gives you fine-grained control over the stack and lets you do much more."
- **Chapter 00 (What is Froth?):** Chapter 00 described coherent redefinition as one of Froth's improvements over Forth. This chapter delivers the concrete demonstration of that claim.

---

## Navigation

[← Previous: The Stack](02-the-stack.md) | [→ Next: Perm and Named](04-perm-and-named.md)

# Perm and Named

_Froth replaces every stack shuffle word in Forth with a single primitive, `perm`. This chapter shows you how it works, then introduces FROTH-Named for when naming values is clearer than rearranging them._

---

## Outline and writing notes

This is the chapter where Froth stops feeling like Forth. The big idea is that instead of learning a zoo of shuffle words — `dup`, `swap`, `rot`, `over`, `nip`, `tuck`, and more — you learn one operation: `perm`. Everything else is defined on top of it. The reader's reward at the end of the chapter is seeing `core.froth` define the classic words in plain Froth, using `perm`. That payoff should feel satisfying, not anticlimactic, so build toward it carefully.

Chapter 03 planted a seed: "right now, values get consumed; chapter 04 is where you get control over that." Pick up that thread immediately in section 1.

The FROTH-Named section (sections 6–8) is shorter and lighter than the `perm` sections. Its job is to show that Named exists and when to reach for it — not to fully teach Named syntax. A motivated reader will keep going; others can come back when they need it.

Tone: the opening sections need to be honest about the problem. The Forth shuffle word zoo is genuinely annoying to learn, and the reader who has encountered Forth before will recognize the pain. Don't oversell the solution — just show it working and let the pattern speak.

---

## Subsections

### 1. The problem with stack shuffle words

**Purpose:** Establish why Forth's approach to stack manipulation is hard to learn and easy to get wrong, so the reader is primed to appreciate the replacement.

**What to cover:**
- In Forth (and many Forth-descendant languages), managing the stack means knowing a vocabulary of shuffle words: `dup` (duplicate top), `swap` (swap top two), `rot` (rotate top three), `over` (copy second to top), `nip` (drop second), `tuck` (copy top below second), `2dup`, `2swap`, `2drop`... and on.
- Each word does one specific rearrangement. To use any of them, you have to memorize its exact behavior, its stack effect, and when to reach for it.
- Writing a multi-step word often turns into a puzzle: "I need the value that's third from the top — do I `rot` and then `dup`, or `over` and then `swap`?" The shuffle pattern becomes an obstacle separate from the real logic.
- The real root cause: the stack is implicit. You can't refer to a value by name — you can only refer to it by position, which changes with every operation. Shuffle words are a symptom of working around that limitation with a fixed set of named rearrangements.
- Froth's answer: don't provide a fixed set of rearrangements. Provide one general operation that can express any rearrangement. That's `perm`.

**Writer note:** This section is short — half a page. Its only job is to establish the problem. Resist the urge to show all the Forth shuffle words in detail; the point is how many there are, not what each one does.

---

### 2. How `perm` works

**Purpose:** Give a precise, unambiguous explanation of `perm`'s mechanics before any examples.

**What to cover:**
- `perm` takes two things: a count `n` and a pattern `p[...]`.
- The count tells Froth how many items from the top of the stack to look at (and consume).
- The pattern describes the new arrangement of those items in terms of named labels. Labels are single lowercase letters: `a` refers to what was on top (index 0), `b` refers to what was one below top (index 1), `c` to index 2, and so on.
- Important: the pattern is written deepest-to-TOS (left to right). The last label in the pattern ends up on top of the stack when `perm` finishes.
- The count determines how many items are consumed. The pattern determines what gets pushed back, in what order, and how many times each item appears (including zero — dropping an item means omitting its label).
- Syntax: `n p[labels] perm` — the `p[...]` syntax is the pattern literal; `perm` is the word that executes it.
- Formally: items consumed = `n`; items produced = number of labels in pattern; each label can appear zero, one, or multiple times.

**Writer note:** The label convention (a = TOS, b = one below, etc.) is the single most important thing to get right. State it clearly, repeat it, and make it explicit in every example. Many readers will need to see it applied 3–4 times before it clicks.

---

### 3. Reading patterns: worked examples with stack traces

**Purpose:** Cement the mental model through five to six concrete examples, each with a full stack trace.

**What to cover:**

Walk through each example with: the expression, the stack before, the pattern decoded, and the stack after.

**Example 1 — drop: `1 p[] perm`**

Stack before: `[... x]` (x on top)
- Count is 1: consume 1 item. Label `a` = `x`.
- Pattern is empty: produce nothing.
- Stack after: `[...]` (x is gone)
- This is `drop`. Use it with: `5 1 p[] perm` → stack goes from `[5]` to `[]`.

**Example 2 — dup: `1 p[a a] perm`**

Stack before: `[... x]`
- Count is 1: consume 1 item. Label `a` = `x`.
- Pattern `[a a]`: push `a` then `a`. Both are `x`.
- Stack after: `[... x x]`
- This is `dup`. Use it with: `5 1 p[a a] perm` → `[5 5]`.

**Example 3 — swap: `2 p[a b] perm`**

Stack before: `[... x y]` (y on top)
- Count is 2: consume 2 items. Label `a` = `y` (TOS), `b` = `x`.
- Pattern `[a b]`: push `a` then `b`. Push `y`, then `x`.
- Stack after: `[... y x]` (was `x y`; now `y x`)
- This is `swap`. Use it with: `1 2 2 p[a b] perm` → `[2 1]`.

**Example 4 — over: `2 p[b a b] perm`**

Stack before: `[... x y]` (y on top)
- Count is 2: consume 2 items. Label `a` = `y`, `b` = `x`.
- Pattern `[b a b]`: push `b`, `a`, `b`. Push `x`, `y`, `x`.
- Stack after: `[... x y x]`
- This is `over`. Use it with: `3 5 2 p[b a b] perm` → `[3 5 3]`.

**Example 5 — nip: `2 p[a] perm`**

Stack before: `[... x y]`
- Count is 2, label `a` = `y`, label `b` = `x`.
- Pattern `[a]`: push only `a`. The value `b` (`x`) is discarded.
- Stack after: `[... y]`
- This is `nip` (drop the item one below top).

**Example 6 — custom rearrangement: `3 p[a c b a] perm`**

Stack before: `[... x y z]` (z on top)
- Count is 3: consume 3 items. Label `a` = `z`, `b` = `y`, `c` = `x`.
- Pattern `[a c b a]`: push `z`, `x`, `y`, `z`.
- Stack after: `[... z x y z]`
- This has no single Forth equivalent — you would need several shuffle words to express it. With `perm`, you just describe the result.

**Writer note:** Spend the most time on examples 2 and 3 (dup and swap). These are the ones readers will verify against their Forth knowledge and the ones that cement the label convention. Example 6 is the "aha" moment: show a rearrangement that would be awkward in Forth but is trivial with `perm`. End the section with a sentence like: "Any rearrangement you can imagine is just a pattern. There's nothing else to learn."

---

### 4. Building the standard library: how `core.froth` defines the classics

**Purpose:** Deliver the chapter's first major payoff — the familiar shuffle words are just `perm` with names.

**What to cover:**
- `core.froth` is Froth's standard library. It ships with the runtime and is loaded automatically.
- Every classic Forth shuffle word is defined in `core.froth` using `perm`. There is no special primitive behind `dup` or `swap` — they are ordinary Froth words.
- Present the full set of definitions as they actually appear in `core.froth`:

```froth
: dup  ( a -- a a )      1 p[a a] perm ;
: swap ( a b -- b a )    2 p[a b] perm ;
: drop ( a -- )          1 p[] perm ;
: over ( a b -- a b a )  2 p[b a b] perm ;
: rot  ( a b c -- b c a ) 3 p[b a c] perm ;
: -rot ( a b c -- c a b ) 3 p[a c b] perm ;
: nip  ( a b -- b )      2 p[a] perm ;
: tuck ( a b -- b a b )  2 p[a b a] perm ;
```

- Walk through `rot` and `-rot` using the label convention so the reader can verify the definitions match the documented stack effects.
- Emphasize: these definitions are readable. You can look at `3 p[b a c] perm` and work out what it does from first principles without memorizing a name.
- Note that `dup`, `swap`, etc. exist in Froth as named words for familiarity (if you know Forth, they're there), but the underlying mechanism is always `perm`. You can use `dup` if you prefer; it's just a word that calls `perm` with the right arguments.

**Writer note:** The `rot` example is worth walking through completely. `rot ( a b c -- b c a )` — stack before: `[x y z]` (z on top); label `a` = z, `b` = y, `c` = x; pattern `[b a c]` = push y, z, x; stack after: `[y z x]`. That matches the stack effect comment. Show the algebra. Readers who follow this will understand the convention deeply.

---

### 5. When perm patterns get complex: the case for named stack frames

**Purpose:** Be honest about `perm`'s limits and motivate FROTH-Named without disparaging `perm`.

**What to cover:**
- `perm` is powerful but has a scaling problem: when a word needs to reference several values multiple times at different points in its body, `perm` patterns can pile up and become hard to read.
- Consider a word that takes three values `a`, `b`, `c` and computes `(a + b) * (b - c)`. With only `perm`, you need careful pattern planning every time you want to reuse a value. Each `perm` call is local — it tells you nothing about the intent.
- The names in a `perm` pattern (`a`, `b`, `c`) are ephemeral: they exist only in the pattern literal and have no connection to anything outside it.
- For short words — one shuffle, then computation — `perm` is exactly right. For longer words, where the same value is needed in several places, naming the values once and referring to them by name is clearer.
- This is what FROTH-Named provides.

**Writer note:** Keep this section tight — two to three paragraphs. Its job is to motivate Named, not to demonstrate that perm is bad. Perm is great; Named is for when the problem is bigger than perm handles well. Avoid phrasing that implies perm is a workaround.

---

### 6. Introducing profiles

**Purpose:** Explain the profile concept before introducing FROTH-Named specifically.

**What to cover:**
- Froth has a core language and optional extensions called profiles. A profile adds new syntax and/or semantics without changing the core.
- You activate a profile with a declaration at the top of your file (or in the REPL). Words defined before the declaration don't have access to profile features; words defined after do.
- Profiles exist because Froth runs on microcontrollers with limited memory. You include what you need and leave out what you don't. On a device with 8 KB of RAM, the difference between a 2 KB footprint and a 3 KB footprint matters.
- The profile system also means features can be experimented with and evolved independently of the core language.
- For this guide, you'll encounter two profiles: FROTH-Named (this chapter) and others in later chapters. Each profile is introduced when it becomes relevant.

**Writer note:** This section exists to give "profile" a definition. It's short — one tight page at most. Don't enumerate all profiles here; that's reference material.

---

### 7. FROTH-Named basics

**Purpose:** Show what Named looks like and how it replaces `perm` for multi-reference words.

**What to cover:**
- To use FROTH-Named, declare it at the top of a file:
  ```froth
  #profile FROTH-Named
  ```
- With Named active, stack-effect comments in word definitions become bindings. Instead of describing the inputs for documentation, the names in the comment become variables you can reference anywhere in the word's body.
- Syntax: write a stack-effect comment with names. Those names are then usable as words within the definition — each one pushes its bound value onto the stack.
- Example: a word `hyp-squared ( a b -- n )` that computes `a² + b²`:

**Without Named (perm-only version):**
```froth
: hyp-squared ( a b -- n )
  2 p[b a b a] perm   \ stack: a b a b
  * rot *             \ a² is under b², need to reorganize
  + ;                 \ this gets messy fast
```
(Writer: work out the exact perm-only sequence and verify it; the above is illustrative. The key is that it takes planning and is not self-documenting.)

**With FROTH-Named:**
```froth
#profile FROTH-Named
: hyp-squared ( a b -- n )
  a a * b b * + ;
```
- `a` and `b` are bound to the inputs. Each mention of `a` pushes the value that was passed as `a`. The word's body reads like a mathematical expression.
- Walk through the stack trace: entering `hyp-squared` with inputs 3 and 4 on the stack — `a` = 4 (TOS), `b` = 3; `a a *` pushes 16; `b b *` pushes 9; `+` gives 25. Stack: `[25]`.
- Show the side-by-side without comment — let the reader see that the Named version is shorter and its intent is obvious.

**Writer note:** The binding order matters: `a` = TOS, `b` = one below, matching the same convention as `perm` labels. State this explicitly. A reader who misses this will write bugs. The `hyp-squared` example was chosen because it requires both inputs twice each; that's exactly where Named earns its keep.

---

### 8. When to use `perm` vs. Named

**Purpose:** Give the reader a practical heuristic so they don't have to think about the tradeoff each time.

**What to cover:**
- Use `perm` when:
  - The rearrangement is a one-shot: you just need to reorganize values once before computation.
  - The word is very short (two to four words in the body).
  - You're defining a utility word that is inherently about stack manipulation (like `dup`, `swap`, or a custom shuffle).
- Use Named when:
  - Any input is referenced more than once.
  - The word has conditional branches or multiple computational paths where tracking positions mentally becomes difficult.
  - The word's logic is better described in terms of what values mean than how they're positioned.
- The rule of thumb: if you're reaching for `perm` more than once in a word's body just to bring a value back into position, switch to Named.
- Both coexist: a project can have some words using `perm` and others using Named. Use what serves the code.

**Code comparison to include:**
Show the same non-trivial word written both ways, and ask the reader which they'd prefer to maintain. The point is not that one is better; it's that each has a natural domain.

**Writer note:** This section should end on a practical note, not a philosophical one. Give the heuristic clearly, illustrate it briefly, and move on. Don't oversell Named — some writers get excited about the elegance of explicit naming and undersell the simplicity of `perm` for short words. Both deserve respect.

---

### 9. Exercises

**Purpose:** The reader applies `perm` patterns directly and builds the decoding reflex.

**Exercise 1 — Decode the pattern:**
Given the stack `[10 20 30]` (30 on top), what is the stack after `3 p[c b] perm`?
- Label assignment: `a` = 30, `b` = 20, `c` = 10.
- Pattern `[c b]` pushes 10, then 20.
- Answer: `[10 20]` (30 is dropped; 10 is on bottom, 20 is on top).

**Exercise 2 — Write the pattern:**
Write a `perm` expression that duplicates the second-from-top value to the top, leaving the original in place. (This is `over`.) Start with `[x y]` on the stack.
- Answer: `2 p[b a b] perm`

**Exercise 3 — Verify a definition:**
Look at `tuck` in `core.froth`: `2 p[a b a] perm`. Manually trace it with `[3 5]` (5 on top) and verify that you get `[5 3 5]`.
- Labels: `a` = 5, `b` = 3. Pattern `[a b a]` = push 5, 3, 5. Stack: `[5 3 5]`. TOS is 5. ✓

**Exercise 4 — Named version:**
Rewrite this perm-only word using FROTH-Named:
```froth
: sum-of-squares ( a b -- n )
  2 p[b a b a] perm * rot * + ;
```
(Writer: verify the perm sequence before publication. The reader's Named version should be `a a * b b * +`.)

**Writer note:** Exercise 4 bridges the two halves of the chapter. A reader who can rewrite the perm-only version as Named has understood both mechanisms and the relationship between them. Consider a callout: "If you can do exercise 4, you're ready for everything that follows."

---

## Key concepts introduced in this chapter

- Stack shuffle words (the Forth zoo): `dup`, `swap`, `rot`, `over`, `nip`, `tuck` — briefly, as the problem to solve
- `perm`: the single general stack permutation primitive
- Pattern syntax: `n p[labels] perm` — count, pattern, operation
- Label convention: `a` = TOS (index 0), `b` = one below (index 1), `c` = index 2
- Pattern is deepest-to-TOS (left to right); labels can be repeated or omitted
- `core.froth`: the standard library, which defines all shuffle words using `perm`
- Profiles: optional language extensions activated per-file
- `#profile FROTH-Named`: activates named stack bindings
- FROTH-Named: stack-effect comment names become usable bindings in the word body
- Heuristic for choosing `perm` vs. Named

---

## Code examples (full list, for reference when writing)

1. `1 p[] perm` — drop, with before/after stack trace
2. `1 p[a a] perm` — dup, with trace (`5` → `[5 5]`)
3. `2 p[a b] perm` — swap, with trace (`1 2` → `[2 1]`)
4. `2 p[b a b] perm` — over, with trace (`3 5` → `[3 5 3]`)
5. `2 p[a] perm` — nip, with trace
6. `3 p[a c b a] perm` — custom rearrangement with no Forth equivalent
7. Full `core.froth` definitions for `dup`, `swap`, `drop`, `over`, `rot`, `-rot`, `nip`, `tuck`
8. Manual trace of `rot` decoding (`3 p[b a c] perm`)
9. `hyp-squared` implemented with `perm` only (messy) vs. FROTH-Named (clean)
10. Side-by-side comparison of a multi-reference word in both styles

---

## Connections to other chapters

- **Chapter 02 (The Stack):** Chapter 02 deliberately withheld stack shuffle words and pointed forward here. Pick up that thread in section 1 — the reader may have been waiting for this answer since chapter 02.
- **Chapter 03 (Words and Definitions):** The standard library words (`dup`, `swap`, etc.) that appear in chapter 03 examples (or were held back from them) are defined here. If chapter 03 mentioned that `dup` exists but deferred explanation, deliver on that promise in section 4.
- **Chapter 05 (Quotations and Control Flow):** Combinators like `dip` and `keep` use stack manipulation internally and are defined partly in terms of `swap` and `perm`. When chapter 05 presents those definitions, the reader will be able to read them.
- **Chapter 06 (Error Handling):** `catch` takes a quotation, which requires the quotation to be on top of the stack. Pattern literacy from this chapter helps the reader understand why `catch` is spelled the way it is.

---

## Navigation

[← Previous: Words and Definitions](03-words-and-definitions.md) | [→ Next: Quotations and Control Flow](05-quotations-and-control.md)

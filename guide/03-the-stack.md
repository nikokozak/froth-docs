# The Stack

_Everything in Froth lives on the stack. This chapter shows you how to read it, fill it, drain it, and what to do when it pushes back._

---

## Outline and writing notes

This is the most important conceptual chapter in the guide. The reader already has the REPL open from chapter 01. Now they need a solid mental model for the stack — not just "it works" but "I can predict what will be on it after any sequence of words."

The chapter earns its length by building the model in layers: first pushing, then consuming, then reading the notation, then working through arithmetic, then breaking it on purpose. The exercises at the end are load-bearing: a reader who can do the mental stack traces has genuinely internalized the model.

Tone: patient and methodical in the walkthrough sections; more conversational in the transition paragraphs between subsections. Use the word "you" throughout. When showing stack states, be obsessively consistent in format so the reader can develop pattern recognition.

---

## Subsections

### 1. The stack is where everything lives

**Purpose:** Build the mental model before any code.

**What to cover:**
- The stack is a column of values. New values land on the top. Values are consumed from the top. There is no way to reach "past" the top to grab something below — values come off in the reverse order they went on. This is a LIFO (last-in, first-out) structure, but the chapter doesn't need to use that acronym unless it helps.
- Use a visual metaphor: a stack of cards, or a column of boxes. When you push a number, a new box appears on top. When a word consumes a value, the top box disappears.
- Clarify that "top" in Froth is the most recently pushed value. Some displays show the stack top on the right (like `[42, 7]` where `7` is top); others show it on the left. Note which convention the REPL uses and be consistent throughout.
- The stack persists across lines in the REPL. Each Enter keystroke executes words and potentially modifies the stack, but the stack doesn't reset between lines. This surprises some people.

**Writer note:** Draw or describe a simple ASCII diagram of the stack. Even a modest visual — a box labeled "TOP" with an arrow and a few values below — makes this subsection much stronger. Example concept:

```
         ┌───┐
TOP  →   │ 7 │
         ├───┤
         │42 │
         └───┘
```

---

### 2. Pushing values: numbers and how they land

**Purpose:** Establish that typing a literal number is itself a complete operation.

**What to cover:**
- In Froth, a bare number is a word whose entire effect is to push that value onto the stack.
- Walk through pushing several values one at a time, showing the stack state after each:
  ```
  froth> 10
  Stack: [10]
  froth> 20
  Stack: [10, 20]
  froth> 30
  Stack: [10, 20, 30]
  ```
- The stack grows. The most recently pushed value is always on top.
- You can push multiple numbers on a single line; they execute left to right:
  ```
  froth> 1 2 3
  Stack: [1, 2, 3]
  ```
- Note that negative numbers are also literals: `-5` pushes the value -5.

**Writer note:** Keep this section brief. Its job is to establish the mental model of "literals push." The reader probably figured this out in chapter 01; now you're making it explicit.

---

### 3. Consuming values: how words take from the stack

**Purpose:** Show the other side of the equation — words remove values from the stack.

**What to cover:**
- Words that do computation consume values from the top of the stack and push results back.
- Walk through `+` step by step:
  ```
  froth> 3 4
  Stack: [3, 4]
  froth> +
  Stack: [7]
  ```
  `+` removed both `3` and `4` and left `7`.
- Emphasize: the inputs are gone. If you need a value after an operation, you have to plan for that (chapter 04 on `perm` covers this).
- Contrast `.` (dot) with `.s`:
  - `.` consumes the top value and prints it — the value leaves the stack
  - `.s` prints all values without consuming any — the stack is unchanged
- Words can produce more values than they consume, fewer, or none. The difference is the word's "stack effect."

**Writer note:** The contrast between `.` and `.s` is worth being careful about here, because readers will use both constantly. A small table or side-by-side example would help.

---

### 4. Stack effects notation

**Purpose:** Teach the reader to read and write `( inputs -- outputs )` comments.

**What to cover:**
- Stack effects are written as a comment describing what a word does to the stack.
- The syntax is: `( before -- after )` where "before" is the stack state before the word runs (top on the right) and "after" is the state after.
- Examples to present and explain:
  - `+` has stack effect `( a b -- sum )` — takes two values, leaves one
  - `.` has stack effect `( n -- )` — takes one value, leaves nothing (side effect: prints it)
  - `.s` has stack effect `( -- )` — takes nothing, leaves nothing (side effect: displays the stack)
  - `dup` has stack effect `( n -- n n )` — takes one value, leaves two copies
- The names in the notation (`a`, `b`, `sum`, `n`) are just descriptive labels; they don't do anything. Good names help document intent.
- Convention: write a stack effect comment immediately after the word name when defining words, before the body. Example: `: double ( n -- n ) 2 * ;`
- This notation appears everywhere in the Froth standard library. Getting comfortable reading it early pays dividends.

**Writer note:** Spend enough time here that the reader can look at any stack effect comment in later chapters and understand it immediately. Don't rush past this. The reader will reference this mental model for the rest of the guide.

---

### 5. Arithmetic: `+`, `-`, `*`, `/mod`

**Purpose:** Give the reader a set of real words to practice with, building fluency.

**What to cover:**

For each operator, show: the stack effect notation, a concrete example with before/after stack states, and one sentence about what it does.

- `+` ( a b -- sum ) — adds top two values
  ```
  Stack before: [3, 4]    →    Stack after: [7]
  ```
- `-` ( a b -- diff ) — subtracts b from a (note: order matters! `3 4 -` gives `-1`, not `1`; explain why)
  ```
  Stack before: [3, 4]    →    Stack after: [-1]
  ```
  This trips up newcomers. Spell out: a is below b on the stack; `a - b` means `3 - 4`.
- `*` ( a b -- product ) — multiplies top two values
  ```
  Stack before: [3, 4]    →    Stack after: [12]
  ```
- `/mod` ( a b -- remainder quotient ) — integer division, leaves both remainder and quotient
  ```
  Stack before: [10, 3]    →    Stack after: [1, 3]
  ```
  Note: `/mod` leaves TWO values. This is unusual and worth pausing on. The remainder (`1`) is below the quotient (`3`) on the stack.

**Extended example — step-by-step trace of `3 4 + 2 *`:**

This is the chapter's main extended code example. Walk through every word:

```
froth> 3
Stack: [3]

froth> 4
Stack: [3, 4]

froth> +
Stack: [7]

froth> 2
Stack: [7, 2]

froth> *
Stack: [14]
```

Then show the same expression on one line:
```
froth> 3 4 + 2 *
Stack: [14]
```

Explain: Froth processes words left to right. The two forms are identical because the REPL accumulates words before executing them at the newline (verify this claim against actual REPL behavior and adjust if needed).

**Writer note:** The subtraction order is one of the classic confusion points. Don't just note it in passing — give the reader an intuition for why it works this way. Hint: it's consistent with the left-to-right reading. If you write `10 3 -`, you're saying "take 10, take 3, subtract" — and the subtraction is `10 - 3 = 7`, which reads left to right. The "first operand" is under the "second operand" on the stack.

---

### 6. Seeing the stack: `.s` and `.`

**Purpose:** Make sure the reader is fluent with their two most important inspection tools.

**What to cover:**
- Revisit `.s` (print-stack, non-destructive):
  - Shows all values from bottom to top
  - Stack is unchanged afterward
  - Use this whenever you want to inspect state without committing to consuming anything
  - Example: after `3 4 + 2 *`, `.s` shows `[14]` and the stack still has `14` on it
- Revisit `.` (dot, destructive print):
  - Takes the top value off the stack and prints it
  - Use this when you're done with a value and want to see it
  - Stack effect: `( n -- )`
  - Example:
    ```
    froth> 42 .
    42
    Stack: []
    ```
- Contrast with a side-by-side table:

| Word | Prints? | Removes top? | Stack effect |
|------|---------|--------------|--------------|
| `.s` | Yes (all) | No | ( -- ) |
| `.`  | Yes (top) | Yes | ( n -- ) |

**Writer note:** The table format above is a suggestion; use whatever the guide's markdown style prefers. The key is that the reader should be unable to confuse these two words after this section.

---

### 7. What happens when things go wrong: stack underflow

**Purpose:** Teach the reader what errors look like and that they're recoverable.

**What to cover:**
- Stack underflow occurs when a word tries to consume more values than exist on the stack.
- Example: start with an empty stack (or a stack with one value) and run `+`:
  ```
  froth> 5 +
  Error: stack underflow
  Stack: []
  ```
  (Show the actual error message the REPL produces — verify exact wording before publication.)
- After the error, the REPL recovers. The session is not lost. You can keep typing.
- Emphasize this is different from Forth, where a bad stack operation could corrupt the session. In Froth, errors are safe to encounter. The reader should not be afraid of them.
- Other common error types to briefly mention:
  - Unknown word: typing a word that doesn't exist
  - Type mismatch: if Froth has typed values (confirm with language spec; skip if not applicable)

**Code example to include:**
Triggering a stack underflow, seeing the error message, and then successfully continuing:
```
froth> +
Error: stack underflow
froth> 3 4 +
Stack: [7]
```

**Writer note:** The recovery story is important. Don't present errors as failures; present them as feedback. The REPL is a conversation partner, and errors are part of that conversation.

---

### 8. Exercises

**Purpose:** The reader has to do mental stack tracing to genuinely internalize the model. Don't skip this section. These exercises are the chapter's payoff.

**Format:** Present each expression, ask the reader to predict the final stack state before running it. Then they type it and check. Encourage the reader to work through each one on paper first.

**Exercises to include (6 recommended):**

1. `5 3 -`
   _Prediction prompt:_ "What's on the stack, and what value is it?"
   _Answer:_ Stack: [2]

2. `2 3 4 + *`
   _Prediction prompt:_ "How many values are on the stack? What are they?"
   _Answer:_ Stack: [14] (because `3 4 +` → `7`, then `2 7 *` → `14`)

3. `10 3 /mod`
   _Prediction prompt:_ "How many values does `/mod` leave? What are they, and what order?"
   _Answer:_ Stack: [1, 3] (remainder 1, quotient 3; quotient is on top)

4. `1 2 3 + +`
   _Answer:_ Stack: [6]

5. `7 .`
   _Prediction prompt:_ "What gets printed? What's left on the stack?"
   _Answer:_ Prints `7`; stack is empty afterward

6. `3 4 + .s .`
   _Prediction prompt:_ "What does `.s` display? What does `.` do?"
   _Answer:_ `.s` displays `[7]` without consuming; `.` prints `7` and stack is empty

**Writer note:** After the exercises, include a brief "how did you do?" paragraph. Reassure the reader that getting some wrong is expected and that running the expressions to check is exactly the right thing to do. The REPL is the answer key.

---

## Key concepts introduced in this chapter

- The stack as a LIFO structure; top is most recently pushed
- Pushing values: number literals are words that push
- Consuming values: words remove inputs and push outputs
- Stack effect notation: `( inputs -- outputs )`
- Arithmetic words: `+`, `-`, `*`, `/mod` — with correct operand order
- `.s` — non-destructive stack display
- `.` — destructive print (consumes top)
- Stack underflow: what it looks like and that the session survives it

---

## Code examples (full list, for reference when writing)

1. Pushing `10`, `20`, `30` one at a time, stack state after each
2. Pushing `1 2 3` on one line, stack shows `[1, 2, 3]`
3. `3 4 +` consuming both and leaving `[7]`
4. `.` vs `.s` side-by-side demonstration
5. Step-by-step trace of `3 4 + 2 *` — the chapter's main extended example
6. `/mod` example: `10 3 /mod` → `[1, 3]` (two values on stack)
7. Stack underflow error from `+` on empty or single-value stack, then recovery
8. Subtraction order: `3 4 -` → `[-1]`, explained

---

## Connections to other chapters

- **Chapter 00 (What is Froth?):** Chapter 00 introduced the stack at a high level; this chapter makes it precise. Writers can cross-reference the `3 4 + 2 * dup +` example from chapter 00 to show the reader they already saw this in action.
- **Chapter 01 (Getting Started):** The reader used `.s` and `.` in chapter 01 without a full explanation. This chapter delivers that explanation.
- **Chapter 03 (Words and Definitions):** The stack effect notation introduced here is the primary way to document word definitions in chapter 03. Make sure the reader leaves this chapter comfortable with the `( a b -- result )` syntax.
- **Chapter 04 (Perm and Named):** Chapter 02 deliberately does not teach `dup`, `swap`, `over`, or `drop`. Those are Forth's stack shuffle words. In Froth, `perm` replaces all of them. If the reader asks "but how do I use a value twice without consuming it?", acknowledge the question and point forward to chapter 04 rather than teaching the shuffle vocabulary that `perm` supersedes.

---

## Navigation

[← Previous: Getting Started](01-getting-started.md) | [→ Next: Words and Definitions](03-words-and-definitions.md)

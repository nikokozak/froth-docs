
_Push some numbers, inspect the stack, and feel the feedback loop for the first time._

---

## Outline and writing notes

This is the reader's first hands-on session. They already have a REPL prompt from the installation chapter. Now they get to use it. Write this as a guided walkthrough, one line at a time, explaining what happens after each entry. Don't rush it. The reader should finish this chapter feeling like they understand what the stack is at a high level, even though the next chapter goes deeper.

Tone: warm and direct. Someone sitting next to them at a desk, patient, specific, and quick to celebrate the small wins.

---

## Subsections

### 1. Your first session

**Purpose:** The payoff. Get numbers on the stack, use `.s`, feel the feedback loop.

**Walkthrough sequence to write:**

Step 1 — Push a number. Type `42` and press Enter.
```
froth> 42
Stack: [42]
```
Explain: the number went onto the stack. The stack now has one item.

Step 2 — Push another number.
```
froth> 7
Stack: [42, 7]
```
The stack grows. `7` is now on top.

Step 3 — Use `.s` to explicitly inspect the stack without consuming it.
```
froth> .s
[42, 7]
```
Explain: `.s` is "print stack." It shows you what's there without removing anything. This is your best friend for understanding what's happening.

Step 4 — Print and consume the top value with `.` (dot).
```
froth> .
7
Stack: [42]
```
Explain: `.` (dot, pronounced "print") takes the top value off the stack and displays it. The stack now has one item again.

Step 5 — See the available words.
```
froth> words
... (a list of all defined words appears) ...
```
Explain: `words` lists every word that exists in the current session. As you define new words in later chapters, they'll show up here.

**Writer note:** The display format for the stack should match whatever the actual REPL outputs. Verify before publication.

---

### 2. What just happened

**Purpose:** Bridge back to chapter 01's mental model. Reinforce the "stack is the connective tissue" idea with the concrete things they just typed.

**What to cover:**
- Remind them: every number they typed went onto the stack. Words take values off the stack and may put new ones back. This is the whole model.
- Point forward: chapter 03 goes deep on the stack. Chapter 04 shows how to define their own words. For now, the important thing is that the feedback loop is real — they typed something, the chip (or their computer) responded immediately.
- Acknowledge the feeling: the REPL feels strange at first. That strangeness fades within a few sessions.

**Writer note:** Keep this short — two to four paragraphs. A breath, not a lecture.

---

## Key concepts introduced in this chapter

- The REPL and the feedback loop (type → execute → see result)
- The stack as a container for values (numbers pushed, numbers consumed)
- `.s` — inspect the stack without consuming it
- `.` — print and consume the top value
- `words` — list all defined words in the session

---

## Connections to other chapters

- **Chapter 01 (What is Froth?):** This chapter makes chapter 01's abstract descriptions concrete.
- **Chapter 03 (The Stack):** Everything introduced here is treated casually; chapter 03 goes deep.

---

## Navigation

[← Previous: What is Froth?](01-what-is-froth.md) | [→ Next: The Stack](03-the-stack.md)

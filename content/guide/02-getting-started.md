---
title: "Getting Started"
weight: 2
---

You have a REPL prompt. Type `42` and press Enter.

```
froth> 42
Stack: [42]
```

The number `42` is now on the stack. The REPL shows you the stack state after every line, so you always know what you're working with.

Push another number.

```
froth> 7
Stack: [42, 7]
```

The stack has two values. `42` went on first, then `7` landed on top of it. The rightmost value in the display is always the top of the stack.

Type `.s` and press Enter.

```
froth> .s
[42, 7]
```

`.s` prints the entire stack without changing it. The stack still has both values. This is the word you'll use most often while learning Froth, because it shows you what's going on without disturbing anything.

Type `.` (a single dot) and press Enter.

```
froth> .
7
Stack: [42]
```

`.` takes the top value off the stack and prints it. `7` appeared on screen, and the stack went back to holding just `42`. Unlike `.s`, this word consumes what it prints.

One more. Type `words` and press Enter.

```
froth> words
... (a list of all defined words) ...
```

`words` shows every word that exists in your current session. Right now, that's the built-in vocabulary. As you define your own words in later chapters, they'll appear in this list alongside the primitives.

## What you just learned

Every number you typed went onto the stack. Every word you typed did something with the stack. Numbers push values on. Words consume values, produce side effects, or both. `.s` showed you the stack without touching it. `.` showed you the top value and removed it. This is the entire model: values go on, words act on them, and the REPL shows you the result after every line.

The stack is covered in depth in the next chapter. Word definitions come after that. For now, the thing to notice is the feedback loop. You typed something, and the response was immediate. There was no file to save, no build to run, no program to restart. The REPL is a conversation with the machine, and it answers on every line.

If the interaction feels unfamiliar, that's normal. The next chapter introduces arithmetic and shows how to read `3 4 +` one stack step at a time.

[Previous: What is Froth?](01-what-is-froth.md) | [Next: The Stack](03-the-stack.md)

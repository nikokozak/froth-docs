# What is Froth?

Froth is a programming language for microcontrollers. It gives you a small set of primitives, a stack, and a REPL that runs on the hardware itself. You type a word, the chip executes it, and you see the result. From there, you define new words in terms of old ones, building up a vocabulary that does exactly what you need. There is no compile step. There is no reflash cycle. You and the hardware are in direct conversation.

## Where Froth comes from

Froth descends from Forth, a language created by Charles Moore in the early 1970s. Forth was radical for its time. While other languages required you to write a complete program, compile it, and load it onto the target machine, Forth let you type a command and watch it run immediately. You could modify a running system without resetting it. For people programming telescopes, industrial controllers, and early microprocessors, this was transformative. The feedback loop went from minutes to seconds.

Forth got several things right, and those things still matter. It was tiny. The entire system fit in kilobytes, not megabytes. It was interactive. You built your program incrementally, testing each piece as you wrote it. And it was close to the metal. Forth gave you direct access to memory, I/O ports, and hardware registers without layers of abstraction in between.

But Forth also had real problems. If you defined a word and used it inside other words, then later redefined it, the old callers still pointed to the old definition. This created subtle, hard-to-find bugs. Errors were harsh: a bad memory access or stack underflow could crash your session and lose everything you'd built. And because Forth's semantics were so dynamic and implicit, tooling couldn't do much to help you. No editor could reliably autocomplete your words or catch your mistakes, because the language didn't give tools enough information to reason about.

Froth keeps what Forth got right and fixes what it got wrong. Redefinition in Froth is coherent: when you change a word, every reference to it follows the new definition. Errors are recoverable, so a mistake at the REPL doesn't destroy your session. And the language is designed from the ground up to support tooling, with enough structure that a VSCode extension can understand your code as you write it. You don't need to know Forth to use Froth. The heritage matters for understanding *why* Froth works the way it does, but it's not a prerequisite.

## How Froth thinks

Everything in Froth operates on a stack. When you type a number, it goes onto the stack. When you type a word, it takes values from the stack, does something with them, and pushes results back. The stack is the connective tissue between every operation.

Here's what that looks like:

```froth
3 4 +
\ Stack: [7]

2 *
\ Stack: [14]

dup +
\ Stack: [28]
```

The number `3` goes onto the stack. Then `4` goes onto the stack. The word `+` takes both of them off, adds them, and pushes `7`. Then `2` goes on, and `*` multiplies the top two values to produce `14`. The word `dup` duplicates the top value, giving you two copies of `14`, and `+` adds them together to give `28`. Each word does one thing, consumes its inputs, and produces its output.

You might notice that the operator comes after the operands, not between them. This is called postfix notation. Instead of writing `3 + 4`, you write `3 4 +`. It feels unfamiliar at first, but it has a useful property: there is no ambiguity about order of operations and no need for parentheses. The code reads left to right, one word at a time, and each word acts on whatever is currently on the stack.

This style of programming has a name: concatenative. You compose behavior by placing words next to each other. A sequence of words is itself a program. There are no argument lists, no commas, no function call syntax. You push data, and words transform it. Larger programs are built by defining new words that combine existing ones.

## What you can do with it

The development loop works like this: you plug an ESP32 into your computer, open VSCode, and connect to the board over serial. A REPL prompt appears, and you're talking directly to the microcontroller. There's no simulator sitting between you and the hardware.

You start defining words. Maybe a word that sets a GPIO pin high, another that waits 200 milliseconds, another that combines them into a blink pattern. Each word runs the moment you define it. If the timing looks wrong, you redefine the word with different values. The next time anything calls that word, it uses the new version. You don't reboot. You don't reflash. The change propagates through your entire vocabulary because Froth's redefinition is coherent by design.

When you've built up a session you want to keep, you take a snapshot. This saves your words and their definitions to flash memory. Pull the power cable, plug it back in a week later, and your vocabulary is still there, ready to use. Snapshots turn the REPL from a scratch pad into persistent storage for your programs. The Froth CLI and VSCode extension handle the connection, flashing, and file management, so you can focus on the code rather than the plumbing.

## How this guide works

This guide assumes no knowledge of Forth or stack-based programming. It starts with getting Froth installed and connected to a board, then teaches you the stack, word definitions, and the `perm` primitive that makes stack manipulation expressive instead of cryptic. Each chapter builds on the previous one, and by chapter 08 you'll be reading sensors and toggling pins from words you wrote yourself.

[Next: Getting Started](01-getting-started.md)

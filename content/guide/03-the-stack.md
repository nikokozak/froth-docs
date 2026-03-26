---
title: "The Stack"
weight: 3
---

The stack is a column of values. New values land on the top. Words consume values from the top. There is no way to reach past the top and grab something buried below. Values come off in the reverse order they went on.

```
         ┌───┐
TOP  →   │ 7 │
         ├───┤
         │42 │
         └───┘
```

In this diagram, `42` was pushed first and `7` was pushed second. If a word consumes a value, it takes `7`. Then the next consume takes `42`. The most recent value is always the one that goes first. The REPL displays the stack as a list with the top on the right: `[42, 7]` means `42` is on the bottom and `7` is on top.

One thing that surprises some people: the stack persists across lines. Pressing Enter executes whatever you typed, but it doesn't clear the stack. Values you pushed three lines ago are still there unless something consumed them.

## Pushing values

A bare number is a complete operation. Its entire effect is to push that value onto the stack.

```
froth> 10
Stack: [10]
froth> 20
Stack: [10, 20]
froth> 30
Stack: [10, 20, 30]
```

Each number lands on top of what's already there. You can push several numbers on a single line, and they execute left to right:

```
froth> 1 2 3
Stack: [1, 2, 3]
```

Negative numbers work the same way. `-5` pushes the value -5.

## Consuming values

Words that do computation take values off the top of the stack and push results back. Here is `+`:

```
froth> 3 4
Stack: [3, 4]
froth> +
Stack: [7]
```

`+` removed both `3` and `4` from the stack and left `7` in their place. The inputs are gone. If you needed `3` or `4` after the addition, you'd have to plan for that before calling `+`. (Chapter 05 introduces `perm`, which gives you a clean way to do this.)

The word `.` also consumes. It takes the top value, prints it, and leaves nothing behind:

```
froth> 42 .
42
Stack: []
```

By contrast, `.s` consumes nothing. It displays the stack and leaves it untouched:

```
froth> 10 20
Stack: [10, 20]
froth> .s
[10, 20]
Stack: [10, 20]
```

The difference matters. Use `.s` when you want to inspect. Use `.` when you're done with a value.

| Word | What it prints | Removes top? | Stack effect |
|------|---------------|--------------|--------------|
| `.s` | All values    | No           | `( -- )`     |
| `.`  | Top value     | Yes          | `( n -- )`   |

## Stack effects notation

Every word in Froth has a stack effect: a description of what it takes from the stack and what it leaves behind. The notation looks like this:

```
( before -- after )
```

The left side of `--` lists what the word consumes (top of stack on the right). The right side lists what it produces. A few examples:

- `+` has stack effect `( a b -- sum )`. It takes two values and leaves one.
- `.` has stack effect `( n -- )`. It takes one value and leaves nothing. The side effect is printing.
- `.s` has stack effect `( -- )`. It takes nothing and leaves nothing. The side effect is displaying the stack.
- `dup` has stack effect `( a -- a a )`. It takes one value and leaves two copies.

The names inside the parentheses (`a`, `b`, `sum`, `n`) are labels, not syntax. They exist to help you read the effect. Good labels communicate intent: `( addr len -- )` tells you more than `( a b -- )`.

When you define your own words, convention is to write the stack effect as a comment right after the name:

```froth
: double ( n -- n ) 2 * ;
```

This notation appears throughout the Froth standard library and in every chapter from here on. If you can read `( a b -- sum )` and understand that the word eats two values and produces one, you have what you need.

## Arithmetic

Froth has four arithmetic words. Each one consumes its inputs and pushes its result.

**`+` ( a b -- sum )** adds the top two values.

```
froth> 3 4 +
Stack: [7]
```

**`-` ( a b -- diff )** subtracts the top value from the one below it.

```
froth> 10 3 -
Stack: [7]
```

The order matters here, and it trips people up at first. When you type `10 3 -`, the `10` goes on the stack first, then `3` lands on top. `-` computes `a - b`, which is `10 - 3`. Read it left to right and the order is consistent: ten, three, subtract. The first number you push is the one being subtracted *from*.

Watch what happens when the numbers are reversed:

```
froth> 3 10 -
Stack: [-7]
```

`3` is below, `10` is on top, and `3 - 10` gives `-7`.

**`*` ( a b -- product )** multiplies the top two values.

```
froth> 3 4 *
Stack: [12]
```

**`/mod` ( a b -- remainder quotient )** performs integer division and leaves *two* values on the stack: the remainder below, the quotient on top.

```
froth> 10 3 /mod
Stack: [1, 3]
```

`10` divided by `3` gives quotient `3` with remainder `1`. Both stay on the stack. This is worth pausing on, because most arithmetic words leave a single result. `/mod` leaves two. If you only want the quotient, you'll need to deal with the remainder. If you only want the remainder, you'll need to deal with the quotient. Chapter 05 covers tools for this.

Here is a longer trace, showing each step of `3 4 + 2 *`:

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

The same expression on one line produces the same result:

```
froth> 3 4 + 2 *
Stack: [14]
```

Froth processes words left to right. Whether you type them on one line or across five, the stack operations are identical.

## When things go wrong

If a word tries to consume more values than the stack holds, you get a stack underflow error.

```
froth> +
Error: stack underflow
froth>
```

The REPL recovers. Your session is intact. You can keep typing.

```
froth> +
Error: stack underflow
froth> 3 4 +
Stack: [7]
```

This is different from traditional Forth, where a stack underflow could corrupt memory or crash the system. In Froth, errors are safe to trigger. The REPL catches them, reports what happened, and returns you to the prompt. You'll also see errors if you type a word that doesn't exist:

```
froth> blorp
Error: unknown word 'blorp'
froth>
```

Errors are feedback, not failure. You'll encounter them constantly while learning, and the REPL is designed to handle them without losing your work.

## Exercises

Work through each of these on paper before typing them into the REPL. Predict the final stack state, then run the expression to check.

**1.** `5 3 -`

What value is on the stack?

**2.** `2 3 4 + *`

How many values are on the stack? What are they?

**3.** `10 3 /mod`

How many values does `/mod` leave? What are they, and which one is on top?

**4.** `1 2 3 + +`

What is the final value?

**5.** `7 .`

What gets printed? What's left on the stack?

**6.** `3 4 + .s .`

What does `.s` display? What does `.` print? What's on the stack at the end?

<details>
<summary>Answers</summary>

1. `[2]`. `5 - 3 = 2`.
2. `[14]`. `3 4 +` produces `7`, then `2 7 *` produces `14`.
3. `[1, 3]`. Remainder `1` is below, quotient `3` is on top.
4. `[6]`. `2 3 +` produces `5`, then `1 5 +` produces `6`.
5. Prints `7`. The stack is empty.
6. `.s` displays `[7]` without consuming it. `.` prints `7` and removes it. The stack is empty.

</details>

If you got some wrong, that's expected. Run each expression in the REPL and trace through what happened. The REPL is the answer key, and using it is the point.

You can now predict the stack state after any sequence of numbers and arithmetic. The next chapter introduces word definitions, where you'll start naming your own operations and building a vocabulary.

[Previous: Getting Started](02-getting-started.md) | [Next: Words and Definitions](04-words-and-definitions.md)

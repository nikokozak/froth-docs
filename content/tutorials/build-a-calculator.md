---
title: "Build a Calculator"
weight: 6
---

_No hardware required. You'll define words for math, build a small RPN calculator, handle errors gracefully, and see how Froth's composition model turns a handful of definitions into a working program._

This tutorial is pure software. You don't need a board plugged in; the REPL on a local POSIX target works fine. The subject is deliberately simple: everyone understands what a calculator does, so you can focus on the Froth patterns rather than the domain.

## Prerequisites

- Chapters 00–06 of the guide (the stack, word definitions, quotations, `if`, `while`, error handling with `catch`/`throw`)
- The Froth REPL running (local POSIX target is fine)
- Verification: `4 3 + .` should print `7`

## What you are building

An RPN calculator with named operations.

RPN (reverse Polish notation) means operands come before the operator. To add 3 and 4 you write `3 4 +`, not `3 + 4`. If you've used the Froth REPL for more than five minutes, you've already been doing RPN. Froth's arithmetic *is* RPN by nature.

What we're adding on top:

- Named words for common math operations: `square`, `cube`, `factorial`
- Error handling: catch division by zero and report a useful message
- A `calculate` word that reads an operation name and dispatches to the right word

Every piece will be defined at the REPL, step by step, tested as you go.

## Step 1 — Arithmetic warmup

Before writing new words, confirm the arithmetic primitives behave as expected:

```froth
froth> 3 4 + .
7
froth> 10 3 /mod . .
3 1
```

`/mod ( a b -- remainder quotient )` returns the remainder below the quotient on the stack. The first `.` prints the quotient (3), the second prints the remainder (1). That output means 10 divided by 3 is 3, remainder 1.

After each line, the stack should be empty. If it's not, call `.s` to see what's there, then `drop` until it's clear.

## Step 2 — Define `square`

```froth
froth> : square ( n -- n*n ) dup * ;
froth> 5 square .
25
froth> 3 square .
9
```

`dup *` duplicates the top value and multiplies. One in, one out. Test a few values before moving on.

## Step 3 — Define `cube`

Build `cube` on top of `square`:

```froth
froth> : cube ( n -- n*n*n ) dup square * ;
froth> 3 cube .
27
froth> 4 cube .
64
```

`dup square *`: duplicate the value (giving `n n` on the stack), call `square` on the top copy (giving `n n*n`), then multiply (giving `n*n*n`).

`cube` calls `square`. If you redefine `square` later, `cube` automatically uses the new version. That's coherent redefinition from chapter 03, working in practice.

## Step 4 — Define `factorial`

`factorial` requires a loop. The plan: keep a running product below a counter on the stack, and multiply-then-decrement until the counter reaches zero.

```froth
froth> : factorial ( n -- n! )
...     1
...     [ over 0 > ]
...     [ over * swap 1 - swap ]
...     while
...     nip ;
```

The stack layout throughout the loop is `[counter accumulator]`, with the accumulator on top.

Walk through `5 factorial`:

1. `1` pushes the initial accumulator. Stack: `[5 1]`
2. `over 0 >` copies the counter (5), checks if it's greater than 0. It is.
3. `over *` copies the counter (5) and multiplies with the accumulator: `[5 5]`
4. `swap 1 -` swaps to get the counter on top, decrements: `[5 4]`
5. `swap` puts the accumulator back on top: `[4 5]`
6. Loop continues: `[4 20]`, `[3 60]`, `[2 120]`, `[1 120]`, `[0 120]`
7. Counter reaches 0, condition fails. `nip` drops the counter, leaving `120`.

```froth
froth> 5 factorial .
120
froth> 1 factorial .
1
froth> 0 factorial .
1
```

## Step 5 — Error handling: safe division

Division by zero throws an error. Wrap division in a word that catches it and prints a message instead:

```froth
froth> : safe/mod ( a b -- remainder quotient )
...     [ /mod ] catch
...     dup 0 =
...     [ drop ]
...     [ drop drop drop "Error: division by zero" s.emit cr ]
...     if ;
```

`catch ( q -- ... 0 | e )` runs the quotation. If it succeeds, it pushes `0` as the error code. If it throws, it restores the stack to the state before the quotation ran and pushes the error code.

In the success case, `dup 0 =` is true, we `drop` the zero and the result of `/mod` is already on the stack. In the error case, the stack has been restored to `[a b]` with the error code on top, so we drop all three and print the message.

```froth
froth> 10 2 safe/mod . .
5 0
froth> 7 0 safe/mod
Error: division by zero
```

## Step 6 — Build `calculate`

Compose everything into a dispatch word. `calculate` takes a number and an operation name (as a string) and applies the right math word:

```froth
froth> : calculate ( n s -- result )
...     dup "square"   s.= [ drop square    ] when
...     dup "cube"     s.= [ drop cube      ] when
...     dup "fact"     s.= [ drop factorial ] when
...     drop ;
```

Each line `dup`s the operation string before comparing it with `s.=` (which consumes both strings). If the comparison matches, the `when` branch `drop`s the remaining string copy and calls the math word. If nothing matches, the final `drop` discards the unrecognized string, leaving `n` unchanged on the stack.

```froth
froth> 5 "square" calculate .
25
froth> 3 "cube" calculate .
27
froth> 5 "fact" calculate .
120
```

## The complete program

```froth
\ RPN calculator words

: square ( n -- n*n )
  dup * ;

: cube ( n -- n*n*n )
  dup square * ;

: factorial ( n -- n! )
  1
  [ over 0 > ]
  [ over * swap 1 - swap ]
  while
  nip ;

: safe/mod ( a b -- remainder quotient )
  [ /mod ] catch
  dup 0 =
  [ drop ]
  [ drop drop drop "Error: division by zero" s.emit cr ]
  if ;

: calculate ( n s -- result )
  dup "square"   s.= [ drop square    ] when
  dup "cube"     s.= [ drop cube      ] when
  dup "fact"     s.= [ drop factorial ] when
  drop ;
```

You built this one word at a time, testing at each step. Small pieces, verified as you go, composed into the final program.

## Extension ideas

- **Add `power ( base exp -- result )`** using `times` to multiply `base` by itself `exp` times
- **Add `gcd ( a b -- gcd )`** with Euclid's algorithm using `while`
- **Catch unknown operations** by making `calculate` throw an error if no operation matched
- **Make it interactive** by writing a word that reads a line of input, parses the number and operation name, and calls `calculate`

## What you learned

- **Word composition:** `cube` calls `square`; change `square` and `cube` changes too. Coherent redefinition working in a real program.
- **Loops with accumulator:** `factorial` maintains state on the stack across `while` iterations. The key pattern: plan your stack layout before writing the loop body, then trace through one iteration manually.
- **Error handling in practice:** `catch` gives you the error code and a clean stack. Check the code, handle or rethrow, drop what you don't need.
- **String dispatch:** `s.=` compares strings. The `dup ... when` pattern checks multiple strings without consuming the original.
- **Interactive development:** you built and tested each piece before composing them. Every word you define is immediately available to test.

---

[← Drive a Servo](drive-a-servo.md) | [Next: Interactive Workflow →](interactive-workflow.md)

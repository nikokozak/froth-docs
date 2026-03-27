---
title: "Error Handling"
weight: 7
---

A crash on a microcontroller is expensive. There is no operating system to catch the fault, no debugger waiting in the wings. The chip resets, the REPL session vanishes, and every word you defined since the last snapshot is gone. A typo that causes a stack underflow should not cost you twenty minutes of work.

Froth treats errors as recoverable runtime events. When something goes wrong, the system signals an error with a numeric code. If nothing catches that error, the REPL prints a message, restores the stack, and hands you a fresh prompt. Your session survives. Your definitions stay intact. You fix the mistake and keep going.

Two words make this possible: `throw` and `catch`.

## What errors look like at the REPL

Before getting into the mechanics, here is what recovery looks like in practice. Try each of these at the REPL:

**Stack underflow** (consuming more values than exist):

```froth
froth> +
Error: stack underflow (1)
froth>
```

**Undefined word** (calling a name that has no definition):

```froth
froth> frobble
Error: undefined word (4)
froth>
```

**Division by zero:**

```froth
froth> 5 0 /mod
Error: division by zero (5)
froth>
```

After each error, the REPL is fully usable. Previous definitions are preserved. The numbers in parentheses are Froth's standard error codes, the same values that `throw` sends and `catch` receives. The REPL itself wraps every line you type in a `catch`, so errors never escape and kill the session.

## `throw`: signaling an error

`throw ( e -- )` takes an error code from the stack and signals an error.

```froth
42 throw
```

If a `catch` is active somewhere up the call chain, control transfers to it immediately. If there is no `catch`, the error propagates to the REPL's top-level handler, which prints the code and restores the stack.

There is one special case: `0 throw` does nothing. Throwing zero is defined as "no error," which makes `throw` safe to use with a computed value. If the computation produces zero, no error is raised.

```froth
0 throw   \ nothing happens
```

This convention enables a compact pattern for conditional errors. If you have a flag and an error code, multiplying them together produces either the code (when the flag is nonzero) or zero (when it is not):

```froth
: check-positive ( n -- n )
  dup 0 < 42 * throw ;
```

If `n` is negative, `0 <` produces a truthy value, the multiplication yields 42, and `throw` signals the error. If `n` is zero or positive, the multiplication yields zero, and `throw` is a no-op.

## `catch`: protecting a quotation

`catch ( q -- ... 0 | e )` takes a quotation, runs it, and intercepts any error that occurs inside it.

When the quotation completes without error, `catch` pushes `0` on top of whatever the quotation left on the stack:

```froth
[ 3 4 + ] catch
\ Stack: [7 0]
```

The `7` is the quotation's result. The `0` means no error. You need to consume the error code before you can work with the result.

When the quotation throws an error, `catch` restores the data stack to the state it had when `catch` was entered and pushes the error code:

```froth
[ 1 0 /mod ] catch .
\ prints: 5
```

Here is the full trace:

1. `[ 1 0 /mod ]` pushes the quotation.
2. `catch` saves the current stack state and runs the quotation.
3. Inside the quotation: `1` pushes, `0` pushes, `/mod` attempts division by zero and throws error code 5.
4. `catch` intercepts the throw. It restores the stack to its state before the quotation ran (empty, in this case) and pushes the error code `5`.
5. `.` prints `5`.

The stack restoration matters. If the quotation pushed several values before throwing, `catch` cleans them all up. You always know what the stack looks like after `catch` returns: either the quotation's results followed by `0`, or the pre-quotation stack with just the error code on top.

## `try`: when you only need the flag

`try ( q -- ... flag )` is a convenience word defined as:

```froth
: try ( q -- ... flag )  catch swap drop ;
```

It runs the quotation under `catch`, then drops the error code and keeps only the success flag. After `try`, the top of the stack is `0` if the quotation succeeded and a nonzero error code if it failed. The difference from `catch` is that `try` discards any intermediate results the quotation may have left on the stack when it errors, giving you a simpler interface when you only care about whether something worked.

## Practical patterns

### Branching on success or failure

The most common pattern: run a quotation under `catch`, then branch on the error code.

```froth
[ risky-operation ] catch
dup 0 = [ drop  handle-success ] [ handle-error ] if
```

If the error code is `0`, drop it and proceed with the results. If nonzero, handle the failure. Here is a concrete version that attempts division and falls back to a default:

```froth
: safe-divide ( a b -- n )
  [ /mod drop ] catch
  dup 0 = [ drop ] [ drop drop -1 ] if ;
```

If the division succeeds, the quotient is below the `0` error code. `drop` removes the zero and leaves the quotient. If division fails (because `b` was zero), `catch` restores the stack to `[a b]` and pushes the error code. The error branch drops the error code, drops both original values, and pushes `-1` as a sentinel.

### Rethrowing errors you cannot handle

If `catch` intercepts an error you did not expect, rethrow it so an outer handler can deal with it:

```froth
[ some-operation ] catch
dup 0 = [ drop ] [ throw ] if
```

If no error occurred, drop the zero and continue. If an error occurred, `throw` it again. The error propagates upward to the next `catch` or, ultimately, to the REPL handler.

### Nested catch blocks

`catch` composes naturally. An inner `catch` can handle a specific error while an outer `catch` guards against broader failures:

```froth
[
  [ 10 0 /mod ] catch
  dup 5 = [ drop 0 ] [ throw ] if
] catch .
\ prints: 0
```

The inner `catch` intercepts the division-by-zero error (code 5). It recognizes the code, drops it, and pushes `0` as a fallback value. The outer `catch` never sees an error because the inner one handled it. It pushes `0` (no error), which `.` prints.

If the inner `catch` had seen a different error code, it would have rethrown it, and the outer `catch` would have intercepted it instead.

## Standard error codes

Froth uses positive integers for its standard error codes:

| Code | Name | Meaning |
|------|------|---------|
| 1 | ERR.STACK | Stack underflow or overflow |
| 2 | ERR.RSTACK | Return stack error |
| 3 | ERR.TYPE | Type mismatch |
| 4 | ERR.UNDEF | Undefined word |
| 5 | ERR.DIV.BY.ZERO | Division by zero |
| 6 | ERR.HEAP.OOM | Heap out of memory |
| 7 | ERR.PATTERN | Invalid perm pattern |
| 9 | ERR.IO | I/O error |
| 11 | ERR.WHILE.STACK | Stack imbalance in a while loop |
| 13 | ERR.BOUNDS | Index out of bounds |
| 14 | ERR.PROGRAM.INTERRUPTED | Execution interrupted (e.g., Ctrl+C) |

For your own words, choose error codes that do not collide with the standard set. Values above 100 are a reasonable starting range for application-defined errors. Document them in one place so callers know what to expect.

## When to use `catch` and `throw`

Use `throw` for situations where a word cannot continue: bad input, a hardware timeout, a violated assumption. A sensor-reading word that receives an out-of-range value should throw, not silently return garbage.

```froth
: in-range ( n lo hi -- n )
  rot dup rot rot
  over < [ drop drop 100 throw ] when
  over > [ drop 100 throw ] when ;
```

Use `catch` for operations that might legitimately fail and where the failure has a sensible recovery path: an I/O read that might time out, a computation that might divide by zero, a word that might receive malformed input.

Avoid using `throw` and `catch` for normal control flow. They carry overhead, and Froth has `if`, `while`, and `choose` for branching. Reserve error handling for genuine failures.

On a microcontroller, keep error paths lean. A `catch` saves and potentially restores the stack state, which costs memory and cycles. Use it where the quotation genuinely might throw, not defensively around every operation.

## Exercises

**Exercise 1.** Run each of the following at the REPL. Note the error code and describe what went wrong:

```froth
1 + +
7 0 /mod
frobnicate
```

**Exercise 2.** Write an expression using `catch` that attempts `1 0 /mod` and prints the error code if an error occurs, or prints the result if it succeeds.

**Exercise 3.** Define a word `nonzero! ( n -- n )` that leaves `n` on the stack if it is nonzero and throws error code 101 if it is zero. Test it with `5 nonzero! .` and `0 nonzero! .`.

**Exercise 4 (challenge).** Write a nested `catch` expression where an inner `catch` handles a division-by-zero error and an outer `catch` sees no error. Trace the stack at each step to confirm your understanding.

---
title: "Quotations and Control Flow"
weight: 6
---

Most languages have special syntax for conditionals and loops. Froth does not. In Froth, `if` is a word. `while` is a word. They take blocks of code as arguments, the same way `+` takes numbers. The blocks are called quotations, and understanding them is the key to writing anything beyond straight-line arithmetic.

## Quotations as values

A quotation is written as `[ ... ]`. Everything between the brackets is code, but it does not run when the brackets are evaluated. Instead, the entire block lands on the stack as a single value.

```froth
froth> [ 2 * ]
Stack: [<quotation>]
```

One item is on the stack. It is not the number that `2 *` would produce. It is the code itself, waiting to be executed. A quotation is deferred computation: "here is something to do; I will tell you when."

Compare this to a bare number. `42` pushes the value 42 onto the stack. `[ 42 . ]` pushes a quotation that, if run, would push 42 and then print it. The quotation is not 42. It is a thing that knows how to produce 42.

Quotations can contain anything a word body can contain: numbers, word calls, other quotations. They can nest arbitrarily deep. In the stack effect notation used throughout this guide, `q` is the conventional label for a quotation argument.

## `call`

A quotation sitting on the stack is inert. The word `call` takes a quotation from the top of the stack and executes its contents.

```froth
froth> 5 [ 2 * ] call .
10
```

Here is the trace:

1. `5` pushes 5. Stack: `[5]`
2. `[ 2 * ]` pushes the quotation. Stack: `[5 <q>]`
3. `call` takes the quotation and runs it. Inside the quotation: `2` pushes 2, giving `[5 2]`. `*` multiplies, leaving `[10]`.
4. `.` prints 10.

The result is identical to writing `5 2 * .` without any quotation at all. The quotation wrapper and the `call` cancel each other out: `[ body ] call` is the same as `body`.

That raises a reasonable question: why bother wrapping code in brackets if `call` just unwraps it? The answer is that you do not always know which code to run at the point where you write it. Sometimes you want to choose between two blocks, or repeat one, or tuck one away for later. Quotations make code a value you can pass around, and the words in the rest of this chapter are the ones that decide what to do with it.

## `choose`

`choose` selects between two values based on a flag.

```
choose ( flag a b -- result )
```

If the flag is true (any non-zero value), `choose` leaves `a`. If the flag is false (zero), it leaves `b`. The other value is discarded. `choose` does not execute anything. It picks one of two values.

```froth
froth> -1 10 20 choose .
10
froth> 0 10 20 choose .
20
```

In Froth, `true` is -1 and `false` is 0. The comparison words `<`, `=`, and `>` return these values. `not` is a bitwise invert, which flips -1 to 0 and 0 to -1.

`choose` works with any kind of value, not just numbers. It works with quotations too, and that is where it becomes interesting.

## `if`

`if` is defined in `core.froth` as:

```froth
: if ( flag trueQ falseQ -- result ) choose call ;
```

Two words. `choose` selects one of the two quotations based on the flag. `call` executes whichever quotation was selected.

```froth
froth> 5 0 > [ 10 ] [ 20 ] if .
10
```

Trace:

1. `5` pushes 5. Stack: `[5]`
2. `0 >` compares: is 5 greater than 0? Yes. Pushes -1 (true). Stack: `[-1]`
3. `[ 10 ]` pushes the true-branch quotation. Stack: `[-1 <q:10>]`
4. `[ 20 ]` pushes the false-branch quotation. Stack: `[-1 <q:10> <q:20>]`
5. `if` runs. `choose` sees the flag is -1 (true), selects `<q:10>`, discards `<q:20>`. Then `call` executes `[ 10 ]`, pushing 10. Stack: `[10]`
6. `.` prints 10.

For the false case:

```froth
froth> 3 5 > [ 10 ] [ 20 ] if .
20
```

`3 5 >` asks: is 3 greater than 5? No. The flag is 0. `choose` selects `[ 20 ]`. `call` executes it. Output: 20.

Notice the argument order. All three arguments are on the stack before `if` runs: the flag, then the true branch, then the false branch. `if` is not special syntax. It is a word that consumes three values and produces one result.

## `when`

Sometimes you only need to act on the true case. `when` runs a quotation if the flag is true and does nothing if it is false.

```
when ( flag q -- )
```

```froth
froth> 5 0 > [ 99 . ] when
99
```

If the flag had been 0, nothing would print and the quotation would be discarded.

## `while`

`while` is the core looping word. It takes two quotations: a condition and a body.

```
while ( condQ bodyQ -- )
```

`while` runs the condition quotation. If it leaves a truthy value on the stack, `while` consumes that flag and runs the body quotation. Then it loops back and runs the condition again. When the condition leaves a falsy value, `while` consumes the flag and stops.

A countdown:

```froth
10 [ dup 0 > ] [ dup . 1 - ] while drop
```

This prints `10 9 8 7 6 5 4 3 2 1`. Here is the trace for the first two iterations.

**Start.** Stack: `[10]`

**Iteration 1, condition:** `[ dup 0 > ]` runs. `dup` copies 10, giving `[10 10]`. `0 >` checks if 10 > 0: yes, pushes -1. Stack: `[10 -1]`. `while` consumes the flag. Stack: `[10]`.

**Iteration 1, body:** `[ dup . 1 - ]` runs. `dup` copies 10, giving `[10 10]`. `.` prints 10 and consumes the copy, leaving `[10]`. `1 -` subtracts, giving `[9]`.

**Iteration 2, condition:** `[ dup 0 > ]` runs on `[9]`. `dup` gives `[9 9]`. `0 >` gives `[9 -1]`. Flag is true. Stack after consuming flag: `[9]`.

**Iteration 2, body:** `[ dup . 1 - ]` runs. Prints 9. Stack becomes `[8]`.

This continues until the stack holds `[0]`. The condition runs: `dup 0 >` gives `[0 0]`. Zero is not greater than zero. `while` sees the falsy flag and stops. Stack: `[0]`. The trailing `drop` cleans up that remaining zero.

The condition quotation must leave exactly one extra value on the stack (the flag). The body quotation should be stack-neutral with respect to the values that persist across iterations. If either quotation leaves extra values behind or consumes too many, the stack will drift with each iteration and the loop will break.

## `times`

`times` runs a quotation a fixed number of times.

```
times ( n q -- )
```

```froth
froth> 5 [ 42 . ] times
42 42 42 42 42
```

The quotation must be stack-neutral: it should leave the stack in the same shape it found it (aside from intended effects like printing). If the quotation changes the stack height, those changes accumulate across all `n` iterations.

A useful pattern with `times`:

```froth
froth> 0 5 [ 1 + ] times .
5
```

Start with 0. Run `[ 1 + ]` five times: 0 becomes 1, then 2, 3, 4, 5. Print the result.

## Combinators

The words in this section are higher-order: they take quotations as arguments and execute them in specific patterns. Each one captures a common idiom so you do not have to manage the stack manually.

### `dip`

```
dip ( a q -- result a )
```

`dip` temporarily removes the top value from the stack, runs the quotation on what remains, then puts the value back.

```froth
froth> 1 2 [ 10 + ] dip .s
[11 2]
```

Trace: the stack starts as `[1 2]`. `dip` saves `2` (the top value), runs `[ 10 + ]` on `[1]`, which produces `[11]`, then restores `2`. Final stack: `[11 2]`.

`dip` is useful when you need to operate on a value that is beneath the top of the stack without disturbing the top value.

### `keep`

```
keep ( x q -- result x )
```

`keep` runs the quotation with `x` on the stack, then pushes `x` again afterward. It preserves the original value.

```froth
froth> 5 [ 2 * ] keep .s
[10 5]
```

The quotation consumed 5 and produced 10. Then `keep` pushed 5 back. You have both the result and the original.

### `bi`

```
bi ( x f g -- f(x) g(x) )
```

`bi` applies two quotations to the same value and leaves both results.

```froth
froth> 10 [ 2 * ] [ 1 + ] bi .s
[20 11]
```

`[ 2 * ]` is applied to 10, producing 20. `[ 1 + ]` is applied to 10, producing 11. Both results are on the stack. Without `bi`, you would need to duplicate 10, apply one quotation, swap the results, apply the other, and arrange the stack. `bi` handles all of that.

### Combinators in combination

These words compose with each other. Here is a word that takes a value and a quotation, and applies the quotation twice:

```froth
: apply-twice ( x q -- result ) dup dip call ;
```

Trace `5 [ 3 + ] apply-twice`:

1. Stack: `[5 <q>]`. `dup` duplicates the quotation: `[5 <q> <q>]`.
2. `dip` saves the top `<q>`, runs the other `<q>` on 5: `5 3 +` gives `[8]`. Restores `<q>`: `[8 <q>]`.
3. `call` runs the quotation: `8 3 +` gives `[11]`.

Result: `[11]`. The quotation `[ 3 + ]` was applied twice: 5 + 3 + 3 = 11.

## Quotations and words are the same thing

There is one more connection worth making explicit. When you write `: double 2 * ;`, the colon-semicolon form is shorthand for `[ 2 * ] 'double def`. Every word definition is a quotation stored in a slot. Every word call is a slot lookup followed by what amounts to `call`.

This means a named word and an anonymous quotation are the same kind of thing from the runtime's perspective. The only difference is whether the quotation has been bound to a name. You can factor a word by extracting part of its body into a named helper, or you can leave it as an anonymous quotation passed to a combinator. Both are normal Froth style, and the choice depends on whether the extracted piece deserves a name.

## Exercises

**Exercise 1.** Given `3 [ dup * ] call`, trace the stack. What is the final result?

**Exercise 2.** Write an `if` expression that takes a number from the stack, checks whether it is greater than zero, and leaves 1 if true or 0 if false.

**Exercise 3.** What does this print? Trace it before running.

```froth
3 [ dup 0 > ] [ dup . 1 - ] while drop
```

**Exercise 4.** You have `[2 3]` on the stack (3 on top). You want to add 10 to the value below the top without disturbing the top. Write the expression using `dip`.

**Exercise 5.** Write an expression using `times` that starts with 1 on the stack and doubles it 4 times. What is the final value?

[Previous: Perm and Named](05-perm-and-named.md) | [Next: Error Handling](07-error-handling.md)

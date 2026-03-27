---
title: "Perm and Named"
weight: 5
---

In the last chapter, you defined words and discovered that each value on the stack gets consumed when a word uses it. If you wanted to add a number to itself, you had no way to refer to it twice. This chapter gives you two ways to solve that problem: `perm`, a single primitive that replaces every stack shuffle word in Forth, and FROTH-Named, an optional profile that lets you bind stack positions to names.

## The shuffle word problem

Forth and its descendants manage the stack with a vocabulary of shuffle words. `dup` duplicates the top value. `swap` reverses the top two. `rot` rotates the top three. `over` copies the second value to the top. `nip` drops the second value. `tuck` copies the top value below the second. Then there are the two-cell variants: `2dup`, `2swap`, `2drop`. The list keeps growing.

Each word does one specific rearrangement. To write even moderately complex stack code, you have to memorize the exact behavior of each word and mentally simulate which one to reach for at each step. Writing a word that needs a value three positions deep becomes a puzzle about which shuffle words, in which order, will bring it to the top. The shuffle sequence becomes an obstacle separate from the logic you are trying to express.

The root cause is that the stack is implicit. You cannot name the value that is third from the top. You can only describe a series of positional moves to get at it. Shuffle words are a fixed menu of those moves.

Froth takes a different approach: instead of a fixed set of rearrangements, it provides one general operation that can express any rearrangement.

## How `perm` works

`perm` takes two arguments: a count and a pattern. The count tells Froth how many values to consume from the top of the stack. The pattern, written as `p[...]`, describes what to push back and in what order.

Inside the pattern, single lowercase letters are labels. `a` refers to the value that was on top of the stack (position 0), `b` to the one below it (position 1), `c` to the one below that (position 2), and so on. The pattern is read left to right, with the leftmost label ending up deepest and the rightmost label ending up on top.

The count determines how many values are consumed. The pattern determines what comes back. A label can appear multiple times (to duplicate a value), once (to keep it), or not at all (to drop it).

The syntax, all together: `n p[labels] perm`.

That description is precise, but examples will make it concrete.

## Reading patterns

**drop: `1 p[] perm`**

Start with `[5]` on the stack. The count is 1, so `perm` consumes one value. Label `a` = 5. The pattern is empty: push nothing back. Stack after: `[]`. The value is gone.

```froth
froth> 5 1 p[] perm .s

froth>
```

**dup: `1 p[a a] perm`**

Start with `[5]`. Count is 1: consume one value. `a` = 5. Pattern `[a a]`: push `a`, then `a`. Stack after: `[5 5]`. The value is duplicated.

```froth
froth> 5 1 p[a a] perm .s
[5 5]
```

**swap: `2 p[a b] perm`**

Start with `[1 2]` (2 on top). Count is 2: consume two values. `a` = 2 (was on top), `b` = 1. Pattern `[a b]`: push `a` then `b`. Stack after: `[2 1]`. The two values have traded places.

```froth
froth> 1 2 2 p[a b] perm .s
[2 1]
```

Remember: `a` is always the top-of-stack value before `perm` runs. In this case, `a` = 2 because 2 was pushed last.

**over: `2 p[b a b] perm`**

Start with `[3 5]` (5 on top). Count is 2. `a` = 5, `b` = 3. Pattern `[b a b]`: push 3, then 5, then 3. Stack after: `[3 5 3]`. The second value has been copied to the top while both originals remain.

```froth
froth> 3 5 2 p[b a b] perm .s
[3 5 3]
```

**nip: `2 p[a] perm`**

Start with `[3 5]` (5 on top). Count is 2. `a` = 5, `b` = 3. Pattern `[a]`: push only `a`. The value `b` (3) is discarded. Stack after: `[5]`.

**A custom rearrangement: `3 p[a c b a] perm`**

Start with `[10 20 30]` (30 on top). Count is 3: consume three values. `a` = 30, `b` = 20, `c` = 10. Pattern `[a c b a]`: push 30, 10, 20, 30. Stack after: `[30 10 20 30]`.

There is no single Forth shuffle word that does this. In Forth, you would need to chain several together and think carefully about intermediate states. With `perm`, you describe the result you want and the runtime handles the rearrangement.

Any pattern you can describe is a valid `perm` expression. There is nothing else to memorize.

## The standard library definitions

`core.froth` is Froth's standard library. It ships with the runtime and is loaded automatically. Every classic Forth shuffle word is defined there as an ordinary Froth word, using `perm`:

```froth
: dup  ( a -- a a )       1 p[a a] perm ;
: swap ( a b -- b a )     2 p[a b] perm ;
: drop ( a -- )           1 p[] perm ;
: over ( a b -- a b a )   2 p[b a b] perm ;
: rot  ( a b c -- b c a ) 3 p[b a c] perm ;
: -rot ( a b c -- c a b ) 3 p[a c b] perm ;
: nip  ( a b -- b )       2 p[a] perm ;
: tuck ( a b -- b a b )   2 p[a b a] perm ;
```

There is nothing hidden behind these definitions. `dup` is not a built-in primitive with special treatment. It is a word that calls `perm` with a particular pattern. You can read every definition from first principles.

To verify one, trace `rot` with concrete values. Start with `[10 20 30]` (30 on top).

- Count is 3. `a` = 30 (TOS), `b` = 20, `c` = 10.
- Pattern `[b a c]`: push `b` (20), then `a` (30), then `c` (10).
- Stack after: `[20 30 10]`.

The stack effect comment says `( a b c -- b c a )`. Reading from the original stack: `a` = 10 (bottom), `b` = 20, `c` = 30. After `rot`: `b c a` = `[20 30 10]`. It matches.

You can use `dup`, `swap`, and the rest anywhere in your code if you prefer the familiar names. They exist for readability and for programmers coming from Forth. When you need a rearrangement that has no named equivalent, write the `perm` pattern directly.

## When `perm` gets verbose

`perm` handles any single rearrangement cleanly. But some words need the same value at multiple points in their body, and each use requires its own `perm` call to bring the value back into position.

Consider a word that takes two values `a` and `b` and computes `a*a + b*b`. Each input is needed twice. With `perm` alone, you would need to duplicate values, compute, rearrange, compute again, and combine. Each `perm` call is correct, but the sequence of patterns tells you nothing about the intent. You are reading positional bookkeeping, not the actual formula.

For short words that need a single rearrangement, `perm` is the right tool. For longer words where values are referenced repeatedly across several steps, there is a cleaner approach.

## Profiles

Froth has a core language and optional extensions called profiles. A profile adds syntax or semantics without changing the core. You activate a profile with a declaration:

```froth
#profile FROTH-Named
```

Words defined after this declaration have access to the profile's features. Words defined before it do not.

Profiles exist because Froth runs on microcontrollers with limited memory. You include what you need and leave out what you don't. On a device with 8 KB of RAM, the difference between a 2 KB footprint and a 3 KB footprint matters. The profile system also lets features evolve independently of the core language.

For this guide, profiles are introduced when they become relevant. The first one is FROTH-Named.

## FROTH-Named

With the FROTH-Named profile active, the names in a stack effect comment become bindings. Instead of serving only as documentation, those names become usable as words within the definition. Each name pushes the value that was in its stack position when the word was called.

Here is the `a*a + b*b` computation from earlier. First, without Named:

```froth
: sum-of-squares ( a b -- n )
  2 p[b a b a] perm
  * swap * + ;
```

The `perm` call duplicates both values into the arrangement `[a b a b]`, then the arithmetic takes over. It works, but reading `[b a b a]` does not tell you why the values are in that order. You have to trace the whole sequence to understand it.

With FROTH-Named:

```froth
#profile FROTH-Named

: sum-of-squares ( a b -- n )
  a a * b b * + ;
```

The names `a` and `b` are bound to the two inputs. Each mention of `a` pushes the value that was passed as `a`. Each mention of `b` pushes the value that was passed as `b`. The body reads like the formula it implements.

Walk through the stack trace for `3 4 sum-of-squares`:

- Entering the word: `a` = 4 (TOS), `b` = 3.
- `a` pushes 4. Stack: `[4]`
- `a` pushes 4. Stack: `[4 4]`
- `*` multiplies. Stack: `[16]`
- `b` pushes 3. Stack: `[16 3]`
- `b` pushes 3. Stack: `[16 3 3]`
- `*` multiplies. Stack: `[16 9]`
- `+` adds. Stack: `[25]`

The binding convention matches `perm`: `a` is the top-of-stack value at entry (the last value pushed before the call), `b` is one below it.

## Choosing between `perm` and Named

Both tools solve the same problem: making stack code readable when values need to be accessed more than once or rearranged. They serve different situations.

Use `perm` when the rearrangement is a one-shot operation. If your word needs to swap, duplicate, or reorganize values once before computing, a `perm` pattern is concise and clear. Definitions like `dup`, `swap`, and `rot` are natural `perm` words. Short utility words where the body is two to four words long rarely benefit from Named.

Use Named when any input is referenced more than once across the body, when the word has multiple computational steps that each need access to the original inputs, or when the logic reads more clearly as a formula than as a stack manipulation sequence.

The rule of thumb: if you are reaching for `perm` more than once in a word's body just to bring a value back into position, switch to Named.

Both coexist in the same project. A file with `#profile FROTH-Named` can still use `perm` wherever it fits. Use what serves the code.

```froth
#profile FROTH-Named

\ perm is still the right tool for a simple shuffle
: swap-top ( a b -- b a ) 2 p[a b] perm ;

\ Named is the right tool when inputs are reused
: distance-squared ( x1 y1 x2 y2 -- n )
  x2 x1 - dup *
  y2 y1 - dup *
  + ;
```

## Exercises

**Exercise 1.** Given the stack `[10 20 30]` (30 on top), what is the stack after `3 p[c b] perm`?

Assign labels: `a` = 30, `b` = 20, `c` = 10. Pattern `[c b]` pushes 10, then 20. Answer: `[10 20]`.

**Exercise 2.** Write a `perm` expression that copies the second-from-top value to the top, leaving the original values in place. Start with `[x y]` on the stack. (This is the `over` operation.)

**Exercise 3.** The definition of `tuck` in `core.froth` is `2 p[a b a] perm`. Trace it manually with `[3 5]` (5 on top). What is the resulting stack?

Labels: `a` = 5, `b` = 3. Pattern `[a b a]`: push 5, 3, 5. Stack: `[5 3 5]`.

**Exercise 4.** Rewrite this word using FROTH-Named:

```froth
: sum-of-squares ( a b -- n )
  2 p[b a b a] perm * swap * + ;
```

Your Named version should be shorter and should read like the formula it computes.

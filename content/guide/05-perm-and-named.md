---
title: "Perm, Named, and State"
weight: 5
---

In the last chapter, you learned how words are defined and how slots give Froth coherent redefinition. This chapter covers the next question every real program runs into:

- how do you rearrange stack values cleanly?
- how do you reuse an input more than once without losing readability?
- how do you hold mutable state with CellSpace?

Those are three related topics, and the language gives you three related tools:

- `perm` for one-shot rearrangements
- named inputs for readable straight-line words
- CellSpace for mutable state and indexed data

## `perm`: one primitive for stack shuffles

Classic Forth gives you a growing bag of shuffle words: `dup`, `swap`, `rot`, `over`, `nip`, `tuck`, and so on. Each one names one exact rearrangement.

Froth takes the more regular route. `perm` describes the rearrangement directly.

The full form is:

```froth
n p[labels] perm
```

- `n` says how many values to consume from the top of the stack
- `p[...]` says what to push back, from deepest output value to TOS

The labels are relative to the original top of stack:

- `a` = TOS
- `b` = one below
- `c` = two below

Labels may be repeated or omitted.

## Reading `perm`

Start with `[1 2 3]` on the stack, with `3` on top.

- `3 p[a b c] perm` leaves the top three values unchanged
- `2 p[a b] perm` swaps the top two values
- `1 p[a a] perm` duplicates the top value
- `2 p[] perm` drops the top two values

Concrete examples:

```froth
froth> 5 1 p[a a] perm .s
[5 5]
```

```froth
froth> 1 2 2 p[a b] perm .s
[2 1]
```

```froth
froth> 3 5 2 p[b a b] perm .s
[3 5 3]
```

```froth
froth> 10 20 30 3 p[a c] perm .s
[30 10]
```

Once `perm` makes sense, the familiar shuffle words become easy to read because they are just small wrappers around it.

## The standard stack words are ordinary Froth

`core.froth` defines the usual helpers this way:

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

Nothing special is hiding behind them. They are there because the names are familiar and readable, not because the runtime needs dedicated shuffle opcodes for each one.

## When `perm` stops being the right tool

`perm` is excellent when the whole problem is "put these values in a different order once."

It gets noisy when a longer word needs to refer to the same input again and again.

Example:

```froth
: sum-of-squares ( a b -- n )
  2 p[b a b a] perm
  * swap * + ;
```

This works, but it reads like bookkeeping.

## Named inputs on ordinary `:` definitions

If you write a normal definition with input names in the stack-effect comment, those names become usable inside the body:

```froth
: sum-of-squares ( a b -- n )
  a a * b b * + ;
```

That is the same computation as the `perm` version above, but the body reads like the formula it implements.

Important rules:

- the names are read-only aliases for the values that were on the stack at word entry
- binding order matches `perm`: the last input name is TOS, the first is deepest
- names do not capture into nested quotations
- if a word needs dynamic `call`, `catch`, or raw custom `perm`, explicit stack style is still the safer surface

In practice, named inputs are best for straight-line words with known-arity calls.

## Choosing between `perm` and named inputs

Use `perm` when:

- the word is short
- the rearrangement happens once
- the shuffle itself is the main idea

Use named inputs when:

- an input is referenced more than once
- the body has several computational steps
- the word reads better as a formula than as a sequence of shuffles

The rule of thumb is simple: if you are reaching for `perm` multiple times just to get back to the same input, switch to named inputs.

## Binding intent: `def`, `value`, `to`, `assign`, `set`, `is`

Now that named inputs are more common, the slot-binding surface matters more too.

`def` is the raw binder:

```froth
'double [ 2 * ] def
```

It accepts any value and clears arity metadata. That makes it the honest low-level escape hatch.

For clearer code, use intent-specific binding words:

- `value`
- `to`
- `assign`
- `set`

All four do the same thing:

```froth
34 'sensor-pin value
2000 'alert-threshold value
1000 'alert-threshold to
```

They are for slot-backed **data**, not quotations.

For slot-backed **callables**, use `is`:

```froth
[ 1 + ] 'hook is
```

That split matters because it makes the code say what kind of rebinding you meant.

## CellSpace: mutable memory for real state

Named inputs solve readability. They do not solve mutable storage.

That is what CellSpace is for.

CellSpace is a dedicated mutable region of tagged Froth cells. It is where you should keep:

- counters
- flags
- arrays
- tables
- mutable records built out of cells

The core defining words are:

- `create`
- `allot`
- `variable`
- `@`
- `!`

The stdlib helpers are:

- `cells`
- `cell+`
- `+!`

## `variable`

The smallest useful state cell is a variable:

```froth
'counter variable
0 counter !
counter @ .
0
```

Update it:

```froth
1 counter +!
counter @ .
1
```

Here is a complete word:

```froth
'press-count variable
0 press-count !

: on-press ( -- )
  1 press-count +!
  "Press #" s.emit press-count @ . cr ;
```

This is the idiomatic surface for mutable scalar state. It is better than repeatedly rebinding one slot with raw `def`.

## `create` and `allot`

When you need more than one cell, use `create` and `allot`:

```froth
'samples create
3 allot

11 samples !
22 samples cell+ !
33 samples cell+ cell+ !
```

Read them back:

```froth
samples @
samples cell+ @
samples cell+ cell+ @
```

CellSpace addresses are already cell-indexed, so:

- `cells` is an identity word kept for readability
- `cell+` advances by one cell

## Top-level only

`create`, `allot`, and `variable` are defining words. They are **top-level only**.

This works:

```froth
'counter variable
```

This does not:

```froth
: bad ( -- ) 'counter variable ;
```

The reason is simple: CellSpace allocation is a definition-time layout tool, not a general runtime allocator.

## A complete example

This word mixes all three tools from the chapter:

```froth
'acc variable
0 acc !

: add-square ( x -- total )
  x x *
  acc @ +
  dup acc !
;
```

- named input `x` keeps the formula readable
- `x x *` is clearer than a `perm`
- `acc` lives in CellSpace because it is mutable state

## Exercises

**Exercise 1.** Trace `3 p[c b] perm` on the stack `[10 20 30]`. What remains?

**Exercise 2.** Rewrite this word using named inputs:

```froth
: sum-of-squares ( a b -- n )
  2 p[b a b a] perm * swap * + ;
```

**Exercise 3.** Define `'counter variable`, store `10` in it, then use `+!` to add `5`. Confirm that `counter @` leaves `15`.

**Exercise 4.** Use `create`, `allot`, `!`, and `cell+` to build a three-cell table holding `7`, `8`, and `9`.

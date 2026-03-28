---
title: "Advent of Code: Safe Dial"
weight: 13
advanced: true
description: "Solve Advent of Code 2025 Day 1 on the local POSIX target with line parsing and a recursive state walker."
---

_This chapter uses Posix Froth to solve the first part of [Advent of Code 2025 Day 1: Secret Entrance](https://adventofcode.com/2025/day/1). The point is not the puzzle itself; the point is that plain Froth can parse line-shaped input, keep state on the stack, and finish a real problem without leaving the REPL._

## Prerequisites

- The guide through quotations, `if`, `while`, and strings
- A local REPL: `froth connect --local` is fine
- A willingness to read a few `perm`-heavy helpers

## Input shape

The puzzle input is one rotation per line, like `L68` or `R14`.

Current Posix Froth does not give you a convenient file API in the style of a scripting language, so the cleanest representation is a quotation of strings:

```froth
[ "L68" "L30" "R48" ]
```

That is good enough for a real solution. If you want to drive it from a host tool later, the host can still collect lines and emit the same quotation form.

## The solver

```froth
: aoc1-digit>n
  48 - ;

: aoc1-wrap100
  dup 0 <
  [ 100 + aoc1-wrap100 ]
  [ 100 /mod drop ]
  if ;

: aoc1-parse-tail/loop
  3 p[c b a b c] perm s.len <
  [ 10 * 3 p[c b a c b] perm s@ aoc1-digit>n + swap 1 + swap
    aoc1-parse-tail/loop ]
  [ 3 p[a] perm ]
  if ;

: aoc1-parse-tail
  1 0 aoc1-parse-tail/loop ;

: aoc1-delta
  dup 0 s@ 76 =
  [ aoc1-parse-tail negate ]
  [ aoc1-parse-tail ]
  if ;

: aoc1-solve/loop
  4 p[d c b a c d] perm q.len <
  [ 4 p[d c b a d c] perm q@ aoc1-delta + aoc1-wrap100
    dup 0 = abs 3 p[b c a] perm + swap rot 1 + -rot
    aoc1-solve/loop ]
  [ 4 p[b] perm ]
  if ;

: aoc1-solve
  0 0 50 aoc1-solve/loop ;
```

## What the state means

`aoc1-solve/loop` keeps four values on the stack:

- the quotation of input lines
- the current index
- the running hit count
- the current dial position

That is the whole program. There is no hidden mutable state. Each recursive step takes one line, turns it into a signed delta, wraps the dial back into `0..99`, increments the hit count if the dial lands on `0`, and moves to the next line.

`aoc1-parse-tail/loop` does the same thing at the string level: it walks the digits one byte at a time and builds the decimal value in the accumulator.

## A smaller check

```froth
froth> [ "L50" "R1" "L1" ] aoc1-solve .
2
```

Start at `50`:

- `L50` lands on `0`
- `R1` lands on `1`
- `L1` lands on `0` again

So the answer is `2`.

## The official sample

The same solver returns `3` on the published sample from the puzzle page.

That matters more than it sounds like it does. Froth is often accused of being good only for tiny hand-fed stack tricks. This is not that. This is straightforward string parsing and stateful iteration in a live REPL, and it holds up fine.

## Takeaways

- Quotations of strings are a practical stand-in for file input on the local target.
- Recursive walkers are often clearer than reaching for named scratch state.
- `perm` earns its keep once you start writing real parsers.
- The local POSIX target is good enough for puzzle work, data shaping, and algorithm practice, not just calculator demos.

---
title: "Advent of Code: Grid Scan"
weight: 14
advanced: true
description: "Solve Advent of Code 2025 Day 4 on the local POSIX target with explicit neighbor checks and nested recursive loops."
---

_This chapter uses Posix Froth to solve the first part of [Advent of Code 2025 Day 4: Printing Department](https://adventofcode.com/2025/day/4). It is a different kind of exercise from the safe dial problem: the input is a 2D grid, the work is local neighborhood counting, and the solution wants nested walkers rather than a single line parser._

## Why this one

This is the sort of problem people often assume a small Forth-like system will hate:

- 2D input
- bounds checks
- eight-neighbor scans
- nested loops

In practice, it is fine. You just need to be explicit.

## Input shape

Represent the grid as a quotation of equal-length strings:

```froth
[ "..@@"
  ".@@."
  "...."
  "@..@" ]
```

That gives you a row container (`q@`) and a cell container (`s@`). Nothing fancy is hiding behind it.

## The solver

```froth
: aoc4-grid-w
  0 q@ s.len ;

: aoc4-paper-at?
  dup 0 <
  [ drop drop drop 0 ]
  [ over 0 <
    [ drop drop drop 0 ]
    [ 3 p[c b a a c] perm q.len <
      [ 3 p[c b a b c] perm aoc4-grid-w <
        [ 3 p[c b a b c a] perm q@ swap s@ 4 p[a] perm 64 = abs ]
        [ drop drop drop 0 ]
        if ]
      [ drop drop drop 0 ]
      if ]
    if ]
  if ;

: aoc4-paper-at+
  >r
  4 p[d b c a] perm + swap r> + aoc4-paper-at? ;

: aoc4-neighbor-count
  0
  4 p[d c b a d c b] perm -1 -1 aoc4-paper-at+ +
  4 p[d c b a d c b] perm  0 -1 aoc4-paper-at+ +
  4 p[d c b a d c b] perm  1 -1 aoc4-paper-at+ +
  4 p[d c b a d c b] perm -1  0 aoc4-paper-at+ +
  4 p[d c b a d c b] perm  1  0 aoc4-paper-at+ +
  4 p[d c b a d c b] perm -1  1 aoc4-paper-at+ +
  4 p[d c b a d c b] perm  0  1 aoc4-paper-at+ +
  4 p[d c b a d c b] perm  1  1 aoc4-paper-at+ +
  4 p[a] perm ;

: aoc4-accessible?
  3 p[c b a c b a] perm aoc4-paper-at?
  dup 0 =
  [ drop drop drop drop 0 ]
  [ drop aoc4-neighbor-count 4 < abs ]
  if ;

: aoc4-count-row/loop
  4 p[d c b a b d] perm aoc4-grid-w <
  [ 4 p[d c b a d b c] perm aoc4-accessible? +
    swap 1 + swap
    aoc4-count-row/loop ]
  [ 4 p[a] perm ]
  if ;

: aoc4-count-row
  0 0 aoc4-count-row/loop ;

: aoc4-count-grid/loop
  3 p[c b a b c] perm q.len <
  [ 3 p[c b a c b] perm aoc4-count-row +
    swap 1 + swap
    aoc4-count-grid/loop ]
  [ 3 p[a] perm ]
  if ;

: aoc4-count-accessible
  0 0 aoc4-count-grid/loop ;
```

## The key idea

Do not try to be clever about the neighbors. There are eight of them. Write eight checks.

That sounds unglamorous, but it keeps the problem honest:

- `aoc4-paper-at?` handles bounds and cell lookup
- `aoc4-paper-at+` applies an `(dx, dy)` offset
- `aoc4-neighbor-count` adds the eight checks
- `aoc4-accessible?` applies the puzzle rule
- the two recursive walkers scan the row and then the grid

Once those pieces exist, the rest is bookkeeping.

## A smaller check

```froth
froth> [ ".@."
...     "@@."
...     "..." ] aoc4-count-accessible .
3
```

All three rolls are exposed enough to count.

## The official sample

The same solver returns `13` on the published sample from the puzzle page.

That is the important result here. Posix Froth can do real grid work. It is not pretending to be Python, and it does not need to. Quotations, strings, recursion, and a few disciplined helpers are enough.

## Takeaways

- A quotation of strings is a perfectly serviceable 2D representation.
- When the neighborhood size is fixed, explicit code is often the cleanest code.
- Nested recursion is workable in Froth as long as you keep the stack layout stable.
- The local target is good for more than REPL toy examples; you can push it into real problem-solving territory.

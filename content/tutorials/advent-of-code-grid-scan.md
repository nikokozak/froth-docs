---
title: "Advent of Code: Grid Scan"
weight: 9
advanced: true
description: "Solve Advent of Code 2025 Day 4 on the local POSIX target with explicit neighbor checks, CellSpace state, and named helpers."
aliases:
  - /guide/14-advent-of-code-grid-scan/
---

_This chapter uses Posix Froth to solve the first part of [Advent of Code 2025 Day 4: Printing Department](https://adventofcode.com/2025/day/4). It is a different kind of exercise from the safe dial problem: the input is a 2D grid, the work is local neighborhood counting, and the cleaner modern Froth shape is explicit helpers plus CellSpace-backed scan state._

## Why this one

This is the sort of problem people often assume a small Forth-like system will hate:

- 2D input
- bounds checks
- eight-neighbor scans
- nested loops

In practice, it is fine. You just need to be explicit, and you do not need to do it with a wall of `perm`.

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
'aoc4-grid variable
'aoc4-x variable
'aoc4-y variable
'aoc4-total variable
'aoc4-probe-x variable
'aoc4-probe-y variable

: aoc4-grid-w ( -- n )
  aoc4-grid @ 0 q@ s.len ;

: aoc4-paper-at? ( x y -- n )
  aoc4-probe-y !
  aoc4-probe-x !
  aoc4-probe-y @ 0 <
  [ 0 ]
  [ aoc4-probe-x @ 0 <
    [ 0 ]
    [ aoc4-probe-y @ aoc4-grid @ q.len <
      [ aoc4-probe-x @ aoc4-grid-w <
        [ aoc4-grid @ aoc4-probe-y @ q@
          aoc4-probe-x @ s@
          64 = flag>n ]
        [ 0 ]
        if ]
      [ 0 ]
      if ]
    if ]
  if ;

: aoc4-paper-at+ ( dx dy -- n )
  aoc4-x @ dx + aoc4-y @ dy + aoc4-paper-at? ;

: aoc4-neighbor-count ( -- n )
  0
  -1 -1 aoc4-paper-at+ +
   0 -1 aoc4-paper-at+ +
   1 -1 aoc4-paper-at+ +
  -1  0 aoc4-paper-at+ +
   1  0 aoc4-paper-at+ +
  -1  1 aoc4-paper-at+ +
   0  1 aoc4-paper-at+ +
   1  1 aoc4-paper-at+ + ;

: aoc4-accessible? ( -- n )
  aoc4-x @ aoc4-y @ aoc4-paper-at?
  dup 0 =
  [ drop 0 ]
  [ drop aoc4-neighbor-count 4 < flag>n ]
  if ;

: aoc4-count-row ( -- )
  0 aoc4-x !
  [ aoc4-x @ aoc4-grid-w < ]
  [ aoc4-accessible? aoc4-total +!
    1 aoc4-x +! ]
  while ;

: aoc4-count-accessible ( q -- n )
  aoc4-grid !
  0 aoc4-total !
  0 aoc4-y !
  [ aoc4-y @ aoc4-grid @ q.len < ]
  [ aoc4-count-row
    1 aoc4-y +! ]
  while
  aoc4-total @ ;
```

## The key idea

Do not try to be clever about the neighbors. There are eight of them. Write eight checks.

The newer part is not the algorithm. It is where the state lives:

- `aoc4-grid`, `aoc4-x`, `aoc4-y`, and `aoc4-total` live in CellSpace
- `aoc4-paper-at?` handles bounds and cell lookup
- `aoc4-paper-at+` uses named inputs for the `(dx, dy)` offset case
- `aoc4-neighbor-count` just adds the eight checks
- the two `while` loops scan the row and then the grid

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

That is the important result here. Posix Froth can do real grid work. It is not pretending to be Python, and it does not need to. Quotations, strings, a few CellSpace variables, and disciplined helpers are enough.

## Takeaways

- A quotation of strings is a perfectly serviceable 2D representation.
- When the neighborhood size is fixed, explicit code is often the cleanest code.
- CellSpace state is often the cleaner choice once nested loops stop being pleasant in raw stack style.
- The local target is good for more than REPL toy examples; you can push it into real problem-solving territory.

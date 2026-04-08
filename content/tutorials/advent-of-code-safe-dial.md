---
title: "Advent of Code: Safe Dial"
weight: 8
advanced: true
description: "Solve Advent of Code 2025 Day 1 on the local POSIX target with named helpers, CellSpace state, and a simple line parser."
aliases:
  - /guide/13-advent-of-code-safe-dial/
---

_This chapter uses Posix Froth to solve the first part of [Advent of Code 2025 Day 1: Secret Entrance](https://adventofcode.com/2025/day/1). The newer version leans on named straight-line helpers and CellSpace variables, so the parser and scan logic read like a small program instead of a stack-juggling stunt._

## Prerequisites

- The guide through quotations, `if`, `while`, strings, named inputs, and CellSpace
- A local REPL: `froth connect --local` is fine
- Comfort with a few top-level helper variables

## Input shape

The puzzle input is one rotation per line, like `L68` or `R14`.

Current Posix Froth does not give you a convenient file API in the style of a scripting language, so the cleanest representation is still a quotation of strings:

```froth
[ "L68" "L30" "R48" ]
```

That is good enough for a real solution. If you want to drive it from a host tool later, the host can still collect lines and emit the same quotation form.

## The solver

```froth
'aoc1-lines variable
'aoc1-line-i variable
'aoc1-line variable
'aoc1-parse-i variable
'aoc1-acc variable
'aoc1-dial variable
'aoc1-hits variable

: aoc1-digit>n ( byte -- n )
  byte 48 - ;

: aoc1-wrap100 ( n -- wrapped )
  dup 0 <
  [ 100 + aoc1-wrap100 ]
  [ 100 /mod drop ]
  if ;

: aoc1-parse-tail ( s -- n )
  aoc1-line !
  1 aoc1-parse-i !
  0 aoc1-acc !
  [ aoc1-parse-i @ aoc1-line @ s.len < ]
  [ aoc1-acc @ 10 *
    aoc1-line @ aoc1-parse-i @ s@ aoc1-digit>n +
    aoc1-acc !
    1 aoc1-parse-i +! ]
  while
  aoc1-acc @ ;

: aoc1-delta ( s -- delta )
  dup 0 s@ 76 =
  [ aoc1-parse-tail negate ]
  [ aoc1-parse-tail ]
  if ;

: aoc1-apply-delta ( delta -- )
  aoc1-dial @ delta + aoc1-wrap100
  dup aoc1-dial !
  0 = flag>n aoc1-hits +! ;

: aoc1-step ( -- )
  aoc1-lines @ aoc1-line-i @ q@
  aoc1-delta
  aoc1-apply-delta
  1 aoc1-line-i +! ;

: aoc1-solve ( q -- n )
  aoc1-lines !
  0 aoc1-line-i !
  50 aoc1-dial !
  0 aoc1-hits !
  [ aoc1-line-i @ aoc1-lines @ q.len < ]
  [ aoc1-step ]
  while
  aoc1-hits @ ;
```

## What the state means

The long-lived scan state lives in CellSpace variables instead of on the data stack:

- `aoc1-lines` holds the quotation of input lines
- `aoc1-line-i` tracks which line you are on
- `aoc1-dial` holds the current dial position
- `aoc1-hits` accumulates how many times the dial lands on `0`

That makes the top-level scan easy to read: `aoc1-step` fetches one line, turns it into a signed delta, updates the dial, bumps the hit count when the new position is `0`, and advances the line index.

`aoc1-parse-tail` uses the same pattern one level down. It keeps a string, an index, and an accumulator in variables, then uses `while` to walk the bytes after the leading `L` or `R`.

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

That matters more than it sounds like it does. Froth is often accused of being good only for tiny hand-fed stack tricks. This is not that. This is straightforward string parsing and counted iteration in a live REPL, written in the newer style Froth actually wants you to use for stateful scans.

## Takeaways

- Quotations of strings are a practical stand-in for file input on the local target.
- Named helpers are good for the straight-line parts of the parser.
- CellSpace variables are a reasonable place to keep scan state when nested quotations would make stack style noisy.
- The local POSIX target is good enough for puzzle work, data shaping, and algorithm practice, not just calculator demos.

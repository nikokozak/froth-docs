---
title: "Word Reference"
weight: 1
---

Complete reference for VM primitives and stdlib words.

Board and platform APIs such as `gpio.*`, `i2c.*`, `uart.*`, and `ms` live under [Hardware APIs](/reference/hardware/).

Core comparison and predicate words return Froth flags: `-1` for true and `0` for false. Use `flag>n` when you need a numeric `1` or `0`.

## Stack Manipulation

### Primitives

**`perm`** *(C)*  `( n pat -- )`

Rewrites the top `n` stack values according to a pattern. In normal source code, the pattern is almost always written inline as `p[...]`, so the user-facing shape is `... n p[labels] perm`.

```froth
froth> 1 2 2 p[a b] perm
[2 1]
```

### Stdlib — Core Shuffle Words

**`dup`** *(Froth)*  `( a -- a a )`

Duplicates the top value.

```froth
froth> 5 dup
[5 5]
```

**`swap`** *(Froth)*  `( a b -- b a )`

Exchanges the top two values.

```froth
froth> 1 2 swap
[2 1]
```

**`drop`** *(Froth)*  `( a -- )`

Discards the top value.

```froth
froth> 5 drop
[]
```

**`over`** *(Froth)*  `( a b -- a b a )`

Copies the second value to the top.

```froth
froth> 3 5 over
[3 5 3]
```

**`rot`** *(Froth)*  `( a b c -- b c a )`

Rotates the top three values so the deepest of the three becomes TOS last.

```froth
froth> 1 2 3 rot
[2 3 1]
```

**`-rot`** *(Froth)*  `( a b c -- c a b )`

Reverse rotation: moves TOS to the deepest position in the three-value window.

```froth
froth> 1 2 3 -rot
[3 1 2]
```

**`nip`** *(Froth)*  `( a b -- b )`

Drops the second value and keeps TOS.

```froth
froth> 3 5 nip
[5]
```

**`tuck`** *(Froth)*  `( a b -- b a b )`

Copies TOS underneath the second value.

```froth
froth> 3 5 tuck
[5 3 5]
```

### Stdlib — Pair Helpers

**`2dup`** *(Froth)*  `( a b -- a b a b )`

Duplicates the top pair.

```froth
froth> 1 2 2dup
[1 2 1 2]
```

**`2drop`** *(Froth)*  `( a b -- )`

Discards the top two values.

```froth
froth> 1 2 2drop
[]
```

**`2swap`** *(Froth)*  `( a b c d -- c d a b )`

Swaps the top two pairs.

```froth
froth> 1 2 3 4 2swap
[3 4 1 2]
```

**`2over`** *(Froth)*  `( a b c d -- a b c d a b )`

Copies the deeper pair to the top.

```froth
froth> 1 2 3 4 2over
[1 2 3 4 1 2]
```

## Arithmetic

**`+`** *(C)*  `( a b -- a+b )`

Adds two integers with normal cell-width wrapping.

```froth
froth> 3 4 +
[7]
```

**`-`** *(C)*  `( a b -- a-b )`

Subtracts `b` from `a`.

```froth
froth> 10 3 -
[7]
```

**`*`** *(C)*  `( a b -- a*b )`

Multiplies two integers with normal cell-width wrapping.

```froth
froth> 3 4 *
[12]
```

**`/mod`** *(C)*  `( a b -- rem quot )`

Divides `a` by `b`, leaving the remainder below the quotient. Division by zero throws the standard division-by-zero error.

```froth
froth> 10 3 /mod
[1 3]
```

### Stdlib — Arithmetic

**`negate`** *(Froth)*  `( a -- -a )`

Negates a number.

```froth
froth> 5 negate
[-5]
```

**`abs`** *(Froth)*  `( a -- |a| )`

Leaves the absolute value of a number.

```froth
froth> -7 abs
[7]
```

## Comparison and Flags

**`<`** *(C)*  `( a b -- flag )`

Pushes `-1` when `a < b`, otherwise `0`.

```froth
froth> 3 5 <
[-1]
```

**`>`** *(C)*  `( a b -- flag )`

Pushes `-1` when `a > b`, otherwise `0`.

```froth
froth> 5 3 >
[-1]
```

**`=`** *(C)*  `( a b -- flag )`

Pushes `-1` when the numbers are equal, otherwise `0`.

```froth
froth> 4 4 =
[-1]
```

**`flag>n`** *(Froth)*  `( flag -- n )`

Normalizes a Froth flag to numeric `1` or `0`.

```froth
froth> 5 3 > flag>n
[1]
```

## Bitwise

**`and`** *(C)*  `( a b -- a&b )`

Bitwise AND.

```froth
froth> 0b1100 0b1010 and
[8]
```

**`or`** *(C)*  `( a b -- a|b )`

Bitwise OR.

```froth
froth> 0b1100 0b1010 or
[14]
```

**`xor`** *(C)*  `( a b -- a^b )`

Bitwise XOR.

```froth
froth> 0b1100 0b1010 xor
[6]
```

**`invert`** *(C)*  `( a -- ~a )`

Bitwise complement over the numeric payload bits of the cell.

**`lshift`** *(C)*  `( a n -- a<<n )`

Shifts `a` left by `n` bits.

```froth
froth> 1 3 lshift
[8]
```

**`rshift`** *(C)*  `( a n -- a>>n )`

Logical right shift. The left side is filled with zero bits.

```froth
froth> 16 2 rshift
[4]
```

## Quotations

**`q.len`** *(C)*  `( q -- n )`

Returns the number of cells in a quotation body.

```froth
froth> [ 1 2 3 ] q.len
[3]
```

**`q@`** *(C)*  `( q i -- cell )`

Returns the cell at zero-based index `i` in a quotation.

```froth
froth> [ 10 20 30 ] 1 q@
[20]
```

**`call`** *(C)*  `( callable -- )`

Executes a quotation or a slot-backed word. The net stack effect depends on the callee.

```froth
froth> 5 [ 2 * ] call
[10]
```

**`choose`** *(C)*  `( flag t f -- t|f )`

Selects one of two values based on the flag and leaves the selected value on the stack. `choose` does not call quotations by itself.

```froth
froth> -1 10 20 choose
[10]
```

## Patterns

**`pat`** *(C)*  `( quote -- pattern )`

Compiles a quotation of numeric indices into a packed pattern value. Most user code uses `p[...]` literal syntax instead of calling `pat` directly.

```froth
froth> [ 0 1 0 ] pat
```

## Definitions and Bindings

**`def`** *(C)*  `( slot value -- )`

Raw slot-binding primitive. It accepts any Froth value and clears arity metadata on successful rebind.

```froth
froth> 'double [ 2 * ] def
```

**`value`** *(C)*  `( value slot -- )`

Binds non-quotation data to a slot and stamps the slot with `(0 -- 1)` metadata.

```froth
froth> 34 'sensor-pin value
```

**`to`** *(C)*  `( value slot -- )`

Alias for `value`.

```froth
froth> 1000 'alert-threshold to
```

**`assign`** *(C)*  `( value slot -- )`

Alias for `value`.

```froth
froth> 42 'answer assign
```

**`set`** *(C)*  `( value slot -- )`

Alias for `value`.

```froth
froth> 99 'counter set
```

**`is`** *(C)*  `( quote slot -- )`

Binds a quotation to a slot and clears arity metadata.

```froth
froth> [ 1 + ] 'hook is
```

**`defer`** *(C)*  `( 'name -- )`

Declares an unbound slot that will be bound later.

```froth
froth> 'hook defer
```

**`get`** *(C)*  `( 'name -- value )`

Fetches the value stored in a slot without calling it.

```froth
froth> 'double get
```

**`arity!`** *(C)*  `( slot in out -- )`

Sets the arity metadata for a slot-backed word.

```froth
froth> 'my-word 2 1 arity!
```

## Control Flow

**`while`** *(C)*  `( cond body -- )`

Repeatedly calls `cond`; if it leaves a truthy flag, `while` calls `body` and repeats. Both quotations must preserve the expected stack discipline across iterations.

```froth
froth> 3 [ dup 0 > ] [ dup . 1 - ] while drop
```

### Stdlib — Control Flow and Combinators

**`if`** *(Froth)*  `( flag t f -- result )`

Selects one of two quotations with `choose` and then calls the selected quotation.

```froth
froth> -1 [ 10 ] [ 20 ] if
[10]
```

**`times`** *(Froth)*  `( n q -- )`

Calls `q` exactly `n` times. The quotation should be stack-neutral across iterations.

```froth
froth> 3 [ 42 . ] times
```

**`dip`** *(Froth)*  `( a q -- result a )`

Temporarily moves the top value to the return stack, calls the quotation, then restores the value.

```froth
froth> 1 2 [ 10 + ] dip
[11 2]
```

**`keep`** *(Froth)*  `( x q -- result x )`

Calls the quotation with `x` and then restores the original `x`.

```froth
froth> 5 [ 2 * ] keep
[10 5]
```

**`bi`** *(Froth)*  `( x f g -- f(x) g(x) )`

Applies two quotations to the same input and leaves both results.

```froth
froth> 10 [ 2 * ] [ 1 + ] bi
[20 11]
```

## Error Handling

**`catch`** *(C)*  `( q -- ... ecode flag )`

Runs `q` in a protected context. On success, it preserves `q`'s results and pushes `0 -1`. On failure, it restores the data, return, and control stacks to their pre-call depths and pushes `ecode 0`.

```froth
froth> [ 3 4 + ] catch
[7 0 -1]
```

**`throw`** *(C)*  `( code -- )`

Throws a nonzero error code. `0 throw` is a no-op.

```froth
froth> 42 throw
```

### Stdlib — Error Helpers

**`try`** *(Froth)*  `( q -- ... flag )`

Runs `q` under `catch` and leaves only the success flag: `-1` on success, `0` on failure.

```froth
froth> [ 123 ] try
[123 -1]
```

## Strings

**`s.keep`** *(C)*  `( s -- s )`

Copies a transient string into permanent storage and returns the kept string reference.

```froth
froth> "hello" s.keep
```

**`s.emit`** *(C)*  `( s -- )`

Prints a string.

```froth
froth> "hello" s.emit
```

**`s.len`** *(C)*  `( s -- n )`

Returns a string's byte length.

```froth
froth> "hello" s.len
[5]
```

**`s@`** *(C)*  `( s i -- byte )`

Returns the byte at zero-based index `i`.

```froth
froth> "abc" 0 s@
[97]
```

**`s.=`** *(C)*  `( s1 s2 -- flag )`

Pushes `-1` when the strings are byte-for-byte equal, otherwise `0`.

```froth
froth> "hello" "hello" s.=
[-1]
```

**`s.concat`** *(C)*  `( s1 s2 -- s3 )`

Concatenates two strings and leaves the result.

```froth
froth> "fro" "th" s.concat
["froth"]
```

### Conversions

**`n>s`** *(C)*  `( n -- s )`

Converts a number to its decimal string form.

```froth
froth> 42 n>s
["42"]
```

**`n>hexs`** *(C)*  `( n -- s )`

Converts a number to an unsigned hexadecimal string with a `0x` prefix.

```froth
froth> 255 n>hexs
["0xff"]
```

**`n>bins`** *(C)*  `( n -- s )`

Converts a number to an unsigned binary string with a `0b` prefix.

```froth
froth> 5 n>bins
["0b101"]
```

## Console and Time

**`emit`** *(C)*  `( char -- )`

Outputs the low byte of the number as a character.

```froth
froth> 65 emit
```

**`key`** *(C)*  `( -- char )`

Reads one byte from the input stream and pushes its numeric value.

**`key?`** *(C)*  `( -- flag )`

Non-blocking input check. Pushes `-1` when input is available, otherwise `0`.

**`millis`** *(C)*  `( -- n )`

Returns the current monotonic uptime in milliseconds.

```froth
froth> millis
```

### Stdlib — Console

**`cr`** *(Froth)*  `( -- )`

Outputs a newline character.

```froth
froth> "hello" s.emit cr
```

## Memory and State

**`create`** *(C)*  `( slot -- )`

Top-level defining word. Binds the slot to the current CellSpace allocation address without allocating cells by itself.

```froth
froth> 'rows create
froth> 8 allot
```

**`allot`** *(C)*  `( n -- )`

Top-level CellSpace allocator. Reserves `n` zero-initialized cells.

```froth
froth> 8 allot
```

**`variable`** *(C)*  `( slot -- )`

Top-level helper that allocates one CellSpace cell and binds its address to the slot.

```froth
froth> 'counter variable
```

**`@`** *(C)*  `( addr -- value )`

Fetches one tagged cell from CellSpace.

```froth
froth> counter @
```

**`!`** *(C)*  `( value addr -- )`

Stores one tagged cell into CellSpace.

```froth
froth> 42 counter !
```

**`cells`** *(Froth)*  `( n -- n )`

Cell-count helper. In CellSpace, addresses are already cell-indexed, so `cells` is an identity word kept for readability.

**`cell+`** *(Froth)*  `( addr -- addr' )`

Advances a CellSpace address by one cell.

```froth
froth> rows cell+
```

**`+!`** *(Froth)*  `( delta addr -- )`

Adds `delta` to the numeric value stored at `addr`.

```froth
froth> 1 counter +!
```

**`mark`** *(C)*  `( -- )`

Snapshots the current transient heap pointer so it can be restored later with `release`.

```froth
froth> mark
```

**`release`** *(C)*  `( -- )`

Rewinds the transient heap pointer to the most recent `mark`.

```froth
froth> mark ... release
```

## Introspection

**`.`** *(C)*  `( x -- )`

Prints the top value and consumes it.

```froth
froth> 42 .
```

**`.s`** *(C)*  `( -- )`

Prints the current data stack without consuming it.

```froth
froth> 1 2 3 .s
```

**`words`** *(C)*  `( -- )`

Lists the currently defined words.

```froth
froth> words
```

**`see`** *(C)*  `( slot -- )`

Displays the definition bound to a slot.

```froth
froth> 'dup see
```

**`info`** *(C)*  `( -- )`

Prints runtime information such as version, cell size, heap usage, CellSpace usage, and slot count.

```froth
froth> info
```

## Auxiliary Stack (Return Stack)

**`>r`** *(C)*  `( x -- ) ( R: -- x )`

Moves TOS from the data stack to the return stack.

**`r>`** *(C)*  `( -- x ) ( R: x -- )`

Moves the top return-stack value back to the data stack.

**`r@`** *(C)*  `( -- x ) ( R: x -- x )`

Copies the top return-stack value to the data stack without removing it.

## Snapshots

These words are available when snapshots are enabled in the build.

**`save`** *(C)*  `( -- )`

Persists the current overlay state to snapshot storage.

```froth
froth> save
```

**`restore`** *(C)*  `( -- )`

Loads the active snapshot back over the built baseline.

```froth
froth> restore
```

**`wipe`** *(C)*  `( -- )`

Erases persisted snapshots and resets the running overlay back to the built baseline.

```froth
froth> wipe
```

## System

**`dangerous-reset`** *(C)*  `( -- )`

Resets the running Froth session back to the built baseline, clearing overlay bindings, stacks, and transient state. Unsaved overlay state is lost.

```froth
froth> dangerous-reset
```

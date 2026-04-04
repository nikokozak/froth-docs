---
title: "Word Reference"
weight: 1
---

Complete reference for VM primitives and stdlib words.

Board and platform APIs such as `gpio.*`, `i2c.*`, and `uart.*` live under [Hardware APIs](/reference/hardware/).

Entries follow the format:

```text
word  ( stack-effect )  One-line description.
: word ...
froth> expression
result
```

**C** = primitive implemented in C.  **Froth** = defined in `core.froth` (stdlib).

---

## Stack Manipulation

### Primitives

**`perm`** *(C)*  `( ... n p[labels] -- ... )`

General stack permutation. `perm` is the word behind most of the standard stack shuffles.

It works in two steps:

1. `n` says how many stack values to look at.
2. `p[...]` says which of those values should appear in the result, from deepest output value to top of stack.

Labels name the input values relative to the top of stack:

- `a` = top of stack
- `b` = one below
- `c` = two below
- and so on

Labels may be omitted to drop a value, or repeated to duplicate one.

If the input stack is:

```text
[1 2 3]
```

then for a three-value permutation:

- `a` means `3`
- `b` means `2`
- `c` means `1`

That means:

- `p[a b c]` leaves the top three values unchanged
- `p[b a]` swaps the top two values
- `p[a a]` duplicates the top value
- `p[]` drops everything in the selected slice

Some concrete examples:

```froth
froth> 7 1 p[a a] perm
[7 7]
```

```froth
froth> 1 2 2 p[a b] perm
[2 1]
```

```froth
froth> 3 5 2 p[b a b] perm
[3 5 3]
```

```froth
froth> 10 20 30 3 p[a c] perm
[30 10]
```

The stdlib words below are mostly small wrappers around `perm`, so once `perm` makes sense, the rest of the stack vocabulary gets much easier to read.

---

### Stdlib — Stack Shuffle Words

All defined in `core.froth` using `perm`.

**`dup`** *(Froth)*  `( a -- a a )`

Duplicates the top value.

```froth
: dup 1 p[a a] perm ;
```

```froth
froth> 5 dup
[5 5]
```

**`swap`** *(Froth)*  `( a b -- b a )`

Exchanges the top two values.

```froth
: swap 2 p[a b] perm ;
```

```froth
froth> 1 2 swap
[2 1]
```

**`drop`** *(Froth)*  `( a -- )`

Discards the top value.

```froth
: drop 1 p[] perm ;
```

```froth
froth> 5 drop
[]
```

**`over`** *(Froth)*  `( a b -- a b a )`

Copies the second value to the top.

```froth
: over 2 p[b a b] perm ;
```

```froth
froth> 3 5 over
[3 5 3]
```

**`rot`** *(Froth)*  `( a b c -- b c a )`

Rotates the top three values: third comes to top.

```froth
: rot 3 p[b a c] perm ;
```

```froth
froth> 1 2 3 rot
[2 3 1]
```

**`-rot`** *(Froth)*  `( a b c -- c a b )`

Reverse rotation: top goes to third position.

```froth
: -rot 3 p[a c b] perm ;
```

```froth
froth> 1 2 3 -rot
[3 1 2]
```

**`nip`** *(Froth)*  `( a b -- b )`

Drops the second value.

```froth
: nip 2 p[a] perm ;
```

```froth
froth> 3 5 nip
[5]
```

**`tuck`** *(Froth)*  `( a b -- b a b )`

Copies the top value below the second.

```froth
: tuck 2 p[a b a] perm ;
```

```froth
froth> 3 5 tuck
[5 3 5]
```

---

## Arithmetic

**`+`** *(C)*  `( a b -- sum )`

Adds two integers.

```froth
froth> 3 4 +
[7]
```

**`-`** *(C)*  `( a b -- diff )`

Subtracts `b` from `a`.

```froth
froth> 10 3 -
[7]
```

**`*`** *(C)*  `( a b -- product )`

Multiplies two integers.

```froth
froth> 3 4 *
[12]
```

**`/mod`** *(C)*  `( a b -- remainder quotient )`

Integer division of `a` by `b`. Leaves remainder (below) and quotient (top). Division by zero throws -10.

```froth
froth> 10 3 /mod
[1 3]
```

---

### Stdlib — Arithmetic

**`negate`** *(Froth)*  `( n -- -n )`

Negates a number.

```froth
: negate 0 swap - ;
```

```froth
froth> 5 negate
[-5]
```

**`abs`** *(Froth)*  `( n -- |n| )`

Absolute value.

```froth
froth> -7 abs
[7]
```

---

## Comparisons

**`<`** *(C)*  `( a b -- flag )`

Pushes 1 if `a < b`, 0 otherwise.

```froth
froth> 3 5 <
[1]
```

**`>`** *(C)*  `( a b -- flag )`

Pushes 1 if `a > b`, 0 otherwise.

```froth
froth> 5 3 >
[1]
```

**`=`** *(C)*  `( a b -- flag )`

Pushes 1 if `a = b`, 0 otherwise.

```froth
froth> 4 4 =
[1]
```

---

## Bitwise

**`and`** *(C)*  `( a b -- result )`

Bitwise AND.

```froth
froth> 0b1100 0b1010 and
[0b1000]
```

**`or`** *(C)*  `( a b -- result )`

Bitwise OR.

```froth
froth> 0b1100 0b1010 or
[0b1110]
```

**`xor`** *(C)*  `( a b -- result )`

Bitwise XOR.

```froth
froth> 0b1100 0b1010 xor
[0b0110]
```

**`invert`** *(C)*  `( a -- ~a )`

Bitwise complement (all bits flipped).

```froth
froth> 0 invert
all-ones for cell size
```

**`lshift`** *(C)*  `( a n -- result )`

Shifts `a` left by `n` bits.

```froth
froth> 1 3 lshift
[8]
```

**`rshift`** *(C)*  `( a n -- result )`

Logical right shift of `a` by `n` bits.

```froth
froth> 16 2 rshift
[4]
```

---

## Quotations

**`q.len`** *(C)*  `( q -- n )`

Number of items in a quotation.

```froth
froth> [ 1 2 3 ] q.len
[3]
```

**`q@`** *(C)*  `( q i -- val )`

The item at index `i` (zero-based) in a quotation.

```froth
froth> [ 10 20 30 ] 1 q@
[20]
```

**`q.pack`** *(C)*  `( v0 ... vn-1 n -- q )`

Packs the top `n` stack values into a new quotation.

```froth
froth> 10 20 2 q.pack
[<q: 10 20>]
```

**`call`** *(C)*  `( callable -- ... )`

Executes a quotation or a slot reference. Stack effect depends on the callee.

```froth
froth> 5 [ 2 * ] call
[10]
```

**`choose`** *(C)*  `( flag t f -- val )`

Selects `t` if flag is non-zero, `f` if flag is zero. Does not call the selected value.

```froth
froth> 1 [ 10 ] [ 20 ] choose
[<q:10>]
```

---

## Patterns

**`perm`** *(C)*  `( ... n p[labels] -- ... )`

General stack permutation. See Stack Manipulation section above.

**`pat`** *(C)*  `( -- p[...] )`

Pushes a pattern literal onto the stack. Patterns are written as `p[labels]` in source.

```froth
froth> p[a b a]
```

Pushes the pattern value.

---

## Definitions and Bindings

**`def`** *(C)*  `( slot value -- )`

Raw slot binding primitive. Accepts any Froth value and clears arity metadata on successful rebind.

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

Binds a quotation to a slot. Use this when the intent is callable rebinding rather than data rebinding.

```froth
froth> [ 1 + ] 'hook is
```

**`defer`** *(C)*  `( 'name -- )`

Declares an unbound slot.

```froth
froth> 'hook defer
```

**`get`** *(C)*  `( 'name -- value )`

Retrieves the value from a named slot without calling it.

```froth
froth> 'double get
the quotation stored in double
```

**`arity!`** *(C)*  `( slot in out -- )`

Records arity metadata for a slot-backed word.

```froth
froth> 'my-word 2 1 arity!
```

---

## Control Flow

**`while`** *(C)*  `( condition-q body-q -- )`

Calls `condition-q`; if the result is non-zero, calls `body-q` and repeats. Stops when condition returns zero.

```froth
froth> 3 [ dup 0 > ] [ dup . 1 - ] while drop
prints 3 2 1
```

---

### Stdlib — Control Flow

**`if`** *(Froth)*  `( flag t-q f-q -- ... )`

Selects and calls one of two quotations based on a flag.

```froth
: if choose call ;
```

```froth
froth> 1 [ "yes" s.emit ] [ "no" s.emit ] if
```

**`when`** *(Froth)*  `( flag q -- )`

Calls `q` only if flag is non-zero; otherwise drops both. Equivalent to `[ ] if`.

```froth
froth> x 0 = [ 42 throw ] when
```

---

## Error Handling

**`catch`** *(C)*  `( q -- ... err )`

Calls `q` in a protected context. If `q` throws error code `n`, restores the data stack to its pre-call state and pushes `n`. If `q` completes normally, pushes 0.

```froth
froth> [ 1 0 /mod ] catch
[-10]
```

on error

**`throw`** *(C)*  `( n -- )`

Signals an error with numeric code `n`. If `n` is zero, does nothing. Unhandled throws propagate to the nearest `catch` or to the REPL.

```froth
froth> 42 throw
signals application error 42
```

---

## Strings

These words are part of the normal string surface in standard builds.

**`s.emit`** *(C)*  `( s -- )`

Prints all bytes of a string to the output channel.

```froth
froth> "hello" s.emit
outputs hello
```

**`s.len`** *(C)*  `( s -- n )`

Pushes the byte length of a string.

```froth
froth> "hello" s.len
[5]
```

**`s@`** *(C)*  `( s i -- n )`

Pushes the byte value at zero-based index `i`. Out-of-bounds access is an error.

```froth
froth> "abc" 0 s@
[97]
```

ASCII `a`

**`s.=`** *(C)*  `( s1 s2 -- flag )`

Pushes 1 if the two strings are byte-for-byte equal, 0 otherwise.

```froth
froth> "hello" "hello" s.=
[1]
```

---

## I/O

**`emit`** *(C)*  `( n -- )`

Sends the low byte of `n` as a character to the output channel.

```froth
froth> 65 emit
outputs A
```

**`key`** *(C)*  `( -- n )`

Reads one character from the input channel; blocks until one is available. Pushes its ASCII value.

```froth
froth> key .
waits for keypress, prints its code
```

**`key?`** *(C)*  `( -- flag )`

Non-blocking check: pushes 1 if input is available, 0 if not.

```froth
froth> key? [ key emit ] when
```

---

### Stdlib — I/O

**`cr`** *(Froth)*  `( -- )`

Sends a newline to the output channel.

```froth
: cr 10 emit ;
```

```froth
froth> "hello" s.emit cr
```

---

## Memory and State

**`create`** *(C)*  `( slot -- )`

Binds a slot to the CellSpace allocation pointer. Top-level only.

```froth
froth> 'rows create
froth> 3 allot
```

**`allot`** *(C)*  `( n -- )`

Reserves `n` zero-initialized cells in CellSpace. Top-level only.

```froth
froth> 8 allot
```

**`variable`** *(C)*  `( slot -- )`

Allocates one CellSpace cell and binds its address to the slot.

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

Cell-count helper. In CellSpace, addresses are already cell-indexed, so this is an identity word kept for readability.

```froth
froth> 8 cells
[8]
```

**`cell+`** *(Froth)*  `( addr -- addr' )`

Advances a CellSpace address by one cell.

```froth
froth> rows cell+
```

**`+!`** *(Froth)*  `( delta addr -- )`

Adds `delta` to the number stored at `addr`.

```froth
froth> 1 counter +!
```

**`mark`** *(C)*  `( -- region )`

Creates a new heap region and pushes a region handle. Allocations after `mark` belong to this region.

```froth
froth> mark
[<region>]
```

**`release`** *(C)*  `( region -- )`

Frees all heap memory allocated since the corresponding `mark`.

```froth
froth> mark ... release
```

---

## Introspection

**`.`** *(C)*  `( n -- )`

Prints the top value as a decimal integer followed by a space, then discards it.

```froth
froth> 42 .
outputs 42 
```

**`.s`** *(C)*  `( -- )`

Displays all stack values without consuming them. Bottom to top, with top labeled.

```froth
froth> 1 2 3 .s
displays [1 2 3]
```

**`words`** *(C)*  `( -- )`

Prints a list of all defined word names in the session.

```froth
froth> words
```

**`see`** *(C)*  `( 'name -- )`

Prints the definition of the named word in colon-semicolon form.

```froth
froth> 'dup see
: dup ( a -- a a ) 1 p[a a] perm ;
```

**`info`** *(C)*  `( -- )`

Prints runtime information such as version, board, cell size, max payload, heap usage, CellSpace usage, and slot count.

```froth
froth> info
```

---

## Auxiliary Stack (Return Stack)

**`>r`** *(C)*  `( a -- ) ( R: -- a )`

Moves the top data stack value to the return stack.

```froth
froth> 42 >r
```

Stores 42 on the return stack.

**`r>`** *(C)*  `( -- a ) ( R: a -- )`

Moves the top return stack value to the data stack.

```froth
froth> r>
pushes whatever was stashed
```

**`r@`** *(C)*  `( -- a ) ( R: a -- a )`

Copies (does not remove) the top return stack value to the data stack.

```froth
froth> r@
peeks at return stack top
```

---

## Snapshots

Requires `FROTH_HAS_SNAPSHOTS` build option.

**`save`** *(C)*  `( -- )`

Writes the overlay snapshot to non-volatile storage. This includes overlay slot bindings, reachable heap objects, and the allocated CellSpace prefix.

```froth
froth> save
```

**`restore`** *(C)*  `( -- )`

Restores the most recent snapshot over the base image. Called automatically at boot when snapshots are enabled and safe boot was not requested.

```froth
froth> restore
```

**`wipe`** *(C)*  `( -- )`

Erases saved snapshots and resets the target back to its base image.

```froth
froth> wipe
```

---

## System

**`dangerous-reset`** *(C)*  `( -- )`

Immediately resets the microcontroller. No cleanup. All unsaved state is lost. Named to discourage casual use.

```froth
froth> dangerous-reset
```

---

## Stdlib — Combinators

**`dip`** *(Froth)*  `( a q -- result a )`

Temporarily removes the top value, calls `q`, then restores the value.

```froth
: dip swap >r call r> ;
```

```froth
froth> 1 2 [ 10 + ] dip
[11 2]
```

**`keep`** *(Froth)*  `( x q -- result x )`

Calls `q` with `x` on the stack, then restores `x`.

```froth
: keep over swap call swap ;
```

```froth
froth> 5 [ 2 * ] keep
[10 5]
```

**`bi`** *(Froth)*  `( x f g -- f(x) g(x) )`

Applies two quotations to the same value; leaves both results.

```froth
: bi -rot keep rot call ;
```

```froth
froth> 10 [ 2 * ] [ 1 + ] bi
[20 11]
```

**`times`** *(Froth)*  `( n q -- )`

Calls `q` exactly `n` times.

```froth
froth> 3 [ 42 . ] times
prints 42 three times
```

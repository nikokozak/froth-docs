---
title: "Word Reference"
weight: 1
---

Complete reference for all Froth words. Entries follow the format:

```
word  ( stack-effect )  One-line description.
Example: expression → result
```

**C** = primitive implemented in C.  **Froth** = defined in `core.froth` (stdlib).

---

## Stack Manipulation

### Primitives

**`perm`** *(C)*  `( ... n p[labels] -- ... )`
Rearranges the top `n` stack values according to the pattern. Labels are single lowercase letters; `a` = TOS, `b` = one below, `c` = two below. The pattern describes the output layout from deepest to TOS. Labels may be omitted (drop) or repeated (duplicate).
Example: `1 2 2 p[a b] perm` → `[2 1]`

---

### Stdlib — Stack Shuffle Words

All defined in `core.froth` using `perm`.

**`dup`** *(Froth)*  `( a -- a a )`
Duplicates the top value.
Definition: `: dup 1 p[a a] perm ;`
Example: `5 dup` → `[5 5]`

**`swap`** *(Froth)*  `( a b -- b a )`
Exchanges the top two values.
Definition: `: swap 2 p[a b] perm ;`
Example: `1 2 swap` → `[2 1]`

**`drop`** *(Froth)*  `( a -- )`
Discards the top value.
Definition: `: drop 1 p[] perm ;`
Example: `5 drop` → `[]`

**`over`** *(Froth)*  `( a b -- a b a )`
Copies the second value to the top.
Definition: `: over 2 p[b a b] perm ;`
Example: `3 5 over` → `[3 5 3]`

**`rot`** *(Froth)*  `( a b c -- b c a )`
Rotates the top three values: third comes to top.
Definition: `: rot 3 p[b a c] perm ;`
Example: `1 2 3 rot` → `[2 3 1]`

**`-rot`** *(Froth)*  `( a b c -- c a b )`
Reverse rotation: top goes to third position.
Definition: `: -rot 3 p[a c b] perm ;`
Example: `1 2 3 -rot` → `[3 1 2]`

**`nip`** *(Froth)*  `( a b -- b )`
Drops the second value.
Definition: `: nip 2 p[a] perm ;`
Example: `3 5 nip` → `[5]`

**`tuck`** *(Froth)*  `( a b -- b a b )`
Copies the top value below the second.
Definition: `: tuck 2 p[a b a] perm ;`
Example: `3 5 tuck` → `[5 3 5]`

---

## Arithmetic

**`+`** *(C)*  `( a b -- sum )`
Adds two integers.
Example: `3 4 +` → `[7]`

**`-`** *(C)*  `( a b -- diff )`
Subtracts `b` from `a`.
Example: `10 3 -` → `[7]`

**`*`** *(C)*  `( a b -- product )`
Multiplies two integers.
Example: `3 4 *` → `[12]`

**`/mod`** *(C)*  `( a b -- remainder quotient )`
Integer division of `a` by `b`. Leaves remainder (below) and quotient (top). Division by zero throws -10.
Example: `10 3 /mod` → `[1 3]`

---

### Stdlib — Arithmetic

**`negate`** *(Froth)*  `( n -- -n )`
Negates a number.
Definition: `: negate 0 swap - ;`
Example: `5 negate` → `[-5]`

**`abs`** *(Froth)*  `( n -- |n| )`
Absolute value.
Example: `-7 abs` → `[7]`

---

## Comparisons

**`<`** *(C)*  `( a b -- flag )`
Pushes 1 if `a < b`, 0 otherwise.
Example: `3 5 <` → `[1]`

**`>`** *(C)*  `( a b -- flag )`
Pushes 1 if `a > b`, 0 otherwise.
Example: `5 3 >` → `[1]`

**`=`** *(C)*  `( a b -- flag )`
Pushes 1 if `a = b`, 0 otherwise.
Example: `4 4 =` → `[1]`

---

## Bitwise

**`and`** *(C)*  `( a b -- result )`
Bitwise AND.
Example: `0b1100 0b1010 and` → `[0b1000]`

**`or`** *(C)*  `( a b -- result )`
Bitwise OR.
Example: `0b1100 0b1010 or` → `[0b1110]`

**`xor`** *(C)*  `( a b -- result )`
Bitwise XOR.
Example: `0b1100 0b1010 xor` → `[0b0110]`

**`invert`** *(C)*  `( a -- ~a )`
Bitwise complement (all bits flipped).
Example: `0 invert` → all-ones for cell size

**`lshift`** *(C)*  `( a n -- result )`
Shifts `a` left by `n` bits.
Example: `1 3 lshift` → `[8]`

**`rshift`** *(C)*  `( a n -- result )`
Logical right shift of `a` by `n` bits.
Example: `16 2 rshift` → `[4]`

---

## Quotations

**`q.len`** *(C)*  `( q -- n )`
Number of items in a quotation.
Example: `[ 1 2 3 ] q.len` → `[3]`

**`q@`** *(C)*  `( q i -- val )`
The item at index `i` (zero-based) in a quotation.
Example: `[ 10 20 30 ] 1 q@` → `[20]`

**`q.pack`** *(C)*  `( v0 ... vn-1 n -- q )`
Packs the top `n` stack values into a new quotation.
Example: `10 20 2 q.pack` → `[<q: 10 20>]`

**`call`** *(C)*  `( q -- ... )`
Executes a quotation. Stack effect depends on quotation body.
Example: `5 [ 2 * ] call` → `[10]`

**`choose`** *(C)*  `( flag t f -- val )`
Selects `t` if flag is non-zero, `f` if flag is zero. Does not call the selected value.
Example: `1 [ 10 ] [ 20 ] choose` → `[<q:10>]`

---

## Patterns

**`perm`** *(C)*  `( ... n p[labels] -- ... )`
General stack permutation. See Stack Manipulation section above.

**`pat`** *(C)*  `( -- p[...] )`
Pushes a pattern literal onto the stack. Patterns are written as `p[labels]` in source.
Example: `p[a b a]` pushes the pattern value

---

## Definitions

**`def`** *(C)*  `( val 'name -- )`
Binds a value to a named slot. Creates the slot if it does not exist; updates it if it does.
Example: `[ 2 * ] 'double def`

**`get`** *(C)*  `( 'name -- val )`
Retrieves the current value from a named slot without calling it.
Example: `'double get` → the quotation stored in `double`

**`arity!`** *(C)*  `( n 'name -- )`
Records the arity (input count) annotation for a named word. Used by FROTH-Checked.
Example: `2 'my-word arity!`

---

## Control Flow

**`while`** *(C)*  `( condition-q body-q -- )`
Calls `condition-q`; if the result is non-zero, calls `body-q` and repeats. Stops when condition returns zero.
Example: `3 [ dup 0 > ] [ dup . 1 - ] while drop` → prints `3 2 1`

---

### Stdlib — Control Flow

**`if`** *(Froth)*  `( flag t-q f-q -- ... )`
Selects and calls one of two quotations based on a flag.
Definition: `: if choose call ;`
Example: `1 [ "yes" s.emit ] [ "no" s.emit ] if`

**`when`** *(Froth)*  `( flag q -- )`
Calls `q` only if flag is non-zero; otherwise drops both. Equivalent to `[ ] if`.
Example: `x 0 = [ 42 throw ] when`

---

## Error Handling

**`catch`** *(C)*  `( q -- ... err )`
Calls `q` in a protected context. If `q` throws error code `n`, restores the data stack to its pre-call state and pushes `n`. If `q` completes normally, pushes 0.
Example: `[ 1 0 /mod ] catch` → `[-10]` on error

**`throw`** *(C)*  `( n -- )`
Signals an error with numeric code `n`. If `n` is zero, does nothing. Unhandled throws propagate to the nearest `catch` or to the REPL.
Example: `42 throw` → signals application error 42

---

## Strings

Requires FROTH-String-Lite or FROTH-String profile unless noted.

**`s.emit`** *(C)*  `( s -- )`
Prints all bytes of a string to the output channel.
Example: `"hello" s.emit` → outputs `hello`

**`s.len`** *(C)*  `( s -- n )`
Pushes the byte length of a string.
Example: `"hello" s.len` → `[5]`

**`s@`** *(C)*  `( s i -- n )`
Pushes the byte value at zero-based index `i`. Out-of-bounds access is an error.
Example: `"abc" 0 s@` → `[97]` (ASCII `a`)

**`s.=`** *(C)*  `( s1 s2 -- flag )`
Pushes 1 if the two strings are byte-for-byte equal, 0 otherwise.
Example: `"hello" "hello" s.=` → `[1]`

---

## I/O

**`emit`** *(C)*  `( n -- )`
Sends the low byte of `n` as a character to the output channel.
Example: `65 emit` → outputs `A`

**`key`** *(C)*  `( -- n )`
Reads one character from the input channel; blocks until one is available. Pushes its ASCII value.
Example: `key .` → waits for keypress, prints its code

**`key?`** *(C)*  `( -- flag )`
Non-blocking check: pushes 1 if input is available, 0 if not.
Example: `key? [ key emit ] when`

---

### Stdlib — I/O

**`cr`** *(Froth)*  `( -- )`
Sends a newline to the output channel.
Definition: `: cr 10 emit ;`
Example: `"hello" s.emit cr`

---

## Memory

**`mark`** *(C)*  `( -- region )`
Creates a new heap region and pushes a region handle. Allocations after `mark` belong to this region.
Example: `mark` → `[<region>]`

**`release`** *(C)*  `( region -- )`
Frees all heap memory allocated since the corresponding `mark`. References to freed memory become invalid.
Example: `mark ... release`

---

## Introspection

**`.`** *(C)*  `( n -- )`
Prints the top value as a decimal integer followed by a space, then discards it.
Example: `42 .` → outputs `42 `

**`.s`** *(C)*  `( -- )`
Displays all current stack values without consuming them. Bottom to top, with top labeled.
Example: `1 2 3 .s` → displays `[1 2 3]`

**`words`** *(C)*  `( -- )`
Prints a list of all defined word names in the current session.
Example: `words`

**`see`** *(C)*  `( 'name -- )`
Prints the definition of the named word in colon-semicolon form.
Example: `'dup see` → `: dup ( a -- a a ) 1 p[a a] perm ;`

**`info`** *(C)*  `( -- )`
Prints runtime statistics: heap usage, slot count, stack depth, cell size, enabled profiles.
Example: `info`

---

## Auxiliary Stack (Return Stack)

Requires FROTH-Addr profile or built-in primitive depending on target.

**`>r`** *(C)*  `( a -- ) ( R: -- a )`
Moves the top data stack value to the return stack.
Example: `42 >r` (stores 42 on return stack)

**`r>`** *(C)*  `( -- a ) ( R: a -- )`
Moves the top return stack value to the data stack.
Example: `r>` → pushes whatever was stashed

**`r@`** *(C)*  `( -- a ) ( R: a -- a )`
Copies (does not remove) the top return stack value to the data stack.
Example: `r@` → peeks at return stack top

---

## Snapshots

Requires `FROTH_HAS_SNAPSHOTS` build option.

**`save`** *(C)*  `( -- )`
Writes the current heap and slot table to non-volatile storage. On ESP32, uses NVS with A/B rotation.
Example: `save`

**`restore`** *(C)*  `( -- )`
Loads the most recently saved snapshot, replacing the current heap and slot table. Called automatically at boot.
Example: `restore`

**`wipe`** *(C)*  `( -- )`
Clears all saved snapshots. The next boot starts with an empty session (stdlib still loads).
Example: `wipe`

---

## System

**`dangerous-reset`** *(C)*  `( -- )`
Immediately resets the microcontroller. No cleanup. All unsaved state is lost. Named to discourage casual use.
Example: `dangerous-reset`

---

## Stdlib — Combinators

**`dip`** *(Froth)*  `( a q -- result a )`
Temporarily removes the top value, calls `q`, then restores the value.
Definition: `: dip swap >r call r> ;`
Example: `1 2 [ 10 + ] dip` → `[11 2]`

**`keep`** *(Froth)*  `( x q -- result x )`
Calls `q` with `x` on the stack, then restores `x`.
Definition: `: keep over swap call swap ;`
Example: `5 [ 2 * ] keep` → `[10 5]`

**`bi`** *(Froth)*  `( x f g -- f(x) g(x) )`
Applies two quotations to the same value; leaves both results.
Definition: `: bi -rot keep rot call ;`
Example: `10 [ 2 * ] [ 1 + ] bi` → `[20 11]`

**`times`** *(Froth)*  `( n q -- )`
Calls `q` exactly `n` times.
Example: `3 [ 42 . ] times` → prints `42` three times

**`set`** *(Froth)*  `( val 'name -- )`
Stores `val` in the named slot. Alias for `def`.
Example: `99 'counter set`

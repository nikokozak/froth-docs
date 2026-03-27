---
title: "Strings and I/O"
weight: 8
---

`72 emit` sends the letter `H` to the output channel. That single word, `emit`, is the foundation of all output in Froth. Everything else in this chapter builds on it.

## Character output: `emit` and `cr`

`emit ( char -- )` takes an integer from the stack and sends the corresponding ASCII byte to the output channel. No newline, no formatting, no trailing space.

```froth
72 emit 105 emit
\ output: Hi
```

`72` is ASCII for `H`, `105` is ASCII for `i`. The two characters appear immediately, with nothing between them and no newline after.

The output channel is the same one the REPL uses. On an ESP32, that is the USB serial connection. On the local POSIX target, it is stdout. You do not configure it; it is already there.

`cr ( -- )` sends a newline. It is defined as `10 emit`, nothing more.

```froth
72 emit 105 emit cr
\ output: Hi
\ (followed by a newline)
```

## Printing values: `.` and `.s`

`. ( x -- )` prints the top of the stack as a decimal integer followed by a space, then removes it. The trailing space prevents adjacent numbers from running together.

```froth
42 . cr
\ output: 42
\ (followed by a newline)
```

The space after `42` is part of what `.` does. If you print two values in sequence, the spaces separate them:

```froth
1 2 3 . . .
\ output: 3 2 1
```

The order is reversed because the stack is last-in, first-out. `3` was on top, so `.` prints it first.

`.s ( -- )` prints the entire stack without consuming anything. It is the debugging word you have been using since chapter 03. Here it just gets a formal introduction: `.s` shows you what is on the stack right now, leaves everything in place, and adds a newline.

```froth
1 2 3 .s
\ output: [1 2 3]
```

## Reading input: `key` and `key?`

`key ( -- char )` reads a single byte from the input channel and pushes its ASCII value. It blocks until a byte is available. On hardware, this reads from the same serial connection the REPL uses.

`key? ( -- flag )` checks whether input is available without blocking. It pushes a truthy value if a byte is waiting, zero if not. The `?` suffix is a Froth convention for non-blocking check words.

A simple echo, one character at a time:

```froth
: echo-once ( -- )
  key emit ;
```

`echo-once` waits for a keypress, then sends the same character back. On hardware over serial, the character appears in your terminal.

`key?` is useful when you want to check for input without stalling. A word that reads a character if one is available, or reports that none was ready:

```froth
: check-input ( -- )
  key? [ key . ] [ "no input" s.emit ] if cr ;
```

## String literals

A string literal is written with double quotes:

```froth
"hello, froth"
```

This allocates a string on the heap and pushes a reference (a `StringRef`) onto the stack. The value on the stack is a single opaque item, not a sequence of characters. Stack effect: `( -- s )`.

Strings are immutable. You can read their contents, compare them, and pass them around, but you cannot modify the bytes of an existing string. There is no `s!` (set byte at index) in the vocabulary.

Strings carry their own length. They are not null-terminated. A null byte inside a string has no special meaning.

### Transient and permanent strings

String literals created during normal execution are transient: they live in a temporary allocation region. For most REPL work, this distinction does not matter. But if you need a string to survive across region boundaries (for instance, storing it in a long-lived data structure), promote it with `s.keep`:

```froth
"hello" s.keep
```

`s.keep ( s -- s )` copies the string into permanent storage and returns a new reference. The original transient reference still works until its region is released, but the kept copy persists.

## String operations

**`s.emit ( s -- )`** prints every byte of the string to the output channel. No newline, no trailing space.

```froth
"hello, froth" s.emit cr
\ output: hello, froth
```

**`s.len ( s -- n )`** pushes the byte length of the string.

```froth
"hello" s.len .
\ output: 5
```

**`s@ ( s i -- byte )`** pushes the byte value at index `i`. Indexing is zero-based. Accessing an out-of-bounds index throws `ERR.BOUNDS` (error code 13).

```froth
"abc" 0 s@ .
\ output: 97
```

`97` is the ASCII value of `a`. The character at index 2 would be `99` (ASCII `c`).

**`s.= ( s1 s2 -- flag )`** compares two strings byte by byte. Pushes a truthy value if they match, zero if they do not.

```froth
"hello" "hello" s.= .
\ output: 1

"hello" "world" s.= .
\ output: 0
```

**`s.concat ( s1 s2 -- s3 )`** concatenates two strings and pushes a new string reference.

```froth
"hello, " "froth" s.concat s.emit cr
\ output: hello, froth
```

The original strings are not modified. The result is a new transient string.

## Number-to-string conversion

Two words convert numbers to string representations:

**`n>s ( n -- s )`** converts a number to its decimal string form.

```froth
42 n>s s.emit cr
\ output: 42
```

**`n>hexs ( n -- s )`** converts a number to a hexadecimal string with a `0x` prefix.

```froth
255 n>hexs s.emit cr
\ output: 0xFF
```

These are useful when you need a number inside a larger string, or when you want to control the output format more precisely than `.` allows (which always appends a trailing space).

## Building output from parts

Because output words are just words, you chain them in any order. The stack carries intermediate values; each output word consumes one.

Print a label and a value:

```froth
"temperature: " s.emit 25 . cr
\ output: temperature: 25
```

Print multiple labeled values:

```froth
"x=" s.emit 10 . "y=" s.emit 20 . cr
\ output: x=10 y=20
```

Note the trailing space after each number. That space comes from `.`. If you want tighter formatting, convert the number to a string with `n>s` and use `s.emit` instead:

```froth
"pin " s.emit 2 n>s s.emit " is high" s.emit cr
\ output: pin 2 is high
```

A word that prints a labeled reading:

```froth
: print-reading ( n -- )
  "sensor: " s.emit . cr ;

42 print-reading
\ output: sensor: 42
```

## An echo loop

Here is a complete interactive program that reads characters and sends them back until you type `q`:

```froth
: echo-loop ( -- )
  [ key dup emit dup 113 = 0 = ] [ ] while drop ;
```

Walking through the condition quotation:

1. `key` blocks until a character arrives; pushes its ASCII value.
2. `dup emit` copies the value and sends the character back to the terminal.
3. `dup 113 =` checks whether the character is `q` (ASCII 113). Leaves a flag.
4. `0 =` inverts the flag: the `while` loop continues while the character is *not* `q`.

When you type `q`, the condition produces a falsy value, `while` exits, and `drop` cleans up the last character's ASCII value from the stack. Control returns to the REPL prompt.

On hardware, `key` reads from the same serial channel the REPL uses. While `echo-loop` is running, every keystroke goes to `key` instead of the REPL. Typing `q` exits the loop and gives the REPL back control.

## Exercises

**Exercise 1.** Without running it, predict the output of:

```froth
65 emit 66 emit 67 emit cr
```

**Exercise 2.** What does `"hello" s.len .` print?

**Exercise 3.** What is the ASCII value of the character at index 1 of `"cat"`? Write the expression and predict the result before running it.

**Exercise 4.** Write an expression that tests whether `"foo"` equals `"foo"` and prints the result.

**Exercise 5.** Define a word `greet ( -- )` that prints `hello, world` followed by a newline, using `s.emit` and `cr`.

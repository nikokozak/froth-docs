# Strings and I/O

_Froth's I/O model is minimal by design. This chapter covers everything you need to print output, read input, and work with string values — the full picture, nothing more._

---

## Outline and writing notes

This chapter has two audiences in one. Some readers are working locally and want to print values to the terminal. Others are working with an ESP32 over serial and want the same thing over USB. Both get exactly the same words — the output target is transparent. Acknowledge this early, then move on without belaboring it.

The character-level primitives (`emit`, `key`, `key?`) are simple but underexplained in most Forth tutorials. Spending a paragraph or two on them pays off because they're the foundation for everything higher-level. Once the reader understands that `s.emit` is just `emit` repeated over each byte, the whole I/O model becomes obvious.

Strings in Froth are immutable and heap-allocated. The "no GC" note matters for embedded readers who are sensitive to memory allocation. Be precise: strings live until the region they were allocated in is released. This is not a concern during normal REPL use, but matters in long-running programs.

Tone: practical and fast-moving. This chapter doesn't have difficult concepts. Move through the vocabulary quickly with examples, then spend the real time on the echo program at the end, which combines everything.

---

## Subsections

### 1. Character I/O: `emit`, `key`, `key?`

**Purpose:** Introduce the three lowest-level I/O primitives. Everything else in this chapter builds on them.

**What to cover:**
- `emit ( n -- )` takes an integer and sends the corresponding ASCII byte to the output channel. No newline, no formatting — just the raw character. `72 emit` sends `H`. `33 emit` sends `!`.
- `key ( -- n )` reads a single character from the input channel and pushes its ASCII value. Blocks until a character is available. Used for interactive programs that need to wait for user input.
- `key? ( -- flag )` checks whether input is available without blocking. Pushes a truthy value if a character is waiting, zero if not. The `?` suffix is the Froth convention for non-blocking check words.
- The output channel is the same channel as the REPL: over USB serial when on hardware, stdout on the local POSIX target. You don't configure it; it's already there.

**Code example — spell "Hi" with `emit`:**
```froth
72 emit 105 emit
```
Sends `H` (72) then `i` (105). The output appears immediately, with no newline.

**Code example — `key?` in a check loop:**
Show the mental model: `key?` is used to poll, `key` is used to consume. A tight `[ key? ] [ ] while key` pattern (wait until available, then read) is equivalent to just calling `key` directly — but `key?` lets you do other work while waiting.

**Writer note:** Confirm whether `key` on the ESP32 target reads from the USB serial REPL console, or from a separate UART. If it's the same channel as the REPL, mention that briefly — in interactive use, `key` captures keystrokes that would otherwise be echoed as REPL input. This matters for the echo example in section 7.

---

### 2. `cr` and `.`

**Purpose:** Introduce the two most-used output words before getting into strings.

**What to cover:**
- `cr ( -- )` sends a newline (carriage return + line feed, or just line feed — verify the actual behavior). The most common word in output-heavy code.
- `. ( n -- )` (pronounced "dot") pops the top of the stack and prints it as a decimal integer, followed by a space. The space separator prevents adjacent numbers from merging. `1 2 . .` prints `2 1 ` — note the order: stack is LIFO, so 2 was on top.
- `.` is the primary way to print numbers at the REPL. You've been using it since chapter 02. This section just names it explicitly and explains the trailing space.
- Combined: `42 . cr` prints `42` on its own line.

**Code example — print a value and move to a new line:**
```froth
42 . cr
```
Output: `42 ` followed by a newline.

**Writer note:** If `.` behavior (trailing space vs. no space) differs from standard ANS Forth, note the difference. Some Froth implementations follow the standard exactly; others omit the space. Check the actual behavior and describe what the reader will see.

---

### 3. String literals

**Purpose:** Explain how string values are written and what they produce on the stack.

**What to cover:**
- A string literal is written with double quotes: `"hello"`. When the interpreter evaluates this, it allocates a StringRef on the heap and pushes a reference to it on the stack.
- The value on the stack is a StringRef — a single opaque value. Stack notation: `( -- s )` where `s` represents a StringRef.
- String literals can contain any ASCII characters between the quotes. The quotes are delimiters, not part of the string content.
- Strings are immutable: you can read from them, compare them, and pass them around, but you can't modify them in place.
- Strings are heap-allocated. In normal REPL use, this isn't something to worry about. In long-running embedded programs, strings live until the region they were allocated in is released. There is no garbage collector. If a string is allocated in a region that gets released, references to it become invalid. (The practical implication for most readers: don't store StringRefs across region boundaries. At the REPL, this never comes up.)
- For readers coming from C: a StringRef is not a null-terminated char pointer. It carries its own length. Null bytes in strings are not special.

**Code example — push a string literal:**
```froth
"hello, froth"
```
Stack after: `[<StringRef>]`

**Writer note:** Show what the REPL actually displays when a StringRef is on the stack. Some REPLs show the string content in angle brackets; some show an opaque address. Describe the actual output so readers aren't confused by what they see.

---

### 4. String operations

**Purpose:** Teach the core string vocabulary: print, length, byte access, equality.

**What to cover:**

**`s.emit ( s -- )`** — prints the string to the output channel. Like `emit` for each character in sequence. `"hello, froth" s.emit` prints `hello, froth` with no newline.

**`s.len ( s -- n )`** — pushes the length of the string in bytes. `"hello" s.len` → 5.

**`s@ ( s i -- n )`** — pushes the byte value at index `i` (zero-based). `"abc" 0 s@` → 97 (ASCII for `a`). `"abc" 2 s@` → 99 (ASCII for `c`). Accessing an out-of-bounds index is an error.

**`s.= ( s1 s2 -- flag )`** — compares two strings for byte-by-byte equality. Pushes a truthy value if they match, zero if not. `"hello" "hello" s.=` → 1. `"hello" "world" s.=` → 0.

**Code example — print a string with a newline:**
```froth
"hello, froth" s.emit cr
```

**Code example — get string length:**
```froth
"hello" s.len .
```
Output: `5 `

**Code example — read a byte by index:**
```froth
"abc" 0 s@ .
```
Output: `97 ` (ASCII value of `a`)

**Code example — test equality:**
```froth
"hello" "hello" s.= .
```
Output: `1 ` (true)

**Writer note:** Verify the exact spelling of these words against the implementation. Names like `s.emit`, `s.len`, `s@`, and `s.=` are the expected forms, but confirm each one. If any differ, correct them before publication.

---

### 5. Strings are immutable

**Purpose:** Head off the most common mistake — trying to modify a string in place.

**What to cover:**
- StringRefs are read-only. There are no words that modify the bytes of an existing string. There is no `s!` (set byte at index) in the standard library.
- Why: immutability makes strings safe to pass around without copying. Two references to `"hello"` can point to the same allocation without any risk of one modifying what the other sees.
- For building up output: use `emit`, `s.emit`, and `.` to assemble output word by word. There is no string concatenation word in the core vocabulary — you compose output by sequencing output operations.
- For readers who need mutable byte buffers (e.g., building a protocol packet): that's a different tool, covered in the hardware chapter and reference. String literals aren't the right type for that.

**Writer note:** This section can be short — one paragraph. Its purpose is to head off a confusion, not to teach a new concept. Don't spend more time on it than that.

---

### 6. Building output: combining `emit`, `s.emit`, and `.`

**Purpose:** Show how to compose output from multiple sources in a single sequence.

**What to cover:**
- Because output words are just words, you can chain them in any order. The stack carries intermediate values; words consume them one at a time.
- Pattern: print a label, then a value, then a newline:
  ```froth
  "temperature: " s.emit  25 .  cr
  ```
  Output: `temperature: 25 `
- Pattern: print multiple values with separators:
  ```froth
  "x=" s.emit  10 .  " y=" s.emit  20 .  cr
  ```
  Output: `x=10  y=20 `
- Pattern: build a sentence from parts:
  ```froth
  "pin " s.emit  2 .  " is " s.emit  1 .  cr
  ```
  Output: `pin 2  is 1 `

**Code example — labeled output:**
```froth
"count: " s.emit  42 .  cr
```

**Writer note:** The trailing space from `.` will appear in the output. Point this out explicitly in at least one example — readers often don't expect the space and want to know where it comes from.

---

### 7. Reading input: `key` and `key?` for interactive programs

**Purpose:** Put `key` and `key?` to work in a real interactive pattern.

**What to cover:**
- An echo program reads each character as it arrives and sends it back. This is the simplest interactive Froth program and demonstrates `key` + `emit` working together.
- The challenge: on hardware, `key` reads from the same channel as the REPL. Running an interactive program over the REPL connection takes over the input channel for the duration of the program. The program needs a defined exit condition (e.g., receiving a specific character like `q`) or the reader needs to reset.
- Structure of a key-reading loop:

```froth
: echo-loop ( -- )
  [ key dup emit 113 = ] [ ] while drop ;
```

Walk through the logic:
- `key` — wait for and read one character; its ASCII value is on the stack.
- `dup emit` — duplicate the value, print the character back.
- `113 =` — check if it's `q` (ASCII 113). Leaves flag.
- The condition quotation leaves true (non-113 character received) or false (q received). When false, the `while` loop exits.
- `drop` — clean up the remaining stack value from the last `key`.

**Code example — minimal echo:**
```froth
: echo-once ( -- )
  key emit ;
```
Reads one character, prints it back.

**Code example — echo loop until 'q':**
```froth
: echo-loop ( -- )
  [ key dup emit 113 = not ] [ ] while drop ;
```
(Adjust spelling of `not` to match what's available — may be `0 =`, may be a `not` word. Verify.)

**Code example — `key?` poll:**
```froth
: check-input ( -- )
  key? [ key . ] [ "no input" s.emit ] if cr ;
```
If a character is waiting, read and print its ASCII value. Otherwise print "no input".

**Writer note:** The echo example is the climax of this chapter. Write it out as a step-by-step walkthrough, not just a code block. Readers who trace through it will feel comfortable with interactive I/O. Also note: `echo-loop` as written may interfere with the REPL if the board has a single serial channel. Mention that pressing `q` exits the loop and returns control to the REPL prompt.

---

### 8. Exercises

**Purpose:** The reader practices each word class in a short experiment.

**Exercise 1 — ASCII arithmetic:**
Without running it, predict the output of:
```froth
65 emit 66 emit 67 emit cr
```
Answer: `ABC`

**Exercise 2 — String operations:**
What does this print?
```froth
"hello" s.len .
```
Answer: `5 `

**Exercise 3 — Byte access:**
What is the ASCII value of the character at index 1 of `"cat"`? Write the expression and predict the result before running it.
- Answer: `"cat" 1 s@` → 97 (ASCII for `a`)

**Exercise 4 — Equality test:**
Write an expression that pushes a truthy value if `"foo"` equals `"foo"`, and verify it with `.`.
- Answer: `"foo" "foo" s.=` → `.` prints `1 `

**Exercise 5 — Echo one character:**
Write a word `echo-once` that reads one character from input and prints it back.
- Answer: `: echo-once ( -- ) key emit ;`

---

## Key concepts introduced in this chapter

- `emit ( n -- )`: send one ASCII byte to the output channel
- `key ( -- n )`: read one byte from the input channel; blocks until available
- `key? ( -- flag )`: non-blocking check for waiting input
- `cr ( -- )`: send a newline
- `. ( n -- )`: print top of stack as decimal integer, followed by a space
- String literal `"..."`: allocates a StringRef on the heap; pushes a reference
- `s.emit ( s -- )`: print all bytes of a string
- `s.len ( s -- n )`: push the byte length of a string
- `s@ ( s i -- n )`: push the byte value at index `i` (zero-based)
- `s.= ( s1 s2 -- flag )`: test byte-by-byte equality
- Strings are immutable and heap-allocated; no GC
- Output is composed by sequencing output words, not concatenating strings

---

## Code examples (full list, for reference when writing)

1. `72 emit 105 emit` — sends `Hi` byte by byte
2. `72 emit 105 emit cr` — `Hi` followed by newline
3. `42 . cr` — print a number on its own line
4. `"hello, froth" s.emit cr` — print a string with newline
5. `"hello" s.len .` → `5 `
6. `"abc" 0 s@` → `97`
7. `"hello" "hello" s.=` → `1`
8. `"hello" "world" s.=` → `0`
9. `"count: " s.emit 42 . cr` — labeled numeric output
10. `echo-once` — one-shot key echo word
11. `echo-loop` — key echo loop with `q` exit

---

## Connections to other chapters

- **Chapter 02 (The Stack):** `.` was used throughout to inspect the stack. This chapter explains exactly what `.` does, including the trailing space.
- **Chapter 05 (Quotations and Control Flow):** The echo loop uses `while` with a condition quotation that leaves a flag based on the character read. Readers who are comfortable with `while` will read the echo program without difficulty.
- **Chapter 06 (Error Handling):** Error code -2 is "abort with message" — it carries a string payload. This chapter equips the reader to understand that code when they encounter it.
- **Chapter 08 (Talking to Hardware):** `emit` and `s.emit` will be used in hardware examples to print pin states, sensor readings, and status messages. The vocabulary here is the one used in hardware debugging.

---

## Navigation

[← Previous: Error Handling](06-error-handling.md) | [→ Next: Talking to Hardware](08-talking-to-hardware.md)

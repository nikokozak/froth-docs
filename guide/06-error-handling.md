# Error Handling

_Errors in Froth are recoverable events, not fatal crashes. This chapter shows how `throw` and `catch` work, what the standard error codes mean, and how to use the error model in your own words._

---

## Outline and writing notes

This chapter has a framing job to do before it can teach mechanics. The reader probably comes from a background where errors on embedded systems mean a reset, a blank screen, or a debug session with a JTAG adapter. Froth's error model is genuinely different: an uncaught error at the REPL gives you an error message and a fresh prompt. A caught error in running code gives you an error code and a restored stack. No reset. No lost work. This framing should come first and should be stated plainly.

The two keywords — `throw` and `catch` — are simple to use. The chapter's real work is building an accurate mental model of what `catch` actually saves and restores, so readers aren't surprised when they use it in edge cases.

Tone: this chapter covers defensive programming, which can feel dry. Keep examples grounded in real microcontroller scenarios: timeouts, bad sensor readings, division by a zero-valued sensor output. The embedded context gives the error model a practical justification that abstract examples don't.

---

## Subsections

### 1. Errors happen: the embedded context

**Purpose:** Establish that errors are normal and that Froth's error model is better than the alternatives.

**What to cover:**
- In many embedded environments, an unhandled error means a hardware reset. The microcontroller reboots, the REPL session is lost, and you start over. This is a high price for a typo or a miscalculation.
- In C with assert disabled, the behavior is worse: undefined, silent, potentially destructive to hardware state.
- Froth takes a different position: errors are runtime events that can be signaled (`throw`), caught (`catch`), and recovered from. An uncaught error at the REPL is not catastrophic — it's feedback.
- The three most common error sources in practice:
  - Stack underflow: trying to consume more values than exist on the stack
  - Division by zero: a `/mod` call with zero as the divisor
  - Undefined word: calling a name that hasn't been defined
- Each of these produces a specific error code. The codes can be caught programmatically or surface as messages in the REPL.

**Writer note:** This section is short — less than a page. It's framing, not mechanics. End it with something like: "Let's see what that looks like at the REPL, then we'll get into how to use it in your own words."

---

### 2. How the REPL recovers

**Purpose:** Show the reader what error recovery looks like in practice, building comfort before explaining the mechanism.

**What to cover:**
- When an error is not caught, it propagates to the REPL's top-level error handler. That handler:
  1. Prints the error code and a human-readable description
  2. Restores the data stack to empty (or to the state before the failing line — verify with implementation)
  3. Prints the prompt and waits for input
- Walk through three concrete REPL errors:

**Stack underflow:**
```
froth> +
Error: stack underflow (-3)
froth> _
```
The session continues. Stack is clean.

**Division by zero:**
```
froth> 5 0 /mod
Error: division by zero (-10)
froth> _
```

**Undefined word:**
```
froth> frobble
Error: undefined word: frobble (-13)
froth> _
```

- After each error, the REPL is fully usable. Previous definitions are preserved. The error did not corrupt the dictionary.
- Key point: the error numbers in parentheses are Froth's standard error codes. These are the same values `throw` uses and `catch` captures.

**Writer note:** Confirm the actual error output format and codes before publication — the examples above use plausible codes but they should match the real implementation. The error code for stack underflow, division by zero, and undefined word should each be verified and noted with `(Writer: verify error code N)` placeholders if uncertain.

---

### 3. `throw`: signaling an error

**Purpose:** Teach the low-level primitive for signaling errors.

**What to cover:**
- `throw ( n -- )` takes an error code (a number) and signals an error with that code.
- If there is a matching `catch` in the call stack, control transfers to it. If there is no `catch`, the error propagates to the REPL handler.
- `0 throw` is a no-op: throwing zero is defined as "no error." This makes `throw` safe to call with a computed condition: if the condition produces 0, nothing happens.
- Standard error codes are negative integers (by convention, negative codes are standard; positive codes are application-defined). The most common:

| Code | Meaning |
|------|---------|
| -1 | Abort |
| -3 | Stack underflow |
| -4 | Stack overflow |
| -10 | Division by zero |
| -13 | Undefined word |
| -14 | Interpreting a compile-only word |

(Writer: expand this table to match the actual standard error code list Froth implements. If codes differ from the above, correct them. If there are Froth-specific codes beyond the standard set, add them.)

- Application-defined codes: use positive integers. Choose values that don't conflict with the standard set.
- Example: a word that validates a sensor reading and throws if it's out of range:
  ```froth
  : check-sensor ( n -- n )
    dup 0 < [ 42 throw ] [ drop ] if ;
  ```
  If `n` is negative, throw error code 42 (application-defined). Otherwise, leave `n` on the stack.

**Writer note:** The `0 throw` = no-op convention is subtle but useful. Mention it explicitly. It allows a pattern like: `condition 0 = 42 * throw` — if condition is zero, multiply by 42 to get the error code; if condition is nonzero (true), the product is nonzero and the error is thrown. This is a compact way to write conditional throws. Whether to include this pattern depends on how advanced the audience is at this point in the guide.

---

### 4. `catch`: wrapping a quotation in error protection

**Purpose:** Teach `catch` as the complement to `throw`.

**What to cover:**
- `catch ( q -- ... err )` takes a quotation, runs it, and if it throws, returns the error code as the top value of the stack instead of signaling the error upward.
- If the quotation runs without throwing, `catch` pushes 0 (no error) when it completes.
- Stack effect in detail:
  - Normal case: `[ ...body... ] catch` → body runs, leaves its results, then `catch` pushes 0. Stack: `[...results... 0]`.
  - Error case: body throws error code `n`. `catch` intercepts it, restores the data stack to the state it had at the point `catch` was entered, and pushes `n`. Stack: `[n]`.
- The stack restoration is important: if the body leaves garbage on the stack before throwing, `catch` cleans it up. You always know what the stack looks like after `catch` returns.

**Code example — catching division by zero:**
```froth
[ 1 0 /mod ] catch .
```
Stack trace:
1. `[ 1 0 /mod ]` pushes the quotation. Stack: `[<q>]`
2. `catch` starts. Saves stack state.
3. Inside the quotation: `1` → `[1]`; `0` → `[1 0]`; `/mod` signals error -10 (division by zero).
4. `catch` intercepts. Restores stack to pre-quotation state. Pushes error code. Stack: `[-10]`.
5. `.` prints `-10`.

**No-error case:**
```froth
[ 3 4 + ] catch .
```
1. Quotation runs. `3 4 +` → stack inside quotation: `[7]`.
2. `catch` sees no error. Pushes 0. Stack: `[7 0]`.
3. `.` prints `0` (the error code). Stack: `[7]`. Another `.` prints `7`.

**Writer note:** The no-error case is important because it surprises some readers — the result of the quotation *and* the error code (0) are both on the stack when `catch` returns. The caller must consume the error code. Show this explicitly in the example.

---

### 5. Practical pattern: try something, handle failure

**Purpose:** Show the idiomatic way to use `catch` in real code.

**What to cover:**
- The canonical pattern is: run a quotation under `catch`, check the error code, branch on whether it's zero:
  ```froth
  [ risky-operation ] catch
  dup 0 = [ drop ... handle-success ... ] [ ... handle-error ... ] if
  ```
  If error code is 0: drop it and proceed with success. If non-zero: handle the error.

- More specific error handling: instead of `dup 0 =`, check for specific codes:
  ```froth
  [ risky-operation ] catch
  dup -10 = [ drop ... handle-div-zero ... ] [ ... rethrow-or-default ... ] if
  ```

- Rethrow pattern: if `catch` catches an error you don't know how to handle, rethrow it:
  ```froth
  [ risky-operation ] catch
  dup 0 = [ drop ] [ throw ] if
  ```
  If no error, drop the 0 and continue. If there's an error, `throw` it again (propagating up to an outer `catch` or the REPL handler).

- Nested `catch` blocks: outer `catch` handles broad failures; inner `catch` handles specific operations. Each `catch` only sees errors from its own quotation.

**Code example — a word with input validation:**
```froth
: safe-divide ( a b -- result )
  dup 0 = [ drop drop -10 throw ] when
  /mod drop ;
```
(Note: `when ( flag q -- )` is `[ ] if` — runs the quotation only if the flag is true, does nothing otherwise. Introduce it here if it hasn't appeared yet, or substitute `[ ... ] [ ] if`.)

The word: if `b` is zero, drop both values and throw -10. Otherwise, divide and keep only the quotient (drop the remainder).

**Writer note:** The nested `catch` example is the most advanced material in this chapter. Keep it brief: one example with two levels, not a full discussion of exception-handling strategy. The point is that `catch` composes naturally — each wraps an independent quotation and each operates on its own stack context.

---

### 6. Error codes: the standard set

**Purpose:** Reference section for the error codes the reader will encounter.

**What to cover:**
- Present the full standard error code table. Organized by category:

**Stack errors:**
- `-3` — stack underflow (tried to consume more than was available)
- `-4` — stack overflow (too many values; uncommon on microcontrollers but possible with deep recursion)

**Arithmetic errors:**
- `-10` — division by zero

**Dictionary errors:**
- `-13` — undefined word (called a name with no binding)
- `-14` — compile-only word used in interpretation mode

**Control errors:**
- `-1` — generic abort (used by `abort` and sometimes by the REPL itself)
- `-2` — abort with message (carries an additional string; see chapter 07 on strings)

**Application-defined range:**
- Positive integers are reserved for application use. Use codes starting from `1` for your own errors.
- Document your application's error codes in one place (a `constants` section or a dedicated vocabulary).

**Writer note:** This section should be a table, not running prose. Give the reader something to scan. If the implementation supports more codes than listed here, include them. If codes are implementation-defined, note which ones may vary and where to find the canonical list (reference docs).

---

### 7. When to use `catch`/`throw` in your own code

**Purpose:** Give practical guidance on when error handling adds value vs. when it's overkill.

**What to cover:**
- Use `throw` for:
  - Input validation where the caller has given a bad value and can't proceed
  - Hardware timeouts where an operation should have completed but didn't
  - Invariant violations — states the code should never reach
- Use `catch` for:
  - Operations that might legitimately fail and where the failure has a sensible fallback
  - I/O operations that may time out or return errors
  - Parsing or protocol handling where malformed input is expected sometimes
- Don't use `throw`/`catch` for normal control flow: it's not efficient and not idiomatic. Use `if`, `while`, and `choose` for expected branching.
- On microcontrollers especially: keep error paths lean. A `catch` adds overhead; use it where the quotation genuinely might throw, not defensively around every operation.

**Code example — hardware timeout:**
Describe (not full code) a pattern where a word waits for a peripheral to become ready, with a `times`-based retry limit:
```froth
: wait-ready ( -- )
  100 [ peripheral-ready? ] times
  \ if we get here, peripheral never became ready
  99 throw ;
```
(This is schematic — the actual implementation depends on hardware words not yet introduced. Note that.)

**Code example — input validation word:**
```froth
: positive! ( n -- n )
  dup 0 <= [ 1 throw ] when ;
```
Use `positive!` at the start of any word that requires a positive input. The `!` suffix is a Froth convention for "asserts something about its argument."

**Writer note:** The naming convention `word!` for "asserting words" is worth introducing here as a brief aside — it's idiomatic Froth style and readers will see it in the standard library. Confirm whether this convention is used in Froth specifically (it's common in Forth-family and Lisps), and only include it if it's genuine Froth style.

---

### 8. Exercises

**Purpose:** The reader practices reading error messages, writing `catch` expressions, and building words with validation.

**Exercise 1 — Trigger and identify errors:**
Run each of the following at the REPL. Note the error code and describe what went wrong:
- `1 + +` (stack underflow on second `+`)
- `7 0 /mod` (division by zero)
- `frobnicate` (undefined word)

**Exercise 2 — Catch an error:**
Write an expression using `catch` that attempts `1 0 /mod` and prints either the error code (if an error occurred) or the result (if it succeeded).

**Exercise 3 — Write a validating word:**
Write a word `nonzero! ( n -- n )` that leaves `n` on the stack if it's nonzero, and throws error code 1 otherwise.
- Answer:
  ```froth
  : nonzero! ( n -- n )
    dup 0 = [ 1 throw ] when ;
  ```

**Exercise 4 — Nested catch:**
Write an expression where an outer `catch` wraps a quotation that contains its own inner `catch`. Run a case where:
- The inner `catch` handles a division by zero
- The outer `catch` sees no error (because the inner one handled it)
Trace the stack to confirm.

**Writer note:** Exercise 4 is the stretch exercise — it's fine if readers skip it on first pass. Mark it clearly as "challenge" or "optional." The key exercises are 1 and 3: error identification and writing a validating word. Those are the practical skills the reader needs.

---

## Key concepts introduced in this chapter

- Errors as recoverable runtime events (not resets)
- REPL error recovery: message, stack restore, fresh prompt
- `throw ( n -- )`: signal an error with a numeric code; `0 throw` = no-op
- `catch ( q -- ... err )`: run a quotation; intercept errors; return code (0 = no error)
- Stack restoration on `catch`: data stack is restored to pre-catch state on error
- Standard error codes: -3 (underflow), -10 (div-by-zero), -13 (undefined word), others
- Application-defined error codes: positive integers
- Rethrow pattern: `catch dup 0 = [ drop ] [ throw ] if`
- `word!` convention for asserting words
- When to use `catch`/`throw`: genuine failures, not normal control flow

---

## Code examples (full list, for reference when writing)

1. REPL: `+` on empty stack → error message, then fresh prompt
2. REPL: `7 0 /mod` → division by zero error message
3. REPL: `frobnicate` → undefined word error message
4. `[ 1 0 /mod ] catch .` → prints `-10` (error case, full trace)
5. `[ 3 4 + ] catch .` → prints `0`, then `7` still on stack (no-error case)
6. `check-sensor` — word that throws on out-of-range input
7. `safe-divide` — word that validates before dividing
8. `positive!` / `nonzero!` — asserting words using `throw`
9. Rethrow pattern: catch, check code, rethrow if not handling
10. Nested `catch` example with inner handling hiding error from outer

---

## Connections to other chapters

- **Chapter 02 (The Stack):** Stack underflow was introduced there as a thing that happens, with the reassurance that the session survives. This chapter explains the mechanism behind that reassurance: the REPL's top-level `catch` handler.
- **Chapter 05 (Quotations and Control Flow):** `catch` takes a quotation, exactly like `call`, `if`, and `while`. The reader who is comfortable with quotation-passing will find `catch`'s spelling immediately familiar. Confirm that connection explicitly in the prose.
- **Chapter 07 (Strings and I/O):** Error code -2 ("abort with message") involves a string payload. That's a forward reference here — mention it briefly and point ahead.
- **Chapter 09 (Hardware I/O) — forward reference:** Hardware operations are the most common source of genuine failures: a sensor that doesn't respond, a UART that times out, a bus that NAKs. The `catch`/`throw` model from this chapter will be applied directly there.

---

## Navigation

[← Previous: Quotations and Control Flow](05-quotations-and-control.md) | [→ Next: Strings and I/O](07-strings-and-io.md)

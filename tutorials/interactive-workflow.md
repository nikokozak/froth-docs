# Interactive Workflow

_Not a project tutorial — a workflow tutorial. How to think and work in Froth: REPL-first development, VSCode integration, building incrementally, using snapshots as checkpoints, debugging, and a worked 15-minute development session._

---

## Outline and writing notes

This tutorial is different from the others. There's no hardware to wire up and no specific program to build. The subject is the development process itself — how experienced Froth developers actually work.

Most embedded development has one workflow: write in an editor, compile, flash, run, observe. Froth's workflow is fundamentally different, and the reader who hasn't internalized it is leaving most of the value on the table. They may be using Froth like a Forth compiler — write a complete program, load it, run it — when they could be iterating continuously at the REPL.

This tutorial's job is to make that shift explicit. By the end, the reader should think of the REPL as their primary working environment, the editor as a way to prepare larger blocks of code for the REPL, and snapshots as a safety net that makes experimentation consequence-free.

The 15-minute worked example at the end is the anchor. Everything before it sets up vocabulary and patterns; the example shows them in action in a realistic session.

Tone: experienced peer to the reader. Not "here's how to use the tool." More like: "here's how I actually work, and why this way is better."

No hardware required for most of this tutorial. A connected board helps for the hardware sections, but the core workflow patterns apply just as well on the local POSIX target.

---

## The REPL-first workflow

The central principle of Froth development: **type, test, iterate.**

Not: design, implement, compile, flash, test, debug, redesign.

In most embedded environments, the iteration cycle has friction at every step. You write code on a laptop, compile it (maybe 5 seconds, maybe 30), flash it to the board (5–15 seconds), and then wait for it to do something you can observe. If it's wrong, you start the cycle again. The board is passive. It only does what the last flash told it to.

In Froth, the board is active. It's running a Froth interpreter right now, waiting for your next input. Type a word, it runs immediately. The board responds in real time.

This changes how you work:

- **No mental simulation required before testing.** Not sure what `3 4 /mod` leaves on the stack? Type it and look. The REPL is the oracle.
- **Incremental refinement.** You don't have to get a word right before moving on. Define it, test it, fix it, move on. Each redefinition takes effect immediately everywhere that word is called.
- **The board is your development environment.** Not a test target. Not a deployment target (yet). Your primary working environment.

This sounds obvious written down. In practice, many developers who come to Froth from Arduino or MicroPython keep reaching for "write a complete program, then load it." That habit works, but it misses most of what Froth offers. The REPL-first habit is worth building deliberately.

---

## VSCode integration

The Froth VSCode extension adds two key shortcuts that close the gap between editor and REPL:

### Send selection: Cmd+Enter (Mac) / Ctrl+Enter (Windows/Linux)

Highlight any Froth code in the editor and press Cmd+Enter. The selected text is sent to the connected REPL and evaluated, exactly as if you had typed it. The result appears in the REPL panel.

Use this for:
- Sending a word definition from your file to the REPL to test it
- Re-sending a modified definition after editing
- Sending a block of setup code (GPIO configuration, constants) that you run once at the start of a session

The selection can be any size — a single line, a word definition, or a multi-word block. The extension handles multi-line input correctly.

### Send file: Cmd+Shift+Enter (Mac) / Ctrl+Shift+Enter (Windows/Linux)

Sends the entire current file to the REPL. Every word definition in the file is evaluated in order. Definitions that already exist in the session are replaced.

Use this for:
- Loading a complete program after writing it in the editor
- Resetting the session's word definitions to match the file exactly
- Iterating on a program as a whole after making multiple edits

### The feedback loop

The natural rhythm with VSCode:

1. Edit a word definition in the `.froth` file
2. Cmd+Enter (send selection) to test just that definition
3. If it works, move on; if not, edit and repeat from step 2
4. When the whole program works, Cmd+Shift+Enter (send file) to load everything clean
5. Test end-to-end at the REPL
6. `save` to persist

The REPL panel is always visible alongside the editor. You're bouncing between the two constantly. The editor is for writing; the REPL is for verifying.

---

## Building incrementally

The most important Froth development discipline: **build bottom-up, test at every layer.**

### Small words, compose upward

Don't write a 20-line word. Write 4–5 word definitions of 3–4 lines each, where each one builds on the ones below.

The payoff: each word is testable in isolation. When a bug appears, you know exactly which layer it's in.

Example — you want to read a sensor, calibrate the value, and light an LED if it's above a threshold. Instead of one big word:

```froth
\ Don't do this first
: sensor-alert ( -- )
  34 adc.read 3300 * 4095 /mod nip
  2000 > [ 1 2 gpio.write ] [ 0 2 gpio.write ] if ;
```

Build it this way:

```froth
\ Layer 1: raw reading
: read-sensor ( -- count )
  34 adc.read ;
\ Test: read-sensor .

\ Layer 2: calibration
: counts->mv ( count -- mv )
  3300 * 4095 /mod nip ;
\ Test: 4095 counts->mv .  → should be 3300
\       0 counts->mv .     → should be 0

\ Layer 3: threshold check
: above-threshold? ( mv -- flag )
  2000 > ;
\ Test: 1000 above-threshold? .  → 0
\       3000 above-threshold? .  → 1

\ Layer 4: alert
: set-alert-led ( flag -- )
  LED_BUILTIN gpio.write ;
\ Test: 1 set-alert-led  → LED on
\       0 set-alert-led  → LED off

\ Layer 5: compose
: sensor-alert ( -- )
  read-sensor counts->mv above-threshold? set-alert-led ;
\ Test: sensor-alert   (turn pot to observe LED behavior)
```

Each layer is one word. Each word is tested in isolation before composing. When `sensor-alert` doesn't work as expected, you already know `read-sensor`, `counts->mv`, `above-threshold?`, and `set-alert-led` all work correctly — so you're debugging composition, not implementation.

### Test at each level

The test pattern: call the word with known inputs, check the output against expected values. If the REPL gives you what you expect, move to the next layer. If not, stop and fix before building on top.

Stack inspection with `.s`:

```froth
froth> 4095 counts->mv .s
```

`.s ( -- )` prints the current stack contents without consuming them. If you're not sure what's on the stack after a word, `.s` shows you.

---

## Using snapshots as checkpoints

Snapshots are not just for deployment. Use them as development checkpoints.

### The pattern: save before experimenting

You've been working for an hour. Your dictionary has a set of words that are all correct and tested. You want to try something experimental — maybe a different algorithm, or a refactoring that might break things.

Before you start:

```froth
froth> save
```

Now experiment freely. If it goes wrong — if you redefine a word in a way that breaks its callers, or if you get into a confused stack state you can't recover from — load the checkpoint:

```froth
froth> restore
```

Your session is back to the state at the last `save`. All the experimental changes are gone. You can try again with a cleaner head.

### Save often

`save` is fast. There's no reason to space saves out. Save whenever you've got something working that you don't want to lose:

```froth
froth> : new-word ... ;
froth> \ test it...
froth> save
```

The habit: test a word, and if it works, save immediately. You lose at most the work since the last save if something goes wrong.

### `wipe` for a fresh start

If the session has accumulated cruft — half-formed experiments, words you don't want to keep — `wipe` clears all saved snapshots and starts fresh:

```froth
froth> wipe
```

After `wipe`, the next boot starts with only the stdlib and board library. Your session's words are gone from flash.

**Caution:** `wipe` is permanent. Don't run it if you haven't intentionally decided to discard everything.

---

## Debugging

### `.s` everywhere

`.s` is the first debugging tool. When a word doesn't do what you expect, add `.s` calls to see what the stack looks like at different points:

```froth
froth> : broken-word ( a b -- result )
...     .s     \ print stack on entry
...     +
...     .s     \ print stack after +
...     2 * ;
```

Compare the actual stack contents to what you expected. The discrepancy is where the bug is.

`.s` doesn't change the stack — it's a pure observation.

### `see` to inspect words

If you're not sure what a word does (because you defined it a while ago or because it came from the board library), `see` shows its definition:

```froth
froth> see blink
: blink ( delay -- )
  1 LED_BUILTIN gpio.write dup ms
  0 LED_BUILTIN gpio.write ms ;
```

`see` reconstructs the definition in colon-semicolon syntax. The output is the actual stored body — if you redefined the word, `see` shows the current version.

Useful when:
- You've been at the REPL for a while and forgot exactly what a word does
- You want to check whether a word has been redefined (maybe by accident)
- You're debugging a word that calls other words — `see` each of them to verify they're what you think

### `catch` to contain experiments

When you're trying something risky at the REPL — a word that might throw an error or leave the stack in a bad state — wrap it in `catch` to protect the session:

```froth
froth> [ risky-word ] catch dup 0 = [ drop ] [ . "error" s.emit cr ] if
```

If `risky-word` throws, `catch` intercepts it, restores the stack, and you get the error code. The REPL stays clean. If `risky-word` succeeds, the error code is 0 and you drop it.

The REPL already has a top-level error handler, so an uncaught throw at the REPL doesn't crash anything — it prints an error message and gives you a fresh prompt. But your stack might be in an unexpected state. `catch` is more controlled: you know the stack is clean after `catch` regardless of whether the body succeeded or threw.

### Resetting a confused state

If the stack has junk on it and you want a clean start without power-cycling:

```froth
froth> .s
[3 items: 7 42 -3]
froth> drop drop drop
froth> .s
[]
```

Or, if you've saved recently:

```froth
froth> restore
```

`restore` loads the last snapshot, which includes a clean stack (the stack is not saved in snapshots — after restore, the stack starts empty).

---

## When to use a file vs. the REPL

Not everything belongs at the REPL. Here's the rule of thumb:

### Use the REPL for:

- **Exploration:** you're figuring out a word's behavior, testing a formula, or checking a stack effect
- **Small experiments:** one-off expressions you'll run once
- **Sending lines from an editor:** the selection-send workflow blurs the line — you write in the editor but execute at the REPL
- **Testing individual words:** call a word with known inputs, check the output
- **Interactive hardware control:** `1 LED_BUILTIN gpio.write` is faster at the REPL than in a file

### Use a `.froth` file for:

- **Anything more than 2–3 words:** once your program has structure, it belongs in a file
- **Code you'll modify and resend:** the edit-Cmd+Enter-test loop is much smoother with a file
- **Programs you'll deploy:** write the final version in a file, load with Cmd+Shift+Enter, save to flash
- **Documentation:** comments in a file are permanent; REPL history is not
- **Words you want to keep across sessions:** write them in a file so they're not lost if you need to start fresh

### The hybrid workflow

Most Froth sessions look like this:
1. Start at the REPL with exploration: type expressions directly to understand the domain
2. When a pattern emerges, open a file and start defining words there
3. Develop each word in the file, send with Cmd+Enter to test at the REPL
4. When the program is complete, send the whole file with Cmd+Shift+Enter
5. Test end-to-end at the REPL
6. `save` to persist

The REPL and editor are not separate environments. They're complementary. The REPL is for quick checks; the editor is for structured code. Use both.

---

## A worked example: a 15-minute development session

Here's a realistic session, annotated with what the developer is doing and why.

**Goal:** a word that watches a button and counts presses, printing the count on each press.

**Setup:** ESP32 DevKit, BOOT button on GPIO 0, REPL open, empty `.froth` file open in VSCode.

---

**Minutes 0–2: explore the hardware**

Start at the REPL, no file yet. Understand the button behavior:

```froth
froth> 0 BOOT_BUTTON gpio.mode
froth> BOOT_BUTTON gpio.read .
1
```

Good — button not pressed, reads 1. Press and hold:

```froth
froth> BOOT_BUTTON gpio.read .
0
```

Active-low confirmed. 1 = not pressed, 0 = pressed.

Check the constant:
```froth
froth> BOOT_BUTTON .
0
```

`BOOT_BUTTON` is 0. That's GPIO 0.

---

**Minutes 2–5: define a press-detection word**

Now open the `.froth` file. First word: a word that returns true when the button is pressed:

```froth
: pressed? ( -- flag )
  BOOT_BUTTON gpio.read 0 = ;
```

Send with Cmd+Enter. Test at the REPL:

```froth
froth> pressed? .
0
froth> \ hold button
froth> pressed? .
1
```

`pressed?` returns 1 (true) when pressed. Good. The `0 =` inverts the active-low logic.

---

**Minutes 5–8: build the count loop**

Back to the file. Define the counter logic:

```froth
0 'press-count def

: on-press ( -- )
  press-count 1 + 'press-count def
  "Press " s.emit press-count . cr ;

: wait-for-press ( -- )
  [ pressed? not ] [ 10 ms ] while
  [ pressed? ] [ 10 ms ] while ;
```

`wait-for-press` waits until the button is down, then waits until it's up again — capturing one complete press without debounce noise.

Select all three definitions, Cmd+Enter. Test each:

```froth
froth> press-count .
0
froth> on-press
Press 1
froth> on-press
Press 2
froth> press-count .
2
```

`on-press` and `press-count` work as expected.

```froth
froth> wait-for-press
\ press the button...
froth> \ prompt returns after one complete press
```

`wait-for-press` returns after exactly one press.

---

**Minutes 8–11: compose the main loop**

Add to the file:

```froth
: button-counter ( -- )
  0 BOOT_BUTTON gpio.mode
  0 'press-count def
  [ true ] [ wait-for-press on-press ] while ;
```

Send with Cmd+Enter. Test:

```froth
froth> button-counter
Press 1
Press 2
Press 3
```

Each button press increments the count and prints. Reset the board to stop.

---

**Minutes 11–13: save as checkpoint**

It works. Save before doing anything else:

```froth
froth> save
```

Now consider: what could be better? The printed format could include more context. Let's try a variant. First, check the current version of `on-press`:

```froth
froth> see on-press
: on-press ( -- )
  press-count 1 + 'press-count def
  "Press " s.emit press-count . cr ;
```

Edit `on-press` in the file:

```froth
: on-press ( -- )
  press-count 1 + 'press-count def
  "Button press #" s.emit press-count . cr ;
```

Send the selection (just `on-press`) with Cmd+Enter. Test immediately:

```froth
froth> on-press
Button press #3
```

The new version is live. `press-count` is still at 3 from the last session (it was saved). `button-counter` already uses the new `on-press` — coherent redefinition, no restart needed.

---

**Minutes 13–15: finalize and save**

Run the full program one more time to confirm everything works:

```froth
froth> button-counter
Button press #1
Button press #2
Button press #3
```

(Press reset to stop.)

Final save:

```froth
froth> save
```

If you want it to start at boot:

Add to the file:
```froth
: autorun ( -- )
  button-counter ;
```

Send with Cmd+Enter. Save:

```froth
froth> save
```

Power-cycle. The program starts immediately and counts button presses from the first press.

---

**What happened in 15 minutes:**

- Explored hardware behavior at the REPL before writing any code
- Built the program bottom-up: `pressed?` → `on-press` → `wait-for-press` → `button-counter`
- Tested every layer before composing
- Saved as a checkpoint before experimenting
- Modified one word in the file, sent just that word, tested immediately — no full reload required
- Coherent redefinition meant `button-counter` got the updated `on-press` automatically
- Final save persisted everything

Total keystrokes to the board: maybe 30 lines of REPL input. Total time waiting for compilation or flashing: zero.

---

## Summary

The Froth workflow is:

1. **REPL first.** Explore before you code.
2. **One word at a time.** Define, test, move up.
3. **Save often.** Checkpoints are free.
4. **Use the editor for structure, the REPL for verification.** Cmd+Enter bridges them.
5. **`see` and `.s` are your debuggers.** Use them constantly.
6. **`catch` contains experiments.** Protect the session during risky tests.

The word count in this tutorial is high. The required hardware is minimal. But the habits here are what make Froth feel like a superpower rather than just a different flavor of embedded programming. Build them early.

---

## Navigation

[← Read a sensor](read-a-sensor.md) | [Guide: What is Froth?](../guide/00-what-is-froth.md)

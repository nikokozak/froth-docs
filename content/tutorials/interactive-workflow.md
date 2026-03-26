---
title: "Interactive Workflow"
weight: 7
---

_Not a project tutorial. A workflow tutorial. How to think and work in Froth: REPL-first development, VSCode integration, building incrementally, snapshots as checkpoints, debugging, and a worked 15-minute development session._

Most embedded development follows one workflow: write in an editor, compile, flash, run, observe. Froth's workflow is fundamentally different. The board is running an interpreter right now, waiting for your next input. Type a word, it runs immediately. The board responds in real time.

The reader who hasn't internalized this is leaving most of the value on the table, using Froth like a Forth compiler (write a complete program, load it, run it) instead of iterating continuously at the REPL. This tutorial makes the shift explicit.

## The REPL-first workflow

The central principle: **type, test, iterate.**

In most embedded environments, every iteration cycle has friction. You write code on a laptop, compile it (maybe 5 seconds, maybe 30), flash it to the board (5-15 seconds), then wait for something observable. If it's wrong, the cycle starts again. The board is passive. It only does what the last flash told it to.

In Froth, the board is active. Type a word, it runs. The board responds.

This changes three things about how you work:

**You don't need to simulate before testing.** Not sure what `3 4 /mod` leaves on the stack? Type it and look. The REPL is the oracle.

**Refinement is incremental.** Define a word, test it, fix it, move on. Each redefinition takes effect immediately everywhere that word is called.

**The board is your development environment.** Not a test target. Not a deployment target (yet). Your primary workspace.

## VSCode integration

The Froth VSCode extension adds two shortcuts that close the gap between editor and REPL:

### Send selection: Cmd+Enter (Mac) / Ctrl+Enter (Windows/Linux)

Highlight any Froth code in the editor and press Cmd+Enter. The selected text is sent to the connected REPL and evaluated, exactly as if you had typed it. The result appears in the REPL panel.

Use this for:

- Sending a word definition from your file to the REPL to test it
- Re-sending a modified definition after editing
- Sending a block of setup code (GPIO configuration, constants) at the start of a session

The selection can be any size: a single line, a word definition, or a multi-word block.

### Send file: Cmd+Shift+Enter (Mac) / Ctrl+Shift+Enter (Windows/Linux)

Sends the entire current file to the REPL. Every word definition in the file is evaluated in order. Definitions that already exist in the session are replaced.

Use this for:

- Loading a complete program after writing it in the editor
- Resetting the session's word definitions to match the file exactly
- Iterating on a program as a whole after multiple edits

### The feedback loop

The natural rhythm:

1. Edit a word definition in the `.froth` file
2. Cmd+Enter to test just that definition
3. If it works, move on; if not, edit and repeat from step 2
4. When the whole program works, Cmd+Shift+Enter to load everything clean
5. Test end-to-end at the REPL
6. `save` to persist

The REPL panel is always visible alongside the editor. You bounce between the two constantly. The editor is for writing; the REPL is for verifying.

## Building incrementally

The most important discipline: **build bottom-up, test at every layer.**

Don't write a 20-line word. Write 4-5 word definitions of 3-4 lines each, where each one builds on the ones below. The payoff: each word is testable in isolation. When a bug appears, you know exactly which layer it's in.

You want to read a sensor, calibrate the value, and light an LED if it's above a threshold. You could write one big word:

```froth
\ Everything in one place
: sensor-alert ( -- )
  34 adc.read 3300 * 4095 /mod nip
  2000 > [ 2 1 gpio.write ] [ 2 0 gpio.write ] if ;
```

Build it this way instead:

```froth
\ Layer 1: raw reading
: read-sensor ( -- count )
  34 adc.read ;
\ Test: read-sensor .

\ Layer 2: calibration
: counts->mv ( count -- mv )
  3300 * 4095 /mod nip ;
\ Test: 4095 counts->mv .  → should print 3300
\       0 counts->mv .     → should print 0

\ Layer 3: threshold check
: above-threshold? ( mv -- flag )
  2000 > ;
\ Test: 1000 above-threshold? .  → 0
\       3000 above-threshold? .  → 1

\ Layer 4: alert
: set-alert-led ( flag -- )
  LED_BUILTIN swap gpio.write ;
\ Test: 1 set-alert-led  → LED on
\       0 set-alert-led  → LED off

\ Layer 5: compose
: sensor-alert ( -- )
  read-sensor counts->mv above-threshold? set-alert-led ;
\ Test: sensor-alert   (turn pot to observe LED behavior)
```

Each layer is one word. Each word is tested before composing. When `sensor-alert` doesn't work as expected, you already know `read-sensor`, `counts->mv`, `above-threshold?`, and `set-alert-led` all work correctly. You're debugging composition, not implementation.

### Stack inspection with `.s`

```froth
froth> 4095 counts->mv .s
```

`.s ( -- )` prints the current stack contents without consuming them. If you're not sure what's on the stack after a word runs, `.s` shows you.

## Using snapshots as checkpoints

Snapshots are not just for deployment. Use them as development checkpoints.

### Save before experimenting

You've been working for an hour. Your dictionary has a set of words that are correct and tested. You want to try something experimental that might break things.

Before you start:

```froth
froth> save
```

Experiment freely. If it goes wrong, load the checkpoint:

```froth
froth> restore
```

Your session is back to the state at the last `save`. The experimental changes are gone.

### Save often

`save` is fast. Save whenever you've got something working:

```froth
froth> : new-word ... ;
froth> \ test it...
froth> save
```

You lose at most the work since the last save.

### `wipe` for a fresh start

If the session has accumulated cruft (half-formed experiments, words you don't want to keep), `wipe` clears all saved snapshots:

```froth
froth> wipe
```

After `wipe`, the next boot starts with only the stdlib and board library. Your words are gone from flash.

**Caution:** `wipe` is permanent. Don't run it unless you've decided to discard everything.

## Debugging

### `.s` everywhere

When a word doesn't do what you expect, add `.s` calls to see what the stack looks like at different points:

```froth
froth> : broken-word ( a b -- result )
...     .s     \ print stack on entry
...     +
...     .s     \ print stack after +
...     2 * ;
```

Compare the actual stack contents to what you expected. The discrepancy is where the bug is.

`.s` doesn't change the stack. It's a pure observation tool.

### `see` to inspect words

If you're not sure what a word does (because you defined it a while ago or because it came from the board library), `see` shows its definition:

```froth
froth> see blink
: blink ( delay -- )
  LED_BUILTIN 1 gpio.write dup ms
  LED_BUILTIN 0 gpio.write ms ;
```

`see` reconstructs the definition from the stored body. If you've redefined the word, `see` shows the current version.

Useful when:

- You've been at the REPL for a while and forgot what a word does
- You want to check whether a word has been redefined by accident
- You're debugging a word that calls other words and need to verify each one

### `catch` to contain experiments

When you're trying something risky, wrap it in `catch` to protect the session:

```froth
froth> [ risky-word ] catch dup 0 = [ drop ] [ . "error" s.emit cr ] if
```

If `risky-word` throws, `catch` intercepts it, restores the stack, and gives you the error code. The REPL stays clean.

The REPL already has a top-level error handler, so an uncaught throw prints a message and gives you a fresh prompt. But your stack might be in an unexpected state afterward. `catch` is more controlled: the stack is clean regardless of whether the body succeeded or threw.

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

`restore` loads the last snapshot. The stack starts empty after restore.

## When to use a file vs. the REPL

### Use the REPL for:

- **Exploration:** figuring out a word's behavior, testing a formula, checking a stack effect
- **Quick experiments:** one-off expressions you'll run once
- **Testing individual words:** call a word with known inputs, check the output
- **Interactive hardware control:** `LED_BUILTIN 1 gpio.write` is faster at the REPL than in a file

### Use a `.froth` file for:

- **Anything more than 2-3 words:** once your program has structure, it belongs in a file
- **Code you'll modify and resend:** the edit-Cmd+Enter-test loop is much smoother with a file
- **Programs you'll deploy:** write the final version in a file, load with Cmd+Shift+Enter, save to flash
- **Documentation:** comments in a file are permanent; REPL history is not

### The hybrid workflow

Most Froth sessions follow this pattern:

1. Start at the REPL with exploration: type expressions directly to understand the domain
2. When a pattern emerges, open a file and start defining words there
3. Develop each word in the file, send with Cmd+Enter to test at the REPL
4. When the program is complete, send the whole file with Cmd+Shift+Enter
5. Test end-to-end at the REPL
6. `save` to persist

The REPL and editor are not separate environments. They're complementary. The REPL is for quick checks; the editor is for structured code.

## A worked example: 15 minutes to a button counter

A realistic session, annotated with what the developer is doing and why.

**Goal:** a word that watches a button and counts presses, printing the count on each press.

**Setup:** ESP32 DevKit, BOOT button on GPIO 0, REPL open, empty `.froth` file open in VSCode.

### Minutes 0-2: explore the hardware

Start at the REPL, no file yet. Understand the button behavior:

```froth
froth> BOOT_BUTTON 0 gpio.mode
froth> BOOT_BUTTON gpio.read .
1
```

Button not pressed, reads 1. Press and hold:

```froth
froth> BOOT_BUTTON gpio.read .
0
```

Active-low confirmed. `1` = released, `0` = pressed.

### Minutes 2-5: define a press-detection word

Open the `.froth` file. First word:

```froth
: pressed? ( -- flag )
  BOOT_BUTTON gpio.read 0 = ;
```

Send with Cmd+Enter. Test:

```froth
froth> pressed? .
0
froth> \ hold button
froth> pressed? .
1
```

Returns `1` (true) when pressed. The `0 =` inverts the active-low logic.

### Minutes 5-8: build the count logic

Back to the file:

```froth
0 'press-count def

: on-press ( -- )
  press-count 1 + 'press-count def
  "Press " s.emit press-count . cr ;

: wait-for-press ( -- )
  [ pressed? not ] [ 10 ms ] while
  [ pressed? ] [ 10 ms ] while ;
```

`wait-for-press` waits until the button goes down, then waits until it comes back up. One complete press-and-release cycle.

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

### Minutes 8-11: compose the main loop

Add to the file:

```froth
: button-counter ( -- )
  BOOT_BUTTON 0 gpio.mode
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

### Minutes 11-13: checkpoint and refine

It works. Save:

```froth
froth> save
```

The printed format could include more context. Check the current version:

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

Send just this selection with Cmd+Enter. Test immediately:

```froth
froth> on-press
Button press #3
```

The new version is live. `press-count` is still at 3 from before. `button-counter` already uses the new `on-press` because of coherent redefinition. No restart needed.

### Minutes 13-15: finalize and save

Run the full program once more:

```froth
froth> button-counter
Button press #1
Button press #2
Button press #3
```

Final save:

```froth
froth> save
```

To start at boot, add to the file:

```froth
: autorun ( -- )
  button-counter ;
```

Send with Cmd+Enter. Save. Power-cycle. The program starts immediately and counts presses from the first one.

### What happened in 15 minutes

- Explored hardware behavior at the REPL before writing any code
- Built bottom-up: `pressed?` then `on-press` then `wait-for-press` then `button-counter`
- Tested every layer before composing
- Saved as a checkpoint before experimenting
- Modified one word in the file, sent just that word, tested immediately
- Coherent redefinition meant `button-counter` got the updated `on-press` automatically
- Total time waiting for compilation or flashing: zero

## Summary

1. **REPL first.** Explore before you code.
2. **One word at a time.** Define, test, move up.
3. **Save often.** Checkpoints are free.
4. **Use the editor for structure, the REPL for verification.** Cmd+Enter bridges them.
5. **`.s` and `see` are your debuggers.** Use them constantly.
6. **`catch` contains experiments.** Protect the session during risky tests.

The habits here are what make Froth feel different from other embedded workflows. Build them early.

---

[← Build a Calculator](build-a-calculator.md) | [Guide: What is Froth? →](../guide/01-what-is-froth.md)

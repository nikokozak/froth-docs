---
title: "Snapshots and Persistence"
weight: 10
---

You have spent the last few chapters building words, toggling pins, reading buttons. All of that lives in RAM. Unplug the USB cable and it vanishes. Every definition, every timing constant you tuned by hand, every word you tested and refined. Gone.

This is normal for microcontrollers. RAM is volatile. But Froth gives you a way to write your session to flash memory, where it survives power loss. The mechanism is called a snapshot.

## What a snapshot captures

A snapshot writes two things to flash: the heap and the slot table.

The heap holds everything you have allocated during your session: word definitions (their quotation bodies), string literals, variables, and any other values created since boot. If you defined a word called `blink`, its definition lives on the heap and will be captured.

The slot table holds your word bindings. Each name you have defined is associated with a slot, and each slot points to the current definition of that word. The snapshot preserves these bindings so that after restore, `blink` still means what you defined it to mean.

A snapshot does *not* capture:

- **The data stack.** After restore, the stack is empty.
- **The return stack.** Also empty.
- **Hardware register state.** If your program configured a GPIO pin as output, that configuration lives in the peripheral hardware, not in Froth's heap. After a power cycle, hardware must be re-initialized.
- **In-progress computations.** If you were mid-expression when you called `save`, only the heap and slot table at that moment are captured. The computation is not resumable.

The short version: a snapshot saves your code, not your runtime state. Use it to persist definitions and structure, not to checkpoint a running program.

## `save`, `restore`, and `snapshot-wipe`

```froth
save
```

`save` writes the current heap and slot table to non-volatile storage. On the ESP32, Froth uses NVS with dual-slot rotation: two snapshot slots, alternating writes, each protected by a CRC32 checksum. If power is lost mid-write, the previous snapshot remains intact. You will not corrupt the device into an unbootable state.

```froth
restore
```

`restore` loads the most recently saved snapshot, replacing the current session's heap and slot table. This happens automatically at boot. You can also call it manually to discard any changes made since the last `save` and return to the saved state.

```froth
snapshot-wipe
```

`snapshot-wipe` erases both NVS snapshot slots. After a wipe, the next boot starts with a blank session. The standard library and board library still load; only your saved definitions are gone. Use this to start fresh or to recover from a snapshot that causes problems at boot.

## The boot sequence

When the board powers on, Froth follows a fixed sequence:

1. The kernel initializes. Stack, heap, and slot table start empty.
2. The standard library loads (`core.froth`). Words like `if`, `while`, `dip`, `catch`, and `throw` become available.
3. The board library loads (`lib/board.froth`). Pin constants and hardware words (`LED_BUILTIN`, `BOOT_BUTTON`, `gpio.mode`, etc.) become available.
4. Safe boot check. For 750 milliseconds, Froth watches for a Ctrl-C over serial or a press of the BOOT button. If either is detected, it skips steps 5 and 6.
5. Snapshot restore. If a saved snapshot exists, the heap and slot table are loaded. Your definitions come back.
6. `autorun`. If a word named `autorun` is defined, it is called.
7. The REPL starts.

Step 6 is the key detail: `autorun` runs *before* the REPL prompt appears. A device with a saved `autorun` word boots into your program without a computer attached.

## `autorun`: making a standalone device

Define a word named `autorun`, save a snapshot, and the device will run that word every time it powers on.

```froth
: blink ( delay -- )
  LED_BUILTIN 1 gpio.write dup ms
  LED_BUILTIN 0 gpio.write ms ;

: autorun ( -- )
  LED_BUILTIN 1 gpio.mode
  [ true ] [ 500 blink ] while ;

save
```

Unplug the board. Plug it back in. The LED starts blinking immediately, with no serial connection needed.

Because `autorun` runs before the REPL, programs that should run indefinitely need an infinite loop. If `autorun` returns, the REPL starts normally. For a standalone device, `[ true ] [ ... ] while` keeps the program running.

To change the device's behavior later, connect to the REPL, redefine `autorun`, and `save` again. To remove it entirely, define a no-op version and save:

```froth
: autorun ( -- ) ;
save
```

Or use `snapshot-wipe` to clear all saved state.

Here is a slightly more involved example. This `autorun` mirrors the BOOT button state to the LED, running the device as a simple button-controlled light:

```froth
: autorun ( -- )
  LED_BUILTIN 1 gpio.mode
  BOOT_BUTTON 0 gpio.mode
  [ true ] [
    BOOT_BUTTON gpio.read not
    LED_BUILTIN swap gpio.write
    10 ms
  ] while ;

save
```

## Safe boot: the escape hatch

An `autorun` with a bug can make the device appear dead. If the word throws an error or enters an infinite loop before the REPL starts, you cannot type anything to fix it.

The recovery path is safe boot. Hold the BOOT button (or send Ctrl-C over serial) within 750 milliseconds of power-on. Froth skips the snapshot restore and the `autorun` hook entirely. The board boots into a clean session with only the standard library and board library loaded.

From the safe-boot session, you can fix the problem:

```froth
\ Option 1: redefine autorun and save
: autorun ( -- )
  "device is up" s.emit cr ;
save

\ Option 2: wipe everything and start fresh
snapshot-wipe
```

Safe boot does not erase the saved snapshot. It only skips loading it. If you boot normally again without saving or wiping, Froth will try to load the old snapshot. Fix the problem or wipe before you power-cycle.

## Heap management with `mark` and `release`

During long REPL sessions, you may define temporary words that you do not want to keep. Froth provides a pair of words for deterministic memory reclamation.

```froth
mark
\ m is now on the stack

: scratch ( -- ) "temporary" s.emit cr ;
: experiment ( -- ) 42 . ;

\ Done experimenting. Release everything allocated since the mark.
release
\ scratch and experiment are gone; heap is back to where it was
```

`mark` pushes a heap watermark onto the stack. `release` takes that watermark and frees everything allocated after it. Any words you defined between `mark` and `release` are gone, along with any strings or values they allocated.

This is useful when you are exploring at the REPL and want to clean up without wiping your entire session. Define a `mark` before you start experimenting, and `release` when you are done.

## A complete workflow

Here is the full develop-save-verify cycle, from scratch to standalone device:

```froth
\ 1. Define and test your words
: blink ( delay -- )
  LED_BUILTIN 1 gpio.write dup ms
  LED_BUILTIN 0 gpio.write ms ;

LED_BUILTIN 1 gpio.mode
500 blink
\ LED blinks once. Good.

\ 2. Define autorun
: autorun ( -- )
  LED_BUILTIN 1 gpio.mode
  [ true ] [ 500 blink ] while ;

\ 3. Save to flash
save

\ 4. Unplug the board. Plug it back in.
\    The LED blinks immediately at boot.

\ 5. Reconnect to the REPL and verify.
info
\ Your definitions are still present.
```

Save periodically during long sessions. A power interruption costs you everything since the last `save`.

When iterating on `autorun`, test it manually first by calling `autorun` at the REPL. If the behavior looks right, `save` and power-cycle to confirm the boot behavior.

## Non-persistable values

Not everything on the heap can be written to flash. Native addresses (C pointers) and certain transient strings cannot be serialized. If your session contains non-persistable values, `save` will fail and report which values caused the problem.

In practice, this is rare. Word definitions, numbers, strings you created at the REPL, and quotations are all persistable. The restriction mainly affects low-level interop with C libraries. If you hit it, the error message will tell you what to remove before saving.

## Exercises

**Save and verify.** Define a word at the REPL: `: hello ( -- ) "hello from flash" s.emit cr ;`. Run `save`. Power-cycle the board. Reconnect and type `hello`. Did it survive?

**Simple autorun.** Define `autorun` to print a startup message: `: autorun ( -- ) "Froth is running" s.emit cr ;`. Save and power-cycle. Confirm the message appears before the REPL prompt.

**Autorun with hardware.** Define `autorun` to blink the LED three times at boot, then print a ready message and return (so the REPL starts normally after the blinks).

**Safe boot recovery.** Define an `autorun` that deliberately throws an error: `: autorun ( -- ) 99 throw ;`. Save and power-cycle. Use safe boot to recover. Redefine `autorun` to something harmless and save.

**Wipe and restart.** Call `snapshot-wipe`, then power-cycle. Confirm that the previous `autorun` no longer runs and the session starts clean.

**Mark and release.** Run `mark`, define two or three temporary words, test them, then `release`. Verify the words are no longer defined.

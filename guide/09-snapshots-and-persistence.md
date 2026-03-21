# Snapshots and Persistence

_You've built a working program in your REPL session. This chapter shows how to save it to flash, restore it at boot, and make your device run standalone — no computer required._

---

## Outline and writing notes

This chapter solves a real problem that every embedded developer hits. The reader has spent time at the REPL building and refining words. They unplug the board, or the power goes out, and everything is gone. Snapshots are the answer.

The mechanism is worth explaining clearly because it's not magic — it's a specific set of things that get written to flash, and a specific set of things that don't. Getting that wrong leads to bugs that are confusing to diagnose. The writer should take time with the "what a snapshot captures" section.

The `autorun` hook is the payoff moment of this chapter. Once a reader understands `autorun`, their device goes from "a thing I talk to over serial" to "a standalone embedded device." That transition deserves celebration. Write toward it.

**Important:** Snapshot availability depends on board configuration. The `FROTH_HAS_SNAPSHOTS` build option must be enabled for the board. On the standard ESP32 DevKit build, snapshots are enabled by default. On custom builds or RP2040 targets, verify before relying on this chapter's examples.

Tone: patient and precise in the "what gets saved" section; encouraging and concrete in the `autorun` and workflow sections. This chapter is where the reader's work pays off.

---

## Subsections

### 1. The problem: your session disappears

**Purpose:** Frame the problem that snapshots solve. Make it concrete.

**What to cover:**
- You've spent 30 minutes at the REPL: defined words, tuned timing, wired up a sensor. Everything works. You unplug the USB cable.
- Plug it back in. The board boots into a blank Froth session. Your definitions are gone. You start over.
- This is the default behavior of every microcontroller. RAM is volatile; it loses contents when power is removed. Froth's dictionary lives in RAM (during a normal session). So do your word definitions.
- Without persistence, the REPL is a scratchpad. With it, it's a development environment and a deployment target.
- Snapshots fix this. A snapshot writes your current session state to flash. Flash is non-volatile: it survives power loss. At boot, Froth restores the snapshot and your definitions are back.

**Writer note:** This section should feel like the writer remembers the exact moment they first lost a long REPL session. Keep it grounded. One short concrete example is better than a general description.

---

### 2. What a snapshot captures

**Purpose:** Give the reader an accurate model of exactly what is and is not saved.

**What to cover:**

**What is saved:**
- **The heap:** everything allocated in the heap region — word definitions (their quotation bodies), string literals, and other heap-allocated values. If you defined `blink` during your session, its definition is on the heap and will be captured.
- **The slot table:** the word bindings. Each word name is associated with a slot; each slot holds a reference to the word's current definition. The snapshot saves the current state of all named bindings.
- **The generation counter:** Froth tracks a generation counter for coherent redefinition. The snapshot includes this so that post-restore redefinition continues to work correctly.

**What is not saved:**
- **The data stack:** the stack is transient. It is not part of a snapshot. After restore, the data stack starts empty.
- **The return stack:** similarly transient.
- **Any state that your words hold in global variables or I/O registers:** if your program uses a hardware peripheral and stores state about it in a word-defined variable, that variable's value lives on the heap (so the variable itself is saved), but the hardware register state is not. After a power cycle, hardware must be re-initialized.
- **In-progress computations:** if you were mid-computation when you ran `save`, only the heap and slot table at that moment are captured. The computation itself is not resumable.

**Practical implication:** snapshot saves your code, not your runtime state. Use it to persist definitions and structure, not to checkpoint an ongoing computation.

**Writer note:** The "what is not saved" list is as important as the "what is saved" list. Readers who misunderstand this will write `autorun` words that assume state that isn't there. Be explicit and use the concrete terms "data stack," "return stack," and "hardware peripheral state."

---

### 3. `save`, `restore`, and `wipe`

**Purpose:** Introduce the three snapshot management words.

**What to cover:**

**`save ( -- )`** — writes the current heap and slot table to flash. On the ESP32, Froth uses NVS (Non-Volatile Storage) with A/B rotation: two snapshot slots, alternating writes. If a write is interrupted (e.g., by a power loss mid-write), the previous snapshot remains intact. You won't corrupt the device into an unbootable state.

```froth
save
```
No arguments, no return values. Prints a confirmation message (verify what the REPL prints on success).

**`restore ( -- )`** — loads the most recently saved snapshot, replacing the current session's heap and slot table. This is what happens automatically at boot. You can also call it manually to reload from flash, discarding any changes made since the last `save`.

```froth
restore
```

Calling `restore` manually discards any definitions made after the last `save`. This is useful if you made changes you want to undo — `restore` returns you to the saved state.

**`wipe ( -- )`** — clears all saved snapshots. After `wipe`, the next boot starts with a blank session (stdlib and board library are still loaded; only your saved session data is gone). Use this to start fresh or to recover from a snapshot that causes problems at boot.

```froth
wipe
```

**Writer note:** Clarify whether `restore` is disruptive to the running session in a way the reader should know about (e.g., does it reset the REPL? does it leave the stack in a defined state?). Also verify whether `save` prints output or is silent.

---

### 4. Snapshot availability and board configuration

**Purpose:** Proactively address the dependency on `FROTH_HAS_SNAPSHOTS`.

**What to cover:**
- Snapshots require the board firmware to be built with `FROTH_HAS_SNAPSHOTS` enabled. This is a compile-time option in the board's build configuration.
- On the standard ESP32 DevKit build distributed with the Froth toolchain, `FROTH_HAS_SNAPSHOTS` is enabled. If you're using the standard installation from chapter 01, snapshots are available.
- On RP2040 targets, snapshot support depends on the specific build. Check your board's documentation or the Froth CLI board listing to confirm.
- On custom builds: if `FROTH_HAS_SNAPSHOTS` is not set, `save`, `restore`, and `wipe` are undefined words. Calling them will produce an "undefined word" error.
- To check at the REPL: type `save` and press enter. If the board is configured with snapshot support, it will attempt to save (or report nothing to save). If not, you'll see an "undefined word" error.

**Writer note:** Keep this section brief. It's a prerequisite caveat, not the main story. One paragraph is sufficient. Link to the build configuration docs if available.

---

### 5. Boot sequence

**Purpose:** Give the reader a clear picture of what happens from power-on to REPL prompt.

**What to cover:**
- The Froth boot sequence on a configured board follows a fixed order. Understanding it helps readers reason about where their definitions are available and when `autorun` runs.

The sequence:
1. **Kernel initializes** — the core Froth runtime starts. The stack, heap, and slot table are cleared.
2. **Stdlib loads** — `core.froth` (and any other stdlib components) are loaded. Standard words like `if`, `while`, `dip`, `catch`, `throw` become available.
3. **Board library loads** — `lib/board.froth` for the connected board is loaded. Pin constants and hardware words (`LED_BUILTIN`, `BOOT_BUTTON`, `gpio.mode`, `ledc.setup`, etc.) become available.
4. **Snapshot restores** — if a snapshot is available and snapshots are enabled, the saved heap and slot table are loaded. Your defined words come back.
5. **`autorun` hook** — if a word named `autorun` is defined (from the restored snapshot or from the board library), it is called. This is where standalone programs start.
6. **REPL starts** — the REPL prompt appears. If you're connected over serial, you'll see the `froth>` prompt.

**Writer note:** Step 5 is the key insight: `autorun` runs before the REPL starts. This means a device can boot into your program without a computer ever connecting to it. The REPL is still there — it starts after `autorun` completes (or runs concurrently if the implementation supports that — verify).

---

### 6. `autorun`: making a standalone device

**Purpose:** Teach `autorun` as the mechanism for deployed devices.

**What to cover:**
- Define a word named `autorun` and it will be called every time the device boots, immediately after the snapshot is restored (step 5 above).
- `autorun` runs before the REPL prompt appears. On a device with no computer attached, this means your program starts without any human intervention.
- Example: a standalone LED blinker.

```froth
: autorun ( -- )
  LED_BUILTIN 1 gpio.mode
  [ 500 blink ] [ ] while ;
```

Save it:
```froth
save
```

Unplug. Replug. The LED starts blinking immediately at boot, without any serial connection needed.

- `autorun` should generally not return. If it returns, the REPL starts normally. For programs that need to run forever, use an infinite loop (`[ true ] [ ... ] while`).
- `autorun` can be redefined: if you want to change the device's behavior, connect to the REPL, redefine `autorun`, and `save` again.
- To remove `autorun`: define it as a no-op (`: autorun ;`) and `save`, or use `wipe` to clear all state.

**Code example — autorun with sensor loop:**
```froth
: autorun ( -- )
  LED_BUILTIN 1 gpio.mode
  BOOT_BUTTON 0 gpio.mode
  [ true ] [
    BOOT_BUTTON gpio.read not
    LED_BUILTIN swap gpio.write
    10 ms
  ] while ;
```
On boot: runs the button-controlled LED program from chapter 08 indefinitely.

**Writer note:** Warn the reader that an `autorun` with a bug (e.g., a word that doesn't exist, causing an error at startup) can make the device appear dead. The safe boot mechanism (section 7) is the escape hatch. Lead into it naturally.

---

### 7. Safe boot: the escape hatch

**Purpose:** Explain how to recover from a problematic autorun or snapshot.

**What to cover:**
- If `autorun` crashes or hangs, the device looks like it isn't working. The REPL never starts. This is the most common "help, my device is stuck" scenario.
- Safe boot: hold the BOOT button during the first 750ms after power-on. When Froth detects this, it skips the snapshot restore and the `autorun` hook. The device boots into a clean session with only the stdlib and board library.
- From the clean safe-boot session, you can:
  - Inspect the saved snapshot manually (if tooling supports it)
  - Redefine `autorun` to fix it and `save` again
  - Call `wipe` to clear the snapshot entirely and start from scratch
- The 750ms window is generous but requires acting immediately after plugging in.
- Safe boot does not erase the snapshot. The snapshot is still there; it was just not loaded. If you don't `save` or `wipe` in the safe-boot session, the next regular boot will try to load it again.

**Code example — recovery sequence:**
1. Hold BOOT button and plug in USB.
2. Wait for REPL prompt (releases can happen after the prompt appears).
3. At the prompt, redefine `autorun`:
   ```froth
   : autorun ( -- )
     "device is up" s.emit cr ;
   save
   ```
4. Power cycle. `autorun` runs and prints its message. REPL starts normally.

**Writer note:** The 750ms figure should be verified against the actual implementation. If it differs, correct it. If the safe boot is triggered by a different mechanism on RP2040 (e.g., a different pin), note that.

---

### 8. Practical workflow: develop, save, verify

**Purpose:** Give the reader a repeatable workflow for building persistent Froth programs.

**What to cover:**
- The recommended develop-test loop:
  1. Connect to REPL.
  2. Write and test words interactively. Iterate until they work.
  3. Run `save` to write the session to flash.
  4. Power cycle the board.
  5. Reconnect to REPL and verify your definitions are still present.
  6. If `autorun` should run automatically, verify the boot behavior before disconnecting.
- `save` early and often. If you're doing a long session, `save` periodically — power can always be interrupted.
- Iterating on `autorun`: redefine the word, test it manually (call `autorun` at the REPL), then `save` and power cycle to confirm the boot behavior.

**Concrete example workflow:**
```
Step 1:
froth> : blink ( delay -- ) LED_BUILTIN 1 gpio.write dup ms LED_BUILTIN 0 gpio.write ms ;
froth> 500 blink  \ test it — LED blinks once

Step 2:
froth> : autorun ( -- ) LED_BUILTIN 1 gpio.mode [ 500 blink ] [ ] while ;
froth> autorun  \ test it — LED starts blinking; reset the board to exit
               \ (or Ctrl+C if the REPL supports interrupts)

Step 3:
froth> save

Step 4: unplug, replug — LED blinks immediately at boot, no computer needed.

Step 5:
froth> blink  \ still defined; verify
```

**Writer note:** The workflow section is the practical payoff. Write it in the second person and keep it action-oriented. Readers who follow this sequence will have a working standalone device by the end of the chapter.

---

### 9. Exercises

**Purpose:** The reader saves their first persistent program and practices the full workflow.

**Exercise 1 — Save and verify:**
Define any word at the REPL (e.g., `: hello "hello from flash" s.emit cr ;`). Run `save`. Power cycle the board. Reconnect and call the word. Did it survive?

**Exercise 2 — Simple autorun:**
Define `autorun` as a word that sends a startup message: `"Froth is running" s.emit cr`. Save and power cycle. Confirm the message appears at boot.

**Exercise 3 — autorun with hardware:**
Build on exercise 2: define `autorun` to blink the LED three times at boot, then print a ready message.

**Exercise 4 — Safe boot recovery:**
Deliberately define `autorun` to throw an error (e.g., `: autorun 99 throw ;`) and `save`. Power cycle. Is the REPL accessible? If not, use safe boot to recover and redefine `autorun` to something harmless.

**Exercise 5 — wipe and restart:**
Call `wipe`, then power cycle. Confirm that the previous `autorun` no longer runs and that the session starts clean.

---

## Key concepts introduced in this chapter

- Snapshots: persist the heap (definitions, strings, quotations) and slot table (word bindings) to flash
- What is not saved: data stack, return stack, hardware peripheral state
- `save ( -- )`: write current session state to flash; ESP32 uses NVS with A/B rotation
- `restore ( -- )`: reload the most recent snapshot; automatic at boot
- `wipe ( -- )`: clear all saved snapshots
- Boot sequence: kernel → stdlib → board library → snapshot restore → `autorun` → REPL
- `autorun`: define this word and it runs at every boot, before the REPL starts; the mechanism for standalone devices
- Safe boot: hold BOOT button during first 750ms to skip snapshot restore and autorun
- `FROTH_HAS_SNAPSHOTS`: build-time option that must be enabled for snapshot support

---

## Code examples (full list, for reference when writing)

1. `save` — save current session
2. `restore` — reload saved session
3. `wipe` — clear all snapshots
4. Simple `autorun` that blinks LED indefinitely
5. `autorun` + `save` + power cycle + verify workflow
6. `autorun` with button-controlled LED from chapter 08
7. Safe boot recovery sequence
8. Full develop-test-save-verify workflow transcript

---

## Connections to other chapters

- **Chapter 08 (Talking to Hardware):** The programs built in chapter 08 — blinking, button reading, PWM — are exactly what readers will want to save and deploy. `autorun` transforms those programs from REPL experiments into standalone devices.
- **Chapter 03 (Words and Definitions):** The slot table that snapshots preserve is the same slot table introduced in chapter 03. Readers with a clear model of "name → slot → definition" will understand what the snapshot captures without needing extra explanation.
- **Chapter 06 (Error Handling):** If `autorun` throws an uncaught error, the REPL's top-level error handler fires — which on hardware means the REPL may not start at all. Safe boot is the recovery path. The connection to chapter 06's error model is worth a sentence.

---

## Navigation

[← Previous: Talking to Hardware](08-talking-to-hardware.md) | [→ Next: Where to Go Next](10-where-to-go-next.md)

# Blink an LED

_The hardware hello world. You'll configure a GPIO pin, toggle it, add timing, and end up with a configurable LED blinker you can save to flash and run at boot — no computer required._

---

## Outline and writing notes

This is the classic embedded first project. Every embedded tutorial in every language starts here, and with good reason: blinking an LED is the simplest possible proof that your code is reaching the hardware. The reader who gets through this tutorial has a working feedback loop between their keyboard and a physical device. That's worth celebrating.

Write this tutorial as a guided session. The reader should be at their board with a USB cable, typing along. Every step should work. Don't save up for a big reveal — get something happening on the hardware as fast as possible (step 3, the first `gpio.write` at the REPL), then build from there.

Tone: energetic but patient. The embedded developer anxiety is real — "will my board brick?" No, it won't. Say so.

Reference board: ESP32 DevKit v1 (38-pin). All pin references are specific. If the reader has a different board, they'll need to adapt the pin numbers.

---

## Prerequisites

Before starting this tutorial:

- Chapters 00–03 of the guide (the stack, word definitions)
- Chapter 08 basics (GPIO words: `gpio.mode`, `gpio.write`, `gpio.read`; timing: `ms`, `us`)
- Hardware: ESP32 DevKit v1 (or a compatible ESP32 board with a built-in LED)
- VSCode with the Froth extension installed and connected
- Verification: the REPL is active and `1 1 + .` prints `2`

If the REPL isn't responding, troubleshoot the connection before continuing. Everything in this tutorial requires a live connection to the board.

---

## What we're building

A configurable LED blinker.

By the end of this tutorial you'll have:

1. A `blink` word that flashes the LED once with a configurable delay
2. A `blink-n` word that blinks a specified number of times
3. A pattern blinker for SOS or other sequences
4. An `autorun` that starts blinking the moment the board powers up

Along the way you'll learn how to configure GPIO pins, drive them high and low, use millisecond timing, and compose all of it into a word that can be tweaked and reused.

---

## Pin reference (ESP32 DevKit v1)

| Name | GPIO | Notes |
|------|------|-------|
| `LED_BUILTIN` | 2 | Built-in blue LED. High = on (active-high). |
| `BOOT_BUTTON` | 0 | Boot/flash button. Low = pressed (active-low). |

These constants are defined in the board library and are available as soon as Froth starts. Use `LED_BUILTIN` and `BOOT_BUTTON` in code rather than the raw numbers — if you ever run on a different board, only the board library needs updating.

---

## Step-by-step

### Step 1 — Connect and verify

Plug in your ESP32. In VSCode, the Froth extension should detect the board and open the REPL automatically. You'll see the `froth>` prompt.

Verify the connection:
```froth
froth> 1 1 + .
2
```

If you don't see `2`, the REPL isn't working. Check the connection before continuing.

---

### Step 2 — Configure the LED pin

GPIO pins must be configured before use. Set GPIO 2 (`LED_BUILTIN`) as an output:

```froth
froth> LED_BUILTIN 1 gpio.mode
```

`gpio.mode ( pin mode -- )` — mode `1` means output, mode `0` means input. Stack effect: consumes both values, leaves nothing. If the REPL returns to the prompt without an error, the pin is configured.

You only need to do this once per session. (After a power cycle, the board needs reconfiguring — more on that when we get to `autorun`.)

---

### Step 3 — Toggle the LED manually

Drive the pin high:
```froth
froth> LED_BUILTIN 1 gpio.write
```

The LED should light up. Drive it low:
```froth
froth> LED_BUILTIN 0 gpio.write
```

The LED should go off.

`gpio.write ( pin level -- )` — `level` is `1` for high (3.3V), `0` for low (GND). This is the fundamental LED control: high = on, low = off for active-high LEDs.

If the LED doesn't light up:
- Confirm `gpio.mode` ran successfully (step 2)
- Some ESP32 boards have the LED on a different pin — check your board's documentation
- A few boards use active-low LEDs (low = on). Try `LED_BUILTIN 0 gpio.write` and see if that lights it

---

### Step 4 — Add timing

Toggle with a delay:

```froth
froth> LED_BUILTIN 1 gpio.write  500 ms  LED_BUILTIN 0 gpio.write  500 ms
```

This does: LED on, wait 500ms, LED off, wait 500ms. You should see a single blink.

`ms ( n -- )` — blocks for `n` milliseconds. `500 ms` is half a second. The CPU waits; no other Froth words execute during the wait.

Run the line a few times. Each time, the LED blinks once. Now we'll wrap this in a word so we don't have to retype it.

---

### Step 5 — Define `blink`

```froth
froth> : blink ( delay -- )
...     LED_BUILTIN 1 gpio.write  dup ms
...     LED_BUILTIN 0 gpio.write  ms ;
```

The word takes one argument — the delay in milliseconds — and uses it for both the on-phase and the off-phase.

`dup ms` duplicates the delay value so it's available for both halves. Without `dup`, the first `ms` would consume the value and the second call would try to pop from an empty stack.

Test it:
```froth
froth> LED_BUILTIN 1 gpio.mode
froth> 500 blink
froth> 100 blink
froth> 50 blink
```

Each call blinks once at the specified rate. Notice that the faster you make it (lower number), the shorter the blink. At 50ms it'll be a brief flash. At 1000ms it's a slow pulse.

---

### Step 6 — Define `blink-n`

Blink a specified number of times:

```froth
froth> : blink-n ( count delay -- )
...     swap [ over blink ] times drop ;
```

Walk through `5 500 blink-n`:
- Stack on entry: `[5 500]`
- `swap` → `[500 5]`
- `[ over blink ] times` — runs the quotation 5 times. Each iteration:
  - `over` copies the delay (500) from below: `[500 5 500]`... wait, at this point the count has been consumed by `times`. Let me re-examine.

When `times` runs, it holds `n` (the count) and calls the quotation repeatedly. Inside the quotation, the stack still has `[delay]` on it from before `times` was called. So:

- `swap` → `[500 5]` (delay=500 on bottom, count=5 on top)
- `[ over blink ] times`:
  - `times` consumes the count (5), runs the quotation 5 times
  - Each iteration the stack has `[500]` — delay is sitting there
  - `over` would need something below to copy. Actually with `[500]` on stack, `over` would fail (stack underflow).

Let's use a cleaner version:

```froth
froth> : blink-n ( count delay -- )
...     [ blink ] times ;
```

Wait — `blink` expects delay on the stack. `times` expects count and quotation. So:

```froth
froth> : blink-n ( count delay -- )
...     swap                   \ [delay count]
...     [ dup blink ] times    \ blink count times, each time passing delay
...     drop ;                 \ discard the leftover delay
```

Actually `times ( n q -- )` consumes the count and calls the quotation n times. During each call, the stack has whatever was there before `times` minus the count (which `times` consumed). So with `[delay count]` before `times`, after `times` consumes `count`, the quotation sees `[delay]` on the stack.

Inside `[ dup blink ]`: `dup` duplicates delay → `[delay delay]`, `blink` consumes one delay → `[delay]`. The delay persists for all iterations. After all iterations, `drop` discards the delay.

```froth
froth> : blink-n ( count delay -- )
...     swap
...     [ dup blink ] times
...     drop ;
froth> 5 500 blink-n
```

Watch the LED blink exactly 5 times.

---

### Step 7 — Make timing configurable with a named constant

Instead of typing a literal delay every time, define a named value:

```froth
froth> 500 'blink-delay def
froth> blink-delay blink
froth> blink-delay blink
```

Now you can change the delay in one place:
```froth
froth> 100 'blink-delay def
froth> blink-delay blink
```

Faster. `def` binds any value to a name. When you type `blink-delay`, Froth looks up the slot and pushes whatever's there — in this case the number 100.

---

### Step 8 — Loop forever

For a continuously blinking LED, use `while` with an always-true condition:

```froth
froth> : blink-loop ( delay -- )
...     [ true ] [ dup blink ] while
...     drop ;
froth> 500 blink-loop
```

The `[ true ]` condition never becomes false, so the loop runs until you interrupt it. On hardware with a serial connection, press the reset button on the board or power-cycle to stop it. (Ctrl+C behavior depends on your terminal and Froth version — check whether it interrupts a running word or not.)

**Note:** `blink-loop` does not return. Design it for deployment, not interactive use. In the next section we'll turn it into an `autorun`.

---

## Saving your work

### Snapshot and `autorun`

Once `blink` and `blink-loop` work the way you want, save the session to flash:

```froth
froth> save
```

This writes the current heap and slot table to the board's non-volatile storage. Your word definitions survive a power cycle.

To make the LED start blinking automatically at boot, define `autorun`:

```froth
froth> : autorun ( -- )
...     LED_BUILTIN 1 gpio.mode
...     [ true ] [ 500 blink ] while ;
froth> save
```

Now unplug and replug the USB cable. The LED starts blinking immediately — no computer needed.

**Snapshot availability note:** Snapshots require the board firmware to be built with `FROTH_HAS_SNAPSHOTS` enabled. On the standard ESP32 DevKit build, this is enabled by default. To verify: type `save` at the REPL. If you see a confirmation (or silence with no error), snapshots are working. If you see `undefined word: save`, your build doesn't include snapshot support — check the build configuration docs.

**Recovery:** If your `autorun` has a bug that prevents the REPL from starting, hold the BOOT button during the first 750ms after power-on. Froth detects this and skips the snapshot restore and `autorun`, booting into a clean session. From there you can redefine `autorun`, save, and power-cycle.

---

## Extension: multiple LEDs, patterns, speed control

### Multiple LEDs

If you have additional LEDs wired to other pins (say GPIO 4 and GPIO 5), define separate blink words:

```froth
froth> : blink-pin ( delay pin -- )
...     over 1 gpio.write  over ms
...     over 0 gpio.write  swap ms
...     drop ;
froth> 2 1 gpio.mode
froth> 4 1 gpio.mode
froth> 500 2 blink-pin
froth> 500 4 blink-pin
```

**Note:** `blink-pin ( delay pin -- )` — stack layout inside the word requires care. This version needs to be traced and verified at the REPL. The pattern: duplicate pin and delay as needed using `dup` and `over`, keeping track of which is which.

### SOS pattern

Use `blink-n` to send an SOS (three short, three long, three short):

```froth
froth> : sos ( -- )
...     3 100 blink-n   \ three short
...     300 ms
...     3 500 blink-n   \ three long
...     300 ms
...     3 100 blink-n   \ three short
...     1000 ms ;
froth> [ true ] [ sos ] while
```

### Speed control via the BOOT button

A button-controlled speed toggle: pressing the BOOT button switches between slow (500ms) and fast (100ms) blink:

```froth
froth> 500 'current-delay def

froth> : toggle-speed ( -- )
...     current-delay 100 = [ 500 ] [ 100 ] if
...     'current-delay def ;

froth> : button-blink ( -- )
...     BOOT_BUTTON 0 gpio.mode
...     LED_BUILTIN 1 gpio.mode
...     [ true ] [
...       BOOT_BUTTON gpio.read 0 = [ toggle-speed ] when
...       current-delay blink
...     ] while ;
```

When the BOOT button is pressed (GPIO 0 reads `0`), `toggle-speed` runs and switches the delay value. The next `blink` call uses the new delay.

---

## What you learned

- **`gpio.mode ( pin mode -- )`** configures a pin as input (0) or output (1). Must be called before using the pin.
- **`gpio.write ( pin level -- )`** drives a pin high (1) or low (0). `LED_BUILTIN 1 gpio.write` turns on the built-in LED.
- **`gpio.read ( pin -- level )`** reads a pin's current level — useful for buttons.
- **`ms ( n -- )`** blocks for n milliseconds. Combine with gpio words for timing.
- **`dup`** in a blink word: when you need the same value in two places, `dup` it before the first use.
- **`times` for counted repetition:** `5 [ 500 blink ] times` blinks 5 times cleanly.
- **`autorun` for standalone deployment:** define `autorun`, call `save`, power-cycle. The board runs your program at boot.
- **Safe boot as safety net:** hold BOOT during power-on to skip `autorun` and get a clean REPL if something goes wrong.

---

## Navigation

[← Build a calculator](build-a-calculator.md) | [→ Read a sensor](read-a-sensor.md)

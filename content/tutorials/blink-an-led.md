---
title: "Blink an LED"
weight: 1
---

_The hardware hello world. You'll configure a GPIO pin, toggle it, add timing, and end up with a configurable LED blinker you can save to flash and run at boot — no computer required._

Blinking an LED is the simplest proof that your code is reaching the hardware. By the end of this tutorial, you'll have a working feedback loop between your keyboard and a physical device, and a vocabulary of words you can reuse and extend.

## Prerequisites

- Chapters 00–03 of the guide (the stack, word definitions)
- Chapter 08 basics (GPIO words: `gpio.mode`, `gpio.write`, `gpio.read`; timing: `ms`)
- Hardware: ESP32 DevKit v1 (or a compatible ESP32 board with a built-in LED)
- VSCode with the Froth extension installed and connected
- Verification: the REPL is active and `123 .` prints `123`

If the REPL isn't responding, troubleshoot the connection before continuing. Everything in this tutorial requires a live connection to the board.

## What you are building

A configurable LED blinker. By the end you'll have:

1. A `blink` word that flashes the LED once with a configurable delay
2. A `blink-n` word that blinks a specified number of times
3. A pattern blinker for SOS or other sequences
4. An `autorun` that starts blinking the moment the board powers up

## Pin reference (ESP32 DevKit v1)

| Name | GPIO | Notes |
|------|------|-------|
| `LED_BUILTIN` | 2 | Built-in blue LED. High = on (active-high). |
| `BOOT_BUTTON` | 0 | Boot/flash button. Low = pressed (active-low). |

These constants are defined in the board library and available as soon as Froth starts. Use `LED_BUILTIN` and `BOOT_BUTTON` in code rather than the raw numbers.

## Step 1 — Connect and verify

Plug in your ESP32. In VSCode, the Froth extension should detect the board and open the REPL automatically. You'll see the `froth>` prompt.

Verify the connection:

```froth
froth> 123 .
123
```

If you don't see `123`, the REPL isn't working. Check the connection before continuing.

## Step 2 — Configure the LED pin

GPIO pins must be configured before use. Set GPIO 2 (`LED_BUILTIN`) as an output:

```froth
froth> LED_BUILTIN 1 gpio.mode
```

`gpio.mode ( pin mode -- )` sets the direction. Mode `1` means output, mode `0` means input. Both values are consumed; nothing is left on the stack. If the REPL returns to the prompt without an error, the pin is configured.

You only need to do this once per session. After a power cycle the board needs reconfiguring, which is why we'll eventually put it in `autorun`.

## Step 3 — Toggle the LED manually

Drive the pin high:

```froth
froth> LED_BUILTIN 1 gpio.write
```

The LED should light up. Drive it low:

```froth
froth> LED_BUILTIN 0 gpio.write
```

The LED should go off.

`gpio.write ( pin level -- )` drives a pin high (`1`, 3.3V) or low (`0`, GND). High = on, low = off for active-high LEDs.

If the LED doesn't light up:

- Confirm `gpio.mode` ran successfully (step 2)
- Some ESP32 boards have the LED on a different pin; check your board's documentation
- A few boards use active-low LEDs (low = on) — try `LED_BUILTIN 0 gpio.write` and see if that lights it

## Step 4 — Add timing

First, do it the long way so each step is visible:

```froth
froth> LED_BUILTIN 1 gpio.write
froth> 500 ms
froth> LED_BUILTIN 0 gpio.write
froth> 500 ms
```

LED on, wait 500ms, LED off, wait 500ms. You should see a single blink.

Once that sequence feels obvious, you can type the same thing on one line:

```froth
froth> LED_BUILTIN 1 gpio.write  500 ms  LED_BUILTIN 0 gpio.write  500 ms
```

`ms ( n -- )` blocks for `n` milliseconds. The CPU waits; no other Froth words execute during the delay.

Run the line a few times. Each time, the LED blinks once. Time to wrap this in a word so you don't have to retype it.

## Step 5 — Define `blink`

```froth
froth> : blink ( delay -- )
...     LED_BUILTIN 1 gpio.write  dup ms
...     LED_BUILTIN 0 gpio.write  ms ;
```

The word takes one argument, the delay in milliseconds, and uses it for both the on-phase and the off-phase. `dup ms` duplicates the delay so one copy can be consumed by the first `ms` and the other can survive for the second `ms`.

If you trace `500 blink`, the stack goes like this:

1. Start with `[500]`
2. `LED_BUILTIN 1 gpio.write` turns the LED on and leaves `[500]`
3. `dup` makes `[500, 500]`
4. `ms` consumes the top delay, leaving `[500]`
5. `LED_BUILTIN 0 gpio.write` turns the LED off and still leaves `[500]`
6. Final `ms` consumes the remaining delay, leaving `[]`

Test it:

```froth
froth> LED_BUILTIN 1 gpio.mode
froth> 500 blink
froth> 100 blink
froth> 50 blink
```

Each call blinks once at the specified rate. At 50ms it's a brief flash. At 1000ms it's a slow pulse.

## Step 6 — Define `blink-n`

Blink a specified number of times:

```froth
froth> : blink-n ( count delay -- )
...     swap                   \ [delay count]
...     [ dup blink ] times    \ blink count times, each time dup-ing delay
...     drop ;                 \ discard the leftover delay
```

`times ( n q -- )` consumes the count and calls the quotation `n` times. After `swap`, the stack holds `[delay count]`. `times` consumes `count` and runs the quotation repeatedly. Each iteration sees `[delay]` on the stack, `dup`s it for `blink`, and the original delay stays put for the next iteration. The final `drop` discards the delay when all iterations are done.

```froth
froth> 2 300 blink-n
froth> 5 500 blink-n
```

Start with `2 300 blink-n` so you can check the behavior quickly, then try a longer run like `5 500 blink-n`.

## Step 7 — Make timing configurable with a named value

Instead of typing a literal delay every time, define a named value:

```froth
froth> 500 'blink-delay def
froth> blink-delay blink
froth> blink-delay blink
```

Change the delay in one place:

```froth
froth> 100 'blink-delay def
froth> blink-delay blink
```

Faster. `def` binds any value to a name. When you type `blink-delay`, Froth pushes whatever value is stored in that slot.

## Step 8 — Loop forever

For a continuously blinking LED, use `while` with an always-true condition:

```froth
froth> : blink-loop ( delay -- )
...     [ true ] [ dup blink ] while
...     drop ;
froth> 500 blink-loop
```

The `[ true ]` condition never becomes false, so the loop runs until you interrupt it. Press the reset button on the board or power-cycle to stop it.

`blink-loop` does not return. It's meant for deployment, not interactive use. In the next section we'll turn it into an `autorun`.

## Saving your work

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

Unplug and replug the USB cable. The LED starts blinking immediately, no computer needed.

**Recovery:** If your `autorun` has a bug that prevents the REPL from starting, hold the BOOT button during the first 750ms after power-on. Froth detects this and skips the snapshot restore and `autorun`, booting into a clean session. From there you can redefine `autorun`, save, and power-cycle again.

## Extensions

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

Pressing the BOOT button switches between slow (500ms) and fast (100ms) blink:

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

When the BOOT button is pressed (GPIO 0 reads `0`), `toggle-speed` swaps the delay value. The next `blink` call uses the new delay.

## What you learned

- **`gpio.mode ( pin mode -- )`** configures a pin as input (0) or output (1). Must be called before using the pin.
- **`gpio.write ( pin level -- )`** drives a pin high (1) or low (0). `LED_BUILTIN 1 gpio.write` turns on the built-in LED.
- **`ms ( n -- )`** blocks for n milliseconds. Combine with GPIO words for timing.
- **`dup`** before consuming: when you need the same value in two places, `dup` it before the first use.
- **`times` for counted repetition:** `5 [ 500 blink ] times` blinks 5 times.
- **`autorun` for standalone deployment:** define `autorun`, call `save`, power-cycle. The board runs your program at boot.
- **Safe boot:** hold BOOT during power-on to skip `autorun` and get a clean REPL.

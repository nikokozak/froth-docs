---
title: "Read a Button"
weight: 2
---

_Wire a pushbutton, read its state at the REPL, and make your board react to the physical world for the first time._

The previous tutorial drove an output. This one reads an input. A pushbutton is the simplest input device: it's either pressed or it isn't. By the end, the board responds to you rather than the other way around.

## Prerequisites

- Chapters 00–03 of the guide (the stack, word definitions)
- The [Blink an LED](blink-an-led.md) tutorial (introduces `gpio.mode`, `gpio.write`, `ms`)
- Hardware: ESP32 DevKit v1 (the BOOT button is built in; an external pushbutton and jumper wires for the second half)
- VSCode with the Froth extension connected

## What you are building

A button-reactive program. By the end you'll have:

1. Read the BOOT button's state at the REPL
2. A polling loop that watches a button and prints when it's pressed
3. A `button-led` word that lights the LED while the button is held
4. A toggle: press once to turn the LED on, press again to turn it off
5. Debouncing to handle the electrical noise that makes a single press look like many

## Hardware setup

### The BOOT button (no wiring needed)

The ESP32 DevKit v1 has a button labeled "BOOT" wired to GPIO 0. It's active-low: reads `1` when released, `0` when pressed. We'll start with this. No breadboard, no jumper wires, nothing to get wrong.

### External button (optional, for the second half)

Wire a momentary pushbutton between GPIO 15 and GND. The ESP32's internal pull-up resistor holds the pin high when the button isn't pressed, so no external resistor is needed.

- One leg of the button to GPIO 15
- Other leg to GND

Pressing the button connects the pin to GND, pulling it to `0`.

## Step 1 — Read the BOOT button once

At the REPL:

```froth
froth> BOOT_BUTTON 0 gpio.mode
froth> BOOT_BUTTON gpio.read .
1
```

The button isn't pressed, so `gpio.read` returns `1`. Hold the BOOT button and run it again:

```froth
froth> BOOT_BUTTON gpio.read .
0
```

`0`. The button is pressed. That's digital input: `1` or `0`, nothing in between.

`gpio.read ( pin -- level )` reads the current logic level of a pin. Returns `1` (high) or `0` (low).

## Step 2 — Poll in a loop

Watch the button state continuously:

```froth
froth> [ true ] [ BOOT_BUTTON gpio.read . cr 200 ms ] while
```

A stream of `1`s scrolls past. Press and hold the BOOT button and the `1`s become `0`s. Release and they go back to `1`s.

This is a polling loop: check, print, wait, repeat. The 200ms delay controls how often we check. Faster polling catches shorter presses but floods the REPL with output.

## Step 3 — React only on press

Printing every state is noisy. Print only when the button is actually pressed:

```froth
froth> : watch-button ( -- )
...     [ true ] [
...       BOOT_BUTTON gpio.read 0 =
...       [ "pressed" s.emit cr ] when
...       50 ms
...     ] while ;
froth> watch-button
```

The REPL is silent until you press the button. Each press prints `pressed`.

`when ( flag quot -- )` runs the quotation only if the flag is true. There's no else branch.

You'll notice that holding the button prints `pressed` repeatedly (roughly every 50ms). That's expected. We'll fix it in the debouncing section.

## Step 4 — Button controls the LED

Light the LED while the button is held:

```froth
froth> : button-led ( -- )
...     BOOT_BUTTON 0 gpio.mode
...     LED_BUILTIN 1 gpio.mode
...     [ true ] [
...       BOOT_BUTTON gpio.read 0 =
...       [ LED_BUILTIN 1 gpio.write ]
...       [ LED_BUILTIN 0 gpio.write ]
...       if
...       20 ms
...     ] while ;
froth> button-led
```

Hold the BOOT button and the LED comes on. Release and it goes off. Input drives output.

`if ( flag trueQ falseQ -- )` runs the first quotation when the flag is true, the second when false. Each polling cycle reads the button, picks the right branch, and sets the LED accordingly.

## Step 5 — Toggle mode

Press once, LED stays on. Press again, LED stays off. This requires tracking state:

```froth
froth> 0 'led-state def

froth> : flip-led ( -- )
...     led-state 0 =
...     [ 1 ] [ 0 ] if
...     dup 'led-state def
...     LED_BUILTIN swap gpio.write ;

froth> : toggle-button ( -- )
...     BOOT_BUTTON 0 gpio.mode
...     LED_BUILTIN 1 gpio.mode
...     [ true ] [
...       BOOT_BUTTON gpio.read 0 =
...       [ flip-led ] when
...       200 ms
...     ] while ;
froth> toggle-button
```

`def` makes `led-state` a mutable slot. `flip-led` reads the current state, inverts it, stores the new value back, and writes it to the LED pin.

There's a problem: if you hold the button, `flip-led` fires every 200ms, toggling rapidly. The LED flickers instead of staying on. We need debouncing.

## Step 6 — Debouncing

Debouncing means: react to the button press once, then ignore it until the button is released and pressed again. The technique is called edge detection. Instead of reacting to the steady state (pressed or not), we detect the transition from released to pressed.

```froth
froth> 1 'prev-state def

froth> : button-fell? ( -- flag )
...     BOOT_BUTTON gpio.read
...     dup prev-state swap
...     'prev-state def
...     0 = swap 1 = and ;
```

`button-fell?` returns true only on the *falling edge*: the moment the pin goes from `1` (released) to `0` (pressed). It compares the current reading to the previous one. If the current reading is `0` and the previous was `1`, we have a fresh press.

Wire it into the toggle:

```froth
froth> : toggle-debounced ( -- )
...     BOOT_BUTTON 0 gpio.mode
...     LED_BUILTIN 1 gpio.mode
...     1 'prev-state def
...     0 'led-state def
...     [ true ] [
...       button-fell? [ flip-led ] when
...       20 ms
...     ] while ;
froth> toggle-debounced
```

Each press toggles exactly once. Hold the button as long as you want. One toggle. Release and press again for another.

## Extension: external button

Wire a pushbutton between GPIO 15 and GND, then enable the internal pull-up:

```froth
froth> 15 0 gpio.mode
froth> 15 gpio.read .
1
```

The internal pull-up holds the pin high when the button is open. Pressing it pulls the pin to `0`, the same active-low behavior as the BOOT button.

Replace `BOOT_BUTTON` with `15` in any of the words above and they'll work with the external button.

## What you learned

- **`gpio.read ( pin -- level )`** reads a pin's digital state. Returns `1` (high) or `0` (low).
- **Active-low buttons:** the BOOT button (and most pushbuttons with pull-ups) read `0` when pressed, `1` when released. Check with `0 =` to test for "pressed."
- **Polling loops:** `[ true ] [ ... ms ] while` checks a condition at a fixed interval.
- **`when` for conditional execution:** `flag [ action ] when` runs the action only if the flag is true.
- **State with `def`:** `'led-state def` creates a mutable named slot. Read it by name, update it by pushing a new value and calling `def` again.
- **Edge detection / debouncing:** compare the current reading to the previous reading to detect transitions. React on the falling edge, not on the steady state.

---

[← Blink an LED](blink-an-led.md) | [Next: Read a Sensor →](read-a-sensor.md)

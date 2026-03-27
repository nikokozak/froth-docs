---
title: "Fade an LED"
weight: 4
---

_Go from binary on/off to smooth brightness control. You'll learn PWM, write a fade loop, and connect a potentiometer to control brightness by hand._

So far your LED has had two states: on and off. PWM (pulse width modulation) gives you 256 levels in between. The pin toggles on and off thousands of times per second, and the ratio of on-time to off-time controls perceived brightness. You don't need to manage the toggling yourself. `pwm.write` takes a pin and a duty cycle value, and the hardware does the rest.

## Prerequisites

- Chapters 00–04 of the guide (the stack, word definitions, named values)
- The [Blink an LED](blink-an-led.md) tutorial (introduces `gpio.mode`, `gpio.write`, `ms`)
- Hardware: ESP32 DevKit v1 (built-in LED on GPIO 2 supports PWM)
- Optional: a potentiometer wired to GPIO 34 (same setup as the [Read a Sensor](read-a-sensor.md) tutorial)

## What you are building

A breathing LED with optional knob control. By the end you'll have:

1. Set an LED to an arbitrary brightness from the REPL
2. A smooth fade-up and fade-down loop (the "breathing" effect)
3. A configurable `breathe` word with adjustable speed and range
4. (Extension) A potentiometer that controls LED brightness in real time

## Step 1 — PWM basics at the REPL

Configure the LED pin and set a brightness:

```froth
froth> LED_BUILTIN 1 gpio.mode
froth> LED_BUILTIN 128 pwm.write
```

The LED should be at roughly half brightness. Try some values:

```froth
froth> LED_BUILTIN 0 pwm.write      \ off
froth> LED_BUILTIN 64 pwm.write     \ dim
froth> LED_BUILTIN 128 pwm.write    \ medium
froth> LED_BUILTIN 255 pwm.write    \ full brightness
```

`pwm.write ( pin duty -- )` sets the PWM duty cycle on a pin. `duty` ranges from 0 (always off) to 255 (always on). Values in between produce proportional brightness.

Where `gpio.write` gives you only 0 or 1, `pwm.write` gives you 256 levels of control.

## Step 2 — Define a brightness word

```froth
froth> : set-brightness ( level -- )
...     LED_BUILTIN swap pwm.write ;

froth> 50 set-brightness
froth> 200 set-brightness
```

Type a number, see the LED change. Try values interactively until you find the brightness you want.

## Step 3 — Fade up

Sweep from 0 to 255:

```froth
froth> : fade-up ( step-ms -- )
...     0                           \ start at 0
...     [ dup 255 <= ] [            \ while level <= 255
...       dup set-brightness        \ set brightness to current level
...       1 +                       \ increment level
...       over ms                   \ wait step-ms
...     ] while
...     drop drop ;

froth> 5 fade-up
```

The LED smoothly brightens from off to full over about 1.3 seconds (256 steps at 5ms each).

`step-ms` controls the speed: `2 fade-up` is fast, `20 fade-up` is slow and dramatic.

The stack throughout the loop holds `[step-ms level]`. Each iteration `dup`s the level for `set-brightness`, increments it with `1 +`, then `over`s the step delay for `ms`. When the level exceeds 255, the condition fails and the two remaining values are dropped.

## Step 4 — Fade down

```froth
froth> : fade-down ( step-ms -- )
...     255                         \ start at 255
...     [ dup 0 >= ] [
...       dup set-brightness
...       1 -
...       over ms
...     ] while
...     drop drop ;

froth> 5 fade-down
```

Same structure, counting downward. The LED dims from full to off.

## Step 5 — Breathe

Combine fade-up and fade-down into a continuous loop:

```froth
froth> : breathe ( step-ms -- )
...     [ true ] [
...       dup fade-up
...       dup fade-down
...     ] while
...     drop ;

froth> 4 breathe
```

The LED pulses smoothly: up, down, up, down. Adjust the step delay for different moods. `2` is urgent, `8` is calm.

Redefine on the fly to add a pause at full brightness and at off:

```froth
froth> : breathe ( step-ms -- )
...     [ true ] [
...       dup fade-up
...       500 ms
...       dup fade-down
...       500 ms
...     ] while
...     drop ;
froth> 4 breathe
```

No recompile, no reflash. Redefine and call.

## Extension: potentiometer-controlled brightness

Wire a potentiometer to GPIO 34 (same setup as the [Read a Sensor](read-a-sensor.md) tutorial). Map the ADC reading (0-4095) to the PWM range (0-255):

```froth
froth> 34 'pot-pin def

froth> : read-pot ( -- duty )
...     pot-pin adc.read 16 / ;    \ 4095/16 = 255

froth> : knob-brightness ( -- )
...     LED_BUILTIN 1 gpio.mode
...     [ true ] [
...       read-pot set-brightness
...       20 ms
...     ] while ;

froth> knob-brightness
```

Turn the potentiometer. The LED tracks your hand in real time. Analog input driving analog output.

`16 /` is a rough scaling from 12-bit (0-4095) to 8-bit (0-255). For exact math, `255 * 4095 /` would be precise but risks integer overflow on large ADC values. Division by 16 is close enough and safe.

## What you learned

- **`pwm.write ( pin duty -- )`** sets PWM duty cycle. 0 = off, 255 = full on. This is analog output on a digital microcontroller.
- **PWM = perceived brightness:** the pin toggles rapidly; your eye averages it. Higher duty cycle means more on-time, which means brighter.
- **Counted loops with `while`:** `fade-up` and `fade-down` use a counter on the stack and a comparison as the loop condition.
- **Live parameter tuning:** change the step delay or redefine `breathe` at the REPL to adjust behavior without any build step.
- **Input-to-output mapping:** scaling an ADC reading to a PWM range connects the physical world (a knob) to a visible output (LED brightness).

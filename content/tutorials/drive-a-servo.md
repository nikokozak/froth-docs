---
title: "Drive a Servo"
weight: 5
---

_Type an angle, watch it move. You'll control a servo motor from the REPL, build a sweep, and wire a potentiometer for direct knob-to-motion control._

Servos are the most physically satisfying thing you can control from the REPL. Type a number and a thing moves. In Arduino you'd write code, compile, flash, and then watch it move. Here you type `90 servo` and the arm swings.

## Prerequisites

- Chapters 00–04 of the guide (the stack, word definitions, named values)
- The [Blink an LED](blink-an-led.md) tutorial (GPIO basics)
- Hardware: ESP32 DevKit v1, a standard hobby servo (SG90, MG90S, or similar), jumper wires
- Optional: a potentiometer wired to GPIO 34

## What you are building

Interactive servo control from the REPL, then automated sweeps and knob control. By the end you'll have:

1. Moved a servo to any angle by typing a number
2. A sweep that pans smoothly from 0 to 180 degrees and back
3. A configurable `patrol` word that sweeps continuously
4. (Extension) A potentiometer that controls the servo angle directly

## Hardware setup

### Wiring the servo

A standard hobby servo has three wires:

| Wire color | Connection |
|-----------|------------|
| Red (or brown) | 5V power (use the ESP32's `VIN` or an external 5V supply) |
| Brown (or black) | GND |
| Orange (or yellow/white) | Signal to GPIO 13 |

**Power note:** Small servos (SG90) draw up to ~750mA under load. The ESP32's USB power can handle one SG90 for light work. If the servo jitters, stutters, or the board resets, it's drawing too much current. Use an external 5V supply for the servo's power wire and keep GND shared with the ESP32.

**Pin choice:** GPIO 13 is used here. Any PWM-capable pin works. Avoid GPIO 0 (BOOT button), GPIO 1/3 (serial TX/RX), and input-only pins (34, 35, 36, 39).

## Step 1 — Move to a position

```froth
froth> 13 'servo-pin def
froth> servo-pin 90 servo.write
```

The servo arm should move to 90 degrees (center position). Try other angles:

```froth
froth> servo-pin 0 servo.write      \ full left
froth> servo-pin 180 servo.write    \ full right
froth> servo-pin 45 servo.write     \ halfway left
```

`servo.write ( pin angle -- )` moves the servo on `pin` to `angle` degrees (0-180). The servo holds that position until told otherwise.

Type a number, the arm moves. Change the number, it moves again. No build step, no flash cycle.

## Step 2 — Define a convenience word

```froth
froth> : servo ( angle -- )
...     servo-pin swap servo.write ;

froth> 0 servo
froth> 90 servo
froth> 180 servo
```

Pick random angles. Watch the arm snap to each one.

## Step 3 — Smooth sweep

A smooth sweep from 0 to 180 degrees:

```froth
froth> : sweep-up ( step-ms -- )
...     0
...     [ dup 180 <= ] [
...       dup servo
...       1 +
...       over ms
...     ] while
...     drop drop ;

froth> : sweep-down ( step-ms -- )
...     180
...     [ dup 0 >= ] [
...       dup servo
...       1 -
...       over ms
...     ] while
...     drop drop ;

froth> 10 sweep-up
froth> 10 sweep-down
```

The servo pans smoothly across its range. `step-ms` controls the speed: `5` is fast, `20` is slow and deliberate. The structure is identical to `fade-up` and `fade-down` from the [Fade an LED](fade-an-led.md) tutorial, just with a different range and output word.

## Step 4 — Continuous patrol

```froth
froth> : patrol ( step-ms -- )
...     [ true ] [
...       dup sweep-up
...       dup sweep-down
...     ] while
...     drop ;

froth> 10 patrol
```

The servo sweeps back and forth continuously.

Redefine with a pause at each end:

```froth
froth> : patrol ( step-ms -- )
...     [ true ] [
...       dup sweep-up   500 ms
...       dup sweep-down  500 ms
...     ] while
...     drop ;
froth> 10 patrol
```

Half a second of stillness at each extreme. Redefine and call again.

## Extension: potentiometer-controlled servo

Wire a potentiometer to GPIO 34 (same setup as [Read a Sensor](read-a-sensor.md)). Map the ADC range (0-4095) to servo degrees (0-180):

```froth
froth> 34 'pot-pin def

froth> : read-angle ( -- degrees )
...     pot-pin adc.read 180 * 4095 / ;

froth> : knob-servo ( -- )
...     [ true ] [
...       read-angle servo
...       20 ms
...     ] while ;

froth> knob-servo
```

Turn the potentiometer. The servo arm tracks your hand. Left = 0 degrees, right = 180 degrees, everywhere in between.

The entire program is four words, each one line long.

## Extension: named position presets

Define named positions and switch between them:

```froth
froth> 0   'pos-left def
froth> 90  'pos-center def
froth> 180 'pos-right def

froth> : left    pos-left servo ;
froth> : center  pos-center servo ;
froth> : right   pos-right servo ;

froth> left
froth> center
froth> right
```

The REPL reads like English: `left`, `center`, `right`. Redefine the angles to fine-tune the positions for your specific mechanical setup.

## What you learned

- **`servo.write ( pin angle -- )`** moves a servo to a specific angle (0-180 degrees). The servo holds position.
- **Servos vs. DC motors:** servos move to an angle and stay. DC motors spin continuously. Different tools for different jobs.
- **Smooth sweeps:** increment the angle by 1 in a loop with a delay between each step. Same pattern as `fade-up` / `fade-down`.
- **Input-to-output mapping:** `read-angle` scales ADC counts to degrees. The same scaling pattern works any time you connect a sensor to an actuator.
- **Named presets with `def`:** give positions meaningful names. The REPL becomes a command vocabulary for your hardware.
- **Live redefinition:** change `patrol` behavior by redefining the word. The servo responds immediately.

---

[← Fade an LED](fade-an-led.md) | [Next: Build a Calculator →](build-a-calculator.md)

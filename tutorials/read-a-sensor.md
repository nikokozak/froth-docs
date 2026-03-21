# Read a Sensor

_Read from an analog sensor, convert the raw ADC value to something meaningful, and build a continuous display loop with threshold alerts._

---

## Outline and writing notes

This tutorial is the natural follow-up to the LED blink tutorial. The reader has learned to drive a GPIO output. Now they learn to read a GPIO input — specifically, an analog input through the ADC.

The appeal of this tutorial is immediacy: plug in a sensor (or just connect a potentiometer to an ADC pin), run the read loop, and you're watching live values scroll past. It's the same satisfying feedback loop as the LED blink, but in the other direction.

Keep the hardware setup simple. A potentiometer wired as a voltage divider is universal hardware and needs no explanation. If the reader doesn't have a potentiometer, the internal temperature sensor is a fallback (mention it briefly).

Don't spend too much space on ADC theory. The reader needs to know: the ADC on the ESP32 returns a 12-bit value (0–4095), 0 corresponds to 0V and 4095 corresponds to approximately 3.3V. That's enough.

The threshold alert extension is the tutorial's payoff: it combines sensor reading, math, and GPIO output into one word. By the end, the reader has a complete monitoring program.

Tone: practical, hands-on. Same teacher voice as the blink tutorial. Move through each step briskly, then let the reader extend.

---

## Prerequisites

Before starting this tutorial:

- Chapters 00–08 of the guide (the stack, word definitions, quotations, control flow, error handling, strings, hardware I/O)
- Hardware: ESP32 DevKit v1, a potentiometer (or any analog sensor), jumper wires
- VSCode with the Froth extension connected to the board
- The blink tutorial completed (recommended, not required)

Verification:
```froth
froth> 1 1 + .
2
froth> LED_BUILTIN 1 gpio.mode
froth> LED_BUILTIN 1 gpio.write
```

LED should light up. If the REPL isn't working, troubleshoot the connection first.

---

## What we're building

A continuous sensor reading display with a threshold alert.

By the end of this tutorial you'll have:

1. A word that reads the raw ADC value from an analog pin
2. A calibration word that converts raw counts to millivolts
3. A display loop that prints readings continuously
4. A threshold alert: when the sensor value exceeds a limit, an LED lights up

---

## Hardware setup

### Wiring a potentiometer

A potentiometer (pot) is the simplest analog sensor. Wire it as a voltage divider:

- Outer pin 1 → 3.3V (the ESP32's 3.3V power pin)
- Outer pin 2 → GND
- Wiper (center pin) → GPIO 34

GPIO 34 is a good choice on the ESP32 DevKit: it's input-only (no output capable), which makes it naturally suited for ADC use. The ADC is on channels shared across several pins — GPIO 32, 33, 34, 35, 36, 39 are all ADC-capable.

**No potentiometer?** Use the ESP32's built-in temperature sensor (if available on your firmware build). See the note at the end of this section.

**Alternative sensors:** Any sensor that outputs an analog voltage in the 0–3.3V range will work. Photoresistors (light sensors), NTC thermistors, and simple hall-effect sensors all wire the same way. Replace `34` with whatever pin you've wired your sensor to.

**ADC note:** The ESP32 ADC is 12-bit: it returns values from 0 (GND) to 4095 (3.3V). The conversion is not perfectly linear — there's nonlinearity near the extremes. For this tutorial, the raw count is sufficient. If you need calibrated voltage, the conversion word in step 4 handles it.

---

## Step-by-step

### Step 1 — Verify the ADC pin is readable

At the REPL:

```froth
froth> 34 adc.read .
```

You should see a number between 0 and 4095. Turn the potentiometer and the number should change.

`adc.read ( pin -- count )` — reads the ADC value from the specified pin. Returns a 12-bit integer (0–4095).

If you see an error ("undefined word: adc.read"), the board library may not include ADC words. Check the reference for your board. On the standard ESP32 build, `adc.read` is available.

If the value is stuck at 0 or 4095, check your wiring. 0 means the pin reads near GND; 4095 means it reads near 3.3V. A properly wired potentiometer should sweep between them.

---

### Step 2 — Read in a loop

The basic read loop — watch the value change as you turn the pot:

```froth
froth> [ true ] [ 34 adc.read . cr 100 ms ] while
```

Break this down:
- `[ true ]` — loop condition: always true, loop forever
- `34 adc.read` — read the ADC count from GPIO 34
- `.` — print it
- `cr` — newline (so each reading appears on its own line)
- `100 ms` — wait 100 milliseconds between readings (10 readings per second)

You should see a stream of numbers scrolling past. Turning the potentiometer changes the numbers in real time.

Press the reset button (or power-cycle) to stop the loop. (Ctrl+C behavior depends on your setup — verify whether it works on your board.)

---

### Step 3 — Define a named read word

```froth
froth> 34 'sensor-pin def

froth> : read-sensor ( -- count )
...     sensor-pin adc.read ;
```

Now you can call `read-sensor` anywhere without repeating the pin number. If you change to a different pin, update `sensor-pin` in one place.

Test:
```froth
froth> read-sensor .
```

---

### Step 4 — Define a calibration word

Convert raw counts (0–4095) to millivolts (0–3300):

The formula: `millivolts = (count * 3300) / 4095`

In Froth, all arithmetic is integer. `3300 /mod` would give a remainder we don't need; we only want the quotient. We'll use `/mod` and drop the remainder:

```froth
froth> : counts->mv ( count -- millivolts )
...     3300 *  4095 /mod  drop ;
```

Wait — `a b /mod` returns `( a b -- remainder quotient )`. The quotient is on top, remainder below. So `drop` discards the quotient and leaves the remainder. That's backwards. We need to drop the remainder:

```froth
froth> : counts->mv ( count -- millivolts )
...     3300 *  4095 /mod  nip ;
```

`nip ( a b -- b )` drops the second item (the remainder), leaving the quotient on top.

Or more explicitly:
```froth
froth> : counts->mv ( count -- millivolts )
...     3300 *  4095 /mod  swap drop ;
```

`swap drop`: swap remainder and quotient (putting quotient second, remainder on top), then `drop` the remainder. That leaves the quotient. Wait — after `/mod` we have `[remainder quotient]`. `swap` gives `[quotient remainder]`. `drop` removes remainder, leaving `[quotient]`. That's what we want.

Actually let's re-read: `/mod ( a b -- remainder quotient )` means remainder is on the bottom, quotient is on top. So after `/mod`, `drop` would discard the *quotient* (top) and leave the remainder. That's wrong. We want `nip` to discard the remainder (which is below the quotient).

```froth
froth> : counts->mv ( count -- millivolts )
...     3300 * 4095 /mod nip ;
froth> 0 counts->mv .
0
froth> 4095 counts->mv .
3300
froth> 2048 counts->mv .
1650
```

Test with known values: 0 counts = 0 millivolts, 4095 counts = 3300 millivolts. Half-scale (2047) should be approximately 1650 millivolts.

---

### Step 5 — Display loop with calibrated readings

```froth
froth> : show-reading ( -- )
...     read-sensor counts->mv
...     . "mv" s.emit cr ;

froth> [ true ] [ show-reading 250 ms ] while
```

Now you'll see something like:
```
1247 mv
1251 mv
1890 mv
2304 mv
```

as you turn the potentiometer. The readings are in millivolts.

---

### Step 6 — Package the display loop

```froth
froth> : sensor-loop ( -- )
...     [ true ] [ show-reading 250 ms ] while ;
```

Call `sensor-loop` to start the display. It runs until interrupted.

---

## Extension: threshold alerts

### Light an LED when the value exceeds a limit

Add a visual alert: if the sensor reading exceeds 2000mv (roughly 60% of full range), light the built-in LED.

```froth
froth> : check-threshold ( mv -- mv )
...     dup 2000 >
...     [ LED_BUILTIN 1 gpio.write ]
...     [ LED_BUILTIN 0 gpio.write ]
...     if ;
```

`check-threshold` takes a millivolt reading, checks if it's above 2000, and drives the LED accordingly. The `dup` keeps the reading on the stack so it can be used after the threshold check.

Set up the LED and run:

```froth
froth> LED_BUILTIN 1 gpio.mode

froth> : sensor-loop-with-alert ( -- )
...     [ true ] [
...       read-sensor counts->mv
...       check-threshold
...       . "mv" s.emit cr
...       250 ms
...     ] while ;

froth> sensor-loop-with-alert
```

As you turn the potentiometer past the threshold, the LED lights. Turn it back down and the LED goes off.

---

### Configurable threshold

Make the threshold a named value so you can adjust it without redefining `check-threshold`:

```froth
froth> 2000 'alert-threshold def

froth> : check-threshold ( mv -- mv )
...     dup alert-threshold >
...     [ LED_BUILTIN 1 gpio.write ]
...     [ LED_BUILTIN 0 gpio.write ]
...     if ;
```

Change the threshold at any time:
```froth
froth> 1000 'alert-threshold def
```

The next call to `check-threshold` uses the new value — coherent redefinition at work.

---

### Saving the sensor program

If you want the sensor loop to start at boot, define `autorun`:

```froth
froth> : autorun ( -- )
...     LED_BUILTIN 1 gpio.mode
...     sensor-loop-with-alert ;
froth> save
```

Power-cycle the board. The sensor loop starts immediately.

**Snapshot availability note:** Snapshots require `FROTH_HAS_SNAPSHOTS` to be enabled in the board firmware. On the standard ESP32 DevKit build, it is. Type `save` — if you get a confirmation (or no error), snapshots are working.

---

## The complete program

```froth
\ Sensor constants
34 'sensor-pin def
2000 'alert-threshold def

\ Hardware
: setup ( -- )
  LED_BUILTIN 1 gpio.mode ;

\ Reading
: read-sensor ( -- count )
  sensor-pin adc.read ;

: counts->mv ( count -- millivolts )
  3300 * 4095 /mod nip ;

\ Display
: show-reading ( -- )
  read-sensor counts->mv
  . "mv" s.emit cr ;

\ Alert
: check-threshold ( mv -- mv )
  dup alert-threshold >
  [ LED_BUILTIN 1 gpio.write ]
  [ LED_BUILTIN 0 gpio.write ]
  if ;

\ Main loop
: sensor-loop ( -- )
  setup
  [ true ] [
    read-sensor counts->mv
    check-threshold
    . "mv" s.emit cr
    250 ms
  ] while ;

: autorun ( -- )
  sensor-loop ;
```

Each word does one thing. `sensor-loop` composes them. `autorun` calls `sensor-loop`. This is how Froth programs grow: small, named pieces composed upward.

---

## What you learned

- **`adc.read ( pin -- count )`** — reads a 12-bit ADC value (0–4095). The ADC measures voltage on analog-capable pins.
- **Integer calibration math:** `counts->mv` converts raw counts to millivolts using `*` and `/mod`. `nip` discards the remainder and keeps the quotient.
- **Continuous loops with `while`:** `[ true ] [ body ] while` is the infinite monitoring loop pattern. Body runs on every iteration.
- **Named constants:** `34 'sensor-pin def` and `2000 'alert-threshold def` make the program configurable without touching word definitions. Change a constant, behavior changes everywhere.
- **`dup` before branching:** when you need a value for both the test and the output, `dup` it before the comparison.
- **Composing hardware words:** `check-threshold` combines a comparison with GPIO output. It takes one value and returns the same value unchanged — a side-effecting pass-through.

---

## Navigation

[← Blink an LED](blink-an-led.md) | [→ Interactive workflow](interactive-workflow.md)

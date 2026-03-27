---
title: "Read a Sensor"
weight: 3
---

_Read from an analog sensor, convert the raw ADC value to something meaningful, and build a continuous display loop with threshold alerts._

You've driven outputs and read digital inputs. Analog input is the next step: instead of `0` or `1`, you get a number from 0 to 4095 that represents a voltage. Plug in a potentiometer, run the read loop, and you're watching live values scroll past in real time.

## Prerequisites

- Chapters 00–08 of the guide (the stack, word definitions, quotations, control flow, error handling, strings, hardware I/O)
- Hardware: ESP32 DevKit v1, a potentiometer (or any analog sensor), jumper wires
- VSCode with the Froth extension connected to the board
- The [Blink an LED](blink-an-led.md) tutorial completed (recommended, not required)

Verification:

```froth
froth> 123 .
123
froth> LED_BUILTIN 1 gpio.mode
froth> LED_BUILTIN 1 gpio.write
```

The LED should light up. If the REPL isn't working, troubleshoot the connection first.

## What you are building

A continuous sensor reading display with a threshold alert. By the end you'll have:

1. A word that reads the raw ADC value from an analog pin
2. A calibration word that converts raw counts to millivolts
3. A display loop that prints readings continuously
4. A threshold alert: when the sensor value exceeds a limit, an LED lights up

## Hardware setup

### Wiring a potentiometer

A potentiometer (pot) is the simplest analog sensor. Wire it as a voltage divider:

- Outer pin 1 to 3.3V (the ESP32's 3.3V power pin)
- Outer pin 2 to GND
- Wiper (center pin) to GPIO 34

GPIO 34 is input-only on the ESP32, which makes it naturally suited for ADC use. Other ADC-capable pins include GPIO 32, 33, 35, 36, and 39.

**No potentiometer?** Any sensor that outputs an analog voltage in the 0-3.3V range will work: photoresistors, NTC thermistors, hall-effect sensors. Replace `34` with whatever pin you've wired your sensor to.

**ADC note:** The ESP32 ADC is 12-bit, returning values from 0 (GND) to 4095 (approximately 3.3V). There is some nonlinearity near the extremes. For this tutorial, the raw count is sufficient. The calibration word in step 4 handles conversion to millivolts.

## Step 1 — Verify the ADC pin is readable

```froth
froth> 34 adc.read .
```

You should see a number between 0 and 4095. Turn the potentiometer and run the command again. The number should change.

`adc.read ( pin -- count )` reads the ADC value from the specified pin. Returns a 12-bit integer (0-4095).

If the value is stuck at 0 or 4095, check your wiring. 0 means the pin is near GND; 4095 means it's near 3.3V. A properly wired potentiometer should sweep between them.

## Step 2 — Read in a loop

Watch the value change as you turn the pot:

```froth
froth> [ true ] [ 34 adc.read . cr 100 ms ] while
```

- `34 adc.read` reads the ADC count from GPIO 34
- `.` prints it
- `cr` starts a new line
- `100 ms` waits 100 milliseconds between readings (10 readings per second)

You should see a stream of numbers scrolling past. Turning the potentiometer changes the numbers in real time. Press the reset button or power-cycle to stop the loop.

## Step 3 — Define a named read word

```froth
froth> 34 'sensor-pin def

froth> : read-sensor ( -- count )
...     sensor-pin adc.read ;
```

`read-sensor` hides the pin number. If you switch to a different pin, update `sensor-pin` in one place.

Test:

```froth
froth> read-sensor .
```

## Step 4 — Convert raw counts to millivolts

The formula: `millivolts = (count * 3300) / 4095`

All arithmetic in Froth is integer. `/mod ( a b -- remainder quotient )` gives both the remainder and the quotient. We want only the quotient, so we discard the remainder with `nip`:

```froth
froth> : counts->mv ( count -- millivolts )
...     3300 * 4095 /mod nip ;
```

`/mod` leaves `[remainder quotient]` on the stack. `nip ( a b -- b )` drops the second item (the remainder), keeping the quotient on top.

Test with known values:

```froth
froth> 0 counts->mv .
0
froth> 4095 counts->mv .
3300
froth> 2048 counts->mv .
1650
```

0 counts = 0 millivolts, 4095 counts = 3300 millivolts. Half-scale gives approximately 1650.

## Step 5 — Display loop with calibrated readings

```froth
froth> : show-reading ( -- )
...     read-sensor counts->mv
...     . "mv" s.emit cr ;

froth> [ true ] [ show-reading 250 ms ] while
```

Output looks like:

```
1247 mv
1251 mv
1890 mv
2304 mv
```

as you turn the potentiometer.

## Step 6 — Package the display loop

```froth
froth> : sensor-loop ( -- )
...     [ true ] [ show-reading 250 ms ] while ;
```

Call `sensor-loop` to start the display. It runs until interrupted.

## Extension: threshold alerts

### Light an LED when the value exceeds a limit

If the sensor reading exceeds 2000mv (roughly 60% of full range), light the built-in LED:

```froth
froth> : check-threshold ( mv -- mv )
...     dup 2000 >
...     [ LED_BUILTIN 1 gpio.write ]
...     [ LED_BUILTIN 0 gpio.write ]
...     if ;
```

`check-threshold` checks the millivolt reading against 2000 and drives the LED accordingly. The `dup` keeps the reading on the stack so it can still be printed afterward.

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

Turn the potentiometer past the threshold and the LED lights. Turn it back down and the LED goes off.

### Configurable threshold

Make the threshold a named value:

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

The next call to `check-threshold` uses the new value. Coherent redefinition at work.

### Saving the sensor program

To start the sensor loop at boot:

```froth
froth> : autorun ( -- )
...     LED_BUILTIN 1 gpio.mode
...     sensor-loop-with-alert ;
froth> save
```

Power-cycle the board. The sensor loop starts immediately.

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

Each word does one thing. `sensor-loop` composes them. This is how Froth programs grow: small, named pieces composed upward.

## What you learned

- **`adc.read ( pin -- count )`** reads a 12-bit ADC value (0-4095). The ADC measures voltage on analog-capable pins.
- **Integer calibration math:** `counts->mv` converts raw counts to millivolts using `*` and `/mod`. `nip` discards the remainder and keeps the quotient.
- **Continuous loops with `while`:** `[ true ] [ body ] while` is the infinite monitoring loop pattern.
- **Named constants with `def`:** `34 'sensor-pin def` and `2000 'alert-threshold def` make the program configurable without touching word definitions.
- **`dup` before branching:** when you need a value for both the test and the output, `dup` it before the comparison.
- **Composing hardware words:** `check-threshold` combines a comparison with GPIO output, taking one value and returning the same value unchanged.

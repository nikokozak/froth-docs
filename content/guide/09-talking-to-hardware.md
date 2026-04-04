---
title: "Talking to Hardware"
weight: 9
---

Plug in your ESP32, open the Froth REPL, and type this:

```froth
2 1 gpio.mode
2 1 gpio.write
```

The LED on the board lights up. You just wrote a voltage to a physical pin from a REPL prompt. Type `2 0 gpio.write` and the LED turns off. Every hardware interaction in this chapter works the same way: a word, a pin number, a value, an immediate result you can see.

For exact stack effects, availability notes, and the board-facing API surface, use the [Hardware APIs reference](/reference/hardware/). This chapter stays focused on the workflow and the basic patterns.

Before going further, verify your setup. You need an ESP32 DevKit connected over USB, VSCode open with the Froth extension, and the REPL active in the terminal panel. Type `123 .` and confirm it prints `123`. If the REPL is not responding, revisit the connection steps in chapter 00.

GPIO words require real hardware. If you are using the local POSIX target, the words exist in the vocabulary but have no physical effect.

## GPIO: digital output

Exact word documentation: [GPIO Reference](/reference/hardware/gpio/).

Three words cover all digital pin operations.

**`gpio.mode ( pin mode -- )`** configures a pin's direction. Mode `1` is output (the pin drives a voltage). Mode `0` is input (the pin reads an external voltage).

```froth
2 1 gpio.mode   \ GPIO 2, output mode
```

**`gpio.write ( pin level -- )`** sets the output level of a pin. Level `1` drives the pin to 3.3V (high). Level `0` drives it to GND (low). Only meaningful on pins configured as output.

```froth
2 1 gpio.write   \ GPIO 2 high — LED on
2 0 gpio.write   \ GPIO 2 low  — LED off
```

**`gpio.read ( pin -- level )`** reads the current state of a pin and pushes `1` (high) or `0` (low).

```froth
0 gpio.read .
\ output: 1 (or 0, depending on the pin state)
```

The argument order is consistent across all three words: pin number first, then the parameter. The "where" comes before the "what."

## Blinking an LED

The ESP32 DevKit v1 has a built-in LED on GPIO 2. Driving it high lights it up; driving it low turns it off.

Start by configuring the pin and toggling it manually:

```froth
2 1 gpio.mode
2 1 gpio.write
2 0 gpio.write
```

You should see the LED flicker. To make the blink visible, you need timing.

### Timing: `ms`

`ms ( ms -- )` blocks for the specified number of milliseconds. `500 ms` pauses for half a second. Nothing else executes during the wait.

```froth
2 1 gpio.write 500 ms 2 0 gpio.write 500 ms
```

LED on for 500ms, off for 500ms. One blink.

Wrap it in a word:

```froth
: blink ( delay -- )
  2 1 gpio.write dup ms
  2 0 gpio.write ms ;
```

`dup` copies the delay value so it serves both the on-phase and the off-phase. The first `ms` consumes the copy; the second consumes the original. Usage:

```froth
500 blink
```

The LED blinks once with a 500ms period. To blink repeatedly:

```froth
: blink-n ( count delay -- )
  swap [ over blink ] times drop ;
```

`swap` puts the count on top for `times`. Each iteration, `over` copies the delay from below the counter, and `blink` consumes it. After the loop, `drop` removes the leftover delay.

```froth
5 200 blink-n
```

Five blinks, 200ms each. Watch the board.

## Pin constants

The board library defines named constants for well-known pins. On the ESP32 DevKit v1:

- `LED_BUILTIN` is GPIO 2 (the onboard LED)
- `BOOT_BUTTON` is GPIO 0 (the button labeled BOOT)

Using constants makes your code readable and portable. If you move to a board where the LED is on a different pin, only the board definition changes. Your Froth code stays the same.

```froth
LED_BUILTIN 1 gpio.mode
LED_BUILTIN 1 gpio.write
```

Rewriting `blink` with the constant:

```froth
: blink ( delay -- )
  LED_BUILTIN 1 gpio.write dup ms
  LED_BUILTIN 0 gpio.write ms ;
```

The board library (`lib/board.froth`) loads automatically when a supported board is connected. It defines these constants along with any board-specific convenience words. You can read the file to see exactly what is available.

## GPIO: digital input

The BOOT button on the ESP32 DevKit is connected to GPIO 0. It is pulled high internally: `gpio.read` returns `1` when the button is not pressed and `0` when it is pressed. This is active-low behavior, the opposite of what you might expect.

Configure GPIO 0 as input and read it:

```froth
BOOT_BUTTON 0 gpio.mode
BOOT_BUTTON gpio.read .
```

With the button released, this prints `1`. Hold the button down and run the read again: it prints `0`.

A word that prints the button state as text:

```froth
: button-state ( -- )
  BOOT_BUTTON gpio.read
  0 = [ "pressed" s.emit ] [ "released" s.emit ] if cr ;
```

`gpio.read` returns `0` when pressed. `0 =` converts that to a truthy value, so the first branch runs when the button is down.

A monitoring loop that prints the state continuously:

```froth
: watch-button ( -- )
  [ 1 ] [ button-state 50 ms ] while ;
```

This runs until you interrupt execution (Ctrl+C on most setups, or the reset button on the board). The `50 ms` delay keeps the output manageable and provides basic debouncing.

## Combining input and output

A button-controlled LED: the LED mirrors the button state. Press the button, the LED lights. Release it, the LED goes dark.

```froth
: button-led ( -- )
  LED_BUILTIN 1 gpio.mode
  BOOT_BUTTON 0 gpio.mode
  [ 1 ] [
    BOOT_BUTTON gpio.read
    0 = 1 0 choose
    LED_BUILTIN swap gpio.write
    10 ms
  ] while ;
```

Walking through the loop body:

1. `BOOT_BUTTON gpio.read` returns `1` (not pressed) or `0` (pressed).
2. `0 =` inverts: `0` becomes `1` (truthy), `1` becomes `0` (falsy).
3. `1 0 choose` selects `1` if the flag is truthy, `0` if not. This gives us the correct level to write: `1` (LED on) when the button is pressed, `0` (LED off) when released.
4. `LED_BUILTIN swap gpio.write` puts the pin number below the level and writes.
5. `10 ms` debounces.

An SOS pattern using the `blink` word from earlier:

```froth
: sos ( -- )
  3 [ 100 blink ] times
  300 ms
  3 [ 300 blink ] times
  300 ms
  3 [ 100 blink ] times
  1000 ms ;
```

Three short blinks, three long, three short, then a pause. Run `sos` and watch the LED. For continuous signaling: `[ sos ] [ ] while`.

## PWM with LEDC

Digital output is binary: on or off. PWM (pulse-width modulation) varies the effective output by toggling the pin at high frequency with a controlled duty cycle. The ESP32's LEDC peripheral handles this in hardware.

**`ledc.timer-config`** and **`ledc.channel-config`** set up a PWM channel. The board library wraps these into convenience words. The typical setup sequence:

```froth
0 LED_BUILTIN 5000 ledc.setup
```

This configures LEDC channel 0 on the LED pin at 5000 Hz. The ESP32 supports up to 8 channels (0 through 7), so you can drive multiple pins with independent frequencies.

**`ledc.set-duty`** and **`ledc.update-duty`** control the duty cycle:

```froth
0 512 ledc.duty    \ 50% brightness
0 1023 ledc.duty   \ full brightness
0 0 ledc.duty      \ off
```

Duty values range from 0 (fully off) to 1023 (fully on) at 10-bit resolution. `512` is roughly 50%.

**`ledc.off`** stops PWM output on a channel:

```froth
0 ledc.off
```

A fade effect, stepping the duty cycle from full brightness down to zero:

```froth
: fade-down ( -- )
  0 LED_BUILTIN 5000 ledc.setup
  1024 [ dup 1 - 0 over ledc.duty 2 ms ] times
  drop
  0 ledc.off ;
```

Each iteration decrements the counter and sets it as the duty value. The 2ms delay between steps makes the fade visible over about two seconds.

For audio output, connect a passive buzzer to a free GPIO pin and set the frequency to the desired tone:

```froth
1 5 440 ledc.setup   \ channel 1, GPIO 5, 440 Hz (concert A)
1 512 ledc.duty      \ 50% duty — square wave
500 ms
1 ledc.off
```

Changing the frequency with `ledc.freq` lets you play melodies:

```froth
: beep ( freq duration -- )
  swap 1 5 rot ledc.setup
  1 512 ledc.duty
  ms
  1 ledc.off ;

440 200 beep 100 ms 880 200 beep
```

## I2C: talking to sensors

Exact word documentation: [I2C Reference](/reference/hardware/i2c/).

I2C is a two-wire bus protocol used by many sensors, displays, and peripherals. You connect the sensor's SDA and SCL lines to two GPIO pins, and Froth handles the protocol.

There are two layers:

- raw handle words such as `i2c.init`, `i2c.add-device`, and `i2c.read-reg`
- board-lib helpers such as `i2c.setup`, `i2c.setup-fast`, `i2c.device`, and `i2c.device-fast`

For most board code, start with the helpers.

**Create a bus:**

```froth
i2c.setup-fast 'bus value
```

`i2c.setup-fast` uses the board's `SDA` and `SCL` constants, creates a 400kHz bus, and stores the handle in `bus`.

**Probe one address:**

```froth
bus 104 i2c.probe .
\ -1 if address 104 responds, 0 if not
```

`i2c.probe ( bus addr -- flag )` checks one 7-bit address. It does not perform a full bus scan by itself.

**Add a device handle:**

```froth
bus 104 i2c.device 'device value
```

`i2c.device ( bus addr -- device )` registers a default-speed device on the bus. `i2c.device-fast` does the same at 400kHz.

**Read and write:**

```froth
device 117 i2c.read-reg .   \ read WHO_AM_I register (0x75)
0 device 107 i2c.write-reg  \ write 0 to register 0x6B (wake up)
```

`i2c.read-reg` and `i2c.write-reg` handle single-byte register access. `i2c.read-byte` and `i2c.write-byte` send and receive raw bytes without specifying a register address. `i2c.read-reg16` reads a big-endian 16-bit value.

A word that reads a temperature sensor and prints the value:

```froth
: read-temp ( device -- )
  dup 65 i2c.read-reg 8 *    \ high byte, shifted left 8
  swap 66 i2c.read-reg +     \ add low byte
  "temp: " s.emit . cr ;
```

The exact register addresses depend on your sensor. Consult its datasheet for the register map.

## Analog input: ADC

`adc.read ( pin -- count )` reads an analog voltage on a pin and returns a 12-bit value (0 to 4095). `0` corresponds to 0V, `4095` to approximately 3.3V.

```froth
34 adc.read .
\ output: 2048 (roughly 1.65V, halfway)
```

Not every GPIO pin supports ADC. On the ESP32, ADC-capable pins include GPIO 32 through 39. Check your board's pinout diagram.

A word that reads a sensor and prints a scaled voltage:

```froth
: read-voltage ( pin -- )
  adc.read
  330 * 4095 /
  "voltage: 0." s.emit . "V" s.emit cr ;
```

This is approximate integer math. For `adc.read` returning 2048, the calculation gives `330 * 2048 / 4095`, which is roughly 164, printed as `0.164 V`. Froth does not have floating-point arithmetic, so integer scaling is the standard approach.

Note: ADC support may not be available in all Froth firmware builds. If `adc.read` is not recognized, your firmware may need an update.

## Exercises

**Exercise 1.** At the REPL, configure GPIO 2 as output and toggle it three times with 500ms delays. Do this entirely from the REPL without defining a word.

**Exercise 2.** Define a word `flash ( n -- )` that blinks `LED_BUILTIN` the given number of times at 100ms per blink.

**Exercise 3.** Read `BOOT_BUTTON` at the REPL. Run it once with the button held and once with it released. Confirm the active-low behavior.

**Exercise 4.** Using `ledc.setup` and `ledc.duty`, fade the LED from off to full brightness over about 2 seconds, then turn off PWM.

**Exercise 5 (challenge).** Write a program where pressing and releasing the BOOT button cycles the LED through four brightness levels using PWM: off, dim (256), medium (512), full (1023), then back to off. You will need a variable or a stack value that tracks the current level across button presses.

---
title: "GPIO"
weight: 1
description: "Digital pin input and output words."
---

Digital GPIO is part of the shared board/platform surface.

## Availability

| Property | Value |
|---|---|
| Surface | board/platform API |
| Boards in repo | `esp32-devkit-v1`, `posix` |
| Local POSIX target | yes |
| POSIX behavior | stub/trace surface, no physical pins |

Board libraries may also define named pin constants such as `LED_BUILTIN` or `BOOT_BUTTON`.

## Words

**`gpio.mode`**  `( pin mode -- )`

Configures a pin direction.

- `1` = output
- `0` = input

```froth
LED_BUILTIN 1 gpio.mode
BOOT_BUTTON 0 gpio.mode
```

**`gpio.write`**  `( pin level -- )`

Writes a digital output level.

- `1` = high
- `0` = low

```froth
LED_BUILTIN 1 gpio.write
LED_BUILTIN 0 gpio.write
```

**`gpio.read`**  `( pin -- level )`

Reads a digital input level.

- `1` = high
- `0` = low

```froth
BOOT_BUTTON gpio.read .
```

## Notes

- The argument order is consistent: pin first, then the operation parameter.
- On hardware targets, these words act on real pins.
- On the POSIX target, GPIO exists so code and tests can exercise the same vocabulary, but there is no physical I/O behind it.

For worked examples, see [Talking to Hardware](/guide/09-talking-to-hardware/) and [Blink an LED](/tutorials/blink-an-led/).

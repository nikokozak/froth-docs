---
title: "I2C"
weight: 2
description: "Bus, device, and register words for I2C peripherals."
---

I2C is exposed as a small handle-oriented surface plus a thin board-lib convenience layer.

## Availability

| Property | Value |
|---|---|
| Surface | raw board FFI plus board-lib helpers |
| Boards in repo | `esp32-devkit-v1`, `posix` |
| Local POSIX target | yes |
| POSIX behavior | deterministic stub surface for tests and examples |

Handles are small integers returned by setup words and then passed back into later calls.

## Raw words

**`i2c.init`**  `( sda scl freq -- bus )`

Creates an I2C bus handle on the given pins at the given clock frequency in Hz.

```froth
21 22 400000 i2c.init 'bus value
```

**`i2c.add-device`**  `( bus addr speed -- device )`

Adds a 7-bit-addressed device to a bus and returns a device handle.

```froth
bus 104 400000 i2c.add-device 'device value
```

**`i2c.rm-device`**  `( device -- )`

Releases a device handle.

**`i2c.del-bus`**  `( bus -- )`

Releases a bus handle.

**`i2c.probe`**  `( bus addr -- flag )`

Checks whether one address responds on a bus.

- `-1` = address responded
- `0` = address did not respond

```froth
bus 104 i2c.probe .
```

`i2c.probe` checks one address. It does not perform a full bus scan by itself.

**`i2c.write-byte`**  `( device byte -- )`

Writes one byte to a device.

**`i2c.read-byte`**  `( device -- byte )`

Reads one byte from a device.

**`i2c.write-reg`**  `( byte device reg -- )`

Writes one byte to one register.

```froth
0 device 107 i2c.write-reg
```

**`i2c.read-reg`**  `( device reg -- byte )`

Reads one byte from one register.

```froth
device 117 i2c.read-reg .
```

**`i2c.read-reg16`**  `( device reg -- word )`

Reads two bytes from one register and returns a big-endian 16-bit value.

## Board-lib helpers

Board libraries provide a default path that uses board pin constants.

**`i2c.setup`**  `( -- bus )`

Creates a 100kHz bus on the board's `SDA` and `SCL` pins.

**`i2c.setup-fast`**  `( -- bus )`

Creates a 400kHz bus on the board's `SDA` and `SCL` pins.

**`i2c.device`**  `( bus addr -- device )`

Adds a 100kHz device to a bus.

**`i2c.device-fast`**  `( bus addr -- device )`

Adds a 400kHz device to a bus.

```froth
i2c.setup-fast 'bus value
bus 104 i2c.probe .
bus 104 i2c.device-fast 'device value
```

## Notes

- Device addresses are 7-bit addresses.
- On ESP32, bus and device handles are bounded internal slots, so exhausting them raises a bounds error.
- On POSIX, reads and probes are deterministic test stubs rather than real hardware transactions.

For walkthroughs and sensor examples, see [Talking to Hardware](/guide/09-talking-to-hardware/).

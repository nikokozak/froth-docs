---
title: "Hardware APIs"
weight: 2
description: "Board and platform words such as GPIO, I2C, UART, and timing."
---

This section covers target-facing APIs.

Use it for words that depend on board or platform support rather than the core VM or stdlib:

- raw board or platform FFI words such as `gpio.mode`, `i2c.init`, `uart.read`, and `ms`
- board-lib convenience words such as `i2c.setup`, `i2c.device`, `uart.setup`, and `uart.type`
- availability notes for hardware targets and the local POSIX target

The split is simple:

- [Word Reference](/reference/words/) is for universal Froth words.
- Hardware API pages are for board-bound contracts that a target may or may not expose.

Each hardware page documents:

- the shared word surface
- stack effects and example usage
- whether the behavior is real hardware I/O or a host-side stub on POSIX

---
title: "UART"
weight: 3
description: "Auxiliary UART words and board-lib convenience helpers."
---

UART is exposed as a minimal byte-oriented surface plus two board-lib convenience words.

## Availability

| Property | Value |
|---|---|
| Surface | raw board FFI plus board-lib helpers |
| Boards in repo | `esp32-devkit-v1`, `posix` |
| Local POSIX target | yes |
| POSIX behavior | deterministic readback plus console-visible writes |

## Raw words

**`uart.init`**  `( tx rx baud -- uart )`

Creates a UART handle on the given TX/RX pins and baud rate.

```froth
17 16 115200 uart.init 'uart value
```

**`uart.write`**  `( byte uart -- )`

Writes one byte to a UART.

```froth
65 uart uart.write
```

**`uart.read`**  `( uart -- byte )`

Reads one byte from a UART.

```froth
uart uart.read .
```

## Board-lib helpers

**`uart.setup`**  `( baud -- uart )`

Creates a UART using the board's `UART_TX` and `UART_RX` pin constants.

```froth
115200 uart.setup 'uart value
```

**`uart.type`**  `( s uart -- )`

Writes every byte of a string to a UART.

```froth
"hello" uart uart.type
```

## Notes

- This is a minimal byte-oriented API. There is no `uart.key?`, deinit word, or buffered line interface in this surface.
- On ESP32 DevKit V1, this surface uses auxiliary UARTs and leaves the REPL/transport UART alone.
- On POSIX, `uart.write` emits to the host console and `uart.read` returns deterministic stub bytes for tests and examples.

For the board-level convenience layer, see `boards/<board>/lib/board.froth` in the Froth repo.

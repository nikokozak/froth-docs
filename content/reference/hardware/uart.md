---
title: "UART"
weight: 3
description: "Auxiliary UART words, console-routing affordances, and board-lib helpers."
---

UART now has two related surfaces:

- auxiliary UART handles for ordinary serial I/O
- console-routing words for boards that can move the active REPL/transport UART at runtime

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

**`uart.key?`**  `( uart -- flag )`

Pushes `-1` when at least one byte is waiting in the UART RX buffer, otherwise `0`.

```froth
uart uart.key?
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

## Console routing words

These words are for the active console path itself: the byte stream that carries REPL input, REPL output, and host attachment.

On boards that support them, they are the explicit way to move the REPL away from the default boot UART and onto a different route.

**`console.info`**  `( -- )`

Prints the currently active console UART route.

```froth
console.info
```

Typical ESP32 output:

```text
console uart0 tx=1 rx=3 baud=115200
```

**`console.uart!`**  `( port tx rx baud -- )`

Rebinds the active console, including subsequent REPL input, to the specified UART route.

```froth
1 17 16 1200 console.uart!
```

After that call succeeds, the REPL no longer listens on the old default UART. The next prompt, the next line of input, and the next host attachment all happen on the new route.

This is intended for cases like a serial terminal or typewriter workflow where you want the Froth console itself to move, not just a side-channel UART handle.

**`console.default!`**  `( -- )`

Restores the default boot and recovery UART route.

```froth
console.default!
```

### Persistent redirect example

If you want the board to come up on a different REPL UART after boot, define `autorun` and save a snapshot:

```froth
: typewriter-console ( -- )   1 17 16 1200 console.uart! ;
: autorun ( -- )   typewriter-console ;
save
```

Safe boot still comes up on the default console path first, so you keep a recovery route even if the saved redirect is wrong.

## Notes

- `uart.setup` and `uart.type` are still ordinary auxiliary-UART helpers. They do not move the REPL by themselves.
- Use `console.uart!` when you intentionally want REPL input and output to move to a different UART.
- On ESP32 DevKit V1, `console.*` is available and the implementation rejects routes that would conflict with an allocated auxiliary UART handle.
- `console.uart!` and `console.default!` fail while a Live session is attached; use them in direct REPL mode or in `autorun`.
- On POSIX, `uart.write` emits to the host console, `uart.read` returns deterministic stub bytes, and `console.*` is not part of the shared POSIX surface.

For the board-level convenience layer, see `boards/<board>/lib/board.froth` in the Froth repo.

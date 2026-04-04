---
title: "Board FFI Example"
weight: 3
description: "An end-to-end board-side FFI example from the ESP32 source tree."
---

This page walks one real board-side surface from C bindings to Froth convenience words.

The example comes from the ESP32 board support package in the Froth repo:

- `boards/esp32-devkit-v1/ffi.c`
- `boards/esp32-devkit-v1/lib/board.froth`

The goal is to show the intended layering:

- raw C bindings at the board edge
- thin board-lib wrappers in Froth
- user code written against the cleaner wrapper surface

## The surface we are following

The ESP32 board exposes a minimal UART primitive set in C:

- `uart.init ( tx rx baud -- uart )`
- `uart.write ( byte uart -- )`
- `uart.read ( uart -- byte )`

The board library then builds convenience words on top:

- `uart.setup ( baud -- uart )`
- `uart.type ( s uart -- )`

That is a good board example because:

- the C bindings are small and honest
- the board-lib wrappers do useful work
- the ownership line is clear

## Step 1: raw C binding

From `boards/esp32-devkit-v1/ffi.c`:

```c
FROTH_FFI_ARITY(esp32_uart_init, "uart.init", "( tx rx baud -- uart )", 3, 1,
                "Initialize an auxiliary UART. Returns a UART handle (0-1).") {
  FROTH_POP(baud);
  FROTH_POP(rx);
  FROTH_POP(tx);
  ...
  uart_in_use[i] = 1;
  FROTH_PUSH(i);
  return FROTH_OK;
}
```

This is textbook Froth FFI:

- fixed stack effect
- reverse pop order from the call site
- a small integer handle returned to Froth

The write binding is equally small:

```c
FROTH_FFI_ARITY(esp32_uart_write, "uart.write", "( byte uart -- )", 2, 0,
                "Write one byte to an auxiliary UART.") {
  FROTH_POP(uart);
  FROTH_POP(byte);
  ...
}
```

And the read binding:

```c
FROTH_FFI_ARITY(esp32_uart_read, "uart.read", "( uart -- byte )", 1, 1,
                "Read one byte from an auxiliary UART.") {
  FROTH_POP(uart);
  ...
  FROTH_PUSH(in);
  return FROTH_OK;
}
```

At this point the board already has a complete byte-oriented UART surface.

## Step 2: board-lib wrapper

The board library turns that into something more usable for ordinary code.

From `boards/esp32-devkit-v1/lib/board.froth`:

```froth
: uart.setup ( baud -- uart )   UART_TX UART_RX rot uart.init ;
```

This does one board-owned job:

- hide the board pin constants behind a stable word

The user no longer has to remember TX/RX pin numbers.

The second wrapper is string-oriented output:

```froth
: _uart.type-step ( s uart i -- s uart )
    >r
    over r@ s@
    over uart.write
    r> drop
;

: uart.type ( s uart -- )
    over s.len [ _uart.type-step ] times.i
    drop drop
;
```

This is the intended pattern:

- C provides the smallest useful primitive: one byte in, one byte out
- Froth provides the sequence logic and string traversal

## Step 3: user-facing code

Once the board layer exists, user code can stay clean:

```froth
115200 uart.setup 'u value
"Hello" u uart.type
u uart.read .
```

The user sees:

- one setup word
- one string-output word
- the raw byte read when needed

That is a better API than forcing every project to rediscover board pins and hand-roll string emission.

## Why this example is good

It keeps each layer doing the right kind of work.

**C layer**

- pin binding
- SDK calls
- handle allocation
- byte I/O

**Board-lib Froth layer**

- default pins
- string iteration
- convenience naming

**Project/application layer**

- protocol logic
- framing
- parsing
- control flow

## What to copy from this pattern

When adding a board-owned surface:

1. write the narrow C primitives in `boards/<board>/ffi.c`
2. register them in `froth_board_bindings`
3. add convenience words in `boards/<board>/lib/board.froth`
4. keep the convenience layer small and board-specific

Do not push higher-level application policy into the board package.

## A second board example in the same tree

The LEDC/PWM surface uses the same layering pattern:

- raw words such as `ledc.timer-config`, `ledc.channel-config`, `ledc.set-duty`
- board-lib wrappers such as `ledc.setup`, `ledc.duty`, `ledc.off`

If you want a larger example of the same idea, that part of `boards/esp32-devkit-v1/lib/board.froth` is worth reading next.

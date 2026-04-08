---
title: "How FFI Works"
weight: 1
description: "How C functions become Froth words."
---

The Froth FFI layer is small on purpose.

A C binding is just:

1. a native function with the VM pointer
2. a metadata record with name, stack effect, arity, and help text
3. an entry in a null-terminated binding table

At boot, Froth registers those tables into the same slot table used by every other word.

There is no separate foreign subsystem after boot. A C-backed word is just another named word.

## The core type

The public surface lives in `src/froth_ffi.h`.

The metadata record is:

```c
typedef struct {
  const char *name;
  froth_native_word_t word;
  const char *stack_effect;
  uint8_t in_arity;
  uint8_t out_arity;
  const char *help;
} froth_ffi_entry_t;
```

That tells the runtime everything it needs to know to expose the binding:

- `name`: the Froth word name
- `word`: the C function pointer
- `stack_effect`: human-readable signature
- `in_arity` / `out_arity`: arity metadata for tooling and checking
- `help`: one-line description

## The authoring macros

The same header defines the convenience macros used throughout the source tree:

- `FROTH_FFI_ARITY(...)` for fixed-arity words
- `FROTH_FFI(...)` for rare unknown-arity cases
- `FROTH_POP(name)` to pop one cell
- `FROTH_PUSH(value)` to push one cell
- `FROTH_BIND(fn_name)` to reference the metadata record in a binding table
- `FROTH_BOARD_BEGIN(name)` / `FROTH_BOARD_END` to declare a null-terminated table

The important detail is that `FROTH_FFI_ARITY` expands to both:

- the C function declaration/definition
- the companion `froth_ffi_entry_t`

That is why a binding author usually writes only one block per word.

## A minimal binding

This is the essential shape:

```c
#include "froth_ffi.h"

FROTH_FFI_ARITY(prim_limit, "limit", "( x lo hi -- y )", 3, 1,
                "Clamp x into the inclusive range [lo, hi]") {
  FROTH_POP(hi);
  FROTH_POP(lo);
  FROTH_POP(x);

  if (x < lo) x = lo;
  if (x > hi) x = hi;

  FROTH_PUSH(x);
  return FROTH_OK;
}
```

Three details matter here:

- the stack effect is declared explicitly
- the pop order follows the data stack, so `hi` is popped first
- the function returns a normal Froth error code

From Froth, that word is ordinary:

```froth
5 0 10 limit .
```

## The stack discipline

FFI code follows the same stack order as Froth source.

If a word has effect:

```text
( a b -- c )
```

then `b` is on top of the stack and must be popped first.

That pattern appears throughout the board code. A direct example from the ESP32 board is `i2c.write-reg` in `boards/esp32-devkit-v1/ffi.c`:

```c
FROTH_FFI_ARITY(esp32_i2c_write_reg, "i2c.write-reg", "( byte device reg -- )",
                3, 0, "Write a byte to a register on an I2C device.") {
  FROTH_POP(reg);
  FROTH_POP(dev);
  FROTH_POP(byte);
  ...
}
```

That matches the Froth call shape exactly:

```froth
0 device 107 i2c.write-reg
```

The top item at the call site is `107`, so `reg` is popped first.

## Registration tables

Bindings are published through null-terminated tables of `froth_ffi_entry_t`.

The table declaration pattern is:

```c
FROTH_BOARD_BEGIN(froth_board_bindings)
  FROTH_BIND(prim_one),
  FROTH_BIND(prim_two),
FROTH_BOARD_END
```

The same pattern is used for project-local bindings; only the table name changes.

## Boot-time registration

Boot registration happens in `src/froth_boot.c`.

The order is:

1. kernel primitives
2. board bindings
3. project bindings, if present
4. snapshot words, if enabled

The relevant calls are:

```c
err = froth_ffi_register(&froth_vm, froth_primitives);
err = froth_ffi_register(&froth_vm, board_bindings);
#ifdef FROTH_HAS_PROJECT_FFI
err = froth_ffi_register(&froth_vm, froth_project_bindings);
#endif
```

That order means:

- board words are available before board libraries load
- project words are available before restore and `autorun`
- all registered words share the same slot namespace

## Real examples from the source tree

### Example 1: a simple hardware word

From `boards/esp32-devkit-v1/ffi.c`:

```c
FROTH_FFI_ARITY(esp32_gpio_mode, "gpio.mode", "( pin mode -- )", 2, 0,
                "Configure GPIO direction: 0=input, 1=output.") {
  FROTH_POP(mode);
  FROTH_POP(pin);
  ...
}
```

This is the classic FFI pattern:

- fixed arity
- one clear stack effect
- tiny translation layer into the platform SDK

### Example 2: a handle-returning word

Also from `boards/esp32-devkit-v1/ffi.c`:

```c
FROTH_FFI_ARITY(esp32_i2c_init, "i2c.init", "( sda scl freq -- bus )", 3, 1,
                "Initialize an I2C master bus. Returns a bus handle (0-1).") {
  FROTH_POP(freq);
  FROTH_POP(scl);
  FROTH_POP(sda);
  ...
  FROTH_PUSH(i);
  return FROTH_OK;
}
```

The returned bus handle is just a Froth number. Later calls pass it back into other bindings such as `i2c.add-device` and `i2c.probe`.

### Example 3: a string-oriented board-lib wrapper

The low-level UART surface is byte-oriented, but the board library builds a string helper on top.

The documented shape looks like this:

```froth
'uart.type-s variable
'uart.type-uart variable
'uart.type-i variable

: uart.type ( s uart -- )
    uart.type-uart !
    uart.type-s !
    0 uart.type-i !
    [ uart.type-i @ uart.type-s @ s.len < ]
    [ uart.type-s @ uart.type-i @ s@
      uart.type-uart @ uart.write
      1 uart.type-i +! ]
    while
;
```

This is the intended layering:

- C for the narrow primitive edge
- Froth for wrappers, composition, and convenience

## Beyond numbers

The public API also includes helpers for nontrivial values:

- `froth_pop_bstring(...)`
- `froth_push_bstring(...)`
- `froth_pop_tagged(...)`
- `froth_throw(...)`

Use them when a binding genuinely needs strings, tagged values, or a normal Froth error path.

If a binding only needs numbers or handles, keep it on `FROTH_POP` / `FROTH_PUSH`.

## What makes a good FFI word

- The stack effect is honest.
- The help string says what the word does in one line.
- The binding performs one narrow job.
- The word name belongs to the layer that owns it.
- The rest of the program stays in Froth.

For the manifest-driven path that adds project-owned bindings, continue to [Project FFI](/reference/ffi/project-ffi/).

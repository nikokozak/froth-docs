---
title: "FFI and C Integration"
weight: 12
advanced: true
description: "Where the Froth/C boundary is today, how bindings are written, and what is still missing."
---

This chapter is about the boundary between Froth and C. Most of the time, you should stay on the Froth side. The feedback loop is better there, the code is easier to reshape, and the whole point of the system is that you can keep the board live while you work.

But some things do belong in C:

- a tight inner loop where interpreter overhead matters
- a call into a vendor SDK that already exists in C
- a device driver or peripheral shim that would be awkward to express from scratch in Froth

That is the good news.

The important constraint is this: **custom C is not part of the live REPL loop.** Froth source can be sent and redefined interactively. C bindings are compiled into firmware. If you change C, you rebuild, flash, and reconnect.

## The current state

Froth already has a real C FFI layer. The runtime exposes public helper functions and macros for defining native words, and the board packages use that mechanism today.

You can see the current shape in the Froth source:

- `froth_ffi.h` defines the public C API and the `FROTH_FFI` / `FROTH_BIND` macros
- `boards/posix/ffi.c` is the smallest readable binding table
- `boards/esp32-devkit-v1/ffi.c` shows what a fuller board package looks like

There is also a project-manifest direction for custom FFI in `froth.toml`. The manifest parser already has an `[ffi]` section with `sources`, `includes`, and `defines`.

The catch is that the current CLI build path does **not** wire those project-local C sources through yet. So if what you want is "drop one C file into a normal project and have `froth build` pick it up," that path is not finished today.

The practical consequence is simple:

- **today:** custom C means firmware work, then `froth build` / `froth flash`
- **not today:** one-off hot-loaded C helpers inside the normal REPL loop

If you are thinking about tight audio loops, ISR-adjacent work, or high-frequency peripheral code, plan on the hot path living in C and the control layer living in Froth.

## What a binding looks like

At the C level, a Froth word is just a native function plus metadata:

```c
#include "ffi.h"

FROTH_FFI(prim_fast_twice, "fast.twice", "( n -- n )",
          "Double a number in C") {
  FROTH_POP(n);
  FROTH_PUSH(n * 2);
  return FROTH_OK;
}
```

The four arguments to `FROTH_FFI` are:

1. the internal C function name
2. the Froth word name the user will type
3. the stack effect string
4. the help text

Inside the body, the helpers you will use most are:

- `FROTH_POP(name)` to pop a number from the data stack
- `FROTH_PUSH(value)` to push a number back
- `froth_throw(froth_vm, code)` to signal an error

For strings and tagged values, the public API also exposes:

- `froth_pop_bstring`
- `froth_push_bstring`
- `froth_pop_tagged`

So the boundary is small and explicit. You do not write a wrapper DSL. You write C against a tiny VM-facing API.

## Registering the word

Bindings are collected into a null-terminated table:

```c
FROTH_BOARD_BEGIN(froth_board_bindings)
  FROTH_BIND(prim_fast_twice),
FROTH_BOARD_END
```

That table is what the boot sequence passes into `froth_ffi_register()`. Each entry becomes a word in the slot table during startup.

If you are modifying an existing board package, do not replace its table with a one-line example. Add your binding to the existing list.

## Using it from Froth

Once the firmware is rebuilt and flashed, the new word behaves like any other word:

```froth
5 fast.twice .
\ 10
```

The important thing to notice is that the boundary is one-way in terms of workflow:

- the **binding** is static firmware
- the **use** of the binding is live Froth

That split is often good enough. Put the narrow, performance-sensitive operation in C. Keep the orchestration, composition, and experimentation in Froth.

## A realistic workflow today

If you need a new C-backed word right now, the workflow is closer to board work than to REPL work:

1. Create or modify a board/package C binding.
2. Rebuild firmware with `froth build`.
3. Flash it with `froth flash`.
4. Reconnect and use the new word from Froth.
5. Iterate on the higher-level behavior from the REPL once the primitive exists.

That is slower than ordinary Froth development, so it is worth keeping the C surface as small as possible.

## Error handling across the boundary

When a binding fails, return a Froth error instead of inventing a side channel.

The board docs use this pattern:

```c
if (result < 0) {
  return froth_throw(froth_vm, 300);
}
```

Kernel errors occupy the low range. Board- or binding-specific errors should use `300` and above.

That matters because the error then behaves like any other Froth error. It can be caught, reported, or allowed to reach the REPL in the normal way.

## What is easy, and what is not

Here is the honest line:

**Easy enough today**

- adding or modifying board/package bindings in C
- exposing a small native primitive and using it from live Froth
- keeping the expensive or timing-sensitive part in C while leaving the rest in Froth

**Not easy today**

- per-project, one-off C helpers wired cleanly through an ordinary `froth.toml` project
- hot-reloading C in the same way Froth source is hot-reloaded
- treating custom C as just another file in the interactive editor loop

So if your question is "can I write a small custom C function for something like an audio inner loop," the answer is **yes, but not as a live one-file project trick yet**. Today it is still a build/flash boundary.

## How to think about the split

The right split is usually:

- C for timing-critical code, SDK glue, and awkward hardware edges
- Froth for composition, live tuning, control flow, deployment logic, and everything you expect to keep reshaping

That keeps the slow loop small and the fast loop large.

As the project system grows, the likely next improvement is manifest-driven project FFI so custom C can live next to ordinary project code. The schema shape is already visible. The wiring is the missing part.

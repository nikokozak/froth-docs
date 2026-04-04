---
title: "Project FFI Example"
weight: 4
description: "A complete project-local FFI example with manifest, C, and Froth code."
---

This page shows a complete project-local FFI example.

The goal is not to build an impressive C subsystem. The goal is to show the intended project shape:

- one narrow binding in C
- one `[ffi]` declaration in `froth.toml`
- ordinary Froth code above it

## Project layout

```text
my-project/
  froth.toml
  src/
    main.froth
    ffi/
      bindings.c
```

## `froth.toml`

```toml
[project]
name = "ffi-demo"
entry = "src/main.froth"

[target]
board = "posix"
platform = "posix"

[ffi]
sources = ["src/ffi/bindings.c"]
includes = ["src/ffi"]
defines = { SCALE = "2" }
```

This tells the CLI to validate `src/ffi/bindings.c`, generate `.froth-build/project_ffi.cmake`, and pass that fragment into the build.

## `src/ffi/bindings.c`

```c
#include "froth_ffi.h"

#ifndef SCALE
#define SCALE 2
#endif

FROTH_FFI_ARITY(prim_scale_twice, "scale.twice", "( n -- n )", 1, 1,
                "Multiply a number by the configured SCALE factor") {
  FROTH_POP(n);
  FROTH_PUSH(n * SCALE);
  return FROTH_OK;
}

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

FROTH_BOARD_BEGIN(froth_project_bindings)
  FROTH_BIND(prim_scale_twice),
  FROTH_BIND(prim_limit),
FROTH_BOARD_END
```

This file does exactly three things:

- defines project-owned words
- exports `froth_project_bindings`
- stops

That is the right size for project FFI.

## `src/main.froth`

```froth
: clipped-sensor ( n -- n )
  scale.twice
  0 100 limit ;

: autorun ( -- )
  60 clipped-sensor . cr ;
```

This is the intended layering:

- C for the sharp primitive edge
- Froth for composition and program meaning

## Build path

Run:

```sh
froth build
```

The build does this:

1. resolves the manifest
2. validates `[ffi]`
3. writes `.froth-build/project_ffi.cmake`
4. invokes CMake with `-DFROTH_PROJECT_FFI_CONFIG=...`
5. compiles `bindings.c` into the target
6. defines `FROTH_HAS_PROJECT_FFI`
7. registers `froth_project_bindings` at boot

That entire path is already wired into the CLI and kernel build.

## What the generated config fragment contains

The CLI writes a file shaped like this:

```cmake
set(FROTH_PROJECT_FFI_SOURCES
    "/abs/path/to/src/ffi/bindings.c"
)
set(FROTH_PROJECT_FFI_INCLUDES
    "/abs/path/to/src/ffi"
)
set(FROTH_PROJECT_FFI_DEFINES
    "SCALE=2"
)
```

That is the bridge between the manifest and the kernel `CMakeLists.txt`.

## What boot does with it

Because CMake defines `FROTH_HAS_PROJECT_FFI`, `src/froth_boot.c` includes:

```c
extern const froth_ffi_entry_t froth_project_bindings[];
```

and registers it during boot:

```c
err = froth_ffi_register(&froth_vm, froth_project_bindings);
```

That happens before restore and before `autorun`.

## What this buys you

The finished firmware exposes `scale.twice` and `limit` as ordinary words:

```froth
5 scale.twice .
150 0 100 limit .
```

From the Froth side, there is nothing special about them. They behave like other words because they are registered into the same slot table.

## What to keep small

This example is deliberately modest.

That is a feature, not a limitation.

Project FFI should usually stay in this range:

- a codec primitive
- one math helper
- one SDK bridge
- one performance-sensitive primitive

Once the file starts looking like a whole subsystem, it probably wants to be broken apart or pushed back up into Froth.

## Recommended workflow

1. add the C file
2. declare it under `[ffi]`
3. build
4. keep the rest of the program in Froth

`froth send` is still for Froth source only. It will not rebuild this C code.

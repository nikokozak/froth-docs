---
title: "FFI and C Integration"
weight: 12
advanced: true
description: "Where the Froth/C boundary is today, how bindings are written, which files matter, and what is still missing."
---

This chapter is about the boundary between Froth and C. Most of the time, you should stay on the Froth side. The feedback loop is better there, the code is easier to reshape, and the whole point of the system is that you can keep the board live while you work.

But some things do belong in C:

- a tight inner loop where interpreter overhead matters
- a call into a vendor SDK that already exists in C
- a device driver or peripheral shim that would be awkward to express from scratch in Froth

That is the good news.

## The current state

Froth already has a real C FFI layer. The runtime exposes public helper functions and macros for defining native words, and the board packages use that mechanism today.

You can see the current shape in the Froth source:

- `src/froth_ffi.h` defines the public C API and the `FROTH_FFI` / `FROTH_BIND` macros
- `src/froth_ffi.c` implements registration, typed pop/push helpers, and metadata lookup
- `src/froth_boot.c` shows when bindings are registered during boot
- `src/main.c` shows the simplest boot path: `froth_boot(froth_board_bindings)`
- `boards/posix/ffi.h` and `boards/posix/ffi.c` are the smallest readable board package
- `boards/esp32-devkit-v1/ffi.c` shows what a fuller board package looks like on real hardware
- `boards/README.md` documents the board directory shape and expectations

There is also a project-manifest direction for custom FFI in `froth.toml`. The manifest parser already has an `[ffi]` section with `sources`, `includes`, and `defines`.

The catch is that the current CLI build path does **not** wire those project-local C sources through yet. The manifest shape exists in `tools/cli/internal/project/manifest.go`, but the active build path in `tools/cli/cmd/build.go` only passes the resolved Froth program into the board/platform firmware build. So if what you want is "drop one C file into a normal project and have `froth build` pick it up," that path is not finished today.

The practical consequence is simple:

- **today:** custom C means firmware work, then `froth build` / `froth flash`
- **not today:** one-off hot-loaded C helpers inside the normal REPL loop

If you are thinking about tight audio loops, ISR-adjacent work, or high-frequency peripheral code, plan on the hot path living in C and the control layer living in Froth.

## Which files matter

If you are trying to orient yourself in the repo, these are the important ones:

- `src/froth_ffi.h`
  The public author-facing header. This is where `FROTH_FFI`, `FROTH_POP`, `FROTH_PUSH`, `FROTH_BIND`, `FROTH_BOARD_DECLARE`, `FROTH_BOARD_BEGIN`, and `FROTH_BOARD_END` live.
- `src/froth_ffi.c`
  The implementation behind the public helpers. This is where `froth_pop`, `froth_push`, `froth_pop_bstring`, `froth_push_bstring`, `froth_pop_tagged`, `froth_throw`, and `froth_ffi_register` are defined.
- `src/froth_boot.c`
  The boot sequence. This is where kernel primitives, board bindings, and snapshot primitives are registered into the VM.
- `src/main.c`
  The smallest possible entrypoint. If you want to see the "board package enters here" seam, this file is it.
- `boards/<board>/board.json`
  The board manifest. This is where the board declares its platform, chip, named pins, VM sizing, and which generic platform peripherals should be compiled in.
- `boards/<board>/ffi.h`
  The forward declaration for the board binding table. Usually very small.
- `boards/<board>/ffi.c`
  The actual board words. This is where you spend most of your time when adding custom words today.
- `boards/<board>/lib.froth`
  Optional, but useful in practice. This is where low-level C-backed words can be wrapped in a cleaner Froth-facing API.
- `boards/README.md`
  The board package contract: expected files, purpose of `board.json`, and how `ffi.c` is supposed to be structured.
- `platforms/<platform>/ffi_*.c`
  The generic platform-side bindings for things like GPIO or ADC. These are selected by the board's `peripherals` list in `board.json`.
- `tools/cli/internal/project/manifest.go`
  Useful because it shows the future `[ffi]` shape, even though it is not wired into builds yet.
- `tools/cli/cmd/build.go`
  Useful because it shows the current reality: manifest-driven Froth program builds, but not manifest-driven custom C inclusion.

That split matters. If you are adding one board word today, you are mostly editing a board `ffi.c`, and sometimes `board.json` or `lib.froth`. If you are trying to make project-local C a first-class workflow, you are in CLI/build-system territory instead.

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

## The smallest board package

The minimal board package today is:

```text
boards/<name>/
  board.json
  ffi.h
  ffi.c
  lib.froth   # optional
```

`ffi.h` is usually just:

```c
#pragma once
#include "froth_ffi.h"
FROTH_BOARD_DECLARE(froth_board_bindings);
```

That declares the null-terminated binding table that boot will later register.

`ffi.c` contains the actual words plus the binding table. The POSIX board is a good model because it is tiny and easy to read:

- one function per word
- stack values popped in explicit order
- ordinary platform or SDK calls in the middle
- one table at the bottom

That is the basic pattern to copy.

`board.json` matters too, even if your custom primitive lives in `ffi.c`. It is where the board says:

- which platform it sits on
- which generic platform peripherals should be compiled in
- which pin names should become Froth words
- how large the VM should be on that target

So the native surface on a board is often split in two:

- board-local words in `boards/<board>/ffi.c`
- generic platform words selected by `boards/<board>/board.json`

That is worth keeping straight. A board-specific hardware shim belongs in the board package. A reusable GPIO, ADC, or SPI layer for every board on a platform belongs under `platforms/<platform>/`.

`lib.froth` is where you clean up the public shape afterward. A good pattern is:

- C provides the narrow primitive
- `lib.froth` gives it a nicer Froth-facing wrapper

That keeps the C boundary small and the user-facing API consistent with the rest of the language.

## Registering the word

Bindings are collected into a null-terminated table:

```c
FROTH_BOARD_BEGIN(froth_board_bindings)
  FROTH_BIND(prim_fast_twice),
FROTH_BOARD_END
```

That table is what the boot sequence passes into `froth_ffi_register()`. Each entry becomes a word in the slot table during startup.

If you are modifying an existing board package, do not replace its table with a one-line example. Add your binding to the existing list.

The registration path today is:

1. `src/main.c` calls `froth_boot(froth_board_bindings)`
2. `src/froth_boot.c` registers kernel primitives first
3. then it registers the board binding table you passed in
4. `src/froth_ffi.c` walks that table and interns each entry into the slot table

That means board words come in through exactly the same registration mechanism as the built-in primitives. They are not a separate foreign system bolted on later.

## Using it from Froth

Once the firmware is rebuilt and flashed, the new word behaves like any other word:

```froth
5 fast.twice .
\ 10
```

That split is often good enough. Put the narrow, performance-sensitive operation in C. Keep the orchestration, composition, and experimentation in Froth.

## A realistic workflow today

If you need a new C-backed word right now, the workflow is closer to board work than to REPL work:

1. Pick the board package that should own the word.
2. Check `boards/<board>/board.json` so you know what platform modules and named pins already exist.
3. Add or modify the binding in `boards/<board>/ffi.c`.
4. If needed, add the declaration line in `boards/<board>/ffi.h`.
5. Add the binding to the board table with `FROTH_BIND(...)`.
6. If the primitive wants a cleaner user-facing name or calling shape, wrap it in `boards/<board>/lib.froth`.
7. Rebuild firmware with `froth build`.
8. Flash it with `froth flash` if the target is hardware.
9. Reconnect and use the new word from Froth.
10. Keep the orchestration in Froth and only go back into C when the primitive itself needs to change.

That is slower than ordinary Froth development, so it is worth keeping the C surface as small as possible.

For the local POSIX target, the same idea still applies, just with a faster loop: the target is local, but the word is still compiled into the runtime binary rather than hot-loaded.

If you want a project-specific C helper today, the least awkward path is still board-shaped:

1. create or clone a board package for that project
2. put the C primitive in that board's `ffi.c`
3. keep any nicer wrappers in that board's `lib.froth`
4. point the project at that board in `froth.toml`

That is not the final project-level FFI workflow, but it is the honest one that exists now.

## What to keep in mind while writing bindings

There are a few practical rules that matter:

- Pop in stack order, not in argument order as you might write a C function.
  If the Froth stack effect is `( a b -- )`, then `b` is on top and must be popped first.
- Keep bindings narrow.
  A good binding is a primitive edge: one hardware action, one SDK call, one conversion step. Do not move application logic into C just because you can.
- Return normal Froth errors.
  If something fails, return `FROTH_OK` on success or `froth_throw(...)` / a normal Froth error on failure. Do not invent a parallel error-reporting channel.
- Be careful with strings.
  `froth_pop_bstring` gives you resolved string bytes plus length. `froth_push_bstring` creates a Froth string from raw bytes. That is the correct path for C-facing textual data.
- Use `froth_pop_tagged` only when the binding genuinely accepts multiple Froth kinds.
  Most bindings should stay typed and simple.
- Do not treat board bindings like a general plugin system.
  Today they are part of firmware construction. That means ownership, naming, and error behavior should be conservative and predictable.
- Assume the binding may be inspected with `see` / metadata-aware tooling later.
  The stack effect and help text are not filler. Write them so they are actually useful.

## What not to do

The failure modes are pretty predictable:

- Do not put half a subsystem into one huge binding.
  That throws away the main advantage of Froth, which is live composition above a small substrate.
- Do not bypass Froth stack discipline just because you are in C.
  If the word shape is unclear on the stack, it will be unclear to users too.
- Do not use C because the Froth version is merely a little awkward.
  Use C when the operation is timing-sensitive, SDK-bound, or too close to hardware. Otherwise, keep it in Froth.
- Do not assume project-local FFI is ready just because `[ffi]` exists in the manifest.
  Right now that section is schema direction, not the full workflow.

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
- treating custom C as just another file in the interactive editor loop

So if your question is "can I write a small custom C function for something like an audio inner loop," the answer is yes. The missing part is the clean per-project path.

## What the next useful improvement probably is

The next meaningful FFI improvement is not a new macro. It is the project-level path:

- manifest-driven project C sources
- include directories and defines passed through cleanly
- a clear ownership boundary between board FFI and project FFI

The schema is already visible in `froth.toml`. The missing part is the wiring from that manifest section into `froth build`.

## How to think about the split

The right split is usually:

- C for timing-critical code, SDK glue, and awkward hardware edges
- Froth for composition, live tuning, control flow, deployment logic, and everything you expect to keep reshaping

That keeps the slow loop small and the fast loop large.

As the project system grows, the likely next improvement is manifest-driven project FFI so custom C can live next to ordinary project code. The schema shape is already visible. The wiring is the missing part.

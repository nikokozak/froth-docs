---
title: "FFI and C Integration"
weight: 12
advanced: true
description: "When to cross the Froth/C boundary, and where to find the implementation contract."
---

Most Froth code should stay in Froth.

The reasons are structural:

- the live feedback loop is better in Froth
- composition and reshaping are easier in Froth
- the board session stays editable without a rebuild

Some work still belongs in C:

- a call into a vendor SDK
- a narrow hardware or protocol edge
- a small primitive where the useful part is already C

That boundary is the FFI layer.

## The two ownership layers

Froth has two ways to add C-backed words:

1. **board FFI**
   Words that belong to a board package or platform surface.
2. **project FFI**
   Words that belong to one project and are declared in `froth.toml`.

Use board FFI when the word should exist for every project on that board.

Use project FFI when the word is application-owned and should travel with the project.

## How to read the docs

The FFI story is split into two reference pages:

- [How FFI Works](/reference/ffi/how-it-works/) explains the runtime model, the registration tables, the helper macros, and the stack discipline.
- [Project FFI](/reference/ffi/project-ffi/) explains the `[ffi]` manifest surface, the CLI validation rules, the generated CMake fragment, and the boot-time registration path.

Those pages use examples taken directly from the Froth source tree.

## The rule of thumb

Keep the C edge narrow.

Good FFI code usually looks like this:

- one sharp primitive in C
- honest stack effect metadata
- a small help string
- Froth code above it that handles composition and policy

For example, a board or project binding might provide `fast.twice`, `limit`, or `sensor.raw`, and ordinary Froth words would turn that into the program you actually reshape at the REPL.

## What FFI is not

FFI is not the live-edit path.

`froth send` evaluates Froth source. It does not rebuild C or reload binary extensions. If you change project FFI code:

1. edit the C source
2. run `froth build`
3. flash or run the built target

That is the tradeoff. Keep the binary boundary thin so most of the work still happens in Froth.

## Where to start

If you want to understand the implementation, start with [How FFI Works](/reference/ffi/how-it-works/).

If you want to add C code to a project immediately, start with [Project FFI](/reference/ffi/project-ffi/).

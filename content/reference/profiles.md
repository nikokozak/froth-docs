---
title: "Capabilities Reference"
weight: 4
---

This page maps the capability surface in Froth.

The public surface breaks down into three layers:

1. the always-available core language and stdlib
2. language features built into ordinary `:` definitions, such as named inputs
3. build-time capabilities selected through `froth.toml` and CMake, such as snapshots, live transport, and project FFI

## Core language

These are part of the normal language surface:

- slots and coherent redefinition
- quotations and `call`
- `perm` and the standard stack words built on top of it
- arithmetic, comparison, bitwise, strings, control flow, and error handling
- the REPL-oriented introspection words such as `see`, `words`, and `info`

The standard library in `src/lib/core.froth` is also loaded automatically. Words such as `dup`, `swap`, `if`, `dip`, `keep`, `bi`, `times`, `try`, `negate`, `abs`, `cells`, `cell+`, and `+!` are ordinary Froth definitions, not hidden VM magic.

## Named Inputs

Named stack inputs are part of plain `:` definitions.

When a definition includes input names in its stack effect comment, those names become readable aliases for the values that were on the stack at word entry:

```froth
: sumsq ( x y -- n )
  x x * y y * + ;
```

Important rules:

- the names are read-only aliases for entry values, not mutable locals
- binding order matches `perm`: the last input name is TOS, the first is deepest
- names do not capture into nested quotations
- effect-unknown operations such as dynamic `call`, `catch`, or raw user-authored `perm` are still better written in explicit stack style

Use named inputs for straight-line words where reusing the same inputs makes the formula clearer than a sequence of shuffles.

## Binding Intent

Froth distinguishes between raw rebinding and intent-specific rebinding.

**`def`** is the raw primitive:

- stack effect: `( slot value -- )`
- accepts any tagged Froth value
- clears arity metadata on successful rebind

Use `def` when you genuinely want the low-level escape hatch.

For clearer code, prefer the intent-specific binders:

- `value`
- `to`
- `assign`
- `set`

All four have the same behavior:

- stack effect: `( value slot -- )`
- require a non-quotation value
- stamp the slot with `(0 -- 1)` metadata

That makes them the right surface for constants, configuration, handles, and other slot-backed data:

```froth
34 'sensor-pin value
2000 'alert-threshold value
1000 'alert-threshold to
```

For callable rebinding, use `is`:

- stack effect: `( quote slot -- )`
- requires a quotation
- clears arity metadata

```froth
[ 1 + ] 'hook is
```

## CellSpace

Froth has a built-in mutable cell memory region, usually referred to as CellSpace.

Use it when you need:

- counters
- arrays
- framebuffers
- lookup tables
- mutable aggregate state

CellSpace vocabulary:

- `create ( slot -- )`
- `allot ( n -- )`
- `variable ( slot -- )`
- `@ ( addr -- value )`
- `! ( value addr -- )`
- `cells ( n -- n )`
- `cell+ ( addr -- addr' )`
- `+! ( delta addr -- )`

Key properties:

- CellSpace stores full tagged Froth cells, not raw bytes
- addresses are cell indexes carried as numbers
- `allot`, `create`, and `variable` are top-level defining words
- newly allotted cells are zero-initialized
- `@` and `!` are bounds-checked

Example:

```froth
'counter variable
0 counter !
1 counter +!
counter @
```

## Build-Time Capabilities

Some capabilities are selected at build time.

### `froth.toml`

The project manifest is the normal way to describe project-level expectations:

- `[target]` selects board and platform
- `[build]` carries sizing/build overrides such as `cell_size`, `heap_size`, `slot_table_size`, `line_buffer_size`, `tbuf_size`, `tdesc_max`, and `ffi_max_tables`
- `[ffi]` declares project-local C bindings with `sources`, `includes`, and `defines`
- `[dependencies]` gives names to reusable Froth source files for `#use`

### CMake

At the kernel level, the build surface is a set of CMake options. The main ones for application authors are:

- `FROTH_CELL_SIZE_BITS`
- `FROTH_HEAP_SIZE`
- `FROTH_SLOT_TABLE_SIZE`
- `FROTH_DATA_SPACE_SIZE`
- `FROTH_LINE_BUFFER_SIZE`
- `FROTH_TBUF_SIZE`
- `FROTH_TDESC_MAX`
- `FROTH_FFI_MAX_TABLES`
- `FROTH_HAS_SNAPSHOTS`
- `FROTH_HAS_LIVE`

See the [Build Options](/reference/build-options/) page for variables and manifest keys.

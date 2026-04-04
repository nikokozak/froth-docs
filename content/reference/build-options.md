---
title: "Build Options Reference"
weight: 7
---

This page describes the build surface in the Froth repo.

For normal project work, prefer `froth.toml`. For kernel, board, or tooling work, the underlying CMake variables are still the authoritative layer.

## The Two Configuration Surfaces

### Project manifests

Inside a Froth project, `froth build` and `froth flash` read `froth.toml`.

The important sections are:

- `[target]` for board and platform
- `[build]` for VM sizing and related compile-time limits
- `[ffi]` for project-local C bindings
- `[dependencies]` for named Froth source includes

### Direct CMake

When you are building the kernel directly, or when you want to understand what the CLI is passing through, the underlying CMake cache variables are the real source of truth.

Example:

```sh
cmake -DFROTH_BOARD=posix -DFROTH_PLATFORM=posix -DFROTH_DATA_SPACE_SIZE=512 ..
make
```

## `froth.toml` Build Keys

The Go CLI maps the `[build]` section to CMake variables.

```toml
[build]
cell_size = 32
heap_size = 8192
slot_table_size = 256
line_buffer_size = 2048
tbuf_size = 2048
tdesc_max = 64
ffi_max_tables = 12
```

| Manifest key | CMake variable | Meaning |
|---|---|---|
| `cell_size` | `FROTH_CELL_SIZE_BITS` | Cell width in bits: `8`, `16`, `32`, or `64`. |
| `heap_size` | `FROTH_HEAP_SIZE` | Heap size in bytes. |
| `slot_table_size` | `FROTH_SLOT_TABLE_SIZE` | Maximum number of slots. |
| `line_buffer_size` | `FROTH_LINE_BUFFER_SIZE` | REPL input buffer size in bytes. |
| `tbuf_size` | `FROTH_TBUF_SIZE` | Transient string scratch-ring size in bytes. |
| `tdesc_max` | `FROTH_TDESC_MAX` | Maximum concurrent transient string descriptors. |
| `ffi_max_tables` | `FROTH_FFI_MAX_TABLES` | Maximum number of registered FFI tables. |

The CLI does not expose top-level flags such as `--cell-size` or `--heap-size`. Manifest builds are the supported project-level way to set these values.

## `froth.toml` FFI Keys

Project-local FFI is part of the normal build path.

```toml
[ffi]
sources = ["src/ffi/bindings.c"]
includes = ["src/ffi"]
defines = { SENSOR_SCALE = "42" }
```

| Key | Meaning |
|---|---|
| `sources` | Project-local `.c` files compiled into the firmware. |
| `includes` | Include directories added to the compiler search path. |
| `defines` | Extra preprocessor defines passed to the project FFI build. |

Validation rules:

- `sources` must exist, must be `.c` files, and must remain under the project root
- `includes` must exist, must be directories, and must remain under the project root
- define keys must be valid C identifiers
- define values cannot contain newlines, quotes, or semicolons

For the full build and boot pipeline, see [Project FFI](/reference/ffi/project-ffi/).

## Board And Platform Selection

At the kernel/CMake layer, the build still starts with a board and a platform.

### `FROTH_BOARD`

| Property | Value |
|---|---|
| Type | string |
| Default | `posix` |

Built-in boards in the repo:

- `posix`
- `esp32-devkit-v1`

The build also looks for board library source under:

- `boards/<board>/ffi.c`
- `boards/<board>/lib/board.froth`
- `boards/<board>/board.json` for generated pin constants when present

### `FROTH_PLATFORM`

| Property | Value |
|---|---|
| Type | string |
| Default | `posix` |

Built-in platforms in the repo:

- `posix`
- `esp-idf`

In manifest-driven builds, `[target]` is the normal surface:

```toml
[target]
board = "esp32-devkit-v1"
platform = "esp-idf"
```

## VM Size And Capacity Variables

These are the runtime sizing knobs defined in `CMakeLists.txt`.

### `FROTH_CELL_SIZE_BITS`

Cell width in bits. Supported values: `8`, `16`, `32`, `64`.

A Froth cell is the native unit for:

- numbers
- slot references
- quotation references
- CellSpace contents

Most builds target `32` bits.

### `FROTH_DS_CAPACITY`

Data stack capacity in cells. Default: `256`.

### `FROTH_RS_CAPACITY`

Return stack capacity in cells. Default: `256`.

### `FROTH_CS_CAPACITY`

Control stack capacity in cells. Default: `256`.

This is internal VM control/executor storage, not user CellSpace.

### `FROTH_HEAP_SIZE`

Heap size in bytes. Default: `4096`.

The heap holds:

- quotation bodies
- string storage
- patterns
- other heap-allocated objects

### `FROTH_SLOT_TABLE_SIZE`

Maximum slot count. Default: `128`.

Slots back:

- word definitions
- slot-backed data such as `value`
- CellSpace addresses bound by `create` and `variable`

### `FROTH_DATA_SPACE_SIZE`

CellSpace capacity in cells. Default: `256`.

This is the mutable tagged-cell storage used by:

- `create`
- `allot`
- `variable`
- `@`
- `!`
- `+!`

If you expect arrays, framebuffers, or many mutable cells, this is the setting to increase.

### `FROTH_LINE_BUFFER_SIZE`

REPL input buffer size in bytes. Default: `1024`.

### `FROTH_MAX_PERM_SIZE`

Maximum supported `perm` window size. Default: `16`.

This is still a real implementation limit for generated and user-authored `perm` patterns.

### `FROTH_STRING_MAX_LEN`

Maximum string length in bytes. Default: `256`.

### `FROTH_TBUF_SIZE`

Transient string buffer size in bytes. Default: `1024`.

### `FROTH_TDESC_MAX`

Maximum concurrent transient string descriptors. Default: `32`.

### `FROTH_FFI_MAX_TABLES`

Maximum number of registered FFI tables. Default: `8`.

This matters if you combine:

- kernel primitives
- board FFI
- snapshot primitives
- project FFI
- additional future tables

## Feature Toggles

### `FROTH_HAS_SNAPSHOTS`

Enables `save`, `restore`, and `wipe`, plus snapshot boot restore.

When enabled, Froth persists:

- overlay slot bindings
- reachable heap objects
- the allocated CellSpace prefix

### `FROTH_HAS_LIVE`

Enables the live transport used by the daemon, CLI, and editor tooling.

When disabled, the binary falls back to the plain REPL path instead of the exclusive live-session transport.

### `FROTH_USER_PROGRAM`

Path to a `.froth` source file embedded into the firmware image as the base program.

Manifest-driven builds generate this automatically from the resolved project entry.

### `FROTH_PROJECT_FFI_CONFIG`

Path to the generated CMake fragment that describes resolved project FFI sources, include paths, and defines.

In normal project builds, the CLI generates this under:

```text
.froth-build/project_ffi.cmake
```

## Snapshot Storage Variables

These are advanced target-level settings, mainly relevant when porting Froth or tuning persistence:

- `FROTH_SNAPSHOT_BLOCK_SIZE`
- `FROTH_SNAPSHOT_PATH_A`
- `FROTH_SNAPSHOT_PATH_B`

## Practical Defaults

If you are starting a normal project:

- leave cell size at `32`
- leave the slot table at `128` until you actually need more
- raise heap size before raising anything else if you are defining many words or strings
- raise `FROTH_DATA_SPACE_SIZE` when you start using CellSpace seriously
- use `[ffi]` only for the narrow C boundary you actually need

For the command-level build behavior, see [CLI Reference](/reference/cli/).

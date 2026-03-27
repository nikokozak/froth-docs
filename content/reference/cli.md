---
title: "CLI Reference"
weight: 3
---

This reference is based on the current Go CLI implementation in `tools/cli/` in the main Froth repo.

The repo-local build currently produces a binary named `froth-cli` (`cd tools/cli && make build`). The usage strings in the code say `froth`. In practice:

- use `froth` if you have installed or renamed the binary that way
- use `tools/cli/froth-cli` if you are running it directly from the repo

Examples below use `froth` for readability.

## Global flags

These flags are parsed before command dispatch:

| Flag | Meaning |
|------|---------|
| `--port <path>` | Serial port override. Used by serial/device commands and daemon startup. |
| `--target <name>` | Target/board name. Used by `new` and legacy `build` / `flash` flows. |
| `--serial` | For `info`, `send`, and `reset`: force direct serial instead of daemon routing. |
| `--daemon` | For `info`, `send`, and `reset`: require daemon routing instead of falling back to serial. |
| `--clean` | For `build`: remove the build directory before building. |

Notably, the current CLI does **not** implement the old docs' `--baud`, `--json`, or `--verbose` global flags.

---

## new

**Syntax:**

```sh
froth [--target <name>] new <project-dir>
```

Creates a new Froth project skeleton:

- `froth.toml`
- `src/main.froth`
- `lib/.gitkeep`
- `.gitignore`

Default target is `posix`. If `--target` is set to anything other than `posix`, the scaffold infers platform `esp-idf`.

**Example:**

```sh
froth new hello-froth
froth --target esp32-devkit-v1 new blink-demo
```

---

## info

**Syntax:**

```sh
froth [--port <path>] [--serial|--daemon] info
```

Shows device information:

- Froth version
- board name
- cell size
- max payload
- heap usage
- slot count

Behavior:

- default: try daemon first, then fall back to direct serial
- `--daemon`: require daemon routing
- `--serial`: skip daemon and connect directly

**Example:**

```sh
froth info
froth --serial --port /dev/ttyUSB0 info
froth --daemon info
```

---

## connect

**Syntax:**

```sh
froth [--port <path>] connect
froth connect --local
```

Starts an interactive REPL session.

### Default mode

`froth connect` talks to the background daemon and gives you a live REPL prompt. If the daemon is not running, the CLI attempts to start it automatically in the background first.

Behavior worth knowing:

- blank lines are ignored
- `\ quit` exits the session cleanly
- `Ctrl+C` at the prompt just re-prompts
- `Ctrl+C` during a running eval sends an interrupt through a fresh daemon connection

### Local mode

`froth connect --local` builds or reuses a local POSIX Froth runtime under `$FROTH_HOME/local-build/` and then `exec`s into it.

Constraints:

- `--local` cannot be combined with `--port`
- local mode requires `cmake` and `make`

**Example:**

```sh
froth connect
froth --port /dev/ttyUSB0 connect
froth connect --local
```

---

## send

**Syntax:**

```sh
froth [--port <path>] [--serial|--daemon] send
froth [--port <path>] [--serial|--daemon] send <file>
froth [--port <path>] [--serial|--daemon] send "<source>"
```

Sends Froth source for evaluation.

The current implementation supports three modes:

1. `send` with no argument:
   uses `froth.toml`, resolves the project entry and dependencies, and sends the merged source
2. `send <file>`:
   resolves that file in project context if a nearby `froth.toml` exists; otherwise resolves the file bare
3. `send "<source>"`:
   sends the string directly as raw source

Important current behavior:

- project/file sends reset the device before evaluation
- the CLI appends an autorun invocation tail:
  `[ 'autorun call ] catch drop drop`
- default routing is daemon first, then serial fallback
- `--daemon` requires daemon routing
- `--serial` forces direct serial

The current CLI does **not** implement `send --expr`, `--no-wait`, or `--timeout`.

**Example:**

```sh
froth send
froth send src/main.froth
froth send "1 2 +"
froth --serial --port /dev/ttyUSB0 send "5 dup +"
```

---

## reset

**Syntax:**

```sh
froth [--port <path>] [--serial|--daemon] reset
```

Resets the target to the stdlib baseline and prints:

- reset status
- heap usage
- slot count

Routing behavior matches `info` and `send`:

- default: daemon first, then serial fallback
- `--daemon`: daemon only
- `--serial`: serial only

The current CLI does **not** implement `reset --safe` or `reset --hard`.

**Example:**

```sh
froth reset
froth --daemon reset
froth --serial --port /dev/ttyUSB0 reset
```

---

## build

**Syntax:**

```sh
froth [--clean] build
froth [--target <name>] [--clean] build
```

Build behavior depends on context.

### Manifest-driven build

If run inside a Froth project with `froth.toml`, `build`:

1. resolves includes and dependencies
2. writes merged source to `.froth-build/resolved.froth`
3. builds based on `[target]`

Current platforms:

- `posix`: builds into `.froth-build/firmware/Froth`
- `esp-idf`: stages into `.froth-build/esp-idf/` and runs `idf.py build`

### Legacy build

If no `froth.toml` is found but the current directory is inside the kernel repo, `build` falls back to the legacy kernel build:

- default / `--target posix`: builds `build64/Froth`
- `--target esp-idf`: builds `targets/esp-idf/`

`--clean` deletes `.froth-build/` (manifest mode) or `build64/` (legacy POSIX mode) before building.

The current CLI does **not** implement `--board`, `--config`, `--release`, `--cell-size`, `--heap-size`, `--no-snapshots`, `--no-link`, or arbitrary `-D` forwarding as top-level CLI flags. Manifest builds do pass CMake args from `froth.toml`.

**Example:**

```sh
froth build
froth --clean build
froth --target esp-idf build
```

---

## flash

**Syntax:**

```sh
froth [--port <path>] flash
froth [--target <name>] [--port <path>] flash
```

Like `build`, `flash` has manifest and legacy modes.

### Manifest mode

Inside a Froth project, `flash` first runs the manifest build.

- `posix`: no flash step; prints the built binary path
- `esp-idf`: auto-detects a `/dev/...` serial port if possible, then runs `idf.py flash -p <port>`

### Legacy mode

Inside the kernel repo without a project manifest:

- default / `--target posix`: no flash step; prints `build64/Froth`
- `--target esp-idf`: flashes `targets/esp-idf/`

The current CLI does **not** implement `--firmware`, `--verify`, or `--erase`.

**Example:**

```sh
froth flash
froth --port /dev/ttyUSB0 flash
froth --target esp-idf flash
```

---

## daemon

**Syntax:**

```sh
froth daemon start [--background] [--local] [--local-runtime <path>]
froth daemon stop [--pid <n>]
froth daemon status
```

Manages the background daemon used by the CLI and VSCode tooling.

### `daemon start`

Starts the daemon in serial mode by default. With `--background`, prints the child PID once ready.

Optional flags:

- `--background`: detach and run in background
- `--local`: run the daemon against a local runtime instead of a serial device
- `--local-runtime <path>`: explicit runtime path; requires `--local`

Constraints:

- `--local` cannot be combined with `--port`
- `--local-runtime` requires `--local`

### `daemon stop`

Stops the running daemon. `--pid` is a guard: if the daemon PID has changed, stop is skipped instead of killing the wrong process.

### `daemon status`

Prints:

- daemon running/not running
- PID
- daemon version / API version
- target
- current device or reconnecting state
- port if known

The current CLI does **not** implement `daemon restart` or `--socket`.

**Example:**

```sh
froth daemon start --background
froth --port /dev/ttyUSB0 daemon start --background
froth daemon start --background --local
froth daemon status
froth daemon stop
```

---

## doctor

**Syntax:**

```sh
froth [--port <path>] doctor
```

Checks the local environment and, if possible, the current project and connected device.

Current checks include:

- Go runtime version
- `cmake` on `PATH`
- `make` on `PATH`
- detected USB serial ports
- ESP-IDF export script under `$FROTH_HOME/sdk/esp-idf/export.sh`
- project manifest, entry file, dependencies, and board directory
- device reachability and device info

`doctor` prints remediation hints inline when something is missing.

The current CLI does **not** implement JSON output.

**Example:**

```sh
froth doctor
froth --port /dev/ttyUSB0 doctor
```

---

## Current mismatches from the old docs

The previous reference page was out of date in a few important ways:

- it documented unsupported global flags such as `--baud`, `--json`, and `--verbose`
- it documented unsupported command flags such as `send --expr`, `reset --safe`, and `flash --firmware`
- it omitted real commands such as `new` and `info`
- it described the build/flash flow as generic board wrappers, while the implementation is now primarily manifest-driven with `.froth-build/`

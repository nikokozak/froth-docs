---
title: "CLI Reference"
weight: 3
---

The Froth CLI (`froth`) manages board connections, firmware builds, code deployment, and the background daemon that bridges the VSCode extension to connected hardware.

**Installation:** Distributed as a single binary. Once on `PATH`, all subcommands are available from any directory.

**Global flags** (accepted by all subcommands):

| Flag | Description |
|------|-------------|
| `--port <path>` | Serial port to use. Overrides auto-detection. |
| `--baud <rate>` | Baud rate. Default: 115200. |
| `--verbose` | Print debug-level output. |
| `--json` | Emit structured JSON output (useful for tooling integration). |

---

## connect

**Syntax:**
```
froth connect [--port <path>] [--baud <rate>]
```

Opens an interactive REPL session to a connected board over serial. Input typed in the terminal is sent to the board; output from the board is printed to the terminal.

The session continues until the user sends EOF (`Ctrl+D`) or interrupts (`Ctrl+C` twice). A single `Ctrl+C` sends an interrupt signal to the running board program if the board supports it.

Auto-detects the serial port when `--port` is omitted, scanning known USB-serial vendor IDs (CP2102, CH340, FTDI). If multiple boards are connected, reports the ambiguity and requires `--port`.

**Flags:**

| Flag | Description |
|------|-------------|
| `--port <path>` | Serial port (e.g., `/dev/ttyUSB0`, `COM3`). |
| `--baud <rate>` | Baud rate override. Default: 115200. |
| `--no-echo` | Suppress local echo. Use when the board echoes input itself. |
| `--raw` | Pass bytes without line buffering. For binary protocol use. |

**Example:**
```sh
froth connect
froth connect --port /dev/ttyUSB0
froth connect --port COM3 --baud 9600
```

---

## build

**Syntax:**
```
froth build [--board <name>] [--config <path>] [OPTIONS]
```

Compiles the Froth runtime firmware for a target board. Produces a binary suitable for flashing.

The build system uses CMake internally. The `froth build` command is a convenience wrapper; advanced users can invoke CMake directly. See the build-options reference for the full list of CMake variables.

Output files are placed in `build/<board>/` by default.

**Flags:**

| Flag | Description |
|------|-------------|
| `--board <name>` | Target board identifier (e.g., `esp32-devkit`, `rp2040`). Default: `posix`. |
| `--config <path>` | Path to a CMake cache file or override configuration. |
| `--clean` | Delete the build directory before building. |
| `--release` | Build with optimization. Default is debug. |
| `--cell-size <bits>` | Cell size in bits: 8, 16, 32, or 64. Default: 32. |
| `--heap-size <bytes>` | Heap size. Default: 4096. |
| `--no-snapshots` | Build without snapshot support (`FROTH_HAS_SNAPSHOTS=OFF`). |
| `--no-link` | Build without link layer support (`FROTH_HAS_LINK=OFF`). |
| `-D <VAR>=<VAL>` | Pass arbitrary CMake variable. Repeatable. |

**Example:**
```sh
froth build --board esp32-devkit
froth build --board rp2040 --release --heap-size 8192
froth build --board posix --cell-size 64
froth build -D FROTH_SLOT_TABLE_SIZE=256
```

---

## flash

**Syntax:**
```
froth flash [--port <path>] [--board <name>] [--firmware <path>]
```

Writes a compiled firmware binary to a connected board over USB. Automatically invokes the board's flashing tool (esptool for ESP32, picotool for RP2040, etc.).

If `--firmware` is not specified, flashes the most recently built binary in `build/<board>/`.

The board must be in bootloader mode. The CLI attempts to trigger bootloader mode automatically by toggling the RTS/DTR lines. If the board does not respond, hold the BOOT button before running `flash` (and release after the upload begins).

**Flags:**

| Flag | Description |
|------|-------------|
| `--port <path>` | Serial port to the board in bootloader mode. |
| `--board <name>` | Board type, used to select the flashing tool. |
| `--firmware <path>` | Path to the binary to flash. |
| `--verify` | Read back and verify after writing. Slower but confirms integrity. |
| `--erase` | Erase flash before writing. Clears all saved snapshots. |

**Example:**
```sh
froth flash
froth flash --port /dev/ttyUSB0 --board esp32-devkit
froth flash --firmware build/esp32-devkit/froth.bin --verify
```

---

## send

**Syntax:**
```
froth send <file> [--port <path>]
froth send --expr <expression> [--port <path>]
```

Sends Froth source code to a connected board for immediate compilation and execution. Does not require a full firmware flash. Used for loading word definitions into a running session.

`send <file>` reads a `.froth` source file line by line and sends each line to the board's REPL input channel. The board compiles and executes each line as it arrives.

`send --expr` sends a single expression string.

The command waits for the board to acknowledge each line before sending the next. If the board returns an error, `send` stops and reports the failing line.

**Flags:**

| Flag | Description |
|------|-------------|
| `--port <path>` | Serial port. |
| `--expr <string>` | Send a single expression instead of a file. |
| `--no-wait` | Do not wait for acknowledgment between lines. Faster but suppresses error detection mid-file. |
| `--timeout <ms>` | Per-line acknowledgment timeout. Default: 5000ms. |

**Example:**
```sh
froth send myprogram.froth
froth send --expr ": blink 500 ms ;"
froth send myprogram.froth --port /dev/ttyUSB0
```

---

## reset

**Syntax:**
```
froth reset [--port <path>] [--safe]
```

Resets a connected board. By default, performs a normal reset: the board reboots, restores the saved snapshot (if any), runs `autorun`, and starts the REPL.

`--safe` holds the BOOT signal high during reset, triggering safe boot: the snapshot restore and `autorun` hook are skipped. The board starts with only the stdlib and board library. Use this to recover from a broken `autorun` without physical access to the board.

**Flags:**

| Flag | Description |
|------|-------------|
| `--port <path>` | Serial port. |
| `--safe` | Trigger safe boot (skip snapshot and autorun). |
| `--hard` | Assert the hardware reset pin rather than sending a soft-reset command. |

**Example:**
```sh
froth reset
froth reset --safe
froth reset --port /dev/ttyUSB0 --hard
```

---

## daemon

**Syntax:**
```
froth daemon [start|stop|status|restart] [--port <path>]
```

Manages the Froth daemon process. The daemon runs in the background and provides the serial connection that the VSCode extension uses. It exposes a local socket interface that the extension connects to; this allows the extension to send code, read output, and manage snapshots without holding the serial port exclusively.

When the daemon is running, `froth connect` connects through the daemon rather than directly, so both a terminal REPL session and the VSCode extension can be active simultaneously.

**Subcommands:**

| Subcommand | Description |
|------------|-------------|
| `start` | Start the daemon. Auto-detects a connected board if `--port` is not given. |
| `stop` | Stop the daemon. Releases the serial port. |
| `status` | Print current daemon state: running, port, uptime, connected clients. |
| `restart` | Stop then start. |

**Flags:**

| Flag | Description |
|------|-------------|
| `--port <path>` | Serial port to manage. |
| `--socket <path>` | Unix socket path (POSIX) or named pipe (Windows). Default: `~/.froth/daemon.sock`. |

**Example:**
```sh
froth daemon start
froth daemon start --port /dev/ttyUSB0
froth daemon status
froth daemon stop
```

The VSCode extension starts and stops the daemon automatically when a board is connected or disconnected. Manual daemon management is useful for CI pipelines and terminal-only workflows.

---

## doctor

**Syntax:**
```
froth doctor [--port <path>]
```

Diagnostic tool. Checks the local environment and (optionally) a connected board for common problems.

**Checks performed:**

- CLI binary version and available update notice.
- Serial port permissions (checks that the user is in the `dialout` or `uucp` group on Linux).
- Available USB-serial devices: lists detected ports and their vendor/product IDs.
- Board communication test (if `--port` is provided or a board is auto-detected): sends a probe command and verifies the response matches a known Froth firmware signature.
- Firmware version on connected board vs. latest available build.
- Daemon status.

**Flags:**

| Flag | Description |
|------|-------------|
| `--port <path>` | Serial port to test. |
| `--json` | Output results as JSON for integration with IDE diagnostics. |

**Example:**
```sh
froth doctor
froth doctor --port /dev/ttyUSB0
froth doctor --json
```

Exit code is 0 if all checks pass, 1 if any check fails.

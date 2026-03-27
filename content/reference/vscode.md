---
title: "VSCode Extension Reference"
weight: 4
---

The Froth VSCode extension is a thin front end over the Froth CLI and daemon. It gives you editor syntax support, device and local-target connection commands, send commands, a small device sidebar, and a live console.

**Extension ID:** `froth.froth`

## Installation

The extension manifest identifies the extension as `froth.froth`.

If you have a packaged `.vsix`, install it with:

```sh
code --install-extension froth-0.0.2.vsix
```

The extension activates on VSCode startup, not only when you open a `.froth` file.

## What It Provides

- Froth language registration for `.froth` files
- TextMate syntax highlighting for Froth source
- Commands for connecting to a serial device or a local POSIX target
- Send-selection and send-file workflows
- Status bar state for the active target
- A small sidebar with live target info
- A console pane showing target output and command results

## CLI Requirement

The extension depends on the Froth CLI.

By default it looks for `froth` on `PATH`. If it cannot find it, commands fail with a prompt telling you to install `froth` or set `froth.cliPath`.

## Commands

These are the commands actually contributed by the current extension:

| Command Palette entry | What it does |
|---|---|
| `Froth: Connect Device` | Starts or reuses a daemon in serial mode and refreshes target info. |
| `Froth: Try Local POSIX` | Starts or reuses a daemon in local mode and connects to the POSIX runtime. |
| `Froth: Run Doctor` | Opens a terminal and runs `froth doctor`. |
| `Froth: Send Selection / Line` | Sends the current selection, or the current line if nothing is selected. |
| `Froth: Send File (Reset + Eval)` | Saves the active file if needed, then runs `froth --daemon send <file>`. |
| `Froth: Interrupt` | Sends an interrupt to the active target. |
| `Froth: Reset to Baseline` | Resets the active target. |
| `Froth: Save Snapshot` | Evaluates `save` on the active target. |
| `Froth: Wipe Snapshots` | Evaluates `wipe` on the active target. |
| `Froth: Refresh Device Info` | Refreshes daemon status and the sidebar view. |

Notably absent from the current extension:

- no `Select Port` command
- no `Restore Snapshot` command
- no `Safe Reset` command
- no explicit `Start Daemon` or `Stop Daemon` command

## Connecting to a Target

### Serial Device

Use **Froth: Connect Device**.

The extension ensures a Froth daemon is running in serial mode, connects through the daemon socket, and then requests target info. If the daemon is running but no board is attached, VSCode shows a warning that no device is connected.

There is no manual port picker in the current extension UI. Port selection and discovery are handled by the CLI and daemon layer.

### Local POSIX

Use **Froth: Try Local POSIX**.

This runs the daemon in local mode and connects the extension to a local POSIX Froth runtime instead of physical hardware.

If `froth.localRuntimePath` is set, the daemon is started with that runtime path. Otherwise the CLI decides what local runtime to use.

## Sending Code

### Send Selection / Line

**Shortcut:** `Cmd+Enter` on macOS, `Ctrl+Enter` on Windows and Linux

If text is selected, the extension sends exactly that selection. If nothing is selected, it sends the current line.

The command goes through the daemon's `eval` RPC, not through a line-by-line file transfer. The extension logs a short preview to the console first, then prints the resulting stack representation or error.

### Send File

**Shortcut:** `Cmd+Shift+Enter` on macOS, `Ctrl+Shift+Enter` on Windows and Linux

Send File works differently from Send Selection:

- the active document must be a real file on disk
- if the file is dirty, the extension saves it first
- the extension then runs `froth --daemon send <file>`
- CLI stdout and stderr are streamed into the Froth console with a `[froth-cli]` prefix

If the CLI exits non-zero, the extension shows an error telling you to inspect the console.

## Console and Input

The output channel is named **Froth Console**.

It shows:

- target console output
- previews of evaluated snippets, prefixed with `>`
- stack results or errors after `eval`
- daemon connection events such as connect, disconnect, and reconnect
- CLI output from Send File, prefixed with `[froth-cli]`

If the target requests input, the extension opens a VSCode input box. It accepts raw text and escapes like `\n`, `\r`, `\t`, `\\`, and `\x41`. Cancelling the prompt sends an interrupt.

## Sidebar

The Froth activity-bar view currently exposes a single **Device** tree view.

When connected, it shows these fields:

- `Target`
- `Board`
- `Port`
- `Heap`
- `Slots`
- `Cell Bits`

The title bar for that view exposes commands for:

- connect device
- try local
- interrupt
- refresh device info
- reset to baseline
- save snapshot
- wipe snapshots
- run doctor

The sidebar does not currently provide:

- a disconnect button
- a restore button
- a live word list
- a definition browser
- a dedicated snapshot history panel

## Status Bar

The extension uses a Froth status item plus a separate interrupt item when the target is running.

These are the actual status texts used by the current code:

| Status bar text | Meaning |
|---|---|
| `Froth: Idle` | Nothing connected yet. |
| `Froth: Running` | A program is running on the current target. |
| `Froth: Local POSIX` | Connected to the local POSIX target. |
| `Froth: <board name>` | Connected to a serial device. |
| `Froth: Reconnecting` | The daemon is trying to reconnect. |
| `Froth: Local Offline` | Local mode is selected but unavailable. |
| `Froth: No Device` | The daemon is running but no serial device is connected. |
| `Froth: No Daemon` | No daemon is reachable. |

When the target is running, a second status item appears with **Interrupt**.

## Daemon Behavior

The extension manages the daemon for you.

- It uses the daemon socket at `~/.froth/daemon.sock`
- serial mode is used for hardware targets
- local mode is used for Try Local POSIX
- the extension starts the daemon with `froth daemon start --background`
- in local mode it adds `--local` and, if configured, `--local-runtime <path>`

There is no user-facing setting in the extension for overriding the daemon socket path.

## Settings

The current extension contributes only two settings:

| Setting | Type | Default | Description |
|---|---|---|---|
| `froth.cliPath` | string | `""` | Absolute path to the Froth CLI binary. |
| `froth.localRuntimePath` | string | `""` | Absolute path to the local POSIX Froth runtime used by Try Local. |

If `froth.cliPath` is empty, the implementation currently searches only for `froth` on `PATH`.

## Doctor

**Froth: Run Doctor** opens a terminal named **Froth Doctor** and runs:

```sh
froth doctor
```

Use this first when the extension cannot find the CLI, cannot start the daemon, or cannot connect to a board.

## Current Limits

If you are comparing this page with older drafts, the current extension is simpler than those drafts suggested.

In particular, the shipped implementation does not currently include:

- manual serial port selection
- restore snapshot support
- safe reset support
- daemon start/stop palette commands
- extra connection settings such as baud rate, socket path, timeout, or output-panel behavior toggles
- a richer device sidebar with word browsing or snapshot metadata

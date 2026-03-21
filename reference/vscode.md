# VSCode Extension Reference

The Froth VSCode extension integrates the Froth development workflow into the editor: connecting to boards, sending code, managing snapshots, and maintaining the daemon that bridges serial communication.

**Extension ID:** `froth-lang.froth` (install from the VSCode Marketplace or from the `.vsix` package in the Froth release archive).

---

## Installation

1. Open VSCode.
2. Open the Extensions panel (`Cmd+Shift+X` / `Ctrl+Shift+X`).
3. Search for `froth-lang.froth`.
4. Click **Install**.

Alternatively, install from a `.vsix` file:
```sh
code --install-extension froth-lang-x.y.z.vsix
```

The extension activates automatically when a `.froth` file is opened or when a Froth-capable device is detected on a USB serial port.

---

## Connecting to a Device

When a supported board is connected over USB, the extension detects it within a few seconds and shows the device name in the status bar (bottom-left, e.g., `Froth: ESP32 DevKit — /dev/ttyUSB0`).

**Auto-connection:** The extension starts the daemon (`froth daemon start`) automatically and connects through it. No manual port selection is required when only one board is connected.

**Manual port selection:** If multiple boards are connected, or if auto-detection fails:
1. Open the Command Palette (`Cmd+Shift+P` / `Ctrl+Shift+P`).
2. Run **Froth: Select Port**.
3. Choose from the list of detected serial devices.

**Connection status indicators:**

| Status bar text | Meaning |
|-----------------|---------|
| `Froth: Disconnected` | No board detected or daemon not running. |
| `Froth: Connecting…` | Daemon starting or waiting for board handshake. |
| `Froth: ESP32 DevKit` | Board connected and ready. |
| `Froth: Error` | Connection failed; click for details. |

---

## Try Local Mode

Try Local mode runs a POSIX Froth binary on the development machine. No physical board is required. Code execution is local; GPIO and hardware words are no-ops.

**Activate Try Local mode:**
1. Open the Command Palette.
2. Run **Froth: Try Local**.

The status bar changes to `Froth: Local`. All send, snapshot, and REPL commands work exactly as on hardware, with the exception that hardware-specific words produce no physical effect.

**Use cases:**
- Learning the language without hardware.
- Testing word definitions before deploying.
- CI pipelines that need to verify Froth logic.

Try Local mode requires the `froth` CLI binary to be on `PATH`. If it is not found, the extension prompts to install it.

---

## Sending Code

### Send Selection

**Shortcut:** `Cmd+Enter` (macOS) / `Ctrl+Enter` (Windows/Linux)

Sends the current text selection to the connected board. If no text is selected, sends the current line.

The selected text is transmitted to the board's REPL input exactly as written. The board compiles and executes it. Output appears in the **Froth Output** panel.

Typical use: define a word at the cursor, press `Cmd+Enter`, test it immediately.

### Send File

**Shortcut:** `Cmd+Shift+Enter` (macOS) / `Ctrl+Shift+Enter` (Windows/Linux)
**Also via:** Command Palette → **Froth: Send File**

Sends the entire active `.froth` file to the board. The file is sent line by line; the extension waits for acknowledgment from the board after each line before sending the next.

If the board returns an error, the send stops, the failing line is highlighted in the editor, and the error message appears in the **Froth Output** panel.

### Output Panel

The **Froth Output** panel (`View → Output → Froth`) shows:
- All output from the board (printed values, error messages, REPL prompts).
- Transmission log: each line sent and the board's acknowledgment or error response.
- Extension status messages (daemon start/stop, connection events).

---

## Device Sidebar

The **Froth** sidebar panel (click the Froth icon in the Activity Bar) provides:

### Connected Device

Displays the board name, port, firmware version, and connection status. A **Disconnect** button and a **Safe Reset** button are available here.

### Snapshot Panel

Shows the current snapshot state:
- **Last saved:** timestamp of the most recent `save`.
- **Snapshot size:** bytes written to flash.
- **Actions:** Save, Restore, Wipe buttons that send the corresponding words to the board.

### Word List

A live list of all words defined in the current session. Updated after each successful `send`. Clicking a word name opens a hover card showing the word's stack-effect comment and definition (equivalent to `see wordname` at the REPL).

### Board Info

Displays the output of `info` from the board: heap usage, slot count, stack depth, cell size, enabled profiles. Refreshed on demand via a **Refresh** button.

---

## Snapshot Commands

All snapshot commands are available from:
- The Froth sidebar (Snapshot Panel).
- The Command Palette (`Cmd+Shift+P`).
- Right-clicking in an open `.froth` file.

| Command | What it does |
|---------|-------------|
| **Froth: Save Snapshot** | Sends `save` to the board. Writes current heap and slot table to flash. |
| **Froth: Restore Snapshot** | Sends `restore`. Reloads the board's session from flash. |
| **Froth: Wipe Snapshots** | Sends `wipe`. Clears all saved snapshots; next boot starts clean. |

---

## Keyboard Shortcuts

| Shortcut (macOS) | Shortcut (Windows/Linux) | Action |
|-------------------|--------------------------|--------|
| `Cmd+Enter` | `Ctrl+Enter` | Send selection (or current line) to board. |
| `Cmd+Shift+Enter` | `Ctrl+Shift+Enter` | Send entire active file to board. |
| `Cmd+Shift+P` → **Froth: Save Snapshot** | `Ctrl+Shift+P` → **Froth: Save Snapshot** | Save snapshot. |
| `Cmd+Shift+P` → **Froth: Reset Board** | `Ctrl+Shift+P` → **Froth: Reset Board** | Soft-reset the board. |
| `Cmd+Shift+P` → **Froth: Safe Reset** | `Ctrl+Shift+P` → **Froth: Safe Reset** | Reset into safe boot (skips snapshot and autorun). |

Shortcuts can be remapped in **Preferences → Keyboard Shortcuts** (`Cmd+K Cmd+S`). Search for `froth` to see all Froth bindings.

---

## Daemon Lifecycle

The Froth daemon is a background process that holds the serial port and multiplexes access between the VSCode extension and terminal sessions.

**Automatic management:** The extension starts the daemon when a board is first detected and stops it when VSCode closes. No manual action is needed.

**Manual management:** Use the **Froth: Start Daemon** and **Froth: Stop Daemon** commands in the Command Palette, or use the CLI (`froth daemon start` / `froth daemon stop`).

**Terminal REPL alongside the extension:** When the daemon is running, `froth connect` in a terminal connects through the daemon's socket rather than directly to the serial port. Both the extension and the terminal session see the same board output and can send input concurrently.

**Daemon log:** Accessible at **View → Output → Froth Daemon**. Shows serial traffic, client connections, and error messages from the daemon process. Useful when diagnosing connection problems.

**Socket location:** `~/.froth/daemon.sock` (POSIX) or `\\.\pipe\froth-daemon` (Windows). The location can be overridden with `froth daemon start --socket <path>` and must match the setting in VSCode preferences (`froth.daemonSocket`).

---

## Settings

All settings are under the `froth` namespace in VSCode preferences.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `froth.port` | string | `""` | Serial port override. Empty = auto-detect. |
| `froth.baudRate` | number | `115200` | Baud rate for serial communication. |
| `froth.daemonSocket` | string | `""` | Custom daemon socket path. Empty = default. |
| `froth.sendTimeout` | number | `5000` | Per-line acknowledgment timeout (ms) for file send. |
| `froth.localBinary` | string | `"froth"` | Path to the Froth CLI binary for Try Local mode. |
| `froth.autoStartDaemon` | boolean | `true` | Start daemon automatically on board detection. |
| `froth.showOutputOnSend` | boolean | `true` | Bring the Froth Output panel to focus when sending code. |

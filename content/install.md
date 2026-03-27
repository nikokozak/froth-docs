---
title: "Install"
aliases:
  - /guide/00-installation/
---

You need two things: the Froth CLI and the VSCode extension. If you have an ESP32 board, you can work directly on hardware. If you do not, the CLI also supports a local POSIX target that runs Froth on your computer. Either way, the goal is the same: get to a `froth>` prompt quickly.

## What you need

**Software:**

- [VSCode](https://code.visualstudio.com)
- The Froth CLI
- The Froth VSCode extension

**Hardware path (optional):**

- An ESP32 DevKit with USB
- A USB cable that carries data, not just power

**Local path:**

- No hardware required

The local target is not a simulator. It is a real Froth session running on your machine, with the same core language and workflow. The difference is that GPIO and board peripherals are not present.

## Install the Froth CLI

**macOS**

```sh
brew install froth
```

**Linux**

Download the binary from the [releases page](https://github.com/froth-lang/froth/releases) and place it on your `PATH`.

**Windows**

Use WSL. Native Windows support is possible, but WSL is the smoother path today.

## Verify the CLI

```sh
froth --version
```

If you get a version string back, the CLI is installed.

## Install the VSCode extension

Open VSCode. Go to the Extensions sidebar (`Cmd+Shift+X` on macOS, `Ctrl+Shift+X` on Linux and Windows). Search for **Froth** and install the extension.

To verify it loaded, create a file with a `.froth` extension. VSCode should recognize it as Froth and enable syntax highlighting.

## Connect to a target

### Hardware path

Plug the board in over USB. Open the command palette and run:

- `Froth: Connect Device`

If the extension does not find the board, check that the cable carries data and that the board appears as a serial device:

- macOS: `ls /dev/tty.*`
- Linux: `ls /dev/ttyUSB*`
- Windows / WSL: check Device Manager on the Windows side

### Local path

Use either the extension or the CLI:

- VSCode: `Froth: Try Local POSIX`
- Terminal: `froth connect --local`

## You are done when you see this

```text
froth>
```

That prompt means the system is live.

From here, continue to [Getting Started](/guide/02-getting-started/).

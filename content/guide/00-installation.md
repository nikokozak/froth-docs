---
title: "Installation"
weight: 0
---

You need two things: the Froth CLI and the VSCode extension. If you have an ESP32 board, you can work directly on hardware. If you don't, the CLI includes a local POSIX target that runs Froth on your computer with identical semantics. Either way, you'll have a REPL prompt within a few minutes.

## What you need

**Software (both paths):**
- [VSCode](https://code.visualstudio.com)
- The Froth CLI
- The Froth VSCode extension

**Hardware path (optional):**
- An ESP32 DevKit with a USB port (the guide targets the 38-pin DevKit v1, but any ESP32 board works)
- A USB cable that carries data, not just power. Many cables that come bundled with phone chargers are charge-only. If your board doesn't show up as a serial device, the cable is the first thing to check.

**Local path:**
- No hardware required. The local target is a full Froth session, not a simulator. The only difference is that GPIO and hardware peripherals aren't available. For learning the language, it's the same experience.

## Install the Froth CLI

**macOS:**

```
$ brew install froth
```

**Linux:**

Download the binary from the [releases page](https://github.com/froth-lang/froth/releases) and place it on your PATH.

**Windows:**

Use WSL. Serial port access from native Windows is possible but WSL is the smoother path.

**Verify:**

```
$ froth --version
froth 0.x.y
```

If you see a version string, the CLI is installed.

## Install the VSCode extension

Open VSCode. Go to the Extensions sidebar (`Cmd+Shift+X` on macOS, `Ctrl+Shift+X` on Linux/Windows). Search for "Froth" and click Install.

To verify: create a new file with a `.froth` extension. The status bar at the bottom of VSCode should show "Froth" as the language mode. You'll also get syntax highlighting and inline stack effect hints, though those matter more in later chapters.

## Connect to your board (or start local)

**Hardware path:**

Plug the board in via USB. Open the command palette (`Cmd+Shift+P` / `Ctrl+Shift+P`) and run `Froth: Connect`. The extension will try to detect the serial port automatically.

If it doesn't find the board, look for the port manually:
- macOS: `ls /dev/tty.*` and look for `usbserial` or `SLAB_USBtoUART`
- Linux: `ls /dev/ttyUSB*`
- Windows (WSL): check Device Manager under Ports

**Local path:**

From the command palette, run `Froth: Connect (Local)`. Or, from any terminal:

```
$ froth repl
```

**You're done when you see:**

```
froth>
```

That's the REPL prompt. Everything from here on is the same whether you're on hardware or running locally.

[Next: What is Froth?](01-what-is-froth.md)

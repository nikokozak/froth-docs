---
title: "Install"
aliases:
  - /guide/00-installation/
---

Froth now has a public macOS install path through Homebrew.

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

### macOS: Homebrew

```sh
brew tap nikokozak/froth
brew install froth
```

This installs `froth` onto your `PATH`.

### Fallback: build from the repo

The repo-local path is:

```sh
git clone <your-froth-repo>
cd Froth/tools/cli
make build
```

That produces a binary named `froth-cli`.

You can either:

- put that binary on your `PATH` as `froth`
- keep it where it is and point the VSCode extension at it with `froth.cliPath`

The important detail for this codebase is that the repo-local build artifact is `tools/cli/froth-cli`.

## Verify the CLI

```sh
froth --version
```

If it prints a version string, the CLI is installed correctly.

If you are still using the repo-local binary directly, run:

```sh
tools/cli/froth-cli --version
```

## Install the VSCode extension

Open VSCode, go to Extensions, and install `froth.froth`.

If you have a packaged `.vsix`, install it with:

```sh
code --install-extension froth-<version>.vsix
```

For repo-local development, the extension source lives under `tools/vscode/`.

To verify the extension is active, create a file with a `.froth` extension. VSCode should recognize it as Froth and enable syntax highlighting.

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

If your repo-local binary is still named `froth-cli`, run it explicitly:

```sh
tools/cli/froth-cli connect --local
```

## You are done when you see this

```text
froth>
```

That prompt means the system is live.

From here, continue to [Getting Started](/guide/02-getting-started/).

---
title: "Install"
aliases:
  - /guide/00-installation/
---

Froth is still in development. Direct downloads and a simpler public install flow will be available soon.

This page is not the public installation guide for Froth.

It is a reference page for pre-alpha Froth developers: people working from the repository, testing the tooling early, or contributing to the language and board support.

The instructions below document the pre-alpha fallback path: build the CLI from the repo, point the editor at it, and connect to hardware or the local POSIX target.

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

### Status

Packaged downloads are not the main install path yet. They will be published once the tooling and distribution flow settle down.

Until then, this section exists only as a pre-alpha developer reference. End-user installation is not the intended path here.

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

If you already have a packaged CLI binary from an internal or pre-release distribution flow, that works too. The important detail for this codebase is that the repo-local build artifact is `tools/cli/froth-cli`.

## Verify the CLI

```sh
./froth-cli
```

If it prints usage information, the CLI built successfully.

## Install the VSCode extension

The extension is in the same stage as the CLI: a packaged download path is coming, but the repo-local path is the reliable fallback for pre-alpha developers.

If you have a packaged Froth extension from an internal or pre-release flow, install that in VSCode. For repo-local development, the extension source lives under `tools/vscode/`.

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

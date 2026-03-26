
_Get the tools on your machine and a REPL prompt on your screen._

---

## Outline and writing notes

This is pure setup — no teaching, no concepts. The reader should be able to follow this page mechanically and end up with a working Froth environment. Every step has a clear verification signal. If something goes wrong, link out to troubleshooting rather than expanding here. Five minutes, tops.

Tone: brisk and confident. The reader doesn't need to understand anything yet, just install things.

---

## Subsections

### 1. What you need

**Purpose:** Set expectations before the reader clicks anything. Be honest about what's optional.

**Hardware path (optional):**
- An ESP32 DevKit (any variant with a USB port works; the guide targets the 38-pin DevKit v1 but any ESP32 board is fine)
- A USB cable that actually carries data (call this out — many cables are charge-only; this trips up beginners constantly)
- Note: other supported targets should be listed here once the reference docs confirm them

**Software (required for both paths):**
- VSCode (link to code.visualstudio.com; state minimum version if there is one)
- The Froth CLI (`froth` command-line tool)
- The Froth VSCode extension

**Local / POSIX path:**
- No hardware required; the `froth` CLI includes a local POSIX target that runs on the host machine
- Make clear this is a fully real Froth session, not a simulator — the semantics are identical
- Acknowledge limitation: no GPIO, no hardware peripherals; perfect for learning the language

**Writer note:** Include a small "You'll know you're ready when..." checklist at the end of this subsection: VSCode open, terminal open, and either a board plugged in or confident you're taking the local path.

---

### 2. Installing the Froth CLI

**Purpose:** Get `froth` on their PATH.

**What to cover:**
- Where to get it: link to the official releases page / package manager instructions
- Installation methods to describe (in priority order based on platform):
  - macOS: Homebrew (`brew install froth`) if available; otherwise direct download
  - Linux: package manager or direct binary download
  - Windows: installer or WSL path (call out that WSL is the recommended path if serial port access is needed)
- Verification step: `froth --version` should print a version string

**Code example to include:**
```
$ froth --version
froth 0.x.y
```

**Writer note:** Keep this section short. Link out to a dedicated install troubleshooting page rather than covering edge cases here.

---

### 3. Installing the VSCode extension

**Purpose:** Get the editor integration running.

**What to cover:**
- Open VSCode, go to Extensions sidebar
- Search for "Froth" — describe what the listing looks like
- Click Install
- Reload if prompted

**Features to mention briefly (save details for later chapters):**
- Syntax highlighting for `.froth` files
- Inline stack effect hints as you type
- The integrated REPL panel

**Verification step:** Open a new file with a `.froth` extension; the status bar should show the Froth language mode.

---

### 4. Connecting to your board (or starting local)

**Purpose:** Establish the REPL connection, whichever path the reader is on.

**Hardware path:**
- Plug the board in via USB
- Open the VSCode command palette (`Cmd+Shift+P` / `Ctrl+Shift+P`) and run `Froth: Connect`
- If the extension doesn't auto-detect the port, explain how to find it:
  - macOS: `ls /dev/tty.*` and look for `usbserial` or `SLAB_USBtoUART`
  - Linux: `ls /dev/ttyUSB*`
  - Windows: Device Manager → Ports
- What a successful connection looks like: the REPL panel opens, a `froth>` prompt appears

**Local path:**
- From the command palette, run `Froth: Connect (Local)`
- Alternatively, from the terminal: `froth repl` starts a local REPL session
- The same `froth>` prompt appears; everything from here is identical between paths

**You're done when you see:**
```
froth>
```

---

## Navigation

[→ Next: What is Froth?](01-what-is-froth.md)

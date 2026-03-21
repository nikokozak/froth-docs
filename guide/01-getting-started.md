# Getting Started

_Install the tools, connect to hardware (or skip it), and have your first real conversation with Froth._

---

## Outline and writing notes

This chapter is the reader's first hands-on experience. It should feel like someone sitting next to them at a desk: patient, specific, and quick to celebrate the small wins. The goal is to get from "nothing installed" to "I can see numbers on the stack" in one session. Every step has a clear success signal so the reader knows they're on track.

Tone reminder: warm and direct. When instructions branch (hardware vs. local), present both paths cleanly rather than making the local-only reader feel like a second-class citizen.

---

## Subsections

### 1. What you need

**Purpose:** Set expectations before the reader clicks anything. Be honest about what's optional.

**Hardware path (optional):**
- An ESP32 DevKit (any variant with a USB port works; the guide targets the 38-pin DevKit v1 but any ESP32 board is fine)
- A USB cable that actually carries data (call this out—many cables are charge-only; this trips up beginners constantly)
- Note: other supported targets should be listed here once the reference docs confirm them

**Software (required for both paths):**
- VSCode (link to code.visualstudio.com; state minimum version if there is one)
- The Froth CLI (`froth` command-line tool)
- The Froth VSCode extension

**Local / POSIX path:**
- No hardware required; the `froth` CLI includes a local POSIX target that runs on the host machine
- Make clear this is a fully real Froth session, not a simulator—the semantics are identical
- Acknowledge limitation: no GPIO, no hardware peripherals; perfect for learning the language

**Writer note:** Include a small "You'll know you're ready when..." checklist at the end of this subsection: VSCode open, terminal open, and either a board plugged in or confident you're taking the local path.

---

### 2. Installing the Froth CLI

**Purpose:** Get `froth` on their PATH.

**What to cover:**
- Where to get it: link to the official releases page / package manager instructions (fill in actual URL when known; placeholder: `https://froth-lang.org/install` or the GitHub releases page)
- Installation methods to describe (in priority order based on platform):
  - macOS: Homebrew (`brew install froth`) if available; otherwise direct download
  - Linux: package manager or direct binary download
  - Windows: installer or WSL path (call out that WSL is the recommended path if serial port access is needed)
- Verification step: `froth --version` should print a version string

**Code example to include:**
Show the terminal after a successful install:
```
$ froth --version
froth 0.x.y
```
(Use a placeholder version; writer should fill in current version at publication time.)

**Writer note:** Keep this section short. Link out to a dedicated install troubleshooting page rather than covering edge cases here. The reader should not spend more than five minutes on this step.

---

### 3. Installing the VSCode extension

**Purpose:** Get the editor integration running so the reader has a good experience from day one.

**What to cover:**
- Open VSCode, go to Extensions sidebar
- Search for "Froth" — describe what the listing looks like (publisher name, icon color/style if known)
- Click Install
- Reload if prompted

**Features to mention briefly (save details for later chapters):**
- Syntax highlighting for `.froth` files
- Inline stack effect hints as you type (this becomes important in chapter 02)
- The integrated REPL panel (used throughout the guide)

**Verification step:** Open a new file with a `.froth` extension; the status bar should show the Froth language mode.

**Writer note:** One or two screenshots here would carry significant weight. Describe placement: the install button, the status bar indicator. If the guide uses screenshots, this is a good place for them.

---

### 4. Connecting to your board (or "Try Local")

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

**Code example to describe:**
The REPL prompt immediately after connecting — just the prompt, nothing yet:
```
froth>
```

**Writer note:** If the connection fails, give two concrete next steps: check the cable, check the port. Link to a troubleshooting doc rather than expanding here. The chapter should keep momentum.

---

### 5. Your first session

**Purpose:** The payoff. Get numbers on the stack, use `.s`, feel the feedback loop.

This is the heart of the chapter. Write it as a guided walkthrough, one line at a time, explaining what happens after each entry. Don't rush it. The reader should finish this section feeling like they understand what the stack is (at a high level), even though chapter 02 goes deeper.

**Walkthrough sequence to write:**

Step 1 — Push a number. Type `42` and press Enter.
```
froth> 42
Stack: [42]
```
Explain: the number went onto the stack. The stack now has one item.

Step 2 — Push another number.
```
froth> 7
Stack: [42, 7]
```
The stack grows. `7` is now on top.

Step 3 — Use `.s` to explicitly inspect the stack without consuming it.
```
froth> .s
[42, 7]
```
Explain: `.s` is "print stack." It shows you what's there without removing anything. This is your best friend for understanding what's happening.

Step 4 — Print and consume the top value with `.` (dot).
```
froth> .
7
Stack: [42]
```
Explain: `.` (dot, pronounced "print") takes the top value off the stack and displays it. The stack now has one item again.

Step 5 — See the available words.
```
froth> words
... (a list of all defined words appears) ...
```
Explain: `words` lists every word that exists in the current session. As you define new words in later chapters, they'll show up here.

**Writer note:** The display format for the stack (`Stack: [42, 7]` etc.) should match whatever the actual REPL outputs. Verify this before publication and update the examples. The goal is zero discrepancy between what the reader sees and what the guide shows.

---

### 6. What just happened

**Purpose:** Bridge back to chapter 00's mental model. Reinforce the "stack is the connective tissue" idea with the concrete things they just typed.

**What to cover:**
- Remind them: every number they typed went onto the stack. Words take values off the stack and may put new ones back. This is the whole model.
- Point forward: chapter 02 goes deep on the stack. Chapter 03 shows how to define their own words. For now, the important thing is that the feedback loop is real — they typed something, the chip (or their computer) responded immediately.
- Acknowledge the feeling: the REPL feels strange at first. That strangeness fades within a few sessions.

**Writer note:** Keep this short — two to four paragraphs. It should feel like a breath, not a lecture. The reader is ready to keep moving.

---

## Key concepts introduced in this chapter

- The REPL and the feedback loop (type → execute → see result)
- The stack as a container for values (numbers pushed, numbers consumed)
- `.s` — inspect the stack without consuming it
- `.` — print and consume the top value
- `words` — list all defined words in the session
- Hardware path vs. local POSIX path

---

## Code examples (full list, for reference when writing)

1. `froth --version` output — confirms CLI installation
2. The bare `froth>` prompt — confirms connection
3. Pushing `42`, then `7`, with stack display after each
4. `.s` showing `[42, 7]`
5. `.` consuming top and printing `7`, stack now `[42]`
6. `words` output (abbreviated; show enough to be real without being overwhelming)

---

## Connections to other chapters

- **Chapter 00 (What is Froth?):** This chapter makes chapter 00's abstract descriptions concrete. Reference the "stack is the connective tissue" framing from chapter 00 when explaining what happened after the reader pushed numbers.
- **Chapter 02 (The Stack):** Everything introduced here is treated casually; chapter 02 goes deep. The writer should feel free to say "we'll explain this fully in the next chapter" when the reader might want more detail.

---

## Navigation

[← Previous: What is Froth?](00-what-is-froth.md) | [→ Next: The Stack](02-the-stack.md)

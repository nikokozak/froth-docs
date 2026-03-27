---
title: "What Makes Froth Different"
weight: 0
---

Froth is not a Forth dialect. It inherits Forth's ideas about interactive hardware programming, postfix notation, and the stack, but its core semantics and tooling story are different enough that code written for one will not run on the other. This page is for readers who want a precise account of what Froth is trying to do, why it exists, and where it parts company with both traditional embedded workflows and the newer crop of interactive microcontroller environments.

---

## Why not C or C++?

The standard embedded workflow still revolves around edit, compile, link, flash, reset, and test. That works, and for some projects it is the right choice. But it is a slow loop, especially when you are still learning the shape of the hardware or tuning behavior by feel. Change one constant, rebuild firmware. Rename one helper, reflash the board. Break something low-level, and you are back in the debugger or on the serial console trying to work out whether the new binary even made it over.

Froth is built around a different loop. The board stays live. You connect to it, define a word, test it immediately, redefine it, and test its callers without rebuilding the whole image. That is not just "a REPL on a microcontroller." It depends on coherent redefinition, recoverable errors, and a runtime model that treats live development as normal rather than exceptional.

The point is not that C and C++ are bad languages. The point is that they optimize for a different style of work. Froth optimizes for exploratory development on real hardware, where the fastest way to understand the system is to talk to it directly and keep the session alive while you do.

---

## Why not CircuitPython or MicroLisp?

Interactive systems for microcontrollers already exist, and some of them are excellent. CircuitPython makes boards approachable. Lisp systems can make the machine feel unusually open and programmable. Froth is not pretending those ecosystems do nothing well.

What Froth is aiming for is different.

CircuitPython and similar environments usually bring along a fairly large runtime, a specific object model, and an ecosystem that is closely tied to the boards and support layers chosen by that project. Lightweight Lisps often make different tradeoffs again: they can be elegant and interactive, but they typically come with their own memory model, representation costs, and implementation assumptions.

Froth is trying to keep the live, incremental feel of those systems while staying much closer to the metal. The runtime is small. The operational model is explicit. The host tooling is designed so new boards can be added over time instead of the language being locked to one vendor stack or one family of devices.

If you want a batteries-included scripting environment, Froth may not be the point. If you want a live system that still feels like firmware work, that is exactly the point.

---

## Built to travel across boards

Froth is not meant to be trapped inside one board ecosystem.

The project system already revolves around a `froth.toml` manifest that selects a board and platform for a project. That matters because it keeps the language, the host tooling, and the board support story loosely coupled. Adding support for a new board should be a matter of adding the board package and platform plumbing, not inventing a new language fork.

This is one of the central bets in Froth: interactive embedded development should not require choosing between "portable but abstract" and "close to the metal but locked to one toolchain." The language is intended to sit in the middle. It should be small enough to embed, structured enough to tool, and open enough that support for other boards can be added as the system grows.

---

## `perm`: one primitive to replace them all

**What Forth does:** Forth ships a vocabulary of stack shuffle words. `dup` copies the top value. `swap` reverses the top two. `rot` rotates the top three. `over` copies the second value to the top. `nip`, `tuck`, `2dup`, `2swap`, `2drop` — each one encodes a specific rearrangement, and you have to memorize which name does which thing.

The problem is not that these words are hard to understand one by one. The problem is that the set is arbitrary. There is no principled reason why Forth has `over` but not a word that copies the third-from-top value. Every rearrangement outside the predefined set requires building it from those primitives by hand, stacking shuffle operations whose interaction is hard to track mentally.

**What Froth does:** `perm` takes a count and a pattern. The count says how many values to consume from the stack. The pattern, written as `p[labels]`, describes what to push back. Labels are single lowercase letters: `a` is the top value consumed, `b` is the one below it, `c` the one below that. Labels can appear any number of times, including zero, which drops the value.

Every classic Forth shuffle word is defined this way in `core.froth`:

```froth
: dup  ( a -- a a )      1 p[a a] perm ;
: swap ( a b -- b a )    2 p[a b] perm ;
: drop ( a -- )          1 p[] perm ;
: over ( a b -- a b a )  2 p[b a b] perm ;
```

These are ordinary Froth words. `dup` works because `1 p[a a] perm` consumes one value and pushes two copies of it. `drop` works because `1 p[] perm` consumes one value and pushes nothing. Any rearrangement you need, including ones Forth has no word for, is a pattern.

**Why this matters:** The practical benefit is a smaller vocabulary to learn. The deeper benefit is that stack rearrangement becomes regular enough for tools and the runtime to reason about. That is a recurring Froth theme: fewer special cases, more structure.

---

## Coherent redefinition via slots

**What Forth does:** Forth's dictionary is append-only. When you redefine a word, a new entry is appended. Words compiled before the redefinition still point to the old entry. Fix a low-level word, and higher-level callers may continue to use the broken version until you reload them too.

**What Froth does:** Every word is a slot. A slot is a stable handle rather than a direct code address. When you redefine a word, the slot is updated in place. Existing callers still refer to the slot, so they all see the new definition immediately.

```froth
: A ( -- n )   42 ;
: B ( -- n )   A 1 + ;
B .          \ prints 43
: A ( -- n )   100 ;
B .          \ prints 101
```

The second call to `B` prints 101. There is no reload step. The change propagates because `B` refers to `A` through its slot.

**Why this matters:** This is what makes the REPL a real development environment instead of a disposable toy. You can fix one word and test the rest of the system immediately.

---

## Structured error handling with `catch` and `throw`

**What Forth does:** Traditional Forth error handling tends to be terminal for the current context. An abort unwinds back to the interpreter, and on embedded systems it can leave the session in a bad enough state that you may as well reset and start over.

**What Froth does:** `throw` signals an error with a numeric code. `catch` runs a quotation under protection. If the quotation throws, `catch` restores the data stack to the state it had on entry and returns the error code. If the quotation completes normally, `catch` returns zero.

```froth
[ 1 0 /mod ] catch .   \ prints -10
[ 3 4 + ] catch .      \ prints 0
```

The REPL itself is wrapped in a top-level `catch`. A mistake at the prompt does not destroy the session. Your definitions remain in place, the stack is restored, and you keep going.

**Why this matters:** Recoverable errors are part of what makes exploratory development on hardware viable. You can probe the system aggressively without treating every mistake as a soft brick.

---

## Quotations as first-class values

**What Forth does:** Forth has execution tokens. They are useful, but they still feel like indirect references into compiled code.

**What Froth does:** A quotation is written as `[ ... ]`. When the interpreter sees one, it pushes it as a value. Nothing runs until something consumes it.

`call` executes a quotation. `choose` selects between two values based on a flag. Together they are enough to express conditional execution:

```froth
: if ( flag t f -- result )   choose call ;
```

This is not special syntax. It is an ordinary word defined in Froth itself. The same model scales to words like `dip`, `keep`, `bi`, and `times`.

**Why this matters:** Control flow stops being a bag of compiler directives and becomes part of the language's value model. That keeps the language smaller and more uniform.

---

## Profiles are a project-level direction, not a finished surface

Froth does have a profile story, but it should be understood as a direction for the project system rather than a settled, per-file feature mechanism.

The likely home for profiles is the project manifest, `froth.toml`, alongside board and platform selection. That is the level where profile choices make the most sense: they affect what gets built into a target, what capabilities a project expects, and what tradeoffs the firmware is making. The basic idea is the same as the earlier drafts on this site: keep the core language small, and make larger capabilities explicit rather than implicit. But the exact user-facing shape is not finished, and this page should not pretend otherwise.

What does look stable is the intent:

- a small core language and runtime
- optional capability layers instead of one monolithic build
- build-time clarity about what a project expects from the target

For the profile ideas currently in view, a more accurate status is:

| Profile idea | Status | Notes |
|---|---|---|
| `FROTH-Core` / `FROTH-Base` | Current design vocabulary | Useful as the baseline split between the core runtime and the standard words built on top of it. |
| `FROTH-Named` | In progress | An optional capability, but not something this site should present as a settled public surface yet. |
| `FROTH-Checked` | To do | Best understood as a future development-time checking mode. |
| `FROTH-Perf` | To do | A future optimization layer, likely target-sensitive. |
| Other profile ideas | Future / exploratory | Useful for design discussion, but not yet something to document as shipped fact. |

**Why this matters:** Froth wants the language core to stay small while still leaving room for richer builds. The right way to do that is probably through the project system, not by pretending a large matrix of profiles is already nailed down.

---

## Snapshot persistence

Interactive development on a microcontroller has a structural problem: RAM is volatile. Power-cycle the board, and the session is gone. Traditional embedded workflows solve this by treating the device as a compile-and-flash target. Froth takes a different approach.

A snapshot captures the current heap and slot table and writes them to flash. On boot, that state can be restored before you resume work.

The workflow:

```text
froth> : blink ( delay -- ) LED_BUILTIN 1 gpio.write dup ms LED_BUILTIN 0 gpio.write ms ;
froth> 500 blink
\ LED blinks once
froth> save
\ snapshot written to flash
```

Power cycle the board. The word `blink` is still there.

The `autorun` hook bridges the gap between development session and deployed device. Define a word named `autorun`, save a snapshot, and that word is called on later boots.

```froth
: autorun ( -- )
  LED_BUILTIN 1 gpio.mode
  [ true ] [ 500 blink ] while ;
save
```

**Why this matters:** The REPL stops being a scratch pad and starts becoming a path to deployment. The same live session where you developed the program can become the state the device boots into.

---

## Modern tooling without the usual embedded friction

Froth is designed to be tooled, not just typed.

**The CLI** already handles project creation, connection, build, flash, send, and diagnostics. A `froth.toml` project gives it enough structure to resolve includes, choose a board and platform, and stage a build without asking the user to wire the toolchain together by hand.

**The VSCode extension** already provides syntax highlighting, send-selection, send-file, local-target mode, status bar state, a small device sidebar, and a live console. It is intentionally thinner than a full language server today, but it already supports the core live-development loop.

**The daemon architecture** sits between the CLI or editor and the serial port. One process owns the connection, and the tools talk to that process. That avoids the usual embedded mess where the editor, flasher, monitor, and REPL all fight over the same device node.

**Why this matters:** Froth is not just trying to be an interesting language. It is trying to be a usable way to build firmware. The language design, the live session model, and the host tooling are meant to reinforce each other.

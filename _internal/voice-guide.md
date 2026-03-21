# Froth Voice Guide

This document governs all writing on the Froth website. Read it before drafting anything. Return to it before shipping anything.

---

## Voice Registers

### Homepage

First-person, opinionated, from the creator. Speaks with quiet confidence about why Froth exists and what it gets right. Irreverent when warranted, never performative. The voice here is someone who built something they believe in and wants to show it to you.

> I got tired of stack-shuffling gymnastics. `dup swap rot over` — they all do slight variations of the same thing, rearranging values on the stack. So I replaced them with one primitive: `perm`. You describe the pattern you want, and the runtime does the rest. The standard library defines `dup` as `1 p[a a] perm`, and `swap` as `2 p[a b] perm`. Every shuffle word in Froth is written in Froth.

### Guide

Second-person, patient, teacher-voice. Assumes the reader is smart but new to stack-based programming. Builds ideas across several sentences rather than compressing everything into one. Uses "you" naturally. Never talks down.

> When you type a word at the Froth REPL, it runs immediately on the microcontroller. If you define a word that blinks an LED, you'll see it blink the moment you press Enter. Redefine that word with a different delay, and the next call uses the new definition — no reflashing, no recompile. This is what working with Froth feels like: short feedback loops on real hardware.

### Reference

Neutral, precise, no pronouns. Every sentence earns its place. Definitions are consistent in structure. Code comes first; explanation follows.

> `perm` rearranges the top N values on the stack according to a pattern. The first argument specifies how many stack values to consume. The pattern `p[...]` describes the output layout using named slots. Example: `2 p[a b] perm` consumes two values and pushes them back in reverse order, equivalent to `swap`.

### Features Page

Between homepage and guide. Authoritative, making a case to someone who already programs. Can reference Forth directly and assume familiarity with language design tradeoffs.

> Traditional Forth has a redefinition problem. Define a word, use it in other words, then redefine it — the old callers still point to the old definition. Froth handles this differently. Redefinition is coherent: when you change a word, every reference to it updates. This matters most at the REPL, where you're iterating on running code and need changes to propagate without manually reloading your entire vocabulary.

---

## Anti-Pattern Quick Reference

### Structural habits to avoid

- Em-dash overuse — limit to 1-2 per long document; 5 per paragraph is a tell
- Short. Punchy. Fragments. For. Emphasis. (vary sentence rhythm instead)
- Colon-then-bullet-list as the default structure for everything
- Three-part parallel structure ("X, Y, and Z") as the go-to rhetorical move
- Reflexive overview opening ("In this chapter, we will cover X, Y, and Z")
- Symmetrical close (restating the opening sentence at the end)
- Reflexive hedging ("can be used to", "may", "it should be mentioned")

### Banned phrases

- "Let's dive in", "Let's explore", "Let's take a look"
- "Incredibly", "elegant", "robust", "seamless", "straightforward"
- "It's worth noting that...", "Interestingly enough..."
- "In other words..."
- "Now that we've covered X, let's move on to Y"
- "This is where X comes in" / "This is where X shines"
- "Under the hood"
- "At its core"
- "Think of it as..." (once or twice okay, not every concept)
- Any sentence restating what was just said in slightly different words
- "Powerful", "leverage", "utilize", "facilitate", "comprehensive"
- Conversational filler: "So,", "Basically,", "Essentially,", "Actually,", "Now,"

### Punctuation rules

- Exclamation marks: sparingly on homepage only (1-2 max). Never in guide or reference.
- Emoji: none, anywhere, ever.

---

## Before / After Rewrites

### 1. Explaining `perm`

**Before:**
Let's dive into one of Froth's most elegant features: the `perm` primitive. At its core, `perm` is a powerful abstraction that essentially replaces all of Forth's traditional stack-shuffling words. Think of it as a universal stack rearrangement tool. It's incredibly straightforward — you specify a pattern, and `perm` handles the rest seamlessly.

**After:**
Forth has a vocabulary problem. `dup`, `swap`, `drop`, `over`, `rot`, `nip`, `tuck` — each one rearranges the stack in a slightly different way, and you have to memorize them all. `perm` is a single operation that covers every case. You tell it how many values to consume and what order to produce. `1 p[a a] perm` duplicates the top value. `2 p[a b] perm` reverses the top two. The standard library defines every traditional shuffle word this way, in plain Froth.

*What changed: Stripped out filler ("Let's dive into", "at its core", "incredibly", "seamlessly") and replaced vague praise with a concrete explanation of the problem `perm` solves. Real code examples do the persuading.*

### 2. Describing the REPL

**Before:**
Froth features a robust interactive REPL that runs directly on your microcontroller. This is where the language truly shines — you can type commands and see results in real-time, making it incredibly easy to prototype and iterate. Essentially, you get the convenience of a scripting language with the power of bare-metal hardware access. Under the hood, the REPL maintains a persistent session that you can save to flash.

**After:**
The Froth REPL runs on the microcontroller itself. You type a word definition over serial, press Enter, and it compiles and runs on the hardware in front of you. If that word toggles a GPIO pin, you'll see the LED change. When you're happy with your session, `snapshot` writes everything to flash. Pull the power, plug it back in, and your words are still there.

*What changed: Removed "robust", "truly shines", "incredibly", "essentially", "under the hood." Replaced abstract claims about convenience with a specific sequence of actions and their visible results.*

### 3. Explaining coherent redefinition

**Before:**
One of the most powerful aspects of Froth is its approach to word redefinition. In other words, when you redefine a word in Froth, all existing references automatically update to use the new definition. This is in contrast to traditional Forth, where redefinition creates a new entry that doesn't affect previously compiled words. It's worth noting that this makes interactive development significantly more straightforward, as you can modify running code without having to manually reload your entire program.

**After:**
Redefine a word in standard Forth and you get a subtle bug: old callers still use the old definition. Froth fixes this. When you redefine a word, every reference to it points to the new version. At the REPL, this means you can change a helper function and immediately test the higher-level word that calls it. No reload step, no stale references.

*What changed: Cut "one of the most powerful aspects", "in other words", "it's worth noting", "straightforward." Started with the actual problem (Forth's stale-reference bug) instead of an abstract claim about Froth being powerful.*

### 4. Introducing error handling

**Before:**
Froth provides comprehensive error handling through its `catch` and `throw` mechanism. Essentially, this facilitates graceful error recovery, ensuring that the REPL stays alive even when things go wrong. Think of it as a safety net — you can experiment freely knowing that errors won't crash your session. This is especially important when working with microcontrollers, where a crash could mean losing your entire session.

**After:**
Errors on a microcontroller are expensive. A crash can mean power-cycling the board and losing your REPL session. Froth uses `catch` and `throw` to keep the REPL alive after errors. Wrap a risky operation in `catch`, and if it fails, execution returns to the REPL prompt instead of halting the system. Your session, your stack, your definitions — all still there.

*What changed: Removed "comprehensive", "facilitates", "essentially", "think of it as." Led with the real-world cost (losing a hardware session) instead of abstract praise for the mechanism.*

---

## Draft Checklist

Run this against every piece of writing before it ships.

1. **Read it aloud.** If any sentence sounds like it came from a product announcement or a ChatGPT response, rewrite it.
2. **Search for banned phrases.** Ctrl+F the anti-pattern list above. Every hit gets rewritten or cut.
3. **Count em-dashes.** More than two in a single page? Convert most of them to commas, periods, or parentheses.
4. **Check the opening.** Does it start with a reflexive overview ("In this guide, we will...") or a bland setup sentence? Cut to the first sentence that says something specific.
5. **Verify code accuracy.** Every Froth snippet must be valid. Stack comments must match actual behavior. If you aren't sure, test it.
6. **Confirm the register.** Is this homepage voice? Guide voice? Reference voice? Make sure the pronouns, tone, and sentence length match the register described above.
7. **Kill redundancy.** Look for any sentence that restates the previous one. Delete it or merge the two.

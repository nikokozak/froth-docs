# Froth

A programming language that turns your microcontroller into a conversation.

---

I built Froth because I wanted to talk to hardware the way you talk to a REPL: type something, see what happens, adjust, repeat. Most embedded development doesn't work that way. You write code on your laptop, compile it, flash it to the board, and hope for the best. If something's wrong, you change a line, recompile, reflash, and wait again. Froth skips all of that. It runs directly on the microcontroller, interprets your words as you type them, and gives you results in real time. The language descends from Forth, a 1970s system that got interactive hardware programming right before anyone else was thinking about it. Froth keeps what worked and fixes what didn't.

Here's what a session looks like:

```froth
: blink  2 1 gpio.write 200 ms 2 0 gpio.write 200 ms ;
blink blink blink
\ LED on pin 2 blinks three times, 200ms on, 200ms off

: blink  2 1 gpio.write 50 ms 2 0 gpio.write 50 ms ;
blink blink blink
\ Same word, faster timing — no recompile, no reflash
```

You defined a word called `blink`, ran it three times, and watched the LED on your board flash. Then you redefined `blink` with a shorter delay and ran it again. The new behavior took effect immediately. There was no build step. The hardware just did what you said.

## Interactive

You type a word, and the microcontroller runs it. Not a simulator, not an emulator: the actual chip on your desk. Define a word that drives a servo, and the servo moves the moment you press Enter. Redefine that word with a different angle, and the next call uses the new definition. Every change propagates. If word A calls word B and you redefine B, calling A gives you the updated behavior. This is what makes the REPL feel like a real conversation with the hardware instead of a monologue you hope it receives.

## Tiny and transparent

Froth has about 30 primitives. The standard library is 120 lines of Froth code, and it defines everything else: `dup`, `swap`, `drop`, `if`, `dip`, the control flow words, the basics you use every day. You can read the entire standard library in a few minutes and understand every line. There's no hidden layer between what you type and what runs. When something goes wrong, there aren't many places for the bug to hide.

## Yours to reshape

Most languages give you a fixed set of core operations and tell you to build on top. Froth gives you `perm`, a single primitive that rearranges values on the stack according to a pattern you describe. The standard library uses it to define the familiar words: `dup` is `1 p[a a] perm`, `swap` is `2 p[a b] perm`, `drop` is `1 p[] perm`. These aren't special forms baked into the runtime. They're regular Froth definitions, and you can change them or write your own. The language is a small set of building blocks. What you construct from them is up to you.

---

If any of this sounds interesting, [start with the guide](guide/00-what-is-froth.md). It walks through the language from first principles, assuming nothing about Forth or stack-based programming. If you'd rather skip the reading and get your hands on it, [install Froth and connect to a board](guide/01-getting-started.md).

Froth is for hobbyists, tinkerers, and anyone who wants to understand their hardware all the way down to the last byte.

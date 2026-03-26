---
title: "Froth"
---

A programming language that turns your microcontroller into a conversation.

```froth
: blink  2 1 gpio.write 200 ms 2 0 gpio.write 200 ms ;
blink blink blink
\ LED on pin 2 blinks three times

: blink  2 1 gpio.write 50 ms 2 0 gpio.write 50 ms ;
blink blink blink
\ Same word, faster — no recompile, no reflash
```

## Interactive

Type a word, the chip runs it. Redefine that word, and every caller sees the new version. No build step. No flash cycle. You and the hardware are in direct conversation.

## Tiny

~30 primitives. A 120-line standard library you can read in one sitting. Nothing is hidden.

## Yours to reshape

The standard library is written in Froth. `dup`, `swap`, `drop` — they're all regular definitions you can read, change, or replace. The language is a small set of building blocks. What you construct from them is up to you.

---

[Start the guide](/guide/01-what-is-froth/) — or [skip straight to installing](/guide/00-installation/).

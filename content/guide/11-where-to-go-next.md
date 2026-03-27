---
title: "Where to Go Next"
weight: 11
---

You have a working vocabulary, a board that runs your code at boot, and a REPL you can reconnect to at any time. The core guide is done.

If you want to keep going, the advanced section starts with [FFI and C Integration](/guide/12-ffi-and-c/). If you would rather branch out, here is where to find everything else.

## Reference

The [reference section](/reference/) is the companion to daily Froth use. It contains the complete word list with stack signatures, descriptions, and usage examples for every word. When you cannot remember whether it is `s.len` or `s.length`, the reference has the answer.

The reference also covers the [Froth CLI](/reference/cli/), the [VSCode extension](/reference/vscode/), and the [platform profiles](/reference/profiles/).

## Tutorials

The [tutorials](/tutorials/) are project-based and go deeper than the guide examples. Some starting points:

- [Build a Calculator](/tutorials/build-a-calculator/) builds an RPN calculator at the REPL. Good practice with stack manipulation and error handling, no hardware required.
- [Blink an LED](/tutorials/blink-an-led/) walks through GPIO output, timing, counted loops, and standalone deployment with `autorun`.
- [Read a Sensor](/tutorials/read-a-sensor/) reads analog input, converts ADC counts to millivolts, and adds a threshold alert.
- [Interactive Workflow](/tutorials/interactive-workflow/) walks through the full develop-save-deploy cycle, including recovery from mistakes at each stage.

## Features and design

The [features page](/what-makes-froth-different/) makes the technical case for Froth's design choices. If you are curious why `perm` replaces the traditional shuffle words, why redefinition is coherent, or how the error model compares to other Forths, that page addresses those questions directly. It assumes you can already program and speaks to the tradeoffs rather than teaching from scratch.

## Source code and contributing

Froth is open source. The repository contains the runtime, the standard library, and the board support packages. A few files worth reading:

- `core.froth` is the entire standard library. Every standard word is defined in plain Froth using a small set of primitives. It is readable and worth studying.
- `lib/board.froth` for your board is the hardware abstraction layer, mapping pin names and peripheral access to Froth words.

If you have found a bug, want to add a board target, or want to improve the documentation, see `CONTRIBUTING.md` in the repository for how to get started.

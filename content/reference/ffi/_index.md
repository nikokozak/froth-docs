---
title: "FFI"
weight: 3
description: "The Froth/C boundary, from runtime registration to project-local bindings."
---

This section documents the Froth/C boundary.

It covers two different questions:

- how a C binding becomes an ordinary Froth word
- how a project adds its own bindings through `froth.toml`

Use these pages in order:

- [How FFI Works](/reference/ffi/how-it-works/) for the runtime model and the authoring surface in C
- [Project FFI](/reference/ffi/project-ffi/) for the manifest-driven build path
- [Board FFI Example](/reference/ffi/board-ffi-example/) for an end-to-end example drawn from the ESP32 board surface
- [Project FFI Example](/reference/ffi/project-ffi-example/) for a complete project-local binding example

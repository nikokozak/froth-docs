---
title: "Timing"
weight: 4
description: "Board and platform timing words such as ms."
---

Timing words are part of the shared board/platform surface when they depend on a target implementation.

## Availability

| Property | Value |
|---|---|
| Surface | board/platform API |
| Boards in repo | `esp32-devkit-v1`, `posix` |
| Local POSIX target | yes |
| POSIX behavior | real host-side sleep |

## Words

**`ms`**  `( n -- )`

Blocks for `n` milliseconds.

```froth
500 ms
```

## Notes

- `ms` is target-facing rather than language-wide, so it lives here instead of in the main [Word Reference](/reference/words/).
- On ESP32, `ms` yields to the RTOS delay path.
- On POSIX, `ms` sleeps on the host so board-independent examples and tests can use the same word.

For workflow examples, see [Talking to Hardware](/guide/09-talking-to-hardware/) and [Blink an LED](/tutorials/blink-an-led/).

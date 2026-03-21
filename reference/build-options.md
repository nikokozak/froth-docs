# Build Options Reference

Froth firmware is built with CMake. Configuration variables control board target, cell size, stack capacities, heap size, and optional subsystems. Pass them with `-D` on the CMake command line or through the `froth build -D` shorthand.

```sh
cmake -DFROTH_BOARD=esp32-devkit -DFROTH_CELL_SIZE_BITS=32 ..
# or equivalently:
froth build --board esp32-devkit --cell-size 32
```

All variables have defaults; an unconfigured build targets the POSIX local runner with 32-bit cells and a 4 KB heap.

---

## FROTH_BOARD

| Property | Value |
|----------|-------|
| **Type** | String |
| **Default** | `posix` |
| **CMake variable** | `FROTH_BOARD` |
| **CLI flag** | `--board <name>` |

Selects the target board. The board name is matched against entries in the `boards/` directory of the Froth source tree. Each board entry provides a `board.json` (pin map and peripheral descriptors) and a `CMakeLists.txt` fragment that sets the toolchain, flash command, and linker script.

Built-in boards:

| Name | Description |
|------|-------------|
| `posix` | Local POSIX runner. No hardware required. GPIO is a no-op. |
| `esp32-devkit` | ESP32 DevKit v1 (38-pin). Xtensa LX6. Flashed with esptool. |
| `esp32-s3` | ESP32-S3. Xtensa LX7. |
| `rp2040` | Raspberry Pi RP2040. ARM Cortex-M0+. Flashed with picotool. |

Custom boards: create a directory under `boards/`, provide `board.json` and the CMake fragment, then set `FROTH_BOARD` to the directory name.

---

## FROTH_PLATFORM

| Property | Value |
|----------|-------|
| **Type** | String |
| **Default** | `posix` |
| **CMake variable** | `FROTH_PLATFORM` |

Selects the platform abstraction layer. The platform layer provides OS or RTOS primitives: memory allocation, serial I/O, timer access, and interrupt management.

Available platforms:

| Name | Description |
|------|-------------|
| `posix` | Standard POSIX (Linux, macOS). Uses `malloc`, `read`/`write` on `stdin`/`stdout`, `nanosleep`. |
| `esp-idf` | Espressif ESP-IDF. Used automatically when `FROTH_BOARD` is an ESP32 variant. |
| `pico-sdk` | Raspberry Pi Pico SDK. Used automatically when `FROTH_BOARD=rp2040`. |
| `bare-metal` | Minimal platform with no OS. Requires manual implementation of five platform hooks. |

In most cases, setting `FROTH_BOARD` selects the correct platform automatically. Override with `FROTH_PLATFORM` only when building a custom board that shares a platform with an existing one.

---

## FROTH_CELL_SIZE_BITS

| Property | Value |
|----------|-------|
| **Type** | Integer (enum) |
| **Default** | `32` |
| **Valid values** | `8`, `16`, `32`, `64` |
| **CMake variable** | `FROTH_CELL_SIZE_BITS` |
| **CLI flag** | `--cell-size <bits>` |

The size of a Froth cell in bits. A cell is the native stack unit: integers, addresses, and quotation handles all occupy one cell.

**8-bit cells:** For extremely constrained targets (AVR, small PIC). Maximum stack value is 255 (unsigned) or ±127 (signed). String and heap addresses are 8-bit; addressable heap is 256 bytes maximum. Rarely appropriate.

**16-bit cells:** For targets with 4–16 KB of RAM (e.g., ATmega, PIC16). Maximum integer value is 65535. Heap addresses are 16-bit; addressable space up to 64 KB. Common on hobbyist embedded targets.

**32-bit cells:** Default. Suitable for ESP32, RP2040, STM32, and most Cortex-M series. Balances range against memory footprint.

**64-bit cells:** For 64-bit POSIX targets or high-precision integer work. Doubles the stack frame size; not useful on typical microcontrollers.

Cell size affects the binary representation of all values, the stack frame layout, and the heap pointer width. All components (core, stdlib, board library, and user code) must be built with the same cell size.

---

## FROTH_DS_CAPACITY

| Property | Value |
|----------|-------|
| **Type** | Integer |
| **Default** | `256` |
| **CMake variable** | `FROTH_DS_CAPACITY` |

Number of cells reserved for the data stack. The data stack is a fixed-size array allocated at compile time; there is no dynamic growth. Stack overflow throws error -4.

Each cell occupies `FROTH_CELL_SIZE_BITS / 8` bytes. At the default (256 cells, 32-bit), the data stack occupies 1024 bytes.

**Reducing:** On targets with very limited RAM, reducing to 32 or 64 cells is reasonable. Most Froth programs keep fewer than 16 values on the stack at any time. Recursive or heavily nested programs may require more.

**Increasing:** Programs with deep quotation nesting or combinator chains may benefit from a larger stack. Increase in powers of two.

---

## FROTH_RS_CAPACITY

| Property | Value |
|----------|-------|
| **Type** | Integer |
| **Default** | `256` |
| **CMake variable** | `FROTH_RS_CAPACITY` |

Number of cells reserved for the return stack. The return stack stores return addresses for word calls and temporarily stashed values placed there by `>r`. Overflow throws error -4.

Sizing follows the same rules as `FROTH_DS_CAPACITY`. Return stack depth is bounded by call nesting depth, not by the number of data values in flight. A flat program (no recursion, no deeply nested `dip`/`keep` chains) rarely uses more than 32 return stack slots.

---

## FROTH_HEAP_SIZE

| Property | Value |
|----------|-------|
| **Type** | Integer (bytes) |
| **Default** | `4096` |
| **CMake variable** | `FROTH_HEAP_SIZE` |
| **CLI flag** | `--heap-size <bytes>` |

Total heap size in bytes. The heap stores:
- Quotation bodies (word definitions).
- String literals.
- Any other heap-allocated values.

The heap is a single contiguous region. Allocations are bump-pointer within regions; `release` frees everything back to the most recent `mark`. There is no garbage collector.

**Estimating required size:** A word definition with a 10-word body occupies roughly 40–80 bytes depending on cell size. A modest vocabulary of 50–100 custom words typically fits in 4–8 KB. If `info` shows heap usage consistently above 75%, increase this value.

**On ESP32:** The available DRAM for the Froth heap depends on what the board library and IDF allocate. The default 4 KB is conservative; 16–64 KB is typical on boards with 520 KB of DRAM.

---

## FROTH_SLOT_TABLE_SIZE

| Property | Value |
|----------|-------|
| **Type** | Integer |
| **Default** | `128` |
| **CMake variable** | `FROTH_SLOT_TABLE_SIZE` |

Maximum number of named word slots. Each slot is an entry in the dictionary mapping a name (interned string) to a value (typically a quotation). The slot table is a fixed-size array; attempting to define more words than this limit results in a "slot table full" error.

Each slot occupies approximately 8–16 bytes depending on cell size and name-storage strategy. At the default (128 slots, 32-bit), the slot table occupies roughly 1–2 KB.

The stdlib and board library together consume approximately 40–60 slots. A typical application with 30–50 custom words fits comfortably at 128. Larger vocabularies or heavily factored code may require 256 or more.

---

## FROTH_HAS_SNAPSHOTS

| Property | Value |
|----------|-------|
| **Type** | Boolean |
| **Default** | `ON` |
| **CMake variable** | `FROTH_HAS_SNAPSHOTS` |
| **CLI flag** | `--no-snapshots` (to disable) |

Controls whether snapshot support is compiled in. When `ON`, the `save`, `restore`, and `wipe` words are available and the boot sequence includes a snapshot restore step.

Snapshot storage is board-specific:
- **ESP32:** Uses NVS (Non-Volatile Storage) in flash. Two slots are maintained in an A/B rotation; a write interrupted by power loss does not corrupt the surviving slot.
- **RP2040:** Uses a region of flash above the firmware binary. Write strategy depends on the platform layer version; check the RP2040 board notes.
- **POSIX:** Writes to a file at `~/.froth/snapshot.bin`.

Set to `OFF` to reduce firmware size on targets where persistence is not needed (e.g., a device that always boots from a compiled-in vocabulary loaded by the board library).

---

## FROTH_HAS_LINK

| Property | Value |
|----------|-------|
| **Type** | Boolean |
| **Default** | `ON` |
| **CMake variable** | `FROTH_HAS_LINK` |
| **CLI flag** | `--no-link` (to disable) |

Controls whether the link layer is compiled in. The link layer is the protocol used by the Froth daemon and CLI to communicate with the board over serial: framing, acknowledgment, error signaling, and binary transfer for snapshot operations.

When `ON`:
- The board speaks the Froth link protocol on the serial port.
- `froth connect`, `froth send`, and `froth daemon` all function.
- The VSCode extension can connect and manage snapshots.

When `OFF`:
- The board outputs raw REPL text on the serial port with no framing.
- A plain terminal emulator can connect, but the CLI and VSCode extension cannot.
- Useful for targets where the link overhead (a few hundred bytes of code) is too large, or for boards connected to custom host software that implements its own protocol.

`FROTH_HAS_LINK=OFF` implies that `froth flash` and `froth send` cannot be used after deployment. The initial firmware must still be written by the host toolchain.

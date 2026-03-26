---
title: "Snapshot Format"
weight: 6
---

Technical reference for the Froth snapshot mechanism. Covers what a snapshot contains, how it is laid out on storage, the A/B rotation model, NVS storage on ESP32, and the boot restore sequence.

Intended audience: firmware engineers porting Froth to new hardware, developers writing tooling that reads or writes snapshots, and researchers studying Froth's persistence model.

---

## What a Snapshot Contains

A snapshot is a point-in-time image of the three persistent components of a Froth session:

### 1. Heap Image

The heap is a contiguous byte array allocated at firmware build time (`FROTH_HEAP_SIZE` bytes). Word definitions, string literals, and all other heap-allocated values live here. The heap image in a snapshot is a verbatim copy of the heap array from byte 0 to the current allocation pointer.

All pointers within the heap are heap-relative offsets, not absolute addresses. This makes the image relocatable: restoring onto a device where the heap begins at a different virtual address requires no pointer fixup, because no absolute addresses are stored.

The heap image does not include the region stack state. Regions (`mark` / `release`) are a runtime concept; their state is not captured. After restore, the region stack is initialized fresh (no active regions).

### 2. Slot Table

The slot table maps word names to values. Each entry contains:

- **Name:** An interned string, stored as a heap offset (the string literal lives in the heap image).
- **Value:** A tagged cell. The tag indicates whether the slot holds a quotation (most common), a raw integer, or another value type.
- **Flags:** Reserved; currently zero.

The slot table is serialized as a flat array of fixed-size entries. The serialized count precedes the array. Slots are written in definition order; the order is preserved across restore to maintain deterministic `words` output.

Slot count is bounded by `FROTH_SLOT_TABLE_SIZE`. The snapshot format allocates space for exactly this many entries. Unused entries are zero-filled.

### 3. Generation Counter

Froth's coherent redefinition model assigns a monotonically increasing generation number to each slot update. Callers hold a (name, generation) pair; on dispatch, the runtime confirms the generation matches the slot's current generation before calling. Mismatches are resolved by looking up the current definition.

The snapshot includes the current generation counter value. After restore, new `def` operations continue incrementing from this value, ensuring that generation numbers remain monotonically increasing across power cycles.

---

## What a Snapshot Does Not Contain

**Data stack:** Transient. Restored to empty.

**Return stack:** Transient. Restored to empty.

**Allocation pointer state beyond the heap high-water mark:** Only the bytes up to the current allocation boundary are written. The allocator state (free list, if any; bump pointer position) is reconstructed from the allocation boundary value included in the snapshot header.

**Hardware peripheral state:** GPIO modes, UART configuration, PWM channels — none of this is captured. The `autorun` hook is responsible for re-initializing hardware after a snapshot restore.

**In-flight computation state:** Snapshots are only meaningful when the Froth system is at a quiescent boundary (e.g., at the REPL prompt). A snapshot taken mid-computation captures a potentially inconsistent state. The `save` word is a REPL-level operation; it cannot be called inside a running computation.

---

## Snapshot Layout

All multi-byte integers are little-endian regardless of host architecture.

### Header (32 bytes)

```
Offset  Size  Field
0       4     Magic: 0x46524F54 ("FROT")
4       4     Format version: 0x00000001
8       4     Heap size (bytes written in heap image)
12      4     Slot count (entries written in slot table)
16      8     Generation counter (64-bit unsigned)
24      4     CRC-32 of header bytes 0–23
28      4     Reserved (zero)
```

Total header: 32 bytes.

### Heap Image

```
Offset  Size          Field
32      heap_size     Heap bytes, verbatim copy
```

Padded to a 4-byte boundary if `heap_size` is not a multiple of 4.

### Slot Table

Each slot entry is 16 bytes (32-bit cell configuration; 24 bytes for 64-bit):

```
Offset  Size  Field
0       4     Name: heap offset of the interned name string
4       4     Value: heap offset of the value (for quotations) or inline value
8       2     Tag: value type identifier
10      2     Flags: reserved
12      4     Generation: the generation number at last update
```

The slot table immediately follows the heap image (after padding).

### Footer (8 bytes)

```
Offset  Size  Field
0       4     CRC-32 of (header + heap image + slot table)
4       4     Magic: 0x544F5246 ("TROF", reversed)
```

The trailing magic and CRC allow detection of truncated writes: a snapshot missing its footer (e.g., interrupted mid-write) is treated as invalid.

---

## The Overlay Model

Froth uses an overlay rather than a flat replacement model for snapshot restore. On restore:

1. The runtime initializes a fresh heap and slot table (as at first boot).
2. The snapshot heap image is written over the runtime heap starting at offset 0.
3. The allocation pointer is set to the value recorded in the snapshot header.
4. Slot table entries from the snapshot are loaded. Each entry writes its name, value, flags, and generation into the corresponding slot.
5. The generation counter is set to the snapshot's recorded value.

The stdlib and board library are loaded before snapshot restore (steps 2–4 of the full boot sequence; see below). After overlay, user-defined words in the snapshot coexist with stdlib words. User words that shadow stdlib names take precedence; the slot lookup returns the most recently defined entry for a given name.

This design means the stdlib is always fresh (loaded from firmware). Changes to stdlib word behavior in a firmware update take effect on the next boot even for old snapshots, because stdlib words are loaded before the overlay is applied and can be overridden or shadowed by the snapshot.

---

## A/B Rotation

On flash storage, Froth maintains two snapshot slots: A and B. The purpose is write safety: if a write is interrupted by a power loss or reset, the other slot contains the last successfully written snapshot.

### Slot Selection

Each slot has a header field containing a sequence number (monotonically increasing, 32-bit). On write:
1. Read both slots' sequence numbers. The slot with the higher number is current.
2. Write the new snapshot to the other slot with `sequence_number + 1`.
3. After confirming a valid write (footer magic and CRC check), the new slot becomes current.

On read:
1. Read both slots.
2. For each slot, validate the footer (magic present, CRC matches). An invalid slot is treated as absent.
3. Of the valid slots, the one with the higher sequence number is the current snapshot.

If both slots are invalid (e.g., first boot after `wipe`, or after firmware flash with `--erase`), restore is skipped and the session starts with only the stdlib and board library.

### Slot Layout in NVS (ESP32)

On ESP32, Froth stores snapshots in the NVS (Non-Volatile Storage) partition. The NVS partition is a dedicated flash region, separate from the firmware binary. NVS handles its own wear leveling and write atomicity at the page level.

Froth uses the following NVS namespace and keys:

| NVS Namespace | NVS Key | Content |
|---------------|---------|---------|
| `froth` | `snap_a` | Snapshot slot A (binary blob) |
| `froth` | `snap_b` | Snapshot slot B (binary blob) |
| `froth` | `seq_a` | Sequence number for slot A (uint32) |
| `froth` | `seq_b` | Sequence number for slot B (uint32) |

NVS blob writes are atomic at the NVS page granularity. A Froth snapshot larger than one NVS page (4096 bytes by default) is written across multiple pages; NVS provides transactional semantics only within a single namespace commit. For snapshots larger than ~3800 bytes (the usable space per NVS page after metadata), Froth uses a multi-page write sequence with an explicit commit flag — refer to the ESP32-specific platform source (`platform/esp-idf/snapshot.c`) for the current implementation.

### Slot Layout on RP2040

The RP2040 does not have an NVS equivalent. Froth allocates two fixed regions of flash above the firmware binary. The regions are sized to `FROTH_HEAP_SIZE + sizeof(slot_table) + 64` (header + footer overhead), each aligned to the RP2040 flash sector size (4096 bytes).

The RP2040 platform layer (`platform/pico-sdk/snapshot.c`) performs sector-erase before each write, then programs in 256-byte pages. Erase-before-write means a partially completed write leaves the target sector erased; the incomplete slot will fail CRC validation and the previous slot will be used instead.

### Slot Layout on POSIX

Froth writes two files:
- `~/.froth/snapshot_a.bin`
- `~/.froth/snapshot_b.bin`

A write atomicity issue exists on POSIX: a process killed mid-write leaves a partially written file that will fail CRC validation. The previous file is not affected. On Linux and macOS, `fsync` is called after each write to ensure durability.

---

## Boot Restore Sequence

The full boot sequence, from power-on to REPL prompt:

**Step 1 — Kernel initialization**
The C runtime initializes. The Froth kernel allocates its stack arrays (`FROTH_DS_CAPACITY` and `FROTH_RS_CAPACITY` cells), the heap (`FROTH_HEAP_SIZE` bytes), and the slot table (`FROTH_SLOT_TABLE_SIZE` entries). All are zero-initialized.

**Step 2 — Core stdlib load**
`core.froth` is compiled and executed from firmware ROM. This defines `dup`, `swap`, `drop`, `over`, `rot`, `-rot`, `nip`, `tuck`, `if`, `when`, `dip`, `keep`, `bi`, `times`, `set`, `cr`, `negate`, `abs`, and other FROTH-Base words. Slot table entries are created; generation counter advances for each.

**Step 3 — Board library load**
`lib/board.froth` for the detected board is compiled and executed from firmware ROM. This defines pin constants (`LED_BUILTIN`, `BOOT_BUTTON`, etc.) and hardware interface words (`gpio.mode`, `gpio.write`, `gpio.read`, `ms`, `us`, `ledc.setup`, etc.).

**Step 4 — Snapshot restore (conditional)**
If `FROTH_HAS_SNAPSHOTS` is enabled:
1. Both NVS slots (or files, or flash regions) are read.
2. CRC validation is performed on each. Invalid slots are skipped.
3. The valid slot with the higher sequence number is selected.
4. If a valid snapshot exists and safe boot is not active (see below):
   - The heap image is overlaid starting at offset 0.
   - The allocation pointer is set to `snapshot.header.heap_size`.
   - Slot table entries from the snapshot are merged into the live slot table. Snapshot entries take precedence over stdlib entries for the same name.
   - The generation counter is set to `max(current_counter, snapshot.generation_counter)`.

**Step 5 — Safe boot check**
Before step 4 executes, the platform layer checks for a safe boot condition. On ESP32 and RP2040, this means reading the BOOT button GPIO immediately after step 1. If the button is held (the pin reads low), step 4 is skipped entirely. The device boots with only the stdlib and board library.

The safe boot window is the interval between step 1 and the end of step 2 (approximately 750ms on a typical ESP32 at 240MHz). The button must be held within this window.

**Step 6 — `autorun` hook**
After restore (or after steps 1–3 if restore was skipped), the slot table is checked for an entry named `autorun`. If found, the bound quotation is called. `autorun` runs before the REPL starts.

An uncaught throw from `autorun` propagates to the top-level handler. On hardware with FROTH-REPL, the REPL may still start after the error (the exact behavior is platform-dependent; verify against the specific firmware build).

**Step 7 — REPL start**
If FROTH-REPL is compiled in, the REPL prompt loop starts. If not, the firmware enters an idle loop (appropriate for production deployments where `autorun` handles all execution).

---

## CRC Algorithm

All CRC fields use CRC-32/ISO-HDLC (also called CRC-32b, used in Ethernet, PKZIP, and gzip). Polynomial: `0xEDB88320` (reflected). Initial value: `0xFFFFFFFF`. Final XOR: `0xFFFFFFFF`. Input and output are reflected.

Reference implementation: IEEE 802.3 CRC-32. Available as `crc32()` in zlib and in the ESP-IDF's ROM.

---

## Format Version History

| Version | Notes |
|---------|-------|
| `0x00000001` | Initial format. 32-byte header, heap image, slot table, 8-byte footer. 64-bit generation counter. |

Future format changes will increment the version field. The restore code rejects snapshots with an unrecognized version and boots clean rather than restoring a potentially mismatched snapshot.

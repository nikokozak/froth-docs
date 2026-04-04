---
title: "Snapshot Format"
weight: 8
---

This page describes the snapshot model in the Froth runtime. Three details matter most:

1. snapshots persist **CellSpace** as a first-class region
2. safe boot uses **Ctrl-C during the boot window**
3. `wipe` returns the device to the **base image**, which may include a compiled user program

## What a snapshot stores

A snapshot persists the overlay portion of the live system:

- overlay slot bindings
- heap objects reachable from those bindings
- the allocated CellSpace prefix

The base image is not duplicated into the snapshot. The base image is whatever the firmware loads before restore:

- kernel primitives
- stdlib
- generated board pins
- board library
- optional compiled user program when no snapshot is restored

## What is not persisted

These remain transient:

- the data stack
- the return stack
- in-flight execution state
- live console / daemon state
- hardware peripheral configuration

After restore, the runtime starts from empty DS and RS again and then calls `autorun` if that word exists.

## Header layout

The header is defined in `src/froth_snapshot.h`.

Important fields:

- magic: `FRTHSNAP`
- version: `0x0005`
- cell-size bits
- endianness marker
- ABI hash
- generation number
- payload length
- payload CRC32
- header CRC32

The ABI hash exists so that snapshots can be rejected when the persisted representation no longer matches the firmware's expectations.

## Payload shape

The payload is a compact structured stream, not a raw heap dump.

Conceptually it contains:

1. a **name table**  
   Slot names referenced by the snapshot.
2. an **object table**  
   Persisted heap-backed objects such as quotations, strings, and patterns.
3. **overlay bindings**  
   Slot bindings for overlay slots only.
4. **CellSpace image**  
   `cellspace_used` plus the serialized cells for the allocated prefix.

This layout matters because snapshots are pointer-safe:

- slot references are stored by name-table indirection
- heap-backed objects are rebuilt from structured object records
- CellSpace values are serialized as tagged Froth cells, not raw machine pointers

## Overlay restore model

Restore does not replace the firmware image. It rebuilds the live overlay on top of the base system.

The runtime first resets to base:

- heap pointer back to the base watermark
- overlay flags cleared from slots
- CellSpace reset to the captured base seed

Only then does it load the saved snapshot payload.

That is why:

- stdlib and board libraries stay part of the base image
- `wipe` can honestly return to a known base state
- base-created CellSpace allocations survive `wipe` correctly

## CellSpace in snapshots

CellSpace is a real part of the persisted language state.

The snapshot stores:

- `cellspace_used`
- every tagged cell in the allocated prefix `[0, cellspace_used)`

This is necessary because base-created cells may later be mutated by user code. Persisting only an overlay suffix would lose those mutations.

## Save / restore / wipe semantics

### `save`

Builds the snapshot payload in RAM, picks the inactive snapshot slot, writes the payload, then writes the header.

### `restore`

Picks the newest valid snapshot slot, validates header and payload CRCs, resets the live system to base, then loads names, objects, bindings, and CellSpace.

### `wipe`

Erases both snapshot slots and then performs a reset back to the base image.

That means `wipe` is stronger than "delete persisted overlay records." It is the factory-reset path.

## Storage model

The runtime uses an A/B slot scheme:

- one active slot
- one inactive slot
- saves always target the inactive slot
- restores choose the newest valid slot

This protects the last good snapshot if power is lost during a save.

The precise platform storage backend is provided by:

- `platform_snapshot_read`
- `platform_snapshot_write`
- `platform_snapshot_erase`

Repo targets implement the snapshot API at the platform layer rather than baking storage details into the generic runtime.

## Boot interaction

The relevant boot sequence in `src/froth_boot.c` is:

1. register primitives, board FFI, project FFI, and snapshot words
2. initialize platform and transient buffers
3. initialize CellSpace
4. load stdlib
5. load generated board pins and board library when present
6. capture the base CellSpace seed and heap watermark
7. open the safe-boot window
8. if not in safe boot:
   - try `restore`
   - if restore did not succeed and a compiled user program exists, load that user program
   - attempt `autorun` under `catch`

That sequence explains two behaviors:

- project FFI is available before restore
- a compiled user program can be part of the base image that `wipe` returns to

## Safe boot

The safe-boot path is serial **Ctrl-C** during the boot window.

The boot code prints:

```text
boot: CTRL-C for safe boot
```

and waits about 750 milliseconds.

If safe boot is requested:

- restore is skipped
- `autorun` is skipped
- the base image comes up without the saved overlay

The runtime does not use the BOOT button for this path.

## Practical implications

- Use snapshots to persist definitions and CellSpace state, not live stacks.
- Put hardware setup in `autorun` or setup words, not in assumptions about restored peripheral state.
- Use `wipe` when you want to get back to the built firmware baseline.
- Expect a saved snapshot to override the compiled user program until you wipe it.

For the user-facing workflow, see [Snapshots and Persistence](/guide/10-snapshots-and-persistence/).

---
title: "Snapshots and Persistence"
weight: 10
---

You have spent the last few chapters building words, talking to hardware, and shaping a live session. All of that starts in RAM. Pull power and RAM disappears.

Froth's answer is the snapshot system.

A snapshot saves the **overlay** part of the live system so that the next boot can restore it before `autorun` runs. It includes slot bindings, heap objects, and the CellSpace image.

## What a snapshot captures

A snapshot persists three things:

1. **overlay slot bindings**  
   The words and data slots you defined after boot.
2. **reachable heap objects**  
   Quotations, strings, patterns, and other persistable heap-backed values reachable from those overlay bindings.
3. **the allocated CellSpace prefix**  
   Mutable tagged cells allocated through `create`, `allot`, and `variable`.

That means a saved session can restore:

- new word definitions
- slot-backed constants created with `value`
- project state stored in variables and arrays

## What a snapshot does not capture

Some runtime state is deliberately transient:

- the data stack
- the return stack
- in-flight execution
- live console/daemon state
- hardware peripheral configuration

After restore, DS and RS are empty again. If your program needs GPIO or PWM configured, do that in `autorun` or in a setup word called by `autorun`.

## `save`, `restore`, and `wipe`

### `save`

```froth
save
```

Writes the overlay snapshot to snapshot storage.

### `restore`

```froth
restore
```

Resets the live system back to the base image, then overlays the most recently saved snapshot on top.

You normally do not call `restore` by hand very often, because boot already tries it automatically.

### `wipe`

```froth
wipe
```

Erases both saved snapshot slots and immediately resets the device back to the base image.

That base image includes:

- the kernel primitives
- the stdlib
- board pins and board library, if present
- any compiled-in user program
- the base CellSpace state captured after those layers finish loading

`wipe` is the "start from the built firmware again" command.

## CellSpace and persistence

CellSpace is a first-class part of persistence.

If you write:

```froth
'counter variable
0 counter !
1 counter +!
save
```

then the value stored in `counter` is part of the snapshot.

The same is true for arrays and tables:

```froth
'rows create
3 allot
11 rows !
22 rows cell+ !
33 rows cell+ cell+ !
save
```

After restore, those cells come back.

This fits embedded state well because mutable data lives in a dedicated region and the snapshot model persists that region directly.

## The boot sequence

The boot sequence is:

1. register kernel primitives
2. register board FFI
3. register project FFI, if the build has it
4. register snapshot words, if snapshots are enabled
5. initialize the platform and transient buffers
6. initialize CellSpace
7. load the stdlib
8. load generated board pins and `lib/board.froth`, if present
9. capture the base CellSpace image and heap watermark
10. open the safe-boot window
11. if safe boot was not requested:
    - try `restore`
    - if no snapshot was restored and a compiled user program exists, load that base program
    - attempt `[ 'autorun call ] catch drop drop`
12. start the live console / REPL

The consequences are:

- board and project FFI are available before restore
- snapshots overlay the base image rather than replacing it
- `autorun` runs after restore, not before
- if no snapshot exists, the compiled user program becomes the base boot content

## `autorun`

Define a word named `autorun` and save a snapshot:

```froth
: autorun ( -- )
  LED_BUILTIN 1 gpio.mode
  [ true ] [ 500 blink ] while ;

save
```

Now the next boot restores the snapshot and calls `autorun` before the prompt appears.

Because `autorun` is called under `catch`, an error in `autorun` does not permanently destroy the session. But a broken `autorun` can still make a normal boot unusable, which is why safe boot exists.

## Safe boot

Safe boot uses **Ctrl-C during the boot window**.

On boot, Froth prints:

```text
boot: CTRL-C for safe boot
```

It then waits for about 750 milliseconds. If Ctrl-C arrives during that window, Froth:

- skips `restore`
- skips `autorun`
- starts from the base image only

That gives you a clean path back into the system if a saved `autorun` has gone bad.

The BOOT button is unrelated to this path. Safe boot is the serial Ctrl-C window during startup.

## `wipe` vs compiled user programs

Manifest-driven builds embed your resolved project source into the firmware as a base user program.

That means:

- a fresh boot with no snapshot loads the compiled program
- a saved snapshot overlays on top of that base
- `wipe` removes the saved overlay and returns you to the compiled base program

The base image can include more than stdlib.

## Heap `mark` and `release`

`mark` and `release` still exist for temporary heap experiments during a live session.

```froth
mark
\ experiment here
release
```

That mechanism is separate from snapshots:

- `mark` / `release` are live-session memory control
- `save` / `restore` / `wipe` are persistence control

## What will prevent `save`

`save` only works for persistable values.

Common cases that can block it:

- transient strings that have not been promoted
- values that the snapshot writer cannot serialize safely
- snapshot size limits on the target

If `save` fails, fix the offending live state and try again. The existing snapshot remains intact because the save path writes to the inactive snapshot slot first.

## A complete workflow

Build a word, store some state, and make it survive reboot:

```froth
'press-count variable
0 press-count !

: on-press ( -- )
  1 press-count +!
  "Press #" s.emit press-count @ . cr ;

: autorun ( -- )
  BOOT_BUTTON 0 gpio.mode
  [ true ] [
    BOOT_BUTTON gpio.read 0 = [ on-press ] when
    50 ms
  ] while ;

save
```

Power-cycle the device. The variable state and the word definitions come back. `autorun` runs from the restored snapshot.

If that boot goes wrong, send Ctrl-C during the safe-boot window, fix the program, then `save` again or `wipe`.

## Exercises

**Persist a variable.** Define `'counter variable`, store a number with `!`, call `save`, reboot, and confirm `counter @` still returns that value.

**Persist an array.** Use `create`, `allot`, `!`, and `cell+` to store three numbers in CellSpace. Save, reboot, and read them back with `@`.

**Compiled base vs snapshot overlay.** Build a project with an `autorun`, then redefine `autorun` live and `save`. Confirm that `wipe` returns the board to the compiled base behavior.

**Safe boot recovery.** Save a bad `autorun`, reboot, send Ctrl-C during `boot: CTRL-C for safe boot`, and repair or wipe the saved overlay.

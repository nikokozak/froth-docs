# Talking to Hardware

_GPIO, timing, PWM — the reason most people picked up Froth in the first place. This chapter works through the full path from a single blinking LED to a button-controlled light, using a real ESP32 DevKit as the reference board._

---

## Outline and writing notes

This is the chapter embedded hobbyists have been waiting for. It should feel like a reward. Everything before this point was preparation — the stack model, word definitions, quotations, I/O. Now it pays off. Write with energy, but keep the pace of a patient teacher: every new word gets a clear stack comment before it's used.

The reference board is the ESP32 DevKit v1 (38-pin). Pin numbers are real. Word names are real. Code examples should work on a physical board without modification — this chapter's credibility depends on that. If the writer finds any discrepancy between the code here and actual behavior, correct it immediately.

Don't assume the reader has a working development setup from chapter 01. Start with a quick setup checkpoint — VSCode open, board connected, REPL running. Readers who skipped chapter 01 or hit a snag deserve a clean re-entry point.

Tone: this is the most hands-on chapter in the guide. Encourage the reader to run every example. Don't bury the LED blink inside paragraphs of explanation — get to blinking fast, then explain what happened.

---

## Subsections

### 1. Development setup checkpoint

**Purpose:** Ensure the reader can reach the hardware REPL before attempting GPIO.

**What to cover:**
- You need: ESP32 DevKit connected via USB, VSCode open with the Froth extension, the REPL active in the VSCode terminal.
- Quick verification: type `1 1 +` at the REPL and confirm it returns `2`. If the REPL is not responding, troubleshoot the connection before proceeding.
- The Froth extension connects over the serial port automatically when a supported board is detected. If it doesn't, see chapter 01 for manual connection steps.
- Local POSIX target note: GPIO words require real hardware. This chapter assumes a connected ESP32. If you're on the local target, the GPIO words exist in the vocabulary but have no physical effect — you can trace the code logic but won't see anything happen.

**Writer note:** Keep this short — two short paragraphs. Readers who have a working setup will skim it. Readers who don't will appreciate the explicit check.

---

### 2. GPIO basics: `gpio.mode`, `gpio.write`, `gpio.read`

**Purpose:** Introduce the three GPIO primitives with full stack signatures.

**What to cover:**

**`gpio.mode ( mode pin -- )`** — sets the direction of a GPIO pin. `mode` is `0` for input, `1` for output (verify exact values against the board library). `1` for output means the pin can drive high or low. `0` for input means the pin floats and reads back an external voltage.

Example: configure GPIO 2 as output:
```froth
1 2 gpio.mode
```
Stack effect: 1 (output mode) and 2 (pin number) consumed. Nothing left.

**`gpio.write ( level pin -- )`** — sets the output level of a GPIO pin. `level` is `1` for high (3.3V) and `0` for low (GND). Only works on pins configured as output.

Drive GPIO 2 high:
```froth
1 2 gpio.write
```

Drive GPIO 2 low:
```froth
0 2 gpio.write
```

**`gpio.read ( pin -- level )`** — reads the current level of a GPIO pin. Returns `1` if the pin is high, `0` if low. Works on both input and output pins.

Read GPIO 0:
```froth
0 gpio.read .
```

**Writer note:** Stack argument order matters. `gpio.mode` takes `( mode pin -- )` — mode before pin. This is consistent with the board library's general convention: the "what" comes before the "where." Make this explicit so readers don't have to guess.

---

### 3. Blinking an LED

**Purpose:** Get an LED blinking. This is the hardware "hello world."

**What to cover:**
- The ESP32 DevKit v1 has a built-in LED on GPIO 2. Driving it high lights it up; driving it low turns it off. (Verify polarity for the specific board — on some DevKits the LED is active-low.)
- The board library defines `LED_BUILTIN` as a constant with value `2`. Using `LED_BUILTIN` instead of the literal `2` is good practice: it makes the code portable to other boards where the LED may be on a different pin.

**Step-by-step construction:**

First, configure the pin:
```froth
1 LED_BUILTIN gpio.mode
```

Next, turn the LED on and off manually to verify the wiring:
```froth
1 LED_BUILTIN gpio.write
0 LED_BUILTIN gpio.write
```

Now add timing. `ms ( n -- )` waits for `n` milliseconds:
```froth
1 LED_BUILTIN gpio.write  500 ms  0 LED_BUILTIN gpio.write  500 ms
```
LED on for 500ms, off for 500ms.

Wrap it in a word:
```froth
: blink ( delay -- )
  1 LED_BUILTIN gpio.write  dup ms
  0 LED_BUILTIN gpio.write  ms ;
```
`dup` copies the delay so it's used for both the on-phase and off-phase. Usage: `500 blink` blinks once with a 500ms period.

Configurable blink count:
```froth
: blink-n ( count delay -- )
  swap [ over blink ] times drop ;
```
Usage: `5 500 blink-n` — blinks 5 times at 500ms.

Run it at the REPL and watch the LED.

**Writer note:** Walk through the `blink` word definition one stack step at a time. Readers will be running this on real hardware and need the word to work correctly. `dup ms` is a subtle stack move — call it out explicitly.

---

### 4. Timing: `ms` and `us`

**Purpose:** Cover the two timing primitives before moving to more complex examples.

**What to cover:**
- `ms ( n -- )` — blocks for `n` milliseconds. `500 ms` blocks for half a second. `1000 ms` blocks for one second.
- `us ( n -- )` — blocks for `n` microseconds. `1000 us` is approximately 1ms, but with microsecond precision. Use `us` when you need fine timing (e.g., bit-banging a protocol).
- Both words are blocking: the CPU sits in a wait loop for the specified duration. No other Froth words execute during the wait. On a microcontroller without an OS, this is usually fine — Froth is single-threaded.
- For longer waits, prefer `ms` over stacking `us` calls: `1000 ms` is more precise than `1000000 us` on most targets.

**Code example — half-second delay:**
```froth
500 ms
```

**Code example — microsecond pulse:**
```froth
1 LED_BUILTIN gpio.write  10 us  0 LED_BUILTIN gpio.write
```
Sends a 10-microsecond high pulse on the LED pin.

**Writer note:** Mention whether `ms` and `us` are available on the POSIX local target. If they work on POSIX (using a system sleep), say so. If not, note it.

---

### 5. Reading a button

**Purpose:** Teach GPIO input with a concrete example — the boot button on the ESP32 DevKit.

**What to cover:**
- The ESP32 DevKit has a button labeled BOOT (sometimes labeled EN) connected to GPIO 0. The board library defines `BOOT_BUTTON` as `0`.
- GPIO 0 is pulled up internally. When the button is not pressed, it reads `1`. When pressed, it reads `0`. This is active-low behavior — the logic is inverted compared to what beginners might expect.

Configure GPIO 0 as input and read it:
```froth
0 BOOT_BUTTON gpio.mode
BOOT_BUTTON gpio.read .
```
Output with button not pressed: `1 `
Output with button pressed: `0 `

A word that prints the button state:
```froth
: button-state ( -- )
  BOOT_BUTTON gpio.read
  [ "pressed" s.emit ] [ "released" s.emit ] if cr ;
```

A loop that monitors the button:
```froth
: watch-button ( -- )
  [ true ] [ button-state 50 ms ] while ;
```
Press Ctrl+C (or the reset button) to exit. (Verify the REPL interrupt mechanism on hardware.)

**Writer note:** The active-low logic will surprise some readers. State it plainly at the start of this section: "pressing the BOOT button drives GPIO 0 low, so `gpio.read` returns `0` when pressed." Don't bury this in the code comments.

Also: `0 BOOT_BUTTON gpio.mode` is redundant if GPIO 0 is an input by default. Check and note whether the `gpio.mode` call is required or just good practice for clarity.

---

### 6. Pin constants: `LED_BUILTIN` and `BOOT_BUTTON`

**Purpose:** Explain where the pin constants come from and why they're preferable to literals.

**What to cover:**
- Froth boards are described by a `board.json` file that maps pin names to GPIO numbers. When you load the board library, these mappings become Froth constants.
- On the ESP32 DevKit v1: `LED_BUILTIN` is GPIO 2, `BOOT_BUTTON` is GPIO 0.
- Using constants instead of literals has two advantages:
  1. Readability: `LED_BUILTIN gpio.write` is clearer than `2 gpio.write`.
  2. Portability: if you run the same code on a board with the LED on a different pin, only `board.json` needs to change. Your Froth code stays the same.
- The board library (`lib/board.froth`) loads automatically when a board is connected. It defines constants and convenience words appropriate for that board.
- To see what's defined: check the reference section for your board, or type `board.words` at the REPL if available (verify this word exists).

**Writer note:** If there's a definitive list of constants defined by each board's `board.json`, link to it. Readers building non-standard boards will want to know how to add their own constants.

---

### 7. PWM with LEDC

**Purpose:** Introduce PWM output for LED dimming and tone generation.

**What to cover:**
- PWM (Pulse Width Modulation) is how you vary output brightness or generate audio tones. Instead of toggling a pin fully on and off, you toggle it at high frequency with a variable duty cycle.
- The ESP32 has a dedicated LED controller (LEDC) peripheral. The board library exposes it through four words.

**Board library PWM words:**
```froth
: ledc.setup ( channel pin freq -- ) ... ;
: ledc.duty  ( channel duty -- ) ... ;
: ledc.freq  ( channel freq -- ) ... ;
: ledc.off   ( channel -- ) ... ;
```

- `ledc.setup ( channel pin freq -- )` — configures a LEDC channel. `channel` is 0-7 (ESP32 supports up to 8 channels). `pin` is the GPIO pin. `freq` is the PWM frequency in Hz.
- `ledc.duty ( channel duty -- )` — sets the duty cycle. `duty` is a value from 0 to 1023 (10-bit resolution): `0` is fully off, `1023` is fully on, `512` is 50%.
- `ledc.freq ( channel freq -- )` — changes the frequency of a running channel. Used for tone generation.
- `ledc.off ( channel -- )` — turns off the PWM output for a channel.

**Code example — dim an LED:**
Setup: channel 0, LED_BUILTIN, 5000Hz:
```froth
0 LED_BUILTIN 5000 ledc.setup
```
Set to 50% brightness:
```froth
0 512 ledc.duty
```
Full brightness:
```froth
0 1023 ledc.duty
```
Off:
```froth
0 ledc.off
```

**Code example — fade loop:**
```froth
: fade ( -- )
  0 LED_BUILTIN 5000 ledc.setup
  1024 [ 0 over ledc.duty  10 ms  1 - ] times
  drop
  0 ledc.off ;
```
Steps duty from 1023 down to 0, waiting 10ms between steps.

**Code example — buzzer tone:**
Connect a passive buzzer to GPIO 5 (or any available pin). Set frequency to generate a tone:
```froth
1 5 440 ledc.setup   \ channel 1, pin 5, 440Hz (concert A)
1 512 ledc.duty      \ 50% duty cycle
500 ms
1 ledc.off
```

**Writer note:** Verify the duty cycle resolution. The examples above use 10-bit (0-1023). If the ESP32 LEDC implementation in the board library uses a different resolution, correct the examples. Also note whether `ledc.setup` implicitly starts the output or whether a `ledc.duty` call is needed to start driving the pin.

---

### 8. The board library

**Purpose:** Explain the structure of the board library so readers know where hardware words come from.

**What to cover:**
- `lib/board.froth` is a Froth source file that is loaded automatically when a board is connected. It defines:
  - Pin constants (`LED_BUILTIN`, `BOOT_BUTTON`, and any other board-specific pins)
  - Convenience words (`ledc.setup`, `ledc.duty`, `ledc.freq`, `ledc.off`, and potentially others)
  - Board-specific configuration
- You don't have to load it manually. When the Froth runtime connects to an ESP32 DevKit, it locates the matching `board.json` and `lib/board.froth` and loads them.
- You can read `lib/board.froth` to see exactly what's available on your board. It's plain Froth code. Nothing is hidden.
- Adding your own words to the board library: if you have hardware-specific helpers that belong with the board setup, you can add them to a local `board.froth` or define them in a project file. (Forward reference: chapter 09 covers how to save definitions persistently.)

**Writer note:** If there's a per-project override mechanism for `board.froth`, explain it briefly. Readers building custom boards will want to know where to put their pin definitions.

---

### 9. Combined program: button-controlled LED

**Purpose:** Bring GPIO input, output, and timing together in one program.

**What to cover:**
- A button-controlled LED: when the BOOT button is held, the LED is on. When released, the LED is off.

```froth
: button-led ( -- )
  1 LED_BUILTIN gpio.mode
  0 BOOT_BUTTON gpio.mode
  [ true ] [
    BOOT_BUTTON gpio.read not
    LED_BUILTIN gpio.write
    10 ms
  ] while ;
```

Walk through the logic:
- Configure LED pin as output, button pin as input.
- Loop forever.
- Read the button (`gpio.read` returns 1 when not pressed, 0 when pressed). `not` inverts it so the LED lights when the button is pressed (`0` → `1`).
- Write the inverted button state to the LED.
- Wait 10ms to debounce.

**Light pattern program:**
```froth
: sos ( -- )
  3 [ 100 blink ] times
  3 [ 500 blink ] times
  3 [ 100 blink ] times
  1000 ms ;
```
Uses the `blink` word from section 3. Loops: `[ sos ] [ ] while` for a continuous SOS.

**Writer note:** The `button-led` word uses `not`. Verify this word is in scope — it may be `0 =` in practice. Adjust accordingly. Also, decide whether to include the infinite loop wrapper or leave it as a one-shot call — the infinite version is more satisfying on hardware but requires the reader to know how to interrupt execution.

---

### 10. Exercises

**Purpose:** The reader builds hardware programs on their own, with increasing complexity.

**Exercise 1 — Manual GPIO:**
At the REPL, configure GPIO 2 as output and toggle it three times with 500ms delays between each toggle. Do it entirely from the REPL without defining a word.

**Exercise 2 — Read the button:**
Write an expression that reads `BOOT_BUTTON` and prints `1` if pressed, `0` if not. Run it once with the button held and once with it released.

**Exercise 3 — Blink with custom timing:**
Define a word `fast-blink ( -- )` that blinks `LED_BUILTIN` 10 times at 100ms on / 100ms off.

**Exercise 4 — PWM fade:**
Using `ledc.setup` and `ledc.duty`, fade the LED in from 0 to full brightness over 2 seconds. Use a loop with `ms` delays.

**Exercise 5 — Button-controlled brightness:**
Write a program where pressing the BOOT button increases LED brightness in 4 steps (off → dim → medium → full → off, cycling). This requires tracking state between button presses.

---

## Key concepts introduced in this chapter

- `gpio.mode ( mode pin -- )`: configure a pin as input (0) or output (1)
- `gpio.write ( level pin -- )`: drive a pin high (1) or low (0)
- `gpio.read ( pin -- level )`: read a pin's current level
- `ms ( n -- )`: block for n milliseconds
- `us ( n -- )`: block for n microseconds
- `LED_BUILTIN`: GPIO 2 on ESP32 DevKit v1
- `BOOT_BUTTON`: GPIO 0 on ESP32 DevKit v1 (active-low)
- `ledc.setup ( channel pin freq -- )`: configure a PWM channel
- `ledc.duty ( channel duty -- )`: set PWM duty cycle (0-1023)
- `ledc.freq ( channel freq -- )`: change PWM frequency
- `ledc.off ( channel -- )`: stop PWM output
- Board library (`lib/board.froth`): loaded automatically; defines pin constants and hardware words
- Pin constants from `board.json`: prefer over raw GPIO numbers for portability

---

## Code examples (full list, for reference when writing)

1. `1 2 gpio.mode` — configure GPIO 2 as output
2. `1 2 gpio.write` — drive GPIO 2 high
3. `0 2 gpio.write` — drive GPIO 2 low
4. `0 gpio.read .` — read and print GPIO 0 state
5. `blink` word definition and usage with `LED_BUILTIN`
6. `blink-n` word for repeating blinks
7. `BOOT_BUTTON gpio.read .` — read button state
8. `button-state` word using `if` to print pressed/released
9. `0 LED_BUILTIN 5000 ledc.setup` — PWM setup
10. `0 512 ledc.duty` — 50% duty cycle
11. `fade` word — smooth LED fade
12. Buzzer tone with 440Hz
13. `button-led` — combined input/output program
14. `sos` — light pattern using `blink`

---

## Connections to other chapters

- **Chapter 05 (Quotations and Control Flow):** `while` is the core of every hardware loop here. The button monitoring loop and the fade loop both use `[ condition ] [ body ] while`. Readers who followed chapter 05 will recognize the pattern immediately.
- **Chapter 07 (Strings and I/O):** `s.emit` and `.` are used in hardware debugging output — printing pin states, sensor values, error messages. The output vocabulary from chapter 07 is the natural companion to the hardware vocabulary introduced here.
- **Chapter 09 (Snapshots and Persistence):** After building programs in this chapter, the reader will want to save them. Chapter 09 explains `save` and `autorun`, which is where hardware programs become standalone devices.

---

## Navigation

[← Previous: Strings and I/O](07-strings-and-io.md) | [→ Next: Snapshots and Persistence](09-snapshots-and-persistence.md)

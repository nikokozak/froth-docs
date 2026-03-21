# Where to Go Next

_You've been through the whole language. Here's what to read, build, and explore from here._

---

## Outline and writing notes

This chapter is short. It does not introduce new concepts. Its job is to give the reader a clear map of what else exists in the Froth documentation and point them toward productive next steps.

Resist the impulse to recap the guide. The reader just finished it. Instead, point forward: the reference, the tutorials, the formal spec, the source code. Every section here is short — one sentence description, a link, and maybe one line of context about who it's for.

Tone: warm but brief. The reader has earned this. Don't make them wade through paragraphs to get to a link.

---

## Subsections

### 1. The reference section

**Purpose:** Point to the word-by-word reference as the primary tool for daily Froth use.

**What to cover:**
- The reference section contains the complete word list, organized by vocabulary. Each entry includes the stack signature, a description, and a usage example.
- If you're working at the REPL and can't remember whether it's `s.len` or `s.length`, the reference has the answer.
- The reference also covers:
  - **Profiles** — the POSIX, ESP32, and RP2040 profiles and which words are available on each target
  - **CLI** — the `froth` command-line tool: flashing, connecting, project commands
  - **VSCode extension** — keybindings, REPL integration, file execution

Links (update with actual URLs once the reference section is live):
- Word list: `/reference/words`
- Profiles: `/reference/profiles`
- CLI reference: `/reference/cli`
- VSCode extension: `/reference/vscode`

**Writer note:** If the reference section is not yet live, link to a placeholder or use a `(coming soon)` note rather than a broken link.

---

### 2. Tutorials

**Purpose:** Point to project-based tutorials as the next step for readers who learn by doing.

**What to cover:**
- The tutorials section has step-by-step projects that go deeper than the guide examples.
- Recommended starting points:

**Calculator** — build an RPN calculator at the REPL. Practices stack manipulation, word definition, and error handling without requiring hardware. Good first project for readers who want to write more Froth before connecting a board.

**Blink and beyond** — extends chapter 08's blink example into a configurable pattern player. Covers arrays, timing, and `autorun` deployment.

**Sensor reading** — reads data from an I2C sensor (temperature, humidity, etc.) and displays it over serial. Introduces I2C words, number formatting, and a basic polling loop.

**Interactive workflow** — demonstrates the full develop-save-deploy cycle from a multi-word program to a standalone device. Shows how to recover from mistakes at each stage.

Links (update with actual URLs):
- `/tutorials/calculator`
- `/tutorials/blink`
- `/tutorials/sensor`
- `/tutorials/workflow`

---

### 3. What makes Froth different

**Purpose:** Point to the features page for readers who want the technical case for Froth's design choices.

**What to cover:**
- The guide teaches Froth. The features page argues for it.
- If you're wondering why Froth uses `perm` instead of `dup`/`swap`/`rot`, why word redefinition is coherent, or why the error model works the way it does — the features page is where those questions get answered.
- It assumes you can already program. It speaks directly to the design tradeoffs rather than teaching from scratch.

Link: `/features`

---

### 4. The specification

**Purpose:** Point to the formal language definition for readers who want precision.

**What to cover:**
- The Froth specification is the authoritative definition of language semantics. It covers the stack model, word lookup, the slot system, error codes, and evaluation rules.
- Use it when the guide and reference leave a question unanswered, or when you're implementing Froth on a new target.
- It is not a tutorial. It's a reference for people who need to know exactly how something works.

Link (update with actual URL): `/spec`

---

### 5. Contributing

**Purpose:** Brief placeholder pointing toward contribution.

**What to cover:**
- Froth is open source. If you've found a bug, want to add a board target, or want to improve the documentation, contributions are welcome.
- See the contributing guide in the repository for how to get started.

Link (update with actual URL): GitHub repository / `CONTRIBUTING.md`

**Writer note:** Expand this section when the contribution process is established. For now, a pointer to the repo is sufficient.

---

### 6. Reading the source

**Purpose:** Encourage readers who want to go deep to read the Froth implementation itself.

**What to cover:**
- The Froth runtime is readable code. If you want to understand how `perm` is implemented, how the heap allocator works, or how the ESP32 port handles NVS writes for snapshots, the source is the place to look.
- The core stdlib (`core.froth`) is worth reading even for beginners: it shows how every standard word is defined using a small set of primitives, and it's all valid Froth that you can run and modify.
- Key files to explore:
  - `core.froth` — the entire standard library, including `if`, `while`, `dip`, `keep`, `bi`, and `times`
  - `lib/board.froth` for your board — the hardware abstraction layer
  - The runtime source for the target you care about — where the C/Rust/whatever implementation lives

Link (update with actual URL): GitHub repository

---

## Navigation

[← Previous: Snapshots and Persistence](09-snapshots-and-persistence.md)

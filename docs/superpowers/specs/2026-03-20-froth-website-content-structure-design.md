# Froth Website Content Structure Design

## Overview

Design for the initial content pass of the Froth programming language website.
All content authored as `.md` files in the FrothDocs repo, to be ported to a
real site later. This pass establishes the file structure, writes the homepage
and opening guide chapter in full, creates rich outlines for all remaining pages,
and defines a voice guide to keep the writing consistent and human.

The existing `index.md` in the repo root is a rough draft. It will be replaced
by the homepage written during this pass.

## Audience (in priority order)

1. **Embedded hobbyists** who own an ESP32 and want a better way to program it
2. **Curious programmers** from Python/C/JS who find "weird" intriguing and have
   never seen a stack-based language
3. **Academic readers** evaluating Froth's design decisions (thesis advisors, PL
   researchers)
4. **Forth enthusiasts** curious about what Froth adds (lowest priority; they'll
   figure it out)

Zero Forth knowledge is assumed throughout the guide. Forth comparisons appear
only on the dedicated features page and in occasional sidebars.

## Desired reader experience

After 5 minutes on the site, a visitor should feel (in this order):

1. "This is powerful in a way I didn't expect"
2. "I want to try this right now"
3. "This is surprisingly accessible"

## File tree

```
index.md                              homepage (full content)
what-makes-froth-different.md         features/novelty page (rich outline)

guide/
  00-what-is-froth.md                 full content
  01-getting-started.md               rich outline
  02-the-stack.md                     rich outline
  03-words-and-definitions.md         rich outline
  04-perm-and-named.md                rich outline
  05-quotations-and-control.md        rich outline
  06-error-handling.md                rich outline
  07-strings-and-io.md                rich outline
  08-talking-to-hardware.md           rich outline
  09-snapshots-and-persistence.md     rich outline
  10-where-to-go-next.md             rich outline

reference/
  words.md                            rich outline
  profiles.md                         rich outline
  cli.md                              rich outline
  vscode.md                           rich outline
  build-options.md                    rich outline
  snapshot-format.md                  rich outline

tutorials/
  build-a-calculator.md               rich outline (no hardware needed)
  blink-an-led.md                     rich outline
  read-a-sensor.md                    rich outline
  interactive-workflow.md             rich outline

_internal/
  voice-guide.md                      working doc, not part of site
  website-references.md               design research, not part of site
```

### Notes on the file tree

**Chapter 04 covers both `perm` and Named frames.** `perm` is the foundation;
Named frames compile down to `perm`-based shuffles. This chapter introduces
the profile concept and covers the one profile (Named) most relevant to the
primary audience. The full profile reference lives in `reference/profiles.md`.

**FFI is out of scope for this guide pass.** Chapter 08 covers hardware
interaction through Froth's built-in words (`gpio.mode`, `gpio.write`, etc.)
and board libraries, not the raw C FFI. FFI documentation belongs in a future
advanced guide or in the reference section.

**Tutorial ordering.** `build-a-calculator` comes first because it requires no
hardware, making it an accessible entry point for audience 2 (curious
programmers). The hardware tutorials follow.

**Non-site files live in `_internal/`.** This keeps working documents
(`voice-guide.md`, `website-references.md`) out of the content tree to avoid
accidental inclusion when porting to the real site.

**Deferred to the site build phase:** blog/changelog, 404 page, top-level
navigation between sections, search.

## Voice registers

Three distinct registers, shifting by section.

### Homepage voice

Personal, opinionated, first-person. The creator speaking directly. Confident
without being boastful. Can be a little irreverent. Uses "I" naturally.

### Guide voice

Warm, direct, second-person. A good teacher who assumes intelligence but not
knowledge. Patient without being condescending. Uses "you" throughout. Builds
explanations across multiple sentences, letting ideas develop. Trusts the reader
to follow along.

### Reference voice

Clean, neutral, no pronouns needed. The content speaks for itself. Precise and
consistent. Every word entry follows the same format.

### Features page voice

Between homepage and guide. Authoritative, making a case. Can reference Forth
directly and assume some programming language knowledge. This page has to work
for both thesis advisors and Forth veterans.

## Anti-patterns: the AI voice

All writing must avoid the following patterns, which are characteristic of
AI-generated prose and will immediately undermine credibility.

### Structural habits to avoid

- Em-dash as connective tissue. One or two in a long document is fine. Five
  per paragraph is a tell. Use commas, semicolons, parentheses, or just write
  two sentences.
- Short. Punchy. Fragments. For. Emphasis. Real technical writers vary their
  rhythm. A short sentence after a long one can land hard, but a string of
  fragments sounds like ad copy.
- Colon-then-bullet-list as the default way to present any information. Lists
  are for genuinely list-shaped content (word references, install steps). Most
  explanations are better as paragraphs.
- The three-part parallel structure ("X, Y, and Z") as the go-to rhetorical
  move. Once per page is fine. Three times is a pattern. Five times is a
  fingerprint.
- The reflexive overview opening. "In this chapter, we will cover X, Y, and Z"
  at the start of every section. Real writers sometimes do this, but AI does it
  every time, making it a tell. If a chapter needs a roadmap, put it at the end
  of the intro paragraph, not as a formulaic opener.
- The symmetrical close. Ending a section by restating the opening sentence in
  slightly different words, creating false closure. If you've made your point,
  stop. The next section heading is transition enough.
- Reflexive hedging. "Can be used to", "may", "it should be mentioned",
  "it's important to note." State things directly. "Froth does X" not "Froth
  can be used to do X." Hedge only when genuine uncertainty exists.

### Phrases and words to avoid

- "Let's dive in", "Let's explore", "Let's take a look"
- "Incredibly", "elegant", "robust", "seamless", "straightforward"
- "It's worth noting that...", "Interestingly enough..."
- "In other words..." (if you said it well the first time, you don't need this)
- "Now that we've covered X, let's move on to Y"
- "This is where X comes in" / "This is where X shines"
- "Under the hood"
- "At its core"
- "Think of it as..." (one or two analogies is fine; this phrase every time
  a concept appears is not)
- Any sentence that restates what was just said in slightly different words
- "Powerful", "leverage", "utilize", "facilitate", "comprehensive"
- Conversational filler at the start of sentences: "So,", "Basically,",
  "Essentially,", "Actually,", "Now,"

### Punctuation and tone markers

- **Exclamation marks:** Acceptable sparingly in the homepage voice (one, maybe
  two in the whole page). Never in the guide or reference. Enthusiasm should
  come from what you're showing, not from punctuation.
- **Emoji:** None. Anywhere. Ever.

### Rhythm and structure to aim for

Study these examples from real human-written technical documentation:

**From the Rust Book (ownership chapter):**
> Ownership is a set of rules that govern how a Rust program manages memory.
> All programs have to manage the way they use a computer's memory while
> running. Some languages have garbage collection that regularly looks for
> no-longer-used memory as the program runs; in other languages, the
> programmer must explicitly allocate and free the memory. Rust uses a third
> approach: Memory is managed through a system of ownership with a set of
> rules that the compiler checks.

Notice: the paragraph opens with a plain definition, then broadens to give
context (other approaches), then narrows back to Rust's specific choice. The
sentences are different lengths. There are no rhetorical flourishes. The
colon in the last sentence earns its place by delivering the key insight.

**From Gleam's FAQ:**
> Type classes are fun and enable creation of very nice, concise APIs, but
> they can make it easy to make challenging to understand code, tend to have
> confusing error messages, make consuming the code from other languages much
> harder, have a high compile time cost, and have a runtime cost unless the
> compiler performs full-program compilation and expensive monomorphisation.

Notice: a single long sentence that works because it earns its length. It
acknowledges the appeal honestly ("fun", "very nice") before laying out the
costs one by one. It doesn't hedge or soften. It just states the trade-offs
and trusts the reader.

**From Svelte's overview:**
> You can use it to build anything on the web, from standalone components to
> ambitious full stack apps (using Svelte's companion application framework,
> SvelteKit) and everything in between.

Notice: conversational and confident without being loud. The parenthetical
adds useful context without breaking the sentence's flow. "Ambitious" is the
only adjective, and it earns its place.

### General principles

- Vary sentence length. A paragraph of uniform sentence lengths sounds
  mechanical regardless of what the sentences say.
- Let thoughts develop. If a concept needs three sentences to explain, use
  three sentences. Don't compress it into one dense sentence with semicolons
  and em-dashes, and don't chop it into three punchy fragments.
- Trust the reader. Don't explain something and then re-explain it in
  simpler terms. If the first explanation wasn't clear enough, rewrite it.
- Prefer showing code to describing code. A 4-line example often replaces
  two paragraphs of explanation.
- Never apologize for the language being unusual. Froth is weird. That's the
  point. Present it with confidence.
- Use technical terms when they're the right terms, but define them on first
  use for the audience that needs it.

## Homepage plan (index.md)

### Structure

1. **Opening tagline.** One sentence that captures what Froth is.
2. **Hook paragraph.** 3-4 sentences, personal voice. What this is, why it
   exists, why you should care. Creates curiosity, doesn't explain the language.
3. **A code example that earns respect.** Not hello world. A short REPL session
   (5-8 lines) showing interactive hardware control: define a word, see the LED
   respond, redefine it, see the change take effect. Brief annotation.
4. **Three qualities, briefly.** 2-3 sentences each, not a feature grid:
   - Interactive: talk to hardware, it responds, redefine things live
   - Tiny and transparent: the whole language fits in your head
   - Yours to reshape: even `dup` is defined in Froth itself
5. **Call to action.** "Read the guide" links to chapter 00. One path. Secondary
   link to install for the impatient.
6. **"Who is this for" line.** One sentence. Hobbyists, tinkerers, people who
   want to understand their hardware.

### Deliberately omitted from homepage

- Feature checklists (those go on what-makes-froth-different.md)
- Comparison tables
- Company logos or testimonials
- Install instructions (that's chapter 01)

## Guide chapter 00 plan (guide/00-what-is-froth.md)

### Structure

1. **The big idea, simply stated.** Froth is a language for microcontrollers
   where you build everything yourself from a small set of primitives. You type,
   the hardware responds, you iterate.
2. **The Forth heritage, honestly.** Froth is based on Forth (1970s). What Forth
   got right: small, interactive, close to hardware. What it got wrong: fragile
   redefinition, no error recovery, hostile to tooling. No need to know Forth.
3. **How Froth thinks.** The mental model in ~3 paragraphs. Stack-based, postfix,
   built from small pieces. A short annotated code snippet showing the basics.
4. **What you can do with it.** The practical picture. ESP32, VSCode, live REPL,
   redefine words on the fly, snapshot to survive power loss.
5. **How this guide works.** One paragraph. "This guide assumes no Forth knowledge.
   We start with the stack and build up. By chapter 08 you're controlling hardware."
6. **Link to chapter 01.**

### Voice

Guide register: warm, direct, "you" focused. ~800-1200 words.

## Stub format

Each stub contains:

- Title
- One-line description of what the chapter/page covers
- Detailed subsection breakdown with notes on what each subsection should contain
- Key concepts to introduce, with enough context that someone could start writing
- Specific code examples to include (described, not written)
- Connections to other chapters (what this builds on, what it enables)
- Navigation links (previous/next for guide chapters)

Stubs should be rich enough that a writer could pick one up and produce a full
chapter from it without needing to ask many questions.

## What-makes-froth-different.md plan

A standalone page for thesis readers and Forth veterans. Structured around the
genuine innovations: `perm` as a canonical stack primitive, coherent redefinition
via slots, structured error handling with `catch`/`throw`, the profile system
(Named, Checked, Region, etc.), snapshot persistence, the tooling story (CLI,
VSCode, daemon). Each feature gets a brief explanation and a code example showing
it in action. The page makes the case that Froth is a new language, not a Forth
dialect.

## Voice guide scope

`_internal/voice-guide.md` is a standalone working document that extracts and
expands the voice registers and anti-patterns from this spec into a concise,
reference-friendly format. It contains:

- The four voice registers with examples of each (short sample paragraphs
  demonstrating the register in action, not just descriptions)
- The full anti-pattern list, formatted for quick scanning during writing
- 3-4 annotated "before/after" rewrites showing how to fix AI-sounding prose
- A short checklist to run against any finished draft

It does not duplicate the rationale or reference-site analysis from this spec.
It is a practical tool, not a design document.

## Deliverables summary

| File | Content |
|---|---|
| `_internal/voice-guide.md` | Full working document (not part of site) |
| `index.md` | Full homepage content |
| `guide/00-what-is-froth.md` | Full opening chapter |
| `what-makes-froth-different.md` | Rich outline |
| `guide/01` through `guide/10` | Rich outlines (10 files) |
| `reference/*` | Rich outlines (6 files) |
| `tutorials/*` | Rich outlines (4 files) |
| Total | 24 files |

File count: 1 voice guide + 1 homepage + 1 chapter 00 + 1 features page +
10 guide stubs + 6 reference stubs + 4 tutorial stubs = 24.
(`website-references.md` already exists at the repo root; it will be moved
to `_internal/` as part of this pass. It is not a new deliverable.)

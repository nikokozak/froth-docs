# Froth Website - Reference Sites & Design Notes

## Guiding Principles

Froth's website needs to be:
- **Beautiful but not sterile** — personality over polish
- **Incredibly practical** — every question answered by browsing
- **Deeply readable** — long articles that give real insight into the language
- **Different** — not the typical dry CS/PL site

Froth itself is "weird" and fun, Forth-based, for microcontrollers, focused on interactivity.
The site should reflect that spirit: approachable, confident, a little irreverent.

---

## Tier 1: Primary Structural References

These sites nail the combination of beauty, personality, depth, and practicality
that Froth should aim for.

### Svelte — svelte.dev
**Why it matters:** The gold standard for a framework site that feels *human*.

- **Tagline approach:** "Web development for the rest of us" — positions the tool
  as accessible, not elitist. Froth should do something similar for its Forth heritage.
- **Interactive tutorials:** Split into Basic and Advanced tracks with a live
  playground. Readers learn by doing, not just reading.
- **Tone:** Genuinely enthusiastic without being cloying. Calls itself "a love
  letter to web development." Celebrates developer joy.
- **Structure:** Docs (core concepts) / Tutorial (hands-on) / Playground (experiment) /
  Blog (narrative depth). Clear separation of concerns.
- **Documentary:** They made a documentary about the project's origins. Storytelling
  as a first-class concern.

**Steal this:** The tiered tutorial structure (basic -> advanced), the tone of warmth
and genuine passion, the separation of reference docs from narrative learning.

---

### Gleam — gleam.run
**Why it matters:** The closest spiritual cousin to what Froth should feel like.
A niche language with a strong personality that makes you *want* to learn it.

- **Mascot (Lucy):** A friendly star character that appears throughout. Gives the
  site warmth and identity. Froth could use its own visual identity in a similar way.
- **Tagline:** "A friendly language for building type-safe systems" — leads with
  *friendly*, not *powerful*. The human quality comes first.
- **Wavey section dividers:** Soft, organic visual boundaries instead of hard lines.
  The design itself communicates "we're not like other PL sites."
- **Values statement:** "Black lives matter. Trans rights are human rights." —
  takes a clear stance on community values. Not afraid to have a voice.
- **Error messages as a feature:** Showcases helpful error messages on the homepage.
  This communicates "we care about your experience."
- **Tone:** "hello, friend!" — conversational, warm, inviting.

**Steal this:** The mascot/visual identity approach, the confidence to be soft and
friendly in a space that defaults to cold and technical, the "show don't tell"
approach to developer experience.

---

### Tailwind CSS — tailwindcss.com
**Why it matters:** Best-in-class practical documentation. You can find anything
in seconds.

- **Cmd+K search:** Instant, keyboard-driven search across all docs. This is
  non-negotiable for Froth.
- **The site IS the product:** Built entirely with Tailwind, so the site itself
  proves the tool works. Froth's site should feel like it was made by someone who
  thinks in Froth.
- **Visual demonstrations:** Responsive design examples, color palettes, live
  previews. Shows rather than tells.
- **Dual audience:** Homepage sells the vision; docs serve the practitioner.
  Newcomers and experts have separate paths.
- **Performance claims backed by data:** "Most projects ship <10kB of CSS."
  Concrete, not vague.

**Steal this:** The search-first documentation UX, the "site as proof of concept"
philosophy, the concrete performance claims.

---

## Tier 2: Key Lessons from Individual Sites

### Rust — rust-lang.org
**Lesson: Depth of learning resources**

- "The Rust Programming Language" (The Book) is legendary — a full, free,
  beautifully written book that takes you from zero to competent.
- Multiple learning pathways: The Book, Rust By Example, Rustlings (exercises),
  the Playground.
- Domain-specific guides: CLI, WebAssembly, embedded, networking.
- Froth needs its own "Book" — a definitive, long-form guide that people
  actually enjoy reading.

### Go — go.dev
**Lesson: Practical, task-oriented organization**

- Organizes learning around *what you want to build*, not language features.
- "A Tour of Go" — interactive browser tutorial, progressive complexity.
- Embedded playground on the homepage. You can run Go in 5 seconds.
- Developer testimonials that emphasize *simplicity and focus* over raw power.
- Froth should let people run code from the homepage and organize docs around
  tasks (blink an LED, read a sensor, build a REPL).

### Kotlin — kotlinlang.org
**Lesson: Runnable code everywhere + multi-path learning**

- Hero section has a runnable code example. Instant gratification.
- "Koans" — gamified learning exercises (borrowed from Zen Buddhism).
  Froth could do something similarly playful with its exercises.
- Tabbed examples: "Simple," "Asynchronous," "Object-oriented," "Functional."
  Shows range without overwhelming.
- Real company case studies with specific outcomes.

### Odin — odin-lang.org
**Lesson: Philosophy-forward positioning**

- "The Data-Oriented Language for Sane Software Development" — a strong
  philosophical stance in the tagline.
- Tabbed code examples on homepage (Hello, Array Programming, SOA, etc.)
  that showcase what makes the language *different*.
- Production credibility through real-world usage (game studios, VFX).
- Froth should similarly lead with what makes it *weird and powerful*,
  not try to look like every other language.

### Bun — bun.sh
**Lesson: Performance as visual storytelling**

- Dark, vibrant design with bold gradients. Energetic, modern feel.
- Performance comparisons shown as visual bar charts, not just text.
- Playful mascot (the bun) adds personality to a deeply technical tool.
- "Prefer" vs "Avoid" code examples with green/red borders — opinionated
  documentation that guides rather than just describes.

### Elixir — elixir-lang.org
**Lesson: Credibility through real-world cases**

- Dedicated "Cases" page with tagged production deployments (Discord,
  Mozilla, PepsiCo).
- "A peek" at syntax on homepage before directing to the Getting Started guide.
- IEx (interactive shell) and Livebook (interactive notebooks) promoted as
  primary learning tools. Interaction-first, like Froth.

### Crystal — crystal-lang.org
**Lesson: The power of a good tagline**

- "A language for humans and computers" — simple, memorable, warm.
- Progressive code examples (8 snippets) that build in complexity.
- Ruby-like syntax positioned as "feels like a dynamic language" despite
  being compiled and typed. Froth needs similar messaging around its
  Forth heritage: "looks like the 70s, thinks like the future."

### Astro — astro.build
**Lesson: Claims backed by real metrics**

- "66% Core Web Vitals passing vs. competitors' 30-48%." Specific data.
- Themes and integrations embedded throughout, not siloed.
- Code-as-marketing: inline examples that demonstrate syntax clarity.

### Deno — docs.deno.com
**Lesson: Documentation architecture**

- Cmd+K command palette for instant navigation.
- Clear section hierarchy: Getting Started -> Fundamentals -> Reference.
- Integrated feedback mechanism (GitHub issues) on every page.
- "On this page" sidebar for long articles.

### Stripe — docs.stripe.com
**Lesson: Task-based navigation for documentation**

- Organized by what you want to *do* (accept payments, manage subscriptions),
  not by API surface area.
- Multi-language code examples with one-click switching.
- The benchmark that all API/reference docs are measured against.

---

## Structural Recommendations for Froth

Based on these references, the Froth site should have:

### Pages / Sections
1. **Homepage** — tagline, 30-second "what is this?", runnable example,
   "Get Started" CTA
2. **Getting Started** — install CLI + VSCode plugin, first program on hardware
3. **The Froth Book** — long-form, chapter-by-chapter guide (like Rust's Book).
   This is where the deep insight lives.
4. **Tutorials** — task-oriented ("Blink an LED", "Read a sensor", "Build a
   calculator", "Write a game")
5. **Reference** — complete word list, memory model, hardware specifics
6. **Playground / REPL** — try Froth in the browser (even if simulated)
7. **Blog** — essays, release notes, stories from the community
8. **Community** — how to get involved, links to Discord/forum/etc.

### Design Principles
- **Warm, not corporate.** Gleam/Svelte energy, not AWS energy.
- **Weird is a feature.** Lean into Froth's Forth heritage and stack-based
  oddity. Make it intriguing, not intimidating.
- **Search is sacred.** Cmd+K global search across all content.
- **Show, don't tell.** Runnable examples, visual demonstrations, animated
  diagrams of the stack.
- **Progressive disclosure.** Simple surface, depth on demand.
- **Opinionated.** Guide people toward good patterns, not just document
  everything neutrally.

### Tone of Voice
- Confident but not arrogant
- Playful but not juvenile
- Technical but not academic
- Warm but not saccharine
- "Your nerdy friend who's genuinely excited to show you this weird thing"

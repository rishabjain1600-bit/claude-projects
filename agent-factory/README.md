# Agent Factory

> A prototype exploring whether AI agents can convert website friction into completed actions — and whether that's a viable business.

---

## What This Is

Agent Factory is a working prototype of a real-time AI checkout recovery system. It injects a script tag into a website, detects when a visitor stalls (e.g. idle at checkout), activates a Claude-powered agent in a chat widget, and — when the visitor confirms — executes a multi-step plan on their behalf: navigating pages, selecting options, and completing the task through real browser clicks.

The prototype was built to answer a bigger question: can you turn any website's human interface into an agentic one? The demo proves the technical pattern works. The research that followed revealed why it probably isn't worth building further — at least not in its current form.

---

## What It Does (The Demo)

1. Visitor lands on a shoe product page, adds to cart, proceeds to checkout
2. Visitor pauses — idle detection fires after a configurable threshold
3. Agent activates in a chat widget: *"Hey — noticed you've been here a bit. Any questions?"*
4. Visitor says they're unsure about sizing
5. Agent thinks (visible in the operator dashboard), checks stock, proposes a size swap
6. Visitor confirms — agent executes: navigates back to product, selects new size, adds to cart, returns to checkout
7. Agent delivers a plain-language summary of what it did
8. Operator dashboard shows every step — behavioral signals, agent reasoning, tool calls, browser actions — in real time via SSE

---

## Running It

```bash
# Install dependencies
npm install

# Add your Anthropic API key
cp apps/dashboard/.env.example apps/dashboard/.env.local
# Edit .env.local and paste your key from https://console.anthropic.com

# Run both apps
npm run dev
# Dashboard: http://localhost:3000
# Demo store: http://localhost:3001
```

**Demo flow:** Open the demo store → browse a product → add to cart → go to checkout → wait ~5 seconds → agent activates → confirm the size swap → watch it execute across pages.

---

## Architecture

```
apps/
├── dashboard/    (port 3000) — operator dashboard + API + track.js server
└── demo-store/   (port 3001) — Next.js shoe store (Sole Society demo)
```

- **`track.js`** — plain JS IIFE served from the dashboard, injected into any site via script tag. Handles idle detection, site map scanning, widget mounting, plan execution, and SSE event pushing. Plans survive full-page navigations via `sessionStorage`.
- **`/api/chat`** — streams Claude responses. Strips `[THINKING]` blocks server-side (pushed to observer panel). Extracts `[ACTION_PLAN]` JSON, executed by track.js client-side.
- **`/api/observer/stream`** — SSE stream per customer key. Dashboard subscribes; track.js pushes events. Anchored to `globalThis` to survive Next.js hot reloads.
- **`checkout-recovery.md`** — the agent system prompt. Defines thinking format, action plan format, sizing flow, forbidden actions (payment fields, submit buttons), and post-execution summary.
- **`supabase/schema.sql`** — full database schema designed but not activated. Prototype uses in-memory store.

**Stack:** Next.js 14 · TypeScript · Anthropic API (Claude Haiku/Sonnet) · Tailwind · SSE · npm workspaces

---

## The Research

Alongside building the prototype, competitive research was conducted across 18 companies in 5 categories to understand the market landscape.

**Categories:** direct chat agents, abandonment/conversion tools, browser automation infrastructure, behavioral analytics platforms, and web personalization.

Full research in [`research/competitive/`](./research/competitive/) — start with [`SUMMARY.md`](./research/competitive/SUMMARY.md).

**The finding:** No product today combines all four of these in a merchant-deployable package:
1. Script-tag install on the merchant's side
2. Behavioral signal ingestion → auto-proposed agents
3. Proactive real-time activation (not visitor-initiated)
4. Multi-step browser execution on the visitor's behalf

The white space is real. But the research also surfaced why it's hard to build a sustainable business here.

---

## Why We Stopped Here

**The window closes fast.** OpenAI (ChatGPT Agent) and Anthropic (Claude for Chrome) already have the browser action technology. The gap isn't structural — it's a product decision away from being closed by either of them. You'd have 12–18 months at best before it's bundled into something merchants already pay for.

**No data moat yet.** The defensible version of this business accumulates behavioral signal data across thousands of sites and builds proprietary pattern detection from it. But you need to survive long enough to build the flywheel, and the window may close first.

**Trust is the hard problem.** Merchants are responsible for their customer relationships. Letting a third-party script take autonomous browser actions on behalf of customers — clicking, navigating, selecting — is a significant ask. One visible mistake gets amplified. Sales cycles in that environment are long.

**Attribution is messy.** If a visitor was already at checkout and the agent helped them complete it, did the agent drive the conversion? Clean attribution is the foundation of outcome-based pricing, and it's genuinely difficult to establish here.

**The big players are the right answer for this.** Intercom, Qualified, and Fibr AI each own a piece of this problem with real distribution. And Anthropic and Google will build the rest. A horizontal agent deployment platform is exactly what gets absorbed or outcompeted by foundation model companies expanding their product surface.

**The better bet:** use agents as internal infrastructure to do something at a cost or speed that was previously impossible — and sell the output, not the agent layer. The agent as engine, not product.

---

Built with [Claude Code](https://claude.ai/claude-code) · [Anthropic API](https://docs.anthropic.com)

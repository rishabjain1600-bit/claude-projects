# Agent Factory

## Commands
- Dashboard: `npm run dev:dashboard` (port 3000)
- Demo store: `npm run dev:store` (port 3001)
- Both: `npm run dev` (monorepo root)
- Restart: `lsof -ti:3000,3001 | xargs kill -9 2>/dev/null; npm run dev > /tmp/af-dev.log 2>&1 &`

After every set of changes, restart both servers automatically without being asked.

## Rules

Do not set CORS headers in `next.config.ts` — route-level only. Duplicate headers break browser preflight.

Do not use `data-*` attributes on `<Script>` tags to pass config — Next.js does not expose them reliably at runtime. Use URL query params (`?key=&idle=&debug=`) injected at serve-time via string replace in the GET handler.

`observerListeners` and `observerBuffers` must be anchored to `globalThis`, not module scope. Next.js hot reloads reset module scope and drop SSE listeners silently.

When a new rule conflicts with an existing one, update in place — no duplicates.

## Maintaining This File

After every prompt, Claude should proactively add to this file any decision or rule that would cause a mistake if forgotten — product decisions, debugging findings, architectural constraints, rejected approaches. Apply the gut check before adding: "If I deleted this, would Claude do something wrong next session?" If maybe or no, don't add it. If yes, add it in one sentence. If it conflicts with an existing rule, update the old rule rather than adding a new one.

---

## Product Vision

What we have is a prototype of a much larger idea. Every decision should build toward this destination.

**The idea:** Any website installs one script tag. The platform ingests visitor behavior — from native tracking and any existing analytics stack (Google Analytics, GTM, Segment, etc.) — and learns what friction looks like for that specific site and business. It detects patterns, then proposes agents to the business operator: triggers that activate those agents when a visitor hits a moment of friction. The business approves. The agent deploys automatically with the right guidelines in place.

When a visitor hits the trigger, the agent activates — converses, understands the issue, creates a plan, and executes on the visitor's behalf via clicks and navigation. It converts part of the website's human interface into an agentic one.

**The barista analogy:** A great coffee barista knows your usual order and starts making it when you walk in. That's what this does for every visitor on any website — not by guessing, but by learning from behavior over time.

**What the prototype already demonstrates:** A visitor pauses at checkout → idle trigger fires → hesitancy detected → checkout agent activates → visitor says the issue (e.g. sizing) → agent creates a plan → agent executes clicks on their behalf to resolve it. This is the pattern. We need to make it extensible to any website and any goal.

**Phase 2 of the vision (longer term):** The platform understands a website's full functionality and recognizes when a visitor wants something the current surface can't provide. It autonomously proposes — and eventually builds — new pages, flows, and UI to fill that gap. Websites that grow organically around their actual users.

---

## Roadmap

### Phase 1 — Product Vision
Define and refine the vision together. This is collaborative — RJ reviews for taste and direction, Claude drafts and updates. Output: a clear product vision document that can be referenced in all future sessions and shared externally.

- What the platform does (the full arc from signal ingestion → pattern detection → agent proposal → deployment → execution)
- Who it's for (any website, any vertical — ecommerce is the first proof point)
- How it's different from what exists
- The principles that guide every build decision

### Phase 2 — Demo
Build a demo that showcases the vision using what we already have. Not a new build — take the prototype and shape it into something that communicates the full idea in under 3 minutes.

- Show the observer panel detecting friction in real time
- Show the agent activating, conversing, and executing a plan
- Show the operator view (dashboard) — what the business sees
- Ideally hint at the "proposal" layer — how the system would surface a detected pattern as a recommended agent

### Phase 3 — Deck
Package the vision and demo into a presentation. Simple, sharp, shows the idea clearly enough to get buy-in from a design partner, investor, or collaborator.

- The problem
- The vision (barista analogy)
- How it works (the platform layers)
- The demo
- Where it goes next

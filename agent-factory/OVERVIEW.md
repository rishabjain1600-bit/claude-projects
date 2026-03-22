# Agent Factory — System Overview

## What Was Built

A real-time AI checkout recovery system. When a customer idles on a checkout page, an AI agent activates in a chat widget, identifies friction (sizing confusion, hesitation), and takes direct UI actions on the customer's behalf — navigating pages, updating cart, selecting sizes — all visible to the customer in real time. A live observer panel on the dashboard shows every step of the agent's reasoning and execution.

---

## Monorepo Structure

```
stealthproject/
├── apps/
│   ├── dashboard/          (port 3000) — operator dashboard + API + track.js server
│   └── demo-store/         (port 3001) — Next.js shoe store (Sole Society demo)
├── CLAUDE.md               — rules and constraints for Claude
└── OVERVIEW.md             — this file
```

---

## Dashboard App (`apps/dashboard`)

### API Routes

| Route | Purpose |
|---|---|
| `GET /track.js` | Serves the injected agent script. Config (key, idle threshold, debug) injected at serve-time via URL params (`?key=&idle=&debug=`). Template literal in `route.ts` — all regex backslashes must be double-escaped (`\\[`, `\\s`, `\\d`) because the template literal strips single backslashes. |
| `POST /api/chat` | Agentic loop. Streams Claude's response, strips `[THINKING]` blocks server-side, extracts `[ACTION_PLAN]` JSON and pushes to observer. Supports tool use (`check_stock`). Model toggled via `AI_MODEL=sonnet` env var (default: Haiku). |
| `POST /api/action-step` | Recovery endpoint. Called by track.js when `waitForElement` times out. Receives `{goal, currentUrl, visibleElements, failedStep, history}`, asks Claude Haiku to generate replacement steps from live DOM scan. |
| `GET /api/observer/stream` | SSE stream per customer key. Dashboard subscribes; track.js pushes events. `observerListeners` and `observerBuffers` must live on `globalThis` (not module scope) — Next.js hot reload resets module scope. |
| `GET /api/agents` | Returns agent configs for a customer key. |
| `GET /api/stock` | `checkStock(productId, size)` — deterministic mock inventory. |

### Agent System Prompt

`src/lib/agents/checkout-recovery.md` — loaded and injected into every chat request via `buildSystemPrompt()`.

Key sections:
- **Thinking block** — `[THINKING]...[/THINKING]` before every response. Stripped server-side, content pushed to observer as `agent_plan` event.
- **Sizing Flow** — steps 1–5 happen in ONE response: identify fit issue, call `check_stock`, offer size swap. Never stop after information alone.
- **Hard Rule** — every response must end with a concrete action offer unless an action was already completed this session.
- **Actions** — `[ACTION_PLAN]{...}[/ACTION_PLAN]` block embedded in response. Parsed by track.js client-side, never shown to customer.
- **Post-Execution Summary** — `[PLAN_COMPLETE]` trigger tells Claude to write a past-tense summary of what was actually done.

### Observer Panel

`src/components/ObserverPanel.tsx` — SSE subscriber. 7-category color system:

| Category | Color | Examples |
|---|---|---|
| User Interactions | slate | `user_click`, `field_focus` |
| Building Context | teal | `page_view`, `size_select`, `cart_add` |
| Pattern & Trigger | amber | `idle_warning`, `agent_activated` |
| Agent Reasoning | violet | `agent_plan` (thinking blocks) |
| Conversation | indigo | `customer_message`, `agent_response` |
| Tool Use | cyan | `tool_call`, `tool_result` |
| Agent Actions | emerald | `cart_step`, `cart_updated` |

---

## track.js — The Injected Agent Script

`src/app/track.js/route.ts` — a TypeScript file that serves a plain JS IIFE as text. Injected into the demo store via a `<Script>` tag with `?key=&idle=&debug=` URL params.

### Key Outer-Scope Variables

```js
var agentConfigs = [];        // loaded from /api/agents
var widgetActive = false;
var sessionContext = {};       // cart, product, size — builds as user navigates
var activeAgent = null;        // ref for post-plan widget remount
var activePageContext = {};
var activeMessages = [];       // full conversation history (shared ref)
var agentExecuting = false;    // true during plan click steps — suppresses passive listeners
```

### Lifecycle

```
init()
  └── clear af_chat_history (unless mid-plan or post-plan)
  └── restore siteMap from sessionStorage
  └── loadAgents() → if af_pending_summary exists → mountWidget()
  └── trackPageView(), pushToObserver(session_start)
  └── idle detection listeners
  └── click event listeners (suppressed when agentExecuting = true)
  └── resumePendingPlan()     ← picks up cross-page plan execution
```

### Idle → Trigger → Widget

```
resetIdle() → startIdleTracking() → checkTriggers()
  └── matchesTrigger() → activateAgent(agent)
      └── observer events (pattern_match, friction_classified, agent_activated)
      └── mountWidget(agent, pageContext)
```

### Sense-Plan-Act Loop

**Claude generates the plan** — when customer confirms an action, `sendToAgent()` sends the conversation to `/api/chat`. Claude's response contains:

```
[ACTION_PLAN]
{"goal":"...","steps":[...],"completionMessage":"..."}
[/ACTION_PLAN]
```

**track.js extracts the plan** — `read()` accumulates the full streamed response, detects `[ACTION_PLAN]` regex on stream end, parses JSON, saves to `af_pending_plan` sessionStorage, calls `resumePendingPlan()`.

**Execution state machine** — survives full-page navigations via sessionStorage:

```
af_pending_plan = { goal, steps, currentStep, completionMessage }

executeStep(plan):
  navigate  → save incremented step → setTimeout(600) → window.location.href
  click     → waitForElement(selector, 3000)
               → scrollIntoView + indigo ring highlight (600ms)
               → agentExecuting = true → el.click() → agentExecuting = false
               → save incremented step → setTimeout(900) → executeStep(next)
  complete  → clearPlan() → set af_pending_summary → mountWidget()

resumePendingPlan():  ← called at end of every init()
  → reads af_pending_plan → setTimeout(300) → executeStep()
```

**Agent banner** — fixed dark indigo top bar (`#312e81`) with spinner. Shows current step description. Visible on all pages during execution.

**Forbidden actions** — checked before every click, hard-blocked in track.js (not just system prompt):
```js
var FORBIDDEN_SELECTORS = [
  '[data-af-submit]', 'button[type="submit"]',
  '#card-number', '#cvv', '#expiry', '[data-af-saved="saved_payment"]'
];
```

**Recovery** — if `waitForElement` times out, `recoverPlan()` scans the DOM via `scanVisibleElements()`, POSTs to `/api/action-step`, splices Claude's replacement steps into the plan.

### Site Map

`scanPageForSiteMap()` runs 400ms after every page load. Scans links, buttons, size selectors, product links. Persisted to `af_site_map` sessionStorage and merged across navigations. Sent to Claude in every request so it can generate accurate selectors for pages it hasn't seen yet.

### Chat History

`af_chat_history` in `sessionStorage` (clears on tab close = clean new sessions).

- Cleared at start of `init()` UNLESS `af_pending_plan` or `af_pending_summary` exists
- Saved after every user message and every agent response (internal `[...]` trigger messages filtered out)
- Restored in `mountWidget()` — renders previous bubbles + populates messages array for Claude context

### Post-Plan Summary

After `complete` step:
1. `af_pending_summary = { goal, steps[] }` saved to sessionStorage
2. Widget mounted immediately (uses `agentConfigs[0]` — already loaded by this point)
3. `mountWidget` detects `af_pending_summary` → pushes `[PLAN_COMPLETE]` trigger to messages → calls `sendToAgent()`
4. Claude responds with past-tense summary, streamed live into widget
5. `showInputRow()` — agent waits for next customer message

### Widget Session Logic

| Condition | Widget Behavior |
|---|---|
| Fresh page load / refresh | `af_chat_history` cleared, widget stays closed, idle trigger opens it clean |
| Mid-plan navigation | History preserved, banner shows, `resumePendingPlan` continues |
| Post-plan (af_pending_summary) | Widget opens immediately with history + Claude summary |
| Returning to page mid-session | History restored, input shown, no new greeting |

### CSS Isolation

Widget styles injected via `<style>` tag with `!important` on key backgrounds (`af-card`, `af-header`, `af-messages`, `af-bubble-agent`) to beat the demo store's Tailwind `bg-white` body reset.

---

## Demo Store (`apps/demo-store`)

Standard Next.js app. Pages: `/`, `/product/[id]`, `/cart`, `/checkout`, `/order-confirmation`.

### Data Attributes Used by track.js

| Attribute | Element | Purpose |
|---|---|---|
| `data-action="add-to-cart"` | Button | Cart add detection + agent click |
| `data-action="edit-cart"` | Button | Cart remove detection + agent click |
| `data-af-size="{size}"` | Size button | Size selection + agent click |
| `data-af-submit` | Place Order button | **FORBIDDEN** — blocked in track.js |

### Script Injection

```html
<Script src="http://localhost:3000/track.js?key=CUSTOMER_KEY&idle=20&debug=true" />
```

---

## Known Constraints & Decisions

- **Regex in template literal**: all backslashes must be `\\` — single `\` gets stripped (e.g. `\\[`, `\\s`, `\\d`, `\\/`)
- **CORS**: headers set at route level only (`Access-Control-Allow-Origin: http://localhost:3001`). Never in `next.config.ts`.
- **globalThis for SSE**: `observerListeners` and `observerBuffers` anchored to `globalThis` — Next.js module scope resets on hot reload
- **No data-* on Script tags**: Next.js doesn't expose them at runtime. Config via URL params only.
- **agentExecuting flag**: prevents passive click listeners (`size_select`, `cart_add`, `user_click`) from double-firing when agent clicks elements
- **loadAgents race**: `af_pending_summary` check in `loadAgents` is a fallback only. Primary path mounts widget directly from `executeStep` `complete` case using `agentConfigs` (already populated by then)
- **ACTION_PLAN stripping**: server strips thinking blocks only; `[ACTION_PLAN]` block streams through to client, client strips and executes
- **max_tokens: 2048**: required for ACTION_PLAN JSON to not get truncated mid-stream

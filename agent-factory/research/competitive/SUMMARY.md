# Competitive Research Summary
*18 companies across 5 categories. Last updated March 2026.*

---

## The Landscape at a Glance

| Company | Category | Threat | Biggest gap |
|---|---|---|---|
| Intercom / Fin | AI support chat | **Med-High** | No browser-side actions — converses but can't act |
| Fibr AI | Agentic personalization | **Med-High** | Changes content, doesn't act for the visitor |
| Qualified / Piper | AI SDR (B2B) | **Medium** | B2B only, no browser actions |
| Redscope AI | B2B conversion agents | **Medium** | B2B only, action capability unclear |
| ChatGPT Agent | Consumer browser agent | **Medium** | User-side tool — merchant can't deploy |
| Anthropic Claude for Chrome | Consumer browser agent | **Medium** | User-side tool — merchant can't deploy |
| Pendo | Product analytics + guidance | **Medium** | Internal AI only, not visitor-facing |
| Tidio / Lyro | SMB chat | **Low-Med** | Reactive only, no proactive triggers |
| FullStory | Session analytics | **Low-Med** | Insight only, no intervention |
| Quantum Metric | Digital analytics | **Low-Med** | Insight to internal teams, not visitors |
| Klaviyo | Email/SMS automation | **Low** | Post-abandonment only, no on-site presence |
| Drift / Salesloft | B2B chat (acquired) | **Low** | Absorbed into sales stack |
| Browserbase + Stagehand | Browser infra | **Low** | Developer infra, no merchant product |
| browser-use | OSS browser SDK | **Low** | Developer tooling only |
| MultiOn | Web action API | **Low** | Developer API, no merchant embed |
| Skyvern | Browser automation | **Low** | Internal ops automation, not visitor-facing |
| Recart | SMS marketing | **Low** | Post-abandonment messaging only |
| CartHook | Checkout optimization | **Low** | Data capture only, no AI agent |
| Optimizely | Web experimentation | **Low** | Human-designed tests, enterprise-only |
| VWO | A/B testing / CRO | **Low** | Testing tool, weeks not seconds |

---

## The White Space: Four Things Nobody Does Together

After researching 18 companies across 5 categories, no product combines all four of these:

**1. Merchant-side deployment (script install)**
Klaviyo, FullStory, Intercom, Fibr all install via script — so merchants control deployment. But ChatGPT Agent and Claude for Chrome (which have the browser action capability) operate from the consumer's tool stack. You can't deploy them for your visitors.

**2. Behavioral signal ingestion → auto-proposed agents**
FullStory and Pendo observe friction. Klaviyo uses behavior for email triggers. Nobody takes that signal stream and automatically proposes "here is the agent you should deploy here, and here is its trigger condition" to the business operator. Every product requires humans to design the intervention.

**3. Real-time proactive activation (not visitor-initiated)**
Intercom, Tidio, Qualified — all wait for the visitor to open chat. Zero products in this research proactively activate on detected behavioral friction from the merchant side. The closest is Fibr (changes content based on signals) but that's not an agent conversation.

**4. Multi-step browser execution on the visitor's behalf**
Intercom can hit backend APIs. Fibr can change page content. ChatGPT Agent can click and navigate — but only when the visitor asks it to. No merchant-embeddable product takes a plan, executes clicks, navigates pages, and fills forms on the visitor's behalf to complete a task for them.

**The combination is the moat.** Each individual capability exists somewhere. Nobody has combined them into a merchant-deployed product.

---

## Category Takeaways

### Direct Chat Agents
The most battle-tested category. Intercom has massive distribution with per-resolution pricing that validates willingness to pay. The gap: they converse but cannot act in the browser. Qualified's $68K/year price point shows enterprise appetite. Tidio validates that SMB ecommerce will pay for Claude-powered chat.

### Abandonment & Conversion
Completely post-abandonment — no real-time play in the entire category. The behavioral data (Klaviyo's cart events) and the audience (ecommerce operators) are there; the intervention layer is not. Low competitive threat, high strategic opportunity.

### Browser Automation
The infrastructure wave. $57.5M raised in 2025 alone (Browserbase + browser-use). The technology is proven and commoditizing. The product layer on top is the gap. OpenAI and Anthropic have the consumer-side capability. Nobody has the merchant-side product.

### Behavioral Analytics
Observation without activation. Every platform ends at insight and recommendation — the fix still requires human product teams and sprint cycles. FullStory's StoryAI and Quantum Metric's Felix Agentic are getting closest to the activation layer, but recommendations still go to internal teams.

### Web Personalization
**Fibr AI is the most important competitor to watch.** Same thesis (agentic web), same acquisition model (script + behavioral signals), same investor (Accel). They're solving the pre-click moment with content adaptation; we solve the in-session moment with agent action. If they pivot toward conversation + execution, they're the most direct competitor.

---

## Strategic Implications

**Watch most closely:**
- Fibr AI — same thesis, moving in the same direction
- Intercom — if they add browser action capability, immediate direct competition
- Browserbase — if they launch a merchant-facing product

**Pricing anchors from the research:**
- $0.99/resolution (Intercom Fin) — per-outcome model, buyers understand it
- $68K/year (Qualified) — enterprise appetite for real-time visitor AI
- Outcome-based (Redscope) — no upfront risk, smart for early adoption

**The narrative that opens doors:**
Every platform in this research solves half the problem. Analytics tools find the friction but can't fix it. Chat tools converse but can't act. Browser agents act but are user-side tools the merchant can't deploy. Agent Factory is the first to close the loop: detect → propose → deploy → converse → act.

---

## Files in This Folder

| File | What's inside |
|---|---|
| `direct-chat-agents.md` | Qualified, Intercom, Drift, Tidio |
| `abandonment-conversion.md` | Klaviyo, Recart, CartHook |
| `browser-automation.md` | ChatGPT Agent, Claude for Chrome, Browserbase, browser-use, MultiOn, Skyvern |
| `behavioral-analytics.md` | FullStory, Hotjar/Contentsquare, Heap, Pendo, Quantum Metric |
| `web-personalization.md` | Fibr AI, Optimizely, VWO, Redscope AI |
| `TEMPLATE.md` | Prompt format for future research runs |

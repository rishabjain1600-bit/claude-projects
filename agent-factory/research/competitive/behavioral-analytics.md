# Competitive Research: Behavioral Analytics Platforms
*Tools that observe, record, and analyze visitor behavior on websites*

---

### FullStory
**Website:** fullstory.com
**Category:** Digital Experience Analytics / Session Intelligence
**Funding:** Series E, $105M total raised. Backed by Permira, GV, Kleiner Perkins.
**Pricing:** Free → Business ($199/month) → Advanced ($499/month, real cost typically $500–$1,000+/month) → Enterprise (custom, median $27,500/year, range $9,961–$105,630/year based on Vendr data). Session-volume based pricing.

**What they do**
FullStory captures full session replays with pixel-perfect DOM accuracy, plus behavioral analytics (rage clicks, dead clicks, error clicks). StoryAI (powered by Google Gemini) auto-analyzes sessions, surfaces frustration signals, generates session summaries, and proactively flags spiking issues via "StoryAI Opportunities." Positions toward agentic AI that "proactively highlights issues and provides recommendations."

**What they do NOT do**
- Detects and reports friction — does not act on it
- Produces dashboards for product/UX teams to analyze; the fix loop is human → sprint planning → shipped weeks later
- Does not propose or deploy AI agents in response to detected friction
- Does not intervene in real-time to help a struggling visitor
- No visitor-facing conversational or autonomous agent
- StoryAI is an analytics assistant for internal teams, not a visitor-facing tool

**ICP fit**
Mid-market to enterprise product, UX, and digital experience teams. Buyer is VP Product or Head of CX/UX. Significant minimum investment — not SMB.

**Competitive threat to us**
Low-Medium — they observe the same behavioral signals we want to act on. If they added a real-time activation layer (auto-deploy an agent when StoryAI detects friction), they'd be a natural extension. Not their current direction.

**Key quote or signal**
StoryAI Opportunities "proactively highlights issues and provides recommendations" — but recommendations go to internal teams, not to the visitor in the moment. The gap between insight and intervention is exactly what we close.

---

### Hotjar / Contentsquare
**Website:** hotjar.com / contentsquare.com
**Category:** UX Research & Digital Experience Analytics
**Funding:** Contentsquare raised $600M+ total. Hotjar acquired by Contentsquare in 2021. Fully merged July 1, 2025.
**Pricing:** Hotjar free plan available. Paid plans from $32/month. Contentsquare enterprise pricing custom (significant investment). Now unified billing under Contentsquare.

**What they do**
Hotjar (now fully merged into Contentsquare) provides heatmaps, session recordings, surveys, and feedback widgets. Contentsquare adds experience analytics, product analytics, and an AI "Sense" CoPilot that provides insights and recommended next steps. The merged platform offers AI summaries of session replays and automatically surfaces friction without manual review.

**What they do NOT do**
- Observation and insight tool only — no activation layer
- AI CoPilot gives recommendations to internal teams, not to visitors
- No real-time visitor intervention
- No autonomous browser actions
- The loop from "insight" to "fix" still runs through human sprint cycles
- Surveys and feedback are passive (visitor must respond), not proactive

**ICP fit**
UX researchers, product managers, and digital experience teams across company sizes. Hotjar historically SMB/mid-market; Contentsquare enterprise.

**Competitive threat to us**
Low — purely an observation and research tool. Their AI development is toward analytics intelligence, not visitor-facing agents.

**Key quote or signal**
The Hotjar-Contentsquare full merger in July 2025 creates a larger but still observation-only platform. No signal of moving toward real-time intervention or visitor-facing AI.

---

### Heap (now part of Contentsquare)
**Website:** heap.io
**Category:** Product Analytics / Auto-Capture Behavioral Data
**Funding:** Acquired by Contentsquare in 2023. Previously raised $95M Series D.
**Pricing:** Free (up to 10K monthly sessions) → Growth ($2,500 for 500K sessions) → Pro ($100K/year for 5M sessions) → Premier ($187,500+/year for 15M+ sessions). Session Replay add-on $5K/year. Now part of Contentsquare unified billing.

**What they do**
Heap auto-captures every user interaction (clicks, taps, swipes, form fills) without instrumentation code — retroactive analysis of any behavior. Full behavioral data lake for any user journey. Now integrated with Hotjar within Contentsquare. AI features in development.

**What they do NOT do**
- Observation and analysis only — no intervention layer whatsoever
- No AI agent deployment
- No real-time visitor activation
- No conversational interface
- No browser-side actions on the visitor's behalf
- The retroactive analysis strength is also its weakness — it looks backward, not forward in real time

**ICP fit**
Product and data teams at SaaS companies and digital businesses. Buyer is Head of Product Analytics or VP Product. Enterprise-grade pricing.

**Competitive threat to us**
Low — Heap is data infrastructure for internal analytics teams. No product vision toward visitor-facing agents.

**Key quote or signal**
Heap's core value prop is "capture everything, analyze anything retroactively" — the polar opposite of real-time intervention. The data exists in Heap to see where friction happens; Agent Factory is what you deploy to fix it in the moment.

---

### Pendo
**Website:** pendo.io
**Category:** Product Analytics + In-App Guidance
**Funding:** Late-stage private. Raised $100M Series F in 2021. Total ~$356M.
**Pricing:** Free (up to 1,000 MAU) → Growth (custom) → Portfolio (custom enterprise). Agent Analytics made free to all customers (December 2025).

**What they do**
Pendo combines product analytics (page views, feature usage, funnels) with in-app guidance (tooltips, walkthroughs, banners) and NPS surveys. In 2025, launched two AI initiatives: (1) "Agent Mode" — an internal AI analyst that autonomously runs queries in Pendo; (2) "Agent Analytics" (GA December 2025) — measures performance and usage of AI agents built by customers in their own products. Automatically detects usage drops, frustration spikes, and friction points.

**What they do NOT do**
- Agent Mode is an internal analytics assistant — not a visitor-facing agent
- Agent Analytics measures third-party agents — does not build or deploy them
- In-app guidance (tooltips, walkthroughs) is manually configured by product teams, not auto-proposed by AI
- Does not propose agents based on detected friction and auto-deploy them
- Primarily SaaS/product analytics — not ecommerce or consumer checkout
- Cannot execute browser-side actions on behalf of visitors

**ICP fit**
SaaS product teams. Buyer is VP Product or Head of Product Analytics. Enterprise and growth-stage SaaS.

**Competitive threat to us**
Medium — Pendo is building toward "agentic product experience" and has the behavioral data. If they add a visitor-facing auto-proposed agent layer, they'd be a conceptual competitor in SaaS. But their Agent Analytics product is about measuring agents, not deploying them.

**Key quote or signal**
"Agent Analytics is now GA — the first tool built to measure, govern, and grow your AI agents." They're positioning to own the analytics layer above AI agents — measuring them rather than building them. This is a different bet than ours but worth watching.

---

### Quantum Metric
**Website:** quantummetric.com
**Category:** Digital Analytics + Continuous Product Design
**Funding:** Series B, $200M raised in 2021. Unicorn at $1B+ valuation.
**Pricing:** Custom enterprise only. Significant investment — primarily F500 and enterprise digital teams.

**What they do**
Quantum Metric is a continuous product design platform with session replay, behavioral analytics, and Felix AI — an autonomous insight engine that surfaces customer experience issues, quantifies business impact, and provides recommendations. Felix Agentic (launched 2025) turns insights into suggested actions. Felix AI adoption reached 25% of largest enterprise customers in 2025, with 400% usage growth in the first four months of 2025.

**What they do NOT do**
- Felix AI surfaces insights for internal teams — does not deploy fixes or agents to live sessions
- No real-time visitor intervention
- No visitor-facing conversational or action-taking agent
- Felix Agentic suggests actions to product teams, not to visitors
- Enterprise-only pricing — not accessible to mid-market or SMB

**ICP fit**
F500 digital teams: retail, financial services, travel, telecom. Buyer is VP Digital or SVP CX. Six-figure annual contracts.

**Competitive threat to us**
Low-Medium — Felix Agentic is moving toward "insight to action" but the action recipient is the internal team, not the visitor. The enterprise-only positioning means no overlap with our early-stage ecommerce target.

**Key quote or signal**
"Felix Agentic helps firms turn insights into action" — but the action is a recommendation to a product manager, not an autonomous agent helping a visitor. Quantum Metric is a step closer to the vision but still falls short of the activation layer.

---

## Summary Table

| Company | Category | Pricing model | Biggest gap vs Agent Factory | Threat level |
|---|---|---|---|---|
| FullStory | Session analytics | Usage-based SaaS, $27K median/year | Insight only, no visitor intervention | Low-Medium |
| Hotjar / Contentsquare | UX research | Freemium → enterprise | Observation only, no real-time activation | Low |
| Heap | Product analytics | Session-volume SaaS | Retroactive data capture, no activation | Low |
| Pendo | Product analytics + guidance | Custom enterprise | Internal analytics AI, not visitor-facing | Medium |
| Quantum Metric | Digital analytics | Custom enterprise | Internal recommendations, not visitor agents | Low-Medium |

## Strategic Implications

**Biggest short-term threat:** Pendo — they have the behavioral data, the guidance infrastructure, and are actively building toward "agentic product experience." If they add auto-proposed visitor-facing agents, they'd have a head start in SaaS.

**Most likely to move into our space:** FullStory — StoryAI already detects friction and "proactively recommends." The natural next step is to stop recommending to internal teams and start deploying an agent to the visitor. A single product pivot.

**Clearest white space we can own:** The activation layer. Every tool here is brilliant at finding where friction was. None of them deploy a fix at the moment of friction. They feed product backlogs; we skip the backlog entirely.

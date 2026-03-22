# Competitive Research: Browser Automation & AI Agents
*Tools that control browsers — infrastructure, user-side agents, and developer SDKs*

---

### OpenAI ChatGPT Agent (formerly Operator)
**Website:** openai.com
**Category:** Consumer AI Browser Agent
**Funding:** OpenAI has raised $17.9B+ total. ChatGPT Pro at $200/month.
**Pricing:** ChatGPT Agent available to Pro subscribers ($200/month). Operator was deprecated August 31, 2025 and merged into ChatGPT Agent.

**What they do**
OpenAI launched Operator (Jan 2025) as an autonomous browser agent powered by Computer Using Agent (CUA) — combining GPT-4o vision with reinforcement learning to click, type, scroll, and navigate any website. By July 2025, it was merged into ChatGPT Agent, unifying browser control with deep research and conversational AI. Users delegate tasks like "book me a restaurant" or "order groceries" directly from ChatGPT.

**What they do NOT do**
- Operates entirely from the consumer's ChatGPT interface — a merchant cannot embed or deploy it on their site
- The website operator has zero control, visibility, or configuration ability
- No merchant-facing SDK, script embed, or API for site deployment
- No automatic friction detection — the user must initiate every task
- No behavioral analytics integration or pattern learning on the merchant side

**ICP fit**
ChatGPT Pro subscribers ($200/month) — power users, professionals, technically sophisticated consumers. This is a user-side tool, not a merchant-side one.

**Competitive threat to us**
Medium — not a direct competitor today, but if OpenAI releases a merchant-embeddable version, it would be extremely well-resourced competition. The structural direction (consumer AI assistant doing tasks) is different from ours (merchant deploys agent to help their visitors).

**Key quote or signal**
Operator deprecated and absorbed into ChatGPT Agent in August 2025 — OpenAI is consolidating toward a single agentic surface for consumers. No signal of a merchant-facing product.

---

### Anthropic Computer Use / Claude for Chrome
**Website:** anthropic.com
**Category:** Consumer AI Browser Agent / Developer API
**Funding:** $7.3B+ total raised. Valued at $61.5B (2024).
**Pricing:** Computer Use API: pay-per-token (developer API). Claude for Chrome: available in beta on paid plans from $20/month (Pro), limited to Haiku 4.5 on Pro. Max plan users get more capable models.

**What they do**
Anthropic offers two browser-control products: (1) Computer Use API — lets developers direct Claude to control desktops/browsers via screenshots and actions; (2) Claude for Chrome — a Chrome sidebar agent (launched Aug 2025 as research preview, ~1,000 initial testers) that can navigate websites, read screens, click buttons, fill forms, manage tabs, and complete multi-step workflows on behalf of the user. Claude Sonnet 4.5 leads on OSWorld benchmark at 61.4%.

**What they do NOT do**
- Claude for Chrome is user-side — requires the visitor to have an Anthropic paid account
- Merchants cannot embed or deploy it on their site
- No merchant-facing script embed or SDK for visitor-side deployment
- No automatic trigger from behavioral friction — user must activate it
- Prompt injection vulnerability noted (attack success rate 11.2% even after mitigations)

**ICP fit**
Claude for Chrome: Anthropic Max/Pro subscribers. Computer Use API: developers building automation tools.

**Competitive threat to us**
Medium — same underlying technology (Claude) but structurally different deployment model. Agent Factory is built on Claude's API. If Anthropic released a merchant-embeddable browser agent product, they'd be a direct competitor with first-mover advantage on the model.

**Key quote or signal**
Claude Sonnet 4.5 leads on OSWorld at 61.4% — the underlying browser-action capability is now production-grade. We're already using this model's API. The gap between "Claude can do this" and "a merchant can deploy this to their visitors" is exactly what Agent Factory fills.

---

### Browserbase + Stagehand
**Website:** browserbase.com / stagehand.dev
**Category:** Browser Automation Infrastructure / Developer SDK
**Funding:** $67.5M total ($40M Series B, June 2025). Led by Notable Capital + Kleiner Perkins + CRV. Valued at $300M.
**Pricing:** Free tier → Developer $20/month → Startup $99/month → Scale (custom). 1.3M+ Stagehand downloads/month.

**What they do**
Browserbase is cloud browser infrastructure — "AWS for headless browsers" — serving 50M+ browser sessions. Stagehand is their open-source natural-language browser automation SDK (act/extract/observe primitives) built on Playwright. Director (launched with Series B) is a no-code workflow builder for non-technical users. Developers use Browserbase to run browser agents at scale in the cloud.

**What they do NOT do**
- Pure developer infrastructure — not a merchant-facing product
- Does not embed into websites to help visitors
- No behavioral analytics integration, no friction detection, no auto-proposed agents
- Requires engineering effort to build any use case on top of it
- No visitor-facing conversational interface

**ICP fit**
Developers and engineering teams building browser automation workflows. Buyers are CTOs, engineers, and technical product managers.

**Competitive threat to us**
Low (today) — infrastructure layer, not a product layer. But they could move up the stack and build a merchant-facing product. Their Series B thesis ("demand for AI web automation accelerates") is the same market we're entering.

**Key quote or signal**
$40M Series B validates that browser automation infrastructure is now enterprise-investable. If Browserbase launches a merchant product, they'd be well-funded competition. Worth watching closely.

---

### browser-use
**Website:** browser-use.com
**Category:** Open-Source Browser Automation Library
**Funding:** $17M seed (March 2025). Led by Felicis Ventures. YC W25. Participants: A Capital, Nexus, Paul Graham, YC.
**Pricing:** Open-source (free). Hosted API in development.

**What they do**
browser-use is a Python library that connects any LLM to a real browser for autonomous task completion. It converts website interfaces into structured text that LLMs can process deterministically. 50,000+ GitHub stars, 15,000+ active developers. Used by Manus (the viral Chinese AI assistant) to drive massive awareness.

**What they do NOT do**
- Developer tooling only — no merchant-facing product
- No visitor behavioral analytics or friction detection
- No merchant script embed
- No conversational interface for end visitors
- Requires Python engineering to deploy any use case

**ICP fit**
Developers, researchers, and companies building AI automation pipelines. Not accessible to non-technical operators.

**Competitive threat to us**
Low — pure tooling. But it validates the infrastructure is now cheap and accessible. Anyone can build a browser agent today; the value is in the product layer on top.

**Key quote or signal**
$17M at YC in March 2025 — the investor community is actively funding browser automation infrastructure. The space is real. The product layer (what we're building) is the next wave.

---

### MultiOn
**Website:** multion.ai
**Category:** AI Web Agent API / "Motor Cortex for AI"
**Funding:** Seed stage. Private. YC-backed.
**Pricing:** Not publicly disclosed. Developer API with free tier.

**What they do**
MultiOn is an API that enables AI applications to take autonomous actions on the web — shopping, booking, form-filling, scheduling — using natural language. Positions itself as the "Motor Cortex" layer: the execution engine that other AI products call to complete web-based tasks. Supports concurrent autonomous agents.

**What they do NOT do**
- Developer/API product — not a merchant-facing embed
- No merchant script deployment for visitor help
- No visitor behavioral signal detection
- No on-site conversational interface
- Operated by software calling an API, not by visitors or merchants

**ICP fit**
Developers building AI assistants and agents that need web action capability. Not accessible to non-technical operators.

**Competitive threat to us**
Low — tooling layer. Could potentially be used as a component in a competing product but is not a direct competitor.

**Key quote or signal**
"Motor Cortex for AI" positioning is interesting — execution is the hardest part and they're commoditizing it as an API. Agent Factory's moat is not just the execution layer but the behavioral learning, trigger proposal, and merchant deployment workflow above it.

---

### Skyvern
**Website:** skyvern.com
**Category:** LLM + Computer Vision Browser Automation
**Funding:** $2.7M seed (December 2025). YC S23.
**Pricing:** Free (1,000 credits) → Hobby $29/month → Pro $149/month (150K credits) → Enterprise custom. Open-source + cloud hosted.

**What they do**
Skyvern automates browser-based workflows using LLMs and computer vision — takes screenshots, uses Vision-LLM to identify visual elements, and interacts with them. Playwright-compatible SDK plus a no-code workflow builder. Achieves 85.8% on WebVoyager benchmark. Designed for B2B internal workflow automation: purchasing, procurement, data extraction across any website.

**What they do NOT do**
- B2B internal automation — companies use it to automate their own tasks, not to serve website visitors
- No merchant-side script embed for visitor help
- No real-time visitor behavioral trigger
- No visitor-facing conversational interface
- Focused on backend/operational automation, not conversion

**ICP fit**
Operations teams, procurement, developers automating repetitive browser tasks internally. Not a consumer-facing or visitor-conversion product.

**Competitive threat to us**
Low — entirely different use case (internal ops automation vs. visitor conversion). But their no-code workflow builder is the right direction for non-technical operator configuration.

**Key quote or signal**
Skyvern's no-code workflow builder is the right UX pattern for making browser automation accessible to non-engineers — Agent Factory should have a similar interface for operators configuring agent behavior.

---

## Summary Table

| Company | Category | Pricing model | Biggest gap vs Agent Factory | Threat level |
|---|---|---|---|---|
| ChatGPT Agent (OpenAI) | Consumer browser agent | $200/month subscription | User-side only, merchant can't deploy | Medium |
| Claude for Chrome (Anthropic) | Consumer browser agent | $20–$200/month subscription | User-side only, merchant can't deploy | Medium |
| Browserbase + Stagehand | Infrastructure | Usage-based SaaS | Developer infra, no merchant product | Low |
| browser-use | Open-source SDK | Free / API | Developer tooling only | Low |
| MultiOn | Web action API | API pricing | Developer API, no merchant embed | Low |
| Skyvern | Browser automation | $29–$149/month | Internal ops use case, no visitor conversion | Low |

## Strategic Implications

**Biggest short-term threat:** OpenAI ChatGPT Agent and Anthropic Claude for Chrome — if either releases a merchant-embeddable version, they'd have massive distribution advantages. Neither has signaled this direction, but it's the most logical extension of their products.

**Most likely to move into our space:** Browserbase — they have the infrastructure, the funding, and the explicit thesis around AI web automation. A merchant-facing product built on their stack is a natural evolution.

**Clearest white space we can own:** The merchant deployment layer. Every player here either operates from the consumer's side (OpenAI, Anthropic) or from the developer's internal tooling side (Browserbase, Skyvern). Nobody has built a turnkey "install this script on your site and your visitors get an AI agent that acts for them" product. That's the gap.

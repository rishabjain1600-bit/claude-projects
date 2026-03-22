# Competitive Research: Direct Chat Agents
*Companies that deploy AI agents to website visitors in real time*

---

### Qualified / Piper
**Website:** qualified.com
**Category:** AI SDR / Conversational Marketing
**Funding:** Backed by Sapphire, Tiger Global, Norwest, Redpoint, Salesforce Ventures. Total undisclosed but well-capitalized.
**Pricing:** Starts ~$42K/year. Piper AI SDR starts at $68K/year list price. Custom enterprise quotes only — three tiers (Premier, Enterprise, Ultimate).

**What they do**
Qualified deploys Piper, an AI SDR agent on B2B marketing websites. Piper qualifies inbound visitors in real time using firmographic data, intent signals, and Salesforce CRM context — no rigid playbooks. It engages visitors in chat, qualifies them, and books meetings with sales reps autonomously. PiperX (launched Aug 2025) adds voice and video conversations.

**What they do NOT do**
- Exclusively B2B and lead-gen focused — not built for ecommerce or consumer checkout
- Cannot take actions inside the browser on the visitor's behalf (navigate, click, fill forms)
- Does not ingest GA4/GTM behavioral signals to auto-propose new agent types
- Does not detect general UX friction — detects buying intent for sales qualification only
- No multi-step browser action execution

**ICP fit**
B2B SaaS and enterprise companies with inbound website traffic. Buyer is VP Marketing or Head of Demand Gen. Minimum viable use case requires Salesforce CRM.

**Competitive threat to us**
Medium — they own the "merchant-deployed real-time agent" space for B2B but cannot act in the browser, and have no play in ecommerce or consumer web.

**Key quote or signal**
Qualified unveiled Piper 2025 as "the world's most advanced AI SDR," focused on autonomous pipeline growth — doubling down on B2B, not expanding into browser actions or consumer conversion.

---

### Intercom / Fin AI
**Website:** intercom.com / fin.ai
**Category:** AI Customer Support Agent
**Funding:** Series D, $241M total raised. Profitable as of 2023.
**Pricing:** Platform from $29/month. Fin AI: $0.99 per successful resolution. Charged only for resolutions and successful procedure handoffs — never for failed outcomes or human escalations.

**What they do**
Intercom's Fin is a merchant-deployed AI support agent embedded via script on any website. It answers customer questions using knowledge bases, can execute backend API actions (check order status, update a shipping address, modify a subscription), and achieves ~67% automated resolution rate. Claims 40M+ resolved conversations.

**What they do NOT do**
- Cannot navigate the website or take actions in the browser DOM on the visitor's behalf
- Cannot click buttons, fill forms, or complete checkout flows for the user
- Does not auto-detect friction patterns and deploy itself — requires manual configuration of workflows
- Does not integrate GA4/GTM signals to propose new agent types
- Focused on support resolution, not conversion completion

**ICP fit**
Any company with customer support volume — SMB to enterprise. Buyer is VP Support or Head of CX. Strong in SaaS, ecommerce, fintech.

**Competitive threat to us**
Medium-High — they own "merchant-deployed conversational agent" and have massive distribution, but the product is support-first and cannot execute browser-side actions for visitors.

**Key quote or signal**
Per-resolution pricing at $0.99 with no platform charge validates the market's willingness to pay for resolved outcomes. Their model is a useful pricing anchor for Agent Factory.

---

### Drift (now part of Salesloft)
**Website:** salesloft.com/drift
**Category:** Conversational Marketing / Revenue Orchestration
**Funding:** Drift acquired by Salesloft, February 2024. Salesloft raised $100M Series D in 2021.
**Pricing:** Custom enterprise. Salesloft plans start ~$75–$125/user/month. Drift-specific pricing absorbed into Salesloft platform.

**What they do**
Drift was a B2B conversational marketing platform — rule-based chatbots that qualify leads and route to sales. After the Salesloft acquisition, Drift's capabilities merged into Salesloft's Rhythm platform (powered by Conductor AI). Added "Bionic Chatbots" (GPT-integrated) that generate contextual responses and adapt to visitor behavior. Claims 50% more opportunities with 45% fewer meetings for early adopters.

**What they do NOT do**
- Playbooks remain primarily rule-based — AI enhancement is relatively shallow
- B2B/revenue team focus — no ecommerce or consumer use case
- No browser-side actions on visitor's behalf
- No behavioral pattern learning or auto-proposed agents
- Now a feature within a sales engagement platform, not a standalone product

**ICP fit**
Enterprise B2B sales teams. Buyer is VP Sales or RevOps. Now deeply tied to Salesloft CRM ecosystem.

**Competitive threat to us**
Low — the acquisition effectively removed Drift as an independent competitor. Its direction is deeper into B2B sales workflows, not browser automation or ecommerce conversion.

**Key quote or signal**
Forrester noted the acquisition moves Drift "deeper into the revenue orchestration stack" — further away from visitor-side action and closer to internal sales tooling.

---

### Tidio / Lyro AI
**Website:** tidio.com
**Category:** AI Customer Service / Live Chat
**Funding:** Series B, $25M total raised. Bootstrapped to profitability before raising.
**Pricing:** From $29/month base. Lyro AI Agent starts at $32.50/month (billed annually) for 50 conversations. Overage billed per conversation — can be unpredictable at scale.

**What they do**
Tidio is an all-in-one live chat, chatbot, and AI support platform for SMB ecommerce. Lyro (powered by Anthropic's Claude) understands natural language, learns from help center content and PDFs, automates up to 67% of queries, and via Shopify integration can check order status and make product recommendations. No rigid flows required.

**What they do NOT do**
- Visitor must open the chat — not proactively triggered by behavioral signals
- Cannot navigate the website or take browser-side actions for the visitor
- No friction pattern detection or auto-proposed agents
- Does not ingest GA4/GTM behavioral data
- Primarily reactive support, not proactive conversion completion

**ICP fit**
SMB ecommerce stores (Shopify-heavy). Buyer is founder or ecommerce manager. Budget-conscious. Starts free.

**Competitive threat to us**
Low-Medium — Tidio serves a similar customer (SMB ecommerce) but is purely a support/chat tool. The "proactive activation + browser action" dimension is entirely absent.

**Key quote or signal**
Runs on Anthropic Claude — same underlying model as Agent Factory. Validates that Claude is becoming the default for ecommerce AI agents, and that SMB ecommerce is willing to pay for it.

---

## Summary Table

| Company | Category | Pricing model | Biggest gap vs Agent Factory | Threat level |
|---|---|---|---|---|
| Qualified / Piper | AI SDR | $68K+/year enterprise | B2B only, no browser actions, no ecommerce | Medium |
| Intercom / Fin | AI Support | $0.99/resolution | No browser-side actions, support-first not conversion | Medium-High |
| Drift / Salesloft | B2B Conversational | Custom enterprise | Acquired into sales stack, no browser actions | Low |
| Tidio / Lyro | SMB Chat | $32.50+/month | Reactive only, no proactive triggers, no browser actions | Low-Medium |

## Strategic Implications

**Biggest short-term threat:** Intercom — same deployment model (merchant script), massive distribution, and per-resolution pricing creates a familiar buying context. If they add browser action capability, they'd be a direct competitor overnight.

**Most likely to move into our space:** Intercom. They already have the distribution and the trust. They'd need to add browser-side DOM control — technically achievable but a major product shift from their current backend-API-action model.

**Clearest white space we can own:** The combination of proactive trigger (behavior-detected, not visitor-initiated) + multi-step browser execution. Every player here waits for the visitor to open chat. We activate on friction signals and then *act* — not just talk.

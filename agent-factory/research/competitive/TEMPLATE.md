# Competitive Research Template

## How to Use
- Fill in the CONTEXT section before running
- Enable web search so Claude pulls current pricing, G2 reviews, and recent funding
- For 5+ competitors, split into two runs: direct competitors first, adjacent players second
- Append the STRATEGIC IMPLICATIONS block when you want synthesis

---

## Prompt

```
CONTEXT (our product): [One sentence describing what Agent Factory does and who it's for]

Run competitive research on the following company: [COMPETITOR NAME]

Return your findings in this exact format:

---

### [Competitor Name]
**Website:** [url]
**Category:** [e.g. AI chat, abandonment recovery, browser automation, behavioral analytics]
**Funding:** [total raised, latest round, lead investor, date]
**Pricing:** [model + entry price point if public]

**What they do**
[2–3 sentences. What is the core product, who is it for, what is the mechanism]

**What they do NOT do**
[Bullet list of explicit gaps — things a customer cannot do with this product]

**ICP fit**
[Who buys this today — company size, role, vertical, use case]

**Competitive threat to us**
[Low / Medium / High — and one sentence explaining why]

**Key quote or signal**
[A real customer review, a founder quote, a recent announcement, or a product change that reveals something about their direction]

---

Repeat this block for each competitor. Then add:

## Summary Table

| Company | Category | Pricing model | Biggest gap | Threat level |
|---|---|---|---|---|
| [name] | [category] | [model] | [gap] | [Low/Med/High] |

## STRATEGIC IMPLICATIONS
- **Biggest short-term threat:** [who and why]
- **Most likely to move into our space:** [who and why]
- **Clearest white space we can own:** [the gap none of them fill]
```

---

## Competitor Lists by Category

### Direct (deploy agent to website visitors)
- Qualified / Piper
- Intercom / Fin
- Drift (Salesloft)
- Tidio / Lyro

### Adjacent — Abandonment & Conversion
- Klaviyo
- Recart
- CartHook

### Adjacent — Browser Agents (infrastructure / user-side)
- OpenAI Operator
- Anthropic Computer Use / Claude for Chrome
- Browserbase + Stagehand
- browser-use
- MultiOn
- Skyvern

### Adjacent — Behavioral Analytics
- FullStory
- Hotjar / Contentsquare
- Heap
- Pendo
- Quantum Metric

### Adjacent — Web Personalization / Agentic UX
- Fibr AI
- Optimizely
- VWO

---

## Research Log

| Date | Competitor | File | Notes |
|---|---|---|---|
| | | | |

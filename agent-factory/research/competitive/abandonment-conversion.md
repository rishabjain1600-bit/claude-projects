# Competitive Research: Abandonment & Conversion Tools
*Post-abandonment outreach and checkout optimization*

---

### Klaviyo
**Website:** klaviyo.com
**Category:** Email & SMS Marketing Automation
**Funding:** IPO'd September 2023. Market cap ~$6B. Public company.
**Pricing:** Free (up to 250 profiles). Email plan scales by active profiles: ~$60/month for 2,000 profiles, ~$375/month for 20,000 profiles. SMS adds per-message fees on top. Charges for stored contacts whether or not they engage.

**What they do**
Klaviyo is the dominant email/SMS marketing automation platform for ecommerce. It captures abandoned cart events via pixel/script, builds segmented subscriber lists, and fires pre-scheduled email and SMS sequences post-abandonment. Cart abandonment flows alone generate 10–15% of total email revenue for typical Shopify stores. Flows generate nearly 41% of total email revenue from only 5.3% of sends.

**What they do NOT do**
- Zero real-time, on-site intervention — all recovery happens after the visitor has left, via email or SMS
- Does not detect friction patterns live on the page
- Does not propose or deploy autonomous agents
- Cannot take any action inside the browser on the visitor's behalf
- No conversational AI — pre-scripted sequences only
- Cannot use GA4/GTM signals to propose new intervention types

**ICP fit**
Ecommerce brands of all sizes, heavily Shopify-focused. Buyer is email marketing manager or founder. The default tool for DTC brands doing >$1M GMV.

**Competitive threat to us**
Low — operates in a completely different moment (after abandonment, via inbox) vs. Agent Factory (at the moment of friction, inside the browser). Complementary, not competitive. Many brands would use both.

**Key quote or signal**
Klaviyo's 2026 benchmark data shows flows generate 41% of total email revenue from 5.3% of sends — proof that behavior-triggered intervention drives outsized revenue, even when asynchronous. Agent Factory captures the same insight but acts in real time.

---

### Recart
**Website:** recart.com
**Category:** SMS & Messenger Marketing for Ecommerce
**Funding:** Bootstrapped / small raises. Private. Shopify-native app.
**Pricing:** Usage-based. SMS messages at $0.007 + $0.003 carrier fee per message (annual scale plan). 21-day free trial. Custom pricing for larger brands. Dedicated Customer Success Manager included.

**What they do**
Recart is a Shopify-native SMS and Facebook Messenger marketing platform for cart recovery. It sends personalized abandonment messages with incentives (discount codes, urgency nudges) after a visitor leaves. Focuses on list growth and re-engagement through owned messaging channels.

**What they do NOT do**
- No real-time, in-session intervention — all communication happens after the visitor leaves
- No behavioral signal detection or pattern recognition beyond cart abandonment event
- No AI agents — rule-based message flows only
- No autonomous actions on visitor's behalf
- No on-site presence at all

**ICP fit**
Shopify ecommerce brands, particularly mid-market DTC. Buyer is growth marketer or founder. Competes directly with Klaviyo SMS but with a more opinionated, high-touch approach.

**Competitive threat to us**
Low — a post-abandonment messaging tool. Occupies a completely different moment and channel than Agent Factory.

**Key quote or signal**
Recart's core pitch is "spend less, sell more" via SMS — pure efficiency play on post-abandonment outreach. No product vision toward real-time intervention.

---

### CartHook
**Website:** carthook.com
**Category:** Checkout Optimization / Post-Purchase Upsell
**Funding:** Private. Shopify ecosystem. Acquired by Zipify in 2022.
**Pricing:** Starts at $50/month. Scales with revenue/order volume.

**What they do**
CartHook builds custom one-page Shopify checkouts and post-purchase upsell funnels. Its "EmailMagnet" feature captures a visitor's email address the moment they type it into the checkout field — before they complete or abandon — enabling earlier retargeting. Post-purchase pages offer upsells immediately after order confirmation.

**What they do NOT do**
- EmailMagnet captures data but does not intervene — no agent fires to help the stuck visitor
- No AI-driven friction detection or conversational agent
- No autonomous browser-side actions on the visitor's behalf
- No real-time behavioral signal processing or pattern learning
- Primarily a checkout design and upsell tool, not an intervention system
- Now part of Zipify — roadmap tied to broader Zipify ecosystem

**ICP fit**
Shopify merchants wanting a custom checkout experience and post-purchase revenue uplift. Buyer is ecommerce director or Shopify merchant.

**Competitive threat to us**
Low — closest to real-time data capture (EmailMagnet) but captures data only, never deploys help at the moment of friction.

**Key quote or signal**
EmailMagnet is conceptually interesting — capturing intent at the exact moment it exists — but the use case stops at data capture for retargeting. Agent Factory extends that same moment into action.

---

## Summary Table

| Company | Category | Pricing model | Biggest gap vs Agent Factory | Threat level |
|---|---|---|---|---|
| Klaviyo | Email/SMS automation | Per-profile SaaS | Post-abandonment only, no real-time intervention | Low |
| Recart | SMS marketing | Per-message usage | Post-abandonment only, no on-site presence | Low |
| CartHook | Checkout optimization | Monthly SaaS | Data capture only, no AI agent, no browser actions | Low |

## Strategic Implications

**Biggest short-term threat:** None in this category compete with Agent Factory in real time. The entire category operates after the visitor leaves.

**Most likely to move into our space:** Klaviyo — they have the behavioral data, the ecommerce relationships, and the engineering scale. If they wanted to add an on-site AI agent layer, they have the distribution to win fast. It's not their current roadmap, but they're the one to watch.

**Clearest white space we can own:** The moment between "visitor shows friction" and "visitor abandons." Every tool in this category gives up on the visitor and follows up via email/SMS. Agent Factory stays in the session and resolves the issue before abandonment happens.

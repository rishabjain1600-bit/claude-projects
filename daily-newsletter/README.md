# Daily Newsletter — Powered by Claude

> A personal morning briefing delivered to my inbox at 9am ET every weekday — 6 stories, 2 minutes, no fluff.

Two sections: 3 world stories and 3 business/tech stories. Each is a plain factual sentence of what happened, followed by one sentence (20 words max) on why it matters — consequence-first, no filler.

---

## How It Works

```
RSS feeds (11 sources) → Python clustering → Claude Haiku → HTML email → Gmail SMTP → inbox
```

1. **Fetch** — pull headlines from 11 RSS feeds across left, right, neutral, and business outlets
2. **Cluster** — Python groups ~80 headlines into ~30 topic clusters using Jaccard similarity
3. **Score** — each cluster is scored by cross-outlet coverage (weighted by feed type) + a diversity bonus
4. **Select** — Claude Haiku receives the 30 ranked clusters and picks 3 world + 3 business stories
5. **Write** — Haiku writes a `what` and `why` for each selected story
6. **Send** — Python renders HTML and sends via Gmail SMTP

---

## Why I Built It This Way — Every Design Decision

### 1. RSS over web search

The first version used Claude Opus with a live `web_search` tool. It worked but cost ~$0.05/run and had a hallucination risk on sources. RSS is free, deterministic, and returns the same headlines any reader would see. The tradeoff is no real-time breaking news — acceptable for a morning briefing.

**Cost impact:** ~$0.05/run (Opus + web search) → ~$0.003/run (RSS + Haiku). ~94% cheaper.

---

### 2. Two-stage pipeline: Python clustering before Haiku

The naive approach is to dump all 80 headlines into one prompt and ask Haiku to pick the best stories. The problem: all headlines look equal to the model. It has no signal for what's actually important — it guesses based on word weight.

The fix is a free Python pre-processing stage that clusters headlines by topic and scores them by cross-outlet coverage frequency *before* Haiku sees anything. A story covered by 6 outlets is objectively more confirmed than one covered by 1. Haiku's job becomes focused: write the what+why for already-ranked stories, not find needles in a haystack.

```
Before: Haiku guesses importance from 80 noisy headlines
After:  Haiku writes about 30 pre-ranked clusters
```

---

### 3. Jaccard similarity for clustering

Each headline is normalized (lowercase, strip punctuation, remove stop words) into a word set. Two headlines are in the same cluster if their Jaccard similarity exceeds 0.35 — meaning more than 35% of their meaningful words overlap.

```python
# "US imposes new tariffs on Chinese semiconductors"
# → {"us", "imposes", "new", "tariffs", "chinese", "semiconductors"}

# "Biden administration announces semiconductor tariffs targeting China"
# → {"biden", "administration", "announces", "semiconductor", "tariffs", "targeting", "china"}

# Intersection: {"tariffs"} → similarity = 1/11 ≈ 0.09 → separate clusters
# (intentionally: these are different enough angles to both surface)
```

This runs in pure Python — zero API cost, zero latency impact.

---

### 4. Feed-category weighting in the score

Outlet count alone is a frequency signal, not a relevance signal. A psilocybin study covered by 4 lifestyle editors ranks higher than a tariffs decision covered by 2 business outlets — the wrong result.

The fix: each outlet's contribution to a cluster's score is weighted by what kind of feed it came from.

```python
FEED_WEIGHTS = {
    "neutral":  1.0,   # Reuters, AP, BBC — broad, reliable
    "business": 1.2,   # directly maps to reader interests
    "left":     0.7,   # also publishes lifestyle, culture, health
    "right":    0.7,   # same reasoning
}
```

A lifestyle story covered by 4 left outlets scores `4 × 0.7 = 2.8`. A tariffs story covered by 2 business + 1 neutral scores `(2 × 1.2) + (1 × 1.0) = 3.4` — and surfaces above it despite fewer total outlets.

Weighting is per unique outlet (deduplicated), not per article, so a prolific wire service publishing 3 articles on one topic doesn't get triple credit.

---

### 5. Diversity bonus for cross-aisle coverage

A story covered by both left-leaning and right-leaning outlets is more significant than one covered only by one side — both sides independently decided it mattered. The score gets +2 when both are present.

```
[outlets: 4, left+right] Fed holds rates steady
[outlets: 3, left] University tuition costs rise
```

The label also appears in the prompt so Haiku can see the signal explicitly.

---

### 6. Outlet count as a tiebreaker, not an authority

Early versions told Haiku "higher outlet count = more important." The problem: Haiku treated it as an override. A viral lifestyle story with 6 outlets would beat a geopolitical development with 3, even when the prompt said the reader doesn't care about lifestyle.

The fix is reframing: outlet count is explicitly described as a tiebreaker *between stories that already pass the relevance filter*, not a primary ranking signal.

```
The outlet count reflects how many RSS sources picked it up — use it only as a
tiebreaker between stories that already match reader interests. High outlet count
does not override relevance.
```

---

### 7. Explicit exclusion list in the prompt

Positive-only instructions ("reader cares about geopolitics, markets, AI") leave Haiku to infer what "not relevant" means — and it's inconsistent. A psilocybin FDA story gets picked because it technically touches "regulation."

An explicit DO NOT SELECT list is harder to rationalize around:

```
DO NOT SELECT (skip regardless of outlet count):
- Health, wellness, lifestyle, drugs, diet, mental health trends
- Sports, entertainment, celebrity
- Science stories without direct policy or market consequence
- Local or regional human-interest stories
```

---

### 8. Two-stage filter-then-rank instruction

Standard prompt: "pick the best 6 stories." Problem: Haiku optimizes for "best" and the strongest numerical signal it has is outlet count — so it picks the top-ranked stories even if they're off-topic.

The fix separates the task into two explicit gates:

```
STEP 1 — FILTER: Identify stories matching reader interests. Deprioritize the DO NOT SELECT list.
STEP 2 — SELECT from the filtered set: 3 world + 3 business.
```

This forces relevance to be evaluated before outlet count enters the decision.

---

### 9. Max 1 per country or topic per section

Without this constraint, all 3 world stories would sometimes be Iran (3 different Iran angles all ranked highly). The constraint forces geographic and topical diversity across the section.

---

### 10. 20-word cap on "why", consequence-first

The "why" field is the hardest to get right. The default model behavior is to restate the event or add warmup ("This is significant because..."). Two constraints fix it:

- **20 words max** — forces prioritization, eliminates padding
- **Consequence-first framing** — the prompt instructs Haiku to lead with impact, not event

```
❌ "The Federal Reserve held interest rates steady at its March meeting."
✅ "Rate cuts pushed to summer — mortgage and credit card relief delayed."
```

---

### 11. Removed NYC section

The original design had a NYC section. Removed it because: (a) the reader's stated interests don't include local city news, and (b) it was pulling 24 RSS items that competed with genuinely important global stories in the clustering pool. Removing it improved selection quality for the sections that mattered.

---

### 12. GitHub Actions for scheduling

A local cron job only runs when the machine is awake. Since this runs on a personal laptop that isn't always on at 9am, GitHub Actions was the right call: free (2,000 min/month free tier; this script uses ~15 sec/run), runs in the cloud on schedule, and stores credentials as encrypted secrets — never in the repo.

```yaml
on:
  schedule:
    - cron: "0 14 * * 1-5"  # 9am ET Mon-Fri
  workflow_dispatch:          # manual trigger from GitHub UI
permissions:
  contents: read              # minimum required — can't touch the repo
```

---

## Cost

| Component | Tokens | Cost/run | Cost/month (weekdays) |
|---|---|---|---|
| Input (30 ranked clusters) | ~1,500 | ~$0.001 | ~$0.03 |
| Output (6 stories) | ~600 | ~$0.002 | ~$0.05 |
| **Total** | | **~$0.003** | **~$0.08** |

Haiku pricing: $0.80/MTok input, $4/MTok output.

---

## Setup

```bash
pip install -r requirements.txt
cp .env.example .env
# Fill in .env with your credentials
python newsletter.py
```

**`.env` values needed:**
```
ANTHROPIC_API_KEY=sk-ant-...
EMAIL_SENDER=you@gmail.com
EMAIL_PASSWORD=xxxx-xxxx-xxxx-xxxx   # Gmail App Password
EMAIL_RECIPIENT=you@gmail.com
```

**Gmail App Password** (30 seconds): myaccount.google.com → Security → 2-Step Verification → App passwords

---

## Schedule (GitHub Actions — no machine required)

1. Push to a private GitHub repo
2. Add the four `.env` values as GitHub Secrets (Settings → Secrets → Actions)
3. The workflow in `.github/workflows/newsletter.yml` runs automatically at 9am ET weekdays
4. Trigger manually anytime from the Actions tab

---

## Structure

```
daily-newsletter/
├── newsletter.py                      ← fetch, cluster, render, send
├── requirements.txt
├── .env.example                       ← credential template (safe to commit)
├── .gitignore                         ← .env excluded
└── .github/
    └── workflows/
        └── newsletter.yml             ← GitHub Actions schedule
```

---

Built with [Claude Haiku](https://anthropic.com) · `claude-haiku-4-5-20251001`

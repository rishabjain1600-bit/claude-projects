# Daily Newsletter — Powered by Claude

> A personal morning briefing delivered to your inbox at 9am — 8 stories, 2 minutes, no fluff.

Three sections: the 3 most consequential world stories (Claude picks, no fixed categories), 3 business/market stories with a market snapshot, and 2 NYC stories. Every item is a headline plus one consequence-first clause — the *so what*, not the *what*.

## How It Works

```
web_search (live) → Claude (editorial judgment) → JSON → HTML email → Gmail SMTP → inbox
```

1. **Claude searches the web** for today's news across all categories
2. **Claude curates and writes** — selects only stories with real consequence, writes each "why" as a punchy clause leading with impact, not event
3. **Python renders** the JSON into a clean HTML email
4. **Gmail SMTP delivers** it to your inbox

## What Makes It Interesting

- **Claude as editor, not aggregator**: The prompt instructs Claude to be ruthlessly selective — if a story isn't genuinely significant, drop it. The top 3 stories aren't bucketed by category; Claude picks whatever actually mattered that day.
- **Consequence-first writing**: Each item has a `why` field constrained to 12 words, always leading with the consequence ("June cut now likely — mortgage relief possible by summer") rather than restating the event ("The Fed held rates").
- **Above/below the fold structure**: Top 3 stories are immediately visible on open. Business and NYC sections require one scroll. Designed to respect the reader's attention.
- **Zero credentials in git**: `.env` is gitignored. Only a blank `.env.example` ships in the repo. API key and email password never touch version control.

## Structure

```
daily-newsletter/
├── newsletter.py        ← fetch, render, send (single script)
├── requirements.txt     ← anthropic, python-dotenv
├── .env.example         ← credential template (safe to commit)
├── .gitignore           ← .env, logs, previews excluded
└── README.md
```

## Setup

```bash
pip install -r requirements.txt
cp .env.example .env
# Fill in .env with your credentials (see below)
python3 newsletter.py
```

**`.env` values needed:**

```
ANTHROPIC_API_KEY=sk-ant-...         # console.anthropic.com
EMAIL_SENDER=you@gmail.com
EMAIL_PASSWORD=xxxx-xxxx-xxxx-xxxx  # Gmail App Password — not your real password
EMAIL_RECIPIENT=you@gmail.com
```

**Gmail App Password** (30 seconds): myaccount.google.com → Security → 2-Step Verification → App passwords

## Schedule (9am daily)

```bash
crontab -e
# Add:
0 9 * * * cd /path/to/daily-newsletter && python3 newsletter.py >> newsletter.log 2>&1
```

## The Prompt Design

The core editorial prompt instructs Claude to:
- Return **exactly** 3 top stories, 3 business stories, 2 NYC stories — no more
- Write each `why` in **max 12 words**, consequence first
- Use only **today's live web search results** — no hallucination
- Drop any story that isn't **genuinely significant**

The bad/good example in the prompt anchors the tone:
> ❌ "The Fed held rates steady at its meeting."
> ✅ "June cut now likely — mortgage relief possible by summer."

---

Built with [Claude](https://claude.ai) + [Anthropic API](https://docs.anthropic.com) · `claude-opus-4-6` with `web_search`

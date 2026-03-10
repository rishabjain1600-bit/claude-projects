# Job Search Tailoring System — Powered by Claude

> Paste in a job description → get a perfectly formatted 1-page resume PDF and 1-page cover letter PDF tailored to that role, in under 2 minutes.

This was my first Claude project. The core insight: Claude isn't just an AI assistant here — it's configured as a **product manager for my own job search**, following a detailed system prompt (`CLAUDE.md`) that encodes real PM reasoning: keyword extraction, qualification gap analysis, bullet scoring and reordering, no-widow-line enforcement, and authentic cover letter personalization rules.

## How It Works

```
JD (paste) → Claude (CLAUDE.md system) → tailored JSON → Python/WeasyPrint → 1-page PDF
```

1. **Paste the job description** into Claude Code
2. **Claude parses the JD**, extracts keywords, maps qualifications to resume evidence, scores and reorders bullets by relevance, and drafts tailored cover letter paragraphs — all following rules in `CLAUDE.md`
3. **Claude writes two JSON files**: one for the resume, one for the cover letter
4. **Python scripts** render the JSONs through Jinja2 HTML templates → WeasyPrint → pixel-perfect 1-page PDFs
5. **1-page assertion**: the script exits with an error if the output exceeds 1 page, forcing a trim-and-retry loop

## What Makes It Interesting

- **CLAUDE.md as a PM spec**: The system prompt isn't just "tailor my resume." It's a 12-section document encoding qualification-matching logic, per-role bullet heuristics, a keyword bank with evidence mapping, widow-line rules, tone guidelines, and a story bank for application questions.
- **Qualification gap analysis**: Claude produces a `✓ / ~ / ✗` checklist mapping every JD requirement to specific resume evidence before generating any output — preventing hallucination and keeping claims grounded.
- **Emphasis heuristics by role type**: AI/ML roles lead with the hackathon bullet; fintech roles lead with fraud/payments; data roles lead with SQL. Claude applies these rules automatically from the JD context.
- **No fabrication rule**: Every bullet, keyword, and claim must trace to the master resume. Claude is explicitly instructed never to invent credentials.

## Directory Structure

```
job-search-tailoring/
├── CLAUDE.md                     ← the system prompt / PM spec (sanitized)
├── scripts/
│   ├── generate_resume.py        ← renders resume JSON → 1-page PDF
│   └── generate_cover_letter.py  ← renders cover letter JSON → 1-page PDF
├── templates/
│   ├── resume_template.html      ← Jinja2 + WeasyPrint, Times New Roman 10.5pt
│   └── cover_letter_template.html
├── sample/
│   ├── sample_resume_data.json   ← example input structure
│   └── sample_coverletter_data.json
└── output/                       ← generated PDFs (gitignored)
```

## Setup

```bash
# Requires Homebrew Python (system Python may have dylib path issues on macOS)
brew install python3 pango cairo gdk-pixbuf libffi glib
pip3 install weasyprint jinja2
```

## Usage

```bash
# 1. Fill in your own CLAUDE.md with your master resume and cover letter content
# 2. Paste a job description into Claude Code — Claude handles the tailoring
# 3. Run the generated scripts:

python3 scripts/generate_resume.py --data output/Company_resume_data.json
python3 scripts/generate_cover_letter.py --data output/Company_coverletter_data.json
```

## Adapting for Your Own Use

1. Copy `CLAUDE.md` and replace the placeholder sections with your own resume and cover letter content
2. Update the name/contact fields in `templates/resume_template.html` and `templates/cover_letter_template.html`
3. Adjust the keyword bank and story bank in `CLAUDE.md` to match your own experience
4. Drop the file into your Claude Code project — it auto-loads as the system context

---

Built with [Claude Code](https://claude.ai/claude-code) · Anthropic Claude claude-sonnet-4-6

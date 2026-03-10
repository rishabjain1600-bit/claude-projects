# Claude Projects

A collection of personal tools built with [Claude](https://claude.ai) and the Anthropic API. Each project uses Claude not as a chatbot but as a capable collaborator — editor, analyst, PM — with a well-defined job to do.

## Projects

### [Daily Newsletter](./daily-newsletter/)
> A personal morning briefing delivered to your inbox at 9am.

Claude searches the web, picks the 8 most consequential stories of the day, and writes each one as a headline plus a single consequence-first clause. Three sections: top world stories (Claude curates, no fixed buckets), business + market snapshot, NYC. Rendered as a clean HTML email and sent via Gmail SMTP on a cron schedule.

**Stack:** Python · Anthropic API (`claude-opus-4-6` + `web_search`) · Gmail SMTP

---

### [Job Search Tailoring](./job-search-tailoring/)
> Paste a job description → get a tailored 1-page resume PDF and cover letter PDF in under 2 minutes.

Claude is configured as a PM for the job search: it extracts JD keywords, maps them to resume evidence, scores and reorders bullets by relevance, and drafts a cover letter — all following a detailed `CLAUDE.md` spec. Python scripts render the output to pixel-perfect PDFs via WeasyPrint.

**Stack:** Python · Claude Code · WeasyPrint · Jinja2

---

Built with [Claude Code](https://claude.ai/claude-code) · [Anthropic API](https://docs.anthropic.com)

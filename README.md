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

### [Agent Factory](./agent-factory/)
> A prototype exploring whether AI agents can convert website friction into completed actions — and whether that's a viable business.

A working real-time AI checkout recovery system: injects a script tag into a website, detects visitor friction (idle at checkout, sizing hesitation), activates a Claude-powered agent, and executes multi-step plans on the visitor's behalf via real browser clicks. Built alongside a full competitive research sprint across 18 companies. Concluded with a documented decision not to pursue further — the white space is real but the window is short and the moat is hard to build before foundation model companies close the gap.

**Stack:** Next.js 14 · TypeScript · Anthropic API · Tailwind · SSE · npm workspaces

---

Built with [Claude Code](https://claude.ai/claude-code) · [Anthropic API](https://docs.anthropic.com)

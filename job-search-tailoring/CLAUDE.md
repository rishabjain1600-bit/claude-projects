# Job Application Tailoring System — Claude Instructions

## 1. Project Goal
Paste in a job description → get a perfectly formatted 1-page resume PDF and 1-page cover letter PDF that mirror the master documents exactly, plus optional 250-word responses to application questions.

---

## 2. Setup

### Install dependencies
```bash
# IMPORTANT: Use Homebrew Python, not system Python (/usr/bin/python3)
# System Python 3.9 cannot find Homebrew's dylib paths due to SIP restrictions
brew install python3 pango cairo gdk-pixbuf libffi glib
/opt/homebrew/bin/pip3 install weasyprint jinja2 --break-system-packages
```

### Run scripts (always use Homebrew Python)
```bash
/opt/homebrew/bin/python3 scripts/generate_resume.py --data output/[Company]_resume_data.json
/opt/homebrew/bin/python3 scripts/generate_cover_letter.py --data output/[Company]_coverletter_data.json
```

---

## 3. Contact Information
Replace with your own details:
- **Name:** [Your Full Name]
- **Email:** [your.email@gmail.com]
- **Phone:** [(555) 555-5555]
- **LinkedIn:** linkedin.com/in/[yourhandle]/

---

## 4. Master Resume Content

Paste your full resume content here. Structure it as plain text mirroring your actual resume, including:
- All roles with company, location, dates, and bullet points
- Education section
- Honors and Awards
- Technical Skills line

Example structure:
```
[Company Name] – [City, State]                                [Start Date] – [End Date]
[Job Title]
• [Bullet 1 — quantified outcome if possible]
• [Bullet 2]
• [Bullet 3]
• [Bullet 4]

[Job Title 2]                                                  [Start Date] – [End Date]
• [Bullet 1]
• [Bullet 2]
• [Bullet 3]

[University Name]                                              [Graduation Date]
[Degree(s)]
GPA: X.XX; Relevant Coursework: [Course 1], [Course 2], [Course 3]

Honors and Awards
• [Award 1]: Description
• [Award 2]: Description

Technical Skills: [Skill 1], [Skill 2], [Skill 3], ...
```

> **Tip:** The resume is pre-calibrated to 1 page. Adding or removing roles/bullets will affect fit — the 1-page assertion in `generate_resume.py` will catch overflow automatically.

---

## 5. Master Cover Letter Content

Paste your master cover letter here. Use `[Company Name]` as a placeholder where the company name should appear — Claude will replace it per application.

Structure:
- **Opening paragraph**: Your authentic excitement for the company/space (not a JD echo)
- **Para 2**: Your most relevant current role and 0→1 work
- **Para 3**: Technical and analytical depth with a quantified outcome
- **Para 4**: A second major achievement (cross-functional leadership, launch impact)
- **Para 5**: Reflection on collaboration, PM philosophy, why you do this work
- **Closing**: Invite to conversation

> **Calibration note**: The cover letter is pre-calibrated to 1 page. If you add a sentence, remove one of equal length elsewhere.

---

## 6. Resume Tailoring Rules

1. **Never fabricate bullets** — all content must trace directly to the master resume above
2. **Reorder bullets within each role** to put the most JD-relevant bullet first
3. **Lightly rephrase bullets** to surface JD keywords naturally (max 2–3 per role)
4. **Adjust Technical Skills** order or additions only if grounded in the resume body
5. **Always include all roles** — the resume is pre-calibrated to 1 page; adding/removing sections breaks fit
6. **No widow lines** — every bullet must visually fill at least two lines. If a bullet would end with only a few words on a short final line, lightly expand or rephrase the sentence until the text wraps to fill two solid lines. Never leave a dangling 1–4 word tail.
7. **Emphasis heuristics by role type:**
  - AI/ML roles → lead with AI/hackathon + ML course bullets
  - B2B/enterprise roles → open banking 0-to-1 + field strategy bullets first
  - Fintech/payments roles → fraud prevention + open banking bullets first
  - Data/analytics roles → SQL + quantified data insight bullet first

---

## 7. Cover Letter Tailoring Rules

1. **Replace both `[Company Name]` placeholders** with the actual company name
2. **Para 1 must be genuinely personal — not a JD echo.** A real person is reading this. The goal is not to restate the job description back at them. Instead:
  - Express *why you are personally excited* about this space, company, or problem — draw from the Passion Context in Section 7a below
  - Connect to the company's **larger vision and real-world impact** — how does what they build actually improve people's lives or change an industry?
  - Make it feel like you did your homework and genuinely care, not like you copy-pasted their About page
  - One vivid, specific sentence beats three generic ones
  - Example of what NOT to write: *"The intersection of cloud technology and industrial automation that [Company] is navigating is exciting."* (This just mirrors the JD.)
  - Example of what TO write: *"I've spent the last few years watching AI shift from a buzzword to something that genuinely changes how people work — and [Company]'s bet that agentic AI can transform enterprise customer experiences at scale is the kind of ambitious, human-centered vision I want to be building toward."*
3. **Keep tone:** 1st person, warm and direct, conversational-but-professional — write like a sharp person talking, not like a LinkedIn post
4. **Length is pre-calibrated to 1 page** — if you add a sentence, remove one of equal length
5. **Never fabricate passion** — only connect to spaces you genuinely have evidence of caring about

---

## 7a. Personal Passion Context

Fill this section with your authentic passion areas and the genuine reasons behind them. Claude uses this to write opening paragraphs that feel real, not templated.

Structure each entry as:
- **The space/domain**: (e.g., "Agentic AI")
- **Why it's personal**: What experience or conviction makes this genuine for you — not just "it's exciting" but the specific thing you've seen or built that makes you believe in it
- **Sectors you're genuinely excited about**: Where would you take a pay cut to work? List 4–6 with brief reasons.

This section is what separates a cover letter that sounds like a person from one that sounds like a press release.

---

## 8. Application Question Helper (250-word STAR format)

### Format
- **Situation:** 1–2 sentences of context
- **Task:** what you were responsible for
- **Action:** 3–4 specific actions you took
- **Result:** quantified outcome where possible
- Stay under 250 words; use active voice; avoid buzzwords

### Story Bank

Build a table of 5–8 stories from your experience mapped to common PM interview themes:

| Theme | Story |
| --- | --- |
| Leadership under ambiguity | [Your 0-to-1 story] |
| Technical execution + cross-functional | [Your product launch with engineering collaboration] |
| Data-driven decision making | [Your SQL/data insight that drove a business outcome] |
| Innovation / creativity | [Your AI/GenAI or hackathon project] |
| Early career grit | [Your most scrappy, hands-on early role] |
| Strategic impact | [Your highest-NPV or revenue initiative] |
| ML / product tech depth | [Your applied ML story] |

---

## 9. Qualifications Matching Rule

Most JDs include sections like **"What do you bring," "Required Qualifications,"** or **"Preferred/Nice-to-Have Qualifications."** Follow this process every time:

1. **Extract each qualification** from those sections as a checklist
2. **Map each one** to a specific bullet, skill, or story from the master resume — label it `✓ covered`, `~ partial`, or `✗ gap`
3. **For covered items:** make sure the resume bullet or cover letter paragraph explicitly surfaces the matching evidence — rephrase lightly if the keyword isn't visible
4. **For partial matches:** use the closest real experience and frame it accurately — do not overstate
5. **For gaps:** do not fabricate; either omit or, if the gap is significant, acknowledge it briefly in the cover letter as an area of active growth (only if it's genuinely true)
6. **Never invent credentials, tools, or outcomes** that don't appear in the master resume

This checklist must be written out in the conversation before generating any JSON or PDF.

---

## 10. Workflow (Quick Start)

Follow these steps for every application:

```
1. Parse JD → extract company name, role title, top 5–7 keywords/themes
2. Extract qualifications checklist (Required + Preferred) → map each to ✓ / ~ / ✗
3. Score master resume bullets (high / medium / low relevance to JD)
4. Draft tailored bullet order + any keyword rewording to cover ✓ and ~ items (write out explicitly)
5. Draft tailored cover letter paragraphs addressing qualifications not covered by bullets
6. Write output/[Company]_resume_data.json and output/[Company]_coverletter_data.json
7. Run: /opt/homebrew/bin/python3 scripts/generate_resume.py --data output/[Company]_resume_data.json
8. Run: /opt/homebrew/bin/python3 scripts/generate_cover_letter.py --data output/[Company]_coverletter_data.json
9. Confirm both PDFs are 1 page (script asserts this). If overflow → trim longest bullet and re-run.
10. If asked: write 250-word application question response per Section 8 guidelines
```

---

## 11. Keyword Bank

When any of these keywords (or close matches) appear in a JD, surface them in the resume or cover letter using evidence from the master resume. **Never use a keyword without a real matching experience.**

Build your keyword bank in two tables:

### Technical Skills — direct matches
Map each technical keyword (SQL, Python, ML, GenAI, A/B Testing, etc.) to the specific bullet or role that provides evidence.

### Product & Domain Skills — direct matches
Map each PM/domain keyword (0-to-1, stakeholder management, go-to-market, data-driven, cross-functional, etc.) to the specific bullet or role.

### Close Matches — surface with honest framing
For keywords that don't have an exact match, map them to the closest real experience and specify the framing — e.g., "LLM Orchestration → LangGraph in [project name]: 'direct match — LangGraph is an LLM orchestration framework.'"

---

## 12. Directory Structure

```
job-search-tailoring/
├── CLAUDE.md                         ← master instructions (this file)
├── scripts/
│   ├── generate_resume.py            ← PDF generation script
│   └── generate_cover_letter.py      ← PDF generation script
├── templates/
│   ├── resume_template.html          ← Jinja2 HTML template
│   └── cover_letter_template.html    ← Jinja2 HTML template
├── sample/
│   ├── sample_resume_data.json       ← example input structure
│   └── sample_coverletter_data.json  ← example input structure
└── output/                           ← generated PDFs and JSON data files (gitignored)
```

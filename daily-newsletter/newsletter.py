#!/usr/bin/env python3
"""
Daily Newsletter — fetches global, business, and NYC news via Claude's
web search tool, formats it as a concise HTML email, and sends it.

Setup:
  pip install -r requirements.txt
  cp .env.example .env  # fill in your credentials
  python newsletter.py

Schedule (cron example — 7am every day):
  0 7 * * * cd /path/to/daily-newsletter && python newsletter.py >> newsletter.log 2>&1
"""

import os
import smtplib
import json
from datetime import datetime
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

import anthropic
from dotenv import load_dotenv

load_dotenv()

ANTHROPIC_API_KEY = os.environ["ANTHROPIC_API_KEY"]
EMAIL_SENDER = os.environ["EMAIL_SENDER"]          # your Gmail address
EMAIL_PASSWORD = os.environ["EMAIL_PASSWORD"]      # Gmail app password
EMAIL_RECIPIENT = os.environ["EMAIL_RECIPIENT"]    # where to send it
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))


# ---------------------------------------------------------------------------
# Step 1: Gather news via Claude + web_search
# ---------------------------------------------------------------------------

RESEARCH_PROMPT = """\
Today is {date}. You are a sharp news editor compiling a daily briefing.

Search the web and gather the following for today:

1. GLOBAL NEWS — 5 of the most important global news stories happening right now.
2. BUSINESS & MARKETS — 5 key business/financial stories (think Morning Brew style).
   Also include a quick snapshot: S&P 500, Nasdaq, Bitcoin price/direction if available.
3. NYC NEWS — 4 notable New York City stories (local politics, transit, culture, crime, development).

For EACH story provide:
- Headline (punchy, clear)
- 1–2 sentence summary (the essential who/what/why — no fluff)
- Source name (e.g. Reuters, Bloomberg, NYT)

Return your answer as valid JSON in this exact shape:
{{
  "date": "March 10, 2026",
  "global": [
    {{"headline": "...", "summary": "...", "source": "..."}}
  ],
  "business": {{
    "stories": [
      {{"headline": "...", "summary": "...", "source": "..."}}
    ],
    "markets": {{
      "sp500": "...",
      "nasdaq": "...",
      "bitcoin": "..."
    }}
  }},
  "nyc": [
    {{"headline": "...", "summary": "...", "source": "..."}}
  ]
}}

Be accurate, concise, and factual. Use only information from today's web search results.
"""


def fetch_news() -> dict:
    """Use Claude with web_search to pull today's news, returned as parsed JSON."""
    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

    today = datetime.now().strftime("%B %d, %Y")
    prompt = RESEARCH_PROMPT.format(date=today)

    print(f"[{datetime.now().strftime('%H:%M:%S')}] Fetching news via Claude...")

    response = client.messages.create(
        model="claude-opus-4-6",
        max_tokens=4096,
        tools=[
            {"type": "web_search_20260209", "name": "web_search"},
        ],
        messages=[{"role": "user", "content": prompt}],
    )

    # Extract the final text block (Claude's JSON answer)
    result_text = ""
    for block in response.content:
        if block.type == "text":
            result_text = block.text
            break

    # Parse JSON — strip markdown fences if Claude wrapped it
    cleaned = result_text.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.split("```")[1]
        if cleaned.startswith("json"):
            cleaned = cleaned[4:]
    cleaned = cleaned.strip().rstrip("```").strip()

    return json.loads(cleaned)


# ---------------------------------------------------------------------------
# Step 2: Render HTML email
# ---------------------------------------------------------------------------

HTML_TEMPLATE = """\
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Daily Briefing</title>
<style>
  body {{ margin: 0; padding: 0; background: #f4f4f4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; color: #1a1a1a; }}
  .wrapper {{ max-width: 620px; margin: 24px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }}
  .header {{ background: #111111; padding: 28px 32px 22px; }}
  .header h1 {{ margin: 0; color: #ffffff; font-size: 22px; font-weight: 700; letter-spacing: -0.3px; }}
  .header p {{ margin: 4px 0 0; color: #888888; font-size: 13px; }}
  .section {{ padding: 24px 32px; border-bottom: 1px solid #eeeeee; }}
  .section:last-child {{ border-bottom: none; }}
  .section-label {{ font-size: 10px; font-weight: 700; letter-spacing: 1.2px; text-transform: uppercase; color: #888; margin: 0 0 16px; }}
  .story {{ margin-bottom: 18px; }}
  .story:last-child {{ margin-bottom: 0; }}
  .story h3 {{ margin: 0 0 4px; font-size: 15px; font-weight: 600; color: #111111; line-height: 1.35; }}
  .story p {{ margin: 0; font-size: 13.5px; color: #444444; line-height: 1.55; }}
  .story .src {{ font-size: 11px; color: #aaaaaa; margin-top: 3px; }}
  .divider {{ height: 1px; background: #f0f0f0; margin: 14px 0; }}
  .markets {{ background: #f8f8f8; border-radius: 6px; padding: 14px 16px; margin-top: 18px; display: flex; gap: 24px; }}
  .market-item {{ font-size: 12px; color: #555; }}
  .market-item strong {{ display: block; font-size: 13px; color: #111; }}
  .footer {{ background: #f9f9f9; padding: 16px 32px; text-align: center; font-size: 11px; color: #aaaaaa; }}
  .global .section-label {{ color: #2563eb; }}
  .biz .section-label {{ color: #059669; }}
  .nyc .section-label {{ color: #dc2626; }}
</style>
</head>
<body>
<div class="wrapper">
  <div class="header">
    <h1>Daily Briefing</h1>
    <p>{date} &nbsp;·&nbsp; ~3 min read</p>
  </div>
  <div class="section global">
    <p class="section-label">🌍 Global News</p>
    {global_stories}
  </div>
  <div class="section biz">
    <p class="section-label">📈 Business &amp; Markets</p>
    {biz_stories}
    <div class="markets">
      <div class="market-item"><strong>S&amp;P 500</strong>{sp500}</div>
      <div class="market-item"><strong>Nasdaq</strong>{nasdaq}</div>
      <div class="market-item"><strong>Bitcoin</strong>{bitcoin}</div>
    </div>
  </div>
  <div class="section nyc">
    <p class="section-label">🗽 New York City</p>
    {nyc_stories}
  </div>
  <div class="footer">Generated with Claude · {date}</div>
</div>
</body>
</html>
"""


def render_story(story: dict, idx: int, total: int) -> str:
    divider = '<div class="divider"></div>' if idx < total - 1 else ""
    return (
        f'<div class="story">'
        f'<h3>{story["headline"]}</h3>'
        f'<p>{story["summary"]}</p>'
        f'<p class="src">{story["source"]}</p>'
        f"</div>{divider}"
    )


def render_html(data: dict) -> str:
    global_html = "".join(
        render_story(s, i, len(data["global"]))
        for i, s in enumerate(data["global"])
    )

    biz_stories = data["business"]["stories"]
    biz_html = "".join(
        render_story(s, i, len(biz_stories)) for i, s in enumerate(biz_stories)
    )

    nyc_html = "".join(
        render_story(s, i, len(data["nyc"])) for i, s in enumerate(data["nyc"])
    )

    markets = data["business"].get("markets", {})

    return HTML_TEMPLATE.format(
        date=data.get("date", datetime.now().strftime("%B %d, %Y")),
        global_stories=global_html,
        biz_stories=biz_html,
        nyc_stories=nyc_html,
        sp500=markets.get("sp500", "N/A"),
        nasdaq=markets.get("nasdaq", "N/A"),
        bitcoin=markets.get("bitcoin", "N/A"),
    )


# ---------------------------------------------------------------------------
# Step 3: Send email
# ---------------------------------------------------------------------------

def send_email(html: str, subject: str) -> None:
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = EMAIL_SENDER
    msg["To"] = EMAIL_RECIPIENT
    msg.attach(MIMEText(html, "html"))

    print(f"[{datetime.now().strftime('%H:%M:%S')}] Sending email to {EMAIL_RECIPIENT}...")
    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
        server.ehlo()
        server.starttls()
        server.login(EMAIL_SENDER, EMAIL_PASSWORD)
        server.sendmail(EMAIL_SENDER, EMAIL_RECIPIENT, msg.as_string())

    print(f"[{datetime.now().strftime('%H:%M:%S')}] Email sent.")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    print(f"=== Daily Newsletter — {datetime.now().strftime('%B %d, %Y')} ===")

    data = fetch_news()
    html = render_html(data)
    subject = f"Daily Briefing · {data.get('date', datetime.now().strftime('%B %d, %Y'))}"
    send_email(html, subject)

    print("Done.")


if __name__ == "__main__":
    main()

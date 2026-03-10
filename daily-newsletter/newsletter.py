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
Today is {date}. You are an editor for a busy, smart reader who has 2 minutes.

Search the web for today's news. Be ruthlessly selective — only include stories with real consequence.

Return exactly:
1. TOP STORIES — the 3 most important things happening in the world today, any topic. If a story\
 isn't genuinely significant, drop it. Quality over quantity.
2. BUSINESS — 3 business/market stories a professional should know. Include a market snapshot.
3. NYC — 2 NYC stories worth knowing.

For EACH story:
- headline: plain and factual
- why: one punchy clause (max 12 words) — lead with the consequence, not the event
- source: publication name

Bad why: "The Fed held rates steady at its meeting."
Good why: "June cut now likely — mortgage relief possible by summer."

Return valid JSON:
{{
  "date": "March 10, 2026",
  "top": [
    {{"headline": "...", "why": "...", "source": "..."}}
  ],
  "business": {{
    "stories": [
      {{"headline": "...", "why": "...", "source": "..."}}
    ],
    "markets": {{
      "sp500": "...",
      "nasdaq": "...",
      "bitcoin": "..."
    }}
  }},
  "nyc": [
    {{"headline": "...", "why": "...", "source": "..."}}
  ]
}}

Only use information from today's web search. Be accurate.
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
  body {{ margin: 0; padding: 0; background: #f0f0f0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; color: #1a1a1a; }}
  .wrapper {{ max-width: 580px; margin: 20px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 6px rgba(0,0,0,0.07); }}
  .header {{ background: #111; padding: 20px 28px 16px; }}
  .header h1 {{ margin: 0; color: #fff; font-size: 18px; font-weight: 700; letter-spacing: -0.2px; }}
  .header p {{ margin: 2px 0 0; color: #777; font-size: 12px; }}
  .section {{ padding: 18px 28px; border-bottom: 1px solid #f0f0f0; }}
  .section-label {{ font-size: 9px; font-weight: 700; letter-spacing: 1.4px; text-transform: uppercase; margin: 0 0 12px; }}
  .story {{ display: flex; gap: 10px; align-items: baseline; margin-bottom: 9px; }}
  .story:last-child {{ margin-bottom: 0; }}
  .bullet {{ color: #ccc; font-size: 13px; flex-shrink: 0; }}
  .content {{ flex: 1; }}
  .content b {{ font-size: 13.5px; font-weight: 600; color: #111; line-height: 1.3; }}
  .content span {{ font-size: 12.5px; color: #666; margin-left: 5px; }}
  .content .src {{ font-size: 10.5px; color: #bbb; margin-left: 4px; }}
  .markets {{ display: flex; gap: 0; margin-top: 14px; border: 1px solid #f0f0f0; border-radius: 6px; overflow: hidden; }}
  .market-item {{ flex: 1; padding: 10px 14px; border-right: 1px solid #f0f0f0; }}
  .market-item:last-child {{ border-right: none; }}
  .market-item .label {{ font-size: 9px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: #aaa; }}
  .market-item .val {{ font-size: 13px; font-weight: 600; color: #111; margin-top: 2px; }}
  .footer {{ padding: 12px 28px; text-align: center; font-size: 10px; color: #ccc; }}
  .top .section-label {{ color: #111; }}
  .top .story b {{ font-size: 14.5px; }}
  .biz .section-label {{ color: #059669; }}
  .nyc .section-label {{ color: #dc2626; }}
</style>
</head>
<body>
<div class="wrapper">
  <div class="header">
    <h1>Daily Briefing</h1>
    <p>{date} &nbsp;·&nbsp; 2 min read</p>
  </div>
  <div class="section top">
    <p class="section-label">⚡ Top Stories</p>
    {top_stories}
  </div>
  <div class="section biz">
    <p class="section-label">📈 Business &amp; Markets</p>
    {biz_stories}
    <div class="markets">
      <div class="market-item"><div class="label">S&amp;P 500</div><div class="val">{sp500}</div></div>
      <div class="market-item"><div class="label">Nasdaq</div><div class="val">{nasdaq}</div></div>
      <div class="market-item"><div class="label">Bitcoin</div><div class="val">{bitcoin}</div></div>
    </div>
  </div>
  <div class="section nyc">
    <p class="section-label">🗽 NYC</p>
    {nyc_stories}
  </div>
  <div class="footer">Generated with Claude · {date}</div>
</div>
</body>
</html>
"""


def render_story(story: dict, idx: int, total: int) -> str:
    return (
        f'<div class="story">'
        f'<span class="bullet">·</span>'
        f'<div class="content">'
        f'<b>{story["headline"]}</b>'
        f'<span>{story["why"]}</span>'
        f'<span class="src">{story["source"]}</span>'
        f'</div></div>'
    )


def render_html(data: dict) -> str:
    top_html = "".join(
        render_story(s, i, len(data["top"]))
        for i, s in enumerate(data["top"])
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
        top_stories=top_html,
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

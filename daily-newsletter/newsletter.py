#!/usr/bin/env python3
"""
Daily Newsletter — fetches news from left- and right-leaning RSS feeds,
uses Claude Haiku to write a plain-English summary + left/right takes,
formats as HTML email, and sends it.

Setup:
  pip install -r requirements.txt
  cp .env.example .env  # fill in your credentials
  python newsletter.py

Schedule (cron example — 7am every day):
  0 7 * * * cd /path/to/daily-newsletter && python newsletter.py >> newsletter.log 2>&1
"""

import os
import re
import smtplib
import json
from datetime import datetime
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

import anthropic
import feedparser
from dotenv import load_dotenv

load_dotenv()

ANTHROPIC_API_KEY = os.environ["ANTHROPIC_API_KEY"]
EMAIL_SENDER = os.environ["EMAIL_SENDER"]          # your Gmail address
EMAIL_PASSWORD = os.environ["EMAIL_PASSWORD"]      # Gmail app password
EMAIL_RECIPIENT = os.environ["EMAIL_RECIPIENT"]    # where to send it
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))


# ---------------------------------------------------------------------------
# Step 1: Gather news via RSS feeds + Claude Haiku
# ---------------------------------------------------------------------------

RSS_FEEDS = {
    "left": [
        "https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml",
        "http://rss.cnn.com/rss/cnn_topstories.rss",
        "https://feeds.npr.org/1001/rss.xml",
        "https://feeds.washingtonpost.com/rss/national",
    ],
    "right": [
        "https://moxie.foxnews.com/google-publisher/latest.xml",
        "https://nypost.com/feed/",
        "https://feeds.a.dj.com/rss/RSSWorldNews.xml",
        "https://www.breitbart.com/feed/",
    ],
    "neutral": [
        "https://feeds.reuters.com/reuters/topNews",
        "https://rss.ap.org/en/topnews",
        "https://feeds.bbci.co.uk/news/rss.xml",
    ],
    "business": [
        "https://feeds.reuters.com/reuters/businessNews",
        "https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=10001147",
        "https://moxie.foxnews.com/google-publisher/business.xml",
    ],
}

# ---------------------------------------------------------------------------
# Clustering helpers
# ---------------------------------------------------------------------------

STOP_WORDS = {
    "the","a","an","is","are","was","were","in","on","at","to","of","and","or",
    "for","with","that","its","it","as","by","be","has","have","had","from",
    "after","over","says","said",
}

LEFT_SOURCES = {"nyt", "nytimes", "cnn", "npr", "washington post", "washingtonpost"}
RIGHT_SOURCES = {"fox news", "foxnews", "new york post", "nypost", "breitbart", "wall street journal", "wsj"}

# How much each feed category contributes to a cluster's score.
# business/neutral cover reader interests more reliably; left/right also publish lifestyle/culture.
FEED_WEIGHTS = {"neutral": 1.0, "business": 1.2, "left": 0.7, "right": 0.7}


def normalize_title(title: str) -> set:
    words = re.sub(r"[^a-z0-9 ]", "", title.lower()).split()
    return {w for w in words if w not in STOP_WORDS and len(w) > 2}


def cluster_headlines(all_items: list) -> list:
    """
    Cluster headlines by Jaccard similarity, score by cross-outlet coverage.
    Returns top 30 clusters sorted by score descending.
    """
    clusters = []  # each: {headline, words, outlets, sources, feed_categories}

    for item in all_items:
        words = normalize_title(item["title"])
        if not words:
            continue

        matched = None
        for cluster in clusters:
            intersection = len(words & cluster["words"])
            union = len(words | cluster["words"])
            if union > 0 and intersection / union > 0.35:
                matched = cluster
                break

        if matched:
            matched["outlets"].add(item["source"])
            matched["sources"].add(item["source"].lower())
            matched["feed_categories"].append(item["feed_category"])
            # Keep the headline from the highest-priority source (neutral > left/right > business)
            priority = {"neutral": 0, "left": 1, "right": 1, "business": 2}
            if priority.get(item["feed_category"], 9) < priority.get(matched["feed_category"], 9):
                matched["headline"] = item["title"]
                matched["feed_category"] = item["feed_category"]
        else:
            clusters.append({
                "headline": item["title"],
                "words": words,
                "outlets": {item["source"]},
                "sources": {item["source"].lower()},
                "feed_categories": [item["feed_category"]],
                "feed_category": item["feed_category"],
            })

    # Score each cluster
    scored = []
    for c in clusters:
        outlet_count = len(c["outlets"])
        # Weighted coverage: one weight contribution per unique outlet (not per article)
        # Map each outlet back to its feed category via the first article that added it
        outlet_to_cat = {}
        for item in all_items:
            if item["source"] in c["outlets"] and item["source"] not in outlet_to_cat:
                outlet_to_cat[item["source"]] = item["feed_category"]
        weighted_coverage = sum(FEED_WEIGHTS.get(cat, 0.8) for cat in outlet_to_cat.values())
        # Diversity bonus: both left and right outlets present
        has_left = any(s in LEFT_SOURCES or any(ls in s for ls in LEFT_SOURCES) for s in c["sources"])
        has_right = any(s in RIGHT_SOURCES or any(rs in s for rs in RIGHT_SOURCES) for s in c["sources"])
        diversity_bonus = 2 if (has_left and has_right) else 0
        score = weighted_coverage + diversity_bonus

        # Majority category
        cats = c["feed_categories"]
        category = max(set(cats), key=cats.count)

        # Label for prompt
        label_parts = [f"outlets: {outlet_count}"]
        if has_left and has_right:
            label_parts.append("left+right")
        elif has_left:
            label_parts.append("left")
        elif has_right:
            label_parts.append("right")
        else:
            label_parts.append(category)

        scored.append({
            "headline": c["headline"],
            "score": score,
            "outlet_count": outlet_count,
            "label": ", ".join(label_parts),
            "feed_category": category,
        })

    scored.sort(key=lambda x: x["score"], reverse=True)
    return scored[:30]


# ---------------------------------------------------------------------------
# Prompt
# ---------------------------------------------------------------------------

HAIKU_PROMPT = """\
Today is {date}.

You are a brilliant friend who follows the news obsessively. You explain stories the way a smart, \
plugged-in person would over coffee — not like a journalist, not like a textbook. Assume the reader \
is intelligent but busy. Skip the obvious. Go straight to the real stakes: underlying forces, who \
wins and loses, what most people aren't connecting. Be specific. Never write "this is significant \
because" — just say the thing. The "why" must be ONE sentence — 20 words max. No warmup, no filler. Just the sharpest possible reason it matters.

READER INTERESTS (must match at least one):
- Geopolitics: wars, sanctions, elections with global consequence, major power moves, treaties
- Trade & regulation: tariffs, antitrust, central bank policy, financial regulation, legislation
- Business & markets: earnings, M&A, macroeconomics, supply chains, major corporate strategy
- AI & tech: frontier AI, semiconductors, platform policy, cybersecurity — not product launches

DO NOT SELECT (skip regardless of outlet count):
- Health, wellness, lifestyle, drugs, diet, mental health trends
- Sports, entertainment, celebrity
- Science stories without direct policy or market consequence
- Local or regional human-interest stories

Below are today's stories. The outlet count reflects how many RSS sources picked it up — use it only as a tiebreaker between stories that already match reader interests. High outlet count does not override relevance.
Stories marked "left+right" were covered across the political spectrum — stronger signal.

STEP 1 — FILTER: Identify stories matching reader interests. Deprioritize the DO NOT SELECT list.
STEP 2 — SELECT. You MUST return exactly 3 stories per section. If the strict filter doesn't yield 3, fill remaining slots with the next-best stories from the list — a borderline story is better than an empty slot. Max 1 per country or topic per section.
- WORLD: 3 most consequential global stories, picked across different regions/subjects
- BUSINESS: 3 stories across economy/legislation/business/tech — prioritize AI and economic policy

For EACH story:
- "what": one plain factual sentence — what literally happened
- "why": ONE sentence, 20 words max — the sharpest possible reason it matters, no warmup, no filler

Return ONLY valid JSON, no markdown fences:
{{
  "date": "{date}",
  "world": [
    {{"what": "...", "why": "..."}}
  ],
  "business": [
    {{"what": "...", "why": "..."}}
  ]
}}

--- TODAY'S STORIES (ranked by coverage) ---
{ranked_stories}
"""


def fetch_rss(feeds: list, feed_category: str, max_per_feed: int = 8) -> list:
    """Fetch headlines from a list of RSS feed URLs, tagged with feed_category."""
    items = []
    for url in feeds:
        try:
            parsed = feedparser.parse(url)
            source = parsed.feed.get("title", url)
            for entry in parsed.entries[:max_per_feed]:
                title = entry.get("title", "").strip()
                if title:
                    items.append({"title": title, "source": source, "feed_category": feed_category})
        except Exception as e:
            print(f"  [warn] RSS fetch failed for {url}: {e}")
    return items


def fetch_news() -> dict:
    """Fetch RSS headlines, cluster by topic, then use Claude Haiku to write the briefing."""
    print(f"[{datetime.now().strftime('%H:%M:%S')}] Fetching RSS feeds...")

    all_items = []
    counts = {}
    for category, feeds in RSS_FEEDS.items():
        items = fetch_rss(feeds, feed_category=category)
        all_items.extend(items)
        counts[category] = len(items)

    total = len(all_items)
    print(f"  " + ", ".join(f"{k.capitalize()}: {v}" for k, v in counts.items()))

    clusters = cluster_headlines(all_items)
    print(f"  Clustered {total} headlines → {len(clusters)} stories")

    ranked_lines = []
    for c in clusters:
        ranked_lines.append(f"[{c['label']}] {c['headline']}")
    ranked_stories = "\n".join(ranked_lines) if ranked_lines else "(no stories)"

    today = datetime.now().strftime("%B %d, %Y")
    prompt = HAIKU_PROMPT.format(date=today, ranked_stories=ranked_stories)

    print(f"[{datetime.now().strftime('%H:%M:%S')}] Summarizing via Claude Haiku...")
    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
    response = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=1500,
        messages=[{"role": "user", "content": prompt}],
    )

    result_text = response.content[0].text.strip()

    # Strip markdown fences if present
    if result_text.startswith("```"):
        result_text = result_text.split("```")[1]
        if result_text.startswith("json"):
            result_text = result_text[4:]
    result_text = result_text.strip().rstrip("```").strip()

    return json.loads(result_text)


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
  .wrapper {{ max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 6px rgba(0,0,0,0.07); }}
  .header {{ background: #111; padding: 20px 28px 16px; }}
  .header h1 {{ margin: 0; color: #fff; font-size: 18px; font-weight: 700; letter-spacing: -0.2px; }}
  .header p {{ margin: 2px 0 0; color: #777; font-size: 12px; }}
  .section {{ padding: 18px 28px; border-bottom: 1px solid #f0f0f0; }}
  .section-label {{ font-size: 9px; font-weight: 700; letter-spacing: 1.4px; text-transform: uppercase; margin: 0 0 14px; }}
  .story {{ margin-bottom: 18px; }}
  .story:last-child {{ margin-bottom: 0; }}
  .what {{ font-size: 14px; font-weight: 600; color: #111; line-height: 1.4; margin: 0 0 6px; }}
  .why {{ font-size: 13px; color: #444; line-height: 1.6; margin: 0; }}
  .footer {{ padding: 12px 28px; text-align: center; font-size: 10px; color: #ccc; }}
  .top .section-label {{ color: #111; }}
  .biz .section-label {{ color: #059669; }}
</style>
</head>
<body>
<div class="wrapper">
  <div class="header">
    <h1>Daily Briefing</h1>
    <p>{date} &nbsp;·&nbsp; 2 min read</p>
  </div>
  <div class="section top">
    <p class="section-label">⚡ World</p>
    {world_stories}
  </div>
  <div class="section biz">
    <p class="section-label">💼 Business, Economy &amp; Tech</p>
    {biz_stories}
  </div>
  <div class="footer">Generated with Claude · {date}</div>
</div>
</body>
</html>
"""


def render_story(story: dict) -> str:
    return (
        f'<div class="story">'
        f'<p class="what">{story["what"]}</p>'
        f'<p class="why">{story["why"]}</p>'
        f'</div>'
    )


def render_html(data: dict) -> str:
    world_html = "".join(render_story(s) for s in data.get("world", []))
    biz_html = "".join(render_story(s) for s in data.get("business", []))

    return HTML_TEMPLATE.format(
        date=data.get("date", datetime.now().strftime("%B %d, %Y")),
        world_stories=world_html,
        biz_stories=biz_html,
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

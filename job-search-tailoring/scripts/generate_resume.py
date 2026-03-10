#!/usr/bin/env python3
"""
generate_resume.py — Render a tailored resume PDF from JSON data.

Usage:
    python3 scripts/generate_resume.py --data output/Stripe_resume_data.json
    python3 scripts/generate_resume.py --data output/Stripe_resume_data.json --output output/
"""

import argparse
import json
import os
import sys
from datetime import date
from pathlib import Path

try:
    from jinja2 import Environment, FileSystemLoader
except ImportError:
    sys.exit("ERROR: jinja2 not installed. Run: pip3 install jinja2")

try:
    import weasyprint
except ImportError:
    sys.exit("ERROR: weasyprint not installed. Run: pip3 install weasyprint")


def render_pdf(data: dict, template_dir: Path, output_dir: Path) -> Path:
    env = Environment(loader=FileSystemLoader(str(template_dir)))
    template = env.get_template("resume_template.html")
    html_content = template.render(**data)

    company = data.get("company", "Company").replace(" ", "_")
    today = date.today().strftime("%Y-%m-%d")
    output_path = output_dir / f"{company}_Resume.pdf"

    doc = weasyprint.HTML(string=html_content, base_url=str(template_dir)).render()

    page_count = len(doc.pages)
    if page_count != 1:
        print(f"\nERROR: Resume rendered to {page_count} page(s) — must be exactly 1 page.")
        print("Fix: trim the longest bullet(s) in your JSON data file and re-run.\n")
        sys.exit(1)

    doc.write_pdf(str(output_path))
    return output_path


def main():
    parser = argparse.ArgumentParser(description="Generate tailored resume PDF")
    parser.add_argument("--data", required=True, help="Path to resume data JSON file")
    parser.add_argument("--output", default=None, help="Output directory (default: same as --data file's directory)")
    args = parser.parse_args()

    data_path = Path(args.data).resolve()
    if not data_path.exists():
        sys.exit(f"ERROR: Data file not found: {data_path}")

    with open(data_path) as f:
        data = json.load(f)

    # Resolve paths relative to the project root (parent of scripts/)
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    template_dir = project_root / "templates"

    if args.output:
        output_dir = Path(args.output).resolve()
    else:
        output_dir = project_root / "output"

    output_dir.mkdir(parents=True, exist_ok=True)

    print(f"Rendering resume for: {data.get('company', 'Unknown')}")
    output_path = render_pdf(data, template_dir, output_dir)
    print(f"SUCCESS: PDF written to {output_path}")


if __name__ == "__main__":
    main()

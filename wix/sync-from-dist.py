#!/usr/bin/env python3
"""Regenerate the Wix headless project from dist/ — the single source of truth.

dist/ stays the canonical site. This copies its assets into the Astro project's
public/ directory and splits dist/index.html into the two raw fragments that
src/pages/index.astro injects with set:html.

Run from the repo root (or anywhere — paths are resolved from this file):

    python3 wix/sync-from-dist.py

Then, from wix/:  npx @wix/cli@latest build && CI=1 npx @wix/cli@latest release
"""
from __future__ import annotations

import hashlib
import re
import pathlib
import shutil
import sys
from pathlib import Path

WIX = Path(__file__).resolve().parent
DIST = WIX.parent / "dist"
PUBLIC = WIX / "public"
HTML = WIX / "src" / "html"

# Copied verbatim into public/ and served from the site root.
STATIC_FILES = [
    "styles.css", "fonts.css", "experience.css", "content.css", "agenda.css",
    "app.js", "motion.js", "content.js",
    "speakers.json", "favicon.svg",
]

# Wix's CDN 404s on non-ASCII asset paths, so these are renamed on the way in
# and the same substitution is applied to the markup.
RENAMES = {"PARTY-GUIDE-450χ350.png": "PARTY-GUIDE-450x350.png"}

def version_assets(markup: str) -> str:
    """Append a content hash to local css/js URLs.

    Wix serves static assets `cache-control: public, max-age=3600, immutable`, so a
    browser will not even revalidate them for an hour. Without this, a page update
    ships new HTML against a stale cached script — which is how the enquiry form
    ended up inert. Hashing the URL makes a changed file a different URL.
    """

    def stamp(match: re.Match[str]) -> str:
        attr, path = match.group(1), match.group(2)
        target = PUBLIC / path.lstrip("/")
        if not target.is_file():
            return match.group(0)
        digest = hashlib.sha256(target.read_bytes()).hexdigest()[:8]
        return f'{attr}="{path}?v={digest}"'

    return re.sub(r'(src|href)="(/[^"?]+\.(?:css|js))"', stamp, markup)


def rootify(markup: str) -> str:
    """Make relative asset references root-absolute so they resolve from any route."""
    markup = re.sub(
        r'(src|href)="(?!https?:|//|/|#|mailto:|tel:)([^"]+)"', r'\1="/\2"', markup
    )
    return markup.replace('"image": "assets/', '"image": "/assets/')


# Every page split into the raw fragments its .astro route injects.
PAGES = ["index.html", "agenda.html"]


def split_page(name: str) -> tuple[str, str]:
    """Return (head, body) inner HTML for one page in dist/."""
    page = DIST / name
    lines = page.read_text(encoding="utf-8").split("\n")

    def locate(needle: str) -> int:
        for i, line in enumerate(lines):
            if needle in line:
                return i
        raise SystemExit(f"error: {needle!r} not found in dist/{name}")

    head = "\n".join(lines[locate("<head>") + 1 : locate("</head>")])
    body = "\n".join(lines[locate("<body>") + 1 : locate("</body>")])
    head, body = rootify(head), rootify(body)
    for old_name, new_name in RENAMES.items():
        head, body = head.replace(old_name, new_name), body.replace(old_name, new_name)
    return version_assets(head), version_assets(body)


def main() -> int:
    index = DIST / "index.html"
    if not index.is_file():
        print(f"error: {index} not found — run this from the repo checkout", file=sys.stderr)
        return 1

    # 1. Assets.
    dest_assets = PUBLIC / "assets"
    shutil.rmtree(dest_assets, ignore_errors=True)
    shutil.copytree(DIST / "assets", dest_assets)
    for old, new in RENAMES.items():
        stale = dest_assets / old
        if stale.exists():
            stale.rename(dest_assets / new)

    PUBLIC.mkdir(parents=True, exist_ok=True)
    for name in STATIC_FILES:
        shutil.copy2(DIST / name, PUBLIC / name)

    # 2. Split each page into the fragments its route injects.
    HTML.mkdir(parents=True, exist_ok=True)
    for name in PAGES:
        head, body = split_page(name)
        stem = pathlib.Path(name).stem
        prefix = "" if stem == "index" else stem + "-"
        (HTML / f"{prefix}head.html").write_text(head, encoding="utf-8")
        (HTML / f"{prefix}body.html").write_text(body, encoding="utf-8")
        print(f"  {name}: head {len(head)}B / body {len(body)}B")

    print(
        f"synced {len(list(dest_assets.iterdir()))} assets + {len(STATIC_FILES)} files "
        f"-> public/, {len(PAGES)} pages split"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

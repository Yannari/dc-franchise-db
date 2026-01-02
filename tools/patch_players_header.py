# patch_players_header.py
from __future__ import annotations

import re
import shutil
from pathlib import Path

NEW_HEADER = r"""<header class="siteHeader">
  <div class="siteHeader__inner">
    <a class="brandChip" data-href="index.html" aria-label="Go to home">
      <span class="brandDot" aria-hidden="true"></span>
      <div>
        <div class="brandText">DC <b>Franchise</b> Database</div>
        <span class="brandSub">Local static website • Season 5 is live • Click to explore</span>
      </div>
    </a>

    <div class="statsChip">
      <div class="big">5 seasons • 58 players</div>
      <div class="small">Icons: <code>name.png</code></div>
    </div>
  </div>

  <nav class="siteNav" aria-label="Primary">
    <!-- Home added -->
    <a class="navPill" data-href="index.html"><span class="navIcon">🏠</span>Home</a>

    <a class="navPill" data-href="current-season.html"><span class="navIcon">📊</span>Current Season</a>
    <a class="navPill" data-href="voting-analytics.html"><span class="navIcon">🧾</span>Voting Analytics</a>
    <a class="navPill" data-href="franchise.html"><span class="navIcon">🏛️</span>Franchise</a>
    <a class="navPill" data-href="rankings.html"><span class="navIcon">🏆</span>Rankings</a>
    <a class="navPill" data-href="seasons.html"><span class="navIcon">🗂️</span>Seasons</a>
    <a class="navPill" data-href="devotees.html"><span class="navIcon">👥</span>Players</a>
    <a class="navPill" data-href="awards.html"><span class="navIcon">🏅</span>Awards</a>
  </nav>

  <!-- Folder-safe link resolver (so it works in /players and /seasons too) -->
  <script>
    (function () {
      var root = (document.documentElement.dataset.root || document.body.dataset.root || ".").replace(/\/+$/, "");
      var join = function (p) { return (root === "." ? p : root + "/" + p); };

      document.querySelectorAll(".siteHeader [data-href]").forEach(function (a) {
        a.setAttribute("href", join(a.getAttribute("data-href")));
      });
    })();
  </script>
</header>
"""

HEADER_RE = re.compile(r"<header\b[^>]*>.*?</header>", re.IGNORECASE | re.DOTALL)

def ensure_data_root_html(doc: str, root_value: str) -> str:
    # Put data-root on <html ...>
    m = re.search(r"<html\b([^>]*)>", doc, flags=re.IGNORECASE)
    if not m:
        return doc
    attrs = m.group(1)
    if re.search(r"\bdata-root\s*=", attrs, flags=re.IGNORECASE):
        # overwrite existing
        new_tag = re.sub(r'\bdata-root\s*=\s*["\'].*?["\']', f'data-root="{root_value}"', m.group(0), flags=re.IGNORECASE)
        return doc[:m.start()] + new_tag + doc[m.end():]
    else:
        new_tag = m.group(0)[:-1] + f' data-root="{root_value}">'
        return doc[:m.start()] + new_tag + doc[m.end():]

def replace_or_insert_header(doc: str) -> str:
    if HEADER_RE.search(doc):
        # Replace first <header>...</header>
        return HEADER_RE.sub(NEW_HEADER, doc, count=1)

    # No header found -> insert right after <body ...>
    body_m = re.search(r"<body\b[^>]*>", doc, flags=re.IGNORECASE)
    if not body_m:
        return doc  # weird file; skip safely
    insert_at = body_m.end()
    return doc[:insert_at] + "\n\n" + NEW_HEADER + "\n\n" + doc[insert_at:]

def main():
    # Run from website root, patch ./players/*.html
    players_dir = Path("players")
    if not players_dir.exists():
        raise SystemExit("❌ Can't find ./players folder. Run this from your website root (where index.html is).")

    html_files = sorted(players_dir.glob("*.html"))
    if not html_files:
        raise SystemExit("❌ No .html files found in ./players/")

    changed = 0
    for f in html_files:
        original = f.read_text(encoding="utf-8", errors="ignore")

        # For /players/* pages, root should be ".." to reach site pages
        doc = ensure_data_root_html(original, "..")
        doc = replace_or_insert_header(doc)

        if doc != original:
            # Backup once (file.html.bak)
            bak = f.with_suffix(f.suffix + ".bak")
            if not bak.exists():
                shutil.copy2(f, bak)

            f.write_text(doc, encoding="utf-8")
            changed += 1
            print(f"✅ Patched: {f.name}")
        else:
            print(f"— No change: {f.name}")

    print(f"\nDone. Updated {changed}/{len(html_files)} files.")
    print("Backups are saved as *.html.bak (delete them when you're happy).")

if __name__ == "__main__":
    main()

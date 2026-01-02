#!/usr/bin/env python3
"""
Patch all /players/*.html files to:
- Use ../styles.css
- Add the shared SITE HEADER + FOOTER blocks
- Fix navigation links via data-root=".."
- Fix common avatar path issues (assets/avatars -> ../assets/avatars)
Run from your website root folder:
  python tools/patch_players.py
"""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parent.parent
PLAYERS = ROOT / "players"
STYLES_HREF = "../styles.css"
DATA_ROOT = ".."

HEADER = """<!-- SITE HEADER START -->
<header class="siteHeader">
  <div class="brandRow">
    <div class="brandLeft">
      <div class="brandTitle"><span class="brandDC">DC</span> <span class="brandMid">Franchise</span> <span class="brandGold">Database</span></div>
      <div class="brandSub">Local static website • Season 5 is live • Click to explore</div>
      <div class="brandMetaLine">5 seasons • 58 players</div>
      <div class="brandMetaLine">Icons: <span class="pill">name.png</span></div>
    </div>
  </div>

  <nav class="pillNav" aria-label="Primary navigation">
    <a class="pillLink" data-href="index.html"><span class="navIcon">🏠</span> Home</a>
    <a class="pillLink" data-href="current-season.html"><span class="navIcon">📊</span> Current Season</a>
    <a class="pillLink" data-href="voting-analytics.html"><span class="navIcon">🗳️</span> Voting Analytics</a>
    <a class="pillLink" data-href="franchise.html"><span class="navIcon">🏛️</span> Franchise</a>
    <a class="pillLink" data-href="rankings.html"><span class="navIcon">🏆</span> Rankings</a>
    <a class="pillLink" data-href="seasons.html"><span class="navIcon">🗂️</span> Seasons</a>
    <a class="pillLink" data-href="devotees.html"><span class="navIcon">👥</span> Players</a>
    <a class="pillLink" data-href="awards.html"><span class="navIcon">🏅</span> Awards</a>
  </nav>

  <script>
    (function(){
      var root = (document.documentElement.dataset.root || document.body.dataset.root || '.').replace(/\/+$/,'');
      var join = function(p){ return (root === '.' ? p : root + '/' + p); };
      document.querySelectorAll('.siteHeader [data-href]').forEach(function(a){
        a.setAttribute('href', join(a.getAttribute('data-href')));
      });
    })();
  </script>
</header>
<!-- SITE HEADER END -->"""
FOOTER = """<!-- SITE FOOTER START -->
<footer class="siteFooter">
  <div class="footerInner">
    <div class="footerTitle">DC Franchise Database</div>
    <div class="footerSub">Static archive • 5 seasons • 58 players • Icons: name.png</div>
  </div>
</footer>
<!-- SITE FOOTER END -->"""

def ensure_css_link(html_text):
    if re.search(r'<link[^>]+href=["\'][^"\']*styles\.css["\']', html_text, re.I):
        html_text = re.sub(r'<link[^>]+href=["\'][^"\']*styles\.css["\'][^>]*>',
                           f'<link rel="stylesheet" href="{STYLES_HREF}">', html_text, flags=re.I)
    else:
        html_text = re.sub(r'</head>', f'  <link rel="stylesheet" href="{STYLES_HREF}">\\n</head>', html_text, flags=re.I)
    return html_text

def ensure_data_root(html_text):
    if 'data-root' in html_text:
        html_text = re.sub(r'data-root=["\'][^"\']*["\']', f'data-root="{DATA_ROOT}"', html_text, count=1, flags=re.I)
        return html_text
    html_text = re.sub(r'<html([^>]*)>', lambda m: f'<html{m.group(1)} data-root="{DATA_ROOT}">', html_text, count=1, flags=re.I)
    return html_text

def strip_old_blocks(html_text):
    html_text = re.sub(r'<!-- SITE HEADER START -->[\\s\\S]*?<!-- SITE HEADER END -->\\s*', '', html_text, flags=re.I)
    html_text = re.sub(r'<!-- SITE FOOTER START -->[\\s\\S]*?<!-- SITE FOOTER END -->\\s*', '', html_text, flags=re.I)
    # remove legacy headers near top if present
    html_text = re.sub(r'^\\s*(<div class="topbar"[\\s\\S]*?</div>\\s*</div>\\s*)', '', html_text, flags=re.I)
    html_text = re.sub(r'^\\s*(<header[^>]*class="[^"]*(?:pageHeader|headerBar|siteHeader)[^"]*"[\\s\\S]*?</header>\\s*)', '', html_text, flags=re.I)
    html_text = re.sub(r'<footer[^>]*class="[^"]*(?:footer|siteFooter)[^"]*"[\\s\\S]*?</footer>', '', html_text, flags=re.I)
    return html_text

def inject(html_text):
    html_text = strip_old_blocks(html_text)
    html_text = re.sub(r'(<body[^>]*>)', r'\\1\\n' + HEADER + '\\n', html_text, count=1, flags=re.I)
    html_text = re.sub(r'</body>', FOOTER + '\\n</body>', html_text, count=1, flags=re.I)
    return html_text



def main():
    if not PLAYERS.exists():
        raise SystemExit(f"players folder not found at: {PLAYERS}")
    changed = 0
    for p in sorted(PLAYERS.glob("*.html")):
        txt = p.read_text(encoding="utf-8", errors="ignore")
        orig = txt
        txt = ensure_data_root(txt)
        txt = ensure_css_link(txt)
        txt = inject(txt)

        if txt != orig:
            p.write_text(txt, encoding="utf-8")
            changed += 1
    print(f"Patched {changed} player pages.")
if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
Auto-populate assets/gallery/<slug>/ from the Total Drama Fandom wiki.

For every player in franchise_roster.json that does NOT already have gallery
images, this queries the wiki for the character's article, filters out
interface/nav icons by size + mime + a denylist, and downloads up to N real
character images, saving them as 1.png / 2.jpg / ... (extension preserved).

Original characters (no wiki page) are skipped and listed in the final report
so you know which still need art (AI-gen or manual).

Usage:
    python scripts/fetch_gallery.py                 # full run, 8 images each
    python scripts/fetch_gallery.py --max 12        # up to 12 each
    python scripts/fetch_gallery.py --only Beth,Brick   # just these names
    python scripts/fetch_gallery.py --limit 3       # only first 3 eligible chars (sampling)
    python scripts/fetch_gallery.py --dry-run       # report what WOULD download, write nothing
"""
import json, os, sys, time, argparse, urllib.parse, urllib.request, unicodedata

# Wikis tried in order per character: Total Drama / Ridonculous Race first,
# then Disventure Camp. First wiki with a matching page + usable images wins.
WIKIS = [
    "https://totaldrama.fandom.com/api.php",
    "https://disventurecamp.fandom.com/api.php",
]
UA  = "dc-franchise-gallery-fetch/1.0 (personal fan project)"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ROSTER = os.path.join(ROOT, "franchise_roster.json")
GALLERY_DIR = os.path.join(ROOT, "assets", "gallery")
EXTS = {"image/png": "png", "image/jpeg": "jpg", "image/webp": "webp"}
MIN_DIM = 300           # drop icons/sprites smaller than this on the short side
DENY_SUBSTR = [         # obvious non-character / interface files
    "wiki", "wordmark", "favicon", "site-logo", "logo", "icon", "badge",
    "spinner", "loading", "placeholder", "stub", "spoiler", "vote", "star",
    "userbox", "emoji", "button", "nav", "banner-", "header-",
]

def api(base, params):
    params = {**params, "format": "json"}
    url = base + "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)

def _norm(s):
    """lowercase, strip accents and non-alphanumerics for fuzzy title matching."""
    s = unicodedata.normalize("NFKD", s)
    s = "".join(c for c in s if not unicodedata.combining(c))
    return "".join(c for c in s.lower() if c.isalnum())

def resolve_title(base, name):
    """Find the real article title for a character on this wiki.
    Tries direct name variants; if none exist, searches and accepts a result
    whose title fuzzy-matches the name (handles accents/spelling, e.g.
    Rosa-Maria -> 'Rosa María'). Skips /BETA, /Interactions and 'X and Y' pages.
    Returns the canonical title or None."""
    target = _norm(name)
    # direct existence check on a few obvious variants
    for v in dict.fromkeys(name_variants(name)):
        try:
            d = api(base, {"action": "query", "titles": v, "prop": "info", "redirects": 1})
            page = next(iter(d["query"]["pages"].values()))
            if "missing" not in page and page.get("title"):
                return page["title"]  # redirects resolved to the real article
        except Exception:
            pass
    # fuzzy search fallback
    try:
        d = api(base, {"action": "query", "list": "search",
                       "srsearch": name, "srlimit": "8"})
        for r in d["query"]["search"]:
            t = r["title"]
            low = t.lower()
            if any(x in low for x in ("/beta", "/interactions", " and ")):
                continue
            if _norm(t) == target:
                return t
    except Exception:
        pass
    return None

def article_image_titles(base, title):
    """All File: titles embedded on the character's article (the gallery lives here)."""
    titles, cont = [], None
    for _ in range(6):  # paginate
        p = {"action": "query", "prop": "images", "titles": title, "imlimit": "500", "redirects": 1}
        if cont: p["imcontinue"] = cont
        d = api(base, p)
        page = next(iter(d["query"]["pages"].values()))
        if "missing" in page:
            return None
        titles += [im["title"] for im in page.get("images", [])]
        cont = d.get("continue", {}).get("imcontinue")
        if not cont: break
    return titles

def resolve(base, file_titles):
    """Batch-resolve File: titles -> [{title,url,mime,w,h}] keeping only usable images."""
    out = []
    for i in range(0, len(file_titles), 50):
        chunk = file_titles[i:i+50]
        d = api(base, {"action": "query", "titles": "|".join(chunk),
                       "prop": "imageinfo", "iiprop": "url|size|mime"})
        for page in d["query"]["pages"].values():
            ii = (page.get("imageinfo") or [None])[0]
            if not ii: continue
            mime, w, h = ii.get("mime"), ii.get("width", 0), ii.get("height", 0)
            name = page.get("title", "").lower()
            if mime not in EXTS: continue
            if min(w, h) < MIN_DIM: continue
            if any(s in name for s in DENY_SUBSTR): continue
            if w >= 3*h: continue  # banners / title cards
            out.append({"title": page["title"], "url": ii["url"], "mime": mime,
                        "w": w, "h": h, "area": w*h, "aspect": w/max(1, h)})
    # dedupe by url
    seen, uniq = set(), []
    for im in out:
        if im["url"] in seen: continue
        seen.add(im["url"]); uniq.append(im)
    # Portrait-led ordering: solo character renders are square/tall (aspect <= 1.1);
    # episode stills / group scenes are wide. Lead with portraits (biggest first),
    # then medium, then a capped number of wide scene shots — exactly a mix that
    # opens on clean portraits of THIS character.
    portrait = sorted([i for i in uniq if i["aspect"] <= 1.1], key=lambda x: -x["area"])
    medium   = sorted([i for i in uniq if 1.1 < i["aspect"] <= 1.6], key=lambda x: -x["area"])
    wide     = sorted([i for i in uniq if i["aspect"] > 1.6], key=lambda x: -x["area"])
    return portrait + medium + wide

def has_images(slug):
    d = os.path.join(GALLERY_DIR, slug)
    return os.path.isdir(d) and any(
        f.lower().rsplit(".", 1)[-1] in ("png", "jpg", "jpeg", "webp")
        for f in os.listdir(d))

def name_variants(name):
    yield name
    if " " in name:  yield name.replace(" ", "_")
    if "-" in name:  yield name.replace("-", " ")
    if "-" in name:  yield name.replace("-", "")

def download(url, dest):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=60) as r, open(dest, "wb") as f:
        f.write(r.read())

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--max", type=int, default=8, help="images per character (max 12)")
    ap.add_argument("--only", default="", help="comma-separated names to limit to")
    ap.add_argument("--limit", type=int, default=0, help="only first N eligible chars")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()
    n_target = min(args.max, 12)
    only = {s.strip().lower() for s in args.only.split(",") if s.strip()}

    roster = json.load(open(ROSTER, encoding="utf-8"))
    players = roster if isinstance(roster, list) else roster.get("players", roster)
    if isinstance(players, dict): players = list(players.values())

    covered, skipped_existing, no_page, errors = [], [], [], []
    eligible = 0
    for p in players:
        name = p.get("name"); slug = p.get("slug") or name.lower().replace(" ", "-")
        if only and name.lower() not in only: continue
        if has_images(slug):
            skipped_existing.append(name); continue
        if args.limit and eligible >= args.limit: break
        eligible += 1

        # Try each wiki in order; first one with a matching page + usable images wins.
        imgs, src_base = [], None
        for base in WIKIS:
            try:
                title = resolve_title(base, name)
            except Exception as e:
                errors.append((name, f"resolve_title: {e}")); title = None
            if not title:
                time.sleep(0.2); continue
            try:
                titles = article_image_titles(base, title)
                cand = resolve(base, titles or [])[:n_target]
            except Exception as e:
                errors.append((name, f"images: {e}")); cand = []
            if cand:
                imgs, src_base = cand, base; break
            time.sleep(0.2)
        if not imgs:
            no_page.append(name); continue

        dest_dir = os.path.join(GALLERY_DIR, slug)
        if not args.dry_run: os.makedirs(dest_dir, exist_ok=True)
        got = 0
        for i, im in enumerate(imgs, 1):
            ext = EXTS[im["mime"]]
            dest = os.path.join(dest_dir, f"{i}.{ext}")
            if args.dry_run:
                got += 1; continue
            try:
                download(im["url"], dest); got += 1; time.sleep(0.25)
            except Exception as e:
                errors.append((name, f"dl {im['title']}: {e}"))
        covered.append((name, got))
        wiki = "DC" if src_base and "disventure" in src_base else "TD"
        print(f"  {name:16} {'(dry) ' if args.dry_run else ''}{got} images  [{wiki}]")
        time.sleep(0.3)

    print("\n===== REPORT =====")
    print(f"Covered ({len(covered)}):", ", ".join(f"{n}:{c}" for n, c in covered) or "none")
    print(f"\nSkipped — already had images ({len(skipped_existing)}):", ", ".join(skipped_existing) or "none")
    print(f"\nNo wiki page — original characters, need other source ({len(no_page)}):")
    print("  " + ", ".join(no_page) if no_page else "  none")
    if errors:
        print(f"\nErrors ({len(errors)}):")
        for n, e in errors: print(f"  {n}: {e}")

if __name__ == "__main__":
    main()

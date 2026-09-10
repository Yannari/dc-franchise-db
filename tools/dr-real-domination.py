# ====================================================================
# dr-real-domination.py - what share of a real season one queen wins
# ====================================================================
#
#   python tools/dr-real-domination.py
#
# tests/dr-spec-audit.test.js compares the simulator against the real show,
# and for its whole life that comparison was the string "real show: ~30%" in
# a console label with no source anywhere. It was quoted in commit messages
# and steered balance decisions. This is where it comes from now.
#
# Reads the maxi-challenge winner of every episode from the Drag Race wiki,
# per season, and reports the share taken by that season most-winning queen.
# The pages 402 on an ordinary fetch and answer fine through api.php - the
# same route reference_bb_wiki_api documents for Big Brother.
#
# FOUR FORMATS, because fifteen years of editors: a plain bolded field, one
# wrapped in <u></u>, one prefixed "Maxi", a piped [[Challenge Winners|...]]
# link, and a {{MaxiChallengeWinner|...}} template. Seasons 4, 5 and 8 still
# do not parse; they are skipped rather than guessed at.
#
# Measured 2026-09-10, 13 seasons:
#   mean 28.5%   sd 5.3pp   range 22.2% (S16) - 40.0% (S12)
# The top queen wins THREE OR FOUR maxi challenges almost regardless of how
# many the season runs - season 16 ran 18 and its winner still took 4 - which
# is a sharper statement than the percentage and probably the real rule.
import json, io, re, urllib.parse, subprocess, sys, collections

def wikitext(title):
    url = ("https://rupaulsdragrace.fandom.com/api.php?action=query&prop=revisions"
           "&rvprop=content&rvslots=main&format=json&titles=" + urllib.parse.quote(title))
    out = subprocess.run(['curl','-s','-m','40','-H','User-Agent: research/1.0', url],
                         capture_output=True, text=True, encoding='utf-8', errors='replace').stdout
    try:
        pages = json.loads(out)['query']['pages']
    except Exception:
        return None
    p = list(pages.values())[0]
    if 'revisions' not in p:
        return None
    return p['revisions'][0]['slots']['main']['*']

# The MAIN challenge winner only. "Mini-Challenge Winner" must not match, so the
# pattern requires the field to start at the bullet.
# Seasons format this three ways: "Challenge Winner", "Maxi Challenge Winner",
# and either may be wrapped in <u></u>. The MINI winner must never match.
WIN = re.compile(r"\*\s*'''\s*(?:<u>)?\s*(?:Maxi[- ])?Challenge Winners?\s*(?:</u>)?\s*:\s*'''\s*(.+)")
# {{MaxiChallengeWinner|RuPaul's Drag Race|Season 1|Nina Flowers}}
TPL = re.compile(r"\{\{MaxiChallengeWinner\|[^|}]*\|[^|}]*\|([^}]+)\}\}")
# *'''[[Challenge Winners|Maxi Challenge Winner]]:''' Symone
LNK = re.compile(r"\[\[Challenge Winners\|[^\]]*Challenge Winners?\]\]\s*:\s*'''\s*(.+)")

def winners(txt):
    out = []
    for line in txt.split('\n'):
        m = WIN.search(line) or LNK.search(line) or TPL.search(line)
        if not m:
            continue
        raw = m.group(1)
        raw = re.sub(r'\[\[([^\]|]+)\|([^\]]+)\]\]', r'\2', raw)
        raw = re.sub(r'\[\[([^\]]+)\]\]', r'\1', raw)
        raw = raw.replace("'''", '').replace("''", '').strip()
        raw = re.sub(r'<[^>]+>', '', raw).strip(' .')
        if not raw or raw.lower().startswith('none'):
            continue
        for nm in re.split(r'\s*(?:&|,| and )\s*', raw):
            nm = nm.strip()
            if nm and len(nm) < 40:
                out.append(nm)
    return out

rows = []
for s in range(1, 17):
    t = wikitext("RuPaul's Drag Race (Season %d)" % s)
    if not t:
        print('season %-2d  PAGE NOT FOUND' % s); continue
    w = winners(t)
    if not w:
        print('season %-2d  no winners parsed' % s); continue
    c = collections.Counter(w)
    top, topn = c.most_common(1)[0]
    rows.append((s, len(w), topn, topn/len(w), top))
    print('season %-2d  maxi wins %2d  top queen %2d  share %5.1f%%  (%s)' % (s, len(w), topn, topn/len(w)*100, top))

if rows:
    shares = [r[3] for r in rows]
    mean = sum(shares)/len(shares)
    sd = (sum((x-mean)**2 for x in shares)/len(shares))**0.5
    print('\nseasons parsed: %d' % len(rows))
    print('mean top-queen share: %.1f%%   sd %.1fpp   range %.1f%%-%.1f%%'
          % (mean*100, sd*100, min(shares)*100, max(shares)*100))

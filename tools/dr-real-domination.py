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
#   mean 30.8%   sd 4.7pp   range 23.1% (S14) - 40.0% (S12)
#   top queen takes 3.15 of the 10.4 maxi challenges an average season runs
#
# THE UNIT IS THE EPISODE, NOT THE NAME, and the first version got that wrong.
# A team challenge can crown four queens at once - season 16 did - and
# counting those as four separate wins inflates the denominator and
# understates every share. It reported season 16 as 18 maxi challenges for a
# 16-episode season with a split premiere and a Lalaparuza reunion, which is
# what gave the error away.
# The top queen wins THREE OR FOUR maxi challenges almost regardless of how
# many the season runs - a sharper statement than the percentage, and
# probably the real rule. The simulator scales instead: its top queen takes
# 4.5 at a cast of 14 and 5.2 at 16, where the real show stays at 3 or 4.
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
        night = [nm.strip() for nm in re.split(r'\s*(?:&|,| and )\s*', raw)
                 if nm.strip() and len(nm.strip()) < 40]
        if night:
            out.append(night)
    return out

rows = []
for s in range(1, 17):
    t = wikitext("RuPaul's Drag Race (Season %d)" % s)
    if not t:
        print('season %-2d  PAGE NOT FOUND' % s); continue
    nights = winners(t)
    if not nights:
        print('season %-2d  no winners parsed' % s); continue
    c = collections.Counter()
    for night in nights:
        for nm in set(night):
            c[nm] += 1
    top, topn = c.most_common(1)[0]
    n = len(nights)
    rows.append((s, n, topn, topn/n, top))
    print('season %-2d  maxi episodes %2d  top queen %2d  share %5.1f%%  (%s)'
          % (s, n, topn, topn/n*100, top))

if rows:
    shares = [r[3] for r in rows]
    mean = sum(shares)/len(shares)
    sd = (sum((x-mean)**2 for x in shares)/len(shares))**0.5
    print('\nseasons parsed: %d' % len(rows))
    print('mean top-queen share: %.1f%%   sd %.1fpp   range %.1f%%-%.1f%%'
          % (mean*100, sd*100, min(shares)*100, max(shares)*100))

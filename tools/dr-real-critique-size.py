"""How many queens the real show critiques on a night, against how many are left.

Reads the progress table out of each season's wikitext. A cell is a result
template; anything that is not SAFE means she was kept back and spoken to.
"""
import json, re, sys, urllib.request

API = ("https://rupaulsdragrace.fandom.com/api.php?action=parse&page={}"
       "&prop=wikitext&format=json")

# What a cell means. Everything else (Mini, IMM, TOP 2, RUN, Guest...) is a
# decoration on a cell rather than a cell.
RESULT = {
    'WIN': 'WIN', 'HIGH': 'HIGH', 'SAFE': 'SAFE', 'LOW': 'LOW',
    'BTM': 'BTM', 'ELIM': 'ELIM', 'WINNER': 'WINNER', 'RUNNER-UP': 'RUN',
    'RUN': 'RUN', 'OUT': 'OUT', 'Guest': 'OUT', 'DNA': 'OUT',
}
SKIP = {'Mini', 'IMM', 'TOP 2', 'DNA-btm', 'Miss C', 'wp', 'Color box',
        'File', 'Contestant', 'RTNR', 'Returned'}


def fetch(page):
    req = urllib.request.Request(API.format(page), headers={'User-Agent': 'research'})
    with urllib.request.urlopen(req, timeout=40) as r:
        return json.load(r)['parse']['wikitext']['*']


def rows_of(text):
    """Each contestant's sequence of results, oldest episode first."""
    out = []
    for block in text.split('|-'):
        cells = re.findall(r'\{\{([^{}|]+)(?:\|[^{}]*)?\}\}', block)
        seq = []
        for c in cells:
            name = c.strip()
            if name in SKIP:
                continue
            if name in RESULT:
                seq.append(RESULT[name])
        # a contestant row is a long run of results, not a legend line
        if len(seq) >= 5:
            out.append(seq)
    return out


def report(page):
    try:
        rows = rows_of(fetch(page))
    except Exception as e:
        print(f'{page}: fetch failed ({e})')
        return []
    if not rows:
        print(f'{page}: no rows parsed')
        return []
    width = max(len(r) for r in rows)
    stats = []
    for ep in range(width):
        room = crit = 0
        for r in rows:
            if ep >= len(r):
                continue
            v = r[ep]
            if v in ('OUT', 'RUN', 'WINNER'):
                continue
            room += 1
            if v != 'SAFE':
                crit += 1
        if room >= 4 and crit:
            stats.append((room, crit))
    return stats


PAGES = [f"RuPaul%27s_Drag_Race_(Season_{n})" for n in (9, 10, 11, 12, 13, 14, 15, 16)]
allstats = []
for p in PAGES:
    s = report(p)
    allstats += s
    if s:
        print(f"{p.split('_(')[1][:-1]:>10}: " + ' '.join(f'{r}->{c}' for r, c in s))

print()
by_room = {}
for room, crit in allstats:
    by_room.setdefault(room, []).append(crit)
print('room | nights | critiqued (mean) | range')
for room in sorted(by_room, reverse=True):
    v = by_room[room]
    print(f'{room:>4} | {len(v):>6} | {sum(v)/len(v):>16.1f} | {min(v)}-{max(v)}')

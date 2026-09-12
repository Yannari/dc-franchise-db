"""What shape a real night has: how many at the top, how many LOW, how many
in the bottom — rather than just how many were critiqued in total."""
import json, re, urllib.request
from collections import Counter

API = ("https://rupaulsdragrace.fandom.com/api.php?action=parse&page={}"
       "&prop=wikitext&format=json")
RESULT = {'WIN': 'WIN', 'HIGH': 'HIGH', 'SAFE': 'SAFE', 'LOW': 'LOW',
          'BTM': 'BTM', 'ELIM': 'ELIM', 'WINNER': 'WINNER', 'RUNNER-UP': 'RUN',
          'RUN': 'RUN', 'OUT': 'OUT', 'Guest': 'OUT', 'DNA': 'OUT'}
SKIP = {'Mini', 'IMM', 'TOP 2', 'DNA-btm', 'Miss C', 'wp', 'Color box',
        'File', 'Contestant', 'RTNR', 'Returned'}


def fetch(page):
    req = urllib.request.Request(API.format(page), headers={'User-Agent': 'research'})
    with urllib.request.urlopen(req, timeout=40) as r:
        return json.load(r)['parse']['wikitext']['*']


def rows_of(text):
    out = []
    for block in text.split('|-'):
        seq = []
        for c in re.findall(r'\{\{([^{}|]+)(?:\|[^{}]*)?\}\}', block):
            n = c.strip()
            if n in SKIP:
                continue
            if n in RESULT:
                seq.append(RESULT[n])
        if len(seq) >= 5:
            out.append(seq)
    return out


tops, lows, bottoms, rooms = Counter(), Counter(), Counter(), []
pairs = Counter()
for n in (9, 10, 11, 12, 13, 14, 15, 16):
    try:
        rows = rows_of(fetch(f"RuPaul%27s_Drag_Race_(Season_{n})"))
    except Exception:
        continue
    width = max(len(r) for r in rows)
    for ep in range(width):
        col = [r[ep] for r in rows if ep < len(r)]
        live = [v for v in col if v not in ('OUT', 'RUN', 'WINNER')]
        if len(live) < 4:
            continue
        top = sum(1 for v in live if v in ('WIN', 'HIGH'))
        low = sum(1 for v in live if v == 'LOW')
        btm = sum(1 for v in live if v in ('BTM', 'ELIM'))
        if top + low + btm == 0:
            continue
        tops[top] += 1
        lows[low] += 1
        bottoms[btm] += 1
        pairs[(top, low, btm)] += 1
        rooms.append(len(live))

def show(label, c):
    total = sum(c.values())
    line = '  '.join(f'{k}:{v:>3} ({100*v/total:>4.1f}%)' for k, v in sorted(c.items()))
    print(f'{label:>8} | {line}')

print(f'nights: {sum(tops.values())}')
show('top', tops)
show('LOW', lows)
show('bottom', bottoms)
print()
print('the ten most common night shapes (top, low, bottom):')
for shape, n in pairs.most_common(10):
    print(f'   top {shape[0]}, low {shape[1]}, bottom {shape[2]}  -> {n} nights')

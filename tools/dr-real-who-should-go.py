"""Every real "Who Should Go Home Tonight?" answer, and what kind of answer it is.

The wiki keeps a Contestant / Choice / Reason / Result table for every time the
question has been asked. This reads them and counts the shapes.
"""
import json, re, urllib.request
from collections import Counter

API = ("https://rupaulsdragrace.fandom.com/api.php?action=parse&page={}"
       "&prop=wikitext&format=json")
PAGE = "Who%20Should%20Go%20Home%20Tonight%3F/RuPaul%27s%20Drag%20Race"

req = urllib.request.Request(API.format(PAGE), headers={'User-Agent': 'research'})
t = json.load(urllib.request.urlopen(req, timeout=40))['parse']['wikitext']['*']
t = re.sub(r'\[\[([^|\]]+)\|([^\]]+)\]\]', r'\2', t)
t = re.sub(r'\[\[([^\]]+)\]\]', r'\1', t)

rows = []
for block in t.split('|-'):
    cells = [c.strip() for c in block.split('\n|') if c.strip()]
    cells = [re.sub(r"^'''|'''$", '', c).strip() for c in cells]
    cells = [re.sub(r'\{\{[^}]*\}\}', '', c).strip() for c in cells]
    cells = [c for c in cells if c and not c.startswith('style=') and not c.startswith('!')]
    if len(cells) < 3:
        continue
    voter, choice, reason = cells[0], cells[1], cells[2]
    if not voter or not choice or len(reason) < 4:
        continue
    if any(x in voter.lower() for x in ('contestant', 'class=', 'colspan')):
        continue
    rows.append((voter, choice, reason))

print('answers found:', len(rows))
self_named = [r for r in rows if r[0] == r[1]]
print(f'named herself: {len(self_named)} ({100*len(self_named)/len(rows):.0f}%)')
print()

PATTERNS = [
    ('threat / competition', r'competit|threat|strong|biggest riv|beat me|winner|win it'),
    ('weakest / not ready',  r'weak|lacking|not ready|not on the same level|out of her depth|'
                             r'least|not grown|has not|had not|no growth|behind'),
    ('this week&apos;s work', r'this (challenge|week|episode)|tonight|her performance|'
                              r'the runway|her look|the challenge'),
    ('friction / attitude',  r'annoy|attitude|rude|negative|drama|clash|difficult|'
                             r'frustrat|disrespect|shady|fake'),
    ('herself / deserves it',r'herself|her own|she considered|does not deserve|not deserve'),
    ('closest / hardest',    r'friend|closest|hardest to say|love her'),
]
kinds = Counter()
for voter, choice, reason in rows:
    r = reason.lower()
    hit = None
    for label, pat in PATTERNS:
        if re.search(pat, r):
            hit = label
            break
    kinds[hit or 'other'] += 1
print('what the reason IS:')
for k, v in kinds.most_common():
    print(f'  {k:<24} {v:>4}  ({100*v/len(rows):>4.0f}%)')

print()
print('a sample of the real reasons:')
for voter, choice, reason in rows[:4] + rows[len(rows)//2:len(rows)//2+6]:
    who = 'HERSELF' if voter == choice else choice
    print(f'  {voter} -> {who}: {reason[:110]}')

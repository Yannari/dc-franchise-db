"""
embed_roster.py
---------------
Run this after editing franchise_roster.json to update simulator.html.

Usage:
    python embed_roster.py
"""
import json, re, os, sys
sys.stdout.reconfigure(encoding='utf-8')
os.chdir(os.path.dirname(os.path.abspath(__file__)))

ROSTER_FILE  = '../franchise_roster.json'
SIMULATOR    = '../simulator.html'

with open(ROSTER_FILE, 'r', encoding='utf-8') as f:
    data = json.load(f)

# Validate before writing
players = data.get('players', [])
if not players:
    print('ERROR: No players found in franchise_roster.json')
    sys.exit(1)

VALID_ARCHETYPES = {
    'mastermind','schemer','hothead','challenge-beast','social-butterfly',
    'loyal-soldier','wildcard','chaos-agent','floater','underdog','goat','perceptive-player'
}
STAT_KEYS = {'physical','endurance','mental','social','strategic','loyalty','boldness','intuition','temperament'}

errors = []
for p in players:
    name = p.get('name','?')
    arch = p.get('archetype','')
    if arch not in VALID_ARCHETYPES:
        errors.append(f"  {name}: unknown archetype '{arch}'")
    stats = p.get('stats', {})
    for key in STAT_KEYS:
        v = stats.get(key)
        if v is None:
            errors.append(f"  {name}: missing stat '{key}'")
        elif not (1 <= v <= 10):
            errors.append(f"  {name}: stat '{key}' = {v} (must be 1-10)")

if errors:
    print(f'Found {len(errors)} issue(s):')
    for e in errors: print(e)
    print('Fix these before embedding.')
    sys.exit(1)

new_roster = 'const FRANCHISE_ROSTER = ' + json.dumps(players, separators=(',', ':')) + ';'

with open(SIMULATOR, 'r', encoding='utf-8') as f:
    html = f.read()

if 'const FRANCHISE_ROSTER' not in html:
    print('ERROR: Could not find FRANCHISE_ROSTER in simulator.html')
    sys.exit(1)

html = re.sub(r'const FRANCHISE_ROSTER = \[.*?\];', new_roster, html, flags=re.DOTALL)

with open(SIMULATOR, 'w', encoding='utf-8') as f:
    f.write(html)

# Update count in JSON
data['count'] = len(players)
with open(ROSTER_FILE, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print(f'Done — {len(players)} players embedded into simulator.html')

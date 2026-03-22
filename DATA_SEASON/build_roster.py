import openpyxl, os, sys, json, re
sys.stdout.reconfigure(encoding='utf-8')
os.chdir(os.path.dirname(os.path.abspath(__file__)))

FILES = [
    ('Total_Drama_Survivor_Stats.xlsx',         'Total Drama Survivor Stats', 0, 1),
    ('Total_Drama_Survivor_Stats_S2.xlsx',       'Profiles',                  0, 1),
    ('Total_Drama_Simulation_Stats.xlsx',        'Total Drama Stats',          0, 1),
    ('Total_Drama_Character_Ratings.xlsx',       'Character Attributes',       0, 1),
    ('Fan_vs_Favorites_Fan_Core_Stats.xlsx',     'Fan Core Stats',             0, 1),
    ('Character Stats Ranking For HvsVvsC.xlsx', 'Character Stats Ranking For Rid', 0, 1),
    ('Tadhana_Newbie_Profiles.xlsx',             'Newbie Profiles',            0, 2),
    ('TD_Reboot_Stats.xlsx',                     'Character Stats',            3, 1),
]

STAT_MAP = {
    'physical':    ['physical','physical\n[challenge]','physical [challenge]'],
    'endurance':   ['endurance','endurance\n[challenge]','endurance [challenge]'],
    'mental':      ['mental','mental\n[challenge]','mental [challenge]'],
    'social':      ['social','social skills'],
    'temperament': ['temperament'],
    'strategic':   ['strategic ability','strategic'],
    'loyalty':     ['loyalty level','loyalty'],
}

def norm_h(h): return str(h).lower().strip().replace('\n', ' ') if h else ''
def parse_val(v):
    if isinstance(v, (int, float)): return int(round(v))
    m = re.match(r'(\d+)', str(v).strip())
    return int(m.group(1)) if m else None
def map_stat(h):
    hn = norm_h(h)
    for k, aliases in STAT_MAP.items():
        if hn in aliases: return k
    return None

# ── Extract raw 1-5 stats from xlsx files ─────────────────────────────
raw = {}
for fname, shname, hrow, skip in FILES:
    wb = openpyxl.load_workbook(fname, read_only=True, data_only=True)
    ws = wb[shname]
    rows = list(ws.iter_rows(values_only=True))
    headers = [map_stat(h) for h in rows[hrow]]
    for row in rows[hrow + 1:]:
        if not row[0] or not isinstance(row[0], str): continue
        name = row[0].strip()
        if not name: continue
        s = {}
        for i, key in enumerate(headers[skip:], skip):
            if key and i < len(row):
                v = parse_val(row[i])
                if v is not None: s[key] = v
        if len(s) >= 4:
            if name not in raw: raw[name] = s
            else: raw[name].update(s)
    wb.close()

# ── Archetype overrides (when xlsx stats can't capture personality) ───
ARCHETYPE_OVERRIDE = {
    'Izzy':       'wildcard',    # iconic franchise wildcard; her chaos doesn't show in xlsx stats
    'Beth':       'goat',        # classic finalist nobody feared; stats land in challenge-beast fallback
    'Noah':       'floater',     # snarky observer who never makes moves; floater is correct
    'Scary Girl': 'wildcard',    # permanently unhinged, not angry — hothead implies temper, this is chaos
    'Ripper':     'chaos-agent', # crude and disruptive by nature; stats don't capture his chaotic personality
    'Axel':       'hothead',     # fierce/competitive aggression, not meltdown-unstable like Eva — te raised to 6
}

# ── Stat overrides (xlsx data inaccurate for these characters) ────────
# Values here are on the RAW 1-5 scale (sc5 will double them)
STATS_OVERRIDE = {}

# ── Final stat overrides (already on 1-10 scale, applied after scaling) ──
FINAL_OVERRIDE = {
    'Axel': {'physical':9,'endurance':8,'mental':4,'social':5,'strategic':4,'loyalty':7,'boldness':6,'intuition':4,'temperament':5},
}

# ── Manual entries not in any xlsx ────────────────────────────────────
MANUAL = {
    'Emmah':   {'physical':3,'endurance':3,'mental':3,'social':3,'temperament':1,'strategic':4,'loyalty':3},
    'Scott':   {'physical':6,'endurance':8,'mental':8,'social':4,'temperament':4,'strategic':10,'loyalty':2},  # override with franchise knowledge
    'Zoey':    {'physical':4,'endurance':4,'mental':4,'social':5,'temperament':4,'strategic':3,'loyalty':5},
    'Mickey':  {'physical':2,'endurance':2,'mental':5,'social':3,'temperament':3,'strategic':4,'loyalty':5},
    'Sanders': {'physical':4,'endurance':5,'mental':4,'social':3,'temperament':5,'strategic':3,'loyalty':5},
}
for k, v in MANUAL.items():
    if k not in raw: raw[k] = v
for k, v in STATS_OVERRIDE.items():
    if k in raw: raw[k].update(v)

# ── Gender ─────────────────────────────────────────────────────────────
GENDER = {
    'Alejandro':'m','Amy':'f','Anne Maria':'f','Axel':'f','B':'m','Beardo':'m',
    'Beth':'f','Blaineley':'f','Bowie':'m','Brick':'m','Bridgette':'f',
    'Brightly':'nb','Brody':'m','Caleb':'m','Cameron':'m','Carrie':'f',
    'Chase':'m','Chet':'m','Cody':'m','Courtney':'f','Crimson':'f','DJ':'m',
    'Dakota':'f','Damien':'m','Dave':'m','Dawn':'f','Devin':'m','Duncan':'m',
    'Dwayne':'m','Ella':'f','Ellody':'f','Emma':'f','Emmah':'f','Ennui':'m',
    'Eva':'f','Ezekiel':'m','Geoff':'m','Gerry':'m','Gwen':'f','Harold':'m',
    'Heather':'f','Hicks':'m','Izzy':'f','Jacques':'m','Jasmine':'f','Jay':'m',
    'Jen':'f','Jo':'f','Josee':'f','Julia':'f','Junior':'m','Justin':'m',
    'Katie':'f','Kelly':'f','Kitty':'f','Laurie':'f','Leonard':'m','Leshawna':'f',
    'Lightning':'m','Lindsay':'f','Lorenzo':'m','MK':'f','MacArthur':'f',
    'Mary':'f','Max':'m','Mickey':'m','Mike':'m','Miles':'f','Millie':'f',
    'Nichelle':'f','Noah':'m','Owen':'m','Pete':'m','Priya':'f','Raj':'m',
    'Ripper':'m','Rock':'m','Rodney':'m','Ryan':'m','Sadie':'f','Sam':'m',
    'Samey':'f','Sanders':'f','Scarlett':'f','Scary Girl':'f','Scott':'m',
    'Shawn':'m','Sierra':'f','Sky':'f','Spud':'m','Staci':'f','Stephanie':'f',
    'Sugar':'f','Tammy':'f','Taylor':'f','Tom':'m','Topher':'m','Trent':'m',
    'Tyler':'m','Wayne':'m','Zee':'m','Zoey':'f',
}

# ── Archetype assignment (after 1-10 scaling) ─────────────────────────
def assign_archetype(s):
    ph, en, me, so, st, lo, bo, it, te = (
        s['physical'], s['endurance'], s['mental'], s['social'],
        s['strategic'], s['loyalty'], s['boldness'], s['intuition'], s['temperament']
    )
    # schemer: dominant strategist + disloyal — calculated villain, check before hothead/wildcard
    if st >= 9 and lo <= 4: return 'schemer'
    # mastermind: strategic brain, composed, moderately loyal
    if st >= 8 and me >= 6 and te >= 5: return 'mastermind'
    # hothead: explosive temper + bold (catches strategic-aggressive types like Jo)
    if te <= 3 and bo >= 7: return 'hothead'
    # wildcard: bold + disloyal + not calculating — genuine unpredictability
    if bo >= 7 and lo <= 4 and st <= 5: return 'wildcard'
    # chaos-agent: stirs the pot deliberately — bold, low temp, disloyal, not hyper-strategic
    if bo >= 6 and te <= 4 and lo <= 5 and st <= 8: return 'chaos-agent'
    # goat: strategic passenger — weak strategy, low boldness, low social, low-moderate loyalty
    # (extreme loyalty = loyal-soldier, not goat)
    if st <= 4 and bo <= 5 and so <= 5 and lo <= 7: return 'goat'
    # perceptive-player: reads people, intuitive, socially aware
    if it >= 8 and so >= 7 and st <= 7: return 'perceptive-player'
    # social-butterfly: high social, liked by all
    if so >= 8 and st <= 7: return 'social-butterfly'
    # challenge-beast: dominant physical, not a strategist or social player
    if ph >= 8 and en >= 8 and st <= 6 and so <= 7: return 'challenge-beast'
    # loyal-soldier: sticks with alliances, passive
    if lo >= 8 and bo <= 5 and st <= 5: return 'loyal-soldier'
    # underdog: physically weak but loyal
    if ph <= 4 and en <= 6 and lo >= 7: return 'underdog'
    # dominant-stat fallback → floater if nothing fits
    top = sorted([('physical',ph),('endurance',en),('mental',me),('social',so),('strategic',st)], key=lambda x: -x[1])[0][0]
    if top in ('physical','endurance'): return 'loyal-soldier' if lo >= 7 else 'challenge-beast'
    if top == 'strategic': return 'mastermind' if lo <= 5 else 'loyal-soldier'
    if top == 'social': return 'social-butterfly'
    return 'floater'

# ── Build final roster ────────────────────────────────────────────────
def sc5(v): return max(1, min(10, v * 2))

roster = []
for name in sorted(raw.keys()):
    s5 = raw[name]
    ph  = sc5(s5.get('physical', 3))
    en  = sc5(s5.get('endurance', 3))
    me  = sc5(s5.get('mental', 3))
    so  = sc5(s5.get('social', 3))
    st  = sc5(s5.get('strategic', 3))
    lo  = sc5(s5.get('loyalty', 3))
    te  = sc5(s5.get('temperament', 3))
    # derive boldness: low loyalty, low temperament, high strategic, some physical
    lo5  = s5.get('loyalty', 3)
    te5  = s5.get('temperament', 3)
    st5  = s5.get('strategic', 3)
    ph5  = s5.get('physical', 3)
    bo_r = (6 - lo5) * 0.30 + (6 - te5) * 0.30 + st5 * 0.25 + ph5 * 0.15
    bo   = max(1, min(10, round(bo_r * 2)))
    # derive intuition: social awareness + mental sharpness
    so5  = s5.get('social', 3)
    me5  = s5.get('mental', 3)
    it_r = so5 * 0.55 + me5 * 0.45
    it   = max(1, min(10, round(it_r * 2)))

    stats = {'physical':ph,'endurance':en,'mental':me,'social':so,
             'strategic':st,'loyalty':lo,'boldness':bo,'intuition':it,'temperament':te}
    if name in FINAL_OVERRIDE:
        stats.update(FINAL_OVERRIDE[name])
    slug  = name.lower().replace(' ', '-')
    arch  = ARCHETYPE_OVERRIDE.get(name) or assign_archetype(stats)
    roster.append({
        'name': name, 'slug': slug,
        'gender': GENDER.get(name, 'm'),
        'archetype': arch, 'stats': stats
    })

out = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'franchise_roster.json')
with open(out, 'w', encoding='utf-8') as f:
    json.dump({'version': 1, 'count': len(roster), 'players': roster}, f, indent=2, ensure_ascii=False)
print(f'Written {len(roster)} players to franchise_roster.json')

# Spot-check
checks = ['Alejandro','Heather','Owen','Brick','MK','Emmah','Scary Girl','Scott','Zoey','Bowie','Gwen','Eva','Jo','Izzy','Dawn','Noah','Cody','Sky','Priya','Hicks','Duncan','Courtney','Lindsay','Beth','Stephanie','Tyler','Jasmine','Josee','Sam','Carrie','Ryan','Sanders']
for p in roster:
    if p['name'] in checks:
        print(f"  {p['name']:12s} [{p['archetype']:16s}] {p['stats']}")

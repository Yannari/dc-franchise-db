import json
# ══════════════════════════════════════════════════════════════════════
# venues/survival_ztraced.py — Soluna and Stawaki plates traced from the shows' own clean frames
# ══════════════════════════════════════════════════════════════════════
# Where Disventure Camp has a background frame with nobody in it, the plate IS that frame, traced
# into vector shapes (tools/td-camp/trace.py -> tools/td-camp/traced/*.json). Only the marks are ours:
# where people stand (feet in the frame's pixels, on a plane near the camera so they come out
# show-sized), and on the trial area where they sit and where the host stands. Frames with characters
# in them (the confessionals, the voting booths, the corn maze, DC4's trial) stay hand-drawn.
# A frame is the time of day it was drawn at: night frames render as night plates only.

PEOPLE_DEPTH = -2.6      # a person about a quarter of the frame tall, as the viewer's tokens expect
SEAT_DEPTH = 9.3         # the trial area's seats, far back across the deck


def vmark_seat(pxp, depth):
    x, z = px(pxp, depth)
    seat(x, depth, z)


# The moving parts of each frame, in its own pixels, live in tools/td-camp/traced/places.json beside
# its source (tools/td-camp/clean.py builds the plate from the same table): fires, waterfalls, still
# water, low fog, butterflies, a storm. The clouds are lifted out of the frame by clean.py itself.
PLACES = json.load(open(os.path.join(REPO, 'tools', 'td-camp', 'traced', 'places.json'), encoding='utf-8'))


def _live_marks(json_name, depth):
    """The live layer of a traced plate: lifted clouds (from <name>-live.json) and the parts above."""
    base = json_name[:-5]
    lj = os.path.join(REPO, 'tools', 'td-camp', 'traced', base + '-live.json')
    if os.path.exists(lj):
        for c in json.load(open(lj)).get('clouds', []):
            x, z = px((c['x'], c['y']), depth)
            mark('cloud', (x, depth, z), size=1.0, sprite=c['sprite'], w=round(c['w'] / 1600, 4))
    L = PLACES.get(base, {})
    painted = os.path.exists(os.path.join(REPO, 'tools', 'td-camp', 'traced', 'cuts', base + '-clean.png'))
    for (fx, fy, fh) in L.get('fire', []):
        x, z = px((fx, fy), depth)
        # on the show's own frame the flame is already drawn (the shader makes it lick): glow and sparks only
        mark('fire', (x, depth, z), size=1.0, hh=round(fh / 900, 4), **({'painted': 1} if painted else {}))
    for kind in ('fall', 'flutter'):
        for (x0, y0, x1, y1) in L.get(kind, []):
            x, z = px(((x0 + x1) / 2, (y0 + y1) / 2), depth)
            mark(kind, (x, depth, z), u0=x0 / 1600, v0=y0 / 900, u1=x1 / 1600, v1=y1 / 900)
    for (x0, y0, x1, y1, fish, *_) in L.get('pool', []):
        x, z = px(((x0 + x1) / 2, (y0 + y1) / 2), depth)
        mark('pool', (x, depth, z), u0=x0 / 1600, v0=y0 / 900, u1=x1 / 1600, v1=y1 / 900, fish=bool(fish))
    for (y0, y1) in L.get('mist', []):
        x, z = px((800, (y0 + y1) / 2), depth)
        mark('mist', (x, depth, z), v0=y0 / 900, v1=y1 / 900)
    # wildlife passing through: (kind, x0, y0, x1, y1) a band it moves along (crab, duck, squirrel, parrot, frog, seagull, raccoon)
    for (kind, x0, y0, x1, y1) in L.get('critters', []):
        x, z = px(((x0 + x1) / 2, (y0 + y1) / 2), depth)
        mark('critter', (x, depth, z), what=kind, u0=x0 / 1600, v0=y0 / 900, u1=x1 / 1600, v1=y1 / 900)
    if L.get('lightning'):
        x, z = px((800, 200), depth)
        mark('lightning', (x, depth, z))


def _depth_for(pct, seat=False):
    """The depth whose scale makes a person `pct` percent of the frame tall in the viewer (a standing
    token is s*125 % of the frame high, a seated one s*95 %; s = 1 / (0.675 * distance) for vcam)."""
    s = pct / (95.0 if seat else 125.0)
    return 1.0 / (0.675 * s) - 10.0


def _traced_plate(json_name, stands, seats=(), host=None, depth=20.0):
    """Stands are (x, feet y) or (x, feet y, height %): how tall a person standing there is in this
    frame, read off the frame itself (a door, a bench, a stump). The place's own 'ppl' (places.json)
    is the default; a seat's is 'seat', the host's 'host'."""
    P = PLACES.get(json_name[:-5], {})
    def build(tod):
        paint_mode()
        paint_sky('#000000', '#000000')
        vplate('Traced', json_name, depth)
        _live_marks(json_name, depth)
        for p in stands:
            pct = p[2] if len(p) > 2 else P.get('ppl', 25)
            # the viewer stands people with their feet above the dialogue panel (v <= .72)
            vmark_stand((p[0], min(p[1], 640)), _depth_for(pct))
        for p in seats:
            vmark_seat(p[:2], _depth_for(p[2] if len(p) > 2 else P.get('seat', 16), seat=True))
        if host:
            d = _depth_for(P.get('host', P.get('ppl', 25)))
            x, z = px(host[:2], d)
            mark('host', (x, d, z))
        vcam()
    return build


# (venue, spot, traced json, stands (feet, px), night frame?, extra)
T = [
    ('survival-island', 'jungle-trail', 'sol-bamboo.json', [(560, 640), (800, 645), (1040, 640)], False),
    ('survival-island', 'ruins', 'sol-ruins.json', [(380, 660), (640, 670), (900, 660)], False),
    ('survival-island', 'cave', 'sol-cave.json', [(560, 690), (820, 700), (1080, 690)], False),
    ('survival-island', 'shelter-t0', 'sol-fans.json', [(700, 640), (960, 650), (1200, 640)], False),
    ('survival-island', 'campfire-t0', 'sol-fans.json', [(1080, 650), (1300, 660), (1500, 650)], False),
    ('survival-island', 'campfire-t1', 'sol-favs.json', [(200, 660), (480, 670), (1000, 660)], False),
    ('survival-island', 'shelter-t1', 'sol-favs-in.json', [(560, 700), (800, 710), (1040, 700)], False),
    ('survival-island', 'shelter', 'sol-favs-in.json', [(560, 700), (800, 710), (1040, 700)], False),
    ('survival-island', 'campfire', 'sol-favs.json', [(200, 660), (480, 670), (1000, 660)], False),
    ('carnival', 'campsite-t0', 'cv-red.json', [(400, 690), (640, 700), (880, 690)], False),
    ('carnival', 'shelter-t0', 'cv-red-in.json', [(560, 690), (800, 700), (1040, 690)], False),
    ('carnival', 'campsite-t1', 'cv-blue.json', [(980, 690), (1200, 700), (1440, 690)], False),
    ('carnival', 'shelter-t1', 'cv-blue-in.json', [(560, 700), (800, 710), (1040, 700)], False),
    ('carnival', 'campsite', 'cv-blue.json', [(980, 690), (1200, 700), (1440, 690)], False),
    ('carnival', 'shelter', 'cv-blue-in.json', [(560, 700), (800, 710), (1040, 700)], False),
    ('carnival', 'campsite-merge', 'cv-merge.json', [(300, 690), (560, 700), (820, 690)], False),
    ('carnival', 'shelter-merge', 'cv-merge-in.json', [(560, 700), (800, 710), (1040, 700)], False),
    ('carnival', 'theater-tent', 'cv-theater.json', [(500, 720), (800, 730), (1100, 720)], True),
    ('carnival', 'midway', 'cv-midway.json', [(500, 700), (800, 710), (1100, 700)], True),
    ('carnival', 'carnival-entrance', 'cv-entrance.json', [(560, 720), (800, 730), (1040, 720)], False),
    ('carnival', 'haunted-mansion', 'cv-mansion.json', [(500, 740), (800, 750), (1100, 740)], True),
    ('carnival', 'exit', 'cv-boat.json', [(420, 640), (300, 630), (900, 640)], True),     # Boat_of_Losers: the dock on the left
]

for (venue, spot, js, stands, night) in T:
    if not os.path.exists(os.path.join(REPO, 'tools', 'td-camp', 'traced', js)):
        continue
    SCENES[venue][spot] = _traced_plate(js, stands)
    OUTDOOR[venue].discard(spot)
    if night:
        NIGHT_ONLY.add(spot)

# DC5's Elimination Trial: the wide clean frame. The tiki-pot seats run along the left of the deck,
# the rest sit on the deck around the fire; the host stands by the angry tiki podium on the right.
if os.path.exists(os.path.join(REPO, 'tools', 'td-camp', 'traced', 'sol-trial.json')):
    # the user's empty trial (2026-10-08): one camper on each of the twelve tiki pots (two staggered
    # rows, the back row first so the front row sits in front), Chris behind the tiki podium on the right
    _back = [(x, 575) for x in (243, 320, 400, 477, 563, 643)]
    _front = [(x, 592) for x in (293, 373, 450, 530, 617, 693)]
    SCENES['survival-island']['ceremony'] = _traced_plate('sol-trial.json', [(760, 640), (1180, 640)], seats=_back + _front, host=(1300, 625))

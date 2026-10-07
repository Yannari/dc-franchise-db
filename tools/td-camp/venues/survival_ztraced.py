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


# The moving parts of each frame, placed in its own pixels (tools/td-camp/live.py lifts the clouds
# out automatically; the rest is read off the frame by hand):
#   fire (x, y foot, h)   a torch or a campfire: the viewer's animated flame over the drawn one
#   fall (x0, y0, x1, y1) a waterfall: streaks running down, mist at its foot
#   pool (x0, y0, x1, y1, fish?)  still water: glints, now and then a fish
#   mist (y0, y1)         low fog drifting across that band
#   flutter (x0, y0, x1, y1)  butterflies over a sunny clearing
LIVE = {
    'sol-ruins.json': {'fire': [(950, 652, 28), (1236, 662, 28)], 'fall': [(370, 556, 400, 690)], 'flutter': [(100, 600, 850, 720)]},
    'sol-fans.json': {'fire': [(1225, 708, 42)], 'fall': [(1116, 410, 1142, 560)], 'flutter': [(100, 620, 900, 720)]},
    'sol-favs.json': {'fire': [(322, 692, 40), (860, 578, 30), (1200, 578, 30)], 'pool': [(0, 596, 1600, 622, False)]},
    'sol-bamboo.json': {'flutter': [(200, 560, 1400, 700)]},
    'sol-trial.json': {'fire': [(392, 704, 150), (1512, 185, 180), (60, 382, 24), (290, 372, 24), (760, 372, 24), (994, 382, 24), (1234, 372, 24), (1466, 372, 24)]},
    'cv-red.json': {'fire': [(962, 792, 50)], 'mist': [(760, 900)]},
    'cv-blue.json': {'fire': [(1290, 722, 50)], 'mist': [(700, 880)]},
    'cv-merge.json': {'fire': [(300, 668, 40)], 'mist': [(680, 880)]},
    'cv-theater.json': {'mist': [(760, 880)]},
    'cv-midway.json': {'mist': [(640, 800)]},
    'cv-entrance.json': {'mist': [(720, 880)]},
    'cv-mansion.json': {'mist': [(680, 880)]},
    'cv-boat.json': {'fire': [(140, 402, 40), (292, 426, 36)], 'pool': [(0, 590, 1600, 900, True)]},
}


def _live_marks(json_name, depth):
    """The live layer of a traced plate: lifted clouds (from <name>-live.json) and the parts above."""
    base = json_name[:-5]
    lj = os.path.join(REPO, 'tools', 'td-camp', 'traced', base + '-live.json')
    if os.path.exists(lj):
        for c in json.load(open(lj)).get('clouds', []):
            x, z = px((c['x'], c['y']), depth)
            mark('cloud', (x, depth, z), size=1.0, sprite=c['sprite'], w=round(c['w'] / 1600, 4))
    L = LIVE.get(json_name, {})
    for (fx, fy, fh) in L.get('fire', []):
        x, z = px((fx, fy), depth)
        mark('fire', (x, depth, z), size=1.0, hh=round(fh / 900, 4))
    for kind in ('fall', 'flutter'):
        for (x0, y0, x1, y1) in L.get(kind, []):
            x, z = px(((x0 + x1) / 2, (y0 + y1) / 2), depth)
            mark(kind, (x, depth, z), u0=x0 / 1600, v0=y0 / 900, u1=x1 / 1600, v1=y1 / 900)
    for (x0, y0, x1, y1, fish) in L.get('pool', []):
        x, z = px(((x0 + x1) / 2, (y0 + y1) / 2), depth)
        mark('pool', (x, depth, z), u0=x0 / 1600, v0=y0 / 900, u1=x1 / 1600, v1=y1 / 900, fish=bool(fish))
    for (y0, y1) in L.get('mist', []):
        x, z = px((800, (y0 + y1) / 2), depth)
        mark('mist', (x, depth, z), v0=y0 / 900, v1=y1 / 900)


def _traced_plate(json_name, stands, seats=(), host=None, depth=20.0):
    def build(tod):
        paint_mode()
        paint_sky('#000000', '#000000')
        vtraced('Traced', json_name, depth)
        _live_marks(json_name, depth)
        for p in stands:
            # the viewer stands people with their feet above the dialogue panel (v <= .72)
            vmark_stand((p[0], min(p[1], 640)), PEOPLE_DEPTH)
        for p in seats:
            vmark_seat(p, SEAT_DEPTH)
        if host:
            x, z = px(host, SEAT_DEPTH)
            mark('host', (x, SEAT_DEPTH, z))
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
    _pots = [(30 + i * 34, 585) for i in range(9)]
    _deck = [(200, 690), (300, 720), (1000, 700), (1120, 730), (1240, 700), (1360, 680)]
    SCENES['survival-island']['ceremony'] = _traced_plate('sol-trial.json', [(820, 760), (1060, 770)], seats=_pots + _deck, host=(1170, 600))

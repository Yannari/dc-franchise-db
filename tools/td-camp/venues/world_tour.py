# ══════════════════════════════════════════════════════════════════════
# venues/world_tour.py — the jet: a battered old plane, plus wherever it lands
# ══════════════════════════════════════════════════════════════════════
# js/camp-access.js 'world-tour': economy, aisle, galley, cargo-hold, first-class,
# destination-staging. From Total Drama World Tour (Total Drama Wiki): the confessional is
# the plane's lavatory; the elimination is the Barf Bag Ceremony in a compartment at the back
# of the plane, the passports stamped to vote and the safe ones handed bags of peanuts; the
# loser leaves by the Drop of Shame, out of the open hatch with a parachute. No real country
# is ever named or shown — the destination is a dusty airstrip anywhere.


def window_row(x, y0, y1, step, z, tod, side=1, glow=None):
    """Oval plane windows down one wall: a dark frame, sky in the pane."""
    pane = mat('Pane' + tod, '#bfe6f5' if tod == 'day' else '#2a3a6a', emit='#bfe6f5' if tod == 'day' else None, strength=0.6 if tod == 'day' else 0)
    frame = mat('PaneFrame', '#d8d2c4')
    y = y0
    while y <= y1:
        f = cyl(uid('WinFrame'), 0.26, 0.04, (x - side * 0.01, y, z), frame, verts=20, rot=(0, 90, 0), bevel=0)
        f.scale = (1.0, 0.8, 1.0)
        p = cyl(uid('WinPane'), 0.2, 0.05, (x - side * 0.02, y, z), pane, verts=20, rot=(0, 90, 0), bevel=0)
        p.scale = (1.0, 0.8, 1.0)
        y += step


def fuselage(W, D, H, wall='#d8d2c4', floor='#5a6a7a', ceiling='#e6e0d4', carpet=True):
    """A cabin box with a curved feel: the upper walls lean in, a strip of ceiling between them."""
    interior(W, D, H, wall, floor, ceiling, floor_kind='flat', wall_kind='flat')
    for side in (-1, 1):
        box(uid('Cove'), (0.2, D, 1.1), (side * (W / 2 - 0.35), D / 2, H - 0.35), mat('Cove', _mix(wall, '#000000', 0.06)), bevel=0, rot=(0, side * 35, 0))
    if carpet:
        box('AisleCarpet', (0.8, D, 0.02), (0, D / 2, 0.01), mat('AisleCarpet', '#3a4a7a'), bevel=0)


def plane_seat(loc, color='#5a6a8a', rot_z=0, worn=False, wide=False):
    g = _group(uid('Seat'), loc, rot_z)
    w = 0.75 if wide else 0.5
    c = mat('SeatFab' + color, color)
    _child(g, box(uid('SeatCush'), (w, 0.5, 0.15), (0, 0, 0.45), c, bevel=0.03))
    _child(g, box(uid('SeatBack'), (w, 0.14, 0.85), (0, 0.24, 0.9), c, bevel=0.03, rot=(-8, 0, 0)))
    _child(g, box(uid('Headrest'), (w * 0.8, 0.12, 0.18), (0, 0.27, 1.32), mat('Headrest', '#e8e2d4'), bevel=0.02))
    _child(g, box(uid('SeatLeg'), (w * 0.8, 0.4, 0.38), (0, 0, 0.19), mat('SeatLeg', '#4a4a52'), bevel=0))
    if worn:
        _child(g, box(uid('Patch'), (0.18, 0.02, 0.16), (0.1, 0.16, 0.95), mat('Duct', '#9aa0a6'), bevel=0, rot=(-8, 0, 20)))
    return g


def bins(W, D, H, y0=0.4):
    for side in (-1, 1):
        box(uid('Bins'), (0.65, D - y0, 0.45), (side * (W / 2 - 0.42), (D + y0) / 2, H - 0.55), mat('Bins', '#ece6da'), bevel=0)
        y = y0 + 0.9
        while y < D:
            box(uid('BinSeam'), (0.66, 0.02, 0.46), (side * (W / 2 - 0.42), y, H - 0.55), mat('BinSeam', '#b8b2a6'), bevel=0)
            y += 1.6


def wt_economy(tod):
    """Economy class: two-and-two rows of tired seats, duct tape, an overhead bin that won't shut."""
    W, D, H = 3.6, 12.0, 2.5
    fuselage(W, D, H)
    bins(W, D, H)
    for r in range(8):
        y = 2.2 + r * 1.15
        for x in (-1.3, -0.78, 0.78, 1.3):
            plane_seat((x, y, 0), color=('#4a5a8a', '#5a4a6a')[r % 2], rot_z=180, worn=(r + int(x * 10)) % 3 == 0)
    box('OpenBin', (0.6, 0.06, 0.4), (-1.18, 5.0, H - 0.98), mat('Bins', '#ece6da'), bevel=0, rot=(-50, 0, 0))
    box('Suitcase', (0.4, 0.25, 0.3), (-1.2, 5.1, H - 0.72), mat('Suitcase', '#bf3f5a'), bevel=0)
    for side in (-1, 1):
        window_row(side * (W / 2 - 0.1), 2.0, 11.0, 1.15, 1.25, tod, side)
    for y in range(2, 12, 3):
        box(uid('CabinLight'), (0.4, 1.0, 0.03), (0, y, H - 0.02), mat('CabinLight', '#fff6e8', emit='#fff6e8', strength=2.5), bevel=0)
    indoor_light(W, D, H, power=500, x=0.3, amb=0.66)
    tv_camera((0.25, 0.3, 1.6), (0, D, 1.15), lens=20)


def wt_aisle(tod):
    """The aisle: standing between the rows, a drinks cart parked halfway, the curtain to first class at the end."""
    W, D, H = 3.6, 14.0, 2.5
    fuselage(W, D, H)
    bins(W, D, H)
    for r in range(9):
        y = 1.6 + r * 1.15
        for x in (-1.3, -0.78, 0.78, 1.3):
            plane_seat((x, y, 0), color=('#4a5a8a', '#5a4a6a')[r % 2], rot_z=0)
    box('Cart', (0.5, 0.8, 1.0), (0.05, 6.5, 0.5), mat('Cart', '#c9ccd2', metal=0.3, rough=0.4), bevel=0.02)
    for k in range(4):
        cyl(uid('CartCup'), 0.04, 0.1, (-0.1 + (k % 2) * 0.2, 6.3 + (k // 2) * 0.3, 1.05), mat('Cup', '#f6f3ea'), verts=10, bevel=0)
    box('Curtain', (W - 0.4, 0.06, H - 0.1), (0, D - 0.3, (H - 0.1) / 2), mat('FCCurtain', '#8a1e2e'), bevel=0)
    for i in range(8):
        box(uid('Fold'), (0.06, 0.1, H - 0.1), (-1.4 + i * 0.4, D - 0.36, (H - 0.1) / 2), mat('FCFold', '#6a1422'), bevel=0)
    for side in (-1, 1):
        window_row(side * (W / 2 - 0.1), 1.5, 12.0, 1.15, 1.25, tod, side)
    for y in range(2, 14, 3):
        box(uid('CabinLight'), (0.4, 1.0, 0.03), (0, y, H - 0.02), mat('CabinLight', '#fff6e8', emit='#fff6e8', strength=2.5), bevel=0)
    indoor_light(W, D, H, power=500, x=0.3, amb=0.66)
    tv_camera((0.0, 0.2, 1.7), (0, D, 1.3), lens=22)


def wt_galley(tod):
    """The galley: steel cupboards, an oven door, a hot plate of something grey, a little window."""
    W, D, H = 3.4, 2.6, 2.4
    fuselage(W, D, H, wall='#cfcac0', floor='#6f7a84', carpet=False)
    steel = mat('Steel', '#b8bcc4', metal=0.4, rough=0.35)
    box('Counter', (3.0, 0.6, 0.95), (0, D - 0.35, 0.47), steel, bevel=0.01)
    for i in range(5):
        box(uid('Cupboard'), (0.55, 0.06, 0.55), (-1.2 + i * 0.6, D - 0.08, 1.9), mat('Cupboard', '#a8acb4', metal=0.3), bevel=0.01)
        cyl(uid('Latch'), 0.03, 0.04, (-1.2 + i * 0.6, D - 0.13, 1.72), mat('Latch', '#e2ab3a'), verts=10, rot=(90, 0, 0), bevel=0)
    for i in range(3):
        box(uid('Drawer'), (0.85, 0.06, 0.25), (-0.9 + i * 0.9, D - 0.67, 0.65), mat('Drawer', '#9aa0a8', metal=0.3), bevel=0)
    box('Oven', (0.7, 0.06, 0.5), (1.0, D - 0.08, 1.25), mat('OvenDoor', '#3a3a40'), bevel=0)
    cyl('HotPlate', 0.2, 0.03, (-0.6, D - 0.35, 0.97), mat('HotPlate', '#3a3a40'), verts=20, bevel=0)
    sphere('Slop', 0.15, (-0.6, D - 0.35, 1.02), mat('Slop', '#9a9a7a'))
    cyl('Kettle', 0.12, 0.25, (0.3, D - 0.35, 1.07), steel, verts=16, r2=0.08, bevel=0)
    window_row(-(W / 2 - 0.1), 1.2, 1.2, 1.0, 1.35, tod, -1)
    box('Sign', (0.6, 0.04, 0.2), (0.6, D - 0.12, 2.2), mat('GalleySign', '#3a3a40'), bevel=0)
    text_obj('GalleyTxt', 'GALLEY', (0.6, D - 0.15, 2.2), 0.11, '#f6f0de')
    indoor_light(W, D, H, power=420, x=0.0, amb=0.66)
    tv_camera((0.0, 0.05, 1.6), (0, D, 1.15), lens=18)


def wt_cargo(tod):
    """The cargo hold: a dim ribbed belly, nets over crates and luggage, a single caged bulb."""
    W, D, H = 5.0, 9.0, 3.2
    interior(W, D, H, '#6f6a62', '#4f4c48', '#3f3c38', floor_kind='flat', wall_kind='flat')
    for y in range(1, 9, 1):
        for side in (-1, 1):
            box(uid('Rib'), (0.12, 0.18, H), (side * (W / 2 - 0.1), y, H / 2), mat('Rib', '#5a5650'), bevel=0)
        box(uid('RibTop'), (W, 0.18, 0.12), (0, y, H - 0.06), mat('Rib', '#5a5650'), bevel=0)
    rnd = random.Random(4)
    cols = ('#a8834f', '#8a6a3a', '#bf3f5a', '#3f7fbf', '#3fae6a', '#6a6a72')
    for i, (x, y, s) in enumerate(((-1.6, 5.5, 1.0), (-1.5, 6.6, 0.9), (-1.7, 5.9, 0.7), (1.5, 6.0, 1.1), (1.4, 4.4, 0.6), (0.2, 7.6, 0.8), (1.6, 7.4, 0.8))):
        z = 0.5 * s + (0.9 if i == 2 else 0)
        box(uid('Cargo'), (s, s * 0.9, s), (x, y, z), mat('Cargo' + str(i % 6), cols[i % 6]), bevel=0.02)
    netm = mat('CargoNet', '#c9b48a')
    for i in range(9):
        box(uid('Net'), (0.03, 2.4, 0.03), (-1.6 + (i - 4) * 0.12, 6.0, 0.2 + i * 0.22), netm, bevel=0)
    box('Cage', (0.6, 0.6, 0.5), (1.2, 3.0, 0.25), mat('CageBars', '#9aa0a6', metal=0.4), bevel=0)
    box('Hatch', (2.4, 0.1, 2.0), (0, D - 0.06, 1.2), mat('Hatch', '#7a766e'), bevel=0)
    for x in (-1.0, 1.0):
        box(uid('HatchBolt'), (0.12, 0.06, 1.8), (x, D - 0.12, 1.2), mat('HatchBolt', '#e2ab3a'), bevel=0)
    cyl('Bulb', 0.1, 0.18, (0, 4.5, H - 0.3), mat('BulbGlow', '#ffe2a8', emit='#ffe2a8', strength=6), verts=12, bevel=0)
    point('HoldBulb', (0, 4.5, H - 0.5), 380, '#ffd9a0', radius=0.1)
    indoor_light(W, D, H, color='#ffe2a8', power=220, amb=0.3, fill='#a8b0c8')
    tv_camera((0.4, 0.3, 1.6), (0, D, 1.1), lens=21)


def wt_first(tod):
    """First class: wide cream recliners, a little table with fruit and a glass, gold trim, the best windows."""
    W, D, H = 4.0, 8.0, 2.6
    fuselage(W, D, H, wall='#efe6d4', floor='#7a2a3a', ceiling='#f4ecdc')
    box('GoldStrip', (0.3, D, 0.04), (0, D / 2, H - 0.04), mat('GoldTrim', '#e8b938', metal=0.5, rough=0.35), bevel=0)
    for r in range(3):
        y = 2.0 + r * 2.0
        for x in (-1.2, 1.2):
            plane_seat((x, y, 0), color='#e8dcc4', rot_z=180, wide=True)
            box(uid('SideTable'), (0.3, 0.5, 0.06), (x + (0.6 if x < 0 else -0.6), y - 0.3, 0.7), mat('SideTable', '#6b4a2e'), bevel=0)
    for x in (-0.6, 0.6):
        cyl(uid('Glass'), 0.04, 0.15, (x, 1.7, 0.8), mat('GlassFizz', '#f2d27a'), verts=10, bevel=0)
    sphere('Grapes', 0.08, (-0.65, 1.8, 0.78), mat('Grape', '#8a4ab4'))
    for side in (-1, 1):
        window_row(side * (W / 2 - 0.1), 1.5, 7.0, 1.0, 1.3, tod, side)
    box('Divider', (W, 0.08, 0.8), (0, D - 0.06, 1.8), mat('Divider', '#8a1e2e'), bevel=0)
    text_obj('FCTxt', 'FIRST CLASS', (0, D - 0.12, 1.85), 0.18, '#e8b938')
    for y in (2, 5):
        cyl(uid('Chandelier'), 0.25, 0.15, (0, y, H - 0.1), mat('Chandelier', '#fff1c8', emit='#fff1c8', strength=3), verts=16, r2=0.12, bevel=0)
    indoor_light(W, D, H, color='#ffe8c8', power=520, x=0.2, amb=0.68)
    tv_camera((0.0, 0.2, 1.6), (0, D, 1.1), lens=20)


def jet(loc, tod, rot_z=0, scale=1.0):
    """The old jet itself: a long white body, a tail fin, two wings, a stripe, round windows."""
    g = _group(uid('Jet'), loc, rot_z)
    body = mat('JetBody' + tod, C('#ece8de', tod))
    s = scale
    b = cyl(uid('Fuselage'), 1.6 * s, 22 * s, (0, 0, 2.6 * s), body, verts=32, rot=(90, 0, 0), bevel=0)
    _child(g, b)
    _child(g, sphere(uid('Nose'), 1.6 * s, (0, -11 * s, 2.6 * s), body, scale=(1, 1.6, 1)))
    _child(g, cyl(uid('Tailcone'), 1.6 * s, 4 * s, (0, 13 * s, 2.9 * s), body, verts=32, rot=(90, 0, 0), r2=0.5 * s, bevel=0))
    _child(g, box(uid('Fin'), (0.25 * s, 3.0 * s, 3.2 * s), (0, 12.6 * s, 4.4 * s), mat('Fin' + tod, C('#c8463c', tod)), bevel=0, rot=(-20, 0, 0)))
    _child(g, box(uid('Wing'), (18 * s, 3.2 * s, 0.25 * s), (0, 1.5 * s, 1.8 * s), body, bevel=0))
    _child(g, box(uid('Stripe'), (3.24 * s, 22 * s, 0.25 * s), (0, 0, 2.4 * s), mat('JetStripe' + tod, C('#3f7fbf', tod)), bevel=0))
    for x in (-5 * s, 5 * s):
        _child(g, cyl(uid('Engine'), 0.6 * s, 2.2 * s, (x, 0.6 * s, 1.2 * s), mat('Engine' + tod, C('#9aa0a8', tod)), verts=20, rot=(90, 0, 0), bevel=0))
    win = mat('JetWin' + tod, C('#3a4a6a', tod) if tod == 'day' else '#ffd27a', emit=None if tod == 'day' else '#ffd27a', strength=0 if tod == 'day' else 1.5)
    for i in range(14):
        _child(g, cyl(uid('JetWin'), 0.18 * s, 0.05 * s, (-1.58 * s, -8 * s + i * 1.3 * s, 3.1 * s), win, verts=12, rot=(0, 90, 0), bevel=0))
    for y in (-8 * s, 2 * s):
        for x in ((0,) if y < 0 else (-1.4 * s, 1.4 * s)):
            _child(g, cyl(uid('Gear'), 0.4 * s, 0.3 * s, (x, y, 0.4 * s), mat('Tyre' + tod, C('#1e1e22', tod)), verts=16, rot=(0, 90, 0), bevel=0))
            _child(g, box(uid('Strut'), (0.12 * s, 0.12 * s, 1.0 * s), (x, y, 1.0 * s), mat('GearStrut' + tod, C('#6a6a72', tod)), bevel=0))
    return g


def wt_destination(tod):
    """The landing spot: a dusty airstrip with the jet parked behind, a stair truck, crates of gear for the challenge."""
    ground(C('#d2b07a', tod), size=(200, 160), loc=(0, 40, 0))
    box('Runway', (12, 120, 0.02), (0, 50, 0.01), mat('Runway' + tod, C('#6f6a64', tod)), bevel=0)
    y = 10
    while y < 110:
        box(uid('RunwayDash'), (0.3, 3.0, 0.01), (0, y, 0.025), mat('RunwayDash' + tod, C('#f0e6c0', tod)), bevel=0)
        y += 7
    hills(120, '#b88a5a', tod, n=7, h=22, seed=9, x0=-150, x1=150)
    hills(95, '#c9a06a', tod, n=6, h=12, seed=14, x0=-130, x1=130)
    jet((-7.5, 24, 0), tod, rot_z=-70, scale=1.0)
    g = _group('StairTruck', (-2.0, 17.5, 0), 20)
    _child(g, box(uid('TruckBed'), (1.8, 4.0, 0.8), (0, 0, 0.8), mat('Truck' + tod, C('#e2ab3a', tod)), bevel=0))
    _child(g, box(uid('Stairs'), (1.2, 4.2, 0.2), (0, 0.2, 2.2), mat('Stairs' + tod, C('#9aa0a8', tod)), bevel=0, rot=(32, 0, 0)))
    for i, (x, y, s) in enumerate(((3.5, 9.0, 1.0), (4.6, 9.4, 0.8), (3.9, 10.4, 0.9), (-4.0, 7.0, 0.7))):
        box(uid('GearCrate'), (s, s, s), (x, y, s / 2), mat('GearCrate' + tod, C('#a8834f', tod)), bevel=0.02)
    text_obj('CrateStamp', 'FRAGILE', (3.5, 8.48, 0.55), 0.14, C('#8a2a1c', tod))
    for x in (-8.0, 8.0):
        cyl(uid('Cone'), 0.25, 0.6, (x * 0.5, 4.0, 0.3), mat('Cone' + tod, C('#ff7a2a', tod)), verts=12, r2=0.03, bevel=0)
    windsock = cyl('Windsock', 0.25, 1.4, (9.0, 14.0, 4.2), mat('Windsock' + tod, C('#ff7a2a', tod)), verts=12, r2=0.12, rot=(0, 80, 0), bevel=0)
    post((8.3, 14.0, 0), 4.3, tod, r=0.06, color='#9aa0a8')
    for i, (x, y) in enumerate(((-14, 8), (13, 6), (16, 12))):
        icorock(uid('Boulder'), (1.2, 1.0, 0.8), (x, y, 0.3), C('#b89a6a', tod), seed=i + 60)
    if tod == 'night':
        for x in (-6.5, 6.5):
            for yy in (8, 20, 32):
                sphere(uid('Bulb'), 0.15, (x, yy, 0.15), mat('RunwayLight', '#8ad0ff', emit='#8ad0ff', strength=6))
        point(uid('FloodLight'), (0, 12, 6), 2200, '#fff0d0', radius=1.0)
    sky(tod); sun(tod, azimuth=-45, elevation=55 if tod == 'day' else 30)
    tv_camera((1.5, -5.5, 1.75), (-1.0, 16, 2.2), lens=24)


def wt_confessional(tod):
    """The plane's lavatory: a steel toilet, a tiny sink and mirror, a fold-out sign, no room to turn round."""
    W, D, H = 1.8, 2.0, 2.3
    interior(W, D, H, '#d8d2c4', '#7a8490', '#e6e0d4', floor_kind='flat', wall_kind='flat')
    steel = mat('Steel', '#b8bcc4', metal=0.4, rough=0.35)
    cyl('Toilet', 0.25, 0.45, (0, D - 0.4, 0.22), steel, verts=20, r2=0.2, bevel=0)
    cyl('ToiletSeat', 0.26, 0.04, (0, D - 0.42, 0.46), mat('ToiletSeat', '#3a3a40'), verts=20, bevel=0)
    box('Tank', (0.5, 0.2, 0.45), (0, D - 0.12, 0.7), steel, bevel=0.01)
    box('Sink', (0.45, 0.4, 0.12), (0.6, D - 0.3, 0.9), steel, bevel=0.01)
    box('SinkStand', (0.4, 0.35, 0.85), (0.6, D - 0.28, 0.42), mat('SinkStand', '#cfcac0'), bevel=0)
    box('Mirror', (0.45, 0.04, 0.55), (0.6, D - 0.08, 1.45), mat('Mirror', '#cfe0ea', rough=0.1), bevel=0)
    box('NoSmoke', (0.32, 0.04, 0.32), (-0.55, D - 0.08, 1.55), mat('NoSmoke', '#f6f3ea'), bevel=0)
    cyl('NoSmokeRing', 0.13, 0.02, (-0.55, D - 0.11, 1.55), mat('NoSmokeRed', '#c8463c'), verts=20, rot=(90, 0, 0), bevel=0)
    box('NoSmokeBar', (0.24, 0.02, 0.03), (-0.55, D - 0.12, 1.55), mat('NoSmokeRed', '#c8463c'), bevel=0, rot=(0, 45, 0))
    window_row(-(W / 2 - 0.1), 1.3, 1.3, 1.0, 1.55, tod, -1)
    box('Light', (0.6, 0.3, 0.03), (0, D / 2, H - 0.02), mat('LavLight', '#fff6e8', emit='#fff6e8', strength=2.5), bevel=0)
    box('Handrail', (0.04, 0.6, 0.04), (W / 2 - 0.12, D - 0.7, 1.0), steel, bevel=0)
    indoor_light(W, D, H, power=320, x=0.0, amb=0.66)
    tv_camera((0.0, 0.05, 1.55), (0, D, 1.0), lens=15)


def wt_ceremony(tod):
    """The Barf Bag Ceremony: the rear compartment, rows of seats facing a stand with the stamp and the peanut bags."""
    W, D, H = 4.2, 7.0, 2.6
    fuselage(W, D, H, wall='#c9c2b4', floor='#4f5a66', ceiling='#d8d2c4')
    for r in range(2):
        for x in (-1.4, -0.85, 0.85, 1.4):
            plane_seat((x, 1.4 + r * 1.1, 0), color='#4a5a8a', rot_z=180)
    box('Stand', (1.0, 0.6, 1.05), (0.9, D - 1.0, 0.52), mat('BagStand', '#6b4a2e'), bevel=0)
    tray = mat('BagTray', '#c9ccd2', metal=0.3)
    box('Tray', (0.8, 0.5, 0.04), (0.9, D - 1.0, 1.07), tray, bevel=0)
    for i in range(7):
        box(uid('BarfBag'), (0.14, 0.08, 0.22), (0.62 + (i % 4) * 0.18, D - 1.1 + (i // 4) * 0.2, 1.2), mat('BarfBag', '#f2ecd8'), bevel=0.01)
    box('Stamp', (0.12, 0.12, 0.15), (-0.2, D - 1.0, 1.12), mat('Stamp', '#3a3a40'), bevel=0)
    box('StampTable', (0.7, 0.5, 0.9), (-0.25, D - 1.0, 0.45), mat('StampTable', '#7a5232'), bevel=0)
    box('Passports', (0.2, 0.28, 0.06), (-0.45, D - 1.0, 0.93), mat('Passport', '#2a3a6a'), bevel=0)
    box('Hatch', (1.6, 0.08, 2.1), (-1.0, D - 0.06, 1.05), mat('ExitHatch', '#9aa0a8'), bevel=0)
    box('HatchSign', (0.7, 0.04, 0.22), (-1.0, D - 0.12, 2.3), mat('ExitSign', '#c8463c', emit='#c8463c', strength=2), bevel=0)
    text_obj('HatchTxt', 'EXIT', (-1.0, D - 0.15, 2.3), 0.14, '#fff6f0')
    for side in (-1, 1):
        window_row(side * (W / 2 - 0.1), 1.0, 5.5, 1.1, 1.3, tod, side)
    for y in (2.5, 5.0):
        box(uid('CabinLight'), (0.4, 1.0, 0.03), (0, y, H - 0.02), mat('CabinLight', '#ffe8c8', emit='#ffe8c8', strength=2.0), bevel=0)
    indoor_light(W, D, H, color='#ffe2c0', power=420, x=0.3, amb=0.5)
    tv_camera((0.0, -0.1, 1.85), (0.2, D, 1.0), lens=20)


def wt_exit(tod):
    """The Drop of Shame: the hatch open on the night sky, the wind pulling at the straps, a parachute pack on the hook."""
    tod = 'night'
    W, D, H = 4.0, 3.6, 2.6
    interior(W, D, H, '#9aa0a8', '#5a6068', '#7a8088', floor_kind='flat', wall_kind='flat')
    # cut the open hatch: replace the back wall with a frame around a hole onto the sky
    bpy.data.objects.remove(bpy.data.objects['BackWall'], do_unlink=True)
    wall = mat('HatchWall', '#9aa0a8')
    box('BWLeft', (1.1, 0.2, H), (-W / 2 + 0.55, D, H / 2), wall, bevel=0)
    box('BWRight', (1.1, 0.2, H), (W / 2 - 0.55, D, H / 2), wall, bevel=0)
    box('BWTop', (W, 0.2, 0.5), (0, D, H - 0.25), wall, bevel=0)
    box('BWSill', (W, 0.2, 0.25), (0, D, 0.12), wall, bevel=0)
    stripe = mat('Hazard', '#e8c23a')
    for i in range(8):
        box(uid('HazStripe'), (0.16, 0.22, 0.25), (-0.9 + i * 0.26, D, 0.13), stripe if i % 2 == 0 else mat('HazDark', '#2a2a30'), bevel=0)
    box('HatchDoor', (1.8, 0.1, 1.9), (1.2, D - 0.6, 1.1), mat('HatchDoor', '#7a8088'), bevel=0, rot=(0, 0, -70))
    for i, x in enumerate((-1.2, -0.7)):
        box(uid('Strap'), (0.05, 0.03, 1.0), (x, D - 0.4, 1.9 - i * 0.1), mat('Strap', '#c8463c'), bevel=0, rot=(0, 0, 20 + i * 10))
    box('Pack', (0.45, 0.25, 0.6), (-1.6, D - 0.6, 1.4), mat('Pack', '#3f7a3a'), bevel=0.04)
    box('PackHook', (0.05, 0.05, 0.2), (-1.6, D - 0.6, 1.8), mat('Hook', '#c9ccd2', metal=0.4), bevel=0)
    box('JumpSign', (0.8, 0.04, 0.25), (W / 2 - 0.55, D - 0.12, 2.0), mat('JumpSign', '#c8463c', emit='#c8463c', strength=2), bevel=0)
    text_obj('JumpTxt', 'JUMP', (W / 2 - 0.55, D - 0.15, 2.0), 0.15, '#fff6f0')
    # the outside: clouds below the hatch, far lights of somewhere unnamed
    cloud = mat('Cloud', '#7a88b8')
    rnd = random.Random(3)
    for i in range(18):
        sphere(uid('Cloud'), 1.0, (rnd.uniform(-40, 40), rnd.uniform(40, 120), rnd.uniform(-30, -12)), cloud, scale=(rnd.uniform(6, 14), rnd.uniform(4, 8), rnd.uniform(1.5, 3)))
    point('RedBeacon', (-1.6, D - 0.2, 2.35), 120, '#ff4a4a', radius=0.05)
    indoor_light(W, D, H, color='#c8d4ff', power=220, x=0.0, amb=0.35, fill='#8a98c8')
    sky('night')
    tv_camera((0.2, 0.1, 1.6), (0, D + 4, 0.9), lens=18)


SCENES['world-tour'] = {
    'economy': wt_economy, 'aisle': wt_aisle, 'galley': wt_galley, 'cargo-hold': wt_cargo,
    'first-class': wt_first, 'destination-staging': wt_destination,
    'confessional': wt_confessional, 'ceremony': wt_ceremony, 'exit': wt_exit,
}
OUTDOOR['world-tour'] = {'destination-staging'}

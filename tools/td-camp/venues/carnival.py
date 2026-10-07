# ══════════════════════════════════════════════════════════════════════
# venues/carnival.py — Stawaki: an abandoned carnival on a lake island (Disventure Camp 4)
# ══════════════════════════════════════════════════════════════════════
# js/camp-access.js 'carnival': campsite, shelter, forest-edge, rocky-beach, lake-shore,
# carnival-entrance, midway, trial-area, haunted-mansion, corn-maze, theater-tent, big-top.
# From the Disventure Camp wiki: the Elimination Trial is held at sundown in the trial area
# by the lake, the votes cast earlier in a voting booth a walk away and read out of an urn,
# and the loser leaves on the Boat of Losers. The show has no fixed confessional set, so the
# carnival's own photo booth stands in for one (a choice made here, not a canon fact).

CANVAS_A = '#d8433f'
CANVAS_B = '#f4ead6'
PAINT_FADE = '#c9b48a'


def ferris_wheel(loc, r, tod, lit=None):
    """A ferris wheel: a rim of spokes and gondolas on an A-frame."""
    x, y, z = loc
    lit = (tod == 'night') if lit is None else lit
    steel = mat('WheelSteel' + tod, C('#e6e0d4', tod))
    for side in (-1, 1):
        for lean in (-1, 1):
            box(uid('WheelLeg'), (0.35, 0.35, r * 1.25), (x + lean * r * 0.3, y + side * 0.6, z + r * 0.58), steel, bevel=0, rot=(0, lean * -18, 0))
    n = 16
    for i in range(n):
        a = i / n * 2 * math.pi
        cx, cz = x + math.cos(a) * r / 2, z + r * 1.15 + math.sin(a) * r / 2
        box(uid('Spoke'), (r, 0.12, 0.12), (cx, y, cz), steel, bevel=0, rot=(0, -math.degrees(a), 0))
        rx, rz = x + math.cos(a) * r, z + r * 1.15 + math.sin(a) * r
        box(uid('Rim'), (2 * math.pi * r / n + 0.1, 0.18, 0.18), (rx, y, rz), steel, bevel=0, rot=(0, -math.degrees(a) - 90, 0))
        col = ('#d8433f', '#3f7fbf', '#e2ab3a', '#3fae6a')[i % 4]
        box(uid('Gondola'), (0.9, 0.9, 0.8), (rx, y - 0.5, rz - 0.7), mat('Gondola' + col + tod, C(col, tod)), bevel=0.04)
        if lit:
            sphere(uid('Bulb'), 0.14, (rx, y - 0.2, rz), mat('WheelBulb', '#ffd27a', emit='#ffd27a', strength=6))
    cyl(uid('Hub'), 0.5, 0.6, (x, y - 0.2, z + r * 1.15), mat('Hub' + tod, C('#c8463c', tod)), verts=16, rot=(90, 0, 0), bevel=0)


def striped_tent(loc, r, h, tod, a=CANVAS_A, b=CANVAS_B, roof_h=None, flag=True, name='Tent'):
    """A carnival tent: striped walls, a cone roof, a pennant on top."""
    x, y, z = loc
    roof_h = roof_h or r * 0.9
    cyl(uid(name + 'Wall'), r, h, (x, y, z + h / 2), mat(name + 'WallA' + tod, C(b, tod)), verts=24, bevel=0)
    n = 12
    for i in range(n):
        ang = i / n * 2 * math.pi
        box(uid(name + 'Stripe'), (r * 0.26, 0.05, h), (x + math.cos(ang) * r, y + math.sin(ang) * r, z + h / 2), mat(name + 'StripeA' + tod, C(a, tod)),
            bevel=0, rot=(0, 0, math.degrees(ang) + 90))
    cyl(uid(name + 'Roof'), r * 1.08, roof_h, (x, y, z + h + roof_h / 2), mat(name + 'RoofA' + tod, C(a, tod)), verts=24, r2=0.05, bevel=0)
    for i in range(0, n, 2):
        ang = i / n * 2 * math.pi
        box(uid(name + 'RoofStripe'), (r * 0.3, 0.05, roof_h * 1.2), (x + math.cos(ang) * r * 0.55, y + math.sin(ang) * r * 0.55, z + h + roof_h * 0.45),
            mat(name + 'RoofB' + tod, C(b, tod)), bevel=0, rot=(math.degrees(math.atan2(r, roof_h)) * 0, 0, math.degrees(ang) + 90))
    if flag:
        post((x, y, z + h + roof_h - 0.1), 1.2, tod, r=0.04, color='#4a4a52')
        box(uid('Pennant'), (0.7, 0.03, 0.4), (x + 0.35, y, z + h + roof_h + 0.9), mat('Pennant' + tod, C('#e2ab3a', tod)), bevel=0)


def stall(loc, tod, col='#3f7fbf', sign='RING TOSS', rot_z=0, prizes=True):
    """A midway game stall: counter, striped awning, a painted sign, prizes on the back shelf."""
    g = _group(uid('Stall'), loc, rot_z)
    wood = mat('StallWood' + col + tod, C(col, tod))
    _child(g, box(uid('StallBack'), (3.0, 0.15, 2.6), (0, 0.9, 1.3), mat('StallBack' + tod, C(PAINT_FADE, tod)), bevel=0))
    for sx in (-1.45, 1.45):
        _child(g, box(uid('StallSide'), (0.12, 1.9, 2.6), (sx, 0, 1.3), wood, bevel=0))
    _child(g, box(uid('Counter'), (3.0, 0.5, 1.0), (0, -0.85, 0.5), wood, bevel=0))
    for i in range(6):
        c = CANVAS_A if i % 2 == 0 else CANVAS_B
        _child(g, box(uid('Awning'), (0.52, 1.4, 0.06), (-1.3 + i * 0.52, -0.6, 2.75), mat('Awning' + c + tod, C(c, tod)), bevel=0, rot=(-18, 0, 0)))
    _child(g, box(uid('SignBoard'), (2.4, 0.1, 0.5), (0, -1.3, 3.2), mat('SignBoard' + tod, C('#f2e2b0', tod)), bevel=0))
    _child(g, text_obj(uid('SignTxt'), sign, (0, -1.36, 3.2), 0.28, C('#8a2a1c', tod)))
    if prizes:
        for i in range(5):
            pc = ('#e88aa8', '#8ad0ff', '#f2d27a', '#a8e08a', '#c8a0e8')[i]
            _child(g, sphere(uid('Plush'), 0.22, (-1.0 + i * 0.5, 0.7, 1.7), mat('Plush' + pc + tod, C(pc, tod))))
            _child(g, sphere(uid('PlushHead'), 0.14, (-1.0 + i * 0.5, 0.7, 2.0), mat('Plush' + pc + tod, C(pc, tod))))
    if tod == 'night':
        point(uid('StallLight'), (loc[0], loc[1] - 1.0, 2.5), 300, '#ffd9a0', radius=0.2)
    return g


def camp_tent(loc, tod, col='#3f7fbf', rot_z=0):
    """A small A-frame camping tent."""
    g = _group(uid('CampTent'), loc, rot_z)
    m = mat('CampTent' + col + tod, C(col, tod))
    for s in (-1, 1):
        _child(g, box(uid('TentSide'), (2.4, 1.55, 0.06), (0, s * 0.55, 0.62), m, bevel=0, rot=(s * 52, 0, 0)))
    _child(g, box(uid('TentFlap'), (0.06, 0.9, 0.9), (-1.2, 0, 0.45), mat('TentFlap' + tod, C('#2a2a30', tod)), bevel=0))
    return g


def carnival_skyline(tod, y=60, x=-18, lit=None):
    """The carnival seen from camp: the ferris wheel and the big top over the trees."""
    ferris_wheel((x, y, 0), 9, tod, lit=lit)
    striped_tent((x + 22, y + 8, 0), 8, 5, tod, roof_h=7, name='BigTop')


def lake_base(tod, lake_y=10, shore='#79b04a', far=True):
    ground(C(shore, tod), size=(160, 40 + lake_y), loc=(0, (lake_y - 40) / 2, 0))
    water(C(LAKE, tod), size=(260, 220), loc=(0, lake_y + 108, -0.14))
    if far:
        hills(150, '#5c8f86', tod, n=8, h=24, seed=21, x0=-140, x1=140)
        treeline(120, -120, 120, 12, tod, far=True, seed=22, gap=4.5)


def cv_campsite(tod):
    ground(C(GREEN['grass'], tod))
    treeline(22, -40, 40, 8, tod, far=False, seed=31, gap=2.8)
    carnival_skyline(tod, y=50, x=-14, lit=tod == 'night')
    patch('Dirt', 5.5, (0, 5, 0), '#c79a62', tod, seed=4, sy=0.75)
    campfire((0, 5.2, 0.02), tod, r=0.6)
    for x, rz in ((-2.8, 70), (2.8, -70)):
        log_seat((x, 4.0, 0.02), 2.2, rot_z=rz, tod=tod)
    for i, (x, y, c, rz) in enumerate(((-7, 9, '#3f7fbf', 20), (-3.5, 11, '#e2ab3a', 5), (4.0, 10.5, '#3fae6a', -10), (7.5, 8.5, '#d8433f', -25))):
        camp_tent((x, y, 0), tod, col=c, rot_z=rz + 90)
    box('Clothesline', (5.0, 0.02, 0.02), (5.5, 6.0, 1.8), mat('Rope' + tod, C('#d9c48a', tod)), bevel=0, rot=(0, 0, 10))
    for x in (3.0, 8.0):
        post((x, 5.6 if x < 5 else 6.4, 0), 1.85, tod, r=0.05)
    for i in range(3):
        box(uid('Laundry'), (0.4, 0.04, 0.55), (4.2 + i * 1.1, 5.85 + i * 0.18, 1.5), mat('Laundry' + str(i) + tod, C(('#e88aa8', '#8ad0ff', '#f6f3ea')[i], tod)), bevel=0, rot=(0, 0, 10))
    for x in (-12, 12):
        pine((x, 4, 0), 8, tod, seed=x)
    sky(tod); sun(tod, azimuth=-30, elevation=45 if tod == 'day' else 28)
    tv_camera((0, -6.0, 1.7), (0, 12, 1.8), lens=26)


def cv_shelter(tod):
    """The team shelter: a lean-to built from carnival junk — an old game-stall sign for a wall, a tarp roof."""
    ground(C(GREEN['grass'], tod))
    treeline(16, -40, 40, 8, tod, far=False, seed=33, gap=2.6)
    patch('Dirt', 5, (0, 5, 0), '#c79a62', tod, seed=8, sy=0.7)
    box('JunkWall', (5.0, 0.2, 2.4), (0, 8.0, 1.2), mat('JunkWall' + tod, C(PAINT_FADE, tod)), bevel=0, rot=(0, 0, 0))
    text_obj('JunkSign', 'WIN A PRIZE', (0, 7.84, 1.8), 0.42, C('#8a2a1c', tod))
    box('Tarp', (5.4, 3.6, 0.06), (0, 6.4, 2.1), mat('Tarp' + tod, C('#3f7fbf', tod)), bevel=0, rot=(-16, 0, 0))
    for x in (-2.4, 2.4):
        post((x, 4.8, 0), 1.65, tod, r=0.08)
    for i, c in enumerate(('#e2ab3a', '#3fae6a', '#d8433f')):
        box(uid('Bedroll'), (0.7, 1.8, 0.15), (-1.6 + i * 1.6, 6.6, 0.08), mat('Bedroll' + c + tod, C(c, tod)), bevel=0)
    box('Crate', (0.8, 0.8, 0.7), (3.6, 5.0, 0.35), mat('Crate' + tod, C('#a8834f', tod)), bevel=0)
    box('Crate2', (0.7, 0.7, 0.6), (3.5, 5.1, 1.0), mat('Crate' + tod, C('#a8834f', tod)), bevel=0)
    if tod == 'night':
        campfire((2.0, 3.4, 0.02), tod, r=0.45)
    for x in (-10, 10):
        pine((x, 6, 0), 8, tod, seed=x + 3)
    sky(tod); sun(tod, azimuth=-30, elevation=45 if tod == 'day' else 28)
    tv_camera((0, -4.0, 1.7), (0, 10, 1.4), lens=26)


def cv_forest(tod):
    ground(C('#5f9a3e', tod))
    rnd = random.Random(41)
    for i in range(40):
        x = rnd.uniform(-16, 16); y = rnd.uniform(3, 30)
        if abs(x) < 1.8 and y < 14: continue
        pine((x, y, 0), 6 + rnd.random() * 4, tod, seed=i)
    for i in range(8):
        bush((rnd.uniform(-6, 6), rnd.uniform(2, 8), 0), 0.5 + rnd.random() * 0.4, tod, seed=i)
    patch('Needles', 3.0, (0, 4.0, 0), '#8a7a4a', tod, seed=5, sy=0.6)
    stump((1.4, 3.6, 0), tod=tod); log_seat((-1.2, 4.4, 0.02), 1.8, rot_z=20, tod=tod)
    # the carnival just visible through the trunks: a strand of bulbs, a striped roof
    striped_tent((6, 34, 0), 5, 3, tod, roof_h=4, flag=False, name='FarTent')
    sky(tod); sun(tod, azimuth=-25, elevation=55 if tod == 'day' else 30)
    tv_camera((0, -4.0, 1.65), (0, 14, 1.8), lens=26)


def cv_rocky_beach(tod):
    lake_base(tod, lake_y=8, shore='#a89a86')
    rnd = random.Random(52)
    for i in range(16):
        icorock(uid('Rock'), (0.4 + rnd.random() * 0.9, 0.4 + rnd.random() * 0.6, 0.3 + rnd.random() * 0.5),
                (rnd.uniform(-12, 12), rnd.uniform(1, 8.5), 0.05), C('#8e8a80', tod), seed=i, rot_z=rnd.random() * 90)
    for i in range(40):
        icorock(uid('Pebble'), (0.12, 0.1, 0.06), (rnd.uniform(-6, 6), rnd.uniform(-2, 6), 0.02), C('#b8b0a2', tod), seed=i + 100)
    carnival_skyline(tod, y=70, x=26, lit=tod == 'night')
    cyl('Driftwood', 0.2, 3.0, (-3.5, 4.0, 0.18), mat('Driftwood' + tod, C('#c9b48a', tod)), verts=10, rot=(0, 90, 20), bevel=0)
    for x in (-13, 13):
        pine((x, 3, 0), 8, tod, seed=x + 50)
    sky(tod); sun(tod, azimuth=-40, elevation=42 if tod == 'day' else 28)
    tv_camera((0, -5.5, 1.8), (0, 14, 0.8), lens=26)


def cv_lake_shore(tod):
    lake_base(tod, lake_y=7)
    patch('Mud', 4.0, (0, 5.0, 0), '#a88a5a', tod, seed=9, sx=2.0, sy=0.6)
    for i in range(14):
        rnd = random.Random(i)
        x = -6 + rnd.random() * 3 if i < 7 else 4 + rnd.random() * 3
        cyl(uid('Reed'), 0.03, 1.2 + rnd.random() * 0.6, (x, 6.2 + rnd.random() * 0.8, 0.6), mat('Reed' + tod, C('#6a8a3a', tod)), verts=6, bevel=0, rot=(rnd.uniform(-8, 8), rnd.uniform(-8, 8), 0))
    plank_deck('SmallDock', (1.6, 6, 0.25), (2.5, 9.5, 0.3), tod)
    for yy in (7.5, 10.0, 12.5):
        for xx in (1.8, 3.2):
            post((xx, yy, -1.0), 1.4, tod, r=0.1, color='#6b4a2e')
    box('RowBoat', (1.0, 2.6, 0.4), (4.8, 11.5, 0.05), mat('RowBoat' + tod, C('#3f7a8a', tod)), bevel=0.05, rot=(0, 0, 15))
    carnival_skyline(tod, y=80, x=-30, lit=tod == 'night')
    for x in (-11, 11):
        pine((x, 3, 0), 8, tod, seed=x + 60)
    sky(tod); sun(tod, azimuth=-35, elevation=40 if tod == 'day' else 28)
    tv_camera((0, -5.0, 1.75), (0, 14, 0.9), lens=26)


def cv_entrance(tod):
    """The carnival gate: an arched sign over the path, ticket booth, bulbs half of them dead."""
    ground(C('#79a04a', tod))
    box('Path', (5, 40, 0.02), (0, 18, 0.01), mat('Path' + tod, C('#c9a878', tod)), bevel=0)
    for x in (-3.2, 3.2):
        box(uid('Pillar'), (0.8, 0.8, 5.5), (x, 8, 2.75), mat('Pillar' + tod, C('#c8463c', tod)), bevel=0)
        sphere(uid('PillarTop'), 0.6, (x, 8, 5.8), mat('PillarTop' + tod, C('#e2ab3a', tod)))
    box('ArchSign', (7.6, 0.3, 1.3), (0, 8, 5.4), mat('ArchSign' + tod, C('#f2e2b0', tod)), bevel=0)
    text_obj('ArchTxt', 'STAWAKI', (0, 7.8, 5.4), 0.8, C('#8a2a1c', tod))
    for i in range(14):
        on = (i * 7) % 5 != 0
        col = '#ffd27a' if on else '#7a6a50'
        sphere(uid('Bulb'), 0.09, (-3.4 + i * 0.52, 7.82, 6.1), mat('ArchBulb' + str(on) + tod, col, emit=col if (on and tod == 'night') else None, strength=6 if tod == 'night' else 0))
    g = _group('TicketBooth', (-5.5, 6.5, 0), 15)
    _child(g, box(uid('BoothBody'), (1.6, 1.6, 2.2), (0, 0, 1.1), mat('Booth' + tod, C('#3f7fbf', tod)), bevel=0))
    _child(g, box(uid('BoothWin'), (1.0, 0.06, 0.7), (0, -0.82, 1.4), mat('BoothWin' + tod, C('#2a3a4a', tod)), bevel=0))
    _child(g, cyl(uid('BoothRoof'), 1.2, 0.8, (0, 0, 2.6), mat('BoothRoof' + tod, C(CANVAS_A, tod)), verts=12, r2=0.05, bevel=0))
    _child(g, text_obj(uid('TicketTxt'), 'TICKETS', (0, -0.86, 2.0), 0.2, C('#f6f0de', tod)))
    for x in (-8, 8):
        stall((x * 0.9, 18, 0), tod, col=('#3fae6a' if x < 0 else '#b48ac8'), sign=('DUCKS' if x < 0 else 'DARTS'), rot_z=60 if x < 0 else -60, prizes=False)
    ferris_wheel((6, 34, 0), 8, tod)
    striped_tent((-10, 36, 0), 7, 4, tod, roof_h=6, name='BigTop')
    if tod == 'night':
        point('GateLight', (0, 6.0, 4.5), 1200, '#ffd9a0', radius=0.5)
    for x in (-14, 14):
        pine((x, 6, 0), 8, tod, seed=x + 70)
    sky(tod); sun(tod, azimuth=-30, elevation=45 if tod == 'day' else 28)
    tv_camera((0, -4.0, 1.75), (0, 16, 3.0), lens=24)


def cv_midway(tod):
    ground(C('#c9a878', tod))
    for i, (x, y, col, sign) in enumerate(((-5.5, 4, '#3f7fbf', 'RING TOSS'), (-5.5, 9, '#3fae6a', 'DUCK POND'), (-5.5, 14, '#e2ab3a', 'HIGH STRIKER'),
                                          (5.5, 4.5, '#b48ac8', 'DARTS'), (5.5, 9.5, '#d8433f', 'SHOOTING'), (5.5, 14.5, '#3f7fbf', 'GUESS YOUR AGE'))):
        stall((x, y, 0), tod, col=col, sign=sign, rot_z=90 if x < 0 else -90)
    for y in (3, 8, 13, 18):
        string_lights((-4.0, y, 3.6), (4.0, y + 1.0, 3.6), n=18, sag=0.6, tod=tod if tod == 'night' else 'day')
    for x in (-4.0, 4.0):
        for y in (3, 8, 13, 18):
            post((x, y + (1.0 if x > 0 else 0), 0), 3.6, tod, r=0.06, color='#4a4a52')
    ferris_wheel((0, 30, 0), 9, tod)
    cyl('Popcorn', 0.5, 1.4, (1.6, 2.0, 0.7), mat('Popcorn' + tod, C(CANVAS_A, tod)), verts=16, bevel=0)
    cyl('PopcornTop', 0.6, 0.5, (1.6, 2.0, 1.65), mat('PopcornTopM' + tod, C('#f2d27a', tod)), verts=16, r2=0.1, bevel=0)
    for i in range(6):
        icorock(uid('Litter'), (0.12, 0.1, 0.04), (-2 + i * 0.8, 3 + (i % 3) * 2, 0.02), C('#f6f3ea', tod), seed=i + 7)
    sky(tod); sun(tod, azimuth=-30, elevation=50 if tod == 'day' else 28)
    tv_camera((0, -4.0, 1.75), (0, 18, 2.6), lens=24)


def trial_set(tod, sundown=False):
    """The Elimination Trial: a raised platform by the lake, the host's lectern, the urn, log benches facing it."""
    lit = 'night' if (tod == 'night' or sundown) else 'day'
    lake_base(tod, lake_y=14)
    plank_deck('TrialStage', (6.5, 3.6, 0.7), (0, 9.5, 0.35), tod)
    for x in (-2.6, 2.6):
        post((x, 11.0, 0), 3.6, tod, r=0.12, color='#6b4a2e')
    box('Banner', (5.6, 0.08, 0.9), (0, 11.0, 3.3), mat('TrialBanner' + tod, C('#8a1e2e', tod)), bevel=0)
    text_obj('BannerTxt', 'TRIAL', (0, 10.92, 3.3), 0.55, C('#e8b938', tod))
    box('Lectern', (0.8, 0.6, 1.2), (1.2, 9.4, 1.3), mat('Lectern' + tod, C('#5a3a20', tod)), bevel=0)
    cyl('Urn', 0.3, 0.6, (-1.0, 9.4, 1.0), mat('Urn' + tod, C('#b87a4a', tod)), verts=18, r2=0.2, bevel=0)
    sphere('UrnBelly', 0.36, (-1.0, 9.4, 1.0), mat('Urn' + tod, C('#b87a4a', tod)), scale=(1, 1, 0.8))
    for r in range(3):
        for x in (-2.6, 2.6):
            log_seat((x, 2.5 + r * 1.5, 0.02), 3.0, rot_z=0, tod=tod)
    for x in (-4.2, 4.2):
        tiki_torch((x, 9.0, 0), lit, 2.4)
    for x in (-10, 10):
        pine((x, 6, 0), 8, tod, seed=x + 80)
    carnival_skyline(tod, y=75, x=-34, lit=lit == 'night')


def cv_trial_area(tod):
    trial_set(tod)
    sky(tod); sun(tod, azimuth=-30, elevation=40 if tod == 'day' else 28)
    tv_camera((0, -4.5, 2.0), (0, 14, 1.4), lens=26)


def cv_ceremony(tod):
    trial_set('dusk', sundown=True)
    sky('dusk'); sun('dusk', azimuth=10, elevation=6)
    tv_camera((0, -4.5, 2.0), (0, 14, 1.4), lens=26)


def cv_voting_booth(tod):
    """The voting booth: a little curtained booth on its own at the edge of the grounds, the urn on a stand inside."""
    ground(C(GREEN['grass'], tod))
    treeline(20, -40, 40, 8, tod, far=False, seed=91, gap=2.8)
    carnival_skyline(tod, y=60, x=12, lit=tod == 'night')
    box('BoothFloor', (2.4, 2.4, 0.2), (0, 7.0, 0.1), mat('BoothFloor' + tod, C('#9a6a3a', tod)), bevel=0)
    wood = mat('BoothWood' + tod, C('#7a5232', tod))
    for x in (-1.15, 1.15):
        box(uid('BoothSide'), (0.1, 2.4, 2.6), (x, 7.0, 1.5), wood, bevel=0)
    box('BoothBack', (2.4, 0.1, 2.6), (0, 8.15, 1.5), wood, bevel=0)
    box('BoothRoof', (2.8, 2.8, 0.15), (0, 7.0, 2.9), mat('BoothRoof' + tod, C(CANVAS_A, tod)), bevel=0)
    box('BoothSign', (1.6, 0.08, 0.4), (0, 5.75, 3.2), mat('BoothSign' + tod, C('#f2e2b0', tod)), bevel=0)
    text_obj('VoteTxt', 'VOTE', (0, 5.69, 3.2), 0.28, C('#8a2a1c', tod))
    # curtain pulled to one side so the urn shows
    for i in range(4):
        box(uid('Curtain'), (0.18, 0.06, 2.3), (-1.0 + i * 0.16, 5.85, 1.4), mat('BoothCurtain' + tod, C('#8a1e2e', tod)), bevel=0)
    box('UrnStand', (0.6, 0.6, 1.0), (0.3, 7.4, 0.7), mat('UrnStand' + tod, C('#5a3a20', tod)), bevel=0)
    sphere('Urn', 0.3, (0.3, 7.4, 1.48), mat('Urn' + tod, C('#b87a4a', tod)), scale=(1, 1, 0.85))
    cyl('UrnNeck', 0.16, 0.25, (0.3, 7.4, 1.8), mat('Urn' + tod, C('#b87a4a', tod)), verts=16, r2=0.2, bevel=0)
    box('Pencil', (0.3, 0.03, 0.03), (0.2, 7.2, 1.21), mat('Pencil' + tod, C('#e2ab3a', tod)), bevel=0, rot=(0, 0, 30))
    if tod == 'night':
        lamp_post((1.8, 5.6, 0), 2.8, tod)
    for x in (-8, 8):
        pine((x, 8, 0), 8, tod, seed=x + 90)
    sky(tod); sun(tod, azimuth=-30, elevation=45 if tod == 'day' else 28)
    tv_camera((1.2, -1.5, 1.75), (0, 8, 1.4), lens=28)


def cv_haunted(tod):
    """The Stawaki Haunted Mansion from the path: two storeys, boarded windows, a sagging porch."""
    ground(C('#6a7a4a', tod))
    box('Path', (2.4, 14, 0.02), (0, 4, 0.01), mat('Path' + tod, C('#9a8a6a', tod)), bevel=0)
    wall = mat_planks('MansionWall' + tod, C('#6a6070', tod), C('#5e5466', tod), seam=C('#3a3442', tod), scale=0.5)
    box('Mansion', (10, 7, 7.5), (0, 16, 3.75), wall, bevel=0)
    box('Tower', (3, 3, 11), (3.8, 13.5, 5.5), wall, bevel=0)
    cyl('TowerRoof', 2.3, 3.0, (3.8, 13.5, 12.5), mat('MansionRoof' + tod, C('#3a3442', tod)), verts=4, r2=0.05, rot=(0, 0, 45), bevel=0)
    for s in (-1, 1):
        box(uid('MRoof'), (10.6, 4.4, 0.25), (0, 16 + s * 1.9, 8.6), mat('MansionRoof' + tod, C('#3a3442', tod)), bevel=0, rot=(s * -32, 0, 0))
    glow = '#ffcf6a' if tod == 'night' else None
    for x, z in ((-3.2, 2.0), (-3.2, 5.2), (0.0, 5.2), (3.8, 8.5)):
        box(uid('MWin'), (1.2, 0.08, 1.4), (x, 12.45 if x != 3.8 else 11.95, z), mat('MWin' + tod, '#ffcf6a' if glow else C('#2a2a30', tod), emit=glow, strength=2 if glow else 0), bevel=0)
        for k in (-1, 1):
            box(uid('Board'), (1.5, 0.06, 0.18), (x, (12.4 if x != 3.8 else 11.9), z + k * 0.3), mat('Board' + tod, C('#9a7a52', tod)), bevel=0, rot=(0, k * 12, 0))
    box('Door', (1.4, 0.08, 2.4), (0, 12.45, 1.2), mat('MDoor' + tod, C('#2a1e18', tod)), bevel=0)
    plank_deck('Porch', (6, 1.8, 0.25), (0, 11.6, 0.3), tod, color='#7a6a5a', seam='#4a3a2a')
    box('PorchRoof', (6.2, 2.0, 0.15), (0, 11.5, 3.0), mat('MansionRoof' + tod, C('#3a3442', tod)), bevel=0, rot=(-10, 0, 0))
    for x in (-2.8, 2.8):
        post((x, 10.8, 0.3), 2.6, tod, r=0.08, color='#7a6a5a')
    box('Fence', (14, 0.08, 0.08), (0, 7.5, 1.0), mat('Fence' + tod, C('#2a2a30', tod)), bevel=0)
    for x in range(-7, 8):
        if abs(x) < 2: continue
        box(uid('Picket'), (0.06, 0.06, 1.3), (x, 7.5, 0.65), mat('Fence' + tod, C('#2a2a30', tod)), bevel=0)
    for i, x in enumerate((-9, 9, -12)):
        g = _group(uid('DeadTree'), (x, 10 + i, 0), i * 40)
        _child(g, cyl(uid('DeadTrunk'), 0.25, 5, (0, 0, 2.5), mat('DeadTree' + tod, C('#4a3a30', tod)), verts=8, r2=0.1, bevel=0))
        for k in range(3):
            _child(g, cyl(uid('DeadBranch'), 0.08, 2.0, (0.6 * (k - 1), 0, 3.5 + k * 0.4), mat('DeadTree' + tod, C('#4a3a30', tod)), verts=6, rot=(0, 50 * (k - 1) + 10, 0), bevel=0))
    if tod == 'night':
        point('MansionGlow', (0, 10.5, 2.2), 300, '#ffcf6a', radius=0.3)
    sky(tod); sun(tod, azimuth=-60, elevation=30 if tod == 'day' else 20)
    tv_camera((0, -3.5, 1.7), (0, 14, 4.0), lens=24)


def cv_corn_maze(tod):
    """The corn maze: a narrow lane between walls of corn taller than anyone, a turn ahead."""
    ground(C('#9a7a4a', tod))
    corn = mat('Corn' + tod, C('#7a9a3a', tod))
    tassel = mat('Tassel' + tod, C('#d9b84a', tod))
    def wall(x0, x1, y0, y1):
        cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
        box(uid('CornWall'), (abs(x1 - x0) or 0.8, abs(y1 - y0) or 0.8, 2.8), (cx, cy, 1.4), corn, bevel=0)
        n = int(max(abs(x1 - x0), abs(y1 - y0)) / 0.45)
        rnd = random.Random(int(x0 * 7 + y0 * 3))
        for i in range(n):
            t = i / max(n - 1, 1)
            px, py = x0 + (x1 - x0) * t, y0 + (y1 - y0) * t
            cyl(uid('Tassel'), 0.06, 0.4 + rnd.random() * 0.3, (px + rnd.uniform(-0.2, 0.2), py + rnd.uniform(-0.2, 0.2), 3.0), tassel, verts=5, r2=0.0, bevel=0)
            sx, sy = ((0, -0.42), (0, 0.42)) if y1 == y0 else ((-0.42, 0), (0.42, 0))
            for ox, oy in (sx, sy):
                cyl(uid('Stalk'), 0.04, 2.9, (px + ox, py + oy, 1.45), mat('Stalk' + tod, C('#9ab04a', tod)), verts=5, bevel=0)
            box(uid('CornLeaf'), (0.05, 0.6, 0.12), (px, py - (0.42 if y1 == y0 else 0), 1.0 + rnd.random() * 1.4), corn, bevel=0, rot=(rnd.uniform(-30, 30), 0, rnd.uniform(-40, 40)))
    wall(-1.6, -1.6, 0, 12)     # left wall, as a strip along y
    wall(1.6, 1.6, 0, 8)        # right wall stops: a turn to the right
    wall(-1.6, 6, 12.8, 12.8)   # the end wall across the lane
    wall(1.6, 8, 8.0, 8.0)
    wall(-12, -1.6, 20, 20)
    box('Sign', (0.7, 0.05, 0.5), (0.9, 12.3, 1.6), mat('MazeSign' + tod, C('#f2e2b0', tod)), bevel=0)
    text_obj('MazeTxt', '?', (0.9, 12.25, 1.6), 0.35, C('#8a2a1c', tod))
    post((0.9, 12.35, 0), 1.35, tod, r=0.04)
    sky(tod); sun(tod, azimuth=-40, elevation=55 if tod == 'day' else 28)
    tv_camera((0, -1.5, 1.7), (0.6, 12, 1.5), lens=26)


def cv_theater(tod):
    """The Theater Tent: inside a striped tent, a small stage with a curtain, rows of folding chairs."""
    W, D, H = 12.0, 12.0, 6.0
    interior(W, D, H, CANVAS_B, '#8a7a5a', CANVAS_A, floor_kind='planks', wall_kind='flat')
    for i in range(int(W / 1.2)):
        box(uid('WallStripe'), (0.6, 0.05, H), (-W / 2 + 0.6 + i * 1.2, D - 0.12, H / 2), mat('TentStripe', CANVAS_A), bevel=0)
    for side in (-1, 1):
        for i in range(int(D / 1.2)):
            box(uid('SideStripe'), (0.05, 0.6, H), (side * (W / 2 - 0.12), 0.6 + i * 1.2, H / 2), mat('TentStripe', CANVAS_A), bevel=0)
    plank_deck('Stage', (8, 3.2, 1.0), (0, D - 2.0, 0.5), 'day', color='#6b4a3a', seam='#3a2a1c')
    box('Curtain', (7.6, 0.15, 4.2), (0, D - 0.5, 3.1), mat('Curtain', '#8a1e2e'), bevel=0)
    for i in range(12):
        box(uid('Fold'), (0.12, 0.2, 4.2), (-3.6 + i * 0.65, D - 0.6, 3.1), mat('CurtainFold', '#6a1422'), bevel=0)
    box('Valance', (8.0, 0.25, 0.7), (0, D - 0.7, 5.2), mat('Valance', '#e8b938', metal=0.3), bevel=0)
    for r in range(4):
        for i in range(8):
            x = -3.5 + i * 1.0
            if abs(x) < 0.6: continue
            y = 3.0 + r * 1.3
            box(uid('ChairSeat'), (0.45, 0.42, 0.05), (x, y, 0.46), mat('FChair', '#5a6a7a'), bevel=0)
            box(uid('ChairBack'), (0.45, 0.05, 0.42), (x, y + 0.2, 0.7), mat('FChair', '#5a6a7a'), bevel=0)
    for x in (-2.5, 2.5):
        sp = bpy.data.lights.new(uid('Spot'), 'SPOT'); sp.energy = 1800; sp.spot_size = math.radians(30); sp.color = hexc('#fff0d0')[:3]
        so = _link(bpy.data.objects.new(uid('Spot'), sp)); so.location = (x, 2.0, H - 0.5)
        so.rotation_euler = (Vector((0, D - 2.0, 1.2)) - so.location).to_track_quat('-Z', 'Y').to_euler()
    for i in range(7):
        sphere(uid('Bulb'), 0.08, (-3.0 + i * 1.0, D - 3.55, 1.04), mat('FootLight', '#fff1c8', emit='#fff1c8', strength=5))
    indoor_light(W, D, H, color='#ffe2c0', power=900, x=0.3, amb=0.5, fill='#f0d8c8')
    tv_camera((0.3, 0.3, 1.8), (0, D, 2.0), lens=22)


def cv_big_top(tod):
    """The Big Top: the ring in the middle, bleachers around, a trapeze high under the striped canvas."""
    W, D, H = 22.0, 20.0, 12.0
    interior(W, D, H, CANVAS_B, '#c9a878', CANVAS_A, floor_kind='flat', wall_kind='flat')
    for i in range(int(W / 2)):
        box(uid('WallStripe'), (1.0, 0.05, H), (-W / 2 + 1.0 + i * 2.0, D - 0.12, H / 2), mat('TentStripe', CANVAS_A), bevel=0)
    for side in (-1, 1):
        for i in range(int(D / 2)):
            box(uid('SideStripe'), (0.05, 1.0, H), (side * (W / 2 - 0.12), 1.0 + i * 2.0, H / 2), mat('TentStripe', CANVAS_A), bevel=0)
    cyl('Ring', 5.0, 0.5, (0, 10, 0.25), mat('RingWall', '#c8463c'), verts=48, bevel=0)
    cyl('RingFloor', 4.7, 0.52, (0, 10, 0.26), mat('Sawdust', '#e2c98f'), verts=48, bevel=0)
    for r in range(4):
        box(uid('Bleacher'), (16, 1.0, 0.5 + r * 0.6), (0, D - 2.5 + r * 0.6 - 1.2, (0.5 + r * 0.6) / 2), mat('Bleacher', '#6a7a8a'), bevel=0)
    for x in (-4.5, 4.5):
        cyl(uid('Mast'), 0.2, H, (x, 10, H / 2), mat('Mast', '#e8e2d4'), verts=12, bevel=0)
    box('TrapezeBar', (1.4, 0.06, 0.06), (0, 10, 7.0), mat('TrapezeBar', '#e8b938', metal=0.4), bevel=0)
    for x in (-0.68, 0.68):
        cyl(uid('TrapezeRope'), 0.02, 4.0, (x, 10, 9.0), mat('Rope', '#d9c48a'), verts=6, bevel=0)
    box('Platform', (1.2, 1.2, 0.1), (-4.5, 10, 8.0), mat('Platform', '#3f7fbf'), bevel=0)
    for i in range(3):
        cyl(uid('Pedestal'), 0.6, 0.8, (-2.0 + i * 2.0, 10.5, 0.9), mat('Pedestal' + str(i), ('#3f7fbf', '#e2ab3a', '#3fae6a')[i]), verts=20, bevel=0)
    for x in (-6, 0, 6):
        sp = bpy.data.lights.new(uid('Spot'), 'SPOT'); sp.energy = 4000; sp.spot_size = math.radians(28); sp.color = hexc('#fff0d0')[:3]
        so = _link(bpy.data.objects.new(uid('Spot'), sp)); so.location = (x, 3.0, H - 1.0)
        so.rotation_euler = (Vector((0, 10, 0.5)) - so.location).to_track_quat('-Z', 'Y').to_euler()
    string_lights((-10, 2, 9.5), (10, 2, 9.5), n=30, sag=1.2, tod='night')
    indoor_light(W, D, H, color='#ffe2c0', power=2500, x=0.3, amb=0.5, fill='#f0d8c8')
    tv_camera((0.0, -0.5, 2.4), (0, 12, 3.2), lens=20)


def cv_confessional(tod):
    """The photo booth: a stool, a patterned curtain behind it, the price card on the wall; the lens is our camera."""
    W, D, H = 2.2, 2.0, 2.3
    interior(W, D, H, '#c8463c', '#3a3a40', '#2a2a30', floor_kind='flat', wall_kind='flat')
    box('BackCurtain', (1.6, 0.06, 2.0), (0, D - 0.12, 1.1), mat('BoothCurtain', '#4a2a6a'), bevel=0)
    for i in range(7):
        box(uid('CurtainFold'), (0.06, 0.08, 2.0), (-0.7 + i * 0.23, D - 0.16, 1.1), mat('BoothCurtainFold', '#3a1e58'), bevel=0)
    for i in range(10):
        sphere(uid('Star'), 0.04, (-0.65 + (i * 0.37) % 1.3, D - 0.2, 0.5 + (i * 0.53) % 1.4), mat('CurtainStar', '#e8b938', emit='#e8b938', strength=1.0))
    cyl('Stool', 0.24, 0.06, (0, D - 0.7, 0.62), mat('StoolTop', '#c8463c'), verts=20, bevel=0)
    cyl('StoolPole', 0.04, 0.6, (0, D - 0.7, 0.3), mat('StoolPole', '#c9ccd2', metal=0.5), verts=10, bevel=0)
    cyl('StoolBase', 0.2, 0.04, (0, D - 0.7, 0.02), mat('StoolPole', '#c9ccd2', metal=0.5), verts=16, bevel=0)
    box('PriceCard', (0.04, 0.4, 0.3), (-W / 2 + 0.13, 1.5, 1.45), mat('PriceCard', '#f2e2b0'), bevel=0)
    text_obj('PriceTxt', '4 FOR 25c', (-W / 2 + 0.16, 1.5, 1.45), 0.06, '#8a2a1c', rot=(90, 0, -90))
    box('Flash', (0.6, 0.15, 0.06), (0, 0.15, H - 0.15), mat('FlashBox', '#f6f6ff', emit='#f6f6ff', strength=2.5), bevel=0)
    for i in range(3):
        box(uid('Strip'), (0.04, 0.12, 0.45), (W / 2 - 0.13, 1.25 + i * 0.18, 1.35), mat('PhotoStrip', '#f6f3ea'), bevel=0, rot=(0, 0, 0))
    indoor_light(W, D, H, color='#fff6e8', power=380, x=0.0, amb=0.6)
    tv_camera((0.0, -0.1, 1.35), (0, D, 1.15), lens=19)


def cv_exit(tod):
    """The Boat of Losers from the Stawaki dock at night, the carnival lit up across the water."""
    hc_dock('night', shame=True)
    ferris_wheel((-60, 150, 0), 14, 'night')


SCENES['carnival'] = {
    'campsite': cv_campsite, 'shelter': cv_shelter, 'forest-edge': cv_forest, 'rocky-beach': cv_rocky_beach,
    'lake-shore': cv_lake_shore, 'carnival-entrance': cv_entrance, 'midway': cv_midway, 'trial-area': cv_trial_area,
    'haunted-mansion': cv_haunted, 'corn-maze': cv_corn_maze, 'theater-tent': cv_theater, 'big-top': cv_big_top,
    'voting-booth': cv_voting_booth, 'confessional': cv_confessional, 'ceremony': cv_ceremony, 'exit': cv_exit,
}
OUTDOOR['carnival'] = {'campsite', 'shelter', 'forest-edge', 'rocky-beach', 'lake-shore', 'carnival-entrance', 'midway',
                       'trial-area', 'haunted-mansion', 'corn-maze', 'voting-booth'}

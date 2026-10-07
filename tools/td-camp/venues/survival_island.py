# ══════════════════════════════════════════════════════════════════════
# venues/survival_island.py — the survival island: a tropical beach camp, jungle behind
# ══════════════════════════════════════════════════════════════════════
# js/camp-access.js 'survival-island': shelter, campfire, beach, shoreline, water-source,
# jungle-trail, fishing-area. The ceremony is the campfire with marshmallows and the exit
# the Cannon of Shame, as on Pahkitew Island (Total Drama Wiki, "Cannon of Shame"); the
# confessional is the outhouse, which Pahkitew inherited from Wawanakwa.

SEA = '#3fb2c4'
SEA_FAR = '#2f8fb0'
SAND = '#ecd49a'
JUNGLE = '#3f8a4a'


def big_leaf_plant(loc, tod, h=1.2, n=5, seed=0, col='#4fa04a'):
    rnd = random.Random(seed)
    for i in range(n):
        a = i / n * 2 * math.pi + rnd.random() * 0.5
        lf = sphere(uid('Leaf'), 1.0, (loc[0] + math.cos(a) * 0.4 * h, loc[1] + math.sin(a) * 0.4 * h, loc[2] + h * (0.45 + rnd.random() * 0.35)),
                    mat('BigLeaf' + tod, C(col, tod)), scale=(0.6 * h, 0.24 * h, 0.05 * h))
        lf.rotation_euler = (0, math.radians(-(35 + rnd.random() * 20)), a)


def surf(y, tod, x0=-80, x1=80):
    """A line of white surf where the sea meets the sand."""
    box(uid('Surf'), (x1 - x0, 0.6, 0.04), ((x0 + x1) / 2, y, -0.02), mat('Surf' + tod, C('#f4fbfb', tod)), bevel=0)


def island_far(y, tod, x=-30, w=16, h=5):
    sphere(uid('Hill'), 1.0, (x, y, -1), mat('IslandFar' + tod, C('#4f8f6a', tod)), scale=(w, 5, h))


def beach_base(tod, sea_y=14, far=True):
    # the sand stops at the waterline: a sand box running past it covered the sea and drew a seam
    ground(C(SAND, tod), size=(160, 40 + sea_y), loc=(0, (sea_y - 40) / 2, 0))
    water(C(SEA, tod), size=(260, 220), loc=(0, sea_y + 108, -0.14))
    surf(sea_y - 0.5, tod)
    if far:
        island_far(130, tod, x=-40, w=22, h=8); island_far(150, tod, x=55, w=16, h=6)


def jungle_wall(y, tod, x0=-30, x1=30, seed=4):
    rnd = random.Random(seed)
    x = x0
    while x < x1:
        if rnd.random() < 0.55:
            palm((x, y + rnd.random() * 3, 0), 6 + rnd.random() * 3, tod, lean=rnd.uniform(-14, 14), seed=int(x * 3))
        else:
            sphere(uid('Bush'), 1.0, (x, y + rnd.random() * 2, 1.6), mat('JungleBush' + tod, C(JUNGLE, tod)), scale=(2.4, 2.0, 2.2))
        x += 2.2 + rnd.random() * 2.0


def shelter_hut(loc, tod, rot_z=0):
    """A survival shelter: bamboo frame, a sloped roof of palm fronds, a raised floor."""
    g = _group(uid('Shelter'), loc, rot_z)
    bam = mat('Bamboo' + tod, C('#c9b06a', tod))
    for x in (-2.0, 2.0):
        for y in (-1.4, 1.4):
            _child(g, cyl(uid('Pole'), 0.09, 2.6 if y > 0 else 1.8, (x, y, (2.6 if y > 0 else 1.8) / 2), bam, verts=10, bevel=0))
    _child(g, plank_deck(uid('ShelterFloor'), (4.4, 3.2, 0.18), (0, 0, 0.55), tod, color='#b8964f', seam='#7a6230'))
    roof = mat('Thatch' + tod, C('#9a8a3a', tod))
    _child(g, box(uid('Thatch'), (4.9, 3.6, 0.22), (0, 0, 2.3), roof, bevel=0, rot=(-14, 0, 0)))
    for i in range(8):
        _child(g, box(uid('Frond'), (0.5, 3.7, 0.05), (-2.2 + i * 0.62, 0, 2.48), mat('FrondRoof' + tod, C('#5f9a3e', tod)), bevel=0, rot=(-14, 0, 6 * (i % 2 - 0.5))))
    return g


def tiki_torch(loc, tod, h=2.0):
    cyl(uid('Tiki'), 0.06, h, (loc[0], loc[1], loc[2] + h / 2), mat('TikiPole' + tod, C('#8a6a3a', tod)), verts=8, bevel=0)
    cyl(uid('TikiCup'), 0.14, 0.25, (loc[0], loc[1], loc[2] + h + 0.1), mat('TikiCup' + tod, C('#6b4a2a', tod)), verts=10, r2=0.1, bevel=0)
    if tod == 'night':
        ob = cyl(uid('Flame'), 0.15, 0.5, (loc[0], loc[1], loc[2] + h + 0.45), mat('FlameO', '#ff6a1f', emit='#ff6a1f', strength=3.0), verts=8, r2=0.0, bevel=0)
        ob.visible_shadow = False
        point(uid('TikiLight'), (loc[0], loc[1] - 0.3, loc[2] + h + 0.5), 320, '#ffae5a', radius=0.2)


def si_shelter(tod):
    ground(C(SAND, tod), size=(160, 80), loc=(0, 0, 0))
    patch('Clearing', 7, (0, 5, 0), '#d8be84', tod, seed=2, sy=0.7)
    jungle_wall(11, tod, -26, 26, seed=4)
    shelter_hut((0.5, 6.5, 0), tod)
    campfire((-3.6, 2.0, 0.02), tod, r=0.5)
    log_seat((-3.6, 0.4, 0.02), 1.8, rot_z=0, tod=tod)
    big_leaf_plant((4.5, 4.0, 0), tod, 1.3, seed=1)
    big_leaf_plant((-6.5, 6.0, 0), tod, 1.5, seed=2)
    box('Rope', (3.6, 0.02, 0.02), (4.5, 7.5, 1.9), mat('Rope' + tod, C('#d9c48a', tod)), bevel=0)
    sky(tod); sun(tod, azimuth=-30, elevation=50 if tod == 'day' else 32)
    tv_camera((0, -7.5, 1.7), (0, 8, 1.3), lens=27)


def si_campfire(tod):
    beach_base(tod, sea_y=16)
    patch('FirePit', 4.2, (0, 4.2, 0), '#d2b47c', tod, seed=6, sy=0.8)
    campfire((0, 4.4, 0.02), tod, r=0.75)
    for i, a in enumerate((25, 60, 120, 155)):
        r = math.radians(a)
        log_seat((math.cos(r) * 3.2, 4.4 + math.sin(r) * 2.4, 0.02), 2.0, rot_z=a + 90, tod=tod)
    for x, y in ((-6.0, 6.0), (-9.0, 8.5), (6.0, 6.5), (9.5, 9.0)):
        palm((x, y, 0), 7, tod, lean=10 if x < 0 else -10, seed=int(x * 3))
    sky(tod); sun(tod, azimuth=-25, elevation=40 if tod == 'day' else 28)
    tv_camera((0, -5.2, 1.65), (0, 8, 0.9), lens=26)


def si_ceremony(tod):
    si_campfire('night')
    host_stand((2.4, 7.4, 0))
    point(uid('StandLight'), (2.4, 6.6, 2.2), 260, '#ffd9a0', radius=0.2)
    for x in (-2.4, 4.2):
        tiki_torch((x, 7.6, 0), 'night', 2.2)


def si_beach(tod):
    beach_base(tod, sea_y=10)
    for i, (x, y) in enumerate(((-6.5, 3), (-10, 6), (6.5, 2.5), (10, 5.5))):
        palm((x, y, 0), 7 + i % 2, tod, lean=12 if x < 0 else -12, seed=i)
    icorock('Rock', (0.9, 0.7, 0.5), (5.0, 6.0, 0.2), C('#a8a092', tod), seed=3)
    cyl('Driftwood', 0.18, 3.0, (-3.5, 3.0, 0.15), mat('Driftwood' + tod, C('#c9b48a', tod)), verts=10, rot=(0, 90, 25), bevel=0)
    box('Towel', (1.0, 2.0, 0.03), (2.5, 2.0, 0.02), mat('Towel' + tod, C('#d65a6c', tod)), bevel=0, rot=(0, 0, 10))
    sky(tod); sun(tod, azimuth=-35, elevation=55 if tod == 'day' else 30)
    tv_camera((0, -7.5, 1.7), (0, 12, 1.0), lens=27)


def si_shoreline(tod):
    beach_base(tod, sea_y=7)
    rnd = random.Random(5)
    for i in range(14):
        x = -14 + i * 2.1 + rnd.random()
        icorock(uid('Rock'), (0.6 + rnd.random() * 0.9, 0.6, 0.4 + rnd.random() * 0.5), (x, 7.5 + rnd.random() * 2.5, 0.0),
                C('#8e8a80', tod), seed=i, rot_z=rnd.random() * 90)
    for x in (-6.0, 6.5):
        palm((x, 2, 0), 7, tod, lean=-16 if x < 0 else 16, seed=int(x * 3))
    cyl('Driftwood', 0.2, 3.4, (3.0, 4.0, 0.18), mat('Driftwood' + tod, C('#c9b48a', tod)), verts=10, rot=(0, 90, -30), bevel=0)
    sky(tod); sun(tod, azimuth=-40, elevation=42 if tod == 'day' else 28)
    tv_camera((1.0, -6.5, 1.8), (0, 12, 0.8), lens=27)


def si_water(tod):
    """The water source: a pool at the foot of a small waterfall in the jungle."""
    ground(C('#5f9a3e', tod))
    jungle_wall(14, tod, -24, 24, seed=7)
    for i, (x, y, sx, sz) in enumerate(((-3.6, 10, 3.0, 3.8), (3.6, 10.5, 2.8, 4.2), (0, 12, 3.6, 5.8))):
        icorock(uid('HillCliff'), (sx, 2.6, sz), (x, y, -0.6), C('#8a867c', tod), seed=i + 3)
    box('Waterfall', (1.5, 0.3, 5.0), (0, 9.4, 2.5), mat('Waterfall', C('#bfe9f2', tod), emit=C('#bfe9f2', tod), strength=0.9), bevel=0)
    patch('Pool', 3.2, (0, 6.5, 0.02), '#5fc0d2', tod, seed=9, sx=1.3, sy=0.7)
    patch('Foam', 1.0, (0, 7.6, 0.03), '#f2fbfc', tod, seed=4, sx=1.2, sy=0.5)
    big_leaf_plant((-5, 5, 0), tod, 1.4, seed=5); big_leaf_plant((5.5, 5.5, 0), tod, 1.2, seed=6)
    cyl('Bucket', 0.25, 0.4, (2.6, 3.8, 0.2), mat('Bucket' + tod, C('#9aa3ad', tod)), verts=16, r2=0.3, bevel=0)
    sky(tod); sun(tod, azimuth=-20, elevation=60 if tod == 'day' else 35)
    tv_camera((0, -5.5, 1.65), (0, 9, 1.6), lens=26)


def si_jungle(tod):
    ground(C('#4f8a3a', tod))
    rnd = random.Random(13)
    trail_mesh([(0, -6), (-0.6, 2), (0.8, 9), (-0.4, 16), (0.6, 24)], '#a98a5a', tod, w0=1.6, taper=0.2)
    for y in range(-1, 30, 2):
        for side in (-1, 1):
            x = side * (2.8 + rnd.random() * 3.5)
            if rnd.random() < 0.5:
                palm((x, y, 0), 6 + rnd.random() * 3, tod, lean=side * -10, seed=y * 5 + side)
            else:
                big_leaf_plant((x, y, 0), tod, 1.2 + rnd.random() * 0.8, seed=y * 7 + side)
    for i in range(5):
        cyl(uid('Vine'), 0.03, 3.5, (rnd.uniform(-2.5, 2.5), 4 + i * 4, 4.5), mat('Vine' + tod, C('#3f7a3a', tod)), verts=6, bevel=0)
    sky(tod); sun(tod, azimuth=-15, elevation=62 if tod == 'day' else 35)
    tv_camera((0.2, -7.5, 1.7), (0, 18, 1.4), lens=26)


def si_fishing(tod):
    beach_base(tod, sea_y=6)
    for i, (x, y, sx, sz) in enumerate(((-2.0, 6.6, 1.3, 0.8), (0.8, 7.8, 1.8, 1.1), (3.2, 6.9, 1.1, 0.6))):
        icorock(uid('FishRock'), (sx, 1.1, sz), (x, y, 0.1), C('#9a958a', tod), seed=i + 20, rot_z=i * 35)
    cyl('Spear', 0.035, 2.6, (0.8, 7.6, 1.9), mat('Spear' + tod, C('#c9b06a', tod)), verts=6, rot=(12, 0, 0), bevel=0)
    net = mat('Net' + tod, C('#e6d49a', tod))
    for x in (-5.2, -2.8):
        cyl(uid('NetStick'), 0.05, 1.8, (x, 3.2, 0.9), mat('Spear' + tod, C('#c9b06a', tod)), verts=6, bevel=0)
    for i in range(6):
        box(uid('Net'), (2.4, 0.03, 0.03), (-4.0, 3.2, 0.5 + i * 0.22), net, bevel=0)
    for i in range(7):
        box(uid('Net'), (0.03, 0.03, 1.2), (-5.0 + i * 0.33, 3.2, 1.05), net, bevel=0)
    box('Canoe', (3.0, 0.8, 0.4), (3.6, 2.6, 0.2), mat('Canoe' + tod, C('#b9784a', tod)), bevel=0, rot=(0, 0, 15))
    box('CanoeIn', (2.6, 0.55, 0.1), (3.6, 2.6, 0.38), mat('CanoeIn' + tod, C('#7a4a2a', tod)), bevel=0, rot=(0, 0, 15))
    for x in (-7.0, 7.5):
        palm((x, 1.5, 0), 7, tod, lean=12 if x < 0 else -12, seed=int(x) + 50)
    sky(tod); sun(tod, azimuth=-35, elevation=48 if tod == 'day' else 30)
    tv_camera((0, -6.0, 1.7), (0, 10, 0.9), lens=27)


def cannon(loc, tod, rot_z=0):
    """The Cannon of Shame: a big iron barrel on a wooden carriage, aimed out over the water."""
    g = _group(uid('Cannon'), loc, rot_z)
    _child(g, box(uid('Carriage'), (1.4, 2.6, 0.7), (0, 0, 0.6), mat('Carriage' + tod, C('#7a5232', tod)), bevel=0))
    for x in (-0.8, 0.8):
        for y in (-0.8, 0.8):
            _child(g, cyl(uid('Wheel'), 0.55, 0.18, (x, y, 0.55), mat('Wheel' + tod, C('#5a3a20', tod)), verts=16, rot=(0, 90, 0), bevel=0))
    _child(g, cyl(uid('Barrel'), 0.55, 4.0, (0, 0.9, 1.6), mat('Barrel' + tod, C('#3d4048', tod)), verts=24, rot=(-65, 0, 0), r2=0.48, bevel=0))
    _child(g, cyl(uid('Muzzle'), 0.62, 0.3, (0, 2.6, 2.4), mat('Muzzle' + tod, C('#4a4d56', tod)), verts=24, rot=(-65, 0, 0), bevel=0))
    return g


def si_exit(tod):
    tod = 'night'
    beach_base(tod, sea_y=4, far=True)
    plank_deck('Dock', (4.5, 14, 0.32), (0, 9, 0.42), tod)
    for yy in range(6, 16, 3):
        for xx in (-2.1, 2.1):
            post((xx, yy, -1.2), 1.8, tod, r=0.13, color='#6b4a2e')
    cannon((0, 10.5, 0.58), tod)
    for x in (-2.0, 2.0):
        tiki_torch((x, 6.0, 0.58), tod, 1.6)
    for x in (-6.5, 6.5):
        palm((x, 0, 0), 7, tod, lean=12 if x < 0 else -12, seed=int(x) + 70)
    sky(tod); sun(tod, azimuth=-30, elevation=28)
    tv_camera((-1.5, -5.0, 2.8), (0.5, 12, 0.9), lens=27)


def si_confessional(tod):
    hc_confessional(tod)


SCENES['survival-island'] = {
    'shelter': si_shelter, 'campfire': si_campfire, 'beach': si_beach, 'shoreline': si_shoreline,
    'water-source': si_water, 'jungle-trail': si_jungle, 'fishing-area': si_fishing,
    'confessional': si_confessional, 'ceremony': si_ceremony, 'exit': si_exit,
}
OUTDOOR['survival-island'] = {'shelter', 'campfire', 'beach', 'shoreline', 'water-source', 'jungle-trail', 'fishing-area'}

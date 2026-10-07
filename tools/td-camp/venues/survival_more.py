# ══════════════════════════════════════════════════════════════════════
# venues/survival_more.py — Soluna's shared places, redrawn in the style of Disventure Camp 5
# ══════════════════════════════════════════════════════════════════════
# Replaces the first versions of five Soluna plates (survival_island.py) that were too plain beside
# the show. DC5 paints only a few of these places itself (the campsites, the bamboo grove, the cave,
# the trial area), so these follow the look of Favorites_Campsite and Fans_Campsite: a lime-to-green
# sky with flat-bottomed white clouds, teal mountains and palm islets on a turquoise sea, curved
# banded palms, dome trees hung with vines, big tropical leaves, hibiscus, flat stones with an ink line.
# The merged camp takes over the Favorites' hut: the plain 'shelter' and 'campfire' plates are theirs.

def hibiscus(x, y, z, tod, col='#e84a6a', s=1.0):
    for k in range(5):
        a = k / 5 * 2 * math.pi
        card(uid('Petal'), _blob_pts(0.16 * s, 0.1 * s, 10, 0, k), y, pmat('Petal' + col + tod, N(col, tod), unlit=True, mottle=0),
             x=x + math.cos(a) * 0.14 * s, z=z + math.sin(a) * 0.14 * s)
    card(uid('PetalHeart'), _blob_pts(0.05 * s, 0.05 * s, 8, 0, 0), y - 0.01, pmat('PetalHeart' + tod, N('#f2d23a', tod), unlit=True, mottle=0), x=x, z=z)


def leaf_clump(x, y, tod, s=1.4, seed=0, flower=None):
    leafy_plant(x, y, tod, s=s, seed=seed, col=N(('#3a9a4a', '#2f8a5a', '#4aa83a')[seed % 3], tod))
    if flower:
        hibiscus(x + 0.3 * s, y - 0.1, 0.7 * s, tod, col=flower, s=s * 0.8)


def sea_backdrop(tod, sea_y=12, far_y=70):
    """The Favorites' horizon: lime sky, teal mountains, palm islets, the turquoise sea and its foam."""
    sol_backdrop(tod, far_y=far_y)
    _islet(-28, 44, 5, tod, seed=1); _islet(16, 48, 4, tod, seed=3); _islet(36, 40, 3, tod, seed=5)
    water_plane(tod, y0=sea_y, col=SOL[tod]['sea'], far=SOL[tod]['sea_far'])
    box('Foam', (220, 0.4, 0.02), (0, sea_y + 0.2, -0.05), pmat('SeaFoam' + tod, N('#f2fbfb', tod), unlit=True, mottle=0), bevel=0)


def sand(tod, y0=-30, y1=12):
    box('Sand', (220, y1 - y0, 0.2), (0, (y0 + y1) / 2, -0.1), pmat('SolSandB' + tod, N('#f2dc9a', tod), N('#c8b07a', tod), mottle=0.25, mscale=0.3), bevel=0)
    rnd = random.Random(2)
    for k in range(10):
        x, y = rnd.uniform(-12, 12), rnd.uniform(1, y1 - 1)
        card(uid('Shell'), _blob_pts(0.12, 0.08, 10, 0.1, k), y, pmat('Shell' + tod, N(('#f2e2d8', '#e8b8a8')[k % 2], tod), unlit=True, mottle=0), x=x, z=0.03)


def si_beach2(tod):
    """The beach: soft sand, palms leaning out over the water, a hammock slung between two of them, the islets."""
    paint_mode()
    sea_backdrop(tod, sea_y=11)
    sand(tod, y1=11)
    for k, (x, y, h, lean) in enumerate(((-6.0, 6.5, 8.5, 16), (-2.4, 8.5, 7.5, 6), (5.6, 7.0, 8.5, -16), (8.0, 9.0, 9.0, -10))):
        sol_palm(x, y, h, tod, lean=lean, seed=k + 50, s=1.3)
    sag = [(-5.8 + 3.2 * t, 2.0 - 0.7 * math.sin(t * math.pi)) for t in [i / 12 for i in range(13)]]
    card(uid('Hammock'), sag + [(x, z + 0.3) for x, z in reversed(sag)], 7.4, pmat('HammockB' + tod, N('#3aa8c8', tod), unlit=True, mottle=0.1))
    for x in (-5.8, -2.6):
        card(uid('HamRope'), [(x - 0.03, 2.0), (x + 0.03, 2.0), (x + 0.03, 2.6), (x - 0.03, 2.6)], 7.4, pmat('HamRope' + tod, N('#c8a868', tod), unlit=True, mottle=0))
    pbox('Towel', (1.0, 2.0, 0.03), (2.6, 2.6, 0.02), '#e84a6a', tod, rot=(0, 0, 12))
    pbox('TowelStripe', (1.0, 0.3, 0.035), (2.6, 2.6, 0.02), '#f2e2c8', tod, rot=(0, 0, 12), ink=False)
    pcyl('Driftwood', 0.22, 3.0, (0.5, 5.5, 0.2), '#c8b48a', tod, verts=10, rot=(0, 90, 20))
    for k, (x, y) in enumerate(((-4.6, 1.2), (5.0, 1.4), (-3.4, 4.5))):
        leaf_clump(x, y, tod, s=1.6, seed=k, flower='#e84a6a' if k != 1 else '#f2a83a')
    tiki(4.0, 7.5, tod, h=2.4, lit=tod == 'night')
    for k, (x, y, s) in enumerate(((3.5, 8.6, 0.7), (6.0, 9.4, 0.5), (-1.0, 9.0, 0.6), (1.6, 1.4, 0.4))):
        flat_stone(x, y, tod, s=s, seed=k + 30)
    for x in (-1.5, 1.0, 3.5):
        stand(x, 3.0)
    paint_sun(azimuth=-30, elevation=50 if tod == 'day' else 30, energy=4.0 if tod == 'day' else 1.6)
    tv_camera((0, -6.0, 1.9), (0, 12, 1.8), lens=26)


def si_shoreline2(tod):
    """The rocky end of the beach: dark boulders with tide pools, palms leaning over the water."""
    paint_mode()
    sea_backdrop(tod, sea_y=9)
    sand(tod, y1=9)
    rnd = random.Random(7)
    for k in range(9):
        s = rnd.uniform(0.9, 2.2)
        y = rnd.uniform(4, 12); x = rnd.choice((-1, 1)) * rnd.uniform(2.5, 0.55 * (y + 6))
        r = icorock(uid('Boulder'), (s * 1.2, s, s * 0.8), (x, y, 0.1), N('#6a6a6a', tod), seed=k, rot_z=rnd.random() * 90)
        r.data.materials.clear(); r.data.materials.append(pmat('BoulderS' + tod, N('#6a6e6a', tod), N('#3a4048', tod), mottle=0.3)); r['ink'] = 1
    for k, (x, y, rx) in enumerate(((-2.8, 3.2, 1.3), (3.2, 2.6, 1.0))):
        _flat_poly('TidePool', _blob(x, y, rx, rx * 0.6, seed=k, wob=0.15), 0.02, '#4ad0d8', tod, mottle=0.05)
        card(uid('Starfish'), [(math.cos(math.pi / 2 + i * math.pi / 5) * (0.18 if i % 2 == 0 else 0.07), math.sin(math.pi / 2 + i * math.pi / 5) * (0.18 if i % 2 == 0 else 0.07)) for i in range(10)],
             y - 0.1, pmat('Starfish' + tod, N('#f2843a', tod), unlit=True, mottle=0), x=x + 0.3, z=0.06)
    for k, (x, y, h, lean) in enumerate(((-6.5, 7, 8.5, 22), (6.5, 6, 9, -24))):
        sol_palm(x, y, h, tod, lean=lean, seed=k + 60, s=1.3)
    leaf_clump(-4.8, 1.2, tod, s=1.5, seed=4, flower='#e84a6a')
    leaf_clump(5.0, 1.4, tod, s=1.4, seed=5)
    for x in (-1.5, 1.0, 3.0):
        stand(x, 2.6)
    paint_sun(azimuth=-35, elevation=45 if tod == 'day' else 30, energy=4.0 if tod == 'day' else 1.6)
    tv_camera((0, -5.5, 1.9), (0, 12, 1.6), lens=26)


def si_fishing2(tod):
    """The fishing spot: a plank pier out into the lagoon, rods propped on it, a bucket, a net drying on
    poles, a dugout canoe drawn up on the sand."""
    paint_mode()
    sea_backdrop(tod, sea_y=8)
    sand(tod, y1=8)
    plank_floor('Pier', (2.6, 14, 0.25), (2.5, 13, 0.6), '#8a643a', tod, axis='y', step=0.45, seam='#5a3a22')
    for yy in (7, 10, 13, 16, 19):
        for xx in (1.4, 3.6):
            pcyl('PierPost', 0.14, 2.2, (xx, yy, -0.3), '#6a4a2a', tod, verts=10)
    for k, xx in enumerate((1.6, 3.4)):
        pcyl('Rod', 0.03, 3.4, (xx, 15.5, 1.8), '#5a3a22', tod, verts=6, rot=(0, (-1) ** k * 28, 0))
    pcyl('Bucket', 0.35, 0.55, (2.0, 10.0, 0.98), '#6a8aa8', tod, verts=14)
    for k in range(3):
        card(uid('Fish'), _blob_pts(0.25, 0.08, 10, 0, k), 9.6, pmat('Fish' + tod, N('#a8c8d8', tod), unlit=True, mottle=0), x=1.9 + k * 0.1, z=1.35 + k * 0.05)
    for x in (-5.5, -2.0):
        pcyl('NetPole', 0.1, 3.0, (x, 6.5, 1.5), '#6a4a2a', tod, verts=8)
    nm = pmat('Net' + tod, N('#e8dcc0', tod), unlit=True, mottle=0)
    for k in range(9):
        card(uid('NetH'), [(-5.5, 0.6 + k * 0.28), (-2.0, 0.6 + k * 0.28 - 0.1 * math.sin(k)), (-2.0, 0.62 + k * 0.28 - 0.1 * math.sin(k)), (-5.5, 0.62 + k * 0.28)], 6.45, nm)
        card(uid('NetV'), [(-5.4 + k * 0.4, 0.6), (-5.37 + k * 0.4, 0.6), (-5.37 + k * 0.4, 2.9), (-5.4 + k * 0.4, 2.9)], 6.45, nm)
    pbox('Canoe', (1.0, 4.0, 0.5), (-1.2, 3.4, 0.25), '#8a5a32', tod, shade='#5a3a22', rot=(0, 0, 70))
    pbox('Paddle', (0.15, 1.8, 0.05), (0.6, 2.2, 0.06), '#a8784a', tod, rot=(0, 0, 40))
    for k, (x, y, h, lean) in enumerate(((-6.8, 5, 8.5, 16), (7.0, 5.5, 9, -18))):
        sol_palm(x, y, h, tod, lean=lean, seed=k + 70, s=1.3)
    leaf_clump(-4.8, 1.2, tod, s=1.5, seed=6, flower='#f2a83a')
    leaf_clump(5.2, 1.6, tod, s=1.3, seed=8)
    for x in (-3.5, -0.5, 6.0):
        stand(x, 2.4)
    paint_sun(azimuth=-35, elevation=45 if tod == 'day' else 30, energy=4.0 if tod == 'day' else 1.6)
    tv_camera((0, -5.5, 2.2), (0.5, 12, 1.5), lens=26)


def si_water2(tod):
    """The water source: a fall off a rock face into a green pool in the jungle, vines and dome trees
    around it, lily pads, a bamboo pipe someone rigged to fill bottles."""
    paint_mode(); P = SOL[tod]
    sol_backdrop(tod, mountains=True)
    ground_plane(N(SOL_GROUND, tod), N('#5a7a32', tod), mottle=0.3)
    rnd = random.Random(12)
    for k in range(14):
        x = -28 + k * 4.2 + rnd.uniform(-1, 1)
        dome_tree(x, 24 + rnd.uniform(0, 4), rnd.uniform(7, 10), tod, col=('#2f7a3e', '#3a8a3a', '#256a3a')[k % 3], s=rnd.uniform(1.3, 1.7), seed=k + 40)
    # the rock face and the fall
    card(uid('Cliff'), [(-6, 0), (6, 0), (5.5, 6.5), (3.0, 8.2), (0, 8.6), (-3.2, 8.0), (-5.6, 6.0)], 12.0, pmat('Cliff' + tod, N('#7a8a8a', tod), unlit=True, mottle=0.25), z=0)
    card(uid('CliffSh'), [(1.5, 0), (6, 0), (5.5, 6.5), (3.0, 8.2), (1.5, 8.4)], 11.95, pmat('CliffSh' + tod, N('#5a6a72', tod), unlit=True, mottle=0.2), z=0)
    card(uid('CliffTop'), _blob_pts(4.8, 0.7, 20, 0.15, 3, flat_bottom=True), 11.9, pmat('CliffTop' + tod, N('#4a9a3a', tod), unlit=True, mottle=0.2), x=-0.2, z=7.9)
    card(uid('Fall'), [(-0.9, 0), (0.9, 0), (0.8, 8.0), (-0.8, 8.0)], 11.85, pmat('FallW' + tod, N('#7ad8f0', tod), unlit=True, mottle=0), x=-0.4, z=0.2)
    for k in range(5):
        card(uid('FallStreak'), [(-0.05, 0), (0.05, 0), (0.05, 7.6), (-0.05, 7.6)], 11.8, pmat('FallStreakW' + tod, N('#e0f8ff', tod), unlit=True, mottle=0), x=-1.1 + k * 0.35, z=0.4)
    _flat_poly('Pool', _blob(0, 8.0, 5.0, 2.6, seed=8, wob=0.1), 0.03, '#3ac8c8', tod, mottle=0.05)
    card(uid('Splash'), _blob_pts(1.8, 0.5, 16, 0.3, 2), 10.6, pmat('Splash' + tod, N('#f2fcff', tod), unlit=True, mottle=0), x=-0.4, z=0.2)
    for k, (x, y) in enumerate(((-2.5, 7.4), (1.8, 7.0), (3.2, 8.2), (-3.6, 8.6))):
        _flat_poly('LilyPad', _blob(x, y, 0.45, 0.3, seed=k, wob=0.05), 0.04, '#4aa83a', tod, mottle=0)
    hibiscus(1.8, 6.9, 0.12, tod, col='#f2a8c8', s=0.8)
    # the bamboo pipe off the rock, a water jug under it
    pcyl('Pipe', 0.12, 3.2, (4.6, 9.0, 2.2), '#8ab84a', tod, verts=8, rot=(0, 70, 0))
    pcyl('Jug', 0.35, 0.8, (6.0, 8.6, 0.4), '#c8843a', tod, r2=0.2, verts=14)
    for k, (x, y, h, lean) in enumerate(((-7.5, 8, 9, 14), (7.5, 7.5, 9, -14))):
        sol_palm(x, y, h, tod, lean=lean, seed=k + 80, s=1.3)
    for k, (x, y) in enumerate(((-4.5, 2.5), (4.8, 2.2), (-5.5, 5.5), (5.8, 5.0))):
        leaf_clump(x, y, tod, s=1.5, seed=k + 7, flower='#e84a6a' if k % 2 == 0 else None)
    for k, (x, y) in enumerate(((-4.5, 5.0), (4.0, 4.6))):
        flat_stone(x, y, tod, s=0.8, seed=k + 40)
    for x in (-2.0, 0.5, 3.0):
        stand(x, 3.6)
    paint_sun(azimuth=-30, elevation=50 if tod == 'day' else 30, energy=4.0 if tod == 'day' else 1.8)
    tv_camera((0, -6.0, 2.2), (0, 12, 2.8), lens=26)


def si_confessional2(tod):
    """The confessional: inside a bamboo outhouse in the jungle — slatted bamboo walls, a thatch roof, a
    little window of leaves, a stool, a tiki mask on the wall, the camera's red light."""
    paint_mode()
    W, D, H = 4.4, 3.0, 2.8
    plank_floor('Floor', (W, D, 0.2), (0, D / 2, -0.1), '#8a6a3a', 'day', axis='x', step=0.35, seam='#5a3a22')
    bam = pmat('BamT', '#c8b46a', '#8a7a3a', mottle=0.25)
    node = pmat('BamNodeT', '#7a6a32', unlit=True, mottle=0)
    for k in range(int(W / 0.22)):
        x = -W / 2 + 0.11 + k * 0.22
        if -0.6 < x < 0.6:
            for (z0, z1) in ((0, 1.3), (2.1, H)):
                ob = box(uid('Slat'), (0.2, 0.2, z1 - z0), (x, D, (z0 + z1) / 2), bam, bevel=0); ob['ink'] = 1
        else:
            ob = box(uid('Slat'), (0.2, 0.2, H), (x, D, H / 2), bam, bevel=0); ob['ink'] = 1
        for z in (0.8, 1.9):
            box(uid('Node'), (0.21, 0.21, 0.04), (x, D - 0.01, z), node, bevel=0)
    for sx in (-1, 1):
        for k in range(int(D / 0.22)):
            ob = box(uid('SideSlat'), (0.2, 0.2, H), (sx * W / 2, k * 0.22 + 0.11, H / 2), bam, bevel=0); ob['ink'] = 1
    # the window of leaves and sky between the slats
    card(uid('WinSky'), [(-0.6, 1.3), (0.6, 1.3), (0.6, 2.1), (-0.6, 2.1)], D + 0.4, pmat('WinSky', '#9ae08a', unlit=True, mottle=0))
    for k in range(4):
        card(uid('WinLeaf'), _blob_pts(0.3, 0.15, 10, 0.1, k), D + 0.35, pmat('WinLeaf', '#3a8a3a', unlit=True, mottle=0), x=-0.5 + k * 0.33, z=1.4 + (k % 2) * 0.5)
    for sd in (-1, 1):
        pbox('Roof', (W + 0.6, D / 2 + 0.6, 0.25), (0, D / 2 + sd * D * 0.25, H + 0.5), '#c8a560', 'day', shade='#8a6a3a', mottle=0.45, mscale=2.6, rot=(sd * -25, 0, 0), ink=False)
    tiki_face(1.4, D - 0.25, 0.9, 'day', col='#a8743a', s=0.6)
    pcyl('Stool', 0.35, 0.5, (0, 1.4, 0.25), '#8a5a32', 'day', verts=12)
    card(uid('RecLight'), _blob_pts(0.06, 0.06, 8, 0, 0), D - 0.15, pmat('RecLight', '#ff3a3a', unlit=True, mottle=0), x=-1.6, z=2.4)
    for x in (0.0,):
        stand(x, 1.4)
    room_light(azimuth=-30, elevation=60, energy=3.0)
    paint_sky('#c8b890', '#c8b890')
    tv_camera((0.0, -2.2, 1.5), (0, D, 1.5), lens=22)


SCENES['survival-island'].update({
    'beach': si_beach2, 'shoreline': si_shoreline2, 'fishing-area': si_fishing2, 'water-source': si_water2, 'confessional': si_confessional2,
    'shelter': lambda tod: si_shelter_t1(tod), 'campfire': lambda tod: si_campfire_t1(tod),
})

# ══════════════════════════════════════════════════════════════════════
# venues/carnival_more.py — Stawaki's shared places, redrawn closer to Disventure Camp 4
# ══════════════════════════════════════════════════════════════════════
# Replaces the first versions of six carnival plates (carnival.py) that were too plain beside the
# show's own art. References (Disventure Camp wiki):
#   haunted-mansion   Haunted_Mansion: a storm wheeling overhead, a green-grey house of steep gables
#                     with a cupola and a clock, arched windows, a porch, an iron fence on stone posts,
#                     fog on the dead grass, the coaster and the wheel dark behind it
#   corn-maze         Corn_Maze_Exterior: the maze seen from its entrance, rows of corn running back,
#                     the CORN MAZE arch with a cob on top, scarecrows on posts, pumpkins, hay
#   carnival-entrance Stawaki_Carnival_-_Entrance: a wavy STAWAKI CARNIVAL sign on wooden posts, the
#                     park crowded behind (tents, the drop tower, a swing ride, the wheel), a FUN PARK
#                     arrow, a wrecked bumper car, a broken fence, weeds
#   midway            The_Midway: a row of booths under scalloped awnings and lit signs (COTTON CANDY),
#                     tall pines, the coaster and the lights of the rides above them
#   lake-shore, rocky-beach  Lake_Challenge_Ep17: a teal-green lake full of rocks, misty lavender hills,
#                     a lavender sky with white clouds

def lav_sky(tod, far_y=90, span=0.3):
    """The carnival's daytime sky (Stawaki_Carnival_-_Roller_Coaster): lavender, white clouds, misty hills."""
    if tod == 'day':
        paint_sky('#9a8ad8', '#d8c8f0', span=span)
        for (cx, cz, cs) in ((-44, 40, 3.4), (-10, 48, 2.6), (22, 42, 3.0), (54, 50, 2.4)):
            curly_cloud(cx, far_y + 50, cz, cs, '#f6f2fc', '#c8bce8')
    else:
        paint_sky('#1c2452', '#33407a', span=span)
        rnd = random.Random(9)
        for i in range(50):
            card(uid('Star'), _blob_pts(0.18, 0.18, 8, 0, 0), far_y + 62, pmat('StarL', '#f4f0d8', unlit=True, mottle=0), x=rnd.uniform(-90, 90), z=rnd.uniform(14, 60))
    for k, (col, a) in enumerate((('#b8a8d8', 1.0), ('#a090c8', 1.0), ('#d8ccf0', 0.45))):
        ridge_card(far_y + 30 - k * 14, -160, 160, 1 + k, 14 - k * 4, N(col, tod), seed=40 + k, humps=5 + k, teeth=70, tooth_col=N(_mix_hex(col, '#2a2a4a', 0.1), tod), alpha=a)


def booth(x, y, tod, col, sign, s=1.0, lit=None):
    """A midway booth (The_Midway): a box with a scalloped striped awning, a lit sign on top, prizes inside."""
    lit = (tod == 'night') if lit is None else lit
    pbox('BoothBody', (3.0 * s, 2.0 * s, 2.6 * s), (x, y, 1.3 * s), col, tod, shade=_mix_hex(col, '#1a1a2a', 0.3))
    pbox('BoothHole', (2.4 * s, 0.1, 1.2 * s), (x, y - 1.0 * s, 1.6 * s), '#2a1e2a', tod, ink=False)
    pbox('BoothCounter', (3.1 * s, 0.4 * s, 0.15 * s), (x, y - 1.1 * s, 1.0 * s), '#efe6d6', tod)
    for i in range(6):
        c = '#c8303a' if i % 2 == 0 else '#efe6d6'
        card(uid('Scal'), [(math.cos(math.pi + t * math.pi / 8) * 0.25 * s, math.sin(math.pi + t * math.pi / 8) * 0.25 * s) for t in range(9)],
             y - 1.15 * s, pmat('Scal' + c + tod, N(c, tod), unlit=True, mottle=0), x=x - 1.25 * s + i * 0.5 * s, z=2.55 * s)
        pbox('Awn', (0.5 * s, 0.9 * s, 0.05), (x - 1.25 * s + i * 0.5 * s, y - 0.75 * s, 2.75 * s), c, tod, rot=(-22, 0, 0), ink=False)
    pbox('Sign', (2.6 * s, 0.12, 0.8 * s), (x, y - 0.6 * s, 3.4 * s), '#f2e2c8', tod)
    ptext(sign, (x, y - 0.68 * s, 3.4 * s), 0.3 * s, N('#a82a2a', tod))
    for k in range(10):
        card(uid('SignBulb'), _blob_pts(0.06 * s, 0.06 * s, 8, 0, 0), y - 0.68 * s, pmat('SignBulb' + str(lit), '#ffe28a' if lit else '#e8d8a8', unlit=True, mottle=0),
             x=x - 1.2 * s + k * 0.27 * s, z=3.85 * s)
    for i, pc in enumerate(('#e88aa8', '#8ad0ff', '#f2d27a', '#a8e08a')):
        card(uid('Prize'), _blob_pts(0.22 * s, 0.25 * s, 12, 0, i), y - 0.9 * s, pmat('Prize' + pc + tod, N(pc, tod), unlit=True, mottle=0), x=x - 0.8 * s + i * 0.55 * s, z=1.6 * s)
    if lit:
        point(uid('BoothLight'), (x, y - 1.6 * s, 2.6 * s), 380, '#ffd9a0', radius=0.3)


def swing_ride(x, y, tod, s=1.0):
    pcyl('SwingMast', 0.3 * s, 8.0 * s, (x, y, 4.0 * s), '#d8cfc4', tod, verts=10)
    striped('SwingTop', 2.6 * s, 1.0 * s, (x, y, 8.4 * s), '#c8303a', '#efe6d6', tod, n=8, r2=0.4 * s)
    for k in range(8):
        a = k / 8 * 2 * math.pi
        card(uid('SwingChain'), [(-0.03, 0), (0.03, 0), (0.03, -2.6 * s), (-0.03, -2.6 * s)], y - math.sin(a) * 2.3 * s, pmat('SwingChain' + tod, N('#6a6a72', tod), unlit=True, mottle=0),
             x=x + math.cos(a) * 2.3 * s, z=7.9 * s)
        card(uid('SwingSeat'), [(-0.25 * s, 0), (0.25 * s, 0), (0.25 * s, 0.3 * s), (-0.25 * s, 0.3 * s)], y - math.sin(a) * 2.3 * s - 0.01,
             pmat('SwingSeat' + tod, N(('#3a5aa8', '#e8b03a')[k % 2], tod), unlit=True, mottle=0), x=x + math.cos(a) * 2.3 * s, z=5.1 * s)


def wreck_bumper(x, y, tod, col='#2e3a8a', rot=0):
    g = _group(uid('Bumper'), (x, y, 0), rot)
    _child(g, pbox('BumperBody', (2.2, 1.5, 0.7), (0, 0, 0.45), col, tod))
    _child(g, pbox('BumperRim', (2.4, 1.7, 0.18), (0, 0, 0.2), '#2a2a2a', tod))
    _child(g, pbox('BumperSeat', (0.9, 0.6, 0.6), (0, 0.4, 1.0), '#1a1a2a', tod))
    _child(g, pcyl('BumperPole', 0.05, 1.8, (0, 0.5, 1.7), '#9aa0a8', tod, verts=8))
    return g


def weeds(tod, y, x0, x1, seed=0, n=10):
    rnd = random.Random(seed)
    for k in range(n):
        x = rnd.uniform(x0, x1)
        for j in range(5):
            a = math.radians(60 + j * 15 + rnd.uniform(-5, 5)); L = rnd.uniform(0.5, 1.1)
            card(uid('Weed'), [(0, 0), (0.06, 0), (math.cos(a) * L + 0.03, math.sin(a) * L)], y + rnd.uniform(-0.3, 0.3), pmat('Weed' + tod, N('#6a8a3a', tod), unlit=True, mottle=0), x=x)


# ── the haunted mansion ───────────────────────────────────────────────
def storm_swirl(tod, y=90, cz=40):
    """The storm wheeling over the mansion: dark rings of cloud around a paler eye."""
    for k, (r, c) in enumerate(((44, '#3a3a46'), (34, '#4a4a58'), (24, '#3e3e4c'), (14, '#545466'), (6, '#5e5e70'))):
        pts = [(math.cos(a / 40 * 6.28) * r * (1 + 0.08 * math.sin(a * 0.9 + k)), math.sin(a / 40 * 6.28) * r * 0.42) for a in range(40)]
        card(uid('Swirl'), pts, y - k * 0.5, pmat('Swirl' + c + tod, N(c, tod), unlit=True, mottle=0.2, mscale=0.2), x=6, z=cz)


def cv_haunted2(tod):
    paint_mode()
    paint_sky(N('#3a3a48', tod), N('#6a6a7a', tod))
    storm_swirl(tod)
    ground_plane(N('#5a5e48', tod), N('#40443a', tod), mottle=0.35)
    pbox('Path', (2.6, 14, 0.02), (0, 4, 0.01), '#7a7a6a', tod, ink=False)
    coaster(-30, -10, 36, tod, seed=5)
    ferris(16, 34, 8, tod, lit=False)
    wall, roof, trim = '#6a7a6a', '#2e3a3a', '#4a5a52'
    pbox('Mansion', (12, 7, 6.5), (0, 16, 3.25), wall, tod, shade='#4a5a50', mottle=0.35, mscale=0.8)
    for (gx, gw, gh) in ((-4.0, 2.6, 4.4), (0.0, 2.2, 5.2), (4.0, 2.6, 4.4)):
        card(uid('Gable'), [(-gw, 0), (gw, 0), (0, gh)], 12.4, pmat('Gable' + tod, N(wall, tod), unlit=True, mottle=0.3), x=gx, z=6.5)
        card(uid('GableRoof'), [(-gw - 0.4, -0.15), (0, gh + 0.5), (gw + 0.4, -0.15), (gw, -0.15), (0, gh), (-gw, -0.15)], 12.38, pmat('MRoof' + tod, N(roof, tod), unlit=True, mottle=0), x=gx, z=6.5)
        card(uid('GableWin'), [(-0.45, 0), (0.45, 0), (0.45, 0.8), (0, 1.2), (-0.45, 0.8)], 12.36,
             pmat('GWin' + tod, '#c8d86a' if tod == 'night' else N('#2a3230', tod), unlit=True, mottle=0), x=gx, z=7.4)
    pbox('Cupola', (2.2, 2.2, 2.4), (0, 14.5, 12.6), wall, tod, shade='#4a5a50')
    card(uid('CupolaRoof'), [(-1.6, 0), (1.6, 0), (0, 2.8)], 13.35, pmat('MRoof' + tod, N(roof, tod), unlit=True, mottle=0), x=0, z=13.8)
    card(uid('Clock'), _blob_pts(0.7, 0.7, 20, 0, 0), 13.34, pmat('Clock' + tod, '#e8c84a' if tod == 'night' else N('#d8c87a', tod), unlit=True, mottle=0), x=0, z=12.6)
    for a in (90, 20):
        card(uid('Hand'), [(-0.04, 0), (0.04, 0), (0.04, 0.5), (-0.04, 0.5)], 13.33, pmat('Hand', '#2a2a2a', unlit=True, mottle=0), x=0, z=12.6).rotation_euler = (0, math.radians(a - 90), 0)
    glow = tod == 'night'
    for x, z in ((-4.0, 1.9), (4.0, 1.9), (-4.0, 4.6), (4.0, 4.6), (-1.6, 4.6), (1.6, 4.6)):
        card(uid('MWin'), [(-0.55, 0), (0.55, 0), (0.55, 1.0), (0, 1.5), (-0.55, 1.0)], 12.45, pmat('MWin' + tod, '#c8d86a' if glow else N('#2a3230', tod), unlit=True, mottle=0), x=x, z=z - 0.6)
        pbox('Shutter', (0.2, 0.06, 1.4), (x - 0.75, 12.44, z), trim, tod, rot=(0, 6, 0))
        pbox('Board', (1.4, 0.06, 0.16), (x, 12.38, z), '#9a7a52', tod, rot=(0, 14 if x < 0 else -14, 0), ink=False)
    pbox('Door', (1.4, 0.08, 2.4), (0, 12.6, 1.5), '#2a1e18', tod)
    card(uid('DoorArch'), [(-0.7, 0), (0.7, 0), (0, 0.6)], 12.55, pmat('DoorArch' + tod, N('#2a1e18', tod), unlit=True, mottle=0), z=2.7)
    plank_floor('Porch', (7, 2.0, 0.3), (0, 11.6, 0.3), '#5a5a5a', tod, axis='x', step=0.35)
    for x in (-3.2, -1.2, 1.2, 3.2):
        pcyl('PorchCol', 0.15, 2.8, (x, 10.8, 1.7), '#8a9a8a', tod, verts=10)
    pbox('PorchRoof', (7.4, 2.4, 0.2), (0, 11.4, 3.15), roof, tod, rot=(-10, 0, 0))
    for i in range(4):
        pbox('Step', (2.4, 0.4, 0.15), (0, 10.4 - i * 0.4, 0.3 - i * 0.08), '#6a6a6a', tod)
    for x in range(-12, 13):
        if abs(x) < 2:
            continue
        pbox('Picket', (0.08, 0.08, 1.6), (x, 7.5, 0.8), '#1e2226', tod, ink=False)
        card(uid('PicketTop'), [(-0.13, 0), (0.13, 0), (0, 0.32)], 7.45, pmat('Picket' + tod, N('#1e2226', tod), unlit=True, mottle=0), x=x, z=1.6)
    pbox('FenceRail', (24, 0.08, 0.08), (0, 7.5, 1.2), '#1e2226', tod)
    for x in (-12, -6, -2, 2, 6, 12):
        pbox('GatePost', (0.6, 0.6, 2.0), (x, 7.6, 1.0), '#8a8e88', tod)
        pbox('PostCap', (0.8, 0.8, 0.2), (x, 7.6, 2.1), '#9a9e98', tod)
    for (x, h) in ((-9, 6), (9.5, 5.5)):
        card(uid('DeadTree'), [(-0.3, 0), (0.3, 0), (0.15, h * 0.6), (1.4, h), (1.2, h * 1.02), (0.05, h * 0.7), (-0.2, h * 0.9), (-0.35, h * 0.88), (-0.12, h * 0.6)], 9.0,
             pmat('DeadTree' + tod, N('#2a2a30', tod), unlit=True, mottle=0), x=x)
    fog_wisps(tod, 4, 14, n=12, seed=31, x0=-14, x1=14)
    paint_sun(azimuth=-60, elevation=30 if tod == 'day' else 20, energy=3.0 if tod == 'day' else 1.4)
    tv_camera((0, -9.0, 2.2), (0, 14, 6.4), lens=24)


# ── the corn maze ─────────────────────────────────────────────────────
def scarecrow(x, y, tod, s=1.0):
    pcyl('ScarePost', 0.07, 3.0 * s, (x, y, 1.5 * s), '#6a4a2a', tod, verts=8)
    pbox('ScareArm', (1.8 * s, 0.1, 0.1), (x, y, 2.3 * s), '#6a4a2a', tod)
    pbox('ScareShirt', (1.0 * s, 0.3, 0.9 * s), (x, y, 2.0 * s), '#c8503a', tod)
    card(uid('ScareHead'), _blob_pts(0.3 * s, 0.32 * s, 14, 0.05, int(x)), y - 0.2, pmat('ScareHead' + tod, N('#e8d8a8', tod), unlit=True, mottle=0), x=x, z=2.8 * s)
    card(uid('ScareHat'), [(-0.5 * s, 0), (0.5 * s, 0), (0.25 * s, 0.1 * s), (0.15 * s, 0.45 * s), (-0.15 * s, 0.45 * s), (-0.25 * s, 0.1 * s)], y - 0.21,
         pmat('ScareHat' + tod, N('#6a4a2a', tod), unlit=True, mottle=0), x=x, z=3.05 * s)


def cv_corn_maze2(tod):
    paint_mode()
    lav_sky(tod, far_y=80)
    ground_plane(N('#8a7a42', tod), N('#6a5a32', tod), mottle=0.35)
    pine_wall(tod, 48, -60, 60, seed=19, h=(9, 13), s=1.4)
    corn = pmat('CornHedge' + tod, N('#7a8a2a', tod), N('#5a6a22', tod), mottle=0.3, mscale=1.2)
    top = pmat('CornTop' + tod, N('#c8b84a', tod), unlit=True, mottle=0.2)
    rnd = random.Random(8)
    # rows of corn running back from the entrance, broken by the maze's turns
    for r in range(9):
        y = 10 + r * 3.0
        x = -26
        while x < 26:
            w = rnd.uniform(3, 9)
            if abs(x + w / 2) > 2.0 or r > 2:
                ob = box(uid('CornRow'), (w, 1.4, 2.4), (x + w / 2, y, 1.2), corn, bevel=0); ob['ink'] = 1
                box(uid('CornTassel'), (w, 1.4, 0.15), (x + w / 2, y, 2.45), top, bevel=0)
            x += w + rnd.uniform(1.2, 2.4)
    # the CORN MAZE arch over the way in, a cob on top
    for sx in (-2.2, 2.2):
        pbox('ArchPost', (0.3, 0.3, 4.2), (sx, 8.0, 2.1), '#7a3a2a', tod)
    pbox('ArchBoard', (5.4, 0.2, 1.1), (0, 7.9, 4.4), '#e8c87a', tod)
    pbox('ArchTrim', (5.6, 0.18, 1.3), (0, 7.95, 4.4), '#a82a2a', tod)
    ptext('CORN MAZE', (0, 7.75, 4.4), 0.5, N('#a82a2a', tod))
    card(uid('Cob'), _blob_pts(0.35, 0.7, 14, 0, 0), 7.7, pmat('CobA' + tod, N('#e8c040', tod), unlit=True, mottle=0.2), x=0, z=5.5)
    for sd in (-1, 1):
        card(uid('Husk'), [(0, 0), (sd * 0.6, 0.4), (sd * 0.3, 1.0)], 7.69, pmat('Husk' + tod, N('#6a9a3a', tod), unlit=True, mottle=0), x=sd * 0.2, z=5.0)
    for (x, y) in ((-8, 12.5), (7, 13.5), (-15, 19), (13, 18)):
        scarecrow(x, y, tod, s=1.0)
    for (x, y, s) in ((-3.0, 6.0, 0.5), (3.2, 6.2, 0.45), (-5.0, 4.5, 0.4), (4.6, 4.0, 0.55), (1.8, 3.4, 0.35)):
        pcyl('Pumpkin', s, s * 0.8, (x, y, s * 0.4), '#e8782a', tod, verts=14)
        pcyl('PumpStem', 0.05, 0.15, (x, y, s * 0.85), '#4a6a2a', tod, verts=6, ink=False)
    for (x, y) in ((-6.5, 7.0), (6.0, 7.2)):
        pbox('HayBale', (1.6, 1.0, 0.9), (x, y, 0.45), '#d8b46a', tod, shade='#a8843a', mottle=0.4, mscale=2)
    pbox('Trash', (0.6, 0.6, 0.8), (-7.8, 4.5, 0.4), '#c8303a', tod)
    pbox('Trash2', (0.6, 0.6, 0.8), (8.0, 4.0, 0.4), '#3a6ab8', tod)
    paint_sun(azimuth=-40, elevation=55 if tod == 'day' else 28, energy=4.0 if tod == 'day' else 1.6)
    tv_camera((0, -6.0, 5.5), (0, 16, 2.0), lens=24)


# ── the entrance ──────────────────────────────────────────────────────
def cv_entrance2(tod):
    paint_mode()
    lav_sky(tod, far_y=90)
    ground_plane(N('#8a8a4a', tod), N('#6a6a3a', tod), mottle=0.35)
    brush_patch('Path', 3.2, (0, 5), N('#a89a6a', tod), sx=0.9, sy=2.6, seed=5)
    pine_wall(tod, 50, seed=12, h=(12, 17))
    coaster(-30, -8, 40, tod, seed=3)
    ferris(14, 32, 7.5, tod)
    drop_tower(-6, 30, 16, tod)
    swing_ride(5, 28, tod, s=0.9)
    for k, (x, yy, r, a) in enumerate(((-13, 20, 3.0, '#c8303a'), (-8, 17, 2.4, '#3a5aa8'), (9, 18, 2.6, '#c8303a'), (14, 16, 2.2, '#7a5aa8'), (-17, 15, 2.0, '#3a5aa8'), (2, 22, 2.8, '#c8303a'))):
        circus_tent(x, yy, tod, r=r, h=2.0, roof=2.6, a=a)
    # the wavy sign on two rough wooden posts
    for sx in (-3.6, 3.6):
        pbox('GatePost', (0.45, 0.45, 6.4), (sx, 9.5, 3.2), '#6a4a2a', tod)
        pbox('GateBrace', (0.2, 0.2, 2.2), (sx + (0.6 if sx < 0 else -0.6), 9.5, 4.8), '#6a4a2a', tod, rot=(0, -35 if sx < 0 else 35, 0))
    wave = [(-4.6 + 9.2 * t, 0.25 * math.sin(t * 6.28 * 1.5)) for t in [i / 30 for i in range(31)]]
    sign = wave + [(x, z + 1.7 + 0.5 * math.sin(math.pi * (x + 4.6) / 9.2)) for x, z in reversed(wave)]
    card(uid('Sign'), sign, 9.2, pmat('SignW' + tod, N('#e8c08a', tod), unlit=True, mottle=0.2), z=6.0)
    card(uid('SignEdge'), [(x * 1.03, z * 1.03 - 0.06) for x, z in sign], 9.25, pmat('SignEdge' + tod, N('#8a3a2a', tod), unlit=True, mottle=0), z=6.0)
    ptext('STAWAKI', (0, 9.1, 7.35), 0.55, N('#a82a2a', tod))
    ptext('CARNIVAL', (0, 9.1, 6.65), 0.62, N('#a82a2a', tod))
    for k in range(14):
        on = (k * 7) % 5 != 0
        card(uid('SignBulb'), _blob_pts(0.08, 0.08, 8, 0, 0), 9.15, pmat('SBulb' + str(on), '#ffd27a' if on else '#7a6a50', unlit=True, mottle=0), x=-4.2 + k * 0.65, z=6.0 + 1.9 + 0.5 * math.sin(math.pi * k / 13))
    # the broken fence, the FUN PARK arrow, a wrecked bumper car, weeds
    rnd = random.Random(4)
    for x in range(-18, 19):
        if abs(x) < 4 or rnd.random() < 0.15:
            continue
        h = rnd.uniform(1.2, 2.1)
        card(uid('Plank'), [(-0.32, 0), (0.32, 0), (0.32, h * rnd.uniform(0.8, 1)), (0.05, h), (-0.32, h * rnd.uniform(0.75, 1))], 10.0 + rnd.uniform(-0.1, 0.1),
             pmat('FencePl' + tod, N('#9a7a5a', tod), unlit=True, mottle=0.3), x=x)
    pbox('FunPost', (0.15, 0.15, 3.0), (-6.5, 8.0, 1.5), '#5a3a22', tod)
    pbox('FunSign', (2.6, 0.12, 0.8), (-6.2, 7.9, 3.0), '#c8303a', tod, rot=(0, -8, 0))
    ptext('FUN PARK', (-6.2, 7.8, 3.0), 0.32, N('#f2e2b0', tod), rot=(90, -8, 0))
    wreck_bumper(8.5, 6.0, tod, rot=-25)
    weeds(tod, 9.6, -16, 16, seed=7, n=14)
    weeds(tod, 5.0, -12, -6, seed=8, n=4)
    cv_bush(-10.0, 7.5, tod, s=1.3, col='#6a8a3a')
    cv_bush(11.5, 8.6, tod, s=1.2, col='#c88a2a')
    for x in (-1.5, 0.5, 2.5):
        stand(x, 3.6)
    paint_sun(azimuth=-30, elevation=45 if tod == 'day' else 28, energy=4.0 if tod == 'day' else 1.6)
    if tod == 'night':
        point('GateLight', (0, 6.0, 4.5), 1200, '#ffd9a0', radius=0.5)
    tv_camera((0, -4.0, 1.9), (0, 16, 3.8), lens=24)


# ── the midway ────────────────────────────────────────────────────────
def cv_midway2(tod):
    paint_mode()
    lav_sky(tod, far_y=90)
    ground_plane(N('#6a5e3a', tod), N('#4e4630', tod), mottle=0.35)
    pine_wall(tod, 30, -60, 60, seed=13, h=(14, 20), s=1.6)
    coaster(-26, 6, 40, tod, seed=7)
    ferris(14, 38, 8, tod)
    pcyl('LightTower', 0.4, 12, (-16, 34, 6), '#c8303a', tod, verts=10)
    for k, (x, col, sign) in enumerate(((-11.0, '#3a5aa8', 'RING TOSS'), (-6.6, '#e8a0c8', 'COTTON CANDY'), (-2.2, '#c8303a', 'DUCK POND'), (2.2, '#4a9a5a', 'DARTS'),
                                        (6.6, '#e8a23a', 'HIGH STRIKER'), (11.0, '#7a5aa8', 'GUESS YOUR AGE'))):
        booth(x, 12.0, tod, col, sign, s=1.15)
    for k in range(3):
        string_lights((-13 + k * 9, 9.6, 4.8), (-4 + k * 9, 9.6, 4.8), n=16, sag=0.6, tod='night' if tod == 'night' else 'day')
    for x in (-13, -4, 5, 14):
        pcyl('LightPole', 0.07, 4.8, (x, 9.6, 2.4), '#3a3a42', tod, verts=8)
    wreck_bumper(-9.0, 5.5, tod, rot=20)
    striped('Popcorn', 0.5, 1.4, (4.0, 5.0, 0.7), '#c8303a', '#efe6d6', tod, n=5)
    pcyl('PopcornTop', 0.6, 0.5, (4.0, 5.0, 1.65), '#f2d27a', tod, r2=0.1)
    debris(tod, 2.0, 8.0, n=10, seed=17, x0=-12, x1=12)
    fog_wisps(tod, 4, 10, n=6, seed=18)
    for x in (-2.0, 0.5, 3.0):
        stand(x, 4.0)
    paint_sun(azimuth=-30, elevation=50 if tod == 'day' else 28, energy=4.0 if tod == 'day' else 1.6)
    tv_camera((0, -6.0, 2.2), (0, 16, 3.4), lens=24)


# ── the lake ──────────────────────────────────────────────────────────
def teal_lake(tod, y0, rocks=14, seed=0, shore='#8a8a7a'):
    box('Shore', (220, 40, 0.2), (0, y0 - 20, -0.1), pmat('LShore' + shore + tod, N(shore, tod), N(_mix_hex(shore, '#2a2a3a', 0.3), tod), mottle=0.3, mscale=0.3), bevel=0)
    water_plane(tod, y0=y0, col='#2e9a8a', far='#5ab8a8')
    box('LFoam', (220, 0.3, 0.02), (0, y0 + 0.15, -0.05), pmat('LFoam' + tod, N('#d8f0e8', tod), unlit=True, mottle=0), bevel=0)
    rnd = random.Random(seed)
    for i in range(rocks):
        x, y = rnd.uniform(-30, 30), rnd.uniform(y0 + 3, y0 + 40)
        s = rnd.uniform(0.6, 1.8) * (1 + (y - y0) / 40)
        r = icorock(uid('LakeRock'), (s, s * 0.8, s * 0.5), (x, y, 0.0), N('#6a6a6a', tod), seed=i, rot_z=rnd.random() * 90)
        r.data.materials.clear(); r.data.materials.append(pmat('LakeRockL' + tod, N('#6a6e6a', tod), N('#3a3e4a', tod), mottle=0.3)); r['ink'] = 1


def cv_rocky_beach2(tod):
    paint_mode()
    lav_sky(tod, far_y=90)
    teal_lake(tod, y0=7, rocks=18, seed=52, shore='#8a8a7a')
    rnd = random.Random(3)
    for i in range(10):
        s = rnd.uniform(0.6, 1.6)
        r = icorock(uid('ShoreRock'), (s * 1.3, s, s * 0.7), (rnd.uniform(-12, 12), rnd.uniform(1, 6), 0.1), N('#7a7a72', tod), seed=i + 20, rot_z=rnd.random() * 90)
        r.data.materials.clear(); r.data.materials.append(pmat('ShoreRockC' + tod, N('#7a7a72', tod), N('#4a4a52', tod), mottle=0.3)); r['ink'] = 1
    far_carnival(tod, y=80, x=12)
    for x in (-11, 11.5):
        mossy_pine(x, 3, 14, tod, seed=int(x), s=1.5)
    pcyl('Driftwood', 0.22, 3.2, (-3.5, 3.8, 0.2), '#c8b48a', tod, verts=10, rot=(0, 90, 20))
    for x in (-2.0, 0.5, 3.0):
        stand(x, 2.6)
    paint_sun(azimuth=-40, elevation=42 if tod == 'day' else 28, energy=4.0 if tod == 'day' else 1.6)
    tv_camera((0, -5.5, 2.0), (0, 14, 1.6), lens=26)


def cv_lake_shore2(tod):
    paint_mode()
    lav_sky(tod, far_y=90)
    teal_lake(tod, y0=6.5, rocks=12, seed=61, shore='#7a7a4a')
    brush_patch('Mud', 4.0, (0, 4.6), N('#6a6a3a', tod), sx=2.0, sy=0.6, seed=9)
    for i in range(16):
        rnd = random.Random(i)
        x = -7 + rnd.random() * 3 if i < 8 else 4.5 + rnd.random() * 3
        pcyl('Reed', 0.03, 1.2 + rnd.random() * 0.6, (x, 6.0 + rnd.random() * 0.8, 0.6), '#6a8a3a', tod, verts=6, rot=(rnd.uniform(-8, 8), rnd.uniform(-8, 8), 0), ink=False)
    plank_floor('SmallDock', (1.6, 6, 0.25), (2.0, 9.2, 0.3), '#8a6440', tod, axis='y', step=0.4)
    for yy in (7.5, 10.0, 12.0):
        for xx in (1.3, 2.7):
            pcyl('Piling', 0.1, 1.4, (xx, yy, -0.2), '#6b4a2e', tod, verts=10)
    pbox('RowBoat', (1.0, 2.6, 0.4), (4.4, 11.0, 0.05), '#3f7a8a', tod, rot=(0, 0, 15))
    # the trial platforms out on the water, with their clown posts (Lake_Challenge_Ep17)
    for (x, c) in ((-12, '#c8303a'), (14, '#3a6ab8')):
        pbox('Raft', (4.0, 3.0, 0.4), (x, 26, 0.1), '#7a5232', tod)
        pbox('ClownPost', (1.2, 1.0, 3.0), (x, 26.5, 1.8), '#6a3a5a', tod)
        card(uid('ClownTop'), _blob_pts(0.8, 0.8, 16, 0, 0), 25.9, pmat('ClownTop' + c + tod, N(c, tod), unlit=True, mottle=0), x=x, z=3.8)
        card(uid('ClownFaceL'), _blob_pts(0.55, 0.55, 14, 0, 0), 25.85, pmat('ClownFaceL' + tod, N('#f2ece0', tod), unlit=True, mottle=0), x=x, z=3.8)
    for x in (-10.5, 11):
        mossy_pine(x, 3, 13, tod, seed=int(x) + 3, s=1.5)
    for x in (-2.5, 0.0, 2.5):
        stand(x, 2.6)
    paint_sun(azimuth=-35, elevation=40 if tod == 'day' else 28, energy=4.0 if tod == 'day' else 1.6)
    tv_camera((0, -5.0, 2.0), (0, 14, 1.5), lens=26)


SCENES['carnival'].update({
    'haunted-mansion': cv_haunted2, 'corn-maze': cv_corn_maze2, 'carnival-entrance': cv_entrance2, 'midway': cv_midway2,
    'rocky-beach': cv_rocky_beach2, 'lake-shore': cv_lake_shore2,
    # the plain team shelter and campsite are the Blue team's (the first plates were this camp, drawn plainer)
    'campsite': lambda tod: cv_campsite_t1(tod), 'shelter': lambda tod: cv_shelter_t1(tod),
})

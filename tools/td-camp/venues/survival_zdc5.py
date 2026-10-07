# ══════════════════════════════════════════════════════════════════════
# venues/survival_zdc5.py — Soluna's places copied from Disventure Camp 5's own frames
# ══════════════════════════════════════════════════════════════════════
# Built from the DC5 episode galleries on the Disventure Camp wiki (and the stills the user sent):
#   jungle-trail   Bamboo_grove: walls of bamboo in three depths against misty teal hills, a mint sky,
#                  ferns and round yellow, teal and red-leaved plants along its foot, flat rocks, dark
#                  stalks framing the shot
#   confessional   Confessional_Soluna (day) and the same spot at night: a carved stump in front of a
#                  waterfall between grey cliffs, palms, vines and a string of lights with purple flags,
#                  hibiscus in the foreground
#   ceremony       DC5_Elimination_Trial_Area: a deck under the treehouse village, a diamond fire pit
#                  with a gold rim, leaf-wrapped torches, tall tiki statues hung with flowers, a row of
#                  tiki-pot seats, the volcano behind, a crescent moon
#   voting-booth   DC5_Voting_Confessional: the tiki urn on its striped counter with the sun emblem
#   exit           "One final choice": the forked signpost in the night jungle, left to the Motel,
#                  right to Rescue Island
#   ruins          Ruins_exterior: the stone wall with its great tiki-face gate, palms, dome trees
#   cave           Soluna_Cave: a cave mouth looking out on a pink plain, carved tikis on the wall

def sol_sky(tod, top=None, low=None, span=0.3):
    P = SOL[tod]
    paint_sky(top or P['sky'], low or P['sky_low'], span=span)


def mint_hills(tod, y=60, cols=('#5ab8a0', '#4aa890', '#7ac8b0')):
    for k, c in enumerate(cols):
        ridge_card(y + 20 - k * 8, -160, 160, 0, 10 - k * 2.5, N(c, tod), seed=60 + k, humps=5 + k)


def string_flags(x0, x1, y, z, tod, n=14, sag=0.9, flag='#8a5ac8'):
    for i in range(n):
        t = (i + 0.5) / n; x = x0 + (x1 - x0) * t; zz = z - sag * 4 * t * (1 - t)
        if i % 2:
            card(uid('Flag'), [(-0.18, 0), (0.18, 0), (0.18, -0.5), (-0.18, -0.5)], y, pmat('FlagP' + flag + tod, N(flag, tod), unlit=True, mottle=0), x=x, z=zz)
        else:
            card(uid('Bulb'), _blob_pts(0.12, 0.12, 10, 0, 0), y, pmat('BulbY', '#fff2a8', unlit=True, mottle=0), x=x, z=zz - 0.1)
    pbox('FlagLine', (x1 - x0, 0.02, 0.02), ((x0 + x1) / 2, y + 0.01, z - sag * 0.9), '#2a2a2a', tod, ink=False)


def carved_stump(x, y, tod, s=1.0):
    """The confessional seat: a stump carved with round holes."""
    pcyl('Stump', 0.6 * s, 0.9 * s, (x, y, 0.45 * s), '#b8743a', tod, verts=14)
    pcyl('StumpTop', 0.58 * s, 0.03, (x, y, 0.91 * s), '#d8a060', tod, verts=14, ink=False)
    for (dx, dz, r) in ((-0.2, 0.45, 0.16), (0.22, 0.3, 0.1)):
        card(uid('StumpHole'), _blob_pts(r * s, r * s * 1.2, 12, 0, 0), y - 0.6 * s, pmat('StumpHole' + tod, N('#6a3a1a', tod), unlit=True, mottle=0), x=x + dx * s, z=dz * s)


# ── the bamboo jungle ─────────────────────────────────────────────────
def si_bamboo_jungle(tod):
    paint_mode()
    sol_sky(tod, top=N('#9ae0b0', tod), low=N('#d8f0b0', tod))
    mint_hills(tod, y=60)
    ground_plane(N('#7a9a3a', tod), N('#5a7a2a', tod), mottle=0.25)
    brush_patch('Path', 6, (0, 3.5), N('#8aa84a', tod), sx=2.4, sy=0.5, seed=4)
    for k, (y, c, h, n, s) in enumerate(((46, '#c8e8b0', (16, 22), 60, 2.0), (38, '#a8d890', (15, 21), 54, 2.0), (30, '#8ac860', (14, 19), 46, 2.0), (22, '#78b84a', (13, 18), 38, 2.0), (15, '#5aa03a', (12, 16), 26, 1.9))):
        bamboo_stand(-40, 40, y, tod, n=n, h=h, s=s, seed=k + 70, col=c)
    rnd = random.Random(12)
    for k in range(18):
        x = -16 + k * 1.9 + rnd.uniform(-0.4, 0.4)
        leaf_clump(x, 12 + rnd.uniform(-0.5, 0.8), tod, s=rnd.uniform(1.3, 1.9), seed=k + 3, flower=None)
    for k, (x, y, c) in enumerate(((-7, 11.0, '#d8c83a'), (-2, 11.4, '#3aa8a0'), (3, 11.2, '#c8e04a'), (7, 11.6, '#3aa8a0'), (-10, 11.4, '#e84a6a'), (10, 11.0, '#e84a6a'))):
        for j in range(3):
            card(uid('RoundLeaf'), _blob_pts(0.32, 0.36, 12, 0.05, k * 3 + j), y - 0.02 * j, pmat('RoundLeaf' + c + tod, N(c, tod), unlit=True, mottle=0),
                 x=x - 0.3 + j * 0.3, z=0.5 + (j % 2) * 0.35)
    for k, (x, y) in enumerate(((-8.5, 10.5), (-1.5, 10.6), (5.5, 10.5))):
        flat_stone(x, y, tod, s=0.9, seed=k + 70)
    # dark stalks framing the shot, close to the camera
    for x in (-4.0, -3.5, 3.6, 4.1):
        bamboo_stand(x - 0.05, x + 0.05, 0.8, tod, n=1, h=(12, 13), s=1.2, seed=int(x * 10) + 90, col='#24503a')
    for x in (-1.5, 1.0, 3.5):
        stand(x, 4.0)
    paint_sun(azimuth=-30, elevation=50 if tod == 'day' else 30, energy=3.6 if tod == 'day' else 1.6)
    tv_camera((0, -6.0, 2.2), (0, 14, 3.4), lens=26)


# ── the confessional by the waterfall ─────────────────────────────────
def si_confessional_dc5(tod):
    paint_mode()
    sol_sky(tod)
    mint_hills(tod, y=60, cols=('#5aa890', '#4a9880', '#6ab8a0'))
    ground_plane(N('#5a8a32', tod), N('#4a7a2a', tod), mottle=0.3)
    # the grey cliffs either side of the fall, the fall itself, its pool
    for (x0, x1, h, c) in ((-14, -1.6, 6.5, '#7a8888'), (1.6, 14, 6.0, '#8a9898')):
        card(uid('Cliff'), [(x0, 0), (x1, 0), (x1, h * 0.95), (x1 - 1.2, h), ((x0 + x1) / 2, h * 1.05), (x0, h * 0.9)], 14, pmat('CliffC' + c + tod, N(c, tod), unlit=True, mottle=0.25), z=0)
        for k in range(4):
            card(uid('CliffLine'), [(-0.05, 0), (0.05, 0), (0.05, h * 0.6), (-0.05, h * 0.6)], 13.95, pmat('CliffLine' + tod, N('#5a6868', tod), unlit=True, mottle=0), x=x0 + (x1 - x0) * (k + 0.5) / 4, z=h * 0.2)
        card(uid('CliffTop'), _blob_pts((x1 - x0) / 2, 0.8, 18, 0.15, int(x0), flat_bottom=True), 13.9, pmat('CliffTopC' + tod, N('#3a8a3a', tod), unlit=True, mottle=0.2), x=(x0 + x1) / 2, z=h * 0.93)
    card(uid('Fall'), [(-1.7, 0), (1.7, 0), (1.6, 6.4), (-1.6, 6.4)], 14.1, pmat('FallC' + tod, N('#7ac8e0', tod), unlit=True, mottle=0), z=0)
    for k in range(6):
        card(uid('FallStreak'), [(-0.05, 0), (0.05, 0), (0.05, 6.0), (-0.05, 6.0)], 14.05, pmat('FallStreakC' + tod, N('#d8f4ff', tod), unlit=True, mottle=0), x=-1.3 + k * 0.5, z=0.3)
    card(uid('FallMist'), _blob_pts(3.0, 0.8, 18, 0.3, 4), 13.0, pmat('FallMist' + tod, N('#e8f8ff', tod), unlit=True, mottle=0, alpha=0.7), z=0.2)
    for k, (x, y, h, lean) in enumerate(((-3.6, 11.5, 6.5, 8), (3.4, 11.0, 6.0, -10), (5.4, 12.0, 7.0, 6))):
        sol_palm(x, y, h, tod, lean=lean, seed=k + 120, s=1.0)
    # dark jungle on the left, hanging vines, the light string with purple flags across the top
    for k in range(4):
        bamboo_stand(-7.8 + k * 0.5, -7.6 + k * 0.5, 7.5, tod, n=1, h=(9, 11), s=1.2, seed=k + 130, col='#2f5a3a')
    dome_tree(-6.5, 9.0, 6.0, tod, col='#2f6a3a', s=1.5, seed=140)
    vm = pmat('VineC' + tod, N('#1f3a2a', tod), unlit=True, mottle=0)
    for (x0, z0, x1, z1) in ((-6.0, 6.8, 2.0, 7.2), (1.0, 7.4, 6.5, 6.4)):
        pts = [(x0 + (x1 - x0) * t / 12, z0 + (z1 - z0) * t / 12 - 1.2 * math.sin(math.pi * t / 12)) for t in range(13)]
        card(uid('Vine'), pts + [(x, z + 0.12) for x, z in reversed(pts)], 5.0, vm)
    string_flags(-6.0, 6.0, 4.9, 6.8, tod, n=16, sag=0.7)
    # hibiscus and the big dark leaves in front, the stump
    for k, (x, c) in enumerate(((-4.4, '#e84a4a'), (-3.6, '#f2843a'), (-4.0, '#e8843a'))):
        hibiscus(x, 2.0, 0.8 + k * 0.35, tod, col=c, s=1.5)
    leaf_clump(-4.8, 2.4, tod, s=1.8, seed=33)
    leafy_plant(3.6, 2.2, tod, s=1.8, seed=55, col=N('#4a2a6a', tod))
    for k, (x, c) in enumerate(((2.4, '#3a6ab8'), (2.8, '#3a8ad8'))):
        hibiscus(x, 2.8, 0.4 + k * 0.3, tod, col=c, s=1.0)
    carved_stump(-1.8, 3.6, tod, s=1.0)
    stand(-1.8, 3.6)
    stand(0.8, 3.4)
    if tod == 'night':
        point('ConfLight', (0, 2.0, 3.0), 900, '#fff0c8', radius=0.5)
    paint_sun(azimuth=-30, elevation=50 if tod == 'day' else 30, energy=3.6 if tod == 'day' else 1.6)
    tv_camera((0, -6.5, 1.8), (0, 14, 3.4), lens=26)


# ── the Elimination Trial ─────────────────────────────────────────────
def leaf_torch(x, y, h, tod, lit=True):
    """DC5's torch: a dark cup on a pole wrapped in big green leaves tied with a purple band."""
    pcyl('TorchPole', 0.1, h, (x, y, h / 2), '#5a3a22', tod, verts=8)
    pcyl('TorchCup', 0.42, 0.7, (x, y, h + 0.1), '#4a2a1a', tod, r2=0.3, verts=10)
    for k in range(7):
        a = k / 7 * 2 * math.pi
        lf = card(uid('TorchLeaf'), [(0, 0), (0.18, 0.5), (0, 1.3), (-0.18, 0.5)], y - 0.3 + math.sin(a) * 0.2, pmat('TorchLeaf' + tod, N('#5aa83a' if k % 2 else '#3a8a2a', tod), unlit=True, mottle=0),
                  x=x + math.cos(a) * 0.3, z=h - 1.4)
        lf.rotation_euler = (0, math.radians(180 + (k - 3) * 14), 0)
    pcyl('TorchBand', 0.32, 0.18, (x, y, h - 0.4), '#7a3a9a', tod, verts=10)
    if lit:
        flame(x, y - 0.1, h + 0.45, 1.0)


def tall_tiki_statue(x, y, h, tod, col='#c8903a', s=1.0, angry=True):
    """A tall tapering tiki statue (Elimination_Trial_Area): a slanted brow, white eyes, square teeth."""
    w = 1.0 * s
    card(uid('Statue'), [(-w, 0), (w, 0), (w * 0.55, h), (-w * 0.55, h)], y, pmat('Statue' + col + tod, N(col, tod), unlit=True, mottle=0.2), x=x)
    card(uid('StatueSh'), [(0, 0), (w, 0), (w * 0.55, h), (0, h)], y - 0.01, pmat('StatueSh' + col + tod, N(_mix_hex(col, '#2a1a1a', 0.25), tod), unlit=True, mottle=0), x=x)
    for sd in (-1, 1):
        card(uid('StatueEye'), [(-0.3 * s, 0), (0.3 * s, 0.15 * s if angry else 0), (0.3 * s, 0.35 * s), (-0.3 * s, 0.35 * s)] if sd > 0 else
             [(-0.3 * s, 0.15 * s if angry else 0), (0.3 * s, 0), (0.3 * s, 0.35 * s), (-0.3 * s, 0.35 * s)], y - 0.02,
             pmat('StatueEye' + tod, N('#f6f2e2', tod), unlit=True, mottle=0), x=x + sd * 0.35 * s, z=h * 0.62)
    card(uid('StatueMouth'), [(-0.55 * s, 0), (0.55 * s, 0), (0.45 * s, -0.55 * s), (-0.45 * s, -0.55 * s)], y - 0.02, pmat('StatueMouth' + tod, N('#3a1a10', tod), unlit=True, mottle=0), x=x, z=h * 0.42)
    for k in range(4):
        card(uid('StatueTooth'), [(-0.1 * s, 0), (0.1 * s, 0), (0.1 * s, -0.22 * s), (-0.1 * s, -0.22 * s)], y - 0.03, pmat('StatueTooth', '#f6f2e2', unlit=True, mottle=0), x=x - 0.33 * s + k * 0.22 * s, z=h * 0.42)


def treehouse(x, y, s, tod, lit=True):
    """A hut of the treehouse village behind the trial area: a thatch cone on a round wall on stilts, its windows lit."""
    pcyl('THWall', 1.4 * s, 1.6 * s, (x, y, 3.0 * s), '#5a4a6a', tod, verts=12)
    pcyl('THRoof', 1.9 * s, 2.0 * s, (x, y, 4.8 * s), '#3a3050', tod, r2=0.1, verts=12)
    for sx in (-0.8, 0.8):
        pcyl('THStilt', 0.1 * s, 2.2 * s, (x + sx * s, y, 1.1 * s), '#3a2a3a', tod, verts=6)
    for sx in (-0.5, 0.5):
        card(uid('THWin'), [(-0.25 * s, 0), (0.25 * s, 0), (0.25 * s, 0.35 * s), (0, 0.55 * s), (-0.25 * s, 0.35 * s)], y - 1.42 * s,
             pmat('THWin' + str(lit), '#ffd86a' if lit else '#2a2a3a', unlit=True, mottle=0), x=x + sx * s, z=2.7 * s)


def si_ceremony_dc5(tod):
    paint_mode(); tod = 'night'
    sol_sky(tod)
    card(uid('Moon'), [(math.cos(a / 30 * 6.28) * 3, math.sin(a / 30 * 6.28) * 3) for a in range(30)], 120, pmat('MoonT', '#f2d8a8', unlit=True, mottle=0), x=-14, z=34)
    card(uid('MoonCut'), [(math.cos(a / 30 * 6.28) * 2.7, math.sin(a / 30 * 6.28) * 2.7) for a in range(30)], 119.9, pmat('MoonCutT', SOL['night']['sky'], unlit=True, mottle=0), x=-12.8, z=34.8)
    card(uid('VolcanoSil'), [(-22, 0), (-6, 26), (-2, 28), (2, 26), (18, 0)], 90, pmat('VolcanoSil', '#2a3a5a', unlit=True, mottle=0), x=2, z=0)
    for k, c in enumerate(('#24304e', '#1e2a44')):
        ridge_card(70 - k * 10, -120, 120, 0, 12 - k * 3, c, seed=80 + k, humps=8)
    rnd = random.Random(21)
    for k in range(9):
        treehouse(-26 + k * 6.5 + rnd.uniform(-1, 1), 42 + rnd.uniform(-3, 3), rnd.uniform(1.0, 1.4), tod)
    for k in range(12):
        dome_tree(-30 + k * 5.2, 36 + rnd.uniform(0, 4), rnd.uniform(5, 8), tod, col='#22403a', s=1.3, seed=k + 200, vines=False)
    # the deck, its bamboo rail, the diamond fire pit with its gold rim
    plank_floor('Deck', (40, 24, 0.3), (0, 12, -0.15), '#5a3a22', tod, axis='x', step=1.2, seam='#3a2416')
    for x in range(-18, 19, 2):
        pbox('Rail', (0.15, 0.15, 1.5), (x, 22.5, 0.75), '#6a4a2a', tod)
    pbox('RailBar', (38, 0.12, 0.12), (0, 22.5, 1.2), '#6a4a2a', tod)
    for k, (a, b2, c) in enumerate(((7.5, 4.4, '#7a4a28'), (5.6, 3.3, '#a8642a'), (3.2, 1.9, '#c8843a'))):
        me = bpy.data.meshes.new('Diamond'); bm = bmesh.new()
        vs = [bm.verts.new(p) for p in ((0, 9.5 - b2, 0.02 + k * 0.01), (a, 9.5, 0.02 + k * 0.01), (0, 9.5 + b2, 0.02 + k * 0.01), (-a, 9.5, 0.02 + k * 0.01))]
        bm.faces.new(vs); bm.to_mesh(me); bm.free()
        ob = _link(bpy.data.objects.new(uid('Diamond'), me)); me.materials.append(pmat('DiamondT' + c, c, _mix_hex(c, '#3a1a0a', 0.3), mottle=0.25, mscale=0.6))
    for k in range(8):
        a = k / 8 * 2 * math.pi
        pbox('PitRim', (0.9, 0.3, 0.12), (math.cos(a) * 1.7, 9.5 + math.sin(a) * 1.1, 0.1), '#d8a83a', 'day', rot=(0, 0, math.degrees(a) + 90))
    for k in range(10):
        a = k / 10 * 2 * math.pi
        si_rock('PitStone', (0.35, 0.3, 0.3), (math.cos(a) * 1.25, 9.5 + math.sin(a) * 0.8, 0.2), tod, col='#6a6a6a', seed=k + 300)
    flame(0, 9.4, 0.3, 1.7)
    point('TrialFire', (0, 8.0, 1.8), 3600, '#ffa04a', radius=0.6)
    # the tiki-pot seats in two banks, flowered statues, torches
    for side, x0 in ((-1, -13.0), (1, 4.5)):
        for r in range(2):
            for k in range(6):
                x = x0 + k * 1.45 + r * 0.6; y = 12.5 + r * 1.6
                pcyl('PotSeat', 0.55, 0.85, (x, y, 0.42), '#c8943a', tod, r2=0.45, verts=12)
                card(uid('PotFace'), [(-0.3, 0), (0.3, 0), (0.24, -0.2), (-0.24, -0.2)], y - 0.56, pmat('PotFace' + tod, N('#5a3a1a', tod), unlit=True, mottle=0), x=x, z=0.55)
                seat(x, y, 0.88)
    tall_tiki_statue(-10.5, 17.5, 5.5, tod, col='#c8903a', s=1.1)
    tall_tiki_statue(-3.2, 18.0, 4.2, tod, col='#a8743a', s=0.9, angry=False)
    tall_tiki_statue(9.5, 17.0, 3.0, tod, col='#b8843a', s=0.8)
    for (x, y) in ((-10.5, 17.0), (-3.2, 17.5)):
        hibiscus(x - 0.3, y - 0.2, 4.0, tod, col='#e84a8a', s=1.2)
    for (x, y) in ((-12, 6), (12, 6), (-6, 20), (6, 20), (-15, 20), (15, 20)):
        leaf_torch(x, y, 3.2, tod)
    for (x, y) in ((-4.6, -2.0), (4.6, -2.0)):
        leaf_torch(x, y, 5.0, tod)
    pbox('Podium', (2.0, 1.0, 1.5), (5.5, 18.5, 0.75), '#8a5a2a', tod)
    mark('host', (5.5, 18.5, 1.5))
    paint_sun(azimuth=-30, elevation=30, energy=1.6)
    tv_camera((0, -9.0, 5.0), (0, 13, 1.6), lens=26)


# ── the voting booth ──────────────────────────────────────────────────
def si_voting_booth(tod):
    paint_mode(); tod = 'night'
    sol_sky(tod)
    card(uid('Moon'), [(math.cos(a / 30 * 6.28) * 2.4, math.sin(a / 30 * 6.28) * 2.4) for a in range(30)], 60, pmat('MoonV', '#f2d8a8', unlit=True, mottle=0), x=3.5, z=12)
    card(uid('MoonCut'), [(math.cos(a / 30 * 6.28) * 2.2, math.sin(a / 30 * 6.28) * 2.2) for a in range(30)], 59.9, pmat('MoonCutV', SOL['night']['sky'], unlit=True, mottle=0), x=4.6, z=12.6)
    for k, c in enumerate(('#24304e', '#1e2a44')):
        ridge_card(50 - k * 10, -80, 80, 0, 8 - k * 2, c, seed=90 + k, humps=6)
    for k in range(8):
        dome_tree(-14 + k * 4, 26, 5, tod, col='#22403a', s=1.2, seed=k + 210, vines=False)
    for x in range(-8, 9, 1):
        pbox('Rail', (0.12, 0.12, 1.3), (x, 6.5, 0.65), '#5a3a22', tod)
    for z in (0.6, 1.2):
        pbox('RailBar', (17, 0.1, 0.1), (0, 6.5, z), '#5a3a22', tod, rot=(0, 3, 0))
    # the counter: wood with a band of purple and gold, the sun emblem
    pbox('Counter', (4.6, 1.4, 1.4), (0, 3.0, 0.7), '#c8843a', tod, shade='#8a5a2a')
    pbox('CounterTop', (4.9, 1.6, 0.18), (0, 3.0, 1.45), '#a86a32', tod)
    for k in range(9):
        pbox('Band', (0.5, 0.05, 0.3), (-2.0 + k * 0.5, 2.27, 1.05), '#7a3a9a' if k % 2 else '#e8c23a', tod, ink=False)
    star_shape(uid('Sun'), (0, 2.24, 0.55), 0.35, N('#f2e2a0', tod))
    # the angry tiki urn
    pcyl('Urn', 0.55, 1.1, (0.0, 3.0, 2.1), '#a8642a', tod, r2=0.42, verts=16)
    pcyl('UrnLip', 0.45, 0.15, (0.0, 3.0, 2.72), '#7a4a1a', tod, verts=16)
    pcyl('UrnBand', 0.56, 0.14, (0.0, 3.0, 2.45), '#7a3a9a', tod, verts=16)
    for sd in (-1, 1):
        card(uid('UrnEye'), [(-0.18, 0), (0.18, 0.08 * sd * -1 if sd > 0 else 0.08), (0.18, 0.2), (-0.18, 0.2)], 2.43, pmat('UrnEye', '#f6f2e2', unlit=True, mottle=0), x=sd * 0.2, z=2.15)
    card(uid('UrnMouth'), [(-0.35, 0), (0.35, 0), (0.28, -0.25), (-0.28, -0.25)], 2.43, pmat('UrnMouth', '#2a1a10', unlit=True, mottle=0), z=1.95)
    for k in range(4):
        card(uid('UrnTooth'), [(-0.06, 0), (0.06, 0), (0.06, -0.12), (-0.06, -0.12)], 2.42, pmat('UrnTooth', '#f6f2e2', unlit=True, mottle=0), x=-0.2 + k * 0.13, z=1.95)
    card(uid('UrnGem'), _blob_pts(0.08, 0.08, 8, 0, 0), 2.42, pmat('UrnGem', '#f2d23a', unlit=True, mottle=0), z=2.48)
    for x in (-3.2, 3.2):
        leaf_torch(x, 2.6, 2.8, tod)
    stand(-0.2, 1.4)
    paint_sun(azimuth=-30, elevation=30, energy=1.6)
    tv_camera((0, -4.0, 2.0), (0, 8, 1.7), lens=26)


# ── the exit: one final choice ────────────────────────────────────────
def signpost(x, y, tod, s=1.0):
    pbox('SignPost', (0.35 * s, 0.35 * s, 3.6 * s), (x, y, 1.8 * s), '#5a2a22', tod)
    for (sd, z) in ((1, 3.1), (-1, 2.4)):
        pts = [(0, -0.35), (1.8 * sd, -0.35), (2.4 * sd, 0), (1.8 * sd, 0.35), (0, 0.35)]
        card(uid('Arrow'), [(px * s, pz * s) for px, pz in pts], y - 0.2, pmat('ArrowS' + tod, N('#6a2a22', tod), unlit=True, mottle=0.15), x=x, z=z * s)
    pbox('SignBox', (1.8 * s, 0.6 * s, 1.0 * s), (x, y - 0.1, 0.5 * s), '#4a2420', tod)
    vm = pmat('SignVine' + tod, N('#2a4a2a', tod), unlit=True, mottle=0)
    card(uid('SignVine'), [(0.1, 3.2), (0.4, 2.6), (0.3, 1.8), (0.35, 1.8), (0.45, 2.6), (0.15, 3.25)], y - 0.25, vm, x=x)


def si_exit_dc5(tod):
    paint_mode(); tod = 'night'
    paint_sky('#1e3a9a', '#2a50b8')
    srnd = random.Random(7)
    for i in range(80):
        card(uid('Star'), _blob_pts(0.08, 0.08, 6, 0, 0), 60, pmat('StarE', '#f4f0d8', unlit=True, mottle=0), x=srnd.uniform(-40, 40), z=srnd.uniform(8, 30))
    rnd = random.Random(31)
    for (cx, cz, cs) in ((-14, 14, 3.0), (6, 18, 2.6), (18, 12, 3.2)):
        curly_cloud(cx, 70, cz, cs, '#2a5ab8', '#1e3a8a')
    for k in range(9):
        dome_tree(-16 + k * 4.2, 20 + rnd.uniform(0, 3), rnd.uniform(5, 7), tod, col='#22403a', s=1.3, seed=k + 230, vines=True)
    ground_plane(N('#3a5a2a', tod), N('#2a4020', tod), mottle=0.3)
    brush_patch('Fork', 3, (0, 7), N('#6a5a3a', tod), sx=0.6, sy=2.2, seed=3)
    brush_patch('ForkL', 2, (-4, 12), N('#6a5a3a', tod), sx=1.6, sy=0.5, seed=4)
    brush_patch('ForkR', 2, (4, 12), N('#6a5a3a', tod), sx=1.6, sy=0.5, seed=5)
    signpost(0, 7.5, tod, s=1.5)
    pbox('Board', (2.6, 0.12, 1.6), (-3.6, 8.6, 1.6), '#7a3a22', tod, rot=(0, 0, 8))
    ptext('ONE FINAL CHOICE', (-3.6, 8.5, 2.1), 0.2, N('#f2e2c0', tod), rot=(90, 0, 8))
    for (x, y) in ((-1.6, 6.5), (2.2, 6.5)):
        leaf_torch(x, y, 2.6, tod)
    leaf_clump(-5.5, 4, tod, s=1.6, seed=41)
    leaf_clump(5.5, 4, tod, s=1.6, seed=42)
    stand(0.9, 11.0)
    stand(-2.6, 11.5)
    stand(-1.6, 12.5)
    paint_sun(azimuth=-30, elevation=30, energy=1.6)
    tv_camera((0.5, -2.5, 2.4), (0.2, 12, 2.0), lens=26)


# ── the ruins and the cave ────────────────────────────────────────────
def si_ruins(tod):
    paint_mode()
    sol_sky(tod)
    mint_hills(tod, y=60)
    ground_plane(N('#6a9a3a', tod), N('#5a7a2a', tod), mottle=0.3)
    rnd = random.Random(44)
    for k in range(14):
        dome_tree(-30 + k * 3.6 + rnd.uniform(-0.6, 0.6), 26 + rnd.uniform(0, 5), rnd.uniform(6, 9), tod, col=('#2f7a3e', '#3a8a3a', '#256a3a')[k % 3], s=rnd.uniform(1.3, 1.6), seed=k + 250)
    far_falls(-6, 36, 8, tod, w=1.0)
    # the stone wall and the great tiki-face gate
    stone = pmat('RuinStone' + tod, N('#9a9a8a', tod), N('#6a6a62', tod), mottle=0.3, mscale=1.2)
    for (x0, x1) in ((-1.0, 3.6), (7.6, 14.0)):
        ob = box(uid('RuinWall'), (x1 - x0, 1.4, 3.6), ((x0 + x1) / 2, 12, 1.8), stone, bevel=0); ob['ink'] = 1
        for k in range(int(x1 - x0)):
            box(uid('Mortar'), (0.04, 0.02, 3.6), (x0 + k + 0.5, 11.28, 1.8), pmat('Mortar', '#5a5a52', unlit=True, mottle=0), bevel=0)
        box(uid('MortarH'), (x1 - x0, 0.02, 0.04), ((x0 + x1) / 2, 11.28, 1.8), pmat('Mortar', '#5a5a52', unlit=True, mottle=0), bevel=0)
        card(uid('Moss'), _blob_pts((x1 - x0) * 0.3, 0.3, 14, 0.3, int(x0)), 11.25, pmat('RuinMoss' + tod, N('#4a8a3a', tod), unlit=True, mottle=0), x=(x0 + x1) / 2 - 0.5, z=3.4)
    gx = 5.6
    pbox('GateHead', (3.6, 1.6, 5.6), (gx, 12, 2.8), '#8a5a32', tod, shade='#5a3a1a')
    card(uid('GateBrow'), [(-1.8, 0), (1.8, 0), (1.6, 0.5), (-1.6, 0.5)], 11.18, pmat('GateBrow' + tod, N('#e8c23a', tod), unlit=True, mottle=0), x=gx, z=4.3)
    for sd in (-1, 1):
        card(uid('GateEye'), _blob_pts(0.55, 0.4, 16, 0, 0), 11.17, pmat('GateEye' + tod, N('#e8dcc0', tod), unlit=True, mottle=0), x=gx + sd * 0.8, z=3.7)
    card(uid('GateMouth'), [(-1.4, 0), (1.4, 0), (1.0, -2.6), (-1.0, -2.6)], 11.17, pmat('GateMouth' + tod, N('#c84a2a', tod), unlit=True, mottle=0), x=gx, z=2.8)
    card(uid('GateDark'), [(-0.9, 0), (0.9, 0), (0.7, -2.4), (-0.7, -2.4)], 11.16, pmat('GateDark' + tod, N('#2a2a20', tod), unlit=True, mottle=0), x=gx, z=2.6)
    for k in range(5):
        card(uid('GateTooth'), [(-0.18, 0), (0.18, 0), (0, -0.5)], 11.15, pmat('GateTooth' + tod, N('#f2ece0', tod), unlit=True, mottle=0), x=gx - 0.8 + k * 0.4, z=2.6)
    for sd in (-1, 1):
        card(uid('Tusk'), [(-0.18, 0), (0.18, 0), (0, 1.0)], 11.14, pmat('GateTooth' + tod, N('#f2ece0', tod), unlit=True, mottle=0), x=gx + sd * 0.7, z=0.1)
    pbox('GatePath', (3.0, 6.0, 0.05), (gx, 8.0, 0.02), '#8a8a7a', tod, ink=False)
    for k, (x, y, h, lean) in enumerate(((3.0, 10.4, 7, 14), (8.4, 10.6, 8, -12), (9.8, 11.2, 7, -20), (12, 10.5, 6.5, 10))):
        sol_palm(x, y, h, tod, lean=lean, seed=k + 260, s=1.2)
    for (x, y) in ((4.0, 10.6), (7.2, 10.6)):
        leaf_torch(x, y, 2.4, tod, lit=True)
    for k, (x, y) in enumerate(((-5, 6), (-1, 4.5), (11, 5))):
        flat_stone(x, y, tod, s=0.7, seed=k + 270)
    for x in (-1.0, 1.5, 4.0):
        stand(x, 4.2)
    paint_sun(azimuth=-30, elevation=50 if tod == 'day' else 30, energy=3.6 if tod == 'day' else 1.6)
    tv_camera((1.5, -5.0, 2.2), (2.5, 14, 2.8), lens=26)


def si_cave(tod):
    paint_mode()
    paint_sky('#7aa8c8', '#9ac8d8')
    W, D, H = 14.0, 6.0, 7.0
    # the view out of the mouth: a pink plain, purple hills, odd mushroom trees under a striped sky
    card(uid('OutSky'), [(-6, 0), (6, 0), (6, 6), (-6, 6)], D + 8, pmat('OutSky', '#7aa8c8', unlit=True, mottle=0), x=3.0, z=1.5)
    for k in range(4):
        card(uid('OutStripe'), [(-6, 0), (6, 0), (6, 0.4), (-6, 0.4)], D + 7.9, pmat('OutStripe', '#9ac8d8', unlit=True, mottle=0), x=3.0, z=4.0 + k * 0.9)
    card(uid('OutHills'), [(-6, 0), (-4, 1.6), (-1, 1.0), (2, 2.0), (5, 1.2), (6, 0)], D + 7.5, pmat('OutHills', '#a8486a', unlit=True, mottle=0), x=3.0, z=1.5)
    card(uid('OutPlain'), [(-6, 0), (6, 0), (6, 1.6), (-6, 1.6)], D + 7.4, pmat('OutPlain', '#e8a0b0', unlit=True, mottle=0.1), x=3.0, z=0)
    for k, (x, h, c) in enumerate(((0.5, 3.6, '#6a3a3a'), (4.5, 4.2, '#4a3a3a'), (7.0, 3.0, '#e8843a'))):
        card(uid('OutTrunk'), [(-0.08, 0), (0.08, 0), (0.06, h), (-0.06, h)], D + 7.3, pmat('OutTrunk', '#5a3a3a', unlit=True, mottle=0), x=x, z=1.2)
        card(uid('OutCap'), _blob_pts(0.8, 0.45, 14, 0.05, k, flat_bottom=True), D + 7.25, pmat('OutCap' + c, c, unlit=True, mottle=0), x=x, z=1.2 + h)
    # the cave: rock walls and roof with a jagged mouth on the right, vines, carved tikis on the left wall
    rock = pmat('CaveRock', '#6a6a5a', '#4a4a40', mottle=0.3, mscale=1.0)
    mouth = [(-3.0 + 3.0, 0.6), (-2.4 + 3.0, 3.6), (-1.0 + 3.0, 5.4), (1.4 + 3.0, 6.0), (3.6 + 3.0, 5.0), (4.6 + 3.0, 2.6), (4.8 + 3.0, 0.6)]
    back = [(-W / 2, 0), (W / 2, 0), (W / 2, H), (-W / 2, H)]
    card(uid('CaveBackL'), [(-W / 2, 0), (mouth[0][0], 0)] + mouth[:4] + [(mouth[3][0], H), (-W / 2, H)], D, rock)
    card(uid('CaveBackR'), [mouth[3], (mouth[3][0], H), (W / 2, H), (W / 2, 0), (mouth[-1][0], 0)] + mouth[-1:3:-1], D, rock)
    for k in range(6):
        x = mouth[1][0] + k * 0.9
        card(uid('Stalactite'), [(-0.25, 0), (0.25, 0), (0, -0.7)], D - 0.05, rock, x=x, z=5.9 - abs(k - 2.5) * 0.2)
    for sx in (-1, 1):
        pbox('CaveSide', (0.4, D, H), (sx * W / 2, D / 2, H / 2), '#5a5a4a', 'day', mottle=0.3, ink=False)
    c = pbox('CaveRoof', (W, D, 0.4), (0, D / 2, H), '#4a4a40', 'day', ink=False); c.visible_shadow = False
    pbox('CaveFloor', (W, D, 0.2), (0, D / 2, -0.1), '#6a6a4a', 'day', mottle=0.3)
    vm = pmat('CaveVine', '#3a6a2a', unlit=True, mottle=0)
    for k in range(7):
        x = -6 + k * 1.9; L = 1.5 + (k % 3) * 1.0
        card(uid('CaveVine'), [(x - 0.05, H), (x + 0.05, H), (x + 0.25, H - L), (x + 0.15, H - L)], D - 0.3, vm)
    for (x, c, mouthc) in ((-4.8, '#8a5a32', '#f2ece0'), (-3.2, '#c86a3a', '#f2ece0')):
        pbox('WallTiki', (1.3, 0.2, 2.2), (x, D - 0.2, 1.6), c, 'day')
        card(uid('WallTikiBrow'), [(-0.6, 0), (0.6, 0), (0.6, 0.2), (-0.6, 0.2)], D - 0.32, pmat('WTB', '#e8c23a', unlit=True, mottle=0), x=x, z=2.3)
        card(uid('WallTikiMouth'), [(-0.5, 0), (0.5, 0), (0.4, -0.4), (-0.4, -0.4)], D - 0.32, pmat('WTM' + mouthc, mouthc, unlit=True, mottle=0), x=x, z=1.3)
    for k, (x, y, s) in enumerate(((-1.0, 3.0, 0.8), (4.8, 2.6, 1.0), (-5.6, 2.0, 0.9))):
        r = icorock(uid('CaveBoulder'), (s * 1.2, s, s * 0.7), (x, y, 0.2), '#7a7a6a', seed=k + 280)
        r.data.materials.clear(); r.data.materials.append(pmat('CaveBoulder', '#8a8a7a', '#5a5a52', mottle=0.3)); r['ink'] = 1
    for x in (-1.5, 1.0, 3.0):
        stand(x, 2.0)
    room_light(azimuth=-30, elevation=50, energy=2.4)
    tv_camera((0.0, -3.0, 1.8), (0.8, D, 2.2), lens=22)


SCENES['survival-island'].update({
    'jungle-trail': si_bamboo_jungle, 'confessional': si_confessional_dc5, 'ceremony': si_ceremony_dc5,
    'voting-booth': si_voting_booth, 'exit': si_exit_dc5, 'ruins': si_ruins, 'cave': si_cave,
})
OUTDOOR['survival-island'] |= {'confessional', 'ruins', 'voting-booth'}

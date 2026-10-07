# ══════════════════════════════════════════════════════════════════════
# venues/carnival.py — Stawaki Carnival (Disventure Camp 4), painted the way the show paints it
# ══════════════════════════════════════════════════════════════════════
# js/camp-access.js 'carnival': campsite, shelter, forest-edge, rocky-beach, lake-shore,
# carnival-entrance, midway, trial-area, haunted-mansion, corn-maze, theater-tent, big-top.
# Reference: the Disventure Camp wiki's "Stawaki Carnival" plates — Blue_Campsite (a camp built
# from carnival junk under tall droopy pines and lavender hills), Stawaki_Carnival_-_Entrance,
# The_Midway, Big_Top_Tent, Theater_Interior, Haunted_Mansion, Corn_Maze, Stawaki_Carnival_-_
# Further_view_(Night), and the Elimination Trial (Stawaki_Carnival_-_Campfire, DC4_Trial_Area_
# Podium): a wooden deck at night, a clown podium and a clown urn, striped torches, star-painted
# drums to sit on, bunting and string lights. The loser takes the Boat of Losers. The show has no
# fixed confessional set; the carnival's photo booth stands in (a choice made here, not canon).

CV = {
    'day': {'sky': '#a8b0e0', 'sky_low': '#f2d8e0', 'hills': ('#a08ac0', '#7a68a0'), 'ground': '#7f7a3a', 'ground_sh': '#5e5a30', 'patch': '#6a6632',
            'pine': '#24343a', 'tuft': '#2a4a3a', 'cloud': '#f6eef8', 'rim': '#c8b8e0', 'lake': '#3a9ab8', 'lake_far': '#6ac0d8'},
    'night': {'sky': '#1c2452', 'sky_low': '#33407a', 'hills': ('#3a3a6a', '#2c2c58'), 'ground': '#3a3a30', 'ground_sh': '#2a2a2a', 'patch': '#30302a',
              'pine': '#121a24', 'tuft': '#16262a', 'cloud': '#4a5288', 'rim': '#33407a', 'lake': '#1a3a62', 'lake_far': '#2a5a8a'},
}


def cv_sky(tod, far_y=90, hills=True):
    P = CV[tod]
    paint_sky(P['sky'], P['sky_low'])
    if hills:
        ridge_card(far_y + 30, -160, 160, 6, 22, P['hills'][0], seed=21, humps=4, teeth=60, tooth_col=_mix_hex(P['hills'][0], '#1a1a3a', 0.12))
        ridge_card(far_y + 10, -160, 160, 2, 12, P['hills'][1], seed=22, humps=6, teeth=80, tooth_col=_mix_hex(P['hills'][1], '#1a1a3a', 0.12))
    if tod == 'day':
        for (cx, cz, cs) in ((-44, 46, 4.0), (16, 54, 3.2), (58, 42, 3.6)):
            curly_cloud(cx, far_y + 50, cz, cs, P['cloud'], P['rim'])
    else:
        card(uid('Moon'), [(math.cos(a / 30 * 6.28) * 3, math.sin(a / 30 * 6.28) * 3) for a in range(30)], far_y + 60, pmat('MoonC', '#f6eec0', unlit=True, mottle=0), x=-24, z=44)
        card(uid('MoonCut'), [(math.cos(a / 30 * 6.28) * 2.7, math.sin(a / 30 * 6.28) * 2.7) for a in range(30)], far_y + 59.9, pmat('MoonCutC', P['sky'], unlit=True, mottle=0), x=-22.6, z=45)
        rnd = random.Random(9)
        for i in range(60):
            card(uid('Star'), _blob_pts(0.18, 0.18, 8, 0, 0), far_y + 62, pmat('StarC', '#f4f0d8', unlit=True, mottle=0), x=rnd.uniform(-90, 90), z=rnd.uniform(14, 60))


def dc_pine(x, y, h, tod, seed=0, s=1.0):
    """The Disventure pine: a tall bare trunk, short branches, dark tufts of needles that droop at the tips."""
    P = CV[tod]; rnd = random.Random(seed)
    tm = pmat('DCTrunk' + tod, N('#5a3a2e', tod), unlit=True, mottle=0.2)
    card(uid('DTrunk'), [(-0.22 * s, 0), (0.22 * s, 0), (0.1 * s, h), (-0.1 * s, h)], y, tm, x=x)
    tf = pmat('DCTuft' + tod, P['tuft'], unlit=True, mottle=0.2)
    for k in range(4):
        zz = h * (0.62 + k * 0.11); w = (1.6 - k * 0.3) * s; sd = 1 if k % 2 else -1
        pts = [(-w, 0), (-w * 0.5, 0.25 * s), (0, 0.4 * s), (w * 0.5, 0.25 * s), (w, 0), (w * 1.1, -0.45 * s), (w * 0.75, -0.15 * s), (0, -0.2 * s), (-w * 0.75, -0.15 * s), (-w * 1.1, -0.45 * s)]
        card(uid('DTuft'), pts, y - 0.02 - k * 0.003, tf, x=x + sd * 0.2 * s, z=zz)
    card(uid('DTop'), [(-0.5 * s, 0), (0.5 * s, 0), (0, 1.2 * s)], y - 0.03, tf, x=x, z=h * 0.97)


def pine_wall(tod, y, x0=-60, x1=60, seed=3, h=(12, 18), gap=(2.4, 4.6), s=1.6):
    rnd = random.Random(seed)
    x = x0
    while x < x1:
        dc_pine(x, y + rnd.uniform(0, 4), rnd.uniform(*h), tod, seed=int(x * 7), s=s)
        x += rnd.uniform(*gap)


def striped(name, r, h, loc, colA, colB, tod, n=8, r2=None, rot=(0, 0, 0), ink=True, caps=True):
    """A cylinder or cone painted in vertical stripes, the canvas of every carnival tent."""
    me = bpy.data.meshes.new(name); bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=caps, segments=n * 2, radius1=r, radius2=(r if r2 is None else r2), depth=h)
    bm.to_mesh(me); bm.free()
    ob = _link(bpy.data.objects.new(uid(name), me)); ob.location = loc; ob.rotation_euler = [math.radians(a) for a in rot]
    me.materials.append(pmat('Stripe' + colA + tod, N(colA, tod), mottle=0.25, mscale=1.2))
    me.materials.append(pmat('Stripe' + colB + tod, N(colB, tod), mottle=0.25, mscale=1.2))
    for i, p in enumerate(me.polygons):
        if len(p.vertices) == 4:
            p.material_index = i % 2
    if ink: ob['ink'] = 1
    return ob


def circus_tent(x, y, tod, r=4.0, h=3.0, roof=4.0, a='#b8303a', b='#efe6d6', flag='#b8303a'):
    striped('TentWall', r, h, (x, y, h / 2), a, b, tod, n=9)
    striped('TentRoof', r * 1.08, roof, (x, y, h + roof / 2), a, b, tod, n=9, r2=0.06)
    pcyl('TentPole', 0.05, 1.4, (x, y, h + roof + 0.5), '#3a3a40', tod, verts=8)
    card(uid('TentFlag'), [(0, 0), (0.9, -0.2), (0, -0.45)], y - 0.1, pmat('Flag' + flag + tod, N(flag, tod), unlit=True, mottle=0), x=x, z=h + roof + 1.15)


def bunting(p0, p1, tod, n=14, sag=0.6, cols=('#c8303a', '#efe6d6', '#3a5aa8', '#e8b03a')):
    for i in range(n):
        t = (i + 0.5) / n
        x = p0[0] + (p1[0] - p0[0]) * t; y = p0[1] + (p1[1] - p0[1]) * t
        z = p0[2] + (p1[2] - p0[2]) * t - sag * 4 * t * (1 - t)
        c = cols[i % len(cols)]
        card(uid('Bunting'), [(-0.22, 0), (0.22, 0), (0, -0.45)], y, pmat('Bunt' + c + tod, N(c, tod), unlit=True, mottle=0), x=x, z=z)
    pbox('BuntLine', (math.dist(p0, p1), 0.02, 0.02), ((p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2, (p0[2] + p1[2]) / 2 - sag * 0.9), '#2a2a2a', tod, ink=False)


def ferris(x, y, r, tod, lit=None, z=0.0):
    """The ferris wheel: a rim, spokes, little cars, an A-frame — flat, the way the show paints it in the distance."""
    lit = (tod == 'night') if lit is None else lit
    st = pmat('Ferris' + tod, N('#e8e0d4', tod), unlit=True, mottle=0)
    cz = z + r * 1.15
    for k in range(48):
        a0 = k / 48 * 2 * math.pi; a1 = (k + 1) / 48 * 2 * math.pi
        card(uid('Rim'), [(math.cos(a0) * r, math.sin(a0) * r), (math.cos(a1) * r, math.sin(a1) * r), (math.cos(a1) * (r - 0.2), math.sin(a1) * (r - 0.2)), (math.cos(a0) * (r - 0.2), math.sin(a0) * (r - 0.2))], y, st, x=x, z=cz)
    for k in range(12):
        a = k / 12 * 2 * math.pi
        ob = card(uid('Spoke'), [(0, -0.05), (r, -0.05), (r, 0.05), (0, 0.05)], y + 0.01, st, x=x, z=cz)
        ob.rotation_euler = (0, -a, 0)
        cols = ('#c8303a', '#3a5aa8', '#e8b03a', '#4a9a5a')
        card(uid('Car'), [(-0.45, -0.7), (0.45, -0.7), (0.5, 0), (-0.5, 0)], y - 0.02, pmat('Car' + cols[k % 4] + tod, N(cols[k % 4], tod), unlit=True, mottle=0),
             x=x + math.cos(a) * r, z=cz + math.sin(a) * r)
        if lit:
            card(uid('Bulb'), _blob_pts(0.15, 0.15, 8, 0, 0), y - 0.03, pmat('FBulb', '#ffd27a', unlit=True, mottle=0), x=x + math.cos(a + 0.26) * r, z=cz + math.sin(a + 0.26) * r)
    for sd in (-1, 1):
        ob = card(uid('Leg'), [(-0.18, 0), (0.18, 0), (0.12, r * 1.15), (-0.12, r * 1.15)], y + 0.02, st, x=x + sd * r * 0.35, z=z)
        ob.rotation_euler = (0, math.radians(sd * 16), 0)


def coaster(x0, x1, y, tod, base=0.0, seed=2):
    """A roller-coaster's silhouette: a wavy track on a lattice of supports."""
    rnd = random.Random(seed); m = pmat('Coaster' + tod, N('#d8cfc4', tod), unlit=True, mottle=0)
    pts = []; n = 60
    for i in range(n + 1):
        t = i / n; x = x0 + (x1 - x0) * t
        z = base + 6 + 4 * math.sin(t * 3 * math.pi + seed) + 2 * math.sin(t * 7 * math.pi)
        pts.append((x, z))
    for i in range(n):
        (xa, za), (xb, zb) = pts[i], pts[i + 1]
        card(uid('Track'), [(xa, za), (xb, zb), (xb, zb - 0.3), (xa, za - 0.3)], y, m)
        if i % 3 == 0:
            card(uid('Support'), [(xa - 0.08, base), (xa + 0.08, base), (xa + 0.08, za), (xa - 0.08, za)], y + 0.01, m)
            if i % 6 == 0 and i + 3 <= n:
                xb2, zb2 = pts[i + 3]
                card(uid('Brace'), [(xa, base + 0.5), (xa + 0.12, base + 0.5), (xb2 + 0.12, min(za, zb2) - 0.5), (xb2, min(za, zb2) - 0.5)], y + 0.01, m)


def cv_ground(tod, patches=True):
    P = CV[tod]
    ground_plane(P['ground'], P['ground_sh'], mottle=0.35)
    if patches:
        for k, (x, yy, r) in enumerate(((-5, 2, 3), (4, 6, 2.6), (-1, 10, 3.4), (7, 1, 2))):
            brush_patch('Patch', r, (x, yy), P['patch'], sx=1.5, sy=0.6, seed=k + 3, mottle=0.2)


def cv_bush(x, y, tod, s=1.0, col='#c88a2a'):
    card(uid('Bush'), _blob_pts(1.0 * s, 0.7 * s, 24, 0.2, int(x * 3), flat_bottom=True), y, pmat('CVBush' + col + tod, N(col, tod), unlit=True, mottle=0.4, mscale=3), x=x, z=0.6 * s)


def junk_tent(x, y, tod, rot_z=0, s=1.0):
    """The Blue team's tent: a blue cone roof with a scalloped trim, patched with a torn grid."""
    striped('BlueWall', 2.6 * s, 2.0 * s, (x, y, 1.0 * s), '#3a4a8a', '#2a3a72', tod, n=8)
    striped('BlueRoof', 2.9 * s, 3.4 * s, (x, y, 2.0 * s + 1.7 * s), '#3a5aa8', '#2a3a7a', tod, n=8, r2=0.05)
    for k in range(12):
        a = k / 12 * 2 * math.pi
        card(uid('Scallop'), _blob_pts(0.42 * s, 0.3 * s, 12, 0, 0), y - 2.6 * s * math.cos(0) * 0 + math.sin(a) * 2.9 * s - 0.01,
             pmat('Scallop' + tod, N('#2a3a7a', tod), unlit=True, mottle=0), x=x + math.cos(a) * 2.9 * s, z=2.0 * s)


def neon_arrow(x, y, z, tod, s=1.0):
    pts = [(-1.6, -0.3), (0.6, -0.3), (0.6, -0.7), (1.6, 0), (0.6, 0.7), (0.6, 0.3), (-1.6, 0.3)]
    card(uid('Arrow'), [(px * s, pz * s) for px, pz in pts], y, pmat('Arrow' + tod, N('#9a5ad8', tod), unlit=True, mottle=0.1), x=x, z=z)
    for k in range(8):
        card(uid('ArrowBulb'), _blob_pts(0.07 * s, 0.07 * s, 8, 0, 0), y - 0.02, pmat('ArrowBulb', '#ffe28a', unlit=True, mottle=0), x=x - 1.5 * s + k * 0.3 * s, z=z + 0.3 * s)


def ticket_booth(x, y, tod, rot_z=0, s=1.0):
    g = _group(uid('Booth'), (x, y, 0), rot_z)
    _child(g, pbox('BoothBody', (1.8 * s, 1.4 * s, 2.2 * s), (0, 0, 1.1 * s), '#efe6d6', tod))
    _child(g, pbox('BoothWin', (1.3 * s, 0.06, 0.9 * s), (0, -0.72 * s, 1.5 * s), '#8ad0e0', tod, mottle=0))
    for k in range(5):
        _child(g, pbox('BoothBand', (0.36 * s, 0.07, 0.6 * s), (-0.72 * s + k * 0.36 * s, -0.73 * s, 0.4 * s), '#c8303a' if k % 2 == 0 else '#efe6d6', tod, ink=False))
    _child(g, striped('BoothRoof', 1.2 * s, 0.6 * s, (0, 0, 2.5 * s), '#c8303a', '#efe6d6', tod, n=6, r2=0.9 * s))
    return g


def drum_seat(x, y, tod, a='#c8303a', b='#efe6d6'):
    """A circus drum to sit on: red with a white band and a gold star."""
    striped('Drum', 0.45, 0.6, (x, y, 0.3), a, b, tod, n=6)
    star_shape(uid('DrumStar'), (x, y - 0.46, 0.32), 0.14, N('#e8b03a', tod))


def stripe_torch(x, y, tod, h=2.6, lit=None):
    """The trial area's torch: a pole wrapped in red and blue ribbon, a woven cup, a flame."""
    lit = (tod == 'night') if lit is None else lit
    pcyl('TorchPole', 0.07, h, (x, y, h / 2), '#8a6a3a', tod)
    for k in range(5):
        pbox('Ribbon', (0.18, 0.18, 0.08), (x, y, 0.4 + k * h / 6), '#c8303a' if k % 2 else '#3a5aa8', tod, rot=(0, 25, 0), ink=False)
    pcyl('TorchCup', 0.22, 0.4, (x, y, h + 0.15), '#a8784a', tod, r2=0.14)
    if lit:
        flame(x, y - 0.05, h + 0.3, 0.42)
        point(uid('TorchLight'), (x, y - 0.4, h + 0.5), 320, '#ffae5a', radius=0.3)


def clown_podium(x, y, tod):
    """The trial podium (DC4_Trial_Area_Podium): a white drum with a blue ruff and a red nose, the clown urn on top."""
    pcyl('Podium', 0.8, 1.3, (x, y, 0.65), '#efeae0', tod, verts=24)
    for k in range(8):
        a = math.radians(-60 + k * 17)
        card(uid('Ruff'), [(0, 0), (0.55, 0.18), (0.55, -0.18)], y - 0.82, pmat('Ruff' + tod, N('#3a5ad8', tod), unlit=True, mottle=0), x=x + math.cos(a) * 0.2, z=1.3 + math.sin(a) * 0.1).rotation_euler = (0, -a + math.pi / 2, 0)
    card(uid('Nose'), _blob_pts(0.14, 0.14, 12, 0, 0), y - 0.82, pmat('Nose' + tod, N('#d8302a', tod), unlit=True, mottle=0), x=x, z=0.75)
    for sx in (-0.28, 0.28):
        card(uid('PodEye'), _blob_pts(0.16, 0.1, 12, 0, 0), y - 0.82, pmat('PodEye' + tod, N('#2a4ab8', tod), unlit=True, mottle=0), x=x + sx, z=1.0)
    pcyl('Urn', 0.4, 0.75, (x, y, 1.75), '#6a4a3a', tod, r2=0.32, verts=18)
    pcyl('UrnBand', 0.41, 0.12, (x, y, 1.55), '#e8b03a', tod, verts=18, ink=False)
    card(uid('UrnFace'), _blob_pts(0.24, 0.22, 16, 0, 0), y - 0.42, pmat('UrnFace', '#f6f0e4', unlit=True, mottle=0), x=x, z=1.82)
    card(uid('UrnNose'), _blob_pts(0.06, 0.06, 10, 0, 0), y - 0.43, pmat('Nose' + tod, N('#d8302a', tod), unlit=True, mottle=0), x=x, z=1.8)


def cv_campsite(tod):
    """The team campsite (Blue_Campsite): a camp built from carnival junk — the blue tent, a neon arrow, a ticket booth, a pirate flag, the fire."""
    paint_mode(); P = CV[tod]
    cv_sky(tod)
    cv_ground(tod)
    pine_wall(tod, 26, seed=4)
    pine_wall(tod, 16, -30, 30, seed=5, gap=(5, 9))
    junk_tent(-7.5, 8.5, tod)
    neon_arrow(-4.0, 6.0, 3.2, tod, s=1.2)
    flag = card(uid('Pirate'), [(0, 0), (1.6, 0.15), (1.5, -1.0), (0, -1.1)], 8.4, pmat('Pirate', '#1a1a22', unlit=True, mottle=0), x=-6.6, z=6.6)
    card(uid('Skull'), _blob_pts(0.25, 0.28, 12, 0, 0), 8.38, pmat('SkullW', '#efe6d6', unlit=True, mottle=0), x=-5.8, z=6.1)
    pcyl('FlagPole', 0.05, 3.4, (-6.6, 8.45, 5.0), '#6a6a72', tod, verts=8)
    ticket_booth(-3.6, 4.0, tod, rot_z=10)
    circus_tent(8.5, 12.0, tod, r=3.4, h=3.2, roof=3.0)
    g = _group('PurpleBooth', (2.6, 11.0, 0), 0)
    striped('PBooth', 0.8, 2.2, (2.6, 11.0, 1.1), '#7a5aa8', '#d8c8e8', tod, n=5)
    striped('PBoothRoof', 0.95, 1.2, (2.6, 11.0, 2.8), '#7a5aa8', '#d8c8e8', tod, n=5, r2=0.03)
    fire_pit(1.5, 4.5, tod, r=0.45, lit=True)
    for xx in (-0.4, 3.4):
        pcyl('LogSeat', 0.24, 1.6, (xx, 4.4, 0.24), '#7a4a32', tod, verts=10, rot=(0, 90, 0))
    for (x, yy, c) in ((6.0, 6.5, '#c88a2a'), (9.5, 7.5, '#3a7a5a'), (-10, 4, '#c88a2a')):
        cv_bush(x, yy, tod, s=1.2, col=c)
    for (x, yy) in ((-1.0, 1.0), (5.0, 2.5)):
        r = icorock(uid('Rock'), (0.45, 0.35, 0.25), (x, yy, 0.1), N('#8a8a8a', tod), seed=int(x))
        r.data.materials.clear(); r.data.materials.append(pmat('RockC' + tod, N('#8a8a8a', tod), mottle=0.3)); r['ink'] = 1
    paint_sun(azimuth=-30, elevation=45 if tod == 'day' else 28, energy=4.0 if tod == 'day' else 1.6)
    tv_camera((0, -6.0, 2.0), (0, 12, 2.4), lens=26)


def cv_shelter(tod):
    """The team shelter (Blue_Team_Interior): a plank shed under a scrap of striped tent, a cross-braced door, a wagon wheel, a team emblem."""
    paint_mode()
    W, D, H = 8.0, 6.0, 3.8
    painted_room(W, D, H, 'day', wall='#8a5a3a', floor='#7a5232', ceil='#5a3a2a', plank=0.45, wall_seam='#5a3a22', floor_seam='#4a3020')
    for k in range(6):
        pbox('Canvas', (W / 6, D * 0.6, 0.05), (-W / 2 + W / 12 + k * W / 6, D * 0.65, H - 0.2), '#c8303a' if k % 2 == 0 else '#efe6d6', 'day', rot=(-18, 0, 0), ink=False)
    pbox('Door', (1.6, 0.08, 2.6), (-2.4, D - 0.12, 1.3), '#7a5a3a', 'day')
    for sd in (-1, 1):
        pbox('Brace', (0.12, 0.06, 2.9), (-2.4, D - 0.17, 1.3), '#e8e0d0', 'day', rot=(0, sd * 30, 0))
    pbox('DoorFrame', (1.8, 0.06, 0.12), (-2.4, D - 0.17, 2.6), '#e8e0d0', 'day')
    card(uid('Emblem'), _blob_pts(0.6, 0.6, 24, 0.05, 2), D - 0.12, pmat('Emblem', '#3a8ad8', unlit=True, mottle=0.2), x=0.8, z=2.4)
    card(uid('EmblemIn'), _blob_pts(0.45, 0.45, 24, 0.05, 3), D - 0.13, pmat('EmblemIn', '#8a5a3a', unlit=True, mottle=0.2), x=0.8, z=2.4)
    for k in range(8):
        ob = card(uid('WheelSpoke'), [(0, -0.03), (0.55, -0.03), (0.55, 0.03), (0, 0.03)], D - 0.6, pmat('Spoke', '#5a3a22', unlit=True, mottle=0), x=1.8, z=0.9)
        ob.rotation_euler = (0, k * math.pi / 4, 0)
    card(uid('WheelRim'), _blob_pts(0.6, 0.6, 24, 0, 0), D - 0.58, pmat('Rim', '#6a4a2a', unlit=True, mottle=0), x=1.8, z=0.9)
    pbox('Counter', (2.0, 0.7, 0.9), (3.0, D - 0.6, 0.45), '#b8b8bc', 'day')
    pbox('Window', (1.4, 0.06, 0.9), (2.6, D - 0.12, 2.3), '#9ad0d8', 'day', unlit=True)
    for k, c in enumerate(('#e8b03a', '#3a8ad8', '#c8303a')):
        pbox('Bedroll', (0.8, 1.8, 0.15), (-2.5 + k * 1.6, 2.6, 0.08), c, 'day')
    room_light(azimuth=-30, elevation=60, energy=3.0)
    paint_sky('#c8b890', '#c8b890')
    tv_camera((0.0, -0.8, 1.8), (0, D, 1.5), lens=22)


def cv_forest(tod):
    paint_mode(); P = CV[tod]
    cv_sky(tod)
    cv_ground(tod)
    brush_patch('Needles', 3.5, (0, 4.0), '#6a5a32', sx=1.2, sy=0.6, seed=5)
    rnd = random.Random(41)
    for i in range(30):
        x = rnd.uniform(-16, 16); y = rnd.uniform(4, 32)
        if abs(x) < 2.0 and y < 14: continue
        dc_pine(x, y, rnd.uniform(9, 15), tod, seed=i, s=1.4)
    circus_tent(7, 38, tod, r=3.0, h=2.0, roof=3.0)
    ferris(-10, 46, 6, tod)
    for (x, yy, c) in ((-4, 6, '#c88a2a'), (4.5, 5.5, '#3a7a5a'), (-7, 3, '#3a7a5a')):
        cv_bush(x, yy, tod, s=1.1, col=c)
    pcyl('Stump', 0.35, 0.5, (1.4, 3.6, 0.25), '#7a4a32', tod, verts=10)
    pcyl('Log', 0.24, 1.8, (-1.2, 4.4, 0.24), '#6a4228', tod, verts=10, rot=(0, 90, 20))
    paint_sun(azimuth=-25, elevation=55 if tod == 'day' else 30, energy=4.0 if tod == 'day' else 1.6)
    tv_camera((0, -4.0, 1.8), (0, 14, 2.6), lens=26)


def lakeside(tod, lake_y=8, shore=None):
    P = CV[tod]
    box('Shore', (220, 40 + lake_y, 0.2), (0, (lake_y - 40) / 2, -0.1), pmat('ShoreC' + tod, shore or P['ground'], P['ground_sh'], mottle=0.35, mscale=0.3), bevel=0)
    water_plane(tod, y0=lake_y, col=P['lake'], far=P['lake_far'])


def far_carnival(tod, y=70, x=20):
    """Stawaki across the lake (Further_view): the ferris wheel, the coaster, tent peaks, lit at night."""
    ferris(x - 12, y + 4, 7, tod)
    coaster(x - 4, x + 26, y + 6, tod, seed=4)
    for k in range(5):
        circus_tent(x - 6 + k * 5, y, tod, r=1.6, h=1.0, roof=2.0, a=('#c8303a', '#3a5aa8')[k % 2])


def cv_rocky_beach(tod):
    paint_mode(); P = CV[tod]
    cv_sky(tod)
    lakeside(tod, lake_y=8, shore=N('#a89a86', tod))
    rnd = random.Random(52)
    for i in range(14):
        r = icorock(uid('Rock'), (0.4 + rnd.random() * 0.9, 0.4 + rnd.random() * 0.6, 0.3 + rnd.random() * 0.5), (rnd.uniform(-12, 12), rnd.uniform(1, 8.5), 0.05), N('#8e8a80', tod), seed=i, rot_z=rnd.random() * 90)
        r.data.materials.clear(); r.data.materials.append(pmat('RockC' + tod, N('#8e8a80', tod), N('#5a5a6a', tod), mottle=0.3)); r['ink'] = 1
    far_carnival(tod)
    pine_wall(tod, 60, -70, -10, seed=8, h=(10, 14))
    for x in (-10, 10.5):
        dc_pine(x, 3, 13, tod, seed=int(x), s=1.5)
    pcyl('Driftwood', 0.2, 3.0, (-3.5, 4.0, 0.18), '#c8b48a', tod, verts=10, rot=(0, 90, 20))
    paint_sun(azimuth=-40, elevation=42 if tod == 'day' else 28, energy=4.0 if tod == 'day' else 1.6)
    tv_camera((0, -5.5, 1.9), (0, 14, 1.4), lens=26)


def cv_lake_shore(tod):
    paint_mode(); P = CV[tod]
    cv_sky(tod)
    lakeside(tod, lake_y=7)
    brush_patch('Mud', 4.0, (0, 5.0), '#7a6a3a', sx=2.0, sy=0.6, seed=9)
    for i in range(14):
        rnd = random.Random(i)
        x = -6 + rnd.random() * 3 if i < 7 else 4 + rnd.random() * 3
        pcyl('Reed', 0.03, 1.2 + rnd.random() * 0.6, (x, 6.2 + rnd.random() * 0.8, 0.6), '#6a8a3a', tod, verts=6, rot=(rnd.uniform(-8, 8), rnd.uniform(-8, 8), 0), ink=False)
    plank_floor('SmallDock', (1.6, 6, 0.25), (2.5, 9.5, 0.3), '#8a6440', tod, axis='y', step=0.4)
    for yy in (7.5, 10.0, 12.5):
        for xx in (1.8, 3.2):
            pcyl('Piling', 0.1, 1.4, (xx, yy, -0.2), '#6b4a2e', tod, verts=10)
    pbox('RowBoat', (1.0, 2.6, 0.4), (4.8, 11.5, 0.05), '#3f7a8a', tod, rot=(0, 0, 15))
    far_carnival(tod, y=80, x=-10)
    for x in (-10, 10.5):
        dc_pine(x, 3, 13, tod, seed=int(x) + 3, s=1.5)
    paint_sun(azimuth=-35, elevation=40 if tod == 'day' else 28, energy=4.0 if tod == 'day' else 1.6)
    tv_camera((0, -5.0, 1.9), (0, 14, 1.2), lens=26)


def cv_entrance(tod):
    """The gate (Stawaki_Carnival_-_Entrance): the STAWAKI CARNIVAL arch on two striped towers, the ferris wheel, tents, the fence."""
    paint_mode(); P = CV[tod]
    cv_sky(tod)
    cv_ground(tod, patches=False)
    brush_patch('Path', 3.0, (0, 6), '#a89a6a', sx=0.9, sy=3.0, seed=5)
    pine_wall(tod, 44, seed=12, h=(10, 16))
    ferris(6, 30, 7, tod)
    coaster(-26, -6, 34, tod, seed=3)
    for k, (x, yy) in enumerate(((-9, 18), (-4, 22), (11, 20), (15, 16))):
        circus_tent(x, yy, tod, r=2.4, h=2.0, roof=2.6, a=('#c8303a', '#3a5aa8')[k % 2])
    for sx in (-3.2, 3.2):
        striped('GateTower', 0.55, 5.6, (sx, 9, 2.8), '#c8303a', '#efe6d6', tod, n=6)
        striped('GateCap', 0.75, 1.0, (sx, 9, 6.1), '#3a5aa8', '#efe6d6', tod, n=6, r2=0.05)
    me_pts = [(-4.2, 0), (4.2, 0), (4.0, 0.9), (2.5, 1.6), (0, 1.9), (-2.5, 1.6), (-4.0, 0.9)]
    card(uid('Arch'), me_pts, 8.7, pmat('Arch' + tod, N('#d8603a', tod), unlit=True, mottle=0.15), z=5.0)
    card(uid('ArchIn'), [(px * 0.92, pz * 0.86 + 0.08) for px, pz in me_pts], 8.68, pmat('ArchIn' + tod, N('#f2e2b0', tod), unlit=True, mottle=0.1), z=5.0)
    ptext('STAWAKI', (0, 8.62, 6.15), 0.62, N('#c8303a', tod))
    ptext('CARNIVAL', (0, 8.62, 5.45), 0.55, N('#c8303a', tod))
    for k in range(16):
        on = (k * 7) % 5 != 0
        card(uid('ArchBulb'), _blob_pts(0.08, 0.08, 8, 0, 0), 8.66, pmat('ArchBulb' + str(on), '#ffd27a' if on else '#7a6a50', unlit=True, mottle=0),
             x=-3.9 + k * 0.52, z=5.0 + 0.9 + 1.0 * math.sin((k / 15) * math.pi))
    for x in range(-14, 15, 1):
        if abs(x) < 4: continue
        pbox('Fence', (0.6, 0.12, 1.6 + (x % 3) * 0.15), (x, 9.2, 0.8), '#8a6a42', tod, ink=False)
    pbox('FenceRail', (30, 0.1, 0.12), (0, 9.1, 1.2), '#6a4a2a', tod)
    ticket_booth(-6.0, 6.0, tod, rot_z=15)
    neon_arrow(5.5, 8.0, 2.3, tod, s=0.8)
    cv_bush(8.5, 7.0, tod, s=1.1)
    paint_sun(azimuth=-30, elevation=45 if tod == 'day' else 28, energy=4.0 if tod == 'day' else 1.6)
    if tod == 'night':
        point('GateLight', (0, 6.0, 4.5), 1200, '#ffd9a0', radius=0.5)
    tv_camera((0, -4.0, 1.9), (0, 16, 3.4), lens=24)


def midway_stall(x, y, tod, col, sign, rot_z=0):
    g = _group(uid('Stall'), (x, y, 0), rot_z)
    def add(ob):
        _child(g, ob)
        return ob
    add(pbox('StallBack', (3.0, 0.15, 2.6), (0, 0.9, 1.3), _mix_hex(col, '#1a1a2a', 0.35), tod))
    for sx in (-1.45, 1.45):
        add(pbox('StallSide', (0.12, 1.9, 2.6), (sx, 0, 1.3), col, tod))
    add(pbox('Counter', (3.0, 0.5, 1.0), (0, -0.85, 0.5), col, tod))
    for i in range(6):
        add(pbox('Awning', (0.52, 1.4, 0.06), (-1.3 + i * 0.52, -0.6, 2.75), '#c8303a' if i % 2 == 0 else '#efe6d6', tod, rot=(-18, 0, 0), ink=False))
    add(pbox('SignBoard', (2.4, 0.1, 0.5), (0, -1.3, 3.2), '#f2e2b0', tod))
    t = ptext(sign, (0, 0, 0), 0.26, N('#8a2a1c', tod)); _child(g, t); t.location = (0, -1.36, 3.2)
    for i in range(5):
        pc = ('#e88aa8', '#8ad0ff', '#f2d27a', '#a8e08a', '#c8a0e8')[i]
        c = card(uid('Plush'), _blob_pts(0.2, 0.22, 12, 0, 0), 0, pmat('Plush' + pc + tod, N(pc, tod), unlit=True, mottle=0)); _child(g, c); c.location = (-1.0 + i * 0.5, 0.75, 1.8)
    if tod == 'night':
        point(uid('StallLight'), (x, y - 1.0, 2.5), 320, '#ffd9a0', radius=0.2)
    return g


def cv_midway(tod):
    """The midway (The_Midway): game stalls down both sides, cotton candy, strings of bulbs, the coaster and the wheel beyond."""
    paint_mode(); P = CV[tod]
    cv_sky(tod)
    cv_ground(tod, patches=False)
    brush_patch('Trodden', 4, (0, 8), '#6a5a3a', sx=0.9, sy=3.2, seed=4)
    pine_wall(tod, 46, seed=13, h=(12, 18))
    coaster(-30, 6, 36, tod, seed=7)
    ferris(10, 34, 8, tod)
    for i, (x, yy, col, sign) in enumerate(((-5.5, 4, '#3a5aa8', 'RING TOSS'), (-5.5, 9, '#4a9a5a', 'DUCK POND'), (-5.5, 14, '#e8a23a', 'HIGH STRIKER'),
                                          (5.5, 4.5, '#9a5ab8', 'DARTS'), (5.5, 9.5, '#c8303a', 'COTTON CANDY'), (5.5, 14.5, '#3a5aa8', 'GUESS YOUR AGE'))):
        midway_stall(x, yy, tod, col, sign, rot_z=90 if x < 0 else -90)
    for yy in (3, 8, 13, 18):
        string_lights((-4.0, yy, 3.8), (4.0, yy + 1.0, 3.8), n=18, sag=0.6, tod='night' if tod == 'night' else 'day')
        for x in (-4.0, 4.0):
            pcyl('LightPole', 0.06, 3.8, (x, yy + (1.0 if x > 0 else 0), 1.9), '#3a3a42', tod, verts=8)
    striped('Popcorn', 0.5, 1.4, (1.6, 2.0, 0.7), '#c8303a', '#efe6d6', tod, n=5)
    pcyl('PopcornTop', 0.6, 0.5, (1.6, 2.0, 1.65), '#f2d27a', tod, r2=0.1)
    for i in range(6):
        card(uid('Litter'), _blob_pts(0.1, 0.06, 8, 0.2, i), 3 + (i % 3) * 2, pmat('Litter', '#efe6d6', unlit=True, mottle=0), x=-2 + i * 0.8, z=0.04)
    paint_sun(azimuth=-30, elevation=50 if tod == 'day' else 28, energy=4.0 if tod == 'day' else 1.6)
    tv_camera((0, -4.0, 1.9), (0, 18, 2.8), lens=24)


def trial_deck(tod):
    """The Elimination Trial (Stawaki_Carnival_-_Campfire, DC4_Trial_Area_Podium): a wooden deck, the clown podium and urn,
    striped torches, star-painted drums and barrels to sit on, bunting and string lights, a spotlight, tents behind the fence."""
    lit = tod
    P = CV[tod]
    cv_sky(tod)
    cv_ground(tod, patches=False)
    pine_wall(tod, 30, seed=17, h=(12, 18))
    for k, x in enumerate((-9, -3, 8)):
        circus_tent(x, 20, tod, r=2.6, h=2.2, roof=2.6, a=('#c8303a', '#3a3a6a', '#c8303a')[k])
    plank_floor('Deck', (16, 10, 0.3), (0, 7.5, 0.15), '#8a5a32', tod, axis='x', step=0.6, seam='#5a3a22')
    for x in range(-8, 9, 1):
        pbox('Fence', (0.8, 0.14, 1.8 + (x % 2) * 0.2), (x, 12.8, 0.9), '#8a6a42', tod, ink=False)
    pbox('FenceRail', (17, 0.1, 0.12), (0, 12.7, 1.3), '#6a4a2a', tod)
    clown_podium(3.6, 10.0, tod)
    mark('host', (3.6, 10.0, 1.4))
    for (x, yy, kind) in ((-5.5, 5.0, 'drum'), (-3.8, 5.6, 'barrel'), (-2.0, 5.0, 'drum'), (-0.2, 5.6, 'crate'), (1.6, 5.0, 'barrel'), (-4.6, 3.4, 'crate'), (-2.6, 3.0, 'drum'), (-0.6, 3.4, 'barrel')):
        seat(x, yy, 0.62 if kind != 'barrel' else 1.05)
        if kind == 'drum':
            drum_seat(x, yy, tod)
        elif kind == 'barrel':
            pcyl('Barrel', 0.4, 0.75, (x, yy, 0.67), '#8a5a32', tod, verts=14)
            pcyl('BarrelBand', 0.41, 0.06, (x, yy, 0.9), '#4a3a2a', tod, verts=14, ink=False)
        else:
            pbox('CrateSeat', (0.8, 0.7, 0.6), (x, yy, 0.6), '#a8784a', tod)
    for (x, yy) in ((-7.5, 10.5), (-2.5, 11.5), (2.5, 11.8), (7.5, 10.5), (-7.5, 3.5), (7.5, 3.5)):
        stripe_torch(x, yy, lit, 2.8)
    for xx in (-6.5, 6.5):
        pcyl('BuntPole', 0.07, 4.6, (xx, 11.0, 2.3), '#c8a050', tod, verts=8)
    bunting((-6.5, 11.0, 4.4), (6.5, 11.0, 4.4), tod, n=16, sag=0.7)
    string_lights((-6.5, 10.8, 4.2), (6.5, 10.8, 4.2), n=20, sag=0.9, tod=lit)
    film_lamp(-8.5, 6.0, lit, aim=30, h=3.0)
    if lit == 'night':
        brush_patch('Glow', 4.0, (0, 6.5), '#a8643a', sx=1.4, sy=0.8, seed=2, mottle=0.2, z=0.32)
        fire_pit(0.8, 7.6, 'night', r=0.55, lit=True)
    else:
        fire_pit(0.8, 7.6, 'day', r=0.55, lit=False)
    paint_sun(azimuth=-30, elevation=40 if tod == 'day' else 28, energy=4.0 if tod == 'day' else 1.6)
    tv_camera((-0.6, -4.2, 2.6), (0.6, 12, 1.4), lens=26)


def cv_trial_area(tod):
    paint_mode(); trial_deck(tod)


def cv_ceremony(tod):
    paint_mode(); trial_deck('night')


def cv_voting_booth(tod):
    """The voting booth: a little striped booth off by itself, the curtain drawn back, the clown urn on a stand inside."""
    paint_mode(); P = CV[tod]
    cv_sky(tod)
    cv_ground(tod)
    pine_wall(tod, 24, seed=21)
    far_carnival(tod, y=70, x=10)
    plank_floor('BoothFloor', (2.6, 2.6, 0.2), (0, 7.0, 0.1), '#8a5a32', tod, axis='x', step=0.4)
    for sx in (-1.25, 1.25):
        striped('BoothSide', 0.08, 2.8, (sx, 7.0, 1.6), '#7a5aa8', '#d8c8e8', tod, n=3)
        pbox('BoothWall', (0.1, 2.5, 2.8), (sx, 7.0, 1.6), '#7a5aa8', tod)
    pbox('BoothBack', (2.5, 0.1, 2.8), (0, 8.25, 1.6), '#d8c8e8', tod)
    for k in range(6):
        pbox('BackStripe', (0.2, 0.11, 2.8), (-1.0 + k * 0.4, 8.2, 1.6), '#7a5aa8', tod, ink=False)
    striped('BoothRoof', 1.9, 1.2, (0, 7.0, 3.6), '#7a5aa8', '#d8c8e8', tod, n=6, r2=0.05)
    pbox('BoothSign', (1.6, 0.08, 0.42), (0, 5.62, 3.2), '#f2e2b0', tod)
    ptext('VOTE', (0, 5.56, 3.2), 0.28, N('#8a2a1c', tod))
    for k in range(4):
        pbox('Curtain', (0.2, 0.06, 2.5), (-1.05 + k * 0.17, 5.85, 1.45), '#a82a3a', tod, ink=False)
    pbox('UrnStand', (0.6, 0.6, 1.0), (0.3, 7.4, 0.7), '#5a3a20', tod)
    pcyl('Urn', 0.32, 0.6, (0.3, 7.4, 1.5), '#6a4a3a', tod, r2=0.26, verts=18)
    card(uid('UrnFace'), _blob_pts(0.2, 0.18, 16, 0, 0), 7.06, pmat('UrnFace', '#f6f0e4', unlit=True, mottle=0), x=0.3, z=1.55)
    card(uid('UrnNose'), _blob_pts(0.05, 0.05, 10, 0, 0), 7.05, pmat('Nose' + tod, N('#d8302a', tod), unlit=True, mottle=0), x=0.3, z=1.53)
    if tod == 'night':
        lamp_post((1.9, 5.6, 0), 2.8, tod)
    for x in (-8, 8.5):
        dc_pine(x, 8, 13, tod, seed=int(x) + 90, s=1.5)
    cv_bush(-4, 5, tod, s=1.1)
    paint_sun(azimuth=-30, elevation=45 if tod == 'day' else 28, energy=4.0 if tod == 'day' else 1.6)
    tv_camera((1.2, -1.5, 1.9), (0, 8, 1.6), lens=28)


def cv_haunted(tod):
    """The Haunted Mansion (Haunted_Mansion): a grey gabled house with boarded windows and a tower, storm clouds, the coaster and the wheel behind the fence."""
    paint_mode(); P = CV[tod]
    paint_sky('#5a5a6a' if tod == 'day' else '#1c1c2e', '#8a8a96' if tod == 'day' else '#2c2c40')
    rnd = random.Random(3)
    for i in range(10):
        curly_cloud(rnd.uniform(-40, 40), 90, rnd.uniform(26, 44), rnd.uniform(4, 7), N('#4a4a58', tod), N('#3a3a46', tod))
    ground_plane(N('#5a5a48', tod), N('#40403a', tod), mottle=0.35)
    pbox('Path', (2.4, 14, 0.02), (0, 4, 0.01), '#7a7a6a', tod, ink=False)
    coaster(-26, -8, 36, tod, seed=5)
    ferris(14, 34, 8, tod, lit=False)
    wall = '#6a6a76'
    pbox('Mansion', (10, 7, 7.0), (0, 16, 3.5), wall, tod, shade='#4a4a58', mottle=0.35, mscale=0.8)
    for sx in (-3.2, 3.2):
        pts = [(-2.2, 0), (2.2, 0), (0, 3.2)]
        card(uid('Gable'), pts, 12.4, pmat('Gable' + tod, N(wall, tod), unlit=True, mottle=0.3), x=sx, z=7.0)
        card(uid('GableRoof'), [(-2.5, -0.1), (0, 3.4), (2.5, -0.1), (2.2, -0.1), (0, 3.0), (-2.2, -0.1)], 12.38, pmat('MRoof' + tod, N('#3a3a46', tod), unlit=True, mottle=0), x=sx, z=7.0)
    pbox('Tower', (2.4, 2.4, 11), (0, 14.0, 5.5), wall, tod, shade='#4a4a58', mottle=0.35)
    card(uid('Spire'), [(-1.6, 0), (1.6, 0), (0, 3.8)], 12.75, pmat('MRoof' + tod, N('#3a3a46', tod), unlit=True, mottle=0), x=0, z=11)
    card(uid('Clock'), _blob_pts(0.6, 0.6, 20, 0, 0), 12.74, pmat('Clock' + tod, '#e8c84a' if tod == 'night' else N('#c8b87a', tod), unlit=True, mottle=0), x=0, z=9.0)
    glow = tod == 'night'
    for x, z in ((-3.2, 2.2), (3.2, 2.2), (-3.2, 5.2), (3.2, 5.2), (0, 6.6)):
        pbox('MWin', (1.2, 0.08, 1.4), (x, 12.45, z), '#ffcf6a' if glow else '#2a2a30', 'day', unlit=glow)
        for k in (-1, 1):
            pbox('Board', (1.5, 0.06, 0.18), (x, 12.4, z + k * 0.3), '#9a7a52', tod, rot=(0, k * 12, 0), ink=False)
    pbox('Door', (1.4, 0.08, 2.4), (0, 12.6, 1.2), '#2a1e18', tod)
    plank_floor('Porch', (6, 1.8, 0.25), (0, 11.6, 0.3), '#5a5a5a', tod, axis='x', step=0.35)
    for x in range(-12, 13):
        if abs(x) < 2: continue
        pbox('Picket', (0.08, 0.08, 1.5), (x, 7.5, 0.75), '#2a2a30', tod, ink=False)
        card(uid('PicketTop'), [(-0.12, 0), (0.12, 0), (0, 0.3)], 7.45, pmat('Picket' + tod, N('#2a2a30', tod), unlit=True, mottle=0), x=x, z=1.5)
    pbox('FenceRail', (24, 0.08, 0.08), (0, 7.5, 1.1), '#2a2a30', tod)
    for k, x in enumerate((-8, -4, 4, 8)):
        pbox('GatePost', (0.5, 0.5, 2.0), (x, 7.6, 1.0), '#8a8a90', tod)
    paint_sun(azimuth=-60, elevation=30 if tod == 'day' else 20, energy=3.0 if tod == 'day' else 1.4)
    tv_camera((0, -3.5, 1.9), (0, 14, 4.2), lens=24)


def cv_corn_maze(tod):
    """The corn maze (Corn_Maze): a lane between walls of corn taller than anyone, pumpkins at the foot, the hills beyond."""
    paint_mode(); P = CV[tod]
    cv_sky(tod)
    ground_plane(N('#8a7a42', tod), N('#6a5a32', tod), mottle=0.35)
    corn = pmat('Corn' + tod, N('#3a5a2a', tod), N('#2a4220', tod), mottle=0.3, mscale=1.0)
    stalk = pmat('Stalk' + tod, N('#6a8a3a', tod), unlit=True, mottle=0)
    leaf = pmat('CornLeaf' + tod, N('#4a7a2e', tod), unlit=True, mottle=0)
    cob = pmat('Cob' + tod, N('#e8c040', tod), unlit=True, mottle=0)
    def wall(x0, x1, y0, y1, face):
        cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
        ob = box(uid('CornWall'), (abs(x1 - x0) or 0.8, abs(y1 - y0) or 0.8, 3.2), (cx, cy, 1.6), corn, bevel=0); ob['ink'] = 1
        n = int(max(abs(x1 - x0), abs(y1 - y0)) / 0.5)
        rnd = random.Random(int(x0 * 7 + y0 * 3))
        for i in range(n):
            t = (i + 0.5) / n
            px, py = x0 + (x1 - x0) * t, y0 + (y1 - y0) * t
            fx, fy = face
            ob = card(uid('Stalk'), [(-0.04, 0), (0.04, 0), (0.03, 3.4), (-0.03, 3.4)], 0, stalk); ob.location = (px + fx * 0.42, py + fy * 0.42, 0)
            ob.rotation_euler = (0, 0, math.radians(90) if fy == 0 else 0)
            for k in range(2):
                z = rnd.uniform(0.8, 2.8); sd = rnd.choice((-1, 1))
                lf = card(uid('CLeaf'), [(0, 0), (sd * 0.35, 0.1), (sd * 0.6, -0.15), (sd * 0.3, -0.05)], 0, leaf); lf.location = (px + fx * 0.44, py + fy * 0.44, z)
                lf.rotation_euler = (0, 0, math.radians(90) if fy == 0 else 0)
            if rnd.random() < 0.25:
                c = card(uid('Cob'), _blob_pts(0.06, 0.16, 10, 0, 0), 0, cob); c.location = (px + fx * 0.45, py + fy * 0.45, rnd.uniform(1.2, 2.2))
                c.rotation_euler = (0, 0, math.radians(90) if fy == 0 else 0)
    wall(-1.6, -1.6, 0, 14, (1, 0))
    wall(1.6, 1.6, 0, 9, (-1, 0))
    wall(-1.6, 7, 14.8, 14.8, (0, -1))
    wall(1.6, 9, 9.0, 9.0, (0, -1))
    for (x, yy, s) in ((-1.0, 2.0, 0.5), (1.0, 6.0, 0.4), (0.3, 12.0, 0.35), (-0.9, 9.5, 0.3)):
        pcyl('Pumpkin', s, s * 0.8, (x, yy, s * 0.4), '#e8782a', tod, verts=14)
        pcyl('PumpStem', 0.05, 0.15, (x, yy, s * 0.85), '#4a6a2a', tod, verts=6, ink=False)
    paint_sun(azimuth=-40, elevation=55 if tod == 'day' else 28, energy=4.0 if tod == 'day' else 1.6)
    tv_camera((0, -1.5, 1.8), (0.4, 14, 1.8), lens=26)


def cv_theater(tod):
    """The Theater Tent inside (Theater_Interior): a red curtain stage under a truss of lamps, the judges' white chairs, the blue seats."""
    paint_mode()
    W, D, H = 14.0, 12.0, 7.0
    painted_room(W, D, H, 'day', wall='#3a2a5a', floor='#2a2a4a', ceil='#1e1a32', plank=1.0, wall_seam='#2e2248', floor_seam='#222240')
    pbox('Stage', (10, 3.6, 1.0), (0, D - 2.0, 0.5), '#e8a23a', 'day', shade='#b8742a')
    pbox('StageLip', (10.2, 0.2, 1.05), (0, D - 3.8, 0.5), '#c8302a', 'day')
    pbox('Curtain', (10, 0.15, 5.4), (0, D - 0.4, 3.7), '#d83a5a', 'day', shade='#a82a4a', mottle=0.2)
    for i in range(14):
        pbox('Fold', (0.12, 0.2, 5.4), (-4.6 + i * 0.7, D - 0.5, 3.7), '#a82a4a', 'day', ink=False)
    for sx in (-5.6, 5.6):
        pbox('Truss', (0.4, 0.4, 7.0), (sx, D - 1.0, 3.5), '#3a3a46', 'day')
    pbox('TrussTop', (11.6, 0.4, 0.4), (0, D - 1.0, 6.4), '#3a3a46', 'day')
    for k in range(5):
        pcyl('TrussLamp', 0.25, 0.4, (-4 + k * 2, D - 1.2, 6.0), '#2a2a32', 'day', verts=12, rot=(70, 0, 0))
    ptext('Stawaki Idol', (0, D - 0.5, 4.6), 0.9, '#e8b03a', rot=(90, -8, 0))
    for k in range(3):
        pbox('JudgeChair', (0.8, 0.7, 0.8), (-1.6 + k * 1.6, D - 5.0, 0.4), '#e8e8f0', 'day')
    for r in range(3):
        for i in range(8):
            x = -4.2 + i * 1.2
            if abs(x) < 0.5: continue
            pbox('Seat', (0.9, 0.7, 0.5), (x, 2.2 + r * 1.3, 0.25), '#3a5ad8', 'day')
    point('StageLight', (0, D - 4.0, 5.0), 2400, '#ffe2c0', radius=1.0)
    room_light(azimuth=-30, elevation=60, energy=2.0)
    paint_sky('#1e1a32', '#1e1a32')
    tv_camera((0.3, -0.6, 2.2), (0, D, 2.6), lens=22)


def cv_big_top(tod):
    """The Big Top inside (Big_Top_Tent): red and cream stripes rising to the peak, stands all round, the ring, trapeze platforms, bunting."""
    paint_mode()
    W, D, H = 24.0, 20.0, 12.0
    plank_floor('Floor', (W, D, 0.2), (0, D / 2, -0.1), '#c8a878', 'day', axis='x', step=2.0, seam='#a88858')
    striped('TopWall', 12.0, 6.0, (0, 12, 3.0), '#c8303a', '#efe6d6', 'day', n=16, caps=False, ink=False)
    striped('TopRoof', 12.4, 7.0, (0, 12, 9.5), '#c8303a', '#efe6d6', 'day', n=16, r2=0.3, caps=False, ink=False)
    for ob in bpy.data.objects:
        if ob.name.startswith(('TopWall', 'TopRoof')):
            ob.visible_shadow = False
    pcyl('Ring', 5.0, 0.5, (0, 10, 0.25), '#c8303a', 'day', verts=48)
    pcyl('RingFloor', 4.7, 0.52, (0, 10, 0.26), '#e8d0a0', 'day', verts=48, ink=False)
    for r in range(5):
        pbox('Stands', (18, 1.0, 0.5 + r * 0.6), (0, 18.5 + r * 0.6 - 1.2 - 0, (0.5 + r * 0.6) / 2), '#a82a3a', 'day')
    for sx in (-5.0, 5.0):
        pcyl('Mast', 0.2, 12, (sx, 12, 6), '#e8e2d4', 'day', verts=12)
        pbox('Platform', (1.4, 1.4, 0.12), (sx, 12, 8.0), '#3a5aa8', 'day')
    pbox('TrapezeBar', (1.4, 0.06, 0.06), (0, 12, 7.0), '#e8b03a', 'day')
    for x in (-0.68, 0.68):
        pcyl('TrapezeRope', 0.02, 4.0, (x, 12, 9.0), '#d9c48a', 'day', verts=6, ink=False)
    bunting((-10, 8, 9.0), (10, 8, 9.0), 'day', n=24, sag=1.2)
    for k, sx in enumerate((-2.0, 0.0, 2.0)):
        pcyl('Pedestal', 0.6, 0.8, (sx, 10.5, 0.9), ('#3a5aa8', '#e8b03a', '#4a9a5a')[k], 'day', verts=20)
    pbox('Sign', (2.4, 0.2, 1.0), (0, 17.6, 6.6), '#e8b03a', 'day')
    ptext('STAWAKI', (0, 17.48, 6.6), 0.4, '#8a2a1c')
    for x in (-6, 0, 6):
        sp = bpy.data.lights.new(uid('Spot'), 'SPOT'); sp.energy = 4000; sp.spot_size = math.radians(28); sp.color = hexc('#fff0d0')[:3]
        so = _link(bpy.data.objects.new(uid('Spot'), sp)); so.location = (x, 3.0, H - 1.0)
        so.rotation_euler = (Vector((0, 10, 0.5)) - so.location).to_track_quat('-Z', 'Y').to_euler()
    room_light(azimuth=-30, elevation=70, energy=3.0)
    paint_sky('#2a1a2a', '#2a1a2a')
    tv_camera((0.0, 2.0, 2.6), (0, 14, 3.4), lens=20)


def cv_confessional(tod):
    """The photo booth: a stool, a starry purple curtain behind it, the price card; the lens is our camera."""
    paint_mode()
    W, D, H = 2.2, 2.0, 2.4
    painted_room(W, D, H, 'day', wall='#c8303a', floor='#3a3a46', ceil='#2a2a32', plank=0.5, wall_seam='#a8283a', floor_seam='#2a2a36')
    pbox('BackCurtain', (1.8, 0.06, 2.1), (0, D - 0.15, 1.15), '#5a3a8a', 'day', shade='#3a2a6a', mottle=0.2)
    for i in range(8):
        pbox('CurtainFold', (0.06, 0.08, 2.1), (-0.8 + i * 0.23, D - 0.19, 1.15), '#3a2a6a', 'day', ink=False)
    rnd = random.Random(4)
    for i in range(12):
        star_shape(uid('CurtainStar'), (rnd.uniform(-0.75, 0.75), D - 0.22, rnd.uniform(0.4, 2.0)), 0.05, '#e8b03a')
    pcyl('Stool', 0.26, 0.07, (0, D - 0.75, 0.62), '#c8303a', 'day', verts=20)
    pcyl('StoolPole', 0.04, 0.6, (0, D - 0.75, 0.3), '#c9ccd2', 'day', verts=10)
    pcyl('StoolBase', 0.22, 0.04, (0, D - 0.75, 0.02), '#c9ccd2', 'day', verts=16)
    pbox('PriceCard', (0.04, 0.42, 0.32), (-W / 2 + 0.13, 1.5, 1.45), '#f2e2b0', 'day')
    ptext('4 FOR 25c', (-W / 2 + 0.16, 1.5, 1.45), 0.06, '#8a2a1c', rot=(90, 0, -90))
    for i in range(3):
        pbox('Strip', (0.04, 0.13, 0.46), (W / 2 - 0.13, 1.25 + i * 0.18, 1.35), '#f6f3ea', 'day', ink=False)
    room_light(azimuth=-20, elevation=60, energy=3.0)
    paint_sky('#c8b890', '#c8b890')
    tv_camera((0.0, -0.1, 1.35), (0, D, 1.15), lens=19)


def cv_exit(tod):
    """The Boat of Losers at the Stawaki dock at night, the carnival lit up across the water."""
    paint_mode(); tod = 'night'
    cv_sky(tod)
    lakeside(tod, lake_y=-1)
    plank_floor('Dock', (3.6, 26, 0.3), (0, 11.0, 0.35), '#8a6440', tod, axis='y', step=0.4)
    for yy in range(0, 24, 3):
        for xx in (-1.9, 1.9):
            pcyl('Piling', 0.15, 1.6, (xx, yy, 0.2), '#6a4a2e', tod, verts=10)
    for yy in (4, 12, 20):
        for xx in (-1.9, 1.9):
            stripe_torch(xx, yy, 'night', 1.8)
    tdi_boat(5.0, 22.0, tod, rot_z=80)
    far_carnival(tod, y=90, x=-20)
    card(uid('Closed'), [(-1.0, -0.6), (1.0, -0.5), (1.0, 0.6), (-1.0, 0.5)], 2.0, pmat('ClosedSign', '#3a2a30', unlit=True, mottle=0.2), x=-4.2, z=1.6)
    ptext('CLOSED', (-4.2, 1.95, 1.6), 0.36, '#c8b8d8')
    pbox('ClosedPost', (0.12, 0.12, 1.6), (-4.2, 2.05, 0.8), '#3a2a2a', tod)
    for x in (-9, 9.5):
        dc_pine(x, 2, 14, tod, seed=int(x) + 7, s=1.6)
    paint_sun(azimuth=-30, elevation=28, energy=1.6)
    tv_camera((-1.2, -6.0, 2.6), (0.6, 24, 0.9), lens=26)


def clown_tent(x, y, tod, s=1.0, a='#efe6d6', b='#2a2a32'):
    """The Red team's tent (Red_Campsite): a striped cone whose front is a grinning clown face, the door its mouth."""
    striped('ClownWall', 2.8 * s, 2.4 * s, (x, y, 1.2 * s), a, b, tod, n=7)
    striped('ClownRoof', 3.0 * s, 3.0 * s, (x, y, 2.4 * s + 1.5 * s), a, b, tod, n=7, r2=0.08)
    fy = y - 2.9 * s
    card(uid('ClownFace'), _blob_pts(1.9 * s, 1.7 * s, 32, 0.04, 2), fy, pmat('ClownFace' + tod, N('#f2ece0', tod), unlit=True, mottle=0.1), x=x, z=3.0 * s)
    for sx in (-0.7, 0.7):
        card(uid('ClownEye'), _blob_pts(0.36 * s, 0.42 * s, 16, 0, 0), fy - 0.02, pmat('ClownEye' + tod, N('#1a1a22', tod), unlit=True, mottle=0), x=x + sx * s, z=3.6 * s)
    card(uid('ClownNose'), _blob_pts(0.32 * s, 0.3 * s, 16, 0, 0), fy - 0.03, pmat('ClownNose' + tod, N('#c8303a', tod), unlit=True, mottle=0), x=x, z=3.0 * s)
    card(uid('ClownMouth'), [(-1.3 * s, 2.4 * s), (1.3 * s, 2.4 * s), (0.9 * s, 0.0), (-0.9 * s, 0.0)], fy - 0.02, pmat('ClownMouth' + tod, N('#3a1a22', tod), unlit=True, mottle=0), x=x)
    card(uid('ClownLip'), [(-1.45 * s, 2.55 * s), (1.45 * s, 2.55 * s), (1.3 * s, 2.35 * s), (-1.3 * s, 2.35 * s)], fy - 0.025, pmat('ClownLip' + tod, N('#3a5aa8', tod), unlit=True, mottle=0), x=x)


def drop_tower(x, y, h, tod):
    striped('DropTower', 0.7, h, (x, y, h / 2), '#c8303a', '#efe6d6', tod, n=6)
    pcyl('DropRing', 1.6, 0.8, (x, y, h * 0.55), '#e8b03a', tod, verts=20)
    pcyl('DropCap', 1.0, 1.2, (x, y, h + 0.6), '#7a5aa8', tod, r2=0.1, verts=16)


def haunted_house(x, y, tod):
    """Stawaki's Haunted Mansion from outside: a crooked purple house, a tower, boarded windows."""
    pbox('MansionBody', (7.0, 5.0, 5.0), (x, y, 2.5), '#4a3a5a', tod, shade='#2e2440', mottle=0.35)
    for sd in (-1, 1):
        pbox('MansionRoof', (7.6, 3.4, 0.3), (x, y + sd * 1.3, 5.9), '#2a2236', tod, rot=(sd * -38, 0, 0))
    pcyl('MansionTower', 1.4, 7.5, (x + 2.8, y - 0.6, 3.75), '#4a3a5a', tod, verts=8)
    pcyl('MansionSpire', 1.7, 3.0, (x + 2.8, y - 0.6, 9.0), '#2a2236', tod, r2=0.05, verts=8)
    for k, wx in enumerate((-2.2, -0.4)):
        pbox('MansionWin', (1.0, 0.1, 1.2), (x + wx, y - 2.55, 3.4), '#e8c23a' if tod == 'night' else '#1e1a26', tod, ink=False)
        pbox('Board', (1.3, 0.12, 0.18), (x + wx, y - 2.6, 3.4), '#7a5a3a', tod, rot=(0, 20 - k * 40, 0))


def corn_maze(x, y, tod, w=12, d=8):
    _flat_poly('MazeField', [(x - w / 2, y - d / 2), (x + w / 2, y - d / 2), (x + w / 2, y + d / 2), (x - w / 2, y + d / 2)], 0.03, '#8a7a3a', tod, mottle=0.3)
    rnd = random.Random(7)
    for i in range(7):
        yy = y - d / 2 + 0.6 + i * (d - 1.2) / 6
        gap = rnd.uniform(x - w / 2 + 1.5, x + w / 2 - 1.5)
        for (a0, a1) in ((x - w / 2 + 0.3, gap - 0.7), (gap + 0.7, x + w / 2 - 0.3)):
            if a1 - a0 > 0.3:
                pbox('CornRow', (a1 - a0, 0.45, 1.3), ((a0 + a1) / 2, yy, 0.65), '#c8b04a', tod, shade='#8a7a2a', mottle=0.4, mscale=2)


def cv_map(tod):
    """Stawaki from above, the way Disventure Camp 4 paints it (Stawaki_Carnival_-_Further_view: the
    abandoned carnival on its lakeside, striped tents, the looping coaster, the drop tower, the
    clown-faced ferris wheel, lavender hills and dark drooping pines). The teams live apart outside
    the fence, each camp built from carnival junk: the Red team's clown-mouth tent (Red_Campsite),
    the Blue team's scalloped cone (Blue_Campsite), a third tent for a three-team season, each with
    its fire and banner. Shared ground: the forest edge, the rocky beach, the lake shore, the gate,
    the midway, and the attractions an episode can open (the mansion, the corn maze, the theater
    tent); the photo booth is the confessional. A camp's places are 'campsite@<slot>' and
    'shelter@<slot>': the viewer gives each team its own slot."""
    paint_mode(); P = CV[tod]; day = tod == 'day'; rnd = random.Random(31)
    cv_sky(tod, far_y=120)
    ground_plane(P['ground'], P['ground_sh'], size=(400, 300), loc=(0, 80, 0), mottle=0.35)
    # the lake on the right, its rocky near shore, the trial deck on the far shore
    _flat_poly('LakeRim', _blob(24, -4, 20, 11.5, seed=6, wob=0.1), 0.02, '#9a9070', tod, mottle=0.3)
    _flat_poly('Lake', _blob(24, -4, 18.5, 10, seed=6, wob=0.1), 0.04, CV['day']['lake'], tod, mottle=0.08)
    for k, (rx, ry, s) in enumerate(((9.5, -9, 1.2), (8, -6.5, 0.8), (11, -12, 0.9), (12.5, -8, 0.6), (30, -15, 0.8))):
        r = icorock(uid('LakeRock'), (s, s * 0.8, s * 0.6), (rx, ry, 0.2), N('#8a8a8a', tod), seed=40 + k)
        r.data.materials.clear(); r.data.materials.append(pmat('LRock' + tod, N('#8a8a8a', tod), mottle=0.3)); r['ink'] = 1
    pbox('TrialDeck', (8.0, 5.0, 0.4), (36, 6, 0.3), '#7a5232', tod)
    for (tx, ty) in ((32.5, 4), (39.5, 4), (32.5, 8.2), (39.5, 8.2)):
        stripe_torch(tx, ty, tod, h=2.6)
    # the fence between the camps and the carnival, the gate with its neon arrow
    for k in range(26):
        fx = -30 + k * 1.6
        if abs(fx - 2) > 2.6:
            pbox('Fence', (0.18, 0.18, 1.6), (fx, 14, 0.8), '#7a5a3a', tod)
    pbox('FenceRail', (42, 0.12, 0.14), (-9, 14, 1.3), '#7a5a3a', tod)
    for sd in (-1, 1):
        striped('GatePost', 0.45, 6.0, (2 + sd * 2.4, 14, 3.0), '#c8303a', '#efe6d6', tod, n=5)
    pbox('GateSign', (6.0, 0.3, 1.4), (2, 14, 6.4), '#7a5aa8', tod)
    neon_arrow(-3.5, 13.5, 7.6, tod, s=1.0)
    # the midway: a row of stalls, bunting, the theater tent and the Big Top behind
    for k, (col, sign) in enumerate((('#c8303a', 'GAMES'), ('#3a5aa8', 'FOOD'), ('#e8b03a', 'PRIZES'), ('#4a9a5a', 'TOSS'))):
        midway_stall(6 + k * 3.6, 21, tod, col, sign)
    bunting((5, 19, 3.6), (19, 19, 3.6), tod, n=16, sag=0.5)
    circus_tent(24, 22, tod, r=3.4, h=2.6, roof=2.8, a='#7a5aa8', b='#efe6d6', flag='#7a5aa8')
    circus_tent(10, 33, tod, r=7.0, h=4.5, roof=6.0)
    for (tx, ty, r, a) in ((-6, 22, 2.2, '#3a5aa8'), (17, 28, 2.0, '#c8303a'), (-12, 30, 2.4, '#c8303a'), (30, 28, 2.0, '#3a5aa8'), (-2, 28, 1.8, '#4a9a5a'), (20, 36, 2.2, '#7a5aa8'), (36, 26, 1.8, '#c8303a')):
        circus_tent(tx, ty, tod, r=r, h=1.8, roof=2.2, a=a)
    # the rides: the clown ferris wheel, the looping coaster, the drop tower
    ferris(28, 38, 7.5, tod)
    card(uid('FerrisClown'), _blob_pts(2.2, 2.2, 24, 0, 0), 37.9, pmat('FClown' + tod, N('#e8b03a', tod), unlit=True, mottle=0), x=28, z=7.5 * 1.15)
    card(uid('FerrisFace'), _blob_pts(1.4, 1.5, 20, 0, 0), 37.85, pmat('FFace' + tod, N('#f2ece0', tod), unlit=True, mottle=0), x=28, z=7.5 * 1.15)
    card(uid('FerrisNose'), _blob_pts(0.35, 0.35, 12, 0, 0), 37.8, pmat('FNose' + tod, N('#c8303a', tod), unlit=True, mottle=0), x=28, z=7.5 * 1.15)
    coaster(-24, 6, 42, tod, seed=3)
    drop_tower(-3, 36, 15, tod)
    # the attractions an episode can open: the mansion, the corn maze
    haunted_house(-20, 24, tod)
    corn_maze(-28, 36, tod)
    # the photo booth by the gate: the confessional
    striped('PhotoBooth', 0.9, 2.4, (-1.5, 11.5, 1.2), '#7a5aa8', '#d8c8e8', tod, n=5)
    striped('PhotoRoof', 1.05, 1.0, (-1.5, 11.5, 2.9), '#7a5aa8', '#d8c8e8', tod, n=5, r2=0.04)
    # the woods: pines behind the carnival and along the left, around the camps
    pine_wall(tod, 50, -90, 90, seed=8, h=(14, 20), gap=(2.6, 4.4), s=1.6)
    for (x, y) in ((-44, 20), (-40, 6), (-46, -6), (-38, 18), (-36, -12), (-16, 6), (40, 20), (44, -6), (46, 10)):
        dc_pine(x + rnd.uniform(-1, 1), y, rnd.uniform(10, 14), tod, seed=int(x * 3 + y), s=1.4)
    for (x, y, c) in ((-30, 2, '#c88a2a'), (-14, -6, '#3a7a5a'), (-2, -14, '#c88a2a'), (4, 2, '#3a7a5a')):
        cv_bush(x, y, tod, s=1.4, col=c)
    # camp 0: the Red team's clown tent
    _flat_poly('CampClear0', _blob(-24, -4, 6.5, 4.5, seed=1, wob=0.12), 0.03, CV['day']['patch'], tod, mottle=0.3)
    clown_tent(-26, -2, tod, s=0.95)
    fire_pit(-20.5, -6.5, tod, r=0.55, lit=True)
    _sol_banner(-21, -1, '#c8303a', tod)
    # camp 1: the Blue team's junk tent
    _flat_poly('CampClear1', _blob(-7, -10, 6.5, 4.5, seed=2, wob=0.12), 0.03, CV['day']['patch'], tod, mottle=0.3)
    junk_tent(-9, -8, tod, s=0.95)
    ticket_booth(-4.5, -7, tod, rot_z=-10, s=0.9)
    fire_pit(-4.0, -12.0, tod, r=0.55, lit=True)
    _sol_banner(-12.5, -10.5, '#3a5aa8', tod)
    # camp 2: a third team's tent in the pines
    _flat_poly('CampClear2', _blob(-30, 11, 6.0, 4.2, seed=3, wob=0.12), 0.03, CV['day']['patch'], tod, mottle=0.3)
    circus_tent(-31, 12, tod, r=2.6, h=2.0, roof=2.6, a='#4a9a5a', b='#efe6d6', flag='#4a9a5a')
    fire_pit(-26.5, 8.5, tod, r=0.5, lit=True)
    _sol_banner(-34.5, 9, '#4a9a5a', tod)
    for zid, loc in (('shelter@0', (-26, -2, 6.0)), ('campsite@0', (-20.5, -6.5, 1.2)), ('shelter@1', (-9, -8, 6.0)), ('campsite@1', (-4.0, -12.0, 1.2)),
                     ('shelter@2', (-31, 12, 5.0)), ('campsite@2', (-26.5, 8.5, 1.2)), ('forest-edge', (-38, 0, 2.0)), ('rocky-beach', (10, -9, 1.0)),
                     ('lake-shore', (26, 8, 0.6)), ('carnival-entrance', (2, 14, 7.0)), ('midway', (12, 21, 3.0)), ('haunted-mansion', (-20, 24, 6.0)),
                     ('corn-maze', (-28, 36, 1.4)), ('theater-tent', (24, 22, 5.5)), ('confessional', (-1.5, 11.5, 3.4))):
        mark('zone', loc, id=zid)
    paint_sun(azimuth=-35, elevation=55 if day else 35, energy=3.6 if day else 1.6)
    tv_camera((1.0, -58.0, 34.0), (1.0, 12.0, 6.0), lens=31)


SCENES['carnival'] = {
    'campsite': cv_campsite, 'shelter': cv_shelter, 'forest-edge': cv_forest, 'rocky-beach': cv_rocky_beach,
    'lake-shore': cv_lake_shore, 'carnival-entrance': cv_entrance, 'midway': cv_midway, 'trial-area': cv_trial_area,
    'haunted-mansion': cv_haunted, 'corn-maze': cv_corn_maze, 'theater-tent': cv_theater, 'big-top': cv_big_top,
    'voting-booth': cv_voting_booth, 'confessional': cv_confessional, 'ceremony': cv_ceremony, 'exit': cv_exit, 'map': cv_map,
}
OUTDOOR['carnival'] = {'campsite', 'forest-edge', 'rocky-beach', 'lake-shore', 'carnival-entrance', 'midway',
                       'trial-area', 'haunted-mansion', 'corn-maze', 'voting-booth', 'map'}

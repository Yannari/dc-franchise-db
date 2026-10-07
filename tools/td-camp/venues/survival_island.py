# ══════════════════════════════════════════════════════════════════════
# venues/survival_island.py — the survival island, painted after Disventure Camp 5's Soluna Island
# ══════════════════════════════════════════════════════════════════════
# js/camp-access.js 'survival-island': shelter, campfire, beach, shoreline, water-source,
# jungle-trail, fishing-area. The setting is Survivor-style (js/settings.js): the cast builds
# its own shelter, forages and fishes. The closest painted island of the franchise is Soluna
# (Disventure Camp wiki: Fans_Campsite, Favorites_Campsite, Bamboo_grove, DC5_Elimination_
# Trial_Area): a lime-to-teal sky, puffy flat-bottomed clouds, teal mountains, curved palms,
# round dark jungle trees, bamboo, thatch on stilts, tiki faces and torches. The exit stays
# the Cannon of Shame (Pahkitew); the confessional is a thatched bamboo outhouse.

SOL = {
    'day': {'sky': '#46c27c', 'sky_low': '#e2ec6a', 'cloud': '#ffffff', 'rim': '#b8e8b0', 'mtn': ('#7ac8b0', '#4aa890'), 'sea': '#2ec2d8', 'sea_far': '#7ae0e8',
            'sand': '#f2dc9a', 'grass': '#8ab83e', 'grass_sh': '#6a9a32', 'path': '#c8b26a', 'jungle': ('#2f7a3e', '#1f5a30'), 'trunk': '#7a5a3a', 'frond': '#3a9a3e'},
    'night': {'sky': '#1e2a5a', 'sky_low': '#2e4a7a', 'cloud': '#4a5a8a', 'rim': '#32406a', 'mtn': ('#2a4a6a', '#20385a'), 'sea': '#1a4a6a', 'sea_far': '#2a6a8a',
              'sand': '#7a7468', 'grass': '#3a4a3a', 'grass_sh': '#2a3640', 'path': '#5a5444', 'jungle': ('#1a3a3a', '#122a2e'), 'trunk': '#3a2e2e', 'frond': '#1e4a3a'},
}


def puffy_cloud(x, y, z, s, col, rim):
    base = pmat('SCloud' + col, col, unlit=True, mottle=0); rm = pmat('SCloudRim' + rim, rim, unlit=True, mottle=0)
    for (px, pz, r) in ((-1.3, 0.1, 0.7), (-0.4, 0.5, 1.0), (0.6, 0.35, 0.85), (1.4, 0.05, 0.6)):
        card(uid('CloudPuff'), _blob_pts(r * s, r * s * 0.85, 24, 0, 0), y, base, x=x + px * s, z=z + pz * s)
    card(uid('CloudBase'), [(-2.0 * s, -0.25 * s), (2.0 * s, -0.25 * s), (2.0 * s, 0.25 * s), (-2.0 * s, 0.25 * s)], y - 0.01, base, x=x, z=z)
    card(uid('CloudShade'), [(-1.9 * s, -0.25 * s), (1.9 * s, -0.25 * s), (1.9 * s, -0.05 * s), (-1.9 * s, -0.05 * s)], y - 0.02, rm, x=x, z=z)


def sol_backdrop(tod, far_y=80, mountains=True):
    P = SOL[tod]
    paint_sky(P['sky'], P['sky_low'])
    if mountains:
        rnd = random.Random(4)
        for k, col in enumerate(P['mtn']):
            y = far_y + 40 - k * 14
            x = -120
            while x < 120:
                w = rnd.uniform(10, 22); hh = rnd.uniform(8, 20) * (1.2 - k * 0.3)
                pts = [(-w, 0), (-w * 0.35, hh * 0.7), (-w * 0.1, hh), (w * 0.15, hh * 0.92), (w * 0.4, hh * 0.6), (w, 0)]
                card(uid('Hill'), pts, y, pmat('Mtn' + col, col, unlit=True, mottle=0), x=x, z=-1)
                card(uid('Hill'), [(w * 0.15, hh * 0.92), (w * 0.4, hh * 0.6), (w, 0), (w * 0.05, 0)], y - 0.05,
                     pmat('MtnSh' + col, _mix_hex(col, '#1a3a4a', 0.2), unlit=True, mottle=0), x=x, z=-1)
                x += w * rnd.uniform(1.0, 1.6)
    if tod == 'day':
        for (cx, cz, cs) in ((-50, 44, 4.5), (-12, 52, 3.4), (28, 46, 4.0), (66, 54, 3.0)):
            puffy_cloud(cx, far_y + 60, cz, cs, P['cloud'], P['rim'])
    else:
        card(uid('Moon'), [(math.cos(a / 30 * 6.28) * 3, math.sin(a / 30 * 6.28) * 3) for a in range(30)], far_y + 70, pmat('MoonS', '#f6eec0', unlit=True, mottle=0), x=-30, z=46)
        card(uid('MoonCut'), [(math.cos(a / 30 * 6.28) * 2.8, math.sin(a / 30 * 6.28) * 2.8) for a in range(30)], far_y + 69.9, pmat('MoonCut', P['sky'], unlit=True, mottle=0), x=-28.6, z=46.8)
        rnd = random.Random(9)
        for i in range(70):
            card(uid('Star'), _blob_pts(0.16, 0.16, 6, 0, 0), far_y + 75, pmat('StarS', '#f4f0d8', unlit=True, mottle=0), x=rnd.uniform(-90, 90), z=rnd.uniform(14, 60))


def sol_palm(x, y, h, tod, lean=10, seed=0, s=1.0, coconuts=True):
    """A Soluna palm: a curved banded trunk, a crown of long drooping fronds, coconuts."""
    P = SOL[tod]; rnd = random.Random(seed)
    tm = pmat('PalmTrunk' + tod, N('#8a6a4a', tod), unlit=True, mottle=0.2)
    band = pmat('PalmBand' + tod, N('#6a4e34', tod), unlit=True, mottle=0)
    n = 10; pts_l = []; pts_r = []; cx = 0
    for i in range(n + 1):
        t = i / n; cx = math.sin(math.radians(lean)) * h * t * t * 1.2; z = h * t
        w = (0.28 - 0.1 * t) * s
        pts_l.append((cx - w, z)); pts_r.append((cx + w, z))
    card(uid('PalmTrunk'), pts_l + list(reversed(pts_r)), y, tm, x=x)
    for i in range(1, n):
        t = i / n; bx = math.sin(math.radians(lean)) * h * t * t * 1.2; w = (0.29 - 0.1 * t) * s
        card(uid('PalmBand'), [(bx - w, h * t - 0.04), (bx + w, h * t - 0.04), (bx + w, h * t + 0.04), (bx - w, h * t + 0.04)], y - 0.01, band, x=x)
    top = (x + cx, h)
    fm = pmat('Frond' + tod, P['frond'], unlit=True, mottle=0.15)
    fm2 = pmat('Frond2' + tod, _mix_hex(P['frond'], '#0a2a1a', 0.3), unlit=True, mottle=0)
    for k in range(7):
        a = math.radians(-160 + k * 50 + rnd.uniform(-10, 10)); L = (2.4 + rnd.random() * 0.8) * s
        pts = []
        for i in range(13):
            t = i / 12
            px = math.cos(a) * L * t; pz = math.sin(a) * L * t * 0.5 - (t * t) * 1.0 * s + 0.25 * s
            pts.append((px, pz + 0.18 * s * math.sin(t * math.pi)))
        for i in range(12, -1, -1):
            t = i / 12
            px = math.cos(a) * L * t; pz = math.sin(a) * L * t * 0.5 - (t * t) * 1.0 * s + 0.25 * s
            pts.append((px, pz - 0.18 * s * math.sin(t * math.pi)))
        card(uid('Frond'), pts, y - 0.02 - k * 0.003, fm if k % 2 else fm2, x=top[0], z=top[1])
    if coconuts:
        for k in range(3):
            card(uid('Coconut'), _blob_pts(0.2 * s, 0.2 * s, 12, 0, 0), y - 0.05, pmat('Coco' + tod, N('#6a4a2a', tod), unlit=True, mottle=0),
                 x=top[0] - 0.25 * s + k * 0.25 * s, z=top[1] - 0.2 * s)


def lolly_tree(x, y, h, tod, col=None, seed=0, s=1.0):
    """The round jungle tree of Soluna: a thin trunk, a flattened dome of leaves with a darker underside."""
    P = SOL[tod]; col = col or P['jungle'][0]
    card(uid('LTrunk'), [(-0.12 * s, 0), (0.12 * s, 0), (0.08 * s, h), (-0.08 * s, h)], y, pmat('LTrunk' + tod, N('#5a4030', tod), unlit=True, mottle=0), x=x)
    card(uid('LCrown'), _blob_pts(1.6 * s, 1.0 * s, 36, 0.08, seed, flat_bottom=True), y - 0.01, pmat('LCrown' + col, col, unlit=True, mottle=0.2, mscale=2), x=x, z=h)
    card(uid('LUnder'), [(-1.55 * s, -0.36 * s), (1.55 * s, -0.36 * s), (1.3 * s, -0.1 * s), (-1.3 * s, -0.1 * s)], y - 0.02,
         pmat('LUnder' + col, _mix_hex(col, '#0a1a1a', 0.35), unlit=True, mottle=0), x=x, z=h)


def bamboo(x, y, h, tod, seed=0, s=1.0):
    rnd = random.Random(seed)
    col = N('#5ab84a', tod); dk = N('#3a8a3a', tod)
    card(uid('Bamboo'), [(-0.1 * s, 0), (0.1 * s, 0), (0.08 * s, h), (-0.08 * s, h)], y, pmat('Bamboo' + tod, col, unlit=True, mottle=0), x=x)
    for i in range(1, int(h / 0.9)):
        card(uid('Node'), [(-0.12 * s, i * 0.9), (0.12 * s, i * 0.9), (0.12 * s, i * 0.9 + 0.05), (-0.12 * s, i * 0.9 + 0.05)], y - 0.01, pmat('BNode' + tod, dk, unlit=True, mottle=0), x=x)
    for i in range(rnd.randint(3, 6)):
        z = h * rnd.uniform(0.4, 1.0); sd = rnd.choice((-1, 1)); L = rnd.uniform(0.6, 1.1) * s
        card(uid('BLeaf'), [(0, 0), (sd * L * 0.5, 0.12 * s), (sd * L, -0.05 * s), (sd * L * 0.5, -0.06 * s)], y - 0.02, pmat('BLeaf' + tod, N('#4aa83a', tod), unlit=True, mottle=0), x=x, z=z)


def leafy_plant(x, y, tod, s=1.0, seed=0, col=None):
    """A clump of big tropical leaves, the foreground plant Soluna paints everywhere."""
    rnd = random.Random(seed); col = col or N('#3aa04a', tod)
    for k in range(5):
        a = math.radians(30 + k * 30 + rnd.uniform(-8, 8)); L = rnd.uniform(0.9, 1.4) * s
        cx, cz = math.cos(a) * L * 0.5, math.sin(a) * L * 0.5
        lf = card(uid('BigLeaf'), _blob_pts(L * 0.42, L * 0.2, 16, 0.05, k), y - k * 0.003,
                  pmat('BigLeaf' + col + str(k % 2), col if k % 2 else _mix_hex(col, '#0a2a1a', 0.25), unlit=True, mottle=0), x=x + cx, z=cz)
        lf.rotation_euler = (0, -math.atan2(cz, cx), 0)
    if rnd.random() < 0.5:
        card(uid('Bloom'), _blob_pts(0.16 * s, 0.16 * s, 10, 0.3, seed), y - 0.03, pmat('Bloom' + tod, N('#e84a6a', tod), unlit=True, mottle=0), x=x + 0.2 * s, z=0.5 * s)


def tiki_face(x, y, h, tod, col='#b87a3a', angry=True, s=1.0):
    """A carved tiki: a tall block, a brow, big eyes, a wide mouth."""
    pbox('Tiki', (0.9 * s, 0.7 * s, h), (x, y, h / 2), col, tod, mottle=0.35, mscale=1.5)
    pbox('TikiBrow', (1.0 * s, 0.1, 0.2 * s), (x, y - 0.36 * s, h * 0.72), _mix_hex(col, '#2a1a1a', 0.35), tod, rot=(0, 8 if angry else 0, 0))
    for sx in (-0.22, 0.22):
        card(uid('TikiEye'), _blob_pts(0.15 * s, 0.12 * s, 12, 0, 0), y - 0.37 * s, pmat('TikiEye' + tod, N('#f2e2b0', tod), unlit=True, mottle=0), x=x + sx * s, z=h * 0.6)
        card(uid('TikiPupil'), _blob_pts(0.06 * s, 0.06 * s, 8, 0, 0), y - 0.38 * s, pmat('TikiPupil', '#1a1a1a', unlit=True, mottle=0), x=x + sx * s, z=h * 0.6)
    card(uid('TikiMouth'), [(-0.3 * s, 0), (0.3 * s, 0), (0.24 * s, -0.22 * s), (-0.24 * s, -0.22 * s)], y - 0.37 * s,
         pmat('TikiMouth' + tod, N('#4a2a1a', tod), unlit=True, mottle=0), x=x, z=h * 0.38)
    for k in range(3):
        card(uid('TikiTooth'), [(-0.05 * s, 0), (0.05 * s, 0), (0, -0.08 * s)], y - 0.38 * s, pmat('TikiTooth', '#f2e8d0', unlit=True, mottle=0), x=x - 0.15 * s + k * 0.15 * s, z=h * 0.38)


def thatch(name, size, loc, tod, rot=(0, 0, 0)):
    return pbox(name, size, loc, '#c8a050', tod, shade='#8a6a30', mottle=0.35, mscale=2.5, rot=rot)


def stilt_hut(x, y, tod, rot_z=0, s=1.0):
    """The Favorites' hut: plank walls on stilts, a big thatched roof, a ladder of steps."""
    g = _group(uid('Hut'), (x, y, 0), rot_z)
    def add(ob):
        _child(g, ob)
        return ob
    lift = 1.4 * s; w, d, h = 4.6 * s, 3.6 * s, 2.2 * s
    for sx in (-1, 1):
        for sy in (-1, 1):
            add(pcyl('Stilt', 0.12 * s, lift, (sx * w * 0.42, sy * d * 0.42, lift / 2), '#6a4a2a', tod, verts=8))
    add(pbox('HutFloor', (w + 0.4, d + 0.4, 0.15), (0, 0, lift), '#8a643a', tod))
    add(pbox('HutWall', (w, d, h), (0, 0, lift + h / 2), '#a8784a', tod, shade='#7a5232', mottle=0.35, mscale=1.5))
    for i in range(1, 8):
        add(pbox('HutSeam', (0.03, 0.02, h), (-w / 2 + i * w / 8, -d / 2 - 0.01, lift + h / 2), '#6a4a2a', tod, ink=False))
    for sd in (-1, 1):
        add(thatch('HutRoof', (w + 1.6, d / 2 + 1.0, 0.3), (0, sd * d * 0.28, lift + h + 0.75), tod, rot=(sd * -34, 0, 0)))
    add(pbox('HutDoor', (0.9 * s, 0.06, 1.6 * s), (0.8 * s, -d / 2 - 0.03, lift + 0.8 * s), '#5a3a22', tod))
    add(pbox('HutWin', (0.9 * s, 0.06, 0.7 * s), (-1.1 * s, -d / 2 - 0.03, lift + 1.2 * s), '#3a2a1a', tod))
    for i in range(5):
        add(pbox('HutStep', (1.1 * s, 0.3, 0.08), (0.8 * s, -d / 2 - 0.35 - i * 0.3, lift - 0.2 - i * 0.26), '#7a5432', tod))
    return g


def lean_to(x, y, tod, rot_z=0, s=1.0):
    """The Fans' shelter: an A-frame of poles with a patched leaf-and-board roof."""
    g = _group(uid('LeanTo'), (x, y, 0), rot_z)
    def add(ob):
        _child(g, ob)
        return ob
    for sd in (-1, 1):
        add(pbox('ATimber', (0.2, 0.2, 4.4 * s), (sd * 1.2 * s, 0, 1.9 * s), '#6a4a2a', tod, rot=(0, sd * 28, 0)))
    add(pbox('ARidge', (0.2, 4.2 * s, 0.2), (0, 0, 3.8 * s), '#6a4a2a', tod))
    for sd in (-1, 1):
        add(pbox('ARoof', (0.14, 4.0 * s, 4.0 * s), (sd * 1.05 * s, 0, 1.9 * s), '#b89a5a', tod, shade='#8a6a3a', mottle=0.4, mscale=1.6, rot=(0, sd * 28, 0)))
        for k in range(3):
            add(pbox('APatch', (0.15, 0.9 * s, 0.8 * s), (sd * 1.1 * s, -1.2 * s + k * 1.1 * s, 1.4 * s + k * 0.5 * s), '#8a7a4a', tod, rot=(0, sd * 28, 0), ink=False))
    return g


def sol_ground(tod, sea_y=None):
    P = SOL[tod]
    if sea_y is None:
        ground_plane(P['grass'], P['grass_sh'])
    else:
        box('Sand', (220, 40 + sea_y, 0.2), (0, (sea_y - 40) / 2, -0.1), pmat('SandS' + tod, P['sand'], _mix_hex(P['sand'], '#8a6a5a', 0.3), mottle=0.25, mscale=0.3), bevel=0)
        water_plane(tod, y0=sea_y, col=P['sea'], far=P['sea_far'])
        box('Foam', (220, 0.5, 0.02), (0, sea_y + 0.2, -0.05), pmat('FoamS' + tod, N('#f2fbfb', tod), unlit=True, mottle=0), bevel=0)


def jungle_band(tod, y, x0=-60, x1=60, seed=1, palms=0.4):
    rnd = random.Random(seed)
    x = x0
    while x < x1:
        if rnd.random() < palms:
            sol_palm(x, y + rnd.uniform(0, 3), rnd.uniform(7, 10), tod, lean=rnd.uniform(-14, 14), seed=int(x * 7), s=1.2)
        else:
            lolly_tree(x, y + rnd.uniform(0, 3), rnd.uniform(4, 7), tod, col=SOL[tod]['jungle'][int(rnd.random() < 0.5)], seed=int(x * 5), s=rnd.uniform(1.2, 1.8))
        x += rnd.uniform(2.2, 4.2)


def si_rock(name, size, loc, tod, col='#9a8a7a', seed=0, rot_z=0):
    r = icorock(uid(name), size, loc, N(col, tod), seed=seed, rot_z=rot_z)
    r.data.materials.clear(); r.data.materials.append(pmat('RockS' + col + tod, N(col, tod), N(_mix_hex(col, '#3a3a5a', 0.35), tod), mottle=0.3)); r['ink'] = 1
    return r


def si_shelter(tod):
    """The Fans' campsite (DC5): the A-frame shelter in a jungle clearing, the fire, a log seat."""
    paint_mode(); P = SOL[tod]
    sol_backdrop(tod)
    sol_ground(tod)
    brush_patch('Clearing', 6, (0, 5), P['path'], sx=1.6, sy=0.8, seed=2)
    jungle_band(tod, 22, seed=4, palms=0.35)
    jungle_band(tod, 15, -40, 40, seed=5, palms=0.2)
    lean_to(-2.5, 8.0, tod, rot_z=80)
    fire_pit(4.0, 5.5, tod, r=0.45, lit=True)
    pcyl('LogSeat', 0.24, 2.2, (4.0, 3.8, 0.24), '#6a4a2a', tod, verts=10, rot=(0, 90, 0))
    tiki_face(9.0, 9.0, 2.2, tod, s=0.8)
    for (x, yy) in ((-8, 4), (7.5, 2.5), (-5, 2), (10, 6)):
        leafy_plant(x, yy, tod, s=1.4, seed=int(x))
    sol_palm(-10, 3, 8, tod, lean=12, seed=1, s=1.3)
    paint_sun(azimuth=-30, elevation=50 if tod == 'day' else 30, energy=4.0 if tod == 'day' else 1.8)
    tv_camera((0, -8.0, 2.0), (0, 10, 2.2), lens=27)


def si_campfire(tod):
    """The fire by the beach (DC5 Favorites campsite): logs round the fire, the hut on stilts, the sea and the green hills."""
    paint_mode(); P = SOL[tod]
    sol_backdrop(tod)
    sol_ground(tod, sea_y=14)
    brush_patch('Grass', 9, (0, 3), P['grass'], sx=1.8, sy=0.9, seed=3)
    fire_pit(0, 5.5, tod, r=0.6, lit=(tod == 'night'))
    for (x, yy, rz) in ((-2.6, 5.0, 75), (2.6, 5.0, -75), (0, 3.2, 0)):
        pcyl('LogSeat', 0.24, 2.0, (x, yy, 0.24), '#6a4a2a', tod, verts=10, rot=(0, 90, rz))
    stilt_hut(7.0, 9.5, tod, rot_z=-18)
    for x in (-9, -12):
        sol_palm(x, 9 + (x % 3), 8, tod, lean=10, seed=x, s=1.3)
    sol_palm(11.5, 6, 9, tod, lean=-12, seed=3, s=1.3)
    for x in (-4.5, 4.5):
        tiki(x, 7.5, tod, 2.0)
    leafy_plant(-7, 2, tod, s=1.4, seed=7)
    paint_sun(azimuth=-30, elevation=45 if tod == 'day' else 28, energy=4.0 if tod == 'day' else 1.6)
    tv_camera((0, -6.0, 2.4), (0, 10, 1.2), lens=26)


def si_ceremony(tod):
    """The Elimination Trial area (DC5): a fire on a diamond platform, tiki faces, torches, the bamboo fence, the village lights."""
    paint_mode(); tod = 'night'
    sol_backdrop(tod)
    ground_plane('#2a2a30', '#1e1e28', mottle=0.2)
    jungle_band(tod, 26, seed=8, palms=0.5)
    for k in range(9):
        card(uid('HutLight'), _blob_pts(0.35, 0.3, 10, 0, 0), 30, pmat('HutLight', '#ffd06a', unlit=True, mottle=0), x=-16 + k * 4, z=4 + (k % 3) * 1.2)
    me = bpy.data.meshes.new('Diamond'); bm = bmesh.new()
    vs = [bm.verts.new(p) for p in ((0, 2.0, 0.05), (6.5, 7.5, 0.05), (0, 13.0, 0.05), (-6.5, 7.5, 0.05))]
    bm.faces.new(vs); bm.to_mesh(me); bm.free()
    d = _link(bpy.data.objects.new('Diamond', me)); me.materials.append(pmat('DiamondP', '#b8642a', '#7a3a1a', mottle=0.3, mscale=0.6))
    brush_patch('Glow', 3.2, (0, 7.5), '#e8943a', sx=1.3, sy=1.0, seed=2, mottle=0.2, z=0.07)
    for k in range(10):
        a = k / 10 * 2 * math.pi
        pbox('PitStone', (0.5, 0.3, 0.25), (math.cos(a) * 1.3, 7.5 + math.sin(a) * 1.0, 0.18), '#5a5a5a', 'day', rot=(0, 0, math.degrees(a)))
    flame(0, 7.3, 0.25, 1.5)
    point('TrialFire', (0, 6.2, 1.6), 3200, '#ffa04a', radius=0.5)
    for x in range(-12, 13, 2):
        pbox('Fence', (0.18, 0.18, 1.4), (x, 15.5, 0.7), '#c8a050', tod)
    pbox('FenceRail', (26, 0.12, 0.12), (0, 15.4, 1.1), '#a8843a', tod)
    for k in range(6):
        pbox('Bench', (1.0, 0.6, 0.45), (-9.5 + k * 1.3, 4.5 + (k % 2) * 0.2, 0.22), '#a87a3a', 'day')
    tiki_face(-4.5, 12.5, 3.6, 'day', col='#c8903a', s=1.2)
    tiki_face(5.5, 11.5, 2.2, 'day', col='#8a6a3a', s=0.9, angry=False)
    for (x, yy) in ((-7.5, 10), (7.5, 9.5), (-10.5, 3), (10.5, 3)):
        tiki(x, yy, 'night', 2.6)
    leafy_plant(8.0, 12.0, 'day', s=1.4, seed=4)
    paint_sun(azimuth=-30, elevation=30, energy=1.6)
    tv_camera((0, -5.5, 4.0), (0, 11, 0.9), lens=26)


def si_beach(tod):
    paint_mode(); P = SOL[tod]
    sol_backdrop(tod)
    sol_ground(tod, sea_y=8)
    for (x, yy, l) in ((-5.0, 3, 12), (-8.5, 7, 10), (5.2, 2.5, -12), (8.8, 6.5, -10)):
        sol_palm(x, yy + 2, 5.6, tod, lean=l, seed=int(x * 3), s=1.2)
    card(uid('Island'), _blob_pts(14, 4, 30, 0.1, 3, flat_bottom=True), 90, pmat('IslandS' + tod, P['mtn'][1], unlit=True, mottle=0), x=-30, z=0)
    si_rock('Rock', (0.8, 0.6, 0.45), (3.5, 4.5, 0.15), tod, seed=3)
    si_rock('Rock', (0.6, 0.5, 0.35), (-2.5, 6.0, 0.1), tod, seed=4)
    pbox('Towel', (1.0, 2.0, 0.03), (2.0, 2.2, 0.02), '#e84a6a', tod, rot=(0, 0, 10))
    pcyl('Driftwood', 0.18, 3.0, (-3.0, 3.0, 0.16), '#c8b08a', tod, verts=10, rot=(0, 90, 25))
    leafy_plant(-6, 1, tod, s=1.4, seed=2)
    paint_sun(azimuth=-35, elevation=55 if tod == 'day' else 30, energy=4.0 if tod == 'day' else 1.6)
    tv_camera((0, -7.0, 1.8), (0, 14, 1.4), lens=26)


def si_shoreline(tod):
    paint_mode()
    sol_backdrop(tod)
    sol_ground(tod, sea_y=6)
    rnd = random.Random(5)
    for i in range(14):
        x = -14 + i * 2.1 + rnd.random()
        si_rock('Rock', (0.6 + rnd.random() * 0.9, 0.6, 0.4 + rnd.random() * 0.5), (x, 6.5 + rnd.random() * 2.5, 0.0), tod, col='#8a8a8a', seed=i, rot_z=rnd.random() * 90)
    for x in (-4.8, 5.2):
        sol_palm(x, 4, 5.6, tod, lean=10 if x < 0 else -10, seed=int(x * 3), s=1.2)
    pcyl('Driftwood', 0.2, 3.4, (2.5, 3.5, 0.18), '#c8b08a', tod, verts=10, rot=(0, 90, -30))
    paint_sun(azimuth=-40, elevation=42 if tod == 'day' else 28, energy=4.0 if tod == 'day' else 1.6)
    tv_camera((1.0, -6.5, 1.8), (0, 14, 1.0), lens=26)


def si_water(tod):
    """The water source: a pool under a waterfall in the jungle."""
    paint_mode()
    sol_backdrop(tod, mountains=False)
    sol_ground(tod)
    jungle_band(tod, 18, seed=7, palms=0.3)
    cliff = [(-7, 0), (-6, 4), (-4, 7), (-1.5, 8.5), (1.5, 8.2), (4, 7.2), (6.2, 4.5), (7, 0)]
    card(uid('Cliff'), cliff, 12, pmat('Cliff' + tod, N('#8a7a6a', tod), unlit=True, mottle=0.35, mscale=0.8))
    card(uid('CliffSh'), [(1.5, 8.2), (4, 7.2), (6.2, 4.5), (7, 0), (2.5, 0)], 11.95, pmat('CliffSh' + tod, N('#6a5a52', tod), unlit=True, mottle=0.2))
    card(uid('Moss'), _blob_pts(5, 0.8, 30, 0.2, 2), 11.9, pmat('Moss' + tod, N('#4a9a3a', tod), unlit=True, mottle=0.3), x=0, z=8.2)
    card(uid('Falls'), [(-0.9, 0), (0.9, 0), (0.8, 8.3), (-0.8, 8.3)], 11.8, pmat('Falls' + tod, N('#bff0f6', tod), unlit=True, mottle=0))
    for k in range(4):
        card(uid('FallsLine'), [(-0.05, 0.3), (0.05, 0.3), (0.05, 8.0), (-0.05, 8.0)], 11.79, pmat('FallsLine' + tod, N('#7ad8e8', tod), unlit=True, mottle=0), x=-0.55 + k * 0.36)
    brush_patch('Pool', 3.2, (0, 8.5), N('#3ac0d0', tod), sx=1.4, sy=0.8, seed=9, mottle=0.1)
    brush_patch('Foam', 1.1, (0, 10.2), N('#f2fbfc', tod), sx=1.3, sy=0.5, seed=4, mottle=0, z=0.016)
    for (x, yy) in ((-5, 6), (5.5, 6.5), (-7, 2), (7, 2.5)):
        leafy_plant(x, yy, tod, s=1.6, seed=int(x * 2))
    pcyl('Bucket', 0.25, 0.4, (2.6, 4.8, 0.2), '#9aa3ad', tod, r2=0.3, verts=16)
    paint_sun(azimuth=-20, elevation=60 if tod == 'day' else 35, energy=4.0 if tod == 'day' else 1.6)
    tv_camera((0, -5.0, 1.8), (0, 12, 2.6), lens=26)


def si_jungle(tod):
    """The jungle trail (DC5 Bamboo grove): bamboo on both sides, big leaves, a worn path."""
    paint_mode(); P = SOL[tod]
    sol_backdrop(tod)
    sol_ground(tod)
    brush_patch('Path', 3, (0, 6), P['path'], sx=0.9, sy=3.0, seed=5)
    rnd = random.Random(13)
    for r in range(4):
        y = 30 - r * 6
        x = -30
        while x < 30:
            if abs(x) > 2.0 + r * 0.5 or r == 0:
                bamboo(x, y, rnd.uniform(10, 16), tod, seed=int(x * 9 + r), s=1.2)
            x += rnd.uniform(0.6, 1.5)
    for (x, yy) in ((-4, 4), (4, 4.5), (-6.5, 2), (6.5, 2), (-3, 9), (3.2, 9.5)):
        leafy_plant(x, yy, tod, s=1.4, seed=int(x * 3 + yy))
    bamboo(-7.5, 1.0, 14, tod, seed=1, s=1.6); bamboo(7.8, 1.5, 14, tod, seed=2, s=1.6)
    paint_sun(azimuth=-15, elevation=62 if tod == 'day' else 35, energy=4.0 if tod == 'day' else 1.6)
    tv_camera((0.2, -6.0, 1.8), (0, 18, 2.4), lens=26)


def si_fishing(tod):
    paint_mode()
    sol_backdrop(tod)
    sol_ground(tod, sea_y=5)
    for i, (x, yy, sx, sz) in enumerate(((-2.0, 6.4, 1.3, 0.8), (0.8, 7.6, 1.8, 1.1), (3.2, 6.7, 1.1, 0.6))):
        si_rock('FishRock', (sx, 1.1, sz), (x, yy, 0.1), tod, col='#9a958a', seed=i + 20, rot_z=i * 35)
    pcyl('Spear', 0.035, 2.6, (0.8, 7.6, 1.9), '#c8b06a', tod, verts=6, rot=(12, 0, 0))
    for x in (-5.2, -2.8):
        pcyl('NetStick', 0.05, 1.8, (x, 3.2, 0.9), '#c8b06a', tod, verts=6)
    for i in range(6):
        pbox('Net', (2.4, 0.03, 0.03), (-4.0, 3.2, 0.5 + i * 0.22), '#e6d49a', tod, ink=False)
    for i in range(7):
        pbox('Net', (0.03, 0.03, 1.2), (-5.0 + i * 0.33, 3.2, 1.05), '#e6d49a', tod, ink=False)
    pbox('Canoe', (3.0, 0.8, 0.4), (3.6, 2.6, 0.2), '#b8784a', tod, rot=(0, 0, 15))
    pbox('CanoeIn', (2.6, 0.55, 0.1), (3.6, 2.6, 0.38), '#7a4a2a', tod, rot=(0, 0, 15), ink=False)
    for x in (-5.4, 5.8):
        sol_palm(x, 3.5, 5.6, tod, lean=12 if x < 0 else -12, seed=int(x) + 50, s=1.2)
    paint_sun(azimuth=-35, elevation=48 if tod == 'day' else 30, energy=4.0 if tod == 'day' else 1.6)
    tv_camera((0, -6.0, 1.8), (0, 12, 1.0), lens=26)


def cannon(loc, tod, rot_z=0):
    """The Cannon of Shame: a big iron barrel on a wooden carriage, aimed out over the water."""
    g = _group(uid('Cannon'), loc, rot_z)
    def add(ob):
        _child(g, ob)
        return ob
    add(pbox('Carriage', (1.4, 2.6, 0.7), (0, 0, 0.6), '#7a5232', tod))
    for x in (-0.8, 0.8):
        for y in (-0.8, 0.8):
            add(pcyl('Wheel', 0.55, 0.18, (x, y, 0.55), '#5a3a20', tod, verts=16, rot=(0, 90, 0)))
    add(pcyl('Barrel', 0.55, 4.0, (0, 0.9, 1.6), '#3d4048', tod, verts=24, rot=(-65, 0, 0), r2=0.48))
    add(pcyl('Muzzle', 0.62, 0.3, (0, 2.6, 2.4), '#4a4d56', tod, verts=24, rot=(-65, 0, 0)))
    return g


def si_exit(tod):
    paint_mode(); tod = 'night'
    sol_backdrop(tod)
    sol_ground(tod, sea_y=4)
    plank_floor('Dock', (4.5, 14, 0.32), (0, 9, 0.42), '#8a6440', tod, axis='y', step=0.4)
    for yy in range(6, 16, 3):
        for xx in (-2.1, 2.1):
            pcyl('Piling', 0.13, 1.8, (xx, yy, -0.3), '#6a4a2e', tod, verts=10)
    cannon((0, 10.5, 0.58), tod)
    for x in (-2.0, 2.0):
        tiki(x, 6.0, tod, 1.6)
    for x in (-6.5, 6.5):
        sol_palm(x, 0, 8, tod, lean=12 if x < 0 else -12, seed=int(x) + 70, s=1.3)
    paint_sun(azimuth=-30, elevation=28, energy=1.6)
    tv_camera((-1.5, -5.0, 2.8), (0.5, 12, 0.9), lens=27)


def si_confessional(tod):
    """The confessional: a thatched bamboo outhouse, seen from the camera on the door."""
    paint_mode()
    W, D, H = 2.6, 2.1, 3.0
    painted_room(W, D, H, 'day', wall='#a8844a', floor='#7a5a3a', ceil='#8a6a3a', plank=0.18, wall_seam='#6a5228', floor_seam='#5a4028')
    pbox('Bench', (W - 0.2, 0.9, 0.75), (0, D - 0.5, 0.38), '#8a6a3a')
    pbox('BenchTop', (W - 0.1, 1.0, 0.08), (0, D - 0.5, 0.78), '#b8945a')
    card(uid('Lid'), _blob_pts(0.48, 0.5, 36, 0, 0), D - 0.12, pmat('LidS', '#c8a46a', unlit=True, mottle=0.4, mscale=3), x=0, z=1.3)
    tiki_face(-0.85, D - 0.45, 1.5, 'day', col='#b87a3a', s=0.4)
    pcyl('Roll', 0.08, 0.18, (W / 2 - 0.16, D - 0.55, 1.25), '#f2eee4', verts=16, rot=(0, 90, 0))
    pbox('Window', (1.2, 0.06, 0.5), (0.3, D - 0.12, H - 0.7), '#7ad8a8', mottle=0, unlit=True, ink=False)
    leafy_plant(0.6, D - 0.15, 'day', s=0.5, seed=3)
    room_light(azimuth=-20, elevation=60, energy=3.0)
    paint_sky('#c8b890', '#c8b890')
    tv_camera((0.0, -0.4, 1.6), (0, D, 1.4), lens=18)


SCENES['survival-island'] = {
    'shelter': si_shelter, 'campfire': si_campfire, 'beach': si_beach, 'shoreline': si_shoreline,
    'water-source': si_water, 'jungle-trail': si_jungle, 'fishing-area': si_fishing,
    'confessional': si_confessional, 'ceremony': si_ceremony, 'exit': si_exit,
}
OUTDOOR['survival-island'] = {'shelter', 'campfire', 'beach', 'shoreline', 'water-source', 'jungle-trail', 'fishing-area'}

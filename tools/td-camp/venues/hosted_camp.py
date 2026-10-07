# ══════════════════════════════════════════════════════════════════════
# venues/hosted_camp.py — Camp Wawanakwa, painted the way Total Drama Island paints it
# ══════════════════════════════════════════════════════════════════════
# Reference: the TDI background plates on the Total Drama Wiki ("Camp Wawanakwa":
# Background2 the cabins, Background4/Cwawdock the dock, Background6 the dock at night,
# TDIcampfire the ceremony). Olive grass with ochre worn paths; grey clapboard cabins on
# cinder blocks; pines as flat navy, blue and teal cut-outs; purple mountains; the cliff.

TDI = {
    'day': {'sky': '#7cc6ea', 'sky_low': '#d2ecf2', 'grass': '#a8963e', 'grass_sh': '#7f7234', 'path': '#c49a4a', 'fg': '#8a7a32',
            'pines': ('#6a8ac0', '#4a6aa8', '#3a5590', '#2f4072'), 'ridge': ('#8a7cb0', '#6e6aa2'), 'crown': '#4f7a42', 'birch': '#c8a042',
            'dark': '#26324a', 'water': '#3fb0b0', 'water_far': '#5ac0bc', 'sand': '#ecd8a6', 'cloud': '#eef3fb', 'rim': '#b9c6e0', 'rock': '#a0705a'},
    'night': {'sky': '#26304f', 'sky_low': '#3d4a72', 'grass': '#4a4a3a', 'grass_sh': '#38384a', 'path': '#5f5440', 'fg': '#34323a',
              'pines': ('#3a5272', '#2f4466', '#283a5a', '#1f2a46'), 'ridge': ('#4a4a72', '#3a3a62'), 'crown': '#2f3f3a', 'birch': '#5a5a48',
              'dark': '#141a2c', 'water': '#1f4a5a', 'water_far': '#2a5a6a', 'sand': '#7a7468', 'cloud': '#5a6a90', 'rim': '#3e4a70', 'rock': '#4f3f48'},
}


def tdi_backdrop(tod, far_y=60, ridge=True, sun_at=(-28, 62), clouds=True):
    P = TDI[tod]
    paint_sky(P['sky'], P['sky_low'])
    if ridge:
        ridge_card(far_y + 60, -150, 150, 14, 34, P['ridge'][0], seed=3, humps=3, teeth=10, tooth_col=_mix_hex(P['ridge'][0], P['sky'], 0.12))
        ridge_card(far_y + 40, -120, 120, 6, 22, P['ridge'][1], seed=7, humps=4, teeth=14, tooth_col=_mix_hex(P['ridge'][1], '#2a2a5a', 0.1))
    if tod == 'day':
        swirl_sun(sun_at[0], far_y + 80, sun_at[1] * 0.5, 4.0, tod)
    else:
        swirl_sun(sun_at[0], far_y + 80, sun_at[1] * 0.5, 3.0, tod)
        rnd = random.Random(9)
        for i in range(60):
            card(uid('Star'), _blob_pts(0.18, 0.18, 8, 0, 0), far_y + 85, pmat('StarP', '#f4f0d8', unlit=True, mottle=0),
                 x=rnd.uniform(-90, 90), z=rnd.uniform(14, 60))
    if clouds:
        for (cx, cz, cs) in ((-46, 40, 5.5), (18, 50, 4.2), (64, 36, 3.6)):
            curly_cloud(cx, far_y + 78, cz, cs, P['cloud'], P['rim'])


def pine_rows(tod, y0, y1, x0=-60, x1=60, seed=1, gap=(2.6, 6.0), h=(6, 12), rows=4, skip=None):
    """Rows of flat pines, the farthest the palest, the nearest the darkest."""
    P = TDI[tod]; rnd = random.Random(seed)
    for r in range(rows):
        y = y1 - (y1 - y0) * r / max(rows - 1, 1)
        col = P['pines'][min(r, 3)]
        x = x0 + rnd.random() * 4
        while x < x1:
            if rnd.random() < 0.3:          # gaps, so the mountains show between the stands
                x += rnd.uniform(4, 10); continue
            if not (skip and skip(x, y)):
                hh = rnd.uniform(*h) * (0.8 + 0.25 * r / rows)
                c = '#3f9aae' if rnd.random() < 0.12 else col          # the odd teal pine, as the show paints them
                pine_card(x, y, hh, hh * rnd.uniform(0.28, 0.4), c, seed=int(x * 7 + r * 131), teeth=rnd.randint(3, 5), lean=rnd.uniform(-0.4, 0.4))
            x += rnd.uniform(*gap)


def pc_cabins(tod):
    """The cabins (TDI Background2): two clapboard cabins across a worn yard, pines and mountains behind."""
    paint_mode(); P = TDI[tod]
    ground_plane(P['grass'], P['grass_sh'])
    brush_patch('Path', 5.2, (0.6, 3.0), P['path'], sx=1.5, sy=0.8, seed=3)
    brush_patch('Path', 2.2, (3.8, 7.4), P['path'], sx=0.9, sy=1.2, seed=8)
    brush_patch('FgShade', 14, (0, -11.5), P['fg'], sx=1.6, sy=0.6, seed=5, mottle=0.2, z=0.016)
    tdi_backdrop(tod, far_y=60)
    pine_rows(tod, 20, 48, -70, 70, seed=4)
    for (sx, sy) in ((-3.5, 2.0), (-1.2, 1.2), (1.2, 1.4), (3.5, 2.2), (-2.0, 4.5), (0.4, 4.0), (2.8, 5.0), (-5.0, 5.5), (5.6, 6.5), (0.0, 7.0)):
        stand(sx, sy)
    tdi_cabin((-6.0, 10.0, 0), tod, rot_z=-14, stairs_side=1)
    tdi_cabin((6.4, 13.0, 0), tod, rot_z=16, w=6.4, stairs_side=-1)
    crown_tree(-10.5, 13, 6.5, P['crown'], seed=2, s=2.2)
    crown_tree(0.8, 16, 5.5, P['birch'], seed=4, s=1.6, birch=True)
    crown_tree(11.0, 15, 5.2, P['birch'], seed=6, s=1.7, birch=True)
    umbrella_pine(-7.0, 2.5, 9.5, col='#2f4a34', trunk='#3a2018', seed=5, s=1.5)
    twisted_pine(9.2, 24, 15, P['dark'], seed=3, s=2.4, flip=True)
    rock_shelf(-6.4, -3.2, 3.2, 1.8, 0.55, P['rock'], seed=2)
    stump_ = cyl('Stump', 0.45, 0.55, (6.0, 0.4, 0.27), pmat('StumpP' + tod, C('#7a4a32', tod), mottle=0.3), verts=10, bevel=0); inked(stump_)
    inked(cyl('StumpTop', 0.43, 0.03, (6.0, 0.4, 0.56), pmat('StumpTopP' + tod, C('#c89a62', tod), mottle=0.2), verts=10, bevel=0))
    barrel = cyl('Barrel', 0.36, 0.8, (-7.6, 6.0, 0.4), pmat('BarrelP', '#5a6e3e', mottle=0.3), verts=14, bevel=0); inked(barrel)
    for (fx, fy, fc) in ((-2.2, -3.0, '#e2943a'), (-0.8, -3.6, '#e8b04a'), (2.4, -3.2, '#e2943a'), (4.0, -2.4, '#e8b04a')):
        flower(fx, fy, C(fc, tod) if tod == 'night' else fc)
    paint_sun(azimuth=-40, elevation=42 if tod == 'day' else 30, energy=4.0 if tod == 'day' else 2.0)
    if tod == 'night':
        string_lights((-2.4, 3.6, 2.8), (2.6, 3.8, 2.8), n=14, sag=0.5)
    tv_camera((0.4, -9.5, 2.6), (0.4, 12, 2.2), lens=26)


def far_shore(tod, y=70, cliff=True, seed=2):
    """The far shore across the lake: low hills with pines, the big cliff."""
    P = TDI[tod]
    ridge_card(y + 30, -150, 150, 4, 16, P['ridge'][0], seed=seed, humps=4, teeth=40, tooth_col=_mix_hex(P['ridge'][0], '#2a2a5a', 0.1))
    ridge_card(y, -150, 150, 0, 7, N('#7a8a52', tod), seed=seed + 5, humps=6, teeth=70, tooth_col=N('#4a6a5a', tod))
    if cliff:
        pts = [(-14, 0), (-10, 4), (-6, 9), (-2, 14), (2, 18.5), (4.5, 20), (6, 19), (7.5, 12), (9, 0)]
        card(uid('Cliff'), pts, y - 2, pmat('Cliff' + tod, N('#7a8a52', tod), unlit=True, mottle=0.3, mscale=0.5), x=24)
        face = [(1.8, 0), (2.2, 9), (3.5, 16), (4.6, 19.2), (6, 18.6), (7.4, 12), (9, 0)]
        card(uid('CliffFace'), face, y - 2.1, pmat('CliffFace' + tod, N('#b89a6a', tod), unlit=True, mottle=0.35, mscale=0.6), x=24)
        card(uid('CliffSh'), [(5.2, 0), (6, 18.6), (7.4, 12), (9, 0)], y - 2.2, pmat('CliffSh' + tod, N('#8a6e5a', tod), unlit=True, mottle=0.2), x=24)


def tdi_outhouse(x, y, tod, rot_z=0, s=1.0):
    g = _group(uid('Outhouse'), (x, y, 0), rot_z)
    def add(ob):
        _child(g, ob)
        return ob
    add(pbox('OutBody', (1.5 * s, 1.5 * s, 2.5 * s), (0, 0, 1.25 * s), '#7a7450', tod, mottle=0.35, mscale=0.8))
    add(pbox('OutRoof', (1.9 * s, 1.9 * s, 0.14), (0, 0.05, 2.6 * s), '#5a5236', tod, rot=(-12, 0, 0)))
    add(pbox('OutDoor', (1.0 * s, 0.06, 2.0 * s), (0, -0.77 * s, 1.05 * s), '#8a8258', tod, mottle=0.3))
    add(pbox('OutVent', (1.0 * s, 0.07, 0.3 * s), (0, -0.78 * s, 2.25 * s), '#c8c8a0', tod, mottle=0, ink=False))
    for k in range(4):
        add(pbox('Lattice', (0.03, 0.08, 0.42 * s), (-0.38 * s + k * 0.25 * s, -0.8 * s, 2.25 * s), '#5a5236', tod, rot=(0, 40, 0), ink=False))
    add(pbox('Handle', (0.06, 0.08, 0.2), (0.35 * s, -0.82 * s, 1.0 * s), '#3a3424', tod, ink=False))
    return g


def pc_grounds(tod):
    """The camp grounds (TDI Main lodge + the confessional clearing): the lodge across the yard, the outhouse aside."""
    paint_mode(); P = TDI[tod]
    ground_plane(P['grass'], P['grass_sh'])
    brush_patch('Path', 6.0, (0.5, 4.0), P['path'], sx=1.6, sy=0.8, seed=11)
    brush_patch('Path', 2.6, (-2.5, 9.0), P['path'], sx=1.0, sy=1.1, seed=12)
    brush_patch('FgShade', 14, (0, -11.5), P['fg'], sx=1.6, sy=0.6, seed=15, mottle=0.2, z=0.016)
    tdi_backdrop(tod, far_y=60)
    pine_rows(tod, 22, 50, -70, 70, seed=14)
    tdi_cabin((-2.5, 12.0, 0), tod, rot_z=-12, w=10.0, d=6.0, h=3.0, stairs_side=-1)
    pbox('Chimney', (1.0, 1.0, 6.2), (2.6, 13.6, 3.1), '#8a8a8a', tod, mottle=0.4, mscale=1.6)
    tdi_outhouse(7.6, 6.5, tod, rot_z=-18)
    for (sx, sy) in ((-3.5, 2.0), (-1.2, 1.4), (1.2, 1.6), (3.5, 2.4), (-2.4, 5.0), (0.6, 4.6), (3.0, 6.0), (-5.5, 4.0), (5.2, 3.6)):
        stand(sx, sy)
    crown_tree(10.2, 10, 5.5, P['birch'], seed=21, s=1.8, birch=True)
    crown_tree(-11.0, 15, 6.0, P['crown'], seed=22, s=2.2)
    umbrella_pine(12.5, 16, 12, col='#3f5a46', trunk='#3a2018', seed=23, s=1.8)
    umbrella_pine(-8.0, 3.0, 9.0, col='#2f4a34', trunk='#3a2018', seed=24, s=1.4)
    twisted_pine(-13, 26, 15, P['dark'], seed=25, s=2.4)
    rock_shelf(5.0, -3.0, 2.6, 1.6, 0.45, P['rock'], seed=26)
    pcyl('Chopping', 0.36, 0.55, (-4.6, 1.5, 0.27), '#7a4a32', tod, verts=10)
    for (fx, fy, fc) in ((-2.0, -3.4, '#e2943a'), (1.2, -3.0, '#e8b04a'), (3.0, -3.8, '#e2943a')):
        flower(fx, fy, N(fc, tod))
    paint_sun(azimuth=-40, elevation=42 if tod == 'day' else 30, energy=4.0 if tod == 'day' else 2.0)
    if tod == 'night':
        lamp_post((1.6, 7.0, 0), 2.8, tod)
    tv_camera((0.4, -9.5, 2.5), (0.4, 12, 2.4), lens=26)


def pc_mess(tod):
    """The mess hall (TDI TD12): roof trusses, the stone fireplace with the antlers, long orange tables, Chef's counter."""
    paint_mode()
    W, D, H = 14.0, 12.0, 5.0
    painted_room(W, D, H, 'day', wall='#8a5e36', floor='#b8904a', ceil='#4a3020')
    brush_patch('Rug', 2.0, (0, 6.0), '#d8b858', sx=1.0, sy=3.2, seed=3, mottle=0.2, z=0.012)
    beam = '#4f321e'
    for y in (2.5, 5.5, 8.5, 11.5):
        for sx in (-1, 1):
            pbox('Truss', (W / 2 + 0.4, 0.3, 0.3), (sx * W / 4, y, H - 0.5), beam, rot=(0, sx * 18, 0))
        pbox('TieBeam', (W, 0.3, 0.3), (0, y, H - 1.3), beam)
    pbox('Fireplace', (2.6, 1.2, 3.6), (0, D - 0.6, 1.8), '#d8d2c0', mottle=0.5, mscale=2.0)
    pbox('Chimney', (1.6, 1.0, 2.0), (0, D - 0.5, 4.4), '#d8d2c0', mottle=0.5, mscale=2.0)
    pbox('Hearth', (1.4, 0.2, 1.1), (0, D - 1.21, 0.75), '#3a2a20', ink=False)
    flame(0, D - 1.25, 0.3, 0.6)
    sk = pmat('Antler', '#ece4d0', unlit=True, mottle=0)
    for sx in (-1, 1):
        card(uid('Antler'), [(0, 0), (sx * 0.9, 0.5), (sx * 1.3, 1.1), (sx * 1.0, 0.7), (sx * 0.7, 1.0), (sx * 0.5, 0.45), (0, 0.2)], D - 1.25, sk, x=0, z=3.2)
    card(uid('Skull'), _blob_pts(0.32, 0.4, 20, 0.05, 1), D - 1.26, sk, x=0, z=3.05)
    for x in (-3.0, 3.0):
        pbox('Table', (1.2, 6.0, 0.14), (x, 6.0, 0.78), '#d8843a', mottle=0.3)
        for yy in (3.3, 8.7):
            pbox('TLeg', (1.0, 0.12, 0.72), (x, yy, 0.38), '#6a3e22')
        for bx in (x - 0.95, x + 0.95):
            pbox('Bench', (0.4, 5.8, 0.1), (bx, 6.0, 0.46), '#6a3e22')
            for sy in (3.6, 5.0, 6.4, 7.8):
                seat(bx, sy, 0.52)
    pbox('Door', (0.08, 1.3, 2.4), (-W / 2 + 0.12, 3.0, 1.2), '#e8c040', mottle=0.2)
    for yy in (6.0, 8.5):
        pbox('Window', (0.08, 1.8, 1.4), (-W / 2 + 0.12, yy, 2.4), '#d8d870', mottle=0, unlit=True)
        pbox('WinBar', (0.1, 0.08, 1.4), (-W / 2 + 0.14, yy, 2.4), '#4f321e', ink=False)
    pbox('Counter', (1.4, 5.0, 1.1), (W / 2 - 0.9, 7.0, 0.55), '#7a5a3a')
    pbox('CounterTop', (1.6, 5.2, 0.1), (W / 2 - 0.9, 7.0, 1.12), '#c8c0a8', mottle=0.1)
    pbox('Board', (0.08, 2.6, 1.5), (W / 2 - 0.12, 8.0, 2.6), '#4f6a4a', mottle=0.3)
    for yy in (5.4, 6.2, 7.0):
        pcyl('Pot', 0.22, 0.4, (W / 2 - 0.9, yy, 1.37), '#9aa0a8', verts=14)
    for x, y in ((-3.0, 4.0), (3.0, 4.0), (-3.0, 8.5), (3.0, 8.5)):
        pcyl('LampCord', 0.015, 1.2, (x, y, H - 0.7), '#2a2a2a', ink=False)
        pcyl('LampShade', 0.42, 0.3, (x, y, H - 1.4), '#5a6a5a', r2=0.12, verts=16)
        card(uid('LampGlow'), _blob_pts(0.36, 0.08, 16, 0, 0), y - 0.01, pmat('LampGlow', '#fff2c0', unlit=True, mottle=0), x=x, z=H - 1.58)
    for sy in (1.5, 3.0, 4.5, 7.0):
        stand(0, sy)
    room_light(azimuth=-60, elevation=50, energy=3.5)
    paint_sky('#c8b890', '#c8b890')
    tv_camera((0.0, -1.0, 2.0), (0, D, 1.8), lens=22)


def tdi_boat(x, y, tod, rot_z=90):
    """The Boat of Losers: a red tug with a white stripe, a white cabin, a black funnel, yellow fenders."""
    g = _group(uid('Boat'), (x, y, 0), rot_z)
    def add(ob):
        _child(g, ob)
        return ob
    me = bpy.data.meshes.new('Hull'); bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts:
        v.co.x *= 8.0; v.co.y *= 3.0; v.co.z *= 1.3
        if v.co.x > 0: v.co.y *= 0.4
        if v.co.z < 0: v.co.y *= 0.75
    bm.to_mesh(me); bm.free()
    h = _link(bpy.data.objects.new(uid('Hull'), me)); h.location = (0, 0, 0.4)
    me.materials.append(pmat('Hull' + tod, N('#b8302a', tod), mottle=0.25)); h['ink'] = 1; add(h)
    add(pbox('Stripe', (7.6, 2.95, 0.22), (-0.2, 0, 0.7), '#ece4d6', tod, ink=False))
    add(pbox('BoatCabin', (3.0, 2.0, 1.6), (-1.6, 0, 1.85), '#ece4d6', tod))
    add(pbox('CabinRoof', (3.3, 2.3, 0.14), (-1.6, 0, 2.72), '#8a2a24', tod))
    add(pbox('CabinWin', (3.04, 1.6, 0.42), (-1.6, 0, 2.1), '#2a3a5a' if tod == 'day' else '#ffd27a', 'day', mottle=0, unlit=tod == 'night'))
    add(pcyl('Funnel', 0.32, 1.4, (-2.4, 0, 3.4), '#2a2a30', tod, verts=14))
    for k in range(4):
        add(pcyl('Fender', 0.2, 0.5, (-2.6 + k * 1.5, -1.25, 0.6), '#e8c040', tod, verts=10, rot=(90, 0, 0)))
    return g


def pc_dock(tod, shame=False):
    """The dock (TDI TD04 / Cwawdock / Background6): standing on the planks, the lake and the far shore ahead."""
    paint_mode(); P = TDI[tod]
    tdi_backdrop(tod, far_y=80, ridge=False)
    far_shore(tod, y=90)
    water_plane(tod, col=P['water'], far=P['water_far'])
    ground_plane(P['sand'], size=(200, 30), loc=(0, -22, 0), mottle=0.2)
    plank_floor('Dock', (4.0, 26, 0.3), (0, 9.0, 0.35), '#9a7046', tod, axis='y', step=0.4, seam='#4a3424')
    plank_floor('DockEnd', (12, 4.0, 0.3), (0, 23.5, 0.35), '#8a6440', tod, axis='x', step=0.45, seam='#4a3424')
    for yy in range(-3, 22, 3):
        for xx in (-2.1, 2.1):
            pcyl('Piling', 0.16, 2.0 if yy % 2 else 1.2, (xx, yy, 0.4), '#6a4a2e', tod, verts=10)
    for xx in (-5.8, -3.0, 3.0, 5.8):
        pcyl('Piling', 0.18, 1.6, (xx, 25.4, 0.6), '#6a4a2e', tod, verts=10)
    pbox('Broken', (1.0, 0.4, 0.08), (-4.5, 22.0, 0.52), '#8a6440', tod, rot=(0, 14, 20))
    wood_sign(7.0, 3.0, 1.9, 3.0, 0.8, 'WAWANAKWA', tod, col='#c8b080', txt='#b83a2a', post_h=1.6)
    for sd in (-1, 1):                               # the shore bends round both sides of the dock
        brush_patch('Bank', 7.0, (sd * 12.5, 1.0), P['grass'], sx=1.0, sy=1.1, seed=11 + sd, mottle=0.3, z=0.02)
        brush_patch('BankSand', 7.6, (sd * 12.0, 0.4), P['sand'], sx=1.0, sy=1.1, seed=13 + sd, mottle=0.2, z=0.01)
        rock_shelf(sd * 6.8, 2.5, 1.6, 1.0, 0.35, P['rock'], seed=20 + sd)
    twisted_pine(-10.5, 3.0, 11, P['dark'], seed=7, s=2.0)
    umbrella_pine(11.0, 4.5, 11, col=N('#3f5a46', tod), trunk=N('#3a2018', tod), seed=8, s=1.6)
    crown_tree(-13.5, 6.5, 5.0, P['crown'], seed=9, s=1.8)
    for yy in (0.5, 2.5, 4.5, 7.0, 10.0):
        for xx in (-0.9, 0.9):
            stand(xx, yy, 0.5)
    if tod == 'night' or shame:
        for yy in (4, 10, 16, 22):
            for xx in (-2.2, 2.2):
                tiki(xx, yy, 'night', 2.0)
    if shame:
        tdi_boat(6.4, 17.0, tod, rot_z=80)
    paint_sun(azimuth=-30, elevation=40 if tod == 'day' else 28, energy=4.0 if tod == 'day' else 2.0)
    tv_camera((0.0, -3.5, 2.2), (0, 30, 1.2), lens=26)


def pc_shame(tod):
    pc_dock('night', shame=True)


def pc_campfire(tod, ceremony=False):
    """The campfire pit (TDI Campfire / TDIcampfire): a clearing on the cliff top, rows of stumps, the oil drum, the crooked sign."""
    paint_mode(); P = TDI[tod]
    tdi_backdrop(tod, far_y=70)
    water_plane(tod, y0=30, col=P['water'], far=P['water_far'], streaks=10)
    far_shore(tod, y=80, cliff=False, seed=4)
    ground_plane(P['grass'] if tod == 'day' else '#5a4a3a', P['grass_sh'] if tod == 'day' else '#3a3040', size=(60, 40), loc=(0, 6, 0))
    if tod == 'night':
        brush_patch('Glow', 5.5, (0, 7.5), '#8a5a3e', sx=1.4, sy=0.9, seed=2, mottle=0.25)
        brush_patch('Glow', 3.0, (0, 8.6), '#b0663a', sx=1.3, sy=0.8, seed=3, mottle=0.2, z=0.014)
    for k, (yy, col) in enumerate(((-2.0, '#8a5a52'), (-3.2, '#6a4248'))):
        pbox('Ledge', (40, 1.4, 1.2), (0, yy, -0.6 - k * 0.9), col, tod, mottle=0.3, mscale=0.8)
    rock_shelf(-11.5, 8, 6, 5, 4.5, N('#8a5a5a', tod), seed=31, layers=4)
    rock_shelf(-13.5, 14, 6, 5, 7.0, N('#7a4e56', tod), seed=32, layers=5)
    stump_row(-4.2, 4.2, 4, 3, 2.1, 1.6, tod, seed=5)       # room between stumps for a camper on each
    fire_pit(0.0, 9.6, tod, r=0.65, lit=(tod == 'night'))
    oil_drum(3.6, 10.6, tod)
    mark('host', (3.6, 10.6, 1.12))
    for (sx, sy) in ((-5.5, 4.0), (5.0, 4.0), (-5.0, 8.5), (5.8, 8.0), (2.0, 11.8), (-2.0, 11.8)):
        stand(sx, sy)
    if ceremony:
        pcyl('Plate', 0.36, 0.04, (3.6, 10.6, 1.12), '#ece4d6', tod, verts=24)
        for i in range(7):
            a = i / 7 * 2 * math.pi
            pcyl('Mallow', 0.07, 0.11, (3.6 + math.cos(a) * 0.2, 10.6 + math.sin(a) * 0.2, 1.2), '#fbf7ee', 'day', verts=10, ink=False)
    for sx in (5.2, 9.2):
        pbox('ArchPost', (0.24, 0.24, 3.4), (sx, 13.0, 1.7), '#5a3a22', tod)
    pbox('ArchBoard', (5.4, 0.18, 0.7), (7.2, 12.9, 3.2), '#7a4a2a', tod, rot=(0, -6, 0))
    pbox('ArchBoard2', (4.2, 0.16, 0.5), (7.0, 12.85, 2.6), '#8a5a32', tod, rot=(0, 4, 0))
    crown_tree(-6.0, 16, 5.0, P['birch'], seed=33, s=1.5, birch=True)
    for k, x in enumerate((11.5, 13.5, 15.5)):
        umbrella_pine(x, 15 + k, 12 + k, col=N('#3f6a4a', tod), trunk=N('#3a2018', tod), seed=34 + k, s=1.6)
    if tod == 'night':
        string_lights((-7, 12.5, 4.2), (5.2, 13.0, 3.3), n=22, sag=0.9)
        for x, y in ((-6.5, 3.5), (6.5, 3.5), (-6.0, 12.0)):
            tiki(x, y, tod, 2.2)
    paint_sun(azimuth=-35, elevation=40 if tod == 'day' else 28, energy=4.0 if tod == 'day' else 1.6)
    tv_camera((0.0, -3.0, 3.6), (0.3, 12, -0.4), lens=26)


def pc_ceremony(tod):
    pc_campfire('night', ceremony=True)


def pc_trail(tod):
    """The woods (TDI Woods): tall trunks, flat-topped pines, an old twisted tree, a worn path."""
    paint_mode(); P = TDI[tod]
    tdi_backdrop(tod, far_y=50, clouds=False)
    ground_plane(P['grass'], P['grass_sh'])
    brush_patch('Path', 3.0, (0.3, 4.0), P['path'], sx=0.9, sy=2.4, seed=41)
    brush_patch('Path', 1.6, (1.5, 13.0), P['path'], sx=0.8, sy=1.8, seed=42)
    for (sx, sy) in ((-1.2, 1.5), (1.2, 1.8), (-0.6, 4.0), (1.0, 4.5), (0.2, 7.0), (1.6, 11.0)):
        stand(sx, sy)
    brush_patch('FgShade', 14, (0, -10.5), P['fg'], sx=1.6, sy=0.6, seed=43, mottle=0.2, z=0.016)
    rnd = random.Random(44)
    for r in range(3):
        y = 34 - r * 8
        col = P['pines'][1 + r]
        x = -40
        while x < 40:
            hgt = rnd.uniform(14, 22)
            card(uid('TrunkBg'), [(-0.25, 0), (0.25, 0), (0.15, hgt), (-0.15, hgt)], y, pmat('TrunkBg' + col, col, unlit=True, mottle=0), x=x)
            if rnd.random() < 0.6:
                card(uid('Disc'), _blob_pts(rnd.uniform(1.4, 2.4), 0.45, 24, 0.2, int(x * 10)), y - 0.02,
                     pmat('DiscBg' + col, _mix_hex(col, '#6a8a8a', 0.2), unlit=True, mottle=0.3), x=x + rnd.uniform(-1, 1), z=hgt * rnd.uniform(0.6, 0.9))
            x += rnd.uniform(2.0, 4.5)
    tcol = N('#5a3a24', tod)
    card(uid('BigTrunk'), [(-0.8, 0), (0.9, 0), (0.6, 3), (1.2, 6), (0.4, 9), (0.0, 12), (-0.5, 9), (-1.1, 6), (-0.4, 3)], 18,
         pmat('BigTrunk' + tod, tcol, unlit=True, mottle=0.3), x=1.5)
    for (cx, cz, s) in ((-1.5, 9, 1.9), (2.8, 10.5, 2.1), (0.5, 13, 2.0), (4.5, 7.5, 1.5), (-3.2, 7, 1.4)):
        card(uid('Crown'), _blob_pts(1.4 * s, 1.0 * s, 36, 0.18, int(cx * 10)), 17.9, pmat('OchreCrown' + tod, N('#b8902e', tod), unlit=True, mottle=0.55, mscale=2.5), x=1.5 + cx, z=cz)
    for x, y in ((-7, 10), (8, 9), (-11, 5), (12, 4)):
        umbrella_pine(x, y, rnd.uniform(9, 12), col=N('#3f5a52', tod), trunk=N('#3a2018', tod), seed=int(x * 3), s=1.6)
    twisted_pine(-9, 2.5, 10, P['dark'], seed=45, s=2.0)
    crown_tree(9.5, 3.0, 4.5, P['crown'], seed=46, s=1.6)
    pcyl('Log', 0.3, 3.0, (-3.5, 6.0, 0.3), '#6a4228', tod, verts=10, rot=(0, 90, 20))
    paint_sun(azimuth=-25, elevation=55 if tod == 'day' else 30, energy=4.0 if tod == 'day' else 2.0)
    tv_camera((0.3, -7.0, 1.8), (0.6, 18, 3.2), lens=24)


def pc_confessional(tod):
    """The confession cam (TDI TD15): the outhouse from the camera taped to the door — the seat, the roll, the lattice, the fly strip."""
    paint_mode()
    W, D, H = 2.6, 2.1, 3.0
    painted_room(W, D, H, 'day', wall='#8a7a4a', floor='#6a5a3a', ceil='#4a4028', plank=0.36, wall_seam='#5a4e30', floor_seam='#4a3e28')
    pbox('Bench', (W - 0.2, 0.9, 0.75), (0, D - 0.5, 0.38), '#7a6a42')
    pbox('BenchTop', (W - 0.1, 1.0, 0.08), (0, D - 0.5, 0.78), '#9a8a5a')
    seat(0, D - 0.5, 0.82)
    card(uid('Lid'), _blob_pts(0.48, 0.5, 36, 0, 0), D - 0.12, pmat('Lid', '#b8945a', unlit=True, mottle=0.4, mscale=3), x=0, z=1.3)
    card(uid('LidRing'), _blob_pts(0.52, 0.54, 36, 0, 0), D - 0.11, pmat('LidRing', '#7a5a32', unlit=True, mottle=0), x=0, z=1.3)
    pbox('Shelf', (W - 0.3, 0.3, 0.06), (0, D - 0.25, 1.95), '#9a8a5a')
    pcyl('Roll', 0.08, 0.18, (-0.85, D - 0.22, 2.05), '#f2eee4', verts=16, rot=(0, 90, 0))
    pcyl('Roll2', 0.08, 0.16, (W / 2 - 0.16, D - 0.55, 1.25), '#f2eee4', verts=16, rot=(0, 90, 0))
    pbox('LatticeBg', (W - 0.3, 0.06, 0.5), (0, D - 0.13, H - 0.55), '#e6e6c8', mottle=0, unlit=True, ink=False)
    for k in range(9):
        pbox('Lattice', (0.04, 0.05, 0.75), (-W / 2 + 0.3 + k * 0.27, D - 0.16, H - 0.55), '#6a5e3a', rot=(0, 45, 0), ink=False)
        pbox('Lattice', (0.04, 0.05, 0.75), (-W / 2 + 0.3 + k * 0.27, D - 0.165, H - 0.55), '#6a5e3a', rot=(0, -45, 0), ink=False)
    pbox('FlyStrip', (0.12, 0.03, 0.8), (0.85, D - 0.3, H - 0.9), '#e8a83a', mottle=0)
    for k in range(5):
        card(uid('Fly'), _blob_pts(0.03, 0.03, 8, 0, 0), D - 0.35, pmat('Fly', '#1a1a1a', unlit=True, mottle=0), x=0.83 + (k % 2) * 0.05, z=H - 1.2 + k * 0.13)
    ptext('X X', (0.55, D - 0.115, 1.55), 0.16, '#5a4a2a')
    room_light(azimuth=-20, elevation=60, energy=3.0)
    paint_sky('#c8b890', '#c8b890')
    tv_camera((0.0, -0.4, 1.6), (0, D, 1.4), lens=18)


SCENES['hosted-camp'] = {'communal-grounds': pc_grounds, 'cabins': pc_cabins, 'mess-hall': pc_mess, 'dock': pc_dock,
                         'campfire': pc_campfire, 'forest-trail': pc_trail, 'confessional': pc_confessional,
                         'ceremony': pc_ceremony, 'exit': pc_shame}
OUTDOOR['hosted-camp'] = {'communal-grounds', 'cabins', 'dock', 'campfire', 'forest-trail'}

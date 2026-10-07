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
        pbox('Window', (0.08, 1.8, 1.4), (-W / 2 + 0.12, yy, 2.4), '#d8d870' if tod == 'day' else '#1f2a4a', mottle=0, unlit=True)
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
    room_light(azimuth=-60, elevation=50, energy=3.5 if tod == 'day' else 2.0)
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


# ── the rest of Camp Wawanakwa (2026-10-07: "where is the rest… the interior of the cabin, the
# canteen, the lake": every place the show films goes on a plate) ──────────────────────────────

# ── TDI references for the places added 2026-10-07 (the user: "the camp bedroom doesn't look at all like
# Total Drama… always copy the one from TD"). Each is built against the show's own frames on the Total Drama
# Wiki: TDI_Ep08_Bridgette_Courtney_Cabin / TD09 / Cabininsidedoor (the cabin), Bathroom_Sketch (TDI-005 BG
# sc.117) / Bathroomstalls (the washrooms), BeachFullHD / Lake_Wawanakwa (the beach), Cliffhilledge (the cliff).

def _tdi_bunk(x, y, tod, flip=False):
    """A TDI bunk: square dark-brown posts, thick rails, khaki mattresses with a brown end band, the yellow pillow with its green stripe."""
    post, rail = '#5a3a22', '#7a4e2c'
    for dx in (-1.05, 1.05):
        for dy in (-0.48, 0.48):
            pbox('BunkPost', (0.14, 0.14, 2.3), (x + dx, y + dy, 1.15), post, tod)
    for z in (0.5, 1.65):
        pbox('BunkRail', (2.2, 1.04, 0.16), (x, y, z), rail, tod)
        pbox('Mattress', (2.0, 0.92, 0.2), (x, y, z + 0.18), '#b8a878', tod, mottle=0.25)
        pbox('MatBand', (0.5, 0.94, 0.21), (x + (0.62 if flip else -0.62), y, z + 0.185), '#9a6a3a', tod, mottle=0.2)
        px = x + (-0.72 if flip else 0.72)
        pbox('Pillow', (0.5, 0.7, 0.2), (px, y, z + 0.38), '#f0d870', tod, mottle=0.15)
        pbox('PillowStripe', (0.08, 0.72, 0.21), (px + 0.12, y, z + 0.385), '#8aa860', tod, mottle=0, ink=False)
    pbox('Twine', (0.06, 0.06, 0.3), (x + 1.05, y - 0.48, 1.2), '#c8a060', tod, ink=False)


def pc_cabin_inside(tod):
    """Inside a cabin (TDI ep. 8, Bridgette and Courtney): olive plank walls under the sloped roof, bunks on the left,
    the black wood stove and its pipe at the back, the yellow dresser, the coat hooks, the fly strip, the round
    rug with the green sunburst, the window with the torn red curtain, the screen door with the yellow lattice."""
    paint_mode()
    W, D, H = 10.0, 8.0, 3.6
    night = tod == 'night'
    painted_room(W, D, H, tod, wall='#7a6e48', floor='#8a6a4e', ceil='#3e3626', plank=0.42, wall_seam='#4f4630', floor_seam='#5e4632')
    # the roof slopes in over both side walls, its rafters showing
    for sx in (-1, 1):
        pbox('RoofSlope', (2.6, D, 0.2), (sx * (W / 2 - 1.1), D / 2, H - 0.45), '#4f4630', tod, rot=(0, sx * 32, 0), ink=False)
        for y in (1.5, 3.5, 5.5, 7.5):
            pbox('Rafter', (2.8, 0.16, 0.18), (sx * (W / 2 - 1.1), y, H - 0.35), '#3a3020', tod, rot=(0, sx * 32, 0))
    for y in (2.5, 6.0):
        pbox('TieBeam', (W, 0.2, 0.22), (0, y, H - 0.2), '#3a3020', tod)
    # grain patches, the show's darker blotches on the boards
    for (bx, bz, s) in ((-3.2, 2.4, 1.0), (2.4, 1.5, 1.3), (3.8, 2.6, 0.8), (-1.2, 0.9, 0.7)):
        card(uid('Grain'), _blob_pts(0.7 * s, 0.45 * s, 24, 0.3, int(bx * 10)), D - 0.12, pmat('GrainP' + tod, N('#665a3a', tod), unlit=True, mottle=0.3), x=bx, z=bz)
    # the bunks, two along the left wall, one along the right
    _tdi_bunk(-W / 2 + 1.2, 2.4, tod); _tdi_bunk(-W / 2 + 1.2, 5.4, tod)
    _tdi_bunk(W / 2 - 1.2, 2.6, tod, flip=True)
    for (sx, sy) in ((-W / 2 + 1.0, 2.3), (-W / 2 + 1.0, 5.3), (W / 2 - 1.0, 2.5)):
        seat(sx, sy, 0.75)
    # the wood stove and its pipe up through the roof
    pbox('Stove', (1.1, 0.8, 1.15), (0.0, D - 0.7, 0.62), '#3a3a40', tod)
    pbox('StoveTop', (1.2, 0.9, 0.1), (0.0, D - 0.7, 1.24), '#2a2a30', tod)
    pbox('StoveGrill', (0.7, 0.04, 0.22), (0.0, D - 1.11, 0.95), '#55555e', tod, ink=False)
    pbox('StoveDoor', (0.6, 0.04, 0.32), (0.0, D - 1.11, 0.4), '#4a4a52', tod)
    for dx in (-0.45, 0.45):
        pbox('StoveLeg', (0.1, 0.1, 0.12), (dx, D - 0.7, 0.06), '#2a2a30', tod)
    pcyl('StovePipe', 0.14, H - 1.3, (0.0, D - 0.75, 1.3 + (H - 1.3) / 2), '#55555e', tod, verts=12)
    pcyl('Kettle', 0.16, 0.22, (-0.9, D - 0.9, 0.11), '#4a4a52', tod, verts=12)
    # the yellow dresser and the picture over it; the coat hooks
    pbox('Dresser', (1.6, 0.6, 1.1), (2.2, D - 0.45, 0.55), '#e8c43a', tod, mottle=0.2)
    for z in (0.3, 0.6, 0.9):
        pbox('Drawer', (1.5, 0.04, 0.02), (2.2, D - 0.76, z + 0.12), '#b8902a', tod, ink=False)
    pbox('Picture', (1.0, 0.05, 1.3), (2.2, D - 0.14, 2.1), '#9ad0d0', tod, mottle=0.2, rot=(0, -6, 0))
    pbox('Hooks', (1.4, 0.08, 0.12), (3.9, D - 0.14, 1.8), '#9a6a3a', tod)
    for k in range(4):
        pbox('Hook', (0.05, 0.12, 0.2), (3.4 + k * 0.33, D - 0.2, 1.65), '#3a3a40', tod, ink=False)
    pbox('FlyStrip', (0.1, 0.03, 0.9), (-1.6, D - 1.4, H - 0.75), '#e8a83a', tod, mottle=0)
    # the window with the torn red curtain; the screen door with the yellow lattice
    win = '#f8e0a8' if not night else '#26304f'
    pbox('Window', (1.1, 0.06, 1.1), (-2.4, D - 0.12, 2.0), win, 'day', mottle=0, unlit=True)
    pbox('WinSill', (1.4, 0.2, 0.1), (-2.4, D - 0.2, 1.42), '#b8a878', tod)
    pbox('WinBar', (1.1, 0.08, 0.06), (-2.4, D - 0.14, 2.0), '#4f4630', tod, ink=False)
    card(uid('Curtain'), [(-0.7, 0.55), (0.7, 0.55), (0.7, 0.1), (0.45, -0.15), (0.2, 0.2), (0.0, -0.45), (-0.25, 0.05), (-0.55, -0.1), (-0.7, 0.2)], D - 0.18,
         pmat('CurtainP' + tod, N('#b8584a', tod), unlit=True, mottle=0.2), x=-2.4, z=2.2)
    pbox('Door', (1.0, 0.06, 2.2), (W / 2 - 0.12, 5.6, 1.1), '#7a4e2c', tod, rot=(0, 0, 90))
    for z in (0.65, 1.55):
        pbox('Lattice', (0.7, 0.04, 0.7 if z > 1 else 0.6), (W / 2 - 0.15, 5.6, z), '#e8c050' if not night else '#5a4a30', 'day', mottle=0.1, unlit=True, rot=(0, 0, 90))
    # the round rug with the green sunburst
    pcyl('Rug', 1.9, 0.02, (0.4, 3.4, 0.01), '#c89a4a', tod, verts=40, ink=False)
    pcyl('RugMid', 1.6, 0.02, (0.4, 3.4, 0.02), '#e8cc78', tod, verts=40, ink=False)
    for k in range(16):
        a = k / 16 * 2 * math.pi
        pcyl('RugRay', 0.24, 0.02, (0.4 + math.cos(a) * 1.22, 3.4 + math.sin(a) * 1.22, 0.03), '#8aa860', tod, verts=3, ink=False, rot=(0, 0, math.degrees(a)))
    pcyl('RugCentre', 0.95, 0.02, (0.4, 3.4, 0.035), '#a8b468', tod, verts=40, ink=False)
    # the lamp, and the shaft of light it throws on the back wall
    pcyl('LampCord', 0.015, 0.7, (0.6, 4.2, H - 0.35), '#2a2a2a', ink=False)
    pcyl('Lamp', 0.4, 0.28, (0.6, 4.2, H - 0.85), '#4a5a4a', tod, r2=0.1, verts=16)
    card(uid('LampGlow'), _blob_pts(0.36, 0.07, 16, 0, 0), 4.19, pmat('LampGlow', '#fff2c0', unlit=True, mottle=0), x=0.6, z=H - 1.0)
    card(uid('Shaft'), [(-0.6, H - 1.0), (1.4, H - 1.0), (4.8, 0.0), (-3.0, 0.0)], D - 0.13,
         pmat('ShaftP' + tod, N('#a89a68', tod), unlit=True, mottle=0.15, alpha=0.55), x=0.6, z=0)
    for (sx, sy) in ((-1.0, 1.6), (0.8, 1.8), (-0.4, 3.4), (1.6, 3.2), (-1.4, 5.0), (0.6, 5.2)):
        stand(sx, sy)
    room_light(azimuth=-40, elevation=55, energy=3.2 if not night else 1.6)
    paint_sky('#3e3626', '#3e3626')
    tv_camera((0.0, -1.6, 1.8), (0.0, D, 1.6), lens=20)


def _sandstone(x, y, w, h, tod, seed=0, grass=True):
    """The show's sandstone shelf: a slab with diagonal cleavage lines, olive grass lying over its top."""
    P = TDI[tod]
    rnd = random.Random(seed)
    face = [(-w / 2, 0), (w / 2, 0), (w / 2 - w * 0.08, h * 0.85), (w * 0.1, h), (-w / 2 + w * 0.05, h * 0.92)]
    card(uid('Slab'), face, y, pmat('SlabP' + tod, N('#a89e80', tod), unlit=True, mottle=0.2, mscale=0.6), x=x)
    for k in range(5):
        lx = -w / 2 + w * (k + 0.5 + rnd.uniform(-0.2, 0.2)) / 5
        card(uid('Cleave'), [(lx, 0.05), (lx + 0.08, 0.05), (lx + h * 0.55 + 0.08, h * 0.9), (lx + h * 0.55, h * 0.9)], y - 0.02,
             pmat('CleaveP' + tod, N('#7e7660', tod), unlit=True, mottle=0), x=x)
    if grass:
        top = [(-w / 2 - 0.5, h * 0.86), (w * 0.15, h * 1.02), (w / 2 + 0.6, h * 0.82), (w / 2 + 0.6, h * 1.5), (-w / 2 - 0.5, h * 1.7)]
        card(uid('GrassLid'), top, y - 0.04, pmat('GrassLidP' + tod, P['grass'], unlit=True, mottle=0.35, mscale=1.0), x=x)


def _disc_tree(x, y, h, tod, seed=0, s=1.0):
    """The tall blue-trunked tree of the TDI shoreline: a thin trunk with flat green discs of leaves."""
    rnd = random.Random(seed)
    tm = pmat('BlueTrunk' + tod, N('#3a4a8a', tod), unlit=True, mottle=0)
    card(uid('Trunk'), [(-0.1 * s, 0), (0.1 * s, 0), (0.06 * s, h), (-0.06 * s, h)], y, tm, x=x)
    for k in range(rnd.randint(2, 3)):
        zz = h * (0.62 + k * 0.14); dx = rnd.uniform(-0.6, 0.6) * s
        card(uid('Disc'), _blob_pts((1.0 + rnd.random() * 0.5) * s, 0.28 * s, 28, 0.15, seed + k), y - 0.02 - k * 0.01,
             pmat('GreenDisc' + tod, N('#7ab07a', tod), mottle=0.4, mscale=3, unlit=True), x=x + dx, z=zz)


def pc_beach(tod):
    """The beach (BeachFullHD; Lake_Wawanakwa): pale sand, behind it the sandstone shelf with olive grass on top,
    tall blue-trunked trees with flat green discs, rust bushes, a birch; to the right the open lake, its far
    islands round navy hills furred with pines over sandstone ledges."""
    paint_mode(); P = TDI[tod]
    paint_sky(P['sky'], P['sky_low'])
    for (cx, cz, cs) in ((-30, 34, 3.2), (24, 40, 2.6), (60, 30, 2.4)):
        curly_cloud(cx, 140, cz, cs, P['cloud'], P['rim'])
    # the far islands across the lake
    for (ix, iw, ih, seed) in ((26, 34, 9, 3), (70, 28, 7, 5), (-8, 18, 5, 7)):
        card(uid('Isle'), _blob_pts(iw / 2, ih, 40, 0.05, seed, flat_bottom=True), 130, pmat('IsleP' + tod, N('#4a5a92', tod), unlit=True, mottle=0.1), x=ix, z=0)
        for k in range(int(iw * 1.2)):
            t = k / (iw * 1.2); px = ix - iw / 2 + iw * t
            pz = ih * math.sqrt(max(0.0, 1 - ((t - 0.5) * 2) ** 2)) - 0.6
            pine_card(px, 129.9, 3.0, 1.0, N('#38487a', tod), seed=seed * 50 + k, teeth=2, z=pz)
        card(uid('IsleLedge'), [(-iw * 0.28, 0), (iw * 0.05, 0), (-iw * 0.02, ih * 0.45), (-iw * 0.25, ih * 0.35)], 129.8,
             pmat('LedgeP' + tod, N('#a89e80', tod), unlit=True, mottle=0.2), x=ix + iw * 0.2, z=0)
    water_plane(tod, y0=6, col='#2aa8a4' if tod == 'day' else '#1f4a5a', far='#3cc0b8' if tod == 'day' else '#2a5a6a')
    ground_plane('#f6e0b6' if tod == 'day' else '#7a7468', N('#e0c898', tod), size=(200, 40), loc=(0, -14, 0), mottle=0.15)
    brush_patch('WetSand', 30, (6, 5.6), N('#e8cfa0', tod), sx=2.5, sy=0.1, seed=3, mottle=0.1)
    # the shoreline on the left (BeachFullHD): the long sandstone bank, the hill rising gently over it toward the
    # woods, rows of the show's flat pines behind, the tall blue-trunked trees and the rust bushes on the grass
    _tdi_pines(-34, 4, 22, 10, 4.4, '#8a94cc', tod, seed=61, gap=0.6)
    _tdi_pines(-30, 0, 16, 8.5, 3.8, '#6c7ab8', tod, seed=62, gap=0.6)
    _bank(-26, 2.5, 5.6, 1.6, 2.6, tod, seed=4, rise=0.5)
    for k, (tx, ty, th) in enumerate(((-12.0, 9.5, 10), (-10.2, 10.2, 11.5), (-8.6, 10.8, 9.5), (-14, 11.4, 11))):
        _disc_tree(tx, ty, th, tod, seed=40 + k, s=1.0)
    for (bx, by, bc, bs) in ((-6.5, 7.6, '#a8582e', 1.1), (-17.0, 8.6, '#9a7a32', 1.3), (2.6, 5.0, '#c87a3a', 0.8)):
        card(uid('Bush'), _blob_pts(bs, bs * 0.62, 30, 0.2, int(bx * 3), flat_bottom=True), by, pmat('Bush' + bc + tod, N(bc, tod), unlit=True, mottle=0.5, mscale=2.5), x=bx, z=0.15 if bx > 0 else 2.6)
    crown_tree(12.0, 13.0, 6.0, N('#b8902e', tod), seed=71, s=1.8, birch=True)
    # what is on the sand: a driftwood log, a canoe drawn up, two towels
    pcyl('Driftwood', 0.28, 4.2, (-3.6, 3.2, 0.26), '#a08a6a', tod, verts=10, rot=(0, 90, 12))
    for dx in (-5.0, -3.8, -2.6):
        seat(dx, 3.0, 0.52)
    pbox('Canoe', (3.6, 0.8, 0.4), (4.6, 4.6, 0.22), '#c8502a', tod, rot=(0, 0, -18))
    pbox('CanoeIn', (3.2, 0.6, 0.06), (4.6, 4.6, 0.42), '#7a3a22', tod, rot=(0, 0, -18), ink=False)
    for (tx, ty, tc) in ((0.6, 1.2, '#e84a6a'), (2.2, 0.6, '#4ac8c8')):
        pbox('Towel', (1.6, 0.8, 0.02), (tx, ty, 0.01), tc, tod, mottle=0.1, rot=(0, 0, 8))
    for (rx, ry) in ((7.0, 3.0), (-6.5, 6.0)):
        pbox('Pebble', (0.5, 0.4, 0.3), (rx, ry, 0.15), '#8a8270', tod, rot=(0, 0, 20))
    for (sx, sy) in ((-1.4, 1.0), (1.2, 1.4), (-0.4, 3.0), (2.4, 3.2), (-2.6, 5.0), (0.8, 5.2)):
        stand(sx, sy)
    if tod == 'night':
        fire_pit(-1.2, 6.0, tod, r=0.45, lit=True)
        rnd = random.Random(9)
        for i in range(50):
            card(uid('Star'), _blob_pts(0.18, 0.18, 8, 0, 0), 140, pmat('StarP', '#f4f0d8', unlit=True, mottle=0), x=rnd.uniform(-90, 90), z=rnd.uniform(16, 60))
    paint_sun(azimuth=-30, elevation=40 if tod == 'day' else 26, energy=4.0 if tod == 'day' else 1.8)
    tv_camera((0.0, -6.5, 2.0), (0, 30, 1.6), lens=26)


def _fringe(xs, zs, y, col, tod, depth=0.35, seed=0, name='Fringe'):
    """A grass fringe hanging over an edge: a row of small sharp teeth under a line of points."""
    rnd = random.Random(seed)
    m = pmat(name + col + tod, N(col, tod), unlit=True, mottle=0.25, mscale=2.0)
    pts = list(zip(xs, zs))
    under = []
    for i in range(len(xs) - 1, -1, -1):
        under.append((xs[i], zs[i] - depth * (0.35 + 0.65 * rnd.random()) * (1 if i % 2 else 0.25)))
    card(uid(name), pts + under, y, m)


def _bank(x0, x1, y, rock_h, hill_h, tod, seed=0, rise='left'):
    """The TDI shoreline bank (BeachFullHD): a long low band of sandstone cut by slanting cleavage lines, its top
    edge broken into facets, and over it a smooth olive hill that rises gently away, its front edge a grass fringe."""
    P = TDI[tod]; rnd = random.Random(seed)
    n = 18
    xs = [x0 + (x1 - x0) * i / n for i in range(n + 1)]
    # the rock's top: facets, each a short straight run at its own small slope
    rt = []
    z = rock_h
    for i, x in enumerate(xs):
        if i % 3 == 0: z = rock_h * (0.75 + 0.35 * rnd.random())
        rt.append(z + (rnd.random() - 0.5) * 0.08)
    # the bank runs out into the sand at its right end in two slanting facets
    rt[-1] = 0.0; rt[-2] = rock_h * 0.35; rt[-3] = min(rt[-3], rock_h * 0.75)
    card(uid('BankRock'), [(x0, -0.3)] + list(zip(xs, rt)) + [(x1, -0.3)], y, pmat('BankRock' + tod, N('#aaa082', tod), unlit=True, mottle=0.18, mscale=0.6))
    for k in range(int((x1 - x0) / 1.6)):
        lx = x0 + 0.8 + k * 1.6 + rnd.uniform(-0.3, 0.3)
        top = rock_h * 0.9
        card(uid('Cleave'), [(lx, 0.0), (lx + 0.07, 0.0), (lx + top * 0.75 + 0.07, top), (lx + top * 0.75, top)], y - 0.02,
             pmat('Cleave' + tod, N('#837a60', tod), unlit=True, mottle=0))
    # a lighter top bevel along the facets, the show's sunlit rock edge
    card(uid('Bevel'), list(zip(xs, rt)) + [(x, z - 0.18) for x, z in reversed(list(zip(xs, rt)))], y - 0.03,
         pmat('Bevel' + tod, N('#c6bc9a', tod), unlit=True, mottle=0))
    # the hill: rises smoothly away, its front edge just over the rock top, a fringe hanging over the rock
    # a mound that crests where `rise` says (a fraction along the bank) and slopes down to the rock both ways
    crest = 0.62 if rise == 'left' else rise
    def hz(u): return (hill_h * math.exp(-((u - crest) / 0.3) ** 2) + 0.3) * min(1.0, (1 - u) / 0.18) ** 0.7
    ht = [rt[i] + 0.15 + hz(i / n) for i in range(n + 1)]
    card(uid('Hill'), list(zip(xs, [r + 0.1 for r in rt])) + list(reversed(list(zip(xs, ht)))), y + 0.4,
         pmat('BankHill' + tod, P['grass'], unlit=True, mottle=0.35, mscale=0.9))
    _fringe(xs, [r + 0.16 for r in rt], y - 0.05, '#8a8a36', tod, depth=0.32, seed=seed + 3)
    return list(zip(xs, ht))


def _tdi_pines(x0, x1, y, h, w, col, tod, seed=0, gap=0.8):
    """A row of the show's background pines: wide flat triangles with a few saw teeth, standing shoulder to shoulder."""
    rnd = random.Random(seed); x = x0
    while x < x1:
        hh = h * rnd.uniform(0.75, 1.15)
        pine_card(x, y + rnd.uniform(-0.4, 0.4), hh, w * rnd.uniform(0.85, 1.1), N(col, tod), seed=int(x * 13) + seed, teeth=4)
        x += w * gap * rnd.uniform(0.8, 1.1)


def _hemlock(x, y, h, col, tod, seed=0, s=1.0, lean=0.0):
    """The drooping pine of the TDI cliffs (Cliffhilledge): a thin trunk and tiers of crescent-shaped branches
    whose tips hang down, the tiers narrowing toward the top."""
    rnd = random.Random(seed)
    m = pmat('Hemlock' + col + tod, N(col, tod), unlit=True, mottle=0.2, mscale=2.0)
    card(uid('HemTrunk'), [(-0.09 * s, 0), (0.09 * s, 0), (lean + 0.03 * s, h), (lean - 0.03 * s, h)], y, m, x=x)
    tiers = 7
    for k in range(tiers):
        t = k / (tiers - 1)
        zz = h * (0.22 + 0.74 * t); w = (2.6 - 2.1 * t) * s; cx = x + lean * (zz / h)
        sag = (0.35 + 0.25 * (1 - t)) * s; thick = 0.22 * s
        n = 24; top, bot = [], []
        for i in range(n + 1):
            u = i / n; xx = -w / 2 + w * u
            arch = math.sin(u * math.pi)
            top.append((xx, thick * arch - sag * (1 - arch) ** 2))
            bot.append((xx, -thick * 0.4 * arch - sag * (1 - arch) ** 2 - 0.12 * s * (1 - arch)))
        card(uid('HemTier'), top + list(reversed(bot)), y - 0.01 - k * 0.002, m, x=cx, z=zz)


def _flat_poly(name, pts, z, col, tod, mottle=0.3, mscale=0.6):
    """A flat painted shape lying on the ground (x, y points)."""
    me = bpy.data.meshes.new(name); bm = bmesh.new()
    vs = [bm.verts.new((px, py, 0)) for px, py in pts]
    bm.faces.new(vs); bm.to_mesh(me); bm.free()
    ob = _link(bpy.data.objects.new(uid(name), me)); ob.location = (0, 0, z)
    me.materials.append(pmat(name + col + tod, N(col, tod), mottle=mottle, mscale=mscale))
    return ob


def pc_cliff(tod):
    """The cliff (Cliffhilledge), painted the way the show paints it: the olive top in front running out to a curved
    lip on the right; under the lip the sandstone face hangs away, cut by slanting strata; drooping hemlocks on the
    top; past the edge and far below, rows of blue-violet pines under soft round hills."""
    paint_mode(); P = TDI[tod]; day = tod == 'day'
    paint_sky('#8ec8ea' if day else P['sky'], '#cfe6f0' if day else P['sky_low'])
    ridge_card(300, -300, 300, 10, 30, N('#b8b4dc', tod), seed=71, humps=2)
    for k, (yy, col, base) in enumerate(((220, '#a4acd8', -4), (165, '#8e9ad0', -12), (120, '#7480c2', -20), (85, '#5c68aa', -27))):
        ridge_card(yy, -260, 300, base, 10, N(col, tod), seed=80 + k, humps=2 + k, teeth=90, tooth_col=N(_mix_hex(col, '#2a2a5a', 0.14), tod))
    pbox('ValleyFloor', (700, 500, 1.0), (40, 200, -40), '#4e5a98', tod, mottle=0.1, mscale=0.2, ink=False)
    # the lip: a curve from the near right, receding to the left into the distance
    lip = [(4.2 - 0.18 * i + 0.35 * math.sin(i * 0.9), -4.0 + i * 2.2) for i in range(21)]
    top = [(-60, -6)] + [(-60, 60)] + list(reversed(lip))
    _flat_poly('CliffTop', [(-60, -6.0), (lip[0][0], -6.0)] + lip + [(-60, lip[-1][1])], 0.0, P['grass'], tod, mottle=0.35, mscale=0.7)
    # the face, hanging under the lip: one painted wall following the lip, its own sandstone strata on it
    rnd = random.Random(5)
    for i in range(len(lip) - 1):
        (x0, y0), (x1, y1) = lip[i], lip[i + 1]
        dx, dy = x1 - x0, y1 - y0; L = math.hypot(dx, dy); ang = math.degrees(math.atan2(dy, dx))
        drop = 24 + 2 * math.sin(i)
        face = [(0, 0.0), (L, 0.0), (L + 0.6, -drop * 0.35), (L + 1.2, -drop), (-0.2, -drop), (0.4, -drop * 0.35)]
        card(uid('Face'), face, 0, pmat('FaceP' + tod, N('#b6aa86' if i % 3 else '#a99d7c', tod), unlit=True, mottle=0.2, mscale=0.5), x=x0, z=-0.05, rot_z=ang)
        if i % 2 == 0:
            s = rnd.uniform(5, 12)
            card(uid('Strata'), [(0.3, -0.5), (0.45, -0.5), (0.45 + s * 0.3, -0.5 - s), (0.3 + s * 0.3, -0.5 - s)], 0, pmat('Strata' + tod, N('#7c7258', tod), unlit=True, mottle=0),
                 x=x0 + 0.02, z=-0.04, rot_z=ang)
        # the sunlit band right under the lip and the grass fringe hanging over it
        card(uid('Bevel'), [(0, -0.05), (L, -0.05), (L, -0.42), (0, -0.42)], 0, pmat('FBevel' + tod, N('#d2c8a6', tod), unlit=True, mottle=0), x=x0 + 0.01, z=0, rot_z=ang)
        for t in range(4):
            u = (t + 0.5) * L / 4; d = 0.3 + 0.35 * rnd.random()
            card(uid('Tuft'), [(u - 0.28, 0.02), (u + 0.28, 0.02), (u + 0.04, -d)], 0, pmat('Tuft' + tod, N('#8a8a36', tod), unlit=True, mottle=0), x=x0 + 0.02, z=0, rot_z=ang)
    # on the top: round rocks, rust bushes, the hemlocks, one leaning out toward the lip
    for (rx, ry, rs) in ((-4.5, 5.0, 0.7), (-0.8, 8.0, 0.55), (1.2, 2.0, 0.45)):
        icorock(uid('Rock'), (rs * 1.3, rs, rs * 0.7), (rx, ry, rs * 0.3), N('#8a7a6a', tod), seed=int(rx * 7) + 3)
    for (bx, by, bc) in ((-7.5, 11.0, '#a8582e'), (-2.4, 14.0, '#9a7a32')):
        card(uid('Bush'), _blob_pts(1.3, 0.8, 30, 0.2, int(bx * 3), flat_bottom=True), by, pmat('Bush' + bc + tod, N(bc, tod), unlit=True, mottle=0.5, mscale=2.5), x=bx, z=0.2)
    for k, (px, py, ph, ln) in enumerate(((-9.0, 16, 12, 0.0), (-5.6, 19, 14, 0.3), (-1.8, 15, 10.5, 0.0), (2.4, 11, 9, 0.9))):
        _hemlock(px, py, ph, '#2c3d5c', tod, seed=95 + k, s=1.15, lean=ln)
    for k, (px, py, ph) in enumerate(((-13.0, 26, 12), (-7.5, 28, 13), (-17, 24, 11))):
        pine_card(px, py, ph, ph * 0.45, N('#6a78b8', tod), seed=120 + k, teeth=5)
    for (sx, sy) in ((-3.0, 0.8), (-0.8, 2.0), (-4.6, 2.8), (-2.0, 4.0), (0.8, 4.4)):
        stand(sx, sy)
    if not day:
        for i in range(60):
            card(uid('Star'), _blob_pts(0.18, 0.18, 8, 0, 0), 320, pmat('StarP', '#f4f0d8', unlit=True, mottle=0), x=rnd.uniform(-160, 220), z=rnd.uniform(30, 120))
    else:
        for (cx2, cz, cs) in ((-30, 70, 4.0), (70, 80, 3.2)):
            curly_cloud(cx2, 290, cz, cs, P['cloud'], P['rim'])
    paint_sun(azimuth=-30, elevation=40 if day else 26, energy=4.0 if day else 1.8)
    tv_camera((7.5, -9.0, 2.2), (0.0, 20, -0.8), lens=26)


def pc_washroom(tod):
    """The communal washrooms (TDI-005 BG sc.117, the concept sketch; Bathroomstalls, the stalls): grey-green plank
    walls under open beams, a long speckled counter with three sinks on S-bend pipes, the cracked mirror under a
    bare bulb, fly strips, the paper-towel box, the bin, big scattered floor tiles round a drain, and along the
    right the olive plank stall doors in their grey metal frames."""
    paint_mode()
    W, D, H = 9.0, 7.0, 3.6
    painted_room(W, D, H, 'day', wall='#9aa88a', floor='#c8ccb4', ceil='#6a7462', plank=0.5, wall_seam='#7a8a6a', floor_seam='#b4b89e')
    for y in (2.0, 4.5):
        pbox('Beam', (W, 0.22, 0.24), (0, y, H - 0.25), '#6a5a3e')
    for x in (-2.5, 0.0, 2.5):
        pbox('Rafter', (0.2, D, 0.2), (x, D / 2, H - 0.05), '#6a5a3e')
    # the counter, three sinks, the pipes under it
    pbox('Counter', (5.2, 0.9, 0.16), (-0.6, D - 0.6, 1.0), '#b8bcaa', mottle=0.5, mscale=3.0)
    pbox('CounterLip', (5.3, 0.08, 0.22), (-0.6, D - 1.06, 0.95), '#9aa08a')
    for k, x in enumerate((-2.2, -0.6, 1.0)):
        pbox('Sink', (0.9, 0.6, 0.06), (x, D - 0.6, 1.09), '#e8ece4', mottle=0.05)
        pbox('SinkBowl', (0.7, 0.42, 0.04), (x, D - 0.62, 1.1), '#a8b0b0', mottle=0, ink=False)
        pcyl('Tap', 0.04, 0.22, (x, D - 0.25, 1.2), '#a8b0b8', ink=False)
        pcyl('Pipe', 0.05, 0.75, (x, D - 0.6, 0.55), '#8a9090')
        pcyl('PipeBend', 0.07, 0.12, (x + 0.1, D - 0.6, 0.35), '#8a9090', rot=(0, 90, 0))
    for sx in (-3.1, 1.9):
        pbox('Bracket', (0.1, 0.8, 0.5), (sx, D - 0.6, 0.7), '#7a7a6a', rot=(0, 0, 0))
    # the cracked mirror and the bare bulb; the shelf with the toothbrush cup
    pbox('Mirror', (1.6, 0.05, 1.5), (-0.6, D - 0.13, 2.1), '#cfe0e0', mottle=0.05, unlit=True)
    pbox('MirrorRim', (1.7, 0.04, 1.6), (-0.6, D - 0.11, 2.1), '#5a5a4a', ink=False)
    card(uid('Crack'), [(-0.5, 0.6), (-0.1, 0.1), (0.25, 0.3), (0.55, -0.6), (0.5, -0.62), (0.2, 0.25), (-0.12, 0.05), (-0.52, 0.58)], D - 0.16,
         pmat('CrackP', '#7a8888', unlit=True, mottle=0), x=-0.6, z=2.1)
    pcyl('Bulb', 0.1, 0.16, (-0.6, D - 0.18, 3.0), '#fff2c0', unlit=True, verts=12)
    pbox('Shelf', (0.9, 0.3, 0.06), (1.6, D - 0.2, 1.6), '#9a8a6a')
    pcyl('Cup', 0.08, 0.2, (1.5, D - 0.2, 1.73), '#9ac8c8', verts=10)
    # fly strips, the paper-towel box on the left wall, the bin under it
    for (fx, fy) in ((-3.6, 1.5), (1.4, D - 0.8)):
        pbox('FlyStrip', (0.08, 0.03, 1.0), (fx, fy, H - 0.75), '#e8a83a', mottle=0)
    pbox('Towels', (0.12, 0.6, 0.6), (-W / 2 + 0.16, 3.4, 1.7), '#e4e4d8')
    pbox('Bin', (0.6, 0.6, 0.8), (-W / 2 + 0.6, 3.4, 0.4), '#6a7a5a')
    pbox('BinLid', (0.7, 0.7, 0.12), (-W / 2 + 0.6, 3.4, 0.86), '#5a6a4a', rot=(0, 8, 0))
    # the stalls along the right wall: olive plank doors, grey frames, one door ajar
    for k, y in enumerate((1.6, 3.0, 4.4)):
        pbox('StallFrame', (0.12, 0.12, 2.3), (W / 2 - 2.1, y - 0.7, 1.15), '#8a948a')
        ajar = k == 1
        pbox('StallDoor', (0.08, 1.2, 1.8), (W / 2 - 2.1 - (0.45 if ajar else 0), y - (0.1 if ajar else 0), 1.0), '#6a7442', mottle=0.35,
             rot=(0, 0, 35 if ajar else 0))
        pbox('Latch', (0.04, 0.06, 0.2), (W / 2 - 2.16, y - 0.55, 1.05), '#9aa0a8', ink=False)
    pbox('StallFrame', (0.12, 0.12, 2.3), (W / 2 - 2.1, 5.1, 1.15), '#8a948a')
    pbox('StallTop', (0.12, 4.3, 0.12), (W / 2 - 2.1, 3.0, 2.3), '#8a948a')
    pcyl('Roll', 0.12, 0.2, (W / 2 - 1.7, 3.0, 0.9), '#f2eee4', rot=(90, 0, 0), verts=12)
    # the floor: big scattered tiles, the drain and its puddle
    import random as _r
    rnd = _r.Random(81)
    for k in range(16):
        tx, ty, ts = rnd.uniform(-3.8, 2.4), rnd.uniform(0.4, 5.6), rnd.uniform(0.35, 0.6)
        pbox('Tile', (ts, ts, 0.01), (tx, ty, 0.012), '#b4b89e', mottle=0, ink=True, rot=(0, 0, rnd.uniform(-6, 6)))
    pcyl('Drain', 0.22, 0.02, (-0.4, 2.0, 0.02), '#7a7a6a', verts=20)
    brush_patch('Puddle', 0.6, (0.4, 2.4), '#b8d8e0', sx=1.6, sy=0.6, seed=61, mottle=0.1, z=0.02)
    for (sx, sy) in ((-1.4, 1.4), (0.4, 1.4), (-0.6, 3.2), (1.2, 3.6), (-2.2, 4.4)):
        stand(sx, sy)
    room_light(azimuth=-30, elevation=60, energy=3.4)
    paint_sky('#6a7462', '#6a7462')
    tv_camera((-0.4, -1.4, 1.8), (-0.4, D, 1.6), lens=20)


SCENES['hosted-camp'] = {'communal-grounds': pc_grounds, 'cabins': pc_cabins, 'mess-hall': pc_mess, 'dock': pc_dock,
                         'campfire': pc_campfire, 'forest-trail': pc_trail, 'confessional': pc_confessional,
                         'ceremony': pc_ceremony, 'exit': pc_shame,
                         'cabin-inside': pc_cabin_inside, 'beach': pc_beach, 'washroom': pc_washroom, 'cliff': pc_cliff}
# OUTDOOR = rendered by day and by night (the mess hall and the cabin inside too: dinner and bedtime happen after dark)
OUTDOOR['hosted-camp'] = {'communal-grounds', 'cabins', 'dock', 'campfire', 'forest-trail', 'beach', 'cliff', 'mess-hall', 'cabin-inside'}

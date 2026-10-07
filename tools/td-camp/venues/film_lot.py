# ══════════════════════════════════════════════════════════════════════
# venues/film_lot.py — the film lot, painted the way Total Drama Action paints it
# ══════════════════════════════════════════════════════════════════════
# js/camp-access.js 'film-lot': trailers, craft-services, studio-backlot, soundstage-corridor,
# prop-storage. Reference: the Total Drama Wiki's "Abandoned film lot" plates (FilmSet: the
# blue-grey hangar soundstages; Tdawestern: the Western street; the dark stage interiors;
# TDAAwards: the amphitheater with its orange shell and gold statues; RedCarpet; TDA_Confessional:
# the makeup trailer seen from the mirror). The elimination is the Awards Ceremony; the loser
# walks the red carpet, the Walk of Shame, to the rusty Lame-o-sine.

TDA = {
    'day': {'sky': '#86c8e8', 'sky_low': '#f2dca0', 'ground': '#7a7670', 'ground_sh': '#5e5a62', 'dirt': '#c8a46a', 'hangar': '#6f8696', 'hangar_sh': '#526878',
            'roof': '#5a7080', 'city': ('#9a92b0', '#7a7898'), 'cloud': '#eef3fb', 'rim': '#b9c6e0'},
    'night': {'sky': '#222a4a', 'sky_low': '#3a4068', 'ground': '#34343e', 'ground_sh': '#26262e', 'dirt': '#4f4434', 'hangar': '#34445a', 'hangar_sh': '#26344a',
              'roof': '#2c3a4e', 'city': ('#2e3252', '#24284a'), 'cloud': '#4a5a80', 'rim': '#323e62'},
}


def tda_sky(tod, far_y=90, sun=True):
    P = TDA[tod]
    paint_sky(P['sky'], P['sky_low'])
    if tod == 'day':
        if sun: swirl_sun(-26, far_y + 40, 34, 4.0, tod)
        for (cx, cz, cs) in ((-46, 40, 5.0), (18, 48, 4.0), (60, 36, 3.4)):
            curly_cloud(cx, far_y + 38, cz, cs, P['cloud'], P['rim'])
    else:
        swirl_sun(-30, far_y + 40, 34, 3.2, tod)
        rnd = random.Random(9)
        for i in range(60):
            card(uid('Star'), _blob_pts(0.18, 0.18, 8, 0, 0), far_y + 45, pmat('StarF', '#f4f0d8', unlit=True, mottle=0), x=rnd.uniform(-90, 90), z=rnd.uniform(14, 60))


def skyline(tod, y=80, x0=-90, x1=90, seed=3, lit=None):
    """The city behind the lot: flat towers with grids of windows."""
    P = TDA[tod]; rnd = random.Random(seed); lit = (tod == 'night') if lit is None else lit
    x = x0
    while x < x1:
        w = rnd.uniform(4, 9); h = rnd.uniform(10, 30); col = P['city'][int(rnd.random() < 0.5)]
        card(uid('Tower'), [(-w / 2, 0), (w / 2, 0), (w / 2, h), (-w / 2, h)], y + rnd.uniform(0, 6), pmat('Tower' + col, col, unlit=True, mottle=0), x=x)
        wm = pmat('TowerWin' + tod + str(lit), '#ffd27a' if lit else _mix_hex(col, '#ffffff', 0.18), unlit=True, mottle=0)
        for r in range(int(h / 2.2)):
            for c in range(int(w / 1.6)):
                if rnd.random() < (0.35 if lit else 0.8):
                    card(uid('TWin'), [(-0.3, 0), (0.3, 0), (0.3, 0.7), (-0.3, 0.7)], y - 0.05, wm, x=x - w / 2 + 0.8 + c * 1.6, z=1.2 + r * 2.2)
        if rnd.random() < 0.3:
            card(uid('Mast'), [(-0.1, h), (0.1, h), (0.05, h + 5), (-0.05, h + 5)], y, pmat('Tower' + col, col, unlit=True, mottle=0), x=x)
        x += w + rnd.uniform(0.5, 4)


def hangar(x, y, tod, w=14, d=12, h=8, number='4', rot_z=0):
    """A soundstage the way Action paints it: blue-grey walls, a barrel roof, a big door under a maroon awning, its number."""
    P = TDA[tod]
    g = _group(uid('Hangar'), (x, y, 0), rot_z)
    def add(ob):
        _child(g, ob)
        return ob
    add(pbox('HangarBody', (w, d, h), (0, 0, h / 2), P['hangar'], 'day', shade=P['hangar_sh'], mottle=0.3, mscale=0.5))
    roof = add(pcyl('HangarRoof', d / 2, w, (0, 0, h), P['roof'], 'day', verts=32, rot=(0, 90, 0)))
    roof.scale = (0.45, 1, 1)
    add(pbox('HangarDoor', (w * 0.36, 0.1, h * 0.62), (-w * 0.1, -d / 2 - 0.05, h * 0.31), _mix_hex(P['hangar_sh'], '#1a1a2a', 0.25), 'day'))
    for i in range(6):
        add(pbox('DoorRib', (0.06, 0.06, h * 0.6), (-w * 0.1 - w * 0.16 + i * w * 0.065, -d / 2 - 0.12, h * 0.31), _mix_hex(P['hangar_sh'], '#000000', 0.2), 'day', ink=False))
    add(pbox('Awning', (w * 0.42, 1.2, 0.2), (-w * 0.1, -d / 2 - 0.6, h * 0.66), N('#7a2a3a', tod), 'day', rot=(-12, 0, 0)))
    add(pbox('NumPlate', (1.8, 0.08, 1.8), (w * 0.3, -d / 2 - 0.05, h * 0.55), _mix_hex(P['hangar'], '#ffffff', 0.25), 'day'))
    t = ptext(number, (x + w * 0.3, y - d / 2 - 0.12, h * 0.55), 1.3, _mix_hex(P['hangar_sh'], '#1a1a2a', 0.3))
    return g


def film_lamp(x, y, tod, aim=0, h=2.4, on=None):
    """A studio lamp on a tripod, painted."""
    on = (tod == 'night') if on is None else on
    for a in (0, 120, 240):
        r = math.radians(a + aim)
        pcyl('Tripod', 0.03, h, (x + math.cos(r) * 0.32, y + math.sin(r) * 0.32, h / 2 - 0.05), '#2a2a30', 'day', verts=6, rot=(math.sin(r) * -12, math.cos(r) * 12, 0))
    pcyl('LampHead', 0.32, 0.55, (x, y, h + 0.1), '#3a3a42', 'day', verts=16, rot=(70, 0, aim))
    if on:
        card(uid('LampFace'), _blob_pts(0.28, 0.28, 16, 0, 0), y - 0.36, pmat('LampFace', '#fff6d8', unlit=True, mottle=0), x=x, z=h + 0.12)
        point(uid('FilmLight'), (x, y - 0.9, h), 800, '#fff0d0', radius=0.3)


def light_rig(x, y, w, h, tod, lamps=4):
    """A lighting truss on two towers, lamps hanging from it (Action's sets are full of them)."""
    for sx in (-w / 2, w / 2):
        pbox('RigTower', (0.25, 0.25, h), (x + sx, y, h / 2), '#2a2a32', 'day')
    pbox('RigTruss', (w + 0.4, 0.3, 0.3), (x, y, h), '#2a2a32', 'day')
    for i in range(lamps):
        lx = x - w / 2 + (i + 0.5) * w / lamps
        pcyl('RigLamp', 0.25, 0.45, (lx, y - 0.2, h - 0.4), '#3a3a42', 'day', verts=12, rot=(60, 0, 0))


def star_trailer(x, y, tod, rot_z=0, stripe='#3f7fbf'):
    """A star's trailer: a long cream body on wheels, a stripe, a door with a gold star, a fold-down step."""
    g = _group(uid('Trailer'), (x, y, 0), rot_z)
    def add(ob):
        _child(g, ob)
        return ob
    add(pbox('TrailerBody', (7.0, 2.5, 2.6), (0, 0, 1.75), '#e8e2d2', tod, shade='#b8b2a8', mottle=0.25, mscale=0.8))
    add(pbox('TrailerRoof', (7.1, 2.6, 0.2), (0, 0, 3.12), '#c8c2b4', tod))
    add(pbox('TrailerStripe', (7.02, 2.52, 0.3), (0, 0, 1.25), stripe, tod, ink=False))
    for xx in (-1.3, 1.3):
        add(pcyl('Tyre', 0.45, 0.3, (xx, -1.1, 0.45), '#2a2a30', tod, verts=18, rot=(90, 0, 0)))
    for xx in (-2.4, 0.2):
        add(pbox('TrailerWin', (1.3, 0.06, 0.7), (xx, -1.27, 2.1), '#5a8aa8' if tod == 'day' else '#ffd27a', 'day', mottle=0, unlit=tod == 'night'))
    add(pbox('TrailerDoor', (0.9, 0.06, 2.0), (2.3, -1.27, 1.5), '#d8d0bc', tod))
    st = star_shape(uid('DoorStar'), (x, y, 0), 0.25, N('#e8b938', tod))
    _child(g, st); st.location = (2.3, -1.32, 2.15)
    add(pbox('Step', (0.9, 0.5, 0.12), (2.3, -1.55, 0.35), '#7a7a82', tod))
    return g


def star_shape(name, loc, r, color, rot=(90, 0, 0)):
    me = bpy.data.meshes.new(name); bm = bmesh.new()
    c = bm.verts.new((0, 0, 0))
    pts = [bm.verts.new((math.cos(math.pi / 2 + i * math.pi / 5) * (r if i % 2 == 0 else r * 0.42),
                         math.sin(math.pi / 2 + i * math.pi / 5) * (r if i % 2 == 0 else r * 0.42), 0)) for i in range(10)]
    for i in range(10):
        bm.faces.new((c, pts[i], pts[(i + 1) % 10]))
    bm.to_mesh(me); bm.free()
    ob = _link(bpy.data.objects.new(name, me)); ob.location = loc; ob.rotation_euler = [math.radians(a) for a in rot]
    me.materials.append(pmat('Star' + color, color, unlit=True, mottle=0))
    return ob


def lot_ground(tod, cracks=True):
    P = TDA[tod]
    ground_plane(P['ground'], P['ground_sh'], mottle=0.35)
    if cracks:
        rnd = random.Random(5)
        for i in range(14):
            pbox('Crack', (rnd.uniform(0.6, 2.2), 0.04, 0.01), (rnd.uniform(-10, 10), rnd.uniform(-2, 14), 0.005), _mix_hex(P['ground_sh'], '#000000', 0.2), 'day', rot=(0, 0, rnd.uniform(-60, 60)), ink=False)


def fl_trailers(tod):
    """The contestants' trailers in a row across the lot, the hangars and the towers behind."""
    paint_mode(); P = TDA[tod]
    tda_sky(tod)
    skyline(tod, y=95)
    lot_ground(tod)
    for i, (x, num) in enumerate(((-30, '3'), (-10, '4'), (12, '5'), (32, '6'))):
        hangar(x, 52, tod, number=num, rot_z=(-8, 4, -4, 8)[i])
    for i, (x, y, rz, st) in enumerate(((-6.5, 12, 18, '#3f7fbf'), (2.0, 16, -6, '#c83a4a'), (9.5, 13, -20, '#3fae6a'), (-12.5, 19, 24, '#e8a23a'))):
        star_trailer(x, y, tod, rot_z=rz, stripe=st)
    pbox('Cable', (12, 0.06, 0.06), (0, 3.0, 0.03), '#26262a', 'day', rot=(0, 0, 6), ink=False)
    film_lamp(-4.5, 5.5, tod, aim=20)
    pbox('Cooler', (0.8, 0.5, 0.5), (3.5, 6.0, 0.25), '#3f8ac8', tod)
    if tod == 'night':
        string_lights((-9.0, 9.6, 3.4), (9.5, 10.4, 3.6), n=26, sag=0.8)
    paint_sun(azimuth=-40, elevation=50 if tod == 'day' else 30, energy=4.0 if tod == 'day' else 1.8)
    tv_camera((0.0, -7.5, 2.8), (0.5, 18, 2.4), lens=26)


def fl_craft(tod):
    """Craft services: a striped canopy over a long table of trays, folding chairs, the hangars behind."""
    paint_mode(); P = TDA[tod]
    tda_sky(tod)
    skyline(tod, y=95, seed=6)
    lot_ground(tod)
    hangar(-12, 22, tod, number='7', rot_z=8)
    hangar(14, 26, tod, number='2', rot_z=-6)
    star_trailer(10, 12, tod, rot_z=-15, stripe='#c83a4a')
    pbox('Canopy', (7.0, 4.2, 0.15), (0, 6.0, 3.0), '#f4f1ea', tod, mottle=0.1)
    for i in range(8):
        pbox('Valance', (0.86, 0.05, 0.4), (-3.06 + i * 0.875, 3.88, 2.78), '#d84a4a' if i % 2 else '#f4f1ea', tod, ink=False)
    for x in (-3.4, 3.4):
        for yy in (4.0, 8.0):
            pcyl('CanopyPole', 0.05, 3.0, (x, yy, 1.5), '#b8b8bc', tod, verts=8)
    pbox('CraftTable', (5.6, 1.1, 0.08), (0, 6.4, 0.8), '#f2f0ea', tod, mottle=0.1)
    pbox('Skirt', (5.6, 0.04, 0.7), (0, 5.84, 0.42), '#3a5a8a', tod)
    cols = ('#e2a23a', '#c85a3a', '#7fbf4a', '#f2d27a')
    for i, x in enumerate((-2.2, -1.2, -0.2, 0.8)):
        pbox('Tray', (0.8, 0.5, 0.06), (x, 6.3, 0.87), '#c9ccd2', tod, ink=False)
        for j in range(5):
            card(uid('Food'), _blob_pts(0.09, 0.07, 10, 0, 0), 6.05, pmat('Food' + cols[i] + tod, N(cols[i], tod), unlit=True, mottle=0), x=x - 0.28 + j * 0.14, z=0.95)
    pcyl('Urn', 0.22, 0.6, (2.1, 6.5, 1.12), '#9aa3ad', tod, verts=18)
    for i, (x, yy, rz) in enumerate(((-3.5, 2.5, 20), (-1.6, 2.0, -10), (2.6, 2.4, 15))):
        g = _group(uid('FoldChair'), (x, yy, 0), rz)
        for ob in (pbox('FSeat', (0.45, 0.42, 0.05), (0, 0, 0.46), '#5a6a7a', tod), pbox('FBack', (0.45, 0.05, 0.42), (0, 0.2, 0.7), '#5a6a7a', tod)):
            _child(g, ob)
    if tod == 'night':
        point(uid('CanopyLight'), (0, 5.8, 2.6), 900, '#fff0c8', radius=0.4)
        string_lights((-3.4, 4.0, 2.85), (3.4, 4.0, 2.85), n=16, sag=0.25)
    paint_sun(azimuth=-35, elevation=52 if tod == 'day' else 30, energy=4.0 if tod == 'day' else 1.8)
    tv_camera((0.4, -4.8, 1.9), (0, 8, 1.4), lens=26)


def western_front(x, y, w, h, tod, col, trim, sign=None, sign_col='#c8463c', porch=True):
    """A Western false front (Tdawestern): a tall square facade, a porch roof on posts, windows, a painted sign."""
    pbox('Front', (w, 0.3, h), (x, y, h / 2), col, tod, shade=_mix_hex(col, '#2a1a2a', 0.3), mottle=0.35, mscale=0.8)
    pbox('FrontTop', (w + 0.4, 0.5, 0.35), (x, y - 0.05, h + 0.1), trim, tod)
    for i in range(1, int(w / 0.5)):
        pbox('FSeam', (0.03, 0.02, h), (x - w / 2 + i * 0.5, y - 0.16, h / 2), _mix_hex(col, '#1a1010', 0.3), tod, ink=False)
    for wx in (-w * 0.28, w * 0.28):
        pbox('FWin', (w * 0.2, 0.06, h * 0.2), (x + wx, y - 0.18, h * 0.65), '#3a5a6a', tod, mottle=0)
        pbox('FShut', (w * 0.06, 0.07, h * 0.2), (x + wx - w * 0.13, y - 0.19, h * 0.65), '#5a7a3a', tod, ink=False)
    pbox('FDoor', (w * 0.2, 0.06, h * 0.38), (x, y - 0.18, h * 0.19), '#5a3a22', tod)
    if porch:
        pbox('PorchRoof', (w, 1.6, 0.12), (x, y - 0.9, h * 0.45), trim, tod, rot=(-10, 0, 0))
        for px in (-w / 2 + 0.2, w / 2 - 0.2):
            pbox('PorchPost', (0.14, 0.14, h * 0.45), (x + px, y - 1.6, h * 0.225), '#e8dcc0', tod)
        pbox('Boardwalk', (w, 1.8, 0.2), (x, y - 0.9, 0.1), '#8a6a42', tod)
    if sign:
        pbox('FSign', (w * 0.7, 0.1, h * 0.15), (x, y - 0.2, h * 0.86), '#e8d8b0', tod)
        ptext(sign, (x, y - 0.27, h * 0.86), h * 0.1, N(sign_col, tod))


def fl_backlot(tod):
    """The backlot (Tdawestern): a Western street of false fronts, lamps and a cable, tumbleweed."""
    paint_mode(); P = TDA[tod]
    tda_sky(tod)
    skyline(tod, y=95, seed=8)
    ground_plane(N('#c8a46a', tod), N('#9a7a4a', tod), mottle=0.35)
    fronts = (('SALOON', '#b8784a', '#6a3a22'), ('BANK', '#9a6a42', '#5a3a22'), ('HOTEL', '#7a8aa0', '#3a4a5a'), ('JAIL', '#a89a7a', '#5a4a3a'))
    for i, (sname, col, trim) in enumerate(fronts):
        western_front(-10.5 + i * 7.0, 13, 6.4, 5.8 + (i % 2) * 1.4, tod, col, trim, sign=sname)
    western_front(-14.5, 6, 6.0, 5.4, tod, '#9a8a6a', '#5a4a3a', porch=False)
    pbox('Trough', (2.0, 0.6, 0.6), (-3.8, 9.8, 0.3), '#7a5232', tod)
    cac = pmat('Cactus' + tod, N('#5a9a4a', tod), unlit=True, mottle=0.2)
    for (cx, cy) in ((3.8, 9.5), (-6.0, 8.0)):
        card(uid('Cactus'), [(-0.2, 0), (0.2, 0), (0.2, 1.6), (0.55, 1.6), (0.55, 2.1), (0.3, 2.1), (0.3, 1.8), (0.2, 1.8), (0.2, 2.4), (-0.2, 2.4), (-0.2, 1.3), (-0.45, 1.3), (-0.45, 1.8), (-0.65, 1.8), (-0.65, 1.1), (-0.2, 1.1)], cy, cac, x=cx)
    film_lamp(-6.5, 4.5, tod, aim=25)
    film_lamp(6.5, 4.0, tod, aim=-25)
    light_rig(2.0, 18, 8, 9, tod)
    pbox('Cable', (0.06, 9, 0.06), (1.5, 2.0, 0.03), '#26262a', 'day', rot=(0, 0, 25), ink=False)
    for i in range(3):
        card(uid('Tumble'), _blob_pts(0.4, 0.4, 14, 0.2, i), 6.5 + i * 0.8, pmat('Tumble' + tod, N('#a8844a', tod), unlit=True, mottle=0.5, mscale=4), x=1.5 + i * 2.2, z=0.4)
    paint_sun(azimuth=-50, elevation=46 if tod == 'day' else 28, energy=4.0 if tod == 'day' else 1.8)
    tv_camera((0.0, -6.5, 1.9), (0, 14, 2.4), lens=24)


def fl_corridor(tod):
    """Inside a soundstage (Action's dark stage plates): a long block corridor, numbered doors, cables, pools of light."""
    paint_mode()
    W, D, H = 4.4, 22.0, 4.4
    plank_floor('Floor', (W, D, 0.2), (0, D / 2, -0.1), '#3a4652', 'day', axis='x', step=1.0, seam='#2a323c')
    for nm, size, loc in (('BackWall', (W, 0.2, H), (0, D, H / 2)), ('LeftWall', (0.2, D, H), (-W / 2, D / 2, H / 2)), ('RightWall', (0.2, D, H), (W / 2, D / 2, H / 2))):
        pbox(nm, size, loc, '#4a5866', 'day', shade='#34404c', mottle=0.3, mscale=0.6, ink=False)
    for r in range(1, 8):
        for sx in (-1, 1):
            pbox('Block', (0.02, D, 0.03), (sx * (W / 2 - 0.11), D / 2, r * 0.55), '#3a4652', 'day', ink=False)
    c = pbox('Ceiling', (W, D, 0.2), (0, D / 2, H + 0.1), '#22282e', 'day', ink=False); c.visible_shadow = False
    for i, y in enumerate((5.0, 11.0, 17.0)):
        for side in (-1, 1):
            x = side * (W / 2 - 0.08)
            pbox('SDoor', (0.06, 1.8, 2.6), (x, y, 1.3), '#5f7a8a', 'day')
            pbox('SDoorSign', (0.04, 1.0, 0.35), (x - side * 0.05, y, 2.95), '#26262a', 'day')
            ptext('STAGE %d' % (i * 2 + (1 if side < 0 else 2)), (x - side * 0.08, y, 2.95), 0.2, '#f6f0de', rot=(90, 0, -90 * side))
        pbox('RedLight', (0.15, 0.15, 0.15), (-W / 2 + 0.15, y - 1.3, 3.5), '#ff3a3a', 'day', unlit=True, ink=False)
    pbox('ExitSign', (1.0, 0.08, 0.35), (0, D - 0.12, 3.5), '#3fae6a', 'day', unlit=True)
    ptext('EXIT', (0, D - 0.18, 3.5), 0.24, '#f6fff6')
    for x in (-0.6, -0.35):
        pbox('Cable', (0.05, D - 1.0, 0.04), (x, D / 2, 0.02), '#1e1e22', 'day', ink=False)
    for yy in range(3, 22, 5):
        pcyl('Shade', 0.45, 0.3, (0, yy, H - 0.5), '#2a2a30', 'day', r2=0.15, verts=16)
        brush_patch('LightPool', 1.4, (0, yy + 0.4), '#8a9aa8', sx=1.1, sy=0.8, seed=yy, mottle=0.1, z=0.012)
    pbox('Crate', (0.8, 0.8, 0.8), (1.4, 7.5, 0.4), '#a8834f', 'day')
    pbox('Crate2', (0.6, 0.6, 0.6), (1.45, 7.6, 1.1), '#b8935f', 'day')
    pbox('Rack', (0.5, 1.6, 1.6), (1.6, 13.5, 0.8), '#3a3a42', 'day')
    room_light(azimuth=-20, elevation=70, energy=2.0)
    paint_sky('#2a3038', '#2a3038')
    tv_camera((0.3, 0.6, 1.7), (-0.1, D, 1.5), lens=22)


def fl_props(tod):
    """Prop storage: tall shelves of helmets and junk, a fake boulder, a mannequin, one work lamp."""
    paint_mode()
    W, D, H = 9.0, 8.0, 4.4
    painted_room(W, D, H, 'day', wall='#5a6470', floor='#4a5058', ceil='#2a2e34', plank=0.6, wall_seam='#4a525c', floor_seam='#3a4048')
    for x in (-3.0, 0.0, 3.0):
        for z in (0.1, 1.2, 2.3, 3.4):
            pbox('ShelfBoard', (2.6, 1.0, 0.06), (x, D - 0.6, z), '#6b5a44', 'day')
        for sx in (-1.3, 1.3):
            pbox('ShelfPost', (0.06, 1.0, 3.5), (x + sx, D - 0.6, 1.75), '#6b5a44', 'day')
    rnd = random.Random(21)
    cols = ('#c85a3a', '#3f7fbf', '#e2a23a', '#7fbf4a', '#b48ac8', '#d8d2c4', '#8a9aa8')
    for x in (-3.0, 0.0, 3.0):
        for z in (0.13, 1.23, 2.33):
            for k in range(3):
                sz = 0.25 + rnd.random() * 0.4
                if rnd.random() < 0.4:
                    pcyl('Helmet', sz * 0.6, sz * 0.7, (x - 0.8 + k * 0.8, D - 0.6, z + sz * 0.35 + 0.03), rnd.choice(cols), 'day', r2=sz * 0.3, verts=14)
                else:
                    pbox('Prop', (sz * 1.3, 0.6, sz), (x - 0.8 + k * 0.8, D - 0.6, z + sz / 2 + 0.03), rnd.choice(cols), 'day')
    r = icorock('FakeBoulder', (1.4, 1.1, 1.1), (-2.8, 4.0, 0.7), '#9a8f80', seed=31)
    r.data.materials.clear(); r.data.materials.append(pmat('Boulder', '#9a8f80', mottle=0.4)); r['ink'] = 1
    pcyl('MannequinBody', 0.25, 1.1, (2.6, 4.5, 1.15), '#e6d2b8', 'day', r2=0.2, verts=16)
    card(uid('MannequinHead'), _blob_pts(0.18, 0.2, 16, 0, 0), 4.3, pmat('Mann', '#e6d2b8', unlit=True, mottle=0), x=2.6, z=1.9)
    pcyl('MannequinPole', 0.03, 0.6, (2.6, 4.5, 0.3), '#3a3a40', 'day', verts=8)
    pbox('Crate', (1.0, 1.0, 0.9), (0.4, 3.2, 0.45), '#a8834f', 'day')
    ptext('FRAGILE', (0.4, 2.68, 0.5), 0.17, '#8a2a1c')
    pcyl('Hanging', 0.3, 0.3, (0, 3.5, H - 0.4), '#3a3a40', 'day', r2=0.1, verts=16)
    brush_patch('LightPool', 2.4, (0, 3.6), '#7a828c', sx=1.2, sy=0.8, seed=2, mottle=0.1)
    room_light(azimuth=-30, elevation=60, energy=2.2)
    paint_sky('#2a3038', '#2a3038')
    tv_camera((0.0, -0.4, 1.8), (0, D, 1.4), lens=22)


def fl_confessional(tod):
    """The makeup trailer (TDA_Confessional), seen from the mirror: the counter of make-up, the bulbs down both sides,
    the pink chair, the rack of costumes, the shelf of helmets, pink curtains."""
    paint_mode()
    W, D, H = 4.0, 3.4, 2.8
    painted_room(W, D, H, 'day', wall='#7a7a4a', floor='#8a7a6a', ceil='#5a5a3a', plank=0.4, wall_seam='#5a5a34', floor_seam='#6a5a4a')
    for sx in (-1, 1):
        pbox('Curtain', (0.45, 0.1, H), (sx * (W / 2 - 0.3), D - 0.3, H / 2), '#e87a7a', 'day', shade='#c85a62', mottle=0.2)
    pbox('Rack', (1.8, 0.06, 0.06), (0.6, D - 0.5, 2.0), '#3a3a40', 'day')
    for k, c in enumerate(('#8a2a5a', '#e8b03a', '#7a3a2a', '#c84a3a', '#3a5a3a')):
        pbox('Costume', (0.32, 0.12, 1.0), (-0.1 + k * 0.34, D - 0.55, 1.45), c, 'day', mottle=0.2)
    for z in (1.0, 1.6, 2.2):
        pbox('HatShelf', (0.9, 0.4, 0.05), (-1.25, D - 0.4, z), '#4a3a2a', 'day')
    pcyl('Helmet', 0.18, 0.24, (-1.3, D - 0.4, 1.17), '#7a9aa8', 'day', r2=0.1, verts=12)
    pcyl('Cap', 0.17, 0.12, (-1.3, D - 0.4, 1.7), '#2a3a5a', 'day', r2=0.15, verts=12)
    pcyl('Plume', 0.06, 0.4, (-1.3, D - 0.4, 2.45), '#c83a6a', 'day', verts=8)
    g = _group('Chair', (0, D - 1.0, 0), 0)
    _child(g, pbox('ChairSeat', (0.8, 0.7, 0.12), (0, 0, 0.6), '#e8606a', 'day'))
    _child(g, pbox('ChairBack', (0.85, 0.12, 0.8), (0, 0.32, 1.05), '#e8606a', 'day', rot=(-6, 0, 0)))
    for sx in (-0.3, 0.3):
        _child(g, pcyl('ChairLeg', 0.04, 0.6, (sx, 0, 0.3), '#c8c8cc', 'day', verts=8))
    # the counter in the foreground and its make-up, the bulbs down the mirror's edges
    pbox('Counter', (W, 0.9, 0.85), (0, 0.35, 0.42), '#8ab8c8', 'day', mottle=0.2)
    for i, (x, c, h) in enumerate(((-1.4, '#e8885a', 0.35), (-0.9, '#7ad8e8', 0.18), (0.6, '#e8a0d8', 0.12), (1.0, '#4ab86a', 0.45), (1.5, '#b8a0d8', 0.25))):
        pcyl('Makeup', 0.12 if h < 0.3 else 0.09, h, (x, 0.45, 0.85 + h / 2), c, 'day', verts=14)
    pbox('Lipstick', (0.4, 0.07, 0.07), (-0.3, 0.3, 0.88), '#c83a4a', 'day', rot=(0, 0, 20))
    for sx in (-1, 1):
        for k in range(4):
            card(uid('Bulb'), _blob_pts(0.07, 0.07, 14, 0, 0), 0.05, pmat('VBulb', '#fff2b0', unlit=True, mottle=0), x=sx * 0.78, z=0.95 + k * 0.32)
    room_light(azimuth=-20, elevation=55, energy=3.0)
    paint_sky('#c8b890', '#c8b890')
    tv_camera((0.0, -0.9, 1.45), (0, D, 1.3), lens=20)


def statuette(x, y, z, tod, s=1.0):
    """A Gilded Chris on a black base."""
    g = pmat('Gilded', '#e8b938', '#a87a1a', mottle=0.15)
    cyl(uid('StatBase'), 0.09 * s, 0.08 * s, (x, y, z + 0.04 * s), pmat('StatBase', '#1e1e22', unlit=True, mottle=0), verts=12, bevel=0)
    cyl(uid('StatBody'), 0.05 * s, 0.26 * s, (x, y, z + 0.21 * s), g, verts=10, r2=0.035 * s, bevel=0)
    card(uid('StatHead'), _blob_pts(0.045 * s, 0.05 * s, 10, 0, 0), y - 0.05, pmat('GildedHead', '#e8b938', unlit=True, mottle=0), x=x, z=z + 0.38 * s)


def fl_ceremony(tod):
    """The Awards Ceremony (TDAAwards): the amphitheater's orange shell, a gold statue on a pedestal each side, the red carpet up to the stage."""
    paint_mode(); tod = 'night'; P = TDA[tod]
    tda_sky(tod)
    skyline(tod, y=70, seed=11)
    ground_plane('#3a3640', '#2a2632', mottle=0.3)
    for k, (r, c) in enumerate(((7.4, '#7a3a2a'), (6.6, '#c8642a'), (5.6, '#e8843a'), (4.4, '#f2a24a'), (3.0, '#f8c86a'))):
        pts = [(math.cos(i / 40 * math.pi) * r, math.sin(i / 40 * math.pi) * r * 0.85) for i in range(41)]
        card(uid('Shell'), pts, 16 - k * 0.02, pmat('Shell' + c, c, unlit=True, mottle=0), x=0, z=1.0)
    pbox('Stage', (14, 5, 1.0), (0, 13.5, 0.5), '#3a2a2a', 'day', mottle=0.2)
    pbox('StageLip', (14.2, 0.2, 1.05), (0, 11.0, 0.5), '#5a3a2a', 'day')
    pbox('Podium', (1.1, 0.7, 1.15), (2.4, 12.0, 1.58), '#2a2228', 'day')
    pbox('PodiumTop', (1.3, 0.85, 0.06), (2.4, 12.0, 2.18), '#e8b938', 'day', unlit=True)
    mark('host', (2.4, 12.0, 2.2))
    for i in range(6):
        statuette(2.0 + (i % 3) * 0.25, 11.85 + (i // 3) * 0.3, 2.21, tod)
    for sx in (-1, 1):
        pbox('Pedestal', (1.4, 1.4, 2.4), (sx * 8.5, 12.0, 1.2), '#5a5a62', 'day')
        g = pmat('GildedBig', '#d8a83a', '#8a6a1a', mottle=0.2)
        card(uid('BigStatue'), [(-0.5, 0), (0.5, 0), (0.45, 1.6), (0.75, 2.3), (0.4, 2.4), (0.3, 3.0), (0.4, 3.5), (0, 3.8), (-0.4, 3.5), (-0.3, 3.0), (-0.4, 2.4), (-0.75, 2.3), (-0.45, 1.6)],
             11.2, g, x=sx * 8.5, z=2.4)
    card(uid('Carpet'), [(-1.4, 0), (1.4, 0), (1.0, 1), (-1.0, 1)], 0, pmat('CarpetT', '#a82a2e', unlit=True, mottle=0.1), z=0)
    pbox('CarpetF', (2.4, 11, 0.03), (0, 5.5, 0.015), '#a82a2e', 'day', ink=False)
    for r in range(3):
        for sx in (-1, 1):
            pbox('Bleacher', (5.0, 0.9, 0.4 + r * 0.4), (sx * 5.0, 3.6 - r * 0.9, (0.4 + r * 0.4) / 2), '#4a5a6a', 'day')
            for k in range(4):
                seat(sx * 5.0 - 1.8 + k * 1.2, 3.6 - r * 0.9, 0.4 + r * 0.4)
    for sx in (-1, 1):
        film_lamp(sx * 11, 9, 'night', aim=-sx * 30, h=3.5)
        sh = card(uid('Beam'), [(-0.6, 0), (0.6, 0), (3.0, 30), (-3.0, 30)], 14, pmat('Beam', '#fff8d0', unlit=True, mottle=0, alpha=0.12), x=sx * 11, z=3.5)
        sh.rotation_euler = (0, math.radians(sx * 22), 0)
    for i in range(7):
        card(uid('FootLight'), _blob_pts(0.12, 0.12, 10, 0, 0), 10.9, pmat('Foot', '#fff1c8', unlit=True, mottle=0), x=-4.5 + i * 1.5, z=1.08)
    point('HouseLight', (0, 6.0, 6.0), 2400, '#ffe2c8', radius=1.0)
    paint_sun(azimuth=-30, elevation=28, energy=1.8)
    tv_camera((-1.0, -3.0, 3.0), (0.3, 14, 2.4), lens=24)


def lameosine(x, y, tod, rot_z=-90):
    """The Lame-o-sine: a stretch limo gone to rust, one headlight dead."""
    g = _group(uid('Limo'), (x, y, 0), rot_z)
    def add(ob):
        _child(g, ob)
        return ob
    add(pbox('LimoBody', (2.2, 9.0, 0.9), (0, 0, 0.75), '#d8cfc0', tod, shade='#a89f90', mottle=0.3))
    add(pbox('LimoCab', (2.0, 7.2, 0.7), (0, -0.2, 1.5), '#d8cfc0', tod, shade='#a89f90', mottle=0.3))
    for xx in (-1.02, 1.02):
        add(pbox('LimoWin', (0.04, 6.8, 0.45), (xx, -0.2, 1.55), '#3a4a5a', tod, ink=False))
    rnd = random.Random(8)
    for i in range(9):
        add(pbox('Rust', (0.04, 0.3 + rnd.random() * 0.6, 0.2 + rnd.random() * 0.25), (-1.11, -4 + i * 0.95, 0.5 + rnd.random() * 0.5), '#a8582a', tod, ink=False))
    for yy in (-3.2, 3.0):
        for xx in (-1.0, 1.0):
            add(pcyl('Tyre', 0.42, 0.3, (xx, yy, 0.42), '#1e1e22', tod, verts=18, rot=(0, 90, 0)))
    add(pbox('Headlight', (0.4, 0.06, 0.2), (-0.65, 4.52, 0.85), '#fff1c8', 'day', unlit=True, ink=False))
    return g


def fl_shame(tod):
    """The Walk of Shame (TDA red carpet): the carpet between brass posts and velvet ropes, out to the Lame-o-sine."""
    paint_mode(); tod = 'night'; P = TDA[tod]
    tda_sky(tod)
    skyline(tod, y=80, seed=13)
    lot_ground(tod)
    pbox('Carpet', (2.4, 18, 0.03), (0, 7, 0.015), '#a82a2e', 'day', shade='#7a1a22', mottle=0.15, ink=False)
    for yy in range(0, 16, 2):
        for xx in (-1.6, 1.6):
            pcyl('Stanchion', 0.05, 0.95, (xx, yy, 0.47), '#e8b938', 'day', verts=10)
            card(uid('StanchTop'), _blob_pts(0.09, 0.09, 10, 0, 0), yy - 0.06, pmat('Brass', '#e8b938', unlit=True, mottle=0), x=xx, z=0.98)
            if yy < 14:
                pbox('Rope', (0.07, 2.0, 0.07), (xx, yy + 1, 0.82), '#6a1422', 'day', ink=False)
    lameosine(0.5, 18.5, tod)
    point(uid('LimoLight'), (0, 15.5, 3.0), 900, '#ffe2a8', radius=0.4)
    for xx in (-6.0, 6.0):
        film_lamp(xx, 8.0, 'night', aim=30 if xx < 0 else -30)
    star_trailer(-10, 15, tod, rot_z=20)
    hangar(14, 30, tod, number='1', rot_z=-10)
    for xx in (-4.0, 4.0):
        lamp_post((xx, 12.0, 0), 3.4, tod)
    paint_sun(azimuth=-30, elevation=28, energy=1.6)
    tv_camera((0.0, -4.5, 1.9), (0.8, 18, 1.2), lens=26)


SCENES['film-lot'] = {
    'trailers': fl_trailers, 'craft-services': fl_craft, 'studio-backlot': fl_backlot,
    'soundstage-corridor': fl_corridor, 'prop-storage': fl_props,
    'confessional': fl_confessional, 'ceremony': fl_ceremony, 'exit': fl_shame,
}
OUTDOOR['film-lot'] = {'trailers', 'craft-services', 'studio-backlot'}

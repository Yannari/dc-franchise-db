# ══════════════════════════════════════════════════════════════════════
# venues/world_tour.py — the jet, painted the way Total Drama World Tour paints it
# ══════════════════════════════════════════════════════════════════════
# js/camp-access.js 'world-tour': economy, aisle, galley, cargo-hold, first-class,
# destination-staging. Reference: the Total Drama Wiki's "Total Drama Jumbo Jet" plates
# (Tdwteconomyclass: a dark ribbed steel hull, wooden benches, laundry on a line; Tdwtdiningarea:
# the galley's arched doors and stools; Tdwtcargohold: crates, suitcases, a striped door;
# Tdwtfirstclass: cream walls, a yellow sofa, purple seats, a retro carpet; Tdwtelimination: the
# rear compartment with tiki masks and a thatch hut where the Barf Bag Ceremony happens). The
# loser leaves by the Drop of Shame, through the open hatch with a parachute. No real country
# is ever named or shown: the destination is a dusty airstrip anywhere.

HULL = '#3e4c54'
HULL_SH = '#2a363e'
RIB = '#56666e'


def jet_hull(D, R, tod, zc=0.6, col=HULL, rib=RIB, ribs=True, step=1.6, y0=0.0):
    """The inside of the fuselage: a big tube seen from within, ribs arching over every few feet, a flat floor."""
    # an open tube (no end caps: the camera stands inside it, and the far end may open on the sky)
    me = bpy.data.meshes.new('Hull'); bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=False, segments=40, radius1=R, radius2=R, depth=D + 6)
    bm.to_mesh(me); bm.free()
    h = _link(bpy.data.objects.new(uid('Hull'), me)); h.location = (0, y0 + D / 2 - 3, zc); h.rotation_euler = (math.radians(90), 0, 0)
    me.materials.append(pmat('Hull' + col, col, HULL_SH, mottle=0.3, mscale=0.5))
    h.visible_shadow = False
    if ribs:
        rm = pmat('Rib' + rib, rib, _mix_hex(rib, '#1a1a2a', 0.3), mottle=0.15)
        y = y0 + 0.6
        while y < y0 + D:
            for k in range(18):
                a = math.radians(-12 + k * (204 / 17))
                x, z = math.cos(a) * (R - 0.08), zc + math.sin(a) * (R - 0.08)
                ob = box(uid('Rib'), (0.14, 0.16, 2 * math.pi * R / 34 * 1.35), (x, y, z), rm, bevel=0)
                ob.rotation_euler = (0, -a, 0)       # along the tangent, so the segments join into one arch
            y += step
    return h


def rivets(x, y0, y1, z, step=0.35, col='#6e7e86', side=-1):
    m = pmat('Rivet' + col, col, unlit=True, mottle=0)
    y = y0
    while y < y1:
        card(uid('Rivet'), _blob_pts(0.03, 0.03, 8, 0, 0), y, m, x=x, z=z).rotation_euler = (0, 0, math.radians(90 * side))
        y += step


def porthole(x, y, z, side, tod, r=0.32):
    pane = '#9ad8e8' if tod == 'day' else '#2a3a6a'
    g = cyl(uid('PortFrame'), r, 0.1, (x, y, z), pmat('PortFrame', '#7a8a92', mottle=0.1), verts=24, rot=(0, 90, 0), bevel=0); g['ink'] = 1
    cyl(uid('PortPane'), r * 0.78, 0.12, (x - side * 0.01, y, z), pmat('PortPane' + tod, pane, unlit=True, mottle=0), verts=24, rot=(0, 90, 0), bevel=0)


def floor_plates(W, D, tod, col='#5a6a66', y0=0.0):
    plank_floor('Floor', (W, D, 0.2), (0, y0 + D / 2, -0.1), col, 'day', axis='x', step=1.2, seam='#3a4644', mottle=0.25)


def hanging_lamp(x, y, z, warm=True):
    pcyl('LampCord', 0.015, 0.8, (x, y, z + 0.4), '#1a1a1a', 'day', ink=False)
    pcyl('LampShade', 0.5, 0.35, (x, y, z), '#c8a48a' if warm else '#7a8a92', 'day', r2=0.12, verts=18)
    card(uid('LampGlow'), _blob_pts(0.42, 0.08, 16, 0, 0), y - 0.02, pmat('LampGlowW', '#fff2c0', unlit=True, mottle=0), x=x, z=z - 0.2)
    brush_patch('LightPool', 1.4, (x, y + 0.2), '#7a8a7a', sx=1.2, sy=0.9, seed=int(y * 10), mottle=0.1, z=0.014)


def wt_economy(tod):
    """Economy class (Tdwteconomyclass): a dark ribbed steel hull, long wooden benches down both walls, laundry on a line, a hole in the wall."""
    paint_mode()
    W, D, R = 5.6, 16, 3.2
    floor_plates(W, D, tod)
    jet_hull(D, R, tod)
    for sx in (-1, 1):
        pbox('Bench', (0.7, D - 2, 0.1), (sx * (W / 2 - 0.6), D / 2, 0.55), '#8a5a32', 'day')
        for yy in range(2, int(D), 3):
            pbox('BenchLeg', (0.6, 0.1, 0.5), (sx * (W / 2 - 0.6), yy, 0.27), '#5a3a22', 'day')
        for yy in (3.5, 7.0, 10.5, 14.0):
            porthole(sx * (W / 2 - 0.35), yy, 1.7, sx, tod)
        pbox('Bin', (0.9, D - 2, 0.5), (sx * (W / 2 - 0.9), D / 2, 2.85), '#34424a', 'day')
    pbox('Line', (0.03, 9, 0.03), (0.4, 7, 2.7), '#d8d0b8', 'day', ink=False)
    for k, c in enumerate(('#a8786a', '#d8c8a8', '#6a8aa8', '#c8a050')):
        pbox('Laundry', (0.04, 0.6, 0.7), (0.4, 4.5 + k * 1.7, 2.3), c, 'day', mottle=0.2)
    card(uid('Hole'), [(-0.4, -0.3), (-0.1, -0.15), (0.0, -0.4), (0.15, -0.1), (0.45, -0.2), (0.3, 0.1), (0.4, 0.35), (0.0, 0.2), (-0.3, 0.35)],
         D - 0.6, pmat('Hole', '#0e1418', unlit=True, mottle=0), x=0.8, z=0.8)
    pbox('BackWall', (W + 1, 0.2, R * 2), (0, D - 0.4, 0.6), '#36444c', 'day', mottle=0.3, ink=False)
    pbox('Door', (1.4, 0.1, 2.4), (0, D - 0.55, 1.2), '#4a5a62', 'day')
    hanging_lamp(0, 8, 3.0, warm=False)
    room_light(azimuth=-30, elevation=70, energy=2.2)
    paint_sky('#1e2428', '#1e2428')
    tv_camera((0.4, 0.4, 1.75), (0, D, 1.3), lens=22)


def wt_aisle(tod):
    """The aisle: standing between rows of tired seats, a drinks cart halfway, the curtain to first class at the end."""
    paint_mode()
    W, D, R = 5.0, 16, 3.0
    floor_plates(W, D, tod)
    pbox('AisleRunner', (0.9, D, 0.02), (0, D / 2, 0.01), '#7a3a3a', 'day', ink=False)
    jet_hull(D, R, tod, ribs=True, step=2.0)
    for r in range(8):
        y = 2.0 + r * 1.6
        for x in (-1.6, -0.95, 0.95, 1.6):
            pbox('SeatBack', (0.58, 0.16, 0.95), (x, y + 0.25, 0.95), ('#6a5a8a', '#5a6a8a')[r % 2], 'day', rot=(-8, 0, 0))
            pbox('SeatCush', (0.58, 0.55, 0.16), (x, y, 0.5), ('#6a5a8a', '#5a6a8a')[r % 2], 'day')
            pbox('Headrest', (0.48, 0.12, 0.2), (x, y + 0.29, 1.38), '#d8d0b8', 'day', ink=False)
    pbox('Cart', (0.55, 0.85, 1.0), (0.05, 7.0, 0.5), '#b8bcc4', 'day')
    pbox('CartTop', (0.6, 0.9, 0.05), (0.05, 7.0, 1.02), '#d8dce2', 'day', ink=False)
    pbox('Curtain', (W - 0.6, 0.08, 2.6), (0, D - 0.4, 1.3), '#a82a3a', 'day', shade='#7a1a2a', mottle=0.15)
    for i in range(9):
        pbox('Fold', (0.06, 0.1, 2.6), (-1.8 + i * 0.45, D - 0.46, 1.3), '#7a1a2a', 'day', ink=False)
    for sx in (-1, 1):
        for yy in (3, 6.5, 10, 13.5):
            porthole(sx * (W / 2 - 0.3), yy, 1.55, sx, tod, r=0.26)
    hanging_lamp(0, 5, 2.9, warm=True); hanging_lamp(0, 11, 2.9, warm=True)
    room_light(azimuth=-30, elevation=70, energy=2.4)
    paint_sky('#1e2428', '#1e2428')
    tv_camera((0.0, 0.2, 1.75), (0, D, 1.3), lens=22)


def wt_galley(tod):
    """The galley (Tdwtdiningarea): the arched double doors in the hull, a steel counter, a table with stools, a fire extinguisher."""
    paint_mode()
    W, D, R = 6.0, 6.0, 3.0
    floor_plates(W, D, tod, col='#6a5a4a')
    jet_hull(D + 1, R, tod, step=2.2)
    pbox('Bulkhead', (W + 1, 0.2, 4.0), (0, D, 1.6), '#4a5a62', 'day', shade='#36444c', mottle=0.3, ink=False)
    pbox('DoorL', (0.9, 0.1, 2.3), (-0.48, D - 0.12, 1.15), '#4f6a70', 'day')
    pbox('DoorR', (0.9, 0.1, 2.3), (0.48, D - 0.12, 1.15), '#4f6a70', 'day')
    for sx in (-0.48, 0.48):
        pbox('DoorWin', (0.5, 0.11, 0.7), (sx, D - 0.13, 1.6), '#7ab0b8', 'day', unlit=True, ink=False)
    pbox('Counter', (2.4, 0.7, 0.95), (2.0, D - 0.6, 0.47), '#8a9098', 'day')
    pbox('CounterTop', (2.5, 0.8, 0.06), (2.0, D - 0.6, 0.97), '#b8bcc4', 'day', ink=False)
    pcyl('Pot', 0.22, 0.35, (1.6, D - 0.6, 1.17), '#7a7a82', 'day', verts=14)
    card(uid('Slop'), _blob_pts(0.18, 0.06, 12, 0.2, 2), D - 0.85, pmat('Slop', '#9a9a6a', unlit=True, mottle=0.3), x=1.6, z=1.36)
    pbox('Table', (2.0, 1.1, 0.08), (-0.8, 2.8, 0.8), '#9a8a5a', 'day')
    pbox('TableLeg', (0.12, 0.12, 0.8), (-0.8, 2.8, 0.4), '#4a4a52', 'day')
    for x in (-1.8, 0.2):
        pcyl('Stool', 0.25, 0.55, (x, 2.0, 0.27), '#5a7a6a', 'day', verts=14)
    pcyl('Extinguisher', 0.11, 0.55, (-2.3, D - 0.5, 1.1), '#c8302a', 'day', verts=12)
    pbox('Grate', (1.4, 0.8, 0.02), (-0.6, 4.3, 0.005), '#3a4442', 'day', ink=False)
    hanging_lamp(-0.6, 3.2, 2.8, warm=True)
    room_light(azimuth=-30, elevation=70, energy=2.4)
    paint_sky('#1e2428', '#1e2428')
    tv_camera((0.4, -1.4, 1.75), (0, D, 1.3), lens=22)


def wt_cargo(tod):
    """The cargo hold (Tdwtcargohold): stacked crates and suitcases, a duffel, a striped hatch, one dim lamp."""
    paint_mode()
    W, D, R = 7.0, 10, 3.6
    floor_plates(W, D, tod, col='#3e4846')
    jet_hull(D, R, tod, col='#323e44', step=2.4)
    pbox('Hatch', (2.6, 0.14, 2.6), (-1.8, D - 0.5, 1.3), '#4a585e', 'day')
    for k in range(7):
        pbox('Hazard', (0.22, 0.16, 2.8), (-3.0 + k * 0.4, D - 0.58, 1.35), '#e8c23a' if k % 2 == 0 else '#22262a', 'day', rot=(0, 30, 0), ink=False)
    rnd = random.Random(4)
    cols = ('#a8834f', '#8a6a3a', '#b8935f', '#7a5a32')
    for i, (x, y, s, z) in enumerate(((1.6, 7.5, 1.2, 0), (2.9, 7.0, 1.0, 0), (2.2, 7.4, 0.9, 1.2), (1.2, 5.5, 0.8, 0), (-2.2, 5.0, 0.9, 0), (-1.4, 6.6, 0.7, 0))):
        pbox('Crate', (s, s * 0.9, s), (x, y, z + s / 2), cols[i % 4], 'day', mottle=0.3)
    for i, (x, y, c) in enumerate(((-0.4, 4.0, '#7a2a2a'), (0.5, 4.2, '#2a4a6a'), (-2.6, 3.4, '#3a5a3a'))):
        pbox('Suitcase', (0.8, 0.35, 0.55), (x, y, 0.28), c, 'day')
    pcyl('Duffel', 0.32, 1.1, (-1.6, 2.4, 0.3), '#4a5a3a', 'day', verts=14, rot=(0, 90, 15))
    brush_patch('Puddle', 0.6, (1.0, 2.4), '#4a8ab0', sx=1.4, sy=0.6, seed=5, mottle=0)
    hanging_lamp(0.6, 5.0, 3.0, warm=False)
    room_light(azimuth=-30, elevation=70, energy=1.6)
    paint_sky('#161a1e', '#161a1e')
    tv_camera((0.3, -0.6, 1.8), (0, D, 1.2), lens=22)


def wt_first(tod):
    """First class (Tdwtfirstclass): cream walls, a long yellow sofa, purple seats, a retro carpet, a curtained window."""
    paint_mode()
    W, D, H = 8.0, 6.0, 3.2
    plank_floor('Floor', (W, D, 0.2), (0, D / 2, -0.1), '#c8503a', 'day', axis='x', step=10, seam='#c8503a', mottle=0.1)
    rnd = random.Random(7)
    for i in range(26):
        pbox('Retro', (rnd.uniform(0.5, 1.0), rnd.uniform(0.3, 0.6), 0.01), (rnd.uniform(-3.5, 3.5), rnd.uniform(0.4, D - 0.8), 0.005), rnd.choice(('#e8904a', '#f2c87a', '#a83a2a')), 'day', ink=False)
    for nm, size, loc in (('BackWall', (W, 0.2, H), (0, D, H / 2)), ('LeftWall', (0.2, D, H), (-W / 2, D / 2, H / 2)), ('RightWall', (0.2, D, H), (W / 2, D / 2, H / 2))):
        pbox(nm, size, loc, '#d8cca8', 'day', shade='#b8ac8a', mottle=0.2, ink=False)
    c = pbox('Ceiling', (W, D, 0.2), (0, D / 2, H + 0.1), '#c8bc98', 'day', ink=False); c.visible_shadow = False
    pbox('Vent', (1.4, 0.06, 0.3), (0, D - 0.12, H - 0.25), '#9a9078', 'day')
    pbox('Sofa', (4.4, 1.0, 0.5), (-1.0, D - 0.7, 0.45), '#d8a83a', 'day', shade='#a87a1a')
    pbox('SofaBack', (4.4, 0.3, 0.7), (-1.0, D - 0.3, 0.95), '#d8a83a', 'day', shade='#a87a1a')
    for sx in (-3.3, 1.3):
        pbox('SofaArm', (0.3, 1.0, 0.75), (sx, D - 0.7, 0.55), '#c8982a', 'day')
    for x in (-2.4, 0.4):
        pbox('Pillow', (0.55, 0.2, 0.5), (x, D - 0.45, 0.9), '#f2e2a0', 'day', rot=(0, 10, 0))
    for k in range(3):
        pbox('PSeatBack', (0.6, 0.15, 1.1), (2.4 + k * 0.7, D - 0.7, 0.95), '#6a3a8a', 'day')
        pbox('PSeat', (0.6, 0.6, 0.15), (2.4 + k * 0.7, D - 1.0, 0.5), '#6a3a8a', 'day')
        pcyl('PStem', 0.05, 0.45, (2.4 + k * 0.7, D - 1.0, 0.22), '#2a2a2a', 'day', verts=8)
    pbox('Window', (0.8, 0.06, 1.0), (-1.0, D - 0.12, 2.3), '#9ad8e8' if tod == 'day' else '#2a3a6a', 'day', unlit=True)
    for sx in (-1.55, -0.45):
        pbox('WCurtain', (0.4, 0.08, 1.4), (sx, D - 0.14, 2.3), '#a82a2a', 'day')
    pbox('Speaker', (0.8, 0.4, 1.1), (W / 2 - 0.6, D - 0.4, 2.0), '#5a4a3a', 'day')
    for z in (1.75, 2.25):
        pcyl('Cone', 0.22, 0.05, (W / 2 - 0.6, D - 0.62, z), '#2a2a2a', 'day', verts=16, rot=(90, 0, 0))
    card(uid('Sconce'), [(-0.12, 0), (0.12, 0), (0.05, 0.25), (0.12, 0.5), (-0.12, 0.5), (-0.05, 0.25)], D - 0.15, pmat('Sconce', '#f2e8c8', unlit=True, mottle=0), x=1.6, z=1.9)
    room_light(azimuth=-30, elevation=60, energy=3.2)
    paint_sky('#c8b890', '#c8b890')
    tv_camera((0.0, -1.6, 1.6), (0, D, 1.3), lens=24)


def jet_outside(x, y, tod, rot_z=-70, s=1.0):
    """The old jet outside: a long pale body with a stripe, a red fin, wings, round windows."""
    g = _group(uid('Jet'), (x, y, 0), rot_z)
    def add(ob):
        _child(g, ob)
        return ob
    add(pcyl('Fuselage', 1.6 * s, 22 * s, (0, 0, 2.6 * s), '#e8e2d4', tod, verts=32, rot=(90, 0, 0)))
    nose = icorock(uid('Nose'), (1.6 * s, 2.6 * s, 1.6 * s), (0, -11 * s, 2.6 * s), '#e8e2d4', seed=1); nose.data.materials.clear()
    nose.data.materials.append(pmat('JetBody' + tod, N('#e8e2d4', tod), mottle=0.2)); nose['ink'] = 1; add(nose)
    add(pcyl('Tailcone', 1.6 * s, 4 * s, (0, 13 * s, 2.9 * s), '#e8e2d4', tod, verts=32, rot=(90, 0, 0), r2=0.5 * s))
    add(pbox('Fin', (0.25 * s, 3.0 * s, 3.2 * s), (0, 12.6 * s, 4.4 * s), '#c8463c', tod, rot=(-20, 0, 0)))
    add(pbox('Wing', (18 * s, 3.2 * s, 0.25 * s), (0, 1.5 * s, 1.8 * s), '#d8d2c4', tod))
    add(pbox('JetStripe', (3.24 * s, 22 * s, 0.25 * s), (0, 0, 2.4 * s), '#3f7fbf', tod, ink=False))
    for xx in (-5 * s, 5 * s):
        add(pcyl('Engine', 0.6 * s, 2.2 * s, (xx, 0.6 * s, 1.2 * s), '#9aa0a8', tod, verts=20, rot=(90, 0, 0)))
    for i in range(14):
        add(pcyl('JetWin', 0.18 * s, 0.05 * s, (-1.58 * s, -8 * s + i * 1.3 * s, 3.1 * s), '#3a4a6a' if tod == 'day' else '#ffd27a', 'day', verts=12, rot=(0, 90, 0), ink=False, unlit=tod == 'night'))
    return g


def wt_destination(tod):
    """Wherever it lands: a dusty airstrip with the jet parked behind, a stair truck, crates of gear, red hills."""
    paint_mode()
    if tod == 'day':
        paint_sky('#86c8e8', '#f2dca0')
        swirl_sun(-26, 160, 40, 4.0, tod)
        for (cx, cz, cs) in ((-46, 40, 5.0), (18, 48, 4.0), (60, 36, 3.4)):
            curly_cloud(cx, 150, cz, cs, '#eef3fb', '#b9c6e0')
    else:
        paint_sky('#222a4a', '#3a4068')
        swirl_sun(-30, 160, 40, 3.2, tod)
    ground_plane(N('#d2b07a', tod), N('#a8885a', tod), mottle=0.35)
    pbox('Runway', (12, 140, 0.02), (0, 60, 0.01), '#6f6a64', tod, mottle=0.25, ink=False)
    yy = 10
    while yy < 120:
        pbox('Dash', (0.3, 3.0, 0.01), (0, yy, 0.025), '#f0e6c0', tod, ink=False); yy += 7
    for k, col in enumerate(('#b8743a', '#d0985a')):
        ridge_card(140 - k * 25, -150, 150, 0, 16 - k * 6, N(col, tod), seed=9 + k, humps=5)
    jet_outside(-7.5, 26, tod)
    g = _group('StairTruck', (-2.0, 17.5, 0), 20)
    _child(g, pbox('TruckBed', (1.8, 4.0, 0.8), (0, 0, 0.8), '#e2ab3a', tod))
    _child(g, pbox('Stairs', (1.2, 4.2, 0.2), (0, 0.2, 2.2), '#9aa0a8', tod, rot=(32, 0, 0)))
    for i, (x, y, s) in enumerate(((3.5, 9.0, 1.0), (4.6, 9.4, 0.8), (3.9, 10.4, 0.9), (-4.0, 7.0, 0.7))):
        pbox('GearCrate', (s, s, s), (x, y, s / 2), '#a8834f', tod)
    for x in (-4.0, 4.0):
        pcyl('Cone', 0.25, 0.6, (x, 4.0, 0.3), '#ff7a2a', tod, r2=0.03, verts=12)
    pcyl('Windsock', 0.25, 1.4, (9.0, 14.0, 4.2), '#ff7a2a', tod, r2=0.12, verts=12, rot=(0, 80, 0))
    pcyl('SockPole', 0.06, 4.3, (8.3, 14.0, 2.15), '#9aa0a8', tod, verts=8)
    for i, (x, y) in enumerate(((-14, 8), (13, 6), (16, 12))):
        r = icorock(uid('Boulder'), (1.2, 1.0, 0.8), (x, y, 0.3), N('#b89a6a', tod), seed=i + 60)
        r.data.materials.clear(); r.data.materials.append(pmat('Boulder' + tod, N('#b89a6a', tod), mottle=0.3)); r['ink'] = 1
    if tod == 'night':
        for x in (-6.5, 6.5):
            for yy in (8, 20, 32):
                card(uid('RunwayLight'), _blob_pts(0.15, 0.15, 10, 0, 0), yy, pmat('RunwayLight', '#8ad0ff', unlit=True, mottle=0), x=x, z=0.15)
        point(uid('FloodLight'), (0, 12, 6), 2200, '#fff0d0', radius=1.0)
    paint_sun(azimuth=-45, elevation=55 if tod == 'day' else 30, energy=4.0 if tod == 'day' else 1.8)
    tv_camera((1.5, -5.5, 1.9), (-1.0, 16, 2.4), lens=24)


def wt_confessional(tod):
    """The plane's lavatory: a steel toilet, a tiny sink and mirror, a porthole, the ribbed wall."""
    paint_mode()
    W, D, H = 2.0, 2.0, 2.6
    plank_floor('Floor', (W, D, 0.2), (0, D / 2, -0.1), '#5a6a66', 'day', axis='x', step=0.5, seam='#3a4644')
    for nm, size, loc in (('BackWall', (W, 0.2, H), (0, D, H / 2)), ('LeftWall', (0.2, D, H), (-W / 2, D / 2, H / 2)), ('RightWall', (0.2, D, H), (W / 2, D / 2, H / 2))):
        pbox(nm, size, loc, '#5a6a72', 'day', shade='#44525a', mottle=0.3, ink=False)
    c = pbox('Ceiling', (W, D, 0.2), (0, D / 2, H + 0.1), '#3a464e', 'day', ink=False); c.visible_shadow = False
    for k in range(3):
        pbox('WallRib', (0.12, 0.08, H), (-0.6 + k * 0.6, D - 0.12, H / 2), '#6e7e86', 'day', ink=False)
    pcyl('Toilet', 0.26, 0.45, (0, D - 0.45, 0.22), '#b8bcc4', 'day', r2=0.2, verts=20)
    pcyl('ToiletSeat', 0.27, 0.04, (0, D - 0.45, 0.46), '#3a3a40', 'day', verts=20)
    pbox('Tank', (0.5, 0.2, 0.45), (0, D - 0.14, 0.72), '#b8bcc4', 'day')
    pbox('Sink', (0.45, 0.4, 0.12), (0.62, D - 0.3, 0.9), '#b8bcc4', 'day')
    pbox('Mirror', (0.45, 0.04, 0.55), (0.62, D - 0.12, 1.45), '#a8c8d0', 'day', mottle=0.05)
    porthole(-W / 2 + 0.12, 1.2, 1.55, -1, tod, r=0.22)
    pbox('NoSmoke', (0.32, 0.04, 0.32), (-0.55, D - 0.12, 1.6), '#f6f3ea', 'day', ink=False)
    card(uid('NoSmokeRing'), _blob_pts(0.12, 0.12, 20, 0, 0), D - 0.15, pmat('NoSmokeRed', '#c8463c', unlit=True, mottle=0), x=-0.55, z=1.6)
    card(uid('NoSmokeIn'), _blob_pts(0.09, 0.09, 20, 0, 0), D - 0.16, pmat('NoSmokeW', '#f6f3ea', unlit=True, mottle=0), x=-0.55, z=1.6)
    pbox('Barf', (0.18, 0.08, 0.26), (0.62, D - 0.2, 1.08), '#f2ecd8', 'day')
    room_light(azimuth=-20, elevation=65, energy=2.6)
    paint_sky('#1e2428', '#1e2428')
    tv_camera((0.0, -0.3, 1.5), (0, D, 1.05), lens=17)


def tiki_mask(x, y, z, h, tod, col='#b8743a', eye='#e8b03a'):
    """The rear compartment's tall tiki masks: a carved panel, a brow, big lidded eyes."""
    pbox('Mask', (1.2, 0.2, h), (x, y, z + h / 2), col, 'day', shade=_mix_hex(col, '#2a1a1a', 0.35), mottle=0.35, mscale=1.5)
    pbox('MaskBrow', (1.3, 0.1, 0.22), (x, y - 0.12, z + h * 0.7), _mix_hex(col, '#2a1a1a', 0.3), 'day')
    for sx in (-0.3, 0.3):
        card(uid('MaskEye'), _blob_pts(0.2, 0.12, 14, 0, 0), y - 0.13, pmat('MaskEye' + eye, eye, unlit=True, mottle=0), x=x + sx, z=z + h * 0.58)
        card(uid('MaskPupil'), _blob_pts(0.07, 0.07, 10, 0, 0), y - 0.14, pmat('MaskPupil', '#1a1a1a', unlit=True, mottle=0), x=x + sx, z=z + h * 0.57)
    card(uid('MaskMouth'), [(-0.4, 0), (0.4, 0), (0.3, -0.25), (-0.3, -0.25)], y - 0.13, pmat('MaskMouth', '#3a1a1a', unlit=True, mottle=0), x=x, z=z + h * 0.32)


def wt_ceremony(tod):
    """The Barf Bag Ceremony (Tdwtelimination): the rear compartment's ribbed hull, the tiki masks, a thatch hut with a flowered curtain,
    rows of benches, the stand with the barf bags."""
    paint_mode()
    W, D, R = 7.0, 9.0, 3.8
    floor_plates(W, D, tod, col='#4a4440')
    jet_hull(D + 1, R, tod, col='#2e383e', step=1.4)
    pbox('Bulkhead', (W + 2, 0.2, R * 2), (0, D, 0.6), '#262e34', 'day', ink=False)
    tiki_mask(-2.8, D - 2.2, 0.0, 3.4, tod)
    tiki_mask(-1.5, D - 1.6, 0.0, 2.8, tod, col='#9a6a3a', eye='#d8c050')
    # the thatch hut with its flowered curtain
    pbox('HutWall', (2.6, 1.6, 2.0), (1.6, D - 1.4, 1.0), '#c8902a', 'day')
    rnd = random.Random(3)
    for k in range(10):
        card(uid('Flower'), _blob_pts(0.18, 0.18, 10, 0.3, k), D - 2.22, pmat('HutFlower' + str(k % 3), ('#e85a8a', '#f2c84a', '#e86a3a')[k % 3], unlit=True, mottle=0),
             x=0.6 + rnd.random() * 2.0, z=0.3 + rnd.random() * 1.4)
    for sd in (-1, 1):
        pbox('HutThatch', (2.9, 1.3, 0.25), (1.6 + sd * 1.25, D - 1.4, 2.3), '#c8a050', 'day', shade='#8a6a30', mottle=0.4, mscale=2.5, rot=(0, sd * 28, 0))
    for r in range(3):
        pbox('Bench', (4.0, 0.4, 0.4), (0.4, 2.0 + r * 1.5, 0.2), '#8a5a32', 'day')
        for k in range(3):
            seat(-0.9 + k * 1.3, 2.0 + r * 1.5, 0.42)
        for sx in (-1.4, 2.2):
            pbox('BenchLeg', (0.12, 0.35, 0.2), (sx, 2.0 + r * 1.5, 0.1), '#5a3a22', 'day', ink=False)
    pbox('Stand', (0.9, 0.6, 1.05), (-0.6, 6.6, 0.52), '#6b4a2e', 'day')
    mark('host', (-0.6, 6.6, 1.1))
    for i in range(7):
        pbox('BarfBag', (0.16, 0.1, 0.24), (-0.9 + (i % 4) * 0.2, 6.5 + (i // 4) * 0.2, 1.17), '#f2ecd8', 'day')
    hanging_lamp(0.2, 4.0, 3.2, warm=True)
    point('CeremonyWarm', (0.5, 3.0, 2.6), 900, '#ffcf8a', radius=0.8)
    room_light(azimuth=-30, elevation=70, energy=1.8)
    paint_sky('#161a1e', '#161a1e')
    tv_camera((0.2, -2.6, 2.3), (0.2, D, 1.2), lens=22)


def wt_exit(tod):
    """The Drop of Shame: the hatch open on the night sky, clouds far below, a parachute pack on the hook."""
    paint_mode()
    W, D, R = 5.0, 4.0, 3.0
    floor_plates(W, D, tod, col='#4a5654')
    jet_hull(D, R, tod, col='#3a464e', step=1.2, ribs=True)
    for nm, size, loc in (('BWLeft', (1.6, 0.3, 4.0), (-W / 2 + 0.6, D, 1.6)), ('BWRight', (1.6, 0.3, 4.0), (W / 2 - 0.6, D, 1.6)),
                          ('BWTop', (W, 0.3, 1.2), (0, D, 3.2)), ('BWSill', (W, 0.3, 0.3), (0, D, 0.05))):
        pbox(nm, size, loc, '#4a5a62', 'day', shade='#36444c')
    for k in range(9):
        pbox('Hazard', (0.22, 0.32, 0.3), (-1.0 + k * 0.25, D - 0.02, 0.06), '#e8c23a' if k % 2 == 0 else '#22262a', 'day', ink=False)
    pbox('HatchDoor', (1.8, 0.12, 2.0), (1.5, D - 0.7, 1.2), '#5a6a72', 'day', rot=(0, 0, -70))
    for i, x in enumerate((-1.2, -0.7)):
        pbox('Strap', (0.05, 0.03, 1.0), (x, D - 0.4, 1.9 - i * 0.1), '#c8463c', 'day', rot=(0, 0, 20 + i * 10), ink=False)
    pbox('Pack', (0.45, 0.25, 0.6), (-1.8, D - 0.6, 1.4), '#4a7a3a', 'day')
    pbox('JumpSign', (0.8, 0.04, 0.25), (W / 2 - 0.6, D - 0.18, 2.1), '#c8463c', 'day', unlit=True)
    ptext('JUMP', (W / 2 - 0.6, D - 0.22, 2.1), 0.15, '#fff6f0')
    paint_sky('#1e2a50', '#3a4a7a')
    rnd = random.Random(3)
    for i in range(16):
        curly_cloud(rnd.uniform(-40, 40), rnd.uniform(40, 120), rnd.uniform(-22, -6), rnd.uniform(3, 6), '#5a6a98', '#3a4a78')
    for i in range(50):
        card(uid('Star'), _blob_pts(0.18, 0.18, 8, 0, 0), 160, pmat('StarW', '#f4f0d8', unlit=True, mottle=0), x=rnd.uniform(-90, 90), z=rnd.uniform(0, 60))
    swirl_sun(20, 170, 30, 4.0, 'night')
    point('RedBeacon', (-1.6, D - 0.2, 2.35), 120, '#ff4a4a', radius=0.05)
    room_light(azimuth=-30, elevation=60, energy=1.4)
    tv_camera((0.2, 0.1, 1.6), (0, D + 4, 0.9), lens=18)


def wt_map(tod):
    """The jet in cross-section, flying: the World Tour plane (TotalDramaJumboJet001: a dark grey
    flying boat, a high wing, a tall fin with the show's round crest) with its near side cut away so
    every compartment is a lit room: first class's cream walls, yellow sofa and purple seats; economy's
    dark ribs, benches and laundry line; the aisle with its red curtain and drinks cart; the
    confessional's restroom door; the galley's arched doors and stools; the rear compartment's tiki
    masks; the cargo hold under the deck. Far below, through the clouds, the dusty airstrip wherever
    it lands next (no country is ever named or drawn). Each place carries a 'zone' mark."""
    paint_mode(); day = tod == 'day'

    def fc(nm, pts, y, col, x=0.0, z=0.0, night=True):
        return card(uid(nm), pts, y, pmat('WM' + nm + col + tod, N(col, tod) if night else col, unlit=True, mottle=0.18, mscale=0.6), x=x, z=z)

    def rect(nm, x0, x1, z0, z1, y, col, night=False):
        return fc(nm, [(x0, z0), (x1, z0), (x1, z1), (x0, z1)], y, col, night=night)

    if day:
        paint_sky('#7cc4e4', '#d8eef2'); swirl_sun(-30, 60, 24, 5.0, tod)
    else:
        paint_sky('#1e2446', '#384070'); swirl_sun(-30, 60, 24, 3.4, tod)
    # far below: the land it is about to drop onto, a river through dusty hills and the airstrip
    fc('Land', [(-140, -90)] + [(-140 + i * 7, -14 + 2.2 * math.sin(i * 0.9) + 1.5 * math.sin(i * 0.37)) for i in range(41)] + [(140, -90)], 30, '#c8a46a')
    fc('LandBand', [(-140, -90)] + [(-140 + i * 7, -20 + 1.8 * math.sin(i * 0.6)) for i in range(41)] + [(140, -90)], 29.8, '#a8885a')
    fc('River', [(-140, -18), (-60, -16.6), (-20, -20), (30, -17.4), (140, -19), (140, -20.2), (30, -18.6), (-20, -21.4), (-60, -17.8), (-140, -19.2)], 29.6, '#3aa8b0')
    rect('Airstrip', 12, 46, -24.4, -22.8, 29.4, N('#6f6a64', tod))
    for k in range(6):
        rect('StripDash', 15 + k * 5.4, 17 + k * 5.4, -23.75, -23.45, 29.3, N('#f0e6c0', tod))
    # the air between: a pale haze over the land, so it reads as far below
    card(uid('Haze'), [(-160, -90), (160, -90), (160, -8), (-160, -8)], 24, pmat('WMHaze' + tod, '#d8eef2' if day else '#384070', unlit=True, mottle=0, alpha=0.38))
    for (cx, cz, cs) in ((-60, -6, 7.0), (-24, -9, 6.0), (6, -5, 5.0), (40, -8, 6.5), (70, -4, 5.0), (-48, 22, 4.0), (48, 26, 3.6)):
        curly_cloud(cx, 18, cz, cs, '#eef3fb' if day else '#8a94b8', '#b9c6e0' if day else '#5a6490')
    # the airframe: hull, fin, wing root, tailplane
    HULLC = '#4a5258'
    fc('Hull', [(-27, 16.4), (21, 16.4), (25, 17.2), (31, 20.0), (32, 18.6), (32, 13.2), (27, 10.6), (17, 1.6), (-24, 1.6), (-29.2, 3.4), (-32.4, 6.8), (-32.6, 10.2), (-30.6, 13.8)], 5.0, HULLC)
    fc('Keel', [(-24, 1.6), (17, 1.6), (15, 0.6), (-21, 0.6)], 4.9, '#3a4046')
    fc('Fin', [(23, 16.8), (27.4, 27.0), (30.6, 27.6), (31.6, 19.4)], 5.2, HULLC)
    fc('Crest', _blob_pts(1.2, 1.2, 28, 0, 0), 4.6, '#e0922a', x=28.8, z=23.4)
    fc('CrestIn', _blob_pts(0.7, 0.7, 20, 0, 0), 4.5, '#8a3a1a', x=28.8, z=23.4)
    fc('Tailplane', [(25, 18.6), (34.5, 19.4), (34.5, 20.0), (25, 19.6)], 4.4, '#3a4046')
    fc('WingRoot', [(-9, 16.2), (9, 16.2), (7, 17.6), (-7, 17.6)], 5.4, '#3a4046')
    for ex in (-6.0, 2.5):
        fc('Nacelle', [(ex - 2.4, 17.0), (ex + 2.6, 17.0), (ex + 2.2, 18.4), (ex - 2.0, 18.4)], 5.3, '#5a6268')
        rect('Prop', ex - 2.9, ex - 2.6, 15.6, 19.8, 5.25, N('#2a2e32', tod))
    fc('Windshield', [(-31.2, 11.0), (-28.8, 11.2), (-28.6, 13.6), (-30.0, 13.6)], -0.6, '#9ad8e8' if day else '#2a3a6a')
    # the cut: the rooms, behind the hull's rim (lit from inside, so they keep their colours at night)
    TOP, DECK, LOW = 15.2, 8.2, 2.8
    rect('CargoWall', -14, 15.5, LOW, DECK - 0.5, 3.0, '#323e44')
    rect('Bilge', -26.5, -14, LOW + 0.4, DECK - 0.5, 3.0, '#262e34')
    rect('FirstWall', -26.5, -13, DECK, TOP, 3.0, '#d8cca8')
    rect('EconWall', -13, 1.8, DECK, TOP, 3.0, '#36444c')
    rect('AisleWall', 1.8, 6.6, DECK, TOP, 3.0, '#46545c')
    rect('ConfWall', 6.6, 8.8, DECK, TOP, 3.0, '#6a7a82')
    rect('GalleyWall', 8.8, 16.0, DECK, TOP, 3.0, '#4a5a62')
    rect('RearWall', 16.0, 23.2, DECK, TOP, 3.0, '#3a3028')
    # floors and the deck between them
    rect('Deck', -26.6, 23.4, DECK - 0.5, DECK, -0.4, '#1e262c')
    rect('Carpet', -26.5, -13, DECK, DECK + 0.25, -0.3, '#c8503a')
    rect('Runner', 1.8, 6.6, DECK, DECK + 0.18, -0.3, '#7a3a3a')
    rect('HoldFloor', -14, 15.5, LOW, LOW + 0.3, -0.3, '#1e262c')
    for x in (-13.15, 1.65, 6.45, 8.65, 15.85):
        rect('Bulkhead', x, x + 0.32, DECK, TOP, -0.35, '#1e262c')
    # the rim around the cut
    rect('RimTop', -27.0, 23.6, TOP, TOP + 0.4, -0.5, '#2a3036')
    rect('RimBot', -24.0, 16.8, LOW - 0.4, LOW, -0.5, '#2a3036')
    rect('RimNose', -27.0, -26.5, LOW + 0.9, TOP + 0.4, -0.5, '#2a3036')
    rect('RimTail', 23.2, 23.6, DECK - 0.5, TOP + 0.4, -0.5, '#2a3036')
    rect('RimHold', 15.5, 15.9, LOW, DECK, -0.5, '#2a3036')
    # first class: the long yellow sofa, purple seats, a curtained window
    rect('Sofa', -25.4, -20.4, DECK + 0.25, DECK + 1.3, 1.0, '#d8a83a')
    rect('SofaBack', -25.4, -20.4, DECK + 1.3, DECK + 2.4, 1.6, '#c8982a')
    for x in (-24.4, -22.2):
        fc('Pillow', _blob_pts(0.6, 0.5, 16, 0, 0), 0.9, '#f2e2a0', x=x, z=DECK + 1.6, night=False)
    for k in range(3):
        rect('PSeat', -19.2 + k * 1.9, -17.8 + k * 1.9, DECK + 0.9, DECK + 1.3, 0.9, '#6a3a8a')
        rect('PSeatBack', -17.9 + k * 1.9, -17.5 + k * 1.9, DECK + 0.9, DECK + 3.2, 0.95, '#5a2a7a')
    rect('FWin', -23.6, -21.6, DECK + 3.6, DECK + 5.6, 2.6, '#9ad8e8' if day else '#2a3a6a')
    for x in (-24.2, -21.6):
        rect('FCurtain', x, x + 0.6, DECK + 3.2, DECK + 6.0, 2.5, '#a82a2a')
    # economy: dark ribs, the bench down the wall, portholes, the laundry line
    for k in range(7):
        rect('Rib', -12.4 + k * 2.1, -12.1 + k * 2.1, DECK, TOP, 2.9, '#56666e')
    rect('Bench', -12.6, 1.4, DECK + 1.1, DECK + 1.4, 1.0, '#8a5a32')
    for x in (-12.0, -7.0, -2.0, 1.0):
        rect('BenchLeg', x, x + 0.3, DECK, DECK + 1.1, 1.05, '#5a3a22')
    for k in range(5):
        fc('EPort', _blob_pts(0.42, 0.42, 16, 0, 0), 2.8, '#9ad8e8' if day else '#2a3a6a', x=-11.0 + k * 2.8, z=DECK + 3.4, night=False)
    fc('Line', [(-11.5, DECK + 5.4), (0.5, DECK + 5.0), (0.5, DECK + 5.08), (-11.5, DECK + 5.48)], 1.2, '#d8d0b8', night=False)
    for k, c in enumerate(('#a8786a', '#d8c8a8', '#6a8aa8', '#c8a050')):
        rect('Laundry', -10.0 + k * 2.6, -9.0 + k * 2.6, DECK + 3.9, DECK + 5.3, 1.1, c)
    rect('Bin', -12.6, 1.4, TOP - 1.2, TOP - 0.3, 1.2, '#2a363e')
    # the aisle: the red curtain, the drinks cart
    rect('Curtain', 1.95, 3.0, DECK + 0.2, TOP - 0.3, 1.0, '#a82a3a')
    rect('Cart', 4.0, 5.6, DECK + 0.2, DECK + 2.3, 1.0, '#b8bcc4')
    rect('CartTop', 3.9, 5.7, DECK + 2.3, DECK + 2.5, 0.95, '#d8dce2')
    # the confessional: the restroom door with its little sign
    rect('ConfDoor', 7.0, 8.4, DECK + 0.2, DECK + 4.6, 1.0, '#8a9aa2')
    rect('ConfSign', 7.3, 8.1, DECK + 3.4, DECK + 4.1, 0.9, '#e8c23a')
    fc('ConfKnob', _blob_pts(0.12, 0.12, 10, 0, 0), 0.9, '#2a2a2a', x=8.1, z=DECK + 2.3, night=False)
    # the galley: arched double doors, the steel counter and its pot, the table and stools, the extinguisher
    for x0 in (9.4, 10.6):
        fc('GDoor', [(x0, DECK + 0.2), (x0 + 1.1, DECK + 0.2), (x0 + 1.1, DECK + 3.8), (x0 + 0.55, DECK + 4.3), (x0, DECK + 3.8)], 2.6, '#4f6a70', night=False)
        rect('GDoorWin', x0 + 0.3, x0 + 0.8, DECK + 2.4, DECK + 3.3, 2.5, '#7ab0b8')
    rect('Counter', 12.4, 15.6, DECK + 0.2, DECK + 2.0, 1.0, '#8a9098')
    rect('CounterTop', 12.3, 15.7, DECK + 2.0, DECK + 2.25, 0.95, '#b8bcc4')
    fc('Pot', [(13.0, DECK + 2.25), (14.0, DECK + 2.25), (14.1, DECK + 3.2), (12.9, DECK + 3.2)], 0.9, '#7a7a82', night=False)
    rect('Table', 9.0, 11.8, DECK + 1.5, DECK + 1.75, 0.9, '#9a8a5a')
    rect('TableLeg', 10.3, 10.5, DECK + 0.2, DECK + 1.5, 0.95, '#4a4a52')
    for x in (9.0, 11.4):
        rect('Stool', x, x + 0.7, DECK + 0.2, DECK + 1.1, 0.8, '#5a7a6a')
    rect('Extinguisher', 15.2, 15.6, DECK + 2.6, DECK + 3.8, 0.9, '#c8302a')
    # the rear compartment: thatch hut, tiki masks, the hatch the losers leave by
    fc('Thatch', [(16.6, DECK + 4.6), (22.6, DECK + 4.6), (21.4, DECK + 6.2), (17.8, DECK + 6.2)], 1.6, '#c8a050', night=False)
    rect('HutPost', 17.0, 17.3, DECK + 0.2, DECK + 4.6, 1.7, '#6a4a2a')
    rect('HutPost', 22.0, 22.3, DECK + 0.2, DECK + 4.6, 1.7, '#6a4a2a')
    for k, (x, h) in enumerate(((18.2, 3.4), (19.8, 4.0), (21.4, 3.2))):
        rect('Tiki', x - 0.55, x + 0.55, DECK + 0.2, DECK + 0.2 + h, 1.0, ('#b8743a', '#a8643a', '#c8844a')[k])
        for sx in (-0.25, 0.25):
            fc('TikiEye', _blob_pts(0.18, 0.11, 12, 0, 0), 0.9, '#e8b03a', x=x + sx, z=DECK + 0.2 + h * 0.62, night=False)
        rect('TikiMouth', x - 0.35, x + 0.35, DECK + 0.2 + h * 0.25, DECK + 0.2 + h * 0.36, 0.9, '#3a1a1a')
    for k in range(6):
        rect('Hazard', 16.4 + k * 0.5, 16.65 + k * 0.5, DECK - 0.5, DECK, -0.45, '#e8c23a')
    # the cargo hold: crates, suitcases, a duffel, the striped hatch
    for (x, w, h, c, z0) in ((-12.6, 2.2, 2.2, '#a8834f', 0), (-10.2, 1.8, 1.8, '#8a6a3a', 0), (-12.2, 1.6, 1.6, '#b8935f', 2.2),
                             (-2.0, 2.0, 2.0, '#7a5a32', 0), (0.2, 1.6, 1.5, '#a8834f', 0), (9.5, 2.4, 2.4, '#8a6a3a', 0)):
        zz = LOW + 0.3 + z0
        rect('Crate', x, x + w, zz, zz + h, 1.0, c)
        rect('CrateSlat', x, x + w, zz + h * 0.45, zz + h * 0.55, 0.95, '#5a4228')
    for (x, c) in ((-6.6, '#7a2a2a'), (-5.0, '#2a4a6a'), (4.0, '#3a5a3a'), (5.6, '#7a6a2a')):
        rect('Suitcase', x, x + 1.4, LOW + 0.3, LOW + 1.3, 1.0, c)
        rect('Handle', x + 0.45, x + 0.95, LOW + 1.3, LOW + 1.55, 1.0, '#2a2a2a')
    fc('Duffel', _blob_pts(1.3, 0.6, 18, 0.05, 3), 1.0, '#4a5a3a', x=7.5, z=LOW + 0.9, night=False)
    for k in range(7):
        rect('HoldHazard', 12.4 + k * 0.42, 12.62 + k * 0.42, LOW + 0.3, DECK - 0.6, 2.8, '#e8c23a' if k % 2 == 0 else '#22262a')
    for (lx, lz) in ((-5.0, TOP - 0.5), (4.2, TOP - 0.5), (12.0, TOP - 0.5), (-19.0, TOP - 0.5), (19.6, TOP - 0.5), (-3.0, DECK - 0.7)):
        fc('Lamp', [(lx - 0.6, lz - 0.6), (lx + 0.6, lz - 0.6), (lx + 0.3, lz), (lx - 0.3, lz)], 0.6, '#c8a48a', night=False)
        fc('Glow', _blob_pts(0.5, 0.12, 16, 0, 0), 0.55, '#fff2c0', x=lx, z=lz - 0.65, night=False)
    for zid, loc in (('first-class', (-19.5, 0, 12.6)), ('economy', (-5.5, 0, 12.6)), ('aisle', (4.2, 0, 12.6)), ('confessional', (7.7, 0, 13.4)),
                     ('galley', (12.4, 0, 12.6)), ('cargo-hold', (1.0, 0, 6.6)), ('destination-staging', (31.0, 30, -23.6))):
        mark('zone', loc, id=zid)
    paint_sun(azimuth=-35, elevation=55 if day else 35, energy=3.0 if day else 1.6)
    tv_camera((0.5, -72.0, 8.5), (0.5, 0.0, 4.5), lens=33)


SCENES['world-tour'] = {
    'economy': wt_economy, 'aisle': wt_aisle, 'galley': wt_galley, 'cargo-hold': wt_cargo,
    'first-class': wt_first, 'destination-staging': wt_destination,
    'confessional': wt_confessional, 'ceremony': wt_ceremony, 'exit': wt_exit, 'map': wt_map,
}
OUTDOOR['world-tour'] = {'destination-staging', 'map'}

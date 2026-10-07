# ══════════════════════════════════════════════════════════════════════
# venues/film_more.py — the film lot redrawn closer to Total Drama Action
# ══════════════════════════════════════════════════════════════════════
# Replaces the first versions of the lot's camp plates (film_lot.py), which were too plain beside
# the show. References (Total Drama Wiki, "Abandoned film lot", "Trailers", "Craft services tent"):
#   Trailers / Girls_trailer   silver Airstream trailers with striped awnings on an ochre lot, a gnarled
#                              olive "bonsai" tree, violet patterned conifers, gold-crowned birches,
#                              the blue-grey hangars and the grey city behind, a big blue sky
#   TDA_DIY_BG_CraftServices   inside the craft services tent: maroon striped canvas overhead, grey
#                              canvas walls with plastic windows, a long buffet under an orange cloth
#   Camtdas                    the confessional: a wooden outhouse, a toilet-roll shelf, graffiti
#   Tdawestern                 the Western street against the black wall of a soundstage, its door
#                              open, a studio lamp, the city over the false fronts
#   FilmSet                    the hangars, the alleys between them
# The lot's ground is Action's ochre dirt and grass, not grey tarmac; every film-lot exterior and the
# map pick that up through TDA (the palette is shared), and star_trailer is now an Airstream.

TDA['day'].update({'ground': '#9a8a52', 'ground_sh': '#7a6c40'})
TDA['night'].update({'ground': '#3a3626', 'ground_sh': '#2a2820'})


def star_trailer(x, y, tod, rot_z=0, stripe='#e8843a'):
    """An Airstream (Trailers, Girls_trailer): a long rounded silver body, a seam along its middle,
    porthole windows, a door, a striped awning on two poles, wheels and a hitch."""
    g = _group(uid('Airstream'), (x, y, 0), rot_z)
    def add(ob):
        _child(g, ob)
        return ob
    L, R = 5.2, 1.35
    silver = pmat('Airstream' + tod, N('#dfe3e6', tod), N('#9aa2aa', tod), mottle=0.18, mscale=0.8)
    body = cyl(uid('AirBody'), R, L, (0, 0, R + 0.5), silver, verts=28, rot=(0, 90, 0), bevel=0); body['ink'] = 1; add(body)
    for sx in (-1, 1):
        cap = sphere(uid('AirCap'), R, (sx * L / 2, 0, R + 0.5), silver, scale=(0.8, 1, 1)); cap['ink'] = 1; add(cap)
    body.scale = (1, 1, 0.92)
    add(pbox('AirSeam', (L + 1.6, 0.04, 0.05), (0, -R * 0.98, R + 0.55), '#8a9298', tod, ink=False))
    for xx in (-2.2, -0.9, 0.9):
        add(pbox('AirWin', (0.9, 0.06, 0.55), (xx, -R * 0.95, R + 0.95), '#3a4a5a' if tod == 'day' else '#ffd27a', 'day', unlit=tod == 'night'))
    add(pbox('AirDoor', (0.75, 0.06, 1.7), (1.95, -R * 0.93, 1.35), '#c8ccd0', tod))
    add(pbox('AirStep', (0.8, 0.45, 0.12), (1.95, -R - 0.25, 0.35), '#7a7a82', tod))
    for xx in (-0.6, 0.6):
        add(pcyl('Tyre', 0.38, 0.28, (xx, -R * 0.85, 0.38), '#2a2a30', tod, verts=16, rot=(90, 0, 0)))
    add(pbox('Hitch', (1.6, 0.12, 0.12), (-L / 2 - 1.3, 0, 0.45), '#4a4a52', tod))
    # the awning: stripes of the trailer's colour and cream, out from the side over the door
    for i in range(8):
        c = stripe if i % 2 == 0 else '#f2ead8'
        add(pbox('Awning', (0.42, 1.8, 0.05), (-0.6 + i * 0.42, -R - 0.8, 2.35), c, tod, rot=(-12, 0, 0), ink=False))
    add(pbox('AwnEdge', (3.4, 0.05, 0.25), (0.87, -R - 1.68, 2.15), stripe, tod))
    for xx in (-0.7, 2.5):
        add(pcyl('AwnPole', 0.03, 2.2, (xx, -R - 1.65, 1.1), '#9aa0a8', tod, verts=6))
    return g


def tda_conifer(x, y, h, tod, s=1.0, col='#4a4888'):
    """Action's stylised conifer: a tall violet-blue spike, its sides scalloped, patterned with paler
    arcs (Girls_trailer, RedCarpet)."""
    w = h * 0.22 * s
    pts = [(-w, 0)]
    for i in range(1, 9):
        t = i / 9
        pts.append((-w * (1 - t) - 0.15 * s * (i % 2), h * t))
    pts.append((0, h))
    for i in range(8, 0, -1):
        t = i / 9
        pts.append((w * (1 - t) + 0.15 * s * (i % 2), h * t))
    pts.append((w, 0))
    card(uid('Conifer'), pts, y, pmat('Conifer' + col + tod, N(col, tod), unlit=True, mottle=0.1), x=x, z=0.3)
    arc = pmat('ConiferArc' + col + tod, N(_mix_hex(col, '#b8b8f0', 0.28), tod), unlit=True, mottle=0)
    for i in range(1, 7):
        z = h * i / 8; ww = w * (1 - i / 8) * 0.8
        card(uid('ConArc'), [(math.cos(math.pi * k / 10) * ww, -math.sin(math.pi * k / 10) * ww * 0.35) for k in range(11)] + [(-ww * 0.85, -0.02), (ww * 0.85, -0.02)][::-1],
             y - 0.02, arc, x=x, z=z + 0.3)
    card(uid('ConTrunk'), [(-0.12 * s, 0), (0.12 * s, 0), (0.12 * s, 0.5), (-0.12 * s, 0.5)], y + 0.01, pmat('ConTrunk' + tod, N('#3a2a3a', tod), unlit=True, mottle=0), x=x)


def tda_birch(x, y, h, tod, s=1.0, col='#d8a03a'):
    crown_tree(x, y, h, N(col, tod), seed=int(x * 7 + y), s=s, birch=True)


def tda_bonsai(x, y, h, tod, s=1.0):
    """The gnarled tree Action plants all over the lot: a twisting brown trunk, flat olive pads."""
    umbrella_pine(x, y, h, col=N('#8a7a3a', tod), trunk=N('#5a3a2a', tod), seed=int(x * 3 + y), s=s)


def lot_trees(tod, y, x0, x1, seed=0, density=1.0):
    rnd = random.Random(seed)
    x = x0
    while x < x1:
        k = rnd.random()
        if k < 0.35:
            tda_conifer(x, y + rnd.uniform(0, 2), rnd.uniform(7, 11), tod, s=1.0, col=rnd.choice(('#4a4888', '#3e4a7a', '#5a4a8a')))
        elif k < 0.7:
            tda_birch(x, y + rnd.uniform(0, 2), rnd.uniform(5, 7), tod, s=1.3, col=rnd.choice(('#d8a03a', '#c8883a', '#b8902e')))
        else:
            tda_bonsai(x, y + rnd.uniform(0, 2), rnd.uniform(5, 7), tod, s=1.2)
        x += rnd.uniform(3.5, 6.5) / density


def lot_ground(tod, cracks=True):
    """Action's lot: ochre dirt and dry grass, tarmac only where trucks drive."""
    P = TDA[tod]
    ground_plane(P['ground'], P['ground_sh'], mottle=0.35)
    rnd = random.Random(5)
    for i in range(8):
        brush_patch('Dirt', rnd.uniform(1.5, 3.5), (rnd.uniform(-12, 12), rnd.uniform(0, 16)), N('#b8a06a', tod), sx=1.8, sy=0.5, seed=i, mottle=0.3)
    for i in range(6):
        brush_patch('Grass', rnd.uniform(1.2, 2.6), (rnd.uniform(-12, 12), rnd.uniform(0, 16)), N('#7a7a3a', tod), sx=1.6, sy=0.5, seed=i + 20, mottle=0.3)


# ── the trailers ──────────────────────────────────────────────────────
def fl_trailers2(tod):
    paint_mode(); P = TDA[tod]
    tda_sky(tod)
    skyline(tod, y=95)
    lot_ground(tod)
    for i, (x, num) in enumerate(((-30, '3'), (-12, '4'), (14, '5'), (32, '6'))):
        hangar(x, 52, tod, number=num, rot_z=(-8, 4, -4, 8)[i])
    lot_trees(tod, 30, -40, 40, seed=3)
    tda_bonsai(1.5, 20, 7.5, tod, s=1.8)
    tda_conifer(-11.5, 15, 10, tod, s=1.1)
    tda_birch(10.5, 17, 6.5, tod, s=1.5)
    for i, (x, y, rz, st) in enumerate(((-4.5, 10.5, 8, '#e8843a'), (5.0, 12.0, -8, '#c84a5a'))):
        star_trailer(x, y, tod, rot_z=rz, stripe=st)
    pbox('Cable', (12, 0.06, 0.06), (0, 3.0, 0.03), '#26262a', 'day', rot=(0, 0, 6), ink=False)
    film_lamp(-8.0, 6.0, tod, aim=20)
    pbox('Cooler', (0.8, 0.5, 0.5), (2.5, 5.5, 0.25), '#3f8ac8', tod)
    for k, x in enumerate((-1.0, 0.4)):
        pbox('LawnChairSeat', (0.6, 0.6, 0.06), (x, 6.5, 0.45), ('#e8843a', '#3aa8c8')[k], tod, rot=(0, 0, 10 - k * 25))
    if tod == 'night':
        string_lights((-7.0, 8.6, 3.0), (8.0, 9.4, 3.2), n=26, sag=0.8)
    for x in (-1.5, 1.0, 3.5):
        stand(x, 3.2)
    paint_sun(azimuth=-40, elevation=50 if tod == 'day' else 30, energy=4.0 if tod == 'day' else 1.8)
    tv_camera((0.0, -6.5, 2.2), (0.5, 18, 2.6), lens=26)


# ── craft services ────────────────────────────────────────────────────
def fl_craft2(tod):
    """Inside the craft services tent (TDA_DIY_BG_CraftServices)."""
    paint_mode()
    W, D, H = 14.0, 8.0, 4.2
    ground_plane('#7a7a3a', '#5a5a2a', mottle=0.3)
    # grey canvas walls with plastic windows looking out on the lot
    for sx in (-1, 1):
        pbox('TentSide', (0.15, D, H), (sx * W / 2, D / 2, H / 2), '#8a8a92', 'day', mottle=0.2, ink=False)
    pbox('TentBack', (W, 0.15, H), (0, D, H / 2), '#8a8a92', 'day', mottle=0.2, ink=False)
    for x in (-4.5, -1.5, 3.5):
        pbox('TentWin', (2.0, 0.05, 0.9), (x, D - 0.1, 2.6), '#7aa0b0', 'day', unlit=True)
        pbox('TentWinFrame', (2.2, 0.06, 1.05), (x, D - 0.09, 2.6), '#5a5a62', 'day', ink=False)
        card(uid('WinTree'), _blob_pts(0.4, 0.3, 12, 0.2, int(x)), D - 0.08, pmat('WinTree', '#8a9a4a', unlit=True, mottle=0), x=x - 0.3, z=2.4)
    # maroon striped canvas overhead, scalloped along its edge
    for i in range(14):
        c = '#6a2430' if i % 2 == 0 else '#a8505a'
        r = pbox('Canopy', (W / 14 + 0.02, D + 0.4, 0.12), (-W / 2 + W / 28 + i * W / 14, D / 2, H + 0.6), c, 'day', rot=(-10, 0, 0), ink=False, unlit=True)
        r.visible_shadow = False
        card(uid('Scallop'), [(math.cos(math.pi + k * math.pi / 8) * W / 28, math.sin(math.pi + k * math.pi / 8) * 0.35) for k in range(9)], -0.15,
             pmat('Scal' + c, c, unlit=True, mottle=0), x=-W / 2 + W / 28 + i * W / 14, z=H + 0.2)
    # the long buffet under its orange cloth
    pbox('Buffet', (7.0, 1.4, 0.12), (1.0, 3.8, 0.9), '#e8843a', 'day', shade='#b85a2a')
    pbox('BuffetSkirt', (7.0, 0.05, 0.85), (1.0, 3.08, 0.45), '#d8742a', 'day')
    for k in range(10):
        card(uid('ClothFold'), [(-0.02, 0), (0.02, 0), (0.02, 0.8), (-0.02, 0.8)], 3.05, pmat('ClothFold', '#b85a2a', unlit=True, mottle=0), x=-2.3 + k * 0.7, z=0.05)
    food = (('#3a8a3a', 0.45, 0.32), ('#d8a03a', 0.35, 0.3), ('#c84a3a', 0.3, 0.2), ('#e8c86a', 0.25, 0.45), ('#a86a3a', 0.4, 0.28), ('#f2e8d8', 0.3, 0.3), ('#e86a8a', 0.22, 0.22))
    rnd = random.Random(4)
    for k in range(13):
        c, rx, rz = food[k % len(food)]
        card(uid('Food'), _blob_pts(rx * 0.55, rz * 0.55, 14, 0.1, k), 3.6 + rnd.uniform(0, 0.4), pmat('FoodC' + c, c, unlit=True, mottle=0.1), x=-2.3 + k * 0.53, z=0.96 + rz * 0.55)
    pcyl('Pitcher', 0.18, 0.5, (2.8, 4.0, 1.21), '#e8d86a', 'day', verts=14)
    for (x, c) in ((-5.5, '#a8784a'), (-4.4, '#c8a06a'), (5.6, '#a8784a')):
        pbox('Crate', (0.9, 0.8, 0.8), (x, D - 0.8, 0.4), c, 'day')
    pbox('Sack', (0.8, 0.6, 0.9), (4.6, D - 0.7, 0.45), '#d8c8a0', 'day')
    for x in (-1.5, 1.0, 3.5):
        stand(x, 1.8)
    room_light(azimuth=-30, elevation=60, energy=2.8)
    paint_sky('#5a2a32', '#5a2a32')
    tv_camera((0.5, -3.0, 1.8), (0.5, D, 1.8), lens=24)


# ── the confessional ──────────────────────────────────────────────────
def fl_confessional2(tod):
    """The confessional (Camtdas): inside a wooden outhouse, a shelf with a spare roll and a can of air
    freshener, the seat bench, a roll on the wall, somebody's skull doodle."""
    paint_mode()
    W, D, H = 3.6, 2.6, 3.0
    painted_room(W, D, H, 'day', wall='#b8925a', floor='#8a6a3a', ceil='#6a4a2a', plank=0.32, wall_seam='#8a6a3a', floor_seam='#6a4a2a')
    pbox('BackPanel', (2.4, 0.06, 2.0), (0, D - 0.13, 1.6), '#a8865a', 'day', mottle=0.3)
    pbox('Shelf', (2.4, 0.4, 0.08), (0, D - 0.3, 2.45), '#8a6a3a', 'day')
    pcyl('SpareRoll', 0.14, 0.24, (-0.5, D - 0.3, 2.62), '#f2f0ea', 'day', verts=14, rot=(90, 0, 0))
    pcyl('Spray', 0.07, 0.35, (0.8, D - 0.3, 2.66), '#e8843a', 'day', verts=10)
    pbox('Bench', (W - 0.3, 0.9, 0.7), (0, D - 0.55, 0.35), '#a8865a', 'day')
    pcyl('Seat', 0.38, 0.06, (0, D - 0.55, 0.73), '#f2f0ea', 'day', verts=20)
    pcyl('SeatHole', 0.24, 0.07, (0, D - 0.55, 0.735), '#3a2a1a', 'day', verts=20, ink=False)
    pcyl('RollHolder', 0.03, 0.4, (W / 2 - 0.12, 1.2, 1.2), '#9aa0a8', 'day', verts=6, rot=(0, 90, 0))
    pcyl('WallRoll', 0.15, 0.3, (W / 2 - 0.3, 1.2, 1.2), '#f2f0ea', 'day', verts=14, rot=(0, 90, 0))
    sk = pmat('Doodle', '#5a3a2a', unlit=True, mottle=0)
    card(uid('Skull'), _blob_pts(0.2, 0.2, 14, 0, 0), D - 0.16, sk, x=0.7, z=1.9)
    for sd in (-1, 1):
        card(uid('Bone'), [(-0.28, -0.02), (0.28, -0.02), (0.28, 0.02), (-0.28, 0.02)], D - 0.16, sk, x=0.7, z=1.62).rotation_euler = (0, math.radians(sd * 35), 0)
    card(uid('Crescent'), [(math.cos(a / 16 * 3.14) * 0.15, math.sin(a / 16 * 3.14) * 0.15) for a in range(17)], D - 0.16, sk, x=-0.8, z=2.0)
    for x in (0.0,):
        stand(x, 1.3)
    room_light(azimuth=-30, elevation=60, energy=3.0)
    paint_sky('#c8b890', '#c8b890')
    tv_camera((0.0, -2.0, 1.6), (0, D, 1.5), lens=22)


# ── the backlot ───────────────────────────────────────────────────────
def fl_backlot2(tod):
    """The Western street (Tdawestern): false fronts of a hotel, a saloon and a bank in the sun, the black
    wall of a soundstage on the left with its door open and a studio lamp, the city above the roofs."""
    paint_mode(); P = TDA[tod]
    tda_sky(tod)
    skyline(tod, y=70, x0=-40, x1=40, seed=8)
    ground_plane(N('#d8b878', tod), N('#b8985a', tod), mottle=0.3)
    brush_patch('Road', 4, (3, 6), N('#c8a86a', tod), sx=3.0, sy=0.8, seed=2)
    for k, (x, col, sign, h) in enumerate(((-3.0, '#c8b48a', 'HOTEL', 5.2), (1.6, '#8a9aa8', None, 4.4), (6.2, '#b87a5a', 'SALOON', 5.0), (11.2, '#a8784a', 'BANK', 5.6))):
        western_front(x, 14.0, 4.2, h, tod, col, '#5a3a22', sign=sign, porch=True)
    for x in (-4.6, 8.8):
        pcyl('WaterBarrel', 0.4, 0.9, (x, 10.5, 0.45), '#7a5232', tod, verts=14)
    card(uid('Cactus'), [(-0.25, 0), (0.25, 0), (0.25, 1.4), (0.6, 1.4), (0.6, 2.0), (0.35, 2.0), (0.35, 1.65), (0.25, 1.65), (0.25, 2.3), (-0.25, 2.3), (-0.25, 1.2), (-0.55, 1.2), (-0.55, 1.7), (-0.75, 1.7), (-0.75, 1.0), (-0.25, 1.0)],
         10.0, pmat('Cactus' + tod, N('#5a8a3a', tod), unlit=True, mottle=0.1), x=6.5)
    # the soundstage's black wall and open door, the big lamp
    pbox('StageWall', (6.0, 12.0, 11.0), (-9.5, 10.0, 5.5), '#24242c', tod, shade='#16161c', mottle=0.15)
    pbox('StageDoor', (0.1, 2.4, 3.0), (-6.45, 6.0, 1.5), '#8a5a32', tod)
    pbox('StageDoorDark', (0.08, 2.0, 2.6), (-6.4, 7.6, 1.3), '#0e0e12', tod, ink=False)
    card(uid('StageLamp'), _blob_pts(1.4, 1.4, 20, 0, 0), 4.2, pmat('StageLampFace', '#f2e2a0', unlit=True, mottle=0), x=-6.0, z=8.5)
    pcyl('StageLampBody', 1.6, 1.4, (-6.0, 5.0, 8.5), '#1a1a20', tod, verts=20, rot=(90, 0, 0))
    film_lamp(-3.5, 6.0, tod, aim=40, h=2.8)
    light_rig(4.5, 18, 12, 9, tod, lamps=5)
    pcyl('Dolly', 0.5, 0.4, (2.5, 4.0, 0.3), '#2a2a32', tod, verts=14)
    pbox('Camera', (0.7, 1.2, 0.6), (2.5, 4.0, 1.4), '#2a2a32', tod)
    pcyl('CamPost', 0.08, 1.0, (2.5, 4.0, 0.9), '#2a2a32', tod, verts=8)
    for x in (0.0, 2.0, 4.5):
        stand(x, 3.2)
    paint_sun(azimuth=-30, elevation=50 if tod == 'day' else 30, energy=4.0 if tod == 'day' else 1.8)
    tv_camera((1.5, -5.5, 2.0), (2.5, 14, 3.4), lens=26)


# ── between the soundstages ───────────────────────────────────────────
def fl_corridor2(tod):
    """The alley between two soundstages (FilmSet): blue-grey walls and barrel roofs on both sides, a
    stage door under its maroon awning, cables and road cases, the trees and the city at the far end."""
    paint_mode(); P = TDA[tod]
    tda_sky(tod)
    skyline(tod, y=95, seed=4)
    lot_ground(tod)
    hangar(-9.5, 20, tod, w=30, d=12, h=9, number='4', rot_z=90)
    hangar(9.5, 20, tod, w=30, d=12, h=9, number='5', rot_z=-90)
    lot_trees(tod, 40, -14, 14, seed=6, density=1.4)
    tda_bonsai(0.5, 36, 7, tod, s=1.6)
    for (x, y, c) in ((-2.4, 6, '#2a2a32'), (-2.0, 7.4, '#3a3a42'), (2.6, 9, '#2a2a32')):
        pbox('RoadCase', (1.0, 0.7, 0.8), (x, y, 0.4), c, tod)
        pbox('CaseCorner', (1.02, 0.72, 0.1), (x, y, 0.75), '#9aa0a8', tod, ink=False)
    for k in range(3):
        pbox('Cable', (0.06, 18, 0.05), (-1.0 + k * 0.6, 12, 0.03), '#1e1e24', 'day', rot=(0, 0, 3 - k * 3), ink=False)
    film_lamp(2.4, 4.5, tod, aim=-30)
    for x in (-0.5, 1.0):
        stand(x, 3.6)
    paint_sun(azimuth=-30, elevation=55 if tod == 'day' else 30, energy=4.0 if tod == 'day' else 1.8)
    tv_camera((0.0, -6.0, 1.9), (0.0, 30, 3.0), lens=26)


# ── prop storage ──────────────────────────────────────────────────────
def fl_props2(tod):
    """Inside the prop store, a corner of a soundstage: sets from past challenges leaning on each other
    (the moon rocks of Tdaspace, a prehistoric fern, the bank vault door of BGVault's brick wall),
    a mannequin, crates, a rack of costumes, one work lamp."""
    paint_mode()
    W, D, H = 14.0, 9.0, 6.5
    painted_room(W, D, H, 'day', wall='#4a4e5a', floor='#5a5a62', ceil='#26262e', plank=1.2, wall_seam='#3a3e4a', floor_seam='#4a4a52')
    # the brick flat with the vault doors
    pbox('Bricks', (6.0, 0.2, 3.6), (-3.0, D - 0.6, 1.8), '#9a4a3a', 'day', mottle=0.3)
    for r in range(9):
        box(uid('Mortar'), (6.0, 0.01, 0.03), (-3.0, D - 0.71, 0.2 + r * 0.4), pmat('Mortar', '#6a2a22', unlit=True, mottle=0), bevel=0)
    for x in (-4.6, -1.4):
        pbox('VaultDoor', (1.6, 0.1, 2.2), (x, D - 0.72, 1.2), '#5a9a9a', 'day')
        pcyl('VaultWheel', 0.3, 0.08, (x, D - 0.8, 1.3), '#e8e8e0', 'day', verts=10, rot=(90, 0, 0))
    # the moon rocks and the prehistoric fern
    for k, (x, y, s) in enumerate(((3.0, 6.5, 1.3), (5.0, 7.2, 1.0), (4.2, 5.4, 0.7))):
        r = icorock(uid('MoonRock'), (s, s * 0.8, s * 0.7), (x, y, 0.3), '#d8d8d8', seed=k + 4)
        r.data.materials.clear(); r.data.materials.append(pmat('MoonRockP', '#e0e0e0', '#9a9aa8', mottle=0.3)); r['ink'] = 1
    for k in range(6):
        a = math.radians(30 + k * 24)
        card(uid('Fern'), _blob_pts(0.9, 0.25, 12, 0.1, k), 7.8, pmat('Fern', '#b8604a', unlit=True, mottle=0), x=6.0 + math.cos(a) * 0.9, z=1.0 + math.sin(a) * 0.9).rotation_euler = (0, -a, 0)
    # the costume rack, the mannequin, crates, the work lamp
    pbox('Rack', (2.4, 0.1, 0.1), (-5.0, 4.5, 2.0), '#9aa0a8', 'day')
    for sx in (-1, 1):
        pbox('RackLeg', (0.08, 0.08, 2.0), (-5.0 + sx * 1.2, 4.5, 1.0), '#9aa0a8', 'day')
    for k, c in enumerate(('#c8303a', '#3a5aa8', '#e8b03a', '#4a9a5a', '#7a5aa8')):
        pbox('Costume', (0.4, 0.15, 1.2), (-5.9 + k * 0.45, 4.5, 1.4), c, 'day')
    pcyl('MannBody', 0.3, 1.2, (1.0, 5.5, 1.3), '#e8d8c0', 'day', verts=12)
    card(uid('MannHead'), _blob_pts(0.22, 0.26, 12, 0, 0), 5.2, pmat('MannHead', '#e8d8c0', unlit=True, mottle=0), x=1.0, z=2.15)
    pcyl('MannPost', 0.05, 0.7, (1.0, 5.5, 0.35), '#3a3a42', 'day', verts=6)
    for (x, y, s) in ((-1.5, 3.0, 0.9), (-0.6, 3.4, 0.7), (5.4, 3.0, 0.8)):
        pbox('PropCrate', (s, s, s), (x, y, s / 2), '#a8784a', 'day')
    ptext('FRAGILE', (-1.5, 2.54, 0.5), 0.15, '#8a2a1c')
    film_lamp(-6.0, 7.0, 'night', aim=30, h=2.6, on=True)
    for x in (-1.0, 1.5, 3.5):
        stand(x, 2.2)
    room_light(azimuth=-30, elevation=60, energy=2.2)
    paint_sky('#26262e', '#26262e')
    tv_camera((0.0, -1.6, 1.9), (0, D, 1.8), lens=22)


SCENES['film-lot'].update({
    'trailers': fl_trailers2, 'craft-services': fl_craft2, 'confessional': fl_confessional2,
    'studio-backlot': fl_backlot2, 'soundstage-corridor': fl_corridor2, 'prop-storage': fl_props2,
})
OUTDOOR['film-lot'] |= {'soundstage-corridor'}

# ══════════════════════════════════════════════════════════════════════
# venues/film_lot.py — the film lot: trailers, soundstages, a backlot of false fronts
# ══════════════════════════════════════════════════════════════════════
# js/camp-access.js 'film-lot': trailers, craft-services, studio-backlot, soundstage-corridor,
# prop-storage. From Total Drama Action (Total Drama Wiki): the confessional is a makeup
# trailer, the elimination is the Awards Ceremony at the lot's amphitheater stage with the
# Gilded Chris statuettes, and the loser takes the Walk of Shame down a red carpet to the
# rusty Lame-o-sine.

ASPHALT = '#7d7a76'
STAGE_WALL = '#d9cdb4'
GOLD = '#e8b938'


def star_shape(name, loc, r, color, rot=(90, 0, 0)):
    """A flat five-pointed star (the default font has no star glyph)."""
    me = bpy.data.meshes.new(name); bm = bmesh.new()
    c = bm.verts.new((0, 0, 0))
    pts = [bm.verts.new((math.cos(math.pi / 2 + i * math.pi / 5) * (r if i % 2 == 0 else r * 0.42),
                         math.sin(math.pi / 2 + i * math.pi / 5) * (r if i % 2 == 0 else r * 0.42), 0)) for i in range(10)]
    for i in range(10):
        bm.faces.new((c, pts[i], pts[(i + 1) % 10]))
    bm.to_mesh(me); bm.free()
    ob = _link(bpy.data.objects.new(name, me)); ob.location = loc; ob.rotation_euler = [math.radians(a) for a in rot]
    me.materials.append(mat(name.split('.')[0] + 'Mat' + color, color))
    return ob


def asphalt(tod, size=(160, 120), loc=(0, 20, 0)):
    ground(C(ASPHALT, tod), size=size, loc=loc)


def road_lines(y0, y1, x, tod):
    y = y0
    while y < y1:
        box(uid('RoadLine'), (0.15, 1.4, 0.01), (x, y, 0.005), mat('RoadLine' + tod, C('#f0e6c0', tod)), bevel=0)
        y += 3.0


def soundstage(loc, w=14, d=12, h=9, number='3', tod='day', rot_z=0, col=STAGE_WALL):
    """A soundstage: a big pale box with a barrel roof, a huge sliding door and its number painted on."""
    g = _group(uid('Stage'), loc, rot_z)
    _child(g, box(uid('StageBody'), (w, d, h), (0, 0, h / 2), mat('StageBody' + col + tod, C(col, tod)), bevel=0))
    _child(g, box(uid('StageRoof'), (w + 0.4, d + 0.4, 0.5), (0, 0, h + 0.25), mat('StageRoof' + tod, C('#b8ab92', tod)), bevel=0))
    _child(g, box(uid('StageParapet'), (w + 0.4, 0.3, 0.6), (0, -d / 2 - 0.05, h + 0.6), mat('StageRoof' + tod, C('#b8ab92', tod)), bevel=0))
    _child(g, box(uid('StageDoor'), (w * 0.4, 0.1, h * 0.62), (-w * 0.12, -d / 2 - 0.05, h * 0.31), mat('StageDoor' + tod, C('#9a9286', tod)), bevel=0))
    for i in range(6):
        _child(g, box(uid('DoorRib'), (0.08, 0.06, h * 0.6), (-w * 0.12 - w * 0.2 + 0.2 + i * w * 0.075, -d / 2 - 0.12, h * 0.31), mat('DoorRib' + tod, C('#857d72', tod)), bevel=0))
    _child(g, box(uid('NumPlate'), (2.6, 0.08, 2.6), (w * 0.3, -d / 2 - 0.05, h * 0.62), mat('NumPlate' + tod, C('#3a5a8a', tod)), bevel=0))
    _child(g, text_obj(uid('StageNum'), number, (w * 0.3, -d / 2 - 0.11, h * 0.62), 2.0, C('#f6f0de', tod)))
    if tod == 'night':
        lamp = mat('WallLamp', '#fff1c8', emit='#fff1c8', strength=4)
        _child(g, box(uid('Bulb'), (0.4, 0.2, 0.2), (w * 0.3, -d / 2 - 0.2, h * 0.86), lamp, bevel=0))
        point(uid('StageLamp'), (loc[0] + w * 0.3, loc[1] - d / 2 - 1.0, h * 0.84), 900, '#ffe2a8', radius=0.3)
    return g


def trailer(loc, tod, rot_z=0, stripe='#3f7fbf', name_card=None):
    """A star trailer: a long white box on wheels, a door with a star, windows, a fold-down step."""
    g = _group(uid('Trailer'), loc, rot_z)
    body = mat('TrailerBody' + tod, C('#ece8de', tod))
    _child(g, box(uid('TrailerBody'), (7.0, 2.5, 2.6), (0, 0, 1.75), body, bevel=0.15))
    _child(g, box(uid('TrailerStripe'), (7.02, 2.52, 0.28), (0, 0, 1.25), mat('TStripe' + stripe + tod, C(stripe, tod)), bevel=0))
    for x in (-1.2, 1.2):
        _child(g, cyl(uid('Wheel'), 0.42, 0.3, (x, -1.1, 0.42), mat('Tyre' + tod, C('#2e2e32', tod)), verts=18, rot=(90, 0, 0), bevel=0))
    win = mat('TWin' + tod, C('#9fd0ea', tod) if tod == 'day' else '#ffd27a', emit=None if tod == 'day' else '#ffd27a', strength=0 if tod == 'day' else 1.8)
    for x in (-2.4, 0.2):
        _child(g, box(uid('TrailerWin'), (1.3, 0.06, 0.7), (x, -1.27, 2.1), win, bevel=0))
    _child(g, box(uid('TrailerDoor'), (0.9, 0.06, 2.0), (2.3, -1.27, 1.5), mat('TDoor' + tod, C('#d8d2c4', tod)), bevel=0))
    _child(g, star_shape(uid('DoorStar'), (2.3, -1.32, 2.15), 0.25, C(GOLD, tod)))
    _child(g, box(uid('Step'), (0.9, 0.5, 0.12), (2.3, -1.55, 0.35), mat('Step' + tod, C('#8a8a90', tod)), bevel=0))
    return g


def director_chair(loc, tod, rot_z=0, col='#2f2f36'):
    g = _group(uid('DChair'), loc, rot_z)
    wood = mat('DChairWood' + tod, C('#b98552', tod))
    for sx in (-0.25, 0.25):
        for sy in (-0.2, 0.2):
            _child(g, box(uid('DLeg'), (0.04, 0.04, 0.9), (sx, sy, 0.45), wood, bevel=0, rot=(0, 15 if sx > 0 else -15, 0)))
    _child(g, box(uid('DSeat'), (0.55, 0.42, 0.04), (0, 0, 0.5), mat('DCanvas' + col + tod, C(col, tod)), bevel=0))
    _child(g, box(uid('DBack'), (0.6, 0.04, 0.3), (0, 0.22, 0.95), mat('DCanvas' + col + tod, C(col, tod)), bevel=0))
    return g


def film_light(loc, tod, aim=(0, 0, 0), on=None):
    """A studio lamp on a tripod."""
    x, y, z = loc
    for a in (0, 120, 240):
        r = math.radians(a)
        cyl(uid('Tripod'), 0.025, 2.2, (x + math.cos(r) * 0.3, y + math.sin(r) * 0.3, z + 1.05), mat('Tripod' + tod, C('#2e2e32', tod)), verts=6,
            rot=(math.sin(r) * -14, math.cos(r) * 14, 0), bevel=0)
    head = cyl(uid('LampHead'), 0.3, 0.5, (x, y, z + 2.3), mat('LampHead' + tod, C('#3a3a40', tod)), verts=16, rot=(70, 0, aim[2]), bevel=0)
    on = tod == 'night' if on is None else on
    if on:
        cyl(uid('Bulb'), 0.26, 0.02, (x, y - 0.25, z + 2.2), mat('LampLens', '#fff6d8', emit='#fff6d8', strength=6), verts=16, rot=(70, 0, aim[2]), bevel=0)
        point(uid('FilmLight'), (x, y - 0.8, z + 2.1), 700, '#fff0d0', radius=0.3)
    return head


def false_front(loc, w, h, tod, col, trim, sign=None, rot_z=0):
    """A backlot facade: a flat painted front held up by bare timber struts behind."""
    g = _group(uid('Front'), loc, rot_z)
    _child(g, box(uid('FrontFace'), (w, 0.2, h), (0, 0, h / 2), mat('Front' + col + tod, C(col, tod)), bevel=0))
    _child(g, box(uid('FrontTrim'), (w + 0.3, 0.3, 0.3), (0, -0.05, h), mat('Trim' + trim + tod, C(trim, tod)), bevel=0))
    win = mat('FrontWin' + tod, C('#3c4a5a', tod))
    for wx in (-w * 0.28, w * 0.28):
        _child(g, box(uid('FrontWin'), (w * 0.2, 0.06, h * 0.22), (wx, -0.12, h * 0.62), win, bevel=0))
    _child(g, box(uid('FrontDoor'), (w * 0.18, 0.06, h * 0.4), (0, -0.12, h * 0.2), mat('FrontDoor' + tod, C('#6b4a2e', tod)), bevel=0))
    if sign:
        _child(g, box(uid('FrontSign'), (w * 0.7, 0.08, h * 0.13), (0, -0.14, h * 0.86), mat('FSign' + tod, C('#f3e3b0', tod)), bevel=0))
        _child(g, text_obj(uid('FrontSignTxt'), sign, (0, -0.2, h * 0.86), h * 0.08, C('#3a2a1c', tod)))
    strut = mat('Strut' + tod, C('#a0825a', tod))
    for sx in (-w * 0.4, w * 0.4):
        _child(g, box(uid('Strut'), (0.12, 0.12, h * 1.1), (sx, 1.2, h * 0.45), strut, bevel=0, rot=(-28, 0, 0)))
    return g


def city_back(tod, y=70):
    hills(y + 30, '#a9a48a', tod, n=6, h=16, seed=12, x0=-120, x1=120)
    for i, x in enumerate(range(-80, 81, 26)):
        soundstage((x, y, 0), w=20, d=14, h=11 + (i % 3) * 2, number=str(i + 1), tod=tod, col=('#d9cdb4', '#cfc6b6', '#d6c7a8')[i % 3])


def fl_trailers(tod):
    asphalt(tod)
    city_back(tod, y=55)
    for i, (x, y, rz, st) in enumerate(((-6.5, 6, 8, '#3f7fbf'), (1.5, 9, -4, '#bf3f5a'), (9.0, 7, -12, '#3fae6a'), (-12, 13, 14, '#e2a23a'))):
        trailer((x, y, 0), tod, rot_z=rz, stripe=st)
    box('Cable', (12, 0.06, 0.06), (0, 3.0, 0.03), mat('Cable' + tod, C('#26262a', tod)), bevel=0, rot=(0, 0, 6))
    director_chair((-2.0, 2.0, 0), tod, rot_z=-20, col='#bf3f5a')
    for x in (-15, 15):
        palm((x, 4, 0), 8, tod, lean=8 if x < 0 else -8, seed=x)
    if tod == 'night':
        string_lights((-9.0, 4.6, 3.0), (9.5, 5.4, 3.2), n=26, sag=0.8)
        for x in (-4.0, 6.0):
            lamp_post((x, 3.0, 0), 3.4, tod)
    sky(tod); sun(tod, azimuth=-40, elevation=50 if tod == 'day' else 30)
    tv_camera((0.0, -6.5, 1.75), (0.5, 12, 1.6), lens=26)


def fl_craft(tod):
    """Craft services: a white canopy over a long table of trays, a coffee urn, folding chairs."""
    asphalt(tod)
    city_back(tod, y=50)
    soundstage((-14, 16, 0), w=14, d=12, h=9, number='7', tod=tod)
    trailer((11, 14, 0), tod, rot_z=-15, stripe='#bf3f5a')
    canvas = mat('Canopy' + tod, C('#f4f1ea', tod))
    box('Canopy', (7.0, 4.2, 0.15), (0, 6.0, 3.0), canvas, bevel=0)
    for i in range(8):
        box(uid('Valance'), (0.85, 0.05, 0.35), (-3.06 + i * 0.875, 3.88, 2.78), mat('Val' + ('a' if i % 2 else 'b') + tod, C('#d84a4a' if i % 2 else '#f4f1ea', tod)), bevel=0)
    for x in (-3.4, 3.4):
        for y in (4.0, 8.0):
            cyl(uid('CanopyPole'), 0.05, 3.0, (x, y, 1.5), mat('Pole' + tod, C('#b8b8bc', tod)), verts=8, bevel=0)
    table('Craft', (0, 6.4, 0), 5.6, 1.1, top=C('#f2f0ea', tod), legs=C('#8a8a90', tod))
    for i, x in enumerate((-2.2, -1.2, -0.2, 0.8)):
        box(uid('Tray'), (0.8, 0.5, 0.06), (x, 6.3, 0.85), mat('Tray' + tod, C('#c9ccd2', tod)), bevel=0)
        for j in range(5):
            sphere(uid('Food'), 0.08, (x - 0.28 + j * 0.14, 6.3, 0.92), mat('Food' + str(i) + tod, C(('#e2a23a', '#c85a3a', '#7fbf4a', '#f2d27a')[i], tod)))
    cyl('Urn', 0.22, 0.6, (2.1, 6.5, 1.12), mat('Urn' + tod, C('#9aa3ad', tod)), verts=18, bevel=0)
    for k in range(5):
        cyl(uid('Cup'), 0.05, 0.12, (1.6 + k * 0.12, 6.0, 0.88), mat('Cup' + tod, C('#f6f3ea', tod)), verts=10, r2=0.04, bevel=0)
    for i, (x, y, rz) in enumerate(((-3.5, 2.5, 20), (-1.6, 2.0, -10), (2.6, 2.4, 15))):
        g = _group(uid('FoldChair'), (x, y, 0), rz)
        _child(g, box(uid('FSeat'), (0.45, 0.42, 0.04), (0, 0, 0.46), mat('FChair' + tod, C('#5a6a7a', tod)), bevel=0))
        _child(g, box(uid('FBack'), (0.45, 0.04, 0.42), (0, 0.2, 0.7), mat('FChair' + tod, C('#5a6a7a', tod)), bevel=0))
        for sx in (-0.2, 0.2):
            _child(g, box(uid('FLeg'), (0.03, 0.4, 0.46), (sx, 0, 0.23), mat('FLeg' + tod, C('#8a8a90', tod)), bevel=0))
    if tod == 'night':
        point(uid('CanopyLight'), (0, 5.8, 2.6), 900, '#fff0c8', radius=0.4)
        string_lights((-3.4, 4.0, 2.85), (3.4, 4.0, 2.85), n=16, sag=0.25)
    sky(tod); sun(tod, azimuth=-35, elevation=52 if tod == 'day' else 30)
    tv_camera((0.4, -4.8, 1.7), (0, 8, 1.2), lens=26)


def fl_backlot(tod):
    """The backlot: a Western street of false fronts, lights and chairs left out between takes."""
    ground(C('#c9a878', tod), size=(160, 120), loc=(0, 20, 0))
    city_back(tod, y=60)
    fronts = (('SALOON', '#b9784a', '#7a4a2a'), ('BANK', '#c9b48a', '#6a5232'), ('HOTEL', '#8aa0b4', '#4a5a6a'), ('JAIL', '#a89a7a', '#5a4a3a'))
    for i, (s, col, trim) in enumerate(fronts):
        false_front((-10.5 + i * 7.0, 13, 0), 6.4, 5.5 + (i % 2) * 1.2, tod, col, trim, sign=s)
    for x in (-13.5, 13.5):
        false_front((x, 6, 0), 6.0, 5.2, tod, ('#b4946a' if x < 0 else '#9aa88a'), '#5a4a3a', sign=None, rot_z=90 if x < 0 else -90)
    box('Trough', (2.0, 0.6, 0.6), (-4.0, 9.8, 0.3), mat('Trough' + tod, C('#7a5232', tod)), bevel=0)
    box('HitchRail', (3.0, 0.1, 0.1), (3.5, 10.0, 1.0), mat('Rail' + tod, C('#7a5232', tod)), bevel=0)
    for x in (2.2, 4.8):
        post((x, 10.0, 0), 1.05, tod, r=0.06)
    film_light((-6.5, 4.5, 0), tod, aim=(0, 0, 25))
    film_light((6.5, 4.0, 0), tod, aim=(0, 0, -25))
    director_chair((-2.0, 2.4, 0), tod, rot_z=15, col='#2f2f36')
    director_chair((-0.8, 2.6, 0), tod, rot_z=-5, col='#bf3f5a')
    for i in range(3):
        icorock(uid('Tumble'), (0.35, 0.35, 0.35), (1.5 + i * 2.2, 6.0 + i * 0.7, 0.35), C('#b8945a', tod), seed=i + 40)
    if tod == 'night':
        for x in (-7.0, 0.0, 7.0):
            lamp_post((x, 10.6, 0), 3.0, tod)
    sky(tod); sun(tod, azimuth=-50, elevation=46 if tod == 'day' else 28)
    tv_camera((0.0, -6.5, 1.75), (0, 14, 2.0), lens=24)


def fl_corridor(tod):
    """Inside a soundstage: a long block-walled corridor, numbered stage doors, cables taped down the floor."""
    W, D, H = 4.0, 22.0, 4.2
    interior(W, D, H, '#c9c2b4', '#8f8a84', '#6f6a64', floor_kind='flat', wall_kind='flat')
    for i, y in enumerate((5.0, 11.0, 17.0)):
        for side in (-1, 1):
            x = side * (W / 2 - 0.08)
            box(uid('SDoor'), (0.06, 1.8, 2.6), (x, y, 1.3), mat('SDoor', '#5f6f7f'), bevel=0)
            box(uid('SDoorSign'), (0.04, 1.0, 0.35), (x - side * 0.05, y, 2.95), mat('SDoorSign', '#3a3a40'), bevel=0)
            text_obj(uid('SDoorTxt'), 'STAGE %d' % (i * 2 + (1 if side < 0 else 2)), (x - side * 0.08, y, 2.95), 0.2, '#f6f0de', rot=(90, 0, -90 * side))
        box(uid('RedLight'), (0.15, 0.15, 0.15), (-W / 2 + 0.15, y - 1.3, 3.5), mat('RedLight', '#ff3a3a', emit='#ff3a3a', strength=4), bevel=0)
    box('ExitSign', (1.0, 0.08, 0.35), (0, D - 0.12, 3.5), mat('ExitSign', '#3fae6a', emit='#3fae6a', strength=3), bevel=0)
    text_obj('ExitTxt', 'EXIT', (0, D - 0.18, 3.5), 0.24, '#f6fff6')
    for x in (-0.6, -0.35):
        box(uid('Cable'), (0.05, D - 1.0, 0.04), (x, D / 2, 0.02), mat('Cable', '#26262a'), bevel=0)
    for y in range(2, 22, 3):
        box(uid('Tape'), (0.6, 0.12, 0.01), (-0.48, y, 0.045), mat('Tape', '#e8c23a'), bevel=0)
    for y in range(3, 22, 5):
        box(uid('Tube'), (0.25, 1.6, 0.06), (0, y, H - 0.05), mat('Tube', '#f6f6ff', emit='#f6f6ff', strength=3), bevel=0)
        point(uid('TubeLight'), (0, y, H - 0.4), 260, '#eef2ff', radius=0.3)
    box('Crate', (0.8, 0.8, 0.8), (1.4, 7.5, 0.4), mat('Crate', '#a8834f'), bevel=0)
    box('Crate2', (0.6, 0.6, 0.6), (1.45, 7.6, 1.1), mat('Crate', '#a8834f'), bevel=0)
    box('Rack', (0.5, 1.6, 1.6), (1.6, 13.5, 0.8), mat('Rack', '#4a4a52'), bevel=0)
    indoor_light(W, D, H, color='#eef2ff', power=600, amb=0.7)
    tv_camera((0.3, 0.6, 1.65), (-0.1, D, 1.5), lens=22)


def fl_props(tod):
    """Prop storage: tall shelves of junk, a fake boulder, a mannequin, one work lamp."""
    W, D, H = 9.0, 8.0, 4.2
    interior(W, D, H, '#8a7f70', '#6f6a62', '#4f4a44', floor_kind='flat', wall_kind='flat')
    shelf = mat('Shelf', '#6b5a44')
    for x in (-3.0, 0.0, 3.0):
        for z in (0.1, 1.2, 2.3, 3.4):
            box(uid('ShelfBoard'), (2.6, 1.0, 0.06), (x, D - 0.6, z), shelf, bevel=0)
        for sx in (-1.3, 1.3):
            box(uid('ShelfPost'), (0.06, 1.0, 3.5), (x + sx, D - 0.6, 1.75), shelf, bevel=0)
    rnd = random.Random(21)
    cols = ('#c85a3a', '#3f7fbf', '#e2a23a', '#7fbf4a', '#b48ac8', '#d8d2c4')
    for x in (-3.0, 0.0, 3.0):
        for z in (0.13, 1.23, 2.33):
            for k in range(3):
                s = 0.25 + rnd.random() * 0.4
                box(uid('Prop'), (s * 1.3, 0.6, s), (x - 0.8 + k * 0.8, D - 0.6, z + s / 2 + 0.03), mat('Prop' + str(k + int(z)), rnd.choice(cols)), bevel=0)
    icorock('FakeBoulder', (1.4, 1.1, 1.1), (-2.8, 4.0, 0.7), '#9a8f80', seed=31)
    cyl('MannequinBody', 0.25, 1.1, (2.6, 4.5, 1.15), mat('Mannequin', '#e6d2b8'), verts=16, r2=0.2, bevel=0)
    sphere('MannequinHead', 0.18, (2.6, 4.5, 1.9), mat('Mannequin', '#e6d2b8'))
    cyl('MannequinPole', 0.03, 0.6, (2.6, 4.5, 0.3), mat('Pole', '#3a3a40'), verts=8, bevel=0)
    box('Crate', (1.0, 1.0, 0.9), (0.4, 3.2, 0.45), mat('Crate', '#a8834f'), bevel=0)
    text_obj('CrateTxt', 'FRAGILE', (0.4, 2.68, 0.5), 0.17, '#8a2a1c')
    box('Sword', (0.04, 0.04, 1.2), (0.8, 3.4, 1.4), mat('Sword', '#c9ccd2'), bevel=0, rot=(0, 25, 0))
    cyl('Hanging', 0.3, 0.3, (0, 3.5, H - 0.4), mat('LampShade', '#3a3a40'), verts=16, r2=0.1, bevel=0)
    point('WorkLamp', (0, 3.5, H - 0.7), 900, '#ffe2a8', radius=0.15)
    indoor_light(W, D, H, color='#ffe2a8', power=500, amb=0.35, fill='#c8c0b0')
    tv_camera((0.0, -0.4, 1.7), (0, D, 1.3), lens=22)


def fl_confessional(tod):
    """The makeup trailer: a vanity mirror ringed with bulbs, a counter of make-up, the chair in front."""
    W, D, H = 3.2, 2.8, 2.5
    interior(W, D, H, '#e8dccb', '#9a8a7a', '#d8ccbb', floor_kind='flat', wall_kind='flat')
    box('Counter', (2.8, 0.55, 0.85), (0, D - 0.3, 0.42), mat('Counter', '#f2ece2'), bevel=0)
    box('Mirror', (1.6, 0.04, 1.0), (0, D - 0.08, 1.65), mat('Mirror', '#cfe0ea', rough=0.1), bevel=0)
    for i in range(14):
        t = i / 13
        if i < 5:
            p = (-0.85 + i * 0.425, D - 0.12, 2.22)
        elif i < 9:
            p = (0.88, D - 0.12, 2.1 - (i - 5) * 0.27)
        else:
            p = (-0.88, D - 0.12, 2.1 - (i - 9) * 0.27)
        sphere(uid('Bulb'), 0.055, p, mat('VanityBulb', '#fff6d8', emit='#fff6d8', strength=5))
    for i, c in enumerate(('#d84a6a', '#e2a23a', '#3a3a40', '#f2d2c4', '#b48ac8')):
        cyl(uid('Makeup'), 0.05, 0.16, (-0.9 + i * 0.3, D - 0.35, 0.93), mat('Makeup' + c, c), verts=10, bevel=0)
    box('Brushes', (0.12, 0.12, 0.2), (0.85, D - 0.35, 0.95), mat('BrushCup', '#3a3a40'), bevel=0)
    # the chair faces the camera, its back to the mirror; a low back so the mirror reads behind whoever sits
    g = _group('Chair', (0, D - 1.25, 0), 0)
    _child(g, box(uid('ChairSeat'), (0.6, 0.55, 0.12), (0, 0, 0.55), mat('ChairSeat', '#3a3a40'), bevel=0))
    _child(g, box(uid('ChairBack'), (0.6, 0.1, 0.38), (0, 0.27, 0.8), mat('ChairSeat', '#3a3a40'), bevel=0))
    _child(g, cyl(uid('ChairPole'), 0.05, 0.6, (0, 0, 0.3), mat('ChairPole', '#9aa3ad'), verts=10, bevel=0))
    box('Poster', (0.55, 0.04, 0.75), (-1.3, D - 0.1, 1.6), mat('Poster', '#bf3f5a'), bevel=0)
    star_shape('PosterStar', (-1.3, D - 0.13, 1.65), 0.2, GOLD)
    point('MirrorGlow', (0, D - 0.5, 1.7), 220, '#fff0c8', radius=0.4)
    indoor_light(W, D, H, power=420, x=0.0, amb=0.62)
    tv_camera((0.0, 0.05, 1.5), (0, D, 1.15), lens=17)


def statuette(loc, tod='night', s=1.0):
    """A Gilded Chris: a little gold man on a black base."""
    x, y, z = loc
    g = mat('Gilded', GOLD, metal=0.6, rough=0.3, emit='#a8781a', strength=0.4)
    cyl(uid('StatBase'), 0.09 * s, 0.08 * s, (x, y, z + 0.04 * s), mat('StatBase', '#1e1e22'), verts=12, bevel=0)
    cyl(uid('StatBody'), 0.05 * s, 0.26 * s, (x, y, z + 0.21 * s), g, verts=10, r2=0.035 * s, bevel=0)
    sphere(uid('StatHead'), 0.045 * s, (x, y, z + 0.38 * s), g)


def fl_ceremony(tod):
    """The Awards Ceremony: the lot's amphitheater shell, a stage, the podium with the statuettes."""
    tod = 'night'
    asphalt(tod)
    city_back(tod, y=60)
    stage = plank_deck('AwardStage', (12, 6, 1.0), (0, 10, 0.5), tod, color='#6b4a3a', seam='#3a2a1c')
    box('StageLip', (12.2, 0.2, 1.05), (0, 6.95, 0.5), mat('StageLip', '#2a2228'), bevel=0)
    shell = mat('Shell', C('#e8dccb', tod))
    for i in range(15):
        a = math.radians(180 - i * (180 / 14))
        x, y = math.cos(a) * 6.5, 12.5 + math.sin(a) * 2.6
        box(uid('ShellRib'), (1.45, 0.3, 7.0 - abs(i - 7) * 0.3), (x, y, 1.0 + (7.0 - abs(i - 7) * 0.3) / 2), shell, bevel=0, rot=(0, 0, math.degrees(a) - 90))
    box('Curtain', (9.0, 0.15, 4.5), (0, 14.4, 3.25), mat('Curtain', C('#8a1e2e', tod)), bevel=0)
    for i in range(10):
        box(uid('Fold'), (0.12, 0.2, 4.5), (-4.2 + i * 0.93, 14.3, 3.25), mat('CurtainFold', C('#6a1422', tod)), bevel=0)
    box('Podium', (1.1, 0.7, 1.15), (2.2, 9.0, 1.58), mat('Podium', C('#2a2228', tod)), bevel=0)
    box('PodiumTop', (1.3, 0.85, 0.06), (2.2, 9.0, 2.18), mat('PodiumTop', GOLD, metal=0.5, rough=0.35), bevel=0)
    for i in range(6):
        statuette((1.8 + (i % 3) * 0.25, 8.85 + (i // 3) * 0.3, 2.21), s=1.0)
    text_obj('Banner', 'AWARDS', (0, 14.2, 6.2), 0.9, GOLD)
    for x in (-5.0, 5.0):
        cyl(uid('SpotStand'), 0.08, 3.5, (x, 4.5, 1.75), mat('SpotStand', '#2e2e32'), verts=8, bevel=0)
        cyl(uid('SpotHead'), 0.35, 0.6, (x, 4.5, 3.6), mat('SpotHead', '#3a3a40'), verts=14, rot=(-60, 0, 0), bevel=0)
        sp = bpy.data.lights.new(uid('Spot'), 'SPOT'); sp.energy = 2600; sp.spot_size = math.radians(32); sp.color = hexc('#fff0d0')[:3]
        so = _link(bpy.data.objects.new(uid('Spot'), sp)); so.location = (x, 4.6, 3.7)
        so.rotation_euler = (Vector((x * -0.2, 10.5, 1.2)) - so.location).to_track_quat('-Z', 'Y').to_euler()
    for r in range(3):
        box(uid('Bleacher'), (12.0, 0.9, 0.4 + r * 0.4), (0, 2.6 - r * 0.9, (0.4 + r * 0.4) / 2), mat('Bleacher', C('#9aa3ad', tod)), bevel=0)
    for i in range(7):
        sphere(uid('Bulb'), 0.1, (-4.5 + i * 1.5, 6.9, 1.08), mat('FootLight', '#fff1c8', emit='#fff1c8', strength=5))
    sky(tod); sun(tod, azimuth=-30, elevation=28)
    point(uid('HouseLight'), (0, 1.0, 5.0), 1400, '#ffe2c8', radius=1.0)
    tv_camera((-1.0, -2.0, 2.9), (0.3, 12, 2.2), lens=24)


def lameosine(loc, tod, rot_z=0):
    """The Lame-o-sine: a stretch limo gone to rust, one hubcap missing, a door hanging open."""
    g = _group(uid('Limo'), loc, rot_z)
    paint = mat('LimoPaint' + tod, C('#d8cfc0', tod))
    _child(g, box(uid('LimoBody'), (2.2, 9.0, 0.9), (0, 0, 0.75), paint, bevel=0.12))
    _child(g, box(uid('LimoCab'), (2.0, 7.2, 0.7), (0, -0.2, 1.5), paint, bevel=0.1))
    win = mat('LimoWin' + tod, C('#3a4a5a', tod))
    for x in (-1.02, 1.02):
        _child(g, box(uid('LimoWin'), (0.04, 6.8, 0.45), (x, -0.2, 1.55), win, bevel=0))
    _child(g, box(uid('Windscreen'), (1.8, 0.04, 0.5), (0, 3.42, 1.55), win, bevel=0))
    rust = mat('Rust' + tod, C('#a8582a', tod))
    rnd = random.Random(8)
    for i in range(9):
        _child(g, box(uid('RustPatch'), (0.04, 0.3 + rnd.random() * 0.6, 0.2 + rnd.random() * 0.25), (-1.11, -4 + i * 0.95, 0.5 + rnd.random() * 0.5), rust, bevel=0))
    for y in (-3.2, 3.0):
        for x in (-1.0, 1.0):
            _child(g, cyl(uid('Tyre'), 0.42, 0.3, (x, y, 0.42), mat('Tyre' + tod, C('#1e1e22', tod)), verts=18, rot=(0, 90, 0), bevel=0))
    _child(g, box(uid('Headlight'), (0.4, 0.06, 0.2), (-0.65, 4.52, 0.85), mat('Headlight', '#fff1c8', emit='#fff1c8', strength=3), bevel=0))
    _child(g, box(uid('HeadlightOut'), (0.4, 0.06, 0.2), (0.65, 4.52, 0.85), mat('DeadLight', '#5a5a5a'), bevel=0))
    return g


def fl_shame(tod):
    """The Walk of Shame: a red carpet between velvet ropes, out to the Lame-o-sine with its door open."""
    tod = 'night'
    asphalt(tod)
    city_back(tod, y=55)
    box('Carpet', (2.4, 18, 0.03), (0, 7, 0.015), mat('Carpet', C('#b0202e', tod)), bevel=0)
    for y in range(0, 16, 2):
        for x in (-1.6, 1.6):
            cyl(uid('Stanchion'), 0.05, 0.95, (x, y, 0.47), mat('Brass', GOLD, metal=0.6, rough=0.3), verts=10, bevel=0)
            sphere(uid('StanchTop'), 0.08, (x, y, 0.98), mat('Brass', GOLD, metal=0.6, rough=0.3))
            if y < 14:
                box(uid('Rope'), (0.07, 2.0, 0.07), (x, y + 1, 0.82), mat('Velvet', C('#6a1422', tod)), bevel=0)
    lameosine((0.5, 18.5, 0), tod, rot_z=-90)
    point(uid('LimoLight'), (0, 15.5, 3.0), 900, '#ffe2a8', radius=0.4)
    for x in (-6.0, 6.0):
        film_light((x, 8.0, 0), tod, aim=(0, 0, 30 if x < 0 else -30))
    trailer((-10, 15, 0), tod, rot_z=20, stripe='#3f7fbf')
    for x in (-4.0, 4.0):
        lamp_post((x, 12.0, 0), 3.4, tod)
    sky(tod); sun(tod, azimuth=-30, elevation=28)
    tv_camera((0.0, -4.5, 1.9), (0.8, 18, 0.9), lens=26)


SCENES['film-lot'] = {
    'trailers': fl_trailers, 'craft-services': fl_craft, 'studio-backlot': fl_backlot,
    'soundstage-corridor': fl_corridor, 'prop-storage': fl_props,
    'confessional': fl_confessional, 'ceremony': fl_ceremony, 'exit': fl_shame,
}
OUTDOOR['film-lot'] = {'trailers', 'craft-services', 'studio-backlot'}

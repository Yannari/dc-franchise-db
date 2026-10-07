# ══════════════════════════════════════════════════════════════════════
# venues/world_tour_more.py — the jet's cabins redrawn closer to Total Drama World Tour
# ══════════════════════════════════════════════════════════════════════
# Replaces four first-version plates (world_tour.py). References (Total Drama Wiki, "Total Drama
# Jumbo Jet"):
#   Tdwteconomyclass   slate-blue riveted panels rather than open ribs, open bins overhead crammed with
#                      junk, a laundry line, a long wooden bench, a hole kicked through the floor plating
#   Tdwtdiningarea     the bulkhead's arched double doors with their windows, a cream table on one leg,
#                      a green stool, a fire extinguisher, a goat that should not be there
#   Conftdwt           the confessional: a pale blue-grey airline toilet, rounded, a round bowl in the
#                      floor, a little window, a cracked mirror, a vent, a sign
#   Tdwtelimination    the Barf Bag Ceremony: towering tiki masks with heavy-lidded eyes, a thatch hut
#                      hung with a flowered curtain, bleacher steps, the hull's ribs dark overhead

SLATE, SLATE_SH, SEAM = '#3e4856', '#2a323e', '#20262e'


def panel_hull(D, R, tod, zc=0.6, col=SLATE, step=1.4, y0=0.0):
    """The cabin wall the way World Tour paints it: a tube of slate panels, seams between them,
    rivets along each seam (no open ribs)."""
    h = jet_hull(D, R, tod, zc=zc, col=col, ribs=False, y0=y0)
    sm = pmat('PanelSeam' + tod, N(SEAM, tod), unlit=True, mottle=0)
    y = y0 + step
    while y < y0 + D:
        for k in range(24):
            a0 = math.radians(-14 + k * 208 / 24)
            x, z = math.cos(a0) * (R - 0.04), zc + math.sin(a0) * (R - 0.04)
            ob = box(uid('Seam'), (0.05, 0.03, 2 * math.pi * R / 46), (x, y, z), sm, bevel=0)
            ob.rotation_euler = (0, -a0, 0)
        y += step
    for k in range(5):
        a0 = math.radians(20 + k * 35)
        x, z = math.cos(a0) * (R - 0.04), zc + math.sin(a0) * (R - 0.04)
        ob = box(uid('SeamL'), (0.03, D, 0.05), (x, y0 + D / 2, z), sm, bevel=0)
        ob.rotation_euler = (0, -a0, 0)
    return h


def overhead_bin(x, y0, y1, z, side, tod):
    """An open luggage shelf along the wall, stuffed."""
    L = y1 - y0
    pbox('BinShelf', (0.9, L, 0.08), (x, (y0 + y1) / 2, z), '#4a5462', tod)
    pbox('BinLip', (0.08, L, 0.3), (x - side * 0.42, (y0 + y1) / 2, z + 0.12), '#56606e', tod)
    rnd = random.Random(int(x * 10 + y0))
    y = y0 + 0.3
    while y < y1 - 0.4:
        w = rnd.uniform(0.3, 0.7); c = rnd.choice(('#a8834f', '#8a6a3a', '#6a8aa8', '#c8503a', '#d8d0b8', '#5a7a4a'))
        hh = rnd.uniform(0.25, 0.5)
        pbox('BinJunk', (0.6, w, hh), (x - side * 0.15, y + w / 2, z + 0.04 + hh / 2), c, tod)
        if rnd.random() < 0.3:
            pbox('Dangle', (0.05, 0.25, 0.5), (x - side * 0.4, y + w / 2, z - 0.25), rnd.choice(('#d8c8a8', '#c8503a', '#6a8aa8')), tod, ink=False)
        y += w + rnd.uniform(0.05, 0.3)


def wt_economy2(tod):
    paint_mode()
    W, D, R = 5.6, 16, 3.2
    floor_plates(W, D, tod, col='#46505c')
    panel_hull(D, R, tod)
    for sx in (-1, 1):
        pbox('Bench', (0.7, D - 3, 0.12), (sx * (W / 2 - 0.6), D / 2, 0.55), '#8a5a32', 'day')
        pbox('BenchBack', (0.12, D - 3, 0.5), (sx * (W / 2 - 0.3), D / 2, 0.9), '#7a4e2c', 'day')
        for yy in range(2, int(D) - 1, 3):
            pbox('BenchLeg', (0.6, 0.1, 0.5), (sx * (W / 2 - 0.6), yy, 0.27), '#5a3a22', 'day')
        for yy in (4.0, 9.0, 13.5):
            porthole(sx * (W / 2 - 0.35), yy, 1.6, sx, tod)
        overhead_bin(sx * (W / 2 - 0.95), 1.0, D - 1.0, 2.2, sx, tod)
    pbox('Line', (4.4, 0.03, 0.03), (0, 6.0, 2.6), '#d8d0b8', 'day', ink=False)
    for k, c in enumerate(('#a8786a', '#d8c8a8', '#6a8aa8', '#c8a050', '#e8e2d8')):
        pbox('Laundry', (0.55, 0.04, 0.6 + (k % 2) * 0.25), (-1.8 + k * 0.9, 6.0, 2.6 - (0.6 + (k % 2) * 0.25) / 2), c, 'day', mottle=0.2)
    # the hole kicked through the floor, its edges bent up
    card(uid('FloorHole'), [(-0.6, -0.4), (0.0, -0.6), (0.7, -0.3), (0.5, 0.35), (-0.2, 0.5), (-0.7, 0.2)], 0, pmat('FloorHoleP', '#0e1418', unlit=True, mottle=0), x=0.6, z=0.0).rotation_euler = (math.radians(-90), 0, 0)
    for k in range(4):
        pbox('BentPlate', (0.4, 0.06, 0.25), (0.6 + math.cos(k * 1.6) * 0.7, 9.0 + math.sin(k * 1.6) * 0.45, 0.1), '#56606e', 'day', rot=(30, 0, k * 45))
    pbox('BackWall', (W + 1, 0.2, R * 2), (0, D - 0.4, 0.6), SLATE_SH, 'day', mottle=0.3, ink=False)
    pbox('Door', (1.4, 0.1, 2.4), (0, D - 0.55, 1.2), '#4a5462', 'day')
    hanging_lamp(0, 7, 3.0, warm=False)
    for x in (-1.6, 0.0, 1.6):
        stand(x, 3.0)
    room_light(azimuth=-30, elevation=70, energy=2.2)
    paint_sky('#1e2428', '#1e2428')
    tv_camera((0.4, 0.2, 1.75), (0, D, 1.4), lens=22)


def goat(x, y, tod, s=1.0):
    """The goat in the dining area. Nobody knows."""
    wm = pmat('Goat' + tod, N('#e8e4dc', tod), unlit=True, mottle=0.05)
    card(uid('GoatBody'), _blob_pts(0.5 * s, 0.3 * s, 16, 0.05, 2), y, wm, x=x, z=0.75 * s)
    card(uid('GoatHead'), _blob_pts(0.2 * s, 0.22 * s, 12, 0, 3), y - 0.01, wm, x=x - 0.5 * s, z=1.05 * s)
    for lx in (-0.3, -0.1, 0.15, 0.35):
        card(uid('GoatLeg'), [(-0.04 * s, 0), (0.04 * s, 0), (0.04 * s, 0.55 * s), (-0.04 * s, 0.55 * s)], y + 0.01, wm, x=x + lx * s)
    for sd in (-1, 1):
        card(uid('Horn'), [(0, 0), (0.05 * s, 0), (sd * 0.12 * s, 0.22 * s)], y - 0.02, pmat('Horn' + tod, N('#8a7a6a', tod), unlit=True, mottle=0), x=x - 0.5 * s + sd * 0.07 * s, z=1.22 * s)
    card(uid('GoatEye'), _blob_pts(0.03 * s, 0.03 * s, 8, 0, 0), y - 0.03, pmat('GoatEye', '#1a1a1a', unlit=True, mottle=0), x=x - 0.56 * s, z=1.08 * s)


def wt_galley2(tod):
    paint_mode()
    W, D, R = 6.4, 6.0, 3.0
    floor_plates(W, D, tod, col='#4a5058')
    panel_hull(D + 1, R, tod, step=1.6)
    # the bulkhead with its arch and double doors
    pbox('Bulkhead', (W + 1, 0.2, 4.2), (0, D, 1.6), SLATE, 'day', shade=SLATE_SH, mottle=0.3, ink=False)
    arch = [(math.cos(math.pi * i / 20) * 1.55, 2.6 + math.sin(math.pi * i / 20) * 0.9) for i in range(21)]
    card(uid('ArchFrame'), [(1.75, 0), (1.75, 2.6)] + [(x * 1.13, 2.6 + (z - 2.6) * 1.2) for x, z in arch] + [(-1.75, 2.6), (-1.75, 0), (-1.55, 0), (-1.55, 2.6)] + arch[::-1] + [(1.55, 2.6), (1.55, 0)],
         D - 0.12, pmat('ArchFrame' + tod, N('#56606e', tod), unlit=True, mottle=0))
    for sx in (-0.75, 0.75):
        pbox('Door', (1.45, 0.1, 2.6), (sx, D - 0.14, 1.3), '#4f6670', 'day')
        pbox('DoorWin', (0.9, 0.11, 1.0), (sx, D - 0.16, 1.9), '#6aa0a8', 'day', unlit=True, ink=False)
        pbox('DoorPlate', (0.3, 0.12, 0.12), (sx * 0.15, D - 0.17, 1.2), '#9aa0a8', 'day')
    pcyl('Extinguisher', 0.12, 0.6, (2.6, D - 0.4, 1.2), '#c8302a', 'day', verts=12)
    # the cream table on its single leg, the stools
    pbox('TableTop', (2.6, 1.1, 0.1), (1.8, 3.4, 1.05), '#d8d0a0', 'day')
    pcyl('TableLeg', 0.08, 1.0, (1.8, 3.4, 0.52), '#3a3a42', 'day', verts=8)
    for (x, y) in ((1.2, 2.4), (2.6, 2.6)):
        pcyl('Stool', 0.3, 0.6, (x, y, 0.3), '#5a8a72', 'day', verts=14)
    pbox('Grate', (1.6, 0.9, 0.02), (-0.8, 3.6, 0.005), '#2a3036', 'day', ink=False)
    goat(-1.8, 2.8, tod, s=1.0)
    hanging_lamp(0.0, 3.4, 2.9, warm=True)
    for x in (-0.6, 0.8):
        stand(x, 2.0)
    room_light(azimuth=-30, elevation=70, energy=2.4)
    paint_sky('#1e2428', '#1e2428')
    tv_camera((0.2, -1.4, 1.75), (0, D, 1.4), lens=22)


def wt_confessional2(tod):
    paint_mode()
    W, D, H = 3.0, 2.6, 2.8
    pale, pale_sh = '#b8c8cc', '#8aa0a8'
    plank_floor('Floor', (W, D, 0.2), (0, D / 2, -0.1), '#a0b0b4', 'day', axis='x', step=0.5, seam='#7a8a90')
    for nm, size, loc in (('BackWall', (W, 0.2, H), (0, D, H / 2)), ('LeftWall', (0.2, D, H), (-W / 2, D / 2, H / 2)), ('RightWall', (0.2, D, H), (W / 2, D / 2, H / 2))):
        pbox(nm, size, loc, pale, 'day', shade=pale_sh, mottle=0.25, ink=False)
    c = pbox('Ceiling', (W, D, 0.2), (0, D / 2, H + 0.1), '#a8b8bc', 'day', ink=False); c.visible_shadow = False
    for sx in (-1, 1):
        pbox('Curve', (0.5, D, 0.5), (sx * (W / 2 - 0.15), D / 2, H - 0.15), pale, 'day', rot=(0, sx * 45, 0), ink=False)
    # the round bowl in the floor, its lid up
    pcyl('Bowl', 0.42, 0.45, (0, D - 0.6, 0.22), '#e8eeee', 'day', verts=22)
    pcyl('BowlIn', 0.3, 0.46, (0, D - 0.6, 0.23), '#3a4448', 'day', verts=22, ink=False)
    pbox('Lid', (0.8, 0.06, 0.7), (0, D - 0.2, 0.75), '#e8eeee', 'day', rot=(-12, 0, 0))
    # the cracked mirror, the little window, the vent, a sign, the sink box
    pbox('Mirror', (0.8, 0.05, 1.0), (0, D - 0.12, 1.75), '#d8e8ec', 'day', unlit=True)
    for k in range(3):
        card(uid('Crack'), [(0, 0), (0.03, 0), (0.25 * math.cos(k * 2.1), 0.3 * math.sin(k * 2.1) + 0.02)], D - 0.15, pmat('MirrorCrack', '#6a7a80', unlit=True, mottle=0), x=0.15, z=1.85)
    card(uid('Window'), _blob_pts(0.28, 0.4, 20, 0, 0), D - 0.11, pmat('WinSkyC', '#8ad0e8' if tod == 'day' else '#2a3a6a', unlit=True, mottle=0), x=-1.0, z=1.7)
    pbox('Vent', (0.8, 0.05, 0.3), (0, D - 0.11, 2.55), '#7a8a90', 'day')
    pbox('Sign', (0.4, 0.05, 0.3), (0.85, D - 0.11, 1.35), '#f2f2ea', 'day')
    card(uid('NoSmoke'), _blob_pts(0.1, 0.1, 12, 0, 0), D - 0.15, pmat('NoSmoke', '#c8302a', unlit=True, mottle=0), x=0.85, z=1.35)
    pbox('SinkBox', (0.6, 0.6, 0.9), (1.15, 1.6, 0.45), '#e8eeee', 'day')
    pcyl('Roll', 0.1, 0.22, (-1.38, 1.4, 1.0), '#f2f2ea', 'day', verts=12, rot=(0, 90, 0))
    for x in (0.0,):
        stand(x, 1.2)
    room_light(azimuth=-30, elevation=60, energy=3.0)
    paint_sky('#c8d0d4', '#c8d0d4')
    tv_camera((0.0, -1.0, 1.5), (0, D, 1.4), lens=22)


def wt_ceremony2(tod):
    """The Barf Bag Ceremony (Tdwtelimination): the rear compartment under the hull's dark ribs, towering
    tiki masks on the left with heavy-lidded yellow eyes, a thatch hut on the right hung with a
    flowered curtain, bleacher steps for the contestants, Chris's lectern."""
    paint_mode()
    W, D, R = 9.0, 10, 4.0
    floor_plates(W, D, tod, col='#3a3028')
    jet_hull(D, R, tod, zc=0.8, col='#2a3038', rib='#3e4652', step=1.8)
    # the masks
    for k, (x, y, h, col) in enumerate(((-3.2, 4.0, 4.8, '#b85a2a'), (-2.4, 6.5, 4.2, '#a84a2a'), (-3.4, 8.6, 3.8, '#c8642a'))):
        pbox('Mask', (1.4, 0.4, h), (x, y, h / 2), col, 'day', shade=_mix_hex(col, '#2a1a1a', 0.35), mottle=0.35, mscale=1.5)
        for sx in (-0.32, 0.32):
            card(uid('MaskEye'), _blob_pts(0.28, 0.18, 14, 0, 0), y - 0.21, pmat('MaskEyeY', '#e8c23a', unlit=True, mottle=0), x=x + sx, z=h * 0.68)
            card(uid('MaskLid'), [(-0.3, 0), (0.3, 0), (0.3, 0.12), (-0.3, 0.12)], y - 0.22, pmat('MaskLid', '#4a2a1a', unlit=True, mottle=0), x=x + sx, z=h * 0.7)
            card(uid('MaskPupil'), _blob_pts(0.08, 0.08, 10, 0, 0), y - 0.23, pmat('MaskPupil', '#1a1a1a', unlit=True, mottle=0), x=x + sx, z=h * 0.66)
        card(uid('MaskMouth'), [(-0.5, 0), (0.5, 0), (0.4, -0.3), (-0.4, -0.3)], y - 0.21, pmat('MaskMouthT', '#3a1a1a', unlit=True, mottle=0), x=x, z=h * 0.36)
        for j in range(3):
            card(uid('MaskStripe'), [(-0.7, 0), (0.7, 0), (0.7, 0.06), (-0.7, 0.06)], y - 0.21, pmat('MaskStripe', '#3a2a1a', unlit=True, mottle=0), x=x, z=h * (0.15 + j * 0.3))
    # the thatch hut with its flowered curtain
    pbox('HutBack', (3.0, 0.2, 2.6), (2.4, 8.5, 1.3), '#7a5a3a', 'day')
    pbox('Curtain', (2.4, 0.1, 2.2), (2.4, 8.3, 1.2), '#e8843a', 'day', mottle=0.15)
    rnd = random.Random(5)
    for k in range(14):
        c = rnd.choice(('#f2a8c8', '#f2e26a', '#e84a6a'))
        card(uid('Flower'), _blob_pts(0.12, 0.12, 8, 0.2, k), 8.24, pmat('Flower' + c, c, unlit=True, mottle=0), x=1.4 + rnd.uniform(0, 2.0), z=rnd.uniform(0.3, 2.2))
    thatch_m = '#c8a050'
    for sd in (-1, 1):
        pbox('HutThatch', (4.0, 2.2, 0.3), (2.4, 8.5 + sd * 0.6, 3.0), thatch_m, 'day', shade='#8a6a30', mottle=0.4, mscale=2.5, rot=(sd * -35, 0, 0))
    for k in range(12):
        card(uid('ThatchFringe'), [(-0.18, 0), (0.18, 0), (0, -0.45)], 7.2, pmat('ThatchFr', '#b8904a', unlit=True, mottle=0), x=0.5 + k * 0.35, z=2.55)
    for sx in (1.0, 3.8):
        pcyl('HutPost', 0.1, 2.6, (sx, 7.5, 1.3), '#5a3a22', 'day', verts=8)
    # bleacher steps for the contestants, Chris's lectern
    for r in range(3):
        pbox('Bleacher', (4.4, 0.7, 0.3 + r * 0.3), (2.0, 3.6 + r * 0.7, (0.3 + r * 0.3) / 2), '#8a5a32', 'day')
        for k in range(4):
            seat(0.6 + k * 0.95, 3.6 + r * 0.7, 0.3 + r * 0.3 + 0.02)
    pbox('Lectern', (0.8, 0.6, 1.2), (-0.6, 6.6, 0.6), '#5a3a22', 'day')
    mark('host', (-0.6, 6.6, 1.2))
    hanging_lamp(0.6, 5.0, 3.6, warm=True)
    room_light(azimuth=-30, elevation=60, energy=2.0)
    paint_sky('#161a1e', '#161a1e')
    tv_camera((0.4, -1.6, 2.5), (0.2, D, 1.9), lens=22)


SCENES['world-tour'].update({
    'economy': wt_economy2, 'galley': wt_galley2, 'confessional': wt_confessional2, 'ceremony': wt_ceremony2,
})

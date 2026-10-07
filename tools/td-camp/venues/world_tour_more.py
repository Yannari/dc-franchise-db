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


# ── the camp map: the jet in cross-section ────────────────────────────
def wt_map2(tod):
    """The jet cut open in flight, every room drawn the way its close-up plate is (the same rooms the
    viewer zooms into): the show's charcoal flying boat (TotalDramaJumboJet001: a high wing with
    propeller engines, a tall fin with the round crest, a stepped hull bottom), its plating seamed and
    riveted. Inside, behind slate panelled walls under the hull's ribs: the cockpit in the nose (Cockpit:
    two orange seats, green gauges, a map on the wall); first class (Tdwtfirstclass: cream walls, the
    curtained window, the yellow sofa, purple tulip seats, the red retro carpet, the speaker); economy
    (bins stuffed with junk, the laundry line, the bench, the hole in the floor); the aisle's purple seats
    and the red curtain; the confessional's pale airline toilet; the galley's arched doors, one-legged
    table, stools and goat; the Barf Bag Ceremony's tiki masks and flowered hut; the cargo hold's crates
    and luggage under the deck. The airstrip waits far below through the haze."""
    paint_mode(); day = tod == 'day'

    def fc(nm, pts, y, col, x=0.0, z=0.0, night=True, alpha=1.0):
        return card(uid(nm), pts, y, pmat('WN' + nm + col + tod + str(night), N(col, tod) if night else col, unlit=True, mottle=0.18, mscale=0.6, alpha=alpha), x=x, z=z)

    def rect(nm, x0, x1, z0, z1, y, col, night=False):
        return fc(nm, [(x0, z0), (x1, z0), (x1, z1), (x0, z1)], y, col, night=night)

    def disc(nm, x, z, r, y, col, night=False):
        return fc(nm, _blob_pts(r, r, 20, 0, 0), y, col, x=x, z=z, night=night)

    # the sky and the land far below
    if day:
        paint_sky('#7cc4e4', '#d8eef2', span=0.12); swirl_sun(-34, 60, 26, 5.0, tod)
    else:
        paint_sky('#1e2446', '#384070', span=0.12); swirl_sun(-34, 60, 26, 3.4, tod)
    fc('Land', [(-140, -90)] + [(-140 + i * 7, -14 + 2.2 * math.sin(i * 0.9) + 1.5 * math.sin(i * 0.37)) for i in range(41)] + [(140, -90)], 30, '#c8a46a')
    fc('LandBand', [(-140, -90)] + [(-140 + i * 7, -20 + 1.8 * math.sin(i * 0.6)) for i in range(41)] + [(140, -90)], 29.8, '#a8885a')
    fc('River', [(-140, -18), (-60, -16.6), (-20, -20), (30, -17.4), (140, -19), (140, -20.2), (30, -18.6), (-20, -21.4), (-60, -17.8), (-140, -19.2)], 29.6, '#3aa8b0')
    rect('Airstrip', 12, 46, -24.4, -22.8, 29.4, N('#6f6a64', tod))
    for k in range(6):
        rect('StripDash', 15 + k * 5.4, 17 + k * 5.4, -23.75, -23.45, 29.3, N('#f0e6c0', tod))
    fc('Haze', [(-160, -90), (160, -90), (160, -8), (-160, -8)], 24, '#d8eef2' if day else '#384070', night=False, alpha=0.38)
    for (cx, cz, cs) in ((-60, -6, 7.0), (-24, -9, 6.0), (6, -5, 5.0), (40, -8, 6.5), (70, -4, 5.0), (-48, 24, 4.0), (48, 28, 3.6)):
        curly_cloud(cx, 18, cz, cs, '#eef3fb' if day else '#8a94b8', '#b9c6e0' if day else '#5a6490')

    # ── the airframe, behind the rooms ──
    HULL, HULL_D, SEAMC = '#3a3e46', '#2a2e34', '#24282e'
    outline = [(-27, 16.4), (21, 16.4), (25, 17.2), (31, 20.0), (32, 18.6), (32, 13.2), (27, 10.6), (19, 2.6), (17, 1.6), (2, 1.6), (1, 0.9), (-24, 0.9),
               (-29.2, 3.4), (-32.4, 6.8), (-32.6, 10.2), (-30.6, 13.8)]
    fc('Hull', outline, 5.0, HULL)
    fc('HullBelly', [(-24, 0.9), (1, 0.9), (2, 1.6), (17, 1.6), (19, 2.6), (19, 2.2), (-26, 2.2), (-29.2, 3.4)], 4.95, HULL_D)
    for x in range(-24, 18, 3):
        rect('HullSeamV', x, x + 0.08, 1.0 if x < 1 else 1.7, 16.4, 4.9, SEAMC, night=True)
    for k in range(17):
        disc('Rivet', -23 + k * 2.6, 16.0, 0.08, 4.88, '#5a606a', night=True)
        if -23 + k * 2.4 < 16:
            disc('Rivet', -23 + k * 2.4, 1.3 if -23 + k * 2.4 < 1 else 2.0, 0.08, 4.88, '#5a606a', night=True)
    fc('Fin', [(23, 16.8), (27.4, 27.6), (30.6, 28.2), (31.6, 19.4)], 5.2, HULL)
    rect('FinSeam', 27.0, 27.08, 18.5, 26.5, 5.15, SEAMC, night=True)
    disc('Crest', 28.9, 23.6, 1.3, 4.6, '#e0922a', night=True)
    disc('CrestIn', 28.9, 23.6, 0.8, 4.55, '#8a3a1a', night=True)
    disc('CrestDot', 28.9, 23.6, 0.3, 4.5, '#e0922a', night=True)
    fc('Tailplane', [(25, 18.6), (35, 19.4), (35, 20.1), (25, 19.7)], 4.4, HULL_D)
    # the high wing on top, two engines with props spinning
    fc('Wing', [(-10, 16.2), (10, 16.2), (8.5, 17.8), (-8.5, 17.8)], 5.4, HULL_D)
    for ex in (-6.0, 2.5):
        fc('Nacelle', [(ex - 2.6, 16.9), (ex + 2.8, 16.9), (ex + 2.4, 18.7), (ex - 1.8, 18.9), (ex - 2.8, 18.2)], 5.3, '#4a4f58')
        fc('Spinner', [(ex - 2.8, 17.4), (ex - 3.6, 17.8), (ex - 2.8, 18.4)], 5.28, '#c8302a')
        fc('PropBlur', _blob_pts(0.35, 2.4, 20, 0, 0), 5.25, '#c8ccd2', x=ex - 3.0, z=17.9, night=False, alpha=0.45)
    # the nose: windshield panes over the cockpit
    for k, (x0, x1) in enumerate(((-31.6, -30.4), (-30.2, -29.0), (-28.8, -27.6))):
        fc('Windshield', [(x0, 12.0 + k * 0.5), (x1, 12.0 + k * 0.6), (x1, 13.4 + k * 0.6), (x0, 13.2 + k * 0.5)], -0.6, '#9ad8e8' if day else '#2a3a6a', night=False)

    # ── the cut and its rooms ──
    TOP, DECK, LOW = 15.2, 8.2, 2.8
    SL, SL_D = '#3e4856', '#2a323e'

    def panels(x0, x1, z0, z1, col=SL, seam=SL_D, y=3.0, step=1.4):
        rect('RoomWall', x0, x1, z0, z1, y, col)
        x = x0 + step
        while x < x1 - 0.2:
            rect('PanelV', x, x + 0.06, z0, z1, y - 0.01, seam); x += step
        for z in (z0 + (z1 - z0) * 0.45,):
            rect('PanelH', x0, x1, z, z + 0.06, y - 0.01, seam)

    def ribs(x0, x1, z0, z1, y=2.9, col='#56606e'):
        """The hull's ribs as they arch over a room: dark curved bands from floor to ceiling."""
        mid = (z0 + z1) / 2; r = (z1 - z0) / 2
        x = x0 + 1.2
        while x < x1 - 0.6:
            pts = [(x - 0.12 + 0.35 * math.cos(math.pi * t / 12 - math.pi / 2), mid + r * math.sin(math.pi * t / 12 - math.pi / 2)) for t in range(13)]
            pts += [(px + 0.18, pz) for px, pz in reversed(pts)]
            fc('RoomRib', pts, y, col, night=False)
            x += 2.4

    # cockpit (nose)
    rect('CockpitWall', -30.0, -26.5, DECK, 14.4, 3.0, '#2e3440')
    rect('CockpitPanel', -30.0, -26.5, DECK, DECK + 1.4, 1.2, '#3a4250')
    for k in range(6):
        disc('Gauge', -29.6 + k * 0.55, DECK + 1.0, 0.15, 1.1, '#5ad88a')
    rect('CockMap', -28.9, -27.6, DECK + 2.4, DECK + 3.6, 2.9, '#e8dcc0')
    for x in (-29.3, -27.4):
        rect('PilotSeat', x - 0.45, x + 0.45, DECK + 0.3, DECK + 2.4, 1.6, '#c8642a')
        rect('Harness', x - 0.08, x + 0.08, DECK + 0.6, DECK + 2.2, 1.55, '#3a3a42')
    # first class
    rect('FirstWall', -26.5, -13, DECK, TOP, 3.0, '#d8cca8')
    rect('FirstTrim', -26.5, -13, DECK + 2.6, DECK + 2.75, 2.95, '#b8ac8a')
    rect('CurtainBox', -22.6, -19.2, DECK + 3.2, DECK + 6.2, 2.9, '#7a2a2a')
    rect('FWin', -21.4, -20.4, DECK + 3.9, DECK + 5.4, 2.85, '#9ad8e8' if day else '#2a3a6a')
    for x in (-22.4, -20.1):
        rect('FCurtain', x, x + 0.9, DECK + 3.3, DECK + 6.0, 2.8, '#a82a2a')
    rect('Sofa', -26.0, -20.8, DECK + 0.3, DECK + 1.3, 1.0, '#d8a83a')
    rect('SofaBack', -26.0, -20.8, DECK + 1.3, DECK + 2.3, 1.6, '#c8982a')
    for x in (-25.2, -21.8):
        disc('Pillow', x, DECK + 1.6, 0.45, 0.9, '#f2e2a0')
    for k in range(3):
        x = -19.6 + k * 1.9
        fc('TulipSeat', [(x - 0.7, DECK + 1.0), (x + 0.7, DECK + 1.0), (x + 0.8, DECK + 3.0), (x + 0.4, DECK + 3.3), (x - 0.4, DECK + 3.3), (x - 0.8, DECK + 3.0)], 0.9, '#6a3a8a', night=False)
        rect('TulipStem', x - 0.08, x + 0.08, DECK + 0.25, DECK + 1.0, 0.95, '#2a2a2a')
    rect('Speaker', -14.6, -13.4, DECK + 2.6, DECK + 4.4, 1.2, '#5a4a3a')
    for z in (DECK + 3.1, DECK + 3.9):
        disc('Cone', -14.0, z, 0.3, 1.15, '#2a2a2a')
    rect('Carpet', -26.5, -13, DECK, DECK + 0.25, -0.3, '#c8503a')
    for k in range(8):
        rect('Retro', -25.8 + k * 1.6, -25.2 + k * 1.6, DECK + 0.04, DECK + 0.2, -0.32, '#f2a84a')
    # economy
    panels(-13, 1.8, DECK, TOP)
    ribs(-13, 1.8, DECK, TOP + 1.5)
    rect('Bench', -12.6, 1.4, DECK + 1.1, DECK + 1.4, 1.0, '#8a5a32')
    rect('BenchBack', -12.6, 1.4, DECK + 1.4, DECK + 2.0, 2.4, '#7a4e2c')
    for x in (-12.0, -7.0, -2.0, 1.0):
        rect('BenchLeg', x, x + 0.3, DECK, DECK + 1.1, 1.05, '#5a3a22')
    for k in range(4):
        disc('EPort', -10.5 + k * 3.4, DECK + 3.1, 0.42, 2.8, '#9ad8e8' if day else '#2a3a6a')
    rect('BinShelf', -12.8, 1.6, TOP - 2.0, TOP - 1.8, 1.4, '#4a5462')
    rnd = random.Random(14)
    x = -12.5
    while x < 1.2:
        w = rnd.uniform(0.6, 1.4); c = rnd.choice(('#a8834f', '#8a6a3a', '#6a8aa8', '#c8503a', '#d8d0b8', '#5a7a4a'))
        rect('BinJunk', x, x + w, TOP - 1.8, TOP - 1.8 + rnd.uniform(0.4, 0.9), 1.45, c)
        if rnd.random() < 0.35:
            rect('Dangle', x + w * 0.4, x + w * 0.55, TOP - 2.5, TOP - 2.0, 1.35, rnd.choice(('#d8c8a8', '#c8503a')))
        x += w + rnd.uniform(0.1, 0.4)
    fc('Line', [(-11.5, DECK + 4.4), (0.5, DECK + 4.0), (0.5, DECK + 4.08), (-11.5, DECK + 4.48)], 1.2, '#d8d0b8', night=False)
    for k, c in enumerate(('#a8786a', '#d8c8a8', '#6a8aa8', '#c8a050', '#e8e2d8')):
        rect('Laundry', -10.0 + k * 2.2, -9.1 + k * 2.2, DECK + 3.0, DECK + 4.3, 1.1, c)
    fc('FloorHole', [(-6.0, DECK - 0.5), (-4.6, DECK - 0.5), (-4.8, DECK + 0.1), (-5.4, DECK + 0.35), (-5.9, DECK + 0.1)], -0.42, '#0e1418', night=False)
    # the aisle
    panels(1.8, 6.6, DECK, TOP, col='#46545c')
    rect('Curtain', 1.95, 2.9, DECK + 0.2, TOP - 0.3, 1.0, '#a82a3a')
    for k in range(2):
        x = 3.4 + k * 1.5
        rect('SeatBack', x - 0.55, x + 0.55, DECK + 0.6, DECK + 2.6, 1.3, '#6a5a8a' if k % 2 == 0 else '#5a6a8a')
        rect('SeatHead', x - 0.45, x + 0.45, DECK + 2.6, DECK + 2.95, 1.25, '#d8d0b8')
    rect('Cart', 3.6, 5.2, DECK + 0.2, DECK + 1.6, 0.9, '#b8bcc4')
    # the confessional: the pale airline toilet
    rect('ConfWall', 6.6, 8.8, DECK, TOP, 3.0, '#b8c8cc')
    rect('ConfMirror', 7.2, 8.2, DECK + 2.4, DECK + 3.6, 2.9, '#d8e8ec')
    fc('ConfCrack', [(7.6, DECK + 3.1), (7.66, DECK + 3.1), (7.9, DECK + 2.7)], 2.85, '#6a7a8a', night=False)
    disc('ConfWin', 7.7, DECK + 4.6, 0.3, 2.9, '#9ad8e8' if day else '#2a3a6a')
    rect('Bowl', 7.2, 8.2, DECK + 0.2, DECK + 1.0, 1.0, '#e8eeee')
    rect('BowlIn', 7.35, 8.05, DECK + 0.85, DECK + 1.0, 0.95, '#3a4448')
    rect('Lid', 7.25, 8.15, DECK + 1.0, DECK + 2.0, 1.05, '#dfe6e6')
    # the galley: the arched doors, the one-legged table, the stools, the goat
    panels(8.8, 16.0, DECK, TOP, col='#4a5462')
    arch = [(12.0 + math.cos(math.pi * i / 16) * 1.5, DECK + 3.4 + math.sin(math.pi * i / 16) * 0.9) for i in range(17)]
    fc('ArchFrame', [(13.7, DECK), (13.7, DECK + 3.4)] + [(12.0 + (x - 12.0) * 1.13, DECK + 3.4 + (z - DECK - 3.4) * 1.2) for x, z in arch] + [(10.3, DECK + 3.4), (10.3, DECK), (10.5, DECK), (10.5, DECK + 3.4)] + arch[::-1] + [(13.5, DECK + 3.4), (13.5, DECK)],
       2.7, '#56606e', night=False)
    for x0 in (10.5, 12.0):
        rect('GDoor', x0, x0 + 1.48, DECK + 0.1, DECK + 3.4, 2.6, '#4f6670')
        rect('GDoorWin', x0 + 0.35, x0 + 1.1, DECK + 2.0, DECK + 2.9, 2.55, '#6aa0a8')
    rect('TableTop', 13.4, 15.8, DECK + 1.7, DECK + 1.95, 0.9, '#d8d0a0')
    rect('TableLeg', 14.5, 14.7, DECK + 0.1, DECK + 1.7, 0.95, '#3a3a42')
    for x in (13.4, 15.0):
        rect('Stool', x, x + 0.7, DECK + 0.1, DECK + 1.0, 0.8, '#5a8a72')
    rect('Extinguisher', 15.4, 15.75, DECK + 2.6, DECK + 3.7, 0.9, '#c8302a')
    gw = '#e8e4dc'
    fc('GoatBody', _blob_pts(0.6, 0.38, 16, 0.05, 2), 0.8, gw, x=9.9, z=DECK + 1.2, night=False)
    fc('GoatHead', _blob_pts(0.24, 0.27, 12, 0, 3), 0.79, gw, x=9.3, z=DECK + 1.6, night=False)
    for lx in (-0.35, -0.12, 0.15, 0.38):
        rect('GoatLeg', 9.9 + lx - 0.05, 9.9 + lx + 0.05, DECK + 0.1, DECK + 0.9, 0.81, gw)
    for sd in (-1, 1):
        fc('Horn', [(0, 0), (0.06, 0), (sd * 0.15, 0.28)], 0.78, '#8a7a6a', x=9.3 + sd * 0.08, z=DECK + 1.82, night=False)
    # the Barf Bag Ceremony
    rect('RearWall', 16.0, 23.2, DECK, TOP, 3.0, '#2a3038')
    ribs(16.0, 23.2, DECK, TOP + 1.5, col='#3e4652')
    for k, (x, h, col) in enumerate(((17.0, 5.0, '#b85a2a'), (18.6, 4.3, '#a84a2a'))):
        rect('Mask', x - 0.7, x + 0.7, DECK + 0.1, DECK + 0.1 + h, 1.4, col)
        for sx in (-0.32, 0.32):
            disc('MaskEye', x + sx, DECK + 0.1 + h * 0.68, 0.22, 1.35, '#e8c23a')
            rect('MaskLid', x + sx - 0.26, x + sx + 0.26, DECK + 0.1 + h * 0.68, DECK + 0.1 + h * 0.68 + 0.22, 1.33, '#4a2a1a')
            disc('MaskPupil', x + sx, DECK + 0.05 + h * 0.66, 0.07, 1.32, '#1a1a1a')
        rect('MaskMouth', x - 0.45, x + 0.45, DECK + 0.1 + h * 0.28, DECK + 0.1 + h * 0.4, 1.35, '#3a1a1a')
        for j in range(3):
            rect('MaskStripe', x - 0.7, x + 0.7, DECK + 0.1 + h * (0.12 + j * 0.3), DECK + 0.16 + h * (0.12 + j * 0.3), 1.34, '#3a2a1a')
    rect('HutCurtain', 19.8, 22.8, DECK + 0.1, DECK + 3.2, 1.6, '#e8843a')
    rnd = random.Random(5)
    for k in range(12):
        disc('Flower', rnd.uniform(20.0, 22.6), rnd.uniform(DECK + 0.4, DECK + 3.0), 0.13, 1.55, rnd.choice(('#f2a8c8', '#f2e26a', '#e84a6a')))
    fc('HutThatch', [(19.3, DECK + 3.2), (23.2, DECK + 3.2), (22.4, DECK + 4.8), (20.1, DECK + 4.8)], 1.5, '#c8a050', night=False)
    for k in range(10):
        fc('ThatchFringe', [(-0.18, 0), (0.18, 0), (0, -0.4)], 1.45, '#b8904a', x=19.5 + k * 0.4, z=DECK + 3.25, night=False)
    for r in range(3):
        rect('Bleacher', 18.4 + r * 0.4, 23.0, DECK, DECK + 0.4 + r * 0.4, 0.7 - r * 0.05, '#8a5a32')
    rect('RearLip', 16.4, 23.0, DECK - 0.5, DECK, -0.45, '#e8c23a')
    # the cargo hold
    rect('CargoWall', -14, 15.5, LOW, DECK - 0.5, 3.0, '#323e44')
    rect('Bilge', -26.5, -14, LOW + 0.4, DECK - 0.5, 3.0, '#262e34')
    for (x, w, h, c, z0) in ((-12.6, 2.2, 2.2, '#a8834f', 0), (-10.2, 1.8, 1.8, '#8a6a3a', 0), (-12.2, 1.6, 1.6, '#b8935f', 2.2),
                             (-2.0, 2.0, 2.0, '#7a5a32', 0), (0.2, 1.6, 1.5, '#a8834f', 0), (9.5, 2.4, 2.4, '#8a6a3a', 0), (11.9, 1.4, 1.2, '#b8935f', 0)):
        zz = LOW + 0.3 + z0
        rect('Crate', x, x + w, zz, zz + h, 1.0, c)
        rect('CrateSlat', x, x + w, zz + h * 0.45, zz + h * 0.55, 0.95, '#5a4228')
    for (x, c) in ((-6.6, '#7a2a2a'), (-5.0, '#2a4a6a'), (4.0, '#3a5a3a'), (5.6, '#7a6a2a')):
        rect('Suitcase', x, x + 1.4, LOW + 0.3, LOW + 1.3, 1.0, c)
        rect('Handle', x + 0.45, x + 0.95, LOW + 1.3, LOW + 1.55, 1.0, '#2a2a2a')
    fc('Duffel', _blob_pts(1.3, 0.6, 18, 0.05, 3), 1.0, '#4a5a3a', x=7.5, z=LOW + 0.9, night=False)
    for k in range(7):
        rect('HoldHazard', 13.4 + k * 0.28, 13.55 + k * 0.28, LOW + 0.3, DECK - 0.6, 2.8, '#e8c23a' if k % 2 == 0 else '#22262a')
    # floors, bulkheads, the rim of the cut
    rect('Deck', -30.0, 23.4, DECK - 0.5, DECK, -0.4, '#1e262c')
    rect('HoldFloor', -14, 15.5, LOW, LOW + 0.3, -0.3, '#1e262c')
    for x in (-26.66, -13.15, 1.65, 6.45, 8.65, 15.85):
        rect('Bulkhead', x, x + 0.32, DECK, TOP, -0.35, '#1e262c')
    rect('RimTop', -27.0, 23.6, TOP, TOP + 0.4, -0.5, '#24282e')
    rect('RimCockTop', -30.2, -26.6, 14.4, 14.8, -0.5, '#24282e')
    rect('RimBot', -24.0, 16.8, LOW - 0.4, LOW, -0.5, '#24282e')
    rect('RimNose', -30.2, -29.8, DECK - 0.5, 14.8, -0.5, '#24282e')
    rect('RimTail', 23.2, 23.6, DECK - 0.5, TOP + 0.4, -0.5, '#24282e')
    rect('RimHold', 15.5, 15.9, LOW, DECK, -0.5, '#24282e')
    for (lx, lz) in ((-5.0, TOP - 0.5), (4.2, TOP - 0.5), (12.0, TOP - 0.5), (-19.0, TOP - 0.5), (19.6, TOP - 0.5), (-3.0, DECK - 0.7)):
        fc('Lamp', [(lx - 0.6, lz - 0.6), (lx + 0.6, lz - 0.6), (lx + 0.3, lz), (lx - 0.3, lz)], 0.6, '#c8a48a', night=False)
        fc('Glow', _blob_pts(0.5, 0.12, 16, 0, 0), 0.55, '#fff2c0', x=lx, z=lz - 0.65, night=False)
    for zid, loc in (('first-class', (-19.5, 0, 12.6)), ('economy', (-5.5, 0, 12.6)), ('aisle', (4.2, 0, 12.6)), ('confessional', (7.7, 0, 13.4)),
                     ('galley', (12.4, 0, 12.6)), ('cargo-hold', (1.0, 0, 6.6)), ('destination-staging', (31.0, 30, -23.6))):
        mark('zone', loc, id=zid)
    paint_sun(azimuth=-35, elevation=55 if day else 35, energy=3.0 if day else 1.6)
    tv_camera((0.0, -72.0, 9.5), (0.0, 0.0, 5.8), lens=33)


SCENES['world-tour']['map'] = wt_map2

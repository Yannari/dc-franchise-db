# ══════════════════════════════════════════════════════════════════════
# venues/islands.py — the islands the voted-out go to: Rescue, Redemption, Exile
# ══════════════════════════════════════════════════════════════════════
# Shared by every setting (the twist screens: js/vp-td-ep). Reference: the Disventure Camp
# wiki's Rescue Island plates (Rescue_Island / DC4_Rescue_Island: a stormy islet under a dead
# rock spire; S4_Rescue_Island_Shelter: a skull-faced rock shelter in a dark wet forest;
# DC5_Rescue_Island_sign: the torch at the crossroads, "One Final Choice"; Exile_Beach: a
# night beach with a shipwreck, palms and a cave). Redemption Island is Survivor's: a lone
# beach camp with the duel arena behind it, painted the Island's way.

ISL = {
    'day': {'sky': '#7cc6ea', 'sky_low': '#d2ecf2', 'sea': '#2f8aa8', 'sea_far': '#5ab0c0', 'sand': '#d8c08a', 'ground': '#6a6a3a', 'ground_sh': '#4e4e30',
            'rock': '#6a5a5a', 'rock_sh': '#4a3e44', 'jungle': '#2f5a3a', 'cloud': '#eef3fb', 'rim': '#b9c6e0'},
    'night': {'sky': '#1e2448', 'sky_low': '#363e6a', 'sea': '#163852', 'sea_far': '#24506a', 'sand': '#6a6458', 'ground': '#2e3228', 'ground_sh': '#22261e',
              'rock': '#3a3440', 'rock_sh': '#262230', 'jungle': '#18282a', 'cloud': '#4a5288', 'rim': '#33407a'},
}


def isl_sky(tod, far_y=90, stormy=False):
    P = ISL[tod]
    paint_sky('#2a3058' if stormy and tod == 'night' else P['sky'], P['sky_low'])
    if tod == 'night':
        card(uid('Moon'), [(math.cos(a / 30 * 6.28) * 3, math.sin(a / 30 * 6.28) * 3) for a in range(30)], far_y + 60, pmat('MoonI', '#f6eec0', unlit=True, mottle=0), x=-24, z=44)
        card(uid('MoonCut'), [(math.cos(a / 30 * 6.28) * 2.7, math.sin(a / 30 * 6.28) * 2.7) for a in range(30)], far_y + 59.9, pmat('MoonCutI', P['sky'], unlit=True, mottle=0), x=-22.6, z=45)
        rnd = random.Random(9)
        for i in range(50):
            card(uid('Star'), _blob_pts(0.16, 0.16, 8, 0, 0), far_y + 62, pmat('StarI', '#f4f0d8', unlit=True, mottle=0), x=rnd.uniform(-90, 90), z=rnd.uniform(18, 60))
    for (cx, cz, cs) in ((-44, 46, 4.5), (14, 54, 3.4), (56, 42, 3.8)):
        curly_cloud(cx, far_y + 50, cz, cs, P['cloud'] if not stormy else '#3a3e5a', P['rim'] if not stormy else '#2a2e48')


def dead_spire(x, y, h, tod, w=6):
    """The rock spire of Rescue Island: a tall leaning slab of dead rock, a shadow side, a broken top."""
    P = ISL[tod]
    pts = [(-w, 0), (-w * .8, h * .3), (-w * .5, h * .7), (-w * .2, h), (w * .25, h * .92), (w * .4, h * .78), (w * .6, h * .5), (w, 0)]
    card(uid('Spire'), pts, y, pmat('Spire' + tod, P['rock'], unlit=True, mottle=0.35, mscale=0.6), x=x)
    card(uid('SpireSh'), [(w * .25, h * .92), (w * .4, h * .78), (w * .6, h * .5), (w, 0), (w * .15, 0)], y - 0.05, pmat('SpireSh' + tod, P['rock_sh'], unlit=True, mottle=0.2), x=x)
    for k in range(4):
        card(uid('Crack'), [(0, 0), (0.12, 0), (0.6, h * .3), (0.48, h * .3)], y - 0.08, pmat('Crack' + tod, _dark(P['rock'], .6), unlit=True, mottle=0), x=x - w * .3 + k * w * .3, z=h * (.2 + k * .12))


def skull_shelter(x, y, tod, s=1.0):
    """The Rescue Island shelter: a heap of rock shaped like a grinning skull, a mouth to sleep in."""
    P = ISL[tod]
    rock = pmat('SkullRock' + tod, N('#7a6e8a', tod), N('#544a64', tod), mottle=0.35, mscale=1.2)
    head = icorock(uid('SkullRock'), (3.2 * s, 2.4 * s, 2.8 * s), (x, y, 1.6 * s), N('#7a6e8a', tod), seed=7)
    head.data.materials.clear(); head.data.materials.append(rock); head['ink'] = 1
    dark = pmat('SkullHole' + tod, '#14101a', unlit=True, mottle=0)
    for sx in (-1, 1):
        card(uid('Eye'), _blob_pts(0.55 * s, 0.4 * s, 16, 0.15, 3 + sx), y - 2.3 * s, dark, x=x + sx * 1.0 * s, z=2.6 * s)
    card(uid('Mouth'), [(-1.4 * s, 0), (1.4 * s, 0), (1.2 * s, 1.0 * s), (-1.2 * s, 1.0 * s)], y - 2.35 * s, dark, x=x, z=0.3)
    for k in range(6):
        card(uid('Tooth'), [(-0.16 * s, 0), (0.16 * s, 0), (0, -0.4 * s)], y - 2.4 * s, pmat('Tooth' + tod, N('#d8d0c0', tod), unlit=True, mottle=0), x=x - 1.1 * s + k * 0.44 * s, z=1.3 * s)


def torch_post(x, y, tod, h=2.2):
    tiki(x, y, 'night' if tod == 'night' else tod, h)


def isl_rescue_crossroads(tod):
    """The crossroads: a torch-lit path splitting in a dark wet forest, the sign with one final choice."""
    paint_mode(); tod = 'night'; P = ISL[tod]
    isl_sky(tod, stormy=True)
    ground_plane(P['ground'], P['ground_sh'], mottle=0.35)
    brush_patch('Path', 2.2, (0, 2.5), '#4a4434', sx=0.8, sy=2.4, seed=3)
    brush_patch('PathL', 1.6, (-4.0, 9.0), '#4a4434', sx=1.6, sy=0.6, seed=4)
    brush_patch('PathR', 1.6, (4.0, 9.0), '#4a4434', sx=1.6, sy=0.6, seed=5)
    rnd = random.Random(31)
    for r in range(3):
        y = 30 - r * 7; x = -40
        while x < 40:
            card(uid('Trunk'), [(-0.3, 0), (0.3, 0), (0.18, 16), (-0.18, 16)], y, pmat('TrunkI' + str(r), _mix_hex('#1a2430', '#3a4a5a', r * .3), unlit=True, mottle=0), x=x)
            if rnd.random() < .6:
                card(uid('Fronds'), _blob_pts(rnd.uniform(1.6, 2.6), .5, 20, .3, int(x * 9)), y - .02, pmat('FrondsI' + str(r), _mix_hex('#16262a', '#2a3a40', r * .3), unlit=True, mottle=0.3), x=x, z=rnd.uniform(9, 14))
            x += rnd.uniform(2.2, 4.0)
    for sx in (-1, 1):
        twisted_pine(sx * 8.5, 5, 11, '#121a24', seed=40 + sx, s=1.8, flip=sx > 0)
    pbox('SignPost', (0.26, 0.26, 3.4), (0, 8.0, 1.7), '#4a2a1e', tod)
    pbox('SignBoard', (3.6, 0.16, 1.8), (0, 7.85, 2.6), '#6a2a22', tod, shade='#4a1a18', mottle=0.3)
    ptext('ONE FINAL CHOICE', (0, 7.75, 3.15), 0.32, N('#e8c8a0', tod))
    ptext('GIVE UP: LEFT', (0, 7.75, 2.55), 0.2, N('#d8b890', tod))
    ptext('FIGHT ON: RIGHT', (0, 7.75, 2.15), 0.2, N('#d8b890', tod))
    pbox('ArrowL', (1.6, 0.14, 0.45), (-1.6, 7.9, 3.8), '#5a3a22', tod, rot=(0, 8, 0))
    pbox('ArrowR', (1.6, 0.14, 0.45), (1.6, 7.9, 3.8), '#5a3a22', tod, rot=(0, -8, 0))
    for (x, y) in ((-1.6, 4.0), (1.6, 4.0), (-4.5, 8.5), (4.5, 8.5), (2.6, 9.6)):
        tiki(x, y, 'night', 2.0)
    mark('host', (2.6, 7.4, 0))
    for (sx, sy) in ((-0.8, 2.0), (0.8, 2.4), (0, 4.6), (-1.2, 5.6)):
        stand(sx, sy)
    paint_sun(azimuth=-30, elevation=28, energy=1.4)
    tv_camera((0, -6.0, 2.0), (0, 12, 2.4), lens=26)


def isl_rescue_camp(tod):
    """The Rescue Island camp (S4_Rescue_Island_Shelter): the skull-rock shelter in a dark wet forest, a smoky fire."""
    paint_mode(); P = ISL[tod]
    isl_sky(tod, stormy=True)
    ground_plane(P['ground'], P['ground_sh'], mottle=0.35)
    brush_patch('Mud', 5.5, (0, 4.5), '#4a4430' if tod == 'day' else '#2e2a22', sx=1.4, sy=.8, seed=6)
    rnd = random.Random(33)
    for r in range(3):
        y = 30 - r * 7; x = -40
        while x < 40:
            card(uid('Trunk'), [(-0.3, 0), (0.3, 0), (0.18, 16), (-0.18, 16)], y, pmat('TrunkR' + str(r) + tod, N(_mix_hex('#2a3440', '#4a5a6a', r * .3), tod), unlit=True, mottle=0), x=x)
            if rnd.random() < .6:
                card(uid('Fronds'), _blob_pts(rnd.uniform(1.6, 2.6), .5, 20, .3, int(x * 9)), y - .02, pmat('FrondsR' + str(r) + tod, N(_mix_hex('#22382e', '#3a5040', r * .3), tod), unlit=True, mottle=0.3), x=x, z=rnd.uniform(9, 14))
            x += rnd.uniform(2.2, 4.0)
    skull_shelter(0.5, 11.0, tod, s=1.1)
    fire_pit(-2.8, 5.2, tod, r=0.5, lit=(tod == 'night'))
    for (x, y, rz) in ((-4.4, 4.2, 20), (-1.2, 3.6, -15)):
        pcyl('LogSeat', 0.22, 1.6, (x, y, 0.22), '#4a3a2a', tod, verts=10, rot=(0, 90, rz))
        seat(x, y, 0.44)
    for k, (x, y) in enumerate(((3.6, 5.0), (5.0, 6.5), (-6.5, 7.5))):
        pcyl('Mushroom', 0.18, 0.3, (x, y, 0.15), '#e8e0d0', tod, verts=10)
        pcyl('MushCap', 0.32, 0.18, (x, y, 0.36), '#c8302a', tod, verts=14, r2=0.05)
    pbox('Bucket', (0.4, 0.4, 0.45), (4.4, 3.6, 0.22), '#6a6a72', tod)
    for sx in (-1, 1):
        twisted_pine(sx * 9.0, 4.5, 11, '#121a24', seed=50 + sx, s=1.8, flip=sx > 0)
    for (sx, sy) in ((-2.0, 2.0), (1.6, 2.2), (3.4, 4.0), (-0.2, 5.6), (2.0, 7.0)):
        stand(sx, sy)
    paint_sun(azimuth=-30, elevation=40 if tod == 'day' else 26, energy=3.0 if tod == 'day' else 1.4)
    tv_camera((0, -6.0, 2.0), (0, 12, 2.4), lens=26)


def isl_redemption(tod):
    """Redemption Island: a lone beach camp, a scrap of a shelter, a fire, the duel arena on the rise behind."""
    paint_mode(); P = ISL[tod]
    isl_sky(tod)
    box('Sand', (220, 52, 0.2), (0, -14, -0.1), pmat('SandI' + tod, P['sand'], _mix_hex(P['sand'], '#6a5a5a', .3), mottle=0.25, mscale=0.3), bevel=0)
    water_plane(tod, y0=12, col=P['sea'], far=P['sea_far'])
    dead_spire(30, 80, 22, tod, w=8)
    ridge_card(100, -150, 150, 0, 9, N('#4a6a5a', tod), seed=12, humps=5)
    # the arena on the rise: a wooden platform, posts, a banner
    plank_floor('Arena', (8, 4, 0.5), (-3.0, 9.0, 0.25), '#8a6440', tod, axis='x', step=0.5)
    for (x, y) in ((-6.8, 7.2), (0.8, 7.2), (-6.8, 10.8), (0.8, 10.8)):
        pcyl('ArenaPost', 0.16, 3.2, (x, y, 1.6), '#5a3a22', tod, verts=10)
        tiki(x, y - .01, 'night' if tod == 'night' else 'day', 3.3, lit=tod == 'night')
    pbox('ArenaBanner', (6.0, 0.1, 0.8), (-3.0, 10.9, 3.0), '#8a1e2e', tod)
    ptext('REDEMPTION', (-3.0, 10.82, 3.0), 0.45, N('#e8b938', tod))
    # the camp below it
    pbox('LeanRoof', (3.4, 2.4, 0.12), (4.6, 5.5, 1.5), '#a88a4a', tod, rot=(-22, 0, 0))
    for (x, y) in ((3.1, 4.6), (6.1, 4.6)):
        pcyl('LeanPost', 0.07, 1.5, (x, y, 0.75), '#6a4a2a', tod, verts=8)
    fire_pit(3.4, 2.6, tod, r=0.45, lit=(tod == 'night'))
    pcyl('LogSeat', 0.22, 1.8, (5.6, 2.0, 0.22), '#6a4a2a', tod, verts=10, rot=(0, 90, 10))
    seat(5.6, 2.0, 0.44)
    pcyl('Driftwood', 0.18, 2.6, (-5.5, 3.0, 0.16), '#c8b08a', tod, verts=10, rot=(0, 90, 30))
    for (sx, sy) in ((-1.6, 1.6), (1.0, 1.4), (-3.4, 3.4), (0.6, 4.0), (6.6, 3.4)):
        stand(sx, sy)
    paint_sun(azimuth=-35, elevation=45 if tod == 'day' else 28, energy=4.0 if tod == 'day' else 1.6)
    tv_camera((0, -6.5, 2.0), (0, 12, 2.0), lens=26)


def isl_exile(tod):
    """Exile beach (Exile_Beach): a strip of sand, a shipwreck on its side, two palms, a cave in the rock."""
    paint_mode(); P = ISL[tod]
    isl_sky(tod)
    box('Sand', (220, 50, 0.2), (0, -15, -0.1), pmat('SandE' + tod, P['sand'], _mix_hex(P['sand'], '#6a5a5a', .3), mottle=0.25, mscale=0.3), bevel=0)
    water_plane(tod, y0=10, col=P['sea'], far=P['sea_far'])
    ridge_card(110, -150, 150, 0, 7, N('#3a5a5a', tod), seed=14, humps=6)
    # the cave in a rock outcrop
    rock = icorock(uid('CaveRock'), (4.5, 3.0, 3.4), (-6.0, 9.0, 1.4), N('#7a6a5a', tod), seed=11)
    rock.data.materials.clear(); rock.data.materials.append(pmat('CaveRock' + tod, N('#7a6a5a', tod), N('#5a4a44', tod), mottle=0.35)); rock['ink'] = 1
    card(uid('Cave'), _blob_pts(1.3, 1.1, 20, .1, 4, flat_bottom=True), 5.95, pmat('CaveHole', '#16121a', unlit=True, mottle=0), x=-5.4, z=1.0)
    # the shipwreck: a hull on its side, a broken mast, a torn flag
    hull = pcyl('Wreck', 2.2, 7.0, (5.5, 10.0, 1.0), '#6a4a2e', tod, verts=24, rot=(0, 90, 18))
    hull.scale = (0.6, 1, 1)
    for k in range(3):   # strakes, so the hull reads as planked, not a log
        card(uid('Strake'), [(-3.2, 0), (3.2, 0.5), (3.2, 0.62), (-3.2, 0.12)], 8.55, pmat('Strake' + tod, N('#3e2a1a', tod), unlit=True, mottle=0), x=5.4, z=0.4 + k * 0.62)
    card(uid('Hole'), _blob_pts(0.8, 0.55, 14, 0.35, 21), 8.5, pmat('CaveHole', '#16121a', unlit=True, mottle=0), x=4.4, z=1.2)
    for k in range(4):
        pbox('WreckRib', (0.14, 0.14, 1.6), (3.9 + k * 0.35, 8.45, 1.3), '#4a3020', tod, rot=(0, -12 + k * 8, 0))
    pbox('Mast', (0.2, 0.2, 5.0), (6.2, 10.2, 3.0), '#5a3a22', tod, rot=(0, 25, 0))
    card(uid('Flag'), [(0, 0), (1.6, .2), (1.3, -.5), (1.7, -1.0), (0, -1.0)], 10.1, pmat('WreckFlag', '#1a1a22', unlit=True, mottle=0), x=7.3, z=5.3)
    card(uid('FlagSkull'), _blob_pts(.25, .25, 10, 0, 0), 10.05, pmat('FlagSkull', '#e8e0d0', unlit=True, mottle=0), x=8.0, z=4.8)
    for (x, y, l) in ((-2.0, 7.0, 10), (1.5, 8.5, -12)):
        sol_palm(x, y, 6.5, tod, lean=l, seed=int(x * 3) + 60, s=1.1)
    for k in range(5):
        r2 = icorock(uid('Rock'), (0.5, 0.4, 0.3), (-8 + k * 4, 4 + (k % 2) * 2, 0.1), N('#8a8a8a', tod), seed=k + 40)
        r2.data.materials.clear(); r2.data.materials.append(pmat('RockE' + tod, N('#8a8a8a', tod), mottle=0.3)); r2['ink'] = 1
    pbox('Hammock', (2.2, 0.5, 0.08), (2.6, 5.0, 1.0), '#c8a060', tod, rot=(0, 0, 12))
    for (sx, sy) in ((-1.4, 1.6), (1.2, 1.4), (0, 3.6), (-2.6, 3.0)):
        stand(sx, sy)
    paint_sun(azimuth=-35, elevation=45 if tod == 'day' else 28, energy=4.0 if tod == 'day' else 1.6)
    tv_camera((0, -6.5, 1.9), (0, 12, 1.6), lens=26)


SCENES['islands'] = {
    'rescue-crossroads': isl_rescue_crossroads, 'rescue-camp': isl_rescue_camp,
    'redemption-camp': isl_redemption, 'exile-beach': isl_exile,
}
OUTDOOR['islands'] = {'rescue-camp', 'redemption-camp', 'exile-beach'}
NIGHT_ONLY.add('rescue-crossroads')

# ══════════════════════════════════════════════════════════════════════
# venues/carnival_teams.py — Stawaki's team campsites, one set of plates per team slot
# ══════════════════════════════════════════════════════════════════════
# The teams live apart at Stawaki (DC4), so each slot of the camp map (carnival.cv_map) has its own
# plates: '<spot>-t<slot>-<tod>', and the merged camp has '<spot>-merge-<tod>'. References
# (Disventure Camp wiki):
#   t0 Red_Campsite — the clown-mouth tent on a yellow wasteland by the lake: a peach sky, purple
#      pine hills, a carousel horse on its pole, a target, a warning sign, broken fence planks, the fire;
#      Red_Team_Interior — inside the striped tent: torn lavender-and-maroon canvas, a checker floor,
#      the duck gallery board, striped poles, sheet-metal patches.
#   t1 Blue_Campsite — the blue scalloped cone with a pirate flag in tall mossy pines at sunset, the
#      neon arrow, a broken ticket booth, a little purple booth, a torn striped tent, fog on the ground;
#      Blue_Team_Interior — barn boards under a glass dome, a scaffold window, the painted emblem,
#      a wagon wheel, a mirror frame, a ticket counter, a striped arch.
#   t2 — a third camp for a three-team season (not in the show): a green tent among the junk.
#   merge DC4_Merge_Campsite — the big clown tent under the coaster, the drop tower and the wheel, a
#      clown dunk tank, a bumper car; DC4_Merge_Interior — clown photo boards, the duck gallery, the
#      CORN DOGS sign, star boxes, the clown with torches.

DUSK = {'day': ('#e8925a', '#f6c87a'), 'night': ('#1c2452', '#33407a')}


def dusk_sky(tod, far_y=90, hills=('#8a6aa8', '#6a5a90')):
    paint_sky(*DUSK[tod])
    for k, col in enumerate(hills):
        ridge_card(far_y + 30 - k * 20, -160, 160, 2 + k * 2, 18 - k * 6, N(col, tod), seed=21 + k, humps=4 + k * 2, teeth=60 + k * 20,
                   tooth_col=N(_mix_hex(col, '#1a1a3a', 0.12), tod))
    if tod == 'day':
        for (cx, cz, cs) in ((-44, 40, 3.4), (16, 46, 2.8), (58, 38, 3.0)):
            curly_cloud(cx, far_y + 50, cz, cs, '#f8d8c0', '#e8a888')
    else:
        rnd = random.Random(9)
        for i in range(50):
            card(uid('Star'), _blob_pts(0.18, 0.18, 8, 0, 0), far_y + 62, pmat('StarD', '#f4f0d8', unlit=True, mottle=0), x=rnd.uniform(-90, 90), z=rnd.uniform(14, 60))


def mossy_pine(x, y, h, tod, seed=0, s=1.0):
    """DC4's pine: a tall thin trunk, drooping dark tufts, and green moss hanging off the branches."""
    dc_pine(x, y, h, tod, seed=seed, s=s)
    rnd = random.Random(seed + 5)
    mm = pmat('Moss' + tod, N('#7a9a3a', tod), unlit=True, mottle=0.15)
    for k in range(rnd.randint(1, 3)):
        z = h * rnd.uniform(0.35, 0.7); sd = rnd.choice((-1, 1)); L = rnd.uniform(0.8, 1.6) * s
        fringe = [(0, 0.1 * s), (sd * L, 0.1 * s)]
        for i in range(7, -1, -1):
            t = i / 7
            fringe.append((sd * L * t, -(0.45 + 0.9 * ((i * 37) % 5) / 4) * s if i % 2 else -0.2 * s))
        card(uid('Moss'), fringe, y - 0.04, mm, x=x, z=z)


def fog_wisps(tod, y0, y1, n=8, seed=0, x0=-24, x1=24):
    """The low smoky haze DC4 lays over its camps: pale soft bands lying on the ground."""
    rnd = random.Random(seed)
    col = '#d8c8c0' if tod == 'day' else '#6a7298'
    for k in range(n):
        y = rnd.uniform(y0, y1); x = rnd.uniform(x0, x1); w = rnd.uniform(3, 7)
        card(uid('Fog'), _blob_pts(w, 0.35, 24, 0.25, k, flat_bottom=True), y, pmat('Fog' + tod, col, unlit=True, mottle=0, alpha=0.32), x=x, z=0.05)


def clown_face_tent(x, y, tod, s=1.0, a='#efe6d6', b='#2a2a32', star_eye=True):
    """The Red team's tent (Red_Campsite): a white-and-black striped tent whose front is a clown's head —
    a broad white face, one painted eye and one star-shaped hole, a red nose, a grinning mouth for a
    door with teeth along the top, spiky dark hair, a broken loudspeaker on top."""
    striped('ClownWall', 3.2 * s, 2.6 * s, (x, y + 1.0 * s, 1.3 * s), a, b, tod, n=7)
    striped('ClownRoof', 3.4 * s, 3.2 * s, (x, y + 1.0 * s, 2.6 * s + 1.6 * s), a, b, tod, n=7, r2=0.08)
    fy = y - 2.3 * s
    hair = pmat('ClownHair' + tod, N('#3a3a42', tod), unlit=True, mottle=0)
    for k in range(9):
        a0 = math.radians(200 - k * 25)
        card(uid('Hair'), [(0, 0), (math.cos(a0 + 0.2) * 1.1 * s, math.sin(a0 + 0.2) * 1.1 * s), (math.cos(a0) * 2.9 * s, math.sin(a0) * 2.9 * s), (math.cos(a0 - 0.2) * 1.1 * s, math.sin(a0 - 0.2) * 1.1 * s)],
             fy + 0.05, hair, x=x, z=3.2 * s)
    card(uid('ClownFace'), _blob_pts(2.1 * s, 2.0 * s, 32, 0.03, 2), fy, pmat('ClownFace' + tod, N('#f2ece0', tod), unlit=True, mottle=0.12), x=x, z=3.0 * s)
    card(uid('ClownEyeL'), _blob_pts(0.55 * s, 0.7 * s, 20, 0, 0), fy - 0.02, pmat('ClownEyeW' + tod, N('#ffffff', tod), unlit=True, mottle=0), x=x - 0.8 * s, z=3.7 * s)
    card(uid('ClownPupil'), _blob_pts(0.2 * s, 0.24 * s, 12, 0, 0), fy - 0.03, pmat('ClownPupil' + tod, N('#1a1a22', tod), unlit=True, mottle=0), x=x - 0.7 * s, z=3.65 * s)
    card(uid('ClownMark'), [(-0.1 * s, 0.9 * s), (0.08 * s, 0.9 * s), (0.02 * s, -0.5 * s)], fy - 0.03, pmat('ClownMark' + tod, N('#3a5aa8', tod), unlit=True, mottle=0), x=x - 1.25 * s, z=3.4 * s)
    if star_eye:
        pts = []
        for i in range(10):
            r = (0.75 if i % 2 == 0 else 0.32) * s; a1 = math.pi / 2 + i * math.pi / 5
            pts.append((math.cos(a1) * r, math.sin(a1) * r))
        card(uid('StarHole'), pts, fy - 0.02, pmat('StarHole' + tod, N('#2a1e2a', tod), unlit=True, mottle=0), x=x + 0.85 * s, z=3.7 * s)
        for k in range(3):
            card(uid('Mesh'), [(-0.5 * s, -0.02), (0.5 * s, -0.02), (0.5 * s, 0.02), (-0.5 * s, 0.02)], fy - 0.03, pmat('MeshW' + tod, N('#c8c8c8', tod), unlit=True, mottle=0), x=x + 0.85 * s, z=3.5 * s + k * 0.22 * s)
    card(uid('ClownNose'), _blob_pts(0.38 * s, 0.36 * s, 16, 0, 0), fy - 0.04, pmat('ClownNose' + tod, N('#6a2a2a', tod), unlit=True, mottle=0), x=x, z=2.95 * s)
    mouth = [(math.cos(math.pi + i * math.pi / 16) * 1.6 * s, math.sin(math.pi + i * math.pi / 16) * 1.9 * s) for i in range(17)]
    card(uid('ClownLip'), [(px * 1.08, pz * 1.06) for px, pz in mouth], fy - 0.02, pmat('ClownLip' + tod, N('#3a5aa8', tod), unlit=True, mottle=0), x=x, z=2.35 * s)
    card(uid('ClownMouth'), mouth, fy - 0.03, pmat('ClownMouth' + tod, N('#4a2a22', tod), unlit=True, mottle=0), x=x, z=2.35 * s)
    for k in range(9):
        card(uid('Tooth'), [(-0.13 * s, 0), (0.13 * s, 0), (0, -0.3 * s)], fy - 0.04, pmat('Tooth' + tod, N('#f2ece0', tod), unlit=True, mottle=0), x=x - 1.35 * s + k * 0.34 * s, z=2.33 * s)
    pbox('MouthDoor', (1.2 * s, 0.05, 1.6 * s), (x, fy - 0.035, 0.8 * s), '#5a3a2a', tod, ink=False)
    pbox('Rug', (2.0 * s, 1.4 * s, 0.03), (x, fy - 0.9 * s, 0.02), '#7a4a8a', tod, ink=False)
    pcyl('Mast', 0.06, 2.2 * s, (x, y + 1.0 * s, 5.9 * s), '#6a6a72', tod, verts=8)
    for sd in (-1, 1):
        pcyl('Horn', 0.45 * s, 0.9 * s, (x + sd * 0.55 * s, y + 1.0 * s, 6.6 * s), '#9aa0a8', tod, r2=0.12 * s, verts=12, rot=(0, sd * 90, 0))


def carousel_horse(x, y, z, tod, s=1.0, col='#4a4a6a'):
    """A carousel horse on its twisted pole, leaping (Red_Campsite)."""
    pcyl('HorsePole', 0.08 * s, 6.0 * s, (x, y, z), '#e8b03a', tod, verts=8)
    m = pmat('Horse' + col + tod, N(col, tod), unlit=True, mottle=0.1)
    body = [(-1.2, 0.0), (-0.9, 0.35), (0.5, 0.4), (0.9, 0.85), (1.3, 1.0), (1.45, 0.75), (1.1, 0.45), (0.9, -0.1), (0.6, -0.3), (-0.6, -0.3), (-1.1, -0.2)]
    card(uid('HorseBody'), [(px * s, pz * s) for px, pz in body], y - 0.1, m, x=x, z=z + 0.4 * s)
    for (lx, lz, ax) in ((-0.9, -0.2, -0.6), (-0.6, -0.25, -0.2), (0.4, -0.25, 0.9), (0.7, -0.2, 1.3)):
        card(uid('HorseLeg'), [(lx * s, lz * s), ((lx + 0.15) * s, lz * s), ((ax + 0.12) * s, (lz - 0.7) * s), (ax * s, (lz - 0.7) * s)], y - 0.11, m, x=x, z=z + 0.4 * s)
    card(uid('Mane'), [(0.5 * s, 0.4 * s), (0.9 * s, 0.85 * s), (0.6 * s, 0.9 * s), (0.2 * s, 0.5 * s)], y - 0.12, pmat('Mane' + tod, N('#2a2a3a', tod), unlit=True, mottle=0), x=x, z=z + 0.4 * s)
    card(uid('Saddle'), [(-0.3 * s, 0.38 * s), (0.25 * s, 0.38 * s), (0.2 * s, 0.1 * s), (-0.25 * s, 0.1 * s)], y - 0.12, pmat('Saddle' + tod, N('#8a3aa8', tod), unlit=True, mottle=0), x=x, z=z + 0.4 * s)


def target_board(x, y, z, tod, s=1.0, rot=0):
    for k, (r, c) in enumerate(((0.9, '#f2ece0'), (0.68, '#a82a2a'), (0.48, '#f2ece0'), (0.28, '#a82a2a'), (0.1, '#f2ece0'))):
        card(uid('Target'), _blob_pts(r * s, r * s, 24, 0, 0), y - k * 0.01, pmat('Target' + c + tod, N(c, tod), unlit=True, mottle=0), x=x, z=z)
    card(uid('Dart'), [(0, 0), (0.7 * s, 0.35 * s), (0.72 * s, 0.3 * s), (0.02 * s, -0.05 * s)], y - 0.06, pmat('Dart' + tod, N('#6a6a72', tod), unlit=True, mottle=0), x=x, z=z)


def warning_sign(x, y, tod, s=1.0):
    pcyl('SignPost', 0.06 * s, 2.4 * s, (x, y, 1.2 * s), '#9aa0a8', tod, verts=8)
    pbox('Warn', (1.1 * s, 0.08, 1.1 * s), (x, y - 0.05, 2.5 * s), '#f2d23a', tod)
    card(uid('WarnTri'), [(-0.35 * s, -0.3 * s), (0.35 * s, -0.3 * s), (0, 0.32 * s)], y - 0.1, pmat('WarnTri' + tod, N('#2a2a2a', tod), unlit=True, mottle=0), x=x, z=2.5 * s)
    card(uid('WarnMark'), [(-0.05 * s, -0.12 * s), (0.05 * s, -0.12 * s), (0.05 * s, 0.15 * s), (-0.05 * s, 0.15 * s)], y - 0.11, pmat('WarnMark' + tod, N('#f2d23a', tod), unlit=True, mottle=0), x=x, z=2.5 * s)


def broken_fence(x0, y, tod, n=6, seed=0):
    rnd = random.Random(seed)
    for k in range(n):
        h = rnd.uniform(0.9, 2.0)
        pts = [(-0.28, 0), (0.28, 0), (0.28, h * rnd.uniform(0.75, 1.0)), (0.05, h), (-0.28, h * rnd.uniform(0.7, 0.95))]
        card(uid('FencePlank'), pts, y + rnd.uniform(-0.1, 0.1), pmat('Plank' + tod, N('#a88a6a', tod), unlit=True, mottle=0.3), x=x0 + k * 0.62)


def debris(tod, y0, y1, n=10, seed=0, x0=-14, x1=14):
    """Carnival rubbish on the ground: tickets, a broken plate, planks."""
    rnd = random.Random(seed)
    for k in range(n):
        x = rnd.uniform(x0, x1); y = rnd.uniform(y0, y1)
        kind = k % 3
        if kind == 0:
            pbox('Ticket', (0.35, 0.18, 0.02), (x, y, 0.02), '#f2c23a', tod, rot=(0, 0, rnd.uniform(0, 90)), ink=False)
        elif kind == 1:
            pbox('Plank', (rnd.uniform(1.0, 2.2), 0.3, 0.08), (x, y, 0.04), '#6a3a2a', tod, rot=(0, 0, rnd.uniform(-30, 30)))
        else:
            r = icorock(uid('Rubble'), (0.35, 0.3, 0.2), (x, y, 0.08), N('#7a7a72', tod), seed=k)
            r.data.materials.clear(); r.data.materials.append(pmat('Rubble' + tod, N('#7a7a72', tod), mottle=0.3)); r['ink'] = 1


def campfire_logs(x, y, tod, w=2.3):
    fire_pit(x, y, tod, r=0.5, lit=True)
    for sd in (-1, 1):
        pcyl('CampLog', 0.25, 1.6, (x + sd * w, y + 0.1, 0.25), '#7a3a2a', tod, verts=12, rot=(0, 90, 0))
    for k, (dx, dy) in enumerate(((-2.4, -1.4), (2.6, -1.3), (0.2, -2.0))):
        r = icorock(uid('SeatRock'), (0.45, 0.4, 0.3), (x + dx, y + dy, 0.12), N('#6a6a6a', tod), seed=k + 3)
        r.data.materials.clear(); r.data.materials.append(pmat('SeatRock' + tod, N('#6a6a6a', tod), N('#3a3a3a', tod), mottle=0.3)); r['ink'] = 1


# ── t0: the Red team's camp ───────────────────────────────────────────
def _red_camp(tod, cam):
    paint_mode()
    dusk_sky(tod, far_y=90)
    ground_plane(N('#c8b06a', tod), N('#a8904a', tod), size=(400, 300), loc=(0, 80, 0), mottle=0.35)
    box('RedLake', (300, 14, 0.2), (0, 40, -0.05), pmat('RedLake' + tod, N('#3aa89a', tod), unlit=True, mottle=0.1, mscale=0.2), bevel=0)
    rnd = random.Random(7)
    for k in range(12):
        x = rnd.uniform(-50, 50)
        r = icorock(uid('LakeStump'), (rnd.uniform(0.8, 1.6), 0.6, rnd.uniform(0.8, 1.6)), (x, rnd.uniform(34, 42), 0.3), N('#6a6a6a', tod), seed=k)
        r.data.materials.clear(); r.data.materials.append(pmat('LakeStump' + tod, N('#6a6a6a', tod), N('#3a3a4a', tod), mottle=0.3)); r['ink'] = 1
    brush_patch('Grass', 12, (0, 4), N('#7a7a32', tod), sx=2.4, sy=0.6, seed=3)
    for x in (-34, -26, 30, 38):
        mossy_pine(x, 14, rnd.uniform(12, 16), tod, seed=int(x), s=1.4)
    clown_face_tent(5.0, 9.0, tod, s=1.15)
    carousel_horse(11.5, 10.5, 3.0, tod, s=1.1)
    target_board(9.4, 6.8, 2.0, tod, s=0.95)
    pbox('ArrowPost', (0.15, 0.15, 2.0), (12.0, 6.6, 1.0), '#5a3a22', tod)
    neon_arrow(12.1, 6.4, 3.0, tod, s=0.7)
    warning_sign(-0.5, 9.5, tod)
    broken_fence(-8, 8.0, tod, n=6, seed=2)
    campfire_logs(-3.0, 4.0, tod)
    cv_bush(-1.5, 9.0, tod, s=1.4, col='#4a7a3a')
    debris(tod, 1.0, 6.0, n=9, seed=4)
    fog_wisps(tod, 2, 12, n=9, seed=5)
    for x in (-1.0, 3.0, 7.0):
        stand(x, 2.6)
    paint_sun(azimuth=-30, elevation=45 if tod == 'day' else 28, energy=4.0 if tod == 'day' else 1.6)
    tv_camera(*cam)


def cv_campsite_t0(tod):
    _red_camp(tod, ((3.0, -6.0, 2.2), (4.0, 12, 3.0), 25))


def cv_shelter_t0(tod):
    """Inside the Red team's tent (Red_Team_Interior): torn lavender-and-maroon canvas, a checker floor,
    the duck gallery board leaning on the back, striped poles, sheet metal over the holes."""
    paint_mode()
    W, D, H = 10.0, 6.5, 4.4
    # the checker floor
    for i in range(10):
        for j in range(7):
            pbox('Check', (1.0, 1.0, 0.02), (-W / 2 + 0.5 + i, 0.5 + j, 0.0), '#e8e2ea' if (i + j) % 2 == 0 else '#2a2a32', 'day', ink=False)
    # the canvas: tall drapes in lavender and maroon around a half-circle, torn
    for k in range(9):
        a = math.radians(180 - k * 22.5)
        x = math.cos(a) * W * 0.55; y = D * 0.6 + math.sin(a) * D * 0.45
        col = '#c8b8d8' if k % 2 == 0 else '#7a2a22'
        drape = pbox('Drape', (2.4, 0.12, H + 1.6), (x, y, (H + 1.6) / 2), col, 'day', shade=_mix_hex(col, '#2a1a2a', 0.3), mottle=0.25, rot=(0, 0, math.degrees(a) - 90))
    # light coming in through tears, a sunset peeking through the open flap on the left
    for (x, z) in ((-3.6, 3.6), (3.0, 4.2), (1.0, 4.6)):
        card(uid('Tear'), [(-0.12, -0.6), (0.2, -0.2), (0.05, 0.5), (-0.2, 0.0)], D * 0.95, pmat('Tear', '#f2b88a', unlit=True, mottle=0), x=x, z=z)
    card(uid('Flap'), [(-0.9, 0), (0.9, 0), (0.8, 2.6), (0, 3.0), (-0.8, 2.6)], 2.4, pmat('FlapView', '#d8a84a', unlit=True, mottle=0.1), x=-4.4, z=0)
    card(uid('FlapSky'), [(-0.8, 1.6), (0.8, 1.6), (0.8, 2.6), (0, 3.0), (-0.8, 2.6)], 2.39, pmat('FlapSky', '#f2b880', unlit=True, mottle=0), x=-4.4, z=0)
    card(uid('FlapHill'), [(-0.8, 1.4), (-0.3, 1.9), (0.3, 1.7), (0.8, 2.0), (0.8, 1.4)], 2.38, pmat('FlapHill', '#8a6aa8', unlit=True, mottle=0), x=-4.4, z=0)
    # the duck gallery board, sheet metal, a scaffold
    pbox('Gallery', (3.6, 0.15, 2.6), (0.6, D * 0.85, 1.9), '#c8a03a', 'day', rot=(-6, 0, -4))
    card(uid('Water1'), [(-1.6, 0), (1.6, 0), (1.6, 0.45), (-1.6, 0.45)], D * 0.85 - 0.2, pmat('GalWater', '#3aa8c8', unlit=True, mottle=0), x=0.6, z=1.2)
    card(uid('Water2'), [(-1.6, 0), (1.6, 0), (1.6, 0.45), (-1.6, 0.45)], D * 0.85 - 0.2, pmat('GalWater', '#3aa8c8', unlit=True, mottle=0), x=0.6, z=2.1)
    for k, (dx, dz) in enumerate(((-1.0, 1.7), (0.2, 1.65), (1.3, 1.7), (-0.4, 2.6), (0.9, 2.6))):
        card(uid('Duck'), _blob_pts(0.25, 0.2, 12, 0, k), D * 0.85 - 0.22, pmat('Duck', '#e8d86a', unlit=True, mottle=0), x=0.6 + dx, z=dz)
        card(uid('DuckTarget'), _blob_pts(0.09, 0.09, 10, 0, 0), D * 0.85 - 0.23, pmat('DuckT', '#a82a2a', unlit=True, mottle=0), x=0.6 + dx, z=dz)
    for (x, w) in ((-1.2, 1.8), (3.6, 2.0)):
        pbox('Sheet', (w, 0.1, 2.4), (x, D * 0.9, 3.4), '#4a4a52', 'day', rot=(0, 8, 0))
    pbox('Scaffold', (0.15, 0.15, 3.8), (4.6, D * 0.8, 1.9), '#3a3a42', 'day')
    pbox('ScaffoldX', (1.6, 0.12, 0.12), (4.0, D * 0.8, 3.0), '#3a3a42', 'day', rot=(0, 40, 0))
    for x in (-1.6, 2.6):
        striped('Pole', 0.09, H + 1.5, (x, D * 0.7, (H + 1.5) / 2), '#3a4a8a', '#efe6d6', 'day', n=6)
    card(uid('NeonUp'), [(-0.3, 0), (0.3, 0), (0.3, 0.8), (0.6, 0.8), (0, 1.4), (-0.6, 0.8), (-0.3, 0.8)], D * 0.75, pmat('NeonUp', '#9a5ad8', unlit=True, mottle=0), x=3.8, z=0.4)
    pbox('Plank', (1.6, 0.4, 0.06), (1.6, 2.2, 0.04), '#6a3a2a', 'day', rot=(0, 0, 25))
    pbox('Spill', (2.0, 0.5, 0.02), (-2.6, 2.4, 0.02), '#6a3a8a', 'day', ink=False)
    for x in (-1.6, 0.0, 1.6):
        stand(x, 2.3)
    room_light(azimuth=-30, elevation=60, energy=2.8)
    paint_sky('#c8b8d8', '#c8b8d8')
    tv_camera((0.0, -1.6, 1.7), (0, D, 1.8), lens=21)


# ── t1: the Blue team's camp ──────────────────────────────────────────
def scallop_tent(x, y, tod, s=1.0):
    """The Blue team's tent (Blue_Campsite): a wide blue cone with a scalloped dark trim studded with
    bulbs, a torn grid window in the roof, moss on the canvas, a pirate flag on a pole."""
    striped('BlueBase', 2.9 * s, 2.0 * s, (x, y, 1.0 * s), '#8a6a4a', '#7a5a3a', tod, n=8)
    striped('BlueRoof', 3.6 * s, 3.8 * s, (x, y, 2.0 * s + 1.9 * s), '#3a5aa8', '#2e4a90', tod, n=8, r2=0.05)
    for k in range(14):
        a = math.pi * (0.05 + 0.9 * k / 13)
        cx = x + math.cos(a + math.pi) * -3.5 * s; cy = y - math.sin(a) * 3.5 * s
        card(uid('Scallop'), [(math.cos(math.pi + i * math.pi / 10) * 0.5 * s, math.sin(math.pi + i * math.pi / 10) * 0.45 * s) for i in range(11)],
             cy - 0.05, pmat('Scallop' + tod, N('#24366a', tod), unlit=True, mottle=0), x=cx, z=2.05 * s)
        card(uid('ScBulb'), _blob_pts(0.07 * s, 0.07 * s, 8, 0, 0), cy - 0.08, pmat('ScBulb', '#ffe28a', unlit=True, mottle=0), x=cx, z=1.85 * s)
    grid = pmat('Grid' + tod, N('#1e2a4a', tod), unlit=True, mottle=0)
    card(uid('Tear'), [(-0.9 * s, -0.6 * s), (0.2 * s, -0.8 * s), (0.9 * s, -0.2 * s), (0.6 * s, 0.7 * s), (-0.5 * s, 0.6 * s)], y - 2.3 * s, grid, x=x - 0.6 * s, z=3.4 * s)
    for k in range(4):
        card(uid('GridBar'), [(-0.8 * s, -0.02), (0.8 * s, -0.02), (0.8 * s, 0.02), (-0.8 * s, 0.02)], y - 2.32 * s, pmat('GridBar', '#9aa0b0', unlit=True, mottle=0), x=x - 0.6 * s, z=3.0 * s + k * 0.28 * s)
        card(uid('GridBarV'), [(-0.02, -0.7 * s), (0.02, -0.7 * s), (0.02, 0.7 * s), (-0.02, 0.7 * s)], y - 2.32 * s, pmat('GridBar', '#9aa0b0', unlit=True, mottle=0), x=x - 1.1 * s + k * 0.35 * s, z=3.4 * s)
    for (mx, mz) in ((1.4, 2.6), (-1.8, 2.4)):
        card(uid('TentMoss'), _blob_pts(0.5 * s, 0.35 * s, 12, 0.3, int(mx * 10)), y - 2.4 * s, pmat('TentMoss' + tod, N('#7a9a3a', tod), unlit=True, mottle=0), x=x + mx * s, z=mz * s)
    pcyl('FlagPole', 0.06, 4.0 * s, (x + 1.2 * s, y, 5.4 * s), '#6a6a72', tod, verts=8)
    card(uid('Pirate'), [(0, 0), (2.0 * s, 0.2 * s), (1.9 * s, -1.3 * s), (0, -1.4 * s)], y - 0.1, pmat('Pirate' + tod, N('#1a1a22', tod), unlit=True, mottle=0), x=x + 1.2 * s, z=7.3 * s)
    card(uid('Skull'), _blob_pts(0.32 * s, 0.34 * s, 12, 0, 0), y - 0.12, pmat('SkullW' + tod, N('#efe6d6', tod), unlit=True, mottle=0), x=x + 2.2 * s, z=6.7 * s)
    for sd in (-1, 1):
        card(uid('Bone'), [(-0.5 * s, -0.04 * s), (0.5 * s, -0.04 * s), (0.5 * s, 0.04 * s), (-0.5 * s, 0.04 * s)], y - 0.11,
             pmat('SkullW' + tod, N('#efe6d6', tod), unlit=True, mottle=0), x=x + 2.2 * s, z=6.45 * s).rotation_euler = (0, math.radians(sd * 30), 0)


def torn_tent(x, y, tod, r=3.0, s=1.0):
    circus_tent(x, y, tod, r=r, h=3.0 * s, roof=3.2 * s)
    card(uid('Rip'), [(-0.2, -0.9), (0.3, -0.4), (0.1, 0.6), (-0.3, 0.1)], y - r - 0.05, pmat('Rip' + tod, N('#2a1e2a', tod), unlit=True, mottle=0), x=x - 0.3, z=2.0 * s)
    cv_bush(x + 0.6, y - r - 0.3, tod, s=1.5, col='#3a7a5a')


def _blue_camp(tod, cam):
    paint_mode()
    dusk_sky(tod, far_y=90)
    ground_plane(N('#7f7a3a', tod), N('#5e5a30', tod), size=(400, 300), loc=(0, 80, 0), mottle=0.35)
    rnd = random.Random(4)
    for k in range(18):
        x = -40 + k * 4.6 + rnd.uniform(-1, 1)
        mossy_pine(x, 26 + rnd.uniform(0, 6), rnd.uniform(14, 20), tod, seed=k * 7, s=1.5)
    for (x, y) in ((-6, 16), (4, 18), (9, 14), (-16, 13)):
        mossy_pine(x, y, rnd.uniform(14, 18), tod, seed=int(x * 3 + y), s=1.5)
    for (x, y) in ((-3, 15), (7, 15.5)):
        pcyl('Stump', 0.6, 0.8, (x, y, 0.4), '#7a4a32', tod, verts=10)
    scallop_tent(-8.5, 8.5, tod, s=1.0)
    neon_arrow(-4.2, 6.3, 3.6, tod, s=1.3)
    ticket_booth(-4.6, 4.6, tod, rot_z=8, s=1.05)
    striped('PBooth', 0.85, 2.2, (2.4, 11.0, 1.1), '#7a5aa8', '#d8c8e8', tod, n=5)
    striped('PBoothRoof', 1.0, 1.3, (2.4, 11.0, 2.85), '#7a5aa8', '#d8c8e8', tod, n=5, r2=0.03)
    torn_tent(10.5, 11.5, tod, r=3.4)
    for (x, y, c) in ((5.8, 7.2, '#c88a2a'), (12.5, 7.6, '#3a7a5a')):
        cv_bush(x, y, tod, s=1.5, col=c)
    campfire_logs(2.0, 4.6, tod, w=2.1)
    for k in range(8):
        a = k * math.pi / 4
        card(uid('WheelSpoke'), [(0, -0.04), (0.6, -0.04), (0.6, 0.04), (0, 0.04)], 2.6, pmat('Spoke' + tod, N('#5a3a22', tod), unlit=True, mottle=0), x=-9.6, z=0.7).rotation_euler = (0, a, 0)
    card(uid('WheelRim'), _blob_pts(0.65, 0.65, 24, 0, 0), 2.62, pmat('Rim' + tod, N('#6a4a2a', tod), unlit=True, mottle=0), x=-9.6, z=0.7)
    pbox('Poster', (1.2, 0.08, 1.6), (-7.0, 3.2, 0.8), '#e8dcc0', tod, rot=(-10, 0, 8))
    pbox('Hatch', (2.2, 1.4, 0.06), (-1.0, 1.0, 0.03), '#4a5a62', tod)
    debris(tod, 1.5, 6.0, n=6, seed=9)
    fog_wisps(tod, 3, 13, n=10, seed=6)
    for x in (-0.5, 2.0, 4.5):
        stand(x, 2.8)
    paint_sun(azimuth=-30, elevation=45 if tod == 'day' else 28, energy=4.0 if tod == 'day' else 1.6)
    tv_camera(*cam)


def cv_campsite_t1(tod):
    _blue_camp(tod, ((0.0, -6.5, 2.0), (0.0, 12, 2.6), 25))


def cv_shelter_t1(tod):
    """Inside the Blue team's shed (Blue_Team_Interior): barn boards, a glass dome overhead, a scaffold
    window on the pines, the team's painted emblem, a wagon wheel, a mirror frame, a ticket counter
    under a striped arch, junk in the foreground."""
    paint_mode()
    W, D, H = 10.0, 6.0, 4.2
    painted_room(W, D, H, 'day', wall='#7a4e2e', floor='#8a5a32', ceil='#3a2a22', plank=0.6, wall_seam='#5a3a22', floor_seam='#5a3a22')
    for ob in [o for o in bpy.data.objects if o.name.startswith('Ceiling')]:
        bpy.data.objects.remove(ob, do_unlink=True)      # open to the dome, the way the shed is drawn
    # the glass dome cutting across the top left
    for k in range(5):
        a0 = math.radians(160 - k * 18); a1 = math.radians(160 - (k + 1) * 18)
        pts = [(math.cos(a0) * 6, math.sin(a0) * 3), (math.cos(a1) * 6, math.sin(a1) * 3), (math.cos(a1) * 4.6, math.sin(a1) * 2.2), (math.cos(a0) * 4.6, math.sin(a0) * 2.2)]
        card(uid('Pane'), pts, D - 0.2, pmat('Pane', '#2a3a7a', unlit=True, mottle=0.05), x=-2.5, z=H - 1.8)
    card(uid('DomeRim'), [(math.cos(math.radians(a)) * 6.15, math.sin(math.radians(a)) * 3.1) for a in range(70, 171, 5)] + [(math.cos(math.radians(a)) * 5.9, math.sin(math.radians(a)) * 2.95) for a in range(170, 69, -5)],
         D - 0.21, pmat('DomeRim', '#6a6a7a', unlit=True, mottle=0), x=-2.5, z=H - 1.8)
    # the scaffold window
    pbox('ScafWin', (2.2, 0.06, 1.0), (-2.8, D - 0.13, 1.4), '#c8d8b0', 'day', unlit=True)
    for (x, z, w, h) in ((-2.8, 0.2, 2.6, 0.12), (-2.8, 1.45, 2.6, 0.12), (-2.8, 2.55, 2.6, 0.12), (-4.05, 1.4, 0.12, 2.6), (-1.55, 1.4, 0.12, 2.6)):
        pbox('Scaf', (w, 0.1, h), (x, D - 0.16, z if h > 1 else z), '#8a90a0', 'day')
    for sd in (-1, 1):
        pbox('ScafX', (0.1, 0.1, 1.6), (-2.8 + sd * 0.6, D - 0.16, 0.8), '#8a90a0', 'day', rot=(0, sd * 40, 0))
    # the painted emblem, a wagon wheel, a mirror frame, graffiti
    card(uid('EmblemB'), _blob_pts(0.8, 0.8, 28, 0.05, 1), D - 0.13, pmat('EmblemB', '#3a8ad8', unlit=True, mottle=0.2), x=1.2, z=3.0)
    card(uid('EmblemIn'), _blob_pts(0.62, 0.62, 28, 0.05, 2), D - 0.14, pmat('EmblemIn2', '#7a4e2e', unlit=True, mottle=0.2), x=1.2, z=3.0)
    for k in range(3):
        card(uid('Wave'), [(-0.45, 0), (-0.15, 0.12), (0.15, 0), (0.45, 0.12), (0.45, 0.04), (0.15, -0.08), (-0.15, 0.04), (-0.45, -0.08)], D - 0.15, pmat('Wave', '#3a8ad8', unlit=True, mottle=0), x=1.2, z=2.75 + k * 0.25)
    for k in range(8):
        card(uid('WheelSpoke'), [(0, -0.04), (0.7, -0.04), (0.7, 0.04), (0, 0.04)], D - 0.6, pmat('Spoke', '#5a3a22', unlit=True, mottle=0), x=0.0, z=0.85).rotation_euler = (0, k * math.pi / 4, 0)
    card(uid('WheelRim'), _blob_pts(0.75, 0.75, 24, 0, 0), D - 0.58, pmat('Rim', '#6a4a2a', unlit=True, mottle=0), x=0.0, z=0.85)
    pbox('Mirror', (1.0, 0.1, 1.6), (1.8, D - 0.5, 0.8), '#c8c0a0', 'day', rot=(-12, 0, -8))
    pbox('MirrorIn', (0.7, 0.11, 1.2), (1.8, D - 0.52, 0.8), '#e8e0c0', 'day', rot=(-12, 0, -8), ink=False)
    # the ticket counter under a striped arch on the right, the pines and sunset through it
    card(uid('ArchView'), [(-1.3, 0), (1.3, 0), (1.3, 3.0), (-1.3, 3.0)], D + 0.3, pmat('ArchView', '#e8a870', unlit=True, mottle=0), x=3.8, z=0.8)
    for k in range(4):
        card(uid('ArchPine'), [(-0.5, 0), (0.5, 0), (0, 2.6)], D + 0.25, pmat('ArchPine', '#3a3a5a', unlit=True, mottle=0), x=2.8 + k * 0.7, z=1.0)
    for k in range(7):
        a0 = math.radians(k * 180 / 7); a1 = math.radians((k + 1) * 180 / 7)
        pts = [(math.cos(a0) * 1.6, math.sin(a0) * 1.0), (math.cos(a1) * 1.6, math.sin(a1) * 1.0), (math.cos(a1) * 1.3, math.sin(a1) * 0.8), (math.cos(a0) * 1.3, math.sin(a0) * 0.8)]
        card(uid('Arch'), pts, D - 0.15, pmat('Arch' + str(k % 2), '#8a2a2a' if k % 2 else '#efe6d6', unlit=True, mottle=0), x=3.8, z=3.6)
    pbox('Counter', (2.8, 1.0, 1.1), (3.8, D - 0.8, 0.55), '#8a90a0', 'day')
    pbox('CounterTop', (3.0, 1.1, 0.08), (3.8, D - 0.8, 1.12), '#a8b0b8', 'day')
    # junk in the foreground: a broken sawhorse, a plank, a cauldron
    for sd in (-1, 1):
        pbox('Saw', (0.16, 0.16, 1.8), (-3.6 + sd * 0.5, 1.9, 0.7), '#3a2a22', 'day', rot=(0, sd * 25, 0))
    pbox('SawTop', (1.8, 0.2, 0.2), (-3.4, 1.9, 1.4), '#3a2a22', 'day', rot=(0, -12, 0))
    pcyl('Cauldron', 0.7, 0.8, (4.0, 1.6, 0.4), '#2a2a2e', 'day', verts=16)
    for x in (-1.6, 0.4, 2.2):
        stand(x, 2.4)
    room_light(azimuth=-30, elevation=60, energy=2.6)
    paint_sky('#2a2230', '#3a2a2a')
    tv_camera((0.0, -1.6, 1.7), (0, D, 1.8), lens=21)


# ── t2: a third team's camp ───────────────────────────────────────────
def _green_camp(tod, cam):
    paint_mode()
    dusk_sky(tod, far_y=90)
    ground_plane(N('#7f7a3a', tod), N('#5e5a30', tod), size=(400, 300), loc=(0, 80, 0), mottle=0.35)
    rnd = random.Random(14)
    for k in range(16):
        mossy_pine(-40 + k * 5.2 + rnd.uniform(-1, 1), 24 + rnd.uniform(0, 6), rnd.uniform(14, 19), tod, seed=k * 5 + 1, s=1.5)
    coaster(-30, 10, 40, tod, seed=5)
    circus_tent(-5.0, 10.0, tod, r=3.4, h=2.8, roof=3.4, a='#3a8a4a', b='#efe6d6', flag='#3a8a4a')
    card(uid('Patch'), [(-0.6, -0.5), (0.6, -0.4), (0.5, 0.5), (-0.5, 0.4)], 6.5, pmat('Patch' + tod, N('#c8a03a', tod), unlit=True, mottle=0.2), x=-5.8, z=2.0)
    pbox('BumperCar', (2.0, 1.4, 0.7), (4.0, 7.5, 0.45), '#3a8a4a', tod)
    pbox('BumperSeat', (0.9, 0.6, 0.6), (4.0, 7.9, 1.0), '#2a2a32', tod)
    pcyl('BumperPole', 0.05, 1.8, (4.0, 8.0, 1.6), '#9aa0a8', tod, verts=8)
    for x in (7.0, 8.0):
        striped('Drum', 0.45, 0.6, (x, 5.2, 0.3), '#3a8a4a', '#efe6d6', tod, n=6)
    team_banner(9.5, 8.0, '#3a8a4a', 'leaf', tod)
    campfire_logs(1.0, 4.4, tod, w=2.0)
    cv_bush(-10, 6, tod, s=1.5, col='#c88a2a')
    debris(tod, 1.0, 6.0, n=7, seed=13)
    fog_wisps(tod, 3, 13, n=8, seed=12)
    for x in (-1.5, 1.0, 3.5):
        stand(x, 2.6)
    paint_sun(azimuth=-30, elevation=45 if tod == 'day' else 28, energy=4.0 if tod == 'day' else 1.6)
    tv_camera(*cam)


def cv_campsite_t2(tod):
    _green_camp(tod, ((0.5, -6.5, 2.0), (1.0, 12, 2.6), 25))


def cv_shelter_t2(tod):
    _green_camp(tod, ((-3.5, -5.0, 1.9), (-4.5, 12, 2.6), 26))


# ── the merged camp ───────────────────────────────────────────────────
def _merge_camp(tod, cam):
    """DC4_Merge_Campsite: the big striped clown tent at the edge of the carnival, the coaster, the drop
    tower and the wheel behind the pines, a clown dunk tank, a blue bumper car, the fire."""
    paint_mode()
    dusk_sky(tod, far_y=90)
    ground_plane(N('#7f7a3a', tod), N('#5e5a30', tod), size=(400, 300), loc=(0, 80, 0), mottle=0.35)
    coaster(-34, -4, 34, tod, seed=4)
    ferris(6, 36, 6.0, tod)
    pcyl('DropTower', 0.6, 14, (-10, 30, 7), '#7a5aa8', tod, verts=10)
    pcyl('DropTop', 2.2, 1.2, (-10, 30, 13.5), '#9a7ac8', tod, r2=1.0, verts=16)
    for (x, r, a) in ((-24, 2.6, '#c8303a'), (18, 2.4, '#7a5aa8'), (26, 2.2, '#c8303a')):
        circus_tent(x, 22, tod, r=r, h=2.0, roof=2.6, a=a)
    rnd = random.Random(21)
    for (x, y) in ((-16, 14), (-6, 17), (12, 15), (-28, 12), (24, 13)):
        mossy_pine(x, y, rnd.uniform(15, 19), tod, seed=int(x * 3), s=1.5)
    clown_face_tent(7.5, 8.5, tod, s=1.2, a='#c8303a', b='#efe6d6', star_eye=True)
    # the clown dunk tank: a clown head over a blue tank, its arms out
    pbox('DunkTank', (1.8, 1.6, 1.6), (-3.0, 11.0, 4.6), '#3a6ab8', tod)
    card(uid('DunkHead'), _blob_pts(0.8, 0.85, 20, 0, 0), 10.15, pmat('DunkHead' + tod, N('#d8d8d0', tod), unlit=True, mottle=0.1), x=-3.0, z=6.1)
    for sd in (-1, 1):
        card(uid('DunkHair'), _blob_pts(0.6, 0.5, 14, 0.2, sd + 3), 10.2, pmat('DunkHair' + tod, N('#3a6ab8', tod), unlit=True, mottle=0), x=-3.0 + sd * 1.0, z=6.3)
    pcyl('DunkChain', 0.05, 3.0, (-3.0, 11.0, 7.5), '#6a6a72', tod, verts=6)
    pbox('Bumper', (2.0, 1.3, 0.7), (-7.0, 6.0, 0.4), '#2e3a8a', tod)
    pbox('BumperSeat', (0.9, 0.6, 0.6), (-7.0, 6.4, 0.95), '#1a1a2a', tod)
    neon_arrow(13.5, 7.0, 3.4, tod, s=0.8)
    target_board(12.0, 7.4, 1.8, tod, s=0.8)
    campfire_logs(-6.0, 3.6, tod, w=2.2)
    debris(tod, 1.0, 6.0, n=8, seed=22)
    fog_wisps(tod, 2, 12, n=10, seed=23)
    for x in (-8.0, -4.0, 0.0):
        stand(x, 2.4)
    paint_sun(azimuth=-30, elevation=45 if tod == 'day' else 28, energy=4.0 if tod == 'day' else 1.6)
    tv_camera(*cam)


def cv_campsite_merge(tod):
    _merge_camp(tod, ((0.0, -7.0, 2.1), (0.5, 12, 2.8), 25))


def cv_shelter_merge(tod):
    """Inside the merged tent (DC4_Merge_Interior): clown photo boards, the duck gallery, the CORN DOGS
    sign, star boxes, the grinning clown statue holding two torches, a wooden floor."""
    paint_mode()
    W, D, H = 11.0, 6.0, 4.6
    plank_floor('Floor', (W, D, 0.2), (0, D / 2, -0.1), '#8a5a32', 'day', axis='y', step=0.9, seam='#6a4228')
    for k in range(9):
        a = math.radians(180 - k * 22.5)
        x = math.cos(a) * W * 0.55; y = D * 0.55 + math.sin(a) * D * 0.5
        col = '#8a2a2a' if k % 2 == 0 else '#d8c8d8'
        pbox('Drape', (2.6, 0.12, H + 1.4), (x, y, (H + 1.4) / 2), col, 'day', mottle=0.25, rot=(0, 0, math.degrees(a) - 90))
    # photo boards: a clown in a frame with an empty face, two of them
    for (x, c) in ((-4.0, '#3a6ab8'), (4.2, '#3a6ab8')):
        pbox('PhotoBoard', (1.4, 0.12, 2.6), (x, D * 0.85, 1.6), '#e8b03a', 'day')
        card(uid('ClownHead'), _blob_pts(0.5, 0.5, 16, 0, 0), D * 0.85 - 0.1, pmat('PhotoHead', '#f2ece0', unlit=True, mottle=0), x=x, z=3.25)
        card(uid('ClownHairP'), _blob_pts(0.35, 0.3, 12, 0.2, 1), D * 0.85 - 0.09, pmat('PhotoHair', c, unlit=True, mottle=0), x=x - 0.5, z=3.3)
        card(uid('ClownHairP'), _blob_pts(0.35, 0.3, 12, 0.2, 2), D * 0.85 - 0.09, pmat('PhotoHair', c, unlit=True, mottle=0), x=x + 0.5, z=3.3)
        card(uid('PhotoHole'), [(-0.45, -0.7), (0.45, -0.7), (0.45, 0.7), (-0.45, 0.7)], D * 0.85 - 0.1, pmat('PhotoHole', '#4a5a3a', unlit=True, mottle=0), x=x, z=1.8)
    # the duck gallery, the CORN DOGS sign over it
    pbox('Gallery', (3.0, 0.15, 2.2), (-0.8, D * 0.9, 1.4), '#c8a03a', 'day')
    for z in (0.9, 1.7):
        card(uid('GalWater'), [(-1.4, 0), (1.4, 0), (1.4, 0.4), (-1.4, 0.4)], D * 0.9 - 0.1, pmat('GalWater', '#3aa8c8', unlit=True, mottle=0), x=-0.8, z=z)
    for k in range(4):
        card(uid('Duck'), _blob_pts(0.22, 0.18, 12, 0, k), D * 0.9 - 0.12, pmat('Duck', '#e8d86a', unlit=True, mottle=0), x=-1.8 + k * 0.65, z=1.35 + (k % 2) * 0.8)
    pbox('CornSign', (2.8, 0.12, 1.2), (1.6, D * 0.85, 3.6), '#f2d8c0', 'day', rot=(0, -6, 0))
    t = ptext('CORN DOGS', (1.6, D * 0.85 - 0.1, 3.6), 0.36, '#a82a2a', rot=(90, -6, 0))
    for k in range(10):
        card(uid('SignBulb'), _blob_pts(0.06, 0.06, 8, 0, 0), D * 0.85 - 0.08, pmat('SignBulb', '#ffe28a', unlit=True, mottle=0), x=0.3 + k * 0.29, z=4.25)
    # the clown statue with torches, star boxes, a jack-in-the-box
    pbox('ClownBody', (1.4, 0.8, 2.4), (2.6, D * 0.6, 1.3), '#a82a2a', 'day')
    card(uid('ClownSmile'), _blob_pts(0.7, 0.6, 16, 0, 0), D * 0.6 - 0.45, pmat('StatueHead', '#f2ece0', unlit=True, mottle=0), x=2.6, z=3.0)
    card(uid('Grin'), [(-0.5, 0), (0.5, 0), (0.35, -0.28), (-0.35, -0.28)], D * 0.6 - 0.46, pmat('Grin', '#3a2a2a', unlit=True, mottle=0), x=2.6, z=2.85)
    for k in range(6):
        card(uid('GrinTooth'), [(-0.07, 0), (0.07, 0), (0.07, -0.12), (-0.07, -0.12)], D * 0.6 - 0.47, pmat('GrinTooth', '#f2ece0', unlit=True, mottle=0), x=2.25 + k * 0.14, z=2.84)
    for sd in (-1, 1):
        card(uid('StatueEye'), [(-0.16, -0.03), (0.16, -0.03), (0.16, 0.03), (-0.16, 0.03)], D * 0.6 - 0.47, pmat('StatueEye', '#2a2a2a', unlit=True, mottle=0), x=2.6 + sd * 0.25, z=3.2).rotation_euler = (0, sd * 0.6, 0)
        card(uid('Glove'), _blob_pts(0.32, 0.26, 12, 0.1, sd + 4), D * 0.6 - 0.5, pmat('Glove', '#f2ece0', unlit=True, mottle=0), x=2.6 + sd * 1.1, z=2.1)
    card(uid('StatueHat'), [(-0.35, 0), (0.35, 0), (0, 0.9)], D * 0.6 - 0.45, pmat('StatueHat', '#3a5aa8', unlit=True, mottle=0), x=2.6, z=3.55)
    card(uid('StatueNum'), [(-0.05, 0), (0.05, 0), (0.05, 0.35), (-0.05, 0.35)], D * 0.6 - 0.46, pmat('StatueNum', '#f2ece0', unlit=True, mottle=0), x=2.6, z=3.7)
    for sd in (-1, 1):
        pbox('Torch', (0.12, 0.12, 1.6), (2.6 + sd * 1.1, D * 0.6 - 0.3, 2.6), '#6a4a2a', 'day')
        flame(2.6 + sd * 1.1, D * 0.6 - 0.35, 3.4, 0.5)
    for (x, y, c) in ((-3.4, 2.4, '#3a5aa8'), (-1.8, 2.0, '#c8303a')):
        pbox('StarBox', (1.0, 1.0, 1.0), (x, y, 0.5), c, 'day')
        star_shape(uid('BoxStar'), (x, y - 0.52, 0.55), 0.3, '#e8c23a')
    pbox('Jack', (0.8, 0.8, 0.8), (-4.4, 1.6, 0.4), '#efe6d6', 'day')
    for x in (-1.2, 0.6, 2.2):
        stand(x, 2.2)
    room_light(azimuth=-30, elevation=60, energy=2.8)
    paint_sky('#8a5a3a', '#8a5a3a')
    tv_camera((0.0, -2.6, 1.8), (0, D, 1.9), lens=21)


SCENES['carnival'].update({
    'campsite-t0': cv_campsite_t0, 'shelter-t0': cv_shelter_t0,
    'campsite-t1': cv_campsite_t1, 'shelter-t1': cv_shelter_t1,
    'campsite-t2': cv_campsite_t2, 'shelter-t2': cv_shelter_t2,
    'campsite-merge': cv_campsite_merge, 'shelter-merge': cv_shelter_merge,
})
OUTDOOR['carnival'] |= {'campsite-t0', 'campsite-t1', 'campsite-t2', 'shelter-t2', 'campsite-merge'}

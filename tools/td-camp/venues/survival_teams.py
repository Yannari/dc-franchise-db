# ══════════════════════════════════════════════════════════════════════
# venues/survival_teams.py — Soluna's team campsites, one set of plates per team slot
# ══════════════════════════════════════════════════════════════════════
# The teams live apart on Soluna (DC5), so each slot of the camp map (survival_island.si_map) has
# its own plates: '<spot>-t<slot>-<tod>'. The viewer (js/vp-td-ep/steps.js teamSpot) shows a
# team's shelter and fire from its own slot. References (Disventure Camp wiki):
#   t0 Fans_Campsite — the A-frame in a jungle clearing: dome trees hung with vines, curved palms,
#      bamboo, a waterfall far back, hay piles, the fire between two logs, a tiki, the yellow banner.
#   t1 Favorites_Campsite — the hut on stilts on the beach: a deep thatch roof, torches by the steps,
#      the purple banner, a tiki totem, the sea and the teal mountains with palm islets;
#      Favorites_shelter_interior — log walls, a thatch roof on beams strung with lights, a long
#      window on the sea, tiki posts, a rug of giant leaves, a low table, tiki stools, a hammock.
#   t2 Bamboo_grove — a third camp for a three-team season (not in the show; built from the grove):
#      tall bamboo in layers, a bamboo lean-to, the red banner.

SOL_GROUND = '#71913e'


def dome_tree(x, y, h, tod, col='#2f7a3e', s=1.0, seed=0, vines=True):
    """Soluna's jungle tree (Fans_Campsite): a thin trunk under a wide dome with a flat dark underside,
    a pale cap where the sun hits, vines hanging off the rim."""
    rnd = random.Random(seed)
    tm = pmat('DomeTrunk' + tod, N('#6a4a32', tod), unlit=True, mottle=0.15)
    card(uid('DomeTrunk'), [(-0.16 * s, 0), (0.16 * s, 0), (0.1 * s, h), (-0.1 * s, h)], y, tm, x=x)
    w, d = 1.9 * s, 1.15 * s
    dome = [(math.cos(math.pi * i / 24) * w, math.sin(math.pi * i / 24) * d) for i in range(25)]
    card(uid('Dome'), dome, y - 0.01, pmat('Dome' + col + tod, N(col, tod), unlit=True, mottle=0.18, mscale=2), x=x, z=h)
    cap = [(math.cos(math.pi * (0.25 + 0.5 * i / 16)) * w * 0.62, math.sin(math.pi * (0.25 + 0.5 * i / 16)) * d * 0.92) for i in range(17)]
    card(uid('DomeCap'), cap + [(0, d * 0.45)], y - 0.015, pmat('DomeCap' + col + tod, N(_mix_hex(col, '#d8f070', 0.28), tod), unlit=True, mottle=0.1), x=x - 0.2 * s, z=h)
    card(uid('DomeUnder'), [(-w, 0), (w, 0), (w * 0.9, -0.28 * s), (-w * 0.9, -0.28 * s)], y - 0.02,
         pmat('DomeUnder' + col + tod, N(_mix_hex(col, '#08201a', 0.45), tod), unlit=True, mottle=0), x=x, z=h)
    if vines:
        vm = pmat('Vine' + tod, N('#3a7a2a', tod), unlit=True, mottle=0)
        for k in range(rnd.randint(2, 4)):
            vx = rnd.uniform(-w * 0.85, w * 0.85); L = rnd.uniform(0.8, 2.2) * s
            pts = [(vx - 0.04 * s, 0), (vx + 0.04 * s, 0)] + [(vx + 0.04 * s + 0.12 * s * math.sin(t * 3), -L * t) for t in (0.5, 1.0)][::-1]
            card(uid('Vine'), [(vx - 0.035 * s, -0.2 * s), (vx + 0.035 * s, -0.2 * s), (vx + 0.035 * s + 0.1 * s, -L), (vx - 0.035 * s + 0.1 * s, -L)], y - 0.025, vm, x=x, z=h)
            card(uid('VineLeaf'), _blob_pts(0.12 * s, 0.07 * s, 8, 0, k), y - 0.03, vm, x=x + vx + 0.1 * s, z=h - L)


def far_falls(x, y, h, tod, w=1.4):
    """A waterfall far back between the trees (Fans_Campsite): a grey-teal cliff, the fall, a foam pool."""
    card(uid('FallCliff'), [(-w * 2.4, 0), (w * 2.4, 0), (w * 1.8, h * 0.9), (w * 0.6, h * 1.05), (-w * 0.9, h), (-w * 2.0, h * 0.7)], y,
         pmat('FallCliff' + tod, N('#5a8a8a', tod), unlit=True, mottle=0.2), x=x)
    card(uid('Fall'), [(-w * 0.5, 0), (w * 0.5, 0), (w * 0.42, h * 0.95), (-w * 0.42, h * 0.95)], y - 0.05,
         pmat('FallWater' + tod, N('#7ad8f0', tod), unlit=True, mottle=0), x=x)
    for k in range(4):
        card(uid('FallStreak'), [(-0.05, 0), (0.05, 0), (0.05, h * 0.9), (-0.05, h * 0.9)], y - 0.06,
             pmat('FallStreak' + tod, N('#d8f6ff', tod), unlit=True, mottle=0), x=x - w * 0.3 + k * w * 0.2, z=0.1)
    card(uid('FallFoam'), _blob_pts(w * 0.9, 0.35, 16, 0.2, 2), y - 0.07, pmat('FallFoam' + tod, N('#eefaff', tod), unlit=True, mottle=0), x=x, z=0.1)


def a_frame(x, y, tod, s=1.0, rot_z=0):
    """The Fans' shelter: timber poles crossed at the top and running past the ridge, lashed rungs,
    a patchwork of straw thatch over them with holes torn through."""
    g = _group(uid('AFrame'), (x, y, 0), rot_z)
    def add(ob):
        _child(g, ob)
        return ob
    H, W, D = 3.6 * s, 2.3 * s, 4.2 * s
    tilt = math.degrees(math.atan2(W, H))
    for dy in (-D / 2, D / 2):
        for sd in (-1, 1):
            add(pbox('APole', (0.18 * s, 0.18 * s, H * 1.35), (sd * W * 0.38, dy, H * 0.62), '#5a3a22', tod, rot=(0, -sd * tilt, 0)))
    add(pbox('ARidge', (0.16 * s, D + 0.8 * s, 0.16 * s), (0, 0, H), '#5a3a22', tod))
    for k in range(4):
        z = 0.5 * s + k * 0.8 * s; half = W * (1 - z / H)
        for sd in (-1, 1):
            add(pbox('ARung', (0.1 * s, D, 0.1 * s), (sd * half * 0.98, 0, z), '#6a4a2a', tod))
    for sd in (-1, 1):
        th = add(pbox('AThatch', (0.12 * s, D * 0.92, H * 1.12), (sd * W * 0.5, 0, H * 0.5), '#c8a560', tod, shade='#8a6a3a', mottle=0.45, mscale=2.6, rot=(0, -sd * tilt, 0)))
    # straw ends hanging over the eaves, and the holes: dark gaps showing the poles behind
    for k in range(9):
        add(pbox('Straw', (0.06, 0.32 * s, 0.5 * s), (-W * 1.02, -D * 0.45 + k * D * 0.11, 0.25 * s), '#d8b870', tod, rot=(0, 20, 0), ink=False))
    for (hy, hz, hw, hh) in ((-1.0, 1.4, 0.9, 0.7), (0.9, 2.1, 0.7, 0.5), (-0.2, 0.7, 0.6, 0.4)):
        add(pbox('AHole', (0.14 * s, hw * s, hh * s), (-W * 0.5 - 0.02, hy * s, hz * s), '#3a2a1a', tod, rot=(0, tilt, 0), ink=False))
    return g


def hay_pile(x, y, tod, s=1.0, seed=0):
    card(uid('Hay'), _blob_pts(1.0 * s, 0.6 * s, 24, 0.12, seed, flat_bottom=True), y, pmat('Hay' + tod, N('#d8b46a', tod), unlit=True, mottle=0.35, mscale=3), x=x, z=0)
    rnd = random.Random(seed)
    for k in range(7):
        a = rnd.uniform(0.2, 2.9); L = rnd.uniform(0.3, 0.6) * s
        card(uid('HayStraw'), [(0, 0), (0.03, 0), (math.cos(a) * L + 0.03, math.sin(a) * L), (math.cos(a) * L, math.sin(a) * L)], y - 0.01,
             pmat('HayStraw' + tod, N('#a8843a', tod), unlit=True, mottle=0), x=x + rnd.uniform(-0.6, 0.6) * s, z=0.3 * s)


def team_banner(x, y, col, emblem, tod, s=1.0):
    """A team's banner on a T-pole (DC5): a swallow-tailed flag with a pale emblem."""
    pcyl('BannerPole', 0.09 * s, 5.4 * s, (x, y, 2.7 * s), '#5a3a22', tod, verts=8)
    pbox('BannerBar', (2.0 * s, 0.12, 0.12), (x, y, 5.1 * s), '#5a3a22', tod)
    card(uid('Banner'), [(-0.85 * s, 0), (0.85 * s, 0), (0.85 * s, -2.9 * s), (0, -2.4 * s), (-0.85 * s, -2.9 * s)], y - 0.1,
         pmat('Banner' + col + tod, N(col, tod), unlit=True, mottle=0.12), x=x, z=5.0 * s)
    card(uid('BannerTrim'), [(-0.85 * s, 0), (0.85 * s, 0), (0.85 * s, -0.12 * s), (-0.85 * s, -0.12 * s)], y - 0.11,
         pmat('BannerTrim' + col + tod, N(_mix_hex(col, '#1a1a1a', 0.35), tod), unlit=True, mottle=0), x=x, z=4.95 * s)
    em = pmat('Emblem' + tod, N('#f6eec8', tod), unlit=True, mottle=0)
    cx, cz = x, 3.55 * s
    card(uid('EmblemDisc'), _blob_pts(0.48 * s, 0.48 * s, 24, 0, 0), y - 0.12, em, x=cx, z=cz)
    ink = pmat('EmblemInk' + col + tod, N(_mix_hex(col, '#1a1a1a', 0.2), tod), unlit=True, mottle=0)
    if emblem == 'sun':
        card(uid('EmblemIn'), _blob_pts(0.2 * s, 0.2 * s, 16, 0, 0), y - 0.13, ink, x=cx, z=cz)
        for k in range(8):
            a = k / 8 * 6.28
            card(uid('Ray'), [(-0.04 * s, 0.24 * s), (0.04 * s, 0.24 * s), (0, 0.4 * s)], y - 0.13, ink, x=cx, z=cz).rotation_euler = (0, -a, 0)
    elif emblem == 'moon':
        card(uid('EmblemIn'), [(math.cos(a / 20 * 6.28) * 0.32 * s, math.sin(a / 20 * 6.28) * 0.32 * s) for a in range(20)], y - 0.13, ink, x=cx, z=cz)
        card(uid('EmblemCut'), [(math.cos(a / 20 * 6.28) * 0.28 * s, math.sin(a / 20 * 6.28) * 0.28 * s) for a in range(20)], y - 0.14, em, x=cx + 0.14 * s, z=cz + 0.06 * s)
    else:   # a leaf
        card(uid('EmblemIn'), [(0, -0.34 * s), (0.2 * s, -0.05 * s), (0, 0.36 * s), (-0.2 * s, -0.05 * s)], y - 0.13, ink, x=cx, z=cz)


def tall_tiki(x, y, h, tod, col='#8a5a3a', s=1.0, feathers=False):
    """A totem of two stacked tiki faces (DC5 camps), feathers on top when it is the Favorites'."""
    for k, (hh, c) in enumerate(((h * 0.55, col), (h * 0.45, _mix_hex(col, '#c8843a', 0.35)))):
        z0 = 0 if k == 0 else h * 0.55
        pbox('Totem', (0.8 * s, 0.6 * s, hh), (x, y, z0 + hh / 2), c, tod, mottle=0.35, mscale=1.5)
        for sx in (-0.2, 0.2):
            card(uid('TotemEye'), _blob_pts(0.12 * s, 0.1 * s, 12, 0, 0), y - 0.31 * s, pmat('TotemEye' + tod, N('#f2e2b0', tod), unlit=True, mottle=0), x=x + sx * s, z=z0 + hh * 0.66)
        card(uid('TotemMouth'), [(-0.26 * s, 0), (0.26 * s, 0), (0.2 * s, -0.18 * s), (-0.2 * s, -0.18 * s)], y - 0.31 * s,
             pmat('TotemMouth' + tod, N('#3a1a12', tod), unlit=True, mottle=0), x=x, z=z0 + hh * 0.36)
        card(uid('TotemBrow'), [(-0.4 * s, 0), (0.4 * s, 0), (0.4 * s, 0.08 * s), (-0.4 * s, 0.08 * s)], y - 0.31 * s,
             pmat('TotemBrow' + tod, N('#3a2a1a', tod), unlit=True, mottle=0), x=x, z=z0 + hh * 0.82)
    if feathers:
        for k, c in enumerate(('#d84a3a', '#e8c23a', '#3aa8c8', '#4ab84a', '#d84a3a')):
            f = card(uid('Feather'), [(-0.08 * s, 0), (0.08 * s, 0), (0, 0.9 * s)], y - 0.05, pmat('Feather' + c + tod, N(c, tod), unlit=True, mottle=0), x=x - 0.4 * s + k * 0.2 * s, z=h)
            f.rotation_euler = (0, math.radians(-30 + k * 15), 0)


def log_seat(x, y, tod, L=2.0, rz=0):
    pcyl('LogSeat', 0.26, L, (x, y, 0.26), '#7a4e2e', tod, verts=12, rot=(0, 90, rz))
    for sd in (-1, 1):
        card(uid('LogEnd'), _blob_pts(0.24, 0.24, 12, 0, 0), y - 0.27, pmat('LogEnd' + tod, N('#c8955a', tod), unlit=True, mottle=0), x=x + sd * L / 2 * math.cos(math.radians(rz)), z=0.26) if rz == 0 else None


def flat_stone(x, y, tod, s=1.0, seed=0):
    r = icorock(uid('FlatStone'), (0.55 * s, 0.45 * s, 0.22 * s), (x, y, 0.1 * s), N('#6a6a64', tod), seed=seed)
    r.data.materials.clear(); r.data.materials.append(pmat('FlatStone' + tod, N('#6a6a64', tod), N('#3a3a3a', tod), mottle=0.3)); r['ink'] = 1


def bamboo_stand(x0, x1, y, tod, n=14, h=(9, 13), s=1.3, seed=0, col=None):
    """A layer of tall bamboo with leaf fans at the top (Bamboo_grove)."""
    rnd = random.Random(seed)
    col = col or '#7ab83a'
    for k in range(n):
        x = x0 + (x1 - x0) * (k + rnd.uniform(0.1, 0.9)) / n
        hh = rnd.uniform(*h)
        m = pmat('BamStalk' + col + tod, N(col, tod), unlit=True, mottle=0)
        dk = pmat('BamNode' + col + tod, N(_mix_hex(col, '#1a3a1a', 0.4), tod), unlit=True, mottle=0)
        card(uid('BamStalk'), [(-0.1 * s, 0), (0.1 * s, 0), (0.08 * s, hh), (-0.08 * s, hh)], y, m, x=x)
        for i in range(1, int(hh / 1.1)):
            card(uid('BamNode'), [(-0.12 * s, i * 1.1), (0.12 * s, i * 1.1), (0.12 * s, i * 1.1 + 0.06), (-0.12 * s, i * 1.1 + 0.06)], y - 0.01, dk, x=x)
        lm = pmat('BamLeaf' + col + tod, N(_mix_hex(col, '#2a6a2a', 0.25), tod), unlit=True, mottle=0)
        for j in range(rnd.randint(3, 5)):
            zz = hh * rnd.uniform(0.55, 1.0)
            for k2 in range(4):
                a = math.radians(-70 + k2 * 45 + rnd.uniform(-10, 10)); L = rnd.uniform(0.7, 1.1) * s
                lf = card(uid('BamLeaf'), [(0, 0), (L * 0.5, 0.1 * s), (L, 0), (L * 0.5, -0.08 * s)], y - 0.02, lm, x=x, z=zz)
                lf.rotation_euler = (0, -a - math.pi / 2, 0)


def jungle_floor_plants(tod, y, x0, x1, seed=0):
    """The low band of ferns, round leaves and red blooms along the foot of the jungle (Bamboo_grove)."""
    rnd = random.Random(seed)
    x = x0
    while x < x1:
        c = rnd.choice(('#3a8a4a', '#2f7a5a', '#5aa83a', '#3a9a7a'))
        leafy_plant(x, y + rnd.uniform(-0.5, 0.5), tod, s=rnd.uniform(1.0, 1.6), seed=int(x * 10), col=N(c, tod))
        x += rnd.uniform(1.4, 2.6)


# ── t0: the Fans' jungle camp ─────────────────────────────────────────
def _fans_camp(tod, cam):
    paint_mode(); P = SOL[tod]
    sol_backdrop(tod, mountains=True)
    ground_plane(N(SOL_GROUND, tod), N('#5a7a32', tod), mottle=0.3)
    brush_patch('Clearing', 7, (0, 5), N('#80a046', tod), sx=1.8, sy=0.9, seed=2)
    far_falls(-1.5, 34, 9, tod)
    rnd = random.Random(5)
    for k in range(16):
        x = -30 + k * 4.0 + rnd.uniform(-1, 1)
        if abs(x + 1.5) < 3:
            continue
        dome_tree(x, 26 + rnd.uniform(0, 4), rnd.uniform(7, 10), tod, col=('#2f7a3e', '#3a8a3a', '#256a3a')[k % 3], s=rnd.uniform(1.3, 1.7), seed=k)
    bamboo_stand(-16, -9, 22, tod, n=6, h=(8, 11), s=1.1, seed=3)
    bamboo_stand(9, 14, 21, tod, n=4, h=(7, 10), s=1.1, seed=4)
    for k, (x, y, h, lean) in enumerate(((-11, 15, 9, 14), (5, 16, 10, -8), (13, 13, 9, -16), (-19, 12, 8, 18))):
        sol_palm(x, y, h, tod, lean=lean, seed=k + 10, s=1.3)
    for k, (x, y) in enumerate(((-15, 12), (-6, 18), (9, 18), (17, 14), (21, 20), (-24, 19))):
        dome_tree(x, y, rnd.uniform(5, 7), tod, col=('#2f7a3e', '#3a8a3a')[k % 2], s=1.3, seed=20 + k)
    jungle_floor_plants(tod, 11.5, -26, 26, seed=6)
    a_frame(-4.5, 7.6, tod, s=1.15, rot_z=72)
    hay_pile(-8.4, 5.2, tod, s=1.2, seed=1)
    hay_pile(-0.6, 5.0, tod, s=1.0, seed=2)
    log_seat(-6.5, 3.2, tod, L=2.4)
    fire_pit(4.5, 5.2, tod, r=0.55, lit=True)
    log_seat(2.1, 5.0, tod, L=2.0)
    log_seat(6.9, 5.0, tod, L=2.0)
    for k, (x, y) in enumerate(((2.2, 3.0), (6.8, 3.0), (9.5, 4.0))):
        flat_stone(x, y, tod, seed=k)
    rock_shelf(9.5, 8.8, 3.0, 1.6, 0.9, '#8a8a7a', seed=3, layers=2)
    tall_tiki(8.6, 6.8, 2.8, tod, s=0.9)
    team_banner(10.4, 6.4, '#e8c23a', 'sun', tod)
    leafy_plant(-12, 3, tod, s=1.6, seed=7)
    leafy_plant(12.5, 2.5, tod, s=1.5, seed=8)
    for x in (-3, 3.5, 7.5):
        stand(x, 3.6)
    paint_sun(azimuth=-30, elevation=50 if tod == 'day' else 30, energy=4.0 if tod == 'day' else 1.8)
    tv_camera(*cam)


def si_shelter_t0(tod):
    """The Fans' A-frame, close (Fans_Campsite, left half)."""
    _fans_camp(tod, ((-2.0, -7.0, 2.0), (-2.0, 10, 2.3), 27))


def si_campfire_t0(tod):
    """The Fans' fire between its logs, the tiki and the yellow banner (Fans_Campsite, right half)."""
    _fans_camp(tod, ((3.0, -6.5, 2.0), (4.0, 10, 2.0), 27))


# ── t1: the Favorites' beach camp ──────────────────────────────────────
def beach_hut(x, y, tod, s=1.0):
    """The Favorites' hut (Favorites_Campsite): log walls on stilts, a deep thatch roof hanging in a
    fringe, the gable to the front with its shutter, a door, windows, steps down with a rail."""
    lift, W, D, H = 1.8 * s, 6.0 * s, 4.2 * s, 2.6 * s
    for sx in (-1, 1):
        for sy in (-1, 1):
            pcyl('Stilt', 0.16 * s, lift + 0.3, (x + sx * W * 0.44, y + sy * D * 0.42, (lift + 0.3) / 2), '#5a3a22', tod, verts=8)
    pbox('HutDeck', (W + 0.6 * s, D + 0.6 * s, 0.2), (x, y, lift), '#7a5432', tod)
    pbox('HutWall', (W, D, H), (x, y, lift + H / 2), '#a8784a', tod, shade='#7a5232', mottle=0.3, mscale=1.5)
    for i in range(1, 9):
        pbox('LogSeam', (W + 0.02, 0.02, 0.04), (x, y - D / 2 - 0.01, lift + i * H / 9), '#6a4a2a', tod, ink=False)
    # the roof: two deep thatch slopes, the gable triangle with its shutter, a fringe along the eaves
    for sd in (-1, 1):
        thatch('HutRoof', (W + 2.4 * s, D / 2 + 1.6 * s, 0.4), (x, y + sd * (D * 0.3), lift + H + 1.05 * s), tod, rot=(sd * -40, 0, 0))
    card(uid('Gable'), [(-W * 0.5, 0), (W * 0.5, 0), (0, 2.0 * s)], y - D / 2 - 0.02, pmat('Gable' + tod, N('#8a6a3a', tod), unlit=True, mottle=0.3), x=x, z=lift + H)
    pbox('Shutter', (0.9 * s, 0.08, 0.8 * s), (x, y - D / 2 - 0.05, lift + H + 0.7 * s), '#5a3a22', tod)
    for k in range(18):
        card(uid('Fringe'), [(-0.22 * s, 0), (0.22 * s, 0), (0, -0.55 * s)], y - D / 2 - 1.15 * s,
             pmat('Fringe' + tod, N('#b8904a', tod), unlit=True, mottle=0), x=x - (W + 2.0 * s) / 2 + k * (W + 2.0 * s) / 17, z=lift + H + 0.1 * s)
    pbox('HutDoor', (1.0 * s, 0.08, 1.8 * s), (x + 0.2 * s, y - D / 2 - 0.04, lift + 0.9 * s), '#6a4a2a', tod)
    pbox('DoorWin', (0.5 * s, 0.09, 0.3 * s), (x + 0.2 * s, y - D / 2 - 0.05, lift + 1.45 * s), '#3a2a1a', tod, ink=False)
    for wx in (-1.9, 1.9):
        pbox('HutWin', (1.0 * s, 0.08, 0.7 * s), (x + wx * s, y - D / 2 - 0.04, lift + 1.5 * s), '#3a2a1a', tod)
        pbox('WinSill', (1.2 * s, 0.14, 0.1), (x + wx * s, y - D / 2 - 0.08, lift + 1.1 * s), '#5a3a22', tod)
    for i in range(6):
        pbox('HutStep', (1.2 * s, 0.35, 0.1), (x + 0.2 * s, y - D / 2 - 0.4 - i * 0.36, lift - 0.15 - i * 0.3), '#7a5432', tod)
    for sd in (-1, 1):
        pbox('StairRail', (0.1, 2.4 * s, 0.1), (x + 0.2 * s + sd * 0.65 * s, y - D / 2 - 1.2 * s, lift - 0.3 * s), '#5a3a22', tod, rot=(-38, 0, 0))
        tiki(x + 0.2 * s + sd * 1.0 * s, y - D / 2 - 2.6 * s, tod, h=2.4, lit=True)
    pbox('Railing', (W + 0.6 * s, 0.1, 0.1), (x, y - D / 2 - 0.3, lift + 0.9), '#5a3a22', tod)


def _islet(x, y, w, tod, seed=0):
    card(uid('Islet'), [(-w, 0), (-w * 0.6, w * 0.25), (0, w * 0.32), (w * 0.6, w * 0.22), (w, 0)], y, pmat('Islet' + tod, N('#3a9a5a', tod), unlit=True, mottle=0), x=x, z=-0.1)
    for k in range(2):
        sol_palm(x - w * 0.3 + k * w * 0.6, y - 0.1, w * 0.6, tod, lean=10 - k * 20, seed=seed + k, s=0.6, coconuts=False)


def _favorites_camp(tod, cam):
    paint_mode(); P = SOL[tod]
    sol_backdrop(tod, far_y=70)
    _islet(-26, 40, 5, tod, seed=1); _islet(18, 44, 4, tod, seed=3); _islet(34, 38, 3, tod, seed=5)
    box('Sand', (220, 10, 0.2), (0, 9, -0.1), pmat('FavSand' + tod, N('#f2dc9a', tod), N('#c8b07a', tod), mottle=0.25, mscale=0.3), bevel=0)
    water_plane(tod, y0=14, col=P['sea'], far=P['sea_far'])
    box('Foam', (220, 0.4, 0.02), (0, 14.2, -0.05), pmat('FavFoam' + tod, N('#f2fbfb', tod), unlit=True, mottle=0), bevel=0)
    box('Grass', (220, 9, 0.2), (0, -0.5, -0.08), pmat('FavGrass' + tod, N('#8aa84a', tod), N('#6a8a3a', tod), mottle=0.3, mscale=0.3), bevel=0)
    brush_patch('GrassEdge', 6, (-6, 4.2), N('#8aa84a', tod), sx=3.0, sy=0.4, seed=3)
    beach_hut(4.5, 9.5, tod, s=1.0)
    for k, (x, y, h, lean) in enumerate(((0.5, 11.5, 9, 12), (-0.8, 12.5, 7.5, -10), (10.5, 11, 9.5, -14), (13, 12.5, 8, 10))):
        sol_palm(x, y, h, tod, lean=lean, seed=k + 30, s=1.3)
    fire_pit(-7.0, 4.6, tod, r=0.55, lit=True)
    log_seat(-9.6, 4.8, tod, L=2.0)
    log_seat(-4.4, 4.8, tod, L=2.0)
    tall_tiki(9.6, 6.6, 3.2, tod, s=0.95)
    team_banner(11.0, 6.2, '#8a4ab8', 'moon', tod)
    for k, (x, y, s) in enumerate(((-11, 2.0, 0.6), (-4, 1.0, 0.5), (8, 1.5, 0.6), (13, 2.5, 0.7), (-14, 6, 0.5))):
        flat_stone(x, y, tod, s=s, seed=k + 10)
    for x in (-8.5, -5.5, 1.5):
        stand(x, 3.4)
    paint_sun(azimuth=-30, elevation=45 if tod == 'day' else 28, energy=4.0 if tod == 'day' else 1.6)
    tv_camera(*cam)


def si_campfire_t1(tod):
    """The Favorites' camp on the beach: the fire on the left, the hut on stilts (Favorites_Campsite)."""
    _favorites_camp(tod, ((1.0, -7.6, 2.4), (1.5, 10, 2.4), 25))


def si_shelter_t1(tod):
    """Inside the Favorites' hut (Favorites_shelter_interior): log walls, a thatch roof on beams strung
    with lights, the long window on the sea, tiki posts, a rug of giant leaves, a low table and stools,
    a hammock, hay in the corners."""
    paint_mode()
    W, D, H = 11.0, 7.0, 3.4
    plank_floor('Floor', (W, D, 0.2), (0, D / 2, -0.1), '#8a5e3a', 'day', axis='y', step=0.5, seam='#5a3a22')
    lm = pmat('LogSeam', '#6a4a2a', unlit=True, mottle=0)
    for sx in (-1, 1):
        pbox('SideWall', (0.2, D, H), (sx * W / 2, D / 2, H / 2), '#a8784a', 'day', mottle=0.3, mscale=0.7, ink=False)
        for i in range(1, 10):
            box(uid('LogSeam'), (0.01, D, 0.035), (sx * (W / 2 - 0.11), D / 2, i * H / 10), lm, bevel=0)
    # the view through the window: sky, teal mountains with an islet, the sea, set behind the back wall
    view_y = D + 1.0
    card(uid('ViewSky'), [(-3.4, 0.8), (3.4, 0.8), (3.4, 3.2), (-3.4, 3.2)], view_y, pmat('ViewSky', '#c8ec7a', unlit=True, mottle=0))
    card(uid('ViewSkyTop'), [(-3.4, 2.3), (3.4, 2.3), (3.4, 3.2), (-3.4, 3.2)], view_y - 0.01, pmat('ViewSkyTop', '#6ad08a', unlit=True, mottle=0))
    for k, (mx, mw, mh, c) in enumerate(((-2.4, 1.4, 1.2, '#4aa890'), (-0.8, 1.2, 1.5, '#5ab8a0'), (1.6, 1.6, 1.1, '#4aa890'), (3.0, 1.0, 0.8, '#5ab8a0'))):
        card(uid('ViewMtn'), [(-mw, 0), (-mw * 0.2, mh), (mw * 0.3, mh * 0.8), (mw, 0)], view_y - 0.02 - k * 0.001, pmat('ViewMtn' + c, c, unlit=True, mottle=0), x=mx, z=1.4)
    card(uid('ViewIslet'), [(-0.8, 0), (0, 0.35), (0.8, 0)], view_y - 0.03, pmat('ViewIslet', '#3a9a5a', unlit=True, mottle=0), x=1.2, z=1.25)
    card(uid('ViewSea'), [(-3.4, 0.8), (3.4, 0.8), (3.4, 1.4), (-3.4, 1.4)], view_y - 0.04, pmat('ViewSea', '#2ec2d8', unlit=True, mottle=0))
    # the back wall rebuilt around the window opening
    bk = '#a8784a'
    for (cx, w, z0, z1) in ((-4.0, 3.0, 0, H), (4.0, 3.0, 0, H), (0, 5.0, 0, 1.2), (0, 5.0, 2.6, H)):
        pbox('BackPart', (w, 0.22, z1 - z0), (cx, D - 0.02, (z0 + z1) / 2), bk, 'day', mottle=0.3, mscale=0.7, ink=False)
        for i in range(1, 10):
            if z0 < i * H / 10 < z1:
                box(uid('LogSeam'), (w, 0.01, 0.035), (cx, D - 0.14, i * H / 10), lm, bevel=0)
    # the gable above the back wall, up into the roof
    card(uid('Gable'), [(-W / 2, 0), (W / 2, 0), (0, 2.2)], D - 0.05, pmat('GableIn', '#9a6a40', unlit=True, mottle=0.3), z=H)
    pbox('WinFrame', (5.2, 0.3, 0.14), (0, D - 0.1, 1.2), '#5a3a22', 'day')
    pbox('WinFrame', (5.2, 0.3, 0.14), (0, D - 0.1, 2.6), '#5a3a22', 'day')
    # side windows, each a small view
    for sx in (-1, 1):
        pbox('SideWin', (0.06, 1.2, 1.0), (sx * (W / 2 - 0.12), D * 0.55, 2.1), '#7ad0a0', 'day', unlit=True)
        pbox('SideWinFrame', (0.1, 1.4, 1.2), (sx * (W / 2 - 0.1), D * 0.55, 2.1), '#5a3a22', 'day')
    # the roof: dark beams, thatch slopes, a sagging string of lights
    slope = math.degrees(math.atan2(2.2, W / 2))
    for sd in (-1, 1):
        r = pbox('RoofThatch', (W / 2 / math.cos(math.radians(slope)) + 0.2, D, 0.15), (sd * W / 4, D / 2, H + 1.1), '#b8904a', 'day', shade='#8a6a30', mottle=0.45, mscale=2.2, rot=(0, sd * slope, 0), ink=False)
        r.visible_shadow = False
        for k in range(5):
            pbox('Rafter', (W / 2 / math.cos(math.radians(slope)), 0.16, 0.16), (sd * W / 4, 0.6 + k * (D - 1.0) / 4, H + 1.0), '#4a3220', 'day', rot=(0, sd * slope, 0))
    pbox('Ridge', (0.24, D, 0.24), (0, D / 2, H + 2.1), '#4a3220', 'day')
    pbox('TieBeam', (W, 0.24, 0.24), (0, D * 0.55, H), '#4a3220', 'day')
    pbox('KingPost', (0.22, 0.22, 2.1), (0, D * 0.55, H + 1.05), '#4a3220', 'day')
    for row in (D * 0.3, D * 0.85):
        for i in range(18):
            t = i / 17; xx = -W / 2 + 0.4 + t * (W - 0.8); zz = H - 0.15 - 0.35 * math.sin(t * math.pi)
            card(uid('Bulb'), _blob_pts(0.06, 0.06, 8, 0, 0), row, pmat('BulbW', '#fff2b0', unlit=True, mottle=0), x=xx, z=zz)
    # tiki posts along the back wall, a door on the left
    for x in (-2.6, 2.6):
        pbox('Post', (0.32, 0.32, H), (x, D - 0.25, H / 2), '#7a5432', 'day')
        tiki_face(x, D - 0.45, 0.7, 'day', col='#a8743a', s=0.4)
    pbox('Door', (0.08, 1.2, 2.3), (-W / 2 + 0.14, D * 0.35, 1.15), '#7a5a3a', 'day')
    pbox('DoorSlot', (0.09, 0.5, 0.2), (-W / 2 + 0.15, D * 0.35, 1.9), '#3a5a6a', 'day', ink=False)
    # the leaf rug, the table on it, tiki stools
    for k in range(9):
        a = k / 9 * 6.28; r = 1.7
        leaf = [(math.cos(t / 12 * 6.28) * 1.3, math.sin(t / 12 * 6.28) * 0.5) for t in range(12)]
        ob = _flat_poly('RugLeaf', [(px + math.cos(a) * r * 0.6, py * 1.0 + math.sin(a) * r * 0.45 + 3.2) for px, py in leaf], 0.02 + k * 0.002, '#5a8a3a' if k % 2 else '#4a7a32', 'day', mottle=0.15)
    pbox('TableTop', (2.4, 1.4, 0.12), (0, 3.4, 0.62), '#6a8a3a', 'day')
    for sx in (-0.9, 0.9):
        for sy in (-0.45, 0.45):
            pbox('TableLeg', (0.1, 0.1, 0.56), (sx, 3.4 + sy, 0.28), '#5a3a22', 'day')
    for x in (-1.9, 1.9):
        pcyl('Stool', 0.32, 0.5, (x, 3.1, 0.25), '#c8943a', 'day', verts=12)
        card(uid('StoolFace'), [(-0.18, 0), (0.18, 0), (0.12, -0.12), (-0.12, -0.12)], 2.77, pmat('StoolFace', '#5a3a1a', unlit=True, mottle=0), x=x, z=0.3)
    # the hammock between two posts on the right, the feathered tiki by it, hay in the corners
    for x in (2.8, 4.9):
        pbox('HamPost', (0.18, 0.18, 2.2), (x, 4.9, 1.1), '#5a3a22', 'day')
    sag = [(2.8 + 2.1 * t, 1.55 - 0.75 * math.sin(t * math.pi)) for t in [i / 12 for i in range(13)]]
    card(uid('Hammock'), sag + [(x, z + 0.22 + 0.12 * math.sin((x - 2.8) / 2.1 * math.pi)) for x, z in reversed(sag)], 4.8, pmat('Hammock', '#c8303a', unlit=True, mottle=0.1))
    for k in range(6):
        card(uid('HamStripe'), [(3.0 + k * 0.33, 0.9), (3.1 + k * 0.33, 0.9), (3.1 + k * 0.33, 1.25), (3.0 + k * 0.33, 1.25)], 4.79, pmat('HamStripe', '#e8c23a', unlit=True, mottle=0))
    tall_tiki(-4.6, 4.8, 2.4, 'day', s=0.75, feathers=True)
    tall_tiki(4.6, 1.8, 2.2, 'day', s=0.7)
    hay_pile(-4.2, 0.7, 'day', s=1.3, seed=1)
    hay_pile(4.0, 0.6, 'day', s=1.2, seed=2)
    for x in (-1.6, 0.0, 1.6):
        stand(x, 2.2)
    room_light(azimuth=-30, elevation=60, energy=3.0)
    paint_sky('#c8b890', '#c8b890')
    tv_camera((0.0, -1.6, 1.7), (0, D, 1.9), lens=21)


# ── t2: a third team's camp in the bamboo grove ───────────────────────
def bamboo_lean_to(x, y, tod, s=1.0):
    """A lean-to: a crossbar on two tall posts at the back, a roof of bamboo poles side by side sloping
    down from it toward the fire, palm leaves laid over the top, bedrolls under it."""
    tilt = 34
    L = 3.6 * s
    cy, cz = y + 0.2 * s, 1.55 * s          # the roof's middle: high at the back (y + 1.7), low at the front
    pbox('LeanRoof', (5.2 * s, L, 0.1 * s), (x, cy, cz), '#9ab84a', tod, shade='#6a8a32', mottle=0.2, rot=(tilt, 0, 0))
    for k in range(13):
        pbox('LeanPole', (0.17 * s, L + 0.3 * s, 0.17 * s), (x - 2.45 * s + k * 0.41 * s, cy - 0.04 * s, cz + 0.08 * s), '#a8cc5a', tod, rot=(tilt, 0, 0))
    pbox('LeanBar', (5.8 * s, 0.2 * s, 0.2 * s), (x, y + 1.7 * s, 2.6 * s), '#5a8a32', tod)
    for sd in (-1, 1):
        pbox('LeanPost', (0.22 * s, 0.22 * s, 2.7 * s), (x + sd * 2.7 * s, y + 1.7 * s, 1.35 * s), '#5a8a32', tod)
    for k in range(3):
        pbox('LeanLeaf', (1.7 * s, 0.7 * s, 0.05), (x - 1.6 * s + k * 1.6 * s, cy + 0.5 * s, cz + 0.5 * s), '#3a8a3a' if k % 2 else '#4a9a3a', tod, rot=(tilt, 0, 12 - k * 12))
    for k, c in enumerate(('#c8303a', '#e8c23a')):
        pbox('Bedroll', (0.7 * s, 1.5 * s, 0.14 * s), (x - 1.0 * s + k * 1.6 * s, y + 0.9 * s, 0.07 * s), c, tod)


def _grove_camp(tod, cam):
    paint_mode()
    paint_sky(N('#8ae0b0', tod), N('#d8f0a0', tod))
    ground_plane(N('#6a8a3a', tod), N('#5a7a32', tod), mottle=0.3)
    for k, (y, c, h) in enumerate(((34, '#a8d890', (14, 18)), (28, '#8ac870', (13, 17)), (22, '#7ab83a', (12, 16)), (16, '#6aa83a', (11, 15)))):
        bamboo_stand(-30, 30, y, tod, n=26 - k * 3, h=h, s=1.4 - k * 0.05, seed=k + 40, col=c)
    for k, c in enumerate(('#5aa890', '#4a9a80')):
        ridge_card(42 - k * 4, -80, 80, 0, 8 - k * 2, N(c, tod), seed=50 + k, humps=5)
    jungle_floor_plants(tod, 12, -24, 24, seed=9)
    for (x, y) in ((-11, 3.5), (10.5, 2.5), (-14, 7)):
        leafy_plant(x, y, tod, s=1.5, seed=int(x * 3))
    bamboo_lean_to(-3.5, 7.0, tod, s=1.25)
    fire_pit(3.8, 5.0, tod, r=0.55, lit=True)
    log_seat(1.6, 5.0, tod, L=1.8)
    log_seat(6.0, 5.0, tod, L=1.8)
    team_banner(9.5, 6.4, '#d84a3a', 'leaf', tod)
    for x in (-13, 12):
        bamboo_stand(x - 1, x + 1, 2, tod, n=2, h=(12, 14), s=1.6, seed=int(x + 60), col='#3a7a3a')
    for k, (x, y) in enumerate(((-8, 3.5), (7.5, 2.6), (-0.5, 2.0))):
        flat_stone(x, y, tod, s=0.7, seed=k + 20)
    for x in (-2.5, 1.5, 5.5):
        stand(x, 3.4)
    paint_sun(azimuth=-30, elevation=50 if tod == 'day' else 30, energy=3.6 if tod == 'day' else 1.6)
    tv_camera(*cam)


def si_shelter_t2(tod):
    _grove_camp(tod, ((-2.0, -7.0, 2.0), (-2.5, 10, 2.4), 27))


def si_campfire_t2(tod):
    _grove_camp(tod, ((2.5, -6.5, 2.0), (3.0, 10, 2.2), 27))


SCENES['survival-island'].update({
    'shelter-t0': si_shelter_t0, 'campfire-t0': si_campfire_t0,
    'shelter-t1': si_shelter_t1, 'campfire-t1': si_campfire_t1,
    'shelter-t2': si_shelter_t2, 'campfire-t2': si_campfire_t2,
})
OUTDOOR['survival-island'] |= {'shelter-t0', 'campfire-t0', 'campfire-t1', 'shelter-t2', 'campfire-t2'}

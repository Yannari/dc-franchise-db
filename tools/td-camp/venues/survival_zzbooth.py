# ══════════════════════════════════════════════════════════════════════
# venues/survival_zzbooth.py — Soluna's voting booth, drawn 1:1 from DC5_Voting_Confessional
# ══════════════════════════════════════════════════════════════════════
# Laid out in the reference frame's own pixels (1600 x 900) with the vector kit (_vkit.py):
#   inside an open treehouse pavilion at night: two twisting tree-trunk posts on the left and one on
#   the right holding up a plank ceiling with dark rafters fanning out and two sagging strings of
#   warm bulbs; through the open sides the deep blue night, stars, the crescent moon in its square
#   halo, little clouds, the faint volcano, the treehouse village with lit arched doors and torches;
#   a plank walkway running back between rope-lashed railings; a ragged magenta cloth hanging on the
#   right; two big leaf-wrapped torches at the edges and two small ones out on the walkway; the
#   counter across the foreground with the angry tiki urn on it.

WOOD_L, WOOD, WOOD_D, WOOD_K = '#c8843e', '#9a5a2a', '#6a3a1a', '#3a2010'
INK = '#2a160c'


def _sky(depth=300):
    vshape('Sky', [(-60, -60), (1660, -60), (1660, 960), (-60, 960)], depth, None, grad=('#0c1c5c', '#2e5cae'))
    vstars(depth - 1, 140, (0, 0, 1600, 560), seed=5)
    # the moon: a crescent inside a tilted square of pale light
    sq = [(190, 280), (300, 195), (385, 300), (275, 385)]
    vshape('MoonHalo', sq, depth - 2, '#6a8ad8', alpha=0.35)
    vglow(290, 290, 120, depth - 2.5, '#9ab8ff', 0.5)
    crescent = [(290 + math.cos(a / 40 * 2 * math.pi) * 58, 288 + math.sin(a / 40 * 2 * math.pi) * 58) for a in range(40)]
    vshape('Moon', crescent, depth - 3, '#fff6dc')
    cut = [(318 + math.cos(a / 40 * 2 * math.pi) * 52, 262 + math.sin(a / 40 * 2 * math.pi) * 52) for a in range(40)]
    vshape('MoonCut', cut, depth - 3.5, '#1a2e78')
    for (cx, cy, s) in ((300, 186, 1.0), (1238, 240, 1.2), (1500, 160, 0.8), (560, 140, 0.7)):
        puffs = [(cx - 50 * s, cy + 8 * s), (cx - 38 * s, cy - 6 * s), (cx - 18 * s, cy - 16 * s), (cx + 6 * s, cy - 22 * s), (cx + 26 * s, cy - 12 * s), (cx + 46 * s, cy - 4 * s), (cx + 56 * s, cy + 8 * s)]
        vshape('Cloud', puffs, depth - 4, '#3a6ac8', k=5)
        vshape('CloudUnder', [(cx - 50 * s, cy + 8 * s), (cx + 56 * s, cy + 8 * s), (cx + 40 * s, cy + 2 * s), (cx - 40 * s, cy + 2 * s)], depth - 4.5, '#2a52a8')


def _village(depth=150):
    # the faint volcano and the hills behind the village
    vshape('Volcano', [(560, 640), (740, 270), (800, 250), (860, 270), (1060, 640)], 260, None, grad=('#3a5aa0', '#2a4a8a'))
    vshape('HillsFar', [(-20, 640), (-20, 430), (120, 380), (260, 420), (420, 360), (560, 440), (760, 420), (980, 450), (1180, 400), (1380, 430), (1620, 380), (1620, 640)], 220, '#2a3a7a', k=4)
    vshape('Hills', [(-20, 660), (-20, 470), (90, 440), (200, 470), (300, 430), (430, 470), (560, 500), (700, 480), (860, 500), (1000, 470), (1150, 500), (1300, 470), (1450, 500), (1620, 470), (1620, 660)], 200, '#352c6a', k=4)
    # dome-tree silhouettes and palms
    rnd = random.Random(3)
    for k in range(16):
        x = 20 + k * 100 + rnd.uniform(-20, 20); y = 470 + rnd.uniform(-30, 30); r = rnd.uniform(28, 46)
        vshape('Dome', [(x - r, y), (x - r * 0.9, y - r * 0.5), (x - r * 0.5, y - r * 0.85), (x, y - r * 0.95), (x + r * 0.5, y - r * 0.85), (x + r * 0.9, y - r * 0.5), (x + r, y)], 180, '#1e3a5a', k=3)
        vshape('DomeStem', [(x - 3, y), (x + 3, y), (x + 2, y + 70), (x - 2, y + 70)], 180.5, '#1a2a44')
    # huts with conical roofs and lit arched doors (left of the post, and far right)
    for (hx, hy, s) in ((285, 470, 1.0), (175, 515, 0.7), (640, 520, 0.6), (1300, 600, 0.7), (1410, 640, 0.6)):
        vshape('HutWall', [(hx - 70 * s, hy + 70 * s), (hx + 70 * s, hy + 70 * s), (hx + 60 * s, hy), (hx - 60 * s, hy)], depth, '#4a3a6a')
        vshape('HutRoof', [(hx - 95 * s, hy + 5 * s), (hx, hy - 105 * s), (hx + 95 * s, hy + 5 * s)], depth - 0.5, '#2e2a52', k=0)
        vshape('HutRoofShade', [(hx, hy - 105 * s), (hx + 95 * s, hy + 5 * s), (hx + 20 * s, hy + 5 * s)], depth - 0.6, '#262046')
        for dx in (-25, 20):
            door = [(hx + dx * s - 13 * s, hy + 68 * s), (hx + dx * s + 13 * s, hy + 68 * s), (hx + dx * s + 13 * s, hy + 42 * s), (hx + dx * s, hy + 30 * s), (hx + dx * s - 13 * s, hy + 42 * s)]
            vshape('HutDoor', door, depth - 0.7, '#ffd65a', k=0)
            vglow(hx + dx * s, hy + 52 * s, 40 * s, depth - 0.8, '#ffcf4a', 0.45)
    # little torches around the village
    for (tx, ty) in ((255, 470), (390, 470), (1450, 580), (100, 560), (620, 520)):
        vshape('VTorchPole', [(tx - 2, ty), (tx + 2, ty), (tx + 2, ty + 50), (tx - 2, ty + 50)], depth - 1, '#2a1a20')
        vshape('VTorchFlame', [(tx - 5, ty), (tx, ty - 16), (tx + 5, ty)], depth - 1.1, '#ffd65a')
        vglow(tx, ty - 6, 22, depth - 1.2, '#ffb84a', 0.5)


def _walkway(depth=40):
    # the plank walkway running back from the platform toward the village
    vshape('Walk', [(560, 700), (1100, 700), (960, 600), (720, 600)], depth, None, grad=('#5a3a2a', '#8a5a32'))
    for k in range(9):
        y0 = 600 + k * 11; y1 = y0 + 9
        lx = 720 - (y0 - 600) * 1.6; rx = 960 + (y0 - 600) * 1.4
        vline('WalkSeam', [(lx, y0), (rx, y0)], depth - 0.2, '#4a2a1a', w=1.6)
    # rope-lashed railings both sides: posts, two rails, X lashings
    for side in (-1, 1):
        if side < 0:
            posts = [(150, 640), (300, 628), (430, 618), (560, 608), (660, 600)]
        else:
            posts = [(1480, 735), (1380, 700), (1290, 672), (1200, 650), (1110, 632), (1030, 615)]
        for (x, y) in posts:
            h = 70 if side < 0 else 90 * (1 - (1480 - x) / 900)
            h = max(h, 40)
            vshape('RailPost', [(x - 4, y + h * 0.3), (x + 4, y + h * 0.3), (x + 4, y - h), (x - 4, y - h)], depth - 1, '#3a2418', line=INK, lw=1.2)
        for off in (0.0, 0.55):
            pts = [(x, y - (70 if side < 0 else max(40, 90 * (1 - (1480 - x) / 900))) * (1 - off)) for (x, y) in posts]
            vline('Rail', pts, depth - 1.2, '#4a2e1c', w=4)
        for i in range(len(posts) - 1):
            (x0, y0), (x1, y1) = posts[i], posts[i + 1]
            h0 = 70 if side < 0 else max(40, 90 * (1 - (1480 - x0) / 900)); h1 = 70 if side < 0 else max(40, 90 * (1 - (1480 - x1) / 900))
            vline('Lash', [(x0, y0 - h0), (x1, y1 - h1 * 0.45)], depth - 1.3, '#5a4a3a', w=2)
            vline('Lash', [(x0, y0 - h0 * 0.45), (x1, y1 - h1)], depth - 1.3, '#5a4a3a', w=2)


def _floor(depth=10):
    # the pavilion's plank floor between the posts, lit warm near the torches
    vshape('Floor', [(-20, 790), (1620, 790), (1460, 690), (140, 690)], depth, None, grad=('#7a4a28', '#a8683a'))
    for k in range(7):
        y = 698 + k * 14
        vline('FloorSeam', [(140 - (y - 690) * 1.5, y), (1460 + (y - 690) * 1.5, y)], depth - 0.1, '#5a321a', w=1.6)
    vglow(110, 740, 260, depth - 0.2, '#ff9a3a', 0.35)
    vglow(1500, 740, 260, depth - 0.2, '#ff9a3a', 0.35)


def _trunk(name, pts, depth, lit_side=-1, k=5):
    """A twisting tree-trunk post: the trunk, a shade down one side, a warm highlight down the other,
    bark lines, a dark outline."""
    vshape(name, pts, depth, WOOD, line=INK, lw=3.0, k=k)
    xs = [p[0] for p in pts]; ys = [p[1] for p in pts]
    return xs, ys


def _posts(depth=12):
    # left trunk A: from the floor at the far left, curving up out of frame, a branch to the left
    _trunk('TrunkA', [(60, 900), (190, 900), (175, 760), (150, 600), (140, 420), (150, 300), (190, 170), (240, 60), (270, -20), (200, -20), (160, 60), (110, 160),
                      (80, 260), (60, 400), (70, 560), (80, 740)], depth)
    vshape('TrunkAShade', [(150, 900), (190, 900), (175, 760), (150, 600), (140, 420), (150, 300), (190, 170), (240, 60), (270, -20), (250, -20), (200, 70), (160, 180), (130, 320), (125, 480), (140, 640), (160, 800)],
           depth - 0.1, '#7a4220', k=5)
    vshape('TrunkAHi', [(78, 860), (95, 860), (95, 700), (88, 520), (90, 380), (110, 250), (140, 160), (128, 160), (100, 250), (75, 380), (72, 540), (80, 720)], depth - 0.12, '#d8904a', k=5)
    # left trunk B: the forked post in the middle-left, its two branches up into the roof
    vshape('TrunkB', [(540, 720), (640, 720), (610, 600), (580, 480), (570, 380), (620, 250), (700, 120), (760, 30), (720, 20), (640, 120), (575, 230), (540, 300),
                      (500, 220), (440, 120), (400, 20), (360, 30), (410, 150), (470, 280), (510, 380), (520, 520), (530, 640)], depth + 2, WOOD, line=INK, lw=3.0, k=4)
    vshape('TrunkBShade', [(600, 720), (640, 720), (610, 600), (580, 480), (570, 380), (620, 250), (700, 120), (760, 30), (740, 25), (660, 140), (590, 260), (560, 380), (565, 520), (585, 640)],
           depth + 1.9, '#7a4220', k=4)
    vshape('TrunkBHi', [(540, 700), (552, 700), (545, 560), (532, 430), (515, 360), (470, 260), (420, 150), (410, 150), (455, 270), (505, 380), (525, 520)], depth + 1.88, '#d8904a', k=4)
    # right trunk: a thick straight post at the right edge
    vshape('TrunkR', [(1460, 900), (1620, 900), (1620, -20), (1500, -20), (1470, 120), (1490, 300), (1470, 500), (1455, 700)], depth, WOOD, line=INK, lw=3.0, k=4)
    vshape('TrunkRShade', [(1560, 900), (1620, 900), (1620, -20), (1560, -20), (1555, 200), (1570, 400), (1560, 650)], depth - 0.1, '#7a4220', k=4)
    vshape('TrunkRHi', [(1470, 860), (1485, 860), (1488, 600), (1500, 350), (1488, 150), (1478, 150), (1478, 350), (1470, 600)], depth - 0.12, '#e09a52', k=4)
    # bark lines
    for (pts, d) in (([(100, 820), (110, 640), (100, 480), (118, 330)], depth - 0.15), ([(560, 690), (552, 560), (540, 440)], depth + 1.85),
                     ([(1520, 860), (1530, 640), (1522, 420), (1532, 200)], depth - 0.15), ([(150, 700), (138, 560)], depth - 0.15)):
        vline('Bark', pts, d, '#5a3018', w=2.4, k=4)


def _roof(depth=20):
    # the plank ceiling seen from below: a wide fan of planks above a curved lower edge
    edge = [(-40, 210), (200, 200), (420, 214), (640, 232), (820, 238), (1000, 226), (1220, 200), (1420, 180), (1640, 168)]
    vshape('Ceiling', [(-40, -60), (1640, -60)] + edge[::-1], depth, None, grad=('#6a3a1c', '#b8743a'), k=0)
    # planks: lighter strips between rafters
    for k in range(13):
        a0 = -0.9 + k * 0.15
        x0 = 800 + math.sin(a0) * 2400
        vline('PlankSeam', [(800, -380), (x0, 260)], depth - 0.2, '#8a5228', w=2.0)
    # rafters: dark beams radiating from the peak above the frame
    for a in (-0.78, -0.5, -0.24, 0.02, 0.27, 0.52, 0.8):
        x1 = 800 + math.sin(a) * 2400
        bw = 16
        vshape('Rafter', [(800 - 6, -380), (800 + 6, -380), (x1 + bw, 260), (x1 - bw, 260)], depth - 0.4, '#4a2812', line=INK, lw=1.5)
    # the cross beam along the lower edge
    vshape('EdgeBeam', [(p[0], p[1] - 14) for p in edge] + [(p[0], p[1] + 8) for p in edge[::-1]], depth - 0.6, '#5a3016', line=INK, lw=2.0)
    # two sagging strings of bulbs
    for (pts, n) in (([(-20, 20), (300, 70), (620, 115), (900, 120), (1200, 80), (1620, -10)], 14), ([(240, 214), (520, 226), (800, 236), (1100, 226), (1400, 190)], 11)):
        P = smooth(pts, 8, closed=False)
        vline('Wire', P, depth - 0.8, '#2a1a10', w=2.0)
        L = len(P)
        for i in range(n):
            q = P[int((i + 0.5) / n * (L - 1))]
            vglow(q[0], q[1] + 8, 30, depth - 0.85, '#ffe08a', 0.55)
            vdisc('Bulb', q[0], q[1] + 7, 7, depth - 0.9, '#fff6c0')


def _cloth(depth=24):
    """The ragged magenta cloth hanging on the right, holes torn through it."""
    out = [(1230, 205), (1460, 182), (1462, 300), (1455, 420), (1462, 520), (1440, 548), (1425, 600), (1408, 560), (1390, 610), (1372, 570), (1350, 640),
           (1330, 590), (1312, 615), (1296, 560), (1270, 600), (1252, 540), (1235, 520), (1228, 400)]
    vshape('Cloth', out, depth, None, grad=('#c84a7a', '#a83a6a'))
    vshape('ClothShade', [(1380, 205), (1460, 182), (1462, 300), (1455, 420), (1462, 520), (1440, 548), (1425, 600), (1408, 560), (1395, 400), (1385, 300)], depth - 0.1, '#9a2e62')
    for hole in ([(1350, 300), (1375, 285), (1392, 320), (1380, 360), (1372, 340), (1356, 352)], [(1290, 410), (1312, 400), (1318, 440), (1300, 470), (1288, 440)],
                 [(1400, 470), (1420, 462), (1424, 500), (1410, 520)]):
        vshape('ClothHole', hole, depth - 0.2, '#1e3a8a')
    vline('ClothRod', [(1220, 200), (1470, 178)], depth - 0.3, '#3a2010', w=6)


def _torch(cx, top, s, depth, flip=1):
    """A DC5 tiki torch, read off the frame (left torch: cup 290-350, fronds 360-480, band 480-525,
    leaves 525-680): a short dark tapered cup with a lip, a big two-tone flame above it; under the cup
    a fan of grass fronds rising from the band; the band wrapped purple, gold, purple; a skirt of long
    pointed leaves hanging down from it; the pole below."""
    o = top
    # the pole
    vshape('TorchPole', [(cx - 9 * s, o + 380 * s), (cx + 9 * s, o + 380 * s), (cx + 9 * s, o + 900 * s), (cx - 9 * s, o + 900 * s)], depth + 0.3, '#3a2214', line=INK, lw=2)
    # leaves hanging down from the band, long and pointed, two tones and a midrib
    for k in range(8):
        a = math.radians(-58 + k * 16.5)
        bx = cx + math.sin(a) * 38 * s; by = o + 232 * s
        L = (150 - abs(k - 3.5) * 10) * s
        tipx = cx + math.sin(a) * (38 * s + L * 0.75); tipy = by + math.cos(a) * L
        mx, my = (bx + tipx) / 2, (by + tipy) / 2
        nx, ny = -(tipy - by), (tipx - bx); ln = math.hypot(nx, ny) or 1; nx, ny = nx / ln * 17 * s, ny / ln * 17 * s
        leaf = [(bx, by), (mx + nx, my + ny), (tipx, tipy), (mx - nx, my - ny)]
        col, dark = (('#8ac83e', '#5a9a2a'), ('#7ab836', '#4a8a24'), ('#9ad24a', '#6aa82e'))[k % 3]
        vshape('TLeaf', leaf, depth + 0.12 - k * 0.003, col, line='#2a4a14', lw=1.6, k=4)
        vshape('TLeafDark', [(bx, by), (mx + nx, my + ny), (tipx, tipy)], depth + 0.118 - k * 0.003, dark, k=0)
        vline('TLeafVein', [(bx, by), (tipx, tipy)], depth + 0.116 - k * 0.003, '#3e7420', w=1.4 * s + 0.6)
    # the band: purple, gold, purple, slightly bulging
    for (y0, y1, c) in ((o + 190 * s, o + 206 * s, '#7a3aa8'), (o + 206 * s, o + 222 * s, '#e8c23a'), (o + 222 * s, o + 236 * s, '#7a3aa8')):
        vshape('TBand', [(cx - 40 * s, y0), (cx + 40 * s, y0), (cx + 42 * s, (y0 + y1) / 2), (cx + 40 * s, y1), (cx - 40 * s, y1), (cx - 42 * s, (y0 + y1) / 2)], depth - 0.05, c, line=INK, lw=1.4)
    # the fan of grass fronds between the cup and the band, rising and spreading
    for k in range(11):
        t = k / 10
        x0 = cx - 32 * s + t * 64 * s
        x1 = cx - 58 * s + t * 116 * s; y1 = o + (70 + abs(t - 0.5) * 30) * s
        col = ('#a8d85a', '#8ac83e', '#b8e06a', '#7ab836')[k % 4]
        vshape('TFrond', [(x0 - 4 * s, o + 192 * s), (x0 + 4 * s, o + 192 * s), (x1 + 5 * s, y1 + 8 * s), (x1, y1), (x1 - 5 * s, y1 + 8 * s)], depth + 0.06 - k * 0.002, col, line='#2a4a14', lw=1.0)
    # the cup: a short tapered block under a wider lip
    vshape('TCup', [(cx - 68 * s, o + 8 * s), (cx + 68 * s, o + 8 * s), (cx + 46 * s, o + 70 * s), (cx - 46 * s, o + 70 * s)], depth - 0.1, '#5a3418', line=INK, lw=2.5)
    vshape('TCupShade', [(cx + 12 * s, o + 8 * s), (cx + 68 * s, o + 8 * s), (cx + 46 * s, o + 70 * s), (cx + 8 * s, o + 70 * s)], depth - 0.15, '#3e2210')
    vshape('TCupHi', [(cx - 62 * s, o + 12 * s), (cx - 48 * s, o + 12 * s), (cx - 34 * s, o + 66 * s), (cx - 42 * s, o + 66 * s)], depth - 0.16, '#7a4a22')
    vshape('TCupLip', [(cx - 74 * s, o - 6 * s), (cx + 74 * s, o - 6 * s), (cx + 70 * s, o + 12 * s), (cx - 70 * s, o + 12 * s)], depth - 0.2, '#6a3e1c', line=INK, lw=2)
    # the flame: a broad yellow body licking up in tongues, an orange heart, a pale core
    f = flip
    outer = [(cx - 64 * s, o), (cx - 74 * s, o - 50 * s), (cx - 52 * s, o - 40 * s), (cx - 58 * s, o - 110 * s), (cx - 24 * s * f, o - 80 * s),
             (cx - 10 * s * f, o - 175 * s), (cx + 18 * s * f, o - 100 * s), (cx + 46 * s, o - 140 * s), (cx + 48 * s, o - 60 * s), (cx + 72 * s, o - 66 * s), (cx + 64 * s, o)]
    vglow(cx, o - 70 * s, 230 * s, depth - 0.25, '#ffb43a', 0.55)
    vshape('Flame', outer, depth - 0.3, '#ffd23a', k=3)
    vshape('FlameHi', [(cx - 50 * s, o - 10 * s), (cx - 56 * s, o - 80 * s), (cx - 34 * s, o - 50 * s), (cx - 30 * s, o - 10 * s)], depth - 0.31, '#ffe880', k=3)
    inner = [(cx - 36 * s, o), (cx - 32 * s, o - 46 * s), (cx - 10 * s, o - 28 * s), (cx + 2 * s * f, o - 92 * s), (cx + 22 * s, o - 40 * s), (cx + 38 * s, o - 54 * s), (cx + 36 * s, o)]
    vshape('FlameHeart', inner, depth - 0.32, '#f59a2a', k=3)
    vshape('FlameCore', [(cx - 14 * s, o), (cx - 4 * s, o - 32 * s), (cx + 12 * s, o - 16 * s), (cx + 16 * s, o)], depth - 0.34, '#fff2b0', k=3)


def _counter(depth=2.0):
    # the counter across the foreground: a top plank with a lit edge, the dark face below
    vshape('CounterTop', [(-20, 778), (1620, 778), (1620, 806), (-20, 806)], depth, None, grad=('#b0703a', '#8a5228'), line=INK, lw=2.5)
    vshape('CounterLip', [(-20, 778), (1620, 778), (1620, 786), (-20, 786)], depth - 0.05, '#d08a48')
    vshape('CounterFace', [(-20, 806), (1620, 806), (1620, 920), (-20, 920)], depth + 0.02, None, grad=('#6a3a1c', '#4a2812'))
    for x in (260, 560, 860, 1160, 1420):
        vline('FaceSeam', [(x, 810), (x - 6, 920)], depth - 0.05, '#3a1e0e', w=2.0)
    vglow(130, 820, 220, depth - 0.1, '#ff9a3a', 0.4)
    vglow(1490, 820, 220, depth - 0.1, '#ff9a3a', 0.4)


def _urn(depth=1.6):
    """The angry tiki urn: a glazed brown jar, a purple headband with a gold zigzag and a sun jewel,
    a heavy V of brows, white slanted eyes, a gaping mouth full of square teeth."""
    cx = 390
    body = [(cx - 52, 540), (cx + 52, 540), (cx + 62, 572), (cx + 96, 640), (cx + 108, 700), (cx + 98, 748), (cx + 64, 778), (cx - 64, 778), (cx - 98, 748), (cx - 108, 700), (cx - 96, 640), (cx - 62, 572)]
    vshape('Urn', body, depth, None, grad=('#b8742e', '#8a4c1c'), line=INK, lw=3.0, k=3)
    vshape('UrnShade', [(cx + 30, 572), (cx + 62, 572), (cx + 96, 640), (cx + 108, 700), (cx + 98, 748), (cx + 64, 778), (cx + 20, 778), (cx + 60, 740), (cx + 74, 690), (cx + 66, 630)], depth - 0.02, '#7a3e14', k=3)
    vshape('UrnHi', [(cx - 82, 650), (cx - 70, 630), (cx - 66, 700), (cx - 74, 742), (cx - 88, 720)], depth - 0.03, '#d8964a', k=3)
    vshape('UrnRim', [(cx - 66, 526), (cx + 66, 526), (cx + 60, 548), (cx - 60, 548)], depth - 0.04, '#9a5a24', line=INK, lw=2.5, k=0)
    vshape('UrnMouthTop', [(cx - 54, 524), (cx + 54, 524), (cx + 48, 532), (cx - 48, 532)], depth - 0.05, '#3a1e0e')
    # headband
    band = [(cx - 88, 592), (cx + 88, 592), (cx + 92, 618), (cx - 92, 618)]
    vshape('Band', band, depth - 0.06, '#6a3a9a', line=INK, lw=2.0)
    zig = []
    for i in range(13):
        x = cx - 84 + i * 14; zig.append((x, 597 if i % 2 == 0 else 612))
    vline('BandZig', zig, depth - 0.07, '#e8c23a', w=4)
    # the sun jewel
    vglow(cx - 12, 598, 46, depth - 0.075, '#ffe07a', 0.6)
    for kk in range(12):
        a = kk / 12 * 2 * math.pi
        r1, r2 = 16, 30 if kk % 2 == 0 else 22
        vshape('SunRay', [(cx - 12 + math.cos(a - 0.12) * r1, 598 + math.sin(a - 0.12) * r1), (cx - 12 + math.cos(a) * r2, 598 + math.sin(a) * r2), (cx - 12 + math.cos(a + 0.12) * r1, 598 + math.sin(a + 0.12) * r1)],
               depth - 0.08, '#f2c83a')
    vdisc('Jewel', cx - 12, 598, 14, depth - 0.09, '#fff0a0', line=INK, lw=1.5)
    # brows: a heavy V
    vshape('BrowL', [(cx - 88, 626), (cx - 4, 652), (cx - 10, 664), (cx - 90, 640)], depth - 0.1, '#2a140a', k=0)
    vshape('BrowR', [(cx + 88, 626), (cx + 4, 652), (cx + 10, 664), (cx + 90, 640)], depth - 0.1, '#2a140a', k=0)
    # eyes: white slanted crescents with a dark rim
    vshape('EyeL', [(cx - 82, 646), (cx - 14, 664), (cx - 30, 690), (cx - 62, 688), (cx - 82, 668)], depth - 0.11, '#f6f0e0', line=INK, lw=2.2, k=3)
    vshape('EyeR', [(cx + 82, 646), (cx + 14, 664), (cx + 30, 690), (cx + 62, 688), (cx + 82, 668)], depth - 0.11, '#f6f0e0', line=INK, lw=2.2, k=3)
    # nose bridge and cheek lines
    vline('Nose', [(cx - 8, 666), (cx - 14, 700), (cx + 14, 700), (cx + 8, 666)], depth - 0.11, '#5a2e12', w=3)
    vline('CheekL', [(cx - 92, 700), (cx - 78, 724)], depth - 0.11, '#5a2e12', w=3)
    vline('CheekR', [(cx + 92, 700), (cx + 78, 724)], depth - 0.11, '#5a2e12', w=3)
    # the mouth: a wide dark slot, lips, a row of teeth top and bottom
    mouth = [(cx - 80, 708), (cx + 80, 708), (cx + 86, 728), (cx + 70, 756), (cx - 70, 756), (cx - 86, 728)]
    vshape('Lips', grow(mouth, 6), depth - 0.12, '#a85a24', line=INK, lw=2.5)
    vshape('Mouth', mouth, depth - 0.13, '#3a140a', k=0)
    for i in range(7):
        x = cx - 66 + i * 22
        vshape('ToothT', [(x - 9, 711), (x + 9, 711), (x + 9, 726), (x - 9, 726)], depth - 0.14, '#f6f0e0', line=INK, lw=1.2)
    for i in range(6):
        x = cx - 55 + i * 22
        vshape('ToothB', [(x - 9, 740), (x + 9, 740), (x + 9, 753), (x - 9, 753)], depth - 0.14, '#f6f0e0', line=INK, lw=1.2)


def si_voting_booth_1to1(tod):
    paint_mode(); tod = 'night'
    paint_sky('#0c1c5c', '#0c1c5c')
    _sky()
    _village()
    _walkway()
    _torch(1204, 398, 0.45, 34)
    _torch(352, 424, 0.45, 34)
    _floor()
    _cloth()
    _roof()
    _posts()
    _torch(86, 292, 1.0, 5.0)
    _torch(1530, 354, 1.0, 5.0, flip=-1)
    _counter()
    _urn()
    vmark_stand((900, 660), 1.2)
    vmark_stand((1080, 660), 1.2)
    vcam()


SCENES['survival-island']['voting-booth'] = si_voting_booth_1to1
NIGHT_ONLY.add('voting-booth')
OUTDOOR['survival-island'].discard('voting-booth')

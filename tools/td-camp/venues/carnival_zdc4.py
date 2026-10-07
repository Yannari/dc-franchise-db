# ══════════════════════════════════════════════════════════════════════
# venues/carnival_zdc4.py — Stawaki's places copied from Disventure Camp 4's own frames
# ══════════════════════════════════════════════════════════════════════
# From the stills the user sent and the DC4 galleries on the Disventure Camp wiki:
#   confessional   Stawaki_Carnival_Confessional_V2: a stump in the pines beside a torn red-and-grey
#                  tent, red pennants and bulbs strung across, purple misty hills, a dusk-lavender sky
#   voting-booth   Voting_Confessional_StawakiCarnival: the clown urn on a wooden counter between two
#                  striped torches, the camp's tents, string lights and pines behind under the moon
#   theater-tent   Stawaki_Theater: the THEATER marquee on a truss over a striped tent, spotlights
#                  sweeping the sky, bulbs along the canvas, the coaster and the wheel either side
#   exit           Boat_of_Losers: the red boat with its striped cabin and clown flag at a little dock
#                  lit by torches
# The carousel (Carousel) joins the midway on the map.

def pennants(x0, x1, y, z, tod, n=12, sag=0.8):
    for i in range(n):
        t = (i + 0.5) / n; x = x0 + (x1 - x0) * t; zz = z - sag * 4 * t * (1 - t)
        if i % 2 == 0:
            card(uid('Pennant'), [(-0.3, 0), (0.3, 0), (0, -0.7)], y, pmat('Pennant' + tod, N('#c8402a', tod), unlit=True, mottle=0), x=x, z=zz)
        else:
            card(uid('PBulb'), _blob_pts(0.18, 0.18, 10, 0, 0), y, pmat('PBulb' + tod, '#f2e8b0' if tod == 'day' else '#ffe28a', unlit=True, mottle=0), x=x, z=zz - 0.15)
    pbox('PennantLine', (x1 - x0, 0.02, 0.02), ((x0 + x1) / 2, y + 0.01, z - sag * 0.9), '#2a2a2a', tod, ink=False)


def cv_confessional_dc4(tod):
    paint_mode()
    paint_sky(*(('#9a8ad8', '#e8d0e8') if tod == 'day' else ('#1c2452', '#33407a')))
    for k, (col, a) in enumerate((('#a090c8', 1.0), ('#8a7ab8', 1.0), ('#c8b8e0', 0.5))):
        ridge_card(70 - k * 12, -120, 120, 1 + k, 12 - k * 3, N(col, tod), seed=110 + k, humps=6, teeth=60, tooth_col=N(_mix_hex(col, '#2a2a4a', 0.1), tod), alpha=a)
    ground_plane(N('#5a6a3a', tod), N('#4a5a32', tod), mottle=0.3)
    rnd = random.Random(8)
    for k in range(8):
        mossy_pine(-12 + k * 3.6 + rnd.uniform(-0.5, 0.5), 14 + rnd.uniform(0, 4), rnd.uniform(13, 17), tod, seed=k * 11 + 3, s=1.5)
    for (x, y) in ((4.5, 6.5), (-6.0, 9.0)):
        mossy_pine(x, y, 16, tod, seed=int(x * 7 + 50), s=1.8)
    for (x, y) in ((2.5, 9.0), (5.5, 11.0)):
        pcyl('Stump', 0.5, 0.5, (x, y, 0.25), '#7a4a32', tod, verts=10)
    cv_bush(-3.5, 10.0, tod, s=1.5, col='#6a6aa8')
    # the torn tent filling the left of the frame
    for k in range(5):
        c = '#a82a2a' if k % 2 == 0 else '#c8c0c8'
        card(uid('TentPanel'), [(0, 0), (1.2, 0), (0.6, 6.5), (0.2, 6.5)], 2.0 - k * 0.02, pmat('TentPanel' + c + tod, N(c, tod), unlit=True, mottle=0.15), x=-6.8 + k * 0.9, z=0)
    for k in range(6):
        card(uid('TentTear'), [(0, 0), (0.25, 0), (0.12, -0.55)], 1.85, pmat('TentTear' + tod, N('#d8d0d8', tod), unlit=True, mottle=0), x=-6.4 + k * 0.6, z=1.6 + (k % 2) * 0.4)
    pennants(-7.0, 7.0, 2.4, 5.6, tod, n=14, sag=0.9)
    # the stump seat
    pcyl('ConfStump', 0.55, 0.8, (0.6, 4.4, 0.4), '#7a4e32', tod, verts=14)
    pcyl('ConfStumpTop', 0.53, 0.03, (0.6, 4.4, 0.81), '#c8955a', tod, verts=14, ink=False)
    cv_bush(3.6, 4.0, tod, s=1.0, col='#c8a03a')
    for x in (0.6,):
        stand(x, 4.4)
    stand(-0.8, 4.0)
    paint_sun(azimuth=-30, elevation=45 if tod == 'day' else 28, energy=3.6 if tod == 'day' else 1.6)
    tv_camera((0, -4.0, 1.9), (0, 12, 3.0), lens=26)


def clown_urn(x, y, z, tod, s=1.0):
    """The DC4 voting urn: a brown jar banded blue and red, a clown face with red tufts of hair."""
    pcyl('Urn', 0.62 * s, 1.0 * s, (x, y, z + 0.5 * s), '#6a4a3a', tod, r2=0.48 * s, verts=18)
    pcyl('UrnNeck', 0.42 * s, 0.25 * s, (x, y, z + 1.12 * s), '#5a3a2a', tod, verts=18)
    for (zz, c) in ((0.25, '#c8302a'), (0.36, '#2a4a9a'), (0.47, '#c8302a')):
        pcyl('UrnBand', 0.64 * s, 0.1 * s, (x, y, z + zz * s), c, tod, verts=18, ink=False)
    fy = y - 0.6 * s
    card(uid('UrnFace'), _blob_pts(0.32 * s, 0.3 * s, 16, 0, 0), fy, pmat('UrnFaceW' + tod, N('#f6f0e4', tod), unlit=True, mottle=0), x=x, z=z + 0.6 * s)
    for sd in (-1, 1):
        card(uid('UrnHair'), _blob_pts(0.2 * s, 0.22 * s, 12, 0.3, sd + 5), fy + 0.01, pmat('UrnHair' + tod, N('#d8302a', tod), unlit=True, mottle=0), x=x + sd * 0.4 * s, z=z + 0.68 * s)
        card(uid('UrnEye'), _blob_pts(0.04 * s, 0.04 * s, 8, 0, 0), fy - 0.01, pmat('UrnEye', '#1a1a1a', unlit=True, mottle=0), x=x + sd * 0.1 * s, z=z + 0.68 * s)
    card(uid('UrnNose'), _blob_pts(0.06 * s, 0.06 * s, 10, 0, 0), fy - 0.02, pmat('UrnNose' + tod, N('#d8302a', tod), unlit=True, mottle=0), x=x, z=z + 0.6 * s)
    card(uid('UrnSmile'), [(-0.14 * s, 0), (0.14 * s, 0), (0.08 * s, -0.06 * s), (-0.08 * s, -0.06 * s)], fy - 0.02, pmat('UrnSmile' + tod, N('#a82a2a', tod), unlit=True, mottle=0), x=x, z=z + 0.5 * s)


def cv_voting_booth_dc4(tod):
    paint_mode(); tod = 'night'
    paint_sky('#1c2a6a', '#2a3a8a')
    card(uid('Moon'), [(math.cos(a / 30 * 6.28) * 1.8, math.sin(a / 30 * 6.28) * 1.8) for a in range(30)], 60, pmat('MoonB', '#f6f2e0', unlit=True, mottle=0), x=-1.5, z=14)
    card(uid('MoonCut'), [(math.cos(a / 30 * 6.28) * 1.6, math.sin(a / 30 * 6.28) * 1.6) for a in range(30)], 59.9, pmat('MoonCutB', '#1c2a6a', unlit=True, mottle=0), x=-0.8, z=14.5)
    pine_wall(tod, 30, -40, 40, seed=31, h=(14, 18), s=1.5)
    ground_plane(N('#5a4a32', tod), N('#40362a', tod), mottle=0.3)
    for k, (x, y, r, a) in enumerate(((-7, 16, 2.6, '#2a3a8a'), (4, 15, 2.8, '#a82a2a'), (8, 18, 2.4, '#a82a2a'))):
        circus_tent(x, y, tod, r=r, h=2.2, roof=2.6, a=a)
    string_lights((-9, 12, 3.6), (10, 13, 3.6), n=30, sag=0.9, tod='night')
    pbox('Bleachers', (4, 2, 3), (11, 16, 1.5), '#8a6a3a', tod)
    film_lamp(-6.0, 9.0, tod, aim=10, h=2.6, on=False)
    for x in (-3.0, -1.0, 2.6):
        pbox('Crate', (0.8, 0.8, 0.8), (x, 10.5, 0.4), '#8a5a32', tod)
    # the counter, the urn, the striped torches
    pbox('Counter', (6.0, 1.2, 1.0), (0, 4.5, 0.5), '#6a4a2e', tod, shade='#4a3020')
    pbox('CounterTop', (6.4, 1.5, 0.16), (0, 4.5, 1.08), '#7a5636', tod)
    clown_urn(-1.8, 4.5, 1.16, tod, s=0.8)
    for x in (-3.4, 3.4):
        stripe_torch(x, 3.6, tod, h=2.6, lit=True)
    stand(0.8, 3.4)
    paint_sun(azimuth=-30, elevation=28, energy=1.6)
    tv_camera((0, -3.8, 1.8), (0, 12, 2.6), lens=26)


def cv_theater_ext(tod):
    paint_mode(); tod = 'night'
    paint_sky('#1c2452', '#2a3a7a')
    srnd = random.Random(5)
    for i in range(60):
        card(uid('Star'), _blob_pts(0.1, 0.1, 6, 0, 0), 70, pmat('StarT', '#f4f0d8', unlit=True, mottle=0), x=srnd.uniform(-50, 50), z=srnd.uniform(10, 36))
    for k, x in enumerate((-6, 2, 9)):
        card(uid('Beam'), [(-0.4, 0), (0.4, 0), (2.2 + k * 0.4, 26), (0.8, 26)], 40, pmat('BeamT', '#f2f0d0', unlit=True, mottle=0, alpha=0.18), x=x, z=0)
    pine_wall(tod, 44, -60, 60, seed=41, h=(12, 16), s=1.4)
    coaster(-26, -10, 30, tod, seed=6)
    ferris(16, 30, 7, tod, lit=False)
    ground_plane(N('#5a4a30', tod), N('#40362a', tod), mottle=0.35)
    # the main tent with its marquee, the tents around it
    striped('MainWall', 5.0, 3.2, (0, 14, 1.6), '#a82a3a', '#d8cfd8', tod, n=10)
    striped('MainRoof', 5.4, 5.0, (0, 14, 3.2 + 2.5), '#a82a3a', '#d8cfd8', tod, n=10, r2=0.1)
    card(uid('MainDoor'), [(-1.4, 0), (1.4, 0), (0.6, 2.6), (-0.6, 2.6)], 8.9, pmat('MainDoor', '#1a1418', unlit=True, mottle=0), x=0, z=0)
    for sx in (-3.2, 3.2):
        pbox('Truss', (0.15, 0.15, 9.0), (sx, 13.5, 4.5), '#2a2a32', tod)
    pbox('TrussTop', (6.6, 0.15, 0.15), (0, 13.5, 9.0), '#2a2a32', tod)
    t = ptext('THEATER', (0, 13.3, 9.9), 1.3, '#f2c83a')
    for k in range(18):
        card(uid('MarqBulb'), _blob_pts(0.08, 0.08, 8, 0, 0), 13.25, pmat('MarqBulb', '#ffe28a', unlit=True, mottle=0), x=-3.4 + k * 0.4, z=9.15 + 0.7 * math.sin(math.pi * k / 17))
    for (x, y, r) in ((-7, 16, 3.0), (7, 16, 3.0), (-11, 18, 2.4), (11.5, 19, 2.2), (-3.5, 18, 2.6), (4, 19, 2.6)):
        circus_tent(x, y, tod, r=r, h=2.0, roof=3.4, a='#a82a3a', b='#d8cfd8')
    for k in range(20):
        a = math.pi * (0.15 + 0.7 * k / 19)
        card(uid('TentBulb'), _blob_pts(0.09, 0.09, 8, 0, 0), 14 - math.sin(a) * 5.2, pmat('TentBulbT', '#ffe28a', unlit=True, mottle=0), x=math.cos(a) * -5.0, z=3.4 + (0.5 - abs(k - 9.5) / 19) * 2.0)
    for x in (-6.5, 6.5):
        striped('RopePost', 0.12, 2.0, (x, 9.0, 1.0), '#c8302a', '#efe6d6', tod, n=4)
    for (x, a) in ((-3.0, 30), (-1.0, 60), (2.0, 120), (4.0, 150)):
        pcyl('Spot', 0.3, 0.5, (x, 7.5, 0.3), '#2a2a32', tod, verts=12, rot=(60, 0, a - 90))
    for (x, y) in ((-9.0, 9.0), (9.5, 9.5)):
        pcyl('Pumpkin', 0.45, 0.36, (x, y, 0.18), '#e8782a', tod, verts=14)
    pbox('Wagon', (2.4, 1.2, 1.6), (-10.5, 11.0, 1.1), '#3a2a6a', tod)
    for x in (-1.5, 0.5, 2.5):
        stand(x, 4.2)
    paint_sun(azimuth=-30, elevation=28, energy=1.6)
    tv_camera((0, -4.5, 2.2), (0, 14, 4.2), lens=26)


def boat_of_losers(x, y, tod, s=1.0):
    """The Boat of Losers: a red hull with an anchor painted on it, life rings, a cabin with a red-and-
    white striped roof and a loudspeaker, a mast flying a clown pirate flag, bunting down the stays."""
    pbox('BoatHull', (7.0 * s, 2.6 * s, 1.8 * s), (x, y, 0.4 * s), '#a82a22', tod, shade='#7a1a18')
    card(uid('Bow'), [(0, -0.5 * s), (1.8 * s, 1.3 * s), (0, 1.3 * s)], y - 1.31 * s, pmat('BowP' + tod, N('#a82a22', tod), unlit=True, mottle=0.1), x=x + 3.5 * s, z=0)
    card(uid('Anchor'), [(-0.1, -0.4), (0.1, -0.4), (0.1, 0.4), (-0.1, 0.4)], y - 1.32 * s, pmat('AnchorP' + tod, N('#e8b03a', tod), unlit=True, mottle=0), x=x + 2.6 * s, z=0.5 * s)
    for k in range(2):
        card(uid('LifeRing'), _blob_pts(0.42 * s, 0.42 * s, 16, 0, 0), y - 1.32 * s, pmat('LifeRing' + tod, N('#f2ece0', tod), unlit=True, mottle=0), x=x - 1.0 * s + k * 1.0 * s, z=0.6 * s)
        card(uid('LifeHole'), _blob_pts(0.2 * s, 0.2 * s, 12, 0, 0), y - 1.33 * s, pmat('LifeHole' + tod, N('#a82a22', tod), unlit=True, mottle=0), x=x - 1.0 * s + k * 1.0 * s, z=0.6 * s)
    pbox('Cabin', (2.8 * s, 2.0 * s, 2.2 * s), (x + 1.0 * s, y, 2.4 * s), '#b8302a', tod)
    pbox('CabinWin', (1.0 * s, 0.05, 1.0 * s), (x + 1.5 * s, y - 1.03 * s, 2.6 * s), '#e8d88a' if tod == 'night' else '#8ad0e0', 'day', unlit=tod == 'night')
    for i in range(6):
        pbox('CabinRoof', (0.5 * s, 2.3 * s, 0.25 * s), (x - 0.2 * s + i * 0.5 * s, y, 3.6 * s), '#c8302a' if i % 2 == 0 else '#efe6d6', tod, rot=(0, 10, 0))
    pcyl('Horn', 0.3 * s, 0.6 * s, (x + 2.0 * s, y, 4.1 * s), '#9aa0a8', tod, r2=0.1 * s, verts=12, rot=(0, 90, 0))
    pcyl('Mast', 0.08 * s, 7.0 * s, (x - 1.6 * s, y, 4.2 * s), '#efe6d6', tod, verts=8)
    card(uid('ClownFlag'), [(0, 0), (2.2 * s, 0.3 * s), (1.6 * s, -0.6 * s), (2.3 * s, -1.4 * s), (0, -1.2 * s)], y - 0.1, pmat('ClownFlag' + tod, N('#2a2a32', tod), unlit=True, mottle=0), x=x - 1.6 * s, z=7.6 * s)
    card(uid('FlagClown'), _blob_pts(0.32 * s, 0.32 * s, 12, 0, 0), y - 0.12, pmat('FlagClown' + tod, N('#f2ece0', tod), unlit=True, mottle=0), x=x - 0.8 * s, z=7.0 * s)
    bunting((x - 1.6 * s, y, 7.2 * s), (x + 3.4 * s, y, 1.4 * s), tod, n=12, sag=0.2)


def cv_exit_dc4(tod):
    paint_mode(); tod = 'night'
    paint_sky('#1c2a6a', '#2a3a8a')
    for k, c in enumerate(('#2a3a6a', '#22305a')):
        ridge_card(50 - k * 12, -100, 100, 0, 9 - k * 3, c, seed=150 + k, humps=6, teeth=60, tooth_col=_mix_hex(c, '#101a2a', 0.2))
    water_plane(tod, y0=2, col=CV['day']['lake'], far=CV['day']['lake_far'])
    plank_floor('Dock', (3.0, 6.0, 0.25), (-4.0, 3.0, 0.5), '#6a4a2e', tod, axis='y', step=0.4)
    for yy in (1.0, 3.0, 5.0):
        for xx in (-5.3, -2.7):
            pcyl('Piling', 0.12, 1.6, (xx, yy, -0.2), '#4a3420', tod, verts=8)
    for x in (-5.0, -3.0):
        stripe_torch(x, 5.5, tod, h=2.6, lit=True)
    boat_of_losers(2.5, 6.5, tod, s=1.0)
    stand(-4.0, 2.0)
    paint_sun(azimuth=-30, elevation=28, energy=1.6)
    tv_camera((-1.0, -6.0, 2.4), (1.0, 12, 2.4), lens=26)


def carousel(x, y, tod, s=1.0):
    """The carousel (Carousel): a blue-and-red striped canopy with a scalloped rim, a striped centre
    pole, horses on gold poles, a round platform."""
    striped('CarPlatform', 4.4 * s, 0.4 * s, (x, y, 0.2 * s), '#2a4aa8', '#c8302a', tod, n=12)
    striped('CarCanopy', 4.6 * s, 1.6 * s, (x, y, 3.6 * s), '#2a4aa8', '#c8302a', tod, n=12, r2=0.4 * s)
    striped('CarRim', 4.62 * s, 0.6 * s, (x, y, 2.8 * s), '#2a4aa8', '#3a6ad8', tod, n=12)
    striped('CarPole', 0.5 * s, 2.6 * s, (x, y, 1.6 * s), '#2a4aa8', '#c8302a', tod, n=4)
    for k in range(8):
        a = k / 8 * 2 * math.pi
        hx, hy = x + math.cos(a) * 3.4 * s, y + math.sin(a) * 3.4 * s
        pcyl('CarHorsePole', 0.05 * s, 2.4 * s, (hx, hy, 1.6 * s), '#e8b03a', tod, verts=6)
        pbox('CarHorse', (0.9 * s, 0.3 * s, 0.6 * s), (hx, hy, 1.2 * s), ('#efe6d6', '#e8b03a', '#c8843a')[k % 3], tod, rot=(0, 0, math.degrees(a) + 90))


SCENES['carnival'].update({
    'confessional': cv_confessional_dc4, 'voting-booth': cv_voting_booth_dc4, 'theater-tent': cv_theater_ext, 'exit': cv_exit_dc4,
})
OUTDOOR['carnival'] |= {'confessional', 'theater-tent'}

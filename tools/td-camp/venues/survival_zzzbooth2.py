# Soluna's voting booth: DC5_Voting_Confessional traced with Tom cut out (traced/cuts/sol-booth.json);
# what stood behind him is redrawn by hand on top (booth_behind below).

def si_voting_booth_traced(tod):
    paint_mode()
    paint_sky('#000000', '#000000')
    vtraced('Traced', 'sol-booth.json', 20.0)
    vmark_stand((900, 640), PEOPLE_DEPTH)
    vmark_stand((1040, 640), PEOPLE_DEPTH)
    vcam()


def booth_behind(d):
    """What stood behind Tom, read off the frame around him (crop of DC5_Voting_Confessional): the plank
    ceiling between two dark crossbeams, the roof edge with its string of bulbs, the night sky with the
    volcano and the village lights below it, the back railing, the plank walkway, the counter's lip."""
    X0, X1 = 560, 1240
    # night sky behind, the volcano and the treeline
    vshape('BSky', [(X0, 230), (X1, 230), (X1, 640), (X0, 640)], d, None, grad=('#0c1e5c', '#2c56a8'))
    vstars(d - 0.002, 26, (X0, 240, X1, 420), seed=17)
    for (cx, cy, sc) in ((700, 262, 0.9), (1110, 250, 1.1)):
        vshape('BCloud', [(cx - 48 * sc, cy + 8), (cx - 30 * sc, cy - 8), (cx - 8 * sc, cy - 16), (cx + 16 * sc, cy - 14), (cx + 36 * sc, cy - 4), (cx + 52 * sc, cy + 8)], d - 0.003, '#2c5ab4', k=5)
    vshape('BVolcano', [(X0, 640), (X0, 560), (700, 520), (780, 418), (812, 404), (846, 420), (960, 520), (1080, 560), (X1, 580), (X1, 640)], d - 0.004, None, grad=('#2a4a8e', '#203c78'), k=3)
    vshape('BTrees', [(X0, 640), (X0, 590)] + [(X0 + i * 40, 590 - (14 if i % 2 else 2)) for i in range(16)] + [(X1, 600), (X1, 640)], d - 0.005, '#16264a', k=2)
    for (hx, hy) in ((612, 552), (640, 560)):
        vshape('BHutLight', [(hx - 7, hy + 10), (hx + 7, hy + 10), (hx + 7, hy), (hx, hy - 7), (hx - 7, hy)], d - 0.006, '#ffd65a')
        vglow(hx, hy + 3, 22, d - 0.0065, '#ffcf4a', 0.5)
    # the back railing across the walkway
    for x in (640, 760, 880, 1000, 1120):
        vshape('BRailPost', [(x - 5, 640), (x + 5, 640), (x + 5, 572), (x - 5, 572)], d - 0.007, '#3a2014', line='#1e0e06', lw=1.2)
    vline('BRail', [(X0, 584), (X1, 576)], d - 0.0075, '#4a2a16', w=6)
    vline('BRail2', [(X0, 612), (X1, 606)], d - 0.0075, '#4a2a16', w=4)
    # the walkway: plank bands, darker away from the torches
    bands = ['#5a3218', '#6a3a1c', '#7a4524', '#6a3a1c', '#844e28', '#74431f', '#8e5a2e', '#7a4a24']
    for i, c in enumerate(bands):
        y0 = 636 + i * 18; y1 = y0 + 19
        vshape('BPlank', [(X0, y0), (X1, y0), (X1, y1), (X0, y1)], d - 0.008, c)
        vline('BPlankSeam', [(X0, y0), (X1, y0)], d - 0.0085, '#3e1e0a', w=1.6)
    # the plank ceiling, its crossbeams and the roof edge
    vshape('BCeiling', [(X0 - 20, 0), (X1 + 20, 0), (X1 + 20, 232), (X0 - 20, 232)], d - 0.009, None, grad=('#84461a', '#a8642a'))
    for x in range(X0, X1, 46):
        vline('BCeilSeam', [(x, 0), (x + 18, 230)], d - 0.0095, '#7a3e14', w=2)
    vshape('BBeam1', [(X0 - 20, 98), (X1 + 20, 66), (X1 + 20, 94), (X0 - 20, 128)], d - 0.01, '#4e2408', line='#2a1004', lw=1.5)
    vshape('BBeamEdge', [(X0 - 20, 202), (X1 + 20, 182), (X1 + 20, 210), (X0 - 20, 232)], d - 0.01, '#3c1604', line='#220a02', lw=1.5)
    for (a, b) in (((640, 0), (690, 98)), ((900, 0), (930, 80)), ((1140, 0), (1160, 66))):
        vline('BRafter', [a, b], d - 0.0105, '#5a2c0c', w=14)
    # the bulb strings, continuing the ones either side of him
    for pts in (((560, 112), (765, 128), (990, 120), (1125, 104), (1290, 76)), ((520, 216), (720, 236), (930, 238), (1155, 216), (1345, 186))):
        P = smooth(list(pts), 8, closed=False)
        vline('BWire', P, d - 0.011, '#2a1a10', w=2.0)
        for i in range(1, len(P), 9):
            q = P[i]
            if X0 - 10 < q[0] < X1 + 10:
                vglow(q[0], q[1] + 7, 26, d - 0.0115, '#ffe08a', 0.6)
                vdisc('BBulb', q[0], q[1] + 7, 7, d - 0.012, '#fff2a0')
    # the counter's top across the front
    vshape('BCounter', [(840, 778), (1090, 778), (1090, 806), (840, 806)], d - 0.013, '#623700')
    vshape('BCounterLip', [(840, 778), (1090, 778), (1090, 786), (840, 786)], d - 0.0135, '#8a5428')


def si_booth_fill(tod):
    """The fill layer: what stood behind Tom, rendered full frame; trace.py blends it into the frame
    inside his outline before tracing (tools/td-camp/traced/cuts/sol-booth.json)."""
    paint_mode()
    paint_sky('#000000', '#000000')
    booth_behind(19.9)
    _torch(1200, 398, 0.45, 19.75)
    vcam()


SCENES['survival-island']['voting-booth'] = si_voting_booth_traced
SCENES['survival-island']['_fill-sol-booth'] = si_booth_fill

# Soluna's confessional (day): rebuilt from five DC5 confessional frames with different people on the
# stump (tools/td-camp/consensus.py -> traced/cuts/sol-conf-day-bg.png); the core every person covers
# and the name caption are filled by si_conf_fill below, blended in by trace.py, then traced.

def si_conf_fill(tod):
    paint_mode()
    paint_sky('#000000', '#000000')
    d = 19.9
    # canopy above the cliff
    vshape('FCanopy', [(420, 60), (900, 40), (900, 260), (420, 270)], d, None, grad=('#2f6a2e', '#3f8a3a'))
    for (cx, cy, r, c) in ((520, 120, 70, '#2a5e2a'), (640, 150, 80, '#3a7a34'), (780, 130, 70, '#2f6a2e'), (860, 200, 60, '#4a9a3a')):
        vdisc('FBush', cx, cy, r, d - 0.001, c, ry=r * 0.7)
    # the grey cliff behind the stump, its mossy top and cracks
    vshape('FCliff', [(420, 240), (910, 255), (910, 650), (420, 650)], d - 0.002, None, grad=('#6c8780', '#56706a'))
    vshape('FCliffTop', [(420, 236)] + [(420 + i * 35, 240 + (10 if i % 2 else 0)) for i in range(15)] + [(910, 270), (910, 256), (420, 256)], d - 0.003, '#2f7a3a', k=2)
    for x in (480, 560, 650, 740, 830):
        vline('FCrack', [(x, 290), (x + 8, 420), (x - 4, 560)], d - 0.004, '#4a5e58', w=3)
    # the jungle at the foot of the cliff, down to the stump
    for (cx, cy, rx, ry, c) in ((500, 640, 90, 60, '#0e4a2a'), (620, 620, 110, 70, '#155a32'), (760, 640, 100, 60, '#0e4a2a'), (860, 600, 70, 60, '#1f6a3a')):
        vdisc('FJungle', cx, cy, rx, d - 0.005, c, ry=ry)
    vshape('FGround', [(420, 680), (900, 680), (900, 720), (420, 720)], d - 0.006, '#2a6a2a')
    # the stump's top and its back edge
    vdisc('FStumpTop', 620, 694, 160, d - 0.007, '#c8843a', ry=26)
    vdisc('FStumpRing', 620, 694, 120, d - 0.0075, '#b06a2a', ry=18)
    vcam()


def si_conf_traced(tod):
    paint_mode()
    paint_sky('#000000', '#000000')
    vplate('Traced', 'sol-conf-day.json', 20.0)
    _live_marks('sol-conf-day.json', 20.0)
    vmark_stand((640, 640), PEOPLE_DEPTH)
    vmark_stand((900, 640), PEOPLE_DEPTH)
    vcam()


SCENES['survival-island']['confessional'] = si_conf_traced
SCENES['survival-island']['_fill-sol-conf'] = si_conf_fill
OUTDOOR['survival-island'].discard('confessional')

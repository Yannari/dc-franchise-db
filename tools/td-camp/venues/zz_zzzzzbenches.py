# ══════════════════════════════════════════════════════════════════
# venues/zz_zzzzzbenches.py — the benches, where the eliminated pick a side at a challenge finale
# ══════════════════════════════════════════════════════════════════
# The user, 2026-10-15: "use this for the finale (final challenge the one inspired by td island1) when they choose ...
# the white sign its where u gonna put the avatar icons of the finalist". Total Drama Island's last episode: everybody
# voted off sits in the bleachers behind the finalist they want to win. Two sets of bleachers, a blank sign over each
# (js/vp-td-ep/finale.js tdBenchesScreen puts each finalist's face on their sign), and a path down the middle.
# The other venues' versions came back from to-edit/td-benches/ (the user's edits, 2026-10-16): the same layout in each
# venue's own scenery, the tiers a little higher or lower in each.
# Seats (x, seat y, height %) in the 1600x900 reference frame: the top of each tier's plank, three tiers a side (the
# front tier sits under the band the viewer seats people in, v .38-.78). The finalists stand on the path between
# the bleachers, the host behind them.

_L = [(x, 640, 12) for x in (230, 320, 410, 500)] + [(x, 663, 12) for x in (290, 380, 470, 560)] + [(x, 686, 13) for x in (330, 420, 510, 600)]
_R = [(x, 653, 12) for x in (1080, 1170, 1260, 1350)] + [(x, 677, 12) for x in (1040, 1130, 1220, 1310, 1400)] + [(x, 702, 13) for x in (1000, 1090, 1180, 1270, 1360)]

SCENES['hosted-camp']['benches'] = _wk('benches-hc.json', [(660, 640), (940, 640)], seats=_L + _R, host=(800, 610))


def _tier(y, x0, x1, h=12, sign=None, step=75):
    """One tier's seats: a plank's top at y from x0 to x1, a person every `step` px clear of its ends; on the back
    tier nobody sits right under the sign (they would cover the finalist's face)."""
    n = max(1, int((x1 - x0 - 60) // step) + 1)
    pad = (x1 - x0 - (n - 1) * step) / 2
    xs = [round(x0 + pad + i * step) for i in range(n)]
    if sign:
        xs = [x for x in xs if not (sign[0] - 30 < x < sign[1] + 30)]
    return [(x, y, h) for x in xs]


# (venue, place, tiers (y, x0, x1) back to front, left and right, the two signs' x spans)
_BENCHES = [
    ('survival-island', 'benches-si', [(645, 205, 595), (675, 245, 640), (707, 290, 680)],
     [(647, 992, 1450), (677, 960, 1395), (707, 915, 1355)], (188, 335), (1318, 1466)),
    ('carnival', 'benches-cv', [(639, 245, 612), (657, 290, 650), (678, 330, 685)],
     [(655, 977, 1350), (677, 940, 1330), (700, 905, 1300)], (184, 333), (1322, 1474)),
    ('film-lot', 'benches-lot', [(640, 165, 568), (662, 213, 615), (683, 262, 655)],
     [(652, 1037, 1460), (677, 982, 1408), (697, 945, 1360)], (191, 341), (1333, 1484)),
    ('world-tour', 'benches-wt', [(648, 205, 610), (671, 255, 650), (695, 300, 685)],
     [(655, 982, 1440), (681, 940, 1400), (707, 905, 1340)], (180, 334), (1328, 1481)),
]
for _venue, _place, _lt, _rt, _ls, _rs in _BENCHES:
    _seats = []
    for _tiers, _sign in ((_lt, _ls), (_rt, _rs)):
        for _i, (_y, _x0, _x1) in enumerate(_tiers):
            _seats += _tier(_y, _x0, _x1, 13 if _i == 2 else 12, _sign if _i == 0 else None)
    SCENES[_venue]['benches'] = _wk(_place + '.json', [(660, 640), (940, 640)], seats=_seats, host=(800, 610))

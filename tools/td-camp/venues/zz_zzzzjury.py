# ══════════════════════════════════════════════════════════════════
# venues/zz_zzzzjury.py — where the jury sits at the finale, per venue (the user's frames, 2026-10-10)
# ══════════════════════════════════════════════════════════════════
# The user: "use this for jury bleachers": DC5's tiki stage for the island, the big top's seats for the
# carnival, the cave stands for the camp, the Aftermath studio's lounge for the film lot (Total Drama
# Action's finale is in the studio), and two couches on a Hawaiian beach for World Tour (its finale is in
# Hawaii). 'jury-bleachers' is the wide shot; 'jury-close' the close one, where there is one.
# Seats are (x, seat y, height %) in the 1600x900 reference frame, front row first: y is the top of the
# tier or the cushion, where the juror sits, kept inside the band the viewer seats people in
# (v .38-.78, steps.js placeScene): a tier above it or a cushion under the dialogue panel is moved to the
# nearest line inside.

def _row(y, xs, pct):
    return [(x, y, pct) for x in xs]

_JURY = {
    'survival-island': {
        'jury-bleachers': ('jury-sol.json', _row(636, (250, 420, 590, 760, 930), 20) + _row(460, (520, 690, 860, 1030, 1190), 19) + _row(345, (760, 930, 1100, 1270), 18)),
        'jury-close': ('jury-sol-close.json', _row(698, (300, 620, 940, 1260), 36)),
    },
    'carnival': {
        'jury-bleachers': ('jury-cv.json', _row(565, (124, 536, 813, 1196, 1488), 19) + _row(448, (77, 287, 522, 770, 1100, 1397), 15)),
    },
    'hosted-camp': {
        'jury-bleachers': ('jury-hc.json', _row(560, (560, 780, 1000, 1220), 18) + _row(384, (380, 600, 820, 1020), 16) + _row(345, (220, 420, 620, 820), 15)),
    },
    'film-lot': {
        'jury-bleachers': ('jury-lot.json', _row(664, (470, 700, 930, 1160), 22) + _row(480, (950, 1150, 1350), 20) + [(90, 672, 22)]),
        'jury-close': ('jury-lot-close.json', _row(528, (900, 1150, 1400), 30)),
    },
    'world-tour': {
        'jury-bleachers': ('jury-wt.json', _row(698, (520, 780, 1040), 22) + _row(600, (870, 1100, 1330), 20)),
    },
}

for _venue, _spots in _JURY.items():
    for _spot, (_js, _seats) in _spots.items():
        SCENES[_venue][_spot] = _wk(_js, [], seats=_seats)
        OUTDOOR[_venue].discard(_spot)

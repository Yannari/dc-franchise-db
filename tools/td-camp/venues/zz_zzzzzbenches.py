# ══════════════════════════════════════════════════════════════════
# venues/zz_zzzzzbenches.py — the benches, where the eliminated pick a side at a challenge finale
# ══════════════════════════════════════════════════════════════════
# The user, 2026-10-15: "use this for the finale (final challenge the one inspired by td island1) when they choose ...
# the white sign its where u gonna put the avatar icons of the finalist". Total Drama Island's last episode: everybody
# voted off sits in the bleachers behind the finalist they want to win. Two sets of bleachers, a blank sign over each
# (js/vp-td-ep/finale.js tdBenchesScreen puts each finalist's face on their sign), and a path down the middle.
# The other venues' versions are asked for in to-edit/td-benches/ (one folder each); until they exist every venue
# uses the camp's.
# Seats (x, seat y, height %) in the 1600x900 reference frame: the top of each tier's plank, three tiers a side (the
# front tier sits under the band the viewer seats people in, v .38-.78). The finalists stand on the path between
# the bleachers, the host behind them.

_L = [(x, 640, 12) for x in (230, 320, 410, 500)] + [(x, 663, 12) for x in (290, 380, 470, 560)] + [(x, 686, 13) for x in (330, 420, 510, 600)]
_R = [(x, 653, 12) for x in (1080, 1170, 1260, 1350)] + [(x, 677, 12) for x in (1040, 1130, 1220, 1310, 1400)] + [(x, 702, 13) for x in (1000, 1090, 1180, 1270, 1360)]

SCENES['hosted-camp']['benches'] = _wk('benches-hc.json', [(660, 640), (940, 640)], seats=_L + _R, host=(800, 610))

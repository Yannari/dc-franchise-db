# ══════════════════════════════════════════════════════════════════════
# venues/zz_zstawaki.py — Stawaki's Elimination Trial as Disventure Camp 4 drew it
# ══════════════════════════════════════════════════════════════════════
# The trial is the show's own frame (Stawaki Carnival - Campfire): two circus drums, two barrels
# and three crates round the fire under the bulbs and bunting, torches behind (clean.py 'cv-trial').
# One contestant on each prop; the rest along the boards behind. Runs after zz_wawanakwa.py.
# the user's empty trial (2026-10-08): one contestant on every drum, barrel and crate, back to front
_CV_SEATS = [(453, 552), (647, 552), (310, 555), (387, 580), (547, 578), (737, 575), (207, 579), (283, 603), (813, 612), (547, 622)]
SCENES['carnival']['ceremony'] = _wk('cv-trial.json', [(860, 640), (1450, 640)], seats=_CV_SEATS, host=(1150, 635))
NIGHT_ONLY.add('ceremony')

# from the user's empty-background gallery (2026-10-07): the lake shore and the forest by the tents
SCENES['carnival']['lake-shore'] = _wk('cv-lake.json', [(420, 640), (680, 640), (900, 640)])
SCENES['carnival']['forest-edge'] = _wk('cv-forest.json', [(420, 600), (760, 610), (1100, 600)])
OUTDOOR['carnival'].discard('lake-shore'); OUTDOOR['carnival'].discard('forest-edge')

# the voting booth: DC4's own frame (the clown urn on the counter, torches, the fair behind), rebuilt
# empty from six booth shots with a different contestant in each
SCENES['carnival']['voting-booth'] = _wk('cv-booth.json', [(800, 640)])
NIGHT_ONLY.add('voting-booth'); OUTDOOR['carnival'].discard('voting-booth')

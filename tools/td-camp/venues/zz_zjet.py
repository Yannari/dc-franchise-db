# ══════════════════════════════════════════════════════════════════════
# venues/zz_zjet.py — Total Drama Jumbo Jet as World Tour drew it: the show's own frames
# ══════════════════════════════════════════════════════════════════════
# The jet's rooms are the Total Drama wiki's clean World Tour backgrounds (Tdwteconomyclass,
# Tdwtfirstclass, Tdwtdiningarea, Tdwtcargohold, Tdwtchrisquarters, Tdwtelimination, Cockpit,
# Conftdwt; the Drop of Shame sky from DropC with the falling campers taken out), cleaned and
# alive (clean.py, 'jet-*'). The aisle is economy's own floor; the landing strip and the map keep
# their painted plates. Runs after zz_wawanakwa.py (its helpers).

_JET = {
    'economy': _wk('jet-economy.json', [(420, 640), (800, 640), (1180, 640)]),
    'aisle': _wk('jet-economy.json', [(640, 640), (800, 640), (960, 640)]),
    'first-class': _wk('jet-first.json', [(380, 640), (700, 640), (1000, 640)]),
    'galley': _wk('jet-dining.json', [(450, 640), (750, 640), (1000, 640)]),
    'cargo-hold': _wk('jet-cargo.json', [(560, 640), (800, 640), (1040, 640)]),
    'chris-quarters': _wk('jet-chris.json', [(250, 640), (1100, 640), (1400, 640)]),
    'cockpit': _wk('jet-cockpit.json', [(700, 640), (900, 640)]),
    'confessional': _wk('jet-conf.json', [(700, 640), (900, 640)]),
    # the Barf Bag Ceremony: the benches on the right, Chris at the tiki stand
    'ceremony': _wk('jet-barf.json', [(520, 640), (700, 640)], seats=[(1100 + i * 85, 655) for i in range(6)] + [(1140 + i * 85, 690) for i in range(5)], host=(880, 640)),
    'exit': _wk('jet-drop.json', [(800, 640), (640, 640), (960, 640)]),
}
SCENES['world-tour'].update(_JET)
OUTDOOR['world-tour'] = {'destination-staging', 'map'}
NIGHT_ONLY.update({'ceremony', 'exit'})

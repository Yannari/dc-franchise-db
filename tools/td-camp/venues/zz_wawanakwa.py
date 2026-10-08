# ══════════════════════════════════════════════════════════════════════
# venues/zz_wawanakwa.py — Camp Wawanakwa as Total Drama Island drew it: the show's own frames
# ══════════════════════════════════════════════════════════════════════
# Every place at camp is the show's frame (the Total Drama wiki's location pages, its official
# Background1-6 art; tools/td-camp/traced/places.json 'hc-*'), cleaned by clean.py: the outhouse
# confessional rebuilt from 54 confessionals with a different camper in each, the cast lifted off
# the cliff, a camper out of the boathouse, the seagull off the sandbar. A day frame is graded for
# the night in the viewer, so only frames the show drew at night are night plates (the Dock of
# Shame, the campfire ceremony, the amphitheater). Runs after survival_ztraced.py (its helpers).

def _wk(json_name, stands, seats=(), host=None, zones=None):
    base = _traced_plate(json_name, stands, seats, host)
    if not zones:
        return base
    def build(tod):
        base(tod)
        # where each place is on the camp map (the zone map hangs its hotspots on these)
        for zid, (x, y) in zones.items():
            X, Z = px((x, y), 20.0)
            mark('zone', (X, 20.0, Z), id=zid)
    return build


def _by_tod(day, night):
    return lambda tod: (night if tod == 'night' else day)(tod)


_ROW = [(560, 640), (800, 640), (1040, 640)]
# the campfire ceremony's stumps, front row and back, and Chris by the oil-drum podium
# (the ceremony frame is cropped in on the stumps: clean.py box)
_STUMPS = [(140, 525), (380, 485), (570, 470), (730, 445), (935, 430), (560, 640), (750, 600), (920, 570), (1095, 545), (150, 720), (340, 680)]
_ZONES = {'dock': (720, 640), 'beach': (1380, 575), 'communal-grounds': (900, 540), 'cabins': (840, 500), 'washroom': (965, 505),
          'confessional': (1010, 505), 'mess-hall': (1075, 490), 'campfire': (530, 482), 'forest-trail': (700, 430), 'cliff': (1270, 270),
          'lake': (260, 680), 'waterfall': (1180, 420), 'caves': (470, 515), 'boathouse': (1170, 555), 'amphitheater': (770, 465), 'river': (1080, 440)}

_HC = {
    'communal-grounds': _wk('hc-lodge.json', [(380, 648), (720, 648), (1000, 648)]),
    'cabins': _wk('hc-cabins.json', [(450, 648), (770, 648), (1120, 648)]),
    'cabin-inside': _wk('hc-cabin-in.json', _ROW),
    'mess-hall': _wk('hc-mess.json', _ROW),
    'washroom': _wk('hc-wash.json', [(420, 640), (760, 640), (1100, 640)]),
    'confessional': _wk('hc-conf.json', [(700, 640), (900, 640)]),
    'dock': _by_tod(_wk('hc-dock.json', [(250, 640, 26), (520, 590, 22), (780, 545, 19)]), _wk('hc-dock-night.json', [(640, 648), (800, 648), (960, 648)])),
    'exit': _wk('hc-dock-night.json', [(800, 648), (640, 648), (960, 648)]),
    'campfire': _wk('hc-campfire.json', [(650, 560), (850, 590), (1050, 560)]),
    'ceremony': _wk('hc-ceremony2.json', [(1260, 640), (1440, 640)], seats=_STUMPS, host=(1530, 560)),
    'cliff': _wk('hc-cliff.json', [(380, 530), (680, 530), (980, 530)]),
    'forest-trail': _wk('hc-cave.json', [(330, 645), (700, 645), (1060, 645)]),
    'beach': _wk('hc-beach.json', [(500, 640), (800, 640), (1100, 640)]),
    'map': _wk('hc-map.json', [], zones=_ZONES),
    # the places the show had beyond the camp's daily round (2026-10-07: "add all of them")
    'lake': _wk('hc-lake.json', [(480, 640), (760, 640), (1040, 640)]),
    'waterfall': _wk('hc-falls.json', [(300, 648, 15), (560, 648, 15), (1180, 648, 15)]),
    'caves': _wk('hc-cave-in.json', [(520, 648), (800, 648), (1080, 648)]),
    'boathouse': _wk('hc-boathouse.json', _ROW),
    'river': _wk('hc-river.json', [(300, 640), (700, 600), (1100, 640)]),
    'kitchen': _wk('hc-kitchen.json', [(380, 645), (800, 645), (1200, 645)]),
    'amphitheater': _wk('hc-amph.json', [(620, 560, 18), (800, 560, 18), (980, 560, 18)]),
}
SCENES['hosted-camp'].update(_HC)
# one frame per place, graded for the hour by the viewer; the dock has both of the show's
OUTDOOR['hosted-camp'] = {'dock'}
NIGHT_ONLY.update({'ceremony', 'exit', 'amphitheater'})

# beyond camp: Boney Island is where an exiled camper is sent, Playa Des Losers where the voted-out wait
SCENES['islands']['boney-island'] = _wk('hc-boney-beach.json', [(500, 640), (800, 640), (1100, 640)])
SCENES['islands']['playa-des-losers'] = _wk('hc-playa.json', [(420, 612, 14), (700, 612, 14), (950, 612, 14)])
OUTDOOR['islands'].discard('boney-island'); OUTDOOR['islands'].discard('playa-des-losers')

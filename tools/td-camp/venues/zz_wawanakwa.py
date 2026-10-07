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
_STUMPS = [(440, 485), (520, 482), (600, 468), (680, 445), (742, 432), (430, 425), (530, 398), (605, 388), (680, 386), (750, 376), (812, 425)]
_ZONES = {'dock': (720, 640), 'beach': (1380, 575), 'communal-grounds': (900, 540), 'cabins': (840, 500), 'washroom': (965, 505),
          'confessional': (1010, 505), 'mess-hall': (1075, 490), 'campfire': (530, 482), 'forest-trail': (700, 430), 'cliff': (1270, 270),
          'lake': (260, 680), 'waterfall': (1180, 420), 'caves': (470, 515), 'boathouse': (1170, 555), 'amphitheater': (770, 465)}

_HC = {
    'communal-grounds': _wk('hc-lodge.json', [(480, 640), (760, 640), (1000, 640)]),
    'cabins': _wk('hc-cabins.json', [(480, 640), (760, 640), (1000, 640)]),
    'cabin-inside': _wk('hc-cabin-in.json', _ROW),
    'mess-hall': _wk('hc-mess.json', _ROW),
    'washroom': _wk('hc-wash.json', [(420, 640), (760, 640), (1100, 640)]),
    'confessional': _wk('hc-conf.json', [(700, 640), (900, 640)]),
    'dock': _by_tod(_wk('hc-dock.json', [(250, 600), (560, 545), (860, 485)]), _wk('hc-dock-night.json', [(640, 640), (800, 640), (960, 640)])),
    'exit': _wk('hc-dock-night.json', [(800, 640), (640, 640), (960, 640)]),
    'campfire': _wk('hc-campfire.json', [(650, 560), (850, 590), (1050, 560)]),
    'ceremony': _wk('hc-ceremony.json', [(820, 640), (1060, 640)], seats=_STUMPS, host=(1210, 470)),
    'cliff': _wk('hc-cliff.json', [(380, 485), (680, 485), (980, 485)]),
    'forest-trail': _wk('hc-forest.json', [(640, 640), (790, 640), (960, 640)]),
    'beach': _wk('hc-beach.json', [(500, 640), (800, 640), (1100, 640)]),
    'map': _wk('hc-map.json', [], zones=_ZONES),
    # the places the show had beyond the camp's daily round (2026-10-07: "add all of them")
    'lake': _wk('hc-lake.json', [(480, 640), (760, 640), (1040, 640)]),
    'waterfall': _wk('hc-falls.json', [(330, 640), (560, 640), (1120, 640)]),
    'caves': _wk('hc-cave.json', [(420, 640), (660, 640), (900, 640)]),
    'boathouse': _wk('hc-boathouse.json', _ROW),
    'amphitheater': _wk('hc-amph.json', _ROW),
}
SCENES['hosted-camp'].update(_HC)
# one frame per place, graded for the hour by the viewer; the dock has both of the show's
OUTDOOR['hosted-camp'] = {'dock'}
NIGHT_ONLY.update({'ceremony', 'exit', 'amphitheater'})

# beyond camp: Boney Island is where an exiled camper is sent, Playa Des Losers where the voted-out wait
SCENES['islands']['boney-island'] = _wk('hc-boney-beach.json', [(500, 640), (800, 640), (1100, 640)])
SCENES['islands']['playa-des-losers'] = _wk('hc-playa.json', [(420, 640), (700, 640), (950, 640)])
OUTDOOR['islands'].discard('boney-island'); OUTDOOR['islands'].discard('playa-des-losers')

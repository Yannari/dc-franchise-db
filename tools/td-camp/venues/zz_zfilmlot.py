# ══════════════════════════════════════════════════════════════════════
# venues/zz_filmlot.py — the abandoned film lot as Total Drama Action drew it: the show's own frames
# ══════════════════════════════════════════════════════════════════════
# The lot's places are its official backgrounds (the Total Drama wiki: Matthew Richard Allen's
# background plates, the TDA DIY BG set, The Movie Map), cleaned and alive (clean.py, 'lot-*'):
# the map, the backlot, a trailer and its inside, craft services, the soundstage, the props set,
# the make-up confessional, the Gilded Chris Awards and the Walk of Shame at night, and the western
# and city sets. The Aftermath stage (TDA_OP_BG017) is built here too, for the Aftermath show.

_LZONES = {'studio-backlot': (700, 690), 'trailers': (850, 665), 'craft-services': (1130, 640), 'soundstage-corridor': (1230, 600),
           'prop-storage': (1360, 620), 'confessional': (770, 665), 'western-set': (960, 560), 'city-set': (330, 520)}
# the awards: the bleachers on the right (two rows of steps), Chris at the podium in the shell
_BLEACH = [(880 + i * 46, 488) for i in range(7)] + [(905 + i * 46, 458) for i in range(6)]

_LOT = {
    'map': _wk('lot-map.json', [], zones=_LZONES),
    'studio-backlot': _wk('lot-backlot.json', [(620, 640), (900, 640), (1150, 640)]),
    'trailers': _wk('lot-trailers.json', [(330, 640), (560, 640), (1150, 640)]),
    'trailer-inside': _wk('lot-trailer-in.json', [(420, 640), (800, 640), (1150, 640)]),
    'craft-services': _wk('lot-craft.json', [(250, 640), (470, 640), (700, 640)]),
    'soundstage-corridor': _wk('lot-sound.json', [(520, 640), (800, 640), (1080, 640)]),
    'prop-storage': _wk('lot-props.json', [(330, 640), (560, 640), (1050, 640)]),
    'confessional': _wk('lot-conf.json', [(700, 640), (900, 640)]),
    'ceremony': _wk('lot-awards.json', [(420, 640), (640, 640)], seats=_BLEACH, host=(575, 470)),
    'exit': _wk('lot-walk.json', [(800, 640), (640, 640), (980, 640)]),
    'western-set': _wk('lot-western.json', [(500, 640), (800, 640), (1100, 640)]),
    'city-set': _wk('lot-city.json', [(500, 640), (800, 640), (1100, 640)]),
}
SCENES['film-lot'].update(_LOT)
OUTDOOR['film-lot'] = set()
NIGHT_ONLY.update({'ceremony', 'exit'})

SCENES['islands']['aftermath-studio'] = _wk('aftermath-studio.json', [(560, 600), (800, 600), (1040, 600)])

# ══════════════════════════════════════════════════════════════════════
# venues/zz_zzgallery.py — the user's empty-background gallery (2026-10-08), every remaining place
# ══════════════════════════════════════════════════════════════════════
# Stawaki: the beach, the corn maze (entrance and inside), the confessional, the voting area, the
# carousel, the Big Top, the drop tower by day, the camp map (day and night). Soluna: the arrival
# beach, the shoreline, the fishing spot, the water source (day and night), the voting booth, the
# island map (day and night). Wawanakwa: the beach at five painted hours. The jet: the cutaway map,
# in flight. Every one moves (clean.py places.json). Runs last: it overrides the older plates.

# the Stawaki map, from the user's map (zones in its own pixels); a team's camp is one of the three
_CVZ = {'corn-maze': (210, 150), 'haunted-mansion': (360, 330), 'shelter@0': (260, 520), 'campsite@0': (275, 600),
        'shelter@1': (1060, 600), 'campsite@1': (1080, 650), 'shelter@2': (560, 480), 'campsite@2': (600, 530),
        'forest-edge': (140, 450), 'carnival-entrance': (880, 470), 'midway': (950, 395), 'theater-tent': (840, 330),
        'carousel': (1280, 560), 'rocky-beach': (720, 760), 'lake-shore': (1440, 770), 'confessional': (1000, 360)}
_SLZ = {'shelter@0': (480, 560), 'campfire@0': (470, 610), 'shelter@1': (1130, 590), 'campfire@1': (1150, 640),
        'shelter@2': (1280, 720), 'campfire@2': (1300, 760), 'beach': (690, 800), 'shoreline': (230, 660),
        'water-source': (1040, 745), 'jungle-trail': (300, 520), 'ruins': (500, 350), 'cave': (790, 540),
        'fishing-area': (990, 830), 'confessional': (1250, 440)}
_JTZ = {'cockpit': (170, 450), 'first-class': (370, 450), 'economy': (690, 450), 'confessional': (925, 450),
        'galley': (720, 620), 'chris-quarters': (330, 610), 'aisle': (530, 610), 'cargo-hold': (1130, 620),
        'destination-staging': (1450, 820)}

SCENES['hosted-camp']['beach'] = _by_tod(_wk('hc-beach4k.json', [(700, 645), (980, 645), (1240, 645)]),
                                         _wk('hc-beach4k-night.json', [(700, 645), (980, 645), (1240, 645)]))
OUTDOOR['hosted-camp'].add('beach')

SCENES['carnival'].update({
    'rocky-beach': _wk('cv-beach.json', [(420, 640), (760, 640), (1100, 640)]),
    'corn-maze': _wk('cv-maze.json', [(560, 640), (800, 640), (1040, 640)]),
    'corn-maze-inside': _wk('cv-maze-in.json', [(560, 640), (800, 640), (1040, 640)]),
    'voting-booth': _wk('cv-booth.json', [(800, 640)]),
    'confessional': _wk('cv-conf.json', [(800, 640), (1000, 640)]),
    'carousel': _wk('cv-carousel.json', [(300, 640), (800, 640), (1300, 640)]),
    'big-top': _wk('cv-bigtop.json', [(560, 640), (800, 640), (1040, 640)]),
    'midway': _by_tod(_wk('cv-droptower.json', [(500, 640), (950, 640), (1250, 640)]), SCENES['carnival']['midway']),
    'map': _by_tod(_wk('cv-map.json', [], zones=_CVZ), _wk('cv-map-night.json', [], zones=_CVZ)),
})
for s in ('rocky-beach', 'corn-maze', 'corn-maze-inside', 'confessional', 'carousel', 'big-top'):
    OUTDOOR['carnival'].discard(s)
NIGHT_ONLY.discard('midway'); OUTDOOR['carnival'] |= {'midway', 'map'}

SCENES['survival-island'].update({
    'beach': _wk('sol-beach.json', [(400, 560), (780, 560), (1200, 560)]),
    'shoreline': _wk('sol-shore2.json', [(700, 640), (1000, 640), (1300, 640)]),
    'fishing-area': _wk('sol-fishing.json', [(1100, 640), (1300, 640), (1450, 640)]),
    'water-source': _by_tod(_wk('sol-water.json', [(300, 645), (700, 645), (1000, 645)]), _wk('sol-water-night.json', [(300, 645), (700, 645), (1000, 645)])),
    'voting-booth': _wk('sol-booth4k.json', [(800, 640)]),
    'map': _by_tod(_wk('sol-map.json', [], zones=_SLZ), _wk('sol-map-night.json', [], zones=_SLZ)),
})
for s in ('beach', 'shoreline', 'fishing-area'):
    OUTDOOR['survival-island'].discard(s)
OUTDOOR['survival-island'] |= {'water-source', 'map'}
# Soluna's exile: the alternate shoreline, an empty stretch of the island's coast
SCENES['islands']['soluna-exile'] = _wk('sol-shore.json', [(500, 640), (800, 640), (1000, 640)])

SCENES['world-tour']['map'] = _wk('jet-map.json', [], zones=_JTZ)
OUTDOOR['world-tour'].discard('map')

# ── the rest (2026-10-08) ──
# a third team's camp: the first team's frames, mirrored (another clearing, the same island)
SCENES['carnival'].update({'campsite-t2': _wk('cv-red-flip.json', [(720, 645), (960, 645), (1200, 645)]),
                           'shelter-t2': _wk('cv-red-in-flip.json', [(560, 645), (800, 645), (1040, 645)]),
                           'trial-area': SCENES['carnival']['ceremony']})
SCENES['survival-island'].update({'campfire-t2': _wk('sol-fans-flip.json', [(100, 650), (300, 660), (520, 650)]),
                                  'shelter-t2': _wk('sol-favs-in-flip.json', [(560, 645), (800, 645), (1040, 645)])})
for v, ss in (('carnival', ('campsite-t2', 'shelter-t2', 'trial-area')), ('survival-island', ('campfire-t2', 'shelter-t2'))):
    for s in ss: OUTDOOR[v].discard(s)
NIGHT_ONLY.add('trial-area')
# Soluna's night: the "One Final Choice" signpost (the night confessional and the way out)
_SIGN = _wk('sol-sign.json', [(800, 640), (300, 640)])
SCENES['survival-island']['exit'] = _SIGN
_CONF_DAY = SCENES['survival-island']['confessional']
SCENES['survival-island']['confessional'] = _by_tod(_CONF_DAY, _SIGN)
OUTDOOR['survival-island'].add('confessional')
# the eliminated go to the Motel (DC4 and DC5)
SCENES['islands']['motel'] = _wk('motel.json', [(500, 648), (800, 648), (1100, 648)])
OUTDOOR['islands'].discard('motel'); NIGHT_ONLY.add('motel')
# Stawaki's exile: DC4's Exile Beach, the wreck on the skull rock across the water
SCENES['islands']['stawaki-exile'] = _wk('exile-night.json', [(700, 590)])
OUTDOOR['islands'].discard('stawaki-exile'); NIGHT_ONLY.add('stawaki-exile')
# the jet on the ground: the landing strip
SCENES['world-tour']['destination-staging'] = _wk('jet-runway.json', [(300, 648), (650, 648), (1350, 648)])
OUTDOOR['world-tour'].discard('destination-staging')

# the crossroads: One Final Choice, each show's own sign and torch (the user's frames, 2026-10-08)
SCENES['islands']['sign-soluna'] = _wk('sol-sign.json', [(800, 640), (300, 640)])
SCENES['islands']['sign-stawaki'] = _wk('cv-sign.json', [(800, 640), (300, 640)])
for _s in ('sign-soluna', 'sign-stawaki'):
    OUTDOOR['islands'].discard(_s); NIGHT_ONLY.add(_s)

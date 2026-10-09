# Redemption Island / Rescue Island as a place you explore (the user, 2026-10-09): Boney Island's
# Skull Rock is the map, its zones the places the voted-out live in, the far night shot the boat
# crossing over. Every frame is the user's (traced/places.json ri-*, skull-rock); night frames by
# nightify.py. Sorts after zz_zzgallery.py, whose _wk it uses.
SCENES['redemption'] = {
    # the map: the skull cliff over the water, a pin on each place
    'map': _wk('skull-rock.json', [(960, 640)],
               zones={'skull-beach': (960, 735), 'shoreline': (1390, 722), 'rocky-beach': (520, 722), 'cave': (930, 470)}),
    # the strip of sand under the skull (the viewer stands people on it: steps.js LOW_FLOOR)
    'skull-beach': _wk('skull-rock.json', [(780, 640), (940, 640), (1100, 640)]),
    # the lagoon behind the trees, sand all round it
    'shoreline': _wk('ri-shore.json', [(260, 530), (520, 535), (800, 545), (1050, 560)]),
    # the beach of standing stones
    'rocky-beach': _wk('ri-rocky.json', [(400, 640), (800, 640), (1200, 640)]),
    # the cave: its mouth (floor low in the frame: LOW_FLOOR), and the pool inside the cliffs
    'cave-entrance': _wk('ri-cave.json', [(800, 640)]),
    'cave-inside': _wk('ri-cavein.json', [(500, 605, 14), (700, 605, 14), (1150, 615, 14)]),
    # the island from the water, the Boat of Losers coming in
    'approach': _wk('ri-approach.json', [(800, 640)]),
}
OUTDOOR['redemption'] = set()
NIGHT_ONLY.add('approach')

# The Ridonculous Race's music: fetch each pick, cut a loop, level it, encode it small.
#
#   python -I tools/rr-vp-audio.py <cache-dir> [slot ...]
#
# Every pick is Kevin MacLeod's (incompetech.com), licensed CC BY 4.0: the credit for each file
# is written to assets/audio/rr/credits.json and assets/audio/rr/CREDITS.md. One file at a time,
# a normal User-Agent, a pause between requests, and only the first few megabytes of each track
# (a Range request): a loop needs a minute, not the whole piece.
#
# A BED is cut from `at` seconds for `len` seconds plus a crossfade tail that is folded back into
# its start, so the end runs into the beginning without a click; levelled to -17 dB RMS. A STING is
# `len` seconds from `at`, with a short fade out, levelled to -14 dB. Mono, 44.1 kHz, 64 kbps.
import json, os, sys, time, urllib.parse, urllib.request
import numpy as np
import miniaudio, lameenc

OUT = 'assets/audio/rr'
SRC = 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/'
UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'
LEN = {'opener': 45, 'travel': 50, 'challenge': 50, 'struggle': 45, 'chill-zone': 45, 'elimination': 35, 'recap': 30, 'interview': 40}

# slot -> (title, at seconds, length or None for the moment's default)
PICKS = {
  'home-city/opener': ('Motivator', 0), 'home-city/travel': ('Delay Rock', 0), 'home-city/challenge': ('Hotrock', 0),
  'home-city/struggle': ('I Can Feel it Coming', 0), 'home-city/chill-zone': ('Funky Chunk', 0), 'home-city/elimination': ('Heartbreaking', 0),
  'home-city/recap': ('Chipper', 0), 'home-city/interview': ('Chill Wave', 0),
  'red-sand-desert/opener': ('Tabuk', 0), 'red-sand-desert/travel': ('Finding the Balance', 0), 'red-sand-desert/challenge': ('Ibn Al-Noor', 0),
  'red-sand-desert/struggle': ('Old Road', 0), 'red-sand-desert/chill-zone': ('Desert City', 0), 'red-sand-desert/elimination': ('Teller of the Tales', 0),
  'red-sand-desert/recap': ('Derp Nugget', 0), 'red-sand-desert/interview': ('Vadodora Chill Mix', 0),
  'iron-tower-city/opener': ('Bushwick Tarantella', 0), 'iron-tower-city/travel': ('Sidewalk Shade', 0), 'iron-tower-city/challenge': ('Le Grand Chase', 0),
  'iron-tower-city/struggle': ("Miri's Magic Dance", 0), 'iron-tower-city/chill-zone': ('Suave Standpipe', 0), 'iron-tower-city/elimination': ('Duet Musette', 0),
  'iron-tower-city/recap': ('One-eyed Maestro', 0), 'iron-tower-city/interview': ('Parisian', 0),
  'great-wall-hills/opener': ('Shenyang', 0), 'great-wall-hills/travel': ('Guzheng City', 0), 'great-wall-hills/challenge': ('Mountain Emperor', 0),
  'great-wall-hills/struggle': ('Asian Drums', 0), 'great-wall-hills/chill-zone': ('Ishikari Lore', 0), 'great-wall-hills/elimination': ('Nu Flute', 0),
  'great-wall-hills/recap': ('Big Mojo', 0), 'great-wall-hills/interview': ('Ripples', 0),
  'rock-north/opener': ('Achaidh Cheide', 0), 'rock-north/travel': ('Fiddles McGinty', 0), 'rock-north/challenge': ('Burn The World Waltz', 0),
  'rock-north/struggle': ('Spider Eyes', 0), 'rock-north/chill-zone': ('Galway', 0), 'rock-north/elimination': ('Moorland', 0),
  'rock-north/recap': ('Metalmania', 0), 'rock-north/interview': ('Frost Waltz', 0),
  'savanna-falls/opener': ('AngloZulu', 0), 'savanna-falls/travel': ('Allada', 0), 'savanna-falls/challenge': ('Sauropod Spotting', 0),
  'savanna-falls/struggle': ('Drums of the Deep', 0), 'savanna-falls/chill-zone': ('Zanzibar', 0), 'savanna-falls/elimination': ('Kalimba Relaxation Music', 0),
  'savanna-falls/recap': ('Dentaneosuchus Hunt', 0), 'savanna-falls/interview': ('Expeditionary', 0),
  'treasure-isles/opener': ('Beachfront Celebration', 0), 'treasure-isles/travel': ('Island Meet and Greet', 0), 'treasure-isles/challenge': ('Arroz Con Pollo', 0),
  'treasure-isles/struggle': ('Invariance', 0), 'treasure-isles/chill-zone': ('Paradise Found', 0), 'treasure-isles/elimination': ('With the Sea', 0),
  'treasure-isles/recap': ('Notanico Merengue', 0), 'treasure-isles/interview': ('Beach Party', 0),
  'tomb-sands/opener': ('Return of the Mummy', 0), 'tomb-sands/travel': ('Desert of Lost Souls', 0), 'tomb-sands/challenge': ('Curse of the Scarab', 0),
  'tomb-sands/struggle': ('Hidden Wonders', 0), 'tomb-sands/chill-zone': ('Opium', 0), 'tomb-sands/elimination': ('Ancient Rite', 0),
  'tomb-sands/recap': ('East of Tunesia', 0), 'tomb-sands/interview': ('Mystery Bazaar', 0),
  'torch-statue-harbour/opener': ('Highlight Reel', 0), 'torch-statue-harbour/travel': ('Style Funk', 0), 'torch-statue-harbour/challenge': ('Sax, Rock, and Roll', 0),
  'torch-statue-harbour/struggle': ('Griphop', 0), 'torch-statue-harbour/chill-zone': ('Jazz Brunch', 0), 'torch-statue-harbour/elimination': ('Night on the Docks - Sax', 0),
  'torch-statue-harbour/recap': ('Private Eye', 0), 'torch-statue-harbour/interview': ('Cool Vibes', 0),
  'red-outback/opener': ('Lord of the Rangs', 0), 'red-outback/travel': ('Still Pickin', 0), 'red-outback/challenge': ('River Valley Breakdown', 0),
  'red-outback/struggle': ('Chee Zee Jungle', 0), 'red-outback/chill-zone': ('Fireflies and Stardust', 0), 'red-outback/elimination': ('Crossing the Divide', 0),
  'red-outback/recap': ('Corncob', 0), 'red-outback/interview': ('Cattails', 0),
  'fire-mountain-isle/opener': ('Carefree', 0), 'fire-mountain-isle/travel': ('Rite of Passage', 0), 'fire-mountain-isle/challenge': ('Firebrand', 0),
  'fire-mountain-isle/struggle': ('Tikopia', 0), 'fire-mountain-isle/chill-zone': ('Tiki Bar Mixer', 0), 'fire-mountain-isle/elimination': ('When The Wind Blows', 0),
  'fire-mountain-isle/recap': ('Arcane', 0), 'fire-mountain-isle/interview': ('Moonlight Beach', 0),
  'skyline-finale/opener': ('Our Story Begins', 0), 'skyline-finale/travel': ('Hiding Your Reality', 0), 'skyline-finale/challenge': ('Five Armies', 0),
  'skyline-finale/struggle': ('Impending Boom', 0), 'skyline-finale/chill-zone': ('Pennsylvania Rose', 0), 'skyline-finale/elimination': ('Rumination', 0),
  'skyline-finale/recap': ('Heroic Age', 0), 'skyline-finale/interview': ('Airship Serenity', 0),
  # batch 1 of the 46 places (2026-10-19): Riviera glamour, the icy north, carnival samba, gothic organ
  'coast-palace/opener': ('Backbay Lounge', 0), 'coast-palace/travel': ('Zazie', 0), 'coast-palace/challenge': ('Surf Shimmy', 0),
  'coast-palace/struggle': ('Spy Groove', 0), 'coast-palace/chill-zone': ('Bossa Antigua', 0), 'coast-palace/elimination': ('Danse Morialta', 0),
  'coast-palace/recap': ('Beach Bum', 0), 'coast-palace/interview': ('BossaBossa', 0),
  'geyser-island/opener': ('The Snow Queen', 0), 'geyser-island/travel': ('Ice Flow', 0), 'geyser-island/challenge': ('Krampus Workshop', 0),
  'geyser-island/struggle': ('Myst on the Moor', 0), 'geyser-island/chill-zone': ('Northern Glade', 0), 'geyser-island/elimination': ('The Ice Giants', 0),
  'geyser-island/recap': ('The Path of the Goblin King v2', 0), 'geyser-island/interview': ('Enchanted Valley', 0),
  'carnival-rainforest/opener': ('Leblon', 0), 'carnival-rainforest/travel': ('Lagoa v1', 0), 'carnival-rainforest/challenge': ('Lagoa v2', 0),
  'carnival-rainforest/struggle': ('Suvaco do Cristo', 0), 'carnival-rainforest/chill-zone': ('Samba Isobel', 0),
  'carnival-rainforest/elimination': ('Sancho Panza gets a Latte', 0), 'carnival-rainforest/recap': ('Peppy Pepe', 0),
  'carnival-rainforest/interview': ('Modern Jazz Samba', 0),
  'haunted-castle/opener': ('Toccata and Fugue in D Minor', 0), 'haunted-castle/travel': ('Graveyard Shift', 0), 'haunted-castle/challenge': ('Grim Idol', 0),
  'haunted-castle/struggle': ('Gloom Horizon', 0), 'haunted-castle/chill-zone': ('Moonlight Hall', 0), 'haunted-castle/elimination': ('Ghost Dance', 0),
  'haunted-castle/recap': ('Unholy Knight', 0), 'haunted-castle/interview': ('Ghost Story', 0),
  # batch 2 (2026-10-19): island ukulele, the glass city's electronic, swamp blues, a bush band
  'lei-island/opener': ('Rainbows', 0), 'lei-island/travel': ('Life of Riley', 0), 'lei-island/challenge': ('Journey To Ascend', 0),
  'lei-island/struggle': ('Secret of Tiki Island', 0), 'lei-island/chill-zone': ('Daily Beetle', 0), 'lei-island/elimination': ('Leaving Home', 0),
  'lei-island/recap': ('Glitter Blast', 0), 'lei-island/interview': ('Fretless', 0),
  'glass-tower-gulf/opener': ('Shiny Tech', 0), 'glass-tower-gulf/travel': ('Aerosol of my Love', 0), 'glass-tower-gulf/challenge': ('Blown Away', 0),
  'glass-tower-gulf/struggle': ('Severe Tire Damage', 0), 'glass-tower-gulf/chill-zone': ('Thinking Out Loud', 0),
  'glass-tower-gulf/elimination': ('Mana Two - Part 3', 0), 'glass-tower-gulf/recap': ('Cantina Blues', 0), 'glass-tower-gulf/interview': ('Dub Eastern', 0),
  'swamp-prison/opener': ("Matt's Blues", 0), 'swamp-prison/travel': ('Bama Country', 0), 'swamp-prison/challenge': ('Hustle', 0),
  'swamp-prison/struggle': ('Dirt Rhodes', 0), 'swamp-prison/chill-zone': ("Nile's Blues", 0), 'swamp-prison/elimination': ('Porch Blues', 0),
  'swamp-prison/recap': ('Boogie Party', 0), 'swamp-prison/interview': ('OctoBlues', 0),
  'outback-farm/opener': ('Kings of Tara', 0), 'outback-farm/travel': ('Hillbilly Swing', 0), 'outback-farm/challenge': ('DarxieLand', 0),
  'outback-farm/struggle': ('Dragon and Toast', 0), 'outback-farm/chill-zone': ('Skye Cuillin', 0), 'outback-farm/elimination': ('Hidden Past', 0),
  'outback-farm/recap': ('Celtic Impulse', 0), 'outback-farm/interview': ('Lotus', 0),
  'fjord-peaks/opener': ("Magistar", 0),
  'fjord-peaks/travel': ("Ascending the Vale", 0),
  'fjord-peaks/challenge': ("Killers", 0),
  'fjord-peaks/struggle': ("Lost Frontier", 0),
  'fjord-peaks/chill-zone': ("Heart of Nowhere", 0),
  'fjord-peaks/elimination': ("Night Vigil", 0),
  'fjord-peaks/recap': ("Burnt Spirit", 0),
  'fjord-peaks/interview': ("Ever Mindful", 0),
  'prairie-ranch/opener': ("Guts and Bourbon", 0),
  'prairie-ranch/travel': ("Hyperfun", 0),
  'prairie-ranch/challenge': ("Robo-Western", 0),
  'prairie-ranch/struggle': ("Smoking Gun", 0),
  'prairie-ranch/chill-zone': ("Drankin Song", 0),
  'prairie-ranch/elimination': ("Pale Rider", 0),
  'prairie-ranch/recap': ("Cowboy Sting", 0),
  'prairie-ranch/interview': ("Neo Western", 0),
  'ice-floe/opener': ("Thunderbird", 0),
  'ice-floe/travel': ("Mirage", 0),
  'ice-floe/challenge': ("Static Motion", 0),
  'ice-floe/struggle': ("Controlled Chaos", 0),
  'ice-floe/chill-zone': ("New Direction", 0),
  'ice-floe/elimination': ("Virtutes Instrumenti", 0),
  'ice-floe/recap': ("Thunder Dreams", 0),
  'ice-floe/interview': ("Drone in D", 0),
  'dragon-isle/opener': ("Mystic Force", 0),
  'dragon-isle/travel': ("Artifact", 0),
  'dragon-isle/challenge': ("Blue Scorpion", 0),
  'dragon-isle/struggle': ("Confused State", 0),
  'dragon-isle/chill-zone': ("Finding Movement", 0),
  'dragon-isle/elimination': ("Immersed", 0),
  'dragon-isle/recap': ("Trouble with Tribals", 0),
  'dragon-isle/interview': ("Eastminster", 0),
  'neon-desert/opener': ("Street Party", 0),
  'neon-desert/travel': ("Miami Nights - Extended Theme", 0),
  'neon-desert/challenge': ("Blue Ska", 0),
  'neon-desert/struggle': ("Port Horizon", 0),
  'neon-desert/chill-zone': ("Bummin on Tremelo", 0),
  'neon-desert/elimination': ("Just As Soon", 0),
  'neon-desert/recap': ("I Got a Stick Arr Bryan Teoh", 0),
  'neon-desert/interview': ("Vicious", 0),
  'pyramid-coast/opener': ("Mariachi Snooze", 0),
  'pyramid-coast/travel': ("Del Rio Bravo", 0),
  'pyramid-coast/challenge': ("El Magicia", 0),
  'pyramid-coast/struggle': ("As I Figure", 0),
  'pyramid-coast/chill-zone': ("Laid Back Guitars", 0),
  'pyramid-coast/elimination': ("Midnight Tale", 0),
  'pyramid-coast/recap': ("Circus of Freaks", 0),
  'pyramid-coast/interview': ("Morning", 0),
  'stilt-river/opener': ("Ethernight Club", 0),
  'stilt-river/travel': ("River Fire", 0),
  'stilt-river/challenge': ("Ave Marimba", 0),
  'stilt-river/struggle': ("Ancient Mystery Waltz (Allegro)", 0),
  'stilt-river/chill-zone': ("Silver Flame", 0),
  'stilt-river/elimination': ("Spirit of the Girl", 0),
  'stilt-river/recap': ("Mischief Maker", 0),
  'stilt-river/interview': ("River Flute", 0),
  'frozen-mine/opener': ("Aquarium", 0),
  'frozen-mine/travel': ("Morgana Rides", 0),
  'frozen-mine/challenge': ("Adventures in Adventureland", 0),
  'frozen-mine/struggle': ("Holiday Weasel", 0),
  'frozen-mine/chill-zone': ("Canon in D for Autoharp", 0),
  'frozen-mine/elimination': ("Elf Meditation", 0),
  'frozen-mine/recap': ("Industrious Ferret", 0),
  'frozen-mine/interview': ("Ancient Winds", 0),
  'tea-hills/opener': ("Vadodora", 0),
  'tea-hills/travel': ("Jalandhar", 0),
  'tea-hills/challenge': ("Cretaceous Dawn", 0),
  'tea-hills/struggle': ("Psychedelic Crater", 0),
  'tea-hills/chill-zone': ("Truth in the Stones", 0),
  'tea-hills/elimination': ("Dhaka", 0),
  'tea-hills/recap': ("Big Drumming", 0),
  'tea-hills/interview': ("Ethereal Relaxation", 0),
  'pampas-ranch/opener': ("Tango de Manzana", 0),
  'pampas-ranch/travel': ("Porch Swing Days - faster", 0),
  'pampas-ranch/challenge': ("Feral Angel Waltz", 0),
  'pampas-ranch/struggle': ("Folk Round", 0),
  'pampas-ranch/chill-zone': ("Porch Swing Days - slower", 0),
  'pampas-ranch/elimination': ("Sardana", 0),
  'pampas-ranch/recap': ("Happy Alley", 0),
  'pampas-ranch/interview': ("Joey's Formal Waltz - Unscented", 0),
  'game-show-city/opener': ("Neon Laser Horizon", 0),
  'game-show-city/travel': ("Voxel Revolution", 0),
  'game-show-city/challenge': ("Balloon Game", 0),
  'game-show-city/struggle': ("Brain Dance", 0),
  'game-show-city/chill-zone': ("Space Jazz", 0),
  'game-show-city/elimination': ("Canon In D Interstellar Mix", 0),
  'game-show-city/recap': ("Happy Happy Game Show", 0),
  'game-show-city/interview': ("Screen Saver", 0),
  'ice-river/opener': ("Mary Celeste", 0),
  'ice-river/travel': ("Enchanted Journey", 0),
  'ice-river/challenge': ("Marty Gots a Plan", 0),
  'ice-river/struggle': ("Vanishing", 0),
  'ice-river/chill-zone': ("Dama-May", 0),
  'ice-river/elimination': ("Plaint", 0),
  'ice-river/recap': ("Strength of the Titans", 0),
  'ice-river/interview': ("Decline", 0),
  'snow-peaks/opener': ("Meanwhile in Bavaria", 0),
  'snow-peaks/travel': ("No Spam Polka", 0),
  'snow-peaks/challenge': ("Manic Polka", 0),
  'snow-peaks/struggle': ("Dvorak Polka", 0),
  'snow-peaks/chill-zone': ("Snare Bounce Polka", 0),
  'snow-peaks/elimination': ("Double Polka", 0),
  'snow-peaks/recap': ("Ultra Polka", 0),
  'snow-peaks/interview': ("Four Beers' Polka", 0),
  'jungle-ruins/opener': ("The Sky of our Ancestors", 0),
  'jungle-ruins/travel': ("Fearless First", 0),
  'jungle-ruins/challenge': ("River of Io", 0),
  'jungle-ruins/struggle': ("Crypto", 0),
  'jungle-ruins/chill-zone': ("On My Way", 0),
  'jungle-ruins/elimination': ("Heavy Heart", 0),
  'jungle-ruins/recap': ("Malicious", 0),
  'jungle-ruins/interview': ("Carpe Diem", 0),
  'glass-pyramid-city/opener': ("Grand Dark Waltz Allegro", 0),
  'glass-pyramid-city/travel': ("Starting Out Waltz Allegretto", 0),
  'glass-pyramid-city/challenge': ("Realizer", 0),
  'glass-pyramid-city/struggle': ("Fantasia Fantasia", 0),
  'glass-pyramid-city/chill-zone': ("Deuces", 0),
  'glass-pyramid-city/elimination': ("Valse Gymnopedie", 0),
  'glass-pyramid-city/recap': ("Cloud Dancer", 0),
  'glass-pyramid-city/interview': ("Getting it Done", 0),
  'fishing-cove/opener': ("Music to Delight", 0),
  'fishing-cove/travel': ("Salty Ditty", 0),
  'fishing-cove/challenge': ("Thatched Villagers", 0),
  'fishing-cove/struggle': ("Netherworld Shanty", 0),
  'fishing-cove/chill-zone': ("Cold Sober", 0),
  'fishing-cove/elimination': ("Teddy Bear Waltz", 0),
  'fishing-cove/recap': ("Poofy Reel", 0),
  'fishing-cove/interview': ("Minstrel Guild", 0),
  'cliff-pool-isle/opener': ("Montego", 0),
  'cliff-pool-isle/travel': ("Maccary Bay", 0),
  'cliff-pool-isle/challenge': ("Upbeat Forever", 0),
  'cliff-pool-isle/struggle': ("Yallahs", 0),
  'cliff-pool-isle/chill-zone': ("Chee Zee Beach", 0),
  'cliff-pool-isle/elimination': ("Clear Air", 0),
  'cliff-pool-isle/recap': ("Slow Ska Game Loop", 0),
  'cliff-pool-isle/interview': ("Dub Feral", 0),
  'twin-tower-bridge/opener': ("Grand Dark Waltz Allegretto", 0),
  'twin-tower-bridge/travel': ("Half Mystery", 0),
  'twin-tower-bridge/challenge': ("March of the Spoons", 0),
  'twin-tower-bridge/struggle': ("Magic Forest", 0),
  'twin-tower-bridge/chill-zone': ("Devonshire Waltz Moderato", 0),
  'twin-tower-bridge/elimination': ("Crinoline Dreams", 0),
  'twin-tower-bridge/recap': ("Fox Tale Waltz Part 1 Instrumental", 0),
  'twin-tower-bridge/interview': ("Grand Dark Waltz Trio Allegro", 0),
  'marble-temple-hill/opener': ("Greko (Sketch)", 0),
  'marble-temple-hill/travel': ("Call to Adventure", 0),
  'marble-temple-hill/challenge': ("Take a Chance", 0),
  'marble-temple-hill/struggle': ("Rynos Theme", 0),
  'marble-temple-hill/chill-zone': ("Royal Coupling", 0),
  'marble-temple-hill/elimination': ("Tempting Secrets", 0),
  'marble-temple-hill/recap': ("Fanfare for Space", 0),
  'marble-temple-hill/interview': ("Soaring", 0),
  'secret-base-desert/opener': ("Phantom from Space", 0),
  'secret-base-desert/travel': ("Jerry Five", 0),
  'secret-base-desert/challenge': ("The Complex", 0),
  'secret-base-desert/struggle': ("Shadowlands 5 - Antechamber", 0),
  'secret-base-desert/chill-zone': ("Space 1990-B", 0),
  'secret-base-desert/elimination': ("Clean Soul", 0),
  'secret-base-desert/recap': ("Android Sock Hop", 0),
  'secret-base-desert/interview': ("Space 1990", 0),
  'fjord-sea/opener': ("The Britons", 0),
  'fjord-sea/travel': ("Village Consort", 0),
  'fjord-sea/challenge': ("Crunk Knight", 0),
  'fjord-sea/struggle': ("Death and Axes", 0),
  'fjord-sea/chill-zone': ("Master of the Feast", 0),
  'fjord-sea/elimination': ("Suonatore di Liuto", 0),
  'fjord-sea/recap': ("Club Seamus", 0),
  'fjord-sea/interview': ("Lord of the Land", 0),
  'great-falls/opener': ("Canon in D for Two Harps", 0),
  'great-falls/travel': ("Evening", 0),
  'great-falls/challenge': ("Thinking Music", 0),
  'great-falls/struggle': ("Crossing the Chasm", 0),
  'great-falls/chill-zone': ("Ashton Manor", 0),
  'great-falls/elimination': ("Bittersweet", 0),
  'great-falls/recap': ("Monkeys Spinning Monkeys", 0),
  'great-falls/interview': ("Smooth Lovin", 0),
  'bamboo-wall-hills/opener': ("Eastern Thought", 0),
  'bamboo-wall-hills/travel': ("Tea Roots", 0),
  'bamboo-wall-hills/challenge': ("Ujangong Mix", 0),
  'bamboo-wall-hills/struggle': ("Chanter", 0),
  'bamboo-wall-hills/chill-zone': ("Senbazuru", 0),
  'bamboo-wall-hills/elimination': ("That Zen Moment", 0),
  'bamboo-wall-hills/recap': ("Monkoto", 0),
  'bamboo-wall-hills/interview': ("Moonstone", 0),
  'grass-savanna/opener': ("At The Shore", 0),
  'grass-savanna/travel': ("Bumba Crossing", 0),
  'grass-savanna/challenge': ("Digya", 0),
  'grass-savanna/struggle': ("Constance", 0),
  'grass-savanna/chill-zone': ("Slow Heat", 0),
  'grass-savanna/elimination': ("Adding the Sun", 0),
  'grass-savanna/recap': ("Jaunty Gumption", 0),
  'grass-savanna/interview': ("Easy Lemon", 0),
  'stone-head-island/opener': ("Naraina", 0),
  'stone-head-island/travel': ("Windswept", 0),
  'stone-head-island/challenge': ("Tafi Maradi no voice", 0),
  'stone-head-island/struggle': ("Bump in the Night", 0),
  'stone-head-island/chill-zone': ("Temple of the Manes", 0),
  'stone-head-island/elimination': ("Summer Day", 0),
  'stone-head-island/recap': ("Townie Loop", 0),
  'stone-head-island/interview': ("Ancient Mystery Waltz (Vivace)", 0),
  'badlands/opener': ("Southern Gothic", 0),
  'badlands/travel': ("Wagon Wheel", 0),
  'badlands/challenge': ("Western Streets", 0),
  'badlands/struggle': ("Crowd Hammer", 0),
  'badlands/chill-zone': ("Almost Bliss", 0),
  'badlands/elimination': ("Anamalie", 0),
  'badlands/recap': ("Funin and Sunin", 0),
  'badlands/interview': ("Inspired", 0),
  # the race's own (stings are (title, at, seconds))
  'race/logo': ('Discovery Hit', 0, 5), 'race/title': ('NewsSting', 0, 3.5), 'race/donbox': ('Loping Sting', 0, 4.5),
  'race/boomerang': ('Danse Macabre - Big Hit 1', 0, 4.5), 'race/penalty': ('Der Kleber Sting', 0, 6), 'race/eliminated': ('Darkness Speaks', 0, 6),
  'race/safe': ('Light Sting', 0, 5), 'race/placement': ('Gustav Sting', 0, 2.5), 'race/winners': ('The Curtain Rises', 0, 7),
  'race/flight': ('Airport Lounge', 0, 50), 'race/finale': ('At Launch', 0, 50), 'race/theme': ('Cool Rock', 0, 40),
}
STINGS = {'logo', 'title', 'donbox', 'boomerang', 'penalty', 'eliminated', 'safe', 'placement', 'winners'}
SR = 44100

def fetch(cache, filename, need_bytes):
  path = os.path.join(cache, filename)
  if os.path.exists(path) and os.path.getsize(path) >= min(need_bytes, 200000): return path
  url = SRC + urllib.parse.quote(filename)
  req = urllib.request.Request(url, headers={'User-Agent': UA, 'Range': f'bytes=0-{need_bytes - 1}'})
  with urllib.request.urlopen(req, timeout=60) as r: data = r.read()
  with open(path, 'wb') as f: f.write(data)
  time.sleep(4)          # polite: one file at a time, a pause between
  return path

def decode(path, seconds):
  # a Range download ends mid-frame: decode frame by frame and keep what decodes
  out = []
  try:
    for chunk in miniaudio.stream_file(path, output_format=miniaudio.SampleFormat.FLOAT32, nchannels=1, sample_rate=SR, frames_to_read=SR):
      out.append(np.frombuffer(chunk, dtype=np.float32) if not isinstance(chunk, np.ndarray) else chunk)
      if sum(len(c) for c in out) >= seconds * SR: break
  except Exception:
    pass
  return np.concatenate(out).astype(np.float32) if out else np.zeros(0, np.float32)

# ── where the music repeats (2026-10-21) ─────────────────────────────────
# A bed used to be the track's first `len` seconds with its tail blended over its intro: two passages out of time with
# each other for 3 s every time round, and the encoder's silence at both ends of the mp3 (no gapless header) a hole
# on top. Now the loop is found: the stretch of the track whose end sounds like its start (the bands of the spectrum
# a few seconds either side, compared at every start and every length near `len`), then set to the sample where the
# two line up. The file carries a second of the music before the loop and the loop's own first second after it, and
# the viewer loops between the two points (music-have.js LOOP), so the decoder's silence is never played.
HOP, NFFT, PRE = 1024, 4096, 1.0

def _bands(x):
  win = np.hanning(NFFT).astype(np.float32)
  edges = np.unique(np.round(np.geomspace(60, 9000, 49) * NFFT / SR).astype(int))
  out, nfr = [], max(0, (len(x) - NFFT) // HOP)
  for c in range(0, nfr, 512):
    idx = (np.arange(c, min(nfr, c + 512)) * HOP)[:, None] + np.arange(NFFT)[None, :]
    p = np.abs(np.fft.rfft(x[idx] * win, axis=1)) ** 2
    out.append(np.stack([p[:, lo:hi].sum(1) for lo, hi in zip(edges[:-1], edges[1:])], 1))
  f = np.log(np.concatenate(out) + 1e-6) if out else np.zeros((0, 1))
  return f

def find_loop(x, target, at=0.0, window=3.0):
  """(start, length) in samples: the loop of about `target` seconds whose end runs on into its start."""
  F = _bands(x)
  e = F.mean(1)
  F = F - F.mean(0)
  F /= np.linalg.norm(F, axis=1, keepdims=True) + 1e-9
  n, W = len(F), int(window * SR / HOP)
  a_min = int(max(at, 4.0, PRE + 0.5) * SR / HOP) + W
  loud = e > np.median(e) - 3.0                                     # never a quiet stretch matching a quiet stretch
  best = (-9, 0, 0)
  lo, hi = int(target * 0.6 * SR / HOP), int(target * 1.5 * SR / HOP)
  hi = min(hi, n - W - a_min - int(PRE * SR / HOP) - 2)
  lo = min(lo, hi)
  if hi < int(15 * SR / HOP): raise ValueError('too short for a loop')
  for L in range(lo, hi + 1):
    s = np.sum(F[:n - L] * F[L:], 1)                                # how alike t and t+L sound
    c = np.concatenate([[0], np.cumsum(s)])
    t = np.arange(a_min, n - L - W)
    if not len(t): continue
    # (the second either side of the loop point counts as much as the few seconds around it)
    w = max(1, W // 3)
    score = 0.5 * (c[t + W] - c[t - W]) / (2 * W) + 0.5 * (c[t + w] - c[t - w]) / (2 * w) - 0.04 * abs(L * HOP / SR / target - 1)
    score = np.where(loud[t] & loud[t + L], score, score - 1)        # (a quiet match only when nothing else)
    k = int(np.argmax(score))
    if score[k] > best[0]: best = (score[k], int(t[k]), L)
  _, a, L = best
  if not L: raise ValueError('no loop found')
  find_loop.score = float(best[0])
  a0, L0 = a * HOP + NFFT // 2, L * HOP
  # to the sample: where the music at the end lines up with the music at the start
  N, R = int(0.4 * SR), 2 * HOP
  ref = x[a0 - N:a0 + N].astype(np.float64)
  seg = x[a0 + L0 - R - N:a0 + L0 + R + N].astype(np.float64)
  m = len(seg) + len(ref)
  cor = np.fft.irfft(np.fft.rfft(seg, m) * np.conj(np.fft.rfft(ref, m)), m)[:len(seg) - len(ref) + 1]
  en = np.sqrt(np.convolve(seg ** 2, np.ones(len(ref)), 'valid')) + 1e-9
  d = int(np.argmax(cor / en)) - R
  return a0, L0 + d

def make_bed(x, a, n, xf=0.12):
  """The file and its loop points (s): a second of the music before the loop, the loop, the loop's first second again."""
  r, f = int(PRE * SR), int(xf * SR)
  body = x[a:a + n].copy()
  ramp = np.linspace(0, 1, f, dtype=np.float32)
  # the last moment of the loop eases into what comes just before its start, so going round is the music going on
  body[n - f:] = x[a + n - f:a + n] * (1 - ramp) + x[a - f:a] * ramp
  y = np.concatenate([x[a - r:a], body, body[:r]]).astype(np.float32)
  return y, (r / SR, (r + n) / SR)

def seam_off(y, loop, h=int(0.05 * SR)):
  """dB the last 0.6 s of the loop is off from the music that leads into its start (0: going round sounds like the piece)."""
  i, j = round(loop[0] * SR), round(loop[1] * SR)
  r = lambda v: 20 * np.log10(np.sqrt(np.mean(v ** 2)) + 1e-9)
  return float(np.mean([abs(r(y[i - m * h:i - (m - 1) * h]) - r(y[j - m * h:j - (m - 1) * h])) for m in range(1, 13)]))

def level(x, target_db):
  rms = np.sqrt(np.mean(x ** 2)) + 1e-9
  g = 10 ** (target_db / 20) / rms
  peak = np.max(np.abs(x)) * g
  if peak > 0.95: g *= 0.95 / peak        # never clip: a hot track is played up by `lift` instead
  return x * g, round(20 * np.log10(max(1e-9, 10 ** (target_db / 20) / (np.sqrt(np.mean((x * g) ** 2)) + 1e-9))), 1)

def encode(x, path):
  pcm = (np.clip(x, -1, 1) * 32767).astype('<i2').tobytes()
  enc = lameenc.Encoder(); enc.set_bit_rate(64); enc.set_in_sample_rate(SR); enc.set_channels(1); enc.set_quality(2)
  data = enc.encode(pcm) + enc.flush()
  os.makedirs(os.path.dirname(path), exist_ok=True)
  with open(path, 'wb') as f: f.write(data)

def main():
  cache = sys.argv[1]; os.makedirs(cache, exist_ok=True)
  only = set(sys.argv[2:])
  pieces = {p['title']: p for p in json.load(open(os.path.join(cache, 'pieces.json'), encoding='utf8'))}
  cpath = os.path.join(OUT, 'credits.json')
  credits = json.load(open(cpath, encoding='utf8')) if os.path.exists(cpath) else {}
  for slot, pick in PICKS.items():
    if only and slot not in only: continue
    title, at = pick[0], pick[1]
    name = slot.split('/')[1]
    sting = slot.startswith('race/') and name in STINGS
    seconds = pick[2] if len(pick) > 2 else LEN.get(name, 45)
    p = pieces.get(title)
    if not p: print('NO SUCH PIECE', slot, title); continue
    try:
      raw = fetch(cache, p['filename'], 3_200_000)
      # a sting is cut from `at`; a bed is looked for in all of what was fetched, from `at` on
      x = decode(raw, at + seconds + 1)[int(at * SR):] if sting else decode(raw, 300)
    except Exception as e:
      print('FAILED', slot, title, e); continue
    if len(x) < SR * 3: print('TOO SHORT', slot, title, len(x) / SR); continue
    if sting:
      x = x[: int(seconds * SR)]
      n = min(len(x), int(0.6 * SR)); x[-n:] *= np.linspace(1, 0, n) ** 2
      x, lift = level(x, -14)
      loop, cut = None, f'{at}s + {seconds}s'
    else:
      try:
        a, n = find_loop(x, seconds, at)
      except ValueError as e:
        print('NO LOOP', slot, title, len(x) / SR, e); continue
      # (music that never quite comes round again is eased into its start over a beat or two, not cut on the sample)
      y, loop = make_bed(x, a, n, 0.12 if find_loop.score >= 0.6 else 1.5)
      if find_loop.score >= 0.6 and seam_off(y, loop) > 3: y, loop = make_bed(x, a, n, 1.5)
      x, lift = level(y, -17)
      cut = f'{a / SR:.2f}s + {n / SR:.2f}s, looped where it repeats (match {find_loop.score:.2f})'
    lift = float(round(float(lift), 1))
    out = os.path.join(OUT, slot + '.mp3')
    encode(x, out)
    credits[slot + '.mp3'] = {'title': title, 'author': 'Kevin MacLeod', 'source': 'https://incompetech.com/music/royalty-free/index.html?isrc=' + (p.get('isrc') or ''),
      'file': SRC + urllib.parse.quote(p['filename']), 'license': 'CC BY 4.0', 'licenseUrl': 'https://creativecommons.org/licenses/by/4.0/',
      'cut': cut, 'lift': lift, **({'loop': [round(loop[0], 6), round(loop[1], 6)]} if loop else {})}
    print(f'{slot:34} {title:30} {len(x) / SR:5.1f}s {os.path.getsize(out) // 1024:4d} KB lift {lift}')
    json.dump(credits, open(cpath, 'w', encoding='utf8'), indent=1)
  # the credits, readable
  lines = ['# The Ridonculous Race: music credits', '',
    'Every file here is cut from a piece by Kevin MacLeod (incompetech.com), licensed under Creative Commons:',
    'By Attribution 4.0 (https://creativecommons.org/licenses/by/4.0/). Each was trimmed to a loop (or a sting),',
    'levelled and re-encoded as mono 64 kbps mp3 by `tools/rr-vp-audio.py`; the music itself is unchanged.', '',
    '| File | Title | Author | Source | License | Cut |', '|---|---|---|---|---|---|']
  for f in sorted(credits):
    c = credits[f]
    lines.append(f"| `{f}` | \"{c['title']}\" | {c['author']} (incompetech.com) | {c['file']} | [{c['license']}]({c['licenseUrl']}) | {c['cut']} |")
  open(os.path.join(OUT, 'CREDITS.md'), 'w', encoding='utf8').write('\n'.join(lines) + '\n')

if __name__ == "__main__":
  main()

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
    xf = 0 if sting else 3.0
    try:
      raw = fetch(cache, p['filename'], 3_200_000)
      x = decode(raw, at + seconds + xf + 1)[int(at * SR):]
    except Exception as e:
      print('FAILED', slot, title, e); continue
    if len(x) < SR * 3: print('TOO SHORT', slot, title, len(x) / SR); continue
    if sting:
      x = x[: int(seconds * SR)]
      n = min(len(x), int(0.6 * SR)); x[-n:] *= np.linspace(1, 0, n) ** 2
      x, lift = level(x, -14)
    else:
      body = int(min(seconds, len(x) / SR - xf) * SR); t = int(xf * SR)
      y = x[:body].copy()
      if len(x) >= body + t and t:
        # the tail after the cut fades out over the start, which fades in under it: the loop point is seamless
        ramp = np.linspace(0, 1, t, dtype=np.float32)
        y[:t] = x[:t] * np.sqrt(ramp) + x[body:body + t] * np.sqrt(1 - ramp)
      x, lift = level(y, -17)
    lift = float(round(float(lift), 1))
    out = os.path.join(OUT, slot + '.mp3')
    encode(x, out)
    credits[slot + '.mp3'] = {'title': title, 'author': 'Kevin MacLeod', 'source': 'https://incompetech.com/music/royalty-free/index.html?isrc=' + (p.get('isrc') or ''),
      'file': SRC + urllib.parse.quote(p['filename']), 'license': 'CC BY 4.0', 'licenseUrl': 'https://creativecommons.org/licenses/by/4.0/',
      'cut': f'{at}s + {seconds}s', 'lift': lift}
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

main()

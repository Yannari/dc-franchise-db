# No-cache dev server for the simulator — now with Casting Studio write endpoints.
#
# Why the no-cache part exists: `python -m http.server` sends only Last-Modified,
# so browsers apply HEURISTIC caching — a module untouched for a week gets cached
# for ~14 hours without revalidation. With agents editing modules daily this
# produced "the requested module does not provide an export" ghosts and invisible
# UI changes until caches were manually cleared. Cache-Control: no-store makes
# every plain refresh pick up the current files.
#
# Why the write endpoints exist: the Casting Studio (js/studio.js) authors new
# franchise characters in the browser. A browser page cannot write repo files, so
# it POSTs to this server, which writes them for you on disk:
#   POST /api/character  {roster:{...}, voice:{name,text}, avatar:{slug,dataUri}}
#     -> upserts into franchise_roster.json + voice-profiles.json + assets/avatars/<slug>.png
#   GET  /api/ping       -> {ok:true, roster:<count>}  (studio uses this to detect the server)
#   GET  /api/avatars    -> {avatars:[<slug>, ...]}    (library picker)
# Everything is same-origin, so no CORS dance is needed.
#
# Usage:  python serve.py [port]     (default 8080)
# Then open http://localhost:8080/simulator.html
import http.server
import sys
import os
import json
import base64
import re
import datetime

ROOT = os.getcwd()
ROSTER_PATH = os.path.join(ROOT, 'franchise_roster.json')
VOICE_PATH = os.path.join(ROOT, 'voice-profiles.json')
AVATAR_DIR = os.path.join(ROOT, 'assets', 'avatars')
SLUG_RE = re.compile(r'^[a-z0-9][a-z0-9-]*$')

ROSTER_FIELDS = ('name', 'slug', 'gender', 'sexuality', 'archetype', 'stats')


def _read_json(path, default):
    try:
        with open(path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except (OSError, ValueError):
        return default


def _write_json(path, data):
    # indent=2 + ensure_ascii=False matches the existing file style, so diffs stay minimal
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write('\n')


def _clean_roster_entry(entry):
    out = {}
    for k in ROSTER_FIELDS:
        if k in entry and entry[k] not in (None, ''):
            out[k] = entry[k]
    return out


def write_life_events(payload):
    """Replace life_events.json with the inbox's decisions.

    The whole log is sent and the whole file is rewritten, rather than patching
    individual rows: the inbox is the only thing that edits this file, it always
    holds every row, and a partial write is how two writers end up disagreeing
    about which events are canon.

    Validated before it lands. An event with no player or an unknown status is a
    bug in the caller, and writing it would put a row on disk that nothing can
    render and nobody can approve.
    """
    events = payload.get('events')
    if not isinstance(events, list):
        raise ValueError('events must be a list')
    for i, e in enumerate(events):
        if not isinstance(e, dict):
            raise ValueError('event %d is not an object' % i)
        if not (e.get('player') or '').strip():
            raise ValueError('event %d has no player' % i)
        if not (e.get('kind') or '').strip():
            raise ValueError('event %d has no kind' % i)
        if e.get('status') not in ('approved', 'proposed', 'rejected'):
            raise ValueError('event %d has status %r' % (i, e.get('status')))

    path = os.path.join(ROOT, 'life_events.json')
    doc = {}
    if os.path.exists(path):
        with open(path, 'r', encoding='utf-8') as fh:
            doc = json.load(fh)
    doc['events'] = events
    with open(path, 'w', encoding='utf-8') as fh:
        fh.write(json.dumps(doc, ensure_ascii=False, indent=2) + '\n')
    counts = {}
    for e in events:
        counts[e['status']] = counts.get(e['status'], 0) + 1
    return {'ok': True, 'wrote': ['life_events.json'], 'counts': counts}


def write_season_ratings(payload):
    """Merge TV ratings into seasons_database.json.

    The seasons page renders that index, not the per-season documents, so a
    rating written only into a season document never reaches the badge. The
    index has no episode records in it and never will, so it cannot derive a
    rating either — the simulator computes it from a saved season and posts
    the result here.

    MERGED, never rewritten. Only the `ratings` key of a matched season is
    touched; every other field and every unmatched season is left exactly as
    it was. A backfill that rewrote the file would silently drop any season
    whose save the browser happened not to have.
    """
    ratings = payload.get('ratings')
    if not isinstance(ratings, dict) or not ratings:
        raise ValueError('ratings must be a non-empty object keyed by seasonId')
    for key, r in ratings.items():
        if not isinstance(r, dict):
            raise ValueError('ratings[%r] is not an object' % key)
        if not isinstance(r.get('score'), (int, float)):
            raise ValueError('ratings[%r] has no numeric score' % key)
        tier = r.get('tier')
        if not isinstance(tier, dict) or not tier.get('label'):
            raise ValueError('ratings[%r] has no tier label' % key)

    path = os.path.join(ROOT, 'seasons_database.json')
    if not os.path.exists(path):
        raise ValueError('seasons_database.json not found')
    with open(path, 'r', encoding='utf-8') as fh:
        doc = json.load(fh)
    seasons = doc.get('seasons')
    if not isinstance(seasons, list):
        raise ValueError('seasons_database.json has no seasons list')

    matched, unmatched = [], []
    for key, r in ratings.items():
        hit = None
        for row in seasons:
            # By seasonId where there is one. A bare integer is Total Drama,
            # permanently, so a legacy row with no seasonId matches td-N.
            rid = row.get('seasonId') or ('td-%s' % row.get('seasonNumber'))
            if rid == key:
                hit = row
                break
        if hit is None:
            unmatched.append(key)
            continue
        hit['ratings'] = r
        matched.append(key)

    with open(path, 'w', encoding='utf-8') as fh:
        fh.write(json.dumps(doc, ensure_ascii=False, indent=2) + chr(10))
    return {'ok': True, 'wrote': ['seasons_database.json'],
            'rated': sorted(matched), 'unmatched': sorted(unmatched)}


def write_character(payload):
    """Upsert roster entry, voice profile, and avatar PNG. Returns a summary dict."""
    result = {'ok': True, 'wrote': []}

    roster_in = payload.get('roster') or {}
    slug = (roster_in.get('slug') or '').strip().lower()
    name = (roster_in.get('name') or '').strip()
    if not name:
        raise ValueError('character name is required')
    if not SLUG_RE.match(slug):
        raise ValueError('slug must be lowercase letters, digits, and dashes')

    # 1) franchise_roster.json
    roster_doc = _read_json(ROSTER_PATH, {'players': []})
    players = roster_doc.get('players')
    if not isinstance(players, list):
        players = []
        roster_doc['players'] = players
    entry = _clean_roster_entry(roster_in)
    idx = next((i for i, p in enumerate(players)
                if p.get('slug') == slug or p.get('name') == name), -1)
    if idx >= 0:
        players[idx] = {**players[idx], **entry}
    else:
        players.append(entry)
    _write_json(ROSTER_PATH, roster_doc)
    result['wrote'].append('franchise_roster.json')
    result['rosterCount'] = len(players)
    result['updated'] = idx >= 0

    # 2) voice-profiles.json (optional)
    voice = payload.get('voice') or {}
    vtext = (voice.get('text') or '').strip()
    vname = (voice.get('name') or name).strip()
    if vtext:
        vdoc = _read_json(VOICE_PATH, {'profiles': {}})
        if 'profiles' not in vdoc or not isinstance(vdoc['profiles'], dict):
            vdoc['profiles'] = {}
        vdoc['profiles'][vname] = vtext
        _write_json(VOICE_PATH, vdoc)
        result['wrote'].append('voice-profiles.json')

    # 3) avatar PNG (optional)
    avatar = payload.get('avatar') or {}
    data_uri = avatar.get('dataUri') or ''
    if data_uri.startswith('data:image'):
        # ── THE SLUG THE CALLER ASKED FOR ──
        #
        # This wrote `<roster slug>.png` and ignored `avatar['slug']` entirely.
        # Harmless while the only avatar a character had was their portrait —
        # and destructive the moment anything uploaded a VARIANT: the returnee
        # slot posted `jules-returnee` and the endpoint saved it over jules.png,
        # replacing the character's real portrait with their returnee art. It
        # then looked like a rendering bug, because every screen was correctly
        # drawing a base portrait that was no longer the base portrait.
        #
        # Validated rather than trusted: a slug is a filename here.
        want = (avatar.get('slug') or '').strip().lower()
        target = want if re.fullmatch(r'[a-z0-9][a-z0-9-]*', want or '') else slug
        raw = base64.b64decode(data_uri.split(',', 1)[1] if ',' in data_uri else '')
        os.makedirs(AVATAR_DIR, exist_ok=True)
        with open(os.path.join(AVATAR_DIR, target + '.png'), 'wb') as f:
            f.write(raw)
        result['wrote'].append('assets/avatars/%s.png' % target)
        # The browser marks a registered portrait "missing" off this inventory,
        # so a file uploaded here has to appear in it or the cast builder will
        # show it greyed out as missing while it sits on disk.
        if rewrite_available_files() is not None:
            result['wrote'].append('assets/avatars/available-files.json')

    return result


def list_avatars():
    try:
        return sorted(f[:-4] for f in os.listdir(AVATAR_DIR) if f.lower().endswith('.png'))
    except OSError:
        return []


def rewrite_available_files():
    """Regenerate assets/avatars/available-files.json from the files on disk.

    The browser uses this inventory to tell a registered portrait whose file is
    missing from one that is simply not loaded yet, WITHOUT probing every
    filename and filling the console with 404s. That makes it authoritative at
    runtime: art uploaded here but absent from the inventory shows up in the
    cast builder disabled and labelled "Missing file" while sitting on disk.

    This replaces the old returnee manifest, which answered a narrower question
    — "does <slug>-returnee.png exist?" — from back when a person could have
    exactly two portraits. Derived from the directory every time, so it cannot
    disagree with what is actually there. `node tools/gen-avatar-manifest.mjs
    --write-files` does the same job offline.
    """
    exts = ('.png', '.webp', '.jpg', '.jpeg', '.gif')
    try:
        files = sorted(f for f in os.listdir(AVATAR_DIR) if f.lower().endswith(exts))
    except OSError:
        return None
    path = os.path.join(AVATAR_DIR, 'available-files.json')
    payload = {'generatedAt': datetime.datetime.now(datetime.timezone.utc)
               .isoformat().replace('+00:00', 'Z'), 'files': files}
    with open(path, 'w', encoding='utf-8') as f:
        f.write(json.dumps(payload, indent=2) + chr(10))
    return files


class StudioHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

    def _send_json(self, obj, status=200):
        body = json.dumps(obj).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.path == '/api/ping':
            roster = _read_json(ROSTER_PATH, {'players': []})
            return self._send_json({'ok': True, 'roster': len(roster.get('players', []))})
        if self.path == '/api/avatars':
            return self._send_json({'avatars': list_avatars()})
        # The life log, in the same shape the Worker returns it. Both readers —
        # the inbox and the export hook — try this endpoint before the static
        # file, so without it a local checkout falls through to whatever was on
        # disk and quietly shows an older log than the one just written.
        if self.path == '/api/life-events':
            doc = _read_json(os.path.join(ROOT, 'life_events.json'), {'events': []})
            return self._send_json({'ok': True, 'events': doc.get('events', [])})
        return super().do_GET()

    def do_POST(self):
        if self.path not in ('/api/character', '/api/life-events', '/api/season-ratings'):
            return self._send_json({'ok': False, 'error': 'unknown endpoint'}, 404)
        try:
            length = int(self.headers.get('Content-Length', 0))
            payload = json.loads(self.rfile.read(length) or b'{}')
            if self.path == '/api/life-events':
                return self._send_json(write_life_events(payload))
            if self.path == '/api/season-ratings':
                return self._send_json(write_season_ratings(payload))
            return self._send_json(write_character(payload))
        except ValueError as e:
            return self._send_json({'ok': False, 'error': str(e)}, 400)
        except Exception as e:  # noqa: BLE001 - surface anything else to the client
            return self._send_json({'ok': False, 'error': 'server error: %s' % e}, 500)


if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
    # bind 0.0.0.0 explicitly: the modern default ('::') is IPv6-only on
    # Windows, which makes LAN addresses like 192.168.x.x refuse connections
    http.server.test(HandlerClass=StudioHandler, port=port, bind='0.0.0.0')

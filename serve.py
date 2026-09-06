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
CATALOG_PATH = os.path.join(AVATAR_DIR, 'portrait-catalog.json')
SEASONS_DIR = os.path.join(ROOT, 'data', 'seasons')
PORTRAIT_SLUG = r'[a-z0-9][a-z0-9-]*'   # a portrait id / filename stem
SLUG_RE = re.compile(r'^[a-z0-9][a-z0-9-]*$')

# 'drag' is the Drag Race craft block: seven 1-10 stats, a style, up to three
# traits and a persona voice, stored as a nested object. It is here for the same
# reason 'stats' is — a field this list does not name is dropped on every local
# save, which looks exactly like the field never having been typed.
ROSTER_FIELDS = ('name', 'slug', 'gender', 'sexuality', 'archetype', 'stats', 'drag')


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

    # 3) portraits (optional) — files AND their catalog entries, together
    #
    # A character can have any number of looks, scoped to a show. Each entry
    # may carry its own image; ones that only rename a label arrive without
    # one. Written before the single-avatar path below so a first save that
    # creates the character still registers its extra art.
    portraits = payload.get('portraits') or []
    for item in portraits:
        uri = item.get('dataUri') or ''
        fname = (item.get('file') or '').strip()
        if not uri.startswith('data:image'):
            continue
        if not re.fullmatch(PORTRAIT_SLUG + r'\.(png|webp|jpe?g|gif)', fname or ''):
            continue                      # apply_portraits reports it properly
        raw_bytes = base64.b64decode(uri.split(',', 1)[1] if ',' in uri else '')
        os.makedirs(AVATAR_DIR, exist_ok=True)
        with open(os.path.join(AVATAR_DIR, fname), 'wb') as f:
            f.write(raw_bytes)
        result['wrote'].append('assets/avatars/%s' % fname)

    if portraits or payload.get('removePortraits'):
        problems = apply_portraits(slug, portraits, payload.get('removePortraits'))
        result['wrote'].append('assets/avatars/portrait-catalog.json')
        if problems:
            # Reported rather than raised: the files and the roster row are
            # already written, and a silent partial success is how art ends up
            # on disk that nothing can pick.
            result['portraitProblems'] = problems
        if rewrite_available_files() is not None and                 'assets/avatars/available-files.json' not in result['wrote']:
            result['wrote'].append('assets/avatars/available-files.json')

    # 4) avatar PNG (optional)
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


def show_keys():
    """The valid `show` values, read out of js/shows.js so this cannot drift.

    js/shows.js is the only source of truth for show slugs, and a second copy
    of the list here is exactly the duplication docs/ADDING-A-SHOW.md is about.
    """
    try:
        with open(os.path.join(ROOT, 'js', 'shows.js'), encoding='utf-8') as f:
            src = f.read()
    except OSError:
        return []
    block = src[src.find('export const SHOWS'):]
    return re.findall(r"^  '?([a-z0-9-]+)'?:\s*\{", block, re.M)


def catalog_refs():
    """Every (playerSlug, avatarId) a saved season already committed to.

    A portrait an old season recorded cannot be unregistered without changing
    what that season draws, so removal is refused for these.
    """
    refs = set()
    if not os.path.isdir(SEASONS_DIR):
        return refs

    def walk(node):
        if isinstance(node, list):
            for item in node:
                walk(item)
        elif isinstance(node, dict):
            aid = node.get('avatarId')
            who = node.get('playerSlug') or node.get('slug')
            if aid and who:
                refs.add((who, aid))
            for value in node.values():
                walk(value)

    for name in os.listdir(SEASONS_DIR):
        if not name.endswith('.json'):
            continue
        try:
            with open(os.path.join(SEASONS_DIR, name), encoding='utf-8') as f:
                walk(json.load(f))
        except (OSError, ValueError):
            continue
    return refs


def apply_portraits(slug, portraits, removals):
    """Register a character's portraits in assets/avatars/portrait-catalog.json.

    The file has to exist before a season can pick the art: uploading an image
    puts it on disk, and the catalog is what makes it SELECTABLE. Doing both in
    one save is the point — art sitting in the folder that nothing can choose is
    the failure the old returnee manifest existed to prevent, and it came back
    the moment the two steps were separate.

    Rules enforced here rather than in the browser, because the browser is not
    the only writer:
      - a portrait id is stable: changing the FILE behind one rewrites what
        every season that recorded it already drew, so it is refused;
      - a label is free to change, because nothing keys off it;
      - an id a saved season references cannot be removed;
      - `show` must be a key from js/shows.js, or 'global'.
    """
    doc = _read_json(CATALOG_PATH, {'schemaVersion': 1, 'players': {}})
    doc.setdefault('schemaVersion', 1)
    players = doc.setdefault('players', {})
    valid_shows = set(show_keys()) | {'global'}
    refs = catalog_refs()
    problems = []

    entry = players.setdefault(slug, {'defaults': {}, 'portraits': []})
    entry.setdefault('defaults', {})
    entry.setdefault('portraits', [])
    by_id = {p.get('id'): p for p in entry['portraits'] if isinstance(p, dict)}

    # The profile default always exists: it is the character's own portrait,
    # and every other look is measured against it.
    if 'base' not in by_id:
        base = {'id': 'base', 'show': 'global', 'label': 'Profile default',
                'file': slug + '.png'}
        entry['portraits'].insert(0, base)
        by_id['base'] = base
    entry['defaults'].setdefault('global', 'base')

    for item in (portraits or []):
        pid = (item.get('id') or '').strip().lower()
        show = (item.get('show') or 'global').strip()
        label = (item.get('label') or '').strip()
        fname = (item.get('file') or '').strip()

        if not re.fullmatch(PORTRAIT_SLUG, pid or ''):
            problems.append('bad portrait id "%s"' % pid)
            continue
        if show not in valid_shows:
            problems.append('%s: unknown show "%s"' % (pid, show))
            continue
        if not label:
            problems.append('%s: needs a label' % pid)
            continue
        if not re.fullmatch(PORTRAIT_SLUG + r'\.(png|webp|jpe?g|gif)', fname or ''):
            problems.append('%s: unsafe filename "%s"' % (pid, fname))
            continue

        existing = by_id.get(pid)
        if existing:
            if existing.get('file') != fname:
                problems.append('%s: already points at %s — changing the file behind a '
                                'registered portrait rewrites the seasons that used it'
                                % (pid, existing.get('file')))
                continue
            # Re-filing under another show is allowed and is NOT a history
            # rewrite: a season that used this look recorded the file, and the
            # resolver prefers that snapshot, so its screens do not move. What
            # changes is which show's picker offers it from now on.
            if existing.get('show') != show:
                # ...but a default pointing at it from the show it just left
                # would dangle, and validation fails on that.
                entry['defaults'] = {k: v for k, v in entry['defaults'].items()
                                     if not (v == pid and k != show and k != 'global')}
            existing['label'] = label
            existing['show'] = show
        else:
            new = {'id': pid, 'show': show, 'label': label, 'file': fname}
            entry['portraits'].append(new)
            by_id[pid] = new

        if item.get('makeDefault') and show != 'global':
            entry['defaults'][show] = pid

    for pid in (removals or []):
        pid = (pid or '').strip().lower()
        if pid == 'base':
            problems.append('the profile default cannot be removed')
            continue
        if (slug, pid) in refs:
            problems.append('%s is recorded in a saved season and cannot be unregistered' % pid)
            continue
        entry['portraits'] = [p for p in entry['portraits'] if p.get('id') != pid]
        entry['defaults'] = {k: v for k, v in entry['defaults'].items()
                             if v != pid or k == 'global'}

    _write_json(CATALOG_PATH, doc)
    return problems


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

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
        # Returnee art is only ever used if the manifest lists it.
        if rewrite_returnee_manifest() is not None:
            result['wrote'].append('assets/avatars/returnee-manifest.json')

    return result


def list_avatars():
    try:
        return sorted(f[:-4] for f in os.listdir(AVATAR_DIR) if f.lower().endswith('.png'))
    except OSError:
        return []


def rewrite_returnee_manifest():
    """Regenerate assets/avatars/returnee-manifest.json from the files on disk.

    The manifest is AUTHORITATIVE at runtime — refreshReturneeAvatars does
    `manifest.has(base)` and never probes for a file once it has loaded — so an
    uploaded `<slug>-returnee.png` that is not listed here is silently never
    used. Until now the only thing that wrote it was `node
    tools/gen-returnee-manifest.mjs`, run by hand, which meant adding returnee
    art required editing the repo even though the upload endpoint had already
    put the file exactly where it belongs — and an upload that skipped that step
    left art sitting on disk that nothing would ever draw.

    Derived from the directory every time, so it cannot disagree with what is
    actually there. Same rule as the tools script, which stays for offline use.
    """
    try:
        slugs = sorted(f[:-len('-returnee.png')] for f in os.listdir(AVATAR_DIR)
                       if f.lower().endswith('-returnee.png'))
    except OSError:
        return None
    path = os.path.join(AVATAR_DIR, 'returnee-manifest.json')
    with open(path, 'w', encoding='utf-8') as f:
        f.write(json.dumps(slugs) + chr(10))
    return slugs


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
        return super().do_GET()

    def do_POST(self):
        if self.path != '/api/character':
            return self._send_json({'ok': False, 'error': 'unknown endpoint'}, 404)
        try:
            length = int(self.headers.get('Content-Length', 0))
            payload = json.loads(self.rfile.read(length) or b'{}')
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

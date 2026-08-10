# ══════════════════════════════════════════════════════════════════════
# upload_gallery_r2.py — push assets/gallery/ to Cloudflare R2
# ══════════════════════════════════════════════════════════════════════
#
# The gallery is not served from the repo any more. 592 MB of it took the
# published GitHub Pages site to 778 MB against a 1 GB limit and the builds
# stopped finishing — 28 of the last 30 failed, so nothing deployed at all for
# over an hour. Pages serves the app; R2 serves the pictures, through the Worker
# that was already deployed.
#
# fetch_gallery.py still writes into assets/gallery/ — that is the working copy,
# and localhost reads it directly. This pushes it to the bucket the live site
# reads. Run it after fetching new art:
#
#     python3 scripts/upload_gallery_r2.py
#
# It borrows wrangler's own OAuth token, so there is no second credential to
# create or store. `wrangler login` once and this works.
#
# `wrangler r2 object put` exists and is unusable at this scale: ~10 seconds of
# process startup per file, which is four hours for 1444 files. The REST API
# does the same job in two minutes.
import json
import mimetypes
import os
import re
import sys
import time
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor

BUCKET = 'dc-gallery'
ROOT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'assets', 'gallery')
WORKERS = 12


def wrangler_token():
    """Wherever wrangler put its config on this machine."""
    candidates = []
    for env_var in ('XDG_CONFIG_HOME', 'APPDATA'):
        base = os.environ.get(env_var)
        if base:
            candidates.append(os.path.join(base, 'xdg.config', '.wrangler', 'config', 'default.toml'))
            candidates.append(os.path.join(base, '.wrangler', 'config', 'default.toml'))
    candidates.append(os.path.expanduser('~/.wrangler/config/default.toml'))
    candidates.append(os.path.expanduser('~/.config/.wrangler/config/default.toml'))
    for path in candidates:
        if os.path.exists(path):
            text = open(path, encoding='utf-8').read()
            match = re.search(r'oauth_token\s*=\s*"([^"]+)"', text)
            if match:
                return match.group(1)
    sys.exit('No wrangler credentials found. Run `wrangler login` first.')


def account_id(token):
    req = urllib.request.Request('https://api.cloudflare.com/client/v4/accounts',
                                 headers={'Authorization': 'Bearer ' + token})
    return json.load(urllib.request.urlopen(req, timeout=30))['result'][0]['id']


def main():
    token = wrangler_token()
    acct = account_id(token)

    files = []
    for root, _, names in os.walk(ROOT):
        for name in names:
            path = os.path.join(root, name)
            key = os.path.relpath(path, ROOT).replace(os.sep, '/')
            files.append((path, key))
    files.sort()
    if not files:
        sys.exit('Nothing in %s' % ROOT)
    total = sum(os.path.getsize(p) for p, _ in files)
    print('%d files, %.0f MB -> r2://%s' % (len(files), total / 1024 / 1024, BUCKET), flush=True)

    state = {'n': 0, 'bytes': 0}
    fails = []
    started = time.time()

    def put(item):
        path, key = item
        data = open(path, 'rb').read()
        ctype = mimetypes.guess_type(path)[0] or 'application/octet-stream'
        url = ('https://api.cloudflare.com/client/v4/accounts/%s/r2/buckets/%s/objects/%s'
               % (acct, BUCKET, urllib.parse.quote(key)))
        for attempt in range(3):
            try:
                req = urllib.request.Request(url, data=data, method='PUT',
                    headers={'Authorization': 'Bearer ' + token, 'Content-Type': ctype})
                urllib.request.urlopen(req, timeout=180).read()
                state['n'] += 1
                state['bytes'] += len(data)
                if state['n'] % 150 == 0:
                    print('  %d/%d  %.0f MB  %.0fs' % (state['n'], len(files),
                          state['bytes'] / 1024 / 1024, time.time() - started), flush=True)
                return
            except Exception as err:                      # noqa: BLE001 - reported below
                if attempt == 2:
                    fails.append((key, str(err)[:90]))
                else:
                    time.sleep(1.5 * (attempt + 1))

    with ThreadPoolExecutor(max_workers=WORKERS) as pool:
        list(pool.map(put, files))

    print('UPLOADED %d/%d in %.0fs' % (state['n'], len(files), time.time() - started))
    if fails:
        print('FAILURES: %d' % len(fails))
        for key, err in fails[:10]:
            print('  ', key, err)
        sys.exit(1)


if __name__ == '__main__':
    main()

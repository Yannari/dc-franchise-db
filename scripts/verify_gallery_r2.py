# ══════════════════════════════════════════════════════════════════════
# verify_gallery_r2.py — is every local gallery file really in the bucket?
# ══════════════════════════════════════════════════════════════════════
#
# assets/gallery/ is git-ignored: it was never committed, so once it is deleted
# off this machine R2 is the ONLY copy. This is the check to run before doing
# that, and after any upload_gallery_r2.py run that reported failures.
#
#     python3 scripts/verify_gallery_r2.py
#
# It asks the public Worker rather than the Cloudflare API on purpose. The API
# would tell you whether an object exists in the bucket; the Worker tells you
# whether the live site can actually fetch it, which is the thing you care
# about — a file present but unreadable through the route the page uses is
# still a broken gallery. No credentials needed for the same reason.
#
# Compares presence AND size, because a truncated upload is the failure that
# looks like success in a listing.
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor

BASE = 'https://dc-studio.yannari19.workers.dev/gallery'
ROOT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'assets', 'gallery')
WORKERS = 16
UA = 'Mozilla/5.0 (verify_gallery_r2)'


def check(item):
    """(key, local_size) -> None when it matches, or a description of the problem."""
    key, size = item
    url = '%s/%s' % (BASE, urllib.parse.quote(key))
    try:
        # Cloudflare answers 403 to urllib's default `Python-urllib/3.x`, which
        # reads exactly like "the whole bucket is missing" — 1444 of them, when
        # the files were all present and served fine to curl.
        req = urllib.request.Request(url, method='HEAD', headers={'User-Agent': UA})
        with urllib.request.urlopen(req, timeout=60) as res:
            remote = res.headers.get('Content-Length')
            if remote is None:
                return (key, 'no Content-Length from the Worker')
            if int(remote) != size:
                return (key, 'size %s, local %s' % (remote, size))
            return None
    except urllib.error.HTTPError as err:
        return (key, 'HTTP %s' % err.code)
    except Exception as err:                              # noqa: BLE001 - reported below
        return (key, str(err)[:90])


def main():
    if not os.path.isdir(ROOT):
        sys.exit('No local gallery at %s — nothing to verify against.' % ROOT)
    files = []
    for root, _, names in os.walk(ROOT):
        for name in names:
            path = os.path.join(root, name)
            files.append((os.path.relpath(path, ROOT).replace(os.sep, '/'),
                          os.path.getsize(path)))
    files.sort()
    if not files:
        sys.exit('Nothing in %s' % ROOT)
    print('checking %d files against %s' % (len(files), BASE), flush=True)

    with ThreadPoolExecutor(max_workers=WORKERS) as pool:
        problems = [p for p in pool.map(check, files) if p]

    if not problems:
        print('OK — all %d files are readable from R2 at the right size.' % len(files))
        print('The local copy is now redundant and safe to delete.')
        return
    print('MISSING OR WRONG: %d of %d' % (len(problems), len(files)))
    for key, why in problems[:40]:
        print('  ', key, '-', why)
    if len(problems) > 40:
        print('   …and %d more' % (len(problems) - 40))
    print('\nDO NOT delete the local gallery. Re-run scripts/upload_gallery_r2.py first.')
    sys.exit(1)


if __name__ == '__main__':
    main()

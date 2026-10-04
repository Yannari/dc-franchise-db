"""
tools/bb-intro/render.py — render a Big Brother season's opening titles and closing.

    python tools/bb-intro/render.py bb-1          # from data/seasons/bb-1-data.json
    python tools/bb-intro/render.py --generic     # the logo-only fallback, no cast

Writes assets/bb/intro/<season>-intro.mp4 and <season>-outro.mp4 (or
generic-intro.mp4 / generic-outro.mp4). The viewer plays the season's own pair
when they exist and the generic pair when they do not (js/vp-bb-ep/titles.js).
Blender 5.1 runs headless; nothing here needs the Blender MCP bridge.
"""
import json, os, subprocess, sys, tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
BLENDER = os.environ.get('BLENDER', r'C:\Program Files\Blender Foundation\Blender 5.1\blender.exe')
SCRIPT = os.path.join(ROOT, 'tools', 'bb-intro', 'intro.py')
OUT = os.path.join(ROOT, 'assets', 'bb', 'intro')
THEME = os.path.join(ROOT, 'assets', 'audio', 'bb', 'theme.mp3')
ENDING = os.path.join(ROOT, 'assets', 'audio', 'bb', 'ending.mp3')
INTRO_SECONDS = 39.6      # the theme, trimmed, to the frame
OUTRO_SECONDS = 26.0


def season_cast(season_id):
    data = json.load(open(os.path.join(ROOT, 'data', 'seasons', f'{season_id}-data.json'), encoding='utf-8'))
    cast = []
    # Alphabetical, never by placement: the order on the wall must say nothing about who won.
    for p in sorted(data.get('placements', []), key=lambda p: p['name']):
        avatar = os.path.join(ROOT, 'assets', 'avatars', f"{p.get('playerSlug') or p['name'].lower()}.png")
        if os.path.exists(avatar):
            cast.append({'name': p['name'], 'avatar': avatar})
        else:
            print(f'  no portrait for {p["name"]}, left off the wall')
    title = data.get('title', 'Big Brother')
    main, _, sub = title.partition(':')
    return cast, main.strip(), sub.strip()


def render(kind, cast, title, subtitle, out):
    cfg = {'kind': kind, 'cast': cast, 'title': title, 'subtitle': subtitle,
           'audio': THEME if kind == 'intro' else ENDING,
           'seconds': INTRO_SECONDS if kind == 'intro' else OUTRO_SECONDS, 'out': out}
    with tempfile.NamedTemporaryFile('w', suffix='.json', delete=False, encoding='utf-8') as f:
        json.dump(cfg, f)
        path = f.name
    print(f'rendering {os.path.relpath(out, ROOT)} ({len(cast)} houseguests)')
    # --python-exit-code: a Python error inside Blender fails this run instead of passing silently
    subprocess.run([BLENDER, '-b', '--python-exit-code', '1', '-P', SCRIPT, '--', path], check=True, stdout=subprocess.DEVNULL)
    os.unlink(path)


def main():
    os.makedirs(OUT, exist_ok=True)
    if '--generic' in sys.argv:
        cast, title, sub, name = [], 'Big Brother', '', 'generic'
    else:
        name = sys.argv[1]
        cast, title, sub = season_cast(name)
    for kind in ('intro', 'outro'):
        render(kind, cast, title, sub, os.path.join(OUT, f'{name}-{kind}.mp4'))


if __name__ == '__main__':
    main()

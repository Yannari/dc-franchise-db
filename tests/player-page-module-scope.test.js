// ══════════════════════════════════════════════════════════════════════
// player-page-module-scope.test.js — "Player Not Found" for a player that is
// ══════════════════════════════════════════════════════════════════════
//
// "Export doesn't work for my drag race season, the pages of the queens are
// not created."
//
// They were created. The data was exported correctly, published correctly and
// deployed correctly — all fourteen queens are in players_database.json with
// the right ids, and the tab title on the broken page already said
// "Velvet Vixen – Profile", so the lookup had found her.
//
// Then the render threw:
//
//   ReferenceError: ageNow is not defined
//
// `ageNow` is exported from js/franchise-calendar.js, which is an ES MODULE.
// The bio block that calls it is in player.html's CLASSIC script, where a
// module export does not exist. The whole render is wrapped in a `.catch` that
// shows the "Player Not Found" panel, so a page that was entirely fine
// reported the player as not existing.
//
// It fires only when the roster entry HAS a birthdate, which is why the drag
// queens surfaced it — they were authored with one. It was never about the
// show: 58 of 208 roster entries have a birthdate and every one of those
// player pages was down, Gwen and Alejandro included.
//
// THE BUG CLASS, which is worth more than the one fix: a classic script
// calling something only a module has. It cannot be caught by reading either
// file alone, and the symptom names the wrong thing entirely.
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(ROOT, 'player.html'), 'utf8');

/** Every `<script type="module">` body in the page. */
function moduleBlocks(src) {
  const out = [];
  const re = /<script[^>]*type=["']module["'][^>]*>([\s\S]*?)<\/script>/g;
  let m;
  while ((m = re.exec(src))) out.push(m[1]);
  return out;
}
/** Everything that is NOT in a module block — the classic scripts. */
function classicSource(src) {
  return src.replace(/<script[^>]*type=["']module["'][^>]*>[\s\S]*?<\/script>/g, '');
}

/* What js/franchise-calendar.js exports. A classic script may only reach
   these through `window`, and only after the module tag has run. */
const CALENDAR_EXPORTS = readFileSync(join(ROOT, 'js', 'franchise-calendar.js'), 'utf8')
  .match(/export\s+function\s+([A-Za-z0-9_]+)/g)
  ?.map(s => s.replace(/export\s+function\s+/, '')) || [];

describe('the classic script cannot call a module export', () => {
  it('knows what the calendar exports', () => {
    expect(CALENDAR_EXPORTS, 'franchise-calendar.js exports nothing?')
      .toContain('ageNow');
  });

  it('never calls one bare', () => {
    const classic = classicSource(html);
    const bad = [];
    for (const fn of CALENDAR_EXPORTS) {
      /* A BARE CALL is the defect: `ageNow(x)` with no `window.` in front.
         `window.ageNow(x)` is the supported way and is what the fix uses. */
      const bare = new RegExp(`(^|[^.\\w])${fn}\\s*\\(`, 'g');
      let m;
      while ((m = bare.exec(classic))) {
        const at = classic.slice(Math.max(0, m.index - 60), m.index + 40)
          .replace(/\s+/g, ' ');
        bad.push(`${fn}: …${at}…`);
      }
    }
    expect(bad, `a classic script calls a module export directly:\n${bad.join('\n')}`)
      .toEqual([]);
  });

  it('puts on window whatever the classic script reaches for', () => {
    /* The other half: calling it through `window` only works if something
       actually assigned it. A guarded `window.ageNow?.()` that is never set
       is a silently missing age rather than a crash, which is worse to find. */
    const mods = moduleBlocks(html).join('\n');
    const classic = classicSource(html);
    for (const fn of CALENDAR_EXPORTS) {
      if (!new RegExp(`window\\.${fn}\\s*\\(`).test(classic)) continue;
      expect(mods, `the page calls window.${fn}() and no module block assigns it`)
        .toMatch(new RegExp(`window\\.${fn}\\s*=`));
      expect(mods, `window.${fn} is assigned but never imported`)
        .toMatch(new RegExp(`import\\s*\\{[^}]*\\b${fn}\\b[^}]*\\}`));
    }
  });
});

describe('the render cannot report a player it found as missing', () => {
  it('still has the catch that hid this, and the panel it shows', () => {
    /* Not arguing the catch away — a render that throws SHOULD fail visibly
       rather than leave a half-drawn page. The problem was that its message
       names the one thing that was not wrong. This case exists so the next
       person who sees "Player Not Found" reads this file. */
    expect(html).toMatch(/Player Not Found/);
    expect(html, 'the profile render is no longer guarded at all')
      .toMatch(/\.catch\s*\(\s*error\s*=>/);
  });
});

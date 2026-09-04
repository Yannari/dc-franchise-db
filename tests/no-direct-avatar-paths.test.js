// A screen may not rebuild a portrait path out of a name or a slug.
//
// It worked for years only because the returnee variant was smuggled into
// player.slug, so `assets/avatars/${p.slug}.png` picked it up by accident. With
// the portrait a per-season choice, a slug can no longer answer "which of this
// person's looks does this season use?" — anything that concatenates one is
// silently drawing the wrong face, and drawing it confidently.
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Files allowed to build the path themselves, each for a stated reason.
const ALLOW = new Map([
  ['js/avatar-registry.js', 'the resolver — it is the one place the path is built'],
  ['js/players.js', 'holds the legacy base-file fallback'],
  ['js/studio.js', 'an authoring tool: it browses raw files on purpose'],
  ['js/vp-coaches.js', 'a named last-resort fallback for somebody not in the cast'],
  ['js/franchise-ui.js', 'career-level pages resolve from stored season data'],
  ['js/social-page.js', 'career-level pages resolve from stored season data'],
  ['js/wiki-view.js', 'career-level pages resolve from stored season data'],
]);

// A host is not a player: no season appearance, no catalog entry, no choice to
// make. Their path stays a literal, and `hostSlug` comes from seasonConfig.
const HOST = /host/i;

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith('.js')) out.push(p);
  }
  return out;
}

describe('portrait paths', () => {
  it('no simulator or VP screen concatenates a player avatar path', () => {
    const offenders = [];
    for (const abs of walk(path.join(ROOT, 'js'))) {
      const rel = path.relative(ROOT, abs).replace(/\\/g, '/');
      if (ALLOW.has(rel)) continue;
      fs.readFileSync(abs, 'utf8').split('\n').forEach((line, i) => {
        if (!line.includes('assets/avatars/')) return;
        if (HOST.test(line)) return;
        if (/assets\/avatars\/[^"'`]*\$\{/.test(line) || /assets\/avatars\/['"`]\s*\+/.test(line)) {
          offenders.push(`${rel}:${i + 1}: ${line.trim().slice(0, 100)}`);
        }
      });
    }
    expect(offenders).toEqual([]);
  });

  it('the allowlist stays short and every entry still exists', () => {
    for (const rel of ALLOW.keys()) {
      expect(fs.existsSync(path.join(ROOT, rel)), `${rel} is allowlisted but gone`).toBe(true);
    }
    expect(ALLOW.size).toBeLessThanOrEqual(8);
  });

  it('the resolver is imported wherever portraits are drawn', () => {
    const missing = [];
    for (const abs of walk(path.join(ROOT, 'js'))) {
      const rel = path.relative(ROOT, abs).replace(/\\/g, '/');
      const src = fs.readFileSync(abs, 'utf8');
      if (!/\bplayerAvatarUrl\s*\(/.test(src)) continue;
      if (rel === 'js/players.js') continue;                 // defines it
      if (!/import \{[^}]*playerAvatarUrl[^}]*\} from '[^']*players\.js'/.test(src)) missing.push(rel);
    }
    expect(missing).toEqual([]);
  });
});

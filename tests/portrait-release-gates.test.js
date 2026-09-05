// The conditions that must hold before a portrait change ships.
//
// Each one is a way the old design failed, written down so it cannot come back
// quietly: a screen guessing a face from a name, a historical season losing the
// portrait it recorded, and — the one that motivated all of this — a checkbox
// about continuity deciding what somebody looks like.
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { setPortraitCatalog, resolvePortrait } from '../js/avatar-registry.js';
import { ensurePortraitSelection } from '../js/players.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

// Each page has exactly one resolver: the function allowed to build the path,
// because it is the one that reads what the season recorded before falling
// back to the old convention. Every other line must call it.
const PAGE_RESOLVERS = {
  'season_ref.html': ['srFace'],
  'seasons.html': ['faceSrc'],
  'franchise.html': ['careerFace'],
  'awards.html': ['faceSrc'],
  'devotees.html': ['careerFace'],
  'compare.html': ['careerFace'],
  'current-season.html': ['portraitFor', 'getCharacterAvatar'],
  'player.html': ['ppFaceSrc', 'portraitOf'],
};

/** Character ranges of the named functions' bodies, brace-matched. */
function bodyRanges(src, names) {
  const ranges = [];
  for (const name of names) {
    // `function f(`, `const f = (`, `const f = function`, and `const f = x =>`.
    const re = new RegExp('function ' + name + '\\s*\\(|' + name + '\\s*=\\s*(?:\\(|function|\\w+\\s*=>)', 'g');
    let m;
    while ((m = re.exec(src))) {
      const open = src.indexOf('{', m.index);
      if (open === -1) continue;
      let depth = 0;
      for (let i = open; i < src.length; i++) {
        if (src[i] === '{') depth++;
        else if (src[i] === '}' && --depth === 0) { ranges.push([m.index, i]); break; }
      }
    }
  }
  return ranges;
}

describe('release gates', () => {
  it('the committed catalog validates against the repo', () => {
    expect(() => execFileSync('node', ['tools/gen-avatar-manifest.mjs', '--check'], { cwd: ROOT }))
      .not.toThrow();
  });

  it('the returnee manifest is gone and nothing reads it', () => {
    expect(fs.existsSync(path.join(ROOT, 'assets/avatars/returnee-manifest.json'))).toBe(false);
    expect(fs.existsSync(path.join(ROOT, 'tools/gen-returnee-manifest.mjs'))).toBe(false);
    const readers = [...Object.keys(PAGE_RESOLVERS), 'js/players.js', 'js/cast-ui.js', 'js/studio.js', 'package.json', 'serve.py']
      .filter(f => read(f).includes('returnee-manifest'));
    expect(readers).toEqual([]);
  });

  it('no franchise page reconstructs a player portrait outside its resolver', () => {
    const offenders = [];
    for (const [file, resolvers] of Object.entries(PAGE_RESOLVERS)) {
      const src = read(file);
      const ranges = bodyRanges(src, resolvers);
      let at = 0;
      src.split('\n').forEach((line, i) => {
        const start = at; at += line.length + 1;
        if (!/assets\/avatars\/[^"'`]*\$\{/.test(line)) return;
        if (/host|HOST/.test(line)) return;             // a host has no appearance
        if (ranges.some(([a, b]) => start >= a && start <= b)) return;
        offenders.push(`${file}:${i + 1}: ${line.trim().slice(0, 90)}`);
      });
    }
    expect(offenders).toEqual([]);
  });

  it('no code path lets isReturnee choose artwork', () => {
    const suspects = [];
    for (const file of ['js/players.js', 'js/avatar-registry.js', 'js/cast-ui.js', 'js/cast-room.js']) {
      const src = read(file);
      // legacyPortraitSelection is the one sanctioned exception: it exists to
      // read records written before avatarId, and runs only for a player who
      // has no selection at all.
      const ranges = bodyRanges(src, ['legacyPortraitSelection']);
      let at = 0;
      src.split('\n').forEach((line, i) => {
        const start = at; at += line.length + 1;
        const code = line.trim();
        if (code.startsWith('//') || code.startsWith('*') || code.startsWith('/*')) return;
        if (!/isReturnee|_returneeAvatarOk/.test(code)) return;
        if (!/avatar|portrait|slug|art\b/i.test(code)) return;
        if (/delete player\._returneeAvatarOk/.test(code)) return;
        if (ranges.some(([a, b]) => start >= a && start <= b)) return;
        suspects.push(`${file}:${i + 1}: ${code.slice(0, 90)}`);
      });
    }
    expect(suspects).toEqual([]);
  });

  it('toggling returning status changes no artwork, at runtime', () => {
    setPortraitCatalog({
      schemaVersion: 1,
      players: {
        jules: {
          defaults: { global: 'base', 'total-drama': 'td-original' },
          portraits: [
            { id: 'base', show: 'global', label: 'Default', file: 'jules.png' },
            { id: 'td-original', show: 'total-drama', label: 'Original', file: 'jules.png' },
            { id: 'td-returnee', show: 'total-drama', label: 'Returning', file: 'jules-returnee.png' },
          ],
        },
      },
    }, ['jules.png', 'jules-returnee.png']);

    const p = { name: 'Jules', slug: 'jules', avatarId: 'td-returnee', avatarFile: 'jules-returnee.png', isReturnee: true };
    for (const flag of [false, true, false]) {
      p.isReturnee = flag;
      ensurePortraitSelection(p, 'total-drama');
      expect(p.avatarFile, `art moved when isReturnee became ${flag}`).toBe('jules-returnee.png');
    }
  });

  it('a historical season keeps its portrait after the defaults change', () => {
    const before = resolvePortrait({ playerSlug: 'jules', show: 'total-drama', avatarId: 'td-returnee', avatarFile: 'jules-returnee.png' });
    // Somebody re-points the show default at the other portrait.
    setPortraitCatalog({
      schemaVersion: 1,
      players: {
        jules: {
          defaults: { global: 'base', 'total-drama': 'base' },
          portraits: [
            { id: 'base', show: 'global', label: 'Default', file: 'jules.png' },
            { id: 'td-returnee', show: 'total-drama', label: 'Returning', file: 'jules-returnee.png' },
          ],
        },
      },
    }, ['jules.png', 'jules-returnee.png']);
    const after = resolvePortrait({ playerSlug: 'jules', show: 'total-drama', avatarId: 'td-returnee', avatarFile: 'jules-returnee.png' });
    expect(after.file).toBe(before.file);
    expect(after.source).toBe('season-snapshot');
  });

  it('a show-specific portrait never leaks into another show', () => {
    setPortraitCatalog({
      schemaVersion: 1,
      players: {
        jules: {
          defaults: { global: 'base' },
          portraits: [
            { id: 'base', show: 'global', label: 'Default', file: 'jules.png' },
            { id: 'bb-1', show: 'big-brother', label: 'House', file: 'jules-bb.png' },
          ],
        },
      },
    }, ['jules.png', 'jules-bb.png']);
    for (const show of ['total-drama', 'traitors', 'the-mole', undefined]) {
      expect(resolvePortrait({ playerSlug: 'jules', show }).file,
        `the Big Brother look leaked into ${show}`).toBe('jules.png');
    }
    expect(resolvePortrait({ playerSlug: 'jules', show: 'big-brother', avatarId: 'bb-1' }).file).toBe('jules-bb.png');
  });

  it('the adding-a-show doc tells a third show what to do about portraits', () => {
    const doc = read('docs/ADDING-A-SHOW.md');
    expect(doc).toContain('### Portraits');
    expect(doc).toContain('portrait-catalog.json');
    expect(doc).toMatch(/never select artwork from `isReturnee`/i);
  });
});

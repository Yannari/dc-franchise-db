// current-season.html draws the faces the simulator cast, not faces it guessed.
//
// Every image on this page used to come from slugify(name), which cannot know
// which of a player's portraits THIS season chose — so a returning player in
// new clothes was drawn in last season's, confidently, in the transcript of
// the episode that had just shown otherwise.
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(path.join(ROOT, 'current-season.html'), 'utf8');

describe('current-season.html portraits', () => {
  it('routes every player image through one resolver', () => {
    const offenders = [];
    html.split('\n').forEach((line, i) => {
      if (!/assets\/avatars\/[^"'`]*\$\{/.test(line)) return;
      // The resolver itself builds the path, and hosts keep a literal one.
      if (/host|HOST|characterName|keySimple|\bkey\b|\bfile\b|slugify\(name\)/.test(line)) return;
      offenders.push(`${i + 1}: ${line.trim().slice(0, 90)}`);
    });
    expect(offenders).toEqual([]);
    expect(html).toContain('function portraitFor(');
    expect(html).toContain('function refreshAppearanceMap(');
  });

  it('keeps the hosts on their own aliases', () => {
    // A host has no season appearance and no catalog entry; the transcript
    // addresses them by first name, and their files are roster slugs.
    expect(html).toContain('HOST_PORTRAITS');
    expect(html).toMatch(/'chris': 'chris-mclean'/);
    expect(html).toMatch(/'chef': 'chef-hatchet'/);
  });

  it('refuses an unsafe filename out of stored data', () => {
    expect(html).toContain('function _safePortraitFile(');
    const fn = html.slice(html.indexOf('function _safePortraitFile'),
      html.indexOf('function _safePortraitFile') + 260);
    expect(fn).toMatch(/\\\.\\\.|\.\.'|includes\('\.\.'\)/);
  });
});

describe('the transcript draws the same faces as the simulator', () => {
  it('reads the live cast, which the published database cannot know about', () => {
    // players_database.json holds FINISHED seasons only, so the season being
    // played right now is not in it — and this page fell through to the base
    // portrait for exactly the season the simulator was drawing custom art
    // for. The simulator's own cast is in localStorage on this same origin.
    expect(html).toContain("localStorage.getItem('simulator_cast')");
    expect(html).toContain("localStorage.getItem('simulator_config')");
  });

  it('scopes the live cast to its own season', () => {
    // Otherwise viewing episode 2 of season 1 paints today's cast over it.
    expect(html).toMatch(/Number\(cfg\.seasonNumber\) === Number\(season\)/);
  });

  it('publishes portraitFor, because this page is not one scope', () => {
    // getCharacterAvatar — the transcript's avatar helper — lives in a LATER
    // scope than portraitFor, so calling it bare threw ReferenceError on every
    // character in every episode render. The page defining slugify three times
    // in three scopes is the tell.
    expect(html).toContain('window.portraitFor = portraitFor;');
    const at = html.indexOf('function getCharacterAvatar');
    expect(at).toBeGreaterThan(-1);
    const body = html.slice(at, at + 900);
    expect(body, 'getCharacterAvatar calls portraitFor across a scope boundary')
      .not.toMatch(/[^.]\bportraitFor\(/);
    expect(body).toContain('window.portraitFor');
  });
});

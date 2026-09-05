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

describe('the airing season publishes its portraits', () => {
  const worker = fs.readFileSync(path.join(ROOT, 'worker/worker-studio.js'), 'utf8');
  const exporter = fs.readFileSync(path.join(ROOT, 'js/stats-export.js'), 'utf8');
  const schema = fs.readFileSync(path.join(ROOT, 'worker/live_season_schema.sql'), 'utf8');

  it('the snapshot carries the portrait each player was cast with', () => {
    const fn = exporter.slice(exporter.indexOf('export function extractLiveSeasonSnapshot'),
      exporter.indexOf('export function extractLiveSeasonSnapshot') + 3000);
    expect(fn).toContain('_portraitOf(name)');
  });

  it('the table has somewhere to put it', () => {
    expect(schema).toMatch(/avatar_file\s+TEXT/);
    expect(fs.existsSync(path.join(ROOT, 'worker/live_season_migration_portrait.sql'))).toBe(true);
  });

  it('a database without the migration still syncs the standings', () => {
    // The portraits are worth having and not worth taking the sync down with
    // them — the same rule the feed already follows one block below.
    expect(worker).toMatch(/no such column/i);
    expect(worker).toContain('portraitError');
    expect(worker).toContain('rowStmts');
  });

  it('validates the filename instead of trusting the client', () => {
    // The site renders this straight into an <img src>, so it is a filename
    // here in the same way a slug is one in the avatar endpoint.
    expect(worker).toContain('const safePortraitFile');
    expect(worker).toMatch(/safePortraitFile\(p\.avatarFile\)/);
  });

  it('the page reads the published snapshot, not just local storage', () => {
    // Everything else this page knows is local: the database has finished
    // seasons, and the simulator's cast lives in the browser it was played in.
    // Opened on a phone, neither answers for the season actually airing.
    expect(html).toContain('/api/live-season');
    expect(html).toContain('function loadLivePortraits(');
  });

  it('keeps the airing portraits off every other season', () => {
    // A cached snapshot for the airing season was merged into every season the
    // page rendered, so an old episode was drawn with today's faces.
    expect(html).toContain('livePortraitSeason');
    expect(html).toMatch(/Number\(livePortraitSeason\) === Number\(season\)/);
  });
});

describe('the faces are drawn again when a late source lands', () => {
  it('repaints after the map changes', () => {
    // The map is filled from three sources and two arrive LATE — the database
    // syncs over the network, and the airing season's snapshot is a second
    // fetch after it. The map updated and nothing repainted, so the Players
    // tab kept the face it had been built with: the guess made before either
    // answer arrived.
    expect(html).toContain('function repaintPortraits(');
    const load = html.slice(html.indexOf('function loadLivePortraits'),
      html.indexOf('function loadLivePortraits') + 1200);
    expect(load, 'the snapshot lands and nothing redraws').toContain('repaintPortraits()');
  });

  it('redraws the grid even when it has another writer', () => {
    // renderPlayersGrid is not the only thing that writes that element, so
    // "what it was last drawn with" can be empty while a cast is on screen.
    const fn = html.slice(html.indexOf('function repaintPortraits('),
      html.indexOf('function repaintPortraits(') + 900);
    expect(fn).toContain('_lastGridArgs');
    expect(fn, 'no fallback when the grid was drawn by something else')
      .toMatch(/CURRENT\.cast/);
  });

  it('redraws the surfaces that actually hold faces', () => {
    const fn = html.slice(html.indexOf('function repaintPortraits('),
      html.indexOf('function repaintPortraits(') + 900);
    for (const surface of ['renderPlayersGrid', 'renderSeasonControlRoom', 'renderCompass']) {
      expect(fn, `${surface} is not repainted`).toContain(surface);
    }
  });
});


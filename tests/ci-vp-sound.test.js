// ci-vp-sound.test.js — the sound of each Circle moment (Plan 5, spec 18.3).
// A bed per scene, a sting per moment, read off the step itself; the files
// are the user's own (docs/the-circle-music.md), and a missing file is silence
// for a bed and a synthesised sting for a moment.
import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { setPlayers } from '../js/core.js';
import { playCircleSeason } from '../js/ci/season.js';
import { circleScreens } from '../js/vp-ci/steps.js';
import { soundFor, bedFor, CI_BEDS, CI_STINGS } from '../js/vp-ci/sound.js';
import { BED_CATALOG, CUE_CATALOG } from '../js/audio.js';
import { rosterCast, circleSetup } from './helpers/ci-cast.js';
import { DEFAULT_POOL } from '../js/ci/default-pool.js';

const cast = rosterCast(13, 4); setPlayers(cast);
const names = cast.map(p => p.name);
const { rows } = playCircleSeason({ cast: names, setup: circleSetup(names), pool: DEFAULT_POOL, seed: 4 });
const screens = rows.flatMap(r => circleScreens(r));
const of = kind => screens.filter(s => s.kind === kind);

describe('every scene has a bed, every bed a file', () => {
  it('each kind on screen maps to a registered bed with its own file under assets/audio/circle/', () => {
    for (const s of screens) {
      const bed = bedFor(s);
      expect(bed, s.kind).toBeTruthy();
      expect(BED_CATALOG[bed], bed).toBeTruthy();
      expect(BED_CATALOG[bed].file).toMatch(/^assets\/audio\/circle\/[a-z0-9-]+\.mp3$/);
    }
  });
  it('every sting is a cue, with a file and a synth for when the file is not there', () => {
    for (const [name, s] of Object.entries(CI_STINGS)) {
      expect(CUE_CATALOG[name], name).toBeTruthy();
      for (const f of s.files) expect(f).toMatch(/^assets\/audio\/circle\/sfx\/[a-z0-9-]+\.mp3$/);
      expect(typeof s.synth).toBe('function');
    }
    expect(Object.keys(CI_BEDS).length).toBeGreaterThanOrEqual(12);
  });
});

describe('the moment makes the sound', () => {
  const find = (kind, re) => { for (const s of of(kind)) { const i = s.steps.findIndex(x => re.test(x.key || '')); if (i >= 0) return [s, i]; } return [null, -1]; };
  it('BLOCKED hits when the name is sent, and the music turns', () => {
    const [s, i] = find('blocking', /^(block\.announce\.|vote\.result)/);
    expect(soundFor(s, i)).toMatchObject({ cue: 'ci-blocked', bed: 'ci-after-block' });
    expect(soundFor(s, i - 1).cue).not.toBe('ci-blocked');
  });
  it('the Influencers are crowned; the places before them tick', () => {
    const [s, i] = find('ratings', /^result\.influencers$/);
    expect(soundFor(s, i).cue).toBe('ci-crown');
    const [s2, j] = find('ratings', /^result\.(top|middle|bottom)$/);
    expect(soundFor(s2, j).cue).toBe('ci-reveal');
  });
  it('an alert stings as it lands; a sent message whooshes', () => {
    const a = of('alert')[0];
    expect(soundFor(a, 0).cue).toBe('ci-alert');
    const chat = of('chat').find(s => s.steps.some(x => x.part === 'send'));
    expect(soundFor(chat, chat.steps.findIndex(x => x.part === 'send')).cue).toBe('ci-send');
  });
  it('the knock, the play button, the winner', () => {
    const [v, i] = find('visit', /^visit\.(door|sit)/);
    expect(soundFor(v, i).cue).toBe('ci-door');
    const g = of('goodbye')[0];
    expect(soundFor(g, g.steps.findIndex(x => x.part === 'video')).cue).toBe('ci-play');
    const [r, w] = find('reveal', /^reveal\.winner$/);
    expect(soundFor(r, w)).toMatchObject({ cue: 'ci-winner', bed: 'ci-winner' });
  });
  it('a game board ticks as answers land and sounds the reveal', () => {
    const games = of('game');
    const hits = games.flatMap(g => g.steps.map((_, i) => soundFor(g, i).cue)).filter(Boolean);
    expect(hits).toContain('ci-tick');
    expect(hits.some(c => c === 'ci-reveal' || c === 'ci-crown')).toBe(true);
  });
  it('a plain line of dialogue plays nothing over the bed', () => {
    const chat = of('chat')[0];
    const i = chat.steps.findIndex(x => x.part === 'say');
    expect(soundFor(chat, i).cue).toBeNull();
  });
});

describe('the download list (docs/the-circle-music.md) matches the code', () => {
  it('every bed and every sting the code looks for is on the list, under its own folder', () => {
    const doc = readFileSync('docs/the-circle-music.md', 'utf8');
    const beds = doc.split('## Stingers')[0], stings = doc.split('## Stingers')[1];
    for (const b of Object.values(CI_BEDS)) for (const f of b.files) expect(beds, f).toContain('`' + f + '`');
    for (const s of Object.values(CI_STINGS)) for (const f of s.files) expect(stings, f).toContain('`' + f.split('/').pop() + '`');
    expect((beds.match(/^\| \d+ \|/gm) || []).length).toBe(Object.keys(CI_BEDS).length);
    expect((stings.match(/^\| \d+ \|/gm) || []).length).toBe(Object.keys(CI_STINGS).length);
  });
});

describe("the user's tracks are in place", () => {
  it('every bed and sting file exists on disk', () => {
    const missing = [];
    for (const b of Object.values(CI_BEDS)) for (const f of b.files) if (!existsSync(`assets/audio/circle/${f}`)) missing.push(f);
    expect(missing).toEqual([]);
    const noSting = Object.entries(CI_STINGS).filter(([, s]) => !s.files.every(f => existsSync(f))).map(([k]) => k).sort();
    expect(noSting).toEqual([]);
  });
  it('a kind with several tracks spreads its screens over them, and a screen keeps its track', () => {
    const games = of('game');
    const picked = new Set(games.map(s => bedFor(s)));
    if (games.length >= 6) expect(picked.size).toBeGreaterThan(1);
    for (const s of games) expect(bedFor(s)).toBe(bedFor(s));
  });
});

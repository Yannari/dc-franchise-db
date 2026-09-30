// ci-vp-sound.test.js — the sound of each Circle moment (Plan 5, spec 18.3).
// A bed per scene, a sting per moment, read off the step itself; the files
// are the user's own (docs/the-circle-music.md), and a missing file is silence
// for a bed and a synthesised sting for a moment.
import { describe, expect, it } from 'vitest';
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
      expect(BED_CATALOG[bed].file).toMatch(/^assets\/audio\/circle\/[a-z-]+\.mp3$/);
    }
  });
  it('every sting is a cue, with a file and a synth for when the file is not there', () => {
    for (const [name, s] of Object.entries(CI_STINGS)) {
      expect(CUE_CATALOG[name], name).toBeTruthy();
      expect(s.file).toMatch(/^assets\/audio\/circle\/sfx\/[a-z-]+\.mp3$/);
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
  it('a plain line of dialogue plays nothing over the bed', () => {
    const chat = of('chat')[0];
    const i = chat.steps.findIndex(x => x.part === 'say');
    expect(soundFor(chat, i).cue).toBeNull();
  });
});

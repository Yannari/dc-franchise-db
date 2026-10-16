// The Challenge viewer's sound (js/vp-ch-ep/sound.js), on played seasons: every bed and sting
// points at a file that is really there and in the music list (docs/ch-music.md), every cue
// and bed a step asks for exists, the music turns where the moment does (the daily at TJ's GO,
// the Arena at the duel, the champions at the confetti), the house is not one mood, and the
// games are heard: the horn, the bell, the buzzer, the splash, the ELIMINATED stamp.
import { describe, expect, it, beforeAll } from 'vitest';
import fs from 'fs';
import { setPlayers } from '../js/core.js';
import { playChallengeSeason } from '../js/ch/season.js';
import { airSeason } from '../js/ch/story/director.js';
import { challengeRows } from '../js/ch-run.js';
import { chStepScreens } from '../js/vp-ch-ep/steps.js';
import { CH_BEDS, CH_STINGS, bedFor, bedAt, cueAt, soundFor, variantOf } from '../js/vp-ch-ep/sound.js';
import { BED_CATALOG, CUE_CATALOG } from '../js/audio.js';
import { challengeCast } from './helpers/ch-cast.js';

let SCREENS;
beforeAll(() => {
  SCREENS = [5, 9, 13, 21].flatMap(seed => {
    const { cast, names, background } = challengeCast(24, seed);
    setPlayers(cast);
    const r = playChallengeSeason({ cast: names, background, seed });
    airSeason(r.state);
    return challengeRows(r).flatMap(row => chStepScreens(row));
  });
});

describe('the Challenge viewer’s sound', () => {
  it('points every bed and sting at a file that exists and that the music list names', () => {
    const list = fs.readFileSync('docs/ch-music.md', 'utf8');
    for (const bed of Object.values(CH_BEDS)) for (const f of bed.files) {
      expect(fs.existsSync(`assets/audio/ch/${f}`), f).toBe(true);
      expect(list.includes(f), `docs/ch-music.md names ${f}`).toBe(true);
    }
    for (const s of Object.values(CH_STINGS)) for (const f of s.files) {
      expect(fs.existsSync(f), f).toBe(true);
      expect(list.includes(f.replace('assets/audio/ch/', '').replace('assets/audio/', '')), `docs/ch-music.md names ${f}`).toBe(true);
    }
  });

  it('opens every screen of a real season on a bed in the catalogue, and asks only for cues and beds that exist', () => {
    for (const S of SCREENS) {
      const b = bedFor(S);
      if (b !== 'none') expect(BED_CATALOG[b], `${S.id} -> ${b}`).toBeTruthy();
      S.steps.forEach((_, i) => {
        const { cue, bed } = soundFor(S, i);
        for (const c of [].concat(cue || [])) expect(CUE_CATALOG[c], `${S.id}:${i} ${c}`).toBeTruthy();
        if (bed !== 'none') expect(BED_CATALOG[variantOf(bed, S)], `${S.id}:${i} ${bed}`).toBeTruthy();
      });
    }
  });

  it('turns the music where the moment turns', () => {
    let daily = 0, arena = 0, crowned = 0;
    for (const S of SCREENS) {
      const beds = S.steps.map((_, i) => bedAt(S, i));
      const go = S.steps.findIndex(st => st.gong);
      if (S.key === 'daily' && go > 0) {
        expect(beds[go - 1], `${S.id}: quiet before the GO`).not.toBe('ch-daily');
        expect(beds[go], `${S.id}: the rock at the GO`).toBe('ch-daily');
        daily++;
      }
      const duel = S.steps.findIndex(st => st.duel);
      if (S.key === 'arena' && duel > 0) {
        expect(beds[0], `${S.id}: the walk in`).toBe('ch-arena-walk');
        expect(beds[duel], `${S.id}: the duel`).toBe('ch-arena');
        arena++;
      }
      const c = S.steps.findIndex(st => st.confetti);
      if (S.key === 'champions' && c >= 0) { expect(beds[c]).toBe('ch-champions'); crowned++; }
    }
    expect(daily).toBeGreaterThan(10);
    expect(arena).toBeGreaterThan(10);
    expect(crowned).toBeGreaterThan(0);
  });

  it('plays the goodbye to its own song, from the last words until the next scene', () => {
    const byes = SCREENS.filter(s => s.key === 'arena').map(s => [s, s.steps.findIndex(st => st.bye)]).filter(([, i]) => i >= 0);
    expect(byes.length).toBeGreaterThan(10);
    for (const [s, i] of byes) {
      expect(bedAt(s, i)).toBe('ch-goodbye');
      // and not before it: the duel keeps its own music
      const d = s.steps.findIndex(st => st.duel);
      if (d >= 0) expect(bedAt(s, d)).not.toBe('ch-goodbye');
    }
  });

  it('does not play every house scene to the same music, and leaves ordinary talk to the place itself', () => {
    const house = SCREENS.filter(S => S.key === 'villa').flatMap(S => S.steps.map((st, i) => (st.sceneIdx != null ? bedAt(S, i) : null))).filter(Boolean);
    const kinds = new Set(house);
    for (const b of ['ch-scheming', 'ch-drama', 'ch-romance', 'ch-fun']) expect(kinds.has(b), b).toBe(true);
    const quiet = house.filter(b => /^ch-amb|^none$/.test(b)).length;
    expect(quiet / house.length).toBeGreaterThan(0.25);
  });

  it('is heard: the games and the ceremonies each sound like themselves', () => {
    const heard = new Set();
    for (const S of SCREENS) S.steps.forEach((_, i) => { for (const c of [].concat(cueAt(S, i) || [])) heard.add(c); });
    for (const c of ['ch-impact', 'ch-recap', 'ch-gong', 'ch-horn', 'ch-bell', 'ch-buzzer', 'ch-splash', 'ch-mud', 'ch-sag', 'ch-vote',
      'ch-voted-in', 'ch-called-out', 'ch-eliminated', 'ch-gate', 'ch-daily-win', 'ch-arena-win', 'ch-confetti', 'ch-plane',
      'ch-motor', 'ch-ice', 'ch-crash', 'ch-smoke-bomb', 'ch-arena-horn', 'ch-card']) expect(heard.has(c), c).toBe(true);
  });
});

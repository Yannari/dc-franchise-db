// One screen for one step of a challenge (the user, 2026-10-20: "can u screen reflect now all the new steps u adding for
// each challenge 1 screen for 1 ... step of the challenge i mean"), and a player that plays its own screen ("dont let
// the media player navigate the whole episode only navigate their screen"). The simulator's pane lists a leg as its
// chapters (vp.js): a challenge opens a chapter when the leaders reach it, and now each of its stages opens another
// when the leaders reach that; the teams behind still cut in where they are.
import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { airSeason } from '../js/rr/episode.js';
import { playRaceSeason } from '../js/rr/season.js';
import { setPlayers } from '../js/core.js';
import { raceCast } from './helpers/rr-cast.js';
import { PLACES } from '../js/rr/places.js';
import { episodeScreens, chaptersOf } from '../js/vp-rr-ep/steps.js';

const legs = [];
beforeAll(() => {
  for (const seed of [41, 43]) {
    const { cast, teams } = raceCast(12, seed);
    setPlayers(cast);
    const res = playRaceSeason({ teams, seed, options: { pins: { 2: 'marble-temple-hill', 3: 'fire-mountain-isle', 4: 'red-outback' } } });
    const aired = airSeason(res);
    for (let i = 1; i < 4; i++) {
      const e = episodeScreens(res, aired, i);
      legs.push({ e, place: res.legs[i].place, chapters: chaptersOf(e, res.legs[i].place) });
    }
  }
}, 300000);
const stageIndex = (place, stretch, stage) => {
  const st = PLACES[place].stretches.find(x => x.id === stretch);
  for (const list of [st.stages, ...(st.sides || []).map(d => d.stages)]) { const k = (list || []).findIndex(x => x.id === stage); if (k >= 0) return k; }
  return -1;
};

describe('rr viewer: a screen for every step of a challenge', () => {
  it('opens a chapter for each stage the leaders reach, named for the challenge and the stage', () => {
    let n = 0;
    for (const { e, chapters } of legs) for (const c of chapters.filter(x => x.stage)) {
      n++;
      const first = e.screens[c.from];
      expect(first.seg, c.name).toBe('task-stage');
      expect(`${first.stretch}:${first.stage}`, c.name).toBe(c.key);
      expect(c.name, c.key).toMatch(/ · /);
    }
    expect(n).toBeGreaterThan(15);
  });

  it('never hides a later stage of the same challenge inside an earlier stage\'s chapter', () => {
    const bad = [];
    for (const { e, place, chapters } of legs) for (const c of chapters.filter(x => x.stage)) {
      const [stretch, stage] = c.key.split(':');
      const mine = stageIndex(place, stretch, stage);
      for (let si = c.from + 1; si <= c.to; si++) {
        const s = e.screens[si];
        if (s.seg === 'task-stage' && s.stretch === stretch && stageIndex(place, stretch, s.stage) > mine) bad.push(`${c.name}: ${s.id} is ${s.stage}`);
      }
    }
    expect(bad).toEqual([]);
  });

  it('still covers every screen of the leg exactly once, in order', () => {
    for (const { e, chapters } of legs) {
      expect(chapters[0].from).toBe(0);
      expect(chapters.at(-1).to).toBe(e.screens.length - 1);
      for (let k = 1; k < chapters.length; k++) expect(chapters[k].from).toBe(chapters[k - 1].to + 1);
    }
  });

  it('keeps the music on the challenge, not on every stage (a stage chapter is no reason to change it)', () => {
    const src = readFileSync('js/vp-rr-ep/sound.js', 'utf8');
    expect(src).toMatch(/chaptersOf\(ep, ep\.place\)\.filter\(c => !c\.stage\)/);
  });
});

describe('rr viewer: the player plays its own screen', () => {
  const src = readFileSync('js/vp-rr-ep/vp.js', 'utf8');
  const body = name => { const m = src.match(new RegExp(`function ${name}\\(R[^)]*\\) \\{[\\s\\S]*?\\n\\}`)); return m ? m[0] : ''; };
  it('stops at the end of the screen and at its start: Next, Back and the skips never leave it', () => {
    for (const fn of ['next', 'back']) {
      expect(body(fn), fn).not.toBe('');
      expect(body(fn), fn).not.toMatch(/vpNext|vpPrev|openVisualPlayer|goToPart/);
    }
    const skip = src.match(/export function rrxSkip[\s\S]*?\n\}/)[0];
    expect(skip).not.toMatch(/goToPart|vpNext|vpPrev/);
  });
  it('draws a media bar of this screen only, a piece per shot in it, never the whole leg', () => {
    expect(src).not.toMatch(/R\.chapters\.map\(\(x, k\) =>\s*`<i data-k/);
    expect(src).toMatch(/rrx-scrub/);
    expect(src).not.toMatch(/goToPart\(R, t\.ci/);
  });
});

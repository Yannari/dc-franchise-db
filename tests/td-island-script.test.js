// @vitest-environment jsdom
// Island life as dialogue (js/td/script/island.js + lines/isle*.js), checked on played seasons.
//
// The bugs these guard (found reading the output, 2026-10-07): a moment left as narration
// ("Duncan and Trent argue about the best way to cook rice"); the same exchange twice in a
// season (82 of 415 scenes before the pools grew); a line about sore arms after a morning
// of reading faces; a speaker who is not in the scene; "two wins." starting a sentence in
// lower case; somebody blamed for a vote they never cast.
import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'fs';
import { runOneSeason, seededRun, core } from './helpers/season-harness.js';
import { islandKind } from '../js/td/script/island.js';

const NAMES = ['Alejandro', 'Heather', 'Gwen', 'Duncan', 'Courtney', 'Owen', 'Izzy', 'Cody', 'Sierra', 'Lindsay', 'Harold', 'Leshawna', 'Noah', 'Bridgette', 'Geoff', 'Trent'];
const roster = JSON.parse(fs.readFileSync('franchise_roster.json', 'utf8')).players;
const cast = () => NAMES.map((n, i) => ({ ...roster.find(r => r.name === n), tribe: i % 2 ? 'Bass' : 'Gophers' }));

const seasons = [];
beforeAll(() => {
  for (const fmt of ['redemption', 'rescue']) for (const seed of [777, 4242, 31337]) {
    seededRun(() => runOneSeason({ romance: 'enabled', setting: 'hosted-camp', ri: true, riFormat: fmt, riReentryAt: 9, twistSchedule: [] }, 16, cast()), seed);
    seasons.push({ fmt, seed, eps: core.gs.episodeHistory.map(e => JSON.parse(JSON.stringify(e))) });
  }
}, 900000);
const eventsOf = s => s.eps.flatMap(ep => [...(ep.riLifeEvents || []), ...(ep.rescueIslandEvents || [])].map(e => ({ e, ep })));
const life = e => !/^(winner|loser)-/.test(e.type);

describe('island life is written as scenes', () => {
  it('every island moment is a scene with lines', () => {
    const left = [];
    for (const s of seasons) for (const { e, ep } of eventsOf(s)) if (life(e) && !e.lines?.length) left.push(`${s.fmt} ep${ep.num} ${e.type}: ${islandKind(e)}`);
    expect(left).toEqual([]);
  });

  it('no exchange airs twice in a season, and nobody says the same lines twice', () => {
    let scenes = 0, again = 0;
    const speakerAgain = [];
    for (const s of seasons) {
      const seen = new Set(), said = new Set();
      for (const { e } of eventsOf(s)) {
        if (!e.scene) continue;
        scenes++;
        if (seen.has(e.scene.lineId)) again++;
        seen.add(e.scene.lineId);
        for (const by of new Set(e.lines.filter(l => l.kind !== 'beat').map(l => l.by))) {
          const k = `${by}|${e.scene.lineId}`;
          if (said.has(k)) speakerAgain.push(`${s.fmt} ${s.seed}: ${k}`);
          said.add(k);
        }
      }
    }
    expect(scenes).toBeGreaterThan(300);
    expect(speakerAgain).toEqual([]);
    expect(again / scenes, `${again} of ${scenes} scenes repeated within a season`).toBeLessThan(0.02);
  });

  it('every slot is filled, and only people in the scene speak', () => {
    for (const s of seasons) for (const { e } of eventsOf(s)) {
      if (!e.scene) continue;
      const cast = Object.values(e.scene.who);
      for (const l of e.lines) {
        expect(l.text, `${e.scene.lineId}`).not.toMatch(/\{\w+(\.\w+)?\}/);
        expect(l.text, `${e.scene.lineId}: a sentence starts in lower case`).not.toMatch(/(^|[^.][.!?] )[a-z]/);
        if (l.kind !== 'beat') expect(cast, `${e.scene.lineId}: ${l.by}`).toContain(l.by);
      }
    }
  });

  it('a third person walks into some pair moments, and always speaks', () => {
    let trios = 0;
    for (const s of seasons) for (const { e } of eventsOf(s)) {
      if (!e.scene?.who?.c) continue;
      trios++;
      expect(e.lines.some(l => l.by === e.scene.who.c), `${e.scene.lineId}: ${e.scene.who.c} never speaks`).toBe(true);
    }
    expect(trios).toBeGreaterThan(10);
  });

  it('whole-island moments happen with three or more, and change how they feel', () => {
    const groups = seasons.flatMap(s => eventsOf(s).filter(({ e }) => e.type.startsWith('group-')));
    expect(groups.length).toBeGreaterThan(5);
    for (const { e } of groups) expect(new Set([e.player, e.player2, e.player3]).size).toBe(3);
  });

  it('a line that blames somebody for the vote only airs when they cast it', () => {
    const blame = /(you're the reason i'm here|that's all\. why me|stab me in the back|'not voting me out' duty|you know (exactly )?what you did)/i;
    for (const s of seasons) for (const { e } of eventsOf(s)) {
      if (!e.scene || !e.lines.some(l => blame.test(l.text))) continue;
      expect(e.scene.data.wrote, `${e.scene.lineId}`).toBeTruthy();
    }
  });

  it('a training scene is about the training the engine decided', () => {
    const ARMS = /\b(arms|legs|lunges|push-ups|sprint)/i;
    for (const s of seasons) for (const { e } of eventsOf(s)) {
      if (e.scene?.kind !== 'isle.train') continue;
      const stat = e.scene.data.ending;
      if (['mental', 'strategic', 'intuition', 'social', 'temperament'].includes(stat)) {
        expect(e.lines.map(l => l.text).join(' '), `${e.scene.lineId} (${stat})`).not.toMatch(ARMS);
      }
    }
  });
});

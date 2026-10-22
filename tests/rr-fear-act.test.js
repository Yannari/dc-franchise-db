// A racer's fear is about what the challenge makes them do, where they do it (the user, 2026-10-22, at the pepper cart
// on Pyramid Coast: "why are they talking about falling and rope when they are at the pepper vendor?"). Season 37 aired
// "You're clipped in. Look, the rope." at the chilli cart, a challenge with a cliff ledge and the sea and no rope at all,
// because the fear lines with no gate assumed a crossing on a rope, and the fear moment was timed on arrival.
import { describe, it, expect, beforeAll } from 'vitest';
import { airSeason } from '../js/rr/episode.js';
import { playRaceSeason } from '../js/rr/season.js';
import { setPlayers } from '../js/core.js';
import { raceCast } from './helpers/rr-cast.js';
import { PLACES } from '../js/rr/places.js';
import { FEARS, fearTime } from '../js/rr/fears.js';
import { POOLS } from '../js/rr/script/lines/index.js';
import { episodeScreens } from '../js/vp-rr-ep/steps.js';

const SCARY = ['heights', 'water', 'nerve'];
const FEAR_POOL = k => /^(fear-through|phobia)\./.test(k);
// words that name an act or a piece of gear: a line with one of them is for the acts that have it
const ACT_WORDS = /\b(rope|clipped|clip|rail|railing|across|harness|life jacket|drown|swim|water|the bottom|look(?:ed|s)? down|the edge|the drop|jump|ladder|table|box|hand in there|eight legs)\b/i;

describe('rr: fear is about the act, at its stage', () => {
  it('names an act and a real stage for every scary challenge', () => {
    const missing = [], bad = [];
    for (const [pid, P] of Object.entries(PLACES)) for (const s of P.stretches) {
      for (const side of s.sides ? s.sides : [null]) {
        const types = side ? side.types || [] : s.types || [];
        const stages = (side ? side.stages : s.stages) || [];
        if (!stages.length || !types.some(t => SCARY.includes(t))) continue;
        const key = `${pid}/${s.id}${side ? `:${side.id}` : ''}`;
        const f = FEARS[key];
        if (!f) { missing.push(key); continue; }
        if (!stages.some(x => x.id === f.at)) bad.push(`${key}: no stage ${f.at}`);
      }
    }
    expect(missing).toEqual([]);
    expect(bad).toEqual([]);
    for (const k of Object.keys(FEARS)) {
      const [pid, rest] = k.split('/');
      const [sid] = rest.split(':');
      expect(PLACES[pid]?.stretches.some(s => s.id === sid), k).toBe(true);
    }
  });

  it('says no act in a fear line that any scary challenge can get', () => {
    const bad = [];
    for (const [k, list] of Object.entries(POOLS)) {
      if (!FEAR_POOL(k)) continue;
      for (const e of list) {
        if (e.when?.fearDoes || e.when?.taskId || e.when?.place) continue;
        const txt = e.turns.map(t => [t.say, t.beat, ...Object.values(t.v || {})].filter(Boolean).join(' ')).join(' ');
        const m = txt.match(ACT_WORDS);
        if (m) bad.push(`${k} ${e.id}: "${m[0]}"`);
      }
    }
    expect(bad).toEqual([]);
  });

  const fears = [];
  const cart = [];
  beforeAll(() => {
    for (const seed of [37, 2, 5, 11]) {
      const { cast, teams } = raceCast(12, seed);
      setPlayers(cast);
      const res = playRaceSeason({ teams, seed, options: { pins: { 2: 'pyramid-coast', 3: 'cliff-pool-isle', 4: 'great-falls' } } });
      const aired = airSeason(res);
      for (const sc of res.state.scenes) {
        if (!['fear-through', 'phobia'].includes(sc.kind) || sc.data?.team == null) continue;
        const leg = res.legs.find(l => l.n === sc.leg);
        const st = PLACES[leg.place]?.stretches.find(s => s.id === sc.data.stretch);
        const row = (res.state.taskLog || []).find(r => r.leg === sc.leg && r.team === sc.data.team && r.stretch === sc.data.stretch);
        const key = `${leg.place}/${sc.data.stretch}${st?.sides && row?.side ? `:${row.side}` : ''}`;
        if (FEARS[key] && row?.stages?.length) fears.push({ sc, row, f: FEARS[key], key });
      }
      for (let i = 1; i < 2; i++) for (const s of episodeScreens(res, aired, i).screens) {
        if (s.kind === 'world' && s.stretch === 'pepper-cliff' && /^(fear-through|phobia)$/.test(s.seg)) cart.push((s.steps || []).map(x => x.text).join(' '));
      }
    }
  }, 900000);

  it('plays a fear moment once the team has got to the stage it is about', () => {
    expect(fears.length).toBeGreaterThan(3);
    const early = fears.filter(({ sc, row, f }) => sc.data.t < fearTime(row.stages, f.at, row.from) - 0.6)
      .map(({ sc, row, f, key }) => `${key} ${sc.kind} t${Math.round(sc.data.t)} < ${f.at}@${Math.round(fearTime(row.stages, f.at, row.from))}`);
    expect(early).toEqual([]);
  });

  it('never talks rope, rails or crossings at the pepper cliff', () => {
    const bad = cart.filter(t => /\b(rope|clipped|rail|railing|across|harness)\b/i.test(t));
    expect(bad).toEqual([]);
  });
});

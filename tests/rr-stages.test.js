// Challenges in stages, the way the show builds them (the user, 2026-10-20: "they are all super short with barely
// anything to do and barely using the plates and cutout cause theyre just not constructed well enough like in the
// show"). A challenge lists its stages from its own rules (the sled: harness up, the flag course, the bear, swapping
// pullers, the ice cliff); a failed try happens AT a stage; each team's run is kept stage by stage; the episode follows
// a few teams through every stage, each stage on its own shot and with its own lines.
import { describe, it, expect, beforeAll } from 'vitest';
import { airSeason } from '../js/rr/episode.js';
import { playRaceSeason } from '../js/rr/season.js';
import { setPlayers } from '../js/core.js';
import { raceCast } from './helpers/rr-cast.js';
import { PLACES } from '../js/rr/places.js';
import { episodeScreens } from '../js/vp-rr-ep/steps.js';
import { stretchPlates } from '../js/vp-rr-ep/plates.js';
const stretchPlatesFor = (p, s, side) => stretchPlates(p, s, side);

import { POOLS } from '../js/rr/script/lines/index.js';
import { placeLocal } from '../js/vp-rr-ep/locals.js';

// every place built in stages so far (a stretch's own `stages`, or each side's on a choose-one task)
const stagesOf = (p, s, side = null) => { const st = PLACES[p].stretches.find(x => x.id === s);
  return (side && st.sides?.find(x => x.id === side)?.stages) || st.stages || null; };
const STAGED = Object.values(PLACES).flatMap(pl => pl.stretches.filter(s => s.stages || s.sides?.some(d => d.stages)).map(s => [pl.id, s.id]));
const sidesOf = (p, s) => { const st = PLACES[p].stretches.find(x => x.id === s); return st.sides ? st.sides.map(d => d.id) : [null]; };
const runs = [];
// every staged place is booked into a season, ten to a season from leg 2 (a 12-team season runs about a dozen legs:
// a place booked past its end never plays), and the first chunk twice more on other seeds
const BOOKED = [...new Set(STAGED.map(([p]) => p))].filter(p => !PLACES[p].start);
const CHUNKS = [];
for (let i = 0; i < BOOKED.length; i += 10) CHUNKS.push(BOOKED.slice(i, i + 10));
beforeAll(() => {
  const plan = [...CHUNKS.map((c, i) => [41 + i * 7, c]), [42, CHUNKS[0]], [43, CHUNKS[0]]];
  for (const [seed, chunk] of plan) {
    const { cast, teams } = raceCast(12, seed);
    setPlayers(cast);
    const res = playRaceSeason({ teams, seed, options: { pins: Object.fromEntries(chunk.map((p, k) => [k + 2, p])) } });
    const aired = airSeason(res);
    runs.push({ seed, res, aired, screens: aired.map((_, i) => episodeScreens(res, aired, i)) });
  }
}, 600000);

describe('rr challenges in stages', () => {
  it('every staged challenge lists its stages, and a fail can only happen at a stage that can go wrong', () => {
    expect(STAGED.length).toBeGreaterThanOrEqual(4);
    for (const [p, s] of STAGED) for (const side of sidesOf(p, s)) {
      const stages = stagesOf(p, s, side);
      expect(stages?.length, `${p}/${s}/${side}`).toBeGreaterThanOrEqual(3);
      expect(stages.some(x => x.risk > 0)).toBe(true);
    }
  });

  it("keeps each team's run stage by stage: every stage passed once, in order, the fails at risky stages", () => {
    let n = 0;
    for (const { res } of runs) for (const r of res.state.taskLog || []) {
      const pid = res.legs[r.leg - 1]?.place;
      const st = PLACES[pid]?.stretches.find(x => x.id === r.stretch);
      const stages = st && stagesOf(pid, r.stretch, r.side);
      if (!stages || r.quit) continue;
      n++;
      const ok = r.stages.filter(e => e.ok).map(e => e.id);
      expect(ok, `${r.team} ${r.stretch}`).toEqual(stages.map(x => x.id));
      const fails = r.stages.filter(e => !e.ok);
      // (a picking task fails by its wrong picks: the jar that smelled like cumin and wasn't)
      expect(fails.length).toBe(r.right != null ? st.pick.of - r.right : r.fails);
      for (const f of fails) expect(stages.find(x => x.id === f.id).risk, f.id).toBeGreaterThan(0);
      r.stages.forEach((e, i) => { if (i) expect(e.t).toBeGreaterThanOrEqual(r.stages[i - 1].t); expect(e.t).toBeGreaterThanOrEqual(r.from - 0.01); expect(e.t).toBeLessThanOrEqual(r.to + 0.01); });
    }
    expect(n).toBeGreaterThan(30);
  });

  it('follows a few teams through every stage of a staged challenge, the first one there among them', () => {
    for (const { res, aired } of runs) aired.forEach((ep, i) => {
      const place = res.legs[i].place;
      for (const [p, s] of STAGED) {
        if (p !== place) continue;
        const segs = ep.segments.filter(x => x.kind === 'task-stage' && x.stretch === s);
        const teams = [...new Set(segs.map(x => x.teams[0]))];
        expect(teams.length, `leg ${ep.n} ${s}`).toBeGreaterThanOrEqual(1);
        expect(teams.length).toBeLessThanOrEqual(3);
        for (const tm of teams) {
          const mine = segs.filter(x => x.teams[0] === tm);
          const stages = stagesOf(p, s, mine[0].side);
          expect(new Set(mine.map(x => x.stage)).size, `${s} ${tm}`).toBeGreaterThanOrEqual(Math.min(3, stages.length));
        }
        const first = (res.state.taskLog || []).filter(r => r.leg === res.legs[i].n && r.stretch === s).sort((x, y) => x.from - y.from)[0];
        expect(teams, `leg ${ep.n} ${s}: the first team there is followed`).toContain(first.team);
      }
    });
  });

  it('gives every stage moment its own lines and its own shot', () => {
    let seen = 0;
    for (const { screens } of runs) for (const ep of screens) for (const s of ep.screens) {
      if (s.seg !== 'task-stage') continue;
      seen++;
      expect(s.steps.length, s.id).toBeGreaterThan(0);
      const want = stretchPlates(s.place, s.stretch, s.side)?.stages?.[s.stage];
      expect(want, `${s.place}/${s.stretch} stage ${s.stage} has a shot`).toBeTruthy();
      const files = [want.plate, ...(want.alt || []), want.fail].filter(Boolean).map(p => p.f);
      expect(files, s.id).toContain(s.plate.f);
    }
    expect(seen).toBeGreaterThan(20);
  });

  // (the shark: the partner on the boat was drawn in the water, and the one in the water in the ON THE BOAT box)
  it('puts the one doing a Botch in the water at every stage, and the partner watching on the boat', () => {
    let n = 0;
    for (const { screens } of runs) for (const ep of screens) for (const s of ep.screens) {
      if (s.seg !== 'task-stage' || s.stretchKind !== 'botch' || !s.swimmers) continue;
      n++;
      expect(s.swimmers[s.teams[0]], s.id).toEqual([s.who[0]]);
      expect(s.inset?.people, s.id).toEqual([s.who[1]]);
    }
    expect(n).toBeGreaterThan(0);
  });

  // (the magician stood at the buggy course, the dance elder on the bungee bridge: a side's local is that side's)
  it("stands a choose-one challenge's local only at the side that's theirs", () => {
    expect(placeLocal('neon-desert', 'buggy-magic', 'magic')).toBe('magician');
    expect(placeLocal('neon-desert', 'buggy-magic', 'buggy')).toBe(null);
    expect(placeLocal('fjord-peaks', 'jump-dance', 'dance')).toBe('dance-elder');
    expect(placeLocal('fjord-peaks', 'jump-dance', 'jump')).toBe(null);
    for (const { screens } of runs) for (const ep of screens) for (const s of ep.screens) {
      if (s.seg !== 'task-stage' || !s.side) continue;
      const own = placeLocal(s.place, s.stretch, s.side);
      for (const f of Object.values(s.localFaces || {})) if (['magician', 'dance-elder'].includes(f.id)) expect(f.id, s.id).toBe(own);
    }
  });

  // (Pyramid Coast: the vendor stood on the cliff ledge, and both partners swam for the milk when only the jumper goes in)
  it("keeps a stall's local at the stall, and sends only the jumper into the sea", () => {
    let swims = 0, ledges = 0;
    for (const { screens } of runs) for (const ep of screens) for (const s of ep.screens) {
      if (s.seg !== 'task-stage' || s.place !== 'pyramid-coast') continue;
      if (s.stage === 'the-ledge') { ledges++; expect(Object.values(s.localFaces || {}).map(f => f.id), s.id).not.toContain('pepper-vendor'); }
      if (['cliff-jump', 'milk-swim'].includes(s.stage)) { swims++; expect(s.swimmers?.[s.teams[0]], s.id).toEqual([s.who[1]]); }
    }
    expect(swims + ledges).toBeGreaterThan(0);
  });

  // (Frozen Mine: both partners went down the borehole on the winch; the one at the winch stays up top)
  it('sends only the one doing a Botch up or down a line, the partner in the box', () => {
    let n = 0;
    for (const { screens } of runs) for (const ep of screens) for (const s of ep.screens) {
      // (and a turn-taking All-In: one is the pinball, the other on the flippers)
      if (s.seg !== 'task-stage' || s.mode !== 'act' || !((s.stretchKind === 'botch' && ['zip', 'para', 'swing'].includes(s.plate?.mode)) || s.plate?.solo)) continue;
      n++;
      expect(s.away?.[s.teams[0]], s.id).toEqual([s.who[1]]);
      expect(s.inset?.people, s.id).toContain(s.who[1]);
    }
    expect(n).toBeGreaterThan(0);
  });

  // (a wrong spice isn't tried again: nobody checks the five, the stew finds out later)
  it('stamps a wrong spice WRONG SPICE, never TRY AGAIN', () => {
    let n = 0;
    for (const { screens } of runs) for (const ep of screens) for (const s of ep.screens) {
      if (s.seg !== 'task-stage' || s.stretch !== 'spices' || s.ending !== 'fail') continue;
      n++;
      const stamps = s.steps.map(x => x.stamp?.text).filter(Boolean);
      expect(stamps, s.id).toContain('WRONG SPICE');
      expect(stamps, s.id).not.toContain('TRY AGAIN');
    }
    expect(n).toBeGreaterThan(0);
  });

  it('writes lines for every stage of its own: a few for each stage passed, and for each stage that can go wrong', () => {
    const lines = (kind, p, s, id) => (POOLS[kind] || []).filter(e => e.when?.taskId === s && e.when?.stage === id && !e.id.startsWith('any.')).length;
    const short = [];
    for (const [p, s] of STAGED) for (const side of sidesOf(p, s)) for (const x of stagesOf(p, s, side)) {
      if (lines('task-stage.ok', p, s, x.id) < 2) short.push(`${p}/${s} ${x.id} ok`);
      if (x.risk > 0 && lines('task-stage.fail', p, s, x.id) < 2) short.push(`${p}/${s} ${x.id} fail`);
      if (!stretchPlatesFor(p, s, side)?.stages?.[x.id]) short.push(`${p}/${s} ${x.id} shot`);
    }
    expect(short).toEqual([]);
  });

  it('changes no result: the same race finishes in the same order with the stages as without', async () => {
    const { cast, teams } = raceCast(12, 41);
    setPlayers(cast);
    const a = playRaceSeason({ teams, seed: 41, options: { pins: { 2: 'ice-river', 3: 'pampas-ranch' } } });
    const kept = PLACES['ice-river'].stretches.map(s => s.stages);
    PLACES['ice-river'].stretches.forEach(s => { delete s.stages; });
    try {
      setPlayers(cast);
      const b = playRaceSeason({ teams, seed: 41, options: { pins: { 2: 'ice-river', 3: 'pampas-ranch' } } });
      expect(b.legs.map(l => l.order)).toEqual(a.legs.map(l => l.order));
    } finally { PLACES['ice-river'].stretches.forEach((s, i) => { if (kept[i]) s.stages = kept[i]; }); }
  }, 400000);
});

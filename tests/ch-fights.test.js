// The Challenge's fights have a reason (js/ch/cause.js; the user, 2026-10-16: "are those fight due to something?
// i dont want random fight cause its the first episode and we got 2 fights"). Every fight opens by saying what it
// is about, and a night out has one fight at most.
import { it, expect } from 'vitest';
import { setPlayers } from '../js/core.js';
import { playChallengeSeason } from '../js/ch/season.js';
import { airSeason } from '../js/ch/story/director.js';
import { challengeCast } from './helpers/ch-cast.js';

it('every fight says its cause, and a night has one fight at most', () => {
  for (const seed of [101, 104, 105]) {
    const { cast, names, background } = challengeCast(24, seed);
    setPlayers(cast);
    const r = playChallengeSeason({ cast: names, background, seed });
    airSeason(r.state);
    const fights = r.state.scenes.filter(s => s.kind === 'fight' || s.kind === 'fight-physical');
    for (const f of fights) expect(f.data.causeLine, `seed ${seed} ep ${f.ep}: ${f.who.join(' v ')}`).toBeTruthy();
    const perDay = {};
    for (const f of fights) perDay[f.day] = (perDay[f.day] || 0) + 1;
    for (const [day, n] of Object.entries(perDay)) expect(n, `seed ${seed} day ${day}`).toBe(1);
    for (const e of r.episodes) for (const a of e.aired || []) if (a.kind === 'fight' || a.kind === 'fight-physical') {
      expect(a.script.lines.some(l => l.kind === 'beat' && l.text === a.scene.data.causeLine), `seed ${seed} ep ${e.ep}: cause not said`).toBe(true);
    }
  }
}, 600000);

// The final: nobody the instant elimination sent home speaks at a later checkpoint (the user, 2026-10-16: James
// trash-talked the leader at checkpoint three after he was gone).
import { cpLines } from '../js/ch/script/final-cp.js';
it('every speaker at a final checkpoint is running it', () => {
  for (const seed of [101, 104, 105, 7]) {
    const { cast, names, background } = challengeCast(24, seed);
    setPlayers(cast);
    const r = playChallengeSeason({ cast: names, background, seed });
    const cps = r.final?.checkpoints || [];
    cps.forEach((rec, k) => {
      // the case the user saw, forced: somebody the instant elimination sent home, still second in the old standings
      const prev = k ? Object.fromEntries(Object.entries(cps[k - 1].standings).map(([d, rows]) => [d, [rows[0], ['Gone Player', 99], ...rows.slice(1)]])) : null;
      const lines = cpLines(rec, { seed: 's', prev });
      for (const l of lines) if (l.kind === 'say' && l.by !== 'TJ') expect(rec.order, `seed ${seed} ${rec.id}: ${l.by} says "${l.text}"`).toContain(l.by);
    });
  }
}, 600000);

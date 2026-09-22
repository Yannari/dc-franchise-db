import { describe, expect, it } from 'vitest';
import { setPlayers } from '../js/core.js';
import { playPerfectMatchSeason } from '../js/pm/season.js';
import { makeIslanders, roleSetup } from './helpers/pm-cast.js';

function seasons(n) {
  const out = [];
  for (let s = 1; s <= n; s++) {
    const cast = makeIslanders(22, s); setPlayers(cast);
    const names = cast.map(p => p.name);
    const res = playPerfectMatchSeason({ cast: names, setup: roleSetup(names), seed: s });
    out.push({ rows: res.rows, kinds: new Set(res.rows.flatMap(r => r.pm.events.map(e => e.kind))), res });
  }
  return out;
}

describe('the day, the ladder and the feelings reach the rows', () => {
  const all = seasons(12);

  it('every villa episode carries ladder and emotion snapshots', () => {
    for (const { rows } of all) for (const r of rows.filter(x => x.moment !== 'reunion')) {
      expect(r.pm.emotions).toBeTruthy();
      expect(Object.keys(r.pm.emotions).length).toBeGreaterThanOrEqual(4);
      expect(r.pm.ladder).toBeTruthy();
    }
  });

  it('across twelve seasons, the ladder and the feelings all produce scenes', () => {
    const kinds = new Set(all.flatMap(x => [...x.kinds]));
    for (const k of ['close-off', 'exclusive-ask', 'jealous-confront', 'reassurance', 'advice',
      'heart-rate', 'snog-marry-pie', 'movie-night', 'families', 'notes']) expect(kinds, k).toContain(k);
  });

  it('stress is higher in week five than in week one', () => {
    const mean = r => {
      const v = Object.values(r.pm.emotions).map(e => e.stress);
      return v.reduce((a, b) => a + b, 0) / v.length;
    };
    let up = 0;
    for (const { rows } of all) if (mean(rows[11]) > mean(rows[1])) up++;
    expect(up).toBe(all.length);
  });

  it('walks carry a cause', () => {
    for (const { rows } of all) for (const r of rows) for (const x of r.exits.filter(e => e.verb === 'walked')) {
      expect(['heartbreak', 'homesick', 'solidarity']).toContain(x.cause);
    }
  });

  it('every season ends in couples only, at most four', () => {
    // How OFTEN it is a full four is a calibration number, not a rule: the
    // audit prints it (most seasons land on four, a thin one on two).
    for (const { rows } of all) {
      const last = rows[rows.length - 1].pm;
      expect(last.couples.length).toBeLessThanOrEqual(4);
      expect(last.couples.length).toBeGreaterThanOrEqual(2);
      expect(last.villa.length).toBe(last.couples.length * 2);
    }
  });
});

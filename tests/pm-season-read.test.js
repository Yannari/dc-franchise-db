// A played season, read for what a viewer notices first: the same line again,
// the same goodbye twice in one night, a breakdown every episode
// (docs/superpowers/specs/2026-10-30-pm-stretch-payoff-design.md §5.7).
// The limits are a margin over where the stretch left them (2026-10-30: lines heard 4+
// times a season 114 -> 37-92 over five seeds, the most-heard 10-12x -> 6-8); they guard against
// sliding back, and come down as pools grow.
import { describe, it, expect, beforeAll } from 'vitest';
import { playReadSeason, eventLines, phaseLines } from './helpers/pm-read.js';

const SEEDS = [7, 12, 21];
const seasons = {};
beforeAll(() => { for (const seed of SEEDS) seasons[seed] = playReadSeason(seed); });

describe('pm season read', () => {
  it('a spoken line is rarely heard four times in a season, and never ten', () => {
    for (const seed of SEEDS) {
      const heard = {};
      for (const r of seasons[seed].rows) for (const e of r.pm.events.filter(e => e.aired && e.kind !== 'movie-clip'))
        for (const l of eventLines(e)) if (l.who && !l.stage && l.who !== 'NARRATOR' && l.text.length >= 25) heard[l.text] = (heard[l.text] || 0) + 1;
      const counts = Object.values(heard);
      expect(counts.filter(n => n > 3).length, `seed ${seed}: lines heard 4+ times`).toBeLessThanOrEqual(100);
      const [top, n] = Object.entries(heard).sort((a, b) => b[1] - a[1])[0];
      expect(n, `seed ${seed}: "${top}"`).toBeLessThanOrEqual(9);
    }
  });

  it('no two goodbyes on one night share a line', () => {
    for (const seed of SEEDS) for (const r of seasons[seed].rows) {
      const said = {};
      for (const e of r.pm.events.filter(e => e.kind === 'dump-goodbye' && e.aired)) for (const l of eventLines(e)) {
        if (!l.who || l.stage) continue;
        const k = l.text.replace(new RegExp(`\\b(${e.players.join('|')})\\b`, 'g'), '_').replace(/\bit is\b/g, "it's").toLowerCase();
        expect(said[k], `seed ${seed} ep${r.num}: "${l.text}"`).toBeUndefined();
        said[k] = true;
      }
    }
  });

  it('one breakdown a stretch at most', () => {
    for (const seed of SEEDS) {
      const { rows } = seasons[seed];
      const exitEps = rows.filter(r => ['recoupling', 'public-vote', 'stick-or-twist', 'semi-final', 'final'].includes(r.moment)).map(r => r.num);
      let last = 0;
      for (const end of exitEps) {
        const stretch = rows.filter(r => r.num > last && r.num <= end && !r.pm?.casaRoom && !['casa-open', 'casa-nights'].includes(r.moment));
        const n = stretch.filter(r => phaseLines(r).some(p => p.label === 'It all gets too much')).length;
        expect(n, `seed ${seed} eps ${last + 1}-${end}`).toBeLessThanOrEqual(1);
        last = end;
      }
    }
  });
});

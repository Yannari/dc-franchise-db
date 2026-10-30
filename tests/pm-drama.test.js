// The season read of 2026-10-30, as rules a played season keeps:
//   - "exclusive questions twice for the same couple" — once a couple, unless
//     they split and got back together (pm/ladder.js `asked`);
//   - "overloaded" — an islander is in one side story an episode (pm/events.js
//     SIDE_STORY), the last week included;
//   - "they always go friendly, never angry" — a strong couple voted out over a
//     weaker one says so, and the voters don't get a goodbye hug (pm/moments.js 2b).
import { describe, it, expect, beforeAll } from 'vitest';
import { playReadSeason } from './helpers/pm-read.js';

const SEEDS = [4, 7, 21];
const seasons = {};
beforeAll(() => { for (const seed of SEEDS) seasons[seed] = playReadSeason(seed); });

const SIDE = /^(triangle|rival|crush|camp|feud|betray|redeem|grass|parents|exw|enemy)-|^ex-(awkward|jealous)$|^game-(plan|latch|two-faced|suspect|called|fallout|end)$|^(code-call|mugged-low|found-love|villa-happy|torch|blowup|pile-in|villa-divided|cold-shoulder|clear-the-air|double-standard)$/;
const fam = k => ({ 'code-call': 'rival', 'pile-in': 'blowup', 'villa-divided': 'blowup' })[k] || (k.startsWith('camp-') ? 'rival' : k.startsWith('game-') ? 'game' : k.split('-')[0]);
const pair = (a, b) => [a, b].sort().join('|');

describe('pm drama', () => {
  it('asks a couple to be exclusive (or official) once, unless they split and came back', () => {
    for (const seed of SEEDS) {
      const { rows } = seasons[seed];
      const last = {};
      for (const r of rows) {
        for (const e of (r.pm?.events || []).filter(e => e.kind === 'exclusive-ask' || e.kind === 'official-ask')) {
          const k = `${e.kind}:${pair(e.players[0], e.players[1])}`;
          expect(last[k], `seed ${seed} ep${r.num}: ${k} asked again (first ep${last[k]})`).toBeUndefined();
          last[k] = r.num;
        }
        // A pair apart once the night is over has split: it may be asked again.
        const together = new Set((r.pm?.couples || []).map(c => pair(c[0], c[1])));
        for (const k of Object.keys(last)) if (!together.has(k.split(':')[1])) delete last[k];
      }
    }
  });

  it('an islander is in one side story an episode', () => {
    for (const seed of SEEDS) for (const r of seasons[seed].rows) {
      const fams = {};
      for (const e of (r.pm?.events || []).filter(e => e.aired && !e.airedLate && e.phase !== 'challenge' && SIDE.test(e.kind) && !e.extra?.thread))
        for (const n of e.players) (fams[n] ||= new Set()).add(fam(e.kind));
      for (const [n, f] of Object.entries(fams)) expect(f.size, `seed ${seed} ep${r.num} ${n}: ${[...f]}`).toBe(1);
    }
  });

  it('a strong couple voted out says so, and the voter gets no goodbye hug', () => {
    let unfair = 0;
    for (const seed of SEEDS) for (const r of seasons[seed].rows) {
      const evs = r.pm?.events || [];
      for (const e of evs.filter(e => e.kind === 'dump-unfair')) {
        unfair++;
        const [a, b, v] = e.players;
        expect(e.extra.of, `seed ${seed} ep${r.num}`).toMatch(/^(furious|cold)$/);
        const hugs = evs.filter(g => g.kind === 'dump-goodbye' && g.players.length === 2 && [a, b].includes(g.players[0]) && g.players[1] === v);
        expect(hugs, `seed ${seed} ep${r.num}: ${v} hugged ${a}`).toEqual([]);
      }
    }
    expect(unfair, 'no unfair dumping in three seasons').toBeGreaterThan(0);
  });
});

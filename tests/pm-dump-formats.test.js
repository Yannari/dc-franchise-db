// ══════════════════════════════════════════════════════════════════════
// pm-dump-formats.test.js — Plan 4.5's dumping nights, as they PLAY
// ══════════════════════════════════════════════════════════════════════
//
// Every rule here was a defect found by reading played dumpings:
//   - a drawn format that never happened, while the row claimed it did;
//   - Dior reading the verdict before anyone had voted;
//   - a boy saving somebody else's girlfriend over his own;
//   - "X is the only one still standing" over five people standing.
import { describe, expect, it } from 'vitest';
import { setPlayers } from '../js/core.js';
import { playPerfectMatchSeason, perfectMatchScheduleFor } from '../js/pm/season.js';
import { DUMP_DRAWS } from '../js/pm/schedule.js';
import { makeIslanders, roleSetup } from './helpers/pm-cast.js';

const SEASONS = [];
for (let seed = 1; seed <= 30; seed++) {
  const cast = makeIslanders(22, seed); setPlayers(cast);
  const names = cast.map(p => p.name);
  SEASONS.push({ seed, ...playPerfectMatchSeason({ cast: names, setup: roleSetup(names), seed }) });
}
const nights = SEASONS.flatMap(s => s.rows.map((r, i) => ({ seed: s.seed, row: r, prev: s.rows[i - 1] || null })))
  .filter(n => n.row.pm.dumpFormat);
const kinds = row => row.pm.events.map(e => e.kind);
const partnerIn = (row, n) => (row?.pm.couples || []).find(c => c.includes(n))?.find(x => x !== n) || null;

describe('the schedule is drawn per season', () => {
  it('same seed, same shape; the draw moves between seeds', () => {
    expect(perfectMatchScheduleFor(4)).toEqual(perfectMatchScheduleFor(4));
    const shapes = new Set(Array.from({ length: 12 }, (_, i) =>
      perfectMatchScheduleFor(i + 1).map(e => e.dumpFormat || '').join(',')));
    expect(shapes.size).toBeGreaterThan(3);
  });
  it('every drawable format plays somewhere in thirty seasons', () => {
    const played = new Set(nights.map(n => n.row.pm.dumpFormat));
    for (const opts of Object.values(DUMP_DRAWS)) for (const [f] of opts) expect([...played], f).toContain(f);
  });
});

describe('each format plays as the real show does', () => {
  it('the favourite couple picks, once, and is not in the bottom', () => {
    for (const { seed, row } of nights.filter(n => n.row.pm.dumpFormat === 'top-couple-picks')) {
      const picks = row.pm.events.filter(e => e.kind === 'top-couple-pick');
      expect(picks.length, `s${seed} e${row.num}`).toBe(1);
      const [a, b, c, d] = picks[0].players;
      expect(row.pm.bottom.some(x => x.includes(a) || x.includes(b)), `s${seed} e${row.num}`).toBe(false);
      expect(row.exits.map(x => x.name).sort()).toEqual(expect.arrayContaining([c, d].sort()));
    }
  });
  it('save-one: a partner at risk is always saved by their partner', () => {
    for (const { seed, row, prev } of nights.filter(n => n.row.pm.dumpFormat === 'save-one')) {
      const atRisk = row.pm.bottom.flat();
      for (const e of row.pm.events.filter(x => x.kind === 'save-vote')) {
        const mine = partnerIn(prev, e.players[0]);
        if (atRisk.includes(mine)) expect(e.players[1], `s${seed} e${row.num} ${e.players[0]}`).toBe(mine);
      }
    }
  });
  it('save-one: a tie is said out loud and settled by the public, before the verdict', () => {
    // Season 11: two saves each, a silent coin, and "you weren't saved" to
    // the one with as many saves as the islander who stayed.
    let ties = 0;
    for (const { row } of nights.filter(n => n.row.pm.dumpFormat === 'save-one' && n.row.pm.tie)) {
      ties++;
      const k = kinds(row);
      expect(k.indexOf('save-tie')).toBeGreaterThan(k.lastIndexOf('save-vote'));
      expect(k.indexOf('save-tie')).toBeLessThan(k.indexOf('dump-verdict'));
      const share = n => row.pm.tieShares.find(s => s.name === n)?.share ?? 0;
      expect(Math.max(...row.pm.tie.map(share))).toBe(share(row.pm.saved));
    }
    expect(ties).toBeGreaterThan(0);
  });
  it('couples-vote: every couple names one, and nobody hears "public" that night', () => {
    for (const { seed, row, prev } of nights.filter(n => n.row.pm.dumpFormat === 'couples-vote')) {
      expect(kinds(row).filter(k => k === 'couples-vote').length, `s${seed}`).toBe(prev.pm.couples.length);
      const said = row.pm.events.slice(row.pm.momentFrom).flatMap(e => e.script.lines.map(l => l.text)).join(' ');
      expect(said, `s${seed} e${row.num}`).not.toMatch(/the public/i);
    }
  });
  it('ex-islanders: one entrance, one ballot per ex, and the exes are not in the villa', () => {
    for (const { seed, row } of nights.filter(n => n.row.pm.dumpFormat === 'ex-islanders')) {
      expect(kinds(row).filter(k => k === 'ex-return').length, `s${seed}`).toBe(1);
      const voters = row.pm.events.filter(e => e.kind === 'ex-ballot').map(e => e.players[0]);
      expect(voters.length).toBeGreaterThan(0);
      for (const v of voters) expect(row.pm.villa, `s${seed} ${v}`).not.toContain(v);
    }
  });
});

describe('the dumping reads in order', () => {
  it('every vote is cast before the verdict it adds up to', () => {
    const VOTE = new Set(['ballot-reveal', 'save-vote', 'ex-ballot', 'top-couple-pick']);
    const VERDICT = new Set(['dump-verdict', 'dump-verdict-couple', 'dump-verdict-singles']);
    for (const s of SEASONS) for (const row of s.rows) {
      // Each dumping scene: from its build-up (or first verdict) to its last goodbye.
      const ks = kinds(row);
      let lastVote = -1;
      ks.forEach((k, i) => {
        if (VOTE.has(k)) lastVote = i;
        if (VERDICT.has(k) && lastVote > -1) {
          expect(i, `s${s.seed} e${row.num}: ${k} at ${i} after a vote at ${lastVote}`).toBeGreaterThan(lastVote);
          lastVote = -1;
        }
      });
      // …and a verdict is never followed by a vote of the same scene.
      const firstVerdict = ks.findIndex(k => VERDICT.has(k));
      const goodbye = ks.findIndex((k, i) => i > firstVerdict && k === 'dump-goodbye');
      if (firstVerdict > -1 && goodbye > -1) {
        expect(ks.slice(firstVerdict, goodbye).some(k => VOTE.has(k)), `s${s.seed} e${row.num}`).toBe(false);
      }
    }
  });
  it('several singles hear one verdict together, never "the only one still standing"', () => {
    for (const s of SEASONS) for (const row of s.rows) {
      const lone = row.pm.events.filter(e => e.kind === 'dump-verdict' && e.extra.channel === 'recoupling');
      const group = row.pm.events.filter(e => e.kind === 'dump-verdict-singles');
      if (group.length) expect(lone.length, `s${s.seed} e${row.num}`).toBe(0);
    }
  });
});

describe('the first public vote always plays at the calibration cast', () => {
  it('never skipped: a villa of ten with singles about still has a couple to spare', () => {
    // Measured 2026-09-23: the early recouplings left four couples and two
    // singles, and the vote refused to run in 23 seasons of 100.
    let skipped = 0;
    for (let seed = 1; seed <= 30; seed++) {
      const cast = makeIslanders(22, seed); setPlayers(cast);
      const names = cast.map(p => p.name);
      const rows = playPerfectMatchSeason({ cast: names, setup: roleSetup(names), seed }).rows;
      if (!rows.find(r => r.moment === 'public-vote').pm.dumpFormat) skipped++;
    }
    expect(skipped).toBe(0);
  });
  it('a small cast meets the public too, and still reaches the final with four couples', () => {
    // Measured 2026-09-23: at 10 and 12 islanders the pace sat under a vote a
    // night and the first vote was skipped in 40 seasons of 40. Forced to play,
    // a format that dumps one of a pair cost 12-islander finals (15 of 20 to
    // 10), so the forced night is the public's own vote and a whole couple goes.
    let skipped = 0, four = 0;
    for (let seed = 1; seed <= 40; seed++) {
      const cast = makeIslanders(12, seed); setPlayers(cast);
      const names = cast.map(p => p.name);
      const rows = playPerfectMatchSeason({ cast: names, setup: roleSetup(names), seed }).rows;
      if (!rows.find(r => r.moment === 'public-vote').pm.dumpFormat) skipped++;
      if ((rows.find(r => r.moment === 'final')?.pm.couples?.length || 0) >= 4) four++;
    }
    expect(skipped).toBe(0);
    // Four-couple finals at twelve: 59 of 80 before the 2026-09-23 audit
    // fixes, 52 then 48 of 80 after; twenty seasons swing 10-15, so forty. The loss is one real-show
    // rule: a girl stolen from at the recoupling of eight is left single with
    // the boy nobody picked, and a cast this small has no bombshell left to
    // fill the gap, so the semi-final takes them both. Changing it means a
    // rule the show does not have — the user's call, not a tuned threshold.
    expect(four).toBeGreaterThanOrEqual(20);
  });
});

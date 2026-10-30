// The season read, in numbers (docs/superpowers/specs/2026-10-30-pm-stretch-payoff-design.md §6).
//
//     npm run audit:pm-stretch            seeds 7, 12, 21
//     PM_SEEDS=3,4 npm run audit:pm-stretch
//
// Prints what a reader felt: how long an episode is, how long each phase is,
// whether the stories the screen followed were answered or just stopped, whether
// the fire pit showed whose partner was taken, and the lines heard most.
import { it } from 'vitest';
import { playReadSeason, phaseLines, eventLines } from './helpers/pm-read.js';

const SEEDS = (process.env.PM_SEEDS || '7,12,21').split(',').map(Number);
const NOT_VILLA = new Set(['first-coupling', 'final', 'reunion']);
const UNANSWERED = new Set(['faded', 'fizzled', 'settled']);
const mean = a => a.length ? Math.round(a.reduce((x, y) => x + y, 0) / a.length) : 0;

it('season read audit', () => {
  const out = [];
  for (const seed of SEEDS) {
    const { rows, state } = playReadSeason(seed);
    const villa = rows.filter(r => !NOT_VILLA.has(r.moment) && r.pm);
    const per = villa.map(r => phaseLines(r).reduce((t, p) => t + p.lines.length, 0));
    // Lines per phase, by label.
    const byPhase = {};
    const thin = [];
    for (const r of villa) for (const p of phaseLines(r)) {
      (byPhase[p.label] ||= []).push(p.lines.length);
      const story = p.events.some(e => e.extra?.thread || e.extra?.stretch);
      if (p.lines.length < 25 && !story && !['The debrief', 'The dumping'].includes(p.label)) thin.push(`ep${r.num} ${p.label} ${p.lines.length}`);
    }
    // Stories the screen followed: answered, or just stopped?
    const followed = (state.threads || []).filter(t => state.headlined?.[t.id]);
    const closed = followed.filter(t => t.over);
    const dropped = closed.filter(t => UNANSWERED.has(t.why));
    const whys = {};
    for (const t of closed) whys[t.why] = (whys[t.why] || 0) + 1;
    // The stretch's stories (pm/stretch.js): the ones the screen leads with.
    const planned = (state.threads || []).filter(t => state.planned?.[t.id]);
    const pClosed = planned.filter(t => t.over);
    const pDropped = pClosed.filter(t => UNANSWERED.has(t.why));
    const pWhys = {};
    for (const t of pClosed) pWhys[t.why] = (pWhys[t.why] || 0) + 1;
    // The fire pit: picks that took somebody's partner, and whether that partner was named.
    let took = 0, named = 0, changed = 0, ceremonies = 0;
    for (const r of rows) {
      const picks = (r.pm?.events || []).filter(e => e.kind === 'recouple-pick');
      if (!picks.length) continue;
      ceremonies++;
      const before = r.pm.couplesBefore || [];
      const partner = n => before.find(c => c.includes(n))?.find(x => x !== n) || null;
            for (const e of picks) {
        const [a, b] = e.players;
        // Whose partner was taken, left or taken back (moments.js: a couple who called it off is neither).
        const third = e.extra?.tookFrom || e.extra?.leftFrom || e.extra?.stole;
        if (third) {
          took++;
          if (eventLines(e).some(l => l.who === third || l.text.includes(third))) named++;
        }
        if (partner(a) !== b) changed++;
      }
    }
    // Lines heard most, breakdowns, goodbyes that repeat on one night.
    const heard = {};
    let breakdownEps = 0, dupGoodbyes = 0;
    for (const r of rows) {
      const phases = phaseLines(r);
      if (phases.some(p => p.label === 'It all gets too much')) breakdownEps++;
      for (const p of phases) for (const l of p.lines) if (l.who && !l.stage && l.who !== 'NARRATOR' && l.text.length >= 25) heard[l.text] = (heard[l.text] || 0) + 1;
      const bye = {};
      for (const e of (r.pm?.events || []).filter(e => e.kind === 'dump-goodbye' && e.aired)) {
        for (const l of eventLines(e)) if (l.who && !l.stage) { const k = l.text.replace(new RegExp(`\\b(${e.players.join('|')})\\b`, 'g'), '_'); bye[k] = (bye[k] || 0) + 1; }
      }
      dupGoodbyes += Object.values(bye).filter(n => n > 1).length;
    }
    const top = Object.entries(heard).sort((x, y) => y[1] - x[1]).slice(0, 10);
    out.push(`\n== seed ${seed}: ${rows.length} episodes, ${villa.length} villa ==`,
      `lines per villa episode: mean ${mean(per)}, min ${Math.min(...per)}, max ${Math.max(...per)}`,
      `lines per phase: ${Object.entries(byPhase).map(([k, v]) => `${k} ${mean(v)}`).join(' · ')}`,
      `thin phases (<25 lines, no story): ${thin.length}${thin.length ? ' — ' + thin.slice(0, 8).join(', ') : ''}`,
      `stories followed: ${followed.length}, closed ${closed.length}, dropped (faded/fizzled/settled) ${dropped.length} (${Math.round(100 * dropped.length / Math.max(1, closed.length))}%) · ${JSON.stringify(whys)}`,
      `stretch stories: ${planned.length}, closed ${pClosed.length}, dropped ${pDropped.length} · ${JSON.stringify(pWhys)}`,
      `fire pit: ${ceremonies} ceremonies, ${changed} picks changed a couple, ${took} took, left or took back a partner, ${named} named them`,
      `episodes with a breakdown section: ${breakdownEps} · goodbye lines repeated on one night: ${dupGoodbyes}`,
      `most heard:`, ...top.map(([t, n]) => `  ${n}x  ${t.slice(0, 110)}`));
  }
  process.stdout.write(out.join('\n') + '\n');
});

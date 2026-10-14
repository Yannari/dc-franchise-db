// ══════════════════════════════════════════════════════════════════════
// bb/story/arcs.js — stories that run across weeks, and the season's running gags
// ══════════════════════════════════════════════════════════════════════
//
// Total Drama's arcs and runners (td/story/arcs.js, td/story/runners.js), on Big Brother's weeks.
// Words only: they read the game and never move it (tests/bb-talk.test.js plays a season muted).
//   runners  two a season, for the most comic voices (voice.js): a bit set up once, called back up to
//            three times, paid off once when the house is small (lines/runners.js)
//   payback  {rival} nominated a, and a survived the week: a vows it, waits, and the game ends it:
//            a wins HOH and nominates {rival}, or spares them, or the house evicts {rival} first
//   block    a survives the block a second time: the self-mockery, and the week a finally wins
// gs.bb.arcs = { runners: { name: { kind, stage, calls, last } }, list: [{ type, a, rival, step, start, last, done }] }
import { gs } from '../../core.js';
import { getBond } from '../../bonds.js';
import { voiceOf } from './voice.js';

const book = () => ((gs.bb ||= {}).arcs ||= { runners: null, list: [] });
let NOW = 0;   // the week arcDue is writing (an arc remembers when it last aired)
const hash = s => [...String(s)].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
const closest = (n, pool, not = []) => pool.filter(m => m !== n && !not.includes(m)).sort((x, y) => getBond(n, y) - getBond(n, x) || (x < y ? -1 : 1))[0] || null;

// which bit suits which voice, and how comic each voice is
const KIND_BY_VOICE = { carefree: 'camera', nervous: 'secret', warm: 'rota', loyal: 'rota', competitor: 'fitness', fiery: 'fitness', strategist: 'rota', villain: 'camera' };
const COMIC = { carefree: 3, nervous: 2.5, warm: 2, competitor: 1.5, fiery: 1.2, loyal: 1, strategist: 0.6, villain: 0.5 };

/** The season's two runners, chosen once from the house on move-in week. */
export function runnersOf(house) {
  const b = book();
  if (b.runners) return b.runners;
  const salt = gs.bb?.seasonSalt || 0;
  const scored = (house || []).map(n => ({ n, v: voiceOf(n) || 'carefree' }))
    .sort((x, y) => (COMIC[y.v] || 0) - (COMIC[x.v] || 0) || hash(`${salt}|${x.n}`) - hash(`${salt}|${y.n}`));
  const out = {}, used = new Set();
  for (const { n, v } of scored) {
    if (Object.keys(out).length >= 2) break;
    const kind = [KIND_BY_VOICE[v], 'camera', 'rota', 'fitness', 'secret'].find(k => k && !used.has(k));
    used.add(kind);
    out[n] = { kind, stage: 0, calls: 0, last: -9 };
  }
  b.runners = out;
  return out;
}

/** The running gag due this week, or null: { key, who, data, why, commit }. */
export function runnerDue(week, present) {
  const num = week?.num || 0;
  const rs = runnersOf(week?.houseAtStart || present);
  const order = Object.keys(rs).sort((x, y) => (rs[x].last - rs[y].last) || (x < y ? -1 : 1));
  for (const name of order) {
    const r = rs[name];
    if (!present.includes(name) || r.stage >= 3 || num - r.last < 1) continue;
    const small = present.length <= 6;
    const stage = r.stage === 0 ? 'setup' : small && r.calls >= 1 ? 'payoff' : r.calls < 3 ? 'call' : null;
    if (!stage) continue;
    const b = closest(name, present), c = closest(name, present, [b]);
    if (!b) continue;
    return { key: `run.${r.kind}.${stage}`, who: { a: name, b, ...(c ? { c } : {}) }, data: {}, kind: `run.${r.kind}`,
      why: [stage === 'setup' ? `A running joke starts: ${name}'s ${r.kind === 'rota' ? 'chore rota' : r.kind === 'fitness' ? 'workout club' : r.kind === 'camera' ? 'friendship with the cameras' : 'secrets'}.` : `${name}'s running joke comes back.`],
      commit: () => { r.last = num; if (stage === 'setup') r.stage = 1; else if (stage === 'call') { r.calls++; r.stage = 2; } else r.stage = 3; } };
  }
  return null;
}

/**
 * The arc scene due this week, or null: { key, who, data, why, commit, when } — `when` says which
 * stretch it belongs in ('early' before the nominations, 'late' after them).
 */
export function arcDue(week, present) {
  const b = book();
  const num = week?.num || 0;
  NOW = num;
  const here = new Set(present);
  const prev = (gs.bb?.weeks || []).find(w => w.num === num - 1);
  const stats = gs.bb?.stats || {};
  // ── endings first: an open arc whose week has come ──
  for (const arc of b.list.filter(x => !x.done)) {
    if (num - arc.start > 7 || !here.has(arc.a)) { arc.done = true; continue; }
    if (arc.type === 'payback') {
      const friend = closest(arc.a, present, [arc.rival]);
      if (!here.has(arc.rival)) {
        // the house got there first (an eviction since the arc began)
        if (!friend) { arc.done = true; continue; }
        return spec(arc, 'arc.payback.end.gone', { a: arc.a, b: friend }, { rival: arc.rival }, 'early',
          [`${arc.rival} nominated ${arc.a} in week ${arc.from}.`, `The house sent ${arc.rival} home before ${arc.a} could.`]);
      }
      if (week.hoh === arc.a) {
        const nominated = [...(week.initialNominees || []), ...(week.finalNominees || [])].includes(arc.rival);
        if (nominated) return spec(arc, 'arc.payback.end.payback', { a: arc.a, b: arc.rival }, { rival: arc.rival }, 'late',
          [`${arc.rival} nominated ${arc.a} in week ${arc.from}.`, `${arc.a} is Head of Household now, and put ${arc.rival} up.`]);
        if (friend) return spec(arc, 'arc.payback.end.mercy', { a: arc.a, b: friend }, { rival: arc.rival }, 'late',
          [`${arc.rival} nominated ${arc.a} in week ${arc.from}.`, `${arc.a} won Head of Household and did not nominate ${arc.rival}.`]);
      }
      if (arc.step === 'vow' && num > arc.last && friend) return spec(arc, 'arc.payback.wait', { a: arc.a, b: friend }, { rival: arc.rival }, 'early',
        [`${arc.a} has not forgotten that ${arc.rival} nominated ${arc.a}.`], 'wait');
    }
    if (arc.type === 'block' && num > arc.last) {
      const won = week.hoh === arc.a ? 'the HOH key' : week.vetoWinner === arc.a ? 'the veto' : null;
      const friend = closest(arc.a, present);
      if (won && friend) return spec(arc, 'arc.block.end.win', { a: arc.a, b: friend }, { prize: won }, 'early',
        [`${arc.a} has been nominated ${stats[arc.a]?.timesNominated || 'many'} times.`, `${arc.a} finally won ${won === 'the veto' ? 'the veto' : 'Head of Household'}.`]);
    }
  }
  // ── a new arc ──
  const open = new Set(b.list.filter(x => !x.done).flatMap(x => [x.a, x.rival].filter(Boolean)));
  const count = t => b.list.filter(x => x.type === t).length;
  // payback: last week's HOH put a on the block, and a is still here
  if (prev && count('payback') < 2 && prev.hoh && here.has(prev.hoh)) {
    const survived = [...new Set([...(prev.initialNominees || []), ...(prev.finalNominees || [])])]
      .filter(n => n !== prev.evicted && here.has(n) && n !== prev.hoh && !open.has(n) && getBond(n, prev.hoh) <= 1);
    const a = survived.sort((x, y) => getBond(x, prev.hoh) - getBond(y, prev.hoh) || (x < y ? -1 : 1))[0];
    const friend = a && closest(a, present, [prev.hoh]);
    if (a && friend) {
      const arc = { type: 'payback', a, rival: prev.hoh, from: prev.num, step: null, start: num, last: -9, done: false };
      return { ...spec(arc, 'arc.payback.vow', { a, b: friend }, { rival: prev.hoh }, 'early',
        [`${prev.hoh} nominated ${a} last week. ${a} survived.`], 'vow'), open: arc };
    }
  }
  // block: a has survived the block twice
  if (count('block') < 1) {
    const noms = [...new Set([...(week.finalNominees || [])])];
    const a = noms.find(n => here.has(n) && n !== week.evicted && (stats[n]?.timesNominated || 0) >= 2 && !open.has(n));
    const friend = a && closest(a, present);
    if (a && friend) {
      const arc = { type: 'block', a, start: num, last: -9, done: false };
      return { ...spec(arc, 'arc.block.pro', { a, b: friend }, {}, 'late', [`${a} is on the block again.`], 'pro'), open: arc };
    }
  }
  return null;
}

function spec(arc, key, who, data, when, why, step = null) {
  return { key, who, data, when, why, kind: key, commit: () => {
    if (!book().list.includes(arc)) book().list.push(arc);
    arc.last = NOW;
    if (step) arc.step = step;
    if (/\.end\./.test(key)) arc.done = true;
  } };
}

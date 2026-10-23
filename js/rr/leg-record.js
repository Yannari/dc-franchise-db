// ══════════════════════════════════════════════════════════════════════
// rr/leg-record.js — one finished leg, as the record a wiki, trivia and awards are made from
// ══════════════════════════════════════════════════════════════════════
//
// The user, 2026-10-23: "does it save their rank each leg and things like that are necessary to fill a
// wiki/trivia/awards". The export kept each leg's check-in order and the season's totals; this keeps the rest of what
// the race already knew: when each team checked in and how far behind, each penalty and why, every challenge run (the
// side, the partner who did it, the tries, the minutes), the reward, the passes, the Boomerang ballots, the sabotage by
// name, the fears and the injuries. PURE and serialisable: read from the finished season's state, written into the run
// tab's row (rr-run.js raceRows), carried by the export (rr/export.js). Teams are named as the export names them.
import { PLACES } from './places.js';

const hhmm = m => { const x = ((Math.round(m) % 1440) + 1440) % 1440; return `${String(Math.floor(x / 60)).padStart(2, '0')}:${String(x % 60).padStart(2, '0')}`; };
const SABOTAGE_ENDS = new Set(['works', 'seen', 'backfires']);
const FEAR_KINDS = new Set(['phobia', 'fear-through', 'refuse']);
const HURT_KINDS = new Set(['injury', 'illness', 'exhaustion']);

/** The record of leg `leg` (a played leg from playRaceSeason's `legs`); `prev` is the leg before it. */
export function legRecord(state, leg, prev = null) {
  const name = id => (id && state.teams[id] ? state.teams[id].name : id ?? null);
  const members = id => (state.teams[id] ? [state.teams[id].a, state.teams[id].b] : []);
  const clockStart = leg.clockStart ?? 420;
  const scenes = (leg.scenes || state.scenes.filter(s => s.leg === leg.n));
  const place = PLACES[leg.place];
  const stretchOf = id => place?.stretches.find(s => s.id === id) || null;

  // ── each team's check-in: the time, the clock, the gap, the penalty and why ──
  const finished = Object.keys(leg.times || {});
  const first = finished.length ? Math.min(...finished.map(id => leg.times[id])) : 0;
  const prevNonElim = prev?.nonElim?.id ?? null;
  const teams = (leg.order || []).map((id, k) => {
    const time = leg.times?.[id];
    const penalty = leg.penalties?.[id] || 0;
    const reasons = [];
    for (const s of scenes) for (const e of s.data?.effects || []) {
      if (e[0] === 'pending' && e[1] === id && e[2] > 0) reasons.push({ minutes: e[2], reason: s.data.ending && s.data.ending !== 'any' ? `${s.kind}:${s.data.ending}` : s.kind });
    }
    const named = reasons.reduce((a, r) => a + r.minutes, 0);
    if (penalty > named) reasons.push({ minutes: penalty - named, reason: prevNonElim === id ? 'carried from a non-elimination leg' : 'marked for a penalty' });
    return {
      team: name(id), members: members(id), place: k + 1,
      ...(time != null ? { time: Math.round(time), clock: hhmm(clockStart + time), day: Math.floor((clockStart + time) / 1440) + 1,
        gap: Math.round(time - first), arrived: Math.round(time - penalty) } : { time: null, clock: null, gap: null }),
      penalty, ...(penalty ? { penaltyReasons: reasons } : {}),
      // (when the team sets off on the next leg, minutes after the first team: half the check-in gap, capped)
      ...(leg.depart?.[id] != null ? { departsNextLeg: Math.round(leg.depart[id]) } : {}),
    };
  });

  // ── every challenge run ──
  const runs = (state.taskLog || []).filter(r => r.leg === leg.n);
  const challenges = [];
  for (const r of runs) {
    let ch = challenges.find(c => c.id === r.stretch);
    if (!ch) {
      const st = stretchOf(r.stretch);
      ch = { id: r.stretch, name: st?.label || st?.called || r.stretch, kind: r.kind || st?.kind || null,
        ...(st?.sides ? { sides: st.sides.map(s => ({ id: s.id, name: s.label || s.id })) } : {}), runs: [] };
      challenges.push(ch);
    }
    const st = stretchOf(r.stretch);
    const sideName = id => st?.sides?.find(s => s.id === id)?.label || id || null;
    ch.runs.push({
      team: name(r.team), members: members(r.team),
      by: r.who ? [r.who] : members(r.team),
      ...(r.side ? { side: r.side, sideName: sideName(r.side) } : {}),
      attempts: r.attempts ?? 1, fails: r.fails || 0,
      ...(r.switched ? { switched: true } : {}), ...(r.quit ? { quit: true } : {}),
      ...(r.right != null ? { right: r.right } : {}),
      from: Math.round(r.from), minutes: Math.round(r.to - r.from),
    });
  }
  // the switches the log keeps apart (a team that changed sides of an Either/Or)
  for (const sw of (state.switches || []).filter(x => x.leg === leg.n)) {
    const run = challenges.find(c => c.id === sw.stretch)?.runs.find(x => x.team === name(sw.team));
    if (run) { run.switched = true; run.switchedTo = sw.to; }
  }

  // ── the leg's rewards, passes, twists, sabotage, fears and injuries ──
  let reward = null, boomerangVote = null;
  const passes = [], sabotage = [], fears = [], hurt = [];
  for (const s of scenes) {
    const d = s.data || {};
    if (s.kind === 'reward' || s.kind === 'call-home') reward = { team: name(d.team), members: members(d.team), kind: d.reward || (s.kind === 'call-home' ? 'call-home' : null) };
    else if (s.kind === 'express-used') passes.push({ pass: 'express', team: name(d.team), stretch: d.stretch ?? null });
    else if (s.kind === 'save-used') passes.push({ pass: 'save', team: name(d.team) });
    else if (s.kind === 'boomerang-decide') passes.push({ pass: 'boomerang', team: name(d.team), on: name(d.other ?? d.target), ...(d.wasted ? { wasted: true } : {}), ...(d.blind ? { blind: true } : {}) });
    else if (s.kind === 'yield-decide') passes.push({ pass: 'yield', team: name(d.team), on: name(d.other) });
    else if (s.kind === 'boomerang-vote') boomerangVote = { target: name(d.target), ballots: (d.ballots || []).map(b => ({ from: name(b.from), to: name(b.to) })) };
    else if (s.family === 8 && d.other && SABOTAGE_ENDS.has(d.ending)) {
      sabotage.push({ kind: s.kind, by: name(d.team), on: name(d.other), caught: d.ending === 'seen', ...(d.ending === 'backfires' ? { backfired: true } : {}), stretch: d.stretch ?? null });
    } else if (FEAR_KINDS.has(s.kind)) fears.push({ racer: s.who?.[0] ?? null, team: name(d.team), kind: s.kind, ending: d.ending ?? null, stretch: d.stretch ?? null });
    else if (HURT_KINDS.has(s.kind) && !(s.kind === 'exhaustion' && d.ending !== 'collapse')) hurt.push({ racer: s.who?.[0] ?? null, team: name(d.team), kind: s.kind, ending: d.ending ?? null });
  }

  return {
    clockStart, clock: hhmm(clockStart),
    route: (leg.route || []).map(id => ({ id, name: stretchOf(id)?.label || id, kind: leg.stretchKinds?.[id] ?? stretchOf(id)?.kind ?? null })),
    teams, challenges, reward, passes, boomerangVote, sabotage, fears, hurt,
    nonElim: leg.nonElim ? { team: name(leg.nonElim.id), penalty: leg.nonElim.penalty } : null,
    saved: leg.saved ? name(leg.saved) : null,
    onLocation: (leg.onLocation || []).map(name),
    money: leg.money ?? null,
  };
}

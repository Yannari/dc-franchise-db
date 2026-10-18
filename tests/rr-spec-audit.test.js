// The Ridonculous Race: the hundred-season spec audit (npm run audit:rr-spec; RR_SEASONS sets the count).
// Every line is measured INSIDE the season loop (manual §11.5 T) and printed beside its chance line
// where it has one. An outcome rate is a read-out, not a target (§17.5): it asks only the hard rules.
import { it, expect } from 'vitest';
import { playRaceSeason } from '../js/rr/season.js';
import { SCENES } from '../js/rr/scenes.js';
import { mayScheme, REL } from '../js/rr/state.js';
import { setPlayers, players } from '../js/core.js';
import { streamFor } from '../js/dr/rng.js';
import { raceCast } from './helpers/rr-cast.js';
import { airSeason } from '../js/rr/episode.js';
import { POOLS } from '../js/rr/script/lines/index.js';

const N = Number(process.env.RR_SEASONS || 100);
const TEAMS = Number(process.env.RR_TEAMS || 12);
const NICE = ['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat'];
const BLOWUPS = { snap: null, 'old-wound': ['explodes'], blame: ['blow-up'], shove: ['shove'] };
const pct = (a, b) => (b ? `${(100 * a / b).toFixed(1)}%` : '-');
const avg = xs => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const f1 = x => (Number.isFinite(x) ? x.toFixed(1) : '-');
const inc = (m, k, d = 1) => { m[k] = (m[k] || 0) + d; };

it(`audits ${N} seasons of ${TEAMS} teams`, () => {
  const M = {
    topWins: [], topWinsChance: [], mostWinsWon: 0, legs: 0, gaps: [], flightClosed: 0, flightLegs: 0,
    closeFinish: 0, elimLegs: 0, penalties: {}, penaltyMin: {}, sab: 0, sabCaught: 0, sabScheme: 0, sabNice: 0,
    boomUsed: 0, boomWasted: 0, boomGap: [], begged: 0, begScenes: 0, borrows: 0, dodged: 0, brokeStarts: 0, teamLegs: 0,
    quits: 0, medevacs: 0, returns: 0, onLocation: 0, nonElim: {}, nonElimOut: {}, alliances: 0, allianceLife: [],
    snaps: {}, relLegs: {}, switches: 0, botchViolations: 0, moments: 0, kinds: {}, partner: 0, between: 0, group: 0,
    chains: 0, worstPair: 0, opened: {}, advanced: {}, closed: {}, interruptedBeforePayoff: [], noEffects: 0, winners: 0,
    epScenes: [], epLines: [], unwritten: {}, segs: 0, maxUse: { id: null, n: 0 }, saidTwice: 0,
  };
  const chance = streamFor(99, 'audit-chance');

  for (let s = 1; s <= N; s++) {
    const { cast, teams } = raceCast(TEAMS, s);
    setPlayers(cast);
    const twists = s % 2 ? { 3: 'boomerang', 5: 'yield', 7: 'boomerang' } : { 3: 'boomerang-vote', 6: 'boomerang' };
    const res = playRaceSeason({ teams, seed: s, options: { twists } });
    const st = res.state;
    const arch = n => players.find(p => p.name === n)?.archetype;
    if (res.winner) M.winners++;

    // the dialogue: what aired, how long, what had no words, what wore out
    const eps = airSeason(res);
    for (const ep of eps) {
      M.epScenes.push(ep.segments.length);
      M.epLines.push(ep.segments.reduce((n, sg) => n + (sg.lines?.length || 0), 0));
      for (const sg of ep.segments) if (!sg.lines) inc(M.unwritten, sg.kind + (sg.ending ? '.' + sg.ending : ''));
      M.segs += ep.segments.length;
    }
    const uses = st.lineLedger?.uses || {};
    for (const [id, n] of Object.entries(uses)) if (n > M.maxUse.n) M.maxUse = { id, n, season: s };
    // the same exchange said twice by the same person in a season
    for (const [id, by] of Object.entries(st.lineLedger?.by || {})) {
      const seen = new Set();
      for (const n of by) { if (seen.has(n)) M.saidTwice++; seen.add(n); }
    }

    // leg wins: the top team, beside a uniformly random winner each leg among the teams racing it
    const wins = st.order.map(id => st.rec[id].legWins);
    M.topWins.push(Math.max(...wins));
    const rand = {};
    for (const l of res.legs) { const ids = l.order.filter(id => l.times?.[id] != null); if (ids.length) inc(rand, ids[Math.floor(chance() * ids.length)]); }
    M.topWinsChance.push(Math.max(0, ...Object.values(rand)));
    const most = st.order.filter(id => st.rec[id].legWins === Math.max(...wins));
    if (most.includes(res.winner)) M.mostWinsWon += 1 / most.length;

    for (const [i, l] of res.legs.entries()) {
      M.legs++;
      const ts = Object.values(l.times || {});
      if (ts.length > 1) M.gaps.push(Math.max(...ts) - Math.min(...ts));
      // a flight that put teams 30+ minutes apart at the start on the same plane
      const flights = l.scenes.filter(x => x.kind === 'same-flight');
      if (flights.length) {
        M.flightLegs++;
        if (flights.some(f => { const ss = f.data.teams.map(id => l.starts?.[id] ?? 0); return Math.max(...ss) - Math.min(...ss) >= 30; })) M.flightClosed++;
      }
      if (l.kind === 'elim') {
        M.elimLegs++;
        const fin = l.order.filter(id => l.times?.[id] != null).map(id => l.times[id]).sort((a, b) => a - b);
        if (fin.length >= 2 && fin.at(-1) - fin.at(-2) < 5) M.closeFinish++;
      }
      for (const id of l.eliminated) if (l.how[id] === 'on-location') M.onLocation++;
      if (l.nonElim) {
        inc(M.nonElim, l.nonElim.penalty);
        if (res.legs[i + 1]?.eliminated.includes(l.nonElim.id)) inc(M.nonElimOut, l.nonElim.penalty);
      }
      M.brokeStarts += (l.broke || []).length;
      M.teamLegs += l.order.length;
      for (const id of l.order) { const rel = st.teams[id].rel; inc(M.relLegs, rel); }
    }

    // scenes
    const byId = Object.fromEntries(st.scenes.map(x => [x.id, x]));
    const pairsByLeg = {};
    for (const sc of st.scenes) {
      const d = sc.data || {};
      if (!d.effects?.length) M.noEffects++;
      const kind = SCENES[sc.kind];
      inc(M.kinds, sc.kind);
      for (const e of d.effects || []) if (e[0] === 'pending' && e[2] > 0) { inc(M.penalties, sc.kind); inc(M.penaltyMin, sc.kind, e[2]); }
      if (kind?.family === 8 && kind.scheme) {
        M.sab++;
        if (d.facts?.caught) M.sabCaught++;
        if (mayScheme(sc.who[0])) M.sabScheme++;
        if (NICE.includes(arch(sc.who[0]))) M.sabNice++;
      }
      if (sc.kind === 'boomerang-decide') { if (d.wasted) M.boomWasted++; else { M.boomUsed++; if (d.rankGap != null) M.boomGap.push(d.rankGap); } }
      if (sc.kind === 'beg') M.begScenes++;
      if (sc.kind === 'borrow') M.borrows++;
      if (sc.kind === 'repay' && d.ending === 'dodged') M.dodged++;
      if (sc.kind in BLOWUPS && (!BLOWUPS[sc.kind] || BLOWUPS[sc.kind].includes(d.ending)) && d.team) inc(M.snaps, st.teams[d.team].rel);
      if (kind && kind.family !== 13 && kind.family !== 11 && kind.family !== 12) {
        M.moments++;
        if (kind.family === 1) M.partner++; else if (kind.family === 3) M.group++; else if (kind.cast === 'teams') M.between++;
      }
      if (d.cause != null && !sc.kind.startsWith('int-') && byId[d.cause] && SCENES[byId[d.cause].kind]?.next?.[byId[d.cause].data.ending] === sc.kind) M.chains++;
      // the cap is on what the talk layer chooses; a chained scene (a confession answered) continues one
      if (kind && kind.family !== 13 && d.talk && d.cause == null) {
        const teamOf = n => st.order.find(id => st.teams[id].a === n || st.teams[id].b === n);
        for (const x of sc.who) for (const y of sc.who) if (x < y && teamOf(x) !== teamOf(y)) inc((pairsByLeg[sc.leg] ||= {}), `${x}|${y}`);
      }
      for (const tag of d.threads || []) {
        const [name] = tag.split(' ');
        if (tag.endsWith('opens')) inc(M.opened, name); else if (tag.endsWith('closed')) inc(M.closed, name); else if (!tag.endsWith('held')) inc(M.advanced, name);
      }
    }
    for (const p of Object.values(pairsByLeg)) M.worstPair = Math.max(M.worstPair, ...Object.values(p));
    for (const th of st.threads.filter(t => t.thread === 'crush' && t.closed?.startsWith('confession:'))) {
      const k = [...th.who].sort().join('|');
      M.interruptedBeforePayoff.push(st.scenes.filter(x => x.kind === 'confession-attempt' && x.data.ending === 'interrupted'
        && [...(x.data.facts?.lovers || [])].sort().join('|') === k).length);
    }
    M.begged += st.order.reduce((a, id) => a + st.rec[id].begged, 0);
    M.quits += Object.keys(st.quitting || {}).length;
    M.medevacs += (st.medevacs || []).length;
    M.returns += (st.medevacs || []).filter(m => m.returned).length;
    M.alliances += st.alliances.length;
    const lastLeg = res.legs.length;
    for (const al of st.alliances) M.allianceLife.push((al.ended || lastLeg) - al.since);
    M.switches += (st.switches || []).length;
    // the Botch rule: partners alternate (a random Botch aside)
    const hist = {};
    for (const h of st.botch.history || []) {
      const prev = hist[h.team];
      if (prev && !h.random && !prev.random && prev.who === h.who) M.botchViolations++;
      hist[h.team] = h;
    }
  }

  const L = [];
  const line = (label, value, chanceLine = '') => L.push(`${label.padEnd(58)} ${String(value).padStart(10)}${chanceLine ? `   chance ${chanceLine}` : ''}`);
  L.push(`== The Ridonculous Race · ${N} seasons · ${TEAMS} teams ==`);
  line('leg wins of the top team per season', f1(avg(M.topWins)), f1(avg(M.topWinsChance)));
  line('the team with the most leg wins wins the season', pct(M.mostWinsWon, N), pct(N / 3, N));
  line('mean gap at the mat, first to last (min)', f1(avg(M.gaps)));
  line('legs where a flight put teams 30+ min apart together', pct(M.flightClosed, M.flightLegs));
  line('elimination legs decided by under 5 minutes', pct(M.closeFinish, M.elimLegs));
  line('penalties per season', f1(Object.values(M.penalties).reduce((a, b) => a + b, 0) / N));
  for (const [k, v] of Object.entries(M.penalties).sort((a, b) => b[1] - a[1])) line(`   ${k}`, `${f1(v / N)} (${Math.round(M.penaltyMin[k] / v)}m)`);
  line('sabotage attempts per season', f1(M.sab / N));
  line('   share caught', pct(M.sabCaught, M.sab));
  line('   share by teams who may scheme (must be 100%)', pct(M.sabScheme, M.sab));
  line('Boomerangs used / wasted', `${M.boomUsed} / ${M.boomWasted}`);
  line('   perceived-rank distance to the target', f1(avg(M.boomGap) * 10) + '/10');
  line('begging scenes per season', f1(M.begScenes / N));
  line('   money begged per season', f1(M.begged / N));
  line('borrowing per season / debts dodged per season', `${f1(M.borrows / N)} / ${f1(M.dodged / N)}`);
  line('team-legs started at $0', pct(M.brokeStarts, M.teamLegs));
  line('quits / medevacs / returns per 100 seasons', `${M.quits} / ${M.medevacs} / ${M.returns}`);
  line('on-location eliminations per season', f1(M.onLocation / N));
  for (const [k, v] of Object.entries(M.nonElim)) line(`non-elimination saves: ${k}`, `${v} (${pct(M.nonElimOut[k] || 0, v)} out next leg)`);
  line('alliances per season / mean life in legs', `${f1(M.alliances / N)} / ${f1(avg(M.allianceLife))}`);
  for (const rel of Object.keys(REL)) if (M.relLegs[rel]) line(`blow-ups per team-leg: ${rel}`, ((M.snaps[rel] || 0) / M.relLegs[rel]).toFixed(3));
  line('Either/Or switches per season', f1(M.switches / N));
  line('Botch alternation violations (must be 0)', M.botchViolations);
  line('moments per team per leg', f1(M.moments / M.teamLegs));
  line('partner / between teams / group', `${pct(M.partner, M.moments)} / ${pct(M.between, M.moments)} / ${pct(M.group, M.moments)}`);
  line('chains per leg', (M.chains / M.legs).toFixed(2));
  line('worst count for one cross-team pair in one leg (cap 3)', M.worstPair);
  for (const t of Object.keys({ ...M.opened, ...M.closed })) line(`thread ${t}: opened / advanced / closed per season`, `${f1((M.opened[t] || 0) / N)} / ${f1((M.advanced[t] || 0) / N)} / ${f1((M.closed[t] || 0) / N)}`);
  line('interrupted confession attempts before a confession', f1(avg(M.interruptedBeforePayoff)));
  line('aired scenes per episode / lines per episode', `${f1(avg(M.epScenes))} / ${f1(avg(M.epLines))}`);
  line('aired scenes with no words yet', pct(Object.values(M.unwritten).reduce((a, b) => a + b, 0), M.segs));
  L.push(`   no words for: ${Object.entries(M.unwritten).sort((a, b) => b[1] - a[1]).slice(0, 25).map(([k, v]) => `${k}:${v}`).join(' ')}`);
  line('the most-aired entry in one season', `${M.maxUse.id} x${M.maxUse.n}`);
  line('one person saying the same exchange twice in a season', M.saidTwice);
  line('pools / entries written', `${Object.keys(POOLS).length} / ${Object.values(POOLS).reduce((a, l) => a + l.length, 0)}`);
  const never = Object.keys(SCENES).filter(k => !M.kinds[k]);
  L.push(`kinds that never fired (${never.length}): ${never.join(', ')}`);
  const rare = Object.entries(M.kinds).filter(([k]) => SCENES[k]).sort((a, b) => a[1] - b[1]).slice(0, 15);
  L.push(`rarest that fired: ${rare.map(([k, v]) => `${k}:${v}`).join(' ')}`);
  console.log(L.join('\n'));

  expect(M.sabNice).toBe(0);
  expect(M.botchViolations).toBe(0);
  expect(M.winners).toBe(N);
  expect(M.noEffects).toBe(0);
}, 1_800_000);

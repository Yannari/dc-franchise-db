// ══════════════════════════════════════════════════════════════════════
// ch/party.js — the night out, the fights, the disqualification
// ══════════════════════════════════════════════════════════════════════
//
// Spec §4.8. About one night out a cycle. Drinking raises the conflict risk,
// scaled by temperament; old grudges and fresh ballots are what people fight
// about. A fight that turns PHYSICAL is a disqualification: TJ comes in and
// sends the aggressor home (the real show's rule on violence). This is the
// show's chaos engine, so it stays a real risk without becoming a weekly event:
// a physical fight needs a bad grudge, a short fuse and a big night together.
import { getBond, addBond } from '../bonds.js';
import { S, archetypeOf, addScene, clamp } from './state.js';
import { grudgeOf, intimidated, remember, attractOf } from './rel.js';
import { nudge } from './mind.js';
import { romanceDay } from './romance.js';
import { romanticCompat } from '../players.js';
import { coupleOf } from './callout.js';
import { addRivalry } from './events.js';
import { gs } from '../core.js';
import { allianceOf } from './alliances.js';
import { planOf } from './plans.js';
import { learn, factId } from '../knowledge.js';
import { stableRng } from '../script/rng.js';
import { noteDeal } from './knowledge.js';
import { freeRide } from './respect.js';
import { causeOf, dislikeOf } from './cause.js';

const pop = (name, d) => { gs.popularity ||= {}; gs.popularity[name] = (gs.popularity[name] || 0) + d; };

// ── the night's drama (the user, 2026-10-16: "don't make the night out thin, knowing it can cause a lot of
// drama"). Drink loosens people: what they would never say sober, they say at the bar. Each beat at most
// once a night, each with what it costs; the fights below are the rest. ──
function nightDrama(state, rng, drink) {
  const act = state.active, busy = new Set();
  const free = n => !busy.has(n);
  const out = [];
  // 1. Loose lips: a drunk alliance member tells an outsider the plan.
  const talkers = act.filter(n => free(n) && drink[n] >= 0.55 && allianceOf(state, n)).sort((x, y) => drink[y] - drink[x]);
  for (const a of talkers) {
    const al = allianceOf(state, a);
    if (rng() >= drink[a] * (1.1 - S(a, 'temperament') / 10) * 0.32) continue;
    const listener = act.filter(n => n !== a && free(n) && !al.members.includes(n) && getBond(a, n) >= 0).sort((x, y) => getBond(a, y) - getBond(a, x))[0];
    if (!listener) continue;
    const target = (planOf(state, a)?.targets || []).find(t => act.includes(t) && t !== a && !al.members.includes(t)) || null;
    // the same seed plays the same season: belief draws come from a named stream, never Math.random
    const lr = stableRng(state.seed, 'slip', state.ep, a, listener);
    for (const m of al.members.filter(x => act.includes(x))) learn(listener, factId('alliance', m, String(al.id)), { sourceType: 'told', source: a, from: a, ep: state.ep, confidence: 0.7, rng: lr });
    if (target) learn(listener, factId('target', a, target), { sourceType: 'told', source: a, from: a, ep: state.ep, confidence: 0.7, rng: lr });
    // told the very person the plan is about, or their close friend
    const self = target === listener;
    if (target && (self || getBond(listener, target) >= 3)) { remember(target, a, 'plotting-against-me', 1.2); addBond(target, a, -1); nudge(state, target, 'paranoia', 1); }
    // an ally saw it happen
    const caught = al.members.find(m => m !== a && act.includes(m) && free(m) && rng() < 0.5) || null;
    if (caught) { remember(caught, a, 'loose-lips', 1); addBond(caught, a, -0.6); }
    busy.add(a); busy.add(listener); if (caught) busy.add(caught);
    // a group of three in a house of twenty does not "decide everything": the boast is only said when it is near true
    const strong = al.members.filter(m => act.includes(m)).length * 3 >= act.length;
    out.push(addScene(state, 'party-slip', [a, listener, ...(caught ? [caught] : [])], { alliance: al.name, target, self, caught, strong }, [a, listener, ...(caught ? [caught] : [])], 'party'));
    break;
  }
  // 2. A deal at the bar: two drunk friends promise each other the final. Real, and fragile.
  for (const a of act.filter(n => free(n) && drink[n] >= 0.5)) {
    const b = act.filter(n => n !== a && free(n) && drink[n] >= 0.45 && getBond(a, n) >= 2 && !state.deals.some(d => !d.broken && ((d.a === a && d.b === n) || (d.a === n && d.b === a))))
      .sort((x, y) => getBond(a, y) - getBond(a, x))[0];
    if (!b || rng() >= 0.3) continue;
    state.deals.push({ id: state.deals.length + 1, a, b, ep: state.ep, broken: null, tier: 'final', drunk: true });
    noteDeal(state, a, b);
    addBond(a, b, 0.8);
    busy.add(a); busy.add(b);
    out.push(addScene(state, 'party-deal', [a, b], {}, [a, b], 'party'));
    break;
  }
  // 3. The call-out: somebody bold climbs on a chair and says it to a rival in front of the whole club.
  for (const a of act.filter(n => free(n) && drink[n] >= 0.6 && S(n, 'boldness') >= 6).sort((x, y) => drink[y] - drink[x])) {
    const b = act.filter(n => n !== a && free(n) && (getBond(a, n) <= -2 || grudgeOf(a, n) >= 1)).sort((x, y) => grudgeOf(a, y) - grudgeOf(a, x))[0];
    if (!b || rng() >= drink[a] * 0.55) continue;
    // what it is about: a vote, never having been in, or just the feud
    const why = state.episodes.some(e => (e.votes || []).some(v => v.ballots.some(x => x.voter === b && x.target === a))) ? 'vote' : freeRide(state, b) > 0.4 ? 'floater' : 'feud';
    // a feud is only a feud when something happened (cause.js): no call-out over first impressions
    const cause = why === 'feud' ? causeOf(a, b, state.ep) : null;
    if (why === 'feud' && !cause) continue;
    const firesBack = rng() < 0.35 + S(b, 'boldness') * 0.05;
    addBond(a, b, -1.2);
    addRivalry(state, a, b, 1);
    remember(b, a, 'called-me-out', 1);
    nudge(state, b, 'paranoia', 0.6);
    pop(a, S(a, 'social') >= 6 ? 0.3 : -0.3);
    if (firesBack) { pop(b, 0.3); nudge(state, a, 'paranoia', 0.4); }
    busy.add(a); busy.add(b);
    out.push(addScene(state, 'party-callout', [a, b], { why, firesBack, ...(cause ? { causeLine: cause.line, causeType: cause.group } : {}) }, act, 'party'));
    break;
  }
  // 4. Tears at the bar: somebody low and homesick breaks, and a friend is there, or nobody is.
  for (const a of act.filter(n => free(n) && drink[n] >= 0.45 && ((state.mind[n]?.morale ?? 6) <= 4.5 || (state.mind[n]?.homesick ?? 0) >= 6))) {
    if (rng() >= 0.5) continue;
    const f = act.filter(n => n !== a && free(n) && getBond(a, n) >= 2).sort((x, y) => getBond(a, y) - getBond(a, x))[0] || null;
    if (f) { addBond(a, f, 1); remember(a, f, 'emotional-support', 1.2); nudge(state, a, 'homesick', -1); nudge(state, a, 'morale', 0.8); }
    else nudge(state, a, 'morale', -0.5);
    busy.add(a); if (f) busy.add(f);
    out.push(addScene(state, 'party-tears', f ? [a, f] : [a], { comforted: !!f }, f ? [a, f] : [a], 'party'));
    break;
  }
  // 5. The drunk kiss (the user, 2026-10-16: "drunk romance, a kiss at the night out, and cheating drama, you kissed
  //    my boyfriend, a fight about it, like Jersey Shore"). Two drunk people with something between them kiss. When
  //    the one who kissed is somebody's (a showmance in the house, or a partner at home), it is cheating: the partner
  //    may see it at the club, a friend of theirs may see it and tell them in the morning (kissFallout), or nobody does.
  for (const a of act.filter(n => free(n) && drink[n] >= 0.55).sort((x, y) => drink[y] - drink[x])) {
    const partnerIn = coupleOf(state, a);
    const b = act.filter(n => n !== a && n !== partnerIn && free(n) && drink[n] >= 0.45 && romanticCompat(a, n)
      && (attractOf(a, n) > 0.3 || getBond(a, n) >= 2 || (state.sparks[a < n ? `${a}|${n}` : `${n}|${a}`] || 0) >= 1))
      .sort((x, y) => (attractOf(a, y) + getBond(a, y) * 0.2) - (attractOf(a, x) + getBond(a, x) * 0.2))[0];
    if (!b) continue;
    // somebody's is likelier to stop, and how much depends on who they are
    const taken = !!partnerIn || !!state.atHome?.[a];
    const restraint = taken ? Math.max(0.1, 1.3 - S(a, 'loyalty') / 10) : 1;
    const flirt = archetypeOf(a) === 'showmancer' ? 1.5 : 1;
    // (measured: 0.55 for everybody kissed 2.3 single pairs a season, about every night out; somebody taken kisses at
    // the old rate, which their restraint already lowers)
    if (rng() >= drink[a] * drink[b] * (taken ? 0.55 : 0.25) * restraint * flirt) continue;
    const k = a < b ? `${a}|${b}` : `${b}|${a}`;
    state.sparks[k] = (state.sparks[k] || 0) + 1.2;
    addBond(a, b, 0.8);
    busy.add(a); busy.add(b);
    if (partnerIn) {
      // the partner, if they are out tonight and looking, sees it; or a friend of theirs does
      const caught = free(partnerIn) && rng() < 0.35 + drink[partnerIn] * 0.2;
      const teller = !caught ? act.find(w => w !== a && w !== b && w !== partnerIn && free(w) && getBond(w, partnerIn) >= 3 && rng() < 0.65) || null : null;
      pop(a, -1.5);
      if (caught) {
        busy.add(partnerIn);
        const blowup = rng() < (10 - S(partnerIn, 'temperament')) / 10 * 0.7 + drink[partnerIn] * 0.2;
        kissConsequence(state, rng, { wronged: partnerIn, kisser: a, kissed: b, blowup });
        out.push(addScene(state, 'party-kiss', [a, b, partnerIn], { partner: partnerIn, caught: true, blowup, ended: !coupleOf(state, a) }, act, 'party'));
      } else {
        if (teller) state.pendingKiss = { wronged: partnerIn, kisser: a, kissed: b, teller, day: state.day };
        out.push(addScene(state, 'party-kiss', [a, b], { partner: partnerIn, seen: !!teller }, teller ? [a, b, teller] : [a, b], 'party'));
      }
    } else if (state.atHome?.[a]) {
      // somebody at home: the house will talk about it (events.js home-gossip), and the audience already is
      pop(a, -1);
      state.atHome[a].kissed = b;
      out.push(addScene(state, 'party-kiss', [a, b], { home: state.atHome[a].name }, act, 'party'));
    } else {
      out.push(addScene(state, 'party-kiss', [a, b], {}, act, 'party'));
    }
    break;
  }
  return out;
}

// What kissing somebody's partner costs, whenever they find out: both of them, and maybe the couple.
function kissConsequence(state, rng, { wronged: p, kisser: a, kissed: b, blowup }) {
  addBond(p, b, blowup ? -3.5 : -2.5); addBond(p, a, blowup ? -3 : -2);
  remember(p, b, 'kissed-my-partner', 2); remember(p, a, 'cheated-on-me', 2);
  addRivalry(state, p, b, blowup ? 2 : 1);
  nudge(state, p, 'morale', -2); nudge(state, p, 'paranoia', 0.8);
  if (blowup) { nudge(state, p, 'confidence', -0.4); pop(p, 0.6); }
  // the couple: the wronged one ends it, unless they are the forgiving kind and still close
  const c = state.couples.find(x => !x.ended && ((x.a === a && x.b === p) || (x.a === p && x.b === a)));
  if (c && rng() < 0.35 + (10 - S(p, 'temperament')) * 0.03 + Math.max(0, 3 - getBond(p, a)) * 0.08) {
    c.ended = state.ep; c.endedBy = p; c.why = 'kiss';
    remember(a, p, 'dumped-me', 1); nudge(state, a, 'morale', -1.2);
  }
}

/** The morning after a kiss somebody saw: the friend tells, and the one wronged goes to find the one who did it. */
export function kissFallout(state, rng) {
  const k = state.pendingKiss;
  if (!k || state.day <= k.day) return null;
  state.pendingKiss = null;
  const { wronged: p, kisser: a, kissed: b, teller } = k;
  if (![p, a, b].every(n => state.active.includes(n))) return null;
  addBond(p, teller, 0.8); remember(p, teller, 'told-me-the-truth', 1.2);
  addBond(a, teller, -1.2); remember(a, teller, 'talked-behind-my-back', 1);
  const blowup = rng() < (10 - S(p, 'temperament')) / 10 * 0.6;
  kissConsequence(state, rng, { wronged: p, kisser: a, kissed: b, blowup });
  return addScene(state, 'kiss-fallout', [p, b, a, ...(state.active.includes(teller) ? [teller] : [])],
    { blowup, ended: !coupleOf(state, a) }, state.active, 'villa');
}

export function partyNight(state, rng) {
  const drink = Object.fromEntries(state.active.map(n => [n,
    clamp((S(n, 'boldness') * 0.5 + (10 - S(n, 'temperament')) * 0.3 + S(n, 'social') * 0.2) / 10 + (rng() - 0.5) * 0.4, 0.05, 1)]));
  addScene(state, 'party', state.active, { drink: Object.fromEntries(Object.entries(drink).map(([k, v]) => [k, +v.toFixed(2)])) }, state.active, 'party');
  romanceDay(state, rng, { boost: 2.5 });
  const drama = nightDrama(state, rng, drink);
  const fights = [];
  const dq = [];
  const seen = new Set();
  for (const a of state.active) {
    for (const b of state.active) {
      if (a >= b) continue;
      const beef = Math.max(0, -getBond(a, b)) + grudgeOf(a, b) * 0.6 + grudgeOf(b, a) * 0.6;
      // The same two do not fight every night: a fight within two episodes cools it.
      if (state.lastFight?.[`${a}|${b}`] >= state.ep - 1) continue;
      if (beef < 2.5) continue;
      // something has to have happened between them, on camera (cause.js), and one fight is the night's fight
      if (fights.length) continue;
      // a real event between them, or plain dislike when they genuinely can't stand each other
      const cause = causeOf(a, b, state.ep) || (Math.min(getBond(a, b), getBond(b, a)) <= -2.5
        ? dislikeOf((10 - S(a, 'temperament')) >= (10 - S(b, 'temperament')) ? a : b, (10 - S(a, 'temperament')) >= (10 - S(b, 'temperament')) ? b : a, state.ep) : null);
      if (!cause) continue;
      const fuse = ((10 - S(a, 'temperament')) + (10 - S(b, 'temperament'))) / 20;
      const hot = (archetypeOf(a) === 'hothead' || archetypeOf(b) === 'hothead') ? 1.4 : 1;
      const p = clamp((beef - 2) * 0.03 * fuse * (drink[a] + drink[b]) * hot, 0, 0.35);
      if (rng() >= p) continue;
      if (seen.has(a) || seen.has(b)) continue;
      seen.add(a); seen.add(b);
      // Who started it: the shorter fuse and the bigger grudge.
      const starter = cause.holder;
      (state.lastFight ||= {})[`${a}|${b}`] = state.ep;
      const other = starter === a ? b : a;
      addBond(a, b, -2);
      intimidated(starter, other, 0.8);
      remember(other, starter, 'started-a-fight', 1.4);
      addRivalry(state, starter, other, 1.5);
      state.rec[a].fights++; state.rec[b].fights++;
      nudge(state, a, 'morale', -0.6); nudge(state, b, 'morale', -0.6);
      // Physical: the starter's fuse, their boldness, how drunk.
      // After TJ has had to send somebody home, nobody wants to be next (tj.js).
      const warned = state.tjWarning != null && state.ep - state.tjWarning <= 2 ? 0.45 : 1;
      const pPhys = clamp((10 - S(starter, 'temperament')) / 10 * S(starter, 'boldness') / 10 * drink[starter] * 0.22 * hot * warned, 0, 0.3);
      const physical = rng() < pPhys;
      fights.push({ a: starter, b: other, physical });
      // The house takes sides: friends of each.
      const sides = state.active.filter(x => x !== a && x !== b).map(x => ({ x, lean: getBond(x, starter) - getBond(x, other) }))
        .filter(s => Math.abs(s.lean) >= 2);
      for (const s of sides) {
        const against = s.lean > 0 ? other : starter;
        addBond(s.x, against, -0.5);
      }
      addScene(state, physical ? 'fight-physical' : 'fight', [starter, other], { sides: sides.map(s => ({ who: s.x, with: s.lean > 0 ? starter : other })), causeLine: cause.line, causeType: cause.group }, state.active, 'party');
      if (physical) dq.push({ name: starter, victim: other });
    }
  }
  for (const n of state.active) nudge(state, n, 'energy', -0.9 * drink[n]);
  return { drink, fights, dq, drama: drama.map(sc => sc.kind) };
}

// ── an expulsion, and the house (the user, 2026-10-16: "people actually reacting to someone getting expelled") ──
// Before TJ sends them home: their goodbye with the friends who are losing them. After: a friend blames the one
// they fought, and the one they fought has to live with it. Each moves the house (bonds, morale, a grudge).
export function expelledGoodbye(state, gone, victim) {
  const friends = state.active.filter(n => n !== gone && n !== victim && getBond(gone, n) >= 2).sort((x, y) => getBond(gone, y) - getBond(gone, x)).slice(0, 2);
  const angry = S(gone, 'temperament') <= 4;
  for (const f of friends) { nudge(state, f, 'morale', -0.9); nudge(state, f, 'homesick', 0.4); if (victim) { remember(f, victim, 'got-my-friend-expelled', 1); addBond(f, victim, -0.8); } }
  addScene(state, 'expelled-goodbye', [gone, ...friends], { victim, angry }, state.active, 'villa');
  return friends;
}
export function expelledAftermath(state, gone, victim, friends = []) {
  if (!victim || !state.active.includes(victim)) return;
  const f = friends.find(n => state.active.includes(n));
  if (f) {
    const heated = S(f, 'temperament') <= 5 || getBond(f, victim) <= -1;
    addBond(f, victim, heated ? -1 : -0.4);
    addRivalry(state, f, victim, heated ? 1 : 0.5);
    nudge(state, victim, 'paranoia', 0.8);
    addScene(state, 'expelled-blame', [f, victim], { gone, heated }, state.active, 'villa');
  }
  // the one they fought: shaken, or relieved, and a friend who stays with them
  const vf = state.active.filter(n => n !== victim && n !== f && getBond(victim, n) >= 2).sort((x, y) => getBond(victim, y) - getBond(victim, x))[0] || null;
  const relieved = getBond(victim, gone) <= -3;
  if (vf) { addBond(victim, vf, 0.6); remember(victim, vf, 'emotional-support', 1); }
  nudge(state, victim, 'morale', relieved ? 0.4 : -0.6);
  addScene(state, 'expelled-victim', vf ? [victim, vf] : [victim], { gone, relieved }, vf ? [victim, vf] : [victim], vf ? 'villa' : 'confessional');
}

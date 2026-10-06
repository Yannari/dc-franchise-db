// ══════════════════════════════════════════════════════════════════════
// bb/story/director.js — which three to five conversations a stretch airs
// ══════════════════════════════════════════════════════════════════════
//
// Spec §3.2. Runs once a week, after the week has happened (simulateBBWeek
// calls airStorylines(week) just before it returns), so it reads the whole
// week in order and touches no game state: it files every house beat into its
// storyline, and for each stretch between ceremonies picks the steps worth a
// scene. A step airs only if it can be UNDERSTOOD: the earlier step it answers
// either aired or is said plainly at the top of the scene (recap). An
// apology with no offence on record has no cause and never airs.
//
// Each aired scene is stored on the act its step came from (`act.scenes`), so
// the viewer and the transcript keep the week's real order.

import { gs } from '../../core.js';
import { classify, file, causeOf } from './storylines.js';
import { writeStoryScene, writeSetPiece, writeGameTalk, hasPool, roomName } from './write.js';
import { gameTalkFor, bondTalkFor, phaseOf } from './gametalk.js';

const CEREMONY = new Set(['hoh', 'nominations', 'veto', 'veto-ceremony', 'eviction']);

// How much each step is worth on screen (narrative weighting, never gameplay).
const DRAMA = {
  'feud.friction.snap': 7, 'feud.friction.chores': 5, 'feud.friction.joke': 5, 'feud.argument': 9, 'feud.apology': 6, 'feud.cold': 4,
  'alliance.formed': 7, 'alliance.formed.pact': 5, 'alliance.recruit': 5, 'alliance.checkin': 4, 'alliance.leftout': 6, 'alliance.poach': 6,
  'alliance.exposed': 8, 'alliance.betrayal': 9, 'alliance.repair': 6,
  'showmance.spark': 5, 'showmance.kiss': 7, 'showmance.declare': 8, 'showmance.hiding': 4, 'showmance.jealous': 7,
  'showmance.fight': 8, 'showmance.breakup': 9,
  'target.pitch': 6, 'target.gossip': 4, 'target.lobby': 6, 'target.block': 6, 'target.backdoor': 7, 'target.count': 5,
  'scheme.lie': 6, 'scheme.caught': 9,
  'life.banter': 3, 'life.prank': 4, 'life.chores': 3, 'life.latenight': 3, 'life.friends': 3, 'life.homesick': 4, 'life.breakdown': 6,
};
const dramaOf = s => DRAMA[`${s.type}.${s.step}.${s.outcome}`] ?? DRAMA[`${s.type}.${s.step}`] ?? 3;

// ...and the house's own clock: a vote count needs nominees, a pitch needs an HOH.
const NEEDS_WEEK = {
  // nobody breaks down or gets homesick on the first night: the house has not happened yet
  'life.breakdown': 'hoh', 'life.homesick': 'hoh',
  'target.pitch': 'hoh', 'target.backdoor': 'hoh', 'target.lobby': 'noms', 'target.block': 'noms', 'target.count': 'noms',
};

// The kinds of moment that can happen in front of the whole house: they play INSIDE the
// stretch's set piece (a dig at dinner, a fight that clears the kitchen, flirting on the sofa),
// with everybody else in the room. Deals, pitches and schemes stay private.
const PUBLIC = p => (p.line.type === 'feud' && ['friction', 'argument'].includes(p.step.step))
  || (p.line.type === 'life' && ['banter', 'prank', 'chores'].includes(p.step.step))
  || (p.line.type === 'showmance' && p.step.step === 'spark' && p.step.outcome !== 'couple');

/** File the week and choose what airs. Words only: no game state moves. */
export function airStorylines(week) {
  if (!week || !Array.isArray(week.acts)) return;
  let stretch = 0;
  let at = 0;
  let pending = [];   // { act, line, step } filed this stretch
  const clock = { hoh: false, noms: false, nomsJust: false, hohJust: false, veto: false, safety: false };
  // the game talk this week has aired (gametalk.js): one of each kind a week, one talk per pair
  const talked = new Set();
  const talkedPairs = new Set();
  const season = phaseOf(week);
  // Who is in the house: everybody who started the week, less whoever has gone out of the
  // front door, less latecomers (Rivals) until they walk in.
  const late = new Set(week.acts.find(a => a?.type === 'rivals-open')?.arrived || []);
  const gone = new Set();
  const present = () => (week.houseAtStart || []).filter(n => !gone.has(n) && !late.has(n));
  // how often each kind of scene has aired this season (kept with the storylines)
  const seasonAired = ((gs.bb ||= {}).storyAired ||= {});
  const lastGone = [...(gs.bb?.weeks || [])].reverse().find(w => w !== week && w.evicted)?.evicted || null;
  const ctxOf = () => ({ week, hoh: clock.hoh ? (week.hoh || null) : null,
    nominees: clock.noms ? (week.finalNominees || week.initialNominees || []) : [], stretch,
    firstNight: (week.num || 0) === 1 && stretch === 0, present: present(), phase: season.phase, jurors: season.jurors });

  // Which whole-house set piece opens this stretch.
  const setFor = ctx => {
    if (ctx.firstNight) return 'firstnight';
    if (clock.hohJust && ctx.hoh) return 'hohroom';
    if (clock.nomsJust && ctx.nominees.length >= 2) return 'afternoms';
    if (stretch === 0 && lastGone) return 'morningafter';
    const rota = ['dinner', 'backyard', 'gamenight'];
    return rota[((week.num || 0) * 3 + stretch) % rota.length];
  };

  let presentAtStart = null;
  const choose = () => {
    const ctx = ctxOf();
    const atStart = presentAtStart || ctx.present;
    presentAtStart = null;
    if (!pending.length) return;
    const cand = pending.filter(p => {
      const need = NEEDS_WEEK[`${p.line.type}.${p.step.step}`];
      if (need && !clock[need]) return false;
      if (causeOf(p.line, p.step) === false) return false;
      if ([p.step.roles.a, p.step.roles.b, p.step.roles.c].some(n => n && !ctx.present.includes(n))) return false;
      return hasPool(p.line.type, p.step.step, p.step.outcome);
    });
    // Most at stake first; a step continuing a storyline the viewer is following counts more.
    // A storyline that aired last stretch rests unless this is a real turn in it, and none
    // airs more than twice a week: one feud on every screen is a soap, not a house.
    const airedIn = (p, pred) => p.line.steps.filter(s => s.aired && pred(s)).length;
    const score = p => {
      let v = dramaOf({ type: p.line.type, step: p.step.step, outcome: p.step.outcome })
        + (p.line.steps.some(s => s.aired) ? 3 : 0) + (p.line.type === 'life' ? 0 : 0.5);
      if (airedIn(p, s => s.week === (week.num || 0) && s.stretch === stretch - 1)) v -= 4;
      // a season spreads across kinds of scene: every earlier airing of this kind costs a little
      v -= 0.6 * (seasonAired[`${p.line.type}.${p.step.step}.${p.step.outcome}`] || 0);
      return v;
    };
    const ranked = cand.slice().sort((x, y) => score(y) - score(x) || x.step.at - y.step.at);
    // A stretch is an episode segment: a whole-house set piece and six to eight private
    // conversations (the user, 2026-10-06: "too damn short", "you don't feel what's happening").
    const target = ctx.firstNight ? 5 : ranked.filter(p => score(p) >= 8).length >= 3 ? 8 : 6;
    const picked = [];
    const embedded = [];
    const onScreen = {};
    let life = 0;
    const allowed = p => {
      const cast = [p.step.roles.a, p.step.roles.b, p.step.roles.c].filter(Boolean);
      if (cast.some(n => (onScreen[n] || 0) >= 3)) return false;
      if (p.line.type === 'life' && life >= (ctx.firstNight ? 3 : 2)) return false;
      if ([...picked, ...embedded].some(q => q.line === p.line)) return false;   // one step per storyline a stretch
      if (airedIn(p, s => s.week === (week.num || 0)) >= 2) return false;
      // the same kind of scene in the same storyline rests a fortnight: being left out of a
      // meeting every single week stops being news the second time
      if (p.line.type !== 'life' && airedIn(p, s => s.step === p.step.step && (week.num || 0) - s.week < 2)) return false;
      // a first clash is a first clash: once a feud has aired, more friction is not news
      if (p.line.type === 'feud' && p.step.step === 'friction' && airedIn(p, s => (week.num || 0) - s.week < 2)) return false;
      return true;
    };
    const take = (p, into) => {
      into.push(p);
      if (p.line.type === 'life') life++;
      [p.step.roles.a, p.step.roles.b, p.step.roles.c].filter(Boolean).forEach(n => { onScreen[n] = (onScreen[n] || 0) + 1; });
    };
    // the set piece's public moments first (at most two), then the private conversations
    // (a private room — the HOH room reveal, lights out on the first night — hosts no other moment)
    const hosts = !['hohroom', 'firstbed'].includes(setFor(ctx));
    for (const p of ranked) if (hosts && embedded.length < 2 && PUBLIC(p) && allowed(p)) take(p, embedded);
    for (const p of ranked) {
      if (picked.length >= target) break;
      if (embedded.includes(p) || !allowed(p)) continue;
      take(p, picked);
    }
    // A cause that happened in this same stretch airs as its own scene, first, rather than
    // being recapped in the scene after it.
    for (const p of [...picked, ...embedded]) {
      const cause = causeOf(p.line, p.step);
      if (!cause || cause.aired || picked.length > target) continue;
      const q = cand.find(x => x.step === cause);
      if (q && !picked.includes(q) && !embedded.includes(q)) picked.push(q);
    }
    const note = p => { const k = `${p.line.type}.${p.step.step}.${p.step.outcome}`; seasonAired[k] = (seasonAired[k] || 0) + 1; };
    const firstAct = pending[0].act;

    // ── the set piece: the whole house in one room, with the public moments inside it ──
    const inside = [];
    for (const p of embedded.sort((x, y) => x.step.at - y.step.at)) {
      const sc = writeStoryScene(p.line, p.step, { ...ctx, inSet: true });
      if (!sc) continue;
      inside.push({ p, sc });
    }
    const set = atStart.length >= 4
      ? writeSetPiece(setFor(ctx), { ...ctx, present: ctx.present.filter(n => atStart.includes(n)) }, inside.map(x => x.sc), { gone: lastGone, at: pending[0].step.at - 0.5 }) : null;
    if (set) (firstAct.scenes ||= []).push(set);
    for (const { p, sc } of inside) {
      p.step.aired = true; note(p);
      // no set piece to stage it in: it airs on its own
      if (!set) (p.act.scenes ||= []).push(sc);
    }

    // ── the private conversations, in the order they happened ──
    // A scene that does not set its own room is wherever the event put it, which is mostly
    // the bedroom: five bedroom scenes in a row read as one long night. Move it along.
    const ROTA = ['kitchen', 'living-room', 'backyard', 'bedroom'];
    let lastRoom = set?.room || null;
    // The game talk of the moment (gametalk.js): what the house is saying about THIS week of
    // the game — the Block Buster, the veto, jury, the end — and one conversation driven by a
    // bond, warm or sour. They air in the middle of the stretch's private scenes. A stretch
    // that already holds the Block Buster has played it: nobody plans for it afterwards.
    const talks = [];
    // the house as it was when the stretch began (a Rivals latecomer is not in it yet)
    // and a latecomer is not in it while the act it would air on comes before they walk in
    const arriveAt = week.acts.findIndex(x => x?.type === 'rivals-hoh');
    const lateNames = new Set(week.acts.find(x => x?.type === 'rivals-open')?.arrived || []);
    const before = arriveAt >= 0 && week.acts.indexOf(pending[0].act) < arriveAt;
    const tctx = { ...ctx, present: ctx.present.filter(n => atStart.includes(n) && !(before && lateNames.has(n))) };
    if (!ctx.firstNight) {
      const game = gameTalkFor(week, tctx, { ...clock, safety: clock.safety || pending.some(p => p.act.type === 'safety') }, talked, lastGone)[0];
      if (game) talks.push(game);
      const bond = stretch % 2 === 1 || !game ? bondTalkFor(week, tctx, talkedPairs) : null;
      if (bond && !talked.has(bond.kind)) talks.push(bond);
    }
    const ordered = picked.sort((x, y) => x.step.at - y.step.at);
    const mid = Math.max(1, Math.floor(ordered.length / 2));
    const airTalks = act => {
      for (const t of talks.splice(0)) {
        const scene = writeGameTalk(t, { ...tctx, avoidRoom: lastRoom }, pending[0].step.at);
        if (!scene) continue;
        talked.add(t.kind);
        lastRoom = scene.room;
        (act.scenes ||= []).push(scene);
      }
    };
    ordered.forEach((p, i) => {
      if (i === mid) airTalks(p.act);
      const scene = writeStoryScene(p.line, p.step, { ...ctx, avoidRoom: lastRoom });
      if (!scene) return;
      lastRoom = scene.room;
      p.step.aired = true;
      (p.act.scenes ||= []).push(scene);
      note(p);
    });
    if (talks.length) airTalks((ordered.at(-1) || pending[0]).act);
    // The first night ends with the lights going out on a full house.
    if (ctx.firstNight) {
      const bed = writeSetPiece('firstbed', ctx, [], { at: at + 0.5 });
      if (bed) (pending[pending.length - 1].act.scenes ||= []).push(bed);
    }
    pending = [];
  };

  for (const act of week.acts) {
    if (!act) continue;
    if (CEREMONY.has(act.type)) {
      choose();
      stretch++;
      clock.hohJust = act.type === 'hoh';
      clock.nomsJust = act.type === 'nominations';
      if (act.type === 'hoh') clock.hoh = true;
      if (act.type === 'nominations') clock.noms = true;
      if (act.type === 'veto') clock.veto = true;
      if (act.type === 'eviction' && act.evicted) gone.add(act.evicted);
    } else if (act.type === 'rivals-hoh') late.clear();
    if (act.type === 'safety') clock.safety = true;
    for (const beat of act.socialBeats || []) {
      at++;
      const c = classify(beat);
      if (!c) continue;
      if (!pending.length && !presentAtStart) presentAtStart = present();
      const { line, step } = file(c, { week: week.num || 0, stretch, beatAt: at });
      pending.push({ act, line, step });
    }
  }
  choose();
}

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
import { writeStoryScene, hasPool } from './write.js';

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

/** File the week and choose what airs. Words only: no game state moves. */
export function airStorylines(week) {
  if (!week || !Array.isArray(week.acts)) return;
  let stretch = 0;
  let at = 0;
  let pending = [];   // { act, line, step } filed this stretch
  const clock = { hoh: false, noms: false };
  // how often each kind of scene has aired this season (kept with the storylines)
  const seasonAired = ((gs.bb ||= {}).storyAired ||= {});
  const ctxOf = () => ({ week, hoh: clock.hoh ? (week.hoh || null) : null,
    nominees: clock.noms ? (week.finalNominees || week.initialNominees || []) : [], stretch,
    firstNight: (week.num || 0) === 1 && stretch === 0 });

  const choose = () => {
    if (!pending.length) return;
    const ctx = ctxOf();
    const cand = pending.filter(p => {
      const need = NEEDS_WEEK[`${p.line.type}.${p.step.step}`];
      if (need && !clock[need]) return false;
      if (causeOf(p.line, p.step) === false) return false;
      return hasPool(p.line.type, p.step.step, p.step.outcome);
    });
    // most at stake first; a step continuing a storyline the viewer is following counts more
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
    const target = ranked.filter(p => score(p) >= 8).length >= 3 ? 5 : 4;
    const picked = [];
    const onScreen = {};
    let life = 0;
    for (const p of ranked) {
      if (picked.length >= target) break;
      const cast = [p.step.roles.a, p.step.roles.b, p.step.roles.c].filter(Boolean);
      if (cast.some(n => (onScreen[n] || 0) >= 2)) continue;
      if (p.line.type === 'life' && life >= (ctx.firstNight ? 2 : 1)) continue;
      if (picked.some(q => q.line === p.line)) continue;   // one step per storyline a stretch
      if (airedIn(p, s => s.week === (week.num || 0)) >= 2) continue;
      // the same kind of scene in the same storyline rests a fortnight: being left out of a
      // meeting every single week stops being news the second time
      if (p.line.type !== 'life' && airedIn(p, s => s.step === p.step.step && (week.num || 0) - s.week < 2)) continue;
      // a first clash is a first clash: once a feud has aired, more friction is not news
      if (p.line.type === 'feud' && p.step.step === 'friction' && airedIn(p, s => (week.num || 0) - s.week < 2)) continue;
      picked.push(p);
      if (p.line.type === 'life') life++;
      cast.forEach(n => { onScreen[n] = (onScreen[n] || 0) + 1; });
    }
    // A cause that happened in this same stretch airs as its own scene, first, rather than
    // being recapped in the scene after it.
    for (const p of picked.slice()) {
      const cause = causeOf(p.line, p.step);
      if (!cause || cause.aired || picked.length > target) continue;
      const q = cand.find(x => x.step === cause);
      if (q && !picked.includes(q)) picked.push(q);
    }
    for (const p of picked.sort((x, y) => x.step.at - y.step.at)) {
      const scene = writeStoryScene(p.line, p.step, ctx);
      if (!scene) continue;
      p.step.aired = true;
      (p.act.scenes ||= []).push(scene);
      const k = `${p.line.type}.${p.step.step}.${p.step.outcome}`;
      seasonAired[k] = (seasonAired[k] || 0) + 1;
    }
    pending = [];
  };

  for (const act of week.acts) {
    if (!act) continue;
    if (CEREMONY.has(act.type)) {
      choose();
      stretch++;
      if (act.type === 'hoh') clock.hoh = true;
      if (act.type === 'nominations') clock.noms = true;
    }
    for (const beat of act.socialBeats || []) {
      at++;
      const c = classify(beat);
      if (!c) continue;
      const { line, step } = file(c, { week: week.num || 0, stretch, beatAt: at });
      pending.push({ act, line, step });
    }
  }
  choose();
}

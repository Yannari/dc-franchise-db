// ══════════════════════════════════════════════════════════════════════
// dr/maxi.js — one maxi challenge, whichever type it is
// ══════════════════════════════════════════════════════════════════════
//
// Three hooks, called in order, each seeing what the last produced: a module
// can read its own assignment in `prepare` and its own prep in `perform`. A
// module that omits a hook gets the generic one, which is why the fallbacks
// are resolved PER HOOK rather than per module — the Ball wants its own
// preparation and its own performance but is happy with a plain assignment.
//
// The registry maps several ids to one module on purpose. Acting, commercial
// and improv share the shape of the design family — build or rehearse
// something, then perform it — and differ in flavour, which is Plan 3's
// business rather than the engine's.
import * as generic from './chal/_generic.js';
import * as snatchGame from './chal/snatch-game.js';
import * as ball from './chal/ball.js';
import * as girlGroup from './chal/girl-group.js';
import * as rusical from './chal/rusical.js';
import * as makeover from './chal/makeover.js';
import * as roast from './chal/roast.js';
import * as talentShow from './chal/talent-show.js';
import * as lalaparuza from './chal/lalaparuza.js';
import * as design from './chal/design.js';

export const CHAL_MODULES = {
  'snatch-game': snatchGame,
  ball,
  'girl-group': girlGroup,
  rumix: girlGroup,
  'music-video': girlGroup,
  rusical,
  makeover,
  roast,
  'stand-up': roast,
  'talent-show': talentShow,
  'lipsync-challenge': lalaparuza,
  design,
  acting: design,
  commercial: design,
  improv: design,
};

export function moduleFor(maxiId) {
  return CHAL_MODULES[maxiId] || generic;
}

/** Run one maxi challenge end to end. */
export function runMaxi(ctx) {
  const mod = moduleFor(ctx.maxi.id);
  const scenes = [];
  const events = [];
  const take = r => {
    scenes.push(...(r.scenes || []));
    events.push(...(r.events || []));
    return r;
  };

  // `extra` is whatever the hook invented — the Ball's theme, a roast's
  // running order. Spread rather than named, on the same principle as the prep
  // carry below: a module should be able to hand its own performance step a
  // fact without this file learning what the fact is. `picks` stays keyed by
  // queen everywhere, so anything else belongs out here rather than smuggled
  // into it under a made-up name.
  const { roles, teams, order, picks, scenes: _s, events: _e, ...extra } = take(
    (mod.assign || generic.assign)(ctx));
  const assignment = { roles, teams: teams || [], order, picks: picks || {}, ...extra };

  const ctx2 = { ...ctx, assignment };
  const p = take((mod.prepare || generic.prepare)(ctx2));

  // Everything a `prepare` hook chose to hand forward. Spread rather than
  // named, so a module can invent its own carry — the Ball's build quality,
  // the girl group's verses, the Rusical's live-vocal decisions — without this
  // file learning about each one.
  const ctx3 = { ...ctx2, ...p, prep: p.prep };
  const f = take((mod.perform || generic.perform)(ctx3));

  return {
    assignment,
    prep: p.prep,
    performances: f.performances,
    runwayOverride: f.runwayOverride || null,
    scenes,
    events,
  };
}

/**
 * Write what the challenge did.
 *
 * THE ONE PLACE bonds and popularity move during a maxi, so "did this event
 * have a consequence" is answerable by reading one function rather than
 * nineteen modules — and answerable by a test, which is the point. An event
 * that changes nothing throws here rather than being quietly dropped, because
 * a cosmetic event is not a small problem: it is a scene the viewer is told
 * about that the season does not remember.
 */
export function applyEvents(events, ctx) {
  const summary = { bonds: 0, pop: 0, state: 0 };
  for (const e of events || []) {
    const changes = (e.bond?.length || 0)
      + Object.keys(e.pop || {}).length
      + Object.keys(e.state || {}).length;
    if (!changes) {
      throw new Error(
        `drag-race: event "${e.type}" has no consequence — every event must move `
        + 'a bond, a popularity number or a state flag');
    }
    for (const [a, b, d] of e.bond || []) { ctx.addBond(a, b, d); summary.bonds++; }
    for (const [n, d] of Object.entries(e.pop || {})) { ctx.popDelta(n, d); summary.pop++; }
    for (const [k, v] of Object.entries(e.state || {})) {
      (ctx.state.flags ||= {})[k] = v;
      summary.state++;
    }
  }
  return summary;
}

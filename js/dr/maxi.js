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
import * as acting from './chal/acting.js';
import * as craft from './chal/craft.js';

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
  // Acting, the commercial and improv used to share the design module, which
  // made three of nineteen challenges the design challenge with different
  // weights. They have their own now, and it treats them as three different
  // things rather than one.
  acting,
  commercial: acting,
  improv: acting,
  // The last four that ran on the generic hooks. Every one of them had its
  // rules written in the catalogue and nothing implementing them.
  photoshoot: craft,
  choreography: craft,
  singing: craft,
  'runway-challenge': craft,
};

export function moduleFor(maxiId) {
  return CHAL_MODULES[maxiId] || generic;
}

/* ── WHY THIS FILE DOES NOT DRAW FROM MAXI_EVENTS ──
   Fifty-three events are authored and, across a season, nine of the
   twenty-one belonging to challenges that actually played ever fire. The
   obvious fix — draw a few from the pool each week — was written here and
   deleted, because it is wrong and this engine says so out loud:

     drag-race: event "reunion" has no consequence — every event must move
     a bond, a popularity number or a state flag

   A maxi event is CAUSED. The roast module compares real bit scores, moves
   them, and emits `stole-a-bit` carrying the bond and popularity it just
   changed; the prose in maxi-events.js is the narration for a thing that
   mechanically happened. Sprinkling those lines onto a random pair and
   inventing a consequence to satisfy the check would be a narrated event
   with a made-up cause, which is the exact bug the rule guards against —
   and it cannot even guess the SIGN, because whether "ignored the note" is
   good or bad for her is a simulation question.

   So the unfired events are a real gap in the SIMULATION, not in the
   renderer: eleven challenges run on chal/_generic.js and chal/craft.js,
   which produce no situations of their own. Closing it means giving those
   modules real triggers, the way roast.js and snatch-game.js have them.
   That is per-challenge work and it is worth doing; it is not a knob. */

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
    tournamentExit: f.tournamentExit || null,
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

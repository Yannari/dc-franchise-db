// ══════════════════════════════════════════════════════════════════════
// tr/castle/crowd-map.js — how the country takes a castle scene
// ══════════════════════════════════════════════════════════════════════
//
// The scene API already carries a `crowd: { name, colour }` channel that moves
// the audience ledger (js/tr/crowd.js is the one file that touches it, applied
// in js/tr/events.js). The design is for an event to declare it inline — but
// not one of the ~128 events ever did, so castle life never moved a viewer's
// affection at all, which is wrong: how the country reads a person is half of
// what this show is about.
//
// Rather than edit every event's `fire()`, the declarations live here, in ONE
// table keyed by event id (and, where a branch flips the meaning, by branch).
// It is NOT a guess derived from the family or a bond delta — the objection the
// events.js comment raises — because it names the exact scene and the exact
// actor off the record the event returns. The actor is read from the
// consequences (`speaker`/`respondent`/`pair`), never invented.
//
// THE PALETTE (js/tr/crowd.js `CROWD_COLOURS`). Most castle life is MILD, so it
// draws mostly the mild colours — `kind` (+) for a small decency, `selfish` (-)
// for a small meanness — and saves the big ones (`heroic`, `cruel`, `cowardly`)
// for the moments that earn them. Damped further by `_MULT`: affection must not
// become a proxy for game standing (tests/tr-audience.test.js guards exactly
// that — the audience quantity may not predict placement), so a scene nudges it
// rather than swinging it. A scene not in this table moves nothing.
const _MULT = 0.5;

/** Resolve which player the country is judging, off what the event returned. */
function _actor(cons, who) {
  if (!cons) return null;
  if (who === 'respondent') return cons.respondent || (cons.pair || [])[1] || cons.speaker || null;
  return cons.speaker || (cons.pair || [])[0] || (cons.actors || [])[0] || null;
}

// eventId -> declaration, or a function of the consequences when a branch
// changes who looks how. A declaration is { who, colour, reason }.
const CROWD_MAP = {
  // ── kind / selfless: decency, loyalty, standing by somebody ──
  'grief-shared-mourning-bond': { who: 'speaker', colour: 'kind', reason: 'mourned with somebody who needed it' },
  'grief-toast-to-them': { who: 'speaker', colour: 'kind', reason: 'gave the dead a proper word' },
  'trust-defend-in-absentia': { who: 'speaker', colour: 'kind', reason: 'defended somebody who was not in the room' },
  'trust-return-favor': { who: 'speaker', colour: 'kind', reason: 'paid back a loyalty' },
  'trust-protect-pact': { who: 'speaker', colour: 'kind', reason: 'took heat off somebody else' },
  'callback-protects-old-ally-from-vote': { who: 'speaker', colour: 'selfless', reason: 'shielded an old ally from the vote' },

  // ── cruel / selfish: framing, manipulation, selling out ──
  'cover-plant-a-name': { who: 'speaker', colour: 'cruel', reason: 'put an innocent name in the room' },
  'cover-suspect-own-ally': { who: 'speaker', colour: 'selfish', reason: 'threw an ally to the room to save themselves' },
  'cover-double-bluff': { who: 'speaker', colour: 'masterful', reason: 'worked the room with a lie inside a lie' },
  'testing-reverse-psychology': { who: 'speaker', colour: 'selfish', reason: 'turned somebody against themselves' },
  'callback-grudge-resurfaces': { who: 'speaker', colour: 'selfish', reason: 'dragged an old grudge back to the table' },

  // ── cowardly / exposed: caught out ──
  'cover-alibi-crumbles': { who: 'speaker', colour: 'exposed', reason: 'was caught in a story that did not hold' },
  'cover-cold-sweat-tell': { who: 'speaker', colour: 'cowardly', reason: 'came apart under a question' },

  // ── branch-dependent: the same scene reads bravely or gutlessly ──
  'after-you-wrote-my-name': (cons) => {
    const b = cons && cons.branch;
    if (b === 'owned-it' || b === 'named-the-others') {
      return { who: 'speaker', colour: 'heroic', reason: 'owned their vote to the face of the person they wrote' };
    }
    if (b === 'denied-it' || b === 'would-not-say') {
      return { who: 'speaker', colour: 'cowardly', reason: 'would not own the name they had written' };
    }
    return null;
  },
  'after-what-i-said-at-the-table': (cons) => {
    // Admitting out loud you led the room to the wrong name is a brave thing to
    // do; most people never say it.
    if (cons && cons.branch && String(cons.branch).indexOf('wrong') >= 0) {
      return { who: 'speaker', colour: 'heroic', reason: 'admitted, out loud, that they had led the room wrong' };
    }
    return null;
  },
};

/**
 * The crowd declaration for a fired scene, or null. Called from js/tr/events.js
 * only when the event did not declare its own `crowd`. Never throws — a bad
 * lookup or a missing actor simply moves nothing.
 */
export function sceneCrowd(eventId, consequences) {
  const entry = CROWD_MAP[eventId];
  if (!entry) return null;
  const decl = typeof entry === 'function' ? entry(consequences) : entry;
  if (!decl) return null;
  const name = _actor(consequences, decl.who);
  if (!name) return null;
  return { name, colour: decl.colour, reason: decl.reason || null, mult: _MULT };
}

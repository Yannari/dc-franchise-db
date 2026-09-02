// ══════════════════════════════════════════════════════════════════════
// tr/missions/apply.js — a bespoke mission's declared effects, applied
// ══════════════════════════════════════════════════════════════════════
//
// Stage 1 gave a bespoke mission `scenes[].effects`: a bond that moved, a read
// that formed, a claim somebody made, a moment the country watched — each with
// a citable `source`. Stage 1 APPLIED NONE of them. This is the layer that
// does, and it is the one place a mission touches state beyond `gs.tr.pot`.
//
// ── THROUGH THE SCENE API, AND NOTHING ELSE ───────────────────────────
//
// Every write goes through `createTraitorsSceneApi()` — the same single write
// path the ~210 castle events use, with a machine-readable receipt on every
// write. A bond written straight into bonds.js would be a second write path
// into something this codebase has made single-path, which is the exact defect
// tests/tr-castle-write-path.test.js exists to prevent. A mission's effect is a
// consequence like any other and travels the same road.
//
// The map from a declared effect to an API call:
//
//   bond       -> addBond(a, b, delta)         a relationship moved
//   crowd      -> popDelta(name, colour, mult)  the country watched (colour,
//                                                never a number — crowd.js owns
//                                                the two audience ledgers)
//   suspicion  -> addBelief(observer, subject)  a read of somebody formed
//   claim      -> recordClaim(claimant, text)   a thing somebody said, on the
//                                                record for a later scene to cite
//
// ── WHAT IS DECLARED AND DELIBERATELY NOT APPLIED ─────────────────────
//
//   reputation  DROPPED. There is no per-player reputation store in
//               js/tr/state.js — `axis:'nerve'|'sharpness'` has nowhere to
//               land — and this branch's recurring sin is written-but-
//               unreachable machinery (the scene API's own claim propagation
//               and Task 7A's consensusPhrase both shipped with no consumer).
//               A reputation ledger with no reader would be one more. It is
//               dropped here rather than half-built; the report says so.
//
//   record      DROPPED for the same reason. `{ field:'bellMiscount', ... }`
//               is a behavioural note whose only reader is the scene's own
//               prose, which the record already carries and the VP already
//               prints. There is no engine store it feeds, so applying it is a
//               no-op with a receipt — decoration. The scene is preserved on
//               the record intact; only the write is skipped.
//
// ── IMPRESSIVE IS A BEHAVIOUR, NOT A CROWD COLOUR ─────────────────────
//
// `crowd.js`'s colour table has no `impressive`; the closest thing the country
// feels for a standout individual performance is `masterful` (spectacle). So
// an `impressive` crowd effect is mapped to it. Every other colour a mission
// declares — heroic, selfish, cowardly — is already a crowd colour and passes
// through untouched; an unknown one throws inside `popDelta`, which is the
// right place for that to be caught.
//
// ── THE ROOM'S DIFFUSE READ ───────────────────────────────────────────
//
// A `suspicion` effect with `observer: null` is a PUBLIC miscount the team
// watched — the causeway bell rung on the wrong count with the board in front
// of everybody. It has no single observer, so it is written from each of the
// subject's own TEAMMATES, who were there. That is the ceremony exception the
// scene API names ("a ceremony legitimately writes for people it does not
// enumerate"): a mission is a public event, and a wrong peal rung in front of a
// team is seen by the team. It is bounded to the team, never the whole castle,
// and the delta is small; a sharp observer's own notice threshold may refuse
// it, honestly, and the receipt records that.
import { createTraitorsSceneApi } from '../scene-api.js';

/**
 * Test-only kill switch, and it is what NARROWS the equivalence arm in
 * tests/tr-missions.test.js for the FIFTH time.
 *
 * A bespoke mission's effects write bonds and beliefs, which feed
 * bondResistance() -> suspicion() and move the deduction bands — so a season
 * with them applied plays differently from one without, which is the whole
 * point of "a mission where somebody abandons their team MUST change
 * relationships" (spec §9). The honest narrowing is not to soften "a mission
 * grants nothing but money" until the new writes fit inside it; it is to hold
 * this ONE channel out of both arms and re-run the identical equivalence, then
 * prove with a paired arm that switching it back on makes the equivalence FAIL.
 *
 * Default ON: a played season applies mission conduct to the room. Nothing in
 * the show may call this. Same contract as `_setMissionsEnabled`.
 */
let _effectsEnabled = true;
export function _setMissionEffectsEnabled(on) { _effectsEnabled = on !== false; }
export function missionEffectsEnabled() { return _effectsEnabled; }

/** `impressive` is a mission behaviour; the country's word for it is `masterful`. */
const CROWD_COLOUR = { impressive: 'masterful' };

/**
 * Apply every declared effect on a bespoke mission record, through the scene
 * API. A no-op for an archetype record (no `scenes`) and when the switch is off.
 *
 * `ep` is the episode the mission ran on — the scene API stamps it onto every
 * receipt so the debug tab can find the write later. Errors on a single effect
 * are swallowed rather than crashing a season: an authoring slip in one scene
 * must not take the other twelve down with it, and the receipt (or its absence)
 * is where such a slip shows.
 */
export function applyMissionEffects(rec, ep) {
  if (!_effectsEnabled) return;
  if (!rec || !Array.isArray(rec.scenes) || !rec.scenes.length) return;
  for (const scene of rec.scenes) {
    const api = createTraitorsSceneApi({
      ep, sceneId: `mission:${rec.id}:${scene.id}`, eventId: scene.eventId,
      participants: scene.participants,
    });
    for (const e of (scene.effects || [])) {
      try { _applyOne(api, e, scene, rec, ep); } catch { /* one bad effect, not the season */ }
    }
  }
}

function _applyOne(api, e, scene, rec, ep) {
  if (!e || !e.source) return;
  switch (e.kind) {
    case 'bond':
      if (Array.isArray(e.players) && e.players.length >= 2 && e.players[0] !== e.players[1]) {
        api.addBond(e.players[0], e.players[1], e.delta, { source: e.source });
      }
      return;
    case 'crowd':
      api.popDelta(e.name, CROWD_COLOUR[e.colour] || e.colour, { source: e.source, mult: e.mult });
      return;
    case 'suspicion':
      if (e.observer && e.subject && e.observer !== e.subject) {
        api.addBelief(e.observer, e.subject, e.delta, { source: e.source });
      } else if (!e.observer && e.subject) {
        _roomSuspicion(e, rec, ep);
      }
      return;
    case 'claim': {
      const listeners = (scene.participants || []).filter(n => n !== e.claimant);
      api.recordClaim(e.claimant, e.text || `${e.claimant} spoke about ${e.about}`,
        { about: e.about, listeners, source: e.source });
      return;
    }
    // 'record' and 'reputation' are declared but have no store — see the header.
    default:
  }
}

/**
 * A public miscount the team saw. Write it from each teammate of the subject,
 * through a fresh un-scoped API (the teammates were not in `scene.participants`,
 * so the radius guard would refuse them — this is the ceremony exception).
 */
function _roomSuspicion(e, rec, ep) {
  const team = (rec.teams || []).find(t => Array.isArray(t.members) && t.members.includes(e.subject));
  const observers = team ? team.members.filter(n => n !== e.subject) : [];
  if (!observers.length) return;
  const api = createTraitorsSceneApi({ ep, sceneId: `mission:${rec.id}:room`, eventId: 'mission-room-read' });
  for (const o of observers) {
    try { api.addBelief(o, e.subject, e.delta, { source: e.source }); } catch { /* skip */ }
  }
}

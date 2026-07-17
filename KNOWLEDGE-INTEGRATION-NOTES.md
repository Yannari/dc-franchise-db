# Knowledge & Information Flow — Integration Notes

The knowledge **core** (`js/knowledge.js`), its **VP builders**
(`js/knowledge-vp.js`), and **tests** (`tests/knowledge.test.js`) are complete
and self-contained (import only `core.js` + read `players` stats). They change
NO existing behavior yet.

This file lists every hook the integration pass must add to shared files
(owner: Codex / integration pass). Nothing here has been applied — these are
instructions, so the two parallel tracks never edit the same file at once.

Design spec: `docs/superpowers/specs/2026-07-17-knowledge-information-flow-design.md`.

## Public API (from `js/knowledge.js`)

```
recordFact({type, subject, object?, payload?, truth=true, ep?})   // ground truth
learn(knower, factId, {source, sourceType, confidence?, ep?, from?, rng?})
believes(knower, factId, ep?)          // → belief + effectiveConfidence + valence
knowsAbout(knower, type, subject, ep?) // convenience for factId(type,subject)
whoKnows(factId, ep?) / allFacts() / getFact(id) / forget(id) / resetKnowledge()
isAccurate(knower, factId, ep?)        // belief vs ground truth
effectiveConfidence(fact, belief, ep?)
propagate(ep, opts?) / pruneStale(ep, opts?) / tick(ep, opts?)  // spread + lifecycle
factId(type, subject, object?)         // 'type:subject[:object]'
```

`sourceType`: `observed | told | rumor | deduced | public`.
`valence` on a belief: `accurate | exaggerated | incomplete | stale | false`.

## 1. `episode.js` — lifecycle + fact recording

- **Once per episode** (after camp events, before/around tribal), call
  `knowledge.tick(epNum, opts)`. Capture returned spread events for camp cards
  (see §3). Suggested `opts.contacts` should eventually come from the
  camp-location system (roadmap #4); until then the default (alliance
  co-members + active others) is fine.
- **Record facts from real events** as they occur, so beliefs have something to
  track. Recommended record points:
  - Idol/advantage found → `recordFact({type:'idol'|'advantage', subject:holder, truth:true})`
    and `learn(holder, id, {sourceType:'observed'})`. (Eventually fold
    `advantage-intel.js` in — see §6.)
  - Vote target chosen for the episode → `recordFact({type:'target', subject:target, truth:true})`
    and `learn` for each player who was in on the plan (`sourceType:'observed'`
    for planners, `'told'` for those looped in).
  - Alliance formed → `recordFact({type:'alliance', subject:allianceId, payload:members, truth:true})`
    + `learn` each member `observed`.
  - Betrayal / flip detected → `recordFact({type:'betrayal', subject:flipper, object:victim, truth:true})`.
    Tie this to the existing betrayal-detection layer so only *detected* flips
    seed observed beliefs; undetected ones stay unknown (or seed a wrong
    `betrayal` fact for misattribution — see `project_vote_detection_misattribution`).
  - Challenge throw → `recordFact({type:'throw', subject:thrower, object:String(epNum), truth:true})`;
    seed observed beliefs only for players who passed the throw-detection check.
  - Vote pitch made → `recordFact({type:'pitch', subject:pitcher, object:pitchedTarget, truth:true})`
    + `learn(recipient, id, {sourceType:'told', from:pitcher})`.
- **Reset** `gs.knowledge` at new-season init (call `resetKnowledge()` where
  other per-season state is cleared).

## 2. `voting.js` / `vote-planning.js` — CONSUMPTION (the payoff)

This is where knowledge produces natural misunderstandings. Do NOT let a voter
act on ground truth they don't personally believe. Suggested adoption:

- When a voter decides who to target, prefer the target they *believe* is the
  target: `knowsAbout(voter, 'target', X)` with `effectiveConfidence` weighting.
  A voter with a `valence:'false'` belief (fed a lie) targets the wrong person.
- Idol fear / play decisions: read `knowsAbout(voter, 'idol', holder)` instead of
  omniscient idol awareness (mirrors what `advantage-intel.js` already feeds; use
  whichever is unified after §6).
- Alliance trust in vote math: down-weight coordination with people a voter does
  NOT believe share their target.
- Keep it additive and gated behind a config flag if you want a safe rollout.

Coordinate timing with the multidimensional-relationships work, since both touch
these files.

## 3. Camp-event rendering — rumor / leak / expose cards

`tick()`/`propagate()` return events shaped:
`{ id, type, subject, from, to, sourceType, valence }`.

Emit camp events from them so the audience sees information move:
- `sourceType:'rumor'` → a "word travels" / rumor card (`from` → `to`).
- a `valence:'false'` arrival → a "believes the lie" beat (misinformation taking
  root); pair with the existing forge-note / spread-lies events in
  `social-manipulation.js`.
- involuntary leaks (paranoid/desperate holders) → an "let it slip" card.
  Each must follow the project rule: real `players:[]` + `badgeText`/`badgeClass`
  and a gameplay consequence (bond/heat/state), not cosmetic text.

## 4. `vp-screens.js` — register the map

Import and register the builders (unregistered on purpose right now):
```
import { rpBuildKnowledgeMap, rpBuildFactTrail } from './knowledge-vp.js';
// in buildVPScreens(), add a season/episode screen:
vpScreens.push({ id:'knowledge-map', label:'Who Knows What', html: rpBuildKnowledgeMap(ep?.num ?? null) });
```
It reads `gs.knowledge` and renders even when empty. Also expose on `window` via
`main.js` if any onclick drill-down (fact trail) is added.

## 5. `main.js` — module wiring

Add `import * as knowledgeMod from './knowledge.js';` and
`import * as knowledgeVpMod from './knowledge-vp.js';` and include both in the
window-exposure spread so bare-global calls resolve (same pattern as other
modules).

## 6. `advantage-intel.js` — eventual merge (do NOT do during parallel work)

`advantage-intel.js` already implements this exact model for idols and is
consumed by `voting.js`. Leave it untouched while both tracks are live. During
integration, unify: represent idol intel as `type:'idol'` facts in
`gs.knowledge`, port `assessIdolExposure`/`allianceIdolRead` to read the unified
store, then retire `gs.advantageIntel`. Until then the two coexist harmlessly.

## 7. Serialization

`gs.knowledge` is plain JSON (no functions/Sets) and survives `JSON.stringify`
as-is, so `savestate.js` needs no special handling. Just confirm it's included
in the snapshot/restore of `gs` (it will be if the whole `gs` is serialized).

## Contacts hook (roadmap #4 tie-in)

`propagate(ep, { contacts })` takes `contacts(knower) → { allies:[], others:[] }`.
When the camp-time/location system lands, pass a `contacts` that returns only the
people a knower actually shared a location/time slot with, so information moves
along real conversation access instead of alliance membership.

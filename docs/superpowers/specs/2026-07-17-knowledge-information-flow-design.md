# Personal Knowledge & Information Flow — Design Spec

Roadmap: `SIMULATOR-WIDE-REALISM-ROADMAP.md`, Recommended-order item **#2**
(Highest-value system **#1**, "Personal knowledge and information networks").

Built in parallel with Codex's **multidimensional relationships** (#1). Strict
file ownership: this work lives in **new dedicated modules + tests**. It does NOT
edit shared integration files (`episode.js`, `voting.js`, `vp-screens.js`,
camp-event rendering) or `advantage-intel.js`. All hooks into those are recorded
in `KNOWLEDGE-INTEGRATION-NOTES.md` for the later integration pass (Codex).

## Goal

Every strategic fact becomes contestant-specific: who knows it, who told them,
whether they believe it, and whether their belief is accurate, exaggerated,
incomplete, stale, or false. This produces natural misunderstandings without
random chaos, and is the substrate that vote/targeting logic will later consume.

## Prior art (do not edit, generalize)

`js/advantage-intel.js` already implements this exact shape for idols:
`{knower, holder, source, confidence, truth, ep}` with age-based confidence
decay, public-reveal handling, and belief/exposure checks. The knowledge core
generalizes that pattern to all fact types. `advantage-intel.js` stays untouched
this pass; the notes flag the eventual merge.

## Data model — `gs.knowledge`

```
gs.knowledge = {
  [factId]: {
    id, type, subject, object|null, payload|null,
    truth,          // ground truth: true (real) | false (planted lie)
    createdEp,
    beliefs: {
      [knower]: {
        confidence,      // 0..1, decays with age
        source,          // name | 'observation' | 'rumor' | 'deduction' | 'public'
        sourceType,      // observed | told | rumor | deduced | public
        valence,         // accurate | exaggerated | incomplete | stale | false
        learnedEp,
        knowsOthersKnow  // [names] — second-order knowledge
      }
    }
  }
}
```

- `factId = type:subject[:object]` — e.g. `target:Anna`, `throw:5:Bob`,
  `betrayal:Carl:Dana`, `alliance:<id>`, `idol:Eve`, `pitch:Bob:Anna`.
- **Fact types:** `idol`/`advantage`, `target`, `alliance` (payload=members),
  `betrayal` (subject flipped on object), `throw` (subject threw a challenge),
  `pitch` (subject pitched object as a target), `bond-read` (a *belief* about a
  relationship — a perception, NOT Codex's real relationship state).

## Core API (`js/knowledge.js`)

- `recordFact({type, subject, object, payload, truth, ep})` → create/update the
  ground-truth fact. Idempotent by `factId`.
- `learn(knower, factId, {source, sourceType, confidence, ep})` → form/refresh a
  belief, filtered through the belief check. Returns the belief or null.
- `believes(knower, factId)` → belief object | null.
- `knowsAbout(knower, type, subject)` / `whoKnows(factId)` → queries.
- `forget(factId)` / `pruneStale(ep)` → lifecycle.
- `propagate(ep, opts)` → one episode of spread across `contacts`.
- `tick(ep, opts)` → decay + prune + propagate; the once-per-episode entry point.
- Belief accessors return derived `effectiveConfidence` (confidence minus age
  decay), mirroring `advantage-intel`.

## Belief & distortion model (the accuracy core)

- **Belief check:** `readSkill = mental*0.6 + intuition*0.4` (0..10 → 0..1).
  A listener accepts a claim when `sourceCredibility + noise` clears a threshold
  scaled by `readSkill`. Sharp readers resist low-credibility rumors and detect
  planted lies; gullible readers absorb them.
- **Credibility by source:** observed > public > told(by-ally) > told(by-rival)
  > rumor(unattributed). Confidence seeds from credibility.
- **Distortion over hops:** each retelling attenuates confidence and can drift
  `accurate → exaggerated → false`; `pitch`/`rumor` degrade faster than
  `observed`.
- **Staleness:** facts have a validity window (e.g. `target` is per-episode);
  past it, valence → `stale` and effectiveConfidence sinks.
- **Lies:** `truth:false` facts (planted by social-manipulation) read as
  `accurate` to the gullible, `false` (detected) to the sharp.
- **Leaks:** paranoid/desperate/low-temperament holders emit involuntary reveals
  at higher rates (reads `gs.playerStates[name].emotional` when present).
- **Second-order:** when A tells B, B's belief records A in `knowsOthersKnow`.

## Propagation

`propagate` is contact-gated and pluggable. Default `contacts(knower)` = active
allies + high-bond players + a little noise; roadmap #4 (camp-location) can
replace it later. Each eligible (knower, listener) pair may share a live fact;
the listener runs the belief check; confidence attenuates per hop. Info-broker /
social-butterfly / high-social knowers spread more; loyal/low-boldness spread
less. Every spread is deterministic given a seeded RNG for testability.

## Tests (`tests/knowledge.test.js`)

record/learn/query; confidence decay; belief check (gullible believes a lie,
sharp rejects it); multi-hop propagation with distortion; stale-marking;
second-order propagation; and an **accuracy-metric** run over many seeded sims
showing a high-`mental+intuition` cohort ends with materially higher belief
accuracy than a low cohort.

## VP (`js/knowledge-vp.js`, not registered this pass)

`rpBuildKnowledgeMap(ep)` — a "Who Knows What" matrix (facts × knowers) with
confidence shading and accurate/false/stale coloring, plus a per-fact spread
trail. Builder functions only; registration in `vp-screens.js` is an integration
note.

## Out of scope this pass (integration notes only)

Wiring beliefs into vote targeting, emitting camp rumor/leak/expose cards,
recording facts from real game events, registering the VP screen, and merging
`advantage-intel.js`. All documented in `KNOWLEDGE-INTEGRATION-NOTES.md`.

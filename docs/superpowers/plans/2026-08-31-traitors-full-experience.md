# The Traitors Full Experience Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand The Traitors into an alumni-first, 100–140-card television episode simulator with a real Castle Arrival, coherent multi-card castle life, full bespoke missions, host explanations, and consequence-driven strategy.

**Architecture:** Preserve the shipped `js/tr/` deduction, murder, recruitment and endgame engines. Extract the format-neutral scheduling mechanics proven by Big Brother into a small shared kernel, then give Traitors its own phase scheduler, scene API, event registries and presentation records. All viewer prose is pre-rendered into episode history and filtered by observer knowledge before rendering.

**Tech Stack:** Browser-native ES modules, HTML/CSS, Vitest, existing `gs`/`seasonConfig` state, `players_database.json`, no build step.

**Spec:** `docs/superpowers/specs/2026-08-31-traitors-full-experience-design.md`

## Global Constraints

- Read `AGENTS.md`, the spec above, and `docs/ADDING-A-SHOW.md` before implementation.
- Total Drama and Big Brother are the only alumni sources today; derive sources from `js/shows.js` and ledger records, never a hardcoded allow-list.
- Casting is manual. Background types are `alumni`, `celebrity`, and `civilian`.
- Alumni prose uses player history **and** personality. Celebrity/Civilian prose invents no reality-show history.
- Standard episodes target 100–140 reveal cards; scale down only with the late-game cast.
- Each castle scene has 2–5 cards: setup, concrete action/dialogue, reaction, and consequence.
- `cover`, `thread`, `heat`, `opened today`, and `The Loom` are debug vocabulary and forbidden in viewer prose.
- Every social action has a gameplay consequence and a machine-readable receipt.
- Use only the nine valid stats and proportional noisy scoring; no gameplay thresholds.
- Preserve observer safety: audience, Traitor, and Faithful views receive only authorized facts.
- Host explanations precede the action and use the configured host, never a literal host name.
- VP and text backlog must retranscribe the same stored narration.
- Use TDD, run focused tests after every change, `git diff --check` before every commit, and never weaken an existing calibration band merely to pass.

## Canonical writing record

All new prose-producing work in this plan uses this stored shape:

```js
{
  id: 'ep3-library-alibi',
  eventId: 'alibi-timeline-challenged',
  phase: 'private-strategy',
  location: 'library',
  participants: ['Gabby', 'Julia'],
  observerText: {
    audience: [
      { kind: 'establish', text: 'Gabby closes the library door and asks Julia to account for the hour after dinner.' },
      { kind: 'action', text: 'Julia says she went straight upstairs. Gabby reminds her that they crossed paths beside the billiards room.' },
      { kind: 'reaction', text: 'Julia snaps that Gabby is twisting a passing hello into evidence, then lowers her voice when footsteps stop outside.' },
      { kind: 'consequence', text: 'Gabby leaves with a contradiction she can repeat at the Round Table.' },
    ],
    public: [
      { kind: 'establish', text: 'Gabby closes the library door and asks Julia to account for the hour after dinner.' },
      { kind: 'action', text: 'Julia gives a timeline. Gabby says one part does not match what she remembers.' },
      { kind: 'reaction', text: 'The conversation ends colder than it began.' },
    ],
  },
  effects: [
    { kind: 'belief', observer: 'Gabby', subject: 'Julia', delta: 0.7,
      source: 'Julia contradicted her post-dinner timeline' },
    { kind: 'bond', players: ['Gabby', 'Julia'], delta: -0.5 },
  ],
  followUps: ['roundtable-cite-contradiction'],
}
```

Bad writing this contract replaces:

```text
Cover — Something starts
Julia let their voice go once, briefly, and then got it back.
```

The good version names the room, question, answer, contradiction, reaction, and usable consequence. Do not copy the names or sentence; copy the completeness.
## Causal writing contract

Every event must happen for a recorded reason. Before writing a claim, the event must point to the exact source record that makes it true. Personality may change how somebody interprets a fact; it may not invent the fact.

```text
stored fact → eligible reaction → scene cites the fact → consequence cites the scene
```

Acceptable sources include mission phase results, player scores, observed actions, public ballots, spoken accusations, stored claims, shield decisions, known prior-season history, witnessed conversations, relationships, and observer-safe knowledge. Raw alignment is not a source available to a Faithful.

### Mission blame

Correct:

```text
MISSION RECORD: Manu missed checkpoint 3, costing the team a two-minute penalty.
EVENT: Finn lays the route map on the table. “We lost two minutes when Manu missed checkpoint three.” Manu says the direction marker had fallen. Gabby agrees about the delay but questions whether one mistake proves anything.
```

Forbidden: `Finn says Manu failed the mission.` This is invalid if Manu did not fail a recorded phase. Even when he did, the scene must say what happened and allow competing interpretations.

### Contradictions

Correct:

```text
CLAIM A: Julia told Gabby she went directly upstairs after dinner.
CLAIM B: Alec recorded seeing Julia beside the library after dinner.
EVENT: Gabby compares the accounts with Alec, then asks Julia which version is true. Julia explains, denies, or stumbles according to her behavior.
```

Forbidden: `Gabby catches Julia changing her story.` Two incompatible stored claims must exist, and Gabby must know both.

### Shield fallout

Correct:

```text
MISSION RECORD: Fiore left the carry phase, pursued a shield, won it, and her team lost £4,000 after finishing one crate short.
EVENT: Ellie confronts Fiore about leaving. Fiore defends the shield. Teammates blame her only if they witnessed the choice or learned it from a named source.
```

Forbidden: `Everyone is angry that Fiore chose herself over the team.` This is invalid when the team lost no money, Fiore never left, the choice was secret, or everyone did not learn it.

### Alumni history

Correct:

```text
HISTORY RECORD: Julia voted against Gabby in Total Drama 2 after promising safety.
EVENT: Gabby says, “You promised I was safe last time, and then you voted me out.” Julia's response uses her current personality; the claim stays exactly what the ledger supports.
```

Forbidden: `Gabby remembers Julia betraying her before.` A low bond can motivate distrust, but it cannot manufacture an incident missing from the ledger.

### Round Table and murder fallout

Correct:

```text
Finn cites Manu's recorded checkpoint penalty. Gabby cites the fallen marker she witnessed. Alec changes his vote because Finn dismisses corroborated context—not because the writer needs a vote flip.

Miriam is absent at breakfast. Bowie grieves because his stored bond with Miriam was high. Priya comforts him after witnessing the reaction. Nobody claims to know why Miriam was chosen without evidence or a Traitor confession.
```

Forbidden: `Finn says Manu acted suspiciously, so Alec suddenly changes his vote.` “Suspiciously” must resolve to named behavior, and a vote moves only after a stored argument, relationship, belief, deal, or fact moves it.

For every generated scene, tests must answer:

1. Which record made the event eligible?
2. Which participants know that record?
3. Which sentence states or demonstrates the cause?
4. Which stored consequence follows from the scene?

If any answer is missing, the event is disconnected and must not render.

---

### Task 1: Contestant background types and history snapshots

**Files:**
- Modify: `simulator.html`
- Modify: `js/cast-ui.js`
- Modify: `js/core.js`
- Modify: `js/alumni.js`
- Modify: `js/tr/state.js`
- Modify: `js/tr/headless.js`
- Modify: `js/tr/export.js`
- Test: `tests/tr-background-types.test.js`
- Test: `tests/traitors-registry.test.js`

**Interfaces:**
- Produces: `resolveTraitorsBackground(player, database): TraitorsBackground`
- Produces: `snapshotTraitorsBackgrounds(cast, database): Record<string, TraitorsBackground>`
- `TraitorsBackground = { type, sourceShows, appearances, summary, recognized, warnings }`
- Stores: `gs.tr.backgrounds[name]`

- [ ] **Step 1: Write failing tests for all three background types**

```js
it('uses history and personality for alumni without inventing either', () => {
  const bg = resolveTraitorsBackground({ name:'Julia', archetype:'schemer', occupation:'Influencer' }, [{
    name:'Julia', seasonDetails:[{ format:'total-drama', season:2, placement:4 }],
  }]);
  expect(bg.type).toBe('alumni');
  expect(bg.sourceShows).toEqual(['total-drama']);
  expect(bg.summary).toContain('Total Drama 2');
  expect(bg.summary).toContain('Influencer');
});

it('does not invent a season for a celebrity or civilian', () => {
  for (const type of ['celebrity', 'civilian']) {
    const bg = resolveTraitorsBackground({ name:'Alex', backgroundType:type, occupation:'Actor' }, []);
    expect(bg.appearances).toEqual([]);
    expect(bg.summary).not.toMatch(/season|finalist|winner/i);
  }
});
```

- [ ] **Step 2: Run the focused tests and confirm RED**

Run: `npx vitest run tests/tr-background-types.test.js tests/traitors-registry.test.js`
Expected: FAIL because the resolver and serialized background map do not exist.

- [ ] **Step 3: Implement resolver, cast UI selector, validation, and snapshot serialization**

Use exact stored values `alumni`, `celebrity`, `civilian`. Default recorded players to Alumni; default others to Civilian unless explicit profile metadata marks public recognition. Selecting Alumni without an appearance produces a blocking setup warning, not fictional history.

Writing examples in the selector preview:

```text
ALUMNI — Julia
Total Drama 2 · 4th place
An influencer and practiced schemer whose old cast already knows how calmly she can redirect a vote.

CELEBRITY* — Morgan
Award-winning actor
The castle recognizes Morgan before the introductions finish; fame brings social access and an immediate question about threat.

CIVILIAN* — Priya
Emergency-room nurse
Nobody arrives with a television version of Priya in mind. Her composure and life experience are the only résumé the room can read.
```

Never write “Julia is history” or list statistics without explaining how reputation enters the room.

- [ ] **Step 4: Verify save/load and export round-trip the snapshot**

Run: `npx vitest run tests/tr-background-types.test.js tests/tr-export.test.js tests/serialization.test.js`
Expected: PASS, including replay after mutating the database fixture.

- [ ] **Step 5: Commit**

```bash
git add simulator.html js/cast-ui.js js/core.js js/alumni.js js/tr/state.js js/tr/headless.js js/tr/export.js tests/tr-background-types.test.js tests/traitors-registry.test.js
git commit -m "feat(traitors): add contestant background types"
```

### Task 2: Castle Arrival and premiere rules record

**Files:**
- Create: `js/vp-tr/arrival.js`
- Modify: `js/tr/headless.js`
- Modify: `js/vp-tr/screens.js`
- Modify: `js/text-backlog.js`
- Modify: `js/main.js`
- Test: `tests/tr-arrival.test.js`
- Test: `tests/tr-vp.test.js`

**Interfaces:**
- Produces: `buildArrivalRecord(cast, backgrounds, host): TraitorsArrivalRecord`
- Produces: `rpBuildArrival(ep, observer = 'audience')`
- Stores: `ep.tr.arrival = { groups, introductions, recognitions, rules }`

- [ ] **Step 1: Write the failing ordering and completeness test**

```js
it('introduces every contestant before the Selection', () => {
  const screens = traitorsScreens(firstEpisode, 'audience');
  expect(screens.map(s => s.id).slice(0, 2)).toEqual(['tr-arrival', 'tr-selection']);
  const prose = screenNarration(screens[0].html);
  for (const name of firstEpisode.tr.cast) expect(prose).toContain(name);
  for (const phrase of ['Faithful', 'Traitor', 'murder', 'mission', 'prize pot', 'shield', 'Round Table', 'banishment']) {
    expect(prose.toLowerCase()).toContain(phrase.toLowerCase());
  }
});
```

- [ ] **Step 2: Run the test and confirm RED**

Run: `npx vitest run tests/tr-arrival.test.js tests/tr-vp.test.js`
Expected: FAIL because `tr-arrival` is absent.

- [ ] **Step 3: Store arrival groups, recognitions, introductions, and full first-use rules**

Good alumni introduction:

```text
The next car brings Julia, fourth on Total Drama 2. Gabby recognizes the careful smile before Julia reaches the steps: they have played together before, and neither remembers that season as unfinished friendship. Julia greets her warmly anyway. “New castle,” she says. “Clean slate.” Gabby does not answer quickly enough for it to sound true.
```

Good host rule explanation:

```text
“Most of you will play as Faithfuls. Hidden among you will be Traitors. Each night the Traitors will meet in secret and choose one player to murder. Each day you will add money to the prize pot in a mission, and some missions may offer a shield from murder. At the Round Table, every surviving player votes to banish one person. Remove every Traitor and the remaining Faithfuls can win the pot. Leave a Traitor standing at the end, and the Traitor takes it instead.”
```

Bad: `The host explains the game.` The rules must be written on the saved record.

- [ ] **Step 4: Build reveal-safe VP, register it before Selection, and retranscribe it in text backlog**

Use DOM-only reveal updates, `_tvState` with `idx:-1`, fixed controls below the 46px nav, progressive sidebar, and observer-filtered content. The arrival does not reveal alignments.

- [ ] **Step 5: Verify and commit**

Run: `npx vitest run tests/tr-arrival.test.js tests/tr-vp.test.js tests/backlog-coverage.test.js`
Expected: PASS.

```bash
git add js/vp-tr/arrival.js js/tr/headless.js js/vp-tr/screens.js js/text-backlog.js js/main.js tests/tr-arrival.test.js tests/tr-vp.test.js
git commit -m "feat(traitors): add castle arrival premiere"
```

### Task 3: Shared weighted scene scheduler

**Files:**
- Create: `js/event-scheduler.js`
- Modify: `js/bb/house-events.js`
- Modify: `js/tr/events.js`
- Test: `tests/event-scheduler.test.js`
- Test: `tests/bb-house-events.test.js`
- Test: `tests/tr-events.test.js`

**Interfaces:**
- Produces: `scheduleWeightedEvents(events, context, options): ScheduledEvent[]`
- Options: `{ rng, min, max, maxUses:2, repetitionPenalty, participantCounts, incompatibilities }`
- Existing `scheduleHouseBeats()` remains public and delegates to the kernel.

- [ ] **Step 1: Pin Big Brother behavior and write kernel contract tests**

```js
it('penalizes repeats and gives underfeatured players a path onto screen', () => {
  const out = scheduleWeightedEvents(EVENTS, ctx, {
    rng: sequenceRng([0.01, 0.01, 0.75]), min:3, max:3,
    participantCounts:{ A:12, B:0, C:1 },
  });
  expect(out).toHaveLength(3);
  expect(out.some(x => x.participants.includes('B'))).toBe(true);
  expect(Math.max(...countIds(out).values())).toBeLessThanOrEqual(2);
});
```

- [ ] **Step 2: Run tests and confirm RED**

Run: `npx vitest run tests/event-scheduler.test.js tests/bb-house-events.test.js`

- [ ] **Step 3: Extract only format-neutral selection mechanics**

Do not move BB rooms, state APIs, prose validation, HOH access, effects, or `gs.bb` into the kernel. Keep `scheduleHouseBeats()` output byte-compatible under seeded fixtures.

- [ ] **Step 4: Delegate Traitors selection to the same kernel without importing `HOUSE_EVENTS`**

Run: `npx vitest run tests/event-scheduler.test.js tests/bb-house-events.test.js tests/tr-events.test.js tests/vp-big-brother-week.test.js`
Expected: PASS with unchanged BB seeded output.

- [ ] **Step 5: Commit**

```bash
git add js/event-scheduler.js js/bb/house-events.js js/tr/events.js tests/event-scheduler.test.js tests/bb-house-events.test.js tests/tr-events.test.js
git commit -m "refactor: share weighted event scheduling"
```

### Task 4: Traitors scene API, provenance, and receipts

**Files:**
- Create: `js/tr/scene-api.js`
- Modify: `js/tr/events.js`
- Modify: `js/tr/state.js`
- Modify: `js/tr/deduction.js`
- Modify: `js/vp-tr/debug.js`
- Test: `tests/tr-scene-api.test.js`
- Test: `tests/tr-castle-belief-gate.test.js`

**Interfaces:**
- Produces: `createTraitorsSceneApi(ctx)` with `addBond`, `addBelief`, `recordClaim`, `setVoteIntent`, `addMurderPreference`, `popDelta`, `setEmotionalState`, `openArc`, `advanceArc`, `resolveArc`, `receipt`.
- Stores provenance as `{ observer, subject, belief, source, confidence, truthStatus, ep }`.

- [ ] **Step 1: Write a failing cause-to-decision test**

```js
it('carries a witnessed contradiction into belief and later vote reasoning', () => {
  const api = createTraitorsSceneApi({ ep:3 });
  api.addBelief('Gabby', 'Julia', 0.7, { source:'contradicted her dinner timeline', truthStatus:'unknown' });
  const receipt = api.receipts()[0];
  expect(receipt.source).toBe('contradicted her dinner timeline');
  expect(suspicion('Gabby', 'Julia', 3)).toBeGreaterThan(0);
});
```

- [ ] **Step 2: Run RED, then implement one write path per state type**

Run: `npx vitest run tests/tr-scene-api.test.js tests/tr-castle-belief-gate.test.js`

- [ ] **Step 3: Render receipts only in Debug**

Viewer card: `Gabby leaves with a contradiction she can repeat at the Round Table.`

Debug receipt: `belief · Gabby → Julia +0.7 · source: contradicted her dinner timeline`.

- [ ] **Step 4: Verify and commit**

Run: `npx vitest run tests/tr-scene-api.test.js tests/tr-deduction.test.js tests/tr-vp.test.js`

```bash
git add js/tr/scene-api.js js/tr/events.js js/tr/state.js js/tr/deduction.js js/vp-tr/debug.js tests/tr-scene-api.test.js tests/tr-castle-belief-gate.test.js
git commit -m "feat(traitors): add scene consequence receipts"
```

### Task 5: Phase budgets and chronological Castle Day records

**Files:**
- Modify: `js/tr/events.js`
- Modify: `js/tr/headless.js`
- Create: `js/tr/castle/phases.js`
- Test: `tests/tr-episode-density.test.js`
- Test: `tests/tr-castle.test.js`

**Interfaces:**
- Produces: `runCastlePhase(phase, ctx, rng): TraitorsScene[]`
- Produces: `CASTLE_PHASE_BUDGETS`
- Stores: `ep.tr.castle.phases[{ id, label, scenes }]`

- [ ] **Step 1: Write failing density and chronology tests over representative seeds**

```js
it('builds a complete day in chronological order', () => {
  const ids = ep.tr.castle.phases.map(p => p.id);
  expect(ids).toEqual(['breakfast-fallout','morning-life','mission-fallout','private-strategy','roundtable-scramble','post-banishment']);
  expect(ep.tr.castle.phases.flatMap(p => p.scenes).length).toBeGreaterThanOrEqual(25);
});
```

- [ ] **Step 2: Run RED**

Run: `npx vitest run tests/tr-episode-density.test.js tests/tr-castle.test.js`

- [ ] **Step 3: Replace the single 4–8 round budget with phase budgets**

Start with scene ranges 3–5, 5–8, 4–6, 6–9, 4–7, and 2–4 respectively. Tune only from measured full-season card counts; do not hit 100 by extending ballot reveals.

- [ ] **Step 4: Verify deterministic replay and commit**

Run: `npx vitest run tests/tr-episode-density.test.js tests/tr-castle.test.js tests/tr-run.test.js tests/serialization.test.js`

```bash
git add js/tr/events.js js/tr/headless.js js/tr/castle/phases.js tests/tr-episode-density.test.js tests/tr-castle.test.js
git commit -m "feat(traitors): schedule a full castle day"
```

### Task 6: Rewrite Castle Day VP as complete television scenes

**Files:**
- Modify: `js/vp-tr/castle-day.js`
- Modify: `js/vp-tr/screens.js`
- Modify: `js/text-backlog.js`
- Test: `tests/tr-castle-prose.test.js`
- Test: `tests/tr-vp.test.js`

**Interfaces:**
- Consumes: `ep.tr.castle.phases[].scenes[]` canonical records.
- Produces: progressive 2–5-card scenes with DOM-only reveal updates.

- [ ] **Step 1: Write failing prose and structure guards**

```js
it('never presents engine vocabulary as story', () => {
  const text = screenNarration(rpBuildCastleDay(ep, 'audience'));
  expect(text).not.toMatch(/\b(?:cover|thread|heat|opened today|the loom)\b/i);
});

it('every scene establishes action and consequence', () => {
  for (const scene of allScenes(ep)) {
    expect(scene.observerText.audience.map(x => x.kind)).toEqual(expect.arrayContaining(['establish','action','reaction','consequence']));
  }
});
```

- [ ] **Step 2: Run RED and replace the Loom UI**

Run: `npx vitest run tests/tr-castle-prose.test.js tests/tr-vp.test.js`

- [ ] **Step 3: Use natural headings and concrete scene writing**

Good:

```text
THE LIBRARY · BEFORE THE ROUND TABLE
Finn lays the mission map between them and circles the checkpoint Manu missed. “We lost nine minutes here.” Gabby agrees about the time but not the conclusion: half the team misunderstood the same instruction. Finn leaves planning to raise the mistake; Gabby leaves planning to defend it.
```

Bad:

```text
Suspicion — Cast on
Finn counted it out. Manu was not in all of the hours.
```

- [ ] **Step 4: Verify VP/text equality, observer safety, sticky controls, and commit**

Run: `npx vitest run tests/tr-castle-prose.test.js tests/tr-vp.test.js tests/backlog-coverage.test.js`

```bash
git add js/vp-tr/castle-day.js js/vp-tr/screens.js js/text-backlog.js tests/tr-castle-prose.test.js tests/tr-vp.test.js
git commit -m "feat(traitors): present castle day as television scenes"
```

### Task 7: First 110–130 complete castle events

**Files:**
- Modify: `js/tr/castle/suspicion.js`
- Modify: `js/tr/castle/cover.js`
- Modify: `js/tr/castle/trust.js`
- Modify: `js/tr/castle/romance.js`
- Modify: `js/tr/castle/grief.js`
- Modify: `js/tr/castle/callback.js`
- Create: `js/tr/castle/everyday.js`
- Create: `js/tr/castle/strategy.js`
- Create: `js/tr/castle/mission-fallout.js`
- Create: `js/tr/castle/consequences.js`
- Modify: `js/tr/events.js`
- Test: `tests/tr-castle-library.test.js`
- Test: `tests/tr-castle-reachability.test.js`

**Interfaces:**
- Every registered event returns the canonical scene record and writes effects only through `createTraitorsSceneApi()`.

- [ ] **Step 1: Add failing registry-shape, reachability, consequence, and prose tests**

```js
for (const event of EVENTS) {
  expect(event.id).toBeTruthy();
  expect(event.phase).toBeTruthy();
  expect(event.weight).toBeTypeOf('function');
  expect(event.fire).toBeTypeOf('function');
}
expect(reachableIds.size / EVENTS.length).toBeGreaterThan(0.9);
expect(viewerCorpus).not.toMatch(/\b(?:cover|thread|heat|opened today|the loom)\b/i);
```

- [ ] **Step 2: Audit the existing 98 premises into keep/rewrite/merge/remove**

Do not count a renamed one-line event toward 110. A qualifying event produces a full scene, effects, at least four materially different prose branches, and a reachable follow-up or explicit terminal outcome.

- [ ] **Step 3: Implement core family batches with writing fixtures**

Every batch must include examples shaped like these:

```text
EVERYDAY: At breakfast, Bowie keeps the empty chair beside him untouched until the host enters. Priya quietly moves the unused cup away. Bowie thanks her without looking up; their bond rises because grief was answered, not announced.

HISTORY: Gabby remembers Julia promising a clean slate on the drive. “You used those exact words before the vote that sent me home.” Julia does not deny it; she asks whether recognizing an old move proves she is making it again.

STRATEGY: Three names go onto the library notepad. Alec argues from Round Table votes, Ellie from mission behavior, and Miriam from who repeated whose accusation. They agree on a name but for incompatible reasons, leaving the bloc fragile.

TRAITOR SLIP: Asked when she last saw the murdered player, Julia answers “after the library” before the group has established that the victim ever reached it. Gabby notices the detail; Julia repairs by saying she meant the corridor outside.

MISSION FALLOUT: Fiore took the shield path while her team hauled the final chest. She returns wearing the shield and calls the detour necessary. Two teammates hear safety; the other three hear abandonment.
```

Bad in every family: unnamed questions, unexplained reactions, “tension rises,” internal category headings, or a relationship change unsupported by the scene.

- [ ] **Step 4: Run corpus and reachability tests after each family batch**

Run: `npx vitest run tests/tr-castle-library.test.js tests/tr-castle-reachability.test.js tests/tr-castle-prose.test.js`

- [ ] **Step 5: Commit the independently reviewable core library**

```bash
git add js/tr/castle js/tr/events.js tests/tr-castle-library.test.js tests/tr-castle-reachability.test.js
git commit -m "feat(traitors): build core castle scene library"
```

### Task 8: Bespoke mission contract and first four missions

**Files:**
- Create: `js/tr/missions/contract.js`
- Create: `js/tr/missions/index.js`
- Create: `js/tr/missions/<mission-id>.js` for four approved missions
- Modify: `js/tr/missions.js`
- Modify: `js/tr/headless.js`
- Modify: `js/vp-tr/mission.js`
- Modify: `js/text-backlog.js`
- Test: `tests/tr-mission-contract.test.js`
- Test: `tests/tr-missions-bespoke.test.js`

**Interfaces:**
- Mission: `{ id, name, desc, eligibility(ctx), simulate(ctx, rng) }`
- Record: `{ briefing, phases, playerScores, potBefore, potEarned, potAfter, shields, scenes, placements }`

- [ ] **Step 1: Write failing mission-contract tests**

```js
for (const mission of TRAITORS_MISSIONS) {
  expect(mission.desc.length).toBeGreaterThanOrEqual(200);
  const rec = mission.simulate(ctx, rngFor(7));
  expect(rec.phases.length).toBeGreaterThanOrEqual(3);
  expect(Object.keys(rec.playerScores).sort()).toEqual([...ctx.living].sort());
  expect(rec.potAfter).toBe(rec.potBefore + rec.potEarned);
  expect(rec.briefing).toMatch(/wins|earn|shield|time|finish/i);
}
```

- [ ] **Step 2: Run RED, then implement the contract and picker adapter**

Run: `npx vitest run tests/tr-mission-contract.test.js tests/tr-missions.test.js`

- [ ] **Step 3: Implement four missions one at a time with full host explanations**

Correct briefing format:

```text
“Across the estate are six locked reliquaries. Each team must follow its map to a checkpoint, solve the cipher there, and carry the released weight back to this platform. A wrong cipher locks that station for two minutes; a dropped weight must be returned to its checkpoint before the team continues. Every weight on the platform before the bell adds £2,000 to the pot. The first team home may enter the Armoury, where one player can earn a shield.”
```

Correct action format:

```text
At the second checkpoint, Gabby solves the substitution key while Alec holds the rain-blurred map flat. Julia calls for a guess; Gabby refuses, takes twelve more seconds, and opens the lock without the two-minute penalty. The team gains time, and Julia resents losing control of the decision.
```

- [ ] **Step 4: Verify per-player records, consequences, VP/text parity, and commit**

Run: `npx vitest run tests/tr-mission-contract.test.js tests/tr-missions-bespoke.test.js tests/tr-vp.test.js`

```bash
git add js/tr/missions js/tr/missions.js js/tr/headless.js js/vp-tr/mission.js js/text-backlog.js tests/tr-mission-contract.test.js tests/tr-missions-bespoke.test.js
git commit -m "feat(traitors): add bespoke mission framework"
```

### Task 9: Breakfast, private strategy, and Round Table expansion

**Files:**
- Modify: `js/vp-tr/cold-open.js`
- Modify: `js/tr/roundtable.js`
- Modify: `js/vp-tr/round-table.js`
- Modify: `js/vp-tr/confessionals.js`
- Modify: `js/tr/headless.js`
- Test: `tests/tr-breakfast.test.js`
- Test: `tests/tr-roundtable.test.js`
- Test: `tests/tr-vp.test.js`

**Interfaces:**
- Breakfast stores arrival order, expectations, empty-place reveal, reactions and immediate consequences.
- Round Table speeches consume provenance and produce response/mind-change records before ballots.

- [ ] **Step 1: Write failing card-budget and causal-speech tests**

```js
expect(revealSteps(rpBuildColdOpen(ep))).toBeGreaterThanOrEqual(10);
for (const speech of ep.tr.table.speeches) {
  expect(speech.sources.length).toBeGreaterThan(0);
  for (const source of speech.sources) expect(knows(speech.speaker, source, ep)).toBe(true);
}
```

- [ ] **Step 2: Build breakfast as suspense, not a roll call**

Good:

```text
Miriam arrives first and chooses the chair facing the staircase. By the time only two places remain, she has stopped touching her tea. Gabby comes down. The relief around the table is immediate—and leaves Manu's untouched place as the only answer left.
```

Bad: `Everyone arrives except Manu. Manu was murdered.`

- [ ] **Step 3: Expand Round Table claim, response, cross-talk, mind change, ballot, and reveal beats**

Good:

```text
Finn names the missing checkpoint and says Manu disappeared when the team needed him. Gabby answers before Manu can: six players misread that instruction, and Finn chose the only one already under suspicion. Alec changes his planned vote—not because Manu is cleared, but because Finn's certainty now looks rehearsed.
```

- [ ] **Step 4: Verify knowledge safety, 20–30 Round Table cards, and commit**

Run: `npx vitest run tests/tr-breakfast.test.js tests/tr-roundtable.test.js tests/tr-vp.test.js`

```bash
git add js/vp-tr/cold-open.js js/tr/roundtable.js js/vp-tr/round-table.js js/vp-tr/confessionals.js js/tr/headless.js tests/tr-breakfast.test.js tests/tr-roundtable.test.js tests/tr-vp.test.js
git commit -m "feat(traitors): deepen breakfast and round table"
```

### Task 10: Conclave, recruitment, and endgame explanation pass

**Files:**
- Modify: `js/tr/murder.js`
- Modify: `js/tr/roles.js`
- Modify: `js/tr/endgame.js`
- Modify: `js/vp-tr/conclave.js`
- Modify: `js/vp-tr/recruitment.js`
- Modify: `js/vp-tr/endgame.js`
- Test: `tests/tr-host-explanations.test.js`
- Test: `tests/tr-murder.test.js`
- Test: `tests/tr-recruitment.test.js`
- Test: `tests/tr-endgame.test.js`

**Interfaces:**
- Every special rule record includes `{ fullRules, reminder, trigger, observerVisibility }`.

- [ ] **Step 1: Write failing reachability and order tests for every special rule**

```js
for (const kind of ['murder','blocked-murder','recruitment','ultimatum','endgame']) {
  const rec = findRuleRecord(seasons, kind);
  expect(rec.fullRules || rec.reminder).toBeTruthy();
  expect(rec.order).toBeLessThan(rec.actionOrder);
}
```

- [ ] **Step 2: Write explanations that state choices and consequences**

Recruitment:

```text
“Tonight the Traitors will not murder. Instead, they will invite one Faithful to join them. The chosen player may accept and become a Traitor, or refuse and remain Faithful. The castle will only know that nobody was murdered.”
```

Endgame:

```text
“Each of you must now choose: end the game, or banish again. The game ends only when every remaining player votes to end it. If a Traitor remains when that happens, the Traitor wins the pot. If no Traitors remain, the surviving Faithfuls share it.”
```

Faithful observer text must not expose the conclave discussion or recruitment target.

- [ ] **Step 3: Verify 8–15 conclave/recruitment cards and commit**

Run: `npx vitest run tests/tr-host-explanations.test.js tests/tr-murder.test.js tests/tr-recruitment.test.js tests/tr-endgame.test.js tests/tr-vp.test.js`

```bash
git add js/tr/murder.js js/tr/roles.js js/tr/endgame.js js/vp-tr/conclave.js js/vp-tr/recruitment.js js/vp-tr/endgame.js tests/tr-host-explanations.test.js tests/tr-murder.test.js tests/tr-recruitment.test.js tests/tr-endgame.test.js
git commit -m "feat(traitors): explain every hidden-role ceremony"
```

### Task 10A: Setup, mission timeline, density controls, and debug surfaces

**Files:**
- Modify: `simulator.html`, `js/cast-ui.js`, `js/run-ui.js`, `js/core.js`, `js/vp-tr/debug.js`
- Test: `tests/tr-setup-controls.test.js`, `tests/tr-timeline.test.js`, `tests/tr-vp.test.js`

**Interfaces:**
- Stores `seasonConfig.traitorsDensity`: `full` (default), `extended`, or `compact`.
- Stores mission IDs on the per-episode schedule.
- Produces `traitorsEstimatedCards(epConfig, castSize): { min, max }`.

- [ ] **Step 1: Write failing persistence, timeline, and debug tests**

```js
it('defaults to the full episode experience', () => {
  expect(defaultConfigFor('traitors').traitorsDensity).toBe('full');
  expect(traitorsEstimatedCards({ density:'full' }, 18)).toEqual({ min:100, max:140 });
});

it('shows the scheduled mission and estimated length', () => {
  seasonConfig.episodeMissionSchedule = { 3:'locked-reliquaries' };
  const html = renderTimelineToString();
  expect(html).toContain('Locked Reliquaries');
  expect(html).toMatch(/100.{0,5}140 cards/);
});
```

- [ ] **Step 2: Run RED**

Run: `npx vitest run tests/tr-setup-controls.test.js tests/tr-timeline.test.js tests/tr-vp.test.js`

- [ ] **Step 3: Add controls with actionable writing**

```text
FULL EPISODE · 100–140 cards
Complete castle life, a full mission, private strategy, Round Table and conclave. Recommended.

Locked Reliquaries needs at least 10 active players. Episode 9 is projected to begin with 7; choose a late-game mission.
```

Bad: `Invalid mission configuration.` State the conflict and correction.

- [ ] **Step 4: Expand Debug only**

Show eligible weights/rejections, phase card totals, player screen share, cooldowns, arcs, belief provenance, receipts, alumni facts cited, and observer filtering. `INTERNAL EVENT FAMILY: COVER` is allowed in `tr-debug` and nowhere else.

- [ ] **Step 5: Verify and commit**

Run: `npx vitest run tests/tr-setup-controls.test.js tests/tr-timeline.test.js tests/tr-vp.test.js tests/format-scoped-config.test.js`

```bash
git add simulator.html js/cast-ui.js js/run-ui.js js/core.js js/vp-tr/debug.js tests/tr-setup-controls.test.js tests/tr-timeline.test.js tests/tr-vp.test.js
git commit -m "feat(traitors): add full-experience controls and debug"
```

### Task 11: Complete 12–16 missions and approximately 210 events

**Files:**
- Create/Modify: `js/tr/missions/*.js`
- Modify: `js/tr/missions/index.js`
- Modify: `js/tr/castle/*.js`
- Test: `tests/tr-missions-bespoke.test.js`
- Test: `tests/tr-castle-library.test.js`
- Test: `tests/tr-writing-variety.test.js`

**Interfaces:**
- Extends the contracts established in Tasks 7 and 8 without changing their shapes.

- [ ] **Step 1: Add inventory tests that count complete, not merely registered, content**

```js
expect(TRAITORS_MISSIONS.length).toBeGreaterThanOrEqual(12);
expect(TRAITORS_MISSIONS.length).toBeLessThanOrEqual(16);
expect(EVENTS.filter(isCompleteSceneEvent).length).toBeGreaterThanOrEqual(200);
for (const event of EVENTS) expect(event.variants.length).toBeGreaterThanOrEqual(4);
```

- [ ] **Step 2: Add history/relationship/consequence events to approximately 170**

Include accurate callbacks, reunion warmth, unresolved betrayal, changed reputation, civilian/celebrity contrast, grief, reconciliation, romance, exposed lies, broken agreements and post-exit consequences. Every callback reads stored history rather than matching a name.

- [ ] **Step 3: Add rare-state events and remaining missions to the final range**

Rare does not mean unreachable. Add seeded reachability fixtures for every new precondition.

- [ ] **Step 4: Run variety and full-season corpus tests, then commit**

Run: `npx vitest run tests/tr-castle-library.test.js tests/tr-castle-reachability.test.js tests/tr-writing-variety.test.js tests/tr-missions-bespoke.test.js`

```bash
git add js/tr/castle js/tr/missions tests/tr-castle-library.test.js tests/tr-castle-reachability.test.js tests/tr-writing-variety.test.js tests/tr-missions-bespoke.test.js
git commit -m "feat(traitors): complete castle and mission libraries"
```

### Task 12: Full-season validation, documentation, and release gate

**Files:**
- Modify: `tests/tr-calibration.test.js`
- Modify: `tests/tr-vp.test.js`
- Create: `tests/tr-full-experience.test.js`
- Modify: `docs/ADDING-A-SHOW.md` only if implementation reveals a missing contract detail
- Modify: `docs/superpowers/specs/2026-08-31-traitors-full-experience-design.md` only to record approved deviations

**Interfaces:**
- No new runtime interface. This task proves the delivered system matches the spec.

- [ ] **Step 1: Add a full-season acceptance test**

```js
it('delivers the full experience without vocabulary or knowledge leaks', () => {
  for (const seed of [1,3,7,11,19,29]) {
    const run = playTraitorsSeason({ cast: CAST, traitorCount:3, seed });
    for (const ep of run.episodes.filter(e => !e.tr.endgame)) {
      const screens = traitorsScreensRevealed(ep, 'audience');
      const cards = screens.reduce((n, s) => n + revealCardCount(s.html), 0);
      if (ep.tr.cast.length >= 10) expect(cards).toBeGreaterThanOrEqual(100);
      expect(cards).toBeLessThanOrEqual(140);
      expect(screenNarration(screens.map(s => s.html).join('')))
        .not.toMatch(/\b(?:cover|thread|heat|opened today|the loom)\b/i);
    }
  }
});
```

- [ ] **Step 2: Run focused Traitors suites**

Run: `npx vitest run tests/tr-*.test.js tests/traitors-registry.test.js`
Expected: PASS.

- [ ] **Step 3: Run the project CI commands**

Run: `npm test`
Expected: PASS for all default shards locally supported.

Run: `git diff --check`
Expected: no output.

- [ ] **Step 4: Read generated seasons instead of trusting counts alone**

Inspect at least six full transcripts. Reject and fix any scene where the reader cannot answer who, where, what happened, why it mattered, and what changed. Confirm host explanations precede mechanics, alumni references are accurate, pronouns read naturally, and no cast member disappears from the edit without a game reason.

- [ ] **Step 5: Commit the release gate**

```bash
git add tests/tr-calibration.test.js tests/tr-vp.test.js tests/tr-full-experience.test.js docs/ADDING-A-SHOW.md docs/superpowers/specs/2026-08-31-traitors-full-experience-design.md
git commit -m "test(traitors): gate the full simulator experience"
```

## Claude execution notes

- Read the complete task before editing. Do not batch multiple tasks into one commit.
- Treat every prose example as a quality floor and shape reference, not a line to duplicate across events.
- When an example names Julia, Gabby, Finn, or another contestant, substitute participants chosen by the event; never hardcode example names into production pools.
- A card is not a scene. A scene is the full 2–5-card causal unit.
- If a generated sentence sounds mysterious because its category label was removed, the sentence is incomplete; add the concrete action rather than restoring the label.
- If three attempted fixes fail in different areas, stop and review the architecture with the user before continuing.

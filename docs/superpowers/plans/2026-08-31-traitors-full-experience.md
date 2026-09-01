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
## Event variation contract

The approximately 210 events are base definitions, not the total number of scenes they can produce. Every event must declare the contextual axes that can materially change its casting, dialogue, interpretation, outcome, or consequences.

Required event metadata:

```js
variationAxes: {
  voice: ['archetype', 'social', 'strategic', 'intuition', 'temperament', 'loyalty', 'boldness'],
  relationship: ['close-ally', 'neutral', 'rival', 'romance', 'prior-history'],
  knowledge: ['witnessed', 'heard-with-source', 'incomplete', 'misinformed'],
  alignment: ['faithful', 'original-traitor', 'recruited-traitor'],
  outcome: ['accepted', 'rejected', 'backfire', 'ambiguous'],
  phase: ['early', 'middle', 'late'],
}
```

An event lists only relevant axes, but `outcome` and at least one of `voice`, `relationship`, `knowledge`, or `alignment` are required. A quiet grief event may not need alignment; a Traitor slip does.

### Voice and stats

Archetype and stats change how a contestant speaks and reacts, not the underlying fact. Gameplay remains proportional and noisy; narrative thresholds may select text only after the mechanical outcome is known.

For the same recorded selfish shield decision:

```text
HERO: “I thought I could get back in time. I couldn't, and that cost all of you. That's on me.”

MASTERMIND: “A shield keeps me in the game, and keeping strong players here helps us find the Traitors. You can dislike the choice without pretending it had no logic.”

HOTHEAD: “Oh, come on. Half of you would've taken it too. You're angry because I got there first.”

UNDERDOG: “Nobody here was going to protect me. I saw one chance to protect myself.”

VILLAIN: “I have the shield. We still have a mission tomorrow. I'm comfortable with my choice.”
```

These are not interchangeable quote pools. The Hero branch must support accountability; the Mastermind branch must cite strategic value; the Hothead branch must escalate; the Underdog branch must be eligible only when their social position supports feeling unprotected.

### Relationships

The relationship determines the emotional stakes and delivery:

```text
CLOSE ALLY: Ellie waits until they are alone. “I defended you all day. Tell me why you left us at that checkpoint.”

RIVAL: Ellie raises it in front of the room. “Fiore got her shield. The rest of us got a four-thousand-pound hole in the pot.”

ROMANTIC PARTNER: Ellie is quieter than Fiore expected. “I understand why you wanted safety. I don't understand why you didn't tell me.”

NEUTRAL: Ellie asks what happened before deciding whether the choice matters.
```

Do not use an intimate betrayal line for neutral strangers or a public attack for a loyal ally without a recorded reason for escalation.

### Knowledge and alignment

A witness may state what they saw. A second-hand speaker names the source. A misinformed speaker states a belief, not objective truth. A Faithful cannot narrate Traitor-only information.

```text
WITNESS: “I watched Fiore leave the crate and take the shield path.”

HEARD WITH SOURCE: “Ellie says Fiore left the team for the shield. I wasn't on that checkpoint, so I'm asking.”

INCOMPLETE: “Fiore disappeared for part of the mission. I don't know where she went.”

MISINFORMED: “I heard Fiore cost us the money.” The scene records this as a claim and can later correct it.
```

An original Traitor may have practiced cover habits. A newly recruited Traitor may contradict behavior from the previous day, hesitate in the turret, or overcorrect. That difference requires a stored recruitment episode; it cannot be inferred from current alignment alone.

### Outcomes

Every event has at least two mechanically different outcomes. Four rewritten versions of the same result do not count as four variants.

```text
ACCEPTED: the explanation reduces suspicion and repairs some trust.
REJECTED: suspicion rises and the claim is carried toward the Round Table.
BACKFIRE: the accuser overstates the evidence and loses credibility.
AMBIGUOUS: both accounts remain plausible; the relationship worsens without a clear belief shift.
```

### Required variation tests

For each complete event, tests must prove:

1. `variationAxes.outcome` contains at least two reachable outcomes.
2. At least four materially different authored prose paths are reachable.
3. Relevant relationship states change stakes or delivery, not only one adjective.
4. Knowledge state changes what the speaker is allowed to assert.
5. Voice branches reflect valid archetype behavior and proportional stat influence.
6. Original and recruited Traitors differ when the event declares the alignment axis.
7. Different paths retain the same recorded causal fact unless the outcome changes it.
8. No branch produces identical normalized text under every declared axis.

Use seeded fixtures that force each declared branch. An axis with no test demonstrating a changed scene is decorative metadata and must be removed or implemented.
## Full ceremony and host-speech contract

A major ceremony is a staged scene, not an informational paragraph. On its first appearance, the saved episode record must carry the complete host speech, physical staging, pauses, contestant reactions, observer-safe reveal steps, and the transition into the action. Later appearances may use a concise reminder unless a rule changes.

Every first-use ceremony record contains:

```js
{
  ceremonyId,
  staging,
  hostBeats: [{ kind, text, action, visibility }],
  contestantBeats: [{ kind, text, participants, visibility }],
  rulePoints: [{ id, explainedByBeat }],
  revealBeats,
  reminder,
}
```

Required ceremonies include the premiere rules, Selection, every mission briefing, first Round Table, first conclave visible to entitled observers, recruitment, ultimatum, blocked murder, shield or special power, tie/revote, and endgame.

### Selection reference scene

This is the quality and completeness floor. Adapt the configured host's voice, cast size, Traitor count, observer and staging; do not reduce it to one card or copy the exact wording into every season.

```text
THE SELECTION

The cast stands in a line outside the castle. Their blindfolds are secured. The host waits until the courtyard is completely silent.

“In a moment, I will walk behind each of you.”

The host steps away. Footsteps begin moving slowly along the line.

“If you feel my hand touch your shoulder, you have been chosen as a Traitor.”

Nobody moves.

“You will lie to the people standing beside you. You will earn their trust, sit beside them at breakfast, and help decide who should be banished.”

The footsteps stop behind one contestant, then continue.

“Each night, you will meet in secret and choose one Faithful to murder.”

The host turns at the end of the line.

“If you do not feel my touch, you are a Faithful. Your task is simple to explain—and considerably harder to achieve.”

The host begins the return walk.

“Find the Traitors. Banish every one of them before they take control of the game.”

A hand settles on the first chosen shoulder.

“Do not speak. Do not react. Nobody beside you can know what just happened.”

The host moves to the next chosen player.

“From this moment on, every friendship may be real, every accusation may be useful, and every promise may be a lie.”

After the final tap, the host returns to the front of the line.

“When I tell you to remove your blindfolds, look at the people around you carefully. Some of them have just been given a reason to deceive you.”

A pause.

“Remove your blindfolds.”
```

The next beats depend on the observer:

- **Audience:** sees every named shoulder tap, the chosen players' controlled reactions, and the first turret meeting.
- **Tapped contestant:** experiences their own tap, hears the other footsteps without names, then learns the other Traitors in the turret.
- **Untapped contestant:** hears footsteps, stops and pauses but sees no tap identity and receives no turret scene.

The host may refer to the chosen count only when the format configuration makes that count public. Do not leak it merely because the audience record knows it.

### Theatrical writing requirements

- Put rules inside complete spoken lines rather than labels or summaries.
- Show the host moving through the physical space.
- Use silence, pauses, footsteps, props, doors, envelopes, fire, shields, or ballots when the ceremony actually has them.
- Let tension come from delayed information, not vague adjectives such as “dramatic” or “ominous.”
- Store one reveal beat per meaningful action; do not place the entire speech in one oversized card.
- The host explains what contestants must do, what failure means, what can be won or lost, and what happens next.
- Reactions occur only after the stimulus each contestant witnessed.
- Use the configured host's vocabulary and cadence while keeping rules identical in meaning.

Forbidden shortcuts:

```text
The host explains how the Selection works.
The Traitors are chosen.
Everyone removes their blindfolds.
```

```text
The host gives a dramatic speech about trust and betrayal.
```

Those sentences describe production work instead of performing it for the reader.

### Ceremony tests

For every first-use ceremony, tests must prove:

1. Every required rule point maps to a specific host beat.
2. The host speech appears before the action governed by it.
3. Staging actions and reveal steps are stored separately from narration summaries.
4. Audience, tapped-player and untapped-player Selection views expose the correct information.
5. The first ceremony is complete; recurring reminders are shorter.
6. A changed rule forces a new full explanation.
7. No host name or show vocabulary is hardcoded outside the registry/configuration path.
## Selective confessional contract

Confessionals are not mandatory after every scene. They render only when they add information, strategy, emotion, history, deception, or personality that the public action does not already communicate.

A candidate confessional must satisfy at least one stored purpose:

- `hidden-intent`: explains a private plan or target;
- `audience-lie`: confirms to the audience that the speaker lied publicly;
- `belief-change`: explains why a specific fact changed the speaker's suspicion;
- `vote-change`: cites the argument, relationship, deal, or fact that moved a vote;
- `traitor-reasoning`: explains cover, distancing, murder, or recruitment strategy;
- `history-context`: connects the moment to a recorded alumni incident;
- `emotional-turn`: adds an internal reaction not already visible;
- `character`: delivers distinct humour or personality that cannot fit naturally in the scene.

The scheduler rejects a confessional when removing it loses no new information. It also rejects one whose normalized meaning merely paraphrases the immediately preceding scene.

Correct after a timeline conversation:

```text
“Julia gave me her entire night before I'd even finished the question. Maybe she's nervous. Maybe she rehearsed it. Either way, I'm checking.”
```

This adds Gabby's interpretation and next action.

Repetitive and forbidden:

```text
“I asked Julia where she was, and Julia told me where she was.”
```

Correct Traitor confessional:

```text
“I answered too fast. Gabby noticed, so now I need somebody else to confirm enough of that story that she stops pulling at it.”
```

This is audience-only and records a cover follow-up. A Faithful observer cannot receive it.

Budget guidance:

- routine castle-life scene: normally 0;
- important social scene: 0–1;
- major confrontation: 1–2 total, from opposing perspectives only when they differ;
- mission phase: 2–4 across the whole phase, not per action;
- Round Table: 2–4 at actual belief or vote turns;
- Selection: 3–5 after the ceremony, sampled across tapped and untapped players;
- conclave/recruitment/endgame: only speakers with private reasoning the ceremony did not already state.

Repetition controls:

1. Penalize a contestant who received a recent confessional in the same episode.
2. Do not select the same purpose for the same contestant twice in one episode.
3. Do not repeat the same causal source unless the contestant's interpretation changed.
4. Balance season-long confessional share without forcing empty commentary.
5. Require at least four voice variants for each confessional purpose used by a generator.

Tests must compare the confessional with its source scene and prove that it adds a new fact, intention, interpretation, emotional turn, history citation, or distinct character beat. A confessional failing that comparison must not render and must not count toward the 100–140-card target.

## Episode editing and continuity contract

The scene scheduler supplies eligible material; an episode editor shapes it into a coherent television episode. It selects a small number of stories, orders their beats, reserves space for ordinary life and humour, and prevents every card from having identical dramatic weight.

The saved edit record is:

```js
{
  primaryStories: [{ arcId, premise, plannedBeats, payoff }],
  secondaryStories: [{ arcId, premise, plannedBeats, payoff }],
  textureSlots: [{ purpose, phase }],
  toneLedger: { suspense:0, strategy:0, conflict:0, warmth:0, humour:0, grief:0 },
  promises: [{ id, sourceSceneId, promisedAction, owner, status, resolutionSceneId, abandonmentReason }],
}
```

A standard episode normally carries 2–3 primary stories, 2–4 secondary stories, and 3–6 texture scenes. The editor may use fewer late in the game. It does not invent events to complete an outline; it selects among causally eligible events and records when a promised action cannot happen.

### Scene-to-scene chaining

A scene that announces a future action creates a promise. The promise must become `attempted`, `resolved`, or `abandoned` with a recorded reason.

Correct chain:

```text
SCENE 1: Gabby decides to check Julia's timeline with Alec.
SCENE 2: Gabby asks Alec what he witnessed.
SCENE 3: Their accounts conflict, so Gabby raises the discrepancy privately or at the Round Table.
PAYOFF: Julia explains it, fails to explain it, or redirects the suspicion.
```

Valid abandonment:

```text
Gabby plans to confront Julia, but the mission teams separate them. After the mission, Manu's public argument becomes the urgent story. The promise is stored as postponed, not silently forgotten.
```

Forbidden: a confessional says “I'm checking that story” and nobody checks, postpones, or explains why it was dropped.

### Story resolution

Every opened arc has a concrete subject and stakes. By season end it must be resolved, transformed, transferred after an exit, or explicitly abandoned. Resolution does not require reconciliation: a rivalry can end with permanent distrust, a murdered participant, or a decisive vote.

Tests fail when a promise or arc disappears from the record without a terminal status. They also fail when a payoff cites no earlier setup.

## Knowledge propagation and reaction radius

Information spreads through named receipts:

```js
{ factId, from, to, channel:'witnessed|conversation|public-ceremony|confessional-audience-only', ep, sceneId }
```

- A witness can state what they saw.
- A listener names or preserves the source unless the source was deliberately concealed.
- A public ceremony can inform everyone present.
- An audience-only confessional informs no contestant.
- A rumor can mutate only through a stored retelling; the original fact remains separate.

Major events may trigger wider reactions, but the reaction radius is the union of witnesses, named recipients, and people informed publicly. Do not select arbitrary active players merely to make the event feel important.

Correct spread:

```text
Ellie witnesses Fiore leave for the shield. She tells Gabby and Alec in the van. At the castle, Alec repeats it to Miriam and names Ellie as the source. Five people now know; “everyone knows” is still false.
```

“The whole castle knows” becomes legal only after a public statement or propagation receipts reach the configured consensus floor.

## Modern individual voice contract

Castle atmosphere may be gothic; contestant speech remains contemporary. Narration is clear modern reality-TV prose. The host is polished and theatrical. Contestants use contractions, interruptions, jokes, fragments and vocabulary appropriate to their individual personality.

Voice derives from current emotion, archetype, stats, background, relationship and personal history. No contestant is reduced to one catchphrase, and no archetype receives behavior forbidden by `AGENTS.md`.

Overwritten and forbidden:

```text
“I find your account most troubling, and I shall carry this doubt with me to the Round Table.”
```

Natural:

```text
“That story doesn't add up. I'm bringing it up tonight.”
```

Distinct reactions to the same accusation:

```text
HOTHEAD: “You've been waiting all day to say that. Just say you want me gone.”
PERCEPTIVE PLAYER: “Your first version had you upstairs. This one has you in the library. Which is it?”
SOCIAL BUTTERFLY: “Can we slow down? I want to hear the answer before everybody picks a side.”
MASTERMIND: “The timeline matters, but so does who benefits from making it tonight's only question.”
```

Corpus tests compare normalized sentence structure, not only exact strings, and reject a cast whose dialogue remains interchangeable after names are removed.

## Tone and pacing contract

The editor balances suspense, strategy, conflict, warmth, humour, grief and ordinary life. It enforces:

- no more than three high-conflict scenes consecutively;
- no more than two scenes consecutively with the same family, location or central pair;
- at least one warmth, humour or ordinary-life scene before the Round Table in a standard episode;
- breathing room after a murder reveal, major confrontation and banishment;
- escalating density toward the Round Table without making every earlier scene an accusation;
- no comic interruption inside a grief beat unless the participants' recorded behavior supports it.

Tone slots do not authorize filler. A humorous scene still changes a relationship, reputation, emotional state or information path.

## Evidence for group consensus

Words such as `everyone`, `the whole room`, `the group agrees`, `the castle turns`, and `nobody trusts` require evidence.

Valid consensus sources:

- a public vote or ceremony;
- named reactions from the configured share of living players;
- knowledge propagation receipts reaching that share;
- a stored public show of hands or group declaration.

Otherwise use precise language: `three players`, `most of Fiore's team`, `the people in the van`, or named contestants.

Forbidden:

```text
Everyone turns against Manu after the mission.
```

Correct:

```text
Finn blames Manu for the checkpoint penalty. Ellie agrees. Gabby defends him, while Alec says nothing and writes Manu's name on his shortlist. The room is divided, not settled.
```

## Mission mockup approval contract

Before implementing any bespoke mission VP builder:

1. Create `mockup-tr-<mission-id>.html` with the complete visual layout, phase identities, host briefing, reveal controls, progressive sidebar, accessibility behavior and representative data.
2. Open it for user review.
3. Record explicit approval in the task/commit notes.
4. Implement the mission builder to reproduce the approved mockup.
5. Compare the real VP against the mockup in a browser and keep the mockup in the repository.

Simulation mechanics and failing tests may be built before visual approval. VP builder implementation may not.

## Transcript review rubric

Automated counts are necessary but insufficient. Review at least six complete seasons and score every scene from 0–2 on:

- clarity: who, where, and what happened;
- causality: the source record and resulting consequence are identifiable;
- continuity: setup, follow-up and payoff connect;
- voice: dialogue sounds contemporary and character-specific;
- knowledge safety: speakers know what they claim;
- novelty: it does not repeat the preceding scene or confessional;
- pacing: it serves the episode's story hierarchy and tone;
- payoff: promised actions resolve or have a stored reason not to.

Any zero is a blocking writing defect. A season passes only when every scene scores at least 1 on every axis and the average is at least 1.6. Save the rubric output as a test artifact or deterministic audit report so the review can be repeated after changes.
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

it('stages the complete Selection before revealing a role', () => {
  const selection = firstEpisode.tr.selection;
  expect(selection.hostBeats.length).toBeGreaterThanOrEqual(8);
  for (const rule of ['tap-means-traitor','traitors-murder','faithfuls-banish','do-not-react']) {
    expect(selection.rulePoints.some(point => point.id === rule && Number.isInteger(point.explainedByBeat))).toBe(true);
  }
  expect(selection.hostBeats.findIndex(beat => /feel my .*shoulder/i.test(beat.text)))
    .toBeLessThan(selection.revealBeats.findIndex(beat => beat.kind === 'tap'));
  expect(selection.reminder.length).toBeLessThan(selection.hostBeats.map(beat => beat.text).join(' ').length);
});
```

- [ ] **Step 2: Run the test and confirm RED**

Run: `npx vitest run tests/tr-arrival.test.js tests/tr-vp.test.js`
Expected: FAIL because `tr-arrival` is absent.

- [ ] **Step 3: Store arrival groups, recognitions, introductions, and full first-use rules**

Good alumni introduction:

```text
The next car brings Julia, fourth on Total Drama 2. Gabby's smile drops as soon
as Julia steps out. They played together before, and it did not end well. Julia
hugs her anyway. “We're good now, right?” Gabby laughs. “Sure. Let's go with
that.”
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

### Task 7A: Episode editor, continuity, knowledge spread, voice, and tone

**Files:**
- Create: `js/tr/episode-editor.js`
- Create: `js/tr/knowledge-flow.js`
- Create: `js/tr/castle/voice.js`
- Modify: `js/tr/headless.js`
- Modify: `js/tr/events.js`
- Modify: `js/tr/threads.js`
- Test: `tests/tr-episode-editor.test.js`
- Test: `tests/tr-knowledge-flow.test.js`
- Test: `tests/tr-voice.test.js`
- Test: `tests/tr-story-payoff.test.js`

**Interfaces:**
- Produces `buildEpisodeEdit(eligibleScenes, ctx, rng): TraitorsEpisodeEdit`.
- Produces `recordPromise(sceneId, owner, action)` and `settlePromise(id, status, detail)`.
- Produces `shareFact({ factId, from, to, channel, ep, sceneId })` and `knowersOf(factId, ep)`.
- Produces `lineInVoice(name, purpose, facts, ctx): string` without changing the supplied facts.

- [ ] **Step 1: Write failing story hierarchy, chaining, tone, and consensus tests**

```js
it('pays off or explicitly settles every promised action', () => {
  const edit = buildEpisodeEdit(eligibleScenes, ctx, rngFor(7));
  for (const promise of edit.promises) {
    expect(['resolved','attempted','postponed','abandoned']).toContain(promise.status);
    if (promise.status === 'abandoned') expect(promise.abandonmentReason).toBeTruthy();
  }
});

it('does not schedule an unbroken wall of conflict', () => {
  const edit = buildEpisodeEdit(conflictHeavyScenes, ctx, rngFor(3));
  expect(longestRun(edit.scenes, scene => scene.tone === 'conflict')).toBeLessThanOrEqual(3);
  expect(edit.scenes.some(scene => ['warmth','humour','ordinary-life'].includes(scene.tone))).toBe(true);
});

it('does not call a minority everyone', () => {
  const phrase = consensusPhrase({ agreeing:['A','B','C'], living:12 });
  expect(phrase).not.toMatch(/everyone|whole castle|the group agrees/i);
});
```

- [ ] **Step 2: Write failing knowledge and reaction-radius tests**

```js
shareFact({ factId:'fiore-left', from:'Ellie', to:'Gabby', channel:'conversation', ep:3, sceneId:'van-1' });
expect(knowersOf('fiore-left', 3)).toEqual(expect.arrayContaining(['Ellie','Gabby']));
expect(knowersOf('fiore-left', 3)).not.toContain('Miriam');
expect(eligibleReactors('fiore-left', 3)).not.toContain('Miriam');
```

- [ ] **Step 3: Write failing modern-voice differentiation tests**

```js
const lines = CAST.map(name => stripName(lineInVoice(name, 'challenge-accusation', FACTS, ctx)));
expect(new Set(lines).size).toBeGreaterThan(CAST.length * 0.65);
expect(lines.join(' ')).not.toMatch(/\b(?:I shall|most troubling|I find your account|henceforth)\b/i);
expect(lineInVoice('Hero', 'admit-fault', FACTS, ctx)).toMatch(/my fault|that's on me|I got it wrong/i);
expect(lineInVoice('Hothead', 'answer-accusation', FACTS, ctx)).toMatch(/you|come on|just say/i);
```

- [ ] **Step 4: Run RED**

Run: `npx vitest run tests/tr-episode-editor.test.js tests/tr-knowledge-flow.test.js tests/tr-voice.test.js tests/tr-story-payoff.test.js`

- [ ] **Step 5: Implement the minimal editor and wire it before episode records are finalized**

Select from already eligible scenes. Do not synthesize facts to satisfy story quotas. Keep 2–3 primary stories, 2–4 secondary stories and 3–6 texture slots for a standard cast, then scale proportionally. Store every promise, propagation receipt, selected tone and consensus basis.

- [ ] **Step 6: Verify complete causal chains with readable output**

```text
SETUP: Gabby says she will check Julia's timeline.
FOLLOW-UP: Gabby asks Alec what he saw.
COMPLICATION: Alec's account conflicts with Julia's.
PAYOFF: Gabby raises the exact discrepancy; Julia answers; the answer produces a recorded belief change or accuser backfire.
```

Reject a generated transcript containing the setup without one of the permitted promise statuses.

- [ ] **Step 7: Run the focused suites and commit**

Run: `npx vitest run tests/tr-episode-editor.test.js tests/tr-knowledge-flow.test.js tests/tr-voice.test.js tests/tr-story-payoff.test.js tests/tr-castle-prose.test.js`

```bash
git add js/tr/episode-editor.js js/tr/knowledge-flow.js js/tr/castle/voice.js js/tr/headless.js js/tr/events.js js/tr/threads.js tests/tr-episode-editor.test.js tests/tr-knowledge-flow.test.js tests/tr-voice.test.js tests/tr-story-payoff.test.js
git commit -m "feat(traitors): edit connected television episodes"
```

### Task 8: Bespoke mission contract and first four missions

**Files:**
- Create: `js/tr/missions/contract.js`
- Create: `js/tr/missions/index.js`
- Create: `js/tr/missions/<mission-id>.js` for four approved missions
- Create: `mockup-tr-<mission-id>.html` for each of the four missions
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

- [ ] **Step 3: Create and approve each standalone mission mockup before its VP builder**

Each `mockup-tr-<mission-id>.html` is a complete, browser-openable visual target with the mission briefing, phase layout, progressive player/team state, pot movement, shield state, reveal controls, responsive layout and reduced-motion behavior. Open the mockup in the browser and obtain user approval before implementing that mission's `js/vp-tr/mission.js` path. Keep every approved mockup in the repository as the source of truth; if the builder differs, change the builder or request approval for the mockup change.

- [ ] **Step 4: Implement four missions one at a time with full host explanations**

Correct briefing format:

```text
“Across the estate are six locked reliquaries. Each team must follow its map to a checkpoint, solve the cipher there, and carry the released weight back to this platform. A wrong cipher locks that station for two minutes; a dropped weight must be returned to its checkpoint before the team continues. Every weight on the platform before the bell adds £2,000 to the pot. The first team home may enter the Armoury, where one player can earn a shield.”
```

Correct action format:

```text
At the second checkpoint, Gabby solves the substitution key while Alec holds the rain-blurred map flat. Julia calls for a guess; Gabby refuses, takes twelve more seconds, and opens the lock without the two-minute penalty. The team gains time, and Julia resents losing control of the decision.
```

- [ ] **Step 5: Compare every VP mission against its approved mockup**

For each mission, open the standalone mockup and the generated VP screen at the same viewport. Verify the grid, typography, palette, controls, sidebar fields, phase transitions, responsive state and reduced-motion state. Record the comparison in the task notes; visual approval is a release requirement, not an optional polish pass.

- [ ] **Step 6: Verify per-player records, consequences, VP/text parity, and commit**

Run: `npx vitest run tests/tr-mission-contract.test.js tests/tr-missions-bespoke.test.js tests/tr-vp.test.js`

```bash
git add js/tr/missions js/tr/missions.js js/tr/headless.js js/vp-tr/mission.js js/text-backlog.js mockup-tr-*.html tests/tr-mission-contract.test.js tests/tr-missions-bespoke.test.js
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
for (const event of EVENTS) {
  expect(event.variants.length).toBeGreaterThanOrEqual(4);
  expect(event.variationAxes.outcome.length).toBeGreaterThanOrEqual(2);
  expect(Object.keys(event.variationAxes).some(key =>
    ['voice','relationship','knowledge','alignment'].includes(key))).toBe(true);
  expect(forceDeclaredBranches(event).normalizedTexts.size).toBeGreaterThanOrEqual(4);
  expect(forceDeclaredBranches(event).causalSourceIds.every(Boolean)).toBe(true);
}
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

- [ ] **Step 4: Score generated seasons with the transcript-review rubric**

Inspect at least six full transcripts, including early-, middle- and late-game casts. Score every episode from 0–2 for clarity, causality, continuity, individual voice, knowledge safety, novelty, pacing and payoff using the global rubric. Store the completed scorecard as `docs/qa/traitors-transcript-review.md`, including seed, episode, dimension scores, quoted problem excerpt of at most two sentences, and the resulting fix or explicit pass. Any dimension scored `0`, or any transcript average below `1.6`, blocks release and must be fixed and regenerated before proceeding.

Reject and fix any scene where the reader cannot answer who, where, what happened, why it mattered, and what changed. Confirm host explanations precede mechanics, alumni references are accurate, pronouns read naturally, cast-wide claims name their evidence base, and no cast member disappears from the edit without a game reason.

- [ ] **Step 5: Add an automated audit for machine-checkable rubric failures**

```js
for (const ep of run.episodes) {
  expect(unsettledPromises(ep.tr.edit)).toEqual([]);
  expect(knowledgeViolations(ep)).toEqual([]);
  expect(longestConflictRun(ep.tr.edit.scenes)).toBeLessThanOrEqual(3);
  expect(hasUnsupportedConsensus(ep)).toBe(false);
}
```

Run: `npx vitest run tests/tr-full-experience.test.js`
Expected: PASS for all acceptance seeds.

- [ ] **Step 6: Commit the release gate**

```bash
git add tests/tr-calibration.test.js tests/tr-vp.test.js tests/tr-full-experience.test.js docs/qa/traitors-transcript-review.md docs/ADDING-A-SHOW.md docs/superpowers/specs/2026-08-31-traitors-full-experience-design.md
git commit -m "test(traitors): gate the full simulator experience"
```

## Claude execution notes

- Read the complete task before editing. Do not batch multiple tasks into one commit.
- Treat every prose example as a quality floor and shape reference, not a line to duplicate across events.
- When an example names Julia, Gabby, Finn, or another contestant, substitute participants chosen by the event; never hardcode example names into production pools.
- A card is not a scene. A scene is the full 2–5-card causal unit.
- If a generated sentence sounds mysterious because its category label was removed, the sentence is incomplete; add the concrete action rather than restoring the label.
- If three attempted fixes fail in different areas, stop and review the architecture with the user before continuing.

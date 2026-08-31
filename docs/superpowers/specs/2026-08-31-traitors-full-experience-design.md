# The Traitors — full simulator experience expansion

Status: approved in conversation; awaiting review of this written specification.

This specification extends `2026-08-25-traitors-design.md`. The shipped engine
has a complete deduction game, ceremonies, observer-safe presentation and
exports, but its episode density and premiere presentation are below the
standard established by Total Drama and Big Brother. Where the earlier design
says casting is alumni-only, this specification supersedes it with explicit
Alumni, Celebrity and Civilian background types while keeping Alumni as the
primary experience.

## 1. Outcomes and boundaries

The expansion must make a regular Traitors episode feel like a complete edited
television episode. Standard episodes target 100–140 reveal cards, with coherent
castle life, a full bespoke mission, strategy, a Round Table and a conclave or
recruitment. Episode one must introduce the cast before selecting the Traitors.

In scope:

- An alumni-first Castle Arrival and full rules premiere.
- Per-contestant Alumni, Celebrity or Civilian background types.
- A Traitors-specific event library using Big Brother's proven scheduling
  architecture.
- Chronological, concrete Castle Day scenes with persistent consequences.
- Approximately 210 reusable castle event definitions.
- 12–16 full bespoke missions.
- Expanded Round Table, conclave, confessionals and host explanations.
- Complete VP/text parity, serialization, balance and generated-writing tests.
- A future-show alumni contract in `docs/ADDING-A-SHOW.md`.

Out of scope for the first expansion:

- Automatically choosing the cast.
- Inventing fake reality-show history for custom contestants.
- Giving Celebrity and Civilian casts event libraries as broad as Alumni casts.
- Replacing the existing deduction, murder, recruitment or endgame model.
- Interactive play as a contestant.

## 2. Episode structure and density

### 2.1 Regular episode spine

Every standard episode follows this chronological structure:

1. Breakfast.
2. Morning castle life.
3. Mission briefing and travel.
4. Full mission.
5. Mission fallout.
6. Private strategy and Round Table preparation.
7. Round Table and banishment.
8. Conclave, murder decision or recruitment.

The finale has its own structure and is not stretched or compressed to fit this
template.

### 2.2 Episode-one spine

Episode one begins:

1. Castle exterior and host welcome.
2. Individual or small-group Castle Arrivals.
3. Background-aware contestant introductions.
4. First recognitions, reunions, grudges and impressions.
5. Full format rules briefing.
6. The Selection.
7. First Castle Day.
8. First mission.
9. First conclave.

The Selection cannot substitute for contestant introductions. It begins only
after every contestant has been presented.

### 2.3 Card budgets

| Section | Target reveal cards |
|---|---:|
| Breakfast | 10–16 |
| Morning castle life | 12–20 |
| Mission briefing and travel | 5–8 |
| Mission | 25–40 |
| Mission fallout | 10–16 |
| Private strategy | 12–20 |
| Round Table | 20–30 |
| Conclave or recruitment | 8–15 |

Confessionals are interleaved where they explain action. The ranges overlap in
purpose and are not additive quotas: the final standard-episode band is
100–140. Late-game episodes scale down with cast size, but must retain every
required story function.

## 3. Contestant backgrounds and franchise history

### 3.1 Manual casting

The user chooses every cast member. The simulator never auto-builds the cast or
enforces a Total Drama/Big Brother ratio.

Every selected contestant has a serialized `backgroundType`:

- **Alumni** — a reality-TV veteran. Uses recorded simulator history and the
  contestant's current personality, archetype, occupation and backstory.
- **Celebrity** — publicly recognizable outside reality competition. Uses fame,
  career, public reputation, personality and backstory.
- **Civilian** — not publicly recognizable. Uses occupation, life experience,
  personality and backstory.

Celebrity and Civilian use the same profile fields. Their meaningful difference
is whether other contestants recognize them and whether public reputation can
affect initial threat and expectations.

### 3.2 Defaults and warnings

- A contestant with recorded show history defaults to Alumni.
- A contestant without recorded history defaults to Civilian unless profile
  metadata explicitly identifies public fame.
- The user may override the default.
- Choosing Alumni without recorded history produces a blocking validation
  warning against false history; the contestant remains playable after being
  classified Celebrity or Civilian.
- The resolved background type and background summary are snapshotted into the
  season so later database edits do not rewrite a replay.

The first content pass is designed for mostly Alumni casts. Celebrity and
Civilian behavior must be correct, but their event variety may initially be
smaller.

### 3.3 Alumni behavior

Alumni do not become walking résumé cards. Their history controls what other
players know about them; personality controls how they behave now. The engine
may use:

- Prior seasons, originating show, placement and finalist/winner status.
- Competition or challenge record.
- Old alliances, voting blocs and relationships.
- Betrayals, blindsides, rivalries and romances.
- Reputation for strategy, loyalty, social influence or performance.
- Current archetype, stats, backstory, occupation and personal voice.

History seeds proportional, noisy opening relationships and expectations. New
castle behavior can reinforce or overturn every reputation.

### 3.4 Current and future alumni sources

Total Drama and Big Brother are the only available alumni source shows today.
The source list must never be hardcoded in Traitors. It is derived from the show
registry and compatible season records so future reality-show engines become
available automatically.

`docs/ADDING-A-SHOW.md` must require every future competitive reality show to
publish, when its mechanics record them:

- Format slug and display name.
- Season identity.
- Stable player slug/identity mapping.
- Placement and winner/finalist status.
- Competition, challenge or mission record.
- Alliance and relationship history.
- Betrayals or decisive votes.
- Exit type.

Fields a format genuinely does not have remain absent; no fake jury, challenge
or alliance data is synthesized.

## 4. Shared scheduling architecture, dedicated Traitors content

Big Brother's `scheduleHouseBeats()` architecture is the reference: weighted
eligibility, phase-specific scheduling, repeat penalties, screen-time balance,
location awareness, effect receipts and follow-up events. Traitors must reuse
generic scheduler utilities where extraction is clean, or implement the same
contract against a shared kernel.

It must not execute Big Brother's `HOUSE_EVENTS` or mutate `gs.bb`. HOH,
nominee, veto and eviction assumptions do not belong in the castle. Traitors has
its own event registry, phase vocabulary, locations and state adapter.

Each Traitors scene event declares:

- Unique ID, family and eligible episode phase.
- Castle location and access requirements.
- Preconditions based on knowledge, suspicion, relationships, alignment,
  background history and recent events.
- Proportional weight plus noise.
- Participant selection with screen-time balancing.
- A complete scene of 2–5 reveal cards.
- Gameplay consequences through one scene API.
- Optional follow-up hooks.

The scheduler runs a budget for each episode phase. It penalizes repetition by
event, participant pair, location and narrative purpose; reserves space for
underfeatured contestants; prefers meaningful continuations; and rejects
incompatible scenes in the same episode.

## 5. Castle event library

The initial full target is approximately 210 reusable definitions:

| Family | Target |
|---|---:|
| Everyday castle life | 35 |
| Suspicion and investigation | 30 |
| Traitor cover, slips and recovery | 25 |
| Prior-show history | 25 |
| Relationships and emotional life | 25 |
| Strategy and voting coordination | 25 |
| Mission fallout | 20 |
| Consequences and follow-ups | 25 |
| **Total** | **210** |

The existing roughly 98 Traitors definitions are audited rather than blindly
discarded. Usable premises become full scenes; duplicates are merged; vague or
technical prose is rewritten; missing effects and follow-ups are added. With an
average of four materially different prose paths per event, the complete
library should provide roughly 800 authored variants.

Delivery occurs in three content waves:

1. 110–130 core events that reach the full episode-density band.
2. History, relationship and consequence coverage to approximately 170.
3. Rare-state events and long-run variety to approximately 210.

A regular episode selects approximately 25–35 castle scenes. Their 2–5-card
streams provide about 55–85 cards; missions and ceremonies bring the episode to
the overall target.

## 6. What a Castle Day scene is

Viewer-facing Castle Day is an edited television episode, not a state report.
Every scene must establish:

1. Where and when it happens.
2. Who is present.
3. What concretely happens.
4. What is said when dialogue matters.
5. How others react.
6. What information or gameplay state changes.

Internal labels such as `cover`, `thread`, `heat`, `opened today`, `story` and
`The Loom` never appear in ordinary viewer prose. They remain available in
debugging. A line such as “had an answer ready” is incomplete unless the scene
shows the question, answer and reaction.

Castle life includes meals, bedrooms, chores, wardrobe, exercise, games,
drinks, boredom, humour, private walks, library meetings, homesickness,
reassurance, conflict, friendship, rivalry and romance. These moments still
have consequences: relationship change, information, reputation, emotional
state or later behavior.

Locations are meaningful rather than decorative. The breakfast room, library,
bar, bedrooms, grounds, kitchen, billiards room, corridors, transport and
turret support different actions and access. The written action is the final
authority on location.

## 7. Persistent story continuity

Every meaningful scene can open, advance, complicate or resolve an arc. Stored
arc state includes the real participants, concrete subject, last development,
unresolved stakes and eligible continuations. Viewer prose describes the event,
never the arc machinery.

Continuity rules:

- Active arcs receive priority without monopolizing screen time.
- Mission behavior feeds mission fallout, suspicion and Round Table arguments.
- Private discussions feed speeches, voting intentions and ballots.
- Round Table accusations affect relationships and the next breakfast.
- Murdered and banished contestants leave different emotional consequences.
- Exits close, transfer or transform relevant arcs.
- A fact cannot be introduced twice as though it were new.
- Nobody discusses information they could not know.

## 8. Gameplay consequences and provenance

A Traitors scene API is the only ordinary route for scene consequences. It can
change:

- Bonds and relationships.
- Per-observer suspicion and confidence.
- Knowledge, claims, alibis and contradictions.
- Voting intentions and voting blocs.
- Murder and recruitment preferences.
- Shield knowledge and misinformation.
- Popularity and audience perception.
- Emotional/behavioral state.
- Story-arc state and follow-up eligibility.
- Reputation derived from current-season conduct.

Information records provenance:

`observer → subject → belief → source → confidence → truth status`

Later decisions cite real causes. Successful cover may lower suspicion but
cannot erase a known fact. Relationships affect who shares information and
whose account is believed. Murder and recruitment choices incorporate
deduction threat, influence, shields, relationships, compatibility and social
fallout.

Every event carries a machine-readable consequence receipt. Receipts power
debugging and tests; normal presentation demonstrates consequences through
later behavior instead of technical chips.

## 9. Full bespoke missions

The first complete library contains 12–16 missions. Every mission is its own
module and includes:

- A host-delivered rules explanation before play.
- Unique setting, objective, phases, failure conditions and win condition.
- Appropriate team, pair or individual assignments.
- Multiple similarly weighted scoring phases using varied valid stats.
- `noise(2.5)` or greater on stat checks and believable upsets.
- Player-level performance records and clear pot accounting.
- Shields or special rewards where appropriate.
- Social interaction during travel, downtime and play.
- Heroic, selfish, suspicious, cowardly and impressive behavior.
- Consequences for bonds, popularity, suspicion, knowledge and targeting.
- Mission-specific confessionals and fallout.
- Unique VP identity, complete text retranscription and replay-safe data.

A Traitor may subtly undermine coordination but cannot receive guaranteed
sabotage success. A Faithful mistake may look suspicious. Alumni behavior may
echo prior history only when the stored history supports the callback.

## 10. Host explanation contract

The host explains rules before the action that depends on them.

- The premiere explains alignments, murder, breakfast, missions, pot, shields,
  Round Table, banishment, possible recruitment and the endgame objective.
- The Selection explains blindfolds and taps without violating observer
  knowledge.
- Every mission explains setup, step-by-step mechanic, failures, pot values,
  shields, limits and win condition.
- Every new twist or rule change receives a full explanation.
- Recurring ceremonies receive a concise reminder after their first full
  explanation.
- Conclave information is shown only to entitled observers.
- Endgame explains the fire vote, stopping condition, surviving-Traitor effect
  and pot division.
- Ties, blocked murders, recruitment, ultimatums, shield restrictions and
  special powers are explained when they occur.

The explanation is saved on the episode record and appears in VP and text
backlog. Host prose uses the selected host from the format registry and never a
hardcoded name.

## 11. Viewer presentation and writing contract

- Castle Day is chronological and divided by natural time/location headings.
- Every scene has an establishing beat and 2–5 progressive cards.
- Confessionals sit beside the action they clarify.
- Observer filtering applies before prose is rendered; secrets are not merely
  hidden with CSS.
- Personality and established history determine voice.
- Alumni callbacks identify the correct show, season and relationship.
- Celebrity and Civilian prose never invents competition history.
- Pronouns use the project's valid pronoun properties.
- No purely cosmetic social interaction is allowed.
- Repeated events use materially different actions and language.
- Ceremony length is not inflated to meet the card budget.
- VP screens and text backlog are complete retranscriptions of one another.

## 12. Setup and timeline

Season setup adds:

- Per-contestant Background Type.
- Alumni history preview.
- Celebrity/Civilian backstory and personality preview.
- Validation for missing history.
- Episode-density setting, default Full.
- Mission schedule and selection controls.
- Existing applicable romance/relationship and host controls.

The timeline displays Castle Arrival and Selection on episode one, scheduled
missions, shields, special rules, recruitment opportunities, endgame milestones
and estimated episode length. It reports incompatible authored choices before
the season runs.

## 13. Debugging contract

The ordinary viewer never sees scheduling internals. A separate debug view
shows:

- Eligible events, weights and rejection reasons.
- Selected scene/card counts by phase.
- Cast screen-time distribution.
- Repetition and cooldown state.
- Arc state.
- Knowledge and suspicion changes.
- Consequence receipts.
- Alumni-history facts used by narration.
- Observer-filtering decisions.

## 14. Validation

Automated tests must establish:

- Standard episode density remains within 100–140 cards across representative
  cast sizes and seeds.
- Late-game scaling preserves required sections without empty filler.
- Every scene has location, participants, concrete action, reaction and effect.
- Internal engine vocabulary does not leak into viewer prose.
- Every state change has a consequence receipt.
- Mission actions affect later suspicion and targeting.
- Round Table arguments use knowledge the speaker possesses.
- Observer layers never leak alignment, murder or recruitment information.
- Alumni references match the snapshotted database history.
- Celebrity/Civilian prose invents no reality-show history.
- Alumni writing uses personality as well as history.
- Pronouns and generated grammar pass corpus sweeps.
- Repetition, pair concentration and cast coverage stay within measured bands.
- Every mission explains and renders all rules and phases.
- VP/text parity holds for every screen.
- Save/load and replay preserve backgrounds, history, scenes and effects.
- Total Drama and Big Brother regressions remain green.

Full-season sampling additionally measures scene-family variety, arc resolution,
sentence duplication, deduction balance, faction win rates, mission variety,
cards per episode and host-explanation reachability.

## 15. Ordered implementation roadmap

1. Amend `docs/ADDING-A-SHOW.md` with the registry-driven alumni-export
   contract and state that TD/BB are the current source shows.
2. Add Background Type configuration, validation, serialization and history
   snapshots to setup/state/export paths.
3. Add Castle Arrival records, host premiere briefing and background-aware VP
   presentation before Selection.
4. Define a reusable scheduling kernel or clean adapter boundary based on
   `js/bb/house-events.js` without importing BB events or state into Traitors.
5. Define the Traitors scene contract, consequence API, provenance and debug
   receipts with failing contract tests.
6. Replace the single 4–8-event daily budget with phase-specific budgets and
   screen-time/repetition controls.
7. Audit the existing Traitors registry; rewrite usable premises into complete
   scenes and remove viewer-facing internal terminology.
8. Deliver the first 110–130 castle events across all core families.
9. Replace Castle Day VP/text presentation with chronological multi-card scenes
   and interleaved confessionals.
10. Build the bespoke-mission framework and first mission modules with complete
    rules, scoring, consequences, VP and transcript output.
11. Expand breakfast, private strategy, Round Table and conclave presentation
    to meet their story functions and card bands.
12. Extend history, relationship, mission-fallout and consequence events to
    approximately 170 definitions.
13. Complete 12–16 missions and expand rare-state variety to approximately 210
    events.
14. Add density, reachability, provenance, observer-safety, repetition,
    grammar, serialization and cross-show regression suites.
15. Run full-season writing and balance sweeps, correct measured failures, and
    merge only after the complete CI matrix passes.

## 16. Acceptance criteria

The expansion is complete when an alumni-heavy season can be manually cast and
played from Castle Arrival through endgame; regular episodes consistently
deliver 100–140 coherent reveal cards; every mission is bespoke and fully
explained; Castle Day contains understandable television scenes rather than
engine labels; prior history and current personality both affect play; every
scene has a consequence; observer secrets remain safe; replays are stable; and
all project tests pass.

# The Traitors — design

Status: design approved in conversation, spec awaiting review.
Branch: `traitors`. Nothing merges to `main` until the show is finished.

## 0. What this is

A third show on the franchise engine: **The Traitors**, an all-alumni social
deduction format. A small informed minority hides inside a large uninformed
majority; the majority votes someone out every round, the minority kills someone
every night, and whichever faction is standing at the end splits a shared prize
pot.

It is the flagship of the future-shows list because the Round Table is a group
vote and this engine's core asset is bonds, perceived bonds and a group vote.
Everything expensive about it is what surrounds that vote.

### Scope

This spec covers **sub-project 1: the simulated show**. Two siblings are
deliberately out of scope and get their own specs:

- **Sub-project 2 — play as a character.** An interactive mode where the user
  occupies one player's seat. Not built here, but its seam is designed in: see
  §9.1. This is the reason the render contract takes an observer.
- **Sub-project 3 — ratings.** `readSignals` in `js/ratings.js`. Deliberately
  last. `docs/ADDING-A-SHOW.md` §10 is explicit that it cannot be wired until a
  season has actually been played, and that it mis-wires silently and
  permanently. Do not attempt it early.

### Non-goals

No jury, in any form. The format has none, so `bb/jury.js`, `jury-house.js`,
`jury-sentiment.js`, `jury-pressure.js`, the jury bubble and the 13-screen BB
finale are all inapplicable. No tribes, no idols, no individual immunity, no
nominations, no veto. Resisting the urge to port these is a design requirement,
not an oversight.

## 1. Settled decisions

Recorded so they are not relitigated:

| Decision | Choice |
|---|---|
| Format fidelity | **Faithful.** Co-winners and a split pot are kept, with the export consequences in §10 |
| Banishment brain | **A real belief model**, not a suspicion float. The Mole's scalar is explicitly the thing to beat |
| Viewer knowledge | **Dramatic irony.** The audience knows the Traitors from episode 1 |
| Interactive mode | Wanted later. Render contract is observer-parameterised from day one |
| Traitor count | User-choosable or rolled from a range. `maxTraitors = clamp(round(cast * 0.25), 2, 5)` |
| Traitor selection | `random` (default) or `chosen` in the cast builder |
| Casting | Alumni only. Zero new characters authored |
| Engine placement | Its own tree, `js/tr/`. **Not** a Big Brother mode — see §3.1 |
| Export shape | Reuse `votingHistory[]` with a `channel` field. No third shape |
| Shields | Won in missions. The Armoury is **not** rebuilt — see §7.3 |

## 2. The registry entry

`js/shows.js`, slug `traitors`, prefix `tr`.

```
words: { player: 'player', players: 'players', round: 'Episode',
         exit: 'banished', comp: 'mission', comps: 'missions won',
         compBeast: 'mission asset', compWon: 'missions',
         audienceAward: <TBD> }
```

`exit` is the trap this file exists for. A Traitors season has **two** exit
verbs — `banished` (the vote) and `murdered` (the night) — where the registry
assumes one. Any sentence describing a departure must read the round's exit
channel, not the show default. This is the recurring bug class in
`docs/ADDING-A-SHOW.md`, in a new shape.

`audience` overlay: this show sells paranoia and betrayal, not stunts or vote
arithmetic. Values set when ratings are wired (sub-project 3), not before.

### 2.1 The two founding questions (manual §0)

The manual says answer these first because both are hard to change later.

**Does it eliminate by vote, or by result?** **Neither, exactly — and this show
needs a third answer.** Banishment is a vote. Murder is *not* a vote and *not* a
result: it is a decision taken by a subset of the cast, off-screen, with no
ballot the group ever sees. The manual contemplates two kinds and this is a
third. §10.1 handles it by modelling the murder as a Traitors-only ballot on a
`channel`, which keeps the voting grid, the vote-history tab, the betrayal
ledger and the social feed fed — all four of which have nothing to draw from an
elimination with no ballot.

**Is a round a week or an episode?** An **Episode**.

### 2.2 `careerStats` — what rolls up into a career

Required in the registry and previously missing from this spec.
`_rebuildByShow()` reads it and branches on nothing; a bare name is a top-level
field, a dotted name reaches into a nested block.

```js
careerStats: [
  ['tr.missionsWon',    'totalMissionsWon'],
  ['tr.shieldsWon',     'totalShieldsWon'],
  ['tr.roundsAsTraitor','totalRoundsAsTraitor'],
  ['tr.timesRecruited', 'totalTimesRecruited'],
  ['tr.timesMurdered',  'totalTimesMurdered'],
  ['tr.timesBanished',  'totalTimesBanished'],
]
```

Two notes. `roundsAsTraitor` rather than `seasonsAsTraitor`, because
recruitment means the role is not a season-level property. And a career that
can say *"murdered three times, never once banished"* is a characterisation the
other two shows cannot produce — worth having.

Open: whether mission performance deserves a per-player career stat at all,
given missions grant no immunity and `careerStats` is shaped around wins
(carried in §14).

### 2.3 Engine wiring checklist (manual §2)

Small, specific, and every item is silent when forgotten:

- **`gs.episodeHistory[]` stamped `format: 'traitors'`.** VP screens, the
  timeline and the replay path all filter on it; an unstamped episode belongs to
  Total Drama by default.
- **A runnable flag** — `window._trRunnable`, set at the bottom of the run
  module, read by `formatIsRunnable()` in `js/core.js`. It exists so a
  half-built show cannot be started by someone clicking through setup, which is
  exactly our situation for most of this build.
- **Dispatch in `js/run-ui.js` twice** — `simulateNext()` (~950) **and the
  replay path** (~1116). The replay path once knew only Total Drama's engines,
  so a Big Brother house had checkpoints it could never spend.

### 2.4 Twists and config (manual §§3–4)

- Every `TWIST_CATALOG` entry needs `format: 'traitors'`. A twist with no
  `format` belongs to Total Drama, and that default is load-bearing for
  fourteen seasons of existing entries.
- `js/quick-setup.js`: `CONFIG_SCOPE` (add `traitors` only to controls this
  engine actually reads — no tribes, no idols, no have-nots), the **show
  picker** (`{ id, name, tag, icon }`, ~425), the **blueprint** that seeds a
  default season, and **host options**. `tests/format-scoped-config.test.js`
  enforces the first.

## 3. Architecture

### 3.1 Rejected: Traitors as a Big Brother mode

Cheaper on paper — reuse the week engine, swap nominations for the Round Table.
Rejected because BB's spine is nominate → veto → evict → jury and Traitors' is
murder → mission → banish → no jury. More would be gutted than kept, and every
gutted branch becomes an `if (show === 'traitors')` inside Big Brother code.
That is precisely the bug class the manual was written to prevent, and it would
put a working show at risk for a feature that is not its own.

### 3.2 Module tree

New, under `js/tr/`:

| Module | Responsibility |
|---|---|
| `roles.js` | Selection, refusal, the count roll, recruitment, ultimatum, alignment facts and eras |
| `deduction.js` | Evidence → beliefs about alignment → suspicion. §4 |
| `events.js` | The castle event engine: threads, weighting, cooldowns, acts, residue. §5 |
| `roundtable.js` | Debate, accusation broadcast, the banishment vote, the reveal cascade |
| `murder.js` | Conclave, preference formation, the argument, target choice, Shield blocks, variants |
| `missions.js` | Team missions, the prize pot, Shield/Dagger/Seer side objectives |
| `endgame.js` | Banish-or-End loop, pot split, the no-reveal rule |
| `round.js` | The loop orchestrator: beats and windows |
| `state.js` | `gs.tr` shape, serialization, Set repair |

Reused unchanged: `core`, `players`, `bonds`, **`knowledge`**, `relationships`,
`romance`, `social-manipulation`, `franchise-meta`, the cast builder, avatars,
the VP shell, and the resolution half of `voting.js`.

### 3.3 What `voting.js` gives us

`simulateVotes()` already takes an **`openVote`** parameter, and
`simulateRevote(tribalPlayers, tiedPlayers, ...)` already restricts a tie revote
to the tied pair — which is the Round Table's tie rule unmodified.

We reuse **vote resolution** wholesale and replace **vote decision**:
`buildVoteReason` is ~390 lines of Total Drama alliance logic, and a Traitors
ballot is cast on suspicion instead. That replacement lives in `roundtable.js`.

## 4. `tr/deduction.js` — the core

### 4.1 Alignment as a fact

```
recordFact({ type: 'alignment', subject: Q, truth: <Q is a Traitor> })
VALIDITY['alignment'] = 99
```

- **Traitors** learn their own and each other's at `public` credibility (1.0).
- **Everyone else** can only arrive at it via `deduced` (0.62) or `rumor` (0.45).

That ceiling is the design. No Faithful ever *observes* an alignment, so no
Faithful can ever be certain. They act on ~0.6-confidence guesses, which is what
the people on the show are doing.

### 4.2 The fit with `_assess()`

`js/knowledge.js` `_assess()` already treats `truth === false` as a planted lie
and rolls read-skill (`mental * 0.6 + intuition * 0.4`) to detect it. Read
through alignment:

- Accusing a **Traitor** (`truth: true`) — sharp readers accept firmly.
- Accusing a **Faithful** (`truth: false`) — **sharp readers see through the
  frame** (`valence: 'false'`, confidence x0.6); gullible ones swallow it.

"High-intuition players don't fall for a frame-job" is therefore not new code.
It is the existing function pointed at a new fact type. This is the single
largest reason the build is tractable.

### 4.3 Alignment eras — required from day one

Recruitment **mutates ground truth mid-season**. A Faithful who flips in episode
8 was genuinely a Faithful in episode 3, so beliefs formed before the flip were
correct when formed. Flipping `fact.truth` naively makes `isAccurate()`
retroactively mark every sharp early read as a mistake.

Alignment facts therefore carry an **era**: `{ truth, sinceEp }`, and accuracy is
evaluated against truth-at-learn-time. This cannot be bolted on after seasons
are saved.

### 4.4 Evidence sources

1. **The ballot record.** Public, permanent, free — every ballot is read aloud,
   so this is Total Drama's public-vote model, not Big Brother's secret one.
   Rules: defended a revealed Traitor (strong); voted a revealed Faithful (mild);
   voted a revealed Traitor (exonerating); changed a vote late; and **two players
   who have never once voted for each other** across N rounds. That last one
   catches real Traitor pairs and innocent friendships alike, and the false
   positive is intended.
2. **Murder-shaped inference.** The strongest logic in the format. You were in
   the murder pool, unshielded, and survived — why you? You pushed X's name and X
   died that night. The victim was whoever was closest to catching someone. The
   first is a genuine counting argument and should be available to high `mental`.
3. **The visibility trap.** High social centrality makes you a murder magnet and
   gives you table protection. Cracking under accusation is a `temperament` roll
   that generates suspicion by itself. Too quiet and too loud both read badly.
4. **Mission leakage.** Any mission where knowledge is the currency (the Chess
   mission generalised) risks a Traitor who knows the answer and must not show
   it. Sabotage sits here.
5. **Franchise-meta priors.** Reputation and grudges from previous seasons,
   applied before any evidence exists. Not evidence — a prior, and frequently
   wrong. This is the franchise's original contribution to the format, and it is
   only possible because careers are already in the system.
6. **Recruitment tells.** A flip changes which events a player is eligible for
   overnight. The discontinuity is readable, proportional to `intuition`.

### 4.5 Two functions the shared model lacks

- **`broadcast()`** — `propagate()` models private hops between people who talk.
  An accusation at the Round Table is heard by everyone at once, filtered per
  listener through `_assess` **and through their trust of the accuser**. This is
  why a high-`social` Traitor can frame someone while a distrusted player naming
  the same true name is ignored.
- **`revealCascade()`** — a banishment reveal lands at `public` 1.0 and
  retroactively re-scores everyone: defenders of a revealed Traitor take a hit,
  their accusers are exonerated. This is why late Round Tables sharpen without
  any scripting; information density genuinely rises.

### 4.6 Belief to ballot

```
suspicion(P -> Q) = effectiveConfidence(P's belief in alignment:Q)
                  * bondResistance(P, Q)
                  * grudgeBias(P, Q)
                  + noise
```

Two intended consequences: a strong bond can carry a Traitor through a table
they should have lost, and noise means the group is sometimes wrong together —
the format's real failure mode, not a bug in ours.

## 5. `tr/events.js` — the event engine

The requirement is explicit: events must not go shallow or repetitive, must
relate to each other within an episode and across a season, and must be weighted
by the person — position, role, bond, stats.

### 5.1 Continuation beats novelty

The governing rule. **An event that advances something already happening
outranks an event that starts something new.** Repetition does not come from
reusing an event; it comes from every firing being unconnected, so nothing
accumulates and each episode restarts from zero.

### 5.2 Threads

```
thread: { id, kind, parties[], openedEp, act, state, evidence[], heat }
```

Events open, advance and close threads. Worked example — one thread, six
episodes, six different events:

| Ep | Event | Thread |
|---|---|---|
| 2 | A eavesdrops on B and C, hears nothing | opens `suspicion: A → B` |
| 3 | A tests B, asking him to commit a vote | advances |
| 4 | B breaks the commitment at the table | escalates, heat up |
| 5 | A confides in C, citing episode 2 | propagates to a second holder |
| 7 | A accuses B at the Round Table, naming all three moments | pays off |
| 7 | B is banished, revealed **Faithful** | closes badly; `revealCascade()` guts A's credibility |

A thread's payoff is allowed to be wrong. A season where every suspicion
resolves correctly is as boring as a repetitive one.

### 5.3 `weight(ctx)` is a function

Every event declares `weight(ctx)` over live state, so most events are weight 0
most of the time. Sharp preconditions make an event fire once a season and read
as authored. `ctx` carries: **role** (Traitor / Faithful / recruited-this-week as
a distinct third state), **position** (rounds survived, accused last table,
powers held, social centrality, mission performance), **bond** (real and
perceived, both directions), **stats**, **state** (emotional — `paranoid` and
`desperate` already exist and `knowledge.js` already reads them), and **history**
(franchise meta plus this season's open threads).

### 5.4 Four guards against sameness

1. **Rare-state amplification.** Rare preconditions weight **up** when eligible,
   never down. Content gated behind a rare state and weighted normally never
   fires — dead events you believe are in the game. Corollary from the BB Hacker
   build: `weight()` and `fire()` must agree, enforced by a test.
2. **Cooldowns at three scopes** — per event, per player, per **pair** — plus a
   `oncePerSeason` flag so signature moments cannot cheapen themselves.
3. **Acts.** Season-level pacing multipliers. Early: broad, social,
   thread-opening. Middle: testing, doubting, thread-advancing. Late: paranoid,
   surgical, thread-closing, counting arguments. An episode-2 castle must not
   sound like an episode-9 castle.
4. **Residue.** Depth is not more text variants. An event has beats, branches on
   a real check, and writes durable state later events can read and cite. Residue
   is what lets episode 7's accusation name episode 2.

### 5.5 Branching over variants

Text variants stop repetition of wording, not of shape. The loyalty test is not
one event with eight phrasings — it is a check that forks **kept / broken /
deflected / turned back on the asker**, each writing different residue and
opening different downstream events.

The format's own gift: the two things a Traitor most wants — to be trusted, and
to know things — are exactly the two that generate evidence about them. The
Traitor pool is therefore not a bolted-on scheme list; it is the same events with
the risk inverted.

### 5.6 Beats and windows

Four mechanical **beats** (breakfast, mission, Round Table, conclave)
punctuating seven social **windows**; 4-8 events drawn across the windows per
round.

| Window / beat | Content |
|---|---|
| *Dawn — the empty chair* | who is missing, before it is announced |
| **Breakfast** | beat |
| *Morning* | grief, first reads, the counting begins |
| *The journey out* | the format's own gift — the show documents that players get their most private game conversations riding to missions. Pairs assigned to cars |
| **Mission** | beat |
| *The journey back* | debrief, blame for a failed mission |
| *Evening* | campaigning; vote pitches live here |
| **Round Table** | beat |
| *After the table* | the reckoning. Someone was just revealed. Bonds shatter |
| **Conclave** | beat, Traitors only |
| *Night* | bedrooms, fear, romance |

### 5.7 The seven families, and scale

Trust-building; trust-testing; suspicion; grief and fear; romance; cover and
manipulation (Traitor-only); franchise callback.

**Volume target: ~150+ castle events across the seven families, plus a
Traitor-only pool.** Big Brother's continuity catalogue is 47 across 5 files on a
show where competitions carry much of the weight; Traitors has no comps to hide
behind. "Dead event, never fired across 20 simulated seasons" is an **audit**,
not a hope.

### 5.8 Existing assets

- `camp-events.js:157` — `{ id: 'eavesdrop', twoPlayer: true } // creates suspicion`.
  The Traitors event, already written.
- `js/social-manipulation.js` — forge note, spread lies, whisper campaign,
  campaign rally, **false majority**. Every one is a Traitor tool as written;
  False Majority already hooks `voting.js`.
- `js/romance.js` — the whole pipeline and its cap.

Eligibility changes from **archetype** to **role**; the generators largely
survive.

### 5.9 Role overrides archetype

`CLAUDE.md` states nice archetypes never scheme. A `hero` who accepts recruitment
**is a Traitor** and must lie daily. Resolution: **role overrides archetype for
permission; archetype governs competence.** A hero-turned-Traitor schemes and is
visibly bad at it, with a high tell rate feeding evidence source 6. This is both
the correct rule and the better story.

## 6. `tr/roles.js` and `tr/murder.js`

### 6.1 Selection

Near-uniform random by default. Weighting toward masterminds makes every season
the same season, and the format's best outcomes include a **terrible Traitor** —
a hothead who cracks in episode 3, a hero who cannot lie. An optional "cast for
drama" lean may exist, off by default.

**Refusal** (the Norway precedent): a high-`loyalty` `hero` or `loyal-soldier`
may decline the tap; it re-rolls. Rare, characterful, and it makes the blindfold
scene a moment rather than an announcement.

### 6.2 The conclave is an argument, not a calculation

Nothing computes an optimal target.

1. **Each Traitor forms their own preference**, weighted by their own read
   quality: `strategic` and `intuition` decide how well they weigh the
   tool-allocation logic, `boldness` how aggressive, their own bonds who they
   cannot bring themselves to name. A low-`strategic` Traitor genuinely picks
   badly and nothing corrects them.
2. **The room resolves it socially** — `social`, bond, conclave standing. The
   best read in the room loses regularly.
3. **Disagreement writes residue.** `conclaveTension` is a ledger of who
   overruled whom on which night, not a mood.

### 6.3 Target reasoning

The governing logic is **tool allocation**, per the format's own strategy record:
*murder is for people the table cannot remove; the table is for everyone else.*

- **Murder the beloved and obviously-Faithful** — banishment will never reach
  them, so murder is the only tool that works.
- **Keep the suspicious Faithful alive on purpose** — they soak up banishment
  votes. Killing them wastes a Faithful the Faithfuls would have wasted for you.
- **The one who is onto them** — whoever pushed their name, whoever the room
  follows.
- **The coalition builder** — high social centrality.
- **The frame** — murder the ally of the person you want suspected.
- **Never someone you visibly clashed with** — the room connects it that morning.
- **Avoid a signature** — not "is this kill suspicious" but "do all six kills
  benefit the same person?" Also a deduction source: a high-`mental` Faithful
  should be able to ask who has profited from every murder.
- **Not someone due to be banished tomorrow** — wasted.
- **Self-murder as cover** — real and documented (Thijs Zeeman, shielded; caught
  and banished). Rare, high-risk, once-a-season.
- **A large share of murders are effectively random.** The format's own record
  says so. This licenses a real noise term. Do not over-optimise, or every season
  reads like a chess engine.

### 6.4 Consequences of a wrong target

Each mistake has its own distinct downstream cost:

| Mistake | Cost |
|---|---|
| Killed someone due to be banished | Wasted; the table must now hunt properly |
| Killed a **suspicious** Faithful | Own decoy destroyed; votes have nowhere safe to land |
| Killed someone who clashed with Traitor X | X takes suspicion directly |
| Killed someone who had been defending X | X loses cover and does not realise until the next table |
| Killed an ally to frame someone | Works, until the pattern becomes a signature |

**The loser of the argument remembers.** By episode 8 there is not a set of three
Traitors but a faction with a history, and the endgame betrayal has a date
attached. The causal chain — a stat, a bad preference, an argument won wrongly, a
murder that points at an ally, the ally banished, the survivor blamed by an
audience that watched all four steps — is what the dramatic-irony VP exists for.

### 6.5 The blocked murder is a public information event

Nobody dies; every chair is full at breakfast. The room learns the Traitors tried
and hit a Shield, which narrows who they wanted, confirms a Shield was live, and
hands high-`mental` players a counting argument. One of the best deduction
sources in the format, free, and easy to forget to fire.

### 6.6 Recruitment

Available the night after a Traitor is banished. Murder **or** recruit; if they
recruit, nobody dies regardless of the answer.

Acceptance, all proportional: `loyalty` → refuse; `boldness` and `strategic` →
accept; bond with the recruiter → accept; **position** (someone accused at last
night's table accepts, someone safe refuses); archetype leans (hero and
loyal-soldier refuse, villain, schemer and mastermind accept).

**Two delivery modes, differing mechanically:**

- **By note** — anonymous. Refusal is survivable; the refuser never learned who
  asked. They do, however, now know a recruitment happened, which is information
  the room lacks.
- **The Ultimatum** — face-to-face, only with one Traitor left. Accept or be
  murdered on the spot, and the reason that rule exists is that **they have seen
  your face.** Refusal must be fatal.

**Recruitment is a decision with a tail**, scored across the rest of the season:
did they hold the line or leak a tell within two rounds; did they bring their own
bonds, so their allies now unwittingly protect a Traitor; and the blowup case — a
recruit banished soon after may burn their recruiter on the way out. The
recruiting Traitor's fate is therefore linked to the recruit's via a
`loyaltyDebt` thread that pays or detonates.

### 6.7 The exit blowup is general, not special-cased

Big Brother already generates exit blowups from the leaver's beliefs, with
conviction as headroom (`bb/jury-house.js`). The same machine runs here: a
banished player's speech comes from what they believe, and whether they burn
someone runs off `loyalty` × time-served × conviction.

The recruit case then falls out on its own — someone recruited two nights ago has
almost no loyalty to the Traitors, so burn probability is naturally high, while a
Traitor of nine rounds' standing goes quietly. Rare in practice, never
special-cased, and able to surprise in configurations nobody anticipated.
Requires §5.4's rare-state amplification or it will never be seen.

## 7. The round, missions and powers

### 7.1 `round.js`

Orchestrates §5.6: beats fixed, windows variable. First round has **no
banishment** (per format) so the Traitors get one night to become a faction
before the hunt starts.

### 7.2 Missions and the pot

Missions grant **money to a shared pot**, never immunity. The pot has a ceiling
and seasons are expected to fail to max it. The strategic sting is structural: a
Faithful who grinds all season may be building the pot for the Traitors.

Missions are team-based, score by team performance, and carry side objectives
(§7.3). At least one mission archetype must make **knowledge the currency** (the
Chess mission) so evidence source 4 has something to read.

### 7.3 Powers

- **Shield** — blocks the next murder only. **Never** protects from banishment.
  Expires unused, non-transferable. Won **in missions**, semi-visibly. The
  **Armoury is not rebuilt**: its silence-pact metagame is the known-degenerate
  strategy that got it removed from the real show. Mission-won Shields give the
  right trade-off — safe tonight, target tomorrow.
- **Dagger** — doubles your vote at the next banishment. Historically decides
  seasons by breaking 3-3 endgame deadlocks.
- **Seer** — once per game, endgame only. A private meeting in which one player
  must truthfully confirm their alignment to you. **Only the Seer sees it**, and
  both parties may lie about what happened afterwards. Mechanically this is the
  one `observed`-credibility alignment belief in the game, and it should be the
  only one.

### 7.4 Murder variants

Standard; On Trial / Death List; Murder in Plain Sight (poisoned drink, kiss on
the cheek, or a hug at a dinner party — no conclave); Face-to-Face (chapel
pleas); the Dungeon; double murder; Traitors forced to name one of their own.
These are the show's twist catalogue and are mutually exclusive per round.

## 8. `tr/endgame.js`

**Banish or End Game.** After the final mandated Round Table each survivor
secretly chooses. **One vote to banish forces another Round Table.** Loop until
unanimous.

Resolution: only Faithfuls remain → they split the pot. Any Traitor remains → the
Traitor or Traitors take all of it and the Faithfuls get nothing.

**No reveals during the endgame.** Players banished in the finale do not reveal
alignment, so survivors continue on nerve alone. This also means
`revealCascade()` is switched off for the endgame, which is what makes the last
two votes feel different from every earlier one.

The prisoner's-dilemma variants are documented history and are **not** built.

## 9. VP

Standing requirement: each part gets its **own visual identity**, per the
overdrive baseline. Not a shared shell with a swapped palette.

### 9.1 The observer contract — the seam for sub-project 2

Every builder takes an observer: `rpBuild*(ep, observer)`, where `observer` is
`'audience'` today and could be `'player:<name>'` later. Three information layers
must be renderable: **what a given player knows**, **what the Faithfuls
collectively believe**, and **what is true**.

Deciding this now is free. Retrofitting it across every screen later is a
rewrite. The deduction engine already answers "what does this person believe", so
the interactive mode is the user occupying one of those slots.

### 9.2 Screens

Title and selection (the blindfold and the tap); breakfast and the empty chair;
the mission; the Round Table (debate, the slates, ballots read one at a time, the
reveal); **the conclave** — the signature screen: cloaks, lantern light, the
shortlist argued aloud, the wax seal on the letter, and the dramatic irony of
watching people plan a death for someone they were laughing with an hour ago;
recruitment; the endgame.

Text backlog is a complete retranscription of every VP narration, per the
existing rule.

## 10. Export, data and the co-winner problem

### 10.1 The per-round shape — resolved

Model the **murder as a ballot cast only by the Traitors**. A round produces one
`votingHistory[]`-shaped record carrying two ballot sets — the public banishment
(everyone) and the private murder (Traitors only) — distinguished by a `channel`
field. No third export shape, no second normaliser, no six branches in
`season_ref.html`. It is also true to the fiction: the conclave is a vote.

### 10.2 Co-winners — an unresolved conflict, flagged

`docs/ADDING-A-SHOW.md` §5 requires `winner { name, playerSlug, vote, runnerUp }`
— singular — and `placements[]` with an ordinal `placement`. **The Traitors has
co-winners**; US3 ended with four splitting the pot, with no ordinal finish
between them and no runner-up in the usual sense. Every page reads these fields.

Proposal: co-winners all take `placement: 1` with `status: 'winner'`; add a
`winners[]` array; populate `winner{}` only where a season genuinely has one (a
lone surviving Traitor, which is common). Then **find every reader that assumes a
single winner and decide each one deliberately** — rankings, leaderboards, career
pages, the wiki lead, D1 `appearances`.

This is real work and gets its own step in the implementation plan. Picking a
"main" winner to dodge it would be inventing a fact and is not acceptable.

### 10.3 Data traps

- Stamp `format` on `seasonDetails[]`. An appearance with no format **is** Total
  Drama, so a Traitors appearance would silently join the Total Drama career of
  whoever shares a slug.
- Register the format before publishing; `POST /api/publish-season` refuses an
  unknown one, deliberately, because two unregistered shows both write
  `td-N-data.json`.
- Keys by prefix: `data/seasons/tr-1-data.json`, `tr_episode_s1_e1`,
  `AI_ANALYTICS_tr-1`, `rankings_tr.json`.

### 10.4 Popularity, audience, fame and rankings

The part most easily got wrong, and it is got wrong by writing code rather than
by omitting it.

**`gs.popularity` is accrued, and must never rank anybody.** It is incremented
every round, so it is dominated by how long somebody lasted — measured on Big
Brother 1 it correlates with FINAL PLACEMENT at **-0.952**. Asking it who was
liked returns who lasted. Every consumer that asked was reading the wrong
thing: both shows' fan-favourite award, the heroes board, the fan-loved tag, the
audience pulse and the social feed's crowd.

**`js/audience.js` is show-agnostic on purpose and Traitors gets it for free.**
It knows only that a show has rounds and eliminates people from them, both read
off `episodeHistory`. **We must not write our own.**

| Want | Use |
|---|---|
| affection generated all season | `gs.popularity[name]` |
| **who was liked more** | `audienceStanding(name)` |
| the cast, best first | `audienceBoard({ eligible })` |
| the award as a vote | `runAudienceVote({ eligible, rng, blocks, scale })` |

Pass `scale` and `blocks` from whatever the show knows about how many people
were watching. The **only** show-specific part is the name:
`words.audienceAward`. If Traitors has no such award, leave the field out and
call nothing — that is a supported answer, not a gap (§14).

**Popularity still has to be written.** Every existing rule applies: any event
that is heroic, villainous, cowardly or selfless moves `gs.popularity`. This
show adds a wrinkle the others do not have — **the audience knows who the
Traitors are.** A Traitor playing brilliantly is *entertaining*, not
*admirable*, and the two should not be the same number. Popularity tracks
affection; it must not silently become a competence score for a villain the
crowd enjoys.

**Fame and the social feed.** `js/fame.js` and the 22 other registry importers
need nothing beyond the entry. The social feed needs **one** `SHOW_WORDS` entry
in `js/social/adapter.js` — per §9 that map is vocabulary and stays where it
is; components never branch, so it is the only file. Follower counts and fame
level then flow from the published season and the audience reading, not from
anything Traitors writes itself.

**Rankings.** `rankings_tr.json`, never `rankings_database.json` — that file
declares itself Total Drama's, and Big Brother 1 was applied into it, producing
seventeen houseguests sitting at ranks 13, 26 and 28 among contestants while
every correct reader refused to display them. A board ranks **one** show,
because the scores are not comparable across shows. `js/ranking-boards.js` owns
the mapping and every reader goes through it; `js/rankings-update.js` (~360)
needs a per-format ranking config. A show with no finished season has no board
and that is not an error — `loadRankingBoards()` skips the 404.

Ranking weights are a real design question for this show, deferred until a
season exists: there are no comp wins to weight. The obvious currency is rounds
survived, correct banishments driven, and whether you finished on the winning
side — but that is a guess until there is data.

## 10.5 The duplication (manual §9)

Thirteen files hold their own copy of the show list. None will error; they will
describe Traitors as Total Drama.

`player.html` (`SHOW_PREFIX` ~681, `NAMES` ~792, `ICONS` ~793, `SHOW_NAMES`
~909/~918, and a literal `['total-drama','big-brother']` ~727) · `js/wiki.js`
(`SHOW_NAMES` ~25) · `js/wiki-view.js` (`SHOW_META` ~28) · `season_ref.html`
(`SHOW_NAMES` ~320) · `current-season.html` (`CS_SHOWS` ~870) · `compare.html`
(`CMP_SHOW_LABEL` ~832) · `franchise.html` (`SHOW_LABEL` ~705) · `js/alumni.js`
(`_SHOW_NAMES` ~106) — **these eight are pure identity and should be collapsed
into `js/shows.js` before we start.** The manual calls it roughly an hour,
mechanical, and it converts eight chances to forget the show into zero.

The other five are per-show **data** and stay where they are: `js/settings.js`
venues, `js/rankings-update.js` weights, `js/quick-setup.js` config scope, and
the two vocabulary maps (`js/social/adapter.js`, `worker/worker-season-live.js`).

## 10.6 Guards that already cover us

By existing in the registry, Traitors inherits: `format-scoped-config`,
`show-switcher`, `season-format`, `wiki`, `ratings`, `ratings-distribution`,
and — most valuable here — **`tests/show-vocabulary.test.js`**, which walks
every registered format, renders an article for a winner *and* an eliminated
player, and fails when a show's output contains another show's words. There is
no list in it to extend.

Its e2e sibling `tests/e2e/show-pages.spec.js` does the same against real site
data. Note its three documented failure modes before trusting a green run: a
fixture that renders only a winner never draws the exit cell; a season with no
round data makes the guard pass over an empty section; and `` `${w}` `` in a
template literal is a backspace character, not a word boundary.

**Given §2.1, our exit cell must be checked for both verbs** — banished and
murdered. A guard that only ever sees a banishment is the empty-section failure
mode wearing a different hat.

## 11. The returnee split

`isReturnee` is **overloaded** and this show breaks it. It drives two orthogonal
things:

1. **Art** — `players.js:180`, swaps to the `<slug>-returnee` portrait.
2. **Reputation** — `franchise-meta.js:505`, `if (!p.isReturnee) continue;` gates
   the entire profile, reputation, instincts and callback build. `cast-ui.js:372`
   warns you to "make sure returnees are marked as returnees."

On Total Drama and Big Brother these coincide, because a returnee comes back to
the same show and is the only person with history worth carrying. On Traitors
**every player has history and nobody is returning to this show.**

**Fix: split them.** `isReturnee` keeps its current meaning (per-season casting
state, correctly reset each season — `cast-ui.js:407`). Add a **derived**
predicate `hasFranchiseHistory(name)`, computed from the appearance ledger (182
players, 279 appearances), and have `franchise-meta.js:505` read that.

Why it matters beyond tidiness: franchise-meta priors are **evidence source 5**.
Without the split, twenty checkboxes must be hand-ticked each season to enable a
system that already knows the answer, and the day one is missed that player
silently walks in with no reputation and no grudges and nothing reports it.

## 12. Guards and audits

- `weight()` and `fire()` agree, per event.
- No event fires without a consequence: evidence, bond/state, or pot/power.
- No dead events across 20 simulated seasons.
- Every generated departure sentence reads the round's **exit channel** (banished
  vs murdered), never the show default.
- Alignment beliefs never reach `observed` credibility except via the Seer.
- Seeded season reproducibility: no bare `Math.random()` in round, plan or
  knowledge code. Use `stableRng`.
- `format` stamped on every exported appearance.
- Faithful win rate and Traitor win rate tracked across a baseline of simulated
  seasons; neither should be degenerate.

## 13. Sequencing

Per `docs/ADDING-A-SHOW.md` §10, and front-loading risk:

Reconciled with the manual's §10 order, which requires that **each step leaves
the site working**, and with our own need to front-load the risk that matters.

1. **Registry entry** (§2). Nothing uses it; the switcher already lists it.
2. **Collapse the eight identity maps** into `js/shows.js` (§10.5) — the manual
   puts this second on purpose: the diff is small while the show is still just a
   registry entry, and the failure mode is obvious.
3. **The returnee split** (§11) — small, and everything downstream reads it.
4. **Config scope, show picker, blueprint, host options** (§2.4), so the show
   can be configured but not run.
5. `gs.tr` state and the runnable flag (§2.3), off.
6. **Deduction vertical slice**: alignment facts and eras, evidence source 1
   (ballots) only, suspicion to ballot, Round Table, reveal cascade. Play it
   headless. **If a Round Table does not produce a believable banishment here,
   nothing else matters** — stop and fix it before building anything else.
7. Murder, conclave, Shields, the blocked-murder event.
8. Recruitment, eras in anger, the exit blowup.
9. The event engine and the castle pool at scale (§5.7).
10. Missions, pot, Dagger, Seer, murder variants. Twist catalog entries (§2.4).
11. Endgame. Dispatch wired in **both** `run-ui.js` places (§2.3); runnable flag on.
12. Export incl. `careerStats` (§2.2), the co-winner decision (§10.2), publish, D1.
13. **Publish one season end to end.** The site now has real data to render.
14. VP and text backlog.
15. Screens (manual §6), driven by that season rather than by imagination.
    Audience/fame/rankings wiring (§10.4) belongs here — it needs a played season.
16. **Ratings signals** (sub-project 3) — only after step 13, and only by
    printing them against a season that really happened.
17. **AI fills last** — the episode-writer prompt is per show and is the only
    step that costs money per run.

## 14. Open questions

- `audienceAward` — what does this show call the prize nobody votes on? Note
  §10.4: omitting it entirely is a supported answer if the format has no such
  award, and is better than inventing one.
- Cast mix: ~90% Total Drama by roster weight today. Left as a casting choice per
  season rather than a rule, but worth a deliberate decision before the first
  season.
- Whether missions produce a per-player score worth exporting to careers, given
  that they grant no immunity and the existing `careerStats` shape is built
  around wins (§2.2).
- **Ranking weights** (§10.4). There are no comp wins to weight on this show.
  Rounds survived, correct banishments driven and finishing on the winning side
  are the obvious currency, but that is a guess until a season exists.

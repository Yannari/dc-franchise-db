# Big Brother — the door, the jury house, and the vote

Design spec, 2026-08-06.

Closes §2 of the Big Brother roadmap ("the jury is seated but barely alive") and
the aftermath gap on eviction night. One feature, because it is one pipe:

```
eviction night  →  juror sentiment  →  finale ballot
```

Everything below flows in that direction. `last-words.js` and `jury-house.js`
both write sentiment; nothing reads back upstream.

## What exists already

Do not rebuild these.

- `js/bb/jury.js` — owns the jury rule. `juryOpensAt`, `evictionSeatsAJuror`,
  `jurorOrdinalFor`, `seatedJurors({upToWeek})`, `isSeatedJuror`, `juryLines`.
- `js/bb/knowledge.js` — beliefs. `believedVoters`, `believesDeal`,
  `believesTarget`, `believedHunters`, `recordBBFalseClaim`, `bbContacts`,
  `reconcileBBJury(jury, {week, rng})`.
- `js/vp-screens.js:20081` `rpBuildBBEviction` — the eviction stage: chairs,
  live tally, front door, final pleas, per-ballot reasons, tie-break, goodbyes,
  deal-breaks, social beats. **The roadmap line calling this screen "thin" is
  stale.** It needs a new step, not a rewrite.
- `js/bb-aftermath.js` `generateBBEvictionInterview` — exit interview with host
  voices, the "what you never saw" truth reveal, goodbye messages and per-message
  reactions. The goodbye messages already render; they simply change nothing.
- `js/episode.js:750` `checkTribalBlowup` — Total Drama's blowup. **Reference,
  not a dependency.** BB's version reads beliefs instead of real state.

## Non-negotiables carried in

- **Proportionality everywhere.** `value * factor`, never `if (stat >= X)` for
  gameplay. Thresholds appear only to select narrative text.
- **Archetype amplification, not archetype gating.** Archetype multiplies terms
  in a continuous score. The one hard rule stays hard: nice archetypes never
  scheme, so they never knowingly fabricate an accusation — they can still be
  wrong, because their beliefs can be wrong.
- **Seeded RNG.** `stableRng` only. A bare `Math.random` in this code breaks the
  seeded-season replay guards.
- **No per-week roster copies in state.** Sentiment is a small authored record
  with a capped log, not a snapshot written every week.
- **Both transcript writers.** Shared line-builders live in the leaf modules so
  `bb-run.js` `summariseWeek` and `text-backlog.js` cannot disagree.

## Modules

| File | Owns | Depends on |
|---|---|---|
| `js/bb/last-words.js` | Exit blowup: trigger, content, per-listener belief, consequences | knowledge, bonds, players, jury-sentiment |
| `js/bb/jury-house.js` | Interlude: arrivals, acts, roundtable | knowledge, jury, bonds, jury-sentiment |
| `js/bb/jury-sentiment.js` | Per-juror read of each active player; sole writer | core, bonds, players |
| `js/vp-bb-jury-house.js` | The jury house screen | vp helpers |

`jury-sentiment.js` is a leaf. It exposes `seedJurorReads(name, week)`,
`readOf(juror, player)`, `moveRead(juror, player, {strength, credibility, kind,
week, text})` and `sentimentAdjustment(juror, finalists)`. Callers never write
`gs.bb.jurySentiment` directly.

### State

```js
gs.bb.jurySentiment = {
  [jurorName]: {
    reads: { [playerName]: number },     // signed conviction, unbounded in principle
    log:   [ { week, kind, player, delta, text } ],  // capped, most recent kept
  }
}
```

Derived on demand where possible; `reads` is genuinely authored (it accumulates
from events that happened) and cannot be recomputed, so it is stored. The log is
capped so a long season cannot grow it without bound.

## 1. Last words at the door

`checkBBLastWords(week)` runs in `bb-run.js` between the verdict and the door
opening. It appends `{ kind: 'lastwords' }` to the eviction steps array,
immediately before `{ kind: 'door' }`, in both the single-eviction and the
double/split paths.

### Trigger

Continuous. No disposition cutoff.

```
blindside   = clamp01(|expected - actual| / ballots.length)   // how wrong their count was
disposition = boldness/10 * 0.6 + (10 - temperament)/10 * 0.6
chance      = disposition * blindside * archetypeRate + noise
```

`expected` already exists on the interview record (the "walked into the night
counting N votes" line). `archetypeRate` amplifies:

| Archetype | Rate | Register |
|---|---|---|
| villain, mastermind, schemer | high | strategic — dumps deals and alliances to wreck the game they are leaving. May knowingly fabricate. |
| hothead, chaos-agent | high | emotional detonation; loudest, least accurate |
| perceptive-player | low | rare, and accurate — their beliefs are better, so what they name is usually true |
| hero, loyal-soldier, underdog | medium | principle — betrayal, broken word. Never fabricates; can still be wrong. |
| social-butterfly, showmancer | medium | personal, not tactical |
| goat, floater | low | self-pity rather than accusation; little strategic damage |

Register selection is narrative text only. Whether the boldness term or the
temperament term dominated picks controlled-callout vs. explosion phrasing.

### What gets said

Reveal content is drawn from the evictee's **beliefs**, never from real state.
A clean blindside therefore produces a confident accusation aimed at the wrong
person, which protects the real architect — the correct reward for running a
tight vote.

| Reveal | Source | Note |
|---|---|---|
| Organizer callout | `believedVoters(evictee, evictee)` | who they think ran it |
| Alliance dump | believed blocs | the bloc may be defunct, or may never have existed |
| Deal dump | `believesDeal` | most damaging — the house can check it |
| Power callout | `believedHunters` | accuses someone of sitting on a hidden power |
| Personal | bonds | temperament-driven; damage without strategy |

Villain archetypes may fabricate: a reveal whose content is chosen for damage
rather than belief. Nice archetypes draw only from belief.

### Belief resolves per listener

There is no global "does the house believe it" roll. Each remaining houseguest
resolves it separately:

```
belief = trustIn(listener, accuser) * accuserCredibility * archAccuserFactor
       - bond(listener, accused) * loyaltyWeight * archLoyaltyFactor
       + priorSuspicion(listener, accused)
       + noise(2.5)
```

- `trustIn` from the bond, `accuserCredibility` from social plus their record of
  having been right before, `priorSuspicion` straight from `knowledge.js`.
- `archAccuserFactor`: a `perceptive-player` listener damps a poorly-supported
  claim and amplifies a well-supported one; a `schemer` discounts everyone but
  will weaponise anything useful regardless of belief.
- `archLoyaltyFactor`: a `loyal-soldier` amplifies the bond term and defends
  harder.

Consequences scale off the score itself. The bands below are **narrative labels
for text selection only** — no listener receives a different *kind* of outcome
because they crossed a line.

| Position | Label | Consequence (scaled by |belief|) |
|---|---|---|
| Distrusts accuser, close to accused | dismissed | bond with accused rises (defending them); accuser marked unreliable in this listener's model. If the claim later proves true, this listener carries the cost of having waved it off. |
| Trusts accuser, no read on accused | doubt planted | soft suspicion entry in `knowledge.js`; changes how they read the accused's next move |
| Trusts both | conflicted | suspicion of the accused *and* strain with the accuser; does not resolve on the night — fires a follow-up beat later, or resolves in the jury house |
| Distrusts both, or already suspected | confirmed | hardens into belief; feeds targeting — this listener pushes the accused as next week's target |

"Conflicted" is not a fifth state. It is what the formula produces when both
terms are large; the strain on both relationships scales with how close the
fight was.

If the accusation was false, `recordBBFalseClaim` logs it and the falsely
accused player gains a grievance the transcript can pay off later.

### The accused's response

The accused may deny, deflect, or — if the claim is true and their boldness is
high — own it. The response applies a further proportional shift, weighted
toward listeners whose belief landed near zero, since those are the ones still
looking for a reason to land somewhere.

### It follows them out

The blowup is recorded on the evictee. Whatever they said at the door becomes
their opening position in the jury house, and the room's split reaction is
carried too — jurors who dismissed it argue against it at the roundtable,
jurors left conflicted are the ones a finalist can still win back.

## 2. The jury house

`generateBBJuryHouse(week)` runs after the eviction once `juryOpensAt` has
passed. Residents come from `seatedJurors({ upToWeek: week })` — never a running
`gs.jury`.

### Cadence

- **Every week** the jury is open: a short arrival act. The new juror walks in
  carrying their version of the week, including their blowup if there was one.
  `reconcileBBJury()` runs here: arriving beliefs meet resident beliefs and both
  sides update. Whether a correction takes scales with the corrector's
  credibility *to that specific juror* — the same machinery as the door.
- **Every third week, and always the week before finale night**: the full
  four-act interlude.

### The four acts

1. **The Door Opens** — arrivals since the last full interlude.
2. **The Long Week** — jury-house life: grudges hashed out, dead alliances
   given a funeral, jurors relitigating their own eviction. Beats are
   distributed so no resident goes silent across consecutive interludes.
3. **The Roundtable** — the centerpiece. For each player still in the house, one
   juror argues for and one argues against. The arguer is chosen by **what they
   believe**, not by bond alone, and every argument must cite something that
   juror witnessed or was told. A juror blindsided in week four cannot litigate
   the week-four flip until somebody tells them about it.
4. **Before Finale Night** — where the reads have landed, plus the teaser.

Villains and masterminds actively lobby other jurors between acts — a scheme,
so villain archetypes freely, neutral archetypes proportionally
(`strategic/10 * (10-loyalty)/10`), nice archetypes never. Lobbying moves the
target juror's read proportionally to the lobbyist's credibility with them.

The load-bearing rule: **jurors argue from beliefs, and beliefs can be wrong.**
A finalist can lose a vote for a move they did not make, and can win one because
the jury credits them with a move that was somebody else's.

## 3. Sentiment and the ballot

Reads are seeded when a juror is evicted, from material that already exists:
bond, whether that player voted them out, whether a deal with them was broken,
respect for their game.

Movement uses conviction as headroom rather than a lock:

```
delta = headroom(conviction) * eventStrength * credibility * archFactor
headroom(c) = 1 / (1 + |c| * k)
```

As a read hardens in either direction the headroom shrinks, so a bitter juror
drifts less and less and ends up effectively locked with no threshold saying so,
while an unusually strong event can still budge them slightly. Toss-ups have
maximum headroom, which is where the season should be decided. `archFactor`
widens headroom for `chaos-agent` and `wildcard`, narrows it for
`loyal-soldier`.

Inputs that move a read:

- **Goodbye messages** — finally mechanical. A smug message costs the sender,
  scaled by how that juror rates them. Drawn from the messages already generated
  in `generateBBEvictionInterview`.
- **Roundtable arguments** — scaled by the arguer's credibility with the listener.
- **Arrivals** correcting or confirming a story.
- **Lobbying** by villain and qualifying neutral archetypes.
- The finalist's ongoing game, which the jury watches.

### Finale hookup

`simulateJuryVote` in `js/finale.js:2529` is shared with Total Drama. It gains
an **optional** per-juror adjustment parameter defaulting to zero, so TD's
output is bit-identical when it is absent. `bb-finale.js` passes
`sentimentAdjustment(juror, finalists)`. The ballot then reads what the season
accumulated instead of recomputing from stats alone.

## 4. Presentation

### Jury house screen — `js/vp-bb-jury-house.js`

Its own visual identity. The jury house is a lodge; it must not reuse the
eviction stage's visual language, the Big Brother house's, or another BB
screen's. Requirements:

- Unique CSS prefix, own palette and font pairing, `max-width:1100px` shell.
- Click-to-reveal per act via `_tvState`, keyed per week. DOM-only updates
  through `_reapplyVisibility` — never rebuild the page on reveal.
- Sticky reveal controls with a live counter; `scrollIntoView` on the revealed
  card.
- **Live sidebar**: each juror's read of each remaining player, rebuilt on every
  reveal from both `revealNext` and `revealAll`, gated by `_tvState` so it never
  shows ahead of the narration.
- The Roundtable gets centerpiece treatment distinct from the other acts.
- `@media (prefers-reduced-motion: reduce)` fallback on all animation.

### Eviction screen

The blowup renders as a new `lastwords` step inside `rpBuildBBEviction`, before
the door opens, showing the room's split reaction — who scoffed, who went quiet,
who looked at the accused. The audience is the only party that knows whether the
accusation was true, and the screen should let that land.

### Transcripts

Jury house acts and the blowup appear in both transcript writers, via shared
builders exported from `last-words.js` and `jury-house.js`.

## 5. Tests

- One blowup yields different outcomes for different listeners given different
  trust and bond positions.
- A false accusation from a trusted accuser does more damage than a true one
  from a distrusted accuser.
- Archetype amplification shifts blowup rate and belief measurably across a
  population without any archetype being categorically unable to reach an
  outcome — except the hard rule: nice archetypes never fabricate.
- Nice archetypes can still deliver a *wrong* accusation drawn from a wrong
  belief.
- A wrong accusation that is never corrected costs a finalist a jury vote.
- A correction in the jury house repairs the read proportionally to the
  corrector's credibility.
- Headroom shrinks with conviction: a hardened juror moves less than a toss-up
  given an identical event.
- `simulateJuryVote` output is unchanged when the adjustment is absent (Total
  Drama regression).
- A seeded season replays identically — no bare `Math.random` anywhere in the
  new modules.
- Jury house acts appear in both transcripts.
- The jury house VP screen renders for a season that reaches jury (render sweep,
  per the guards-need-denylists lesson — assert the screen exists, do not trust
  an allowlist).

## Out of scope

Jury questions and finalist speeches at the finale with bounded vote movement.
They belong to the same system and should reuse `jury-sentiment.js`, but they
are finale-night work and this spec is already large.

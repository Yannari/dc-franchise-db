# The Coaches Twist — Design

## Purpose

A Total Drama season in which each tribe carries one to three **coaches**:
franchise winners and finalists who advise, train and manipulate, but do not
compete. Their tribes are made of vets who underperformed and of newbies. A
coach's goal is to survive to the merge, where they finally become a full
player.

The twist exists to create a kind of player the engine has never had: someone
with real influence and no ballot, whose danger is proportional to how well
they coached and whose vulnerability is proportional to how unevenly they did
it. Coaching well makes you valuable and makes enemies at the same time.

Big Brother 14 ran a version of this. Its coaches could not be nominated at
all, which kept them safe and inert; the twist ended when a button reset the
game and put them in as players. Ours makes them votable and pays for it with
mechanics, because the vote is where the drama is.

## The Central Problem, and the Answer

A coach does not compete. Tribe scores in this engine are averages per member,
never sums, so a non-competing coach does not drag the average down. Keeping
coaches is competitively free.

That makes a coach the cheapest possible vote: booting one costs the tribe
nothing at the next challenge and spares a contestant who actually scores. Left
alone, every tribe boots its coaches in order the first time it loses, and the
twist is over before the merge it is built around.

Two mechanics answer it, and they answer it from opposite directions:

1. **Voting out a coach destroys the training they banked.** The `+2.1
   endurance` spread across three contestants leaves with him. A coach who did
   his job is expensive to cut.
2. **Favouritism supplies the reason to pay anyway.** A coach with a fixed
   budget of attention must neglect somebody, and the neglected assemble the
   coalition that removes him.

Together: good coaching is what makes a coach worth keeping, and uneven
coaching is what gets him killed. Both halves are his own doing.

Threat level and a tight contestant bloc point at the same vote for different
reasons, so the same elimination reads three ways — cutting a threat, closing
ranks, or punishing favouritism.

## Architecture

### Two lists, and the split falls on the rules

The engine keeps two separate collections and the twist lands exactly on the
seam between them:

- **`players`** — the cast record, read by `pStats()`, `pronouns()`, archetype
  lookups and `romanticCompat()`. **Coaches are in here.** They are complete
  people the engine can reason about.
- **`gs.activePlayers`** — the names still in the game. **135 modules read
  this list.** It is what grants eligibility for challenges, ballots, immunity,
  jury and placements. **Coaches are not in here until promotion.**

Compare that against what a coach does not do: does not compete, does not vote,
cannot hold immunity, is not on the jury, does not take a placement. That list
is almost exactly what membership in `gs.activePlayers` confers. Being outside
the roster is not a workaround for the twist — it is the twist, expressed in
the one place the engine already understands.

The alternative — putting coaches in `activePlayers` behind an `isCoach` flag —
was rejected. It would require teaching 135 modules to exclude them, and every
one missed is a coach silently competing, appearing at a tribal they should not
attend, or taking a placement. This repository has shipped that bug class
before.

Promotion at the merge is therefore one line: push into `activePlayers`, and
135 modules begin treating them as players without being told.

### State

```js
gs.coaches = [{
  name,               // also present in `players`
  tribe,              // which tribe they advise
  saveCard: 'unused' | 'used',
  promoted: false,
  sessionsPerEp: 2,   // scales with tribe size — see Attention
}]

// Banked training, keyed by COACH FIRST.
gs.coachTraining = { [coachName]: { [contestant]: { endurance: 1.2, … } } }
```

Keying by coach is forced by the revocation rule. Rescue Island stores
`gs.riTraining[player][stat]`, which cannot answer "what did *this* coach
build?" Coach-first means voting one out is a single delete, a contestant's
bonus is the sum across whichever coaches still stand, and two coaches on one
tribe are individually accountable.

Bonds need no new storage. `getBond` / `addBond` are name-keyed and symmetric,
so coach↔contestant bonds work untouched — which matters, because resentment is
built out of them rather than out of a new stat.

## Attention

Each coach receives a fixed budget of **sessions** per episode — two at a tribe
of six, scaling with tribe size so that somebody is always left out. Scarcity is
the point: a budget that covers everyone produces no resentment and no twist.

### What a session teaches

The discipline comes from the **coach's own stats**. You teach what you are good
at. All nine have a coaching form:

| stat | the session |
|---|---|
| physical | drills |
| endurance | conditioning; holding on past the point it hurts |
| mental | puzzles and memory work |
| social | how to work a camp |
| strategic | how to read where a vote is going |
| intuition | how to spot a lie |
| boldness | how to make the big move anyway |
| loyalty | how to hold a deal — or how to break one cleanly |
| temperament | how not to detonate |

### A bad coach teaches badly

```
gain = (coachStat − 5) × bondFactor × noise(2.5)
```

Below five, the gain is **negative**. A temperament-2 coach running temperament
sessions teaches a contestant to detonate; a loyalty-1 coach teaches them to
burn deals. This is proportional throughout, per the project's rule that stats
scale rather than trip thresholds.

Negative coaching is not a smaller bonus, it is damage — and the tribe often
cannot tell until the challenge. It is also the cleanest possible expression of
"an accomplished player is not automatically a good teacher".

Per-contestant totals cap the way `RI_TRAINING_CAP` caps, at 3.0 across all
stats and all coaches combined.

### Who a coach picks

Every contestant on the tribe is scored, and the top scorers take the sessions.
Weighted, never thresholded:

```
score = wGain    × marginal gain      (how much this person would actually improve)
      + wSwing   × vote influence     (social + strategic, alliance size, perceived bonds)
      + wBond    × existing bond
      + wSalvage × how at-risk they are
```

Archetype sets the weights, and all fifteen behave differently:

| archetype | targets |
|---|---|
| challenge-beast | biggest marginal gain to the tribe average |
| mastermind | vote-swingers; re-targets the moment the vote shifts |
| schemer | whoever is cheapest to buy — weak bonds elsewhere |
| villain | the rival coach's protégé, deliberately |
| hero | whoever is struggling or on the block |
| loyal-soldier | the same contestant every episode, to a fault |
| social-butterfly | spreads thin; the widest, shallowest net |
| perceptive-player | whoever the room is drifting toward |
| showmancer | whoever they have chemistry with, gated by `romanticCompat` |
| underdog | the other person nobody is helping |
| goat | whoever is most likely to keep them; pure survival |
| floater | whoever won last; follows momentum |
| hothead | whoever impressed or annoyed them most recently |
| chaos-agent | deliberately uneven, to create the resentment |
| wildcard | genuinely random, re-rolled each episode |

Goat, floater, hothead and wildcard are not optimising at all. They are bad
coaches in a way that has nothing to do with their stats, which keeps "who is
a good coach" from collapsing into "who has high numbers".

### The drift toward self-preservation

**`wSwing` rises as a coach becomes more vulnerable** — as their tribe keeps
losing, as the merge nears, as their bonds thin. A coach begins by coaching
honestly and ends by buying votes, and the audience watches the change without
being told about it. The same coach therefore produces a different season
depending on how it goes, rather than replaying their archetype.

### Poaching

Whether a coach trains a rival coach's protégé follows the project's existing
archetype behaviour rules exactly:

- villain, mastermind, schemer — poach freely
- hero, loyal-soldier, social-butterfly, showmancer, underdog, goat — never
- the neutrals — only at strategic ≥ 6 **and** loyalty ≤ 4

Contestants may take training from more than one coach. Coaches are not
assigned exclusive sub-groups; they share the tribe and compete for influence.
A contestant neglected by one coach is a contestant being courted by the other.

### Resentment is not a new stat

Training someone raises that coach↔contestant bond. Being passed over lowers it
slightly. That is the whole mechanism.

The alliance and voting code already consults `getPerceivedBond` when choosing
targets and forming blocs, so a coach who spends four episodes on two
favourites has — through machinery that already exists — built two strong bonds
and one weak one, and the weak one drifts toward the people who will vote him
out. The coalition assembles itself.

## Advantages: One Law

> **A coach's power always has a target other than the coach.**

You do not play; you make others play. Anything self-directed is inert in their
hands, though still holdable. The law needs no list — new advantages sort
themselves the day they are added:

| advantage | in a coach's hands |
|---|---|
| Idol | inert; holdable, and givable at a cost |
| Legacy | inert; banks to the merge |
| Amulet | inert for them; givable |
| Extra Vote | dead — they do not vote |
| Vote Steal | dead — it grants the vote to its user |
| **Vote Stopper** | **dead** — see below |
| Knowledge is Power | **live** — it takes from someone else |
| Fake Idol | **live** — it is planted on someone else |

**Vote Stopper is deliberately dead despite being other-directed.** "Coaches
never touch the ballot" is a cleaner promise than the targeting rule, and a
coach reaching invisibly into a pre-merge vote makes the vote unreadable in a
game where reading the vote is the sport.

### Giving an advantage away

A coach may hand a found advantage to one of their contestants, and **it costs
them their save card**. Handing your idol to a favourite means surrendering the
protection that keeps you alive — a genuinely hard choice, and exactly the sort
of thing a finalist agonises over on camera.

An advantage a coach keeps becomes playable the moment they are promoted, so a
surviving coach arrives at the merge already armed. "Let the coach live" is a
decision with a delayed cost the tribe can see coming.

### Coach-only advantages

Findable only by coaches, and other-directed by construction:

- **Team Switch** — moves one contestant between tribes. Cannot target a coach.
  (Your phrasing, "switch team with a coach", could also mean the coach swaps
  tribes themselves. Read as moving a contestant, since a coach relocating
  abandons the banked training that is their whole leverage. See Open
  Decisions.)
- **The Loan** — hand a protégé a banked stat bonus for one challenge, then
  take it back.
- **Second Opinion** — see the tribe's current vote lean once, without acting.

## The Vote

Coaches never cast a ballot. They can be voted out.

That boundary — eligible as a **target**, never as a **caster** — is the same
rule as Vote Stopper's, stated twice, and it is the one place the separate-list
architecture needs deliberate work: the ballot must offer coaches as targets
while drawing voters only from `gs.activePlayers`.

### Attendance

Coaches attend tribal council and do not vote. Being removed while sitting
there watching is the scene; elimination in absentia is not.

### The Save Card

**One per coach**, playable only with **unanimous agreement from every
contestant on the tribe**. It protects that coach and eliminates someone else
on their tribe instead.

Your draft said one card *per team*. Made per coach here because the two
interact badly otherwise: a shared card means one coach can spend the tribe's
only protection — or burn it by giving an advantage away — and leave a rival
coach defenceless through no act of their own. Per coach keeps every card the
consequence of its own holder's choices. Reversible; see Open Decisions.

**The coach names the replacement.** The tribe agrees to save him; he chooses
who dies for it. That turns the card from protection into a poisoned gift and
guarantees it produces the next resentment rather than resolving the current
one.

Unanimity is the difficulty dial for the whole twist. A tribe that cannot agree
generates argument and loses its coach anyway.

## The Challenge

Coaches do not compete, and without care they vanish from a third of every
episode — the centrepiece.

Two things keep them present, neither of which is a new mechanic:

1. **The training bonus is surfaced at the moment it matters.** When a
   contestant's banked bonus decides a beat, the challenge VP names the coach
   who built it. The mechanic already exists; only its visibility is new.
2. **A pre-challenge read.** A coach may spend a session on a read targeting a
   discipline. Correct, and their protégés carry a small edge into it; wrong,
   and the session is wasted — a gamble on guessing the challenge.

A protégé's win or choke fires a reaction beat naming their coach.

## Coach Elimination

The mechanical cost is revocation: `gs.coachTraining[coach]` is deleted and
every contestant's bonus drops accordingly, immediately and visibly.

The rest is fallout, and it is the twist's largest emotional beat:

- Each protégé reacts, scaled by bond. A strong bond produces grief or fury; a
  weak one, relief.
- A protégé who voted against their own coach carries it — heat, and a camp
  event when it surfaces.
- The surviving rival coach may absorb orphaned protégés, subject to the
  poaching rules.

## Promotion at the Merge

A surviving coach is pushed into `gs.activePlayers` and becomes a full player.

- **Bonds persist.** They are name-keyed and were never coach-specific.
- **Training they gave stays given.** It was theirs to give, not to hold.
- **They have trained nobody on themselves.** A coach arrives at the merge with
  their original stats and no banked bonus — a real weakness balancing their
  reputation.
- **Banked advantages become playable.**
- **Reputation spikes.** `js/franchise-meta.js` already tracks returnee
  reputation and grudges, so "this coach won Season 9 and blindsided my ally"
  is data that exists.

### The coaching stake

A coach who coached well should arrive stronger. At promotion, a coach receives
a bonus to their own stats proportional to how their protégés fared — surviving
protégés and their placements — capped as training is capped.

This closes the system: coaching well is no longer only a way to stay alive, it
is how a coach arrives at the merge sharp. It also gives coaches a reason to
coach *effectively* rather than merely loyally, which is the incentive BB14
bought with prize money.

## Coach Against Coach

Two accomplished finalists in one camp, neither able to vote, competing for the
same pool of loyalty. They need a channel beyond poaching:

- **Non-aggression** — neither poaches the other's protégés.
- **Trade** — swap influence over a contestant.
- **The fall** — agree which of them takes the next vote, in exchange for the
  survivor protecting the other's protégés.

Where the existing deals and alliance machinery can carry this, it should,
rather than growing a parallel system.

## Presentation

### The Coaches' Board — a dedicated VP screen

Coaching is not dumped into camp events. It gets its own screen, in the
project's overdrive baseline: unique CSS prefix, its own fonts and palette, a
playbook and chalkboard world of drawn plays and hand-marked stat columns,
click-to-reveal, no emoji, `@media(prefers-reduced-motion:reduce)` throughout.

The live sidebar carries the tribe's stat board updating per session, each
coach's banked total, and their standing with every contestant — gated by
`_tvState` so it never spoils ahead.

### Camp events are the fallout

The board shows the session; camp events are what it caused.

- **positive** — a breakthrough, a bond formed, a contestant defending their
  coach unprompted
- **negative** — the passed-over contestant noticing, two protégés comparing
  notes, a poached protégé caught between coaches, bad advice detonating at the
  vote

Each carries `players[]` and an explicit badge, and each has a real
consequence — bond, state or information — per the project's rule that no camp
event is cosmetic.

### Text backlog

A complete retranscription of the board's narration, placed before
`_textCampPost` in `generateSummaryText()`.

### Vocabulary

Every generated sentence takes its words from the Total Drama registry entry:
*contestants*, *voted out*, *Episode*, *challenge*. No Big Brother vocabulary
reaches this twist, and nothing here may print a nomination or an eviction.

## Open Decisions

Resolved by recommendation rather than by question. Each is a candidate for
reversal on review:

1. The coach names the replacement when the save card is played.
2. Vote Stopper is dead in a coach's hands despite being other-directed.
3. Giving away an advantage costs the save card.
4. Coaches attend tribal council without voting.
5. Promotion grants a stat bonus proportional to protégé performance.
6. Sessions scale with tribe size; two at a tribe of six.
7. The save card is one **per coach**, not one per tribe as drafted — so that
   one coach cannot spend or burn another's protection.
8. Team Switch moves a contestant, not the coach.

## Out of Scope

- Coaches competing in a coaches-only challenge. BB14 had one; it duplicates
  the challenge system for people defined by not competing.
- A coach prize separate from the game's own placement.
- Applying the twist to Big Brother. The show registry would carry it, but the
  vocabulary, the ballot and the merge equivalent are a separate design.

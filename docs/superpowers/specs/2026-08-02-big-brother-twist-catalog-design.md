# Big Brother Twist Catalog and Scheduling Design

**Status:** approved direction; implementation backlog  
**Date:** 2026-08-02  
**Owner:** Claude implements mechanics, tests, VP, transcript and setup integration. Codex may audit architecture and writing.  
**Scope:** Big Brother only. Do not change `js/episode.js` or the behavior of Total Drama.

## Decision

Resolve the week's twist and mode state **before** selecting competitions.

```text
season modes + scheduled twists
    -> construct this week's acts and competition slots
    -> select an eligible specific competition for each slot
    -> simulate the acts in chronological order
    -> apply consequences, knowledge, memories, heat and narration
```

A specific HOH, veto or arena game is a **competition definition**, not a twist.
A twist changes the weekly structure, eligibility, authority, secrecy, safety,
nominees, ballots or eviction result. A twist may add, remove or force a
competition slot, but it does not own the competition implementation.

This is the multi-slot Big Brother equivalent of Total Drama's handcrafted
challenge dispatcher:

```text
Total Drama: one challenge slot -> one selected challenge
Big Brother: HOH slot + veto slot + optional safety/arena/power slots
```

## Existing implementation

Already playable:

| id/config | layer | current behavior |
|---|---|---|
| `bb-double-eviction` | scheduled twist | Runs a second compressed cycle in the episode. |
| `bb-instant-eviction` | scheduled twist | Accelerates the week and skips the veto. |
| `bb-have-nots` / `bbHaveNots` | recurring condition | Selects Have-Nots and enables slop/house-life consequences. |
| `bbSafetyMode: block-buster` | season mode | Three nominees compete for live safety until the configured stop point. |
| `bbSafetyMode: ai-arena` | legacy-compatible mode | Same engine shape as Block Buster, retained as a distinct themed/config identity. |

Do not rewrite these merely to place them in a new file. Migrate only when a
shared contract makes the existing behavior simpler and the regression suite
proves that the resulting seasons are unchanged.

## Layers

### 1. Season modes

Configured in setup and active for multiple weeks. They have a start week,
stop rule and compatibility rules. They do not occupy a scheduled-twist slot.

### 2. Scheduled twists

Placed on a specific week by the format designer. They normally affect one
week or one eviction, although a power earned that week may expire later.

### 3. Power distributions

App Store, High Roller's Room, Whacktivity, Care Packages and similar themes
are distribution wrappers. Their prizes are reusable powers. Implement the
power inventory first; wrappers choose how a holder earns one.

### 4. Competition definitions

Specific games live in `js/bb-comps/` and declare compatible slot types such
as `hoh`, `veto`, `arena`, `safety`, `return`, `luxury` or `power`. The twist
layer creates a slot; `js/bb/comps.js` selects and runs its competition.

### 5. House events

Events narrate the reactions: hiding a power, being excluded from a draw,
discovering an invisible HOH, blaming a rogue vote, or campaigning after a
nominee changes. Events never implement the twist itself.

## Reusable twist contract

Do not create a large switch statement with one branch per television name.
Each catalog entry should describe capabilities consumed by the week engine:

```js
{
  id: 'bb-diamond-veto',
  format: 'big-brother',
  layer: 'scheduled', // scheduled | mode | distribution
  category: 'veto-power',
  timing: 'veto-ceremony',
  duration: { weeks: 1 },
  rules: {
    addSlots: [],
    nomineeCount: null,
    vetoCount: 1,
    vetoSecret: false,
    replacementAuthority: 'veto-holder',
    cancelVotes: 0,
    cancelEviction: false,
  },
  eligible(ctx) {},
}
```

Required interception points remain: week opening, HOH eligibility/result,
nomination authority/result, veto draw, veto outcome, replacement choice,
campaign reset, vote eligibility, ballot modification, eviction result,
re-entry and week closing.

Every twist must store both `openingState` and `closingState`. Debug must show
which hook changed what and why.

## Implementation catalog

The list below is intentionally broad but filtered for mechanics that produce
meaningful simulator decisions. Cosmetic themes and branded copies are merged
into reusable families.

### Priority A — foundational one-week twists

Implement these first because together they exercise every important hook.

| id | name | layer | mechanic |
|---|---|---|---|
| `bb-diamond-veto` | Diamond Power of Veto | scheduled/power | Holder saves one nominee and names the replacement. |
| `bb-double-veto` | Double Power of Veto | scheduled/power | A second veto may save another nominee, producing another replacement if used. |
| `bb-secret-veto` | Secret/Black Hole Veto | scheduled/power | Extra veto used anonymously; replacement authority remains configurable. |
| `bb-forced-veto` | Forced/Boomerang Veto | scheduled/power | Holder must use the veto, or may use it twice where the selected variant allows. |
| `bb-coup-detat` | Coup d'état | scheduled/power | Holder removes one or both nominees and names replacements shortly before voting. HOH and veto holder remain protected. |
| `bb-invisible-hoh` | Invisible HOH | scheduled | HOH result and nominations are hidden; knowledge and suspicion track guesses rather than granting omniscience. |
| `bb-co-hoh` | Co-HOH | scheduled | Two winners divide or negotiate nomination authority; disagreement has a deterministic resolution rule. |
| `bb-third-nominee` | Secret Third Nominee | scheduled/power | A holder anonymously adds a third nominee. Unlike arena modes, nobody automatically competes for safety. |
| `bb-dead-last-nominee` | Dead Last Nominee | scheduled | Last place in the stated competition is automatically nominated beside the HOH's choices. **BUILT 2026-08-25** — reserves a chair the way the curse does. |
| `bb-hacker` | Hacker | scheduled/power | Anonymous winner may replace a nominee, choose a veto participant and cancel one eviction vote. Each option is recorded separately. |
| `bb-veto-redraw` | Veto Player Redraw | scheduled/power | Discards selected veto players and performs a valid redraw. |
| `bb-veto-replacement` | Veto Replacement | scheduled/power | An eligible non-player replaces one selected veto participant. |
| `bb-halting-hex` | Halting Hex / No Eviction | scheduled/power | Cancels the eviction before ballots are cast; the week still leaves social and strategic consequences. |
| `bb-rewind-week` | Rewind/Reset Week | scheduled | Restores the week-opening snapshot and reruns the week with new competition outcomes while preserving only public knowledge that the reset occurred. |
| `bb-pandoras-box` | Pandora's Box | scheduled/choice | HOH receives an incomplete clue, accepts or refuses, then gets a private reward paired with a house consequence or the inverse. |

The Diamond Veto changes replacement authority; the ordinary veto does not.
Secret Veto changes knowledge; Double Veto changes veto count. These must be
configuration flags on a shared veto pipeline, not four disconnected ceremony
implementations. Historical veto variants support this separation. [Power of
Veto variants](https://bigbrother.fandom.com/wiki/Power_of_Veto) [Secret Power
of Veto](https://bigbrother.fandom.com/wiki/Secret_Power_of_Veto)

### Priority B — week-structure set pieces

| id | name | layer | mechanic |
|---|---|---|---|
| `bb-triple-eviction` | Triple Eviction | scheduled | Produces three evictions through a documented accelerated structure; never silently removes the bottom three vote-getters. **BUILT 2026-08-25** — two fast-forward cycles, BB22 shape. |
| `bb-split-house` | Split House | scheduled | Splits the cast into isolated groups, each with its own HOH, nominees, veto, campaigning and eviction. Cross-group communication is disabled. |
| `bb-chain-of-safety` | Chain of Safety Eviction | scheduled | Players save one another sequentially; the final unsafe players compete or face an immediate vote according to the chosen variant. **BUILT 2026-08-25** — both BBCan variants + `deStyle: chain` on the double. |
| `bb-backwards-week` | Backwards Week | scheduled | House nominations occur first, veto resolves next, and the final HOH becomes the sole voter rather than selecting the original nominees. **NOT BUILT — see below.** |

> **Backwards Week is a restructure, not a flag.** The twist's premise is that no Head of Household exists until after the veto: the house nominates, the veto plays, and only then is an HOH crowned (excluding the outgoing HOH and both nominees) to cast the sole vote. `simulateBBWeek` reads `hoh` 125 times between crowning and the veto block, spread across ~14 independent subsystems — nomination pricing, broken promises, the crown usurp, the pawn ask, the Cloud, the Coin — each with its own idea of who is safe, who is blamed and who broke a promise. Running that half of the week with no HOH means giving all of them an answer, and the failure mode is wrong attribution: the house resenting somebody who made no decision. Do it as its own piece of work, by lifting the HOH-competition block into a function that can be called at either end of the week.
| `bb-face-to-face-nominations` | Face-to-Face Nominations | scheduled | Nomination choices are made publicly in sequence, immediately changing relationships and knowledge. |
| `bb-premiere-danger` | Premiere Danger / Hit the Road | scheduled | Opening competition or audience result creates an at-risk pool; safety rounds reduce it to the first nominees. |
| `bb-americas-eviction-vote` | Audience Eviction Vote | scheduled | Configurable audience model replaces or supplements house ballots. Popularity drives probability, not certainty. **BUILT 2026-08-25** — BBOTT's extra ballot, on js/audience.js inverted. |

Split House must truly isolate knowledge stores and event pools. Its historical
version ran two simultaneous groups of five with separate HOHs and evictions.
[Big Brother 24 twist summary](https://bigbrother.fandom.com/wiki/Big_Brother_24_%28US%29)

Backwards Week is not reversed narration; it changes who nominates and makes
the eventual HOH the sole eviction voter. [Big Brother Canada 5 twist
summary](https://bigbrother.fandom.com/wiki/Big_Brother_Canada_5)

### Priority C — return formats and eviction insurance

Build all return mechanics over one `returnCandidate`/`returnCompetition`
contract and the existing return precedent, with jury status repaired on
re-entry.

| id | name | layer | mechanic |
|---|---|---|---|
| `bb-battle-back` | Battle Back | scheduled or mode | A configured set of evictees competes; winner returns with defined safety and memory state. |
| `bb-camp-comeback` | Camp Comeback | mode | Early evictees remain physically present but cannot vote, compete normally or receive complete game information; one later returns. |
| `bb-round-trip-ticket` | Round Trip Ticket | hidden power | One secret ticket immediately cancels its holder's eviction. |
| `bb-bonus-life` | Bonus Life | hidden power | Holder chooses an eligible evictee to attempt a return competition; may trigger automatically at expiry. |
| `bb-zombie-week` | Zombie Week | scheduled | Two recent evictees re-enter temporarily while the normal HOH/veto cycle pauses; one earns full return. |
| `bb-power-of-invincibility` | Power of Invincibility | audience/power | Cancels the chosen player's eviction, with strict expiry and eligibility. |

### Priority D — recurring season modes

| id/config | name | default duration | weekly shape |
|---|---|---|---|
| `block-buster` | BB Block Buster | through opening week at 7; off at 6 | Three nominees, veto, live safety competition, vote between two. |
| `ai-arena` | AI Arena | configurable; canonical preset ends earlier | Same engine capability but retained as a distinct season identity/preset. |
| `battle-of-the-block` | Battle of the Block | pre-jury default | Two HOHs nominate two pairs; pairs compete; winning nominees become safe and their HOH is dethroned. |
| `teams` | House Teams/Cliques | configurable pre-jury | Team membership affects safety, competition eligibility and nomination exposure. Individual relationships and ballots remain personal. |
| `dynamic-duos` | Dynamic Duos + Golden Keys | configured stop | Pairs share safety/exposure; surviving nominated partner receives safety but loses competition eligibility until the mode ends. |
| `festie-besties` | Festie Besties | configured stop | Groups are nominated and saved together; survivors join another group rather than receiving a Golden Key. |
| `secret-pairs` | Secret Pairs/X-Factor | reveal/expiry configurable | Pre-existing relationships start privately known to the pair and can be discovered through information flow. |
| `twin-switch` | Twin Switch/Project DNA | success checkpoint | Two roster characters alternate under one public identity; surviving undetected to the checkpoint admits both separately. |
| `coaches` | Coaches | conversion configurable | Coaches begin outside normal eviction eligibility and influence assigned players, then may enter as full players. |
| `camp-director` | Camp Director | premiere only or short mode | One player gains early safety and assigns danger/banishment without becoming the normal HOH. |
| `saboteur` | Saboteur | configurable mission span | Secret role receives missions whose success creates game consequences; discovery is handled through knowledge/suspicion. |
| `americas-player` | America's Player | configurable mission span | Audience-directed missions compete with the player's own strategy; completion affects reward and exposure. |

Dynamic Duos and Festie Besties share a grouping engine but not their survivor
rule. Festie Besties can grow into trios/quartets and nominations operate on
the whole group. [Dynamic Duos](https://bigbrother.fandom.com/wiki/Dynamic_Duos)
[Nominations variations](https://bigbrother.fandom.com/wiki/Nominations)

AI Arena/Block Buster remain modes because they create a recurring third
nominee and safety slot. They are not a single competition and must never be
scheduled as one-week catalog cards.

### Priority E — optional competitions and power economies

These wrappers require a library of reusable powers before implementation.
The user may enable audience selection, popularity-weighted simulation, or
fully seeded random allocation.

| id | name | mechanism |
|---|---|---|
| `bb-safety-suite` | Safety Suite | Houseguests spend a one-time entry token; winner selects a plus-one for safety. |
| `bb-wildcard` | Wildcard Safety | One representative per team/group competes for safety carrying a disclosed strategic cost. |
| `bb-whacktivity` | Whacktivity Powers | Players secretly opt into themed power competitions; winners may hide the result. |
| `bb-high-rollers-room` | High Roller's Room | Popularity awards currency; players choose whether to spend it on escalating power competitions. |
| `bb-app-store` | BB App Store | Audience/popularity gives powers and punishments to different eligible players. |
| `bb-den-of-temptation` | Den of Temptation | A selected player privately accepts a power that releases a known or hidden consequence on others. |
| `bb-care-package` | Care Package | Audience/popularity grants one unique weekly power; prior recipients become ineligible. |
| `bb-secret-room` | Secret Room/War Room | Clue-driven discovery awards information, safety or a hidden power. |
| `bb-roadkill` | Roadkill / Secret Nomination Competition | Optional competition secretly awards authority to nominate a third player. |
| `bb-mvp` | Most Valuable Player | Audience or simulated audience secretly names a third nominee; a variant lets the audience nominate directly. |
| `bb-safety-chain` | Safety Chain | Sequential safety choices expose relationships until the unsafe pool is defined. |

The App Store is a wrapper around powers such as Bonus Life, Cloud safety and
identity theft, paired with punishments; those powers should not be hardcoded
inside the room. [BB App Store](https://bigbrother.fandom.com/wiki/BB_App_Store)

The Hacker's three authorities—nominee replacement, veto-player selection and
vote cancellation—must be separate recorded decisions. [Big Brother 20 twist
summary](https://bigbrother.fandom.com/wiki/Big_Brother_20_%28US%29)

### Priority F — additional powers after the foundation is stable

These are feasible but should reuse earlier contracts rather than delay the
core catalog:

| id | name | reusable capability |
|---|---|---|
| `bb-cloud-safety` | Cloud / nomination immunity | Holder secretly declares safety before nominations or replacement. |
| `bb-identity-theft` | Identity Theft / Deepfake HOH | Holder secretly assumes nomination authority from the visible HOH. |
| `bb-chopping-block-roulette` | Chopping Block Roulette | Saves one nominee, then replacement is selected through the stated random mechanism. |
| `bb-coin-of-destiny` | Coin of Destiny | Winner may dethrone/replace the HOH subject to the coin result, anonymously where configured. |
| `bb-blood-veto` | Blood Veto | After the vote, holder may save the apparent evictee, automatically evicting the other nominee. |
| `bb-jury-removal` | Jury Vote Removal | Earned power removes one juror's ballot at the finale; must be visible in jury math and narration. |
| `bb-eternal-immunity` | Pre-jury Immunity | Audience-awarded safety lasts until a configured checkpoint but does not erase social consequences. |
| `bb-punishment-companion` | Shared Punishment | A winner or punished player selects another houseguest to share a costume/task, creating event consequences. |

Invisible HOH must conceal both authority and knowledge. A hidden winner is
not useful if every strategy function silently knows the identity. [Invisible
HOH](https://bigbrother.fandom.com/wiki/Invisible_HOH)

### Later/defer

The following can work but are lower-value until the catalog above is stable:

- **Rich House/Poor House:** substantial house-location and deprivation work;
  use only if living conditions affect events and competitions throughout.
- **Intruders/additional houseguests:** requires mid-season cast entry, seeded
  relationships, fairness rules and schedule recalculation.
- **Houseguest exchange:** requires a compatible second simulated house and is
  outside the current single-season scope.
- **Positive/ranked nominations:** viable alternate nomination systems, but
  less recognizable to the current US/Canada-inspired simulator.
- **Premiere-night automatic eviction:** technically easy but gives a player no
  social game; include only as an explicit harsh-format option.
- **Mass eviction:** use documented accelerated cycles, not bulk random exits.
- **Public immunity votes:** supported after the audience model exists.

### Do not implement as twists

- Named HOH/veto/arena competitions: competition catalog.
- OTEV, The Wall, Pressure Cooker, Hide and Go Veto, Before or After: specific
  competitions, even when production advertises their return as special.
- Have-Not arguments, costumes, birthdays, food deliveries and house tasks:
  house events or punishments unless they change eligibility or power.
- A secret room with no reward or consequence: location flavor, not a twist.
- Season themes such as multiverses, AI, summer camp or technology: presentation
  wrappers around mechanics, never mechanics by themselves.
- Duplicated branded powers: map them to the same rule object and vary only
  acquisition, name and narration.

The broad historical index contains more than a hundred named entries, many of
which are regional formats, branded wrappers or ordinary competitions. The
simulator deliberately implements the strategically distinct subset rather
than copying names without behavior. [Big Brother Wiki twist index](https://bigbrother.fandom.com/wiki/Category%3ATwists)

## Compatibility rules

1. Only one primary week-structure twist may control an eviction cycle.
2. `split-house`, `backwards-week`, `battle-of-the-block`, `instant-eviction`,
   `triple-eviction` and `chain-of-safety` conflict unless an explicit tested
   composition exists.
3. A mode can coexist with a power only if nominee counts, veto counts and
   replacement authority remain valid after both are applied.
4. `halting-hex` cancels the eviction, not the week's memories, deals, heat,
   competition wins or relationship changes.
5. Return mechanics cannot reduce the house below or raise it above a schedule
   the finale/jury configuration cannot support.
6. Secret powers require private knowledge records. Public screens show only
   what the house knows; Debug shows the truth.
7. Audience powers require `popularityEnabled !== false`; otherwise setup must
   offer seeded random selection or mark the twist incompatible.
8. Every acquired power has holder, acquisition week, expiry, eligible timing,
   used/unused state, visibility and disposal behavior.

## Player decisions

No power should fire automatically merely because it exists unless its rules
explicitly require automatic use. Decisions use proportional stats plus actual
game state:

- strategic value of the move;
- holder safety and replacement risk;
- trust, resentment and promises;
- alliance and showmance protection;
- perceived vote count;
- threat created by revealing the power;
- archetype behavior and behavioral history;
- expiry pressure.

Every decision produces a structured reason used by VP, transcript and Debug.

## Presentation requirements

Every implemented twist needs:

- setup/designer entry in the shared format-scoped catalog;
- schedule or mode controls with clear stop conditions;
- compatibility warnings before simulation;
- reveal narration at the correct chronological act;
- dedicated VP treatment where the rules materially alter the screen;
- complete text-backlog retranscription;
- episode-history snapshot sufficient for replay;
- Debug panel showing true holder, public knowledge, expiry, choices and hook
  mutations;
- event hooks for the social consequences;
- export/save/load support.

The screen must explain the rule in plain language when it activates. A viewer
should never need prior Big Brother knowledge to understand why somebody is
safe, why three people are nominated, who selects a replacement, or why an
eviction was cancelled.

## Test requirements

Each twist requires unit tests for its own invariant and at least one full-week
integration test. The suite must also prove:

- deterministic results with the same seed;
- no invalid or duplicate nominees;
- HOH, veto winner and other immune players remain protected where required;
- vote eligibility updates after every block change;
- campaign plans are recalculated when the final nominees change;
- statistics count every real competition and eviction exactly once;
- jury and finale sizes remain reachable;
- save/load and episode replay reproduce the twist state;
- public VP never leaks secret information;
- transcript and VP agree;
- Total Drama behavior is unchanged.

For modes, simulate at least 30 seasons and measure activation, stop point,
nominee validity, eviction count, return count and finale reachability. Passing
one scripted fixture is not balance evidence.

## Build order

1. Normalize the twist descriptor and hook result contract without rewriting
   the existing built twists.
2. Diamond Veto as the first power vertical slice.
3. Invisible HOH as the knowledge/secrecy vertical slice.
4. Battle Back as the return vertical slice.
5. Pandora's Box as the choice/consequence vertical slice.
6. Battle of the Block as the recurring power-structure vertical slice.
7. Split House as the multiple-cycle/isolation stress test.
8. Build the reusable power inventory.
9. Add distribution wrappers: Safety Suite, Whacktivity, App Store, High
   Roller's Room, Care Packages and Den of Temptation.
10. Expand into the remaining catalog only after measured multi-season runs.

This order is about engine coverage, not historical importance. When these
vertical slices work, almost every later named twist becomes configuration plus
writing instead of another special-case engine.

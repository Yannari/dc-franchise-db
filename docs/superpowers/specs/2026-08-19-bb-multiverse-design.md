# BB Multiverse — the fifth Big Brother season theme

**Status:** design approved 2026-08-19. Implementation plan to follow.

## The rule this spec was written under

**Check the wiki, and do not substitute a near neighbour for a mechanic we do
not have.** The BB21 spec table said Summer Camp ran a "Prank Week"; there is
no Prank Week in BB21, and the error survived because nobody checked. So every
canon claim below is quoted from `bigbrother.fandom.com` via `api.php`, and
every deviation is written down as a deviation.

## 1. What the season actually was

> **BB Break-In:** Danielle Reyes, Britney Haynes and Frankie Grande broke into
> the Big Brother House in an attempt to change their fates from their prior
> seasons with a "Time Laser", but their plan backfired and accidentally
> cracked open the **BB Multiverse**, the twist of the season […]
>
> **BB Multiverse:** Four different BB Universes took over after the break in,
> each with the potential to twist up the game at any point in the season. The
> universes could bring something as small as a temporary punishment or
> something as large as a game changing twist. Each universe also correlates to
> a theme of one of the bedrooms in the house.

**This is the correction that shapes the whole design.** The engine spec
(`2026-08-09-bb-season-themes-design.md`) described Multiverse as "four
sub-themes inside one season […] plus a weekly roll for which universe is
active". It is not a roll. Each universe is **a bedroom, a vocabulary, and a
pool of disruptions that surface at particular weeks** — sometimes a one-off
punishment, sometimes an entire week branded to it.

The canon incursions, by universe:

| Universe | When | What |
|---|---|---|
| **Comic-verse** | wk 3 | Cock-a-Doodle Zoom — the veto winner wears a superhero chicken costume for a week |
| | wk 4 | BB Power of Invincibility — four houseguests picked by audience vote compete in secret; the winner may save one of the next two evictees (including themselves) and bring them straight back, or let it expire |
| | wk 11 | BB Comic-Week — Power of Invisibility (the HOH operates in secret all week) and Power of Multiplicity (two vetoes in play) |
| **Humili-verse** | season-long | the Have-Not Room is Humili-verse themed; a wheel decides how many times you are humiliated before you may leave it |
| | wk 3 | Snot A Winner — the HOH is "snotted" at random for 24 hours and must choose somebody to take it with them every time |
| | wk 6 | Humili-week — everybody but the HOH is a Have-Not, bathroom visits must be announced, a house "Stink-o-meter" at 10/10 puts everyone in gas masks, and the HOH names the SAFE houseguests by pieing them in the face |
| **Scary-verse** | premiere | the loser of the premiere-night competition disappears into the Nether Region |
| | wk 2 | houseguests send each other to the Nether Region; going in can help or hurt. Second place in the HOH comp sends somebody, granting them safety; that person then sends somebody else, who becomes ineligible for the veto draw |
| | wks 7–8 | Scary Week — the two evicted in the Week 7 double return as **Big Brother Zombies**, week 8 runs with no HOH or PoV competition, and at its end one of the two returns for good |
| **Scramble-verse** | premiere | **Nomination Competition** — the house competes to AVOID nomination, in four groups of four; the losers are automatically nominated, leaving four nominees before an HOH exists. The first HOH then **saves two** of the four rather than nominating anybody |
| | premiere | Seventeenth HouseGuest — a surprise extra player, secretly the mother of an existing houseguest |

## 2. The engine finding: a universe is a mood

The theme engine was ranked as needing new capability for this theme. It does
not. Verified in code:

- **`js/vp-ui.js:725`** builds the skin class as `` `is-mood-${mood}` `` —
  generic, not hardcoded to `hostile`.
- **`themeVoice`** (`js/bb/themes.js`) selects its pool with
  `byMood[st.mood] || byMood.neutral` — a free-form string key, so
  `voice.open.scary` resolves with no change.
- **`advanceThemeArc`** sets the mood on **every** week that matches an arc
  entry, with no ratchet — so an arc may bounce between moods rather than
  escalate once.
- Every `mood === 'hostile'` comparison in the codebase lives inside a single
  theme's own scene builder. Nothing shared assumes two states.

So the four universes are four **mood values**, and they inherit the per-week
stamping (`week.themeMood`), the replay guarantee, and the skin hook for free.
This is the same result CORA and the Mastermind produced: the engine is more
general than its own spec believed.

### The one engine change

`js/bb/week.js` builds the `theme-turn` act from `_primer.turn?.headline` and
`_primer.turn?.body` — a single fixed pair. A theme whose mood changes four
times would announce all four incursions in identical words.

**Change:** allow `primer.turn` to be either the current object *or* a map
keyed by mood, resolved as `primer.turn?.[week.themeMood] ?? primer.turn`.
Backwards compatible — the four existing themes are untouched — and it is the
only shared-code edit this theme requires.

## 3. The antagonist: The Breach

Something broke on night one and has been leaking since. The Breach is **not a
personality**; it is a hole, and what comes through it is a different narrator
each time. Where every other theme has one voice in two registers, this has
five.

| Register | Who is talking | How it sounds |
|---|---|---|
| `neutral` | the Breach itself | almost nothing. A hum, a hairline crack, the house between incursions |
| `comic` | a splash-page narrator | capitals, exclamation, "MEANWHILE—", everything is an ISSUE |
| `humili` | a game-show host | delighted, applause cues, cruelty as light entertainment |
| `scary` | a trailer voice | present tense, short sentences, the lake, what is behind the door |
| `scramble` | inversion | reads backwards, answers before questions, endings first |

**The neutral register is load-bearing.** It is the only one that is quiet, and
the incursions only land because most weeks are ordinary. A season that shouts
in four voices without pause is a season with no contrast — the same reason
Summer Camp's hostile register works by going *silent*.

**No real people.** Canon's break-in is three named returnees with a Time
Laser. This simulator is its own universe (see `CLAUDE.md` on World Tour
geography, and `docs/ADDING-A-SHOW.md`), so the Breach has **no cause** — it is
simply already open on night one, and nothing ever explains it. Written down as
a deliberate deviation, and it is the better story.

## 4. The arc

Every other theme's arc ratchets in one direction. This one **bounces**, which
`advanceThemeArc` already permits:

```
{ at:{week:1},   mood:'scramble' }   the premiere runs backwards
{ at:{week:2},   mood:'neutral'  }   the Breach goes quiet
{ every:3, from:3, untilFromEnd:7, book:<incursion cards> }
{ at:{frac:0.3}, mood:'comic'    }   first incursion
{ …neutral… }
{ at:{frac:0.5}, mood:'humili'   }   Humili-week
{ …neutral… }
{ at:{fromEnd:6}, mood:'scary'   }   the Zombie double
{ at:{fromEnd:4}, book:'bb-double-eviction' }
{ at:{fromEnd:2}, mood:'comic'   }   Comic-Week closes the season
```

(Exact anchors are the plan's business; the shape is the design.) Two standing
constraints from `project_bb_season_themes` apply: authored order **is**
chronological and an act resolving at or before its predecessor is **refused**,
and a cadence expands in full before the next act is considered — so no fixed
week may be listed under a cadence that overruns it. `tests/bb-theme-arcs.test.js`
is the guard.

**Cards, almost all of which already exist:**

| Canon | Ours |
|---|---|
| Power of Invisibility | `bb-invisible-hoh` |
| Power of Multiplicity | `bb-double-veto` |
| Power of Invincibility | a return, priced as a power on the shelf |
| Humili-week / Have-Not Room | have-nots + `js/bb/punishments.js` |
| Cock-a-Doodle Zoom, Snot A Winner | `punishments.js` costume/drag entries |
| Zombie double eviction | `bb-double-eviction` + a return |
| Nomination Competition | **new — see §5** |

## 5. The Scramble-verse premiere — the one real build

Night one runs backwards, and it is the thing anybody would remember about this
season.

1. The house splits into **four groups** and competes **to avoid nomination**.
   The lowest scorer in each group is nominated.
2. There are now **four nominees and no Head of Household.**
3. The HOH competition runs normally.
4. The first HOH's power is **not to nominate**. It is to **save two** of the
   four. The other two stay on the block, and the week proceeds as usual —
   replacement nominations and tiebreaks included.

**Generalising past cast 16.** Canon's "four groups of four" is a cast-16 fact.
Ours keeps **four groups** at any size (3–5 each) so the count of nominees is
always four, which also rhymes with the four universes. Below a house of **ten**
the twist stands down to an ordinary premiere — four nominees out of nine is
most of the room, and the save stops meaning anything.

**Where it hooks.** Before the HOH competition, in the same slot
`premiereMystery` and `campDirector` already use (`js/bb/week.js`, ~line 1920),
gated to week 1. It writes `week.scrambleBlock` (the four). The nomination
ceremony then branches: when `week.scrambleBlock` exists the HOH **saves two**
instead of running `chooseNominationPlan`. This is the same shape as the Coin
of Destiny rewriting a block and the Den's curse reserving a seat — both
established, both hooked into that ceremony already.

**Known risk, stated up front.** That ceremony is the most hooked code in the
week: the Den's curse, Roadkill, the Coin, America's Nominee, the Block Buster
and the Battle of the Block all touch it. Two guards are mandatory in the plan:
a week with no scramble block must run **byte-identically**, and the save path
must not collide with the curse's reserved seat. `bb-temptation`'s
`if (nominees.length < 2)` refill bug is the precedent — a safety net written
before a new seat model existed silently undid it.

**Consequences.** Per the standing law (`CLAUDE.md`: every mechanic injects a
VP-visible event; and the aftermath shelf's *"they could take it well or less
well, really depends"*), this needs its own event family:

- the four who lost owe their group nothing, and remember which group it was
- **the two the HOH did not save** are angrier than an ordinary nominee,
  because they watched somebody else be chosen in front of them
- the two saved carry a debt from day one — and a first-week debt is the
  strongest currency in the game
- the HOH made two friends and two enemies without naming a single person

Every event carries a bond, suspicion, memory or popularity change, and both
directions of each must be reachable. `tests/bb-twist-aftermath.test.js` is the
pattern, and every new event must guard on `firedThisWeek`.

## 6. The skins

Four palettes plus neutral — the visual peak, and the reason this theme was
ranked where it was.

| Mood | The look |
|---|---|
| `neutral` | an ordinary house with a hairline crack in it. The crack is the only tell |
| `comic` | primary colours, halftone dots, hard black panel borders, a splash-page title |
| `humili` | sitcom-bright, too-warm pinks and yellows, studio lighting, applause |
| `scary` | desaturated green-black, the lake at night, a single lit window |
| `scramble` | high contrast and mirrored — the layout reads the wrong way round |

Each is a `.rp-theme-multiverse.is-mood-<universe>` block in
`css/simulator.css`, and `_rpThemeBeatMultiverse` in `js/vp-screens.js` switches
on four values where the existing builders switch on two. Every animation needs
its `@media (prefers-reduced-motion: reduce)` fallback, as the other four do.

## 7. Integration checklist

Adding a theme is five edits, and a guard catches the one people forget:

1. `js/bb/themes-multiverse.js` — the descriptor
2. import + register in `js/bb/themes.js`
3. `.rp-theme-multiverse` + four mood blocks (id is `multiverse`, matching
   `summer-camp` / `high-rollers` — theme ids carry no `bb-` prefix) in `css/simulator.css`
4. `_rpThemeBeatMultiverse` branch in `rpBuildBBThemeBeat` (`js/vp-screens.js`)
5. an `<option>` in the `cfg-theme` select in `simulator.html` — hand-written
   markup, and `bb-themes.test.js` fails if a registered theme has none

Plus, for this theme: the `primer.turn`-by-mood change (§2), the Scramble
premiere module, its VP screen, its aftermath family, and its entries in the
twist contract and `TWIST_CATALOG`.

## 8. Non-goals

- **The Seventeenth Houseguest.** A surprise extra player arriving after the
  premiere is a roster mutation mid-episode, and roster mutations are where this
  codebase has repeatedly hurt itself. Its *good* half — a secret relative
  seated in the cast — is already expressible through `kinshipPairs`, the
  Relationships tab and the duo/twin machinery.
- **The Nether Region's send-a-player-away.** It duplicates exile, which exists.
- **The BB Break-In.** Real returnees with a Time Laser. Not this universe.
- **A weekly roll for the active universe.** The engine spec's guess; canon is
  authored incursions, and authored is better — a roll cannot build to
  Comic-Week.

## 9. Success criteria

- Picking the theme stamps an arc that drops no act at casts 14–20
  (`bb-theme-arcs.test.js`), and every id in `books` schedules somewhere.
- The turn card announces each of the four incursions **in that universe's own
  words**, and the primer explains every card the arc books
  (the guard in `bb-wildcard.test.js` / `bb-camp-director.test.js`).
- A scramble premiere produces exactly four nominees, then exactly two after
  the save, at every cast from 10 to 20 — and never a block of fewer than two.
- A week with no scramble block is byte-identical to today.
- The aftermath family fires at most once per week per event, with both
  directions reachable.
- A full season played end to end and **read** — every prose bug on the last
  three themes was found that way and none by a test.

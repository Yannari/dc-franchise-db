# High Roller's — the fourth BB season theme

Date: 2026-08-15
Status: design, approved for planning

## Status

- **Plan 1 (the money and the theme) — MERGED 2026-08-15, `1784a39c`.** BB Bucks
  accrue, are announced, and reach three transcripts and a House Life band.
  Nothing spends them yet.
- **Plans 2–4 (the room and the games) — the current build.** The user's words
  on finding the theme thin: *"i thought you was doing the twist too the Veto
  Derby and Chopping Block Roulette you didnt?"* — correct, and the reason the
  season currently reads as decor plus a ledger.
- A separate approved-but-parked design, to build straight after:
  `2026-08-15-bb-theme-explainer-design.md`.

## Summary

BB23's High Roller's Room, built as the fourth theme on the season-theme engine
(`js/bb/themes.js`). It is the first **economy** theme: a persistent currency
(BB Bucks) that accrues from week one and is spent, in public, on games that
only sometimes pay out.

The three shipped themes are compositions — Machine Summer and Summer of
Mystery each needed zero engine changes, which is the evidence the engine
works. This one is deliberately not that. It is the theme the roadmap ranked
fifth because it changes how a season *plays* rather than how it looks, and the
mechanics it needs do not exist yet.

## The rule this spec was written under

**Do not substitute a near-neighbour for a mechanic we do not have.** The first
draft of this design booked `bb-double-veto` for the Veto Derby and
`bb-coin-of-destiny` + `bb-invisible-hoh` for the Coin. Those are adjacent
twists, not the same rules, and shipping them under canon names would leave the
theme telling the viewer about a game it is not running. Every canon game below
is built as itself.

## Canon (Big Brother 23, wiki-verified)

Fetched from the Fandom API (`api.php?action=parse&prop=wikitext`; plain page
fetches 402 — see `reference_bb_wiki_api`).

> **High Roller's Room:** During Weeks 6, 7 and 8, the High Roller's Room opened
> up to the Final 11 houseguests. America voted via text and the three
> houseguests who received the most votes would receive $100 in "BB Bucks". The
> next three would receive $75, and the remaining houseguests would receive $50.
> When the room was open, houseguests could go in and pay to play a competition
> of luck or skill. If they won the game, they would win a power. The stronger
> the power, the more expensive the game. A houseguest do not have to use their
> BB Bucks immediately and can hold them for as long as possible. The twists can
> only be used in the week they are purchased, and the competitions can only be
> played once.

Load-bearing details in that paragraph, all of which the design honours:

- Income is an **audience** vote, tiered in three bands — the top three, the
  next three, and everybody else. Money follows who is *watched*, not who is
  good.

  **Amended 2026-08-15: the amounts are rescaled to 26 / 20 / 14.** The shape,
  the tier names and the canon prices (Roulette 125, Derby 50, Coin 250) all
  stand. The broadcast paid $100/$75/$50 for *three weeks only*, so a houseguest
  finished that stretch on 150–300 against a 250 Coin and buying one thing cost
  them everything else. This simulator pays every week from week one — the
  announced tiers are the audience leak the theme is built on, and a leak that
  fires three times is not that theme — so the broadcast amounts across a normal
  16–20 week cast hand everybody 700–1300 against a 425 menu and nobody ever has
  to choose.

  **The first rescale (18/14/10) was justified with arithmetic that was wrong by
  ~40%, and the corrected model is below.** It matters beyond this line: the
  Veto Derby and the Coin of Destiny are priced against it.

  The real season model:

  | quantity | value | source |
  |---|---|---|
  | season length | `cast - 3` weeks | `stampThemeArc`, `js/bb/themes.js` |
  | weeks that actually pay | `cast - 6` | `awardWeeklyBucks` pays nothing below a house of **seven** (`js/bb/bb-bucks.js`) |
  | room nights | `fromEnd` 8 / 7 / 6 = weeks `cast-10` / `cast-9` / `cast-8` | `js/bb/themes-high-rollers.js` |
  | houses on those nights | **11 / 10 / 9** | one eviction a week |
  | payouts banked at a night | N, at week N | the payout runs early in the week (`js/bb/week.js`), before the door opens |

  Measured, 40,000 simulated seasons per cast, uniform draws (the default
  popularity map gives every houseguest the same weight), at **26 / 20 / 14**:

  | cast | payout weeks | floor-every-week lifetime | top-every-week ceiling | night 1 (house 11) | night 2 (house 10) | night 3 (house 9) |
  |---|---|---|---|---|---|---|
  | 12 | 6 | 84 | 156 | wk 2 — mean **37**, 0% can enter | wk 3 — mean **57**, 0% | wk 4 — mean **77**, 0% |
  | 16 | 10 | 140 | 260 | wk 6 — mean **108**, 12% | wk 7 — mean **128**, 57% | wk 8 — mean **148**, 94% |
  | 20 | 14 | 196 | 364 | wk 10 — mean **176**, 100% | wk 11 — mean **196**, 100% | wk 12 — mean **216**, 100% |

  ("% " is the share of the standing house holding the 125 that night.)

  The retune hits its target at the casts it was aimed at: at **cast 16** the
  room is a real market on night two and nearly the whole house on night three;
  at **cast 20** everybody can enter on night one. Casts 14–18 interpolate
  smoothly (cast 14: 0 / 1 / 20%; cast 18: 87 / 100 / 100%).

  **Casts 12 and 13 still cannot enter at all, and that is not a tier problem.**
  The nights are end-anchored, so on a short season they land in weeks 2–5, and
  no weekly amount that keeps the room affordable at cast 16 can also bank 125
  by week two. Getting a twelve into the room means moving the **anchors** or
  the **price**, not these numbers. `ROOM_EMPTY` in `js/bb/high-rollers-room.js`
  narrates the empty floor, which is the honest way to carry it until then.

  **The 250 Coin, for the plan that prices it into the room.** On its own night
  (`fromEnd` 5): cast 12 mean 98 and cast 16 mean 169, with **zero** seasons in
  40,000 producing anybody at 250; cast 18 mean 203, somebody at 250 in **3%**
  of seasons; cast 20 mean 236, somebody at 250 in **88%**. So at 26/20/14 the
  Coin is a **big-cast product** — effectively unreachable below cast 18 — and
  anybody who spent 125 on a Roulette has put it out of reach for the rest of
  the season, which is the choice the theme exists to force. Plan 4 should price
  the Coin knowing that at cast 16 a 250 buy-in is a menu item nobody will ever
  take.

  `PAYOUT_TIERS` and `FLOOR_TIER` in `js/bb/bb-bucks.js` are the only place the
  numbers live.
- Bucks **carry over**. Saving is a strategy.
- **Paying is not winning.** You buy a seat at a game; the game can beat you.
- A purchased twist is **usable only that week**, so nothing bought can be
  banked into the endgame.
- Each competition is **playable once** — per houseguest, per season.

## 1. Identity

**Name:** High Roller's. **Id:** `high-rollers`. **House:** `bb-resort`.

**Antagonist: The Pit Boss**, working the floor for The House.

The House is the thing that always wins and it never speaks. The Pit Boss is
its mouth. This split is not decoration — it solves a real collision. Every
other surface in this simulator says "the house" to mean the roster, and an
antagonist named The House would make `summariseWeek` ambiguous in a way the
Den's name collision with `bb-den-of-temptation` already demonstrates costs
time. The Pit Boss says *the floor*, *the room*, *the edge*, and can name
houseguests directly, which a building cannot.

Register, neutral: a floor manager delighted you are playing, comping the
drinks, counting the whole time. Never threatens.

Register, hostile: hospitality stops. Not anger — accounting. The comps end and
the markers get called in.

**Palette.** Black lacquer, brass rail, oxblood felt, low warm lamplight, gold
numerals. Explicitly *not* green baize: Summer of Mystery owns green and the
whole point of a theme's surface is that no two share one.

**Escalation is the only cold one on the shelf.** Temptation and Machine Summer
both go red; Summer of Mystery drains warm, to bone and candle. When the Pit
Boss stops comping, the party lighting goes out and the **count room** lights
come on: steel, hard blue-white fluorescent, high contrast, every warm tone
gone. The room stops being a party and becomes an accounting.

```
palette: { accent: '#c9a227', ink: '#f2e6c8', paper: '#0b0708', glow: '#f0d585' }
```
with `.rp-theme-high-rollers.rp-theme-hostile` swapping the warm tokens for
steel and fluorescent white. Exact values are an implementation detail; the
constraint is the temperature flip, and that the colour *forms* live on
`.rp-page` rather than `:root` (a custom property is computed where it is
declared — the gotcha the theme tests already pin).

## 2. BB Bucks — `js/bb/bb-bucks.js`

A ledger on `gs.bb.bucks`, `{ [name]: number }`, persisting all season.

**Income, weekly, canon tiers.** The audience vote pays 100 / 75 / 50, ranked
by `gs.popularity`. The payout is **announced** — which is itself a leak, and
the most interesting thing the ledger does. The house learns every week who the
audience loves, and that is information the room can act on regardless of
whether anybody spends a dollar.

**The ledger is otherwise private**, per canon. A houseguest knows their own
balance. Nobody has a scoreboard of everyone else's savings. What the house
sees is: the announced payout tiers, who *walked into the room*, and who came
out holding something. That is three real facts and a lot of inference, which
is a better shape than a public number that removes the inference.

**Module surface:**

- `awardWeeklyBucks(week, house)` — runs the audience vote, writes the ledger,
  returns the act (a `bb-bucks` payout beat for both transcript writers).
- `balance(name)` / `spend(name, amount)` / `canAfford(name, amount)`.
- `bucksLedgerFor(week)` — snapshot into `week.bucksLedger`, taken the same way
  and at the same point `powerLedgerFor` is, so replays of week 4 show week 4's
  money rather than live state. (The mood-per-week lesson from the engine: read
  live state in a replay and you show the wrong room.)

**Persistence:** plain numbers keyed by name, so `JSON.stringify` survives it
with no `prepGsForSave` work. No Sets, no functions.

## 3. The room — `js/bb/high-rollers-room.js`

Opens only on the arc's booked weeks. On an open week:

1. The room is announced. Entry is **public** — the house watches who walks in.
2. Each houseguest decides privately whether to play, and which game. The
   decision reads: need (on the block, no allies, low safety), nerve
   (`boldness`, `temperament`), balance, weeks remaining, and whether they have
   already played that game this season. `spendPull` in `powers.js` is the
   existing shape for exactly this decision and should be reused rather than
   reinvented.
3. Money is taken **on entry**, not on winning.
4. The game runs. Most people lose.
5. A win grants the game's power through `grantPower` with
   `source: 'high-rollers-room'`, `channel: 'purchase'` — which is what finally
   puts money behind a channel `bb-coin-of-destiny` has declared in
   `twist-contract.js` since it was written, while "buying in" was a
   probability roll rather than a payment.

**Enforced constraints:** a game each houseguest can enter once per season; a
purchased power that expires at the end of the week it was bought, never
banked.

## 4. The three games, built as themselves

### Veto Derby — 50

An "as close as you can" guess. Score zero and you have bought nothing at all.
Score above zero **and** finish in the top six, and you earn a **bet**: pick one
of the six veto players. If the player you backed wins the PoV, you hold a veto
of your own.

The mechanic is the resulting **two-veto week, and its order**:

1. The bettor decides first.
2. If the bettor uses their veto, the HOH names a replacement.
3. *Then* the actual PoV winner decides, and may use theirs too.
4. The HOH may therefore be forced into a **second** replacement.

`veto-rules.js` and the veto ceremony path have to learn a week with two
holders and a sequenced ceremony. This is the largest engine change in the
slice, and it is not `bb-double-veto`, which hands one person two decisions.

### Chopping Block Roulette — 125

A win grants three things at once:

1. Safety for the week for the winner.
2. The power to remove one initial nominee — who is then safe for the rest of
   the week and **cannot be the replacement**.
3. A **spin**: the replacement nominee is drawn at random from every eligible
   houseguest, equal odds, chosen by nobody including the winner.

The randomness is the point. The HOH loses the block and gains nobody to blame,
because no hand picked the replacement. Eligibility excludes the HOH, the
winner, the removed nominee, the remaining nominee, and anyone otherwise
untouchable — the same exclusion set the existing replacement paths compute.

### Coin of Destiny — 250

`js/bb/coin-of-destiny.js` exists and is genuinely this game, but it is built
to the wrong rule: our winner *makes nominations*. Canon dethrones the HOH and
installs the winner as the **anonymous HOH for the entire week** — they run the
replacement nominee after the veto as well as the initial block. The dethroned
HOH stays immune and plays in the next HOH competition.

Changes required:

- Price it at 250 and take the money, replacing the abstract buy-in pull with
  an affordability decision.
- Authority extends past nominations to the whole week's HOH decisions,
  including the post-veto replacement.
- The week runs with an HOH the house never learns the name of. `hohSecret`
  already exists as a concept; this makes it last a full week and cover a
  second ceremony.

## 5. The Wildcard — early weeks

BB23's other season-long twist, and it fills weeks 1–4, exactly where a
three-week endgame cadence would otherwise leave holes.

**AMENDED 2026-08-15, because the original was unbuildable.** It was specced as
"one player per bloc", on the assumption that `blocs.js` held assigned teams.
It does not: blocs are **emergent**, derived from alliances and showmances
(`_buildBlocs` reads `gs.namedAlliances` and `gs.showmances`). BB23's four-team
phase has no equivalent in this engine, and inventing one is a separate slice —
the one the Cliques and Coaches themes would also need.

So the Wildcard is adapted to the engine we have, keeping the mechanic and
dropping the teams: **three houseguests are drawn at random** (the HOH
excluded) and compete for **solo** safety. Winning is not the decision —
accepting the safety triggers a **punishment** that may hit the winner or the
whole house. The choice to accept is the mechanic, and it is public.

Built on `punishments.js` for the cost. It is not the Safety Suite, which is a
solo comp with no draw and no punishment.

## 6. The arc

Canon opens the room at a final eleven and runs it three weeks straight. Anchored
by house size, never by week number, so it lands correctly at any cast:

```
{ every: 2, from: 2, untilFromEnd: 9, book: 'bb-wildcard' }   // the early weeks
{ at: { frac: 0.55 }, mood: 'hostile' }                        // the comps stop
{ at: { fromEnd: 8 }, mood: 'hostile' }                        // backstop
{ at: { fromEnd: 8 }, book: 'bb-high-rollers-room' }
{ at: { fromEnd: 7 }, book: 'bb-high-rollers-room' }
{ at: { fromEnd: 6 }, book: 'bb-high-rollers-room' }
```

**AMENDED 2026-08-15 — the theme must also book what it already owns.** Plan 1
shipped `books: []` on the reasoning that a twist with no engine ships a week
that does nothing. That was right for the Derby and the Roulette and **wrong for
two twists that were already built and wired**, which is why picking this theme
stamped an empty timeline while the other three stamp several cards:

- **`bb-coin-of-destiny`** — literally BB23's 250-buck game, implemented in
  `js/bb/coin-of-destiny.js` and dispatched from `week.js`. The most on-theme
  twist in the catalog, left on the shelf.
- **`bb-prizes-and-punishments`** — the wrapped-box veto where somebody takes
  $5,000 over the only thing that could have saved them. The same "what did you
  actually come here for" question the casino asks.

Both go into the arc. Until the room is built, the Coin's buy-in remains a
probability rather than a payment; the room connects them by pricing it at 250
and taking it from the ledger.

`fromEnd: 8` is a final eleven at every cast, which is the canon opening.

The mood turn sits **with the first opening**: the floor stops comping the week
it starts taking money. That is a tighter join than the usual two-thirds
escalation, and the `frac` anchor is kept only as the shorter-season case with
the `fromEnd` as the backstop — the engine's existing rule that a `frac` turn
alone lands after the endgame has begun on a short season.

**Nothing is booked after the last room.** The endgame is left alone. The final
thing the theme does is the last night the room opens, and a device after it
would be a Pit Boss who does not know when to walk away.

Note for the plan: `reanchorThemeArc` rewrites `entry.episode` to the week the
house *really* hits each size. Three consecutive end-anchored acts is the most
any theme has asked of it, and a double eviction inside the run would skip a
house size — which the reanchor handles by firing at `live <= atHouse`, but the
plan should verify it across cast sizes rather than assume it.

## 7. Integration checklist

The five edits every theme needs, and the guard that catches the forgotten one:

1. `js/bb/themes-high-rollers.js` — the descriptor. Never imports `themes.js`
   (circular; the registry imports themes, never the reverse).
2. Import + register in `js/bb/themes.js`.
3. `.rp-theme-high-rollers` block in `css/simulator.css`, colour forms on
   `.rp-page`.
4. A `_rpThemeBeatHighRollers` branch in `rpBuildBBThemeBeat` (`vp-screens.js`).
5. An `<option>` in the `cfg-theme` select in `simulator.html` — hand-written
   markup; `bb-themes.test.js` fails if a registered theme has none.

Plus, for the mechanics:

6. `js/bb/bb-bucks.js`, `js/bb/high-rollers-room.js`, `js/bb/wildcard.js`, and
   the Roulette + Derby games.
7. `TWIST_CATALOG` entries and `twist-contract.js` contracts for
   `bb-high-rollers-room` and `bb-wildcard`.
8. Two-holder support in `veto-rules.js` and the veto ceremony.
9. A **chip count** band on the House Life screen, beside the existing
   `_bbPowerBand`, showing the announced payout tiers and who entered the room.
10. Both transcript writers — the weekly switch *and* the finale's own act
    chains, which are separate. A `theme-beat` handled in only one of them is
    the bug the engine already shipped once.

## 8. Testing

- Descriptor units: registry integrity, every `books` id exists in
  `TWIST_CATALOG`, house binding is a real setting for the format, and the
  `cfg-theme` option exists.
- Ledger: income tiers match canon at every cast size; balances carry across
  weeks; a snapshot replays week 4's money on a week 4 replay.
- Room: money leaves on entry and not on winning; a game refuses a second entry
  from the same houseguest; a purchased power cannot survive its week.
- Derby: the two-veto ceremony runs in the canon order, and the HOH can be
  forced into two replacements.
- Roulette: the removed nominee is never the spun replacement; the spin is
  uniform over the eligible set.
- Coin: the week's replacement nominee is the coin holder's, and no surface
  names them.
- Arc: the three room weeks land at a final eleven, ten and nine at casts 12
  through 20, including a season with a double eviction inside the run.
- Seeding: no bare `Math.random()` anywhere in the slice — `stableRng`, or the
  replay guards break.

## Non-goals

- A public savings scoreboard. Canon-private, decided deliberately: the
  inference is better than the number.
- Selling the whole power shelf. The room sells its three games and nothing
  else; a shop that reliably vends a Coup d'État devalues winning HOH.
- Money in Total Drama. The ledger is BB-only, like every other theme.

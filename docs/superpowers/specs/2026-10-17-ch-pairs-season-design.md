# The Challenge — the Pairs season

2026-10-17. A season mode for The Challenge (`js/ch/`) where you live and die as a pair, ending on the share-or-keep
choice. Builds on `docs/superpowers/specs/2026-10-14-the-challenge-design.md`; follows ADDING-A-SHOW §16.9 / §18.4 / §19.

## 1. Intent

The user, 2026-10-17: "a partner season mode we need to do that and other season mode … u know that type of season
where at the end you been ask to split or keep the prize all to urself." The moment is **Rivals III**: Bananas finished
the final with more points than his partner Sarah and kept all $275,000. The ending is only worth anything because of
the season in front of it: a partner you had no say in, depended on for every daily and every Arena, carrying or being
carried, and then one of you holds the money. The share-or-keep decision is the payoff of a season of pair storylines,
never a coin flip.

The user approved (2026-10-17, "seem good") this shape: ONE Pairs mode with a setup choice of how the pairs are made
(Rivals, Exes / Ride or Die, Fresh Meat, Pick your partner); dailies in pairs; the house votes a pair in; that pair calls
out a pair; the Arena is two on two and the losing pair goes home together; pair storylines all season; a mid-season
twist can break up or swap pairs; Rivals III ending. Teams seasons, Free Agents, Spies-style come after (§12).

### Sources (Wikipedia, read 2026-10-17)

- **Rivals III**: man/woman pairs "that had bitter feuds, fights, or strained relationships"; pairs stayed together;
  when Thomas quit, "Simone was sent home as his partner"; replacement pairs came in after an injury and a walk-out.
  Final: three teams, points per individual result inside each team; "the partner with more points" faced "an ultimate
  choice": Bananas kept, Vince split with Jenna, Devin split with Cheyenne. $275k / $50k / $25k.
- **Rivals II**: same-gender pairs; only the other gender's teams vote in the Jungle team; two champion pairs.
- **Battle of the Exes II**: man/woman exes; the Power Couple (daily winners) picks the Dome opponents; pair vs pair.
- **Fresh Meat II**: an alum and a newcomer of the opposite gender; the alumni drafted newcomers off a combine.
- **Ride or Dies**: pairs chosen before the season from real ties (dating, married, siblings, exes, friends).
- **Double Agents**: pairs picked among themselves after the opener and "frequently changed": an elimination winner "may
  select any player of the opposite gender … to become their partner"; the dumped player re-pairs or goes rogue.

## 2. Goals, non-goals, anti-goals

**Goals**
- A full season played in pairs on the existing engine, with both existing formats (Vote and Call-out, The Tribunal).
- Four ways of making the pairs, each with its own opening scene and its own season shape.
- The pair as a relationship the season tracks: who carried whom, blame, making up, fights, protecting each other,
  wanting out — and those memories decide the share-or-keep choice.
- The share-or-keep finale, aired as the season's biggest moment, and carried into the franchise ledger.
- Stepped viewer, transcript/readout, Intel, timeline, setup, export and wiki all pair-aware.

**Non-goals (this build)**
- Teams seasons (Battle of the Seasons, Invasion), Free Agents, Spies' Agency — §12, separate designs.
- Replacement pairs brought in from outside the cast.
- Redemption House and Late Arrivals in a Pairs season (the setup disables them with a note).

**Anti-goals** (would make it a failure even if it runs)
- A pairs season that reads like a solo season with a second name on every line. Every pair scene must be ABOUT the
  pair.
- A share-or-keep that ignores the season: a pair that grew close keeping, or a nice archetype keeping.
- Any screen, line or sentence that says one partner was eliminated while the other stayed in, unless the season's
  rules really did that (Pick your partner, §5.4).
- Words from another format: no "evicted", no "jury"; the show's own words are "partner", "pair"/"team", "the Arena".

## 3. Setup

Setup panel (cast-ui.js cfg-ch-*, quick-setup.js visibility, saveConfig lists every key — the daily-picker trap):

| Field | Key | Values | Default |
|---|---|---|---|
| Season mode | `chMode` | `solo` · `pairs` | `solo` |
| How the pairs are made | `chPairing` | `rivals` · `ties` · `fresh-meat` · `pick` | `rivals` |
| Pair shape | `chPairShape` | `mixed` (a man and a woman) · `same` (men's pairs and women's pairs) | `mixed` |
| Final pairs | `chFinalists` (reused, read as pairs; per division in `same` shape) | 2 · 3 · 4 | 3 (2 per division in `same`) |

- Gender-blind season: any two people pair; the shape field hides.
- `same` shape keeps the gendered season as it is: men's and women's weeks, two champion pairs (Rivals II).
- `mixed` shape: no divisions for the vote or the Arena; one champion pair (Rivals III, Exes, Fresh Meat).
- Partner Weeks hides in a Pairs season (every daily is in pairs). Redemption House and the Late Arrival twist hide.
- **Hand pairs** (my call): the cast card gets a "Partner" field (`chPartner`, like `chBilling`). Any pairs set by hand
  are kept whatever the pairing method; the method fills the rest. Two cards that name each other is a pair; a
  one-sided or broken pin is ignored and said so on the setup panel.
- Odd cast size or uneven shape: the setup panel says so and refuses to start (same as a Circle/BB cast too small).
  Fresh Meat needs vets = rookies; if the billing is uneven the panel offers to bill the least-experienced vets as
  rookies (career length from the ledger).

`ch-run.js challengeOptions` maps these to `options.pairs = { pairing, shape }` (null in a solo season).
`DEFAULT_OPTIONS.pairs = null`.

## 4. How the pairs are made (`js/ch/pairs.js`)

The state holds `state.pairs = [{ id, a, b, since, how, name? }]`, `state.partnerOf[name]`, and `state.pairGone`
(eliminated pairs with their placement). `pairOf(state, n)` and `pairsIn(state, division)` are the only readers.

- **Rivals** — production pairs each person with the worst relationship available: the franchise's carried grudges
  first (`carriedGrudge`, `carried.bonds` resent), then the most negative bond after first impressions. Min-cost
  matching inside the shape constraint (greedy on the worst pair, then the next; good enough at 24). A pair with no
  real history is billed as "production's guess" and its reveal lines say so (no invented past — §11.5 class).
- **Exes / Ride or Die** (`ties`) — real ties from `state.kin`: married, engaged, dating, exes, siblings, family,
  old friends, in that order; then the best bonds. The pair's tie is stored (`how: 'ex' | 'couple' | 'sibling' …`) and
  every pair line about the past reads it. A dating pair is a couple already (`state.couples`).
- **Fresh Meat** — the vets draft the rookies after the first daily (the combine): order by the vets' respect, each
  pick by `pickScore` (dailies.js) with the rookie's combine score weighed by the vet's strategic stat. Picked last is
  a scene. Mixed shape: vets of one gender draft rookies of the other (as Fresh Meat II); `same` shape within division.
- **Pick your partner** — after the premiere daily, its winners pick first, then by respect, as the existing
  `makePairs` picked mode does. Pairs then change during the season (§5.4).

Every method stores a reason per pair the lines can say ("we haven't spoken since the reunion", "she's my sister",
"he picked me first", "I picked him for his stats").

## 5. The season

### 5.1 The daily
Every daily is played in pairs: `pickMode` returns `'pairs'`; `units = state.pairs`. Dailies without a `pairs` mode
are played with each partner's individual result averaged (CLAUDE.md: averages, never sums), so the whole library is
usable. The winning pair is immune (and is the Tribunal in a Tribunal season: two judges). The last pair is noted.
`same` shape keeps the division of the week: only that division's pairs can be voted in.

The pair inside the daily: each beat already names a player, so the stepped viewer shows which partner fell, which
carried. Each daily writes a **contribution** per partner (their share of the pair's score) into
`state.pairLog[pairId]` — the season's record of who carried whom.

Throwing changes meaning: sinking a partner now sinks yourself, so the partner-sabotage throw motive is off in a pairs
season; the "safe anyway, look weak" motive stays.

### 5.2 The vote and the call-out
- **Vote**: each voter names a PAIR. A voter's read of a pair = a weighted mix of their read of both members (the
  stronger dislike counts more: "I'd vote her in, but I'd be sending him in too"). Ballots, reasons, deliberation,
  meetings and deals keep working per person; a deal with one partner covers the pair, and the house debate argues
  about pairs ("they're the strongest pair in the house").
- **Volunteers**: a pair volunteers only when BOTH want to. One wanting it and the other refusing is a scene.
- **The call-out**: the voted-in pair calls out a pair. Who decides is the pair's own scene: they agree, one overrules
  the other, or they argue at the Arena in front of everybody. `callout.js calloutTerms` is weighed per pair (easy win
  = the weakest pair at tomorrow's game if revealed; grudge with either member; the shot = the strongest pair).
- **Tribunal**: the house nominates three pairs; the winning pair decides together (or splits, in front of the
  nominees).

### 5.3 The Arena — two on two (`arena.js playPairDuel`)
Each beat is played by a pair: the pair's power is the average of both partners' blends at that game, plus a
**teamwork** term from the pair's bond (a pair that can't stand each other loses a little on every beat; Rivals'
whole joke). Each beat names which partner won or lost it, so "you cost us" has a receipt. The losing pair goes home
together; both get a goodbye; the winning pair returns together. Purse and skulls are per player as now (both
partners earn a skull; with `finalPass` the pair needs both).

### 5.4 Pick your partner: pairs that change
In a Pick season the Arena-winning pair may break up any pair: either winner may take one partner from another pair
(Double Agents' infiltration), weighed by that partner's strength, their bond, and loyalty to their current partner.
The two left behind become a pair. The pair shape holds (in `mixed`, a man can only take a woman and the reverse).
Every swap is a scene for the four people in it; the dumped one remembers it
(`remember(..., 'dumped-me')`). At most one swap a week; never in the last two episodes before the final.

### 5.5 When a partner leaves
A quit, a medevac or a disqualification ends the pair. Rivals III's rule: the partner goes home too ("Simone was sent
home as his partner"), with their own goodbye and a grudge (`remember(left, gone, 'left-me', …)`) — unless another
player is also without a partner that day, in which case the two are paired ("stuck with what's left"). That exit is
the week's elimination when it removes a pair (`elimsFor` already gives the capacity back).

### 5.6 The pair as a relationship
New pair scenes, filed as a storyline chapter per pair (`story/storylines.js`: chapter `pair`), each with consequences
(bond, `remember`, mind, popularity) — no cosmetic scene:
- **pair-reveal** at the airstrip/first night (TJ reveals; rivals react; exes freeze; siblings celebrate);
- **pair-carried** / **pair-blame** (exist: widen them to the Arena and every daily, reading the contribution log);
- **pair-fight** (cause.js reasons; the pair fights more the lower the bond and the hotter the temperaments),
  **pair-makeup**, **pair-protect** (one partner talks the house off the other), **pair-want-out** (one asks TJ or a
  friend for a new partner; in Pick it can happen), **pair-plan** (the pair talks the vote as a unit),
  **pair-jealous** (one partner's showmance with someone else);
- the arc of a rivals pair: started hating, and either grew into friends (a real arc in `arcs.js`: `rivals-to-friends`)
  or stayed at war (`rivals-at-war`), aired as a big moment when it turns.

### 5.7 Twists in a Pairs season
`double`, `purge` (the slowest pair), `reveal`, `return` (the two most recent losing pairs fight to come back) work on
pairs. New one-episode twist **Partner Swap** (`ch-swap`, TWIST_CATALOG): all pairs redrawn by the pairing method's own
rule for one week or for the rest of the season (TJ says which); available in any Pairs season. In a Pick season it is
also "The Draft": the house re-picks from scratch, picked last airs.

## 6. The final and share-or-keep (`final.js`, `js/ch/share-keep.js`)

**The race**: the existing five checkpoints and the overnight, run per pair: a pair's checkpoint score is the average
of both partners, but every partner's own points are counted and shown (Rivals III: "points awarded for individual
results within each team"). The instant elimination takes the lowest pair, and only when four or more pairs started
(Rivals III's three all finished). Pairs finish in order; `same` shape crowns a pair per division.

**The choice**: for every finishing pair that won money, in reverse order (the last pair first, the champions last),
the partner with more individual points decides, in front of TJ and the eliminated cast brought back for it. Purses as
data in `stakes.js PURSE` (the pair's prize = Rivals III's split, 1st 275k, 2nd 50k, 3rd 25k, scaled so first place
equals two of today's `PURSE.champion`).

How they decide (stats proportional, no thresholds for the decision itself):
- **Eligibility** (CLAUDE.md archetype rule): nice archetypes (hero, loyal-soldier, social-butterfly, showmancer,
  underdog, goat) always share — they may hesitate on screen when the partner was awful (a beat, not a choice).
  Neutral archetypes may keep only with strategic >= 6 AND loyalty <= 4. Villain archetypes may keep.
- **Weight to keep**: low bond with the partner; who carried (the contribution log: "I carried you all season");
  grudges remembered this season (blamed-me, left-me, threw-it, dumped-me); low loyalty, high strategic, boldness;
  the bank (a player with little money at stake elsewhere wants it more); the partner kept money from them in a past
  season (ledger); a rivals pair who never made up.
- **Weight to share**: bond, loyalty, the pair's kin tie, a showmance between them, kept-word memories, reputation
  (`gs.popularity` and respect: the audience will remember).
- Measured target (audit): over 100 seasons about one chooser in five keeps; in rivals pairs that stayed at war about
  one in two; in kin pairs almost never. Calibrated by skill (`tests/` sweep), not by a fixed rate.

**On screen**: TJ explains the choice; the chooser's confessional (the reason, from the season); the partner's plea or
silence; the eliminated cast watching; the reveal (two cards: SHARE / KEEP); the partner's reaction; the house's
reaction; the chooser's last word. The champions' choice is the season's last big moment before `champion-reflect`,
which gains paths `kept-it` and `shared-it`.

**After**: `state.final.choices = [{ pair, chooser, partner, keep, amount, why }]`; banks updated; the ledger record
carries it (`ledger-record.js`), and `franchise-carry.js` turns a keep into the heaviest grudge the franchise carries
(the partner resents the chooser for every later season of every show), with `why: 'kept the money'`.

## 7. Schedule and placements

- `buildSchedule` counts in units: `need = pairs − finalPairs`; a double eliminates two pairs. The Season Timeline is
  tested equal to the plan (manual §17.4) as now.
- Placement: both partners share a placement number; placements number pairs ("3rd place: Ana & Kyle"); the export and
  the wiki write both names with the same place.
- `same` shape: men's and women's pairs alternate weeks by `divisionFor` counted in pairs.

## 8. The viewer and the screens (`js/vp-ch-ep`)

- **Tokens**: partners stand together everywhere (ground.js crowd rows place a pair side by side); a pair is marked by
  a shared ring colour on both tokens.
- **Pair reveal**: TJ at the airstrip; each pair called up; the reactions play as normal scenes.
- **Daily**: already plays pairs; the HUD scoreboard lists pairs.
- **The vote**: the out-loud ballot names a pair; the vote card shows both portraits.
- **The Arena**: two on two — marks need a left PAIR and a right PAIR (CH_MARKS podium/duel sides get a second spot
  each; set by eye per Arena plate). The beats call which partner scored.
- **Share-or-keep**: its own screen in the final episode; needs an art job (a plate for the decision: the summit or
  banquet at dusk with room for TJ, the pair, and the eliminated cast). Prompt folder in
  `Downloads/Challenge-art/to-edit/` as always; until the plate arrives it plays on the summit plate. SHARE/KEEP cards
  are the user's sprites or plain text (no drawn props — feedback rule).
- **Intel**: a Pairs tab — every pair, bond, the contribution split (who carried), the pair's chapter so far.
- **Power rankings**: rank pairs.
- **Run tab / cast cards / timeline**: the partner chip on each card; the timeline names pairs voted in and sent home.
- **Transcript / readout**: pair-aware sentences; vocabulary from the show registry.

## 9. Dialogue

New pools in `js/ch/script/lines/pairs.js` (+ extra files per the `EXTRA` loop — never `Object.assign` a key another
file owns): pair-reveal by `how` (rivals / ex / couple / sibling / friends / drafted / picked / production's guess),
pair-fight, pair-makeup, pair-protect, pair-want-out, pair-plan, pair-jealous, pair-swap, partner-left, pair-callout
(the pair deciding), the vote naming a pair, Arena two-on-two calls, share-or-keep (TJ's rules, the chooser's
confessional by reason, the plea, the reveal, the reactions both ways, the eliminated cast), and TJ's lines. Voice
variants for every family on the new pools (`voices/` batch), read back per §19 before shipping.

The bug classes to check (§19.4 + this mode): a line about a partner who has left; "your partner" said to someone whose
partner changed this week; a past the pair does not have (rivals with no history); a share line before the decision;
a solo-season line ("I'm going in alone") in a pairs season.

## 10. Tests and measurements

- `tests/ch-pairs.test.js` (mutation-checked): every active player is in exactly one pair at every step; a pair is
  eliminated together; a partner's exit removes or re-pairs the other the same day; placements shared; schedule count
  equals the timeline; no nice archetype ever keeps; the chooser has more points; Pick swaps keep the invariant; a hand
  pair is never broken by the pairing method.
- `npm run audit:ch-spec` grows a pairs block: keep rate overall / rivals-at-war / kin pairs; rivals bond trajectory
  (share that made up); pair fights per season; champion share by pairing method; swaps per Pick season.
- Read loop: `CH_SEED=n npm run ch:transcript` on a pairs season of each method; read every aired line (§19).

## 11. Build order (no plan document — the user builds from the spec)

1. Engine: `pairs.js` (making, state, readers), season.js pair loop (daily, vote, call-out, Arena, exits), schedule,
   placements. Tests.
2. Pick swaps, Partner Swap twist, the four methods' openers.
3. Final in pairs + share-or-keep + ledger/franchise-carry. Audit block.
4. Dialogue pools + voices; read loop.
5. Setup panel, cast card partner field, run tab, timeline, export/wiki.
6. Viewer: tokens, two-on-two Arena marks, vote card, Intel Pairs tab, share-or-keep screen; art job for its plate.

## 12. After this (separate designs)

- **Teams season** (Battle of the Seasons, Invasion: the original shows or vets vs champions as teams, cliques already
  tracked).
- **Free Agents** (the daily's winner and loser swap risk; random partners each week) and **Spies, Lies & Allies**
  (the Agency picks partners) — both mostly free once Pick your partner exists.

## 13. Calls I made (for the user to check)

- One mode with a pairing choice, not four formats; works with both existing formats.
- Default pair shape is a man and a woman (most real pair seasons); same-gender pairs are an option.
- Default 3 final pairs; Rivals III purses.
- When a partner leaves, the other goes home too (Rivals III), unless someone else is left without a partner.
- Every finishing pair with prize money chooses, last place first, the champions last.
- Hand pairs on the cast card override the method.
- Redemption House and Late Arrival off in a Pairs season for this build.
- In `same` shape the whole house still votes (Rivals II let only the other gender vote; easy to add as an option).
- Target keep rate about one chooser in five, higher for rivals who never made up, near zero for kin pairs.

## 14. As built (2026-10-17)

All of §3-§10 shipped, in these commits: 4113ebb2 (engine), 4843fb3b (pair storylines), 37214910 (ledger),
8d06c42c (dialogue), 3e6b03a2 (setup + run tab), af988438 (export + Partner Swap card), 2010f4aa (viewer),
ab192936 (voices), 826eddd0 (Tribunal in pairs), 46f1f4a9 (fixes from the read).

Where it differs from the plan, and why:
- **Keep rate.** About one chooser in ten keeps, not one in five: only about a quarter of choosers are allowed to keep
  (CLAUDE.md: nice archetypes never steal; neutrals need strategic >= 6 and loyalty <= 4), and 37-65% of those do.
  Rivals still at war keep about a third of the time; the size of the prize weighs in (`keepTerms.size`).
- **Season length.** 24 players make 12 pairs and 9 regular episodes (one late double only when 11+ pairs must go).
  Real pair seasons ran 13-14 pairs; a bigger cast gives a longer season.
- **Return twist** works on pairs (the two most recent losing pairs, two on two). Late Arrivals and Redemption House
  stay off in a Pairs season.
- **The vote** names a pair by its representative (`repOf`: the pair's `a`); `ballot.named` is the member the voter
  meant, `ballot.pair` both. Readers that match a ballot against the one voted in keep working.
- **Lines.** A Pairs season reads `'<kind>~pairs.<ending>'` instead of a kind's solo pool when it has one (write.js
  keyFor), so no solo vote-week line ("put her in the Arena") airs. Every scene snapshots each person's partner as it
  happened (`snap.partners`), and roles get `{pa}`..`{pd}`, `{pt}`, `{palt}`, `{popt1}`, `{popt2}`.
- **Viewer.** One podium and one duel mark per side on every Arena plate: the partner stands a step inside the podium
  and a step outside the duel mark (steps.js sideMark). Share or keep plays on the summit plate; a plate of its own is
  an optional art job.

Tools: `CH_PAIRS=rivals|ties|fresh-meat|pick [CH_SHAPE=same] [CH_FORMAT=tribunal] CH_SEED=n npm run ch:transcript`;
scratch tests zz-ch-pairs-smoke (outcomes), zz-ch-pairs-pools (airings against entries per pool), zz-ch-pairs-steps
(the viewer's steps as text, and tools/ch-art/cuts/rows-pairs.json for the viewer harness).

# Big Brother Season Themes — design

Date: 2026-08-09
Status: approved design, not yet planned

## Problem

We have ~22 Big Brother twists and four house venues (`bb-house`, `bb-compound`,
`bb-resort`, `bb-manor`). We have nothing that gives a season a **shape**.

Every modern Big Brother season is sold on a theme, and on the real show a theme
is not decoration — it is the twist container. It names an antagonist or a
premise, and that premise is what licenses the twists to exist and keeps firing
new ones all summer. BB25's four universes each owned a bucket of twists and a
bedroom. BB26's AINSLEY *was* the rule-changing engine and turned heel in Week
10. BB27's Mastermind kidnapped the host on night one and then force-marched the
house to a final three by collecting sacrifices.

Our seasons have twists but no arc, no antagonist, and one visual identity per
venue rather than per season. Two seasons booked with different twists still feel
like the same show.

### The lever

We already own most of the atoms. A theme is mostly **composition**, not new
mechanics. `temptation.js`, `saboteur.js`, `whacktivity.js`, `camp-comeback.js`,
`blocs.js`, `duos.js`, `powers.js`, `coin-of-destiny.js`, `prize-exchange.js`,
`team-america.js` and the Block Buster all exist. What is missing is the layer
that arranges them.

## Research

Pulled from the Big Brother Fandom wiki via `api.php` (page HTML 402s on plain
fetch; `curl` against `api.php?action=parse&prop=wikitext` works). Census of
branded season premises:

| Theme | Season | Premise | Atoms we own |
|---|---|---|---|
| Summer of Secrets | BB6 | 8 secret pairs | `duos.js` |
| Cliques | BB11 | Athletes / Populars / Brains / Off-Beats | `blocs.js` |
| The Saboteur | BB12 | hidden audience-picked antagonist | `saboteur.js` |
| Coaches | BB14 | four vets coach teams | `blocs.js` |
| BB Takeover | BB17 | weekly surprise twist announced by a guest | `twin-twist.js` |
| Summer of Temptation | BB19 | Den + Tree + Temptation Comp + Halting Hex | `temptation.js`, `powers.js`, Halting Hex |
| BB App Store | BB20 | app economy + house division | App Store, `hacker.js`, Split House |
| Summer Camp | BB21 | Camp Director, Whacktivity, Camp Comeback, Prank Week | `whacktivity.js`, `camp-comeback.js` |
| High Roller's Room | BB23 | BB Bucks economy, buy powers | `coin-of-destiny.js`, `prize-exchange.js` |
| Festival | BB24 | Backstage Boss, Festie Besties, BroChella/Dyre Fest | `duo-week.js`, Split House |
| BB Multiverse | BB25 | four universes, one per bedroom | many |
| BBAI / AINSLEY | BB26 | an AI rewrites the rules, then turns heel | Block Buster ≈ AI Arena |
| Summer of Mystery | BB27 | The Mastermind, hidden hotel, Month of Mayhem | `secret-power.js`, `hidden-power.js` |
| Time Capsule | BB28 | weekly draw: a past power *or* a past punishment | `capsule-challenges.js`, `punishments.js` |
| Spy Agency | BBCAN7 | Top Level Clearance, Canada's Asset, Secret Assassin | `team-america.js` missions |
| Superheroes | BBCAN8 | Save Your Superhero, Power Up Necklace | — |
| Time Warp | BBCAN5 | Backwards Week, Black Hole Veto | — |
| Whodunnit | BBCAN11 | murder mystery, The Fatal Feast | — |

## Design

A **theme is a season author**. One descriptor in a new module `js/bb/themes.js`,
sitting above `twist-contract.js` and feeding the existing
`resolveTwistSchedule` / `bbTwistsForWeek` path. It owns four things.

### 1. Identity

Palette, two fonts (display + body), an icon set, a vocab dictionary, and a
binding to one of the four house settings. The theme's palette drives a VP skin
the same way `seasonConfig.setting` already drives `.rp-set-<setting>` in
`renderVPScreen` — a parallel `.rp-theme-<id>` class, scoped so twist screens
with their own bespoke identity are untouched.

House bindings, which also settle the open question of what `bb-resort` is for:

- `bb-house` — Temptation, BBAI, Time Capsule, App Store
- `bb-manor` — Summer of Mystery, Whodunnit, Summer of Secrets
- `bb-resort` — High Roller's Casino (and BB27's own endgame checked the house
  into the "White Locust Resort", so the venue is canon-supported)
- `bb-compound` — Summer Camp, Spy Agency, Festival

### 2. An antagonist

A named voice — AINSLEY, The Mastermind, the Saboteur — with a line pool that
**reads real simulation state**. This is the thing the real show cannot do and we
can: an AI that names the alliance that actually formed last night, or a
Mastermind who taunts the specific houseguest whose ally he just took.

The antagonist is a first-class object: name, portrait/SVG, voice register, a
`comment(ctx)` entry point called at fixed points in the week (opening, after
nominations, after the veto, before the vote), and a `mood` that the arc can
flip. AINSLEY going Evil in Week 10 is a mood change plus a palette change, not a
second character.

### 3. An arc

Week-indexed **acts**: cold open → escalation → midseason turn → endgame. The arc
is what makes a theme a season author rather than a filter: it emits
`twistSchedule` entries (`{ id, episode, type, ...options }`) onto the week grid
so you pick a theme instead of hand-booking twelve cards in the Format Designer.

Arc acts can:
- book a twist on a given week
- change the antagonist's mood
- fire a theme-exclusive event family
- (Mastermind only, and the reason that theme is ranked where it is) **insert an
  elimination**, which is new capability the scheduler does not have today

Hand-booked twists still win. The arc fills the weeks you left empty, and
everything it emits goes through `resolveTwistSchedule` so existing
incompatibility rules hold — a theme cannot smuggle a clashing pair in.

### 4. Twist affinity

Per theme: `books` (auto-scheduled by the arc), `weights` (boosted when a season
is randomised), `bans`, and `exclusive` — twists only this theme can run. The
exclusives are where the new mechanics live; everything else is composition.

### Format-agnostic descriptor

The descriptor shape carries no Big Brother vocabulary in its structure (acts are
indexed by episode, not by week; twists are catalog ids). Only Big Brother themes
ship now. A Total Drama theme later needs content, not a second engine.

## Roadmap

**Tier 0 — the engine.** `js/bb/themes.js` (descriptor + registry), the arc
scheduler, the antagonist voice system, a theme picker in the season config, and
the VP skin hook. No theme ships without it.

Then, in order:

1. **Summer of Temptation** — first because it is the cheapest possible proof.
   The Den, the powers shelf and the Halting Hex are built and verified; the
   theme is nearly pure composition (add the Tree of Temptation as a public shame
   board, the Temptation Competition, and the arc that escalates the offers). If
   the engine cannot assemble a season out of parts we already own, we learn that
   in the cheapest week rather than the most expensive one.
2. **BBAI / AINSLEY** — first marquee. The antagonist system is the most reusable
   thing on this list; Mastermind, Saboteur and JANKIE all inherit it. Forces the
   "theme mutates base rules" path (AI Arena = three nominees plus a save comp,
   which is the Block Buster's existing shape). Highest VP ceiling: proto-box
   takeovers and a full palette flip at the heel turn.
3. **BB Multiverse** — the engine's stress test and the visual peak. Four
   sub-themes inside one season, each with its own palette, vocab, twist pool and
   bedroom, plus a weekly roll for which universe is active. Needs (1)'s
   scheduler and (2)'s antagonist to exist first. Four VP identities in one
   season; nothing else here does that.
4. **Summer of Mystery / The Mastermind** — the only theme that reshapes the
   endgame, via the Month of Mayhem marching the house to a final three through
   sacrifices. That requires giving the arc power to insert eliminations, which
   is genuinely new. Also the hidden-role hunt (Secret Accomplice) —
   `saboteur.js` plus the guess-and-blame pattern already proven in Roadkill and
   the Den.
5. **Casino / High Roller's** — the first economy theme. A persistent currency
   and a shop of powers is the change most likely to alter how the sim *plays*
   across a season rather than how it looks; highest replay value here. Ranked
   fifth because it wants the power shelf broadened first (three acquisition
   channels are still unused).
6. **Summer Camp** — cheap after the hard slices. `whacktivity.js` and
   `camp-comeback.js` exist; needs Camp Director, Prank Week and a camp skin.
7. **Spy Agency (BBCAN7)** — missions on top of Team America's engine; Secret
   Assassin is a strong hidden role.
8. **Time Warp (BBCAN5)** — Backwards Week and the Black Hole Veto force rule
   *inversion* support, mechanically the strangest thing on the list and worth
   owning.
9. **Summer of Secrets (BB6)** and 10. **Cliques / Coaches** — cast-partition
   themes on `duos.js` / `blocs.js`. Last not because they are weak but because
   they are premiere-night twists more than season-long arcs, so they get the
   least out of the engine.

## Non-goals

- Total Drama themes. The engine stays format-agnostic; TD content is later.
- Rewriting any existing twist. Themes compose them; a twist that runs
  themeless today must keep running themeless.
- A theme editor UI. Themes are authored in code, picked in config.

## Testing

- Descriptor units: registry integrity, every `books`/`bans`/`exclusive` id
  exists in `TWIST_CATALOG`, house binding is a real setting for the format.
- Arc scheduler: emitted entries survive `resolveTwistSchedule`; hand-booked
  twists are never displaced; an arc cannot emit a clashing pair.
- Antagonist: voice fires at every declared hook across a seeded season, never
  names a houseguest who is not in the house, and respects secrecy the way
  `hohSecret` does (no reaching around into `ctx.week`).
- Per theme: a played season under `bb-act-coverage` — every act type emitted is
  handled by **both** transcript writers and every built screen is registered.
- Determinism: seeded season replays identically (no bare `Math.random()`;
  `stableRng` only).

## Risks

- **Arc vs. hand-booking conflicts.** Mitigated by hand-booked-wins plus routing
  everything through the existing resolver.
- **Theme skin fighting twist skins.** The setting skin already solved this by
  scoping to `.rp-page`; the theme skin uses the same scoping rule.
- **Scope creep per theme.** Each theme is its own slice with its own spec-sized
  brief; this document is the container, not the implementation plan for
  fourteen seasons.

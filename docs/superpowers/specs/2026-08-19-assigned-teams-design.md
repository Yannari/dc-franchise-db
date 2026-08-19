# Assigned teams — a group you did not choose

**Status:** design approved 2026-08-19.

## The gap

Every group this engine has is **opted into**. Alliances are formed, showmances
happen, duos are declared, and `blocs.js` *derives* its power structures from
alliances and showmances (`_buildBlocs`). There is no assigned-membership
concept anywhere in the Big Brother engine — the only `teamOf` in the whole
repo is a Total Drama challenge.

That gap has already cost real work: building BB23's Wildcard, canon's
"one player drawn per assigned team" had to be flattened to a random draw,
and the reason was written into `js/bb/wildcard.js` at the time.

It blocks three shelved themes at once — **Cliques (BB11)**, **Coaches
(BB14)** and **Festival's Festie Besties (BB24)** — and it is the one thing on
the season shortlist the engine genuinely cannot express.

## The facility — `js/bb/teams.js`

State on `gs.bb.teams`: `[{ id, name, members: [...] }]`. Plain JSON, no Sets,
survives the weekly `JSON.stringify` with the save.

Four reads, mirroring `js/bb/rivals.js`, which is the closest existing shape:

| Export | Returns |
|---|---|
| `teamOf(name)` | the team object, or null |
| `teammates(name)` | the rest of the team |
| `sharesTeam(a, b)` | for strategy reads and event casting |
| `teamImmune(week, hoh)` | names the week's safety list should carry |

`teamImmune` plugs into the `untouchable` array at `js/bb/week.js:2802`,
alongside `rivalsSafe`, `keySafe` and `duoCrownSafe`. Same line, same shape, no
new mechanism invented.

## The first consumer — Cliques (BB11)

Wiki-verified:

> The 12 new Houseguests were shortly split into four common high school cliques
> of three; Athletes, Populars, Brains, and Off-Beats. **Should a member of
> their clique win Head of Household, they would be immune from eviction that
> week.**

One rule, and it is worth the slice on its own: **four people are safe every
week, not one.** It rewrites nominations from the first ceremony, through a
group nobody joined.

**Assignment is archetype-driven, not random.** Athletes take the
`challenge-beast` and the physical; Brains the `mastermind` / `schemer` and the
strategic; Populars the `social-butterfly` / `showmancer`; Off-Beats the
`wildcard` / `chaos-agent` and whatever is left over. Sizes stay within one of
each other at any cast. Random would be a line cheaper and would throw away
data the roster already carries — archetype assignment means the cliques *read*
as cliques the moment they are drawn.

**They dissolve.** Canon's cliques stopped mattering partway through the
season; ours dissolve at a house size, and the dissolution is an EVENT, because
"the protection you have been relying on just evaporated" is a scene.

## The social half

A team is **not** an alliance, and the design fails if it behaves like one.
Assigned membership gets a *weak* pull on targeting and voting — you would
rather not nominate your own clique — well below a chosen alliance, because
nobody picked these people.

The interesting state is the **crack**: the houseguest who resents being
sorted, and who is safe this week because of people they cannot stand. Per the
aftermath law (`docs`/`CLAUDE.md`: every mechanic injects a VP-visible event;
and *"they could take it well or less well, really depends"*), both directions
must be reachable — a clique that closes ranks and starts voting as one, or a
clique whose protection is humiliating and somebody says so out loud.

## Scope

The facility **and** the Cliques theme together. Engine-only would be
unfalsifiable, and this codebase has specifically been bitten by things that
were written, registered and unreachable.

**Not in scope:** Coaches (vets coaching from outside, plus a mid-season team
reset) and Festie Besties (assigned *pairs*, a different shape). Both become
cheap once this lands, which is the point of doing it first.

## Success criteria

- Four teams at every cast from 8 to 20, sizes within one of each other, every
  houseguest on exactly one team.
- A clique HOH makes their whole clique untouchable at the ceremony, and the
  block is still legal (never fewer than two eligible names).
- Teams dissolve at the configured house size, once, with an event.
- A season with no teams runs **byte-identically**.
- Both social directions reachable, each event guarded on `firedThisWeek`.
- A full season played and **read** end to end.

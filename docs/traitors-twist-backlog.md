# The Traitors — twist backlog

Twists from the real show that the engine does not have yet. Every one was
checked against the Traitors fandom wiki (thetraitors.fandom.com, read through
`api.php` on 2026-09-16). Chosen by the user; deferred because the missions come
first.

**Already in the engine:** On Trial, In Plain Sight, Face to Face, The Dungeon,
Double Murder, Name Your Own, **Hidden Murder** (built 2026-09-17 with The
Funeral), **The Poisoned Chalice** (2026-09-17), Recruitment (note and
ultimatum), The Armoury, Shield, Dagger, Seer.

## Night / murder twists

1. **Secret Traitor** (UK S4, US S4) — a fourth Traitor in a red cloak, unknown
   to the other three and to the viewer. The Secret Traitor writes the murder
   shortlist (three names in the UK, four in the US) and the regular Traitors
   pick one name from it. That lasts until the regular Traitors complete a
   secret mission, which ends the power; in the UK the Secret Traitor then
   joins the conclave. The Finnish original reverses the roles: the regular
   Traitors shortlist and the Secret Traitor picks. Biggest of the list: it
   touches roles, the conclave and the reveal.
2. **Death Match** (UK S3) — the Traitors write four names (they may include
   themselves). Each player holds two cards; one of the eight is the life card.
   The holder of the life card leaves each round, down to two players, who then
   draw from a face-down circle until one finds it. The loser is murdered face
   to face. The cards decide the victim, not the pact.
3. **The Sacrifice / safety chain** (US S2 ep 7) — no banishment that night.
   The Shield holders grant safety to one player each, each of those players
   grants it to the next, and so on until five are left unchosen. Only those
   five can be murdered. The order of the chain is public.
4. **Deathrow volunteers** (Canada S2; S3 variant) — the host adds money to the
   pot if enough players volunteer for Deathrow; only volunteers can be
   murdered. In the S3 version the Traitors pick four, and the mission can save
   three of them with Shields.
5. ~~**Poisoned Chalice**~~ **DONE 2026-09-17** (murder variant `chalice`).
   No conclave. The pact's most bookish Traitor has to FIND the chalice among
   the Shakespeare first — about one night in five it never turns up, and then
   nobody is murdered and the castle is never told why. The most sociable
   Traitor pours it, and the room remembers whose hand the glass came from
   about two times in three (`poured`, 0.42) — one name, not a set, which is
   how the show's own pourer was banished the next night. When nobody can
   recall it, the night leaves no evidence at all.

## Round Table / money / endgame twists

6. **Banish or Murder** (Canada S1, NZ S2, Hungary S1) — a dinner party
   replaces the Round Table. Tonight there is a banishment OR a murder, not
   both. A banishment needs a unanimous agreement: the pot gains money if a
   Traitor goes and loses it if a Faithful goes. If anyone refuses, there is no
   Round Table and the Traitors murder (in NZ, the tied players each get a
   Shield).
7. **The Bribe / Sacred Sword** (UK S1, UK S2, NZ S2, Norway S3) — one player
   is offered the day's mission money to leave the game (UK S1: the player
   nobody picked in a "who do you trust most" chain), or to keep it for
   themselves instead of the pot (UK S2: whoever draws the one sharp sword from
   the stone). Needs a voluntary-exit kind the registry does not have yet.
8. **Journal of Suspicions** (Canada) — a murdered or banished Faithful passes
   their journal to the living player they trust most. The holder can read the
   suspicions of every eliminated Faithful. A new evidence channel, and a tell
   if the holder uses it too openly.
9. **Traitors' Dilemma** (Australia S2) — if three Traitors reach the final
   three, each secretly votes Share or Steal. All Share: split the pot. One
   Steal: that Traitor takes it all. Two Steal: those two split it. All Steal:
   nobody wins anything.

## Engine notes gathered before stopping

- Night shapes live in `js/tr/murder-variants.js` (`VARIANTS`, `pickVariant`,
  `VARIANT_LINES`, `variantEvidence`) and are carried out in `resolveMurder` /
  `_shapeNight` in `js/tr/murder.js`. A new shape also needs: a
  `TWIST_CATALOG` entry in `js/core.js` added to every other murder entry's
  `incompatible` list; a `TR_RULES` entry plus a `VARIANT_RULE` row in
  `js/tr-rules.js`; the `SHAPE` map in `tests/tr-murder.test.js`; and a card in
  `js/vp-tr/conclave.js`.
- `_conclaveRecord` (`js/tr/headless.js`) does not copy `variantData` onto the
  episode record, so a screen cannot draw a Death Match or a chain yet. Add
  only the fields the audience may see.
- Every variant must leave the room DIFFERENT evidence, never write `public`
  or `observed` alignment beliefs, and take no rng draw (everything is hashed).
- Adding a weight to `VARIANTS` changes which shape every seeded season rolls,
  so seeded tests may drift; re-measure, do not re-pin.
- Twists 3 and 6 replace a Round Table, so they touch `js/tr/roundtable.js`
  and the episode flow, not just the night.
- `tests/tr-murder.test.js` is on the slow list (`vitest.slow.js`), so the
  default config skips it; run it with
  `npx vitest run --config vitest.sim.config.js tests/tr-murder.test.js`.

## Missions — ALL DONE (2026-09-16 → 2026-09-17)

Twelve bespoke missions, each from the wiki, each with a mockup approved before
its screen was built (Task 11 of
`docs/superpowers/plans/2026-08-31-traitors-full-experience.md`).

The four originals: The Drowned Causeway, The Nightjar Orrery, The Long Account,
The Ash Vault. Then: Buried Alive, Beacon Lighting, Wicker Beasts, The Traitors'
Chess, Church Match, Traitors' Monument, The Funeral, The Roulette.

- **The Funeral** is a FOLLOW-UP mission: it runs only the afternoon after a
  Hidden Murder (murder variant `hidden`), is forced by `runMission`, and is not
  in the random pool or the timeline dropdown. The twist is only pickable when
  the funeral can run, so a hidden death is never left unrevealed.
- **The Roulette** is the wiki's bonus night. A mission may never reduce
  `gs.tr.pot` (the validator and the pot test both enforce it), so the gamble is
  over the NIGHT'S purse and the final keep is capped at it.
- Every mission screen now plays on a STAGE (js/vp-tr/mission-stage.js): a
  full-width scene above the cards, each step in two beats — suspense, then the
  answer. A theme adds `stage()`, a card classifier, settle/play, and appends
  `STAGE_CSS`. `paintSide` takes a `mode` ('next' plays, 'all'/'mount' settles).
  Watch for `overflow:hidden` on a theme root: it silently kills the sticky
  stage. Use `overflow:clip`.

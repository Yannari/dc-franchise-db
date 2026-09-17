# The Traitors — twist backlog

Twists from the real show that the engine does not have yet. Every one was
checked against the Traitors fandom wiki (thetraitors.fandom.com, read through
`api.php` on 2026-09-16). Chosen by the user; deferred because the missions come
first.

**Already in the engine:** On Trial, In Plain Sight, Face to Face, The Dungeon,
Double Murder, Name Your Own, Recruitment (note and ultimatum), The Armoury,
Shield, Dagger, Seer.

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
5. **Poisoned Chalice** (UK S2, US S2) — a version of Murder in Plain Sight
   with no conclave. A Traitor takes the poisoned chalice from a book and must
   persuade a Faithful to drink from it before midnight. The persuasion can
   fail. The engine's In Plain Sight already lists "a poisoned glass" as a
   method, so this must be its own variant with the persuasion step, not a
   new line of text.

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

## Missions first (chosen 2026-09-16)

Eight more bespoke missions, from the wiki's mission pages, to reach the
plan's 12 (Task 11 of `docs/superpowers/plans/2026-08-31-traitors-full-experience.md`).
Each gets a mockup in `mockup/` for approval before its screen is built.

1. Buried Alive
2. Beacon Lighting
3. Wicker Beasts
4. The Traitors' Chess
5. Church Match
6. Traitors' Monument
7. ~~The Funeral~~ DONE, with the Hidden Murder night twist (murder variant `hidden`); The Funeral is a follow-up mission forced the day after one
8. Bonus mission: Roulette / Dinner Party

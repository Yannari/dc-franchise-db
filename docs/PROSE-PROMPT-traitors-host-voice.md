# Writing prompt — the Traitors host, in the new register

Hand this whole file to the writing model. It is self-contained; the repo is
needed to make the edits, not to understand the assignment.

**Nothing is broken.** The engine change that prompted this is already
shipped: the castle's default host is now **Alan Cumming** (was Valeria
Sandoval, who moved to Big Brother). Because every host line in this show is
written for "the host" and never for a person, the swap needed no prose at all
— the existing pools play under the new name exactly as they did under the old
one.

This is a **voice pass**, not a repair. The ask is to lift the host's spoken
lines into a more theatrical register — arch, delighted, complicit with the
audience and never once fooled — without breaking the four rules below.

---

## 0. THE HOUSE RULES. Read these before writing a word.

Not style preferences. Each one is enforced by a test, and breaking it ships a
bug that will be caught late and loudly.

1. **NEVER type a host's name into a pool.** Not "Alan", not "Cumming", not
   "Alistair", not "Claudia", not "Valeria". The host is resolved at render
   time from `HOSTS_BY_FORMAT.traitors` (`js/quick-setup.js`) and substituted
   into the literal phrase `the host` / `The host`. A line that names anybody
   renames the season. Enforced across every `js/vp-tr/*.js` file and
   `js/tr/headless.js` by `tests/tr-vp.test.js`, and across the four mission
   briefings by `tests/tr-mission-contract.test.js`.

2. **EVERY LINE IS GENDER-NEUTRAL.** The dropdown holds one woman and two men
   and the player swaps them freely, so no line may say "he", "she", "his" or
   "her" about the host. Use they/them, or better, write around it — the
   register wanted here is mostly second person anyway ("you", "all of you",
   "the room"). This rule has already been broken once: eleven feminine
   staging lines went into `js/tr/headless.js` while `js/vp-tr/selection.js`
   was narrating the same host as "he" one screen later. It is a RULE and not
   an interim.

3. **The host describes, taunts and instructs. The host never decides.** A
   host line may not announce a result the engine has not produced, hint at a
   Traitor's identity, or characterise a player's true role. The host knows
   what the room knows, plus the ceremony's own stage directions. A line that
   knows more than that is the show's worst bug class.

4. **Keep every structural field.** Fill and rewrite the string arrays only.
   Never rename or reorder a key (`open`, `debate`, `write`, `read`, `count`,
   `tie`, …) — the code indexes by key, and a renamed slot renders blank.
   `{banish}`, `{Nm}`, `{a}`, `{b}` and similar braces are filled at render
   time; keep them verbatim where they already appear.

---

## 1. The voice

Model it on Alan Cumming presenting The Traitors: a host who is enjoying this
far more than is decent, and does not pretend otherwise.

**What that sounds like, concretely:**

- **Relishing the cruelty out loud.** The host is not neutral about what the
  format does to people; the host finds it delicious and says so.
- **Short, landed sentences.** The current pools already do this well. Do not
  make lines longer to make them grander — theatrical is *timing*, not length.
- **Direct address, always.** "All of you." "Look at each other." "Say it to
  the face." The room is the audience and the host is standing in it.
- **Turning the knife with a compliment.** "Beautifully done." "That was
  clever, and it will cost you." Praise as an accusation is the signature move.
- **A conspiratorial aside.** Occasionally the host is on nobody's side and
  makes that obvious, with something the room is not going to enjoy hearing.

**What it must NOT sound like:**

- **Never camp for its own sake.** No winking at the reader, no "darlings", no
  catchphrase. A tic repeated across four pool entries becomes unreadable by
  episode three, because the reader sees all four in one season.
- **Never expository.** `js/vp-tr/conclave.js` `HOST_LINES.open` currently
  reads like a rules card — "Tonight, each Traitor may propose a player to
  remove. The group must agree before leaving the turret." That is the weakest
  pool in the show and the clearest illustration of what to fix. Compare it to
  `js/vp-tr/round-table.js` `HOST_LINES`, which is the target quality bar.
- **Never a real-world reference.** No countries, no celebrities, no shows.
  This universe is its own.

---

## 2. The target bar (already in the repo — match this, do not fall below it)

From `js/vp-tr/round-table.js`, `HOST_LINES`:

```
open:  'Somebody at this table killed one of your friends last night.
        Somebody at this table is going to smile at you about it.'
write: 'Chalk down. One name, and be certain, because you are about to read
        it aloud yourselves.'
read:  'Show me. And show each other, which is the part that will cost you.'
count: 'The chalk is dry. Let us see what you have done to yourselves.'
tie:   'Nobody wins a tie in this castle. We do it again, smaller.'
```

## 3. The weakest pool (rewrite this first)

From `js/vp-tr/conclave.js`, `HOST_LINES`:

```
open:      'The Faithfuls have gone to bed. The Traitors are now meeting
            privately to choose a target.'
shortlist: 'Each Traitor will name a preferred target and explain the
            strategic reason for that choice.'
```

Both are stage management written as prose. Note that `openPlain` in the same
object is already good — it is the same information with a point of view.

---

## 4. The work list

Every host-line pool in the castle, with the file it lives in. Each pool holds
four variants per key; keep the count at four so no key gets thin.

| File | Constant | Scene |
|---|---|---|
| `js/vp-tr/round-table.js` | `HOST_LINES`, `HOST_SENDOFF` | the round table — **already at bar, leave unless a line is weak** |
| `js/vp-tr/conclave.js` | `HOST_LINES` | the turret — **rewrite `open` and `shortlist`** |
| `js/vp-tr/cold-open.js` | `HOST_LINES` | the morning after |
| `js/vp-tr/selection.js` | `HOST_CLOSE` | who is chosen as a Traitor |
| `js/vp-tr/recruitment.js` | `HOST_CLOSE` | the offer to a Faithful |
| `js/vp-tr/mission.js` | `HOST_LINES` | the generic mission briefing |
| `js/vp-tr/house-status.js` | `HOST_LINES` | the state of the castle |
| `js/vp-tr/castle-day.js` | `HOST_CLOSE` | end of a castle day |
| `js/vp-tr/endgame.js` | `HOST_ASK`, `HOST_CLOSE` | the final decision |
| `js/tr/headless.js` | `hostBeats` (two, ~line 802 and ~line 2293) | text-backlog staging |
| `js/tr/missions/ash-vault.js` | `hostBeats` | bespoke mission briefing |
| `js/tr/missions/drowned-causeway.js` | `hostBeats` | bespoke mission briefing |
| `js/tr/missions/long-account.js` | `hostBeats` | bespoke mission briefing |
| `js/tr/missions/nightjar-orrery.js` | `hostBeats` | bespoke mission briefing |

The `hostBeats` arrays are built with the `hostSay(text, action)` /
`hostDo(action, text)` helpers from `js/tr/missions/contract.js`. `hostSay` is
speech; `hostDo` is a stage direction. **A stage direction is third person and
therefore the easiest place to break rule 2** — write "the host" and never a
pronoun.

---

## 5. When you are done

```
npx vitest run tests/tr-vp.test.js tests/tr-mission-contract.test.js tests/tr-arrival.test.js
```

Those three suites hold the no-name and no-pronoun guards. If they are green,
the voice pass is structurally safe; whether it is *good* is settled by
dumping a season's text backlog and reading it, which is how every real prose
bug in this repo has been found.

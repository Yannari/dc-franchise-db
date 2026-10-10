# Total Drama — day-one pair scenes ("First Impressions" / "Off on the Wrong Foot")

Status: spec, ready to build. Written 2026-10-10 from the user's review of the current scenes and of
five example scenes (the approved register is in §3).

## 1. The problem

On day one of every Total Drama season, each team airs two pair scenes: the two people who clicked
(badge **First Impressions**, green) and the two who didn't (**Off on the Wrong Foot**, red). The
user: *"first impressions scenes are getting repetitive and are not based on voices, archetype, age
or character kits."*

What is there now:

| | |
|---|---|
| Picker | `js/td/story/director.js` `firstPair(ep, camp, members, n, kind)` — the highest (clicked) or lowest (clashed) day-one bond in the team; skips pairs with a shared history (`historyOf(a,b).facts.hist !== 'none'`, those get `story.firstday.history.*` instead). Called from `airTdEpisode` on day one. |
| Pools | `js/td/story/lines/firstday.js` → `story.firstpair.clicked` (4 entries: fp.c1–c4) and `story.firstpair.clashed` (3 entries: fp.x1–x3). |
| Writer | `writeStory('story.firstpair', kind, who, data, facts, ctx)` (`js/td/story/write.js`). |
| Voice | a turn's `v: { tag: "line" }` swaps one line for an exact voice tag (`voiced()` in `js/td/story/voice.js`). Only a handful of lines have one. |

So: seven scripts shared by every team of every season, 6–8 lines each, no archetype, no age, no
kit, barely any voice. A two-team season airs four of the seven; by season three a viewer has seen
them all several times.

## 2. Goal

Every day-one pair scene is about **those two people**: built from how their voices, archetypes,
ages and (where they have one) character kits collide, long enough to have a set-up and a turn, and
never the same scene twice in a season or close to it across seasons.

Success criteria (measured, §9):
- ≥ 12 situations each for `clicked` and `clashed`, 10–14 turns each.
- Every spoken line has voice variants (§5); a scene between two different voice families reads
  as a different scene.
- Across 20 seasons, no single scene entry airs more than ~1 in 8 day-one pair slots, and no line
  text repeats inside a season.
- Kit characters open on their own kit material when the situation allows (§6).
- Every speaker in a scene is a seated member of it, and every seated member speaks or is named in
  a beat (the bug the user reported in another scene: four people seated, two talking).

## 3. The register (approved by the user)

Plain, fluent, conversational English. The voice comes from **what a person says and wants**, never
from wordplay. Confessionals say the feeling plainly.

The user's corrections, verbatim — these are the rule:

| Rejected | Approved |
|---|---|
| "They were drying in a pile. Now they're drying in a system. You're welcome, sweetheart." | "I know, sweetie, but they were all bunched up. They'd never dry like that. I fixed them for you." |
| "Five minutes. And then I'm redoing your shoelaces, because they're a mess." | "Okay, five minutes. But can you redo your shoelaces? It's stressing me out." |
| *(conf)* "When I said she was nervous, she stopped folding. That told me more than anything she's said all day." | *(conf)* "Seraphine is a lot. But when I told her what I thought, she actually listened." |
| "That's a very rude thing to get right." / "survival, but goth" / "Most dictators take longer." / "The fire says otherwise." | (cut: written, clever, not spoken) |

Also binding (the project's standing writing rules, see `CLAUDE.md` and the memory notes on
flowing speech, jokes, and personality):
- Connected sentences ("but", "and", "so", "because"); people trail off, restart, hedge. Never three
  short declaratives in a row.
- A joke lands on first read and makes sense; no surreal lines, no metaphors, no aphorism endings.
- Contractions always. No "I'd like to", no "A word about…".
- Nice archetypes (hero, loyal-soldier, social-butterfly, showmancer, underdog, goat) never scheme,
  threaten or sabotage, even on day one. Villains (villain, mastermind, schemer) can.
- No real-world country names; nothing a character couldn't know on day one.
- `{a}` and `{b}` only — never a name written into a pool.

### Reference scenes (approved register)

These are the bar. Write to this level and length.

**Click — a fixer and an honest one** (Seraphine, schemer "helper" voice; Ashley, hero)
```
(Seraphine is refolding the towels Ashley hung on the shelter beam.)
Ashley: Hey, I just hung those up.
Seraphine: I know, sweetie, but they were all bunched up. They'd never dry like that. I fixed them for you.
Ashley: You've been fixing stuff all day. Did anybody actually ask you to?
Seraphine: Nobody ever asks. I just like to help.
Ashley: Can I be honest with you? I don't think anyone else will be.
Seraphine: Of course! I love honesty.
Ashley: Half the team thinks you're bossing them around. I don't. I think you're nervous, and keeping busy helps.
(Seraphine stops folding.)
Seraphine: I'm not nervous. I'm organized.
Ashley: Okay. Then come sit down for five minutes. The towels will be fine.
Seraphine: Okay, five minutes. But can you redo your shoelaces? It's stressing me out.
Ashley (conf): Seraphine is a lot. But when I told her what I thought, she actually listened.
Seraphine (conf): Ashley said something about me right to my face, and she wasn't even being mean about it. I'm not used to that. I think I like her.
```

**Click — from a kit** (Gwen's kit: "being goth", the eyeliner bit; Owen, food-loving sweetheart)
```
(Gwen is on the dock, using a burnt stick from the fire as eyeliner.)
Owen: Whoa. Are you doing your makeup with a stick?
Gwen: My eyeliner's in my other bag, and they took my other bag. So, yeah.
Owen: That's so cool. Can you do mine?
Gwen: You want eyeliner?
Owen: I want to look cool like you!
Gwen: You'll look like you fell face-first into the campfire.
Owen: Honestly, that's happened before.
(Gwen laughs, and looks annoyed that she did.)
Gwen: Fine. Hold still. If you sneeze, it's going in your eye.
Owen: Does this mean we're friends now?
Gwen: It means I'm doing your eyeliner. Don't make it weird.
Owen (conf): Gwen did my makeup on day one! She says we're not friends, but she's totally my friend.
Gwen (conf): I don't make friends on day one. But telling Owen that would be like kicking a puppy, so I guess I'm stuck with him.
```

**Clash — a boss and a refuser** (Heather, villain; Noah, dry floater)
```
(Heather is giving everyone jobs at the shelter. Noah is lying in the shade, reading.)
Heather: You. You're on firewood.
Noah: No thanks.
Heather: That wasn't a question. Everybody's helping.
Noah: I'm saving my energy for the challenge.
Heather: You're lying under a tree.
Noah: Yeah. That's how you save energy.
Heather: Let me explain how this works. People who help me stay. People who don't go home first.
Noah: You know you just said that out loud, in front of everyone, right?
(Somebody behind them laughs. Heather turns around, and nobody admits it.)
Heather: Firewood. Now.
Noah: Sure. Right after this chapter.
Heather (conf): Noah thinks being smart means he's safe. He's wrong, and I'm going to show him.
Noah (conf): We've been here two hours, and Heather's already running the place. She's going to be exhausting. She's also going to be really fun to watch lose.
```

**Clash — an age gap** (a grown adult, a teenager)
```
(Dale is telling everyone how to build the fire. Kayla already has one going.)
Dale: Whoa, whoa, kiddo. You're doing it wrong. It needs air.
Kayla: It's got air. It's on fire.
Dale: I've been building fires since before you were born.
Kayla: Okay. But mine's lit, and yours isn't.
Dale: Hey. A little respect. There are adults on this team.
Kayla: I know. I just don't think you're in charge.
(Everyone goes quiet.)
Dale: Wow. If my daughter talked to me like that, she'd be grounded.
Kayla: I'm not your daughter. And you can't ground anybody out here.
Dale (conf): I've got a kid her age at home. I know that attitude. It never lasts past the first week.
Kayla (conf): Every adult here thinks being older means they're right. My fire's going. His isn't.
```

**Click — two anxious people**
```
(They both reach for the last canteen at the same time and pull their hands back.)
Millie: Sorry! You take it.
Ren: No, you take it. I'm not even that thirsty.
Millie: You've been carrying logs for an hour.
Ren: Okay, I'm a little thirsty.
(They split it. Neither of them knows what to say next.)
Millie: Is it weird that I'm scared of everybody here?
Ren: Oh, thank god. I thought it was just me. I practiced what I'd say on the dock for a week, and then I just said "hi" and waved.
Millie: I saw that. It was a nice wave.
Ren: You're just saying that.
Millie: A little. But it was fine. It was a normal wave.
Ren (conf): Millie is the first person here who didn't make me feel like I was doing everything wrong. I want her on my side.
Millie (conf): I think Ren and I are going to be friends. Or we're both going to keep saying sorry to each other until we get voted out.
```

## 4. Design: a situation, chosen for the pair, voiced per line

A scene entry is a **situation** (what happens between them), gated to the pairs it fits, with every
line written per voice. Three layers decide what plays:

1. **Situation** — picked by the pair's facts (`factsFor` in `js/td/script/facts.js` already gives
   `arch`/`archB`, `nice`, `villain`, `register`, `age`/`ageB`, `gap` (`older`/`younger`/`same`, a
   12-year gap), stat flags (`strong`, `brainy`, `bold`, `hot`, `calm`, `charm`, `sly`…), `band`).
   Use `when:` on the entry (`{ villain: true }`, `{ gap: 'older' }`, `{ voice: [...] }`,
   `{ voiceB: [...] }`).
2. **Voice per line** — each turn's `v` holds versions (§5).
3. **Kit hook** — where `{a}` or `{b}` has a kit, the scene can open on their kit material (§6).

### 4.1 Situations to write

At least these. Each is one or more entries (two entries of the same situation with different
staging are fine and encouraged). Names are for the writer; they are not shown.

**clicked** (`story.firstpair.clicked`)
| id | situation | fits |
|---|---|---|
| fixer-honest | one fixes/organizes, the other tells them the truth kindly | a: bossy/schemer/controlling; b: nice or blunt |
| eyeliner-kit | a kit bit opens it; b joins in instead of mocking | a has a kit |
| two-shy | both anxious/soft, over-apologizing | voice anxious/soft both |
| food | food shared, traded or stolen, and it bonds them | voice food/goofy, or a hungry `strong` one |
| same-interest | they discover the same odd interest (music, books, a sport, a show) | any; use kit `thing` when one has it |
| helper | a helps b with a job b was failing at, b admits it | b anxious/proud; a strong/warm |
| roast-buddies | two dry/sharp voices quietly roast everyone else together | both dry/sharp, not nice-vs-villain |
| competitors | they size each other up and end up respecting it | both competitive/challenge-beast/bold |
| big-sib | an older one looks out for a much younger one | `gap: 'older'` |
| homesick | one is homesick, the other makes them laugh about it | a soft/emotional |
| flirt-lite | a little crush on day one, both embarrassed (only if `romanticCompat`) | showmancer/flirty, romance enabled |
| underdog-noticed | someone written off finds someone who doesn't write them off | b underdog/goat |

**clashed** (`story.firstpair.clashed`)
| id | situation | fits |
|---|---|---|
| boss-refuser | one hands out jobs, the other won't take one | a bossy/villain; b dry/lazy/floater |
| age-gap | an adult talks down to a teen (or a teen dismisses an adult) | `gap` not `same` |
| bed-grab | a bed/spot/seat is taken, both dig in | any |
| loud-quiet | a loud one keeps talking, a quiet one has had enough | a loud; b dry/calm/quiet |
| know-it-all | one corrects everything, the other snaps | a nerdy/brainy or bossy; b hot |
| fake-nice | a villain is sweet to their face, b sees through it | a villain/schemer; b sharp intuition |
| competitor-trash | trash talk about who's the strongest | both competitive/strong |
| neat-messy | one's mess invades the other's space | any, voice-varied |
| food-fight | food taken/wasted, a real grievance | food voice on one side |
| kit-mock | b mocks a's kit thing, a defends it (`defend`) | a has a kit |
| first-joke-bombs | a's joke lands badly on b | a goofy/odd; b sharp/proud |
| suspicious | a is openly strategic on day one, b calls it out | a sly/schemer; b blunt/hero |

Nice archetypes may be on either side of a clash, but a nice character's lines never threaten,
scheme or sabotage: they push back, sulk, snap, or say the hard true thing.

### 4.2 Shape of a scene

- 10–14 turns: a one-line staging beat that shows them **doing something** (§ "activity under the
  scene"), the exchange (with one turn, a moment where it shifts), and **two** confessionals (one
  each), each saying how they feel about the other person.
- Name the place through the existing `place:` key (`water`, `work`, `fire`, `eat`, `sleep`,
  `public`, …) so `writeStory` picks the venue's real spot. Don't write a venue noun the place can't
  supply.
- Only `{a}` and `{b}` speak. A third person may only appear in a beat as "somebody", or as `{c}`
  if the picker seats one (it doesn't today; don't add one).

## 5. Voice variants

Every **spoken** turn and every confessional gets a `v` with at least the five families, plus exact
tags where the line really changes:

```js
{ by: 'a', say: "I know, sweetie, but they were all bunched up. They'd never dry like that.",
  v: { sharp: "...", dry: "...", loud: "...", soft: "...", odd: "...",
       bossy: "...", ditzy: "...", nerdy: "...", teen: "...", grown: "..." } }
```

Families (from `js/td/story/voice-family.js`):

| family | tags |
|---|---|
| sharp | cruel, schemer, proud, bossy |
| dry | dry, calm, quiet, nerdy |
| loud | loud, blunt, tough, competitive, chaotic |
| soft | warm, earnest, emotional, anxious, flirty |
| odd | goofy, ditzy, food, theatrical |

**Engine change needed (small):** `voiced()` in `js/td/story/voice.js` only matches exact tags. Add
the family fallback: for each of the speaker's tags in order, try `v[tag]`, then
`v[FAMILY[tag]]` (import `FAMILY` from `voice-family.js`). Keep the existing guards (an age tag is
skipped for a hard voice, `hush` skips `loud`). This is the same rule `pickVoice()` already uses in
`js/td/script/write.js`.

The base `say` stays the plain/neutral version (the `plain` family: somebody with no strong tag).

Age: `kid`/`teen`/`grown`/`adult` tags exist (`voiceOf`). Teens hedge ("like", "honestly",
"literally"), adults reference kids/jobs/back home; a hard voice ignores its age tag (Fiore rule:
an eleven-year-old villain talks like a villain).

## 6. Kits

### 6.1 How kits work today (for the implementer)

- A **kit** is a hand-written object keyed by the character's exact roster name, in
  `js/td/story/kits/kits1.js`, `kits2.js`, `kits3.js`, with two more parts merged in from
  `kits-deep.js` and `kits-solo.js` by `kits/index.js`.
- Parts: `thing` (what they're known for, as others put it), `bit` / `tease` / `reply` (aligned:
  `bit[i]`, `tease[i]`, `reply[i]` are one exchange), `home`, `want`, `conf`, `askHome`,
  `askWant`, `defend`, `deep`, `alone` (one string: "{a} is …"), `solo`.
- Slots allowed in kit lines: `{a}`, `{b}`, `{a.obj}`, `{b.obj}`, `{a.sub}`, `{b.sub}`
  (`tests/td-kits.test.js` enforces this, the name being in the roster, and the alignment).
- Each kit line plays once a season (`gs.tdStory.kitUsed[name]`, `take()` in `kits.js`).
- `director.js` uses kits in six camp scenes (`kitBitScene`, `kitClashScene`, `kitCallbackScene`,
  `kitDeepScene`, `kitLifeScene`, `kitSoloScene`). **Day one doesn't use them at all.**
- **No character gets a kit automatically.** 58 of the 208 roster characters have one: exactly the
  58 with authored profile fields (backstory, personality, casting interview). A character without a
  kit falls back to archetype lines for `home`/`want` only, and gets none of the kit scenes.
- Adding one: write the entry in any `kits*.js` file under the exact roster name, add their
  `defend`/`deep` to `kits-deep.js` and `alone`/`solo` to `kits-solo.js`, and run
  `npx vitest run tests/td-kits.test.js`. Write it from the profile in `franchise_roster.json`
  (voice, occupation, descriptor, backstory, personality, castingInterview), in the register of §3.
  Renaming a character orphans their kit (the test catches it).

### 6.2 Kits in the day-one scenes

- When `{a}` (or `{b}`) has a kit, prefer an entry that hooks into it. Two ways:
  - **Kit-opened entries**: an entry flagged `kit: 'a'` whose first spoken line is taken from
    `{a}`'s kit `bit` (via `take(name, 'bit')`), and whose reply turn for `{b}` is either the
    matching `tease[i]` (clash) or a warm follow-up written in the entry (click). Build these
    through a small helper in `kits.js` (`kitFirstPairScene(a, b, kind, facts, ctx)`), the same way
    `kitBitScene` builds its entry, then pass to `writeStory`.
  - **Kit-aware lines**: an ordinary entry may use `{a.thing}` (resolve from the kit's `thing`)
    inside a line ("So what's the deal with {a.thing}?"). Add `thing` to the slots `writeStory`
    can fill, from `kitOf(name).thing`, and gate the entry `when: { kitA: true }`. `factsFor`
    needs `kitA`/`kitB` booleans (`hasKit`).
- Mark used kit lines (`mark()`), so day one doesn't spend a line the season needs later. Use the
  kit at most for one of the two day-one pair scenes per team.
- The `kit-mock` clash uses `defend` for the reply.

## 7. Selection and repetition

- Keep `firstPair()`'s choice of **who** (strongest and weakest day-one bond, no shared history).
  Only the scene changes.
- `writeStory` already ledgers what aired. On top of it:
  - Prefer entries whose `when` gates match more of the pair's facts (an entry written for
    `villain` + `dry` beats a generic one for Heather and Noah).
  - Never air the same entry twice in a season (two teams, plus swaps later that reuse
    `story.firstday.swap`).
  - Across seasons: a season-independent memory isn't needed if the pool is big and gated well;
    the measured target is §9.
- A scene for `{a}` and `{b}` that only fits the other way round must be written with `a`/`b`
  swapped (the picker may pass the pair in either order: decide `a` by the entry's gates, e.g. the
  bossy one is `a`).

## 8. Files

| file | change |
|---|---|
| `js/td/story/lines/firstpair.js` (new) | the clicked/clashed pools, ≥ 12 situations each, written per §3–§5. Register in `lines/index.js` (that file is shared with other work: add one import, touch nothing else) and remove the old `story.firstpair.*` keys from `firstday.js`. |
| `js/td/story/voice.js` | family fallback in `voiced()` (§5). |
| `js/td/script/facts.js` | `kitA` / `kitB` facts. |
| `js/td/story/kits.js` | `kitFirstPairScene()` (§6.2); `{a.thing}` slot support if done that way. |
| `js/td/story/director.js` | `firstPair()` tries the kit scene first when a kit fits, else the pool. Nothing else in the director changes. |
| `tests/td-story.test.js` | add the new pools to the checks the file already runs (slots, choppy share, clever-line phrases, voice tags valid). |
| `tests/td-firstpair.test.js` (new) | §9. |

Check before editing: another session has been working in `js/td/story/` (director.js, kits.js,
lines/index.js). Pull first, keep edits to the lines above, and commit only your own files.

## 9. Tests and the audit

`tests/td-firstpair.test.js`:
1. Pool size: ≥ 12 entries each for clicked/clashed, each 10–14 turns, two confessionals (one per
   person).
2. Every `say`/`conf` turn has a `v` with all five family keys; every `v` key is a known voice tag
   or family (`VOICE_TAGS` from `voice.js`, `FAMILY` keys).
3. No line contains a slot other than `{a}`, `{b}`, their pronoun forms, `{here}`, `{bed}`, `{a.thing}`.
4. A nice archetype as `{a}` or `{b}` never gets a line from the threat/scheme list (reuse the
   checker `tests/td-story.test.js` uses for nice/villain rules if present).
5. Played seasons (use `tests/helpers/season-harness.js`, 20 seasons, varied venues and casts from
   the real roster; set `globalThis.FRANCHISE_ROSTER` so voices resolve):
   - no entry > 1/8 of all day-one pair slots;
   - no line text repeats within a season;
   - every speaker of a day-one pair scene is one of its two `players`, and both speak;
   - where either has a kit, ≥ 40% of those scenes use kit material.

Also, by hand, before calling it done: dump 30 day-one pair scenes from real seasons and **read
them** (the project rule: tests pass on bad prose; reading finds it). Check each against §3. The
user will reject anything written or clever.

Run only the affected tests while iterating (`td-firstpair`, `td-story`, `td-kits`,
`td-vp-steps`); don't run the full suite.

## 10. Out of scope

- The **First Impressions twist** (day-one vote, `fi.*` pools in `n-firstimp*.js`). Not this.
- `story.firstday.start` / `swap` / `history.*` (the four-person "team meets" scene). Same register
  applies if someone touches them later, but not in this job.
- The viewer: nothing changes in `js/vp-td-ep`. Day-one pair scenes already play as two-person
  scenes; the speaker/seat check in §9 is the guard.

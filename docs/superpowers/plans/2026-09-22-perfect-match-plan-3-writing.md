# Perfect Match — Plan 3: the writing

**Goal:** every event a season produces reads as a short scene with real
dialogue, in the voice approved in spec §16.5, instead of the two placeholder
lines per kind that Plan 1 shipped (`js/pm/events.js:11`).

**Why now, before the run tab:** the run tab, the screens and the text backlog
all render `ev.tpl`. If they are built first, they are built on a one-sentence
shape and have to be rebuilt for a script. And the audit's worst writing
number, 45% repeated line-and-cast pairs, is a pool-size problem that no screen
can hide.

**Roadmap (supersedes the Plan 1 header):**
3. writing (this plan)
4. run tab and cast tab
5. screens from mockup v2, plus the text backlog
6. export, publish, social pack, ratings, franchise-meta

**Rules that bind every task:**
- `feedback_writing_rules_episodes` and `feedback_scenes_with_real_dialogue`
  (memory).
- Spec §16.5.
- **Fluent, not clever** (§16.5, round 3). A closing beat shows an action and
  does not comment on it. No meme constructions. The narrator is funny from
  the situation, not from a phrase.
- `docs/ADDING-A-SHOW.md` §11.5: a speech that knows what the character does
  not; one show's vocabulary printed over another's. This show has no
  eviction, no tribal, no jury and no nominations. "Dumped" is the word.

---

## The shape

A pool entry is a **script**:

```js
{
  id: 'argument.07',                 // stable, used by the repetition guard
  when: { rung: ['exclusive', 'official'], mood: 'jealous' },   // optional facts filter
  stage: '{b} is already packing the dishwasher when {a} comes in.',   // at most one line
  turns: [
    ['b', "Don't tell me how I should feel."],
    ['a', "I'm not doing that, I'm just saying—"],
    ['b', "You are. Every time. You decide what the problem is, then you tell me I'm the problem for having it."],
  ],
  beat: '{b} walks off toward the kitchen. {a} doesn't follow.',
}
```

- **Speakers** are `a`, `b`, `c`, `dior` and `narrator`, and nobody else.
  Names are filled at render time and never written into a pool.
- **Length:** 3–5 turns. A comedy or reaction entry may have 1–2 turns; a
  dumping verdict may have 6.
- **Delivery:** some turns are answered plainly, some with a pause, some by
  walking off. Not every turn lands a joke.
- **Pronouns:** `{a.sub}`, `{a.obj}`, `{a.posAdj}` come from `pronouns()`.
  Never guess a gender inside a line.

The rendered event stores **strings**, never a function or a pool reference it
needs to re-resolve. Rows go through `JSON.stringify`.

```js
ev.script = {
  id: 'argument.07',
  stage: '…',
  lines: [{ who: 'Priya', text: '…' }, …],
  beat: '…',
}
```

`ev.tpl` is removed. Its three readers move to `ev.script`:
- `tests/pm-engine-rules.test.js:23`
- `tests/pm-events.test.js:41`
- `tests/pm-spec-audit.test.js:102`

---

## Task 1 — the renderer and the fact card (`js/pm/script.js`)

1. `factsFor(state, ev)` builds the only facts a `when` may test.
   - For `a` and `b`, from their own point of view:
     - `rung`: own rung
     - `thinks`: the believed partner rung
     - `persona`, `intent`, `attachment`
     - `mood`: the dominant of jealous, heartbroken, stressed, lonely, guilty,
       secure, from `emotions.js` thresholds (narrative only; CLAUDE.md
       allows thresholds for text)
     - `coupled`: whether they are coupled to each other
     - `days`: days in the villa
     - `bombshell`: whether they arrived as a bombshell
   - For the pair: `gap`, which is true when it is a situationship.
   - **`knows`**: the set of facts `a` holds about `c`.
     - Sources are three, and there are no others: what `a` witnessed (the
       event's witness list), what `a` was told (a `gossip` or `advice` event
       with `a` as listener), and what aired to the villa (`reveal`,
       `photos`, `notes`, `families`).
     - A script that makes `a` say what `c` did must declare
       `when: { knows: 'c' }`.
2. `pickScript(state, rng, kind, facts)` picks the entry:
   1. Filter the pool by `when`.
   2. Weight the matches by specificity, so the more facts an entry matches,
      the likelier it is.
   3. Apply the repetition guard (Task 7).
   4. Pick with `streamFor(seed, 'script')`, never `Math.random`.

   Every pool must keep at least three entries with no `when`, so a filter
   can never come back empty. A guard enforces this.
3. `renderScript(entry, ev, state)` fills names and pronouns and returns the
   string object above.
4. `makeEvent` calls these in place of `pick(rng, def.tpl)`. The hut cutaway
   (Task 5) goes through the same path.
5. Tests, `tests/pm-script.test.js`:
   - Rendering is deterministic for a given seed.
   - An empty filter falls back to an entry with no `when`.
   - `knows` is false for an islander who was not a witness and was not told.
   - The rendered output contains no placeholder `{`.

**Pools live in `js/pm/lines/*.js`.** There is one file per family:
`day.js`, `ladder.js`, `feelings.js`, `rituals.js`, `moments.js`, `hut.js`,
`voices.js`. They hold data only: no imports, no logic.

---

## Task 2 — day-to-day pools (the 12 generated kinds)

These make up most of the ~100 events in an episode, so they need the deepest
pools.

| kind | entries | variants that must exist |
|---|---|---|
| chat | 36 | early days vs late; coupled vs just placed; wallflower |
| friendship | 36 | girls-girl; the lads; cross-gender friends; villa-clown |
| kiss | 24 | first kiss vs settled; challenge vs terrace; `gap` |
| pull | 30 | bombshell pulling; coupled islander pulled; fuckboy; game-player |
| loyalty | 20 | exclusive/official turning down; hopeless-romantic; closed-off |
| deep-chat | 30 | the intents love, first-love, fresh-start; anxious vs avoidant |
| argument | 30 | jealous; stressed; messy; official couples; friends, not couples |
| gossip | 24 | always `knows: 'c'`; girls-girl passing it on vs game-player using it |
| comedy | 24 | villa-clown dominant; nobody named in a mean way unless `b` answers |
| ick | 16 | the ick said to a friend vs to the face; `when: ick` from the profile |
| challenge-kiss | 16 | partner watching; `gap`; bombshell |
| challenge-win | 12 | hideaway prize vs points |

**Gate:** write 5 entries of `argument` and 5 of `pull` first, print them
rendered with a real season's names, and show the user before writing the
rest. Carry the user's corrections into every later task.

---

## Task 3 — the ladder and the feelings (about 22 kinds)

The ladder kinds are `close-off`, `keeping-open`, `open-back-up`,
`head-turned`, `exclusive-ask`, `official-ask`, `ask-declined`, `love-said`,
`love-hanging` and `declaration`. The feeling kinds are `torch`,
`jealous-confront`, `jealous-sulk`, `jealous-retaliate`, `reassurance`,
`overthinking`, `confession`, `advice`, `double-standard` and `solidarity`.

- Each kind gets **12–16 entries**.
- The asks split by the answer's rung readiness: yes, "not yet", or a
  hard no.
- `love-hanging` is the silence after "I love you". The beat carries it; `b`
  never says the words back.
- `jealous-*` entries are chosen by the attachment facts: anxious confronts
  or sulks, avoidant retaliates or goes cold.
- `double-standard` must name what `a` did that `a` is now angry about, and
  `a` is the one who knows it, so it requires `knows`.
- `confession` covers hidden crushes, faking coming clean, and a kiss at
  Casa. Each is its own set, keyed by `extra`.

## Task 4 — rituals and moments (about 24 kinds)

These are the tentpoles. Pools are smaller (6–10 entries each), but they carry
the longest scripts and `dior` or `narrator` turns.

- **Arrivals:** `entrance`, the bombshell `date`, `steal`.
- **Recoupling:** `recouple-pick`.
  - The pick's speech is the islander's reason. It must match what drove the
    pick in `recoupling.js`: attraction, safety, or strategy.
  - A strategy pick never says "I really fancy you" unless the islander is
    faking.
- **The dumping's five phases:** `dump-buildup`, `dump-verdict`,
  `ballot-reveal`, `dump-reaction`, `dump-goodbye`, plus `dump-fallout`.
  - Every one has a Dior line. The verdict wording differs for public votes
    and villa votes; the channel is in `extra`.
- **Casa:** `casa-return`, split by stick or twist and by whether the partner
  also twisted.
- **Rituals:** `photos`, `notes`, `families`, `heart-rate`, `snog-marry-pie`,
  `movie-night`, `hideaway`.
  - A movie-night clip may only show an event that exists in the season and
    was hidden or not seen by the viewer.
  - The line quotes that event's `script` back, so the clip and the reaction
    agree.
- **Endings:** `final-result`, `envelope`, `walk` (keyed by `extra.cause`),
  `reveal` (the reunion).

## Task 5 — the beach hut

- `hut.js` holds cutaways keyed by **kind family × stance** (honest or
  two-faced), with mood variants.
- There are roughly 150 entries across 8 families: flirting, couple,
  jealousy, friendship, gossip, ladder, dumping, and bombshell/Casa.
- A cutaway is one or two lines from one speaker, straight to camera.
- A **faker's honest hut** is the giveaway spec §6.5 promised: it says what
  the faker actually feels. It is chosen with `when: { faking: true }` and is
  never picked otherwise.
- **A hut line reacts to its event.** The family is the event's family; a
  generic "I know what I want" is the fallback only.

## Task 6 — Dior and the narrator (`voices.js`)

- **Dior:**
  - host lines for entrances, recoupling calls, the dumping phases, the
    final and the envelope, and the reunion questions;
  - warm and dry, and she lets a silence sit;
  - she never reveals a result before the reveal beat (§11.5, "a screen
    showing live state").
- **The narrator:**
  - a wry British voiceover over villa days, in the spirit of Iain
    Stirling, with 60 or more lines keyed by phase and by what just
    happened, for example a row that just aired or a kiss straight after a
    loyalty speech;
  - rate-capped at about 6 per episode, so he punctuates the episode rather
    than narrates it;
  - he may know everything that aired, and nothing that did not.
- **The narrator has no name yet** (spec: undecided).
  - He is written as `narrator` and labelled "The Narrator" from a
    registry field `narratorName` on the perfect-match entry in
    `js/shows.js`, so naming him later is a one-line change.

## Task 7 — the repetition guard

- `state.usedScripts` is a map from entry id to the episodes it was used in,
  kept per season.
- An entry is never reused for the same unordered pair in one season.
- An entry used this episode has its weight × 0.1; one used within the last
  3 episodes has × 0.4.
- **Audit item 16**, in `tests/pm-spec-audit.test.js`:
  - `line+cast repeat rate` below 5%, down from 45%;
  - the share of each kind's entries used per season is printed;
  - `knowledge violations` must be 0. That means every script with a `c` turn
    naming a deed passes `knows` at render time, re-checked from the row
    rather than trusted from the picker.

## Task 8 — guards (`tests/pm-lines.test.js`)

The pools must be well-formed:
- ids are unique;
- speakers are in the allowed set;
- `a` appears in every entry;
- `c` appears only where the kind casts three.

The content rules:
- No proper names in any pool. The test checks every cast name across 20
  seasons, plus Dior.
- No other show's vocabulary: evicted, tribal, jury, nominated, HOH, vote you
  out, torch snuffed, sashay. The list comes from
  `tests/helpers/show-vocabulary.js`.
- No invented stat words (CLAUDE.md list) and no invented archetypes.
- A **sting denylist** is checked on every `beat` and narrator line: "the
  energy of", "nobody asked for", "which is new", "it doesn't help", "and they
  both notice", "sits with it", "main character", "understood the
  assignment". The list grows as the read-throughs find more. No two beats
  in one pool may end on the same three words.
- Every `when` key is in `FACT_KEYS`.
- Every pool has at least 3 entries with no `when`.
- Scheme lines come only from the scheme-eligible. Every script tagged
  `scheme: true` (faking, love-bombing, gaslighting) is only picked for
  `schemeEligible` speakers, checked over 10 seasons.

## Task 9 — read the output

These pieces have to be done by reading; a passing suite will not catch them.
1. Dump one full played season as a transcript to the scratchpad, then read
   episodes 1, 6, 11 (Casa) and 15 end to end.
2. Fix every line that:
   - is an idiom near-miss;
   - has a speaker who knows too much;
   - has a reply that doesn't answer the line before it;
   - has a reason that contradicts the engine's decision.
3. Show the user one full episode transcript (not samples) before closing
   the plan.
4. Rerun `npm run audit:pm-spec` and record the new numbers in spec §15.

---

**Size:** about 1,000 scripts. Tasks 2–6 each end with their guards green and a
commit with named files only.

**Commit order:**
1. the renderer (Task 1), with the three readers moved off `tpl`;
2. the pools, one task per commit;
3. the guard and the audit (Tasks 7–8);
4. the read-through fixes (Task 9).

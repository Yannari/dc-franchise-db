# Perfect Match — the stretch and its fire pit: Implementation Plan

> **For agentic workers:** executed inline by the session that wrote it (user rule: no subagents). Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A Perfect Match season reads as stretches: each one is one main story and up to two smaller ones, every set-up is answered at or before its fire pit, every phase has a purpose, and each episode ends on a hook. Episodes run 300–350 lines.

**Architecture:** A new `js/pm/stretch.js` makes a plan at the start of each stretch (the episodes up to the next exit night) from the live threads. `threads.js` takes its headline from the plan, can't let a planned thread fade, and closes planned threads with an answer on the ceremony night. The fire pit (`moments.js` recoupleNight + `talk/recouple.js`) gets the facts it never had: whose partner was taken, and what the stretch's story was. Texture is cut and gated on subject. A season-read audit measures all of it.

**Tech Stack:** plain ES modules, vitest (`vitest.audit.config.js` for season audits).

**Spec:** `docs/superpowers/specs/2026-10-30-pm-stretch-payoff-design.md`

## Global Constraints

- Results are the engine's: a story never changes a pick. `desire()` is untouched.
- Stats proportional (`stat * factor`); thresholds only to choose text.
- Nice archetypes (hero, loyal-soldier, social-butterfly, showmancer, underdog, goat) never scheme or sabotage.
- No brand names; plain talk; every scene names its subject (memory: feedback_no_brand_names, feedback_bb_no_clever_lines).
- `{a}`/`{b}`/`{c}` are filled at render time; never write a name into a pool.
- New files must be `git add`ed (a committed import of an unadded file broke main once).
- Commit by path (`git commit -- <paths>`); other sessions have uncommitted work in `js/bb/`.
- Bump `PM_ENGINE` in `js/pm/season.js` once, when the engine changes.
- Episode target: 300–350 lines per villa episode; no phase under ~25 aired lines without a stretch story in it.

## Review Focus

1. **A stretch whose A story's cast is dumped or walks mid-stretch:** the plan must re-pick A at the next episode start, not keep beating a closed thread.
2. **Casa Amor** (`state.split`): the stretch is Casa; threads with one side in the other villa can't beat (`apart`).
3. **A ceremony with no recoupling** (public vote, villa vote): the answer to a graft is "stayed" or "gone", never a pick that didn't happen.
4. **First episode and the final week:** no plan on `first-coupling` (nothing set up) and none after the final recoupling (couples-only week).
5. **Resumed seasons** (`restoreFromAired`): `state.stretch` is rebuilt at the next episode start; a missing plan is not an error.

---

### Task 1: The season-read audit (baseline)

**Files:**
- Create: `tests/pm-stretch-audit.test.js` (runs under `vitest.audit.config.js`)
- Modify: `package.json` (script `audit:pm-stretch`)

Plays seeds 7, 12, 21 with the transcript cast (copy `makeIslanders` + names from `tests/pm-transcript-audit.test.js`), renders every event's lines through `js/pm/transcript.js` the same way that test does, and prints:
- lines per episode (mean, min, max, villa episodes only); lines per phase (mean)
- headline-thread payoff: of threads ever in a headline, closed by `faded`/`fizzled`/`settled` vs any other `why`
- fire pit: picks where the picked's partner before tonight was another picker (`tookFrom`), and how many rendered a `{c}` reaction line
- top 10 spoken lines (25+ chars) by count; episodes with a breakdown section; same-night duplicate goodbye lines

- [ ] Write it; run `npx vitest run --config vitest.audit.config.js tests/pm-stretch-audit.test.js`; paste the numbers into this plan under **Baseline**.
- [ ] Commit.

**Baseline (2026-10-30, seeds 7/12/21):**
- lines per villa episode: mean 495 / 498 / 539 (min ~300, max ~730)
- thin phases (<25 lines, no story): 19 / 18 / 15, mostly "It all gets too much" (6–24 lines)
- stories followed a season: 44 / 44 / 45; dropped (faded/fizzled/settled) 10% / 14% / 7%. The bigger leak
  is `shut` (6–8 a season): the same graft closes and REOPENS (seed 7 Sophie→Jordan: ep10 faded, ep18
  shut, ep23 open). Target after: about 20 followed a season, each A answered, no pair reopened inside
  three episodes of a `shut`.
- fire pit: 6 / 5 / 6 ceremonies; picks that took a partner 6 / 3 / 7; **named that partner: 0 / 0 / 0**
- breakdown sections: 17 / 14 / 15 episodes
- most-heard lines: 7–11× a season ("Like nothing was happening? That's never nothing." 9×,
  "Great. Thanks. Love that for me." 10×, "That's not a fair question." 11×)

### Task 2: The fire pit tells the truth

**Files:** `js/pm/moments.js` (recoupleNight, ~line 456), `js/pm/talk/recouple.js`, `tests/pm-firepit.test.js`

**Interfaces — Produces:** on every `recouple-pick` event, `extra.tookFrom` = the picked's partner before tonight when that partner is a picker tonight who hasn't chosen yet, else null; `extra.reclaimFrom` = for a reclaim, who picked the partner earlier tonight. Players array gets the third name (`{c}`) in both cases.

- [ ] Test: seed 7 transcript cast, ep 15: Keisha's pick of Dan has `tookFrom === 'Mia'`; Mia's pick of Dan has `reclaim && reclaimFrom === 'Keisha'`; Leah→Liam `tookFrom === 'Tasha'`; Tasha→Liam `reclaimFrom === 'Leah'`. Ep 13: Marcus→Leah `tookFrom === 'Josh'`.
- [ ] Implement in recoupleNight (state.couples is still pre-ceremony there; walk `r.picks` in order to know who had chosen).
- [ ] talk/recouple.js: `tookFrom` and `reclaimFrom` facts; speech, name and react entries for both (the partner on the bench reacting; the take-back citing the taker). Existing `stoleFrom` entries stay.
- [ ] Test: rendered lines of those picks name `{c}`. Run `npx vitest run tests/pm-firepit.test.js tests/pm-talk.test.js`.
- [ ] Commit.

### Task 3: The stretch plan

**Files:** Create `js/pm/stretch.js`; modify `js/pm/threads.js` (beginThreads headline), `js/pm/season.js` (call site, PM_ENGINE); test `tests/pm-stretch.test.js`

**Interfaces — Produces:**
- `exitNight(entry) -> boolean`: moment in `recoupling`, `public-vote`, `villa-vote`, `stick-or-twist`, `semi-final`, or `entry.dumping`/`entry.coupled`.
- `planStretch(state, schedule, entry, rng) -> void`: when `!state.stretch || state.stretch.ceremony < entry.ep` (or its A is over), sets `state.stretch = { from, ceremony, a, b, c, answers: {} }`; no plan on `first-coupling`, `final`, `reunion` or after the final recoupling.
- `storyScore(state, t) -> number`: proportional: heat + 0.6·(couple at stake: graft/doubt/secret) + 0.3·(cast loved by the public, ledger approval) + 0.2·episodes running unanswered + 0.4·(a cast member likely left standing, low romance with partner). Casa: A is null; the stretch's story is Casa.
- `planIds(state) -> string[]`: live A/B/C ids in order.

- [ ] Test: across seeds 7/12/21, every villa episode between ep 2 and the final recoupling has `state.stretch`; `_th.headline` starts with `planIds`; no two of A/B/C share all their cast.
- [ ] Implement; beginThreads puts `planIds` first then fills to `HEADLINES` with the rest by heat, and gives non-plan threads a cap of 1 beat (`th.used` cap) per episode.
- [ ] Run tests + `npm run audit:pm-stretch`.
- [ ] Commit.

### Task 4: Answered, not faded

**Files:** `js/pm/threads.js` (settle, secretBeat), `js/pm/stretch.js` (`answerStretch`), `js/pm/season.js` (call after the moment), talk for new kinds (`js/pm/talk/stretch.js`), test `tests/pm-stretch.test.js`

**Interfaces — Produces:**
- settle: a planned thread is exempt from `faded`/`fizzled`/`settled` until `state.ep > state.stretch.ceremony`.
- secretBeat: telling chance gains `+ 0.5 * closeness` where closeness = 1 − (ceremony − ep)/(ceremony − from + 1), for a planned secret.
- `answerStretch(state, rng, entry, m) -> Event[]`: after the moment on the ceremony night; for each planned thread still open: graft → `won` (t with c), `stayed` (t with p), `refused` (a refusal involving them tonight), `apart`; doubt → `recommit`/`ended`; secret not told → a `secret-kept` hut beat and the secret carries (stays open, eligible as next A); progress/spark → by partnerOf. Records `state.stretch.answers[id] = why` and closes with that `why`.
- Events pushed into the debrief: `stretch-answer` [the one it was about, a friend] — one scene per planned thread whose answer isn't already on screen at the fire pit.

- [ ] Test: across seeds 7/12/21, every thread that was ever A or B closes with a `why` not in `faded/fizzled/settled`, or carries as a secret with a `secret-kept` event.
- [ ] Implement + write `stretch-answer` and `secret-kept` talk (whole scripts, 6+ entries each by answer).
- [ ] Run tests + audit. Commit.

### Task 5: Speeches that cite, and the order of the picks

**Files:** `js/pm/recoupling.js` (runRecoupling order), `js/pm/moments.js`, `js/pm/talk/recouple.js`

**Interfaces — Consumes:** `state.stretch`, `answers`. **Produces:** recouple-pick `extra.story` ∈ `refusedTonight` (picked refused someone earlier tonight for the picker), `graftWon`, `stoodBy` (picker's partner was grafted on this stretch and picker picks them), `told` (picker learned a secret about the picked this stretch), `gameKiss` (picker/picked kissed someone else in this stretch's game), null.

- [ ] Order: within `regular`, pickers in the plan's A story pick last, B second last; the rest keep the shuffle. Test: same seed, A's decider is in the last two pickers.
- [ ] Audit: couple-changes per ceremony before/after printed; must stay within ±25% of baseline.
- [ ] Talk: speech entries per `story` value (several each), gated on reason where they'd contradict.
- [ ] Test: seed 7 ep 15 Priya's speech has `story === 'stoodBy'` (or `refusedTonight`) and names what happened. Commit.

### Task 6: Hooks

**Files:** `js/pm/stretch.js` (`hookFor`), `js/pm/season.js` (push after debrief), `js/pm/talk/stretch.js` (`hook` kind), `js/vp-pm/steps.js` (coldOpen reads `row.pm.hook`)

**Interfaces — Produces:** `hookFor(state, rng, nextEntry) -> Event|null`, kind `hook`, `extra.of` ∈ `text-recouple` (the next entry is an exit night: the text arrives), `text-date`, `text-challenge`, `unsure` (A's decider says they don't know), `seen` (someone in A sees something). Stored on the row as `pm.hook` (pre-rendered text, Serialization rule).

- [ ] Test: every villa episode before the final has a last event of kind `hook`; the next episode's cold open includes its text.
- [ ] Implement + talk. Commit.

### Task 7: Every phase has a purpose; 300–350 lines

**Files:** `js/pm/season.js` (TEXTURE, TEXTURE_KINDS), `js/pm/events.js` (texture gating), `js/pm/breakdown.js` (once a stretch), `js/pm/threads.js` (reactions only for plan stories)

- [ ] Texture `chat`/`friendship`/`comedy` need a subject fact (a story, a challenge, the last ceremony, a hook); otherwise skipped. Cut TEXTURE until the audit's villa-episode mean is 300–350.
- [ ] Breakdown section: at most once a stretch, and only for someone in A or B, or hurt at the last ceremony.
- [ ] Audit: per-phase lines; a phase < 25 lines with no plan story is printed as a finding. Fix by moving a plan beat there, not adding texture.
- [ ] Commit.

### Task 8: Games play the stretch

**Files:** `js/pm/challenges.js`, `js/pm/challenge-frame.js`, `js/pm/kiss-games.js` (casting reads `planIds`), their talk

- [ ] Kiss games: a pick within the rules prefers a plan story's pair (proportional weight, not forced); The Headlines / quiz cards draw from the plan's stories first.
- [ ] Set-up: `chal-buzz` for a plan story's cast says what they fear from this game. Aftermath (`challenge-frame.js`) feeds the plan (a kiss → a graft beat or a doubt beat for B).
- [ ] Test: a seed's game with a plan story in it shows a plan-cast moment. Commit.

### Task 9: Repetition limits

**Files:** `tests/pm-season-read.test.js` (3 seeds, synthetic cast; Season 1 cast if `franchise_roster.json` has one)

- [ ] No spoken line of 25+ chars more than twice a season; never twice in one episode.
- [ ] No two goodbyes on one night share a line; at most one breakdown section a stretch.
- [ ] A sentence naming the same islander twice in story kinds fails.
- [ ] Fix what fails (pool picks, pronouns). Commit.

### Task 10: Game styles and plan scenes

**Files:** Create `js/pm/game-style.js`, talk `game-plan`; modify `threads.js` tonightBeats.

**Interfaces — Produces:** `styleOf(state, n) -> 'genuine'|'safe'|'strategist'|'stirrer'` from intent (`win`/`money` → safe/strategist by strategic, `stir` → stirrer unless nice archetype), archetype, stats; turns `safe` after being dumped by a partner. `forecastPick(state, p) -> name` (desire with no dice). The day before an exit night, a non-genuine picker whose forecast is a steal or a safety pick over their partner gets a `game-plan` beat [p, friend, target, targetPartner]; the friend gains a secret.
- [ ] Test: audit prints plan scenes per season vs strategists cast; a cast with none has none.
- [ ] Commit.

### Task 11: Read and hand over

- [ ] Bump `PM_ENGINE`. Run `npm run audit:pm-spec` (nothing worse than before), `npm run audit:pm-stretch`, the PM suite.
- [ ] `npm run pm:transcript` seed 7; read episodes 13–15 beside `transcripts/pm-season-7-TEST-ep13-15.md`; fix what reads wrong.
- [ ] Commit and push; tell the user what to read.

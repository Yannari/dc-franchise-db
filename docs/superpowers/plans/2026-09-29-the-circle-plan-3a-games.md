# The Circle — Plan 3a: games, parties, apartment life, videos from home

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans (the user's standing rule: inline, no subagents). Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** the days between ratings feel like the real show — the Circle sets a game, every answer is public and has a consequence (a suspicion, a grudge, a bond, a named rival), someone wins a prize (a party, a new photo, a video from home, immunity), a themed party loosens everyone's guard, players are seen alone in their apartments doing the things that make them who they are, and a video from home lands late in the season.

**Architecture:** a game is **data** (`js/ci/games-data.js`: name, family, purpose, prize, the Circle's own words, prompts) run by **one engine per family** (`js/ci/games.js`). Ten families cover the 53 real games (the research below). Parties (`js/ci/party.js`) and apartment life + videos from home (`js/ci/life.js`) are their own small modules. The schedule marks which days get a game and a party; `season.js` runs them between the chats and the ratings. Every new scene kind gets a writing builder in `script.js`, pools under `js/ci/lines/`, and airs.

**Tech Stack:** ES modules; vitest + jsdom; `streamFor(seed, salt)` dice.

**Spec:** `docs/superpowers/specs/2026-09-29-the-circle-design.md` — §13 (games, parties, apartment life, videos from home), §2.5 (rhythm of an episode), §17 (writing). Plan 3b (blocking formats, powers, the Season Timeline) follows this plan.

## Research (2026-09-29, the US transcripts)

Source: Springfield! Springfield! transcripts of US seasons 1–6 (77 episodes), downloaded to the session scratchpad (`circle-tx/sNNeMM.txt`, not committed — Forever Dreaming now sits behind a JS challenge). The fandom wiki's game pages are one line each; the transcripts are the source.

What the transcripts show, which this plan builds:

- **The Circle announces a game as an app**, a player reads the rules aloud in quotes: *"Circle, open Ice Breaker app." — "All Players will be shown a series of statements. You must decide if you agree or disagree with each statement."* (1×01). *"This is your chance to send one Player a question without them knowing it's from you."* (1×03, Ask Me Anything). *"You must compose a message to explain why you deserve to win over your biggest rival in The Circle."* (1×10, State Your Case).
- **Answers are public, and the room draws conclusions out loud**: Sammie is the only woman to agree "It's okay to pee in the shower" — *"She might be a dude. All I can say."* (1×01). The host: *"we want everyone in everyone's business, so they'll all know how each other voted."*
- **Consequences outlive the game**: Sammie brings up in 1×06 that Rebecca called her a catfish in 1×03's Ask Me Anything; the anonymous question (*"Are you really shy, or is that a front for easy likability?"*) earns a twin-sister answer that wins the room.
- **Most Likely** (1×11): *"You must decide which player you think fits each statement."* — "Most likely to die in a zombie apocalypse", "to run for President" (everyone says Shubham: *"he's been an influencer four times"*), "Most likely to remain friends with you". Named players reply in chat.
- **Make-and-judge** (1×04, Nailed It/Failed It): *"Players must put their cake-making skills to the test. You have 30 minutes to recreate this colorful masterpiece… The cake that gets the most likes will earn their baker a special prize. Everything you need has been delivered to your door. Your time starts now!"* — flour everywhere, then *"Time's up"*, photo to the Newsfeed, likes decide.
- **Team trivia** (1×07): the two captains are the day's **newcomers**, who scout profiles before picking (*"This is someone I definitely need to become friends with because I don't want her to be competition"*); *"The winning team will each receive a video message from home!"*
- **Party games in Circle Chat** (1×02, Never Have I Ever): answers become facts about people (*"She seems like she's bisexual"*), flirting spikes.
- **Videos from home** (1×07): a best friend, a wife and a dog; *"I'm being such a baby."* The catfish (Adam, played by Alex) hears his wife — the person the profile hides.
- Apartment life is the host's material: *"while Chloe pretends that she's in a gym locker room"*, *"Now, while Ed makes little steps in the gym"*.

### The ten families

| Family | Real games | What happens | Consequence |
|---|---|---|---|
| `statement` | Ice Breaker, Been There Done That, For Real For Real, Risky Quizness, Pick 3 | agree / disagree (or yes / no) on each statement; all answers shown | same answer → a little warmth; the odd one out draws attention; a catfish's answer can contradict the persona (a slip) |
| `name` | Most Likely, Circle Scenarios, Circle Yearbook, Circle Awards, It's Giving Awards, Make Out Marry Murder, Naughty and Nice | name a player for each statement, in the open | named for something bad → a grudge toward the namers; named for something good → warmth and a lift |
| `ask` | Ask Me Anything, Don't @ Me, Oh We Are Going There, #CircleAMA, Honest Reviews | each sends one anonymous question; the asked answers in public | a catfish question is a public probe; a barbed one stresses; a good answer wins the room; the asked guesses the asker |
| `guess` | Says Who?, Who Are You?, Flashback Photos & Quiz, Kray Pop, I'm Only Human | facts or answers without names; everyone guesses whose | a catfish's own fact can give them away (a slip, noticed by many) |
| `make` | Nailed It/Failed It, Batter Up, Glammequins, Portrait Mode, Paint the Player, G.O.A.T., Poor-Traits, Rap It Up, Poetry Slam, Head to Head, Roast | make something (often about another player); photo to the Newsfeed; likes judge | the winner takes the prize; a portrait that mocks its subject is a public jab |
| `photo` | Hashtag This, Two Faced, Throwback Thirsty, This Is Me, Naughty and Nice (photos) | post a photo; the room reacts | attraction and warmth to the poster; a catfish's photo can slip |
| `team` | Trivia Night, Geek Chic Quiz, Let's Get Quizzical | two captains pick teams in turn; team score | teammates bond; the last one picked feels it; winners take the prize |
| `gift` | Night of Endless Heartbreak, Bake for Your Bestie, Democracy Day | each gives one player something; givers revealed | the receiver warms to the giver; the room learns who is close; nobody-picked is lonely |
| `rival` | State Your Case, Head to Head (the naming part) | name your biggest rival and why you deserve it more | a public target: the rival resents it, others learn it |
| `flirt` | Talk Flirty to Me | the most attracted pairs flirt on a virtual date | attraction rises where it is mutual |

## Global Constraints

- **Stats are proportional** (CLAUDE.md): every choice is `stat * factor` + dice; thresholds only pick words.
- **Nice archetypes never scheme** (`schemeEligible`): a nice player's portrait is never a jab, their anonymous question is never barbed, their rival statement is never a lie.
- **The engine writes no English** except the Circle's own prompts and game names in `games-data.js` (the Circle's words, quoted on screen). Players' words come from pools.
- **In-universe only**: trivia and quiz prompts name no real celebrity, brand or place (the World Tour rule).
- **Every scene has a consequence** (bond, belief, mood or state change) and airs.
- **Its own dice**: `streamFor(state.seed, 'game:<day>')`, `'party:<day>'`, `'life:<day>'`. No `Math.random`.
- **Games cannot break the season shape**: the same number of blockings, the same finalists; `tests/ci-season.test.js` still passes.
- **Writing rules from Plan 2 hold**: players know profiles only; host pronouns only beside `{a.aka}`; a context that must never get a generic line gets its own key; US English; fluent, not clever.
- Commit after every task with named files only; never `git add -A`, never `git stash`.

## Review Focus

1. **A game on a day with three players left** (late season): every family must run with 3–4 players (no empty teams, no one to name). Pinned in Task 3.
2. **A shared profile** answers once (the pair agree), never twice. Pinned in Task 3.
3. **Immunity from a prize** must survive to the next blocking and then clear, and never protect a player in the final ratings. Pinned in Task 5.
4. **A game never repeats** in a season, and the purposes spread (not four `divide` games in a row). Pinned in Task 2.
5. **Knowledge**: a named-for-something line or a gift reveal is public; a prize video is private to the apartment; nothing a player learns in their apartment reaches another player's line. Pinned in Task 10.

---

## File structure

| File | Responsibility |
|---|---|
| `js/ci/games-data.js` | the game library: id, name, family, purpose, prize, rules (the Circle's words), prompts; party themes |
| `js/ci/games.js` | `pickGame`, `runGame` and one runner per family; prizes |
| `js/ci/party.js` | `runParty`: theme, props, party game in Circle Chat, effects |
| `js/ci/life.js` | habits per player, `apartmentLife`, `videoFromHome` |
| `js/ci/schedule.js` (modify) | mark `game`, `party`, `homeVideos` days |
| `js/ci/season.js` (modify) | run them in the day |
| `js/ci/airing.js` (modify) | the new kinds always air; two life scenes a day |
| `js/ci/script.js` (modify) | builders for `game`, `prize`, `party`, `life`, `home-video`; `{q}` and `{game}` text slots; host bridges over games |
| `js/ci/lines/games.js`, `party.js`, `life.js` | pools |
| `tests/ci-games.test.js`, `tests/ci-party-life.test.js` | engine tests |
| `tests/ci-spec-audit.test.js` (modify) | games per season, purposes, prizes, consequences |

---

### Task 1: The game library (data) and its guard

**Files:** Create `js/ci/games-data.js`, `tests/ci-games.test.js`

**Interfaces — Produces:**
```js
export const FAMILIES = ['statement','name','ask','guess','make','photo','team','gift','rival','flirt'];
export const PURPOSES = ['bond','learn','catfish','divide'];
export const PRIZES = ['party','photo','video','immunity','gift','none'];
export const GAMES = [ { id, name, family, purpose, prize, source, rules: [string], prompts: [...] } ];
export const PARTY_THEMES = [ { id, name, props: [string] } ];
```
Prompt shapes by family: `statement` → `{ id, text, stat, lean }` (agreeing leans on `stat`, sign `lean` ±1); `name` → `{ id, text, tone: 'good'|'bad'|'funny' }`; `make` → `{ id, text, stats: [..], about: bool }` (about: the thing portrays another player); `guess` → `{ id, text }` (a fact slot the player fills from their profile); `team` → `{ id, text }` (a category); `ask`, `photo`, `gift`, `rival`, `flirt` → the rules alone.

- [ ] **Step 1: Write the failing guard**

```js
import { describe, expect, it } from 'vitest';
import { GAMES, FAMILIES, PURPOSES, PRIZES, PARTY_THEMES } from '../js/ci/games-data.js';
import { foreignWordsIn } from './helpers/show-vocabulary.js';

const VALID_STATS = ['physical','endurance','mental','social','strategic','loyalty','boldness','intuition','temperament'];
describe('the game library', () => {
  it('has the real games, each with a family, a purpose, a prize, a source and the Circle\'s rules', () => {
    expect(GAMES.length).toBeGreaterThanOrEqual(40);
    const ids = GAMES.map(g => g.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const g of GAMES) {
      expect(FAMILIES, g.id).toContain(g.family);
      expect(PURPOSES, g.id).toContain(g.purpose);
      expect(PRIZES, g.id).toContain(g.prize);
      expect(g.source, g.id).toMatch(/^(US|UK) \d/);
      expect(g.rules.length, g.id).toBeGreaterThan(0);
    }
    for (const f of FAMILIES) expect(GAMES.some(g => g.family === f), f).toBe(true);
  });
  it('gives the families that need prompts enough of them, on real stats', () => {
    for (const g of GAMES) {
      if (['statement','name','guess','team','make'].includes(g.family)) expect(g.prompts.length, g.id).toBeGreaterThanOrEqual(g.family === 'make' ? 1 : 4);
      for (const p of g.prompts || []) {
        if (p.stat) expect(VALID_STATS, `${g.id}/${p.id}`).toContain(p.stat);
        for (const s of p.stats || []) expect(VALID_STATS, `${g.id}/${p.id}`).toContain(s);
      }
    }
  });
  it('writes in US English, names nobody real, and borrows no other show\'s words', () => {
    const texts = GAMES.flatMap(g => [g.name, ...g.rules, ...(g.prompts || []).map(p => p.text)]);
    const UK = /\b(colour|favourite|mum|realise|whilst|apologise|organise|mate|bloody|fancy)\b/i;
    for (const t of texts) {
      expect(t).not.toMatch(UK);
      expect(t).not.toMatch(/\{/);
      expect(foreignWordsIn(t, 'the-circle')).toEqual([]);
    }
    expect(PARTY_THEMES.length).toBeGreaterThanOrEqual(8);
  });
});
```

- [ ] **Step 2:** `node node_modules/vitest/vitest.mjs run tests/ci-games.test.js` → FAIL (module not found).
- [ ] **Step 3: Write `games-data.js`.** Every game in spec §13.2 that the transcripts show, with `rules` taken from the transcript's quoted Circle lines where one exists (Ice Breaker, Ask Me Anything, State Your Case, Most Likely, Nailed It, Trivia Night quoted above — copy them; for the rest, read the source episode in `circle-tx/` and copy the Circle's words; if the transcript has none, write one plain sentence in the same voice). Prompts: at least 6 statements for each `statement` game (e.g. Ice Breaker: "It's okay to pee in the shower." `stat: 'boldness', lean: 1`; "You should always tell your partner the truth, even if it hurts." `stat: 'loyalty', lean: 1`), 6 statements for each `name` game (1×11's three verbatim, then more in the same register with a `tone`), categories for trivia (in-universe: "Movie night", "Food and drink", "Animals", "Science class", "Music", "Around the house"). Party themes from spec §13.4: welcome, 90s, glam, Circle Fest, wedding, zombie pep rally, camping, Animal Instincts — each with 3 props ("glow sticks", "a wig", "a disposable camera").
- [ ] **Step 4:** run → PASS.
- [ ] **Step 5: Commit** `git add js/ci/games-data.js tests/ci-games.test.js && git commit -m "feat(the-circle): the game library — 40+ real games in ten families, in the Circle's words"`

### Task 2: Which game, which day

**Files:** Modify `js/ci/schedule.js`, `js/ci/games.js` (create), `tests/ci-games.test.js`, `tests/ci-schedule.test.js`

**Interfaces — Produces:** schedule days gain `game: boolean`, `party: boolean`, `homeVideos: boolean`. `pickGame(state, rng) → game` (never a used id; `state.gamesPlayed: [id]`).

Rules: day 1 has a game (a `learn` one, as 1×01's Ice Breaker); every social day has a game and a party; every other rating day in the middle has a game; the final-ratings and finale days have none. `homeVideos` is the day two before the final ratings (a late-season ritual when no one won one as a prize). `pickGame` weights: purpose `learn` early (days ≤ 3) ×3; `catfish` ×(1 + mean suspicion in the room × 3); `divide` late (last third) ×2; the same purpose as the previous game ×0.3; `team` needs ≥ 6 players; `flirt` needs one mutually attracted pair; `gift`/`name`/`rival` need ≥ 3.

- [ ] **Step 1: Failing tests**

```js
import { buildSchedule } from '../js/ci/schedule.js';
it('puts a game on day one, on every social day and on every other middle rating day, and none at the end', () => {
  const s = buildSchedule({ total: 13, starters: 8 });
  expect(s[0].game).toBe(true);
  for (const d of s.filter(x => x.slot === 'social')) { expect(d.game).toBe(true); expect(d.party).toBe(true); }
  expect(s.filter(d => d.final || d.finale).every(d => !d.game)).toBe(true);
  expect(s.filter(d => d.homeVideos)).toHaveLength(1);
  expect(s.filter(d => d.game).length).toBeGreaterThanOrEqual(7);
});
```
and in `ci-games.test.js`:
```js
it('never repeats a game, opens with a learn game and spreads the purposes', () => {
  // a fake state with 10 active profiles, days 1..12, pick one game per day
  ... expect(new Set(played).size).toBe(played.length);
  expect(GAMES.find(g => g.id === played[0]).purpose).toBe('learn');
  // no purpose three times in a row
});
it('does not pick a team game with five players, or a flirt game with no mutual pair', ...);
```
- [ ] **Step 2:** run → FAIL. **Step 3:** implement. **Step 4:** PASS, and `tests/ci-season.test.js` still passes (the new schedule fields change no result yet). **Step 5:** commit.

### Task 3: Public-answer families — statement, name, gift, rival

**Files:** `js/ci/games.js`, `tests/ci-games.test.js`

**Interfaces — Produces:** `runGame(state, rng, game) → scene` (kind `'game'`, `data: { gameId, family, rounds: [{ promptId, answers: { [handle]: value } }], results, prize: { kind, to: [handles] } | null }`, seen by all active). One runner per family; this task does four.

Rules (all proportional):
- **statement:** `agree` with probability `clamp(0.5 + lean * (S(h, stat) - 5) / 10 + (rng() - 0.5) * 0.4, 0.05, 0.95)`. Pairs who answered the same: `bump(a, b, 'affection', 0.15)` each way. A lone answer: every observer `nudgeBelief(obs, h, 'real', -0.02 * S(obs,'intuition')/10)`. Each answer by a catfish calls `rollSlips(state, rng, h, all, { specific: 0.4, attention: 0.7 }, sc)` (the answer can contradict the persona).
- **name:** each voter names one other player per prompt: `good` → the highest `affection + rng()*2`; `bad` → the highest `resentment + belief.threat*0.3 + rng()*2` (a nice archetype picks `bad` targets by lowest affection instead — they will not name a rival out of spite); `funny` → `affection` only. The named player, for each namer: `bad` → `bump(named, namer, 'resentment', 0.6)`, `feel(named, 'stress', 0.5)`; `good` → `bump(named, namer, 'affection', 0.5)`, `feel(named, 'elation', 0.5)`. The player named most on a `good` prompt gets `elation +1` and every voter `nudgeBelief(voter, named, 'threat', +0.3)` (1×11: "he's been an influencer four times").
- **gift:** each gives to the highest `affection + attraction*0.5 + rng()`. Receiver: `bump(receiver, giver, 'affection', 1.0)`. Public: each observer `noteAlly(obs, giver, receiver)`. Nobody gave to you: `feel(h, 'loneliness', 2)`.
- **rival:** each names the highest `belief.threat + resentment*0.5 + rng()`; `makeClaim({ kind: 'targeting', holder: namer, about: rival, truth: true, secrecy: 'public', by: namer })`, everyone `learn`s it; `bump(rival, namer, 'resentment', 1.2)`, `feel(rival, 'stress', 1)`.

A shared profile is one answerer (its handle), never two. Every runner works with 3 players.

- [ ] **Step 1: Failing tests** (one per family, on a `room()` helper like `ci-script.test.js`'s, with 3 and with 8 profiles):
```js
it('a statement: everyone answers once, the same-answer pairs warm, a catfish may slip', ...);
it('a name game: the named-for-bad resent their namers, the named-for-good lift', ...);
it('a gift game: every giver gives once, the receiver warms, nobody-picked is lonely', ...);
it('a rival game: every rival is public knowledge and resents the namer', ...);
it('runs every public family with three players, and a shared profile answers once', ...);
```
- [ ] **Step 2:** FAIL. **Step 3:** implement. **Step 4:** PASS. **Step 5:** commit.

### Task 4: Catfish tests — ask and guess

**Files:** `js/ci/games.js`, `tests/ci-games.test.js`

- **ask:** each player asks one other anonymously. Target: the lowest `belief.real` if it is under 0.6 (a catfish question — the target's answer is a public probe: `probe(state, rng, asker, target, sc)`, and every other player also sees the result: on `fail` each observer `nudgeBelief(obs, target, 'real', -0.1)`, on `pass` +0.05); otherwise, for a scheme-eligible asker, the highest resentment (a barbed question: `feel(target, 'stress', 1)`), else the one they know least (a friendly question: `bump(target, asker, 'affection', 0.3)` once revealed). The asked guesses the asker with probability `S(target,'intuition')/15`; a right guess on a catfish or barbed question: `bump(target, asker, 'resentment', 1)`.
- **guess:** each player submits a fact; for each fact, every other player guesses whose. A catfish's fact rolls `rollSlips(state, rng, h, all, { specific: 0.6, attention: 0.8 }, sc)`. A player whose fact everyone places correctly: `nudgeBelief(obs, h, 'real', +0.04)` from each (they read as consistent).

- [ ] **Step 1: Failing tests**
```js
it('an ask game: a suspected player is probed in public, and a failed answer costs them with everyone', ...);
it('an ask game: a nice player never sends a barbed question', ...);
it('a guess game: a catfish is likelier to slip than an honest player (500 trials, control arm)', ...);
```
The last one is a control-arm test (memory: control arm, not base rate): the same room with the catfish's `gap` set to 0 must slip less.
- [ ] Steps 2–5 as above.

### Task 5: Make, photo, team, flirt — and the prizes

**Files:** `js/ci/games.js`, `tests/ci-games.test.js`

- **make:** each maker's quality = mean of the prompt's `stats` + `rng()*3`. If `about`, each maker is assigned another player (a derangement); the portrayal is a jab when the maker is scheme-eligible and `resentment > affection`, else flattering. A jab: public claim `distrusts` (holder maker, about subject), `bump(subject, maker, 'resentment', 1)`. Likes: every player likes the three best by `quality + affection(liker, maker)*0.3`; the most likes wins.
- **photo:** each posts; each viewer: `bump(viewer, poster, 'affection', 0.2)` and, if `attractionOk(viewer, poster)`, `bump(viewer, poster, 'attraction', 0.4)`. A catfish's photo rolls `rollSlips(..., { specific: 0.2 })`.
- **team:** captains are the day's newcomers if there are two, else the top two of the last rating. Picks alternate: each captain takes the highest `affection + S(pick,'mental')*0.3 + rng()`. The last pick: `feel(last, 'loneliness', 1.5)`, `bump(last, captain, 'resentment', 0.4)` for both captains. Team score: mean `mental` + `rng()*2`. Teammates: `bump` affection 0.4 pairwise.
- **flirt:** the two most mutually attracted pairs (`attractionOk` both ways) flirt: `bump` attraction 1 each way, `feel(elation, 1)`.

**Prizes** (`awardPrize(state, rng, game, winners)`):
- `party` → `state.partyNext = true` (the next day's evening becomes a party).
- `photo` → each winner: every other player `bump(o, winner, 'affection', 0.2)`; a catfish winner picks a new persona photo (no slip).
- `video` → `state.homeVideoFor.push(...winners)` (played that evening in `life.js`).
- `immunity` → `state.immuneNext[winner] = true` (the standard blocking already honors and clears it; the final ratings ignore it).
- `gift` → the winner runs a one-player `gift` round.

- [ ] **Step 1: Failing tests**
```js
it('a make game: a nice maker never draws a jab, and the most-liked maker wins the prize', ...);
it('a team game: captains are the newcomers when there are two, teammates bond, the last pick hurts', ...);
it('immunity from a prize protects its winner at the next blocking, then clears, and means nothing in the final ratings', ...);
it('a video prize is recorded for the winners only', ...);
```
- [ ] Steps 2–5 as above.

### Task 6: Parties

**Files:** Create `js/ci/party.js`; modify `js/ci/feed.js` (the party flag moves here); `tests/ci-party-life.test.js`

`runParty(state, rng, { theme })` → a `party` scene (`data: { theme, props, game: 'nhie', rounds: [{ by, statement, admitted: [handles] }] }`) followed by the party Circle Chat (`runCircleChat(state, rng, { party: true })`). Never Have I Ever: 4 rounds, each asked by the boldest remaining player; each player admits with probability `S(h,'boldness')/12 + rng()*0.3`; an admission is a public fact (no claim kind — it moves attraction: every attracted observer `bump(obs, h, 'attraction', 0.3)`), and a catfish admission rolls a slip with `{ specific: 0.5, party: true }`. Effects: `feel(h, 'loneliness', -2)` for all; flirty pairs `bump(attraction, 0.5)`. The theme is drawn from `PARTY_THEMES` without repeats.

- [ ] Tests: themes never repeat; a party lowers loneliness for everyone; a catfish slips more at a party than in an ordinary Circle Chat (control arm). Steps 2–5.

### Task 7: Apartment life and videos from home

**Files:** Create `js/ci/life.js`; `tests/ci-party-life.test.js`

- **Habits:** on join, each profile's people draw 2 habits from `HABITS` weighted by stats and archetype: `workout` (physical), `skincare` (social), `cooking` (temperament, low = kitchen disasters), `reading` (mental), `singing` (boldness), `plushie` (loneliness-driven: talks to a stuffed animal), `praying` (loyalty), `pacing` (strategic, paranoia). Stored `state.habits[handle] = [ids]`.
- **`apartmentLife(state, rng)`**: each day, the two players with the highest `loneliness + stress + rng()*2` get a `life` scene with one of their habits. Consequence: `feel(h, 'loneliness', -0.8)` (the routine helps) or, for `pacing`, `feel(h, 'paranoia', +0.5)`.
- **`videoFromHome(state, rng, handles)`**: a `home-video` scene per player, seen by that player only (`seenBy: [h]`). `feel(h, 'homesick', -4)`, `feel(h, 'loneliness', -3)`, `feel(h, 'elation', 2)`; a catfish also `feel(h, 'guilt', 1.5)`. On `homeVideos` days, everyone who has not had one gets one.

- [ ] Tests: habits are stable across the season and valid; life scenes go to the loneliest; a home video is seen by its player only; a catfish's video adds guilt. Steps 2–5.

### Task 8: Wire the day

**Files:** `js/ci/season.js`, `js/ci/airing.js`, `tests/ci-season.test.js`, `tests/ci-airing.test.js`

Day order (spec §2.5): morning feed → arrivals → **apartment life** → chats → **the game** (and its prize) → Circle Chat or **party** (a party when `d.party || state.partyNext`, then clear `partyNext`) → **home videos** (prize winners, or everyone on `homeVideos` day) → ratings / blocking. `game`, `party`, `home-video` always air; `life` airs two a day.

- [ ] **Step 1: Failing tests**
```js
it('plays a game on every game day, a party on every party day, and videos from home once', ...);
it('still ends with five finalists and the same number of blockings', ...);   // existing test keeps passing
it('keeps the season plain JSON and replays identically from its seed', ...); // existing tests keep passing
```
- [ ] Steps 2–5. Then run `tests/ci-*.test.js` — all pass.

### Task 9: The audit

**Files:** `tests/ci-spec-audit.test.js`

Add: games per season (target 7–10), families and purposes played (all ten families appear across 100 seasons; no purpose > 40%), prizes by kind, immunity wins that changed a blocking, slips from games vs from chats, parties per season, home videos per player. Re-read the Plan 1 targets: catfish win rate, influencer 3+, newcomer in final — record before/after in the commit message (games add slips and grudges; say what moved).

- [ ] Commit with the numbers.

### Task 10: The writing — builders and slots

**Files:** `js/ci/script.js`, `tests/ci-script.test.js`, `tests/ci-lines.test.js`

- Two text slots filled from the block's `extra`: `{q}` (the Circle's words: a rule or a prompt, quoted as a player reads it aloud) and `{game}` (the game's name). `fill` takes them from `cast.text`; the guard's `OK_SLOT` accepts `{q}` and `{game}`.
- Builders:
  - `game`: `game.open` (a player reads the rules — `{q}` = `rules[0]`, `{game}`); per round, `game.<family>.round` with `{q}` = the prompt and a/b = two answerers whose answers differ (or the named player and a namer); one `game.<family>.react` for the consequence (the lone answer noticed, the named-for-bad player replying, the gift reveal, the rival reply); `game.prize.<kind>` for the winner.
  - `party`: `party.open` (props delivered, theme in `{game}`), `party.nhie` per round, then the party Circle Chat as today.
  - `life`: `life.<habit>` (one player; the host usually has a line — the host bridge treats `life` as light).
  - `home-video`: `home.video` (a: the player; the family member speaks on video, unnamed: "your mom", "your best friend" — never a name).
- Knowledge (Review Focus 5): a `home.video` block is seen by its player only; no other scene's facts read it.
- `POOL_KEYS` gains every new key.

- [ ] Tests: a game scene yields `game.open` first, a round block per round with `{q}` filled, and a prize block when there is a prize; `{q}` never reaches a transcript unfilled; the home video's facts are private. Steps 2–5.

### Task 11: The pools

**Files:** Create `js/ci/lines/games.js`, `js/ci/lines/party.js`, `js/ci/lines/life.js`; modify `lines/index.js`

Per family: `game.<family>.round` ≥ 8 entries, `game.<family>.react` ≥ 6, with conditioned entries for the pair facts (friends, rivals, suspects) — in the register of the research above: answers said aloud and then sent ("Agree." / "Hell no. What?" / "Who doesn't pee in the shower?"), named players replying in chat, a captain scouting profiles out loud. `game.open` ≥ 8, `game.prize.<kind>` ≥ 4 each, `party.open` ≥ 8 (props: "We got pizza. Yeah, buddy!"), `party.nhie` ≥ 10, `life.<habit>` ≥ 4 each, `home.video` ≥ 8 (with `catfish: true` entries where the video names the life the profile hides — never a name). Host bridges: `host.game` ≥ 6, `host.life` ≥ 8 (jokes from what they are doing: "while Chloe pretends she's in a gym locker room").

- [ ] Guards pass (three plain entries per key, US English, no names, CLEVER list, answered questions). Commit.

### Task 12: Read the output

1. `CI_SEED=7` and `CI_SEED=19` transcripts. Read end to end: a social day with a game and a party, a rating day with a game, the home-video day.
2. Fix what is wrong (the Plan 2 bug classes: invented past, knowledge leaks, a reaction that does not fit what it reacts to, generic lines where a context needs its own key).
3. Run the audit; top up the hardest-worked new pools.
4. Commit; push to main after merging `origin/main`; 0 apart.

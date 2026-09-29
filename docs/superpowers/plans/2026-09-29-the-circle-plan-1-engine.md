# The Circle — Plan 1: registry and headless engine

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. **This user's standing rule: work inline, no subagents** — use executing-plans.

**Goal:** Register the sixth show and build a headless engine that plays a whole season of The Circle — profiles drawn from an authored Catfish Pool, beliefs, emotions, claims that spread, catfish slips and probes, private chats with decided outcomes, ratings with styles and inference, the Hangout, blocking, visits, goodbye videos, newcomers, the final ratings and the meet — measured by `npm run audit:ci-spec`.

**Architecture:** The Perfect Match / Traitors shape. `playCircleSeason()` replaces `gs` with its own, plays every day, writes one `gs.episodeHistory` row per day stamped `format: 'the-circle'`, and keeps Circle state on the returned `state`. Every decision takes its dice from `streamFor(seed, salt)` (`js/dr/rng.js`), so one day's draws never move another's. Relationships live in the shared `js/relationships.js` store, keyed by **profile handle** (`@maddie`) during the season; at a reveal they are converted into person-to-person records (`Bridgette→Alejandro`). The engine writes **scene records** (`{ id, day, kind, who, seenBy, data }`) and no prose: Plan 2 turns scenes into lines.

**Tech Stack:** ES modules, no build step; vitest + jsdom (`npx vitest run <file>`; audits through `vitest.audit.config.js`).

**Spec:** `docs/superpowers/specs/2026-09-29-the-circle-design.md` — read §1, §3, §4, §5, §7–§12, §15, §16 and §21 before starting. `docs/ADDING-A-SHOW.md` is the manual it cites (§N).

## Roadmap (this plan is 1 of 6, spec §22)

1. **This plan** — registry entry (not yet runnable) + headless engine + `audit:ci-spec`.
2. **Writing** — scripts, dictation, voices, host, cross-cuts, all pools, `ci:transcript`.
3. **Game library and twists** — games, parties, apartment life, every blocking format, powers, arrival formats as timeline cards.
4. **The Circle tab** — `js/ci-run.js`, the runnable flag, dispatch in both `run-ui.js` sites, `CONFIG_SCOPE`, the Catfish Pool panel, Profile Plan overrides, face catalogue, Photos panel. *(Moved here from Plan 1 on purpose: Perfect Match kept its flag unset until its run tab existed, so a half-built show could not be started from the setup screen. Spec §22 is updated in Task 1 to say so.)*
5. **Screens** — the approved stage.
6. **The site** — export, ratings reader, social pack, wiki, ledger write.

## Global Constraints

- Only the nine stats exist: `physical, endurance, mental, social, strategic, loyalty, boldness, intuition, temperament`. No new stats.
- Gameplay is proportional (`stat × factor`). Thresholds only for narration labels and for the franchise's scheme-eligibility rule.
- Archetypes: the fifteen franchise archetypes only. Nice archetypes (`hero, loyal-soldier, social-butterfly, showmancer, underdog, goat`) never scheme; neutrals scheme only with `strategic >= 6 && loyalty <= 4`. On this show a *strategic* catfish, planting a claim you know is false, and lying about a visit are schemes; a protective or family catfish is not (spec §4.4).
- Relationships live only in `js/relationships.js`. No Circle copy of any relationship number (ADDING-A-SHOW §11.5 Q).
- A player's decision reads their own relationships, their own beliefs (`js/ci/beliefs.js`) and their own mind — never another profile's truth, and never public approval or fame.
- Every belief change names the scene that caused it, and the observer must be in that scene's `seenBy` (spec §5.2; ADDING-A-SHOW §11.5 D). `nudgeBelief` throws otherwise.
- No `Math.random()` anywhere under `js/ci/`. Dice come from `streamFor(seed, salt)`.
- Only `js/ci/public.js` may import Perfect Match's ledger (`js/pm/ledger.js`); decisions never read approval (guarded in Task 13).
- State is plain JSON: no `Set`, no `Map`, no functions on `state` (CLAUDE.md, Serialization).
- The engine writes no English. Scenes carry kinds and data; Plan 2 writes the words.
- Slug `the-circle`, prefix `ci`, exit verb `blocked`, player word `player`, constant `CIRCLE_FORMAT`.
- Run the affected test files while iterating; run the full `npm test` once at the end of Task 1 and Task 14.
- Commit after every task; `git add` named files only, never `-A` (the tree carries unrelated user work). Never `git stash`.

## Review Focus

1. **A pool smaller or larger than the cast wants.** An empty pool must give a season with no catfish and no crash; a pool of 20 for 10 players must leave personas unused (spec §4.3a). Pinned in Task 3.
2. **A player pinned to a persona id that is not in the pool.** It must be ignored (the player goes through the normal draw), not crash or silently steal another persona. Pinned in Task 3.
3. **Very small and very large casts.** 7 players (2 blockings) and 18 players must both build a schedule that ends with exactly `finalists` active players. Pinned in Tasks 12 and 13.
4. **Ties.** A tie for second makes three influencers; a tie in the final ratings goes to the player with more first places over the season. Pinned in Tasks 9 and 13.
5. **Replaying a season.** The same seed must give byte-identical rows, and changing the pool's bios (not who is in it) must not change who catfishes. Pinned in Tasks 3 and 13.

---

## File structure

| File | Responsibility |
|---|---|
| `js/shows.js` (modify) | the registry entry, `CIRCLE_FORMAT` |
| `js/quick-setup.js`, `js/settings.js`, `js/social/adapter.js` (modify) | picker tag, host placeholder, the apartments setting, social words |
| `tests/helpers/show-vocabulary.js` (modify) | the show's own words |
| `js/ci/state.js` | the season state, scenes, relationship shorthands, scheme eligibility |
| `js/ci/profiles.js` | truths, catfish motive, the Catfish Pool draw, profiles, texting voice |
| `js/ci/beliefs.js` | what each player believes about each profile; the witnessed-only rule |
| `js/ci/mind.js` | loneliness, paranoia, stress, guilt, elation, homesickness |
| `js/ci/claims.js` | claims, learning, passing on, collisions |
| `js/ci/slips.js` | slip risk, noticing, probes, theories |
| `js/ci/reveal.js` | a profile's truth reaching a player; profile-to-person conversion (spec §5.4) |
| `js/ci/chat.js` | intents, utilities, the day's chat plan |
| `js/ci/conversation.js` | running one chat: outcome first, then turns, effects, claims, slips |
| `js/ci/ratings.js` | ballots, styles, pacts, results, ties, reveal order, inference |
| `js/ci/hangout.js` | influencer deliberation and negotiation |
| `js/ci/blocking.js` | the standard blocking, the visit, the goodbye video |
| `js/ci/arrivals.js` | newcomers (snoop-and-choose entry), immunity |
| `js/ci/public.js` | approval and fame from aired scenes; Fan Favorite |
| `js/ci/schedule.js` | days from the cast: rating days, social days, arrivals, the final |
| `js/ci/finale.js` | final Circle Chat, final ratings, the meet, placements |
| `js/ci/season.js` | `playCircleSeason` |
| `tests/helpers/ci-cast.js` | deterministic synthetic casts and pools |
| `tests/ci-*.test.js`, `tests/ci-spec-audit.test.js`, `package.json` | tests and the audit |

The spec's `js/ci/rng.js` is not created: `js/dr/rng.js` `streamFor` is imported directly, as Perfect Match does.

---

### Task 1: Registry entry and its companions

**Files:**
- Modify: `js/shows.js` (entry after `'perfect-match'`; constant after `PERFECT_MATCH_FORMAT`; `HOSTS_BY_FORMAT`)
- Modify: `js/quick-setup.js` (`SHOW_TAGS`)
- Modify: `js/settings.js` (`SETTINGS_BY_FORMAT`, `SEASON_SETTINGS`)
- Modify: `js/social/adapter.js` (`SHOW_WORDS`)
- Modify: `tests/helpers/show-vocabulary.js` (`VOCAB`)
- Modify: `docs/superpowers/specs/2026-09-29-the-circle-design.md` (§22, the flag moves to Plan 4)
- Test: `tests/ci-registry.test.js`

**Interfaces:**
- Produces: `SHOWS['the-circle']`, `CIRCLE_FORMAT = 'the-circle'`, `exitVerbs('the-circle') → ['blocked']`, runnable flag name `_ciRunnable` (NOT set anywhere in this plan).

`simulator.html` is **not** touched: the format option is added in Plan 4 together with the run loop, so nobody can pick a show that cannot run.

- [ ] **Step 0: Record the baseline**

Run before editing anything:
`npx vitest run tests/shows.test.js tests/shows-registry.test.js tests/show-vocabulary.test.js tests/show-list-duplication.test.js tests/ratings.test.js tests/season-format.test.js tests/social-packs.test.js tests/format-scoped-config.test.js tests/format-scoped-design.test.js tests/wiki.test.js tests/studio-portraits.test.js tests/current-season-show-scope.test.js > "$TMPDIR/ci-baseline.txt" 2>&1`
Keep the list of failures it reports. They are not this task's; Step 5 compares against it.

- [ ] **Step 1: Write the failing test** — `tests/ci-registry.test.js`

```js
// ci-registry.test.js — the sixth show exists, speaks its own words, and cannot be run yet.
import { describe, expect, it } from 'vitest';
import { SHOWS, showWords, exitVerbs, formatPrefix, seasonId, roundShape,
  CIRCLE_FORMAT } from '../js/shows.js';
import { formatIsRunnable, SEASON_FORMATS } from '../js/core.js';
import { words as socialWords } from '../js/social/adapter.js';
import { VOCAB } from './helpers/show-vocabulary.js';
import { hostOptionsForFormat, SHOWS as PICKER } from '../js/quick-setup.js';
import { settingsForFormat } from '../js/settings.js';

describe('the-circle registry entry', () => {
  it('is registered with prefix ci and ballot-shaped rounds', () => {
    expect(CIRCLE_FORMAT).toBe('the-circle');
    expect(formatPrefix('the-circle')).toBe('ci');
    expect(seasonId('the-circle', 1)).toBe('ci-1');
    expect(SEASON_FORMATS).toContain('the-circle');
    expect(roundShape('the-circle')).toBe('ballots');
    expect(SHOWS['the-circle'].hasJury).toBe(false);
  });

  it('speaks its own words', () => {
    const w = showWords('the-circle');
    expect(w.player).toBe('player');
    expect(w.exit).toBe('blocked');
    expect(w.audienceAward).toBe('Fan Favorite');
    expect(w.host).toBeNull();
    expect(exitVerbs('the-circle')).toEqual(['blocked']);
  });

  it('declares audience, career stats, article stats and polls', () => {
    const s = SHOWS['the-circle'];
    expect(s.audience.twist).toBeGreaterThan(1);
    expect(s.careerStats.length).toBeGreaterThan(0);
    for (const k of ['career', 'season', 'comps']) expect(s.articleStats[k].length).toBeGreaterThan(0);
    expect(s.polls.length).toBeGreaterThanOrEqual(3);
  });

  it('is not runnable: the flag is only set by js/ci-run.js (Plan 4)', () => {
    const prior = globalThis.window;
    delete globalThis.window;
    expect(formatIsRunnable('the-circle')).toBe(false);
    if (prior !== undefined) globalThis.window = prior;
  });

  it('never borrows Total Drama\'s host, and has a setting, social words and guard words', () => {
    // hostOptionsForFormat falls back to Total Drama's hosts for a show it does
    // not know — a Circle season would have been hosted by Chris.
    const hosts = hostOptionsForFormat('the-circle');
    expect(hosts).toEqual([{ value: '', label: 'No host chosen yet' }]);
    expect(settingsForFormat('the-circle')).toEqual(['ci-apartments']);
    expect(socialWords('the-circle').eliminated).toBe('blocked');
    expect(VOCAB['the-circle'].own).toContain('circle chat');
    expect(PICKER.find(p => p.id === 'the-circle')?.tag).toMatch(/apartment/i);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run tests/ci-registry.test.js`
Expected: FAIL — `CIRCLE_FORMAT` is undefined.

- [ ] **Step 3: Add the registry entry** — in `js/shows.js`, after the closing `},` of `'perfect-match'` and before the `};` that closes `SHOWS`:

```js
  // ── THE SIXTH SHOW: THE CIRCLE ───────────────────────────────────────
  //
  // Players live alone in one building and talk only through a voice-run
  // social network. Every few days they rank each other; the top two become
  // Influencers and block a player. A profile may be the player, an edited
  // version of them, or somebody else entirely (a catfish). One door out:
  // blocked. Rounds are ratings, which are ballots (ADDING-A-SHOW §5).
  //
  // Spec: docs/superpowers/specs/2026-09-29-the-circle-design.md
  'the-circle': {
    prefix: 'ci', name: 'The Circle', short: 'CI', emoji: '⭕', accent: '#3fd8ff',
    venue: { label: 'The Circle', icon: '⭕' },
    // Set at the bottom of js/ci-run.js (Plan 4). Absent until then, which is
    // deliberate: the setup screen must refuse a show with no run loop.
    runnableFlag: '_ciRunnable',
    // Past seasons count: an alum walks in with their reputation and grudges.
    historyFromLedger: true,
    airNight: 3,
    rosterPlace: 'APARTMENTS',
    hasJury: false,
    roundsPath: 'episodeHistory',
    roundShape: 'ballots',
    words: {
      seasonComplete: 'The final ratings are in.',
      noExitLine: 'Nobody was blocked',
      openingStoryline: 'Eight strangers, eight apartments, and nobody knows who is real.',
      quietRound: 'A quiet day in The Circle',
      player: 'player', players: 'players', round: 'Episode',
      exit: 'blocked', exitAction: 'block',
      challenge: 'game', comp: 'game', comps: 'games won',
      compBeast: 'game winner', compWon: 'games',
      milestone: 'the final ratings',
      audienceAward: 'Fan Favorite',
      fanWords: ['ratings', 'influencer', 'blocked', 'catfish', 'circle chat',
        'the hangout', 'newsfeed', 'hashtag', 'alert'],
      // The comic narrator-host. The user has not chosen who yet (spec §17.4):
      // null, never a borrowed host.
      host: null,
    },
    // PROVISIONAL until a season has been played and the signals printed
    // (ADDING-A-SHOW §2.5). The Circle sells twists and strategy; the same few
    // influencers every week is its own complaint.
    audience: { strategy: 1.2, blindside: 1.2, mess: 1.2, predictable: 0.8,
      steamroll: 0.9, showmance: 0.8, twist: 1.3 },
    // Written by the export (Plan 6). Declared now so the article rows exist.
    careerStats: [
      ['ci.influencerTimes', 'totalInfluencerTimes'],
      ['ci.firstPlaces',     'totalFirstPlaceRatings'],
      ['ci.blocksMade',      'totalBlocksMade'],
      ['ci.catfishSeasons',  'totalCatfishSeasons'],
    ],
    articleStats: {
      career: [['influencerTimes', 'Times Influencer'], ['firstPlaceRatings', 'First-place ratings']],
      season: [['ci.influencerTimes', 'Times Influencer'], ['ci.firstPlaces', 'First-place ratings']],
      comps: [['ci.influencerTimes', 'Times Influencer'], ['ci.blocksMade', 'Blocks made']],
    },
    polls: ['Who is the catfish?', 'Who gets blocked next?',
      'Who will the Influencers protect?', 'Who wins The Circle?'],
  },
```

Add the constant after `export const PERFECT_MATCH_FORMAT = 'perfect-match';`:

```js
export const CIRCLE_FORMAT = 'the-circle';
```

- [ ] **Step 4: Add the companions**

`js/quick-setup.js`, in `SHOW_TAGS`:
```js
  'the-circle': 'Separate apartments, one social network, and nobody knows who is real',
```
In `js/shows.js`, `HOSTS_BY_FORMAT` (it lives in the registry file now), after `'perfect-match'`:
```js
  // The host is undecided (spec §17.4) — Don is held for a racing format (see
  // the Big Brother note above). An explicit empty option, because a show
  // missing from this map gets Total Drama's hosts.
  'the-circle': [
    { value: '', label: 'No host chosen yet' },
  ],
```

`js/settings.js`, in `SETTINGS_BY_FORMAT`:
```js
  'the-circle': ['ci-apartments'],
```
In `SEASON_SETTINGS` (after `'pm-villa'`):
```js
  // ── THE CIRCLE ─────────────────────────────────────────────────────
  // One venue. The engine writes its own scenes and draws nothing from the
  // camp reskin pools; this exists so the dropdown has something true.
  'ci-apartments': {
    label: 'The Apartments', emoji: '⭕',
    blurb: 'A block of apartments, one player in each, with a Circle screen in every room, a Hangout upstairs and a roof terrace nobody is allowed to share.',
    vocab: { place: 'the building', shelter: 'the apartment', gather: 'Circle Chat',
             water: 'the bath', sleep: 'the bedroom', downtime: 'the sofa', foodSource: 'the kitchen' },
    arrival: { vehicle: 'front door', verb: 'walks into the apartment', point: 'the building',
               onPoint: 'in the building', headline: 'Welcome to The Circle.',
               groupCall: 'Players, Circle Chat is now open.' },
    reskin: {},
    atmosphere: [],
  },
```

`js/social/adapter.js`, in `SHOW_WORDS` (after `'perfect-match'`):
```js
  'the-circle': {
    name: 'The Circle',
    short: 'CI',
    episode: 'episode',
    Episode: 'Episode',
    episodeShort: 'Ep',
    elimination: 'blocking',
    eliminated: 'blocked',
    challenge: 'game',
    home: 'the Circle',
    vote: 'ratings',
    finalVote: 'final ratings',
    comps: ['game'],
    danger: 'at risk',
    Danger: 'At risk',
    onDanger: 'at risk',
    nominated: 'ended up at risk',
    Pawn: 'A saved player',
    Ceremony: 'The ratings',
    nominee: 'an at-risk player',
    pawn: 'a saved player',
    ceremony: 'the ratings',
    // No jury: the finalists rate each other.
    jury: 'the final five',
    safe: 'safe',
    nominationLabel: 'At risk',
    polls: [
      { id: 'catfish', text: 'Who is the catfish?' },
      { id: 'blocked', text: 'Who gets blocked next?' },
      { id: 'winner', text: 'Who wins The Circle?' },
    ],
  },
```

`tests/helpers/show-vocabulary.js`, in `VOCAB` (after `'perfect-match'`):
```js
  'the-circle': {
    // Phrases where the bare word is ordinary English elsewhere: every show
    // "blocks" a shot and "rates" a look, so the exclusive forms are the
    // Circle's own nouns.
    own: [
      'the circle', 'circle chat', 'influencer', 'influencers', 'catfish',
      'catfished', 'the hangout', 'blocked from the circle', 'newsfeed',
    ],
  },
```

- [ ] **Step 5: Run the registry test and the guards every show walks**

Run: `npx vitest run tests/ci-registry.test.js tests/shows.test.js tests/shows-registry.test.js tests/show-vocabulary.test.js tests/show-list-duplication.test.js tests/ratings.test.js tests/season-format.test.js tests/social-packs.test.js tests/format-scoped-config.test.js tests/format-scoped-design.test.js tests/wiki.test.js tests/studio-portraits.test.js tests/current-season-show-scope.test.js`
Expected: `ci-registry` passes. Every failure NOT in the Step 0 baseline is this task's: each names what a registered show must declare. Fix it in the entry or the companion file it names — never by exempting `the-circle`. If `show-vocabulary` or `social-packs` reports one of the new own-words on another show's text (for example "influencer" in a Big Brother line), remove that word from `VOCAB['the-circle'].own` and add a comment saying which line uses it. If a guard asks for `signals`, leave it failing, write the guard's name in the commit message, and note it for Plan 6 (the reader is wired after a played season, ADDING-A-SHOW §2.5).

- [ ] **Step 6: Record the roadmap change in the spec**

In `docs/superpowers/specs/2026-09-29-the-circle-design.md` §22, replace item 1 and item 4 with:

```markdown
1. **Plan 1 — engine.** Registry entry (not runnable yet); profiles and the
   Catfish Pool draw, beliefs, emotions, claims, slips, chats, ratings,
   Hangout, standard blocking, visit, goodbye, newcomers, finale;
   `audit:ci-spec`.
```
```markdown
4. **Plan 4 — the Circle tab.** `js/ci-run.js`, the runnable flag and dispatch
   in both `run-ui.js` sites, `CONFIG_SCOPE`, the format option in
   `simulator.html`, the Catfish Pool, Profile Plan overrides, face catalogue,
   Photos panel, season options. (The flag waits for the run loop, as Perfect
   Match's did.)
```

- [ ] **Step 7: Full suite once**

Run: `npm test`
Expected: no new failures against the Step 0 baseline.

- [ ] **Step 8: Commit**

```bash
git add js/shows.js js/quick-setup.js js/settings.js js/social/adapter.js tests/helpers/show-vocabulary.js tests/ci-registry.test.js docs/superpowers/specs/2026-09-29-the-circle-design.md
git commit -m "feat(the-circle): registry entry, words, apartments setting, no borrowed host"
```

---

### Task 2: The season state and test casts

**Files:**
- Create: `js/ci/state.js`
- Create: `tests/helpers/ci-cast.js`
- Test: `tests/ci-state.test.js`

**Interfaces:**
- Produces (`js/ci/state.js`):
  - `clamp(v, lo, hi) → number`
  - `newState(seed, options) → state` (shape below)
  - `addScene(state, kind, who: string[], data = {}, seenBy = who) → scene` — `scene = { id, day, kind, who, seenBy, data, aired: true }`
  - `rel(a, b, dim) → number`, `bump(a, b, dim, delta) → number` — wrappers over `js/relationships.js`, `a`/`b` are handles or person names
  - `S(state, handle, key) → number` — a profile's stat (mean over its players)
  - `schemeEligible(state, handle) → boolean` — every player behind the profile must be eligible
  - `peopleOf(state, handle) → string[]`
  - `isActive(state, handle) → boolean`
  - `makePact(state, kind, a, b) → id` — pushes `{ id, kind, a, b, day, kept: [] }`
- Produces (`tests/helpers/ci-cast.js`): `makePlayers(n, seed) → player[]`, `makePool(k, seed) → persona[]`, `circleSetup(names, { newcomers }) → setup`

The state, fully:

```js
{ seed, day: 0, options: { pickBy: 'stats', newcomerRule: 'rate-not-rated', finalists: 5, days: null },
  people: {},        // name → truth (Task 3)
  profiles: {},      // handle → profile (Task 3)
  handleOf: {},      // name → handle
  active: [],        // handles in the game now
  blocked: [],       // [{ handle, day, channel, by }]
  immuneNext: {},    // handle → true: immune at the next blocking (a newcomer's first)
  unratedNext: {},   // handle → true: cannot be rated at the next rating (newcomer rule, spec §8.5)
  joinedDay: {},     // handle → day they entered
  likesCount: {},    // handle → likes on this morning's Newsfeed
  recognised: {},    // 'obs>handle' → true: saw an alum's face on a catfish (Task 13)
  beliefs: {}, beliefLog: [],       // Task 4
  mind: {},                          // Task 4
  claims: [], know: {},              // Task 5
  revealed: {},                      // obs handle → { target handle: true } (Task 6)
  ideal: {},                         // obs → { target: idealisation } (Task 7)
  pacts: [],         // [{ id, kind: 'rate'|'protect', a, b, day, kept: [{ day, voter, kept }] }]
  groups: [],        // [{ id, members, founder, day }]
  ratings: [],       // rating rows (Task 9)
  influencerCount: {}, firstPlaces: {},
  scenes: [], seq: 0,
  pool: [], unused: [],              // Catfish Pool (Task 3)
  pendingGoodbyes: [], pendingReports: [],
  ledger: null }                     // Task 11
```

- [ ] **Step 1: Write the failing test** — `tests/ci-state.test.js`

```js
import { describe, expect, it, beforeEach } from 'vitest';
import { setGs } from '../js/core.js';
import { newState, addScene, clamp, rel, bump, S, schemeEligible, peopleOf, isActive, makePact } from '../js/ci/state.js';
import { makePlayers, makePool, circleSetup } from './helpers/ci-cast.js';

beforeEach(() => setGs({ bonds: {}, relationshipDimensions: {}, episodeHistory: [] }));

describe('ci state', () => {
  it('starts empty, JSON-clean, with the default options', () => {
    const s = newState(9, { finalists: 4 });
    expect(s.options).toEqual({ pickBy: 'stats', newcomerRule: 'rate-not-rated', finalists: 4, days: null });
    expect(JSON.parse(JSON.stringify(s))).toEqual(s);
  });

  it('numbers scenes and defaults seenBy to who', () => {
    const s = newState(1);
    s.day = 3;
    const a = addScene(s, 'chat', ['@a', '@b'], { intent: 'bond' });
    const b = addScene(s, 'goodbye', ['@c'], {}, ['@a', '@b', '@d']);
    expect(a).toMatchObject({ id: 1, day: 3, kind: 'chat', who: ['@a', '@b'], seenBy: ['@a', '@b'], aired: true });
    expect(b.seenBy).toEqual(['@a', '@b', '@d']);
    expect(s.scenes).toHaveLength(2);
  });

  it('keeps relationships in the shared store, keyed by handle', () => {
    bump('@a', '@b', 'trust', 4);
    expect(rel('@a', '@b', 'trust')).toBe(4);
    expect(rel('@b', '@a', 'trust')).toBe(0);
    expect(clamp(12, -10, 10)).toBe(10);
  });

  it('reads a shared profile\'s stats as the mean of its players, and eligibility as all of them', () => {
    const s = newState(1);
    s.people.A = { name: 'A', archetype: 'villain', stats: { strategic: 8, loyalty: 2 } };
    s.people.B = { name: 'B', archetype: 'hero', stats: { strategic: 4, loyalty: 8 } };
    s.profiles['@ab'] = { handle: '@ab', players: ['A', 'B'] };
    s.profiles['@a'] = { handle: '@a', players: ['A'] };
    s.active = ['@a'];
    expect(S(s, '@ab', 'strategic')).toBe(6);
    expect(schemeEligible(s, '@a')).toBe(true);
    expect(schemeEligible(s, '@ab')).toBe(false);
    expect(peopleOf(s, '@ab')).toEqual(['A', 'B']);
    expect(isActive(s, '@a')).toBe(true);
    expect(isActive(s, '@ab')).toBe(false);
    expect(makePact(s, 'rate', '@a', '@ab')).toBe('k1');
    expect(s.pacts[0]).toEqual({ id: 'k1', kind: 'rate', a: '@a', b: '@ab', day: 0, kept: [] });
  });

  it('builds deterministic casts and pools', () => {
    expect(makePlayers(10, 3)).toEqual(makePlayers(10, 3));
    expect(makePlayers(10, 3)).toHaveLength(10);
    const pool = makePool(6, 3);
    expect(pool).toHaveLength(6);
    expect(new Set(pool.map(p => p.handle)).size).toBe(6);
    const setup = circleSetup(makePlayers(12, 3).map(p => p.name), { newcomers: 4 });
    expect(Object.values(setup).filter(x => x.role === 'newcomer')).toHaveLength(4);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run tests/ci-state.test.js`
Expected: FAIL — cannot resolve `../js/ci/state.js`.

- [ ] **Step 3: Write `js/ci/state.js`**

```js
// ══════════════════════════════════════════════════════════════════════
// ci/state.js — the season's state, its scene log, and small shared helpers
// ══════════════════════════════════════════════════════════════════════
//
// PLAIN JSON ONLY. A season is saved, replayed and re-aired; a Set or a
// function on the state does not survive JSON.stringify (CLAUDE.md).
//
// A SCENE is the engine's only output besides the numbers. It says who was in
// it (`who`), who saw it (`seenBy` — the only players whose beliefs it may
// move, spec §5.2), what kind it was and its data. No English: Plan 2 writes
// the words from these records.
import { getRelationshipDimension, addRelationshipDimension } from '../relationships.js';

export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

export function newState(seed, options = {}) {
  return {
    seed, day: 0,
    options: { pickBy: 'stats', newcomerRule: 'rate-not-rated', finalists: 5, days: null, ...options },
    people: {}, profiles: {}, handleOf: {}, active: [], blocked: [], immuneNext: {}, unratedNext: {},
    joinedDay: {}, likesCount: {}, recognised: {},
    beliefs: {}, beliefLog: [], mind: {}, claims: [], know: {}, revealed: {}, ideal: {},
    pacts: [], groups: [], ratings: [], influencerCount: {}, firstPlaces: {},
    scenes: [], seq: 0, pool: [], unused: [], pendingGoodbyes: [], pendingReports: [], ledger: null,
  };
}

export function addScene(state, kind, who, data = {}, seenBy = who) {
  const scene = { id: ++state.seq, day: state.day, kind, who: [...who],
    seenBy: [...new Set(seenBy)], data, aired: true };
  state.scenes.push(scene);
  return scene;
}

// Handles ('@maddie') during the season; person names after a reveal.
export const rel = (a, b, dim) => getRelationshipDimension(a, b, dim);
export const bump = (a, b, dim, delta) => addRelationshipDimension(a, b, dim, delta);

export const peopleOf = (state, handle) => state.profiles[handle]?.players || [];

/** A promise between two profiles: 'rate' (put me first) or 'protect' (we save each other). */
export function makePact(state, kind, a, b) {
  const id = `k${state.pacts.length + 1}`;
  state.pacts.push({ id, kind, a, b, day: state.day, kept: [] });
  return id;
}
export const isActive = (state, handle) => state.active.includes(handle);

/** A profile's stat: the mean over the people behind it (a shared profile is two). */
export function S(state, handle, key) {
  const names = peopleOf(state, handle);
  if (!names.length) return 5;
  return names.reduce((sum, n) => sum + (state.people[n].stats[key] ?? 5), 0) / names.length;
}

// The franchise rule (CLAUDE.md). A threshold here is the rule itself, not
// gameplay: nice archetypes never scheme; neutrals need strategic >= 6 and
// loyalty <= 4. A shared profile schemes only if everyone behind it may.
const NICE = new Set(['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat']);
const VILLAINS = new Set(['villain', 'mastermind', 'schemer']);
export function personMayScheme(person) {
  if (NICE.has(person.archetype)) return false;
  if (VILLAINS.has(person.archetype)) return true;
  return (person.stats.strategic ?? 0) >= 6 && (person.stats.loyalty ?? 10) <= 4;
}
export function schemeEligible(state, handle) {
  const names = peopleOf(state, handle);
  return names.length > 0 && names.every(n => personMayScheme(state.people[n]));
}
```

- [ ] **Step 4: Write `tests/helpers/ci-cast.js`**

```js
// Deterministic synthetic casts and Catfish Pools for The Circle's tests.
// Ages spread 21-56 so the catfish motive has something to read; archetypes
// from the real fifteen; mostly straight, a few not.
import { rngFor } from '../../js/dr/rng.js';

const ARCH = ['mastermind', 'schemer', 'hothead', 'challenge-beast', 'social-butterfly',
  'loyal-soldier', 'wildcard', 'chaos-agent', 'floater', 'underdog', 'hero', 'villain',
  'goat', 'perceptive-player', 'showmancer'];
const KEYS = ['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty', 'boldness',
  'intuition', 'temperament'];
const HANDLES = ['Rebecca', 'Mercedeze', 'Adam', 'Carol', 'Nathan', 'Jared', 'Imani', 'Gianna',
  'Tierra', 'Andy', 'Felix', 'Gemma', 'Syed', 'Dorothy', 'Kate', 'Olivia', 'Paul', 'Brittney',
  'Bruno', 'Sasha'];

export function makePlayers(n = 13, seed = 7) {
  const rng = rngFor(seed * 7919 + 13);
  return Array.from({ length: n }, (_, i) => ({
    name: `P${String(i + 1).padStart(2, '0')}`,
    gender: i % 2 === 0 ? 'f' : 'm',
    sexuality: i % 7 === 3 ? 'bi' : 'straight',
    age: rng() < 0.75 ? 21 + Math.floor(rng() * 12) : 33 + Math.floor(rng() * 26),
    archetype: ARCH[Math.floor(rng() * ARCH.length)],
    stats: Object.fromEntries(KEYS.map(k => [k, 1 + Math.floor(rng() * 10)])),
  }));
}

export function makePool(k = 6, seed = 7) {
  const rng = rngFor(seed * 104729 + 7);
  return Array.from({ length: k }, (_, i) => ({
    id: `persona-${i + 1}`,
    handle: HANDLES[i % HANDLES.length] + (i >= HANDLES.length ? String(i) : ''),
    face: `guest-${i + 1}`,
    age: 21 + Math.floor(rng() * 12),
    gender: i % 2 === 0 ? 'f' : 'm',
    job: ['student', 'nurse', 'personal trainer', 'bartender', 'teacher', 'model'][i % 6],
    hometown: null,
    status: 'Single',
    bio: '',
    reasons: [['strategic'], ['protective'], ['strategic', 'experimental'], ['family'], ['protective', 'family'], ['strategic']][i % 6],
    tells: [['golf'], ['periods'], ['makeup brands'], ['nursing'], [], ['college football']][i % 6],
    fits: {},
  }));
}

/** The first `n - newcomers` start on Day 1; the rest arrive later, in order. */
export function circleSetup(names, { newcomers = 5 } = {}) {
  return Object.fromEntries(names.map((n, i) => [n, { role: i < names.length - newcomers ? 'starter' : 'newcomer' }]));
}
```

- [ ] **Step 5: Run the test**

Run: `npx vitest run tests/ci-state.test.js`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add js/ci/state.js tests/helpers/ci-cast.js tests/ci-state.test.js
git commit -m "feat(the-circle): season state, scene log, synthetic casts and pools"
```

---

### Task 3: Profiles and the Catfish Pool draw

**Files:**
- Create: `js/ci/profiles.js`
- Test: `tests/ci-profiles.test.js`

**Interfaces:**
- Consumes: `clamp`, `personMayScheme` (Task 2).
- Produces:
  - `truthOf(player, setup) → truth` — `{ name, gender, sexuality, archetype, stats, age, job, hometown, status, alum, rep, jobCost, role, catfish, partner }`; `catfish` is `'decide' | 'never' | 'always' | <persona id>`
  - `medianAge(truths) → number`
  - `catfishMotive(truth, median) → number`
  - `reasonFor(truth, persona) → string | null`
  - `drawPersonas(truths, pool, rng, pickBy) → { assigned: { [name]: { personaId, reason } }, unused: string[], edited: string[] }`
  - `buildProfiles(state, truths, draw, pool, rng) → string[]` (handles, in cast order) — fills `state.people`, `state.profiles`, `state.handleOf`, `state.pool`, `state.unused`
  - profile shape: `{ handle, players, mode, personaId, reason, shown: { name, age, gender, job, status, hometown, face }, edits, tells, gap, voice }`, `mode ∈ 'honest'|'polished'|'edited'|'catfish'|'shared'`

Spec §4.2–§4.3a. The draw has its own rng stream (the caller passes `streamFor(seed, 'pool')`), and only the persona ids, reasons, `fits`, ages and genders enter it — so editing a persona's bio never changes who catfishes.

- [ ] **Step 1: Write the failing test** — `tests/ci-profiles.test.js`

```js
import { describe, expect, it, beforeEach } from 'vitest';
import { setGs } from '../js/core.js';
import { streamFor } from '../js/dr/rng.js';
import { newState } from '../js/ci/state.js';
import { truthOf, medianAge, catfishMotive, reasonFor, drawPersonas, buildProfiles, MOTIVE_LINE } from '../js/ci/profiles.js';
import { makePlayers, makePool } from './helpers/ci-cast.js';

beforeEach(() => setGs({ bonds: {}, relationshipDimensions: {}, episodeHistory: [] }));
const truths = (n, seed, setup = {}) => makePlayers(n, seed).map(p => truthOf(p, setup[p.name] || {}));

describe('the catfish motive', () => {
  it('rises with strategy, boldness and costly facts, and falls with loyalty', () => {
    const base = { name: 'X', gender: 'f', archetype: 'floater', age: 25, alum: false, rep: null, jobCost: 0,
      stats: { strategic: 5, boldness: 5, loyalty: 5 } };
    const m = catfishMotive(base, 25);
    expect(catfishMotive({ ...base, stats: { ...base.stats, strategic: 9 } }, 25)).toBeGreaterThan(m);
    expect(catfishMotive({ ...base, stats: { ...base.stats, loyalty: 9 } }, 25)).toBeLessThan(m);
    expect(catfishMotive({ ...base, age: 54 }, 25)).toBeGreaterThan(m);
    expect(catfishMotive({ ...base, alum: true, rep: 'villain' }, 25)).toBeGreaterThan(m);
  });

  it('never gives a nice archetype a strategic reason', () => {
    const hero = { archetype: 'hero', stats: { strategic: 9, loyalty: 1 } };
    const villain = { archetype: 'villain', stats: { strategic: 9, loyalty: 1 } };
    expect(reasonFor(hero, { reasons: ['strategic'] })).toBeNull();
    expect(reasonFor(hero, { reasons: ['strategic', 'protective'] })).toBe('protective');
    expect(reasonFor(villain, { reasons: ['strategic'] })).toBe('strategic');
  });
});

describe('drawing from the Catfish Pool', () => {
  it('an empty pool gives no catfish, and the motivated play Edited instead', () => {
    const t = truths(12, 4);
    const d = drawPersonas(t, [], streamFor(4, 'pool'), 'stats');
    expect(Object.keys(d.assigned)).toHaveLength(0);
    const median = medianAge(t);
    const wanting = t.filter(x => catfishMotive(x, median) >= MOTIVE_LINE).map(x => x.name);
    expect(d.edited.sort()).toEqual(wanting.sort());
  });

  it('a big pool leaves personas unused', () => {
    const t = truths(10, 5);
    const pool = makePool(20, 5);
    const d = drawPersonas(t, pool, streamFor(5, 'pool'), 'stats');
    expect(d.unused.length).toBeGreaterThan(0);
    expect(Object.keys(d.assigned).length + d.unused.length).toBe(20);
  });

  it('honours pins, ignores a pin to a persona that does not exist, and never catfishes a Never', () => {
    const players = makePlayers(8, 6);
    const [a, b, c] = players.map(p => p.name);
    const setup = { [a]: { catfish: 'persona-2' }, [b]: { catfish: 'persona-99' }, [c]: { catfish: 'never' } };
    const t = players.map(p => truthOf(p, setup[p.name] || {}));
    const d = drawPersonas(t, makePool(6, 6), streamFor(6, 'pool'), 'stats');
    expect(d.assigned[a].personaId).toBe('persona-2');
    expect(d.assigned[c]).toBeUndefined();
    expect(Object.values(d.assigned).filter(x => x.personaId === 'persona-99')).toHaveLength(0);
  });

  it('random mode uses some personas and not others', () => {
    let used = 0, runs = 0;
    for (let s = 1; s <= 20; s++) {
      const d = drawPersonas(truths(10, s), makePool(10, s), streamFor(s * 7919, 'pool'), 'random');
      used += Object.keys(d.assigned).length; runs++;
    }
    const mean = used / runs;
    expect(mean).toBeGreaterThan(2);
    expect(mean).toBeLessThan(8);
  });

  it('bios do not move the draw', () => {
    const t = truths(12, 8);
    const pool = makePool(8, 8);
    const d1 = drawPersonas(t, pool, streamFor(8, 'pool'), 'stats');
    const d2 = drawPersonas(t, pool.map(p => ({ ...p, bio: 'a completely different bio' })), streamFor(8, 'pool'), 'stats');
    expect(d2.assigned).toEqual(d1.assigned);
  });
});

describe('building profiles', () => {
  it('gives catfish the persona\'s face and facts, unique handles, and a gap', () => {
    const s = newState(3);
    const players = makePlayers(10, 3);
    const t = players.map(p => truthOf(p, {}));
    const pool = makePool(10, 3);
    const d = drawPersonas(t, pool, streamFor(3, 'pool'), 'stats');
    const handles = buildProfiles(s, t, d, pool, streamFor(3, 'profiles'));
    expect(new Set(handles).size).toBe(handles.length);
    for (const [name, { personaId }] of Object.entries(d.assigned)) {
      const p = s.profiles[s.handleOf[name]];
      const persona = pool.find(x => x.id === personaId);
      expect(p.mode).toBe('catfish');
      expect(p.shown).toMatchObject({ name: persona.handle, age: persona.age, face: persona.face });
      expect(p.gap).toBeGreaterThan(0);
    }
    const honest = Object.values(s.profiles).filter(p => p.mode === 'honest');
    for (const p of honest) expect(p.gap).toBe(0);
    expect(s.unused).toEqual(d.unused);
  });

  it('puts two partners on one shared profile', () => {
    const s = newState(2);
    const players = makePlayers(6, 2);
    const [a, b] = players.map(p => p.name);
    const t = players.map(p => truthOf(p, p.name === a ? { partner: b } : p.name === b ? { partner: a } : {}));
    const d = drawPersonas(t, [], streamFor(2, 'pool'), 'stats');
    buildProfiles(s, t, d, [], streamFor(2, 'profiles'));
    expect(s.handleOf[a]).toBe(s.handleOf[b]);
    expect(s.profiles[s.handleOf[a]]).toMatchObject({ mode: 'shared', players: [a, b] });
    expect(Object.keys(s.profiles)).toHaveLength(5);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run tests/ci-profiles.test.js`
Expected: FAIL — cannot resolve `../js/ci/profiles.js`.

- [ ] **Step 3: Write `js/ci/profiles.js`**

```js
// ══════════════════════════════════════════════════════════════════════
// ci/profiles.js — who plays whom
// ══════════════════════════════════════════════════════════════════════
//
// Spec §4. Each player has a TRUTH (the person) and a PROFILE (what the room
// sees). The author writes a Catfish Pool of personas each season; players
// take them by MOTIVE (stats, and what their real facts cost in this cast)
// or at random, and personas nobody takes stay in the pool as stock for later
// twists (spec §4.2). The engine never invents a persona: a motivated player
// who finds none plays EDITED — same face, one to three facts changed.
//
// All weights are proportional (stat × factor). MOTIVE_LINE is a gameplay
// constant tuned by audit:ci-spec so that a pool big enough gives roughly a
// third of the cast a persona (spec §2.2: about a third of real casts).
import { clamp, personMayScheme } from './state.js';

export const MOTIVE = { age: 0.08, alum: 0.6, villainRep: 1.4, job: 1.0,
  strategic: 0.07, boldness: 0.05, loyalty: 0.06 };
export const MOTIVE_LINE = 0.75;
export const RANDOM_TAKE = 0.5;
const EDIT_JOBS = ['student', 'teacher', 'barista', 'personal trainer', 'marketing assistant',
  'bartender', 'nurse', 'graphic designer'];

export function truthOf(player, setup = {}) {
  return {
    name: player.name, gender: player.gender || 'f', sexuality: player.sexuality || 'straight',
    archetype: player.archetype || 'floater', stats: { ...player.stats },
    age: setup.age ?? player.age ?? 25, job: setup.job ?? null, hometown: setup.hometown ?? null,
    status: setup.status ?? 'Single', alum: !!(setup.alum ?? player.isReturnee),
    rep: setup.rep ?? null, jobCost: setup.jobCost ?? 0, role: setup.role || 'starter',
    catfish: setup.catfish || 'decide', partner: setup.partner || null,
  };
}

export function medianAge(truths) {
  const a = truths.map(t => t.age).sort((x, y) => x - y);
  return a.length ? a[a.length >> 1] : 25;
}

/** What each true fact costs to show in this room (spec §4.3). */
export function factCosts(t, median) {
  return { age: Math.abs(t.age - median) * MOTIVE.age, alum: t.alum ? MOTIVE.alum : 0,
    rep: t.rep === 'villain' ? MOTIVE.villainRep : 0, job: (t.jobCost || 0) * MOTIVE.job };
}

export function catfishMotive(t, median) {
  const c = factCosts(t, median);
  return c.age + c.alum + c.rep + c.job
    + (t.stats.strategic ?? 5) * MOTIVE.strategic
    + (t.stats.boldness ?? 5) * MOTIVE.boldness
    - (t.stats.loyalty ?? 5) * MOTIVE.loyalty;
}

/** The first of the persona's reasons this person may use; strategic is scheme-only (spec §4.4). */
export function reasonFor(t, persona) {
  const ok = (persona.reasons || []).filter(r => r !== 'strategic' || personMayScheme(t));
  return ok[0] ?? null;
}

/** How well a persona hides what this player wants hidden. -Infinity = unusable. */
export function fitScore(t, persona, median) {
  if (!reasonFor(t, persona)) return -Infinity;
  const f = persona.fits || {};
  let s = 0;
  if (f.gender && f.gender !== t.gender) s -= 1;
  if (f.ageMin != null && t.age < f.ageMin) s -= 1;
  if (f.ageMax != null && t.age > f.ageMax) s -= 1;
  if (f.archetypes && !f.archetypes.includes(t.archetype)) s -= 0.5;
  if (t.age > median + 5 && persona.age < t.age) s += 1;
  if (t.age < median - 5 && persona.age > t.age) s += 1;
  if (t.alum || t.rep) s += 0.5;
  return s;
}

function shuffled(list, rng) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

export function drawPersonas(truths, pool, rng, pickBy = 'stats') {
  const median = medianAge(truths);
  const left = [...pool];
  const assigned = {};
  const take = (t, p) => {
    assigned[t.name] = { personaId: p.id, reason: reasonFor(t, p) };
    left.splice(left.indexOf(p), 1);
  };
  const best = t => left.map(p => [p, fitScore(t, p, median)]).filter(([, s]) => s > -1)
    .sort((a, b) => b[1] - a[1])[0]?.[0];

  // Pins first. A pin to a persona that is not in the pool is ignored.
  for (const t of truths) {
    if (['decide', 'never', 'always'].includes(t.catfish)) continue;
    const p = left.find(x => x.id === t.catfish);
    if (p && reasonFor(t, p)) take(t, p);
  }
  const open = truths.filter(t => !assigned[t.name] && t.catfish !== 'never');
  const motive = Object.fromEntries(open.map(t => [t.name, catfishMotive(t, median)]));

  if (pickBy === 'random') {
    for (const t of open.filter(t => t.catfish === 'always')) { const p = best(t); if (p) take(t, p); }
    for (const p of shuffled(left, rng)) {
      if (rng() > RANDOM_TAKE) continue;
      const takers = open.filter(t => !assigned[t.name] && reasonFor(t, p));
      if (takers.length) take(takers[Math.floor(rng() * takers.length)], p);
    }
  } else {
    const order = open.map(t => [t, motive[t.name] + (t.catfish === 'always' ? 99 : 0) + rng() * 1.2])
      .sort((a, b) => b[1] - a[1]).map(([t]) => t);
    for (const t of order) {
      if (t.catfish !== 'always' && motive[t.name] < MOTIVE_LINE) continue;
      const p = best(t);
      if (p) take(t, p);
    }
  }
  const edited = open.filter(t => !assigned[t.name]
    && (t.catfish === 'always' || motive[t.name] >= MOTIVE_LINE)).map(t => t.name);
  return { assigned, unused: left.map(p => p.id), edited };
}

/** Texting voice (spec §4.5): numbers 0..1 that Plan 2 turns into words. */
export function voiceOf(age, stats) {
  return {
    emoji: clamp(stats.social / 10 + (age < 30 ? 0.2 : -0.1), 0, 1),
    hashtags: clamp(stats.boldness / 10 + (age < 35 ? 0.1 : -0.2), 0, 1),
    caps: clamp((stats.boldness - 4) / 10, 0, 1),
    length: clamp(stats.mental / 10, 0, 1),
    speed: clamp((stats.social + stats.boldness) / 20, 0, 1),
  };
}

const slug = s => String(s).toLowerCase().replace(/[^a-z0-9]/g, '') || 'player';
function uniqueHandle(base, taken) {
  let h = `@${slug(base)}`, i = 2;
  while (taken[h]) h = `@${slug(base)}${i++}`;
  return h;
}

function editsFor(t, median, rng) {
  const c = factCosts(t, median);
  const shown = {};
  const edits = [];
  const ranked = Object.entries(c).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).slice(0, 2);
  for (const [fact] of ranked) {
    if (fact === 'age') { shown.age = Math.round(median + (t.age > median ? 2 : -2) * rng()); edits.push('age'); }
    if (fact === 'job') { shown.job = EDIT_JOBS[Math.floor(rng() * EDIT_JOBS.length)]; edits.push('job'); }
    if (fact === 'alum' || fact === 'rep') { if (!edits.includes('fame')) edits.push('fame'); }
  }
  if (t.status !== 'Single' && rng() < (t.stats.strategic ?? 5) / 20) { shown.status = 'Single'; edits.push('status'); }
  if (!edits.length) { shown.job = EDIT_JOBS[Math.floor(rng() * EDIT_JOBS.length)]; edits.push('job'); }
  return { shown, edits };
}

export function buildProfiles(state, truths, draw, pool, rng) {
  const median = medianAge(truths);
  const personas = Object.fromEntries(pool.map(p => [p.id, p]));
  state.pool = pool.map(p => ({ ...p }));
  state.unused = [...draw.unused];
  const handles = [];
  for (const t of truths) {
    state.people[t.name] = t;
    // A partner already on a profile: join it (spec §14.8).
    const partnerHandle = t.partner && state.handleOf[t.partner];
    if (partnerHandle && state.profiles[partnerHandle].players.length === 1) {
      const p = state.profiles[partnerHandle];
      p.players.push(t.name); p.mode = 'shared'; p.gap = 0.5;
      state.handleOf[t.name] = partnerHandle;
      continue;
    }
    const a = draw.assigned[t.name];
    const persona = a && personas[a.personaId];
    let mode = 'honest', shown, edits = [], tells = [], gap = 0;
    const own = { name: t.name, age: t.age, gender: t.gender, job: t.job, status: t.status,
      hometown: t.hometown, face: `portrait:${t.name}` };
    if (persona) {
      mode = 'catfish';
      shown = { name: persona.handle, age: persona.age, gender: persona.gender, job: persona.job,
        status: persona.status, hometown: persona.hometown, face: persona.face };
      tells = [...(persona.tells || [])];
      gap = 1 + Math.abs(persona.age - t.age) / 10 + (persona.gender !== t.gender ? 1 : 0);
    } else if (draw.edited.includes(t.name)) {
      mode = 'edited';
      const e = editsFor(t, median, rng);
      shown = { ...own, ...e.shown }; edits = e.edits; gap = 0.3 * edits.length;
    } else {
      mode = catfishMotive(t, median) > 0 ? 'polished' : 'honest';
      shown = own;
    }
    const handle = uniqueHandle(shown.name, state.profiles);
    state.profiles[handle] = { handle, players: [t.name], mode, personaId: persona?.id ?? null,
      reason: a?.reason ?? null, shown, edits, tells, gap, voice: voiceOf(shown.age, t.stats) };
    state.handleOf[t.name] = handle;
    handles.push(handle);
  }
  return handles;
}
```

- [ ] **Step 4: Run the test**

Run: `npx vitest run tests/ci-profiles.test.js`
Expected: PASS. If "an empty pool" fails because a player with motive above the line and a `never` pin is counted, check that `edited` only draws from `open` (it does in the code above).

- [ ] **Step 5: Commit**

```bash
git add js/ci/profiles.js tests/ci-profiles.test.js
git commit -m "feat(the-circle): profiles, the catfish motive and the Catfish Pool draw"
```

---

### Task 4: Beliefs and the mind

**Files:**
- Create: `js/ci/beliefs.js`, `js/ci/mind.js`
- Test: `tests/ci-beliefs.test.js`

**Interfaces:**
- Consumes: `clamp`, `S`, `addScene`, `newState` (Task 2).
- Produces (`beliefs.js`):
  - `belief(state, obs, target) → { real, guessOf, threat, likesMe, alliesOf, ratedMe }` (creates on first read)
  - `nudgeBelief(state, obs, target, field, delta, scene) → number` — `field ∈ 'real'|'threat'|'likesMe'`; throws if `obs` is not in `scene.seenBy`
  - `setBelief(state, obs, target, field, value, scene)` — any field; same witness rule
  - `noteAlly(state, obs, holder, ally, scene)`
  - `suspicion(state, obs, target) → number` (`1 - real`)
- Produces (`mind.js`):
  - `MIND_KEYS`, `initMind(state, h)`, `feel(state, h, key, delta)`, `driftMind(state, h)`, `mood(state, h, key) → number`

- [ ] **Step 1: Write the failing test** — `tests/ci-beliefs.test.js`

```js
import { describe, expect, it } from 'vitest';
import { newState, addScene } from '../js/ci/state.js';
import { belief, nudgeBelief, setBelief, noteAlly, suspicion } from '../js/ci/beliefs.js';
import { initMind, feel, driftMind, mood } from '../js/ci/mind.js';

function twoPlayers(temperA = 5, temperB = 5) {
  const s = newState(1);
  s.people.A = { name: 'A', archetype: 'floater', stats: { temperament: temperA, intuition: 5, loyalty: 5 } };
  s.people.B = { name: 'B', archetype: 'floater', stats: { temperament: temperB, intuition: 5, loyalty: 5 } };
  s.profiles['@a'] = { handle: '@a', players: ['A'], mode: 'honest', gap: 0 };
  s.profiles['@b'] = { handle: '@b', players: ['B'], mode: 'catfish', gap: 2 };
  s.active = ['@a', '@b'];
  initMind(s, '@a'); initMind(s, '@b');
  return s;
}

describe('beliefs', () => {
  it('starts trusting, less so for a paranoid observer', () => {
    const calm = twoPlayers(9), jumpy = twoPlayers(1);
    expect(belief(calm, '@a', '@b').real).toBeGreaterThan(belief(jumpy, '@a', '@b').real);
    expect(belief(calm, '@a', '@b')).toMatchObject({ threat: 3, likesMe: 0, alliesOf: [], guessOf: null });
  });

  it('only moves for a player who saw the scene, and logs the cause', () => {
    const s = twoPlayers();
    const seen = addScene(s, 'chat', ['@a', '@b']);
    const unseen = addScene(s, 'chat', ['@b'], {}, ['@b']);
    nudgeBelief(s, '@a', '@b', 'real', -0.3, seen);
    expect(suspicion(s, '@a', '@b')).toBeGreaterThan(0.3);
    expect(() => nudgeBelief(s, '@a', '@b', 'real', -0.3, unseen)).toThrow(/did not see/);
    expect(s.beliefLog.at(-1)).toMatchObject({ obs: '@a', target: '@b', field: 'real', scene: seen.id });
  });

  it('clamps each field to its range', () => {
    const s = twoPlayers();
    const sc = addScene(s, 'chat', ['@a', '@b']);
    nudgeBelief(s, '@a', '@b', 'real', -5, sc);
    nudgeBelief(s, '@a', '@b', 'likesMe', 50, sc);
    expect(belief(s, '@a', '@b').real).toBe(0);
    expect(belief(s, '@a', '@b').likesMe).toBe(10);
    setBelief(s, '@a', '@b', 'guessOf', 'a man', sc);
    noteAlly(s, '@a', '@b', '@c', sc);
    noteAlly(s, '@a', '@b', '@c', sc);
    expect(belief(s, '@a', '@b')).toMatchObject({ guessOf: 'a man', alliesOf: ['@c'] });
  });
});

describe('the mind', () => {
  it('gets lonelier every day with nothing to lift it', () => {
    const s = twoPlayers();
    const start = mood(s, '@a', 'loneliness');
    for (let d = 0; d < 5; d++) driftMind(s, '@a');
    expect(mood(s, '@a', 'loneliness')).toBeGreaterThan(start);
  });

  it('lets a calm player feel less of the same blow', () => {
    const s = twoPlayers(10, 1);
    feel(s, '@a', 'stress', 4); feel(s, '@b', 'stress', 4);
    expect(mood(s, '@a', 'stress')).toBeLessThan(mood(s, '@b', 'stress'));
  });

  it('builds guilt in a loyal catfish over the days', () => {
    const s = twoPlayers();
    s.people.B.stats.loyalty = 9;
    for (let d = 0; d < 4; d++) driftMind(s, '@b');
    expect(mood(s, '@b', 'guilt')).toBeGreaterThan(0);
    expect(mood(s, '@a', 'guilt')).toBe(0);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run tests/ci-beliefs.test.js`
Expected: FAIL — cannot resolve `../js/ci/beliefs.js`.

- [ ] **Step 3: Write `js/ci/mind.js`**

```js
// ══════════════════════════════════════════════════════════════════════
// ci/mind.js — what isolation does to a person (spec §5.5)
// ══════════════════════════════════════════════════════════════════════
//
// Six states, 0..10, each drifting back toward a baseline set by stats.
// Loneliness and homesickness rise every day on their own: nobody has seen
// a face for days, and that is the show. A catfish who is loyal feels the
// lie ("it was terrible, and I felt the strain" — US 1 Seaburn).
// Emotions change what players choose and say, never directly who wins.
import { clamp, S } from './state.js';

export const MIND_KEYS = ['loneliness', 'paranoia', 'stress', 'guilt', 'elation', 'homesick'];
export const DAILY = { loneliness: 0.6, homesick: 0.3 };
export const RETURN = 0.25;
export const GUILT_PER_DAY = 0.35;

function baseline(state, h) {
  const temper = S(state, h, 'temperament'), intuition = S(state, h, 'intuition');
  return { loneliness: 2, paranoia: 1 + (10 - temper) * 0.2 + intuition * 0.1,
    stress: 1 + (10 - temper) * 0.15, guilt: 0, elation: 3, homesick: 2 };
}

export function initMind(state, h) { state.mind[h] = baseline(state, h); }
export const mood = (state, h, key) => state.mind[h]?.[key] ?? 0;

/** A blow or a lift. Temperament damps it: a calm player feels less of the same event. */
export function feel(state, h, key, delta) {
  const m = state.mind[h];
  if (!m) return 0;
  const damp = 1.2 - S(state, h, 'temperament') / 20;
  m[key] = clamp(m[key] + delta * damp, 0, 10);
  return m[key];
}

/** Once a day: settle toward baseline, then the day's own weight. */
export function driftMind(state, h) {
  const m = state.mind[h];
  if (!m) return;
  const base = baseline(state, h);
  for (const k of MIND_KEYS) m[k] += (base[k] - m[k]) * RETURN;
  m.loneliness += DAILY.loneliness;
  m.homesick += DAILY.homesick;
  const p = state.profiles[h];
  if (p && p.gap > 0) m.guilt += GUILT_PER_DAY * p.gap * S(state, h, 'loyalty') / 10;
  for (const k of MIND_KEYS) m[k] = clamp(m[k], 0, 10);
}
```

- [ ] **Step 4: Write `js/ci/beliefs.js`**

```js
// ══════════════════════════════════════════════════════════════════════
// ci/beliefs.js — what each player believes about each profile (spec §5.2)
// ══════════════════════════════════════════════════════════════════════
//
// THE RULE THIS FILE EXISTS FOR: a belief only moves because of a scene the
// player saw. Every change names its scene, and a player not in that scene's
// `seenBy` throws — the "character who knows more than they should" bug class
// (ADDING-A-SHOW §11.5 D) caught at the source instead of in a transcript.
import { clamp } from './state.js';

export const RANGES = { real: [0, 1], threat: [0, 10], likesMe: [-10, 10] };

function fresh(state, obs) {
  const paranoia = state.mind[obs]?.paranoia ?? 2;
  return { real: clamp(0.85 - paranoia * 0.03, 0.5, 0.9), guessOf: null, threat: 3,
    likesMe: 0, alliesOf: [], ratedMe: null };
}

export function belief(state, obs, target) {
  const row = (state.beliefs[obs] ||= {});
  return (row[target] ||= fresh(state, obs));
}

function witnessed(scene, obs) {
  if (!scene || !scene.seenBy.includes(obs)) {
    throw new Error(`belief change for ${obs} from scene ${scene?.id} they did not see`);
  }
}

export function nudgeBelief(state, obs, target, field, delta, scene) {
  witnessed(scene, obs);
  const b = belief(state, obs, target);
  const [lo, hi] = RANGES[field];
  const before = b[field];
  b[field] = clamp(before + delta, lo, hi);
  state.beliefLog.push({ obs, target, field, delta: b[field] - before, scene: scene.id, day: state.day });
  return b[field];
}

export function setBelief(state, obs, target, field, value, scene) {
  witnessed(scene, obs);
  const b = belief(state, obs, target);
  const v = RANGES[field] ? clamp(value, ...RANGES[field]) : value;
  state.beliefLog.push({ obs, target, field, set: v, scene: scene.id, day: state.day });
  b[field] = v;
  return v;
}

export function noteAlly(state, obs, holder, ally, scene) {
  witnessed(scene, obs);
  const b = belief(state, obs, holder);
  if (!b.alliesOf.includes(ally)) b.alliesOf.push(ally);
}

export const suspicion = (state, obs, target) => 1 - belief(state, obs, target).real;
```

- [ ] **Step 5: Run the test**

Run: `npx vitest run tests/ci-beliefs.test.js`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add js/ci/beliefs.js js/ci/mind.js tests/ci-beliefs.test.js
git commit -m "feat(the-circle): beliefs that only move for a witness, and the isolated mind"
```

---

### Task 5: Claims, and how they spread

**Files:**
- Create: `js/ci/claims.js`
- Test: `tests/ci-claims.test.js`

**Interfaces:**
- Consumes: `rel`, `bump`, `clamp`, `S`, `addScene` (Task 2); `nudgeBelief`, `noteAlly` (Task 4); `feel` (Task 4).
- Produces:
  - `CLAIM_KINDS` = `['distrusts','likes','targeting','catfish','real','ally','saved','ratedLow','visitSaid']`
  - `makeClaim(state, { kind, about, holder, value = true, truth, secrecy = 'between', by, to = null }) → claim` — `claim = { id, day, kind, about, holder, value, truth, secrecy, origin: { by, to } }`
  - `claimById(state, id) → claim`
  - `knows(state, obs, id) → boolean`
  - `learn(state, obs, claim, from, scene) → boolean` — records `state.know[obs][id] = { from, day }` and applies the claim; false if already known
  - `passOnWeight(state, knower, claim, listener) → number` (0 = will not repeat it)
  - `contradictions(state, obs) → [{ a: claim, b: claim }]`

Spec §7.5–§7.6. A claim moves the listener in proportion to their trust in whoever told them, amplified by paranoia for bad news. The source travels with the claim.

- [ ] **Step 1: Write the failing test** — `tests/ci-claims.test.js`

```js
import { describe, expect, it, beforeEach } from 'vitest';
import { setGs } from '../js/core.js';
import { newState, addScene, bump, rel } from '../js/ci/state.js';
import { belief } from '../js/ci/beliefs.js';
import { initMind } from '../js/ci/mind.js';
import { makeClaim, learn, knows, passOnWeight, contradictions, claimById } from '../js/ci/claims.js';

beforeEach(() => setGs({ bonds: {}, relationshipDimensions: {}, episodeHistory: [] }));

function room() {
  const s = newState(1);
  for (const n of ['A', 'B', 'C', 'D']) {
    s.people[n] = { name: n, archetype: 'floater', stats: { temperament: 5, intuition: 5, loyalty: 5 } };
    s.profiles[`@${n.toLowerCase()}`] = { handle: `@${n.toLowerCase()}`, players: [n], mode: 'honest', gap: 0 };
    initMind(s, `@${n.toLowerCase()}`);
  }
  s.active = ['@a', '@b', '@c', '@d'];
  return s;
}

describe('claims', () => {
  it('hurts more when a trusted friend says it', () => {
    const s = room();
    bump('@c', '@a', 'trust', 8);   // C trusts A
    bump('@d', '@b', 'trust', -8);  // D distrusts B
    const c1 = makeClaim(s, { kind: 'distrusts', holder: '@x', about: '@c', truth: true, by: '@a' });
    const c2 = makeClaim(s, { kind: 'distrusts', holder: '@x', about: '@d', truth: true, by: '@b' });
    learn(s, '@c', c1, '@a', addScene(s, 'chat', ['@a', '@c']));
    learn(s, '@d', c2, '@b', addScene(s, 'chat', ['@b', '@d']));
    expect(belief(s, '@c', '@x').likesMe).toBeLessThan(belief(s, '@d', '@x').likesMe);
  });

  it('is learned once and remembers who said it', () => {
    const s = room();
    const c = makeClaim(s, { kind: 'catfish', holder: '@a', about: '@d', truth: false, by: '@a' });
    const sc = addScene(s, 'chat', ['@a', '@b']);
    const before = belief(s, '@b', '@d').real;
    expect(learn(s, '@b', c, '@a', sc)).toBe(true);
    expect(learn(s, '@b', c, '@a', sc)).toBe(false);
    expect(knows(s, '@b', c.id)).toBe(true);
    expect(s.know['@b'][c.id]).toEqual({ from: '@a', day: 0 });
    expect(belief(s, '@b', '@d').real).toBeLessThan(before);
    expect(claimById(s, c.id)).toBe(c);
  });

  it('is repeated to its target more readily than to a stranger, and never if it is public', () => {
    const s = room();
    bump('@b', '@c', 'affection', 5);
    bump('@b', '@d', 'affection', 5);
    const c = makeClaim(s, { kind: 'distrusts', holder: '@a', about: '@c', truth: true, by: '@a' });
    expect(passOnWeight(s, '@b', c, '@c')).toBeGreaterThan(passOnWeight(s, '@b', c, '@d'));
    const pub = makeClaim(s, { kind: 'catfish', holder: '@a', about: '@c', truth: false, secrecy: 'public', by: '@a' });
    expect(passOnWeight(s, '@b', pub, '@c')).toBe(0);
  });

  it('finds two stories that cannot both be true', () => {
    const s = room();
    const saved = makeClaim(s, { kind: 'saved', holder: '@a', about: '@c', truth: false, by: '@a' });
    const target = makeClaim(s, { kind: 'targeting', holder: '@a', about: '@c', truth: true, by: '@b' });
    const sc = addScene(s, 'chat', ['@a', '@b', '@c']);
    learn(s, '@c', saved, '@a', sc);
    expect(contradictions(s, '@c')).toEqual([]);
    learn(s, '@c', target, '@b', sc);
    expect(contradictions(s, '@c')).toEqual([{ a: saved, b: target }]);
  });

  it('makes a third party trust the one being warned about a little less', () => {
    const s = room();
    bump('@c', '@a', 'trust', 6);
    const c = makeClaim(s, { kind: 'distrusts', holder: '@a', about: '@d', truth: true, secrecy: 'public', by: '@a' });
    learn(s, '@c', c, '@a', addScene(s, 'goodbye', ['@a'], {}, ['@c', '@d']));
    expect(rel('@c', '@d', 'trust')).toBeLessThan(0);
  });

  it('makes a hero who is told they were saved feel they owe it', () => {
    const s = room();
    const c = makeClaim(s, { kind: 'saved', holder: '@a', about: '@c', truth: true, by: '@a' });
    learn(s, '@c', c, '@a', addScene(s, 'chat', ['@a', '@c']));
    expect(rel('@c', '@a', 'obligation')).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run tests/ci-claims.test.js`
Expected: FAIL — cannot resolve `../js/ci/claims.js`.

- [ ] **Step 3: Write `js/ci/claims.js`**

```js
// ══════════════════════════════════════════════════════════════════════
// ci/claims.js — small facts that people say, and where they go (spec §7.5)
// ══════════════════════════════════════════════════════════════════════
//
// A claim is "HOLDER feels/did KIND about ABOUT", said by somebody. The engine
// knows whether it is true; the players do not. A listener believes it in
// proportion to their trust in whoever told them — and bad news about
// yourself lands harder when you are paranoid. The SOURCE travels with it:
// "Mercedeze said Antonio isn't even a factor" (US 1 Ep 2).
import { rel, bump, clamp, S } from './state.js';
import { nudgeBelief, noteAlly } from './beliefs.js';
import { feel } from './mind.js';

export const CLAIM_KINDS = ['distrusts', 'likes', 'targeting', 'catfish', 'real', 'ally',
  'saved', 'ratedLow', 'visitSaid'];
const JUICY = new Set(['distrusts', 'targeting', 'catfish', 'visitSaid', 'ratedLow']);
// Pairs that cannot both be true of the same holder and subject.
const OPPOSED = { saved: 'targeting', targeting: 'saved', likes: 'distrusts', distrusts: 'likes',
  catfish: 'real', real: 'catfish' };

export function makeClaim(state, { kind, about, holder, value = true, truth, secrecy = 'between', by, to = null }) {
  if (!CLAIM_KINDS.includes(kind)) throw new Error(`unknown claim kind ${kind}`);
  const claim = { id: `c${state.claims.length + 1}`, day: state.day, kind, about, holder, value,
    truth: !!truth, secrecy, origin: { by, to } };
  state.claims.push(claim);
  return claim;
}

export const claimById = (state, id) => state.claims.find(c => c.id === id);
export const knows = (state, obs, id) => !!state.know[obs]?.[id];

/** How much a listener takes from this teller: 0.05 (no trust) to 1 (themselves). */
export function weightFrom(obs, from) {
  if (from === obs) return 1;
  return clamp((rel(obs, from, 'trust') + 10) / 20, 0.05, 1);
}

export function learn(state, obs, claim, from, scene) {
  const row = (state.know[obs] ||= {});
  if (row[claim.id]) return false;
  row[claim.id] = { from, day: state.day };
  applyClaim(state, obs, claim, from, scene);
  return true;
}

function applyClaim(state, obs, claim, from, scene) {
  const w = weightFrom(obs, from);
  const alarm = 1 + (state.mind[obs]?.paranoia ?? 2) / 10;
  const aboutMe = claim.about === obs;
  const holder = claim.holder;
  switch (claim.kind) {
    case 'catfish':
      if (!aboutMe) nudgeBelief(state, obs, claim.about, 'real', -0.25 * w * alarm, scene);
      break;
    case 'real':
      if (!aboutMe) nudgeBelief(state, obs, claim.about, 'real', 0.15 * w, scene);
      break;
    case 'distrusts':
    case 'visitSaid':
      if (aboutMe && holder !== obs) {
        nudgeBelief(state, obs, holder, 'likesMe', -3 * w * alarm, scene);
        bump(obs, holder, 'trust', -1.5 * w);
        bump(obs, holder, 'resentment', 1 * w);
      } else if (!aboutMe && holder !== claim.about) {
        // A warning about somebody else ("watch out for Heather"): the
        // listener trusts that person a little less and watches them more.
        bump(obs, claim.about, 'trust', -0.8 * w);
        nudgeBelief(state, obs, claim.about, 'threat', 0.5 * w, scene);
      }
      break;
    case 'targeting':
      if (aboutMe && holder !== obs) {
        nudgeBelief(state, obs, holder, 'threat', 2 * w, scene);
        feel(state, obs, 'paranoia', 1 * w);
      }
      break;
    case 'likes':
      if (aboutMe && holder !== obs) nudgeBelief(state, obs, holder, 'likesMe', 2 * w, scene);
      break;
    case 'ally':
      if (holder !== obs) noteAlly(state, obs, holder, claim.about, scene);
      break;
    case 'saved':
      if (aboutMe && holder !== obs) bump(obs, holder, 'obligation', 1.5 * w);
      break;
    case 'ratedLow':
      if (aboutMe && holder !== obs) {
        nudgeBelief(state, obs, holder, 'likesMe', -2 * w, scene);
        bump(obs, holder, 'resentment', 1 * w);
      }
      break;
  }
}

/** The appetite to repeat a claim to this listener. 0 = keeps it. Proportional throughout. */
export function passOnWeight(state, knower, claim, listener) {
  if (claim.secrecy === 'public' || listener === knower) return 0;
  if (claim.origin.by === listener) return 0;
  const source = claim.origin.by;
  const loyalToSource = source === knower ? 1 : clamp((rel(knower, source, 'affection') + 10) / 20, 0, 1);
  const discretion = S(state, knower, 'loyalty') / 10;
  const toTarget = claim.about === listener ? 1.4 : 1;
  const juicy = JUICY.has(claim.kind) ? 1 : 0.5;
  const warmth = clamp((rel(knower, listener, 'affection') + 10) / 20, 0, 1);
  return juicy * toTarget * warmth * (1 - 0.6 * discretion * loyalToSource);
}

/** Pairs of claims this player holds that cannot both be true (spec §7.6). */
export function contradictions(state, obs) {
  const mine = state.claims.filter(c => state.know[obs]?.[c.id]);
  const out = [];
  for (let i = 0; i < mine.length; i++) for (let j = i + 1; j < mine.length; j++) {
    const a = mine[i], b = mine[j];
    if (a.holder !== b.holder || a.about !== b.about) continue;
    if (OPPOSED[a.kind] === b.kind || (a.kind === b.kind && a.value !== b.value)) out.push({ a, b });
  }
  return out;
}
```

- [ ] **Step 4: Run the test**

Run: `npx vitest run tests/ci-claims.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add js/ci/claims.js tests/ci-claims.test.js
git commit -m "feat(the-circle): claims with sources, spreading and contradictions"
```

---

### Task 6: Slips, probes and reveals

**Files:**
- Create: `js/ci/slips.js`, `js/ci/reveal.js`
- Test: `tests/ci-slips.test.js`

**Interfaces:**
- Consumes: Task 2 (`clamp`, `S`, `rel`, `peopleOf`, `addScene`), Task 4 (`nudgeBelief`, `setBelief`, `belief`, `feel`), Task 5 (`knows`).
- Produces (`slips.js`):
  - `slipRisk(state, h, { specific = 0.3, party = false }) → number` (0 for a profile with `gap` 0)
  - `noticeChance(state, obs, target, attention = 0.5) → number`
  - `rollSlips(state, rng, speaker, listeners, ctx, scene) → [{ kind, noticedBy }]` — also appends to `scene.data.slips`
  - `probe(state, rng, asker, target, scene) → 'pass' | 'dodge' | 'fail'`
  - `hasTheory(state, obs, target) → boolean`, `THEORY_LINE = 0.35`
- Produces (`reveal.js`):
  - `isRevealed(state, obs, target) → boolean`
  - `revealTo(state, obs, target, scene) → boolean` — sets the belief to the truth and writes person-to-person relationships (spec §5.4)
  - `wordsTrue(state, target, obs) → boolean`

Spec §7.7 and §5.3–§5.4. A slip is only a slip if somebody notices; a probe is the deliberate version (US 4 Ep 8, the golf question). At a reveal, a protective catfish keeps most of the warmth; a catfish who also lied about other players turns it to resentment; flirting under a false gender stings.

- [ ] **Step 1: Write the failing test** — `tests/ci-slips.test.js`

```js
import { describe, expect, it, beforeEach } from 'vitest';
import { setGs } from '../js/core.js';
import { rngFor, streamFor } from '../js/dr/rng.js';
import { newState, addScene, bump, rel } from '../js/ci/state.js';
import { belief } from '../js/ci/beliefs.js';
import { initMind } from '../js/ci/mind.js';
import { makeClaim, learn } from '../js/ci/claims.js';
import { slipRisk, noticeChance, rollSlips, probe, hasTheory } from '../js/ci/slips.js';
import { revealTo, isRevealed } from '../js/ci/reveal.js';

beforeEach(() => setGs({ bonds: {}, relationshipDimensions: {}, episodeHistory: [] }));

function room({ catfishGender = 'f', realGender = 'm', strategic = 5, intuition = 5 } = {}) {
  const s = newState(1);
  const stats = (o = {}) => ({ strategic: 5, mental: 5, intuition: 5, temperament: 5, loyalty: 5, ...o });
  s.people.Cat = { name: 'Cat', gender: realGender, archetype: 'floater', stats: stats({ strategic }) };
  s.people.Obs = { name: 'Obs', gender: 'f', archetype: 'floater', stats: stats({ intuition }) };
  s.people.Hon = { name: 'Hon', gender: 'm', archetype: 'floater', stats: stats() };
  s.profiles['@cat'] = { handle: '@cat', players: ['Cat'], mode: 'catfish', gap: 2, tells: ['golf'],
    shown: { gender: catfishGender, age: 23 } };
  s.profiles['@obs'] = { handle: '@obs', players: ['Obs'], mode: 'honest', gap: 0, tells: [], shown: { gender: 'f', age: 30 } };
  s.profiles['@hon'] = { handle: '@hon', players: ['Hon'], mode: 'honest', gap: 0, tells: [], shown: { gender: 'm', age: 30 } };
  s.active = ['@cat', '@obs', '@hon'];
  for (const h of s.active) initMind(s, h);
  return s;
}

describe('slips', () => {
  it('never happen to an honest profile, and happen more at a party', () => {
    const s = room();
    expect(slipRisk(s, '@hon')).toBe(0);
    expect(slipRisk(s, '@cat', { party: true })).toBeGreaterThan(slipRisk(s, '@cat'));
  });

  it('are rarer for a skilled liar and noticed more by an intuitive listener', () => {
    expect(slipRisk(room({ strategic: 10 }), '@cat')).toBeLessThan(slipRisk(room({ strategic: 1 }), '@cat'));
    expect(noticeChance(room({ intuition: 10 }), '@obs', '@cat')).toBeGreaterThan(noticeChance(room({ intuition: 1 }), '@obs', '@cat'));
  });

  it('lower the noticer\'s belief and are written onto the scene', () => {
    let hits = 0;
    for (let i = 0; i < 60; i++) {
      const s = room({ intuition: 10, strategic: 1 });
      const sc = addScene(s, 'chat', ['@cat', '@obs']);
      const out = rollSlips(s, rngFor(i * 7919 + 13), '@cat', ['@obs'], { specific: 1, party: true }, sc);
      if (out.some(x => x.noticedBy.includes('@obs'))) {
        hits++;
        expect(belief(s, '@obs', '@cat').real).toBeLessThan(0.85);
        expect(sc.data.slips.length).toBeGreaterThan(0);
      }
    }
    expect(hits).toBeGreaterThan(0);
  });
});

describe('probes', () => {
  it('an honest player always passes', () => {
    const s = room();
    const sc = addScene(s, 'chat', ['@obs', '@hon']);
    expect(probe(s, streamFor(1, 'p'), '@obs', '@hon', sc)).toBe('pass');
  });

  it('a clumsy catfish is caught out more than a strategic one, who dodges instead', () => {
    const tally = strategic => {
      let failed = 0;
      for (let i = 0; i < 300; i++) {
        const s = room({ strategic });
        const r = probe(s, streamFor(i, 'probe'), '@obs', '@cat', addScene(s, 'chat', ['@obs', '@cat']));
        if (r === 'fail') failed++;
      }
      return failed;
    };
    expect(tally(1)).toBeGreaterThan(tally(10));
  });

  it('two failed probes are enough for a theory', () => {
    const s = room({ strategic: 1 });
    const always = () => 0;   // every draw lands in the fail band
    expect(probe(s, always, '@obs', '@cat', addScene(s, 'chat', ['@obs', '@cat']))).toBe('fail');
    probe(s, always, '@obs', '@cat', addScene(s, 'chat', ['@obs', '@cat']));
    expect(hasTheory(s, '@obs', '@cat')).toBe(true);
  });
});

describe('reveals', () => {
  it('a protective catfish keeps most of the warmth', () => {
    const s = room();
    bump('@obs', '@cat', 'affection', 6);
    bump('@obs', '@cat', 'trust', 6);
    revealTo(s, '@obs', '@cat', addScene(s, 'visit', ['@cat', '@obs']));
    expect(isRevealed(s, '@obs', '@cat')).toBe(true);
    expect(belief(s, '@obs', '@cat').real).toBe(0);
    expect(rel('Obs', 'Cat', 'affection')).toBe(6);
    expect(rel('Obs', 'Cat', 'strategicRespect')).toBeGreaterThan(0);
    expect(rel('Obs', 'Cat', 'resentment')).toBe(0);
  });

  it('a catfish who lied about others turns warmth into resentment, and a false flirt stings', () => {
    const s = room();
    bump('@obs', '@cat', 'trust', 6);
    bump('@obs', '@cat', 'attraction', 7);
    const lie = makeClaim(s, { kind: 'distrusts', holder: '@hon', about: '@obs', truth: false, by: '@cat' });
    learn(s, '@obs', lie, '@cat', addScene(s, 'chat', ['@cat', '@obs']));
    revealTo(s, '@obs', '@cat', addScene(s, 'goodbye', ['@cat'], {}, ['@obs', '@hon']));
    expect(rel('Obs', 'Cat', 'resentment')).toBeGreaterThan(3);
    expect(rel('Obs', 'Cat', 'attraction')).toBeLessThan(2);
  });

  it('happens once per pair', () => {
    const s = room();
    const sc = addScene(s, 'goodbye', ['@cat'], {}, ['@obs']);
    expect(revealTo(s, '@obs', '@cat', sc)).toBe(true);
    expect(revealTo(s, '@obs', '@cat', sc)).toBe(false);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run tests/ci-slips.test.js`
Expected: FAIL — cannot resolve `../js/ci/slips.js`.

- [ ] **Step 3: Write `js/ci/slips.js`**

```js
// ══════════════════════════════════════════════════════════════════════
// ci/slips.js — when a cover shows, and when somebody goes looking (spec §7.7)
// ══════════════════════════════════════════════════════════════════════
//
// Real slips from the transcripts: a "golfer" who didn't know what an eagle
// is (US 4 Ep 8), period cramps "on my left side" and not knowing Adele (US 1
// Ep 12), a nickname let slip (US 3 Ep 13), and above all "too good to be
// true" (16 times in 90 episodes). A slip only counts if somebody notices.
import { clamp, S } from './state.js';
import { nudgeBelief, belief } from './beliefs.js';
import { feel } from './mind.js';

export const SLIP = { base: 0.008, stress: 0.06, party: 0.6, skill: 0.07 };
export const PROBE = { fail: 0.25, dodge: 0.08 };
export const THEORY_LINE = 0.35;
// A reader's paranoia finds something off even in an honest profile (US 1
// Alana: blocked first for "not being who she says she is", and she was).
export const MISREAD = 0.03;
export const SLIP_KINDS = ['knowledge', 'body', 'voice', 'tooPerfect', 'overreach', 'name'];

export function slipRisk(state, h, { specific = 0.3, party = false } = {}) {
  const p = state.profiles[h];
  if (!p?.gap) return 0;
  const stress = state.mind[h]?.stress ?? 2;
  const skill = (S(state, h, 'strategic') + S(state, h, 'mental')) / 2;
  return clamp(SLIP.base * p.gap * (1 + specific) * (1 + stress * SLIP.stress)
    * (party ? 1 + SLIP.party : 1) * (1 - skill * SLIP.skill), 0, 0.6);
}

export function noticeChance(state, obs, target, attention = 0.5) {
  const paranoia = state.mind[obs]?.paranoia ?? 2;
  return clamp(S(state, obs, 'intuition') / 10 * (0.15 + attention * 0.6) * (1 + paranoia / 20), 0, 0.95);
}

function slipKind(state, h, rng) {
  const p = state.profiles[h];
  const real = state.people[p.players[0]];
  const w = {
    knowledge: p.tells?.length ? 2 : 1,
    body: p.shown?.gender && p.shown.gender !== real.gender ? 1.5 : 0.2,
    voice: Math.abs((p.shown?.age ?? real.age) - (real.age ?? 25)) / 10,
    tooPerfect: p.mode === 'catfish' ? 1 : 0.5,
    overreach: 0.6,
    name: p.players.length > 1 ? 1 : 0.3,
  };
  let r = rng() * Object.values(w).reduce((a, b) => a + b, 0);
  for (const [k, v] of Object.entries(w)) { if ((r -= v) <= 0) return k; }
  return 'tooPerfect';
}

export function rollSlips(state, rng, speaker, listeners, ctx, scene) {
  const out = [];
  for (const obs of listeners) {
    if (obs === speaker) continue;
    const p = MISREAD * (state.mind[obs]?.paranoia ?? 2) / 10 * (1 + (ctx.attention ?? 0.5));
    if (rng() < p) {
      nudgeBelief(state, obs, speaker, 'real', -0.06, scene);
      const m = { kind: 'tooPerfect', noticedBy: [obs], misread: true };
      out.push(m);
      (scene.data.slips ||= []).push({ by: speaker, ...m });
    }
  }
  if (rng() >= slipRisk(state, speaker, ctx)) return out;
  const kind = slipKind(state, speaker, rng);
  const noticedBy = [];
  for (const obs of listeners) {
    if (obs === speaker) continue;
    if (rng() < noticeChance(state, obs, speaker, ctx.attention ?? 0.5)) {
      noticedBy.push(obs);
      nudgeBelief(state, obs, speaker, 'real', -(0.06 + 0.03 * state.profiles[speaker].gap), scene);
    }
  }
  const slip = { kind, noticedBy };
  out.push(slip);
  (scene.data.slips ||= []).push({ by: speaker, ...slip });
  return out;
}

/** "Some quick trivia to see if it's really you." */
export function probe(state, rng, asker, target, scene) {
  const p = state.profiles[target];
  const record = r => { (scene.data.probes ||= []).push({ asker, target, result: r }); return r; };
  if (!p?.gap) { nudgeBelief(state, asker, target, 'real', 0.12, scene); return record('pass'); }
  const fail = clamp(PROBE.fail * p.gap * (1 - S(state, target, 'mental') / 15), 0, 0.8);
  const dodge = clamp(S(state, target, 'strategic') * PROBE.dodge, 0, 0.8);
  feel(state, target, 'stress', 0.8);
  const r = rng();
  if (r < fail * (1 - dodge)) { nudgeBelief(state, asker, target, 'real', -0.25, scene); return record('fail'); }
  if (r < fail) {
    nudgeBelief(state, asker, target, 'real', -0.08 * S(state, asker, 'intuition') / 10, scene);
    return record('dodge');
  }
  nudgeBelief(state, asker, target, 'real', 0.08, scene);
  return record('pass');
}

export const hasTheory = (state, obs, target) => belief(state, obs, target).real < THEORY_LINE;
```

- [ ] **Step 4: Write `js/ci/reveal.js`**

```js
// ══════════════════════════════════════════════════════════════════════
// ci/reveal.js — when a profile's truth reaches a player (spec §5.3–§5.4)
// ══════════════════════════════════════════════════════════════════════
//
// Relationships live on PROFILE handles during the season. When a player
// learns who is really behind a profile (a visit, a goodbye video, a
// confession, the finale meet), their feelings are CONVERTED into feelings
// about the real person — and that person-to-person record is what the
// franchise ledger will keep (Plan 6).
//
//   words true, face false (protective catfish): warmth carries, respect up.
//     "The connection was real." — US 1 Shubham on Seaburn.
//   words false too (they lied about other players to you): resentment.
//   flirted with under a false gender: the attraction turns to resentment.
import { rel, peopleOf } from './state.js';
import { setBelief } from './beliefs.js';
import { RELATIONSHIP_DIMENSIONS, setRelationshipDimension } from '../relationships.js';

export const isRevealed = (state, obs, target) => !!state.revealed[obs]?.[target];

/** Did this profile tell `obs` anything false about another player? */
export function wordsTrue(state, target, obs) {
  return !state.claims.some(c => c.origin.by === target && c.truth === false && state.know[obs]?.[c.id]);
}

export function revealTo(state, obs, target, scene) {
  if (obs === target || isRevealed(state, obs, target)) return false;
  (state.revealed[obs] ||= {})[target] = true;
  const p = state.profiles[target];
  const truth = p.mode === 'catfish' ? 0 : p.mode === 'edited' ? 0.7 : 1;
  setBelief(state, obs, target, 'real', truth, scene);
  convertFeelings(state, obs, target);
  return true;
}

function convertFeelings(state, obs, target) {
  const p = state.profiles[target];
  const d = Object.fromEntries(RELATIONSHIP_DIMENSIONS.map(k => [k, rel(obs, target, k)]));
  if (p.mode === 'catfish') {
    const honestWords = wordsTrue(state, target, obs);
    const ideal = state.ideal[obs]?.[target] || 0;
    d.trust = d.trust * 0.7 + (honestWords ? 1 : -3);
    d.strategicRespect += 1.5;
    d.resentment += (honestWords ? 0 : 3) + ideal * 0.3;
    const realGender = state.people[p.players[0]].gender;
    if (d.attraction > 0 && p.shown.gender !== realGender) {
      d.resentment += d.attraction * 0.3;
      d.attraction *= 0.2;
    }
  } else if (p.mode === 'edited') {
    d.trust -= 0.5;
  }
  for (const a of peopleOf(state, obs)) for (const b of peopleOf(state, target)) {
    for (const [k, v] of Object.entries(d)) setRelationshipDimension(a, b, k, v);
  }
  return d;
}
```

- [ ] **Step 5: Run the test**

Run: `npx vitest run tests/ci-slips.test.js`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add js/ci/slips.js js/ci/reveal.js tests/ci-slips.test.js
git commit -m "feat(the-circle): catfish slips, probes, theories and the profile-to-person reveal"
```

---

### Task 7: Private chats — who talks to whom, and how it ends

**Files:**
- Create: `js/ci/chat.js`, `js/ci/conversation.js`
- Test: `tests/ci-chat.test.js`

**Interfaces:**
- Consumes: Tasks 2–6 (`rel`, `bump`, `S`, `clamp`, `addScene`, `isActive`, `schemeEligible`, `makePact`; `belief`; `feel`, `mood`; `makeClaim`, `learn`, `passOnWeight`, `contradictions`; `rollSlips`, `probe`; `revealTo`).
- Produces (`chat.js`):
  - `INTENTS` — `['bond','ally','flirt','probe','pump','compare','plant','credit','repair','confront','checkin','pitch','confess']`
  - `attractionOk(state, me, you) → boolean` — `me`'s sexuality against `you`'s **shown** gender
  - `seedAttraction(state, rng)` — first sparks between every compatible pair of profiles
  - `utilities(state, me, you, ctx) → { [intent]: number }`
  - `contextFor(state, day) → ctx` — `{ day, ratingSoon, party, hurting, newsOf, creditable, protectedBy, rivalOf, contradictionWith }`
  - `planChats(state, rng, ctx) → [{ from, to, intent }]`
- Produces (`conversation.js`):
  - `EFFECT` (table), `reception(state, to, from, intent) → number`, `decideEnding(rng, reception) → 'warm'|'neutral'|'cold'`
  - `runChat(state, rng, plan, ctx) → scene` — scene kind `'chat'`, data `{ intent, ending, turns: [{ from, tone }], claims: [ids], pact, slips?, probes?, exposed?, confessed? }`

Spec §7.3–§7.4. **The ending is decided before anything else** (the Perfect Match lesson: a scene's words must agree with its outcome), then effects, then turns and slips, then the intent's own consequence, then gossip. Every intent and every effect weight is proportional; none of them is a threshold except the narration-free eligibility rules.

`ctx` is built each day by `contextFor` from yesterday's scenes (so a player acts on what they saw, not on what happened in a room they weren't in):

| field | meaning | built from |
|---|---|---|
| `hurting` | profiles who ended in the bottom three yesterday | yesterday's rating row |
| `newsOf` | profiles with something to tell (visited, or an influencer) | yesterday's `visit` scenes and influencers |
| `creditable` | `{ influencer: [survivors] }` | yesterday's `hangout` |
| `protectedBy` | `{ survivor: [influencers who scored them in their lower half] }` | the hangout's `views` — the truth behind a credit claim |
| `rivalOf` | each player's biggest rival (resentment + believed threat) | relationships and beliefs |
| `contradictionWith` | `{ me: { otherSource: true } }` | `contradictions()` |

- [ ] **Step 1: Write the failing test** — `tests/ci-chat.test.js`

```js
import { describe, expect, it, beforeEach } from 'vitest';
import { setGs } from '../js/core.js';
import { streamFor } from '../js/dr/rng.js';
import { newState, addScene, bump, rel } from '../js/ci/state.js';
import { initMind, mood } from '../js/ci/mind.js';
import { belief } from '../js/ci/beliefs.js';
import { makeClaim, learn } from '../js/ci/claims.js';
import { isRevealed } from '../js/ci/reveal.js';
import { utilities, planChats, attractionOk, contextFor } from '../js/ci/chat.js';
import { runChat } from '../js/ci/conversation.js';

beforeEach(() => setGs({ bonds: {}, relationshipDimensions: {}, episodeHistory: [] }));

const STATS = { physical: 5, endurance: 5, mental: 5, social: 5, strategic: 5, loyalty: 5, boldness: 5, intuition: 5, temperament: 5 };
function room(specs) {
  const s = newState(1);
  for (const [name, o] of Object.entries(specs)) {
    s.people[name] = { name, gender: o.gender || 'f', sexuality: o.sexuality || 'straight',
      archetype: o.archetype || 'floater', stats: { ...STATS, ...(o.stats || {}) }, age: 25 };
    const h = `@${name.toLowerCase()}`;
    s.profiles[h] = { handle: h, players: [name], mode: o.mode || 'honest', gap: o.mode === 'catfish' ? 2 : 0,
      tells: [], shown: { gender: o.shown || o.gender || 'f', age: 25 } };
    s.handleOf[name] = h;
    s.active.push(h);
    initMind(s, h);
  }
  return s;
}
const always = v => () => v;

describe('choosing chats', () => {
  it('never plans a chat with yourself or with a blocked player, and respects the budget', () => {
    const s = room({ A: { stats: { social: 10 } }, B: {}, C: {}, D: {} });
    s.active = s.active.filter(h => h !== '@d');
    const plans = planChats(s, streamFor(1, 'chat'), contextFor(s, 1));
    for (const p of plans) {
      expect(p.from).not.toBe(p.to);
      expect(s.active).toContain(p.to);
    }
    const fromA = plans.filter(p => p.from === '@a');
    expect(fromA.length).toBeLessThanOrEqual(4);
    expect(new Set(fromA.map(p => p.to)).size).toBe(fromA.length);
  });

  it('never lets a nice archetype plant a claim', () => {
    const s = room({ H: { archetype: 'hero', stats: { strategic: 10, loyalty: 1 } }, R: {}, F: {} });
    bump('@h', '@r', 'resentment', 9);
    const ctx = { ...contextFor(s, 2), rivalOf: { '@h': '@r' } };
    expect(utilities(s, '@h', '@f', ctx).plant).toBe(0);
    const v = room({ V: { archetype: 'villain' }, R: {}, F: {} });
    expect(utilities(v, '@v', '@f', { ...contextFor(v, 2), rivalOf: { '@v': '@r' } }).plant).toBeGreaterThan(0);
  });

  it('lets a nice player claim credit only when it is true', () => {
    const s = room({ H: { archetype: 'hero', stats: { loyalty: 2 } }, X: {} });
    const ctx = { ...contextFor(s, 2), creditable: { '@h': ['@x'] } };
    expect(utilities(s, '@h', '@x', ctx).credit).toBe(0);
    expect(utilities(s, '@h', '@x', { ...ctx, protectedBy: { '@x': ['@h'] } }).credit).toBeGreaterThan(0);
  });

  it('flirts only toward the gender a player is into, as the profile shows it', () => {
    const s = room({ M: { gender: 'm' }, CAT: { gender: 'm', shown: 'f', mode: 'catfish' }, G: { gender: 'm' } });
    expect(attractionOk(s, '@m', '@cat')).toBe(true);
    expect(attractionOk(s, '@m', '@g')).toBe(false);
  });

  it('wants to probe a profile it suspects', () => {
    const s = room({ A: { stats: { intuition: 9 } }, B: {} });
    const calm = utilities(s, '@a', '@b', contextFor(s, 1)).probe;
    belief(s, '@a', '@b').real = 0.2;
    expect(utilities(s, '@a', '@b', contextFor(s, 1)).probe).toBeGreaterThan(calm);
  });
});

describe('running a chat', () => {
  it('decides the ending first and every turn carries it', () => {
    const s = room({ A: {}, B: {} });
    const sc = runChat(s, streamFor(4, 'x'), { from: '@a', to: '@b', intent: 'bond' }, {});
    expect(['warm', 'neutral', 'cold']).toContain(sc.data.ending);
    expect(sc.data.turns.length).toBeGreaterThanOrEqual(2);
    for (const t of sc.data.turns) expect(t.tone).toBe(sc.data.ending);
  });

  it('a warm bond warms both sides and eases loneliness', () => {
    const s = room({ A: {}, B: {} });
    const before = mood(s, '@b', 'loneliness');
    runChat(s, always(0), { from: '@a', to: '@b', intent: 'bond' }, {});   // rng 0 → warm
    expect(rel('@b', '@a', 'affection')).toBeGreaterThan(0);
    expect(rel('@a', '@b', 'affection')).toBeGreaterThan(0);
    expect(mood(s, '@b', 'loneliness')).toBeLessThan(before);
  });

  it('a warm alliance makes a protect pact; a warm pitch makes a rate pact', () => {
    const s = room({ A: {}, B: {} });
    const ally = runChat(s, always(0), { from: '@a', to: '@b', intent: 'ally' }, {});
    const pitch = runChat(s, always(0), { from: '@a', to: '@b', intent: 'pitch' }, {});
    expect(s.pacts.find(p => p.id === ally.data.pact).kind).toBe('protect');
    expect(s.pacts.find(p => p.id === pitch.data.pact).kind).toBe('rate');
  });

  it('a pump passes on what the other one heard', () => {
    const s = room({ A: {}, B: { stats: { loyalty: 1 } }, C: {} });
    bump('@b', '@a', 'affection', 9);
    const c = makeClaim(s, { kind: 'targeting', holder: '@c', about: '@a', truth: true, by: '@c' });
    learn(s, '@b', c, '@c', addScene(s, 'chat', ['@b', '@c']));
    const sc = runChat(s, always(0), { from: '@a', to: '@b', intent: 'pump' }, {});
    expect(sc.data.claims).toContain(c.id);
    expect(s.know['@a'][c.id].from).toBe('@b');
  });

  it('comparing notes can expose a liar', () => {
    const s = room({ A: {}, B: { stats: { intuition: 10 } }, C: { stats: { intuition: 10 } } });
    const lie = makeClaim(s, { kind: 'saved', holder: '@a', about: '@c', truth: false, by: '@a' });
    const truth = makeClaim(s, { kind: 'targeting', holder: '@a', about: '@c', truth: true, by: '@b' });
    learn(s, '@c', lie, '@a', addScene(s, 'chat', ['@a', '@c']));
    learn(s, '@c', truth, '@b', addScene(s, 'chat', ['@b', '@c']));
    const sc = runChat(s, always(0), { from: '@c', to: '@b', intent: 'compare' }, {});
    expect(sc.data.exposed).toBe('@a');
    expect(rel('@c', '@a', 'trust')).toBeLessThan(0);
    expect(rel('@b', '@a', 'trust')).toBeLessThan(0);
  });

  it('a confession reveals the truth to the one confessed to', () => {
    const s = room({ CAT: { mode: 'catfish' }, B: {} });
    runChat(s, always(0), { from: '@cat', to: '@b', intent: 'confess' }, {});
    expect(isRevealed(s, '@b', '@cat')).toBe(true);
  });

  it('a probe\'s ending is the probe\'s result', () => {
    const s = room({ A: {}, B: {} });
    const sc = runChat(s, streamFor(2, 'p'), { from: '@a', to: '@b', intent: 'probe' }, {});
    expect(sc.data.probes[0].result).toBe('pass');
    expect(sc.data.ending).toBe('warm');
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run tests/ci-chat.test.js`
Expected: FAIL — cannot resolve `../js/ci/chat.js`.

- [ ] **Step 3: Write `js/ci/chat.js`**

```js
// ══════════════════════════════════════════════════════════════════════
// ci/chat.js — who opens a chat with whom, and why (spec §7.3)
// ══════════════════════════════════════════════════════════════════════
//
// Every reason on this list is one the real players had, with its example in
// the spec. A player's day has a small budget of chats; they spend it where
// their feelings, their beliefs and their mood point. Who you reach out to —
// and who does not reach out to you — is itself news (US 1 Ep 2: "Antonio
// didn't even bring up anything about last night. They're jerks.").
import { rel, bump, S, clamp, isActive, schemeEligible } from './state.js';
import { belief } from './beliefs.js';
import { mood } from './mind.js';
import { contradictions } from './claims.js';

export const INTENTS = ['bond', 'ally', 'flirt', 'probe', 'pump', 'compare', 'plant', 'credit',
  'repair', 'confront', 'checkin', 'pitch', 'confess'];
export const SPARK = 6;
// A persona is chosen to be liked: "online, hot girls get more likes" (US 1
// Ep 1, Seaburn on why he played Rebecca). Catfish draw first sparks higher.
export const PERSONA_APPEAL = 1.4;

export function attractionOk(state, me, you) {
  const t = state.people[state.profiles[me].players[0]];
  const g = state.profiles[you].shown.gender;
  if (t.sexuality === 'bi') return true;
  if (t.sexuality === 'gay') return g === t.gender;
  return g !== t.gender;
}

/** First sparks: every compatible pair gets 0..SPARK attraction, one way at a time. */
export function seedAttraction(state, rng) {
  const all = Object.keys(state.profiles);
  for (const a of all) for (const b of all) {
    if (a !== b && attractionOk(state, a, b)) {
      bump(a, b, 'attraction', rng() * SPARK * (state.profiles[b].mode === 'catfish' ? PERSONA_APPEAL : 1));
    }
  }
}

export function utilities(state, me, you, ctx = {}) {
  const aff = rel(me, you, 'affection'), tr = rel(me, you, 'trust'), res = rel(me, you, 'resentment');
  const att = rel(me, you, 'attraction');
  const b = belief(state, me, you);
  const st = k => S(state, me, k) / 10;
  const lonely = mood(state, me, 'loneliness') / 10, para = mood(state, me, 'paranoia') / 10;
  const guilt = mood(state, me, 'guilt') / 10;
  const catfish = state.profiles[me].mode === 'catfish';
  return {
    bond: st('social') * (1 - Math.abs(aff) / 10) + lonely * 0.25,
    ally: aff > 0 && tr > 0 ? st('strategic') * (aff + tr) / 8 : 0,
    flirt: attractionOk(state, me, you) ? att / 10 * (0.5 + st('boldness') * 0.5) : 0,
    probe: (1 - b.real) * st('intuition') * (1 + para),
    pump: ctx.newsOf?.includes(you) ? st('strategic') * 0.8 : 0,
    compare: ctx.contradictionWith?.[me]?.[you] ? 1.5 : 0,
    plant: schemeEligible(state, me) && ctx.rivalOf?.[me] && ctx.rivalOf[me] !== you
      ? st('strategic') * (aff + 10) / 20 : 0,
    // Claiming credit you did not earn is manipulation: a nice player only
    // says "I had your back" when it is true (spec §4.4).
    credit: ctx.creditable?.[me]?.includes(you)
      && (schemeEligible(state, me) || ctx.protectedBy?.[you]?.includes(me)) ? 1 - st('loyalty') : 0,
    repair: b.likesMe < -2 ? st('temperament') * 0.8 : 0,
    confront: res > 4 ? st('boldness') * res / 10 : 0,
    checkin: ctx.hurting?.includes(you) && aff > 2 ? st('social') : 0,
    pitch: ctx.ratingSoon && aff > 3 ? st('strategic') : 0,
    confess: catfish && aff > 5 ? guilt * st('loyalty') : 0,
  };
}

export function planChats(state, rng, ctx) {
  const plans = [];
  const order = state.active.map(h => [h, rng()]).sort((a, b) => a[1] - b[1]).map(([h]) => h);
  for (const me of order) {
    const budget = clamp(Math.round(1 + S(state, me, 'social') / 4 - mood(state, me, 'stress') / 6), 1, 4);
    const options = [];
    for (const you of state.active) {
      if (you === me) continue;
      const u = utilities(state, me, you, ctx);
      const [intent, w] = Object.entries(u).sort((a, b) => b[1] - a[1])[0];
      if (w > 0) options.push({ from: me, to: you, intent, w: w * (0.7 + 0.6 * rng()) });
    }
    options.sort((a, b) => b.w - a.w);
    for (const o of options.slice(0, budget)) plans.push({ from: o.from, to: o.to, intent: o.intent });
  }
  return plans;
}

/** What each player can act on today, built only from what happened yesterday. */
export function contextFor(state, day) {
  const y = state.day - 1;
  const live = h => isActive(state, h);
  const lastRating = [...state.ratings].reverse().find(r => r.day === y && !r.final);
  const hurting = lastRating ? lastRating.results.slice(-3).map(r => r.profile).filter(live) : [];
  const newsOf = [...new Set([
    ...state.scenes.filter(s => s.day === y && s.kind === 'visit').flatMap(s => s.who),
    ...(lastRating?.influencers || []),
  ])].filter(live);
  const creditable = {}, protectedBy = {};
  const hang = state.scenes.find(s => s.day === y && s.kind === 'hangout');
  if (hang?.data?.views) {
    for (const i of hang.who) creditable[i] = hang.data.atRisk.filter(live);
    for (const i of hang.who) {
      const scores = hang.data.views.map(v => v.by[i]).sort((a, b) => a - b);
      const median = scores[scores.length >> 1];
      for (const v of hang.data.views) if (v.by[i] < median) (protectedBy[v.handle] ||= []).push(i);
    }
  }
  const rivalOf = {};
  for (const h of state.active) {
    let best = null, top = 3;
    for (const o of state.active) {
      if (o === h) continue;
      const score = rel(h, o, 'resentment') + belief(state, h, o).threat * 0.5;
      if (score > top) { top = score; best = o; }
    }
    rivalOf[h] = best;
  }
  const contradictionWith = {};
  for (const h of state.active) {
    for (const { a, b } of contradictions(state, h)) {
      const other = [a.origin.by, b.origin.by].find(x => x !== h && live(x));
      if (other) (contradictionWith[h] ||= {})[other] = true;
    }
  }
  return { day: day?.day ?? day, ratingSoon: !!(day?.block || day?.final), party: false,
    hurting, newsOf, creditable, protectedBy, rivalOf, contradictionWith };
}
```

- [ ] **Step 4: Write `js/ci/conversation.js`**

```js
// ══════════════════════════════════════════════════════════════════════
// ci/conversation.js — one private chat, from outcome to consequence (spec §7.4)
// ══════════════════════════════════════════════════════════════════════
//
// ORDER MATTERS. 1) the ending is decided, 2) its effects are applied, 3) the
// turns are laid out (each carrying the ending's tone) and slips are rolled,
// 4) the intent's own consequence (a pact, a claim, a reveal), 5) gossip on a
// warm chat. Plan 2 writes words FROM this record, so a scene can never say
// one thing while the numbers did another.
import { rel, bump, S, clamp, addScene, makePact } from './state.js';
import { belief } from './beliefs.js';
import { feel, mood } from './mind.js';
import { makeClaim, learn, passOnWeight, contradictions } from './claims.js';
import { rollSlips, probe } from './slips.js';
import { revealTo } from './reveal.js';
import { attractionOk } from './chat.js';

// What the receiver comes to feel toward the sender, by intent and ending.
export const EFFECT = {
  bond:     { warm: { affection: 1.2, trust: 0.6 }, neutral: { affection: 0.4 }, cold: { affection: -0.4 } },
  ally:     { warm: { trust: 1.5, affection: 0.6, obligation: 0.8 }, neutral: { trust: 0.3 }, cold: { trust: -0.6 } },
  flirt:    { warm: { attraction: 1.2, affection: 0.8 }, neutral: { affection: 0.2 }, cold: { attraction: -0.8 } },
  probe:    { warm: { trust: 0.3 }, neutral: {}, cold: { resentment: 0.8, trust: -0.8 } },
  pump:     { warm: { trust: 0.4 }, neutral: {}, cold: { trust: -0.3 } },
  compare:  { warm: { trust: 1.0 }, neutral: { trust: 0.3 }, cold: {} },
  plant:    { warm: { trust: 0.6 }, neutral: {}, cold: { trust: -0.5 } },
  credit:   { warm: { affection: 0.6 }, neutral: {}, cold: { trust: -0.6 } },
  repair:   { warm: { affection: 1.0, resentment: -1.5, trust: 0.8 }, neutral: { resentment: -0.5 }, cold: { resentment: 0.5 } },
  confront: { warm: { resentment: -1.0 }, neutral: { resentment: 0.3 }, cold: { resentment: 1.5, affection: -1.0 } },
  checkin:  { warm: { affection: 1.2, trust: 0.8 }, neutral: { affection: 0.4 }, cold: {} },
  pitch:    { warm: { trust: 0.8, obligation: 0.6 }, neutral: {}, cold: { trust: -0.3 } },
  confess:  { warm: { trust: 1.0 }, neutral: { trust: -0.5 }, cold: { trust: -2, resentment: 1.5 } },
};
const FIT = { bond: 0.3, checkin: 0.4, ally: 0.1, pitch: 0, repair: 0.1, credit: 0.1, compare: 0.1,
  plant: 0.1, pump: 0, confess: 0, probe: -0.2, confront: -0.3 };
const WARMING = new Set(['bond', 'checkin', 'flirt', 'ally']);

export function reception(state, to, from, intent) {
  const base = (rel(to, from, 'affection') + rel(to, from, 'trust')) / 20;
  const fit = intent === 'flirt'
    ? (attractionOk(state, to, from) ? rel(to, from, 'attraction') / 10 - 0.2 : -0.6)
    : FIT[intent] ?? 0;
  return base + fit + mood(state, to, 'loneliness') / 20;
}

export function decideEnding(rng, rec) {
  const pWarm = clamp(0.35 + 0.45 * rec, 0.05, 0.9);
  const pCold = clamp(0.2 - 0.35 * rec, 0.03, 0.7);
  const r = rng();
  return r < pWarm ? 'warm' : r < pWarm + pCold ? 'cold' : 'neutral';
}

function applyEffect(state, from, to, intent, ending) {
  const e = EFFECT[intent][ending];
  for (const [dim, v] of Object.entries(e)) bump(to, from, dim, v);
  if (ending !== 'cold') for (const dim of ['affection', 'trust']) if (e[dim] > 0) bump(from, to, dim, e[dim] * 0.6);
  if (ending === 'warm' && WARMING.has(intent)) {
    for (const [a, b] of [[from, to], [to, from]]) { const row = (state.ideal[a] ||= {}); row[b] = (row[b] || 0) + 0.4; }
    feel(state, from, 'loneliness', -1.5);
    feel(state, to, 'loneliness', -1.5);
  }
  if (ending === 'cold') feel(state, from, 'stress', 0.8);
}

const RUN = {
  ally(state, rng, sc, from, to, ending) { if (ending === 'warm') sc.data.pact = makePact(state, 'protect', from, to); },
  pitch(state, rng, sc, from, to, ending) { if (ending === 'warm') sc.data.pact = makePact(state, 'rate', from, to); },
  pump(state, rng, sc, from, to, ending) {
    if (ending === 'cold') return;
    const best = state.claims.filter(c => state.know[to]?.[c.id] && !state.know[from]?.[c.id])
      .map(c => [c, passOnWeight(state, to, c, from)]).sort((a, b) => b[1] - a[1])[0];
    if (best && rng() < best[1]) { learn(state, from, best[0], to, sc); sc.data.claims.push(best[0].id); }
  },
  plant(state, rng, sc, from, to, ending, ctx) {
    const rival = ctx.rivalOf?.[from];
    if (!rival || rival === to) return;
    const c = belief(state, from, rival).real < 0.5
      ? makeClaim(state, { kind: 'catfish', holder: from, about: rival, truth: state.profiles[rival].mode === 'catfish', by: from, to })
      : makeClaim(state, { kind: 'distrusts', holder: rival, about: to, truth: rel(rival, to, 'trust') < 0, by: from, to });
    sc.data.claims.push(c.id);
    if (ending !== 'cold') learn(state, to, c, from, sc);
  },
  credit(state, rng, sc, from, to, ending, ctx) {
    const c = makeClaim(state, { kind: 'saved', holder: from, about: to,
      truth: !!ctx.protectedBy?.[to]?.includes(from), by: from, to });
    sc.data.claims.push(c.id);
    learn(state, to, c, from, sc);
  },
  compare(state, rng, sc, from, to) {
    const pair = contradictions(state, from).find(({ a, b }) =>
      a.origin.by === to || b.origin.by === to || state.know[to]?.[a.id] || state.know[to]?.[b.id]);
    if (!pair) return;
    for (const c of [pair.a, pair.b]) if (!state.know[to]?.[c.id]) learn(state, to, c, from, sc);
    const solve = (S(state, from, 'intuition') + S(state, to, 'intuition')) / 20;
    if (rng() >= solve) return;
    const liar = [pair.a, pair.b].find(c => !c.truth)?.origin.by;
    if (!liar || liar === from || liar === to) return;
    for (const x of [from, to]) { bump(x, liar, 'trust', -3); bump(x, liar, 'resentment', 2); }
    sc.data.exposed = liar;
  },
  confess(state, rng, sc, from, to) {
    revealTo(state, to, from, sc);
    feel(state, from, 'guilt', -3);
    sc.data.confessed = true;
  },
  confront(state, rng, sc, from, to, ending) { if (ending === 'cold') bump(from, to, 'resentment', 0.8); },
};

/** On a warm chat each side may pass on the juiciest thing the other hasn't heard. */
function gossip(state, rng, sc, from, to) {
  for (const [x, y] of [[from, to], [to, from]]) {
    const pick = state.claims.filter(c => state.know[x]?.[c.id] && !state.know[y]?.[c.id])
      .map(c => [c, passOnWeight(state, x, c, y)]).sort((a, b) => b[1] - a[1])[0];
    if (pick && rng() < pick[1] * 0.5) { learn(state, y, pick[0], x, sc); sc.data.claims.push(pick[0].id); }
  }
}

export function runChat(state, rng, plan, ctx = {}) {
  const { from, to, intent } = plan;
  const sc = addScene(state, 'chat', [from, to], { intent, ending: null, turns: [], claims: [], pact: null });
  let ending;
  if (intent === 'probe') {
    const r = probe(state, rng, from, to, sc);
    ending = r === 'pass' ? 'warm' : r === 'dodge' ? 'neutral' : 'cold';
  } else {
    ending = decideEnding(rng, reception(state, to, from, intent));
  }
  sc.data.ending = ending;
  applyEffect(state, from, to, intent, ending);
  const turns = 2 + Math.floor(rng() * 5);
  for (let i = 0; i < turns; i++) {
    const speaker = i % 2 === 0 ? from : to;
    const listener = speaker === from ? to : from;
    sc.data.turns.push({ from: speaker, tone: ending });
    rollSlips(state, rng, speaker, [listener],
      { specific: intent === 'probe' ? 1 : 0.3, party: !!ctx.party, attention: 0.6 }, sc);
  }
  RUN[intent]?.(state, rng, sc, from, to, ending, ctx);
  if (ending === 'warm') gossip(state, rng, sc, from, to);
  return sc;
}
```

- [ ] **Step 5: Run the test**

Run: `npx vitest run tests/ci-chat.test.js`
Expected: PASS. If "a probe's ending is the probe's result" fails, check that `probe()` records into `sc.data.probes` (Task 6) before `runChat` reads it.

- [ ] **Step 6: Commit**

```bash
git add js/ci/chat.js js/ci/conversation.js tests/ci-chat.test.js
git commit -m "feat(the-circle): private chats — intents, decided endings, pacts, claims, exposure"
```

---

### Task 8: The morning Newsfeed and Circle Chat

**Files:**
- Create: `js/ci/feed.js`
- Test: `tests/ci-feed.test.js`

**Interfaces:**
- Consumes: Tasks 2–6.
- Produces:
  - `morningFeed(state, rng) → scene` — one `'status'` scene per active player (`data.tone ∈ 'low'|'steady'|'high'`, a narration label), then one `'likes'` scene (`data.likes: { liker: [liked] }`); sets `state.likesCount`
  - `runCircleChat(state, rng, { party = false, final = false }) → scene` — kind `'circle-chat'`, data `{ party, final, posts: [{ by }], theories: [{ by, about, claim }] }`

Spec §7.8 and §2.5. Every morning: "Please update your status." Other players read the statuses and count likes ("Oh, I got four, yes!"). Circle Chat is where a theory goes public — and a public theory reaches everyone at once.

- [ ] **Step 1: Write the failing test** — `tests/ci-feed.test.js`

```js
import { describe, expect, it, beforeEach } from 'vitest';
import { setGs } from '../js/core.js';
import { streamFor } from '../js/dr/rng.js';
import { newState, bump, rel } from '../js/ci/state.js';
import { initMind, mood } from '../js/ci/mind.js';
import { belief } from '../js/ci/beliefs.js';
import { morningFeed, runCircleChat } from '../js/ci/feed.js';

beforeEach(() => setGs({ bonds: {}, relationshipDimensions: {}, episodeHistory: [] }));

const STATS = { physical: 5, endurance: 5, mental: 5, social: 5, strategic: 5, loyalty: 5, boldness: 5, intuition: 5, temperament: 5 };
function room(names, over = {}) {
  const s = newState(1);
  for (const n of names) {
    s.people[n] = { name: n, gender: 'f', sexuality: 'straight', archetype: 'floater', stats: { ...STATS, ...(over[n] || {}) }, age: 25 };
    const h = `@${n.toLowerCase()}`;
    s.profiles[h] = { handle: h, players: [n], mode: 'honest', gap: 0, tells: [], shown: { gender: 'f', age: 25 } };
    s.active.push(h);
    initMind(s, h);
  }
  return s;
}

describe('the morning feed', () => {
  it('posts one status each, seen by everyone', () => {
    const s = room(['A', 'B', 'C']);
    morningFeed(s, streamFor(1, 'feed'));
    const statuses = s.scenes.filter(x => x.kind === 'status');
    expect(statuses).toHaveLength(3);
    for (const st of statuses) expect(st.seenBy.sort()).toEqual(['@a', '@b', '@c']);
  });

  it('a like warms the liked toward the liker, and is counted', () => {
    const s = room(['A', 'B', 'C']);
    bump('@a', '@b', 'affection', 8);
    morningFeed(s, streamFor(2, 'feed'));
    expect(s.scenes.at(-1).data.likes['@a']).toContain('@b');
    expect(rel('@b', '@a', 'affection')).toBeGreaterThan(0);
    expect(s.likesCount['@b']).toBeGreaterThanOrEqual(1);
  });
});

describe('Circle Chat', () => {
  it('takes a theory public: everyone learns it, the accused resents it', () => {
    const s = room(['A', 'B', 'C', 'D'], { A: { boldness: 10 } });
    belief(s, '@a', '@d').real = 0.1;
    const sc = runCircleChat(s, () => 0, {});
    expect(sc.data.theories[0]).toMatchObject({ by: '@a', about: '@d' });
    const id = sc.data.theories[0].claim;
    for (const h of ['@b', '@c', '@d']) expect(s.know[h][id].from).toBe('@a');
    expect(rel('@d', '@a', 'resentment')).toBeGreaterThan(0);
  });

  it('eases loneliness, a party most of all', () => {
    const quiet = room(['A', 'B']), party = room(['A', 'B']);
    quiet.mind['@a'].loneliness = 8; party.mind['@a'].loneliness = 8;
    runCircleChat(quiet, streamFor(3, 'c'), {});
    runCircleChat(party, streamFor(3, 'c'), { party: true });
    expect(mood(party, '@a', 'loneliness')).toBeLessThan(mood(quiet, '@a', 'loneliness'));
    expect(mood(quiet, '@a', 'loneliness')).toBeLessThan(8);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run tests/ci-feed.test.js`
Expected: FAIL — cannot resolve `../js/ci/feed.js`.

- [ ] **Step 3: Write `js/ci/feed.js`**

```js
// ══════════════════════════════════════════════════════════════════════
// ci/feed.js — the Newsfeed and Circle Chat, where everybody sees everything
// ══════════════════════════════════════════════════════════════════════
//
// Morning: "Please update your status." Statuses are posted and read aloud
// in other apartments; likes are counted and noticed. Circle Chat: the only
// room with everyone in it — and so the place a catfish theory goes public
// (US 1 Ep 1's Ice Breaker: three players decide out loud that Sammie might
// be a man). Parties are Plan 3; here a `party` flag only loosens tongues.
import { rel, bump, S, addScene } from './state.js';
import { feel, mood } from './mind.js';
import { makeClaim, learn } from './claims.js';
import { rollSlips, hasTheory } from './slips.js';

export const LIKES_EACH = 3;
export const PUBLIC_THEORY = 0.15;

// A narration label only (CLAUDE.md: thresholds pick words, never outcomes).
function toneOf(state, h) {
  if (mood(state, h, 'stress') > 6 || mood(state, h, 'loneliness') > 6) return 'low';
  if (mood(state, h, 'elation') > 6) return 'high';
  return 'steady';
}

export function morningFeed(state, rng) {
  const all = [...state.active];
  for (const h of all) addScene(state, 'status', [h], { tone: toneOf(state, h) }, all);
  const likes = {};
  for (const h of all) {
    likes[h] = all.filter(o => o !== h).map(o => [o, rel(h, o, 'affection') + rng()])
      .sort((a, b) => b[1] - a[1]).slice(0, LIKES_EACH).filter(([, v]) => v > 0).map(([o]) => o);
    for (const o of likes[h]) bump(o, h, 'affection', 0.3);
  }
  state.likesCount = Object.fromEntries(all.map(h => [h, Object.values(likes).filter(l => l.includes(h)).length]));
  for (const h of all) feel(state, h, 'elation', state.likesCount[h] * 0.3 - 0.5);
  return addScene(state, 'likes', all, { likes }, all);
}

export function runCircleChat(state, rng, { party = false, final = false } = {}) {
  const all = [...state.active];
  const sc = addScene(state, 'circle-chat', all, { party, final, posts: [], theories: [] }, all);
  for (const h of all) {
    const n = Math.round(S(state, h, 'social') / 5 * rng() + (party ? 1 : 0));
    for (let i = 0; i < n; i++) {
      sc.data.posts.push({ by: h });
      rollSlips(state, rng, h, all, { specific: 0.2, party, attention: 0.3 }, sc);
    }
    if (final) continue;
    for (const o of all) {
      if (o === h || !hasTheory(state, h, o)) continue;
      if (rng() >= S(state, h, 'boldness') / 10 * PUBLIC_THEORY) continue;
      const c = makeClaim(state, { kind: 'catfish', holder: h, about: o,
        truth: state.profiles[o].mode === 'catfish', secrecy: 'public', by: h });
      for (const x of all) if (x !== h) learn(state, x, c, h, sc);
      sc.data.theories.push({ by: h, about: o, claim: c.id });
      feel(state, o, 'stress', 2);
      bump(o, h, 'resentment', 2);
      break;
    }
  }
  for (const a of all) for (const b of all) if (a !== b && rel(a, b, 'affection') > 2) bump(a, b, 'affection', 0.2);
  for (const h of all) feel(state, h, 'loneliness', party ? -2 : -0.8);
  return sc;
}
```

- [ ] **Step 4: Run the test**

Run: `npx vitest run tests/ci-feed.test.js`
Expected: PASS. In the theory test, `() => 0` makes every draw pass the boldness check; `learn` for the accused `@d` records the claim too (they read Circle Chat).

- [ ] **Step 5: Commit**

```bash
git add js/ci/feed.js tests/ci-feed.test.js
git commit -m "feat(the-circle): the morning Newsfeed, likes, and Circle Chat's public theories"
```

---

### Task 9: The ratings

**Files:**
- Create: `js/ci/ratings.js`
- Test: `tests/ci-ratings.test.js`

**Interfaces:**
- Consumes: Tasks 2, 4 (`belief`, `nudgeBelief`, `feel`, `mood`).
- Produces:
  - `STYLE_WEIGHTS`, `styleOf(state, h) → 'heart'|'strategist'|'fair'|'safe'|'gut'`
  - `voterScore(state, rng, voter, target, { final }) → { score, parts }`
  - `ballot(state, rng, voter, targets, opts) → { voter, order: handle[], reasons: string[] }` (`reasons[i]` = the biggest term behind position `i`, for Plan 2)
  - `ratedPool(state) → { voters, targets }` (applies the newcomer rule)
  - `results(ballots, targets) → [{ profile, avg, place, firsts }]` sorted best first; tied averages share a place
  - `influencersFrom(res) → handle[]` (ties at second make three)
  - `revealOrder(res) → handle[][]` (pairs from the bottom, then singles, then the influencers together)
  - `runRating(state, rng, { final = false }) → row` — `row = { day, final, voters, targets, ballots, results, influencers, reveal, inferred, sceneId }`; pushes onto `state.ratings`, adds a `'ratings'` or `'final-ratings'` scene seen by everyone active

Spec §8. Styles are tendencies from stats, not boxes. A loyal voter keeps a rating pact (`p` term × loyalty). Everybody sees the results and updates who they think is a threat. Then each player **infers** who broke a pact with them — and can be wrong (§8.6).

- [ ] **Step 1: Write the failing test** — `tests/ci-ratings.test.js`

```js
import { describe, expect, it, beforeEach } from 'vitest';
import { setGs } from '../js/core.js';
import { streamFor } from '../js/dr/rng.js';
import { newState, bump, makePact } from '../js/ci/state.js';
import { initMind } from '../js/ci/mind.js';
import { belief } from '../js/ci/beliefs.js';
import { styleOf, ballot, results, influencersFrom, revealOrder, ratedPool, runRating } from '../js/ci/ratings.js';

beforeEach(() => setGs({ bonds: {}, relationshipDimensions: {}, episodeHistory: [] }));

const STATS = { physical: 5, endurance: 5, mental: 5, social: 5, strategic: 5, loyalty: 5, boldness: 5, intuition: 5, temperament: 5 };
function room(names, over = {}) {
  const s = newState(1);
  for (const n of names) {
    s.people[n] = { name: n, gender: 'f', sexuality: 'straight', archetype: 'floater', stats: { ...STATS, ...(over[n] || {}) }, age: 25 };
    const h = `@${n.toLowerCase()}`;
    s.profiles[h] = { handle: h, players: [n], mode: 'honest', gap: 0, tells: [], shown: { gender: 'f', age: 25 } };
    s.active.push(h);
    initMind(s, h);
  }
  return s;
}
const B = (voter, order) => ({ voter, order, reasons: [] });

describe('styles and ballots', () => {
  it('reads a style from the strongest leaning', () => {
    const s = room(['L', 'T'], { L: { loyalty: 10 }, T: { strategic: 10 } });
    expect(styleOf(s, '@l')).toBe('heart');
    expect(styleOf(s, '@t')).toBe('strategist');
  });

  it('ranks everyone but the voter, friends high and suspects low', () => {
    const s = room(['A', 'B', 'C', 'D']);
    bump('@a', '@b', 'affection', 9);
    belief(s, '@a', '@d').real = 0.05;
    const b = ballot(s, streamFor(1, 'r'), '@a', ['@a', '@b', '@c', '@d']);
    expect(b.order).not.toContain('@a');
    expect(b.order[0]).toBe('@b');
    expect(b.order.at(-1)).toBe('@d');
    expect(b.reasons).toHaveLength(3);
  });

  it('a loyal voter keeps a rating pact', () => {
    const s = room(['A', 'B', 'C', 'D'], { A: { loyalty: 10 } });
    bump('@a', '@c', 'affection', 4);
    makePact(s, 'rate', '@a', '@d');
    expect(ballot(s, streamFor(2, 'r'), '@a', ['@b', '@c', '@d']).order[0]).toBe('@d');
  });
});

describe('results', () => {
  it('shares a place on a tie and makes three influencers on a tie for second', () => {
    const t = ['@a', '@b', '@c', '@d'];
    // @a is everyone's first (avg 1). @b places 1, 2, 3 and @c places 2, 2, 2:
    // both average 2, a joint second. @d is last everywhere.
    const ballots = [B('@a', ['@b', '@c', '@d']), B('@b', ['@a', '@c', '@d']), B('@c', ['@a', '@b', '@d']), B('@d', ['@a', '@c', '@b'])];
    const res = results(ballots, t);
    expect(res[0]).toMatchObject({ profile: '@a', place: 1, avg: 1, firsts: 3 });
    expect(res.filter(r => r.place === 2).map(r => r.profile).sort()).toEqual(['@b', '@c']);
    expect(res.find(r => r.profile === '@d').place).toBe(4);
    expect(influencersFrom(res).sort()).toEqual(['@a', '@b', '@c']);
  });

  it('reveals from the bottom in pairs, then one at a time, then the influencers', () => {
    const res = ['@1', '@2', '@3', '@4', '@5', '@6', '@7', '@8'].map((p, i) => ({ profile: p, avg: i + 1, place: i + 1, firsts: 0 }));
    expect(revealOrder(res)).toEqual([['@8', '@7'], ['@6', '@5'], ['@4'], ['@3'], ['@1', '@2']]);
  });
});

describe('a rating night', () => {
  it('keeps a newcomer off the board but lets them vote, by default', () => {
    const s = room(['A', 'B', 'C', 'N']);
    s.unratedNext['@n'] = true;
    expect(ratedPool(s)).toEqual({ voters: ['@a', '@b', '@c', '@n'], targets: ['@a', '@b', '@c'] });
    s.options.newcomerRule = 'none';
    expect(ratedPool(s).voters).not.toContain('@n');
    s.options.newcomerRule = 'full';
    expect(ratedPool(s).targets).toContain('@n');
  });

  it('writes a row and a scene everyone saw, names influencers, counts firsts, clears the newcomer flag', () => {
    const s = room(['A', 'B', 'C', 'D', 'E']);
    s.day = 3;
    s.unratedNext['@e'] = true;
    const row = runRating(s, streamFor(3, 'rating'));
    expect(row.influencers.length).toBeGreaterThanOrEqual(2);
    expect(row.targets).not.toContain('@e');
    expect(s.unratedNext['@e']).toBeUndefined();
    const sc = s.scenes.find(x => x.id === row.sceneId);
    expect(sc.kind).toBe('ratings');
    expect(sc.seenBy.sort()).toEqual(['@a', '@b', '@c', '@d', '@e']);
    expect(Object.values(s.firstPlaces).reduce((a, b) => a + b, 0)).toBe(5);
    for (const i of row.influencers) expect(s.influencerCount[i]).toBe(1);
  });

  it('final ratings name no influencers', () => {
    const s = room(['A', 'B', 'C', 'D', 'E']);
    const row = runRating(s, streamFor(9, 'final'), { final: true });
    expect(row.influencers).toEqual([]);
    expect(s.scenes.find(x => x.id === row.sceneId).kind).toBe('final-ratings');
  });

  it('lets a player suspect a pact partner who put them low — rightly or not', () => {
    let inferred = 0;
    for (let seed = 1; seed <= 30; seed++) {
      const s = room(['A', 'B', 'C', 'D', 'E'], { A: { intuition: 10 }, B: { loyalty: 1 } });
      makePact(s, 'rate', '@a', '@b');
      bump('@b', '@c', 'affection', 9); bump('@b', '@d', 'affection', 9);
      bump('@c', '@a', 'resentment', 9); bump('@d', '@a', 'resentment', 9); bump('@e', '@a', 'resentment', 9);
      const row = runRating(s, streamFor(seed * 31, 'rating'));
      inferred += row.inferred.filter(x => x.by === '@a' && x.suspects === '@b').length;
    }
    expect(inferred).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run tests/ci-ratings.test.js`
Expected: FAIL — cannot resolve `../js/ci/ratings.js`.

- [ ] **Step 3: Write `js/ci/ratings.js`**

```js
// ══════════════════════════════════════════════════════════════════════
// ci/ratings.js — "Players, you must now rate each other." (spec §8)
// ══════════════════════════════════════════════════════════════════════
//
// Each eligible player ranks every other eligible profile. A ballot is built
// from what the voter FEELS and BELIEVES, weighted by their style. Results are
// averaged, revealed from the bottom two at a time (US 1 Ep 1: "Seventh and
// eighth… fifth and sixth…"), and the top two become Influencers — three on a
// tie for second (UK 1 Ep 6). Ballots are secret: afterwards each player can
// only INFER who broke a pact with them, and may be wrong (§8.6).
import { rel, bump, S, clamp, addScene } from './state.js';
import { belief, nudgeBelief } from './beliefs.js';
import { feel, mood } from './mind.js';

// a affection · t trust · o obligation · p pact · v "will they save me"
// h threat · s suspicion · r resentment · d "deserves it" (final only)
export const STYLE_WEIGHTS = {
  heart:      { a: 1.2, t: 0.8, o: 0.8, p: 1.2, v: 0.2, h: 0.2, s: 0.6, r: 0.8, d: 0.6 },
  strategist: { a: 0.6, t: 0.6, o: 0.4, p: 0.6, v: 1.0, h: 0.9, s: 0.6, r: 0.8, d: 1.2 },
  fair:       { a: 0.8, t: 0.8, o: 0.6, p: 0.8, v: 0.3, h: 0.1, s: 0.4, r: 0.4, d: 1.0 },
  safe:       { a: 0.8, t: 0.6, o: 0.8, p: 0.8, v: 0.8, h: 0.4, s: 0.8, r: 0.6, d: 0.8 },
  gut:        { a: 0.9, t: 0.4, o: 0.4, p: 0.4, v: 0.2, h: 0.3, s: 1.4, r: 0.6, d: 0.8 },
};
export const PACT_PULL = 6;
export const NOISE = 2.0;
// How much a doubt costs on a ballot. At 10 a catfish won 7-15% of seasons
// against the real show's 5 in 10 (audit:ci-spec, 2026-09-29).
export const SUSPICION = 5;

export function styleOf(state, h) {
  const lean = {
    heart: S(state, h, 'loyalty'),
    strategist: S(state, h, 'strategic'),
    fair: S(state, h, 'temperament') - S(state, h, 'boldness') / 2,
    safe: mood(state, h, 'paranoia'),
    gut: S(state, h, 'intuition') - S(state, h, 'strategic') / 2,
  };
  return Object.entries(lean).sort((a, b) => b[1] - a[1])[0][0];
}

const hasPact = (state, kind, x, y) => state.pacts.some(p => p.kind === kind
  && ((p.a === x && p.b === y) || (p.a === y && p.b === x)));

export function voterScore(state, rng, voter, target, { final = false } = {}) {
  const w = STYLE_WEIGHTS[styleOf(state, voter)];
  const b = belief(state, voter, target);
  const parts = {
    affection: w.a * rel(voter, target, 'affection'),
    trust: w.t * rel(voter, target, 'trust'),
    obligation: w.o * rel(voter, target, 'obligation'),
    pact: hasPact(state, 'rate', voter, target) ? w.p * PACT_PULL * S(state, voter, 'loyalty') / 10 : 0,
    protection: final ? 0 : w.v * (b.likesMe + 10) / 20 * 4,
    threat: -w.h * b.threat * (final ? 0.3 : 1),
    suspicion: -w.s * (1 - b.real) * SUSPICION,
    grudge: -w.r * rel(voter, target, 'resentment'),
    deserves: final ? w.d * ((state.influencerCount[target] || 0) * 0.8 + rel(voter, target, 'strategicRespect')) : 0,
  };
  const score = Object.values(parts).reduce((x, y) => x + y, 0) + (rng() - 0.5) * 2 * NOISE;
  return { score, parts };
}

export function ballot(state, rng, voter, targets, opts = {}) {
  const scored = targets.filter(t => t !== voter).map(t => ({ t, ...voterScore(state, rng, voter, t, opts) }))
    .sort((a, b) => b.score - a.score);
  const reasons = scored.map(x => Object.entries(x.parts).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))[0][0]);
  return { voter, order: scored.map(x => x.t), reasons };
}

export function ratedPool(state) {
  const rule = state.options.newcomerRule;
  const fresh = h => !!state.unratedNext[h];
  const voters = rule === 'none' ? state.active.filter(h => !fresh(h)) : [...state.active];
  const targets = rule === 'full' ? [...state.active] : state.active.filter(h => !fresh(h));
  return { voters, targets };
}

export function results(ballots, targets) {
  const rows = targets.map(t => {
    const places = ballots.filter(b => b.order.includes(t)).map(b => b.order.indexOf(t) + 1);
    const avg = places.length ? places.reduce((a, b) => a + b, 0) / places.length : targets.length;
    return { profile: t, avg: Math.round(avg * 1000) / 1000, firsts: ballots.filter(b => b.order[0] === t).length };
  }).sort((a, b) => a.avg - b.avg || (a.profile < b.profile ? -1 : 1));
  rows.forEach((r, i) => { r.place = i > 0 && r.avg === rows[i - 1].avg ? rows[i - 1].place : i + 1; });
  return rows;
}

export function influencersFrom(res) {
  if (res.length < 2) return res.map(r => r.profile);
  const second = res[1].avg;
  return res.filter(r => r.avg <= second).map(r => r.profile);
}

export function revealOrder(res) {
  const infl = influencersFrom(res);
  const rest = [...res].reverse().filter(r => !infl.includes(r.profile)).map(r => r.profile);
  const groups = [];
  let i = 0;
  while (rest.length - i > 2) { groups.push(rest.slice(i, i + 2)); i += 2; }
  for (; i < rest.length; i++) groups.push([rest[i]]);
  groups.push(res.filter(r => infl.includes(r.profile)).map(r => r.profile));
  return groups;
}

/** After the reveal: who broke a pact with me? (A belief — it can be wrong.) */
function infer(state, rng, row, scene) {
  const out = [];
  const n = row.targets.length;
  for (const r of row.results) {
    const me = r.profile;
    const partners = state.pacts.filter(p => p.kind === 'rate' && (p.a === me || p.b === me))
      .map(p => (p.a === me ? p.b : p.a)).filter(x => row.voters.includes(x));
    for (const p of partners) {
      const chance = clamp((r.place - 1) / Math.max(1, n - 1) * S(state, me, 'intuition') / 10, 0, 0.9);
      if (rng() >= chance) continue;
      const truly = row.ballots.find(b => b.voter === p)?.order.indexOf(me) > 1;
      nudgeBelief(state, me, p, 'likesMe', -2, scene);
      bump(me, p, 'resentment', 1);
      out.push({ by: me, suspects: p, right: truly });
    }
  }
  return out;
}

export function runRating(state, rng, { final = false } = {}) {
  const { voters, targets } = ratedPool(state);
  const ballots = voters.map(v => ballot(state, rng, v, targets, { final }));
  const res = results(ballots, targets);
  const influencers = final ? [] : influencersFrom(res);
  const sc = addScene(state, final ? 'final-ratings' : 'ratings', voters,
    { ballots, results: res, influencers, reveal: revealOrder(res) }, [...state.active]);
  for (const r of res) state.firstPlaces[r.profile] = (state.firstPlaces[r.profile] || 0) + r.firsts;
  for (const i of influencers) state.influencerCount[i] = (state.influencerCount[i] || 0) + 1;
  for (const p of state.pacts.filter(x => x.kind === 'rate')) {
    for (const [v, t] of [[p.a, p.b], [p.b, p.a]]) {
      const b = ballots.find(x => x.voter === v);
      if (b && b.order.includes(t)) p.kept.push({ day: state.day, voter: v, kept: b.order.indexOf(t) <= 1 });
    }
  }
  const n = res.length;
  for (const obs of state.active) for (const r of res) {
    if (r.profile === obs) continue;
    const seen = 10 * (1 - (r.place - 1) / Math.max(1, n - 1));
    nudgeBelief(state, obs, r.profile, 'threat', (seen - belief(state, obs, r.profile).threat) * 0.6, sc);
  }
  for (const r of res) {
    const frac = (r.place - 1) / Math.max(1, n - 1);
    feel(state, r.profile, 'elation', 2 * (1 - frac) - 0.5);
    feel(state, r.profile, 'stress', 1.5 * frac);
    feel(state, r.profile, 'paranoia', frac);
  }
  const inferred = final ? [] : infer(state, rng, { voters, targets, ballots, results: res }, sc);
  sc.data.inferred = inferred;
  for (const h of state.active) delete state.unratedNext[h];
  const row = { day: state.day, final, voters, targets, ballots, results: res, influencers,
    reveal: revealOrder(res), inferred, sceneId: sc.id };
  state.ratings.push(row);
  return row;
}
```

- [ ] **Step 4: Run the test**

Run: `npx vitest run tests/ci-ratings.test.js`
Expected: PASS. If "ranks everyone but the voter" puts `@c` last instead of `@d`, check that the `suspicion` term reads `belief(...).real` (0.05 → −0.95 × weight × 10).

- [ ] **Step 5: Commit**

```bash
git add js/ci/ratings.js tests/ci-ratings.test.js
git commit -m "feat(the-circle): ratings — styles, pacts, ties, reveal order, inference"
```

---

### Task 10: The Hangout, the blocking, the visit and the goodbye

**Files:**
- Create: `js/ci/hangout.js`, `js/ci/blocking.js`
- Test: `tests/ci-blocking.test.js`

**Interfaces:**
- Consumes: Tasks 2–7, 9.
- Produces (`hangout.js`):
  - `blockScore(state, inf, t) → { total, parts: { fake, threat, grudge, noBond } }`
  - `deliberate(state, rng, influencers, atRisk) → { target, reason, views: [{ handle, by: { [inf]: number } }], offers, announcer, decider, yielded }`
- Produces (`blocking.js`):
  - `atRiskOf(state, influencers) → handle[]` (immunity waived if nobody else could go)
  - `applyBlock(state, h, channel, by, scene)`
  - `standardBlocking(state, rng, ratingRow) → { target, hangout, announcement, visit }`
  - `chooseVisit(state, rng, h, blockers) → { to, motive }`
  - `runVisit(state, rng, h, blockers) → scene | null`
  - `deliverReports(state, rng)` — next-day visit reports (a scheme)
  - `goodbyeVideo(state, rng, h) → scene`

Spec §9 and §11. The deliberation walks the at-risk list (the `views`), each influencer picks, and if they disagree one gives way — the one who cares more about the other and is less bold (proportional, with dice). The blocked player visits the one their strongest motive points to; both learn each other's truth. A scheme-eligible visited player may later **lie about the visit** (US 7 Madelyn). The next day the goodbye video reveals the truth to everyone and may carry a public warning.

- [ ] **Step 1: Write the failing test** — `tests/ci-blocking.test.js`

```js
import { describe, expect, it, beforeEach } from 'vitest';
import { setGs } from '../js/core.js';
import { streamFor } from '../js/dr/rng.js';
import { newState, bump, rel, makePact } from '../js/ci/state.js';
import { initMind } from '../js/ci/mind.js';
import { belief } from '../js/ci/beliefs.js';
import { isRevealed } from '../js/ci/reveal.js';
import { blockScore, deliberate } from '../js/ci/hangout.js';
import { atRiskOf, standardBlocking, runVisit, deliverReports, goodbyeVideo } from '../js/ci/blocking.js';

beforeEach(() => setGs({ bonds: {}, relationshipDimensions: {}, episodeHistory: [] }));

const STATS = { physical: 5, endurance: 5, mental: 5, social: 5, strategic: 5, loyalty: 5, boldness: 5, intuition: 5, temperament: 5 };
function room(names, over = {}, modes = {}) {
  const s = newState(1);
  s.day = 4;
  for (const n of names) {
    s.people[n] = { name: n, gender: 'f', sexuality: 'straight', archetype: (over[n] || {}).archetype || 'floater',
      stats: { ...STATS, ...((over[n] || {}).stats || {}) }, age: 25 };
    const h = `@${n.toLowerCase()}`;
    s.profiles[h] = { handle: h, players: [n], mode: modes[n] || 'honest', gap: modes[n] === 'catfish' ? 2 : 0,
      tells: [], shown: { gender: 'f', age: 25 } };
    s.active.push(h);
    initMind(s, h);
  }
  return s;
}
const always = v => () => v;

describe('the Hangout', () => {
  it('protects a pact partner', () => {
    const s = room(['I', 'X', 'Y']);
    const before = blockScore(s, '@i', '@x').total;
    makePact(s, 'protect', '@i', '@x');
    expect(blockScore(s, '@i', '@x').total).toBeLessThan(before);
  });

  it('agrees at once when both pick the same player, and gives the reason', () => {
    const s = room(['I', 'J', 'X', 'Y']);
    belief(s, '@i', '@x').real = 0.05; belief(s, '@j', '@x').real = 0.05;
    const d = deliberate(s, streamFor(1, 'h'), ['@i', '@j'], ['@x', '@y']);
    expect(d.target).toBe('@x');
    expect(d.reason).toBe('fake');
    expect(d.yielded).toBeNull();
    expect(d.views.map(v => v.handle).sort()).toEqual(['@x', '@y']);
  });

  it('when they disagree, one of them gives way', () => {
    const s = room(['I', 'J', 'X', 'Y']);
    bump('@i', '@x', 'resentment', 9);
    bump('@j', '@y', 'resentment', 9);
    const d = deliberate(s, streamFor(2, 'h'), ['@i', '@j'], ['@x', '@y']);
    expect(['@i', '@j']).toContain(d.yielded);
    expect(d.target).toBe(d.yielded === '@i' ? '@y' : '@x');
  });
});

describe('the blocking', () => {
  it('spares a newcomer — unless nobody else could go', () => {
    const s = room(['I', 'J', 'N', 'X']);
    s.immuneNext['@n'] = true;
    expect(atRiskOf(s, ['@i', '@j'])).toEqual(['@x']);
    s.immuneNext['@x'] = true;
    expect(atRiskOf(s, ['@i', '@j']).sort()).toEqual(['@n', '@x']);
  });

  it('removes the blocked player, visits, queues the goodbye, and clears immunity', () => {
    const s = room(['I', 'J', 'X', 'Y', 'N']);
    s.immuneNext['@n'] = true;
    const out = standardBlocking(s, streamFor(3, 'b'), { influencers: ['@i', '@j'] });
    expect(s.active).not.toContain(out.target);
    expect(s.blocked.at(-1)).toMatchObject({ handle: out.target, channel: 'influencers', by: ['@i', '@j'] });
    expect(s.pendingGoodbyes).toEqual([out.target]);
    expect(s.immuneNext['@n']).toBeUndefined();
    expect(out.announcement.seenBy).toContain(out.target);
    expect(rel(out.target, '@i', 'resentment')).toBeGreaterThan(0);
  });
});

describe('a tie that crowns everyone', () => {
  it('lets the top two decide when three influencers leave nobody at risk', () => {
    const s = room(['I', 'J', 'K']);
    const out = standardBlocking(s, streamFor(6, 'b'), { influencers: ['@i', '@j', '@k'] });
    expect(out.target).toBe('@k');
    expect(s.active.sort()).toEqual(['@i', '@j']);
  });
});

describe('the visit', () => {
  it('reveals both people to each other and hands over a suspicion', () => {
    const s = room(['X', 'F', 'C'], {}, { C: 'catfish' });
    bump('@x', '@f', 'affection', 9);
    belief(s, '@x', '@c').real = 0.1;
    s.active = ['@f', '@c'];
    const before = belief(s, '@f', '@c').real;
    const sc = runVisit(s, streamFor(4, 'v'), '@x', ['@c']);
    expect(sc.who).toEqual(['@x', '@f']);
    expect(isRevealed(s, '@f', '@x') && isRevealed(s, '@x', '@f')).toBe(true);
    expect(sc.data.handed).toBeTruthy();
    expect(belief(s, '@f', '@c').real).toBeLessThan(before);
  });

  it('a scheming visited player may lie about it the next day', () => {
    const s = room(['X', 'V', 'R', 'A'], { V: { archetype: 'villain', stats: { strategic: 10, loyalty: 1 } } });
    bump('@x', '@v', 'affection', 9);
    bump('@v', '@r', 'resentment', 9);
    bump('@v', '@a', 'affection', 9);
    s.active = ['@v', '@r', '@a'];
    runVisit(s, always(0), '@x', ['@r']);
    expect(s.pendingReports).toHaveLength(1);
    s.day = 5;
    deliverReports(s, always(0));
    const report = s.scenes.find(x => x.kind === 'report');
    expect(report.who).toEqual(['@v', '@a']);
    const c = s.claims.find(x => x.id === report.data.claim);
    expect(c).toMatchObject({ kind: 'visitSaid', holder: '@r', about: '@a' });
    expect(c.origin.by).toBe('@v');
  });
});

describe('the goodbye video', () => {
  it('reveals the truth to everyone and can warn them about someone', () => {
    const s = room(['X', 'A', 'B', 'S']);
    bump('@x', '@s', 'resentment', 9);
    s.active = ['@a', '@b', '@s'];
    const sc = goodbyeVideo(s, streamFor(5, 'g'), '@x');
    for (const h of ['@a', '@b', '@s']) expect(isRevealed(s, h, '@x')).toBe(true);
    expect(sc.data.warning.about).toBe('@s');
    expect(s.know['@a'][sc.data.warning.claim].from).toBe('@x');
    expect(rel('@a', '@s', 'trust')).toBeLessThan(0);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run tests/ci-blocking.test.js`
Expected: FAIL — cannot resolve `../js/ci/hangout.js`.

- [ ] **Step 3: Write `js/ci/hangout.js`**

```js
// ══════════════════════════════════════════════════════════════════════
// ci/hangout.js — "Please go up to the Hangout to discuss your decision." (spec §9)
// ══════════════════════════════════════════════════════════════════════
//
// The influencers walk the at-risk list one by one (the `views`: what each of
// them privately thinks of each player — Plan 2 writes the pros and cons from
// these), each picks, and if they disagree one gives way. Who gives way: the
// one who cares more about the other and is less bold, with dice. The one who
// gave way may ask for something back ("save mine next time").
import { rel, bump, S, clamp, makePact } from './state.js';
import { belief } from './beliefs.js';

export const PROTECT = 6;

export function blockScore(state, inf, t) {
  const b = belief(state, inf, t);
  const parts = {
    fake: (1 - b.real) * 3,
    threat: b.threat * 0.6,
    grudge: rel(inf, t, 'resentment') * 0.8,
    noBond: -(rel(inf, t, 'affection') * 0.8 + rel(inf, t, 'trust') * 0.4 + rel(inf, t, 'obligation') * 0.6),
  };
  const shielded = state.pacts.some(p => p.kind === 'protect' && ((p.a === inf && p.b === t) || (p.a === t && p.b === inf)));
  return { total: Object.values(parts).reduce((a, v) => a + v, 0) - (shielded ? PROTECT : 0), parts };
}

const pickOf = (state, rng, inf, atRisk) => atRisk
  .map(t => [t, blockScore(state, inf, t).total + rng() * 0.5]).sort((a, b) => b[1] - a[1])[0][0];

export function deliberate(state, rng, influencers, atRisk) {
  const views = atRisk.map(t => ({ handle: t,
    by: Object.fromEntries(influencers.map(i => [i, Math.round(blockScore(state, i, t).total * 100) / 100 || 0])) }));  // || 0: no -0 (JSON turns it into 0)
  const picks = Object.fromEntries(influencers.map(i => [i, pickOf(state, rng, i, atRisk)]));
  const offers = influencers.map(i => ({ by: i, target: picks[i] }));
  const distinct = [...new Set(Object.values(picks))];
  let target, decider, yielded = null;
  if (distinct.length === 1) {
    [target] = distinct; [decider] = influencers;
  } else if (influencers.length >= 3) {
    const votes = {};
    for (const t of Object.values(picks)) votes[t] = (votes[t] || 0) + 1;
    const top = Object.entries(votes).sort((a, b) => b[1] - a[1])[0];
    decider = top[1] >= 2 ? influencers.find(i => picks[i] === top[0]) : influencers[0];
    target = picks[decider];
  } else {
    const [A, B] = influencers;
    const pull = (x, y) => (rel(x, y, 'affection') + rel(x, y, 'obligation') + 10) / 20 + S(state, x, 'temperament') / 20;
    const pA = clamp(pull(A, B) / (pull(A, B) + pull(B, A)) + (S(state, B, 'boldness') - S(state, A, 'boldness')) / 20, 0.1, 0.9);
    yielded = rng() < pA ? A : B;
    decider = yielded === A ? B : A;
    target = picks[decider];
    offers.push({ by: yielded, yields: true });
    if (rng() < S(state, yielded, 'strategic') / 10) {
      bump(decider, yielded, 'obligation', 2);
      offers.push({ by: yielded, trade: true });
    }
  }
  if (influencers.length >= 2) {
    const [A, B] = influencers;
    if (rng() < clamp((rel(A, B, 'affection') + rel(A, B, 'trust') + 20) / 40, 0, 1) * 0.6) {
      offers.push({ by: A, pact: makePact(state, 'protect', A, B) });
    }
  }
  const parts = blockScore(state, decider, target).parts;
  const reason = Object.entries(parts).sort((a, b) => b[1] - a[1])[0][0];
  const announcer = [...influencers].sort((x, y) => S(state, y, 'boldness') - S(state, x, 'boldness'))[0];
  return { target, reason, views, offers, announcer, decider, yielded };
}
```

- [ ] **Step 4: Write `js/ci/blocking.js`**

```js
// ══════════════════════════════════════════════════════════════════════
// ci/blocking.js — the block, the visit, the goodbye (spec §9.4, §11)
// ══════════════════════════════════════════════════════════════════════
//
// Plan 1 plays the STANDARD format only (two influencers, the Hangout). The
// other formats of spec §10 are Plan 3 and plug in beside standardBlocking.
//
// The visit is the one time two players share a room before the final. Both
// learn each other's truth. The visited player now holds private knowledge
// — and a schemer may lie about it later (US 7: Madelyn invented what Heather
// said at her visit, and it steered the next blocking).
import { rel, bump, S, clamp, addScene, isActive, schemeEligible } from './state.js';
import { belief } from './beliefs.js';
import { feel, mood } from './mind.js';
import { makeClaim, learn } from './claims.js';
import { revealTo } from './reveal.js';
import { attractionOk } from './chat.js';
import { deliberate } from './hangout.js';

export function atRiskOf(state, influencers) {
  const pool = state.active.filter(h => !influencers.includes(h));
  const exposed = pool.filter(h => !state.immuneNext[h]);
  return exposed.length ? exposed : pool;
}

export function applyBlock(state, h, channel, by, scene) {
  state.active = state.active.filter(x => x !== h);
  state.blocked.push({ handle: h, day: state.day, channel, by: [...by] });
  for (const i of by) {
    bump(h, i, 'resentment', 3);
    const aff = rel(i, h, 'affection');
    if (aff > 0) feel(state, i, 'guilt', aff / 3);
  }
  for (const o of state.active) if (rel(o, h, 'affection') > 3) feel(state, o, 'stress', 1);
}

export function standardBlocking(state, rng, ratingRow) {
  // A tie that makes everybody left an influencer would leave nobody at risk:
  // then only the top two decide.
  let infl = ratingRow.influencers;
  if (!atRiskOf(state, infl).length) infl = infl.slice(0, 2);
  const atRisk = atRiskOf(state, infl);
  for (const h of atRisk) feel(state, h, 'stress', 2);
  const hangout = addScene(state, 'hangout', infl, { atRisk }, infl);
  const d = deliberate(state, rng, infl, atRisk);
  Object.assign(hangout.data, d);
  for (const h of state.active) delete state.immuneNext[h];
  const announcement = addScene(state, 'blocking', [d.announcer, d.target],
    { by: infl, target: d.target, reason: d.reason, channel: 'influencers' }, [...state.active]);
  applyBlock(state, d.target, 'influencers', infl, announcement);
  const visit = runVisit(state, rng, d.target, infl);
  state.pendingGoodbyes.push(d.target);
  return { target: d.target, hangout, announcement, visit };
}

export function chooseVisit(state, rng, h, blockers) {
  const guilt = mood(state, h, 'guilt') / 10;
  return state.active.map(c => {
    const m = {
      friend: Math.max(0, rel(h, c, 'affection')),
      answers: blockers.includes(c) ? rel(h, c, 'resentment') + 2 : 0,
      truth: (1 - belief(state, h, c).real) * 8,
      apology: guilt * Math.max(0, rel(h, c, 'affection')) * 1.5,
    };
    const [motive, w] = Object.entries(m).sort((a, b) => b[1] - a[1])[0];
    return { to: c, motive, w: w + rng() * 1.5 };
  }).sort((a, b) => b.w - a.w)[0];
}

export const REPORT_LIE = 1.2;

export function runVisit(state, rng, h, blockers) {
  if (!state.active.length) return null;
  const { to, motive } = chooseVisit(state, rng, h, blockers);
  const sc = addScene(state, 'visit', [h, to], { motive, kiss: false, handed: null });
  revealTo(state, to, h, sc);
  revealTo(state, h, to, sc);
  const suspect = state.active.filter(o => o !== to).map(o => [o, belief(state, h, o).real])
    .sort((a, b) => a[1] - b[1])[0];
  if (suspect && suspect[1] < 0.5) {
    const c = makeClaim(state, { kind: 'catfish', holder: h, about: suspect[0],
      truth: state.profiles[suspect[0]].mode === 'catfish', by: h, to });
    learn(state, to, c, h, sc);
    sc.data.handed = c.id;
  }
  if (attractionOk(state, h, to) && attractionOk(state, to, h)
    && rel(h, to, 'attraction') > 6 && rel(to, h, 'attraction') > 6) sc.data.kiss = true;
  if (schemeEligible(state, to)
    && rng() < clamp(S(state, to, 'strategic') / 10 * (REPORT_LIE - S(state, to, 'loyalty') / 10), 0, 0.9)) {
    state.pendingReports.push({ by: to, blocked: h, day: state.day });
  }
  return sc;
}

export function deliverReports(state, rng) {
  for (const r of state.pendingReports.splice(0)) {
    if (!isActive(state, r.by)) continue;
    const rival = state.active.filter(o => o !== r.by)
      .map(o => [o, rel(r.by, o, 'resentment') + belief(state, r.by, o).threat * 0.5])
      .sort((a, b) => b[1] - a[1])[0]?.[0];
    const allies = state.active.filter(o => o !== r.by && o !== rival)
      .map(o => [o, rel(r.by, o, 'affection')]).filter(([, a]) => a > 2)
      .sort((a, b) => b[1] - a[1]).slice(0, 2).map(([o]) => o);
    if (!rival || !allies.length) continue;
    for (const ally of allies) {
      const sc = addScene(state, 'report', [r.by, ally], { blocked: r.blocked, rival, claim: null });
      const c = makeClaim(state, { kind: 'visitSaid', holder: rival, about: ally,
        truth: rel(rival, ally, 'trust') < 0, by: r.by, to: ally });
      learn(state, ally, c, r.by, sc);
      sc.data.claim = c.id;
    }
  }
}

export function goodbyeVideo(state, rng, h) {
  const all = [...state.active];
  const sc = addScene(state, 'goodbye', [h], { mode: state.profiles[h].mode, warning: null }, all);
  for (const o of all) revealTo(state, o, h, sc);
  const top = all.map(o => [o, rel(h, o, 'resentment') + (1 - belief(state, h, o).real) * 3])
    .sort((a, b) => b[1] - a[1])[0];
  if (top && top[1] > 3) {
    const o = top[0];
    const c = belief(state, h, o).real < 0.5
      ? makeClaim(state, { kind: 'catfish', holder: h, about: o, truth: state.profiles[o].mode === 'catfish', secrecy: 'public', by: h })
      : makeClaim(state, { kind: 'distrusts', holder: h, about: o, truth: rel(h, o, 'trust') < 0, secrecy: 'public', by: h });
    for (const x of all) if (x !== o) learn(state, x, c, h, sc);
    feel(state, o, 'paranoia', 2);
    feel(state, o, 'stress', 2);
    sc.data.warning = { about: o, kind: c.kind, claim: c.id };
  }
  const b = state.blocked.find(x => x.handle === h);
  if (b && state.profiles[h].mode !== 'catfish') for (const i of b.by) if (isActive(state, i)) feel(state, i, 'guilt', 1.5);
  return sc;
}
```

Note on `goodbyeVideo`: `learn` weights a claim by the listener's trust in the *profile* `@x`, which is still keyed by handle after the block — that is intended; it is how much they trusted the person they knew.

- [ ] **Step 5: Run the test**

Run: `npx vitest run tests/ci-blocking.test.js`
Expected: PASS. In the goodbye test the warning is a `distrusts` claim (belief about `@s` is still high), and Task 5's third-party branch makes `@a` trust `@s` less.

- [ ] **Step 6: Commit**

```bash
git add js/ci/hangout.js js/ci/blocking.js tests/ci-blocking.test.js
git commit -m "feat(the-circle): the Hangout, the standard blocking, the visit, reports and the goodbye video"
```

---

### Task 11: Newcomers and the public

**Files:**
- Create: `js/ci/arrivals.js`, `js/ci/public.js`
- Test: `tests/ci-arrivals-public.test.js`

**Interfaces:**
- Consumes: Tasks 2, 4; `js/pm/ledger.js` (`createLedger`, `noteArrival`, `recordAired`, `closeEpisode`, `readApproval`) — imported, not copied.
- Produces (`arrivals.js`): `arrive(state, rng, handles)` — each newcomer joins `state.active`, gets `immuneNext`, `unratedNext`, `joinedDay`, a mind, an `'arrival'` scene seen by everyone, and (the snoop-and-choose entry, US 1 Ep 2) an `'after-party'` scene with the one player they pick.
- Produces (`public.js`): `APPROVAL`, `openLedger(state)`, `noteJoin(state, h)`, `sceneApproval(state, scene) → { [handle]: number }`, `airDay(state) → closeEpisode output`, `fanFavorite(state) → person name`

Spec §12 and §16. **Only `public.js` touches the ledger.** Every scene airs in Plan 1 (`aired: true`); Plan 2 decides what airs, and the public then only reacts to what it saw. Players never read approval (guarded in Task 14).

- [ ] **Step 1: Write the failing test** — `tests/ci-arrivals-public.test.js`

```js
import { describe, expect, it, beforeEach } from 'vitest';
import { setGs } from '../js/core.js';
import { streamFor } from '../js/dr/rng.js';
import { newState, addScene, rel } from '../js/ci/state.js';
import { initMind } from '../js/ci/mind.js';
import { arrive } from '../js/ci/arrivals.js';
import { openLedger, noteJoin, airDay, fanFavorite, sceneApproval } from '../js/ci/public.js';

beforeEach(() => setGs({ bonds: {}, relationshipDimensions: {}, episodeHistory: [] }));

const STATS = { physical: 5, endurance: 5, mental: 5, social: 5, strategic: 5, loyalty: 5, boldness: 5, intuition: 5, temperament: 5 };
function room(names, active = names) {
  const s = newState(1);
  s.day = 3;
  for (const n of names) {
    s.people[n] = { name: n, gender: 'f', sexuality: 'straight', archetype: 'floater', stats: { ...STATS }, age: 25 };
    const h = `@${n.toLowerCase()}`;
    s.profiles[h] = { handle: h, players: [n], mode: 'honest', gap: 0, reason: null, tells: [], shown: { gender: 'f', age: 25 } };
  }
  for (const n of active) { const h = `@${n.toLowerCase()}`; s.active.push(h); initMind(s, h); }
  return s;
}

describe('newcomers', () => {
  it('join immune and unrated, announced to everyone, and pick one player for the after-party', () => {
    const s = room(['A', 'B', 'N'], ['A', 'B']);
    arrive(s, streamFor(3, 'arrive'), ['@n']);
    expect(s.active).toContain('@n');
    expect(s.immuneNext['@n']).toBe(true);
    expect(s.unratedNext['@n']).toBe(true);
    expect(s.joinedDay['@n']).toBe(3);
    expect(s.mind['@n']).toBeTruthy();
    const arrival = s.scenes.find(x => x.kind === 'arrival');
    expect(arrival.seenBy.sort()).toEqual(['@a', '@b', '@n']);
    const party = s.scenes.find(x => x.kind === 'after-party');
    const pick = party.data.chosen;
    expect(['@a', '@b']).toContain(pick);
    expect(rel('@n', pick, 'affection')).toBeGreaterThan(0);
    expect(rel(pick, '@n', 'affection')).toBeGreaterThan(0);
  });
});

describe('the public', () => {
  it('rewards a warm check-in and punishes a planted rumour', () => {
    const s = room(['A', 'B', 'C']);
    const kind = addScene(s, 'chat', ['@a', '@b'], { intent: 'checkin', ending: 'warm' });
    const mean = addScene(s, 'chat', ['@c', '@b'], { intent: 'plant', ending: 'warm' });
    expect(sceneApproval(s, kind)['@a']).toBeGreaterThan(0);
    expect(sceneApproval(s, mean)['@c']).toBeLessThan(0);
  });

  it('feels for an honest player blocked for being "fake"', () => {
    const s = room(['A', 'B']);
    const sc = addScene(s, 'blocking', ['@a', '@b'], { target: '@b', reason: 'fake' });
    expect(sceneApproval(s, sc)['@b']).toBeGreaterThan(sceneApproval(s, addScene(s, 'blocking', ['@a', '@b'], { target: '@b', reason: 'threat' }))['@b']);
  });

  it('airs today\'s scenes into the ledger and names a Fan Favorite', () => {
    const s = room(['A', 'B', 'C']);
    openLedger(s);
    for (const h of s.active) noteJoin(s, h);
    for (let i = 0; i < 4; i++) addScene(s, 'chat', ['@a', '@b'], { intent: 'checkin', ending: 'warm' });
    addScene(s, 'chat', ['@c', '@b'], { intent: 'plant', ending: 'warm' });
    const out = airDay(s);
    expect(out.A.approval).toBeGreaterThan(out.C.approval);
    expect(out.A.fame).toBeGreaterThan(0);
    expect(fanFavorite(s)).toBe('A');
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run tests/ci-arrivals-public.test.js`
Expected: FAIL — cannot resolve `../js/ci/arrivals.js`.

- [ ] **Step 3: Write `js/ci/arrivals.js`**

```js
// ══════════════════════════════════════════════════════════════════════
// ci/arrivals.js — "A new Player has entered The Circle." (spec §12)
// ══════════════════════════════════════════════════════════════════════
//
// Plan 1 plays ONE entry format, the first the show used: the newcomer builds
// a profile, secretly watches Circle Chat, then invites one player to a
// private after-party (US 1 Ep 2, Miranda). The other entry formats of spec
// §12.2 are timeline cards in Plan 3. A newcomer is immune at their first
// blocking; whether they rate or are rated follows the season's newcomer rule.
import { rel, bump, addScene } from './state.js';
import { initMind, feel } from './mind.js';

export function arrive(state, rng, handles) {
  for (const h of handles) {
    state.active.push(h);
    state.joinedDay[h] = state.day;
    state.immuneNext[h] = true;
    state.unratedNext[h] = true;
    initMind(state, h);
    addScene(state, 'arrival', [h], { entry: 'snoop' }, [...state.active]);
    const others = state.active.filter(o => o !== h);
    const pick = others
      .map(o => [o, (state.likesCount[o] || 0) + rel(h, o, 'attraction') * 0.3 + rng() * 2])
      .sort((a, b) => b[1] - a[1])[0]?.[0];
    if (!pick) continue;
    addScene(state, 'after-party', [h, pick], { chosen: pick });
    bump(h, pick, 'affection', 1.5);
    bump(pick, h, 'affection', 1.5);
    bump(pick, h, 'trust', 0.5);
    feel(state, pick, 'elation', 1);
    for (const o of others) if (o !== pick) feel(state, o, 'paranoia', 0.3);
  }
}
```

- [ ] **Step 4: Write `js/ci/public.js`**

```js
// ══════════════════════════════════════════════════════════════════════
// ci/public.js — what the audience thinks, from what aired (spec §16)
// ══════════════════════════════════════════════════════════════════════
//
// Perfect Match's two ledgers, IMPORTED (js/pm/ledger.js): approval (-100..100)
// and fame (never falls). The only file under js/ci/ allowed to touch them —
// no player's decision may read the public (tests/ci-guards.test.js).
import { createLedger, noteArrival, recordAired, closeEpisode, readApproval } from '../pm/ledger.js';
import { peopleOf } from './state.js';

export const APPROVAL = {
  chat: { warm: 0.25, neutral: 0.05, cold: -0.15 },
  intent: { plant: -1.0, credit: -0.4, confront: -0.3, checkin: 0.5, confess: 0.8, repair: 0.4 },
  theory: -0.3,
  wronglyBlocked: 1.5,
  blocked: 0.3,
  visitLie: -1.5,
  kiss: 0.5,
  protectiveReveal: 0.8,
  strategicReveal: -0.3,
};

export function openLedger(state) { state.ledger = createLedger(); }
export function noteJoin(state, h) { for (const n of peopleOf(state, h)) noteArrival(state.ledger, n, state.day); }

export function sceneApproval(state, sc) {
  const out = {};
  const add = (h, v) => { out[h] = (out[h] || 0) + v; };
  switch (sc.kind) {
    case 'chat': {
      const [from, to] = sc.who;
      add(from, (APPROVAL.chat[sc.data.ending] || 0) + (APPROVAL.intent[sc.data.intent] || 0));
      add(to, (APPROVAL.chat[sc.data.ending] || 0) * 0.5);
      break;
    }
    case 'circle-chat': for (const t of sc.data.theories || []) add(t.by, APPROVAL.theory); break;
    case 'blocking': {
      const t = sc.data.target;
      add(t, sc.data.reason === 'fake' && state.profiles[t].mode !== 'catfish' ? APPROVAL.wronglyBlocked : APPROVAL.blocked);
      break;
    }
    case 'report': add(sc.who[0], APPROVAL.visitLie); break;
    case 'visit': if (sc.data.kiss) for (const h of sc.who) add(h, APPROVAL.kiss); break;
    case 'goodbye': {
      const p = state.profiles[sc.who[0]];
      if (p.mode === 'catfish') add(sc.who[0], p.reason === 'strategic' ? APPROVAL.strategicReveal : APPROVAL.protectiveReveal);
      break;
    }
  }
  return out;
}

export function airDay(state) {
  for (const sc of state.scenes) {
    if (sc.day !== state.day || !sc.aired) continue;
    const ap = sceneApproval(state, sc);
    for (const h of sc.who) for (const n of peopleOf(state, h)) {
      recordAired(state.ledger, { who: n, approval: ap[h] || 0, fame: 1 });
    }
  }
  return closeEpisode(state.ledger, state.day, null);
}

export function fanFavorite(state) {
  return Object.keys(state.people)
    .sort((a, b) => readApproval(state.ledger, b) - readApproval(state.ledger, a) || (a < b ? -1 : 1))[0];
}
```

- [ ] **Step 5: Run the test**

Run: `npx vitest run tests/ci-arrivals-public.test.js`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add js/ci/arrivals.js js/ci/public.js tests/ci-arrivals-public.test.js
git commit -m "feat(the-circle): newcomers who snoop and choose, and the public from what aired"
```

---

### Task 12: The schedule

**Files:**
- Create: `js/ci/schedule.js`
- Test: `tests/ci-schedule.test.js`

**Interfaces:**
- Produces: `DEFAULT_DAYS = { min: 11, max: 15 }`; `buildSchedule({ total, starters, finalists = 5, days = null }) → day[]`, `day = { day, slot, block, arrivals, final, finale }`, slots `'rating1'…`, `'social'`, `'final-ratings'`, `'finale'`.

Spec §6.2. Rules, each from the real seasons: the first rating and blocking are on Day 1 (US 1, 4, 5); every other rating day blocks one player; social days are spread evenly between them; newcomers arrive the morning after a blocking, in the first two-thirds of the season (wiki), two at most in a day; the last two days are the final ratings and the finale. Tests look days up by slot, never by number (ADDING-A-SHOW §16.3).

- [ ] **Step 1: Write the failing test** — `tests/ci-schedule.test.js`

```js
import { describe, expect, it } from 'vitest';
import { buildSchedule } from '../js/ci/schedule.js';

/** Walk the schedule counting who is in the building. */
function walk(sched, starters) {
  let active = starters, lowest = Infinity;
  for (const d of sched) {
    active += d.arrivals;
    if (d.block) { lowest = Math.min(lowest, active); active -= 1; }
  }
  return { active, lowest };
}

describe('the schedule', () => {
  it('opens with a rating and a blocking and ends with the final ratings and the finale', () => {
    const s = buildSchedule({ total: 13, starters: 8 });
    expect(s[0]).toMatchObject({ day: 1, slot: 'rating1', block: true });
    expect(s.at(-2)).toMatchObject({ slot: 'final-ratings', final: true });
    expect(s.at(-1)).toMatchObject({ slot: 'finale', finale: true });
    expect(s.filter(d => d.block)).toHaveLength(8);
    expect(s.length).toBe(13);
  });

  it('brings newcomers in after blockings, early, two at most a day', () => {
    const s = buildSchedule({ total: 13, starters: 8 });
    const cutoff = Math.floor(s.length * 2 / 3);
    expect(s.reduce((n, d) => n + d.arrivals, 0)).toBe(5);
    for (const d of s.filter(x => x.arrivals)) {
      expect(d.day).toBeLessThanOrEqual(cutoff);
      expect(d.arrivals).toBeLessThanOrEqual(2);
      expect(s[d.day - 2].block).toBe(true);
    }
  });

  for (const [total, starters] of [[7, 5], [10, 7], [13, 8], [16, 8], [18, 8]]) {
    it(`ends with exactly the finalists for ${total} players (${starters} starting)`, () => {
      const s = buildSchedule({ total, starters });
      const { active, lowest } = walk(s, starters);
      expect(active).toBe(5);
      expect(lowest).toBeGreaterThanOrEqual(3);   // two influencers and someone at risk
    });
  }

  it('honours the author\'s length, never below what the blockings need', () => {
    expect(buildSchedule({ total: 13, starters: 8, days: 20 })).toHaveLength(20);
    expect(buildSchedule({ total: 13, starters: 8, days: 3 })).toHaveLength(10);
  });

  it('refuses a season that cannot work', () => {
    expect(() => buildSchedule({ total: 5, starters: 5 })).toThrow(/at least one blocking/);
    expect(() => buildSchedule({ total: 13, starters: 2 })).toThrow(/three starting/);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run tests/ci-schedule.test.js`
Expected: FAIL — cannot resolve `../js/ci/schedule.js`.

- [ ] **Step 3: Write `js/ci/schedule.js`**

```js
// ══════════════════════════════════════════════════════════════════════
// ci/schedule.js — days from the cast (spec §6.2)
// ══════════════════════════════════════════════════════════════════════
//
// A real US season: 10-14 players over 11-15 days, the first rating and
// blocking on Day 1, newcomers after blockings in the first two-thirds, five
// finalists. The length is built from the cast unless the author sets it, and
// it is never shorter than the blockings need. Games, parties and twists fill
// the social days in Plan 3.
export const DEFAULT_DAYS = { min: 11, max: 15 };

export function buildSchedule({ total, starters, finalists = 5, days = null }) {
  const blocks = total - finalists;
  if (blocks < 1) throw new Error(`a season needs at least one blocking: ${total} players, ${finalists} finalists`);
  if (starters < 3) throw new Error('a season needs at least three starting players');
  const newcomers = total - starters;
  const D = Math.max(blocks + 2, days ?? Math.min(DEFAULT_DAYS.max, Math.max(DEFAULT_DAYS.min, total)));
  const mid = D - 3;                       // days 2 .. D-2
  const social = D - 2 - blocks;
  const socialAt = new Set(Array.from({ length: social }, (_, k) => Math.floor((k + 0.5) * mid / social)));
  const day = (n, slot, over = {}) => ({ day: n, slot, block: false, arrivals: 0, final: false, finale: false, ...over });
  const out = [day(1, 'rating1', { block: true })];
  let r = 1;
  for (let i = 0; i < mid; i++) {
    out.push(socialAt.has(i) ? day(i + 2, 'social') : day(i + 2, `rating${++r}`, { block: true }));
  }
  out.push(day(D - 1, 'final-ratings', { final: true }), day(D, 'finale', { finale: true }));

  const cutoff = Math.floor(D * 2 / 3);
  let slots = out.filter(d => d.day > 1 && d.day <= cutoff && out[d.day - 2].block);
  if (slots.length * 2 < newcomers) slots = out.filter(d => d.day > 1 && d.day <= D - 3);
  if (slots.length * 2 < newcomers) throw new Error(`too many newcomers (${newcomers}) for ${D} days`);
  for (let k = 0; k < newcomers; k++) slots[Math.floor(k * slots.length / newcomers)].arrivals++;
  return out;
}
```

- [ ] **Step 4: Run the test**

Run: `npx vitest run tests/ci-schedule.test.js`
Expected: PASS. If the `[7, 5]` case reports `lowest` of 2, the second blocking falls before the newcomers arrive: check that `slots` includes Day 2 (the morning after the Day 1 blocking).

- [ ] **Step 5: Commit**

```bash
git add js/ci/schedule.js tests/ci-schedule.test.js
git commit -m "feat(the-circle): a season schedule built from the cast"
```

---

### Task 13: The finale and the season loop

**Files:**
- Create: `js/ci/finale.js`, `js/ci/season.js`
- Test: `tests/ci-season.test.js`

**Interfaces:**
- Consumes: every earlier task.
- Produces (`finale.js`): `finalDay(state, rng) → finalRow`, `placementsOf(state, finalRow) → [{ profile, people, place, avg }]`, `finaleDay(state, rng, finalRow) → { placements, winner }`
- Produces (`season.js`):
  - `playCircleSeason({ cast, setup = {}, pool = [], options = {}, seed = 1, carried = null }) → { rows, state, result }`
  - `result = { placements, winner, fanFavorite }`
  - each row: `{ episode, day, format: 'the-circle', slot, ci: { active, rating, blocked, arrivals, scenes } }`, also pushed onto `gs.episodeHistory`
  - `applyCarried(state, carried)` — franchise bonds between players who can recognise each other (spec §4.7); `carried` is `franchise-carry.js`'s `{ sums: [{ a, b, delta }] }` by person name

Spec §15 and §3.3. The finale: the last Circle Chat, the final ratings (the "deserves it" term), the meet — finalists arrive one by one and every pair learns the truth — then placements, ties broken by first places over the season (UK 3). Fan Favorite comes from the public after the last day airs.

**The day, in order:** mind drift → yesterday's goodbye videos → visit reports → morning feed (all Day 2+) → arrivals → recognition → chats → Circle Chat → rating + blocking, or final ratings, or the finale → air the day → write the row.

- [ ] **Step 1: Write the failing test** — `tests/ci-season.test.js`

```js
import { describe, expect, it } from 'vitest';
import { gs, setGs, setPlayers } from '../js/core.js';
import { playCircleSeason, applyCarried } from '../js/ci/season.js';
import { placementsOf } from '../js/ci/finale.js';
import { newState, rel } from '../js/ci/state.js';
import { makePlayers, makePool, circleSetup } from './helpers/ci-cast.js';

function play(n = 13, seed = 5, { newcomers = 5, pool = makePool(6, seed), options = {} } = {}) {
  const cast = makePlayers(n, seed);
  setPlayers(cast);
  const names = cast.map(p => p.name);
  return playCircleSeason({ cast: names, setup: circleSetup(names, { newcomers }), pool, options, seed });
}

describe('a whole season', () => {
  it('plays to a winner with five finalists, one row a day, stamped with the format', () => {
    const { rows, state, result } = play();
    expect(rows.length).toBe(13);
    for (const r of rows) expect(r.format).toBe('the-circle');
    expect(gs.episodeHistory).toHaveLength(rows.length);
    expect(state.active).toHaveLength(5);
    expect(state.blocked).toHaveLength(8);
    expect(result.placements.map(p => p.profile).sort()).toEqual([...state.active].sort());
    expect(result.winner.place).toBe(1);
    expect(Object.keys(state.people)).toContain(result.fanFavorite);
  });

  it('reveals every finalist to every other at the meet', () => {
    const { state } = play();
    for (const a of state.active) for (const b of state.active) {
      if (a !== b) expect(state.revealed[a]?.[b]).toBe(true);
    }
  });

  it('replays identically from its seed, and a persona\'s bio changes nothing', () => {
    const one = play(13, 11);
    const two = play(13, 11);
    expect(JSON.stringify(two.rows)).toBe(JSON.stringify(one.rows));
    const pool = makePool(6, 11).map(p => ({ ...p, bio: 'rewritten by the author' }));
    const three = play(13, 11, { pool });
    expect(JSON.stringify(three.rows)).toBe(JSON.stringify(one.rows));
  });

  for (const [n, newcomers] of [[7, 2], [18, 10]]) {
    it(`finishes a ${n}-player season with five`, () => {
      const { state } = play(n, 3, { newcomers });
      expect(state.active).toHaveLength(5);
    });
  }

  it('plays with an empty Catfish Pool', () => {
    const { state } = play(13, 6, { pool: [] });
    expect(Object.values(state.profiles).some(p => p.mode === 'catfish')).toBe(false);
    expect(state.active).toHaveLength(5);
  });

  it('keeps state plain JSON', () => {
    const { state } = play(10, 2, { newcomers: 3 });
    expect(JSON.parse(JSON.stringify(state))).toEqual(state);
  });
});

describe('the finale', () => {
  it('breaks a tie in the final ratings on first places over the season', () => {
    const s = newState(1);
    s.profiles = { '@a': { players: ['A'] }, '@b': { players: ['B'] } };
    s.firstPlaces = { '@a': 2, '@b': 5 };
    const p = placementsOf(s, { results: [{ profile: '@a', avg: 1.5 }, { profile: '@b', avg: 1.5 }] });
    expect(p[0]).toMatchObject({ profile: '@b', place: 1, people: ['B'] });
  });
});

describe('carried bonds', () => {
  it('lets an honest alum\'s old grudge walk in, but not through a catfish\'s face', () => {
    setGs({ bonds: {}, relationshipDimensions: {}, episodeHistory: [] });   // no numbers left from a played season
    const s = newState(1);
    s.people = { A: { name: 'A' }, B: { name: 'B' }, C: { name: 'C' } };
    s.profiles = {
      '@a': { handle: '@a', players: ['A'], mode: 'honest', shown: {} },
      '@b': { handle: '@b', players: ['B'], mode: 'honest', shown: {} },
      '@kate': { handle: '@kate', players: ['C'], mode: 'catfish', shown: {} },
    };
    s.handleOf = { A: '@a', B: '@b', C: '@kate' };
    applyCarried(s, { sums: [{ a: 'A', b: 'B', delta: -6 }, { a: 'A', b: 'C', delta: -6 }] });
    expect(rel('@a', '@b', 'affection')).toBeLessThan(0);
    expect(rel('@a', '@kate', 'affection')).toBe(0);     // A has no idea Kate is C
    expect(rel('@kate', '@a', 'affection')).toBeLessThan(0);  // C knows exactly who A is
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run tests/ci-season.test.js`
Expected: FAIL — cannot resolve `../js/ci/season.js`.

- [ ] **Step 3: Write `js/ci/finale.js`**

```js
// ══════════════════════════════════════════════════════════════════════
// ci/finale.js — the last day (spec §15)
// ══════════════════════════════════════════════════════════════════════
//
// "Before the winner is revealed, you are invited to one last Circle Chat."
// Then the final ratings ("strategically or with their hearts"), then the
// finalists meet one by one — each arrival reveals the truth to everyone
// already in the room — then placements. A tie goes to whoever had the most
// first places across the whole season (UK 3: Natalya over Manrika). The
// studio, the receipts tape and the reveal from fifth to first are screens
// (Plan 5) built from these records.
import { addScene, peopleOf } from './state.js';
import { revealTo } from './reveal.js';
import { runCircleChat } from './feed.js';
import { runRating } from './ratings.js';

export function finalDay(state, rng) {
  runCircleChat(state, rng, { final: true });
  return runRating(state, rng, { final: true });
}

export function placementsOf(state, finalRow) {
  return [...finalRow.results]
    .sort((a, b) => a.avg - b.avg
      || (state.firstPlaces[b.profile] || 0) - (state.firstPlaces[a.profile] || 0)
      || (a.profile < b.profile ? -1 : 1))
    .map((r, i) => ({ profile: r.profile, people: [...peopleOf(state, r.profile)], place: i + 1, avg: r.avg }));
}

export function finaleDay(state, rng, finalRow) {
  const order = state.active.map(h => [h, rng()]).sort((a, b) => a[1] - b[1]).map(([h]) => h);
  const present = [];
  for (const h of order) {
    const sc = addScene(state, 'meet', [h, ...present], { arrives: h }, [h, ...present]);
    for (const p of present) { revealTo(state, p, h, sc); revealTo(state, h, p, sc); }
    present.push(h);
  }
  const placements = placementsOf(state, finalRow);
  addScene(state, 'reveal', [...state.active], { placements }, [...state.active]);
  return { placements, winner: placements[0] };
}
```

- [ ] **Step 4: Write `js/ci/season.js`**

```js
// ══════════════════════════════════════════════════════════════════════
// ci/season.js — a whole season of The Circle, headless
// ══════════════════════════════════════════════════════════════════════
//
// The Perfect Match / Traitors shape: replaces `gs`, plays every day, writes
// one `gs.episodeHistory` row a day stamped `format`, and returns the Circle
// state. The caller owns `players` (setPlayers) — truths are read from it.
//
// DICE: the pool draw from `pool`, profiles from `profiles`, first sparks from
// `spark`, and every day from `day:N` — one day's draws never move another's
// (ADDING-A-SHOW §11.5 M).
//
// FRANCHISE: this function sets its own gs, so it gets none of the franchise's
// seeded bonds for free (ADDING-A-SHOW §8.3). The caller (js/ci-run.js, Plan 4)
// passes franchise-carry's `carriedFor(...)` as `carried`; the ledger write is
// Plan 6.
import { gs, setGs, players } from '../core.js';
import { streamFor } from '../dr/rng.js';
import { CIRCLE_FORMAT } from '../shows.js';
import { newState, addScene, bump, peopleOf } from './state.js';
import { truthOf, drawPersonas, buildProfiles } from './profiles.js';
import { setBelief } from './beliefs.js';
import { initMind, driftMind } from './mind.js';
import { seedAttraction, planChats, contextFor } from './chat.js';
import { runChat } from './conversation.js';
import { morningFeed, runCircleChat } from './feed.js';
import { runRating } from './ratings.js';
import { standardBlocking, goodbyeVideo, deliverReports } from './blocking.js';
import { arrive } from './arrivals.js';
import { openLedger, noteJoin, airDay, fanFavorite } from './public.js';
import { buildSchedule } from './schedule.js';
import { finalDay, finaleDay } from './finale.js';

export const CARRY = 0.6;

/** Past seasons (spec §4.7): only a player who can SEE who the other is carries the feeling. */
export function applyCarried(state, carried) {
  for (const { a, b, delta } of carried?.sums || []) {
    const ha = state.handleOf[a], hb = state.handleOf[b];
    if (!ha || !hb || ha === hb) continue;
    if (state.profiles[hb].mode !== 'catfish') { bump(ha, hb, 'affection', delta * CARRY); bump(ha, hb, 'trust', delta * CARRY); }
    if (state.profiles[ha].mode !== 'catfish') { bump(hb, ha, 'affection', delta * CARRY); bump(hb, ha, 'trust', delta * CARRY); }
  }
}

/** A catfish wearing an alum's face is recognised by anyone who knows that alum. */
function recognise(state, carried) {
  const known = carried?.sums || [];
  const seen = state.recognised;
  for (const [h, p] of Object.entries(state.profiles)) {
    const face = p.shown?.face || '';
    if (!face.startsWith('alum:') || !state.active.includes(h)) continue;
    const alum = face.slice(5);
    for (const obs of state.active) {
      if (obs === h || seen[`${obs}>${h}`]) continue;
      const knows = peopleOf(state, obs).some(n => known.some(s => (s.a === n && s.b === alum) || (s.b === n && s.a === alum)));
      if (!knows) continue;
      seen[`${obs}>${h}`] = true;
      const sc = addScene(state, 'recognise', [obs], { profile: h, alum }, [obs]);
      setBelief(state, obs, h, 'real', 0.05, sc);
      setBelief(state, obs, h, 'guessOf', alum, sc);
    }
  }
}

export function playCircleSeason({ cast, setup = {}, pool = [], options = {}, seed = 1, carried = null }) {
  setGs({ bonds: {}, perceivedBonds: {}, relationshipDimensions: {}, activePlayers: [],
    episodeHistory: [], popularity: {} });
  const state = newState(seed, options);
  const truths = cast.map(name => truthOf(players.find(p => p.name === name) || { name, stats: {} }, setup[name] || {}));
  const draw = drawPersonas(truths, pool, streamFor(seed, 'pool'), state.options.pickBy);
  const handles = buildProfiles(state, truths, draw, pool, streamFor(seed, 'profiles'));
  openLedger(state);
  seedAttraction(state, streamFor(seed, 'spark'));
  applyCarried(state, carried);

  const isNewcomer = h => peopleOf(state, h).every(n => state.people[n].role === 'newcomer');
  const starters = handles.filter(h => !isNewcomer(h));
  const queue = handles.filter(isNewcomer);
  const schedule = buildSchedule({ total: handles.length, starters: starters.length,
    finalists: state.options.finalists, days: state.options.days });

  const rows = [];
  let finalRow = null, result = null;
  for (const d of schedule) {
    state.day = d.day;
    const rng = streamFor(seed, `day:${d.day}`);
    if (d.day === 1) {
      for (const h of starters) { state.active.push(h); state.joinedDay[h] = 1; initMind(state, h); noteJoin(state, h); }
      addScene(state, 'profiles', [...starters], {}, [...starters]);
    } else {
      for (const h of state.active) driftMind(state, h);
      for (const h of state.pendingGoodbyes.splice(0)) goodbyeVideo(state, rng, h);
      deliverReports(state, rng);
      morningFeed(state, rng);
    }
    const arriving = queue.splice(0, d.arrivals);
    if (arriving.length) { arrive(state, rng, arriving); for (const h of arriving) noteJoin(state, h); }
    recognise(state, carried);

    const ctx = contextFor(state, d);
    for (const plan of planChats(state, rng, ctx)) runChat(state, rng, plan, ctx);
    if (!d.finale) runCircleChat(state, rng, { party: d.slot === 'social' && d.day % 2 === 0 });

    let rating = null;
    if (d.block) { rating = runRating(state, rng); standardBlocking(state, rng, rating); }
    if (d.final) { finalRow = finalDay(state, rng); rating = finalRow; }
    if (d.finale) result = finaleDay(state, rng, finalRow);

    airDay(state);
    const row = { episode: d.day, day: d.day, format: CIRCLE_FORMAT, slot: d.slot,
      ci: { active: [...state.active], rating,
        blocked: state.blocked.filter(b => b.day === d.day).map(b => b.handle),
        arrivals: arriving, scenes: state.scenes.filter(s => s.day === d.day).length } };
    rows.push(row);
    gs.episodeHistory.push(row);
  }
  result.fanFavorite = fanFavorite(state);
  return { rows, state, result };
}
```

- [ ] **Step 5: Run the season test, then every Circle test**

Run: `npx vitest run tests/ci-season.test.js`
Expected: PASS. A season plays 13 players in well under a second; if it takes longer, look for a `state.scenes.filter` or `state.claims.filter` inside a per-pair loop and hoist it.

Run: `npx vitest run tests/ci-*.test.js`
Expected: every Circle test passes.

- [ ] **Step 6: Commit**

```bash
git add js/ci/finale.js js/ci/season.js tests/ci-season.test.js
git commit -m "feat(the-circle): the finale and the whole-season loop"
```

---

### Task 14: Guards

**Files:**
- Test: `tests/ci-guards.test.js`

**Interfaces:**
- Consumes: the source tree under `js/ci/`; `playCircleSeason`.

Each guard pins a Global Constraint. They read source files or played seasons; none of them needs new engine code. If one fails, fix the engine, never the guard.

- [ ] **Step 1: Write the guard test** — `tests/ci-guards.test.js`

```js
import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { setPlayers } from '../js/core.js';
import { playCircleSeason } from '../js/ci/season.js';
import { makePlayers, makePool, circleSetup } from './helpers/ci-cast.js';

const DIR = join(process.cwd(), 'js/ci');
const files = readdirSync(DIR).filter(f => f.endsWith('.js'));
const src = f => readFileSync(join(DIR, f), 'utf8').replace(/\/\/.*$/gm, '');

const KINDS = ['profiles', 'recognise', 'status', 'likes', 'chat', 'circle-chat', 'arrival',
  'after-party', 'ratings', 'hangout', 'blocking', 'visit', 'report', 'goodbye',
  'final-ratings', 'meet', 'reveal'];

function seasons(n = 4) {
  return Array.from({ length: n }, (_, i) => {
    const cast = makePlayers(13, 40 + i);
    setPlayers(cast);
    const names = cast.map(p => p.name);
    return playCircleSeason({ cast: names, setup: circleSetup(names, { newcomers: 5 }), pool: makePool(7, 40 + i), seed: 40 + i });
  });
}

describe('The Circle guards', () => {
  it('rolls no bare dice', () => {
    for (const f of files) expect(src(f), f).not.toMatch(/Math\.random/);
  });

  it('lets only public.js touch the audience ledger, and no decision read it', () => {
    for (const f of files) {
      if (f === 'public.js') continue;
      expect(src(f), f).not.toMatch(/pm\/ledger\.js|readApproval|readFame/);
    }
    const readers = files.filter(f => /from '\.\/public\.js'/.test(src(f)));
    expect(readers.sort()).toEqual(['season.js']);
  });

  it('keeps relationships in the shared store only', () => {
    const direct = files.filter(f => /relationships\.js/.test(src(f)));
    expect(direct.sort()).toEqual(['reveal.js', 'state.js']);
  });

  it('writes only known scene kinds, and every belief change was witnessed', () => {
    for (const { state } of seasons()) {
      const byId = Object.fromEntries(state.scenes.map(s => [s.id, s]));
      for (const s of state.scenes) expect(KINDS, s.kind).toContain(s.kind);
      for (const e of state.beliefLog) expect(byId[e.scene].seenBy, `scene ${e.scene}`).toContain(e.obs);
    }
  });

  it('never lets a nice player lie: false credit, visit reports and plants are schemers\' only', () => {
    const NICE = new Set(['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat']);
    for (const { state } of seasons()) {
      const nice = h => state.profiles[h].players.some(n => NICE.has(state.people[n].archetype));
      for (const c of state.claims) {
        if (['saved', 'visitSaid'].includes(c.kind) && !c.truth) expect(nice(c.origin.by), `${c.kind} ${c.id}`).toBe(false);
      }
      for (const s of state.scenes.filter(x => x.kind === 'chat' && x.data.intent === 'plant')) {
        expect(nice(s.who[0]), `plant in scene ${s.id}`).toBe(false);
      }
    }
  });

  it('never writes English into a scene', () => {
    for (const { state } of seasons(2)) {
      for (const s of state.scenes) {
        const text = JSON.stringify(s.data);
        expect(text, `scene ${s.id}`).not.toMatch(/"[A-Z][a-z]+ [a-z]+ [a-z]+/);
      }
    }
  });
});
```

- [ ] **Step 2: Run it**

Run: `npx vitest run tests/ci-guards.test.js`
Expected: PASS. A failure here is a real defect; each assertion message names the file, claim or scene. The "no English" guard looks for a capitalised word followed by two lowercase words inside scene data — a sentence. If a scene carries a proper noun followed by words (it should not), it will name the scene.

- [ ] **Step 3: Commit**

```bash
git add tests/ci-guards.test.js
git commit -m "test(the-circle): guards — no bare dice, no public reads, witnessed beliefs, no nice liars"
```

---

### Task 15: `npm run audit:ci-spec`

**Files:**
- Create: `tests/ci-spec-audit.test.js`
- Modify: `package.json` (`scripts`)

**Interfaces:**
- Consumes: `playCircleSeason`, the cast helpers.

Spec §21.1: a hundred seasons, each measurement printed beside the real show's number. It prints; it asserts only that every season finishes with the finalists. **Read it**, then tune the constants the numbers point at (`MOTIVE_LINE`, `SLIP`, `MISREAD`, `PROBE`, `PUBLIC_THEORY`, `REPORT_LIE`, `SPARK`, `PERSONA_APPEAL`, `NOISE`, `SUSPICION`, `APPROVAL`), one at a time, re-running after each. Capture everything inside the loop while each season is live (ADDING-A-SHOW §11.5 T).

**Where it starts.** This plan's code was run while the plan was written, and a first calibration pass is already in the code above. The audit printed this (100 seasons, 13 players, a pool of 6):

| measurement | now | target |
|---|---|---|
| seasons finished with the finalists | 100/100 | all |
| days / blockings | 13 / 8 | 11–15 / 6–8 |
| catfish share of profiles | 37.8% | ~33% |
| catfish winners | 23% | ~50% |
| catfish exposed before the final (blocked or confessed) | 68.7% | most, not all |
| finalist catfish ranked mostly on suspicion | 6.3% | some |
| seasons with an influencer 3+ times | 100% | common |
| honest players blocked as "fake", per season | 0.09 | > 0 |
| pact betrayals inferred, per season (right) | 3.76 (24%) | several (not all) |
| rating pacts kept | 82% | most |
| seasons with a newcomer in the final | 100% | common |
| scenes / chats per day | 25 / 12.5 | dense |
| slips per season (noticed) | 21.9 (82%) | a few, some noticed |
| visit lies per season | 1.0 | rare |
| Fan Favorite is the winner | 63% | sometimes |

What the first pass found, so the next one does not re-find it:

- **Catfish were losing for being catfish, not for who they were.** With an empty pool, the same players were blocked at the normal rate (0.62 against 0.61) and won 26% of seasons; as catfish they won 7%. The levers that moved it: the ballot's suspicion weight (`SUSPICION` 10 → 5), the Hangout's `fake` weight (6 → 3), fewer and softer slips with misreads for honest players (`SLIP.base`, `MISREAD`), and `PERSONA_APPEAL` — a persona is chosen to be liked. Still 23% against ~50%: the remaining gap is lower affection received (1.58 against 1.82) and higher stress (7.1 against 6.1). Look there next.
- **"Will they save me?" used to grow with popularity**, a loop that made the same player Influencer 5–6 times; it now reads how much they like you. Still 100% of seasons have someone at 3+ (typically 4): these seasons have 8 ratings against US 1's 6, so check the distribution before tuning.
- **Newcomers reach the final every season.** They are immune once and start without enemies. The real record says common, not always.
- **The first test cast spread ages evenly from 21 to 56**, which made nearly everyone want a persona. `makePlayers` now draws most ages from 21–32, like a real cast.

- [ ] **Step 1: Add the script** — in `package.json` `scripts`, after `"audit:pm-spec"`:

```json
    "audit:ci-spec": "vitest run --config vitest.audit.config.js tests/ci-spec-audit.test.js --reporter=verbose",
```

- [ ] **Step 2: Write the audit** — `tests/ci-spec-audit.test.js`

```js
// ══════════════════════════════════════════════════════════════════════
// ci-spec-audit.test.js — a hundred seasons, every rate beside the real show
// ══════════════════════════════════════════════════════════════════════
//
// Run it and READ it: npm run audit:ci-spec. Targets are spec §2.2 and §21.1.
// Measurements are taken INSIDE the loop (after it, only the last season is
// left — ADDING-A-SHOW §11.5 T).
import { describe, expect, it } from 'vitest';
import { setPlayers } from '../js/core.js';
import { playCircleSeason } from '../js/ci/season.js';
import { makePlayers, makePool, circleSetup } from './helpers/ci-cast.js';

const SEASONS = 100;
const pct = (a, b) => (b ? (100 * a / b).toFixed(1) + '%' : 'n/a');
const mean = a => (a.length ? (a.reduce((x, y) => x + y, 0) / a.length).toFixed(2) : 'n/a');

describe('The Circle spec audit', () => {
  it('measures a hundred seasons', () => {
    const m = { finished: 0, days: [], blocks: [], catfish: 0, profiles: 0, catfishWin: 0, catfishTotal: 0,
      catfishExposed: 0, finalCatfish: 0, finalSuspected: 0, influencer3: 0, wrongFake: [], inferred: [], inferredRight: 0, inferredAll: 0,
      visitsCatfish: 0, visits: 0, newcomerFinal: 0, scenesPerDay: [], chatsPerDay: [], intents: {},
      probes: {}, slips: [], slipsNoticed: 0, slipsAll: 0, ffIsWinner: 0, pacts: [], pactKept: 0, pactChecks: 0,
      reports: [], unused: [], editedShare: [] };
    for (let s = 1; s <= SEASONS; s++) {
      const cast = makePlayers(13, s);
      setPlayers(cast);
      const names = cast.map(p => p.name);
      const { rows, state, result } = playCircleSeason({ cast: names, setup: circleSetup(names, { newcomers: 5 }),
        pool: makePool(6, s), seed: s });
      if (state.active.length === state.options.finalists) m.finished++;
      m.days.push(rows.length);
      m.blocks.push(state.blocked.length);
      const profs = Object.values(state.profiles);
      m.profiles += profs.length;
      m.catfish += profs.filter(p => p.mode === 'catfish').length;
      m.editedShare.push(profs.filter(p => p.mode === 'edited').length / profs.length);
      m.unused.push(state.unused.length);
      if (state.profiles[result.winner.profile].mode === 'catfish') m.catfishWin++;
      // Exposed = the room learned the truth before the final: blocked (the
      // goodbye video) or confessed. Measured this way because after the
      // finale meet every finalist has been revealed to every other.
      const finalRow = state.ratings.find(r => r.final);
      for (const p of profs.filter(x => x.mode === 'catfish')) {
        m.catfishTotal++;
        const blocked = state.blocked.some(b => b.handle === p.handle);
        const confessed = state.scenes.some(x => x.kind === 'chat' && x.data.confessed && x.who[0] === p.handle);
        if (blocked || confessed) m.catfishExposed++;
        if (!blocked && finalRow) {
          m.finalCatfish++;
          const why = finalRow.ballots.map(b => b.reasons[b.order.indexOf(p.handle)]).filter(Boolean);
          if (why.filter(w => w === 'suspicion').length * 2 >= why.length) m.finalSuspected++;
        }
      }
      if (Object.values(state.influencerCount).some(n => n >= 3)) m.influencer3++;
      m.wrongFake.push(state.scenes.filter(x => x.kind === 'blocking' && x.data.reason === 'fake'
        && state.profiles[x.data.target].mode !== 'catfish').length);
      const inf = state.ratings.flatMap(r => r.inferred || []);
      m.inferred.push(inf.length);
      m.inferredAll += inf.length;
      m.inferredRight += inf.filter(x => x.right).length;
      for (const v of state.scenes.filter(x => x.kind === 'visit')) {
        m.visits++;
        if (v.who.some(h => state.profiles[h].mode === 'catfish')) m.visitsCatfish++;
      }
      if (state.active.some(h => state.joinedDay[h] > 1)) m.newcomerFinal++;
      for (let d = 1; d <= rows.length; d++) {
        const day = state.scenes.filter(x => x.day === d);
        m.scenesPerDay.push(day.length);
        m.chatsPerDay.push(day.filter(x => x.kind === 'chat').length);
      }
      for (const c of state.scenes.filter(x => x.kind === 'chat')) {
        m.intents[c.data.intent] = (m.intents[c.data.intent] || 0) + 1;
        for (const p of c.data.probes || []) m.probes[p.result] = (m.probes[p.result] || 0) + 1;
      }
      const slips = state.scenes.flatMap(x => x.data.slips || []);
      m.slips.push(slips.length);
      m.slipsAll += slips.length;
      m.slipsNoticed += slips.filter(x => x.noticedBy.length).length;
      if (result.fanFavorite === result.winner.people[0]) m.ffIsWinner++;
      m.pacts.push(state.pacts.length);
      for (const p of state.pacts) for (const k of p.kept) { m.pactChecks++; if (k.kept) m.pactKept++; }
      m.reports.push(state.scenes.filter(x => x.kind === 'report').length);
    }
    const lines = [
      ['seasons finished with the finalists', `${m.finished}/${SEASONS}`, 'all'],
      ['days / blockings (mean)', `${mean(m.days)} / ${mean(m.blocks)}`, '11-15 / 6-8'],
      ['catfish share of profiles', pct(m.catfish, m.profiles), '~33%'],
      ['edited share of profiles', mean(m.editedShare), 'some'],
      ['personas left unused (mean, pool of 6)', mean(m.unused), 'some'],
      ['catfish winners', pct(m.catfishWin, SEASONS), '~50% (5 of 10 real)'],
      ['catfish exposed before the final (blocked or confessed)', pct(m.catfishExposed, m.catfishTotal), 'most, not all'],
      ['finalist catfish ranked mostly on suspicion', pct(m.finalSuspected, m.finalCatfish), 'some (US 1 "Rebecca")'],
      ['seasons with an influencer 3+ times', pct(m.influencer3, SEASONS), 'common (US 1 Shubham: 4)'],
      ['honest players blocked as "fake" (per season)', mean(m.wrongFake), '> 0 (US 1 Alana)'],
      ['pact betrayals inferred (per season)', mean(m.inferred), 'several'],
      ['…of which right', pct(m.inferredRight, m.inferredAll), 'not all'],
      ['rating pacts kept', pct(m.pactKept, m.pactChecks), 'most'],
      ['visits involving a catfish', pct(m.visitsCatfish, m.visits), 'a meaningful share'],
      ['seasons with a newcomer in the final', pct(m.newcomerFinal, SEASONS), 'common (US 4 "Imani")'],
      ['scenes per day / chats per day', `${mean(m.scenesPerDay)} / ${mean(m.chatsPerDay)}`, 'dense'],
      ['slips per season (noticed)', `${mean(m.slips)} (${pct(m.slipsNoticed, m.slipsAll)})`, 'a few, some noticed'],
      ['visit lies per season', mean(m.reports), 'rare'],
      ['Fan Favorite is the winner', pct(m.ffIsWinner, SEASONS), 'sometimes (US 1: no)'],
    ];
    console.log('\nTHE CIRCLE — spec audit, ' + SEASONS + ' seasons\n');
    for (const [k, v, t] of lines) console.log(`  ${k.padEnd(48)} ${String(v).padStart(16)}   target: ${t}`);
    console.log('\n  intents:', JSON.stringify(m.intents));
    console.log('  probes: ', JSON.stringify(m.probes), '\n');
    expect(m.finished).toBe(SEASONS);
  });
});
```

- [ ] **Step 3: Run it and read it**

Run: `npm run audit:ci-spec`
Expected: PASS, and the table prints. Read every line against its target. Record the numbers in the commit message. Any line far from its target is a finding: name the constant it points at in the commit message, and tune it in a follow-up commit, one constant at a time, re-running the audit after each (100 seasons move a rate by about ±2 points; judge a small change at 300 — ADDING-A-SHOW §16.8).

- [ ] **Step 4: Full suite once**

Run: `npm test`
Expected: no new failures against the Task 1 baseline.

- [ ] **Step 5: Commit**

```bash
git add tests/ci-spec-audit.test.js package.json
git commit -m "test(the-circle): audit:ci-spec — a hundred seasons against the real show"
```

---

## Self-review notes (done while writing)

- **Spec coverage.** §1 decisions: registry (T1), own gs (T13), Catfish Pool + overrides (T3), honesty per fact (T3), archetype rule (T2, T7, T10, T14), relationships by profile and the reveal conversion (T6). §4.7 alumni: carried bonds and face recognition (T13). §5 beliefs (T4), hyperpersonal idealisation (T7 `ideal`, T6 conversion), emotions (T4). §6 days and schedule (T12). §7 messages, chats, claims, leaks, collisions, slips, probes, theories, status and likes (T5–T8); hashtags and texting voice are data here (T3 `voice`) and words in Plan 2. §8 ratings (T9). §9 Hangout (T10). §10 formats: **standard only** here; the rest are Plan 3 by design. §11 visit, reports, goodbye (T10). §12 newcomers: snoop-and-choose only; other entries Plan 3. §15 finale (T13). §16 public (T11). §17–§20 are Plans 2, 4, 5, 6. §21.1 audit (T15); §21.2 transcript is Plan 2.
- **Deferred on purpose, not forgotten:** games, parties and apartment life (Plan 3; `party` is only a flag on social days here), the other blocking formats and powers (Plan 3), what airs (Plan 2 — every scene airs in Plan 1), the runnable flag and `simulator.html` option (Plan 4), the ledger write (Plan 6).
- **Names checked across tasks:** `personMayScheme`, `schemeEligible`, `makePact`, `addScene`, `S`, `belief`/`nudgeBelief`/`setBelief`, `learn`/`makeClaim`/`passOnWeight`/`contradictions`, `rollSlips`/`probe`/`hasTheory`/`THEORY_LINE`, `revealTo`/`isRevealed`, `attractionOk`/`seedAttraction`/`utilities`/`planChats`/`contextFor`, `runChat`, `morningFeed`/`runCircleChat`, `runRating`/`results`/`influencersFrom`/`revealOrder`/`ratedPool`, `deliberate`/`blockScore`, `standardBlocking`/`runVisit`/`deliverReports`/`goodbyeVideo`/`atRiskOf`, `arrive`, `openLedger`/`noteJoin`/`airDay`/`fanFavorite`, `buildSchedule`, `finalDay`/`finaleDay`/`placementsOf`, `playCircleSeason`/`applyCarried`.
- **State keys** used anywhere are declared in `newState` (T2), `recognised` included.
- **Edge found in review:** a three-way tie for influencer in a room of three leaves nobody at risk; the top two decide (T10, tested).
- **Verified by running it.** Every file this plan writes was extracted into a scratch worktree with Task 1's edits applied and run: all 14 test files (102 tests) pass, and `audit:ci-spec` plays 100 seasons in about a second and a half. Running it found three things now fixed in the plan: `HOSTS_BY_FORMAT` lives in `js/shows.js`, not `js/quick-setup.js`; a rounded Hangout score could be `-0`, which JSON writes back as `0` (a saved season would not equal the live one); and the calibration above.

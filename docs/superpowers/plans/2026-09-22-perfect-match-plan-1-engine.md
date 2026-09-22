# Perfect Match — Plan 1: registry and headless engine

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. **This user's standing rule: work inline, no subagents** — use executing-plans.

**Goal:** Register the fifth show and build a headless Perfect Match engine that plays a whole 16-episode season — islander profiles, one-way layered relationships (feels / shows / believes, on the shared `js/relationships.js` store), ~100 events an episode, recouplings, bombshells, Casa Amor, public and villa dumpings, the aired-only popularity ledgers, the final and the reunion — measured by `npm run audit:pm-spec`.

**Architecture:** Same shape as The Traitors: a headless `playPerfectMatchSeason()` that replaces `gs` with its own, writes one `gs.episodeHistory` row per episode stamped `format: 'perfect-match'`, and keeps villa state on `gs.pm`. Every decision takes its dice from `streamFor(seed, salt)` so one episode's draws never move another's. Connection is the shared bond store (`addBond` / `getPerceivedBond`); attraction, the ledgers and secrets are Perfect Match state.

**Tech Stack:** ES modules, no build step; vitest + jsdom (`npm test`, audits via `vitest.audit.config.js`).

**Spec:** `docs/superpowers/specs/2026-09-22-perfect-match-design.md` — read it first. `docs/ADDING-A-SHOW.md` is the manual it cites (§N).

## Roadmap (this plan is 1 of 5)

1. **This plan** — registry + headless engine + audit.
2. **Mockup** — `mockup/mockup-pm-vp.html`, Drag Race–level animated pinned stage, Love Island coded. Approved before Plan 3.
3. **Run tab + cast tab** — `js/pm-run.js` (queue/re-run like `js/tr-run.js`), dispatch in both `run-ui.js` sites, the Perfect Match cast-setup tab, `CONFIG_SCOPE`, `updateEditLayer` wiring, prose pools.
4. **Screens** — VP screens built from the approved mockup, text backlog, dumping scene, reunion, the in-season Perfect Match tab.
5. **Export, publish, franchise** — `votingHistory` channels, `exits[]`, career stats writers, social pack, ratings `readSignals`, franchise-meta exes, AI fills.

## Global Constraints

- Only the nine stats exist: `physical, endurance, mental, social, strategic, loyalty, boldness, intuition, temperament`. No new stats.
- Gameplay is proportional (`stat × factor`); thresholds only pick narration labels (persona, approval label).
- Archetypes: the 15 franchise archetypes only. Nice archetypes (hero, loyal-soldier, social-butterfly, showmancer, underdog, goat) never scheme. Faking feelings, love-bombing and gaslighting are schemes (scheme-eligible islanders only); hiding a crush is not.
- Relationships live in `js/relationships.js` — one record per DIRECTION, widened with `love`. No Perfect Match copy of any relationship number (ADDING-A-SHOW §11.5 Q).
- An islander's decision reads their OWN feelings and their BELIEF about the other person (`romance(me, you)`, `believed(state, me, you)`), never the other person's truth.
- No `Math.random()` anywhere under `js/pm/` — dice come from `streamFor(seed, salt)` (`js/dr/rng.js`).
- Islander decisions never read approval or fame. Only `js/pm/ledger.js`, `js/pm/public-vote.js`, `js/pm/arrivals.js` and `js/pm/season.js` may reference the ledger readers (guarded in Task 10).
- Only aired events write approval or fame.
- Every text template uses `{a}` / `{b}` / `{c}`; never a name in a pool.
- Slug `perfect-match`, prefix `pm`, exit verbs `dumped` and `walked`, player word `islander`.
- Run affected test files while iterating; run the full `npm test` once at the end of Task 1 and Task 12.
- Commit after every task; `git add` named files only, never `-A` (the tree carries unrelated user work).

---

## File structure

| File | Responsibility |
|---|---|
| `js/shows.js` (modify) | the registry entry, `PERFECT_MATCH_FORMAT`, `exitWalk` in `exitVerbs` |
| `js/quick-setup.js`, `js/settings.js`, `js/social/adapter.js`, `simulator.html` (modify) | picker tag, host Dior, the villa setting, social words, the setup option |
| `tests/helpers/show-vocabulary.js` (modify) | the show's own words |
| `js/pm/profile.js` | islander profile: stats, intent, type, looks, icks, interests, persona |
| `js/relationships.js` (modify) | the shared one-way relationship store gains `love` |
| `js/pm/chemistry.js` | attraction on meeting, written into the shared store; `attr` / `nudgeAttraction` views |
| `js/pm/feelings.js` | the three layers — feels, shows, believes; love growth; masks; relationship labels |
| `js/pm/ledger.js` | approval + fame, caps, labels, couple score, followers |
| `js/pm/events.js` | the event kinds, the ~100-event episode, airing, hut cutaways, secrets |
| `js/pm/recoupling.js` | a recoupling ceremony |
| `js/pm/public-vote.js` | vote shares, bottom couples, final vote, split-or-steal |
| `js/pm/villa-vote.js` | the four villa dumping formats |
| `js/pm/arrivals.js` | bombshell entrance, eyes-on, dates, steals |
| `js/pm/casa.js` | Casa Amor split and stick-or-twist |
| `js/pm/schedule.js` | the 16-episode template |
| `js/pm/moments.js` | each episode's big moment, the dumping scene, photos, reunion |
| `js/pm/season.js` | `playPerfectMatchSeason` |
| `tests/helpers/pm-cast.js` | deterministic synthetic casts |
| `tests/pm-*.test.js`, `tests/pm-spec-audit.test.js`, `package.json` | tests and the audit |

---

### Task 1: Registry entry and its companions

**Files:**
- Modify: `js/shows.js` (entry after `'drag-race'`, constant after `BB_FORMAT`, `exitVerbs`)
- Modify: `js/quick-setup.js` (`SHOW_TAGS`, `HOSTS_BY_FORMAT`)
- Modify: `js/settings.js` (`SETTINGS_BY_FORMAT`, `SEASON_SETTINGS`)
- Modify: `js/social/adapter.js` (`SHOW_WORDS`)
- Modify: `simulator.html` (format `<option>` beside the drag-race one)
- Modify: `tests/helpers/show-vocabulary.js` (`VOCAB`)
- Test: `tests/pm-registry.test.js`

**Interfaces:**
- Produces: `SHOWS['perfect-match']`, `PERFECT_MATCH_FORMAT = 'perfect-match'`, `exitVerbs('perfect-match') → ['dumped', 'walked']`, runnable flag name `_pmRunnable`.

- [ ] **Step 0: Record the baseline**

Run, before editing anything:
`npx vitest run tests/shows.test.js tests/shows-registry.test.js tests/show-vocabulary.test.js tests/show-list-duplication.test.js tests/ratings.test.js tests/season-format.test.js tests/social-packs.test.js tests/format-scoped-config.test.js tests/format-scoped-design.test.js tests/wiki.test.js tests/studio-portraits.test.js tests/current-season-show-scope.test.js > "$TMPDIR/pm-baseline.txt" 2>&1`
Keep the list of failing tests it reports. Those are not this task's to fix; Step 5 compares against it.

- [ ] **Step 1: Write the failing test** — `tests/pm-registry.test.js`

```js
// pm-registry.test.js — the fifth show exists and speaks its own words.
import { describe, expect, it } from 'vitest';
import { SHOWS, showWords, exitVerbs, formatPrefix, seasonId, roundShape,
  PERFECT_MATCH_FORMAT } from '../js/shows.js';
import { formatIsRunnable, SEASON_FORMATS } from '../js/core.js';
import { words as socialWords } from '../js/social/adapter.js';
import { VOCAB } from './helpers/show-vocabulary.js';
import { hostOptionsForFormat, SHOWS as PICKER } from '../js/quick-setup.js';
import { settingsForFormat } from '../js/settings.js';

describe('perfect-match registry entry', () => {
  it('is registered with prefix pm', () => {
    expect(PERFECT_MATCH_FORMAT).toBe('perfect-match');
    expect(formatPrefix('perfect-match')).toBe('pm');
    expect(seasonId('perfect-match', 1)).toBe('pm-1');
    expect(SEASON_FORMATS).toContain('perfect-match');
    expect(roundShape('perfect-match')).toBe('ballots');
    expect(SHOWS['perfect-match'].hasJury).toBe(false);
  });

  it('speaks its own words, with two doors out', () => {
    const w = showWords('perfect-match');
    expect(w.player).toBe('islander');
    expect(w.players).toBe('islanders');
    expect(w.exit).toBe('dumped');
    expect(w.audienceAward).toBe('Fan Favourite Islander');
    expect(w.host).toBe('Dior');
    expect(exitVerbs('perfect-match')).toEqual(['dumped', 'walked']);
    // A one-door show still has one door.
    expect(exitVerbs('total-drama')).toHaveLength(1);
  });

  it('declares audience, career stats, article stats and polls', () => {
    const s = SHOWS['perfect-match'];
    expect(s.audience.showmance).toBeGreaterThan(1);
    expect(s.careerStats.length).toBeGreaterThan(0);
    for (const k of ['career', 'season', 'comps']) expect(s.articleStats[k].length).toBeGreaterThan(0);
    expect(s.polls.length).toBeGreaterThanOrEqual(3);
  });

  it('is not runnable until the engine sets the flag', () => {
    const prior = globalThis.window;
    delete globalThis.window;
    expect(formatIsRunnable('perfect-match')).toBe(false);
    if (prior !== undefined) globalThis.window = prior;
  });

  it('has social words, guard words, a host, a setting and a picker tag', () => {
    expect(socialWords('perfect-match').eliminated).toBe('dumped');
    expect(socialWords('perfect-match').jury).toBeTruthy();
    expect(VOCAB['perfect-match'].own).toContain('recoupling');
    expect(hostOptionsForFormat('perfect-match')[0]).toEqual({ value: 'Dior', label: 'Dior' });
    expect(settingsForFormat('perfect-match')).toEqual(['pm-villa']);
    expect(PICKER.find(p => p.id === 'perfect-match')?.tag).toMatch(/villa/i);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run tests/pm-registry.test.js`
Expected: FAIL — `PERFECT_MATCH_FORMAT` is undefined.

- [ ] **Step 3: Add the registry entry** — in `js/shows.js`, after the closing `},` of `'drag-race'` and before the `};` that closes `SHOWS`:

```js
  // ── THE FIFTH SHOW: PERFECT MATCH ────────────────────────────────────
  //
  // A Love Island-style villa. The islanders decide who is with whom; the
  // public decides who stays and who wins. Two doors out: dumped (by a
  // recoupling, the public or the villa) and walked. Rounds are ballots on
  // channels, the Traitors pattern (ADDING-A-SHOW.md §5): recoupling picks,
  // the public's bottom couples, the villa's dumping ballots, Casa choices.
  //
  // Spec: docs/superpowers/specs/2026-09-22-perfect-match-design.md
  'perfect-match': {
    prefix: 'pm', name: 'Perfect Match', short: 'PM', emoji: '💘', accent: '#ff6b9d',
    venue: { label: 'The Villa', icon: '🌴' },
    // Set at the bottom of js/pm-run.js (Plan 3). Absent until then, which is
    // deliberate: the setup screen must refuse a show with no run loop.
    runnableFlag: '_pmRunnable',
    airNight: 6,
    rosterPlace: 'VILLA',
    hasJury: false,
    roundsPath: 'episodeHistory',
    roundShape: 'ballots',
    words: {
      quietRound: 'A normal day in the villa',
      player: 'islander', players: 'islanders', round: 'Episode',
      exit: 'dumped', exitAction: 'dump',
      // THE SECOND EXIT VERB, read through exitVerbs(). An islander who walks
      // was not dumped, and saying so is the "evicted over a camp" bug class.
      exitWalk: 'walked',
      challenge: 'challenge', comp: 'challenge', comps: 'challenges won',
      compBeast: 'challenge star', compWon: 'challenges',
      milestone: 'the final',
      audienceAward: 'Fan Favourite Islander',
      fanWords: ['recoupling', 'bombshell', 'casa amor', 'grafting', 'mugged off',
        'firepit', 'hideaway', 'beach hut', 'villa', 'dumped from the island'],
      host: 'Dior',
    },
    // PROVISIONAL until a season has been played and the signals printed
    // (§2.5). A dating show sells romance and mess; strategy is the smallest.
    audience: { strategy: 0.5, blindside: 0.9, mess: 1.4, predictable: 0.8,
      steamroll: 1.0, showmance: 1.6, twist: 1.1 },
    // Written by the export (Plan 5). Declared now so the article rows exist.
    careerStats: [
      ['pm.couplings',            'totalCouplings'],
      ['pm.timesStolen',          'totalTimesStolen'],
      ['pm.publicVotesSurvived',  'totalPublicVotesSurvived'],
    ],
    articleStats: {
      career: [['couplings', 'Couplings'], ['publicVotesSurvived', 'Public votes survived']],
      season: [['pm.couplings', 'Couplings'], ['pm.publicVotesSurvived', 'Public votes survived']],
      comps: [['pm.couplings', 'Couplings'], ['pm.timesStolen', 'Times stolen']],
    },
    polls: ['Who is your favourite couple?', 'Who gets dumped next?',
      'Who twists at Casa Amor?', 'Who wins the villa?'],
  },
```

Add the constant after `export const BB_FORMAT = 'big-brother';`:

```js
export const PERFECT_MATCH_FORMAT = 'perfect-match';
```

Change the return line of `exitVerbs`:

```js
  return [w.exit, w.exitMurder, w.exitDq, w.exitWalk].filter(Boolean);
```

- [ ] **Step 4: Add the companions**

`js/quick-setup.js`, in `SHOW_TAGS`:
```js
  'perfect-match': 'A villa, recouplings, and the public decides',
```
In `HOSTS_BY_FORMAT`:
```js
  // One host. Portrait assets/avatars/dior.jpg (a HOST literal, which the
  // portrait guard allows). Inspired by Ariana Madix; her own voice.
  'perfect-match': [
    { value: 'Dior', label: 'Dior' },
  ],
```

`js/settings.js`, in `SETTINGS_BY_FORMAT`:
```js
  'perfect-match': ['pm-villa'],
```
In `SEASON_SETTINGS` (after `'dr-werkroom'`):
```js
  // ── PERFECT MATCH ──────────────────────────────────────────────────
  // One venue. The engine writes its own scenes and draws nothing from the
  // camp reskin pools; this exists so the dropdown has something true.
  'pm-villa': {
    label: 'The Villa', emoji: '🌴',
    blurb: 'A hillside villa with a pool, a firepit, a terrace of daybeds, one bedroom of doubles and a beach hut at the end of the garden.',
    vocab: { place: 'the villa', shelter: 'the bedroom', gather: 'the firepit',
             water: 'the pool', sleep: 'the bedroom', downtime: 'the daybeds', foodSource: 'the kitchen' },
    arrival: { vehicle: 'villa steps', verb: 'walks down the villa steps', point: 'the villa',
               onPoint: 'in the villa', headline: 'One villa. One perfect match.',
               groupCall: 'Islanders, meet me at the firepit.' },
    reskin: {},
    atmosphere: [],
  },
```

`js/social/adapter.js`, in `SHOW_WORDS` (after `'drag-race'`):
```js
  'perfect-match': {
    name: 'Perfect Match',
    short: 'PM',
    episode: 'episode',
    Episode: 'Episode',
    episodeShort: 'Ep',
    elimination: 'dumping',
    eliminated: 'dumped',
    challenge: 'challenge',
    home: 'villa',
    // The public votes, the villa votes, and the islanders pick partners.
    vote: 'public vote',
    finalVote: 'final vote',
    comps: ['challenge'],
    danger: 'the bottom couples',
    Danger: 'The bottom couples',
    onDanger: 'in the bottom couples',
    nominated: 'landed in the bottom couples',
    Pawn: 'A safe couple',
    Ceremony: 'The firepit',
    nominee: 'a bottom couple',
    pawn: 'a safe couple',
    ceremony: 'the firepit',
    // No jury. The prose field that finale takes interpolate names the public.
    jury: 'the public',
    safe: 'safe',
    nominationLabel: 'Bottom couple',
    polls: [
      { id: 'favourite', text: 'Who is your favourite couple?' },
      { id: 'dumped', text: 'Who gets dumped next?' },
      { id: 'casa', text: 'Who twists at Casa Amor?' },
    ],
  },
```

`simulator.html`, beside the drag-race option:
```html
                <option value="perfect-match">Perfect Match — a villa, recouplings, and the public decides</option>
```

`tests/helpers/show-vocabulary.js`, in `VOCAB` (after `'drag-race'`):
```js
  'perfect-match': {
    // Phrases, not bare words, where a bare word is ordinary English on the
    // other shows: Total Drama's romance says "dumped", so the exclusive form
    // is "dumped from the island". "Island" and "beach" are Total Drama's too,
    // and this show says both ("dumped from the island", "beach hut").
    own: [
      'islander', 'islanders', 'villa', 'recoupling', 'recouple', 'bombshell',
      'bombshells', 'casa amor', 'dumped from the island', 'grafting',
      'mugged off', 'firepit', 'hideaway', 'beach hut', 'island', 'beach',
      'challenge', 'challenges',
    ],
  },
```

- [ ] **Step 5: Run the registry test and the guards every show walks**

Run: `npx vitest run tests/pm-registry.test.js tests/shows.test.js tests/shows-registry.test.js tests/show-vocabulary.test.js tests/show-list-duplication.test.js tests/ratings.test.js tests/season-format.test.js tests/social-packs.test.js tests/format-scoped-config.test.js tests/format-scoped-design.test.js tests/wiki.test.js tests/studio-portraits.test.js tests/current-season-show-scope.test.js`
Expected: `pm-registry` passes. Every failure NOT in the Step 0 baseline is this task's: each names what a registered show must declare. Fix it in the registry entry or the companion file it names — never by exempting `perfect-match`. If `show-vocabulary` reports "villa" on a Total Drama page (the jury-villa twist text), remove `'villa'` from `VOCAB['perfect-match'].own` and add a comment saying why. Baseline failures are listed in the commit message, not fixed here. Never `git stash` to check a baseline — stashes are shared with the user's uncommitted work (§14.13).

- [ ] **Step 6: Full suite once**

Run: `npm test`
Expected: no new failures against `HEAD`.

- [ ] **Step 7: Commit**

```bash
git add js/shows.js js/quick-setup.js js/settings.js js/social/adapter.js simulator.html tests/helpers/show-vocabulary.js tests/pm-registry.test.js
git commit -m "feat(perfect-match): registry entry, vocabulary, host, villa setting"
```

---

### Task 2: Islander profiles

**Files:**
- Create: `js/pm/profile.js`
- Test: `tests/pm-profile.test.js`

**Interfaces:**
- Produces:
  - `INTENTS, LOOK_TAGS, VIBES, ICKS, INTERESTS, ROLES` (arrays of strings)
  - `statsOf(player) → {physical,…,temperament}` (missing → 5)
  - `vibeScore(vibe, stats) → 0..1`, `ickScore(ick, stats) → 0..1`
  - `derivePersona(stats, { late }) → string`, `isMug(stats) → boolean`
  - `resolveIslander(player, setup, rng) → Profile` where `Profile = { name, gender, sexuality, archetype, stats, role, arrivalEp, intent, type: { looks: string[], vibes: string[] }, looks: string[], icks: string[], interests: string[], bonusInterest: string|null, eyesOn: string[]|null, ex: string|null, persona: string, mug: boolean }`

- [ ] **Step 1: Write the failing test** — `tests/pm-profile.test.js`

```js
import { describe, expect, it } from 'vitest';
import { streamFor } from '../js/dr/rng.js';
import { resolveIslander, derivePersona, isMug, vibeScore, ickScore, INTENTS,
  INTERESTS, LOOK_TAGS } from '../js/pm/profile.js';

const PRIYA = { name: 'Priya', gender: 'f', sexuality: 'straight', archetype: 'perceptive-player',
  stats: { strategic: 8, mental: 8, boldness: 7, loyalty: 7, social: 6, intuition: 6,
    temperament: 3, physical: 5, endurance: 5 } };
const THEO = { name: 'Theo', gender: 'm', sexuality: 'straight', archetype: 'wildcard',
  stats: { boldness: 8, social: 7, physical: 7, endurance: 7, temperament: 7, mental: 4,
    strategic: 3, loyalty: 2, intuition: 2 } };

describe('persona', () => {
  it('reads the spec worked examples off their stats', () => {
    expect(derivePersona(PRIYA.stats, { late: false })).toBe('checklist');
    expect(derivePersona(THEO.stats, { late: false })).toBe('fuckboy');
    expect(isMug(THEO.stats)).toBe(true);
    expect(isMug(PRIYA.stats)).toBe(false);
  });
});

describe('vibes and icks are proportional to stats', () => {
  it('a bolder islander reads more confident', () => {
    expect(vibeScore('confident', { boldness: 9 })).toBeGreaterThan(vibeScore('confident', { boldness: 3 }));
    expect(ickScore('nonchalant', { boldness: 2, social: 2 }))
      .toBeGreaterThan(ickScore('nonchalant', { boldness: 8, social: 8 }));
  });
});

describe('resolveIslander', () => {
  it('keeps what the author set and rolls the rest', () => {
    const p = resolveIslander(THEO, { intent: 'fun', interests: ['animals', 'outdoors'],
      bonusInterest: 'animals', role: 'starter' }, streamFor(1, 'profile:Theo'));
    expect(p.intent).toBe('fun');
    expect(p.interests).toEqual(['animals', 'outdoors']);
    expect(p.bonusInterest).toBe('animals');
    expect(p.persona).toBe('fuckboy');
    expect(p.type.vibes.length).toBeGreaterThanOrEqual(1);
    expect(p.type.looks.every(t => LOOK_TAGS.includes(t))).toBe(true);
  });

  it('drops values that are not on the lists', () => {
    const p = resolveIslander(THEO, { intent: 'revenge', interests: ['knitting'] },
      streamFor(1, 'profile:Theo'));
    expect(INTENTS).toContain(p.intent);
    expect(p.interests.every(i => INTERESTS.includes(i))).toBe(true);
    expect(p.interests.length).toBeGreaterThanOrEqual(2);
  });

  it('rolls the same islander the same way off the same stream', () => {
    const a = resolveIslander(PRIYA, {}, streamFor(9, 'profile:Priya'));
    const b = resolveIslander(PRIYA, {}, streamFor(9, 'profile:Priya'));
    expect(a).toEqual(b);
  });

  it('an author persona wins over the derived one', () => {
    const p = resolveIslander(PRIYA, { persona: 'villa-clown' }, streamFor(1, 'profile:Priya'));
    expect(p.persona).toBe('villa-clown');
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run tests/pm-profile.test.js`
Expected: FAIL — cannot find `../js/pm/profile.js`.

- [ ] **Step 3: Implement** — `js/pm/profile.js`

```js
// ══════════════════════════════════════════════════════════════════════
// pm/profile.js — who an islander is, for one season
// ══════════════════════════════════════════════════════════════════════
//
// NO NEW STATS (spec §5.1). Everything the villa needs is read off the nine
// shared stats; a per-show player field costs nine links (ADDING-A-SHOW §8.1).
// The cast-setup fields below live on the SEASON's cast, and every one of them
// rolls when the author leaves it blank.
//
// Each islander rolls off their OWN stream (`profile:<name>`), so authoring
// one islander's intent never re-rolls anybody else.

export const INTENTS = ['love', 'settle-down', 'first-love', 'fresh-start', 'fun', 'stir',
  'fame', 'win', 'money'];
// Real islanders mostly say love; the weights are the roll, not a rule.
const INTENT_WEIGHTS = { love: 4, 'settle-down': 1.5, 'first-love': 1, 'fresh-start': 1.2,
  fun: 2, stir: 0.8, fame: 1.2, win: 0.6, money: 0.4 };
export const LOOK_TAGS = ['tall', 'short', 'muscular', 'slim', 'dad-bod', 'blonde', 'brunette',
  'dark-hair', 'redhead', 'tattoos', 'great-smile', 'pretty-boy', 'pretty-girl', 'rugged',
  'accent', 'glam', 'natural'];
export const VIBES = ['funny', 'confident', 'emotionally-mature', 'fiery', 'ambitious',
  'family-oriented', 'protective', 'bubbly', 'chill', 'competitive', 'mysterious'];
export const ICKS = ['nonchalant', 'cocky', 'loud', 'people-pleaser', 'attention-seeker',
  'chaser', 'no-manners'];
export const INTERESTS = ['fitness', 'football', 'other-sport', 'dance', 'music', 'fashion',
  'beauty', 'travel', 'languages', 'family', 'animals', 'outdoors', 'partying', 'career',
  'education', 'performing', 'social-media', 'wellness', 'food', 'gaming', 'faith', 'pop-culture'];
export const ROLES = ['starter', 'bombshell', 'casa'];

const STAT_KEYS = ['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty',
  'boldness', 'intuition', 'temperament'];
const n = v => Math.max(0, Math.min(10, Number(v ?? 5))) / 10;

export function statsOf(player) {
  const s = player?.stats || {};
  return Object.fromEntries(STAT_KEYS.map(k => [k, Number.isFinite(Number(s[k])) ? Number(s[k]) : 5]));
}

/** How strongly a set of stats reads as this vibe, 0..1. */
export function vibeScore(vibe, s) {
  switch (vibe) {
    case 'funny': return (n(s.social) + n(s.boldness)) / 2;
    case 'confident': return n(s.boldness);
    case 'emotionally-mature': return (n(s.temperament) + n(s.intuition)) / 2;
    case 'fiery': return (n(s.boldness) + (1 - n(s.temperament))) / 2;
    case 'ambitious': return (n(s.strategic) + n(s.mental)) / 2;
    case 'family-oriented': return n(s.loyalty);
    case 'protective': return (n(s.physical) + n(s.loyalty)) / 2;
    case 'bubbly': return n(s.social);
    case 'chill': return (n(s.temperament) + (1 - n(s.boldness))) / 2;
    case 'competitive': return (n(s.physical) + n(s.boldness)) / 2;
    case 'mysterious': return (n(s.intuition) + (1 - n(s.social))) / 2;
    default: return 0;
  }
}

/** How strongly a set of stats reads as this ick, 0..1. */
export function ickScore(ick, s) {
  switch (ick) {
    case 'nonchalant': return ((1 - n(s.boldness)) + (1 - n(s.social))) / 2;
    case 'cocky': return (n(s.boldness) + (1 - n(s.temperament))) / 2;
    case 'loud': return (n(s.boldness) + n(s.social)) / 2;
    case 'people-pleaser': return (n(s.loyalty) + (1 - n(s.boldness))) / 2;
    case 'attention-seeker': return (n(s.boldness) + (1 - n(s.intuition))) / 2;
    case 'chaser': return (n(s.boldness) + (1 - n(s.strategic))) / 2;
    case 'no-manners': return ((1 - n(s.temperament)) + (1 - n(s.social))) / 2;
    default: return 0;
  }
}

// A NARRATION LABEL, so thresholds are allowed here (CLAUDE.md: thresholds only
// for text). Table order is the precedence — first match wins (spec §5.2).
const hi = v => v >= 7, lo = v => v <= 4;
export const PERSONAS = [
  ['fuckboy', s => hi(s.social) && hi(s.boldness) && lo(s.loyalty)],
  ['hopeless-romantic', s => hi(s.loyalty) && lo(s.strategic)],
  ['checklist', s => hi(s.loyalty) && hi(s.strategic) && lo(s.temperament)],
  ['bombshell', (s, o) => !!o.late && hi(s.social) && hi(s.boldness)],
  ['game-player', s => hi(s.strategic) && lo(s.loyalty)],
  ['messy', s => lo(s.temperament) && hi(s.boldness)],
  ['girls-girl', s => hi(s.loyalty) && hi(s.social)],
  ['villa-clown', s => hi(s.social) && hi(s.boldness) && hi(s.temperament)],
  ['wallflower', s => lo(s.social) && lo(s.boldness)],
];

export function derivePersona(stats, opts = {}) {
  const s = { ...statsOf({ stats }) };
  for (const [id, test] of PERSONAS) if (test(s, opts)) return id;
  return 'steady';
}

/** The secondary tag any persona can carry: easy to fool. */
export function isMug(stats) { return statsOf({ stats }).intuition <= 3; }

const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];
function pickSome(rng, arr, k) {
  const pool = [...arr], out = [];
  while (out.length < k && pool.length) out.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
  return out;
}
function pickWeighted(rng, weights) {
  const entries = Object.entries(weights);
  let r = rng() * entries.reduce((s, [, w]) => s + w, 0);
  for (const [v, w] of entries) { r -= w; if (r <= 0) return v; }
  return entries[entries.length - 1][0];
}
const onList = (xs, list) => (Array.isArray(xs) ? xs.filter(x => list.includes(x)) : []);

/**
 * One islander's profile for this season. The rolls are ALWAYS drawn, in a
 * fixed order, whether or not the author set the field — so authoring a field
 * never shifts the rolls behind it.
 */
export function resolveIslander(player, setup = {}, rng) {
  const stats = statsOf(player);
  const role = ROLES.includes(setup.role) ? setup.role : 'starter';
  const late = role !== 'starter';
  const rolled = {
    intent: pickWeighted(rng, late ? { ...INTENT_WEIGHTS, stir: INTENT_WEIGHTS.stir * 2 } : INTENT_WEIGHTS),
    looksWanted: pickSome(rng, LOOK_TAGS, Math.floor(rng() * 4)),
    vibes: pickSome(rng, VIBES, 1 + Math.floor(rng() * 2)),
    looks: pickSome(rng, LOOK_TAGS, 2),
    icks: pickSome(rng, ICKS, 1 + Math.floor(rng() * 2)),
    interests: pickSome(rng, INTERESTS, 2 + Math.floor(rng() * 3)),
    bonus: rng() < 0.3 ? pick(rng, INTERESTS) : null,
  };
  const authoredInterests = onList(setup.interests, INTERESTS);
  const authoredLooks = onList(setup.type?.looks, LOOK_TAGS);
  const authoredVibes = onList(setup.type?.vibes, VIBES);
  return {
    name: player.name,
    gender: player.gender || 'm',
    sexuality: player.sexuality || 'straight',
    archetype: player.archetype || 'floater',
    stats,
    role,
    arrivalEp: Number.isFinite(Number(setup.arrivalEp)) ? Number(setup.arrivalEp) : null,
    intent: INTENTS.includes(setup.intent) ? setup.intent : rolled.intent,
    type: {
      looks: authoredLooks.length ? authoredLooks.slice(0, 3) : rolled.looksWanted,
      vibes: authoredVibes.length ? authoredVibes.slice(0, 2) : rolled.vibes,
    },
    looks: onList(setup.looks, LOOK_TAGS).length ? onList(setup.looks, LOOK_TAGS) : rolled.looks,
    icks: onList(setup.icks, ICKS).length ? onList(setup.icks, ICKS).slice(0, 2) : rolled.icks,
    interests: authoredInterests.length >= 2 ? authoredInterests.slice(0, 4) : rolled.interests,
    bonusInterest: INTERESTS.includes(setup.bonusInterest) ? setup.bonusInterest : rolled.bonus,
    eyesOn: Array.isArray(setup.eyesOn) && setup.eyesOn.length ? [...setup.eyesOn] : null,
    ex: typeof setup.ex === 'string' && setup.ex ? setup.ex : null,
    persona: typeof setup.persona === 'string' && setup.persona
      ? setup.persona : derivePersona(stats, { late }),
    mug: isMug(stats),
  };
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npx vitest run tests/pm-profile.test.js`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add js/pm/profile.js tests/pm-profile.test.js
git commit -m "feat(perfect-match): islander profiles from the nine stats"
```

---

### Task 3: Attraction, on the shared relationship store

**Files:**
- Modify: `js/relationships.js` (`RELATIONSHIP_DIMENSIONS` gains `love`)
- Create: `js/pm/chemistry.js`
- Test: `tests/pm-chemistry.test.js`

**Why this shape (spec §6.1):** `js/relationships.js` already stores one-way,
multidimensional relationships, `attraction` included. A Perfect Match table of
its own would be the second copy §11.5 Q warns about. So attraction is written
INTO the shared store, and the store is widened by one dimension, `love`.
`chemistry.js` keeps its small API (`attr`, `nudgeAttraction`,
`seedAttraction`) so every later task reads the same names — but those names
are now views onto `js/relationships.js`.

**Interfaces:**
- Consumes: `Profile`, `vibeScore`, `ickScore` (Task 2); `romanticallyCompatible` (`js/attraction.js`); `streamFor` (`js/dr/rng.js`); `getRelationshipDimension`, `setRelationshipDimension`, `addRelationshipDimension` (`js/relationships.js`).
- Produces: `typeFit(me, them) → 0..1`, `ickHit(me, them) → 0..1`, `interestBonus(me, them) → number`, `attractionOf(me, them, rng) → number 0..10 | null`, `seedAttraction(state, name, seed)`, `compatible(state, a, b) → boolean`, `attr(state, a, b) → number | null` (null = not compatible), `nudgeAttraction(state, a, b, d)`. There is NO `state.attraction`; test fixtures in later tasks that still create `attraction: {}` are harmless and may drop it.

- [ ] **Step 1: Write the failing test** — `tests/pm-chemistry.test.js`

```js
import { beforeEach, describe, expect, it } from 'vitest';
import { setGs, gs } from '../js/core.js';
import { streamFor } from '../js/dr/rng.js';
import { RELATIONSHIP_DIMENSIONS, getRelationshipDimension } from '../js/relationships.js';
import { attractionOf, typeFit, ickHit, interestBonus, seedAttraction, attr,
  nudgeAttraction } from '../js/pm/chemistry.js';

const base = (name, gender, over = {}) => ({
  name, gender, sexuality: 'straight', archetype: 'floater',
  stats: { physical: 5, endurance: 5, mental: 5, social: 5, strategic: 5, loyalty: 5,
    boldness: 5, intuition: 5, temperament: 5 },
  type: { looks: [], vibes: ['funny'] }, looks: [], icks: [], interests: ['food', 'travel'],
  bonusInterest: null, ...over,
});

beforeEach(() => setGs({ bonds: {}, relationshipDimensions: {} }));

describe('the shared store is widened, not forked', () => {
  it('has a love dimension that defaults to 0', () => {
    expect(RELATIONSHIP_DIMENSIONS).toContain('love');
    expect(getRelationshipDimension('A', 'B', 'love')).toBe(0);
  });
});

describe('attraction', () => {
  it('is null when romanticCompat says no', () => {
    expect(attractionOf(base('A', 'm'), base('B', 'm'), streamFor(1, 'x'))).toBeNull();
    expect(attractionOf(base('A', 'm'), base('A', 'f'), streamFor(1, 'x'))).toBeNull();
  });

  it('a shared bonus interest raises it and an ick lowers it, same spark', () => {
    const me = base('Theo', 'm', { bonusInterest: 'animals' });
    const lover = base('Sam', 'f', { interests: ['animals', 'food'] });
    const other = base('Sam', 'f', { interests: ['gaming', 'fashion'] });
    expect(interestBonus(me, lover)).toBeGreaterThan(interestBonus(me, other));
    expect(attractionOf(me, lover, streamFor(3, 's'))).toBeGreaterThan(attractionOf(me, other, streamFor(3, 's')));
    const picky = base('Priya', 'f', { icks: ['nonchalant'] });
    const flat = base('Jo', 'm', { stats: { ...base('x').stats, boldness: 1, social: 1 } });
    expect(ickHit(picky, flat)).toBeGreaterThan(0.5);
  });

  it('matching the look type raises type fit proportionally', () => {
    const me = base('A', 'f', { type: { looks: ['tall', 'tattoos'], vibes: [] } });
    expect(typeFit(me, base('B', 'm', { looks: ['tall', 'tattoos'] })))
      .toBeGreaterThan(typeFit(me, base('C', 'm', { looks: ['tall'] })));
    expect(typeFit(me, base('C', 'm', { looks: ['tall'] })))
      .toBeGreaterThan(typeFit(me, base('D', 'm', { looks: [] })));
  });

  it('seeds both directions INTO js/relationships.js, one-way each', () => {
    const state = { villa: ['A', 'B'],
      profiles: { A: base('A', 'm'), B: base('B', 'f'), C: base('C', 'f') } };
    seedAttraction(state, 'B', 1);
    state.villa.push('C');
    seedAttraction(state, 'C', 1);
    for (const [a, b] of [['A', 'B'], ['B', 'A'], ['A', 'C'], ['C', 'A']]) {
      expect(attr(state, a, b)).toBeGreaterThanOrEqual(0);
      expect(attr(state, a, b)).toBeLessThanOrEqual(10);
      expect(gs.relationshipDimensions[`${a}→${b}`].attraction).toBe(attr(state, a, b));
    }
    expect(attr(state, 'A', 'B')).not.toBe(attr(state, 'B', 'A'));   // not bilateral
    expect(attr(state, 'B', 'C')).toBeNull();                          // incompatible
    nudgeAttraction(state, 'A', 'B', 50);
    expect(attr(state, 'A', 'B')).toBe(10);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run tests/pm-chemistry.test.js`
Expected: FAIL — `love` is not in `RELATIONSHIP_DIMENSIONS`, and the module is missing.

- [ ] **Step 3: Widen the shared store** — in `js/relationships.js`, replace the dimension list:

```js
export const RELATIONSHIP_DIMENSIONS = Object.freeze([
  'affection', 'trust', 'strategicRespect', 'fear',
  'obligation', 'resentment', 'attraction',
  // Having fallen for somebody, as against fancying them (Perfect Match,
  // spec §6.1). Grows slowly, never decays on its own. 0 for every other show.
  'love',
]);
```

and `defaultRelationshipDimensions`:

```js
  return { affection: bond, trust: bond, strategicRespect: 0, fear: 0,
    obligation: 0, resentment: Math.max(0, -bond), attraction: 0, love: 0 };
```

Run the existing relationship tests to prove nothing else moved:
`npx vitest run tests/ -t relationship` — expected: the same pass/fail as before this change.

- [ ] **Step 4: Implement** — `js/pm/chemistry.js`

```js
// ══════════════════════════════════════════════════════════════════════
// pm/chemistry.js — who fancies whom ("my type on paper")
// ══════════════════════════════════════════════════════════════════════
//
// Attraction lives in the SHARED relationship store (js/relationships.js),
// one record per direction — A fancying B says nothing about B fancying A.
// This file computes the spark on meeting and offers a small API over the
// store; it keeps no table of its own (ADDING-A-SHOW §11.5 Q, spec §6.1).
//
// `romanticallyCompatible` (js/attraction.js) gates everything: no attraction
// without compatibility, same rule the rest of the franchise uses.
import { romanticallyCompatible } from '../attraction.js';
import { streamFor } from '../dr/rng.js';
import { getRelationshipDimension, setRelationshipDimension, addRelationshipDimension }
  from '../relationships.js';
import { vibeScore, ickScore } from './profile.js';

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

export function typeFit(me, them) {
  const want = me.type?.looks || [];
  const looks = want.length ? want.filter(t => (them.looks || []).includes(t)).length / want.length : 0.5;
  const vibes = me.type?.vibes?.length
    ? me.type.vibes.reduce((a, v) => a + vibeScore(v, them.stats), 0) / me.type.vibes.length : 0.5;
  return 0.5 * looks + 0.5 * vibes;
}

export function ickHit(me, them) {
  return (me.icks || []).length ? Math.max(...me.icks.map(i => ickScore(i, them.stats))) : 0;
}

export function interestBonus(me, them) {
  const theirs = them.interests || [];
  const shared = (me.interests || []).filter(i => theirs.includes(i)).length;
  return shared * 0.06 + (me.bonusInterest && theirs.includes(me.bonusInterest) ? 0.15 : 0);
}

/** 0..10, or null when the two are not romantically compatible. */
export function attractionOf(me, them, rng) {
  if (!me || !them || me.name === them.name || !romanticallyCompatible(me, them)) return null;
  const spark = rng();
  // An ick only bites above the middle, so an ordinary islander is not a
  // little repellent to everybody.
  const ick = 0.6 * Math.max(0, ickHit(me, them) - 0.4);
  const raw = 0.45 * typeFit(me, them) + 0.35 * spark + interestBonus(me, them) - ick;
  return Math.round(clamp(raw * 10, 0, 10) * 100) / 100;
}

export function compatible(state, a, b) {
  const pa = state.profiles[a], pb = state.profiles[b];
  return !!pa && !!pb && a !== b && romanticallyCompatible(pa, pb);
}

/** Attraction both ways between `name` and everybody already in the villa. */
export function seedAttraction(state, name, seed) {
  for (const other of state.villa) {
    if (other === name) continue;
    for (const [a, b] of [[name, other], [other, name]]) {
      const v = attractionOf(state.profiles[a], state.profiles[b], streamFor(seed, `spark:${a}>${b}`));
      if (v != null) setRelationshipDimension(a, b, 'attraction', v);
    }
  }
}

/** A→B attraction, or null when the pair can never be romantic. */
export function attr(state, a, b) {
  return compatible(state, a, b) ? getRelationshipDimension(a, b, 'attraction') : null;
}

export function nudgeAttraction(state, a, b, d) {
  if (!compatible(state, a, b)) return;
  addRelationshipDimension(a, b, 'attraction', d);
}
```

- [ ] **Step 5: Run it to verify it passes**

Run: `npx vitest run tests/pm-chemistry.test.js`
Expected: PASS (5 tests).

- [ ] **Step 6: Commit**

```bash
git add js/relationships.js js/pm/chemistry.js tests/pm-chemistry.test.js
git commit -m "feat(perfect-match): attraction on the shared relationship store, plus a love dimension"
```

---

### Task 3b: Feels, shows, believes

**Files:**
- Create: `js/pm/feelings.js`
- Test: `tests/pm-feelings.test.js`

**Interfaces:**
- Consumes: `attr`, `compatible` (Task 3); `getRelationshipDimension`, `addRelationshipDimension` (`js/relationships.js`).
- Produces:
  - `romance(a, b) → 0..10` (= max(0.9 × attraction, 0.5 × attraction + 0.6 × love), the truth)
  - `friendship(a, b) → -10..10` (= affection)
  - `shown(state, a, b) → 0..10` (what A acts out; honest when unset)
  - `believed(state, viewer, a) → 0..10` (what `viewer` thinks A feels for `viewer`)
  - `setMask(state, a, b, value | null)`, `revealTruth(state, viewer, a)` (sets the belief to the truth)
  - `schemeEligible(profile) → boolean`
  - `growLove(state, couples)`, `updateBeliefs(state)`, `decideMasks(state, rng)`
  - `relationshipLabel(state, a, b) → [kind, text] | null`
  - state fields: `state.shows = { 'A→B': number }`, `state.believes = { 'V:A→V': number }`

- [ ] **Step 1: Write the failing test** — `tests/pm-feelings.test.js`

```js
import { beforeEach, describe, expect, it } from 'vitest';
import { setGs, setPlayers } from '../js/core.js';
import { setRelationshipDimension } from '../js/relationships.js';
import { streamFor } from '../js/dr/rng.js';
import { romance, shown, believed, setMask, revealTruth, schemeEligible, updateBeliefs,
  decideMasks, relationshipLabel, growLove } from '../js/pm/feelings.js';

const P = (name, gender, archetype, stats = {}) => ({ name, gender, sexuality: 'straight', archetype,
  stats: { physical: 5, endurance: 5, mental: 5, social: 5, strategic: 5, loyalty: 5, boldness: 5,
    intuition: 5, temperament: 5, ...stats } });
let state;
beforeEach(() => {
  const cast = [P('Heather', 'f', 'villain', { strategic: 8, loyalty: 3 }), P('Mike', 'm', 'underdog'),
    P('Gwen', 'f', 'loyal-soldier', { intuition: 9 }), P('Duncan', 'm', 'hothead')];
  setPlayers(cast);
  setGs({ bonds: {}, relationshipDimensions: {} });
  state = { villa: cast.map(p => p.name), profiles: Object.fromEntries(cast.map(p => [p.name, p])),
    couples: [['Heather', 'Mike'], ['Gwen', 'Duncan']], shows: {}, believes: {}, secrets: [] };
});
const feel = (a, b, att, aff = 0, love = 0) => {
  setRelationshipDimension(a, b, 'attraction', att); setRelationshipDimension(a, b, 'affection', aff);
  setRelationshipDimension(a, b, 'love', love);
};

describe('three layers, one direction at a time', () => {
  it('romance is not bilateral', () => {
    feel('Mike', 'Gwen', 9, 5); feel('Gwen', 'Mike', 0, 5);
    expect(romance('Mike', 'Gwen')).toBeGreaterThan(4);
    expect(romance('Gwen', 'Mike')).toBe(0);
  });
  it('shown is honest until masked; belief follows what is shown', () => {
    feel('Heather', 'Mike', 2, 1);
    expect(shown(state, 'Heather', 'Mike')).toBeCloseTo(romance('Heather', 'Mike'), 5);
    setMask(state, 'Heather', 'Mike', 8);
    for (let i = 0; i < 6; i++) updateBeliefs(state);
    expect(believed(state, 'Mike', 'Heather')).toBeGreaterThan(romance('Heather', 'Mike') + 2);
    revealTruth(state, 'Mike', 'Heather');
    expect(believed(state, 'Mike', 'Heather')).toBeCloseTo(romance('Heather', 'Mike'), 5);
  });
  it('an intuitive islander sees through more of a mask', () => {
    feel('Duncan', 'Gwen', 2, 5); setMask(state, 'Duncan', 'Gwen', 8);
    feel('Heather', 'Mike', 2, 1); setMask(state, 'Heather', 'Mike', 8);
    for (let i = 0; i < 6; i++) updateBeliefs(state);
    expect(believed(state, 'Gwen', 'Duncan')).toBeLessThan(believed(state, 'Mike', 'Heather'));
  });
});

describe('who may do what', () => {
  it('only scheme-eligible islanders ever fake; anybody may hide', () => {
    expect(schemeEligible(state.profiles.Heather)).toBe(true);
    expect(schemeEligible(state.profiles.Gwen)).toBe(false);
    feel('Gwen', 'Duncan', 1, 4); feel('Heather', 'Mike', 1, 1);
    feel('Gwen', 'Mike', 9, 3);          // a crush on somebody else's partner
    for (let s = 0; s < 20; s++) decideMasks(state, streamFor(s * 7919 + 13, 'mask'));
    expect(shown(state, 'Gwen', 'Duncan')).toBeLessThanOrEqual(romance('Gwen', 'Duncan') + 0.01);
    expect(shown(state, 'Gwen', 'Mike')).toBeLessThan(romance('Gwen', 'Mike'));
    expect(shown(state, 'Heather', 'Mike')).toBeGreaterThan(romance('Heather', 'Mike'));
  });
});

describe('labels', () => {
  it('reads the shapes the spec names', () => {
    feel('Heather', 'Mike', 1, 1); setMask(state, 'Heather', 'Mike', 8);
    expect(relationshipLabel(state, 'Heather', 'Mike')[1]).toBe('Faking it');
    feel('Mike', 'Gwen', 9, 5); setMask(state, 'Mike', 'Gwen', 1);
    expect(relationshipLabel(state, 'Mike', 'Gwen')[1]).toBe('Hidden crush');
    feel('Gwen', 'Mike', 0, 7);
    expect(relationshipLabel(state, 'Gwen', 'Mike')[1]).toBe('Friend-zoning');
    feel('Duncan', 'Heather', 9, -4);
    expect(relationshipLabel(state, 'Duncan', 'Heather')[1]).toBe("Fancies, can't stand");
  });
  it('love grows only where there is attraction to grow from', () => {
    feel('Gwen', 'Duncan', 8, 6); feel('Duncan', 'Gwen', 0, 6);
    for (let i = 0; i < 5; i++) growLove(state, state.couples);
    expect(romance('Gwen', 'Duncan')).toBeGreaterThan(romance('Duncan', 'Gwen'));
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run tests/pm-feelings.test.js`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement** — `js/pm/feelings.js`

```js
// ══════════════════════════════════════════════════════════════════════
// pm/feelings.js — what they feel, what they show, what the other believes
// ══════════════════════════════════════════════════════════════════════
//
// Spec §6.3. Three layers, one DIRECTION at a time:
//   Feels    — js/relationships.js (attraction, love, affection...), the truth
//   Shows    — state.shows["A→B"]: the romance A acts out toward B; absent = honest
//   Believes — state.believes["V:A→V"]: what V thinks A feels for V
// Every islander decision reads its own feelings and its beliefs — never the
// other person's truth (spec §7).
//
// Hiding is not scheming; faking and manipulating are (spec §6.5).
import { getRelationshipDimension, addRelationshipDimension } from '../relationships.js';
import { compatible } from './chemistry.js';

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const NICE = new Set(['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat']);
const VILLAIN = new Set(['villain', 'mastermind', 'schemer']);

/**
 * The romance bar. A crush is mostly spark, so attraction alone can carry it
 * (x0.9); falling for someone lifts it past what the spark gives on its own.
 */
export function romance(a, b) {
  const att = getRelationshipDimension(a, b, 'attraction'), love = getRelationshipDimension(a, b, 'love');
  return Math.round(clamp(Math.max(0.9 * att, 0.5 * att + 0.6 * love), 0, 10) * 100) / 100;
}
export const friendship = (a, b) => getRelationshipDimension(a, b, 'affection');

export function shown(state, a, b) {
  const m = state.shows?.[`${a}→${b}`];
  return m == null ? romance(a, b) : m;
}
export function setMask(state, a, b, value) {
  state.shows ||= {};
  if (value == null) delete state.shows[`${a}→${b}`];
  else state.shows[`${a}→${b}`] = clamp(value, 0, 10);
}

export function believed(state, viewer, a) {
  const v = state.believes?.[`${viewer}:${a}→${viewer}`];
  return v == null ? shown(state, a, viewer) : v;
}
export function revealTruth(state, viewer, a) {
  state.believes ||= {};
  state.believes[`${viewer}:${a}→${viewer}`] = romance(a, viewer);
}

/** The franchise's scheming gate (CLAUDE.md), unchanged. */
export function schemeEligible(p) {
  if (!p || NICE.has(p.archetype)) return false;
  if (VILLAIN.has(p.archetype)) return true;
  return (p.stats?.strategic ?? 5) >= 6 && (p.stats?.loyalty ?? 5) <= 4;
}

const partnerOf = (state, n) => {
  const c = state.couples.find(x => x.includes(n));
  return c ? (c[0] === n ? c[1] : c[0]) : null;
};

/** Love grows from time together, only where there is attraction, scaled by loyalty. */
export function growLove(state, couples) {
  for (const [a, b] of couples) {
    for (const [x, y] of [[a, b], [b, a]]) {
      const att = getRelationshipDimension(x, y, 'attraction');
      const aff = Math.max(0, friendship(x, y));
      const loy = state.profiles[x]?.stats?.loyalty ?? 5;
      addRelationshipDimension(x, y, 'love', 0.12 * (att / 10) * (1 + aff / 10) * (0.5 + loy / 10) * 4);
    }
  }
}

/**
 * Belief drifts toward what is shown, plus a leak of the truth: the viewer's
 * intuition sees through it, the actor's social skill covers it.
 */
export function updateBeliefs(state) {
  state.believes ||= {};
  for (const v of state.villa) for (const a of state.villa) {
    if (a === v || !compatible(state, a, v)) continue;
    const key = `${v}:${a}→${v}`;
    const truth = romance(a, v), show = shown(state, a, v);
    const see = ((state.profiles[v]?.stats?.intuition ?? 5) / 10) * (1 - 0.5 * (state.profiles[a]?.stats?.social ?? 5) / 10);
    const target = show + (truth - show) * see;
    const cur = state.believes[key] ?? show;
    state.believes[key] = Math.round((cur + (target - cur) * 0.35) * 100) / 100;
  }
}

/**
 * Each episode, each islander decides what to show. Proportional in every
 * term; the gate is the only yes/no, and it is the franchise's scheming rule.
 *   Hide  — any archetype: a crush on someone who is not their partner, while
 *           coupled (loyalty) or when the crush is a friend's partner.
 *   Fake  — scheme-eligible only: coupled, low real romance, a reason to stay.
 */
export function decideMasks(state, rng) {
  for (const a of state.villa) {
    const prof = state.profiles[a], s = prof.stats, mine = partnerOf(state, a);
    for (const b of state.villa) {
      if (a === b || !compatible(state, a, b)) continue;
      const truth = romance(a, b);
      if (b !== mine) {
        const theirs = partnerOf(state, b);
        const friendsPartner = theirs && friendship(a, theirs) > 3;
        const masked = state.shows?.[`${a}→${b}`];
        const reason = (mine ? s.loyalty / 10 : 0) + (friendsPartner ? 0.5 : 0);
        // A hidden crush, once hidden, stays hidden while the reason stands;
        // it comes out on its own only when the reason goes (single again,
        // the friend's couple over).
        if (!reason) { if (masked != null && masked < truth) setMask(state, a, b, null); }
        else if (masked != null && masked < truth) setMask(state, a, b, truth * (1 - s.loyalty / 12));
        else if (truth >= 3 && rng() < truth / 10 * reason) setMask(state, a, b, truth * (1 - s.loyalty / 12));
      } else if (schemeEligible(prof)) {
        const reason = ['win', 'money', 'fame'].includes(prof.intent) ? 0.4 : 0.2;
        const fakeP = (1 - truth / 10) * (s.strategic / 10) * (reason + 0.3);
        if (truth < 5 && rng() < fakeP) setMask(state, a, b, Math.min(10, truth + 3 + s.social / 3));
      }
    }
  }
}

/** Narration label for A's side of the pair (spec §6.4). Thresholds are allowed: this is text. */
export function relationshipLabel(state, a, b) {
  const me = romance(a, b), them = romance(b, a), show = shown(state, a, b), fr = friendship(a, b);
  const coupled = state.couples.some(c => c.includes(a) && c.includes(b));
  if (show - me >= 4 && me <= 3) return ['fake', 'Faking it'];
  if (coupled) {
    if (me >= 7 && them >= 7) return ['love', 'Head over heels'];
    if (me >= 6 && them <= 3) return ['alone', 'All in — alone'];
    if (me <= 3 && them >= 6) return ['surv', 'Not feeling it'];
    if (me <= 3 && them <= 3) return ['surv', 'Couple for survival'];
    return ['love', 'Coupled'];
  }
  if (me >= 6 && show <= 2) return ['hidden', 'Hidden crush'];
  if (me >= 6 && fr <= -2) return ['mixed', "Fancies, can't stand"];
  if (me >= 6 && them >= 6) return ['crush', 'Mutual spark'];
  if (me >= 5) return ['crush', 'One-way crush'];
  if (me <= 1 && fr >= 5 && them >= 6) return ['zone', 'Friend-zoning'];
  if (fr <= -5) return ['rival', "Can't stand"];
  if (fr >= 6 && me <= 1) return ['friend', 'Just friends'];
  return null;
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npx vitest run tests/pm-feelings.test.js`
Expected: PASS (7 tests). If "an intuitive islander sees through more" fails, check `see`: Gwen's intuition is 9 and Mike's is 5, with the same mask and truth on both sides.

- [ ] **Step 5: Commit**

```bash
git add js/pm/feelings.js tests/pm-feelings.test.js
git commit -m "feat(perfect-match): feels, shows and believes, one direction at a time"
```

---

### Task 4: The popularity ledgers

**Files:**
- Create: `js/pm/ledger.js`
- Test: `tests/pm-ledger.test.js`

**Interfaces:**
- Produces: `CAP=12, FIRST_CAP=24, MAJOR_CAP=35, FIRST_WINDOW=3, POP_SCALE=2`, `LABEL_ORDER`, `createLedger()`, `noteArrival(L, name, ep)`, `recordAired(L, { who, approval, fame, major })`, `nudgeBelief(L, a, b, d)`, `beliefOf(L, a, b)`, `capFor(L, name, ep)`, `closeEpisode(L, ep, popularity?) → { [name]: { approval, applied, label, fame } }`, `labelFor(approval)`, `readApproval(L, name)`, `coupleScore(L, a, b)`, `followers(L, name)`, `ledgerSnapshot(L) → { approval, fame, label }`.

- [ ] **Step 1: Write the failing test** — `tests/pm-ledger.test.js`

```js
import { describe, expect, it } from 'vitest';
import { createLedger, noteArrival, recordAired, closeEpisode, coupleScore, followers,
  labelFor, nudgeBelief, readApproval, CAP, FIRST_CAP, MAJOR_CAP } from '../js/pm/ledger.js';

const settled = () => {           // an islander past the first-impression window
  const L = createLedger();
  noteArrival(L, 'A', 1);
  for (let ep = 1; ep <= 3; ep++) closeEpisode(L, ep);
  return L;
};

describe('per-episode caps', () => {
  it('holds an ordinary episode to the cap', () => {
    const L = settled();
    recordAired(L, { who: 'A', approval: 80 });
    expect(closeEpisode(L, 4).A.applied).toBe(CAP);
  });
  it('doubles it in the first-impression window', () => {
    const L = createLedger(); noteArrival(L, 'A', 1);
    recordAired(L, { who: 'A', approval: 80 });
    expect(closeEpisode(L, 1).A.applied).toBe(FIRST_CAP);
  });
  it('lifts it for a major moment', () => {
    const L = settled();
    recordAired(L, { who: 'A', approval: -90, major: true });
    expect(closeEpisode(L, 4).A.applied).toBe(-MAJOR_CAP);
  });
  it('writes gs.popularity at the show scale', () => {
    const L = settled(); const pop = {};
    recordAired(L, { who: 'A', approval: 4 });
    const { applied } = closeEpisode(L, 4, pop).A;   // 0.75 * 4 = 3
    expect(applied).toBe(3);
    expect(pop.A).toBe(6);
  });
});

describe('labels hold for two episodes before they change', () => {
  it('does not flip on one episode', () => {
    const L = settled();
    L.approval.A = 30; L.label.A = 'loved';
    recordAired(L, { who: 'A', approval: -40 });  // capped at -12 → 18: liked
    expect(closeEpisode(L, 4).A.label).toBe('loved');
    expect(closeEpisode(L, 5).A.label).toBe('liked');
  });
  it('never moves more than two tiers at once without a major moment', () => {
    const L = settled();
    L.approval.A = 30; L.label.A = 'loved'; L.pending.A = 'disliked';
    L.approval.A = -30;                             // held in "disliked" for the second close
    expect(closeEpisode(L, 4).A.label).toBe('invisible');   // loved → invisible, two tiers
  });
  it('a major moment moves the label at once, however far', () => {
    const L = settled();
    L.approval.A = 30; L.label.A = 'loved';
    L.approval.A = 0;
    recordAired(L, { who: 'A', approval: -90, major: true });   // -35 → -35: disliked
    expect(closeEpisode(L, 4).A.label).toBe('disliked');
  });
  it('bands match the spec', () => {
    expect(labelFor(60)).toBe('fan-favourite');
    expect(labelFor(0)).toBe('invisible');
    expect(labelFor(-61)).toBe('villain');
  });
});

describe('a star carries a hated partner', () => {
  it('+70 and -50 score +28 before belief', () => {
    const L = createLedger(); L.approval.A = 70; L.approval.B = -50;
    expect(coupleScore(L, 'A', 'B')).toBeCloseTo(28, 5);
    nudgeBelief(L, 'A', 'B', 5);
    expect(coupleScore(L, 'B', 'A')).toBeCloseTo(33, 5);
  });
});

describe('followers come from fame, scaled by approval', () => {
  it('a heavily aired villain out-gains a quiet favourite; equal airtime favours the loved', () => {
    const L = createLedger();
    L.fame = { villain: 100, quiet: 20, star: 100 };
    L.approval = { villain: -80, quiet: 60, star: 80 };
    expect(followers(L, 'villain')).toBeGreaterThan(followers(L, 'quiet'));
    expect(followers(L, 'star')).toBeGreaterThan(followers(L, 'villain'));
    expect(readApproval(L, 'nobody')).toBe(0);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run tests/pm-ledger.test.js`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement** — `js/pm/ledger.js`

```js
// ══════════════════════════════════════════════════════════════════════
// pm/ledger.js — what the public thinks, from what aired
// ══════════════════════════════════════════════════════════════════════
//
// Two ledgers, the Traitors pattern (js/tr/crowd.js, ADDING-A-SHOW §14.8):
//   approval  -100..+100  — decides votes
//   fame      >= 0, never falls — screen time, any tone
// Followers are DERIVED (fame scaled by approval), not a third ledger.
//
// ONLY AIRED EVENTS WRITE HERE (spec §8). And the rule this show owns: the
// public vote and a bombshell's arrival read these; NO islander decision may.
// tests/pm-ledger-readers.test.js enforces it over the source.

export const CAP = 12;
export const FIRST_CAP = 24;
export const MAJOR_CAP = 35;
export const FIRST_WINDOW = 3;
// This show is sold on the vote: a scene moves gs.popularity twice as far as
// the same scene on Total Drama.
export const POP_SCALE = 2;
export const LABEL_ORDER = ['villain', 'disliked', 'divisive', 'invisible', 'liked', 'loved',
  'fan-favourite'];
const BANDS = [[60, 'fan-favourite'], [25, 'loved'], [5, 'liked'], [-5, 'invisible'],
  [-25, 'divisive'], [-60, 'disliked']];

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const pairKey = (a, b) => [a, b].sort().join('|');

export function labelFor(a) {
  for (const [floor, label] of BANDS) if (a >= floor) return label;
  return 'villain';
}

export function createLedger() {
  return { approval: {}, fame: {}, raw: {}, fameRaw: {}, major: {}, lastApplied: {},
    firstEp: {}, label: {}, pending: {}, belief: {} };
}

export function noteArrival(L, name, ep) {
  if (L.firstEp[name] != null) return;
  L.firstEp[name] = ep;
  L.approval[name] = 0;
  L.fame[name] = 0;
  L.label[name] = 'invisible';
}

export function recordAired(L, { who, approval = 0, fame = 0, major = false }) {
  if (!who || L.firstEp[who] == null) return;
  L.raw[who] = (L.raw[who] || 0) + approval;
  L.fameRaw[who] = (L.fameRaw[who] || 0) + Math.max(0, fame);
  if (major) L.major[who] = true;
}

export function nudgeBelief(L, a, b, d) {
  const k = pairKey(a, b);
  L.belief[k] = clamp((L.belief[k] || 0) + d, -30, 30);
}
export function beliefOf(L, a, b) { return L.belief[pairKey(a, b)] || 0; }

export function capFor(L, name, ep) {
  if (L.major[name]) return MAJOR_CAP;
  return (ep - L.firstEp[name]) < FIRST_WINDOW ? FIRST_CAP : CAP;
}

/** Move a label toward a band by at most `max` tiers. */
function stepToward(cur, band, max) {
  const from = LABEL_ORDER.indexOf(cur), to = LABEL_ORDER.indexOf(band);
  const step = Math.max(-max, Math.min(max, to - from));
  return LABEL_ORDER[from + step];
}

/**
 * Apply this episode. Inertia: a quarter of last episode's movement carries,
 * so one good night after a bad run does not erase the run. A label changes
 * only when the new band has held for two closes, and then by at most two
 * tiers — unless this episode held a major moment for them, which moves it
 * at once (spec §8: "unless you do something really major").
 */
export function closeEpisode(L, ep, popularity = null) {
  const out = {};
  for (const name of Object.keys(L.firstEp)) {
    const wasMajor = !!L.major[name];
    const cap = capFor(L, name, ep);
    const raw = L.raw[name] || 0;
    const applied = Math.round(clamp(0.75 * raw + 0.25 * (L.lastApplied[name] || 0), -cap, cap) * 100) / 100;
    L.approval[name] = clamp((L.approval[name] || 0) + applied, -100, 100);
    L.lastApplied[name] = applied;
    L.fame[name] = (L.fame[name] || 0) + (L.fameRaw[name] || 0);
    if (popularity && applied) popularity[name] = (popularity[name] || 0) + applied * POP_SCALE;
    const band = labelFor(L.approval[name]);
    if (band === L.label[name]) L.pending[name] = null;
    else if (wasMajor) { L.label[name] = band; L.pending[name] = null; }
    else if (L.pending[name] === band) { L.label[name] = stepToward(L.label[name], band, 2); L.pending[name] = null; }
    else L.pending[name] = band;
    out[name] = { approval: L.approval[name], applied, label: L.label[name], fame: L.fame[name] };
  }
  L.raw = {}; L.fameRaw = {}; L.major = {};
  return out;
}

export function readApproval(L, name) { return L.approval[name] || 0; }

/** One star carries a hated partner; belief can still sink the couple. */
export function coupleScore(L, a, b) {
  const x = readApproval(L, a), y = readApproval(L, b);
  return 0.65 * Math.max(x, y) + 0.35 * Math.min(x, y) + beliefOf(L, a, b);
}

/** fame x (1 + 0.6 x approval/100): x0.4 hated to x1.6 adored. */
export function followers(L, name) {
  return Math.round((L.fame[name] || 0) * (1 + 0.6 * readApproval(L, name) / 100) * 1000);
}

export function ledgerSnapshot(L) {
  return { approval: { ...L.approval }, fame: { ...L.fame }, label: { ...L.label } };
}
```

Fix the popularity test to state its arithmetic plainly — replace its body with:

```js
    const L = settled(); const pop = {};
    recordAired(L, { who: 'A', approval: 4 });
    const { applied } = closeEpisode(L, 4, pop).A;   // 0.75 * 4 = 3
    expect(applied).toBe(3);
    expect(pop.A).toBe(6);
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npx vitest run tests/pm-ledger.test.js`
Expected: PASS (10 tests).

- [ ] **Step 5: Commit**

```bash
git add js/pm/ledger.js tests/pm-ledger.test.js
git commit -m "feat(perfect-match): approval and fame ledgers with caps, labels and carry"
```

---

### Task 5: The villa's events

**Files:**
- Create: `js/pm/events.js`
- Test: `tests/pm-events.test.js`
- Create: `tests/helpers/pm-cast.js`

**Interfaces:**
- Consumes: `addBond`, `getBond` (`js/bonds.js`); `attr`, `nudgeAttraction`, `ickHit` (Task 3); `recordAired`, `nudgeBelief` (Task 4).
- Produces:
  - `PHASE_BUDGETS = { morning: 12, day: 40, event: 18, evening: 23 }`, `HUT_RATE = 0.25`, `KINDS`
  - `partnerOf(state, name)`, `roomMates(state, name)`
  - `makeEvent(state, rng, { phase, kind, players, extra, aired, major }) → Event`
  - `generateEpisodeEvents(state, rng, budgets?) → Event[]`
  - `airLater(state, ev)` (air a hidden event now, as a major moment)
  - `Event = { id, ep, phase, kind, players, tpl, aired, major: string[], hut: {who, stance, tpl}|null, pop: {[name]: {approval, fame}} }`
  - `state.secrets[] = { id, who, partner, with, severity, ep, witnesses, known, eventId, casa }`
- The helper produces `makeIslanders(n, seed) → Player[]` and `roleSetup(names) → {[name]: {role}}`.

- [ ] **Step 1: Write the cast helper** — `tests/helpers/pm-cast.js`

```js
// Deterministic synthetic casts for Perfect Match tests. Alternating f/m,
// straight, varied stats, archetypes drawn from the real fifteen.
import { rngFor } from '../../js/dr/rng.js';

const ARCH = ['mastermind', 'schemer', 'hothead', 'challenge-beast', 'social-butterfly',
  'loyal-soldier', 'wildcard', 'chaos-agent', 'floater', 'underdog', 'hero', 'villain',
  'goat', 'perceptive-player', 'showmancer'];
const KEYS = ['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty', 'boldness',
  'intuition', 'temperament'];

export function makeIslanders(n = 22, seed = 7) {
  const rng = rngFor(seed * 7919 + 13);
  return Array.from({ length: n }, (_, i) => ({
    name: `Isl${String(i + 1).padStart(2, '0')}`,
    gender: i % 2 === 0 ? 'f' : 'm',
    sexuality: 'straight',
    archetype: ARCH[Math.floor(rng() * ARCH.length)],
    stats: Object.fromEntries(KEYS.map(k => [k, 1 + Math.floor(rng() * 10)])),
  }));
}

/** First 10 start, next 6 are bombshells, the rest arrive with Casa Amor. */
export function roleSetup(names) {
  return Object.fromEntries(names.map((n, i) => [n, { role: i < 10 ? 'starter' : i < 16 ? 'bombshell' : 'casa' }]));
}
```

- [ ] **Step 2: Write the failing test** — `tests/pm-events.test.js`

```js
import { beforeEach, describe, expect, it } from 'vitest';
import { setGs, setPlayers } from '../js/core.js';
import { getBond } from '../js/bonds.js';
import { streamFor } from '../js/dr/rng.js';
import { resolveIslander } from '../js/pm/profile.js';
import { seedAttraction } from '../js/pm/chemistry.js';
import { createLedger, noteArrival } from '../js/pm/ledger.js';
import { generateEpisodeEvents, makeEvent, partnerOf, airLater, PHASE_BUDGETS, KINDS }
  from '../js/pm/events.js';
import { makeIslanders } from './helpers/pm-cast.js';

function villa(n = 10) {
  const cast = makeIslanders(n, 3);
  setPlayers(cast);
  setGs({ bonds: {}, perceivedBonds: {}, activePlayers: cast.map(p => p.name) });
  const state = { ep: 2, villa: [], casa: [], split: false, couples: [], profiles: {},
    attraction: {}, ledger: createLedger(), secrets: [], seq: 0 };
  for (const p of cast) {
    state.profiles[p.name] = resolveIslander(p, {}, streamFor(1, `profile:${p.name}`));
    state.villa.push(p.name); noteArrival(state.ledger, p.name, 1); seedAttraction(state, p.name, 1);
  }
  for (let i = 0; i + 1 < n; i += 2) state.couples.push([cast[i].name, cast[i + 1].name]);
  return state;
}

describe('an episode of villa events', () => {
  let state;
  beforeEach(() => { state = villa(); });

  it('fills about a hundred events across the four phases', () => {
    const evs = generateEpisodeEvents(state, streamFor(1, 'ep:2'));
    const total = Object.values(PHASE_BUDGETS).reduce((a, b) => a + b, 0);
    expect(evs.length).toBeGreaterThanOrEqual(total * 0.9);
    expect(new Set(evs.map(e => e.phase))).toEqual(new Set(['morning', 'day', 'event', 'evening']));
  });

  it('every event is a known kind, names real islanders and keeps names out of the template', () => {
    for (const ev of generateEpisodeEvents(state, streamFor(2, 'ep:2'))) {
      expect(KINDS[ev.kind]).toBeTruthy();
      expect(ev.players.every(n => state.villa.includes(n))).toBe(true);
      for (const n of state.villa) expect(ev.tpl.includes(n)).toBe(false);
    }
  });

  it('about a quarter of events carry a beach-hut cutaway', () => {
    const evs = generateEpisodeEvents(state, streamFor(3, 'ep:2'));
    const huts = evs.filter(e => e.hut).length / evs.length;
    expect(huts).toBeGreaterThan(0.15);
    expect(huts).toBeLessThan(0.35);
  });

  it('only aired events write the public ledger', () => {
    const hidden = makeEvent(state, streamFor(4, 'x'), { phase: 'day', kind: 'comedy',
      players: [state.villa[0]], aired: false });
    expect(state.ledger.raw[state.villa[0]] || 0).toBe(0);
    airLater(state, hidden);
    expect(state.ledger.raw[state.villa[0]]).toBeGreaterThan(0);
    expect(state.ledger.major[state.villa[0]]).toBe(true);
  });

  it('a couple chat raises the bond and a pull on a coupled islander leaves a secret', () => {
    const [a, b] = state.couples[0];
    const before = getBond(a, b);
    makeEvent(state, streamFor(5, 'x'), { phase: 'day', kind: 'chat', players: [a, b] });
    expect(getBond(a, b)).toBeGreaterThan(before);
    const [c] = state.couples[1];
    makeEvent(state, streamFor(6, 'x'), { phase: 'day', kind: 'pull', players: [a, c] });
    expect(state.secrets.some(s => s.who === a && s.partner === partnerOf(state, a))).toBe(true);
  });
});
```

- [ ] **Step 3: Run it to verify it fails**

Run: `npx vitest run tests/pm-events.test.js`
Expected: FAIL — module not found.

- [ ] **Step 4: Implement** — `js/pm/events.js`

```js
// ══════════════════════════════════════════════════════════════════════
// pm/events.js — the hundred things that happen in a villa day
// ══════════════════════════════════════════════════════════════════════
//
// Every event has a CONSEQUENCE (bond, attraction, a secret, belief) — there
// are no cosmetic events. Whether an event AIRED is decided here, by how much
// television it is; only aired events write the public ledger (spec §8).
// The reader sees every event; unaired ones carry `aired: false`.
//
// Templates carry {a}/{b}/{c}; names are filled at render time, never here.
// Plan 1 ships two lines per kind. The prose pools are Plan 3.
import { addBond, getBond } from '../bonds.js';
import { attr, nudgeAttraction, ickHit } from './chemistry.js';
import { recordAired, nudgeBelief } from './ledger.js';

export const PHASE_BUDGETS = { morning: 12, day: 40, event: 18, evening: 23 };
export const HUT_RATE = 0.25;

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const pick = (rng, arr) => (arr.length ? arr[Math.floor(rng() * arr.length)] : null);
function weighted(rng, entries) {
  const live = entries.filter(([, w]) => w > 0);
  let r = rng() * live.reduce((s, [, w]) => s + w, 0);
  for (const [v, w] of live) { r -= w; if (r <= 0) return v; }
  return live.length ? live[live.length - 1][0] : null;
}
const S = (state, n) => state.profiles[n].stats;

export function partnerOf(state, name) {
  const c = state.couples.find(x => x.includes(name));
  return c ? (c[0] === name ? c[1] : c[0]) : null;
}
const inCasa = (state, n) => state.split && state.casa.includes(n);
export function roomMates(state, name) {
  const here = inCasa(state, name);
  return state.villa.filter(n => n !== name && inCasa(state, n) === here);
}
const couplesInRoom = state => state.couples.filter(([a, b]) => inCasa(state, a) === inCasa(state, b));
const compatibleMates = (state, a) => roomMates(state, a).filter(b => attr(state, a, b) != null);
const openSecret = (state, n) => state.secrets.some(s => !s.known && (s.who === n || s.partner === n));

// ── the kinds ─────────────────────────────────────────────────────────
// cast(state, rng) → { players, kind? } | null. apply(state, ev, rng) → { pop, major }.
const pop1 = (who, approval, fame) => ({ [who]: { approval, fame } });

export const KINDS = {
  chat: {
    salience: 0.25,
    tpl: ['{a} and {b} talk on the daybeds about home.', '{a} and {b} have a quiet chat by the pool.'],
    cast: (s, rng) => pick(rng, couplesInRoom(s)),
    apply: (s, ev) => {
      const [a, b] = ev.players;
      addBond(a, b, 0.2 + 0.03 * ((S(s, a).loyalty + S(s, b).loyalty) / 2));
      return { pop: { ...pop1(a, 0.3, 1), ...pop1(b, 0.3, 1) } };
    },
  },
  'deep-chat': {
    salience: 0.45,
    tpl: ['{a} opens up to {b} about the last time {a} got hurt.', '{a} tells {b} this feels different.'],
    cast: (s, rng) => pick(rng, couplesInRoom(s).filter(([a, b]) =>
      ['love', 'settle-down', 'first-love'].includes(s.profiles[a].intent) || getBond(a, b) > 2)),
    apply: (s, ev) => {
      const [a, b] = ev.players;
      addBond(a, b, 0.5);
      return { pop: { ...pop1(a, 0.6, 1.2), ...pop1(b, 0.6, 1.2) } };
    },
  },
  kiss: {
    salience: 0.55,
    tpl: ['{a} and {b} kiss on the terrace.', '{b} pulls {a} in for a kiss under the fairy lights.'],
    cast: (s, rng) => pick(rng, couplesInRoom(s)),
    apply: (s, ev) => {
      const [a, b] = ev.players;
      addBond(a, b, 0.3); nudgeAttraction(s, a, b, 0.2); nudgeAttraction(s, b, a, 0.2);
      if (ev.aired) nudgeBelief(s.ledger, a, b, 2);
      return { pop: { ...pop1(a, 0.4, 1), ...pop1(b, 0.4, 1) } };
    },
  },
  pull: {
    salience: 0.6,
    tpl: ['{a} pulls {b} for a chat.', '"Can I borrow you?" {a} asks {b}.'],
    cast: (s, rng) => {
      const a = weighted(rng, s.villa.filter(n => compatibleMates(s, n).length)
        .map(n => [n, S(s, n).boldness]));
      if (!a) return null;
      const b = weighted(rng, compatibleMates(s, a).filter(n => n !== partnerOf(s, a))
        .map(n => [n, attr(s, a, n)]));
      if (!b) return null;
      // A coupled islander can turn the pull down: that is a loyalty moment.
      const pb = partnerOf(s, b);
      if (pb && rng() < (S(s, b).loyalty / 10) * ((getBond(b, pb) + 10) / 20)) {
        return { players: [b, a], kind: 'loyalty' };
      }
      return { players: [a, b] };
    },
    apply: (s, ev, rng) => {
      const [a, b] = ev.players;
      nudgeAttraction(s, b, a, 0.3 * S(s, a).social / 10);
      nudgeAttraction(s, a, b, 0.1);
      addBond(a, b, 0.3);
      for (const [x, y, sev] of [[a, b, 1], [b, a, 0.7]]) {
        const p = partnerOf(s, x);
        if (!p || p === y) continue;
        const witnesses = roomMates(s, x).filter(n => n !== y && n !== p)
          .filter(() => rng() < 0.25);
        s.secrets.push({ id: `sec${s.secrets.length + 1}`, who: x, partner: p, with: y,
          severity: sev, ep: s.ep, witnesses, known: false, eventId: ev.id, casa: s.split });
        if (ev.aired) nudgeBelief(s.ledger, x, p, -3);
      }
      return { pop: { ...pop1(a, partnerOf(s, a) ? -0.8 : 0.2, 1.5),
        ...pop1(b, partnerOf(s, b) ? -0.4 : 0.1, 1) } };
    },
  },
  loyalty: {
    salience: 0.6,
    tpl: ['{a} turns {b} down: "I\'m happy where I am."', '{a} tells {b} straight that nothing is happening.'],
    cast: () => null,   // only ever reached through a rebuffed pull
    apply: (s, ev) => {
      const [a, b] = ev.players;
      const p = partnerOf(s, a);
      if (p) { addBond(a, p, 0.5); if (ev.aired) nudgeBelief(s.ledger, a, p, 4); }
      return { pop: { ...pop1(a, 1.2, 1), ...pop1(b, -0.2, 0.8) } };
    },
  },
  argument: {
    salience: 0.85,
    tpl: ['{a} and {b} row on the terrace.', '{a} snaps at {b} in front of the whole villa.'],
    cast: (s, rng) => {
      const a = weighted(rng, s.villa.map(n => [n, (10 - S(s, n).temperament) + S(s, n).boldness / 2]));
      if (!a) return null;
      const p = partnerOf(s, a);
      const mates = roomMates(s, a);
      const b = p && mates.includes(p) && rng() < 0.7 ? p
        : mates.slice().sort((x, y) => getBond(a, x) - getBond(a, y))[0];
      return b ? { players: [a, b] } : null;
    },
    apply: (s, ev) => {
      const [a, b] = ev.players;
      addBond(a, b, -0.6 - 0.04 * (10 - S(s, a).temperament));
      if (ev.aired && partnerOf(s, a) === b) nudgeBelief(s.ledger, a, b, -2);
      return { pop: { ...pop1(a, -1.0, 2), ...pop1(b, 0.3, 1.5) } };
    },
  },
  friendship: {
    salience: 0.2,
    tpl: ['{a} and {b} make breakfast together.', '{a} and {b} are thick as thieves on the lilos.'],
    cast: (s, rng) => {
      const a = pick(rng, s.villa);
      const b = a && pick(rng, roomMates(s, a).filter(n => n !== partnerOf(s, a)));
      return b ? { players: [a, b] } : null;
    },
    apply: (s, ev) => {
      const [a, b] = ev.players;
      addBond(a, b, 0.4);
      return { pop: { ...pop1(a, 0.2, 0.5), ...pop1(b, 0.2, 0.5) } };
    },
  },
  gossip: {
    salience: 0.8,
    tpl: ['{a} tells {b} what {c} did.', '{a} sits {b} down: "You need to know something about {c}."'],
    cast: (s, rng) => {
      const options = [];
      for (const sec of s.secrets.filter(x => !x.known)) {
        for (const w of sec.witnesses) {
          if (!s.villa.includes(w) || !roomMates(s, w).includes(sec.partner)) continue;
          options.push([{ players: [w, sec.partner, sec.who], secret: sec.id },
            Math.max(0.1, getBond(w, sec.partner) - getBond(w, sec.who) + 1)]);
        }
      }
      return weighted(rng, options);
    },
    apply: (s, ev) => {
      const [w, p, x] = ev.players;
      const sec = s.secrets.find(z => z.id === ev.extra.secret);
      if (sec) sec.known = true;
      const sev = sec?.severity || 1;
      addBond(x, p, -1.5 * sev); nudgeAttraction(s, p, x, -1.0 * sev); addBond(w, x, -0.5);
      if (ev.aired && partnerOf(s, p) === x) nudgeBelief(s.ledger, x, p, -6);
      return { pop: { ...pop1(w, 0.3, 1.5), ...pop1(p, 1.5, 2), ...pop1(x, -2, 2) }, major: [p, x] };
    },
  },
  comedy: {
    salience: 0.7,
    tpl: ['{a} does an impression of the whole villa at breakfast.', '{a} narrates the lads\' workout like a nature documentary.'],
    cast: (s, rng) => {
      const a = weighted(rng, s.villa.map(n => [n, Math.max(0, S(s, n).social + S(s, n).temperament - 9)]));
      return a ? { players: [a] } : null;
    },
    apply: (s, ev, rng) => {
      const [a] = ev.players;
      const b = pick(rng, roomMates(s, a));
      if (b) addBond(a, b, 0.2);
      return { pop: pop1(a, 1.0, 2) };
    },
  },
  ick: {
    salience: 0.7,
    tpl: ['{a} gets the ick when {b} does that laugh again.', '{a} tells the girls {b} has given {a} the ick.'],
    cast: (s, rng) => {
      const opts = couplesInRoom(s).flatMap(([a, b]) => [[[a, b], ickHit(s.profiles[a], s.profiles[b])],
        [[b, a], ickHit(s.profiles[b], s.profiles[a])]]);
      const pair = weighted(rng, opts.map(([p, w]) => [p, Math.max(0, w - 0.3)]));
      return pair ? { players: pair } : null;
    },
    apply: (s, ev) => {
      const [a, b] = ev.players;
      nudgeAttraction(s, a, b, -1.0); addBond(a, b, -0.3);
      return { pop: { ...pop1(a, 0.2, 1.5), ...pop1(b, 0, 0.5) } };
    },
  },
  'challenge-kiss': {
    salience: 0.8,
    tpl: ['In the challenge, {a} picks {b} to kiss.', '{a} kisses {b} for the points, and the villa screams.'],
    cast: (s, rng) => {
      const a = pick(rng, s.villa.filter(n => compatibleMates(s, n).length));
      const b = a && weighted(rng, compatibleMates(s, a).filter(n => n !== partnerOf(s, a))
        .map(n => [n, attr(s, a, n)]));
      return b ? { players: [a, b] } : null;
    },
    apply: (s, ev) => {
      const [a, b] = ev.players;
      nudgeAttraction(s, b, a, 0.3);
      const p = partnerOf(s, a);
      if (p) addBond(a, p, -0.4 * (1 - S(s, p).temperament / 10));
      return { pop: { ...pop1(a, -0.2, 2), ...pop1(b, 0, 1.5) } };
    },
  },
  'challenge-win': {
    salience: 0.35,
    tpl: ['{a} and {b} win the challenge.', '{a} and {b} take the points and a night in the hideaway.'],
    cast: (s, rng) => pick(rng, couplesInRoom(s)),
    apply: (s, ev) => {
      const [a, b] = ev.players;
      addBond(a, b, 0.2);
      return { pop: { ...pop1(a, 0.3, 1), ...pop1(b, 0.3, 1) } };
    },
  },
  // MOMENT KINDS: their effects are done by the caller (moments.js /
  // arrivals.js / casa.js), which hands the ledger writes in `extra.pop`.
  ...Object.fromEntries(['entrance', 'date', 'steal', 'recouple-pick', 'dump-buildup',
    'dump-verdict', 'ballot-reveal', 'dump-reaction', 'dump-goodbye', 'dump-fallout',
    'casa-return', 'photos', 'declaration', 'final-result', 'envelope', 'walk', 'reveal']
    .map(k => [k, { salience: 1, tpl: [`{a} — ${k}.`], cast: () => null,
      apply: (s, ev) => ({ pop: ev.extra.pop || {}, major: ev.extra.majorPop || [] }) }])),
};

const PHASE_KINDS = {
  morning: [['chat', 4], ['kiss', 2], ['friendship', 3], ['comedy', 1], ['ick', 0.5], ['argument', 0.5]],
  day: [['chat', 3], ['deep-chat', 2], ['pull', 3], ['friendship', 3], ['gossip', 1.5],
    ['comedy', 1.5], ['argument', 1], ['ick', 0.8]],
  event: [['challenge-kiss', 3], ['challenge-win', 1], ['comedy', 1], ['argument', 0.5]],
  evening: [['kiss', 3], ['deep-chat', 2], ['pull', 2], ['argument', 1.5], ['gossip', 1.5], ['friendship', 1]],
};

const HUT_TPL = {
  honest: ['{a}, in the beach hut: "I know what I want."', '{a}, in the beach hut: "I\'m actually really happy."'],
  'two-faced': ['{a}, in the beach hut: "I\'m keeping my options open."', '{a}, in the beach hut: "What they don\'t know won\'t hurt them."'],
};

/** Create one event: decide airing, apply it, attach a hut cutaway, write the ledger. */
export function makeEvent(state, rng, { phase, kind, players, extra = {}, aired = null, major = [] }) {
  const def = KINDS[kind];
  state.seq = (state.seq || 0) + 1;
  const heat = players.some(n => openSecret(state, n)) ? 0.1 : 0;
  const airP = clamp(0.2 + 0.6 * def.salience + heat, 0.1, 0.95);
  const ev = { id: `${state.ep}-${state.seq}`, ep: state.ep, phase, kind, players: [...players],
    tpl: pick(rng, def.tpl), aired: aired == null ? rng() < airP : !!aired, major: [...major],
    hut: null, pop: {}, extra };
  const res = def.apply(state, ev, rng) || {};
  ev.pop = res.pop || {};
  for (const n of res.major || []) if (!ev.major.includes(n)) ev.major.push(n);
  if (players.length && rng() < HUT_RATE) {
    const who = pick(rng, players);
    const stance = state.secrets.some(x => !x.known && x.who === who) ? 'two-faced' : 'honest';
    ev.hut = { who, stance, tpl: pick(rng, HUT_TPL[stance]) };
    const p = (ev.pop[who] ||= { approval: 0, fame: 0 });
    if (stance === 'two-faced') { p.approval -= 0.5; p.fame += 0.5; } else p.fame += 0.3;
  }
  if (ev.aired) writeLedger(state, ev, false);
  return ev;
}

function writeLedger(state, ev, late) {
  for (const [who, p] of Object.entries(ev.pop)) {
    recordAired(state.ledger, { who, approval: p.approval || 0, fame: p.fame || 0,
      major: late || ev.major.includes(who) });
  }
}

/** A hidden event airs now (Movie Night, the photos, the reunion): a major moment. */
export function airLater(state, ev) {
  if (ev.aired) return;
  ev.aired = true;
  ev.airedLate = state.ep;
  writeLedger(state, ev, true);
}

/** The villa's day: roughly PHASE_BUDGETS events, in phase order. */
export function generateEpisodeEvents(state, rng, budgets = PHASE_BUDGETS) {
  const out = [];
  for (const [phase, budget] of Object.entries(budgets)) {
    // Casa nights are temptation nights: pulls weigh double while split.
    const kinds = PHASE_KINDS[phase].map(([k, w]) => [k, k === 'pull' && state.split ? w * 2 : w]);
    let made = 0, tries = 0;
    while (made < budget && tries < budget * 4) {
      tries++;
      const kind = weighted(rng, kinds);
      const got = KINDS[kind].cast(state, rng);
      if (!got) continue;
      const players = Array.isArray(got) ? got : got.players;
      const realKind = Array.isArray(got) ? kind : (got.kind || kind);
      const extra = Array.isArray(got) ? {} : { secret: got.secret };
      out.push(makeEvent(state, rng, { phase, kind: realKind, players, extra }));
      made++;
    }
  }
  return out;
}
```

- [ ] **Step 5: Run it to verify it passes**

Run: `npx vitest run tests/pm-events.test.js`
Expected: PASS (5 tests). If the hut rate lands outside 15–35% the draw order is wrong: `rng() < HUT_RATE` must run once per event with players.

- [ ] **Step 6: Commit**

```bash
git add js/pm/events.js tests/pm-events.test.js tests/helpers/pm-cast.js
git commit -m "feat(perfect-match): villa events with consequences, airing and hut cutaways"
```

---

### Task 6: Recoupling

**Files:**
- Create: `js/pm/recoupling.js`
- Test: `tests/pm-recoupling.test.js`

**Interfaces:**
- Consumes: `attr` (Task 3), `partnerOf` (Task 5), `getPerceivedBond` (`js/bonds.js`).
- Produces: `INTENT_WEIGHTS`, `runRecoupling(state, { rng, pickerGender, bond? }) → { picks: [{ picker, picked, stole }], couples: [[a,b]], single: string[], ballots: [{ voter, target, channel: 'recoupling' }] }`. Does not mutate `state.couples`; the caller applies `couples`.

- [ ] **Step 1: Write the failing test** — `tests/pm-recoupling.test.js`

```js
import { describe, expect, it } from 'vitest';
import { setGs, setPlayers } from '../js/core.js';
import { setBond } from '../js/bonds.js';
import { streamFor } from '../js/dr/rng.js';
import { resolveIslander } from '../js/pm/profile.js';
import { seedAttraction } from '../js/pm/chemistry.js';
import { createLedger, noteArrival } from '../js/pm/ledger.js';
import { runRecoupling } from '../js/pm/recoupling.js';
import { makeIslanders } from './helpers/pm-cast.js';

function villa(n) {
  const cast = makeIslanders(n, 5);
  setPlayers(cast);
  setGs({ bonds: {}, perceivedBonds: {}, activePlayers: cast.map(p => p.name) });
  const state = { ep: 2, villa: [], casa: [], split: false, couples: [], profiles: {},
    attraction: {}, ledger: createLedger(), secrets: [] };
  for (const p of cast) {
    state.profiles[p.name] = resolveIslander(p, {}, streamFor(1, `profile:${p.name}`));
    state.villa.push(p.name); noteArrival(state.ledger, p.name, 1); seedAttraction(state, p.name, 1);
  }
  return state;
}

describe('recoupling', () => {
  it('everybody is either in a couple or single, never both, and picks are ballots', () => {
    const s = villa(11);
    const r = runRecoupling(s, { rng: streamFor(1, 'rc'), pickerGender: 'f' });
    const coupled = r.couples.flat();
    expect(new Set(coupled).size).toBe(coupled.length);
    expect([...coupled, ...r.single].sort()).toEqual([...s.villa].sort());
    expect(r.single.length).toBeGreaterThanOrEqual(1);   // 6 f and 5 m
    expect(r.ballots.every(b => b.channel === 'recoupling')).toBe(true);
  });

  it('a loyal couple with a strong bond picks each other', () => {
    const s = villa(10);
    const [f, m] = [s.villa[0], s.villa[1]];
    s.couples = [[f, m]];
    s.profiles[f].stats.loyalty = 10; s.profiles[f].intent = 'love';
    setBond(f, m, 9);
    let kept = 0;
    for (let i = 0; i < 20; i++) {
      const r = runRecoupling(s, { rng: streamFor(i * 7919 + 13, 'rc'), pickerGender: 'f' });
      if (r.couples.some(c => c.includes(f) && c.includes(m))) kept++;
    }
    expect(kept).toBeGreaterThanOrEqual(16);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run tests/pm-recoupling.test.js`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement** — `js/pm/recoupling.js`

```js
// ══════════════════════════════════════════════════════════════════════
// pm/recoupling.js — "Islanders, it's time to recouple"
// ══════════════════════════════════════════════════════════════════════
//
// The picking group chooses one at a time; the picked has no say — except
// when a second picker wants somebody already taken, and then THAT islander
// decides (spec §9.1). Decisions read PERCEIVED bonds and attraction. They
// never read approval or fame (spec §7).
import { getPerceivedBond } from '../bonds.js';
import { attr } from './chemistry.js';
import { partnerOf } from './events.js';

// How much each intent weighs connection, attraction and safety.
export const INTENT_WEIGHTS = {
  love: { conn: 1.0, attr: 0.4, safe: 0.3 },
  'settle-down': { conn: 1.1, attr: 0.3, safe: 0.3 },
  'first-love': { conn: 0.9, attr: 0.6, safe: 0.2 },
  'fresh-start': { conn: 0.9, attr: 0.4, safe: 0.4 },
  fun: { conn: 0.3, attr: 1.0, safe: 0.2 },
  stir: { conn: 0.3, attr: 0.9, safe: 0.3 },
  fame: { conn: 0.5, attr: 0.6, safe: 0.5 },
  win: { conn: 0.5, attr: 0.3, safe: 1.0 },
  money: { conn: 0.4, attr: 0.3, safe: 0.9 },
};

function shuffle(rng, arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

/** How much `p` wants `c`, proportional in every term. */
function desire(state, p, c, { bond, rng, taken }) {
  const prof = state.profiles[p], s = prof.stats;
  const w = INTENT_WEIGHTS[prof.intent] || INTENT_WEIGHTS.love;
  const conn = bond(p, c) / 10;
  const att = (attr(state, p, c) ?? 0) / 10;
  const safety = (bond(c, p) / 10) * (s.strategic / 10);
  const stay = partnerOf(state, p) === c ? 0.25 + 0.5 * s.loyalty / 10 : 0;
  const stealCost = taken.has(c) ? 0.4 - 0.3 * s.boldness / 10 : 0;
  const archConn = prof.archetype === 'showmancer' ? 1.15 : 1;
  const archSafe = prof.archetype === 'villain' || prof.archetype === 'schemer' ? 1.3 : 1;
  return w.conn * conn * archConn + w.attr * att + w.safe * safety * archSafe
    + stay - stealCost + (rng() - 0.5) * 0.2;
}

export function runRecoupling(state, { rng, pickerGender, bond = getPerceivedBond }) {
  const room = state.villa.filter(n => !(state.split && state.casa.includes(n)));
  const pickers = shuffle(rng, room.filter(n => state.profiles[n].gender === pickerGender));
  const candidates = room.filter(n => !pickers.includes(n));
  const taken = new Map();            // candidate -> picker
  const picks = [];
  const ctx = { bond, rng, taken };
  for (const p of pickers) {
    let options = candidates.filter(c => attr(state, p, c) != null);
    for (let attempt = 0; attempt < 2 && options.length; attempt++) {
      const best = options.map(c => [c, desire(state, p, c, ctx)]).sort((x, y) => y[1] - x[1])[0][0];
      const holder = taken.get(best);
      if (holder) {
        // The picked islander decides between the two.
        const keep = desire(state, best, holder, ctx) >= desire(state, best, p, ctx);
        if (keep) { options = options.filter(c => c !== best); continue; }
        picks.push({ picker: p, picked: best, stole: holder });
      } else {
        picks.push({ picker: p, picked: best, stole: null });
      }
      taken.set(best, p);
      break;
    }
  }
  const couples = [...taken].map(([c, p]) => [p, c]);
  const coupled = new Set(couples.flat());
  return {
    picks,
    couples,
    single: room.filter(n => !coupled.has(n)),
    ballots: picks.map(x => ({ voter: x.picker, target: x.picked, channel: 'recoupling' })),
  };
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npx vitest run tests/pm-recoupling.test.js`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add js/pm/recoupling.js tests/pm-recoupling.test.js
git commit -m "feat(perfect-match): recoupling with steals and the picked islander's say"
```

---

### Task 7: Public votes and villa dumpings

**Files:**
- Create: `js/pm/public-vote.js`, `js/pm/villa-vote.js`
- Test: `tests/pm-votes.test.js`

**Interfaces:**
- Consumes: `coupleScore` (Task 4), `attr` (Task 3), `partnerOf` (Task 5), `getPerceivedBond`.
- Produces:
  - `publicVote(state, { rng, bottom }) → { shares: [{ couple, share }], bottom: [[a,b]] }` (shares sum to 1; `bottom` lowest first)
  - `finalVote(state, { rng }) → [{ couple, share, placement }]` (placement 1 = winners)
  - `splitOrSteal(state, couple, { rng, bond? }) → { holder, choice: 'split'|'steal', p }`
  - `DUMP_FORMATS = ['cross-gender', 'safe-pick-couple', 'one-stays', 'public']`
  - `villaDumping(state, { format, bottom, rng, bond? }) → { dumped: string[], ballots: [{ voter, target, channel: 'villa' }] }`

- [ ] **Step 1: Write the failing test** — `tests/pm-votes.test.js`

```js
import { describe, expect, it } from 'vitest';
import { setGs, setPlayers } from '../js/core.js';
import { streamFor } from '../js/dr/rng.js';
import { createLedger } from '../js/pm/ledger.js';
import { publicVote, finalVote, splitOrSteal } from '../js/pm/public-vote.js';
import { villaDumping } from '../js/pm/villa-vote.js';

function state() {
  const names = ['F1', 'M1', 'F2', 'M2', 'F3', 'M3', 'F4', 'M4'];
  setPlayers(names.map(n => ({ name: n, gender: n[0] === 'F' ? 'f' : 'm', stats: {} })));
  setGs({ bonds: {}, perceivedBonds: {} });
  const profiles = Object.fromEntries(names.map(n => [n, { name: n, gender: n[0] === 'F' ? 'f' : 'm',
    intent: 'love', stats: { loyalty: 5 }, archetype: 'floater' }]));
  return { villa: names, casa: [], split: false, profiles, attraction: {}, ledger: createLedger(),
    couples: [['F1', 'M1'], ['F2', 'M2'], ['F3', 'M3'], ['F4', 'M4']] };
}

describe('the public vote', () => {
  it('shares sum to one and the bottom is the lowest', () => {
    const s = state();
    Object.assign(s.ledger.approval, { F1: 50, M1: 50, F2: 20, M2: 20, F3: -20, M3: -30, F4: 0, M4: 0 });
    const v = publicVote(s, { rng: streamFor(1, 'pv'), bottom: 2 });
    expect(v.shares.reduce((a, b) => a + b.share, 0)).toBeCloseTo(1, 6);
    expect(v.bottom[0]).toEqual(['F3', 'M3']);
  });

  it('a carried couple (star + hated) beats a lukewarm pair most of the time', () => {
    const s = state();
    Object.assign(s.ledger.approval, { F1: 70, M1: -50, F2: 10, M2: 10, F3: 10, M3: 10, F4: 10, M4: 10 });
    let safe = 0;
    for (let i = 0; i < 50; i++) {
      const v = publicVote(s, { rng: streamFor(i * 7919 + 13, 'pv'), bottom: 1 });
      if (!v.bottom[0].includes('F1')) safe++;
    }
    expect(safe).toBeGreaterThanOrEqual(45);
  });

  it('the final ranks every couple once and split-or-steal answers', () => {
    const s = state();
    const f = finalVote(s, { rng: streamFor(2, 'fv') });
    expect(f.map(x => x.placement)).toEqual([1, 2, 3, 4]);
    const e = splitOrSteal(s, f[0].couple, { rng: streamFor(3, 'env') });
    expect(['split', 'steal']).toContain(e.choice);
    expect(f[0].couple).toContain(e.holder);
  });
});

describe('villa dumpings', () => {
  const bottom = [['F3', 'M3'], ['F4', 'M4']];
  it('cross-gender dumps one of each gender from the bottom', () => {
    const r = villaDumping(state(), { format: 'cross-gender', bottom, rng: streamFor(1, 'vd') });
    expect(r.dumped).toHaveLength(2);
    expect(r.dumped.map(n => n[0]).sort()).toEqual(['F', 'M']);
    expect(r.dumped.every(n => bottom.flat().includes(n))).toBe(true);
    expect(r.ballots.every(b => b.channel === 'villa' && !bottom.flat().includes(b.voter))).toBe(true);
  });
  it('safe-pick-couple dumps a whole bottom couple', () => {
    const r = villaDumping(state(), { format: 'safe-pick-couple', bottom, rng: streamFor(2, 'vd') });
    expect(bottom.some(c => c.every(n => r.dumped.includes(n)))).toBe(true);
    expect(r.dumped).toHaveLength(2);
  });
  it('one-stays dumps one of the lowest couple; public dumps it whole', () => {
    expect(villaDumping(state(), { format: 'one-stays', bottom, rng: streamFor(3, 'vd') }).dumped)
      .toHaveLength(1);
    expect(villaDumping(state(), { format: 'public', bottom, rng: streamFor(4, 'vd') }).dumped)
      .toEqual(['F3', 'M3']);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run tests/pm-votes.test.js`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement** — `js/pm/public-vote.js`

```js
// ══════════════════════════════════════════════════════════════════════
// pm/public-vote.js — the country votes
// ══════════════════════════════════════════════════════════════════════
//
// ONE OF THE FILES ALLOWED TO READ THE PUBLIC LEDGER (spec §8, and
// tests/pm-ledger-readers.test.js). The public votes on what AIRED, which is
// all the ledger holds. Nothing an islander decides lives in this file.
import { getPerceivedBond } from '../bonds.js';
import { coupleScore } from './ledger.js';

const TEMP = 10;

function shares(state, couples, rng) {
  const rows = couples.map(c => ({ couple: c, score: coupleScore(state.ledger, c[0], c[1]) + (rng() - 0.5) * 6 }));
  const max = Math.max(...rows.map(r => r.score));
  const w = rows.map(r => Math.exp((r.score - max) / TEMP));
  const sum = w.reduce((a, b) => a + b, 0);
  rows.forEach((r, i) => { r.share = w[i] / sum; });
  return rows;
}

export function publicVote(state, { rng, bottom = 2 }) {
  const rows = shares(state, state.couples, rng);
  const ranked = [...rows].sort((a, b) => a.share - b.share);
  return {
    shares: rows.map(r => ({ couple: r.couple, share: r.share })),
    bottom: ranked.slice(0, Math.min(bottom, rows.length)).map(r => r.couple),
  };
}

export function finalVote(state, { rng }) {
  return shares(state, state.couples, rng)
    .sort((a, b) => b.share - a.share)
    .map((r, i) => ({ couple: r.couple, share: r.share, placement: i + 1 }));
}

/** The envelope. Measured in the audit: the real UK show never saw a steal. */
export function splitOrSteal(state, couple, { rng, bond = getPerceivedBond }) {
  const holder = couple[Math.floor(rng() * couple.length)];
  const other = couple[0] === holder ? couple[1] : couple[0];
  const prof = state.profiles[holder];
  const p = Math.max(0, Math.min(0.9, 0.02 + (prof.intent === 'money' ? 0.25 : 0)
    + 0.1 * (1 - (prof.stats.loyalty ?? 5) / 10) + 0.1 * (1 - (bond(holder, other) + 10) / 20)));
  return { holder, choice: rng() < p ? 'steal' : 'split', p };
}
```

`js/pm/villa-vote.js`

```js
// ══════════════════════════════════════════════════════════════════════
// pm/villa-vote.js — when the islanders finish what the public started
// ══════════════════════════════════════════════════════════════════════
//
// Four real formats (spec §9.2). Voters read PERCEIVED bonds and who
// threatens their own couple. Never approval or fame.
import { getPerceivedBond } from '../bonds.js';
import { attr } from './chemistry.js';
import { partnerOf } from './events.js';

export const DUMP_FORMATS = ['cross-gender', 'safe-pick-couple', 'one-stays', 'public'];

function affinity(state, v, t, bond) {
  const mine = partnerOf(state, v);
  const threat = mine && (attr(state, t, mine) ?? 0) > 6 ? 2 : 0;
  return bond(v, t) - threat;
}

function tally(ballots, rng) {
  const count = new Map();
  for (const b of ballots) count.set(b.target, (count.get(b.target) || 0) + 1);
  const top = Math.max(...count.values());
  const tied = [...count].filter(([, c]) => c === top).map(([n]) => n);
  return tied[Math.floor(rng() * tied.length)];
}

export function villaDumping(state, { format, bottom, rng, bond = getPerceivedBond }) {
  const atRisk = bottom.flat();
  const voters = state.villa.filter(n => !atRisk.includes(n));
  const g = n => state.profiles[n].gender;
  if (format === 'public' || !voters.length) return { dumped: [...bottom[0]], ballots: [] };

  if (format === 'one-stays') {
    const [a, b] = bottom[0];
    const ballots = voters.map(v => ({ voter: v, target: affinity(state, v, a, bond) >= affinity(state, v, b, bond) ? b : a, channel: 'villa' }));
    return { dumped: [tally(ballots, rng)], ballots };
  }

  if (format === 'safe-pick-couple') {
    const ballots = voters.map(v => {
      const worst = [...bottom].sort((x, y) =>
        (affinity(state, v, x[0], bond) + affinity(state, v, x[1], bond))
        - (affinity(state, v, y[0], bond) + affinity(state, v, y[1], bond)))[0];
      return { voter: v, target: worst[0], channel: 'villa' };
    });
    const lead = tally(ballots, rng);
    return { dumped: [...bottom.find(c => c.includes(lead))], ballots };
  }

  // cross-gender: each side votes one of the other side's at-risk islanders.
  const dumped = [], ballots = [];
  for (const side of ['f', 'm']) {
    const targets = atRisk.filter(n => g(n) !== side);
    const sideVoters = voters.filter(v => g(v) === side);
    if (!targets.length || !sideVoters.length) continue;
    const mine = sideVoters.map(v => ({ voter: v, channel: 'villa',
      target: [...targets].sort((x, y) => affinity(state, v, x, bond) - affinity(state, v, y, bond))[0] }));
    ballots.push(...mine);
    dumped.push(tally(mine, rng));
  }
  return { dumped, ballots };
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npx vitest run tests/pm-votes.test.js`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add js/pm/public-vote.js js/pm/villa-vote.js tests/pm-votes.test.js
git commit -m "feat(perfect-match): public vote, final, envelope and the four villa dumpings"
```

---

### Task 8: Bombshells and Casa Amor

**Files:**
- Create: `js/pm/arrivals.js`, `js/pm/casa.js`
- Test: `tests/pm-arrivals.test.js`

**Interfaces:**
- Consumes: `seedAttraction`, `attr` (Task 3); `noteArrival`, `readApproval`, `coupleScore` (Task 4); `makeEvent`, `partnerOf` (Task 5).
- Produces:
  - `arriveIslander(state, name, { ep, seed, room })`
  - `eyesOnFor(state, name) → string[]`
  - `arriveBombshell(state, name, { ep, seed, rng }) → { eyesOn, events }`
  - `bombshellSteal(state, name, { rng }) → { stole, leftSingle, events } | null` (mutates `state.couples`)
  - `openCasa(state, casaNames, { ep, seed, rng, movingGender }) → Event[]`
  - `stickOrTwist(state, { rng, bond? }) → { decisions: [{ name, choice, with }], dumped: string[], singleSafe: string[], ballots, events }` (mutates couples, villa split)

- [ ] **Step 1: Write the failing test** — `tests/pm-arrivals.test.js`

```js
import { describe, expect, it } from 'vitest';
import { setGs, setPlayers } from '../js/core.js';
import { streamFor } from '../js/dr/rng.js';
import { resolveIslander } from '../js/pm/profile.js';
import { seedAttraction } from '../js/pm/chemistry.js';
import { createLedger, noteArrival } from '../js/pm/ledger.js';
import { arriveBombshell, bombshellSteal, eyesOnFor, openCasa } from '../js/pm/arrivals.js';
import { stickOrTwist } from '../js/pm/casa.js';
import { makeIslanders } from './helpers/pm-cast.js';

function villa(total, inside) {
  const cast = makeIslanders(total, 11);
  setPlayers(cast);
  setGs({ bonds: {}, perceivedBonds: {} });
  const state = { ep: 3, villa: [], casa: [], split: false, couples: [], profiles: {},
    attraction: {}, ledger: createLedger(), secrets: [], seq: 0 };
  for (const p of cast) state.profiles[p.name] = resolveIslander(p, {}, streamFor(1, `profile:${p.name}`));
  for (const p of cast.slice(0, inside)) {
    state.villa.push(p.name); noteArrival(state.ledger, p.name, 1); seedAttraction(state, p.name, 1);
  }
  for (let i = 0; i + 1 < inside; i += 2) state.couples.push([cast[i].name, cast[i + 1].name]);
  return { state, cast };
}

describe('bombshells', () => {
  it('honours an authored eyes-on list and otherwise fills one', () => {
    const { state, cast } = villa(12, 10);
    const b = cast[10].name;
    state.profiles[b].eyesOn = [cast[1].name];
    arriveBombshell(state, b, { ep: 3, seed: 1, rng: streamFor(1, 'b') });
    expect(eyesOnFor(state, b)).toEqual([cast[1].name]);
    const c = cast[11].name;
    arriveBombshell(state, c, { ep: 3, seed: 1, rng: streamFor(2, 'b') });
    expect(eyesOnFor(state, c).length).toBeGreaterThan(0);
  });

  it('a steal leaves the old partner single and is a major moment for all three', () => {
    const { state, cast } = villa(11, 10);
    const b = cast[10].name;
    arriveBombshell(state, b, { ep: 3, seed: 1, rng: streamFor(3, 'b') });
    const r = bombshellSteal(state, b, { rng: streamFor(4, 'b') });
    expect(r).toBeTruthy();
    expect(state.couples.some(c => c.includes(b) && c.includes(r.stole))).toBe(true);
    expect(state.couples.some(c => c.includes(r.leftSingle))).toBe(false);
    expect(r.events[0].major.sort()).toEqual([b, r.stole, r.leftSingle].sort());
  });
});

describe('Casa Amor', () => {
  it('ends with every islander in at most one couple and unpicked arrivals dumped', () => {
    const { state, cast } = villa(16, 10);
    const casaNames = cast.slice(10).map(p => p.name);
    openCasa(state, casaNames, { ep: 8, seed: 1, rng: streamFor(5, 'c'), movingGender: 'f' });
    expect(state.split).toBe(true);
    const r = stickOrTwist(state, { rng: streamFor(6, 'c') });
    expect(state.split).toBe(false);
    const coupled = state.couples.flat();
    expect(new Set(coupled).size).toBe(coupled.length);
    for (const n of r.dumped) {
      expect(casaNames).toContain(n);
      expect(state.villa).not.toContain(n);
    }
    expect(r.ballots.every(b => b.channel === 'casa')).toBe(true);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run tests/pm-arrivals.test.js`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement** — `js/pm/arrivals.js`

```js
// ══════════════════════════════════════════════════════════════════════
// pm/arrivals.js — "Islanders, we have a bombshell"
// ══════════════════════════════════════════════════════════════════════
//
// ONE OF THE FILES ALLOWED TO READ THE PUBLIC LEDGER. A bombshell watched the
// aired episodes from home (spec §7), so their eyes-on list may use what
// aired — at arrival, and nowhere else. A steal from a couple the public loves
// costs the bombshell approval.
import { addBond } from '../bonds.js';
import { seedAttraction, attr } from './chemistry.js';
import { noteArrival, readApproval, coupleScore } from './ledger.js';
import { makeEvent, partnerOf } from './events.js';

export function arriveIslander(state, name, { ep, seed, room = 'villa' }) {
  if (!state.villa.includes(name)) state.villa.push(name);
  if (room === 'casa' && !state.casa.includes(name)) state.casa.push(name);
  noteArrival(state.ledger, name, ep);
  seedAttraction(state, name, seed);
}

export function eyesOnFor(state, name) {
  const authored = (state.profiles[name].eyesOn || []).filter(n => n !== name && state.villa.includes(n));
  if (authored.length) return authored.slice(0, 3);
  return state.villa.filter(n => n !== name && attr(state, name, n) != null)
    .map(n => [n, attr(state, name, n) + readApproval(state.ledger, n) / 25])
    .sort((a, b) => b[1] - a[1]).slice(0, 3).map(([n]) => n);
}

export function arriveBombshell(state, name, { ep, seed, rng }) {
  arriveIslander(state, name, { ep, seed });
  const eyesOn = eyesOnFor(state, name);
  state.profiles[name].eyesOnResolved = eyesOn;
  const events = [makeEvent(state, rng, { phase: 'event', kind: 'entrance', players: [name],
    aired: true, major: [name], extra: { pop: { [name]: { approval: 0.5, fame: 3 } } } })];
  for (const t of eyesOn.slice(0, 2)) {
    addBond(name, t, 0.3 + 0.4 * ((attr(state, t, name) ?? 0) / 10));
    events.push(makeEvent(state, rng, { phase: 'event', kind: 'date', players: [name, t],
      extra: { pop: { [name]: { approval: 0.2, fame: 1.5 }, [t]: { approval: 0, fame: 1 } } } }));
  }
  return { eyesOn, events };
}

export function bombshellSteal(state, name, { rng }) {
  const targets = (state.profiles[name].eyesOnResolved || eyesOnFor(state, name))
    .filter(t => partnerOf(state, t));
  if (!targets.length) return null;
  const stole = targets[0];
  const leftSingle = partnerOf(state, stole);
  const loved = Math.max(0, coupleScore(state.ledger, stole, leftSingle));
  state.couples = state.couples.filter(c => !c.includes(stole));
  state.couples.push([name, stole]);
  const ev = makeEvent(state, rng, { phase: 'event', kind: 'steal', players: [name, stole, leftSingle],
    aired: true, major: [name, stole, leftSingle],
    extra: { pop: { [name]: { approval: -0.05 * loved, fame: 3 },
      [stole]: { approval: 0, fame: 2 }, [leftSingle]: { approval: 1.5, fame: 2 } } } });
  return { stole, leftSingle, events: [ev] };
}

/** The villa splits. The moving gender goes to Casa; arrivals of that gender join the main villa. */
export function openCasa(state, casaNames, { ep, seed, rng, movingGender = 'f' }) {
  const movers = state.villa.filter(n => state.profiles[n].gender === movingGender);
  state.split = true;
  state.casa = [...movers];
  state.casaArrivals = [...casaNames];
  const events = [];
  for (const n of casaNames) {
    const room = state.profiles[n].gender === movingGender ? 'villa' : 'casa';
    arriveIslander(state, n, { ep, seed, room });
    events.push(makeEvent(state, rng, { phase: 'event', kind: 'entrance', players: [n], aired: true,
      major: [n], extra: { pop: { [n]: { approval: 0.3, fame: 2 } } } }));
  }
  return events;
}
```

`js/pm/casa.js`

```js
// ══════════════════════════════════════════════════════════════════════
// pm/casa.js — stick or twist
// ══════════════════════════════════════════════════════════════════════
//
// Every original decides in secret (spec §9.4), proportional to the best Casa
// attraction against connection with their partner, intent, loyalty, and
// FEAR — somebody who already knows their partner strayed twists first.
// Never reads approval or fame.
import { getPerceivedBond } from '../bonds.js';
import { attr } from './chemistry.js';
import { makeEvent, partnerOf } from './events.js';

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

export function stickOrTwist(state, { rng, bond = getPerceivedBond }) {
  const arrivals = new Set(state.casaArrivals || []);
  const originals = state.villa.filter(n => !arrivals.has(n));
  const roomOf = n => (state.casa.includes(n) ? 'casa' : 'villa');
  const scored = originals.map(o => {
    const prof = state.profiles[o], s = prof.stats;
    const options = [...arrivals].filter(c => roomOf(c) === roomOf(o) && attr(state, o, c) != null);
    const best = options.length ? Math.max(...options.map(c => attr(state, o, c))) / 10 : 0;
    const p = partnerOf(state, o);
    const conn = p ? Math.max(0, bond(o, p) / 10) : 0;
    const fear = p && state.secrets.some(x => x.known && x.who === p && x.partner === o) ? 0.25 : 0;
    const intent = ['fun', 'stir'].includes(prof.intent) ? 0.2 : 0;
    const arch = prof.archetype === 'loyal-soldier' ? -0.1 : 0;
    const twistP = options.length
      ? clamp(0.1 + 0.55 * best - 0.45 * conn + intent + fear - 0.3 * s.loyalty / 10 + arch
        + (p ? 0 : 0.4), 0.02, 0.95)
      : 0;
    return { o, p, twistP, options };
  }).sort((a, b) => b.twistP - a.twistP);

  const taken = new Set();
  const decisions = [];
  for (const { o, twistP, options } of scored) {
    const free = options.filter(c => !taken.has(c)).sort((x, y) => attr(state, o, y) - attr(state, o, x));
    if (free.length && rng() < twistP) { taken.add(free[0]); decisions.push({ name: o, choice: 'twist', with: free[0] }); }
    else decisions.push({ name: o, choice: 'stick', with: null });
  }

  const choice = Object.fromEntries(decisions.map(d => [d.name, d]));
  const next = [], singleSafe = [];
  for (const [a, b] of state.couples) {
    if (arrivals.has(a) || arrivals.has(b)) continue;
    if (choice[a]?.choice === 'stick' && choice[b]?.choice === 'stick') next.push([a, b]);
    else {
      if (choice[a]?.choice === 'stick') singleSafe.push(a);
      if (choice[b]?.choice === 'stick') singleSafe.push(b);
    }
  }
  for (const d of decisions) if (d.choice === 'twist') next.push([d.name, d.with]);
  const dumped = [...arrivals].filter(c => !taken.has(c));

  const events = decisions.map(d => {
    const partner = partnerOf(state, d.name);
    const players = [d.name, d.with || partner].filter(Boolean);
    return makeEvent(state, rng, { phase: 'firepit', kind: 'casa-return', players, aired: true,
      major: d.choice === 'twist' ? players.concat(partner ? [partner] : []) : [],
      extra: { choice: d.choice, pop: d.choice === 'twist'
        ? { [d.name]: { approval: partner ? -3 : 0.5, fame: 3 }, ...(partner ? { [partner]: { approval: 3, fame: 3 } } : {}) }
        : { [d.name]: { approval: partner ? 2 : 0, fame: 1.5 } } } });
  });

  state.couples = next;
  state.villa = state.villa.filter(n => !dumped.includes(n));
  state.split = false;
  state.casa = [];
  state.casaArrivals = [];
  return {
    decisions, dumped, singleSafe, events,
    ballots: decisions.map(d => ({ voter: d.name, target: d.with || partnerOfBefore(d.name), channel: 'casa', choice: d.choice })),
  };

  function partnerOfBefore(n) {
    const c = scored.find(x => x.o === n);
    return c?.p || null;
  }
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npx vitest run tests/pm-arrivals.test.js`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add js/pm/arrivals.js js/pm/casa.js tests/pm-arrivals.test.js
git commit -m "feat(perfect-match): bombshell arrivals and steals, Casa Amor stick or twist"
```

---

### Task 9: Schedule, moments and the season loop

**Files:**
- Create: `js/pm/schedule.js`, `js/pm/moments.js`, `js/pm/season.js`
- Test: `tests/pm-season.test.js`

**Interfaces:**
- Consumes: everything above.
- Produces:
  - `SEASON_TEMPLATE` (16 entries `{ ep, days, moment, arrivals?, dumpFormat?, bottom? }`)
  - `dumpingScene(state, rng, { atRisk, dumped, ballots, channel }) → { events, exits }` (removes the dumped)
  - moment handlers keyed by `moment` in `MOMENTS`: `(state, ctx) → { events, exits, ballots, extra }` with `ctx = { rng, entry, seed, queues, closeNow }`
  - `playPerfectMatchSeason({ cast, setup, seed, schedule, splitOrStealOn }) → { rows, winners, final, state }`; each row `{ num, format: 'perfect-match', days, moment, eliminated, exits: [{ name, verb, channel }], votes, pm: { events, couples, villa, shares, bottom, majors, labels, approval, fame, envelope } }`

- [ ] **Step 1: Write the failing test** — `tests/pm-season.test.js`

```js
import { describe, expect, it } from 'vitest';
import { gs, setPlayers } from '../js/core.js';
import { playPerfectMatchSeason } from '../js/pm/season.js';
import { SEASON_TEMPLATE } from '../js/pm/schedule.js';
import { makeIslanders, roleSetup } from './helpers/pm-cast.js';

function play(seed, n = 22) {
  const cast = makeIslanders(n, seed);
  setPlayers(cast);
  const names = cast.map(p => p.name);
  return { ...playPerfectMatchSeason({ cast: names, setup: roleSetup(names), seed }), names };
}

describe('a whole Perfect Match season', () => {
  it('plays sixteen episodes and ends with winners and at most four couples', () => {
    const { rows, winners, final } = play(1);
    expect(rows).toHaveLength(SEASON_TEMPLATE.length);
    expect(rows.every(r => r.format === 'perfect-match')).toBe(true);
    expect(winners).toHaveLength(2);
    expect(final.length).toBeGreaterThanOrEqual(2);
    expect(final.length).toBeLessThanOrEqual(4);
    expect(gs.episodeHistory).toBe(rows);
  });

  it('villa episodes carry about a hundred events', () => {
    const { rows } = play(2);
    for (const r of rows.filter(r => r.moment !== 'reunion')) {
      expect(r.pm.events.length).toBeGreaterThanOrEqual(80);
    }
  });

  it('every exit uses the show\'s verbs and nobody leaves twice', () => {
    const { rows, names } = play(3);
    const gone = rows.flatMap(r => r.exits.map(x => x.name));
    expect(new Set(gone).size).toBe(gone.length);
    expect(gone.every(n => names.includes(n))).toBe(true);
    for (const x of rows.flatMap(r => r.exits)) expect(['dumped', 'walked']).toContain(x.verb);
  });

  it('replays byte-for-byte off the same seed', () => {
    const sig = rows => rows.map(r => `${r.num}:${r.exits.map(x => x.name).join(',')}:${r.pm.events.length}`).join('|');
    expect(sig(play(4).rows)).toBe(sig(play(4).rows));
    expect(sig(play(4).rows)).not.toBe(sig(play(5).rows));
  });

  it('a 20-islander cast still finishes', () => {
    const { rows, winners } = play(6, 20);
    expect(rows.length).toBe(SEASON_TEMPLATE.length);
    expect(winners).toHaveLength(2);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run tests/pm-season.test.js`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement the schedule** — `js/pm/schedule.js`

```js
// ══════════════════════════════════════════════════════════════════════
// pm/schedule.js — sixteen episodes: fifteen in the villa and the reunion
// ══════════════════════════════════════════════════════════════════════
//
// Spec §3. Arrivals are drawn from the season's queues in cast order; an
// empty queue skips the arrival, which is how a 20-islander cast plays the
// same template with one bombshell fewer.
export const SEASON_TEMPLATE = [
  { ep: 1, days: [1, 2], moment: 'first-coupling', arrivals: { bombshell: 1 } },
  { ep: 2, days: [3, 5], moment: 'recoupling' },
  { ep: 3, days: [6, 8], moment: 'bombshell', arrivals: { bombshell: 1 } },
  { ep: 4, days: [9, 11], moment: 'recoupling' },
  { ep: 5, days: [12, 14], moment: 'public-vote', dumpFormat: 'cross-gender', bottom: 2 },
  { ep: 6, days: [15, 17], moment: 'bombshell', arrivals: { bombshell: 2 } },
  { ep: 7, days: [18, 20], moment: 'recoupling' },
  { ep: 8, days: [21, 23], moment: 'casa-open' },
  { ep: 9, days: [24, 26], moment: 'casa-nights' },
  { ep: 10, days: [27, 28], moment: 'stick-or-twist' },
  { ep: 11, days: [29, 31], moment: 'photos', arrivals: { bombshell: 1 } },
  { ep: 12, days: [32, 34], moment: 'public-vote', dumpFormat: 'safe-pick-couple', bottom: 3 },
  { ep: 13, days: [35, 37], moment: 'recoupling', arrivals: { bombshell: 1 } },
  { ep: 14, days: [38, 40], moment: 'semi-final' },
  { ep: 15, days: [41, 43], moment: 'final' },
  { ep: 16, days: null, moment: 'reunion' },
];
export const FINAL_COUPLES = 4;
```

- [ ] **Step 4: Implement the moments** — `js/pm/moments.js`

```js
// ══════════════════════════════════════════════════════════════════════
// pm/moments.js — each episode's big moment, and the dumping scene
// ══════════════════════════════════════════════════════════════════════
//
// The dumping is its own scene in five PHASES (spec §10) — build-up, verdict
// (with the villa's ballots revealed), reaction, goodbye, fallout — each
// carrying as many events as the night produces. Every beat moves bonds.
import { addBond, getBond } from '../bonds.js';
import { makeEvent, partnerOf, roomMates, airLater } from './events.js';
import { runRecoupling } from './recoupling.js';
import { publicVote, finalVote, splitOrSteal } from './public-vote.js';
import { villaDumping } from './villa-vote.js';
import { arriveBombshell, bombshellSteal, openCasa } from './arrivals.js';
import { stickOrTwist } from './casa.js';
import { closeEpisode } from './ledger.js';
import { FINAL_COUPLES } from './schedule.js';

const EXIT = 'dumped';

function removeFromVilla(state, names) {
  state.villa = state.villa.filter(n => !names.includes(n));
  state.casa = state.casa.filter(n => !names.includes(n));
  state.couples = state.couples.filter(c => !c.some(n => names.includes(n)));
}

export function dumpingScene(state, rng, { atRisk = [], dumped, ballots = [], channel }) {
  const events = [];
  const ev = (kind, players, pop, major = []) => events.push(makeEvent(state, rng,
    { phase: 'dumping', kind, players, aired: true, major, extra: { pop } }));
  const partners = Object.fromEntries(dumped.map(n => [n, partnerOf(state, n)]));
  // 1. build-up
  for (const c of atRisk) ev('dump-buildup', c, Object.fromEntries(c.map(n => [n, { approval: 0, fame: 0.5 }])));
  // 2. verdict, and the ballots in front of everyone
  for (const n of dumped) ev('dump-verdict', [n], { [n]: { approval: 0, fame: 2 } }, [n]);
  for (const b of ballots) {
    if (!dumped.includes(b.target)) continue;
    addBond(b.target, b.voter, -0.8);
    const p = partners[b.target];
    if (p && p !== b.voter && !dumped.includes(p)) addBond(p, b.voter, -0.5);
    ev('ballot-reveal', [b.voter, b.target], { [b.voter]: { approval: -0.2, fame: 1 } });
  }
  // 3. reaction: the partner left behind
  for (const n of dumped) {
    const p = partners[n];
    if (!p || dumped.includes(p)) continue;
    ev('dump-reaction', [p, n], { [p]: { approval: 0.8 * Math.max(0, getBond(p, n)) / 10 + 0.3, fame: 1.5 } });
  }
  // 4. goodbye: hugs from the friends
  for (const n of dumped) {
    const friends = roomMates(state, n).filter(m => getBond(n, m) > 1).slice(0, 3);
    for (const f of friends) { addBond(n, f, 0.2); ev('dump-goodbye', [n, f], { [n]: { approval: 0.5, fame: 0.5 } }); }
    ev('dump-goodbye', [n], { [n]: { approval: 1.5, fame: 1 } });
  }
  removeFromVilla(state, dumped);
  // 5. fallout: whoever is newly single panics
  for (const p of Object.values(partners)) {
    if (p && state.villa.includes(p) && !partnerOf(state, p)) ev('dump-fallout', [p], { [p]: { approval: 0.2, fame: 1 } });
  }
  return { events, exits: dumped.map(name => ({ name, verb: EXIT, channel })) };
}

function pickerGender(state) {
  const g = state.recouplings % 2 === 0 ? 'm' : 'f';
  state.recouplings++;
  return g;
}

function recoupleNight(state, rng, { dumpSingles }) {
  const r = runRecoupling(state, { rng, pickerGender: pickerGender(state) });
  const events = r.picks.map(pk => makeEvent(state, rng, { phase: 'firepit', kind: 'recouple-pick',
    players: [pk.picker, pk.picked, ...(pk.stole ? [pk.stole] : [])], aired: true,
    major: pk.stole ? [pk.picker, pk.stole] : [],
    extra: { stole: pk.stole, pop: { [pk.picker]: { approval: pk.stole ? -1 : 0.2, fame: 1 },
      ...(pk.stole ? { [pk.stole]: { approval: 1.5, fame: 2 } } : {}) } } }));
  state.couples = r.couples;
  if (!dumpSingles || !r.single.length) return { events, exits: [], ballots: r.ballots };
  const scene = dumpingScene(state, rng, { atRisk: [], dumped: r.single, ballots: [], channel: 'recoupling' });
  return { events: [...events, ...scene.events], exits: scene.exits, ballots: r.ballots };
}

function arrivals(state, ctx, count) {
  const out = [];
  for (let i = 0; i < count && ctx.queues.bombshell.length; i++) {
    const name = ctx.queues.bombshell.shift();
    out.push(...arriveBombshell(state, name, { ep: state.ep, seed: ctx.seed, rng: ctx.rng }).events);
  }
  return out;
}

export const MOMENTS = {
  'first-coupling': (state, ctx) => {
    const first = recoupleNight(state, ctx.rng, { dumpSingles: false });
    const events = [...first.events, ...arrivals(state, ctx, ctx.entry.arrivals?.bombshell || 0)];
    for (const name of state.villa.filter(n => state.ledger.firstEp[n] === state.ep && state.profiles[n].role === 'bombshell')) {
      const st = bombshellSteal(state, name, { rng: ctx.rng });
      if (st) events.push(...st.events);
    }
    return { events, exits: [], ballots: first.ballots };
  },
  recoupling: (state, ctx) => {
    const pre = arrivals(state, ctx, ctx.entry.arrivals?.bombshell || 0);
    const r = recoupleNight(state, ctx.rng, { dumpSingles: true });
    return { events: [...pre, ...r.events], exits: r.exits, ballots: r.ballots };
  },
  bombshell: (state, ctx) => ({ events: arrivals(state, ctx, ctx.entry.arrivals?.bombshell || 0), exits: [], ballots: [] }),
  'public-vote': (state, ctx) => {
    const pv = publicVote(state, { rng: ctx.rng, bottom: ctx.entry.bottom || 2 });
    const vd = villaDumping(state, { format: ctx.entry.dumpFormat, bottom: pv.bottom, rng: ctx.rng });
    const scene = dumpingScene(state, ctx.rng, { atRisk: pv.bottom, dumped: vd.dumped, ballots: vd.ballots,
      channel: ctx.entry.dumpFormat === 'public' ? 'public' : 'villa' });
    return { events: scene.events, exits: scene.exits, ballots: vd.ballots, extra: { shares: pv.shares, bottom: pv.bottom } };
  },
  'casa-open': (state, ctx) => {
    const names = ctx.queues.casa.splice(0);
    return { events: names.length ? openCasa(state, names, { ep: state.ep, seed: ctx.seed, rng: ctx.rng }) : [], exits: [], ballots: [] };
  },
  'casa-nights': () => ({ events: [], exits: [], ballots: [] }),
  'stick-or-twist': (state, ctx) => {
    if (!state.split) return { events: [], exits: [], ballots: [] };
    const st = stickOrTwist(state, { rng: ctx.rng });
    const exits = st.dumped.map(name => ({ name, verb: EXIT, channel: 'casa' }));
    return { events: st.events, exits, ballots: st.ballots };
  },
  photos: (state, ctx) => {
    const events = [];
    for (const sec of state.secrets.filter(x => x.casa && !x.known)) {
      sec.known = true;
      if (!state.villa.includes(sec.who) || !state.villa.includes(sec.partner)) continue;
      addBond(sec.who, sec.partner, -1.5 * sec.severity);
      const hidden = state.history.find(e => e.id === sec.eventId);
      if (hidden) airLater(state, hidden);
      events.push(makeEvent(state, ctx.rng, { phase: 'firepit', kind: 'photos', players: [sec.partner, sec.who],
        aired: true, major: [sec.partner, sec.who],
        extra: { secret: sec.id, pop: { [sec.partner]: { approval: 1.5, fame: 2 }, [sec.who]: { approval: -2.5, fame: 2 } } } }));
    }
    return { events: [...events, ...arrivals(state, ctx, ctx.entry.arrivals?.bombshell || 0)], exits: [], ballots: [] };
  },
  'semi-final': (state, ctx) => {
    const over = state.couples.length - FINAL_COUPLES;
    if (over <= 0) return { events: [], exits: [], ballots: [] };
    const pv = publicVote(state, { rng: ctx.rng, bottom: over });
    const scene = dumpingScene(state, ctx.rng, { atRisk: pv.bottom, dumped: pv.bottom.flat(), channel: 'public' });
    return { events: scene.events, exits: scene.exits, ballots: [], extra: { shares: pv.shares, bottom: pv.bottom } };
  },
  final: (state, ctx) => {
    const events = state.couples.map(([a, b]) => makeEvent(state, ctx.rng, { phase: 'firepit', kind: 'declaration',
      players: [a, b], aired: true, extra: { pop: {
        [a]: { approval: 2 * getBond(a, b) / 10, fame: 2 }, [b]: { approval: 2 * getBond(b, a) / 10, fame: 2 } } } }));
    // Declarations count toward the vote: close the ledger before the country votes.
    closeEpisode(state.ledger, state.ep, ctx.popularity);
    ctx.closed = true;
    const final = finalVote(state, { rng: ctx.rng });
    const envelope = ctx.splitOrStealOn ? splitOrSteal(state, final[0].couple, { rng: ctx.rng }) : null;
    return { events, exits: [], ballots: [], extra: { final, envelope, shares: final.map(f => ({ couple: f.couple, share: f.share })) } };
  },
  reunion: (state, ctx) => {
    // What they didn't show you: the biggest hidden events, aired at last.
    const hidden = state.history.filter(e => !e.aired && e.kind !== 'loyalty')
      .map(e => [e, Object.values(e.pop).reduce((a, p) => a + Math.abs(p.approval || 0), 0)])
      .sort((a, b) => b[1] - a[1]).slice(0, 5).map(([e]) => e);
    for (const e of hidden) airLater(state, e);
    const events = hidden.map(e => makeEvent(state, ctx.rng, { phase: 'reunion', kind: 'reveal', players: e.players,
      aired: true, extra: { revealed: e.id, pop: {} } }));
    return { events, exits: [], ballots: [], extra: { revealed: hidden.map(e => e.id) } };
  },
};
```

- [ ] **Step 5: Implement the loop** — `js/pm/season.js`

```js
// ══════════════════════════════════════════════════════════════════════
// pm/season.js — a whole Perfect Match season, headless
// ══════════════════════════════════════════════════════════════════════
//
// The Traitors shape: replaces `gs`, plays every episode, writes one
// `gs.episodeHistory` row each (stamped `format`), villa state on `gs.pm`.
// The caller owns `players` (setPlayers) — profiles are resolved from it.
//
// DICE: every episode draws from its own `streamFor(seed, 'ep:N')`, every
// profile from `profile:<name>`, every spark from `spark:a>b`. One episode's
// draws never move another's (ADDING-A-SHOW §11.5 M).
import { gs, setGs, players } from '../core.js';
import { getBond } from '../bonds.js';
import { streamFor } from '../dr/rng.js';
import { PERFECT_MATCH_FORMAT } from '../shows.js';
import { resolveIslander } from './profile.js';
import { seedAttraction } from './chemistry.js';
import { createLedger, noteArrival, closeEpisode, ledgerSnapshot, recordAired } from './ledger.js';
import { generateEpisodeEvents, makeEvent, partnerOf } from './events.js';
import { SEASON_TEMPLATE } from './schedule.js';
import { MOMENTS } from './moments.js';
import { attr } from './chemistry.js';

function initState(cast, setup, seed) {
  const state = { ep: 0, villa: [], casa: [], split: false, couples: [], profiles: {},
    attraction: {}, ledger: createLedger(), secrets: [], seq: 0, recouplings: 0, history: [],
    casaArrivals: [] };
  for (const name of cast) {
    const player = players.find(p => p.name === name) || { name };
    state.profiles[name] = resolveIslander(player, setup[name] || {}, streamFor(seed, `profile:${name}`));
  }
  return state;
}

function queuesFor(state, cast) {
  const byRole = role => cast.filter(n => state.profiles[n].role === role);
  return { starter: byRole('starter'), bombshell: byRole('bombshell'), casa: byRole('casa') };
}

/** A walk: rare, after a collapse, from somebody with a short fuse and nobody left they fancy. */
function maybeWalk(state, rng) {
  for (const n of state.villa) {
    if (partnerOf(state, n)) continue;
    const s = state.profiles[n].stats;
    const best = Math.max(0, ...state.villa.map(m => attr(state, n, m) ?? 0));
    const p = 0.04 * (1 - s.temperament / 10) * Math.max(0, 1 - best / 5);
    if (rng() < p) return n;
  }
  return null;
}

export function playPerfectMatchSeason({ cast, setup = {}, seed = 1, schedule = SEASON_TEMPLATE,
  splitOrStealOn = false } = {}) {
  setGs({ bonds: {}, perceivedBonds: {}, activePlayers: [], episodeHistory: [], popularity: {} });
  const state = initState(cast, setup, seed);
  gs.pm = state;
  const queues = queuesFor(state, cast);
  let final = null;

  for (const entry of schedule) {
    state.ep = entry.ep;
    // addBond's depth ceiling grows with `gs.episode` (js/bonds.js). Left at 0
    // it would cap every villa bond at +4.5 all season — the §11.5 O trap.
    gs.episode = entry.ep;
    const rng = streamFor(seed, `ep:${entry.ep}`);
    if (entry.ep === 1) {
      for (const n of queues.starter) {
        state.villa.push(n); noteArrival(state.ledger, n, 1); seedAttraction(state, n, seed);
      }
    }
    const ctx = { rng, entry, seed, queues, popularity: gs.popularity, splitOrStealOn, closed: false };
    const day = entry.moment === 'reunion' ? [] : generateEpisodeEvents(state, rng);
    state.history.push(...day);
    const m = MOMENTS[entry.moment](state, ctx);
    state.history.push(...m.events);
    const exits = [...m.exits];
    if (!ctx.closed) closeEpisode(state.ledger, state.ep, gs.popularity);
    if (entry.moment !== 'reunion' && entry.moment !== 'final') {
      const walker = maybeWalk(state, rng);
      if (walker) {
        const ev = makeEvent(state, rng, { phase: 'firepit', kind: 'walk', players: [walker], aired: true,
          major: [walker], extra: { pop: { [walker]: { approval: 3, fame: 2 } } } });
        m.events.push(ev); state.history.push(ev);
        state.villa = state.villa.filter(n => n !== walker);
        exits.push({ name: walker, verb: 'walked', channel: 'walk' });
      }
    }
    if (m.extra?.final) final = m.extra.final;
    const snap = ledgerSnapshot(state.ledger);
    gs.activePlayers = [...state.villa];
    gs.episodeHistory.push({
      num: entry.ep, format: PERFECT_MATCH_FORMAT, days: entry.days, moment: entry.moment,
      eliminated: exits.find(x => x.verb === 'dumped')?.name || null,
      exits, votes: m.ballots,
      pm: { events: [...day, ...m.events], couples: state.couples.map(c => [...c]), villa: [...state.villa],
        shares: m.extra?.shares || null, bottom: m.extra?.bottom || null,
        majors: [...new Set([...day, ...m.events].flatMap(e => e.aired ? e.major : []))],
        labels: snap.label, approval: snap.approval, fame: snap.fame,
        envelope: m.extra?.envelope || null, revealed: m.extra?.revealed || null,
        bonds: Object.fromEntries(state.couples.map(([a, b]) => [`${a}|${b}`, getBond(a, b)])) },
    });
  }
  const winners = final ? [...final[0].couple] : [];
  return { rows: gs.episodeHistory, winners, final, state };
}
```

- [ ] **Step 6: Run the season tests**

Run: `npx vitest run tests/pm-season.test.js`
Expected: PASS (5 tests). If "villa episodes carry about a hundred events" fails on an episode, print `r.moment` and `r.pm.events.length`: a phase that cannot cast (e.g. no couples in a room during Casa) returns short — widen that phase's kind list with `friendship`/`comedy`, which always cast, rather than lowering the bound.

- [ ] **Step 7: Run every pm test**

Run: `npx vitest run tests/pm-`
Expected: all pass.

- [ ] **Step 8: Commit**

```bash
git add js/pm/schedule.js js/pm/moments.js js/pm/season.js tests/pm-season.test.js
git commit -m "feat(perfect-match): the sixteen-episode season loop, dumping scene and reunion"
```

---

### Task 9b: Wire the three layers into every decision, and the two manipulation events

Tasks 6–9 were written against `getPerceivedBond` and a single attraction
number. This task switches every islander decision onto spec §6.3 — **my own
feelings, and what I believe you feel** — adds the two scheme events, and
snapshots relationships per episode so the viewer can replay an old episode
(ADDING-A-SHOW §11.5 B).

**Files:**
- Modify: `js/pm/recoupling.js` (`desire`)
- Modify: `js/pm/casa.js` (twist score)
- Modify: `js/pm/villa-vote.js` (`affinity`)
- Modify: `js/pm/events.js` (gossip reveals truth; `love-bomb`, `gaslight`; faking huts)
- Modify: `js/pm/season.js` (layers each episode; relationship snapshot on the row)
- Test: `tests/pm-relationships.test.js`

**Interfaces:**
- Consumes: `romance`, `friendship`, `shown`, `believed`, `setMask`, `revealTruth`, `schemeEligible`, `growLove`, `updateBeliefs`, `decideMasks`, `relationshipLabel` (Task 3b).
- Produces: `row.pm.relationships = { 'A→B': [romance, friendship, shown, believedByB] }` for every compatible or non-neutral pair, and `row.pm.relLabels = [[a, b, kind, text], ...]`.

- [ ] **Step 1: Write the failing test** — `tests/pm-relationships.test.js`

```js
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setPlayers } from '../js/core.js';
import { playPerfectMatchSeason } from '../js/pm/season.js';
import { schemeEligible } from '../js/pm/feelings.js';
import { makeIslanders, roleSetup } from './helpers/pm-cast.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\r\n]*/g, '');

function season(seed) {
  const cast = makeIslanders(22, seed);
  setPlayers(cast);
  const names = cast.map(p => p.name);
  return playPerfectMatchSeason({ cast: names, setup: roleSetup(names), seed });
}

describe('relationships are one-way and layered, and reach the row', () => {
  it('every villa episode snapshots relationships and labels', () => {
    const { rows } = season(1);
    for (const r of rows.filter(x => x.moment !== 'reunion')) {
      expect(Object.keys(r.pm.relationships).length).toBeGreaterThan(10);
      expect(Array.isArray(r.pm.relLabels)).toBe(true);
    }
  });

  it('romance is not symmetric: most pairs differ by direction', () => {
    const { rows } = season(2);
    const rel = rows[6].pm.relationships;
    let pairs = 0, differ = 0;
    for (const [k, [r]] of Object.entries(rel)) {
      const [a, b] = k.split('→'); const back = rel[`${b}→${a}`];
      if (!back || a > b) continue;
      pairs++; if (Math.abs(r - back[0]) >= 1) differ++;
    }
    expect(differ / pairs).toBeGreaterThan(0.5);
  });

  it('over ten seasons, the relationship shapes all appear', () => {
    const seen = new Set();
    for (let s = 1; s <= 10; s++) for (const r of season(s).rows) for (const [, , , text] of r.pm.relLabels) seen.add(text);
    for (const want of ['Hidden crush', 'One-way crush', 'Just friends', 'Coupled']) expect(seen).toContain(want);
  });

  it('faking and manipulation only ever come from scheme-eligible islanders', () => {
    for (let s = 1; s <= 10; s++) {
      const { rows, state } = season(s);
      for (const r of rows) {
        for (const [a, , , text] of r.pm.relLabels) if (text === 'Faking it') expect(schemeEligible(state.profiles[a]), a).toBe(true);
        for (const e of r.pm.events.filter(e => e.kind === 'love-bomb' || e.kind === 'gaslight')) {
          expect(schemeEligible(state.profiles[e.players[0]]), e.players[0]).toBe(true);
        }
      }
    }
  });

  it('no decision file reads another islander\'s true romance toward the decider', () => {
    // A decision may call romance(me, you) and believed(state, me, you) — never romance(you, me).
    for (const f of ['recoupling.js', 'casa.js', 'villa-vote.js']) {
      const src = strip(readFileSync(join(ROOT, 'js', 'pm', f), 'utf8'));
      expect(src, f).not.toMatch(/romance\(\s*c\s*,\s*p\s*\)|romance\(\s*p\s*,\s*o\s*\)/);
      expect(src, f).not.toMatch(/getPerceivedBond/);
    }
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run tests/pm-relationships.test.js`
Expected: FAIL — `row.pm.relationships` is undefined.

- [ ] **Step 3: Recoupling reads my feelings and my belief** — in `js/pm/recoupling.js`, replace the import of `getPerceivedBond` with:

```js
import { romance, friendship, believed } from './feelings.js';
```

replace the three lines that compute `conn`, `att` and `safety` in `desire` with:

```js
  // My feelings for you, and what I BELIEVE you feel for me (spec §6.3).
  const conn = (romance(p, c) + Math.max(0, friendship(p, c)) * 0.5) / 10;
  const att = (attr(state, p, c) ?? 0) / 10;
  const safety = (believed(state, p, c) / 10) * (s.strategic / 10);
```

and change the signature and call sites from `{ bond, rng, taken }` to `{ rng, taken }`:
`function desire(state, p, c, { rng, taken }) {`, `export function runRecoupling(state, { rng, pickerGender }) {`, `const ctx = { rng, taken };`.

In `tests/pm-recoupling.test.js`, the loyal-couple case now sets feelings instead of a bond — replace `setBond(f, m, 9);` with:

```js
    setRelationshipDimension(f, m, 'attraction', 9); setRelationshipDimension(f, m, 'love', 8);
    setRelationshipDimension(m, f, 'attraction', 9); setRelationshipDimension(m, f, 'love', 8);
```

and its import line `import { setBond } from '../js/bonds.js';` with
`import { setRelationshipDimension } from '../js/relationships.js';`.

- [ ] **Step 4: Casa reads my feelings and what I believe** — in `js/pm/casa.js`, replace `import { getPerceivedBond } from '../bonds.js';` with `import { romance, believed } from './feelings.js';`, the signature with `export function stickOrTwist(state, { rng }) {`, and the `conn` / `fear` lines with:

```js
    const conn = p ? romance(o, p) / 10 : 0;
    // Fear: I know they strayed, or I believe they feel less than I do.
    const fear = p ? (state.secrets.some(x => x.known && x.who === p && x.partner === o) ? 0.25 : 0)
      + 0.2 * Math.max(0, romance(o, p) - believed(state, o, p)) / 10 : 0;
```

- [ ] **Step 5: Villa votes read friendship** — in `js/pm/villa-vote.js`, replace `import { getPerceivedBond } from '../bonds.js';` with `import { friendship } from './feelings.js';`, drop the `bond` parameter everywhere (`affinity(state, v, t)`, `villaDumping(state, { format, bottom, rng })`), and make `affinity` return `friendship(v, t) - threat`.

- [ ] **Step 6: Events — gossip reveals the truth; faking huts; the two scheme events** — in `js/pm/events.js`:

Add the import:
```js
import { romance, shown, setMask, revealTruth, schemeEligible } from './feelings.js';
```

In `gossip.apply`, after `if (sec) sec.known = true;` add:
```js
      revealTruth(s, p, x);                 // p now knows what x feels
```

In `makeEvent`, change the stance line so a faker's hut is two-faced too:
```js
    const faking = players.some(o => o !== who && shown(state, who, o) - romance(who, o) >= 3);
    const stance = faking || state.secrets.some(x => !x.known && x.who === who) ? 'two-faced' : 'honest';
```

Add two kinds to `KINDS` (before the moment kinds):
```js
  // ── EMOTIONAL MANIPULATION — scheme-eligible only (spec §6.5) ─────────
  'love-bomb': {
    salience: 0.55,
    tpl: ['{a} tells {b} this is the realest thing {a} has ever felt.', '{a} plans {b} a surprise on the terrace, candles and all.'],
    cast: (s, rng) => pick(rng, s.couples.flatMap(([x, y]) => [[x, y], [y, x]])
      .filter(([a, b]) => schemeEligible(s.profiles[a]) && shown(s, a, b) - romance(a, b) >= 3)),
    apply: (s, ev) => {
      const [a, b] = ev.players;
      setMask(s, a, b, shown(s, a, b) + 1);
      const bel = (s.believes ||= {});
      bel[`${b}:${a}→${b}`] = Math.min(10, (bel[`${b}:${a}→${b}`] ?? shown(s, a, b)) + 1.5);
      addRelationshipDimension(b, a, 'love', 0.6);
      return { pop: { ...pop1(a, 0.3, 1.5), ...pop1(b, 0.2, 1) } };
    },
  },
  gaslight: {
    salience: 0.9,
    tpl: ['{b} confronts {a}. {a}: "You\'re being paranoid. This is why I pulled away."', '{a} tells {b} the jealousy is the problem, not what {a} did.'],
    cast: (s, rng) => pick(rng, s.secrets.filter(x => x.known && schemeEligible(s.profiles[x.who])
      && s.couples.some(c => c.includes(x.who) && c.includes(x.partner))).map(x => [x.who, x.partner])),
    apply: (s, ev) => {
      const [a, b] = ev.players;
      const key = `${b}:${a}→${b}`;
      const bel = (s.believes ||= {});
      bel[key] = Math.min(10, (bel[key] ?? 0) + 2);   // pulled back into doubting herself
      addRelationshipDimension(b, a, 'trust', -1.5);
      return { pop: { ...pop1(a, -3, 2), ...pop1(b, 1, 1.5) }, major: [a, b] };
    },
  },
```

and add them to the evening phase:
```js
  evening: [['kiss', 3], ['deep-chat', 2], ['pull', 2], ['argument', 1.5], ['gossip', 1.5], ['friendship', 1],
    ['love-bomb', 0.8], ['gaslight', 0.8]],
```

Also import `addRelationshipDimension`: `import { addRelationshipDimension } from '../relationships.js';`.

- [ ] **Step 7: The season runs the layers and snapshots them** — in `js/pm/season.js`:

Add imports:
```js
import { romance, friendship, shown, believed, growLove, updateBeliefs, decideMasks,
  relationshipLabel } from './feelings.js';
import { compatible } from './chemistry.js';
```

In `initState`, add `shows: {}, believes: {},` to the state object.

In the loop, right after `state.history.push(...day);` add:
```js
    // Feelings move once a day's worth of events has happened: love grows in
    // couples, masks are chosen, beliefs drift toward what was shown.
    const mrng = streamFor(seed, `mask:${entry.ep}`);
    growLove(state, state.couples);
    decideMasks(state, mrng);
    updateBeliefs(state);
```

Add this function above `playPerfectMatchSeason`:
```js
/** Per-episode relationship snapshot, so an old episode replays its own hearts (§11.5 B). */
function relationshipSnapshot(state) {
  const rel = {}, labels = [];
  for (const a of state.villa) for (const b of state.villa) {
    if (a === b) continue;
    const r = romance(a, b), f = friendship(a, b);
    if (!compatible(state, a, b) && Math.abs(f) < 3) continue;
    rel[`${a}→${b}`] = [r, Math.round(f * 100) / 100, shown(state, a, b), believed(state, b, a)];
    const l = relationshipLabel(state, a, b);
    if (l) labels.push([a, b, l[0], l[1]]);
  }
  return { rel, labels };
}
```

and in the row's `pm:` object add:
```js
        ...(({ rel, labels }) => ({ relationships: rel, relLabels: labels }))(relationshipSnapshot(state)),
```

- [ ] **Step 8: Run the relationship tests and every pm test**

Run: `npx vitest run tests/pm-`
Expected: all pass. If "the relationship shapes all appear" misses `Hidden crush`, print the label counts per season: `decideMasks` needs coupled islanders with a crush on someone else, so check that `growLove`/events are not pinning every attraction toward the partner.

- [ ] **Step 9: Commit**

```bash
git add js/pm/recoupling.js js/pm/casa.js js/pm/villa-vote.js js/pm/events.js js/pm/season.js tests/pm-relationships.test.js tests/pm-recoupling.test.js
git commit -m "feat(perfect-match): decisions read my feelings and my beliefs; love-bombing and gaslighting"
```

---

### Task 10: The ledger-reader rule, as a guard

**Files:**
- Test: `tests/pm-ledger-readers.test.js`

- [ ] **Step 1: Write the guard**

```js
// The rule this show owns (spec §8): the public vote and a bombshell's
// arrival read the public ledger; no islander decision may. Stated over the
// source, like tests/tr-audience.test.js, because a leak is invisible from
// outside: every season still plays.
import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIR = join(ROOT, 'js', 'pm');
const ALLOWED = new Set(['ledger.js', 'public-vote.js', 'arrivals.js', 'season.js']);
const READERS = /\b(readApproval|coupleScore|followers|ledgerSnapshot)\b|\.approval\s*\[|\.fame\s*\[/;
const strip = src => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\r\n]*/g, '');

describe('only the public reads the public ledger', () => {
  const files = readdirSync(DIR).filter(f => f.endsWith('.js'));
  it('finds the engine', () => { expect(files.length).toBeGreaterThanOrEqual(12); });
  for (const f of files) {
    if (ALLOWED.has(f)) continue;
    it(`${f} makes no decision from approval or fame`, () => {
      expect(strip(readFileSync(join(DIR, f), 'utf8'))).not.toMatch(READERS);
    });
  }
  it('fails when a decision file reads approval (mutation check)', () => {
    expect(strip('const x = readApproval(state.ledger, n);')).toMatch(READERS);
    expect(strip('// readApproval is forbidden here')).not.toMatch(READERS);
  });
});
```

- [ ] **Step 2: Run it**

Run: `npx vitest run tests/pm-ledger-readers.test.js`
Expected: PASS. Then prove it can fail: temporarily add `readApproval;` to the end of `js/pm/recoupling.js`, run again, expect FAIL naming `recoupling.js`, then remove the line with an inverse edit (never `git checkout` the file — §14.13).

- [ ] **Step 3: Commit**

```bash
git add tests/pm-ledger-readers.test.js
git commit -m "test(perfect-match): islander decisions never read the public ledger"
```

---

### Task 11: No bare randomness, no names in pools

**Files:**
- Test: `tests/pm-engine-rules.test.js`

- [ ] **Step 1: Write the guard**

```js
import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { KINDS } from '../js/pm/events.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIR = join(ROOT, 'js', 'pm');
const strip = src => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\r\n]*/g, '');
const VALID_STATS = ['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty',
  'boldness', 'intuition', 'temperament'];

describe('engine rules', () => {
  for (const f of readdirSync(DIR).filter(x => x.endsWith('.js'))) {
    const src = strip(readFileSync(join(DIR, f), 'utf8'));
    it(`${f} never calls Math.random`, () => { expect(src).not.toMatch(/Math\.random/); });
    it(`${f} reads only the nine stats`, () => {
      for (const [, key] of src.matchAll(/stats\.([a-zA-Z]+)/g)) expect(VALID_STATS).toContain(key);
    });
  }
  it('every template uses placeholders, never a capitalised name', () => {
    for (const [kind, def] of Object.entries(KINDS)) {
      for (const t of def.tpl) expect(t, kind).toMatch(/\{a\}/);
    }
  });
});
```

- [ ] **Step 2: Run it**

Run: `npx vitest run tests/pm-engine-rules.test.js`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add tests/pm-engine-rules.test.js
git commit -m "test(perfect-match): seeded dice only, the nine stats only, placeholder templates"
```

---

### Task 12: `npm run audit:pm-spec`

**Files:**
- Create: `tests/pm-spec-audit.test.js`
- Modify: `package.json` (`scripts`)

The audit is a tool you run and read (spec §15). It prints every rate beside its chance line and asserts only rules, never tuned numbers.

- [ ] **Step 1: Add the script** — `package.json`, after `"audit:dr-balance"`:

```json
    "audit:pm-spec": "vitest run --config vitest.audit.config.js tests/pm-spec-audit.test.js --reporter=verbose",
```

- [ ] **Step 2: Write the audit** — `tests/pm-spec-audit.test.js`

```js
// ══════════════════════════════════════════════════════════════════════
// pm-spec-audit.test.js — a hundred seasons, every rate beside its chance line
// ══════════════════════════════════════════════════════════════════════
//
// Run it and READ it: npm run audit:pm-spec. Spec §15's measurements. Facts
// are captured INSIDE the loop while each season is live (ADDING-A-SHOW §11.5
// T: after the loop, gs is the last season).
import { describe, expect, it } from 'vitest';
import { setPlayers } from '../js/core.js';
import { playPerfectMatchSeason } from '../js/pm/season.js';
import { LABEL_ORDER } from '../js/pm/ledger.js';
import { schemeEligible } from '../js/pm/feelings.js';
import { makeIslanders, roleSetup } from './helpers/pm-cast.js';

const SEASONS = 100;
const pct = (a, b) => (b ? (100 * a / b).toFixed(1) + '%' : 'n/a');
const tier = l => LABEL_ORDER.indexOf(l);

describe('Perfect Match spec audit', () => {
  it('measures a hundred seasons', () => {
    const m = { ffAndVillainBy8: 0, jumps: 0, jumpChecks: 0, invisibleShare: [], famousHated: 0,
      famousTotal: 0, carriedSafe: 0, carriedAtVote: 0, lastPickDecides: 0, recouplingNights: 0,
      twists: { low: [0, 0], high: [0, 0] }, photosSurfaced: 0, steals: 0, envelopes: 0,
      eventsPerEp: [], repeatLines: 0, lines: 0, relSeasons: {}, schemeViolations: 0 };
    const REL_LABELS = ['Hidden crush', 'Faking it', 'All in — alone', 'Not feeling it', 'Friend-zoning',
      'Just friends', "Fancies, can't stand", 'One-way crush', 'Mutual spark', 'Couple for survival'];
    for (let s = 1; s <= SEASONS; s++) {
      const cast = makeIslanders(22, s);
      setPlayers(cast);
      const names = cast.map(p => p.name);
      const { rows, state } = playPerfectMatchSeason({ cast: names, setup: roleSetup(names), seed: s,
        splitOrStealOn: true });
      // 1. the full spectrum by episode 8
      const r8 = rows[7].pm.labels;
      const l8 = Object.values(r8);
      if (l8.includes('fan-favourite') && l8.includes('villain')) m.ffAndVillainBy8++;
      // 2. no jump past two tiers without a major moment
      for (let i = 1; i < rows.length; i++) {
        for (const [n, l] of Object.entries(rows[i].pm.labels)) {
          const before = rows[i - 1].pm.labels[n];
          if (!before) continue;
          m.jumpChecks++;
          if (Math.abs(tier(l) - tier(before)) > 2 && !rows[i].pm.majors.includes(n)) m.jumps++;
        }
      }
      // 3. invisible share, episode by episode
      for (const r of rows) {
        const ls = r.pm.villa.map(n => r.pm.labels[n]).filter(Boolean);
        if (ls.length) m.invisibleShare.push(ls.filter(l => l === 'invisible').length / ls.length);
      }
      // 4. fame and approval not in lockstep
      const last = rows[rows.length - 1].pm;
      const fames = Object.entries(last.fame).sort((a, b) => b[1] - a[1]).slice(0, 5);
      for (const [n] of fames) { m.famousTotal++; if ((last.approval[n] || 0) < -25) m.famousHated++; }
      // 5. carried couples at public votes
      for (const r of rows.filter(x => x.pm.bottom)) {
        const prev = rows[r.num - 2].pm;
        for (const { couple: [a, b] } of r.pm.shares) {
          const x = prev.approval[a] || 0, y = prev.approval[b] || 0;
          if (Math.max(x, y) > 40 && Math.min(x, y) < -20) {
            m.carriedAtVote++;
            if (!r.pm.bottom.some(c => c.includes(a))) m.carriedSafe++;
          }
        }
      }
      // 6. does the LAST recoupling pick decide who is dumped?
      for (const r of rows.filter(x => ['recoupling'].includes(x.moment) && x.exits.length)) {
        const picks = r.pm.events.filter(e => e.kind === 'recouple-pick');
        if (!picks.length) continue;
        m.recouplingNights++;
        if (picks[picks.length - 1].extra.stole) m.lastPickDecides++;
      }
      // 7. Casa twists by loyalty band; the photos surfacing a hidden event
      const casaRow = rows.find(r => r.moment === 'stick-or-twist');
      for (const v of (casaRow?.votes || [])) {
        const band = state.profiles[v.voter].stats.loyalty >= 6 ? 'high' : 'low';
        m.twists[band][1]++; if (v.choice === 'twist') m.twists[band][0]++;
      }
      if (rows.find(r => r.moment === 'photos')?.pm.events.some(e => e.kind === 'photos')) m.photosSurfaced++;
      // 8. the envelope
      const env = rows.find(r => r.pm.envelope)?.pm.envelope;
      if (env) { m.envelopes++; if (env.choice === 'steal') m.steals++; }
      // 10. events per episode, and repeated lines inside a season
      for (const r of rows.filter(x => x.moment !== 'reunion')) m.eventsPerEp.push(r.pm.events.length);
      const seen = new Map();
      for (const e of rows.flatMap(r => r.pm.events)) {
        const key = `${e.tpl}|${e.players.join(',')}`;
        m.lines++; if (seen.has(key)) m.repeatLines++; seen.set(key, true);
      }
      // 11. relationship variety — which shapes this season ever produced
      const had = new Set(rows.flatMap(r => r.pm.relLabels.map(l => l[3])));
      for (const l of REL_LABELS) if (had.has(l)) m.relSeasons[l] = (m.relSeasons[l] || 0) + 1;
      // 12. faking and manipulation from scheme-eligible islanders only
      for (const r of rows) {
        for (const [a, , , text] of r.pm.relLabels) if (text === 'Faking it' && !schemeEligible(state.profiles[a])) m.schemeViolations++;
        for (const e of r.pm.events) if ((e.kind === 'love-bomb' || e.kind === 'gaslight') && !schemeEligible(state.profiles[e.players[0]])) m.schemeViolations++;
      }
    }
    const mean = a => a.reduce((x, y) => x + y, 0) / (a.length || 1);
    console.log(`
PERFECT MATCH — ${SEASONS} seasons
 1. FF + Villain by ep 8 ............ ${pct(m.ffAndVillainBy8, SEASONS)}  (spec: most seasons)
 2. >2-tier jumps without a major ... ${m.jumps} of ${m.jumpChecks}  (rule: 0)
 3. invisible share per episode ..... ${(100 * mean(m.invisibleShare)).toFixed(1)}%  (spec: about 25%)
 4. top-5 fame who are hated ........ ${pct(m.famousHated, m.famousTotal)}  (spec: > 0 — famous and hated exists)
 5. carried couples kept safe ....... ${pct(m.carriedSafe, m.carriedAtVote)} of ${m.carriedAtVote}  (chance: ~ 1 - bottom/couples)
 6. last recoupling pick was a steal  ${pct(m.lastPickDecides, m.recouplingNights)}  (read against the steal rate)
 7. Casa twist, loyalty < 6 ......... ${pct(...m.twists.low)}   loyalty >= 6: ${pct(...m.twists.high)}
    photos surfaced a hidden event .. ${pct(m.photosSurfaced, SEASONS)}
 8. envelope steals ................. ${pct(m.steals, m.envelopes)}  (real UK: 0)
10. events per villa episode ........ mean ${mean(m.eventsPerEp).toFixed(1)}, min ${Math.min(...m.eventsPerEp)}
    repeated line+cast in a season .. ${pct(m.repeatLines, m.lines)}  (Plan 3's pools drive this toward 0)
11. seasons producing each relationship shape (spec: most seasons; 0 = a system that reaches no screen)
${REL_LABELS.map(l => `    ${l.padEnd(24, '.')} ${pct(m.relSeasons[l] || 0, SEASONS)}`).join('\n')}
12. faking / manipulation by a non-schemer  ${m.schemeViolations}  (rule: 0)
`);
    // Rules only. Tuned numbers are read, not asserted.
    expect(m.jumps).toBe(0);
    expect(m.schemeViolations).toBe(0);
    expect(Math.min(...m.eventsPerEp)).toBeGreaterThanOrEqual(80);
    expect(m.twists.low[0] / (m.twists.low[1] || 1)).toBeGreaterThan(m.twists.high[0] / (m.twists.high[1] || 1));
  });
});
```

- [ ] **Step 3: Run it and read every line**

Run: `npm run audit:pm-spec`
Expected: the three rule assertions pass and the table prints. Read each rate against its note. Record the printed table in the commit message. Do not tune constants in this task: any number far from the spec (for example no season with a Fan Favourite and a Villain by episode 8, or invisible share above 60%) is written down as the first item for Plan 3's calibration, with the measurement beside it.

- [ ] **Step 4: Full suite once**

Run: `npm test`
Expected: no new failures against `HEAD`.

- [ ] **Step 5: Commit**

```bash
git add tests/pm-spec-audit.test.js package.json
git commit -m "test(perfect-match): audit:pm-spec, a hundred seasons against the spec"
```

---

## Self-review notes (done while writing)

- Spec coverage for this plan: §2 identity (Task 1), §5 islanders (Task 2), §6 attraction/connection (Tasks 3, 5), §7 knowing (secrets + perceived bonds, Tasks 5–8; guard Task 10), §8 popularity (Task 4, guard Task 10), §9.1–9.6 decisions (Tasks 6–9), §10 dumping scene (Task 9), §11 reunion (Task 9), §15 audit (Task 12). Deferred by the roadmap, not dropped: §12 the tab and §14 run/edit-layer wiring (Plan 3), §4 screens and stage (Plans 2 and 4), §13 export (Plan 5), families visit and Movie Night (Plan 3 event pools).
- Types checked across tasks: `Profile`, `Event`, `state` fields (`villa`, `casa`, `split`, `couples`, `profiles`, `ledger`, `secrets`, `seq`, `recouplings`, `history`, `casaArrivals`, and from Task 9b `shows`, `believes`) are created in `initState` and in each test's fixture. Attraction, love, friendship and trust are NOT on `state` — they are `gs.relationshipDimensions`, through `js/relationships.js`; fixtures that still pass `attraction: {}` are harmless.
- Spec §6 coverage: store widened (Task 3), three layers and labels (Task 3b), every decision on my-feelings-and-my-beliefs, love-bombing and gaslighting, per-episode relationship snapshots (Task 9b), variety and the scheming rule measured (Task 12).
- `closeEpisode` is called exactly once per episode: by `MOMENTS.final` (which sets `ctx.closed`) or by the loop.

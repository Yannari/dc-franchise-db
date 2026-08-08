# Social Voices Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the voice library the live-season feed will speak in — a recurring cast of fans, what they post about, the grammar of the two platforms, and a sampler that prints real output so the voices can be judged.

**Architecture:** Four plain-data modules under `js/social/`, composed procedurally at runtime. No network, no AI, no DOM. Personas hold two independent feelings per player (affection and game respect); topics declare which simulator data they read; platforms own register and engagement; the sampler assembles a post from persona + topic + platform + event.

**Tech Stack:** ES modules, no build step. Vitest.

**Spec:** `docs/superpowers/specs/2026-08-08-social-voices-design.md`

## Global Constraints

Copied from the spec. Every task's requirements implicitly include these.

- **This is project 1 of 3.** It does NOT read real episodes, does NOT persist anything, and does NOT render UI. Those are projects 2 and 3.
- **Data, not code.** Personas, topics and shapes are plain objects. Adding one must never require editing the composer — Codex will extend this library after it ships.
- **Every field is documented where it is defined**, with its range and effect.
- **Cruelty is personal, never bigoted.** Fans may attack looks, personality, competence and gameplay. No string may attack race, sexuality, religion, disability or gender identity. Enforced by a denylist test with a canary.
- **No real person's post is reproduced.** Study structure and register; write the strings fresh.
- **Stats are proportional** — `caps: 0.3` scales frequency; never `if (caps > 0.5)`. This is a project-wide rule (see CLAUDE.md).
- **A fan holds two opinions of a player**: `affection` and `gameRespect`, each `-1..1`, moving independently.
- **Every topic declares the simulator data it reads.** A topic with no data source can never fire.
- Run one test file with `node node_modules/vitest/vitest.mjs run tests/<file>`. Do **not** run the whole suite; it exhausts memory.
- Commit messages are prose sentences, not `feat:`/`fix:` prefixes.
- **Commit with an explicit pathspec** — `git commit -F - -- <paths>`. Another session shares this git index; a bare commit has swept its work twice.

## The join-key trap

**`players_database.json` keys players by SLUG** (`alejandro`, `anne-maria`, `scary-girl`).
**`voice-profiles.json` keys the same people by DISPLAY NAME** (`Alejandro`, `Anne Maria`).

Personas reference players by **slug**, always — that is what the roster and every
other database uses. Anywhere an alumnus's voice profile is needed, the name must
be mapped, never assumed equal. Silently failing this lookup is how the fame work
scored 226 of 262 season details at zero: it looked like weights needing tuning
rather than a broken join.

## File Structure

| File | Responsibility |
|---|---|
| `js/social/personas.js` (create) | The recurring fan cast, the feelings model, and derived loyalties/grudges. |
| `js/social/topics.js` (create) | What gets posted about, and which simulator data each topic reads. |
| `js/social/platforms.js` (create) | The timeline and the group chat: register, length, engagement kinds. |
| `js/social/sampler.js` (create) | Compose a post from persona + topic + platform + event. Print N to read. |
| `tests/social-personas.test.js` (create) | Persona integrity and the feelings model. |
| `tests/social-hostility.test.js` (create) | The denylist guard, with a canary. |
| `tests/social-topics.test.js` (create) | Taxonomy coverage and data sources. |
| `tests/social-sampler.test.js` (create) | Variety, voice separation, both feelings axes. |

### The event shape (project 1's stand-in)

Project 2 will build these from real episodes. Project 1 accepts them as given:

```js
{
  kind: 'blindside',      // see TOPIC data sources for the full list
  subject: 'heather',     // slug — who it happened to
  actor: 'alejandro',     // slug — who did it, when there is one
  season: 15,
  episode: 7,
  format: 'total-drama',
}
```

---

### Task 1: The fan cast and the two-axis feelings model

**Files:**
- Create: `js/social/personas.js`
- Test: `tests/social-personas.test.js`

**Interfaces:**
- Consumes: nothing.
- Produces: `PERSONAS` (array), `ARCHETYPES` (array of strings), `feelingsToward(persona, slug) → {affection, gameRespect}`, `loyaltiesOf(persona) → string[]`, `grudgesOf(persona) → string[]`, `personaByHandle(handle) → persona|null`.

- [ ] **Step 1: Write the failing test**

```js
// tests/social-personas.test.js
// The recurring fans. A named cast that comes back every season and remembers is
// what makes a feed feel alive rather than generated — you learn a handle, and
// then you notice when they change their mind.
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PERSONAS, ARCHETYPES, feelingsToward, loyaltiesOf, grudgesOf, personaByHandle }
  from '../js/social/personas.js';

// process.cwd(), not import.meta.url — vitest rewrites module URLs and a relative
// URL lands at the drive root. tests/multishow-json.test.js says the same.
const roster = JSON.parse(readFileSync(join(process.cwd(), 'players_database.json'), 'utf8'));
const SLUGS = new Set(roster.players.map(p => p.id));

describe('the cast', () => {
  it('has enough regulars to feel like a crowd', () => {
    expect(PERSONAS.length).toBeGreaterThanOrEqual(12);
  });

  it('gives every persona a unique handle', () => {
    const handles = PERSONAS.map(p => p.handle);
    expect(new Set(handles).size, 'two personas share a handle').toBe(handles.length);
    for (const h of handles) expect(h, `${h} is not a handle`).toMatch(/^@[a-z0-9_]+$/);
  });

  it('describes every persona completely', () => {
    for (const p of PERSONAS) {
      expect(ARCHETYPES, `${p.handle} has an unknown archetype`).toContain(p.archetype);
      expect(typeof p.name, `${p.handle} has no display name`).toBe('string');
      expect(p.since, `${p.handle} started watching in an impossible season`).toBeGreaterThan(0);
      expect(p.platforms.length, `${p.handle} posts nowhere`).toBeGreaterThan(0);
      for (const plat of p.platforms) expect(['timeline', 'chat']).toContain(plat);
      for (const k of ['caps', 'emoji']) {
        expect(p.voice[k], `${p.handle}.voice.${k} out of range`).toBeGreaterThanOrEqual(0);
        expect(p.voice[k]).toBeLessThanOrEqual(1);
      }
      expect(p.volatility).toBeGreaterThanOrEqual(0);
      expect(p.volatility).toBeLessThanOrEqual(1);
    }
  });

  it('only has feelings about players who exist', () => {
    // A grudge against a misspelled slug is a history that silently never fires.
    // players_database.json keys on SLUG (anne-maria); voice-profiles.json keys on
    // display name (Anne Maria). Personas use slugs.
    for (const p of PERSONAS) {
      for (const slug of Object.keys(p.feelings || {})) {
        expect(SLUGS.has(slug), `${p.handle} has feelings about "${slug}", who is not on the roster`).toBe(true);
      }
    }
  });

  it('covers every archetype at least once', () => {
    // An archetype nobody has is a word in a list, not a voice in the feed.
    for (const a of ARCHETYPES) {
      expect(PERSONAS.some(p => p.archetype === a), `no persona is a ${a}`).toBe(true);
    }
  });
});

describe('two opinions, not one', () => {
  it('separates liking somebody from rating their game', () => {
    // The axis this fandom runs on: "I adore her and she is playing the worst
    // game I have ever seen" is not expressible with a single number.
    const p = { feelings: { heather: { affection: 0.8, gameRespect: -0.4 } } };
    expect(feelingsToward(p, 'heather')).toEqual({ affection: 0.8, gameRespect: -0.4 });
  });

  it('is neutral about somebody it has never heard of', () => {
    expect(feelingsToward({ feelings: {} }, 'nobody')).toEqual({ affection: 0, gameRespect: 0 });
    expect(feelingsToward({}, 'nobody')).toEqual({ affection: 0, gameRespect: 0 });
  });

  it('derives loyalties and grudges from affection rather than storing them twice', () => {
    const p = { feelings: {
      heather: { affection: 0.8, gameRespect: -0.4 },   // loved
      scott:   { affection: -0.7, gameRespect: 0.9 },   // hated, respected
      beth:    { affection: 0.1, gameRespect: 0.1 },    // neither
    }};
    expect(loyaltiesOf(p)).toEqual(['heather']);
    expect(grudgesOf(p)).toEqual(['scott']);
    // Respecting somebody's game is NOT liking them, and must not create a loyalty.
    expect(loyaltiesOf(p)).not.toContain('scott');
  });

  it('finds a persona by handle, and says so when there is none', () => {
    expect(personaByHandle(PERSONAS[0].handle).handle).toBe(PERSONAS[0].handle);
    expect(personaByHandle('@nobody')).toBe(null);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node node_modules/vitest/vitest.mjs run tests/social-personas.test.js`
Expected: FAIL — cannot resolve `../js/social/personas.js`.

- [ ] **Step 3: Write the implementation**

```js
// js/social/personas.js
// The people watching.
//
// A recurring cast, not a fresh crowd every episode. You learn a handle, and then
// it means something when that account changes its mind — a stan who has defended
// somebody since season 4 reacting to her blindside is a different post from a
// stranger reacting to it.
//
// PLAYERS ARE REFERENCED BY SLUG (`anne-maria`), the key players_database.json
// uses. voice-profiles.json keys the same people by display name (`Anne Maria`);
// anything needing that must map, never assume.

/** The kinds of fan. Every one of these must be represented in PERSONAS. */
export const ARCHETYPES = ['stan', 'hater', 'analyst', 'livefeeder', 'casual', 'chaos', 'shipper'];

/**
 * How a fan feels about one player — TWO independent numbers, not one.
 *
 *   affection    -1..1  do they like this person
 *   gameRespect  -1..1  do they rate how this person is playing
 *
 * They move from different causes and in different directions. A brilliant
 * blindside raises respect and can lower affection. Kindness on a bad night
 * raises affection and does nothing to respect. A steamroll raises respect while
 * draining affection from everyone watching — which is how a dominant winner
 * becomes hated, and it cannot be said with a single like/dislike value.
 */
export function feelingsToward(persona, slug) {
  const f = (persona?.feelings || {})[slug];
  return {
    affection: Number(f?.affection) || 0,
    gameRespect: Number(f?.gameRespect) || 0,
  };
}

const LOYAL_AT = 0.5;
const GRUDGE_AT = -0.5;

/** Who this fan defends. Derived from affection, never stored separately. */
export function loyaltiesOf(persona) {
  return Object.entries(persona?.feelings || {})
    .filter(([, f]) => (Number(f.affection) || 0) >= LOYAL_AT)
    .map(([slug]) => slug);
}

/**
 * Who this fan has never forgiven.
 *
 * Affection only. Respecting somebody's game is not liking them — half this
 * fandom rates a villain's play and still wants them gone.
 */
export function grudgesOf(persona) {
  return Object.entries(persona?.feelings || {})
    .filter(([, f]) => (Number(f.affection) || 0) <= GRUDGE_AT)
    .map(([slug]) => slug);
}

/**
 * The regulars.
 *
 * `since`      the season they started watching — an account that has been here
 *              since season 2 talks about the old days; a new one does not.
 * `voice.caps` 0..1, how often they shout. PROPORTIONAL: it scales frequency,
 *              it is never a threshold that flips.
 * `voice.emoji` 0..1, same.
 * `voice.length` 'short' | 'medium' | 'long'
 * `voice.punctuation` 'none' | 'normal' | 'heavy'
 * `platforms`  'timeline' (public, hostile) and/or 'chat' (hosted, insider)
 * `volatility` 0..1, how fast their opinion turns when something happens
 * `feelings`   slug -> { affection, gameRespect }, both -1..1
 */
export const PERSONAS = [
  {
    handle: '@vetokween', name: 'jules', since: 4, archetype: 'stan',
    voice: { caps: 0.35, emoji: 0.6, length: 'short', punctuation: 'none' },
    platforms: ['timeline'], volatility: 0.7,
    feelings: { heather: { affection: 0.9, gameRespect: -0.3 },
                alejandro: { affection: -0.8, gameRespect: 0.8 } },
  },
  {
    handle: '@blindsidebrain', name: 'marcus', since: 1, archetype: 'analyst',
    voice: { caps: 0.05, emoji: 0.05, length: 'long', punctuation: 'normal' },
    platforms: ['timeline', 'chat'], volatility: 0.2,
    feelings: { alejandro: { affection: 0.1, gameRespect: 0.95 },
                beth: { affection: 0.4, gameRespect: -0.6 } },
  },
  {
    handle: '@feedsat3am', name: 'ro', since: 7, archetype: 'livefeeder',
    voice: { caps: 0.5, emoji: 0.3, length: 'medium', punctuation: 'none' },
    platforms: ['timeline'], volatility: 0.5,
    feelings: { scott: { affection: -0.6, gameRespect: 0.7 } },
  },
  {
    handle: '@notthatdeep', name: 'dee', since: 12, archetype: 'casual',
    voice: { caps: 0.1, emoji: 0.8, length: 'short', punctuation: 'normal' },
    platforms: ['timeline'], volatility: 0.8,
    feelings: {},
  },
  {
    handle: '@ruinedmylife', name: 'kai', since: 3, archetype: 'hater',
    voice: { caps: 0.7, emoji: 0.2, length: 'short', punctuation: 'heavy' },
    platforms: ['timeline'], volatility: 0.4,
    feelings: { alejandro: { affection: -0.95, gameRespect: 0.2 },
                heather: { affection: -0.7, gameRespect: -0.5 } },
  },
  {
    handle: '@twoofthemnow', name: 'sam', since: 9, archetype: 'shipper',
    voice: { caps: 0.4, emoji: 0.9, length: 'short', punctuation: 'none' },
    platforms: ['timeline'], volatility: 0.6,
    feelings: { gwen: { affection: 0.8, gameRespect: 0.2 },
                duncan: { affection: 0.7, gameRespect: 0.1 } },
  },
  {
    handle: '@burnitdown', name: 'pip', since: 6, archetype: 'chaos',
    voice: { caps: 0.6, emoji: 0.5, length: 'short', punctuation: 'heavy' },
    platforms: ['timeline'], volatility: 0.95,
    feelings: {},
  },
  {
    handle: '@quietgamer', name: 'noor', since: 2, archetype: 'analyst',
    voice: { caps: 0.0, emoji: 0.1, length: 'long', punctuation: 'normal' },
    platforms: ['chat'], volatility: 0.15,
    feelings: { courtney: { affection: 0.3, gameRespect: 0.8 } },
  },
  {
    handle: '@justiceforher', name: 'tam', since: 8, archetype: 'stan',
    voice: { caps: 0.55, emoji: 0.4, length: 'medium', punctuation: 'heavy' },
    platforms: ['timeline'], volatility: 0.75,
    feelings: { courtney: { affection: 0.85, gameRespect: 0.1 } },
  },
  {
    handle: '@compbeastwatch', name: 'ezra', since: 5, archetype: 'livefeeder',
    voice: { caps: 0.2, emoji: 0.2, length: 'medium', punctuation: 'normal' },
    platforms: ['timeline', 'chat'], volatility: 0.3,
    feelings: { scott: { affection: 0.2, gameRespect: 0.85 } },
  },
  {
    handle: '@casualviewer99', name: 'bex', since: 14, archetype: 'casual',
    voice: { caps: 0.15, emoji: 0.7, length: 'short', punctuation: 'normal' },
    platforms: ['timeline'], volatility: 0.9,
    feelings: {},
  },
  {
    handle: '@theeditlies', name: 'wren', since: 3, archetype: 'hater',
    voice: { caps: 0.45, emoji: 0.15, length: 'medium', punctuation: 'heavy' },
    platforms: ['timeline', 'chat'], volatility: 0.35,
    feelings: { beth: { affection: -0.55, gameRespect: -0.7 },
                gwen: { affection: 0.6, gameRespect: 0.3 } },
  },
];

/** One regular, by handle. Null rather than undefined, so a miss is obvious. */
export function personaByHandle(handle) {
  return PERSONAS.find(p => p.handle === handle) || null;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node node_modules/vitest/vitest.mjs run tests/social-personas.test.js`
Expected: PASS, 8 tests.

If the roster check fails, a slug in `feelings` is wrong — look it up in
`players_database.json` rather than guessing at the spelling.

- [ ] **Step 5: Commit**

```bash
git commit -F - -- js/social/personas.js tests/social-personas.test.js <<'EOF'
The people watching, and the two opinions they hold

A fan likes you and rates your game separately. "I adore her and she is playing
the worst game I have ever seen" is one of the most common posts in this fandom,
and one like/dislike number cannot say it.
EOF
```

---

### Task 2: The hostility guard

**Files:**
- Create: `tests/social-hostility.test.js`

**Interfaces:**
- Consumes: `PERSONAS` (Task 1); later `TOPICS` and `PLATFORMS` as they appear.
- Produces: nothing importable. This task's deliverable is the guard itself.

Built now, before the bulk of the strings exist, so it constrains the library as
it grows rather than being retrofitted over content already written.

- [ ] **Step 1: Write the guard**

```js
// tests/social-hostility.test.js
// Where the cruelty stops.
//
// This feed is meant to be genuinely nasty — reality-TV fandom is vicious, and a
// sanitised version would be a lie about what these shows do to people. Fans can
// call somebody fake, insufferable, a coward, a floater, the worst winner in
// franchise history, ugly inside and out.
//
// What they cannot do is attack race, sexuality, religion, disability or gender
// identity. The cast carries canonical ethnicities and sexualities, and that is
// the line where "depicting a pile-on" becomes "generating slurs about a gay
// character".
//
// This is a guard about CONTENT, and it runs over every string the library
// holds — so a contribution that crosses the line fails immediately instead of
// being caught in review, or not at all. Codex is expected to add to this
// library; the test is the contract.
import { describe, expect, it } from 'vitest';
import { PERSONAS } from '../js/social/personas.js';

/**
 * Terms that mark an attack on a protected characteristic.
 *
 * Deliberately broad and deliberately blunt: a false positive costs one reworded
 * line, a false negative ships a slur. Word-boundary matched so "classic" does
 * not trip on "ass".
 */
const FORBIDDEN = [
  // race / ethnicity / nationality
  'racist', 'racial', 'ghetto', 'thug', 'savage', 'exotic', 'go back to',
  'your people', 'articulate for', 'ching', 'chink', 'spic', 'wetback',
  // sexuality / gender identity
  'faggot', 'fag', 'dyke', 'tranny', 'shemale', 'homo', 'gay agenda',
  'not a real man', 'not a real woman', 'it/its',
  // religion
  'terrorist', 'jihad', 'christ killer', 'raghead',
  // disability / neurodivergence
  'retard', 'retarded', 'spastic', 'cripple', 'psycho ward', 'autistic as an insult',
];

/** Every string the library holds, with a label saying where it came from. */
function allStrings() {
  const out = [];
  const walk = (node, where) => {
    if (typeof node === 'string') { out.push({ text: node, where }); return; }
    if (Array.isArray(node)) return node.forEach((v, i) => walk(v, `${where}[${i}]`));
    if (node && typeof node === 'object') {
      return Object.entries(node).forEach(([k, v]) => walk(v, `${where}.${k}`));
    }
  };
  walk(PERSONAS, 'personas');
  return out;
}

/** Does this string cross the line? Returns the term it crossed on, or null. */
export function crossesTheLine(text) {
  const lower = String(text).toLowerCase();
  for (const term of FORBIDDEN) {
    const pattern = new RegExp(`(^|[^a-z])${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-z]|$)`);
    if (pattern.test(lower)) return term;
  }
  return null;
}

describe('the line the library must not cross', () => {
  it('holds no attack on a protected characteristic', () => {
    const offences = allStrings()
      .map(s => ({ ...s, term: crossesTheLine(s.text) }))
      .filter(s => s.term);
    expect(offences.map(o => `${o.where}: "${o.term}"`),
      'a string in the library attacks a protected characteristic').toEqual([]);
  });

  it('actually catches one when it is there', () => {
    // The canary. A guard that has only ever seen clean input has not been
    // tested — it has been assumed. This repo shipped a registry guard that was
    // silently passing because its pattern could not match the shape it was
    // written to catch.
    expect(crossesTheLine('she is such a retard')).toBe('retard');
    expect(crossesTheLine('typical THUG behaviour')).toBe('thug');
    expect(crossesTheLine('go back to where you came from')).toBe('go back to');
  });

  it('still allows fandom to be vicious', () => {
    // If this fails, the guard is too broad and has eaten the feature.
    for (const line of [
      'she is the single worst winner this franchise has ever produced',
      'insufferable. fake. i cannot watch another second of this',
      'he is a coward and a floater and he will be in the final two anyway',
      'that was the dumbest move i have seen in fifteen seasons',
      'ugly personality, uglier gameplay',
    ]) {
      expect(crossesTheLine(line), `the guard blocked legitimate fandom: "${line}"`).toBe(null);
    }
  });
});
```

- [ ] **Step 2: Run it**

Run: `node node_modules/vitest/vitest.mjs run tests/social-hostility.test.js`
Expected: PASS, 3 tests. The canary proves the guard works; the vicious-but-clean
cases prove it has not eaten the feature.

- [ ] **Step 3: Commit**

```bash
git commit -F - -- tests/social-hostility.test.js <<'EOF'
Where the cruelty stops

The feed is meant to be genuinely nasty; what it may not do is attack race,
sexuality, religion or disability. Enforced over every string the library holds,
with a canary proving the guard catches a planted line and a set of legitimately
vicious posts proving it has not eaten the feature.
EOF
```

---

### Task 3: What they post about

**Files:**
- Create: `js/social/topics.js`
- Test: `tests/social-topics.test.js`
- Modify: `tests/social-hostility.test.js` (walk `TOPICS` too)

**Interfaces:**
- Consumes: nothing from Task 1.
- Produces: `TOPICS` (array), `EVENT_KINDS` (array), `topicsFor(eventKind, stream) → topic[]`.

- [ ] **Step 1: Write the failing test**

```js
// tests/social-topics.test.js
// What a fandom actually talks about.
//
// A feed that only discusses strategy is a podcast. The taxonomy here is taken
// from observed discourse: fans defended Taylor Hale against her EDIT in Big
// Brother 24, and raised alarm over a Big Brother 27 showmance that read as
// love-bombing rather than romance — so "showmance concern" is its own topic,
// distinct from "showmance hate". Neither would have been invented from a chair.
import { describe, expect, it } from 'vitest';
import { TOPICS, EVENT_KINDS, topicsFor } from '../js/social/topics.js';

describe('the taxonomy', () => {
  it('covers social ground, not just gameplay', () => {
    const ids = TOPICS.map(t => t.id);
    for (const needed of [
      'strategy-critique', 'steamroll-fatigue', 'blindside-reaction',
      'harassment-defence', 'edit-critique', 'kindness-noticed',
      'shipping', 'thirst', 'showmance-hate', 'showmance-concern',
      'love-them-hate-their-game', 'hate-them-rate-their-game',
      'production-critique', 'pile-on', 'fandom-infighting',
    ]) {
      expect(ids, `the taxonomy is missing ${needed}`).toContain(needed);
    }
  });

  it('describes every topic completely', () => {
    for (const t of TOPICS) {
      expect(typeof t.id).toBe('string');
      expect(['timeline', 'chat', 'both'], `${t.id} posts nowhere real`).toContain(t.stream);
      expect(t.reads.length, `${t.id} reads no simulator data`).toBeGreaterThan(0);
      expect(t.shapes.length, `${t.id} has no post shapes`).toBeGreaterThan(0);
      for (const kind of t.triggers) {
        expect(EVENT_KINDS, `${t.id} triggers on unknown event "${kind}"`).toContain(kind);
      }
    }
  });

  it('gives every topic a way to fire', () => {
    // A topic with no trigger reads as breadth in the file and appears nowhere on
    // screen. This repo has shipped that three times: an export path with no
    // caller, a viewer announcement that never fired, a STEAL_LIMIT that lived
    // only in comments.
    for (const t of TOPICS) {
      expect(t.triggers.length, `${t.id} can never fire`).toBeGreaterThan(0);
    }
  });

  it('gives every event kind at least one topic', () => {
    // The other direction: an event nothing reacts to is silence where the feed
    // should be loudest.
    for (const kind of EVENT_KINDS) {
      expect(TOPICS.some(t => t.triggers.includes(kind)),
        `nothing reacts to a "${kind}" event`).toBe(true);
    }
  });

  it('finds the topics for an event, filtered by stream', () => {
    const timeline = topicsFor('blindside', 'timeline');
    expect(timeline.length).toBeGreaterThan(0);
    expect(timeline.every(t => t.stream === 'timeline' || t.stream === 'both')).toBe(true);

    const chat = topicsFor('blindside', 'chat');
    expect(chat.every(t => t.stream === 'chat' || t.stream === 'both')).toBe(true);

    expect(topicsFor('not-an-event', 'timeline')).toEqual([]);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node node_modules/vitest/vitest.mjs run tests/social-topics.test.js`
Expected: FAIL — cannot resolve `../js/social/topics.js`.

- [ ] **Step 3: Write the implementation**

```js
// js/social/topics.js
// What the audience talks about.
//
// Taken from observed discourse rather than invented. Two entries here exist
// because real seasons produced them: fans defended Taylor Hale against how
// production EDITED her in Big Brother 24, and fans raised alarm over a Big
// Brother 27 showmance that read as love-bombing rather than romance. The second
// is why `showmance-concern` is separate from `showmance-hate` — they are
// different feelings pointed at different targets.
//
// EVERY TOPIC DECLARES WHAT IT READS. A topic with no data source behind it can
// never fire, and reads as breadth in this file while appearing nowhere on
// screen.

/** The events project 2 will hand us. A topic may only trigger on these. */
export const EVENT_KINDS = [
  'blindside', 'eviction', 'comp-win', 'nomination', 'veto-used',
  'showmance-formed', 'showmance-broken', 'romantic-spark',
  'alliance-formed', 'betrayal', 'argument', 'kindness',
  'ganging-up', 'domination', 'twist', 'finale', 'episode-aired',
];

/**
 * A topic.
 *
 *   id        stable identifier
 *   stream    'timeline' (public) | 'chat' (hosted) | 'both'
 *   triggers  which EVENT_KINDS produce it
 *   reads     which simulator data it needs — documentation AND a promise that
 *             project 2 must supply it
 *   weight    0..1, relative likelihood before persona feelings are applied
 *   shapes    the post forms this topic can take
 */
export const TOPICS = [
  // ── gameplay ────────────────────────────────────────────────────────────
  { id: 'strategy-critique', stream: 'both', weight: 0.8,
    triggers: ['eviction', 'nomination', 'veto-used', 'betrayal'],
    reads: ['votes', 'nominations', 'alliances'],
    shapes: ['hot-take', 'thread-opener', 'quote-dunk'] },

  { id: 'blindside-reaction', stream: 'both', weight: 1.0,
    triggers: ['blindside'],
    reads: ['votes', 'perceivedBonds'],
    shapes: ['live-reaction', 'dunk', 'disbelief'] },

  { id: 'comp-talk', stream: 'both', weight: 0.6,
    triggers: ['comp-win'],
    reads: ['chalMemberScores', 'challengeRecord'],
    shapes: ['hot-take', 'stat-drop'] },

  { id: 'steamroll-fatigue', stream: 'both', weight: 0.7,
    triggers: ['domination', 'eviction', 'episode-aired'],
    reads: ['alliances', 'votes', 'seasonArc'],
    shapes: ['complaint', 'resigned', 'quote-dunk'] },

  { id: 'prediction', stream: 'chat', weight: 0.5,
    triggers: ['episode-aired', 'nomination', 'finale'],
    reads: ['alliances', 'placementOdds'],
    shapes: ['prediction', 'insider-read'] },

  { id: 'legacy-take', stream: 'both', weight: 0.4,
    triggers: ['finale', 'eviction'],
    reads: ['careerTotals', 'franchiseRecords'],
    shapes: ['hot-take', 'ranking'] },

  { id: 'production-critique', stream: 'timeline', weight: 0.5,
    triggers: ['twist', 'episode-aired'],
    reads: ['twists'],
    shapes: ['complaint', 'conspiracy'] },

  // ── social ──────────────────────────────────────────────────────────────
  { id: 'harassment-defence', stream: 'both', weight: 0.9,
    triggers: ['ganging-up', 'argument'],
    reads: ['campEvents', 'socialManipulation', 'bonds'],
    shapes: ['defence', 'call-out', 'pile-on-against-the-house'] },

  { id: 'edit-critique', stream: 'timeline', weight: 0.6,
    triggers: ['episode-aired', 'argument'],
    reads: ['screenTime', 'popularity'],
    shapes: ['call-out', 'complaint'] },

  { id: 'kindness-noticed', stream: 'both', weight: 0.5,
    triggers: ['kindness'],
    reads: ['campEvents', 'bonds'],
    shapes: ['appreciation', 'soft-take'] },

  { id: 'personality-clash', stream: 'timeline', weight: 0.5,
    triggers: ['argument'],
    reads: ['campEvents', 'bonds'],
    shapes: ['hot-take', 'dunk'] },

  // ── romantic ────────────────────────────────────────────────────────────
  { id: 'shipping', stream: 'timeline', weight: 0.7,
    triggers: ['romantic-spark', 'episode-aired'],
    reads: ['romanticSparks', 'bonds'],
    shapes: ['ship', 'gushing'] },

  { id: 'thirst', stream: 'timeline', weight: 0.6,
    triggers: ['episode-aired', 'comp-win'],
    reads: ['roster'],
    shapes: ['thirst', 'gushing'] },

  { id: 'showmance-hate', stream: 'timeline', weight: 0.6,
    triggers: ['showmance-formed'],
    reads: ['showmances'],
    shapes: ['complaint', 'dunk'] },

  { id: 'showmance-concern', stream: 'both', weight: 0.6,
    triggers: ['showmance-formed', 'argument'],
    reads: ['showmances', 'bonds', 'campEvents'],
    shapes: ['concern', 'call-out'] },

  { id: 'breakup-reaction', stream: 'timeline', weight: 0.5,
    triggers: ['showmance-broken'],
    reads: ['showmances'],
    shapes: ['live-reaction', 'gloating', 'sympathy'] },

  // ── character ───────────────────────────────────────────────────────────
  { id: 'love-them-hate-their-game', stream: 'both', weight: 0.7,
    triggers: ['eviction', 'nomination', 'episode-aired'],
    reads: ['popularity', 'votes'],
    shapes: ['conflicted', 'soft-take'] },

  { id: 'hate-them-rate-their-game', stream: 'both', weight: 0.7,
    triggers: ['blindside', 'comp-win', 'betrayal'],
    reads: ['popularity', 'votes'],
    shapes: ['conflicted', 'grudging-respect'] },

  { id: 'favourite-declaration', stream: 'timeline', weight: 0.5,
    triggers: ['episode-aired', 'comp-win', 'kindness'],
    reads: ['popularity'],
    shapes: ['gushing', 'stan-post'] },

  // ── meta ────────────────────────────────────────────────────────────────
  { id: 'pile-on', stream: 'timeline', weight: 0.8,
    triggers: ['blindside', 'betrayal', 'argument', 'eviction'],
    reads: ['popularity'],
    shapes: ['dunk', 'ratio-bait', 'pile-on-reply'] },

  { id: 'fandom-infighting', stream: 'timeline', weight: 0.4,
    triggers: ['episode-aired', 'eviction'],
    reads: ['popularity'],
    shapes: ['quote-dunk', 'subtweet'] },
];

/** The topics that could fire for this event, on this stream. */
export function topicsFor(eventKind, stream) {
  return TOPICS.filter(t =>
    t.triggers.includes(eventKind) && (t.stream === stream || t.stream === 'both'));
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node node_modules/vitest/vitest.mjs run tests/social-topics.test.js`
Expected: PASS, 5 tests.

- [ ] **Step 5: Extend the hostility guard to cover topics**

In `tests/social-hostility.test.js`, import `TOPICS` and walk it too:

```js
import { TOPICS } from '../js/social/topics.js';
```

and inside `allStrings()`, after the personas walk:

```js
  walk(TOPICS, 'topics');
```

Re-run: `node node_modules/vitest/vitest.mjs run tests/social-hostility.test.js`
Expected: PASS, 3 tests — the guard now covers both files.

- [ ] **Step 6: Commit**

```bash
git commit -F - -- js/social/topics.js tests/social-topics.test.js tests/social-hostility.test.js <<'EOF'
A fandom talks about far more than strategy

Harassment defence, edit critique, shipping, thirst, showmance hate AND showmance
concern, steamroll fatigue, loving somebody while hating their game. Two of these
exist because real seasons produced them and I would not have invented either.

Every topic declares what it reads and what fires it, and the tests assert both
directions: no topic that can never fire, and no event nothing reacts to.
EOF
```

---

### Task 4: The two rooms

**Files:**
- Create: `js/social/platforms.js`
- Test: extends `tests/social-sampler.test.js` in Task 5 (no separate test file)
- Modify: `tests/social-hostility.test.js` (walk `PLATFORMS` too)

**Interfaces:**
- Consumes: nothing.
- Produces: `PLATFORMS` (object keyed `timeline` | `chat`), `platformOf(stream) → platform`.

- [ ] **Step 1: Write the implementation**

```js
// js/social/platforms.js
// Two rooms with different physics.
//
// ChatBCC — the real app this is modelled on — is NOT a timeline. It is a group
// chat where 56 Big Brother alumni act as HOSTS to about 41,000 members, running
// watch parties and prediction games. So the two streams are not one feed with
// two labels. A public timeline is a stadium; a hosted chat is a room where the
// hosts have played the game and know the people they are talking about.
//
// If a post reads the same in both rooms, the library has failed.

export const PLATFORMS = {
  timeline: {
    id: 'timeline',
    label: 'the timeline',
    /** Public. Anybody posts, and the crowd is the point. */
    audience: 'public',
    /** Hard cap in characters. Short is what makes a dunk land. */
    maxLength: 240,
    /** What a reader can do to a post here. */
    engagement: ['likes', 'tomatoes', 'replies', 'quotes'],
    /** Ratios exist here: tomatoes outrunning likes IS the story. */
    ratios: true,
    /** Lowercase, fragments, no full stops — how the room actually sounds. */
    register: 'casual',
    hostility: 1.0,
  },
  chat: {
    id: 'chat',
    label: 'the group chat',
    /** Hosted. Alumni host, members reply. Semi-private. */
    audience: 'hosted',
    maxLength: 600,
    engagement: ['likes', 'comments'],
    /** No ratio culture. It is a room, not a stadium. */
    ratios: false,
    /** Full sentences. Insider vocabulary. Warmer surface, shadier content. */
    register: 'considered',
    hostility: 0.45,
  },
};

/** A platform by id. Falls back to the timeline — the public room is the default. */
export function platformOf(stream) {
  return PLATFORMS[stream] || PLATFORMS.timeline;
}
```

- [ ] **Step 2: Extend the hostility guard**

In `tests/social-hostility.test.js`, add:

```js
import { PLATFORMS } from '../js/social/platforms.js';
```

and inside `allStrings()`:

```js
  walk(PLATFORMS, 'platforms');
```

Run: `node node_modules/vitest/vitest.mjs run tests/social-hostility.test.js`
Expected: PASS, 3 tests.

- [ ] **Step 3: Commit**

```bash
git commit -F - -- js/social/platforms.js tests/social-hostility.test.js <<'EOF'
Two rooms with different physics

ChatBCC is a hosted group chat, not a timeline — alumni host, members reply, and
nobody gets ratioed. Modelling both as one feed with two labels would have lost
the only interesting thing about having two.
EOF
```

---

### Task 5: The sampler — read the voices

**Files:**
- Create: `js/social/sampler.js`
- Test: `tests/social-sampler.test.js`

**Interfaces:**
- Consumes: `PERSONAS`, `feelingsToward` (Task 1); `TOPICS`, `topicsFor` (Task 3); `PLATFORMS`, `platformOf` (Task 4).
- Produces: `composePost({ persona, topic, platform, event, rng }) → post`, `samplePosts(event, { count, stream, rng }) → post[]`, `renderSample(posts) → string`.
- `post` is `{ handle, name, stream, topic, text, likes, tomatoes }`.

- [ ] **Step 1: Write the failing test**

```js
// tests/social-sampler.test.js
// Reading the voices.
//
// A data file with no consumer is dead code, and this repo has shipped that three
// times in a week. The sampler is how the library gets judged: feed it an event,
// read fifty posts, and see whether the fandom sounds like a fandom.
import { describe, expect, it } from 'vitest';
import { samplePosts, composePost, renderSample } from '../js/social/sampler.js';
import { PERSONAS } from '../js/social/personas.js';
import { TOPICS } from '../js/social/topics.js';
import { PLATFORMS } from '../js/social/platforms.js';

/** Deterministic rng, so a failure is reproducible rather than a mood. */
function seeded(seed = 7) {
  return () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
}

const BLINDSIDE = {
  kind: 'blindside', subject: 'heather', actor: 'alejandro',
  season: 15, episode: 7, format: 'total-drama',
};

describe('composing one post', () => {
  it('produces something a person could have typed', () => {
    const post = composePost({
      persona: PERSONAS[0],
      topic: TOPICS.find(t => t.id === 'blindside-reaction'),
      platform: PLATFORMS.timeline,
      event: BLINDSIDE,
      rng: seeded(1),
    });
    expect(post.handle).toBe(PERSONAS[0].handle);
    expect(post.text.length).toBeGreaterThan(0);
    expect(post.text.length).toBeLessThanOrEqual(PLATFORMS.timeline.maxLength);
    expect(post.topic).toBe('blindside-reaction');
  });

  it('never leaves an unfilled slot in the output', () => {
    // A template that leaks {subject} is worse than no post: it tells the reader
    // this is generated.
    for (let i = 0; i < 60; i++) {
      const posts = samplePosts(BLINDSIDE, { count: 5, stream: 'timeline', rng: seeded(i) });
      for (const p of posts) {
        expect(p.text, 'a template slot leaked into the output').not.toMatch(/[{}]/);
        expect(p.text).not.toMatch(/undefined|NaN|null/);
      }
    }
  });
});

describe('the feed sounds like a crowd', () => {
  const posts = samplePosts(BLINDSIDE, { count: 50, stream: 'timeline', rng: seeded(3) });

  it('does not repeat itself', () => {
    const unique = new Set(posts.map(p => p.text));
    expect(unique.size / posts.length,
      'the same post keeps coming back').toBeGreaterThan(0.8);
  });

  it('is more than one kind of person', () => {
    const archetypes = new Set(posts.map(p =>
      PERSONAS.find(x => x.handle === p.handle)?.archetype));
    expect(archetypes.size, 'the whole crowd is one archetype').toBeGreaterThanOrEqual(3);
  });

  it('talks about more than one thing', () => {
    expect(new Set(posts.map(p => p.topic)).size,
      'fifty posts and one topic').toBeGreaterThanOrEqual(3);
  });
});

describe('the two rooms sound different', () => {
  it('is measurably not the same voice', () => {
    // If a chat post reads like a timeline post, having two platforms bought
    // nothing.
    const timeline = samplePosts(BLINDSIDE, { count: 30, stream: 'timeline', rng: seeded(5) });
    const chat = samplePosts(BLINDSIDE, { count: 30, stream: 'chat', rng: seeded(5) });
    const avg = xs => xs.reduce((n, p) => n + p.text.length, 0) / xs.length;
    expect(avg(chat), 'the chat is not more considered than the timeline')
      .toBeGreaterThan(avg(timeline));
    // Ratios are a timeline phenomenon; the chat has no tomatoes at all.
    expect(chat.every(p => p.tomatoes === 0)).toBe(true);
    expect(timeline.some(p => p.tomatoes > 0)).toBe(true);
  });
});

describe('both feelings axes reach the page', () => {
  it('can love somebody and hate their game, and the reverse', () => {
    // If neither shape ever appears, the two-axis model is costing complexity and
    // buying nothing.
    const ids = new Set();
    for (let s = 0; s < 40; s++) {
      for (const p of samplePosts(BLINDSIDE, { count: 20, stream: 'timeline', rng: seeded(s) })) {
        ids.add(p.topic);
      }
    }
    expect(ids, 'nobody ever loves a player and hates their game')
      .toContain('love-them-hate-their-game');
    expect(ids, 'nobody ever hates a player and rates their game')
      .toContain('hate-them-rate-their-game');
  });
});

describe('reading it', () => {
  it('renders a sample somebody can actually read', () => {
    const text = renderSample(samplePosts(BLINDSIDE, { count: 5, stream: 'timeline', rng: seeded(9) }));
    expect(text.split('\n').length).toBeGreaterThanOrEqual(5);
    expect(text).toContain('@');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node node_modules/vitest/vitest.mjs run tests/social-sampler.test.js`
Expected: FAIL — cannot resolve `../js/social/sampler.js`.

- [ ] **Step 3: Write the implementation**

Write `js/social/sampler.js` providing the three exports. It must:

- **Pick a persona** whose `platforms` includes the stream.
- **Pick a topic** from `topicsFor(event.kind, stream)`, weighted by `topic.weight`
  AND by how the persona feels about `event.subject` / `event.actor` — a fan with
  high affection for the subject is far likelier to reach for
  `harassment-defence` or `love-them-hate-their-game` than for `pile-on`.
- **Fill a shape** with the event's people. Every topic needs at least four
  phrasings per shape it declares, or the variety test fails.
- **Apply the voice proportionally**: `caps` scales how often a phrase is
  uppercased, `emoji` how often one is appended, `length` and the platform's
  `maxLength` bound the result. Never `if (caps > 0.5)`.
- **Set engagement from feelings**, not from a roll: a post defending an
  unpopular player collects tomatoes; a dunk on a disliked one collects likes.
  `chat` posts always have `tomatoes: 0` — that room has no ratios.
- Take an injected `rng` so every test is reproducible.

Player names in output come from the roster slug — render them capitalised
(`heather` → `Heather`). **Never** read `voice-profiles.json` here: it keys on
display name, this module works in slugs, and joining the two is project 2's
problem when alumni posts arrive.

- [ ] **Step 4: Run the test to verify it passes**

Run: `node node_modules/vitest/vitest.mjs run tests/social-sampler.test.js`
Expected: PASS, 9 tests.

- [ ] **Step 5: Read the output yourself**

```bash
node --input-type=module -e "
import { samplePosts, renderSample } from './js/social/sampler.js';
const ev = { kind:'blindside', subject:'heather', actor:'alejandro', season:15, episode:7, format:'total-drama' };
console.log('--- TIMELINE ---');
console.log(renderSample(samplePosts(ev, { count: 15, stream: 'timeline' })));
console.log('--- GROUP CHAT ---');
console.log(renderSample(samplePosts(ev, { count: 8, stream: 'chat' })));
"
```

**Read it.** This is the deliverable — a test can prove the posts differ but not
that they sound human. If the timeline does not read like people shouting at each
other and the chat does not read like insiders comparing notes, the library needs
more phrasings, not more code. Say in your report what it actually sounded like.

- [ ] **Step 6: Extend the hostility guard one last time**

Nothing new to add — the sampler holds phrasings, so import and walk it if the
phrasings live in `sampler.js`; if they live in `topics.js`, the guard already
covers them. State which in your report.

Run: `node node_modules/vitest/vitest.mjs run tests/social-hostility.test.js`
Expected: PASS, 3 tests.

- [ ] **Step 7: Commit**

```bash
git commit -F - -- js/social/sampler.js tests/social-sampler.test.js tests/social-hostility.test.js <<'EOF'
Read the voices

Feed it an event, get fifty posts. The tests prove the crowd varies, the two
rooms sound different and both feelings axes reach the page — but the sampler
exists so a person can read the output and judge whether it sounds like a
fandom, which no assertion can do.
EOF
```

---

## Self-Review

**Spec coverage.** Personas with recurring history and the two-axis feelings model (Task 1); the hostility line enforced with a canary (Task 2, extended in 3 and 4); the topic taxonomy with declared data sources and both coverage directions (Task 3); the two platforms' differing physics (Task 4); the sampler, variety, voice separation and both axes reaching the page (Task 5).

**Deliberately not covered**, matching the spec: reading real episodes, persisting posts, the feed UI, moderation, and AI-written posts.

**Type consistency.** A persona is the same object in Tasks 1 and 5. `feelingsToward` returns `{affection, gameRespect}` in both. `topicsFor(eventKind, stream)` has that signature in Tasks 3 and 5. `PLATFORMS` is keyed `timeline`/`chat` in Tasks 4 and 5, and `post` is `{handle, name, stream, topic, text, likes, tomatoes}` throughout.

**One deliberate looseness.** Task 5 Step 3 states requirements rather than giving the full composer source, because the phrasing pools are the creative work — the whole point of the project — and dictating them verbatim would make the implementer a typist and produce my voice rather than a researched one. The tests pin the properties that matter (no leaked slots, variety, room separation, both axes), and Step 5 requires a human read. Every other task gives complete code.

**A risk worth naming.** The variety test demands >80% unique across 50 posts, which is only achievable with genuinely many phrasings per shape. An implementer who writes three variants will fail it and may be tempted to lower the threshold. The threshold is the requirement: lowering it means shipping a feed that repeats itself, which is exactly what makes generated content feel generated.

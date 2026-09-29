# The Circle — Plan 2: the writing

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans (the user's standing rule: inline, no subagents). Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** every scene a season plays reads like the real show — players say their plan out loud, dictate messages with spoken punctuation and emoji, read incoming messages aloud and react in other apartments, rank each other with reasons, argue pros and cons in the Hangout, panic before a visit, and a comic host talks over it — written as short scripts in fluent American English, and readable end to end with `npm run ci:transcript`.

**Architecture:** Plan 1's engine writes scene records and no prose. This plan adds a writing layer that runs **after** each day is decided: `js/ci/airing.js` chooses which scenes air, `js/ci/script.js` picks a pool entry for each aired scene from the facts the speaker could know and renders it into plain strings on `scene.script`, and `js/ci/voice.js` turns a message into what shows on screen (emoji, hashtags) and what the player says while dictating it. The writing layer draws from its own dice (`streamFor(seed, 'line:…')`), so a line can never change a result, and it reads beliefs without creating them.

**Tech Stack:** ES modules; vitest + jsdom; pools are data-only modules under `js/ci/lines/`.

**Spec:** `docs/superpowers/specs/2026-09-29-the-circle-design.md` — §2.3–§2.5 (real phrasing and rhythm), §7.1 (said vs sent), §11 (visit, goodbye), §15 (finale), §17 (the writing rules). Research: the 90 US transcripts (`scratchpad/tx`, not committed) are the register to write in.

## Global Constraints

- **Dialogue, not description of dialogue.** One line of staging at most, then spoken turns, then a beat that says what somebody does next.
- **Fluent, not clever.** No meme constructions, no epigrams, no knowing sting at the end of a scene, no jokes the reader has to decode. The host's jokes come from the situation.
- **Every question gets an answer** in the scene, or the asker leaves.
- **Nothing the engine did not decide.** The script follows `scene.data` (ending, result, reason, motive, claim); it never adds an outcome.
- **Players only know profiles.** In `say`, `send` and `react` turns, `{b}` is the profile's shown name and pronouns follow the shown gender. `host` lines use the shown name for `{b}` but may add `{b.real}` / `{b.aka}` and use real pronouns. **Staging and beats describe the apartment, so they name the real person** (it is Alejandro on the couch, not "Maddie").
- **Knowledge.** A turn that names a third player's deed uses `{c}` filled from a claim the speaker holds (engine-guaranteed); nothing else may name a deed.
- **American English** (spec §17.6.8): mom, favorite, realize, color, apartment. No British spellings in pools.
- **No names in pools.** Slots only: `{a}`, `{b}`, `{c}`, `{a.real}`, `{b.aka}`, pronoun slots.
- **Reading is not writing:** the writing layer never calls `belief()`, `nudgeBelief`, `bump`, `learn` or anything else that mutates state; it peeks.
- **Its own dice:** every pick uses `streamFor(state.seed, 'line:<scene>:<block>')`. No `Math.random`.
- Slug and words from the registry; the host label is `showWords('the-circle').host ?? 'Host'`.
- Commit after every task with named files only; never `git add -A`, never `git stash`.

## Review Focus

1. **A catfish's name and gender.** A player speaking about a catfish uses the persona's name and pronouns; the host may say "Rebecca, aka Seaburn". Pinned in Task 2.
2. **An empty filter.** A pool whose conditioned entries all fail must still return an unconditioned entry, never nothing. Pinned in Tasks 2 and 10.
3. **Scripts cannot move results.** A season with scripts and one without give identical placements, blockings and ratings. Pinned in Task 3.
4. **Rendering does not create beliefs.** `state.beliefs` has the same keys before and after writing a day. Pinned in Task 2.
5. **A long season wears pools thin.** Measured per pool (plays, distinct lines, worst repeat) in Task 11.

---

## File structure

| File | Responsibility |
|---|---|
| `js/ci/voice.js` | message tokens, emoji and hashtags; display text; dictation; texting-voice styling |
| `js/ci/script.js` | facts, pool keys per scene, picking with the repetition guard, rendering to strings |
| `js/ci/airing.js` | which scenes air each day |
| `js/ci/transcript.js` | a season as readable text and HTML (the same renderer later screens use) |
| `js/ci/season.js` (modify) | after each day: choose aired scenes, write scripts, then air the day |
| `js/ci/lines/index.js` | `POOLS` — every pool, merged |
| `js/ci/lines/chat.js`, `slips.js`, `feed.js`, `circle.js`, `profiles.js`, `ratings.js`, `hangout.js`, `blocking.js`, `visit.js`, `goodbye.js`, `finale.js`, `host.js` | the pools, data only |
| `tests/ci-voice.test.js`, `tests/ci-script.test.js`, `tests/ci-airing.test.js`, `tests/ci-lines.test.js` | tests and guards |
| `tests/ci-transcript-audit.test.js`, `package.json` | `npm run ci:transcript` |

---

## The script shape

A pool entry:

```js
{
  id: 'chat.bond.warm.03',
  when: { mood: 'lonely' },                // optional; keys from FACT_KEYS
  stage: '{a} is on the couch with a bowl of cereal.',   // optional, one line
  turns: [
    { by: 'a', say: "Okay. {b} looked rattled after last night. Let me check on {b.obj}.",
               send: "Hey {b}! How you holding up after last night? {e:hug}" },
    { by: 'b', react: "Aw. That's actually really sweet.",
               send: "Honestly? Still shaking lol. But thank you {e:heart}" },
    { by: 'a', send: "Anytime. We got each other {t:GotYourBack}" },
  ],
  beat: '{a} leaves the chat and goes back to the cereal.',
}
```

- A turn is by `a`, `b`, `c` or `host`. Inside one turn the order is always `react` (reading the previous message aloud and reacting), then `say` (thinking out loud), then `send` (the message). Any of the three may be absent.
- `send` text holds `{e:<emoji>}` and `{t:<CamelTag>}` tokens; `voice.js` keeps or drops them by the sender's texting voice and renders both the screen text and the dictation.
- Some kinds are one-speaker (status, video, rating aloud): their entries have one or two turns.

A rendered block (stored on `scene.script.blocks[]`, strings only):

```js
{ id: 'chat.bond.warm.03', lines: [
  { who: '@maddie', kind: 'stage', text: 'Alejandro is on the couch…' },   // staging: the real person
  { who: '@maddie', kind: 'say', text: "Okay. Bridgette looked rattled…" },
  { who: '@maddie', kind: 'send', text: 'Hey Bridgette! How you holding up after last night? 🤗',
    spoken: 'Message: "Hey Bridgette, exclamation point. How you holding up after last night, question mark." Hug emoji. Send.' },
  … ],
  beat: 'Alejandro leaves the chat and goes back to the cereal.' }
```

---

### Task 1: Texting voice and dictation

**Files:** Create `js/ci/voice.js`; Test `tests/ci-voice.test.js`

**Interfaces — Produces:** `EMOJI` (`{ key: [char, spokenName] }`), `tokenize(text) → [{type:'text'|'emoji'|'tag', v}]`, `tagWords(tag) → string`, `styleMessage(text, voice, rng) → text` (tokens kept or dropped, caps, doubled marks), `displayText(text) → string`, `dictation(text) → string`.

- [ ] **Step 1: Write the failing test** — `tests/ci-voice.test.js`

```js
import { describe, expect, it } from 'vitest';
import { EMOJI, tokenize, tagWords, styleMessage, displayText, dictation } from '../js/ci/voice.js';

describe('texting voice', () => {
  it('splits a message into text, emoji and hashtags', () => {
    expect(tokenize('hey {e:heart} {t:GirlGang}')).toEqual([
      { type: 'text', v: 'hey ' }, { type: 'emoji', v: 'heart' }, { type: 'text', v: ' ' }, { type: 'tag', v: 'GirlGang' }]);
  });

  it('shows emoji and hashtags on screen', () => {
    expect(displayText('Good morning {e:sun} {t:NewDay}')).toBe(`Good morning ${EMOJI.sun[0]} #NewDay`);
  });

  it('reads hashtags as words and punctuation out loud, the way players dictate', () => {
    expect(tagWords('GotYourBack')).toBe('Got Your Back');
    expect(dictation('Hey girl! How you holding up? {e:hug} {t:GotYourBack}'))
      .toBe('Message: "Hey girl, exclamation point. How you holding up, question mark." Hug emoji. Hashtag Got Your Back. Send.');
    expect(dictation('I have to ask you something...')).toBe('Message: "I have to ask you something, dot, dot, dot." Send.');
  });

  it('keeps more emoji and hashtags for a player who uses them', () => {
    const heavy = { emoji: 1, hashtags: 1, caps: 0 }, light = { emoji: 0, hashtags: 0, caps: 0 };
    const msg = 'so happy {e:heart} {e:party} {t:CircleFam}';
    let h = 0, l = 0;
    for (let i = 0; i < 50; i++) {
      const r = (() => { let s = i * 7 + 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); })();
      h += (styleMessage(msg, heavy, r).match(/\{[et]:/g) || []).length;
      l += (styleMessage(msg, light, r).match(/\{[et]:/g) || []).length;
    }
    expect(h).toBeGreaterThan(l);
  });

  it('never leaves a stray space or an empty message', () => {
    const out = styleMessage('{e:heart}', { emoji: 0, hashtags: 0, caps: 0 }, () => 0.99);
    expect(out.trim().length).toBeGreaterThan(0);
    expect(displayText(styleMessage('ok {e:heart}  {t:Fam}', { emoji: 0, hashtags: 0, caps: 0 }, () => 0.99))).toBe('ok');
  });
});
```

- [ ] **Step 2: Run it — FAIL** (`Failed to resolve import "../js/ci/voice.js"`)

- [ ] **Step 3: Write `js/ci/voice.js`**

```js
// ══════════════════════════════════════════════════════════════════════
// ci/voice.js — a message as it shows on screen, and as it is dictated
// ══════════════════════════════════════════════════════════════════════
//
// Players dictate everything, punctuation included (90 US transcripts:
// "exclamation point" 337 times, "question mark" 274, "dot, dot, dot" 130,
// "emoji" 1,473): 'Message: "Hey girl, exclamation point." Heart emoji. Send.'
// A pool writes a message once, with {e:heart} and {t:GirlGang} tokens; this
// file styles it in the sender's texting voice and renders both forms.
export const EMOJI = {
  heart: ['❤️', 'heart emoji'], laugh: ['😂', 'laughing emoji'], fire: ['🔥', 'fire emoji'],
  eyes: ['👀', 'eyes emoji'], hearteyes: ['😍', 'heart-eyes emoji'], cry: ['😢', 'crying emoji'],
  devil: ['😈', 'devil emoji'], wink: ['😉', 'winky face emoji'], pray: ['🙏', 'praying hands emoji'],
  hug: ['🤗', 'hug emoji'], grimace: ['😬', 'grimacing emoji'], shock: ['😱', 'shocked emoji'],
  crown: ['👑', 'crown emoji'], sparkle: ['✨', 'sparkle emoji'], party: ['🎉', 'party emoji'],
  think: ['🤔', 'thinking emoji'], mind: ['🤯', 'mind-blown emoji'], halo: ['😇', 'angel emoji'],
  muscle: ['💪', 'flexed arm emoji'], kiss: ['😘', 'kissy face emoji'], sweat: ['😅', 'sweating emoji'],
  snake: ['🐍', 'snake emoji'], clap: ['👏', 'clapping hands emoji'], sad: ['😔', 'sad face emoji'],
  smile: ['😊', 'smiley face emoji'], side: ['😏', 'smirk emoji'], cool: ['😎', 'sunglasses emoji'],
  sun: ['☀️', 'sun emoji'], lipstick: ['💄', 'lipstick emoji'], detective: ['🕵️', 'detective emoji'],
};

export function tokenize(text) {
  const out = [];
  const re = /\{([et]):([A-Za-z0-9]+)\}/g;
  let last = 0, m;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push({ type: 'text', v: text.slice(last, m.index) });
    out.push({ type: m[1] === 'e' ? 'emoji' : 'tag', v: m[2] });
    last = re.lastIndex;
  }
  if (last < text.length) out.push({ type: 'text', v: text.slice(last) });
  return out;
}

export const tagWords = tag => tag.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/([a-zA-Z])(\d)/g, '$1 $2');

const tidy = s => s.replace(/[ \t]{2,}/g, ' ').replace(/\s+([,.!?])/g, '$1').trim();

/** Keep or drop each token by the sender's voice; a loud voice doubles an exclamation. */
export function styleMessage(text, voice = {}, rng = () => 0.5) {
  const e = voice.emoji ?? 0.5, t = voice.hashtags ?? 0.5, caps = voice.caps ?? 0;
  let out = '';
  for (const p of tokenize(text)) {
    if (p.type === 'text') {
      let v = p.v;
      if (caps > 0 && rng() < caps * 0.5) v = v.replace(/!/g, '!!');
      out += v;
    } else if (p.type === 'emoji') {
      if (rng() < 0.3 + 0.7 * e) out += `{e:${p.v}}`;
    } else if (rng() < 0.25 + 0.75 * t) out += `{t:${p.v}}`;
  }
  const cleaned = tidy(out);
  const bare = cleaned.replace(/\{[et]:[A-Za-z0-9]+\}/g, '').trim();
  // A message that was only emoji keeps its first token rather than going blank.
  if (!bare && !/\{[et]:/.test(cleaned)) {
    const first = tokenize(text).find(p => p.type !== 'text');
    return first ? `{${first.type === 'emoji' ? 'e' : 't'}:${first.v}}` : tidy(text);
  }
  return cleaned;
}

export function displayText(text) {
  return tidy(tokenize(text).map(p => p.type === 'text' ? p.v
    : p.type === 'emoji' ? (EMOJI[p.v]?.[0] ?? '') : `#${p.v}`).join(''));
}

const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
function speakText(s) {
  return tidy(s)
    .replace(/\s*(\.\.\.|…)/g, ', dot, dot, dot.')
    .replace(/!+/g, ', exclamation point.')
    .replace(/\?+/g, ', question mark.')
    .replace(/\.\.$/, '.')
    .replace(/\.\s*$/, '');
}

export function dictation(text) {
  const parts = tokenize(text);
  const quoted = speakText(parts.filter(p => p.type === 'text').map(p => p.v).join(' '));
  const extras = parts.filter(p => p.type !== 'text')
    .map(p => p.type === 'emoji' ? cap(EMOJI[p.v]?.[1] ?? 'emoji') : `Hashtag ${tagWords(p.v)}`);
  const said = quoted ? `Message: "${cap(quoted)}."` : 'Message:';
  return [said, ...extras.map(x => `${x}.`), 'Send.'].join(' ').replace(/\.\."/g, '."');
}
```

- [ ] **Step 4: Run it — PASS.** Read the dictation strings the test prints on failure; the three expected strings are the register (1×01: *Message. "Hey, girls, hey… Girls who stick together are pretty girls. Emoji heart," and send.*).

- [ ] **Step 5: Commit** — `git add js/ci/voice.js tests/ci-voice.test.js` · `feat(the-circle): texting voice — emoji, hashtags and dictation`

---

### Task 2: The script engine — facts, picking, rendering

**Files:** Create `js/ci/script.js`, `js/ci/lines/index.js` (starting with an empty `POOLS = {}` and a test hook); Test `tests/ci-script.test.js`

**Interfaces — Consumes:** Plan 1 state, `rel`, `S`, `schemeEligible`, `peopleOf`; `mood` (read-only); `isRevealed`; `styleMessage`, `displayText`, `dictation`. **Produces:**
- `FACT_KEYS`, `ROLES = ['a','b','c','host']`
- `peekReal(state, obs, target) → number` (no side effects)
- `factsFor(state, scene, cast) → facts` (speaker `a`'s point of view)
- `pickEntry(state, key, facts, pairKey, rng) → entry | null`
- `renderEntry(state, entry, cast, rng) → block`
- `fill(state, text, cast, speakerRole) → string`
- `hostName() → string`

Facts (all from `a`'s point of view, narration thresholds only):

| key | meaning |
|---|---|
| `intent`, `ending`, `result` | the chat's intent, ending, probe result |
| `known` | `a` and `b` had a chat before today |
| `early` / `late` | day ≤ 2 / within the last three days |
| `catfish` | `a` is a catfish (a knows) |
| `outed` | `a` knows `b` is a catfish (revealed) |
| `suspects` / `theory` | `a`'s belief that `b` is real < 0.5 / < `THEORY_LINE` |
| `pact` | `a` and `b` have a pact |
| `friends` / `rivals` / `flirty` | affection > 4 / resentment > 4 / attraction > 5, `a`→`b` |
| `newcomer` | `b` arrived within two days |
| `mood` | `a`'s strongest state above 5.5: lonely, paranoid, stressed, guilty, elated, homesick — else steady |
| `group` | villain / neutral / nice (from `a`'s archetypes) |
| `style` | `a`'s rating style |
| `hurt` | `a` finished in the bottom three yesterday |
| `influencer` | `a` is (or was yesterday) an influencer |
| `reason`, `motive`, `mode`, `reasonKind`, `band`, `kiss`, `claim`, `lie`, `tone`, `party`, `final`, `slip`, `noticed`, `place`, `self` | from the scene's data, set by the pool-key builder |

- [ ] **Step 1: Write the failing test** — `tests/ci-script.test.js`

```js
import { describe, expect, it, beforeEach } from 'vitest';
import { setGs } from '../js/core.js';
import { streamFor } from '../js/dr/rng.js';
import { newState, addScene, bump } from '../js/ci/state.js';
import { initMind } from '../js/ci/mind.js';
import { POOLS } from '../js/ci/lines/index.js';
import { factsFor, pickEntry, renderEntry, fill, peekReal, FACT_KEYS } from '../js/ci/script.js';

beforeEach(() => setGs({ bonds: {}, relationshipDimensions: {}, episodeHistory: [] }));

const STATS = { physical: 5, endurance: 5, mental: 5, social: 5, strategic: 5, loyalty: 5, boldness: 5, intuition: 5, temperament: 5 };
function room() {
  const s = newState(3);
  s.day = 4;
  const add = (name, gender, shown, handle, mode = 'honest') => {
    s.people[name] = { name, gender, archetype: 'floater', stats: { ...STATS }, age: 25 };
    s.profiles[handle] = { handle, players: [name], mode, gap: mode === 'catfish' ? 2 : 0,
      shown: { name: handle.slice(1)[0].toUpperCase() + handle.slice(2), gender: shown, age: 24 },
      voice: { emoji: 0.5, hashtags: 0.5, caps: 0 } };
    s.handleOf[name] = handle; s.active.push(handle); initMind(s, handle);
  };
  add('Seaburn', 'm', 'f', '@rebecca', 'catfish');
  add('Shubham', 'm', 'm', '@shubham');
  add('Sammie', 'f', 'f', '@sammie');
  return s;
}

describe('names and pronouns', () => {
  it('lets players say the persona\'s name and pronouns, and only the host the truth', () => {
    const s = room();
    const cast = { a: '@shubham', b: '@rebecca' };
    expect(fill(s, '{b} said {b.sub} was tired.', cast, 'a')).toBe('Rebecca said she was tired.');
    expect(fill(s, '{b.aka} is tired, and {b.sub} is lying.', cast, 'host')).toBe('Rebecca, aka Seaburn, is tired, and he is lying.');
    expect(fill(s, '{a.aka} is here.', cast, 'host')).toBe('Shubham is here.');
    expect(fill(s, '{b} puts the kettle on. {b.Sub} looks at the screen.', cast, 'narration'))
      .toBe('Seaburn puts the kettle on. He looks at the screen.');
  });
});

describe('facts', () => {
  it('reads beliefs without creating them', () => {
    const s = room();
    const sc = addScene(s, 'chat', ['@shubham', '@rebecca'], { intent: 'bond', ending: 'warm' });
    const before = JSON.stringify(s.beliefs);
    factsFor(s, sc, { a: '@shubham', b: '@rebecca' });
    expect(peekReal(s, '@shubham', '@sammie')).toBeGreaterThan(0.5);
    expect(JSON.stringify(s.beliefs)).toBe(before);
  });

  it('reports the chat, the pair and the mood from the speaker\'s side', () => {
    const s = room();
    bump('@shubham', '@rebecca', 'affection', 6);
    s.mind['@shubham'].loneliness = 9;
    const sc = addScene(s, 'chat', ['@shubham', '@rebecca'], { intent: 'bond', ending: 'warm' });
    const f = factsFor(s, sc, { a: '@shubham', b: '@rebecca' });
    expect(f).toMatchObject({ intent: 'bond', ending: 'warm', friends: true, mood: 'lonely', catfish: false, outed: false });
    for (const k of Object.keys(f)) expect(FACT_KEYS).toContain(k);
  });
});

describe('picking and rendering', () => {
  it('falls back to an entry with no conditions when nothing matches', () => {
    const s = room();
    POOLS['test.pool'] = [
      { id: 'test.pool.1', when: { mood: 'guilty' }, turns: [{ by: 'a', say: 'guilty' }] },
      { id: 'test.pool.2', turns: [{ by: 'a', say: 'plain' }] },
    ];
    const e = pickEntry(s, 'test.pool', { mood: 'steady' }, '@a|@b', streamFor(1, 'x'));
    expect(e.id).toBe('test.pool.2');
    delete POOLS['test.pool'];
  });

  it('prefers a matching entry and avoids reusing one for the same pair', () => {
    const s = room();
    POOLS['test.pool'] = [
      { id: 'test.pool.1', when: { mood: 'lonely' }, turns: [{ by: 'a', say: 'lonely' }] },
      { id: 'test.pool.2', turns: [{ by: 'a', say: 'plain' }] },
      { id: 'test.pool.3', turns: [{ by: 'a', say: 'plain again' }] },
    ];
    let lonely = 0;
    for (let i = 0; i < 40; i++) {
      const t = room();
      if (pickEntry(t, 'test.pool', { mood: 'lonely' }, `p${i}`, streamFor(i, 'x')).id === 'test.pool.1') lonely++;
    }
    expect(lonely).toBeGreaterThan(20);
    const first = pickEntry(s, 'test.pool', {}, 'pair', streamFor(2, 'x'));
    const second = pickEntry(s, 'test.pool', {}, 'pair', streamFor(3, 'x'));
    expect(second.id).not.toBe(first.id);
    delete POOLS['test.pool'];
  });

  it('renders turns in order — react, say, send — with the screen text and the dictation', () => {
    const s = room();
    const entry = { id: 'x.1', stage: '{a} sits down.', turns: [
      { by: 'a', say: 'Let me check on {b.obj}.', send: 'Hey {b}! You good? {e:hug}' },
      { by: 'b', react: 'Aw.', send: 'All good {e:heart}' }], beat: '{b} smiles.' };
    const block = renderEntry(s, entry, { a: '@shubham', b: '@rebecca' }, streamFor(4, 'r'));
    expect(block.lines.map(l => l.kind)).toEqual(['stage', 'say', 'send', 'react', 'send']);
    expect(block.lines[1].text).toBe('Let me check on her.');
    expect(block.lines[2].text).toMatch(/^Hey Rebecca! You good\?/);
    expect(block.lines[2].spoken).toMatch(/^Message: "Hey Rebecca, exclamation point\. You good, question mark\."/);
    expect(block.beat).toBe('Seaburn smiles.');   // a beat is staging: the real person
    expect(JSON.stringify(block)).not.toMatch(/\{[a-z]/);
  });
});
```

- [ ] **Step 2: Run it — FAIL** (cannot resolve `../js/ci/script.js`)

- [ ] **Step 3: Write `js/ci/lines/index.js`** (it grows one import per pool task)

```js
// Every pool, merged into one map keyed by pool key. Data only.
export const POOLS = {};
```

- [ ] **Step 4: Write `js/ci/script.js`**

```js
// ══════════════════════════════════════════════════════════════════════
// ci/script.js — a decided scene becomes a short script (spec §17)
// ══════════════════════════════════════════════════════════════════════
//
// The engine has decided everything. This file only picks words, from its
// own dice, reading state without writing it (ADDING-A-SHOW §11.5 U: a read
// that creates a belief is a write). Players only know PROFILES: in their
// speech and their messages a catfish is the persona, name and pronouns. The
// host knows the truth ("Rebecca, aka Seaburn").
import { showWords } from '../shows.js';
import { pronounsOf } from '../pronouns-of.js';
import { rel, peopleOf } from './state.js';
import { THEORY_LINE } from './slips.js';
import { styleOf } from './ratings.js';
import { isRevealed } from './reveal.js';
import { styleMessage, displayText, dictation } from './voice.js';
import { POOLS } from './lines/index.js';

export const ROLES = ['a', 'b', 'c', 'host'];
export const FACT_KEYS = ['intent', 'ending', 'result', 'known', 'early', 'late', 'catfish', 'outed',
  'suspects', 'theory', 'pact', 'friends', 'rivals', 'flirty', 'newcomer', 'mood', 'group', 'style',
  'hurt', 'influencer', 'reason', 'motive', 'mode', 'reasonKind', 'band', 'kiss', 'claim', 'lie',
  'tone', 'party', 'final', 'slip', 'noticed', 'place', 'self'];

export const hostName = () => showWords('the-circle').host || 'Host';

/** A belief, read without creating it. */
export function peekReal(state, obs, target) {
  return state.beliefs[obs]?.[target]?.real ?? 0.8;
}

const MOODS = [['loneliness', 'lonely'], ['paranoia', 'paranoid'], ['stress', 'stressed'],
  ['guilt', 'guilty'], ['elation', 'elated'], ['homesick', 'homesick']];
export function moodOf(state, h) {
  const m = state.mind[h];
  if (!m) return 'steady';
  const [key, name] = MOODS.reduce((best, cur) => (m[cur[0]] > m[best[0]] ? cur : best), MOODS[0]);
  return m[key] > 5.5 ? name : 'steady';
}

const NICE = new Set(['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat']);
const VILLAINS = new Set(['villain', 'mastermind', 'schemer']);
function groupOf(state, h) {
  const arch = peopleOf(state, h).map(n => state.people[n].archetype);
  if (arch.some(a => NICE.has(a))) return 'nice';
  if (arch.every(a => VILLAINS.has(a))) return 'villain';
  return 'neutral';
}

export function factsFor(state, scene, cast) {
  const { a, b } = cast;
  const f = { early: state.day <= 2, late: false, catfish: state.profiles[a]?.mode === 'catfish' };
  if (a && state.mind[a]) f.mood = moodOf(state, a);
  if (a && state.profiles[a]) { f.group = groupOf(state, a); f.style = styleOf(state, a); }
  const last = [...state.ratings].reverse().find(r => r.day === state.day - 1 && !r.final);
  if (last && a) {
    f.hurt = last.results.slice(-3).some(r => r.profile === a);
    f.influencer = last.influencers.includes(a);
  }
  if (b && state.profiles[b]) {
    const real = peekReal(state, a, b);
    Object.assign(f, {
      known: state.scenes.some(s => s.day < state.day && s.kind === 'chat' && s.who.includes(a) && s.who.includes(b)),
      outed: isRevealed(state, a, b) && state.profiles[b].mode === 'catfish',
      suspects: real < 0.5, theory: real < THEORY_LINE,
      pact: state.pacts.some(p => (p.a === a && p.b === b) || (p.a === b && p.b === a)),
      friends: rel(a, b, 'affection') > 4, rivals: rel(a, b, 'resentment') > 4, flirty: rel(a, b, 'attraction') > 5,
      newcomer: (state.joinedDay[b] || 1) > 1 && state.day - state.joinedDay[b] <= 2,
    });
  }
  const d = scene.data || {};
  for (const k of ['intent', 'ending', 'reason', 'motive', 'mode', 'kiss', 'tone', 'party', 'final']) {
    if (d[k] !== undefined && d[k] !== null) f[k] = d[k];
  }
  return f;
}

function matches(when = {}, facts) {
  return Object.entries(when).every(([k, v]) => (Array.isArray(v) ? v.includes(facts[k]) : facts[k] === v));
}

const usage = state => (state.usedLines ||= { uses: {}, pairs: {} });

export function pickEntry(state, key, facts, pairKey, rng) {
  const pool = POOLS[key];
  if (!pool?.length) return null;
  const u = usage(state);
  const fits = pool.filter(e => matches(e.when, facts));
  const scored = fits.map(e => {
    const spec = Object.keys(e.when || {}).length;
    const uses = u.uses[e.id] || 0;
    const samePair = (u.pairs[e.id] || []).includes(pairKey);
    return [e, samePair ? 0 : (1 + spec) * Math.pow(0.5, uses)];
  });
  let total = scored.reduce((s, [, w]) => s + w, 0);
  // Everything that fits has been used on this pair: take the least-used fit.
  if (!total) {
    const e = fits.sort((x, y) => (u.uses[x.id] || 0) - (u.uses[y.id] || 0))[0] || pool.find(p => !p.when);
    return note(state, e, pairKey);
  }
  let r = rng() * total;
  for (const [e, w] of scored) { if ((r -= w) <= 0) return note(state, e, pairKey); }
  return note(state, scored.at(-1)[0], pairKey);
}

function note(state, e, pairKey) {
  if (!e) return null;
  const u = usage(state);
  u.uses[e.id] = (u.uses[e.id] || 0) + 1;
  (u.pairs[e.id] ||= []).push(pairKey);
  return e;
}

const PRONOUN_KEYS = ['sub', 'obj', 'pos', 'posAdj', 'ref', 'Sub', 'Obj', 'PosAdj'];
function realFirst(state, h) {
  return peopleOf(state, h).map(n => n.split(' ')[0]).join(' and ');
}
function realGender(state, h) {
  const g = peopleOf(state, h).map(n => state.people[n].gender);
  return g.length === 1 ? g[0] : 'nb';
}

export function fill(state, text, cast, speakerRole) {
  return text.replace(/\{([abc])(?:\.([A-Za-z]+))?\}/g, (m, role, prop) => {
    const h = cast[role];
    const p = h && state.profiles[h];
    if (!p) return m;
    const shown = p.shown?.name || realFirst(state, h);
    // Staging and beats describe the apartment: the person in it is the real one.
    if (!prop) return speakerRole === 'narration' ? realFirst(state, h) : shown;
    if (prop === 'real') return realFirst(state, h);
    if (prop === 'aka') return p.mode === 'catfish' || p.players.length > 1
      ? `${shown}, aka ${realFirst(state, h)},` : shown;
    if (PRONOUN_KEYS.includes(prop)) {
      const knowsTruth = speakerRole === 'host' || speakerRole === 'narration';
      const g = knowsTruth ? realGender(state, h) : (p.shown?.gender || realGender(state, h));
      return pronounsOf(g)[prop];
    }
    return m;
  }).replace(/,,/g, ',').replace(/,\s*([.!?])/g, '$1');
}

export function renderEntry(state, entry, cast, rng) {
  const lines = [];
  const who = role => (role === 'host' ? 'host' : cast[role]);
  if (entry.stage) lines.push({ who: cast.a, kind: 'stage', text: fill(state, entry.stage, cast, 'narration') });
  for (const t of entry.turns || []) {
    const speaker = who(t.by);
    if (t.react) lines.push({ who: speaker, kind: 'react', text: fill(state, t.react, cast, t.by) });
    if (t.say) lines.push({ who: speaker, kind: t.by === 'host' ? 'host' : 'say', text: fill(state, t.say, cast, t.by) });
    if (t.video) lines.push({ who: speaker, kind: 'video', text: fill(state, t.video, cast, t.by) });
    if (t.send) {
      const voice = state.profiles[speaker]?.voice;
      const styled = styleMessage(fill(state, t.send, cast, t.by), voice, rng);
      lines.push({ who: speaker, kind: 'send', text: displayText(styled), spoken: dictation(styled) });
    }
  }
  return { id: entry.id, lines, beat: entry.beat ? fill(state, entry.beat, cast, 'narration') : null };
}
```

- [ ] **Step 5: Run it — PASS.** Commit `js/ci/script.js js/ci/lines/index.js tests/ci-script.test.js` · `feat(the-circle): the script engine — facts from the speaker's side, picking, rendering`

---

### Task 3: What airs, and scripts on every aired scene

**Files:** Create `js/ci/airing.js`; Modify `js/ci/script.js` (add `sceneBlocks` and `writeDay`), `js/ci/season.js`; Test `tests/ci-airing.test.js`

**Interfaces — Produces:** `ALWAYS_AIRS`, `CHATS_PER_DAY = 9`, `STATUSES_PER_DAY = 3`, `chooseAired(state, day)`; in `script.js`: `sceneBlocks(state, scene) → [{ key, cast, facts }]` (the pool key and cast of every block a scene needs), `writeScene(state, scene)`, `writeDay(state, day)`. `playCircleSeason` gains `options.script` (default `true`); rows carry `ci.aired: [{ id, kind, who, script }]`.

Aired scenes: every scene of `ALWAYS_AIRS` kinds (`profiles, recognise, arrival, after-party, likes, circle-chat, ratings, hangout, blocking, visit, report, goodbye, final-ratings, meet, reveal`), the `STATUSES_PER_DAY` statuses with the strongest tone, and the `CHATS_PER_DAY` most dramatic chats. Drama: `DRAMA[intent]` + 1.5 if cold + 1 per claim + 1.5 per noticed slip + 1 per probe + 0.8 for a pact + `rng() * 0.5` from `streamFor(seed, 'air:<day>')`. Only aired scenes reach the public (Plan 1's `airDay` already reads `aired`).

Pool keys per scene (`sceneBlocks`) — the full map the pool tasks write to:

| scene kind | blocks (pool key → cast) |
|---|---|
| `chat` | `chat.<intent>.<ending>` (probe: `chat.probe.<result>`) → a, b, c = first claim's subject; then one `slip.<kind>.<noticed\|missed>` or `slip.misread` block per slip → a = slipper, b = listener |
| `status` | `status.<tone>` → a = poster; plus `status.react` → a = a reader (highest \|affection\|), b = poster |
| `likes` | `likes.most` → a = most liked; `likes.none` → a = someone with none (if any) |
| `circle-chat` | `circle.open` (or `circle.party` / `circle.final`) → a = first poster; one `circle.theory` per theory → a = accuser, b = accused |
| `profiles` | one `profile.<mode>` per starter → a |
| `recognise` | `recognise` → a = observer, b = profile |
| `arrival` | `arrival` → a = newcomer; `arrival.react` → a = someone already in, b = newcomer |
| `after-party` | `afterparty` → a = newcomer, b = chosen |
| `ratings` | `ratings.open` → host; per voter (up to 4 aired voters): `rate.<reason>.top` for position 1 and `rate.<reason>.bottom` for the last → a = voter, b = ranked; one `result.<band>` per reveal group → a = revealed (band: bottom / middle / top); `result.influencers` → a, b = influencers |
| `hangout` | `hangout.open` → a, b = influencers; per at-risk (up to 5): `hangout.view.<reason>.<cut\|keep>` → a, b = influencers, c = at-risk; then `hangout.<agree\|yield\|trade>` and, if a pact was made, `hangout.pact` |
| `blocking` | `block.announce.<reason>` → a = announcer, c = target; `block.react.self` → a = target; `block.react.<friend\|rival\|relief>` for two other players |
| `visit` | `visit.choose.<motive>` → a = blocked, b = visited; `visit.wait` (+ `visit.wait.catfish` for a catfish) for two others; `visit.door.<real\|catfish>` → a = visited, b = blocked; `visit.talk.<motive>`; `visit.hand` if a suspicion was handed (c = subject); `visit.kiss` if a kiss; `visit.bye` |
| `report` | `report` → a = reporter, b = ally, c = rival |
| `goodbye` | `goodbye.guess` → a = a player; `goodbye.video.<mode>` (catfish: `goodbye.video.catfish.<reasonKind>`) → a = blocked; `goodbye.warning.<kind>` → a = blocked, c = warned-about; `goodbye.react.<guilty\|vindicated\|warned\|surprised>` for two players |
| `final-ratings` | `final.rate.<reason>` for each finalist's first place → a, b |
| `meet` | `meet.arrive.<real\|catfish>` → a = arriving, b = one already present; `meet.explain.<reasonKind>` for a catfish arriving |
| `reveal` | `reveal.place` per place 5→2 → a = placed; `reveal.winner` → a = winner |
| every day | `host.cold` at the first aired scene, keyed by what happened yesterday (`when: { reason }` etc.) |

- [ ] **Step 1: Write the failing test** — `tests/ci-airing.test.js`

```js
import { describe, expect, it } from 'vitest';
import { setPlayers } from '../js/core.js';
import { playCircleSeason } from '../js/ci/season.js';
import { ALWAYS_AIRS, CHATS_PER_DAY } from '../js/ci/airing.js';
import { makePlayers, makePool, circleSetup } from './helpers/ci-cast.js';

function play(script = true, seed = 21) {
  const cast = makePlayers(13, seed); setPlayers(cast);
  const names = cast.map(p => p.name);
  return playCircleSeason({ cast: names, setup: circleSetup(names, { newcomers: 5 }), pool: makePool(6, seed), seed, options: { script } });
}

describe('airing and scripts', () => {
  it('airs every big moment and at most nine chats a day', () => {
    const { state } = play();
    for (const s of state.scenes) if (ALWAYS_AIRS.has(s.kind)) expect(s.aired, s.kind).toBe(true);
    for (let d = 1; d <= 13; d++) {
      expect(state.scenes.filter(s => s.day === d && s.kind === 'chat' && s.aired).length).toBeLessThanOrEqual(CHATS_PER_DAY);
    }
  });

  it('writes a script on aired scenes only, as plain strings', () => {
    const { state, rows } = play();
    for (const s of state.scenes) expect(!!s.script, `${s.kind} ${s.id}`).toBe(s.aired);
    expect(JSON.parse(JSON.stringify(rows))).toEqual(rows);
    expect(rows[0].ci.aired.length).toBeGreaterThan(0);
  });

  it('cannot change a result', () => {
    const a = play(true), b = play(false);
    expect(a.result.placements).toEqual(b.result.placements);
    expect(a.state.blocked).toEqual(b.state.blocked);
    expect(a.state.ratings.map(r => r.results)).toEqual(b.state.ratings.map(r => r.results));
  });
});
```

- [ ] **Step 2: Run it — FAIL** (cannot resolve `../js/ci/airing.js`)

- [ ] **Step 3: Write `js/ci/airing.js`**

```js
// ══════════════════════════════════════════════════════════════════════
// ci/airing.js — what makes the episode (spec §16)
// ══════════════════════════════════════════════════════════════════════
//
// Every big moment airs. Of the day's private chats, the most dramatic nine
// air (a real episode shows eight to twelve), and three statuses. The public
// only ever reacts to what aired. Its own dice: a line cannot move a result,
// and neither can the edit.
import { streamFor } from '../dr/rng.js';

export const ALWAYS_AIRS = new Set(['profiles', 'recognise', 'arrival', 'after-party', 'likes', 'circle-chat',
  'ratings', 'hangout', 'blocking', 'visit', 'report', 'goodbye', 'final-ratings', 'meet', 'reveal']);
export const CHATS_PER_DAY = 9;
export const STATUSES_PER_DAY = 3;
const DRAMA = { bond: 0.5, checkin: 0.8, ally: 1.2, flirt: 1.3, probe: 1.6, pump: 1.2, compare: 1.8,
  plant: 2, credit: 1.4, repair: 1.2, confront: 2, pitch: 1, confess: 2.5 };
const TONE = { low: 2, high: 1.5, steady: 0.5 };

export function chooseAired(state, day) {
  const rng = streamFor(state.seed, `air:${day}`);
  const today = state.scenes.filter(s => s.day === day);
  for (const s of today) s.aired = ALWAYS_AIRS.has(s.kind);
  const chats = today.filter(s => s.kind === 'chat').map(s => [s,
    (DRAMA[s.data.intent] || 0.5) + (s.data.ending === 'cold' ? 1.5 : 0) + (s.data.claims?.length || 0)
    + 1.5 * (s.data.slips || []).filter(x => x.noticedBy.length).length + (s.data.probes?.length || 0)
    + (s.data.pact ? 0.8 : 0) + rng() * 0.5]);
  chats.sort((a, b) => b[1] - a[1]).slice(0, CHATS_PER_DAY).forEach(([s]) => { s.aired = true; });
  today.filter(s => s.kind === 'status').map(s => [s, (TONE[s.data.tone] || 0) + rng()])
    .sort((a, b) => b[1] - a[1]).slice(0, STATUSES_PER_DAY).forEach(([s]) => { s.aired = true; });
}
```

- [ ] **Step 4: Add `sceneBlocks`, `writeScene`, `writeDay` to `js/ci/script.js`** — implement the table above as one function per scene kind (`BLOCKS[kind](state, scene) → [{ key, cast, extra }]`, where `extra` adds scene-derived facts such as `band`, `claim`, `lie`, `slip`, `noticed`, `reasonKind`, `self`, `place`). `writeScene` builds facts with `factsFor` + `extra`, picks with `pickEntry(state, key, facts, pairKey, streamFor(state.seed, \`line:${scene.id}:${i}\`))` (pairKey = sorted cast handles joined), renders with `renderEntry`, and stores `scene.script = { blocks }`. A key with no pool (the pool tasks have not written it yet) yields no block — never an error. `writeDay` runs `writeScene` over the day's aired scenes in order and adds the `host.cold` block to the first one.

- [ ] **Step 5: Wire it into `js/ci/season.js`** — before `airDay(state)`:

```js
    chooseAired(state, d.day);
    if (state.options.script !== false) writeDay(state, d.day);
```

and in the row: `aired: state.scenes.filter(s => s.day === d.day && s.aired).map(s => ({ id: s.id, kind: s.kind, who: s.who, script: s.script || null }))`. Add `script: true` to `newState`'s default options.

- [ ] **Step 6: Run** `tests/ci-airing.test.js` and every `tests/ci-*.test.js` — PASS. Re-run `audit:ci-spec` and record in the commit message which numbers moved (the public now sees only aired scenes, so Fan Favorite numbers may shift).

- [ ] **Step 7: Commit** · `feat(the-circle): the edit — what airs, and a script on every aired scene`

---

### Task 4: `npm run ci:transcript`

**Files:** Create `js/ci/transcript.js`, `tests/ci-transcript-audit.test.js`; Modify `package.json`

**Interfaces — Produces:** `speakerLabel(state, handle) → 'Alejandro (as Maddie)' | 'Bridgette'`, `blockText(state, block) → string[]`, `dayText(state, row) → string`, `seasonText(state, rows) → string`, `seasonHtml(state, rows) → string`.

Text form of a block:

```
  [Alejandro is on the couch with a bowl of cereal.]
  ALEJANDRO (as Maddie), aloud: "Okay. Bridgette looked rattled after last night."
  ALEJANDRO (as Maddie) dictates: Message: "Hey Bridgette, exclamation point…" Hug emoji. Send.
      ▸ MADDIE: Hey Bridgette! How you holding up after last night? 🤗
  BRIDGETTE reads it: "Aw. That's actually really sweet."
      ▸ BRIDGETTE: Honestly? Still shaking lol. But thank you ❤️
  — Alejandro leaves the chat and goes back to the cereal.
```

The first `send` of a block is shown dictated; later ones show only the screen line (the real edit does the same). Host lines print as `HOST: …` with the registry host name.

The harness: `CI_SEED=n CI_CAST=13 npm run ci:transcript` → `transcripts/ci-season-<seed>.txt` and `.html` (gitignored). Stand-in real names for the synthetic cast (a readable list, alternating by gender) and the pool's persona handles. Script in `package.json`: `"ci:transcript": "vitest run --config vitest.audit.config.js tests/ci-transcript-audit.test.js"`.

- [ ] Steps: write `transcript.js` with a unit test in `tests/ci-script.test.js` (`blockText` of a rendered block equals the expected lines); write the harness; run it; open the file and check Day 1 reads top to bottom. Commit.

---

### Tasks 5–10: The pools

Every pool task follows the same loop, and is not done until its guard (Task 10's rules, run early) passes and one transcript has been read for its scenes:

1. Write the entries into `js/ci/lines/<file>.js` as `export const LINES = { '<key>': [ … ] }` and merge it in `lines/index.js`.
2. At least **3 entries with no `when`** per key; conditioned entries on top for the moods and pair facts that change what a real player would say.
3. Write in the register of the transcripts: plain, warm, rude, funny from the situation. Real examples to hold the tone (1×01–1×02): *"I'm not gonna be the first one to talk. I'm gonna wait."* · *"Girl, I am shaking in my space boots, exclamation point."* · *"You're kinda sayin' too much of all the right things."* · *"So, now what we're getting ready to do is a very special thing."* · *"Why would they name it that?"*
4. Run `npm run ci:transcript`, read every scene of the new kinds in one season, fix, commit.

| Task | File(s) | Keys | Entries (first pass) |
|---|---|---|---|
| 5 | `chat.js`, `slips.js` | `chat.<13 intents>.<warm\|neutral\|cold>`, `chat.probe.<pass\|dodge\|fail>`, `slip.<6 kinds>.<noticed\|missed>`, `slip.misread` | ~330 |
| 6 | `feed.js`, `circle.js`, `profiles.js` | `status.<low\|steady\|high>`, `status.react`, `likes.most`, `likes.none`, `circle.open`, `circle.party`, `circle.final`, `circle.theory`, `profile.<honest\|polished\|edited\|catfish\|shared>`, `recognise`, `arrival`, `arrival.react`, `afterparty` | ~190 |
| 7 | `ratings.js`, `hangout.js`, `blocking.js` | `ratings.open`, `rate.<9 reasons>.<top\|bottom>`, `result.<bottom\|middle\|top>`, `result.influencers`, `hangout.open`, `hangout.view.<4 reasons>.<cut\|keep>`, `hangout.<agree\|yield\|trade\|pact>`, `block.announce.<4 reasons>`, `block.react.<self\|friend\|rival\|relief>` | ~230 |
| 8 | `visit.js`, `goodbye.js` | `visit.choose.<4 motives>`, `visit.wait`, `visit.wait.catfish`, `visit.door.<real\|catfish>`, `visit.talk.<4 motives>`, `visit.hand`, `visit.kiss`, `visit.bye`, `report`, `goodbye.guess`, `goodbye.video.<honest\|polished\|edited\|shared>`, `goodbye.video.catfish.<6 reason kinds>`, `goodbye.warning.<catfish\|distrusts>`, `goodbye.react.<4>` | ~170 |
| 9 | `finale.js` | `circle.final` (if not in 6), `final.rate.<reasons>`, `meet.arrive.<real\|catfish>`, `meet.explain.<reason kinds>`, `reveal.place`, `reveal.winner` | ~80 |
| 10 | `host.js` + `tests/ci-lines.test.js` | `host.cold` (keyed by yesterday: blocking, arrival, visit, quiet), `host.<scene kind>` bridges; the guards below | ~150 + guards |

Content rules each pool obeys (from the transcripts and spec §17):

- **Chats:** the sender `say`s the plan when it differs from the message (always for `plant`, `credit`, `probe`, `cover`, and for a catfish often); `lie: true` entries (plant, false credit) only for scheme-eligible speakers (the key's scenes are already scheme-only). A `cold` ending ends in somebody leaving the chat, not a punchline. Probes use the persona's `tells` as the topic only through data (`{topic}` slot from the scene's probe), never invented.
- **Ratings aloud:** one line per ranked position, in the style of *"Circle, please put Alana in first position. She's my favorite. She's blonde. I sound shallow."* The reason line must match the engine's reason (`affection` → a friend; `suspicion` → "I just don't believe you"; `threat` → "everyone's gonna gun for them"; `pact` → keeping a promise).
- **Hangout:** each influencer `send`s pros and cons and `say`s what they really think (*"If I had to block someone I didn't like, it would be Chris. But Chris isn't a threat right now"*).
- **Blocking:** the announcement is typed with suspense (*"The Player we decided to block is, dot, dot, dot"*); the blocked player's reaction is the longest.
- **Visit:** every waiting apartment panics differently (getting dressed, cleaning up, rehearsing blame); a catfish dreads the door. At the door the lines depend on who is real.
- **Goodbye:** guess before playing (*"It's gotta be a guy"*), the video's structure (greeting, identity, why, lesson or warning, good luck), then reactions: guilt from the blockers, "I knew it" from the suspecters, fear from the warned.
- **Host:** about one line every four to six aired beats; jokes about what is on screen (*"As Chris's poster becomes the straightest thing in his apartment…"*), never over a blocking reaction or a confession. Host lines may use `{x.aka}` and real pronouns.

`tests/ci-lines.test.js` — the guards (written in Task 10, run from Task 5 on):
- ids unique; ids start with their pool key; every `by` in `ROLES`; every slot matches `\{(a|b|c)(\.(real|aka|sub|obj|pos|posAdj|ref|Sub|Obj|PosAdj))?\}` or `\{(e|t):…\}`, and `real`/`aka` appear only in `host` turns and in `stage`/`beat`.
- every `when` key in `FACT_KEYS`; every pool key that `sceneBlocks` can produce has ≥ 3 unconditioned entries.
- emoji keys exist in `EMOJI`; hashtags are CamelCase words.
- no names: every name in `franchise_roster.json` and every stand-in and persona handle in the test helpers is absent from pool text (word-boundary match), with a short allowlist of names that are also ordinary words.
- no other show's vocabulary (`tests/helpers/show-vocabulary.js`).
- **CLEVER** denylist on beats and host lines (Perfect Match's list plus anything the read-throughs find).
- **Questions get answers:** a turn whose last sentence ends in `?` must be followed by a turn by another speaker, unless the entry has `leaves: true`.
- **American English:** none of `colour, favourite, mum, realise, whilst, apologise, organise, flat (as apartment), mate, bloody, cheers mate`.
- over five played seasons: every aired scene of a written kind has a script; no rendered text contains `{`; every `c` in a chat block is the subject of a claim the speaker holds (knowledge violations = 0).

---

### Task 11: Repetition and coverage in the audit

**Files:** Modify `tests/ci-spec-audit.test.js`

Add, over the hundred seasons: aired scenes per day; blocks per aired scene; per pool key: plays per season, distinct entries used, worst repeat of one entry in a season; the share of aired scenes of each kind with no block (a missing pool); line + pair repeats (must be 0 — the guard forbids them, so a non-zero is a bug). Print the twenty worst pools. Commit.

### Task 12: Read the output

This is the task that finds what the guards cannot (ADDING-A-SHOW §16.1).

1. `CI_SEED=7 npm run ci:transcript` and `CI_SEED=19 …`. Read, end to end: Day 1, a rating day with a visit, the day after (goodbye video), a newcomer day, the final-ratings day and the finale.
2. Fix every line that: is an idiom near-miss; is clever instead of plain; says what the speaker cannot know; leaves a question unanswered; contradicts the engine's decision (ending, reason, motive); uses a real name where the profile name belongs, or the wrong pronoun for a persona.
3. Add each new bad pattern to the CLEVER list or a guard.
4. Show the user **one full day's transcript** (not samples) and ask for their read before closing the plan.
5. Commit the fixes; record the Task 11 numbers in the commit message.

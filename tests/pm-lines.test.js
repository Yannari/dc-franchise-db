import { describe, expect, it } from 'vitest';
import { setPlayers } from '../js/core.js';
import { POOLS, HUT, NARRATOR, SPEAKERS, FACT_KEYS, renderScript, speak } from '../js/pm/script.js';
import { SLOTS, REGIONAL_WORDS } from '../js/pm/lines/dialect.js';
import { DAY } from '../js/pm/lines/day.js';
import { foreignWordsIn } from './helpers/show-vocabulary.js';

// Every entry in every pool, with its variant blocks opened out.
const ENTRIES = [...Object.entries(POOLS).flatMap(([k, pool]) => pool.map(e => [k, e])),
  ...Object.entries(HUT).flatMap(([k, pool]) => pool.map(e => [`hut:${k}`, e])),
  ...Object.entries(NARRATOR).flatMap(([k, pool]) => pool.map(e => [`narrator:${k}`, e]))];
function texts(e) {
  const out = [e.stage, e.beat];
  for (const t of e.turns || []) {
    if (Array.isArray(t)) out.push(t[1]);
    else for (const v of t.vary) { out.push(v.beat); for (const [, x] of v.turns) out.push(x); }
  }
  return out.filter(Boolean);
}
function turns(e) {
  return (e.turns || []).flatMap(t => (Array.isArray(t) ? [t] : t.vary.flatMap(v => v.turns)));
}
const whens = e => [e.when, ...(e.turns || []).flatMap(t => (Array.isArray(t) ? [] : t.vary.map(v => v.when)))].filter(Boolean);
const beats = e => [e.beat, ...(e.turns || []).flatMap(t => (Array.isArray(t) ? [] : t.vary.map(v => v.beat)))].filter(Boolean);

// A knowing last line is how prose starts reading like a translation (spec
// §16.5, round 3). Grows as the read-throughs find more.
const STINGS = ['the energy of', 'nobody asked for', 'which is new', "it doesn't help", 'they both notice',
  'sits with it', 'main character', 'understood the assignment', 'and honestly', 'in this economy'];

describe('the pools are well-formed', () => {
  it('ids are unique', () => {
    const ids = ENTRIES.map(([, e]) => e.id);
    expect(ids.length).toBe(new Set(ids).size);
  });
  it('speakers are a, b, c, dior or narrator', () => {
    for (const [k, e] of ENTRIES) for (const [who] of turns(e)) expect(SPEAKERS, `${k} ${e.id}`).toContain(who);
  });
  it('every condition is a known fact', () => {
    for (const [k, e] of ENTRIES) for (const w of whens(e)) for (const key of Object.keys(w)) {
      expect(FACT_KEYS, `${k} ${e.id}: ${key}`).toContain(key);
    }
  });
  it('a scene only names the people its kind casts', () => {
    // comedy casts one islander, gossip three, everything else two. A {b}
    // in a one-person scene renders as a raw placeholder, or as nobody.
    const CAST = { comedy: 1, gossip: 3, 'head-turned': 1, 'jealous-sulk': 1, overthinking: 1,
      'jealous-confront': 3, 'jealous-retaliate': 3, advice: 3,
      entrance: 1, steal: 3, 'recouple-pick': 3, 'dump-verdict': 1, 'dump-fallout': 1, 'snog-marry-pie': 4,
      'movie-night': 2, reveal: 2, 'dump-at-risk': 1, 'ex-return': 1, 'top-couple-pick': 4, 'couples-vote': 4, 'dump-verdict-couple': 2, 'dump-verdict-singles': 2, 'group-entrance': 2,
      'stand-up': 3, 'nobody-stands': 1, 'stand-up-pick': 3, 'bombshell-save': 3, 'public-match': 3,
      'return-entrance': 1, 'return-ex': 3, 'mission-brief': 1, 'mission-dump': 3, 'sleepover-invite': 3, 'sleepover-choice': 3,
      'challenge-text': 1, 'first-arrival': 2, 'step-forward': 2, 'host-open': 0, 'host-first': 0, intro: 1, receipt: 4, 'look-who': 3, 'snogger-row': 3, 'couple-goals': 4, 'couple-goals-row': 3, 'talent-snub': 3,
      'arrival-chat': 3, 'first-toast': 3, debrief: 3, 'bombshell-react': 3, 'movie-react': 3, 'casa-host': 0, 'casa-react': 3, 'casa-return': 2, 'photo-text': 1, 'pile-in': 3 };
    for (const [k, e] of ENTRIES) {
      if (k.startsWith('hut:') || k.startsWith('narrator:')) continue;
      const size = CAST[k] || 2;
      const allowed = ['a', 'b', 'c', 'd'].slice(0, size);
      for (const x of texts(e)) for (const [, who] of x.matchAll(/\{([abcd])[.}]/g)) expect(allowed, `${k} ${e.id}: ${x}`).toContain(who);
      for (const [who] of turns(e)) if (['a', 'b', 'c', 'd'].includes(who)) expect(allowed, `${k} ${e.id}`).toContain(who);
    }
  });
  it("{pa} and {pb} only appear where that partner exists", () => {
    // {pa} is a's partner: the entry (or a's own reply) must require `taken`.
    // {pb} is b's partner: the entry must require `bTaken`, or b's own reply `taken`.
    const has = (x, slot) => new RegExp(`\{${slot}[.}]`).test(x);
    for (const [k, e] of ENTRIES) {
      const own = [e.stage, e.beat, ...(e.turns || []).filter(Array.isArray).map(t => t[1])].filter(Boolean);
      for (const x of own) {
        if (has(x, 'pa')) expect(e.when?.taken, `${k} ${e.id}: ${x}`).toBe(true);
        if (has(x, 'pb')) expect(e.when?.bTaken, `${k} ${e.id}: ${x}`).toBe(true);
      }
      for (const blk of (e.turns || []).filter(t => !Array.isArray(t))) for (const v of blk.vary) {
        for (const x of [v.beat, ...v.turns.map(t => t[1])].filter(Boolean)) {
          const aOk = e.when?.taken || (blk.by === 'a' && v.when?.taken);
          const bOk = e.when?.bTaken || (blk.by === 'b' && v.when?.taken);
          if (has(x, 'pa')) expect(!!aOk, `${k} ${e.id}: ${x}`).toBe(true);
          if (has(x, 'pb')) expect(!!bOk, `${k} ${e.id}: ${x}`).toBe(true);
        }
      }
    }
  });
  it('every day-to-day pool has at least three scenes anyone can get', () => {
    // A condition that matches nobody must still find a scene. Gossip is cast
    // only for a witness, so `knows` is always true there and counts as none.
    for (const [k, pool] of Object.entries(DAY)) {
      const open = pool.filter(e => !e.when || (k === 'gossip' && Object.keys(e.when).join() === 'knows'));
      expect(open.length, k).toBeGreaterThanOrEqual(3);
    }
  });
  it('every variant block has a plain reply with no condition', () => {
    for (const [k, e] of ENTRIES) for (const t of e.turns || []) {
      if (!Array.isArray(t)) expect(t.vary.some(v => !v.when), `${k} ${e.id}`).toBe(true);
    }
  });
});

describe('the words follow the rules', () => {
  it('no subject pronoun: "they" breaks the verb after it ("they is", "they\'s")', () => {
    for (const [k, e] of ENTRIES) for (const x of texts(e)) expect(x, `${k} ${e.id}`).not.toMatch(/\{[abc]\.(sub|Sub)\}/);
  });
  it('no name is written into a pool, only placeholders', () => {
    for (const [k, e] of ENTRIES) for (const x of texts(e)) {
      // A capitalised word straight after a placeholder slot's usual place would be a name;
      // the practical check is that nothing but {a}/{b}/{c} forms appear in braces.
      for (const [m] of x.matchAll(/\{(?!~)[^}]*\}/g)) expect(m, `${k} ${e.id}`).toMatch(/^\{(quote|quoteWho|day|side|Side|sideOne|walkers|Walkers|walkerOne|where|Where|(pa|pb|a|b|c|d)(\.(obj|pos|posAdj|ref|Obj|PosAdj|gf))?)\}$/);
      expect(x, `${k} ${e.id}`).not.toMatch(/\bDior\b/);
    }
  });
  it("no other show's vocabulary", () => {
    for (const [k, e] of ENTRIES) for (const x of texts(e)) expect(foreignWordsIn(x, 'perfect-match'), `${k} ${e.id}: ${x}`).toEqual([]);
  });
  it('no line built to be clever', () => {
    // Found reading played seasons (user: "trying too much to be clever … like
    // a translation"). A beat that undercuts the scene for a laugh, or a reply
    // written as an epigram. Grows every read-through.
    const CLEVER = ['it takes another', 'nobody can argue', 'within the hour', 'rest of the series', 'lasts about',
      'there was nothing on', 'counts it as', "that's how i knew", "that's the whole plan", 'just maths',
      'but on purpose', "that's just my face", 'nobody said everyone', 'i\'ve been doing the maths',
      'finds their plates', 'for all the wrong reasons', 'the bar is on the floor', 'this is how it ends',
      'i will die on this hill', 'less obviously', "that's the secret", 'better. worse. both',
      // round 5: jokes you have to decode (user: "whats the knife bit")
      'the knife bit', 'four times.', 'half a dance', 'i sent myself', 'my legs, and the foam', "partner's face knows",
      'better than the right thing', 'a reason face', "it's for drinking", 'turn heads', 'twice, if it goes well',
      'cause something else', 'a really nice job'];
    const bad = [];
    for (const [k, e] of ENTRIES) for (const x of texts(e)) for (const c of CLEVER) if (x.toLowerCase().includes(c)) bad.push(`${k} ${e.id}: "${c}"`);
    expect(bad).toEqual([]);
  });
  it('no sting endings', () => {
    for (const [k, e] of ENTRIES) for (const x of [...beats(e), ...turns(e).filter(([w]) => w === 'narrator').map(t => t[1])]) {
      for (const s of STINGS) expect(x.toLowerCase(), `${k} ${e.id}`).not.toContain(s);
    }
  });
});

describe('every islander talks like where they are from', () => {
  const narration = e => [e.stage, e.beat, ...(e.turns || []).filter(t => !Array.isArray(t)).flatMap(b => b.vary.map(v => v.beat))].filter(Boolean);
  it('slots are only in spoken lines, and every slot exists', () => {
    for (const [k, e] of ENTRIES) {
      for (const x of narration(e)) expect(x, `${k} ${e.id}: narration is neutral`).not.toMatch(/\{~/);
      for (const [, x] of turns(e)) for (const [, key] of x.matchAll(/\{~([A-Za-z-]+)\}/g)) expect(SLOTS, `${k} ${e.id}`).toHaveProperty(key.toLowerCase());
    }
  });
  it('no regional word is written straight into a line', () => {
    const bare = x => x.replace(/\{~[A-Za-z-]+\}/g, ' ').toLowerCase();
    const bad = [];
    for (const [k, e] of ENTRIES) {
      if (whens(e).some(w => w.dialect)) continue;   // a line written for one dialect may use its words
      for (const x of texts(e)) for (const w of REGIONAL_WORDS) {
        if (new RegExp(`\\b${w}\\b`).test(bare(x))) bad.push(`${k} ${e.id}: "${w}" in: ${x}`);
      }
    }
    expect(bad).toEqual([]);
  });
  it('no British-only grammar in a neutral line ("I was sat", "was stood")', () => {
    for (const [k, e] of ENTRIES) for (const x of texts(e)) {
      expect(x, `${k} ${e.id}`).not.toMatch(/\b(was|were|be|been|is|am|are|'m|'re|'s)\s+(sat|stood)\b/i);
      expect(x, `${k} ${e.id}: a bare "Course" is British; say "Of course"`).not.toMatch(/(^|[.!?…]\s+)Course\b/);
    }
  });
  it('the speaker, not the scene, decides the words', () => {
    expect(speak("Mate, my {~mum} loves {~telly}. It's my favourite.", 'us')).toBe("Mate, my mom loves TV. It's my favorite.");
    expect(speak('My {~mum} loves {~telly}.', 'uk')).toBe('My mum loves the telly.');
    expect(speak('{~Mate}, {~oh-my-days}.', 'uk')).toBe('Mate, oh my days.');
    expect(speak('{~Mate}, {~oh-my-days}.', 'us')).toBe('Man, oh my God.');
    expect(speak('I promise.', 'us')).toBe('I promise.');
  });
  it('a region only says what differs, and falls back to its base', () => {
    expect(speak('{~Mate}, look at {~telly}.', 'scot')).toBe('Pal, look at the telly.');       // telly from uk
    expect(speak('My {~mum} is {~buzzing}.', 'geordie')).toBe('My mam is buzzing.');
    expect(speak('{~Mate}, my {~mum} loves {~telly}.', 'ca')).toBe('Buddy, my mom loves TV.');  // mom, TV from us
    expect(speak('I am {~buzzing}, {~bro}.', 'nz')).toBe('I am stoked, bro.');                    // stoked from au
    expect(speak('It is my favourite colour.', 'ca')).toBe('It is my favourite colour.');        // Canada spells like the UK
    expect(speak('{~Oh-my-days}.', 'za')).toBe('Eish.');
  });
  it('a second-language speaker gets plain words and their own, never broken English', () => {
    expect(speak("{~Mate}, I'm {~knackered}.", 'es')).toMatch(/my friend|My friend/);
    expect(speak('{~Oh-my-days}.', 'it')).toBe('Mamma mia.');
    // The shaping is decided by the line, so it never changes between renders.
    const lines = ["I'm not going anywhere, and I mean it.", "That's not what I said to you last night.",
      "Honestly, I don't know what I want right now.", "You're the only one I talk to like this."];
    for (const x of lines) expect(speak(x, 'fr')).toBe(speak(x, 'fr'));
    // Across many lines some get their own word, and none loses a word it needs.
    const sample = Array.from({ length: 200 }, (_, i) => `I think this is line number ${i} and it is fine.`);
    const opened = sample.map(x => speak(x, 'fr')).filter(x => /^(Bon|Enfin|Oh là là),/.test(x));
    expect(opened.length).toBeGreaterThan(5);
    expect(opened.length).toBeLessThan(80);
    for (const x of opened) expect(x).toMatch(/ I think this is line number \d+ and it is fine\.$/);
  });
});

describe('the reply is the replier\'s own', () => {
  const entry = { id: 't', turns: [['a', 'Can I borrow you?'], { by: 'b', vary: [
    { turns: [['b', 'plain']] },
    { when: { persona: 'wallflower' }, turns: [['b', 'quiet']], beat: 'quiet beat' },
    { when: { archetype: 'hothead' }, turns: [['b', 'hot']] },
  ] }] };
  const state = persona => ({ ep: 1, seed: 1, secrets: [], couples: [], ledger: { firstEp: {} }, emo: {},
    profiles: { A: { persona: 'fuckboy', role: 'starter', stats: { loyalty: 5 } },
      B: { persona, role: 'starter', stats: { loyalty: 5 } } } });
  it("reads b's persona when b replies, not a's", () => {
    setPlayers([{ name: 'A' }, { name: 'B' }]);
    const s = renderScript(entry, ['A', 'B'], state('wallflower'));
    expect(s.lines.map(l => l.text)).toEqual(['Can I borrow you?', 'quiet']);
    expect(s.beat).toBe('quiet beat');
    expect(s.id).toBe('t:1');
  });
  it('reads the archetype from the roster', () => {
    setPlayers([{ name: 'A' }, { name: 'B', archetype: 'hothead' }]);
    expect(renderScript(entry, ['A', 'B'], state('checklist')).lines[1].text).toBe('hot');
  });
  it('falls back to the plain reply when nothing fits', () => {
    setPlayers([{ name: 'A' }, { name: 'B' }]);
    expect(renderScript(entry, ['A', 'B'], state('checklist')).lines[1].text).toBe('plain');
  });
});

describe('a confessional is about its scene', () => {
  it('every hut line names the scene it answers — there is no general fallback', () => {
    for (const [stance, pool] of Object.entries(HUT)) for (const e of pool) {
      expect(!!(e.when?.kind || e.when?.family), `${stance} ${e.id}`).toBe(true);
    }
  });
  it('a solo scene sets the scene: who is there, and who is being spoken to', () => {
    for (const e of POOLS.comedy) expect(e.stage, e.id).toBeTruthy();
  });
});

describe('a line happens at its own time of day', () => {
  // Season 11 read, 2026-09-23: "Morning kiss? / I haven't brushed my teeth"
  // in the evening, "At breakfast, Amber says it to the whole table" in the
  // middle of the challenge. A line that sets the scene at a time of day is
  // gated to it — and only to a time its kind actually plays.
  const texts = e => [e.stage, e.beat, ...(e.turns || []).flatMap(t => Array.isArray(t) ? [t[1]]
    : (t.vary || []).flatMap(v => [v.beat, ...(v.turns || []).map(x => x[1])]))].filter(Boolean).join(' ');
  const phases = e => [].concat(e.when?.phase || []);
  const MORNING = /\b(making (everyone )?breakfast|make breakfast for|before breakfast|morning kiss|brushed my teeth|just woken)\b/i;
  // "At breakfast" sets a scene only in a stage direction ("you rolled your
  // eyes at breakfast" is somebody remembering it).
  const STAGE_MORNING = /\bat breakfast\b/i;
  const NIGHT = /\b(goodnight|night, then|a quick kiss before the fire pit|help me with my hair before the fire pit)\b/i;
  it('morning words only in the morning, night words only at night', () => {
    const bad = [];
    for (const [k, pool] of Object.entries(DAY)) for (const e of pool) {
      const t = texts(e);
      if (MORNING.test(t) && !phases(e).includes('morning')) bad.push(`${k} ${e.id}: ${t.match(MORNING)[0]}`);
      if (STAGE_MORNING.test(e.stage || '') && !phases(e).includes('morning')) bad.push(`${k} ${e.id}: at breakfast`);
      if (NIGHT.test(t) && !phases(e).includes('evening')) bad.push(`${k} ${e.id}: ${t.match(NIGHT)[0]}`);
    }
    expect(bad).toEqual([]);
  });
  it('a line gated to a time of day is one its kind can play at', async () => {
    const { PHASE_KINDS } = await import('../js/pm/events.js');
    const when = Object.fromEntries(Object.keys(DAY).map(k => [k, Object.entries(PHASE_KINDS).filter(([, ks]) => ks.some(([x]) => x === k)).map(([p]) => p)]));
    const bad = [];
    for (const [k, pool] of Object.entries(DAY)) {
      if (!when[k].length) continue;   // a kind cast outside the day (loyalty, making up): no phase to check
      for (const e of pool) for (const p of phases(e)) if (!when[k].includes(p)) bad.push(`${k} ${e.id}: ${p}`);
    }
    expect(bad).toEqual([]);
  });
});

// @vitest-environment jsdom
// The Total Drama dialogue layer (spec 2026-10-06 §5, §8).
//
// A camp event decides its scene (who, what ending, where, who saw it); the
// words are picked afterwards from pools keyed on the ending, through the
// picker shared with The Circle and Big Brother (js/script/pick.js). These
// tests hold the pools to their contract and play a real season to check what
// comes out.
import { describe, expect, it } from 'vitest';
import fs from 'fs';
import { POOLS, GUARANTEED } from '../js/td/script/lines/index.js';
import { TD_FACT_KEYS, CONTEXT_SLOTS } from '../js/td/script/facts.js';
import { makeScene, witness } from '../js/td/script/scene.js';
import { fill } from '../js/td/script/write.js';
import { runOneSeason, seededRun, core } from './helpers/season-harness.js';

const ROLES = new Set(['a', 'b', 'c']);
const FLOOR = 6;
// Keys that only say WHAT was decided — an entry gated on these alone still fits every scene of its kind.
// 'third' and 'more' are structural (how many people the scene holds), so each case needs its own floor:
// an alliance of three must never be written by an entry that only has two people in it.
const DECIDED = new Set(['ending', 'result', 'intent', 'reason', 'size', 'third', 'more']);
const texts = e => e.turns.map(t => t.say || t.conf || t.beat);
const all = Object.entries(POOLS);

describe('the pools keep their contract', () => {
  it('every entry id is unique across every pool', () => {
    const ids = all.flatMap(([, pool]) => pool.map(e => e.id));
    expect(ids.filter((id, i) => ids.indexOf(id) !== i)).toEqual([]);
  });

  it('keys are family.kind.ending', () => {
    for (const [key] of all) expect(key, key).toMatch(/^[a-z]+\.[a-z-]+\.[a-z-]+$/);
  });

  it('filters only on facts the writer knows', () => {
    for (const [key, pool] of all) for (const e of pool) {
      for (const k of Object.keys(e.when || {})) expect(TD_FACT_KEYS, `${key} ${e.id} filters on '${k}'`).toContain(k);
    }
  });

  it('is big enough, and always has something that fits', () => {
    for (const [key, pool] of all) {
      expect(pool.length, `${key} is under the floor`).toBeGreaterThanOrEqual(FLOOR);
      // For every value a pool splits on (a final two or a final three), at least three entries fit any scene.
      const splits = {};
      for (const e of pool) for (const [k, v] of Object.entries(e.when || {})) if (DECIDED.has(k)) (splits[k] ||= new Set()).add(v);
      const combos = Object.keys(splits).length ? Object.entries(splits).flatMap(([k, vs]) => [...vs].map(v => ({ [k]: v }))) : [{}];
      for (const combo of combos) {
        const fits = pool.filter(e => Object.entries(e.when || {}).every(([k, v]) => DECIDED.has(k) && (combo[k] === undefined || combo[k] === v)));
        expect(fits.length, `${key} ${JSON.stringify(combo)} has too few entries that always fit`).toBeGreaterThanOrEqual(3);
      }
    }
  });

  it('never writes an entry that is only narration', () => {
    for (const [key, pool] of all) for (const e of pool) {
      expect(e.turns.some(t => t.say || t.conf), `${key} ${e.id} has nobody speaking`).toBe(true);
    }
  });

  it('gives every turn a known speaker and exactly one kind of line', () => {
    for (const [key, pool] of all) for (const e of pool) for (const t of e.turns) {
      const kinds = ['say', 'conf', 'beat'].filter(k => t[k]);
      expect(kinds.length, `${key} ${e.id}: a turn is one of say / conf / beat`).toBe(1);
      if (t.say || t.conf) expect(ROLES.has(t.by), `${key} ${e.id}: speaker '${t.by}'`).toBe(true);
    }
  });

  it('only writes a third person into a scene that has one', () => {
    // island trios and group moments always hold a third (td/script/island.js)
    const WITH_C = [/^isle\.(trio|group)\./, /^drama\.stir\./, /^romance\.(noticed|target|jealous|sidelined|sabotage)\./, /^romance\.(tri|affair)\./];
    for (const [key, pool] of all) {
      if (WITH_C.some(re => re.test(key))) continue;
      for (const e of pool) {
        if (e.when?.third === true) continue;
        expect(/\{c[}.]|"by":"c"/.test(JSON.stringify(e.turns)), `${key} ${e.id} speaks for a third person who is not there`).toBe(false);
      }
    }
  });

  it('only says "tonight" where the camp is voting tonight', () => {
    // Gossip airs after the challenge in BOTH camps; the winners have no vote tonight.
    for (const [key, pool] of all) for (const e of pool) {
      if (e.when?.tribal === true || (GUARANTEED[key] || []).includes('tribal')) continue;
      for (const x of texts(e)) expect(/tonight/i.test(x), `${key} ${e.id}: ${x}`).toBe(false);
    }
  });

  it('only gives a reason the engine knows', () => {
    // {rival}, {threat}, {lastBoot}... are names td/script/context.js read at the scene.
    // A line that says one must ask for it, or it prints a raw slot (or a name that is not true).
    for (const [key, pool] of all) for (const e of pool) {
      const used = CONTEXT_SLOTS.filter(k => texts(e).some(x => x.includes(`{${k}`)));
      for (const k of used) if (!(GUARANTEED[key] || []).includes(k)) expect(e.when?.[k], `${key} ${e.id} says {${k}} without when.${k}`).toBe(true);
    }
  });

  it('only talks about the team before the merge', () => {
    // Seed 4242: "If we lose again, it's going to be Cody" aired at the merge, when nobody has a team.
    const TEAM = /(if we lose|we lose again|our team|my team|your team|the team|won us|lost us|team challenge)/i;
    for (const [key, pool] of all) for (const e of pool) {
      if (e.when?.merged === false) continue;
      for (const x of texts(e)) expect(TEAM.test(x), `${key} ${e.id}: ${x}`).toBe(false);
    }
  });

  it('only stages a place where the scene is', () => {
    // Settings differ (a hosted camp has cabins and a mess hall; a survival island has a
    // shelter and a beach; a film lot has trailers). Found writing pools: "dish duty",
    // "a boat home", "{fallen}'s bunk" in entries that fit every setting. A setting's own
    // word belongs in an entry gated on the spot it is true in.
    const PLACE = /(cabins?|bunks?|lake|boat|chef|mess hall|dock|trays?|dish(es)?|plates?|island|shelter|trailers?|plane)/i;
    // An island scene is always on an island: its shelter, its boat and its dishes (coconut shells) are true there.
    const ISLE_PLACE = /(cabins?|bunks?|chef|mess hall|dock|trays?|trailers?|plane)/i;
    for (const [key, pool] of all) for (const e of pool) {
      if (e.when?.spot) continue;
      // the mess hall's own drama is only ever staged in the mess hall (settings.js: hosted-camp)
      if (key.startsWith('drama.mess.')) continue;
      const re = key.startsWith('isle.') ? ISLE_PLACE : PLACE;
      for (const x of texts(e)) expect(re.test(x) ? x.match(re)[0] : null, `${key} ${e.id}: ${x}`).toBe(null);
    }
  });

  it('never speaks a line with no words in it', () => {
    // A spoken "..." is a silence the reader has to decode (feedback 2026-09-22 #7):
    // write the beat instead ("{b} doesn't say anything.").
    for (const [key, pool] of all) for (const e of pool) for (const t of e.turns) {
      if (t.say || t.conf) expect(/[a-z]/i.test(t.say || t.conf), `${key} ${e.id}: "${t.say || t.conf}"`).toBe(true);
    }
  });

  it('never writes a cast member into a pool', () => {
    // {a} and {b} are filled at render time. A name in a pool is somebody else's line.
    // Names that are also ordinary English words ("Will you…", "a few miles", "the lake") are skipped.
    const WORDS = new Set(['Brick', 'Chase', 'Dawn', 'Junior', 'Lightning', 'Miles', 'Rock', 'Sugar', 'Will', 'Hunter', 'Lake', 'Jade']);
    const names = JSON.parse(fs.readFileSync('franchise_roster.json', 'utf8')).players.map(p => p.name).filter(n => n.length > 3 && !WORDS.has(n));
    const re = new RegExp(`\\b(${names.map(n => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`);
    for (const [key, pool] of all) for (const e of pool) for (const x of texts(e)) {
      expect(re.test(x) ? x.match(re)[0] : null, `${key} ${e.id}: ${x}`).toBe(null);
    }
  });
});

describe('the pools read for every camper', () => {
  it('names everyone a drama or romance scene holds', () => {
    // A scene with {b} or {c} in it places them on screen; a line that never names them leaves a
    // person standing there for no reason (found writing the triangle pools, 2026-10-07: 52 lines).
    const needC = /^romance\.(noticed|target|jealous|sidelined|sabotage|tri\.(dual|onesided|tension|confront|escalate|exploit|fight|ultimatum|reject|faded)|affair\.(noticed|rumor|caught|exposed|stays|leaves))|^drama\.stir/;
    const soloB = /^(drama\.(meltdown|read|showboat)|romance\.tri\.lonely)/;
    const bad = [];
    for (const [key, pool] of all) {
      if (!/^(drama|romance)\./.test(key)) continue;
      for (const e of pool) {
        const t = JSON.stringify(e.turns);
        if (!soloB.test(key) && !/\{b[}.]|"by":"b"/.test(t)) bad.push(`${key} ${e.id}: no {b}`);
        if (needC.test(key) && !/\{c[}.]|"by":"c"/.test(t)) bad.push(`${key} ${e.id}: no {c}`);
      }
    }
    expect(bad).toEqual([]);
  });

  it('never puts a verb that only agrees with he or she after a pronoun slot', () => {
    // "{b.sub} has" prints "they has"; "{b.sub}'s" prints "they's".
    const bad = /\{[a-z]+\.[sS]ub\}('s\b|\s+(has|is|was|does|doesn't|isn't|wasn't|hasn't|[a-z]+[^s']s)\b)/;
    for (const [key, pool] of all) for (const e of pool) for (const x of texts(e)) expect(bad.test(x), `${key} ${e.id}: ${x}`).toBe(false);
  });

  it('no line built to be clever', () => {
    // Carried over from Perfect Match (tests/pm-lines.test.js) and grown each
    // read-through: a beat that undercuts the scene for a laugh, an epigram reply,
    // a meme construction. Say the plain thing.
    const CLEVER = ['it takes another', 'nobody can argue', "that's how i knew", "that's the whole plan", 'but on purpose',
      'for all the wrong reasons', 'the bar is on the floor', 'this is how it ends', "that's the secret", 'better. worse. both',
      'would like a word', 'doing a lot of work', 'with extra steps', 'which says enough', 'which is an answer',
      'a second too long', 'longer than it needed', 'somehow that', 'is proof of that',
      // Total Drama's own narration habits (seed 4242 read, 2026-10-06)
      'whether it means anything', 'is a question for later', "that's the point", 'something had changed',
      'nobody notices', "doesn't know it happened", 'the work speaks', 'it does not go unnoticed', 'surgical',
      'files it away', 'files that away', 'recalculates', 'the mechanism', 'permanently.',
      'say that to everyone', 'works on everyone', 'costs me nothing',
      // round 2 (own read, 2026-10-06): epigram replies
      "unless you shouldn't", "can't be disappointed", 'least scary way', 'thinks the challenge is a buffet'];
    const bad = [];
    for (const [key, pool] of all) for (const e of pool) for (const x of texts(e)) for (const c of CLEVER) {
      if (x.toLowerCase().includes(c)) bad.push(`${key} ${e.id}: "${c}"`);
    }
    expect(bad).toEqual([]);
  });
});

describe('knowledge has a witness', () => {
  it('lets the people there learn, and refuses anyone who was not', () => {
    const s = makeScene('deal.side', { a: 'Heather', b: 'Cody' }, { ending: 'genuine' }, ['Owen']);
    expect(witness(s, 'Owen')).toBe(true);
    expect(() => witness(s, 'Gwen')).toThrow(/Gwen learned from a deal.side scene/);
  });

  it('fills names and data, and leaves an unknown slot visible', () => {
    expect(fill('{a} and {b}: final {size}. {nope}', { a: 'Gwen', b: 'Trent' }, { size: 'two' })).toBe('Gwen and Trent: final two. {nope}');
  });
});

describe('a played season', () => {
  const NAMES = ['Alejandro', 'Heather', 'Gwen', 'Duncan', 'Courtney', 'Owen', 'Izzy', 'Cody', 'Sierra',
    'Lindsay', 'Harold', 'Leshawna', 'Noah', 'Bridgette', 'Geoff', 'Trent'];
  const roster = JSON.parse(fs.readFileSync('franchise_roster.json', 'utf8')).players;
  const events = [];
  seededRun(() => runOneSeason({ romance: 'enabled' }, 16,
    NAMES.map((n, i) => ({ ...roster.find(r => r.name === n), tribe: i % 2 ? 'Bass' : 'Gophers' }))), 4242);
  for (const ep of core.gs.episodeHistory) for (const feed of Object.values(ep.campEvents || {})) {
    for (const e of Array.isArray(feed) ? feed : [...(feed?.pre || []), ...(feed?.post || [])]) events.push(e);
  }
  const scripted = events.filter(e => e.lines);

  it('the converted events fire and come out as scripts', () => {
    expect(scripted.length).toBeGreaterThan(5);
    expect(events.filter(e => e.type === 'sideDeal' && !e.lines)).toEqual([]);
  });

  it('fills every slot, and nobody speaks who is not in the scene', () => {
    for (const e of scripted) {
      for (const l of e.lines) {
        expect(l.text, `${e.type} ${e.scene.lineId}`).not.toMatch(/\{\w+(\.\w+)?\}/);
        // a scene in parts may bring new people in a later part (the leak who warns the target)
        const cast = [e.scene, ...(e.scene.parts || [])].flatMap(p => Object.values(p.who || {}));
        if (l.kind !== 'beat') expect(cast, `${e.type} ${e.scene.lineId}: ${l.by}`).toContain(l.by);
      }
      expect(e.text).toBeTruthy();
    }
  });

  it('nobody speaks in a scene after they have left the game', () => {
    // Found reading seed 4242: Courtney "found out" about a broken deal the episode
    // after she was voted out, and Alejandro withdrew a deal from Sierra a day after
    // she left. The events never checked who was still there.
    const gone = new Set(), ghosts = [];
    for (const ep of core.gs.episodeHistory) {
      for (const feed of Object.values(ep.campEvents || {})) {
        for (const e of Array.isArray(feed) ? feed : [...(feed?.pre || []), ...(feed?.post || [])]) {
          for (const l of e.lines || []) if (l.kind !== 'beat' && gone.has(l.by)) ghosts.push(`ep${ep.num} ${e.type}: ${l.by}`);
        }
      }
      if (ep.eliminated) gone.add(ep.eliminated);
    }
    expect(ghosts).toEqual([]);
  });

  it('everyone a scene holds appears in it', () => {
    // Seed 4242: Sierra co-founded The Trifecta in a scene written for two, and
    // never appeared in it; a four-person alliance was introduced as "the three of us".
    const missing = [];
    for (const e of scripted) {
      const shown = new Set(e.lines.flatMap(l => [l.by, ...Object.values(e.scene.who).filter(n => l.text.includes(n))]));
      const more = String(e.scene.data?.more || '');
      for (const n of Object.values(e.scene.who)) if (!shown.has(n) && !more.includes(n)) missing.push(`${e.type} ${e.scene.lineId}: ${n}`);
      for (const n of e.players || []) if (e.type === 'allianceForm' && !e.text.includes(n)) missing.push(`${e.type} ${e.scene.lineId}: member ${n}`);
    }
    expect(missing).toEqual([]);
  });

  it('survives a save', () => {
    const back = JSON.parse(JSON.stringify(scripted));
    expect(back.map(e => e.lines)).toEqual(scripted.map(e => e.lines));
  });
});

describe('the wrong suspect was at the vote', () => {
  it('nobody is blamed for a council they were not at', () => {
    // Seed 4242 ep 6: Sierra (Gophers) blamed Heather (Bass) for a Gophers vote.
    const NAMES = ['Alejandro', 'Heather', 'Gwen', 'Duncan', 'Courtney', 'Owen', 'Izzy', 'Cody', 'Sierra',
      'Lindsay', 'Harold', 'Leshawna', 'Noah', 'Bridgette', 'Geoff', 'Trent'];
    const roster = JSON.parse(fs.readFileSync('franchise_roster.json', 'utf8')).players;
    const bad = [];
    let seen = 0;
    for (const seed of [4242, 777, 31337]) {
      seededRun(() => runOneSeason({ romance: 'enabled' }, 16,
        NAMES.map((n, i) => ({ ...roster.find(r => r.name === n), tribe: i % 2 ? 'Bass' : 'Gophers' }))), seed);
      const hist = core.gs.episodeHistory;
      hist.forEach((ep, i) => {
        const prev = hist[i - 1];
        if (!prev) return;
        const voters = new Set((prev.votingLog || []).map(v => v.voter));
        for (const feed of Object.values(ep.campEvents || {})) {
          for (const e of Array.isArray(feed) ? feed : [...(feed?.pre || []), ...(feed?.post || [])]) {
            if (e.type !== 'misattribution') continue;
            seen++;
            if (voters.size && !voters.has(e.players[1])) bad.push(`s${seed} ep${ep.num}: ${e.players[0]} blames ${e.players[1]}`);
          }
        }
      });
    }
    expect(seen).toBeGreaterThan(0);
    expect(bad).toEqual([]);
  }, 300000);
});

// ci-shared.test.js — a shared profile played as two people (Plan 3a Task 13).
//
// The user's example: Mateo and Luis, brothers, one profile "Mateo" — Mateo's
// face, Luis's brain. They argue over every message, so "Mateo" is slow but
// hard to trap; the younger brother's flirting and the older brother's
// caution don't sound like one person, which everyone eventually notices.
import { describe, expect, it } from 'vitest';
import { streamFor } from '../js/dr/rng.js';
import { room } from './helpers/ci-room.js';
import { addScene } from '../js/ci/state.js';
import { belief } from '../js/ci/beliefs.js';
import { planChats } from '../js/ci/chat.js';
import { probe, rollSlips } from '../js/ci/slips.js';
import { rolesFor, leadFor, noticeInconsistency, INCONSISTENT_AT } from '../js/ci/shared.js';
import { writeScene } from '../js/ci/script.js';
import { POOLS } from '../js/ci/lines/index.js';

const base = { physical: 5, endurance: 5, mental: 5, social: 5, strategic: 5, loyalty: 5, boldness: 5, intuition: 5, temperament: 5 };
const MATEO = { name: 'Mateo', gender: 'm', sexuality: 'straight', archetype: 'showmancer', age: 26,
  stats: { ...base, social: 8, boldness: 8, strategic: 4, temperament: 6 } };
const LUIS = { name: 'Luis', gender: 'm', sexuality: 'straight', archetype: 'loyal-soldier', age: 31,
  stats: { ...base, social: 5, boldness: 3, strategic: 8, temperament: 3 }, facts: ['three kids at home'] };

/** A room whose profile @q0 is played by two people. */
function withPair(a = MATEO, b = LUIS, seed = 1, n = 6) {
  const s = room(n, seed);
  delete s.people.Q0;
  s.people[a.name] = { ...a, stats: { ...a.stats } };
  s.people[b.name] = { ...b, stats: { ...b.stats } };
  Object.assign(s.profiles['@q0'], { players: [a.name, b.name], mode: 'shared', shared: true, gap: 0.5,
    shown: { name: a.name, gender: a.gender, age: a.age } });
  s.profiles['@q0'].roles = rolesFor(s, [a.name, b.name]);
  s.handleOf[a.name] = '@q0'; s.handleOf[b.name] = '@q0';
  return s;
}

describe('who does what', () => {
  it('makes the more social one the face and the more strategic one the brain, unless the author says otherwise', () => {
    const s = withPair();
    expect(s.profiles['@q0'].roles).toEqual({ face: 'Mateo', brain: 'Luis' });
    s.people.Mateo.face = 'Luis'; s.people.Mateo.brain = 'Mateo';
    expect(rolesFor(s, ['Mateo', 'Luis'])).toEqual({ face: 'Luis', brain: 'Mateo' });
  });

  it('lets Mateo win the flirts and Luis the pitches, most of the time', () => {
    const s = withPair();
    let mateoFlirts = 0, luisPitches = 0;
    for (let i = 0; i < 500; i++) {
      if (leadFor(s, '@q0', 'flirt', streamFor(i, 'f')) === 'Mateo') mateoFlirts++;
      if (leadFor(s, '@q0', 'pitch', streamFor(i, 'p')) === 'Luis') luisPitches++;
    }
    expect(mateoFlirts).toBeGreaterThan(350);
    expect(luisPitches).toBeGreaterThan(250);
  });
});

describe('slow but hard to trap', () => {
  it('opens fewer chats than one player with the same averaged stats (control arm)', () => {
    let pair = 0, solo = 0;
    for (let seed = 1; seed <= 40; seed++) {
      const s = withPair(MATEO, LUIS, seed);
      pair += planChats(s, streamFor(seed, 'c'), {}).filter(p => p.from === '@q0').length;
      const c = withPair(MATEO, LUIS, seed);
      c.profiles['@q0'].players = ['Mateo'];
      c.people.Mateo.stats = Object.fromEntries(Object.keys(base).map(k => [k, (MATEO.stats[k] + LUIS.stats[k]) / 2]));
      solo += planChats(c, streamFor(seed, 'c'), {}).filter(p => p.from === '@q0').length;
    }
    expect(pair).toBeLessThan(solo);
  });

  it('fails fewer probes than the same profile played alone (control arm)', () => {
    const fails = shared => {
      let n = 0;
      for (let seed = 1; seed <= 400; seed++) {
        const s = withPair(MATEO, LUIS, seed);
        Object.assign(s.profiles['@q0'], { gap: 2 });
        if (!shared) s.profiles['@q0'].players = ['Mateo'];
        const sc = addScene(s, 'chat', ['@q1', '@q0'], { intent: 'probe' });
        if (probe(s, streamFor(seed, 'p'), '@q1', '@q0', sc) === 'fail') n++;
      }
      return n;
    };
    expect(fails(true)).toBeLessThan(fails(false));
  });
});

describe('the blind spot', () => {
  const voiceSlips = (a, b) => {
    let n = 0;
    for (let seed = 1; seed <= 400; seed++) {
      const s = withPair(a, b, seed);
      const sc = addScene(s, 'chat', ['@q0', '@q1'], { intent: 'bond' });
      rollSlips(s, streamFor(seed, 'v'), '@q0', ['@q1'], { specific: 1, attention: 0.6 }, sc);
      n += (sc.data.slips || []).filter(x => x.kind === 'voice').length;
    }
    return n;
  };

  it('slips on voice more the more different the two are (brothers vs twins)', () => {
    const TWIN = { ...MATEO, name: 'Marco', stats: { ...MATEO.stats } };
    expect(voiceSlips(MATEO, LUIS)).toBeGreaterThan(voiceSlips(MATEO, TWIN));
  });

  it('builds an inconsistency score that, past a few notices, costs belief in the profile', () => {
    const s = withPair();
    const sc = addScene(s, 'chat', ['@q0', '@q1'], { intent: 'bond' });
    const drops = [];
    for (let i = 0; i < INCONSISTENT_AT + 2; i++) {
      const before = belief(s, '@q1', '@q0').real;
      noticeInconsistency(s, '@q1', '@q0', sc);
      drops.push(before - belief(s, '@q1', '@q0').real);
    }
    expect(s.inconsistency['@q1']['@q0']).toBe(INCONSISTENT_AT + 2);
    expect(drops.slice(0, INCONSISTENT_AT).every(d => d === 0)).toBe(true);
    expect(drops.slice(INCONSISTENT_AT).every(d => d > 0)).toBe(true);
  });

  it('lets the hidden brother\'s life leak: his facts become knowledge slips', () => {
    let withFacts = 0, without = 0;
    for (let seed = 1; seed <= 400; seed++) {
      for (const facts of [['three kids at home', 'coaches little league'], []]) {
        const s = withPair(MATEO, { ...LUIS, facts }, seed);
        const sc = addScene(s, 'chat', ['@q0', '@q1'], { intent: 'bond' });
        rollSlips(s, streamFor(seed, 'k'), '@q0', ['@q1'], { specific: 1 }, sc);
        const k = (sc.data.slips || []).filter(x => x.kind === 'knowledge').length;
        if (facts.length) withFacts += k; else without += k;
      }
    }
    expect(withFacts).toBeGreaterThan(without);
  });
});

describe('the argument airs', () => {
  it('opens a shared profile\'s chat with the two of them arguing, before the message is sent', () => {
    const s = withPair();
    const saved = { ...POOLS };
    POOLS['chat.flirt.warm'] = [{ id: 'chat.flirt.warm.t1', turns: [{ by: 'a', send: 'Hey {b}' }] }];
    POOLS['shared.argue.faceWins'] = [{ id: 'shared.argue.faceWins.t1', stage: '{a.face} and {a.brain} share one keyboard.',
      turns: [{ by: 'brain', say: "Don't send that." }, { by: 'face', say: 'Watch me.' }] }];
    const sc = addScene(s, 'chat', ['@q0', '@q1'], { intent: 'flirt', ending: 'warm', claims: [], slips: [], lead: 'Mateo' });
    const blocks = writeScene(s, sc).blocks;
    for (const k of Object.keys(POOLS)) delete POOLS[k];
    Object.assign(POOLS, saved);
    expect(blocks.map(b => b.key)).toEqual(['shared.argue.faceWins', 'chat.flirt.warm']);
    const [stage, l1, l2] = blocks[0].lines;
    expect(stage.text).toBe('Mateo and Luis share one keyboard.');
    expect(l1).toMatchObject({ person: 'Luis', kind: 'say', text: "Don't send that." });
    expect(l2).toMatchObject({ person: 'Mateo', kind: 'say' });
  });
});

import { fill, renderEntry } from '../js/ci/script.js';

describe('a pair on the page', () => {
  it('names one of the two in the staging, with that person\'s pronouns — the lead if there is one, else the face', () => {
    const s = withPair();
    s.people.Luis.gender = 'f';
    expect(fill(s, '{a} leans back and smiles at {a.posAdj} screen.', { a: '@q0' }, 'narration')).toBe('Mateo leans back and smiles at his screen.');
    expect(fill(s, '{a} leans back and smiles at {a.posAdj} screen.', { a: '@q0', personA: 'Luis' }, 'narration')).toBe('Luis leans back and smiles at her screen.');
  });

  it('labels the lead as the one dictating the message', () => {
    const s = withPair();
    const r = renderEntry(s, { id: 'x', turns: [{ by: 'a', say: 'Okay.', send: 'Hi {b}' }] }, { a: '@q0', b: '@q1', personA: 'Luis' }, streamFor(1, 'x'));
    expect(r.lines.every(l => l.person === 'Luis')).toBe(true);
  });
});

describe('the finale meet', () => {
  it('reveals a shared profile as two people, whether it walks in or is found waiting', () => {
    const s = withPair();
    const walksIn = writeScene(s, addScene(s, 'meet', ['@q0', '@q1', '@q2', '@q3'], {})).blocks;
    expect(walksIn.map(b => b.key)).toContain('meet.arrive.shared');
    expect(walksIn.map(b => b.key)).toContain('meet.explain.shared');
    const people = new Set(walksIn.flatMap(b => b.lines.map(l => l.person)));
    expect(people.has('Mateo') && people.has('Luis')).toBe(true);
    const found = writeScene(s, addScene(s, 'meet', ['@q1', '@q0'], {})).blocks;
    expect(found.map(b => b.key).slice(0, 2)).toEqual(['meet.found.shared', 'meet.explain.shared']);
  });
});

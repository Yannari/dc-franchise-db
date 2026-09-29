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

import { speakerLabel, blockText } from '../js/ci/transcript.js';

describe('the transcript', () => {
  it('labels a catfish with the persona, and prints a block the way the edit plays it', () => {
    const s = room();
    expect(speakerLabel(s, '@rebecca')).toBe('SEABURN (as Rebecca)');
    expect(speakerLabel(s, '@shubham')).toBe('SHUBHAM');
    const block = { id: 'x.1', beat: 'Seaburn smiles.', lines: [
      { who: '@shubham', kind: 'stage', text: 'Shubham sits down.' },
      { who: '@shubham', kind: 'say', text: 'Let me check on her.' },
      { who: '@shubham', kind: 'send', text: 'Hey Rebecca! You good?', spoken: 'Message: "Hey Rebecca, exclamation point." Send.' },
      { who: '@rebecca', kind: 'react', text: 'Aw.' },
      { who: '@rebecca', kind: 'send', text: 'All good ❤️', spoken: 'Message: "All good." Heart emoji. Send.' },
      { who: 'host', kind: 'host', text: 'Adorable.' }] };
    expect(blockText(s, block)).toEqual([
      '  [Shubham sits down.]',
      '  SHUBHAM, aloud: "Let me check on her."',
      '  SHUBHAM dictates: Message: "Hey Rebecca, exclamation point." Send.',
      '      ▸ SHUBHAM: Hey Rebecca! You good?',
      '  SEABURN (as Rebecca): "Aw."',
      '      ▸ REBECCA: All good ❤️',
      '  HOST: Adorable.',
      '  — Seaburn smiles.',
    ]);
  });
});

import { writeScene } from '../js/ci/script.js';

describe('repetition within a day, and slips inside the chat', () => {
  it('rarely reuses a line already used today, even for a different pair', () => {
    let repeats = 0;
    for (let i = 0; i < 40; i++) {
      const s = room();
      POOLS['test.day'] = [
        { id: 'test.day.1', turns: [{ by: 'a', say: 'one' }] },
        { id: 'test.day.2', turns: [{ by: 'a', say: 'two' }] },
        { id: 'test.day.3', turns: [{ by: 'a', say: 'three' }] },
      ];
      const first = pickEntry(s, 'test.day', {}, 'pair-1', streamFor(i, 'x'));
      const second = pickEntry(s, 'test.day', {}, 'pair-2', streamFor(i + 500, 'y'));
      if (first.id === second.id) repeats++;
    }
    delete POOLS['test.day'];
    expect(repeats).toBeLessThan(4);
  });

  it('never reuses a line from today while an older one still fits, however worn', () => {
    for (let i = 0; i < 20; i++) {
      const s = room();
      POOLS['test.day'] = [1, 2, 3].map(n => ({ id: `test.day.${n}`, turns: [{ by: 'a', say: String(n) }] }));
      s.usedLines = { uses: { 'test.day.2': 12, 'test.day.3': 12 }, pairs: {}, day: { 'test.day.2': 1, 'test.day.3': 2 } };
      const first = pickEntry(s, 'test.day', {}, 'pair-1', streamFor(i, 'x'));
      const second = pickEntry(s, 'test.day', {}, 'pair-2', streamFor(i + 500, 'y'));
      delete POOLS['test.day'];
      expect(first.id).toBe('test.day.1');
      expect(second.id).not.toBe('test.day.1');
    }
  });

  it('weaves a slip into the chat it happened in, before the chat\'s last beat', () => {
    const s = room();
    POOLS['chat.bond.warm'] = [{ id: 'chat.bond.warm.t1', turns: [{ by: 'a', send: 'Hi {b}' }], beat: '{a} smiles.' }];
    POOLS['slip.misread'] = [{ id: 'slip.misread.t1', turns: [{ by: 'a', send: 'I love it here' }, { by: 'b', react: 'Too nice.' }], beat: '{b} frowns.' }];
    const sc = addScene(s, 'chat', ['@shubham', '@sammie'], { intent: 'bond', ending: 'warm', claims: [],
      slips: [{ by: '@shubham', kind: 'tooPerfect', noticedBy: ['@sammie'], misread: true }] });
    writeScene(s, sc);
    delete POOLS['chat.bond.warm']; delete POOLS['slip.misread'];
    expect(sc.script.blocks).toHaveLength(1);
    const kinds = sc.script.blocks[0].lines.map(l => `${l.kind}:${l.text}`);
    expect(kinds).toEqual(['send:Hi Sammie', 'send:I love it here', 'react:Too nice.', 'stage:Sammie frowns.']);
    expect(sc.script.blocks[0].beat).toBe('Shubham smiles.');
  });
});

import { sceneBlocks } from '../js/ci/script.js';
import { revealTo } from '../js/ci/reveal.js';

describe('the visit and the goodbye know what was seen', () => {
  it('lets the visitor react when the one who opens the door is the catfish', () => {
    const s = room();
    const sc = addScene(s, 'visit', ['@shubham', '@rebecca'], { motive: 'truth', kiss: false, handed: null });
    const keys = sceneBlocks(s, sc).map(b => `${b.key}:${b.cast.a}>${b.cast.b}`);
    expect(keys.filter(k => k.startsWith('visit.door'))).toEqual(['visit.door.caught:@shubham>@rebecca']);
  });

  it('opens the door once when both sides of it are catfish', () => {
    const s = room();
    s.profiles['@sammie'].mode = 'catfish';
    const sc = addScene(s, 'visit', ['@sammie', '@rebecca'], { motive: 'truth', kiss: false, handed: null });
    const doors = sceneBlocks(s, sc).filter(b => b.key.startsWith('visit.door')).map(b => b.key);
    expect(doors).toEqual(['visit.door.both']);
  });

  it('warns as a fact, not a hunch, about a catfish the blocked player met in person', () => {
    const s = room();
    const v = addScene(s, 'visit', ['@shubham', '@rebecca'], { motive: 'truth', kiss: false, handed: null });
    revealTo(s, '@shubham', '@rebecca', v);
    const sc = addScene(s, 'goodbye', ['@shubham'], { mode: 'honest', warning: { about: '@rebecca', kind: 'catfish' } }, ['@rebecca', '@sammie']);
    const w = sceneBlocks(s, sc).find(b => b.key.startsWith('goodbye.warning'));
    expect(w.key).toBe('goodbye.warning.seen');
  });
});

describe('the finalists meet', () => {
  it('lets the second arrival find out the catfish who walked in first', () => {
    const s = room();
    s.profiles['@rebecca'].reason = 'protective';
    const sc = addScene(s, 'meet', ['@shubham', '@rebecca'], { arrives: '@shubham' });
    const keys = sceneBlocks(s, sc).map(b => `${b.key}:${b.cast.a}>${b.cast.b}`);
    expect(keys).toEqual(['meet.found:@shubham>@rebecca', 'meet.explain.protective:@rebecca>@shubham']);
  });

  it('gives two catfish meeting one scene, and both explanations', () => {
    const s = room();
    s.profiles['@sammie'].mode = 'catfish'; s.profiles['@sammie'].reason = 'family';
    const sc = addScene(s, 'meet', ['@sammie', '@rebecca'], { arrives: '@sammie' });
    const keys = sceneBlocks(s, sc).map(b => `${b.key}:${b.cast.a}>${b.cast.b}`);
    expect(keys).toEqual(['meet.both:@sammie>@rebecca', 'meet.explain.family:@sammie>@rebecca',
      'meet.explain.strategic:@rebecca>@sammie']);
  });
});

import { writeDay } from '../js/ci/script.js';

describe('the host', () => {
  it('bridges about one aired beat in five, and never over a confession', () => {
    const s = room();
    const saved = { ...POOLS };
    POOLS['chat.bond.warm'] = [{ id: 'chat.bond.warm.t1', turns: [{ by: 'a', send: 'Hi {b}' }] }];
    POOLS['chat.confess.warm'] = [{ id: 'chat.confess.warm.t1', turns: [{ by: 'a', send: 'I lied, {b}' }] }];
    POOLS['host.chat'] = [{ id: 'host.chat.t1', turns: [{ by: 'host', say: 'Meanwhile, {a} is typing.' }] }];
    for (let i = 0; i < 12; i++) {
      const sc = addScene(s, 'chat', ['@shubham', '@sammie'], { intent: i === 5 ? 'confess' : 'bond', ending: 'warm', claims: [], slips: [] });
      sc.aired = true;
    }
    writeDay(s, s.day);
    for (const k of Object.keys(POOLS)) delete POOLS[k];
    Object.assign(POOLS, saved);
    const hosted = s.scenes.filter(x => x.script.blocks.some(b => b.key === 'host.chat'));
    expect(hosted.length).toBe(2);
    expect(hosted.some(x => x.data.intent === 'confess')).toBe(false);
    expect(hosted[0].script.blocks[0].lines[0]).toMatchObject({ kind: 'host', text: 'Meanwhile, Shubham is typing.' });
  });
});

import { rel } from '../js/ci/state.js';

describe('what the host and the Hangout may say', () => {
  it('opens the first day with a first-day line, from its own pool', () => {
    const s = room();
    s.day = 1;
    const sc = addScene(s, 'status', ['@sammie'], {});
    sc.aired = true;
    const saved = POOLS['status.steady'];
    POOLS['status.steady'] = [{ id: 'status.steady.t1', turns: [{ by: 'a', post: 'Hi' }] }];
    writeDay(s, 1);
    POOLS['status.steady'] = saved;
    expect(sc.script.blocks[0].key).toBe('host.cold.first');
  });

  it('knows whether the one discussing c actually likes c', () => {
    const s = room();
    bump('@shubham', '@sammie', 'affection', 6);
    const sc = addScene(s, 'hangout', ['@shubham', '@rebecca'], {});
    expect(factsFor(s, sc, { a: '@shubham', b: '@rebecca', c: '@sammie' }).likesC).toBe(true);
    expect(factsFor(s, sc, { a: '@rebecca', b: '@shubham', c: '@sammie' }).likesC).toBe(false);
    void rel;
  });
});

describe('the Hangout', () => {
  it('lets the two Influencers take turns opening each name', () => {
    const s = room();
    const sc = addScene(s, 'hangout', ['@shubham', '@sammie'], { atRisk: ['@rebecca'], target: '@rebecca', reason: 'threat',
      views: [{ handle: '@rebecca' }, { handle: '@rebecca' }], offers: [], decider: '@shubham' });
    const views = sceneBlocks(s, sc).filter(b => b.key.startsWith('hangout.view')).map(b => b.cast.a);
    expect(views).toEqual(['@shubham', '@sammie']);
  });
});

import { GAMES } from '../js/ci/games-data.js';

describe('games, parties, apartment life and videos from home — on the page', () => {
  const withPools = (pools, fn) => {
    const saved = { ...POOLS };
    Object.assign(POOLS, pools);
    try { return fn(); } finally { for (const k of Object.keys(POOLS)) delete POOLS[k]; Object.assign(POOLS, saved); }
  };
  const e = (key, turns) => [{ id: `${key}.t1`, turns }];

  it('opens a game with its rules read aloud, then a block per round, then the prize', () => {
    const s = room();
    const g = GAMES.find(x => x.id === 'ice-breaker');
    const sc = addScene(s, 'game', [...s.active], { gameId: g.id, family: 'statement',
      rounds: [{ promptId: 'shower', answers: { '@rebecca': 'agree', '@shubham': 'disagree', '@sammie': 'disagree' }, lone: '@rebecca' }],
      results: {}, prize: { kind: 'party', to: ['@sammie'] } });
    const blocks = withPools({
      'game.open': e('game.open', [{ by: 'a', react: '"{q}" — it\'s {game}!' }]),
      'game.statement.agree': e('game.statement.agree', [{ by: 'a', say: 'Agree. "{q}"' }, { by: 'b', react: 'What?' }]),
      'game.statement.disagree': e('game.statement.disagree', [{ by: 'a', say: 'Disagree.' }]),
      'game.statement.lone': e('game.statement.lone', [{ by: 'a', react: 'Only {b}?' }]),
      'game.prize.party': e('game.prize.party', [{ by: 'a', react: 'A party!' }]),
    }, () => writeScene(s, sc).blocks);
    expect(blocks.map(b => b.key)).toEqual(['game.open', 'game.statement.agree', 'game.statement.lone', 'game.prize.party']);
    expect(blocks[0].lines[0].text).toBe(`"${g.rules[0]}" — it's Ice Breaker!`);
    expect(blocks[1].lines[0].text).toBe(`Agree. "It's okay to pee in the shower."`);
    expect(blocks[2].lines[0].text).toBe('Only Rebecca?');
  });

  it('opens a party with its props, and plays each Never Have I Ever round', () => {
    const s = room();
    const sc = addScene(s, 'party', [...s.active], { theme: 'nineties', props: ['a windbreaker', 'butterfly clips', 'a boom box'],
      rounds: [{ by: '@shubham', statement: 'lied-age', admitted: ['@sammie'] }, { by: '@sammie', statement: 'dared', admitted: [] }] });
    const blocks = withPools({
      'party.open': e('party.open', [{ by: 'a', react: '{game}! {q}!' }]),
      'party.nhie': e('party.nhie', [{ by: 'a', send: '{q}' }, { by: 'b', react: 'Guilty.' }]),
      'party.nhie.none': e('party.nhie.none', [{ by: 'a', send: '{q}' }]),
    }, () => writeScene(s, sc).blocks);
    expect(blocks.map(b => b.key)).toEqual(['party.open', 'party.nhie', 'party.nhie.none']);
    expect(blocks[0].lines[0].text).toBe('90s Party! a windbreaker, butterfly clips and a boom box!');
    expect(blocks[1].lines[0].text).toBe('Never have I ever lied about my age.');
  });

  it('shows a life scene and a home video with their own player only', () => {
    const s = room();
    const life = addScene(s, 'life', ['@sammie'], { habit: 'plushie' }, ['@sammie']);
    const home = addScene(s, 'home-video', ['@rebecca'], { catfish: true }, ['@rebecca']);
    const keys = [...sceneBlocks(s, life), ...sceneBlocks(s, home)].map(b => `${b.key}:${JSON.stringify(b.cast)}`);
    expect(keys).toEqual(['life.plushie:{"a":"@sammie"}', 'home.video:{"a":"@rebecca"}']);
  });
});

describe('a game that is not anonymous', () => {
  it('tells the pools whether the questions are anonymous', () => {
    const s = room();
    const mk = id => addScene(s, 'game', [...s.active], { gameId: id, family: 'ask',
      rounds: [{ promptId: 'ask', answers: {}, questions: [{ asker: '@shubham', target: '@sammie', kind: 'friendly' }] }], results: {}, prize: null });
    const ask = g => sceneBlocks(s, mk(g)).find(b => b.key === 'game.ask.friendly');
    expect(ask('ama').extra).toMatchObject({ anon: true });
    expect(ask('circle-of-fortune').extra).toMatchObject({ anon: false });
  });
});

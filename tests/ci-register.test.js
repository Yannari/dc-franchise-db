// How a player types (Plan 3a+ Task 14, layer 1). Every player has a
// register, derived from archetype, stats and age unless the author wrote one.
import { describe, expect, it } from 'vitest';
import { room } from './helpers/ci-room.js';
import { makePlayers } from './helpers/ci-cast.js';
import { REGISTERS, registerOf, registerOfPerson } from '../js/ci/register.js';
import { factsFor, pickEntry, renderEntry } from '../js/ci/script.js';
import { POOLS } from '../js/ci/lines/index.js';
import { streamFor } from '../js/dr/rng.js';

const base = { physical: 5, endurance: 5, mental: 5, social: 5, strategic: 5, loyalty: 5, boldness: 5, intuition: 5, temperament: 5 };
const person = (archetype, stats, age = 27, extra = {}) => ({ name: 'X', archetype, age, stats: { ...base, ...stats }, ...extra });

describe('a register for everyone', () => {
  it('reads the obvious ones the obvious way', () => {
    expect(registerOfPerson(person('showmancer', { social: 8, boldness: 7 }))).toBe('flirty');
    expect(registerOfPerson(person('hothead', { temperament: 1, boldness: 8 }))).toBe('blunt');
    expect(registerOfPerson(person('floater', { mental: 9, temperament: 8, boldness: 2, social: 4 }, 52))).toBe('formal');
    expect(registerOfPerson(person('social-butterfly', { social: 9, loyalty: 8, temperament: 7, boldness: 4 }))).toBe('warm');
    expect(registerOfPerson(person('chaos-agent', { boldness: 10, social: 7, temperament: 3 }, 23))).toBe('hype');
    expect(registerOfPerson(person('perceptive-player', { intuition: 9, social: 3, boldness: 3 }))).toBe('dry');
  });

  it('lets the author decide', () => {
    expect(registerOfPerson(person('showmancer', { social: 9 }, 27, { chatVoice: { register: 'formal' } }))).toBe('formal');
  });

  it('spreads a cast across every register, none taking over', () => {
    const n = {};
    let total = 0;
    for (let seed = 1; seed <= 30; seed++) {
      for (const p of makePlayers(13, seed)) { n[registerOfPerson(p)] = (n[registerOfPerson(p)] || 0) + 1; total++; }
    }
    for (const r of REGISTERS) {
      expect(n[r] / total, `${r}: ${JSON.stringify(n)}`).toBeGreaterThan(0.08);
      expect(n[r] / total, `${r}: ${JSON.stringify(n)}`).toBeLessThan(0.3);
    }
  });

  it('gives a shared profile the voice of whoever is typing', () => {
    const s = room(6, 1);
    s.people.Mateo = person('showmancer', { social: 8, boldness: 8 }, 26, { name: 'Mateo' });
    s.people.Luis = person('loyal-soldier', { mental: 8, strategic: 8, boldness: 2, temperament: 7 }, 41, { name: 'Luis' });
    Object.assign(s.profiles['@q0'], { players: ['Mateo', 'Luis'], mode: 'shared' });
    expect(registerOf(s, '@q0', 'Mateo')).toBe('flirty');
    expect(registerOf(s, '@q0', 'Luis')).toBe('formal');
  });
});

describe('the register reaches the screen', () => {
  it('is a fact about the speaker, and a line written for it wins most of the time', () => {
    const s = room(4, 1);
    s.people.Q0.chatVoice = { register: 'dry' };
    expect(factsFor(s, { data: {} }, { a: '@q0', b: '@q1' }).register).toBe('dry');
    POOLS['test.reg'] = [
      { id: 'test.reg.1', turns: [{ by: 'a', say: 'generic one' }] },
      { id: 'test.reg.2', turns: [{ by: 'a', say: 'generic two' }] },
      { id: 'test.reg.3', turns: [{ by: 'a', say: 'generic three' }] },
      { id: 'test.reg.4', when: { register: 'dry' }, turns: [{ by: 'a', say: 'sure. great.' }] },
    ];
    let dry = 0;
    for (let i = 0; i < 300; i++) {
      s.usedLines = { uses: {}, pairs: {}, day: {} };
      if (pickEntry(s, 'test.reg', { register: 'dry' }, 'p', streamFor(i, 'r')).id === 'test.reg.4') dry++;
    }
    delete POOLS['test.reg'];
    expect(dry / 300).toBeGreaterThan(0.45);
  });

  it('types a shared profile in the voice of whoever is at the keyboard', () => {
    const s = room(4, 1);
    s.people.Mateo = { name: 'Mateo', gender: 'm', archetype: 'showmancer', age: 26, stats: { ...base }, chatVoice: { register: 'hype' } };
    s.people.Luis = { name: 'Luis', gender: 'm', archetype: 'loyal-soldier', age: 31, stats: { ...base }, chatVoice: { register: 'dry' } };
    Object.assign(s.profiles['@q0'], { players: ['Mateo', 'Luis'], mode: 'shared', roles: { face: 'Mateo', brain: 'Luis' },
      voice: { emoji: 1, hashtags: 1, caps: 0 } });
    const entry = { id: 'x.1', turns: [{ by: 'a', send: 'Okay who is cooking tonight! Not me' }] };
    const luis = renderEntry(s, entry, { a: '@q0', b: '@q1', personA: 'Luis' }, () => 0.9).lines[0].text;
    expect(luis).toBe('okay who is cooking tonight. not me');
  });
});

// Layer 2: what an author writes about how somebody types. Any field may be
// empty; none of this names a character.
import { byAuthored } from '../js/ci/voice.js';
import { nicknameFor } from '../js/ci/register.js';

describe('an authored chat voice', () => {
  const always = () => 0;
  it('types in capitals when told to, and leaves emoji alone', () => {
    expect(byAuthored('Love you guys {e:heart}', { caps: 'all' }, () => 0.99)).toBe('LOVE YOU GUYS {e:heart}');
  });
  it('opens, fills and signs off with the author\'s own phrases', () => {
    expect(byAuthored('How is everyone', { openers: ['Per my last message,'] }, always)).toBe('Per my last message, how is everyone');
    expect(byAuthored('See you tomorrow {e:heart}', { fillers: ['bless'] }, always)).toBe('See you tomorrow, bless {e:heart}');
    expect(byAuthored('Have a good night', { signoffs: ['Love, Tyler'] }, always)).toBe('Have a good night. Love, Tyler');
  });
  it('keeps a name capitalized after a lead-in, and never leads in or signs off aloud', () => {
    expect(byAuthored('Nathan is sweet', { openers: ['Sweetheart,'] }, always)).toBe('Sweetheart, Nathan is sweet');
    expect(byAuthored('I rank Nathan first', { openers: ['Sweetheart,'], signoffs: ['Love, T'] }, always, { speech: true })).toBe('I rank Nathan first');
  });
  it('greets the group once in a Circle Chat', () => {
    expect(byAuthored("What's up", { greetings: ['MY BEAUTIFUL PEOPLE!'] }, always, { greet: true })).toBe("MY BEAUTIFUL PEOPLE! What's up");
    expect(byAuthored("What's up", { greetings: ['MY BEAUTIFUL PEOPLE!'] }, always)).toBe("What's up");
  });
  it('trails off and adds stage directions', () => {
    expect(byAuthored('The cards are saying something.', { ellipses: true }, always)).toBe('The cards are saying something...');
    expect(byAuthored('Thank you all', { brackets: ['[takes a bow]'] }, always)).toBe('Thank you all [takes a bow]');
  });
  it('speaks the phrases aloud too, but never shouts or trails off in speech', () => {
    expect(byAuthored('Okay, I have to rank', { caps: 'all', ellipses: true, fillers: ['forgetaboutit'] }, always, { speech: true }))
      .toBe('Okay, I have to rank, forgetaboutit');
  });
  it('leaves a message alone at a rate of nothing', () => {
    expect(byAuthored('Hi there', { openers: ['Yo'], rate: 0 }, always)).toBe('Hi there');
  });
});

describe('nicknames', () => {
  it('gives each person one nickname and keeps it', () => {
    const s = room(4, 1);
    s.people.Q0.chatVoice = { nicknames: true };
    const n1 = nicknameFor(s, 'Q0', '@q1');
    expect(n1).toMatch(/Q1/);
    expect(nicknameFor(s, 'Q0', '@q1')).toBe(n1);
    s.people.Q2.chatVoice = { nicknames: ['Sweet {name}'] };
    expect(nicknameFor(s, 'Q2', '@q1')).toBe('Sweet Q1');
    expect(nicknameFor(s, 'Q3', '@q1')).toBe(null);
  });
  it('uses them in what the player types and says', () => {
    const s = room(4, 1);
    s.people.Q0.chatVoice = { register: 'warm', nicknames: ['Big {name}'], rate: 0 };
    const entry = { id: 'x.1', turns: [{ by: 'a', say: 'Q1 is first.' }, { by: 'a', send: 'Hey Q1, you up?' }] };
    const lines = renderEntry(s, entry, { a: '@q0', b: '@q1' }, () => 0.9).lines.map(l => l.text);
    expect(lines).toEqual(['Big Q1 is first.', 'Hey Big Q1, you up?']);
  });
});

import { truthOf } from '../js/ci/profiles.js';
describe('where a chat voice comes from', () => {
  it('is read from the season setup, or from the player, the setup winning', () => {
    const p = { name: 'X', stats: {}, chatVoice: { register: 'dry' } };
    expect(truthOf(p, {}).chatVoice).toEqual({ register: 'dry' });
    expect(truthOf(p, { chatVoice: { register: 'hype' } }).chatVoice).toEqual({ register: 'hype' });
    expect(truthOf({ name: 'Y', stats: {} }, {}).chatVoice).toBe(null);
  });
});

describe('an authored voice reads like a person, not a filter', () => {
  const always = () => 0;
  it('never trails off after a question, and trails off once, not everywhere', () => {
    expect(byAuthored('What is your idea of a date?', { ellipses: true }, always)).toBe('What is your idea of a date?');
    expect(byAuthored('Very weird. Okay, talk later.', { ellipses: true }, () => 0.5)).toBe('Very weird. Okay, talk later...');
  });
  it('does not ask a question as a reply, or sign off a question', () => {
    expect(byAuthored('Cereal. For dinner', { openers: ["How's your heart today?"] }, always, { reply: true })).toBe('Cereal. For dinner');
    expect(byAuthored('Where are we going?', { signoffs: ['Thank you, thank you very much.'] }, always)).toBe('Where are we going?');
  });
});

describe('nobody repeats themselves', () => {
  it('passes over a line the same speaker already said, even with a new listener', () => {
    const s = room(4, 1);
    POOLS['test.self'] = [
      { id: 'test.self.1', when: { register: 'dry' }, turns: [{ by: 'a', say: 'Middle. Sure.' }] },
      { id: 'test.self.2', turns: [{ by: 'a', say: 'generic one' }] },
      { id: 'test.self.3', turns: [{ by: 'a', say: 'generic two' }] },
    ];
    let again = 0, first = 0;
    for (let i = 0; i < 200; i++) {
      s.usedLines = { uses: {}, pairs: {}, day: {} };
      if (pickEntry(s, 'test.self', { register: 'dry' }, 'a|b', streamFor(i, 'x'), '@q0').id !== 'test.self.1') continue;
      first++;
      s.usedLines.uses = {}; s.usedLines.day = {};   // another day: only what the speaker said stays
      if (pickEntry(s, 'test.self', { register: 'dry' }, 'a|c', streamFor(i + 999, 'y'), '@q0').id === 'test.self.1') again++;
    }
    delete POOLS['test.self'];
    expect(again / first).toBeLessThan(0.2);
  });
});

// ci-twotiming.test.js — playing more than one person, and getting caught
// (user, 2026-10-02: "is it possible to catch someone having romance with many
// people ... playing 2 or more people / cheating? are they limited in
// romance"). ci/twotiming.js, lines/twotiming.js.
import { describe, expect, it, beforeEach } from 'vitest';
import { setGs, setPlayers } from '../js/core.js';
import { streamFor } from '../js/dr/rng.js';
import { newState, bump, rel } from '../js/ci/state.js';
import { initMind } from '../js/ci/mind.js';
import { focusDamp, caught, gameTwoTimer, flingsOf, coupleFlirt, coupleRevealed, taken, noteKiss, kissFallout } from '../js/ci/twotiming.js';
import { makeClaim, learn } from '../js/ci/claims.js';
import { ciLedgerRecord } from '../js/ci/ledger-record.js';
import { runVisit } from '../js/ci/blocking.js';
import { addScene } from '../js/ci/state.js';
import { makePlayers, makePool } from './helpers/ci-cast.js';
import { playCircleSeason } from '../js/ci/season.js';
import { rosterCast, circleSetup } from './helpers/ci-cast.js';
import { DEFAULT_POOL } from '../js/ci/default-pool.js';

const STATS = { physical: 5, endurance: 5, mental: 5, social: 5, strategic: 5, loyalty: 5, boldness: 5, intuition: 5, temperament: 5 };
function room(over = {}, status = {}) {
  const s = newState(1); s.day = 4;
  const g = { P: 'm', B: 'f', C: 'f', D: 'f' };
  for (const n of ['P', 'B', 'C', 'D']) {
    s.people[n] = { name: n, gender: g[n], sexuality: 'straight', archetype: 'floater', stats: { ...STATS, ...(over[n] || {}) }, age: 25, status: status[n] || 'Single' };
    const h = `@${n.toLowerCase()}`;
    s.profiles[h] = { handle: h, players: [n], mode: 'honest', gap: 0, tells: [], shown: { name: n, gender: g[n], age: 25, status: status[n] || 'Single' } };
    s.active.push(h); initMind(s, h);
  }
  return s;
}
/** P has a romance going with B (and maybe C): flirts that landed, felt back. */
function romance(s, ...to) {
  for (const t of to) {
    ((s.flings ||= {})['@p'] ||= {})[t] = { day: s.day, scene: null };
    bump(t, '@p', 'attraction', 6); bump('@p', t, 'attraction', 6);
  }
}

describe('who can keep more than one romance going', () => {
  beforeEach(() => setGs({ bonds: {}, relationshipDimensions: {}, episodeHistory: [] }));
  it('a loyal player with a romance going leans away from a second; a disloyal one does not', () => {
    const loyal = room({ P: { loyalty: 9 } }); romance(loyal, '@b');
    setGs({ bonds: {}, relationshipDimensions: {}, episodeHistory: [] });
    const player = room({ P: { loyalty: 1 } }); romance(player, '@b');
    expect(focusDamp(loyal, '@p', '@c')).toBeLessThan(focusDamp(player, '@p', '@c'));
    expect(focusDamp(player, '@p', '@c')).toBeGreaterThan(0.85);
  });
  it('someone really in a relationship holds back, as much as they are loyal', () => {
    const single = room({ P: { loyalty: 8 } });
    const taken = room({ P: { loyalty: 8 } }, { P: 'Married' });
    expect(focusDamp(taken, '@p', '@c')).toBeLessThan(focusDamp(single, '@p', '@c'));
  });
  it('"Very single" is single; "It is complicated" holds back less than married', () => {
    const very = room({ P: { loyalty: 8 } }, { P: 'Very single' });
    const single = room({ P: { loyalty: 8 } });
    const complicated = room({ P: { loyalty: 8 } }, { P: "It's complicated" });
    const married = room({ P: { loyalty: 8 } }, { P: 'Married' });
    expect(focusDamp(very, '@p', '@c')).toBe(focusDamp(single, '@p', '@c'));
    expect(focusDamp(complicated, '@p', '@c')).toBeLessThan(focusDamp(single, '@p', '@c'));
    expect(focusDamp(complicated, '@p', '@c')).toBeGreaterThan(focusDamp(married, '@p', '@c'));
  });
});

describe('getting caught', () => {
  beforeEach(() => setGs({ bonds: {}, relationshipDimensions: {}, episodeHistory: [] }));
  it('the two who find out trust and want the player less, and the three of them end up in a group chat', () => {
    const s = room(); romance(s, '@b', '@c');
    const before = [rel('@b', '@p', 'trust'), rel('@b', '@p', 'attraction')];
    const r = caught(s, streamFor(1, 'x'), '@p', ['@b', '@c'], { how: 'notes' });
    expect(rel('@b', '@p', 'trust')).toBeLessThan(before[0]);
    expect(rel('@b', '@p', 'attraction')).toBeLessThan(before[1]);
    expect(r.notes.data.intent).toBe('notes');
    expect(r.busted.data.event).toBe('busted');
    expect(['charm', 'confess', 'deny']).toContain(r.busted.data.response);
    // word gets round: it is a claim, and the two of them hold it
    expect(s.claims.some(c => c.kind === 'playing' && c.holder === '@p' && s.know['@b']?.[c.id])).toBe(true);
  });
  it('a relationship on the profile makes it cost more', () => {
    setGs({ bonds: {}, relationshipDimensions: {}, episodeHistory: [] });
    const a = room({ P: { social: 1, boldness: 1, loyalty: 1, strategic: 1 } }); romance(a, '@b', '@c');
    caught(a, () => 0.99, '@p', ['@b', '@c'], { how: 'notes' });
    const plain = rel('@b', '@p', 'trust');
    setGs({ bonds: {}, relationshipDimensions: {}, episodeHistory: [] });
    const b = room({ P: { social: 1, boldness: 1, loyalty: 1, strategic: 1 } }, { P: 'Taken' }); romance(b, '@b', '@c');
    caught(b, () => 0.99, '@p', ['@b', '@c'], { how: 'notes' });
    expect(rel('@b', '@p', 'trust')).toBeLessThan(plain);
  });
  it('the flirting game: picking one crush while the other one watches gives it away', () => {
    const s = room(); romance(s, '@b', '@c');
    const sc = { id: 'g1', data: { rounds: [{ answers: { '@p': '@b' } }] } };
    s.scenes.push(sc);
    const t = gameTwoTimer(s, streamFor(2, 'g'), sc);
    expect(t).toMatchObject({ by: '@p', watcher: '@c' });
    expect(flingsOf(s, '@p').length).toBeLessThan(2);
  });
});

describe('in played seasons', () => {
  it('players get caught in most seasons, every confrontation plays out, and a copied message is word for word', () => {
    let seasons = 0, withCatch = 0, busted = 0, copies = 0;
    for (let seed = 1; seed <= 20; seed++) {
      const cast = rosterCast(13, seed); setPlayers(cast);
      const names = cast.map(p => p.name);
      const { rows, state } = playCircleSeason({ cast: names, setup: circleSetup(names), pool: DEFAULT_POOL, seed });
      seasons++;
      let caughtHere = false;
      for (const row of rows) for (const s of row.ci.aired || []) {
        const ks = (s.script?.blocks || []).map(b => b.key);
        if (ks.some(k => /^notes\.find/.test(k)) || ks.includes('party.twotime') || ks.includes('game.twotime')) caughtHere = true;
        if (s.kind === 'group-chat' && ks.includes('busted.open')) {
          busted++;
          expect(ks.some(k => /^busted\.accuse/.test(k))).toBe(true);
          expect(ks.some(k => /^busted\.(charm|confess|deny)/.test(k))).toBe(true);
          expect(ks.some(k => /^busted\.end\./.test(k))).toBe(true);
        }
        if (ks.includes('notes.find.copy') && state) {
          copies++;
          // the quote is the message the player actually sent
          const quoted = s.script.blocks[ks.indexOf('notes.find.copy')].lines.map(l => l.text).join(' ');
          const sent = Object.values(state.copiedTexts || {});
          expect(sent.some(t => quoted.includes(t))).toBe(true);
        }
      }
      if (caughtHere) withCatch++;
    }
    expect(withCatch / seasons).toBeGreaterThan(0.3);
    expect(withCatch / seasons).toBeLessThan(0.95);
    expect(busted).toBeGreaterThan(5);
  });
});

// A couple sharing one profile and one apartment (user, 2026-10-02: "do
// married people flirt ... or married and playing with that person in the
// apartment?").
function couple(over = {}) {
  const s = room();
  s.people.M = { name: 'M', gender: 'm', sexuality: 'straight', archetype: 'floater', stats: { ...STATS, ...(over.M || {}) }, age: 30, status: 'Single' };
  s.people.L = { name: 'L', gender: 'f', sexuality: 'straight', archetype: 'floater', stats: { ...STATS, ...(over.L || {}) }, age: 30, status: 'Single' };
  s.profiles['@ml'] = { handle: '@ml', players: ['M', 'L'], relation: 'married', roles: { face: 'M', brain: 'L' }, mode: 'shared', gap: 0, tells: [],
    shown: { name: 'M', gender: 'm', age: 30, status: 'Single' } };
  s.active.push('@ml'); initMind(s, '@ml');
  return s;
}
describe('a couple playing one profile together', () => {
  beforeEach(() => setGs({ bonds: {}, relationshipDimensions: {}, episodeHistory: [] }));
  it('is taken by each other, whatever the status says, and the partner in the room holds the flirting back', () => {
    const s = couple();
    expect(taken(s, '@ml')).toBe(true);
    expect(focusDamp(s, '@ml', '@b')).toBeLessThan(focusDamp(s, '@p', '@b'));
  });
  it('a loyal, short-fused partner stops a flirty message: it goes out tame', () => {
    const s = couple({ M: { strategic: 1, boldness: 1 }, L: { strategic: 1, loyalty: 10, temperament: 1 } });
    const sc = { id: 'x', who: ['@ml', '@b'], data: { intent: 'flirt', lead: 'M' } };
    expect(coupleFlirt(s, () => 0.95, sc, 'warm')).toBe('neutral');
    expect(sc.data.couple).toMatchObject({ stance: 'jealous', outcome: 'stopped', role: 'face' });
  });
  it('two strategists agree it is a game move, and the message goes as it is', () => {
    const s = couple({ M: { strategic: 10 }, L: { strategic: 10 } });
    const sc = { id: 'y', who: ['@ml', '@b'], data: { intent: 'flirt', lead: 'M' } };
    expect(coupleFlirt(s, () => 0.1, sc, 'warm')).toBe('warm');
    expect(sc.data.couple.stance).toBe('game');
  });
  it('never kisses at the door, coming or going: the other one is standing right there', () => {
    // Twenty doors each way (a single roll could miss a kiss by chance).
    let kisses = 0;
    for (let seed = 1; seed <= 20; seed++) {
      setGs({ bonds: {}, relationshipDimensions: {}, episodeHistory: [] });
      // visited: a crush both ways, but B is knocking on a couple's door
      const s = couple(); s.seed = seed;
      bump('@b', '@ml', 'attraction', 9); bump('@ml', '@b', 'attraction', 9);
      s.active = ['@ml'];
      if (runVisit(s, streamFor(seed, 'v'), '@b', [], { to: '@ml' }).data.kiss) kisses++;
      setGs({ bonds: {}, relationshipDimensions: {}, episodeHistory: [] });
      // visiting: the couple is blocked and goes to see B
      const t = couple(); t.seed = seed;
      bump('@b', '@ml', 'attraction', 9); bump('@ml', '@b', 'attraction', 9);
      t.active = ['@b'];
      if (runVisit(t, streamFor(seed, 'w'), '@ml', [], { to: '@b' }).data.kiss) kisses++;
    }
    expect(kisses).toBe(0);
  });
  it('their flirting is a game move: the season records no romance for either of them', () => {
    const s = couple();
    bump('@b', '@ml', 'attraction', 9); bump('@ml', '@b', 'attraction', 9);
    for (let i = 0; i < 3; i++) s.scenes.push({ id: `f${i}`, kind: 'chat', who: ['@ml', '@b'], data: { intent: 'flirt', ending: 'warm' } });
    s.scenes.push({ id: 'v9', kind: 'visit', who: ['@ml', '@b'], data: { kiss: true } });
    Object.assign(s.handleOf, { M: '@ml', L: '@ml', B: '@b' });
    const rec = ciLedgerRecord([{}, {}], s, { cast: ['M', 'L', 'B'] });
    expect(rec.players.M.showmances).toEqual([]);
    expect(rec.players.L.showmances).toEqual([]);
  });
  it('whoever fell for the flirting feels played when they find out it was a couple', () => {
    const s = couple();
    ((s.flings ||= {})['@ml'] ||= {})['@b'] = { day: s.day, scene: null };
    bump('@b', '@ml', 'attraction', 6);
    const before = rel('@b', '@ml', 'attraction');
    expect(coupleRevealed(s, '@b', '@ml', { id: 's1' })).toBe(true);
    expect(rel('@b', '@ml', 'attraction')).toBeLessThan(before);
    expect(rel('@b', '@ml', 'resentment')).toBeGreaterThan(0);
  });
  it('in played seasons a married pair flirts far less than two friends', () => {
    const flirtsOf = relation => {
      let n = 0;
      for (let seed = 1; seed <= 15; seed++) {
        const cast = makePlayers(13, seed);
        Object.assign(cast[1], { name: 'Mateo', age: 26 }); Object.assign(cast[3], { name: 'Luis', age: 31 });
        setPlayers(cast);
        const names = cast.map(p => p.name);
        const setup = circleSetup(names, { newcomers: 5 });
        Object.assign(setup.Mateo, { catfish: 'never' });
        Object.assign(setup.Luis, { catfish: 'never', partner: 'Mateo', relation });
        const { state } = playCircleSeason({ cast: names, setup, pool: makePool(6, seed), seed, options: { script: false } });
        const h = Object.entries(state.profiles).find(([, p]) => p.players.length > 1)[0];
        n += state.scenes.filter(x => x.kind === 'chat' && x.who[0] === h && x.data.intent === 'flirt').length;
      }
      return n;
    };
    expect(flirtsOf('married')).toBeLessThan(flirtsOf('friends') * 0.6);
  });
});

// A kiss at the door with a partner still in the game (user, 2026-10-04: "she
// kissed Wayne on her way out ... her boyfriend is in the same game but
// another apartment ... it doesn't affect real life").
describe('a kiss at the door, with a partner in the building', () => {
  beforeEach(() => setGs({ bonds: {}, relationshipDimensions: {}, episodeHistory: [] }));
  function axel() {
    // P is the boyfriend (still in), C kissed B at the door on the way out, D is a friend.
    const s = room();
    s.kin = [{ a: 'C', b: 'P', kin: 'dating' }];
    for (const n of ['P', 'B', 'C', 'D']) s.handleOf[n] = `@${n.toLowerCase()}`;
    ((s.kinKnown ||= {})['@p'] ||= {})['@c'] = 1;
    s.active = ['@p', '@b', '@d'];
    const sc = addScene(s, 'visit', ['@c', '@b'], { kiss: true }, ['@c', '@b']);
    const k = noteKiss(s, sc, '@c', '@b');
    s.day += 1;
    return { s, k };
  }
  it('the season remembers it: the kiss is a romance, and a betrayal of the partner, for life after the show', () => {
    const { s } = axel();
    bump('@c', '@b', 'attraction', 7); bump('@b', '@c', 'attraction', 7);
    s.blocked = [{ handle: '@c', day: s.day - 1, by: [] }];
    const rec = ciLedgerRecord([{}, {}], s, { cast: ['P', 'B', 'C', 'D'] });
    expect(rec.players.C.betrayed).toContain('P');
    expect(rec.players.P.betrayedBy).toContain('C');
    expect(rec.players.C.showmances.map(x => x.partner)).toContain('B');
  });
  it('a boyfriend in the cast makes the kiss cheating', () => {
    const { s, k } = axel();
    expect(taken(s, '@c')).toBe(true);
    expect(k.partners).toEqual(['@p']);
  });
  it('the one who was kissed tells their closest friend; when that is the partner, he finds out', () => {
    const { s } = axel();
    bump('@b', '@p', 'affection', 8); bump('@b', '@p', 'trust', 8);
    kissFallout(s, () => 0);
    expect(rel('@p', '@c', 'resentment')).toBeGreaterThan(0);
    expect(rel('@p', '@b', 'resentment')).toBeGreaterThan(0);
    expect(s.scenes.some(x => x.data?.intent === 'kisstold' && x.data.partner === '@p')).toBe(true);
  });
  it('a friend who knows they are a couple tells the partner, and he finds out', () => {
    const { s } = axel();
    bump('@b', '@d', 'affection', 8); bump('@b', '@d', 'trust', 8); bump('@d', '@p', 'affection', 6);
    // P told D about the relationship earlier (kin.js): D can connect the two.
    const told = addScene(s, 'chat', ['@p', '@d'], { intent: 'kintold' }, ['@p', '@d']);
    learn(s, '@d', makeClaim(s, { kind: 'ally', holder: '@p', about: '@c', truth: true, by: '@p', to: '@d' }), '@p', told);
    kissFallout(s, () => 0);          // B tells D
    s.day += 1;
    kissFallout(s, () => 0);          // D tells P
    expect(s.scenes.some(x => x.data?.intent === 'kisswarn' && x.who[1] === '@p')).toBe(true);
    expect(rel('@p', '@c', 'trust')).toBeLessThan(0);
  });
});

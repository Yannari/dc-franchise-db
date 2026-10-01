// ci-pairs.test.js — what the two people sharing an apartment ARE to each
// other (user, 2026-09-30: "couple/friends/siblings/twins/father-daughter").
// The author picks it (setup `relation` on either partner); it changes the
// game and the words:
//   twins    sound alike: the voice barely wobbles
//   parent   pulls rank: wins more of the arguments over a message
//   siblings bicker: the argument is a coin flip more often than not
//   couple / married / friends / cousins: their own arguments, life, reveal
// Unset, a pair stays as it was: lines that never say what they are.
import { describe, expect, it } from 'vitest';
import { setPlayers } from '../js/core.js';
import { playCircleSeason } from '../js/ci/season.js';
import { distance, leadFor, RELATIONS } from '../js/ci/shared.js';
import { renderEntry, writeScene } from '../js/ci/script.js';
import { addScene } from '../js/ci/state.js';
import { POOLS } from '../js/ci/lines/index.js';
import { streamFor } from '../js/dr/rng.js';
import { makePlayers, makePool, circleSetup } from './helpers/ci-cast.js';

function pairSeason(relation, seed = 7, stats = {}) {
  const cast = makePlayers(13, seed);
  Object.assign(cast[1], { name: 'Mateo', age: 26, stats: { ...cast[1].stats, social: 8, boldness: 8, strategic: 4, ...stats.mateo } });
  Object.assign(cast[3], { name: 'Luis', age: 51, stats: { ...cast[3].stats, social: 5, boldness: 3, strategic: 8, ...stats.luis } });
  setPlayers(cast);
  const names = cast.map(p => p.name);
  const setup = circleSetup(names, { newcomers: 5 });
  Object.assign(setup.Mateo, { catfish: 'never' });
  Object.assign(setup.Luis, { catfish: 'never', partner: 'Mateo', ...(relation ? { relation } : {}) });
  return playCircleSeason({ cast: names, setup, pool: makePool(6, seed), seed, options: { script: false } });
}
const pairOf = state => Object.entries(state.profiles).find(([, p]) => p.players.length > 1);

describe('the relationship is part of the profile', () => {
  it('every kind on the list, and the pair carries it with older and younger', () => {
    expect(RELATIONS).toEqual(expect.arrayContaining(['couple', 'married', 'siblings', 'twins', 'parent', 'friends', 'cousins']));
    const { state } = pairSeason('siblings');
    const [, p] = pairOf(state);
    expect(p.relation).toBe('siblings');
    expect(p.roles.older).toBe('Luis');
    expect(p.roles.younger).toBe('Mateo');
  });
  it('a parent and child: the older one is the parent', () => {
    const { state } = pairSeason('parent');
    const [, p] = pairOf(state);
    expect(p.roles.parent).toBe('Luis');
    expect(p.roles.kid).toBe('Mateo');
  });
  it('unset stays unset', () => {
    const { state } = pairSeason(null);
    expect(pairOf(state)[1].relation ?? null).toBeNull();
  });
});

describe('it changes the game', () => {
  it('twins sound alike: their voices wobble far less than the same two as friends', () => {
    const tw = pairSeason('twins').state, fr = pairSeason('friends').state;
    expect(distance(tw, pairOf(tw)[0])).toBeLessThan(distance(fr, pairOf(fr)[0]) * 0.5);
  });
  it('a parent wins more of the arguments than the same person would as a friend', () => {
    const wins = relation => {
      const { state } = pairSeason(relation);
      const [h] = pairOf(state);
      let n = 0;
      for (let i = 0; i < 400; i++) if (leadFor(state, h, 'bond', streamFor(i, 'lead')) === 'Luis') n++;
      return n;
    };
    expect(wins('parent')).toBeGreaterThan(wins('friends') + 40);
  });
});

describe('it changes the words', () => {
  const KINDS = ['couple', 'married', 'siblings', 'twins', 'parent', 'friends', 'cousins'];
  it('every kind has its own argument, apartment life, finale reveal and goodbye', () => {
    for (const k of KINDS) {
      const argue = k === 'parent' ? ['shared.argue.parentWins.parent', 'shared.argue.kidWins.parent'] : [`shared.argue.faceWins.${k}`, `shared.argue.brainWins.${k}`];
      for (const key of [...argue, `life.pair.${k}`, `meet.explain.shared.${k}`, `goodbye.pair.${k}`]) {
        expect(POOLS[key]?.length ?? 0, key).toBeGreaterThanOrEqual(3);
      }
    }
  });
  it('a pair with a relationship argues in its own words often, never with the wrong winner', () => {
    const { state } = pairSeason('parent');
    const [h] = pairOf(state);
    const other = Object.keys(state.profiles).find(x => x !== h);
    let own = 0;
    for (let i = 0; i < 20; i++) {
      const lead = i % 2 ? 'Mateo' : 'Luis';
      const sc = addScene(state, 'chat', [h, other], { intent: 'bond', ending: 'warm', claims: [], slips: [], lead });
      const key = writeScene(state, sc).blocks[0].key;
      expect(key).toMatch(/^shared\.argue\./);
      if (key.endsWith('.parent')) {
        own++;
        expect(key).toBe(lead === 'Luis' ? 'shared.argue.parentWins.parent' : 'shared.argue.kidWins.parent');
      }
    }
    expect(own).toBeGreaterThan(5);
  });
  it('the {a.parent} and {a.kid} slots fill with the right people', () => {
    const { state } = pairSeason('parent');
    const [h] = pairOf(state);
    const out = renderEntry(state, { id: 't', turns: [{ by: 'parent', say: '{a.kid}, sit down.' }, { by: 'kid', say: 'Yes, {a.parent}.' }] }, { a: h }, streamFor(1, 'r'));
    expect(out.lines.map(l => l.text)).toEqual(['Mateo, sit down.', 'Yes, Luis.']);
    expect(out.lines.map(l => l.person)).toEqual(['Luis', 'Mateo']);
  });
});

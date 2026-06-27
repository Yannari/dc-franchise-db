import { describe, it, expect, beforeEach } from 'vitest';
import { setGs } from '../js/core.js';
import { buildSeasonArcs } from '../js/text-backlog.js';

beforeEach(() => {
  setGs({
    activePlayers: ['Riya', 'James', 'Lake', 'Jacques', 'Ellie'],
    bonds: { 'Jacques|Riya': -6 },
    popularity: { Lake: 6, James: 1, Riya: 0, Jacques: -5, Ellie: 2 },
    showmances: [{ players: ['James', 'Ellie'], broken: false, episodesActive: 3 }],
    episodeHistory: [
      { num: 1, eliminated: 'Bob', immunityWinner: 'Lake', votes: { Bob: 4, Riya: 2 }, alliances: [] },
      { num: 2, eliminated: 'Cy',  immunityWinner: 'Lake', votes: { Cy: 5, Riya: 1 }, alliances: [] },
      { num: 3, eliminated: 'Dot', immunityWinner: 'James', votes: { Dot: 3, Riya: 2 }, alliances: [] },
    ],
  });
});

describe('buildSeasonArcs — multi-episode continuity', () => {
  const arcs = () => buildSeasonArcs({ num: 4 }).join('\n');

  it('flags a perennial target who keeps surviving', () => {
    expect(arcs()).toMatch(/Riya .*different Tribals and is STILL here/);
  });
  it('flags a repeat immunity winner as a challenge threat', () => {
    expect(arcs()).toMatch(/Lake has won immunity 2 times/);
  });
  it('tracks an ongoing showmance with its episode count', () => {
    expect(arcs()).toMatch(/James and Ellie have been a showmance for 3/);
  });
  it('names the popularity hero and villain poles', () => {
    const out = arcs();
    expect(out).toMatch(/Lake .*fan-favorite\/hero/);
    expect(out).toMatch(/Jacques .*villain/);
  });
  it('surfaces the deepest feud', () => {
    expect(arcs()).toMatch(/Jacques vs Riya|Riya vs Jacques/);
  });
  it('is a no-op with too little history', () => {
    setGs({ activePlayers: ['A','B'], episodeHistory: [{ num: 1, votes: {} }] });
    expect(buildSeasonArcs({ num: 2 })).toEqual([]);
  });
});

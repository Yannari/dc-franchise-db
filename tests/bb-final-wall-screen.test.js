// Part one of the final HOH draws the negotiation, not the wall.
//
// The apparatus is the part this competition shares with the weekly Wall, so
// the apparatus is deliberately not the instrument: the screen draws the
// triangle between the three houseguests, because what passes between them is
// the only thing here that the other wall does not have.
//
// Which means the guard has to check the EDGES, not the prose. Every exchange
// the simulation runs — solidarity, mind games, an offer made and taken or
// refused — has to reach the right pair of corners, and a houseguest who comes
// off the wall has to take their edges with them. None of that is visible in a
// ranked board, and none of it is covered by bb-sig-screens-render, which walks
// competitions by their hoh/veto slots and skips anything declaring 'final'.
import { beforeEach, describe, expect, it } from 'vitest';
import { gs, seasonConfig } from '../js/core.js';
import { runBBCompetition } from '../js/bb/comps.js';
import { BB_COMPETITIONS } from '../js/bb-comps/index.js';
import { seedGame } from './helpers/setup.js';
import { buildVPScreens, _tvState } from '../js/vp-screens.js';

const ID = 'bb-final-part-one';
const STAT_KEYS = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];
const spread = s => Object.fromEntries(STAT_KEYS.map((k, i) => [k, 1 + ((s * 7 + i * 3) % 10)]));
const NAMES = ['Bowie', 'Wayne', 'Emmah'];
const CAST = NAMES.map((name, i) => ({ name, archetype: 'floater',
  gender: i % 2 ? 'f' : 'm', sexuality: 'straight', stats: spread(i + 1) }));
const rngFor = (seed) => () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);

const boot = () => {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  gs.bb = { outgoingHoh: null, weeks: [], stats: {}, house: null, haveNots: [] };
  gs.popularity = {};
  seasonConfig.romance = 'off';
  NAMES.forEach(n => { gs.bb.stats[n] = { hohWins: 0, vetoWins: 0, blockBusterWins: 0,
    timesNominated: 0, timesSaved: 0, timesOnTheBlock: 0 }; });
};

const wall = (seed, cast = NAMES) => runBBCompetition({
  type: 'final', participants: cast, house: NAMES, library: BB_COMPETITIONS,
  forcedId: ID, rng: rngFor(seed), week: { num: 9, houseAtStart: NAMES },
});

/** Through the finale's own act shape, which is the only road this screen has. */
const screenFor = (comp, at = 999) => {
  const ep = {
    num: 9, format: 'big-brother', houseAtStart: NAMES,
    acts: [{
      type: 'final-hoh-part', part: 'part one', partNum: 1,
      participants: comp.participants || comp.placements,
      winner: comp.winner, competition: comp,
    }],
  };
  Object.keys(_tvState).forEach(k => delete _tvState[k]);
  buildVPScreens(ep);
  Object.keys(_tvState).filter(k => k.startsWith('bb_sig_wall1_')).forEach(k => { _tvState[k].idx = at; });
  return buildVPScreens(ep).find(s => /final-hoh/.test(s.id))?.html || '';
};

const lines = html => [...html.matchAll(/<line x1="([\d.-]+)%" y1="([\d.-]+)%" x2="([\d.-]+)%" y2="([\d.-]+)%"[\s\S]*?stroke="([^"]+)"/g)]
  .map(m => ({ x1: +m[1], y1: +m[2], x2: +m[3], y2: +m[4], stroke: m[5] }));

describe('Talk Them Down gets the triangle, through the finale', () => {
  beforeEach(boot);

  it('the finale draws it, and it is not the generic board', () => {
    const html = screenFor(wall(6));
    expect(html, 'no screen was built').toBeTruthy();
    expect(html, 'fell back to the generic competition board').not.toContain('bbc-what');
    expect(html, 'the themed screen did not draw').toContain('sigtalk');
    expect(html).toContain('Talk Them Down');
    for (const n of NAMES) expect(html).toContain(n);
    // Three corners, three edges between them, however the night went.
    expect(lines(html).length, 'a triangle needs three sides').toBeGreaterThanOrEqual(3);
  });

  it('every edge stops short of the two faces it runs between', () => {
    // Drawn corner to corner they run under the portraits and bury the names.
    const html = screenFor(wall(6));
    const corners = [{ x: 50, y: 20 }, { x: 20, y: 78 }, { x: 80, y: 78 }];
    const onACorner = (x, y) => corners.some(c => Math.abs(c.x - x) < 1 && Math.abs(c.y - y) < 1);
    for (const l of lines(html)) {
      expect(onACorner(l.x1, l.y1), 'an edge starts on top of a face').toBe(false);
      expect(onACorner(l.x2, l.y2), 'an edge ends on top of a face').toBe(false);
    }
  });

  it('an offer reaches the corner of the houseguest it was made to', () => {
    for (let s = 1; s < 200; s++) {
      boot();
      const comp = wall(s);
      const offer = comp.detail.steps.find(x => x.kind === 'deal' || x.kind === 'refused');
      if (!offer) continue;
      const html = screenFor(comp);
      const gold = lines(html).filter(l => l.stroke === '#e3b768');
      expect(gold.length, 'the offer was not drawn').toBe(1);

      // It runs from the houseguest who made it toward the one asked to come
      // down — checked by direction, since both ends are trimmed inward.
      const cast = comp.detail.cast;
      const corners = { [cast[0]]: { x: 50, y: 20 }, [cast[1]]: { x: 20, y: 78 }, [cast[2]]: { x: 80, y: 78 } };
      const F = corners[offer.from]; const T = corners[offer.to];
      const drawn = gold[0];
      const near = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
      expect(near({ x: drawn.x1, y: drawn.y1 }, F),
        'the offer does not start from whoever made it').toBeLessThan(near({ x: drawn.x1, y: drawn.y1 }, T));
      expect(near({ x: drawn.x2, y: drawn.y2 }, T),
        'the offer does not point at whoever was asked').toBeLessThan(near({ x: drawn.x2, y: drawn.y2 }, F));
      // Taken is solid, refused is dashed — the difference the night turns on.
      const dashed = /stroke="#e3b768"[\s\S]{0,120}?stroke-dasharray/.test(html);
      expect(dashed, `a ${offer.kind} offer drew the wrong line style`).toBe(offer.kind === 'refused');
      return;
    }
    throw new Error('no offer was made in 200 walls');
  });

  it('somebody talked down is marked as having come down on a promise', () => {
    for (let s = 1; s < 200; s++) {
      boot();
      const comp = wall(s);
      if (comp.detail.finished !== 'talked-down') continue;
      const deal = comp.detail.steps.find(x => x.kind === 'deal');
      const html = screenFor(comp);
      expect(html).toContain('came down on a promise');
      // And they are not still shown holding on.
      const bd = comp.breakdown || comp.debug?.scoreBreakdown || {};
      expect(bd[deal.to].droppedDeliberately, 'the sim did not record a deliberate drop').toBe(true);
      expect(comp.winner).not.toBe(deal.to);
      return;
    }
    throw new Error('nobody was talked down in 200 walls');
  });

  it('one step per beat, and it stands aside for anything that is not three people', () => {
    const comp = wall(6);
    expect(comp.detail.steps.length).toBe(comp.beats.length);

    // The library smoke-tests every competition with a full house, and a
    // triangle drawn round twelve names would be nonsense. It declines.
    boot();
    const big = runBBCompetition({
      type: 'final', participants: [...NAMES, 'Chase'], house: [...NAMES, 'Chase'],
      library: BB_COMPETITIONS, forcedId: ID, rng: rngFor(4), week: { num: 9 },
    });
    const html = screenFor(big);
    expect(html, 'the triangle drew itself around four people').not.toContain('sigtalk');
    expect(html, 'and nothing covered the slot').toBeTruthy();
  });
});

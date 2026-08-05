// "On Tilt" — the arena's crapshoot, and the screen for it.
//
// The competition is deliberately the least skilful thing in the Block Buster
// library: double the luck weighting of anything else in the arena, because the
// arena is where somebody's game ends and it should not always end because they
// were the worst player in the room. Two things follow from that, and this file
// guards both.
//
// One, the table's own rule has to actually happen. The TILT light is the thing
// the competition is NAMED after and it was arriving as one line in a random
// play-by-play pool, so most nights nobody tilted at all. It is a temperament
// read now, with consequences on both sides of the glass.
//
// Two, the screen has to be able to draw a night it was never given a log of.
// The engine scores this comp; it does not record where any individual ball
// went. So the traces are real ricochets off the real bumpers, seeded per week,
// with only the NUMBER that survived taken from the result — and the screen has
// to say so rather than pass a reconstruction off as a transcript.
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { gs, players, seasonConfig, relationships, TWIST_CATALOG } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { ARENA_CLASSIC_COMPS } from '../js/bb-comps/arena-classics.js';
import { rpBuildSigOnTilt } from '../js/vp-bb-sig/on-tilt.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';

const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee', 'Brightly'];
const CAST = NAMES.map((name, i) => ({
  name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight',
  archetype: ['mastermind', 'social-butterfly', 'hero', 'showmancer'][i % 4],
}));

function house() {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns,
    ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat, TWIST_CATALOG });
  Object.assign(seasonConfig, { format: 'big-brother' });
  gs.bb = { weeks: [], stats: {} };
  gs.popularity = {};
}
afterAll(() => { delete seasonConfig.format; });

const onTilt = ARENA_CLASSIC_COMPS.find(c => c.id === 'bb-arena-on-tilt');
const NOMS = ['Bowie', 'Chase', 'Ripper'];

/** Run the competition with a recording api, the way the dispatcher would. */
function run(seed) {
  const bonds = [];
  const pops = [];
  const api = {
    addBond: (a, b, d) => { bonds.push({ a, b, d }); return true; },
    popDelta: (n, d) => { pops.push({ n, d }); return true; },
    record: () => true,
  };
  const ctx = { nominees: [...NOMS], house: [...NAMES], week: { num: 3 } };
  const result = withSeededRandom(seed, () => onTilt.simulate(NOMS, ctx, api, Math.random));
  return { result, bonds, pops };
}

describe('the competition', () => {
  beforeEach(() => house());

  it('exists as a crapshoot, and says what it is', () => {
    expect(onTilt, 'On Tilt is not in the arena library').toBeTruthy();
    expect(onTilt.category).toBe('luck');
    // The desc is the only place the viewer is told the rules.
    expect(onTilt.desc.length).toBeGreaterThan(200);
    expect(onTilt.desc).toMatch(/TILT/);
    expect(onTilt.desc).toMatch(/wins safety|safety/i);
  });

  it('actually tilts somebody, which it used to mostly never do', () => {
    let tilts = 0;
    for (let seed = 1; seed <= 25; seed++) {
      house();
      const { result } = run(seed);
      if (result.beats.some(b => b.badgeText === 'TILT')) tilts++;
    }
    expect(tilts, 'the light the comp is named after never came on').toBeGreaterThan(0);
    expect(tilts, 'everybody tilts every single week, which is not a risk').toBeLessThan(25);
  });

  it('makes the tilt cost something on both sides of the glass', () => {
    // A camp event with no consequence is decoration. Tilting is loud and funny
    // and somebody watching laughs at it, and that is a thing between them now.
    let checked = false;
    for (let seed = 1; seed <= 40 && !checked; seed++) {
      house();
      const { result, bonds, pops } = run(seed);
      const tilt = result.beats.find(b => b.badgeText === 'TILT');
      if (!tilt) continue;
      const who = tilt.players[0];
      checked = true;
      // Great television, poor composure.
      expect(pops.some(p => p.n === who && p.d > 0),
        'nobody got any screen time out of the loudest thing in the episode').toBe(true);
      const laugh = result.beats.find(b => b.badgeText === 'HEARD THAT');
      if (laugh) {
        const laugher = laugh.players[0];
        expect(bonds.some(b => b.d < 0 && [b.a, b.b].includes(laugher) && [b.a, b.b].includes(who)),
          'somebody laughed at them and it cost nothing').toBe(true);
      }
    }
    expect(checked, 'no tilt in 40 seeds').toBe(true);
  });

  it('still hands the loser a grievance about luck rather than skill', () => {
    house();
    const { result, bonds } = run(4);
    const last = result.placements[result.placements.length - 1];
    const won = result.winner;
    expect(bonds.some(b => b.d < 0 && [b.a, b.b].includes(last) && [b.a, b.b].includes(won))
      || getBond(last, won) > 0, 'losing to a bad bounce left no mark at all').toBe(true);
  });
});

describe('the screen', () => {
  beforeEach(() => house());

  const epFor = seed => {
    const { result } = run(seed);
    return {
      num: 3,
      acts: [{
        type: 'veto', winner: result.winner,
        results: result.placements.map((name, i) => ({ name, score: result.scores[name], place: i + 1 })),
        competition: { ...result, name: 'On Tilt', category: 'luck', desc: onTilt.desc },
      }],
    };
  };
  const U = {
    tvState: {}, esc: v => String(v ?? ''), avatar: () => '<i class="av"></i>',
    ordinal: i => `${i}`, reveal: (ep, k, i) => `_r('${k}',${i})`,
  };

  it('draws the table, and declines rather than drawing an empty one', () => {
    const html = rpBuildSigOnTilt(epFor(4), 'veto', { ...U, tvState: {} });
    expect(html).toContain('ON TILT');
    expect(html).toContain('bbot-table');
    expect(html).toMatch(/DRAIN/);
    // No field, no screen — the generic board takes it instead.
    expect(rpBuildSigOnTilt({ num: 3, acts: [{ type: 'veto', competition: { placements: [] } }] },
      'veto', { ...U, tvState: {} }), 'drew a table with nobody on it').toBe('');
    expect(rpBuildSigOnTilt({ num: 3, acts: [] }, 'veto', { ...U, tvState: {} })).toBe('');
  });

  it('holds everything back until it is revealed', () => {
    const ep = epFor(4);
    const tv = {};
    const shut = rpBuildSigOnTilt(ep, 'veto', { ...U, tvState: tv });
    // Nothing on the reels and no traces before the first click.
    expect(shut).toContain('nothing on the reels yet');
    expect(shut).not.toContain(ep.acts[0].winner + '</b>');

    const key = Object.keys(tv)[0];
    tv[key] = { idx: 99 };
    const open = rpBuildSigOnTilt(ep, 'veto', { ...U, tvState: tv });
    expect(open).toContain(ep.acts[0].winner);
    expect(open, 'the reveal controls never went away').not.toContain('Reveal next');
  });

  it('is honest that the bounces are a reconstruction', () => {
    const tv = {};
    const ep = epFor(4);
    rpBuildSigOnTilt(ep, 'veto', { ...U, tvState: tv });
    tv[Object.keys(tv)[0]] = { idx: 99 };
    const html = rpBuildSigOnTilt(ep, 'veto', { ...U, tvState: tv });
    expect(html).toMatch(/never recorded/);
  });

  it('lights the TILT panel only when somebody actually tilted', () => {
    let lit = null, dark = null;
    for (let seed = 1; seed <= 40 && (!lit || !dark); seed++) {
      house();
      const ep = epFor(seed);
      const tv = {};
      rpBuildSigOnTilt(ep, 'veto', { ...U, tvState: tv });
      tv[Object.keys(tv)[0]] = { idx: 99 };
      const html = rpBuildSigOnTilt(ep, 'veto', { ...U, tvState: tv });
      const tilted = ep.acts[0].competition.beats.some(b => b.badgeText === 'TILT');
      if (tilted && !lit) lit = html;
      if (!tilted && !dark) dark = html;
    }
    if (lit) expect(lit, 'somebody tilted and the panel stayed dark').toContain('bbot-tilt is-lit');
    // Matched on the ELEMENT, not the bare class name — the stylesheet defines
    // `.bbot-tilt.is-lit` on every render and a looser check finds that instead.
    if (dark) expect(dark, 'the panel lit on a night nobody tilted').not.toContain('bbot-tilt is-lit');
  });

  it('keeps its animations off for anybody who asked for that', () => {
    const html = rpBuildSigOnTilt(epFor(4), 'veto', { ...U, tvState: {} });
    expect(html).toContain('prefers-reduced-motion');
  });
});

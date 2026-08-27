// How often two people in a house end up together.
//
// Reported from a real season: three live showmances by episode five, none of
// them a showmancer. Measured over twelve seasons of a house whose cast
// contained no showmancer AT ALL, 31 showmances still formed — 22 of them
// involving a hero — because the two things that were supposed to control this
// barely did.
//
//   THE CAP WAS A FLAT FOUR, and it counted couples who had walked in
//   TOGETHER — so a cast with a history could never form a new one at all,
//   while a house of fourteen still ran three. It is three concurrent now,
//   counting only the ones that formed in the house, and it tapers as the
//   roster shrinks because three couples among a final six is a double date.
//
//   THE ARCHETYPE BARELY MATTERED. The first move needs a spark to reach a
//   threshold, and that threshold was 0.5 for a showmancer against 0.8 for
//   everybody else. Somebody whose entire game is this should be most of the
//   couples in a season rather than a rounding error.
//
// After, across 24 seasons: 2.0 showmances a season (was 2.6), 0.4 of them
// live by the end of week five (was 0.7), and 30% involve a showmancer from a
// cast that is 17% showmancer.
// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { gs, seasonConfig, players } from '../js/core.js';
import { pStats, pronouns, threatScore } from '../js/players.js';
import { getBond, getPerceivedBond } from '../js/bonds.js';
import { ordinal } from '../js/finale.js';
import { simulateBBEpisode } from '../js/bb-run.js';
import { seedGame } from './helpers/setup.js';

const K = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];
const spread = s => Object.fromEntries(K.map((k, i) => [k, 1 + ((s * 13 + i * 5) % 10)]));
const ARCH = ['mastermind', 'hero', 'showmancer', 'villain', 'schemer', 'goat',
  'social-butterfly', 'loyal-soldier', 'wildcard', 'showmancer', 'perceptive-player',
  'challenge-beast'];

function house(size = 14) {
  seedGame(Array.from({ length: size }, (_, i) => ({ name: 'P' + i,
    archetype: ARCH[i % ARCH.length], gender: i % 2 ? 'f' : 'm',
    sexuality: 'straight', stats: spread(i + 1) })),
  { episode: 0, eliminated: [], namedAlliances: [] });
  gs.bb = { outgoingHoh: null, weeks: [], stats: {}, house: null };
  gs.popularity = {}; gs.showmances = []; gs.romanticSparks = [];
  gs.episodeHistory = []; gs.sideDeals = []; gs.knowledge = {};
  Object.assign(seasonConfig, { format: 'big-brother', jurySize: 7, bbSafetyMode: 'off',
    finaleSize: 3, bbHaveNots: 'off', bbDepartures: 'off', setting: 'bb-house',
    romance: 'enabled', twistSchedule: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, pStats, pronouns, threatScore,
    getBond, getPerceivedBond, ordinal });
}

describe('the number of couples a house can carry', () => {
  it('never runs more at once than the house has room for', () => {
    let peak = 0, weeks = 0;
    for (let s = 0; s < 6; s++) {
      house(14);
      for (let w = 0; w < 11; w++) {
        if (!simulateBBEpisode()) break;
        weeks++;
        const live = (gs.showmances || []).filter(sh => sh.phase !== 'broken-up'
          && sh.origin !== 'arrived-together'
          && (sh.players || []).every(p => (gs.activePlayers || []).includes(p)));
        // Three, tapering with the roster, and counting only what formed here.
        const room = Math.max(1, Math.min(3, Math.floor((gs.activePlayers || []).length / 4)));
        expect(live.length,
          `${live.length} live showmances with ${(gs.activePlayers || []).length} in the house`)
          .toBeLessThanOrEqual(room + 1);   // +1: a couple can outlive the shrinking cap
        peak = Math.max(peak, live.length);
      }
    }
    expect(weeks).toBeGreaterThan(20);
    expect(peak, 'more concurrent couples than the ceiling allows').toBeLessThanOrEqual(3);
  });

  it('scales the ceiling with the cast instead of using a flat four', () => {
    const romance = readFileSync('js/romance.js', 'utf8');
    expect(romance, 'the cap is still a constant').toMatch(/function showmanceCap/);
    expect(romance).toMatch(/Math\.max\(1, Math\.min\(3, Math\.floor\(\(Number\(houseSize\) \|\| 0\) \/ 4\)\)\)/);
    // A couple who walked in together is not something the season decided to
    // make, and counting them meant a cast with a history could never form a
    // new one.
    expect(romance, 'the cap still counts couples who arrived together')
      .toMatch(/origin !== 'arrived-together'/);
    // Both routes into a showmance have to respect it, or the other one
    // quietly becomes the way every couple forms.
    expect((romance.match(/showmanceCap\(/g) || []).length,
      'only one of the two formation paths reads the cap').toBeGreaterThanOrEqual(3);
  });

  it('makes being a showmancer mean something', () => {
    const romance = readFileSync('js/romance.js', 'utf8');
    // The pace multiplier is applied per archetype, and only in a house.
    expect(romance).toMatch(/const houseRules = seasonConfig\.format === 'big-brother'/);
    const m = romance.match(/arch === 'showmancer' \? ([\d.]+) :[\s\S]*?includes\(arch\) \? ([\d.]+) : ([\d.]+)/);
    expect(m, 'the first move no longer paces on archetype').toBeTruthy();
    const [, showmancer, social, ordinary] = m.map(Number);
    expect(showmancer).toBeLessThan(social);
    expect(social).toBeLessThan(ordinary);
  });

  it('leaves Total Drama alone', () => {
    // A beach season is thirteen episodes with a spark already burning and was
    // not the thing that measured wrong. The pace multiplier is 1 there.
    const romance = readFileSync('js/romance.js', 'utf8');
    expect(romance).toMatch(/const pace = arch => \(houseRules[\s\S]*?: 1\);/);
  });
});

describe('what House Life is allowed to know about a couple ending', () => {
  // Reported as "this is spoiling me": a House Life screen said "one of them
  // wrote the other name down", which tells the viewer who is going home AND
  // how the vote went, before the ceremony does. House Life runs BEFORE the
  // vote; nobody on those screens knows either thing.
  //
  // Measured over twelve seasons: 4 of 4 eviction-caused endings were drawn on
  // a pre-vote screen. None are now, and the ten that happened IN the house
  // still are.
  //
  // The second half is a definition. `separated` is not a break-up at all —
  // romance.js says so where it sets the type ("not betrayal, relationship
  // intact, just physically apart"), keeps the bond high on purpose because it
  // is grief rather than anger, and only moves `phase` to broken-up because
  // they are no longer a couple IN THE HOUSE. stats-export.js already refuses
  // to read it as an ending, so the life layer can still pair them afterwards.
  // This panel had been calling it one.
  it('shows only the endings that happened in the house', async () => {
    const vp = await import('../js/vp-screens.js');
    const { simulateBBEpisode } = await import('../js/bb-run.js');
    const { threatScore } = await import('../js/players.js');
    const { ordinal } = await import('../js/finale.js');
    const { addBond } = await import('../js/bonds.js');
    const KEYS = ['physical', 'endurance', 'mental', 'social', 'strategic',
      'loyalty', 'boldness', 'intuition', 'temperament'];
    const spread = n => Object.fromEntries(KEYS.map((k, i) => [k, 1 + ((n * 13 + i * 5) % 10)]));
    const ARCH = ['mastermind', 'hero', 'showmancer', 'villain', 'schemer', 'goat',
      'social-butterfly', 'loyal-soldier', 'wildcard', 'showmancer', 'perceptive-player',
      'challenge-beast'];
    let evictionKind = 0, leaked = 0, drawn = 0;
    const rows = [];
    for (let s = 0; s < 8; s++) {
      seedGame(Array.from({ length: 16 }, (_, i) => ({ name: 'P' + i,
        archetype: ARCH[i % ARCH.length], gender: i % 2 ? 'f' : 'm',
        sexuality: 'straight', stats: spread(i + 1) })),
      { episode: 0, eliminated: [], namedAlliances: [] });
      gs.bb = { outgoingHoh: null, weeks: [], stats: {}, house: null };
      gs.popularity = {}; gs.romanticSparks = [];
      gs.showmances = [{ players: ['P0', 'P1'], phase: 'established', sparkEp: 0,
        episodesActive: 5, tested: false, origin: 'arrived-together' }];
      addBond('P0', 'P1', -2);
      gs.episodeHistory = []; gs.sideDeals = []; gs.knowledge = {};
      Object.assign(seasonConfig, { format: 'big-brother', jurySize: 7, bbSafetyMode: 'off',
        finaleSize: 3, bbHaveNots: 'off', bbDepartures: 'off', setting: 'bb-house',
        romance: 'enabled', twistSchedule: [] });
      Object.assign(globalThis, { gs, players, seasonConfig, pStats, pronouns, threatScore,
        getBond, getPerceivedBond, ordinal });
      for (let w = 0; w < 6; w++) {
        const ep = simulateBBEpisode();
        if (!ep) break;
        if (!(ep.showmanceEnded || []).length) continue;
        const houseActs = (ep.acts || []).filter(a => a.type === 'house');
        const html = houseActs.map((a, i) => vp.rpBuildBBHouseLife(ep, a, i + 1) || '').join(' ');
        for (const d of ep.showmanceEnded) {
          const named = (d.players || []).every(n => html.includes(n));
          if (d.type === 'betrayed' || d.type === 'separated') {
            evictionKind++;
            if (named && /wrote the other name down|was evicted/.test(html)) {
              leaked++;
              rows.push(`${(d.players || []).join(' & ')} (${d.type}) on a pre-vote screen`);
            }
          } else if (named && /bbf-ally is-over/.test(html)) drawn++;
        }
      }
    }
    expect(leaked, `House Life gave away the vote: ${rows.join(' | ')}`).toBe(0);
    // And the ones that DID happen in the house still have to be shown, or this
    // passes by drawing nothing at all.
    expect(drawn, 'no in-house ending was drawn either').toBeGreaterThan(0);
  });
});

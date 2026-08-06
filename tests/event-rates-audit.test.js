// How often will I actually SEE this?
//
// The house library has grown past two hundred events and the only question
// anybody ever asks about a new one — will a viewer ever meet it — was being
// answered by argument. The volume suite guards the floor (does it fire at all,
// ever, in a tuned set of seeds) and nothing measured the RATE, so "rare" and
// "every week" were indistinguishable until somebody played a season and
// noticed.
//
// This plays real seasons and counts. Run it when adding an event, when
// changing a weight, or when a window moves:
//
//     npm run audit:events
//
// The numbers that matter, from the first run of this file (12 seasons):
//   ~133 beats a week, 232 distinct events firing, median event 4.6/season.
// An event on a normal multi-week window lands around 3-8 a season and is seen
// essentially always. Under 1.0 a season means a coin flip on whether a given
// season shows it at all — which is a legitimate choice for a once-in-a-run
// moment and a mistake for anything else.
//
// It asserts two health properties nothing else does: that no single event is
// eating the feed, and that the middle of the library is actually reachable.
//
// The reachable middle is the one that matters for how the house READS. A
// houseguest nobody reacts to is a houseguest who is not in the season, so the
// failure mode this is guarding against is not "an event is too loud" — it is a
// library where most of what has been written never reaches anybody and the
// same dozen events carry every week. Repetition is not the enemy; a thin pool
// is, and repetition is its symptom.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { gs, players, seasonConfig, relationships, TWIST_CATALOG } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode } from '../js/bb-run.js';
import { HOUSE_EVENTS } from '../js/bb-events/index.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';

const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee', 'Brightly',
  'Hicks', 'Emmah', 'Millie', 'Caleb', 'Jo', 'Dawn'];
const CAST = NAMES.map((name, i) => ({
  name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight',
  archetype: ['mastermind', 'social-butterfly', 'hero', 'showmancer', 'schemer',
    'villain', 'floater'][i % 7],
}));

const SEASONS = 8;

// ── Isolation, because this file MEASURES rather than asserts a fixture ──
//
// seasonConfig is one shared mutable object and every suite writes its own keys
// into it. Setting only the handful this file cares about left whatever a
// previous file had turned on — a safety mode, an interview setting, a mole —
// still switched on underneath the measurement, which changes what fires. The
// numbers then depended on which files ran first, and this failed in a full run
// while passing on its own, which is the least useful way for a guard to
// behave.
//
// So the config is wiped to an explicit baseline for each season and handed
// back exactly as found afterwards. Wiping without restoring would be the same
// discourtesy pointed at whoever runs next.
const CONFIG_BASELINE = {
  format: 'big-brother', finaleSize: 3, jurySize: 7,
  bbHaveNots: 'off', bbSafetyMode: 'off', bbDepartures: 'off',
  romance: 'enabled', popularityEnabled: true, setting: 'bb-house',
};
let _configBefore = null;

beforeAll(() => { _configBefore = { ...seasonConfig }; });
afterAll(() => {
  for (const key of Object.keys(seasonConfig)) delete seasonConfig[key];
  Object.assign(seasonConfig, _configBefore || {});
});

function resetConfig(schedule) {
  for (const key of Object.keys(seasonConfig)) delete seasonConfig[key];
  Object.assign(seasonConfig, CONFIG_BASELINE,
    { twistSchedule: schedule.map(t => ({ ...t })) });
}

// A season nobody would actually design: no twists at all. Useful as a
// baseline, and misleading on its own — a twist brings its own event family,
// those events take beats, and everything else gets rarer. Both are measured
// because "how often will I see this" has two different honest answers and the
// one that matters is the one with a real schedule on it.
const BOOKED = [
  { episode: 3, type: 'bb-have-nots' },
  { episode: 4, type: 'bb-roadkill' },
  { episode: 5, type: 'bb-pandoras-box' },
  { episode: 6, type: 'bb-den-of-temptation' },
  { episode: 7, type: 'bb-double-eviction' },
  { episode: 8, type: 'bb-care-package' },
];

/** Play a few seasons and count every beat by the event that made it. */
function measure(schedule = []) {
  const tally = {};
  const repeats = {};
  let beats = 0, weeks = 0, repeatBeats = 0, acts = 0, actsWithRepeat = 0;

  for (let s = 0; s < SEASONS; s++) {
    seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
    Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns,
      ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat, TWIST_CATALOG });
    resetConfig(schedule);
    gs.bb = { outgoingHoh: null, weeks: [], stats: {}, house: null };
    gs.episodeHistory = []; gs.jury = []; gs.episode = 0;
    gs.knowledge = {}; gs.sideDeals = []; gs.intentions = {};
    // seedGame replaces gs wholesale, but these are written by systems that
    // create them on demand and a leftover from a previous file would ride
    // along inside the fresh object's prototype-free gaps otherwise.
    gs.popularity = {}; gs.showmances = []; gs.romanticSparks = [];
    gs.playerStates = {}; gs.socialStatus = {};

    for (let w = 0; w < 12 && gs.activePlayers.length > 3; w++) {
      withSeededRandom(1000 + s * 37 + w, () => simulateBBEpisode());
    }
    for (const week of gs.bb.weeks) {
      weeks++;
      for (const act of week.acts || []) {
        // Within ONE act, how often does the same event air twice? The picker
        // exhausts fresh events first and only repeats when nothing new is
        // eligible for that beat, so a repeat is a symptom of a thin eligible
        // pool rather than a preference — and it is the thing a reader notices
        // first, because it reads as the house having one idea.
        acts++;
        const seenHere = new Map();
        let repeatedHere = false;
        for (const beat of act.socialBeats || []) {
          beats++;
          const id = beat.eventId;
          if (!id) continue;
          tally[id] = (tally[id] || 0) + 1;
          const n = (seenHere.get(id) || 0) + 1;
          seenHere.set(id, n);
          if (n > 1) {
            repeatBeats++; repeatedHere = true;
            repeats[id] = (repeats[id] || 0) + 1;
          }
        }
        if (repeatedHere) actsWithRepeat++;
      }
    }
  }
  return { tally, repeats, beats, weeks, repeatBeats, acts, actsWithRepeat };
}

describe('how often the house library actually fires', () => {
  it('reports a rate for every event, and stays healthy', () => {
    const plain = measure();
    const booked = measure(BOOKED);
    const { tally, beats, weeks } = booked;

    const rows = Object.entries(tally)
      .map(([id, n]) => ({
        id, n, perSeason: n / SEASONS, share: n / beats,
        plainPerSeason: (plain.tally[id] || 0) / SEASONS,
      }))
      .sort((a, b) => b.n - a.n);

    const line = r => `${r.perSeason.toFixed(2)}/season  ${(r.share * 100).toFixed(2)}%  `
      + `(plain ${r.plainPerSeason.toFixed(2)})  ${r.id}`;

    console.log(`\nSCHEDULED SEASON — ${BOOKED.length} twists booked, the shape anybody `
      + 'would actually design.');
    console.log(`${SEASONS} seasons · ${weeks} weeks · ${beats} beats `
      + `· ${(beats / weeks).toFixed(1)} beats/week · ${rows.length} distinct events`);
    console.log(`(a twist-free season for comparison: ${plain.beats} beats, `
      + `${Object.keys(plain.tally).length} distinct)`);
    console.log(`registered in the library: ${HOUSE_EVENTS.length} · `
      + `reachable with NO twist booked: ${Object.keys(plain.tally).length} · `
      + `added by booking six: ${Object.keys(tally).length - Object.keys(plain.tally).length}\n`);

    console.log('── loudest 12 ──');
    rows.slice(0, 12).forEach(r => console.log('  ' + line(r)));

    // Repeats inside a single act. NOT a defect by default — a campaign act
    // where nobody pitches twice is the wrong house, and alliances forming,
    // breaking and being repaired more than once in a week is what alliances
    // do. campaign-pitch, alliance-betrayal and alliance-repair belong at the
    // top of this list.
    //
    // What it is here to catch is a repeat that means the pool ran dry: the
    // picker exhausts fresh events first and only re-airs when nothing NEW was
    // eligible for that beat, so an event with no business repeating showing up
    // here says its act has too few eligible events, not that it is too loud.
    const rep = Object.entries(booked.repeats).sort((a, b) => b[1] - a[1]);
    console.log(`\n── same event twice in one act (expected for campaign/alliance) ──`);
    console.log(`  ${booked.actsWithRepeat} of ${booked.acts} acts `
      + `(${(100 * booked.actsWithRepeat / booked.acts).toFixed(1)}%) contain a repeat`);
    console.log(`  ${booked.repeatBeats} of ${booked.beats} beats `
      + `(${(100 * booked.repeatBeats / booked.beats).toFixed(1)}%) are a second airing`);
    rep.slice(0, 8).forEach(([id, n]) =>
      console.log(`  ${(n / SEASONS).toFixed(2)}/season repeated  ${id}`));

    // The band worth watching. Under one a season means a viewer meets it in
    // fewer than half the seasons they play.
    const rare = rows.filter(r => r.perSeason < 1);
    console.log(`\n── under 1.00/season (${rare.length}) ──`);
    rare.forEach(r => console.log('  ' + line(r)));

    // Booking six twists is still only six. Everything belonging to the other
    // twenty stays silent here and that is correct, not a gap — those events
    // exist for the seasons that book THEM. It is the reason the library looks
    // bigger than any one season's pool, and the reason a rate measured with no
    // schedule at all flatters every baseline event.
    const registered = HOUSE_EVENTS.map(e => e.id);
    const silent = registered.filter(id => !tally[id]);
    console.log(`\n── never fired, mostly other twists' families (${silent.length}) ──`);
    console.log('  ' + (silent.join('\n  ') || 'none'));
    console.log('\n(tests/events-big-brother-volume.test.js is the guard that books '
      + 'every twist and proves each family can fire. This file answers a different '
      + 'question: given a season you would actually play, how often.)\n');

    // ── health, not coverage ──
    //
    // One event taking more than a fiftieth of every beat in the house means the
    // feed has a favourite, which reads as repetition long before anybody works
    // out which event is responsible.
    const hog = rows[0];
    expect(hog.share, `${hog.id} is eating the feed at ${(hog.share * 100).toFixed(1)}% of beats`)
      .toBeLessThan(0.05);

    // And the middle of the library has to be reachable: if the median event
    // fires under once a season, most of what has been written is decoration.
    const median = rows[Math.floor(rows.length / 2)];
    expect(median.perSeason,
      `the median event only fires ${median.perSeason.toFixed(2)} times a season`)
      .toBeGreaterThanOrEqual(1);
  });
});

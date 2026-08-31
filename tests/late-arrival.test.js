// Somebody walks in after the season has started.
//
// Every camp in this engine began with everybody already on the dock:
// `generateDockArrivals` fires once, at episode zero, and after that the cast
// could only ever shrink. This is the oldest device in the genre and the one
// thing the format could not do.
//
// Built as a HOLD-OUT rather than an insert. The arrival is cast normally, in
// the cast builder, and then lifted out of the roster at episode zero and put
// back on the episode the author picked. Inventing a player mid-season instead
// would mean somebody with no entry in `players`, no stats, no avatar and no
// relationship rows — a worse problem than the one being solved.
// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { gs, seasonConfig, players, TWIST_CATALOG } from '../js/core.js';
import { pStats, pronouns, threatScore, ordinal } from '../js/players.js';
import { getBond, getPerceivedBond } from '../js/bonds.js';
import { simulateEpisode } from '../js/episode.js';
import { holdOutLateArrival, seatLateArrival, lateArrivalDue, lateArrivalName } from '../js/late-arrival.js';
import { seedGame } from './helpers/setup.js';
import { makeCast, runOneSeason, core } from './helpers/season-harness.js';

const K = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];
const spread = s => Object.fromEntries(K.map((k, i) => [k, 1 + ((s * 7 + i * 3) % 10)]));
const FAV = ['Bowie', 'Julia', 'DJ', 'Mike', 'Millie', 'Thom', 'Grett', 'Gabby',
  'Lake', 'Yul', 'Natalia', 'Spencer'];
const FAN = Array.from({ length: 12 }, (_, i) => `Fan${i + 1}`);

/** A Fans vs Favorites cast of 25 with one held back. */
function season({ arrival = 'James', arrivalTribe = 'smallest', episode = 3 } = {}) {
  const cast = [...FAV.map(n => [n, 'Favorites']), ['James', 'Favorites'],
    ...FAN.map(n => [n, 'Fans'])]
    .map(([name, tribe], i) => ({ name, tribe, archetype: 'floater',
      gender: i % 2 ? 'f' : 'm', sexuality: 'straight', stats: spread(i + 1) }));
  seedGame(cast, { episode: 0, eliminated: [], namedAlliances: [] });
  // `seedGame` leaves `tribes` as an empty object; the real season builder
  // turns each player's `tribe` into the array shape the engine uses.
  gs.tribes = [
    { name: 'Favorites', members: cast.filter(p => p.tribe === 'Favorites').map(p => p.name) },
    { name: 'Fans', members: cast.filter(p => p.tribe === 'Fans').map(p => p.name) },
  ];
  gs.isMerged = false;
  gs.phase = 'pre-merge';
  gs.initialized = true;          // simulateEpisode declines without it
  gs.episodeHistory = [];
  delete gs._lateArrival;
  delete gs._lifeArrivalsDone;
  Object.assign(seasonConfig, {
    format: 'total-drama', finaleSize: 3, mergeAt: 12, romance: 'enabled',
    setting: 'camp',
    twistSchedule: arrival === null ? []
      : [{ episode, type: 'late-arrival', arrival, arrivalTribe }],
  });
  Object.assign(globalThis, { gs, players, seasonConfig, pStats, pronouns,
    threatScore, getBond, getPerceivedBond, ordinal });
  return cast;
}
const tribeOf = name => (gs.tribes || []).find(t => (t.members || []).includes(name))?.name || null;
const sizes = () => Object.fromEntries((gs.tribes || []).map(t => [t.name, t.members.length]));

describe('the catalog entry', () => {
  it('exists and is a pre-merge team twist', () => {
    const cat = TWIST_CATALOG.find(t => t.id === 'late-arrival');
    expect(cat, 'the twist cannot be scheduled at all').toBeTruthy();
    expect(cat.phase).toBe('pre-merge');
    expect(cat.engineType).toBe('late-arrival');
  });
});

describe('being held back', () => {
  it('takes them out of the roster and out of their tribe', () => {
    season();
    expect(gs.activePlayers).toContain('James');
    holdOutLateArrival();
    expect(gs.activePlayers, 'they were still playing on day one').not.toContain('James');
    expect(tribeOf('James'), 'they were still standing in a tribe').toBeNull();
    expect(gs._lateArrival.castOn, 'the engine forgot where they were cast').toBe('Favorites');
  });

  it('remembers who it is even when the author never picked anybody', () => {
    // A twist that silently does nothing is worse than one that chooses.
    season({ arrival: '' });
    expect(lateArrivalName()).toBe(players[players.length - 1].name);
  });

  it('does nothing at all to a season without the twist', () => {
    season({ arrival: null });
    expect(holdOutLateArrival()).toBeNull();
    expect(gs.activePlayers).toHaveLength(25);
  });
});

describe('walking in', () => {
  it('joins the smallest camp, and ties break toward the other side', () => {
    // This is the Fans vs Favorites shape: 12 v 12 once the arrival is held
    // out, so the tie-break is what puts a Favorite in the Fans' camp.
    season();
    holdOutLateArrival();
    expect(sizes()).toEqual({ Favorites: 12, Fans: 12 });
    const walkIn = seatLateArrival({ num: 3 });
    expect(walkIn, 'nobody arrived').toBeTruthy();
    expect(walkIn.tribe, 'the tie broke toward their own camp').toBe('Fans');
    expect(walkIn.fromOtherSide).toBe(true);
    expect(tribeOf('James')).toBe('Fans');
    expect(gs.activePlayers).toContain('James');
  });

  it('can be sent to a camp by name instead', () => {
    season({ arrivalTribe: 'Favorites' });
    holdOutLateArrival();
    expect(seatLateArrival({ num: 3 }).tribe).toBe('Favorites');
  });

  it('goes back to their own camp when asked to', () => {
    season({ arrivalTribe: 'own' });
    holdOutLateArrival();
    const walkIn = seatLateArrival({ num: 3 });
    expect(walkIn.tribe).toBe('Favorites');
    expect(walkIn.fromOtherSide).toBe(false);
  });

  it('is never lost, even with no camp to walk into', () => {
    // This returned early when there was no tribe, so the held-out player
    // never entered AT ALL — the twist quietly deleted somebody from the cast,
    // which is the worst thing it could do.
    season();
    holdOutLateArrival();
    gs.isMerged = true;
    const walkIn = seatLateArrival({ num: 6 });
    expect(walkIn, 'a merged season lost them entirely').toBeTruthy();
    expect(gs.activePlayers).toContain('James');
  });

  it('only happens once', () => {
    season();
    holdOutLateArrival();
    expect(seatLateArrival({ num: 3 })).toBeTruthy();
    expect(seatLateArrival({ num: 4 }), 'they arrived twice').toBeNull();
    expect(gs.activePlayers.filter(n => n === 'James')).toHaveLength(1);
  });

  it('is not due before its episode', () => {
    season({ episode: 4 });
    holdOutLateArrival();
    expect(lateArrivalDue(2)).toBe(false);
    expect(lateArrivalDue(4)).toBe(true);
  });
});

describe('a season played with one', () => {
  // The real harness, because this needs the whole engine running: it mirrors
  // main.js's window exposure and stubs IndexedDB and the presentation layer.
  const playSeason = ({ arrivalTribe = 'smallest', episode = 3 } = {}) => {
    const cast = makeCast(24);
    cast.push({ name: 'Latecomer', slug: 'latecomer', gender: 'f', sexuality: 'straight',
      archetype: 'floater', tribe: 'Ravu',
      stats: Object.fromEntries(K.map(k => [k, 5])) });
    runOneSeason({
      twistSchedule: [{ episode, type: 'late-arrival', arrival: 'Latecomer', arrivalTribe }],
      mergeAt: 10, romance: 'disabled',
    }, 25, cast);
    return core.gs.episodeHistory || [];
  };

  it('starts a player short and evens up on the night they arrive', () => {
    // The rule the schedule has to respect: one walks out and one walks in, so
    // the count does not move on that episode.
    const history = playSeason();
    expect(history.length, 'the season did not run').toBeGreaterThan(4);
    const idx = history.findIndex(ep => ep.lateArrival);
    expect(idx, 'nobody ever walked in').toBeGreaterThan(-1);
    const ep = history[idx];
    expect(ep.lateArrival.name).toBe('Latecomer');
    // Absent from every episode before it.
    for (const earlier of history.slice(0, idx)) {
      expect(earlier.activeAtStart || [], 'they were playing before they arrived')
        .not.toContain('Latecomer');
    }
    // The count does not move across the arrival: somebody left, somebody came.
    const before = (history[idx].activeAtStart || []).length;
    const after = (history[idx + 1]?.activeAtStart || []).length;
    if (history[idx + 1]) {
      expect(after, `${before} before, ${after} after — an arrival should hold it level`)
        .toBe(before);
    }
  });

  it('puts them in the game and leaves them there', () => {
    const history = playSeason();
    const idx = history.findIndex(ep => ep.lateArrival);
    const later = history.slice(idx + 1);
    const everSeen = later.some(ep => (ep.activeAtStart || []).includes('Latecomer'));
    // Either they are still playing after arriving, or they were voted out —
    // what must never happen is arriving and never appearing in the roster.
    const wasVotedOut = history.some(ep => ep.eliminated === 'Latecomer');
    expect(everSeen || wasVotedOut, 'they walked in and vanished').toBe(true);
  });

  it('tells the camp about it', () => {
    const history = playSeason();
    const ep = history.find(e => e.lateArrival);
    expect(ep).toBeTruthy();
    const camp = ep.lateArrival.tribe;
    const walkIn = (ep.campEvents?.[camp]?.pre || []).find(e => e.type === 'lateArrival');
    expect(walkIn, 'they walked in and the camp said nothing').toBeTruthy();
    expect(walkIn.players).toContain('Latecomer');
    expect(walkIn.text.length).toBeGreaterThan(80);
  });
});

describe('what the viewer is shown', () => {
  // "Every feature needs VP + text backlog." The walk-in already rendered as a
  // camp-event card, so it was never invisible — but a card in the middle of a
  // camp feed is the wrong weight for the only episode all season where the
  // cast gets bigger.
  const arrivalEpisode = () => {
    const cast = makeCast(24);
    cast.push({ name: 'Latecomer', slug: 'latecomer', gender: 'f', sexuality: 'straight',
      archetype: 'floater', tribe: 'Ravu', stats: Object.fromEntries(K.map(k => [k, 5])) });
    runOneSeason({
      twistSchedule: [{ episode: 3, type: 'late-arrival', arrival: 'Latecomer', arrivalTribe: 'smallest' }],
      mergeAt: 10, romance: 'disabled',
    }, 25, cast);
    return (core.gs.episodeHistory || []).find(e => e.lateArrival);
  };

  it('writes a section of its own in the transcript', async () => {
    const ep = arrivalEpisode();
    const { generateSummaryText } = await import('../js/text-backlog.js');
    const text = generateSummaryText(ep) || '';
    expect(text).toContain('SOMEBODY ARRIVES');
    expect(text).toContain('Latecomer was not here when this season started');
    expect(text).toContain('No bonds, no alliance, no challenge record');
  });

  it('builds a screen of its own', async () => {
    const ep = arrivalEpisode();
    const { rpBuildLateArrival } = await import('../js/vp-screens.js');
    const html = rpBuildLateArrival(ep);
    expect(html, 'the arrival had no screen').toBeTruthy();
    expect(html).toContain('A NEW ARRIVAL');
    expect(html).toContain('Latecomer');
    // The camp they walked into is drawn with them, so the picture carries the
    // point: everybody else has been standing together for days.
    const camp = (ep.tribesAtStart || []).find(t => t.name === ep.lateArrival.tribe);
    const others = (camp?.members || []).filter(n => n !== 'Latecomer');
    expect(others.length).toBeGreaterThan(3);
    expect(html).toContain(`${others.length} PEOPLE WHO HAVE ALREADY DECIDED`);
  });

  it('draws nothing on an episode where nobody arrives', () => {
    const ep = arrivalEpisode();
    const plain = (core.gs.episodeHistory || []).find(e => !e.lateArrival);
    expect(plain, 'every episode had an arrival').toBeTruthy();
    expect(plain.lateArrival).toBeFalsy();
    expect(ep.lateArrival).toBeTruthy();
  });
});

describe('keeping the surprise', () => {
  const premiereAndArrival = () => {
    const cast = makeCast(24);
    cast.push({ name: 'Latecomer', slug: 'latecomer', gender: 'f', sexuality: 'straight',
      archetype: 'mastermind', tribe: 'Ravu', stats: Object.fromEntries(K.map(k => [k, 5])) });
    runOneSeason({
      twistSchedule: [{ episode: 3, type: 'late-arrival', arrival: 'Latecomer', arrivalTribe: 'smallest' }],
      mergeAt: 10, romance: 'disabled',
    }, 25, cast);
    const h = core.gs.episodeHistory || [];
    return { premiere: h[0], arrival: h.find(e => e.lateArrival) };
  };

  it('does not walk them down the dock in the premiere', () => {
    // The dock reads the CAST, and a late arrival is cast normally — so they
    // arrived in the cold open of episode one with a host line and a résumé,
    // weeks before they were due. The whole point of holding somebody back is
    // that nobody knows they are coming.
    const { premiere } = premiereAndArrival();
    const onDock = (premiere.dockArrivals || []).map(a => a.name);
    expect(onDock.length, 'nobody arrived at all').toBeGreaterThan(10);
    expect(onDock, 'the premiere introduced somebody who was not there')
      .not.toContain('Latecomer');
  });

  it('gives them their introduction on the episode they actually arrive', async () => {
    const { arrival } = premiereAndArrival();
    const { rpBuildLateArrival } = await import('../js/vp-screens.js');
    const html = rpBuildLateArrival(arrival);
    expect(html).toContain('WHAT THEY ARE WALKING IN WITH');
    expect(html.toLowerCase()).toContain('mastermind');
  });

  it('shows the room they walked into, even with no tribes', async () => {
    // `activeAtStart` lives on the live episode object and NOT on the stored
    // record, so reading it left the row empty on every replay and printed
    // "0 PEOPLE WHO HAVE ALREADY DECIDED WHO THEY TRUST" over nothing.
    const { arrival } = premiereAndArrival();
    const { rpBuildLateArrival } = await import('../js/vp-screens.js');
    const html = rpBuildLateArrival(arrival);
    expect(html, 'the row of people was empty').not.toMatch(/(?:^|>)0 PEOPLE WHO HAVE/);
    const m = html.match(/(\d+) PEOPLE WHO HAVE ALREADY DECIDED/);
    expect(m, 'no count at all').toBeTruthy();
    expect(Number(m[1])).toBeGreaterThan(3);
  });
});

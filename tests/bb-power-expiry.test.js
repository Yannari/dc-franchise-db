// A power that dies unspent.
//
// This started as a bug hunt with the wrong suspect. The viewer-only
// `power-expired` announcement was written, wired into both transcripts, and
// then never once observed firing — and the reason turned out not to be the
// announcement at all. THE CLOUD WAS BEING PLAYED THE INSTANT IT EXISTED:
// `if (cloud) usePower(cloud)`, no read on whether anybody was coming for the
// holder. An eight-week power was burned on the first ceremony every time, so
// nothing was ever left alive to expire and the entire decision the power is
// built around ("spend it on the ceremony you can see, and hope the one you
// cannot see does not come for you") was never taken by anybody.
//
// So this file guards two things that turned out to be the same thing: that
// holding a power is a choice, and that choosing wrong is visible to the
// audience afterwards.
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { gs, players, seasonConfig, relationships, TWIST_CATALOG } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode, summariseWeek } from '../js/bb-run.js';
import { grantPower, expirePowers } from '../js/bb/powers.js';
import { generateBBSummaryText } from '../js/text-backlog.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';

const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee', 'Brightly',
  'Hicks', 'Emmah', 'Millie', 'Caleb'];
const CAST = NAMES.map((name, i) => ({
  name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight',
  archetype: ['mastermind', 'social-butterfly', 'hero', 'showmancer'][i % 4],
}));

function house() {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns,
    ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat, TWIST_CATALOG });
  Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7,
    bbHaveNots: 'off', bbSafetyMode: 'off' });
  seasonConfig.twistSchedule = [];
  gs.bb = { outgoingHoh: null, weeks: [], stats: {}, house: null };
  gs.episodeHistory = []; gs.namedAlliances = []; gs.jury = []; gs.episode = 0;
}
afterAll(() => { seasonConfig.twistSchedule = []; delete seasonConfig.format; });

/** One episode in, so there is a real house with real reads in it. */
function openSeason(seed = 7) {
  house();
  withSeededRandom(seed, () => simulateBBEpisode());
  return gs.activePlayers[gs.activePlayers.length - 1];
}

describe('the sweep', () => {
  beforeEach(() => house());

  it('bins it at the end of the last week it could have been played, not a week later', () => {
    // Every other consumer treats expiresAfterWeek as the last USABLE week.
    // The sweep runs at the very end of that week, after all of them, so this
    // is the night the window actually shut.
    const inst = grantPower('the-cloud', 'Millie', { week: 3, visibility: 'secret', source: 'test' });
    expect(inst.expiresAfterWeek).toBeGreaterThan(3);

    expect(expirePowers(inst.expiresAfterWeek - 1, [...NAMES]),
      'disposed while it was still playable').toHaveLength(0);
    const binned = expirePowers(inst.expiresAfterWeek, [...NAMES]);
    expect(binned, 'survived its own last week').toHaveLength(1);
    expect(binned[0].disposedReason).toBe('expired');
  });

  it('reports what it disposed, so somebody can say so out loud', () => {
    grantPower('the-cloud', 'Millie', { week: 1, visibility: 'secret', source: 'test' });
    grantPower('halting-hex', 'Bowie', { week: 1, visibility: 'secret', source: 'test' });
    // Bowie has left the building; Millie is still in it and simply out of time.
    const binned = expirePowers(99, NAMES.filter(n => n !== 'Bowie'));
    const reasons = Object.fromEntries(binned.map(p => [p.holder, p.disposedReason]));
    expect(reasons.Bowie).toBe('holder-evicted');
    expect(reasons.Millie).toBe('expired');
  });
});

describe('The Cloud is a decision', () => {
  it('is not burned the instant it exists', () => {
    // The regression proper. Before the fix this was played in week 2 on every
    // seed, whatever the house was doing.
    let survived = 0;
    for (let seed = 1; seed <= 12; seed++) {
      openSeason(seed);
      const inst = grantPower('the-cloud', gs.activePlayers[gs.activePlayers.length - 1],
        { week: gs.bb.weeks.length + 1, visibility: 'secret', source: 'test' });
      withSeededRandom(400 + seed, () => simulateBBEpisode());
      if (!inst.used) survived++;
    }
    expect(survived, 'The Cloud was spent on sight in every single season').toBeGreaterThan(0);
  });

  it('is still spent when somebody is actually coming for the holder', () => {
    // ...and the other half: a power nobody ever plays is just as broken as
    // one everybody plays. Over enough seasons it has to go off.
    let played = 0;
    for (let seed = 1; seed <= 14; seed++) {
      openSeason(seed);
      const inst = grantPower('the-cloud', gs.activePlayers[gs.activePlayers.length - 1],
        { week: gs.bb.weeks.length + 1, visibility: 'secret', source: 'test' });
      for (let w = 0; w < 3 && !inst.used; w++) withSeededRandom(500 + seed * 7 + w, () => simulateBBEpisode());
      if (inst.used) played++;
    }
    expect(played, 'The Cloud was never played by anybody, in any season').toBeGreaterThan(0);
  });
});

describe('and the audience is told', () => {
  it('gets a viewer-only act, and it reaches both transcripts', () => {
    const holder = openSeason(7);
    const inst = grantPower('the-cloud', holder,
      { week: gs.bb.weeks.length + 1, visibility: 'secret', source: 'test' });
    // The fuse is ALREADY out, so the next week disposes of it at the top.
    //
    // This used to give the holder one week to play it — and the holder played
    // it, every time the dice fell that way, which meant no power ever expired
    // and this test asserted against an outcome the house had legitimately
    // declined to produce. It failed the day unrelated changes shifted the RNG,
    // which is the signature of a premise that was never deterministic rather
    // than of a regression. What this test is actually for is the DISPOSAL
    // path: an unplayed power is cleaned up, the viewer is told, the house
    // never is. Handing it a spent fuse tests exactly that and nothing else.
    inst.expiresAfterWeek = gs.bb.weeks.length;

    let ep = null;
    for (let i = 0; i < 4 && !ep; i++) {
      const played = withSeededRandom(100 + i, () => simulateBBEpisode());
      if ((played.acts || []).some(a => a.type === 'power-expired')) ep = played;
    }
    expect(ep, 'a power died unspent and nobody ever mentioned it').toBeTruthy();

    const act = ep.acts.find(a => a.type === 'power-expired');
    expect(act.viewerOnly, 'the house is not supposed to be told').toBe(true);
    expect(act.expired.some(x => x.holder === holder)).toBe(true);
    expect(act.beats.length).toBeGreaterThan(0);

    // Both writers. The in-app one is built from the EPISODE, the run one from
    // the WEEK, and a section that only exists in one of them is a section
    // half the users never see.
    const backlog = generateBBSummaryText(ep);
    const summary = summariseWeek(gs.bb.weeks[gs.bb.weeks.length - 1]);
    expect(backlog).toMatch(/QUIETLY LEFT THE GAME|NEVER PLAYED|LEFT WITH THEM/);
    expect(summary).toMatch(/QUIETLY LEFT THE GAME|NEVER PLAYED|LEFT WITH THEM/);
  });
});

// A power the viewer cannot see is a power the viewer cannot care about.
//
// The player showed a power being GRANTED and, for two of the four, showed it
// FIRING. Between those two nights — which can be a fortnight — the only
// record that anything existed was the Debug panel, and the Coup d'État and
// the Cloud fired into a `power-played` act that no surface read at all.
//
// These tests hold both ends: the week-scoped ledger that feeds the House Life
// band (with the rules attached, because four powers have four different
// limitations), and the screen plus both transcripts for a power being spent.
import { beforeEach, describe, expect, it } from 'vitest';
import { gs, players, seasonConfig, relationships } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode, summariseWeek } from '../js/bb-run.js';
import { generateSummaryText } from '../js/text-backlog.js';
import { buildVPScreens, _tvState } from '../js/vp-screens.js';
import {
  BB_POWER_DEFINITIONS, grantPower, usePower, powerLedgerFor,
} from '../js/bb/powers.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';

const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee', 'Brightly',
  'Hicks', 'Emmah', 'Millie', 'Caleb'];
const ARCH = ['mastermind', 'social-butterfly', 'hero', 'showmancer', 'schemer', 'floater',
  'villain', 'loyal-soldier', 'underdog', 'goat', 'hothead', 'wildcard'];
const CAST = NAMES.map((name, i) => ({
  name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight', archetype: ARCH[i],
}));

function house(twists = []) {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns,
    ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
  Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7,
    bbHaveNots: 'off', bbSafetyMode: 'off' });
  seasonConfig.twistSchedule = twists;
}

describe('the power ledger', () => {
  beforeEach(() => house());

  it('every power explains itself in plain language', () => {
    // The band prints these. A power with no blurb is a power the viewer has
    // to have memorised, which is the complaint this answers.
    for (const [id, def] of Object.entries(BB_POWER_DEFINITIONS)) {
      expect(def.blurb, `${id} has no blurb`).toBeTruthy();
      expect(def.catch, `${id} does not state its limitation`).toBeTruthy();
      expect(def.moment, `${id} does not say when it fires`).toBeTruthy();
      expect(def.blurb.length, `${id}'s blurb is a fragment`).toBeGreaterThan(30);
    }
  });

  it('reports what was in a pocket that week, with the fuse and the rules', () => {
    grantPower('bonus-life', 'Bowie', { week: 2, visibility: 'secret', source: 'test' });
    const wk2 = powerLedgerFor(2);
    expect(wk2).toHaveLength(1);
    expect(wk2[0]).toMatchObject({
      powerId: 'bonus-life', holder: 'Bowie', visibility: 'secret',
      used: false, firedThisWeek: false,
    });
    expect(wk2[0].weeksLeft, 'a four-week window starting in week 2').toBe(3);
    expect(wk2[0].catch, 'the ledger dropped the limitation').toMatch(/not immunity/i);

    // Still in play two weeks later, with a shorter fuse.
    expect(powerLedgerFor(4)[0].weeksLeft).toBe(1);
    // And gone before it was granted.
    expect(powerLedgerFor(1)).toHaveLength(0);
  });

  it('marks the week it was spent', () => {
    const inst = grantPower('coup-d-etat', 'Chase', { week: 1, visibility: 'holder-secret', source: 'test' });
    usePower(inst, 2);
    expect(powerLedgerFor(2)[0]).toMatchObject({ used: true, firedThisWeek: true });
    expect(powerLedgerFor(1)[0].firedThisWeek).toBe(false);
  });
});

describe('the House Life band', () => {
  it('shows what is still out there, who has it and what it does', () => {
    house([{ episode: 1, type: 'bb-app-store' }]);
    let ep = null;
    for (let week = 1; week <= 4 && !ep; week++) {
      const played = withSeededRandom(week * 101 + 7, () => simulateBBEpisode());
      if ((played.powerLedger || []).length) ep = played;
    }
    expect(ep, 'four weeks of an App Store season produced no live power').toBeTruthy();

    Object.keys(_tvState).forEach(k => delete _tvState[k]);
    const screens = buildVPScreens(ep);
    const life = screens.filter(s => s.label === 'House Life').map(s => s.html).join('');
    expect(life, 'no House Life screen to carry the band').toBeTruthy();
    expect(life, 'the band never rendered').toContain('STILL OUT THERE');

    const first = ep.powerLedger[0];
    expect(life, 'the power is not named').toContain(first.name);
    expect(life, 'the holder is not shown').toContain(first.holder);
    // The point of the band: the rule travels with it.
    expect(life, 'the band printed a power without saying what it does').toContain(first.blurb);
    expect(life, 'the band printed a power without its limitation').toContain(first.catch);
    // And it says who in that house is allowed to know.
    expect(life).toMatch(/THE HOUSE KNOWS|HOLDER UNKNOWN|NOBODY KNOWS/);
    expect(life).not.toMatch(/undefined|NaN|\[object Object\]/);
  });

  it('stays off a week where nobody is holding anything', () => {
    house();
    const ep = withSeededRandom(2026, () => simulateBBEpisode());
    expect(ep.powerLedger || []).toHaveLength(0);
    Object.keys(_tvState).forEach(k => delete _tvState[k]);
    const life = buildVPScreens(ep).filter(s => s.label === 'House Life')
      .map(s => s.html).join('');
    expect(life, 'an ordinary week grew a powers band').not.toContain('STILL OUT THERE');
  });
});

describe('a power being played', () => {
  it('gets a screen and reaches both transcripts', () => {
    // The Coup d'État and the Cloud reach the house through the App Store, and
    // their holders sit on them for a week or more — so this needs a season
    // rather than a week.
    let hit = null;
    for (let season = 0; season < 6 && !hit; season++) {
      house([{ episode: 1, type: 'bb-app-store' }]);
      for (let week = 1; week <= 6 && !hit; week++) {
        const played = withSeededRandom(season * 4099 + week * 977 + 3, () => simulateBBEpisode());
        const act = (played.acts || []).find(a => a.type === 'power-played');
        if (act) hit = { ep: played, act };
      }
    }
    // Empty loops pass silently, which is how this went unnoticed in the first
    // place: nothing read the act, and no test ever produced one.
    expect(hit, 'six App Store seasons and nobody ever spent a power').toBeTruthy();

    const { ep, act } = hit;
    Object.keys(_tvState).forEach(k => delete _tvState[k]);
    const screens = buildVPScreens(ep);
    const screen = screens.find(s => s.id.includes(`bb-power-${act.powerId}`));
    expect(screen, `${act.powerId} fired with no screen`).toBeTruthy();
    expect(screen.html).toContain(act.holder);
    // What it did this week, and the limitation people misremember. The
    // general blurb is only printed when the act carried no detail of its own,
    // so asserting on the catch is what holds for both shapes.
    expect(screen.html, 'the screen does not state the power\'s limitation')
      .toContain(BB_POWER_DEFINITIONS[act.powerId].catch);
    if (act.detail) expect(screen.html).toContain(act.detail);
    expect(screen.html).not.toMatch(/undefined|NaN|\[object Object\]/);

    for (const [label, text] of [
      ['generateSummaryText', generateSummaryText(ep)],
      ['summariseWeek', summariseWeek({ ...ep, acts: ep.acts })],
    ]) {
      expect(text, `${label}: a power fired and the transcript never said so`)
        .toContain('IS PLAYED');
      expect(text).toContain(act.holder);
    }
  });
});

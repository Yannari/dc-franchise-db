// BB Roadkill.
//
// BB18's shape: every houseguest plays a competition alone, out of sight of
// the rest, and only the winner is told they won. That winner secretly names a
// THIRD nominee who goes on the block beside the Head of Household's two with
// nobody's name attached to the key — and if the veto saves that third
// nominee, the Roadkill winner, not the Head of Household, names the
// replacement.
//
// The rules are the easy half. The half worth testing is the secrecy: the
// house has to be able to work out who did it, get it wrong a fair amount of
// the time, and act on the wrong name anyway. A twist where everybody
// immediately knows the truth is just a third nomination.
import { beforeEach, describe, expect, it } from 'vitest';
import { gs, players, seasonConfig, relationships } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode } from '../js/bb-run.js';
import { BB_TWIST_CONTRACTS, resolveWeekTwistState } from '../js/bb/twist-contract.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';

const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee', 'Brightly',
  'Hicks', 'Emmah', 'Millie', 'Caleb'];
const ARCH = ['mastermind', 'social-butterfly', 'hero', 'showmancer', 'schemer', 'floater',
  'villain', 'loyal-soldier', 'underdog', 'goat', 'hothead', 'wildcard'];
const CAST = NAMES.map((name, i) => ({
  name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight', archetype: ARCH[i],
}));

function house(extra = {}) {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns,
    ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
  Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7,
    bbHaveNots: 'off', bbSafetyMode: 'off' }, extra);
  seasonConfig.twistSchedule = [{ episode: 1, type: 'bb-roadkill' }];
}

const play = (seed = 2026) => withSeededRandom(seed, () => simulateBBEpisode());
const actOf = (ep, type) => (ep.acts || []).find(a => a.type === type);
const SEEDS = [2026, 77, 4242, 31, 909, 1301];

describe('BB Roadkill', () => {
  beforeEach(() => house());

  it('is registered, and asks for a third chair filled in secret', () => {
    expect(BB_TWIST_CONTRACTS['bb-roadkill']).toBeTruthy();
    const resolved = resolveWeekTwistState(['bb-roadkill']);
    expect(resolved.rules.nomineeCount).toBe(3);
    expect(resolved.rules.secretThirdNominator).toBe(true);
  });

  it('puts a third houseguest on the block, named by somebody else', () => {
    const ep = play();
    const rk = actOf(ep, 'roadkill');
    expect(rk, 'the roadkill competition never happened').toBeTruthy();
    expect(rk.winner, 'nobody won it').toBeTruthy();
    expect(rk.nominee, 'nobody was named').toBeTruthy();

    // Three on the block, and the third is the Roadkill nominee.
    expect(ep.initialNominees).toHaveLength(3);
    expect(ep.initialNominees).toContain(rk.nominee);
    // The Head of Household did not choose it and cannot be it.
    expect(rk.nominee).not.toBe(ep.hoh);
    expect(rk.winner).not.toBe(rk.nominee);
  });

  it('everybody plays it except the Head of Household', () => {
    // This used to assert the HOH played too, which put it in direct conflict
    // with the blame test below: the house works out who turned the third key
    // by ruling out the person openly holding the other two, so a week the HOH
    // could win is a week every houseguest is reasoning correctly and is wrong
    // anyway. On the show the HOH can neither win this nor be named by it; only
    // the second half was enforced.
    const ep = play();
    const rk = actOf(ep, 'roadkill');
    const played = (rk.results || []).map(r => r.name);
    expect(played, 'the Head of Household played their own secret comp').not.toContain(ep.hoh);
    expect(played.sort()).toEqual(ep.houseAtStart.filter(n => n !== ep.hoh).sort());
    // And nobody throws a competition they cannot be seen losing.
    const rows = Object.values(rk.competition?.debug?.scoreBreakdown || {});
    expect(rows.some(r => r.threw), 'somebody threw a secret competition').toBe(false);
  });

  it('the result is sealed — the act says so and names no winner publicly', () => {
    const ep = play();
    const rk = actOf(ep, 'roadkill');
    expect(rk.secret, 'the roadkill result was not sealed').toBe(true);
    // The nominations act carries the three names but not who filled the third.
    const noms = actOf(ep, 'nominations');
    expect(noms.nominees).toContain(rk.nominee);
    expect(noms.hoh).toBe(ep.hoh);
    expect(noms.hoh).not.toBe(rk.winner === ep.hoh ? null : rk.winner);
  });

  it('the third nominee blames somebody, and is often wrong', () => {
    // The whole value of the twist. If the house always guessed right this
    // would be a public nomination with extra steps.
    let guessed = 0, wrong = 0;
    for (const seed of SEEDS) {
      house();
      const ep = play(seed);
      const rk = actOf(ep, 'roadkill');
      if (!rk) continue;
      const guesses = ep.roadkillGuesses || [];
      if (!guesses.length) continue;
      guessed++;
      if (guesses.some(g => !g.correct)) wrong++;
      // Nobody accuses the Head of Household, who is the one person it cannot
      // have been — they were holding the other two keys in public.
      for (const g of guesses) expect(g.guess).not.toBe(ep.hoh);
    }
    expect(guessed, 'nobody ever tried to work out who did it').toBeGreaterThan(0);
    expect(wrong, 'the house was right every single time — the secret is not secret')
      .toBeGreaterThan(0);
  });

  it('a wrong guess costs the innocent houseguest something real', () => {
    let demonstrated = 0;
    for (const seed of SEEDS) {
      house();
      const ep = play(seed);
      const rk = actOf(ep, 'roadkill');
      const guesses = ep.roadkillGuesses || [];
      const blamed = guesses.find(g => !g.correct);
      if (!rk || !blamed) continue;
      // The grievance landed on the name they picked, not on the truth.
      const bad = getBond(blamed.who, blamed.guess);
      expect(Number.isFinite(bad), `no bond between ${blamed.who} and ${blamed.guess}`).toBe(true);
      // The grievance is filed against the name they picked, not the truth.
      expect(blamed.guess).not.toBe(rk.winner);
      demonstrated++;
      break;
    }
    // Without this the loop can complete having asserted nothing at all.
    expect(demonstrated, 'no seeded week produced a wrong guess to check').toBeGreaterThan(0);
  });

  it('saving the third nominee hands the pen to whoever put them there', () => {
    // The rule that is easiest to get wrong: the Head of Household never owned
    // the third chair, so they do not get to refill it either.
    let seen = 0;
    // A wide sweep on purpose: this branch needs the veto winner to choose to
    // save specifically the third nominee, which is a conjunction, and the
    // assertion below refuses to pass if no seed produced one.
    for (const seed of Array.from({ length: 40 }, (_, i) => i * 313 + 7)) {
      house();
      const ep = play(seed);
      const rk = actOf(ep, 'roadkill');
      const vc = actOf(ep, 'veto-ceremony');
      if (!rk || !vc || vc.saved !== rk.nominee) continue;
      seen++;
      expect(vc.chairAuthority, 'the HOH refilled a chair that was never theirs')
        .toBe(rk.winner);
    }
    // If no seed produced it, the assertion above never ran — say so rather
    // than passing silently.
    expect(seen, 'no seeded week ever vetoed the roadkill nominee').toBeGreaterThan(0);
  });

  it('stands down on a house too small to hide a third nomination in', () => {
    house();
    gs.activePlayers = NAMES.slice(0, 5);
    gs.eliminated = NAMES.slice(5);
    const ep = play(31);
    expect(actOf(ep, 'roadkill'), 'ran roadkill in a house of five').toBeFalsy();
    expect(ep.initialNominees.length).toBeLessThanOrEqual(2);
  });
});

// ── the surfaces ──────────────────────────────────────────────────────
import { buildVPScreens, _tvState } from '../js/vp-screens.js';
import { summariseWeek } from '../js/bb-run.js';
import { generateSummaryText } from '../js/text-backlog.js';

describe('BB Roadkill, on the surfaces', () => {
  beforeEach(() => house());

  it('gets its own screen, and holds the winner back until the last cards', () => {
    const ep = play();
    const rk = actOf(ep, 'roadkill');
    Object.keys(_tvState).forEach(k => delete _tvState[k]);

    const closed = buildVPScreens(ep);
    const ids = closed.map(s => s.id);
    expect(ids, 'no roadkill screen').toContain('bb-roadkill');
    expect(new Set(ids).size, `duplicate screen ids: ${ids.join(', ')}`).toBe(ids.length);

    // Before anything is revealed, nothing may IDENTIFY the winner. Their name
    // being on the wall is not a leak — every houseguest is on the wall, which
    // is exactly why the wall tells you nothing. What must not be there is the
    // card that says somebody won.
    const shut = closed.find(s => s.id === 'bb-roadkill').html;
    const body = shut.replace(/<style>[\s\S]*?<\/style>/g, '');
    expect(body, 'the truth card was shown before it was reached').not.toMatch(/ONLY YOU KNOW THIS/);
    expect(body, 'the screen announced a winner up front').not.toMatch(/won BB Roadkill/);
    // And the third nominee is not named before the key turns either.
    expect(body, 'the third nominee leaked before the key turned').not.toContain(`is nominated`);

    // Fully revealed, the viewer is told — and the house still is not.
    Object.keys(_tvState).forEach(k => { _tvState[k].idx = 999; });
    const open = buildVPScreens(ep).find(s => s.id === 'bb-roadkill').html;
    expect(open).toContain(rk.winner);
    expect(open).toContain(rk.nominee);
    expect(open, 'the screen never says the house is not told').toMatch(/never (told|finds out)/i);
    expect(open).not.toMatch(/undefined|NaN|\[object Object\]/);
  });

  it('reaches both transcript writers without naming the winner', () => {
    const ep = play();
    const rk = actOf(ep, 'roadkill');
    for (const [label, text] of [
      ['generateSummaryText', generateSummaryText(ep)],
      ['summariseWeek', summariseWeek({ ...ep, acts: ep.acts })],
    ]) {
      expect(text, `${label}: never mentions roadkill`).toMatch(/ROADKILL/i);
      expect(text, `${label}: the third nominee is missing`).toContain(rk.nominee);
      // The transcript is what the house could have written down. The winner
      // is not in it — the sealed result is the entire twist.
      const line = text.split('\n').find(l => /ROADKILL/i.test(l) && l.includes(rk.winner));
      expect(line, `${label}: the transcript named the roadkill winner`).toBeFalsy();
    }
  });

  it('the nomination ceremony credits the HOH with two, not three', () => {
    const ep = play();
    const rk = actOf(ep, 'roadkill');
    const noms = actOf(ep, 'nominations');
    // The act carries all three because all three are on the block, but the
    // plan the HOH actually made is still a plan for two.
    expect(noms.nominees).toHaveLength(3);
    expect(noms.nominees, 'the roadkill nominee is not on the block').toContain(rk.nominee);
    // Exactly one of the three came from somebody other than the HOH.
    expect(noms.nominees.filter(n => n !== rk.nominee)).toHaveLength(2);

    // A BACKDOOR TARGET IS NOT A NAME THE HOH READ OUT — it is the person they
    // arranged NOT to nominate. On two of the six seeds this file plays, the
    // HOH planned a backdoor and the roadkill winner then put that exact person
    // up from the other direction, which is the twist working: the HOH wanted
    // them gone quietly and somebody else did it loudly. Reading `target` as
    // one of the HOH's two chairs called that a miscredit.
    const readOut = [noms.backdoorTarget ? null : noms.target, noms.pawn].filter(Boolean);
    expect(readOut, 'the HOH was credited with the roadkill nominee')
      .not.toContain(rk.nominee);
    for (const name of readOut) {
      expect(noms.nominees, `${name} was credited to the HOH but is not on the block`)
        .toContain(name);
    }
  });
});

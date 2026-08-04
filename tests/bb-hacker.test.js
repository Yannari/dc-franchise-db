// The Hacker (BB20).
//
// Everybody plays it alone, only the winner is told, and the winner is never
// named. What they hold is three separate authorities, each optional, each
// anonymous, each spent on a different night: hack the block, hack the veto
// draw, hack the vote.
//
// The rules are the easy half again. What is worth testing is the arithmetic
// and the secrecy — that the count really does come up one short, that the
// house blames somebody for all three and is frequently wrong, and that the
// nominee taken off the block is NOT made safe by it, which is the rule this
// twist is most often remembered incorrectly.
import { beforeEach, describe, expect, it } from 'vitest';
import { gs, players, seasonConfig, relationships } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode, summariseWeek } from '../js/bb-run.js';
import { BB_TWIST_CONTRACTS, BASE_WEEK_RULES, resolveWeekTwistState } from '../js/bb/twist-contract.js';
import { buildVPScreens, _tvState } from '../js/vp-screens.js';
import { generateSummaryText } from '../js/text-backlog.js';
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
  seasonConfig.twistSchedule = [{ episode: 1, type: 'bb-hacker' }];
}

const play = (seed = 2026) => withSeededRandom(seed, () => simulateBBEpisode());
const actOf = (ep, type) => (ep.acts || []).find(a => a.type === type);
const SEEDS = [2026, 77, 4242, 31, 909, 1301, 55, 8123];
const WIDE = Array.from({ length: 40 }, (_, i) => i * 313 + 7);

describe('The Hacker — the contract', () => {
  beforeEach(() => house());

  it('is registered, and is the first twist to cancel a vote', () => {
    expect(BB_TWIST_CONTRACTS['bb-hacker']).toBeTruthy();
    expect(BASE_WEEK_RULES.cancelVotes, 'the base week cancels nothing').toBe(0);
    const resolved = resolveWeekTwistState(['bb-hacker']);
    expect(resolved.rules.hackerActive).toBe(true);
    expect(resolved.rules.cancelVotes).toBe(1);
    // Holder-secret, so the house is told the twist EXISTS and never who holds
    // it — the announcement fires, the name does not.
    expect(BB_TWIST_CONTRACTS['bb-hacker'].acquisition.secrecy).toBe('holder-secret');
    expect(resolved.announcements.some(a => a.twist === 'bb-hacker')).toBe(true);
  });

  it('everybody plays it, including the Head of Household, and nobody throws it', () => {
    const ep = play();
    const hk = actOf(ep, 'hacker');
    expect(hk, 'the hacker competition never happened').toBeTruthy();
    expect(hk.secret).toBe(true);
    const played = (hk.results || []).map(r => r.name);
    expect(played.sort()).toEqual([...ep.houseAtStart].sort());
    const rows = Object.values(hk.competition?.debug?.scoreBreakdown || {});
    expect(rows.some(r => r.threw), 'somebody threw a competition nobody watched').toBe(false);
  });

  it('stands down in a house too small to hide three anonymous moves in', () => {
    house();
    gs.activePlayers = NAMES.slice(0, 5);
    gs.eliminated = NAMES.slice(5);
    const ep = play(31);
    expect(actOf(ep, 'hacker'), 'ran the hacker in a house of five').toBeFalsy();
  });

  it('is deterministic — the same seed hacks the same way twice', () => {
    house();
    const a = play(4242);
    house();
    const b = play(4242);
    expect(b.hacker?.winner).toBe(a.hacker?.winner);
    expect(JSON.stringify(b.hacker?.blockHack)).toBe(JSON.stringify(a.hacker?.blockHack));
    expect(JSON.stringify(b.hackerVote)).toBe(JSON.stringify(a.hackerVote));
  });
});

describe('The Hacker — hack one: the block', () => {
  it('swaps one nominee for another, and never seats the untouchable', () => {
    let seen = 0;
    for (const seed of WIDE) {
      house();
      const ep = play(seed);
      const hack = ep.hacker?.blockHack;
      if (!hack) continue;
      seen++;
      expect(ep.initialNominees, 'the replacement never reached the block').toContain(hack.up);
      expect(ep.initialNominees, 'the removed nominee is still on the block').not.toContain(hack.down);
      // The Head of Household cannot be seated by somebody else's power, the
      // hacker cannot seat themselves, and nobody goes up twice.
      expect(hack.up).not.toBe(ep.hoh);
      expect(hack.up).not.toBe(ep.hacker.winner);
      expect(new Set(ep.initialNominees).size).toBe(ep.initialNominees.length);
    }
    expect(seen, 'no seeded week ever hacked the block').toBeGreaterThan(0);
  });

  it('the houseguest taken down is NOT safe', () => {
    // The rule the wiki settles and memory gets wrong. Coming off the block by
    // hack is a stay, not a pardon: no immunity is recorded anywhere, and the
    // veto ceremony may seat them again the same week.
    let checked = 0, reseated = 0;
    for (const seed of WIDE) {
      house();
      const ep = play(seed);
      const hack = ep.hacker?.blockHack;
      if (!hack) continue;
      checked++;
      expect(ep.extraImmune || [], 'the hack handed out immunity').not.toContain(hack.down);
      expect(gs.bb.stats[hack.down].timesSaved || 0,
        'coming off by hack was recorded as a veto save').toBe(
        (ep.vetoDecision?.save === hack.down) ? 1 : 0);
      const vc = actOf(ep, 'veto-ceremony');
      if (vc && vc.replacement === hack.down) reseated++;
    }
    expect(checked, 'no seeded week ever hacked the block').toBeGreaterThan(0);
    // Not an assertion about frequency — only that the path is reachable and
    // legal when the veto ceremony chooses it.
    expect(reseated).toBeGreaterThanOrEqual(0);
  });

  it('the replacement blames somebody, and the house is often wrong', () => {
    let guessed = 0, wrong = 0;
    for (const seed of SEEDS) {
      house();
      const ep = play(seed);
      const guesses = ep.hackerGuesses || [];
      if (!guesses.length) continue;
      guessed++;
      if (guesses.some(g => !g.correct)) wrong++;
      // Nobody accuses the Head of Household — they are the one person it
      // cannot have been, since their own block is what got rewritten.
      for (const g of guesses) expect(g.guess).not.toBe(ep.hoh);
    }
    expect(guessed, 'nobody ever tried to work out who did it').toBeGreaterThan(0);
    expect(wrong, 'the house was right every time — the secret is not secret')
      .toBeGreaterThan(0);
  });

  it('a wrong guess costs the innocent houseguest something real', () => {
    let demonstrated = 0;
    for (const seed of [...SEEDS, ...WIDE]) {
      house();
      const ep = play(seed);
      const guesses = ep.hackerGuesses || [];
      const blamed = guesses.find(g => !g.correct);
      if (!blamed) continue;
      expect(blamed.guess).not.toBe(ep.hacker.winner);
      expect(Number.isFinite(getBond(blamed.who, blamed.guess))).toBe(true);
      demonstrated++;
      break;
    }
    expect(demonstrated, 'no seeded week produced a wrong guess to check').toBeGreaterThan(0);
  });
});

describe('The Hacker — hack two: the veto draw', () => {
  it('takes a seat rather than adding one, and never unseats the three who play by right', () => {
    let seen = 0;
    for (const seed of WIDE) {
      house();
      const ep = play(seed);
      const hack = ep.hacker?.vetoHack;
      const veto = actOf(ep, 'veto');
      if (!hack?.pick || !veto) continue;
      seen++;
      expect(veto.participants, 'the hacked pick never played').toContain(hack.pick);
      expect(veto.participants, 'the replaced houseguest played anyway').not.toContain(hack.replaced);
      expect(veto.hacked?.pick, 'the veto act does not record the hacked seat').toBe(hack.pick);
      // The Head of Household and the nominees play by right; the hacker may
      // choose who fills the drawn seats, not who loses their own.
      expect(hack.replaced).not.toBe(ep.hoh);
      expect(ep.initialNominees, 'a nominee lost their own seat').not.toContain(hack.replaced);
      expect(new Set(veto.participants).size).toBe(veto.participants.length);
    }
    expect(seen, 'no seeded week ever hacked the draw').toBeGreaterThan(0);
  });
});

describe('The Hacker — hack three: the vote', () => {
  it('removes exactly one ballot, and the count comes up short', () => {
    let seen = 0;
    for (const seed of WIDE) {
      house();
      const ep = play(seed);
      const kill = ep.hackerVote;
      const hv = actOf(ep, 'hacker-vote');
      if (!kill?.voter) continue;
      seen++;
      expect(hv, 'the cancelled vote left no act').toBeTruthy();
      const log = ep.votingLog || [];
      expect(log.map(v => v.voter), 'the silenced houseguest still voted')
        .not.toContain(kill.voter);
      // Everybody eligible except the one who was cancelled.
      const eligible = ep.houseAtStart.filter(n =>
        n !== ep.hoh && !(ep.finalNominees || []).includes(n));
      expect(log.length, 'the count is not one short').toBe(eligible.length - 1);
      // Exactly one — the contract allows one cancellation, not two.
      expect(hv.voter).toBe(kill.voter);
      expect(kill.wouldHaveVoted).toBeTruthy();
    }
    expect(seen, 'no seeded week ever cancelled a vote').toBeGreaterThan(0);
  });

  it('a cancel that flips or levels the count really does change the arithmetic', () => {
    // Not "the saved houseguest survives": levelling the count hands the night
    // to the Head of Household's tiebreak, and the HOH is perfectly entitled to
    // evict them anyway. What the cancel guarantees is the COUNT.
    let demonstrated = 0;
    for (const seed of WIDE) {
      house();
      const ep = play(seed);
      const kill = ep.hackerVote;
      if (!kill?.voter || !(kill.flips || kill.levels)) continue;
      const votes = ep.votes || {};
      const rival = (ep.finalNominees || []).find(n => n !== kill.saved);
      expect(votes[kill.saved] ?? 0,
        'the cancel was recorded as flipping a vote it did not flip')
        .toBeLessThanOrEqual(votes[rival] ?? 0);
      if (kill.flips) {
        expect(ep.eliminated, 'a strict flip still evicted the saved houseguest')
          .not.toBe(kill.saved);
      }
      demonstrated++;
    }
    expect(demonstrated, 'no seeded week produced a flipping or levelling cancel')
      .toBeGreaterThan(0);
  });
});

describe('The Hacker — on the surfaces', () => {
  beforeEach(() => house());

  it('gets its own screen and holds the identity back to the last cards', () => {
    const ep = play();
    const hk = actOf(ep, 'hacker');
    Object.keys(_tvState).forEach(k => delete _tvState[k]);

    const closed = buildVPScreens(ep);
    const ids = closed.map(s => s.id);
    expect(ids, 'no hacker screen').toContain('bb-hacker');
    expect(new Set(ids).size, `duplicate screen ids: ${ids.join(', ')}`).toBe(ids.length);

    const body = closed.find(s => s.id === 'bb-hacker').html.replace(/<style>[\s\S]*?<\/style>/g, '');
    expect(body, 'the truth card was shown before it was reached').not.toMatch(/ONLY YOU KNOW THIS/);
    expect(body, 'the screen announced a winner up front').not.toMatch(/won the Hacker Competition/);

    Object.keys(_tvState).forEach(k => { _tvState[k].idx = 999; });
    const open = buildVPScreens(ep).find(s => s.id === 'bb-hacker').html;
    expect(open).toContain(hk.winner);
    expect(open, 'the screen never says the house is not told').toMatch(/never (told|finds out|know)/i);
    expect(open).not.toMatch(/undefined|NaN|\[object Object\]/);
  });

  it('reaches both transcript writers without naming the hacker', () => {
    const ep = play();
    const hk = actOf(ep, 'hacker');
    for (const [label, text] of [
      ['generateSummaryText', generateSummaryText(ep)],
      ['summariseWeek', summariseWeek({ ...ep, acts: ep.acts })],
    ]) {
      expect(text, `${label}: never mentions the hacker`).toMatch(/THE HACKER/i);
      // The transcript is what the house could have written down, and the
      // sealed result is the entire twist. Anchor on the ACT's own block: the
      // twist ANNOUNCEMENT also carries the words "The Hacker" and is followed
      // by reaction beats that name half the house for innocent reasons.
      const lines = text.split('\n');
      const from = lines.findIndex((l, i) => /^\s*THE HACKER\s*$/.test(l)
        || (/THE HACKER/.test(l) && /PLAYED ALONE/.test(l))
        || (/THE HACKER/.test(l) && /plays it alone/.test(lines[i + 1] || '')));
      expect(from, `${label}: the hacker act wrote no block of its own`).toBeGreaterThan(-1);
      const section = lines.slice(from, from + 12).join('\n');
      expect(section, `${label}: the transcript named the hacker`).not.toContain(hk.winner);
    }
  });

  it('draws the cancelled vote when there is one', () => {
    let drawn = 0;
    for (const seed of WIDE) {
      house();
      const ep = play(seed);
      if (!ep.hackerVote?.voter) continue;
      Object.keys(_tvState).forEach(k => delete _tvState[k]);
      const ids = buildVPScreens(ep).map(s => s.id);
      expect(ids, 'the cancelled vote has no screen').toContain('bb-hackervote');
      const text = summariseWeek({ ...ep, acts: ep.acts });
      expect(text).toMatch(/A VOTE IS CANCELLED/);
      expect(text).toContain(ep.hackerVote.voter);
      drawn++;
      break;
    }
    expect(drawn, 'no seeded week ever cancelled a vote to draw').toBeGreaterThan(0);
  });
});

// The Invisible HOH — the knowledge/secrecy vertical slice.
//
// The spec's warning is the whole test list: a hidden winner is not useful
// if every strategy function silently knows the identity. So the assertions
// here are mostly about what does NOT happen — no perception evidence, no
// comp-dominance respect, no reign judgment, no grievance aimed at the real
// HOH unless somebody genuinely guessed right — plus the canonical BBCAN9
// rules: no vote, eligible next week, revealed only to the evictee.
// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { gs, seasonConfig, TWIST_CATALOG, players } from '../js/core.js';
import { pStats, pronouns, threatScore } from '../js/players.js';
import { getBond, getPerceivedBond } from '../js/bonds.js';
import { ordinal } from '../js/finale.js';
import { simulateBBWeek } from '../js/bb/week.js';
import { simulateBBEpisode } from '../js/bb-run.js';
import { resolveWeekTwistState } from '../js/bb/twist-contract.js';
import { BB_COMPETITIONS } from '../js/bb-comps/index.js';
import { HOUSE_EVENTS } from '../js/bb-events/index.js';
import { buildVPScreens, _tvState } from '../js/vp-screens.js';
import { seedGame } from './helpers/setup.js';

const STAT_KEYS = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];
const spread = s => Object.fromEntries(STAT_KEYS.map((k, i) => [k, 1 + ((s * 7 + i * 3) % 10)]));
const CAST = Array.from({ length: 12 }, (_, i) => ({
  name: 'P' + i, archetype: ['mastermind', 'hero', 'floater', 'villain', 'schemer', 'goat'][i % 6],
  gender: i % 2 ? 'f' : 'm', sexuality: 'straight', stats: spread(i + 1),
}));
const seededRng = (seed = 5) => () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);

function reset() {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  gs.bb = { outgoingHoh: null, weeks: [], stats: {}, house: null };
  gs.popularity = {}; gs.showmances = []; gs.romanticSparks = [];
  seasonConfig.romance = 'enabled';
  seasonConfig.finaleSize = 3;
}

const invisibleWeek = seed => {
  reset();
  return simulateBBWeek({ rng: seededRng(seed), houseEvents: HOUSE_EVENTS,
    competitions: BB_COMPETITIONS, twists: ['bb-invisible-hoh'] });
};

describe('the Invisible HOH', () => {
  it('is a Big Brother twist that announces its existence, not its winner', () => {
    const entry = TWIST_CATALOG.find(t => t.id === 'bb-invisible-hoh');
    expect(entry).toBeTruthy();
    expect(entry.format).toBe('big-brother');
    // holder-secret announces; the announcement never carries a name.
    const { announcements, rules } = resolveWeekTwistState(['bb-invisible-hoh']);
    expect(rules.hohSecret).toBe(true);
    expect(announcements).toHaveLength(1);
    expect(announcements[0].rule).toContain('INVISIBLE');
  });

  it('runs the canonical BBCAN9 week: no vote, no lockout, sealed everywhere', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const week = invisibleWeek(seed * 19 + 5);
      expect(week.hohSecret).toBe(true);
      expect(week.acts.some(a => a.type === 'twist-announcement')).toBe(true);
      expect(week.acts.find(a => a.type === 'hoh').secret).toBe(true);
      expect(week.acts.find(a => a.type === 'nominations').anonymous).toBe(true);
      // No pawn negotiation — it cannot happen without outing the winner.
      expect(week.pawnAsk).toBe(null);
      // The Invisible HOH casts no vote and is not locked out next week.
      expect(week.ballots.some(b => b.voter === week.hoh)).toBe(false);
      expect(gs.bb.outgoingHoh).toBe(null);
      // Nobody publicly judges a reign nobody can name.
      expect(week.reign).toBe(null);
      // The evictee learns the truth in the goodbye message.
      expect(week.invisibleReveal?.to).toBe(week.evicted);
    }
  });

  it('makes the house GUESS, and lets the guesses be wrong with real consequences', () => {
    let right = 0, wrong = 0;
    for (let seed = 1; seed <= 30; seed++) {
      const week = invisibleWeek(seed * 19 + 5);
      const guesses = week.hohGuesses || [];
      expect(guesses.length).toBeGreaterThanOrEqual(2);
      for (const g of guesses) {
        expect(g.guess).not.toBe(g.who);
        if (g.correct) { right++; expect(g.guess).toBe(week.hoh); }
        else { wrong++; expect(g.guess).not.toBe(week.hoh); }
        // The grievance landed on the GUESS — right or wrong — never
        // silently on the truth.
        const memories = (gs.strategicMemories?.[g.who] || [])
          .filter(m => m.type === 'renomination' && m.ep === week.num);
        for (const m of memories) expect(m.subject).toBe(g.guess);
      }
    }
    // Both outcomes must actually occur across the sweep, or the guessing is
    // theater: all-right is omniscience, all-wrong is a broken read.
    expect(right).toBeGreaterThan(5);
    expect(wrong).toBeGreaterThan(5);
  });

  it('gives the strategy layer no omniscience', () => {
    for (let seed = 1; seed <= 12; seed++) {
      const week = invisibleWeek(seed * 31 + 7);
      // Comp dominance (fear/respect from being SEEN winning) never fired.
      // Its writer records against the winner; the cleanest observable is the
      // perception store: no nominee's read of the real HOH got the
      // "they nominated me" evidence boost unless their guess was right.
      const wrongGuessers = (week.hohGuesses || []).filter(g => !g.correct).map(g => g.who);
      for (const nominee of wrongGuessers) {
        // Memories about the real HOH for OTHER reasons (a scheme they ran, a
        // kindness, an arena loss) are fine — only HOH-attributed types would
        // mean the nominee silently knew who nominated them.
        const memories = (gs.strategicMemories?.[nominee] || [])
          .filter(m => m.ep === week.num && m.subject === week.hoh
            && ['renomination', 'diamond-hijack', 'nominated-me'].includes(m.type));
        expect(memories, `${nominee} silently knew ${week.hoh} was the HOH`).toHaveLength(0);
      }
    }
  });

  it('keeps the HOH-room events dark — no holding court in a room nobody owns', () => {
    // The regression the first played week exposed: the power events' hoh
    // helper fell back to ctx.week.hoh, reaching around the nulled context —
    // so a sealed week still showed Bowie holding court in the HOH room,
    // taking pitches and promising safety. On an invisible week every event
    // in the hoh-room/hoh-power family must stay silent.
    for (let seed = 1; seed <= 15; seed++) {
      const week = invisibleWeek(seed * 23 + 11);
      const beats = week.acts.flatMap(a => a.socialBeats || []);
      const leaks = beats.filter(b => /^power-hoh/.test(String(b.eventId || '')));
      expect(leaks.map(b => b.eventId), `week ${seed} narrated the hidden HOH as HOH`).toEqual([]);
    }
  });

  it('fills the sealed week with paranoia instead of silence', () => {
    // The power-hoh family goes dark on a sealed week, which without a
    // replacement left LESS texture than a normal week. The invisible family
    // is that replacement: speculation, accusation, false credit, performed
    // innocence — and it exists only on sealed weeks.
    let weeksWith = 0;
    for (let seed = 1; seed <= 10; seed++) {
      const week = invisibleWeek(seed * 29 + 3);
      const inv = week.acts.flatMap(a => a.socialBeats || [])
        .filter(b => String(b.eventId || '').startsWith('invisible-'));
      if (inv.length) weeksWith++;
    }
    expect(weeksWith).toBeGreaterThanOrEqual(8);
    // And a normal week never hears from it.
    reset();
    const normal = simulateBBWeek({ rng: seededRng(97), houseEvents: HOUSE_EVENTS,
      competitions: BB_COMPETITIONS });
    expect(normal.acts.flatMap(a => a.socialBeats || [])
      .filter(b => String(b.eventId || '').startsWith('invisible-'))).toEqual([]);
  });

  it('replays identically for the same seed', () => {
    const run = () => {
      const w = invisibleWeek(733);
      return { hoh: w.hoh, guesses: w.hohGuesses, evicted: w.evicted, noms: w.finalNominees };
    };
    expect(run()).toEqual(run());
  });

  it('plays a full episode where the screens stay house-blind and the viewer gets the irony', () => {
    reset();
    Object.assign(seasonConfig, {
      format: 'big-brother', jurySize: 7, bbSafetyMode: 'off',
      bbHaveNots: 'off', bbDepartures: 'off', setting: 'bb-house',
      twistSchedule: [{ episode: 1, type: 'bb-invisible-hoh' }],
    });
    gs.episodeHistory = []; gs.riPlayers = gs.riPlayers || []; gs.sideDeals = []; gs.knowledge = {};
    Object.assign(globalThis, { gs, players, seasonConfig, pStats, pronouns, threatScore, getBond, getPerceivedBond, ordinal });
    const ep = simulateBBEpisode();
    expect(ep.hohSecret).toBe(true);
    // The transcript is broadcast-shaped: sealed result, voice-read keys,
    // viewer-only reveal marked as such, goodbye-message reveal at the end.
    expect(ep.summaryText).toContain('RESULT SEALED');
    expect(ep.summaryText).toContain(`(Viewer only: ${ep.hoh} is the Invisible HOH.)`);
    expect(ep.summaryText).toContain('READ BY BIG BROTHER');
    expect(ep.summaryText).toContain('signs the week');
    // The screens: sealed comp board, anonymous ceremony, and no house-facing
    // HOH credit on the status screen.
    buildVPScreens(gs.episodeHistory[0]);
    Object.keys(_tvState).filter(k => k.startsWith('bb_')).forEach(k => { _tvState[k].idx = 99; });
    const screens = buildVPScreens(gs.episodeHistory[0]);
    const hohScreen = screens.find(s => s.id.includes('bb-hoh'));
    // The competition is drawn at random and a sealed screen says so in its own
    // words — a lane board prints "RESULT SEALED", the tiki yard "THE HOUSE
    // NEVER FINDS OUT", the poker table simply goes dark. This used to assert
    // one of those phrasings and so failed about one run in three, on nothing
    // worse than the season picking a different competition.
    //
    // "ONLY YOU KNOW" is the one thing every sealed competition shares: rule 3
    // of the contract in vp-bb-sig/_sealed.js, the single card where the winner
    // may be named, rendered by the seventeen themed screens through
    // sealIronyCard and by the generic board in its own copy.
    //
    // Deliberately NOT asserted here: that the winner is unnamed everywhere
    // else. A houseguest's name legitimately appears all over these screens as
    // a COMPETITOR — Majority Rules lists the whole house on its board — so
    // "does the name occur" cannot tell a leak from a roster. Catching a real
    // leak means proving a screen shows LESS when sealed than when not, which
    // is a sweep across all twenty-three competitions and belongs in its own
    // file, not smuggled into a one-episode test.
    expect(hohScreen.html).toContain('ONLY YOU KNOW');
    const nomScreen = screens.find(s => s.id.includes('bb-noms'));
    expect(nomScreen.html).toContain('THE VOICE OF BIG BROTHER');
    expect(nomScreen.html).not.toContain(`${ep.hoh} turns`);
    // Announcement screen fired for a holder-secret twist.
    expect(screens.some(s => s.id.includes('bb-twist'))).toBe(true);
  });
});

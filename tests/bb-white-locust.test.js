// The White Locust Resort, and the Call Out Chain.
//
// BB27 Week 9, and the wiki is blunt about the shape: "by the end of their stay,
// one houseguest would not be checking out", then "the rest of the week would
// continue on as normal, ending with the eviction of the second juror".
//
// So this card takes somebody out BEFORE the week runs, and the week then runs
// anyway. That is the dangerous part and most of what is asserted here: an
// eviction outside the normal path is exactly where a season quietly corrupts —
// a player off the roster but still in the placements, a jury that disagrees
// with the eliminated list, a house that plays a competition against somebody
// who already left.
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { gs, players, seasonConfig, relationships, setGs, TWIST_CATALOG,
  twistsForFormat } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { BB_TWIST_CONTRACTS, resolveWeekTwistState } from '../js/bb/twist-contract.js';
import { simulateBBEpisode } from '../js/bb-run.js';
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
    bbHaveNots: 'off', bbSafetyMode: 'off', theme: '', ...extra });
  seasonConfig.twistSchedule = [];
  seasonConfig.themeArcStamped = '';
  setGs({ ...gs, bb: null });
}

function playToResort(seed = 313, epNum = 3) {
  seasonConfig.twistSchedule = [{ id: 'w1', episode: epNum, type: 'bb-white-locust' }];
  let week = null;
  withSeededRandom(seed, () => {
    for (let i = 0; i < 20; i++) {
      if (!simulateBBEpisode()) break;
      week = (gs.bb.weeks || []).find(w => w.resortEvicted);
      if (week) break;
      if (gs.bb?.over) break;
    }
  });
  return week;
}
const chainAct = week => (week.acts || []).find(a => a.type === 'white-locust');

beforeEach(() => house());
afterEach(() => { setGs({ ...gs, bb: null }); });

describe('the card', () => {
  it('is in the catalogue, has a contract, and announces itself', () => {
    expect(TWIST_CATALOG.find(c => c.id === 'bb-white-locust')).toBeTruthy();
    const c = BB_TWIST_CONTRACTS['bb-white-locust'];
    expect(c).toBeTruthy();
    expect(c.announcement.rule).toMatch(/call somebody out/i);
    expect(resolveWeekTwistState(['bb-white-locust']).rules.callOutChain).toBe(true);
  });

  // Both new cards have to be pickable in the Format Designer, not just
  // runnable from a hand-written schedule. The list is derived from the
  // catalogue by format, so this is really a check that nothing about the
  // entry disqualifies it.
  it('is offered to a Big Brother season, and so is the Sanctum', () => {
    const offered = twistsForFormat({ format: 'big-brother' }).map(t => t.id);
    expect(offered).toContain('bb-white-locust');
    expect(offered).toContain('bb-sanctum-week');
  });

  it('will not share a week with anything else that evicts or crowns', () => {
    const card = TWIST_CATALOG.find(c => c.id === 'bb-white-locust');
    for (const other of ['bb-double-eviction', 'bb-instant-eviction', 'bb-no-eviction',
      'bb-battle-of-the-block', 'bb-invisible-hoh', 'bb-split-house']) {
      expect(card.incompatible, `${other} may share the week`).toContain(other);
    }
  });
});

describe('the chain', () => {
  // ── the crown that came from nowhere ──
  //
  // The resort crowns its Head of Household off the chain, so the week runs
  // with no Head of Household COMPETITION at all. Slop is chosen worst-first
  // from that competition's board, and the call read `hohCompetition.placements`
  // without checking there had been one — so a resort week in a season with
  // slop switched on threw "Cannot read properties of null" and took the season
  // down with it.
  //
  // It survived because of where the two sides were tested. This file plays the
  // resort with `bbHaveNots: 'off'`, and the sweep that plays real seasons WITH
  // slop had never scheduled the resort. Neither harness could see it, which is
  // the recurring shape in this project rather than an unlucky gap: two paths,
  // each covering what the other does not.
  //
  // Same null on a Split House week, which is also handed its crown.
  it('runs in a season with slop switched on', () => {
    house({ bbHaveNots: 'every-week' });
    const week = playToResort();
    expect(week, 'the resort never ran with have-nots on').toBeTruthy();
    expect(chainAct(week), 'the chain act is missing').toBeTruthy();
    // No board to rank anybody on, so nobody goes on slop and no ceremony is
    // staged — an empty have-nots act would announce the slop room to nobody.
    expect(week.haveNots || []).toEqual([]);
    expect((week.acts || []).some(a => a.type === 'have-nots'),
      'a week with no competition staged a slop ceremony anyway').toBe(false);
    // And the week still finished: an eviction on top of the chain's.
    expect(week.evicted, 'the week never reached its eviction').toBeTruthy();
  });

  it('runs, eliminates exactly one, and crowns the fastest survivor', () => {
    const week = playToResort();
    expect(week, 'the resort never ran').toBeTruthy();
    const act = chainAct(week);
    expect(act).toBeTruthy();
    expect(act.rounds.length).toBeGreaterThan(0);
    // Exactly one failure, and it is the last round — the chain stops there.
    const failures = act.rounds.filter(r => !r.made);
    expect(failures.length).toBe(1);
    expect(act.rounds[act.rounds.length - 1].made).toBe(false);
    expect(failures[0].target).toBe(act.evicted);
    // The safe player is never the one who goes.
    expect(act.evicted).not.toBe(act.safe);
    // The crown goes to the fastest of everybody who SURVIVED A CALL-OUT, as the rules are read out
    // (bb/white-locust.js); the safety winner is crowned only when nobody survived one. (This used to
    // count the safety time too, and passed only while the seed never had a survivor slower than it.)
    const fastest = act.survivors.length
      ? [...act.survivors].sort((a, b) => a.time - b.time)[0].name : act.safe;
    expect(act.hoh).toBe(fastest);
    expect(week.hoh).toBe(act.hoh);
  });

  it('shortens the clock every time somebody survives', () => {
    const week = playToResort();
    const limits = chainAct(week).rounds.filter(r => !r.sweep).map(r => r.limit);
    for (let i = 1; i < limits.length; i++) {
      expect(limits[i], 'the clock did not get shorter').toBeLessThan(limits[i - 1]);
    }
  });

  it('passes the pin to whoever just survived', () => {
    const rounds = chainAct(playToResort()).rounds.filter(r => !r.sweep);
    for (let i = 1; i < rounds.length; i++) {
      expect(rounds[i].caller).toBe(rounds[i - 1].target);
      expect(rounds[i - 1].made).toBe(true);
    }
  });

  it('replays identically from the same seed', () => {
    const a = chainAct(playToResort(717)).rounds.map(r => `${r.caller}>${r.target}`).join('|');
    house();
    const b = chainAct(playToResort(717)).rounds.map(r => `${r.caller}>${r.target}`).join('|');
    expect(b).toBe(a);
  });
});

// The part that can quietly wreck a season.
describe('the eliminated houseguest is properly gone', () => {
  it('leaves the roster and the placements agreeing with each other', () => {
    const week = playToResort();
    const gone = week.resortEvicted;
    expect(gs.activePlayers).not.toContain(gone);
    expect(gs.eliminated, 'off the roster but never eliminated').toContain(gone);
    // And the week that ran afterwards never used them.
    expect(week.hoh).not.toBe(gone);
    expect(week.initialNominees || []).not.toContain(gone);
    expect((week.ballots || []).map(b => b.voter)).not.toContain(gone);
    expect(week.evicted).not.toBe(gone);
  });

  it('takes TWO out of the house that week, not one', () => {
    const week = playToResort();
    expect(week.resortEvicted).toBeTruthy();
    expect(week.evicted).toBeTruthy();
    expect(week.evicted).not.toBe(week.resortEvicted);
  });

  it('lets the season finish without tripping over the extra eviction', () => {
    house();
    let last = null;
    withSeededRandom(313, () => {
      seasonConfig.twistSchedule = [{ id: 'w1', episode: 3, type: 'bb-white-locust' }];
      for (let i = 0; i < 30; i++) {
        const ep = simulateBBEpisode();
        if (!ep) break;
        last = ep;
        if (gs.bb?.over) break;
      }
    });
    expect(last).toBeTruthy();
    // Nobody is in both lists, and everybody is in exactly one.
    const both = (gs.activePlayers || []).filter(n => (gs.eliminated || []).includes(n));
    expect(both, 'somebody is alive and eliminated at once').toEqual([]);
    const all = new Set([...(gs.activePlayers || []), ...(gs.eliminated || [])]);
    expect(all.size).toBe(NAMES.length);
  });
});

// A registered event that never fires is the same as an unwritten one, and it
// is the specific way this codebase has lost work before.
describe('the week after the resort', () => {
  it('gives the house something to say about it', () => {
    const seen = new Set();
    for (const seed of [313, 414, 515, 616]) {
      house();
      playToResort(seed, 3);
      for (const h of gs.bb?.house?.eventHistory || []) {
        const id = h?.id || h?.eventId || h;
        if (typeof id === 'string' && id.startsWith('locust-')) seen.add(id);
      }
    }
    // All four, across four seeds: the caller who was wrong about you, the one
    // who nearly went home, a departure with nobody to blame, and a reign that
    // was won in a corridor.
    expect([...seen].sort()).toEqual([
      'locust-asterisk-reign',
      'locust-called-out-survived',
      'locust-closest-call',
      'locust-no-vote-to-argue-with',
    ]);
  });
});

describe('it reaches the reader', () => {
  it('is in both transcripts', () => {
    const week = playToResort();
    const ep = gs.episodeHistory[week.num - 1] || gs.episodeHistory[gs.episodeHistory.length - 1];
    const backlog = generateSummaryText(ep);
    expect(backlog).toMatch(/WHITE LOCUST RESORT/);
    expect(backlog).toMatch(/calls out/);
    expect(backlog).toMatch(/does not check out/);
    const runText = gs.bb.transcript || '';
    if (runText) expect(runText).toMatch(/WHITE LOCUST RESORT/);
  });
});

// The user, 2026-10-29: "make sure the white locust evicted go to the jury and isnt forgotten that tend to happen in
// double eviction", "make sure their placement is right too", "make sure that special elimination export its not a
// normal eviction", and "nina goodbye is damn too short ... no reactions no goodbye ... people dont even talk about her
// after".
import { seatedJurors, weekExits } from '../js/bb/jury.js';
import { extractBigBrotherSeasonTemplate } from '../js/stats-export.js';

describe('the one who does not check out is a real exit', () => {
  it('sits on the jury when the chain runs in jury weeks, before the week\'s own evictee', () => {
    const week = playToResort(313, 6);
    expect(week, 'no resort week').toBeTruthy();
    const exits = weekExits(week);
    expect(exits.map(x => x.how)).toEqual(['white-locust', 'eviction'].slice(0, exits.length));
    const jury = seatedJurors();
    if (jury.includes(week.evicted)) {
      expect(jury, 'the resort loser was dropped from a jury the week\'s evictee sits on').toContain(week.resortEvicted);
      expect(jury.indexOf(week.resortEvicted)).toBeLessThan(jury.indexOf(week.evicted));
    }
  });

  it('gets a placement one below the week\'s evictee, and the export says how', () => {
    const week = playToResort(313, 6);
    const doc = extractBigBrotherSeasonTemplate(gs.bb.weeks, [...gs.activePlayers], { jurySize: 7 });
    const p = n => doc.placements.find(x => x.name === n);
    expect(p(week.resortEvicted), 'the resort loser has no placement').toBeTruthy();
    if (week.evicted) expect(p(week.resortEvicted).placement).toBe(p(week.evicted).placement + 1);
    expect(p(week.resortEvicted).specialExit?.how).toBe('white-locust');
    const w = doc.weeks.find(x => (x.specialExits || []).some(s => s.name === week.resortEvicted));
    expect(w, 'the week does not record the special elimination').toBeTruthy();
    const places = doc.placements.map(x => x.placement).sort((a, b) => a - b);
    expect(new Set(places).size, 'two people share a place').toBe(places.length);
  });

  it('reacts and says goodbye on the screen, and the house grieves them after', () => {
    const week = playToResort(313, 4);
    const act = chainAct(week);
    expect((act.exitLines || []).length, 'the chain ended on a fact and a crown').toBeGreaterThanOrEqual(3);
    expect(act.exitLines.some(l => l.k === 'resort')).toBe(true);
    expect(act.exitLines.some(l => (l.by === week.resortEvicted) || String(l.t).includes(week.resortEvicted))).toBe(true);
  });
});

import { getEpisodeEliminations } from '../js/run-ui.js';
describe('the resort week, counted everywhere', () => {
  it('counts the chain\'s crown as an HOH win, as the week record does', () => {
    const week = playToResort(313, 4);
    const hoh = week.hoh;
    const byWeeks = gs.bb.weeks.filter(w => w.hoh === hoh).length;
    expect(gs.bb.stats[hoh].hohWins, 'the White Locust HOH has no HOH win').toBe(byWeeks);
  });
  it('puts both names on the season tape, the resort loser first', () => {
    const week = playToResort(313, 4);
    const row = gs.episodeHistory.find(r => (r.acts || []).some(a => a.type === 'white-locust'));
    const names = getEpisodeEliminations(row);
    expect(names[0]).toBe(week.resortEvicted);
    if (week.evicted) expect(names).toContain(week.evicted);
  });
});

// The user, 2026-10-29, on a season saved before the fix: "i dont see nina final interview exit nina wasnt in the jury
// at ep11 after the fix would she be in it at ep12?" and "i mean also on-air kristal talk exit interview". The week
// after catches up what the old save never recorded: the interview (which On Air reads) and the jury-house door.
describe('a season saved before the resort loser counted', () => {
  it('records their interview and walks them into the jury house the next week', () => {
    const week = playToResort(313, 6);
    expect(week, 'no resort week').toBeTruthy();
    const gone = week.resortEvicted;
    expect(seatedJurors(), 'the resort loser is not a juror in this seed').toContain(gone);
    // what the old save looked like: no interview, and a jury house without them
    gs.exitInterviews = (gs.exitInterviews || []).filter(r => r.guest !== gone);
    const jh = (week.acts || []).find(a => a.type === 'jury-house');
    expect(jh, 'the resort week had no jury house').toBeTruthy();
    jh.residents = jh.residents.filter(n => n !== gone);
    withSeededRandom(314, () => { simulateBBEpisode(); });
    const rec = gs.exitInterviews.find(r => r.guest === gone);
    expect(rec, 'still no interview a week later').toBeTruthy();
    expect(rec.week).toBe(week.num);
    expect(rec.how).toBe('lost-challenge');
    const next = gs.bb.weeks.find(w => w.num === week.num + 1);
    const door = (next.acts || []).find(a => a.type === 'jury-house');
    const beats = (door?.acts || []).flatMap(a => a.beats || []);
    expect(beats.some(b => b.tag === 'ENTRANCE' && (b.players || []).includes(gone)),
      'the jury house never shows them arriving').toBe(true);
    expect(door.residents).toContain(gone);
  });
});

import { catchUpBBExits } from '../js/bb/exit-interview.js';
import { extractLiveSeasonSnapshot } from '../js/stats-export.js';
describe('publishing a season saved before the fix, without another week', () => {
  it('sends the resort loser\'s interview and draws them out of the house on On Air', () => {
    const week = playToResort(313, 6);
    const gone = week.resortEvicted;
    gs.exitInterviews = (gs.exitInterviews || []).filter(r => r.guest !== gone);
    catchUpBBExits();
    catchUpBBExits();
    const recs = gs.exitInterviews.filter(r => r.guest === gone);
    expect(recs.length, 'interviewed twice, or not at all').toBe(1);
    expect(recs[0].week).toBe(week.num);
    expect(recs[0].how).toBe('lost-challenge');
    const other = gs.exitInterviews.find(r => r.guest === week.evicted && r.week === week.num);
    if (other) expect(recs[0].placement).toBe(other.placement + 1);
    const snap = extractLiveSeasonSnapshot();
    const p = snap.players.find(x => x.name === gone);
    expect(p.status, 'still drawn in the house').not.toBe('in');
    if (seatedJurors().includes(gone)) expect(p.status).toBe('jury');
  });
});

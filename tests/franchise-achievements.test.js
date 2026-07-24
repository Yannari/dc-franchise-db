// UX Plan Item 11 — Achievements + Season Objectives (descriptive-only) detection.
import { describe, it, expect } from 'vitest';
import {
  setFranchiseLedger, activeSeasons, setSeasonIncluded, setFranchiseLocked,
  detectSeasonAchievements, backfillAchievements, evaluateObjectives,
  getSeasonAchievements, getSeasonObjectives, recordSeasonToLedger,
  ACHIEVEMENT_LABELS, SEASON_OBJECTIVES
} from '../js/franchise-meta.js';
import { setGs, setPlayers, setSeasonConfig, defaultConfig } from '../js/core.js';

// Minimal record factory (all relationship arrays present, like a live-derived rec).
function _rec(o = {}) {
  return { placement: 0, winner: false, finalist: false, episodesLasted: 0, blindsided: false,
    blindsidedBy: [], blindsidesAuthored: 0, idolsFound: 0, idolsPlayed: 0, idoledOut: false,
    betrayed: [], betrayedBy: [], allies: [], showmances: [], rivals: [], chalWins: 0, schemesCaught: 0, ...o };
}
const ids = arr => arr.map(a => a.id);
const forPlayer = (arr, id, name) => arr.find(a => a.id === id && a.player === name);

// ══════════════════════════════════════════════════════════════════════════
// LIVE / STATE-ONLY DETECTORS (need a fabricated gs)
// ══════════════════════════════════════════════════════════════════════════
describe('detectSeasonAchievements — live/state detectors', () => {
  function stateWith(gs) { return { gs, players: [] }; }

  it('perfect-game: winner with 0 votes against + ≥3 immunities (positive)', () => {
    setFranchiseLedger({ seasons: {} });
    const gs = {
      finaleResult: { winner: 'Ace', finalists: ['Ace', 'Bo'], votes: { Ace: 5, Bo: 2 } },
      episodeHistory: [
        { num: 1, eliminated: 'Zee', immunityWinner: 'Ace', votingLog: [{ voter: 'Ace', voted: 'Zee' }, { voter: 'Bo', voted: 'Zee' }] },
        { num: 2, eliminated: 'Yan', immunityWinner: 'Ace', votingLog: [{ voter: 'Ace', voted: 'Yan' }, { voter: 'Bo', voted: 'Yan' }] },
        { num: 3, eliminated: 'Xi', immunityWinner: 'Ace', votingLog: [{ voter: 'Ace', voted: 'Xi' }, { voter: 'Bo', voted: 'Xi' }] }
      ]
    };
    const got = detectSeasonAchievements(1, stateWith(gs));
    expect(forPlayer(got, 'perfect-game', 'Ace')).toBeTruthy();
  });

  it('perfect-game: negative when winner took a vote OR under 3 immunities', () => {
    setFranchiseLedger({ seasons: {} });
    const votedOnce = {
      finaleResult: { winner: 'Ace', finalists: ['Ace', 'Bo'], votes: { Ace: 5 } },
      episodeHistory: [
        { num: 1, eliminated: 'Zee', immunityWinner: 'Ace', votingLog: [{ voter: 'Zee', voted: 'Ace' }] },
        { num: 2, eliminated: 'Yan', immunityWinner: 'Ace', votingLog: [] },
        { num: 3, eliminated: 'Xi', immunityWinner: 'Ace', votingLog: [] }
      ]
    };
    expect(forPlayer(detectSeasonAchievements(1, stateWith(votedOnce)), 'perfect-game', 'Ace')).toBeFalsy();
    const fewImm = {
      finaleResult: { winner: 'Ace', finalists: ['Ace', 'Bo'], votes: { Ace: 5 } },
      episodeHistory: [
        { num: 1, eliminated: 'Zee', immunityWinner: 'Ace', votingLog: [{ voter: 'Bo', voted: 'Zee' }] },
        { num: 2, eliminated: 'Yan', immunityWinner: 'Bo', votingLog: [{ voter: 'Bo', voted: 'Yan' }] }
      ]
    };
    expect(forPlayer(detectSeasonAchievements(1, stateWith(fewImm)), 'perfect-game', 'Ace')).toBeFalsy();
  });

  it('idol-nullification: real idol negates ≥3 votes and sends someone else home', () => {
    setFranchiseLedger({ seasons: {} });
    const gs = { finaleResult: {}, episodeHistory: [
      { num: 4, eliminated: 'Vic', votingLog: [], idolPlays: [{ player: 'Sly', votesNegated: 4 }] },
      // extraVote is NOT an idol → no achievement even with negated votes
      { num: 5, eliminated: 'Wen', votingLog: [], idolPlays: [{ player: 'Ned', type: 'extraVote', votesNegated: 3 }] },
      // fake idol → excluded
      { num: 6, eliminated: 'Uma', votingLog: [], idolPlays: [{ player: 'Fox', fake: true, votesNegated: 5 }] }
    ] };
    const got = detectSeasonAchievements(1, stateWith(gs));
    expect(forPlayer(got, 'idol-nullification', 'Sly')).toBeTruthy();
    expect(forPlayer(got, 'idol-nullification', 'Ned')).toBeFalsy();
    expect(forPlayer(got, 'idol-nullification', 'Fox')).toBeFalsy();
  });

  it('rock-survivor: credits only the at-risk tied set (never mere voters) + tiebreaker winners', () => {
    setFranchiseLedger({ seasons: {} });
    const gs = { finaleResult: {}, episodeHistory: [
      // Rocky (a drawer) got the purple rock; Al & Bea were the deadlocked at-risk set.
      // Cal cast a vote but was NOT in the tie → NOT a rock survivor.
      { num: 3, eliminated: 'Rocky', isRockDraw: true, tiedPlayers: ['Al', 'Bea'],
        votingLog: [{ voter: 'Al', voted: 'Bea' }, { voter: 'Bea', voted: 'Al' }, { voter: 'Cal', voted: 'Al' }, { voter: 'Rocky', voted: 'Bea' }] },
      { num: 4, eliminated: 'Dot', tiebreakerResult: { participants: ['Dot', 'Eve'], loser: 'Dot', winner: 'Eve', challengeLabel: 'Fire-Making' } },
      // Fallback rock draw where the eliminated IS one of the tied set → minus-eliminated.
      { num: 5, eliminated: 'Gil', isRockDraw: true, tiedPlayers: ['Gil', 'Hana'], votingLog: [] }
    ] };
    const got = detectSeasonAchievements(1, stateWith(gs));
    expect(forPlayer(got, 'rock-survivor', 'Al')).toBeTruthy();   // tied, survived
    expect(forPlayer(got, 'rock-survivor', 'Bea')).toBeTruthy();  // tied, survived
    expect(forPlayer(got, 'rock-survivor', 'Cal')).toBeFalsy();   // mere voter — NOT credited
    expect(forPlayer(got, 'rock-survivor', 'Rocky')).toBeFalsy(); // eliminated
    expect(forPlayer(got, 'rock-survivor', 'Eve')).toBeTruthy();  // won the tiebreaker
    expect(forPlayer(got, 'rock-survivor', 'Dot')).toBeFalsy();   // lost the tiebreaker
    expect(forPlayer(got, 'rock-survivor', 'Hana')).toBeTruthy(); // tied, survived the fallback draw
    expect(forPlayer(got, 'rock-survivor', 'Gil')).toBeFalsy();   // tied but eliminated by the draw
  });

  it('zero-vote-finalist: a goated finalist gets no jury votes', () => {
    setFranchiseLedger({ seasons: {} });
    const gs = { episodeHistory: [], finaleResult: { winner: 'Win', finalists: ['Win', 'Goat'], votes: { Win: 7, Goat: 0 } } };
    const got = detectSeasonAchievements(1, stateWith(gs));
    expect(forPlayer(got, 'zero-vote-finalist', 'Goat')).toBeTruthy();
    expect(forPlayer(got, 'zero-vote-finalist', 'Win')).toBeFalsy();
    // negative: no jury votes recorded at all (fan-vote finale) → skip
    const noJury = { episodeHistory: [], finaleResult: { winner: 'Win', finalists: ['Win', 'Goat'], votes: null } };
    expect(detectSeasonAchievements(1, stateWith(noJury)).some(a => a.id === 'zero-vote-finalist')).toBe(false);
  });

  it('record-only call (no gs) emits none of the live-only achievements', () => {
    setFranchiseLedger({ seasons: { '1': { seasonName: 'S1', players: { A: _rec({ placement: 1, winner: true }) } } } });
    const got = detectSeasonAchievements(1, null);
    for (const a of got) expect(['perfect-game', 'idol-nullification', 'rock-survivor', 'zero-vote-finalist']).not.toContain(a.id);
  });
});

// ══════════════════════════════════════════════════════════════════════════
// RECORD + FRANCHISE-HISTORY DETECTORS
// ══════════════════════════════════════════════════════════════════════════
describe('detectSeasonAchievements — record detectors', () => {
  it('immunity-streak: ≥4 immunity wins (positive) / 3 wins (negative)', () => {
    setFranchiseLedger({ seasons: { '2': { seasonName: 'S2', castSize: 12, players: {
      Beast: _rec({ placement: 1, winner: true, chalWins: 5 }),
      Mid: _rec({ placement: 4, chalWins: 3 })
    } } } });
    const got = detectSeasonAchievements(2, null);
    expect(forPlayer(got, 'immunity-streak', 'Beast')).toBeTruthy();
    expect(forPlayer(got, 'immunity-streak', 'Mid')).toBeFalsy();
  });

  it('fallen-angel: prior-season champion who lands bottom-half now', () => {
    setFranchiseLedger({ seasons: {
      '1': { seasonName: 'S1', castSize: 12, players: { Star: _rec({ placement: 1, winner: true, finalist: true }) } },
      '2': { seasonName: 'S2', castSize: 12, players: {
        Star: _rec({ placement: 10 }),  // bottom-half of 12 (>6)
        Solid: _rec({ placement: 5 })
      } }
    } });
    const got = detectSeasonAchievements(2, null);
    expect(forPlayer(got, 'fallen-angel', 'Star')).toBeTruthy();
    expect(forPlayer(got, 'fallen-angel', 'Solid')).toBeFalsy(); // no prior peak
  });

  it('fallen-angel: negative when prior peak player stays top-half', () => {
    setFranchiseLedger({ seasons: {
      '1': { seasonName: 'S1', castSize: 12, players: { Star: _rec({ placement: 2, finalist: true }) } },
      '2': { seasonName: 'S2', castSize: 12, players: { Star: _rec({ placement: 4 }) } } // top-half
    } });
    expect(detectSeasonAchievements(2, null).some(a => a.id === 'fallen-angel')).toBe(false);
  });

  it('revenge-arc: betrayal payback across seasons (crown jewel)', () => {
    // S1: Bram betrays Alia. S2: Alia takes out Bram → revenge-arc for Alia.
    setFranchiseLedger({ seasons: {
      '1': { seasonName: 'S1', castSize: 12, players: {
        Alia: _rec({ placement: 8, betrayedBy: ['Bram'] }),
        Bram: _rec({ placement: 1, winner: true, betrayed: ['Alia'] })
      } },
      '2': { seasonName: 'S2', castSize: 12, players: {
        Alia: _rec({ placement: 1, winner: true, betrayed: ['Bram'] }),
        Bram: _rec({ placement: 6, betrayedBy: ['Alia'] })
      } }
    } });
    const got = detectSeasonAchievements(2, null);
    const ra = forPlayer(got, 'revenge-arc', 'Alia');
    expect(ra).toBeTruthy();
    expect(ra.detail).toMatch(/Bram/);
    expect(ra.detail).toMatch(/Season 1/);
    // Bram gets no revenge-arc — he did not pay anyone back this season.
    expect(forPlayer(got, 'revenge-arc', 'Bram')).toBeFalsy();
  });

  it('revenge-arc: blindside payback variant', () => {
    // S1: Cyd blindsided by Dax. S2: Cyd authors the blindside that ends Dax.
    setFranchiseLedger({ seasons: {
      '1': { seasonName: 'S1', castSize: 12, players: {
        Cyd: _rec({ placement: 7, blindsided: true, blindsidedBy: ['Dax'] }),
        Dax: _rec({ placement: 2, finalist: true })
      } },
      '2': { seasonName: 'S2', castSize: 12, players: {
        Cyd: _rec({ placement: 1, winner: true }),
        Dax: _rec({ placement: 5, blindsided: true, blindsidedBy: ['Cyd'] })
      } }
    } });
    expect(forPlayer(detectSeasonAchievements(2, null), 'revenge-arc', 'Cyd')).toBeTruthy();
  });

  it('revenge-arc: negative when the prior wrong runs the other way (no fabricated grudge)', () => {
    // S1: Alia betrays Bram (not the reverse). S2: Alia takes out Bram again — that is
    // not REVENGE (Bram never wronged Alia), so no revenge-arc.
    setFranchiseLedger({ seasons: {
      '1': { seasonName: 'S1', players: { Alia: _rec({ betrayed: ['Bram'] }), Bram: _rec({ betrayedBy: ['Alia'] }) } },
      '2': { seasonName: 'S2', players: { Alia: _rec({ placement: 1, winner: true, betrayed: ['Bram'] }), Bram: _rec({ placement: 6, betrayedBy: ['Alia'] }) } }
    } });
    expect(detectSeasonAchievements(2, null).some(a => a.id === 'revenge-arc')).toBe(false);
  });

  it('revenge-arc: an excluded prior season seeds no grudge', () => {
    setFranchiseLedger({ seasons: {
      '1': { seasonName: 'S1', players: { Alia: _rec({ betrayedBy: ['Bram'] }), Bram: _rec({ betrayed: ['Alia'] }) } },
      '2': { seasonName: 'S2', players: { Alia: _rec({ placement: 1, winner: true, betrayed: ['Bram'] }), Bram: _rec({ placement: 6, betrayedBy: ['Alia'] }) } }
    } });
    expect(forPlayer(detectSeasonAchievements(2, null), 'revenge-arc', 'Alia')).toBeTruthy();
    setSeasonIncluded(1, false);
    expect(detectSeasonAchievements(2, null).some(a => a.id === 'revenge-arc')).toBe(false);
  });

  it('untouchable: champion never blindsided over a 3+ season career, attached at the latest season', () => {
    setFranchiseLedger({ seasons: {
      '1': { seasonName: 'S1', players: { Leg: _rec({ placement: 1, winner: true }) } },
      '2': { seasonName: 'S2', players: { Leg: _rec({ placement: 3, finalist: true }) } },
      '3': { seasonName: 'S3', players: { Leg: _rec({ placement: 2, finalist: true }) } }
    } });
    // Not attached to earlier seasons (career not yet 3 there).
    expect(detectSeasonAchievements(2, null).some(a => a.id === 'untouchable')).toBe(false);
    expect(forPlayer(detectSeasonAchievements(3, null), 'untouchable', 'Leg')).toBeTruthy();
  });

  it('untouchable: negative once blindsided anywhere in the career', () => {
    setFranchiseLedger({ seasons: {
      '1': { seasonName: 'S1', players: { Leg: _rec({ placement: 1, winner: true }) } },
      '2': { seasonName: 'S2', players: { Leg: _rec({ placement: 6, blindsided: true, blindsidedBy: ['X'] }) } },
      '3': { seasonName: 'S3', players: { Leg: _rec({ placement: 2, finalist: true }) } }
    } });
    expect(detectSeasonAchievements(3, null).some(a => a.id === 'untouchable')).toBe(false);
  });

  it('every shipped achievement id has a label', () => {
    for (const id of ['perfect-game', 'idol-nullification', 'rock-survivor', 'zero-vote-finalist',
      'fallen-angel', 'revenge-arc', 'immunity-streak', 'untouchable']) {
      expect(ACHIEVEMENT_LABELS[id]).toBeTruthy();
    }
  });
});

// ══════════════════════════════════════════════════════════════════════════
// BACKFILL + PERSISTENCE
// ══════════════════════════════════════════════════════════════════════════
describe('backfillAchievements', () => {
  it('persists record-detectable achievements and is idempotent', () => {
    setFranchiseLedger({ seasons: {
      '1': { seasonName: 'S1', castSize: 12, players: { Star: _rec({ placement: 1, winner: true, chalWins: 5 }) } },
      '2': { seasonName: 'S2', castSize: 12, players: { Star: _rec({ placement: 10 }) } }
    } });
    expect(backfillAchievements()).toBe(2);
    expect(getSeasonAchievements(1).some(a => a.id === 'immunity-streak' && a.player === 'Star')).toBe(true);
    expect(getSeasonAchievements(2).some(a => a.id === 'fallen-angel' && a.player === 'Star')).toBe(true);
    const before = JSON.stringify(activeSeasons()['1'].achievements);
    backfillAchievements(); // second run
    expect(JSON.stringify(activeSeasons()['1'].achievements)).toBe(before); // idempotent
  });

  it('preserves live-only achievements already stored on the record', () => {
    setFranchiseLedger({ seasons: { '1': { seasonName: 'S1', castSize: 12, players: { Star: _rec({ placement: 1, winner: true, chalWins: 5 }) },
      achievements: [{ id: 'perfect-game', label: 'Perfect Game', player: 'Star', seasonNum: 1, detail: 'x' }] } } });
    backfillAchievements();
    const ach = getSeasonAchievements(1);
    expect(ach.some(a => a.id === 'perfect-game')).toBe(true);       // kept
    expect(ach.some(a => a.id === 'immunity-streak')).toBe(true);    // recomputed
  });

  it('a canon-locked franchise is unaffected by backfill', () => {
    setFranchiseLedger({ seasons: { '1': { seasonName: 'S1', players: { Star: _rec({ placement: 1, winner: true, chalWins: 5 }) } } } });
    setFranchiseLocked('main', true);
    expect(backfillAchievements()).toBe(0);
    expect(getSeasonAchievements(1)).toEqual([]);
    setFranchiseLocked('main', false);
  });
});

describe('recordSeasonToLedger stores achievements + objectives', () => {
  function fabricate() {
    const _stats = { physical: 5, endurance: 5, mental: 5, social: 5, strategic: 5, loyalty: 5, boldness: 5, intuition: 5, temperament: 5 };
    setPlayers([{ name: 'Ava', isReturnee: true, stats: { ..._stats } }, { name: 'Ben', isReturnee: false, stats: { ..._stats } },
      { name: 'Cy', isReturnee: false, stats: { ..._stats } }, { name: 'Dee', isReturnee: false, stats: { ..._stats } }]);
    setSeasonConfig({ ...defaultConfig(), seasonNumber: 50, name: 'Ach Season', franchiseMeta: true,
      seasonObjectives: [{ id: 'returnee-wins' }, { id: 'protect-favorite', target: 'Ava' }] });
    setGs({ phase: 'complete', seasonNumber: 50,
      finaleResult: { winner: 'Ava', finalists: ['Ava', 'Ben'], votes: { Ava: 3, Ben: 0 } },
      episodeHistory: [
        { num: 1, eliminated: 'Dee', immunityWinner: 'Ava', votingLog: [{ voter: 'Ava', voted: 'Dee' }, { voter: 'Ben', voted: 'Dee' }, { voter: 'Cy', voted: 'Dee' }], defections: [], idolPlays: [] },
        { num: 2, eliminated: 'Cy', immunityWinner: 'Ava', votingLog: [{ voter: 'Ava', voted: 'Cy' }, { voter: 'Ben', voted: 'Cy' }], defections: [], idolPlays: [] }
      ],
      bonds: {}, advantages: [], namedAlliances: [], showmances: [], schemesCaught: {} });
  }
  it('attaches rec.achievements + rec.objectives at record time', () => {
    setFranchiseLedger({ seasons: {} });
    fabricate();
    expect(recordSeasonToLedger({})).toBe(true);
    const rec = activeSeasons()['50'];
    expect(Array.isArray(rec.achievements)).toBe(true);
    // Ben was goated to a 0-vote finale loss → zero-vote-finalist
    expect(rec.achievements.some(a => a.id === 'zero-vote-finalist' && a.player === 'Ben')).toBe(true);
    // Objectives evaluated: returnee (Ava) won; favorite Ava reached the finale
    const objIds = rec.objectives.map(o => o.id);
    expect(objIds).toEqual(['returnee-wins', 'protect-favorite']);
    expect(rec.objectives.find(o => o.id === 'returnee-wins').met).toBe(true);
    expect(rec.objectives.find(o => o.id === 'protect-favorite')).toMatchObject({ target: 'Ava', met: true });
    // accessors surface the stored data
    expect(getSeasonObjectives(50).length).toBe(2);
  });

  it('retracts a now-false untouchable medal when the player is later blindsided', () => {
    // Career: Leg wins S1, finalist S2 & S3 (never blindsided) → untouchable at S3.
    setFranchiseLedger({ seasons: {
      '1': { seasonName: 'S1', castSize: 12, players: { Leg: _rec({ placement: 1, winner: true, finalist: true }) } },
      '2': { seasonName: 'S2', castSize: 12, players: { Leg: _rec({ placement: 3, finalist: true }) } },
      '3': { seasonName: 'S3', castSize: 12, players: { Leg: _rec({ placement: 2, finalist: true }) } }
    } });
    backfillAchievements();
    expect(getSeasonAchievements(3).some(a => a.id === 'untouchable' && a.player === 'Leg')).toBe(true);

    // Now Leg plays S7 and gets blindsided — recording it must retract the S3 medal.
    setPlayers([{ name: 'Leg' }, { name: 'Win' }, { name: 'X' }, { name: 'Y' }]);
    setSeasonConfig({ ...defaultConfig(), seasonNumber: 7, franchiseMeta: true });
    setGs({ phase: 'complete', seasonNumber: 7,
      finaleResult: { winner: 'Win', finalists: ['Win', 'X'] },
      episodeHistory: [
        { num: 1, eliminated: 'Leg', immunityWinner: 'Win',
          votingLog: [{ voter: 'Win', voted: 'Leg' }, { voter: 'X', voted: 'Leg' }, { voter: 'Y', voted: 'Leg' }, { voter: 'Leg', voted: 'Win' }],
          defections: [{ player: 'X' }, { player: 'Y' }], idolPlays: [] },
        { num: 2, eliminated: 'Y', immunityWinner: 'Win', votingLog: [{ voter: 'Win', voted: 'Y' }, { voter: 'X', voted: 'Y' }], defections: [], idolPlays: [] }
      ],
      bonds: {}, advantages: [], namedAlliances: [], showmances: [], schemesCaught: {} });
    expect(recordSeasonToLedger({})).toBe(true);
    expect(activeSeasons()['7'].players['Leg'].blindsided).toBe(true);
    // The stale S3 untouchable is gone; no untouchable persists for Leg anywhere.
    expect(getSeasonAchievements(3).some(a => a.id === 'untouchable')).toBe(false);
    for (const num of ['1', '2', '3', '7']) {
      expect((getSeasonAchievements(Number(num)) || []).some(a => a.id === 'untouchable' && a.player === 'Leg')).toBe(false);
    }
  });
});

// ══════════════════════════════════════════════════════════════════════════
// SEASON OBJECTIVES — each definition met / unmet
// ══════════════════════════════════════════════════════════════════════════
describe('evaluateObjectives', () => {
  const cfg = objs => ({ seasonObjectives: objs });

  it('returns [] when no objectives are configured', () => {
    setFranchiseLedger({ seasons: { '1': { seasonName: 'S1', players: { A: _rec({ placement: 1, winner: true }) } } } });
    expect(evaluateObjectives({}, 1, null)).toEqual([]);
  });

  it('protect-favorite: met at merge, unmet pre-merge, target-plumbing', () => {
    setFranchiseLedger({ seasons: { '1': { seasonName: 'S1', castSize: 12, players: {
      Fav: _rec({ placement: 5 }), Early: _rec({ placement: 11 }) } } } });
    const merged = evaluateObjectives(cfg([{ id: 'protect-favorite', target: 'Fav' }]), 1, null)[0];
    expect(merged).toMatchObject({ id: 'protect-favorite', target: 'Fav', met: true });
    const pre = evaluateObjectives(cfg([{ id: 'protect-favorite', target: 'Early' }]), 1, null)[0];
    expect(pre.met).toBe(false);
    const missing = evaluateObjectives(cfg([{ id: 'protect-favorite', target: 'Ghost' }]), 1, null)[0];
    expect(missing.met).toBe(false);
    expect(missing.detail).toMatch(/not in this season/);
  });

  it('returnee-wins: met via live isReturnee and via record fallback', () => {
    setFranchiseLedger({ seasons: {
      '1': { seasonName: 'S1', players: { Vet: _rec({ placement: 4 }) } },  // Vet appeared earlier
      '2': { seasonName: 'S2', players: { Vet: _rec({ placement: 1, winner: true }) } }
    } });
    // record fallback (no state.players) — Vet appeared in S1 < S2
    expect(evaluateObjectives(cfg([{ id: 'returnee-wins' }]), 2, null)[0].met).toBe(true);
    // live flag path
    setFranchiseLedger({ seasons: { '9': { seasonName: 'S9', players: { New: _rec({ placement: 1, winner: true }) } } } });
    const st = { players: [{ name: 'New', isReturnee: false }] };
    expect(evaluateObjectives(cfg([{ id: 'returnee-wins' }]), 9, st)[0].met).toBe(false);
  });

  it('chaos-season: met with enough blindsides + idols', () => {
    setFranchiseLedger({ seasons: { '1': { seasonName: 'S1', players: {
      A: _rec({ blindsided: true, idolsPlayed: 1 }), B: _rec({ blindsided: true, idolsPlayed: 1 }),
      C: _rec({ blindsided: true }), D: _rec({ blindsided: true }) } } } });
    expect(evaluateObjectives(cfg([{ id: 'chaos-season' }]), 1, null)[0].met).toBe(true);
    setFranchiseLedger({ seasons: { '1': { seasonName: 'S1', players: {
      A: _rec({ blindsided: true, idolsPlayed: 1 }), B: _rec({ blindsided: true }) } } } });
    expect(evaluateObjectives(cfg([{ id: 'chaos-season' }]), 1, null)[0].met).toBe(false); // too few
  });

  it('strong-final-three: met only when all F3 earned it', () => {
    setFranchiseLedger({ seasons: { '1': { seasonName: 'S1', players: {
      A: _rec({ placement: 1, winner: true, finalist: true, chalWins: 3 }),
      B: _rec({ placement: 2, finalist: true, blindsidesAuthored: 2 }),
      C: _rec({ placement: 3, finalist: true, chalWins: 2 }) } } } });
    expect(evaluateObjectives(cfg([{ id: 'strong-final-three' }]), 1, null)[0].met).toBe(true);
    setFranchiseLedger({ seasons: { '1': { seasonName: 'S1', players: {
      A: _rec({ placement: 1, winner: true, finalist: true, chalWins: 3 }),
      B: _rec({ placement: 2, finalist: true, blindsidesAuthored: 2 }),
      C: _rec({ placement: 3, finalist: true }) } } } }); // C coasted
    expect(evaluateObjectives(cfg([{ id: 'strong-final-three' }]), 1, null)[0].met).toBe(false);
  });

  it('underdog-story: met when a low-impact player reaches FTC', () => {
    setFranchiseLedger({ seasons: { '1': { seasonName: 'S1', players: {
      Under: _rec({ placement: 3, finalist: true, chalWins: 0, blindsidesAuthored: 0 }),
      A: _rec({ placement: 1, winner: true, finalist: true, chalWins: 2 }),
      B: _rec({ placement: 2, finalist: true, blindsidesAuthored: 1 }) } } } });
    expect(evaluateObjectives(cfg([{ id: 'underdog-story' }]), 1, null)[0].met).toBe(true);
    setFranchiseLedger({ seasons: { '1': { seasonName: 'S1', players: {
      A: _rec({ placement: 1, winner: true, finalist: true, chalWins: 2 }),
      B: _rec({ placement: 2, finalist: true, blindsidesAuthored: 1 }),
      C: _rec({ placement: 3, finalist: true, chalWins: 3 }) } } } });
    expect(evaluateObjectives(cfg([{ id: 'underdog-story' }]), 1, null)[0].met).toBe(false);
  });

  it('SEASON_OBJECTIVES catalog is well-formed', () => {
    expect(SEASON_OBJECTIVES.map(o => o.id)).toEqual(
      ['protect-favorite', 'returnee-wins', 'chaos-season', 'strong-final-three', 'underdog-story']);
    expect(SEASON_OBJECTIVES.find(o => o.id === 'protect-favorite').needsTarget).toBe(true);
  });
});

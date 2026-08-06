// The door, the lodge, and the vote at the end of them.
//
// Three systems that only mean anything together: what somebody shouts on the
// way out, what the jury house does with it, and whether any of that reaches
// the ballot. The properties worth pinning are the ones that were impossible
// before — that one sentence can land four different ways around a sofa, that
// being WRONG still costs somebody, and that a hardened juror is hard to move
// without anything in the code saying "locked".
import { beforeEach, describe, expect, it } from 'vitest';
import { gs, seasonConfig } from '../js/core.js';
import { addBond, getBond } from '../js/bonds.js';
import { simulateBBSeason } from '../js/bb/week.js';
import { checkBBLastWords, lastWordsLines } from '../js/bb/last-words.js';
import { generateBBJuryHouse, juryHouseLines } from '../js/bb/jury-house.js';
import {
  seedJurorReads, moveRead, readOf, sentimentAdjustment, stanceOf,
} from '../js/bb/jury-sentiment.js';
import { simulateJuryVote } from '../js/finale.js';
import { seedGame } from './helpers/setup.js';

const STAT_KEYS = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];
const stats = over => Object.fromEntries(STAT_KEYS.map(k => [k, over?.[k] ?? 5]));

const CAST = [
  ['A', 'mastermind'], ['B', 'social-butterfly'], ['C', 'challenge-beast'],
  ['D', 'schemer'], ['E', 'hero'], ['F', 'floater'], ['G', 'villain'],
  ['H', 'loyal-soldier'], ['I', 'underdog'], ['J', 'goat'], ['K', 'hothead'],
  ['L', 'perceptive-player'], ['M', 'wildcard'], ['N', 'chaos-agent'],
].map(([name, archetype], i) => ({
  name, archetype, gender: i % 2 ? 'f' : 'm', sexuality: 'straight',
  stats: stats({ boldness: 9, temperament: 2, social: 6, intuition: 5, strategic: 6, loyalty: 5 }),
}));

const seededRng = (seed = 5) => () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);

function reset(cast = CAST) {
  seedGame(cast, { episode: 0, eliminated: [], namedAlliances: [] });
  gs.bb = { outgoingHoh: null, weeks: [], stats: {}, house: null };
  gs.popularity = {}; gs.showmances = []; gs.romanticSparks = [];
  seasonConfig.romance = 'enabled';
  seasonConfig.finaleSize = 3;
  seasonConfig.jurySize = 7;
}

/** A week that ends with `evicted` going out on a lopsided vote. */
function weekWith(evicted, { voters = [], num = 6, house = null } = {}) {
  const roster = house || [...(gs.activePlayers || []), evicted];
  const ballots = voters.map(v => ({ voter: v, evict: evicted }));
  const week = {
    num, evicted, ballots, votes: { [evicted]: ballots.length },
    houseAtStart: roster, acts: [{ type: 'eviction', evicted, ballots }],
  };
  gs.activePlayers = roster.filter(n => n !== evicted);
  return week;
}

describe('last words at the door', () => {
  beforeEach(() => reset());

  it('lands differently on different people in the same room', () => {
    const evicted = 'N';
    const voters = ['A', 'B', 'C', 'D'];
    // One listener is close to the person shouting; another is close to the
    // person being named. Same sentence, opposite starting positions.
    addBond(evicted, 'A', 6);
    addBond('E', evicted, 8);   // trusts the accuser
    addBond('H', 'A', 9);       // loves the accused
    addBond('F', evicted, -6);  // cannot stand the accuser
    const week = weekWith(evicted, { voters });

    const record = checkBBLastWords(week, () => 0.01);
    expect(record).toBeTruthy();
    const by = Object.fromEntries(record.reactions.map(r => [r.listener, r]));
    // Not everybody in the room reaches the same conclusion.
    const labels = new Set(record.reactions.map(r => r.label));
    expect(labels.size).toBeGreaterThan(1);
    if (by.E && by.H) expect(by.E.belief).toBeGreaterThan(by.H.belief);
    if (by.E && by.F) expect(by.E.belief).toBeGreaterThan(by.F.belief);
  });

  it('costs the accused whether or not the accusation is true', () => {
    const evicted = 'N';
    addBond(evicted, 'A', 6);
    addBond('E', evicted, 8);
    const week = weekWith(evicted, { voters: ['A', 'B', 'C', 'D'] });
    const record = checkBBLastWords(week, () => 0.01);
    expect(record).toBeTruthy();

    // Somebody in that room moved against the person who was named — the truth
    // of it is not what decides that, the speaker's credibility is.
    const accused = record.reveal.accused;
    const moved = record.reactions.some(r => r.belief > 0);
    const suspicion = gs.bb?.house?.suspicion || {};
    const anySuspicion = Object.keys(suspicion)
      .some(k => k.endsWith(`→${accused}`) && suspicion[k] > 0);
    expect(moved && anySuspicion).toBe(true);
  });

  it('is carried out of the door as a grudge when they join the jury', () => {
    const evicted = 'N';
    addBond(evicted, 'A', 6);
    // House of 9 with a jury of 7 is the night the jury opens.
    const roster = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', evicted];
    const week = weekWith(evicted, { voters: ['A', 'B', 'C', 'D', 'E'], house: roster });
    const record = checkBBLastWords(week, () => 0.01);
    expect(record).toBeTruthy();
    if (record.reveal.type !== 'personal') {
      expect(readOf(evicted, record.reveal.accused)).toBeLessThan(0);
    }
  });

  it('never has a nice archetype invent an accusation', () => {
    // Every archetype gets many chances to blow up; only the schemers may
    // fabricate. Being WRONG is allowed for everybody — inventing is not.
    const fabricatedBy = new Set();
    for (let seed = 0; seed < 60; seed++) {
      reset();
      const evicted = CAST[seed % CAST.length].name;
      gs.activePlayers = CAST.map(p => p.name).filter(n => n !== evicted);
      const voters = gs.activePlayers.slice(0, 5);
      voters.forEach(v => addBond(evicted, v, 5));
      const week = weekWith(evicted, { voters, num: 4 + (seed % 5) });
      const record = checkBBLastWords(week, seededRng(seed + 1));
      if (record?.fabricated) fabricatedBy.add(record.speaker);
    }
    const NICE = ['E', 'H', 'I', 'J', 'B'];
    for (const nice of NICE) expect(fabricatedBy.has(nice)).toBe(false);
  });

  it('writes itself into the transcript', () => {
    const evicted = 'N';
    addBond(evicted, 'A', 6);
    const week = weekWith(evicted, { voters: ['A', 'B', 'C', 'D'] });
    const record = checkBBLastWords(week, () => 0.01);
    const lines = [];
    lastWordsLines(record, l => lines.push(l));
    expect(lines.join('\n')).toContain(evicted);
    expect(lines.length).toBeGreaterThan(3);
  });
});

describe('juror sentiment', () => {
  beforeEach(() => reset());

  it('moves less the harder the read already is', () => {
    seedJurorReads('N', 5);
    // Two jurors, identical event, different amounts of conviction.
    seedJurorReads('M', 5);
    gs.bb.jurySentiment.N.reads.A = 0;
    gs.bb.jurySentiment.M.reads.A = 6;
    const soft = moveRead('N', 'A', { strength: 2, credibility: 1, week: 5 });
    const hard = moveRead('M', 'A', { strength: 2, credibility: 1, week: 5 });
    expect(Math.abs(hard)).toBeLessThan(Math.abs(soft));
    // And still not zero — conviction is headroom, never a lock.
    expect(Math.abs(hard)).toBeGreaterThan(0);
  });

  it('reads out as a stance for the screen without gating anything', () => {
    seedJurorReads('N', 5);
    gs.bb.jurySentiment.N.reads.A = 5;
    gs.bb.jurySentiment.N.reads.B = 0.2;
    expect(stanceOf('N', 'A')).toBe('locked');
    expect(stanceOf('N', 'B')).toBe('toss-up');
  });

  it('feeds the finale without changing Total Drama\'s vote', () => {
    const finalists = ['A', 'B'];
    gs.episodeHistory ||= [];
    gs.playerStates ||= {};
    gs.jury = ['N', 'M', 'L'];
    gs.activePlayers = finalists;
    // No adjustment supplied: the shared vote model behaves as it always did.
    const bare = simulateJuryVote(finalists);
    expect(Object.keys(bare.votes)).toEqual(finalists);

    for (const juror of gs.jury) {
      seedJurorReads(juror, 9);
      gs.bb.jurySentiment[juror].reads.A = -8;
      gs.bb.jurySentiment[juror].reads.B = 8;
    }
    const adjustments = Object.fromEntries(
      gs.jury.map(j => [j, sentimentAdjustment(j, finalists)]));
    // A whole jury that spent the back half of a season deciding it hates A
    // must be able to reach the ballot.
    for (const juror of gs.jury) {
      expect(adjustments[juror].B).toBeGreaterThan(adjustments[juror].A);
    }
    const swayed = simulateJuryVote(finalists, adjustments);
    expect(swayed.votes.B).toBeGreaterThanOrEqual(bare.votes.B);
  });
});

describe('the jury house', () => {
  beforeEach(() => reset());

  it('opens the door for the person evicted tonight', () => {
    const evicted = 'N';
    const roster = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', evicted];
    const week = weekWith(evicted, { voters: ['A', 'B'], house: roster });
    const record = generateBBJuryHouse(week, seededRng(3));
    expect(record).toBeTruthy();
    // The week is not on the ledger yet when this runs, so the arrival has to
    // be added by hand — this is the bug that silently produced nothing.
    expect(record.residents).toContain(evicted);
    expect(record.acts[0].title).toBe('The Door Opens');
  });

  it('runs arrivals every week and the roundtable only sometimes', () => {
    reset();
    simulateBBSeason({ rng: seededRng(11) });
    const houses = (gs.bb.weeks || []).filter(w => w.juryHouse);
    const fulls = houses.filter(w => w.juryHouse.full);
    expect(houses.length).toBeGreaterThan(3);
    expect(fulls.length).toBeGreaterThan(0);
    expect(fulls.length).toBeLessThan(houses.length);
    // The last one before the finale is always a full one — it is the jury's
    // closing argument to itself.
    expect(houses[houses.length - 1].juryHouse.full).toBe(true);
  });

  it('argues about the people still playing, and moves the board', () => {
    reset();
    simulateBBSeason({ rng: seededRng(11) });
    const full = (gs.bb.weeks || []).find(w => w.juryHouse?.full && w.juryHouse.roundtable);
    expect(full).toBeTruthy();
    const table = full.juryHouse.roundtable;
    expect(table.lines.length).toBeGreaterThan(0);
    for (const line of table.lines) {
      expect(line.backer).not.toBe(line.doubter);
      expect(gs.activePlayers.concat(gs.eliminated || [])).toContain(line.player);
    }
    // The board is different after the argument than before it.
    const before = JSON.stringify(full.juryHouse.readsBefore);
    const after = JSON.stringify(full.juryHouse.reads);
    expect(after).not.toBe(before);
  });

  it('writes itself into the transcript', () => {
    const evicted = 'N';
    const roster = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', evicted];
    const week = weekWith(evicted, { voters: ['A', 'B'], house: roster });
    const record = generateBBJuryHouse(week, seededRng(3));
    const lines = [];
    juryHouseLines(record, l => lines.push(l));
    expect(lines.join('\n')).toContain('THE JURY HOUSE');
    expect(lines.join('\n')).toContain(evicted);
  });

  it('reaches both transcripts of a played season', () => {
    reset();
    const weeks = simulateBBSeason({ rng: seededRng(11) }) && gs.bb.weeks;
    const withHouse = weeks.find(w => w.juryHouse);
    expect(withHouse).toBeTruthy();
    // The run transcript is built from the acts, so the act has to be on it.
    expect((withHouse.acts || []).some(a => a.type === 'jury-house')).toBe(true);
  });
});

describe('the screen', () => {
  // Rendered, not asserted about. A case that exists and draws nothing passes
  // every source-shaped guard in the repo — this is the same lesson the render
  // sweep was written for, pointed at one screen.
  it('draws the lodge, the board and the argument', async () => {
    reset();
    simulateBBSeason({ rng: seededRng(11) });
    const full = (gs.bb.weeks || []).find(w => w.juryHouse?.full);
    expect(full).toBeTruthy();

    const { rpBuildBBJuryHouse } = await import('../js/vp-bb-jury-house.js');
    const tvState = {};
    const deps = {
      tvState, reveal: () => '', esc: v => String(v ?? ''),
      avatar: n => `<span class="bb-av">${n}</span>`,
    };
    // Everything revealed, so the whole screen is on the page.
    const key = `bb_jh${full.juryHouse.week}_${full.num}`;
    tvState[key] = { idx: 999 };
    const html = rpBuildBBJuryHouse({ num: full.num }, full.juryHouse, deps);

    expect(html).toContain('The Jury House');
    expect(html).toContain('bbjh-board');
    expect(html).toContain('<svg');            // the lodge is drawn, not divs
    expect(html).toContain('bbjh-table');      // the roundtable has its own furniture
    expect(html).not.toContain('undefined');
    expect(html).not.toContain('[object Object]');
    expect(html).not.toContain('NaN');
  });

  it('puts the blowup on eviction night, before the door', async () => {
    reset();
    const evicted = 'N';
    addBond(evicted, 'A', 6);
    const week = weekWith(evicted, { voters: ['A', 'B', 'C', 'D'] });
    const record = checkBBLastWords(week, () => 0.01);
    expect(record).toBeTruthy();

    const { rpBuildBBEviction, _tvState } = await import('../js/vp-screens.js');
    const ep = { num: week.num, acts: week.acts, eliminated: evicted, hoh: 'A', votes: week.votes };
    _tvState[`bb_evict_${ep.num}`] = { idx: 999 };
    const html = rpBuildBBEviction(ep);
    expect(html).toMatch(/ONE LAST THING|THEY LOSE IT/);
    expect(html).toContain(record.reveal.accused);
    expect(html).toContain('THE ROOM');
    // The door still comes last — the whole point is that this happens before it.
    expect(html.indexOf('THE ROOM')).toBeLessThan(html.indexOf('THE FRONT DOOR'));
  });

  it('does not put the board ahead of the argument that moved it', async () => {
    reset();
    simulateBBSeason({ rng: seededRng(11) });
    const full = (gs.bb.weeks || []).find(w => w.juryHouse?.full);
    const { rpBuildBBJuryHouse } = await import('../js/vp-bb-jury-house.js');
    const tvState = {};
    const deps = { tvState, reveal: () => '', esc: v => String(v ?? ''), avatar: n => n };
    const key = `bb_jh${full.juryHouse.week}_${full.num}`;
    tvState[key] = { idx: -1 };
    const closed = rpBuildBBJuryHouse({ num: full.num }, full.juryHouse, deps);
    tvState[key] = { idx: 999 };
    const open = rpBuildBBJuryHouse({ num: full.num }, full.juryHouse, deps);
    expect(closed).toContain('BEFORE TONIGHT');
    expect(open).toContain('AFTER TONIGHT');
  });
});

describe('nobody rolls their own dice', () => {
  it('replays a season identically from the same seed', () => {
    reset();
    simulateBBSeason({ rng: seededRng(21) });
    const first = (gs.bb.weeks || []).map(w =>
      `${w.num}:${w.evicted}:${w.lastWords?.reveal?.accused || '-'}:${w.juryHouse?.full ? 'F' : w.juryHouse ? 'a' : '-'}`).join('|');
    reset();
    simulateBBSeason({ rng: seededRng(21) });
    const second = (gs.bb.weeks || []).map(w =>
      `${w.num}:${w.evicted}:${w.lastWords?.reveal?.accused || '-'}:${w.juryHouse?.full ? 'F' : w.juryHouse ? 'a' : '-'}`).join('|');
    expect(second).toBe(first);
  });
});

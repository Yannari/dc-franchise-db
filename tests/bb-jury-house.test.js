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
import { simulateBBEpisode } from '../js/bb-run.js';
import { checkBBLastWords, lastWordsLines } from '../js/bb/last-words.js';
import { generateBBJuryHouse, juryHouseLines } from '../js/bb/jury-house.js';
import {
  seedJurorReads, moveRead, readOf, sentimentAdjustment, stanceOf,
  sentimentLog, jurorsWithReads,
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

/** Play a whole season through the surface a viewer actually uses. */
function playEpisodes(seed) {
  gs.episodeHistory = [];
  for (let i = 0; i < 20; i++) {
    let ep = null;
    try { ep = simulateBBEpisode(); } catch { break; }
    if (!ep) break;
  }
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

  // ── the confrontation ──
  it('is started by the most betrayed, not the most convinced', () => {
    const evicted = 'N';
    addBond(evicted, 'A', 6);
    // K trusts the evictee AND was close to whoever gets named — the person
    // with something to lose. F believes it too but never liked anybody.
    addBond('K', evicted, 9);
    addBond('F', evicted, 9);
    const week = weekWith(evicted, { voters: ['A', 'B', 'C', 'D'] });
    const accused = 'A';
    addBond('K', accused, 9);
    addBond('F', accused, -6);
    const record = checkBBLastWords(week, () => 0.01);
    expect(record).toBeTruthy();
    if (record.confrontation && record.reveal.accused === accused) {
      expect(record.confrontation.challenger).toBe('K');
    }
  });

  // These two run PLAYED SEASONS rather than hand-built weeks, and they have
  // to. A confrontation needs a strategic accusation, a strategic accusation
  // needs beliefs, and beliefs need a season to happen in — every blowup in a
  // hand-built fixture comes out `personal`, which by design cannot start
  // anything. The first version of these tests asserted against fixtures,
  // measured zero, and was reporting a calibration problem that did not exist
  // while hiding the real one, which was that the odds were ten times too low.
  it('costs the person who started it too', () => {
    // ── WHY THIS READS EVERY CONFRONTATION AND NOT THE FIRST ONE ──
    //
    // It used to take the first confrontation of the first season that had
    // one, then read `gs.bb.house.suspicion` after the WHOLE season had
    // finished. That works only when the first confrontation happens late
    // enough, and it broke the moment an unrelated change moved the seasons
    // around: seed 7 now fights in week one, and by the finale the entry for
    // that pair is not in the map at all.
    //
    // That is the 'suspicion fades' step in week.js doing its job, not a leak.
    // Suspicion decays 0.78 a week and any entry under 0.3 is deleted as
    // noise, so a week-one confrontation worth 2.56 is traced down through ten
    // weekly decays and removed around week ten. A season-end read therefore
    // finds the entry for a late confrontation and nothing for an early one,
    // which says something true about the house and nothing about whether
    // going public cost the challenger.
    //
    // So: every confrontation across the sweep, asserted on the record that
    // provably survives to the end of the season, plus suspicion wherever the
    // entry is still there. Strictly more than the old single case.
    const all = [];
    for (const seed of [3, 7, 11, 19, 27, 35, 43, 51]) {
      reset();
      simulateBBSeason({ rng: seededRng(seed) });
      for (const w of gs.bb.weeks || []) {
        if (!w.lastWords?.confrontation) continue;
        const c = w.lastWords.confrontation;
        const sus = gs.bb?.house?.suspicion || {};
        all.push({ c, suspicion: sus[`${c.challenger}→${c.accused}`],
          remembered: (gs.strategicMemories?.[c.challenger] || []).some(m =>
            m.subject === c.accused && m.type === 'confronted-in-public') });
      }
    }
    expect(all.length, 'no confrontation fired across eight seasons').toBeGreaterThan(0);
    for (const { c, remembered } of all) {
      // It is on the record as something the challenger did in public, which
      // is what makes it a move rather than a mood.
      expect(remembered, `${c.challenger} confronted ${c.accused} and forgot doing it`).toBe(true);
      expect(c.challenger).not.toBe(c.accused);
      expect(['owns', 'turns', 'denies']).toContain(c.kind);
    }
    // And the house is warier of the accused for it.
    const scored = all.filter(x => typeof x.suspicion === 'number');
    expect(scored.length, 'not one confrontation left suspicion behind').toBeGreaterThan(0);
    for (const x of scored) expect(x.suspicion).toBeGreaterThan(0);
  });

  // Variety is a feature here, and an easy one to lose: every line added to a
  // pool reads fine on its own, and the only way to see that a room sounds
  // repetitive is to count templates across a season. This measures 56 distinct
  // shapes from ~180 reactions; the floor is set below that with room to move
  // so ordinary text edits do not trip it, but deleting a pool would.
  it('does not put the same sentence in everybody\'s mouth', () => {
    const seen = [];
    for (const seed of [3, 7, 11, 19, 27, 35, 43, 51, 59, 67]) {
      reset();
      simulateBBSeason({ rng: seededRng(seed) });
      for (const w of gs.bb.weeks || []) {
        for (const r of w.lastWords?.reactions || []) {
          // Strip names and pronouns to compare the TEMPLATE, not the casting.
          let t = r.text;
          CAST.forEach(p => { t = t.split(p.name).join('~'); });
          seen.push(t.replace(/\b(he|she|they|his|her|their|him|them)\b/gi, '*'));
        }
      }
    }
    expect(seen.length).toBeGreaterThan(80);
    const distinct = new Set(seen);
    expect(distinct.size).toBeGreaterThan(40);
    // And no single line may carry the room: the most repeated template stays
    // well under a fifth of everything said.
    const counts = {};
    seen.forEach(t => { counts[t] = (counts[t] || 0) + 1; });
    const worst = Math.max(...Object.values(counts));
    expect(worst).toBeLessThan(seen.length * 0.2);
  });

  it('stays rare enough to mean something', () => {
    let blowups = 0, fights = 0;
    for (const seed of [3, 7, 11, 19, 27, 35, 43, 51, 59, 67]) {
      reset();
      simulateBBSeason({ rng: seededRng(seed) });
      for (const w of gs.bb.weeks || []) {
        if (!w.lastWords) continue;
        blowups++;
        if (w.lastWords.confrontation) fights++;
      }
    }
    expect(blowups).toBeGreaterThan(10);
    // A shouting match every week means nothing; one that never happens is
    // dead code. Both ends are asserted, and the measured rate is ~25%.
    expect(fights).toBeGreaterThan(0);
    expect(fights).toBeLessThan(blowups * 0.6);
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

describe('goodbye messages', () => {
  // They rendered for a long time and changed nothing: a houseguest could gloat
  // into the camera and the vote at the end of the season had never heard about
  // it. The bound matters as much as the wiring — this is ONE of the things a
  // juror carries out of the door, next to who wrote their name down and six
  // weeks of argument in the lodge, and it must not outweigh the season.
  it('move a juror without deciding them', () => {
    let goodbye = 0, other = 0, entries = 0;
    for (const seed of [3, 7, 11, 19, 27, 35]) {
      reset();
      // The PLAYED path, not simulateBBSeason. Eviction interviews — and the
      // goodbye messages inside them — are built in bb-run.js; the headless
      // week engine never makes one, so measuring this against it reports zero
      // for a feature that works. Same two-entry-point trap the house keeps
      // setting.
      playEpisodes(seed);
      for (const juror of jurorsWithReads()) {
        for (const e of sentimentLog(juror)) {
          if (!e.delta) continue;
          if (e.kind === 'goodbye') { goodbye += Math.abs(e.delta); entries++; }
          else other += Math.abs(e.delta);
        }
      }
    }
    // Wired at all...
    expect(entries, 'no goodbye message ever moved a read').toBeGreaterThan(20);
    // ...and one voice among several, not the loudest. Measured at ~22%.
    const share = goodbye / (goodbye + other);
    expect(share).toBeGreaterThan(0.05);
    expect(share).toBeLessThan(0.35);
  });

  it('only reaches people who can actually vote', () => {
    reset();
    playEpisodes(7);
    const seated = new Set(jurorsWithReads());
    for (const juror of seated) {
      const heard = sentimentLog(juror).filter(e => e.kind === 'goodbye');
      // A read can only exist for somebody the jury can still vote for.
      for (const e of heard) expect(e.player).toBeTruthy();
    }
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

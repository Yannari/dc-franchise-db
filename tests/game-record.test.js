// The analysis is only worth what the record under it is worth.
//
// The narrative writer used to be handed episode prose and one line of totals
// and asked for an analyst's read. It cannot be done: whether a veto was won
// under threat or from safety, whether somebody's safety was won or granted,
// whether they were in the room when the house decided — none of it survives
// into prose, and all of it IS the analysis. So it is measured here, and these
// check the measurements rather than the writing.
import { describe, expect, it } from 'vitest';
import { playerRecord, seasonRecord, vetoSavedIn, allianceReach, recordLine }
  from '../js/analysis/game-record.js';

/** A week, with sane defaults, so each test states only what it is about. */
const week = (over = {}) => ({
  num: 1, houseAtStart: ['A', 'B', 'C', 'D', 'E'],
  hoh: 'A', initialNominees: ['B', 'C'], finalNominees: ['B', 'C'],
  vetoWinner: 'D', vetoUsed: false, vetoSaved: null,
  evicted: 'B', votes: { B: 2, C: 0 },
  ballots: [{ voter: 'D', evict: 'B' }, { voter: 'E', evict: 'B' }],
  ...over,
});

describe('who the veto actually saved', () => {
  it('reads the ceremony rather than the block', () => {
    expect(vetoSavedIn(week({ vetoUsed: true, vetoSaved: 'C' }))).toEqual(['C']);
    expect(vetoSavedIn(week({ vetoUsed: false }))).toEqual([]);
  });

  it('does not credit the veto with a Coup', () => {
    // The block changed completely and the veto had nothing to do with it.
    const w = week({ vetoUsed: false, finalNominees: ['D', 'E'],
      coup: { holder: 'E', removed: ['B', 'C'] } });
    expect(vetoSavedIn(w)).toEqual([]);
  });

  it('falls back to the block for a week too old to have recorded it', () => {
    const w = week({ finalNominees: ['B', 'D'] });
    delete w.vetoUsed; delete w.vetoSaved;
    expect(vetoSavedIn(w)).toEqual(['C']);
  });
});

describe('a competition won under threat is a different act', () => {
  it('separates the veto that saved a life from the one won from safety', () => {
    const banked = playerRecord('D', [week()]);
    expect(banked.comp.veto).toBe(1);
    expect(banked.comp.needed).toBe(0);
    expect(banked.comp.banked).toBe(1);

    // Same win, but their own name was on the block.
    const needed = playerRecord('B', [week({ vetoWinner: 'B', vetoUsed: true,
      vetoSaved: 'B', finalNominees: ['C', 'D'], evicted: 'C' })]);
    expect(needed.comp.needed).toBe(1);
    expect(needed.comp.banked).toBe(0);
  });

  it('counts a Head of Household won while being hunted as needed', () => {
    const w = week({ hoh: 'B', plan: { target: 'B' } });
    expect(playerRecord('B', [w]).comp.needed).toBeGreaterThan(0);
  });
});

describe('three different ways to be on the block', () => {
  it('tells target, pawn and renom apart', () => {
    const w = week({ plan: { target: 'B', pawn: 'C' } });
    expect(playerRecord('B', [w]).block.asTarget).toBe(1);
    expect(playerRecord('C', [w]).block.asPawn).toBe(1);

    const renom = week({ initialNominees: ['B', 'C'], finalNominees: ['B', 'E'],
      vetoUsed: true, vetoSaved: 'C', plan: { target: 'B' }, evicted: 'B' });
    expect(playerRecord('E', [renom]).block.asReplacement).toBe(1);
  });
});

describe('a favour is not a result', () => {
  it('separates being pulled down from surviving the vote', () => {
    const pulled = week({ vetoUsed: true, vetoSaved: 'C', finalNominees: ['B', 'D'] });
    expect(playerRecord('C', [pulled]).survived.byVeto).toBe(1);
    expect(playerRecord('C', [pulled]).survived.byVote).toBe(0);

    // C stayed on the block and the house kept them.
    expect(playerRecord('C', [week()]).survived.byVote).toBe(1);
    expect(playerRecord('C', [week()]).survived.byVeto).toBe(0);
  });
});

describe('who was actually in the room', () => {
  it('measures alignment with the house, not turnout', () => {
    const weeks = [
      week({ num: 1, ballots: [{ voter: 'D', evict: 'B' }, { voter: 'E', evict: 'C' }], evicted: 'B' }),
      week({ num: 2, houseAtStart: ['A', 'C', 'D', 'E'], evicted: 'C',
        ballots: [{ voter: 'D', evict: 'C' }, { voter: 'E', evict: 'C' }] }),
    ];
    expect(playerRecord('D', weeks).voteAlignment).toBe(1);
    expect(playerRecord('E', weeks).voteAlignment).toBe(0.5);
  });

  it('counts a losing vote as a blindside only when they did not see it coming', () => {
    // Voted against the house without changing their mind: nobody told them.
    const surprised = week({ ballots: [{ voter: 'E', evict: 'C', changed: false }], evicted: 'B' });
    expect(playerRecord('E', [surprised]).blindsided).toBe(1);
    // Changed their mind and still lost: they were in the room and lost anyway.
    const informed = week({ ballots: [{ voter: 'E', evict: 'C', changed: true }], evicted: 'B' });
    expect(playerRecord('E', [informed]).blindsided).toBe(0);
  });

  it('notices a promise that was not kept', () => {
    const w = week({ ballots: [{ voter: 'E', evict: 'B', stated: 'C' }] });
    expect(playerRecord('E', [w]).votes.brokePromise).toBe(1);
  });
});

describe('a season that was not there is not counted', () => {
  it('does not credit weeks somebody was not in the house for', () => {
    const weeks = [
      week({ num: 1, houseAtStart: ['A', 'B', 'C'] }),
      week({ num: 2, houseAtStart: ['A', 'C', 'Z'] }),
    ];
    expect(playerRecord('Z', weeks).weeksPlayed).toBe(1);
    expect(playerRecord('A', weeks).weeksPlayed).toBe(2);
  });
});

describe('the shape of the house', () => {
  it('says whether the season was decided by comps or in the room', () => {
    const held = [week({ num: 1, plan: { target: 'B' }, evicted: 'B' }),
      week({ num: 2, plan: { target: 'C' }, evicted: 'C' })];
    expect(seasonRecord(held).house.decidedBy).toBe('competitions');

    const lost = [week({ num: 1, plan: { target: 'B' }, evicted: 'C' }),
      week({ num: 2, plan: { target: 'C' }, evicted: 'D' })];
    expect(seasonRecord(lost).house.decidedBy).toBe('the room');
  });

  it('counts distinct groups, because three of them is the whole story', () => {
    const alliances = [{ name: 'One', members: ['A', 'B'] },
      { name: 'Two', members: ['A', 'C', 'D'] }];
    expect(allianceReach('A', alliances)).toEqual({ groups: 2, names: ['One', 'Two'], reach: 3 });
    expect(allianceReach('E', alliances).groups).toBe(0);
  });

  it('orders the season by finish and leaves the unplaced at the back', () => {
    const season = seasonRecord([week()], { finalists: ['E', 'D'] });
    expect(season.players[0].name).toBe('E');
    expect(season.players[0].placement).toBe(1);
    expect(season.players[season.players.length - 1].placement).toBeNull();
  });
});

describe('the line handed to the writer', () => {
  it('states the distinctions rather than the totals', () => {
    const rec = playerRecord('B', [week({ vetoWinner: 'B', vetoUsed: true, vetoSaved: 'B',
      finalNominees: ['C', 'D'], evicted: 'C', plan: { target: 'B' } })]);
    const line = recordLine({ ...rec, placement: 3 });
    expect(line).toContain('#3 B');
    expect(line).toContain('won under threat');
    expect(line).toContain('as the target');
  });

  it('says plainly when somebody never won anything', () => {
    expect(recordLine(playerRecord('E', [week()]))).toContain('no comp wins');
  });
});

// ══════════════════════════════════════════════════════════════════════
// The wiring, checked as source, because the whole point is that the model
// is asked to INTERPRET a record rather than invent one — and a prompt that
// silently stops receiving the record still returns confident prose.
// ══════════════════════════════════════════════════════════════════════
describe('the record reaches the writers', () => {
  const read = f => require('node:fs').readFileSync(f, 'utf8');

  it('is sent with the season export', () => {
    const src = read('js/stats-export.js');
    expect(src).toMatch(/gameRecord,/);
    expect(src).toMatch(/recordLines\(seasonRecord\(/);
  });

  it('stops crediting the veto with saves it did not make', () => {
    const src = read('js/stats-export.js');
    expect(src).toMatch(/vetoSavedIn\(week\)\.forEach/);
    expect(src, 'the block-diff derivation is still there')
      .not.toMatch(/const saved = \(week\.initialNominees \|\| \[\]\)\.filter/);
  });

  it('is in the prompt, and outranks the prose', () => {
    const src = read('worker/worker-season-live.js');
    // Scoped to generateNarrativeFill. The season IMPORT extractor elsewhere in
    // this file still asks for a documentary voice, which is right for it: it
    // reconstructs a season from pasted text and has no record to reason from.
    const fill = src.slice(src.indexOf('async function generateNarrativeFill'),
      src.indexOf('async function', src.indexOf('async function generateNarrativeFill') + 10));
    expect(fill).toMatch(/GAME RECORD \(measured/);
    expect(fill).toMatch(/THE RECORD OUTRANKS THE EPISODES/);
    expect(fill).toMatch(/YOU ARE AN ANALYST, NOT A NARRATOR/);
    expect(fill, 'the documentary voiceover instruction survived')
      .not.toMatch(/sports documentary voiceover/);
    // Defined, not merely referenced — it was interpolated into both prompts
    // for a while without existing, which throws the moment anybody exports.
    expect(fill).toMatch(/const recordBlock = body\.gameRecord/);
  });

  it('asks for a verdict, in fields a database can be queried on', () => {
    const src = read('worker/worker-season-live.js');
    for (const field of ['gameArchetype', 'resume', 'demise', 'demiseKind',
      'optimalLine', 'ceiling']) {
      expect(src, `${field} is not in the schema`).toContain(field);
    }
    // Enums, not prose — "every comp beast who lost at final three" has to be
    // answerable in two seasons' time.
    expect(src).toMatch(/"comp-beast", "alliance-hub"/);
    expect(src).toMatch(/"outplayed", "collateral"/);
  });

  it('carries the analysis back into the season document', () => {
    const src = read('js/stats-export.js');
    for (const field of ['gameArchetype', 'resume', 'demiseKind', 'optimalLine', 'ceiling']) {
      expect(src).toMatch(new RegExp(`aiP\.${field}`));
    }
  });

  it('gives the Control Room the season as well as the week', () => {
    const page = read('current-season.html');
    expect(page).toMatch(/mode: 'season-analysis'/);
    expect(page).toMatch(/_seasonMaterial/);
    expect(page).toMatch(/panelSeasonAnalysis/);
    const worker = read('worker/worker-episode-live.js');
    expect(worker).toMatch(/mode === "season-analysis"/);
    expect(worker).toMatch(/THE MEASURED HALF OUTRANKS THE PROSE/);
    // The sections that make it an analysis rather than a recap.
    for (const section of ['THE SHAPE OF THE SEASON', 'THE TURN',
      'WHO PLAYED THE BEST GAME', 'HOW EACH GAME ENDED', 'THE COUNTERFACTUAL']) {
      expect(worker).toContain(section);
    }
  });

  it('judges on what was knowable, not on the finish', () => {
    // The single instruction that separates analysis from hindsight.
    const worker = read('worker/worker-episode-live.js');
    const season = read('worker/worker-season-live.js');
    expect(worker).toMatch(/GIVEN WHAT THEY COULD KNOW\s*\n?AT THE TIME/);
    expect(season).toMatch(/what they could know at the\s*\n?\s*time/);
    expect(season).toMatch(/hindsight/i);
  });
});

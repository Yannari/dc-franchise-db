import { describe, it, expect } from 'vitest';
import { villainBoard, villainAward, WEIGHTS } from '../js/villain-score.js';

const doc = {
  placements: [
    { placement: 1, name: 'Ann', playerSlug: 'ann' },
    { placement: 2, name: 'Bo', playerSlug: 'bo' },
    { placement: 3, name: 'Cal', playerSlug: 'cal' },
    { placement: 4, name: 'Dee', playerSlug: 'dee' },
  ],
  alliances: [{ name: 'The Pact', members: ['Ann', 'Cal', 'Dee'] }],
  rivalries: [{ players: ['Bo', 'Cal'] }],
  weeks: [
    // A live vote: Ann tells Cal one thing and writes another, and cuts an ally.
    { week: 1, hoh: 'Bo', initialNominees: ['Cal', 'Dee'], finalNominees: ['Cal', 'Dee'],
      votes: { Cal: 2, Dee: 1 }, evicted: 'Cal',
      ballots: [{ voter: 'Ann', evict: 'Cal', stated: 'Dee' }, { voter: 'Dee', evict: 'Cal' }] },
    // A unanimous one: nobody chose anything.
    { week: 2, hoh: 'Ann', initialNominees: ['Dee', 'Bo'], finalNominees: ['Dee', 'Bo'],
      votes: { Dee: 3, Bo: 0 }, evicted: 'Dee',
      ballots: [{ voter: 'Ann', evict: 'Dee' }, { voter: 'Bo', evict: 'Dee' }] },
  ],
};

describe('the villain board', () => {
  it('scores the actor and never the victim', () => {
    const { board } = villainBoard(doc);
    expect(board.find(r => r.name === 'Cal')?.deeds.cutAnAlly ?? 0).toBe(0);
    // Cal only scores for the rivalry he is in, never for being cut.
    expect(board.find(r => r.name === 'Cal')?.score).toBe(WEIGHTS.rivalry);
  });

  it('counts a ballot that did not match what was said out loud', () => {
    const ann = villainBoard(doc).board.find(r => r.name === 'Ann');
    expect(ann.deeds.brokenWord).toBe(1);
    expect(ann.evidence.some(e => /Told the room Dee and wrote down Cal/.test(e))).toBe(true);
  });

  it('does not call voting with a unanimous house a betrayal', () => {
    // Week 2 sent Dee out 3-0 with Ann, her ally, voting. That is arithmetic.
    const ann = villainBoard(doc).board.find(r => r.name === 'Ann');
    expect(ann.deeds.cutAnAlly).toBe(1);      // week 1 only
  });

  it('ranks, and hands the top two over in the award shape', () => {
    const { gold, silver, board } = villainAward(doc);
    expect(gold.name).toBe('Ann');
    expect(silver).toBeTruthy();
    expect(board[0].score).toBeGreaterThanOrEqual(board[1].score);
    expect(gold.evidence.length).toBeGreaterThan(0);
  });

  it('reads the edit when a season carries one, as a SHARE of screen time', () => {
    const totals = { Bo: { units: 20, tones: { villainous: 10 } },
      Ann: { units: 60, tones: { villainous: 3 } } };
    const plain = villainBoard(doc).board.find(r => r.name === 'Bo').score;
    const withEdit = villainBoard(doc, { editTotals: totals });
    const bo = withEdit.board.find(r => r.name === 'Bo');
    expect(bo.score).toBeGreaterThan(plain);
    expect(withEdit.sources).toContain('the edit');
    // Ann is on screen three times as much and barely villainous: no credit.
    expect(withEdit.board.find(r => r.name === 'Ann').deeds.villainScene).toBe(0);
  });

  it('says nothing about a season with no cast', () => {
    expect(villainBoard({}).board).toEqual([]);
  });
});

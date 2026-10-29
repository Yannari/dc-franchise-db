// Every show saves its season's villains (the user, 2026-10-29: "do all the simulators save the villains of the
// season?" Two did; "it would be useful when doing house of villains later"). js/villain-score.js reads each show's
// document by its own fields, and js/villain-deeds.js turns each show's episodes into deeds the board scores.
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { villainBoard, attachVillainBoard, WEIGHTS } from '../js/villain-score.js';
import { dragDeeds, challengeDeeds, perfectMatchDeeds, withDeeds } from '../js/villain-deeds.js';

const top = doc => villainBoard(doc).board[0]?.name;
const P = names => names.map((name, i) => ({ name, playerSlug: name.toLowerCase(), placement: i + 1 }));

describe('each show is read by its own record', () => {
  it('The Traitors: the turret and the round table', () => {
    const doc = {
      placements: P(['Ann', 'Bo', 'Cy', 'Di']),
      roleHistory: [{ name: 'Ann', from: 'faithful', to: 'traitor', ep: 1 }],
      votingHistory: [
        { episode: 1, murdered: 'Cy', eliminated: 'Di', votes: [{ voter: 'Ann', target: 'Di' }, { voter: 'Bo', target: 'Di' }] },
      ],
    };
    const ann = villainBoard(doc).board.find(r => r.name === 'Ann');
    expect(ann.deeds.ranTheWeek).toBe(1);
    expect(ann.deeds.deceived).toBe(1);
    expect(top(doc)).toBe('Ann');
    // the Faithful who voted the same way was fooled, not a villain
    expect(villainBoard(doc).board.find(r => r.name === 'Bo')).toBeUndefined();
  });

  it('Drag Race: the edit, and the werk room', () => {
    const doc = { placements: P(['Q1', 'Q2', 'Q3']), dr: { episodes: [
      { episode: 1, placements: [{ name: 'Q2', storyline: 'Villain' }, { name: 'Q1', storyline: 'Front-runner' }] },
      { episode: 2, placements: [{ name: 'Q2', storyline: 'Bitter Edit' }] },
    ] } };
    expect(top(doc)).toBe('Q2');
    const rows = [{ num: 3, dr: { events: [
      { type: 'sabotage', players: ['Q3', 'Q1'], bond: [['Q3', 'Q1', -1.5]], pop: { Q3: -3 }, data: { craft: 'singing' } },
      { type: 'werk:read-lands-wrong', players: ['Q3', 'Q2'], bond: [['Q3', 'Q2', -2]], pop: { Q3: -2 } },
      { type: 'werk:comforting', players: ['Q1', 'Q2'], bond: [['Q1', 'Q2', 2]], pop: { Q1: 2 } },
      { type: 'mini:read-missed', players: ['Q1', 'Q3'], bond: [['Q1', 'Q3', -1]], pop: { Q1: -1 } },
    ] } }];
    const deeds = dragDeeds(rows);
    expect(deeds.map(d => [d.by, d.kind])).toEqual([['Q3', 'sabotage'], ['Q3', 'cruelty']]);
    expect(deeds[0].line).toMatch(/Q1's singing/);
  });

  it('The Circle: blocks, betrayals and the catfish', () => {
    const doc = {
      placements: [{ name: 'L', placement: 1, alliances: ['D'] }, { name: 'D', placement: 2, betrayed: ['L'] }, { name: 'H', placement: 3 }],
      votingHistory: [{ episode: 4, exits: [{ name: 'H', channel: 'influencers', by: ['L'] }] }],
      catfish: [{ name: 'D', playedAs: 'Brooke' }],
    };
    const b = villainBoard(doc).board;
    expect(b.find(r => r.name === 'D').deeds).toMatchObject({ cutAnAlly: 1, deceived: 1 });
    expect(b.find(r => r.name === 'L').deeds.ranTheWeek).toBe(1);
  });

  it('The Challenge: a call-out and the house scenes', () => {
    const doc = { placements: P(['A', 'B', 'C']), votingHistory: [{ episode: 2, callouts: [{ by: 'A', opponent: 'C' }] }] };
    expect(villainBoard(doc).board.find(r => r.name === 'A').deeds.calledOut).toBe(1);
    const deeds = challengeDeeds([{ num: 2, ch: { aired: [{ kind: 'mock', who: ['B', 'C'] }, { kind: 'spark', who: ['A', 'B'] }] } }]);
    expect(deeds).toEqual([{ by: 'B', kind: 'cruelty', line: 'Mocked C after the daily in episode 2.' }]);
  });

  it('Perfect Match: a partner taken, and the public\'s word for them', () => {
    const doc = { placements: [{ name: 'X', placement: 1, pm: { label: 'villain' } }, { name: 'Y', placement: 2 }, { name: 'Z', placement: 3 }],
      votingHistory: [{ episode: 3, steals: [{ by: 'Y', took: 'Z', from: 'X' }] }] };
    const b = villainBoard(doc).board;
    expect(b.find(r => r.name === 'Y').deeds.stole).toBe(1);
    expect(b.find(r => r.name === 'X').deeds.villainScene).toBe(2);
    const deeds = perfectMatchDeeds([{ num: 5, pm: { labels: { X: 'villain' }, events: [
      { kind: 'pull', players: ['Y', 'Z'], hut: { who: 'Y', stance: 'two-faced' } },
      { kind: 'argument', players: ['Z', 'X'], pop: { Z: { approval: -1 } } },
    ] } }]);
    expect(deeds.map(d => [d.by, d.kind])).toEqual([['X', 'villainScene'], ['Y', 'deceived'], ['Z', 'cruelty']]);
  });

  it('the race: a sabotage the leg recorded', () => {
    const doc = { placements: [{ name: 'R1', placement: 1, rr: { sabotage: 2 } }, { name: 'R2', placement: 2, rr: { sabotage: 0 } }] };
    expect(villainBoard(doc).board[0]).toMatchObject({ name: 'R1', score: 2 * WEIGHTS.sabotage });
  });
});

describe('the board on the document', () => {
  it('attaches when somebody did something, and not otherwise', () => {
    expect(attachVillainBoard({ placements: P(['A', 'B']) }).villainBoard).toBeUndefined();
    const doc = attachVillainBoard(withDeeds({ placements: P(['A', 'B']) }, [{ by: 'B', kind: 'sabotage', line: 'Did it.' }]));
    expect(doc.villainBoard.board[0].name).toBe('B');
    expect(doc.villainBoard.sources).toContain('the episodes');
  });

  it('caps a small deed so volume alone does not decide it', () => {
    const many = Array.from({ length: 20 }, () => ({ by: 'A', kind: 'cruelty', line: '' }));
    const doc = withDeeds({ placements: P(['A', 'B']) }, [...many, { by: 'B', kind: 'sabotage' }, { by: 'B', kind: 'sabotage' }, { by: 'B', kind: 'brokenWord' }]);
    const b = villainBoard(doc).board;
    expect(b.find(r => r.name === 'A').deeds.cruelty).toBe(6);
  });

  it('is published on every show\'s season document', () => {
    for (const f of ['js/dr/export.js', 'js/ch/export.js', 'js/pm/export.js', 'js/ci/export.js', 'js/tr/export.js', 'js/rr/export.js']) {
      expect(readFileSync(f, 'utf8'), `${f} does not attach the villain board`).toMatch(/attachVillainBoard\(/);
    }
  });
});

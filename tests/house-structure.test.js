// The shape of a house season, worked out before it is played.
//
// A house has almost nothing to configure, so the setup column shows what the
// season WILL be instead. That only helps if the arithmetic is right — a
// readout that quietly lies is worse than an empty column.
import { describe, expect, it } from 'vitest';
import { houseStructure } from '../js/bb-run.js';

const labels = segs => segs.map(s => s.label);
const find = (segs, needle) => segs.find(s => s.label.includes(needle));

describe('house season structure', () => {
  it('counts one eviction a week down to the final three', () => {
    const segs = houseStructure({ jurySize: 9 }, 16);
    expect(labels(segs)[0]).toBe('16 houseguests');
    expect(find(segs, 'week').label).toBe('13 weeks');   // 16 - 3
    expect(labels(segs).at(-1)).toBe('final three');
    expect(segs.every(s => s.ok)).toBe(true);
  });

  it('takes a week off the season for each scheduled double eviction', () => {
    const twistSchedule = [
      { episode: 4, type: 'bb-double-eviction' },
      { episode: 8, type: 'bb-double-eviction' },
      { episode: 6, type: 'bb-have-nots' },      // not a double; must not count
    ];
    const segs = houseStructure({ jurySize: 9, twistSchedule }, 16);
    expect(find(segs, 'week').label).toBe('11 weeks (2 double)');
  });

  it('opens the jury where the jury actually opens', () => {
    // seatBBJury takes the last `jurySize` people out, and the houseguest cut
    // at the final three is one of them — so the rest are weekly evictions and
    // the first of those happens with jurySize + 2 still in the house.
    expect(find(houseStructure({ jurySize: 9 }, 16), 'jury').label).toBe('jury opens at 11');
    expect(find(houseStructure({ jurySize: 7 }, 14), 'jury').label).toBe('jury opens at 9');
    expect(find(houseStructure({ jurySize: 0 }, 14), 'no jury')).toBeTruthy();
  });

  it('flags a jury the cast cannot fill', () => {
    const segs = houseStructure({ jurySize: 12 }, 10);   // only 7 evictions + the cut
    const jury = segs.find(s => !s.ok && /jury/.test(s.label));
    expect(jury).toBeTruthy();
    expect(jury.why).toContain('12');
  });

  it('flags a cast too small to run a house at all', () => {
    const segs = houseStructure({ jurySize: 5 }, 3);
    expect(segs[0].ok).toBe(false);
    expect(segs[0].why).toContain('at least 4');
  });

  it('shows the Block Buster as part of the shape', () => {
    const on = houseStructure({ jurySize: 7, bbSafetyMode: 'block-buster', bbSafetyStopsAt: 6 }, 14);
    expect(find(on, 'Block Buster').label).toBe('Block Buster to 6');
    expect(find(on, 'Block Buster').ok).toBe(true);

    // A mode that could never run in this cast is worth saying so.
    const never = houseStructure({ jurySize: 5, bbSafetyMode: 'block-buster', bbSafetyStopsAt: 9 }, 8);
    const seg = find(never, 'Block Buster');
    expect(seg.ok).toBe(false);
    expect(seg.why).toContain('never run');

    // Off means it is not mentioned at all.
    expect(find(houseStructure({ jurySize: 9, bbSafetyMode: 'off' }, 16), 'Block Buster')).toBeUndefined();
  });

  it('never returns a segment without a label', () => {
    for (const n of [0, 1, 4, 8, 16, 22]) {
      for (const jury of [0, 5, 9, 20]) {
        const segs = houseStructure({ jurySize: jury }, n);
        expect(segs.length).toBeGreaterThan(0);
        for (const s of segs) {
          expect(typeof s.label).toBe('string');
          expect(s.label.length).toBeGreaterThan(0);
          expect(typeof s.ok).toBe('boolean');
        }
      }
    }
  });
});

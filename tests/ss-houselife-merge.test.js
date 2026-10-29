// Two House Life screens in a row air as one (the user, 2026-10-29: "a screen house life after another house life
// screen doesnt have to be if they follow each other just merge them instead of dividing them").
import { describe, expect, it } from 'vitest';
import { mergeHouseLife } from '../js/vp-bb-ep/steps.js';

const hl = (n, day, extra = {}) => ({
  id: `bb-hl-${n}`, kind: 'houselife', day, time: '14:00', set: 'kitchen', room: 'Kitchen', cam: 3, kicker: 'Cam 03 · Kitchen', cast: [['Ana', 50]], mood: 'house',
  title: `House Life · Day ${day}`, steps: [{ k: 'beat', t: `Day ${day} opens.` }, { k: 'say', by: 'Ana', t: `Line ${n}.` }], ...extra,
});

describe('house life in a row', () => {
  it('merges back-to-back House Life screens into one, keeping every line in order', () => {
    const out = [{ id: 'bb-ss-prime-v', kind: 'twist', steps: [] }, hl(1, 3), hl(2, 3), hl(3, 4, { mood: 'drama' }), { id: 'bb-ss-buzz', kind: 'twist', steps: [] }, hl(4, 5)];
    mergeHouseLife(out);
    expect(out.map(s => s.id)).toEqual(['bb-ss-prime-v', 'bb-hl-1', 'bb-ss-buzz', 'bb-hl-4']);
    expect(out[1].steps.filter(s => s.k === 'say').map(s => s.t)).toEqual(['Line 1.', 'Line 2.', 'Line 3.']);
    expect(out[1].mood).toBe('drama');
    expect(out[1].title).toBe('House Life · Days 3–4');
  });
  it('opens each merged part on its own room, with its own day on the HUD', () => {
    const out = [hl(1, 3), hl(2, 4, { set: 'pool', room: 'The Pool' })];
    mergeHouseLife(out);
    const part = out[0].steps[2];
    expect(part.scene).toMatchObject({ set: 'pool', room: 'The Pool', day: 4 });
    expect(out[0].steps[0].scene).toBeUndefined();
  });
  it('leaves Secret Story\'s own screens alone, even when they are house life', () => {
    const out = [hl(1, 3), { id: 'bb-ss-previously', kind: 'houselife', day: 3, steps: [{ k: 'beat', t: 'x' }] }];
    mergeHouseLife(out);
    expect(out).toHaveLength(2);
  });
});

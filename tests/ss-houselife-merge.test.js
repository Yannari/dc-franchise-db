// Two House Life screens in a row air as one (the user, 2026-10-29: "a screen house life after another house life
// screen doesnt have to be if they follow each other just merge them instead of dividing them").
import { describe, expect, it } from 'vitest';
import { mergeHouseLife, mergeSameLabel } from '../js/vp-bb-ep/steps.js';

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

// "in the prime when 2 screens with the same name follow each other just merge them (arrival 3 is not the same as arrival 4 btw)"
describe('two screens with the same name in a row', () => {
  const tw = (id, label, extra = {}) => ({ id, kind: 'twist', ss: true, label, title: label, set: 'studio-wide', room: 'The Prime Studio', cast: [], steps: [{ k: 'host', by: 'Josh', t: `${id} line.` }], ...extra });
  it('merges them, and the second keeps its own look', () => {
    const out = [tw('bb-ss-prime-a', 'The Verdict', { rules: [['A', 'b']] }), tw('bb-ss-prime-b', 'The Verdict', { set: 'door', room: 'The Airlock', cast: [['Ana', 50]] })];
    mergeSameLabel(out, () => 'prime');
    expect(out).toHaveLength(1);
    expect(out[0].sceneful).toBe(true);
    expect(out[0].steps.map(s => s.t)).toEqual(['bb-ss-prime-a line.', 'bb-ss-prime-b line.']);
    expect(out[0].steps[1].scene).toMatchObject({ set: 'door', room: 'The Airlock', cast: [['Ana', 50]] });
    // (the first one's board does not follow it into the second)
    expect('rules' in out[0].steps[1].scene && out[0].steps[1].scene.rules).toBeUndefined();
  });
  it('keeps numbered screens apart, and never merges across parts of the week', () => {
    const out = [tw('x1', 'Arrival 3'), tw('x2', 'Arrival 4'), tw('x3', 'House Life'), tw('x4', 'House Life')];
    mergeSameLabel(out, s => (s.id === 'x4' ? 'prime' : 'daily'));
    expect(out.map(s => s.id)).toEqual(['x1', 'x2', 'x3', 'x4']);
  });
});

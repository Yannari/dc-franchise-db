import { describe, it, expect } from 'vitest';
import { sgChip, sgBadge, sgBar, sgSection, sgEmpty, sgLegend, sgPortraitChip, SG_TONE, DIM_TONE, DIM_LABEL } from '../js/vp-kit.js';

describe('vp-kit — shared strategy visual grammar', () => {
  it('chips carry the grammar class + tone and the state modifiers', () => {
    expect(sgChip('X', { tone: 'danger' })).toContain('sg-chip');
    expect(sgChip('X', { tone: 'danger' })).toContain(SG_TONE.danger);
    expect(sgChip('X', { dashed: true })).toContain('sg-chip--dashed');   // suspected/private
    expect(sgChip('X', { faded: true })).toContain('sg-chip--faded');     // stale
    expect(sgChip('X', { isNew: true })).toContain('sg-chip--new');       // gained this beat
    expect(sgChip('X', { color: '#123456' })).toContain('#123456');       // raw colour override
  });

  it('escapes tooltips and section labels (spoiler/injection safety)', () => {
    expect(sgChip('a', { tip: 'he said "hi"' })).toContain('&quot;');
    expect(sgSection('<script>')).toContain('&lt;script&gt;');
    expect(sgPortraitChip('<b>x')).toContain('&lt;b&gt;');
  });

  it('bars clamp to 0..100%', () => {
    expect(sgBar(99, { max: 10 })).toContain('width:100%');
    expect(sgBar(-5, { max: 10 })).toContain('width:0%');
    expect(sgBar(5, { max: 10 })).toContain('width:50%');
  });

  it('every relationship dimension maps to a real grammar tone + label', () => {
    ['affection', 'trust', 'strategicRespect', 'fear', 'obligation', 'resentment', 'attraction'].forEach(d => {
      expect(SG_TONE[DIM_TONE[d]]).toBeTruthy();
      expect(DIM_LABEL[d]).toBeTruthy();
    });
  });

  it('legend, badge and empty state render their classes', () => {
    expect(sgLegend('roles', [{ label: 'A', note: 'x', tone: 'trust' }])).toContain('sg-legend');
    expect(sgBadge('LEAKED', { tone: 'danger' })).toContain('sg-badge');
    expect(sgEmpty('nothing here yet')).toContain('sg-empty');
  });
});

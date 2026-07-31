import { describe, expect, it } from 'vitest';
import { BB_ARRIVAL_VARIANT_COUNTS, bbArrivalLine, resetBBArrivalWriting } from '../js/bb-writing.js';

describe('Big Brother arrival writing', () => {
  it('provides nine roster-agnostic scenes for every supported archetype', () => {
    expect(Object.keys(BB_ARRIVAL_VARIANT_COUNTS)).toHaveLength(15);
    expect(Object.values(BB_ARRIVAL_VARIANT_COUNTS).every(count => count === 9)).toBe(true);
    expect(Object.values(BB_ARRIVAL_VARIANT_COUNTS).reduce((a,b) => a+b, 0)).toBe(135);
  });

  it('does not repeat an archetype scene within one season', () => {
    const season='no-repeat-test'; resetBBArrivalWriting(season);
    const lines=Array.from({ length:9 },(_,i)=>bbArrivalLine(`Custom ${i}`,{ archetype:'mastermind',season,slot:i }));
    const structures=lines.map(line=>line.replace(/Custom \d/g,'HOUSEGUEST'));
    expect(new Set(structures).size).toBe(structures.length);
  });

  it('keeps a houseguest stable when the move-in screen rerenders', () => {
    const args={ archetype:'wildcard',season:'stable-test',slot:3,stats:{ boldness:9 } };
    expect(bbArrivalLine('Custom Player',args)).toBe(bbArrivalLine('Custom Player',args));
  });

  it('uses stats as behavioral texture without requiring a known name', () => {
    const line=bbArrivalLine('Brand New Character',{ archetype:'hero',season:'stats-test',stats:{ social:10 } });
    expect(line).toContain('Brand New Character');
    expect(line).toContain('saving');
  });
});

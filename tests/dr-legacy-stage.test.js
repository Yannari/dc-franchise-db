// ══════════════════════════════════════════════════════════════════════
// tests/dr-legacy-stage.test.js — the lipstick wall (js/vp-dr/legacy-stage.js)
// ══════════════════════════════════════════════════════════════════════
import { describe, expect, it } from 'vitest';
import { lipstickStage, LEGACY_STAGE_CSS } from '../js/vp-dr/legacy-stage.js';

const ep = { num: 5, format: 'drag-race' };
const bottom = ['Brightly', 'MK', 'Ripper'];
const list = [
  { kind: 'legacy:deliberate', target: 'MK', text: 'She turns the tubes over.' },
  { kind: 'legacy:reveal', target: 'MK', text: 'The tube turns. MK.' },
  { kind: 'legacy:room', target: 'MK', text: 'Nobody moves.' },
  { kind: 'legacy:last-words', target: 'MK', text: 'I did not get to fight for it.' },
];
const stage = (uid) => lipstickStage({ num: 5 }, list, { ep, bottom, holder: 'Julia', uid });

describe('the lipstick wall', () => {
  it('stands a tube up for every queen in the bottom', () => {
    const st = stage('t1');
    for (const q of bottom) expect(st.html).toContain(q);
    expect((st.html.match(/class="lgx-one"/g) || [])).toHaveLength(bottom.length);
  });

  it('never marks a tube chosen before it is turned around', () => {
    const st = stage('t2');
    // The bottom's names are on the counter — the host said them at the call.
    // Which one is chosen is the secret, and nothing carries it at rest.
    expect(st.html).not.toMatch(/class="lgx-one[^"]*\bchosen\b/);
    expect(st.html).not.toMatch(/data-card[^>]*>MK/);
    expect(st.states[0].chosen).toBeFalsy();
    expect(st.states[1].chosen).toBe('MK');
  });

  it('lists the tubes alphabetically, not in the order the panel ranked them', () => {
    const st = lipstickStage({ num: 5 }, list, { ep, bottom: ['Ripper', 'Brightly', 'MK'], holder: 'Julia', uid: 't3' });
    const order = [...st.html.matchAll(/data-q="([^"]+)"/g)].map(m => m[1]);
    expect(order).toEqual(['Brightly', 'MK', 'Ripper']);
  });

  it('spares everybody else once the name is out', () => {
    const st = stage('t4');
    expect(st.states[2].spared.sort()).toEqual(['Brightly', 'Ripper']);
    expect(st.states[3].quote).toContain('her last words');
  });

  it('has one state per step', () => {
    expect(stage('t5').states).toHaveLength(list.length);
  });

  it('obeys the stage rules: contain, reduced motion, compact block last', () => {
    expect(LEGACY_STAGE_CSS).toMatch(/contain:\s*inline-size/);
    expect(LEGACY_STAGE_CSS).toMatch(/prefers-reduced-motion/);
    const i = LEGACY_STAGE_CSS.lastIndexOf('@media (max-height: 999px)');
    expect(i).toBeGreaterThan(-1);
    expect(LEGACY_STAGE_CSS.slice(i)).not.toMatch(/@media \(prefers-reduced-motion/);
  });

  it('draws the lipstick as SVG rather than out of divs', () => {
    expect(stage('t6').html).toMatch(/<svg class="lgx-tube"/);
  });
});

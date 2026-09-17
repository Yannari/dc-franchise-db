// ══════════════════════════════════════════════════════════════════════
// tests/dr-finale-stages.test.js — the finale night's pinned stages
// (js/vp-dr/finale-stage.js, js/vp-dr/crowning.js)
// ══════════════════════════════════════════════════════════════════════
import { describe, expect, it } from 'vitest';
import { playDragSeason } from '../js/dr/season.js';
import { rngFor } from '../js/dr/rng.js';
import { rpBuildShowcase, rpBuildInterview, rpBuildCrownLipSync, rpBuildCut } from '../js/vp-dr/finale-screens.js';
import { rpBuildCrowning } from '../js/vp-dr/crowning.js';

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];
const FORMATS = ['top4', 'top3', 'top2', 'perform-then-lipsync', 'perform-then-lipsync-3'];

function finale(fmt, seed = 1) {
  const rng = rngFor(seed * 7919 + 13); const r = () => 1 + Math.floor(rng() * 10);
  const cast = Array.from({ length: 12 }, (_, i) => ({
    name: `Q${i + 1}`, slug: `q${i + 1}`, gender: 'm', archetype: 'floater',
    stats: Object.fromEntries(STATS.map(k => [k, r()])),
    drag: { acting: r(), comedy: r(), dance: r(), design: r(), runway: r(), lipsync: r(), singing: r() },
  }));
  const res = playDragSeason({ cast, seed: seed * 101 + 7, config: { drFinale: fmt }, bond: () => 0, addBond: () => {}, popDelta: () => {} });
  return res.rows.find(x => x.dr?.finale);
}

const SCREENS = [
  ['finshowcase', rpBuildShowcase, /^finale:finale-showcase/],
  ['fininterview', rpBuildInterview, /^finale:finale-interview/],
  ['fincut', rpBuildCut, /^finale:finale-cut/],
  ['fincrownls', rpBuildCrownLipSync, /^finale:(finale-crown-lipsync|finale-preduel|duel-beat|duel-hook)$/],
];
const plain = html => html.replace(/<style[\s\S]*?<\/style>/g, '');
const escd = t => t.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

describe('the finale stages', () => {
  it('every format: one stage, one card per step, a count that matches, every line drawn', () => {
    let drawn = 0;
    for (const fmt of FORMATS) {
      const row = finale(fmt);
      for (const [suffix, build, kinds] of SCREENS) {
        const html = build(row);
        const lines = row.dr.scenes.filter(s => kinds.test(s.kind || '') && s.text);
        if (!lines.length) { expect(html, `${fmt} ${suffix}`).toBe(''); continue; }
        expect(html.match(/class="fsx"/g) || [], `${fmt} ${suffix}`).toHaveLength(1);
        const ids = [...html.matchAll(new RegExp(`id="dr-step-${suffix}-(\\d+)"`, 'g'))].map(m => Number(m[1]));
        expect(ids).toEqual(ids.map((_, i) => i));
        expect(Number(new RegExp(`drRevealNext\\('${suffix}', (\\d+)`).exec(html)?.[1])).toBe(ids.length);
        for (const sc of lines) {
          expect(plain(html), `${fmt} ${suffix}: ${sc.text.slice(0, 50)}`).toContain(escd(sc.text.slice(0, 40)));
          drawn++;
        }
      }
    }
    expect(drawn).toBeGreaterThan(0);
  });

  it('a bracket shows no pairing and no result before its round', () => {
    const html = rpBuildCrownLipSync(finale('top4'));
    const host = document.createElement('div');
    host.innerHTML = html;
    const boxes = [...host.querySelectorAll('[data-box]')];
    expect(boxes).toHaveLength(3);
    for (const b of boxes) expect(b.querySelector('[data-ba]').textContent).toBe('?');
    expect(host.querySelectorAll('.clx-q[class*="st-"]')).toHaveLength(0);
  });

  it('the rails do not print the finishing order', () => {
    for (const fmt of FORMATS) {
      const row = finale(fmt);
      for (const [, build] of SCREENS) {
        const html = build(row);
        if (!html) continue;
        const host = document.createElement('div');
        host.innerHTML = html;
        const rail = [...host.querySelectorAll('.dr-nm')].map(x => x.textContent.trim());
        expect(rail).toEqual([...rail].sort((a, b) => a.localeCompare(b)));
      }
    }
  });

  it('the cut darkens nobody before a click', () => {
    for (const fmt of ['perform-then-lipsync', 'perform-then-lipsync-3']) {
      const host = document.createElement('div');
      host.innerHTML = rpBuildCut(finale(fmt));
      const qs = [...host.querySelectorAll('.ctx-q')];
      expect(qs.length).toBeGreaterThan(2);
      for (const q of qs) expect(q.className, fmt).toBe('ctx-q');
      const names = qs.map(q => q.dataset.q);
      expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
    }
  });

  it('the crowning stage is at rest until clicked', () => {
    for (const fmt of FORMATS) {
      const host = document.createElement('div');
      host.innerHTML = rpBuildCrowning(finale(fmt));
      const stage = host.querySelector('#cr-stage');
      expect(stage.dataset.phase).toBe('idle');
      expect(stage.querySelector('[data-bn]').textContent).toBe('');
      expect(stage.querySelector('[data-quote]').textContent.trim()).toBe('');
      for (const cls of ['sashed', 'regal', 'stamped', 'crowned', 'out']) {
        expect(stage.querySelectorAll(`.cr-plate.${cls}`), `${fmt} ${cls}`).toHaveLength(0);
      }
    }
  });
});

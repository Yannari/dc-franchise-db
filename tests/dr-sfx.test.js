// @vitest-environment jsdom
// ══════════════════════════════════════════════════════════════════════
// dr-sfx.test.js — the room reacts (js/vp-dr/sfx.js), and the soundtrack
// ══════════════════════════════════════════════════════════════════════
import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { lipsyncSfxOf, sfxOfStep, tagSfx, SFX_VOICES, DRAG_SFX } from '../js/vp-dr/sfx.js';
import { tagStep, momentForFile, songForFile, DRAG_SITUATIONS } from '../js/vp-dr/music.js';
import { rpBuildLipSync, rpBuildResults } from '../js/vp-dr/results.js';
import { playDragSeason } from '../js/dr/season.js';
import { rngFor } from '../js/dr/rng.js';

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty', 'boldness', 'intuition', 'temperament'];
function cast(n = 12, seed = 1) {
  const rng = rngFor(seed); const r = () => 1 + Math.floor(rng() * 10);
  return Array.from({ length: n }, (_, i) => ({
    name: `Queen${i + 1}`, slug: `queen${i + 1}`, gender: 'f', archetype: 'hero', age: 25,
    stats: Object.fromEntries(STATS.map(k => [k, r()])),
    drag: { acting: r(), comedy: r(), dance: r(), design: r(), runway: r(), lipsync: r(), singing: r() },
  }));
}
const bonds = {}; const key = (a, b) => [a, b].sort().join('|');
const { rows } = playDragSeason({ cast: cast(12, 6), seed: 3, bond: (a, b) => bonds[key(a, b)] || 0,
  addBond: (a, b, d) => { const k = key(a, b); bonds[k] = (bonds[k] || 0) + d; } });

describe('every effect exists', () => {
  it('has a voice for every name a file can replace', () => {
    expect(Object.keys(SFX_VOICES).sort()).toEqual([...DRAG_SFX].sort());
  });
  it('files an upload named after an effect, and nothing else', () => {
    expect(momentForFile('sfx-cheer.mp3')).toBe('sfx-cheer');
    expect(momentForFile('sfx-roar #2.mp3')).toBe('sfx-roar');
    expect(momentForFile('sfx-banana.mp3')).toBe(null);
    for (const n of DRAG_SFX) expect(songForFile(`sfx-${n}.mp3`), n).toBe(null);
  });
});

describe('the lip sync sounds like what happened', () => {
  it('reads the scene', () => {
    expect(lipsyncSfxOf({ kind: 'stage:lipsync-intro' })).toBe('stinger');
    expect(lipsyncSfxOf({ kind: 'stage:lipsync-beat', data: { tier: 'legendary' } })).toBe('roar');
    expect(lipsyncSfxOf({ kind: 'stage:lipsync-beat', data: { tier: 'trying' } })).toBe(null);
    expect(lipsyncSfxOf({ kind: 'stage:lipsync-stunt', data: { tier: 'landed' } })).toBe('slam');
    expect(lipsyncSfxOf({ kind: 'stage:lipsync-stunt', data: { tier: 'failed' } })).toBe('gasp');
    expect(lipsyncSfxOf({ kind: 'stage:lipsync-shantay' })).toBe('shantay');
    expect(lipsyncSfxOf({ kind: 'stage:lipsync-sashay' })).toBe('sashay');
    expect(lipsyncSfxOf({ kind: 'confess:x' })).toBe(null);
  });

  it('puts them on the real screen: the drop, the room, the verdict', () => {
    let screens = 0;
    for (const row of rows.filter(r => r.dr.lipsync && !r.dr.finale)) {
      document.body.innerHTML = rpBuildLipSync(row);
      const fx = [...document.querySelectorAll('.dr-step')].map(e => e.dataset.sfx).filter(Boolean);
      if (!fx.length) continue;
      screens += 1;
      expect(fx[0], `episode ${row.num}`).toBe('stinger');
      expect(fx.some(f => /shantay|sashay|win/.test(f)), `episode ${row.num}: ${fx}`).toBe(true);
      // The song still plays under it: the card keeps its music tag.
      expect(document.querySelector('[data-song]'), `episode ${row.num}`).toBeTruthy();
    }
    expect(screens).toBeGreaterThan(5);
  });

  it('gives the call its heartbeat and its win', () => {
    const row = rows.find(r => !r.dr.finale && (r.dr.call?.win || []).length);
    document.body.innerHTML = rpBuildResults(row);
    const fx = [...document.querySelectorAll('.dr-step')].map(e => e.dataset.sfx).filter(Boolean);
    expect(fx).toContain('win');
    expect(fx).toContain('stinger');
  });
});

describe('which card gets which sound', () => {
  const el = (attrs) => { const d = document.createElement('div'); Object.assign(d.dataset, attrs); return d; };
  it('its own tag, then the first winner card, then the screen', () => {
    expect(sfxOfStep('lipsync', el({ sfx: 'gasp' }), null)).toBe('gasp');
    expect(sfxOfStep('lipsync', el({ sfx: 'none', music: 'winner' }), null)).toBe(null);
    expect(sfxOfStep('fincrown', el({ music: 'crowned' }), el({}))).toBe('win');
    expect(sfxOfStep('fincrown', el({ music: 'crowned' }), el({ music: 'crowned' }))).toBe(null);   // one win, not five
    expect(sfxOfStep('runway', el({}), null)).toBe('flash');
    expect(sfxOfStep('werk', el({}), null)).toBe(null);
  });
  it('tags a card that already carries its music', () => {
    const html = tagSfx(tagStep('<div class="dr-step" id="x">hi</div>', 'winner'), 'win');
    expect(html).toContain('data-music="winner"');
    expect(html).toContain('data-sfx="win"');
  });
});

describe('the soundtrack', () => {
  it('points every moment at a file that exists', () => {
    const m = JSON.parse(readFileSync('assets/audio/drag/manifest.json', 'utf8'));
    for (const [sit, list] of Object.entries(m)) {
      if (!Array.isArray(list)) continue;
      expect(DRAG_SITUATIONS, sit).toContain(sit);
      for (const t of list) expect(existsSync(`assets/audio/drag/${t.file}`), `${sit}: ${t.file}`).toBe(true);
    }
  });
});

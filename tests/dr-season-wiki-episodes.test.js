// @vitest-environment jsdom
// ══════════════════════════════════════════════════════════════════════
// dr-season-wiki-episodes.test.js — the season article has episodes in it
// ══════════════════════════════════════════════════════════════════════
//
// Four real Drag Race season pages were read through the wiki API before this
// was written (seasons 13-16). Their skeleton is Contestants, an earnings
// table, the track record chart, and then the part people actually go to
// those pages for: ONE BLOCK PER EPISODE, in a fixed order — maxi challenge,
// runway theme, mini, guest judge, winner, bottom two, lip sync song, who
// went home.
//
// Ours had the chart and stopped there.
//
// Every field was already in the season document; nothing needed exporting
// differently, only drawing. And the flavour is the half a fandom article
// cannot print: the document carries `panelRank` AND `finalRank`, so this can
// say what the room thought before the host overruled it.
import { describe, expect, it } from 'vitest';
import { playDragSeason } from '../js/dr/season.js';
import { buildDragSeasonDocument } from '../js/dr/export.js';
import { rngFor } from '../js/dr/rng.js';
import { _dragEpisodeBlocks } from '../js/season-wiki-tab.js';

const S = ['physical','endurance','mental','social','strategic','loyalty','boldness','intuition','temperament'];
const cast = (n, seed) => {
  const rng = rngFor(seed); const r = () => 1 + Math.floor(rng() * 10);
  return Array.from({ length: n }, (_, i) => ({
    name: `Q${i + 1}`, slug: `q${i + 1}`, gender: 'm', archetype: 'wildcard', age: 21 + i,
    stats: Object.fromEntries(S.map(k => [k, r()])),
    drag: { acting: r(), comedy: r(), dance: r(), design: r(), runway: r(), lipsync: r(), singing: r() },
  }));
};
const esc = v => String(v ?? '');
const doc = seed => {
  const out = playDragSeason({ cast: cast(12, 400 + seed), seed, config: { drFinale: 'top4' } });
  return { doc: buildDragSeasonDocument(out.rows, { seasonNumber: 1 }), out };
};
const html = seed => _dragEpisodeBlocks(doc(seed).doc, esc, () => '');
const text = h => h.replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ');

describe('the episode list', () => {
  it('draws one block per episode', () => {
    const d = doc(1);
    const blocks = html(1).split('<article').length - 1;
    expect(blocks).toBe(d.doc.dr.episodes.length);
    expect(blocks).toBeGreaterThan(5);
  });

  it('carries the fields a real season article carries', () => {
    const t = text(html(1));
    for (const field of ['Maxi challenge', 'Runway', 'Winner', 'Bottom two', 'Lip sync', 'Eliminated']) {
      expect(t, `no "${field}" in the episode block`).toContain(field);
    }
  });

  it('names BOTH queens in the bottom two', () => {
    /* Filtering on BTM2 alone returns the survivor only — the queen who lost
       the song carries ELIM by then — so this printed one name. The lip sync
       knows the pair exactly. */
    const { doc: d } = doc(1);
    const blocks = html(1).split('<article').slice(1);
    let checked = 0;
    d.dr.episodes.forEach((e, i) => {
      const pair = (e.lipsync && e.lipsync.queens) || [];
      if (pair.length !== 2) return;
      checked++;
      const t = text(blocks[i]);
      for (const n of pair) expect(t, `episode ${e.episode} omits ${n}`).toContain(n);
    });
    expect(checked, 'no lip syncs to check').toBeGreaterThan(3);
  });

  it('says when the host overruled the panel — the flavour', () => {
    /* The half a fandom page cannot have. Across a few seasons the host
       bends SOMETHING, and when he takes the win off the panel's first place
       the block says so by name. */
    let said = 0;
    for (let s = 0; s < 8; s++) {
      if (/The panel had|The host moved/.test(html(s))) said++;
    }
    expect(said, 'no season ever mentions the host disagreeing').toBeGreaterThan(0);
  });

  it('does not invent a bottom two on a night nobody went home', () => {
    const { doc: d } = doc(1);
    const blocks = html(1).split('<article').slice(1);
    d.dr.episodes.forEach((e, i) => {
      const gone = (e.exits || []).length;
      if (gone) return;
      expect(text(blocks[i])).toContain('nobody went home');
    });
  });
});

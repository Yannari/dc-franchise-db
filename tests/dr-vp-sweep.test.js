// @vitest-environment jsdom
// ══════════════════════════════════════════════════════════════════════
// dr-vp-sweep.test.js — every screen, every episode, and the read
// ══════════════════════════════════════════════════════════════════════
//
// Plan 5 Task 9. The sweep that catches what a per-screen test cannot: a
// screen that claims an episode and draws nothing, a beat that reaches no
// screen, and prose that reads as broken once it is stripped of markup.
import { describe, expect, it, beforeEach } from 'vitest';
import { DRAG_SCREENS, dragScreens, sceneSections } from '../js/vp-dr/screens.js';
import { generateDragSummaryText } from '../js/vp-dr/summary.js';
import { playDragSeason } from '../js/dr/season.js';
import { foreignWordsIn } from './helpers/show-vocabulary.js';
import { rngFor } from '../js/dr/rng.js';

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty', 'boldness', 'intuition', 'temperament'];
const rng = rngFor(6); const r = () => 1 + Math.floor(rng() * 10);
const cast = Array.from({ length: 13 }, (_, i) => ({
  name: `Queen${i + 1}`, slug: `queen${i + 1}`, gender: 'f', archetype: 'hero', age: 24 + i,
  stats: Object.fromEntries(STATS.map(k => [k, r()])),
  drag: { acting: r(), comedy: r(), dance: r(), design: r(), runway: r(), lipsync: r(), singing: r() },
}));
const bonds = {}; const key = (a, b) => [a, b].sort().join('|');
const { rows } = playDragSeason({
  cast, seed: 5,
  bond: (a, b) => bonds[key(a, b)] || 0,
  addBond: (a, b, d) => { const k = key(a, b); bonds[k] = Math.max(-10, Math.min(10, (bonds[k] || 0) + d)); },
});

beforeEach(() => {
  window._tvState = {}; window._drSidebar = {}; window._drSeasonRows = rows;
});

describe('the sweep', () => {
  it('NO SCREEN CLAIMS AN EPISODE AND THEN DRAWS NOTHING', () => {
    // `when()` saying yes and `build()` returning '' is the quietest failure
    // this registry has: the tab is simply absent and nothing says why.
    for (const row of rows) {
      const drew = new Set(dragScreens(row).map(s => s.id));
      for (const s of DRAG_SCREENS) {
        if (!s.when(row)) continue;
        expect(drew.has(s.id), `${s.id} claimed episode ${row.num} and drew nothing`).toBe(true);
      }
    }
  });

  it('draws a full season without a gap', () => {
    let total = 0;
    for (const row of rows) {
      const built = dragScreens(row);
      total += built.length;
      expect(built.length, `episode ${row.num} has no screens`).toBeGreaterThan(0);
      for (const s of built) {
        expect(s.html.length, `${s.id} on episode ${row.num}`).toBeGreaterThan(300);
      }
    }
    // A 13-queen season is ~14 screens an episode. A collapse shows up here
    // before it shows up in a browser.
    expect(total).toBeGreaterThan(100);
  });

  it('every scene still reaches a screen', () => {
    for (const row of rows) {
      const filed = [...sceneSections(row).values()].reduce((n, l) => n + l.length, 0);
      expect(filed, `episode ${row.num}`).toBe((row.dr.scenes || []).length);
    }
  });

  it('EVERY WRITTEN SCENE IS ACTUALLY DRAWN, not merely filed', () => {
    /* THE HOLE THE TEST ABOVE LEAVES, and it is the one that mattered.
       `sceneSections` files every scene into a section bucket, so that check
       passes as long as a bucket exists — it says nothing about whether the
       section's BUILDER reads the bucket. Several do not: the critiques
       screen builds its cards from `dr.critiques`, the runway screen looks up
       two kinds by name, the results screen walks the call. A scene filed
       into one of those sections and ignored by its builder is filed, counted,
       and invisible.

       That is exactly how `stage:deliberation` survived: written prose in
       stage-beats.js, emitted every single week, filed under the critiques
       section, and not one reference to it anywhere in js/vp-dr. It was
       shipped and shown to nobody for the life of the show.

       So this asserts the only thing that actually matters — the words reach
       a page. Rendering every screen of every episode and searching the HTML
       is slow and blunt and catches a whole class of bug that no per-screen
       test can, because the failure is always a screen NOT doing something. */
    const missing = [];
    for (const row of rows) {
      const html = dragScreens(row).map(s => s.html).join(' ');
      const plain = html.replace(/<style[\s\S]*?<\/style>/g, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&rsquo;/g, "'")
        .replace(/&mdash;/g, '—').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
        .replace(/\s+/g, ' ');
      for (const sc of row.dr.scenes || []) {
        if (!sc.text || sc.text.length < 40) continue;
        // A distinctive slice from the middle, so a card that truncates the
        // opening or wraps the tail still counts as having drawn it.
        const probe = sc.text.slice(10, 60).replace(/\s+/g, ' ');
        if (!plain.includes(probe)) missing.push(`ep${row.num} ${sc.kind} (${sc.step})`);
      }
    }
    const kinds = [...new Set(missing.map(m => m.split(' ')[1]))];
    expect(kinds, `written scenes that no screen draws: ${kinds.join(', ')}`).toEqual([]);
  });
});

describe('the transcript, read', () => {
  const text = generateDragSummaryText(rows[4]);

  it('carries every screen of the night, in the running order', () => {
    const want = ['COLD OPEN', 'THE WERK ROOM', 'MINI', 'THE BRIEF', 'PREP',
      'ELIMINATION DAY', 'MAIN STAGE', 'RUNWAY', 'CRITIQUES', 'UNTUCKED',
      'THE CALL', 'LIP SYNC'];
    let at = -1;
    for (const h of want) {
      const i = text.indexOf(`\n${h}\n`);
      expect(i, `${h} is missing from the transcript`).toBeGreaterThan(-1);
      expect(i, `${h} is out of running order`).toBeGreaterThan(at);
      at = i;
    }
  });

  it('LEAVES NO RAW MARKUP OR UNDECODED ENTITY', () => {
    /* Every one of these reached a reader mid-sentence at some point in this
       task: `&amp;` from an ampersand escaped twice, `&times;` from an
       entity the decoder did not know, and `id="dr-step-…">` from a split
       that ate the `<` its stripper was looking for. */
    expect(text).not.toMatch(/&[a-z]+;|&#\d+;/i);
    expect(text).not.toMatch(/id="dr-|class="dr-|<\/?[a-z]/i);
  });

  it('reads as paragraphs, not as one run-on or a field of blanks', () => {
    const lines = text.split('\n');
    const body = lines.filter(l => l.startsWith('  ') && l.trim());
    expect(body.length, 'the transcript collapsed to nothing').toBeGreaterThan(30);
    // No run of blank lines: stripping tags used to leave one per empty span.
    expect(text).not.toMatch(/\n\s*\n\s*\n\s*\n/);
    // And no single paragraph swallowing the whole screen.
    /* 2200, NOT 1400. The cap was set when a performance card was a portrait,
       a score bar and a detail panel — no words. The cards carry the night's
       narration now (the maxi screen went from 657 characters to 10,299), so
       one beat is legitimately a card plus its paragraph. The check still
       does its job: it catches a beat that has swallowed the NEXT one, which
       is what a run-on looks like, rather than a card that simply has prose
       on it. */
    /* 2600, AND THE REASON IS THE SAME ONE AS LAST TIME. The cap was 1400
       when a card was a portrait and a score bar, and 2200 once the cards
       carried the night's narration. A critique is now a measured reason plus
       a bias clause joined into one paragraph, which is legitimately longer
       again. The check still does its job — it catches a beat that has
       swallowed the NEXT one, which is what a run-on looks like — rather than
       a card that simply has more prose on it than it used to. */
    for (const l of body) expect(l.length, 'a beat ran into the next').toBeLessThan(2600);
  });

  it('THE COLD OPEN DOES NOT CARRY TONIGHT\'S EXIT MESSAGE', () => {
    /* It matched any kind containing "mirror-message", which includes
       `stage:mirror-message` — written at the END of the same episode by the
       queen who had not left yet. The cold open opened on her words over a
       card naming somebody else: a spoiler and a contradiction together.

       THE RULE IS STRUCTURAL, NOT "her name must not appear". This checked
       that the cold open never contains tonight's eliminated queen at all,
       which is stricter than the bug and wrong as a rule: she is in the room
       all episode, and `bottom-hangover` -- she survived last night's lip
       sync and has to walk back in and be normal -- is ABOUT her, from a
       night that has already happened. The assertion only held while that
       event was rare, and it began failing when a BTM/BTM2 fix doubled how
       often it fires. What must never happen is a scene written at the END of
       an episode being drawn at the START of it. */
    const row = rows.find(r2 => (r2.exits || []).length && r2.num > 1);
    const coldScenes = (row.dr.scenes || []).filter(sc => sc.step === 'cold-open');
    expect(coldScenes.length, 'no cold open at all').toBeGreaterThan(0);
    for (const sc of coldScenes) {
      expect(sc.kind, `${sc.kind} is an end-of-episode scene in the cold open`)
        .not.toMatch(/^stage:|^finale:|^exit$/);
    }
    // And tonight's result cannot be foretold in it.
    const cold = generateDragSummaryText(row).split('\nTHE WERK ROOM\n')[0];
    expect(cold).not.toMatch(/sashay|shantay|condragulation/i);
  });

  it('speaks this show and no other, all season', () => {
    for (const row of rows) {
      expect(foreignWordsIn(generateDragSummaryText(row), 'drag-race'), `episode ${row.num}`)
        .toEqual([]);
    }
  });
});

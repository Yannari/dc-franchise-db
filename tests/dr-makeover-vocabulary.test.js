// @vitest-environment jsdom
// ══════════════════════════════════════════════════════════════════════
// dr-makeover-vocabulary.test.js — the music video printed over a wig
// ══════════════════════════════════════════════════════════════════════
//
// "This is for the makeover challenge, the text are wrong."
//
// Episode eleven, makeover night. Six queens, each paired with somebody, and
// every card on the screen spoke music-video: "the host points at the call
// sheet", "the role exists in the video", "the camera will find everyone",
// "standard". The board above them read "The Line-Up — 6 different acts
// across 6 queens" over six pairs.
//
// The renderer already had a fix for exactly this and it had a hole in it. It
// told a makeover from a music video by asking whether `assignedBy` was set —
// paired by a QUEEN gets the pairing beat, cast by the HOST gets a call sheet
// — and `assignedBy` is the mini winner. An episode that books no mini has no
// mini winner, `assigner` is null, every pick reads `{ chosen: false,
// assignedBy: null }`, and the whole room falls through to the call sheet.
//
// So the flag is about what the CHALLENGE is rather than about who happened
// to hand the room out. `paired` is on every pick the makeover makes, whoever
// did the pairing and whether anybody did.
//
// And the second half of the same report: "the makeover partners are not even
// there." They were not. Every pairing and walkthrough line said "her
// partner" over a person the pick has carried a name for since the module was
// written — a whole makeover in which the person being made over is never
// once addressed.
import { describe, expect, it } from 'vitest';
import { playDragSeason } from '../js/dr/season.js';
import { rpBuildChoice } from '../js/vp-dr/challenge.js';
import { rngFor } from '../js/dr/rng.js';

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];
const cast = (n, seed) => {
  const r = rngFor(seed); const d = () => 1 + Math.floor(r() * 10);
  return Array.from({ length: n }, (_, i) => ({
    name: `Q${i + 1}`, slug: `q${i + 1}`, gender: 'f', archetype: 'hero', age: 25,
    stats: Object.fromEntries(STATS.map(k => [k, d()])),
    drag: { acting: d(), comedy: d(), dance: d(), design: d(), runway: d(), lipsync: d(), singing: d() },
  }));
};

/** A makeover, booked rather than hoped for, in whichever shape is asked. */
function makeover(pin, seed = 5) {
  const s = playDragSeason({
    cast: cast(10, 9), seed, config: { drSchedule: [{ maxiId: 'makeover', ...pin }] },
  });
  const row = s.rows.find(r => r.dr?.challenge?.id === 'makeover');
  expect(row, 'the makeover was pinned and did not happen').toBeTruthy();
  return row;
}
const choiceText = row => (row.dr.scenes || [])
  .filter(sc => sc.step === 'choice' && sc.text).map(sc => sc.text).join('\n');
const prepText = row => (row.dr.scenes || [])
  .filter(sc => /walkthrough/.test(sc.kind)).map(sc => sc.text).join('\n');
// The markup, not the stylesheet — every class here is also a CSS rule.
const body = row => rpBuildChoice(row).replace(/<style[\s\S]*?<\/style>/g, '');

/* THE THREE WAYS A MAKEOVER ROOM GETS HANDED OUT. Only the first has an
   `assignedBy` on it, and the first is the only one that ever worked. */
const SHAPES = [
  ['the mini winner pairs the room', { episode: 4, makeoverPool: 'superfans', miniId: 'quick-drag' }],
  ['no mini, so the room draws', { episode: 4, makeoverPool: 'superfans', miniId: null }],
  ['loved ones, so nobody is paired with anybody', { episode: 6, makeoverPool: 'loved-ones' }],
];

/* The music video's vocabulary, verbatim off the reported screen. Not one of
   these words belongs on a night about a wig. */
const MUSIC_VIDEO = /call sheet|the video|on camera|the camera will|the shoot|ensemble|the lead\b/i;

describe('a makeover never speaks music video', () => {
  for (const [label, pin] of SHAPES) {
    describe(label, () => {
      const row = makeover(pin);

      it('marks every pick as paired, whoever did the pairing', () => {
        const picks = Object.values(row.dr.assignment.picks || {});
        expect(picks.length, 'nobody was paired with anybody').toBeGreaterThan(2);
        for (const p of picks) {
          expect(p.paired, `${p.name} carries no makeover marker`).toBe(true);
          expect(p.pairing, `${p.name} was paired for no stated reason`).toBeTruthy();
        }
      });

      it('draws the pairing beat and never the call sheet', () => {
        const kinds = new Set((row.dr.scenes || [])
          .filter(sc => sc.step === 'choice').map(sc => sc.data?.beat).filter(Boolean));
        expect(kinds.has('paired-off'), 'nobody was narrated as paired').toBe(true);
        expect(kinds.has('call-sheet'), 'a makeover drew the music video call sheet')
          .toBe(false);
        expect(kinds.has('pick-reaction'), 'a makeover was narrated as a draft')
          .toBe(false);
      });

      it('says nothing about a video, a shoot or a call sheet', () => {
        const said = `${choiceText(row)}\n${prepText(row)}`;
        const hit = said.split('\n').find(l => MUSIC_VIDEO.test(l));
        expect(hit, `music-video words on a makeover: ${hit}`).toBeUndefined();
      });

      it('names the person being made over', () => {
        /* "Her partner" over a person the pick has a name for. Six of them in
           one prep room and none of them addressed. */
        const said = `${choiceText(row)}\n${prepText(row)}`;
        expect(said, 'the partner is still "her partner"').not.toMatch(/her partner/i);
        const names = Object.values(row.dr.assignment.picks || {})
          .map(p => p.choice).filter(Boolean);
        const named = names.filter(nm => said.includes(nm));
        expect(named.length, `only ${named.length} of ${names.length} partners are named`)
          .toBeGreaterThan(names.length / 2);
      });

      it('leaves no unfilled placeholder in a pairing line', () => {
        /* `{b}` is the queen who paired her, and on the assigner's own card
           there is no second queen — it filled as the empty string and the
           line read: I am keeping Casey.<space><space>does not dress it up. */
        const said = `${choiceText(row)}\n${prepText(row)}`;
        expect(said).not.toMatch(/\{[a-z]\}/);
        expect(said, 'a name was dropped and left a double space')
          .not.toMatch(/[."] {2}\S/);
      });

      it('heads the board as pairings rather than as a line-up of acts', () => {
        const html = body(row);
        expect(html).toMatch(/The pairings/);
        expect(html, 'a paired room counted as different acts')
          .not.toMatch(/different acts across/);
      });

      it('runs no won-or-lost confessional over a pick nobody made', () => {
        /* "I got what I wanted. That does not happen in here," over a partner
           she pulled out of a bag thirty seconds ago. Nobody chose anything
           on this night, so there is nothing to have won or missed. */
        const bad = (row.dr.scenes || [])
          .filter(sc => /^confess:/.test(sc.kind) && /choice-(mine|hers)-/.test(sc.kind));
        expect(bad.map(sc => sc.kind), 'a pairing was narrated as a pick won or lost')
          .toEqual([]);
      });
    });
  }
});

describe('and it still says who did it, when somebody did', () => {
  it('credits the mini winner on the board', () => {
    const row = makeover({ episode: 4, makeoverPool: 'superfans', miniId: 'quick-drag' });
    const by = Object.values(row.dr.assignment.picks).find(p => p.assignedBy)?.assignedBy;
    expect(by, 'the mini winner paired nobody').toBeTruthy();
    expect(body(row)).toContain(`paired by ${by}`);
    // And she kept the best for herself, which is its own card.
    expect(row.dr.assignment.picks[by].pairing).toBe('kept-the-best');
  });

  it('credits nobody when nobody did it', () => {
    const row = makeover({ episode: 4, makeoverPool: 'superfans', miniId: null });
    expect(Object.values(row.dr.assignment.picks).every(p => !p.assignedBy)).toBe(true);
    expect(body(row)).not.toMatch(/paired by/);
    expect(row.dr.assignment.division).toBe('drawn');
  });
});

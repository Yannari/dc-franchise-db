// @vitest-environment jsdom
// ══════════════════════════════════════════════════════════════════════
// dr-vp-challenge.test.js — the brief, the draft, prep, and the maxi
// ══════════════════════════════════════════════════════════════════════
import { describe, expect, it, beforeEach } from 'vitest';
import {
  rpBuildMini, rpBuildMaxiAnnounce, rpBuildChoice, rpBuildPrep, rpBuildMaxi,
} from '../js/vp-dr/challenge.js';
import { maxiById } from '../js/dr/data/challenges.js';
import { playDragSeason } from '../js/dr/season.js';
import { foreignWordsIn } from './helpers/show-vocabulary.js';
import { rngFor } from '../js/dr/rng.js';
import { readFileSync } from 'node:fs';

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty', 'boldness', 'intuition', 'temperament'];
function cast(n = 12, seed = 1) {
  const rng = rngFor(seed); const r = () => 1 + Math.floor(rng() * 10);
  return Array.from({ length: n }, (_, i) => ({
    name: `Queen${i + 1}`, slug: `queen${i + 1}`, gender: 'f',
    archetype: 'hero', age: 25, stats: Object.fromEntries(STATS.map(k => [k, r()])),
    drag: { acting: r(), comedy: r(), dance: r(), design: r(), runway: r(), lipsync: r(), singing: r() },
  }));
}
const bonds = {}; const key = (a, b) => [a, b].sort().join('|');
/* THE CHALLENGES THESE TESTS NEED ARE PINNED, NOT HOPED FOR.
   Four of the cases below look up a specific challenge — the Ball's three
   looks, the Snatch Game's characters, the makeover's partner, a team card —
   and they used to find them because this seed happened to schedule them.
   It stopped happening: six tentpoles compete for five slots on an eight
   episode season, so one is dropped, and which one is now drawn rather than
   being whichever sat last in the TENTPOLES array. The Ball lost the draw and
   a test about how a Ball is DRAWN failed for a reason that has nothing to do
   with drawing a Ball.
   A test that needs a Ball books a Ball. */
const { rows } = playDragSeason({
  cast: cast(12, 6), seed: 3,
  config: {
    drSchedule: [
      { episode: 2, maxiId: 'snatch-game' },
      { episode: 3, maxiId: 'ball' },
      { episode: 4, maxiId: 'makeover' },
      { episode: 5, maxiId: 'girl-group' },
    ],
  },
  bond: (a, b) => bonds[key(a, b)] || 0,
  addBond: (a, b, d) => { const k = key(a, b); bonds[k] = Math.max(-10, Math.min(10, (bonds[k] || 0) + d)); },
});
const ordinary = rows.filter(r => !r.dr.finale);
const strip = h => h.replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ');
const byId = id => ordinary.find(r => r.dr.challenge?.id === id);

beforeEach(() => { window._tvState = {}; window._drSidebar = {}; });

describe('the brief', () => {
  it('DRAWS THE DESCRIPTION IN FULL', () => {
    /* `desc` is the only place the viewer is told what the queens are
       physically doing — the narration says what happened, not what the
       rules were. A truncated brief leaves a result nobody can follow, which
       is a project rule with its own test on the Big Brother side. */
    for (const row of ordinary) {
      const cat = maxiById(row.dr.challenge.id);
      if (!cat?.desc) continue;
      const text = strip(rpBuildMaxiAnnounce(row)).replace(/\s+/g, ' ');
      expect(text, `episode ${row.num}: the brief was cut`)
        .toContain(cat.desc.replace(/\s+/g, ' ').trim());
    }
  });

  it('names the challenge and its format', () => {
    const row = ordinary[0];
    const html = rpBuildMaxiAnnounce(row);
    expect(html).toContain(row.dr.challenge.name);
    expect(html).toMatch(/dr-fmt/);
  });
});

describe('the maxi', () => {
  it('gives every queen who performed a card, with her score', () => {
    for (const row of ordinary) {
      const html = rpBuildMaxi(row);
      const names = Object.keys(row.dr.performances || {});
      expect(html.length, `episode ${row.num} drew nothing`).toBeGreaterThan(400);
      for (const n of names) expect(html, `${n} on episode ${row.num}`).toContain(n);
      /* THE STEP IDS ARE KEYED BY WHICH MAXI SCREEN THIS IS. A challenge
         filmed during the week and one performed live on the main stage are
         two sections in two different slots of the night, so they carry two
         suffixes — `maxi` and `maxistage` — and this looked only for the
         first. It passed for as long as the two were one screen. */
      // From the CATALOGUE, which is where the stage lives — the row's own
      // challenge object does not carry it, so reading it there silently
      // treated every challenge as a main-stage one.
      /* Three challenges draw their own screen with their own step structure,
         each covered by its own case: the Ball's looks, the Snatch Game's
         characters, and the LaLaPaRUza's bracket (`dr-step-tournament-N`).

         THE LALAPARUZA WAS NOT IN THIS LIST BECAUSE THIS SEED HAD NEVER DRAWN
         ONE. It is not a pinned tentpole like the other three, so it sat in
         the random tail of the schedule — and an unrelated change elsewhere
         that drew one fewer random number moved it onto episode 11 and this
         assertion failed on a screen that was working perfectly. The same
         trap the drSchedule block above this was written for. */
      const ownScreen = ['ball', 'snatch-game', 'lipsync-challenge'];
      if (ownScreen.includes(row.dr.challenge?.id)) {
        // Not a free pass: it still has to have drawn something per queen.
        expect(html.match(/id="dr-step-[a-z-]+-\d+"/g) || [],
          `episode ${row.num} (${row.dr.challenge?.id}) drew no steps at all`)
          .not.toHaveLength(0);
        continue;
      }
      const sfx = maxiById(row.dr.challenge?.id)?.stage === 'pre' ? 'maxi' : 'maxistage';
      // String.raw: in a plain template literal that \d is a JavaScript
      // escape and the pattern becomes "d+", which matches nothing.
      const steps = (html.match(new RegExp(String.raw`id="dr-step-${sfx}-\d+"`, 'g')) || []);
      expect(steps.length, `episode ${row.num} (${row.dr.challenge?.id})`)
        .toBe(names.length);
    }
  });

  it('SNATCH GAME SHOWS THE CHARACTER AND THE GAME SHOW FORMAT', () => {
    const row = byId('snatch-game');
    expect(row, 'no Snatch Game in this season').toBeTruthy();
    const html = rpBuildMaxi(row);
    const one = Object.values(row.dr.performances)[0];
    expect(html).toContain(one.detail.character);
    expect(html, 'has the game-show desk').toContain('sg-desk');
    expect(html, 'has round headers').toContain('sg-round-hdr');
    expect(html, 'has answer cards').toContain('sg-answer');
    expect(html, 'has the laugh-o-meter').toMatch(/sg-meter/);
    expect(html, 'has the scoreboard').toContain('sg-scoreboard');
  });

  it('THE BALL SHOWS THREE LOOKS AND FLAGS THE SEWN ONE', () => {
    const row = byId('ball');
    expect(row, 'no Ball in this season').toBeTruthy();
    const html = rpBuildMaxi(row);
    const one = Object.values(row.dr.performances)[0];
    for (const look of one.detail.looks) expect(html).toContain(look.label);
    expect(html, 'the sewn look is not marked').toContain('✂');
  });

  it('the makeover names her partner and the team challenges name the team', () => {
    const mk = byId('makeover');
    if (mk) {
      const one = Object.values(mk.dr.performances)[0];
      expect(rpBuildMaxi(mk)).toContain(one.detail.partner);
    }
    const gg = byId('girl-group') || byId('music-video');
    if (gg) expect(rpBuildMaxi(gg)).toMatch(/dr-team/);
  });

  it('THE RAIL NEVER SHOWS A SCORE THE VIEWER HAS NOT REACHED', () => {
    const row = ordinary[0];
    if (!row) return;
    rpBuildMaxi(row);
    const sfx = maxiById(row.dr.challenge?.id)?.stage === 'pre' ? 'maxi' : 'maxistage';
    const panels = window._drSidebar[sfx];
    const order = (row.dr.assignment?.order || []).filter(n => row.dr.performances[n]);
    const running = order.length ? order : Object.keys(row.dr.performances);
    expect(panels.length).toBe(running.length);
    for (const later of running.slice(1)) {
      expect(panels[0], `${later} was on the board before her turn`).not.toContain(`>${later}<`);
    }
  });

  it('THE SNATCH GAME RAIL HAS PANELS AND HIDES SCORES UNTIL FINAL', () => {
    const row = byId('snatch-game');
    if (!row) return;
    rpBuildMaxi(row);
    const panels = window._drSidebar.maxi;
    expect(panels.length).toBeGreaterThan(1);
    expect(panels[0]).not.toMatch(/dr-c-win|dr-c-high|dr-c-safe|dr-c-low/);
    expect(panels[panels.length - 1]).toMatch(/dr-chip/);
  });

  it('falls back to a plain card rather than a blank one', () => {
    // A challenge type nobody has designed a panel for still plays and still
    // reads — it simply looks plain. A blank would be the failure.
    const fake = {
      num: 2,
      dr: {
        challenge: { id: 'not-a-real-type', name: 'Something New' },
        performances: { Queen1: { perf: 7.2, detail: {} } },
        assignment: { order: ['Queen1'] },
      },
    };
    const html = rpBuildMaxi(fake);
    expect(html).toContain('Queen1');
    expect(html).toContain('7.2');
  });
});

describe('the rest of the challenge screens', () => {
  it('the mini names the winner and what the win buys', () => {
    const row = ordinary.find(r => r.dr.mini);
    const html = rpBuildMini(row);
    expect(html).toContain(row.dr.mini.winner);
    expect(html).toContain(row.dr.mini.name);
  });

  it('every screen builds or declines, on every ordinary episode', () => {
    for (const row of ordinary) {
      for (const [name, fn] of [['mini', rpBuildMini], ['announce', rpBuildMaxiAnnounce],
        ['choice', rpBuildChoice], ['prep', rpBuildPrep], ['maxi', rpBuildMaxi]]) {
        let html;
        expect(() => { html = fn(row); }, `${name} on episode ${row.num}`).not.toThrow();
        // Declining is fine; a stub is not.
        if (html) expect(html.length, `${name} on episode ${row.num}`).toBeGreaterThan(300);
      }
    }
  });

  it("speaks this show's words only", () => {
    for (const row of ordinary.slice(0, 4)) {
      for (const fn of [rpBuildMini, rpBuildMaxiAnnounce, rpBuildPrep, rpBuildMaxi]) {
        const text = strip(fn(row) || '');
        expect(foreignWordsIn(text, 'drag-race'), `episode ${row.num}`).toEqual([]);
      }
    }
  });
});

describe('EVERY CHALLENGE HAS ITS OWN ROOM', () => {
  /* Nineteen challenges used to share six backdrops and one card, so four
     nights were "the studio" and five were "the stage". A Snatch Game and a
     Ball came out as the same screen in a different colour. The guard is an
     allowlist-free one on purpose: it starts from the challenges that exist
     and asks each of them for a room, rather than checking the rooms that
     happen to be written. */
  it('every maxi in the catalogue has a skin, a set and a palette', async () => {
    const { MAXI_TYPES } = await import('../js/dr/data/challenges.js');
    const { skinFor, SKIN_IDS } = await import('../js/vp-dr/challenge.js');
    const src = readFileSync('js/vp-dr/challenge.js', 'utf8');

    const missing = [];
    for (const m of MAXI_TYPES) {
      if (!SKIN_IDS.includes(m.id)) { missing.push(`${m.id}: no skin`); continue; }
      const skin = skinFor(m.id);
      if (!skin.props) missing.push(`${m.id}: no props`);
      if (!skin.sub) missing.push(`${m.id}: no subtitle`);
      if (!src.includes(`.dr-set-${m.id}{`)) missing.push(`${m.id}: no .dr-set-${m.id} room`);
      if (!src.includes(`.dr-chal-${m.id}{`)) missing.push(`${m.id}: no palette`);
    }
    expect(missing).toEqual([]);
  });

  it('no two challenges share a subtitle or a set of props', async () => {
    const { skinFor, SKIN_IDS } = await import('../js/vp-dr/challenge.js');
    const subs = SKIN_IDS.map(id => skinFor(id).sub);
    const props = SKIN_IDS.map(id => skinFor(id).props);
    const dupe = list => list.filter((v, i) => list.indexOf(v) !== i);
    expect(dupe(subs), 'two challenges are announced the same way').toEqual([]);
    expect(dupe(props), 'two challenges are drawn in the same room').toEqual([]);

    /* AND NO TWO LEAD COLOURS. Gold led five of the nineteen at first, so
       five different nights read as the gold one whatever room they were
       drawn in. The lead colour is the strongest signal on the screen. */
    const src = readFileSync('js/vp-dr/challenge.js', 'utf8');
    const leads = [...src.matchAll(/\.dr-chal-([a-z-]+)\{--c1:(#[0-9a-fA-F]{6})/g)]
      .map(m => m[2].toUpperCase());
    expect(leads.length).toBe(SKIN_IDS.length);
    expect(dupe(leads), 'two challenges lead on the same colour').toEqual([]);
  });
});

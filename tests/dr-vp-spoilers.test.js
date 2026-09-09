// @vitest-environment jsdom
// ══════════════════════════════════════════════════════════════════════
// dr-vp-spoilers.test.js — a screen may not answer its own question early
// ══════════════════════════════════════════════════════════════════════
//
// Three screens shipped with the result printed above the reveal, and all
// three were found by opening the page rather than by any assertion:
//
//   THE MINI  — "Priya takes it, and with it pick-order" as the header, over
//               eleven unrevealed beats. The rail said it at every index too.
//   THE SMACKDOWN — the bracket drawn complete at 28% opacity, every score
//               and the champion's name legible from the first frame, because
//               the `on` class that was supposed to fill it in was written by
//               nobody.
//   THE CROWNING — every duel result, the whole finishing order, the crown
//               and Miss Congeniality, all at 0 / 5, on the screen whose only
//               job in the season is to withhold exactly those four things.
//
// A screen has two regions: the steps, which the viewer clicks to see, and
// everything else, which is on the page the moment it opens. This asserts
// that the second region does not name a queen the first region exists to
// announce. It is a spoiler test, so it is written from the viewer's side:
// render the screen, take the always-visible text, look for the answer.
import { describe, expect, it, beforeEach } from 'vitest';
import { dragScreens } from '../js/vp-dr/screens.js';
import { playDragSeason } from '../js/dr/season.js';
import { rngFor } from '../js/dr/rng.js';

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];
const rng = rngFor(6); const r = () => 1 + Math.floor(rng() * 10);
const cast = Array.from({ length: 12 }, (_, i) => ({
  name: `Queen${i + 1}`, slug: `queen${i + 1}`, gender: 'f', archetype: 'hero', age: 24 + i,
  stats: Object.fromEntries(STATS.map(k => [k, r()])),
  drag: { acting: r(), comedy: r(), dance: r(), design: r(), runway: r(), lipsync: r(), singing: r() },
}));
const bonds = {}; const key = (a, b) => [a, b].sort().join('|');
const { rows } = playDragSeason({
  cast, seed: 5, config: { drSmackdown: true },
  bond: (a, b) => bonds[key(a, b)] || 0,
  addBond: (a, b, d) => { const k = key(a, b); bonds[k] = Math.max(-10, Math.min(10, (bonds[k] || 0) + d)); },
});

beforeEach(() => { window._tvState = {}; window._drSidebar = {}; });

/**
 * The text a viewer sees before clicking anything.
 *
 * Every `dr-step` is removed, because that is exactly the content the reveal
 * controls. What is left is the lead, the rails and the chrome — the page at
 * rest.
 */
function alwaysVisible(html) {
  const host = document.createElement('div');
  host.innerHTML = html;
  host.querySelectorAll('.dr-step').forEach(el => el.remove());
  host.querySelectorAll('style').forEach(el => el.remove());
  return host.textContent.replace(/\s+/g, ' ');
}

/** Whole-word, so Queen1 does not match inside Queen12. */
const names = (text, all) => all.filter(n =>
  new RegExp(String.raw`\b${n.replace(/[^A-Za-z0-9 ]/g, '.')}\b`).test(text));

describe('no screen prints its own answer above the fold', () => {
  const everyone = cast.map(c => c.name);

  /* ── THE RAIL WAS THE ANSWER, ON EVERY SCREEN OF THE NIGHT ──
     `row.dr.living` is the roster at the END of the week, so the "In the
     room" rail listed the SURVIVORS — on the cold open, the morning, the
     werk room, elimination day, all of them hours before anybody is sent
     home. The name that was not on the list was the queen going home, and it
     was there from the moment the episode opened.

     It hid for as long as the rail and the cards agreed on the count, and
     stopped hiding the day a screen drew a card per queen next to it: twelve
     queens recorded a verse in the booth and eleven names sat beside them.
     Reported as "Axel isn't in the booth sidebar, spoiling she's the one
     going home".

     Written as the viewer's question — is tonight's eliminated queen still in
     the room on the screens that happen before she leaves — rather than as a
     count, because a count would pass on a double elimination and on a week
     that sends nobody home. */
  it('never leaves the queen going home out of the room before she goes', () => {
    const BEFORE = ['dr-cold-open', 'dr-werk-morning', 'dr-mini', 'dr-announce',
      'dr-choice', 'dr-prep', 'dr-booth', 'dr-set', 'dr-elim-day', 'dr-maxi',
      'dr-maxi-stage', 'dr-runway'];
    let checked = 0;
    for (const row of rows) {
      const leaving = (row.exits || []).map(x => x.name);
      if (!leaving.length) continue;
      for (const scr of dragScreens(row)) {
        if (!BEFORE.includes(scr.id)) continue;
        const host = document.createElement('div');
        host.innerHTML = scr.html;
        host.querySelectorAll('style').forEach(el => el.remove());
        const text = host.textContent.replace(/\s+/g, ' ');
        // Only screens that actually draw a roster rail have anything to say.
        if (!/In the room ·|Still here ·|Getting ready/.test(text)) continue;
        checked += 1;
        const missing = leaving.filter(n => !names(text, [n]).length);
        expect(missing,
          `episode ${row.num} ${scr.id}: the room is already missing ${missing.join(', ')}`)
          .toEqual([]);
      }
    }
    expect(checked, 'no roster rail was rendered — nothing was tested').toBeGreaterThan(0);
  });

  it('the mini does not name its winner before the beats', () => {
    let checked = 0;
    for (const row of rows) {
      const winner = row?.dr?.mini?.winner;
      if (!winner) continue;
      const scr = dragScreens(row).find(s => s.id === 'dr-mini');
      if (!scr) continue;
      checked += 1;
      const seen = names(alwaysVisible(scr.html), [winner]);
      expect(seen, `episode ${row.num}: the mini names ${winner} at rest`).toEqual([]);
    }
    expect(checked, 'no mini was rendered — nothing was tested').toBeGreaterThan(0);
  });

  it('the smackdown does not name its champion before the bracket fills', () => {
    const row = rows.find(x => x?.dr?.smackdown?.winner);
    expect(row, 'no smackdown in this season — nothing was tested').toBeTruthy();
    const scr = dragScreens(row).find(s => s.id === 'dr-smackdown');
    expect(scr, 'the smackdown drew no screen').toBeTruthy();
    /* The bracket is always in the DOM — it has to be, or it could not fill
       in — so this reads the CHAMPION's plinth specifically: it must not
       carry the `on` class that makes its contents visible. */
    const host = document.createElement('div');
    host.innerHTML = scr.html;
    const champ = host.querySelector('#sd-champ');
    expect(champ, 'no champion plinth').toBeTruthy();
    expect(champ.classList.contains('on'),
      'the champion is revealed before a single duel is read').toBe(false);
    for (const box of host.querySelectorAll('.sd-match')) {
      expect(box.classList.contains('on'),
        'a duel is revealed before it is read').toBe(false);
    }
  });

  it('the crowning shows a line-up, not a result', () => {
    const row = rows.find(x => x?.dr?.finale);
    expect(row, 'no finale — nothing was tested').toBeTruthy();
    const scr = dragScreens(row).find(s => /crown|exit/.test(s.id));
    expect(scr, 'the finale drew no crowning screen').toBeTruthy();
    const host = document.createElement('div');
    host.innerHTML = scr.html;

    /* NAMING THE FINALISTS IS NOT THE LEAK. The stage has to show the line
       of queens standing on it — that is the screen — and they are drawn in
       alphabetical order precisely so the arrangement says nothing. What
       would leak is a plinth already marked: dark, or lit as one of the last
       two, or wearing the crown, or carrying a placement, before the beat
       that does that to her.
       An earlier version of this asserted that no finalist was named at
       rest and failed on the line-up itself, which would have meant
       deleting the stage to satisfy the test. */
    for (const el of host.querySelectorAll('.cr-plate')) {
      const who = el.getAttribute('data-queen');
      for (const cls of ['out', 'finaltwo', 'crowned']) {
        expect(el.classList.contains(cls),
          `${who} is already ${cls} before a click`).toBe(false);
      }
      expect((el.querySelector('.cr-place')?.textContent || '').trim(),
        `${who} already carries a placement`).toBe('');
    }

    // And the finishing order is not written anywhere outside the steps.
    const text = alwaysVisible(scr.html);
    expect(text, 'the finishing order is legible at rest').not.toMatch(/crowned|Placements/i);
    // The steps exist, or this passes because the screen is empty.
    expect(scr.html).toMatch(/id="dr-step-fincrown-/);
    // AND THE RECORD IS STILL ON THE SCREEN, at the end. Cutting it is the
    // other half of this mistake and cost the transcript its finishing order
    // once already.
    expect(scr.html).toMatch(/Placements/);
  });

  /* NO GENERAL "DOES ANY SCREEN NAME THE ELIMINATED QUEEN" CHECK. It was
     written and it was wrong: prep's rail lists what everybody is building
     and elimination day's lists who is dressed, and the queen who goes home
     four screens later is alive and in the room on both of them. Naming her
     there is not a spoiler, it is the cast. The three cases above are the
     three that were actually broken, and each asserts something a viewer
     could see. */
});

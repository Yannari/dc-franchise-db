// @vitest-environment jsdom
// ══════════════════════════════════════════════════════════════════════
// dr-rate-reasons.test.js — a ballot's reason has to explain the ballot
// ══════════════════════════════════════════════════════════════════════
//
// Rate-a-Queen prints a short reason beside some of the picks. They used to
// fire on the SIZE OF THE TERM behind them — a bond of 4 was "her friend in
// the room" whether or not the friendship changed anything — and the screen
// therefore captioned a queen ranked TWELFTH with "her friend in the room"
// while the tally beside it had her last. Both halves were true. Together
// they read as nonsense, and a reader cannot tell which of the two is lying.
//
// A reason now explains a MOVE: it is recorded only when the term actually
// pushed her past somebody, measured in POSITIONS against the ballot the same
// queen would have written on the performance alone, and it carries the
// distance so the sentence can say how far.
import { describe, expect, it } from 'vitest';
import { rateBoard } from '../js/dr/rate.js';
import { rngFor } from '../js/dr/rng.js';
import { rpBuildRate } from '../js/vp-dr/rate.js';

const NAMES = ['Ivy', 'Coco', 'Nell', 'Rita', 'Mimi', 'Bowie', 'Julia', 'Emmah',
  'Axel', 'Wayne', 'Caleb', 'Scary'];
/* A CLOSE NIGHT, and it has to be. Measured: spacing the truth 0.7 apart
   makes every gap wider than any term that could cross it, so nothing
   reorders, every reason correctly disappears, and this whole file passes on
   a fixture with no content in it. Real rooms are close, so the fixture is. */
const TRUTH = Object.fromEntries(NAMES.map((n, i) => [n, 10 - i * 0.25]));
const ARCH = ['villain', 'hero', 'mastermind', 'goat', 'schemer', 'floater',
  'hothead', 'loyal-soldier', 'wildcard', 'underdog', 'chaos-agent', 'social-butterfly'];
const PLAYERS = Object.fromEntries(NAMES.map((n, i) => [n, {
  archetype: ARCH[i],
  stats: { intuition: 2 + (i * 3) % 9, strategic: 3 + (i * 5) % 8, loyalty: 2 + (i * 7) % 9 },
}]));
const BONDS = { 'Ivy|Mimi': 7, 'Coco|Scary': 6, 'Nell|Axel': -6, 'Rita|Julia': 8 };
const bond = (a, b) => BONDS[[a, b].sort().join('|')] || 0;
const board = (seed = 5) => rateBoard({
  living: NAMES, truth: TRUTH, players: PLAYERS, bond, rng: rngFor(seed),
});

/* ── A ROOM THAT SEES PERFECTLY, for the directional rules ────────────
   The engine measures a move against the ballot she would have written on
   what she SAW, and what she saw includes blur — which is noise, not a
   decision, and can cancel a deliberate move when the comparison is made
   against the night instead. With intuition at 10 the blur term is zero and
   the two orderings coincide, so "did the friendship move her" becomes a
   question with one answer. The mixed-intuition room above is kept for
   density, where misreading is the point. */
const SHARP = Object.fromEntries(Object.entries(PLAYERS)
  .map(([n, p]) => [n, { ...p, stats: { ...p.stats, intuition: 10 } }]));
const sharpBoard = (seed = 5) => rateBoard({
  living: NAMES, truth: TRUTH, players: SHARP, bond, rng: rngFor(seed),
});

describe('a reason explains a move', () => {
  it('never captions a pick the term did not move', () => {
    /* THE RULE, stated over every ballot in five boards. A reason is a claim
       that this pick is not where the night put her, so a reason on a pick
       that sits exactly where the night put her is a false caption. */
    for (const seed of [1, 2, 3, 4, 5]) {
      const { ballots, reasons } = sharpBoard(seed);
      for (const voter of NAMES) {
        const honest = ballots[voter].slice()
          .sort((x, y) => (TRUTH[y] || 0) - (TRUTH[x] || 0) || x.localeCompare(y));
        for (const [name, r] of Object.entries(reasons[voter] || {})) {
          const moved = honest.indexOf(name) - ballots[voter].indexOf(name);
          expect(Math.abs(moved), `seed ${seed}: ${voter} captioned ${name} "${r.why}" `
            + 'without moving her').toBeGreaterThanOrEqual(1);
          expect(r.places, `${r.why} with no distance`).toBeGreaterThanOrEqual(1);
        }
      }
    }
  });

  it('carries a friend UP and buries a threat DOWN', () => {
    // The direction is the whole sentence. A "friend" below where the night
    // had her is the original bug with the arithmetic reversed.
    for (const seed of [1, 2, 3, 4, 5]) {
      const { ballots, reasons } = sharpBoard(seed);
      for (const voter of NAMES) {
        const honest = ballots[voter].slice()
          .sort((x, y) => (TRUTH[y] || 0) - (TRUTH[x] || 0) || x.localeCompare(y));
        for (const [name, r] of Object.entries(reasons[voter] || {})) {
          const moved = honest.indexOf(name) - ballots[voter].indexOf(name);
          if (r.why === 'friend') {
            expect(moved, `${voter} "carried" ${name} downwards`).toBeGreaterThan(0);
          }
          if (r.why === 'threat' || r.why === 'grudge') {
            expect(moved, `${voter} "buried" ${name} upwards`).toBeLessThan(0);
          }
        }
      }
    }
  });

  it('still has something to say', () => {
    // ANTI-VACUITY. Every rule above is satisfied by recording no reasons at
    // all, which is the shape this project keeps finding in its own guards.
    const counts = {};
    for (const seed of [1, 2, 3, 4, 5]) {
      const { reasons } = board(seed);
      for (const voter of NAMES) {
        for (const r of Object.values(reasons[voter] || {})) {
          counts[r.why] = (counts[r.why] || 0) + 1;
        }
      }
    }
    expect(counts.friend || 0, 'no friendship ever carried anybody').toBeGreaterThan(0);
    expect(counts.threat || 0, 'nobody ever buried a rival').toBeGreaterThan(0);
    expect(counts.misread || 0, 'nobody ever misread the night').toBeGreaterThan(0);
  });

  it('says nothing about most picks', () => {
    // The other half: a ballot that follows the night needs no explanation,
    // and a screen that captions every line has stopped meaning anything.
    const { ballots, reasons } = board(5);
    const picks = NAMES.reduce((a, v) => a + ballots[v].length, 0);
    const said = NAMES.reduce((a, v) => a + Object.keys(reasons[v] || {}).length, 0);
    expect(said / picks).toBeLessThan(0.5);
  });

  it('agrees with the tally it is printed beside', () => {
    /* WHAT THE USER ACTUALLY SAW: a warm reason on a queen the tally had
       last. It is allowed for a carried queen to still finish low — being
       helped is not being saved — but the ballot position she was carried TO
       must be above the one the night gave her, which is what the caption
       claims and what the row beside it must not contradict. */
    const { ballots, reasons, ranking } = sharpBoard(5);
    const last = ranking[ranking.length - 1].name;
    for (const voter of NAMES) {
      const r = reasons[voter]?.[last];
      if (r?.why !== 'friend') continue;
      const honest = ballots[voter].slice()
        .sort((x, y) => (TRUTH[y] || 0) - (TRUTH[x] || 0) || x.localeCompare(y));
      expect(ballots[voter].indexOf(last)).toBeLessThan(honest.indexOf(last));
    }
  });
});

describe('the screen', () => {
  const r = board(5);
  const row = { num: 4, dr: { ep: 4, living: NAMES, rateAQueen: { ...r, board: r.ranking } } };
  const render = () => { window._tvState = {}; window._drSidebar = {}; return rpBuildRate(row); };

  it('puts the tally in the sticky rail and nowhere else', () => {
    // It was inline under the stage, so it scrolled away exactly when you
    // started clicking Next — and watching the board move IS the screen.
    const html = render();
    const split = html.indexOf('dr-sidebar-inner');
    expect(split, 'the screen has no rail').toBeGreaterThan(0);
    expect(html.slice(split)).toContain('The tally');
    expect(html.slice(split)).toContain('raq-rows');
    expect(html.slice(0, split), 'the tally is drawn twice').not.toContain('The tally');
  });

  it('can repaint the rating queen’s face, not just her name', () => {
    /* The reveal handler updated `raq-vname` and not the portrait beside it,
       so "Now rating" changed queen every few clicks while the picture stayed
       on whoever voted first — the one label whose entire job is to say who
       is talking, disagreeing with itself. The handler cannot call
       `_portrait` (build-time), so the map has to be here. */
    render();
    for (const n of NAMES) {
      expect(window._drRateData.portraits[n], `no portrait for ${n}`).toBeTruthy();
    }
  });

  it('says which end of a ballot is the good end', () => {
    // "her number 12" alone does not say whether twelve is praise.
    expect(render()).toContain('best first');
  });

  it('prints the distance, so a reason cannot read as a placement', () => {
    const html = render();
    const shown = [...html.matchAll(/<s>([^<]+)<\/s>/g)].map(m => m[1]);
    expect(shown.length, 'no reason reached the screen').toBeGreaterThan(0);
    for (const line of shown) {
      expect(line, `"${line}" does not say how far`)
        .toMatch(/\b(a place|one|two|three|four|five|six|seven|eight|nine|ten)\b/);
    }
  });
});

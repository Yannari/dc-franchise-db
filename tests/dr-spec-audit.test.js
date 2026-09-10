// ══════════════════════════════════════════════════════════════════════
// tests/dr-spec-audit.test.js — a hundred seasons, and what they say
// ══════════════════════════════════════════════════════════════════════
//
// Slow on purpose. Every number here is printed as well as asserted, because
// the assertion says "it is inside the band" and only the printed number says
// what it actually is — and this show has already produced three constants
// that passed a band and meant nothing.
//
// EVERY RATE THAT COULD BE CHANCE IS PRINTED BESIDE ITS CHANCE LINE. "The best
// résumé wins 39% of finales" is not a finding until you know a coin toss
// between the finalists gives 25%.
//
//   npm run audit:dr-spec
import { describe, expect, it } from 'vitest';
import { playDragSeason, recordStrength } from '../js/dr/season.js';
import { buildDragAftermath } from '../js/dr/aftermath.js';
import { dragScreens } from '../js/vp-dr/screens.js';
import { WERK_EVENTS, ROMANCE_EVENT_IDS } from '../js/dr/data/werk-events.js';
import { rngFor } from '../js/dr/rng.js';

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];
const ARCH = ['villain', 'hero', 'floater', 'wildcard', 'goat', 'schemer',
  'social-butterfly', 'mastermind', 'underdog', 'perceptive-player'];

const N = 100;

function cast(n, seed) {
  const rng = rngFor(seed); const r = () => 1 + Math.floor(rng() * 10);
  return Array.from({ length: n }, (_, i) => ({
    name: `Q${i + 1}`, slug: `q${i + 1}`, gender: 'm',
    sexuality: i % 7 === 0 ? 'bi' : 'gay',
    archetype: ARCH[i % ARCH.length], age: 21 + i,
    stats: Object.fromEntries(STATS.map(k => [k, r()])),
    drag: { acting: r(), comedy: r(), dance: r(), design: r(), runway: r(), lipsync: r(), singing: r() },
  }));
}

/** A season with the layers the real game carries. A headless run without a
 *  bond function silently disables every bond-gated event — measured once,
 *  the hard way, when a live event read a flat zero across forty seasons. */
function season(seed, config = {}) {
  const bonds = {}; const pop = {};
  const key = (a, b) => [a, b].sort().join('|');
  const out = playDragSeason({
    cast: cast(12, 400 + seed), seed, config: { drReunion: true, ...config },
    bond: (a, b) => bonds[key(a, b)] || 0,
    addBond: (a, b, d) => { const k = key(a, b); bonds[k] = Math.max(-10, Math.min(10, (bonds[k] || 0) + d)); },
    popDelta: (n, d) => { pop[n] = (pop[n] || 0) + d; },
  });
  return { ...out, bonds, pop };
}

const SEASONS = [];
const pct = (x, n = N) => `${(x / n * 100).toFixed(0)}%`;
const line = (label, value, note = '') =>
  console.log(`  ${String(label).padEnd(34)} ${String(value).padStart(10)}  ${note}`);

describe('a hundred drag seasons', () => {
  it('plays them', () => {
    for (let s = 0; s < N; s++) SEASONS.push(season(s));
    expect(SEASONS.length).toBe(N);
    console.log(`\n══ ${N} seasons, 12 queens, reunion on ══\n`);
  }, 300000);

  // ── 1. does the crown read the season? ──
  it('1 · the crown reads the season without deciding it', () => {
    let zero = 0; let best = 0; let field = 0; let wins = 0;
    for (const o of SEASONS) {
      const rec = o.state.record;
      const live = o.rows[o.rows.length - 1].dr.living;
      field += live.length;
      const w = (rec[o.winner] || []).filter(r => r === 'WIN').length;
      wins += w;
      if (w === 0) zero++;
      const top = [...live].sort((a, b) => recordStrength(rec[b] || []) - recordStrength(rec[a] || []))[0];
      if (top === o.winner) best++;
    }
    const chance = 100 / (field / N);
    console.log('\n1 · THE CROWN');
    line("winner's maxi wins (mean)", (wins / N).toFixed(2));
    line('winners with zero maxi wins', pct(zero), 'upsets must stay reachable');
    line('best résumé wins', pct(best), `chance ${chance.toFixed(0)}%`);
    expect(best / N * 100, 'the résumé is anti-correlated with the crown')
      .toBeGreaterThan(chance);
    expect(best / N * 100, 'the résumé simply decides the crown').toBeLessThan(80);
    expect(zero, 'nobody ever wins from behind').toBeGreaterThan(0);
  });

  // ── 2. does one queen own the season? ──
  it('2 · no queen owns the maxi challenges', () => {
    const shares = [];
    for (const o of SEASONS) {
      const wins = {};
      let total = 0;
      for (const row of o.rows) {
        for (const n of row.dr?.call?.win || []) { wins[n] = (wins[n] || 0) + 1; total++; }
      }
      if (total) shares.push(Math.max(...Object.values(wins)) / total);
    }
    const mean = shares.reduce((a, b) => a + b, 0) / shares.length;
    const over = shares.filter(x => x > 0.5).length;
    /* ── AND THE TWO NUMBERS THE SHARE IS MADE OF ────────────────────
       A share is a fraction and this file spent its life reading only the
       fraction. Measured against 13 real seasons
       (tools/dr-real-domination.py), with the chance line beside it:

         top queen's wins   sim 3.4   real 3.15   pure chance 2.7
         maxi per season    sim 8.4   real 10.4
         share              sim 40%   real 30.8%

       THE CHANCE LINE IS THE POINT. Hand every maxi to a uniformly random
       queen still in the room and the top one still takes 2.7 of them --
       with a shrinking field somebody always wins several. The real show
       sits at 3.15, barely above that: its most dominant queen is only a
       little better than luck. A simulator at 4.5 was not slightly hot, it
       was playing a different game.
       READ THE TWO TOGETHER. A longer season lowers the share and raises the
       win count, so neither number means anything alone -- which is why the
       share by itself was misleading here for this file's whole life.
       AND THE HOST IS NOT THE LEVER. A career brake on `trackPull` moved the
       top queen's win count from 3.92 to 3.85 at full strength -- `trackPull`
       carries 0.2 of a bend that may move two places, so it cannot reach
       this. Whatever produces 3.9 wins is the challenge scoring itself. */
    console.log('\n2 · DOMINATION');
    /* THE COMPARISON NUMBER, MEASURED. This label said "real show: ~30%" for
       its whole life with no source anywhere, and it steered balance work --
       including three experiments run against it in one afternoon. It is now
       13 seasons read off the wiki by tools/dr-real-domination.py:
       mean 28.5%, sd 5.3pp, range 22.2% to 40.0%.
       THE SPREAD IS THE USEFUL HALF. One simulated season at 40% is ordinary;
       it is the MEAN across seasons that has to land near 28.5%. And the top
       queen takes three or four maxi wins almost regardless of season length
       -- season 16 ran eighteen and hers still took four. */
    line("top queen's share of maxi wins", `${(mean * 100).toFixed(0)}%`,
      'real: 30.8% mean, 23-40% (13 seasons, tools/dr-real-domination.py)');
    line('seasons where one queen won >50%', pct(over, shares.length));
    const topWins = [];
    const perSeason = [];
    for (const o of SEASONS) {
      const w = {};
      let t = 0;
      for (const row of o.rows) {
        for (const n of row.dr?.call?.win || []) { w[n] = (w[n] || 0) + 1; t++; }
      }
      if (t) { topWins.push(Math.max(...Object.values(w))); perSeason.push(t); }
    }
    const avg = a => a.reduce((x, y) => x + y, 0) / a.length;
    line("top queen's maxi WINS", avg(topWins).toFixed(2), 'real 3.15 — pure chance is 2.7, so the real show is barely above it');
    line('maxi challenges per season', avg(perSeason).toFixed(1), 'real 10.4 — a longer season lowers the SHARE and raises the win count');
    /* AN OPEN CALIBRATION, STATED RATHER THAN HIDDEN BEHIND A PASSING BAND.
       The top queen takes about half a season's maxi challenges; the real
       show's most dominant winners take three or four of twelve, so this runs
       hot. It was diagnosed rather than guessed at:

         same queen tops the challenge   39%   (chance ~10%)
         same queen tops the runway      43%
         same queen tops STAR POWER      91%   <- a season constant, by design
         same queen wins the maxi        51%

       The win is more concentrated than either input: three correlated season
       constants -- runway craft, polish, style bias -- sum in the panel's
       view, and the host's star lean then lifts the same queen again.
       Widening the runway's week-to-week variance to 4.5 moved it four
       points; weighting the challenge performance at a twentieth moved it
       none. It is structural, not a stray constant.
       One targeted fix is in: a queen who won recently no longer gets the
       host's benefit of the doubt, which is true of the show too -- he lifts
       the queen who needs a moment. That took 53% to 50%. Closing the rest
       means reworking what the panel weighs, which is a design decision and
       not an audit's to make. The band is where the engine actually is, and
       this comment is the record of why. */
    expect(mean, 'domination has got worse than measured').toBeLessThan(0.6);
  });

  // ── 3. both bottom calls exist ──
  it('3 · BTM and BTM2 are both reachable and mean different things', () => {
    let btm = 0; let btm2 = 0;
    for (const o of SEASONS) {
      for (const rec of Object.values(o.state.record)) {
        btm += rec.filter(r => r === 'BTM').length;
        btm2 += rec.filter(r => r === 'BTM2').length;
      }
    }
    console.log('\n3 · THE BOTTOM');
    line('BTM (named, saved before the song)', btm);
    line('BTM2 (lip synced and survived)', btm2);
    expect(btm, 'BTM never happens — the split is cosmetic').toBeGreaterThan(0);
    expect(btm2).toBeGreaterThan(0);
  });

  // ── 4. the finale is the size it says ──
  it('4 · every finale is the size the format asks for', () => {
    let doubles = 0; let wrong = 0;
    for (const o of SEASONS) {
      doubles += o.rows.filter(r => r.dr.lipsync?.call === 'double-shantay').length;
      if (o.state.living.length !== 4) wrong++;
    }
    console.log('\n4 · THE DEBT');
    line('double shantays', doubles);
    line('oversized finales', wrong);
    expect(wrong, 'a season reached the finale oversized').toBe(0);
    /* THIS ASSERTED A DELETED DESIGN, AND PASSED BECAUSE OF A BUG.
       It read `expect(paid).toBe(doubles)`, where `paid` counted rows with
       `lipsync.paidBack` — a field NOTHING IN js/ WRITES. So `paid` was always
       zero and the assertion could only hold while `doubles` was zero too. It
       was: GREAT sat at 8.5, above the top decile of the score distribution,
       so a double shantay was not rare but IMPOSSIBLE. The guard was green
       because the mechanic was unreachable, and it went red the day the bar
       dropped to 7.5 and the call could finally happen.
       The repayment was removed on purpose — js/dr/week.js: "NOTHING IS
       OWED... a double elimination is a thing an author schedules, not a
       correction the engine applies behind them." A constant living only in a
       test is usually a deleted design, not a missing feature.
       The finale size above is the real invariant. What this adds is that the
       call must be REACHABLE, because zero across a hundred seasons is how the
       old assertion stayed green for as long as it did. */
    expect(doubles, 'no double shantay in a hundred seasons - the bar is above '
      + 'what lipsyncScore can produce, so the call cannot happen at all')
      .toBeGreaterThan(0);
  });

  // ── 5. every screen a season claims is a screen with something on it ──
  it('5 · no screen is claimed and empty', () => {
    let screens = 0; let empty = 0;
    for (const o of SEASONS.slice(0, 12)) {
      for (const row of o.rows) {
        for (const sc of dragScreens(row)) {
          screens++;
          // Chrome only, no content: the "written but unreachable" shape.
          const body = sc.html.replace(/<style[\s\S]*?<\/style>/g, '')
            .replace(/<!--dr-chrome-->[\s\S]*?<!--\/dr-chrome-->/g, '')
            .replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
          /* ── A TABBED SCREEN IS NOT ITS OPEN PANEL ──────────────────
             `dr-rel` renders ONE queen's panel and swaps the rest in on a
             click, and its tabs are chrome, so this measured a twelve-tab
             screen by the one card showing. A real panel can be one line --
             "Allies · 1 Q7 close ally +6.5" is 29 characters -- while a
             screen that genuinely opened on nothing says "No connections yet
             — it's early.", which is 32. LENGTH CANNOT TELL THEM APART, and
             it ranked them the wrong way round.
             So the tabbed screen is asked the question in its own words. The
             three real failures this check has caught on it all printed that
             empty state; none of them were short. */
          const blank = sc.id === 'dr-rel'
            ? /^No connections yet/.test(body)
            : body.length < 40;
          if (blank) { empty++; console.log(`      EMPTY: ep${row.num} ${sc.id}`); }
        }
      }
    }
    console.log('\n5 · SCREENS');
    line('screens rendered (12 seasons)', screens);
    line('claimed but empty', empty);
    expect(empty).toBe(0);
  });

  // ── 6. the track record drives the room ──
  it('6 · the track record is a social fact', () => {
    const FACTS = /lastCall|winsA|winsB|safesA|bottoms|neverTop|neverBottom|sinceTop|lipSynced/;
    const ids = new Set(WERK_EVENTS.filter(e => FACTS.test(String(e.when || ''))).map(e => e.id));
    const fired = {};
    let total = 0;
    for (const o of SEASONS) {
      for (const row of o.rows) {
        for (const sc of row.dr.scenes || []) {
          const id = String(sc.kind || '').replace(/^werk:/, '');
          if (ids.has(id)) { fired[id] = (fired[id] || 0) + 1; total++; }
        }
      }
    }
    console.log('\n6 · THE RECORD IN THE ROOM');
    line('record-driven scenes per season', (total / N).toFixed(1));
    const dead = [...ids].filter(id => !fired[id]);
    for (const id of dead) console.log(`      NEVER FIRES: ${id}`);
    line('record-driven events defined', ids.size);
    line('never fired', dead.length);
    expect(total / N, 'the chart is a scoreboard nobody reacts to').toBeGreaterThan(4);
    expect(dead, `unreachable events: ${dead.join(', ')}`).toEqual([]);
  });

  // ── 7. romance is present and is not the show ──
  it('7 · romance is a thread, not a storyline', () => {
    const ids = new Set(ROMANCE_EVENT_IDS);
    let withAny = 0; let pairs = 0; let over = 0;
    for (const o of SEASONS) {
      const n = o.rows.reduce((k, row) => k + (row.dr.scenes || [])
        .filter(sc => ids.has(String(sc.kind || '').replace(/^werk:/, ''))).length, 0);
      if (n) withAny++;
      pairs += (o.state.romances || []).length;
      if ((o.state.romances || []).length > 2) over++;
    }
    console.log('\n7 · ROMANCE');
    line('seasons with a romance beat', pct(withAny));
    line('pairs per season', (pairs / N).toFixed(2));
    line('seasons over the cap of two', over);
    expect(withAny, 'the pool exists and never fires').toBeGreaterThan(0);
    expect(withAny / N, 'romance has taken over the show').toBeLessThan(0.7);
    expect(over).toBe(0);
  });

  // ── 8. Miss Congeniality is a vote, not the runner-up ──
  it('8 · Miss Congeniality is not a second name for second place', () => {
    const spots = [];
    let sashedWinner = 0;
    for (const o of SEASONS) {
      if (!o.congeniality) continue;
      if (o.congeniality === o.winner) sashedWinner++;
      const place = o.rows[o.rows.length - 1].dr.finale.placements.indexOf(o.congeniality);
      spots.push(place >= 0 ? place + 1 : 99);
    }
    const finalists = spots.filter(x => x !== 99).length;
    console.log('\n8 · THE SASH');
    line('seasons that awarded it', pct(spots.length));
    line('went to a finalist', pct(finalists, spots.length));
    line('crowned AND sashed', sashedWinner);
    expect(sashedWinner, 'somebody was crowned and sashed').toBe(0);
    expect(spots.length, 'the award never happens').toBeGreaterThan(N * 0.9);
    expect(finalists / spots.length, 'it only ever goes to a finalist').toBeLessThan(0.9);
  });

  // ── 9. the reunion reads the season ──
  it('9 · the reunion is a reading, not a running order', () => {
    const counts = {};
    const kinds = {};
    for (const o of SEASONS) {
      const ru = o.rows.find(r => r.dr.reunion);
      if (!ru) continue;
      const t = ru.dr.reunion.topics;
      counts[t.length] = (counts[t.length] || 0) + 1;
      for (const x of t) kinds[x.kind] = (kinds[x.kind] || 0) + 1;
    }
    console.log('\n9 · THE REUNION');
    for (const [k, v] of Object.entries(kinds).sort((a, b) => b[1] - a[1])) line(k, pct(v));
    line('distinct topic counts seen', Object.keys(counts).length);
    expect(Object.keys(counts).length, 'every reunion has the same running order')
      .toBeGreaterThan(1);
  });

  // ── 10. no archetype owns the crown ──
  it('10 · no archetype owns the show', () => {
    const wins = {};
    for (const o of SEASONS) {
      const c = cast(12, 400 + SEASONS.indexOf(o)).find(p => p.name === o.winner);
      if (c) wins[c.archetype] = (wins[c.archetype] || 0) + 1;
    }
    const chance = 100 / ARCH.length;
    console.log('\n10 · ARCHETYPES');
    for (const a of ARCH) line(a, pct(wins[a] || 0), `chance ${chance.toFixed(0)}%`);
    const top = Math.max(...ARCH.map(a => wins[a] || 0));
    expect(top / N * 100, 'one archetype wins far too often').toBeLessThan(chance * 3);
    // The aftermath has to survive every one of them.
    for (const o of SEASONS.slice(0, 20)) {
      expect(() => buildDragAftermath(o.rows, { players: {} })).not.toThrow();
    }
  });
});

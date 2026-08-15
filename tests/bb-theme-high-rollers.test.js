// The money, in a real week.
import { describe, expect, it, beforeEach } from 'vitest';
import { gs, players, seasonConfig, relationships } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode } from '../js/bb-run.js';
import { balance, PAYOUT_TIERS, FLOOR_TIER, PAYOUT_AMOUNTS } from '../js/bb/bb-bucks.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';
import { themeById, advanceThemeArc } from '../js/bb/themes.js';
import { setGs } from '../js/core.js';
// Read from the repo root rather than off `import.meta.url`: the suite runs in
// jsdom, where the module URL is not a file: URL and `fileURLToPath` throws.
// This is the same door `tests/bb-themes.test.js` opens the markup through.
import { readFileSync } from 'node:fs';
import { rpBuildBBThemeBeat, buildVPScreens } from '../js/vp-screens.js';
import { BED_CATALOG } from '../js/audio.js';

const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee', 'Brightly',
  'Hicks', 'Emmah', 'Millie', 'Caleb'];
const ARCH = ['mastermind', 'social-butterfly', 'hero', 'showmancer', 'schemer', 'floater',
  'villain', 'loyal-soldier', 'underdog', 'goat', 'hothead', 'wildcard'];
const CAST = NAMES.map((name, i) => ({
  name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight', archetype: ARCH[i],
}));

function house({ theme = 'high-rollers', twistSchedule = [] } = {}) {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns,
    ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
  Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7,
    bbHaveNots: 'off', bbSafetyMode: 'off', theme });
  seasonConfig.twistSchedule = twistSchedule;
}

// Amounts come from the module, never from a copy here. The tiers were
// rescaled once already; a test holding its own numbers is what makes the next
// rescale a hunt.
const [TOP, MID] = PAYOUT_TIERS;
const FLOOR = FLOOR_TIER;

/** Every payout act anywhere in the season, across BOTH halves of a split night. */
const bucksActs = () => (gs.bb.weeks || []).flatMap(w => (w.acts || [])
  .filter(a => a.type === 'bb-bucks'));

describe('the floor pays every week', () => {
  it('pays the house on a High Roller\'s season', () => {
    withSeededRandom(7, () => {
      house();
      simulateBBEpisode();
      expect(NAMES.every(n => balance(n) >= FLOOR.amount)).toBe(true);
    });
  });

  it('pays nobody on a season running another theme', () => {
    withSeededRandom(7, () => {
      house({ theme: 'summer-of-mystery' });
      simulateBBEpisode();
      expect(NAMES.every(n => balance(n) === 0)).toBe(true);
    });
  });

  it('pays nobody on an unthemed season', () => {
    withSeededRandom(7, () => {
      house({ theme: 'none' });
      simulateBBEpisode();
      expect(NAMES.every(n => balance(n) === 0)).toBe(true);
    });
  });

  it('emits the act into the week', () => {
    withSeededRandom(7, () => {
      house();
      simulateBBEpisode();
      const week = gs.bb.weeks[0];
      expect(week.acts.some(a => a.type === 'bb-bucks')).toBe(true);
    });
  });

  it('snapshots the ledger onto the week, so a replay shows that week\'s money', () => {
    withSeededRandom(7, () => {
      house();
      simulateBBEpisode();
      const one = gs.bb.weeks[0].bucksLedger;
      simulateBBEpisode();
      const two = gs.bb.weeks[1].bucksLedger;
      expect(one.find(l => l.name === 'Bowie').balance)
        .toBeLessThan(two.find(l => l.name === 'Bowie').balance);
    });
  });

  it('carries the snapshot onto the episode', () => {
    withSeededRandom(7, () => {
      house();
      simulateBBEpisode();
      const ep = gs.episodeHistory[gs.episodeHistory.length - 1];
      expect(Array.isArray(ep.bucksLedger)).toBe(true);
      expect(ep.bucksLedger.length).toBe(NAMES.length);
    });
  });
});

// ── once per CALENDAR week, not once per cycle ───────────────────────────
//
// `simulateBBWeek` is a cycle. Two twists run it twice for one night, and the
// payout writes to a ledger that persists into the save and is spent weeks
// later — so a double or half payout is baked in long before anything can
// notice it. Both of these failed before the guard went in.
describe('the floor pays once a week, however many cycles the week runs', () => {
  // A payout is well-formed when it is exactly ONE canon tier set over the
  // undivided house: three on the top amount, three on the middle, everybody
  // else on the floor. It catches BOTH failure modes at once — paying twice
  // doubles every balance off the tier amounts entirely, and paying per side
  // draws two complete tier sets, so six people hold the top amount.
  const expectExactlyOneTierSet = names => {
    const paid = names.map(n => balance(n));
    expect(paid.filter(b => b === TOP.amount)).toHaveLength(TOP.count);
    expect(paid.filter(b => b === MID.amount)).toHaveLength(MID.count);
    expect(paid.filter(b => b === FLOOR.amount))
      .toHaveLength(names.length - TOP.count - MID.count);
  };

  it('pays once on a double eviction night, not once per cycle', () => {
    withSeededRandom(7, () => {
      house({ twistSchedule: [{ id: 't1', episode: 1, type: 'bb-double-eviction' }] });
      simulateBBEpisode();
      // Two week records for one night is correct and stays — the stats, the
      // jury and the comp history all need to see two HOHs. Only the money is
      // supposed to happen once.
      expect(gs.bb.weeks.length).toBe(2);
      expect(bucksActs()).toHaveLength(1);
      expectExactlyOneTierSet(NAMES);
    });
  });

  it('pays the whole house once on a split week, not each side its own tier set', () => {
    withSeededRandom(7, () => {
      house({ twistSchedule: [{ id: 't1', episode: 1, type: 'bb-split-house' }] });
      simulateBBEpisode();
      expect(bucksActs()).toHaveLength(1);
      // The point of the fix: twelve people split into two sixes. Per-side,
      // each half is under the seven-houseguest floor and `awardWeeklyBucks`
      // returned null for both — the entire house went unpaid in silence.
      expect(NAMES.every(n => balance(n) >= FLOOR.amount)).toBe(true);
      expectExactlyOneTierSet(NAMES);
      // And the act names the undivided house, not one half of it.
      expect(bucksActs()[0].payouts).toHaveLength(NAMES.length);
    });
  });

  it('carries every houseguest onto the episode on a split week', () => {
    withSeededRandom(7, () => {
      house({ twistSchedule: [{ id: 't1', episode: 1, type: 'bb-split-house' }] });
      simulateBBEpisode();
      // Only side A's week reaches `weekToEpisode`, so a ledger snapshotted
      // over `house` carried six names and quietly dropped the other six.
      const ep = gs.episodeHistory[gs.episodeHistory.length - 1];
      expect(ep.bucksLedger.map(l => l.name).sort()).toEqual([...NAMES].sort());
    });
  });
});

// ── the descriptor itself ────────────────────────────────────────────────
//
// Everything above runs a season and asserts what the money did. This block
// asserts the thing that MAKES it a season: the descriptor, its registration,
// and the one field the payout is gated on. Registering the id without
// `economy: 'bb-bucks'` fires nothing and throws nothing — the cases above go
// red and this one names why.
describe('the descriptor', () => {
  const theme = () => themeById('high-rollers');

  it('is registered', () => {
    expect(theme()).toBeTruthy();
    expect(theme().name).toBe("High Roller's");
  });

  it('declares the economy the engine gates on', () => {
    expect(theme().economy).toBe('bb-bucks');
  });

  it('binds to the resort', () => {
    expect(theme().house).toBe('bb-resort');
  });

  it('has a Pit Boss with both registers at every hook', () => {
    const voice = theme().antagonist.voice;
    for (const hook of ['open', 'noms', 'veto', 'vote', 'finale', 'crown']) {
      expect(voice[hook].neutral.length, `${hook}/neutral`).toBeGreaterThanOrEqual(4);
      expect(voice[hook].hostile.length, `${hook}/hostile`).toBeGreaterThanOrEqual(4);
    }
  });

  // The roster owns the phrase. Every other surface in this simulator says
  // "the house" to mean the twelve people playing, so an antagonist who says
  // it makes `summariseWeek` ambiguous in its own transcript. The Pit Boss
  // says the floor, the room, the edge.
  it('never says "the house" for the room — that is the roster\'s word', () => {
    const voice = theme().antagonist.voice;
    const all = Object.values(voice).flatMap(h => [...(h.neutral || []), ...(h.hostile || [])]);
    expect(all.some(line => /\bthe house\b/i.test(line))).toBe(false);
  });

  // The mood turn is NOT a schedule entry. `themeScheduleEntries` skips any act
  // without a `book` — moods change no week's card, they change the register the
  // week is narrated in — so `advanceThemeArc` is the engine that walks them and
  // the only honest place to assert the turn happens. Asking the scheduler would
  // pass or fail for reasons that have nothing to do with this theme.
  it('turns cold before the endgame at every cast size', () => {
    for (const weeks of [9, 12, 15, 17]) {
      seasonConfig.format = 'big-brother';
      seasonConfig.theme = 'high-rollers';
      setGs({ bb: { weeks: [],
        theme: { id: 'high-rollers', mood: 'neutral', booked: [], said: [] } } });
      let turned = 0;
      for (let w = 1; w <= weeks; w++) {
        if (advanceThemeArc(w, weeks) === 'hostile') { turned = w; break; }
      }
      expect(turned, `weeks=${weeks}: the floor never went cold`).toBeGreaterThan(0);
      expect(turned, `weeks=${weeks}: turned on the last week`).toBeLessThan(weeks);
    }
  });

  it('books no twists yet — the room is Plan 2', () => {
    expect(theme().books).toEqual([]);
    expect(theme().arc.some(a => a.book)).toBe(false);
  });

  it('is offered in the config select, which is hand-written markup', () => {
    const html = readFileSync('simulator.html', 'utf8');
    const select = html.match(/<select id="cfg-theme"[\s\S]*?<\/select>/)[0];
    expect(select).toContain('value="high-rollers"');
  });
});

// ── the skin ───────────────────────────────────────────────────────────
//
// The visual thesis of this theme is a TEMPERATURE FLIP. Neutral is a warm
// high-limit salon — brass on black lacquer, lit from the table up. Hostile is
// the count room behind it: steel, fluorescent, every warm tone gone. It is the
// only theme on the shelf that escalates cold (the Den and CORA both go red,
// Summer of Mystery drains to bone), so "the hostile block is different" is not
// enough — it has to be different in the one direction that makes the theme
// legible beside the other three. These cases assert the direction.
//
// The brief's draft sliced the block with a lookahead on `\n/* ──` / `\n.rp-theme-`.
// That was written before the CSS existed: the theme skin section is indented
// four spaces, so neither alternative can ever match at a line start and the
// slice ran to the end of the stylesheet. Sliced from the block to the shared
// reduced-motion rule that closes the section instead, which is the real intent.
describe('the skin', () => {
  const css = () => readFileSync('css/simulator.css', 'utf8');

  /** Just the High Roller's rules, from its first selector to the end of the section. */
  const block = () => {
    const all = css();
    const from = all.indexOf('.rp-theme-high-rollers');
    expect(from, "no High Roller's block in the stylesheet").toBeGreaterThan(-1);
    const to = all.indexOf('prefers-reduced-motion', from);
    return all.slice(from, to > -1 ? to : all.length);
  };
  const neutral = () => /\.rp-theme-high-rollers\s*\{([^}]*)\}/.exec(block())[1];
  const hostile = () => /\.rp-theme-high-rollers\.is-mood-hostile\s*\{([^}]*)\}/.exec(block())[1];

  /** The `--bbx-*-rgb` triplets in a rule body, as {token: [r,g,b]}. */
  const triplets = (body) => Object.fromEntries(
    [...body.matchAll(/(--bbx-[a-z0-9-]+-rgb)\s*:\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/g)]
      .map(m => [m[1], [+m[2], +m[3], +m[4]]]));

  it('has its own theme block', () => {
    expect(css()).toContain('.rp-theme-high-rollers');
  });

  it('has a hostile block, so the turn is visible and not only audible', () => {
    expect(css()).toContain('.rp-theme-high-rollers.is-mood-hostile');
  });

  it('opens warm — brass on black lacquer, no cold tone in the room', () => {
    const t = triplets(neutral());
    expect(Object.keys(t).length, 'the neutral block sets no surfaces').toBeGreaterThan(4);
    // Red over blue on every single one, the layout red included — that is
    // what "no cold tone anywhere in the room" means as an assertion.
    for (const [tok, [r, , b]] of Object.entries(t)) {
      expect(r, `${tok} is warm (r > b) while the floor is still open`).toBeGreaterThan(b);
    }
  });

  // The one that carries the thesis. Not "the hostile block differs" — the
  // hostile block must be COLDER, on every surface it repaints.
  it('goes COLD when the comps stop, not red like the others', () => {
    const h = triplets(hostile());
    const n = triplets(neutral());
    expect(Object.keys(h).length, 'the hostile block repaints nothing').toBeGreaterThan(4);
    const surfaces = Object.keys(h).filter(t => /stage|screen|card|dim|info/.test(t));
    expect(surfaces.length, 'no surface token is repainted for the count room').toBeGreaterThan(4);
    for (const tok of surfaces) {
      const [r, , b] = h[tok];
      expect(b, `${tok} must be cold in the count room (b >= r)`).toBeGreaterThanOrEqual(r);
      // and colder than it was, which is what makes it a FLIP rather than a
      // room that happened to already be blue.
      if (n[tok]) {
        expect(b - r, `${tok} did not get colder than the salon`)
          .toBeGreaterThan(n[tok][2] - n[tok][0]);
      }
    }
    // The brass itself is gone. This is the assertion the brief drafted.
    expect(hostile().toLowerCase()).not.toContain('#c9a227');
    expect(hostile().toLowerCase()).not.toContain('#f0d585');
  });

  it('lights the count room with a cold accent, not a warm one', () => {
    const accent = /--theme-accent\s*:\s*(#[0-9a-f]{6})/i.exec(hostile())[1].toLowerCase();
    const [r, g, b] = [1, 3, 5].map(i => parseInt(accent.slice(i, i + 2), 16));
    expect(b, `hostile accent ${accent} is not a fluorescent`).toBeGreaterThanOrEqual(r);
    expect(g, `hostile accent ${accent} still leans warm`).toBeGreaterThanOrEqual(r);
  });

  // `tests/bb-themes.test.js` pins this globally; asserted here too because it
  // is the mistake this block is most likely to grow — a form declared beside
  // the triplets computes there and bakes a value in before .rp-page sees it.
  it('declares no colour form of its own, so the forms stay on .rp-page', () => {
    expect(block()).not.toMatch(/--bbx-[a-z0-9-]+\s*:\s*rgb\(/);
  });
});

// ── the Pit Boss's screen ──────────────────────────────────────────────
//
// `rpBuildBBThemeBeat` dispatches per theme precisely so a second theme is not
// a recolour of the first. The Den is an eye, CORA is a wall terminal, the
// Mastermind is a door. This one is the PIT: a brass rail over felt, and the
// line set like a floor announcement. On a hostile beat the same table is lit
// by the count-room fluorescents instead.
describe('the Pit Boss draws its own screen', () => {
  const act = (over = {}) => ({
    type: 'theme-beat', hook: 'open', themeId: 'high-rollers', mood: 'neutral',
    speaker: 'The Pit Boss', line: 'Week 3. The floor is open.', ...over,
  });

  it('renders the speaker and the line', () => {
    const html = rpBuildBBThemeBeat({ num: 3 }, act());
    expect(html).toContain('The Pit Boss');
    expect(html).toContain('Week 3. The floor is open.');
    expect(html).toContain('rp-page');
  });

  // The whole reason the dispatch exists. Falling through to `_rpThemeBeatDen`
  // is silent — the screen still renders, it just renders the Den's eye.
  it('is not the Den fallback wearing a gold accent', () => {
    const html = rpBuildBBThemeBeat({ num: 3 }, act());
    expect(html).not.toContain('bbth-eye');
    expect(html).toMatch(/bbhr/);
  });

  it('asks for a bed the audio catalogue actually has', () => {
    const html = rpBuildBBThemeBeat({ num: 3 }, act());
    const bed = (html.match(/data-ambient="([^"]+)"/) || [])[1];
    expect(bed, 'the screen names no bed at all').toBeTruthy();
    expect(Object.keys(BED_CATALOG)).toContain(bed);
  });

  // Read off the ROOT element's class, not off the whole string: every one of
  // these screens ships an inline `<style>` that names `.is-hostile` in a
  // selector, so a substring search passes on the calm beat too.
  it('turns the table over to the count room on a hostile beat', () => {
    const rootClass = (html) => html.match(/class="([^"]*)"/)[1];
    const calm = rpBuildBBThemeBeat({ num: 3 }, act());
    const cold = rpBuildBBThemeBeat({ num: 9 }, act({ mood: 'hostile' }));
    expect(rootClass(calm)).not.toContain('is-hostile');
    expect(rootClass(cold)).toContain('is-hostile');
    expect(cold).not.toBe(calm);
  });

  // Project standard: VP visuals are CSS/SVG primitives. An emoji in a themed
  // screen is the one thing that makes it look like a placeholder.
  it('draws with CSS and SVG, never emoji', () => {
    const html = rpBuildBBThemeBeat({ num: 3 }, act({ mood: 'hostile' }));
    expect(html).not.toMatch(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u);
  });

  it('escapes what the antagonist says rather than letting it be markup', () => {
    const html = rpBuildBBThemeBeat({ num: 3 }, act({ line: '<script>x</script>' }));
    expect(html).not.toContain('<script>x</script>');
  });

  it('renders with no week on the episode at all', () => {
    expect(() => rpBuildBBThemeBeat({}, act())).not.toThrow();
  });
});

// ── the chip band ──────────────────────────────────────────────────────
//
// The band on House Life says WHAT THE FLOOR PAID THIS WEEK — the three tiers
// and who stood in each — and nothing else. It may never show a balance. That
// is the canon call the spec made: a houseguest knows their own savings and
// nobody has a scoreboard of everybody else's, and the inference the house
// makes off the announced tiers is the whole twist.
//
// The brief's draft of this asserted only that no balance appeared, which a
// band that renders NOTHING AT ALL passes perfectly. Both halves are asserted
// here: the band is on the screen, AND no balance is anywhere near it.
describe('the chip band', () => {
  /** Just the band, sliced off the House Life screen. Its <style> is outside. */
  const band = (html) => (html.match(/<section class="bbcp"[\s\S]*?<\/section>/) || [])[0] || '';
  const houseLife = (screens) => screens.filter(s => s.label === 'House Life')
    .map(s => s.html).join('');
  /**
   * The band as a VIEWER reads it: tag names and attribute values stripped,
   * text content kept.
   *
   * The chip is drawn as SVG, and its geometry is full of two-digit numbers —
   * `cx="32"`, `r="30"`, `stroke-width="6"`. Searching the raw markup for a
   * balance therefore hits circle coordinates and reports a privacy leak that
   * is not on the screen. What must never appear is a number somebody can READ,
   * which is exactly the text nodes.
   */
  const readable = (html) => html.replace(/<[^>]+>/g, ' ');

  it('shows the week\'s payout on House Life and never a balance', () => {
    withSeededRandom(7, () => {
      house();
      simulateBBEpisode();
      simulateBBEpisode();   // week 2: balances are two payouts deep, so distinct from one
      const ep = gs.episodeHistory[gs.episodeHistory.length - 1];
      const screens = buildVPScreens(ep);
      const html = screens.map(s => s.html).join('');
      const chips = band(houseLife(screens));
      const chipText = readable(chips);

      // It rendered at all — without this the privacy case below is vacuous.
      expect(chips, 'no chip band on any House Life screen').toBeTruthy();
      expect(chips).toMatch(/THE FLOOR PAYS|CHIP COUNT/i);
      // Three tiers, and everybody standing in one of them.
      for (const amount of PAYOUT_AMOUNTS) expect(chipText).toContain(String(amount));
      const paid = ep.acts.find(a => a.type === 'bb-bucks').payouts;
      for (const p of paid) expect(chips).toContain(p.name);

      // A payout is one of the tier amounts. A week-2 balance is not, and must
      // appear on neither surface that holds payout data: the band, and the
      // payout screen itself.
      //
      // This used to sweep the WHOLE episode's markup for `>balance<`. That
      // worked only while a payout was a three-figure number: once the tiers
      // were rescaled a balance became two digits, and `>24<` matches a comp
      // tally, a day count and an alliance size on screens that have never seen
      // the ledger. A false leak on an unrelated screen is not a weaker
      // assertion made safe, it is a broken one — so this checks the two
      // surfaces that could actually leak, and checks them as READABLE TEXT.
      const payScreen = readable(screens.filter(s => s.label === 'The Audience Pays')
        .map(s => s.html).join(''));
      expect(payScreen, 'no payout screen was drawn').toBeTruthy();
      const balances = ep.bucksLedger.map(l => l.balance)
        .filter(b => ![0, ...PAYOUT_AMOUNTS].includes(b));
      expect(balances.length, 'week 2 produced no balance distinct from a payout').toBeGreaterThan(0);
      for (const b of balances) {
        expect(chipText, `the band printed the balance ${b}`).not.toContain(String(b));
        expect(payScreen, `the payout screen printed the balance ${b}`).not.toContain(String(b));
      }
    });
  });

  it('draws nothing at all on a season with no economy', () => {
    withSeededRandom(7, () => {
      house({ theme: 'none' });
      simulateBBEpisode();
      const ep = gs.episodeHistory[gs.episodeHistory.length - 1];
      expect(band(houseLife(buildVPScreens(ep)))).toBe('');
    });
  });

  it('draws with CSS and SVG, never emoji', () => {
    withSeededRandom(7, () => {
      house();
      simulateBBEpisode();
      const ep = gs.episodeHistory[gs.episodeHistory.length - 1];
      const chips = band(houseLife(buildVPScreens(ep)));
      expect(chips).toBeTruthy();
      expect(chips).not.toMatch(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u);
    });
  });

  it('escapes the names rather than letting them be markup', () => {
    withSeededRandom(7, () => {
      house();
      simulateBBEpisode();
      const ep = gs.episodeHistory[gs.episodeHistory.length - 1];
      const act = ep.acts.find(a => a.type === 'bb-bucks');
      act.payouts[0].name = '<script>x</script>';
      const chips = band(houseLife(buildVPScreens(ep)));
      expect(chips).not.toContain('<script>x</script>');
    });
  });
});

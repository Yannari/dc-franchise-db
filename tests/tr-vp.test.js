// ══════════════════════════════════════════════════════════════════════
// tr-vp.test.js — the three things about the castle's screens that are
// invisible by looking
// ══════════════════════════════════════════════════════════════════════
//
// Plan 8 is run differently from Plans 1-7 and says so: ENGINE defects are
// invisible, so those plans leaned on mutation testing and 1,200-season
// sweeps. SCREEN defects are visible — you render it and look at it — so the
// loop there is build, render, screenshot, judge. There is no mutation testing
// on CSS in this file and there should not be.
//
// Three things keep hard guards anyway, because no amount of looking at the
// screen shows them:
//
//   1. THE CONCLAVE MUST NEVER RENDER AS PUBLIC. The murder ballots sit in
//      `votes[]` beside the banishment ballots and are distinguished only by
//      `channel`. Plan 7 found js/social/archive.js iterating them unfiltered
//      and publishing the private conclave as five nights of "Accusation"
//      events. A screen with the same blindness prints the show's central
//      secret on the page whose whole job is to guess at it.
//   2. NO OTHER SHOW'S VOCABULARY. tests/show-vocabulary.test.js runs both
//      directions over the registry; this file checks the one surface that
//      test does not reach, which is the rendered VP screen.
//   3. EVERY EXIT WORD COMES FROM THE REGISTRY. This show has two of them and
//      is the only show that does. A literal 'banished' or 'murdered' in a
//      screen is a word a registry change cannot reach, which is how one
//      show's vocabulary ends up printed over another's departure.
//
// AND ONE MORE, WHICH IS THIS PROJECT'S SIGNATURE BUG CLASS: a screen that
// exists and is never reached. The reachability arm at the bottom plays a real
// season and asks `buildVPScreens` for it, rather than calling the builder
// directly — calling the builder directly proves the function returns HTML,
// which is exactly what every unreachable screen in this repo also did.
//
// FILENAME: deliberately NOT `*-audit.test.js`. vitest.config.js excludes that
// pattern from `npm test` and this project has shipped guards into that hole
// three times. Collection verified with `npx vitest list`.
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { gs, setPlayers, seasonConfig } from '../js/core.js';
import { playTraitorsSeason } from '../js/tr/headless.js';
import { exitVerbs, SHOWS, publicBallots } from '../js/shows.js';
import { traitorsVotingHistory } from '../js/tr/export.js';
import { rpBuildConclave, conclaveVisibleTo, trConclaveRevealAll, _portrait } from '../js/vp-tr/conclave.js';
import { rpBuildRoundTable, trRoundTableRevealAll } from '../js/vp-tr/round-table.js';
import { buildVPScreens } from '../js/vp-screens.js';
import { HOSTS_BY_FORMAT } from '../js/quick-setup.js';
import roster from '../franchise_roster.json';
import { forbiddenFor, foreignWordsIn } from './helpers/show-vocabulary.js';

const ROSTER = roster.players.slice(0, 20);
const CAST = ROSTER.map(p => p.name);

/** One real season, played once and shared. A season costs about 40ms. */
function season(seed) {
  setPlayers(ROSTER);
  const s = playTraitorsSeason({ cast: CAST, traitorCount: 3, seed });
  // `gs.episodeHistory` is what the VP reads, and it is written by the season
  // as it plays. Copied out because the next season replaces gs wholesale.
  return { season: s, episodes: (gs.episodeHistory || []).map(e => ({ ...e })) };
}
const SEEDS = [1, 3, 7, 11];
const RUNS = SEEDS.map(season);

/** Every episode across every seed that actually held a conclave. */
const NIGHTS = RUNS.flatMap(r => r.episodes.filter(e => e.tr && e.tr.conclave)
  .map(e => ({ ep: e, run: r })));

// The screen carries its own stylesheet, which is not narration and is 20KB
// of it. Dropped before anything is read, so a failure message names the
// sentence that broke rather than the entire visual system.
const strip = html => String(html || '')
  .replace(/<style[\s\S]*?<\/style>/gi, ' ')
  .replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

/**
 * Does this text name this player?
 *
 * Word-bounded, because the roster has a player called "B" and a substring
 * test for that name matches every sentence in the language. A guard that
 * cannot be satisfied is a guard nobody keeps.
 */
function mentions(text, name) {
  if (!name) return false;
  // Built by concatenation, so the boundary must be written '\\b'. A bare '\b'
  // inside a string literal is U+0008 and the regex then matches nothing
  // whatever — a guard that passes because it can never fire. This file
  // shipped exactly that defect once, and the arm below is why it did not
  // stay shipped.
  const safe = String(name).replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
  return new RegExp('\\b' + safe + '\\b').test(text);
}

// THE MATCHER ITSELF, ASSERTED. Everything in guard 1 is a NEGATIVE assertion,
// so a matcher that never matches makes the whole guard vacuous and green.
describe('the name matcher works at all', () => {
  it('finds a name that is present and not one that is absent', () => {
    expect(mentions('Bowie asked Chet a question.', 'Bowie')).toBe(true);
    expect(mentions('Bowie asked Chet a question.', 'Chris McLean')).toBe(false);
    // the one-letter name the roster actually contains
    expect(mentions('Beardo said nothing.', 'B')).toBe(false);
    expect(mentions('B said nothing.', 'B')).toBe(true);
  });
});

/** The screen as it stands once every beat has been revealed. */
function fullyRevealed(ep) {
  const first = rpBuildConclave(ep, 'audience');
  const total = Number(/trConclaveRevealAll\('conclave',(\d+),(\d+)\)/.exec(first)[1]);
  const epNum = Number(/trConclaveRevealAll\('conclave',\d+,(\d+)\)/.exec(first)[1]);
  trConclaveRevealAll('conclave', total, epNum);
  return rpBuildConclave(ep, 'audience');
}

describe('the conclave record reaches the screen at all', () => {
  it('a real season records a conclave on the nights it held one', () => {
    expect(NIGHTS.length, 'no season played a conclave — the record is not being written')
      .toBeGreaterThan(10);
    for (const { ep } of NIGHTS) {
      const c = ep.tr.conclave;
      expect(c.target, `ep ${ep.num}: a conclave with no name`).toBeTruthy();
      expect(c.turret.length, `ep ${ep.num}: a meeting nobody attended`).toBeGreaterThan(0);
      expect(c.ballots.every(b => b.channel === 'murder'),
        'a conclave ballot on the wrong channel').toBe(true);
      // ONE ARGUMENT, ONE BALLOT. The two lists are written by different lines
      // in js/tr/headless.js off the same decision, and they are the only two
      // places the losing preference exists. If they disagree, one of them has
      // quietly started re-deriving the room from the victim -- which produces
      // a unanimous conclave every night and erases the mechanism the format
      // runs on. The screen survives that mutation by drawing the losers from
      // `overruled` instead, which is exactly why it has to be caught here and
      // not by looking at the render.
      if (c.argued.length) {
        expect(c.ballots.length,
          `ep ${ep.num}: ${c.argued.length} arguments but ${c.ballots.length} ballots`)
          .toBe(c.argued.length);
        expect(c.ballots.map(b => b.voter).sort())
          .toEqual(c.argued.map(a => a.traitor).sort());
      }
    }
  });

  it('the overruled ballot survives onto the record', () => {
    // The single most important thing on it. Re-deriving who wanted whom dead
    // from the victim produces a unanimous conclave every night and erases the
    // mechanism; js/tr/export.js says so about `murderBallots` and it is just
    // as true here.
    const withLoss = NIGHTS.filter(n => (n.ep.tr.conclave.overruled || []).length);
    expect(withLoss.length, 'no night recorded an overrule across four seasons')
      .toBeGreaterThan(3);
    for (const { ep } of withLoss) {
      const c = ep.tr.conclave;
      for (const o of c.overruled) {
        expect(c.turret).toContain(o.loser);
        if (o.theirTarget) expect(o.theirTarget).not.toBe(c.target);
      }
    }
  });
});

// ── GUARD 1: the conclave is not public ───────────────────────────────
describe('the conclave must never render as public', () => {
  it('the registry declares the private channel, and the export honours it', () => {
    // The rule lives in js/shows.js and `publicBallots()` is how a reader
    // applies it. Nothing here re-derives the channel name.
    expect(SHOWS.traitors.privateBallotChannels).toContain('murder');
    for (const r of RUNS) {
      for (const row of traitorsVotingHistory(r.season)) {
        expect(publicBallots(row, 'traitors').some(b => b.channel === 'murder'),
          `ep ${row.episode}: a private ballot came back from publicBallots`).toBe(false);
      }
    }
  });

  it('an audience observer sees the conclave', () => {
    for (const { ep } of NIGHTS.slice(0, 8)) {
      const html = rpBuildConclave(ep, 'audience');
      const text = strip(html);
      expect(text, `ep ${ep.num}`).toContain(ep.tr.conclave.target);
      // EVERY name argued for, not only the one that carried. Dropping the
      // losing arguments still renders a perfectly plausible screen -- a
      // unanimous conclave -- and erases the entire mechanism the room runs
      // on. It has to be asserted directly, because nothing about the result
      // looks wrong without it.
      // Read off `ballots`, which js/tr/headless.js builds from the conclave's
      // own decision, and NOT off `argued` -- asserting the screen against the
      // same list the screen was built from is a tautology, and it passes a
      // mutation that drops every losing argument on the way onto the record.
      for (const b of ep.tr.conclave.ballots) {
        expect(mentions(text, b.voted),
          `ep ${ep.num}: ${b.voter} argued for ${b.voted} and the screen never says so`)
          .toBe(true);
        expect(mentions(text, b.voter), `ep ${ep.num}: ${b.voter} is not on the screen`)
          .toBe(true);
      }
      // and the losing argument on the record, which is the whole point of it
      for (const o of ep.tr.conclave.overruled) {
        if (o.theirTarget) expect(text).toContain(o.theirTarget);
      }
    }
  });

  it('a Faithful observer sees no ballot, no name and no arguer', () => {
    let checked = 0;
    for (const { ep } of NIGHTS) {
      const c = ep.tr.conclave;
      // Somebody living who was NOT in the turret. `living` is the room as it
      // stood when the episode was recorded.
      // NOT somebody the turret argued for, and not the chosen name. The
      // withheld render prints the OBSERVER'S OWN NAME, twice, because it is
      // addressed to them — so an observer who happens to be on a ballot would
      // fail this for the one reason that is not a leak. Their own name is not
      // news to them; anybody else's is.
      const onBallot = new Set(c.ballots.flatMap(b => [b.voter, b.voted]).filter(Boolean));
      const outsider = (ep.tr.living || [])
        .find(n => !c.turret.includes(n) && !onBallot.has(n) && n !== c.target);
      if (!outsider) continue;
      const html = rpBuildConclave(ep, `player:${outsider}`);
      const text = strip(html);
      for (const b of c.ballots) {
        expect(mentions(text, b.voter),
          `ep ${ep.num}: a conclave ballot's voter (${b.voter}) reached a Faithful`).toBe(false);
        expect(mentions(text, b.voted),
          `ep ${ep.num}: a conclave ballot's target (${b.voted}) reached a Faithful`).toBe(false);
      }
      expect(mentions(text, c.target),
        `ep ${ep.num}: the chosen name reached a Faithful`).toBe(false);
      for (const t of c.turret) {
        expect(mentions(text, t), `ep ${ep.num}: ${t} was named to a Faithful`).toBe(false);
      }
      checked++;
    }
    expect(checked, 'no night had anybody outside the turret to check').toBeGreaterThan(10);
  });

  it('a Traitor who was in the turret does see it, and one who was not does not', () => {
    // Both halves, so the guard cannot pass by refusing everybody.
    const night = NIGHTS.find(n => n.ep.tr.conclave.turret.length >= 2);
    const c = night.ep.tr.conclave;
    const inside = strip(rpBuildConclave(night.ep, `player:${c.turret[0]}`));
    expect(inside).toContain(c.target);
    const outsider = (night.ep.tr.living || [])
      .find(n => !c.turret.includes(n) && n !== c.target);
    expect(mentions(strip(rpBuildConclave(night.ep, `player:${outsider}`)), c.target)).toBe(false);
  });

  it('an observer string it does not understand is refused, not indulged', () => {
    const c = NIGHTS[0].ep.tr.conclave;
    expect(conclaveVisibleTo(c, 'audience')).toBe(true);
    expect(conclaveVisibleTo(c, `player:${c.turret[0]}`)).toBe(true);
    expect(conclaveVisibleTo(c, 'producer')).toBe(false);
    expect(conclaveVisibleTo(c, '')).toBe(false);
    expect(conclaveVisibleTo(c, 'player:Nobody At All')).toBe(false);
  });
});

// ── GUARD 2: no other show's vocabulary ─────────────────────
//
// ONE LIST, IMPORTED. `forbiddenFor('traitors')` derives from the same `VOCAB`
// table tests/show-vocabulary.test.js runs on, which now lives in
// tests/helpers/show-vocabulary.js. This file used to RESTATE that list — two
// copies of one rule, which is the shape that has quietly stopped four guards
// in this repo from guarding. Extending the table there now tightens this
// screen on the same commit, which is the entire point of moving it.

describe("the castle may not be described in another show's words", () => {
  it('the list it checks against is the shared one, and is not empty', () => {
    // A negative guard on an empty list passes for free. `forbiddenFor` derives
    // by subtraction, so a typo in the traitors entry could silently empty it.
    const forbidden = forbiddenFor('traitors');
    expect(forbidden.length).toBeGreaterThan(20);
    for (const w of ['tribal council', 'head of household', 'houseguest', 'merge']) {
      expect(forbidden, `the shared table stopped forbidding "${w}" on the castle`)
        .toContain(w);
    }
    // and the matcher itself fires, or every assertion below is vacuous
    expect(foreignWordsIn('They met at the tribal council.', 'traitors'))
      .toContain('tribal council');
    expect(foreignWordsIn('They met in the turret.', 'traitors')).toEqual([]);
  });

  it('nothing the screen prints belongs to another show', () => {
    for (const { ep } of NIGHTS.slice(0, 12)) {
      const leaks = foreignWordsIn(strip(rpBuildConclave(ep, 'audience')), 'traitors');
      expect(leaks, `ep ${ep.num} printed another show's vocabulary`).toEqual([]);
    }
  });

  it('the withheld render is checked too, because it is prose as well', () => {
    const night = NIGHTS[0];
    const outsider = (night.ep.tr.living || [])
      .find(n => !night.ep.tr.conclave.turret.includes(n));
    expect(outsider).toBeTruthy();
    const leaks = foreignWordsIn(
      strip(rpBuildConclave(night.ep, `player:${outsider}`)), 'traitors');
    expect(leaks).toEqual([]);
  });
});


// ── GUARD 3: every exit word comes from the registry ──────────────────
describe('the exit verbs come from the registry and nowhere else', () => {
  const SOURCES = [
    'js/vp-tr/conclave.js',
    'js/vp-tr/style.js',
    'js/vp-tr/scenery.js',
    'js/vp-tr/round-table.js',
  ];

  it('no source file writes an exit verb as a literal', () => {
    // Comments are stripped first: this file's own header has to be able to
    // NAME the words it is forbidding, and the previous version of this idea
    // in the repo failed on its own documentation.
    for (const f of SOURCES) {
      const src = readFileSync(new URL('../' + f, import.meta.url), 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, ' ')
        .replace(/(^|[^:])\/\/[^\n]*/g, '$1 ');
      for (const verb of exitVerbs('traitors')) {
        expect(new RegExp('\\b' + verb + '\\b', 'i').test(src),
          `${f} writes "${verb}" as a literal instead of taking it from exitVerbs()`)
          .toBe(false);
      }
    }
  });

  it('the words it does print are the registry\'s, character for character', () => {
    const [banish, murder] = exitVerbs('traitors');
    const cap = w => w.charAt(0).toUpperCase() + w.slice(1);
    // A night with a public banishment AND a landed conclave prints both.
    const night = NIGHTS.find(n => n.ep.eliminated && !n.ep.tr.conclave.blocked);
    expect(night, 'no night carried both a public exit and a private one').toBeTruthy();
    // Fully revealed, because the letter's fate is GATED: an unrevealed screen
    // does not say what happens to the name on it, and must not.
    const text = strip(fullyRevealed(night.ep));
    expect(text).toContain(cap(banish));
    expect(text).toContain(cap(murder));
  });
});

// ── THE HOST IS A VARIABLE ────────────────────────────────────────────
describe('no narration names a host', () => {
  it('no source file writes a host name as a literal', () => {
    // The general form, and the one that actually holds. Rendering one night
    // and checking the prose only catches the variant that night happened to
    // draw -- with four lines per slot, a hardcoded name hides three times out
    // of four. Comments are stripped, because the file's own header has to be
    // able to explain what it is forbidding.
    for (const f of ['js/vp-tr/conclave.js', 'js/vp-tr/style.js', 'js/vp-tr/scenery.js',
      'js/vp-tr/round-table.js']) {
      const src = readFileSync(new URL('../' + f, import.meta.url), 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, ' ')
        .replace(/(^|[^:])\/\/[^\n]*/g, '$1 ');
      for (const h of HOSTS_BY_FORMAT.traitors) {
        for (const part of [h.label, h.value, ...String(h.label).split(/\s+/)]) {
          if (!part || part.length < 3) continue;
          expect(new RegExp('\\b' + part + '\\b').test(src),
            `${f} hardcodes the host name "${part}" instead of resolving it`).toBe(false);
        }
      }
    }
  });

  it('the screen prints whichever host the season is configured with', () => {
    const night = NIGHTS[0];
    const hosts = HOSTS_BY_FORMAT.traitors;
    const before = seasonConfig.host;
    try {
      for (const h of hosts) {
        seasonConfig.host = h.value;
        // Several nights, because each host slot has four variants and one
        // night draws one of them.
        const text = NIGHTS.slice(0, 8)
          .map(n => strip(rpBuildConclave(n.ep, 'audience'))).join(' ');
        expect(text, `configured host ${h.value} does not appear`).toContain(h.label);
        for (const other of hosts) {
          if (other.value === h.value) continue;
          // Every part of the other hosts' names, not only the full label. A
          // line reading "Valeria here." does not contain "Valeria Sandoval",
          // so a label-only check passes a hardcoded first name -- which is
          // the exact shape this bug takes when somebody writes one line of
          // copy in the host's voice.
          for (const part of [other.label, other.value, ...String(other.label).split(/\s+/)]) {
            if (!part || part.length < 3) continue;
            expect(mentions(text, part),
              `"${part}" appears on a season hosted by ${h.label}`).toBe(false);
          }
        }
      }
    } finally { seasonConfig.host = before; }
  });
});

// ── REACHABILITY: this project's signature bug class ──────────────────
describe('the screen is reachable from a played season', () => {
  it('buildVPScreens registers the conclave for every night that held one', () => {
    let seen = 0;
    for (const r of RUNS) {
      for (const ep of r.episodes) {
        const screens = buildVPScreens(ep);
        const hit = screens.find(s => s.id === 'tr-conclave');
        if (!ep.tr || !ep.tr.conclave) {
          // A recruitment night or an endgame table holds no conclave, and the
          // screen must not be registered for it.
          expect(hit, `ep ${ep.num} registered a conclave it never held`).toBeUndefined();
          continue;
        }
        expect(hit, `ep ${ep.num}: the conclave screen is not reachable`).toBeTruthy();
        expect(hit.label).toBe('The Conclave');
        expect(strip(hit.html)).toContain(ep.tr.conclave.target);
        seen++;
      }
    }
    expect(seen, 'no played episode reached the screen').toBeGreaterThan(10);
  });

  it('a Traitors row never falls through to another show\'s screens', () => {
    // The failure this catches is silent and total: a row with no `format` is
    // drawn with Total Drama's builders, and a castle gets tribes and a Tribal
    // Council over the top of it.
    for (const r of RUNS) {
      for (const ep of r.episodes) {
        expect(ep.format, `ep ${ep.num} is not stamped with its format`).toBe('traitors');
        const ids = buildVPScreens(ep).map(s => s.id);
        expect(ids.filter(id => !String(id).startsWith('tr-')),
          `ep ${ep.num} registered a screen from another show`).toEqual([]);
      }
    }
  });
});

// ── THE REVEAL CONTRACT ───────────────────────────────────────────────
describe('the reveal machinery has the element ids the pattern requires', () => {
  it('step divs, counter and controls are all addressable by id', () => {
    const html = rpBuildConclave(NIGHTS[0].ep, 'audience');
    expect(html).toContain('id="cv-counter-conclave"');
    expect(html).toContain('id="cv-controls-conclave"');
    expect(html).toContain('id="cv-sidebar-inner"');
    expect(html).toContain('id="cv-step-conclave-0"');
    // Inline handlers BAKE their targets — renderVPScreen wipes reveal state on
    // every paint and there is no closure left to hold them.
    expect(html).toMatch(/trConclaveRevealNext\('conclave',\d+,\d+\)/);
    expect(html).toMatch(/trConclaveRevealAll\('conclave',\d+,\d+\)/);
  });

  it('the counter total matches the number of steps actually rendered', () => {
    for (const { ep } of NIGHTS.slice(0, 6)) {
      const html = rpBuildConclave(ep, 'audience');
      const steps = (html.match(/id="cv-step-conclave-\d+"/g) || []).length;
      const total = Number(/trConclaveRevealAll\('conclave',(\d+),/.exec(html)[1]);
      expect(total, `ep ${ep.num}: the controls promise a step count the stream does not have`)
        .toBe(steps);
      expect(html).toContain(`/ ${steps}</span>`);
    }
  });

  it('every animation has a reduced-motion escape', () => {
    const html = rpBuildConclave(NIGHTS[0].ep, 'audience');
    expect(html).toContain('@media(prefers-reduced-motion:reduce)');
  });

  it('the shell is 1100px and centred, never full-screen', () => {
    const html = rpBuildConclave(NIGHTS[0].ep, 'audience');
    expect(html).toContain('max-width:1100px;margin:0 auto');
  });

  it('nothing is drawn over the 46px nav bar', () => {
    // The mockup is standalone and sits its scenery at top:0. The real VP has
    // .rp-nav above it, and the mockup says so in a comment.
    const html = rpBuildConclave(NIGHTS[0].ep, 'audience');
    expect(html).toContain('.cv-veil,.cv-vig,.cv-grain{position:absolute;left:0;right:0;top:46px');
    expect(html).toContain('position:sticky;top:56px');
  });

  it('there is no emoji anywhere on the screen', () => {
    // Icons are hand-drawn inline SVG. An emoji in here would be the one thing
    // that instantly reads as a different repo's screen.
    for (const { ep } of NIGHTS.slice(0, 6)) {
      const html = rpBuildConclave(ep, 'audience');
      expect(/\p{Extended_Pictographic}/u.test(html), `ep ${ep.num} has an emoji in it`)
        .toBe(false);
    }
  });
});

// ── THE SIDEBAR HAS TO STILL BE THERE AT BEAT ELEVEN ──────────────────
//
// CLAUDE.md requires a live-updating sidebar: it shows state as the beats
// reveal and is gated so it never spoils ahead. It is useless if it has left
// the viewport by the third beat, and it had. `.cv-shell` carried
// `overflow:hidden` to clip the scenery, which ALSO made the shell a scroll
// container, which kills `position:sticky` for every descendant. Measured:
// `.cv-side` computed top -2455 at a page scroll of 3000.
//
// This is not a look — it is a layout rule with a measurable answer, and it
// was equally true of the approved mockup, so both were fixed together.
describe('the sticky sidebar is not killed by the shell clip', () => {
  const built = () => rpBuildConclave(NIGHTS[0].ep, 'audience');

  it('the shell does not clip, and a scenery layer does it instead', () => {
    const html = built();
    // The shell must not be a scroll container. Anything but `visible` here
    // (hidden, auto, scroll, clip) re-establishes one and the sidebar goes.
    const shellRule = /\.cv-shell\{([^}]*)\}/.exec(html)[1];
    expect(shellRule, 'the shell clips again and the sidebar will not stick')
      .not.toMatch(/overflow:\s*(hidden|auto|scroll|clip)/);
    expect(shellRule).toMatch(/overflow:\s*visible/);
    // and the clip has to live somewhere, or the planes escape
    expect(html).toContain('.cv-scenery{position:absolute;inset:0;overflow:hidden');
    // the sidebar still asks to stick, which is the thing being unblocked
    expect(html).toContain('position:sticky;top:56px');
  });

  it('the element that sticks is shorter than the column that contains it', () => {
    // THE OTHER HALF OF THE SAME BUG, and the half the clip fix alone did not
    // reach. `position:sticky` on .cv-side did nothing even with the shell
    // unclipped, because the rail is as tall as the grid that contains it
    // (3946px of both, measured) and sticky needs range to move through. So
    // the rail keeps the border, the gradient and the full height, and the
    // sticky element is the inner panel -- which is also the element the
    // reveal handlers replace by id, so it survives every innerHTML swap.
    const html = built();
    const rail = /\.cv-side\{([^}]*)\}/.exec(html)[1];
    expect(rail, 'the rail is sticky again and has no range to stick through')
      .not.toMatch(/position:\s*sticky/);
    const panel = /#cv-sidebar-inner\{([^}]*)\}/.exec(html)[1];
    expect(panel).toMatch(/position:\s*sticky/);
    expect(panel).toMatch(/top:56px/);
    // and it is bounded, or a long sidebar runs off the bottom of the screen
    // with no way to reach the end of it
    expect(panel).toMatch(/max-height:/);
    expect(panel).toMatch(/overflow-y:\s*auto/);
    // the id has to exist in the markup for any of that to attach to
    expect(html).toContain('id="cv-sidebar-inner"');
  });

  it('the scenery layer takes no z-index, or the blend modes change picture', () => {
    // With z-index:auto it is NOT a stacking context, so .cv-grain still
    // paints at 9 above .cv-body at 5, and the veil{screen} / vig{multiply}
    // still blend against the shell background rather than an isolated,
    // transparent group. A z-index here silently re-grades the whole screen.
    const rule = /\.cv-scenery\{([^}]*)\}/.exec(built())[1];
    expect(rule).not.toMatch(/z-index/);
  });

  it('every plane is inside the clip layer, not loose in the shell', () => {
    const html = built();
    for (const cls of ['cv-far', 'cv-mid', 'cv-fore', 'cv-veil', 'cv-vig', 'cv-grain']) {
      const at = html.indexOf('<div class="' + cls + '"');
      expect(at, cls + ' is not rendered').toBeGreaterThan(-1);
      const layer = html.lastIndexOf('<div class="cv-scenery"', at);
      const body = html.lastIndexOf('<div class="cv-body">', at);
      expect(layer, cls + ' escaped the clip layer').toBeGreaterThan(-1);
      expect(layer, cls + ' is drawn after the body, outside the clip')
        .toBeGreaterThan(body);
    }
    // and the withheld render, which is short enough that its planes would
    // otherwise hang below the bottom of the shell with nothing to cut them
    const night = NIGHTS[0];
    const outsider = (night.ep.tr.living || [])
      .find(n => !night.ep.tr.conclave.turret.includes(n));
    expect(rpBuildConclave(night.ep, 'player:' + outsider))
      .toContain('<div class="cv-scenery"');
  });
});

// ── THE IRONY GUTTER IS SPARSE, NEVER CYCLED ──────────────────────────
//
// It used to wrap — down[i % down.length] — so a quiet round printed its one
// castle scene against half the cards and two beats four minutes apart said
// the same sentence. Repetition is the worse failure of the two: it reads as a
// bug, and seven plans of this project have been spent on it.
describe('the irony gutter does not repeat itself', () => {
  const gutterLines = html => (html.match(/<span class="cv-margin-txt">([^<]*)<\/span>/g) || [])
    .map(m => m.replace(/<[^>]+>/g, '').trim());

  it('no two gutter lines in one night say the same thing', () => {
    let withAny = 0;
    for (const { ep } of NIGHTS) {
      const lines = gutterLines(rpBuildConclave(ep, 'audience'));
      if (lines.length) withAny++;
      expect(new Set(lines).size,
        'ep ' + ep.num + ': the gutter printed the same castle line twice')
        .toBe(lines.length);
    }
    // ...and it does print SOME, or the guard above is a guard on an empty set
    expect(withAny, 'no night printed a gutter line at all').toBeGreaterThan(10);
  });

  it('a night with fewer scenes than beats leaves the extra minutes blank', () => {
    // The honest output, and the one the cycling version could never produce.
    // A quiet castle IS quiet; an empty minute says so.
    const quiet = NIGHTS.find(n => {
      const html = rpBuildConclave(n.ep, 'audience');
      const beats = (html.match(/id="cv-step-conclave-\d+"/g) || []).length;
      return gutterLines(html).length < beats;
    });
    expect(quiet, 'no night across four seasons had a quiet minute to check')
      .toBeTruthy();
    const html = rpBuildConclave(quiet.ep, 'audience');
    const beats = (html.match(/id="cv-step-conclave-\d+"/g) || []).length;
    const cells = (html.match(/class="cv-margin[ "]/g) || []).length;
    // one gutter cell per beat, always: the column's rule never breaks
    expect(cells).toBe(beats);
    expect(html).toContain('class="cv-margin cv-margin-quiet"');
    // no timestamp on a blank minute, because nothing happened in it
    const stamps = (html.match(/class="cv-margin-time"/g) || []).length;
    expect(stamps).toBe(gutterLines(html).length);
  });

  it('a scene is never spent twice even if the castle recorded it twice', () => {
    // Two threads can put the same line into one evening. A repeat is a repeat
    // wherever it came from, so the note text is deduped as well as the slot.
    const ep = NIGHTS[0].ep;
    const dup = { ...ep, tr: { ...ep.tr, downstairs: [
      { parties: ['A'], note: 'The same thing, twice.' },
      { parties: ['B'], note: 'The same thing, twice.' },
      { parties: ['C'], note: 'A different thing.' },
    ] } };
    const lines = gutterLines(rpBuildConclave(dup, 'audience'));
    expect(lines).toEqual(['The same thing, twice.', 'A different thing.']);
  });
});

// ── THE DARKENING BELONGS TO THIS SCREEN, NOT TO THE HELPER ───────────
//
// The turret is a dark room lit by one lamp, so its portraits are rim-lit on
// the lantern side and sunk into shadow on the other. That is right HERE and
// wrong in all six rooms Tasks 2-5 build: the Round Table, the cold open,
// house status, the mission, recruitment and the endgame are not this room,
// and a portrait that arrived pre-darkened would look broken on every one of
// them. Same principle as the vocabulary coming from the registry — the shared
// thing stays neutral and each screen opts into its own character.
describe('the portrait helper is neutral and the conclave lights it itself', () => {
  it('the shared helper renders no lighting at all', () => {
    const neutral = _portrait('chef-hatchet', 'Chef Hatchet', 40);
    expect(neutral).toContain('class="cv-av"');
    expect(neutral, 'the shared portrait arrived pre-lit').not.toContain('cv-lit');
    expect(neutral, 'a tone without the lamp means nothing').not.toContain('data-lit');
    // it is still a portrait: the niche, the initials fallback and the picture
    expect(neutral).toContain('cv-av-ini');
    expect(neutral).toContain('assets/avatars/chef-hatchet.png');
    expect(neutral).toContain('CH');
  });

  it('every lighting declaration is qualified by .cv-lit', () => {
    const html = rpBuildConclave(NIGHTS[0].ep, 'audience');
    // The rim-light, the hood and the graded film are the treatment. If any of
    // them is declared on bare .cv-av, a neutral portrait on a later screen
    // inherits the turret whether it wants it or not.
    expect(html).not.toMatch(/\.cv-av::(before|after)\{/);
    expect(html).not.toMatch(/\.cv-av img\{[^}]*filter:/);
    expect(html).not.toMatch(/\.cv-av\[data-lit/);
    expect(html).toContain('.cv-av.cv-lit::before{');
    expect(html).toContain('.cv-av.cv-lit::after{');
    expect(html).toMatch(/\.cv-av\.cv-lit img\{[^}]*filter:/);
  });

  it('but this screen does ask for the lamp, on every face it draws', () => {
    for (const { ep } of NIGHTS.slice(0, 6)) {
      const html = rpBuildConclave(ep, 'audience');
      // the OPENING tag of a portrait only: `cv-av-ini` is the initials span
      // inside one and would otherwise be counted as an unlit face.
      const opens = html.match(/<span class="cv-av(?: cv-lit)?"/g) || [];
      expect(opens.length, 'ep ' + ep.num + ': the screen drew no portraits')
        .toBeGreaterThan(4);
      for (const o of opens) {
        expect(o, 'ep ' + ep.num + ': a turret portrait is unlit: ' + o)
          .toContain('cv-lit');
      }
    }
  });
});

// ── DETERMINISM ───────────────────────────────────────────────────────
describe('the screen redraws identically', () => {
  it('two builds of the same night are the same screen', () => {
    // It is rebuilt on every paint and on every reveal. Anything drawn from
    // Math.random would swim under the reader — the dust, the embers, and every
    // narration variant. Ids are the only thing allowed to differ, because SVG
    // gradient ids have to be unique per document.
    const ep = NIGHTS[0].ep;
    const norm = h => h.replace(/(sd|sp|cvClk)x?\d+/g, '#');
    expect(norm(rpBuildConclave(ep, 'audience')))
      .toBe(norm(rpBuildConclave(ep, 'audience')));
  });
});

// ══════════════════════════════════════════════════════════════════════
// THE ROUND TABLE
// ══════════════════════════════════════════════════════════════════════
//
// The public half of the night, and the screen where the ONLY public-certainty
// facts this engine produces are read out one at a time. Three things about it
// are invisible by looking at it, and every one of them is a way the show's
// central secret or its last act gets given away:
//
//   1. THE MURDER BALLOTS SIT IN THE SAME ARRAY. `votes[]` carries the
//      conclave's ballots beside this table's and they are told apart by
//      `channel` alone. Plan 7 caught js/social/archive.js iterating that
//      array unfiltered and publishing five nights of the turret as public
//      "Accusation" events. A rendered slate that came off the wrong channel
//      looks exactly like a rendered slate that did not.
//   2. A REVOTE MERGED INTO THE FIRST COUNT still renders a perfectly
//      plausible board. It is simply the wrong one, and nothing about the
//      picture says so.
//   3. THE ENDGAME'S SILENCE IS THE DESIGN (spec §8). An alignment card on a
//      finale table is a complete, handsome, correct-looking screen that has
//      destroyed the only thing making the last votes feel different.
//
// And the observer contract, which on THIS screen is a narrow thing and has to
// be tested as the narrow thing it is: the table is public, so both layers see
// every slate. What only the audience gets is whether the room is RIGHT.

const TABLES = RUNS.flatMap(r => r.episodes.filter(e => e.tr && e.tr.table)
  .map(e => ({ ep: e, run: r })));

/** The screen once every beat has been revealed. */
function tableFullyRevealed(ep, observer = 'audience') {
  const first = rpBuildRoundTable(ep, observer);
  const m = /trRoundTableRevealAll\('roundtable',(\d+),(\d+)\)/.exec(first);
  trRoundTableRevealAll('roundtable', Number(m[1]), Number(m[2]));
  return rpBuildRoundTable(ep, observer);
}
/**
 * The same night, on a fresh reveal state.
 *
 * Reveal state is module-level and keyed by episode number, so a test that
 * revealed episode 4 earlier in the file leaves episode 4 revealed for every
 * test after it — and an arm asserting "nothing is on the map yet" would then
 * pass or fail on the order the file happens to run in. A clone with an
 * episode number nothing else uses gets its own key.
 */
let _freshN = 9000;
function tableUnrevealed(ep, observer = 'audience') {
  return rpBuildRoundTable({ ...ep, num: ++_freshN }, observer);
}

/** Every slate the screen actually drew, as (voter, name, channel). */
function slatesOf(html) {
  const out = [];
  const re = /<div class="rt-slate" data-voter="([^"]*)" data-target="([^"]*)" data-channel="([^"]*)"/g;
  let m;
  while ((m = re.exec(html))) out.push({ voter: m[1], target: m[2], channel: m[3] });
  return out;
}
/** One count board, by the round it belongs to. */
function countBoard(html, round) {
  const at = html.indexOf('<div class="rt-count" data-round="' + round + '"');
  if (at < 0) return null;
  const end = html.indexOf('<div class="rt-count" data-round="' + (round + 1) + '"', at);
  const block = html.slice(at, end < 0 ? undefined : end);
  const out = {};
  const re = /<span class="rt-tally-nm">([^<]*)<\/span><span class="rt-tally-n">(\d+)<\/span>/g;
  let m;
  while ((m = re.exec(block))) out[m[1]] = Number(m[2]);
  return out;
}
const sumOf = obj => Object.keys(obj || {}).reduce((n, k) => n + obj[k], 0);

describe('the table record reaches the screen at all', () => {
  it('a real season records a table on every night it held one, and none it did not', () => {
    expect(TABLES.length, 'no season recorded a Round Table').toBeGreaterThan(25);
    let withMurderBallots = 0;
    for (const { ep } of TABLES) {
      const t = ep.tr.table;
      expect(t.seated.length, `ep ${ep.num}: a table nobody sat at`).toBeGreaterThan(1);
      const first = t.votes.filter(b => b.channel === 'banishment');
      expect(first.map(b => b.voter).sort()).toEqual([...t.seated].sort());
      if (t.votes.some(b => b.channel === 'murder')) withMurderBallots++;
    }
    // THE FILTER MUST HAVE WORK TO DO. If the record only ever carried public
    // ballots, `publicBallots()` would filter nothing and every guard below it
    // would pass without ever dropping one — which is the exact shape of the
    // three vacuous guards Task 1 shipped and caught with its own mutations.
    expect(withMurderBallots,
      'no recorded table carried a private ballot, so the channel filter is untested')
      .toBeGreaterThan(10);
  });

  it('the first night holds no table, and the screen is not built for it', () => {
    for (const r of RUNS) {
      const one = r.episodes.find(e => e.num === 1);
      expect(one.tr.table, 'night one held a table it should not have').toBeFalsy();
      expect(rpBuildRoundTable(one, 'audience')).toContain('The Table Does Not Sit');
    }
  });
});

// ── GUARD 4: only the public channel is rendered ──────────────────────
describe('the screen renders only the public ballots', () => {
  it('publicBallots is the rule, and it drops the conclave on every table', () => {
    for (const { ep } of TABLES) {
      expect(publicBallots(ep.tr.table, 'traitors').some(b => b.channel === 'murder'),
        `ep ${ep.num}: a private ballot came back from publicBallots`).toBe(false);
    }
  });

  it('every slate on the screen is a ballot publicBallots returned, and all of them are', () => {
    for (const { ep } of TABLES) {
      const html = tableFullyRevealed(ep);
      const drawn = slatesOf(html).map(s => s.voter + '|' + s.target + '|' + s.channel).sort();
      const want = publicBallots(ep.tr.table, 'traitors')
        .map(b => b.voter + '|' + (b.target || '') + '|' + b.channel).sort();
      expect(drawn, `ep ${ep.num}: the slates and the public ballots disagree`).toEqual(want);
    }
  });

  it('no murder ballot is drawn as a slate, and the check is not empty', () => {
    // THE PAIR IS THE TEST, NOT THE NAME. Every Traitor who voted in the
    // turret is also sitting at this table for entirely public reasons, so a
    // guard that greps the page for their name can never fail. What must not
    // appear is the PAIRING — this voter wrote that name — and only for the
    // pairs the public ballots do not already contain.
    let checkedPairs = 0;
    for (const { ep } of TABLES) {
      const t = ep.tr.table;
      const pub = new Set(publicBallots(t, 'traitors')
        .map(b => b.voter + '|' + (b.target || '')));
      const secret = t.votes.filter(b => b.channel === 'murder')
        .map(b => b.voter + '|' + (b.target || ''))
        .filter(p => !pub.has(p));
      if (!secret.length) continue;
      const drawn = new Set(slatesOf(tableFullyRevealed(ep))
        .map(s => s.voter + '|' + s.target));
      for (const p of secret) {
        expect(drawn.has(p), `ep ${ep.num}: the conclave's ballot "${p}" is on the public screen`)
          .toBe(false);
        checkedPairs++;
      }
    }
    expect(checkedPairs,
      'no night produced a private pairing to check, so this guard proved nothing')
      .toBeGreaterThan(10);
  });
});

// ── GUARD 5: a revote is its own state ────────────────────────────────
describe('a revote is its own screen state and never a second helping', () => {
  const withRevote = () => TABLES.filter(t => (t.ep.tr.table.revotes || []).length);

  it('a real season produces revotes to check', () => {
    expect(withRevote().length, 'no table across four seasons went to a revote')
      .toBeGreaterThan(2);
  });

  it('the first count holds the first ballots and nothing else', () => {
    let contested = 0, stranded = 0;
    for (const { ep } of withRevote()) {
      const t = ep.tr.table;
      const html = tableFullyRevealed(ep);
      const first = t.votes.filter(b => b.channel === 'banishment');
      const later = t.votes.filter(b => b.channel === 'banishment-revote');
      // A REVOTE CAN CAST NOTHING, and it is not a defect. When every living
      // player draws one name the whole room is tied, and the format's rule
      // (the tied do not vote) leaves no electorate at all — the engine falls
      // through to a seeded draw. Counted rather than skipped, because a guard
      // that silently accepts every night is a guard that stopped guarding.
      if (!later.length) { stranded++; continue; }
      contested++;
      const board = countBoard(html, 0);
      expect(board, `ep ${ep.num}: no first count on the screen`).toBeTruthy();
      // The Dagger is a weight rather than a ballot, so the board can exceed
      // the ballot count by exactly what it is worth — and by nothing else.
      const weight = t.dagger && first.some(b => b.voter === t.dagger.holder)
        ? (t.dagger.votes || 1) - 1 : 0;
      expect(sumOf(board),
        `ep ${ep.num}: the first count is carrying the revote's ballots`)
        .toBe(first.filter(b => b.target).length + weight);
      // and the revote has a board of its own, which is the other half
      const second = countBoard(html, 1);
      expect(second, `ep ${ep.num}: the revote has no count of its own`).toBeTruthy();
      expect(sumOf(second)).toBeGreaterThan(0);
    }
    expect(contested,
      'every revote across four seasons was a stranded one, so nothing was compared')
      .toBeGreaterThan(1);
    // and the stranded case exists, so the branch above is not dead code
    expect(stranded + contested).toBe(withRevote().length);
  });

  it('the revote slates are in their own phase, and the first ones are not', () => {
    for (const { ep } of withRevote()) {
      const html = tableFullyRevealed(ep);
      // Split the stream into beats and ask which phase each slate is in.
      const beats = html.split(/<div class="rt-beat[^"]*" id="rt-step-roundtable-\d+" data-phase="/)
        .slice(1).map(s => ({ phase: s.slice(0, s.indexOf('"')), body: s }));
      if (!ep.tr.table.votes.some(b => b.channel === 'banishment-revote')) continue;
      let readSlates = 0, revoteSlates = 0;
      for (const b of beats) {
        for (const s of slatesOf(b.body)) {
          if (s.channel === 'banishment') {
            expect(b.phase, `ep ${ep.num}: a first ballot is in the "${b.phase}" phase`)
              .toBe('read');
            readSlates++;
          } else {
            expect(b.phase, `ep ${ep.num}: a revote ballot is in the "${b.phase}" phase`)
              .toBe('revote');
            revoteSlates++;
          }
        }
      }
      expect(readSlates).toBeGreaterThan(0);
      expect(revoteSlates).toBeGreaterThan(0);
    }
  });
});

// ── GUARD 6: no alignment is revealed in the endgame ──────────────────
//
// Spec §8. The survivors go on nerve alone and that absence is what makes the
// last votes feel unlike every earlier one. There are TWO locks — the record
// refuses to carry the alignment onto a finale table, and the screen refuses
// to draw it — and they are asserted separately, because a guard that only
// proves the render is silent cannot tell a screen that refuses from a screen
// handed nothing to print.
describe('the endgame reveals nothing, on the record and on the screen', () => {
  const ENDGAME = TABLES.filter(t => t.ep.tr.table.endgame);
  const MANDATED = TABLES.filter(t => !t.ep.tr.table.endgame);

  it('a real season reaches an endgame table to check', () => {
    expect(ENDGAME.length, 'no season across four seeds played a finale table')
      .toBeGreaterThan(3);
  });

  it('LOCK ONE: the record carries no alignment and no ground truth there', () => {
    for (const { ep } of ENDGAME) {
      const t = ep.tr.table;
      expect(t.chosenAlignment, `ep ${ep.num}: a finale record carries an alignment`)
        .toBeFalsy();
      expect(t.truth, `ep ${ep.num}: a finale record carries the room's real alignments`)
        .toBeFalsy();
      expect(t.betrayals, `ep ${ep.num}: a finale record carries a betrayal`).toBeFalsy();
    }
    // and the mandated season DOES carry them, or lock one is a guard on a
    // field nothing ever writes
    expect(MANDATED.filter(m => m.ep.tr.table.chosenAlignment).length,
      'no mandated table carried an alignment, so the endgame arm proves nothing')
      .toBeGreaterThan(10);
  });

  it('LOCK TWO: the screen refuses even when the record is holding one', () => {
    // The synthetic case, and it is the only way to test the screen's own
    // branch: a real finale record has nothing to leak, so a silent render
    // there proves the RECORD and not the SCREEN. This one is a mandated
    // table — alignment, ground truth and all — with `endgame` flipped on.
    const real = MANDATED.find(m => m.ep.tr.table.chosenAlignment && m.ep.tr.table.truth
      && (m.ep.tr.table.accusations || []).length);
    expect(real, 'no mandated table to build the synthetic finale from').toBeTruthy();
    const control = tableFullyRevealed(real.ep);
    expect(control, 'the control does not reveal, so the arm below is vacuous')
      .toContain('data-reveal="alignment"');
    expect(control).toContain('class="rt-irony"');

    const forged = { ...real.ep, tr: { ...real.ep.tr,
      table: { ...real.ep.tr.table, endgame: true } } };
    const html = tableFullyRevealed(forged);
    expect(html, 'the screen drew an alignment at a finale table')
      .not.toContain('data-reveal="alignment"');
    expect(html, 'the screen drew the audience\'s ground truth at a finale table')
      .not.toContain('class="rt-irony"');
    expect(html).toContain('Nothing Is Turned Over');
  });

  it('BOTH screen locks are in the source, because neither can be caught alone', () => {
    // AN HONEST NOTE ON WHAT THIS ARM IS FOR. There are two locks on the
    // screen -- `_view` refuses to carry an alignment out of a finale record,
    // and `_buildBeats` refuses to draw one -- and they are deliberately
    // redundant, which means NEITHER can be caught by a mutation on its own:
    // remove one and the other still produces the correct silent screen.
    // Removing BOTH does turn LOCK TWO red, and that pair is the mutation on
    // record. This arm is what stops somebody deleting one of them on the
    // grounds that the suite stayed green when they tried it.
    const src = readFileSync(new URL('../' + 'js/vp-tr/round-table.js', import.meta.url), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, ' ')
      .replace(new RegExp('(^|[^:])//[^\\n]*', 'g'), '$1 ');
    expect(src, 'the view stopped stripping the alignment off a finale record')
      .toContain('chosenAlignment: endgame ? null :');
    expect(src, 'the beat builder stopped refusing to draw one')
      .toContain('if (!v.endgame && v.chosenAlignment)');
  });

  it('and a real finale table shows the silence, with the word nowhere on it', () => {
    for (const { ep } of ENDGAME) {
      const html = tableFullyRevealed(ep);
      expect(html, `ep ${ep.num}: a finale table turned a card over`)
        .not.toContain('data-reveal="alignment"');
      expect(html).not.toContain('<div class="rt-reveal-word">');
      expect(html).toContain('Nothing Is Turned Over');
    }
  });
});

// ── GUARD 7: the observer contract ────────────────────────────────────
//
// Narrow, on this screen, and it has to be tested as the narrow thing it is.
// The table is PUBLIC: both layers see every slate, every count and the
// alignment the host turns over in front of the room. What only the audience
// gets is whether the room is right — which is ground truth, and is stripped
// off the record rather than hidden in the markup.
describe('the observer layers differ in exactly one thing, and it is the truth', () => {
  const nights = () => TABLES.filter(t => !t.ep.tr.table.endgame
    && (t.ep.tr.table.accusations || []).length).slice(0, 10);

  it('a real season produces nights with a debate to check', () => {
    expect(nights().length, 'no night had an accusation on it').toBeGreaterThan(5);
  });

  it('the audience is told whether the room is right; a player never is', () => {
    let withIrony = 0;
    for (const { ep } of nights()) {
      const seat = ep.tr.table.seated[0];
      const aud = tableFullyRevealed(ep, 'audience');
      const plr = tableFullyRevealed(ep, `player:${seat}`);
      const n = (aud.match(/class="rt-irony"/g) || []).length;
      if (n) withIrony++;
      expect(plr, `ep ${ep.num}: a player was shown the audience's ground truth`)
        .not.toContain('class="rt-irony"');
      expect(plr).not.toContain('What the room cannot see');
    }
    expect(withIrony, 'no audience render carried the privilege, so the negative is free')
      .toBeGreaterThan(5);
  });

  it('but the slates are public, so both layers see all of them', () => {
    for (const { ep } of nights().slice(0, 5)) {
      const seat = ep.tr.table.seated[0];
      const a = slatesOf(tableFullyRevealed(ep, 'audience'))
        .map(s => s.voter + '|' + s.target).sort();
      const p = slatesOf(tableFullyRevealed(ep, `player:${seat}`))
        .map(s => s.voter + '|' + s.target).sort();
      expect(p, `ep ${ep.num}: a player at the table was shown a different vote`).toEqual(a);
      expect(p.length).toBeGreaterThan(2);
    }
  });

  it('the strip says which layer is being drawn', () => {
    const { ep } = TABLES[0];
    expect(rpBuildRoundTable(ep, 'audience')).toContain('data-layer="audience"');
    const seat = ep.tr.table.seated[0];
    expect(rpBuildRoundTable(ep, `player:${seat}`)).toContain('data-layer="player"');
  });
});

// ── GUARD 8: the ring never spoils ahead ──────────────────────────────
//
// The ring is the screen's live panel — it replaced the narrow rail, it is the
// element the reveal handlers swap by id, and it holds the whole state of the
// vote. Everything it draws has to be gated on what the reader has reached: a
// chord for a ballot nobody has read, or a tick against a name that has not
// been said aloud, is the spoiling bug in a better coat.
const stageOf = html => {
  const at = html.indexOf('id="rt-stage-inner"');
  if (at < 0) return '';
  const end = html.indexOf('<main class="rt-main"', at);
  return html.slice(at, end < 0 ? undefined : end);
};
const seatsOf = stage => {
  const out = [];
  const re = /<span class="rt-seat" data-seat="([^"]*)"([^>]*)>/g;
  let m;
  while ((m = re.exec(stage))) {
    const door = /data-door="([^"]*)"/.exec(m[2]);
    out.push({ state: m[1], door: door ? door[1] : null });
  }
  return out;
};

describe('the ring shows only what has been read', () => {
  it('nothing is on the wood before the first slate is turned over', () => {
    for (const { ep } of TABLES.slice(0, 6)) {
      // A fresh screen sits at beat 0, which is the room sitting down.
      const stage = stageOf(tableUnrevealed(ep));
      expect(stage, 'the stage is not in the markup').toBeTruthy();
      expect((stage.match(/class="rt-chord"/g) || []).length,
        `ep ${ep.num}: the ring drew a ballot nobody has read`).toBe(0);
      expect((stage.match(/class="rt-pip"/g) || []).length,
        `ep ${ep.num}: the ring counted a vote nobody has read`).toBe(0);
      expect(stage, `ep ${ep.num}: the ring emptied a chair before the verdict`)
        .toContain('still seated');
    }
  });

  it('and every slate read is a line on the wood once it has been', () => {
    for (const { ep } of TABLES.slice(0, 6)) {
      const stage = stageOf(tableFullyRevealed(ep));
      const chords = (stage.match(/class="rt-chord"/g) || []).length;
      const t = ep.tr.table;
      // At the end the ring shows the round that DECIDED it — the first count
      // if nobody tied, the last revote if they did. Not the union: a chord
      // from a superseded count is a line the room did not draw.
      const revotes = t.revotes || [];
      const want = revotes.length
        ? revotes[revotes.length - 1].count
        : t.votes.filter(b => b.channel === 'banishment' && b.target).length;
      expect(chords, `ep ${ep.num}: the ring does not match the deciding count`).toBe(want);
      // and the ticks add up to the ballots that were cast in that round
      const pips = (stage.match(/class="rt-pip"/g) || []).length;
      expect(pips, `ep ${ep.num}: the ring's ticks and its lines disagree`)
        .toBeGreaterThan(0);
    }
  });
});

// ── THE EMPTY CHAIRS ──────────────────────────────────────────────────
//
// Everybody who has left keeps their seat, and the two doors out of this
// castle do not look alike. That is the format's best recurring image — the
// ring thinning while the survivors look at the gaps — and it is free drama
// sitting in data the record was throwing away: `exits[]` carried a name and
// no channel, so nothing downstream could tell a vote of the room from the
// thing the room did not vote on.
describe('the gone keep their chairs, and the two doors look different', () => {
  it('the record carries the door every exit went out by', () => {
    let banished = 0, murdered = 0;
    for (const r of RUNS) {
      for (const ep of r.episodes) {
        for (const x of ep.exits || []) {
          expect(x.channel, `ep ${ep.num}: ${x.name} left by no door at all`).toBeTruthy();
          expect(['banishment', 'murder']).toContain(x.channel);
          // the verb is the registry's, not a default the reader filled in
          expect(exitVerbs('traitors')).toContain(x.verb);
          if (x.channel === 'banishment') banished++; else murdered++;
        }
      }
    }
    // BOTH DOORS, or the difference below is a difference of one thing.
    expect(banished, 'no exit was recorded as a vote of the room').toBeGreaterThan(20);
    expect(murdered, 'no exit was recorded as the other door').toBeGreaterThan(10);
  });

  it('the ring seats everybody who ever sat down, in a stable order', () => {
    for (const r of RUNS) {
      const tables = r.episodes.filter(e => e.tr && e.tr.table).map(e => e.tr.table);
      const first = tables[0].ring.map(c => c.name);
      expect(first.length, 'the ring is smaller than the cast').toBe(20);
      for (const t of tables) {
        // THE SEATS NEVER MOVE. Seating from the living re-deals every chair
        // the moment somebody dies, and the eye can then no longer follow one
        // person from episode to episode — which is the whole point of a ring.
        expect(t.ring.map(c => c.name), `ep ${t.ep}: the room was re-seated`)
          .toEqual(first);
      }
    }
  });

  it('a late table draws real empty chairs, marked by their own door', () => {
    let sawBanished = 0, sawMurdered = 0, checked = 0;
    for (const { ep } of TABLES) {
      const t = ep.tr.table;
      const gone = t.ring.filter(c => c.door);
      if (!gone.length) continue;
      const seats = seatsOf(stageOf(tableUnrevealed(ep)));
      expect(seats.length, `ep ${ep.num}: the ring lost chairs`).toBe(t.ring.length);
      const drawn = seats.filter(x => x.state === 'gone');
      expect(drawn.length, `ep ${ep.num}: the empty chairs were not drawn`)
        .toBe(gone.length);
      for (const c of gone) {
        expect(drawn.some(d => d.door === c.door),
          `ep ${ep.num}: no chair marked "${c.door}"`).toBe(true);
      }
      sawBanished += gone.filter(c => c.door === 'banishment').length;
      sawMurdered += gone.filter(c => c.door === 'murder').length;
      checked++;
    }
    expect(checked, 'no table had an empty chair to draw').toBeGreaterThan(20);
    expect(sawBanished, 'no chair was emptied by the room').toBeGreaterThan(10);
    expect(sawMurdered, 'no chair was emptied by the other door').toBeGreaterThan(10);
  });

  it('and the chair of the night goes empty only once the verdict is read', () => {
    const { ep } = TABLES.find(t => t.ep.tr.table.chosen);
    const before = seatsOf(stageOf(tableUnrevealed(ep)));
    const after = seatsOf(stageOf(tableFullyRevealed(ep)));
    expect(after.filter(x => x.state === 'chosen').length,
      'the chair never emptied').toBe(1);
    expect(before.filter(x => x.state === 'chosen').length,
      'the ring emptied the chair before the room voted').toBe(0);
  });
});

// ── REACHABILITY ──────────────────────────────────────────────────────
describe('the Round Table is reachable from a played season', () => {
  it('buildVPScreens registers it for every night that held one', () => {
    let seen = 0;
    for (const r of RUNS) {
      for (const ep of r.episodes) {
        const hit = buildVPScreens(ep).find(s => s.id === 'tr-round-table');
        if (!ep.tr || !ep.tr.table) {
          expect(hit, `ep ${ep.num} registered a table it never held`).toBeUndefined();
          continue;
        }
        expect(hit, `ep ${ep.num}: the Round Table screen is not reachable`).toBeTruthy();
        expect(hit.label).toBe('The Round Table');
        expect(strip(hit.html)).toContain(ep.tr.table.chosen);
        seen++;
      }
    }
    expect(seen, 'no played episode reached the screen').toBeGreaterThan(25);
  });

  it('the table is drawn before the turret, which is the order they happened', () => {
    const ep = TABLES.find(t => t.ep.tr.conclave).ep;
    const ids = buildVPScreens(ep).map(s => s.id);
    expect(ids.indexOf('tr-round-table')).toBeGreaterThan(-1);
    expect(ids.indexOf('tr-round-table')).toBeLessThan(ids.indexOf('tr-conclave'));
  });
});

// ── VOCABULARY, ON BOTH LAYERS ────────────────────────────────────────
describe("the hall may not be described in another show's words", () => {
  it('nothing either layer prints belongs to another show', () => {
    for (const { ep } of TABLES.slice(0, 14)) {
      expect(foreignWordsIn(strip(tableFullyRevealed(ep, 'audience')), 'traitors'),
        `ep ${ep.num} printed another show's vocabulary to the audience`).toEqual([]);
      const seat = ep.tr.table.seated[0];
      expect(foreignWordsIn(strip(tableFullyRevealed(ep, `player:${seat}`)), 'traitors'),
        `ep ${ep.num} printed another show's vocabulary to a player`).toEqual([]);
    }
    // and the empty-table render, which is prose as well
    const one = RUNS[0].episodes.find(e => e.num === 1);
    expect(foreignWordsIn(strip(rpBuildRoundTable(one, 'audience')), 'traitors')).toEqual([]);
  });
});

// ── THE REVEAL CONTRACT ───────────────────────────────────────────────
describe('the Round Table honours the reveal pattern', () => {
  const some = () => TABLES[0].ep;

  it('step divs, counter, controls and sidebar are all addressable by id', () => {
    const html = rpBuildRoundTable(some(), 'audience');
    expect(html).toContain('id="rt-counter-roundtable"');
    expect(html).toContain('id="rt-controls-roundtable"');
    expect(html).toContain('id="rt-stage-inner"');
    expect(html).toContain('id="rt-shell-roundtable"');
    expect(html).toContain('id="rt-step-roundtable-0"');
    expect(html).toMatch(/trRoundTableRevealNext\('roundtable',\d+,\d+\)/);
    expect(html).toMatch(/trRoundTableRevealAll\('roundtable',\d+,\d+\)/);
  });

  it('the counter total matches the number of steps actually rendered', () => {
    for (const { ep } of TABLES.slice(0, 8)) {
      const html = rpBuildRoundTable(ep, 'audience');
      const steps = (html.match(/id="rt-step-roundtable-\d+"/g) || []).length;
      const total = Number(/trRoundTableRevealAll\('roundtable',(\d+),/.exec(html)[1]);
      expect(total, `ep ${ep.num}: the controls promise a step count the stream lacks`)
        .toBe(steps);
      expect(html).toContain(`/ ${steps}</span>`);
    }
  });

  it('one beat per public ballot, so they really are read one at a time', () => {
    for (const { ep } of TABLES.slice(0, 8)) {
      const html = rpBuildRoundTable(ep, 'audience');
      const slates = slatesOf(html).length;
      expect(slates, `ep ${ep.num}: the slates were not drawn one per ballot`)
        .toBe(publicBallots(ep.tr.table, 'traitors').length);
      // and each one is inside a beat of its own
      const beats = html.split(/<div class="rt-beat" /).slice(1);
      for (const b of beats) {
        expect(slatesOf(b).length, `ep ${ep.num}: a beat carries more than one slate`)
          .toBeLessThan(2);
      }
    }
  });

  it('every animation has a reduced-motion escape', () => {
    expect(rpBuildRoundTable(some(), 'audience'))
      .toContain('@media(prefers-reduced-motion:reduce)');
  });

  it('the shell is 1100px and centred, never full-screen', () => {
    expect(rpBuildRoundTable(some(), 'audience'))
      .toContain('max-width:1100px;margin:0 auto');
  });

  it('nothing is drawn over the 46px nav bar, and the ring sits under it', () => {
    const html = rpBuildRoundTable(some(), 'audience');
    expect(html).toContain('.rt-wash-l,.rt-vig,.rt-grain{position:absolute;left:0;right:0;top:46px');
    expect(html).toContain('position:sticky;top:46px');
  });

  it('there is no emoji anywhere on the screen', () => {
    for (const { ep } of TABLES.slice(0, 6)) {
      expect(/\p{Extended_Pictographic}/u.test(rpBuildRoundTable(ep, 'audience')),
        `ep ${ep.num} has an emoji in it`).toBe(false);
    }
  });

  it('the screen redraws identically', () => {
    const ep = some();
    const norm = h => h.replace(/(sd|sp|cvClk)x?\d+/g, '#');
    expect(norm(rpBuildRoundTable(ep, 'audience')))
      .toBe(norm(rpBuildRoundTable(ep, 'audience')));
  });
});

// ── THE STICKY RAIL, WHICH HAD TWO CAUSES ON THE CONCLAVE ─────────────
describe('the sticky ring is not killed by the shell clip', () => {
  const built = () => rpBuildRoundTable(TABLES[0].ep, 'audience');

  it('the shell does not clip, and a scenery layer does it instead', () => {
    const html = built();
    const shell = /\.rt-shell\{([^}]*)\}/.exec(html)[1];
    expect(shell, 'the shell clips again and the rail will not stick')
      .not.toMatch(/overflow:\s*(hidden|auto|scroll|clip)/);
    expect(shell).toMatch(/overflow:\s*visible/);
    expect(html).toContain('.rt-scenery{position:absolute;inset:0;overflow:hidden');
  });

  it('the element that sticks is the one the handlers replace, and it has range', () => {
    // BOTH HALVES OF THE CONCLAVE'S BUG. The clip has to be off the shell (a
    // scroll container kills sticky for every descendant), AND the sticky
    // element has to be shorter than its containing block -- a rail exactly as
    // tall as its grid has no range and scrolls like a static box. Here the
    // sticky element is the STAGE, its containing block is `.rt-body` (the
    // whole page), and it is also the element `_updateStage` swaps by id, so
    // its position survives every innerHTML replacement.
    const html = built();
    const panel = /\.rt-stage\{([^}]*)\}/.exec(html)[1];
    expect(panel).toMatch(/position:\s*sticky/);
    expect(panel).toMatch(/top:46px/);
    expect(html).toContain('id="rt-stage-inner"');
    // and it is a sibling ABOVE the stream rather than a child of it, or it
    // has nothing to stick through
    const stageAt = html.indexOf('<div class="rt-stage" id="rt-stage-inner">');
    const mainAt = html.indexOf('<main class="rt-main">');
    expect(stageAt, 'the stage is not in the markup').toBeGreaterThan(-1);
    expect(stageAt, 'the stage is inside the stream it is meant to stay above')
      .toBeLessThan(mainAt);
  });

  it('the scenery layer takes no z-index, or the blend modes change picture', () => {
    expect(/\.rt-scenery\{([^}]*)\}/.exec(built())[1]).not.toMatch(/z-index/);
  });

  it('every plane is inside the clip layer, not loose in the shell', () => {
    const html = built();
    for (const cls of ['rt-far', 'rt-mid', 'rt-fore', 'rt-wash-l', 'rt-vig', 'rt-grain']) {
      const at = html.indexOf('<div class="' + cls + '"');
      expect(at, cls + ' is not rendered').toBeGreaterThan(-1);
      const layer = html.lastIndexOf('<div class="rt-scenery"', at);
      const body = html.lastIndexOf('<div class="rt-body">', at);
      expect(layer, cls + ' escaped the clip layer').toBeGreaterThan(-1);
      expect(layer, cls + ' is drawn after the body, outside the clip').toBeGreaterThan(body);
    }
  });
});

// ── THE PORTRAIT IS NEUTRAL HERE, WHICH IS THE POINT OF THE SPLIT ─────
describe('the hall does not borrow the turret\'s lamp', () => {
  it('not one face on this screen is lit', () => {
    for (const { ep } of TABLES.slice(0, 6)) {
      const html = rpBuildRoundTable(ep, 'audience');
      const opens = html.match(/<span class="cv-av(?: cv-lit)?"/g) || [];
      expect(opens.length, `ep ${ep.num}: the screen drew no portraits`).toBeGreaterThan(4);
      for (const o of opens) {
        expect(o, `ep ${ep.num}: a hall portrait arrived pre-darkened: ${o}`)
          .not.toContain('cv-lit');
      }
      // and the turret's own treatment is not in this stylesheet at all
      expect(html, 'the conclave\'s lighting followed the helper into the hall')
        .not.toContain('.cv-av.cv-lit::before');
    }
  });

  it('the shared portrait rules are one copy, imported, not retyped', () => {
    // Both screens draw the same face and only one of them owns the CSS for
    // it. A second copy in this file is how the two start disagreeing about a
    // border radius, which is the shape this repo has shipped four times.
    const table = rpBuildRoundTable(TABLES[0].ep, 'audience');
    const turret = rpBuildConclave(NIGHTS[0].ep, 'audience');
    // Anchored on a newline, or `.rt-root .cv-av{` — the hall's own override,
    // which is allowed to differ — matches first and the guard compares the
    // wrong two rules.
    const rule = new RegExp('\\n\\.cv-av\\{[^}]*\\}');
    expect(rule.exec(table)[0]).toBe(rule.exec(turret)[0]);
  });
});

// ── THE FIRST PAINT SHOWS WHAT HAS ALREADY BEEN REVEALED ──────────────
//
// A beat is `height:0` until its screen's visible class is on it, and that
// class is added by `_reapplyVisibility`, which only ever runs from a click.
// A builder that emits the bare class therefore returns a screen with nothing
// in its stream at all — with the counter under it already saying "1 / 11" —
// and returns the same empty page to a reader who had revealed nine beats,
// because the markup is rebuilt on every paint while the reveal state is not.
// Both screens bake the class in from the state their handlers keep.
const beatsOf = (html, prefix, suffix) => {
  const out = [];
  const re = new RegExp('<div class="(' + prefix + '-beat[^"]*)" id="'
    + prefix + '-step-' + suffix + '-([0-9]+)"', 'g');
  let m;
  while ((m = re.exec(html))) out.push({ cls: m[1], i: Number(m[2]) });
  return out;
};
let _paintN = 900000;

describe('a screen opened and never clicked is not blank', () => {
  it('the conclave shows its first beat on the first paint', () => {
    // A fresh episode number, because reveal state is module-level and keyed
    // by it: an episode some earlier test revealed would pass this for the
    // wrong reason.
    const ep = { ...NIGHTS[0].ep, num: ++_paintN };
    const beats = beatsOf(rpBuildConclave(ep, 'audience'), 'cv', 'conclave');
    expect(beats.length, 'the conclave rendered no beats at all').toBeGreaterThan(3);
    expect(beats[0].cls, 'the conclave opens on a collapsed first beat')
      .toContain('cv-vis');
    expect(beats.filter(b => b.cls.includes('cv-vis')).length,
      'a fresh conclave revealed more than the beat it is sitting on').toBe(1);
  });

  it('and gives a reader who had revealed the night back what they revealed', () => {
    // The other half, and a different failure: not the opening paint but every
    // later one. `renderVPScreen` rebuilds this markup on every paint.
    const ep = { ...NIGHTS[0].ep, num: ++_paintN };
    const first = rpBuildConclave(ep, 'audience');
    const m = /trConclaveRevealAll\('conclave',(\d+),(\d+)\)/.exec(first);
    trConclaveRevealAll('conclave', Number(m[1]), Number(m[2]));
    const beats = beatsOf(rpBuildConclave(ep, 'audience'), 'cv', 'conclave');
    // `every` on an empty list is true, and a regex that matched nothing would
    // hand this arm a free pass — which is exactly how it first shipped.
    expect(beats.length, 'the conclave rendered no beats at all').toBeGreaterThan(3);
    expect(beats.every(b => b.cls.includes('cv-vis')),
      'a fully revealed conclave came back collapsed on the next paint').toBe(true);
  });

  it('and the Round Table, which is where the pattern comes from', () => {
    const ep = { ...TABLES[0].ep, num: ++_paintN };
    const beats = beatsOf(rpBuildRoundTable(ep, 'audience'), 'rt', 'roundtable');
    expect(beats.length, 'the Round Table rendered no beats at all').toBeGreaterThan(3);
    expect(beats[0].cls, 'the Round Table opens on a collapsed first beat')
      .toContain('rt-vis');
    expect(beats.filter(b => b.cls.includes('rt-vis')).length,
      'a fresh Round Table revealed more than the beat it is sitting on').toBe(1);
  });
});

// ── THE CHAIRS DO NOT SIT ON EACH OTHER ───────────────────────────────
//
// The ring holds a chair for EVERY name in `gs.tr.castOrder` for the whole
// season — the living and the memorial seats of everybody already gone — so it
// is at its most crowded on the last night, not the first, and the size that
// matters is the cast, never the survivors.
//
// Seats used to be spaced evenly in ANGLE. On an ellipse 436 wide and 172 tall
// that packs them where the curve is steepest, which is the sides: a degree
// there buys 172 units of table and a degree at the far centre buys 436. They
// are spaced by ARC LENGTH now — a chair every `perimeter / n` units — which
// leaves the ellipse exactly as it was and stops the crowding.
const RING_BOX_W = 960;          // .rt-ring max-width
const RING_BOX_H = 960 * 0.417;  // .rt-ring padding-top, of that same width
const DESIGN_W = 1020, DESIGN_H = 452;  // the viewBox the seats are placed in
const AVATAR = 48;               // .rt-seat .cv-av, before --s scales it

/** Every chair as the browser lays it out: CSS pixels, and its drawn size. */
function ringSeats(html) {
  const out = [];
  const re = /<span class="rt-seat"[^>]*style="left:([\d.]+)%;top:([\d.]+)%;--s:([\d.]+)/g;
  let m;
  while ((m = re.exec(html))) {
    out.push({
      x: Number(m[1]) / 100 * DESIGN_W * (RING_BOX_W / DESIGN_W),
      y: Number(m[2]) / 100 * DESIGN_H * (RING_BOX_H / DESIGN_H),
      d: AVATAR * Number(m[3]),
    });
  }
  return out;
}
/** Adjacent chairs, centre to centre, all the way round including the wrap. */
const seatGaps = seats => seats.map((s, i) => {
  const t = seats[(i + 1) % seats.length];
  return { centres: Math.hypot(s.x - t.x, s.y - t.y), need: (s.d + t.d) / 2 };
});

describe('the ring at the largest cast the show casts', () => {
  // 24 chairs: the engine's measured shape is ~20 and the format's own upper
  // bound is 24, and nothing in the config caps it below that. Played here
  // rather than at module scope so no other arm inherits this gs.
  const bigTable = () => {
    const big = roster.players.slice(0, 24);
    setPlayers(big);
    playTraitorsSeason({ cast: big.map(p => p.name), traitorCount: 5, seed: 5 });
    const eps = (gs.episodeHistory || []).filter(e => e.tr && e.tr.table);
    // the LAST table of the season: every chair filled, most of them memorial
    const ep = { ...eps[eps.length - 1], num: ++_paintN };
    const html = tableFullyRevealed(ep);
    setPlayers(ROSTER);
    return html;
  };

  it('seats twenty-four without a portrait touching its neighbour', () => {
    const seats = ringSeats(bigTable());
    expect(seats.length, 'the ring did not seat the whole cast').toBe(24);
    const gaps = seatGaps(seats);
    const worst = gaps.reduce((a, b) => (b.centres - b.need < a.centres - a.need ? b : a));
    expect(worst.centres - worst.need,
      `two portraits overlap by ${(worst.need - worst.centres).toFixed(1)}px at the `
      + 'tightest pair — the chairs are crowding somewhere on the ring').toBeGreaterThan(8);
  });

  it('and spaces them evenly the whole way round, not evenly in angle', () => {
    // A separate property from the one above, and neither implies the other: a
    // ring can be evenly spaced and still too small for its portraits, and an
    // unevenly spaced one on a large enough table would never overlap. Even
    // angle puts 2.5x more table between the far seats than the side ones;
    // even arc length holds the ratio to about 1.08, the remainder being the
    // ring box being a hair less tall in CSS than it is in the viewBox.
    const centres = seatGaps(ringSeats(bigTable())).map(g => g.centres);
    const ratio = Math.max(...centres) / Math.min(...centres);
    expect(ratio, `the widest gap round the ring is ${ratio.toFixed(2)}x the tightest — `
      + 'the chairs are being spaced by angle, not by arc length').toBeLessThan(1.25);
  });
});

// ── THE FLAME, WHICH WAS MOVING LIKE AN OBJECT ────────────────────────
//
// Fire changes shape; it does not travel. What made both screens' fire read as
// wrong was that its pivot was nowhere near its wick: `transform-origin` on an
// SVG element resolves against the VIEW BOX unless `transform-box:fill-box`
// says otherwise, so `50% 92%` on a candle 200 units down a 1400-unit box put
// the origin a thousand units BELOW the flame and every skew swung the whole
// shape sideways. The rest of it — a symmetric 1.4s loop the eye catches in two
// cycles, a huge amplitude, and eighteen candles guttering in step — is what
// was left after that.
//
// This is the one piece of the visual system worth a hard guard: the plan says
// no mutation testing on CSS because screen defects are visible, and this one
// was visible for a fortnight without anybody being able to name it.
describe('the fire is pinned at the wick', () => {
  const rules = () => [
    ['the turret\'s lantern', rpBuildConclave(NIGHTS[0].ep, 'audience'),
      /\.cv-flame\{([^}]*)\}/],
    ['the hall\'s candles', rpBuildRoundTable(TABLES[0].ep, 'audience'),
      /\.rt-lick,\.cv-flame\{([^}]*)\}/],
  ];

  it('both screens pivot every flame at its own base, not at the view box', () => {
    for (const [what, html, re] of rules()) {
      const rule = re.exec(html);
      expect(rule, `${what}: the flame rule is not in the stylesheet`).toBeTruthy();
      // WITHOUT THIS the origin below is measured against the whole SVG and the
      // flame swings bodily instead of licking.
      expect(rule[1], `${what}: the flame pivots against the view box, not itself`)
        .toContain('transform-box:fill-box');
      expect(rule[1], `${what}: the flame is not anchored at the wick`)
        .toContain('transform-origin:50% 100%');
    }
  });

  it('and moves by changing shape, never by moving', () => {
    // A different failure from the pivot: a flame anchored correctly but given
    // a translate or a rotate is still an object being waggled.
    for (const [what, html] of [['the turret', rpBuildConclave(NIGHTS[0].ep, 'audience')],
      ['the hall', rpBuildRoundTable(TABLES[0].ep, 'audience')]]) {
      const kf = /@keyframes (?:cv|rt)-lick\{([\s\S]*?)\n\}/.exec(html);
      expect(kf, `${what}: the flame's shape loop is not in the stylesheet`).toBeTruthy();
      expect(kf[1], `${what}: the flame travels instead of licking`).not.toMatch(/translate/);
      expect(kf[1], `${what}: the flame rotates as a rigid body`).not.toMatch(/rotate/);
      // and it is not a pendulum: a symmetric loop back to identity on one
      // period is caught by the eye inside two cycles
      expect((kf[1].match(/%\{/g) || []).length,
        `${what}: the shape loop has too few stops to stop looking periodic`)
        .toBeGreaterThan(6);
    }
  });
});

describe('no two candles in the hall are on the same beat', () => {
  const flames = html => {
    const out = [];
    const re = /class="rt-lick"[^>]*style="([^"]*)"/g;
    let m;
    while ((m = re.exec(html))) {
      const lick = /--lick:([^;"]+)/.exec(m[1]);
      const delay = /animation-delay:([^;"]+)/.exec(m[1]);
      const flare = /--flare:([^;"]+)/.exec(m[1]);
      out.push({ lick: lick && lick[1], flare: flare && flare[1], delay: delay && delay[1] });
    }
    return out;
  };

  it('every candle carries its own period and its own phase', () => {
    const f = flames(rpBuildRoundTable(TABLES[0].ep, 'audience'));
    // 18 over the table and 14 in the chandelier. The count is asserted first
    // because every check below is over this list and an empty one passes them
    // all for free.
    expect(f.length, 'the hall drew no candles with a clock of their own')
      .toBeGreaterThan(30);
    expect(f.every(x => x.lick && x.delay),
      'a candle fell back to the shared period and will gutter with the others').toBe(true);
    const beats = new Set(f.map(x => x.lick + '|' + x.delay));
    expect(beats.size, `${f.length} candles share only ${beats.size} beats between them — `
      + 'a ring flickering in unison is the thing that reads as fake instantly')
      .toBeGreaterThan(20);
  });

  it('and the brightness runs on a different clock from the shape', () => {
    // The layered pair is the whole reason the loop never visibly repeats: one
    // period on the shape, a coprime one on the light. Equal periods put them
    // back in lockstep and the combined cycle is short again.
    for (const [what, html] of [['the hall', rpBuildRoundTable(TABLES[0].ep, 'audience')],
      ['the turret', rpBuildConclave(NIGHTS[0].ep, 'audience')]]) {
      const re = /class="(?:rt-lick|cv-flame)"[^>]*style="([^"]*)"/g;
      let m, seen = 0;
      while ((m = re.exec(html))) {
        const lick = /--lick:([^;"]+)/.exec(m[1]);
        const flare = /--flare:([^;"]+)/.exec(m[1]);
        if (!lick || !flare) continue;
        seen++;
        expect(lick[1], `${what}: a flame's shape and its light share a period`)
          .not.toBe(flare[1]);
      }
      expect(seen, `${what}: no flame declared both clocks`).toBeGreaterThan(1);
    }
  });
});

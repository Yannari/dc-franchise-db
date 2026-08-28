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
    for (const f of ['js/vp-tr/conclave.js', 'js/vp-tr/style.js', 'js/vp-tr/scenery.js']) {
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

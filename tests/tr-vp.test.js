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
import { rpBuildConclave, conclaveVisibleTo, trConclaveRevealAll } from '../js/vp-tr/conclave.js';
import { buildVPScreens } from '../js/vp-screens.js';
import { HOSTS_BY_FORMAT } from '../js/quick-setup.js';
import roster from '../franchise_roster.json';

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

// ── GUARD 2: no other show's vocabulary ───────────────────────────────
//
// The word lists are the ones tests/show-vocabulary.test.js keeps, restated
// here only as "what the OTHER shows own" — a castle may not say them. If that
// file's table moves, this one should move with it; both are lists and both
// are the reason the third show shipped five vocabulary defects at once.
const FOREIGN = [
  'tribe', 'tribal council', 'campfire', 'idol', 'immunity challenge',
  'contestant', 'contestants', 'voted out', 'camper', 'merge', 'marshmallow',
  'head of household', 'hoh', 'power of veto', 'veto', 'evict', 'evicted',
  'eviction', 'houseguest', 'houseguests', 'have-not', 'block buster',
  'nominated', 'nomination', 'nominee', 'on the block', 'jury', 'juror',
  'slop', 'challenge', 'challenges', 'immunity',
];

describe('the castle may not be described in another show\'s words', () => {
  it('nothing the screen prints belongs to another show', () => {
    for (const { ep } of NIGHTS.slice(0, 12)) {
      const hay = strip(rpBuildConclave(ep, 'audience')).toLowerCase();
      const leaks = FOREIGN.filter(w =>
        new RegExp('\\b' + w.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&') + '\\b').test(hay));
      expect(leaks, `ep ${ep.num} printed another show's vocabulary`).toEqual([]);
    }
  });

  it('the withheld render is checked too, because it is prose as well', () => {
    const night = NIGHTS[0];
    const outsider = (night.ep.tr.living || [])
      .find(n => !night.ep.tr.conclave.turret.includes(n));
    expect(outsider).toBeTruthy();
    const hay = strip(rpBuildConclave(night.ep, `player:${outsider}`)).toLowerCase();
    const leaks = FOREIGN.filter(w =>
      new RegExp('\\b' + w.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&') + '\\b').test(hay));
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

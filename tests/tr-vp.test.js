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
import { exitVerbs, SHOWS, publicBallots, roundExits } from '../js/shows.js';
import { traitorsVotingHistory, buildTraitorsSeasonDocument } from '../js/tr/export.js';
import { seasonWinners } from '../js/records.js';
import { _setEndgameWatch } from '../js/tr/endgame.js';
import { rpBuildConclave, conclaveVisibleTo, trConclaveRevealAll, _portrait } from '../js/vp-tr/conclave.js';
import { rpBuildRoundTable, trRoundTableRevealAll } from '../js/vp-tr/round-table.js';
import { rpBuildColdOpen, trColdOpenRevealAll } from '../js/vp-tr/cold-open.js';
import { rpBuildHouseStatus, trHouseStatusRevealAll } from '../js/vp-tr/house-status.js';
import { rpBuildMission, trMissionRevealAll } from '../js/vp-tr/mission.js';
import { rpBuildRecruitment, trRecruitmentRevealAll } from '../js/vp-tr/recruitment.js';
import { rpBuildEndgame, trEndgameRevealAll } from '../js/vp-tr/endgame.js';
import { buildVPScreens } from '../js/vp-screens.js';
import { TRAITORS_SCREENS, screenNarration } from '../js/vp-tr/screens.js';
import { generateSummaryText, generateTraitorsSummaryText, _vpTextLines } from '../js/text-backlog.js';
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
    'js/vp-tr/cold-open.js',
    'js/vp-tr/house-status.js',
    'js/vp-tr/mission.js',
    'js/vp-tr/recruitment.js',
    'js/vp-tr/endgame.js',
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
      'js/vp-tr/round-table.js', 'js/vp-tr/cold-open.js', 'js/vp-tr/house-status.js',
      'js/vp-tr/mission.js', 'js/vp-tr/recruitment.js', 'js/vp-tr/endgame.js']) {
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

// ══════════════════════════════════════════════════════════════════════
// THE MORNING AND THE BOARD (Plan 8, Task 3)
// ══════════════════════════════════════════════════════════════════════
//
// Same rule as the rest of this file: the LOOK of these two screens is judged
// by rendering them, and nothing below asserts anything about CSS. What is
// guarded here is the three things that are invisible by looking at a
// beautiful, finished, working screen:
//
//   1. THE FIGURE ON THE PAGE IS THE FIGURE ON THE RECORD. A prize fund is a
//      number, and a number that is wrong looks exactly like a number that is
//      right. It is also the one thing on either screen a viewer will quote.
//   2. NOBODY WHO LEFT IS DRAWN AS STILL PLAYING. Plan 7 found NINE readers
//      asking `eliminated` — which on this show is the public vote alone — and
//      the result was a murdered player still in the wiki grid and a
//      two-person finale night counting eleven people alive. A roll of faces
//      with an extra face in it is a handsome screen.
//   3. A RELIC DOES NOT NAME ITS HOLDER TO SOMEBODY WHO WAS NOT THERE. Plan 6
//      built the Shield semi-visibly on purpose and that visibility model IS
//      the mechanic. A board that names every holder to everybody has deleted
//      it, and looks identical.

/** Every episode across every seed, with the run it came from. */
const DAYS = RUNS.flatMap(r => r.episodes.map(e => ({ ep: e, run: r })));

let _trN = 800000;
/** The cold open once every beat has been revealed, on a fresh reveal state. */
function morningRevealed(ep, observer = 'audience') {
  const fresh = { ...ep, num: ++_trN };
  const first = rpBuildColdOpen(fresh, observer);
  const m = /trColdOpenRevealAll\('coldopen',(\d+),(\d+)\)/.exec(first);
  expect(m, 'the cold open did not emit a reveal handler').toBeTruthy();
  trColdOpenRevealAll('coldopen', Number(m[1]), Number(m[2]));
  return rpBuildColdOpen(fresh, observer);
}
/** The board once every entry has been revealed, on a fresh reveal state. */
function boardRevealed(ep, observer = 'audience') {
  const fresh = { ...ep, num: ++_trN };
  const first = rpBuildHouseStatus(fresh, observer);
  const m = /trHouseStatusRevealAll\('housestatus',(\d+),(\d+)\)/.exec(first);
  expect(m, 'the board did not emit a reveal handler').toBeTruthy();
  trHouseStatusRevealAll('housestatus', Number(m[1]), Number(m[2]));
  return rpBuildHouseStatus(fresh, observer);
}

/** Every place setting on the morning's table, with whether it is a gap. */
function placesOf(html) {
  const out = [];
  const re = /<span class="co-place" data-down="(\d)"( data-gap="1")? data-name="([^"]*)"/g;
  let m;
  while ((m = re.exec(html))) out.push({ down: m[1] === '1', gap: !!m[2], name: m[3] });
  return out;
}

// ── GUARD: THE FUND ───────────────────────────────────────────────────
describe('the fund the board prints is the fund the record carries', () => {
  it('the record itself agrees with the season the export publishes', () => {
    // The chain has two links and this is the far one: the episode row's
    // snapshot has to be the same quantity the season document ships, or the
    // screen can be faithful to a record that is faithful to nothing.
    for (const r of RUNS) {
      const last = r.episodes[r.episodes.length - 1];
      expect(last, 'a run recorded no episodes').toBeTruthy();
      expect(typeof last.tr.pot, 'the row carries no fund at all').toBe('number');
      expect(last.tr.pot, "the last episode's fund is not the season's")
        .toBe(r.season.pot);
    }
  });

  it('and the figure drawn on the page is that number, unmodified', () => {
    let seen = 0;
    for (const { ep } of DAYS.slice(0, 24)) {
      const html = boardRevealed(ep);
      // The machine-readable copy and the human-readable one, both checked: a
      // screen can print the right number in the wrong place, and a screen can
      // carry the right attribute over a rounded caption.
      const raw = /<div class="db-fund-n" data-pot="(\d+)">/.exec(html);
      expect(raw, `ep ${ep.num}: the board drew no fund at all`).toBeTruthy();
      expect(Number(raw[1]), `ep ${ep.num}: the attribute disagrees with the record`)
        .toBe(ep.tr.pot);
      const printed = /<div class="db-fund-n" data-pot="\d+">&pound;([\d,]+)</.exec(html);
      expect(printed, `ep ${ep.num}: the fund is not printed`).toBeTruthy();
      expect(Number(printed[1].replace(/,/g, '')),
        `ep ${ep.num}: the printed fund is not the recorded one`).toBe(ep.tr.pot);
      seen++;
    }
    expect(seen, 'no board was rendered, so nothing above was checked')
      .toBeGreaterThan(20);
  });

  it('and no screen in js/vp-tr/ can reach the engine to get it a second way', () => {
    // THE OTHER HALF OF "READ IT THROUGH THE EXPORT". A screen that imports
    // `gs` will eventually read the live fund for one number and the record for
    // another, and the two disagree the moment a season is loaded from disk.
    // The two crowd ledgers are named here for the same reason Plan 7 §Task 5
    // confined them: they are separate quantities that look interchangeable
    // from anywhere outside js/tr/crowd.js.
    const FILES = ['conclave.js', 'style.js', 'scenery.js', 'round-table.js',
      'cold-open.js', 'house-status.js', 'mission.js', 'recruitment.js'];
    let scanned = 0;
    for (const f of FILES) {
      const src = readFileSync(new URL('../js/vp-tr/' + f, import.meta.url), 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, ' ')
        .replace(/(^|[^:])\/\/[^\n]*/g, '$1 ');
      scanned++;
      expect(/import\s*\{[^}]*\bgs\b[^}]*\}\s*from/.test(src),
        `js/vp-tr/${f} imports engine state instead of reading its record`).toBe(false);
      expect(/\bgs\s*[.?]/.test(src), `js/vp-tr/${f} reaches into gs`).toBe(false);
      for (const ledger of ['notoriety', 'popularity']) {
        expect(new RegExp('\\b' + ledger + '\\b').test(src),
          `js/vp-tr/${f} names the ${ledger} ledger, which lives in js/tr/crowd.js`)
          .toBe(false);
      }
    }
    expect(scanned, 'no source was scanned').toBe(FILES.length);
  });
});

// ── GUARD: NOBODY WHO LEFT IS DRAWN AS STILL PLAYING ──────────────────
describe('the gone do not appear as living', () => {
  /** Everybody who had left by the end of this row, by the registry's rule. */
  function goneThrough(episodes, upTo) {
    const out = new Set();
    for (const row of episodes) {
      if (row.num > upTo) continue;
      for (const x of roundExits(row, 'traitors')) out.add(x.name);
    }
    return out;
  }

  it('the exits this checks against are real, and both doors are in them', () => {
    // Everything below is a negative assertion over this set. An empty one
    // passes the lot for free, and a set containing only the public vote
    // passes the exact bug this guard exists for.
    const last = RUNS[0].episodes[RUNS[0].episodes.length - 1];
    const gone = [...goneThrough(RUNS[0].episodes, last.num)];
    expect(gone.length, 'no season removed anybody').toBeGreaterThan(6);
    const verbs = new Set(RUNS[0].episodes.flatMap(r =>
      roundExits(r, 'traitors').map(x => x.verb)));
    const [vote, night] = exitVerbs('traitors');
    expect(verbs.has(vote), 'no public exit was recorded').toBe(true);
    expect(verbs.has(night), 'no private exit was recorded — the guard below '
      + 'would then pass on a reader that only knows about the vote').toBe(true);
  });

  it("the board's standing roll holds nobody who has left, by either door", () => {
    let seen = 0;
    let checkedAgainst = 0;
    for (const r of RUNS) {
      for (const ep of r.episodes) {
        const html = boardRevealed(ep);
        const roll = (html.match(/<span class="db-soul-nm">([^<]*)<\/span>/g) || [])
          .map(x => /">([^<]*)</.exec(x)[1]);
        expect(roll.length, `ep ${ep.num}: the board drew an empty roll`)
          .toBeGreaterThan(1);
        const gone = goneThrough(r.episodes, ep.num);
        checkedAgainst += gone.size;
        for (const n of roll) {
          expect(gone.has(n),
            `ep ${ep.num}: ${n} is on the standing roll and has already left`).toBe(false);
        }
        // and the arithmetic agrees: the cast, minus everybody gone
        expect(roll.length, `ep ${ep.num}: the roll is the wrong length`)
          .toBe(ep.tr.cast.length - gone.size);
        seen++;
      }
    }
    expect(seen, 'no board was rendered').toBeGreaterThan(30);
    expect(checkedAgainst, 'every board was checked against an empty gone set')
      .toBeGreaterThan(100);
  });

  it('and the breakfast table lays no place for somebody already gone', () => {
    const [, night] = exitVerbs('traitors');
    let seen = 0;
    for (const r of RUNS) {
      for (const ep of r.episodes) {
        const html = morningRevealed(ep);
        const laid = placesOf(html);
        expect(laid.length, `ep ${ep.num}: the morning laid no places`).toBeGreaterThan(1);
        // Everybody who had left BEFORE this morning. Last night's own victim
        // is a place at this table on purpose — that is the whole screen — so
        // they are excluded from the set this checks against.
        const gone = goneThrough(r.episodes, ep.num - 1);
        for (const g of roundExits({ exits: ep.tr.dawn.lastNight }, 'traitors')) {
          if (g.verb === night) gone.delete(g.name);
        }
        for (const place of laid) {
          expect(gone.has(place.name),
            `ep ${ep.num}: a place is laid for ${place.name}, who had already left`)
            .toBe(false);
        }
        seen++;
      }
    }
    expect(seen, 'no morning was rendered').toBeGreaterThan(30);
  });

  it('and the two doors are drawn differently in the struck list', () => {
    // The one place on either screen where both of this show's exit words are
    // printed. Printing the wrong one over a departure is the bug class this
    // directory is guarded for, and here it is the SAME show's two words, one
    // over the other, which no vocabulary test can see.
    const [, night] = exitVerbs('traitors');
    const cap = w => w.charAt(0).toUpperCase() + w.slice(1);
    let byVote = 0;
    let byNight = 0;
    for (const r of RUNS) {
      const ep = r.episodes[r.episodes.length - 1];
      const html = boardRevealed(ep);
      const lines = html.match(/<div class="db-line" data-door="[^"]*" data-name="[^"]*">[\s\S]*?<\/div>/g) || [];
      expect(lines.length, 'the board drew no struck entries').toBeGreaterThan(4);
      for (const line of lines) {
        const door = /data-door="([^"]*)"/.exec(line)[1];
        const name = /data-name="([^"]*)"/.exec(line)[1];
        const row = r.episodes.find(x =>
          roundExits(x, 'traitors').some(y => y.name === name));
        expect(row, `${name} is on the struck list and left on no recorded round`)
          .toBeTruthy();
        const truth = roundExits(row, 'traitors').find(y => y.name === name);
        const want = truth.verb === night ? 'night' : 'vote';
        expect(door, `${name} left by "${truth.verb}" and is drawn as ${door}`).toBe(want);
        expect(line, `${name}'s entry does not carry the registry's word`)
          .toContain(cap(truth.verb));
        if (want === 'night') byNight++; else byVote++;
      }
    }
    expect(byVote, 'no public exit was drawn').toBeGreaterThan(3);
    expect(byNight, 'no private exit was drawn').toBeGreaterThan(3);
  });
});

// ── GUARD: A RELIC DOES NOT NAME ITS HOLDER TO A NON-WITNESS ──────────
describe('a relic does not name its holder to somebody who was not there', () => {
  /** Every relic on this row's record. */
  function relicsOf(ep) {
    const p = (ep.tr && ep.tr.powers) || {};
    return [...(p.shields || []), ...(p.daggers || [])];
  }
  /** Only the relic entry's markup — the roll two entries up is public. */
  function relicBlocks(html) {
    return html.match(/<div class="db-relic" [\s\S]*?<\/div><\/div>/g) || [];
  }
  /** The relics this row's board will actually draw. */
  const drawable = ep => relicsOf(ep).filter(r => r.ep === ep.num || r.outcome === 'held');

  const withRelic = DAYS.filter(({ ep }) => drawable(ep).length);

  it('a real season finds relics at all, or every arm below is vacuous', () => {
    expect(withRelic.length, 'no played season put a relic on any board')
      .toBeGreaterThan(2);
    const anyWitnessed = withRelic.some(({ ep }) =>
      drawable(ep).some(r => (r.witnesses || []).length > 0));
    expect(anyWitnessed, 'no relic was seen by anybody, so no observer can be '
      + 'entitled and the positive half below proves nothing').toBe(true);
    const anyBlind = withRelic.some(({ ep }) => drawable(ep).some(r =>
      ep.tr.cast.some(n => n !== r.holder && (r.witnesses || []).indexOf(n) < 0)));
    expect(anyBlind, 'every relic was seen by the whole castle, so the negative '
      + 'half below proves nothing either').toBe(true);
  });

  it('the audience is told, and so are the holder and the people who saw it', () => {
    let told = 0;
    for (const { ep } of withRelic) {
      for (const r of drawable(ep)) {
        const seers = ['audience', 'player:' + r.holder,
          ...(r.witnesses || []).slice(0, 1).map(w => 'player:' + w)];
        for (const obs of seers) {
          const mine = relicBlocks(boardRevealed(ep, obs))
            .filter(b => b.includes('data-holder="' + r.holder + '"'));
          expect(mine.length,
            `ep ${ep.num}: ${obs} was not told who is carrying it`).toBeGreaterThan(0);
          told++;
        }
      }
    }
    expect(told, 'nobody entitled was checked').toBeGreaterThan(5);
  });

  it('and a player who did not see it is told nothing but that it exists', () => {
    let checked = 0;
    for (const { ep } of withRelic) {
      for (const r of drawable(ep)) {
        const blind = ep.tr.cast.find(n => n !== r.holder
          && (r.witnesses || []).indexOf(n) < 0);
        if (!blind) continue;
        const blocks = relicBlocks(boardRevealed(ep, 'player:' + blind));
        // The entry is still DRAWN — the castle knows something came back out
        // of the field. It is the NAME that is missing.
        expect(blocks.length,
          `ep ${ep.num}: the relic vanished entirely for ${blind}`).toBeGreaterThan(0);
        const all = blocks.join('');
        expect(all.includes('data-holder'),
          `ep ${ep.num}: the relic carries a holder for ${blind}, who never saw it`)
          .toBe(false);
        expect(mentions(all, r.holder),
          `ep ${ep.num}: ${r.holder} is named on the relic to ${blind}, who never saw it`)
          .toBe(false);
        expect(all.includes('data-known="0"'),
          `ep ${ep.num}: the relic is not marked unattributed for ${blind}`).toBe(true);
        checked++;
      }
    }
    expect(checked, 'no non-witness was checked, so this guard proved nothing')
      .toBeGreaterThan(2);
  });
});

// ── GUARD: NEITHER SCREEN SPEAKS ANOTHER SHOW'S LANGUAGE ──────────────
describe("the morning and the book use no other show's words", () => {
  it('nothing either screen prints belongs to another show', () => {
    let checked = 0;
    for (const { ep } of DAYS.slice(0, 20)) {
      for (const pair of [['the morning', morningRevealed(ep)],
        ['the book', boardRevealed(ep)]]) {
        const text = strip(pair[1]);
        expect(text.length, `${pair[0]}: rendered nothing`).toBeGreaterThan(200);
        expect(foreignWordsIn(text, 'traitors'),
          `ep ${ep.num}: ${pair[0]} printed another show's vocabulary`).toEqual([]);
        checked++;
      }
    }
    expect(checked, 'no screen was scanned').toBeGreaterThan(20);
  });

  it("and a player observer's render is prose too, so it is checked as well", () => {
    const { ep } = DAYS[6];
    const who = ep.tr.cast[0];
    for (const pair of [['the morning', morningRevealed(ep, 'player:' + who)],
      ['the book', boardRevealed(ep, 'player:' + who)]]) {
      expect(strip(pair[1]).length, `${pair[0]}: rendered nothing`).toBeGreaterThan(200);
      expect(foreignWordsIn(strip(pair[1]), 'traitors'), pair[0]).toEqual([]);
    }
  });
});

// ── GUARD: BOTH SCREENS ARE REACHABLE FROM A PLAYED SEASON ────────────
//
// This project's signature bug class. Asked of `buildVPScreens` rather than of
// the builder, because calling the builder proves it returns HTML, which is
// exactly what every unreachable screen in this repo also did.
describe('the morning and the book are reachable from a played season', () => {
  it('every episode a season records registers both of them', () => {
    let reached = 0;
    for (const r of RUNS) {
      for (const ep of r.episodes) {
        const screens = buildVPScreens(ep);
        const co = screens.find(x => x.id === 'tr-cold-open');
        const db = screens.find(x => x.id === 'tr-status');
        expect(co, `ep ${ep.num}: the cold open is not reachable`).toBeTruthy();
        expect(db, `ep ${ep.num}: the board is not reachable`).toBeTruthy();
        expect(strip(co.html).length, `ep ${ep.num}: the cold open rendered nothing`)
          .toBeGreaterThan(200);
        expect(strip(db.html), `ep ${ep.num}: the board does not print the fund`)
          .toContain(String(ep.tr.pot).replace(/\B(?=(\d{3})+(?!\d))/g, ','));
        reached++;
      }
    }
    expect(reached, 'no episode reached either screen').toBeGreaterThan(30);
  });

  it('and the morning opens the episode, before the evening and the night', () => {
    // The order is the claim: a night runs at the END of the episode it
    // belongs to and the castle finds out at the next breakfast, so the cold
    // open is the FIRST screen of the row and the turret is the last.
    const ep = RUNS[0].episodes[4];
    const ids = buildVPScreens(ep).map(x => x.id);
    expect(ids.length, 'the episode registered no screens').toBeGreaterThan(3);
    expect(ids.indexOf('tr-cold-open')).toBe(0);
    expect(ids.indexOf('tr-status')).toBe(1);
    expect(ids.indexOf('tr-round-table')).toBeGreaterThan(ids.indexOf('tr-status'));
    expect(ids.indexOf('tr-conclave')).toBe(ids.length - 1);
  });

  it('and the morning it draws is the PREVIOUS night, not this one', () => {
    // The commonest way to get this screen wrong is to draw the row's own
    // turret over its own breakfast, which is a whole day early and has the
    // castle mourning somebody who is sitting at the table.
    const [, night] = exitVerbs('traitors');
    const r = RUNS[0];
    let checked = 0;
    let withAGap = 0;
    for (let i = 1; i < r.episodes.length; i++) {
      const ep = r.episodes[i];
      const prev = r.episodes[i - 1];
      expect(ep.tr.dawn.ofEp, `ep ${ep.num}: the morning is about the wrong night`)
        .toBe(prev.num);
      const shouldMiss = roundExits(prev, 'traitors')
        .filter(x => x.verb === night).map(x => x.name).sort();
      const gaps = placesOf(morningRevealed(ep)).filter(p => p.gap)
        .map(p => p.name).sort();
      expect(gaps, `ep ${ep.num}: the empty places are the wrong people`)
        .toEqual(shouldMiss);
      checked++;
      if (gaps.length) withAGap++;
    }
    expect(checked, 'no morning was compared with the night before it')
      .toBeGreaterThan(5);
    // TWO EMPTY LISTS ARE EQUAL. Without this the arm above passes on a screen
    // that never draws a gap at all, which is the failure it exists to catch.
    expect(withAGap, 'not one morning drew an empty place, so the comparison '
      + 'above was between two empty lists every time').toBeGreaterThan(4);
    expect(r.episodes[0].tr.dawn.ofEp,
      'the first morning claims to be about a night before the season').toBe(null);
  });
});

// ── GUARD: THE REVEAL CONTRACT, ON BOTH ───────────────────────────────
describe('the morning and the book honour the reveal pattern', () => {
  const cases = () => [
    ['the morning', rpBuildColdOpen({ ...DAYS[5].ep, num: ++_trN }, 'audience'),
      'co', 'coldopen', 'trColdOpenReveal'],
    ['the book', rpBuildHouseStatus({ ...DAYS[5].ep, num: ++_trN }, 'audience'),
      'db', 'housestatus', 'trHouseStatusReveal'],
  ];

  it('step divs, counter, controls and stage are all addressable by id', () => {
    for (const c of cases()) {
      const what = c[0]; const html = c[1]; const p = c[2];
      const suffix = c[3]; const fn = c[4];
      expect(html, `${what}: no counter`).toContain('id="' + p + '-counter-' + suffix + '"');
      expect(html, `${what}: no controls`).toContain('id="' + p + '-controls-' + suffix + '"');
      expect(html, `${what}: no first step`).toContain('id="' + p + '-step-' + suffix + '-0"');
      expect(html, `${what}: no stage`).toContain('id="' + p + '-stage-inner"');
      // Inline handlers BAKE their targets — renderVPScreen wipes reveal state
      // on every paint and there is no closure left to hold them.
      expect(html, `${what}: the handlers do not bake their targets`)
        .toMatch(new RegExp(fn + "Next\\('" + suffix + "',\\d+,\\d+\\)"));
      expect(html, `${what}: no reveal-all handler`)
        .toMatch(new RegExp(fn + "All\\('" + suffix + "',\\d+,\\d+\\)"));
    }
  });

  it('and a screen opened and never clicked is not blank', () => {
    // The beats are height:0 until the visible class is on them, and that
    // class is only ever added by `_reapplyVisibility`, which only runs from a
    // click. The conclave shipped exactly this defect once.
    for (const c of cases()) {
      const what = c[0]; const html = c[1]; const p = c[2];
      const beats = [];
      const re = new RegExp('<div class="(' + p + '-beat[^"]*)" id="' + p
        + '-step-[a-z]+-[0-9]+"', 'g');
      let m;
      while ((m = re.exec(html))) beats.push(m[1]);
      expect(beats.length, `${what}: rendered no beats at all`).toBeGreaterThan(3);
      expect(beats[0], `${what}: opens on a collapsed first beat`).toContain(p + '-vis');
      expect(beats.filter(b => b.includes(p + '-vis')).length,
        `${what}: a fresh screen revealed more than the beat it is sitting on`).toBe(1);
    }
  });

  it('and a reader who had revealed it gets back what they revealed', () => {
    for (const c of [['the morning', morningRevealed(DAYS[5].ep), 'co'],
      ['the book', boardRevealed(DAYS[5].ep), 'db']]) {
      const what = c[0]; const html = c[1]; const p = c[2];
      const beats = [];
      const re = new RegExp('<div class="(' + p + '-beat[^"]*)" id="' + p
        + '-step-[a-z]+-[0-9]+"', 'g');
      let m;
      while ((m = re.exec(html))) beats.push(m[1]);
      // `every` on an empty list is true, and a regex that matched nothing
      // would hand this arm a free pass — which is how it first shipped.
      expect(beats.length, `${what}: rendered no beats at all`).toBeGreaterThan(3);
      expect(beats.every(b => b.includes(p + '-vis')),
        `${what}: a fully revealed screen came back collapsed`).toBe(true);
    }
  });
});

// ── GUARD: THE STICKY STAGE, ON BOTH ──────────────────────────────────
//
// The conclave's bug had TWO causes and both are checked: `overflow:hidden` on
// the shell makes it a scroll container and kills sticky for every descendant,
// AND the sticky element has to be the inner panel the handlers replace rather
// than a rail exactly as tall as its own grid. And the clip layer must take no
// z-index, or it becomes a stacking context and re-grades every blend.
describe('the sticky stage is not killed by the shell clip, on either screen', () => {
  const built = () => [
    ['the morning', rpBuildColdOpen(DAYS[5].ep, 'audience'), 'co'],
    ['the book', rpBuildHouseStatus(DAYS[5].ep, 'audience'), 'db'],
  ];

  it('the shell does not clip, and a scenery layer does it instead', () => {
    for (const c of built()) {
      const what = c[0]; const html = c[1]; const p = c[2];
      const shell = new RegExp('\\.' + p + '-shell\\{([^}]*)\\}').exec(html);
      expect(shell, `${what}: no shell rule`).toBeTruthy();
      expect(shell[1], `${what}: the shell clips again and the stage will not stick`)
        .not.toMatch(/overflow:\s*(hidden|auto|scroll|clip)/);
      expect(shell[1], `${what}: the shell does not declare overflow at all`)
        .toMatch(/overflow:\s*visible/);
      expect(html, `${what}: no clip layer`)
        .toContain('.' + p + '-scenery{position:absolute;inset:0;overflow:hidden');
    }
  });

  it('the element that sticks is the one the handlers replace, and it has range', () => {
    for (const c of built()) {
      const what = c[0]; const html = c[1]; const p = c[2];
      const panel = new RegExp('\\.' + p + '-stage\\{([^}]*)\\}').exec(html);
      expect(panel, `${what}: no stage rule`).toBeTruthy();
      expect(panel[1], `${what}: the stage does not stick`).toMatch(/position:\s*sticky/);
      expect(panel[1], `${what}: the stage is drawn over the nav bar`).toMatch(/top:46px/);
      expect(html, `${what}: the stage is not addressable`)
        .toContain('id="' + p + '-stage-inner"');
      const stageAt = html.indexOf('<div class="' + p + '-stage" id="' + p + '-stage-inner">');
      const mainAt = html.indexOf('<main class="' + p + '-main">');
      expect(stageAt, `${what}: the stage is not in the markup`).toBeGreaterThan(-1);
      expect(stageAt, `${what}: the stage is inside the stream it must stay above`)
        .toBeLessThan(mainAt);
    }
  });

  it('the clip layer takes no z-index, or the blend modes change picture', () => {
    for (const c of built()) {
      const layer = new RegExp('\\.' + c[2] + '-scenery\\{([^}]*)\\}').exec(c[1]);
      expect(layer, `${c[0]}: no clip layer rule`).toBeTruthy();
      expect(layer[1], c[0]).not.toMatch(/z-index/);
    }
  });
});

// ── GUARD: THE FACES ARE NEUTRAL HERE TOO ─────────────────────────────
describe("neither screen borrows the turret's lamp", () => {
  it('not one face on the morning or the board is lit', () => {
    for (const c of [['the morning', morningRevealed(DAYS[5].ep)],
      ['the book', boardRevealed(DAYS[5].ep)]]) {
      const opens = c[1].match(/<span class="cv-av(?: cv-lit)?"/g) || [];
      expect(opens.length, `${c[0]}: drew no portraits`).toBeGreaterThan(4);
      for (const o of opens) {
        expect(o, `${c[0]}: a face arrived pre-darkened: ${o}`).not.toContain('cv-lit');
      }
      expect(c[1], `${c[0]}: the conclave's lighting followed the helper here`)
        .not.toContain('.cv-av.cv-lit::before');
    }
  });

  it('and the shared portrait rules are one copy, imported, not retyped', () => {
    const rule = new RegExp('\\n\\.cv-av\\{[^}]*\\}');
    const turret = rpBuildConclave(NIGHTS[0].ep, 'audience');
    expect(rule.exec(turret), 'the turret has no portrait rule to compare against')
      .toBeTruthy();
    for (const c of [['the morning', rpBuildColdOpen(DAYS[5].ep, 'audience')],
      ['the book', rpBuildHouseStatus(DAYS[5].ep, 'audience')]]) {
      expect(rule.exec(c[1]), `${c[0]}: no portrait rule`).toBeTruthy();
      expect(rule.exec(c[1])[0], c[0]).toBe(rule.exec(turret)[0]);
    }
  });
});

// ══════════════════════════════════════════════════════════════════════
// THE MISSION AND THE OFFER (Plan 8, Task 4)
// ══════════════════════════════════════════════════════════════════════
//
// Same rule as the rest of this file: the LOOK of these two screens is judged
// by rendering them, and nothing below asserts anything about CSS. What is
// guarded here is what stays invisible on a beautiful, finished, working
// screen:
//
//   1. THE FUND ON THE PAGE IS THE FUND ON THE RECORD. The mission is where
//      the money comes from and the figure is the one thing a viewer will
//      quote. A wrong number looks exactly like a right one.
//   2. A RELIC DOES NOT NAME ITS HOLDER TO SOMEBODY WHO WAS NOT THERE. Plan 6
//      built the Shield semi-visibly on purpose; the asymmetry IS the
//      mechanic. A screen that names every holder to everybody has deleted it
//      and looks identical.
//   3. THE NOTE AND THE ULTIMATUM ARE DIFFERENT EVENTS (spec §6.6), and the
//      difference is life and death. A refused note must not name the
//      recruiter to the person who refused it -- the anonymity IS the
//      survivability, and a screen that prints the name has quietly made a
//      note exactly as fatal to refuse as an ultimatum.
//   4. AND BOTH SCREENS ARE REACHABLE FROM A PLAYED SEASON. This project's
//      signature bug class, asked of `buildVPScreens` rather than of the
//      builder.

/**
 * A dedicated, larger seed set for the offer.
 *
 * FOUR SEEDS IS NOT ENOUGH FOR THIS SCREEN, and the difference was measured
 * rather than guessed. Recruitment cannot open until the room has banished a
 * Traitor and then costs the pact a whole night, so it fires on roughly two
 * episodes a season; the REFUSED ULTIMATUM -- the branch that produces a body
 * and is the entire justification for the mode existing -- fired ONCE across
 * the four seeds the rest of this file uses. One is not a population. At
 * twelve seeds it fires three times and every other branch fires at least
 * seven, and every count is asserted before anything is asserted about it.
 */
const OFFER_SEEDS = [1, 3, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41];
const OFFER_RUNS = OFFER_SEEDS.map(season);
/** Every episode across every offer seed that recorded an approach. */
const OFFERS = OFFER_RUNS.flatMap(r => r.episodes.filter(e => e.tr && e.tr.recruitment)
  .map(e => ({ ep: e, run: r })));
/** Every episode across the shared seeds that recorded an afternoon. */
const AFTERNOONS = RUNS.flatMap(r => r.episodes.filter(e => e.tr && e.tr.mission)
  .map(e => ({ ep: e, run: r })));

/** The mission once every card has been revealed, on a fresh reveal state. */
function missionRevealed(ep, observer = 'audience') {
  const fresh = { ...ep, num: ++_trN };
  const first = rpBuildMission(fresh, observer);
  const m = /trMissionRevealAll\('mission',(\d+),(\d+)\)/.exec(first);
  expect(m, 'the mission did not emit a reveal handler').toBeTruthy();
  trMissionRevealAll('mission', Number(m[1]), Number(m[2]));
  return rpBuildMission(fresh, observer);
}
/** The offer once every card has been revealed, on a fresh reveal state. */
function offerRevealed(ep, observer = 'audience') {
  const fresh = { ...ep, num: ++_trN };
  const first = rpBuildRecruitment(fresh, observer);
  const m = /trRecruitmentRevealAll\('recruitment',(\d+),(\d+)\)/.exec(first);
  // An observer who was in neither role gets the empty passage and no
  // controls at all -- that layer is the point, so it is not an error here.
  if (!m) return first;
  trRecruitmentRevealAll('recruitment', Number(m[1]), Number(m[2]));
  return rpBuildRecruitment(fresh, observer);
}
/** Only the relic block's markup — the team rosters two cards up are public. */
function relicBlocks(html) {
  return String(html).match(/<div class="mi-relic" [\s\S]*?<\/div><\/div>/g) || [];
}

/**
 * The screen's NARRATION, with the portrait initials taken out first.
 *
 * `_portrait()` draws a fallback glyph of a player's initials inside every
 * avatar, and this roster contains a player called "B". So `strip()` of a
 * screen showing ANYBODY whose name starts with B contains a standalone "B",
 * and a word-bounded search for the recruiter matches a letter that is part
 * of somebody else's picture. That is a false positive and not a leak: an
 * avatar that is actually drawn arrives with its full name beside it in
 * `nt-who-nm`, which every check below still reads. The initials come out,
 * the names stay in.
 */
function narration(html) {
  return strip(String(html).replace(/<span class="cv-av-ini"[^>]*>[\s\S]*?<\/span>/g, ' '));
}

// THE SUBTRACTIVE HELPER, ASSERTED. Every negative arm below reads
// `narration()`, so a regex that ate too much would make the lot of them pass
// for free -- the same failure shape as a matcher that never matches, running
// the other way. It has to drop the glyph and keep the sentence.
describe('the narration helper drops initials and keeps names', () => {
  it('takes the avatar glyph out and leaves everything else alone', () => {
    const av = '<span class="cv-av" style="width:54px;height:54px">'
      + '<span class="cv-av-ini" style="font-size:18px">B</span>'
      + '<img src="assets/avatars/brick.png" alt=""></span>';
    const html = av + '<div class="nt-who-nm">Brick</div><p>Chase refused it.</p>';
    const text = narration(html);
    expect(mentions(text, 'B'), 'the initials glyph survived').toBe(false);
    expect(mentions(text, 'Brick'), 'the name was eaten with the glyph').toBe(true);
    expect(mentions(text, 'Chase'), 'the narration was eaten').toBe(true);
    expect(text.length, 'the helper returned nothing at all').toBeGreaterThan(20);
  });
});

// ── GUARD: THE FUND ───────────────────────────────────────────────────
describe('the money the mission prints is the money the record carries', () => {
  it('a real season runs missions at all, or every arm below is vacuous', () => {
    expect(AFTERNOONS.length, 'no played season recorded a single afternoon')
      .toBeGreaterThan(20);
    const paid = AFTERNOONS.filter(({ ep }) => ep.tr.mission.earned > 0);
    expect(paid.length, 'every afternoon earned nothing, so the arithmetic below '
      + 'is checked only against zero').toBeGreaterThan(15);
  });

  it('the record itself agrees with the fund the episode row publishes', () => {
    // The chain has two links and this is the far one: the afternoon's own
    // `potAfter` has to be the same quantity the row snapshots, or the screen
    // can be faithful to a record that is faithful to nothing. Nothing else
    // in the engine moves the fund, so these must be equal on every row.
    let checked = 0;
    for (const { ep } of AFTERNOONS) {
      expect(ep.tr.mission.potAfter, `ep ${ep.num}: the afternoon's fund is not the row's`)
        .toBe(ep.tr.pot);
      checked++;
    }
    expect(checked, 'no afternoon was checked').toBeGreaterThan(20);
  });

  it('and the figure drawn on the page is that number, unmodified', () => {
    let seen = 0;
    for (const { ep } of AFTERNOONS) {
      const html = missionRevealed(ep);
      // The machine-readable copy and the human-readable one, both checked: a
      // screen can carry the right attribute over a wrong caption, and a
      // screen can print the right number in the wrong place.
      const raw = /<span data-pot="(\d+)">/.exec(html);
      expect(raw, `ep ${ep.num}: the count drew no fund at all`).toBeTruthy();
      expect(Number(raw[1]), `ep ${ep.num}: the attribute disagrees with the record`)
        .toBe(ep.tr.pot);
      const printed = /<span data-pot="\d+">&pound;([\d,]+)</.exec(html);
      expect(printed, `ep ${ep.num}: the fund is not printed`).toBeTruthy();
      expect(Number(printed[1].replace(/,/g, '')),
        `ep ${ep.num}: the printed fund is not the recorded one`).toBe(ep.tr.pot);
      // and the afternoon's own take, which is the number the sting is about
      const earned = /<div class="mi-count-n" data-earned="(\d+)">/.exec(html);
      expect(earned, `ep ${ep.num}: the take is not drawn`).toBeTruthy();
      expect(Number(earned[1]), `ep ${ep.num}: the take disagrees with the record`)
        .toBe(ep.tr.mission.earned);
      seen++;
    }
    expect(seen, 'no mission was rendered, so nothing above was checked')
      .toBeGreaterThan(20);
  });
});

// ── GUARD: A RELIC DOES NOT NAME ITS HOLDER TO A NON-WITNESS ──────────
describe('the mission does not name a relic holder to somebody who was not there', () => {
  /** Only the afternoons that actually put a relic in somebody's hands. */
  const awarded = AFTERNOONS.filter(({ ep }) => {
    const r = ep.tr.mission.relic;
    return r && r.found && r.holder;
  });

  it('a real season awards relics at all, and not to a watching castle', () => {
    expect(awarded.length, 'no played season handed a relic to anybody, so every arm '
      + 'below is vacuous').toBeGreaterThan(2);
    const anyWitnessed = awarded.some(({ ep }) =>
      (ep.tr.mission.relic.witnesses || []).length > 0);
    expect(anyWitnessed, 'no relic was seen by anybody, so the entitled half below '
      + 'proves nothing').toBe(true);
    const anyBlind = awarded.some(({ ep }) => {
      const r = ep.tr.mission.relic;
      return ep.tr.cast.some(n => n !== r.holder && (r.witnesses || []).indexOf(n) < 0);
    });
    expect(anyBlind, 'every relic was seen by the whole castle, so the blind half '
      + 'below proves nothing either').toBe(true);
  });

  it('the audience is told, and so are the holder and the people who saw it', () => {
    let told = 0;
    for (const { ep } of awarded) {
      const r = ep.tr.mission.relic;
      const seers = ['audience', 'player:' + r.holder,
        ...(r.witnesses || []).slice(0, 1).map(w => 'player:' + w)];
      for (const obs of seers) {
        const mine = relicBlocks(missionRevealed(ep, obs))
          .filter(b => b.includes('data-holder="' + r.holder + '"'));
        expect(mine.length,
          `ep ${ep.num}: ${obs} was not told who came off the line with it`)
          .toBeGreaterThan(0);
        told++;
      }
    }
    expect(told, 'nobody entitled was checked').toBeGreaterThan(6);
  });

  it('and a player who did not see it is told only that something came back', () => {
    let checked = 0;
    for (const { ep } of awarded) {
      const r = ep.tr.mission.relic;
      const blind = ep.tr.cast.find(n => n !== r.holder
        && (r.witnesses || []).indexOf(n) < 0);
      if (!blind) continue;
      const blocks = relicBlocks(missionRevealed(ep, 'player:' + blind));
      // The card is still DRAWN -- the gap in the line was public and the
      // hour it cost is on the fund. It is the NAME that is missing.
      expect(blocks.length,
        `ep ${ep.num}: the relic vanished entirely for ${blind}`).toBeGreaterThan(0);
      const all = blocks.join('');
      expect(all.includes('data-holder'),
        `ep ${ep.num}: the relic carries a holder for ${blind}, who never saw it`)
        .toBe(false);
      expect(mentions(narration(all), r.holder),
        `ep ${ep.num}: ${r.holder} is named on the relic to ${blind}, who never saw it`)
        .toBe(false);
      expect(all.includes('data-known="0"'),
        `ep ${ep.num}: the relic is not marked unattributed for ${blind}`).toBe(true);
      checked++;
    }
    expect(checked, 'no non-witness was checked, so this guard proved nothing')
      .toBeGreaterThan(2);
  });

  it('and an hour that bought nothing names its searcher to everybody', () => {
    // THE OTHER SIDE OF THE GATE, AND IT IS DELIBERATELY OPEN. When nobody
    // came back with anything there is no relic, no holder and no witness
    // list -- and the gap in the line was watched by the whole team, which is
    // what the engine's own miss prose says. Gating a fact the room saw
    // happen would be a guard on an unreachable secret. This arm exists so
    // that a later edit closing the gate over a MISS fails here.
    const missed = AFTERNOONS.filter(({ ep }) => {
      const r = ep.tr.mission.relic;
      return r && !r.found;
    });
    expect(missed.length, 'no searcher came back empty-handed, so this arm is vacuous')
      .toBeGreaterThan(1);
    let checked = 0;
    for (const { ep } of missed) {
      const r = ep.tr.mission.relic;
      const anyone = ep.tr.cast.find(n => n !== r.searcher);
      const blocks = relicBlocks(missionRevealed(ep, 'player:' + anyone)).join('');
      expect(blocks.length, `ep ${ep.num}: the empty search drew no card`).toBeGreaterThan(0);
      expect(blocks.includes('data-awarded="0"'),
        `ep ${ep.num}: an empty-handed search is drawn as an award`).toBe(true);
      expect(mentions(narration(blocks), r.searcher),
        `ep ${ep.num}: ${r.searcher} broke the line in front of the whole team and `
        + 'the screen will not say so').toBe(true);
      checked++;
    }
    expect(checked, 'no empty search was checked').toBeGreaterThan(1);
  });
});

// ── GUARD: THE NOTE AND THE ULTIMATUM ARE DIFFERENT EVENTS ────────────
describe('the note and the ultimatum are rendered as the different things they are', () => {
  const notes = OFFERS.filter(({ ep }) => ep.tr.recruitment.mode === 'note');
  const ults = OFFERS.filter(({ ep }) => ep.tr.recruitment.mode === 'ultimatum');
  const refusedNotes = notes.filter(({ ep }) => !ep.tr.recruitment.accepted);
  const refusedUlts = ults.filter(({ ep }) => !ep.tr.recruitment.accepted);

  it('a real season produces both modes and both answers', () => {
    // EVERY ARM BELOW ITERATES ONE OF THESE LISTS. An empty one passes its
    // arm for free, which is this plan's most-repeated defect, so the counts
    // are asserted before anything is asserted about their contents.
    expect(OFFERS.length, 'no played season recorded an approach at all')
      .toBeGreaterThan(15);
    expect(notes.length, 'no offer was delivered as a note').toBeGreaterThan(5);
    expect(ults.length, 'no offer was delivered face to face').toBeGreaterThan(5);
    expect(refusedNotes.length, 'no note was refused, so the survivable half of the rule '
      + 'is never exercised').toBeGreaterThan(3);
    expect(refusedUlts.length, 'no ultimatum was refused, so the FATAL half of the rule '
      + 'is never exercised').toBeGreaterThan(1);
    expect(notes.filter(({ ep }) => ep.tr.recruitment.accepted).length,
      'no note was accepted').toBeGreaterThan(2);
    expect(ults.filter(({ ep }) => ep.tr.recruitment.accepted).length,
      'no ultimatum was accepted').toBeGreaterThan(2);
    // and a refused ultimatum really does produce a body, which is the whole
    // reason the mode exists
    for (const { ep } of refusedUlts) {
      expect(ep.tr.recruitment.executed,
        `ep ${ep.num}: an ultimatum was refused and nobody left the castle`)
        .toBe(ep.tr.recruitment.target);
    }
  });

  it('the screen says which kind of offer it is, in the markup and in the words', () => {
    let seenNote = 0;
    let seenUlt = 0;
    for (const { ep } of OFFERS) {
      const html = offerRevealed(ep);
      const mode = ep.tr.recruitment.mode;
      expect(html, `ep ${ep.num}: the shell carries no mode`)
        .toContain('data-mode="' + mode + '"');
      const text = strip(html);
      if (mode === 'note') {
        expect(html, `ep ${ep.num}: a note is titled as an ultimatum`)
          .toContain('>THE NOTE<');
        expect(html, `ep ${ep.num}: a note is titled as an ultimatum`)
          .not.toContain('>THE ULTIMATUM<');
        seenNote++;
      } else {
        expect(html, `ep ${ep.num}: an ultimatum is titled as a note`)
          .toContain('>THE ULTIMATUM<');
        expect(html, `ep ${ep.num}: an ultimatum is titled as a note`)
          .not.toContain('>THE NOTE<');
        seenUlt++;
      }
      expect(text.length, `ep ${ep.num}: the offer rendered nothing`).toBeGreaterThan(200);
    }
    expect(seenNote, 'no note was rendered').toBeGreaterThan(5);
    expect(seenUlt, 'no ultimatum was rendered').toBeGreaterThan(5);
  });

  it('and the terms strip states the price of refusing, before the answer is read', () => {
    // THE MECHANIC ITSELF, ON THE PAGE. The rule is about consequences and
    // the whole screen is built to make it legible, so the two words it turns
    // on are checked directly AND against each other: neither may print over
    // the other's night.
    let fatal = 0;
    let survivable = 0;
    for (const { ep } of OFFERS) {
      const html = offerRevealed(ep);
      const term = /<div class="nt-term"[^>]*data-k="If refused">[\s\S]*?<\/div>/.exec(html);
      expect(term, `ep ${ep.num}: the terms strip does not price a refusal`).toBeTruthy();
      if (ep.tr.recruitment.mode === 'ultimatum') {
        expect(term[0], `ep ${ep.num}: an ultimatum is priced as survivable to refuse`)
          .toContain('Fatal');
        expect(term[0]).toContain('they have seen your face');
        expect(term[0]).not.toContain('Survivable');
        fatal++;
      } else {
        expect(term[0], `ep ${ep.num}: a note is priced as fatal to refuse`)
          .toContain('Survivable');
        expect(term[0]).toContain('they never saw a face');
        expect(term[0]).not.toContain('Fatal');
        survivable++;
      }
    }
    expect(fatal, 'no fatal refusal was priced').toBeGreaterThan(5);
    expect(survivable, 'no survivable refusal was priced').toBeGreaterThan(5);
  });

  it('a refused note never names the recruiter to the person who refused it', () => {
    // THE RULE THE WHOLE SCREEN EXISTS FOR. A note is survivable to refuse
    // BECAUSE the refuser never learned who asked. A render that names the
    // author has made a note exactly as fatal as an ultimatum, and looks
    // identical while doing it.
    let checked = 0;
    for (const { ep } of refusedNotes) {
      const r = ep.tr.recruitment;
      expect(r.recruiter,
        `ep ${ep.num}: the record carries no recruiter, so this arm cannot fail`)
        .toBeTruthy();
      const html = offerRevealed(ep, 'player:' + r.target);
      const text = narration(html);
      expect(text.length, `ep ${ep.num}: the target's own render is empty`)
        .toBeGreaterThan(200);
      expect(mentions(text, r.recruiter),
        `ep ${ep.num}: ${r.target} refused an anonymous note and the screen named `
        + `${r.recruiter} anyway`).toBe(false);
      // and the anonymous asker is DRAWN -- a hood with nothing in it, not a
      // missing card. The castle knows a note arrived; it has no face for it.
      expect(html, `ep ${ep.num}: the anonymous asker is not drawn at all`)
        .toContain('class="nt-hood"');
      expect(html, `ep ${ep.num}: the terms strip names a hand it should not have`)
        .toContain('Not known to you');
      checked++;
    }
    expect(checked, 'no refused note was checked, so this guard proved nothing')
      .toBeGreaterThan(3);
  });

  it('and a refused ULTIMATUM does name them, which is why it kills', () => {
    // THE OTHER DIRECTION OF THE SAME GATE. A one-way mutation on a two-state
    // gate proves half of it: forcing the gate shut kills only this arm and
    // forcing it open kills only the one above. Both are needed.
    let checked = 0;
    for (const { ep } of refusedUlts) {
      const r = ep.tr.recruitment;
      const html = offerRevealed(ep, 'player:' + r.target);
      expect(mentions(narration(html), r.recruiter),
        `ep ${ep.num}: ${r.target} refused ${r.recruiter} to their face and the screen `
        + 'will not say whose face it was').toBe(true);
      expect(html, `ep ${ep.num}: a face-to-face asker is drawn as an anonymous hood`)
        .not.toContain('class="nt-hood"');
      checked++;
    }
    expect(checked, 'no refused ultimatum was checked').toBeGreaterThan(1);
  });

  it('and an accepted note names them, because the recruit is in the turret now', () => {
    // The engine writes the alignment fact into both players' knowledge on an
    // acceptance and into neither on a refusal (`offerRecruitment`), so this
    // is the screen agreeing with the ledger rather than a third rule.
    const acceptedNotes = notes.filter(({ ep }) => ep.tr.recruitment.accepted);
    expect(acceptedNotes.length, 'no note was accepted').toBeGreaterThan(2);
    let checked = 0;
    for (const { ep } of acceptedNotes) {
      const r = ep.tr.recruitment;
      expect(mentions(narration(offerRevealed(ep, 'player:' + r.target)), r.recruiter),
        `ep ${ep.num}: ${r.target} accepted and is standing in the turret beside `
        + `${r.recruiter}, and the screen will not name them`).toBe(true);
      checked++;
    }
    expect(checked, 'no accepted note was checked').toBeGreaterThan(2);
  });

  it('and somebody who was in neither role is shown an empty passage', () => {
    // The only screen in the set with a whole observer layer that renders
    // nothing, and it renders nothing because nothing is what that person
    // saw. Checked on the STRONGEST case: an offer refused anonymously, where
    // naming either party would be a leak.
    let checked = 0;
    for (const { ep } of refusedNotes) {
      const r = ep.tr.recruitment;
      const bystander = ep.tr.cast.find(n => n !== r.target && n !== r.recruiter);
      expect(bystander, `ep ${ep.num}: the cast holds nobody else`).toBeTruthy();
      const text = narration(offerRevealed(ep, 'player:' + bystander));
      expect(mentions(text, r.recruiter),
        `ep ${ep.num}: ${bystander} was asleep and is told who asked`).toBe(false);
      expect(mentions(text, r.target),
        `ep ${ep.num}: ${bystander} was asleep and is told who was asked`).toBe(false);
      checked++;
    }
    expect(checked, 'no bystander was checked').toBeGreaterThan(3);
  });

  it("and a body from a refused ultimatum carries the registry's own word", () => {
    // This show has TWO exit words and is the only show that does. A literal
    // written into a screen is a word a registry change cannot reach, which
    // is how one show's vocabulary ends up printed over another's departure.
    const [vote, night] = exitVerbs('traitors');
    expect(night, 'the registry has no second exit word').toBeTruthy();
    expect(night, 'the two exit words are the same word, so this arm cannot fail')
      .not.toBe(vote);
    const cap = w => w.charAt(0).toUpperCase() + w.slice(1);
    let checked = 0;
    for (const { ep } of refusedUlts) {
      const html = offerRevealed(ep);
      const row = /<span class="nt-sum-k">([^<]*)<\/span><span class="nt-sum-v" data-tone="wax">([^<]*)</.exec(html);
      expect(row, `ep ${ep.num}: the body is not entered anywhere`).toBeTruthy();
      expect(row[1], `ep ${ep.num}: the door is not the registry's word`).toBe(cap(night));
      expect(row[2], `ep ${ep.num}: the wrong person is entered`)
        .toBe(ep.tr.recruitment.executed);
      checked++;
    }
    expect(checked, 'no execution was checked').toBeGreaterThan(1);
  });
});

// ── GUARD: NEITHER SCREEN SPEAKS ANOTHER SHOW'S LANGUAGE ──────────────
describe("the mission and the offer use no other show's words", () => {
  it('nothing either screen prints belongs to another show', () => {
    let checked = 0;
    for (const { ep } of AFTERNOONS.slice(0, 20)) {
      const text = strip(missionRevealed(ep));
      expect(text.length, 'the mission rendered nothing').toBeGreaterThan(200);
      expect(foreignWordsIn(text, 'traitors'),
        `ep ${ep.num}: the mission printed another show's vocabulary`).toEqual([]);
      checked++;
    }
    for (const { ep } of OFFERS.slice(0, 20)) {
      const text = strip(offerRevealed(ep));
      expect(text.length, 'the offer rendered nothing').toBeGreaterThan(200);
      expect(foreignWordsIn(text, 'traitors'),
        `ep ${ep.num}: the offer printed another show's vocabulary`).toEqual([]);
      checked++;
    }
    expect(checked, 'no screen was scanned').toBeGreaterThan(30);
  });

  it("and a player observer's render is prose too, so it is checked as well", () => {
    const { ep } = AFTERNOONS[3];
    const who = ep.tr.cast[0];
    expect(strip(missionRevealed(ep, 'player:' + who)).length,
      'the mission rendered nothing for a player').toBeGreaterThan(200);
    expect(foreignWordsIn(strip(missionRevealed(ep, 'player:' + who)), 'traitors'),
      'the mission').toEqual([]);
    const o = OFFERS[0].ep;
    const target = o.tr.recruitment.target;
    expect(strip(offerRevealed(o, 'player:' + target)).length,
      'the offer rendered nothing for its target').toBeGreaterThan(200);
    expect(foreignWordsIn(strip(offerRevealed(o, 'player:' + target)), 'traitors'),
      'the offer').toEqual([]);
  });
});

// ── GUARD: BOTH SCREENS ARE REACHABLE FROM A PLAYED SEASON ────────────
//
// This project's signature bug class. Asked of `buildVPScreens` rather than of
// the builder, because calling the builder proves it returns HTML, which is
// exactly what every unreachable screen in this repo also did.
describe('the mission and the offer are reachable from a played season', () => {
  it('every afternoon a season records registers a mission screen', () => {
    let reached = 0;
    for (const { ep } of AFTERNOONS) {
      const hit = buildVPScreens(ep).find(x => x.id === 'tr-mission');
      expect(hit, `ep ${ep.num}: the mission is not reachable`).toBeTruthy();
      expect(strip(hit.html).length, `ep ${ep.num}: the mission rendered nothing`)
        .toBeGreaterThan(200);
      reached++;
    }
    expect(reached, 'no episode reached the mission').toBeGreaterThan(20);
  });

  it('and every approach registers an offer screen', () => {
    let reached = 0;
    for (const { ep } of OFFERS) {
      const hit = buildVPScreens(ep).find(x => x.id === 'tr-recruitment');
      expect(hit, `ep ${ep.num}: the offer is not reachable`).toBeTruthy();
      expect(strip(hit.html).length, `ep ${ep.num}: the offer rendered nothing`)
        .toBeGreaterThan(200);
      reached++;
    }
    expect(reached, 'no episode reached the offer').toBeGreaterThan(15);
  });

  it('and an episode with no approach does not register one', () => {
    // Recruitment and murder are exclusive -- the pact gets one action a
    // night -- so most nights hold neither, and a screen registered on every
    // row would be an empty passage four episodes out of five.
    const quiet = OFFER_RUNS[0].episodes.filter(e => !(e.tr && e.tr.recruitment));
    expect(quiet.length, 'every episode of that season held an approach')
      .toBeGreaterThan(3);
    for (const ep of quiet) {
      expect(buildVPScreens(ep).find(x => x.id === 'tr-recruitment'),
        `ep ${ep.num}: an offer screen for a night nobody was asked`).toBeFalsy();
    }
  });

  it('and the afternoon sits between the day book and the evening', () => {
    // The order is the claim: the castle reads the book at breakfast, goes
    // out on the estate, comes back and sits down at the table.
    const ep = RUNS[0].episodes.find(e => e.tr && e.tr.mission && e.tr.table);
    expect(ep, 'no episode held both an afternoon and an evening').toBeTruthy();
    const ids = buildVPScreens(ep).map(x => x.id);
    expect(ids.indexOf('tr-status'), 'the day book is not registered').toBeGreaterThan(-1);
    expect(ids.indexOf('tr-mission')).toBeGreaterThan(ids.indexOf('tr-status'));
    expect(ids.indexOf('tr-round-table')).toBeGreaterThan(ids.indexOf('tr-mission'));
  });
});

// ══════════════════════════════════════════════════════════════════════
// THE ENDGAME (Plan 8, Task 5)
// ══════════════════════════════════════════════════════════════════════
//
// The last screen, and the one whose whole design is an ABSENCE: spec 8 says
// there are no reveals at a finale table, so the survivors answer on nerve and
// the screen has to withhold the payoff every other screen in this set
// delivers. What is guarded here is what stays invisible on a beautiful,
// finished, working screen:
//
//   1. NO ALIGNMENT IS REVEALED AT ANY ENDGAME TABLE. `endgameChoice` returns
//      the whole basis of a decision and half of that basis is ground truth --
//      a `role` read off `alignmentAt`, a `fellows` list that exists on one
//      side only. A record that spread it would hand the screen every
//      survivor's alignment at the exact table the format says nothing is
//      revealed at. Guarded on the RECORD and on the SCREEN, because the two
//      fail for different reasons.
//   2. A CO-WINNER ENDING RENDERS ALL WINNERS. Up to four people split this
//      pot and js/tr/export.js is explicit that picking a main winner out of
//      `winners[]` is inventing a fact. `seasonWinners()` is the rule.
//   3. THE POT SPLIT MATCHES THE EXPORT. The money is the one figure a viewer
//      will quote, and a wrong one looks exactly like a right one.
//   4. THE OBSERVER CONTRACT, and on this screen it is a secret ballot: the
//      audience reads every slip, a player reads their own and nobody else's.

/**
 * A dedicated seed set, sized to the endings rather than to the episodes.
 *
 * MEASURED, NOT GUESSED. The shared four seeds produce a lone Traitor twice
 * and a four-way split of Faithfuls twice, and NEVER a pair of Traitors
 * dividing the pot -- which is the co-winner case with somebody left standing
 * beside them to be robbed, and the one the "render all the winners" guard
 * exists for. Across these twenty it fires, and every branch below asserts its
 * own count before it asserts anything about the members.
 */
const END_SEEDS = [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 31, 33, 35, 37, 39];
const END_RUNS = END_SEEDS.map(season);
/**
 * The last row of each season, which is where the phase record rides.
 *
 * `tr.endgame` is attached to the LAST row rather than to a night of its own,
 * because the endgame can force six extra tables or none at all -- when the
 * first ask is unanimous there is no row written for it, so there is no
 * episode number to key it to.
 */
const ENDINGS = END_RUNS.map(r => ({
  run: r, ep: r.episodes[r.episodes.length - 1], season: r.season,
})).filter(e => e.ep && e.ep.tr && e.ep.tr.endgame);

/** The endgame once every card has been dealt, on a fresh reveal state. */
function endgameRevealed(ep, observer = 'audience') {
  const fresh = { ...ep, num: ++_trN };
  const first = rpBuildEndgame(fresh, observer);
  const m = /trEndgameRevealAll\('endgame',(\d+),(\d+)\)/.exec(first);
  expect(m, 'the endgame did not emit a reveal handler').toBeTruthy();
  trEndgameRevealAll('endgame', Number(m[1]), Number(m[2]));
  return rpBuildEndgame(fresh, observer);
}
/** Every slip on the screen, as `{ name, choice }`. */
function slipsOf(html) {
  const out = [];
  const re = /<span class="lt-slip" data-choice="([a-z]+)" data-name="([^"]*)">/g;
  let m;
  while ((m = re.exec(String(html)))) out.push({ choice: m[1], name: m[2] });
  return out;
}
/**
 * Everything the screen prints BEFORE the money card is dealt.
 *
 * The stylesheet comes off FIRST, and it has to: the CSS names every card
 * kind, so a search for the money card in raw markup finds the rule that
 * styles it, three hundred lines above the hero plate, and "before the money"
 * becomes "the first two hundred bytes of a font import".
 */
function beforeTheMoney(html) {
  const body = String(html).replace(/<style[\s\S]*?<\/style>/gi, ' ');
  const i = body.indexOf('data-kind="money"');
  expect(i, 'the screen never dealt a money card').toBeGreaterThan(-1);
  return body.slice(0, i);
}

// THE SUBTRACTIVE HELPER, ASSERTED. Every arm that reads it is a NEGATIVE
// assertion, so a helper that cut too much would pass the lot of them for
// free -- Task 4's fifth vacuous shape, and this one cuts twice.
/**
 * The alignment words in a stretch of the screen, if any.
 *
 * THE SHOW'S OWN NAME COMES OUT FIRST. The eyebrow reads "The Traitors -
 * Night 9" on every screen in this directory, so a bare search for the word
 * finds the title of the programme on a screen that has revealed nothing at
 * all -- and a guard nobody can satisfy is a guard somebody deletes.
 */
function alignmentWordsIn(text) {
  // Built by concatenation, so the boundary must be written '\\b'. A bare
  // '\b' inside a string literal is U+0008 and the regex then matches nothing
  // whatever. This helper shipped exactly that defect for one run of the
  // suite -- a heredoc ate a level of escaping on the way into the file --
  // and the arm below is the only reason it did not stay shipped.
  const bare = String(text).replace(new RegExp('\\bThe Traitors\\b', 'g'), ' ');
  return ['Traitor', 'Traitors', 'Faithful', 'Faithfuls']
    .filter(w => new RegExp('\\b' + w + '\\b', 'i').test(bare));
}

// AND THE STRIPPER IS ASSERTED, because it is subtractive and every arm that
// reads it is negative. One that ate the whole sentence would pass all of them.
describe('the alignment matcher finds a side and not the name of the show', () => {
  it('drops the title and keeps a real one', () => {
    expect(alignmentWordsIn('The Traitors &middot; Night 9')).toEqual([]);
    expect(alignmentWordsIn('The Traitors &middot; Night 9. Bowie was a Traitor.'))
      .toContain('Traitor');
    expect(alignmentWordsIn('Nobody here was lying: four Faithfuls.'))
      .toContain('Faithfuls');
    expect(alignmentWordsIn('The room sat down and wrote one word each.')).toEqual([]);
  });
});

describe('the before-the-money helper keeps the screen and drops the stylesheet', () => {
  it('cuts at the card and not at the rule that paints it', () => {
    const html = '<style>.lt-card[data-kind="money"]{color:red}</style>'
      + '<p>The room sat down.</p><div class="lt-card" data-kind="money">Bowie</div>';
    const early = beforeTheMoney(html);
    expect(early, 'the helper cut inside the stylesheet').toContain('The room sat down.');
    expect(early, 'the money card survived the cut').not.toContain('Bowie');
    expect(early, 'the stylesheet survived the cut').not.toContain('color:red');
  });
});

describe('the endgame record reaches the screen at all', () => {
  it('every season played writes one, and it holds asks and money', () => {
    expect(ENDINGS.length, 'no season across twenty seeds recorded an endgame')
      .toBe(END_SEEDS.length);
    for (const { ep } of ENDINGS) {
      const e = ep.tr.endgame;
      expect(e.asks.length, 'an endgame that never asked anybody').toBeGreaterThan(0);
      expect(e.takers.length, 'an endgame nobody won').toBeGreaterThan(0);
      expect(['faithfuls', 'traitors']).toContain(e.winner);
      // The loop's own rule: it stops when, and only when, nobody asked for
      // another table. Anything else means the record is holding a phase that
      // ended for a reason the format does not have.
      expect(e.asks[e.asks.length - 1].unanimous,
        'the endgame stopped on an ask somebody wanted another table at').toBe(true);
      // One table per ask that was not unanimous, and never one more.
      expect(e.tables.length).toBe(e.asks.filter(a => !a.unanimous).length);
    }
  });

  it('and the sample contains all three endings the screen has to draw', () => {
    // COUNTS FIRST. Every arm below reads one of these three sets, and a set
    // that came back empty would make its arm pass without rendering a thing.
    const lone = ENDINGS.filter(e => e.ep.tr.endgame.takers.length === 1);
    const split = ENDINGS.filter(e => e.ep.tr.endgame.takers.length > 1);
    const robbed = ENDINGS.filter(e => e.ep.tr.endgame.winner === 'traitors'
      && e.ep.tr.endgame.losers.length);
    const clean = ENDINGS.filter(e => e.ep.tr.endgame.winner === 'faithfuls');
    const pair = split.filter(e => e.ep.tr.endgame.winner === 'traitors');
    expect(lone.length, 'no season ended on a single taker').toBeGreaterThan(4);
    expect(split.length, 'no season ended on a split pot').toBeGreaterThan(4);
    expect(robbed.length, 'no season ended with somebody robbed').toBeGreaterThan(4);
    expect(clean.length, 'no season ended clean').toBeGreaterThan(4);
    // The rarest of the four, and the reason this file does not use the shared
    // four seeds for the endgame: a PAIR of Traitors dividing the pot in front
    // of the people they took it from fires nowhere in seeds 1, 3, 7 and 11.
    expect(pair.length, 'no season ended on two cloaks sharing the money')
      .toBeGreaterThan(0);
  });
});

// ── GUARD 1: NO ALIGNMENT IS REVEALED AT AN ENDGAME TABLE ─────────────
describe('the endgame turns nobody over', () => {
  it('CONTROL: the engine really does decide this on ground truth', () => {
    // Without this the record arm below is a guard on fields nothing writes.
    // `_setEndgameWatch` is the engine's own hook and it hands over the WHOLE
    // basis of every decision as it is made -- including a `role` read
    // straight off `alignmentAt`, and a `fellows` list that exists on one side
    // only. Recomputing `endgameChoice` after the fact would be worse than
    // useless here: it reads `gs`, and `gs` is replaced wholesale by the next
    // season, so a late call answers about a castle that no longer exists.
    const watched = [];
    const restore = _setEndgameWatch(c => watched.push(c));
    let run;
    try { run = season(101); } finally { restore(); }
    const ep = run.episodes[run.episodes.length - 1];
    expect(watched.length, 'nobody was asked, so this control proves nothing')
      .toBeGreaterThan(1);
    expect(watched.some(c => c.role === 'traitor'),
      'no watched decision was made by a Traitor').toBe(true);
    expect(watched.some(c => c.role === 'faithful'),
      'no watched decision was made by a Faithful').toBe(true);
    expect(watched.some(c => Array.isArray(c.fellows) && c.fellows.length
      || c.appetite != null),
      'endgameChoice stopped returning the Traitor side of the decision').toBe(true);
    // The record is a PRUNED COPY OF THE SAME DECISION -- same people, same
    // answers, in the same order -- and not a second calculation that could
    // drift away from the one the season was actually played on.
    const recorded = ep.tr.endgame.asks
      .flatMap(a => a.choices.map(c => c.name + ':' + c.choice));
    expect(recorded.length).toBe(watched.length);
    expect(recorded).toEqual(watched.map(c => c.name + ':' + c.choice));
    // and the ground truth it was decided on is nowhere in that copy
    for (const a of ep.tr.endgame.asks) {
      for (const c of a.choices) {
        expect(c.role, 'a role survived onto the record').toBeUndefined();
        expect(c.fellows, 'a fellow list survived onto the record').toBeUndefined();
      }
    }
  });

  it('LOCK ONE: the record carries a name and a word, and nothing else', () => {
    let seen = 0;
    for (const { ep } of ENDINGS) {
      for (const a of ep.tr.endgame.asks) {
        for (const c of a.choices) {
          expect(Object.keys(c).sort(),
            `ep ${ep.num}: a finale choice carries more than a name and a word`)
            .toEqual(['choice', 'name']);
          seen++;
        }
      }
      // and the tables the asks forced: an episode and a name. `wasTraitor` is
      // on the round object the engine holds and must not be on this.
      for (const t of ep.tr.endgame.tables) {
        expect(Object.keys(t).sort(),
          `ep ${ep.num}: a finale table carries more than an episode and a name`)
          .toEqual(['chosen', 'ep']);
      }
    }
    expect(seen, 'no choice was inspected, so this arm asserted nothing')
      .toBeGreaterThan(40);
  });

  it('LOCK TWO: the screen says nothing about what anybody was, until the money', () => {
    // THE HOLE WHERE THE ANSWER GOES. Every other screen in this set ends a
    // departure with a word; this one ends it with the absence of one, and the
    // absence is the design. The money card is the season's ONE legitimate
    // reveal -- the game is over and the cloaks come off -- so the assertion
    // is on everything dealt BEFORE it.
    let tables = 0;
    for (const { ep } of ENDINGS) {
      const html = endgameRevealed(ep, 'audience');
      const early = strip(beforeTheMoney(html));
      expect(alignmentWordsIn(early),
        `ep ${ep.num}: the screen named a side before the strongbox was opened`)
        .toEqual([]);
      for (const t of ep.tr.endgame.tables) {
        expect(early, `ep ${ep.num}: ${t.chosen} left without the silence being drawn`)
          .toContain('Nothing Is Turned Over');
        expect(early).toContain(t.chosen);
        tables++;
      }
    }
    // and the sample actually contained a table, or the loop above ran zero
    // times and proved nothing about the thing it is named after
    expect(tables, 'no endgame forced a table across twenty seeds').toBeGreaterThan(8);
  });

  it('and the money card, which is the one place it may be said, says it', () => {
    // The other half of the same rule. If nothing anywhere on the screen ever
    // named a side, LOCK TWO would be satisfied by a screen that simply never
    // resolves the season -- which is a different bug wearing the same green.
    const clean = ENDINGS.find(e => e.ep.tr.endgame.winner === 'faithfuls');
    const dirty = ENDINGS.find(e => e.ep.tr.endgame.winner === 'traitors');
    expect(clean && dirty, 'the sample holds only one kind of ending').toBeTruthy();
    for (const { ep } of [clean, dirty]) {
      const html = endgameRevealed(ep, 'audience');
      const money = String(html).slice(String(html).indexOf('data-kind="money"'));
      expect(strip(money), `ep ${ep.num}: the strongbox opened on nothing`)
        .toContain(ep.tr.endgame.takers[0]);
    }
  });

  it('BOTH LOCKS ARE IN THE SOURCE, because the screen one cannot be caught alone', () => {
    // AN HONEST NOTE ON WHAT THIS ARM IS FOR, and it is Task 2's note again.
    // There are two rebuilds -- js/tr/headless.js builds each choice to two
    // fields, and `_view` builds it to two fields AGAIN off a record it does
    // not trust -- and the beat builder reads exactly `name` and `choice`, so
    // deleting the SCREEN's rebuild cannot change a single character of any
    // render. A mutation on it is green by construction, which is precisely
    // why it would be deleted one day on the grounds that the suite did not
    // notice. It is here so that it is noticed.
    const src = readFileSync(new URL('../' + 'js/vp-tr/endgame.js', import.meta.url), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, ' ')
      .replace(new RegExp('(^|[^:])//[^\\n]*', 'g'), '$1 ');
    expect(src, 'the view stopped rebuilding the choices from scratch')
      .toContain("choice: c.choice === 'banish' ? 'banish' : 'end',");
    expect(src, 'the view stopped rebuilding the tables from scratch')
      .toContain('tables = (rec.tables || []).map(t => ({ ep: t.ep, chosen: t.chosen || null }))');
    const eng = readFileSync(new URL('../' + 'js/tr/headless.js', import.meta.url), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, ' ')
      .replace(new RegExp('(^|[^:])//[^\\n]*', 'g'), '$1 ');
    expect(eng, 'the record stopped rebuilding the choices and started spreading them')
      .toContain('.map(c => ({ name: c.name, choice: c.choice }))');
  });
});

// ── GUARD 2: EVERY WINNER, AND NEVER THE FIRST OF THEM ────────────────
describe('a co-winner ending renders all of its winners', () => {
  /** The winners the screen actually drew. */
  const drawnWinners = html => (String(html)
    .match(/<span class="lt-winner" data-name="([^"]*)"/g) || [])
    .map(s => /data-name="([^"]*)"/.exec(s)[1]);

  it('the matcher finds a winner that is there and none that is not', () => {
    // Every assertion below counts what this returns, so a matcher that never
    // matched would fail loudly rather than pass quietly -- but the empty case
    // has to be checked too, or a matcher that matches EVERYTHING passes.
    expect(drawnWinners('<span class="lt-winner" data-name="Bowie">')).toEqual(['Bowie']);
    expect(drawnWinners('<span class="lt-lost-one" data-name="Bowie">')).toEqual([]);
  });

  it('every taker the season produced is drawn, in the export\'s own list', () => {
    let splits = 0;
    for (const { ep, season: s } of ENDINGS) {
      const doc = buildTraitorsSeasonDocument(s, { seasonNumber: 1 });
      // `seasonWinners()` IS THE RULE (Plan 7) and it is asked rather than
      // re-derived: winners[] -> placements[] at 1 -> winner{}. A screen
      // checked against `takers` alone would agree with a document that had
      // already lost half of them.
      const winners = seasonWinners(doc).map(w => w.name);
      expect(winners.length, `ep ${ep.num}: the document names no winner at all`)
        .toBeGreaterThan(0);
      expect(winners.slice().sort()).toEqual(ep.tr.endgame.takers.slice().sort());
      const drawn = drawnWinners(endgameRevealed(ep, 'audience'));
      expect(drawn.slice().sort(),
        `ep ${ep.num}: the screen drew ${drawn.length} of ${winners.length} winners`)
        .toEqual(winners.slice().sort());
      if (winners.length > 1) splits++;
    }
    expect(splits, 'no season in the sample split the pot, so nothing was proved')
      .toBeGreaterThan(4);
  });

  it('and the people who took nothing are drawn as well, and drawn differently', () => {
    const robbed = ENDINGS.filter(e => e.ep.tr.endgame.losers.length);
    expect(robbed.length, 'nobody was left empty-handed anywhere in the sample')
      .toBeGreaterThan(4);
    for (const { ep } of robbed) {
      const html = endgameRevealed(ep, 'audience');
      for (const n of ep.tr.endgame.losers) {
        expect(html, `ep ${ep.num}: ${n} finished the season and is not on the screen`)
          .toContain('<span class="lt-lost-one" data-name="' + n + '">');
        expect(drawnWinners(html), `ep ${ep.num}: ${n} took nothing and is drawn a winner`)
          .not.toContain(n);
      }
    }
  });
});

// ── GUARD 3: THE MONEY ON THE PAGE IS THE MONEY IN THE EXPORT ─────────
//
// EVERY FIGURE IS READ OUT OF THE ELEMENT THAT STATES IT, and that is not
// fussiness. The first version of this guard searched the whole screen for the
// pot and for the share, and BOTH mutations came back green: the pot is also
// on the opening card as the standing fund and the share is also in the
// summary row under the winners, so swapping the two figures over on the
// strongbox and on the winner plates left every number still present
// somewhere. That is this plan's recurring vacuous shape -- redundancy hiding
// a dead guard, fourth occurrence -- and the fix is not to delete one of the
// two legitimate statements of the number but to assert the one under test.

/** The figure on the strongbox, as the strongbox states it. */
const potFigure = html => {
  const m = /<span class="lt-pot-n">([^<]*)<\/span>/.exec(String(html));
  return m ? m[1] : null;
};
/** What is written under each winner's face, in order. */
const winnerShares = html => (String(html)
  .match(/<span class="lt-winner-sh">([^<]*)<\/span>/g) || [])
  .map(s => /<span class="lt-winner-sh">([^<]*)<\/span>/.exec(s)[1]);

describe('the pot the screen splits is the pot the export pays', () => {
  it('the two figure readers find the figures and not each other', () => {
    // Both are used only in POSITIVE assertions below, so a reader that never
    // matched would fail loudly -- but one that matched the WRONG element
    // would pass quietly, which is exactly how the first version went green.
    const html = '<div class="lt-pot"><span class="lt-pot-n">&pound;72,233</span>'
      + '<span class="lt-pot-k">in the box</span></div>'
      + '<span class="lt-winner-sh">&pound;19,164</span>'
      + '<span class="lt-winner-sh">takes all of it</span>'
      + '<span class="lt-sum-v">&pound;72,233</span>';
    expect(potFigure(html)).toBe('&pound;72,233');
    expect(winnerShares(html)).toEqual(['&pound;19,164', 'takes all of it']);
    expect(potFigure('<p>&pound;72,233</p>'), 'the pot reader matched loose text').toBeNull();
    expect(winnerShares('<span class="lt-sum-v">&pound;19,164</span>')).toEqual([]);
  });

  it('the figure, the share and the arithmetic all agree', () => {
    let checked = 0;
    for (const { ep, season: s } of ENDINGS) {
      const doc = buildTraitorsSeasonDocument(s, { seasonNumber: 1 });
      const e = ep.tr.endgame;
      const html = endgameRevealed(ep, 'audience');
      // The screen writes money with the symbol on it, as every other castle
      // screen does; the entity is what is in the markup before a browser
      // reads it.
      const fmt = n => '&pound;' + Number(n).toLocaleString('en-GB');
      expect(doc.pot, `ep ${ep.num}: the document lost the pot`).toBe(e.pot);
      // THE STRONGBOX, and the strongbox alone.
      expect(potFigure(html), `ep ${ep.num}: the strongbox does not hold ${fmt(e.pot)}`)
        .toBe(fmt(e.pot));
      // Every winner row on the document carries the same share, and it is
      // the share the screen writes under each face.
      for (const w of doc.winners) {
        expect(w.share, `ep ${ep.num}: ${w.name}'s share is missing from the export`)
          .toBe(e.share);
      }
      const shares = winnerShares(html);
      expect(shares.length, `ep ${ep.num}: no winner was given a figure at all`)
        .toBe(e.takers.length);
      if (e.takers.length > 1) {
        expect(shares, `ep ${ep.num}: a winner was not written ${fmt(e.share)}`)
          .toEqual(e.takers.map(() => fmt(e.share)));
        // and it is a figure the box can actually pay out
        expect(e.share * e.takers.length).toBeLessThanOrEqual(e.pot);
        expect((e.share + 1) * e.takers.length).toBeGreaterThan(e.pot);
      } else {
        expect(e.share, `ep ${ep.num}: a lone taker did not take the lot`).toBe(e.pot);
        expect(shares[0]).toBe('takes all of it');
      }
      checked++;
    }
    expect(checked).toBe(ENDINGS.length);
  });

  it('and the castle adds up: everybody standing, plus both doors, is the cast', () => {
    // The opening card states three numbers about the same room and they have
    // to be the same room. `goneBefore` deliberately excludes this row's own
    // departures and the endgame's own tables take people out of the standing
    // list, so both corrections are live and both are load-bearing.
    for (const { ep } of ENDINGS) {
      const text = strip(endgameRevealed(ep, 'audience'));
      const [banish, murder] = exitVerbs('traitors');
      const cap = w => w.charAt(0).toUpperCase() + w.slice(1);
      const m = new RegExp('Still standing (\\d+) ' + cap(banish) + ' (\\d+) '
        + cap(murder) + ' (\\d+)').exec(text);
      expect(m, `ep ${ep.num}: the opening card does not state the room`).toBeTruthy();
      const sum = Number(m[1]) + Number(m[2]) + Number(m[3]);
      expect(sum, `ep ${ep.num}: ${m[1]} + ${m[2]} + ${m[3]} is not a cast of `
        + ep.tr.cast.length).toBe(ep.tr.cast.length);
      // and the standing figure is the room the question was first put to
      expect(Number(m[1])).toBe(ep.tr.endgame.asks[0].living.length);
    }
  });
});

// ── GUARD 4: THE OBSERVER CONTRACT, WHICH HERE IS A SECRET BALLOT ─────
describe('a player reads their own paper and nobody else\'s', () => {
  it('the audience reads every slip', () => {
    let slips = 0;
    for (const { ep } of ENDINGS.slice(0, 10)) {
      const html = endgameRevealed(ep, 'audience');
      const drawn = slipsOf(html);
      const asked = ep.tr.endgame.asks.reduce((n, a) => n + a.choices.length, 0);
      expect(drawn.length, `ep ${ep.num}: ${drawn.length} slips for ${asked} answers`)
        .toBe(asked);
      expect(drawn.filter(s => s.choice === 'sealed'),
        `ep ${ep.num}: the audience was refused a slip`).toEqual([]);
      slips += drawn.length;
    }
    expect(slips, 'no slip was drawn at all').toBeGreaterThan(40);
  });

  it('a player in the room reads exactly one slip per ask, and it is theirs', () => {
    let checked = 0;
    for (const { ep } of ENDINGS.slice(0, 10)) {
      const e = ep.tr.endgame;
      for (const who of e.asks[0].living) {
        const drawn = slipsOf(endgameRevealed(ep, 'player:' + who));
        const open = drawn.filter(s => s.choice !== 'sealed');
        expect(open.length, `ep ${ep.num}: ${who} read ${open.length} slips`)
          .toBe(e.asks.filter(a => a.choices.some(c => c.name === who)).length);
        expect(open.every(s => s.name === who),
          `ep ${ep.num}: ${who} read somebody else's paper`).toBe(true);
        // and what they read is what they wrote
        for (const s of open) {
          const a = e.asks.find(x => x.choices.some(c => c.name === who));
          expect(['banish', 'end']).toContain(s.choice);
          expect(a, 'the reader was never asked').toBeTruthy();
        }
        checked++;
      }
    }
    expect(checked, 'nobody in any room was checked').toBeGreaterThan(20);
  });

  it('and somebody who was already out of the castle reads none of them', () => {
    let checked = 0;
    for (const { ep } of ENDINGS.slice(0, 10)) {
      const e = ep.tr.endgame;
      const room = e.asks[0].living;
      const out = (ep.tr.cast || []).find(n => !room.includes(n));
      expect(out, `ep ${ep.num}: nobody had left, so there is no outsider`).toBeTruthy();
      const html = endgameRevealed(ep, 'player:' + out);
      const drawn = slipsOf(html);
      expect(drawn.length, `ep ${ep.num}: the outsider got no screen at all`)
        .toBeGreaterThan(0);
      expect(drawn.filter(s => s.choice !== 'sealed'),
        `ep ${ep.num}: ${out} was not in the room and read a slip anyway`).toEqual([]);
      // The count and the money ARE public -- the room is told whether it was
      // unanimous, because that is the fact that forces another table, and the
      // money is announced to everybody including the people it was taken
      // from. A layer that hid those would be hiding the wrong thing.
      expect(strip(html), `ep ${ep.num}: the outsider was not told the money`)
        .toContain(Number(e.pot).toLocaleString('en-US'));
      checked++;
    }
    expect(checked).toBe(10);
  });
});

// ── GUARD 5: no other show's words, and the exit verbs from the registry
describe("the last table may not be described in another show's words", () => {
  it('nothing the endgame prints belongs to another show', () => {
    for (const { ep } of ENDINGS.slice(0, 10)) {
      const leaks = foreignWordsIn(strip(endgameRevealed(ep, 'audience')), 'traitors');
      expect(leaks, `ep ${ep.num} printed another show's vocabulary`).toEqual([]);
    }
  });

  it('and neither does the layer that reads nothing', () => {
    const { ep } = ENDINGS[0];
    const out = (ep.tr.cast || []).find(n => !ep.tr.endgame.asks[0].living.includes(n));
    expect(out).toBeTruthy();
    expect(foreignWordsIn(strip(endgameRevealed(ep, 'player:' + out)), 'traitors'))
      .toEqual([]);
  });

  it('and the word it uses for a departure is the registry\'s, character for character', () => {
    const [banish, murder] = exitVerbs('traitors');
    const cap = w => w.charAt(0).toUpperCase() + w.slice(1);
    const withTable = ENDINGS.find(e => e.ep.tr.endgame.tables.length);
    expect(withTable, 'no endgame in the sample forced a table').toBeTruthy();
    const text = strip(endgameRevealed(withTable.ep, 'audience'));
    expect(text).toContain(cap(banish));
    // Both doors, because the opening card counts how the room got this small
    // and this show is the only one where that question has two answers.
    expect(text).toContain(cap(murder));
  });
});

// ── GUARD 6: reachable from a played season ───────────────────────────
describe('the endgame is reachable from a played season', () => {
  it('the last row of every season registers it, and no other row does', () => {
    let reached = 0, refused = 0;
    for (const r of END_RUNS.slice(0, 8)) {
      for (let i = 0; i < r.episodes.length; i++) {
        const ep = r.episodes[i];
        const hit = buildVPScreens(ep).find(x => x.id === 'tr-endgame');
        if (i === r.episodes.length - 1) {
          expect(hit, `ep ${ep.num}: the endgame is not reachable`).toBeTruthy();
          expect(hit.label).toBe('The Endgame');
          expect(strip(hit.html).length, 'the endgame rendered nothing')
            .toBeGreaterThan(400);
          reached++;
        } else {
          expect(hit, `ep ${ep.num}: an endgame screen on a night in the middle`)
            .toBeFalsy();
          refused++;
        }
      }
    }
    expect(reached).toBe(8);
    expect(refused, 'every season was one episode long').toBeGreaterThan(40);
  });

  it('and it is the last screen of the last episode', () => {
    const r = END_RUNS[0];
    const ids = buildVPScreens(r.episodes[r.episodes.length - 1]).map(x => x.id);
    expect(ids[ids.length - 1], 'the endgame is not the end of the episode')
      .toBe('tr-endgame');
  });
});

// ── GUARD 6b: THE ROOM DOES NOT STOP EXISTING ────────────────────────
//
// This one is here because the defect SHIPPED and was caught by a human
// looking at it: "the endgame background is really black and empty". Cold is
// not the same as empty, and the first version made the mistake in the most
// literal way available -- the drawn planes ran 1500px, the ground under them
// was flat near-black, and every phase rule replaced the shell's background
// outright. A page of five thousand pixels therefore had no room in it below
// the first screenful, and stopped reading as the end of something and
// started reading as nothing having rendered.
//
// The absence at the endgame belongs to what is WITHHELD -- no alignment, a
// departure that ends in silence -- and that is guarded above. The PLACE is
// guarded here, and it is guarded by measurement rather than by looking,
// because the next person to make this mistake will not be looking.
describe('the endgame is a room and not a hole', () => {
  const cssOf = html => /<style>([\s\S]*?)<\/style>/.exec(String(html))[1];
  /** Every `.lt-shell[data-phase=...]{...}` block, selector ending at the shell. */
  const phaseBlocks = css => {
    const out = [];
    const re = /\.lt-shell\[data-phase="([a-z]+)"\]\s*\{([^}]*)\}/g;
    let m;
    while ((m = re.exec(css))) out.push({ phase: m[1], body: m[2] });
    return out;
  };

  it('the block reader finds the shell rules and not the ones nested under them', () => {
    // Positive and negative, because the arm below is a negative assertion
    // over whatever this returns: a reader that matched nothing would pass it
    // for free, and one that matched the descendant rules would fail honest
    // code.
    const css = '.lt-shell[data-phase="ask"]{--lt-ground:#121924}'
      + '.lt-shell[data-phase="money"] .lt-wash{background:red}';
    const blocks = phaseBlocks(css);
    expect(blocks.map(b => b.phase)).toEqual(['ask']);
    expect(blocks[0].body).toContain('--lt-ground');
  });

  it('the ground is painted under the whole page, at every phase', () => {
    const html = rpBuildEndgame({ ...ENDINGS[0].ep, num: ++_trN }, 'audience');
    const css = cssOf(html);
    // the shell itself paints stone, and the phases move a variable rather
    // than replacing it
    expect(css).toMatch(/\.lt-shell\{[\s\S]*?--lt-ground:#[0-9a-f]{6}/);
    const blocks = phaseBlocks(css);
    expect(blocks.length, 'the screen has no phase atmosphere at all')
      .toBeGreaterThan(4);
    for (const b of blocks) {
      expect(/\bbackground\s*:/.test(b.body),
        `the "${b.phase}" phase sets the background outright, which throws away `
        + 'the stone under the whole page — move --lt-ground instead')
        .toBe(false);
    }
  });

  it('and every ground it moves to is lit, not black', () => {
    // MEASURED. "Cold" is a hue; "empty" is a luminance, and the difference is
    // the entire note this guard exists for. The brightest channel of every
    // ground the screen can reach has to clear a floor no near-black clears:
    // the shipped values run 28-37, and the version that was rejected was
    // #05070a, whose brightest channel is 10.
    const css = cssOf(rpBuildEndgame({ ...ENDINGS[0].ep, num: ++_trN }, 'audience'));
    const grounds = (css.match(/--lt-ground:#[0-9a-f]{6}/g) || [])
      .map(s => s.slice(-6));
    expect(grounds.length, 'no ground colour is declared anywhere').toBeGreaterThan(4);
    for (const g of grounds) {
      const top = Math.max(parseInt(g.slice(0, 2), 16), parseInt(g.slice(2, 4), 16),
        parseInt(g.slice(4, 6), 16));
      expect(top, `#${g} is a hole rather than a cold room`).toBeGreaterThanOrEqual(24);
    }
  });

  it('the wall and the air run the full height, not the height of the drawing', () => {
    // The planes are finite by nature -- a drawn room is 2600px and an endgame
    // with six asks is twice that -- so the two layers that have to cover
    // whatever the page turns out to be are declared against `bottom` and not
    // against a height.
    const html = rpBuildEndgame({ ...ENDINGS[0].ep, num: ++_trN }, 'audience');
    const css = cssOf(html);
    expect(html, 'the wall is not in the markup').toContain('<div class="lt-stone">');
    expect(html, 'the air is not in the markup').toContain('<div class="lt-air">');
    expect(css).toMatch(/\.lt-stone\{[^}]*bottom:0/);
    expect(css).toMatch(/\.lt-air[^{]*\{[^}]*bottom:0/);
    const motes = (html.match(/class="lt-mote"/g) || []).length;
    expect(motes, 'the air is empty').toBeGreaterThan(20);
  });

  it('and the fire has run down rather than gone out — there is one ember', () => {
    // The set is lit by flame on every other screen. This screen is what is
    // left of that fire, which is far colder than blackness and is the only
    // warm thing on it until the strongbox opens.
    const html = rpBuildEndgame({ ...ENDINGS[0].ep, num: ++_trN }, 'audience');
    // EVERY ONE OF THEM, NOT "AT LEAST ONE". The hearth carries two coals and
    // a first version of this arm only asked whether the string appeared
    // anywhere -- so putting one of the two out changed nothing and the
    // mutation came back green. Redundancy hiding a dead guard, and this plan
    // has now shipped it five times.
    const embers = (String(html)
      .match(/class="lt-ember" [^>]*fill="#([0-9a-f]{6})"/g) || [])
      .map(s => /fill="#([0-9a-f]{6})"/.exec(s)[1]);
    expect(embers.length, 'the hearth has gone cold').toBeGreaterThanOrEqual(2);
    for (const c of embers) {
      const r = parseInt(c.slice(0, 2), 16), b = parseInt(c.slice(4, 6), 16);
      expect(r - b, `#${c} is not a live coal`).toBeGreaterThan(64);
    }
    expect(cssOf(html)).toMatch(/@keyframes lt-ember\{/);
    // and the pot is physically in the room, not only on a card
    expect(html, 'the strongbox is not in the room').toContain('id="ltEmber"');
  });
});

// ── GUARD 7: the reveal contract, and a screen that is not blank ──────
describe('the endgame honours the reveal pattern', () => {
  it('step divs, counter and controls are all addressable by id', () => {
    const html = rpBuildEndgame({ ...ENDINGS[0].ep, num: ++_trN }, 'audience');
    const m = /trEndgameRevealAll\('endgame',(\d+),(\d+)\)/.exec(html);
    expect(m, 'no reveal handler was emitted').toBeTruthy();
    const total = Number(m[1]);
    expect(total, 'the endgame dealt fewer than four cards').toBeGreaterThan(3);
    for (let i = 0; i < total; i++) {
      expect(html, `step ${i} has no id`).toContain('id="lt-step-endgame-' + i + '"');
    }
    expect(html).toContain('id="lt-counter-endgame"');
    expect(html).toContain('id="lt-controls-endgame"');
    expect(html).toContain('id="lt-shell-endgame"');
    // the sticky stage the handlers replace by id
    expect(html).toContain('id="lt-stage-inner"');
  });

  it('a screen opened and never clicked is not blank', () => {
    // The conclave shipped exactly this defect: it emitted bare beats and
    // relied on `_reapplyVisibility` firing from a click, so the screen was
    // empty until the viewer pressed something. Visibility is baked in from
    // `st.idx` at emit time instead.
    const html = rpBuildEndgame({ ...ENDINGS[0].ep, num: ++_trN }, 'audience');
    const visible = (html.match(/class="lt-beat lt-vis"/g) || []).length;
    expect(visible, 'the endgame opened on nothing at all').toBeGreaterThan(0);
    expect(strip(html)).toContain('The Room At The End');
  });

  it('and the stage does not spoil what has not been dealt', () => {
    // The chairs are the sidebar on this screen and they are gated by
    // `_tvState`: at first paint every slip in the room is folded, whatever
    // is written on it and whoever is reading.
    const html = rpBuildEndgame({ ...ENDINGS[0].ep, num: ++_trN }, 'audience');
    const stage = /<div class="lt-stage" id="lt-stage-inner">([\s\S]*?)<\/div><main/.exec(html);
    expect(stage, 'the stage is not where the handlers look for it').toBeTruthy();
    expect(stage[1]).toContain('data-state="sealed"');
    expect(stage[1], 'a chair had already been read at first paint')
      .not.toContain('data-state="banish"');
    // and it does not print how many times the question is going to be asked,
    // which would say at first paint that the early ones were not unanimous
    const many = ENDINGS.find(e => e.ep.tr.endgame.asks.length > 1);
    expect(many, 'no endgame in the sample was asked twice').toBeTruthy();
    const h2 = rpBuildEndgame({ ...many.ep, num: ++_trN }, 'audience');
    const st2 = /<div class="lt-stage" id="lt-stage-inner">([\s\S]*?)<\/div><main/.exec(h2);
    expect(strip(st2[1]), 'the stage announced how many asks there would be')
      .not.toContain('of ' + many.ep.tr.endgame.asks.length);
  });
});

// ── GUARD 8: the sticky stage survives the shell clip ─────────────────
describe('the endgame\'s sticky stage is not killed by the shell clip', () => {
  it('the clip is on the scenery layer and the sticky element is inside it', () => {
    // Measured on the conclave and true of every screen since: a shell that
    // clips is a scroll container and kills `position:sticky` for every
    // descendant. The clip lives on a dedicated scenery layer that takes no
    // z-index, and the stage is the element the handlers replace by id.
    const html = rpBuildEndgame({ ...ENDINGS[0].ep, num: ++_trN }, 'audience');
    const css = /<style>([\s\S]*?)<\/style>/.exec(html)[1];
    expect(css).toMatch(/\.lt-shell\{[^}]*overflow:visible/);
    expect(css).toMatch(/\.lt-scenery\{[^}]*overflow:hidden/);
    expect(/\.lt-scenery\{[^}]*z-index/.test(css),
      'the scenery layer took a z-index and became a stacking context').toBe(false);
    expect(css).toMatch(/\.lt-stage\{position:sticky;top:46px/);
  });

  it('and the room does not borrow the turret\'s lamp', () => {
    // `_portrait()` is neutral and `.cv-lit` is the conclave's treatment. This
    // room has no flame in it at all, which is the whole of its atmosphere.
    const html = rpBuildEndgame({ ...ENDINGS[0].ep, num: ++_trN }, 'audience');
    expect(html, 'the endgame lit its portraits with the turret\'s lamp')
      .not.toContain('cv-lit');
    const css = /<style>([\s\S]*?)<\/style>/.exec(html)[1];
    expect(css.includes('@media(prefers-reduced-motion:reduce)'),
      'the endgame has animations and no reduced-motion fallback').toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════
// THE TEXT BACKLOG (Plan 8, Task 6)
// ══════════════════════════════════════════════════════════════════════
//
// A transcript is nothing but prose, so most of what is wrong with one is
// found by dumping a season and reading it — and that is how every prose
// defect in eight plans was found, and none by an assertion. What is left
// over, and what these guards are for, is the handful of things about a
// transcript that are invisible on the page in front of you:
//
//   1. A SCREEN THAT IS SIMPLY NOT IN IT. A backlog missing the afternoon
//      reads perfectly well; you have to know what should have been there.
//      So this asserts per-screen coverage against the screens a played
//      season actually produced, never a total length — a length passes with
//      a whole screen missing.
//   2. ANOTHER SHOW'S VOCABULARY, which is this project's central bug class
//      and which reads as ordinary English.
//   3. THE OBSERVER CONTRACT. An audience backlog may hold the conclave; a
//      Faithful's may not. It is the same secret the screens protect, and a
//      transcript that leaks it is worse than a screen that does, because
//      text is searchable.
//   4. THE TRANSCRIPT CHANGING THE SCREEN. Reveal state is module-level and
//      keyed by episode; generating a transcript must not hand the next
//      reader a screen with its ending already on it.

/**
 * The screens as the VIEWER finally sees them — every beat revealed, on a
 * fresh reveal key, through the builders directly.
 *
 * DELIBERATELY NOT `traitorsScreensRevealed`. Comparing the transcript to the
 * function the transcript is built from proves that a function equals itself.
 * This walks the same list by hand, on a positive episode key of its own, so
 * the two paths can disagree — and if the words a screen chooses ever depend
 * on the row's key rather than on the record, they will.
 */
function viewerScreens(ep, observer = 'audience') {
  const fresh = { ...ep, num: ++_trN };
  return TRAITORS_SCREENS.filter(s => s.when(fresh)).map(s => {
    const first = s.build(fresh, observer);
    const m = new RegExp(s.revealAllName + "\\('" + s.suffix + "',(\\d+),(-?\\d+)\\)")
      .exec(first);
    if (!m) return { id: s.id, label: s.label, html: first };
    s.revealAll(s.suffix, Number(m[1]), Number(m[2]));
    return { id: s.id, label: s.label, html: s.build(fresh, observer) };
  });
}

/** One section of a transcript, as its lines, by the heading it sits under. */
function backlogSection(text, label) {
  const lines = String(text).split('\n');
  const head = lines.indexOf(`=== ${label.toUpperCase()} ===`);
  if (head < 0) return null;
  const out = [];
  for (let i = head + 1; i < lines.length; i++) {
    if (/^=== /.test(lines[i])) break;
    if (lines[i].trim()) out.push(lines[i].trim());
  }
  return out;
}

// Every played row across both seed sets, so the endgame is in the sample as
// well as the nights. Counted before anything is asserted about it.
const BACKLOG_ROWS = [...RUNS, ...END_RUNS].flatMap(r => r.episodes);

// ── THE SUBTRACTIVE HELPERS, ASSERTED ─────────────────────────────────
//
// Both guards below read what comes OUT of these two, and both have negative
// arms. A stripper that ate too much would make every one of them pass for
// free — the matcher-never-matches trap running backwards, which this plan
// has already shipped once.
describe('the transcript helpers take out the furniture and leave the words', () => {
  it('screenNarration drops the initials glyph and the reveal controls, and nothing else', () => {
    const html = '<span class="cv-av" style="width:54px"><span class="cv-av-ini" '
      + 'style="font-size:18px">B</span><img src="assets/avatars/brick.png" alt=""></span>'
      + '<div class="nt-who-nm">Brick</div><p>Chase refused it.</p>'
      + '<div class="cv-controls" id="cv-controls-conclave">'
      + '<button class="cv-btn" onclick="trConclaveRevealNext(\'conclave\',7,3)">Continue</button>'
      + '<span class="cv-counter" id="cv-counter-conclave">1 / 7</span>'
      + '<button class="cv-btn">Reveal all</button></div>';
    const kept = screenNarration(html);
    expect(kept, 'the initials glyph survived').not.toContain('cv-av-ini');
    expect(kept, 'the reveal controls survived').not.toContain('cv-controls');
    expect(kept, 'the counter survived').not.toContain('1 / 7');
    expect(kept, 'the name was eaten with the glyph').toContain('Brick');
    expect(kept, 'the narration was eaten').toContain('Chase refused it.');
    // and the picture itself is still there — only the fallback glyph goes
    expect(kept).toContain('assets/avatars/brick.png');
  });

  it('_vpTextLines keeps every sentence, decodes the entities and drops the stylesheet', () => {
    const lines = _vpTextLines(
      '<style>.x{content:"THIS IS NOT NARRATION"}</style>'
      + '<div><p>&ldquo;Come in.&rdquo;</p><p>The fund is &pound;4,288 &middot; 4%</p></div>'
      + '<span>Standing</span><span>19</span>');
    expect(lines.length, 'the stripper returned nothing at all').toBeGreaterThan(2);
    expect(lines.join('\n')).not.toContain('THIS IS NOT NARRATION');
    expect(lines).toContain('"Come in."');
    expect(lines).toContain('The fund is £4,288 · 4%');
    // Two adjacent inline elements are two things said, not one word.
    expect(lines).toContain('Standing 19');
  });
});

// ── GUARD: EVERY SCREEN'S NARRATION IS IN IT ──────────────────────────
describe('the transcript retranscribes every screen the night produced', () => {
  it('a played season produces screens at all, and every kind of them', () => {
    // A coverage assertion over an empty list is the vacuous shape this plan
    // keeps finding, so the sample is counted first and every screen kind has
    // to be in it or the arms below cannot see that kind at all.
    expect(BACKLOG_ROWS.length, 'no season was played').toBeGreaterThan(20);
    const kinds = new Set();
    for (const ep of BACKLOG_ROWS) {
      for (const s of TRAITORS_SCREENS) if (s.when(ep)) kinds.add(s.id);
    }
    expect([...kinds].sort(), 'a screen kind never appeared in the sample')
      .toEqual(TRAITORS_SCREENS.map(s => s.id).sort());
  });

  it('every screen appears under its own heading, word for word', () => {
    let sections = 0;
    for (const ep of BACKLOG_ROWS) {
      const text = generateTraitorsSummaryText(ep, 'audience');
      const screens = viewerScreens(ep, 'audience');
      expect(screens.length, `ep ${ep.num}: a played row produced no screen at all`)
        .toBeGreaterThan(0);
      for (const scr of screens) {
        const body = backlogSection(text, scr.label);
        expect(body, `ep ${ep.num}: "${scr.label}" is not in the transcript`).toBeTruthy();
        const said = _vpTextLines(screenNarration(scr.html));
        expect(said.length, `ep ${ep.num}: ${scr.label} said nothing`).toBeGreaterThan(3);
        // EVERY LINE, not a sample and not a total: a transcript that drops
        // the middle of a screen has the right heading and the right length.
        for (const line of said) {
          expect(body, `ep ${ep.num}: ${scr.label} says "${line}" and the transcript does not`)
            .toContain(line);
        }
        sections++;
      }
    }
    expect(sections, 'no section was checked').toBeGreaterThan(60);
  });

  it('and the row itself is named, with both of the show\'s doors', () => {
    const [banish, murder] = exitVerbs('traitors');
    let banishings = 0; let murders = 0;
    for (const ep of BACKLOG_ROWS) {
      // THE FOOT, and specifically not the whole transcript: a name that
      // appears on the roll and at the table is in this text a dozen times,
      // so an assertion over the lot of it is satisfied by the wrong section.
      const foot = (backlogSection(generateTraitorsSummaryText(ep, 'audience'),
        'Ruled Off') || []).join(' | ');
      for (const x of (ep.exits || [])) {
        expect(foot, `ep ${ep.num}: ${x.name} left and the transcript does not say so`)
          .toContain(`${x.name} — ${x.verb}`);
        if (x.verb === banish) banishings++;
        if (x.verb === murder) murders++;
      }
    }
    // Both doors are used, or the arm above only ever checked one of them.
    expect(banishings, 'no season banished anybody').toBeGreaterThan(10);
    expect(murders, 'no season murdered anybody').toBeGreaterThan(10);
  });
});

// ── GUARD: NO OTHER SHOW'S WORDS ──────────────────────────────────────
describe("the transcript may not be written in another show's words", () => {
  it('nothing in a season of transcripts belongs to another show', () => {
    // The list and the matcher are asserted where they are first used, at the
    // top of this file: `forbiddenFor('traitors')` is 20-odd words long and
    // `foreignWordsIn` fires on "tribal council".
    let checked = 0;
    for (const ep of BACKLOG_ROWS) {
      const leaks = foreignWordsIn(generateTraitorsSummaryText(ep, 'audience'), 'traitors');
      expect(leaks, `ep ${ep.num}: the transcript printed another show's vocabulary`)
        .toEqual([]);
      checked++;
    }
    expect(checked).toBe(BACKLOG_ROWS.length);
  });

  it('and neither does a player\'s copy of one, which is different prose', () => {
    let checked = 0;
    for (const ep of BACKLOG_ROWS.slice(0, 12)) {
      const who = (ep.tr.living || [])[0];
      if (!who) continue;
      expect(foreignWordsIn(generateTraitorsSummaryText(ep, `player:${who}`), 'traitors'),
        `ep ${ep.num}`).toEqual([]);
      checked++;
    }
    expect(checked, 'no player transcript was checked').toBeGreaterThan(8);
  });
});

// ── GUARD: THE OBSERVER CONTRACT, IN TEXT ─────────────────────────────
describe('a transcript is written for its reader, and the conclave is not for everybody', () => {
  it('the audience transcript holds the conclave', () => {
    let checked = 0;
    for (const { ep } of NIGHTS.slice(0, 10)) {
      const text = generateTraitorsSummaryText(ep, 'audience');
      expect(text, `ep ${ep.num}: the audience transcript lost the turret`)
        .toContain('=== THE CONCLAVE ===');
      // READ OUT OF THE CONCLAVE'S OWN SECTION. The chosen name is at the
      // table that evening and on the roll in the day book, so a search of
      // the WHOLE transcript for it is satisfied by the wrong section and
      // passes with the turret withheld -- which is precisely what it did.
      const body = (backlogSection(text, 'The Conclave') || []).join('\n');
      expect(mentions(body, ep.tr.conclave.target),
        `ep ${ep.num}: the chosen name is not in the audience conclave`).toBe(true);
      for (const b of ep.tr.conclave.ballots) {
        expect(mentions(body, b.voter),
          `ep ${ep.num}: ${b.voter} argued and the audience conclave does not say so`)
          .toBe(true);
      }
      checked++;
    }
    expect(checked, 'no night was checked').toBeGreaterThan(8);
  });

  it('a Faithful\'s transcript holds no ballot, no name and no arguer', () => {
    let checked = 0;
    for (const { ep } of NIGHTS) {
      const c = ep.tr.conclave;
      // Not somebody on a ballot and not the chosen name: the withheld render
      // prints the OBSERVER'S OWN name, and their own name is not news to them.
      const onBallot = new Set(c.ballots.flatMap(b => [b.voter, b.voted]).filter(Boolean));
      const outsider = (ep.tr.living || [])
        .find(n => !c.turret.includes(n) && !onBallot.has(n) && n !== c.target);
      if (!outsider) continue;
      // THE MORNING TELLS THEM WHO DIED, and it is entitled to: a body at
      // breakfast is the most public fact this format has. What must not be in
      // this transcript is who chose it, who argued for whom, and who was in
      // the room — so the conclave's own section is what is read here, and the
      // rest of the night is left alone.
      const text = generateTraitorsSummaryText(ep, `player:${outsider}`);
      const body = (backlogSection(text, 'The Conclave') || []).join('\n');
      expect(body, `ep ${ep.num}: a Faithful got no conclave section at all`).toBeTruthy();
      for (const b of c.ballots) {
        expect(mentions(body, b.voter),
          `ep ${ep.num}: ${b.voter} argued in a Faithful's transcript`).toBe(false);
        expect(mentions(body, b.voted),
          `ep ${ep.num}: ${b.voted} was named in a Faithful's transcript`).toBe(false);
      }
      expect(mentions(body, c.target),
        `ep ${ep.num}: the chosen name reached a Faithful's transcript`).toBe(false);
      for (const t of c.turret) {
        expect(mentions(body, t),
          `ep ${ep.num}: ${t} was placed in the turret in a Faithful's transcript`).toBe(false);
      }
      checked++;
    }
    expect(checked, 'no night had anybody outside the turret to check').toBeGreaterThan(10);
  });

  it('and every other screen in it is that player\'s screen too', () => {
    // The turret is not the only thing a screen withholds -- a relic names its
    // holder only to somebody who watched it be found, and an offer is between
    // two people. A transcript that threads the observer into the FIRST build
    // of each screen and then rebuilds with 'audience' comes back withheld
    // wherever the withheld render has no reveal controls (the conclave) and
    // WIDE OPEN everywhere else, which is a leak with no symptom.
    let differ = 0; let checked = 0;
    for (const ep of BACKLOG_ROWS.slice(0, 14)) {
      const who = (ep.tr.living || [])[0];
      if (!who) continue;
      const obs = `player:${who}`;
      const text = generateTraitorsSummaryText(ep, obs);
      const mine = viewerScreens(ep, obs);
      const theirs = viewerScreens(ep, 'audience');
      expect(mine.length, `ep ${ep.num}: no screens`).toBeGreaterThan(0);
      for (let i = 0; i < mine.length; i++) {
        const said = _vpTextLines(screenNarration(mine[i].html));
        const body = backlogSection(text, mine[i].label);
        expect(body, `ep ${ep.num}: "${mine[i].label}" is not in ${who}'s transcript`)
          .toBeTruthy();
        for (const line of said) {
          expect(body,
            `ep ${ep.num}: ${who}'s ${mine[i].label} says "${line}" and their transcript does not`)
            .toContain(line);
        }
        // and it is not simply the audience's copy with a name on it
        const audience = _vpTextLines(screenNarration(theirs[i].html)).join('\n');
        if (audience !== said.join('\n')) {
          differ++;
          for (const line of _vpTextLines(screenNarration(theirs[i].html))) {
            if (said.indexOf(line) < 0) {
              expect(body,
                `ep ${ep.num}: ${who} was told "${line}", which is not on their screen`)
                .not.toContain(line);
            }
          }
        }
        checked++;
      }
    }
    expect(checked, 'no screen was checked').toBeGreaterThan(30);
    // THE ARM ABOVE IS ONLY WORTH ANYTHING IF THE TWO LAYERS EVER DIFFER.
    expect(differ, 'no screen rendered differently for a player than for the audience')
      .toBeGreaterThan(5);
  });
});

// ── GUARD: THE TRANSCRIPT DOES NOT TOUCH THE SCREEN ───────────────────
describe('writing the transcript does not reveal the screen', () => {
  it('a screen opened after a transcript is written still opens on its first beat', () => {
    // Reveal state is module-level and keyed by episode number. Generating a
    // transcript reveals every beat of every screen — on a key of its own, or
    // the next reader opens the conclave with the name already on it and the
    // click-to-reveal the whole visual player is built on is gone.
    let checked = 0;
    for (const { ep } of NIGHTS.slice(0, 6)) {
      const fresh = { ...ep, num: ++_trN };
      // WHAT IS COMPARED IS THE REVEAL STATE, and not the markup around it:
      // every gradient these icons draw takes an id off a counter that only
      // goes up, so two builds of one screen are never byte-identical and
      // never were. The signature is which beats carry the visible class and
      // what the counter under them says, which is exactly the state a
      // transcript must not have moved.
      const sig = h => (String(h).match(/class="cv-beat( cv-vis)?"/g) || []).join('|')
        + ' :: ' + (/<span class="cv-counter"[^>]*>([^<]*)</.exec(String(h)) || [])[1];
      const before = sig(rpBuildConclave(fresh, 'audience'));
      generateTraitorsSummaryText(fresh, 'audience');
      const after = sig(rpBuildConclave(fresh, 'audience'));
      expect(after, `ep ${ep.num}: the transcript revealed the viewer's screen`)
        .toBe(before);
      // and it really was unrevealed to begin with, or the arm above is
      // comparing two finished screens and cannot fail
      const vis = (before.match(/cv-beat cv-vis/g) || []).length;
      const all = (before.match(/class="cv-beat/g) || []).length;
      expect(all, `ep ${ep.num}: the screen has no beats`).toBeGreaterThan(3);
      expect(vis, `ep ${ep.num}: a first paint showed ${vis} of ${all} beats`).toBe(1);
      expect(before, `ep ${ep.num}: the counter is not in the signature`)
        .toMatch(/:: 1 \/ \d+$/);
      checked++;
    }
    expect(checked, 'no night was checked').toBeGreaterThan(4);
  });

  it('and a renumbered copy of a row says exactly the same words', () => {
    // The transcript renders a RENUMBERED copy to get its own reveal key, so
    // anything that chooses a sentence off `num` rather than off the record
    // would make the transcript quote a host line the screen never spoke.
    let checked = 0;
    for (const ep of BACKLOG_ROWS.slice(0, 10)) {
      const a = viewerScreens(ep, 'audience');
      const b = viewerScreens({ ...ep, num: 90000 + (ep.num || 0) }, 'audience');
      expect(a.length, `ep ${ep.num}: no screens`).toBeGreaterThan(0);
      expect(b.length).toBe(a.length);
      for (let i = 0; i < a.length; i++) {
        expect(_vpTextLines(screenNarration(b[i].html)).join('\n'),
          `ep ${ep.num}: ${a[i].label} says something different when the row is renumbered`)
          .toBe(_vpTextLines(screenNarration(a[i].html)).join('\n'));
        checked++;
      }
    }
    expect(checked, 'no screen was compared').toBeGreaterThan(20);
  });
});

// ── GUARD: THE TRANSCRIPT IS REACHABLE ────────────────────────────────
describe('the castle transcript is what a Traitors row actually gets', () => {
  it('generateSummaryText hands a castle row to the castle writer', () => {
    // A written-and-unreachable transcript is this project's signature bug,
    // and the failure here is silent and total: a castle row falling through
    // to Total Drama's writer comes back with tribes and a Tribal Council in
    // it, which is the bug class this whole show was built to avoid.
    let checked = 0;
    for (const ep of BACKLOG_ROWS.slice(0, 8)) {
      const text = generateSummaryText(ep);
      expect(text, `ep ${ep.num}: the row did not reach the castle writer`)
        .toContain(`THE TRAITORS — EPISODE ${ep.tr.ep}`);
      expect(text).toBe(generateTraitorsSummaryText(ep, 'audience'));
      expect(foreignWordsIn(text, 'traitors'), `ep ${ep.num}`).toEqual([]);
      checked++;
    }
    expect(checked).toBe(8);
  });
});

// ══════════════════════════════════════════════════════════════════════
// tr-arrival.test.js — the premiere: who walked in, and what they were told
// ══════════════════════════════════════════════════════════════════════
//
// Episode one is the only night of the season that has to introduce anybody.
// Two things about it are invisible by looking at the screen and are guarded
// here:
//
//   1. EVERY NAME IS SAID ONCE, BEFORE ANY OF THEM IS ANYTHING. A premiere
//      that opens on the blindfolds has a cast the viewer has never met, and
//      the format's whole product — watching a room fail to work something
//      out — needs the room to be people first.
//   2. THE RULES ARE PERFORMED, NOT SUMMARISED. "The host explains the game"
//      is production notes. The saved record has to carry the sentences, or
//      the transcript and the screen have nothing to retranscribe.
//
// AND THE CEREMONY CONTRACT: a first-use ceremony stores its host speech, its
// staging, its rule points and its reveal steps SEPARATELY, the speech comes
// before the action it governs, and the three Selection observer layers get
// only what each of them was physically given.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { gs, setPlayers, seasonConfig } from '../js/core.js';
import { playTraitorsSeason, buildArrivalRecord } from '../js/tr/headless.js';
import { snapshotTraitorsBackgrounds } from '../js/tr/state.js';
import { setAlumniDatabase } from '../js/alumni.js';
import { SHOWS } from '../js/shows.js';
import { traitorsScreens, screenNarration } from '../js/vp-tr/screens.js';
import { foreignWordsIn } from './helpers/show-vocabulary.js';
import roster from '../franchise_roster.json';

const ROSTER = roster.players.slice(0, 20);
const CAST = ROSTER.map(p => p.name);

function season(seed) {
  setPlayers(ROSTER);
  const s = playTraitorsSeason({ cast: CAST, traitorCount: 3, seed });
  return { season: s, episodes: (gs.episodeHistory || []).map(e => ({ ...e })) };
}
const RUNS = [1, 3, 7].map(season);
const firstEpisode = RUNS[0].episodes[0];

const strip = html => String(html || '')
  .replace(/<style[\s\S]*?<\/style>/gi, ' ')
  .replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

/**
 * Does this text name this player? WORD-BOUNDED, because this roster contains
 * a player called "B" and a substring test for that name matches every
 * sentence in the language — a guard nobody can satisfy is a guard nobody
 * keeps, and this file's negative arms are the ones that need it.
 *
 * Built by concatenation, so the boundary must be written as an ESCAPED
 * backslash. A bare one inside a string literal is U+0008 and the regex then
 * matches nothing whatever, which is a negative guard that passes for free,
 * forever. tests/tr-vp.test.js shipped exactly that defect once, and the
 * matcher below is asserted before anything uses it for the same reason.
 */
function mentionsIn(text, name) {
  if (!name) return false;
  const safe = String(name).replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
  return new RegExp('\\b' + safe + '\\b').test(String(text || ''));
}

// THE MATCHER ITSELF, ASSERTED, because every use of it below is negative.
describe('the name matcher works at all', () => {
  it('finds a name that is present and not one that is absent', () => {
    expect(mentionsIn('Gabby asked Julia a question.', 'Gabby')).toBe(true);
    expect(mentionsIn('Gabby asked Julia a question.', 'Manu')).toBe(false);
    expect(mentionsIn('Beardo said nothing.', 'B')).toBe(false);
    expect(mentionsIn('B said nothing.', 'B')).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════
// THE TWO ARMS THE BRIEF SPECIFIES
// ══════════════════════════════════════════════════════════════════════

describe('the premiere introduces the castle before it divides it', () => {
  it('introduces every contestant before the Selection', () => {
    const screens = traitorsScreens(firstEpisode, 'audience');
    expect(screens.map(s => s.id).slice(0, 2)).toEqual(['tr-arrival', 'tr-selection']);
    const prose = screenNarration(screens[0].html);
    for (const name of firstEpisode.tr.cast) expect(prose).toContain(name);
    for (const phrase of ['Faithful', 'Traitor', 'murder', 'mission', 'prize pot', 'shield', 'Round Table', 'banishment']) {
      expect(prose.toLowerCase()).toContain(phrase.toLowerCase());
    }
  });

  it('stages the complete Selection before revealing a role', () => {
    const selection = firstEpisode.tr.selection;
    expect(selection.hostBeats.length).toBeGreaterThanOrEqual(8);
    for (const rule of ['tap-means-traitor','traitors-murder','faithfuls-banish','do-not-react']) {
      expect(selection.rulePoints.some(point => point.id === rule && Number.isInteger(point.explainedByBeat))).toBe(true);
    }
    expect(selection.hostBeats.findIndex(beat => /feel my .*shoulder/i.test(beat.text)))
      .toBeLessThan(selection.revealBeats.findIndex(beat => beat.kind === 'tap'));
    expect(selection.reminder.length).toBeLessThan(selection.hostBeats.map(beat => beat.text).join(' ').length);
  });
});

// ══════════════════════════════════════════════════════════════════════
// THE RECORD ITSELF — what a premiere is allowed to claim
// ══════════════════════════════════════════════════════════════════════
//
// The screen arms live in tests/tr-vp.test.js with the rest of the castle's
// screens. What belongs HERE is the record: an introduction may quote a past
// the franchise recorded and may invent nothing whatsoever, and a ceremony is
// a performance rather than a summary of one.

// A two-show database with a shared season on it, so the one recognition that
// has a real basis — two people who played the same season — is reachable.
// NOBODY here is flagged as returning: on this format nobody is.
const DB = [
  { name: 'Julia', occupation: 'Influencer', archetype: 'schemer',
    seasonDetails: [{ format: 'total-drama', season: 2, placement: 4 }] },
  { name: 'Gabby', occupation: 'Paramedic', archetype: 'hero',
    seasonDetails: [{ format: 'total-drama', season: 2, placement: 9 }] },
  { name: 'Ireland', occupation: 'Chef', archetype: 'mastermind',
    seasonDetails: [{ format: 'big-brother', season: 1, placement: 2, status: 'Runner-up' }] },
];
const MIXED = ['Julia', 'Gabby', 'Ireland', 'Manu', 'Fiore', 'Alec'];

function mixedArrival() {
  const bg = snapshotTraitorsBackgrounds(
    MIXED.map(n => (n === 'Fiore' ? { name: n, backgroundType: 'celebrity' } : { name: n })),
    DB);
  return { bg, rec: buildArrivalRecord(MIXED, bg, 'Valeria') };
}

describe('an introduction quotes the record and invents nothing', () => {
  it('gives every arrival exactly one entry, in the order the cars came up', () => {
    const { rec } = mixedArrival();
    expect(rec.introductions.map(i => i.name)).toEqual(MIXED);
    // Every car holds somebody and everybody is in exactly one car.
    const inCars = rec.groups.flatMap(g => g.arrivals);
    expect(inCars).toEqual(MIXED);
    for (const g of rec.groups) {
      expect(g.arrivals.length, 'an empty car came up the drive').toBeGreaterThan(0);
      expect(g.text.length, `${g.id} arrived with nothing said about it`).toBeGreaterThan(40);
    }
  });

  it('names the show from the registry and never as a literal', () => {
    const { rec } = mixedArrival();
    const julia = rec.introductions.find(i => i.name === 'Julia');
    expect(julia.type).toBe('alumni');
    expect(julia.sourceShows).toEqual(['total-drama']);
    const said = julia.lines.map(l => l.text).join(' ');
    expect(said).toContain(`${SHOWS['total-drama'].name} 2`);
    // AND THE LITERAL IS NOT IN THE SOURCE. A season label typed into the
    // engine is a label a registry rename cannot reach — docs/ADDING-A-SHOW.md
    // §13 is a list of the eight files that learned this the hard way.
    for (const f of ['js/tr/headless.js', 'js/vp-tr/arrival.js']) {
      const src = readFileSync(new URL('../' + f, import.meta.url), 'utf8');
      for (const fmt of ['total-drama', 'big-brother']) {
        expect(src.indexOf(SHOWS[fmt].name),
          `${f} writes "${SHOWS[fmt].name}" as a literal`).toBe(-1);
      }
    }
  });

  it('gives a celebrity and a civilian no season, no finish and no franchise past', () => {
    const { rec } = mixedArrival();
    for (const name of ['Fiore', 'Manu', 'Alec']) {
      const it = rec.introductions.find(i => i.name === name);
      expect(it.appearances, `${name} was given a season nobody played`).toEqual([]);
      expect(it.sourceShows).toEqual([]);
      const said = it.lines.map(l => l.text).join(' ');
      expect(said, `${name}'s introduction claims a season`).not.toMatch(/season|placement/i);
      expect(said, `${name}'s introduction claims a finish`)
        .not.toMatch(/\b(finalist|runner-up|winner|\dth place)\b/i);
    }
    expect(rec.introductions.find(i => i.name === 'Fiore').type).toBe('celebrity');
    expect(rec.introductions.find(i => i.name === 'Manu').type).toBe('civilian');
  });

  it('recognises somebody only where the ledger gives a reason to', () => {
    const { rec } = mixedArrival();
    // Julia and Gabby are both recorded on the same season, which is the one
    // basis on this record that is a FACT rather than a mood.
    const shared = rec.recognitions.find(r => r.of === 'Gabby' && r.by === 'Julia');
    expect(shared, 'two players on the same recorded season did not recognise each other')
      .toBeTruthy();
    expect(shared.basis).toContain(`${SHOWS['total-drama'].name} 2`);
    expect(shared.text).toContain(`${SHOWS['total-drama'].name} 2`);
    // AND NOBODY IS RECOGNISED WITHOUT ONE. Every recognition on the record
    // has to name what makes it true, and its subject has to be somebody the
    // snapshot actually marked as recognised.
    for (const r of rec.recognitions) {
      expect(r.basis, `${r.by} recognises ${r.of} for no recorded reason`).toBeTruthy();
      expect(r.of).toBeTruthy();
      expect(r.by).toBeTruthy();
    }
    const civilians = rec.introductions.filter(i => i.type === 'civilian').map(i => i.name);
    expect(civilians.length, 'no civilian in this cast — this arm proves nothing')
      .toBeGreaterThan(1);
    for (const r of rec.recognitions) {
      expect(civilians, `${r.of} is a civilian and was recognised anyway`).not.toContain(r.of);
    }
  });

  it('reads the frozen snapshot and never the live database', () => {
    // THE REPLAY RULE, AND IT IS THE WHOLE REASON TASK 1 FROZE THESE. A
    // premiere rebuilt off the database rewrites itself every time somebody
    // corrects a placement three seasons later — so the builder is handed a
    // snapshot, and a snapshot that disagrees with the database must win.
    const frozen = snapshotTraitorsBackgrounds(['Julia'], DB);
    const rewritten = [{ name: 'Julia', occupation: 'Influencer',
      seasonDetails: [{ format: 'total-drama', season: 2, placement: 1, status: 'Winner' }] }];
    setAlumniDatabase(rewritten);
    try {
      const rec = buildArrivalRecord(['Julia', 'Manu'], frozen, null);
      const said = rec.introductions.find(i => i.name === 'Julia').lines
        .map(l => l.text).join(' ');
      expect(said, 'the premiere re-resolved and printed a placement the season never had')
        .not.toContain('Winner');
      expect(said).toContain('4th place');
    } finally {
      setAlumniDatabase([]);
    }
  });
});

describe('a first-use ceremony is performed, not summarised', () => {
  const rules = () => RUNS[0].episodes[0].tr.arrival.rules;

  it('says every rule of the format in a complete spoken line', () => {
    const r = rules();
    expect(r.staging.length, 'the briefing has no staging').toBeGreaterThan(60);
    for (const id of ['faithfuls-and-traitors', 'traitors-murder', 'missions-build-the-pot',
      'shield-blocks-a-murder', 'round-table-banishment', 'endgame-payout']) {
      const point = r.rulePoints.find(x => x.id === id);
      expect(point, `the briefing never explains ${id}`).toBeTruthy();
      const beat = r.hostBeats[point.explainedByBeat];
      expect(beat.ruleId).toBe(id);
      // A COMPLETE LINE AND NOT A LABEL. "The host explains the shield" is the
      // shortcut this whole contract exists to forbid, and it is about forty
      // characters long, so length is the cheapest way to catch it.
      expect(beat.text.length, `${id} is explained in a phrase, not a sentence`)
        .toBeGreaterThan(90);
      expect(beat.text.trim().slice(-1), `${id} is not a finished sentence`)
        .toMatch(/[.!?]/);
      expect(beat.action, `${id} is spoken by nobody standing anywhere`).toBeTruthy();
    }
  });

  it('describes nobody doing production work', () => {
    // The four sentences the contract names outright, plus the family they
    // belong to: a record that DESCRIBES the ceremony instead of performing it.
    const all = [rules(), RUNS[0].episodes[0].tr.selection];
    let scanned = 0;
    for (const c of all) {
      const flat = [...c.hostBeats.map(b => b.text), ...c.hostBeats.map(b => b.action),
        ...(c.contestantBeats || []).map(b => b.text)].join(' ');
      expect(flat.length).toBeGreaterThan(400);
      for (const bad of [/the host explains/i, /the traitors are chosen/i,
        /gives a dramatic speech/i, /explains how the .* works/i,
        /a dramatic speech about/i]) {
        expect(bad.test(flat), `a ceremony describes itself: ${bad}`).toBe(false);
      }
      scanned++;
    }
    expect(scanned).toBe(2);
  });

  it('keeps the reminder shorter than the ceremony it stands in for', () => {
    for (const c of [rules(), RUNS[0].episodes[0].tr.selection]) {
      const full = c.hostBeats.map(b => b.text).join(' ');
      expect(c.reminder.length, 'the reminder is not shorter than the first telling')
        .toBeLessThan(full.length);
      expect(c.reminder.length, 'the reminder says nothing at all').toBeGreaterThan(40);
    }
  });

  it('never states how many were chosen unless the season says the room is told', () => {
    setPlayers(ROSTER);
    const quiet = playTraitorsSeason({ cast: CAST, traitorCount: 3, seed: 5 });
    const quietSel = (gs.episodeHistory || [])[0].tr.selection;
    const quietSaid = quietSel.hostBeats.map(b => b.text).join(' ');
    expect(/there will be \d/i.test(quietSaid),
      'the host gave away the count with nothing configuring her to').toBe(false);
    expect(quietSaid).not.toMatch(/\bthree of them\b/i);

    setPlayers(ROSTER);
    const loud = playTraitorsSeason({ cast: CAST, traitorCount: 3, seed: 5,
      announceTraitorCount: true });
    const loudSel = (gs.episodeHistory || [])[0].tr.selection;
    expect(loudSel.hostBeats.map(b => b.text).join(' '),
      'the configuration says the room is told and the host did not tell it')
      .toMatch(/there will be 3 of them/i);
    // AND THE TWO SEASONS ARE OTHERWISE THE SAME SEASON. The premiere takes no
    // draw from any rng stream, so switching it on must not move a single
    // banishment — a narrative field that displaces the game is the one cost
    // this record is not allowed to have. Every calibration band this engine
    // holds was measured on seasons played without it.
    expect(loudSel.chosen).toEqual(quietSel.chosen);
    expect(loud.rounds.length, 'no season was played').toBeGreaterThan(3);
    expect(loud.rounds.map(r => r.banished),
      'switching the announcement on moved the season')
      .toEqual(quiet.rounds.map(r => r.banished));
  });

  it('speaks the rule before the action it governs, on both ceremonies', () => {
    const sel = RUNS[0].episodes[0].tr.selection;
    // Every rule pinned before any hand lands is spoken before every one of
    // them; every rule pinned to a hand names a hand that actually landed.
    const shoulder = sel.hostBeats.findIndex(b => b.ruleId === 'tap-means-traitor');
    expect(sel.hostBeats[shoulder].afterTap,
      'the rule that a hand means something is spoken after a hand has landed').toBe(null);
    for (const b of sel.hostBeats) {
      if (b.afterTap == null || b.afterTap === 'final') continue;
      expect(Number.isInteger(b.afterTap)).toBe(true);
      expect(b.afterTap, 'a line is pinned to a hand that never landed')
        .toBeLessThan(sel.taps.length);
    }
    // The reveal steps are stored apart from the speech and are in the order
    // the evening ran them.
    const kinds = sel.revealBeats.map(b => b.kind);
    expect(kinds.slice(0, 4)).toEqual(['rank', 'blindfold', 'silence', 'footsteps']);
    expect(kinds.filter(k => k === 'tap').length).toBe(sel.taps.length);
    expect(kinds[kinds.length - 1]).toBe('turret');
    // A tap step carries its ORDER and never a name: the names live on `taps`,
    // behind the gate js/vp-tr/selection.js already keeps.
    for (const b of sel.revealBeats.filter(b => b.kind === 'tap')) {
      expect(Object.keys(b).sort()).toEqual(['kind', 'order', 'text']);
    }
  });

  it('and the Selection speech names nobody at all', () => {
    // The gate in js/vp-tr/selection.js can only withhold what it can see. A
    // name written into a spoken line is a name the untapped layer would have
    // to be shown, because the untapped layer heard the speech.
    let checked = 0;
    for (const run of RUNS) {
      const sel = run.episodes[0].tr.selection;
      const said = [...sel.hostBeats.map(b => b.text), ...sel.hostBeats.map(b => b.action),
        ...sel.contestantBeats.map(b => b.text), sel.staging, sel.reminder].join(' ');
      for (const name of sel.line) {
        expect(mentionsIn(said, name), `the Selection ceremony says "${name}" out loud`)
          .toBe(false);
      }
      checked++;
    }
    expect(checked).toBe(RUNS.length);
  });

  it('and no forbidden word from another show reaches either ceremony', () => {
    for (const ep of RUNS.map(r => r.episodes[0])) {
      const flat = JSON.stringify([ep.tr.arrival, ep.tr.selection]);
      const bad = foreignWordsIn(flat.replace(/[{}"[\],:]/g, ' '), 'traitors');
      expect(bad, `a premiere record says ${bad.join(', ')}`).toEqual([]);
    }
  });
});

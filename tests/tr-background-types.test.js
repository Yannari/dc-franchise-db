// ══════════════════════════════════════════════════════════════════════
// Who walked into the castle, and what the room already knows about them
// ══════════════════════════════════════════════════════════════════════
//
// The Traitors is cast by hand out of three kinds of person: ALUMNI, who have
// a recorded franchise past the room can quote at them; CELEBRITIES, who are
// recognised for something that is not a reality show; and CIVILIANS, who are
// not recognised at all.
//
// The bug this file exists to prevent is the oldest one in the project wearing
// its newest hat: PROSE THAT KNOWS A FACT NOBODY RECORDED. A celebrity has no
// placement, a civilian has no finish, and a summary that gives either of them
// one is not flavour — it is the screen asserting a season that never aired.
// So the two negative assertions below are as load-bearing as the positive one.
//
// The second thing asserted here is that the resolved background is a
// SNAPSHOT. `players_database.json` is edited between seasons; a replay that
// re-resolved from the live database would rewrite its own history every time
// somebody fixed a placement.
import { describe, it, expect } from 'vitest';
import {
  TR_BACKGROUND_TYPES, resolveTraitorsBackground, snapshotTraitorsBackgrounds,
  traitorsBackgroundBlockers, initTraitorsState, prepTrForSave, repairTrSets,
} from '../js/tr/state.js';
import { SHOWS, DEFAULT_FORMAT } from '../js/shows.js';
// The pair every real save path in the simulator calls. A snapshot that only
// round-trips through prepTrForSave is a snapshot nothing in the app uses.
import { prepGsForSave, repairGsSets } from '../js/core.js';

// A two-show database. NOBODY here is flagged as returning: on this format
// nobody is returning, and history comes off the record instead.
const DB = [
  { name: 'Julia', occupation: 'Influencer', seasonDetails: [
    { format: 'total-drama', season: 2, placement: 4 },
  ] },
  { name: 'Ireland', occupation: 'Paramedic', seasonDetails: [
    { format: 'total-drama', season: 9, placement: 6 },
    { format: 'big-brother', season: 1, placement: 2, status: 'Runner-up' },
  ] },
  // Predates formats entirely — the bare-integer rule says that is Total Drama.
  { name: 'Ancient', seasonDetails: [{ season: 3, placement: 1, status: 'Winner' }] },
];

describe('resolveTraitorsBackground — the three kinds of person', () => {
  it('uses history and personality for alumni without inventing either', () => {
    const bg = resolveTraitorsBackground({ name:'Julia', archetype:'schemer', occupation:'Influencer' }, [{
      name:'Julia', seasonDetails:[{ format:'total-drama', season:2, placement:4 }],
    }]);
    expect(bg.type).toBe('alumni');
    expect(bg.sourceShows).toEqual(['total-drama']);
    expect(bg.summary).toContain('Total Drama 2');
    expect(bg.summary).toContain('Influencer');
  });

  it('does not invent a season for a celebrity or civilian', () => {
    for (const type of ['celebrity', 'civilian']) {
      const bg = resolveTraitorsBackground({ name:'Alex', backgroundType:type, occupation:'Actor' }, []);
      expect(bg.appearances).toEqual([]);
      expect(bg.summary).not.toMatch(/season|finalist|winner/i);
    }
  });

  it('stores exactly the three values the format has, lowercase', () => {
    expect(TR_BACKGROUND_TYPES).toEqual(['alumni', 'celebrity', 'civilian']);
  });

  it('names the show from the registry, never a literal', () => {
    const bg = resolveTraitorsBackground({ name: 'Ireland' }, DB);
    expect(bg.sourceShows).toEqual(['total-drama', 'big-brother']);
    expect(bg.summary).toContain(`${SHOWS['big-brother'].name} 1`);
    expect(bg.summary).toContain(`${SHOWS['total-drama'].name} 9`);
  });

  it('treats a formatless appearance as the default show, not as no show', () => {
    const bg = resolveTraitorsBackground({ name: 'Ancient' }, DB);
    expect(bg.type).toBe('alumni');
    expect(bg.sourceShows).toEqual([DEFAULT_FORMAT]);
    expect(bg.appearances[0].format).toBe(DEFAULT_FORMAT);
  });
});

describe('defaults, overrides and the warning that blocks a season', () => {
  it('defaults a recorded player to alumni', () => {
    expect(resolveTraitorsBackground({ name: 'Julia' }, DB).type).toBe('alumni');
  });

  it('defaults an unrecorded player to civilian, not to alumni', () => {
    const bg = resolveTraitorsBackground({ name: 'Priya', occupation: 'Emergency-room nurse' }, DB);
    expect(bg.type).toBe('civilian');
    expect(bg.recognized).toBe(false);
    expect(bg.warnings).toEqual([]);
  });

  it('defaults an unrecorded player to celebrity only when the profile says so', () => {
    const bg = resolveTraitorsBackground(
      { name: 'Morgan', occupation: 'Award-winning actor', publicFigure: true }, DB);
    expect(bg.type).toBe('celebrity');
    expect(bg.recognized).toBe(true);
  });

  it('lets the user override the default in either direction', () => {
    expect(resolveTraitorsBackground({ name: 'Julia', backgroundType: 'celebrity' }, DB).type)
      .toBe('celebrity');
    expect(resolveTraitorsBackground({ name: 'Priya', backgroundType: 'celebrity' }, DB).type)
      .toBe('celebrity');
  });

  it('blocks — and invents nothing — when alumni is chosen with no record', () => {
    const bg = resolveTraitorsBackground(
      { name: 'Priya', backgroundType: 'alumni', occupation: 'Emergency-room nurse' }, DB);
    expect(bg.appearances).toEqual([]);
    expect(bg.sourceShows).toEqual([]);
    expect(bg.summary).not.toMatch(/season|finalist|winner/i);
    expect(bg.warnings.length).toBeGreaterThan(0);
    expect(bg.warnings.some(w => w.blocking)).toBe(true);
    expect(bg.warnings[0].player).toBe('Priya');
  });

  it('keeps that contestant playable the moment they are reclassified', () => {
    const bg = resolveTraitorsBackground(
      { name: 'Priya', backgroundType: 'civilian', occupation: 'Emergency-room nurse' }, DB);
    expect(bg.warnings).toEqual([]);
    expect(traitorsBackgroundBlockers({ Priya: bg })).toEqual([]);
  });

  it('reports every blocker on the cast, and only the blocking ones', () => {
    const map = snapshotTraitorsBackgrounds([
      { name: 'Julia' },
      { name: 'Priya', backgroundType: 'alumni' },
      { name: 'Morgan', backgroundType: 'celebrity' },
    ], DB);
    const blockers = traitorsBackgroundBlockers(map);
    expect(blockers).toHaveLength(1);
    expect(blockers[0].player).toBe('Priya');
    expect(blockers[0].blocking).toBe(true);
  });
});

describe('the prose says how reputation enters the room', () => {
  it('gives an alumnus their record AND their personality', () => {
    const bg = resolveTraitorsBackground(
      { name: 'Julia', archetype: 'schemer', occupation: 'Influencer' }, DB);
    expect(bg.summary).toContain('Julia');
    expect(bg.summary).toContain('Total Drama 2');
    expect(bg.summary).toContain('Influencer');
    // Not a résumé card: there is a sentence about the room, not just numbers.
    expect(bg.summary.split(/[.;]/).filter(s => s.trim().length > 20).length)
      .toBeGreaterThanOrEqual(2);
  });

  it('gives a civilian an occupation and no television past', () => {
    const bg = resolveTraitorsBackground(
      { name: 'Priya', archetype: 'hero', occupation: 'Emergency-room nurse' }, DB);
    expect(bg.summary).toContain('Priya');
    expect(bg.summary).toContain('Emergency-room nurse');
    expect(bg.summary).not.toMatch(/season|finalist|winner|placement|banish/i);
  });

  it('never repeats one line for every archetype', () => {
    const lines = new Set(['schemer', 'hero', 'goat', 'villain', 'floater'].map(a =>
      resolveTraitorsBackground({ name: 'Sam', archetype: a, occupation: 'Barista' }, []).summary));
    expect(lines.size).toBeGreaterThan(1);
  });
});

describe('the snapshot is a snapshot', () => {
  it('resolves a cast of names or of objects, keyed by name', () => {
    const byName = snapshotTraitorsBackgrounds(['Julia', 'Priya'], DB);
    expect(Object.keys(byName).sort()).toEqual(['Julia', 'Priya']);
    expect(byName.Julia.type).toBe('alumni');
    expect(byName.Priya.type).toBe('civilian');
  });

  it('survives JSON.stringify with the rest of the traitors state', () => {
    const g = { tr: initTraitorsState() };
    g.tr.backgrounds = snapshotTraitorsBackgrounds(['Julia'], DB);
    const revived = repairTrSets(JSON.parse(JSON.stringify(prepTrForSave(g))));
    expect(revived.tr.backgrounds.Julia.summary).toContain('Total Drama 2');
    expect(revived.tr.backgrounds.Julia.appearances[0].season).toBe(2);
  });

  it('rides the save path the whole simulator uses, not just the castle one', () => {
    const g = { tr: initTraitorsState() };
    g.tr.shieldedThisRound = new Set(['Julia']);
    g.tr.backgrounds = snapshotTraitorsBackgrounds(['Julia'], DB);
    const revived = JSON.parse(JSON.stringify(prepGsForSave(g)));
    repairGsSets(revived);
    expect(revived.tr.shieldedThisRound instanceof Set).toBe(true);
    expect(revived.tr.backgrounds.Julia.type).toBe('alumni');
    expect(revived.tr.backgrounds.Julia.summary).toContain(`${SHOWS[DEFAULT_FORMAT].name} 2`);
  });

  it('does not rewrite a replay when the database is edited afterwards', () => {
    const db = JSON.parse(JSON.stringify(DB));
    const stored = JSON.parse(JSON.stringify(snapshotTraitorsBackgrounds(['Julia'], db)));
    // Somebody corrects the record between the season and the rewatch.
    db[0].seasonDetails[0].placement = 1;
    db[0].seasonDetails[0].status = 'Winner';
    db[0].occupation = 'Restaurateur';
    const now = resolveTraitorsBackground({ name: 'Julia' }, db);
    expect(now.summary).not.toBe(stored.Julia.summary);   // the live read moved
    expect(stored.Julia.appearances[0].placement).toBe(4); // the replay did not
    expect(stored.Julia.summary).toContain('Total Drama 2');
  });
});

// ══════════════════════════════════════════════════════════════════════
// THE RECORD THAT NEVER ARRIVED
// ══════════════════════════════════════════════════════════════════════
//
// `alumniAppearances` returns [] both for "never played" and for "the file that
// would have said so did not load", and the resolver cannot tell those apart.
// The cast screen fetches that file; when the fetch was swallowed, a whole room
// of four-time finalists resolved as Civilians and the only symptom was a badge
// that was not drawn. This is the guard on the failed path — it fails if the
// catch ever goes quiet again.
describe('a franchise record that failed to load', () => {
  it('says so out loud, and never passes for "this player has no past"', async () => {
    const castUi = await import('../js/cast-ui.js');
    const realFetch = globalThis.fetch;
    globalThis.players = [{ name: 'Julia', archetype: 'schemer' }];
    document.body.innerHTML = '<div id="background-panel"></div>';
    castUi._resetAlumniRecordLoad();
    globalThis.fetch = () => Promise.reject(new Error('offline'));
    try {
      castUi.castBackgrounds();                       // kicks the load
      await new Promise(r => setTimeout(r, 0));
      await new Promise(r => setTimeout(r, 0));

      // 1. The failure is a STATE, not a swallowed exception.
      expect(castUi.alumniRecordLoadState()).toBe('failed');
      const warn = castUi.alumniRecordWarning();
      expect(warn).toBeTruthy();
      expect(warn.blocking).toBe(true);
      expect(warn.code).toBe('alumni-record-unavailable');

      // 2. It is on screen, on the surface the other warnings already use.
      expect(document.getElementById('background-panel').textContent)
        .toMatch(/could not be loaded/i);

      // 3. And it is on the DATA, so no reader can mistake this Civilian for
      //    somebody whose past was checked and found empty.
      const map = castUi.castBackgrounds();
      expect(map.Julia.warnings.some(w => w.code === 'alumni-record-unavailable')).toBe(true);
      expect(castUi.castBackgroundBlockers().some(w => w.code === 'alumni-record-unavailable'))
        .toBe(true);
    } finally {
      if (realFetch) globalThis.fetch = realFetch; else delete globalThis.fetch;
      castUi._resetAlumniRecordLoad();
      delete globalThis.players;
      document.body.innerHTML = '';
    }
  });

  it('is silent while the record is fine — the warning is not decoration', async () => {
    const castUi = await import('../js/cast-ui.js');
    const realFetch = globalThis.fetch;
    globalThis.players = [];
    document.body.innerHTML = '<div id="background-panel"></div>';
    castUi._resetAlumniRecordLoad();
    globalThis.fetch = () => Promise.resolve({ ok: true, json: () => Promise.resolve({ players: DB }) });
    try {
      castUi.castBackgrounds();
      await new Promise(r => setTimeout(r, 0));
      await new Promise(r => setTimeout(r, 0));
      expect(castUi.alumniRecordLoadState()).toBe('ready');
      expect(castUi.alumniRecordWarning()).toBeNull();
      expect(document.getElementById('background-panel').textContent)
        .not.toMatch(/could not be loaded/i);
    } finally {
      if (realFetch) globalThis.fetch = realFetch; else delete globalThis.fetch;
      castUi._resetAlumniRecordLoad();
      delete globalThis.players;
      document.body.innerHTML = '';
    }
  });
});

// ══════════════════════════════════════════════════════════════════════
// A BLOCKING BACKGROUND ACTUALLY BLOCKS
// ══════════════════════════════════════════════════════════════════════
//
// `alumni-without-history` carries `blocking: true` and its own comment in
// js/tr/state.js says "the warning stops the season rather than being a note
// nobody reads". It did not. `traitorsBackgroundBlockers` was called in
// exactly one place — the cast builder's panel — and nothing on the way into
// a season read it, so every blocker was advisory: dismiss the panel, or
// reach the play path by any other route, and the castle started with the
// precise cast the check exists to refuse.
//
// This is the Task 1 carry-forward the plan ledger warned must not be lost
// when Task 10A was folded into Task 10.
describe('a blocking background refuses the season', () => {
  it('an Alumni with no recorded appearance is a blocker', () => {
    const bg = resolveTraitorsBackground(
      { name: 'Nobody', backgroundType: 'alumni', occupation: 'Contestant' }, []);
    const blocking = (bg.warnings || []).filter(w => w && w.blocking);
    expect(blocking.length, 'an Alumni with no history raised no blocking warning')
      .toBeGreaterThan(0);
    expect(blocking[0].code).toBe('alumni-without-history');
  });

  it('and the blocker list picks it up off a whole cast', () => {
    const cast = [
      { name: 'Nobody', backgroundType: 'alumni', occupation: 'Contestant' },
      { name: 'Ordinary', backgroundType: 'civilian', occupation: 'Plumber' },
    ];
    const blockers = traitorsBackgroundBlockers(snapshotTraitorsBackgrounds(cast, []));
    expect(blockers.length, 'the cast-wide blocker list missed it').toBeGreaterThan(0);
    expect(blockers.some(b => b.player === 'Nobody')).toBe(true);
    // ANTI-VACUITY: a list that flags everybody is not a check. The civilian
    // beside them must not be in it.
    expect(blockers.some(b => b.player === 'Ordinary')).toBe(false);
  });

  it('a clean cast produces no blockers at all', () => {
    const cast = [
      { name: 'Ordinary', backgroundType: 'civilian', occupation: 'Plumber' },
      { name: 'Known', backgroundType: 'celebrity', occupation: 'Singer' },
    ];
    expect(traitorsBackgroundBlockers(snapshotTraitorsBackgrounds(cast, []))).toEqual([]);
  });
});

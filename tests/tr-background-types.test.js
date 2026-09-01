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

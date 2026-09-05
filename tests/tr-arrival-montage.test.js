// ══════════════════════════════════════════════════════════════════════
// tr-arrival-montage.test.js — the premiere introduces PEOPLE
// ══════════════════════════════════════════════════════════════════════
//
// An arrival card used to be two or three lines: what somebody physically did
// getting out of a car, the billing the ledger holds, and whatever the person
// nearest had a reason to say. That is a door, not an introduction — a show
// whose whole engine is nine stats and fifteen archetypes said nothing at all
// about who any of these people were.
//
// Three lines were added, and each of them reads a fact the season already
// holds rather than inventing a characterisation:
//
//   profile      what their stats are built for, in words and never a number
//   personality  how their archetype plays, specifically
//   threat       what the room will make of them, off the ledger for alumni
//
// The guards here are the ones that would have caught the defects the first
// pass actually had: a pool keyed by archetype going stale against core.js, a
// build formula that filed a third of the cast under the same sentence, and a
// threat line that repeated the billing line above it word for idea.
import { describe, it, expect } from 'vitest';
import { setPlayers, ARCHETYPES } from '../js/core.js';
import { buildArrivalRecord } from '../js/tr/headless.js';
import { snapshotTraitorsBackgrounds } from '../js/tr/state.js';
import { setAlumniDatabase } from '../js/alumni.js';
import roster from '../franchise_roster.json';

const ARCH_KEYS = Object.keys(ARCHETYPES);
const STATS = { physical: 5, endurance: 5, mental: 5, social: 5, strategic: 5,
  loyalty: 5, boldness: 5, intuition: 5, temperament: 5 };

/** One player per archetype, so every personality pool has to answer. */
function archetypeCast() {
  return ARCH_KEYS.map((archetype, i) => ({
    name: 'Player' + (i + 1), slug: 'player-' + (i + 1), archetype,
    gender: i % 2 ? 'f' : 'm', occupation: 'Tester', stats: { ...STATS },
  }));
}

function recordFor(cast, db = []) {
  setPlayers(cast);
  setAlumniDatabase(db);
  try {
    return buildArrivalRecord(cast.map(p => p.name),
      snapshotTraitorsBackgrounds(cast), 'chris-mclean');
  } finally { setAlumniDatabase([]); }
}

const linesOf = (rec, name, kind) =>
  (rec.introductions.find(i => i.name === name)?.lines || []).filter(l => l.kind === kind);

describe('every archetype has a voice, and cannot quietly lose one', () => {
  const cast = archetypeCast();
  const rec = recordFor(cast);

  it('all fifteen get a personality line', () => {
    // THE DRIFT GUARD. The personality pool is keyed by archetype id, and an
    // archetype added to core.js without one here would simply print nothing
    // — silently, on the show's opening screen.
    const missing = cast.filter(p => !linesOf(rec, p.name, 'personality').length)
      .map(p => p.archetype);
    expect(missing, 'archetypes with no personality line').toEqual([]);
    expect(ARCH_KEYS.length).toBe(15);
  });

  it('says something different for each of them', () => {
    const said = cast.map(p => linesOf(rec, p.name, 'personality')[0].text);
    expect(new Set(said).size, 'two archetypes printed the same sentence').toBe(said.length);
  });

  it('names the archetype it drew from, for the transcript', () => {
    for (const p of cast) {
      expect(linesOf(rec, p.name, 'personality')[0].archetype).toBe(p.archetype);
    }
  });
});

describe('the profile line reads the stats without printing one', () => {
  it('gives a flat sheet the balanced read rather than a made-up strength', () => {
    const rec = recordFor(archetypeCast());          // every stat 5
    for (const intro of rec.introductions) {
      expect(intro.lines.find(l => l.kind === 'profile').build).toBe('balanced');
    }
  });

  it.each([
    ['outlast', { physical: 9, endurance: 9 }],
    ['room', { social: 9, strategic: 9 }],
    ['reader', { intuition: 9, mental: 9 }],
    ['nerve', { boldness: 10 }],
    ['steady', { loyalty: 9, temperament: 9 }],
  ])('reads a %s build off the numbers', (build, spike) => {
    const cast = [{ name: 'Spike', slug: 'spike', archetype: 'floater', gender: 'nb',
      occupation: 'Tester', stats: { ...STATS, ...spike } }];
    const rec = recordFor(cast);
    expect(rec.introductions[0].lines.find(l => l.kind === 'profile').build).toBe(build);
  });

  it('never prints a stat number', () => {
    // "7 endurance" is a spreadsheet. The whole point of the line is to say
    // what a 7 lets somebody do.
    const rec = recordFor(archetypeCast());
    for (const intro of rec.introductions) {
      for (const l of intro.lines.filter(x => x.kind === 'profile')) {
        expect(l.text, `${intro.name} printed a number`).not.toMatch(/\b\d+\b/);
        for (const k of Object.keys(STATS)) {
          expect(l.text.toLowerCase(), `${intro.name} named the stat "${k}"`)
            .not.toContain(k + ':');
        }
      }
    }
  });

  it('does not file most of a real cast under one build', () => {
    // The first formula compared raw pair totals, which asks "is this number
    // big" — and loyalty and temperament run high across the roster, so a
    // third of any cast came out `steady` and printed from one pool.
    const cast = roster.players.slice(0, 60);
    const rec = recordFor(cast);
    const tally = {};
    for (const intro of rec.introductions) {
      const b = intro.lines.find(l => l.kind === 'profile').build;
      tally[b] = (tally[b] || 0) + 1;
    }
    const worst = Math.max(...Object.values(tally));
    expect(worst / cast.length, `one build took ${worst} of ${cast.length}: ${JSON.stringify(tally)}`)
      .toBeLessThan(0.45);
    expect(Object.keys(tally).length, 'a real cast used fewer than three builds')
      .toBeGreaterThanOrEqual(3);
  });
});

describe('the threat line reads the ledger, not a mood', () => {
  const who = (name, seasonDetails, extra = {}) =>
    ({ name, occupation: 'Tester', seasonDetails, ...extra });

  it.each([
    ['champion', [{ format: 'total-drama', season: 2, placement: 1, status: 'Winner' }]],
    ['finalist', [{ format: 'total-drama', season: 2, placement: 2, status: 'Runner-up' }]],
    ['veteran', [{ format: 'total-drama', season: 2, placement: 4 }]],
    ['earlyExit', [{ format: 'total-drama', season: 2, placement: 15 }]],
  ])('files a %s off their placements', (tier, seasonDetails) => {
    const cast = [{ name: 'Vet', slug: 'vet', archetype: 'floater', gender: 'nb',
      occupation: 'Tester', stats: { ...STATS } }];
    const rec = recordFor(cast, [who('Vet', seasonDetails)]);
    expect(rec.introductions[0].lines.find(l => l.kind === 'threat').tier).toBe(tier);
  });

  it('takes the BEST placement when somebody has played more than once', () => {
    const cast = [{ name: 'Vet', slug: 'vet', archetype: 'floater', gender: 'nb',
      occupation: 'Tester', stats: { ...STATS } }];
    const rec = recordFor(cast, [who('Vet', [
      { format: 'total-drama', season: 1, placement: 16 },
      { format: 'total-drama', season: 4, placement: 1, status: 'Winner' },
    ])]);
    expect(rec.introductions[0].lines.find(l => l.kind === 'threat').tier).toBe('champion');
  });

  it('gives somebody with no record the civilian read', () => {
    const rec = recordFor(archetypeCast());
    for (const intro of rec.introductions) {
      expect(intro.lines.find(l => l.kind === 'threat').tier).toBe('civilian');
    }
  });

  it('does not simply restate the billing line above it', () => {
    // Both lines were saying "nobody knows anything about this person", one
    // after the other, which reads as the montage stalling.
    const rec = recordFor(archetypeCast());
    for (const intro of rec.introductions) {
      const threat = intro.lines.find(l => l.kind === 'threat').text.toLowerCase();
      expect(threat, `${intro.name}'s threat line restates the billing`)
        .not.toMatch(/no record|nothing to look up|no reputation/);
    }
  });
});

describe('the montage as a whole', () => {
  const cast = roster.players.slice(0, 20);

  it('gives every arrival the full set, in order', () => {
    const rec = recordFor(cast);
    for (const intro of rec.introductions) {
      const kinds = intro.lines.map(l => l.kind);
      expect(kinds[0], `${intro.name} does not open on arriving`).toBe('establish');
      for (const need of ['profile', 'personality', 'threat']) {
        expect(kinds, `${intro.name} has no ${need} line`).toContain(need);
      }
      // The room answers last, because it is answering the rest of the card.
      if (kinds.includes('reaction')) {
        expect(kinds[kinds.length - 1], `${intro.name}'s reaction is not last`).toBe('reaction');
      }
      expect(kinds.indexOf('profile')).toBeLessThan(kinds.indexOf('personality'));
      expect(kinds.indexOf('personality')).toBeLessThan(kinds.indexOf('threat'));
    }
  });

  it('leaves no template hole unfilled', () => {
    const rec = recordFor(cast);
    for (const intro of rec.introductions) {
      for (const l of intro.lines) {
        expect(l.text, `${intro.name} printed a raw placeholder`).not.toMatch(/\{\w+\}/);
        expect(l.text.length, `${intro.name} has an empty ${l.kind} line`).toBeGreaterThan(0);
      }
    }
  });

  it('spends a whole pool before it says anything twice', () => {
    // Twenty arrivals, and twenty civilians all draw from ONE tier — so a
    // repeat is arithmetic rather than a defect. What would be a defect is the
    // picker returning its first choice again while seven lines went unused,
    // which is what the arrival pools did before `_pPickUnique` learned to lap.
    // So: at least eight distinct sentences per pool, and never the same one
    // on two cards in a row.
    const rec = recordFor(cast);
    for (const kind of ['profile', 'personality', 'threat']) {
      const said = rec.introductions.flatMap(i => i.lines.filter(l => l.kind === kind))
        .map(l => l.text);
      expect(new Set(said).size, `the ${kind} pool used ${new Set(said).size} lines for ${said.length} people`)
        .toBeGreaterThanOrEqual(Math.min(8, said.length));
      for (let i = 1; i < said.length; i++) {
        expect(said[i], `two arrivals in a row got the same ${kind} line`).not.toBe(said[i - 1]);
      }
    }
  });

  it('is the same premiere on a replay', () => {
    const a = recordFor(cast);
    const b = recordFor(cast);
    expect(JSON.stringify(b.introductions)).toBe(JSON.stringify(a.introductions));
  });
});

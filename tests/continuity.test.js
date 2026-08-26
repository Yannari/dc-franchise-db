// The continuity box exists to print a career back in the words of the show it
// happened on. The bug it is built against is this project's recurring one —
// one show's vocabulary over the other — so that is what these check, along
// with the reason the module reads the archive instead of the player index.
import { describe, expect, it, beforeAll } from 'vitest';
import fs from 'node:fs';

// Serve the repo's real data files to the module's fetch calls. Reading the
// actual archive rather than a fixture is deliberate: a fixture would keep
// passing on the day a season document changes shape, which is the failure
// this box would show the user first.
beforeAll(() => {
  globalThis.fetch = async (url) => {
    const p = String(url).replace(/^\.\//, '');
    if (!fs.existsSync(p)) return { ok: false };
    return { ok: true, json: async () => JSON.parse(fs.readFileSync(p, 'utf8')) };
  };
});

const load = async () => import('../js/continuity.js');

describe('a career comes back in its own show’s words', () => {
  it('gives a Big Brother season Big Brother vocabulary', async () => {
    const { appearancesFor } = await load();
    const [bb] = await appearancesFor('misha');
    expect(bb, 'Misha won BB1 — she must appear at all').toBeTruthy();
    expect(bb.show).toBe('Big Brother');
    expect(bb.exitWord).toBe('evicted');
    expect(bb.roundWord).toBe('Week');
    expect(bb.seasonId).toBe('bb-1');
  });

  it('gives a Total Drama season Total Drama vocabulary', async () => {
    const { appearancesFor } = await load();
    const [td] = await appearancesFor('bowie');
    expect(td.show).toBe('Total Drama');
    expect(td.exitWord).toBe('voted out');
    expect(td.roundWord).toBe('Episode');
  });

  it('counts the stats each show actually keeps', async () => {
    const { appearancesFor } = await load();
    // `key` is the stable identity, `label` is what the screen shows.
    const [bb] = await appearancesFor('misha');
    const bbKeys = bb.stats.map(s => s.key);
    // A houseguest has HOHs and vetoes; she cannot have idols.
    expect(bbKeys).toContain('bb.hohWins');
    expect(bbKeys).not.toContain('idolsFound');

    const td = (await appearancesFor('bowie'))[0];
    const tdKeys = td.stats.map(s => s.key);
    expect(tdKeys).toContain('immunityWins');
    expect(tdKeys).not.toContain('bb.hohWins');
  });

  it('labels a counter in words, not in field names', async () => {
    // The registry's careerStats second column is a database column name, and
    // rendering it verbatim put "3 timesNominated" on screen.
    const { appearancesFor } = await load();
    const [bb] = await appearancesFor('misha');
    const labels = bb.stats.map(s => s.label);
    expect(labels).toContain('HOH wins');
    expect(labels).toContain('times nominated');
    expect(labels.some(l => /[a-z][A-Z]/.test(l)), 'no camelCase reaches the screen').toBe(false);
  });

  it('agrees with the count on singular and plural', async () => {
    const { appearancesFor } = await load();
    const [s9, s10] = await appearancesFor('bowie');
    expect(s9.stats.find(s => s.key === 'idolsFound')).toMatchObject({ value: 1, label: 'idol found' });
    expect(s10.stats.find(s => s.key === 'idolsFound')).toMatchObject({ value: 2, label: 'idols found' });
  });

  it('does not print the same counter twice on Total Drama', async () => {
    // `showWords('total-drama').comps` IS the phrase "immunity wins", so
    // labelling challengeWins from it collided with the immunityWins row and
    // rendered "1 immunity win · 1 immunity win".
    const { appearancesFor } = await load();
    const [td] = await appearancesFor('bowie');
    const labels = td.stats.map(s => s.label);
    expect(new Set(labels).size, labels.join(' / ')).toBe(labels.length);
    expect(labels).toContain('challenge win');
  });
});

describe('the archive is the source, not the player index', () => {
  // players_database.json stores Misha's Big Brother season as the bare
  // integer 1, and a bare integer is Total Drama permanently. Anything reading
  // that index would hand her Total Drama's first season — a cast she is not
  // in. This is the regression that rule protects against.
  it('does not put a houseguest in Total Drama season one', async () => {
    const { appearancesFor } = await load();
    const apps = await appearancesFor('misha');
    expect(apps.every(a => a.format === 'big-brother'),
      'Misha has never played Total Drama').toBe(true);

    const td1 = JSON.parse(fs.readFileSync('data/seasons/season1-data.json', 'utf8'));
    expect(td1.placements.some(p => p.playerSlug === 'misha'),
      'guard: if she is ever cast in TD1 this test needs rewriting').toBe(false);
  });

  it('finds Big Brother at all, though its document has no status field', async () => {
    // TD documents carry status:'Complete'; bb-1 does not carry one. Gating on
    // status alone silently hid every Big Brother season from the box.
    const bb = JSON.parse(fs.readFileSync('data/seasons/bb-1-data.json', 'utf8'));
    expect(bb.status).toBeUndefined();
    const { appearancesFor } = await load();
    expect((await appearancesFor('misha')).length).toBe(1);
  });
});

describe('what the box says about a whole career', () => {
  it('names every show a multi-season player appeared on', async () => {
    const { appearancesFor, continuitySummary } = await load();
    const sum = continuitySummary(await appearancesFor('bowie'));
    expect(sum.seasons).toBe(2);
    expect(sum.wins).toBe(1);
    expect(sum.best.placement).toBe(1);
    expect(sum.shows).toEqual(['Total Drama']);
  });

  it('reports nothing for a character who has never played', async () => {
    const { appearancesFor, continuitySummary } = await load();
    const apps = await appearancesFor('nobody-has-this-slug');
    expect(apps).toEqual([]);
    // The Studio keys the whole box off this being null, so a debut character
    // gets no panel rather than an empty one.
    expect(continuitySummary(apps)).toBeNull();
  });

  it('counts a recurring rival once per season, highest first', async () => {
    const { appearancesFor, continuityTies } = await load();
    const ties = continuityTies(await appearancesFor('bowie'));
    const priya = ties.rivalries.find(t => t.name === 'Priya');
    expect(priya.count, 'Priya opposed him in both seasons').toBe(2);
    expect(ties.rivalries[0].name).toBe('Priya');
  });

  it('survives a season whose document predates keyMoments', async () => {
    const { appearancesFor } = await load();
    const apps = await appearancesFor('leshawna');
    expect(apps.length).toBeGreaterThan(1);
    // The early documents are thin. That must read as an empty list the UI can
    // caption, never as a crash or a missing season.
    expect(apps.every(a => Array.isArray(a.keyMoments))).toBe(true);
    expect(apps.some(a => a.keyMoments.length === 0)).toBe(true);
  });
});

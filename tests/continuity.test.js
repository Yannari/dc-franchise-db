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

// A wiki freezes a character at the age they were written. Turning "Leshawna is
// sixteen" into a birthday needs to know WHEN she was sixteen, and the only
// thing that knows is this franchise's own calendar.
describe('an age from a wiki, placed in franchise time', () => {
  it('anchors on the season that aired first, not the lowest number', async () => {
    const { appearancesFor, ageAnchor } = await load();
    const a = ageAnchor(await appearancesFor('leshawna'));
    expect(a.debut.seasonId).toBe('td-1');
    expect(a.debut.airYear).toBe(2020);
    // "Now" is derived from the last season aired, never stored — a stored
    // current year is a second clock and two clocks disagree.
    expect(a.now.airYear).toBe(2026);
    expect(a.now.airSlot).toBe('fall');
  });

  it('carries a canonical age forward to the present', async () => {
    const { appearancesFor, ageAnchor, birthFromCanonAge } = await load();
    const a = ageAnchor(await appearancesFor('leshawna'));
    const born = birthFromCanonAge(16, a, '07-14');
    // 16 in spring 2020 is a person born in 2004, who is 22 in fall 2026.
    expect(born.birthYear).toBe(2004);
    expect(born.birthdate).toBe('2004-07-14');
    expect(born.ageNow).toBe(22);
  });

  it('gives a later debut a later birth year for the same canonical age', async () => {
    const { appearancesFor, ageAnchor, birthFromCanonAge } = await load();
    const bowie = ageAnchor(await appearancesFor('bowie'));
    // Bowie debuted in 2024, so the same "16" means someone born in 2008 —
    // this is the whole reason the sum cannot be done from the wiki alone.
    expect(birthFromCanonAge(16, bowie, '07-14').birthYear).toBe(2008);
  });

  it('still gives an age when no birthday is known', async () => {
    const { appearancesFor, ageAnchor, birthFromCanonAge } = await load();
    const a = ageAnchor(await appearancesFor('leshawna'));
    const born = birthFromCanonAge(16, a, null);
    expect(born.birthdate, 'a day of the month is nobody’s fact').toBeNull();
    expect(born.ageNow).toBe(22);
  });

  it('refuses an age it cannot use', async () => {
    const { appearancesFor, ageAnchor, birthFromCanonAge } = await load();
    const a = ageAnchor(await appearancesFor('leshawna'));
    for (const bad of [null, undefined, 0, -3, 250, 'sixteen', 16.5]) {
      expect(birthFromCanonAge(bad, a, '07-14'), String(bad)).toBeNull();
    }
  });

  it('has no anchor for somebody who has never played', async () => {
    const { appearancesFor, ageAnchor } = await load();
    expect(ageAnchor(await appearancesFor('nobody-has-this-slug'))).toBeNull();
  });
});

// "Nothing ticks" is the calendar's own first rule: time advances because a
// season aired, not because a clock ran. Three places broke it — js/wiki.js
// and two blocks in player.html each aged people against `new Date()`, so
// everybody would have quietly gained a year the moment the real calendar
// turned while the franchise stayed put. It reads correct today only because
// the real year and the aired year happen to match.
describe('an age is counted on the franchise clock', () => {
  it('knows nothing until it is told what has aired', async () => {
    const cal = await import('../js/franchise-calendar.js');
    // Deliberately null rather than falling back to the real date: an age off
    // the wrong clock is worse than a blank because it looks right.
    cal.setFranchiseNow([]);
    expect(cal.ageNow('2004-07-21')).toBeNull();
  });

  it('counts to the last season aired, not to today', async () => {
    const { continuityIndex, resetContinuityIndex } = await load();
    const cal = await import('../js/franchise-calendar.js');
    // The index caches, and a cached hit does not re-tell the calendar what
    // year it is — so the test above, which cleared it, would otherwise decide
    // this one's answer.
    resetContinuityIndex();
    await continuityIndex();

    const now = cal.franchiseNow();
    expect(now.airYear).toBe(2026);
    expect(now.airSlot).toBe('fall');
    expect(cal.ageNow('2004-07-21')).toBe(22);
    // Their birthday has not come round by the time the slot opens.
    expect(cal.ageNow('2006-12-31')).toBe(19);
    expect(cal.ageNow('2006-01-02')).toBe(20);
  });

  it('is the only clock any page reads', async () => {
    const fs = await import('node:fs');
    for (const f of ['js/wiki.js', 'player.html']) {
      // Comments may say the words — one of them explains why this rule
      // exists. Only executable code counts.
      const code = fs.readFileSync(f, 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/^\s*(\/\/|\*).*$/gm, '');
      expect(code, `${f} grew a second clock`).not.toMatch(/new Date\(\)/);
    }
  });
});

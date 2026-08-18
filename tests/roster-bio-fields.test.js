// The bio: authored facts about who a character IS.
//
// Three natures of data live in this project and they must not be confused:
//   authored  — who exists (roster / franchise_roster.json)
//   derived   — what happened in a season (players_database.json)
//   accrued   — what happened to their life afterwards (not built yet)
//
// This covers the first: occupation, hometown, birthdate and backstory, added
// beside the age/ethnicity/nationality/descriptor fields that were already
// there.
//
// The bug this file exists for, found while adding them: `entry` in _save()
// carried six fields — name, slug, gender, sexuality, archetype, stats — and
// `entry` is BOTH what goes into the local pool and what _rosterPush sends to
// D1. Everything biographical went to the IndexedDB `rich` record instead,
// which never leaves the browser. So editing somebody's age in the Studio
// looked like it worked, survived a reload, and never reached the database or
// any published roster. The 27 published characters that do carry those fields
// got them from the original seed parsing the voice lead-in; nothing typed
// since had ever landed.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = f => readFileSync(resolve(process.cwd(), f), 'utf8');

const BIO_FIELDS = ['age', 'birthdate', 'ethnicity', 'nationality',
  'hometown', 'occupation', 'descriptor', 'backstory'];
// The four that are new here; the other four predate this and are only being
// carried correctly for the first time.
const NEW_FIELDS = ['birthdate', 'hometown', 'occupation', 'backstory'];

describe('the schema describes the table that actually exists', () => {
  const schema = read('worker/roster_schema.sql');
  const migration = read('worker/roster_migration_bio.sql');

  it('declares every bio column on a fresh database', () => {
    for (const f of BIO_FIELDS) {
      expect(schema, `roster_schema.sql does not declare ${f} — a fresh database `
        + 'would be missing a column the Worker writes').toMatch(new RegExp(`^\\s*${f}\\s`, 'm'));
    }
  });

  it('migrates an existing database for exactly the columns it is missing', () => {
    // Only the four NEW ones. The live table already had age / ethnicity /
    // nationality / descriptor, added out of band before the schema knew about
    // them — and D1 runs a file as ONE BATCH and rolls back on the first error,
    // so an ALTER for a column that already exists does not "fail harmlessly
    // and let the rest through", it discards the whole migration. The first
    // version of this file listed all eight and added nothing.
    for (const f of NEW_FIELDS) {
      expect(migration, `no ALTER for ${f}`).toMatch(new RegExp(`ADD COLUMN\\s+${f}\\b`));
    }
    for (const f of ['age', 'ethnicity', 'nationality', 'descriptor']) {
      expect(migration, `${f} already exists on the live table — an ALTER for it `
        + 'aborts the whole batch and the four new columns never land')
        .not.toMatch(new RegExp(`ADD COLUMN\\s+${f}\\b`));
    }
  });

  it('keeps the ALTERs out of the re-runnable file', () => {
    // roster_schema.sql promises at the top that it is safe to re-run, and
    // SQLite has no ADD COLUMN IF NOT EXISTS — one ALTER in there aborts the
    // whole file on the second run and takes the tombstone table with it.
    expect(schema, 'an ALTER crept into the re-runnable schema')
      .not.toMatch(/ALTER\s+TABLE/i);
  });
});

describe('the Worker reads, writes and publishes the bio', () => {
  const worker = read('worker/worker-studio.js');

  it('persists every bio field on save', () => {
    for (const f of BIO_FIELDS) {
      expect(worker, `${f} is never written by rosterSave`)
        .toMatch(new RegExp(`${f}=excluded\\.${f}`));
    }
  });

  it('publishes them into franchise_roster.json', () => {
    for (const f of NEW_FIELDS) {
      expect(worker, `${f} is stored but never published — the site cannot read it`)
        .toMatch(new RegExp(`out\\.${f}\\s*=`));
    }
  });

  it('rejects a birthdate that is not a real date', () => {
    // Stored as a date, never coerced. A half-parsed date becomes a wrong age
    // on every page that renders it, and the wrongness is invisible because it
    // still looks like a number.
    expect(worker).toMatch(/birthdate must be YYYY-MM-DD/);
    expect(worker).toMatch(/is not a real date/);
  });

  it('never publishes a computed age', () => {
    // franchise_roster.json is regenerated only on Publish, so an age baked
    // into it is wrong from the character's next birthday until someone
    // remembers to press the button.
    const row = worker.slice(worker.indexOf('function rosterRowToJson'),
      worker.indexOf('async function rosterList'));
    expect(row, 'the publisher is computing an age instead of emitting the date')
      .not.toMatch(/getFullYear|Date\.now|new Date\(\)/);
  });
});

describe('the Studio actually sends the bio', () => {
  const studio = read('js/studio.js');

  it('puts every bio field on the entry that reaches D1', () => {
    // The regression that motivated this file: the fields existed in the draft
    // and in the editor, and `entry` did not carry them.
    const save = studio.slice(studio.indexOf('async function _save()'),
      studio.indexOf('// 2) rich record'));
    for (const f of BIO_FIELDS) {
      expect(save, `${f} is edited in the Studio but never sent to the database`)
        .toContain(`'${f}'`);
    }
  });

  it('offers an input for each new field, and stores what is typed', () => {
    for (const f of NEW_FIELDS) {
      expect(studio, `no input for ${f}`).toMatch(new RegExp(`id="st-f-${f}"`));
      expect(studio, `${f} input is not wired to the draft`)
        .toMatch(new RegExp(`#st-f-${f}'\\)\\.addEventListener`));
    }
  });

  it('keeps voice and backstory as separate fields', () => {
    // They overlap in flavour and must not be merged. Voice ships inside every
    // episode prompt — padding it with biography is paid for on every episode
    // of every season — and backstory is read by a human on a wiki page.
    expect(studio).toMatch(/id="st-f-voice"/);
    expect(studio).toMatch(/id="st-f-backstory"/);
  });
});

describe('the player page renders it without inventing anything', () => {
  const page = read('player.html');

  it('computes age from the birthdate rather than trusting a stored one', () => {
    const box = page.slice(page.indexOf('// ── THE BIO'), page.indexOf('// ── WHY TIER'));
    expect(box.length, 'the bio block is missing from player.html').toBeGreaterThan(200);
    expect(box, 'age is not derived from birthdate').toMatch(/getUTCFullYear/);
    expect(box, 'the stored age is not used as a fallback').toMatch(/rp\.age/);
  });

  it('escapes the authored text', () => {
    const box = page.slice(page.indexOf('// ── THE BIO'), page.indexOf('// ── WHY TIER'));
    expect(box, 'authored prose is interpolated unescaped').toMatch(/esc\(rp\.backstory\)/);
  });

  it('renders nothing for a character with no bio', () => {
    const box = page.slice(page.indexOf('// ── THE BIO'), page.indexOf('// ── WHY TIER'));
    expect(box, 'a character with no bio would get an empty panel')
      .toMatch(/if \(!rows\.length && !rp\.backstory\) return '';/);
  });
});

describe('the published roster stays readable by the simulator', () => {
  it('carries only known keys', () => {
    const roster = JSON.parse(read('franchise_roster.json'));
    const players = Array.isArray(roster) ? roster : (roster.players || []);
    expect(players.length).toBeGreaterThan(100);
    const allowed = new Set(['name', 'slug', 'gender', 'sexuality', 'archetype', 'stats',
      'isReturnee', ...BIO_FIELDS]);
    const strays = new Set();
    for (const p of players) for (const k of Object.keys(p)) if (!allowed.has(k)) strays.add(k);
    expect([...strays], 'an unexpected key reached the published roster').toEqual([]);
  });
});

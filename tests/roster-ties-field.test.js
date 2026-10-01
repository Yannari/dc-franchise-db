// roster-ties-field.test.js — family & ties travel the whole chain, or they
// die at the next Publish (user, 2026-09-30: "a married couple stays married
// in life after the show"). Publish rebuilds franchise_roster.json wholesale
// FROM the D1 roster table, so a field missing from any link of this chain is
// silently deleted (it has happened twice: memory project_publish_wipes_
// authored_fields). The links: schema, migration, Worker save (column, bind,
// conflict update), Worker read-back on publish, and the Studio payload.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = f => readFileSync(resolve(process.cwd(), f), 'utf8');
const worker = read('worker/worker-studio.js');
const studio = read('js/studio.js');

describe('the database knows the column', () => {
  it('a fresh database declares it, an existing one is migrated, and the re-runnable schema has no ALTER', () => {
    expect(read('worker/roster_schema.sql')).toMatch(/^\s*ties\s+TEXT/m);
    expect(read('worker/roster_migration_ties.sql')).toMatch(/ALTER TABLE roster ADD COLUMN ties TEXT/);
    expect(read('worker/roster_schema.sql')).not.toMatch(/ALTER\s+TABLE/i);
  });
});

describe('the Worker writes it and publishes it', () => {
  it('is a roster field', () => {
    expect(worker).toMatch(/const ROSTER_FIELDS = \[[^\]]*'ties'[^\]]*\]/);
  });
  it('is written on save: the column, the conflict update and the bind', () => {
    expect(worker).toMatch(/casting_interview,drag,ties,/);
    expect(worker).toMatch(/ties=excluded\.ties/);
    expect(worker).toMatch(/drag, ties,\s*\n\s*payload\.isReturnee/);
    // (the statement's two sides are counted by tests/roster-bio-fields.test.js)
  });
  it('is read back out on publish, or the button deletes it', () => {
    const back = worker.slice(worker.indexOf('function rosterRowToJson'));
    expect(back).toMatch(/if \(r\.ties\)/);
    expect(back).toMatch(/out\.ties = ties/);
  });
  it('validates on the way in: only the Relationships tab\'s words, only known roles', () => {
    expect(worker).toMatch(/function tiesToJson/);
    expect(worker).toMatch(/TIE_KINDS\.has\(t\.kin\)/);
    expect(worker).not.toMatch(/TIE_KINDS = new Set\(\[[^\]]*'drag-/);   // the drag family has its own axis
  });
});

describe('Create Character sends it', () => {
  it('the save payload always carries the ties (so removing the last one clears it)', () => {
    expect(studio).toMatch(/entry\.ties = \(d\.ties \|\| \[\]\)/);
  });
  it('the editor loads them from the roster row first', () => {
    expect(studio).toMatch(/ties: \(Array\.isArray\(base\.ties\)/);
  });
  it('the editor has the section, outside the Drag Race panel', () => {
    const at = studio.indexOf('id="st-f-ties"');
    expect(at).toBeGreaterThan(0);
    expect(at).toBeLessThan(studio.indexOf('<details class="st-drag"'));
  });
});

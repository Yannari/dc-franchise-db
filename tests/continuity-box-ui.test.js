// @vitest-environment jsdom
//
// The box, rendered. `continuity.test.js` proves the archive is read correctly;
// this proves the Studio actually puts it on screen — the failure this project
// keeps shipping is a feature that is written, wired, tested at the data layer
// and draws nothing.
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import fs from 'node:fs';

let fill;

beforeAll(async () => {
  globalThis.fetch = async (url) => {
    const p = String(url).replace(/^\.\//, '');
    if (!fs.existsSync(p)) return { ok: false };
    return { ok: true, json: async () => JSON.parse(fs.readFileSync(p, 'utf8')) };
  };
  ({ _fillContinuity: fill } = await import('../js/studio.js'));
});

// The markup the editor template puts on the page, and nothing else.
const skeleton = () => {
  document.body.innerHTML = `<div id="st-editor">
    <details class="st-cont" id="st-cont" hidden>
      <summary class="st-cont-sum">Continuity <span class="st-hint" id="st-cont-count"></span></summary>
      <div class="st-cont-body" id="st-cont-body"></div>
    </details>
  </div>`;
  return document.getElementById('st-editor');
};

beforeEach(() => { try { localStorage.clear(); } catch { /* ignore */ } });

describe('the continuity box draws', () => {
  it('reveals itself and lists every season for a veteran', async () => {
    const ed = skeleton();
    await fill(ed, 'bowie');
    const box = ed.querySelector('#st-cont');
    expect(box.hidden, 'a two-season player must get a box').toBe(false);
    expect(ed.querySelector('#st-cont-count').textContent).toContain('2 seasons');
    expect(ed.querySelectorAll('.st-cont-season').length).toBe(2);
    const text = ed.querySelector('#st-cont-body').textContent;
    expect(text).toContain('td-9');
    expect(text).toContain('td-10');
    expect(text).toContain('Advantage hoarder');
  });

  it('stays hidden for a character who has never played', async () => {
    const ed = skeleton();
    await fill(ed, 'nobody-has-this-slug');
    expect(ed.querySelector('#st-cont').hidden,
      'a debut character gets no panel, not an empty one').toBe(true);
    expect(ed.querySelector('#st-cont-body').innerHTML).toBe('');
  });

  it('tags a Big Brother season as Big Brother on screen', async () => {
    const ed = skeleton();
    await fill(ed, 'misha');
    const tags = [...ed.querySelectorAll('.st-cont-show')].map(e => e.textContent);
    expect(tags).toEqual(['Big Brother']);
    const body = ed.querySelector('#st-cont-body').textContent;
    expect(body).toContain('bb-1');
    // Her competition record, in her show's words — never idols, and never a
    // raw database column name.
    expect(body).toContain('2 HOH wins');
    expect(body).toContain('3 times nominated');
    expect(body).not.toMatch(/idol/i);
    // (camelCase is asserted on the labels themselves in continuity.test.js —
    // textContent joins block elements with no space, so "nominated" + "Week 5"
    // reads as camelCase here and the check would be meaningless.)
  });

  it('captions a thin early season instead of leaving a silent gap', async () => {
    const ed = skeleton();
    await fill(ed, 'leshawna');
    const body = ed.querySelector('#st-cont-body').textContent;
    expect(body).toContain('no episode beats recorded');
    // The seasons themselves are still listed — thin is not missing.
    expect(ed.querySelectorAll('.st-cont-season').length).toBeGreaterThan(1);
  });

  it('shows a recurring rival with the count that makes them recurring', async () => {
    const ed = skeleton();
    await fill(ed, 'bowie');
    const ties = ed.querySelector('.st-cont-ties').textContent;
    expect(ties).toContain('Rivalries');
    expect(ties).toContain('Priya');
    expect(ties, 'two seasons opposite him is the whole point').toContain('2');
  });
});

// The continuity read is AUTHORED, unlike everything above it in the box, so
// it has to survive a Publish. Publish regenerates franchise_roster.json
// wholesale from D1 — a field the database has never heard of is deleted the
// next time somebody presses the button, silently, with no diff to notice.
// That very nearly ate twelve researched profiles, so the chain is checked
// end to end rather than trusted.
describe('the continuity read reaches the database', () => {
  const read = p => fs.readFileSync(p, 'utf8');

  it('is sent up with the roster entry, not just kept in the browser', () => {
    const studio = read('js/studio.js');
    expect(studio, 'must ride along with the bio fields into the save payload')
      .toMatch(/'continuityNote'\]\)\s*\{/);
  });

  it('has a column, a migration, and a way back out again', () => {
    const worker = read('worker/worker-studio.js');
    // Accepted on the way in…
    expect(worker).toMatch(/ROSTER_FIELDS = \[[^\]]*'continuityNote'/);
    expect(worker).toMatch(/continuity_note=excluded\.continuity_note/);
    // …and published on the way out. Missing this half is the failure that
    // looks like it works: saves succeed, and the field vanishes at Publish.
    expect(worker).toMatch(/out\.continuityNote = r\.continuity_note/);

    expect(read('worker/roster_schema.sql')).toMatch(/continuity_note TEXT/);
    // SQLite has no ADD COLUMN IF NOT EXISTS, so the column needs its own
    // migration or a deploy reaches a table that does not have it.
    expect(read('worker/roster_migration_continuity_note.sql'))
      .toMatch(/ALTER TABLE roster ADD COLUMN continuity_note TEXT/);
  });
});

describe('the fold is remembered', () => {
  it('opens closed the first time and reopens the way it was left', async () => {
    const first = skeleton();
    await fill(first, 'bowie');
    expect(first.querySelector('#st-cont').open).toBe(false);

    // The user opens it.
    const box = first.querySelector('#st-cont');
    box.open = true;
    box.dispatchEvent(new Event('toggle'));

    // A different character, later — the preference travels.
    const second = skeleton();
    await fill(second, 'leshawna');
    expect(second.querySelector('#st-cont').open,
      'a veteran history is tall; re-folding it every time gets it ignored').toBe(true);
  });
});

describe('the age box catches up with the calendar', () => {
  it('recomputes once the archive has loaded', async () => {
    // The bug as reported: a birthdate is entered, the hint appears saying
    // "at fall 2026", and the age box stays empty. The archive is fetched
    // asynchronously and it is what tells the calendar what year it is — so a
    // birthdate typed in the first moment after the editor opens was counted
    // against a present that did not exist yet. ageNow returned null, nothing
    // was written, and only the hint turned up later to say it should have.
    const ed = skeleton();
    let called = 0;
    ed._syncAge = () => { called++; };
    await fill(ed, 'bowie');
    expect(called, 'the editor is never told the present arrived').toBeGreaterThan(0);
  });

  it('does not fall over for an editor that has no age box', async () => {
    const ed = skeleton();
    await expect(fill(ed, 'bowie')).resolves.not.toThrow();
  });
});

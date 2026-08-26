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

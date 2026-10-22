// The Studio editor's "Add to <cast>" button.
//
// 2026-10-22, the user: "rn i have to save a character then search for the
// character again select it again for the button to appear". It was drawn
// only for a character already in the pool, and Save never redrew it.
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const src = fs.readFileSync(path.join(process.cwd(), 'js/studio.js'), 'utf8');
const grab = name => {
  const i = src.indexOf(`function ${name}(`);
  let d = 0, j = src.indexOf('{', i);
  for (let k = j; k < src.length; k++) { if (src[k] === '{') d++; else if (src[k] === '}' && --d === 0) { j = k + 1; break; } }
  return src.slice(i, j);
};

const button = (casts, active, roster, d) => new Function('_casts', '_activeCast', 'roster', 'd', [
  "const _esc = s => String(s == null ? '' : s);",
  'const _roster = () => roster;',
  grab('_castButtonHtml'),
  'return _castButtonHtml(d);',
].join('\n'))(casts, active, roster, d);

const CASTS = [{ id: 'c1', name: 'Season 20', slugs: ['arjun'] }];

describe('the add-to-cast button', () => {
  it('is there for a character not saved yet, and says it will save', () => {
    const html = button(CASTS, 'c1', [], { name: 'Mei', slug: 'mei' });
    expect(html).toContain('id="st-add-cast"');
    expect(html).toContain('Save &amp; add to Season 20'.replace('&amp;', '&'));
  });

  it('adds or shows membership for a saved character', () => {
    expect(button(CASTS, 'c1', [{ slug: 'mei' }], { name: 'Mei', slug: 'mei' })).toContain('☆ Add to Season 20');
    expect(button(CASTS, 'c1', [{ slug: 'arjun' }], { name: 'Arjun', slug: 'arjun' })).toContain('★ In Season 20');
  });

  it('is drawn on a blank sheet too, and only with a cast selected', () => {
    // Typing a name does not redraw the editor: a button waiting for one never came.
    expect(button(CASTS, 'c1', [], { name: '', slug: '' })).toContain('Save & add to Season 20');
    expect(button(CASTS, null, [], { name: 'Mei', slug: 'mei' })).toBe('');
  });

  it('saves first when the character is not in the pool yet', () => {
    expect(src).toMatch(/querySelector\('#st-add-cast'\)\?\.addEventListener\('click', _onCastButton\)/);
    expect(grab('_onCastButton')).toMatch(/if \(!inPool\(\)\) \{ await _save\(\); if \(!inPool\(\)\) return; \}/);
  });

  it('follows the casts: picking or making one does not redraw the editor', () => {
    expect(grab('_renderCasts')).toMatch(/_refreshCastButton\(\)/);
  });

  it('a saved sheet is the saved character, as if reopened, and the button is redrawn', () => {
    const save = grab('_save');
    expect(save).toMatch(/d\._editingSlug = d\.slug/);
    expect(save).toMatch(/_refreshCastButton\(\)/);
  });
});

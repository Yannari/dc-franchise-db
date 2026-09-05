// The Casting Studio's portrait panel, and the rules the server enforces
// behind it.
//
// The panel writes the FILE and the catalog entry in one save. Splitting those
// is how art ends up in assets/avatars/ that no season can pick and no screen
// explains — the failure the old returnee manifest existed to prevent, which
// came straight back the moment uploading and registering were separate steps.
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SHOWS } from '../js/shows.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const studio = fs.readFileSync(path.join(ROOT, 'js/studio.js'), 'utf8');
const serve = fs.readFileSync(path.join(ROOT, 'serve.py'), 'utf8');

describe('the two-slot returnee model is gone from the Studio', () => {
  it.each(['returneeDataUri', '_hasReturneeArt', '_retSlotClosed', 'st-f-ret-on', 'st-ret-note'])
    ('%s no longer appears', token => expect(studio).not.toContain(token));

  it('no longer tells the user that returning status swaps the portrait', () => {
    // The old help text said the second image was "shown instead of the main
    // portrait when this character plays a season as a returnee". That became
    // a false statement about the engine the day artwork stopped following the
    // checkbox — the §11.5 bug class, in the authoring tool.
    expect(studio).not.toMatch(/plays a season as a returnee/i);
    expect(studio).toMatch(/Returning Player<\/em> is continuity and changes no artwork/);
  });
});

describe('the portraits panel', () => {
  it('offers a list, not a fixed second slot', () => {
    expect(studio).toContain('id="st-por-list"');
    expect(studio).toContain('id="st-por-add"');
    expect(studio).toContain('function _addPortraitRow(');
  });

  it('reads its show list from the registry rather than keeping its own', () => {
    // A hard-coded show list here is the duplication docs/ADDING-A-SHOW.md
    // exists to stop: a fourth show would be missing from the dropdown and
    // nothing would say why.
    // Imported, not read off a global. `window.shows` is set by season_ref.html
    // and NOT by the page the Studio runs in, so reading it there left the
    // dropdown holding nothing but "All shows" — and the first version of this
    // test injected a fake `window.shows`, so it passed against that bug.
    expect(studio).toMatch(/import \{ SHOWS \} from '\.\/shows\.js'/);
    // Comments stripped throughout: one may name a show, or the old global, as
    // an EXAMPLE — that is documentation, not a second source of truth.
    const code = studio.replace(/^\s*(\/\/|\*|\/\*).*$/gm, '');
    expect(code, 'the Studio reads shows off a global again').not.toMatch(/window\.shows/);
    const fn = code.slice(code.indexOf('function _portraitShowOptions'),
      code.indexOf('function _portraitFilename'));
    for (const slug of ['total-drama', 'big-brother', 'traitors']) {
      expect(fn, `_portraitShowOptions names ${slug} directly`).not.toContain(slug);
    }
  });

  it('derives the filename instead of letting one be typed', () => {
    expect(studio).toContain('function _portraitFilename(');
    expect(studio).toMatch(/<code>\$\{_esc\(p\.file/);
  });

  it('surfaces legacy -returnee art that the catalog does not know about', () => {
    expect(studio).toContain('on disk, unregistered');
    expect(studio).toMatch(/_avatarList\.includes\(legacy\)/);
  });

  it('locks the show of a registered portrait', () => {
    // Re-filing a portrait under another show changes what the seasons that
    // recorded it already drew.
    expect(studio).toMatch(/p\.registered[\s\S]{0,120}disabled/);
  });

  it('sends portraits and removals with the character save', () => {
    expect(studio).toMatch(/portraits: _porRows\.map/);
    expect(studio).toContain('removePortraits: d.removePortraits');
    expect(studio).toMatch(/portraitProblems/);
  });

  it('skips an unlabelled row and says so', () => {
    // The label is what the Cast Builder shows; an unlabelled thumbnail is a
    // choice nobody can read.
    expect(studio).toMatch(/\(q\.label \|\| ''\)\.trim\(\)/);
    expect(studio).toMatch(/each needs a label/);
  });
});

describe('serve.py enforces the catalog rules', () => {
  it('reads show keys from js/shows.js', () => {
    expect(serve).toContain('def show_keys():');
    expect(serve).toContain("'js', 'shows.js'");
    for (const slug of ['total-drama', 'big-brother', 'traitors']) {
      expect(serve, `serve.py hard-codes ${slug}`).not.toContain(`'${slug}'`);
    }
  });

  it('refuses to change the file behind a registered id', () => {
    expect(serve).toMatch(/already points at/);
    expect(serve).toMatch(/rewrites the seasons that used it/);
  });

  it('refuses to unregister a portrait a saved season recorded', () => {
    expect(serve).toContain('def catalog_refs():');
    expect(serve).toMatch(/recorded in a saved season and cannot be unregistered/);
  });

  it('validates ids, shows, labels and filenames before writing', () => {
    const fn = serve.slice(serve.indexOf('def apply_portraits'), serve.indexOf('def rewrite_available_files'));
    expect(fn).toMatch(/bad portrait id/);
    expect(fn).toMatch(/unknown show/);
    expect(fn).toMatch(/needs a label/);
    expect(fn).toMatch(/unsafe filename/);
  });

  it('always leaves the player with a profile default', () => {
    const fn = serve.slice(serve.indexOf('def apply_portraits'), serve.indexOf('def rewrite_available_files'));
    expect(fn).toMatch(/'id': 'base'/);
    expect(fn).toMatch(/setdefault\('global', 'base'\)/);
  });

  it('regenerates the file inventory so new art is not marked missing', () => {
    const handler = serve.slice(serve.indexOf('# 3) portraits'), serve.indexOf('# 4) avatar PNG'));
    expect(handler).toContain('rewrite_available_files()');
    expect(handler).toContain('portrait-catalog.json');
  });
});

// ── The panel actually rendering ──────────────────────────────────────────
//
// The checks above read the source; these RUN it. A template typo in a panel
// that is only reachable through the Studio UI otherwise shows up as an empty
// box in a browser nobody has open. Pulling the pure helpers out and calling
// them is the cheapest way to see the markup.
const src = studio;
const grab = name => {
  const i = src.indexOf(`function ${name}(`);
  let d=0, j=src.indexOf('{', i);
  for (let k=j;k<src.length;k++){ if(src[k]==='{')d++; else if(src[k]==='}'&&--d===0){ j=k+1; break; } }
  return src.slice(i, j);
};
const code = [
  "const _esc = s => String(s==null?'':s).replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));",
  "const _avatarSrc = s => 'assets/avatars/'+s+'.png';",
  "const PORTRAIT_SHOW_ANY='global';",
  "const SHOWS = arguments[0];",
  grab('_portraitShowOptions'), grab('_portraitFilename'),
  grab('_portraitThumb'), grab('_renderPortraitRows'),
  'return { _portraitShowOptions, _portraitFilename, _portraitThumb, _renderPortraitRows };'
].join('\n');
const M = new Function(code)(SHOWS);   // the real registry, not a stand-in

describe('portrait panel rendering', () => {
  it('names every registered show plus All shows', () => {
    const html = M._portraitShowOptions('traitors');
    expect(html).toContain('>All shows<');
    // EVERY show in the registry, by the name the registry gives it. This is
    // the assertion that would have caught the dropdown coming up empty.
    for (const [key, s] of Object.entries(SHOWS)) {
      expect(html, `${key} is missing from the portrait show dropdown`).toContain(`>${s.name}<`);
      expect(html).toContain(`value="${key}"`);
    }
    expect(Object.keys(SHOWS).length).toBeGreaterThanOrEqual(3);
    expect(html).toMatch(/value="traitors" selected/);
  });

  it('derives readable filenames', () => {
    expect(M._portraitFilename('bowie','traitors','castle')).toBe('bowie-tr-castle.png');
    expect(M._portraitFilename('bowie','global','look-2')).toBe('bowie-look-2.png');
    expect(M._portraitFilename('rosa-maria','big-brother','house')).toBe('rosa-maria-bb-house.png');
  });

  it('renders a row per look with its controls', () => {
    const html = M._renderPortraitRows({ name:'Bowie', slug:'bowie', portraits:[
      { id:'tr-castle', show:'traitors', label:'Castle outfit', file:'bowie-tr-castle.png', registered:true, makeDefault:true },
      { id:'td-returnee', show:'total-drama', label:'Returning look', file:'bowie-returnee.png', unregistered:true },
    ]});
    expect(html).toContain('Castle outfit');
    expect(html).toContain('bowie-tr-castle.png');
    expect(html).toContain('on disk, unregistered');
    expect((html.match(/st-por-row/g)||[]).length).toBe(2);
    expect(html).toMatch(/st-por-show[^>]*disabled/);          // registered: show locked
    expect(html).toMatch(/st-por-default[^>]*checked/);        // default ticked
  });

  it('says so when there are no extra looks', () => {
    expect(M._renderPortraitRows({ name:'Ally', slug:'ally', portraits:[] }))
      .toContain('No extra looks yet');
  });

  it('escapes a label so it cannot inject markup', () => {
    const html = M._renderPortraitRows({ name:'X', slug:'x', portraits:[
      { id:'a', show:'global', label:'<img onerror=1>', file:'x-a.png' }]});
    expect(html).not.toContain('<img onerror=1>');
    expect(html).toContain('&lt;img onerror=1&gt;');
  });
});

// @vitest-environment jsdom
// ══════════════════════════════════════════════════════════════════════
// dr-genealogy.test.js — the franchise tree, and the tab that draws it
// ══════════════════════════════════════════════════════════════════════
import { afterEach, describe, expect, it, vi } from 'vitest';
import { franchiseFamilies, genealogyFor, genealogyIndex, rosterEdges, seasonEdges }
  from '../js/dr/genealogy.js';

/* A roster where the head of the house has never competed, one house that only
   a SEASON knows about, and a sister edge joining the two records together. */
const ROSTER = [
  { name: 'Axel', slug: 'axel', age: 44, drag: { family: { mother: 'Scary Girl', sisters: [] } } },
  { name: 'Julia', slug: 'julia', age: 27, drag: { family: { mother: 'Axel', sisters: [] } } },
  { name: 'Emmah', slug: 'emmah', age: 25, drag: { family: { mother: 'Axel', sisters: [] } } },
  { name: 'Brightly', slug: 'brightly', age: 29, drag: { family: { mother: 'Scary Girl', sisters: [] } } },
  { name: 'Nessa', slug: 'nessa', age: 33, drag: { family: { mother: '', sisters: ['Ivy'] } } },
  { name: 'Stranger', slug: 'stranger', age: 31 },
];
const DOCS = [{
  format: 'drag-race',
  dr: { families: [{ members: ['Ivy', 'Karol'], edges: [{ a: 'Karol', b: 'Ivy', kind: 'mother' }] }] },
}];

describe('the franchise genealogy', () => {
  const fams = franchiseFamilies({ roster: ROSTER, seasonDocs: DOCS });
  const houseOf = n => fams.find(f => f.members.includes(n));

  it('unions the character sheets with the houses the seasons built', () => {
    /* Karol exists only in a season document; Nessa only on the roster; the
       sister edge between Nessa and Ivy is what joins the two records into one
       house. Neither source alone contains this family. */
    expect(houseOf('Karol')).toBeTruthy();
    expect(houseOf('Karol').members.sort()).toEqual(['Ivy', 'Karol', 'Nessa']);
    expect(seasonEdges(DOCS)).toHaveLength(1);
    expect(rosterEdges(ROSTER).length).toBeGreaterThan(3);
  });

  it('keeps a queen who has never competed', () => {
    // Scary Girl is on no roster and in no season, and she is the head of the
    // house. Dropping her would break the line that runs through her and
    // silently split one family into two.
    expect(houseOf('Scary Girl')).toBeTruthy();
    expect(houseOf('Julia').members).toContain('Scary Girl');
    expect(ROSTER.some(r => r.name === 'Scary Girl')).toBe(false);
  });

  it('records the same relation once however many seasons saw it', () => {
    const twice = franchiseFamilies({ roster: ROSTER, seasonDocs: [...DOCS, ...DOCS] });
    expect(twice.map(f => f.members.length).sort())
      .toEqual(fams.map(f => f.members.length).sort());
  });

  it('answers a different question for each queen in the same house', () => {
    /* THE POINT OF THE WHOLE FEATURE. The house never changes; who is asking
       does. Brightly is Julia's aunt and Julia is Brightly's niece — the same
       two people, the same tree, two different sentences. */
    const j = genealogyFor(fams, 'Julia');
    const b = genealogyFor(fams, 'Brightly');
    const term = (g, who) => g.nodes.find(n => n.name === who).toFocus;
    expect(term(j, 'Brightly')).toBe('aunt');
    expect(term(b, 'Julia')).toBe('niece');
    expect(term(j, 'Scary Girl')).toBe('grandmother');
    expect(term(j, 'Emmah')).toBe('sister');
    // Same house, same shape, both times.
    expect(j.nodes.map(n => n.name)).toEqual(b.nodes.map(n => n.name));
    expect(j.nodes.map(n => n.depth)).toEqual(b.nodes.map(n => n.depth));
    // And exactly one of them is the queen asked about.
    expect(j.nodes.filter(n => n.focus).map(n => n.name)).toEqual(['Julia']);
  });

  it('has nothing to say about a queen in no family', () => {
    expect(genealogyFor(fams, 'Stranger')).toBeNull();
    expect(genealogyIndex(fams).map(x => x.name)).not.toContain('Stranger');
  });

  it('builds nothing at all from a franchise that has authored nothing', () => {
    expect(franchiseFamilies({ roster: [{ name: 'A' }, { name: 'B' }], seasonDocs: [] }))
      .toEqual([]);
  });
});

// ══════════════════════════════════════════════════════════════════════
// The tab
// ══════════════════════════════════════════════════════════════════════
describe('the Families tab', () => {
  const mount = () => {
    document.body.innerHTML = '<input id="fam-search"><div id="fam-list"></div><div id="fam-tree"></div>';
    // The page fetches the season index and then each document; this stands in.
    global.fetch = vi.fn(url => Promise.resolve(String(url).includes('seasons_database')
      ? { ok: true, json: () => Promise.resolve({ seasons: [{ format: 'drag-race', seasonId: 'dr-1' }] }) }
      : { ok: true, json: () => Promise.resolve(DOCS[0]) }));
    return {
      list: () => document.getElementById('fam-list'),
      tree: () => document.getElementById('fam-tree'),
    };
  };
  afterEach(() => { delete global.fetch; document.body.innerHTML = ''; });

  it('lists every house and answers from whoever is clicked', async () => {
    const el = mount();
    const { buildFamilies } = await import('../js/genealogy-tab.js');
    await buildFamilies(ROSTER);

    expect(el.list().querySelectorAll('.fam-q').length).toBeGreaterThan(4);
    expect(el.tree().textContent).toContain('Pick a queen');

    el.list().querySelector('[data-q="Julia"]').click();
    expect(el.tree().textContent).toContain('as Julia sees it');
    expect(el.tree().textContent).toContain('her grandmother');
    expect(el.tree().textContent).toContain('her aunt');
    // Every name links to that queen's article, where the same tree is drawn
    // centred on HER — clicking through is how you walk a family.
    expect(el.tree().innerHTML).toContain('player.html?player=brightly');
    // The head of the house never competed, so she is named and not linked.
    expect(el.tree().innerHTML).toContain('fam-off');

    // CLICKING RE-CENTRES: the same pair, the opposite word.
    el.list().querySelector('[data-q="Brightly"]').click();
    expect(el.tree().textContent).toContain('as Brightly sees it');
    expect(el.tree().textContent).toContain('her niece');
  });

  it('filters the list without touching the tree', async () => {
    const el = mount();
    const { buildFamilies } = await import('../js/genealogy-tab.js');
    await buildFamilies(ROSTER);
    el.list().querySelector('[data-q="Julia"]').click();

    const search = document.getElementById('fam-search');
    search.value = 'kar';
    search.dispatchEvent(new window.Event('input'));
    expect([...el.list().querySelectorAll('.fam-q')].map(b => b.dataset.q)).toEqual(['Karol']);
    // The tree still answers for the queen who was picked: searching is
    // looking, not choosing.
    expect(el.tree().textContent).toContain('as Julia sees it');

    search.value = 'zzz';
    search.dispatchEvent(new window.Event('input'));
    expect(el.list().textContent).toContain('Nobody by that name');
  });

  it('says where to author one when the franchise has none', async () => {
    const el = mount();
    // Nothing authored on the sheets AND no season that recorded a house --
    // the mock above serves a season that has one, which is not this case.
    global.fetch = vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ seasons: [] }) }));
    const { buildFamilies } = await import('../js/genealogy-tab.js');
    await buildFamilies([{ name: 'A' }, { name: 'B' }]);
    // An empty state that says where the field is, rather than a blank box.
    expect(el.tree().textContent).toContain('No drag families recorded yet');
    expect(el.tree().textContent).toContain('Drag Race');
  });
});

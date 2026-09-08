// ═══════════════════════════════════════════════════════════════════
// genealogy-tab.js — the Families tab on the franchise page
// ═══════════════════════════════════════════════════════════════════
//
// A module rather than another block inside franchise.html, because the page's
// inline script cannot be imported and therefore cannot be tested — and the
// interesting part of this tab is not the markup, it is that clicking a queen
// changes the ANSWERS ("her aunt" becomes "her niece") without changing the
// house. That is a claim worth a test.
//
// The genealogy itself is js/dr/genealogy.js. This draws it.
import { franchiseFamilies, genealogyFor } from './dr/genealogy.js';

/** Fetched documents, keyed by which seasons they are. */
const _docCache = { key: null, docs: [] };

// Names are authored text and go into markup, so they are escaped. Local to
// this tab: the rest of the page builds its own strings its own way.
const esc = v => String(v ?? '').replace(/[&<>"]/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/**
 * The Families tab: look anybody up, and see the house from where she stands.
 *
 * Clicking a queen RE-CENTRES the tree rather than opening anything: the shape
 * of the house never changes, but "her aunt" and "her grandmother" are answers
 * to a question about one person, and the question is who you clicked. Her
 * name in the tree still links to her article, where the same tree is drawn.
 */
export async function buildFamilies(rosterDb) {
  const listEl = document.getElementById('fam-list');
  const treeEl = document.getElementById('fam-tree');
  const search = document.getElementById('fam-search');
  if (!listEl || !treeEl) return;

  /* fetch() resolves against the PAGE, dynamic import against this MODULE --
     a difference that only shows up once a file moves, so the genealogy is a
     static import and the two data files stay page-relative. */
  const seasonsIdx = await fetch('seasons_database.json')
    .then(r => r.json()).catch(() => null);
  /* The wiki draws once with whatever is loaded and again when the season
     documents land, so this runs twice on a normal page view. Cached: the
     franchise's houses do not change between two paints of the same page. */
  const roster = rosterDb?.players || rosterDb || [];
  const slugOf = new Map(roster.filter(r => r && r.name).map(r => [r.name, r.slug]));

  // Every drag season we can find, for the houses a season built by itself.
  const ids = (seasonsIdx?.seasons || seasonsIdx || [])
    .filter(x => (x.format || x.show) === 'drag-race')
    .map(x => x.seasonId || `dr-${x.seasonNumber || x.season}`);
  const key = [...new Set(ids)].sort().join(',');
  if (_docCache.key !== key) {
    _docCache.key = key;
    _docCache.docs = (await Promise.all([...new Set(ids)].map(id =>
      fetch(`data/seasons/${id}-data.json`).then(r => r.ok ? r.json() : null).catch(() => null)
    ))).filter(Boolean);
  }
  const docs = _docCache.docs;

  const fams = franchiseFamilies({ roster, seasonDocs: docs });
  if (!fams.length) {
    listEl.innerHTML = '';
    treeEl.innerHTML = `<div class="fam-empty">No drag families recorded yet.<br><br>
      A queen's drag mother and sisters are authored on her character sheet, in
      the Casting Studio under <strong>Drag Race — craft</strong>. Every house here is
      built from those, plus any the seasons put together themselves.</div>`;
    return;
  }

  let focus = null;
  const draw = () => {
    const q = (search?.value || '').toLowerCase().trim();
    listEl.innerHTML = fams.map(f => {
      const members = f.members.filter(m => !q || m.toLowerCase().includes(q));
      if (!members.length) return '';
      return `<div class="fam-house"><h4>${esc(f.name)}</h4>${members.map(m =>
        `<button class="fam-q${m === focus ? ' active' : ''}" data-q="${esc(m)}">${esc(m)}</button>`
      ).join('')}</div>`;
    }).join('') || '<div class="fam-empty">Nobody by that name.</div>';

    if (!focus) {
      treeEl.innerHTML = '<div class="fam-empty">Pick a queen.</div>';
      return;
    }
    const g = genealogyFor(fams, focus);
    treeEl.innerHTML = `<h3 style="margin:0 0 4px">${esc(g.family.name)}</h3>
      <p style="opacity:.6;font-size:12px;margin:0 0 14px">as ${esc(focus)} sees it</p>`
      + g.nodes.map(n => {
        const slug = slugOf.get(n.name);
        const name = slug
          ? `<a href="player.html?player=${encodeURIComponent(slug)}">${esc(n.name)}</a>`
          : `<span class="fam-off" title="has never competed">${esc(n.name)}</span>`;
        return `<div class="fam-row${n.focus ? ' is-focus' : ''}" style="margin-left:${n.depth * 22}px">
          ${name}<span class="fam-term">${n.focus ? 'this queen'
            : n.toFocus ? `her ${esc(n.toFocus)}` : ''}</span></div>`;
      }).join('');
  };

  listEl.addEventListener('click', e => {
    const btn = e.target.closest('.fam-q');
    if (!btn) return;
    focus = btn.dataset.q;
    draw();
  });
  search?.addEventListener('input', draw);
  draw();
}


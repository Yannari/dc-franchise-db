// ══════════════════════════════════════════════════════════════════════
// vp-tr/web.js — the reads, the ties, and who is lying to whom
// ══════════════════════════════════════════════════════════════════════
//
// A castle is not decided by who likes whom — it is decided by who SUSPECTS
// whom and who TRUSTS whom, and in this show those two matter more than a bond
// ever does. Every other screen tells the story of one night; this one is the
// standing picture underneath it — the pact, the castle's collective read, and
// each living player's own map of who they are watching and who they have
// stopped watching — as it stands this episode.
//
// AUDIENCE PRIVILEGE. `beliefs.truth` names every alignment, so on the audience
// layer the pact is drawn in the open and each read is marked right or wrong.
// On a player layer that truth is withheld — the same rule the suspicion screen
// keeps — so a viewer watching as one player sees only what the castle can see.
//
// EVERYTHING IS PER-EPISODE. It reads `ep.tr.beliefs` (the snapshot the
// suspicion screen also draws) and `ep.tr.threads`, both frozen on the row when
// the night was played — so a replayed episode shows the castle as it stood
// THEN, never as it ended up.

import { pronouns } from '../players.js';

// ── portraits ─────────────────────────────────────────────────────────
function _slug(name) {
  return String(name || '').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}
function _av(name, size = 44) {
  const s = _slug(name);
  const init = (String(name || '?').trim()[0] || '?').toUpperCase();
  return '<span class="wb-av" style="width:' + size + 'px;height:' + size + 'px">'
    + '<img src="assets/avatars/' + s + '.png" alt="" '
    + 'onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'">'
    + '<span class="wb-av-i" style="display:none">' + init + '</span></span>';
}
const _esc = s => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// ── the data, read off the snapshot ─────────────────────────────────────
function _view(ep, observer) {
  const b = ep && ep.tr && ep.tr.beliefs;
  if (!b || !(b.living || []).length) return null;
  const obs = observer == null ? 'audience' : String(observer);
  const isAudience = obs === 'audience';
  const watcher = obs.indexOf('player:') === 0 ? obs.slice('player:'.length) : null;
  const living = [...(b.living || [])];
  // Truth is the audience's alone. A player layer gets an empty map and the
  // screen simply does not draw an alignment anywhere.
  const truth = isAudience ? (b.truth || {}) : {};

  // Each living player's own map: who they are watching (score > 0) and who
  // they have decided to stop watching (score < 0). Sorted by conviction.
  const reads = {};
  for (const board of (b.boards || [])) {
    if (!board || !board.observer) continue;
    const suspects = (board.entries || []).filter(e => e && e.score > 0)
      .sort((a, c) => c.score - a.score).map(e => e.name);
    const trusts = (board.entries || []).filter(e => e && e.score < 0)
      .sort((a, c) => a.score - c.score).map(e => e.name);
    reads[board.observer] = { suspects, trusts };
  }
  // Who watches each PERSON, gathered from the boards above — the other half of
  // the same fact, and the one a player never gets to see about themselves.
  const watchedBy = {};
  for (const [who, r] of Object.entries(reads)) {
    for (const n of r.suspects) (watchedBy[n] ||= []).push(who);
  }

  // The pact, on the audience layer only. Recruited members carry the episode
  // they turned, off `flips`.
  const flipEp = {};
  for (const f of (b.flips || [])) flipEp[f.name] = f.ep;
  const pact = isAudience
    ? living.filter(n => truth[n] === 'traitor')
    : [];

  // Open trust/suspicion ties between named pairs, hottest first. A castle's
  // real structure is these — not a bond number.
  const threads = ((ep.tr && ep.tr.threads) || [])
    .filter(t => t && t.state === 'open' && (t.parties || []).length >= 2
      && (t.kind === 'suspicion' || t.kind === 'trust'))
    .map(t => ({ kind: t.kind, parties: t.parties.slice(0, 2), heat: t.heat || 1,
      since: t.openedEp }))
    .sort((a, c) => c.heat - a.heat)
    .slice(0, 10);

  return {
    ep: b.ep, isAudience, watcher, living, truth, reads, watchedBy, pact, flipEp,
    castle: b.castle || [], threads,
    faithfulsLeft: isAudience ? living.filter(n => truth[n] === 'faithful').length : null,
    traitorsLeft: isAudience ? pact.length : null,
  };
}

// ── the screen ──────────────────────────────────────────────────────────
export function rpBuildWeb(ep, observer = 'audience') {
  const v = _view(ep, observer);
  const css = '<style>' + WB_CSS + '</style>';
  if (!v) {
    return '<div class="wb-root">' + css
      + '<div class="wb-shell"><div class="wb-empty">'
      + '<div class="wb-empty-h">Nothing To Read Yet</div>'
      + '<p>The castle has not formed a suspicion anyone can point at. That is its own '
      + 'kind of information: everybody is still watching everybody.</p>'
      + '</div></div></div>';
  }

  // ── the pact ──
  let pactHtml = '';
  if (v.isAudience) {
    pactHtml = '<section class="wb-sec"><div class="wb-sec-h wb-h-traitor">The Pact</div>'
      + '<p class="wb-lead">The ' + v.pact.length + ' who know. Everyone else in the castle is '
      + 'guessing.</p>'
      + '<div class="wb-pact">'
      + (v.pact.length
        ? v.pact.map(n => '<div class="wb-pact-card">' + _av(n, 58)
            + '<div class="wb-pact-nm">' + _esc(n) + '</div>'
            + (v.flipEp[n]
              ? '<div class="wb-pact-tag">recruited · ep ' + v.flipEp[n] + '</div>'
              : '<div class="wb-pact-tag">from the first night</div>') + '</div>').join('')
        : '<div class="wb-none">No Traitor is left standing.</div>')
      + '</div></section>';
  }

  // ── the room's collective suspicion ──
  const topCastle = (v.castle || []).filter(r => r.accusers > 0).slice(0, 8);
  const maxW = topCastle.reduce((m, r) => Math.max(m, r.weight || 0), 0) || 1;
  const castleHtml = '<section class="wb-sec"><div class="wb-sec-h">Where The Castle Is Looking</div>'
    + '<p class="wb-lead">The Faithfuls’ suspicion, added up the way the table resolves it — '
    + 'the taller the bar, the more of the room is pointing, and the harder.</p>'
    + '<div class="wb-bars">'
    + (topCastle.length
      ? topCastle.map(r => {
        const pct = Math.max(6, Math.round((r.weight / maxW) * 100));
        const real = v.isAudience ? v.truth[r.name] : null;
        const mark = real === 'traitor'
          ? '<span class="wb-mark wb-mark-hit" title="Actually a Traitor">on a Traitor</span>'
          : real === 'faithful'
            ? '<span class="wb-mark wb-mark-miss" title="Actually a Faithful">on a Faithful</span>'
            : '';
        return '<div class="wb-bar-row">'
          + '<div class="wb-bar-face">' + _av(r.name, 34)
          + '<span class="wb-bar-nm">' + _esc(r.name) + '</span></div>'
          + '<div class="wb-bar-track"><div class="wb-bar-fill' + (real === 'traitor' ? ' hit' : '')
          + '" style="width:' + pct + '%"></div></div>'
          + '<div class="wb-bar-meta">' + r.accusers + (r.accusers === 1 ? ' voice' : ' voices')
          + ' ' + mark + '</div></div>';
      }).join('')
      : '<div class="wb-none">Nobody has settled on a name yet.</div>')
    + '</div></section>';

  // ── every living player's own read ──
  const order = [...v.living].sort((a, c) => {
    // Traitors first on the audience layer (so the pact's reads read together),
    // then alphabetical; on a player layer, plain alphabetical.
    if (v.isAudience) {
      const ta = v.truth[a] === 'traitor', tc = v.truth[c] === 'traitor';
      if (ta !== tc) return ta ? -1 : 1;
    }
    return String(a).localeCompare(String(c));
  });
  const readsHtml = '<section class="wb-sec"><div class="wb-sec-h">Every Read In The Room</div>'
    + '<p class="wb-lead">What each player is watching, and who they have quietly stopped '
    + 'watching. A Traitor’s map is the tell: they suspect out loud and trust the pact in '
    + 'silence.</p>'
    + '<div class="wb-grid">'
    + order.map(n => {
      const r = v.reads[n] || { suspects: [], trusts: [] };
      const align = v.isAudience ? v.truth[n] : null;
      const chip = align === 'traitor' ? '<span class="wb-chip wb-chip-t">Traitor</span>'
        : align === 'faithful' ? '<span class="wb-chip wb-chip-f">Faithful</span>' : '';
      const watchers = (v.watchedBy[n] || []).length;
      const line = (label, names, cls) => names.length
        ? '<div class="wb-read ' + cls + '"><span class="wb-read-k">' + label + '</span>'
          + '<span class="wb-read-v">' + names.slice(0, 4).map(_esc).join(', ')
          + (names.length > 4 ? ' +' + (names.length - 4) : '') + '</span></div>'
        : '';
      return '<div class="wb-card' + (align === 'traitor' ? ' is-t' : '') + '">'
        + '<div class="wb-card-top">' + _av(n, 40)
        + '<div class="wb-card-id"><div class="wb-card-nm">' + _esc(n) + '</div>' + chip + '</div>'
        + '</div>'
        + line('suspects', r.suspects, 'wb-susp')
        + line('trusts', r.trusts, 'wb-trust')
        + (watchers
          ? '<div class="wb-read wb-watched"><span class="wb-read-k">watched by</span>'
            + '<span class="wb-read-v">' + watchers + (watchers === 1 ? ' player' : ' players')
            + '</span></div>'
          : '<div class="wb-read wb-watched wb-clear"><span class="wb-read-k">watched by</span>'
            + '<span class="wb-read-v">nobody, yet</span></div>')
        + '</div>';
    }).join('')
    + '</div></section>';

  // ── the ties: named trust/suspicion between pairs ──
  const tiesHtml = v.threads.length
    ? '<section class="wb-sec"><div class="wb-sec-h">The Ties That Are Live</div>'
      + '<p class="wb-lead">The running trust and suspicion between two names — the threads '
      + 'the castle keeps pulling on.</p>'
      + '<div class="wb-ties">'
      + v.threads.map(t => {
        const [a, c] = t.parties;
        const isSusp = t.kind === 'suspicion';
        return '<div class="wb-tie ' + (isSusp ? 'wb-tie-s' : 'wb-tie-t') + '">'
          + '<div class="wb-tie-pair">' + _av(a, 34)
          + '<span class="wb-tie-link">' + (isSusp ? 'suspects' : 'trusts') + '</span>'
          + _av(c, 34) + '</div>'
          + '<div class="wb-tie-nm">' + _esc(a) + ' → ' + _esc(c) + '</div>'
          + '<div class="wb-tie-meta">since ep ' + t.since + '</div></div>';
      }).join('')
      + '</div></section>'
    : '';

  // ── header ──
  const count = v.isAudience
    ? '<div class="wb-count"><span class="wb-count-f">' + v.faithfulsLeft + ' Faithful</span>'
      + '<span class="wb-count-x">vs</span>'
      + '<span class="wb-count-t">' + v.traitorsLeft + ' Traitor'
      + (v.traitorsLeft === 1 ? '' : 's') + '</span></div>'
    : '<div class="wb-count"><span class="wb-count-f">' + v.living.length
      + ' still in the castle</span></div>';
  const badge = v.isAudience
    ? '<div class="wb-observer">' + _eye() + ' Observer: audience <em>&mdash; you can see the pact '
      + 'and mark every read right or wrong; nobody in the castle can</em></div>'
    : '<div class="wb-observer">' + _eye() + ' Observer: ' + _esc(v.watcher || 'a player')
      + ' <em>&mdash; who suspects whom is public; who is a Traitor is not</em></div>';

  return '<div class="wb-root">' + css
    + '<div class="wb-shell">'
    + '<header class="wb-head">'
    + '<div class="wb-title">The Web</div>'
    + '<div class="wb-sub">Who is watching whom, this far in</div>'
    + count + '</header>'
    + badge
    + pactHtml + castleHtml + readsHtml + tiesHtml
    + '</div></div>';
}

function _eye() {
  return '<svg viewBox="0 0 24 14" width="15" height="9" style="vertical-align:-1px">'
    + '<path d="M1 7 C6 1 18 1 23 7 C18 13 6 13 1 7 Z" fill="none" stroke="currentColor" '
    + 'stroke-width="1.3"/><circle cx="12" cy="7" r="2.4" fill="currentColor"/></svg>';
}

const WB_CSS = `
.wb-root{--wb-ink:#e8ddc7;--wb-dim:#a99b7f;--wb-bg:#0d0b09;--wb-panel:#171310;
  --wb-line:rgba(201,162,74,.18);--wb-gold:#c9a24a;--wb-red:#c0392b;--wb-green:#6ea36a;
  --wb-hand:Georgia,'Times New Roman',serif;
  color:var(--wb-ink);font-family:var(--wb-hand);line-height:1.5}
.wb-shell{max-width:1060px;margin:0 auto;padding:22px 20px 60px;background:
  radial-gradient(120% 90% at 50% 0,#1a1512 0,var(--wb-bg) 70%)}
.wb-head{text-align:center;padding:10px 0 18px;border-bottom:1px solid var(--wb-line)}
.wb-title{font-size:40px;font-weight:800;letter-spacing:.02em;
  background:linear-gradient(180deg,#f3e6c5,#c9a24a);-webkit-background-clip:text;
  background-clip:text;color:transparent}
.wb-sub{font-style:italic;color:var(--wb-dim);font-size:16px;margin-top:2px}
.wb-count{display:flex;gap:10px;justify-content:center;align-items:center;margin-top:12px;
  font-size:14px;letter-spacing:.04em}
.wb-count-f{color:var(--wb-ink)}.wb-count-t{color:#e88b82}.wb-count-x{color:var(--wb-dim);font-style:italic}
.wb-observer{margin:14px 0 6px;font-size:12.5px;color:var(--wb-dim);text-align:center}
.wb-observer em{opacity:.8}
.wb-sec{margin-top:30px}
.wb-sec-h{font-size:13px;letter-spacing:.22em;text-transform:uppercase;color:var(--wb-gold);
  padding-bottom:8px;border-bottom:1px solid var(--wb-line);margin-bottom:12px}
.wb-h-traitor{color:#e88b82}
.wb-lead{color:var(--wb-dim);font-size:14.5px;font-style:italic;margin:0 0 14px}
.wb-none{color:var(--wb-dim);font-style:italic;padding:8px 2px}
.wb-av{position:relative;display:inline-flex;border-radius:50%;overflow:hidden;flex:0 0 auto;
  background:#241d16;border:1px solid rgba(201,162,74,.3)}
.wb-av img{width:100%;height:100%;object-fit:cover}
.wb-av-i{align-items:center;justify-content:center;width:100%;height:100%;font-weight:700;
  color:var(--wb-dim);font-size:15px}
/* the pact */
.wb-pact{display:flex;flex-wrap:wrap;gap:12px}
.wb-pact-card{background:linear-gradient(180deg,#2a1613,#180d0b);
  border:1px solid rgba(192,57,43,.5);border-radius:12px;padding:14px 16px;text-align:center;
  min-width:118px}
.wb-pact-card .wb-av{border-color:rgba(192,57,43,.7);box-shadow:0 0 16px rgba(192,57,43,.35)}
.wb-pact-nm{font-weight:700;margin-top:8px;font-size:16px}
.wb-pact-tag{font-size:11px;color:#d98b83;font-style:italic;margin-top:2px}
/* castle bars */
.wb-bars{display:flex;flex-direction:column;gap:8px}
.wb-bar-row{display:grid;grid-template-columns:160px 1fr auto;gap:12px;align-items:center}
.wb-bar-face{display:flex;align-items:center;gap:8px;min-width:0}
.wb-bar-nm{font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.wb-bar-track{height:12px;background:rgba(255,255,255,.05);border-radius:6px;overflow:hidden}
.wb-bar-fill{height:100%;background:linear-gradient(90deg,#8a7327,var(--wb-gold));border-radius:6px}
.wb-bar-fill.hit{background:linear-gradient(90deg,#7a241c,var(--wb-red))}
.wb-bar-meta{font-size:12px;color:var(--wb-dim);white-space:nowrap}
.wb-mark{font-size:11px;padding:1px 6px;border-radius:8px;margin-left:6px;font-style:italic}
.wb-mark-hit{background:rgba(192,57,43,.18);color:#e88b82}
.wb-mark-miss{background:rgba(110,163,106,.14);color:#9ec79a}
/* every read grid */
.wb-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(228px,1fr));gap:12px}
.wb-card{background:var(--wb-panel);border:1px solid var(--wb-line);border-radius:12px;padding:12px 14px}
.wb-card.is-t{border-color:rgba(192,57,43,.4);background:linear-gradient(180deg,#1c1310,#140d0b)}
.wb-card-top{display:flex;align-items:center;gap:10px;margin-bottom:8px}
.wb-card-nm{font-weight:700;font-size:15.5px}
.wb-chip{font-size:10.5px;letter-spacing:.08em;text-transform:uppercase;padding:1px 7px;
  border-radius:8px;display:inline-block;margin-top:2px}
.wb-chip-t{background:rgba(192,57,43,.22);color:#e88b82}
.wb-chip-f{background:rgba(201,162,74,.16);color:var(--wb-gold)}
.wb-read{display:flex;gap:8px;font-size:13px;padding:3px 0;align-items:baseline}
.wb-read-k{flex:0 0 74px;color:var(--wb-dim);font-style:italic;font-size:12px}
.wb-read-v{color:var(--wb-ink)}
.wb-susp .wb-read-v{color:#e0a19a}
.wb-trust .wb-read-v{color:#a9c9a4}
.wb-watched{border-top:1px dashed var(--wb-line);margin-top:6px;padding-top:6px}
.wb-watched .wb-read-v{color:var(--wb-dim)}
.wb-clear .wb-read-v{opacity:.7}
/* ties */
.wb-ties{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px}
.wb-tie{border:1px solid var(--wb-line);border-radius:10px;padding:10px 12px;background:var(--wb-panel);
  text-align:center}
.wb-tie-s{border-color:rgba(192,57,43,.32)}
.wb-tie-t{border-color:rgba(110,163,106,.3)}
.wb-tie-pair{display:flex;align-items:center;justify-content:center;gap:8px}
.wb-tie-link{font-size:11px;font-style:italic;color:var(--wb-dim)}
.wb-tie-s .wb-tie-link{color:#e0a19a}.wb-tie-t .wb-tie-link{color:#a9c9a4}
.wb-tie-nm{font-size:13px;margin-top:6px;font-weight:600}
.wb-tie-meta{font-size:11px;color:var(--wb-dim);font-style:italic;margin-top:1px}
.wb-empty{text-align:center;padding:60px 20px;color:var(--wb-dim)}
.wb-empty-h{font-size:22px;color:var(--wb-ink);margin-bottom:8px}
@media(max-width:560px){.wb-bar-row{grid-template-columns:110px 1fr}.wb-bar-meta{grid-column:1/-1}}
`;

// A castle player's pronouns, kept here so a future line can use them without
// re-importing; unused for now but part of the module's public surface.
export function _webPronouns(name) { return pronouns(name) || {}; }

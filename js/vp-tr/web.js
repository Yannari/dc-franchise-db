// ══════════════════════════════════════════════════════════════════════
// vp-tr/web.js — the room's relationships, ruled off at the end of the Day Book
// ══════════════════════════════════════════════════════════════════════
//
// A ruled-off section the Day Book (js/vp-tr/house-status.js) prints at the
// foot of the episode: who is close to whom, who cannot stand whom, who is
// secretly in the pact, and who each player is watching. Everything is read off
// the per-episode snapshot (`ep.tr.bonds`, `ep.tr.beliefs`, `ep.tr.roleHistory`)
// so a replayed episode shows the room as it stood THEN, never as it ended.
//
// AUDIENCE PRIVILEGE. `beliefs.truth` names every alignment, so on the audience
// layer the pact is drawn in the open and each read is marked right or wrong.
// On a player layer that truth is withheld — the same rule the suspicion screen
// keeps.
//
// FRIENDSHIP AND ENMITY LEAD. Bonds are the thing a viewer feels first — who
// likes whom — so they are drawn first and biggest, as paired portraits with a
// warm/cold cord between them. Trust and suspicion (which decide the votes) come
// under them, because they are the sharper, quieter layer.

import { pronouns } from '../players.js';
import { _portrait, _icon } from './conclave.js';

function _slug(name) {
  return String(name || '').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}
function _av(name, size = 40) { return _portrait(_slug(name), name, size); }
const _esc = s => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// ── the data, off the per-episode snapshot ──────────────────────────────
function _view(ep, observer) {
  const rec = ep && ep.tr;
  if (!rec) return null;
  const obs = observer == null ? 'audience' : String(observer);
  const isAudience = obs === 'audience';
  const b = rec.beliefs;
  const living = (b && b.living && b.living.length) ? [...b.living] : [...(rec.living || [])];
  if (!living.length) return null;
  const truth = (isAudience && b) ? (b.truth || {}) : {};

  // FRIENDSHIPS AND ENMITIES — off the frozen bond snapshot. Living pairs only.
  const liveSet = new Set(living);
  const bonds = (rec.bonds || []).filter(x => liveSet.has(x.a) && liveSet.has(x.b));
  const friendships = bonds.filter(x => x.v > 0).sort((a, c) => c.v - a.v);
  const enmities = bonds.filter(x => x.v < 0).sort((a, c) => a.v - c.v);

  // THE PACT (audience only), recruits marked with the episode they turned.
  const flipEp = {};
  for (const f of ((b && b.flips) || [])) flipEp[f.name] = f.ep;
  const pact = isAudience ? living.filter(n => truth[n] === 'traitor') : [];

  // THE READS — who each player watches (positive score) and trusts (negative).
  const reads = {};
  for (const board of ((b && b.boards) || [])) {
    if (!board || !board.observer) continue;
    const suspects = (board.entries || []).filter(e => e && e.score > 0)
      .sort((a, c) => c.score - a.score).map(e => e.name);
    reads[board.observer] = suspects;
  }
  const castle = (b && b.castle || []).filter(r => r.accusers > 0).slice(0, 6);

  return {
    isAudience, living, truth, friendships, enmities, pact, flipEp, reads, castle,
    faithfulsLeft: isAudience ? living.filter(n => truth[n] === 'faithful').length : null,
    traitorsLeft: isAudience ? pact.length : null,
  };
}

// ── a paired-portrait card: two faces, a warm or cold cord between them ──
function _pairCard(x, kind) {
  const strength = Math.min(10, Math.abs(x.v));
  const pct = Math.round((strength / 10) * 100);
  return '<div class="wb-pair wb-pair-' + kind + '">'
    + '<div class="wb-pair-faces">'
    + '<span class="wb-pf">' + _av(x.a, 46) + '<span class="wb-pf-nm">' + _esc(x.a) + '</span></span>'
    + '<span class="wb-cord"><span class="wb-cord-fill" style="width:' + pct + '%"></span></span>'
    + '<span class="wb-pf">' + _av(x.b, 46) + '<span class="wb-pf-nm">' + _esc(x.b) + '</span></span>'
    + '</div>'
    + '<div class="wb-pair-tag">' + (kind === 'friend' ? 'close' : 'at odds')
    + ' &middot; ' + strength + '/10</div></div>';
}

// ── the section, for the Day Book to embed ──────────────────────────────
export function rpBuildRelationships(ep, observer = 'audience') {
  const v = _view(ep, observer);
  if (!v) return '';
  const css = '<style>' + WB_CSS + '</style>';

  // Friendships & enmities — the lead.
  const friendHtml = v.friendships.length
    ? v.friendships.slice(0, 6).map(x => _pairCard(x, 'friend')).join('')
    : '<div class="wb-none">No real friendships have formed yet.</div>';
  const enemyHtml = v.enmities.length
    ? v.enmities.slice(0, 6).map(x => _pairCard(x, 'enemy')).join('')
    : '<div class="wb-none">Nobody has made an open enemy yet.</div>';

  // The pact (audience).
  const pactHtml = v.isAudience
    ? '<div class="wb-block"><div class="wb-block-h wb-h-t">The Pact</div>'
      + '<div class="wb-pact">'
      + (v.pact.length
        ? v.pact.map(n => '<div class="wb-pact-card">' + _av(n, 48)
            + '<div class="wb-pact-nm">' + _esc(n) + '</div>'
            + '<div class="wb-pact-tag">' + (v.flipEp[n] ? 'recruited &middot; ep ' + v.flipEp[n] : 'from the first night') + '</div></div>').join('')
        : '<div class="wb-none">No Traitor is left standing.</div>')
      + '</div></div>'
    : '';

  // The reads — who the room most suspects, marked right/wrong on the audience layer.
  const maxW = v.castle.reduce((m, r) => Math.max(m, r.weight || 0), 0) || 1;
  const readsHtml = '<div class="wb-block"><div class="wb-block-h">Who The Room Is Watching</div>'
    + (v.castle.length
      ? '<div class="wb-bars">' + v.castle.map(r => {
        const pct = Math.max(8, Math.round((r.weight / maxW) * 100));
        const real = v.isAudience ? v.truth[r.name] : null;
        const mark = real === 'traitor' ? '<span class="wb-mark hit">on a Traitor</span>'
          : real === 'faithful' ? '<span class="wb-mark miss">on a Faithful</span>' : '';
        return '<div class="wb-bar-row"><div class="wb-bar-face">' + _av(r.name, 30)
          + '<span class="wb-bar-nm">' + _esc(r.name) + '</span></div>'
          + '<div class="wb-bar-track"><div class="wb-bar-fill' + (real === 'traitor' ? ' hit' : '')
          + '" style="width:' + pct + '%"></div></div>'
          + '<div class="wb-bar-meta">' + r.accusers + (r.accusers === 1 ? ' voice' : ' voices') + ' ' + mark + '</div></div>';
      }).join('') + '</div>'
      : '<div class="wb-none">The room has not settled on a name yet.</div>')
    + '</div>';

  const count = v.isAudience
    ? v.faithfulsLeft + ' Faithful vs ' + v.traitorsLeft + ' Traitor' + (v.traitorsLeft === 1 ? '' : 's')
    : v.living.length + ' still in the castle';

  return css + '<section class="wb-sec">'
    + '<div class="wb-rule"><i></i>' + _icon('seal', 30, '#8e1526') + '<i></i></div>'
    + '<div class="wb-hd">The Room</div>'
    + '<div class="wb-hd-sub">Who is close, who is at odds, and who is watching whom — ' + count + '</div>'
    + '<div class="wb-two">'
    + '<div class="wb-col"><div class="wb-block-h wb-h-f">Friendships</div>' + friendHtml + '</div>'
    + '<div class="wb-col"><div class="wb-block-h wb-h-e">Enmities</div>' + enemyHtml + '</div>'
    + '</div>'
    + pactHtml + readsHtml
    + '</section>';
}

const WB_CSS = `
.wb-sec{--wb-ink:#2a2016;--wb-dim:#7a6b52;--wb-gold:#8e6d2f;--wb-green:#4f7a48;--wb-red:#a5382b;
  max-width:1000px;margin:26px auto 0;padding:22px 6px 8px;color:var(--wb-ink);
  font-family:'Cormorant Garamond',Georgia,serif}
.wb-rule{display:flex;align-items:center;justify-content:center;gap:12px;opacity:.7;margin-bottom:6px}
.wb-rule i{height:1px;width:120px;background:linear-gradient(90deg,transparent,#b9a06a)}
.wb-hd{text-align:center;font-size:30px;font-weight:800;letter-spacing:.04em;color:#5a3f1e}
.wb-hd-sub{text-align:center;font-style:italic;color:var(--wb-dim);font-size:15px;margin:2px 0 18px}
.wb-two{display:grid;grid-template-columns:1fr 1fr;gap:22px}
.wb-block{margin-top:22px}
.wb-block-h{font-size:12px;letter-spacing:.2em;text-transform:uppercase;color:var(--wb-gold);
  border-bottom:1px solid rgba(142,109,47,.3);padding-bottom:6px;margin-bottom:10px}
.wb-h-f{color:var(--wb-green)}.wb-h-e{color:var(--wb-red)}.wb-h-t{color:#8e1526}
.wb-none{color:var(--wb-dim);font-style:italic;padding:6px 2px}
.wb-pair{background:rgba(255,250,238,.6);border:1px solid rgba(142,109,47,.22);border-radius:10px;
  padding:10px 12px;margin-bottom:8px}
.wb-pair-friend{border-left:3px solid var(--wb-green)}
.wb-pair-enemy{border-left:3px solid var(--wb-red)}
.wb-pair-faces{display:flex;align-items:center;gap:8px}
.wb-pf{display:flex;flex-direction:column;align-items:center;gap:2px;flex:0 0 auto}
.wb-pf-nm{font-size:12px;max-width:70px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-align:center}
.wb-cord{flex:1;height:4px;border-radius:2px;background:rgba(0,0,0,.08);position:relative;overflow:hidden}
.wb-cord-fill{position:absolute;left:0;top:0;height:100%}
.wb-pair-friend .wb-cord-fill{background:linear-gradient(90deg,#8fb98a,var(--wb-green))}
.wb-pair-enemy .wb-cord-fill{background:linear-gradient(90deg,#d08f86,var(--wb-red))}
.wb-pair-tag{font-size:11px;color:var(--wb-dim);text-align:center;margin-top:5px;font-style:italic}
.wb-pact{display:flex;flex-wrap:wrap;gap:10px}
.wb-pact-card{background:linear-gradient(180deg,#f3ddd6,#e7c7bf);border:1px solid rgba(142,20,38,.4);
  border-radius:10px;padding:10px 14px;text-align:center;min-width:104px}
.wb-pact-nm{font-weight:700;margin-top:6px;font-size:15px;color:#5a1a1a}
.wb-pact-tag{font-size:11px;color:#8e1526;font-style:italic;margin-top:1px}
.wb-bars{display:flex;flex-direction:column;gap:7px}
.wb-bar-row{display:grid;grid-template-columns:150px 1fr auto;gap:12px;align-items:center}
.wb-bar-face{display:flex;align-items:center;gap:8px;min-width:0}
.wb-bar-nm{font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.wb-bar-track{height:11px;background:rgba(0,0,0,.06);border-radius:6px;overflow:hidden}
.wb-bar-fill{height:100%;background:linear-gradient(90deg,#c3a55a,var(--wb-gold));border-radius:6px}
.wb-bar-fill.hit{background:linear-gradient(90deg,#c07a70,var(--wb-red))}
.wb-bar-meta{font-size:12px;color:var(--wb-dim);white-space:nowrap}
.wb-mark{font-size:11px;padding:1px 6px;border-radius:8px;margin-left:4px;font-style:italic}
.wb-mark.hit{background:rgba(165,56,43,.15);color:var(--wb-red)}
.wb-mark.miss{background:rgba(79,122,72,.14);color:var(--wb-green)}
@media(max-width:640px){.wb-two{grid-template-columns:1fr}.wb-bar-row{grid-template-columns:110px 1fr}.wb-bar-meta{grid-column:1/-1}}
`;

// Kept exported so the module's public surface is stable for a future line.
export function _webPronouns(name) { return pronouns(name) || {}; }

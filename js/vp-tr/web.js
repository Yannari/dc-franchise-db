// ══════════════════════════════════════════════════════════════════════
// vp-tr/web.js — The Web: the whole room's relationships, on one screen
// ══════════════════════════════════════════════════════════════════════
//
// Its own screen, near the end of the episode. Everything a viewer needs to
// read the game as a game: who is close to whom, who cannot stand whom, who is
// secretly in the pact, who the room is hunting, and each player's own private
// map of who they are watching. All off the per-episode snapshot
// (`ep.tr.bonds`, `ep.tr.beliefs`, `ep.tr.roleHistory`) so a replayed episode
// shows the room as it stood THEN, not as it ended.
//
// DARK, and dense on purpose — the castle's own palette, glowing cords for the
// bonds, crimson rings on the pact. AUDIENCE PRIVILEGE: `beliefs.truth` names
// every alignment, so the audience sees the pact in the open and every read
// marked right or wrong; a player layer gets none of that.

import { pronouns } from '../players.js';
import { _portrait, _icon } from './conclave.js';

function _slug(name) {
  return String(name || '').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}
const _esc = s => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
// A portrait, optionally ringed by alignment on the audience layer.
function _av(name, size, align) {
  const ring = align === 'traitor' ? ' wb-ring-t' : align === 'faithful' ? ' wb-ring-f' : '';
  return '<span class="wb-av' + ring + '">' + _portrait(_slug(name), name, size || 40) + '</span>';
}

// ── the data, off the per-episode snapshot ──────────────────────────────
function _view(ep, observer) {
  const rec = ep && ep.tr;
  if (!rec) return null;
  const obs = observer == null ? 'audience' : String(observer);
  const isAudience = obs === 'audience';
  const watcher = obs.indexOf('player:') === 0 ? obs.slice('player:'.length) : null;
  const b = rec.beliefs;
  const living = (b && b.living && b.living.length) ? [...b.living] : [...(rec.living || [])];
  if (!living.length) return null;
  const truth = (isAudience && b) ? (b.truth || {}) : {};
  const liveSet = new Set(living);

  const bonds = (rec.bonds || []).filter(x => liveSet.has(x.a) && liveSet.has(x.b));
  const friendships = bonds.filter(x => x.v > 0).sort((a, c) => c.v - a.v);
  const enmities = bonds.filter(x => x.v < 0).sort((a, c) => a.v - c.v);

  const flipEp = {};
  for (const f of ((b && b.flips) || [])) flipEp[f.name] = f.ep;
  const pact = isAudience ? living.filter(n => truth[n] === 'traitor') : [];

  // Each player's own map, and who is watching each PERSON.
  const reads = {};
  const watchedBy = {};
  for (const board of ((b && b.boards) || [])) {
    if (!board || !board.observer) continue;
    const suspects = (board.entries || []).filter(e => e && e.score > 0)
      .sort((a, c) => c.score - a.score).map(e => e.name);
    const trusts = (board.entries || []).filter(e => e && e.score < 0)
      .sort((a, c) => a.score - c.score).map(e => e.name);
    reads[board.observer] = { suspects, trusts };
    for (const n of suspects) (watchedBy[n] ||= []).push(board.observer);
  }
  const castle = ((b && b.castle) || []).filter(r => r.accusers > 0).slice(0, 8);

  // The blocs the room votes in, as they stood this episode (snapshotted in
  // headless.js). Trimmed to the living and to real circles (two or more).
  // Public and belief-side — a bloc is bonds, never an alignment.
  const alliances = (rec.alliances || [])
    .map(a => ({ members: (a.members || []).filter(n => liveSet.has(n)) }))
    .filter(a => a.members.length >= 2)
    .sort((a, c) => c.members.length - a.members.length);
  const inABloc = new Set(alliances.flatMap(a => a.members));
  const freeAgents = living.filter(n => !inABloc.has(n));

  return {
    isAudience, watcher, living, truth, friendships, enmities, pact, flipEp,
    reads, watchedBy, castle, alliances, freeAgents,
    faithfulsLeft: isAudience ? living.filter(n => truth[n] === 'faithful').length : null,
    traitorsLeft: isAudience ? pact.length : null,
  };
}

// A paired-portrait card with a glowing cord — the whole point of the screen.
function _pairCard(x, kind, truth) {
  const strength = Math.min(10, Math.abs(x.v));
  const pct = Math.round((strength / 10) * 100);
  return '<div class="wb-pair wb-pair-' + kind + '">'
    + '<span class="wb-pf">' + _av(x.a, 46, truth[x.a]) + '<span class="wb-pf-nm">' + _esc(x.a) + '</span></span>'
    + '<span class="wb-cord"><span class="wb-cord-fill" style="width:' + pct + '%"></span></span>'
    + '<span class="wb-pf">' + _av(x.b, 46, truth[x.b]) + '<span class="wb-pf-nm">' + _esc(x.b) + '</span></span>'
    + '<span class="wb-pair-str">' + strength + '</span></div>';
}

export function rpBuildWeb(ep, observer = 'audience') {
  const v = _view(ep, observer);
  const css = '<style>' + WB_CSS + '</style>';
  if (!v) {
    return '<div class="wb-root">' + css + '<div class="wb-shell"><div class="wb-empty">'
      + '<div class="wb-empty-h">Nothing To Read Yet</div>'
      + '<p>No suspicion, no ties — everybody is still watching everybody.</p></div></div></div>';
  }
  const T = v.truth;

  // ── the pact ──
  const pactHtml = v.isAudience
    ? '<section class="wb-sec"><div class="wb-sec-h wb-h-t">' + _icon('seal', 13, '#e0808a')
      + ' The Pact</div>'
      + '<div class="wb-pact">'
      + (v.pact.length
        ? v.pact.map(n => '<div class="wb-pact-card">' + _av(n, 56, 'traitor')
            + '<div class="wb-pact-nm">' + _esc(n) + '</div>'
            + '<div class="wb-pact-tag">' + (v.flipEp[n] ? 'recruited &middot; ep ' + v.flipEp[n] : 'from the first night') + '</div></div>').join('')
        : '<div class="wb-none">No Traitor is left standing.</div>')
      + '</div></section>'
    : '';

  // ── friendships & enmities ──
  const friendHtml = v.friendships.length
    ? v.friendships.slice(0, 7).map(x => _pairCard(x, 'friend', T)).join('')
    : '<div class="wb-none">No real friendships have formed yet.</div>';
  const enemyHtml = v.enmities.length
    ? v.enmities.slice(0, 7).map(x => _pairCard(x, 'enemy', T)).join('')
    : '<div class="wb-none">Nobody has made an open enemy yet.</div>';
  const bondsHtml = '<section class="wb-sec"><div class="wb-sec-h">' + _icon('cards', 13, '#c9a24a')
    + ' Friendships &amp; Enmities</div>'
    + '<p class="wb-lead">Who has grown close, and who has turned on each other — the warmer the cord, the tighter the tie.</p>'
    + '<div class="wb-two">'
    + '<div class="wb-col"><div class="wb-col-h wb-h-f">Closest</div>' + friendHtml + '</div>'
    + '<div class="wb-col"><div class="wb-col-h wb-h-e">At odds</div>' + enemyHtml + '</div>'
    + '</div></section>';

  // ── where the castle is looking ──
  const maxW = v.castle.reduce((m, r) => Math.max(m, r.weight || 0), 0) || 1;
  const castleHtml = '<section class="wb-sec"><div class="wb-sec-h">' + _icon('eye', 13, '#c9a24a')
    + ' Where The Castle Is Looking</div>'
    + '<p class="wb-lead">The Faithfuls’ suspicion, summed the way the table resolves it — taller means more of the room is pointing, and harder.</p>'
    + (v.castle.length
      ? '<div class="wb-bars">' + v.castle.map(r => {
        const pct = Math.max(8, Math.round((r.weight / maxW) * 100));
        const real = v.isAudience ? T[r.name] : null;
        const mark = real === 'traitor' ? '<span class="wb-mark hit">on a Traitor</span>'
          : real === 'faithful' ? '<span class="wb-mark miss">on a Faithful</span>' : '';
        return '<div class="wb-bar-row"><div class="wb-bar-face">' + _av(r.name, 30, real)
          + '<span class="wb-bar-nm">' + _esc(r.name) + '</span></div>'
          + '<div class="wb-bar-track"><div class="wb-bar-fill' + (real === 'traitor' ? ' hit' : '')
          + '" style="width:' + pct + '%"></div></div>'
          + '<div class="wb-bar-meta">' + r.accusers + (r.accusers === 1 ? ' voice' : ' voices') + ' ' + mark + '</div></div>';
      }).join('') + '</div>'
      : '<div class="wb-none">The room has not settled on a name yet.</div>')
    + '</section>';

  // ── every read in the room ──
  const order = [...v.living].sort((a, c) => {
    if (v.isAudience) { const ta = T[a] === 'traitor', tc = T[c] === 'traitor'; if (ta !== tc) return ta ? -1 : 1; }
    return String(a).localeCompare(String(c));
  });
  const readLine = (label, names, cls) => names.length
    ? '<div class="wb-read ' + cls + '"><span class="wb-read-k">' + label + '</span><span class="wb-read-v">'
      + names.slice(0, 4).map(_esc).join(', ') + (names.length > 4 ? ' +' + (names.length - 4) : '') + '</span></div>'
    : '';
  const readsHtml = '<section class="wb-sec"><div class="wb-sec-h">' + _icon('cards', 13, '#c9a24a')
    + ' Every Read In The Room</div>'
    + '<p class="wb-lead">What each player is watching, who they have quietly stopped watching, and how many are watching them back.</p>'
    + '<div class="wb-grid">'
    + order.map(n => {
      const r = v.reads[n] || { suspects: [], trusts: [] };
      const align = v.isAudience ? T[n] : null;
      const chip = align === 'traitor' ? '<span class="wb-chip wb-chip-t">Traitor</span>'
        : align === 'faithful' ? '<span class="wb-chip wb-chip-f">Faithful</span>' : '';
      const watchers = (v.watchedBy[n] || []).length;
      return '<div class="wb-card' + (align === 'traitor' ? ' is-t' : '') + '">'
        + '<div class="wb-card-top">' + _av(n, 38, align)
        + '<div class="wb-card-id"><div class="wb-card-nm">' + _esc(n) + '</div>' + chip + '</div></div>'
        + readLine('suspects', r.suspects, 'wb-susp')
        + readLine('trusts', r.trusts, 'wb-trust')
        + '<div class="wb-read wb-watched"><span class="wb-read-k">watched by</span><span class="wb-read-v">'
        + (watchers ? watchers + (watchers === 1 ? ' player' : ' players') : 'nobody, yet') + '</span></div>'
        + '</div>';
    }).join('')
    + '</div></section>';

  // ── the circles (alliances) ──
  const allianceHtml = '<section class="wb-sec"><div class="wb-sec-h">' + _icon('seal', 13, '#c9a24a')
    + ' The Circles</div>'
    + '<p class="wb-lead">The blocs the castle votes in — people who trust each other and will not write a circle-mate’s name if they can help it. A Traitor who has slipped inside a circle is shielded by it; a free agent, in no circle, is the easy name.</p>'
    + (v.alliances.length
      ? '<div class="wb-blocs">' + v.alliances.map((a, i) => {
        const trs = v.isAudience ? a.members.filter(n => T[n] === 'traitor').length : 0;
        const tag = v.isAudience && trs
          ? '<span class="wb-bloc-tag">' + trs + ' cloaked inside</span>' : '';
        return '<div class="wb-bloc' + (trs ? ' has-t' : '') + '">'
          + '<div class="wb-bloc-h">Circle ' + (i + 1) + ' <span class="wb-bloc-n">'
          + a.members.length + '</span>' + tag + '</div>'
          + '<div class="wb-bloc-faces">' + a.members.map(n =>
            '<span class="wb-pf"><span class="wb-pf-av">' + _av(n, 40, v.isAudience ? T[n] : null)
            + '</span><span class="wb-pf-nm">' + _esc(n) + '</span></span>').join('')
          + '</div></div>';
      }).join('') + '</div>'
      + (v.freeAgents.length
        ? '<div class="wb-free"><div class="wb-free-h">Free agents &middot; in no circle, and the room’s easy names</div>'
          + '<div class="wb-bloc-faces wb-free-faces">' + v.freeAgents.map(n =>
            '<span class="wb-pf wb-pf-sm"><span class="wb-pf-av">' + _av(n, 30, v.isAudience ? T[n] : null)
            + '</span><span class="wb-pf-nm">' + _esc(n) + '</span></span>').join('') + '</div></div>'
        : '')
      : '<div class="wb-none">No circles have formed yet — everyone is still on their own.</div>')
    + '</section>';

  const count = v.isAudience
    ? '<span class="wb-cnt-f">' + v.faithfulsLeft + ' Faithful</span><span class="wb-cnt-x">vs</span>'
      + '<span class="wb-cnt-t">' + v.traitorsLeft + ' Traitor' + (v.traitorsLeft === 1 ? '' : 's') + '</span>'
    : '<span class="wb-cnt-f">' + v.living.length + ' still in the castle</span>';
  const badge = v.isAudience
    ? '<div class="wb-observer">' + _icon('eye', 13) + ' Observer: audience <em>&mdash; you see the pact and every read marked right or wrong; nobody in the castle can</em></div>'
    : '<div class="wb-observer">' + _icon('eye', 13) + ' Observer: ' + _esc(v.watcher || 'a player')
      + ' <em>&mdash; who suspects whom is public; who is a Traitor is not</em></div>';

  return '<div class="wb-root">' + css
    + '<div class="wb-shell">'
    + '<div class="wb-scenery" aria-hidden="true"><div class="wb-glow"></div><div class="wb-vig"></div></div>'
    + '<header class="wb-head"><div class="wb-title">The Web</div>'
    + '<div class="wb-sub">Who is close, who is at odds, and who is watching whom</div>'
    + '<div class="wb-count">' + count + '</div></header>'
    + badge
    + pactHtml + bondsHtml + allianceHtml + castleHtml + readsHtml
    + '</div></div>';
}

const WB_CSS = `
.wb-root{--wb-ink:#ece1c8;--wb-dim:#a2916f;--wb-bg:#0c0a08;--wb-panel:#181310;
  --wb-line:rgba(201,162,74,.16);--wb-gold:#c9a24a;--wb-red:#c0392b;--wb-green:#5f9e57;
  color:var(--wb-ink);font-family:'Cormorant Garamond',Georgia,serif;line-height:1.5}
.wb-shell{position:relative;max-width:1080px;margin:0 auto;padding:26px 22px 70px;
  background:radial-gradient(120% 80% at 50% -10%,#1b1512 0,var(--wb-bg) 68%);overflow:hidden}
.wb-scenery{position:absolute;inset:0;pointer-events:none}
.wb-glow{position:absolute;top:-30%;left:50%;transform:translateX(-50%);width:80%;height:60%;
  background:radial-gradient(closest-side,rgba(201,162,74,.10),transparent);filter:blur(20px)}
.wb-vig{position:absolute;inset:0;box-shadow:inset 0 0 200px 40px rgba(0,0,0,.7)}
.wb-head{position:relative;text-align:center;padding:6px 0 16px;border-bottom:1px solid var(--wb-line)}
.wb-title{font-size:44px;font-weight:800;letter-spacing:.03em;
  background:linear-gradient(180deg,#f5e8c6,#c9a24a);-webkit-background-clip:text;background-clip:text;color:transparent}
.wb-sub{font-style:italic;color:var(--wb-dim);font-size:16px;margin-top:1px}
.wb-count{margin-top:10px;font-size:15px;letter-spacing:.05em;display:flex;gap:10px;justify-content:center;align-items:center}
.wb-cnt-f{color:var(--wb-ink)}.wb-cnt-t{color:#e88b82}.wb-cnt-x{color:var(--wb-dim);font-style:italic}
.wb-observer{position:relative;text-align:center;font-size:12.5px;color:var(--wb-dim);margin:12px 0 4px}
.wb-observer em{opacity:.82}
.wb-sec{position:relative;margin-top:30px}
.wb-sec-h{display:flex;align-items:center;gap:7px;font-size:13px;letter-spacing:.2em;text-transform:uppercase;
  color:var(--wb-gold);border-bottom:1px solid var(--wb-line);padding-bottom:8px;margin-bottom:12px}
.wb-h-t{color:#e88b82}
.wb-lead{color:var(--wb-dim);font-size:14.5px;font-style:italic;margin:0 0 14px}
.wb-none{color:var(--wb-dim);font-style:italic;padding:8px 2px}
.wb-av{position:relative;display:inline-flex;border-radius:50%}
.wb-ring-t{box-shadow:0 0 0 2px rgba(192,57,43,.85),0 0 14px rgba(192,57,43,.5);border-radius:50%}
.wb-ring-f{box-shadow:0 0 0 2px rgba(201,162,74,.55);border-radius:50%}
/* portrait clipping — _portrait() (js/vp-tr/conclave.js) needs these, and this
   screen carries its own stylesheet, so they live here too. */
.wb-shell .cv-av{position:relative;display:inline-flex;align-items:center;justify-content:center;
  border-radius:50%;overflow:hidden;flex:0 0 auto;background:#241d16;vertical-align:middle}
.wb-shell .cv-av img{width:100%;height:100%;object-fit:cover}
.wb-shell .cv-av-ini{position:absolute;color:var(--wb-dim);font-weight:700}
/* pact */
.wb-pact{display:flex;flex-wrap:wrap;gap:12px}
.wb-pact-card{background:linear-gradient(180deg,#2a1613,#160c0a);border:1px solid rgba(192,57,43,.5);
  border-radius:12px;padding:12px 16px;text-align:center;min-width:112px;
  box-shadow:0 0 22px rgba(192,57,43,.18)}
.wb-pact-nm{font-weight:700;margin-top:7px;font-size:16px}
.wb-pact-tag{font-size:11px;color:#d98b83;font-style:italic;margin-top:1px}
/* friendships & enmities */
.wb-two{display:grid;grid-template-columns:1fr 1fr;gap:20px}
.wb-col-h{font-size:12px;letter-spacing:.14em;text-transform:uppercase;margin-bottom:8px;color:var(--wb-dim)}
.wb-h-f{color:#8fce86}.wb-h-e{color:#e88b82}
.wb-pair{display:grid;grid-template-columns:auto 1fr auto auto;gap:10px;align-items:center;
  background:var(--wb-panel);border:1px solid var(--wb-line);border-radius:12px;padding:9px 13px;margin-bottom:8px}
.wb-pair-friend{border-left:3px solid var(--wb-green)}
.wb-pair-enemy{border-left:3px solid var(--wb-red)}
.wb-pf{display:flex;flex-direction:column;align-items:center;gap:2px;width:58px}
.wb-pf-nm{font-size:11.5px;max-width:58px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-align:center;color:var(--wb-ink)}
/* ── the circles (alliances) ── */
.wb-blocs{display:flex;flex-wrap:wrap;gap:12px}
.wb-bloc{flex:1 1 220px;min-width:200px;border:1px solid var(--wb-line);border-radius:8px;
  padding:11px 12px 13px;background:linear-gradient(180deg,rgba(201,162,74,.05),rgba(0,0,0,.15))}
.wb-bloc.has-t{border-color:rgba(192,57,43,.4);background:linear-gradient(180deg,rgba(192,57,43,.08),rgba(0,0,0,.18))}
.wb-bloc-h{display:flex;align-items:center;gap:8px;font-size:11px;letter-spacing:.18em;text-transform:uppercase;
  color:var(--wb-dim);margin-bottom:9px}
.wb-bloc-n{display:inline-flex;align-items:center;justify-content:center;min-width:18px;height:18px;padding:0 5px;
  border-radius:9px;background:rgba(201,162,74,.18);color:var(--wb-gold);font-weight:700;letter-spacing:0}
.wb-bloc-tag{margin-left:auto;color:#e0808a;font-style:italic;text-transform:none;letter-spacing:0;font-size:12px}
.wb-bloc-faces{display:flex;flex-wrap:wrap;gap:10px}
.wb-pf-av{display:inline-flex}
.wb-pf-sm{width:44px}
.wb-pf-sm .wb-pf-nm{max-width:44px;font-size:10.5px}
.wb-free{margin-top:14px;border-top:1px dashed var(--wb-line);padding-top:12px}
.wb-free-h{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--wb-dim);margin-bottom:9px}
.wb-free-faces{opacity:.82}
.wb-cord{height:5px;border-radius:3px;background:rgba(255,255,255,.06);position:relative;overflow:hidden;min-width:40px}
.wb-cord-fill{position:absolute;left:0;top:0;height:100%;border-radius:3px}
.wb-pair-friend .wb-cord-fill{background:linear-gradient(90deg,#3d6b39,#8fce86);box-shadow:0 0 10px rgba(95,158,87,.7)}
.wb-pair-enemy .wb-cord-fill{background:linear-gradient(90deg,#6e211a,#e0645a);box-shadow:0 0 10px rgba(192,57,43,.7)}
.wb-pair-str{font-family:Georgia,serif;font-size:19px;font-weight:800;color:var(--wb-dim);width:22px;text-align:center}
.wb-pair-friend .wb-pair-str{color:#8fce86}.wb-pair-enemy .wb-pair-str{color:#e88b82}
/* castle bars */
.wb-bars{display:flex;flex-direction:column;gap:8px}
.wb-bar-row{display:grid;grid-template-columns:160px 1fr auto;gap:12px;align-items:center}
.wb-bar-face{display:flex;align-items:center;gap:8px;min-width:0}
.wb-bar-nm{font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.wb-bar-track{height:12px;background:rgba(255,255,255,.05);border-radius:6px;overflow:hidden}
.wb-bar-fill{height:100%;background:linear-gradient(90deg,#8a7327,var(--wb-gold));border-radius:6px}
.wb-bar-fill.hit{background:linear-gradient(90deg,#7a241c,var(--wb-red))}
.wb-bar-meta{font-size:12px;color:var(--wb-dim);white-space:nowrap}
.wb-mark{font-size:11px;padding:1px 6px;border-radius:8px;margin-left:4px;font-style:italic}
.wb-mark.hit{background:rgba(192,57,43,.18);color:#e88b82}
.wb-mark.miss{background:rgba(95,158,87,.16);color:#9ece95}
/* reads grid */
.wb-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(232px,1fr));gap:12px}
.wb-card{background:var(--wb-panel);border:1px solid var(--wb-line);border-radius:12px;padding:11px 13px}
.wb-card.is-t{border-color:rgba(192,57,43,.42);background:linear-gradient(180deg,#1c1310,#140d0b)}
.wb-card-top{display:flex;align-items:center;gap:10px;margin-bottom:8px}
.wb-card-nm{font-weight:700;font-size:15.5px}
.wb-chip{font-size:10.5px;letter-spacing:.08em;text-transform:uppercase;padding:1px 7px;border-radius:8px;display:inline-block;margin-top:2px}
.wb-chip-t{background:rgba(192,57,43,.22);color:#e88b82}.wb-chip-f{background:rgba(201,162,74,.16);color:var(--wb-gold)}
.wb-read{display:flex;gap:8px;font-size:13px;padding:3px 0;align-items:baseline}
.wb-read-k{flex:0 0 72px;color:var(--wb-dim);font-style:italic;font-size:12px}
.wb-susp .wb-read-v{color:#e0a19a}.wb-trust .wb-read-v{color:#a9c9a4}
.wb-watched{border-top:1px dashed var(--wb-line);margin-top:6px;padding-top:6px}
.wb-watched .wb-read-v{color:var(--wb-dim)}
.wb-empty{text-align:center;padding:60px 20px;color:var(--wb-dim)}
.wb-empty-h{font-size:22px;color:var(--wb-ink);margin-bottom:8px}
@media(max-width:640px){.wb-two{grid-template-columns:1fr}.wb-bar-row{grid-template-columns:110px 1fr}.wb-bar-meta{grid-column:1/-1}}
@media(prefers-reduced-motion:reduce){.wb-cord-fill{box-shadow:none}}
`;

export function _webPronouns(name) { return pronouns(name) || {}; }

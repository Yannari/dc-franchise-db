// ══════════════════════════════════════════════════════════════════════
// vp-dr/relationships.js — who she loves, who she hates, who raised her
// ══════════════════════════════════════════════════════════════════════
//
// A BOARD, NOT A NARRATIVE. There are no reveal steps: every bond is
// visible the moment you open the screen, and switching queen tabs
// redraws the centre without rebuilding the page. The data is the
// episode's bond snapshot (`row.dr.bonds`) plus the season's family
// tree (`row.dr.families`).
//
// Visual identity: untucked atmosphere — deep violet with pink neon —
// because the lounge is where the bonds live and die. Portrait tabs
// across the top, the selected queen large in the sidebar, her
// connections as ranked cards in the centre.
import { _shell, _portrait } from './style.js';

const esc = v => String(v ?? '').replace(/[&<>"]/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const REL_CSS = `
/* ── QUEEN TABS ── */
.rel-tabs{display:flex;gap:6px;flex-wrap:wrap;max-width:1000px;margin:0 auto 16px;
  padding:8px;border-radius:8px;background:rgba(22,4,34,.72);
  border:1px solid rgba(123,47,247,.22)}
.rel-tab{display:flex;gap:6px;align-items:center;padding:4px 9px 4px 4px;border-radius:30px;
  border:1px solid rgba(123,47,247,.22);background:rgba(255,255,255,.03);
  color:#e7c9de;font:600 11px/1 inherit;cursor:pointer;opacity:.5;
  transition:opacity .25s,border-color .25s,background .25s}
.rel-tab .dr-por,.rel-tab .dr-initials{border-radius:50%;display:block}
.rel-tab:hover,.rel-tab:focus-visible{opacity:.85;outline:none}
.rel-tab.on{opacity:1;color:#fff;border-color:#B07AFF;background:rgba(123,47,247,.22);
  box-shadow:0 0 18px rgba(123,47,247,.35)}

/* ── FOCUS CARD: the selected queen ── */
.rel-focus{display:flex;flex-direction:column;align-items:center;gap:8px;padding:18px 12px 14px}
.rel-focus .dr-por,.rel-focus .dr-initials{border-radius:50%;
  border:3px solid rgba(123,47,247,.7);box-shadow:0 0 30px rgba(123,47,247,.5)}
.rel-fname{font-family:'Anton',sans-serif;font-size:22px;letter-spacing:.05em;
  text-transform:uppercase;color:#fff;text-align:center}
.rel-fsub{font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:#C9A6BC}

/* ── FAMILY BADGE ── */
.rel-fam-badge{margin-top:6px;padding:6px 12px;border-radius:8px;
  background:linear-gradient(135deg,rgba(255,200,61,.15),rgba(123,47,247,.15));
  border:1px solid rgba(255,200,61,.3);text-align:center}
.rel-fam-title{font-size:9px;letter-spacing:.2em;text-transform:uppercase;color:#FFC83D;
  margin:0 0 4px}
.rel-fam-link{display:flex;align-items:center;gap:6px;margin:3px 0;font-size:12px;color:#fff}
.rel-fam-link .dr-por,.rel-fam-link .dr-initials{border-radius:50%}
.rel-fam-rel{font-size:9px;letter-spacing:.12em;text-transform:uppercase;color:#FFC83D;
  margin-left:auto}

/* ── STAT CHIPS ── */
.rel-stats{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px;justify-content:center}
.rel-stat{padding:4px 10px;border-radius:16px;font-size:10px;letter-spacing:.08em;
  font-weight:700;text-transform:uppercase}
.rel-stat-allies{background:rgba(59,224,138,.15);border:1px solid rgba(59,224,138,.4);color:#7CE7B0}
.rel-stat-rivals{background:rgba(255,41,75,.15);border:1px solid rgba(255,41,75,.4);color:#FF6B8A}
.rel-stat-neutral{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);color:#C9A6BC}

/* ── CONNECTION CARDS ── */
.rel-list{display:flex;flex-direction:column;gap:8px;max-width:1000px;margin:0 auto}
.rel-card{display:grid;grid-template-columns:44px 1fr auto;gap:12px;align-items:center;
  padding:12px 16px;border-radius:10px;
  background:linear-gradient(135deg,var(--dr-panel2),var(--dr-panel));
  border:1px solid var(--dr-line);
  transition:transform .2s,box-shadow .2s}
.rel-card:hover{transform:translateY(-2px);
  box-shadow:0 8px 24px rgba(0,0,0,.5)}
.rel-card .dr-por,.rel-card .dr-initials{border-radius:50%}
.rel-card-info{display:flex;flex-direction:column;gap:2px}
.rel-card-name{font-size:14px;font-weight:700;color:#fff}
.rel-card-label{font-size:9px;letter-spacing:.14em;text-transform:uppercase}
.rel-card-label-ally{color:#7CE7B0}
.rel-card-label-rival{color:#FF6B8A}
.rel-card-label-neutral{color:#C9A6BC}
.rel-card-label-family{color:#FFC83D}
.rel-card-bar{display:flex;align-items:center;gap:8px}
.rel-card-meter{width:80px;height:6px;border-radius:3px;background:rgba(255,255,255,.08);
  overflow:hidden}
.rel-card-meter i{display:block;height:100%;border-radius:3px;
  transition:width .4s cubic-bezier(.2,.9,.25,1)}
.rel-card-meter-pos i{background:linear-gradient(90deg,#3BE08A,#00E5FF)}
.rel-card-meter-neg i{background:linear-gradient(90deg,#FF294B,#FF7BC8)}
.rel-card-val{font-family:'Space Mono',monospace;font-size:14px;font-weight:700;
  min-width:36px;text-align:right}
.rel-card-val-pos{color:#7CE7B0}
.rel-card-val-neg{color:#FF6B8A}
.rel-card-val-zero{color:#C9A6BC}

/* ── SECTION HEADINGS ── */
.rel-section{margin:18px 0 8px;max-width:1000px;margin-left:auto;margin-right:auto}
.rel-section-h{display:flex;align-items:center;gap:10px}
.rel-section-h h3{margin:0;font-family:'Anton',sans-serif;font-size:14px;
  letter-spacing:.12em;text-transform:uppercase}
.rel-section-h-ally h3{color:#7CE7B0}
.rel-section-h-rival h3{color:#FF6B8A}
.rel-section-line{flex:1;height:1px}
.rel-section-line-ally{background:linear-gradient(90deg,rgba(59,224,138,.4),transparent)}
.rel-section-line-rival{background:linear-gradient(90deg,rgba(255,41,75,.4),transparent)}

/* ── EMPTY STATE ── */
.rel-empty{text-align:center;padding:32px;color:#C9A6BC;font-size:13px;
  font-style:italic}

@media(max-width:900px){
  .rel-card{grid-template-columns:36px 1fr auto}
  .rel-card-meter{width:50px}
}
@media(prefers-reduced-motion:reduce){
  .rel-card{transition:none}
  .rel-card-meter i{transition:none}
  .rel-tab{transition:none}
}
`;

function label(bond, familyRel) {
  if (familyRel) return { text: `drag ${familyRel}`, cls: 'rel-card-label-family' };
  if (bond >= 6) return { text: 'close ally', cls: 'rel-card-label-ally' };
  if (bond >= 3) return { text: 'friendly', cls: 'rel-card-label-ally' };
  if (bond >= 1) return { text: 'warm', cls: 'rel-card-label-ally' };
  if (bond <= -6) return { text: 'bitter rival', cls: 'rel-card-label-rival' };
  if (bond <= -3) return { text: 'tension', cls: 'rel-card-label-rival' };
  if (bond <= -1) return { text: 'cool', cls: 'rel-card-label-rival' };
  return { text: 'neutral', cls: 'rel-card-label-neutral' };
}

function card(other, bond, familyRel, ep) {
  const l = label(bond, familyRel);
  const abs = Math.abs(bond);
  const pct = Math.round((abs / 10) * 100);
  const meterCls = bond >= 0 ? 'rel-card-meter-pos' : 'rel-card-meter-neg';
  const valCls = bond > 0 ? 'rel-card-val-pos' : bond < 0 ? 'rel-card-val-neg' : 'rel-card-val-zero';
  return `<div class="rel-card">
    ${_portrait(other, ep, { size: 44 })}
    <div class="rel-card-info">
      <span class="rel-card-name">${esc(other)}</span>
      <span class="rel-card-label ${l.cls}">${esc(l.text)}</span>
    </div>
    <div class="rel-card-bar">
      <div class="rel-card-meter ${meterCls}"><i style="width:${pct}%"></i></div>
      <span class="rel-card-val ${valCls}">${bond > 0 ? '+' : ''}${bond}</span>
    </div>
  </div>`;
}

function sectionHead(title, type) {
  return `<div class="rel-section">
    <div class="rel-section-h rel-section-h-${type}">
      <h3>${esc(title)}</h3>
      <span class="rel-section-line rel-section-line-${type}"></span>
    </div></div>`;
}

function buildForQueen(name, bonds, families, living, ep) {
  const pairBonds = [];
  for (const [a, b, v] of bonds) {
    if (a === name && living.includes(b)) pairBonds.push({ other: b, bond: v });
    else if (b === name && living.includes(a)) pairBonds.push({ other: a, bond: v });
  }
  const famRels = {};
  for (const f of families) {
    if (!f.members || !f.members.includes(name)) continue;
    for (const m of f.members) {
      if (m === name) continue;
      famRels[m] = f.roles?.[m] || 'family';
    }
  }

  const allies = pairBonds.filter(p => p.bond > 0).sort((a, b) => b.bond - a.bond);
  const rivals = pairBonds.filter(p => p.bond < 0).sort((a, b) => a.bond - b.bond);
  const neutral = pairBonds.filter(p => p.bond === 0);

  let html = '';

  if (allies.length) {
    html += sectionHead(`Her people · ${allies.length}`, 'ally');
    html += `<div class="rel-list">${allies.map(p =>
      card(p.other, p.bond, famRels[p.other], ep)).join('')}</div>`;
  }

  if (rivals.length) {
    html += sectionHead(`At war · ${rivals.length}`, 'rival');
    html += `<div class="rel-list">${rivals.map(p =>
      card(p.other, p.bond, famRels[p.other], ep)).join('')}</div>`;
  }

  if (neutral.length) {
    html += `<div class="rel-list" style="margin-top:12px">${neutral.map(p =>
      card(p.other, p.bond, famRels[p.other], ep)).join('')}</div>`;
  }

  if (!pairBonds.length) {
    html += `<div class="rel-empty">No connections yet — it's early.</div>`;
  }

  return html;
}

function sidebarForQueen(name, bonds, families, living, ep) {
  const pairBonds = [];
  for (const [a, b, v] of bonds) {
    if (a === name && living.includes(b)) pairBonds.push({ other: b, bond: v });
    else if (b === name && living.includes(a)) pairBonds.push({ other: a, bond: v });
  }

  const allies = pairBonds.filter(p => p.bond > 0).length;
  const rivals = pairBonds.filter(p => p.bond < 0).length;
  const neutral = pairBonds.filter(p => p.bond === 0).length;

  let html = `<div class="rel-focus">
    ${_portrait(name, ep, { size: 72 })}
    <span class="rel-fname">${esc(name)}</span>
    <span class="rel-fsub">Connections</span>
    <div class="rel-stats">
      ${allies ? `<span class="rel-stat rel-stat-allies">${allies} ${allies === 1 ? 'ally' : 'allies'}</span>` : ''}
      ${rivals ? `<span class="rel-stat rel-stat-rivals">${rivals} ${rivals === 1 ? 'rival' : 'rivals'}</span>` : ''}
      ${neutral ? `<span class="rel-stat rel-stat-neutral">${neutral} neutral</span>` : ''}
    </div>`;

  const famLinks = [];
  for (const f of families) {
    if (!f.members || !f.members.includes(name)) continue;
    for (const m of f.members) {
      if (m === name) continue;
      famLinks.push({ name: m, rel: f.roles?.[m] || 'family' });
    }
  }

  if (famLinks.length) {
    html += `<div class="rel-fam-badge">
      <div class="rel-fam-title">Drag Family</div>
      ${famLinks.map(l => `<div class="rel-fam-link">
        ${_portrait(l.name, ep, { size: 22 })}
        <span>${esc(l.name)}</span>
        <span class="rel-fam-rel">${esc(l.rel)}</span>
      </div>`).join('')}</div>`;
  }

  html += '</div>';
  return html;
}

export function rpBuildRelationships(row) {
  const bonds = row?.dr?.bonds || [];
  const families = row?.dr?.families || [];
  const living = row?.dr?.living || [];
  if (!living.length) return '';
  const epNum = row?.num ?? row?.dr?.ep ?? 1;
  const ep = { num: epNum, format: 'drag-race', dr: row?.dr || {} };

  const nonZero = bonds.filter(([a, b, v]) =>
    v !== 0 && living.includes(a) && living.includes(b));
  if (!nonZero.length && !families.length) return '';

  const first = living[0];

  const tabs = `<!--dr-chrome--><div class="rel-tabs" id="rel-tabs">${living.map((n, i) =>
    `<button type="button" class="rel-tab${i === 0 ? ' on' : ''}" data-q="${esc(n)}"
      onclick="drRelSwitch('${esc(n).replace(/'/g, "\\'")}',${epNum})">${_portrait(n, ep, { size: 20 })}
      <span>${esc(n)}</span></button>`).join('')}</div><!--/dr-chrome-->`;

  const content = `<div id="rel-content">${buildForQueen(first, bonds, families, living, ep)}</div>`;
  const sidebar = sidebarForQueen(first, bonds, families, living, ep);

  if (typeof window !== 'undefined') {
    window._drRelData = { bonds, families, living, epNum };
    window.drRelSwitch = (name, num) => {
      const d = window._drRelData;
      if (!d) return;
      const ep2 = { num, format: 'drag-race', dr: row?.dr || {} };
      const el = document.getElementById('rel-content');
      if (el) el.innerHTML = buildForQueen(name, d.bonds, d.families, d.living, ep2);
      const sb = document.getElementById('dr-sidebar-inner');
      if (sb) sb.innerHTML = sidebarForQueen(name, d.bonds, d.families, d.living, ep2);
      for (const t of document.querySelectorAll('.rel-tab')) {
        t.classList.toggle('on', t.getAttribute('data-q') === name);
      }
    };
  }

  return `<style>${REL_CSS}</style>${_shell(
    `${tabs}${content}`, ep, {
      phase: 'untucked', title: 'The Room', subtitle: 'who she loves, who she hates',
      sidebar,
    })}`;
}

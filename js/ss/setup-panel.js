// ══════════════════════════════════════════════════════════════════════
// ss/setup-panel.js — the cast screen's Secret Story panel
// ══════════════════════════════════════════════════════════════════════
//
// Every housemate's secret before the season starts: a draw from the pool by
// default (js/ss/casting.js), with Reroll, Write my own, and their real
// history as an option. Canon secrets are locked. Who recognises whom on
// launch night is drawn here once and kept with the season.
//
// The choices live on `seasonConfig.ssSecrets` and `seasonConfig.ssRecognitions`
// (both kept by saveConfig) and are read by js/bb/secret-story.js on night one.

import { seasonConfig, players, kinshipPairs, seasonFormat } from '../core.js';
import { SS_FORMAT } from '../shows.js';
import { careerOf } from '../franchise-meta.js';
import { castSecrets, rerollSecret, writtenSecret, historySecretOptions, recognitions, SS_HOUSE_THEMES, SECRET_KINDS, SECRET_POOL, PRODUCTION_SECRETS, productionSecret, drawProductionSecret, pickedSecret } from './casting.js';
import { playerAvatarUrl } from '../players.js';
import { ROLE_JOBS } from './production.js';

const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const persist = () => { try { localStorage.setItem('simulator_config', JSON.stringify(seasonConfig)); } catch { /* private mode */ } };
const cast = () => (players || []).filter(p => p?.name);
const careers = n => { try { return careerOf(n) || []; } catch { return []; } };
const pairs = () => { try { return kinshipPairs() || []; } catch { return []; } };

/** Pool ids nobody may draw: anybody's canon secret anywhere in the roster. */
function canonTaken() {
  const roster = (typeof window !== 'undefined' && window.FRANCHISE_ROSTER) || [];
  return new Set(roster.map(p => p?.secret?.id).filter(Boolean));
}

/** Fill the secrets nobody has yet, and the recognitions for this cast. */
export function ensureSsCast() {
  if (seasonFormat(seasonConfig) !== SS_FORMAT) return;
  const c = cast();
  if (!c.length) return;
  const before = JSON.stringify(seasonConfig.ssSecrets || {});
  const names = new Set(c.map(p => p.name));
  // A housemate who left the cast takes their secret with them.
  const kept = Object.fromEntries(Object.entries(seasonConfig.ssSecrets || {}).filter(([n]) => names.has(n)));
  seasonConfig.ssSecrets = castSecrets(c, { existing: kept, taken: canonTaken() });
  const sig = [...names].sort().join('|');
  if (seasonConfig.ssRecognitionsCast !== sig) {
    const cs = Object.fromEntries(c.map(p => [p.name, careers(p.name)]));
    const fame = Object.fromEntries(c.map(p => [p.name, cs[p.name].some(x => x.rec?.winner || x.rec?.finalist) ? 0.6 : cs[p.name].length ? 0.2 : 0]));
    seasonConfig.ssRecognitions = recognitions(c.map(p => p.name), { careers: cs, fame });
    seasonConfig.ssRecognitionsCast = sig;
  }
  // a production secret, as nearly every real season had one: drawn once for a cast big enough to carry it
  // (the cast screen's Secrets tab can change it, cast another, or take it away)
  const castSig = c.map(p => p.name).sort().join('|');
  if (seasonConfig.ssProductionDrawn !== castSig && c.length >= 10 && !Object.values(seasonConfig.ssSecrets || {}).some(e => e?.source === 'production')) {
    const d = drawProductionSecret(c, { avoid: new Set(Object.entries(seasonConfig.ssSecrets || {}).filter(([, e]) => e?.source === 'canon').map(([n]) => n)) });
    if (d) seasonConfig.ssSecrets = { ...(seasonConfig.ssSecrets || {}), ...productionSecret(d.def, d.holders) };
    seasonConfig.ssProductionDrawn = castSig;
  }
  if (JSON.stringify(seasonConfig.ssSecrets) !== before) persist();
}

const BADGE = { pool: ['DRAWN', '#8b8fa3'], chosen: ['CHOSEN', '#19d3c5'], own: ['YOURS', '#e0b84a'], history: ['REAL', '#5fb3ff'], canon: ['CANON', '#c084fc'], production: ['PRODUCTION', '#ff3ea5'] };
// the tag on a housemate's card, in words
const SOURCE = { pool: ['Drawn', '#9b97b8'], chosen: ['Chosen', '#19d3c5'], own: ['Yours', '#f5c542'], history: ['From their life', '#5fb3ff'], canon: ['Canon', '#c084fc'], production: ['Production', '#ff3ea5'] };

/** Is the season being cast a Secret Story season? (the cast screen asks, to show its Secrets tab) */
export function isSecretStorySeason() { return seasonFormat(seasonConfig) === SS_FORMAT; }

// THE SECRETS TAB of the cast screen (the user, 2026-10-28: "secret assignment should be better visually and be in
// cast setup, not in season setup: a tab next to Grid/Tribes, like The Circle"; then, on the first version: "it's
// very ugly"). A calm night board in the show's colours: every housemate's card (face, name, the secret as a quote,
// where it came from, the ways to change it), and the production secrets as the Voice's envelopes, cast with a
// three-step composer (choose the secret, click who keeps it, and for one of your own, the job it plays).
const PAL = ['#ff3ea5', '#19d3c5', '#7c5cff', '#f5c542', '#ff7a59', '#3bb3ff', '#c8137a', '#22c55e'];
const colOf = n => PAL[[...String(n)].reduce((h, c) => h + c.charCodeAt(0), 0) % PAL.length];
const EYE = `<svg viewBox="0 0 64 40" aria-hidden="true"><path d="M2 20C12 6 22 2 32 2s20 4 30 18C52 34 42 38 32 38S12 34 2 20z" fill="#fff"/><circle cx="32" cy="20" r="13" fill="#3bb3ff"/><circle cx="32" cy="20" r="13" fill="url(#ssbEyeG)"/><circle cx="32" cy="20" r="6.5" fill="#0b0920"/><circle cx="36.5" cy="15.5" r="3" fill="#fff"/><path d="M2 20C12 6 22 2 32 2s20 4 30 18" fill="none" stroke="#ff3ea5" stroke-width="3" stroke-linecap="round"/><defs><radialGradient id="ssbEyeG" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#7fd4ff"/><stop offset="1" stop-color="#1d4fd1"/></radialGradient></defs></svg>`;
const BOARD_CSS = `
@font-face{font-family:'SSFredoka';src:url('assets/fonts/Fredoka.woff2') format('woff2');font-weight:300 700}
.ssb{--bg:#110e22;--card:#1b1734;--card2:#231e42;--line:rgba(255,255,255,.08);--ink:#f4f1ff;--dim:#a6a1c6;--pink:#ff3ea5;--gold:#f5c542;--teal:#19d3c5;
  color:var(--ink);background:radial-gradient(ellipse 70% 40% at 50% -10%,rgba(124,92,255,.28),transparent 70%),var(--bg);border:1px solid var(--line);border-radius:18px;padding:22px 20px 26px;
  font:400 14px/1.45 system-ui,-apple-system,'Segoe UI',sans-serif}
.ssb *{box-sizing:border-box}
.ssb button{font:inherit;color:inherit}
.ssb-h{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:14px;padding-bottom:18px;border-bottom:1px solid var(--line);margin-bottom:20px}
.ssb-brand{display:flex;align-items:center;gap:14px}
.ssb-eye{width:58px;height:36px;flex:none;filter:drop-shadow(0 0 12px rgba(59,179,255,.45))}
.ssb-eye svg{width:100%;height:100%}
.ssb-t{font:600 26px/1.1 'SSFredoka',sans-serif;letter-spacing:.01em}
.ssb-sub{color:var(--dim);font-size:13px;margin-top:3px;max-width:60ch}
.ssb-stats{display:flex;align-items:center;gap:18px;flex-wrap:wrap}
.ssb-stat b{display:block;font:600 22px/1 'SSFredoka',sans-serif}
.ssb-stat span{font-size:11px;color:var(--dim);text-transform:uppercase;letter-spacing:.08em}
.ssb-btn{display:inline-flex;align-items:center;gap:6px;border-radius:10px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.04);padding:7px 12px;font-size:12.5px!important;font-weight:600!important;cursor:pointer;transition:background .15s,border-color .15s}
.ssb-btn:hover{background:rgba(255,255,255,.1);border-color:rgba(255,255,255,.28)}
.ssb-btn.primary{background:var(--pink);border-color:var(--pink);color:#fff}
.ssb-btn.primary:hover{background:#ff5cb4}
.ssb-btn:disabled{opacity:.4;cursor:default}
.ssb-sec{margin:0 0 22px}
.ssb-sec-h{display:flex;align-items:baseline;justify-content:space-between;gap:10px;margin-bottom:12px}
.ssb-sec-h h3{margin:0;font:600 17px 'SSFredoka',sans-serif}
.ssb-sec-h p{margin:2px 0 0;color:var(--dim);font-size:12.5px}
/* the Voice's envelopes */
.ssb-env-row{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px}
.ssb-env{position:relative;border-radius:14px;padding:14px 14px 12px;background:linear-gradient(160deg,#2a1f45,#1d1636);border:1px solid rgba(245,197,66,.35);box-shadow:inset 0 1px 0 rgba(255,255,255,.05)}
.ssb-env::before{content:'';position:absolute;inset:0 0 auto 0;height:3px;border-radius:14px 14px 0 0;background:linear-gradient(90deg,var(--gold),var(--pink))}
.ssb-env-k{font-size:10.5px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--gold)}
.ssb-env-q{font:500 15px/1.35 Georgia,'Times New Roman',serif;font-style:italic;margin:6px 0 8px}
.ssb-env-job{font-size:12px;color:var(--dim);margin-bottom:10px}
.ssb-env-who{display:flex;align-items:center;gap:8px}
.ssb-faces{display:flex}
.ssb-faces .ssb-face{width:30px;height:30px;margin-left:-8px;box-shadow:0 0 0 2px #1d1636}
.ssb-faces .ssb-face:first-child{margin-left:0}
.ssb-env-names{font-size:12.5px;font-weight:600}
.ssb-x{position:absolute;right:8px;top:8px;width:26px;height:26px;border-radius:8px;border:0;background:transparent;color:var(--dim)!important;cursor:pointer;font-size:14px!important}
.ssb-x:hover{background:rgba(255,255,255,.08);color:#fff!important}
.ssb-x.ssb-ed{right:38px}
.ssb-new{border-radius:14px;border:1.5px dashed rgba(255,255,255,.2);background:transparent;min-height:120px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;cursor:pointer;color:var(--dim)!important;transition:border-color .15s,color .15s}
.ssb-new:hover{border-color:var(--gold);color:var(--gold)!important}
.ssb-new b{font:600 15px 'SSFredoka',sans-serif}
.ssb-new span{font-size:12px}
/* the composer */
.ssb-comp{display:none;margin-top:14px;border-radius:16px;background:var(--card);border:1px solid var(--line);padding:16px}
.ssb-comp.on{display:block}
.ssb-step{margin-bottom:16px}
.ssb-step-h{display:flex;align-items:center;gap:8px;font-weight:700;font-size:13px;margin-bottom:10px}
.ssb-step-h i{font-style:normal;width:22px;height:22px;border-radius:50%;background:var(--pink);display:grid;place-items:center;font-size:12px}
.ssb-step-h small{font-weight:400;color:var(--dim)}
.ssb-tiles{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:8px}
.ssb-tile{text-align:left;border-radius:12px;border:1px solid var(--line);background:var(--card2);padding:10px 12px;cursor:pointer;transition:border-color .15s,background .15s}
.ssb-tile:hover{border-color:rgba(255,255,255,.25)}
.ssb-tile.on{border-color:var(--gold);background:#2d2440;box-shadow:0 0 0 1px var(--gold)}
.ssb-tile b{display:block;font:italic 500 13.5px/1.3 Georgia,serif}
.ssb-tile span{display:block;font-size:11px;color:var(--dim);margin-top:4px}
.ssb-tile.own b{font-style:normal;font-family:inherit;font-weight:700}
.ssb-people{display:flex;flex-wrap:wrap;gap:8px}
.ssb-person{display:flex;flex-direction:column;align-items:center;gap:4px;width:68px;padding:6px 2px;border-radius:12px;border:1px solid transparent;background:transparent;cursor:pointer;font-size:11.5px!important}
.ssb-person .ssb-face{width:44px;height:44px;transition:box-shadow .15s,opacity .15s;opacity:.7}
.ssb-person:hover .ssb-face{opacity:1}
.ssb-person.on{background:rgba(255,62,165,.12);border-color:rgba(255,62,165,.5)}
.ssb-person.on .ssb-face{opacity:1;box-shadow:0 0 0 2.5px var(--pink)}
.ssb-person.busy .ssb-face{filter:grayscale(.6)}
.ssb-own{display:none;grid-template-columns:1fr 1fr;gap:8px}
.ssb-own.on{display:grid}
.ssb-own label{display:flex;flex-direction:column;gap:4px;font-size:11.5px;color:var(--dim);font-weight:600}
.ssb-own label.wide{grid-column:1/-1}
.ssb input,.ssb select{width:100%;border-radius:10px;border:1px solid rgba(255,255,255,.14);background:#0f0c1f;color:var(--ink);padding:9px 11px;font:500 13px system-ui,sans-serif;outline:none}
.ssb input:focus,.ssb select:focus{border-color:var(--pink)}
.ssb-comp-f{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;padding-top:12px;border-top:1px solid var(--line)}
.ssb-comp-msg{font-size:12.5px;color:var(--dim)}
/* the housemates */
.ssb-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:12px}
.ssb-card{position:relative;border-radius:14px;background:var(--card);border:1px solid var(--line);padding:14px;display:flex;flex-direction:column;gap:10px;transition:border-color .15s,transform .15s}
.ssb-card:hover{border-color:rgba(255,255,255,.18)}
.ssb-card::before{content:'';position:absolute;left:0;top:14px;bottom:14px;width:3px;border-radius:0 3px 3px 0;background:var(--sc)}
.ssb-top{display:flex;align-items:center;gap:12px}
.ssb-face{width:52px;height:52px;border-radius:50%;overflow:hidden;flex:none;background:var(--c);display:block}
.ssb-face img{width:100%;height:100%;object-fit:cover;object-position:50% 15%;display:block}
.ssb-nm{font:600 16px/1.15 'SSFredoka',sans-serif}
.ssb-src{display:inline-flex;align-items:center;gap:5px;margin-top:4px;font-size:11px;font-weight:600;color:var(--sc)}
.ssb-src::before{content:'';width:6px;height:6px;border-radius:50%;background:var(--sc)}
.ssb-q{font:500 15px/1.4 Georgia,'Times New Roman',serif;font-style:italic;color:#fff;padding:10px 12px;border-radius:10px;background:rgba(255,255,255,.035)}
.ssb-q::before{content:'\\201C';color:var(--pink);margin-right:1px}
.ssb-q::after{content:'\\201D';color:var(--pink)}
.ssb-pair{font-size:12px;color:var(--dim)}
.ssb-pair b{color:var(--ink);font-weight:600}
.ssb-act{display:flex;flex-wrap:wrap;gap:6px;margin-top:auto}
.ssb-act .ssb-btn{padding:6px 10px}
.ssb-act select{width:auto;max-width:170px;padding:6px 8px;font-size:12px}
.ssb-lock{font-size:12px;color:var(--dim)}
.ssb-write{display:none;flex-direction:column;gap:6px}
.ssb-write.on{display:flex}
.ssb-rec{margin-top:22px;padding-top:16px;border-top:1px solid var(--line)}
.ssb-rec-l{display:flex;flex-wrap:wrap;gap:8px}
.ssb-rec-i{display:inline-flex;align-items:center;gap:8px;padding:5px 10px 5px 5px;border-radius:999px;background:var(--card);border:1px solid var(--line);font-size:12px}
.ssb-rec-i .ssb-face{width:24px;height:24px}
.ssb-rec-i em{color:var(--dim);font-style:normal}
.ssb-empty{padding:40px;text-align:center;color:var(--dim)}
@media (max-width:560px){.ssb{padding:16px 12px}.ssb-t{font-size:21px}.ssb-grid,.ssb-env-row{grid-template-columns:1fr}.ssb-own{grid-template-columns:1fr}.ssb-stats{gap:12px}}`;

const faceOf = p => {
  let url = '';
  try { url = playerAvatarUrl(p) || ''; } catch { url = ''; }
  return `<span class="ssb-face" style="--c:${colOf(p.name)}">${url ? `<img src="${esc(url)}" alt="" loading="lazy" onerror="this.remove()">` : ''}</span>`;
};
// (the Secret Box and the intruders play as hidden groups, js/ss/hidden-groups.js, not a weekly job of production.js)
const GROUP_JOBS = [{ id: 'intruders', label: 'The intruders: live hidden under the house, and sneak in' }, { id: 'secret-box', label: 'The Secret Box: watch the house from a hidden room, then walk in' }];
const jobOf = e => {
  const id = e?.plays || (/^prod-(.+)$/.exec(String(e?.id || '')) || [])[1];
  const j = ROLE_JOBS.find(r => r.id === id) || GROUP_JOBS.find(r => r.id === id);
  return j ? j.label.split(': ') : null;
};

/** The cast screen's Secrets tab: the Voice's envelopes, then one card per housemate. */
export function ssSecretsBoardHTML() {
  if (!isSecretStorySeason()) return '';
  ensureSsCast();
  const c = cast();
  if (!c.length) return `<style>${BOARD_CSS}</style><div class="ssb"><div class="ssb-empty">Add housemates, and every one of them walks in with a secret.</div></div>`;
  const names = c.map(p => p.name);
  const all = c.map(p => seasonConfig.ssSecrets?.[p.name]);
  const prodN = new Set(all.filter(e => e?.source === 'production').map(e => e.text)).size;
  // (a secret kept by two or more, any kind: a real tie, a production pair, a group; counted once)
  const shared = new Set(all.filter(e => e?.pair || (e?.group || []).length > 1).map(e => e.text)).size;
  // (a secret already given to somebody, or anybody's canon secret, is not offered twice)
  const takenIds = new Set([...all.map(e => e?.id).filter(Boolean), ...canonTaken()]);
  const cards = c.map(p => {
    const e = seasonConfig.ssSecrets?.[p.name];
    const [label, col] = SOURCE[e?.source] || SOURCE.pool;
    const locked = e?.source === 'canon';
    const hist = locked ? [] : historySecretOptions(p.name, { cast: names, pairs: pairs(), career: careers(p.name) });
    const n = esc(p.name);
    const partner = e?.group ? e.group.filter(m => m !== p.name).join(', ') : e?.pair || Object.entries(seasonConfig.ssSecrets || {}).find(([m, x]) => m !== p.name && x?.text && x.text === e?.text)?.[0];
    const job = e?.source === 'production' ? jobOf(e) : null;
    return `<div class="ssb-card" style="--sc:${col}">
      <div class="ssb-top">${faceOf(p)}
        <div><div class="ssb-nm">${n}</div><span class="ssb-src">${locked ? '🔒 ' : ''}${label}${job ? ` · ${esc(job[0])}` : ''}</span></div></div>
      <div class="ssb-q">${esc(e?.text || '—')}</div>
      ${partner ? `<div class="ssb-pair">${e?.source === 'production' ? `Cast by the Voice, with <b>${esc(partner)}</b>.` : `Shared with <b>${esc(partner)}</b>. They walk in pretending they have never met.`}</div>`
        : e?.source === 'production' ? '<div class="ssb-pair">Cast by the Voice.</div>' : ''}
      ${locked ? '<div class="ssb-lock">Canon: this secret is part of who they are now.</div>' : `<div class="ssb-act">
        <button type="button" class="ssb-btn" title="Draw another secret from the pool" onclick="ssReroll('${n}')">🎲 Reroll</button>
        <button type="button" class="ssb-btn" title="Write a secret for them" onclick="ssWriteOpen('${n}')">✎ Write</button>
        <select onchange="ssChoose('${n}',this.value)" title="Pick one of the secrets yourself"><option value="">Choose a secret…</option>${SECRET_KINDS.map(kd => {
          const opts = SECRET_POOL.filter(x => x.kind === kd.id && (!takenIds.has(x.id) || x.id === e?.id));
          return opts.length ? `<optgroup label="${esc(kd.label)}">${opts.map(x => `<option value="${esc(x.id)}" ${x.id === e?.id ? 'selected' : ''}>${esc(x.text)}</option>`).join('')}</optgroup>` : '';
        }).join('')}</select>
        ${hist.length ? `<select onchange="ssUseHistory('${n}',this.value)" title="Something true from their history"><option value="">From their life…</option>${hist.map((h, j) => `<option value="${j}">${esc(h.text)}</option>`).join('')}</select>` : ''}</div>
      <div class="ssb-write" id="ss-write-${n}"><input id="ss-write-text-${n}" placeholder="I have…">
        <select id="ss-write-kind-${n}">${SECRET_KINDS.map(k => `<option value="${k.id}">${esc(k.label)}</option>`).join('')}</select>
        <span><button type="button" class="ssb-btn primary" onclick="ssWriteSave('${n}')">Save the secret</button> <button type="button" class="ssb-btn" onclick="ssWriteOpen('${n}')">Cancel</button></span></div>`}
    </div>`;
  }).join('');
  const recog = (seasonConfig.ssRecognitions || []).filter(r => names.includes(r.who) && names.includes(r.whom));
  return `<style>${BOARD_CSS}</style><div class="ssb">
    <div class="ssb-h"><div class="ssb-brand"><span class="ssb-eye">${EYE}</span><div><div class="ssb-t">The Secrets</div>
      <div class="ssb-sub">Every housemate walks in hiding one. The public knows them all from launch night; the house knows none.</div></div></div>
      <div class="ssb-stats"><div class="ssb-stat"><b>${c.length}</b><span>Housemates</span></div><div class="ssb-stat"><b>${prodN}</b><span>Production</span></div><div class="ssb-stat"><b>${shared}</b><span>Shared</span></div>
        <button type="button" class="ssb-btn" onclick="ssRerollAll()" title="Draw again for every housemate whose secret was drawn">🎲 Redraw all</button></div></div>
    ${prodPanelHTML(c)}
    <div class="ssb-sec"><div class="ssb-sec-h"><div><h3>The housemates</h3><p>Reroll a secret, write one, or use something true from their life.</p></div></div>
      <div class="ssb-grid">${cards}</div></div>
    ${recog.length ? `<div class="ssb-rec"><div class="ssb-sec-h"><div><h3>Recognised walking in</h3><p>They know each other before the doors open.</p></div></div><div class="ssb-rec-l">${recog.map(r => {
      const a = c.find(p => p.name === r.who), b = c.find(p => p.name === r.whom);
      return `<span class="ssb-rec-i"><span class="ssb-faces">${a ? faceOf(a) : ''}${b ? faceOf(b) : ''}</span>${esc(r.who)} knows ${esc(r.whom)}${r.from ? ` <em>· ${esc(r.from)}</em>` : ''}</span>`;
    }).join('')}</div></div>` : ''}
  </div>`;
}
// The production secrets: the Voice's envelopes already cast, and the composer for a new one (the real ones from
// the seasons, or one of your own with the weekly job it plays).
function prodPanelHTML(c) {
  const cur = [...new Map(Object.entries(seasonConfig.ssSecrets || {}).filter(([, e]) => e?.source === 'production').map(([n, e]) => [e.text, e])).values()];
  const env = e => {
    const job = jobOf(e);
    const who = (e.group || []).map(n => c.find(p => p.name === n)).filter(Boolean);
    const key = esc(e.text).replace(/'/g, '&#39;');
    return `<div class="ssb-env"><button type="button" class="ssb-x" title="Take it away (they draw a secret of their own)" onclick="ssProdRemove('${key}')">✕</button>
      <button type="button" class="ssb-x ssb-ed" title="Edit it: the secret, who keeps it, the job" onclick="ssProdEdit('${key}')">✎</button>
      <div class="ssb-env-k">${job ? esc(job[0]) : 'A production secret'}</div>
      <div class="ssb-env-q">“${esc(e.text)}”</div>
      ${job?.[1] ? `<div class="ssb-env-job">Every week: ${esc(job[1])}.</div>` : '<div class="ssb-env-job">No weekly job: a secret to keep, nothing more.</div>'}
      <div class="ssb-env-who"><span class="ssb-faces">${who.map(faceOf).join('')}</span><span class="ssb-env-names">${esc(who.map(p => p.name).join(', '))}</span></div></div>`;
  };
  const busy = new Set(Object.entries(seasonConfig.ssSecrets || {}).filter(([, e]) => e?.source === 'production' || e?.source === 'canon').map(([n]) => n));
  return `<div class="ssb-sec"><div class="ssb-sec-h"><div><h3>Production secrets</h3><p>Roles the Voice hands out instead of a life story. Each one comes with a job, every week.</p></div>
      <button type="button" class="ssb-btn" onclick="ssProdDraw()" title="Let the Voice choose one, and who keeps it">🎲 Let the Voice draw one</button></div>
    <div class="ssb-env-row">${cur.map(env).join('')}
      <button type="button" class="ssb-new" onclick="ssProdOpen()"><b>+ New production secret</b><span>Choose it, then who keeps it</span></button></div>
    <div class="ssb-comp" id="ss-prod-comp"><button type="button" class="ssb-x" style="position:relative;float:right;right:0;top:0" title="Close" onclick="ssProdOpen(false)">✕</button>
      <div class="ssb-step"><div class="ssb-step-h"><i>1</i>Choose the secret <small>· from the seasons, or write your own</small></div>
        <div class="ssb-tiles">${PRODUCTION_SECRETS.map(d => `<button type="button" class="ssb-tile" data-def="${d.id}" data-min="${d.min || 1}" data-max="${d.max || 4}" onclick="ssProdPick(this)"><b>“${esc(d.text)}”</b><span>${esc(d.from)} · ${d.min === d.max ? d.min : `${d.min}–${d.max}`} ${d.max > 1 ? 'housemates' : 'housemate'}</span></button>`).join('')}
          <button type="button" class="ssb-tile own" data-def="own" data-min="1" data-max="6" onclick="ssProdPick(this)"><b>✎ Write my own</b><span>Your words, and the job it plays</span></button></div></div>
      <div class="ssb-step"><div class="ssb-own" id="ss-prod-own">
        <label class="wide">The secret, as the Voice says it<input id="ss-prod-own-text" placeholder="We are…"></label>
        <label class="wide">Plays like<select id="ss-prod-own-plays"><option value="">No weekly job: just a secret</option>${ROLE_JOBS.map(r => `<option value="${r.id}" data-min="${r.min}">${esc(r.label)}${r.min > 1 ? ` (${r.min} or more)` : ''}</option>`).join('')}</select></label>
        <label>A clue the house can find<input id="ss-prod-own-c1" placeholder="optional"></label>
        <label>A second clue<input id="ss-prod-own-c2" placeholder="optional"></label></div></div>
      <div class="ssb-step"><div class="ssb-step-h"><i>2</i>Who keeps it <small id="ss-prod-need">· click their faces</small></div>
        <div class="ssb-people">${c.map(p => `<button type="button" class="ssb-person${busy.has(p.name) ? ' busy' : ''}" data-name="${esc(p.name)}" onclick="ssProdWho(this)" title="${busy.has(p.name) ? 'Already has a production or canon secret: casting replaces it' : ''}">${faceOf(p)}${esc(p.name)}</button>`).join('')}</div></div>
      <div class="ssb-comp-f"><span class="ssb-comp-msg" id="ss-prod-msg">Choose a secret, then who keeps it.</span>
        <span><button type="button" class="ssb-btn" onclick="ssProdOpen(false)">Cancel</button> <button type="button" class="ssb-btn primary" id="ss-prod-go" onclick="ssProdCast()" disabled>Cast it</button></span></div>
    </div></div>`;
}
// the composer's state lives in the page (picking a face never redraws, so what you typed stays)
const $ = id => (typeof document !== 'undefined' ? document.getElementById(id) : null);
function prodCheck() {
  const tile = document.querySelector('.ssb-tile.on');
  const who = document.querySelectorAll('.ssb-person.on').length;
  const own = tile?.dataset.def === 'own';
  const playsMin = own ? Number(/** @type {HTMLSelectElement|null} */ ($('ss-prod-own-plays'))?.selectedOptions?.[0]?.dataset.min || 1) : 1;
  const min = Math.max(Number(tile?.dataset.min || 1), playsMin), max = Number(tile?.dataset.max || 4);
  const text = own ? String(/** @type {HTMLInputElement|null} */ ($('ss-prod-own-text'))?.value || '').trim() : 'x';
  const need = $('ss-prod-need');
  if (need) need.textContent = tile ? `· ${min === max ? min : `${min} to ${max}`} ${max > 1 ? 'housemates' : 'housemate'}, ${who} chosen` : '· click their faces';
  const ok = !!tile && who >= min && who <= max && !!text;
  const go = /** @type {HTMLButtonElement|null} */ ($('ss-prod-go'));
  if (go) go.disabled = !ok;
  const msg = $('ss-prod-msg');
  if (msg) msg.textContent = !tile ? 'Choose a secret, then who keeps it.' : !text ? 'Write the secret.' : who < min ? `Choose ${min - who} more.` : who > max ? `Too many: at most ${max}.` : 'Ready.';
}
// the production secret being edited (its words), while the composer is open on it
let editing = null;
/** Opens the composer on a production secret already cast: its words, who keeps it, its job. */
export function ssProdEdit(text) {
  const all = Object.entries(seasonConfig.ssSecrets || {}).filter(([, e]) => e?.source === 'production' && e.text === text);
  if (!all.length) return;
  const e = all[0][1];
  const el = $('ss-prod-comp');
  if (!el) return;
  el.classList.add('on');
  editing = text;
  const id = (/^prod-(.+)$/.exec(String(e.id || '')) || [])[1];
  const tile = /** @type {HTMLElement|null} */ (document.querySelector(`.ssb-tile[data-def="${id && PRODUCTION_SECRETS.some(d => d.id === id && d.text === text) ? id : 'own'}"]`));
  if (tile) ssProdPick(tile);
  if (tile?.dataset.def === 'own') {
    const set = (k, v) => { const x = /** @type {HTMLInputElement|null} */ ($(k)); if (x) x.value = v || ''; };
    set('ss-prod-own-text', e.text); set('ss-prod-own-plays', e.plays || ''); set('ss-prod-own-c1', (e.clues || [])[0]); set('ss-prod-own-c2', (e.clues || [])[1]);
  }
  const keep = new Set(all.map(([n]) => n));
  document.querySelectorAll('.ssb-person').forEach(b => b.classList.toggle('on', keep.has(/** @type {HTMLElement} */ (b).dataset.name || '')));
  const go = $('ss-prod-go');
  if (go) go.textContent = 'Save the changes';
  el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  prodCheck();
  const ownT = $('ss-prod-own-text'), ownP = $('ss-prod-own-plays');
  if (ownT && !ownT.dataset.bound) { ownT.dataset.bound = '1'; ownT.addEventListener('input', prodCheck); ownP?.addEventListener('change', prodCheck); }
}
/** Opens (or closes) the composer for a new production secret. */
export function ssProdOpen(open = true) {
  editing = null;
  const go0 = $('ss-prod-go');
  if (go0) go0.textContent = 'Cast it';
  const el = $('ss-prod-comp');
  if (!el) return;
  // (the "+ New" card toggles it; Cancel closes it)
  if (open === false) el.classList.remove('on'); else el.classList.toggle('on');
  if (el.classList.contains('on')) { el.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); prodCheck(); }
  const ownT = $('ss-prod-own-text'), ownP = $('ss-prod-own-plays');
  if (ownT && !ownT.dataset.bound) { ownT.dataset.bound = '1'; ownT.addEventListener('input', prodCheck); ownP?.addEventListener('change', prodCheck); }
}
/** Step 1: a secret from the seasons, or "write my own". */
export function ssProdPick(tile) {
  document.querySelectorAll('.ssb-tile.on').forEach(t => t.classList.remove('on'));
  tile.classList.add('on');
  $('ss-prod-own')?.classList.toggle('on', tile.dataset.def === 'own');
  prodCheck();
}
/** Step 2: a face clicked in or out. */
export function ssProdWho(btn) { btn.classList.toggle('on'); prodCheck(); }
/** Casts the composed production secret on the chosen housemates. */
export function ssProdCast() {
  const tile = /** @type {HTMLElement|null} */ (document.querySelector('.ssb-tile.on'));
  const sel = tile?.dataset.def;
  const val = id => String(/** @type {HTMLInputElement|null} */ ($(id))?.value || '').trim();
  const clues = [val('ss-prod-own-c1'), val('ss-prod-own-c2')].filter(Boolean);
  const def = sel === 'own' ? { text: val('ss-prod-own-text'), plays: val('ss-prod-own-plays') || undefined, ...(clues.length ? { clues } : {}) } : PRODUCTION_SECRETS.find(d => d.id === sel);
  const who = [...document.querySelectorAll('.ssb-person.on')].map(x => /** @type {HTMLElement} */ (x).dataset.name || '').filter(Boolean);
  if (!def?.text || !who.length) return;
  const max = def.max || 6;
  const holders = who.slice(0, max);
  const next = { ...(seasonConfig.ssSecrets || {}) };
  // editing: the old one goes; whoever it no longer covers draws a secret of their own
  if (editing) {
    for (const [n, e] of Object.entries(next)) if (e?.source === 'production' && e.text === editing && !holders.includes(n)) {
      const r = rerollSecret(playerNamed(n), next, { taken: canonTaken() });
      if (r) next[n] = r; else delete next[n];
    }
    editing = null;
  }
  // whoever already held a group secret with one of these leaves it whole for the others
  for (const n of holders) if (next[n]?.group) for (const m of next[n].group) if (!holders.includes(m) && next[m]) next[m] = { ...next[m], group: next[m].group.filter(x => !holders.includes(x)) };
  seasonConfig.ssSecrets = { ...next, ...productionSecret(def, holders) };
  persist(); renderSsSecrets();
}
/** The Voice picks a production secret and who keeps it. */
export function ssProdDraw() {
  const d = drawProductionSecret(cast(), { avoid: new Set(Object.entries(seasonConfig.ssSecrets || {}).filter(([, e]) => e?.source === 'canon' || e?.source === 'production').map(([n]) => n)) });
  if (!d) return;
  seasonConfig.ssSecrets = { ...(seasonConfig.ssSecrets || {}), ...productionSecret(d.def, d.holders) };
  persist(); renderSsSecrets();
}
/** Takes a production secret away: its holders draw secrets of their own. */
export function ssProdRemove(text) {
  const next = { ...(seasonConfig.ssSecrets || {}) };
  for (const [n, e] of Object.entries(next)) if (e?.source === 'production' && e.text === text) {
    const r = rerollSecret(playerNamed(n), next, { taken: canonTaken() });
    if (r) next[n] = r; else delete next[n];
  }
  seasonConfig.ssSecrets = next;
  persist(); renderSsSecrets();
}

/** Draws another for every housemate whose secret came from the pool. */
export function ssRerollAll() {
  for (const p of cast()) {
    const e = seasonConfig.ssSecrets?.[p.name];
    if ((e?.source || 'pool') !== 'pool') continue;
    const next = rerollSecret(p, seasonConfig.ssSecrets || {}, { taken: canonTaken() });
    if (next) seasonConfig.ssSecrets = { ...(seasonConfig.ssSecrets || {}), [p.name]: next };
  }
  persist(); renderSsSecrets();
}

/** Redraws the secrets wherever they are shown: the cast screen's Secrets tab (and the old setup slot, if any). */
export function renderSsSecrets() {
  try { if (typeof window !== 'undefined' && window._crView === 'secrets') window.crRenderGrid?.(); } catch { /* the cast screen is not open */ }
  const host = typeof document !== 'undefined' && document.getElementById('ss-secrets');
  if (!host) return;
  if (seasonFormat(seasonConfig) !== SS_FORMAT) { host.innerHTML = ''; return; }
  ensureSsCast();
  const c = cast();
  if (!c.length) { host.innerHTML = '<div class="hint">Pick the cast, and every housemate gets a secret here.</div>'; return; }
  const names = c.map(p => p.name);
  const rows = c.map(p => {
    const e = seasonConfig.ssSecrets?.[p.name];
    const [label, col] = BADGE[e?.source] || BADGE.pool;
    const hist = historySecretOptions(p.name, { cast: names, pairs: pairs(), career: careers(p.name) });
    const locked = e?.source === 'canon';
    const n = esc(p.name);
    return `<div class="ss-row" style="display:grid;grid-template-columns:110px 1fr auto;gap:8px;align-items:center;padding:5px 0;border-bottom:1px solid rgba(255,255,255,.06)">
      <b style="font-size:12px">${n}</b>
      <span style="font-size:12px;font-style:italic">"${esc(e?.text || '—')}"
        <span style="font-style:normal;font-size:9px;font-weight:700;letter-spacing:.06em;color:${col};margin-left:6px">${locked ? '🔒 ' : ''}${label}</span></span>
      <span style="display:flex;gap:4px">${locked ? '' : `
        <button type="button" class="btn btn-secondary btn-sm" title="Draw another" onclick="ssReroll('${n}')">🎲</button>
        <button type="button" class="btn btn-secondary btn-sm" title="Write my own" onclick="ssWriteOpen('${n}')">✍️</button>
        ${hist.length ? `<select class="form-input" style="max-width:150px;font-size:11px" onchange="ssUseHistory('${n}',this.value)">
          <option value="">Real history…</option>${hist.map((h, i) => `<option value="${i}">${esc(h.text)}</option>`).join('')}</select>` : ''}`}</span>
      <div id="ss-write-${n}" style="display:none;grid-column:1/-1;gap:6px">
        <input class="form-input" id="ss-write-text-${n}" placeholder="I have…" style="flex:1">
        <select class="form-input" id="ss-write-kind-${n}">${SECRET_KINDS.map(k => `<option value="${k.id}">${esc(k.label)}</option>`).join('')}</select>
        <button type="button" class="btn btn-secondary btn-sm" onclick="ssWriteSave('${n}')">Save</button>
      </div>
    </div>`;
  }).join('');
  const recog = (seasonConfig.ssRecognitions || []).filter(r => names.includes(r.who) && names.includes(r.whom));
  host.innerHTML = `<div class="hint hint-tight" style="margin-bottom:6px">Every housemate walks in hiding one of these. The audience sees them all; the house sees none.
    Once the season starts, a secret becomes part of who they are.</div>${rows}
    ${recog.length ? `<div class="hint hint-tight" style="margin-top:8px"><b>Recognised walking in:</b> ${recog.slice(0, 12).map(r =>
      `${esc(r.who)} knows ${esc(r.whom)}${r.from ? ` (${esc(r.from)})` : ''}`).join(' · ')}${recog.length > 12 ? ` · and ${recog.length - 12} more` : ''}</div>` : ''}`;
}

const playerNamed = n => cast().find(p => p.name === n) || { name: n };

export function ssReroll(name) {
  const e = rerollSecret(playerNamed(name), seasonConfig.ssSecrets || {}, { taken: canonTaken() });
  if (!e) return;
  seasonConfig.ssSecrets = { ...(seasonConfig.ssSecrets || {}), [name]: e };
  persist(); renderSsSecrets();
}

/** A secret picked by hand from the pool for one housemate. */
export function ssChoose(name, id) {
  if (!id) return;
  const e = pickedSecret(id);
  if (!e) return;
  seasonConfig.ssSecrets = { ...(seasonConfig.ssSecrets || {}), [name]: e };
  persist(); renderSsSecrets();
}

export function ssWriteOpen(name) {
  const el = document.getElementById(`ss-write-${name}`);
  if (!el) return;
  if (el.classList.contains('ssb-write')) el.classList.toggle('on');
  else el.style.display = el.style.display === 'none' ? 'flex' : 'none';
}

export function ssWriteSave(name) {
  const text = document.getElementById(`ss-write-text-${name}`)?.value;
  const kind = document.getElementById(`ss-write-kind-${name}`)?.value;
  const e = writtenSecret(text, kind);
  if (!e) return;
  seasonConfig.ssSecrets = { ...(seasonConfig.ssSecrets || {}), [name]: e };
  persist(); renderSsSecrets();
}

export function ssUseHistory(name, idx) {
  if (idx === '' || idx == null) return;
  const names = cast().map(p => p.name);
  const opt = historySecretOptions(name, { cast: names, pairs: pairs(), career: careers(name) })[Number(idx)];
  if (!opt) return;
  const next = { ...(seasonConfig.ssSecrets || {}), [name]: { ...opt } };
  // A shared tie is the other person's secret too.
  if (opt.pair) next[opt.pair] = { ...opt, pair: name };
  seasonConfig.ssSecrets = next;
  persist(); renderSsSecrets();
}

/** The house theme picker's options, for the HTML. */
export const ssHouseThemeOptions = () => SS_HOUSE_THEMES;

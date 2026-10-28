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
import { castSecrets, rerollSecret, writtenSecret, historySecretOptions, recognitions, SS_HOUSE_THEMES, SECRET_KINDS } from './casting.js';
import { playerAvatarUrl } from '../players.js';

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
  if (JSON.stringify(seasonConfig.ssSecrets) !== before) persist();
}

const BADGE = { pool: ['DRAWN', '#8b8fa3'], own: ['YOURS', '#e0b84a'], history: ['REAL', '#5fb3ff'], canon: ['CANON', '#c084fc'] };

/** Is the season being cast a Secret Story season? (the cast screen asks, to show its Secrets tab) */
export function isSecretStorySeason() { return seasonFormat(seasonConfig) === SS_FORMAT; }

// THE SECRETS TAB of the cast screen (the user, 2026-10-28: "secret assignment should be better visually and be in
// cast setup, not in season setup: a tab next to Grid/Tribes, like The Circle"). Every housemate as a card: the face,
// the name, the secret on a pill in the show's colours, where it came from, and the ways to change it.
const PAL = ['#ff3ea5', '#19d3c5', '#7c5cff', '#f5c542', '#ff7a59', '#3bb3ff', '#c8137a', '#22c55e'];
const colOf = n => PAL[[...String(n)].reduce((h, c) => h + c.charCodeAt(0), 0) % PAL.length];
const BOARD_CSS = `
@font-face{font-family:'SSFredoka';src:url('assets/fonts/Fredoka.woff2') format('woff2');font-weight:300 700}
.ssb{--p:#ff3ea5;--m:#c8137a;--t:#19d3c5;--i:#2b0d3f;--g:#f5c542;border-radius:18px;padding:20px 18px 26px;color:#fff;
  background:radial-gradient(ellipse 60% 30% at 15% 100%,rgba(255,255,255,.18),transparent 70%),radial-gradient(ellipse 50% 26% at 90% 0%,rgba(255,255,255,.14),transparent 70%),
  linear-gradient(170deg,#7c5cff 0%,#c8137a 45%,#5b0d4f 100%)}
.ssb-h{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px}
.ssb-t{font:700 30px/1 'SSFredoka',sans-serif;letter-spacing:.01em;background:linear-gradient(90deg,#fff,#ffd0e6 40%,#b8fff6);-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 2px 0 rgba(0,0,0,.18))}
.ssb-sub{font-size:13px;opacity:.9;max-width:62ch;margin-top:4px}
.ssb-tally{display:flex;gap:6px;flex-wrap:wrap}
.ssb-chip{font:800 11px/1 system-ui,sans-serif;letter-spacing:.08em;padding:6px 9px;border-radius:999px;background:rgba(255,255,255,.16);border:1px solid rgba(255,255,255,.3)}
.ssb-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:14px}
.ssb-card{position:relative;border-radius:16px;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.25);padding:12px 12px 10px;backdrop-filter:blur(4px);
  box-shadow:0 10px 24px rgba(43,13,63,.35);display:flex;flex-direction:column;gap:10px;transition:transform .15s}
.ssb-card:hover{transform:translateY(-2px)}
.ssb-top{display:flex;align-items:center;gap:10px}
.ssb-face{width:54px;height:54px;border-radius:50%;overflow:hidden;flex:none;background:var(--c);box-shadow:0 0 0 3px #fff}
.ssb-face img{width:100%;height:100%;object-fit:cover;object-position:50% 15%}
.ssb-nm{font:700 18px/1.1 'SSFredoka',sans-serif}
.ssb-src{display:inline-block;margin-top:3px;font:800 9px/1 system-ui,sans-serif;letter-spacing:.1em;padding:4px 7px;border-radius:999px;background:#fff;color:var(--sc)}
.ssb-pill{position:relative;border-radius:14px;padding:12px 12px 12px 14px;font:800 13.5px/1.3 system-ui,sans-serif;text-transform:uppercase;letter-spacing:.01em;color:#fff;
  background:linear-gradient(90deg,var(--g1),var(--g2));box-shadow:0 0 0 2px rgba(255,255,255,.85)}
.ssb-pill.g0{--g1:#fff;--g2:#ffe3f3;color:#c8137a}.ssb-pill.g1{--g1:#3bb3ff;--g2:#ff3ea5}.ssb-pill.g2{--g1:#7c5cff;--g2:#ff7a59}.ssb-pill.g3{--g1:#ff3ea5;--g2:#f5c542}
.ssb-pill .seal{position:absolute;right:8px;top:-9px;font:700 9px/1 'SSFredoka',sans-serif;letter-spacing:.2em;background:#e11d48;color:#fff;padding:4px 7px;border-radius:6px;border:2px solid #fff;rotate:6deg}
.ssb-pair{font-size:12px;font-weight:700;color:#ffe14d}
.ssb-act{display:flex;flex-wrap:wrap;gap:6px}
.ssb-act button,.ssb-act select{font:700 12px system-ui,sans-serif;border-radius:999px;border:1.5px solid rgba(255,255,255,.7);background:rgba(43,13,63,.35);color:#fff;padding:6px 10px;cursor:pointer;max-width:100%}
.ssb-act select{max-width:150px}
.ssb-act button:hover{background:rgba(255,255,255,.2)}
.ssb-lock{font-size:12px;opacity:.85}
.ssb-write{display:none;flex-direction:column;gap:6px}
.ssb-write.on{display:flex}
.ssb-write input,.ssb-write select{border-radius:10px;border:0;padding:8px 10px;font:600 13px system-ui,sans-serif}
.ssb-write button{align-self:flex-start;border-radius:999px;border:0;background:#fff;color:#c8137a;font:800 12px system-ui,sans-serif;padding:7px 14px;cursor:pointer}
.ssb-rec{margin-top:16px;padding:12px 14px;border-radius:14px;background:rgba(43,13,63,.35)}
.ssb-rec b{font:700 15px 'SSFredoka',sans-serif;display:block;margin-bottom:6px}
.ssb-rec span{display:inline-block;margin:3px 6px 3px 0;font-size:12px;padding:5px 9px;border-radius:999px;background:rgba(255,255,255,.14)}
.ssb-empty{padding:30px;text-align:center;font-size:15px}
@media (max-width:560px){.ssb-t{font-size:24px}.ssb-grid{grid-template-columns:1fr}}`;

/** The cast screen's Secrets tab: one card per housemate. */
export function ssSecretsBoardHTML() {
  if (!isSecretStorySeason()) return '';
  ensureSsCast();
  const c = cast();
  if (!c.length) return `<style>${BOARD_CSS}</style><div class="ssb"><div class="ssb-empty">Add housemates, and every one of them walks in with a secret.</div></div>`;
  const names = c.map(p => p.name);
  const all = c.map(p => seasonConfig.ssSecrets?.[p.name]);
  const tally = Object.keys(BADGE).map(k => [k, all.filter(e => (e?.source || 'pool') === k).length]).filter(([, v]) => v);
  const cards = c.map((p, i) => {
    const e = seasonConfig.ssSecrets?.[p.name];
    const [label, col] = BADGE[e?.source] || BADGE.pool;
    const locked = e?.source === 'canon';
    const hist = locked ? [] : historySecretOptions(p.name, { cast: names, pairs: pairs(), career: careers(p.name) });
    const n = esc(p.name);
    const partner = e?.pair || Object.entries(seasonConfig.ssSecrets || {}).find(([m, x]) => m !== p.name && x?.text && x.text === e?.text)?.[0];
    let url = '';
    try { url = playerAvatarUrl(p) || ''; } catch { url = ''; }
    return `<div class="ssb-card">
      <div class="ssb-top"><span class="ssb-face" style="--c:${colOf(p.name)}">${url ? `<img src="${esc(url)}" alt="" loading="lazy" onerror="this.remove()">` : ''}</span>
        <span><div class="ssb-nm">${n}</div><span class="ssb-src" style="--sc:${col}">${locked ? '🔒 ' : ''}${label}</span></span></div>
      <div class="ssb-pill g${i % 4}"><span class="seal">SECRET</span>${esc(e?.text || '—')}</div>
      ${partner ? `<div class="ssb-pair">Shared with ${esc(partner)}: they walk in pretending they have never met.</div>` : ''}
      ${locked ? '<div class="ssb-lock">Canon: this secret is part of who they are now.</div>' : `<div class="ssb-act">
        <button type="button" title="Draw another from the pool" onclick="ssReroll('${n}')">🎲 Reroll</button>
        <button type="button" title="Write my own" onclick="ssWriteOpen('${n}')">✍️ Write</button>
        ${hist.length ? `<select onchange="ssUseHistory('${n}',this.value)" title="Something true from their history"><option value="">Real history…</option>${hist.map((h, j) => `<option value="${j}">${esc(h.text)}</option>`).join('')}</select>` : ''}</div>
      <div class="ssb-write" id="ss-write-${n}"><input id="ss-write-text-${n}" placeholder="I have…">
        <select id="ss-write-kind-${n}">${SECRET_KINDS.map(k => `<option value="${k.id}">${esc(k.label)}</option>`).join('')}</select>
        <button type="button" onclick="ssWriteSave('${n}')">Save the secret</button></div>`}
    </div>`;
  }).join('');
  const recog = (seasonConfig.ssRecognitions || []).filter(r => names.includes(r.who) && names.includes(r.whom));
  return `<style>${BOARD_CSS}</style><div class="ssb">
    <div class="ssb-h"><div><div class="ssb-t">The List of Secrets</div>
      <div class="ssb-sub">Every housemate walks in hiding one of these. The public sees them all on launch night; the house sees none. Once the season starts, a secret becomes part of who they are.</div></div>
      <div class="ssb-tally">${tally.map(([k, v]) => `<span class="ssb-chip">${v} ${BADGE[k][0]}</span>`).join('')}<button type="button" class="ssb-chip" style="cursor:pointer" onclick="ssRerollAll()">🎲 Reroll every drawn secret</button></div></div>
    <div class="ssb-grid">${cards}</div>
    ${recog.length ? `<div class="ssb-rec"><b>Recognised walking in</b>${recog.map(r => `<span>${esc(r.who)} knows ${esc(r.whom)}${r.from ? ` · ${esc(r.from)}` : ''}</span>`).join('')}</div>` : ''}
  </div>`;
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

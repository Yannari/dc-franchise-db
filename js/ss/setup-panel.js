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

/** Draw the panel into #ss-secrets. */
export function renderSsSecrets() {
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
  if (el) el.style.display = el.style.display === 'none' ? 'flex' : 'none';
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

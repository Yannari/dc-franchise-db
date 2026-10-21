// ═════════════════════════════════════════════════════════════════════
// season-switcher.js — the seasons on air right now, one click apart
// ═════════════════════════════════════════════════════════════════════
//
// The franchise calendar airs shows side by side (Total Drama and The
// Challenge share the fall), but the simulator holds ONE season: `gs` in
// IndexedDB, its setup in localStorage. Playing two meant Save season, change
// show in Setup (the load list only shows the selected show), load, and back —
// the user, 2026-10-21: "how can i run 2 simulation at the same time like the
// calendar ask".
//
// So a season can be PAUSED: its whole state goes to a slot of its own and the
// strip over the Season Hub shows one chip per season on air, in calendar
// order. A click pauses the one playing and resumes the other.
//
// WHAT A SLOT HOLDS: the four things a season is (setup, cast, relationships,
// pre-game alliances) and its `gs` — the same as a Save season — plus its
// replay CHECKPOINTS. Those are global keys (`cp_<episode>`), so a switch that
// left them would hand season B the undo of season A's episode 3. They move
// with their season: `cp_3` becomes `lcp_<slot>_3` while it is paused.
//
// A SWITCH RELOADS THE PAGE. Every engine and screen reads its season at
// start; writing the season where startup reads it and reloading is the one
// way nothing is left holding the other show (a module-level cache, a queue,
// a broadcast bar). The reload is covered by the channel change.
//
// A slot's id rides on its own `gs` (`gs._liveSlot`), not on show + number:
// an unexported season has no number of its own until the calendar gives it
// one, and two seasons of one show set up back to back would be given the same.

import { gs, players, seasonConfig, relationships, preGameAlliances,
         prepGsForSave, repairGsSets, seasonFormat } from './core.js';
import { _idbGet, _idbPut, _idbDelete, _idbKeys, lastStorageFailure, clearStorageFailure } from './savestate.js';
import { loadSeasonsDb, liveSeason, nextNumber, windowOf } from './air-watch.js';
import { premiereDate } from './franchise-calendar.js';
import { SHOWS } from './shows.js';

const INDEX_KEY = 'live_seasons';
const slotKey = id => 'live_' + id;
const cpPrefix = id => `lcp_${id}_`;
const TUNED_KEY = 'ssw_tuned';
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const shortDate = ms => { if (!ms) return ''; const d = new Date(ms); return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`; };
const newId = () => 's' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

async function readIndex() {
  try { const ix = await _idbGet(INDEX_KEY); return Array.isArray(ix) ? ix : []; } catch { return []; }
}

/**
 * What a chip says about a season: show, number, how far it has aired and
 * where it sits on the calendar. Exported seasons are marked, not hidden: the
 * user decides when a finished one leaves the strip.
 */
export function seasonMeta(g, cfg, cast, seasons) {
  const format = seasonFormat(cfg);
  const number = Number(cfg?.seasonNumber || g?.seasonNumber) || nextNumber(seasons, format);
  const exported = seasons.some(s => s.format === format && Number(s.seasonNumber) === number);
  const aired = (g?.episodeHistory || []).filter(Boolean).length;
  const live = g ? liveSeason(g, cfg, seasons, { castSize: cast?.length || null }) : null;
  const window = live?.window || (g?.airWindow) || windowOf(seasons, format, number);
  const premiere = live?.premiere || (window ? premiereDate(window, format) : null);
  return {
    format, number,
    name: cfg?.name || '',
    test: !!cfg?.testSeason,
    // On air once its premiere has played: that is also when the calendar fixes its dates.
    started: aired > 0,
    aired,
    total: live?.total || null,
    done: !!live?.done || g?.phase === 'complete',
    exported,
    premiere: premiere ? premiere.getTime() : null,
    current: live?.current ? live.current.getTime() : null,
    finale: live?.finale ? live.finale.getTime() : null,
  };
}

/** The season in the simulator right now, as a chip, or null when nothing is set up. */
function currentMeta(seasons) {
  if (!gs?.initialized && !players?.length) return null;
  return { id: gs?._liveSlot || null, now: true, ...seasonMeta(gs?.initialized ? gs : null, seasonConfig, players, seasons) };
}

// ── MOVING A SEASON ──────────────────────────────────────────────────

/** Copy each key to its new name, then drop the old one — never drop one whose copy did not land. */
async function moveKeys(pairs) {
  for (const [from, to] of pairs) {
    const v = await _idbGet(from);
    if (v === undefined) continue;
    clearStorageFailure();
    await _idbPut(to, v);
    if (lastStorageFailure()?.key === to) throw new Error(lastStorageFailure().quota
      ? 'The browser is out of storage space.' : lastStorageFailure().message);
    await _idbDelete(from);
  }
}

/** Put the season playing now into its slot, checkpoints and all. Returns its id. */
async function pauseCurrent(seasons) {
  if (!gs._liveSlot) gs._liveSlot = newId();
  const id = gs._liveSlot;
  prepGsForSave(gs);
  const data = {
    type: 'live-season',
    config: { ...seasonConfig },
    players: players.map(p => ({ ...p })),
    relationships: relationships.map(r => ({ ...r })),
    preGameAlliances: (preGameAlliances || []).map(a => ({ ...a })),
    gs: JSON.parse(JSON.stringify(gs)),
  };
  repairGsSets(gs);
  clearStorageFailure();
  await _idbPut(slotKey(id), data);
  if (lastStorageFailure()?.key === slotKey(id)) throw new Error(lastStorageFailure().quota
    ? 'The browser is out of storage space.' : lastStorageFailure().message);
  const all = (await _idbKeys()).filter(k => typeof k === 'string');
  // A slot paused before, resumed from a regular save and paused again: its old undo goes first.
  for (const k of all.filter(k => k.startsWith(cpPrefix(id)))) await _idbDelete(k);
  await moveKeys(all.filter(k => /^cp_\d+$/.test(k)).map(k => [k, cpPrefix(id) + k.slice(3)]));
  const index = (await readIndex()).filter(e => e.id !== id);
  index.push({ id, updated: Date.now(), ...seasonMeta(data.gs, data.config, data.players, seasons) });
  await _idbPut(INDEX_KEY, index);
  return id;
}

/** Drop the current season's leftovers so the next one starts clean. */
async function clearCurrent() {
  const keys = (await _idbKeys()).filter(k => typeof k === 'string' && /^cp_\d+$/.test(k));
  for (const k of keys) await _idbDelete(k);
  await _idbDelete('gs');
}

/** Write a paused season where startup reads one, and take it out of the strip's paused list. */
async function resumeSlot(id) {
  const data = await _idbGet(slotKey(id));
  if (!data?.gs || !data?.config) throw new Error('That paused season could not be read.');
  localStorage.setItem('simulator_config', JSON.stringify(data.config));
  localStorage.setItem('simulator_cast', JSON.stringify(data.players || []));
  localStorage.setItem('simulator_rels', JSON.stringify(data.relationships || []));
  localStorage.setItem('simulator_prealliances', JSON.stringify(data.preGameAlliances || []));
  clearStorageFailure();
  await _idbPut('gs', data.gs);
  if (lastStorageFailure()?.key === 'gs') throw new Error(lastStorageFailure().message);
  const keys = (await _idbKeys()).filter(k => typeof k === 'string' && k.startsWith(cpPrefix(id)));
  await moveKeys(keys.map(k => [k, 'cp_' + k.slice(cpPrefix(id).length)]));
  await _idbDelete(slotKey(id));
  await _idbPut(INDEX_KEY, (await readIndex()).filter(e => e.id !== id));
}

/** The season playing now can be paused: its premiere has played and it has not been exported. */
function pausable(meta) { return !!meta?.started && !meta.exported; }

function leaveWarning(cur) {
  if (!cur) return '';
  const label = `${SHOWS[cur.format]?.short || ''} ${cur.number}`;
  if (cur.started && cur.exported) return `${label} is already exported, so it isn't kept on air. Its episodes stay on the site.`;
  if (!cur.started && players?.length) return `The new season of ${SHOWS[cur.format]?.name || 'this show'} you're setting up hasn't played its premiere, so it isn't kept on air.`;
  return '';
}

// ── THE TWO ACTIONS ──────────────────────────────────────────────────

/** Pause the season playing now and resume a paused one. */
export async function switchLiveSeason(id) {
  const seasons = await loadSeasonsDb();
  const index = await readIndex();
  const target = index.find(e => e.id === id);
  if (!target) { renderSeasonSwitch(); return; }
  const cur = currentMeta(seasons);
  const warn = pausable(cur) ? '' : leaveWarning(cur);
  if (warn && !confirm(`${warn}\n\nSwitch to ${SHOWS[target.format]?.name} ${target.number}?`)) return;
  const tune = tuneOut(target);
  try {
    if (pausable(cur)) await pauseCurrent(seasons);
    else await clearCurrent();
    await resumeSlot(id);
  } catch (e) {
    tune.cancel();
    alert(`The switch didn't happen, and nothing was lost: ${e.message || e}`);
    return;
  }
  try { localStorage.setItem('simulator_activeTab', 'run'); } catch { /* lands on the hub anyway */ }
  try { sessionStorage.setItem(TUNED_KEY, JSON.stringify({ format: target.format, number: target.number })); } catch { /* no flourish */ }
  await tune.done;
  location.reload();
}

/** Pause the season playing now and open Setup for another one. */
export async function startAnotherLiveSeason() {
  const seasons = await loadSeasonsDb();
  const cur = currentMeta(seasons);
  if (!pausable(cur)) {
    const warn = leaveWarning(cur);
    if (cur?.exported && !confirm(`${warn}\n\nStart another season?`)) return;
    if (cur?.exported) await clearCurrent();
    try { localStorage.setItem('simulator_activeTab', 'setup'); } catch { /* */ }
    location.reload();
    return;
  }
  const tune = tuneOut(null, cur);
  try {
    await pauseCurrent(seasons);
    await clearCurrent();
  } catch (e) {
    tune.cancel();
    alert(`The season wasn't paused, and nothing was lost: ${e.message || e}`);
    return;
  }
  try { localStorage.setItem('simulator_activeTab', 'setup'); } catch { /* */ }
  await tune.done;
  location.reload();
}

/**
 * Take a paused season off the air WITHOUT losing it: it becomes an ordinary
 * saved season (Season Hub → Load saved season, under its own show), the same
 * record Save season writes. Only its replay checkpoints go, as they do for
 * any save. An exported season is on the site already and simply leaves.
 * The user, 2026-10-21: "to remove a season from on air i have to finish it or delete it?" — neither.
 */
export async function removeLiveSeason(id, ev) {
  ev?.stopPropagation?.();
  const index = await readIndex();
  const e = index.find(x => x.id === id);
  if (!e) return;
  const label = `${SHOWS[e.format]?.name || ''} ${e.number}`;
  const ask = e.exported
    ? `Take ${label} off the air? It's exported, so nothing is lost.`
    : `Take ${label} off the air? It goes to your saved seasons (Load saved season, with ${SHOWS[e.format]?.name || 'its show'} selected in Setup), at episode ${e.aired}.`;
  if (!confirm(ask)) return;
  if (!e.exported) {
    const data = await _idbGet(slotKey(id));
    if (!data?.gs) { alert(`${label} could not be read, so it was left on the air.`); return; }
    try { await keepAsSave(data, e); }
    catch (err) { alert(`${label} was left on the air, nothing lost: ${err.message || err}`); return; }
  }
  const keys = (await _idbKeys()).filter(k => typeof k === 'string' && k.startsWith(cpPrefix(id)));
  for (const k of keys) await _idbDelete(k);
  await _idbDelete(slotKey(id));
  await _idbPut(INDEX_KEY, index.filter(x => x.id !== id));
  window.renderSeasonSaveList?.();
  renderSeasonSwitch();
}

/** Write a slot as a Save season record (js/cast-ui.js saveSeasonToStorage), under a name no other save has. */
async function keepAsSave(data, e) {
  const saves = (await _idbGet('season_index')) || [];
  const base = `${data.config?.name || `${SHOWS[e.format]?.name || 'Season'} ${e.number}`} (Ep ${e.aired})`;
  let name = base;
  for (let n = 2; saves.some(s => s.name === name); n++) name = `${base} ${n}`;
  const save = {
    version: 1, type: 'season-save', name,
    date: new Date().toISOString().slice(0, 10),
    episode: data.gs.episode || 0,
    config: data.config, players: data.players || [], relationships: data.relationships || [],
    preGameAlliances: data.preGameAlliances || [], gs: data.gs,
  };
  clearStorageFailure();
  await _idbPut('season_' + name, save);
  if (lastStorageFailure()?.key === 'season_' + name) throw new Error(lastStorageFailure().message);
  saves.push({ name, date: save.date, episode: save.episode, format: e.format, test: !!data.config?.testSeason });
  await _idbPut('season_index', saves);
}

// ── COLLAPSED ────────────────────────────────────────────────────────

const COLLAPSE_KEY = 'ssw_collapsed';
function isCollapsed() { try { return localStorage.getItem(COLLAPSE_KEY) === '1'; } catch { return false; } }

/** Fold the strip to one line of show icons, or open it again. Remembered per browser. */
export function toggleSeasonSwitch() {
  try { localStorage.setItem(COLLAPSE_KEY, isCollapsed() ? '0' : '1'); } catch { /* stays as drawn */ }
  renderSeasonSwitch({ animate: true });
}

// ── THE STRIP ────────────────────────────────────────────────────────

function chipHtml(m) {
  const show = SHOWS[m.format] || {};
  // The season being set up has no number of its own yet: the calendar would
  // give it the paused one's ("CH 1" twice) until one of them is exported.
  if (m.now && !m.started) {
    return `<div class="ssw-chip is-now is-setup" style="--ssw-acc:${show.accent || '#10b981'}" title="${esc(`A new season of ${show.name || 'this show'}, not started yet. Change the show in Setup.`)}">
      <span class="ssw-ico" aria-hidden="true">${show.emoji || '📺'}</span>
      <span class="ssw-txt"><b>New season</b><small>${esc(show.name || '')} · setting up</small></span></div>`;
  }
  const label = `${show.short || '?'} ${m.number}`;
  const pct = m.total ? Math.min(100, Math.round(100 * m.aired / m.total)) : 0;
  const state = m.exported ? 'Exported'
    : !m.started ? 'Premiere next'
    : m.done ? 'Finale aired'
    : `Ep ${m.aired}${m.total ? `/${m.total}` : ''}`;
  const when = m.current ? `on ${shortDate(m.current)}` : m.premiere ? `premieres ${shortDate(m.premiere)}` : '';
  const tip = [`${show.name || ''} ${m.number}${m.name && m.name !== `${show.name} ${m.number}` ? ` (${m.name})` : ''}`,
    m.premiere && m.finale ? `airs ${shortDate(m.premiere)} → ${shortDate(m.finale)}` : '',
    m.now ? 'playing now' : m.aired ? `paused after episode ${m.aired}` : 'paused before the premiere'].filter(Boolean).join(' · ');
  const cls = ['ssw-chip', m.now ? 'is-now' : '', m.exported ? 'is-done' : '', !m.started ? 'is-setup' : ''].filter(Boolean).join(' ');
  const inner = `<span class="ssw-ico" aria-hidden="true">${show.emoji || '📺'}</span>
    <span class="ssw-txt"><b>${m.test ? '🧪 ' : ''}${esc(label)}</b><small>${esc(state)}${when && !m.exported ? ` · ${esc(when)}` : ''}</small></span>
    ${m.now ? '<span class="ssw-live" aria-label="playing now"></span>' : ''}
    ${m.total && m.started && !m.exported ? `<span class="ssw-bar"><span style="width:${pct}%"></span></span>` : ''}`;
  if (m.now) return `<div class="${cls}" style="--ssw-acc:${show.accent || '#10b981'}" title="${esc(tip)}">${inner}</div>`;
  return `<div class="ssw-slot"><button type="button" class="${cls}" style="--ssw-acc:${show.accent || '#10b981'}" title="${esc(tip)}" onclick="switchLiveSeason('${esc(m.id)}')">${inner}</button>`
    + `<button type="button" class="ssw-x" title="Take ${esc(label)} off the air (it goes to your saved seasons)" aria-label="Take ${esc(label)} off the air" onclick="removeLiveSeason('${esc(m.id)}', event)">×</button></div>`;
}

/** Folded: one icon per season, the one playing ringed in its colour, the others still one click away. */
function miniHtml(m) {
  const show = SHOWS[m.format] || {};
  const label = m.now && !m.started ? 'New season' : `${show.short || '?'} ${m.number}`;
  const tip = `${m.now && !m.started ? `New season of ${show.name || ''}` : `${show.name || ''} ${m.number}`}${m.started ? ` · episode ${m.aired}${m.total ? ` of ${m.total}` : ''}` : ''}${m.now ? ' · playing now' : ' · click to switch'}`;
  return m.now
    ? `<span class="ssw-dot is-now" style="--ssw-acc:${show.accent || '#10b981'}" title="${esc(tip)}">${show.emoji || '📺'}</span>`
    : `<button type="button" class="ssw-dot" style="--ssw-acc:${show.accent || '#10b981'}" title="${esc(tip)}" aria-label="Switch to ${esc(label)}" onclick="switchLiveSeason('${esc(m.id)}')">${show.emoji || '📺'}</button>`;
}

/** The strip's HTML: every season on air in calendar order, the one playing lit. '' when there is nothing to show. */
export function seasonSwitchHtml(cur, paused, { collapsed = false, animate = false } = {}) {
  // One season and nothing paused: the strip appears once there is a season to pause.
  if (!paused.length && !cur?.started) return '';
  const all = [...(cur ? [cur] : []), ...paused.filter(p => p.id !== cur?.id)]
    .sort((a, b) => (a.premiere ?? Infinity) - (b.premiere ?? Infinity));
  const canAdd = pausable(cur);
  const toggle = `<button type="button" class="ssw-label" onclick="toggleSeasonSwitch()" aria-expanded="${!collapsed}" title="${collapsed ? 'Show the seasons on air' : 'Fold the strip'}">On air${all.length > 1 ? ` <em>${all.length}</em>` : ''}<i class="ssw-chev" aria-hidden="true"></i></button>`;
  if (collapsed) {
    const now = cur?.started ? `${SHOWS[cur.format]?.short || ''} ${cur.number} · Ep ${cur.aired}${cur.total ? `/${cur.total}` : ''}` : '';
    return `<div class="ssw is-folded${animate ? ' is-anim' : ''}" role="group" aria-label="Seasons on air">
      ${toggle}<div class="ssw-mini">${all.map(miniHtml).join('')}</div>${now ? `<span class="ssw-now">${esc(now)}</span>` : ''}
    </div>`;
  }
  return `<div class="ssw${animate ? ' is-anim' : ''}" role="group" aria-label="Seasons on air">
    ${toggle}
    <div class="ssw-chips">${all.map(chipHtml).join('')}</div>
    ${canAdd ? `<button type="button" class="ssw-add" onclick="startAnotherLiveSeason()" title="Pause this season and set up another one. Play its premiere so it keeps its place on the calendar, then switch back any time from here.">＋<span> Another season</span></button>` : ''}
  </div>`;
}

const CSS = `.ssw{display:flex;align-items:center;gap:10px;margin:0 0 10px;padding:6px 8px 6px 14px;border:1px solid #293342;border-radius:12px;background:linear-gradient(90deg,#0f161f,#111923);min-height:46px;overflow:hidden}
.ssw-label{flex:none;display:inline-flex;align-items:center;gap:6px;height:30px;padding:0 4px 0 0;border:0;background:none;font:800 9px var(--font-body);letter-spacing:2px;text-transform:uppercase;color:#6b7a8c;cursor:pointer;transition:color .15s}
.ssw-label:hover{color:#cbd5e1}
.ssw-label em{font-style:normal;min-width:15px;height:15px;padding:0 4px;border-radius:8px;background:rgba(255,255,255,.08);color:#cbd5e1;font-size:9px;letter-spacing:0;line-height:15px;text-align:center}
.ssw-chev{width:6px;height:6px;border-right:1.5px solid currentColor;border-bottom:1.5px solid currentColor;transform:rotate(-45deg);margin:0 2px 0 1px;transition:transform .2s}
.ssw-label[aria-expanded="true"] .ssw-chev{transform:rotate(135deg);margin-top:3px}
.ssw.is-folded{min-height:0;padding-top:3px;padding-bottom:3px;gap:12px}
.ssw-mini{display:flex;align-items:center;gap:5px}
.ssw-dot{display:grid;place-items:center;width:26px;height:26px;padding:0;border:1px solid rgba(255,255,255,.08);border-radius:50%;background:rgba(255,255,255,.03);font-size:13px;line-height:1;filter:grayscale(.85);opacity:.7;cursor:pointer;transition:filter .15s,opacity .15s,border-color .15s,transform .15s}
button.ssw-dot:hover{filter:none;opacity:1;border-color:var(--ssw-acc);transform:translateY(-1px)}
.ssw-dot.is-now{cursor:default;filter:none;opacity:1;border-color:var(--ssw-acc);background:color-mix(in srgb,var(--ssw-acc) 18%,transparent);box-shadow:0 0 12px color-mix(in srgb,var(--ssw-acc) 40%,transparent)}
.ssw-now{font:600 10px var(--font-body);letter-spacing:.3px;color:#8997a8;white-space:nowrap}
.ssw.is-anim .ssw-chips,.ssw.is-anim .ssw-mini,.ssw.is-anim .ssw-add,.ssw.is-anim .ssw-now{animation:ssw-fold-in .22s ease-out}
@keyframes ssw-fold-in{from{opacity:0;transform:translateX(-8px)}to{opacity:1;transform:none}}
.ssw-chips{display:flex;gap:6px;flex:1;min-width:0;overflow-x:auto;scrollbar-width:none}
.ssw-chips::-webkit-scrollbar{display:none}
.ssw-slot{position:relative;display:flex;flex:none}
.ssw-chip{position:relative;display:flex;align-items:center;gap:8px;flex:none;height:34px;padding:0 12px 0 9px;border:1px solid rgba(255,255,255,.08);border-radius:9px;background:rgba(255,255,255,.025);color:#8997a8;font:inherit;text-align:left;cursor:pointer;overflow:hidden;transition:border-color .18s,background .18s,color .18s,transform .18s}
button.ssw-chip:hover{border-color:color-mix(in srgb,var(--ssw-acc) 60%,transparent);background:color-mix(in srgb,var(--ssw-acc) 10%,transparent);color:#dfe6ee;transform:translateY(-1px)}
button.ssw-chip:hover .ssw-ico{filter:none;opacity:1}
.ssw-chip.is-now{cursor:default;border-color:color-mix(in srgb,var(--ssw-acc) 70%,transparent);background:linear-gradient(135deg,color-mix(in srgb,var(--ssw-acc) 22%,transparent),color-mix(in srgb,var(--ssw-acc) 6%,transparent));color:#f2f5f8;box-shadow:0 0 18px color-mix(in srgb,var(--ssw-acc) 28%,transparent),inset 0 1px 0 rgba(255,255,255,.06)}
.ssw-chip.is-setup{border-style:dashed}
.ssw-chip.is-done{opacity:.55}
.ssw-ico{font-size:15px;line-height:1;filter:grayscale(.85);opacity:.7;transition:filter .18s,opacity .18s}
.ssw-chip.is-now .ssw-ico{filter:none;opacity:1}
.ssw-txt{display:flex;flex-direction:column;line-height:1.05}
.ssw-txt b{font:400 14px var(--font-display);letter-spacing:.6px;color:inherit}
.ssw-txt small{font:600 9.5px var(--font-body);letter-spacing:.3px;opacity:.75;white-space:nowrap}
.ssw-live{width:7px;height:7px;border-radius:50%;background:#ef4444;box-shadow:0 0 0 0 rgba(239,68,68,.6);animation:ssw-pulse 1.8s infinite}
@keyframes ssw-pulse{0%{box-shadow:0 0 0 0 rgba(239,68,68,.55)}70%{box-shadow:0 0 0 7px rgba(239,68,68,0)}100%{box-shadow:0 0 0 0 rgba(239,68,68,0)}}
.ssw-bar{position:absolute;left:0;right:0;bottom:0;height:2px;background:rgba(255,255,255,.05)}
.ssw-bar span{display:block;height:100%;background:var(--ssw-acc);box-shadow:0 0 6px var(--ssw-acc)}
.ssw-x{position:absolute;top:-5px;right:-5px;width:16px;height:16px;padding:0;border:1px solid #334155;border-radius:50%;background:#0d1219;color:#8997a8;font:700 11px/13px var(--font-body);cursor:pointer;opacity:0;transform:scale(.7);transition:opacity .15s,transform .15s}
.ssw-slot:hover .ssw-x,.ssw-x:focus-visible{opacity:1;transform:scale(1)}
.ssw-x:hover{color:#fecaca;border-color:#f87171}
.ssw-add{flex:none;height:34px;padding:0 12px;border:1px dashed #3a4656;border-radius:9px;background:none;color:#8997a8;font:700 10px var(--font-body);letter-spacing:.6px;text-transform:uppercase;cursor:pointer;transition:color .18s,border-color .18s}
.ssw-add:hover{color:#e2e8f0;border-color:#64748b;border-style:solid}
@media (max-width:640px){.ssw-add span,.ssw:not(.is-folded) .ssw-label{font-size:0;letter-spacing:0}.ssw{padding-left:8px}}
.ssw-tune{position:fixed;inset:0;z-index:99999;display:grid;place-items:center;background:#05070a;opacity:0;transition:opacity .16s ease-out;pointer-events:all}
.ssw-tune.on{opacity:1}
.ssw-tune svg.ssw-static{position:absolute;inset:0;width:100%;height:100%;opacity:.34;mix-blend-mode:screen}
.ssw-tune::after{content:'';position:absolute;inset:0;background:repeating-linear-gradient(0deg,rgba(0,0,0,.35) 0 1px,transparent 1px 3px);pointer-events:none}
.ssw-card{position:relative;z-index:1;text-align:center;color:#f2f5f8;transform:scale(.96);opacity:0;transition:transform .32s cubic-bezier(.2,.9,.3,1.2),opacity .2s}
.ssw-tune.on .ssw-card{transform:scale(1);opacity:1;transition-delay:.12s}
.ssw-card .e{font-size:54px;line-height:1;filter:drop-shadow(0 0 22px var(--ssw-acc))}
.ssw-card .k{margin-top:14px;font:800 10px var(--font-body);letter-spacing:4px;text-transform:uppercase;color:var(--ssw-acc)}
.ssw-card .t{margin-top:6px;font:400 clamp(30px,5vw,52px)/1 var(--font-display);letter-spacing:1px}
.ssw-card .s{margin-top:10px;font:600 12px var(--font-body);color:#8997a8}
.ssw-tune.crt{animation:ssw-crt .55s cubic-bezier(.7,0,.3,1) forwards}
@keyframes ssw-crt{0%{clip-path:inset(0 0 0 0);filter:brightness(1)}55%{clip-path:inset(49.6% 0 49.6% 0);filter:brightness(3)}100%{clip-path:inset(49.6% 50% 49.6% 50%);filter:brightness(4);opacity:0}}
.ssw-tune.crt .ssw-card{transform:scale(1);opacity:1}
@media (prefers-reduced-motion:reduce){.ssw-live{animation:none}.ssw-tune.crt{animation:none;opacity:0;transition:opacity .2s}}`;

function ensureCss() {
  if (document.getElementById('ssw-css')) return;
  const st = document.createElement('style');
  st.id = 'ssw-css';
  st.textContent = CSS;
  document.head.appendChild(st);
}

// TV static: SVG turbulence with a seed that steps every frame.
const STATIC_SVG = `<svg class="ssw-static" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" aria-hidden="true">
  <filter id="ssw-noise"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="1"><animate attributeName="seed" values="1;2;3;4;5;6;7;8" dur=".35s" repeatCount="indefinite"/></feTurbulence><feColorMatrix type="saturate" values="0"/></filter>
  <rect width="100%" height="100%" filter="url(#ssw-noise)"/></svg>`;

function tuneCard(format, number, kicker, sub) {
  const show = SHOWS[format] || {};
  const el = document.createElement('div');
  el.className = 'ssw-tune';
  el.style.setProperty('--ssw-acc', show.accent || '#10b981');
  el.innerHTML = `${STATIC_SVG}<div class="ssw-card"><div class="e">${show.emoji || '📺'}</div>
    <div class="k">${esc(kicker)}</div><div class="t">${esc(show.name || '')} ${esc(number)}</div>${sub ? `<div class="s">${esc(sub)}</div>` : ''}</div>`;
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add('on'));
  return el;
}

/** The channel change while the switch is written. Resolves no sooner than the card has been seen. */
function tuneOut(target, pausing = null) {
  const el = target
    ? tuneCard(target.format, target.number, 'Switching channel', target.aired ? `Picking up after episode ${target.aired}` : 'Picking up before the premiere')
    : tuneCard(pausing.format, pausing.number, 'Paused', 'Set up the next season. It waits on the strip.');
  const done = new Promise(r => setTimeout(r, 750));
  return { done, cancel() { el.remove(); } };
}

/**
 * After the reload the card is up from the module's first line, so a save that
 * takes seconds to boot is covered, and it switches off like an old set once
 * the hub has drawn the season (or after eight seconds, whatever happens).
 */
let _tunedIn = null;
function tuneIn() {
  let t = null;
  try { t = JSON.parse(sessionStorage.getItem(TUNED_KEY) || 'null'); sessionStorage.removeItem(TUNED_KEY); } catch { /* */ }
  if (!t || typeof document === 'undefined' || !document.body) return;
  ensureCss();
  _tunedIn = tuneCard(t.format, t.number, 'Now playing', '');
  _tunedIn.classList.add('on');
  setTimeout(tuneOff, 8000);
}
function tuneOff() {
  const el = _tunedIn;
  if (!el) return;
  _tunedIn = null;
  setTimeout(() => { el.classList.add('crt'); setTimeout(() => el.remove(), 600); }, 250);
}
tuneIn();

/** Draw the strip into #season-switch. Safe on every render. */
export async function renderSeasonSwitch({ animate = false } = {}) {
  const host = typeof document !== 'undefined' && document.getElementById('season-switch');
  if (!host) return;
  ensureCss();
  const seasons = await loadSeasonsDb();
  const paused = await readIndex();
  host.innerHTML = seasonSwitchHtml(currentMeta(seasons), paused, { collapsed: isCollapsed(), animate });
  tuneOff();
}

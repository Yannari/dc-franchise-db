// ══════════════════════════════════════════════════════════════════════
// vp-bb-ep/voicing.js — voice a Big Brother week on Inworld, and play it back
// ══════════════════════════════════════════════════════════════════════
// Part 6 of the Big Brother overhaul: the houseguests speak in their own voices, the way Total Drama's
// episodes do (js/vp-td-ep/voicing.js, which this follows step for step). The pieces:
//   1. the week's lines, built in memory by the stepped viewer's own builder (steps.js bbWeekSteps, with the
//      same host, prior evictions and pleas the viewer passes), so a line here is word for word the line the
//      viewer types out, and its id (speaker + words, hashed) finds its clip;
//   2. dc-studio (/api/voice/render) voices them on Inworld TTS-2, in the voice of the user's own Inworld voice
//      of that name, into the audio bucket: voice/<season>/e<week>/<line>.mp3. The worker is the one Total
//      Drama uses; the season key is Big Brother's own (bb-<number>), so the two never share a folder;
//   3. the viewer plays a clip when the line has one (bbVoiceLine, from screens.js paint), else the blips.
// A line already in the bucket is never paid for twice. A houseguest with no voice of their name keeps the
// blips. No delivery directions (the user, 2026-10-14, on Total Drama: "it slowed the voices too much").
import { audio as engine } from '../audio.js';
import { bbWeekSteps } from './steps.js';

const PRICE = 25 / 1e6;   // Inworld TTS-2, dollars a character
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const token = () => { try { return localStorage.getItem('studio_api_token') || ''; } catch { return ''; } };
export const VOICE_API = () => { try { return (localStorage.getItem('studio_api_base') || '').replace(/\/+$/, '') || 'https://dc-studio.yannari19.workers.dev'; } catch { return 'https://dc-studio.yannari19.workers.dev'; } };
export const bbCanVoice = () => !!token();
let busy = false;

/** A line's id: the speaker and the words, hashed (the same hash as Total Drama's, so the worker's key rule holds). */
export function lineId(by, text) {
  let h = 2166136261; for (const ch of `${by}|${text}`) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return 'L' + (h >>> 0).toString(16).padStart(8, '0');
}

/** The season's folder in the bucket: bb-<number>, or bb-<its name> before it has one. */
export function bbVoiceSeason() {
  const w = typeof window !== 'undefined' ? window : globalThis;
  const cfg = w.seasonConfig || {}, gs = w.gs || {};
  const n = gs.seasonNumber || cfg.seasonNumber;
  const base = n ? String(n) : String(cfg.name || 'season').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 50) || 'season';
  return `bb-${base}`;
}

/** Who a step is said by, as a voice name: a houseguest by name, the host by name, the house as "Big Brother". */
export function voiceName(st) {
  if (!st || !st.t) return null;
  if (st.k === 'bb') return 'Big Brother';
  // a season's own voice (The Mastermind, AINSLEY, The Voice...) speaks too (the user, 2026-10-25: "cant find how
  // to voice the big brother and the mastermind")
  if (st.k === 'say' || st.k === 'dr' || st.k === 'host' || st.k === 'voice') return st.by || null;
  return null;
}

// A voice is found by its name the way a person would type it: capitals, spaces, dashes and a leading "The" do not
// matter, so an Inworld voice named "Big-brother" is Big Brother's and "The-Mastermind" or "Mastermind" is The
// Mastermind's (the user named theirs that way, and the exact-name match found neither).
export const voiceKey = s => String(s || '').toLowerCase().replace(/^the[\s_-]+/, '').replace(/[^a-z0-9]+/g, '');
/** The voice of each speaker: { speaker: voiceId }, from the account's { name: voiceId }. */
export function resolveVoices(speakers, voices = {}) {
  const byKey = new Map(Object.entries(voices).map(([n, id]) => [voiceKey(n), id]));
  const out = {};
  for (const n of speakers) { const id = voices[n] || byKey.get(voiceKey(n)); if (id) out[n] = id; }
  return out;
}

/** Every spoken line of a week, in the viewer's own words: [{ id, by, text, k }]. */
export async function bbEpisodeLines(rec) {
  if (!rec) return [];
  const vs = await import('../vp-screens.js');
  const { bbHostName } = await import('../bb-aftermath.js');
  const g = (typeof window !== 'undefined' ? window.gs : null) || {};
  const priorEvicted = (g.episodeHistory || [])
    .filter(r => r && r.format === 'big-brother' && r.num < rec.num)
    .flatMap(r => [r.eliminated, r.alsoEliminated, r.evicted, r.secondEvicted, ...(r.extraEvictions || []).map(x => x?.evicted)]).filter(Boolean);
  const screens = bbWeekSteps(rec, { host: bbHostName(), priorEvicted, plea: name => vs._bbFinalPleaSpeech(rec, name) });
  const out = [], seen = new Set();
  for (const S of screens) for (const st of S.steps || []) {
    const by = voiceName(st);
    if (!by) continue;
    const text = String(st.t).trim();
    const id = lineId(by, text);
    if (seen.has(id)) continue;
    seen.add(id);
    out.push({ id, by, text, k: st.k });
  }
  return out;
}

// ── what the bucket holds ─────────────────────────────────────────────
const live = {};
// the test runner never asks the real bucket
const offline = () => typeof process !== 'undefined' && !!process.env?.VITEST;
/** Which lines of this week have a voice (asked once per week, again after voicing). */
export function bbVoicedLines(ep, fresh = false) {
  const k = `${bbVoiceSeason()}/${ep}`;
  if (offline()) { if (!live[k]) { live[k] = Promise.resolve(new Set()); live[k].ids = new Set(); } return live[k]; }
  if (!live[k] || fresh) {
    live[k] = fetch(`${VOICE_API()}/api/voice/list?season=${encodeURIComponent(bbVoiceSeason())}&episode=${ep}`, { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : { ids: [] })).then(j => { live[k].ids = new Set(j.ids || []); return live[k].ids; })
      .catch(() => { live[k].ids = new Set(); return live[k].ids; });
  }
  return live[k];
}

// ── playback ──────────────────────────────────────────────────────────
const bufs = new Map();
let playing = null;
function loadClip(ctx, url) {
  if (!bufs.has(url)) bufs.set(url, fetch(url).then(r => (r.ok ? r.arrayBuffer() : null)).then(a => (a ? ctx.decodeAudioData(a) : null)).catch(() => null));
  return bufs.get(url);
}
/** Stop whatever line is playing (a new step, Back, a jump). */
export function bbVoiceStop() {
  try { playing?.stop(); } catch { /* already ended */ }
  playing = null;
}
/**
 * Say a step in its voice actor's clip when the week has one. True when a clip is (about to be) playing, so the
 * caller skips the blips; false when there is none and the blips should play.
 */
export function bbVoiceLine(ep, st) {
  bbVoiceStop();
  const by = voiceName(st);
  if (!by || ep == null) return false;
  const lv = bbVoicedLines(ep);
  const id = lineId(by, String(st.t).trim());
  if (!lv?.ids?.has(id)) return false;
  const o = engine.output();
  if (!o) return true;    // muted: no blips either
  loadClip(o.ctx, `${VOICE_API()}/audio/voice/${bbVoiceSeason()}/e${ep}/${id}.mp3`).then(b => {
    if (!b) return;
    const src = o.ctx.createBufferSource(), g = o.ctx.createGain();
    src.buffer = b; g.gain.value = 0.9; src.connect(g); g.connect(o.dest); src.start();
    playing = src;
  });
  return true;
}

// ── voicing a week ────────────────────────────────────────────────────
function panel() {
  let el = document.getElementById('bb-voicing');
  if (!el) {
    el = document.createElement('div'); el.id = 'bb-voicing';
    el.style.cssText = 'position:fixed;right:16px;bottom:16px;z-index:100000;width:min(360px,calc(100vw - 32px));'
      + 'background:#0d1220;color:#eef3ff;border:1px solid #22e1ff55;border-radius:12px;padding:12px 14px;font:13px/1.45 system-ui,sans-serif;box-shadow:0 12px 40px rgba(0,0,0,.45)';
    document.body.appendChild(el);
  }
  return {
    choose(title, detail, options) {
      return new Promise(resolve => {
        el.innerHTML = `<b style="display:block;margin-bottom:3px">${title}</b><div style="color:#aab4cc;margin-bottom:8px">${detail}</div>`
          + options.map((o, k) => `<button type="button" data-k="${k}" style="display:block;width:100%;margin-top:6px;text-align:left;border-radius:8px;padding:7px 10px;font-weight:700;cursor:pointer;${o.main ? 'background:#22e1ff;border:0;color:#0d1220' : 'background:transparent;border:1px solid #3a4866;color:#eef3ff'}">${o.label}</button>`).join('')
          + '<button type="button" data-k="-1" style="margin-top:8px;background:transparent;border:0;color:#8b95ad;cursor:pointer">Cancel</button>';
        el.querySelectorAll('button[data-k]').forEach(b => b.addEventListener('click', () => { const k = +b.dataset.k; el.remove(); resolve(k < 0 ? null : options[k].value); }));
      });
    },
    say(title, detail = '', pct = null, done = false) {
      el.innerHTML = `<b style="display:block;margin-bottom:3px">${title}</b><div style="color:#aab4cc">${detail}</div>`
        + (pct != null ? `<div style="height:5px;background:#1d2740;border-radius:3px;margin-top:8px"><div style="height:5px;width:${Math.round(pct * 100)}%;background:#22e1ff;border-radius:3px"></div></div>` : '')
        + (done ? '<button type="button" style="margin-top:8px;background:#22e1ff;border:0;border-radius:8px;padding:5px 12px;font-weight:700;cursor:pointer" onclick="this.parentNode.remove()">Close</button>' : '');
    },
  };
}
function askToken() {
  if (!token() && typeof prompt === 'function') {
    const t = (prompt('Paste your studio token to voice this week. It is the same token the Casting Studio and Total Drama voicing use, and it is remembered on this device.') || '').trim();
    if (t) { try { localStorage.setItem('studio_api_token', t); } catch { /* this session only */ } }
  }
  return !!token();
}

/** Delete clips from the bucket: one week (but the line ids in `keep`), every week from `from` on, or the whole
 *  season. For a re-run week and a reset season, as Total Drama's (vp-td-ep/voicing.js clearVoices), in
 *  Big Brother's own folder. Quietly nothing without the studio token. */
export async function bbClearVoices({ season = bbVoiceSeason(), episode, from, keep } = {}) {
  if (!token() || offline()) return 0;
  try {
    const r = await fetch(`${VOICE_API()}/api/voice/clear`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
      body: JSON.stringify({ season, episode, from, keep }) });
    const j = await r.json();
    if (episode) await bbVoicedLines(episode, true);
    return j.deleted || 0;
  } catch { return 0; }
}

const bbRecs = () => (window.gs?.episodeHistory || []).filter(e => e && e.format === 'big-brother');

/** After a re-run from week `fromEp`: each week from there keeps the clips of the lines it still has word for word
 *  (same speaker, same words: the same clip) and loses the rest; weeks past the season's new last one go. */
export async function bbVoicesAfterRerun(fromEp) {
  if (!token()) return;
  let last = +fromEp - 1;
  try {
    for (const rec of bbRecs().filter(e => +e.num >= +fromEp)) {
      last = Math.max(last, +rec.num);
      let keep = [];
      try { keep = (await bbEpisodeLines(rec)).map(l => l.id); } catch { /* cannot build it: a new week, keep nothing */ }
      await bbClearVoices({ episode: +rec.num, keep });
    }
  } finally {
    await bbClearVoices({ from: last + 1 });
  }
}

/** What a week needs: its lines, the voices, which lines have one, which are missing, and who has no voice. */
async function plan(ep) {
  const rec = bbRecs().find(e => +e.num === +ep);
  const all = await bbEpisodeLines(rec);
  let voices = {};
  try { const j = await (await fetch(`${VOICE_API()}/api/voice/voices`, { headers: { Authorization: `Bearer ${token()}` } })).json(); if (j.ok) voices = j.voices || {}; } catch { /* none */ }
  let have = (await bbVoicedLines(ep, true)) || new Set();
  // a clip that is none of this week's lines belongs to a version of it that is gone (a re-run): it goes, so
  // "already voiced" never counts a dead week's lines
  const ids = new Set(all.map(l => l.id));
  if (all.length && [...have].some(id => !ids.has(id))) { await bbClearVoices({ episode: ep, keep: [...ids] }); have = new Set([...have].filter(id => ids.has(id))); }
  // each speaker's voice, matched by name the forgiving way (voiceKey); what is sent to the studio is this map
  voices = resolveVoices([...new Set(all.map(l => l.by))], voices);
  const lines = all.filter(l => voices[l.by]);
  const missing = lines.filter(l => !have.has(l.id));
  const voiceless = [...new Set(all.filter(l => !voices[l.by]).map(l => l.by))];
  return { all, voices, lines, missing, voiceless, voicedCount: lines.length - missing.length };
}
const estimate = ls => (ls.reduce((a, l) => a + l.text.length, 0) * PRICE).toFixed(2);

/** Voice a week: the missing lines, or every line again (force). Runs in the background with a corner box. */
export async function bbVoiceEpisode(ep, { force = false, ready = null } = {}) {
  if (!ep || busy || !askToken()) return;
  busy = true;
  const P = panel(), t0 = Date.now(), season = bbVoiceSeason(), title = `Voicing week ${ep}`;
  try {
    P.say(title, 'Reading the week…', 0.02);
    const p = ready || await plan(ep);
    if (!p.lines.length) {
      P.say(`Week ${ep}: nobody has a voice yet`, `Make a voice in your Inworld workspace named like the speaker (${p.voiceless.slice(0, 6).map(esc).join(', ')}${p.voiceless.length > 6 ? '…' : ''}) and press again.`, null, true);
      return;
    }
    const todo = force ? p.lines : p.missing;
    if (!todo.length) { P.say(`Week ${ep} is already voiced`, `${p.lines.length} lines have a voice. Nothing to pay for.`, 1, true); return; }
    // one request at a time, the worker voicing four of its lines at once (the Inworld plan takes five at a time).
    // Six lines a request: one the worker cannot finish inside its limits is cut off by Cloudflare with no CORS
    // header, a bare "NetworkError" in the browser (Total Drama's episode 9, 2026-10-15, at twelve)
    const batches = [];
    for (let k = 0; k < todo.length; k += 6) batches.push(todo.slice(k, k + 6));
    let done = 0, chars = 0;
    const failed = [];
    for (const b of batches) {
      // a request that dies on the way is tried twice more after a pause; then its lines count as failed and the
      // week goes on (a second press voices just the missing ones)
      let r, lost = null;
      for (let tries = 0; tries < 3; tries++) {
        try {
          r = await fetch(`${VOICE_API()}/api/voice/render`, {
            method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
            body: JSON.stringify({ season, episode: ep, voices: p.voices, force, lines: b.map(l => ({ id: l.id, by: l.by, text: l.text })) }),
          });
          lost = null;
          break;
        } catch (e) {
          lost = String(e.message || e);
          await new Promise(res => setTimeout(res, 2000 * (tries + 1)));
        }
      }
      if (lost) { failed.push(...b.map(l => ({ id: l.id, error: `the studio did not answer (${lost})` }))); continue; }
      const j = await r.json().catch(() => ({ ok: false, error: `studio ${r.status}` }));
      if (!j.ok) failed.push(...b.map(l => ({ id: l.id, error: j.error })));
      else { done += j.done.length; chars += j.chars || 0; failed.push(...(j.failed || [])); }
      P.say(title, `Voicing: ${done} of ${todo.length} lines`, 0.05 + (done + failed.length) / todo.length * 0.95);
    }
    await bbVoicedLines(ep, true);
    bbHubVoiceLabel(ep);
    const secs = Math.round((Date.now() - t0) / 1000), cost = (chars * PRICE).toFixed(2);
    const without = p.voiceless.length ? ` No voice yet for ${p.voiceless.join(', ')}: they keep the blips.` : '';
    P.say(failed.length ? `Week ${ep}: ${done} voiced, ${failed.length} failed` : `Week ${ep} is voiced`,
      `${done} lines in ${secs} s, about $${cost}.${without}${failed.length ? ` Failed: ${failed[0].error}. Press 🎙 again to voice just those.` : ''}`, 1, true);
  } catch (e) {
    P.say(`Voicing week ${ep} stopped`, String(e.message || e), null, true);
  } finally {
    busy = false;
  }
}

/** The Run tab's 🎙 button (run-ui.js, id hub-bb-voice) on the week the hub is showing: 'Voice' or 'Revoice' once
 *  it has clips, asked of the bucket on every render. */
export function bbHubVoiceLabel(ep) {
  const btn = typeof document !== 'undefined' && document.getElementById('hub-bb-voice');
  if (!btn || !ep) return;
  const n = String(ep).padStart(2, '0');
  bbVoicedLines(ep).then(ids => { if (btn.isConnected && +btn.dataset.ep === +ep) btn.textContent = ids && ids.size ? `🎙 Revoice WK ${n}` : `🎙 Voice WK ${n}`; });
}

/** The 🎙 buttons (the Run tab's and the viewer's): a week with voices asks first (missing lines, or every line again), each with its price. */
export async function bbVoiceSelected(ep) {
  if (busy) return alert('A week is already being voiced. Wait for it to finish.');
  if (!askToken()) return;
  const P = panel();
  P.say(`Week ${ep}`, 'Checking which lines already have a voice…', 0.05);
  let p;
  try { p = await plan(ep); } catch (e) { P.say(`Week ${ep}`, String(e.message || e), null, true); return; }
  if (!p.voicedCount) return bbVoiceEpisode(ep, { ready: p });
  const opts = [];
  if (p.missing.length) opts.push({ label: `Voice the ${p.missing.length} missing lines · about $${estimate(p.missing)}`, value: 'missing', main: true });
  opts.push({ label: `Revoice all ${p.lines.length} lines (new takes) · about $${estimate(p.lines)}`, value: 'all', main: !p.missing.length });
  // who will stay on the blips, and how to fix it (the user, 2026-10-25: "when i try to revoice it doesnt tell me
  // what voice actor is missing and why")
  const nobody = p.voiceless.length
    ? `<br><br>No Inworld voice for <b>${p.voiceless.map(esc).join(', ')}</b> (${p.all.filter(l => p.voiceless.includes(l.by)).length} lines): they keep the blips. Name a voice in your Inworld workspace like them; capitals, spaces and dashes don't matter.`
    : '';
  const pick = await P.choose(`Week ${ep}`, `${p.missing.length ? `${p.voicedCount} lines have a voice, ${p.missing.length} don't yet.` : `All ${p.lines.length} voiced lines have a voice.`}${nobody}`, opts);
  if (pick === 'missing') return bbVoiceEpisode(ep, { ready: p });
  if (pick === 'all') return bbVoiceEpisode(ep, { force: true, ready: p });
  bbHubVoiceLabel(ep);
}

if (typeof window !== 'undefined') Object.assign(window, { bbVoiceEpisode, bbVoiceSelected, bbEpisodeLines, bbVoiceSeason, bbClearVoices, bbVoicesAfterRerun, bbHubVoiceLabel });

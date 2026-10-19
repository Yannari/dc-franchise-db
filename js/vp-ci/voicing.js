// ══════════════════════════════════════════════════════════════════════
// vp-ci/voicing.js — voice a Circle episode on Inworld, and play it back
// ══════════════════════════════════════════════════════════════════════
// The players speak in their own voices, the way Total Drama's episodes and Big Brother's weeks do
// (js/vp-td-ep/voicing.js, js/vp-bb-ep/voicing.js, which this follows step for step). The pieces:
//   1. the episode's lines, built by the viewer's own builders (steps.js circleScreens, teasers.js withTeasers,
//      web-stage.js webScreen, with the same neighbours the viewer passes), so a line here is word for word the line
//      on screen, and its id (speaker + words, hashed) finds its clip;
//   2. dc-studio (/api/voice/render) voices them on Inworld TTS-2, in the user's own Inworld voice of that name,
//      into the audio bucket: voice/ci-<season>/e<episode>/<line>.mp3. The Circle's own folder, never Total
//      Drama's or Big Brother's;
//   3. the viewer plays a line's clip when it has one (ciVoiceLine, from screens.js paint), else nothing.
//
// WHO SPEAKS (the user, 2026-10-19, agreeing to it): the PERSON in the apartment, never the profile. A catfish
// sounds like themselves, because on the show the players say every message out loud to the Circle ("Circle,
// message..."). So a sent message or a post is voiced as its dictation (`spoken`: what they said to the Circle),
// a line said aloud or a reaction as it is, and on a profile-swap day the person behind the profile that day
// speaks. The Circle's own lines (its alerts, its announcements) are the voice named "The Circle".
import { audio as engine } from '../audio.js';
import { circleScreens } from './steps.js';
import { withTeasers } from './teasers.js';
import { webScreen } from './web-stage.js';

const PRICE = 25 / 1e6;   // Inworld TTS-2, dollars a character
const CIRCLE = 'ci';
const FORMAT = 'the-circle';
export const CIRCLE_VOICE = 'The Circle';
const token = () => { try { return localStorage.getItem('studio_api_token') || ''; } catch { return ''; } };
export const VOICE_API = () => { try { return (localStorage.getItem('studio_api_base') || '').replace(/\/+$/, '') || 'https://dc-studio.yannari19.workers.dev'; } catch { return 'https://dc-studio.yannari19.workers.dev'; } };
let busy = false;

/** A line's id: the speaker and the words, hashed (the same hash as Total Drama's and Big Brother's). */
export function lineId(by, text) {
  let h = 2166136261; for (const ch of `${by}|${text}`) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return 'L' + (h >>> 0).toString(16).padStart(8, '0');
}

/** The season's folder in the bucket: ci-<number>, or ci-<its name> before it has one. */
export function ciVoiceSeason() {
  const w = typeof window !== 'undefined' ? window : globalThis;
  const cfg = w.seasonConfig || {}, gs = w.gs || {};
  const n = gs.seasonNumber || cfg.seasonNumber;
  const base = n ? String(n) : String(cfg.name || 'season').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 50) || 'season';
  return `${CIRCLE}-${base}`;
}

// the person in the apartment behind a profile, on the row the scene aired with (a swap day's own)
const personOf = (row, h) => (row?.ci?.profiles?.[h]?.people || [])[0] || null;
const SPOKEN = new Set(['say', 'react', 'send', 'post', 'video']);

/** Who says a step, and the words they say: { by, text } or null for a line nobody speaks (a stage direction). */
export function spokenLine(row, screen, st) {
  if (!st || !st.text) return null;
  if (st.host) return { by: CIRCLE_VOICE, text: String(st.text).trim() };
  // a teaser's clip: a cut of a line from another day, said by whoever really said it
  if (st.clip) { const by = String(st.clip.real || '').split(' & ')[0]; return by ? { by, text: String(st.text).trim() } : null; }
  if (!st.who || !SPOKEN.has(st.part)) return null;
  const by = personOf(screen?.rowView || row, st.who);
  if (!by) return null;
  // a message or a post is voiced as it was dictated to the Circle, not as the text that arrived
  const text = String((st.part === 'send' || st.part === 'post') && st.spoken ? st.spoken : st.text).trim();
  return text ? { by, text } : null;
}

/** The episode's screens, as the viewer builds them (vp-screens.js: the same neighbours for its teasers). */
function screensOf(row) {
  const g = (typeof window !== 'undefined' ? window.gs : null) || {};
  const hist = (g.episodeHistory || []).filter(r => r && r.format === FORMAT);
  const prev = hist.find(r => r.num === row.num - 1) || null;
  const next = hist.find(r => r.num === row.num + 1) || (g._ciQueue || []).find(r => r && r.num === row.num + 1) || null;
  const screens = withTeasers(row, circleScreens(row), { prev, next, screensOf: circleScreens });
  const web = webScreen(row, prev);
  if (web) screens.push(web);
  return screens;
}

/** Every spoken line of an episode, in the viewer's own words: [{ id, by, text }]. */
export function ciEpisodeLines(row) {
  if (!row) return [];
  const out = [], seen = new Set();
  for (const S of screensOf(row)) for (const st of S.steps || []) {
    const l = spokenLine(row, S, st);
    if (!l) continue;
    const id = lineId(l.by, l.text);
    if (seen.has(id)) continue;
    seen.add(id);
    out.push({ id, by: l.by, text: l.text });
  }
  return out;
}

// ── what the bucket holds ─────────────────────────────────────────────
const live = {};
// the test runner never asks the real bucket
const offline = () => typeof process !== 'undefined' && !!process.env?.VITEST;
/** Which lines of this episode have a voice (asked once per episode, again after voicing). */
export function ciVoicedLines(ep, fresh = false) {
  const k = `${ciVoiceSeason()}/${ep}`;
  if (offline()) { if (!live[k]) { live[k] = Promise.resolve(new Set()); live[k].ids = new Set(); } return live[k]; }
  if (!live[k] || fresh) {
    live[k] = fetch(`${VOICE_API()}/api/voice/list?season=${encodeURIComponent(ciVoiceSeason())}&episode=${ep}`, { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : { ids: [] })).then(j => { live[k].ids = new Set(j.ids || []); return live[k].ids; })
      .catch(() => { live[k].ids = new Set(); return live[k].ids; });
  }
  return live[k];
}

// ── playback ──────────────────────────────────────────────────────────
const bufs = new Map();
let playing = null, ended = null;
function loadClip(ctx, url) {
  if (!bufs.has(url)) bufs.set(url, fetch(url).then(r => (r.ok ? r.arrayBuffer() : null)).then(a => (a ? ctx.decodeAudioData(a) : null)).catch(() => null));
  return bufs.get(url);
}
/** Stop whatever line is playing (a new step, Restart, a jump). */
export function ciVoiceStop() {
  try { playing?.stop(); } catch { /* already ended */ }
  playing = null;
  if (ended) { ended(); ended = null; }
}
/** A promise for the line now playing to finish (Auto waits for it before the next line); at once when none is. */
let done = Promise.resolve();
export const ciVoiceDone = () => done;
/** Say a step in its clip when the episode has one. True when a clip is (about to be) playing. */
export function ciVoiceLine(row, screen, st) {
  ciVoiceStop();
  const l = spokenLine(row, screen, st);
  if (!l || row?.num == null) return false;
  const lv = ciVoicedLines(row.num);
  const id = lineId(l.by, l.text);
  if (!lv?.ids?.has(id)) return false;
  const o = engine.output();
  if (!o) return true;    // muted
  done = new Promise(res => { ended = res; });
  loadClip(o.ctx, `${VOICE_API()}/audio/voice/${ciVoiceSeason()}/e${row.num}/${id}.mp3`).then(b => {
    if (!b) { ciVoiceStop(); return; }
    const src = o.ctx.createBufferSource(), g = o.ctx.createGain();
    src.buffer = b; g.gain.value = 0.9; src.connect(g); g.connect(o.dest);
    src.onended = () => { if (playing === src) { playing = null; if (ended) { ended(); ended = null; } } };
    src.start();
    playing = src;
  });
  return true;
}

// ── voicing an episode ────────────────────────────────────────────────
function panel() {
  let el = document.getElementById('ci-voicing');
  if (!el) {
    el = document.createElement('div'); el.id = 'ci-voicing';
    el.style.cssText = 'position:fixed;right:16px;bottom:16px;z-index:100000;width:min(360px,calc(100vw - 32px));'
      + 'background:#14092a;color:#f4ecff;border:1px solid #b06bff66;border-radius:12px;padding:12px 14px;font:13px/1.45 system-ui,sans-serif;box-shadow:0 12px 40px rgba(0,0,0,.45)';
    document.body.appendChild(el);
  }
  return {
    choose(title, detail, options) {
      return new Promise(resolve => {
        el.innerHTML = `<b style="display:block;margin-bottom:3px">${title}</b><div style="color:#c6b6e6;margin-bottom:8px">${detail}</div>`
          + options.map((o, k) => `<button type="button" data-k="${k}" style="display:block;width:100%;margin-top:6px;text-align:left;border-radius:8px;padding:7px 10px;font-weight:700;cursor:pointer;${o.main ? 'background:#b06bff;border:0;color:#14092a' : 'background:transparent;border:1px solid #4a3a6e;color:#f4ecff'}">${o.label}</button>`).join('')
          + '<button type="button" data-k="-1" style="margin-top:8px;background:transparent;border:0;color:#9d8fbd;cursor:pointer">Cancel</button>';
        el.querySelectorAll('button[data-k]').forEach(b => b.addEventListener('click', () => { const k = +b.dataset.k; el.remove(); resolve(k < 0 ? null : options[k].value); }));
      });
    },
    say(title, detail = '', pct = null, finished = false) {
      el.innerHTML = `<b style="display:block;margin-bottom:3px">${title}</b><div style="color:#c6b6e6">${detail}</div>`
        + (pct != null ? `<div style="height:5px;background:#2a1c46;border-radius:3px;margin-top:8px"><div style="height:5px;width:${Math.round(pct * 100)}%;background:#b06bff;border-radius:3px"></div></div>` : '')
        + (finished ? '<button type="button" style="margin-top:8px;background:#b06bff;border:0;border-radius:8px;padding:5px 12px;font-weight:700;cursor:pointer" onclick="this.parentNode.remove()">Close</button>' : '');
    },
  };
}
function askToken() {
  if (!token() && typeof prompt === 'function') {
    const t = (prompt('Paste your studio token to voice this episode. It is the same token the Casting Studio, Total Drama and Big Brother voicing use, and it is remembered on this device.') || '').trim();
    if (t) { try { localStorage.setItem('studio_api_token', t); } catch { /* this session only */ } }
  }
  return !!token();
}

/** Delete clips from the bucket: one episode (but the line ids in `keep`), every episode from `from` on, or the
 *  whole season. In the Circle's own folder. Quietly nothing without the studio token. */
export async function ciClearVoices({ season = ciVoiceSeason(), episode, from, keep } = {}) {
  if (!token() || offline()) return 0;
  try {
    const r = await fetch(`${VOICE_API()}/api/voice/clear`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
      body: JSON.stringify({ season, episode, from, keep }) });
    const j = await r.json();
    if (episode) await ciVoicedLines(episode, true);
    return j.deleted || 0;
  } catch { return 0; }
}

const ciRows = () => ((typeof window !== 'undefined' ? window.gs : null)?.episodeHistory || []).filter(e => e && e.format === FORMAT);

/** After a re-run from episode `fromEp`: each episode from there keeps the clips of the lines it still has word for
 *  word and loses the rest; episodes past the season's new last one go. */
export async function ciVoicesAfterRerun(fromEp) {
  if (!token()) return;
  let last = +fromEp - 1;
  try {
    for (const row of ciRows().filter(e => +e.num >= +fromEp)) {
      last = Math.max(last, +row.num);
      let keep = [];
      try { keep = ciEpisodeLines(row).map(l => l.id); } catch { /* cannot build it: keep nothing */ }
      await ciClearVoices({ episode: +row.num, keep });
    }
  } finally {
    await ciClearVoices({ from: last + 1 });
  }
}

/** What an episode needs: its lines, the voices, which lines have one, which are missing, and who has no voice. */
async function plan(ep) {
  const row = ciRows().find(e => +e.num === +ep);
  const all = ciEpisodeLines(row);
  let voices = {};
  try { const j = await (await fetch(`${VOICE_API()}/api/voice/voices`, { headers: { Authorization: `Bearer ${token()}` } })).json(); if (j.ok) voices = j.voices || {}; } catch { /* none */ }
  let have = (await ciVoicedLines(ep, true)) || new Set();
  // a clip that is none of this episode's lines belongs to a version of it that is gone (a re-run): it goes
  const ids = new Set(all.map(l => l.id));
  if (all.length && [...have].some(id => !ids.has(id))) { await ciClearVoices({ episode: ep, keep: [...ids] }); have = new Set([...have].filter(id => ids.has(id))); }
  const lines = all.filter(l => voices[l.by]);
  const missing = lines.filter(l => !have.has(l.id));
  const voiceless = [...new Set(all.filter(l => !voices[l.by]).map(l => l.by))];
  return { all, voices, lines, missing, voiceless, voicedCount: lines.length - missing.length };
}
const estimate = ls => (ls.reduce((a, l) => a + l.text.length, 0) * PRICE).toFixed(2);

/** Voice an episode: the missing lines, or every line again (force). Runs in the background with a corner box. */
export async function ciVoiceEpisode(ep, { force = false, ready = null } = {}) {
  if (!ep || busy || !askToken()) return;
  busy = true;
  const P = panel(), t0 = Date.now(), season = ciVoiceSeason(), title = `Voicing episode ${ep}`;
  try {
    P.say(title, 'Reading the episode…', 0.02);
    const p = ready || await plan(ep);
    if (!p.lines.length) {
      P.say(`Episode ${ep}: nobody has a voice yet`, `Make a voice in your Inworld workspace named exactly like a player (${p.voiceless.slice(0, 6).join(', ')}${p.voiceless.length > 6 ? '…' : ''}), or "${CIRCLE_VOICE}" for the Circle itself, and press again.`, null, true);
      return;
    }
    const todo = force ? p.lines : p.missing;
    if (!todo.length) { P.say(`Episode ${ep} is already voiced`, `${p.lines.length} lines have a voice. Nothing to pay for.`, 1, true); return; }
    // six lines a request (a bigger batch can outlive the worker's limits: a bare "NetworkError", vp-bb-ep/voicing.js)
    const batches = [];
    for (let k = 0; k < todo.length; k += 6) batches.push(todo.slice(k, k + 6));
    let n = 0, chars = 0;
    const failed = [];
    for (const b of batches) {
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
      else { n += j.done.length; chars += j.chars || 0; failed.push(...(j.failed || [])); }
      P.say(title, `Voicing: ${n} of ${todo.length} lines`, 0.05 + (n + failed.length) / todo.length * 0.95);
    }
    await ciVoicedLines(ep, true);
    ciHubVoiceLabel(ep);
    const secs = Math.round((Date.now() - t0) / 1000), cost = (chars * PRICE).toFixed(2);
    const without = p.voiceless.length ? ` No voice yet for ${p.voiceless.join(', ')}: their lines stay silent.` : '';
    P.say(failed.length ? `Episode ${ep}: ${n} voiced, ${failed.length} failed` : `Episode ${ep} is voiced`,
      `${n} lines in ${secs} s, about $${cost}.${without}${failed.length ? ` Failed: ${failed[0].error}. Press 🎙 again to voice just those.` : ''}`, 1, true);
  } catch (e) {
    P.say(`Voicing episode ${ep} stopped`, String(e.message || e), null, true);
  } finally {
    busy = false;
  }
}

/** The Run tab's 🎙 button (run-ui.js, id hub-ci-voice): 'Voice' or 'Revoice' once the episode has clips. */
export function ciHubVoiceLabel(ep) {
  const btn = typeof document !== 'undefined' && document.getElementById('hub-ci-voice');
  if (!btn || !ep) return;
  const n = String(ep).padStart(2, '0');
  ciVoicedLines(ep).then(ids => { if (btn.isConnected && +btn.dataset.ep === +ep) btn.textContent = ids && ids.size ? `🎙 Revoice EP ${n}` : `🎙 Voice EP ${n}`; });
}

/** The 🎙 button: an episode with voices asks first (missing lines, or every line again), each with its price. */
export async function ciVoiceSelected(ep) {
  if (busy) return alert('An episode is already being voiced. Wait for it to finish.');
  if (!askToken()) return;
  const P = panel();
  P.say(`Episode ${ep}`, 'Checking which lines already have a voice…', 0.05);
  let p;
  try { p = await plan(ep); } catch (e) { P.say(`Episode ${ep}`, String(e.message || e), null, true); return; }
  if (!p.voicedCount) return ciVoiceEpisode(ep, { ready: p });
  const opts = [];
  if (p.missing.length) opts.push({ label: `Voice the ${p.missing.length} missing lines · about $${estimate(p.missing)}`, value: 'missing', main: true });
  opts.push({ label: `Revoice all ${p.lines.length} lines (new takes) · about $${estimate(p.lines)}`, value: 'all', main: !p.missing.length });
  const pick = await P.choose(`Episode ${ep}`, p.missing.length ? `${p.voicedCount} lines have a voice, ${p.missing.length} don't yet.` : `All ${p.lines.length} lines have a voice.`, opts);
  if (pick === 'missing') return ciVoiceEpisode(ep, { ready: p });
  if (pick === 'all') return ciVoiceEpisode(ep, { force: true, ready: p });
  ciHubVoiceLabel(ep);
}

if (typeof window !== 'undefined') Object.assign(window, { ciVoiceEpisode, ciVoiceSelected, ciEpisodeLines, ciVoiceSeason, ciClearVoices, ciVoicesAfterRerun, ciHubVoiceLabel });

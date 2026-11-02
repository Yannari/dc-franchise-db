// ══════════════════════════════════════════════════════════════════════
// vp-ch-ep/voicing.js — voice a Challenge episode on Inworld, and play it back
// ══════════════════════════════════════════════════════════════════════
// The user, 2026-11-01: "make the automatic voicing of the episode available for the challenge like big brother
// with a button". This is Big Brother's (js/vp-bb-ep/voicing.js) step for step:
//   1. the episode's lines, built in memory by the stepped viewer's own builder (steps.js chStepScreens, with the
//      same history and season the viewer passes, vp-screens.js), so a line here is word for word the line on
//      screen, and its id (speaker + words, hashed) finds its clip;
//   2. dc-studio (/api/voice/render) voices them on Inworld TTS-2 in the user's own Inworld voice of that name, into
//      the audio bucket: voice/ch-<season>/e<episode>/<line>.mp3, The Challenge's own folder;
//   3. the viewer plays a clip when the line has one (chVoiceLine, from screens.js goTo).
// Who speaks: a player's line (`say`), a confessional (`conf`) and TJ (`tj`, his voice named "TJ" or "TJ Maxx").
// A line already in the bucket is never paid for twice; somebody with no voice of their name stays silent.
import { audio as engine } from '../audio.js';
import { chStepScreens, HOST } from './steps.js';
import { CHALLENGE_FORMAT, formatPrefix } from '../shows.js';

const PRICE = 25 / 1e6;   // Inworld TTS-2, dollars a character
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const token = () => { try { return localStorage.getItem('studio_api_token') || ''; } catch { return ''; } };
export const VOICE_API = () => { try { return (localStorage.getItem('studio_api_base') || '').replace(/\/+$/, '') || 'https://dc-studio.yannari19.workers.dev'; } catch { return 'https://dc-studio.yannari19.workers.dev'; } };
let busy = false;

/** A line's id: the speaker and the words, hashed (the same hash as every other show's, so the worker's key rule holds). */
export function lineId(by, text) {
  let h = 2166136261; for (const ch of `${by}|${text}`) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return 'L' + (h >>> 0).toString(16).padStart(8, '0');
}

/** The season's folder in the bucket: ch-<number>, or ch-<its name> before it has one. */
export function chVoiceSeason() {
  const w = typeof window !== 'undefined' ? window : globalThis;
  const cfg = w.seasonConfig || {}, gs = w.gs || {};
  const n = gs.seasonNumber || cfg.seasonNumber;
  const base = n ? String(n) : String(cfg.name || 'season').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 50) || 'season';
  return `${formatPrefix(CHALLENGE_FORMAT)}-${base}`;
}

/** A step's spoken line: { by, text }, or null for a step nobody says out loud (a direction, a card, a map). */
export function spokenOf(st) {
  if (!st) return null;
  if (st.say?.[0] && st.say[1]) return { by: st.say[0], text: String(st.say[1]).trim() };
  if (st.conf?.[0] && st.conf[1]) return { by: st.conf[0], text: String(st.conf[1]).trim() };
  if (st.tj) return { by: HOST, text: String(st.tj).trim() };
  return null;
}

// A voice is found by its name the way a person would type it: capitals, spaces, dashes and a leading "The" do not
// matter. TJ answers to "TJ" or his full name.
export const voiceKey = s => String(s || '').toLowerCase().replace(/^the[\s_-]+/, '').replace(/[^a-z0-9]+/g, '');
const ALIASES = { [HOST]: ['TJ Maxx'] };
/** The voice of each speaker: { speaker: voiceId }, from the account's { name: voiceId }. */
export function resolveVoices(speakers, voices = {}) {
  const byKey = new Map(Object.entries(voices).map(([n, id]) => [voiceKey(n), id]));
  const out = {};
  for (const n of speakers) {
    for (const name of [n, ...(ALIASES[n] || [])]) {
      const id = voices[name] || byKey.get(voiceKey(name));
      if (id) { out[n] = id; break; }
    }
  }
  return out;
}

const chRecs = () => ((typeof window !== 'undefined' ? window.gs?.episodeHistory : null) || []).filter(e => e && e.format === CHALLENGE_FORMAT);

/** Every spoken line of an episode, in the viewer's own words: [{ id, by, text }]. */
export function chEpisodeLines(rec) {
  if (!rec) return [];
  const w = typeof window !== 'undefined' ? window : globalThis;
  const screens = chStepScreens(rec, { history: w.gs?.episodeHistory || [], season: w.seasonConfig?.seasonNumber || null });
  const out = [], seen = new Set();
  for (const S of screens) for (const st of S.steps || []) {
    const l = spokenOf(st);
    if (!l || !l.text) continue;
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
export function chVoicedLines(ep, fresh = false) {
  const k = `${chVoiceSeason()}/${ep}`;
  if (offline()) { if (!live[k]) { live[k] = Promise.resolve(new Set()); live[k].ids = new Set(); } return live[k]; }
  if (!live[k] || fresh) {
    live[k] = fetch(`${VOICE_API()}/api/voice/list?season=${encodeURIComponent(chVoiceSeason())}&episode=${ep}`, { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : { ids: [] })).then(j => { live[k].ids = new Set(j.ids || []); return live[k].ids; })
      .catch(() => { live[k].ids = new Set(); return live[k].ids; });
  }
  return live[k];
}

// ── playback ──────────────────────────────────────────────────────────
const bufs = new Map();
let playing = null, serial = 0, endsAt = 0;
// only the last few clips stay decoded (a voiced episode is hundreds of them)
function loadClip(ctx, url) {
  const got = bufs.get(url) || fetch(url).then(r => (r.ok ? r.arrayBuffer() : null)).then(a => (a ? ctx.decodeAudioData(a) : null)).catch(() => null);
  bufs.delete(url); bufs.set(url, got);
  while (bufs.size > 20) bufs.delete(bufs.keys().next().value);
  return got;
}
/** Stop whatever line is playing (a new step, Back, a seek, leaving the screen). */
export function chVoiceStop() {
  serial++;
  try { playing?.stop(); } catch { /* already ended */ }
  playing = null; endsAt = 0;
}
/** How long the line playing has left, in ms (Play waits for it before the next step). */
export function chVoiceLeft() { return playing ? Math.max(0, endsAt - performance.now()) : 0; }
/** Say a step in its speaker's clip when the episode has one. True when a clip is (about to be) playing. */
export function chVoiceLine(ep, st) {
  chVoiceStop();
  const l = spokenOf(st);
  if (!l || ep == null) return false;
  const id = lineId(l.by, l.text);
  if (!chVoicedLines(ep)?.ids?.has(id)) return false;
  const o = engine.output();
  if (!o) return true;    // muted
  const mine = serial;
  loadClip(o.ctx, `${VOICE_API()}/audio/voice/${chVoiceSeason()}/e${ep}/${id}.mp3`).then(b => {
    // a seek or the next step came first: this clip is no longer the line on screen
    if (!b || mine !== serial) return;
    const src = o.ctx.createBufferSource(), g = o.ctx.createGain();
    src.buffer = b; g.gain.value = 0.9; src.connect(g); g.connect(o.dest); src.start();
    playing = src; endsAt = performance.now() + b.duration * 1000;
    src.onended = () => { if (playing === src) { playing = null; endsAt = 0; } };
  });
  return true;
}

// ── voicing an episode ────────────────────────────────────────────────
function panel() {
  let el = document.getElementById('ch-voicing');
  if (!el) {
    el = document.createElement('div'); el.id = 'ch-voicing';
    el.style.cssText = 'position:fixed;right:16px;bottom:16px;z-index:100000;width:min(360px,calc(100vw - 32px));'
      + 'background:#1a1716;color:#fff3ea;border:1px solid #ff6a1a77;border-radius:12px;padding:12px 14px;font:13px/1.45 system-ui,sans-serif;box-shadow:0 12px 40px rgba(0,0,0,.45)';
    document.body.appendChild(el);
  }
  return {
    choose(title, detail, options) {
      return new Promise(resolve => {
        el.innerHTML = `<b style="display:block;margin-bottom:3px">${title}</b><div style="color:#c9b8ab;margin-bottom:8px">${detail}</div>`
          + options.map((o, k) => `<button type="button" data-k="${k}" style="display:block;width:100%;margin-top:6px;text-align:left;border-radius:8px;padding:7px 10px;font-weight:700;cursor:pointer;${o.main ? 'background:#ff6a1a;border:0;color:#1a1716' : 'background:transparent;border:1px solid #5a4636;color:#fff3ea'}">${o.label}</button>`).join('')
          + '<button type="button" data-k="-1" style="margin-top:8px;background:transparent;border:0;color:#a8968a;cursor:pointer">Cancel</button>';
        el.querySelectorAll('button[data-k]').forEach(b => b.addEventListener('click', () => { const k = +b.dataset.k; el.remove(); resolve(k < 0 ? null : options[k].value); }));
      });
    },
    say(title, detail = '', pct = null, done = false) {
      el.innerHTML = `<b style="display:block;margin-bottom:3px">${title}</b><div style="color:#c9b8ab">${detail}</div>`
        + (pct != null ? `<div style="height:5px;background:#3a2c22;border-radius:3px;margin-top:8px"><div style="height:5px;width:${Math.round(pct * 100)}%;background:#ff6a1a;border-radius:3px"></div></div>` : '')
        + (done ? '<button type="button" style="margin-top:8px;background:#ff6a1a;border:0;border-radius:8px;padding:5px 12px;font-weight:700;cursor:pointer" onclick="this.parentNode.remove()">Close</button>' : '');
    },
  };
}
function askToken() {
  if (!token() && typeof prompt === 'function') {
    const t = (prompt('Paste your studio token to voice this episode. It is the same token the Casting Studio and the other shows\' voicing use, and it is remembered on this device.') || '').trim();
    if (t) { try { localStorage.setItem('studio_api_token', t); } catch { /* this session only */ } }
  }
  return !!token();
}

/** After a re-run from episode `fromEp`: nothing is deleted (a clip is found by its speaker and words, so a line the
 *  re-run kept plays its old clip; every clip was paid for). The episodes' lists are asked again. */
export function chVoicesAfterRerun(fromEp) {
  for (const rec of chRecs().filter(e => +e.num >= +fromEp)) chVoicedLines(+rec.num, true);
}

/** What an episode needs: its lines, the voices, which lines have one, which are missing, and who has no voice. */
async function plan(ep) {
  const rec = chRecs().find(e => +e.num === +ep);
  const all = chEpisodeLines(rec);
  let voices = {};
  try { const j = await (await fetch(`${VOICE_API()}/api/voice/voices`, { headers: { Authorization: `Bearer ${token()}` } })).json(); if (j.ok) voices = j.voices || {}; } catch { /* none */ }
  const ids = new Set(all.map(l => l.id));
  const have = new Set([...((await chVoicedLines(ep, true)) || [])].filter(id => ids.has(id)));
  voices = resolveVoices([...new Set(all.map(l => l.by))], voices);
  const lines = all.filter(l => voices[l.by]);
  const missing = lines.filter(l => !have.has(l.id));
  const voiceless = [...new Set(all.filter(l => !voices[l.by]).map(l => l.by))];
  return { all, voices, lines, missing, voiceless, voicedCount: lines.length - missing.length };
}
const estimate = ls => (ls.reduce((a, l) => a + l.text.length, 0) * PRICE).toFixed(2);

/** Voice an episode: the missing lines, or every line again (force). Runs in the background with a corner box. */
export async function chVoiceEpisode(ep, { force = false, ready = null } = {}) {
  if (!ep || busy || !askToken()) return;
  busy = true;
  const P = panel(), t0 = Date.now(), season = chVoiceSeason(), title = `Voicing episode ${ep}`;
  try {
    P.say(title, 'Reading the episode…', 0.02);
    const p = ready || await plan(ep);
    if (!p.lines.length) {
      P.say(`Episode ${ep}: nobody has a voice yet`, `Make a voice in your Inworld workspace named like the speaker (${p.voiceless.slice(0, 6).map(esc).join(', ')}${p.voiceless.length > 6 ? '…' : ''}) and press again.`, null, true);
      return;
    }
    const todo = force ? p.lines : p.missing;
    if (!todo.length) { P.say(`Episode ${ep} is already voiced`, `${p.lines.length} lines have a voice. Nothing to pay for.`, 1, true); return; }
    // one request at a time, six lines each (the worker voices four at once; Inworld takes five; a request the
    // worker cannot finish in time comes back as a bare "NetworkError")
    const batches = [];
    for (let k = 0; k < todo.length; k += 6) batches.push(todo.slice(k, k + 6));
    let done = 0, chars = 0;
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
      else { done += j.done.length; chars += j.chars || 0; failed.push(...(j.failed || [])); }
      P.say(title, `Voicing: ${done} of ${todo.length} lines`, 0.05 + (done + failed.length) / todo.length * 0.95);
    }
    await chVoicedLines(ep, true);
    chHubVoiceLabel(ep);
    const secs = Math.round((Date.now() - t0) / 1000), cost = (chars * PRICE).toFixed(2);
    const without = p.voiceless.length ? ` No voice yet for ${p.voiceless.map(esc).join(', ')}: they stay silent.` : '';
    P.say(failed.length ? `Episode ${ep}: ${done} voiced, ${failed.length} failed` : `Episode ${ep} is voiced`,
      `${done} lines in ${secs} s, about $${cost}.${without}${failed.length ? ` Failed: ${esc(failed[0].error)}. Press 🎙 again to voice just those.` : ''}`, 1, true);
  } catch (e) {
    P.say(`Voicing episode ${ep} stopped`, esc(e.message || e), null, true);
  } finally {
    busy = false;
  }
}

/** The Run tab's 🎙 button (run-ui.js, id hub-ch-voice): 'Voice' or 'Revoice' once the episode has clips. */
export function chHubVoiceLabel(ep) {
  const btn = typeof document !== 'undefined' && document.getElementById('hub-ch-voice');
  if (!btn || !ep) return;
  const n = String(ep).padStart(2, '0');
  chVoicedLines(ep).then(ids => { if (btn.isConnected && +btn.dataset.ep === +ep) btn.textContent = ids && ids.size ? `🎙 Revoice EP ${n}` : `🎙 Voice EP ${n}`; });
}

/** The 🎙 buttons (the Run tab's and the viewer's): an episode with voices asks first (missing lines, or every line
 *  again), each with its price, and names who has no voice. */
export async function chVoiceSelected(ep) {
  if (busy) return alert('An episode is already being voiced. Wait for it to finish.');
  if (!askToken()) return;
  const P = panel();
  P.say(`Episode ${ep}`, 'Checking which lines already have a voice…', 0.05);
  let p;
  try { p = await plan(ep); } catch (e) { P.say(`Episode ${ep}`, esc(e.message || e), null, true); return; }
  if (!p.voicedCount) return chVoiceEpisode(ep, { ready: p });
  const opts = [];
  if (p.missing.length) opts.push({ label: `Voice the ${p.missing.length} missing lines · about $${estimate(p.missing)}`, value: 'missing', main: true });
  opts.push({ label: `Revoice all ${p.lines.length} lines (new takes) · about $${estimate(p.lines)}`, value: 'all', main: !p.missing.length });
  const nobody = p.voiceless.length
    ? `<br><br>No Inworld voice for <b>${p.voiceless.map(esc).join(', ')}</b> (${p.all.filter(l => p.voiceless.includes(l.by)).length} lines): they stay silent. Name a voice in your Inworld workspace like them; capitals, spaces and dashes don't matter.`
    : '';
  const pick = await P.choose(`Episode ${ep}`, `${p.missing.length ? `${p.voicedCount} lines have a voice, ${p.missing.length} don't yet.` : `All ${p.lines.length} voiced lines have a voice.`}${nobody}`, opts);
  if (pick === 'missing') return chVoiceEpisode(ep, { ready: p });
  if (pick === 'all') return chVoiceEpisode(ep, { force: true, ready: p });
  chHubVoiceLabel(ep);
}

if (typeof window !== 'undefined') Object.assign(window, { chVoiceEpisode, chVoiceSelected, chEpisodeLines, chVoiceSeason, chVoicesAfterRerun, chHubVoiceLabel });

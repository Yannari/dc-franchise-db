// ══════════════════════════════════════════════════════════════════════
// vp-td-ep/voicing.js — voice an episode: its lines, voiced on Inworld, kept in the audio bucket
// ══════════════════════════════════════════════════════════════════════
// The Run tab's 🎙 button (run-ui.js, beside Watch latest and Sim 5) on the episode the hub is showing. It runs in
// the BACKGROUND (the user, 2026-10-12: "can it process the voice acting in the bg, without opening the viewer"),
// with a small progress box in the corner. In order:
//   1. the episode's lines, built in memory by the viewer's own builder (screens.js tdEpisodeLines), read exactly
//      as the viewer speaks them; the silent play-through (sound.js recordEpisodeLines) only if that cannot;
//   2. dc-studio (/api/voice/render) voices them on Inworld TTS-2 in each character's voice (the user's own Inworld
//      voices, by name) into the audio bucket, voice/<season>/e<episode>/<line>.mp3, in their own words: no director
//      (the user, 2026-10-14, after hearing one: "it slowed the voices too much");
//   3. the viewer plays them from then on, for anybody (sound.js speak).
// A line already in the bucket is never paid for twice. A character with no voice of their name keeps the blips.
import { recordEpisodeLines, voiceSeason, voicedLines, VOICE_API } from './sound.js';
import { directionFor } from './direct.js';

const PRICE = 25 / 1e6;   // Inworld TTS-2, dollars a character (their page, 2026-10-11)
const token = () => { try { return localStorage.getItem('studio_api_token') || ''; } catch { return ''; } };
export const canVoice = () => !!token();
let busy = false;

// a small box in the corner: the simulator stays usable while an episode is voiced
function panel() {
  let el = document.getElementById('td-voicing');
  if (!el) {
    el = document.createElement('div'); el.id = 'td-voicing';
    el.style.cssText = 'position:fixed;right:16px;bottom:16px;z-index:100000;width:min(360px,calc(100vw - 32px));'
      + 'background:#16151d;color:#f2efe8;border:1px solid #3a3746;border-radius:12px;padding:12px 14px;font:13px/1.45 system-ui,sans-serif;box-shadow:0 12px 40px rgba(0,0,0,.45)';
    document.body.appendChild(el);
  }
  return {
    /** Buttons in the box; resolves with the chosen value (null: Cancel). */
    choose(title, detail, options) {
      return new Promise(resolve => {
        el.innerHTML = `<b style="display:block;margin-bottom:3px">${title}</b><div style="color:#b9b4c6;margin-bottom:8px">${detail}</div>`
          + options.map((o, k) => `<button type="button" data-k="${k}" style="display:block;width:100%;margin-top:6px;text-align:left;border-radius:8px;padding:7px 10px;font-weight:700;cursor:pointer;${o.main ? 'background:#f4b23e;border:0;color:#16151d' : 'background:transparent;border:1px solid #4a4658;color:#f2efe8'}">${o.label}</button>`).join('')
          + '<button type="button" data-k="-1" style="margin-top:8px;background:transparent;border:0;color:#9c97ab;cursor:pointer">Cancel</button>';
        el.querySelectorAll('button[data-k]').forEach(b => b.addEventListener('click', () => { const k = +b.dataset.k; el.remove(); resolve(k < 0 ? null : options[k].value); }));
      });
    },
    say(title, detail = '', pct = null, done = false) {
      el.innerHTML = `<b style="display:block;margin-bottom:3px">${title}</b><div style="color:#b9b4c6">${detail}</div>`
        + (pct != null ? `<div style="height:5px;background:#2b2936;border-radius:3px;margin-top:8px"><div style="height:5px;width:${Math.round(pct * 100)}%;background:#f4b23e;border-radius:3px"></div></div>` : '')
        + (done ? '<button type="button" style="margin-top:8px;background:#f4b23e;border:0;border-radius:8px;padding:5px 12px;font-weight:700;cursor:pointer" onclick="this.parentNode.remove()">Close</button>' : '');
    },
  };
}

/** Run `fn` over `items` with `n` at a time. */
async function pool(items, n, fn) {
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => { while (next < items.length) { const i = next++; await fn(items[i], i); } }));
}

function askToken() {
  // remembered on this device; kept per site, so one set on localhost is not on the published site
  if (!token() && typeof prompt === 'function') {
    const t = (prompt('Paste your studio token to voice this episode. It is the same token the Casting Studio and the gallery use, and it is remembered on this device.') || '').trim();
    if (t) { try { localStorage.setItem('studio_api_token', t); } catch { /* this session only */ } }
  }
  return !!token();
}

/** Delete voices from the bucket: one episode (but the line ids in `keep`), every episode from `from` on, or the
 *  whole season. For the places that delete or replace episodes (run-ui.js replay, savestate.js reset, cast-ui.js
 *  delete save): "when an episode gets deleted it should delete the voicing too" (the user, 2026-10-12). Quietly
 *  nothing without the studio token. */
export async function clearVoices({ season = voiceSeason(), episode, from, keep } = {}) {
  if (!token()) return 0;
  try {
    const r = await fetch(`${VOICE_API()}/api/voice/clear`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
      body: JSON.stringify({ season, episode, from, keep }) });
    const j = await r.json();
    if (episode) await voicedLines(episode, true);
    return j.deleted || 0;
  } catch { return 0; }
}

/** After a re-run from `fromEp`: each episode from there keeps the clips of the lines it still has (same speaker, same
 *  words: the same clip, "if the lines are legitimately the same, keeping it is not a bad idea", the user) and loses
 *  the rest; anything past the season's new last episode goes. Lines are built in memory (tdEpisodeLines). */
export async function voicesAfterRerun(fromEp) {
  if (!token()) return;
  const hist = (window.gs?.episodeHistory || []).filter(e => +e.num >= +fromEp);
  let last = +fromEp - 1;
  try {
    const { tdEpisodeLines } = await import('./screens.js');
    for (const rec of hist) {
      last = Math.max(last, +rec.num);
      let keep = [];
      try { keep = tdEpisodeLines(rec).map(l => l.id); } catch { /* cannot build it: keep nothing, it is a new night */ }
      await clearVoices({ episode: +rec.num, keep });
    }
  } finally {
    await clearVoices({ from: last + 1 });
  }
}

/** What an episode needs: its lines, the voices, what the bucket already holds, and what is missing. */
async function plan(ep, say = () => {}) {
  const rec = (window.gs?.episodeHistory || []).find(e => +e.num === +ep);
  let all = [];
  try { const { tdEpisodeLines } = await import('./screens.js'); if (rec) all = tdEpisodeLines(rec); } catch (e) { console.warn('[voicing] could not build the lines in memory:', e); }
  if (!all.length) { say('Reading the episode (it plays through silently)…'); all = await recordEpisodeLines(ep); }
  // every voice in the user's Inworld account, by the character's name (dc-studio reads it with the key)
  let voices = {};
  try { const j = await (await fetch(`${VOICE_API()}/api/voice/voices`, { headers: { Authorization: `Bearer ${token()}` } })).json(); if (j.ok) voices = j.voices; } catch { /* the file */ }
  if (!Object.keys(voices).length) voices = await (await fetch('assets/audio/td/voices/inworld.json', { cache: 'no-store' })).json();
  let have = (await voicedLines(ep, true)) || new Set();
  // a clip that is none of this episode's lines belongs to a version of it that is gone (deleted, re-run): it goes,
  // so "already voiced" never counts a dead episode's lines (the user saw "64 already have a voice" on a new one)
  const ids = new Set(all.map(l => l.id));
  if ([...have].some(id => !ids.has(id))) { await clearVoices({ episode: ep, keep: [...ids] }); have = new Set([...have].filter(id => ids.has(id))); }
  const lines = all.filter(l => voices[l.by] && l.text);
  const missing = lines.filter(l => !have.has(l.id));
  return { all, voices, lines, missing, voicedCount: lines.length - missing.length };
}
// (a directed line is voiced twice, plain and directed, and the worker keeps one: direct.js)
const estimate = ls => (ls.reduce((a, l) => { const d = directionFor(l); return a + l.text.length + (d ? l.text.length + d.length + 3 : 0); }, 0) * PRICE).toFixed(2);

export async function tdVoiceEpisode(ep, { force = false, ready = null } = {}) {
  if (!ep || busy || !askToken()) return;
  busy = true;
  let P = panel();
  const t0 = Date.now(), season = voiceSeason(), title = `Voicing episode ${ep}`;
  try {
    P.say(title, 'Reading the episode…', 0.02);
    const p = ready || await plan(ep, d => P.say(title, d, 0.05));
    const todo = force ? p.lines : p.missing;   // Revoice: every line again
    if (!todo.length) { P.say(`Episode ${ep} is already voiced`, `${p.lines.length} lines have a voice. Nothing to pay for.`, 1, true); return; }

    // No AI director (the user, 2026-10-14: "just remove the director it slowed the voices too much its annoying").
    // A TRIAL since ("we can try it lets test it if i dont like it we removing it"): the few lines whose scene says
    // how they come out (a shout, tears, a laugh, a whisper, a shock) get a short delivery from direct.js; the worker
    // keeps it only if the take is not more than 20% longer than the plain one. Every other line: its own words.

    // the voices: ONE request at a time, the worker voicing four of its lines at once. The user's Inworld plan takes
    // five requests at a time; three requests of four (twelve) got 416 of 638 lines refused on the first episode.
    // Six lines a request (it was twelve): a request the worker cannot finish inside its limits is cut off by
    // Cloudflare with no CORS header, which the browser only reports as "NetworkError when attempting to fetch
    // resource", and that one batch used to stop the whole episode (episode 9, 2026-10-15).
    const batches = [];
    for (let k = 0; k < todo.length; k += 6) batches.push(todo.slice(k, k + 6));
    let done = 0, chars = 0, directed = 0, keptDirected = 0;
    const failed = [];
    await pool(batches, 1, async b => {
      // a request that dies on the way is tried twice more after a pause, then its lines count as failed and the
      // rest of the episode goes on (a second press voices just the missing ones)
      let r, lost = null;
      for (let tries = 0; tries < 3; tries++) {
        try {
          r = await fetch(`${VOICE_API()}/api/voice/render`, {
            method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
            body: JSON.stringify({ season, episode: ep, voices: p.voices, force, lines: b.map(l => ({ id: l.id, by: l.by, text: l.text, direction: directionFor(l) })) }),
          });
          lost = null;
          break;
        } catch (e) {
          lost = String(e.message || e);
          await new Promise(res => setTimeout(res, 2000 * (tries + 1)));
        }
      }
      if (lost) { failed.push(...b.map(l => ({ id: l.id, error: `the studio did not answer (${lost})` }))); return; }
      const j = await r.json().catch(() => ({ ok: false, error: `studio ${r.status}` }));
      if (!j.ok) { failed.push(...b.map(l => ({ id: l.id, error: j.error }))); return; }
      done += j.done.length; chars += j.chars || 0; directed += j.directed || 0; keptDirected += j.keptDirected || 0; failed.push(...(j.failed || []));
      P.say(title, `Voicing: ${done} of ${todo.length} lines`, 0.2 + (done + failed.length) / todo.length * 0.8);
    });

    await voicedLines(ep, true);
    hubVoiceLabel(ep);
    const secs = Math.round((Date.now() - t0) / 1000);
    const cost = (chars * PRICE).toFixed(2);
    console.info(`[voicing] episode ${ep}: ${done} lines in ${secs}s, ${chars} characters (~$${cost}); directed ${keptDirected} of ${directed} tried`, failed.length ? failed : '');
    P.say(failed.length ? `Episode ${ep}: ${done} voiced, ${failed.length} failed` : `Episode ${ep} is voiced`,
      `${done} lines in ${secs} s, about $${cost}.${directed ? ` ${keptDirected} of ${directed} lines kept a delivery (the rest ran long and stayed plain).` : ''}${failed.length ? ` Failed: ${failed[0].error}${failed.length > 1 ? ` (and ${failed.length - 1} more). Press the 🎙 button again to voice just those.` : ''}` : ' Watch it whenever you like.'}`, 1, true);
  } catch (e) {
    P.say(`Voicing episode ${ep} stopped`, String(e.message || e), null, true);
  } finally {
    busy = false;
  }
}

/** The Run tab's 🎙 button: the SELECTED episode (the one the hub is showing, picked on its episode strip), named on
 *  the button, 'Voice' or 'Revoice' once it has voices (the user, 2026-10-12). Asks the bucket on every render. */
export function hubVoiceLabel(ep) {
  const btn = typeof document !== 'undefined' && document.getElementById('hub-voice');
  if (!btn || !ep) return;
  const n = String(ep).padStart(2, '0');
  voicedLines(ep).then(ids => { if (btn.isConnected && +btn.dataset.ep === +ep) { btn.textContent = ids && ids.size ? `🎙 Revoice EP ${n}` : `🎙 Voice EP ${n}`; btn.dataset.voiced = ids && ids.size ? '1' : ''; } });
}

/** The click. An episode with voices gets a choice in the corner box: the lines still without a voice (a run that
 *  failed half way, a character given a voice since), or every line again with new takes (the
 *  user: "it doesn't give me the option to revoice all"). Each with its price. */
export async function voiceSelectedEpisode(ep) {
  if (busy) return alert('An episode is already being voiced. Wait for it to finish.');
  const btn = document.getElementById('hub-voice');
  if (!btn?.dataset.voiced) return tdVoiceEpisode(ep);
  if (!askToken()) return;
  const P = panel();
  P.say(`Episode ${ep}`, 'Checking which lines already have a voice…', 0.05);
  let p;
  try { p = await plan(ep); } catch (e) { P.say(`Episode ${ep}`, String(e.message || e), null, true); return; }
  const opts = [];
  if (p.missing.length) opts.push({ label: `Voice the ${p.missing.length} missing lines · about $${estimate(p.missing)}`, value: 'missing', main: true });
  opts.push({ label: `Revoice all ${p.lines.length} lines (new takes) · about $${estimate(p.lines)}`, value: 'all', main: !p.missing.length });
  const pick = await panel().choose(`Episode ${ep}`,
    p.missing.length ? `${p.voicedCount} lines have a voice, ${p.missing.length} don't yet.` : `All ${p.lines.length} lines have a voice.`, opts);
  if (pick === 'missing') return tdVoiceEpisode(ep, { ready: p });
  if (pick === 'all') return tdVoiceEpisode(ep, { force: true, ready: p });
  hubVoiceLabel(ep);
}
if (typeof window !== 'undefined') {
  Object.assign(window, { tdVoiceEpisode, tdCanVoice: canVoice, voiceSelectedEpisode, hubVoiceLabel, tdClearVoices: clearVoices, tdVoicesAfterRerun: voicesAfterRerun });
}

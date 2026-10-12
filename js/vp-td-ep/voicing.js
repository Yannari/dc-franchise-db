// ══════════════════════════════════════════════════════════════════════
// vp-td-ep/voicing.js — voice an episode: its lines, directed, voiced on Inworld, kept in the audio bucket
// ══════════════════════════════════════════════════════════════════════
// One button on the stepped viewer (the user, 2026-10-11: "build it, but we will run it on a real episode, so we
// don't waste our time with temporary tests"). What it does, in order:
//   1. plays the episode silently in THIS browser and keeps every line as it is said here (sound.js
//      recordEpisodeLines: the TD writer reads the franchise ledger, so another browser can word a line otherwise);
//   2. the voice director (dc-analytics, mode 'voice-direction') reads them in context, a stretch at a time, and
//      gives each a short delivery: who says it, to whom, the scene, the line before;
//   3. dc-studio (/api/voice/render) voices them on Inworld TTS-2 in each character's voice and keeps the clips in
//      the audio bucket, voice/<season>/e<episode>/<line>.mp3; a line already there is skipped, never paid twice;
//   4. the viewer plays them from then on, for anybody (sound.js speak).
// A character with no voice of their own name in the user's Inworld account keeps the blips.
import { recordEpisodeLines, voiceSeason, voicedLines, VOICE_API } from './sound.js';
import { writerEndpoint } from '../social/writer.js';

const PRICE = 25 / 1e6;   // Inworld TTS-2, dollars a character (their page, 2026-10-11)
const token = () => { try { return localStorage.getItem('studio_api_token') || ''; } catch { return ''; } };
export const canVoice = () => !!token();

function panel() {
  let el = document.getElementById('td-voicing');
  if (!el) {
    el = document.createElement('div'); el.id = 'td-voicing';
    el.style.cssText = 'position:fixed;left:50%;top:18px;transform:translateX(-50%);z-index:100000;width:min(520px,calc(100vw - 32px));'
      + 'background:#16151d;color:#f2efe8;border:1px solid #3a3746;border-radius:12px;padding:14px 16px;font:14px/1.45 system-ui,sans-serif;box-shadow:0 12px 40px rgba(0,0,0,.45)';
    document.body.appendChild(el);
  }
  return {
    say(title, detail = '', pct = null, done = false) {
      el.innerHTML = `<b style="display:block;margin-bottom:4px">${title}</b><div style="color:#b9b4c6">${detail}</div>`
        + (pct != null ? `<div style="height:6px;background:#2b2936;border-radius:3px;margin-top:10px"><div style="height:6px;width:${Math.round(pct * 100)}%;background:#f4b23e;border-radius:3px"></div></div>` : '')
        + (done ? '<button type="button" style="margin-top:10px;background:#f4b23e;border:0;border-radius:8px;padding:6px 14px;font-weight:700;cursor:pointer" onclick="this.parentNode.remove()">Close</button>' : '');
    },
  };
}

/** Run `fn` over `items` with `n` at a time. */
async function pool(items, n, fn) {
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => { while (next < items.length) { const i = next++; await fn(items[i], i); } }));
}

export async function tdVoiceEpisode(ep = Number(window.vpEpNum), { force = false } = {}) {
  if (!ep) return alert('Open the episode you want voiced first.');
  // the studio token, asked once and remembered on this device (it is kept per site: one set on localhost is not
  // on the published site), the way the photo backup asks; the button shows either way (the user did not see it)
  if (!token() && typeof prompt === 'function') {
    const t = (prompt('Paste your studio token to voice this episode. It is the same token the Casting Studio and the gallery use, and it is remembered on this device.') || '').trim();
    if (t) { try { localStorage.setItem('studio_api_token', t); } catch { /* this session only */ } }
  }
  if (!token()) return;
  const P = panel(), t0 = Date.now(), season = voiceSeason();
  try {
    // 1. the lines, as this browser says them
    P.say(`Voicing episode ${ep}`, 'Reading the episode (it plays through silently)…', 0);
    const all = await recordEpisodeLines(ep, (s, n, k) => P.say(`Voicing episode ${ep}`, `Reading the episode: screen ${s} of ${n}, ${k} lines`, s / n * 0.25));
    // every voice in the user's Inworld account, by the character's name (dc-studio reads it with the key);
    // the file is the fallback when the worker cannot be asked
    let voices = {};
    try { const j = await (await fetch(`${VOICE_API()}/api/voice/voices`, { headers: { Authorization: `Bearer ${token()}` } })).json(); if (j.ok) voices = j.voices; } catch { /* the file */ }
    if (!Object.keys(voices).length) voices = await (await fetch('assets/audio/td/voices/inworld.json', { cache: 'no-store' })).json();
    const have = (await voicedLines(ep, true)) || new Set();
    const lines = all.filter(l => voices[l.by] && l.text);
    const todo = force ? lines : lines.filter(l => !have.has(l.id));   // Revoice: every line again
    if (!todo.length) { P.say(`Episode ${ep} is already voiced`, `${lines.length} lines have a voice. Nothing to pay for.`, 1, true); return; }

    // 2. the director: each line in context, a stretch (one screen) at a time
    const indexed = all.map((l, i) => ({ ...l, i }));
    const ctx = l => {
      const prev = indexed[l.i - 1];
      return { i: l.i, by: l.by, text: l.text, kind: l.k, scene: l.why || l.badge || null,
        to: prev && prev.by !== l.by && prev.screen === l.screen && l.k !== 'conf' ? prev.by : null,
        prev: prev && prev.screen === l.screen ? { by: prev.by, text: prev.text } : null };
    };
    const want = new Set(todo.map(l => l.id));
    const screens = [...new Set(indexed.filter(l => want.has(l.id)).map(l => l.screen))];
    const cast = Object.fromEntries((window.players || []).filter(p => voices[p.name]).map(p => [p.name, p.voice || p.archetype || '']));
    cast.Chris = cast.Chris || 'the smug reality-TV host';
    const dir = {};
    let directed = 0;
    await pool(screens, 3, async scr => {
      const part = indexed.filter(l => l.screen === scr && want.has(l.id));
      for (let k = 0; k < part.length; k += 60) {
        const chunk = part.slice(k, k + 60);
        try {
          const r = await fetch(writerEndpoint(), { method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mode: 'voice-direction', lines: chunk.map(ctx), cast }) });
          const j = await r.json();
          for (const d of (j.directions || [])) { const l = indexed[d.i]; if (l) dir[l.id] = d.d; }
        } catch { /* no direction: the line is voiced in its own words */ }
        directed += chunk.length;
        P.say(`Voicing episode ${ep}`, `Directing: ${directed} of ${todo.length} lines`, 0.25 + directed / todo.length * 0.2);
      }
    });

    // 3. the voices, twelve lines a request, three requests at a time
    const batches = [];
    for (let k = 0; k < todo.length; k += 12) batches.push(todo.slice(k, k + 12));
    let done = 0, chars = 0;
    const failed = [];
    await pool(batches, 3, async b => {
      const r = await fetch(`${VOICE_API()}/api/voice/render`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ season, episode: ep, voices, force, lines: b.map(l => ({ id: l.id, by: l.by, text: l.text, direction: dir[l.id] || '' })) }),
      });
      const j = await r.json().catch(() => ({ ok: false, error: `studio ${r.status}` }));
      if (!j.ok) { failed.push(...b.map(l => ({ id: l.id, error: j.error }))); return; }
      done += j.done.length; chars += j.chars || 0; failed.push(...(j.failed || []));
      P.say(`Voicing episode ${ep}`, `Voicing: ${done} of ${todo.length} lines`, 0.45 + done / todo.length * 0.55);
    });

    await voicedLines(ep, true);
    hubVoiceLabel(ep);
    const secs = Math.round((Date.now() - t0) / 1000);
    const cost = (chars * PRICE).toFixed(2);
    console.info(`[voicing] episode ${ep}: ${done} lines in ${secs}s, ${chars} characters (~$${cost}); directions:`, dir, failed.length ? failed : '');
    P.say(failed.length ? `Episode ${ep} voiced, ${failed.length} lines failed` : `Episode ${ep} is voiced`,
      `${done} lines in ${secs} s, about $${cost}.${failed.length ? ` Failed: ${failed[0].error}${failed.length > 1 ? ` (and ${failed.length - 1} more; press Voice again to retry them)` : ''}` : ''} Press Restart to watch it.`, 1, true);
    window.openVisualPlayer(ep);
  } catch (e) {
    P.say(`Voicing episode ${ep} stopped`, String(e.message || e), null, true);
  }
}
/** The Run tab's 🎙 button (run-ui.js, beside Watch latest and Sim 5): 'Voice' for the latest episode, 'Revoice'
 *  once it has voices (the user, 2026-10-12). Asks the bucket after every render of the tab. */
export function hubVoiceLabel(ep) {
  const btn = typeof document !== 'undefined' && document.getElementById('hub-voice');
  if (!btn || !ep) return;
  voicedLines(ep).then(ids => { if (btn.isConnected) { btn.textContent = ids && ids.size ? '🎙 Revoice' : '🎙 Voice'; btn.dataset.voiced = ids && ids.size ? '1' : ''; } });
}
export function voiceLatestEpisode(ep) {
  const btn = document.getElementById('hub-voice');
  if (btn?.dataset.voiced) {
    // a new take of every line, with new directions: it costs what the first voicing did, so it asks
    if (!confirm(`Episode ${ep} already has voices.

Revoice every line with new directions and new takes? That costs about as much as the first time (roughly $0.45).`)) return;
    return tdVoiceEpisode(ep, { force: true });
  }
  return tdVoiceEpisode(ep);
}
if (typeof window !== 'undefined') {
  Object.assign(window, { tdVoiceEpisode, tdCanVoice: canVoice, voiceLatestEpisode, hubVoiceLabel });
}

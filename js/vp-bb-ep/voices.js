// ══════════════════════════════════════════════════════════════════════
// vp-bb-ep/voices.js — the houseguests' voices, and the room under them
// ══════════════════════════════════════════════════════════════════════
//
// The user, 2026-10-06: "we need those voices like Animal Crossing we're using in Perfect Match,
// and other sounds when there's no music; it feels empty."
//
//   the voices   a tiny vowel ("animalese") every third letter as a line types out, pitched per
//                houseguest (the same person always sounds the same; men lower, women higher),
//                the host brighter, Big Brother low and level. Their own switch ("Voices").
//   the room     when a scene has no music, the room it is in is not silent: low room tone, plus
//                the room's own sounds now and then (the kitchen's clink, the backyard's birds
//                and water, crickets in a bedroom at night, the murmur of a full living room).
//
// The technique is Perfect Match's (vp-pm/sound.js); the voices and rooms are Big Brother's. All of
// it goes through the site's audio engine (audio.output()), so mute and volume apply. Silent in tests.
import { audio as engine } from '../audio.js';

const KEY = 'bb-voices';
export function voicesOn() { try { return localStorage.getItem(KEY) !== '0'; } catch { return true; } }
export function bbxVoices() {
  const on = !voicesOn();
  try { localStorage.setItem(KEY, on ? '1' : '0'); } catch { /* a per-viewer convenience */ }
  if (typeof document !== 'undefined') document.querySelectorAll('.bbx-voices').forEach(b => b.classList.toggle('on', on));
  if (!on) stopRoom();
}

const hash = s => { let h = 2166136261; for (const ch of String(s)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h >>> 0; };
function genderOf(name) {
  try { return (globalThis.players || []).find(p => p.name === name)?.gender || null; } catch { return null; }
}
function voiceOf(who, kind) {
  if (kind === 'bb') return { f: 120, vol: 0.09, square: true };
  if (kind === 'host') return { f: 360, vol: 0.11 };
  const h = hash(who);
  const g = genderOf(who);
  const base = g === 'm' ? 200 : g === 'f' ? 400 : 290;
  return { f: base * (0.85 + ((h % 1000) / 1000) * 0.35), vol: h % 3 === 0 ? 0.07 : 0.1, square: h % 3 === 0 };
}
const VOWEL = { a: [800, 1200], e: [450, 1900], i: [320, 2300], o: [480, 850], u: [340, 750] };
const HISS = new Set(['s', 'z', 'f', 'h', 'x', 'c']);
function vowelFor(text, k) {
  for (let j = k - 1; j < Math.min(text.length, k + 4); j++) {
    const ch = (text[j] || '').toLowerCase();
    if (VOWEL[ch]) return VOWEL[ch];
    if (ch === 'y') return VOWEL.i;
    if (!/[a-z]/.test(ch)) break;
  }
  return VOWEL.a;
}
let lastBlip = 0;
/** A letter just typed: `text` the whole line, `k` how many letters are showing. */
export function voiceTick(who, kind, text, k) {
  const ch = text[k - 1];
  if (kind === 'beat' || !ch || !/[a-z0-9]/i.test(ch) || k % 3 || !voicesOn()) return;
  const out = engine.output?.();
  if (!out) return;
  const { ctx: c, dest } = out;
  const now = c.currentTime;
  if (now - lastBlip < 0.04) return;
  lastBlip = now;
  try {
    const v = voiceOf(who || kind, kind);
    // a shout is louder and higher; a question rises at the end; a Diary Room is close and soft
    const shout = /!/.test(text) && (text.match(/!/g) || []).length >= 2;
    const q = /\?\s*$/.test(text) && k > text.length - 12 ? 1.12 : 1;
    const f0 = v.f * (1 + ((ch.toLowerCase().charCodeAt(0) % 7) - 3) * 0.035) * q * (shout ? 1.15 : 1) * (kind === 'dr' ? 0.95 : 1);
    const [f1, f2] = vowelFor(text, k);
    const dur = shout ? 0.08 : 0.07;
    const src = c.createOscillator(); src.type = v.square ? 'square' : 'sawtooth';
    src.frequency.setValueAtTime(f0, now); src.frequency.linearRampToValueAtTime(f0 * 1.04, now + dur);
    const g = c.createGain();
    const vol = v.vol * (shout ? 1.5 : kind === 'dr' ? 0.85 : 1);
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(vol * 1.6, now + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    for (const [fq, gain] of [[f1, 1], [f2, 0.6]]) {
      const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = fq; bp.Q.value = 6;
      const bg = c.createGain(); bg.gain.value = gain;
      src.connect(bp); bp.connect(bg); bg.connect(g);
    }
    g.connect(dest);
    src.start(now); src.stop(now + dur + 0.02);
    if (HISS.has(ch.toLowerCase())) noiseBurst(c, dest, now, { dur: 0.035, f: 5000, vol: vol * 0.5 });
  } catch { /* a voice must never break the player */ }
}
/** A short line that lands at once still gets said: a quick run of syllables. */
export function voiceSay(who, kind, text) {
  if (!voicesOn()) return;
  const t = String(text || '').slice(0, 36);
  for (let k = 3; k <= t.length; k += 3) setTimeout(() => voiceTick(who, kind, t, k), (k / 3) * 70);
}

function noiseBuffer(c, secs = 2) {
  const b = c.createBuffer(1, c.sampleRate * secs, c.sampleRate);
  const d = b.getChannelData(0);
  let last = 0;
  for (let i = 0; i < d.length; i++) { const w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; }   // brown noise
  return b;
}
function noiseBurst(c, dest, now, { dur, f, vol }) {
  const s = c.createBufferSource(); s.buffer = noiseBuffer(c, 0.2);
  const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = f;
  const g = c.createGain(); g.gain.setValueAtTime(vol, now); g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
  s.connect(hp); hp.connect(g); g.connect(dest); s.start(now); s.stop(now + dur + 0.02);
}
function tone(c, dest, now, { f, dur, vol, type = 'sine', to = null }) {
  const o = c.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, now);
  if (to) o.frequency.exponentialRampToValueAtTime(to, now + dur);
  const g = c.createGain(); g.gain.setValueAtTime(0.0001, now); g.gain.exponentialRampToValueAtTime(vol, now + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
  o.connect(g); g.connect(dest); o.start(now); o.stop(now + dur + 0.02);
}

// ── the room ───────────────────────────────────────────────────────────
// What each room sounds like with nobody's music on: a bed of filtered noise (its "air") and,
// every few seconds, one of its own small sounds.
const ROOMS = {
  kitchen: { air: [500, 0.016], every: [2.5, 6], sounds: ['clink', 'clink', 'tap', 'pour'] },
  ceremony: { air: [380, 0.014], every: [3, 7], sounds: ['murmur', 'creak'] },
  dining: { air: [380, 0.014], every: [3, 7], sounds: ['clink', 'murmur'] },
  yard: { air: [1200, 0.02], every: [1.5, 4], sounds: ['bird', 'bird', 'water'] },
  bedroom: { air: [260, 0.011], every: [3, 6], sounds: ['cricket', 'cricket', 'creak'] },
  hoh: { air: [300, 0.01], every: [5, 9], sounds: ['creak'] },
  dr: { air: [200, 0.006], every: [8, 12], sounds: [] },
};
let room = null;   // { name, src, gain, timer }
export function startRoom(name) {
  const R = ROOMS[name] || ROOMS.ceremony;
  if (room?.name === name) return;
  stopRoom();
  if (!voicesOn()) return;
  const out = engine.output?.();
  if (!out) return;
  const { ctx: c, dest } = out;
  try {
    const src = c.createBufferSource(); src.buffer = noiseBuffer(c, 3); src.loop = true;
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = R.air[0];
    const gain = c.createGain(); gain.gain.setValueAtTime(0.0001, c.currentTime); gain.gain.exponentialRampToValueAtTime(R.air[1], c.currentTime + 0.8);
    src.connect(lp); lp.connect(gain); gain.connect(dest); src.start();
    room = { name, src, gain, timer: null };
    const next = () => {
      if (!room || room.name !== name) return;
      const o = engine.output?.();
      const pick = R.sounds[Math.floor(Math.random() * R.sounds.length)];
      if (o && pick) {
        const now = o.ctx.currentTime;
        try {
          if (pick === 'clink') { tone(o.ctx, o.dest, now, { f: 2600 + Math.random() * 900, dur: 0.18, vol: 0.02, type: 'triangle' }); tone(o.ctx, o.dest, now + 0.05, { f: 3900, dur: 0.12, vol: 0.012 }); }
          if (pick === 'tap') tone(o.ctx, o.dest, now, { f: 180, dur: 0.06, vol: 0.02, type: 'triangle' });
          if (pick === 'pour') noiseBurst(o.ctx, o.dest, now, { dur: 0.6, f: 1800, vol: 0.012 });
          if (pick === 'murmur') for (let i = 0; i < 4; i++) tone(o.ctx, o.dest, now + i * 0.11, { f: 180 + Math.random() * 120, dur: 0.1, vol: 0.008, type: 'sawtooth' });
          if (pick === 'creak') tone(o.ctx, o.dest, now, { f: 140, to: 95, dur: 0.35, vol: 0.01, type: 'sawtooth' });
          if (pick === 'bird') { const f = 2800 + Math.random() * 1400; for (let i = 0; i < 3; i++) tone(o.ctx, o.dest, now + i * 0.09, { f, to: f * 1.3, dur: 0.07, vol: 0.015 }); }
          if (pick === 'water') noiseBurst(o.ctx, o.dest, now, { dur: 0.9, f: 900, vol: 0.01 });
          if (pick === 'cricket') for (let i = 0; i < 5; i++) tone(o.ctx, o.dest, now + i * 0.05, { f: 4300, dur: 0.03, vol: 0.008, type: 'square' });
        } catch { /* the room must never break the player */ }
      }
      room.timer = setTimeout(next, (R.every[0] + Math.random() * (R.every[1] - R.every[0])) * 1000);
    };
    room.timer = setTimeout(next, 900);
  } catch { room = null; }
}
export function stopRoom() {
  if (!room) return;
  try { clearTimeout(room.timer); const c = room.gain.context; room.gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.4); room.src.stop(c.currentTime + 0.5); } catch { /* already stopped */ }
  room = null;
}
if (typeof document !== 'undefined') { document.addEventListener('vp:close', stopRoom); document.addEventListener('vp:screen', stopRoom); }

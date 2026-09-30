// ══════════════════════════════════════════════════════════════════════
// vp-ci/sound.js — the sound of the Circle (Plan 5, spec 18.3)
// ══════════════════════════════════════════════════════════════════════
//
// BEDS: one music bed per kind of scene, the user's own tracks in
// assets/audio/circle/ (the list to download: docs/the-circle-music.md). A
// bed whose file is not there yet plays silence (js/audio.js), never a pad.
//
// STINGS: one per moment (ALERT!, a message sent, BLOCKED, the crown, the
// knock, play on the goodbye video, the winner). Each plays the user's file
// from assets/audio/circle/sfx/ once it is there; until then a synthesised
// sting stands in, so the show has sound from the start.
//
// WHEN is read off the step (its block key and its part), the same way the
// stages draw: a step can never sound like something that is not on screen.
// Only a click plays a sting: Reveal all and a fresh paint are silent.
import { BED_CATALOG, CUE_CATALOG } from '../audio.js';

// ── beds ───────────────────────────────────────────────────────────────
const dir = 'assets/audio/circle/';
export const CI_BEDS = {
  'ci-morning':     { file: `${dir}morning.mp3`,      volume: 0.40, what: 'the day starts: bright, easy, a little cheeky' },
  'ci-apartment':   { file: `${dir}apartment.mp3`,    volume: 0.36, what: 'private chats and apartment life: light pop, lo-fi' },
  'ci-circle-chat': { file: `${dir}circle-chat.mp3`,  volume: 0.38, what: 'Circle Chat, statuses, the Newsfeed: upbeat, social' },
  'ci-scheming':    { file: `${dir}scheming.mp3`,     volume: 0.36, what: 'plots, lies, watching in secret: sneaky pizzicato suspense' },
  'ci-drama':       { file: `${dir}drama.mp3`,        volume: 0.40, what: 'a face they know, an accusation: tense, dramatic' },
  'ci-arrival':     { file: `${dir}arrival.mp3`,      volume: 0.40, what: 'meet the players, a new player: curious, stylish' },
  'ci-game':        { file: `${dir}game.mp3`,         volume: 0.38, what: 'a Circle game: playful, game-show energy' },
  'ci-party':       { file: `${dir}party.mp3`,        volume: 0.42, what: 'a party: a dance track' },
  'ci-ratings':     { file: `${dir}ratings.mp3`,      volume: 0.40, what: 'the ratings: a slow build, pulse and pads' },
  'ci-results':     { file: `${dir}results.mp3`,      volume: 0.42, what: 'the results read out: suspense, ticking' },
  'ci-hangout':     { file: `${dir}hangout.mp3`,      volume: 0.38, what: 'the Influencers decide: tense, deliberate' },
  'ci-blocking':    { file: `${dir}blocking.mp3`,     volume: 0.44, what: 'the blocking: dark drone, heartbeat' },
  'ci-after-block': { file: `${dir}after-block.mp3`,  volume: 0.38, what: 'right after BLOCKED: shock, sad piano' },
  'ci-visit':       { file: `${dir}visit.mp3`,        volume: 0.40, what: 'the hallway and the door: anticipation' },
  'ci-goodbye':     { file: `${dir}goodbye.mp3`,      volume: 0.36, what: 'the goodbye video: emotional, warm' },
  'ci-finale':      { file: `${dir}finale.mp3`,       volume: 0.42, what: 'the final ratings and the studio: epic build' },
  'ci-meet':        { file: `${dir}meet.mp3`,         volume: 0.38, what: 'finalists meeting in person: emotional reunion' },
  'ci-winner':      { file: `${dir}winner.mp3`,       volume: 0.46, what: 'the winner: celebration' },
};
for (const [name, bed] of Object.entries(CI_BEDS)) BED_CATALOG[name] = { build: null, file: bed.file, volume: bed.volume };

const BED_BY_KIND = {
  profiles: 'ci-arrival', arrival: 'ci-arrival', 'pair-arrival': 'ci-arrival', chosen: 'ci-arrival', newparty: 'ci-party',
  chat: 'ci-apartment', date: 'ci-apartment', life: 'ci-apartment', 'home-video': 'ci-goodbye', 'after-party': 'ci-apartment',
  'circle-chat': 'ci-circle-chat', status: 'ci-circle-chat', likes: 'ci-circle-chat', invites: 'ci-circle-chat', race: 'ci-circle-chat',
  report: 'ci-scheming', lurk: 'ci-scheming', hack: 'ci-scheming', 'hack-undone': 'ci-scheming', 'joker-chat': 'ci-scheming',
  'joker-pick': 'ci-scheming', mission: 'ci-scheming', 'burner-exposed': 'ci-drama', recognise: 'ci-drama', disrupter: 'ci-game',
  game: 'ci-game', party: 'ci-party', egg: 'ci-game',
  ratings: 'ci-ratings', 'final-ratings': 'ci-finale', hangout: 'ci-hangout', save: 'ci-hangout', offer: 'ci-hangout',
  plead: 'ci-hangout', vote: 'ci-hangout', statement: 'ci-hangout', antivirus: 'ci-blocking',
  blocking: 'ci-blocking', 'no-block': 'ci-morning', visit: 'ci-visit', goodbye: 'ci-goodbye',
  meet: 'ci-meet', reveal: 'ci-finale', 'power-reveal': 'ci-drama', swap: 'ci-drama', 'swap-back': 'ci-drama', clone: 'ci-drama',
  'ride-or-die': 'ci-hangout', sacrifice: 'ci-drama', 'second-chance': 'ci-drama', alert: 'ci-drama',
};
/** The bed a screen opens on. */
export const bedFor = screen => BED_BY_KIND[screen?.kind] || 'ci-apartment';

// ── stings ─────────────────────────────────────────────────────────────
function tone(ctx, dest, now, { type = 'sine', f0, f1, dur, peak = 0.25, at = 0 }) {
  const o = ctx.createOscillator(), g = ctx.createGain(), t = now + at;
  o.type = type; o.frequency.setValueAtTime(f0, t);
  if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(dest); o.start(t); o.stop(t + dur + 0.03);
}
function hiss(ctx, dest, now, { dur, peak = 0.2, cutoff = 1200, type = 'lowpass', at = 0 }) {
  const len = Math.max(1, Math.floor(ctx.sampleRate * dur)), buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain(), t = now + at;
  src.buffer = buf; f.type = type; f.frequency.setValueAtTime(cutoff, t);
  g.gain.setValueAtTime(peak, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f); f.connect(g); g.connect(dest); src.start(t); src.stop(t + dur + 0.03);
}
const sfx = name => `${dir}sfx/${name}.mp3`;
export const CI_STINGS = {
  'ci-alert':   { file: sfx('alert'),   what: 'ALERT! lands: a bright electronic sting', synth: (c, d, n) => { tone(c, d, n, { type: 'sawtooth', f0: 220, f1: 880, dur: 0.35, peak: 0.16 }); [880, 1320].forEach((f, i) => tone(c, d, n, { type: 'square', f0: f, dur: 0.18, peak: 0.1, at: 0.32 + i * 0.12 })); } },
  'ci-send':    { file: sfx('send'),    what: 'a message sent: a soft whoosh', synth: (c, d, n) => hiss(c, d, n, { dur: 0.3, peak: 0.12, cutoff: 2400, type: 'bandpass', at: 1.25 }) },
  'ci-message': { file: sfx('message'), what: 'a message lands: a chime', synth: (c, d, n) => { tone(c, d, n, { f0: 1175, dur: 0.14, peak: 0.12 }); tone(c, d, n, { f0: 1568, dur: 0.22, peak: 0.1, at: 0.09 }); } },
  'ci-typing':  { file: sfx('typing'),  what: 'somebody is typing: soft key taps', synth: (c, d, n) => { for (let i = 0; i < 6; i++) hiss(c, d, n, { dur: 0.03, peak: 0.08, cutoff: 3000, type: 'highpass', at: i * 0.13 }); } },
  'ci-blocked': { file: sfx('blocked'), what: 'BLOCKED: a deep hit and a glitch', synth: (c, d, n) => { tone(c, d, n, { f0: 90, f1: 35, dur: 1.1, peak: 0.4 }); hiss(c, d, n, { dur: 0.5, peak: 0.25, cutoff: 600 }); tone(c, d, n, { type: 'square', f0: 140, f1: 70, dur: 0.25, peak: 0.08, at: 0.05 }); } },
  'ci-tick':    { file: sfx('tick'),    what: 'a name put in a ranking slot: a click', synth: (c, d, n) => tone(c, d, n, { type: 'triangle', f0: 1400, f1: 900, dur: 0.08, peak: 0.12 }) },
  'ci-reveal':  { file: sfx('reveal'),  what: 'a place on the board: a drum hit', synth: (c, d, n) => { tone(c, d, n, { f0: 110, f1: 55, dur: 0.5, peak: 0.3 }); hiss(c, d, n, { dur: 0.15, peak: 0.1, cutoff: 500 }); } },
  'ci-crown':   { file: sfx('crown'),   what: 'the Influencers crowned: a rising shimmer', synth: (c, d, n) => [523, 659, 784, 1047, 1319].forEach((f, i) => tone(c, d, n, { type: 'triangle', f0: f, dur: 0.5, peak: 0.13, at: i * 0.07 })) },
  'ci-door':    { file: sfx('door'),    what: 'a knock on the door, the door opening', synth: (c, d, n) => { [0, 0.18, 0.5].forEach(at => tone(c, d, n, { f0: 150, f1: 90, dur: 0.12, peak: 0.35, at })); hiss(c, d, n, { dur: 0.6, peak: 0.08, cutoff: 800, at: 0.8 }); } },
  'ci-play':    { file: sfx('play'),    what: 'play on the goodbye video: a blip and tape start', synth: (c, d, n) => { tone(c, d, n, { f0: 660, dur: 0.1, peak: 0.12 }); tone(c, d, n, { f0: 990, dur: 0.18, peak: 0.1, at: 0.1 }); } },
  'ci-winner':  { file: sfx('winner'),  what: 'the winner named: a fanfare', synth: (c, d, n) => [392, 523, 659, 784, 1047].forEach((f, i) => tone(c, d, n, { type: 'sawtooth', f0: f, dur: 0.7, peak: 0.12, at: i * 0.1 })) },
  'ci-whoosh':  { file: sfx('whoosh'),  what: 'a player walks in: a stylish swish', synth: (c, d, n) => hiss(c, d, n, { dur: 0.45, peak: 0.14, cutoff: 1400, type: 'bandpass' }) },
  'ci-gasp':    { file: sfx('gasp'),    what: 'a drama sting (a face they know, an accusation)', synth: (c, d, n) => { tone(c, d, n, { type: 'sawtooth', f0: 311, dur: 0.6, peak: 0.1 }); tone(c, d, n, { type: 'sawtooth', f0: 330, dur: 0.6, peak: 0.1 }); } },
};
// A sting prefers its file; the file loads the first time the sting is asked for.
const buffers = {};
const loading = {};
function loadSting(ctx, name) {
  if (loading[name] || typeof fetch !== 'function') return;
  loading[name] = true;
  fetch(CI_STINGS[name].file).then(r => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); })
    .then(b => ctx.decodeAudioData(b)).then(buf => { buffers[name] = buf; }).catch(() => { /* no file yet: the synth stands in */ });
}
for (const [name, s] of Object.entries(CI_STINGS)) {
  CUE_CATALOG[name] = { duck: true, build(ctx, dest, now) {
    if (buffers[name]) { const src = ctx.createBufferSource(); src.buffer = buffers[name]; src.connect(dest); src.start(now); return; }
    loadSting(ctx, name);
    s.synth(ctx, dest, now);
  } };
}

// ── what this step sounds like ─────────────────────────────────────────
const NAMED = /^(block\.announce\.|vote\.result|block\.inperson\.tell)/;
/** { cue, bed }: the sting for step `idx` of this screen, and a bed change if the music turns here. */
export function soundFor(screen, idx) {
  const st = screen?.steps?.[idx];
  if (!st) return { cue: null, bed: null };
  const k = st.key || '';
  const first = i => screen.steps.findIndex(x => i.test(x.key || '')) === idx;
  if (screen.stage === 'alert' && idx === 0) return { cue: 'ci-alert', bed: null };
  if (screen.kind === 'blocking') {
    if (NAMED.test(k) && first(NAMED)) return { cue: 'ci-blocked', bed: 'ci-after-block' };
    if (k === 'block.typing') return { cue: 'ci-typing', bed: null };
  }
  if (screen.stage === 'rate') {
    if (k === 'result.influencers' || k === 'result.sole' || k === 'result.super' || k === 'result.secret') return { cue: 'ci-crown', bed: null };
    if (/^result\./.test(k) && st === screen.steps.find(x => x.key === k && x.on?.a === st.on?.a)) return { cue: 'ci-reveal', bed: screen.kind === 'ratings' && first(/^result\./) ? 'ci-results' : null };
    if (/^(rate|final\.rate)\./.test(k)) return { cue: 'ci-tick', bed: null };
  }
  if (screen.kind === 'reveal') {
    if (k === 'reveal.winner' && st.host) return { cue: 'ci-winner', bed: 'ci-winner' };
    if (k === 'reveal.place' && st.host) return { cue: 'ci-reveal', bed: null };
  }
  if (screen.kind === 'visit' && first(/^visit\.(door|sit)/)) return { cue: 'ci-door', bed: null };
  if (screen.kind === 'goodbye' && st.part === 'video' && screen.steps.findIndex(x => x.part === 'video') === idx) return { cue: 'ci-play', bed: null };
  if (screen.stage === 'arrive' && st.entry && st.about && st.who === st.about) return { cue: 'ci-whoosh', bed: null };
  if ((screen.kind === 'recognise' && idx === 0) || (k === 'circle.theory' && screen.steps.findIndex(x => x.key === k) === idx)) return { cue: 'ci-gasp', bed: null };
  if (st.part === 'send') return { cue: 'ci-send', bed: null };
  if (st.part === 'post' || st.part === 'video') return { cue: 'ci-message', bed: null };
  return { cue: null, bed: null };
}

/** Play what this step sounds like (a click only; never on Reveal all). */
export function playStep(screen, idx) {
  const a = typeof window !== 'undefined' ? window.audio : null;
  if (!a || typeof a.sfx !== 'function') return;
  const { cue, bed } = soundFor(screen, idx);
  try {
    if (bed && typeof a.ambient === 'function') a.ambient(bed);
    if (cue) a.sfx(cue);
  } catch { /* sound must never break a screen */ }
}

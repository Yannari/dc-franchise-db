// ══════════════════════════════════════════════════════════════════════
// vp-td-ep/sound.js — the set's sound: ambience from the live layer, effects for the moments
// ══════════════════════════════════════════════════════════════════════
// The music beds stay the classic viewer's (js/vp-ui.js picks them by screen id). This adds
// what was missing (the user, 2026-10-07: "we already have music … but not sound yet like
// sfx"), synthesized live with Web Audio — nothing to download — through the shared engine's
// output, so it obeys the same mute and volume as every other cue (js/audio.js output()).
import { audio as engine } from '../audio.js';

let amb = null, key = '', timers = [];
let silent = false;   // tdVoiceRecord plays a whole episode at speed: no sound while it does
const out = () => { if (silent) return null; try { return engine.output(); } catch { return null; } };

let _noise = null;
function noiseBuf(ctx) {
  if (_noise && _noise.sampleRate === ctx.sampleRate) return _noise;
  const b = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate); const d = b.getChannelData(0); let last = 0;
  for (let i = 0; i < d.length; i++) { const w = Math.random() * 2 - 1; last = (last + .02 * w) / 1.02; d[i] = i % 2 ? w : last * 3.5; }
  return (_noise = b);
}

// ── THE VENUE'S SOUNDSCAPE ────────────────────────────────────────────
// Camp plays no music (the user, 2026-10-07: "change the music of camp every day to something more
// ambience like forest sound… depending of what venue we are"): each venue has its own world of
// sound, and each day its own weather in it. sc: { venue, night, weather, open (outdoors),
// shore (water in shot) }. Weather: calm | breezy | birdsong | hot | overcast.
function scape(ctx, dest, sc, { noise, filt, gain, every, lfo }) {
  const W = sc.weather || 'calm';
  const at = (f, t) => f.setValueAtTime ? f : f;
  // a voice that sweeps: one bird note, one loon, one gull
  const tone = (f0, f1, dur, v, type = 'sine', when = 0) => {
    const t = ctx.currentTime + when, o = ctx.createOscillator(), e = gain(0); o.type = type; o.connect(e); e.connect(dest);
    o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(f1, 20), t + dur);
    e.gain.linearRampToValueAtTime(v, t + Math.min(.03, dur / 4)); e.gain.setValueAtTime(v, t + dur * .7); e.gain.exponentialRampToValueAtTime(.0008, t + dur);
    o.start(t); o.stop(t + dur + .05);
  };
  const burst = (f, q, dur, v, type = 'bandpass', when = 0) => {
    const t = ctx.currentTime + when, n = noise(), fl = filt(type, f, q), e = gain(0); n.connect(fl); fl.connect(e); e.connect(dest);
    e.gain.linearRampToValueAtTime(v, t + .005); e.gain.exponentialRampToValueAtTime(.0008, t + dur); n.start(t); n.stop(t + dur + .05);
  };
  // wind: a low swell, stronger on a breezy day, in the treetops (higher) in a forest
  const wind = (f, v) => { const s = noise(), bp = filt('bandpass', f, .35), g = gain(0); s.connect(bp); bp.connect(g); g.connect(dest); s.start(); lfo(g.gain, .05 + Math.random() * .04, v * .6, v); };
  // songbirds: a chickadee's two notes, a trill, a warbler run
  const songbird = () => {
    const k = Math.random();
    if (k < .35) { tone(3950, 3900, .22, .02); tone(3300, 3250, .3, .02, 'sine', .28); }
    else if (k < .7) { const f = 3000 + Math.random() * 1500; for (let i = 0; i < 7; i++) tone(f, f * 1.15, .05, .016, 'sine', i * .065); }
    else { const f = 2400 + Math.random() * 800; for (let i = 0; i < 4; i++) tone(f + i * 260, f + i * 260 + 400, .09, .017, 'sine', i * .11); }
  };
  const crickets = (v = .009) => [4300, 4720].forEach((f, k) => {
    const o = ctx.createOscillator(), am = gain(0), g2 = gain(0); o.frequency.value = f; o.connect(am); am.connect(g2); g2.connect(dest); o.start();
    const p = ctx.createOscillator(); p.type = 'square'; p.frequency.value = 28 + k * 3; const pg = gain(.5); p.connect(pg); pg.connect(am.gain); p.start();
    every(() => { const t = ctx.currentTime; g2.gain.setTargetAtTime(v, t, .02); g2.gain.setTargetAtTime(0, t + .35 + Math.random() * .3, .03); }, 700 + k * 230, 1300 + k * 300);
  });
  const lapping = v => every(() => burst(380 + Math.random() * 200, 1.2, .5 + Math.random() * .5, v, 'lowpass'), 900, 2600);
  // a wave: the swell rises and brightens as it breaks, then the wash runs back up the sand with a
  // fizz on top; one every few seconds, overlapping, over a low rumble of the sea further out
  const waves = (v, slow = 1) => {
    { const s = noise(), lp = filt('lowpass', 150), g = gain(v * .22); s.connect(lp); lp.connect(g); g.connect(dest); s.start(); }
    every(() => {
      const t = ctx.currentTime, up = (1.3 + Math.random() * .9) * slow, down = (3 + Math.random() * 1.8) * slow, pk = v * (.65 + Math.random() * .5);
      const n = noise(), lp = filt('lowpass', 240, .5), e = gain(0); n.connect(lp); lp.connect(e); e.connect(dest);
      lp.frequency.setValueAtTime(240, t); lp.frequency.exponentialRampToValueAtTime(900 + Math.random() * 600, t + up); lp.frequency.exponentialRampToValueAtTime(260, t + up + down);
      e.gain.setValueAtTime(0, t); e.gain.linearRampToValueAtTime(pk, t + up); e.gain.exponentialRampToValueAtTime(.0005, t + up + down); n.start(t); n.stop(t + up + down + .1);
      const n2 = noise(), bp = filt('bandpass', 3000, .6), e2 = gain(0); n2.connect(bp); bp.connect(e2); e2.connect(dest);
      e2.gain.setValueAtTime(0, t + up * .8); e2.gain.linearRampToValueAtTime(pk * .16, t + up + .35); e2.gain.exponentialRampToValueAtTime(.0005, t + up + down * .8); n2.start(t + up * .8); n2.stop(t + up + down);
    }, 4200 * slow, 7800 * slow);
  };
  const thunderFar = () => every(() => burst(90, .7, 3.5, .14, 'lowpass'), 25000, 60000);
  const busy = { sunny: 1.7, calm: 1, breezy: 1, birdsong: 2.2, hot: .6, overcast: .35, rain: .05, storm: 0, fog: .3 }[W] ?? 1;
  const windy = { sunny: .01, calm: .012, breezy: .04, birdsong: .012, hot: .008, overcast: .026, rain: .02, storm: .07, fog: .005 }[W] ?? .015;

  if (!sc.open) {
    // indoors: the room tone, and the weather faintly through the walls; rain drums on the roof
    if (W === 'rain' || W === 'storm') { const s = noise(), lp = filt('lowpass', 900), g = gain(W === 'storm' ? .06 : .04); s.connect(lp); lp.connect(g); g.connect(dest); s.start();
      every(() => burst(1400 + Math.random() * 900, 3, .03, .02, 'bandpass'), 40, 160);
      if (W === 'storm') every(() => burst(80, .7, 3.0, .2, 'lowpass'), 12000, 26000); }
    if (W === 'breezy' || W === 'overcast') wind(300, .008);
    if (!sc.night && sc.venue !== 'world-tour' && W !== 'overcast') every(songbird, 6000 / busy, 15000 / busy);
    if (sc.night) crickets(.003);
    if (sc.venue === 'world-tour') { const s = noise(), lp = filt('lowpass', 140), g = gain(.07); s.connect(lp); lp.connect(g); g.connect(dest); s.start(); const s2 = noise(), bp = filt('bandpass', 1200, .4), g2 = gain(.012); s2.connect(bp); bp.connect(g2); g2.connect(dest); s2.start();
      every(() => { tone(880, 880, .5, .03); tone(660, 660, .7, .03, 'sine', .45); }, 40000, 90000); }
    return;
  }
  if (sc.venue === 'hosted-camp') {
    // a lake in the northern woods: wind in the pines, songbirds, a woodpecker, the loon at dusk
    wind(sc.night ? 260 : 420, windy);
    if (sc.shore) lapping(.03);
    if (sc.night) {
      crickets(); every(() => { tone(420, 400, .35, .03, 'sine'); tone(380, 360, .6, .03, 'sine', .45); }, 9000, 22000);   // the owl
      every(() => { for (let i = 0; i < 2 + Math.floor(Math.random() * 3); i++) burst(600, 3, .08, .03, 'bandpass', i * .12); }, 2500, 6000);   // frogs
    } else {
      every(songbird, 1400 / busy, 4800 / busy);
      every(() => { for (let i = 0; i < 9; i++) burst(1800, 2, .03, .05, 'bandpass', i * .055); }, 14000, 32000);   // woodpecker
      if (W !== 'hot') every(() => { tone(700, 1050, .9, .025, 'triangle'); tone(1050, 900, 1.1, .022, 'triangle', .9); }, 26000, 60000);   // the loon
    }
  } else if (sc.venue === 'survival-island') {
    // Soluna: the sea and the palms, nothing else (the user, 2026-10-11: no parrots, gulls or cicadas,
    // and the old surf, one steady hiss, "isn't good enough"): waves that break and wash back
    waves(sc.shore ? .11 : .06, sc.night ? 1.3 : 1); wind(900, windy * .6);
    if (sc.night) crickets(.004);
  } else if (sc.venue === 'film-lot') {
    // the backlot: the city beyond the fence, a generator, a far plane, sprinklers by day, a dog at night
    { const s = noise(), lp = filt('lowpass', 220), g = gain(.035); s.connect(lp); lp.connect(g); g.connect(dest); s.start(); }
    { const o = ctx.createOscillator(), g = gain(.006); o.type = 'sawtooth'; o.frequency.value = 60; const lp = filt('lowpass', 200); o.connect(lp); lp.connect(g); g.connect(dest); o.start(); }
    every(() => burst(400, .5, 6, .05, 'lowpass'), 30000, 70000);   // a plane over the lot
    if (sc.night) { crickets(.006); every(() => { tone(520, 380, .12, .03, 'square'); tone(520, 380, .12, .03, 'square', .25); }, 20000, 50000); }
    else { every(() => { for (let i = 0; i < 12; i++) burst(3500, 3, .04, .02, 'bandpass', i * .09); }, 12000, 30000); every(songbird, 6000 / busy, 16000 / busy); }
  } else if (sc.venue === 'world-tour') {
    // on the ground at a destination the plane's drone is still there, far off
    { const s = noise(), lp = filt('lowpass', 160), g = gain(.03); s.connect(lp); lp.connect(g); g.connect(dest); s.start(); }
    wind(700, windy);
    if (sc.night) crickets(.006); else every(songbird, 4000 / busy, 12000 / busy);
  } else if (sc.venue === 'carnival') {
    // Stawaki: the woods round an empty carnival: wind, crows, a creaking ride, the midway's far hum
    wind(sc.night ? 240 : 380, windy * 1.2);
    { const s = noise(), bp = filt('bandpass', 650, .8), g = gain(0); s.connect(bp); bp.connect(g); g.connect(dest); s.start(); lfo(g.gain, .3, .004, .008); }
    every(() => { const t = 220 + Math.random() * 120; tone(t, t * .8, 1.2, .015, 'sawtooth'); }, 9000, 22000);   // a ride creaks
    if (sc.night) { crickets(.008); every(() => tone(380, 360, .6, .025), 12000, 30000); }
    else every(() => { for (let i = 0; i < 3; i++) tone(560, 420, .22, .03, 'sawtooth', i * .3); }, 8000 / busy, 20000 / busy);   // crows
    if (sc.shore) lapping(.025);
  } else {
    wind(400, windy);
    if (sc.night) crickets(); else every(songbird, 2000 / busy, 6000 / busy);
  }
  if (W === 'overcast' || W === 'rain') thunderFar();
}

function build(ctx, dest, spec) {
  const noise = () => { const s = ctx.createBufferSource(); s.buffer = noiseBuf(ctx); s.loop = true; s.loopStart = Math.random(); return s; };
  const filt = (type, f, q = .7) => { const n = ctx.createBiquadFilter(); n.type = type; n.frequency.value = f; n.Q.value = q; return n; };
  const gain = v => { const g = ctx.createGain(); g.gain.value = v; return g; };
  const every = (fn, lo, hi) => { const tick = () => { fn(); timers.push(setTimeout(tick, lo + Math.random() * (hi - lo))); }; timers.push(setTimeout(tick, Math.random() * hi)); };
  const lfo = (param, rate, depth, base) => { const o = ctx.createOscillator(); o.frequency.value = rate; const g = gain(depth); o.connect(g); g.connect(param); param.value = base; o.start(); };
  if (spec.scape) scape(ctx, dest, spec.scape, { noise, filt, gain, every, lfo });
  if (spec.fire) {
    const s = noise(), bp = filt('bandpass', 900, .5), g = gain(.04 + .015 * Math.min(spec.fire, 4)); s.connect(bp); bp.connect(g); g.connect(dest); s.start();
    // the crackle, soft and rounded (it was a hard tick every 50-280ms, heard as a click under everything)
    every(() => { const t = ctx.currentTime, n = noise(), bp = filt('bandpass', 1800 + Math.random() * 1400, .9), e = gain(0); n.connect(bp); bp.connect(e); e.connect(dest);
      e.gain.setValueAtTime(0, t); e.gain.linearRampToValueAtTime(.03 + Math.random() * .04, t + .006); e.gain.exponentialRampToValueAtTime(.001, t + .05 + Math.random() * .06); n.start(t); n.stop(t + .14); }, 160, 900);
  }
  if (spec.water) {
    const s = noise(), lp = filt('lowpass', 420), g = gain(0); s.connect(lp); lp.connect(g); g.connect(dest); s.start(); lfo(g.gain, .16, .04, .055);
  }
  if (spec.outdoor) {
    const s = noise(), bp = filt('bandpass', 380, .4), g = gain(0); s.connect(bp); bp.connect(g); g.connect(dest); s.start(); lfo(g.gain, .07, .02, .03);
    if (spec.night) {
      [4300, 4720].forEach((f, k) => { const o = ctx.createOscillator(), am = gain(0), g2 = gain(0); o.frequency.value = f; o.connect(am); am.connect(g2); g2.connect(dest); o.start();
        const p = ctx.createOscillator(); p.type = 'square'; p.frequency.value = 28 + k * 3; const pg = gain(.5); p.connect(pg); pg.connect(am.gain); p.start();
        every(() => { const t = ctx.currentTime; g2.gain.setTargetAtTime(.01, t, .02); g2.gain.setTargetAtTime(0, t + .35 + Math.random() * .3, .03); }, 700 + k * 230, 1300 + k * 300); });
    } else {
      every(() => { const t0 = ctx.currentTime, n = 2 + Math.floor(Math.random() * 4), f = 2600 + Math.random() * 1800;
        for (let i = 0; i < n; i++) { const t = t0 + i * (.09 + Math.random() * .05), o = ctx.createOscillator(), e = gain(0); o.connect(e); e.connect(dest);
          o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * (1.3 + Math.random() * .4), t + .06); e.gain.linearRampToValueAtTime(.035, t + .01); e.gain.exponentialRampToValueAtTime(.001, t + .08); o.start(t); o.stop(t + .1); } }, 1600, 5200);
    }
  }
  if (spec.rain) {
    // the rain on Rescue Island: a hiss, drops on leaves, a far roll of thunder now and then
    const s = noise(), hp = filt('highpass', 1400), lp = filt('lowpass', 7000), g = gain(.07); s.connect(hp); hp.connect(lp); lp.connect(g); g.connect(dest); s.start();
    every(() => { const t = ctx.currentTime, n = noise(), bp = filt('bandpass', 2500 + Math.random() * 2500, 4), e = gain(0); n.connect(bp); bp.connect(e); e.connect(dest);
      e.gain.setValueAtTime(.05 + Math.random() * .06, t); e.gain.exponentialRampToValueAtTime(.001, t + .02); n.start(t); n.stop(t + .05); }, 30, 140);
    if (spec.storm) every(() => { const t = ctx.currentTime, n = noise(), lp2 = filt('lowpass', 120), e = gain(0); n.connect(lp2); lp2.connect(e); e.connect(dest);
      e.gain.linearRampToValueAtTime(.35, t + .4); e.gain.exponentialRampToValueAtTime(.001, t + 3.2); n.start(t); n.stop(t + 3.3); }, 9000, 20000);
  }
  if (spec.indoor) { const s = noise(), lp = filt('lowpass', 180), g = gain(.045); s.connect(lp); lp.connect(g); g.connect(dest); s.start(); }
  if (spec.crowd) { const s = noise(), bp = filt('bandpass', 700, .8), g = gain(.018); s.connect(bp); bp.connect(g); g.connect(dest); s.start(); lfo(g.gain, .4, .006, .018); }
}

// The mix (the user, 2026-10-11: "the ambience shouldn't be too strong, we wanna hear the voices …
// if you're mixing ambience with real music, the music is more important"): the place sits low on its
// own, far lower under a music bed, and dips again for as long as somebody is talking.
// Every recording is first brought to -20 dBFS RMS (normOf), so these are the levels it is heard at:
// about -48 dB alone (measured), 11 dB lower under a bed (the beds play near -26 dB, the voices too),
// and 5 dB lower again while someone talks.
const AMB_ALONE = .12, AMB_UNDER_MUSIC = .035, AMB_UNDER_VOICE = .55;
let talkUntil = 0;
const ambBase = () => (engine._currentBed ? AMB_UNDER_MUSIC : AMB_ALONE);
function ambLevel() {
  if (!amb) return;
  const ctx = amb.context, now = ctx.currentTime, base = ambBase();
  amb.gain.cancelScheduledValues(now); amb.gain.setTargetAtTime(talkUntil > now ? base * AMB_UNDER_VOICE : base, now, .25);
  if (talkUntil > now) amb.gain.setTargetAtTime(base, talkUntil, .4);
}
// the music bed is chosen after the screen paints (vp-ui.js), and announced with vp:screen
if (typeof document !== 'undefined') document.addEventListener('vp:screen', () => setTimeout(ambLevel, 60));

// ── THE RECORDINGS ────────────────────────────────────────────────────
// assets/audio/td/ (the user's downloads, 2026-10-11; sources and the CC BY credit in its CREDITS.md):
// ambience loops per venue, the effects, and the dialogue blips. A file that fails to load falls back
// to the synthesized sound above, so a missing file is never silence.
const TD_AUDIO = 'assets/audio/td/';
const bufs = {};
// the gain that brings a file to -20 dBFS RMS, held so its peak stays under -1 dBFS
function normOf(b) {
  let sum = 0, n = 0, peak = 0;
  for (let c = 0; c < b.numberOfChannels; c++) { const d = b.getChannelData(c); for (let i = 0; i < d.length; i += 5) { const x = d[i]; sum += x * x; n++; if (x > peak) peak = x; else if (-x > peak) peak = -x; } }
  const rms = Math.sqrt(sum / Math.max(n, 1)) || 1e-4;
  return Math.min(10 ** ((-20 - 20 * Math.log10(rms)) / 20), .89 / Math.max(peak, 1e-4));
}
function loadBuf(ctx, path) {
  // the voice test's files change between renders: never from the browser's cache
  if (!bufs[path]) bufs[path] = fetch(TD_AUDIO + path, path.startsWith('vo-test/') ? { cache: 'no-store' } : undefined).then(r => r.ok ? r.arrayBuffer() : Promise.reject(r.status))
    .then(a => ctx.decodeAudioData(a)).then(b => ({ b, norm: normOf(b) })).catch(() => null);
  return bufs[path];
}
const AMB_VENUE = { 'hosted-camp': 'camp', 'survival-island': 'island', 'film-lot': 'filmlot', carnival: 'carnival' };
// which loops a place plays: one bed for where we are, then the fire and the rain over it
function ambFiles(spec) {
  const sc = spec.scape, part = (file, level = 1) => ({ file, level }), out = [];
  const outside = (venue, night) => `${AMB_VENUE[venue] || 'camp'}-${night ? 'night' : 'day'}`;
  if (sc) out.push(part(sc.venue === 'world-tour' && !sc.open ? 'worldtour' : !sc.open ? 'indoor' : outside(sc.venue, sc.night)));
  else if (spec.indoor || spec.flies) out.push(part('indoor'));
  else if (spec.outdoor || spec.rain || spec.water) out.push(part(outside('hosted-camp', spec.night)));
  if (spec.fire) out.push(part('campfire', .9));
  if (spec.rain) out.push(part('rain', spec.storm ? 1 : .8));
  return out;
}
let preloaded = false;
function preload(ctx) {
  if (preloaded) return; preloaded = true;
  Object.values(SFX_FILE).forEach(f => loadBuf(ctx, `sfx/${f}.ogg`));
  ['high', 'mid', 'low'].forEach(r => { for (let i = 1; i <= 6; i++) loadBuf(ctx, `voice/${r}-${i}.ogg`); });
}

/** The place's ambience. Called on every paint; rebuilt only when the place changes. */
export function ambience(spec) {
  const o = out();
  const k = o ? JSON.stringify(spec) : '';
  if (k === key) { ambLevel(); return; }
  key = k;
  timers.forEach(clearTimeout); timers = [];
  if (amb) { const old = amb, ctx = old.context; old.gain.setTargetAtTime(0, ctx.currentTime, .3); setTimeout(() => { (old._srcs || []).forEach(x => { try { x.stop(); } catch { /* done */ } }); try { old.disconnect(); } catch { /* gone */ } }, 1500); amb = null; }
  if (!o || !spec) return;
  const ctx = o.ctx, mine = amb = ctx.createGain(); mine._srcs = [];
  mine.gain.value = 0; mine.connect(o.dest); mine.gain.setTargetAtTime(ambBase(), ctx.currentTime, .6);
  preload(ctx);
  const parts = ambFiles(spec);
  Promise.all(parts.map(x => loadBuf(ctx, `amb/${x.file}.ogg`))).then(loaded => {
    if (amb !== mine) return;
    if (!loaded[0]) { const fb = ctx.createGain(); fb.gain.value = 7; fb.connect(mine); build(ctx, fb, spec); return; }   // the synth was mixed for a level 7x this one
    loaded.forEach((L, i) => {
      if (!L) return;
      const src = ctx.createBufferSource(), g = ctx.createGain(); src.buffer = L.b; src.loop = true; g.gain.value = L.norm * parts[i].level;
      src.connect(g); g.connect(mine); src.start(0, Math.random() * L.b.duration); mine._srcs.push(src);
    });
  });
}
export function stopAmbience() { ambience(null); }

// the moments with a recording, and how loud each sits against a -20 dB file (.5 = -26 dB, the beds' level)
const SFX_FILE = { static: 'confessional', slam: 'door-slam', anvil: 'anvil', bonk: 'bonk', boing: 'boing', 'fall-whistle': 'fall-whistle', 'record-scratch': 'record-scratch',
  horn: 'boat-horn', motor: 'motorboat', engine: 'bus-engine', rotor: 'helicopter', jetroar: 'jet', hiss: 'bus-door', splash: 'splash', thunder: 'thunder',
  torch: 'torch-light', snuff: 'torch-snuff', scribble: 'pencil', drop: 'ballot-drop', idol: 'idol', applause: 'applause', cheer: 'cheer', boo: 'boo', ring: 'phone-ring' };
const SFX_LEVEL = { engine: .32, motor: .32, rotor: .32, jetroar: .32, horn: .4, applause: .38, cheer: .38, boo: .32, scribble: .3, drop: .4, static: .4, torch: .4 };
/** A one-shot for a moment: the recording when there is one, else the synthesized cue. */
export function sfx(kind) {
  const o = out(); if (!o) return;
  if (!SFX_FILE[kind]) return synthSfx(kind);
  const ctx = o.ctx;
  loadBuf(ctx, `sfx/${SFX_FILE[kind]}.ogg`).then(L => {
    if (!L) return synthSfx(kind);
    const src = ctx.createBufferSource(), g = ctx.createGain(); src.buffer = L.b; g.gain.value = L.norm * (SFX_LEVEL[kind] ?? .5);
    src.connect(g); g.connect(o.dest); src.start();
  });
}
function synthSfx(kind) {
  const o = out(); if (!o) return;
  const ctx = o.ctx, t = ctx.currentTime, dest = o.dest;
  const gain = v => { const g = ctx.createGain(); g.gain.value = v; return g; };
  const blast = (f0, f1, dur, type = 'sine', v = .25) => { const os = ctx.createOscillator(), e = gain(0); os.type = type; os.connect(e); e.connect(dest); os.frequency.setValueAtTime(f0, t); os.frequency.exponentialRampToValueAtTime(f1, t + dur); e.gain.linearRampToValueAtTime(v, t + .01); e.gain.exponentialRampToValueAtTime(.001, t + dur); os.start(t); os.stop(t + dur + .05); };
  const hiss = (f, dur, v = .2, type = 'bandpass') => { const s = ctx.createBufferSource(); s.buffer = noiseBuf(ctx); const fl = ctx.createBiquadFilter(); fl.type = type; fl.frequency.value = f; const e = gain(0); s.connect(fl); fl.connect(e); e.connect(dest); e.gain.linearRampToValueAtTime(v, t + .01); e.gain.exponentialRampToValueAtTime(.001, t + dur); s.start(t); s.stop(t + dur + .05); };
  if (kind === 'static') { hiss(3000, .4, .2, 'highpass'); blast(60, 50, .3, 'square', .04); }
  else if (kind === 'whoosh') { const s = ctx.createBufferSource(); s.buffer = noiseBuf(ctx); const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 1.5; const e = gain(0); s.connect(bp); bp.connect(e); e.connect(dest); bp.frequency.setValueAtTime(300, t); bp.frequency.exponentialRampToValueAtTime(2400, t + .35); e.gain.linearRampToValueAtTime(.16, t + .12); e.gain.exponentialRampToValueAtTime(.001, t + .4); s.start(t); s.stop(t + .45); }
  else if (kind === 'slam') { blast(140, 40, .35, 'sine', .4); hiss(800, .25, .22); }
  else if (kind === 'slap') { hiss(1800, .08, .4, 'highpass'); blast(300, 120, .08, 'triangle', .18); }
  else if (kind === 'idol') { [392, 523, 659, 784].forEach((f, i) => setTimeout(() => { const tt = ctx.currentTime, os = ctx.createOscillator(), e = gain(0); os.type = 'triangle'; os.frequency.value = f; os.connect(e); e.connect(dest); e.gain.linearRampToValueAtTime(.16, tt + .02); e.gain.exponentialRampToValueAtTime(.001, tt + .7); os.start(tt); os.stop(tt + .75); }, i * 110)); blast(70, 40, .9, 'sine', .3); }
  else if (kind === 'out') { blast(220, 55, 1.1, 'sawtooth', .12); blast(110, 40, 1.2, 'sine', .3); }
  else if (kind === 'slip') { hiss(2400, .12, .14, 'bandpass'); }
  // the rides (about 4s, louder as it comes, fading as it goes): a voice through a filter, shaken by a pulse
  else if (['engine', 'motor', 'rotor', 'jetroar', 'wind'].includes(kind)) {
    const dur = kind === 'wind' ? 1.8 : 4.2;
    const e = gain(0), am = gain(.6), lf = ctx.createBiquadFilter(); lf.type = 'lowpass';
    am.connect(lf); lf.connect(e); e.connect(dest);
    const pulse = (hz, depth, type = 'sine') => { const o = ctx.createOscillator(), d = gain(depth); o.type = type; o.frequency.value = hz; o.connect(d); d.connect(am.gain); o.start(t); o.stop(t + dur); };
    const tone = (f0, f1, type) => { const o = ctx.createOscillator(); o.type = type; o.connect(am); o.frequency.setValueAtTime(f0, t); o.frequency.linearRampToValueAtTime(f1, t + dur * .45); o.frequency.linearRampToValueAtTime(f0 * .8, t + dur); o.start(t); o.stop(t + dur); };
    const air = () => { const n = ctx.createBufferSource(); n.buffer = noiseBuf(ctx); n.loop = true; n.connect(am); n.start(t); n.stop(t + dur); };
    let v = .22;
    if (kind === 'engine') { tone(46, 58, 'sawtooth'); tone(92, 116, 'square'); pulse(17, .35); lf.frequency.value = 360; }
    if (kind === 'motor') { tone(88, 104, 'sawtooth'); pulse(28, .4, 'square'); air(); lf.frequency.value = 700; v = .16; }
    if (kind === 'rotor') { air(); pulse(11, .6, 'square'); tone(60, 66, 'triangle'); lf.frequency.value = 600; v = .3; }
    if (kind === 'jetroar') { air(); tone(70, 90, 'sawtooth'); lf.frequency.setValueAtTime(300, t); lf.frequency.linearRampToValueAtTime(1800, t + dur * .5); lf.frequency.linearRampToValueAtTime(500, t + dur); v = .26; }
    if (kind === 'wind') { air(); pulse(.7, .4); lf.frequency.setValueAtTime(400, t); lf.frequency.linearRampToValueAtTime(1600, t + .6); lf.frequency.linearRampToValueAtTime(300, t + dur); v = .2; }
    e.gain.linearRampToValueAtTime(v, t + dur * .35); e.gain.linearRampToValueAtTime(v * .9, t + dur * .6); e.gain.linearRampToValueAtTime(.0001, t + dur);
  }
  // a ship's horn: two low notes together, one long blast
  else if (kind === 'horn') { [138, 174].forEach(f => { const o = ctx.createOscillator(), lp = ctx.createBiquadFilter(), e = gain(0); o.type = 'sawtooth'; o.frequency.value = f; lp.type = 'lowpass'; lp.frequency.value = 900; o.connect(lp); lp.connect(e); e.connect(dest);
    e.gain.linearRampToValueAtTime(.09, t + .08); e.gain.setValueAtTime(.09, t + 1.1); e.gain.exponentialRampToValueAtTime(.001, t + 1.5); o.start(t); o.stop(t + 1.55); }); }
  // a bus door folding open
  else if (kind === 'hiss') { hiss(4200, .5, .14, 'highpass'); setTimeout(() => blast(220, 160, .12, 'square', .05), 380); }
  else if (kind === 'splash') { hiss(900, .5, .16, 'bandpass'); }
  // the studio audience: a smatter of claps, a roar, or a few boos
  else if (kind === 'applause' || kind === 'cheer') { const n = kind === 'cheer' ? 46 : 22, len = kind === 'cheer' ? 2200 : 1300;
    for (let i = 0; i < n; i++) setTimeout(() => hiss(1500 + Math.random() * 2500, .03 + Math.random() * .03, .05 + Math.random() * .05, 'bandpass'), Math.random() * len);
    if (kind === 'cheer') hiss(900, 1.6, .06, 'bandpass'); }
  else if (kind === 'boo') { [110, 138, 165].forEach((f, i) => setTimeout(() => blast(f, f * .8, 1.1, 'sawtooth', .05), i * 120)); }
  else if (kind === 'scribble') { for (let i = 0; i < 11; i++) setTimeout(() => hiss(3600 + Math.random() * 1800, .06 + Math.random() * .07, .07, 'bandpass'), 500 + i * 140 + Math.random() * 60); }
  // a folded ballot dropping into the urn
  else if (kind === 'drop') { hiss(1200, .12, .12, 'bandpass'); setTimeout(() => blast(180, 70, .25, 'sine', .3), 120); }
  else if (kind === 'torch') { hiss(600, .7, .25, 'lowpass'); blast(80, 160, .5, 'sine', .2); }
  else if (kind === 'snuff') { hiss(3200, .5, .18, 'highpass'); blast(300, 60, .6, 'sine', .14); }
  else if (kind === 'empty') { blast(330, 220, .35, 'triangle', .16); setTimeout(() => blast(262, 165, .6, 'triangle', .16), 260); }
  // the reading (screens.js readFx): one hit for the vote that decides it, nothing for the rest
  else if (kind === 'boom') { hiss(140, .7, .42, 'lowpass'); blast(85, 32, .9, 'sine', .45); }
  // a phone ringing: the old two-tone bell trill, twice
  else if (kind === 'ring') [0, 1].forEach(r => { for (let i = 0; i < 12; i++) { const tt = t + r * .9 + i * .05, os = ctx.createOscillator(), e = gain(0); os.type = 'triangle'; os.frequency.value = i % 2 ? 1180 : 940; os.connect(e); e.connect(dest);
    e.gain.setValueAtTime(0, tt); e.gain.linearRampToValueAtTime(.08, tt + .005); e.gain.exponentialRampToValueAtTime(.001, tt + .045); os.start(tt); os.stop(tt + .05); } });
  else if (kind === 'thunder') { hiss(90, 2.4, .5, 'lowpass'); blast(55, 30, 1.6, 'sine', .35); }
}

// ── THE VOICES ────────────────────────────────────────────────────────
// A video game's talk (the user, 2026-10-11): a line is spoken as a run of dialogue blips (dmochas's
// pack, voice/), in the speaker's register at the speaker's own pitch, rising at a question. A long
// line is voiced at its start; the text carries the rest. v: { reg: high|mid|low, rate, gap (s) }
let talkSrcs = [], talkTok = 0;
/** Cut whoever is talking (a new step is a new line). */
export function hush() { talkTok++; talkSrcs.forEach(x => { try { x.stop(); } catch { /* done */ } }); talkSrcs = []; }
export function babble(text, v, { loud = false } = {}) {
  hush();
  const o = out(); if (!o || !v || !text) return;
  const ctx = o.ctx, tok = talkTok;
  Promise.all([1, 2, 3, 4, 5, 6].map(i => loadBuf(ctx, `voice/${v.reg}-${i}.ogg`))).then(all => {
    const L = all.filter(Boolean); if (tok !== talkTok || !L.length) return;
    const syl = (String(text).toLowerCase().match(/[aeiouy]+/g) || []).length, n = Math.max(2, Math.min(Math.round(syl * .6), 12));
    const ask = /\?["')]?\s*$/.test(text);
    let h = 0; for (const ch of text) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    const rnd = () => ((h = (h * 1103515245 + 12345) >>> 0) >>> 8) / 16777216;
    let t = ctx.currentTime + .02;
    for (let i = 0; i < n; i++) {
      const B = L[Math.floor(rnd() * L.length)], src = ctx.createBufferSource(), g = ctx.createGain();
      src.buffer = B.b; src.playbackRate.value = v.rate * (1 + (rnd() - .5) * .08) * (ask && i === n - 1 ? 1.15 : 1);
      g.gain.value = B.norm * (loud ? .95 : .75); src.connect(g); g.connect(o.dest); src.start(t); talkSrcs.push(src);
      t += v.gap * (.85 + rnd() * .3) + (rnd() < .1 ? v.gap * .8 : 0);   // now and then a word break
    }
    talkUntil = t; ambLevel();
  });
}

// ── VOICE ACTING (the test) ───────────────────────────────────────────
// The user means to voice the cast with Qwen3-TTS (2026-10-11) and is testing it by hand first: the lines
// of one episode, exported by tools/td-vo-script.mjs into assets/audio/td/vo-test/script.json, voiced in
// the online demo and dropped in the same folder as <id>.wav (or .mp3). A line with a clip plays it; any
// other line, or a clip that is not there yet, falls back to the blips. The id is the speaker and the
// line's text, hashed, so the clip follows the line and not its position.
export function lineId(by, text) {
  let h = 2166136261; for (const ch of `${by}|${text}`) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return 'L' + (h >>> 0).toString(16).padStart(8, '0');
}
let voIndex = null;
const VO = 'vo-test/';
function voLoad() {
  if (!voIndex) voIndex = fetch(TD_AUDIO + VO + 'script.json', { cache: 'no-store' }).then(r => r.ok ? r.json() : null)
    .then(j => { const m = new Set((j?.lines || []).map(l => l.id)); voIndex.ids = m; return m; }).catch(() => { voIndex.ids = new Set(); return voIndex.ids; });
  return voIndex;
}
// The lines as THIS browser speaks them. A line's words depend on more than the season save: the TD writer
// reads each character's franchise career (js/td/past.js), so the user's own browser, with their history,
// says other lines than a clean one, and a script written in a clean browser matched nothing (the user,
// 2026-10-11: "I hear the Animal Crossing voice fallback but not the model voices"). So the viewer keeps
// every line it speaks, and tdVoiceExport() in the console downloads them for tools/td-vo-script.mjs --from.
const spoken = new Map();
if (typeof window !== 'undefined') {
  voLoad();
  // Play a whole episode in this browser, silently and at speed, through every screen and every camp
  // conversation, then download its lines: one command instead of watching it all and opening every
  // conversation on the map (the user's first export held only the six lines of the recap).
  window.tdVoiceRecord = async (ep) => {
    const wait = ms => new Promise(r => setTimeout(r, ms));
    const idx = uid => document.querySelector(`.tdx[data-uid="${uid}"]`)?.dataset.idx || '';
    silent = true; stopAmbience();
    try {
      window.openVisualPlayer(ep); await wait(1500);
      const n = (window.vpScreens || []).length;
      for (let si = 0; si < n; si++) {
        window.vpCurrentScreen = si; window.renderVPScreen(); await wait(400);
        const uid = document.querySelector('.tdx')?.dataset.uid; if (!uid) continue;
        const map = !!document.querySelector('.tdm-root');
        for (let k = 0; k < (map ? 60 : 400); k++) {
          const a = idx(uid); window.tdxNext(uid); await wait(map ? 90 : 35);
          if (!map && a === idx(uid) && k > 3) break;
        }
        console.log(`tdVoiceRecord: screen ${si + 1}/${n}, ${spoken.size} lines so far`);
      }
    } finally { silent = false; }
    return window.tdVoiceExport(ep);
  };
  window.tdVoiceExport = (ep) => {
    const lines = [...spoken.values()].filter(l => ep == null || +l.ep === +ep);
    const eps = [...new Set(lines.map(l => l.ep))];
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify({ episodes: eps, lines }, null, 1)], { type: 'application/json' }));
    a.download = `td-voice-lines${ep != null ? `-ep${ep}` : ''}.json`; document.body.appendChild(a); a.click(); a.remove();
    return `${lines.length} lines from episode${eps.length === 1 ? '' : 's'} ${eps.join(', ')} saved to your Downloads`;
  };
}
/** Speak a line: the voice actor's clip when there is one, else the blips. */
export function speak(by, text, v, opts = {}) {
  hush();
  const id = lineId(by, text);
  if (!spoken.has(id)) spoken.set(id, { by, text, id, ...(opts.meta || {}) });
  try { window.__tdLine?.(by, text, id, opts.meta || {}); } catch { /* a harness hook (tools/td-vo-script.mjs) */ }
  const o = out(); if (!o) return;
  if (!voIndex?.ids?.has(id)) return babble(text, v, opts);
  const ctx = o.ctx, tok = talkTok;
  const clip = loadBuf(ctx, `${VO}${id}.wav`).then(L => L || loadBuf(ctx, `${VO}${id}.mp3`));
  clip.then(L => {
    if (tok !== talkTok) return;
    if (!L) return babble(text, v, opts);
    const src = ctx.createBufferSource(), g = ctx.createGain(); src.buffer = L.b; g.gain.value = L.norm * (opts.loud ? .95 : .8);
    src.connect(g); g.connect(o.dest); src.start(); talkSrcs.push(src);
    try { window.__tdClip?.(id); } catch { /* a harness hook */ }
    talkUntil = ctx.currentTime + L.b.duration; ambLevel();
  });
}

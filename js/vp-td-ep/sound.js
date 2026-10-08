// ══════════════════════════════════════════════════════════════════════
// vp-td-ep/sound.js — the set's sound: ambience from the live layer, effects for the moments
// ══════════════════════════════════════════════════════════════════════
// The music beds stay the classic viewer's (js/vp-ui.js picks them by screen id). This adds
// what was missing (the user, 2026-10-07: "we already have music … but not sound yet like
// sfx"), synthesized live with Web Audio — nothing to download — through the shared engine's
// output, so it obeys the same mute and volume as every other cue (js/audio.js output()).
import { audio as engine } from '../audio.js';

let amb = null, key = '', timers = [];
const out = () => { try { return engine.output(); } catch { return null; } };

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
    every(() => { const t = ctx.currentTime; g2.gain.setValueAtTime(v, t); g2.gain.setValueAtTime(0, t + .35 + Math.random() * .3); }, 700 + k * 230, 1300 + k * 300);
  });
  const cicadas = v => { const s = noise(), bp = filt('bandpass', 5200, 6), g = gain(0); s.connect(bp); bp.connect(g); g.connect(dest); s.start(); lfo(g.gain, .12, v * .8, v); };
  const lapping = v => every(() => burst(380 + Math.random() * 200, 1.2, .5 + Math.random() * .5, v, 'lowpass'), 900, 2600);
  const surf = v => { const s = noise(), lp = filt('lowpass', 700), g = gain(0); s.connect(lp); lp.connect(g); g.connect(dest); s.start(); lfo(g.gain, .09, v * .9, v); };
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
    // Soluna: surf, tropical birds, cicadas in the heat, palm fronds
    surf(sc.shore ? .07 : .04); wind(900, windy * .7);
    if (sc.night) { crickets(.012); every(() => burst(2400, 8, .25, .02), 3000, 9000); }
    else {
      every(() => { const f = 1200 + Math.random() * 600; tone(f, f * 1.8, .18, .03, 'sawtooth'); tone(f * 1.6, f, .2, .025, 'sawtooth', .2); }, 5000 / busy, 14000 / busy);   // parrots
      every(() => tone(1600, 1300, .5, .02, 'triangle'), 7000, 18000);   // gulls
      cicadas(W === 'hot' ? .02 : .006);
    }
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
    every(() => { const t = ctx.currentTime, n = noise(), hp = filt('highpass', 2200), e = gain(0); n.connect(hp); hp.connect(e); e.connect(dest);
      e.gain.setValueAtTime(.12 + Math.random() * .16, t); e.gain.exponentialRampToValueAtTime(.001, t + .03 + Math.random() * .05); n.start(t); n.stop(t + .1); }, 50, 280);
  }
  if (spec.water) {
    const s = noise(), lp = filt('lowpass', 420), g = gain(0); s.connect(lp); lp.connect(g); g.connect(dest); s.start(); lfo(g.gain, .16, .04, .055);
  }
  if (spec.outdoor) {
    const s = noise(), bp = filt('bandpass', 380, .4), g = gain(0); s.connect(bp); bp.connect(g); g.connect(dest); s.start(); lfo(g.gain, .07, .02, .03);
    if (spec.night) {
      [4300, 4720].forEach((f, k) => { const o = ctx.createOscillator(), am = gain(0), g2 = gain(0); o.frequency.value = f; o.connect(am); am.connect(g2); g2.connect(dest); o.start();
        const p = ctx.createOscillator(); p.type = 'square'; p.frequency.value = 28 + k * 3; const pg = gain(.5); p.connect(pg); pg.connect(am.gain); p.start();
        every(() => { const t = ctx.currentTime; g2.gain.setValueAtTime(.01, t); g2.gain.setValueAtTime(0, t + .35 + Math.random() * .3); }, 700 + k * 230, 1300 + k * 300); });
    } else {
      every(() => { const t0 = ctx.currentTime, n = 2 + Math.floor(Math.random() * 4), f = 2600 + Math.random() * 1800;
        for (let i = 0; i < n; i++) { const t = t0 + i * (.09 + Math.random() * .05), o = ctx.createOscillator(), e = gain(0); o.connect(e); e.connect(dest);
          o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * (1.3 + Math.random() * .4), t + .06); e.gain.linearRampToValueAtTime(.035, t + .01); e.gain.exponentialRampToValueAtTime(.001, t + .08); o.start(t); o.stop(t + .1); } }, 1600, 5200);
    }
  }
  if (spec.flies) [182, 197, 214].forEach((f, k) => { const o = ctx.createOscillator(), lp = filt('lowpass', 1100), g = gain(0); o.type = 'sawtooth'; o.frequency.value = f; o.connect(lp); lp.connect(g); g.connect(dest); o.start(); lfo(o.frequency, 9 + k * 2, 14, f); lfo(g.gain, .3 + k * .17, .01, .011); });
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

/** The place's ambience. Called on every paint; rebuilt only when the place changes. */
export function ambience(spec) {
  const o = out();
  const k = o ? JSON.stringify(spec) : '';
  if (k === key) return;
  key = k;
  timers.forEach(clearTimeout); timers = [];
  if (amb) { const old = amb, ctx = old.context; old.gain.setTargetAtTime(0, ctx.currentTime, .3); setTimeout(() => { try { old.disconnect(); } catch { /* gone */ } }, 1500); amb = null; }
  if (!o || !spec) return;
  amb = o.ctx.createGain(); amb.gain.value = 0; amb.connect(o.dest); amb.gain.setTargetAtTime(1, o.ctx.currentTime, .6);
  build(o.ctx, amb, spec);
}
export function stopAmbience() { ambience(null); }

/** A one-shot for a moment. */
export function sfx(kind) {
  const o = out(); if (!o) return;
  const ctx = o.ctx, t = ctx.currentTime, dest = o.dest;
  const gain = v => { const g = ctx.createGain(); g.gain.value = v; return g; };
  const blast = (f0, f1, dur, type = 'sine', v = .25) => { const os = ctx.createOscillator(), e = gain(0); os.type = type; os.connect(e); e.connect(dest); os.frequency.setValueAtTime(f0, t); os.frequency.exponentialRampToValueAtTime(f1, t + dur); e.gain.linearRampToValueAtTime(v, t + .01); e.gain.exponentialRampToValueAtTime(.001, t + dur); os.start(t); os.stop(t + dur + .05); };
  const hiss = (f, dur, v = .2, type = 'bandpass') => { const s = ctx.createBufferSource(); s.buffer = noiseBuf(ctx); const fl = ctx.createBiquadFilter(); fl.type = type; fl.frequency.value = f; const e = gain(0); s.connect(fl); fl.connect(e); e.connect(dest); e.gain.linearRampToValueAtTime(v, t + .01); e.gain.exponentialRampToValueAtTime(.001, t + dur); s.start(t); s.stop(t + dur + .05); };
  if (kind === 'static') { hiss(3000, .4, .2, 'highpass'); blast(60, 50, .3, 'square', .04); }
  else if (kind === 'whoosh') { const s = ctx.createBufferSource(); s.buffer = noiseBuf(ctx); const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 1.5; const e = gain(0); s.connect(bp); bp.connect(e); e.connect(dest); bp.frequency.setValueAtTime(300, t); bp.frequency.exponentialRampToValueAtTime(2400, t + .35); e.gain.linearRampToValueAtTime(.16, t + .12); e.gain.exponentialRampToValueAtTime(.001, t + .4); s.start(t); s.stop(t + .45); }
  else if (kind === 'pop') blast(500, 1100, .09, 'sine', .22);
  else if (kind === 'slam') { blast(140, 40, .35, 'sine', .4); hiss(800, .25, .22); }
  else if (kind === 'slap') { hiss(1800, .08, .4, 'highpass'); blast(300, 120, .08, 'triangle', .18); }
  else if (kind === 'boing') blast(180, 520, .25, 'triangle', .18);
  else if (kind === 'title') { blast(90, 45, .6, 'sine', .38); setTimeout(() => sfx('whoosh'), 60); }
  else if (kind === 'idol') { [392, 523, 659, 784].forEach((f, i) => setTimeout(() => { const tt = ctx.currentTime, os = ctx.createOscillator(), e = gain(0); os.type = 'triangle'; os.frequency.value = f; os.connect(e); e.connect(dest); e.gain.linearRampToValueAtTime(.16, tt + .02); e.gain.exponentialRampToValueAtTime(.001, tt + .7); os.start(tt); os.stop(tt + .75); }, i * 110)); blast(70, 40, .9, 'sine', .3); }
  else if (kind === 'safe') [660, 880, 1320].forEach((f, i) => setTimeout(() => { const tt = ctx.currentTime, os = ctx.createOscillator(), e = gain(0); os.frequency.value = f; os.connect(e); e.connect(dest); e.gain.linearRampToValueAtTime(.14, tt + .01); e.gain.exponentialRampToValueAtTime(.001, tt + .25); os.start(tt); os.stop(tt + .3); }, i * 90));
  else if (kind === 'out') { blast(220, 55, 1.1, 'sawtooth', .12); blast(110, 40, 1.2, 'sine', .3); }
  else if (kind === 'slip') { hiss(2400, .12, .14, 'bandpass'); }
  // a pen on paper: short scratchy strokes for as long as the name takes to write
  else if (kind === 'scribble') { for (let i = 0; i < 11; i++) setTimeout(() => hiss(3600 + Math.random() * 1800, .06 + Math.random() * .07, .07, 'bandpass'), 500 + i * 140 + Math.random() * 60); }
  // a folded ballot dropping into the urn
  else if (kind === 'drop') { hiss(1200, .12, .12, 'bandpass'); setTimeout(() => blast(180, 70, .25, 'sine', .3), 120); }
  else if (kind === 'heart') blast(700, 1050, .18, 'sine', .14);
  // a shock: the orchestra stab of a reality show reveal (a low hit under a falling high note)
  else if (kind === 'shock') { blast(1400, 380, .55, 'sawtooth', .07); blast(95, 38, .7, 'sine', .42); hiss(900, .3, .2); setTimeout(() => blast(60, 40, .5, 'sine', .25), 180); }
  // a dun-dun for a big moment landing (a deal, a betrayal, a showmance going official)
  else if (kind === 'sting') { blast(160, 150, .28, 'square', .08); setTimeout(() => blast(120, 110, .5, 'square', .09), 260); blast(70, 50, .9, 'sine', .3); }
  else if (kind === 'torch') { hiss(600, .7, .25, 'lowpass'); blast(80, 160, .5, 'sine', .2); }
  else if (kind === 'snuff') { hiss(3200, .5, .18, 'highpass'); blast(300, 60, .6, 'sine', .14); }
  else if (kind === 'empty') { blast(330, 220, .35, 'triangle', .16); setTimeout(() => blast(262, 165, .6, 'triangle', .16), 260); }
  else if (kind === 'thunder') { hiss(90, 2.4, .5, 'lowpass'); blast(55, 30, 1.6, 'sine', .35); }
  else if (kind === 'blip') { const os = ctx.createOscillator(), e = gain(0); os.type = 'square'; os.frequency.value = 520 + Math.random() * 60; os.connect(e); e.connect(dest); e.gain.linearRampToValueAtTime(.02, t + .004); e.gain.exponentialRampToValueAtTime(.001, t + .035); os.start(t); os.stop(t + .05); }
}

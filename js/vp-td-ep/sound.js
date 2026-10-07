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

function build(ctx, dest, spec) {
  const noise = () => { const s = ctx.createBufferSource(); s.buffer = noiseBuf(ctx); s.loop = true; s.loopStart = Math.random(); return s; };
  const filt = (type, f, q = .7) => { const n = ctx.createBiquadFilter(); n.type = type; n.frequency.value = f; n.Q.value = q; return n; };
  const gain = v => { const g = ctx.createGain(); g.gain.value = v; return g; };
  const every = (fn, lo, hi) => { const tick = () => { fn(); timers.push(setTimeout(tick, lo + Math.random() * (hi - lo))); }; timers.push(setTimeout(tick, Math.random() * hi)); };
  const lfo = (param, rate, depth, base) => { const o = ctx.createOscillator(); o.frequency.value = rate; const g = gain(depth); o.connect(g); g.connect(param); param.value = base; o.start(); };
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
  else if (kind === 'heart') blast(700, 1050, .18, 'sine', .14);
  else if (kind === 'blip') { const os = ctx.createOscillator(), e = gain(0); os.type = 'square'; os.frequency.value = 520 + Math.random() * 60; os.connect(e); e.connect(dest); e.gain.linearRampToValueAtTime(.02, t + .004); e.gain.exponentialRampToValueAtTime(.001, t + .035); os.start(t); os.stop(t + .05); }
}

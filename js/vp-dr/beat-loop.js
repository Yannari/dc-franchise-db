// ══════════════════════════════════════════════════════════════════════
// vp-dr/beat-loop.js — where a 30-second clip can loop without a hiccup
// ══════════════════════════════════════════════════════════════════════
//
// A store clip is thirty seconds with a fade at each end. Looped whole it
// jumps mid-bar and dips at the seam every half minute. Looped on the beat
// — from a downbeat to the downbeat a whole number of bars later — a
// four-on-the-floor record runs on under the runway as if it were longer.
//
// Pure: samples in, seconds out, so the tests can feed it a click track.

const HOP = 256;

/**
 * Onsets: how much louder each hop got than the one before, listening
 * mostly to the KICK (a low-pass under 150 Hz). Full-band energy follows
 * the melody and the hi-hats too, and read one record at 159 BPM.
 */
function onsets(x, sr) {
  const n = Math.floor(x.length / HOP);
  const low = new Float32Array(n); const full = new Float32Array(n);
  const k = Math.exp(-2 * Math.PI * 150 / sr);
  let y = 0;
  for (let i = 0; i < n; i++) {
    let sl = 0, sf = 0;
    for (let j = i * HOP, end = j + HOP; j < end; j++) { y = (1 - k) * x[j] + k * y; sl += y * y; sf += x[j] * x[j]; }
    low[i] = Math.log(1e-9 + sl / HOP); full[i] = Math.log(1e-9 + sf / HOP);
  }
  const o = new Float32Array(n);
  for (let i = 1; i < n; i++) o[i] = Math.max(0, low[i] - low[i - 1]) + 0.35 * Math.max(0, full[i] - full[i - 1]);
  return o;
}

/**
 * The beat period in hops, by autocorrelation over 100-140 BPM (a runway
 * record is a club record: every one measured sits in 118-130), with the
 * peak interpolated so the error does not add up over fifty beats.
 */
function beatPeriod(o, sr) {
  const lagOf = bpm => (60 / bpm) * sr / HOP;
  const lo = Math.floor(lagOf(140)); const hi = Math.ceil(lagOf(100));
  const ac = new Float32Array(hi + 2);
  for (let lag = lo - 1; lag <= hi + 1; lag++) {
    let s = 0;
    for (let i = lag; i < o.length; i++) s += o[i] * o[i - lag];
    ac[lag] = s / (o.length - lag);
  }
  let best = lo;
  for (let lag = lo; lag <= hi; lag++) if (ac[lag] > ac[best]) best = lag;
  const a = ac[best - 1], b = ac[best], c = ac[best + 1];
  const d = a - 2 * b + c;
  return best + (d ? 0.5 * (a - c) / d : 0);
}

/** The strongest onset within `w` hops of `at`. */
function snap(o, at, w) {
  let best = Math.round(at);
  for (let i = Math.max(0, Math.round(at - w)); i <= Math.min(o.length - 1, Math.round(at + w)); i++) if (o[i] > o[best]) best = i;
  return best;
}

/**
 * Loop points for a clip, in seconds: `{ loopFrom, loopTo, bpm }`, or null
 * when no steady beat is found (the caller then loops the clip whole).
 * Skips the fades (the first and last second) and takes as many whole
 * bars as fit — at least four, or it is not worth a seam.
 */
export function beatLoop(samples, sampleRate) {
  const sr = sampleRate;
  const dur = samples.length / sr;
  if (dur < 12) return null;
  const o = onsets(samples, sr);
  const P = beatPeriod(o, sr);
  if (!(P > 0)) return null;
  // Phase: the offset whose beat grid collects the most onset.
  let phase = 0, best = -1;
  for (let off = 0; off < P; off++) {
    let s = 0;
    for (let t = off; t < o.length; t += P) s += o[Math.round(t)] || 0;
    if (s > best) { best = s; phase = off; }
  }
  /* THE GRID, FITTED. The autocorrelation is good to about half a BPM, and
     half a BPM over fourteen bars is a seam 100 ms off the kick — measured by
     tests/dr-runway-music.test.js on a click track. So: find the real onset
     nearest each predicted beat and fit a line through all of them; fifty
     beats averaged put the grid within a few milliseconds. */
  // Twice: the first pass's grid drifts a quarter-beat by the end of the
  // clip (near enough to snap to a hi-hat); the second searches from the fit.
  let slope = P, icpt = phase;
  for (let pass = 0; pass < 2; pass++) {
    const xs = [], ys = [];
    for (let i = 0, t = icpt; t < o.length; i++, t = icpt + i * slope) {
      const at = snap(o, t, slope / 4);
      if (o[at] > 0) { xs.push(i); ys.push(at); }
    }
    if (xs.length < 8) break;
    const n = xs.length, mx = xs.reduce((a, c) => a + c) / n, my = ys.reduce((a, c) => a + c) / n;
    let sxy = 0, sxx = 0;
    for (let k = 0; k < n; k++) { sxy += (xs[k] - mx) * (ys[k] - my); sxx += (xs[k] - mx) ** 2; }
    if (sxx > 0) { slope = sxy / sxx; icpt = my - slope * mx; }
  }
  const fade = sr / HOP;   // one second, in hops
  let i0 = Math.ceil((fade - icpt) / slope);
  if (i0 < 0) i0 = 0;
  const end = o.length - fade;
  const bars = Math.floor((end - (icpt + i0 * slope)) / (4 * slope));
  if (bars < 4) return null;
  const from = icpt + i0 * slope;
  const to = from + bars * 4 * slope;
  return { loopFrom: (from * HOP) / sr, loopTo: (to * HOP) / sr, bpm: 60 * sr / (slope * HOP), bars };
}

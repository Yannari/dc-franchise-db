// ══════════════════════════════════════════════════════════════════════
// vp-rr-ep/life.js — a plate's slow life: leaves in a breeze, water swelling, lava heaving
// ══════════════════════════════════════════════════════════════════════
//
// The user (2026-10-19): "the bg screen seem to be moving but not like normal lively bg its like its vibrating for
// no reason". The race used to run Total Drama's plate shader (js/vp-td-ep/glplate.js) with maps read loosely off the
// paint: a fine ripple (a few pixels long) and a desert heat shimmer wobbled painted maps on museum walls, signs, snow
// and whole sandy grounds, and the canvas drew the plate at screen size under a close-up's zoom, so it went soft.
//
// Here only what tools/rr-vp-motion.py found and was checked by eye moves (life-have.js lists the plates; a map per
// plate: R leaves, G water, B lava), and slowly: a breeze rolling across the canopy every ten seconds or so, swells a
// tenth of the frame long, lava heaving. Outside those regions the canvas is see-through, so the crisp painted plate
// shows, and its backing store follows the camera's zoom (data-s on #rr-cam), so a close-up stays sharp. Everything
// else lives by the camera's slow drift (style.js) and the people. Without WebGL the plate is simply still.
import { LIFE } from './life-have.js';

const VERT = 'attribute vec2 p; varying vec2 v; void main(){ v = vec2(p.x * .5 + .5, .5 - p.y * .5); gl_Position = vec4(p, 0., 1.); }';
const FRAG = `precision mediump float;
varying vec2 v; uniform sampler2D img, mot; uniform float t;
void main(){
  vec2 uv = v;
  vec3 m = texture2D(mot, uv).rgb;                 // r: leaves, g: water, b: lava
  // leaves: one breeze rolling slowly across the frame, the canopy leaning with it (higher leaves further)
  float br = sin(t * .55 - uv.x * 2.4) * .65 + sin(t * .29 + uv.x * 1.3 + 1.7) * .35;
  vec2 d = vec2(m.r * br * .0018, m.r * sin(t * .7 + uv.x * 3.) * .0004);
  // water: long, slow swells (about a twentieth of the frame), a slower cross-current
  float sw = sin(uv.y * 38. - t * .8 + sin(uv.x * 5. + t * .25) * 1.4);
  d += m.g * vec2(sw * .0008, sin(uv.x * 11. + t * .5) * .0005);
  // lava: a slow heave
  d += m.b * vec2(sin(uv.y * 24. - t * 1.1) * .0009, sin(uv.x * 16. + t * .8) * .0011);
  vec3 c = texture2D(img, uv - d).rgb;
  // a soft glint riding the swell
  c += m.g * smoothstep(.96, 1., sw * sin(uv.x * 26. + t * .4)) * .07;
  c *= 1. + m.b * .05 * sin(t * 1.6 + uv.y * 9.);
  // see-through where nothing moves: the painted plate under the canvas shows there, at its own sharpness
  float a = smoothstep(.02, .18, max(m.r, max(m.g, m.b)));
  gl_FragColor = vec4(c * a, a);
}`;

const live = new Set();
const FRAME_MS = 1000 / 30;

/** True when a plate has something that moves (and so a map beside it). */
export const hasLife = url => !!LIFE[url];

/** Bring the plate `url` to life in `holder` (an empty layer over the plate); returns a stop function. */
export function plateLife(holder, url) {
  for (const s of [...live]) if (!s.cv.isConnected) stop(s);
  holder.innerHTML = '';
  if (!url || !LIFE[url] || typeof window === 'undefined') return () => {};
  const cv = document.createElement('canvas');
  cv.className = 'rr-life';
  holder.appendChild(cv);
  const gl = cv.getContext('webgl', { alpha: true, antialias: false, premultipliedAlpha: true });
  if (!gl) { cv.remove(); return () => {}; }
  const sh = (type, src) => { const x = gl.createShader(type); gl.shaderSource(x, src); gl.compileShader(x); return x; };
  const pr = gl.createProgram();
  gl.attachShader(pr, sh(gl.VERTEX_SHADER, VERT)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FRAG)); gl.linkProgram(pr);
  if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) { cv.remove(); return () => {}; }
  gl.useProgram(pr);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  gl.uniform1i(gl.getUniformLocation(pr, 'img'), 0); gl.uniform1i(gl.getUniformLocation(pr, 'mot'), 1);
  const s = { cv, gl, ut: gl.getUniformLocation(pr, 't'), ready: 0, raf: 0, t0: performance.now(), last: 0 };
  live.add(s);
  if (typeof IntersectionObserver === 'function') { s.io = new IntersectionObserver(es => { s.off = !es.at(-1).isIntersecting; }); s.io.observe(cv); }
  const tex = (unit, src) => {
    const t = gl.createTexture(), im = new Image();
    im.onload = () => {
      if (!cv.isConnected) return;
      gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, im);
      for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, v);
      if (++s.ready === 2) { cv.classList.add('on'); frame(s); }
    };
    im.src = src;
  };
  tex(0, url);
  tex(1, url.replace(/\.webp$/, '-life.webp'));
  return () => stop(s);
}

function frame(s, now) {
  if (!s.cv.isConnected) return stop(s);
  s.raf = requestAnimationFrame(t => frame(s, t));
  if (now && now - s.last < FRAME_MS - 2) return;
  s.last = now || performance.now();
  if (s.off || (typeof document !== 'undefined' && document.hidden)) return;
  const { cv, gl } = s;
  // the backing store follows the camera: a close-up gets the pixels it shows, up to the plate's own
  const zoom = Number(cv.closest('[data-s]')?.dataset.s) || 1;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = Math.min(Math.round(cv.clientWidth * dpr * zoom), 2560), h = Math.round(w * 9 / 16);
  if (w > 0 && (cv.width !== w || cv.height !== h)) { cv.width = w; cv.height = h; gl.viewport(0, 0, w, h); }
  gl.uniform1f(s.ut, (performance.now() - s.t0) / 1000);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}

function stop(s) {
  cancelAnimationFrame(s.raf); live.delete(s); s.io?.disconnect();
  try { s.gl.getExtension('WEBGL_lose_context')?.loseContext(); } catch { /* gone */ }
}

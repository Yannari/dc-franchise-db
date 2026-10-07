// ══════════════════════════════════════════════════════════════════════
// js/vp-td-ep/glplate.js — the plate, alive: the show's own frame moved by its motion map
// ══════════════════════════════════════════════════════════════════════
// A plate built from the show's frame (tools/td-camp/clean.py) carries a motion map beside it
// (<plate>-motion.webp): three maps stacked, saying what the wind moves (leaves, pines, cloth), where
// water ripples or falls, what rocks on the water, where a fire's heat shimmers, which lights
// twinkle and where the sky is open. The open sky is drawn see-through, so the clouds and birds
// (stage.js puts them in a layer underneath) fly behind every tree and roof. A WebGL shader moves the plate's own pixels by it every frame, so a palm's fronds
// flutter against the sky, the sea glints, the boat bobs and nothing has been cut out to do it.
// The wind is one wind: gusts roll across the frame from left to right and everything in their
// way leans together. Without WebGL the painted plate underneath simply stays as it is.

const VERT = `attribute vec2 p; varying vec2 v; void main(){ v = vec2(p.x * .5 + .5, .5 - p.y * .5); gl_Position = vec4(p, 0., 1.); }`;
const FRAG = `precision mediump float;
varying vec2 v; uniform sampler2D img, mot; uniform float t;
float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
void main(){
  vec2 uv = v;
  vec3 a = texture2D(mot, vec2(uv.x, uv.y / 3.)).bgr;          // b: wind, g: water, r: fall
  vec3 b = texture2D(mot, vec2(uv.x, (1. + uv.y) / 3.)).bgr;   // b: bob, g: heat, r: lights
  // the wind: a gust rolling left to right, the leaves fluttering inside it
  float gust = (.55 + .45 * sin(t * .45 - uv.x * 3.)) * (.8 + .2 * sin(t * 1.3 + uv.x * 7.));
  float f = sin(t * 2.1 - uv.x * 14. + uv.y * 9.) * .65 + sin(t * 4.3 + uv.y * 41. - uv.x * 23.) * .35;
  vec2 d = vec2(a.b * gust * (f * .0017 + .0009), a.b * gust * cos(t * 3.1 + uv.x * 31.) * .0006);
  // still water: slow swells, a finer chop riding them
  float sw = sin(uv.y * 620. - t * 1.8 + sin(uv.x * 25. + t * .7) * 2.);
  d += a.g * vec2(sw * .0011, sin(uv.x * 90. + t * 1.2) * .0006);
  // a waterfall: streaks running down, each column at its own pace
  d.y -= a.r * (fract(uv.y * 26. - t * 1.6 + h(vec2(floor(uv.x * 320.), 0.))) - .5) * .006;
  // rocking on the water
  d += b.b * vec2(sin(t * .7) * .0012, sin(t * 1.1) * .0028);
  // a fire: the painted flame licks upward, the air above it shimmers
  d.x += b.g * sin(uv.y * 160. - t * 7.) * .0013;
  d.y += b.g * (sin(uv.x * 120. + t * 9.) * .5 + .5) * .0022;
  vec4 c = texture2D(img, uv - d);
  c.rgb += a.g * smoothstep(.93, 1., sw * sin(uv.x * 140. + t * .9)) * .22;
  c.rgb *= 1. + b.g * .07 * sin(t * 13. + uv.y * 40.);
  float tw = .8 + .2 * sin(t * 2.6 + sin(uv.x * 37.) * 3. + cos(uv.y * 29.) * 3.);
  c.rgb *= mix(1., tw * 1.12, b.r);
  // the open sky is left see-through: the clouds and birds below show there, and only there
  float o = 1. - texture2D(mot, vec2(uv.x - d.x, (2. + uv.y - d.y) / 3.)).r;
  gl_FragColor = vec4(c.rgb * o, o);
}`;

const live = new Set();

function texture(gl, unit, url, onload) {
  const tex = gl.createTexture(), im = new Image();
  im.crossOrigin = 'anonymous';
  im.onload = () => {
    gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, im);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    onload && onload();
  };
  im.src = url;
  return tex;
}

/** Bring every motion-mapped plate inside `root` to life (and let go of any that left the page). */
export function liveGL(root) {
  for (const s of [...live]) if (!s.cv.isConnected) stop(s);
  if (!root || typeof window === 'undefined') return;
  for (const cv of root.querySelectorAll('canvas.tdx-gl')) {
    if (cv._gl) continue;
    const gl = cv.getContext('webgl', { alpha: true, antialias: false, premultipliedAlpha: true });
    if (!gl) { cv.remove(); continue; }
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
    const pr = gl.createProgram();
    gl.attachShader(pr, sh(gl.VERTEX_SHADER, VERT)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FRAG)); gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) { cv.remove(); continue; }
    gl.useProgram(pr);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    gl.uniform1i(gl.getUniformLocation(pr, 'img'), 0); gl.uniform1i(gl.getUniformLocation(pr, 'mot'), 1);
    const s = { cv, gl, ut: gl.getUniformLocation(pr, 't'), ready: 0, raf: 0, t0: performance.now() };
    cv._gl = s; live.add(s);
    const src = cv.dataset.src;
    const go = () => { if (++s.ready === 2) { cv.classList.add('on'); frame(s); } };
    texture(gl, 1, `${src}-motion.webp`, go);
    // the plate at screen size first, the 4K one swapped in as soon as it arrives (for the close-ups)
    texture(gl, 0, `${src}.webp`, () => { go(); if (cv.dataset.hd) texture(gl, 0, `${src}-hd.webp`); });
  }
}

function frame(s) {
  if (!s.cv.isConnected) return stop(s);
  const { cv, gl } = s;
  // the backing store follows the camera: a close-up gets twice the pixels so it stays crisp
  const dpr = Math.min(window.devicePixelRatio || 1, 2), k = cv.closest('.push') ? 2 : 1;
  const w = Math.min(Math.round(cv.clientWidth * dpr * k), 3840), h = Math.round(w * 9 / 16);
  if (w > 0 && (cv.width !== w || cv.height !== h)) { cv.width = w; cv.height = h; gl.viewport(0, 0, w, h); }
  gl.uniform1f(s.ut, (performance.now() - s.t0) / 1000);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  s.raf = requestAnimationFrame(() => frame(s));
}

function stop(s) {
  cancelAnimationFrame(s.raf); live.delete(s);
  s.gl.getExtension('WEBGL_lose_context')?.loseContext();
}

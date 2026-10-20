// ══════════════════════════════════════════════════════════════════════
// vp-rr-ep/sound.js — the Ridonculous Race's music, by place and by moment
// ══════════════════════════════════════════════════════════════════════
//
// The user (2026-10-19): "different music for each place and in each place for each specific
// moment". What a step sounds like is read off the step being painted (manual §6.6), never kept
// as a second list: the place it is shot in (the plate's place, or the leg's) and the moment
// (the opener, the road, a task, a task going wrong, the Chill Zone, the elimination, the recap,
// a confessional). The files are listed in js/vp-rr-ep/music.js and assets/audio/rr/README.md.
//
// A missing file is silence, or the race-wide bed for that moment, or an ambience already in the
// repo where it fits the place (music.js AMBIENCE). Never a Total Drama bed: the simulator's pane
// is told the race screens are silent (vp.js data-ambient="none") and this module plays the rest.
// Stings (the Don Box, the slams, a placement) play only on a step the viewer clicked to.
// Mix: music > voices > ambience; a confessional's bed sits lower, under the words.
import { audio as engine, BED_CATALOG, CUE_CATALOG } from '../audio.js';
import { PLACE_MUSIC, RACE_SOUNDS, AMBIENCE, placeFile, raceFile } from './music.js';
import { HAVE, LIFT } from './music-have.js';
import { flatSteps, chaptersOf } from './steps.js';

const MUSIC_VOL = 0.3, UNDER_VOICE = 0.2, AMB_VOL = 0.18, STING_VOL = 0.55, STING_DUCK = 0.22;
const TASKS = new Set(['either', 'botch', 'allin', 'route', 'superteam', 'midmat']);
const STRUGGLE_KIND = /fear|phobia|exhaust|quit|struggl|panic|meltdown|freez|speed-bump|don-ruling|travel-mishap|snap|blame|closed-for-night/;
const STRUGGLE_END = /fail|struggl|quit|freez|stuck|lost/;
const AFTER_ELIM = new Set(['console', 'goodbye-kiss', 'call-home']);

// ── what a step is (pure: the tests read it) ───────────────────────────
/** The moment of step k of a screen: { place, moment } for a place's bed, { race } for the race's own, or null for silence. */
export function momentAt(screen, k = 0, prev = null) {
  const s = screen;
  if (!s) return null;
  const place = s.plate?.race ? s.place : (s.plate?.place || s.place);
  if (s.kind === 'logo') return { race: 'theme' };
  if (s.kind === 'end') return s.title?.pre === 'THE WINNERS' ? { race: 'finale' } : { race: 'theme' };
  if (s.kind === 'map' || s.replay) return { place: s.place, moment: 'recap' };
  if (s.kind === 'title') return { place, moment: 'opener' };
  if (s.kind === 'iv') return { place: s.place, moment: 'interview' };
  if (s.kind === 'flight' || s.mode === 'cabin') return { race: 'flight' };
  if (s.mode === 'landing') return { place, moment: 'travel' };
  if (s.mode === 'don') return { place, moment: 'opener' };
  if (s.mode === 'narrate' && s.ending === 'depart') return { place, moment: 'opener' };
  if (s.seg === 'don-crown') return { race: 'finale' };
  if (s.seg === 'don-elim') {
    // the verdict: the Chill Zone's music until Don's pause, then the elimination's
    const p = s.steps.findIndex(x => x.part === 'pause');
    return k >= p && p >= 0 ? { place, moment: 'elimination' } : { place, moment: 'chill-zone' };
  }
  if (AFTER_ELIM.has(s.seg) && prev?.moment === 'elimination') return { place, moment: 'elimination' };
  if (s.mode === 'mat') return { place, moment: 'chill-zone' };
  if (s.mode === 'demo') return { place, moment: 'challenge' };
  const struggling = STRUGGLE_KIND.test(s.seg || '') || (s.seg === 'task-try' && STRUGGLE_END.test(s.ending || ''));
  if (TASKS.has(s.stretchKind)) return { place, moment: struggling ? 'struggle' : 'challenge' };
  if (struggling) return { place, moment: 'struggle' };
  return { place, moment: 'travel' };
}

/** The sting of step k, or null. */
export function stingAt(screen, k) {
  const st = screen?.steps?.[k];
  if (!st) return null;
  if (screen.kind === 'logo' && k === 0) return 'logo';
  if (screen.kind === 'title' && k === 0) return 'title';
  if (st.part === 'tip') return 'donbox';
  const t = st.slam?.text || '';
  if (/BOOMERANG/.test(t)) return 'boomerang';
  if (/ELIMINATED/.test(t)) return 'eliminated';
  if (/WINNERS/.test(t)) return 'winners';
  if (/NON-ELIMINATION|SAVE/.test(t)) return 'safe';
  if (t) return 'penalty';
  if (st.rank && !st.rank.out) return 'placement';
  return null;
}

/** The file a moment plays, and how loud: a place's own, else the race's bed for it, else a fitting ambience. */
export function fileFor(m) {
  if (!m) return null;
  if (m.race) { const f = raceFile(m.race); return HAVE.has(f) ? { file: f, vol: MUSIC_VOL } : null; }
  const own = placeFile(m.place, m.moment);
  const vol = m.moment === 'interview' ? UNDER_VOICE : MUSIC_VOL;
  if (HAVE.has(own)) return { file: own, vol };
  const race = raceFile(m.moment);
  if (HAVE.has(race)) return { file: race, vol };
  if (AMBIENCE[m.place] && !['elimination', 'interview', 'recap'].includes(m.moment)) return { file: AMBIENCE[m.place], vol: AMB_VOL, amb: true };
  return null;
}

/** { bed, sting } for step k of screen si of an episode (the moment before carries an elimination's music on). */
export function soundAt(ep, si, k) {
  const s = ep.screens[si];
  const prevScreen = si > 0 ? ep.screens[si - 1] : null;
  const prev = prevScreen ? momentAt(prevScreen, prevScreen.steps.length - 1, null) : null;
  const m = momentAt(s, k, prev);
  return { moment: m, bed: fileFor(m), sting: stingAt(s, k) };
}

// ── the bed plan: when the music actually changes (pure: the tests read it) ──
// The user (2026-10-19): "the music switch the transition is not good". The moment of every step (momentAt) changes
// every few clicks: the road, the task, a slip, a confessional, the task again. Played as it stands, the music
// flipped back and forth and every flip started a track from its intro. So the leg is planned once:
//   * HARD moments always change it: a chapter's first step (chaptersOf), a new place, the opener, the Don Box's
//     demo, the Chill Zone, the elimination, the recap, the flight, the finale, the theme;
//   * SOFT moments (the road, a task, a struggle) change it only if the new music would last SOFT_MIN steps; a
//     shorter stretch keeps the music on;
//   * a confessional keeps the music on, eased down under the words (UNDER_VOICE); the interview's own bed plays only
//     for a long run of them or one that opens a chapter, and the music after it changes back at once;
//   * so no A, B, A within SOFT_MIN steps.
export const SOFT_MIN = 6;
export const DUCK = UNDER_VOICE / MUSIC_VOL;
const HARD = new Set(['opener', 'chill-zone', 'elimination', 'recap']);
const keyOfBed = b => (b ? b.file : 'none');
const PLANS = new WeakMap();
/** The leg's music, step by step (flatSteps order): [{ si, k, bed, level, moment, change, hard }]. */
export function planBeds(ep) {
  const flat = flatSteps(ep.screens);
  const starts = new Set(chaptersOf(ep, ep.place).map(c => c.from));
  const raw = flat.map(f => {
    const s = ep.screens[f.si], x = soundAt(ep, f.si, f.idx), m = x.moment;
    const first = f.idx === 0;
    const hard = (first && starts.has(f.si)) || !!m?.race || HARD.has(m?.moment) || (first && s.mode === 'demo');
    return { si: f.si, k: f.idx, bed: x.bed, moment: m, conf: s.kind === 'iv' || s.mode === 'iv', chapter: first && starts.has(f.si), hard, place: m?.place || null };
  });
  const out = [];
  let cur, curPlace = null, conf = null, heard = new Set(), lastChange = -Infinity;
  // how long bed `key` would play from step i on (confessionals in between do not break it)
  const lasts = (i, key) => { let n = 0; for (let j = i; j < raw.length; j++) { if (raw[j].conf) continue; if (keyOfBed(raw[j].bed) !== key) break; n++; } return n; };
  // a run of confessionals from step i; the world steps from i up to the next confessional
  const confRun = i => { let j = i; while (j < raw.length && raw[j].conf) j++; return j - i; };
  const worldRun = i => { let j = i; while (j < raw.length && !raw[j].conf) j++; return j - i; };
  // a run of confessionals that gets the interview's own bed: a long one, or one that opens a chapter
  const ownAt = i => !!raw[i]?.conf && (confRun(i) >= SOFT_MIN || raw[i].chapter);
  raw.forEach((r, i) => {
    let change = false, level = 1;
    const key = keyOfBed(r.bed);
    if (cur === undefined) change = true;
    else if (r.conf) {
      // a run of confessionals: decided at its first step
      // (an interview scene's stage directions are part of it: the run's first bed plays through)
      const opens = conf === null;
      if (opens) conf = ownAt(i) ? 'own' : 'duck';
      if (conf === 'own') change = opens && key !== keyOfBed(cur);
      else level = DUCK;
    } else {
      // a hard moment comes back within a chapter (the Chill Zone between cutaways to the teams still racing): the
      // second time, it is a soft one
      if (r.chapter) heard = new Set();
      const again = r.hard && !r.chapter && heard.has(key) && r.moment?.moment !== 'elimination';
      if (r.hard) heard.add(key);
      const fromOwn = conf === 'own';
      conf = null;
      // a flight cutaway of one step between two stretches of the same music is not worth a change
      const brief = r.moment?.race === 'flight' && lasts(i, key) < 2;
      if (key === keyOfBed(cur)) change = false;
      // the music after a long interview comes straight back, unless a few lines lead into another long one
      else if (fromOwn) { const L = worldRun(i); change = !(L < SOFT_MIN && ownAt(i + L)); }
      else if (r.hard && !again && !brief) change = true;
      else if (r.place && curPlace && r.place !== curPlace && lasts(i, key) >= 2) change = true;
      // a soft change: the new music must last, and the music on now must have had its turn
      else change = lasts(i, key) >= SOFT_MIN && i - lastChange >= SOFT_MIN;
    }
    if (change) { cur = r.bed; lastChange = i; if (r.place && !r.conf) curPlace = r.place; }
    out.push({ si: r.si, k: r.k, bed: cur, level, moment: r.moment, change, hard: r.hard });
  });
  return out;
}
/** The plan of a leg, made once per episode object; `at[si][k]` its index. */
export function planOf(ep) {
  let p = PLANS.get(ep);
  if (!p) {
    const steps = planBeds(ep), at = {};
    steps.forEach((x, i) => { (at[x.si] ||= {})[x.k] = i; });
    p = { steps, at };
    PLANS.set(ep, p);
  }
  return p;
}

// ── playing it ─────────────────────────────────────────────────────────
// the race's beds cross over slowly on a smooth curve, overlap, and come back where they left off (js/audio.js)
export const RACE_BED_OPTS = { fade: 2.5, curve: 'smooth', resume: true };
const bedId = f => 'rr:' + f;
/** The engine's id for a bed (registered on first use): what the simulator pane's data-ambient names. */
export function registerBed(b) {
  const id = bedId(b.file);
  if (!BED_CATALOG[id]) BED_CATALOG[id] = { build: null, file: b.file, volume: Math.min(1, Math.round(b.vol * 10 ** ((LIFT[b.file] || 0) / 20) * 100) / 100), opts: RACE_BED_OPTS };
  return id;
}
const buffers = {};
function loadSting(ctx, name) {
  if (buffers[name] || typeof fetch !== 'function') return;
  buffers[name] = [];
  fetch(raceFile(name)).then(r => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); })
    .then(b => ctx.decodeAudioData(b)).then(buf => { buffers[name].push(buf); }).catch(() => { /* missing: silence */ });
}
for (const name of Object.keys(RACE_SOUNDS)) {
  if (RACE_SOUNDS[name].kind !== 'sting') continue;
  // the sting ducks the music itself, deep and for as long as it plays (the engine's own duck is half for 0.8 s,
  // so a three-second sting played over the bed at full: the user heard "an overlap of music")
  CUE_CATALOG['rr-' + name] = { duck: false, build(ctx, dest, now) {
    const got = buffers[name] || [];
    if (!got.length) { loadSting(ctx, name); return; }
    const src = ctx.createBufferSource(); src.buffer = got[0];
    try {
      const bus = engine._bedGain?.gain, dur = got[0].duration || 1;
      if (bus) {
        bus.cancelScheduledValues(now); bus.setValueAtTime(bus.value, now);
        bus.linearRampToValueAtTime(STING_DUCK, now + 0.08); bus.setValueAtTime(STING_DUCK, now + dur * 0.85);
        bus.linearRampToValueAtTime(1, now + dur + 0.9);
      }
    } catch { /* the sting still plays */ }
    const g = ctx.createGain(); g.gain.value = Math.min(1, STING_VOL * 10 ** ((LIFT[raceFile(name)] || 0) / 20));
    src.connect(g); g.connect(dest); src.start(now);
  } };
}
function warm() {
  try { const ctx = engine._ctx; if (ctx) for (const n of Object.keys(RACE_SOUNDS)) if (RACE_SOUNDS[n].kind === 'sting' && HAVE.has(raceFile(n))) loadSting(ctx, n); } catch { /* never break a screen */ }
}

// ONE BED AT A TIME. The engine crossfades a change over 1.2 s and starts the new track from its top; clicking or
// skipping through moments faster than that stacked fading copies of two tracks (A, B, A again) on each other. So a
// change waits for the clicking to settle: only the bed still wanted half a second after the last click is asked
// for (so a run of fast clicks is one crossfade, not one per moment), and the bed already playing is never asked
// again (a chapter change no longer drops it to silence and restarts it: vp.js names it as the screen's
// data-ambient, so the pane asks for the very bed that is already playing).
const SETTLE_MS = 500;
let wantBed = null, bedTimer = null;
function setBed(id) {
  wantBed = id;
  clearTimeout(bedTimer); bedTimer = null;
  if (id === (engine._desiredBed ?? null)) return;
  // the very first bed (nothing playing yet) starts at once
  const wait = engine._desiredBed == null && !engine._currentBed ? 0 : SETTLE_MS;
  bedTimer = setTimeout(() => { bedTimer = null; try { engine.ambient(wantBed, RACE_BED_OPTS); } catch { /* fine */ } }, wait);
}

/** Play step k of screen si: the leg's planned bed and level (always), its sting (only on a click: `sting`). */
export function playStep(ep, si, k, sting = true) {
  if (!engine) return;
  const vp = typeof document !== 'undefined' ? document.getElementById('visual-player') : null;
  if (vp && vp.style.display === 'none') return;
  try {
    warm();
    const plan = planOf(ep), i = plan.at[si]?.[k];
    const p = i != null ? plan.steps[i] : null;
    const bed = p ? p.bed : soundAt(ep, si, k).bed;
    setBed(bed ? registerBed(bed) : null);
    // a confessional eases the music down under the words, and the next line brings it back up
    engine.setBedLevel?.(p ? p.level : 1, 0.9);
    // the next two changes the plan makes are fetched and decoded now, so a change never waits on the network
    if (i != null) {
      let n = 0;
      for (let j = i + 1; j < plan.steps.length && n < 2; j++) if (plan.steps[j].change && plan.steps[j].bed) { engine.preloadBed?.(registerBed(plan.steps[j].bed)); n++; }
    }
    const cue = stingAt(ep.screens[si], k);
    if (sting && cue && HAVE.has(raceFile(cue))) engine.sfx('rr-' + cue);
  } catch { /* sound must never break a screen */ }
}
export function stopSound() { clearTimeout(bedTimer); bedTimer = null; wantBed = null; try { engine.ambient(null); } catch { /* fine */ } }

// ── the controls: mute, volume, music on/off ───────────────────────────
export function soundControlsHtml(cls = 'rr-snd') {
  return `<span class="${cls}"><button type="button" class="snd-mute" title="Sound on/off">🔊</button>`
    + `<input class="snd-vol" type="range" min="0" max="100" step="5" title="Volume" aria-label="Volume">`
    + `<button type="button" class="snd-music" title="Music on/off">♫</button></span>`;
}
export function wireSoundControls(root) {
  if (!root) return;
  const mute = root.querySelector('.snd-mute'), vol = root.querySelector('.snd-vol'), mus = root.querySelector('.snd-music');
  const sync = () => {
    if (mute) mute.textContent = engine.isMuted() ? '🔇' : '🔊';
    if (vol) vol.value = String(Math.round(engine.getVolume() * 100));
    if (mus) { mus.classList.toggle('off', !engine.isMusicEnabled()); mus.title = engine.isMusicEnabled() ? 'Music: on' : 'Music: off (the stings still play)'; }
  };
  const stop = e => e.stopPropagation();
  mute?.addEventListener('click', e => { stop(e); engine.unlock?.(); engine.setMuted(!engine.isMuted()); sync(); });
  vol?.addEventListener('input', e => { stop(e); engine.setVolume(Number(vol.value) / 100); if (engine.isMuted()) engine.setMuted(false); sync(); });
  vol?.addEventListener('click', stop);
  mus?.addEventListener('click', e => { stop(e); engine.setMusicEnabled(!engine.isMusicEnabled()); sync(); });
  sync();
}
export const PLACES_WITH_MUSIC = Object.keys(PLACE_MUSIC);

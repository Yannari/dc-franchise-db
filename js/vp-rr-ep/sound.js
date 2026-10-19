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

const MUSIC_VOL = 0.3, UNDER_VOICE = 0.2, AMB_VOL = 0.18, STING_VOL = 0.55;
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

// ── playing it ─────────────────────────────────────────────────────────
const bedId = f => 'rr:' + f;
function registerBed(b) {
  const id = bedId(b.file);
  if (!BED_CATALOG[id]) BED_CATALOG[id] = { build: null, file: b.file, volume: Math.min(1, Math.round(b.vol * 10 ** ((LIFT[b.file] || 0) / 20) * 100) / 100) };
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
  CUE_CATALOG['rr-' + name] = { duck: true, build(ctx, dest, now) {
    const got = buffers[name] || [];
    if (!got.length) { loadSting(ctx, name); return; }
    const src = ctx.createBufferSource(); src.buffer = got[0];
    const g = ctx.createGain(); g.gain.value = Math.min(1, STING_VOL * 10 ** ((LIFT[raceFile(name)] || 0) / 20));
    src.connect(g); g.connect(dest); src.start(now);
  } };
}
function warm() {
  try { const ctx = engine._ctx; if (ctx) for (const n of Object.keys(RACE_SOUNDS)) if (RACE_SOUNDS[n].kind === 'sting' && HAVE.has(raceFile(n))) loadSting(ctx, n); } catch { /* never break a screen */ }
}

/** Play step k of screen si: its bed (always), its sting (only on a click: `sting`). */
export function playStep(ep, si, k, sting = true) {
  if (!engine) return;
  const vp = typeof document !== 'undefined' ? document.getElementById('visual-player') : null;
  if (vp && vp.style.display === 'none') return;
  try {
    warm();
    const { bed, sting: cue } = soundAt(ep, si, k);
    engine.ambient(bed ? registerBed(bed) : null);
    if (sting && cue && HAVE.has(raceFile(cue))) engine.sfx('rr-' + cue);
  } catch { /* sound must never break a screen */ }
}
export function stopSound() { try { engine.ambient(null); } catch { /* fine */ } }

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

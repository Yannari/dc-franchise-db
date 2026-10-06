// ══════════════════════════════════════════════════════════════════════
// vp-bb-ep/sound.js — the sound of the Big Brother house
// ══════════════════════════════════════════════════════════════════════
//
// BEDS: one music bed per kind of screen, the user's own tracks (Downloads/
// BigBrother Music, 2026-10-04) in assets/audio/bb/. Each was measured before
// it was placed: length, loudness, tempo, brightness, bass weight, how its
// energy moves across the track, and whether it loops (docs/big-brother-music.md
// has the table). Trimmed of silence, levelled to -17 dB, 128 kbps.
//
// STINGS: the user's SFX in assets/audio/bb/sfx/ (levelled to -14 dB), read
// off the step the way the stage reads it: a key turning, a face on the wall,
// the medallion, the vote count, a door. Only a click plays a sting (never
// Reveal all), and a step only ever sounds like something on screen.
import { BED_CATALOG, CUE_CATALOG } from '../audio.js';
import { startRoom, stopRoom } from './voices.js';

const dir = 'assets/audio/bb/';
const BASE_VOL = 0.4;

// `lift` is the dB a track could not be raised by without clipping, given back
// on playback (the processing report, scratch bb_music_processed.json).
export const BB_BEDS = {
  'bb-theme':        { files: ['theme.mp3'], lift: { 'theme.mp3': 0.7 }, what: 'the opening titles: the brightest track, 40 s' },
  'bb-previously':   { files: ['previously.mp3'], lift: { 'previously.mp3': 1 }, what: 'previously on: builds hard in its last third' },
  'bb-coming-up':    { files: ['coming-up.mp3'], what: 'coming up / next time: a steady build' },
  'bb-ending':       { files: ['ending.mp3'], what: 'the closing credits: quiet, loops' },
  // house-low.mp3 (E minor) is left out: under a quiet week it read as sad
  'bb-house':        { files: ['house-talk.mp3'], what: 'everyday house talk: D major, bright' },
  'bb-deals':        { files: ['deals.mp3', 'night.mp3'], what: 'deals and late-night talks: flat, no hits, the cleanest loops' },
  // Split by MEASURED mode (2026-10-06, key/mode/tempo/brightness of every bed; the user: "the
  // music still doesn't really fit"): scheming.mp3 is D minor (a lie, a betrayal, a scheme),
  // planning.mp3 is D major (a plan coming together). Sharing one slot played a minor track under
  // half the alliances being formed.
  'bb-scheming':     { files: ['scheming.mp3'], what: 'a scheme, a lie, a betrayal: D minor, sneaky' },
  'bb-planning':     { files: ['planning.mp3'], what: 'a plan coming together, an alliance formed: D major, 107 bpm' },
  'bb-light':        { files: ['house-talk.mp3'], what: 'the fun of the house: D major, bright, 129 bpm' },
  'bb-campaign':     { files: ['campaign.mp3'], what: 'campaigning and arm-twisting: the strongest beat' },
  'bb-drama':        { files: ['drama.mp3'], what: 'a fight: heavy bass, constant hits' },
  'bb-brewing':      { files: ['brewing.mp3'], lift: { 'brewing.mp3': 0.1 }, what: 'suspicion and ceremonies: slow, low, quiet' },
  'bb-confused':     { files: ['confused.mp3'], what: 'chaos: a week turned upside down' },
  'bb-secret':       { files: ['secret.mp3'], what: 'secret powers and private rooms: steady, 144 bpm' },
  'bb-pre-hoh':      { files: ['pre-hoh.mp3'], lift: { 'pre-hoh.mp3': 0.5 }, what: 'before a competition: anticipation' },
  'bb-comp':         { files: ['comp-1.mp3', 'comp-2.mp3', 'comp-3.mp3', 'comp-4.mp3'], lift: { 'comp-2.mp3': 0.4 }, what: 'a competition: bright and fast, fast, heavy, building' },
  'bb-post-hoh':     { files: ['post-hoh.mp3'], what: 'after a win: bright on top but A minor underneath (measured), so not for light moments' },
  'bb-comp-win':     { files: ['comp-win.mp3'], lift: { 'comp-win.mp3': 0.5 }, what: 'a winner crowned' },
  'bb-celebration':  { files: ['celebration.mp3'], lift: { 'celebration.mp3': 1.6 }, what: 'a celebration: back in the house, America\'s favourite, the winner' },
  'bb-veto-meeting': { files: ['veto-meeting.mp3'], what: 'the veto meeting' },
  'bb-live-vote':    { files: ['live-vote.mp3'], what: 'live eviction night, the vote' },
  'bb-live-wait':    { files: ['live-wait.mp3'], what: 'the votes are in: the strongest build, a ticking pulse' },
  'bb-jury-wait':    { files: ['jury-wait.mp3'], what: 'the jury votes read: a long build' },
};
const bedName = (base, i, n) => (n > 1 ? `${base}-${i + 1}` : base);
for (const [base, bed] of Object.entries(BB_BEDS)) {
  bed.files.forEach((f, i) => {
    const vol = Math.min(1, BASE_VOL * 10 ** ((bed.lift?.[f] || 0) / 20));
    BED_CATALOG[bedName(base, i, bed.files.length)] = { build: null, file: `${dir}${f}`, volume: Math.round(vol * 100) / 100 };
  });
}
const hashOf = s => [...String(s)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
/** One of a kind's tracks, kept by the screen (the same screen always plays the same one). */
export function variantOf(base, screen) {
  const bed = BB_BEDS[base];
  if (!bed) return base;
  const n = bed.files.length;
  return bedName(base, n > 1 ? hashOf(`${screen?.id}|${base}`) % n : 0, n);
}

// What each kind of screen sounds like when it opens.
const BED_BY_KIND = {
  hoh: 'bb-comp', veto: 'bb-comp', final: 'bb-comp', vdraw: 'bb-pre-hoh',
  noms: 'bb-brewing', cer: 'bb-veto-meeting', evict: 'bb-live-vote',
  brief: 'bb-coming-up', 'final-cut': 'bb-brewing', 'jury-q': 'bb-brewing', closing: 'bb-campaign',
  'jury-vote': 'bb-jury-wait', afp: 'bb-celebration', reunion: 'bb-ending',
  // the twist sets
  suite: 'bb-scheming', chain: 'bb-campaign', hunt: 'bb-secret', px: 'bb-pre-hoh', duo: 'bb-scheming',
  camp: 'bb-brewing', wild: 'bb-comp', spower: 'bb-secret', capsule: 'bb-comp', interro: 'bb-drama',
  whack: 'bb-comp', power: 'bb-confused', expired: 'bb-secret', coin: 'bb-secret', veto2: 'bb-veto-meeting',
  den: 'bb-secret', curse: 'bb-drama', nightmare: 'bb-confused', battleback: 'bb-comp', bonuslife: 'bb-comp',
  team: 'bb-scheming', mystery: 'bb-secret', premiere: 'bb-confused', hex: 'bb-confused', quiet: 'bb-house',
  rewind: 'bb-confused', locust: 'bb-comp', movein: 'bb-celebration', twist: 'bb-confused', interview: 'bb-ending',
};
// A house scene sounds like what it is: a fight, a deal, or just the house.
// The user, 2026-10-06: "all the music seems really sad, always… limit music to the moments
// that really fit and leave it empty when it isn't necessary." The house is SILENT by default:
// music under a fight, a plan coming together, a campaign, a secret and the fun moments, and
// nothing under ordinary talk, a quiet word, a morning, a Diary Room.
// Measured (scratch mood.py): the minor, dark beds (night, deals, house-low, post-hoh, jury-wait)
// read as sad under ordinary house scenes, so the house uses only the bright major ones.
const BED_BY_MOOD = { drama: 'bb-drama', scheming: 'bb-scheming', plan: 'bb-planning', campaign: 'bb-campaign', ceremony: 'bb-brewing', secret: 'bb-secret', fun: 'bb-light',
  deals: null, house: null };

/** The bed a screen opens on (a track of it). */
export function bedFor(screen) {
  // a House Life segment opens on its first scene's music (or silence); its scenes take it from there
  if (screen?.kind === 'houselife') return 'none';
  if (screen?.kind === 'scene' && !BED_BY_MOOD[screen.mood]) return 'none';
  let base = screen?.kind === 'scene' ? BED_BY_MOOD[screen.mood] : BED_BY_KIND[screen?.kind] || 'bb-house';
  // A few screens inside a kind are a different moment.
  if (/^bb-campdoor/.test(screen?.id || '')) base = 'bb-comp';
  if (/^bb-deepfake/.test(screen?.id || '')) base = 'bb-secret';
  if (/^bb-mysteryveto/.test(screen?.id || '')) base = 'bb-comp';
  if (/^bb-noevict/.test(screen?.id || '')) base = 'bb-house';
  if (/^bb-deadlast/.test(screen?.id || '')) base = 'bb-brewing';
  return variantOf(base, screen);
}

// ── stings ─────────────────────────────────────────────────────────────
const sfx = (...names) => names.map(n => `${dir}sfx/${n}.mp3`);
export const BB_STINGS = {
  'bb-voice':      { files: sfx('voice'), what: 'Big Brother speaks' },
  'bb-twist':      { files: sfx('twist'), lift: 2, what: 'a twist is explained (the rules card)' },
  'bb-dr-cut':     { files: sfx('dr-cut'), what: 'a cut to the Diary Room' },
  'bb-blink':      { files: sfx('blink'), what: 'the camera cuts to a new room' },
  'bb-key-turn':   { files: sfx('key-turn'), what: 'a nomination key turns' },
  'bb-face':       { files: sfx('face'), what: 'the nominees\' faces on the wall' },
  'bb-medallion':  { files: sfx('medallion'), lift: 4, what: 'the Power of Veto medallion' },
  'bb-veto-used':  { files: sfx('veto-used'), what: 'the veto is used' },
  'bb-not-used':   { files: sfx('not-used'), what: 'the veto is not used' },
  'bb-hoh-crown':  { files: sfx('hoh-crown'), what: 'a Head of Household, or any winner, crowned' },
  'bb-veto-crown': { files: sfx('veto-crown'), what: 'the Power of Veto won' },
  'bb-result':     { files: sfx('result'), what: 'the vote count read' },
  'bb-evicted':    { files: sfx('evicted-hit'), lift: 2, what: '"you are evicted"' },
  'bb-door':       { files: sfx('door'), what: 'the front door' },
  'bb-wall':       { files: sfx('wall'), what: 'a portrait on the memory wall goes black and white' },
  'bb-crowd':      { files: sfx('crowd'), what: 'the live studio audience' },
  'bb-winner':     { files: sfx('winner-crowd'), what: 'the winner of the season' },
  'bb-comp-out':   { files: sfx('comp-out'), what: 'out of a competition' },
  'bb-coin':       { files: sfx('coin'), lift: 3, what: 'money changes hands' },
};
const buffers = {};
const turn = {};
function loadSting(ctx, name) {
  if (buffers[name] || typeof fetch !== 'function') return;
  buffers[name] = [];
  for (const file of BB_STINGS[name].files) {
    fetch(file).then(r => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); })
      .then(b => ctx.decodeAudioData(b)).then(buf => { buffers[name].push(buf); }).catch(() => { /* missing file: silence */ });
  }
}
// The crowd stings (applause, the studio crowd, the winner's crowd) run for several seconds; the
// user, 2026-10-06: "the clap sound doesn't stop at the appropriate moment". Each playing sting is
// kept, and the next step fades the crowd out (stopCrowd) rather than letting it run under the host.
const CROWD = new Set(['bb-crowd', 'bb-winner']);
const live = [];
for (const [name, s] of Object.entries(BB_STINGS)) {
  CUE_CATALOG[name] = { duck: true, build(ctx, dest, now) {
    const got = buffers[name] || [];
    if (!got.length) { loadSting(ctx, name); return; }
    const src = ctx.createBufferSource();
    src.buffer = got[(turn[name] = ((turn[name] ?? -1) + 1)) % got.length];
    const g = ctx.createGain(); g.gain.value = 10 ** ((s.lift || 0) / 20);
    src.connect(g); g.connect(dest); src.start(now);
    const item = { name, src, g, at: now };
    live.push(item);
    src.onended = () => { const i = live.indexOf(item); if (i >= 0) live.splice(i, 1); };
  } };
}
/** Fade out any crowd still cheering (the next line has started). */
export function stopCrowd(fade = 0.6) {
  for (const it of live.slice()) {
    if (!CROWD.has(it.name)) continue;
    try {
      const c = it.g.context; const now = c.currentTime;
      if (now - it.at < 0.4) continue;   // the one that has only just started is this step's own
      it.g.gain.cancelScheduledValues(now);
      it.g.gain.setValueAtTime(it.g.gain.value, now);
      it.g.gain.linearRampToValueAtTime(0.0001, now + fade);
      it.src.stop(now + fade + 0.05);
    } catch { /* already stopped */ }
  }
}
/** Fetch every sting once, so the first click is not silent. */
export function warmStings() {
  try {
    const a = typeof window !== 'undefined' ? window.audio : null;
    const ctx = a?._ctx;
    if (ctx) for (const name of Object.keys(BB_STINGS)) loadSting(ctx, name);
  } catch { /* sound must never break a screen */ }
}

// ── what this step sounds like ─────────────────────────────────────────
const isWin = st => st.hoh || st.capEnd === 'won' || st.whWin || st.wcWin || st.coinWin || st.bkBack || st.campBack
  || (st.spOpen && st.spOpen[1]) || st.pwMark === 'relic';
const isOut = st => st.bkOut || st.campOut || st.whMiss || st.capEnd === 'lost' || (st.wlRound && st.wlRound[1] === 'out');
/** { cue, bed }: the sting for step `idx` of this screen, and a bed change if the music turns here. */
export function soundFor(screen, idx) {
  const st = screen?.steps?.[idx];
  if (!st) return { cue: null, bed: null };
  const prev = screen.steps[idx - 1];
  const t = st.t || '';
  // the live eviction: the vote, then the wait, then the name
  if (screen.kind === 'evict') {
    if (/[Tt]he votes are (locked )?in/.test(t)) return { cue: null, bed: 'bb-live-wait' };
    if (st.votes) return { cue: 'bb-result', bed: null };
    if (/you are evicted from the Big Brother house/.test(t)) return { cue: 'bb-evicted', bed: null };
    if (/walks to the front door/.test(t)) return { cue: 'bb-door', bed: null };
    if (st.door) return { cue: 'bb-crowd', bed: null };
    if (st.big && st.safe) return { cue: 'bb-hoh-crown', bed: null };
    if (st.exit) return { cue: 'bb-wall', bed: null };
    if (idx === 0) return { cue: 'bb-crowd', bed: null };
  }
  if (screen.kind === 'jury-vote' && st.winner) return { cue: 'bb-winner', bed: 'bb-celebration' };
  if (screen.kind === 'noms') {
    if (/turns the (first|next) key/.test(t)) return { cue: 'bb-key-turn', bed: null };
    if (st.nom) return { cue: 'bb-face', bed: null };
  }
  if (screen.kind === 'cer') {
    if (st.medal === 'on' && idx === 0) return { cue: 'bb-medallion', bed: null };
    if (/not to use the Power of Veto/.test(t)) return { cue: 'bb-not-used', bed: null };
    if (/decided to use the Power of Veto|use the Power of Veto on/.test(t)) return { cue: 'bb-veto-used', bed: null };
  }
  if (st.veto && screen.kind === 'veto') return { cue: 'bb-veto-crown', bed: 'bb-comp-win' };
  if (isWin(st)) return { cue: 'bb-hoh-crown', bed: (screen.kind === 'hoh' || screen.kind === 'final') ? 'bb-comp-win' : null };
  if (st.bkBack || st.campBack) return { cue: 'bb-hoh-crown', bed: 'bb-celebration' };
  if (isOut(st)) return { cue: 'bb-comp-out', bed: null };
  if (st.coinIn) return { cue: 'bb-coin', bed: null };
  if (st.miIn) return { cue: 'bb-door', bed: null };
  if (st.rule === 1 || (st.rule != null && !(prev && prev.rule != null))) return { cue: 'bb-twist', bed: null };
  if (st.k === 'dr' && (!prev || prev.k !== 'dr')) return { cue: 'bb-dr-cut', bed: null };
  if (st.k === 'bb' && !(prev && prev.k === 'bb')) return { cue: 'bb-voice', bed: null };
  if (screen.kind === 'scene' && idx === 0) return { cue: 'bb-blink', bed: null };
  // House Life: each new conversation is a camera cut, and its music follows its mood
  if (st.card) return { cue: 'bb-twist', bed: 'bb-planning' };
  if (screen.kind === 'houselife' && st.scene) {
    // every scene sets its own music, silence included ('none'), so a fight's bed never runs on
    // under the quiet conversation after it
    const bed = BED_BY_MOOD[st.scene.mood] || 'none';
    const cut = !prev || prev.scene?.set !== st.scene.set || idx === 0;
    return { cue: cut ? 'bb-blink' : null, bed };
  }
  return { cue: null, bed: null };
}

/** Play what this step sounds like (a click only; never on Reveal all). */
export function playStep(screen, idx) {
  const a = typeof window !== 'undefined' ? window.audio : null;
  if (!a || typeof a.sfx !== 'function') return;
  // A closed Viewing Party is only hidden: never start music behind it.
  const vp = typeof document !== 'undefined' ? document.getElementById('visual-player') : null;
  if (vp && vp.style.display === 'none') return;
  const { cue, bed } = soundFor(screen, idx);
  // a new line: the crowd from the line before stops cheering
  stopCrowd();
  try {
    // no music: the room is not silent, it sounds like the room (voices.js); music: the room steps back
    if (bed === 'none' && typeof a.ambient === 'function') { a.ambient(null); startRoom(screen.steps[idx]?.scene?.set || 'ceremony'); }
    else if (bed && typeof a.ambient === 'function') { stopRoom(); a.ambient(variantOf(bed, screen)); }
    if (cue) a.sfx(cue);
  } catch { /* sound must never break a screen */ }
}

if (typeof document !== 'undefined') { document.addEventListener('vp:screen', () => stopCrowd(0.3)); document.addEventListener('vp:close', () => stopCrowd(0.2)); }

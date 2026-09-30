// ══════════════════════════════════════════════════════════════════════
// vp-dr/music.js — music for the MOMENT, not the screen
// ══════════════════════════════════════════════════════════════════════
//
// User (2026-09-30): "like perfect match we're getting music per moment
// rather than per screens … drama, comedy, but also important moments like
// the winner reveal, the challenge — the rusical during the runway — and the
// actual music of the lip sync".
//
// So, the Perfect Match rule (js/vp-pm/sound.js): a moment that IS a
// situation starts that situation's track; it carries on while the steps
// after it are the same situation and fades when the situation ends; an
// ordinary scene plays in silence.
//
// WHERE A STEP'S SITUATION COMES FROM, in order:
//   1. the step's own `data-music` (the builders tag the moments that are not
//      what their screen is: a fight in the werk room, the win, the sashay);
//   2. the screen's default (SCREEN below: the runway, the call, the lip
//      sync, the challenge's own track).
//
// THE FILES LIVE IN THE STUDIO'S OWN STORAGE (user, 2026-09-30: "we already
// have a database, I would love the audio to be in the database"): the
// dc-studio Worker's AUDIO bucket (worker/worker-studio.js, audioRoute).
//
//   moments/<situation>/<name>.mp3   the user's royalty-free tracks for the
//                                    moments. Public to read, like the gallery.
//   lipsync/<song>.mp3               the real lip sync songs. Commercial
//                                    recordings, so PRIVATE: the Worker hands
//                                    them only to a browser holding the studio
//                                    token. Never public, never on the site.
//
// One button (`drLoadSongs`) uploads both, filing each by its name. A
// situation with no track is silence and a song not uploaded plays the
// generic `lipsync` track, so everything works before a single file exists.
// A local assets/audio/drag/manifest.json is still read too, for tracks kept
// in the repo the way Perfect Match's are.
//
// Words only for the ear: nothing here reads or changes the season. Silent
// under tests (no unlocked engine, no IndexedDB).
import { audio as engine } from '../audio.js';
import { SONGS } from '../dr/data/songs.js';

// ── WHAT A WERK ROOM OR UNTUCKED SCENE IS ────────────────────────────
// Classified BY HAND from each event's note and what it does to the room —
// not by keyword. Anything not listed (nerves, working, getting ready) is an
// ordinary scene and plays in silence.
const MOOD = {
  drama: [
    'fabric-hoard', 'read-lands-wrong', 'shade-behind-back', 'overheard', 'not-here-to-make-friends',
    'idea-theft-accusation', 'rehearsal-collision', 'target-on-her-back', 'apology-refused', 'one-less-enemy',
    'the-underestimated', 'frontrunner-iced-out', 'coasting-called-out', 'bottom-written-off',
    'bottom-blames-the-panel', 'competing-with-her', 'called-out-for-it', 'watched-it-happen', 'pulled-into-it',
    'three-way-read', 'unsolicited-advice', 'borrowed-and-not-returned', 'the-loud-one', 'copying-her-idea',
    'nobody-helps-her', 'out-of-her-shadow', 'the-room-notices-the-bloc', 'good-luck-she-does-not',
    'i-disagree', 'threw-me-under', 'defends-herself', 'the-room-takes-sides', 'takes-her-side',
    'congratulations-not-meant', 'winning-too-much', 'not-going-easy', 'say-it-to-my-face', 'named-me-to-my-face',
    'named-by-a-friend', 'the-pile-on', 'defends-the-name', 'who-should-go', 'the-read-lands', 'walks-out',
    'no-apology', 'last-word', 'the-whole-room-turns', 'laughed-at-the-wrong-time', 'that-is-not-what-i-said',
    'apology-not-accepted', 'called-out-for-the-edit', 'not-your-turn', 'unfinished-business',
    'said-out-loud-at-last', 'she-defends-her-family', 'you-are-not-my-mother-here',
  ],
  comedy: [
    'reading-for-filth', 'nickname', 'the-bit', 'impression', 'chaotic-good', 'joke-dies', 'group-singalong',
    'table-of-them', 'holding-the-room', 'reading-the-room-wrong', 'guessing-the-verdict',
  ],
  cry: [
    'breakdown', 'comforting', 'family-story', 'the-first-time', 'imposter', 'the-empty-station',
    'one-less-friend', 'the-mirror-message', 'room-goes-quiet', 'someone-is-missing', 'talking-about-home',
    'reading-the-mirror', 'the-empty-chair', 'sitting-with-it', 'it-all-arrives', 'somebody-sits-down',
    'why-im-here', 'someone-at-home', 'the-room-goes-soft', 'putting-the-face-back', 'fixing-her-face-for-her',
    'the-group-hug', 'nothing-left-to-say', 'both-of-us-down-here', 'proud-of-you-anyway', 'last-drink-together',
    'she-goes-quiet', 'bottom-hangover',
  ],
  sweet: [
    'sewing-rescue', 'borrowed-jewels', 'wig-emergency', 'coaching-through-it', 'apology', 'body-talk',
    'top-girls', 'safe-pact', 'bottom-solidarity', 'the-promise', 'everybody-in', 'she-can-actually-sew',
    'mother-teaching', 'same-name-question', 'the-house-confession', 'frontrunner-asked-for-help',
    'good-luck-she-means-it', 'zip-me-up', 'pour-one-out', 'congratulations-meant', 'both-of-us',
    'talk-me-through-it', 'the-apology', 'told-to-stop', 'defended-by-somebody', 'good-luck-out-there',
    'pouring-for-everybody',
  ],
  romance: ['something-there', 'quiet-thing'],
};
const BY_EVENT = Object.fromEntries(Object.entries(MOOD).flatMap(([sit, ids]) => ids.map(id => [id, sit])));

/** The situation of a scene, from its kind: `werk:<id>`, `untucked:<id>`, or a bare event id. */
export function musicOfKind(kind) {
  const id = String(kind || '').replace(/^(werk|untucked|cold|elimday|morning):/, '');
  return BY_EVENT[id] || null;
}
/** The attribute a builder puts on a step for its moment. */
export const musicAttr = sit => (sit ? ` data-music="${String(sit).replace(/[^a-z0-9-]/gi, '')}"` : '');
/** And the lip sync song a step is sung to. */
export const songAttr = title => (title ? ` data-song="${String(title).replace(/"/g, '&quot;')}"` : '');

// ── WHAT EACH SCREEN IS, WHEN A STEP DOES NOT SAY ────────────────────
// By screen suffix. `null` is a screen whose music is entirely its scenes'
// (the werk room, Untucked): an ordinary scene there is silent. `chal` is the
// week's challenge: its own track (`chal-<id>`), or the generic `challenge`.
const SCREEN = {
  arrivals: 'entrances', return: 'returns', rejoin: 'returns', revenge: 'returns', finreturn: 'returns',
  coldopen: null, morning: null, elimday: null, untucked: null, choice: null,
  saveintro: 'save', savehold: 'save', saveluck: 'save',
  mini: 'mini', announce: 'announce',
  prep: 'prep', booth: 'prep', rehearsal: 'prep', set: 'prep',
  maxi: 'chal', maxistage: 'chal',
  mainstage: 'mainstage', runway: 'runway', finrunway: 'runway', critiques: 'critiques',
  results: 'suspense', rate: 'suspense', finjury: 'suspense', fincut: 'suspense',
  lipsync: 'lipsync', legacy: 'lipsync', smackdown: 'lipsync', fincrownls: 'lipsync',
  exit: 'sashay', reunion: 'reunion',
  finopen: 'finale', fininterview: 'finale', finshowcase: 'showcase', fincrown: 'crowning',
  chart: null, rel: null,
};

/** Every situation a track can be filed under, for the manifest and the README. */
export const DRAG_SITUATIONS = [
  'entrances', 'returns', 'drama', 'comedy', 'cry', 'sweet', 'romance',
  'mini', 'announce', 'prep', 'challenge', 'mainstage', 'runway', 'critiques', 'suspense',
  'winner', 'lipsync', 'shantay', 'sashay', 'save', 'reunion',
  'finale', 'showcase', 'crowning', 'crowned',
];

// ── PLAYBACK ──────────────────────────────────────────────────────────
const DIR = 'assets/audio/drag/';
const WORKER = 'https://dc-studio.yannari19.workers.dev';
const TOKEN_KEY = 'studio_api_token';
/** The studio token (the same one every studio write uses), optionally asking once. */
function studioToken(ask) {
  let t = '';
  try { t = localStorage.getItem(TOKEN_KEY) || ''; } catch { /* storage blocked */ }
  if (t || !ask || typeof prompt === 'undefined') return t;
  t = (prompt('Studio token (stored in this browser only):') || '').trim();
  if (t) { try { localStorage.setItem(TOKEN_KEY, t); } catch { /* blocked */ } }
  return t;
}
const slugify = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'track';
const BED_VOL = 0.32, SONG_VOL = 0.5;
let manifest;
let bed = null;
const turns = {};
const buffers = {};
const musicWanted = () => (engine.isMusicEnabled ? engine.isMusicEnabled() : true);

/* The tracks, from both places: the repo's manifest (with its loop points)
   and whatever has been uploaded to the studio (the whole file loops). */
async function loadManifest() {
  if (manifest !== undefined) return manifest;
  const m = {};
  try {
    const res = await fetch(DIR + 'manifest.json', { cache: 'no-cache' });
    const local = res.ok ? await res.json() : null;
    for (const [sit, list] of Object.entries(local || {})) {
      if (Array.isArray(list)) m[sit] = list.map(t => ({ ...t, url: DIR + t.file }));
    }
  } catch { /* no local manifest */ }
  try {
    const res = await fetch(`${WORKER}/api/audio/moments`);
    const j = res.ok ? await res.json() : null;
    for (const t of j?.tracks || []) (m[t.situation] ||= []).push({ url: `${WORKER}/audio/${t.key}`, file: t.key });
  } catch { /* offline: the local tracks only */ }
  manifest = m;
  return manifest;
}
async function decode(c, key, getBytes) {
  if (buffers[key] !== undefined) return buffers[key];
  try {
    const bytes = await getBytes();
    buffers[key] = bytes ? await c.decodeAudioData(bytes) : null;
  } catch { buffers[key] = null; }
  return buffers[key];
}
const urlBytes = url => async () => { const r = await fetch(url); return r.ok ? r.arrayBuffer() : null; };

/** The situation's next track, in turn; `chal-<id>` falls back to `challenge`. */
async function trackFor(sit) {
  const m = await loadManifest();
  let key = sit;
  if (!(m?.[key] || []).length && /^chal-/.test(sit)) key = 'challenge';
  const list = m?.[key] || [];
  if (!list.length) return null;
  const n = turns[key] = (turns[key] || 0) + 1;
  const pick = list[(n - 1) % list.length];
  return { ...pick, start: pick.at?.length ? pick.at[(n - 1) % pick.at.length] : 0 };
}

function fadeOut(node, t) {
  if (!node?.src) return;
  try {
    const c = node.src.context, now = c.currentTime;
    node.g.gain.cancelScheduledValues(now);
    node.g.gain.setValueAtTime(Math.max(0.0001, node.g.gain.value), now);
    node.g.gain.exponentialRampToValueAtTime(0.0001, now + t);
    node.src.stop(now + t + 0.05);
  } catch { /* already stopped */ }
}
function stop(cut = false) {
  const b = bed; bed = null;
  if (b && !b.pending) fadeOut(b, cut ? 0.08 : 1.2);
}

/** Start `key` (a situation, or `song:<title>`) unless it is already playing. */
async function start(key, sit, song, suffix = null) {
  if (bed?.key === key) { bed.suffix = suffix; return; }
  stop();
  const out = engine.output?.();
  if (!musicWanted() || !out) return;
  // The old per-screen background loop (js/vp-ui.js) is another show's; it
  // does not play under a Drag Race moment.
  try { engine.ambient?.(null); } catch { /* optional */ }
  const mine = bed = { key, pending: true, suffix };
  const { ctx: c, dest } = out;
  let buf = null; let pick = { start: 0 };
  if (song) buf = await decode(c, `song:${song}`, () => songBytes(song));
  if (!buf) {
    pick = await trackFor(song ? 'lipsync' : sit);
    if (pick) buf = await decode(c, pick.url, urlBytes(pick.url));
  }
  if (!buf || bed !== mine) { if (bed === mine) bed = { key, pending: false, suffix }; return; }
  try {
    const now = c.currentTime;
    const src = c.createBufferSource(); src.buffer = buf;
    if (!song && pick.loopTo) { src.loop = true; src.loopStart = pick.loopFrom || 0; src.loopEnd = Math.min(pick.loopTo, buf.duration); }
    const g = c.createGain();
    const vol = song && buf ? SONG_VOL : BED_VOL;
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(vol, now + (song ? 0.4 : 1.2));
    src.connect(g); g.connect(dest);
    src.start(now, Math.min(pick.start || 0, Math.max(0, buf.duration - 1)));
    mine.src = src; mine.g = g; mine.pending = false;
  } catch { if (bed === mine) bed = null; }
}

/** The situation of one revealed step (exported for the tests and the debug view). */
export function situationOf(suffix, el) {
  const own = el?.dataset?.music;
  if (own) return own === 'none' ? null : own;
  const d = SCREEN[suffix];
  if (d !== 'chal') return d ?? null;
  const cls = el?.closest?.('[class*="dr-chal-"]')?.className || '';
  const id = (String(cls).match(/\bdr-chal-([a-z0-9-]+)/) || [])[1];
  return id && id !== 'snatch' ? `chal-${id}` : 'challenge';
}

/** Put a step's moment on its card: the first `<div class="dr-step…` gets `data-music`. */
export const tagStep = (html, sit, song = null) => (sit || song
  ? String(html).replace('<div class="dr-step', `<div${musicAttr(sit)}${songAttr(song)} class="dr-step`) : html);

/** The lip sync screen's moments, by scene kind. The performance itself is the song (untagged). */
export function lipsyncMusicOf(kind) {
  const k = String(kind || '');
  if (/lipsync-(suspense|call|legacy-choice)$/.test(k)) return 'suspense';
  if (/lipsync-shantay$/.test(k)) return 'shantay';
  if (/(lipsync-sashay|sashay-words|sashay-mood)$/.test(k)) return 'sashay';
  if (/lipsync-win-(name|reaction|runnerup)$|revenge-back/.test(k)) return 'winner';
  return null;
}

/**
 * A step was revealed: start, keep, change or stop the music.
 * Called by js/vp-dr/reveal.js on every reveal.
 */
export function dragMusicStep(suffix, idx) {
  if (typeof document === 'undefined') return;
  const el = document.getElementById(`dr-step-${suffix}-${idx}`);
  if (!el) return;
  /* AN UNTAGGED CARD KEEPS THE MOMENT. A confessional after the verdict is
     still the verdict; it must not restart the song because the screen's
     default is the song. Only the first card of a screen falls back on it. */
  // On a screen with no default (the werk room, Untucked) an ordinary scene
  // is silence: the fight's music ends when the fight does.
  // A card with its OWN song (the next duel of a bracket) always gets to change it.
  if (!el.dataset?.music && !el.dataset?.song && SCREEN[suffix] && bed && bed.suffix === suffix) return;
  const sit = situationOf(suffix, el);
  if (!sit) { stop(); return; }
  // The verdict is said in silence after the song: the song cuts, then the
  // shantay or the sashay starts its own track.
  const cut = (sit === 'shantay' || sit === 'sashay' || sit === 'winner' || sit === 'crowned')
    && (bed?.key?.startsWith('song:') || bed?.key === 'suspense' || bed?.key === 'crowning');
  if (cut) stop(true);
  if (sit === 'lipsync') {
    const song = el.dataset?.song || el.closest?.('[data-song]')?.dataset?.song || null;
    start(song ? `song:${song}` : 'lipsync', 'lipsync', song, suffix);
    return;
  }
  start(sit, sit, null, suffix);
}

if (typeof document !== 'undefined' && !globalThis.__drMusic) {
  globalThis.__drMusic = true;
  // A new screen starts in silence until its first moment; leaving the Viewing
  // Party takes the music with it.
  document.addEventListener('vp:screen', () => stop());
  document.addEventListener('vp:close', () => stop());
}

// ── THE LIP SYNC SONGS, AND THE UPLOAD ───────────────────────────────
const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');

/** A song's own file, from the studio — only with the token, never asking mid-show. */
async function songBytes(title) {
  const t = studioToken(false);
  if (!t) return null;
  try {
    const r = await fetch(`${WORKER}/audio/lipsync/${slugify(title)}.mp3`, { headers: { Authorization: `Bearer ${t}` } });
    return r.ok ? r.arrayBuffer() : null;
  } catch { return null; }
}

/**
 * Which song a file is, from its name. "Toxic.mp3", "Toxic - Britney
 * Spears.mp3" and "Britney Spears - Toxic.mp3" all match; the longest title
 * that fits wins, so "Emotions" is never filed as "Emotion".
 */
export function songForFile(fileName) {
  const base = norm(String(fileName).replace(/\.[a-z0-9]+$/i, ''));
  let best = null;
  for (const s of SONGS) {
    const t = norm(s.title); const a = norm(s.artist);
    const fits = base === t || base === t + a || base === a + t
      || (base.startsWith(t) && a && base.slice(t.length).includes(a))
      || (base.endsWith(t) && a && base.slice(0, base.length - t.length).includes(a));
    if (fits && (!best || t.length > norm(best.title).length)) best = s;
  }
  return best;
}

/**
 * Which moment a file is for, from its name: "drama.mp3", "drama-2.mp3",
 * "drama #3.mp3", "chal-rusical.mp3". Null when the name is not a moment.
 */
export function momentForFile(fileName) {
  const base = String(fileName).replace(/\.[a-z0-9]+$/i, '').toLowerCase().trim()
    .replace(/\s*(#|-|_|\s)\s*\d+$/, '').replace(/[\s_]+/g, '-');
  if (DRAG_SITUATIONS.includes(base)) return base;
  if (/^chal-[a-z0-9-]+$/.test(base)) return base;
  return null;
}

const EXT = f => (String(f).match(/\.(mp3|m4a|ogg|wav)$/i) || [])[1]?.toLowerCase() || null;

/**
 * Open a file picker and upload to the studio: each file named after a
 * moment goes to that moment, each file named after a song goes to that
 * song, and the rest are listed back unfiled.
 */
export function drLoadSongs() {
  if (typeof document === 'undefined') return;
  const token = studioToken(true);
  if (!token) return;
  const input = document.createElement('input');
  input.type = 'file'; input.accept = 'audio/*'; input.multiple = true;
  input.onchange = async () => {
    const done = []; const missed = []; const failed = [];
    for (const f of [...(input.files || [])]) {
      const ext = EXT(f.name);
      if (!ext) { missed.push(f.name); continue; }
      const moment = momentForFile(f.name);
      const song = moment ? null : songForFile(f.name);
      if (!moment && !song) { missed.push(f.name); continue; }
      const key = moment
        ? `moments/${moment}/${slugify(f.name.replace(/\.[a-z0-9]+$/i, ''))}.${ext}`
        : `lipsync/${slugify(song.title)}.mp3`;   // one name per song, whatever the format: playback asks for .mp3
      try {
        const r = await fetch(`${WORKER}/audio/${key}`, {
          method: 'PUT', body: await f.arrayBuffer(),
          headers: {
            Authorization: `Bearer ${token}`, 'Content-Type': f.type || 'audio/mpeg',
            ...(song ? { 'X-Song-Title': song.title } : {}),
          },
        });
        if (!r.ok) { failed.push(`${f.name} (${r.status})`); continue; }
        done.push(moment ? `${f.name} → the ${moment} moment` : `${f.name} → "${song.title}"`);
        if (song) delete buffers[`song:${song.title}`];
      } catch { failed.push(f.name); }
    }
    manifest = undefined;   // re-read the moments on the next play
    alert(`${done.length} uploaded.`
      + (done.length ? `\n\n${done.join('\n')}` : '')
      + (missed.length ? `\n\nNot recognised — name the file after a moment (drama, runway, chal-rusical…) or a song title:\n${missed.join('\n')}` : '')
      + (failed.length ? `\n\nFailed:\n${failed.join('\n')}` : ''));
  };
  input.click();
}

/** The control that opens it. */
export function songLoaderHtml() {
  return '<button type="button" class="dr-song-load" onclick="drLoadSongs()" '
    + 'title="Upload music to the studio: files named after a moment (drama, runway…) or after a lip sync song. Songs stay private to you.">'
    + 'Upload music</button>';
}

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
import { RUNWAY_SONGS } from '../dr/data/runway-songs.js';
import { beatLoop } from './beat-loop.js';

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
  lipsync: 'lipsync', legacy: 'lipsync', fincrownls: 'lipsync',
  smackdown: null,   // every smackdown card says its own moment (smackdown.js)
  exit: 'sashay', reunion: 'reunion',
  finopen: 'finale', fininterview: 'finale', finshowcase: 'showcase', fincrown: 'crowning',
  chart: null, rel: null,
};

/** Every situation a track can be filed under, for the manifest and the README. */
export const DRAG_SITUATIONS = [
  'entrances', 'returns', 'drama', 'comedy', 'cry', 'sweet', 'romance',
  'mini', 'announce', 'prep', 'challenge', 'mainstage', 'runway', 'critiques', 'suspense',
  'winner', 'lipsync', 'verdict', 'shantay', 'sashay', 'save', 'reunion',
  'finale', 'showcase', 'crowning', 'crowned',
  // The show's own cues (the user's copies, assets/audio/drag/private), each
  // named for the moment it scores:
  'decision', 'up-for-elimination', 'bottom-two', 'time-has-come', 'closing',
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
/** Every uploaded or published track, by situation (sfx.js reads its `sfx-<name>` files here). */
export const momentTracks = () => loadManifest();

/** The sound effects a file can replace (js/vp-dr/sfx.js plays them): upload `sfx-<name>.mp3`. */
export const DRAG_SFX = ['stinger', 'heartbeat', 'cheer', 'roar', 'slam', 'gasp', 'groan', 'shantay', 'sashay', 'win', 'flash', 'applause'];
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
  /* A SONG THAT FAILED IS ASKED FOR AGAIN next time: one failed search
     (offline, rate-limited) silenced that song until a reload. */
  const got = buffers[key];
  if (!got && key.startsWith('song:')) delete buffers[key];
  return got;
}
const urlBytes = url => async () => { const r = await fetch(url); return r.ok ? r.arrayBuffer() : null; };
/* A PRIVATE CUE, WHEREVER THIS PAGE IS. Beside the page when it is served
   from a checkout (assets/audio/drag/private, git-ignored); from the studio's
   private bucket, with the token, on the published site — where the file
   does not exist, because the show's recordings are never published. */
const cueBytes = file => async () => {
  try {
    const r = await fetch(DIR + file);
    if (r.ok) return r.arrayBuffer();
  } catch { /* not beside the page */ }
  const t = studioToken(false);
  if (!t) return null;
  try {
    const r = await fetch(`${WORKER}/audio/cues/${String(file).split('/').pop()}`, { headers: { Authorization: `Bearer ${t}` } });
    return r.ok ? r.arrayBuffer() : null;
  } catch { return null; }
};

/* WHERE A MOMENT GOES WHEN ITS TRACK IS NOT HERE. The show's own cues are
   private files, so a copy without them (the published site, another
   checkout) plays the general moment instead. `time-has-come` falls back to
   silence: the song starts on the first move, as it did before. */
const FALLBACK = {};   // Drag Race plays its own show's music or nothing: never another show's.
/* THE HOST'S OWN RECORD scores the moments that are hers: the runway, the
   crowning walk, the finale's opening and the reunion. The season's runway
   theme (one per season), unless a track is uploaded for the moment. */
const HOST_SONG = new Set(['runway', 'crowned', 'finale', 'reunion', 'entrances', 'returns']);
/* Where each bed was when it was interrupted, so "I've made my decision"
   picks up after the winner's fanfare instead of starting over. */
const resume = {};

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
  if (b && !b.pending) {
    if (b.t0 != null && b.src?.context) {
      let pos = b.off0 + (b.src.context.currentTime - b.t0);
      if (b.loop && pos > b.loop[1]) pos = b.loop[0] + ((pos - b.loop[0]) % (b.loop[1] - b.loop[0]));
      resume[b.key] = { pos, at: b.src.context.currentTime };
    }
    fadeOut(b, cut ? 0.08 : 1.2);
  }
}

/* ── THE RUNWAY THEME ─────────────────────────────────────────────────
   With no runway track uploaded, the runway walks to one of the host's own
   records (js/dr/data/runway-songs.js) — its 30-second store clip, looped
   on the beat. One per SEASON, as on the show, keyed on the season so a
   replay hears the same one. */
export function runwaySongFor(seasonKey) {
  const k = String(seasonKey ?? '');
  let h = 2166136261;
  for (let i = 0; i < k.length; i++) h = Math.imul(h ^ k.charCodeAt(i), 16777619);
  return RUNWAY_SONGS[(h >>> 0) % RUNWAY_SONGS.length];
}
const seasonKey = () => { const g = globalThis.gs; return g?._drSeed ?? g?.seasonNumber ?? 0; };
const loops = new WeakMap();

/**
 * Loop `buf` from `from` to `to` by starting a fresh copy on the beat grid
 * and crossfading into it — not the source's own loop, which jumps hard:
 * a seam the beat finder placed a few milliseconds off is a stutter with a
 * hard jump and nothing with a crossfade. Returns an object with `stop(when)`
 * so it passes for a source node everywhere the bed stops one.
 */
function crossLoop(c, out, buf, from, to) {
  const X = 0.15; const S = to - from;
  const live = new Set(); let timer = null; let next = c.currentTime + 0.02; let first = true; let dead = false;
  const schedule = () => {
    while (!dead && next - c.currentTime < 4) {
      const src = c.createBufferSource(); src.buffer = buf;
      const g = c.createGain();
      g.gain.setValueAtTime(first ? 1 : 0.0001, next);
      if (!first) g.gain.exponentialRampToValueAtTime(1, next + X);
      g.gain.setValueAtTime(1, next + S);
      g.gain.exponentialRampToValueAtTime(0.0001, next + S + X);
      src.connect(g); g.connect(out);
      src.start(next, from, S + X + 0.02);
      live.add(src); src.onended = () => live.delete(src);
      next += S; first = false;
    }
    if (!dead) timer = setTimeout(schedule, 1000);
  };
  schedule();
  return { context: c, stop(when) { dead = true; clearTimeout(timer); for (const s of live) { try { s.stop(when); } catch { /* done */ } } } };
}

/**
 * A CUE CUT TO THE MOMENT, the way an editor cuts one: its opening from
 * `from`, then a crossfade into its ending (`outro`), so a moment shorter
 * than the cue still hears the hit AND the button, and loses the middle.
 * Passes for a source node where the bed stops one (`context`, `stop`).
 */
function editPlay(c, out, buf, from, headLen, outro) {
  const X = 0.3; const now = c.currentTime + 0.02; const live = [];
  const seg = (at, off, len, fadeIn) => {
    const s = c.createBufferSource(); s.buffer = buf; const g = c.createGain();
    g.gain.setValueAtTime(fadeIn ? 0.0001 : 1, at);
    if (fadeIn) g.gain.exponentialRampToValueAtTime(1, at + X);
    g.gain.setValueAtTime(1, at + len);
    g.gain.exponentialRampToValueAtTime(0.0001, at + len + X);
    s.connect(g); g.connect(out); s.start(at, off, len + X + 0.02); live.push(s);
  };
  seg(now, from, headLen, false);
  seg(now + headLen, outro[0], outro[1] - outro[0], true);
  return { context: c, stop(when) { for (const s of live) { try { s.stop(when); } catch { /* done */ } } } };
}

/* HOW LONG A MOMENT LASTS ON SCREEN, from its cards: a beat to take the
   card in, then the words at a reading pace (~190 a minute). The music is
   fitted to this; a reader who lingers hears the loop, one who races hears
   the cue cut short, which is what a fade is for. */
const readTime = el => {
  const words = String(el?.textContent || '').trim().split(/\s+/).filter(Boolean).length;
  return Math.min(12, 1.5 + words / 3.2);
};
/** Seconds from card `idx` until the card where `ends(el)` first holds (or the screen ends). */
function secondsUntil(suffix, idx, ends) {
  let t = 0;
  for (let i = idx; ; i++) {
    const e = document.getElementById(`dr-step-${suffix}-${i}`);
    if (!e || (i > idx && ends(e))) return t;
    t += readTime(e);
  }
}

/** Start `key` (a situation, or `song:<title>`) unless it is already playing. */
async function start(key, sit, song, suffix = null, fallback = null, fit = {}) {
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
  // Your own file first; the record's 30-second clip when there is none.
  if (song) buf = await decode(c, `song:${song}`, async () => (await songBytes(song)) || previewBytes(song));
  /* THE CLIP OUTLASTS ITS THIRTY SECONDS. A store clip is half a minute and
     a lip sync is read at the reader's pace, so a slow reader heard the song
     stop in the middle of the performance. A clip (not an uploaded song,
     which plays whole) loops on the beat, the way the runway does. */
  if (song && buf && buf.duration < 45) {
    if (!loops.has(buf)) {
      let L = null;
      try { L = beatLoop(buf.getChannelData(0), buf.sampleRate); } catch { /* no beat */ }
      loops.set(buf, L || { loopFrom: 1, loopTo: Math.max(2, buf.duration - 1.2) });
    }
    pick = { runway: true, ...loops.get(buf) };
  }
  if (!buf) {
    pick = await trackFor(song ? 'lipsync' : sit);
    if (pick) buf = await decode(c, pick.url, pick.private ? cueBytes(pick.file) : urlBytes(pick.url));
    /* The verdict track is a private file (assets/audio/drag/private, never
       published): on a copy without it, forget it and play the moment's own. */
    fallback = fallback || FALLBACK[sit] || null;
    if (!buf && fallback) {
      if (manifest) delete manifest[sit];
      pick = await trackFor(fallback);
      if (pick) buf = await decode(c, pick.url, urlBytes(pick.url));
    }
    if (!buf && HOST_SONG.has(sit)) {
      const rs = runwaySongFor(seasonKey());
      if (rs) {
        buf = await decode(c, `song:runway:${rs.title}`, () => previewBytes(rs.title, rs.artist));
        if (buf && !loops.has(buf)) {
          let L = null;
          try { L = beatLoop(buf.getChannelData(0), buf.sampleRate); } catch { /* no beat */ }
          loops.set(buf, L || { loopFrom: 1, loopTo: Math.max(2, buf.duration - 1.2) });
        }
        pick = buf ? { runway: true, ...loops.get(buf) } : pick;
      }
    }
  }
  if (!buf || bed !== mine) { if (bed === mine) bed = { key, pending: false, suffix }; return; }
  try {
    const now = c.currentTime;
    const g = c.createGain();
    const vol = song && buf ? SONG_VOL : BED_VOL;
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(vol, now + (song ? 0.4 : 1.2));
    g.connect(dest);
    let src;
    if (pick.runway) src = crossLoop(c, g, buf, pick.loopFrom, pick.loopTo);
    else {
      // Back within a minute and a half: carry on from where it stopped.
      const r = !song && resume[key] && c.currentTime - resume[key].at < 90 ? resume[key].pos : null;
      /* THE HIT LANDS ON ITS CARD: a cue with a `hit` starts early enough that
         its biggest moment arrives as the card it scores is revealed. */
      const fromHit = !song && r == null && pick.hit != null && fit.toHit != null
        ? Math.max(0, pick.hit - fit.toHit) : null;
      const off0 = Math.min(r ?? fromHit ?? pick.start ?? 0, Math.max(0, buf.duration - 1));
      const whole = pick.outro ? pick.outro[1] - off0 : 0;
      if (!song && r == null && pick.outro && fit.dur != null && fit.dur < whole) {
        const tail = pick.outro[1] - pick.outro[0];
        src = editPlay(c, g, buf, off0, Math.max(pick.head || 1.5, fit.dur - tail), pick.outro);   // `head`: never cut before the cue's own hit
      } else {
        src = c.createBufferSource(); src.buffer = buf;
        if (!song && pick.loopTo) { src.loop = true; src.loopStart = pick.loopFrom || 0; src.loopEnd = Math.min(pick.loopTo, buf.duration); }
        src.connect(g);
        src.start(now, off0);
        if (!song) { mine.t0 = now; mine.off0 = off0; mine.loop = src.loop ? [src.loopStart, src.loopEnd] : null; }
      }
    }
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
export function lipsyncMusicOf(kind, data = null) {
  const k = String(kind || '');
  /* "The time has come…" has its own cue; the song starts on the first move,
     so every performance card says so (an untagged card keeps the moment). */
  if (/lipsync-intro$/.test(k)) return 'time-has-come';
  if (/lipsync-(open|beat|hook|stunt|last-chorus)$/.test(k)) return 'lipsync';
  /* A DOUBLE IS ANNOUNCED IN ONE CARD: the call itself says both stay (or
     both go), with no shantay or sashay card after it. Filed as suspense, a
     double shantay played the wait and never the verdict. */
  if (/lipsync-call$/.test(k) && data?.tier === 'double-shantay') return 'shantay';
  if (/lipsync-call$/.test(k) && data?.tier === 'double-sashay') return 'sashay';
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
  if (manifest === undefined) loadManifest();   // the verdict needs to know what exists
  /* AN UNTAGGED CARD KEEPS THE MOMENT. A confessional after the verdict is
     still the verdict; it must not restart the song because the screen's
     default is the song. Only the first card of a screen falls back on it. */
  // On a screen with no default (the werk room, Untucked) an ordinary scene
  // is silence: the fight's music ends when the fight does.
  // A card with its OWN song (the next duel of a bracket) always gets to change it.
  /* THE EPISODE'S LAST CARD is the host's sign-off: "if you can't love
     yourself…" and its own cue. Checked before the keep rule below, which
     would otherwise hold the goodbye's music over it (it did). */
  if (suffix === 'exit' && !document.getElementById(`dr-step-exit-${idx + 1}`)) {
    start('closing', 'closing', null, suffix, null, { dur: readTime(el) });
    return;
  }
  if (!el.dataset?.music && !el.dataset?.song && SCREEN[suffix] && bed && bed.suffix === suffix) return;
  let sit = situationOf(suffix, el);
  if (!sit) { stop(); return; }
  // The verdict is said in silence after the song: the song cuts, then the
  // shantay or the sashay starts its own track.
  const cut = (sit === 'shantay' || sit === 'sashay' || sit === 'winner' || sit === 'crowned')
    && (bed?.key?.startsWith('song:') || bed?.key === 'suspense' || bed?.key === 'crowning');
  if (cut) stop(true);
  /* ONE PIECE OF MUSIC UNDER THE WHOLE VERDICT. On the show the elimination
     music starts when the host speaks and runs straight through "shantay" and
     "sashay" — the same key for both, so it never restarts between them. */
  // The pause before the verdict is where the host says "I've made my
  // decision", and the verdict music starts there.
  const waiting = sit === 'suspense' && (suffix === 'lipsync' || suffix === 'legacy');
  // Only on the stage: her goodbye (the exit screen) has its own music.
  const onStage = /^(lipsync|legacy|smackdown|fincrownls|exit)$/.test(suffix);
  // A lip sync for the WIN ends under it too: the host names the winner there.
  if (onStage && (sit === 'shantay' || sit === 'sashay' || sit === 'winner' || waiting) && manifest?.verdict?.length) {
    // Its big section lands on the verdict ("shantay", "sashay away", the winner's name), however long the pause.
    const toHit = secondsUntil(suffix, idx, e => /^(shantay|sashay|winner)$/.test(e.dataset?.music || ''));
    start('verdict', 'verdict', null, suffix, sit, { toHit: waiting ? toHit : 0 });
    return;
  }
  if (sit === 'lipsync') {
    const song = el.dataset?.song || el.closest?.('[data-song]')?.dataset?.song || null;
    start(song ? `song:${song}` : 'lipsync', 'lipsync', song, suffix);
    return;
  }
  // The moment runs until a card asks for different music.
  const dur = sit === 'closing' ? readTime(el)
    : secondsUntil(suffix, idx, e => !!e.dataset?.music && e.dataset.music !== sit);
  start(sit, sit, null, suffix, null, { dur });
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

/**
 * A song's own file, from the studio — only with the token, never asking
 * mid-show. The upload keeps the file's own extension, so each is tried.
 */
async function songBytes(title) {
  const t = studioToken(false);
  if (!t) return null;
  for (const ext of ['mp3', 'm4a', 'ogg', 'wav']) {
    try {
      const r = await fetch(`${WORKER}/audio/lipsync/${slugify(title)}.${ext}`, { headers: { Authorization: `Bearer ${t}` } });
      if (r.ok) return r.arrayBuffer();
      if (r.status !== 404) return null;   // no token, no bucket: stop asking
    } catch { return null; }
  }
  return null;
}

/* ── THE 30-SECOND CLIP, WHEN THERE IS NO FILE ──────────────────────
   The iTunes search API is free, needs no sign-in, and both the search and
   the clip allow a browser to read them. A song nobody has uploaded still
   plays its real record for thirty seconds, instead of a generic track. */
const PREVIEW_CACHE = 'dr_song_previews';
let previewCache = null;
function previews() {
  if (previewCache) return previewCache;
  try { previewCache = JSON.parse(localStorage.getItem(PREVIEW_CACHE) || '{}') || {}; } catch { previewCache = {}; }
  return previewCache;
}
function rememberPreview(title, url) {
  previews()[title] = url;
  try { localStorage.setItem(PREVIEW_CACHE, JSON.stringify(previewCache)); } catch { /* private window */ }
}

/* A remix, a live take or an acoustic cut is the right singer and the wrong
   record — measured: "Telephone (Kaskade Mix)", "Physical (Acoustic)" and
   "Last Dance (Live)" were first in their results. Kept only as a last resort. */
const VARIANT = /\b(re-?mix|mix\w*|radio|club|dub|acoustic|live|karaoke|instrumental|version|edit|demo|a cappella|cover|tribute|sped up|slowed|commentary)\b/i;
// "P!nk" is Pink: the bang is a letter, not punctuation.
const artistKey = s => norm(String(s || '').replace(/!/g, 'i'));

/**
 * The search result that IS the record. The artist must match, so a karaoke
 * cover or a tribute act never plays. The title must match from its start
 * (or end: "And All That Jazz"). Then the original beats a variant, and the
 * shortest title wins, so "Toxic" beats "Toxic (feat. …)".
 */
export function pickPreview(results, title, artist) {
  const t = norm(title); const a = artistKey(artist);
  const variant = x => VARIANT.test(x.trackName) && !VARIANT.test(title);
  const fits = (results || []).filter(x => {
    if (!x?.previewUrl) return false;
    const n = norm(x.trackName); const xa = artistKey(x.artistName);
    return (n.startsWith(t) || n.endsWith(t)) && (!a || xa.includes(a) || (xa && a.includes(xa)));
  });
  return fits.sort((x, y) => (variant(x) - variant(y)) || (norm(x.trackName).length - norm(y.trackName).length))[0] || null;
}

async function previewBytes(title, artist = SONGS.find(s => s.title === title)?.artist || '') {
  const cache = previews();
  let url = cache[title];
  if (url === undefined) {
    try {
      // "Cover Girl - Macutchi's TaterZ DeeP Edit": the store's own spelling, dash and all, searches worse than without it.
      const q = encodeURIComponent(`${title.replace(/ - /g, ' ')} ${artist}`.trim());
      const r = await fetch(`https://itunes.apple.com/search?term=${q}&media=music&entity=song&limit=50`);
      if (!r.ok) return null;   // rate-limited: try again next time, remember nothing
      url = pickPreview((await r.json())?.results, title, artist)?.previewUrl || null;
      rememberPreview(title, url);
    } catch { return null; }
  }
  if (!url) return null;
  try { const r = await fetch(url); return r.ok ? r.arrayBuffer() : null; } catch { return null; }
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
  if (/^sfx-[a-z]+$/.test(base) && DRAG_SFX.includes(base.slice(4))) return base;
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

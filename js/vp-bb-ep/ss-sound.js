// ══════════════════════════════════════════════════════════════════════
// vp-bb-ep/ss-sound.js — the sound of the House of Secrets
// ══════════════════════════════════════════════════════════════════════
//
// Part 4 (the user, 2026-10-28: "find the music yourself… use context clues,
// length, name, ambience, and the real show"). The show's own cues, from the
// user's folder (Downloads/Secretstorymusic) and the official soundtrack
// playlist the user pointed to, both for local use: in assets/audio/ss/, which
// is git-ignored (the site plays without them, silently). Each track was
// measured (length, loudness, key, tempo, brightness, energy curve) and placed
// by its name and by where the real show uses it: "Précédemment dans Secret
// Story" under the narrator's recap, the bailiff's call under the verdict, the
// finalists' entrance, "Et le gagnant est…". Levelled to -17 dB, each loop's
// tail crossfaded into its head (the loop points skip the encoder's delay).
//
// The few sound effects (the buzzer, the red phone, coins, applause) are CC0
// recordings from bigsoundbank.com, in assets/audio/ss/sfx/ (committed).
//
// Big Brother's sound.js asks this module for a Secret Story screen's bed and
// for the Secret Story name of a moment's bed (a fight, the wait, a win).
import { BED_CATALOG } from '../audio.js';

const DIR = 'assets/audio/ss/';
const BASE_VOL = 0.4;
// the encoder's delay at the head of every file (measured on decode)
const HEAD = 0.0251;
const DUR = { theme: 52.6, 'previously-1': 84.37, 'previously-2': 76.59, 'previously-3': 35.63, launch: 58.36, anthem: 74.52, voice: 50.16, 'mission-1': 46.15, 'mission-2': 55.3,
  bailiff: 58.71, 'finalists-2': 86.18, 'finalists-3': 95.47, winner: 75.38, 'party-1': 98.39, 'party-2': 58.29, 'party-3': 58.41, 'party-4': 54.95, 'party-5': 58.43,
  'fun-1': 58.41, 'fun-2': 58.38, 'fun-3': 74.03, 'fun-4': 84.27, 'fun-5': 41.39, after: 58.41, 'quirky-1': 88.64, 'quirky-2': 58.57, store: 26.55,
  'hunt-1': 58.41, 'hunt-2': 95.35, 'hunt-3': 39.51, 'hunt-4': 93.77, 'hunt-5': 93.77, 'hunt-6': 72.25, think: 79.84, plot: 31.05, 'drama-1': 102.76, 'drama-2': 21.09,
  'tension-1': 57.11, cliff: 53.16, wait: 53.95, 'love-1': 28.87, 'love-2': 58.15, 'love-3': 59.99, 'love-4': 89.57,
  'sad-1': 58.31, 'sad-2': 65.63, 'sad-3': 79.38, 'sad-4': 83.95, 'sad-5': 58.38, epic: 65.0, night: 147.04, secretroom: 58.31, arrivals: 142.97 };

/** Each kind of moment, its tracks, and what they are. */
export const SS_BEDS = {
  'ss-previously': { files: ['previously-1', 'previously-2', 'previously-3'], what: '"Précédemment dans Secret Story": under the narrator\'s recap' },
  // (the user, 2026-10-28: "use the truncated theme for the opening, not the full song")
  'ss-prime':      { files: ['theme'], what: 'the generic, the show\'s own cut of the theme, as the prime goes on air' },
  // (I Wanna Chat without its lyrics, the user's own copy, 2026-10-29: "use this for arrival music"; Secret Boys Secret
  // Girls, launch.mp3, is the sung one, identical to its "Vocal Candidats" track)
  'ss-launch':     { files: ['arrivals'], what: 'I Wanna Chat, the instrumental: the arrivals on launch night, the host on stage' },
  'ss-anthem':     { files: ['anthem'], what: 'the Hymn of Secrets: a secret told, the list of secrets' },
  'ss-voice':      { files: ['voice'], what: "the Eye of the Net jingle bed: under the Voice's announcements" },
  'ss-mission':    { files: ['mission-1', 'mission-2'], what: 'Mission secret / Mister Secret: a mission given, a mission judged' },
  'ss-mister':     { files: ['mission-2'], what: 'Mister Secret: the Golden Buzz (the user, 2026-10-29)' },
  'ss-bailiff':    { files: ['bailiff'], what: "the bailiff's call: the envelope of the verdict" },
  'ss-finalists':  { files: ['finalists-2', 'finalists-3'], what: "the finalists' entrance" },
  'ss-winner':     { files: ['winner'], what: '"And the winner is…"' },
  'ss-party':      { files: ['party-1', 'party-2', 'party-3', 'party-4', 'party-5'], what: 'getting ready, then the party' },
  'ss-fun':        { files: ['fun-1', 'fun-2', 'fun-3', 'fun-4', 'fun-5'], what: 'the fun of the house: comedy, mischief, a bit of magic' },
  'ss-after':      { files: ['after'], what: 'After Secret: bright and bouncy' },
  'ss-quirky':     { files: ['quirky-1', 'quirky-2'], what: "the odd and the funny: the Voice's evening games, the Golden Buzz" },
  'ss-store':      { files: ['store'], what: 'ninety seconds in the store' },
  'ss-hunt':       { files: ['hunt-1', 'hunt-2', 'hunt-3', 'hunt-4', 'hunt-5', 'hunt-6'], what: 'the hunt: the sixties investigation, mystery, research, brainstorming' },
  'ss-think':      { files: ['think'], what: 'a quiet reflection' },
  'ss-plot':       { files: ['plot'], what: 'a plot, a scheme' },
  'ss-drama':      { files: ['drama-1', 'drama-2'], what: 'a row: incomprehension, stress' },
  // ("Scary" is gone: the user, 2026-10-29, "remove that creepy music this isnt suspense music")
  'ss-tension':    { files: ['tension-1'], what: 'waiting for the axe to fall: expectation' },
  'ss-cliff':      { files: ['cliff'], what: "the end of a daily: the narrator's cliffhanger" },
  'ss-wait':       { files: ['wait'], what: 'the verdict: waiting and waiting' },
  'ss-love':       { files: ['love-1', 'love-2', 'love-3', 'love-4'], what: 'love, intimacy, tenderness' },
  'ss-sad':        { files: ['sad-1', 'sad-2', 'sad-3', 'sad-4', 'sad-5'], what: 'a goodbye: piano, melancholy, a nostalgic waltz' },
  'ss-epic':       { files: ['epic'], what: "the Voice's game, a return" },
  'ss-night':      { files: ['night'], what: 'the house at night' },
  'ss-secretroom': { files: ['secretroom'], what: 'the secret room behind the bookcase' },
};
const bedName = (base, i, n) => (n > 1 ? `${base}-${i + 1}` : base);
for (const [base, bed] of Object.entries(SS_BEDS)) {
  bed.files.forEach((f, i) => {
    const d = DUR[f];
    BED_CATALOG[bedName(base, i, bed.files.length)] = { build: null, file: `${DIR}${f}.mp3`, volume: BASE_VOL, ...(d ? { loop: [HEAD, HEAD + d] } : {}) };
  });
}
const hashOf = s => [...String(s)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
/** One of a kind's tracks, kept by the screen (the same screen always plays the same one). */
export function ssVariantOf(base, screen) {
  const n = SS_BEDS[base]?.files.length || 1;
  return bedName(base, n > 1 ? hashOf(`${screen?.id}|${base}`) % n : 0, n);
}

/** Is this a screen of a Secret Story week? (steps.js marks them) */
export const isSS = screen => !!screen?.ss;

// The screen's own music, by what it is (the first rule whose pattern matches its id).
/** @type {Array<[RegExp, string]>} */
const BY_ID = [
  [/^bb-ss-previously/, 'ss-previously'],
  [/^bb-ss-tonight/, 'ss-cliff'],
  [/^bb-ss-launch-open/, 'ss-anthem'],
  [/^bb-ss-launch-(arr|sas|in)-/, 'ss-launch'],
  [/^bb-ss-launch-house/, 'ss-fun'],
  [/^bb-ss-(launch-list|secrets-v|prime-list|prime-unveil)/, 'ss-anthem'],
  [/^bb-ss-(launch-role|mission|missionres|role)-?/, 'ss-mission'],
  [/^bb-theme-(open|vote)|^bb-ss-rule-|^bb-ss-prime-voice/, 'ss-voice'],
  [/^bb-ss-(game|prime-return|returns)/, 'ss-epic'],
  [/^bb-ss-party-|^bb-ss-event-(pageant|housework)-/, 'ss-party'],
  [/^bb-ss-event-clans-/, 'ss-epic'],
  [/^bb-ss-split-(start|duel)-/, 'ss-epic'],
  [/^bb-ss-split-end-/, 'ss-love'],
  [/^bb-ss-duo-(stolen|jealous|care)-/, 'ss-love'],
  [/^bb-ss-love-(fight|doubt|third|plot)-/, 'ss-plot'],
  [/^bb-ss-love-/, 'ss-love'],
  [/^bb-ss-duo-/, 'ss-plot'],
  [/^bb-ss-event-room-/, 'ss-secretroom'],
  [/^bb-ss-event-mission-/, 'ss-mission'],
  [/^bb-ss-(hunt|clue|houseclue|clueroom)-/, 'ss-hunt'],
  [/^bb-ss-deal-/, 'ss-plot'],
  [/^bb-ss-store-/, 'ss-store'],
  [/^bb-ss-evening-/, 'ss-quirky'],
  [/^bb-ss-buzz-.*-room$|^bb-ss-prime-(truths|accusation)/, 'ss-plot'],
  // (the reveal waits in silence-heavy suspense, then its answer sets its own music: ssBuzzScreen's step beds)
  [/^bb-ss-buzz-.*-reveal$|^bb-ss-prime-reveal-/, 'ss-wait'],
  [/^bb-ss-(black-buzzer|buzz-)|^bb-ss-prime-(airlock|dil|phone|noms)/, 'ss-tension'],
  // (the user, 2026-10-28: "the nomination music is creepy": the plotting tracks, not the fear ones)
  [/^bb-ss-noms/, 'ss-plot'],
  [/^bb-ss-secretroom/, 'ss-secretroom'],
  [/^bb-ss-sroom-/, 'ss-tension'],
  [/^bb-ss-group-/, 'ss-secretroom'],
  [/^bb-ss-ntwist-houses-/, 'ss-epic'],
  [/^bb-ss-ntwist-/, 'ss-tension'],
  [/^bb-ss-prime-entry-/, 'ss-epic'],
  [/^bb-ss-prime-bridge-/, 'ss-tension'],
  [/^bb-ss-prime-rings-/, 'ss-quirky'],
  [/^bb-ss-houseend/, 'ss-cliff'],
  [/^bb-ss-prime-package/, 'ss-previously'],
  [/^bb-ss-prime-open/, 'ss-prime'],
  [/^bb-ss-prime-(chat|kitties|couch)/, 'ss-fun'],
  [/^bb-ss-prime-goldenbuzz/, 'ss-mister'],
  // the sixteen more nights (vp-bb-ep/ss-prime-nights.js)
  [/^bb-ss-prime-night-(hearts|families)-/, 'ss-love'],
  [/^bb-ss-prime-night-gender-war-/, 'ss-epic'],
  [/^bb-ss-prime-night-(library|safe|jungle|shields|crystal-ball)-/, 'ss-mission'],
  [/^bb-ss-prime-night-(fire|temptations|returns)-/, 'ss-plot'],
  [/^bb-ss-prime-night-/, 'ss-tension'],
  [/^bb-ss-prime-visit/, 'ss-love'],
  // (the user, 2026-10-28: "the prime music doesn't use the suspense at all": the verdict is the tension tracks;
  // the envelope brings the bailiff's call and the name the goodbye, step by step: ssStepBed)
  [/^bb-ss-prime-verdict/, 'ss-bailiff'],
  [/^bb-ss-prime-mag-noms/, 'ss-tension'],
  [/^bb-ss-prime-mag-clash/, 'ss-drama'],
  [/^bb-ss-prime-mag-love/, 'ss-love'],
  [/^bb-ss-prime-mag-hunt/, 'ss-hunt'],
  [/^bb-ss-prime-(falsevoice|robot)/, 'ss-quirky'],
  [/^bb-ss-prime-ticket/, 'ss-tension'],
  [/^bb-ss-(false-voice|robot)-/, 'ss-quirky'],
  // (the sad music is for the elimination itself; the interview on the set is calm: the user, 2026-10-28)
  // (the interview, on the set: the show's own theme, I Wanna Chat without its lyrics: the user, 2026-10-29)
  [/^bb-ss-prime-walk/, 'ss-launch'],
  [/^bb-ss-after/, 'ss-after'],
  [/^bb-ss-final-(v|open)$/, 'ss-finalists'],
  [/^bb-ss-(journeys|final-journey)/, 'ss-sad'],
  [/^bb-ss-final-awards/, 'ss-fun'],
];
// a house scene sounds like what it is; ordinary talk has the dailies' light music under it (the user, 2026-10-28:
// "you have 53 songs, use them": the real show's dailies are scored nearly wall to wall)
const BY_MOOD = { mission: 'ss-mission', store: 'ss-store', drama: 'ss-drama', scheming: 'ss-plot', plan: 'ss-hunt', campaign: 'ss-plot', ceremony: 'ss-tension', secret: 'ss-hunt', fun: 'ss-fun', love: 'ss-love', deals: 'ss-plot', house: 'ss-fun' };
// Big Brother's moment beds, in the House of Secrets
const FROM_BB = { 'bb-drama': 'ss-drama', 'bb-scheming': 'ss-plot', 'bb-planning': 'ss-hunt', 'bb-campaign': 'ss-plot', 'bb-brewing': 'ss-tension', 'bb-secret': 'ss-hunt',
  'bb-light': 'ss-fun', 'bb-house': 'ss-fun', 'bb-live-wait': 'ss-tension', 'bb-live-vote': 'ss-tension', 'bb-celebration': 'ss-winner', 'bb-comp-win': 'ss-epic', 'bb-comp': 'ss-epic',
  'bb-pre-hoh': 'ss-tension', 'bb-post-hoh': 'ss-epic', 'bb-ending': 'ss-sad', 'bb-coming-up': 'ss-cliff', 'bb-previously': 'ss-previously', 'bb-confused': 'ss-quirky',
  'bb-deals': 'ss-plot', 'bb-veto-meeting': 'ss-tension', 'bb-jury-wait': 'ss-wait', 'bb-theme': 'ss-prime' };

/** A Secret Story screen's base bed ('none' for the room's own sound). */
export function ssBaseFor(screen) {
  const id = String(screen?.id || '');
  for (const [re, b] of BY_ID) if (re.test(id)) return b;
  if (screen?.kind === 'houselife') return 'ss-fun';
  if (screen?.kind === 'scene') return BY_MOOD[screen.mood] || 'ss-fun';
  if (screen?.kind === 'hoh') return 'ss-epic';
  if (screen?.kind === 'noms') return 'ss-plot';
  if (screen?.kind === 'voice') return 'ss-voice';
  // (any other Secret Story screen: a quiet bed rather than silence)
  return 'ss-think';
}
/** The House of Secrets' name for a bed Big Brother's rules chose (a moment: a fight, the wait, a win). */
export function ssFromBB(bed) {
  if (!bed || bed === 'none' || /^ss-/.test(bed)) return bed;
  const base = String(bed).replace(/-\d+$/, '');
  return FROM_BB[base] || FROM_BB[bed] || null;
}
/** A scene mood's bed in the House of Secrets. */
export const ssMoodBed = mood => BY_MOOD[mood] || 'none';

/**
 * A Secret Story moment's own bed, when a step says more than the screen (the envelope opens: the
 * bailiff; the winner's name: "and the winner is"). Null: the screen's bed stands.
 */
export function ssStepBed(screen, st) {
  if (!st) return null;
  // (a step that names its own music: the verdict's suspense, the elimination's sad turn)
  if (st.bed) return st.bed;
  if (st.prop === 'envelope') return 'ss-bailiff';
  if (st.winner || st.confetti) return 'ss-winner';
  if (st.out && /^bb-ss-prime-verdict/.test(String(screen?.id || ''))) return 'ss-sad';
  if (st.card?.state === 'found') return 'ss-anthem';
  return null;
}

// ── the sound effects (CC0 recordings), with the synth as a fallback when a file is missing ──
const SFX = { buzz: 'buzz', ring: 'ring', coin: 'coin', open: 'open', whoosh: 'whoosh', applause: 'applause', cheer: 'cheer', jingle: 'jingle',
  voice: 'voice', reveal: 'reveal', twist: 'twist', win: 'win', out: 'out', boo: 'boo' };
// Big Brother's MUSICAL stings, in the House of Secrets, are hits cut from the show's own music (the user, 2026-10-29:
// "keep the sfx royalty free sound the music use the ss ones"): sfx/voice (the 2026 jingle), reveal ("Ending Suspense"),
// twist ("Mission secret"), win ("Et le gagnant est..."), out ("Piano Tristesse"). A sound effect (a cut, a door, the
// crowd, a coin) stays Big Brother's.
const CUE_SS = { 'bb-voice': 'voice', 'bb-twist': 'twist', 'bb-medallion': 'twist', 'bb-result': 'reveal', 'bb-face': 'reveal',
  'bb-hoh-crown': 'win', 'bb-winner': 'win', 'bb-veto-crown': 'win', 'bb-evicted': 'out' };
/** The House of Secrets' sting for one of Big Brother's musical cues, or null (the cue plays as it is). */
export const ssCueFor = cue => (cue ? CUE_SS[cue] || null : null);
const bufs = {};
/**
 * Plays one of the House of Secrets' sound effects through the site's audio (its volume and mute).
 * @returns {boolean} whether it played from a recording (false: the caller may synthesise it)
 */
export function ssSfx(kind, vol = 1) {
  const name = SFX[kind];
  if (!name) return false;
  try {
    const A = /** @type {any} */ (globalThis).audio;
    if (A?.isMuted?.()) return true;
    const ctx = A?._ctx;
    if (!ctx) return false;
    const b = bufs[name];
    if (b === 'missing') return false;
    if (!b) {
      bufs[name] = 'loading';
      fetch(`${DIR}sfx/${name}.mp3`).then(r => { if (!r.ok) throw new Error(String(r.status)); return r.arrayBuffer(); })
        .then(x => ctx.decodeAudioData(x)).then(buf => { bufs[name] = buf; play(ctx, A, buf, vol); }).catch(() => { bufs[name] = 'missing'; });
      return true;
    }
    if (b === 'loading') return true;
    play(ctx, A, b, vol);
    return true;
  } catch { return false; }
}
function play(ctx, A, buf, vol) {
  const src = ctx.createBufferSource(); src.buffer = buf;
  const g = ctx.createGain(); g.gain.value = Math.max(0, Math.min(1, (A?.getVolume?.() ?? 0.7))) * vol;
  src.connect(g); g.connect(ctx.destination); src.start();
}
/** Fetch the effects once, so the first buzz is not silent. */
export function ssWarmSfx() { for (const k of Object.keys(SFX)) if (!bufs[SFX[k]]) ssSfx(k, 0); }

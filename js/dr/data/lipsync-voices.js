// ══════════════════════════════════════════════════════════════════════
// dr/data/lipsync-voices.js — the lip sync, in this song's words
// ══════════════════════════════════════════════════════════════════════
//
// ── WHY THIS FILE EXISTS ──────────────────────────────────────────────
//
// The same bug as the mini and the runway, on the most important ninety
// seconds in the show. `lipsync-beat` had four tiers keyed on how well she did
// and knew nothing about the song, so a queen fighting for her life to a
// six-minute power ballad and a queen doing it to a hyperpop banger got the
// same paragraph with a different name in it.
//
// And the song is not a decoration. js/dr/data/songs.js gives every title four
// tags, and its own header says what they are for — "the narration builds its
// third beat out of this" about `hook`. It never did. `lipsyncScore` reads
// them all to decide who wins; the words that describe the win read none.
//
// ── THE TWO POOLS ─────────────────────────────────────────────────────
//
//   LIPSYNC_TEMPOS  4 tempos × 4 score tiers.  What the song asks of a body.
//   LIPSYNC_HOOKS   5 hooks × 2 outcomes.      The moment it is won or lost.
//
// stage.js renders the tempo line as the beat, and the hook line after it when
// the song has a hook worth naming. Two pools rather than one crossed pool for
// the usual reason: 4 × 4 × 5 × 2 is a commission nobody finishes, and the
// hook is a separate moment in the song rather than a different way of
// describing the same one.
//
// ── WHY TEMPO AND NOT MOOD ────────────────────────────────────────────
//
// Both are authored, and tempo is the one that changes what the queen is
// physically doing. A ballad is stillness, a face, and the discipline not to
// fill the silence; an uptempo is a body that has to keep up for three
// minutes. Mood changes the colour of a performance and tempo changes the job,
// and it is the job that the old prose was wrong about — it described dance
// breaks and death drops over songs that have neither.
//
// ── FOR THE WRITER ────────────────────────────────────────────────────
//
// Fill the `lines` arrays. Change nothing else.
//
// THIRD PERSON, AND THIS IS THE HIGHEST-STAKES REGISTER IN THE SHOW. Two
// queens are lip syncing for their lives in front of a panel that has already
// decided everything except this. It is loud, it is close, and one of them is
// leaving. The werk room is funny; the main stage is verdict; this is neither.
// Keep it physical and present-tense-feeling — what her body is doing, what
// the room is doing, what the other queen can see out of the corner of her eye.
//
// NEVER QUOTE A LYRIC. `{s}` is the song's TITLE and that is the only part of
// it that may appear. No lines from the song, no paraphrase of its words, not
// one clause of it. This is not a style note, it is the rule the whole song
// bank is built on — songs.js exists because real titles are used as names and
// nothing else.
//
// Placeholders:
//   {a}  the queen performing.
//   {s}  the song title. Available everywhere here and nowhere else in the
//        show. Use it sparingly — naming it every line reads like a caption.
//
// Same rules as every other pool, all enforced by tests: no real people beyond
// the artist the title belongs to, this show's vocabulary only, never quote a
// stat by number, four variants minimum per tier, prose rather than captions.

/** A tier of lines: what it is for, then the lines themselves. */
const tier = (id, note, lines = []) => ({ id, note, lines });

/** The four cuts, best to worst. These are `LIPSYNC_TIERS` in js/dr/stage.js. */
export const LIPSYNC_TIER_IDS = ['legendary', 'strong', 'trying', 'lost'];

// ══════════════════════════════════════════════════════════════════════
// POOL 1 — WHAT THE SONG ASKS OF HER. One voice per tempo.
// ══════════════════════════════════════════════════════════════════════
//
// The tiers are ranked against the queens in THIS lip sync, which is usually
// two people. So `legendary` means she won it and won it well, and `lost`
// means she was visibly beaten — there is no middle of a field of two, and the
// four tiers exist because a triple or a lalaparuza puts more bodies on the
// stage.

const tempo = (id, note, tiers) => ({ tempo: id, note, tiers });

const T = (legendary, strong, trying, lost) => [
  tier('legendary', legendary), tier('strong', strong),
  tier('trying', trying), tier('lost', lost),
];

export const LIPSYNC_TEMPOS = [
  tempo('ballad',
    'SLOW, AND THERE IS NOWHERE TO HIDE. No choreography to fall back on and '
    + 'no beat to ride. It is a face, a pair of hands, and the discipline not '
    + 'to fill the silence with tricks. The song is long and every second of '
    + 'it is her alone in a light.', T(
      'She does almost nothing and it is devastating. The room stops moving.',
      'She holds it. The stillness reads as control rather than as a gap.',
      'She fills the quiet with movement because the quiet frightens her.',
      'She has no idea what to do with a song this slow and it shows for minutes.')),
  tempo('mid',
    'A build. It starts contained and goes somewhere, and the performance has '
    + 'to go with it — a queen who gives everything in the first verse has '
    + 'nothing left when the song finally opens up.', T(
      'She paces it exactly and arrives at the top of the song with the song.',
      'She reads the build correctly and saves enough for it.',
      'She peaks early and spends the rest of the song at the same level.',
      'The song builds and she does not, and the gap between them is the story.')),
  tempo('dance',
    'A groove rather than a sprint. It wants hips and control and a body that '
    + 'sits in the pocket — the trap is treating it like an uptempo and '
    + 'running out of road.', T(
      'She sits in the pocket and the whole room feels it before it sees it.',
      'She finds the groove and stays in it. Nothing is rushed.',
      'She is on top of the beat instead of in it, all the way through.',
      'She fights the tempo for three minutes and the tempo wins.')),
  tempo('uptempo',
    'FAST, AND IT DOES NOT STOP. Cardio as much as performance. She has to '
    + 'keep up, keep the words, and keep her face doing something while her '
    + 'lungs give out — and a wig that is not sewn down will not survive it.', T(
      'She does not drop a word or a count and appears not to be breathing.',
      'She keeps up and the effort only shows once, near the end.',
      'The song outruns her and she is chasing the words by the last chorus.',
      'She stops performing and starts surviving, and everybody can see the moment.')),
];

// ══════════════════════════════════════════════════════════════════════
// POOL 2 — THE MOMENT IT IS WON OR LOST. One per hook.
// ══════════════════════════════════════════════════════════════════════
//
// Every song names the one place a lip sync is decided, and it is the same
// place for both queens — which is exactly what makes it worth narrating. Two
// outcomes only: she took it or she did not. There is no middle at a key
// change.
//
// This fires as a SECOND, SHORTER line after the tempo beat, so it should read
// as a moment rather than a summary. It also lands after a line it has never
// seen, so it may not restate how the overall performance went — only what
// happened at this one point in the song.

const hook = (id, note, tiers) => ({ hook: id, note, tiers });

const H = (nailed, missed) => [tier('nailed', nailed), tier('missed', missed)];

export const LIPSYNC_HOOKS = [
  hook('key-change',
    'The song lifts a whole step and everybody in the building knows it is '
    + 'coming, including both queens. Whoever owns that second owns the song.',
    H('She goes up with it and takes the room with her.',
      'The song goes up and she stays exactly where she was.')),
  hook('breakdown',
    'Everything drops out. A bar or two of almost nothing, and whatever she '
    + 'does in the gap is the thing the edit will use.',
    H('She does one thing in the gap and it is the right thing.',
      'The floor falls out of the song and she is caught standing still.')),
  hook('spoken',
    'A spoken passage. No melody to ride and no choreography that fits — it is '
    + 'acting, in the middle of a lip sync, and the words have to land as if '
    + 'she means them.',
    H('She acts it rather than mouths it and the room goes quiet for it.',
      'The words come out of a face that is not saying them.')),
  hook('dance-break',
    'The vocal stops and the track keeps going. Pure movement, no words to '
    + 'hide behind, for as long as the producer felt like.',
    H('The vocal drops out and she has something ready for it.',
      'The vocal drops out and she has nothing, and the track keeps playing.')),
  hook('none',
    'NO SINGLE MOMENT. This song hands nobody a gift — no lift, no gap, no '
    + 'break. It is won on consistency, which means these lines are about the '
    + 'ABSENCE of a moment: she has to make one, or she waits for one that is '
    + 'never coming.',
    H('There was no moment in the song so she built one where none was written.',
      'She spends the song waiting for a moment the song was never going to give her.')),
];

// ══════════════════════════════════════════════════════════════════════
// LOOKUP — how stage.js turns a song into a voice
// ══════════════════════════════════════════════════════════════════════

/**
 * Her lines for this song's tempo, or null.
 *
 * Null rather than a fallback, as everywhere else: the file ships empty and is
 * filled a tempo at a time, and an unwritten tempo keeps the generic
 * `lipsync-beat` in stage-beats.js exactly as it reads today.
 *
 * A song with no tempo tag, or one this file does not carry, also returns null
 * rather than guessing — there are four tempos in songs.js and a fifth would
 * be a data change that should show up as generic prose, not as a wrong one.
 */
export function tempoLinesFor(t, tierId) {
  const x = LIPSYNC_TEMPOS.find(v => v.tempo === t);
  const tr = x && x.tiers.find(y => y.id === tierId);
  return tr && tr.lines.length ? tr.lines : null;
}

/** The hook moment, or null — omitted entirely rather than faked. */
export function hookLinesFor(h, outcome) {
  const x = LIPSYNC_HOOKS.find(v => v.hook === h);
  const tr = x && x.tiers.find(y => y.id === outcome);
  return tr && tr.lines.length ? tr.lines : null;
}

/** Every (pool, key, tier) still waiting on prose. */
export function unwrittenLipsyncVoices() {
  const out = [];
  for (const v of LIPSYNC_TEMPOS) {
    for (const t of v.tiers) if (t.lines.length < 4) out.push(`tempo:${v.tempo}/${t.id}`);
  }
  for (const v of LIPSYNC_HOOKS) {
    for (const t of v.tiers) if (t.lines.length < 4) out.push(`hook:${v.hook}/${t.id}`);
  }
  return out;
}

/** How many tiers exist across both pools, for the progress report. */
export function lipsyncVoiceTierCount() {
  return LIPSYNC_TEMPOS.reduce((n, v) => n + v.tiers.length, 0)
    + LIPSYNC_HOOKS.reduce((n, v) => n + v.tiers.length, 0);
}

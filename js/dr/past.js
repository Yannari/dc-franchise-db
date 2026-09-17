// ══════════════════════════════════════════════════════════════════════
// dr/past.js — what she already did, before this season
// ══════════════════════════════════════════════════════════════════════
//
// All Stars' premiere is the one episode of this show that is NOT an
// introduction. Nobody is meeting anybody: the room already knows who won
// what, who went home first, and who has something to prove. So every queen
// needs an answer to one question before the door opens.
//
// ── REAL WHEN IT EXISTS, INVENTED WHEN IT DOES NOT ────────────────────
//
// There are thirteen drag alumni in this franchise and all of them come from
// `dr-1`. A real-history-only rule would mean All Stars could never be
// anything but season one run again, so a queen with no history gets one
// written for her — deterministically, from her stats and the season's seed,
// and FROZEN onto the season by `castPasts` so it cannot drift between a
// replay, a screen and an article.
//
// An invented past caps at runner-up. A former winner changes the room's
// reaction and the threat read sharply, and inventing one is a strong claim
// about a queen the franchise may yet actually play; only a stored season
// makes a winner.
import { DRAG_STATS, dragOf } from './queen.js';
import { rngFor } from './rng.js';

const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
const stat = (p, k) => {
  const n = Number(p?.stats?.[k]);
  return Number.isFinite(n) ? clamp(n, 1, 10) : 5;
};

/* A stable number from a name, so two queens with the same stats do not get
   the same past and the same craft. Not the game rng: this must survive a
   replay that draws a different number of times. */
function hashOf(s) {
  let h = 2166136261;
  for (const ch of String(s || '')) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
  return (h >>> 0) / 4294967295;
}

/* ── UNFINISHED BUSINESS ──────────────────────────────────────────────
   One line, chosen from where she actually stands rather than at random: the
   queen who came second wants the crown, the queen who went out first wants
   to be seen at all. This is the sentence the entrance is built on. */
function businessFor(rank, of, wins, name = '', { winsKnown = true } = {}) {
  const share = rank / Math.max(2, of);
  /* One line per SHAPE of season, and three ways to say each — four queens in
     a row all reading "she was good and it was not enough" was the premiere
     the first version produced. Which of the three is a stable function of
     her name, so it does not move between a replay and a screen. */
  const pick3 = list => list[Math.floor(hashOf(`${name}|biz`) * list.length) % list.length];
  if (rank === 1) {
    return pick3([
      'she has nothing to prove and everything to defend',
      'she already has one of these at home, which is its own kind of target',
      'she is the only queen here who knows exactly what winning costs',
    ]);
  }
  if (rank === 2) {
    return pick3([
      'she was one song away, and she has thought about it since',
      'she has been the runner-up for long enough to hate the word',
      'she lost it on the last night and has been rehearsing this one ever since',
    ]);
  }
  // A line about her wins is only available when the source can show them.
  if (winsKnown && wins >= 2) {
    return pick3([
      'she won more than anybody and still went home',
      'she has more wins than the queen who beat her, which still does not sit right',
      'she was the best in her season for a month and gone in a night',
    ]);
  }
  if (share <= 0.35) {
    return pick3([
      'she got close enough to taste it',
      'she made the end of her season and could not make the end of the sentence',
      'she was two rounds off and nobody remembers who is two rounds off',
      'she was in the conversation right up until she was not',
      'she has spent since then explaining how close it was to people who did not ask',
    ]);
  }
  if (share >= 0.8) {
    return pick3([
      'she went home before the room knew who she was',
      'she was gone early enough that her season is somebody else’s story',
      'she never got to show them the half of it',
    ]);
  }
  return pick3([
    'she was good and it was not enough',
    'she was fine, and fine is how you leave in the middle',
    'she did nothing wrong and went home anyway, which is worse',
    'she was never bad and never once the best, and the middle is where that ends',
    'she left with no story attached to her, which is the thing she came back to fix',
    'she watched it back and could not find the week she lost it',
  ]);
}

/** Her real record, from a stored season, or null.
 *
 * ── IT NEVER CLAIMS WHAT THE SOURCE CANNOT SHOW ──────────────────────
 * `winsKnown` is the important half. The franchise ledger counts a season's
 * competition wins from `immunityWinner` / `vetoWinner`, which are the other
 * shows' fields — a drag season stamps neither, so the ledger reports zero
 * maxi wins for every queen who ever played one. Asserting "with no wins at
 * all" off that would tell a former winner, on screen, that she never won
 * anything. So an unverifiable count is not a zero: it is silence, and the
 * line that would have said it is dropped instead.
 */
function realPast(name, seasons) {
  for (const s of seasons || []) {
    const list = s?.placements || [];
    const row = list.find(p => p?.name === name);
    if (!row) continue;
    const rank = Number(row.place) || list.length;
    const winsKnown = s.winsKnown !== false;
    const wins = Number(row.wins) || 0;
    return {
      real: true, season: Number(s.season) || 0, rank, of: list.length,
      wins, winsKnown,
      exit: rank === 1 ? 'crowned' : rank <= 3 ? 'finalist' : 'eliminated',
      business: businessFor(rank, list.length, winsKnown ? wins : 0, name, { winsKnown }),
    };
  }
  return null;
}

/**
 * What she did, before this.
 *
 * `seasons` is `[{ season, placements: [{ name, place, wins }] }]` — the shape
 * `dragPlacements` already produces. Absent, everything is invented.
 */
export function queenPast(player, { seasons = [], rng = null } = {}) {
  const name = player?.name || '';
  const real = realPast(name, seasons);
  if (real) return real;
  const h = rng ? rng() : hashOf(name);
  const h2 = hashOf(`${name}|of`);
  /* The field she came out of and where she landed in it. Her craft and her
     boldness pull the rank up; the room she was in is 8..14 queens. */
  const of = 8 + Math.floor(h2 * 7);
  const craft = dragOf(player);
  const strength = (DRAG_STATS.reduce((s, k) => s + craft[k], 0) / DRAG_STATS.length
    + stat(player, 'boldness')) / 2 / 10;
  // 2 is the ceiling: an invented past never crowns her.
  const rank = clamp(Math.round(of - (of - 2) * (strength * 0.7 + h * 0.3)), 2, of);
  const wins = rank <= 3 ? Math.round(strength * 2) : rank <= of / 2 ? Math.round(strength) : 0;
  return {
    real: false, season: 1 + Math.floor(hashOf(`${name}|season`) * 9), rank, of, wins,
    exit: rank <= 3 ? 'finalist' : 'eliminated',
    business: businessFor(rank, of, wins, name),
  };
}

/* ── THE CRAFT A QUEEN NOBODY AUTHORED WOULD OTHERWISE NOT HAVE ───────
   `dragOf` normalises every missing craft stat to 5, so a roster queen with
   no authored block plays a whole season with SEVEN FLAT FIVES — identical on
   the exact seven numbers that decide this show. Thirteen of those is not a
   cast, it is noise, and every result of the season means nothing.

   So craft is derived from the nine shared stats she does have, the way
   `expectedStyleFor` already derives a style: a blend per craft, plus a
   stable per-queen offset so seven crafts are not a linear function of nine
   stats and two queens with similar stats are not the same performer.
   AUTHORED ALWAYS WINS — this is only ever a fallback. */
const CRAFT_BLEND = {
  acting: ['social', 'mental'],
  comedy: ['social', 'boldness'],
  dance: ['physical', 'endurance'],
  design: ['mental', 'intuition'],
  runway: ['boldness', 'temperament'],
  lipsync: ['physical', 'boldness'],
  singing: ['intuition', 'temperament'],
};

export function derivedCraft(player) {
  const out = {};
  for (const k of DRAG_STATS) {
    const [a, b] = CRAFT_BLEND[k];
    const base = (stat(player, a) + stat(player, b)) / 2;
    const off = (hashOf(`${player?.name || ''}|${k}`) - 0.5) * 4;
    out[k] = clamp(Math.round(base + off), 1, 10);
  }
  return out;
}

/** Is her craft the flat default block — the failed cast this guards against? */
export function craftIsFlat(player) {
  const d = dragOf(player);
  return new Set(DRAG_STATS.map(k => d[k])).size <= 1;
}

/**
 * Every queen's past, frozen for the season.
 *
 * Called once at cast time and written onto the state, so nothing downstream
 * can re-derive a different answer.
 */
export function castPasts({ cast = [], seasons = [], seed = 1 } = {}) {
  const rng = rngFor(seed * 31 + 17);
  const out = {};
  for (const p of cast) out[p.name] = queenPast(p, { seasons, rng });
  return out;
}

// ══════════════════════════════════════════════════════════════════════
//  WHO SHE ALREADY KNOWS
// ══════════════════════════════════════════════════════════════════════
//
// An All Stars room is not a room of strangers, and that was the single
// biggest thing missing from the first pass: ten queens who had each done a
// season walked in, and not one of them had ever met. Every bond started at
// zero and the grudge term in js/dr/legacy.js measured 0.0% across forty
// seasons, because nothing ever wrote a grudge.
//
// ── THE ANCHOR IS A SHARED SEASON ─────────────────────────────────────
//
// Two queens who came out of the same season know each other, and that is
// true of an invented past as well as a real one — `queenPast` already gives
// every queen a season number, so the web exists without a single stored
// season in the franchise. Where a real season IS stored, the real thing wins:
// its allies and rivals are facts and these are inferences.
//
// What kind of history they have is derived from who they ARE — the same
// generosity read the arrivals already use — and is stable for the pair, so a
// replay tells the same story.
const HIST_NICE = new Set(['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat']);
const HIST_SHARP = new Set(['villain', 'mastermind', 'schemer', 'hothead', 'chaos-agent']);

/**
 * The history the room walks in with.
 *
 * Returns `[{ a, b, kind, season }]` where kind is:
 *   `friend`    they came out of that season close
 *   `rival`     they came out of it not speaking
 *   `sent-home` `a` beat `b` in the lip sync that ended her season
 *   `mates`     same season, no strong feeling either way
 *
 * `real` entries (from a stored season's ledger) are passed in by the caller
 * and always beat an inferred one for the same pair.
 */
export function sharedHistory({ cast = [], pasts = {}, players = {}, real = [] } = {}) {
  const out = [];
  const seen = new Set();
  const pairKey = (a, b) => [a, b].sort().join('|');
  for (const r of real) {
    if (!r?.a || !r?.b) continue;
    out.push({ ...r, real: true });
    seen.add(pairKey(r.a, r.b));
  }
  const names = cast.map(p => p?.name).filter(Boolean);
  for (let i = 0; i < names.length; i++) {
    for (let j = i + 1; j < names.length; j++) {
      const a = names[i]; const b = names[j];
      if (seen.has(pairKey(a, b))) continue;
      const pa = pasts[a]; const pb = pasts[b];
      if (!pa || !pb || pa.season !== pb.season) continue;
      /* ── A REAL SEASON IS NOT A PLACE TO INVENT ──────────────────
         If both of these queens actually played that season, then what
         happened between them is a matter of record, and anything this
         function made up could contradict it — "she beat me in the song that
         ended my season" is a specific claim about a lip sync that either
         happened or did not.
         So for a real pair the only history asserted is the history PASSED IN
         (`real`, from the stored season's own ledger, handled above). Falling
         through to here means the record has nothing on them, and the one
         thing still true is that they were in the same room that year. */
      if (pa.real && pb.real) {
        out.push({ a, b, kind: 'mates', season: pa.season, real: true });
        continue;
      }
      const A = players[a] || {}; const B = players[b] || {};
      const warmth = (HIST_NICE.has(A.archetype) ? 1 : 0) + (HIST_NICE.has(B.archetype) ? 1 : 0)
        - (HIST_SHARP.has(A.archetype) ? 1 : 0) - (HIST_SHARP.has(B.archetype) ? 1 : 0)
        + (stat(A, 'loyalty') + stat(B, 'loyalty')) / 10 - 1;
      const roll = hashOf(`${pairKey(a, b)}|hist`);
      /* SHE BEAT ME IN THE SONG THAT SENT ME HOME. Only one of them can carry
         it and it is the queen who finished higher, which is the only version
         of "you ended my season" this show has: there is no vote to blame. */
      const higher = pa.rank <= pb.rank ? a : b;
      const lower = higher === a ? b : a;
      /* `sent-home` IS CHECKED FIRST, and it does not care whether they liked
         each other. It is the most loaded history this format has — she is in
         a room with the queen who ended her season and now one of them may
         hold the lipstick — and gating it behind "and they also disliked each
         other" made it almost never happen: measured 0 grudges across a
         ten-queen room, which left the grudge term in js/dr/legacy.js dead at
         0.0%. Being beaten by a friend is its own story anyway. */
      let kind;
      if (roll < 0.34) kind = 'sent-home';
      else if (warmth <= -0.6) kind = 'rival';
      else if (warmth >= 0.6) kind = 'friend';
      else if (roll < 0.62) kind = warmth >= 0 ? 'friend' : 'rival';
      else kind = 'mates';
      out.push(kind === 'sent-home'
        ? { a: higher, b: lower, kind, season: pa.season }
        : { a, b, kind, season: pa.season });
    }
  }
  return out;
}

/** What that history is worth as a starting bond. */
export function historyBond(kind) {
  return { friend: 4, rival: -4, 'sent-home': -2, mates: 1 }[kind] || 0;
}

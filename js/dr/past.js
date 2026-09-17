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
function businessFor(rank, of, wins, name = '') {
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
  if (wins >= 2) {
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
  ]);
}

/** Her real record, from a stored season, or null. */
function realPast(name, seasons) {
  for (const s of seasons || []) {
    const list = s?.placements || [];
    const row = list.find(p => p?.name === name);
    if (!row) continue;
    const rank = Number(row.place) || list.length;
    return {
      real: true, season: Number(s.season) || 0, rank, of: list.length,
      wins: Number(row.wins) || 0,
      exit: rank === 1 ? 'crowned' : rank <= 3 ? 'finalist' : 'eliminated',
      business: businessFor(rank, list.length, Number(row.wins) || 0, name),
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

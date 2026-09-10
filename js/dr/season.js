// ══════════════════════════════════════════════════════════════════════
// dr/season.js — a whole season, with no UI
// ══════════════════════════════════════════════════════════════════════
//
// Plays start to finish from a seed, which is what makes a season re-airable:
// js/dr-run.js calls this once, queues the rows, and hands one to the screen
// per press. Nothing here touches `gs` or the DOM.
import { initDragState, refreshStar } from './state.js';
import { runAudienceVote } from '../audience.js';
import { renderFinaleBeats, insertCongenialityScene } from './finale.js';
import { PARTNER_COHORTS } from './chal/makeover.js';
import { RETURNEE_BEATS } from './data/returnee-beats.js';
import { SPLIT_BEATS } from './data/split-beats.js';
import { runReunion } from './reunion.js';
import { smackdownScenes } from './smackdown.js';
import { alumniPool } from '../alumni.js';
import { runDragWeek } from './week.js';
import { assignStorylines, recordBeat, arcSummary, popSnapshot } from './storylines.js';
import { MAXI_TYPES, TENTPOLES, maxiById } from './data/challenges.js';
import { MINI_TYPES } from './data/minis.js';
import { JUDGES } from './data/judges.js';
import { SONGS } from './data/songs.js';
import { RUNWAY_CATEGORIES } from './data/runways.js';
import { rngFor, streamFor } from './rng.js';
import { assignDragFamilies } from './family.js';
import { panelFor } from './judges.js';
import { performQueen } from './perform.js';
import { judgeViews, panelRanking, hostBend } from './judging.js';
import { lipsyncScore, lipsyncCall } from './lipsync.js';

/** How many queens are left standing when the finale begins. */
export const FINALE_SIZE = { top4: 4, top3: 3, top2: 2, 'perform-then-lipsync': 4, 'perform-then-lipsync-3': 3 };

// What episode one IS, when it is not simply the first ordinary week.
const PREMIERE_MAXI = {
  'talent-show': 'talent-show',
  design: 'design',
  runway: 'runway-challenge',
  'girl-groups': 'girl-group',
  // A porkchop premiere is a runway-only night that still sends somebody home,
  // which is the whole point of the name.
  porkchop: 'runway-challenge',
};

const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];

/** Weeks before the finale: one queen leaves each. */
export function episodesFor(castSize, finaleType = 'top4') {
  return Math.max(1, castSize - (FINALE_SIZE[finaleType] || 4));
}

/**
 * The season's running order.
 *
 * Pins from the timeline are kept exactly; the gaps are filled with three
 * rules, in this order of priority:
 *
 *   1. the six tentpoles happen once each, spread through the middle of the
 *      season — never episode one and never the last two, because a Snatch
 *      Game on the premiere has no established queens to be funny about;
 *   2. no two adjacent episodes share a chalStyle, so the season does not run
 *      three design weeks together;
 *   3. a challenge that needs more queens than will still be there is not
 *      booked at all.
 */
/* ── WHO IS FAMOUS ENOUGH TO JUDGE ──
   This universe has no celebrities outside its own reality shows, so a guest
   judge is somebody the audience already watched.

   FAME, NOT A RANKING TIER. The first version used `tier` — S+/S/A off the
   ranking board — and that is the wrong question. A tier grades how WELL
   somebody played, so a quiet winner outranks a memorable disaster; it is
   right for a leaderboard and wrong for "would anybody recognise her". The
   franchise has an actual fame stat, js/fame.js: 0-5 stars, derived from what
   a person did on screen, decaying while they are off it and locking at five.

   1.5 is `Cult Following`, the first rating whose own name says an audience
   exists. Measured on the current ledger: Icon and above is one person,
   Household Name and above is eight — too thin for a ten-episode season to
   draw from without repeating a face every other week — and Cult Following is
   thirty-seven, which is a rotation. Raise it as the franchise grows. */
const FAMOUS_STARS = 1.5;

// Same rule js/dr/week.js uses, and deliberately a copy of one line rather
// than a new import between two files that do not otherwise depend on
// each other.
const _slugOf = n => String(n || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');

export function buildSchedule({ episodes, castSize, pinned = [], rng = Math.random,
  premiere = 'standard', cast = [], seed = null }) {
  /* -- ONE STREAM PER EPISODE, NOT ONE WALKING THE WHOLE SEASON --
     This used to draw everything -- the tentpole shuffle, then every week's
     filler challenge, mini, judge, guest and song, in episode order -- off a
     single generator handed in by the caller. That made each decision depend on
     how many numbers the decisions BEFORE it happened to take, so pinning the
     Ball onto episode five changed episode two's challenge, episode six's guest
     judge, and the season's entire play stream downstream of it. A pin
     therefore could not be applied to a season already in progress: the re-book
     silently rewrote weeks that had already aired.

     Given a `seed`, the schedule takes its own dice and every episode takes its
     own, so a change to one week moves that week and nothing else. With no seed
     it falls back to the shared `rng` and behaves exactly as it always did --
     which is what every headless caller and every test passes. */
  const own = seed != null;
  const sRng = own ? streamFor(seed, 7) : rng;
  const epRng = (e, salt = 1000) => (own ? streamFor(seed, salt + e) : rng);
  const rotating = JUDGES.filter(j => !j.permanent).map(j => j.id);

  /* ── THE GUEST JUDGE, WHICH HAD NEVER ONCE APPEARED ──
     `guest` was `pin.guest || null` and NOTHING EVER PINNED ONE. There is no
     field for it in the episode designer and no roll anywhere, so the value
     was null in every episode of every season ever played — while
     `guestTaste()` derived a full taste profile from an alumnus's stats,
     `panelFor` accepted a guest seat, the exporter carried `dr.guest`, and
     stage-beats.js held four written lines for `guest` and four more for
     `guest-credited`. Written, wired, and reachable only from an author pin
     nobody writes: this project's signature bug class, and it read on screen
     as "guest: none".

     Drawn once per season and dealt across the episodes, so a season has a
     rotation of faces rather than the same person every week. Deterministic
     off the season rng, so a replay is the same season.

     NO DATABASE, NO GUESTS. `alumniPool` returns [] when nothing has loaded
     the player record — which is every headless tool and most tests — and an
     empty pool leaves `guest: null`, exactly as before. That is the honest
     fallback: a franchise with no history has nobody famous in it yet. */
  const castNames = (cast || []).map(p => p && p.name).filter(Boolean);
  /* THE WHOLE FRANCHISE, NOT THIS SHOW'S OWN ALUMNI. Scoped to drag-race the
     famous pool is FOUR people and a season cycles the same two faces; across
     the franchise it is forty-three. That is also the truer reading of the
     rule this file opens with — the universe has no celebrities outside its
     reality shows, and it does not say they have to be drag queens. */
  const famous = alumniPool({ exclude: castNames })
    .filter(a => a && Number(a.fameStars) >= FAMOUS_STARS);

  /* HER ARCHETYPE AND HER STATS, WHICH THE POOL DOES NOT CARRY.
     `guestTaste` reads `player.archetype` for ARCH_BIAS and `player.stats`
     for the four taste weights and her warmth — hand it a bare pool entry and
     every guest is the same neutral seat with no style bias at all, which is
     a guest judge in name only. The roster row has both. Read off the global
     for the same reason `alumniDatabase()` does: this file is a leaf and must
     not import the cast builder. */
  const _roster = (typeof globalThis !== 'undefined' && globalThis.FRANCHISE_ROSTER) || [];
  const rosterOf = name => _roster.find(r => r && r.name === name) || null;

  /* AND WHERE WE KNOW HER FROM, derived from the ledger rather than invented.
     week.js used to say a credit could only be authored, because "there is no
     deriving 'the winner of the ninth season' from a roster row". There is
     now: the appearance record states the season and the placement, so the
     host can say it and be right. He still says nothing when the record does
     not know. */
  const creditFor = a => {
    if (!a) return '';
    /* THE SEASON THE PLACEMENT HAPPENED IN, not the most recent one. Pairing
       `winner` (best placement ever) with `seasonName` (last appearance) put
       two different alumni on screen as "the winner of Total Drama 13",
       neither of whom won it. `bestSeasonName` is the season the record
       belongs to; with no placement to name, the host says where she is from
       and claims nothing. */
    const where = a.bestSeasonName || a.seasonName;
    if (!where) return '';
    if (a.winner) return `the winner of ${where}`;
    if (a.finalist) return `a finalist on ${where}`;
    return a.seasonName ? `from ${a.seasonName}` : '';
  };

  /* ── A NEW FACE BEFORE A FAMILIAR ONE ──
     The bag below stops anybody appearing twice in one season. This stops the
     same names appearing every season: a queen who has judged four times is
     weighted a fifth as heavily as one who never has, so the show reaches for
     somebody it has not used yet and a serial judge becomes an exception
     rather than a fixture. Never zero — a favourite can come back, she just
     has to win the draw against fresher faces. */
  const guestWeight = a => 1 / (1 + (Number(a.timesJudged) || 0));
  const pickWeighted = (bag, r) => {
    const total = bag.reduce((t, a) => t + guestWeight(a), 0);
    if (!total) return Math.floor(r() * bag.length);
    let roll = r() * total;
    for (let i = 0; i < bag.length; i++) {
      roll -= guestWeight(bag[i]);
      if (roll <= 0) return i;
    }
    return bag.length - 1;
  };

  const guestBag = famous.slice();
  const drawGuest = dice => {
    if (!guestBag.length) {
      if (!famous.length) return null;
      guestBag.push(...famous);          // a long season may go round twice
    }
    const a = guestBag.splice(pickWeighted(guestBag, dice), 1)[0];
    if (!a) return null;
    const r = rosterOf(a.name);
    return {
      name: a.name,
      slug: (r && r.slug) || _slugOf(a.name),
      archetype: (r && r.archetype) || null,
      stats: (r && r.stats) || null,
      credit: creditFor(a),
      fameStars: a.fameStars,
    };
  };
  const byEp = Object.fromEntries(
    pinned.filter(p => p && p.episode != null).map(p => [Number(p.episode), p]));

  const used = new Set();
  for (const p of Object.values(byEp)) if (p.maxiId) used.add(p.maxiId);

  /* ── WHERE THE TENTPOLES LAND ──
     Anything already pinned is not booked twice.

     AND WHEN THEY DO NOT ALL FIT, THE ONE THAT MISSES OUT IS DRAWN. There
     are six tentpoles and only episodes 2..N-2 can hold one, so a season
     shorter than fourteen queens has fewer slots than tentpoles and somebody
     has to be left out. This walked TENTPOLES in array order and broke when
     the slots ran out, so the ARRAY'S OWN ORDER decided who was cut — the
     same challenge, every season, for every seed. Measured over 20 seasons
     per cast size:

       cast 12 (8 eps, 5 slots): the Rusical missed 20 times out of 20
       cast 10 (6 eps, 3 slots): Makeover, Roast and Rusical, 20 out of 20
       cast  8 (4 eps, 1 slot):  only the Snatch Game EVER happened

     So the Rusical was unreachable on a twelve-queen season and four of the
     six were unreachable on an eight — not rare, absent.

     THE FOUR BURNED DRAWS ARE LOAD-BEARING. See js/dr/rng.js: the LCG's
     first draw is a linear function of the seed, so a fresh stream opens on
     almost the same number every time and Math.floor(rng() * 6) is 1 for
     every seed from 1 to 20. The schedule is the first thing a season
     decides, so it reads that unmixed head — and the shuffle put the same
     tentpole last in all forty seasons, which is the bug it was added to
     fix. Four draws in, the stream is mixed. */
  const tentpolesLeft = TENTPOLES.filter(t => !used.has(t));
  // `streamFor` burns its own four; the shared-rng fallback still has to.
  if (!own) { rng(); rng(); rng(); rng(); }
  for (let i = tentpolesLeft.length - 1; i > 0; i--) {
    const j = Math.floor(sRng() * (i + 1));
    [tentpolesLeft[i], tentpolesLeft[j]] = [tentpolesLeft[j], tentpolesLeft[i]];
  }
  const slots = [];
  for (let e = 2; e <= episodes - 2; e++) if (!byEp[e]?.maxiId) slots.push(e);
  const tentpoleAt = {};
  for (const t of tentpolesLeft) {
    if (!slots.length) break;
    const i = Math.floor(sRng() * slots.length);
    tentpoleAt[slots.splice(i, 1)[0]] = t;
  }

  const out = [];
  let prevStyle = null;
  for (let e = 1; e <= episodes; e++) {
    const pin = byEp[e] || {};
    const alive = castSize - (e - 1);
    // This week's own dice. Every draw below comes off it, so what episode five
    // rolls does not depend on what episode four decided.
    const er = epRng(e);

    let maxiId = pin.maxiId
      || (e === 1 && PREMIERE_MAXI[premiere])
      || tentpoleAt[e]
      || null;

    if (!maxiId) {
      const fits = m => m.minCast <= alive;
      const fresh = MAXI_TYPES.filter(m => !m.tentpole && !used.has(m.id) && fits(m) && m.chalStyle !== prevStyle);
      const repeatable = MAXI_TYPES.filter(m => !m.tentpole && fits(m) && m.chalStyle !== prevStyle);
      const anything = MAXI_TYPES.filter(fits);
      const pool = fresh.length ? fresh : repeatable.length ? repeatable : anything.length ? anything : MAXI_TYPES;
      maxiId = pick(er, pool).id;
    }

    used.add(maxiId);
    prevStyle = maxiById(maxiId)?.chalStyle ?? null;

    out.push({
      _style: prevStyle,
      episode: e,
      maxiId,
      // `miniId` is deliberately checked with `in`: null is a real choice
      // meaning "no mini this week", and undefined means "roll one".
      miniId: 'miniId' in pin ? pin.miniId : pick(er, MINI_TYPES).id,
      rotatingId: pin.rotatingId || rotating[(e - 1) % rotating.length],
      /* THREE ANSWERS, and `in` is what tells them apart — the same check
         `miniId` above uses, and for the same reason. A pinned guest wins.
         An explicit null is an author saying the panel is four seats tonight
         and must not be overruled by a roll. Undefined means nobody chose, so
         the show books one — not every week, because the panel is a fixed
         four often enough that a guest should feel like an occasion rather
         than a chair that is always full. */
      guest: 'guest' in pin ? pin.guest : (er() < 0.7 ? drawGuest(er) : null),
      songTitle: pin.songTitle || pick(er, SONGS).title,
      // A category per week, and never the same one twice in a season: the
      // runway is the one thing a viewer sees every single episode, so a
      // repeat is more noticeable here than anywhere else.
      runwayCategory: pin.runwayCategory || null,
      /* THE MAKEOVER'S PARTNERS. Seven cohorts are authored — superfans,
         veterans, seniors, athletes, the pit crew, loved ones, and the
         queens already sent home — and NOTHING EVER SET THIS. The module
         reads `cfg.makeoverPool`, no writer existed, so every makeover in
         every season was superfans, six cohorts were dead data, and the
         `reunion` event, which needs a partner who is herself a queen, could
         not fire: measured at nought across twenty-five seasons.
         The eliminated cohort waits until enough queens are out to make a
         pool of it, which is also when the show would use it. */
      /* AND WHICH SHOW THE CROSSOVER DRAWS FROM, when the author booked one.
         Null means the season picks, the same three-answer shape `guest` and
         `miniId` use — and a field the schedule does not carry is a control
         that silently does nothing, which is how `makeoverPool` itself spent
         its first life. */
      makeoverShow: pin.makeoverShow || null,
      makeoverPool: pin.makeoverPool
        || (maxiId === 'makeover'
          ? pick(er, e >= 5 ? PARTNER_COHORTS
            : PARTNER_COHORTS.filter(c => c !== 'eliminated'))
          : null),
      /* AND THE WEEK'S OWN SHAPE. Every field above is a piece of CONTENT the
         author can pin; this is the one that changes what the week DOES, and
         it has to survive the build or the schedule entry reaches the season
         loop without it and the twist silently does not happen. */
      ...(pin.legacy ? { legacy: true } : {}),
      ...(pin.rateAQueen ? { rateAQueen: true } : {}),
      ...(pin.critiqueTwist ? { critiqueTwist: pin.critiqueTwist } : {}),
      ...(pin.noElimination ? { noElimination: true } : {}),
      ...(pin.doubleElimination ? { doubleElimination: true } : {}),
      ...(pin.bottomThree ? { bottomThree: true } : {}),
      /* A RETURNING QUEEN, and the name she was booked with. The name is
         carried even when it is empty: an absent `returneeName` means the
         show picks, which is a real choice and not a missing one. */
      ...(pin.returnee ? { returnee: true, returneeName: pin.returneeName || null } : {}),
      ...(pin.ggFormat ? { ggFormat: pin.ggFormat } : {}),
      ...(pin.ggThemeId ? { ggThemeId: pin.ggThemeId } : {}),
    });
  }

  // ── THE ADJACENCY REPAIR ──────────────────────────────────────────
  //
  // The fill loop above avoids repeating a style, but the TENTPOLES were
  // placed before it ran and it cannot move them: two of the six can land next
  // to each other, or beside a filler that shares their style, and the season
  // runs two comedy weeks back to back. So the sequence is repaired
  // afterwards, swapping a clashing episode with the nearest later one that
  // fits in both directions. Pinned episodes are never moved — an author's
  // choice outranks the pacing rule.
  const pinnedEps = new Set(Object.keys(byEp).map(Number));
  for (let i = 1; i < out.length; i++) {
    if (out[i]._style !== out[i - 1]._style) continue;
    if (pinnedEps.has(out[i].episode)) continue;
    for (let j = i + 1; j < out.length; j++) {
      if (pinnedEps.has(out[j].episode)) continue;
      const fitsHere = out[j]._style !== out[i - 1]._style
        && (i + 1 >= out.length || out[j]._style !== out[i + 1]._style);
      const fitsThere = out[i]._style !== out[j - 1]._style
        && (j + 1 >= out.length || out[i]._style !== out[j + 1]._style);
      if (!fitsHere || !fitsThere) continue;
      const a = out[i];
      const b = out[j];
      // Swap the CHALLENGE only. The judge, the song and the guest belong to
      // the night, not to the challenge, and an author who pinned a guest to
      // episode six meant episode six.
      [a.maxiId, b.maxiId] = [b.maxiId, a.maxiId];
      [a._style, b._style] = [b._style, a._style];
      break;
    }
  }
  for (const e of out) delete e._style;

  const catPool = RUNWAY_CATEGORIES.map(c => c.label)
    .filter(l => !out.some(e => e.runwayCategory === l));
  for (const e of out) {
    if (e.runwayCategory) continue;
    if (!catPool.length) catPool.push(...RUNWAY_CATEGORIES.map(c => c.label));
    // A second salt: this pass runs after the loop above and must not re-spend
    // the numbers that episode already drew.
    e.runwayCategory = catPool.splice(
      Math.floor(epRng(e.episode, 4000)() * catPool.length), 1)[0];
  }

  return out;
}

/**
 * Record what the week did to the arcs, then hand the row straight back.
 *
 * `cast` is not optional in practice: the variant tests read her drag stats and
 * her style, and without the real player objects every one of them sees a queen
 * of straight fives.
 */
/**
 * The scenes for a queen walking back into the competition.
 *
 * Emitted here rather than inside runDragWeek because a return changes only
 * WHO IS IN THE ROOM — the week engine runs identically either way, and
 * teaching it about a twist it does not need to know about is how a week
 * engine ends up with a branch per twist.
 *
 * An unwritten tier emits nothing rather than an empty card, so the schema
 * ships ahead of the prose and the twist still works: she is in the room and
 * on the chart from the moment it is booked, with or without the words.
 */
function returnScenes(returned, { living, rng = Math.random }) {
  const beatById = id => RETURNEE_BEATS.find(b => b.id === id);
  const fill = (line, a, b) => String(line || '')
    .replace(/\{a\}/g, a || '').replace(/\{b\}/g, b || '');
  const scenes = [];
  const name = returned.name;
  // Whoever reaches her first: somebody already in the room, never herself.
  const others = (living || []).filter(n => n !== name);
  const greeter = others.length ? others[Math.floor(rng() * others.length)] : null;

  const push = (id, tierId, players, extra = {}) => {
    const b = beatById(id);
    const t = b?.tiers?.find(x => x.id === tierId) || b?.tiers?.[0];
    if (!t?.lines?.length) return;
    const line = t.lines[Math.floor(rng() * t.lines.length)];
    scenes.push({
      step: 'return',
      kind: `return:${b.id}`,
      data: { beat: b.id, tier: t.id, players, note: t.note, ...extra },
      text: fill(line, players[0], players[1]),
    });
  };

  /* WHICH KIND OF RETURN IT IS, read off how long she has been gone. The
     early boot nobody has seen since the premiere is walking back in against
     a different room from the queen who left last week. */
  const gap = Number(returned.gap) || 0;
  const howLong = gap >= 4 ? 'early' : gap >= 2 ? 'mid' : 'late';

  push('return-door', 'door', []);
  push('return-walk', howLong, [name]);
  push('return-room', 'room', [name, greeter].filter(Boolean));
  push('return-rule', 'rule', [name], { honoured: returned.honoured });
  return scenes;
}

function beat(state, row, cast) {
  state.storylines = recordBeat(state.storylines || [], {
    episode: row.num, row, state, cast,
  });
  return row;
}

function weekCfg(sch, config, num, extra = {}) {
  return {
    num,
    maxiId: sch.maxiId,
    miniId: sch.miniId,
    rotatingId: sch.rotatingId,
    guest: sch.guest,
    songTitle: sch.songTitle,
    runwayCategory: sch.runwayCategory,
    makeoverPool: sch.makeoverPool || null,
    // Which show the crossover partners come from. js/dr/chal/makeover.js
    // reads it; without this line the picker was decoration.
    makeoverShow: sch.makeoverShow || null,
    judgeWeights: config.drJudgeWeights || {},
    immunity: !!config.drImmunity,
    // The arcs need to know how far through the season they are: what the
    // frontrunner wants in week two is not what she wants in week eight.
    totalEpisodes: extra.totalEpisodes || 12,
    // Defaults ON: an unset value means the format's ordinary rule applies.
    allowDoubleShantay: config.drDoubleShantay !== false,
    allowDoubleSashay: !!config.drDoubleSashay,
    tripleOnTie: !!config.drTripleLipsync,
    // The floor a paid-back double shantay must never breach: a week may not
    // empty the room below the size the finale needs.
    finaleSize: FINALE_SIZE[config.drFinale || 'top4'] || 4,
    ...extra,
  };
}

/** One lip sync between two finalists. No bend: the crown is won on the stage. */
/* ── WHAT A SEASON IS WORTH, ON THE LAST NIGHT ──
   Points per episode: a win is worth two of a high, and the bottom costs.
   Divided by the length of the record so a queen who lasted longer is not
   credited for the lasting itself — she is already in the finale, which is
   the reward for that. This measures how well she was DOING, not how long. */
const RECORD_POINTS = { WIN: 2, HIGH: 1, SAFE: 0, LOW: -0.5, BTM: -1, BTM2: -1.25 };

/* HOW HARD THE SEASON PULLS AT A FINALE. Shared by the cut (the panel's
   view of the showcase) and the crown duel, so the two cannot drift apart.
   Tuned against tools/dr-finale-audit.mjs, whose header states the target
   exactly: the question is not "does the best résumé win" — that would be a
   chart with a lip sync stapled on — but "does it help, and can it still be
   beaten". */
export const RESUME_SCALE = 1.35;
export const RESUME_CLAMP = 2.3;

export function recordStrength(record = []) {
  const rated = record.filter(r => r in RECORD_POINTS);
  if (!rated.length) return 0;
  return rated.reduce((n, r) => n + RECORD_POINTS[r], 0) / rated.length;
}

/**
 * The lip sync, and on the last night the season behind it.
 *
 * A WEEKLY lip sync ignores all of this on purpose: the panel has already
 * spoken, these two are the bottom two, and letting a good résumé save
 * somebody there would be the show overruling its own judgement twice.
 *
 * THE FINALE IS DIFFERENT and used to ignore it too, which produced a winner
 * with zero maxi challenge wins in 20 of 40 measured seasons — a queen could
 * run the whole season and lose the crown to somebody who peaked once, for
 * three minutes. Now the crown reads three things: how she lip synced (the
 * biggest term, because it is a lip sync), how her showcase went tonight, and
 * how she had been doing all season. Weighted, never decisive: the edges are
 * clamped well under the ±2.5 noise already inside `lipsyncScore`, so the
 * underdog who turns it out on the night still takes it.
 */
function duel(state, a, b, ctx, song, finale = null) {
  const sa = lipsyncScore({ player: ctx.players[a], song, lipsyncRecord: state.lipsyncRecord[a], rng: ctx.rng });
  const sb = lipsyncScore({ player: ctx.players[b], song, lipsyncRecord: state.lipsyncRecord[b], rng: ctx.rng });

  const edge = {};
  if (finale) {
    const { showcase = {}, field = [] } = finale;
    const recAvg = field.length
      ? field.reduce((n, x) => n + recordStrength(state.record[x] || []), 0) / field.length : 0;
    const showVals = field.map(x => Number(showcase[x]) || 0);
    const showAvg = showVals.length ? showVals.reduce((n, x) => n + x, 0) / showVals.length : 0;
    const clamp = (v, m) => Math.max(-m, Math.min(m, v));
    for (const n of [a, b]) {
      /* THE RESUME TERM HAS TO OUT-PULL THE ASSASSIN. `lipsyncScore` pays a
         confidence bonus for past lip sync wins, and a queen only banks it by
         being in the bottom — so the two terms point in opposite directions
         and at ±1.4 they simply cancelled. Measured over 400 seasons per
         format, the best resume was winning a top two 46% of the time against
         a 50% chance line: still anti-correlated after the first attempt. The
         lip sync assassin is a real and wanted archetype, so the answer is to
         out-weigh her rather than delete her.
         THAT BONUS IS NOW +0.4 AND NO LONGER ACCUMULATES (it was +0.4 per win
         to a cap of +1.2, which let a queen survive five lip syncs in a row —
         see the note in js/dr/lipsync.js). These constants were measured
         against the old, larger version, so they are if anything now more than
         enough; they are left as they are because the audit's targets still
         read correctly, not because nobody looked. */
      // THE SAME TWO CONSTANTS THE CUT USES. They were written out here and
      // the cut had none at all; now both read the season through one rule,
      // so tuning one cannot silently leave the other behind.
      edge[n] = clamp((recordStrength(state.record[n] || []) - recAvg) * RESUME_SCALE, RESUME_CLAMP)
        + clamp(((Number(showcase[n]) || 0) - showAvg) * 0.24, 1.3);
    }
    sa.score += edge[a] || 0;
    sb.score += edge[b] || 0;
  }

  const winner = sa.score >= sb.score ? a : b;
  const loser = winner === a ? b : a;
  state.lipsyncRecord[winner].push('W');
  state.lipsyncRecord[loser].push('L');
  return {
    a, b, song: song.title, artist: song.artist,
    scores: { [a]: Math.round(sa.score * 100) / 100, [b]: Math.round(sb.score * 100) / 100 },
    beats: { [a]: sa.beats, [b]: sb.beats },
    // Shown, not hidden: a screen that says why she won has to be able to.
    ...(finale ? { edge: { [a]: Math.round((edge[a] || 0) * 100) / 100,
      [b]: Math.round((edge[b] || 0) * 100) / 100 } } : {}),
    winner, loser,
  };
}


/** What the winner of the Smackdown is actually called. */
const TITLE = 'Queen of She Done Already Done Had Herses';

/**
 * The reunion Smackdown, which is not a maxi challenge.
 *
 * Checked on the wiki, and it is a genuinely separate thing from the
 * LaLaPaRuZa that runs as a challenge during the season: this one happens at
 * the reunion, one week before the finale, and it is EXCLUSIVE TO NON-
 * FINALISTS. Every queen the season already sent home comes back and lip syncs
 * in a bracket, and the winner takes a title rather than a place in the final.
 *
 * So it decides nothing about the crown, which is exactly why it is worth
 * having: it is the one night the eliminated queens are the show, and a queen
 * who went home fourth can leave the season with something.
 */
export function runSmackdown(state, cfg, ctx) {
  const { players, bond } = ctx;
  // ITS OWN STREAM, and this is not tidiness. Drawing from the season's rng
  // would consume draws before the finale and change who gets crowned — a
  // measured fact, not a worry: with a shared stream, turning the Smackdown on
  // changed the winner of seed 1 from Q11 to Q10. An optional side event that
  // decides the season is the worst kind of bug, because it looks like a
  // feature working.
  const rng = rngFor((cfg.seed || 1) * 7919 + 424242);
  const field = [...(state.out || [])].filter(n => players[n]);
  if (field.length < 2) return null;

  // Fatigue: each lip sync costs stamina, shared with the LaLaPaRuZa.
  const FATIGUE_CURVE = [1.0, 0.88, 0.78, 0.65, 0.52];
  const fatigue = n => FATIGUE_CURVE[Math.min(lipsyncCount[n] || 0, FATIGUE_CURVE.length - 1)];
  const lipsyncCount = Object.fromEntries(field.map(n => [n, 0]));
  const wins = Object.fromEntries(field.map(n => [n, 0]));
  const duels = [];
  let alive = [...field].sort(() => rng() - 0.5);
  let round = 1;
  let guard = 0;

  // Strategy: same logic as the LaLaPaRuZa — bold queens target rivals or
  // front-runners, nice queens pick the weakest lip syncer.
  const NICE_SET = new Set(['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat']);
  const VILLAIN_SET = new Set(['villain', 'mastermind', 'schemer']);
  const dragOf = p => p?.drag || {};
  const _ppeW = { WIN: 5, HIGH: 4, SAFE: 3, LOW: 2, BTM: 1, BTM2: 1 };
  const ppe = n => {
    const r = state.record?.[n] || [];
    return r.length ? r.reduce((s, x) => s + (_ppeW[x] ?? 0), 0) / r.length : 3;
  };

  const pickOpponent = (chooser, pool) => {
    const p = players[chooser];
    const bold = (Number(p?.stats?.boldness) || 5) / 10;
    const arch = p?.archetype;
    if (!NICE_SET.has(arch) && rng() < bold * 0.5) {
      const rival = pool.reduce((w, n) => ((bond(chooser, n) || 0) < (bond(chooser, w) || 0) ? n : w), pool[0]);
      if ((bond(chooser, rival) || 0) <= -3) return { choice: rival, strategy: 'rival' };
      if (VILLAIN_SET.has(arch)) {
        const sorted = [...pool].sort((a, b) => ppe(b) - ppe(a));
        return { choice: sorted[0], strategy: 'frontrunner' };
      }
    }
    const sorted = [...pool].sort((a, b) => (dragOf(players[a]).lipsync || 5) - (dragOf(players[b]).lipsync || 5));
    return { choice: sorted[0], strategy: 'safe' };
  };

  while (alive.length > 1 && guard++ < 20) {
    const next = [];
    const roundPool = [...alive].sort(() => rng() - 0.5);
    const used = new Set();
    const isOdd = roundPool.length % 2 === 1 && roundPool.length >= 3;
    for (let i = 0; i < roundPool.length; i++) {
      const chooser = roundPool[i];
      if (used.has(chooser)) continue;
      used.add(chooser);
      const available = roundPool.filter(n => !used.has(n));
      if (!available.length) { next.push(chooser); break; }

      // When odd count, the last 3 unpaired queens do a triple lip sync
      if (isOdd && available.length === 2) {
        const names = [chooser, ...available];
        for (const n of available) used.add(n);
        const song = SONGS[Math.floor(rng() * SONGS.length)];
        const entries = names.map(n => {
          const fat = fatigue(n);
          const sc = lipsyncScore({ player: players[n], song, lipsyncRecord: state.lipsyncRecord?.[n] || [], rng });
          const adj = sc.score * fat;
          lipsyncCount[n] = (lipsyncCount[n] || 0) + 1;
          return { name: n, raw: sc.score, fatigue: fat, adjusted: Math.round(adj * 100) / 100 };
        });
        entries.sort((x, y) => y.adjusted - x.adjusted);
        const winner = entries[0].name;
        wins[winner]++;
        duels.push({
          round, triple: true,
          contestants: entries.map(e => e.name),
          a: entries[0].name, b: entries[entries.length - 1].name,
          chosen: true, strategy: null,
          song: song.title, artist: song.artist,
          scores: Object.fromEntries(entries.map(e => [e.name, e.raw])),
          fatigue: Object.fromEntries(entries.map(e => [e.name, e.fatigue])),
          adjusted: Object.fromEntries(entries.map(e => [e.name, e.adjusted])),
          winner, loser: entries[entries.length - 1].name,
        });
        next.push(winner);
        break;
      }

      const { choice: opponent, strategy } = pickOpponent(chooser, available);
      used.add(opponent);
      const song = SONGS[Math.floor(rng() * SONGS.length)];
      const sa = lipsyncScore({ player: players[chooser], song, lipsyncRecord: state.lipsyncRecord?.[chooser] || [], rng });
      const sb = lipsyncScore({ player: players[opponent], song, lipsyncRecord: state.lipsyncRecord?.[opponent] || [], rng });
      const adjA = sa.score * fatigue(chooser);
      const adjB = sb.score * fatigue(opponent);
      const call = lipsyncCall({
        a: { name: chooser, score: adjA }, b: { name: opponent, score: adjB },
      });
      wins[call.winner]++;
      lipsyncCount[chooser] = (lipsyncCount[chooser] || 0) + 1;
      lipsyncCount[opponent] = (lipsyncCount[opponent] || 0) + 1;
      duels.push({
        round, a: chooser, b: opponent, chosen: true, strategy,
        song: song.title, artist: song.artist,
        scores: { [chooser]: sa.score, [opponent]: sb.score },
        fatigue: { [chooser]: fatigue(chooser), [opponent]: fatigue(opponent) },
        adjusted: { [chooser]: Math.round(adjA * 100) / 100, [opponent]: Math.round(adjB * 100) / 100 },
        winner: call.winner, loser: call.loser,
      });
      next.push(call.winner);
    }
    alive = next;
    round++;
  }

  const champion = alive[0] || null;
  if (champion) {
    state.smackdownWinner = champion;
    state.popularity[champion] = (state.popularity[champion] || 0) + 6;
  }

  return {
    num: cfg.num,
    format: 'drag-race',
    eliminated: null,
    exits: [],
    dr: {
      ep: cfg.num,
      challenge: { id: 'smackdown', name: 'The Lip Sync Smackdown', format: 'solo', stage: 'main' },
      mini: null, judges: [], guest: null,
      smackdown: { field, duels, winner: champion, title: TITLE },
      popularity: popSnapshot(state),
      storylines: arcSummary(state.storylines || []),
      storylineNeed: {},
      record: JSON.parse(JSON.stringify(state.record)),
      living: [...state.living],
      /* THE NIGHT, NARRATED. Every one of these carried `text: ''` and there
         was no screen to draw them on either, so an episode with a full
         eight-queen bracket in its data arrived with nothing on it at all.
         Its own step (`smackdown`), because a smackdown is not a main stage:
         no runway, no panel, no critique, nobody going home. */
      /* `expectedOf` IS HOW FAR SHE GOT. `state.out` is pushed in elimination
         order, so a later index means she lasted longer and is the favourite
         going into a duel. Without it the builder fell back to the bracket's
         own seeding order, which is arbitrary — and three of seven duels came
         back reading as upsets, which makes an upset mean nothing. */
      scenes: smackdownScenes({
        field, duels, champion, title: TITLE, rng,
        expectedOf: n => (state.out || []).indexOf(n),
      }),
    },
  };
}


/**
 * The finale.
 *
 * Four shapes, all ending in a lip sync because that is what this show does.
 * The host does not bend a finale: everything he could lean on has already
 * happened, and a crown decided by an agenda rather than by the stage is the
 * one result an audience would never forgive.
 */
export function runFinale(state, cfg, ctx) {
  const { rng } = ctx;
  const type = cfg.type || 'top4';
  const finalists = [...state.living].sort(() => rng() - 0.5);
  const song = () => pick(rng, SONGS);
  const rounds = [];
  let placements = [];
  /* WHO NEVER GOT TO SING. On a bracket every finalist lip syncs and the
     losers lost on the stage, so there is no cut and claiming one would put a
     scene on the screen describing a thing the season did not do. Only
     `perform-then-lipsync` narrows the field before the songs. */
  let cutQueens = [];

  /* THE SHOWCASE, WHICH EVERY FINALE HAS AND ONLY ONE FORMAT SCORES BY.
     On the modern night the individual original numbers ARE the maxi
     challenge and they decide the top two; on the S9 bracket the crown came
     out of lip syncs alone and the numbers were a showcase. So it is
     performed and shown on every format, and `perform-then-lipsync` is the
     only one allowed to cut on it. Faithful, and it also means the screen
     never implies a mechanic the season did not run. */
  const showcaseMaxi = maxiById('talent-show');
  const showcase = Object.fromEntries(finalists.map(n => [n,
    performQueen({ player: ctx.players[n], maxi: showcaseMaxi, record: state.record[n], rng })]));
  state.finalePerformance = Object.fromEntries(
    Object.entries(showcase).map(([n, p]) => [n, p.perf]));
  // The season and the night, handed to every duel of this finale. The
  // Smackdown's duels do not get it: that is a title for the eliminated, and
  // a resume is exactly what those queens do not have.
  const fctx = { showcase: state.finalePerformance, field: [...finalists] };

  if (type === 'top4' && finalists.length >= 4) {
    const s1 = duel(state, finalists[0], finalists[1], ctx, song(), fctx);
    const s2 = duel(state, finalists[2], finalists[3], ctx, song(), fctx);
    const f = duel(state, s1.winner, s2.winner, ctx, song(), fctx);
    rounds.push(s1, s2, f);
    placements = [f.winner, f.loser, s1.loser, s2.loser, ...finalists.slice(4)];
  } else if (type === 'top3' && finalists.length >= 3) {
    const s1 = duel(state, finalists[0], finalists[1], ctx, song(), fctx);
    const f = duel(state, s1.winner, finalists[2], ctx, song(), fctx);
    rounds.push(s1, f);
    placements = [f.winner, f.loser, s1.loser, ...finalists.slice(3)];
  } else if ((type === 'perform-then-lipsync' || type === 'perform-then-lipsync-3') && finalists.length >= 2) {
    // A final performance ranks them, the host picks two, and those two lip
    // sync. This is the one finale where the panel speaks at all.
    // The SAME showcase everybody performed, not a second one: running it
    // twice would score a night the audience only watched once.
    const perf = showcase;
    const panel = panelFor({ rotatingId: cfg.rotatingId || 'carson', weights: cfg.judgeWeights || {} });
    /* ── THE SEASON, ON THE ONE NIGHT IT IS THE QUESTION ──
       This narrowed the field on the showcase ALONE. `runway` and `polish`
       below are hardcoded — there is no runway and no build at a showcase —
       so the whole ranking was one performance plus noise, and twelve
       episodes counted for nothing.

       `duel()` already fixed this for the CROWN, and its comment says why:
       ignoring the record "produced a winner with zero maxi challenge wins
       in 20 of 40 measured seasons". But the fix went on the last song and
       not on the cut that decides who sings it, so the résumé only ever
       applied to the two queens who had already survived the queen with the
       best résumé. Measured before this: the best-record finalist was cut
       before the song 33-35% of the time (chance is 50%), and on this format
       22% of seasons crowned a queen with no maxi wins at all.

       SAME SHAPE AND SAME CONSTANTS AS `duel`'s résumé edge, deliberately —
       centred on this field's mean, scaled, clamped — so the cut and the
       crown read the season through one rule rather than two that can drift
       apart. It is an edge, not a verdict: the clamp means a strong showcase
       still beats a strong season, which is the whole point of holding a
       finale at all. */
    const recAvgF = finalists.length
      ? finalists.reduce((t, x) => t + recordStrength(state.record[x] || []), 0) / finalists.length
      : 0;
    const resumeOf = n => Math.max(-RESUME_CLAMP, Math.min(RESUME_CLAMP,
      (recordStrength(state.record[n] || []) - recAvgF) * RESUME_SCALE));
    const entries = finalists.map(n => ({
      name: n, style: 'pageant', perf: perf[n].perf, runway: 5, risk: perf[n].risk, polish: 5,
      resume: resumeOf(n),
    }));
    const ranking = panelRanking(judgeViews(panel, entries, state.memory, rng));
    const order = hostBend(ranking, { star: state.star, storylineNeed: {}, trackPull: {}, split: false })
      .map(x => x.name);
    const f = duel(state, order[0], order[1], ctx, song(), fctx);
    rounds.push(f);
    placements = [f.winner, f.loser, ...order.slice(2)];
    // THE ONLY FORMAT WITH A CUT. These queens never sang: the host narrowed
    // the field on the showcase and sent them to the back before the music.
    cutQueens = order.slice(2);
  } else {
    // top2, and the fallback for any finale that arrives smaller than its
    // shape expects — two queens, one song, one crown.
    const [a, b] = finalists;
    const f = duel(state, a, b, ctx, song(), fctx);
    rounds.push(f);
    placements = [f.winner, f.loser, ...finalists.slice(2)];
  }

  /* ── TWO WINNERS ──
     All Stars 4 crowned Trinity the Tuck and Monet X Change together: the
     only double crown in the show's history, announced by voiceover, and the
     two were never shown on stage together because the decision was made
     late. So it is a rare exception rather than a format, and it is modelled
     as one — off unless the season asks for it, and then only on a genuine
     dead heat in the last song.

     It reads the RAW duel scores for the same reason the double shantay does:
     whether two finales were level is a fact about the stage, not something
     the host's agenda gets to manufacture. Same CLOSE window the weekly
     double shantay uses, and both have to be excellent.

     `winner` and `placements[0]` KEEP THEIR MEANING. Every reader in the repo
     — the chart, the article, the franchise ledger, the aftermath, the
     rankings — reads one or the other, and a shape change there is a change
     to all of them. The second crown is additive: `winners` is the list, and
     it has one name in it on every ordinary season. */
  const lastRound = rounds[rounds.length - 1] || null;
  const crownGap = lastRound && lastRound.scores
    ? Math.abs((lastRound.scores[lastRound.a] || 0) - (lastRound.scores[lastRound.b] || 0))
    : Infinity;
  const bothGreat = lastRound && lastRound.scores
    && Math.min(lastRound.scores[lastRound.a] || 0, lastRound.scores[lastRound.b] || 0) >= 8.5;
  const doubleCrown = !!cfg.doubleCrown && !!lastRound && bothGreat && crownGap < 0.6
    && placements.length >= 2;

  const winners = doubleCrown ? [placements[0], placements[1]] : [placements[0]];
  state.winner = placements[0];
  state.winners = winners;
  state.doubleCrown = doubleCrown;
  // On a double crown nobody is the runner-up, because nobody came second.
  state.runnerUp = doubleCrown ? null : placements[1];
  for (const n of state.living) {
    state.record[n].push(winners.includes(n) ? 'WINNER' : 'FINALIST');
  }

  const row = {
    num: cfg.num,
    format: 'drag-race',
    eliminated: null,
    exits: [],
    twists: [],
    houseAtStart: [...state.living],
    airedEvents: [],
    dr: {
      ep: cfg.num,
      challenge: { id: 'finale', name: 'The Finale', format: 'solo', stage: 'main' },
      mini: null,
      judges: [],
      guest: null,
      finale: { type, rounds, winner: placements[0], winners, doubleCrown,
        runnerUp: doubleCrown ? null : placements[1], placements },
      // The finale carries the arcs too, and it is the one episode where they
      // matter most: this is where the season finds out whether the
      // frontrunner was really the frontrunner. The host does not BEND a
      // finale, so there is no `storylineNeed` here — nothing was asked for.
      popularity: popSnapshot(state),
      storylines: arcSummary(state.storylines || []),
      storylineNeed: {},
      record: JSON.parse(JSON.stringify(state.record)),
      living: [...state.living],
      /* THE WHOLE NIGHT, NOT THREE MARKERS. This used to be exactly three
         scenes carrying `text: ''` — the stage opening, the duels, and the
         placements — which the viewing party then drew under a heading
         called "Sashay Away: the mirror message". `finale-open` and
         `crowning` are still emitted first and last so every existing reader
         (screens.js, the badge list, the transcript) keeps working; the night
         itself is now between them. */
      scenes: [
        { step: 'main-stage', kind: 'finale-open', data: { finalists, type }, text: '' },
        ...renderFinaleBeats({
          finalists,
          // Everybody this season sent home, walking back in.
          returning: [...(state.out || [])],
          showcase: state.finalePerformance || {},
          // WHO STOPPED SHORT OF THE LAST SONG. Read off the placements
          // rather than tracked separately: the last duel's two queens are
          // the top two, and everybody below them was cut before it.
          cut: cutQueens,
          rounds,
          winner: placements[0] || null,
          winners,
          doubleCrown,
          runnerUp: doubleCrown ? null : (placements[1] || null),
          placements,
          // Filled in by playDragSeason once the vote runs — the finale
          // cannot know it, because the vote reads a ledger this row closes.
          congeniality: null,
          rng,
          players: ctx.players,
          record: state.record,
        }),
        { step: 'exit', kind: 'crowning', data: { placements }, text: '' },
      ],
    },
  };
  state.episodes.push(row);
  return row;
}

/**
 * The two halves of a split premiere meeting for the first time.
 *
 * Drawn like every other beat pool: a tier with no lines emits no scene, so
 * the phase appears the moment the prose exists and draws nothing — rather
 * than an empty card — until then. See js/dr/data/split-beats.js.
 *
 * THE BONDS ARE REAL AND THEY ONLY HAPPEN IF THE SCENE DOES. A mechanic that
 * moves relationships with nothing on screen to show for it is the invisible
 * consequence this codebase refuses everywhere else, so the ledger is written
 * inside the same branch that produced the card.
 */
function rejoinScenes(state, ctx) {
  const { rng, addBond = () => {} } = ctx;
  const [first, second] = state.splitHalves || [];
  if (!first || !second) return [];
  const beatBy = id => SPLIT_BEATS.find(b => b.id === id);
  const out = [];
  const say = (beat, tierId, who, data = {}) => {
    if (!beat) return null;
    const t = beat.tiers.find(x => x.id === tierId) || beat.tiers[0];
    if (!t?.lines?.length) return null;
    const line = t.lines[Math.floor(rng() * t.lines.length)];
    const sc = {
      step: 'rejoin',
      kind: `split:${beat.id}`,
      data: { beat: beat.id, tier: t.id, players: who, note: t.note, ...data },
      text: String(line).replace(/\{a\}/g, who[0] || '').replace(/\{b\}/g, who[1] || ''),
    };
    out.push(sc);
    return sc;
  };

  say(beatBy('rejoin-open'), 'open', []);

  /* THE READS. One per queen, about somebody from the other half — she has
     watched this person compete and never met her, which is the specific
     strangeness of the twist. */
  const alive = new Set(state.living);
  const reads = [['threat', 0.34], ['warm', 0.36], ['unimpressed', 0.3]];
  for (const [half, other] of [[first, second], [second, first]]) {
    for (const a of half) {
      if (!alive.has(a)) continue;
      const pool = other.filter(n => alive.has(n));
      if (!pool.length) continue;
      const b = pool[Math.floor(rng() * pool.length)];
      let roll = rng();
      let tierId = 'warm';
      for (const [id, w] of reads) { if (roll < w) { tierId = id; break; } roll -= w; }
      const sc = say(beatBy('rejoin-read'), tierId, [a, b]);
      // Only if it was actually shown.
      /* AND EVERY READ COSTS SOMETHING. A warm one buys a bond she would not
         otherwise have; an unimpressed one costs her a little. A THREAT read
         moves no bond — being frightened of somebody is not disliking her —
         but it is not free either: the queen the other half was worried about
         walks in with a reputation, and that is the audience noticing her
         before she has done anything in this room. Without this the threat
         tier was a card that changed nothing, which is the cosmetic-event
         bug this codebase refuses everywhere else. */
      if (sc) {
        const delta = tierId === 'warm' ? 2 : tierId === 'unimpressed' ? -1 : 0;
        if (delta) { addBond(a, b, delta); sc.data.bond = [[a, b, delta]]; }
        if (tierId === 'threat') {
          ctx.popDelta?.(b, 1);
          sc.data.pop = { [b]: 1 };
        }
      }
    }
  }

  const [w1, w2] = state.splitWinners || [];
  if (w1 && w2 && alive.has(w1) && alive.has(w2)) say(beatBy('rejoin-winners'), 'winners', [w1, w2]);

  return out;
}

/**
 * Play a season.
 *
 * `config` is the setup screen's: drPremiere, drFinale, drImmunity,
 * drDoubleShantay, drDoubleSashay, drSchedule, drJudgeWeights.
 */
export function playDragSeason({
  cast, seed = 1, config = {}, bond = () => 0, addBond = null, popDelta = null,
  /* Authored drag-family edges from the Relationships tab, in the shape
     `{ a, b, kind }` -- see js/dr/family.js. A season that passes none
     still gets derived families; passing them is how a user's own house
     survives into the room. */
  relations = [],
}) {
  const rng = rngFor(seed);
  const state = initDragState({ cast, seed, rng });
  const players = Object.fromEntries(cast.map(p => [p.name, p]));

  // The ledger, written into state so a headless season and a played one carry
  // the same numbers. A caller may pass its own to write gs.popularity too.
  const writePop = (n, d) => {
    state.popularity[n] = (state.popularity[n] || 0) + d;
    if (popDelta) popDelta(n, d);
  };
  // Bonds move during a maxi: somebody helps, somebody sabotages, a captain
  // dumps a rival. A headless season with no relationship layer passes nothing
  // and those writes go nowhere, which is correct rather than a gap.
  const ctx = { rng, players, bond, addBond: addBond || (() => {}), popDelta: writePop };

  /* ── WHO WAS ALREADY RELATED ──
     Cast before the arcs, because a family is a fact about the room that the
     arcs should be able to see rather than a thread laid over the top of one.
     The bonds are applied through the caller's own `addBond`, so a headless
     season with no relationship layer gets the families and none of the
     points, which is correct — there is nowhere to put them. */
  const fam = assignDragFamilies({ cast, rng, relations });
  state.dragFamilies = fam.families;
  if (addBond) for (const [a, b, d] of fam.bonds) addBond(a, b, d);

  // Cast the season's arcs from the room as it stands before anybody performs.
  state.storylines = assignStorylines({ cast, state, bond, rng });

  const finaleType = config.drFinale || 'top4';
  const premiere = config.drPremiere || 'standard';
  const rows = [];
  /* WHAT EACH EPISODE WAS ACTUALLY BOOKED WITH, in play order and keyed by the
     number that aired. A season in progress is re-booked by handing these back
     as pins for the weeks already watched, so those weeks replay bit-for-bit
     and only the unaired ones change. Without it a re-book replays a DIFFERENT
     season and the queue's rosters stop matching the history on screen. */
  const played = [];
  let num = 1;

  /* THIS WEEK'S OWN DICE. Every week used to draw from the season's single
     stream, so week six's numbers depended on how many week five happened to
     spend -- which is why changing one week changed all of them.

     AND WHAT A RE-RUN TURNS. `drReroll` is `{ from, nonce }`: the re-run button
     bumps the nonce and names the episode it was pressed on, and only the weeks
     from there are salted with it. Everything before reproduces exactly, which
     is what makes "re-running episode five never touches episode four" true by
     construction rather than by hoping the numbers line up. Without a nonce a
     drag re-run came back byte-identical -- and a re-run that returns the same
     night is not a re-run, which is the rule js/tr-run.js already works to.

     TWO SALTS PER WEEK, not one. `weekCtx` and the week's own extras (the
     returnee draw, her walk-back scenes) used to derive the SAME stream from
     the same salt, so two generators walked the same sequence side by side and
     the returnee pick moved in lockstep with the first thing the week rolled. */
  const rr = config.drReroll || null;
  const wSalt = (base, n) => base + n
    + (rr && n >= Number(rr.from) ? 1000000 * (Number(rr.nonce) || 0) : 0);
  const weekCtx = n => ({ ...ctx, rng: streamFor(seed, wSalt(5000, n)) });

  // A SPLIT PREMIERE runs the cast in two halves with nobody going home, so
  // the season proper starts at episode three with everybody still in.
  let rejoinDue = false;
  if (premiere === 'split' && cast.length >= 10) {
    const order = [...state.castOrder].sort(() => rng() - 0.5);
    const half = Math.ceil(order.length / 2);
    const wholeCast = [...state.living];
    /* ── THE AUTHOR PICKS THE SPLIT'S CHALLENGE ──
       This passed `pinned: []` and forced `premiere: 'talent-show'`, so both
       halves ran a talent show whatever the designer had booked and a pin on
       episode one silently slid to episode three — the split had eaten the
       first two slots and nothing told it. A split premiere is not one shape:
       the two halves can be given the same challenge or two different ones,
       and that is the interesting decision in booking it.
       Read off drSchedule the same way every other week is. */
    rejoinDue = true;
    const splitPins = (config.drSchedule || []).filter(Boolean);
    const pinFor = n => splitPins.find(x => Number(x.episode) === n) || {};
    let splitHalf = 0;
    for (const group of [order.slice(0, half), order.slice(half)]) {
      const pin = pinFor(splitHalf + 1);
      splitHalf += 1;
      const sch = buildSchedule({
        episodes: 1, castSize: group.length, pinned: pin.maxiId ? [{ ...pin, episode: 1 }] : [],
        rng, seed: (seed >>> 0) + 811 * splitHalf,
        premiere: pin.maxiId ? 'standard' : 'talent-show', cast,
      })[0];
      // The week only ever sees this half of the room. Nobody goes home, so
      // the full cast is restored afterwards rather than reconciled — the
      // half-week cannot have removed anybody.
      state.living = group;
      // `formatNote: 'split'` and not the generic no-elimination note: the
      // room is half a cast AND nobody goes home, and the half-cast is the
      // part a viewer cannot work out on their own.
      const splitNum = num++;
      played.push({ ...sch, episode: splitNum });
      rows.push(beat(state, runDragWeek(state, weekCfg(sch, config, splitNum, {
        noElimination: true, formatNote: 'split',
      }), weekCtx(splitNum)), cast));
      /* WHO WAS IN WHICH HALF, so the rejoin can know who is a stranger to
         whom. Without it every queen in the room looks the same to the scene
         that is about them not knowing each other. */
      const justRan = rows[rows.length - 1];
      state.splitHalves = [...(state.splitHalves || []), [...group]];
      state.splitWinners = [...(state.splitWinners || []),
        (justRan?.dr?.call?.win || [])[0] || null];
      state.living = wholeCast;
    }
  }

  /* A NIGHT THAT SENDS NOBODY HOME MAKES THE SEASON LONGER.
     It used to make the season SHORTER by one elimination and then claw that
     back with a double the following week, which raised a fair question —
     who decides when that double lands? — and had an unsatisfying answer:
     nobody, it was always the very next week, measured at a gap of 1 in all
     ten repayments across 300 seasons.
     A season that keeps fourteen queens goes back to fourteen next week and
     runs one episode longer. That is what the show does, it needs no
     scheduling rule, and it makes a non-elimination week a gift rather than
     a loan. `episodesFor` gives the number of eliminations a cast needs, and
     the loop below runs until the room is finale-sized however many weeks
     that takes. */
  const eliminationsNeeded = episodesFor(cast.length, finaleType);
  /* ONE BOTTOM-THREE NIGHT A SEASON, booked rather than rolled per week.
     The show names three and saves one of them on the stage often enough that
     BTM is a real call, and it is the only way that call can happen at all —
     an ordinary week names the two who lip sync. Booked in the middle third,
     where the field is still big enough for a third name to mean something
     and small enough that the room feels it. */
  const pins = (config.drSchedule || []).filter(Boolean);
  const scheduledFree = pins.filter(x => x.noElimination).length;
  // A double elimination takes two queens in one night, so it SHORTENS the run
  // by a week exactly as a free week lengthens it.
  const scheduledDoubles = pins.filter(x => x.doubleElimination && !x.noElimination).length;
  /* A RETURNING QUEEN IS ANOTHER BODY TO GET RID OF, so she lengthens the
     season exactly the way a free week does and for a more obvious reason:
     the room she walks into is one bigger than the maths was built for. */
  const scheduledReturns = pins.filter(x => x.returnee).length;
  const weeks = Math.max(1,
    eliminationsNeeded + scheduledFree + scheduledReturns - scheduledDoubles);
  // Episode one to the crowning, so an arc can ask "how far through are we".
  const totalEpisodes = weeks + 1;
  /* ── THE SPLIT HAS ALREADY SPENT TWO EPISODES ──
     A split premiere plays episodes one and two before the season proper
     starts, and those two read their own pins above. Passing the whole
     schedule through again applied the same pins a SECOND time, so a
     Snatch Game booked for the split also turned up as the first ordinary
     week. The season proper starts at three, so its pins are renumbered
     against that — episode three is its episode one — and the two the split
     consumed are dropped. */
  const splitAte = premiere === 'split' && cast.length >= 10 ? 2 : 0;
  const schedule = buildSchedule({
    episodes: weeks,
    castSize: cast.length,
    seed,
    pinned: (config.drSchedule || []).filter(Boolean)
      .filter(x => Number(x.episode) > splitAte)
      .map(x => (splitAte ? { ...x, episode: Number(x.episode) - splitAte } : x)),
    rng,
    premiere: premiere === 'split' ? 'standard' : premiere,
    // So a queen cannot be flown in to judge the season she is competing in.
    cast,
  });

  /* AND THE BOTTOM-THREE NIGHT, booked onto whichever middle episode the
     author has not already claimed. Rolled once, from the season's own rng,
     so a replay of the same seed books the same week. */
  if (!schedule.some(e => e.bottomThree)) {
    const lo = Math.max(1, Math.floor(schedule.length / 3));
    const hi = Math.max(lo, Math.floor((schedule.length * 2) / 3));
    /* ITS OWN STREAM, so booking this does not move the season's. Drawing
       from `rng` here consumed a number every later decision was expecting to
       get, which silently reshuffled the schedule — it showed up as a
       scheduled double elimination no longer shortening the run, with nothing
       about double eliminations touched. Derived from the seed so a replay
       still books the same week. */
    const pickRng = rngFor(seed * 7919 + 13);
    const want = lo + Math.floor(pickRng() * Math.max(1, hi - lo + 1));
    const slot = schedule.find(e => e.episode === want && !e.noElimination)
      || schedule.slice(lo).find(e => !e.noElimination);
    if (slot) slot.bottomThree = true;
  }

  const finaleSize = FINALE_SIZE[finaleType] || 4;
  /* THE SCHEDULE CAN RUN OUT AND THE SEASON CANNOT. A double shantay is
     decided on the night, so no amount of counting up front predicts it —
     when the booked weeks are used and the room is still too big, the season
     books another. Capped so a bug cannot spin here forever. */
  let guard = 0;
  /* `cast` IS NOT OPTIONAL HERE. It is what `buildSchedule` excludes from the
     guest pool, and this call omitted it — so an extra week booked after a
     double shantay could fly in a queen who was still competing that night to
     judge her own season. The scheduled weeks always passed it; only the spare
     did not, which is why it took a season with an extra week to show. */
  const spare = () => buildSchedule({
    episodes: 1, castSize: cast.length, pinned: [], rng, premiere: 'standard',
    seed: (seed >>> 0) + 700003 + guard, cast,
  })[0];
  for (const sch of [...schedule, ...Array.from({ length: 8 }, () => null)]) {
    if (state.living.length <= finaleSize) break;
    if (!sch && ++guard > 8) break;
    const week = sch || spare();
    /* THE NIGHT'S NUMBER AND THE NIGHT'S DICE, both taken before anything on
       it is decided. `num` used to be incremented in the middle of building
       the week's config, which meant the two decisions made BEFORE that line —
       whether this is the porkchop premiere, and which eliminated queen walks
       back in — were reading a counter one step behind the episode they were
       about to run. */
    const epNum = num++;
    const wRng = streamFor(seed, wSalt(6000, epNum));
    const wCtx = weekCtx(epNum);
    // A porkchop premiere is a runway with no challenge that still sends
    // somebody home, and the host says so before it starts.
    const porkchopNight = premiere === 'porkchop' && epNum === 1;
    /* THE LAST-WEEK RESTRICTION IS GONE WITH THE DEBT. It existed because a
       double shantay on the final elimination week could not be repaid, and
       the season walked into a top four with five queens in it. Nothing is
       repaid now: the season simply runs another week, so the host may keep
       both whenever the stage earns it. */
    const lastElimWeek = false;
    /* A SCHEDULED NON-ELIMINATION WEEK. Pinned on `drSchedule` as
       `{ episode, noElimination: true }`. Distinct from a double shantay,
       which is the HOST deciding in the moment that both were too good to
       lose: this is production announcing beforehand that the door stays
       shut, and the host says so on the main stage before the challenge.
       It costs the season an elimination, so it takes on the same debt a
       double shantay does and is repaid by the same later double — otherwise
       the cast maths lands a top four with five queens in it.
       REFUSED ON THE LAST ELIMINATION WEEK for the same reason a double
       shantay is: there would be no week left to repay it in. */
    const scheduledNoElim = !!week.noElimination && !lastElimWeek;

    /* ── A QUEEN COMES BACK ──
       Resolved BEFORE the week runs, because she has to be in the room for
       the whole of it — she takes the mini, the maxi, the runway and the
       call like anybody else, and a return that only appeared in the
       narration would be a queen the chart does not have.
       The author's pick wins when it is available. It can fail to be: a
       season is booked before it is played, so the queen chosen on episode
       six may still be competing when episode six arrives. Falling back to
       a random eliminated queen is better than doing nothing, and the row
       records which of the two happened so the screen can say so. */
    let returned = null;
    if (week.returnee && state.out.length) {
      const wanted = week.returneeName || null;
      const gone = [...state.out];
      const exact = wanted && gone.includes(wanted) ? wanted : null;
      /* WEIGHTED TOWARD WHAT SHE LEFT BEHIND. An early boot with a win on
         her record has more to prove than a queen who went out in the
         bottom every week, and the show would bring the first one back.
         Read off the record the season already wrote. */
      const weightOf = n => {
        const rec = state.record?.[n] || [];
        const wins = rec.filter(r => r === 'WIN').length;
        const highs = rec.filter(r => r === 'HIGH').length;
        const early = Math.max(0, 6 - rec.length);
        return 1 + wins * 3 + highs * 1.5 + early * 0.6;
      };
      const pickWeighted = () => {
        const total = gone.reduce((t, n) => t + weightOf(n), 0);
        let roll = wRng() * total;
        return gone.find(n => (roll -= weightOf(n)) <= 0) || gone[gone.length - 1];
      };
      const who = exact || pickWeighted();
      if (who) {
        state.out = state.out.filter(n => n !== who);
        state.living = [...state.living, who];
        const wentOut = (state.record?.[who] || []).length;
        returned = {
          name: who, asked: wanted || null, honoured: !!exact,
          // How long she has been gone, in episodes — the walk-back reads it.
          gap: Math.max(0, epNum - 1 - wentOut),
        };
        state.returns = [...(state.returns || []), { ...returned, episode: epNum }];
      }
    }

    played.push({ ...week, episode: epNum });
    /* THE AUDIENCE'S VIEW COMING IN, not the one it will hold by the end of
       tonight. Refreshed BEFORE the week runs, from everything aired so far,
       so the host's lean this week is what the room thought walking in — and
       so `hostBend` inside runDragWeek reads a value the week itself has not
       yet moved. See refreshStar in js/dr/state.js. */
    refreshStar(state);
    const weekRow = beat(state, runDragWeek(state, weekCfg(week, config, epNum, {
      totalEpisodes,
      // She competes on her return night and cannot go home on it.
      ...(returned ? { returnedQueen: returned.name } : {}),
      ...(porkchopNight ? { formatNote: 'porkchop' } : {}),
      ...(week.legacy ? { legacy: true } : {}),
      ...(week.rateAQueen ? { rateAQueen: true } : {}),
      /* THE CRITIQUE TWISTS WERE UNREACHABLE. js/dr/critiques.js exports
         whoShouldGoHome and rateAQueen, week.js dispatches on
         cfg.critiqueTwist, and NOTHING EVER SET IT — the season never passed
         the field, so both were dead code reachable only from a test. */
      ...(week.critiqueTwist ? { critiqueTwist: week.critiqueTwist } : {}),
      ...(scheduledNoElim ? { noElimination: true } : {}),
      // The night the panel names three and saves one of them on the stage.
      // Pointless on a week that sends nobody home, so it is refused there.
      ...(week.bottomThree && !scheduledNoElim ? { bottomThree: true } : {}),
      // A DOUBLE ELIMINATION IS THE AUTHOR'S, pinned on the schedule the same
      // way a free week is. Refused on a week that already sends nobody home,
      // because those two instructions cancel each other out.
      ...(week.doubleElimination && !scheduledNoElim
        ? { doubleElimination: true, formatNote: 'double-elimination' } : {}),
      finaleSize,
    }), wCtx), cast);
    /* THE RETURN GOES ON THE FRONT OF THE NIGHT. Written after the week is
       built rather than inside runDragWeek, so the week engine does not have
       to learn about a twist that only changes who is in the room — and the
       scenes land before the cold open, which is where a queen walking back
       through the door actually happens. */
    if (returned) {
      weekRow.dr.returned = returned;
      weekRow.dr.scenes = [
        ...returnScenes(returned, { living: state.living, rng: wRng }),
        ...(weekRow.dr.scenes || []),
      ];
    }
    /* ── THE TWO HALVES MEET ──
       Once, on the first ordinary week after a split premiere, before
       anything else on the night. The room doubles and half of it is
       strangers — and until now the engine restored the full cast with one
       line of state and said nothing at all about it, which made the most
       distinctive thing a split premiere does the one thing it never showed.

       The bonds are the point rather than the decoration: two queens who have
       never shared a room do not start at zero with each other the way two
       queens who spent a week together do, and a first read that goes well
       is worth something for the rest of the season. */
    if (rejoinDue && state.splitHalves?.length === 2) {
      const scenes = rejoinScenes(state, wCtx);
      if (scenes.length) {
        weekRow.dr.scenes = [...scenes, ...(weekRow.dr.scenes || [])];
        weekRow.dr.rejoin = { halves: state.splitHalves.map(h => [...h]) };
      }
      rejoinDue = false;
    }
    rows.push(weekRow);
    // No debt is taken on: the loop simply keeps going until the room is
    // finale-sized, so a free week is an extra week.
  }

  // The Smackdown, if the season books one: the queens already sent home come
  // back and lip sync for a title, one episode before the crowning.
  if (config.drSmackdown && state.out.length >= 2) {
    const smack = runSmackdown(state, { num: num++, seed }, ctx);
    if (smack) rows.push(beat(state, smack, cast));
  }

  /* THE REUNION, between the last elimination and the crowning — which is
     where the real show's own track record chart puts it, as a column of its
     own ahead of "Finale". It eliminates nobody and it is the only episode
     that reads the WHOLE season rather than the row in front of it.
     OPT-IN, because it changes a season's episode count and every caller that
     has ever counted them. */
  /* ── MISS CONGENIALITY ──
     THE SHARED AUDIENCE VOTE, not a second way of printing the chart. This
     show does not get to write its own: `runAudienceVote` is the one place
     the franchise decides what "the country's favourite" means, and it is
     already weighted in SPREADS rather than points so a show whose numbers
     look nothing like Big Brother's resolves without a per-show constant.
     RUN BEFORE THE REUNION, because that is where season nine announced it —
     with the vote tallied in public — and a reunion topic that could never
     fire is the written-but-unreachable bug in a bigger chair. The finale
     announces it too, which is the modern format; both read one value.
     Eligible is everybody but the winner, who is not known yet — so the
     board is the whole cast and the winner is removed after. */
  const vote = runAudienceVote({
    eligible: [...state.castOrder], rng, blocks: 600,
    _gs: { popularity: state.popularity, episodeHistory: rows },
  });
  if (vote) {
    state.congeniality = vote.winner;
    state.congenialityTally = vote.tally;
  }

  if (config.drReunion) {
    rows.push(beat(state, runReunion(state, { num: num++ }, ctx), cast));
  }

  const last = schedule[schedule.length - 1] || {};
  const finale = runFinale(state, {
    num: num++, type: finaleType, rotatingId: last.rotatingId, judgeWeights: config.drJudgeWeights,
    doubleCrown: !!config.drDoubleCrown,
  }, ctx);
  /* THE WINNER CANNOT TAKE THE SASH TOO. The vote ran before the crowning,
     so it could not exclude a winner nobody knew yet — if the country's
     favourite turns out to be the queen who wins, the sash goes to the runner
     up on the tally instead. */
  if (state.congeniality && state.congeniality === state.winner) {
    const next = (state.congenialityTally || []).find(t => t.name !== state.winner);
    state.congeniality = next ? next.name : null;
  }
  /* THE SEASON'S PAIRS, ON THE ROW. `js/life-hook.js` reads `showmance` off an
     APPEARANCE to decide who walked out of a season together, and a drag
     appearance carried none — so the romance thread existed in the werk room,
     on the screen and in the ratings signal, and stopped dead at the franchise
     boundary. Kept on the finale row rather than threaded through the exporter
     as another argument, the way `congeniality` had to be. */
  finale.dr.romances = (state.romances || []).map(pair => [...pair]);
  if (state.congeniality) {
    finale.dr.congeniality = state.congeniality;
    finale.dr.congenialityTally = state.congenialityTally;
    insertCongenialityScene(finale, state.congeniality, rng);
  }
  rows.push(beat(state, finale, cast));

  return {
    rows, state, schedule: played, winner: state.winner, runnerUp: state.runnerUp,
    congeniality: state.congeniality || null,
    finale: finale.dr.finale, smackdownWinner: state.smackdownWinner || null,
    winners: state.winners || [state.winner], doubleCrown: !!state.doubleCrown,
  };
}

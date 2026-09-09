// ══════════════════════════════════════════════════════════════════════
// js/dr/smackdown.js — the bracket, narrated
// ══════════════════════════════════════════════════════════════════════
//
// Pure. The bracket is already decided by the time this runs; this writes the
// prose over it and nothing else. A smackdown scene that could change a duel
// would be a second source of truth for a night that already has one.
import { SMACKDOWN_BEATS } from './data/smackdown-beats.js';
import { TOURNAMENT_BEATS } from './data/tournament-beats.js';

const pickLine = (lines, rng, used, key) => {
  if (!lines?.length) return '';
  const fresh = lines.filter(l => !used.has(key + ' ' + l));
  const pool = fresh.length ? fresh : lines;
  const chosen = pool[Math.floor(rng() * pool.length)];
  used.add(key + ' ' + chosen);
  return chosen;
};

const fill = (line, { a, b, c } = {}) => (line || '')
  .replace(/\{a\}/g, a || '').replace(/\{b\}/g, b || '').replace(/\{c\}/g, c || '');

const beatById = id => SMACKDOWN_BEATS.find(x => x.id === id);

/* HOW A DUEL READS. The gap decides it, and `seed` is who was expected to win
   — a queen who lasted longer in the competition. An upset is the short-lived
   queen taking it from somebody who outlasted her, which is the whole appeal
   of putting a bracket in front of the eliminated cast. */
function duelTier(duel, expectedOf) {
  const gap = Math.abs((duel.scores?.[duel.a] ?? 0) - (duel.scores?.[duel.b] ?? 0));
  const ra = expectedOf(duel.a);
  const rb = expectedOf(duel.b);
  const favourite = ra >= rb ? duel.a : duel.b;
  /* AN UPSET NEEDS A REAL GAP IN BOTH DIRECTIONS. Beating somebody who went
     home one week after you is not an upset, and lip sync ability has little
     to do with how long a queen lasted — so "winner was not the favourite"
     alone called 31% of duels an upset, which makes the word mean nothing.
     She has to have gone home at least three eliminations earlier AND have
     won it clearly. */
  const seedGap = Math.abs(ra - rb);
  if (duel.winner !== favourite && seedGap >= 3 && gap >= 1.5) return 'upset';
  return gap >= 3 ? 'blowout' : 'close';
}

/**
 * Every scene of a smackdown, in the order it is watched.
 *
 * `expectedOf` ranks a queen by how far she got in the season, so "upset" can
 * mean something. Absent, every duel reads on its gap alone.
 */
export function smackdownScenes({
  field = [], duels = [], champion = null, title = '',
  rng = Math.random, expectedOf = null,
}) {
  const used = new Set();
  const rank = expectedOf || (n => field.indexOf(n));
  const out = [];

  const emit = (id, tierId, subs, data) => {
    const beat = beatById(id);
    const t = beat?.tiers.find(x => x.id === tierId) || beat?.tiers[0];
    if (!t) return;
    out.push({
      step: 'smackdown', kind: id,
      data: { beat: id, tier: t.id, note: t.note, ...data },
      text: fill(pickLine(t.lines, rng, used, `${id}/${t.id}`), subs),
    });
  };

  emit('smackdown-open', 'open', {}, { field: [...field], players: [...field] });
  for (const d of duels) {
    emit('smackdown-duel', duelTier(d, rank),
      { a: d.winner, b: d.loser, c: d.song },
      { duel: d, players: [d.a, d.b] });
  }
  if (champion) {
    emit('smackdown-crown', 'crown', { a: champion },
      { winner: champion, title, players: [champion] });
  }
  return out;
}

// ── TOURNAMENT (LaLaPaRuZa — active queens, someone goes home) ──────

const tBeatById = id => TOURNAMENT_BEATS.find(x => x.id === id);

function tournamentDuelTier(duel, rankOf) {
  const gap = Math.abs((duel.adjusted?.[duel.a] ?? 0) - (duel.adjusted?.[duel.b] ?? 0));
  const ra = rankOf(duel.a);
  const rb = rankOf(duel.b);
  const favourite = ra >= rb ? duel.a : duel.b;
  const seedGap = Math.abs(ra - rb);
  if (duel.winner !== favourite && seedGap >= 2 && gap >= 1.0) return 'upset';
  return gap >= 2.5 ? 'blowout' : 'close';
}

export function tournamentScenes({
  duels = [], eliminated = null, r1Winners = [], r1Losers = [],
  r2Safe = [], r2Losers = [], lastSurvivor = null,
  rng = Math.random, rankOf = null, living = [],
}) {
  const used = new Set();
  const rank = rankOf || (() => 0);
  const out = [];

  const emit = (id, tierId, subs, data) => {
    const beat = tBeatById(id);
    const t = beat?.tiers.find(x => x.id === tierId) || beat?.tiers[0];
    if (!t) return;
    out.push({
      step: 'maxi-main', kind: id,
      data: { beat: id, tier: t.id, note: t.note, ...data },
      text: fill(pickLine(t.lines, rng, used, `${id}/${t.id}`), subs),
    });
  };

  emit('tournament-open', 'open', {}, { players: [...living] });

  const r1Duels = duels.filter(d => d.round === 1);
  const r2Duels = duels.filter(d => d.round === 2);
  const r3Duels = duels.filter(d => d.round === 3);

  for (const d of r1Duels) {
    emit('tournament-duel', tournamentDuelTier(d, rank),
      { a: d.winner, b: d.loser, c: d.song },
      { duel: d, players: [d.a, d.b] });
  }

  if (r1Losers.length) {
    emit('tournament-r1-split', 'split',
      {}, { safe: [...r1Winners], danger: [...r1Losers], players: [...r1Losers] });
  }

  for (const d of r2Duels) {
    emit('tournament-duel', tournamentDuelTier(d, rank),
      { a: d.winner, b: d.loser, c: d.song },
      { duel: d, players: [d.a, d.b] });
  }

  if (r2Losers.length) {
    emit('tournament-r2-split', 'split',
      {}, { safe: [...r2Safe], danger: [...r2Losers], players: [...r2Losers] });
  }

  for (const d of r3Duels) {
    emit('tournament-sudden-death', 'death',
      { a: d.winner, b: d.loser, c: d.song },
      { duel: d, players: [d.a, d.b] });
  }

  if (eliminated) {
    emit('tournament-elim', 'elim',
      { a: lastSurvivor || '', b: eliminated },
      { eliminated, players: [eliminated] });
  }

  return out;
}

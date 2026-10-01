// ══════════════════════════════════════════════════════════════════════
// ci/ledger-record.js — what a Circle season leaves the franchise
// ══════════════════════════════════════════════════════════════════════
//
// User (2026-09-30): "do those relationship settings persist between shows,
// like a married couple stays married in life after the show". A season that
// records nothing is forgotten by the next show: the friend made in the
// Circle is a stranger on The Traitors. Perfect Match, The Traitors and Drag
// Race each write a record when their last episode airs; this is the
// Circle's, in THE SAME SHAPE (franchise-meta.js deriveSeasonRecord), so
// buildFranchiseMeta reads it without knowing which show it came from.
//
// It is about PEOPLE, not profiles: a pair's two people each carry the
// profile's result, and a catfish is the person behind the persona.
//   allies      friends both ways (affection, or a pact they kept)
//   rivals      a grudge either way
//   showmances  a romance both felt and acted on: intact if they met at the
//               finale or kissed at a visit, otherwise it ended with the game
//   betrayed    an Influencer who blocked someone they had sworn to protect;
//               a visit lie that turned a player against someone; a catfish
//               who flirted in character with someone who fell for it
// Computed while the season's own relationship layer is live (ci-run.js
// builds it right after playing the season).
import { rel, peopleOf } from './state.js';
import { CIRCLE_FORMAT } from '../shows.js';

// Friends both ways (the relationship layer's affection, 0-10).
const ALLY_AFFECTION = 5;
// A grudge (resentment runs lower than affection: it rarely passes 3).
const RIVAL_RESENTMENT = 3;
// A romance: attraction both ways, and at least this many warm flirts.
const ROMANCE_ATTRACTION = 6, ROMANCE_FLIRTS = 2;

const pairKey = (a, b) => [a, b].sort().join('|');

export function ciLedgerRecord(rows = [], state = null, { cast = null, winners = [], result = null, seasonName = null, archetypeOf = () => null } = {}) {
  if (!state || !rows.length) return null;
  const handles = Object.keys(state.profiles);
  const names = cast || [...new Set(handles.flatMap(h => peopleOf(state, h)))];
  const handleOf = n => state.handleOf[n];

  // Placements: the finale's board, then the blocked from last out to first out.
  const place = {};
  const finals = result?.placements || [];
  for (const p of finals) place[p.profile] = p.place;
  const out = [...state.blocked].reverse();
  let next = finals.length + 1;
  for (const b of out) if (place[b.handle] == null) place[b.handle] = next++;
  for (const h of handles) if (place[h] == null) place[h] = next++;
  const won = new Set(winners);
  const firstPlace = finals.find(p => p.place === 1)?.profile;

  const lastDay = new Map(state.blocked.map(b => [b.handle, b.day]));
  const days = rows.length;
  const flirts = new Map();
  for (const sc of state.scenes) {
    if (sc.kind !== 'chat' || sc.data?.intent !== 'flirt' || sc.data.ending !== 'warm' || sc.data.performed) continue;
    const k = pairKey(sc.who[0], sc.who[1]);
    flirts.set(k, (flirts.get(k) || 0) + 1);
  }
  const met = new Set(handles.filter(h => state.active.includes(h)));
  const kissed = new Set(state.scenes.filter(s => s.kind === 'visit' && s.data?.kiss).map(s => pairKey(s.who[0], s.who[1])));

  const rec = { seasonName: seasonName || 'The Circle', format: CIRCLE_FORMAT, fanFavorite: null, ratings: null, players: {} };
  try { rec.fanFavorite = result?.fanFavorite || null; } catch { /* none */ }

  const others = h => handles.filter(o => o !== h);
  for (const n of names) {
    const h = handleOf(n);
    if (!h) continue;
    const peopleOfAll = o => peopleOf(state, o);
    const allies = others(h).filter(o => (rel(h, o, 'affection') >= ALLY_AFFECTION && rel(o, h, 'affection') >= ALLY_AFFECTION)
      || state.pacts.some(p => pairKey(p.a, p.b) === pairKey(h, o) && (p.kept || []).length)).flatMap(peopleOfAll);
    const rivals = others(h).filter(o => Math.max(rel(h, o, 'resentment'), rel(o, h, 'resentment')) >= RIVAL_RESENTMENT)
      .flatMap(peopleOfAll).filter(o => !allies.includes(o));
    const showmances = others(h).filter(o => rel(h, o, 'attraction') >= ROMANCE_ATTRACTION && rel(o, h, 'attraction') >= ROMANCE_ATTRACTION
      && (flirts.get(pairKey(h, o)) || 0) >= ROMANCE_FLIRTS)
      .flatMap(o => peopleOfAll(o).map(partner => ({ partner,
        ended: (met.has(h) && met.has(o)) || kissed.has(pairKey(h, o)) ? 'intact' : 'breakup' })));
    rec.players[n] = {
      placement: place[h] || 0,
      winner: won.has(n) || h === firstPlace,
      finalist: state.active.includes(h),
      episodesLasted: lastDay.get(h) || days,
      blindsided: false, blindsidedBy: [], blindsidesAuthored: 0,
      idolsFound: 0, idolsPlayed: 0, idoledOut: false,
      betrayed: [], betrayedBy: [],
      allies: allies.filter(o => o !== n), showmances, rivals: rivals.filter(o => o !== n),
      chalWins: 0, schemesCaught: 0,
      archetype: archetypeOf(n),
      popularity: 0,
    };
  }
  // Friendship is both ways or not at all.
  for (const [n, p] of Object.entries(rec.players)) p.allies = p.allies.filter(o => rec.players[o]?.allies.includes(n));

  const wrong = (byH, toH) => {
    for (const by of peopleOf(state, byH)) for (const to of peopleOf(state, toH)) {
      if (!rec.players[by] || !rec.players[to] || by === to) continue;
      if (!rec.players[by].betrayed.includes(to)) rec.players[by].betrayed.push(to);
    }
  };
  // An Influencer who blocked someone they had sworn to protect.
  for (const b of state.blocked) {
    for (const by of b.by || []) if (state.pacts.some(p => p.kind === 'protect' && pairKey(p.a, p.b) === pairKey(by, b.handle))) wrong(by, b.handle);
  }
  // A visit lie that turned somebody against a rival.
  for (const s of state.scenes) if (s.kind === 'report' && s.data?.rival) wrong(s.who[0], s.data.rival);
  // A catfish who flirted in character with someone who fell for the persona.
  for (const s of state.scenes) {
    if (s.kind === 'chat' && s.data?.performed && s.data.ending === 'warm' && rel(s.who[1], s.who[0], 'attraction') >= ROMANCE_ATTRACTION) wrong(s.who[0], s.who[1]);
  }
  for (const n of Object.keys(rec.players)) for (const v of rec.players[n].betrayed) {
    if (!rec.players[v].betrayedBy.includes(n)) rec.players[v].betrayedBy.push(n);
  }
  return rec;
}

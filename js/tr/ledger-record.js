// ══════════════════════════════════════════════════════════════════════
// tr/ledger-record.js — what a castle season leaves the franchise
// ══════════════════════════════════════════════════════════════════════
//
// The Traitors read the franchise ledger (shows.js historyFromLedger) and wrote
// nothing to it, so a friendship forged in the castle, or a murder a friend
// signed, was forgotten the next time the two were cast together anywhere
// (user: bonds must "persist between seasons, between shows").
//
// The same shape js/franchise-meta.js deriveSeasonRecord writes, so
// buildFranchiseMeta reads it without knowing the show:
//   allies     friends both ways at the end (the castle's bond graph)
//   rivals     a bond that ended cold
//   betrayed   whoever they wronged, as the room learns it at the reveal:
//              murdering a friend, banishing a friend, and a Traitor voting
//              out one of their own
//   showmances none: the castle plays no romance of its own (couples reach it
//              from other shows through js/franchise-carry.js)
//
// Computed while the season's own bonds are live (tr-run.js, right after the
// season is played, before it restores the outer gs).
import { getBond } from '../bonds.js';
import { traitorsVotingHistory, traitorsPlacements, TRAITORS_FORMAT } from './export.js';

const ALLY = 6, RIVAL = -4;
// Who counts as a friend when you vote them out, or kill them.
const FRIEND_BANISHED = 4, FRIEND_MURDERED = 2;

export function trLedgerRecord(result = {}, { cast = null, seasonName = null, archetypeOf = () => null } = {}) {
  const history = traitorsVotingHistory(result);
  const placed = traitorsPlacements(result, history);
  const names = cast || placed.map(p => p.name);
  if (!names.length) return null;
  const byName = new Map(placed.map(p => [p.name, p]));
  // The pact as it was at any point: the first Traitors and everyone recruited.
  const traitors = new Set([...(result.traitors || []), ...(result.log || []).map(l => l.recruited).filter(Boolean)]);
  const rec = { seasonName: seasonName || 'The Traitors', format: TRAITORS_FORMAT, fanFavorite: null, ratings: null, players: {} };
  for (const n of names) {
    const p = byName.get(n);
    rec.players[n] = {
      placement: p?.placement || 0,
      winner: p?.placement === 1,
      finalist: p?.status === 'Winner' || p?.status === 'Runner-up',
      episodesLasted: p?.exitEpisode || history.length,
      blindsided: false, blindsidedBy: [], blindsidesAuthored: 0,
      idolsFound: 0, idolsPlayed: 0, idoledOut: false,
      betrayed: [], betrayedBy: [],
      allies: names.filter(o => o !== n && getBond(n, o) >= ALLY && getBond(o, n) >= ALLY),
      rivals: names.filter(o => o !== n && getBond(n, o) <= RIVAL),
      showmances: [],
      chalWins: 0, schemesCaught: 0,
      archetype: archetypeOf(n),
      // No audience figure: in the castle only js/tr/crowd.js may touch that
      // ledger (tests/tr-audience.test.js), and a record reads it as optional.
    };
  }
  const wrong = (by, to) => {
    if (!rec.players[by] || !rec.players[to] || by === to || rec.players[by].betrayed.includes(to)) return;
    rec.players[by].betrayed.push(to);
  };
  for (const row of history) {
    for (const v of row.votes || []) {
      if (v.channel === 'murder' && row.murdered === v.target && getBond(v.voter, v.target) >= FRIEND_MURDERED) wrong(v.voter, v.target);
      if ((v.channel === 'banishment' || v.channel === 'banishment-revote') && row.eliminated === v.target) {
        if (getBond(v.voter, v.target) >= FRIEND_BANISHED) wrong(v.voter, v.target);
        if (traitors.has(v.voter) && traitors.has(v.target)) wrong(v.voter, v.target);
      }
    }
  }
  for (const n of names) for (const v of rec.players[n].betrayed) {
    if (!rec.players[v].betrayedBy.includes(n)) rec.players[v].betrayedBy.push(n);
  }
  return rec;
}

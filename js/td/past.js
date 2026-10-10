// ══════════════════════════════════════════════════════════════════════
// td/past.js — what happened to a returnee last time, as the scenes need it
// ══════════════════════════════════════════════════════════════════════
// The user, 2026-10-09: "we don't have returnee dialogue, only first timer". A returnee season read
// as a cast of strangers: of 184 scenes with a returnee in them, 7 mentioned that they had played
// before, and those seven said "last time" and nothing else. Everything here comes from the ledger
// (franchise-meta.js lastSeasonOf): the record of a season that was really played. Nothing is
// invented: a returnee with no record has no past here, and their scenes are a first-timer's.
//
// pastOf(name) -> null | {
//   where 'Season 1', place 4, placeWord '4th', total 16, seasons (how many before),
//   kind: 'won' | 'final' (finalist, lost) | 'early' (one of the first three out) |
//         'blindsided' (out without seeing it) | 'mid' (anything else),
//   by    the one who blindsided them, or who betrayed them (a name, or null),
//   partner, partnerEnded ('intact' | 'breakup'), wins (challenge wins)
// }
import { players } from '../core.js';
import { lastSeasonOf } from '../franchise-meta.js';

const ORD = n => { const s = ['th', 'st', 'nd', 'rd'], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); };

export const isReturnee = name => !!name && !!players.find(p => p.name === name)?.isReturnee;

export function pastOf(name) {
  if (!isReturnee(name)) return null;
  let last = null;
  try { last = lastSeasonOf(name); } catch { last = null; }
  const r = last?.rec;
  if (!r || !(r.placement > 0)) return null;
  const total = last.total || r.placement;
  // a past champion is introduced as one, whatever happened since: {lastSeason} is then the season they won
  const champ = !r.winner && !!last.wonWhere;
  const kind = r.winner || champ ? 'won'
    : r.finalist ? 'final'
      : r.placement > total - 3 ? 'early'
        : r.blindsided ? 'blindsided'
          : 'mid';
  const by = (r.blindsidedBy || [])[0] || (r.betrayedBy || [])[0] || null;
  const sh = (r.showmances || [])[0] || null;
  return {
    where: champ ? last.wonWhere : last.where, place: r.placement, champ, placeWord: ORD(r.placement), total, seasons: last.seasons,
    kind, by, partner: sh?.partner || null, partnerEnded: sh?.ended || null, wins: r.chalWins || 0,
  };
}

// The words a scene fills in for the returnee in a part (role 'a' -> lastSeason, lastPlace, lastBy;
// role 'b' -> lastSeasonB...). Only the keys that have a value: a scene that needs {lastBy} is gated
// on the fact that says there is one (past: 'blindsided'), and fill() leaves nothing half-written.
export function pastData(name, suffix = '') {
  const p = pastOf(name);
  if (!p) return {};
  const out = { [`lastSeason${suffix}`]: p.where, [`lastPlace${suffix}`]: p.placeWord };
  if (p.by) out[`lastBy${suffix}`] = p.by;
  if (p.partner) out[`lastPartner${suffix}`] = p.partner;
  return out;
}

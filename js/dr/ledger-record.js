// ══════════════════════════════════════════════════════════════════════
// dr/ledger-record.js — what a Drag Race season leaves the franchise
// ══════════════════════════════════════════════════════════════════════
//
// A drag season read the franchise ledger (through initGameState's bond
// seeding, js/savestate.js) and wrote nothing back, so a queen's drag sister,
// her showmance and her worst enemy were strangers the next time the two were
// cast together — an All Stars, or The Traitors (user: bonds must "persist
// between seasons, between shows").
//
// The same shape js/franchise-meta.js deriveSeasonRecord writes, so
// buildFranchiseMeta reads it without knowing the show:
//   showmances  a romance still standing at the end ('intact')
//   allies      her drag family, and friends both ways at the end
//   rivals      a bond that ended cold
//   betrayed    none: the werk room's shade is carried in the bonds, and a
//               rivalry is what it leaves
// Read at the finale, off the live relationship layer (a drag season plays on
// the run tab's own gs).
import { getBond } from '../bonds.js';
import { dragPlacements, dragShowmance, dragFamilies } from './export.js';
import { DRAG_FORMAT } from '../shows.js';

const ALLY = 6, RIVAL = -4;

export function drLedgerRecord(rows = [], { cast = null, seasonName = null, archetypeOf = () => null } = {}) {
  if (!rows.length) return null;
  const placed = dragPlacements(rows, cast);
  const names = cast && cast.length ? cast : placed.map(p => p.name);
  const byName = new Map(placed.map(p => [p.name, p]));
  const families = dragFamilies(rows);
  const rec = { seasonName: seasonName || 'Drag Race', format: DRAG_FORMAT, fanFavorite: null, ratings: null, players: {} };
  for (const n of names) {
    const p = byName.get(n);
    const partner = dragShowmance(rows, n);
    const family = families.filter(f => f.members.includes(n)).flatMap(f => f.members).filter(o => o !== n);
    const friends = names.filter(o => o !== n && getBond(n, o) >= ALLY && getBond(o, n) >= ALLY);
    const allies = [...new Set([...family, ...friends])].filter(o => o !== partner && names.includes(o));
    rec.players[n] = {
      placement: p?.placement || 0,
      winner: p?.placement === 1,
      finalist: ['Winner', 'Runner-up', 'Finalist'].includes(p?.status),
      episodesLasted: p?.exitEpisode || rows.length,
      blindsided: false, blindsidedBy: [], blindsidesAuthored: 0,
      idolsFound: 0, idolsPlayed: 0, idoledOut: false,
      betrayed: [], betrayedBy: [],
      allies,
      rivals: names.filter(o => o !== n && !allies.includes(o) && getBond(n, o) <= RIVAL),
      showmances: partner ? [{ partner, ended: 'intact' }] : [],
      chalWins: 0, schemesCaught: 0,
      archetype: archetypeOf(n),
    };
  }
  return rec;
}

// ══════════════════════════════════════════════════════════════════════
// pm/ledger-record.js — what a Perfect Match season leaves the franchise
// ══════════════════════════════════════════════════════════════════════
//
// User: "make sure the bonds, positive and negative, between islanders persist
// between seasons (an All Stars), between shows (two islanders on The
// Traitors), and outside the shows". Total Drama and Big Brother write a season
// record at the finale (js/franchise-meta.js deriveSeasonRecord) and every
// show's season start seeds its bonds from those records — but a Perfect Match
// season recorded nothing, so an islander's ex, best friend and worst enemy
// were strangers the next time the two were cast together anywhere.
//
// THE SAME SHAPE as deriveSeasonRecord's, so buildFranchiseMeta reads it
// without knowing which show it came from: `allies`, `rivals`, `betrayed` /
// `betrayedBy`, `showmances` [{ partner, ended }]. What each means here:
//   showmances  every couple that was real: the ones who finished together or
//               left together are 'intact'; the ones that ended are 'breakup'
//   allies      friends both ways (the villa's friendships, not its couples)
//   rivals      a bond that ended cold, or a feud the villa watched
//   betrayed    whoever they wronged: a partner they twisted on at Casa, the
//               one whose partner they stole, the one a game player worked,
//               a partner who found out about a kiss or a bed
//
// Computed while the season's own relationship layer is live (pm-run.js
// builds it right after playing the season, before it restores the outer gs).
import { getBond } from '../bonds.js';
import { romance, friendship } from './feelings.js';
import { pmPlacements } from './export.js';
import { PERFECT_MATCH_FORMAT } from '../shows.js';

// A couple is "real" when it lasted or was felt: two episodes coupled, or a
// romance of 5 either way. A one-night recoupling pairing is not an ex.
const REAL_EPISODES = 2, REAL_ROMANCE = 5;
// Friends both ways (the relationship layer's affection, 0-10).
const ALLY_AFFECTION = 5;
// A bond this cold at the end is a rivalry (deriveSeasonRecord's line).
const RIVAL_BOND = -4;

const pairKey = (a, b) => [a, b].sort().join('|');

export function pmLedgerRecord(rows = [], state = null, { seasonName = null, cast = null, winners: won = [], archetypeOf = () => null } = {}) {
  const names = cast || [...new Set(rows.flatMap(r => r.pm?.villa || []))];
  if (!rows.length || !names.length) return null;
  const placements = new Map(pmPlacements(rows).map(p => [p.name, p]));
  const last = rows[rows.length - 1]?.pm || {};
  const finalRow = rows.find(r => r.moment === 'final');
  const finalCouples = (finalRow?.pm?.couples || []).map(c => pairKey(c[0], c[1]));
  const winners = new Set(won);

  // Every couple, how long it lasted and how it ended.
  const couples = new Map();
  rows.forEach((r, i) => {
    for (const [a, b] of r.pm?.couples || []) {
      const k = pairKey(a, b);
      const c = couples.get(k) || { a, b, eps: 0, lastRow: i };
      c.eps++; c.lastRow = i;
      couples.set(k, c);
    }
  });
  const exitRow = new Map();
  rows.forEach(r => (r.exits || []).forEach(x => exitRow.set(x.name, r.num)));
  const leftTogether = (a, b) => exitRow.has(a) && exitRow.get(a) === exitRow.get(b);

  const rec = { seasonName: seasonName || 'Perfect Match', format: PERFECT_MATCH_FORMAT, fanFavorite: null, ratings: null, players: {} };
  const approval = last.approval || {};
  const fav = Object.entries(approval).sort((x, y) => y[1] - x[1])[0]?.[0];
  if (fav) rec.fanFavorite = fav;

  for (const n of names) {
    const pl = placements.get(n);
    const showmances = [];
    for (const [k, c] of couples) {
      if (c.a !== n && c.b !== n) continue;
      const o = c.a === n ? c.b : c.a;
      const felt = Math.max(romance(n, o), romance(o, n));
      if (c.eps < REAL_EPISODES && felt < REAL_ROMANCE) continue;
      const intact = finalCouples.includes(k) || leftTogether(n, o);
      showmances.push({ partner: o, ended: intact ? 'intact' : 'breakup' });
    }
    const allies = names.filter(o => o !== n && friendship(n, o) >= ALLY_AFFECTION && friendship(o, n) >= ALLY_AFFECTION
      && !showmances.some(s => s.partner === o));
    const feuding = o => (state?.exFeuds || []).some(f => [f.a, f.b, f.d, f.l].includes(n) && [f.a, f.b, f.d, f.l].includes(o))
      || (state?.feuds || []).some(f => [f.a, f.b].includes(n) && [f.a, f.b].includes(o));
    const rivals = names.filter(o => o !== n && !allies.includes(o) && (getBond(n, o) <= RIVAL_BOND || feuding(o)));
    rec.players[n] = {
      placement: pl?.placement || 0,
      winner: winners.has(n) || pl?.placement === 1,
      finalist: !!finalCouples.find(k => k.split('|').includes(n)),
      episodesLasted: exitRow.get(n) || rows.length,
      blindsided: false, blindsidedBy: [], blindsidesAuthored: 0,
      idolsFound: 0, idolsPlayed: 0, idoledOut: false,
      betrayed: [], betrayedBy: [],
      allies, showmances, rivals,
      chalWins: 0, schemesCaught: 0,
      archetype: archetypeOf(n),
      popularity: Math.round((approval[n] || 0) * 10) / 10,
    };
  }

  // Who wronged whom, from what the villa did.
  const wrong = (by, to) => {
    if (!rec.players[by] || !rec.players[to] || by === to) return;
    if (!rec.players[by].betrayed.includes(to)) rec.players[by].betrayed.push(to);
  };
  const events = (state?.history || []).length ? state.history : rows.flatMap(r => r.pm?.events || []);
  for (const e of events) {
    // A steal (not taking back your own partner) wrongs the one left standing.
    if (e.kind === 'recouple-pick' && e.extra?.stole && !e.extra?.reclaim) wrong(e.players[0], e.extra.stole);
    if (e.kind === 'steal') wrong(e.players[0], e.players[2]);
    // Twisting at Casa on a partner who stuck.
    if (e.kind === 'casa-return' && e.extra?.choice === 'twist' && e.extra?.theirs === 'stick') {
      const partner = [...couples.values()].filter(c => (c.a === e.players[0] || c.b === e.players[0]) && c.lastRow < rows.findIndex(r => r.num === e.ep))
        .sort((x, y) => y.lastRow - x.lastRow)[0];
      if (partner) wrong(e.players[0], partner.a === e.players[0] ? partner.b : partner.a);
    }
  }
  // A kiss or a bed the partner found out about.
  for (const s of state?.secrets || []) if (s.known && ['kiss', 'bed', 'promise'].includes(s.kind) && s.partner) wrong(s.who, s.partner);
  // The game player's mark, once the game was called.
  for (const g of state?.games || []) if (g.called && g.t) wrong(g.g, g.t);

  for (const n of names) for (const v of rec.players[n].betrayed) {
    if (!rec.players[v].betrayedBy.includes(n)) rec.players[v].betrayedBy.push(n);
  }
  return rec;
}

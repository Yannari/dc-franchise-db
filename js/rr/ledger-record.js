// ══════════════════════════════════════════════════════════════════════
// rr/ledger-record.js — what a season of The Ridonculous Race leaves the franchise
// ══════════════════════════════════════════════════════════════════════
//
// The manual's §8.2 step 5 and §8.3: a season that records nothing is forgotten by the
// next show. The same shape as every other show's record (ch/ledger-record.js,
// franchise-meta.js deriveSeasonRecord), read without knowing which show it came from:
//   allies      the partner (unless the race broke them), or friends both ways at the end
//   rivals      a rivalry the race kept feeding, or a bond this low
//   showmances  every couple the race made: intact unless they split; and a team who are a couple, with the stage
//               they leave at (dating, engaged after a yes on the mat, married), so the next show meets them so
//   betrayed    a caught sabotage, a debt dodged, an alliance or a deal broken
// Computed while the season's relationship layer is live (right after playRaceSeason).
import { RR_FORMAT } from './format.js';
import { getBond } from '../bonds.js';

// what a team who are a couple are (rr/state.js REL); 'once-engaged' is two former fiancés, a couple again only on a yes
const COUPLE_RELS = ['dating', 'newly-dating', 'on-off', 'married'];
const ALLY_BOND = 3, PARTNER_FLOOR = -3, RIVAL_BOND = -3.5, RIVALRY = 2;
const pairKey = (a, b) => [a, b].sort().join('|');

export function rrLedgerRecord(state, result = {}, { seasonName = null, archetypeOf = () => null, popularity = {} } = {}) {
  if (!state?.order?.length) return null;
  const people = id => (state.teams[id] ? [state.teams[id].a, state.teams[id].b] : []);
  const teamOfName = n => state.order.find(id => state.teams[id].a === n || state.teams[id].b === n);
  const cast = state.order.flatMap(people);
  const place = result.placements || {};
  const finalists = new Set([...(result.final?.order || []), result.final?.midOut].filter(Boolean));
  const totalLegs = (result.legs || state.legs).length;

  // the leg each team left on, in the order things happened (a medevac's returning team races on)
  const events = [
    ...state.legs.flatMap(l => (l.eliminated || []).map(id => ({ leg: l.n, k: 0, id, out: true }))),
    ...(state.medevacs || []).flatMap(m => [{ leg: m.leg, k: 1, id: m.id, out: true },
      ...(m.returned ? [{ leg: m.leg, k: 2, id: m.returned, out: false }] : [])]),
    ...Object.entries(state.quitting || {}).map(([id, n]) => ({ leg: n, k: 1, id, out: true })),
  ].sort((x, y) => x.leg - y.leg || x.k - y.k);
  const leftAt = {};
  for (const e of events) { if (e.out) leftAt[e.id] = e.leg; else delete leftAt[e.id]; }

  // team-to-team betrayals: [doer team, victim team]
  const betrayals = [];
  for (const sc of state.scenes) {
    if (sc.data?.facts?.caught && sc.data.other) betrayals.push([sc.data.team, sc.data.other]);
    if ((sc.kind === 'alliance-betrayal' && sc.data.ending === 'discovered') || (sc.kind === 'deal-broken' && sc.data.ending === 'walk-away')) {
      if (sc.data.other) betrayals.push([sc.data.team, sc.data.other]);
    }
  }
  for (const d of state.debts || []) if (d.dodged) betrayals.push([d.from, d.to]);
  const betrayedPairs = new Set(betrayals.flatMap(([a, b]) => people(a).flatMap(x => people(b).map(y => pairKey(x, y)))));

  const rec = { seasonName: seasonName || 'The Ridonculous Race', format: RR_FORMAT, fanFavorite: null, ratings: null, players: {} };
  for (const n of cast) {
    const id = teamOfName(n);
    const t = state.teams[id];
    const partner = t.a === n ? t.b : t.a;
    const others = cast.filter(o => o !== n);
    const allies = others.filter(o => {
      if (o === partner) return getBond(n, o) >= PARTNER_FLOOR;
      if (betrayedPairs.has(pairKey(n, o))) return false;
      return getBond(n, o) >= ALLY_BOND && getBond(o, n) >= ALLY_BOND;
    });
    const rivals = others.filter(o => {
      if (allies.includes(o)) return false;
      const oid = teamOfName(o);
      return (oid !== id && (state.rivalry[pairKey(id, oid)] || 0) >= RIVALRY) || getBond(n, o) <= RIVAL_BOND;
    });
    const showmances = (state.couples || []).filter(c => c.a === n || c.b === n).map(c => {
      const other = c.a === n ? c.b : c.a;
      const lasted = Math.max(0, (c.ended || totalLegs) - (c.since || 0));
      const strength = Math.round((Math.max(0, Math.min(10, getBond(n, other))) / 10 * 0.6 + Math.min(1, lasted / 6) * 0.4) * 100) / 100;
      return { partner: other, ended: c.ended ? 'breakup' : 'intact', since: c.since || 0, endedEp: c.ended || null, strength };
    });
    // the partner, when the two of them are a couple (a team, not a showmance the race made): the stage they leave at
    const stage = t.engagedAt || t.history?.engaged ? 'engaged' : t.rel === 'married' ? 'married'
      : COUPLE_RELS.includes(t.rel) ? 'dating' : null;
    if (stage && partner && !showmances.some(s => s.partner === partner)) {
      showmances.push({ partner, ended: 'intact', since: 0, endedEp: null, strength: 1, stage, team: true });
    }
    const betrayed = [...new Set(betrayals.filter(([a]) => a === id).flatMap(([, b]) => people(b)))];
    const betrayedBy = [...new Set(betrayals.filter(([, b]) => b === id).flatMap(([a]) => people(a)))];
    const r = state.rec[id];
    rec.players[n] = {
      placement: place[id] || 0,
      winner: id === result.winner,
      finalist: finalists.has(id),
      episodesLasted: leftAt[id] ?? totalLegs,
      blindsided: false, blindsidedBy: [], blindsidesAuthored: 0,
      idolsFound: 0, idolsPlayed: 0, idoledOut: false,
      betrayed, betrayedBy,
      allies, showmances, rivals,
      chalWins: r.legWins,
      schemesCaught: r.caught,
      archetype: archetypeOf(n),
      popularity: Number(popularity[n]) || 0,
      rr: { team: t.name, partner, rel: t.rel, identity: t.identity || null, legWins: r.legWins,
        penalties: r.penalties, begged: r.begged, lasts: r.lasts, sabotage: r.sabotage, helped: r.helped },
    };
  }
  return rec;
}

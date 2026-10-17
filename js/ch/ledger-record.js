// ══════════════════════════════════════════════════════════════════════
// ch/ledger-record.js — what a Challenge season leaves the franchise
// ══════════════════════════════════════════════════════════════════════
//
// The manual's §8.2 step 5: a season that records nothing is forgotten by the
// next show, so the ally made on Blue Lagoon is a stranger on The Traitors.
// The same shape as every other show's record (franchise-meta.js
// deriveSeasonRecord), so buildFranchiseMeta reads it without knowing which
// show it came from:
//   allies      friends both ways at the end, or alliance-mates nobody betrayed
//   rivals      a feud that kept escalating, or a grudge either way
//   showmances  every couple: intact unless they split (a partner going home
//               leaves the couple intact, outside the game)
//   betrayed    an ally voted in or called out; a deal broken
// Computed while the season's own relationship layer is live (ch-run.js builds
// it right after playing the season, before the outer gs comes back).
import { CHALLENGE_FORMAT } from '../shows.js';
import { getBond } from '../bonds.js';
import { warmthOf, resentOf } from './rel.js';

// Friends both ways: warmth (affection less resentment, -10..10) each way.
const ALLY_WARMTH = 3;
// A grudge either way, or a bond this low.
const RIVAL_RESENT = 4, RIVAL_BOND = -3.5;
// A feud the house kept seeing (events.js addRivalry counts its rows).
const FEUD_ROWS = 2;

const pairKey = (a, b) => [a, b].sort().join('|');
// A showmance's strength, 0..1: the bond at the end (or at the breakup's -4) and the episodes it lasted.
export function strengthOf(n, c, lastEp) {
  const other = c.a === n ? c.b : c.a;
  const bond = Math.max(0, Math.min(10, getBond(n, other))) / 10;
  const lasted = Math.max(0, (c.ended || lastEp) - (c.since || 0));
  return Math.round((bond * 0.6 + Math.min(1, lasted / 6) * 0.4) * 100) / 100;
}

export function chLedgerRecord(state, result = {}, { seasonName = null, archetypeOf = () => null, popularity = {} } = {}) {
  if (!state || !state.cast?.length) return null;
  const cast = state.cast;
  const place = result.placements || {};
  const champs = new Set(result.champions || state.champions || []);
  const finalists = new Set(Object.keys(state.final?.placements || {}));
  const goneAt = Object.fromEntries(state.gone.map(g => [g.name, g]));
  const lastEp = Math.max(0, ...state.episodes.map(e => e.ep)) + (state.final ? 1 : 0);

  // Who betrayed whom, from what aired as public scenes.
  const betrayals = [];
  for (const sc of state.scenes) {
    if (sc.kind === 'alliance-betrayal' || sc.kind === 'deal-broken') betrayals.push([sc.who[0], sc.who[1]]);
    // jumping to another alliance is a betrayal of the old one's leader (alliances.js allianceShifts)
    if (sc.kind === 'alliance-leave' && sc.data?.why === 'defected') betrayals.push([sc.who[0], sc.who[1]]);
  }
  // A Pairs season's ending: keeping the money is the heaviest betrayal the show has (share-keep.js)
  const choices = state.final?.choices || [];
  for (const c of choices) if (c.keep) betrayals.push([c.chooser, c.partner]);
  const betrayedPair = new Set(betrayals.map(([a, b]) => pairKey(a, b)));
  // who each of them played the season with (the last pair they were in), in a Pairs season
  const lastPartner = n => { const h = (state.pairHistory || []).filter(x => x.a === n || x.b === n).at(-1); return h ? (h.a === n ? h.b : h.a) : null; };

  // Alliance-mates: anyone who sat in the same group, in it or since gone.
  const mates = new Set();
  for (const al of state.alliances || []) {
    const everyone = [...new Set([...(al.members || []), ...(al.former || [])])];
    for (let i = 0; i < everyone.length; i++) for (let j = i + 1; j < everyone.length; j++) mates.add(pairKey(everyone[i], everyone[j]));
  }
  const rivalry = state.rivalry || {};
  const feudOf = (a, b) => rivalry[pairKey(a, b)] || rivalry[`${a}|${b}`] || rivalry[`${b}|${a}`] || 0;

  const rec = { seasonName: seasonName || 'The Challenge', format: CHALLENGE_FORMAT, fanFavorite: null, ratings: null, players: {} };
  // Every written exchange this season aired, by id: the next season holds them back (ch-run.js heardBefore).
  const aired = Object.keys(state.lineLedger?.uses || {});
  if (aired.length) rec.lines = aired.sort();
  for (const n of cast) {
    const others = cast.filter(o => o !== n);
    const allies = others.filter(o => {
      const k = pairKey(n, o);
      if (betrayedPair.has(k)) return false;
      const warm = warmthOf(n, o) >= ALLY_WARMTH && warmthOf(o, n) >= ALLY_WARMTH;
      return warm || (mates.has(k) && getBond(n, o) >= 1);
    });
    const rivals = others.filter(o => !allies.includes(o) && (feudOf(n, o) >= FEUD_ROWS
      || Math.max(resentOf(n, o), resentOf(o, n)) >= RIVAL_RESENT || getBond(n, o) <= RIVAL_BOND));
    const showmances = (state.couples || []).filter(c => c.a === n || c.b === n)
      // overlapping: this player had somebody at home (life-resolver.js reads it as "was unfaithful to")
      .map(c => ({ partner: c.a === n ? c.b : c.a, ended: c.ended && c.endedBy !== 'exit' ? 'breakup' : 'intact',
        ...(c.overlapping?.includes(n) ? { overlapping: true } : {}), since: c.since || 0, endedEp: c.ended || null,
        // how strong it was, 0..1: the bond they ended on and how long it lasted (life-resolver.js reads it: a
        // couple who were inseparable for six episodes is likelier to last outside than a two-day fling)
        strength: strengthOf(n, c, lastEp) }));
    const r = state.rec[n] || {};
    const g = goneAt[n];
    rec.players[n] = {
      placement: place[n] || 0,
      winner: champs.has(n),
      finalist: finalists.has(n),
      episodesLasted: g ? g.ep : lastEp,
      blindsided: false, blindsidedBy: [], blindsidesAuthored: 0,
      idolsFound: 0, idolsPlayed: 0, idoledOut: false,
      betrayed: [], betrayedBy: [],
      allies, showmances, rivals,
      chalWins: r.dailyWins || 0, schemesCaught: 0,
      archetype: archetypeOf(n),
      popularity: Number(popularity[n]) || 0,
      // The show's own numbers, for the export (sub-project 6) and the wiki.
      ch: { dailyWins: r.dailyWins || 0, arenaWins: r.arenaW || 0, arenaLosses: r.arenaL || 0,
        timesVotedIn: r.votedIn || 0, calledOut: r.calledOut || 0, volunteered: r.volunteered || 0,
        division: state.division[n] || null, rookie: !!state.rookie[n], left: g ? g.how : null,
        ...(state.options?.pairs ? { pairing: state.options.pairs.pairing || 'rivals', partner: lastPartner(n),
          partners: [...new Set((state.pairHistory || []).filter(x => x.a === n || x.b === n).map(x => (x.a === n ? x.b : x.a)))] } : {}),
        ...(() => {
          const c = choices.find(x => x.chooser === n || x.partner === n);
          return c ? { choice: { chose: c.chooser === n, keep: c.keep, amount: c.prize, with: c.chooser === n ? c.partner : c.chooser, place: c.place } } : {};
        })() },
      // the partner they kept the money from (franchise-meta seeds the grudge, every season after, every show)
      ...(choices.some(c => c.keep && c.chooser === n) ? { keptMoneyFrom: choices.filter(c => c.keep && c.chooser === n).map(c => c.partner) } : {}),
    };
  }
  // Friendship is both ways or not at all.
  for (const [n, p] of Object.entries(rec.players)) p.allies = p.allies.filter(o => rec.players[o]?.allies.includes(n));
  // The closest of them (a bond of 5 or more, both ways): the export's unbreakableBonds, D1's `bonds` table.
  for (const [n, p] of Object.entries(rec.players)) p.closest = p.allies.filter(o => getBond(n, o) >= 5);
  for (const [by, to] of betrayals) {
    if (!rec.players[by] || !rec.players[to] || by === to) continue;
    if (!rec.players[by].betrayed.includes(to)) rec.players[by].betrayed.push(to);
    if (!rec.players[to].betrayedBy.includes(by)) rec.players[to].betrayedBy.push(by);
  }
  return rec;
}

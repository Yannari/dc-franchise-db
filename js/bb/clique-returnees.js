// ══════════════════════════════════════════════════════════════════════
// bb/clique-returnees.js — BB11's first night: four returnees, one HOH
// ══════════════════════════════════════════════════════════════════════
//
// From the wiki (user, 2026-10-24: the themes "have to be perfect 1:1 of the
// real show"):
//
//   "4 possible returning Houseguests were representing each of the four
//    cliques ... should their respective clique win the first competition,
//    they would enter the game and would be given the first Head of
//    Household reign." The first HOH competition was "The Wedgie": "the
//    houseguests were suspended by underwear attached to a rope and were
//    required to hang on to a toilet seat." Natalie and Russell won it for the
//    Athletes, and Jessie walked in as a houseguest and the first HOH.
//
// Ours: the cast's most decorated veteran is the returnee who gets in (held
// out of the move-in, like the Mystery Houseguest), and three other past
// houseguests from the franchise ledger, not in this cast, stand behind the
// other cliques and go home with them. A cast with no veteran still plays the
// clique competition, and its last houseguest hanging is the first HOH. Only
// people the franchise really has are ever named.
import { gs } from '../core.js';
import { pStats } from '../players.js';
import { activeSeasons, seasonKeyParts } from '../franchise-meta.js';
import { SHOWS } from '../shows.js';

const st = (n, k) => { try { return Number(pStats(n)?.[k]) || 5; } catch { return 5; } };

/** Up to `count` past houseguests the ledger knows, none of them in this cast, best careers first. */
export function supportingAlumni(cast = [], count = 3) {
  const seen = new Map();
  for (const [key, s] of Object.entries(activeSeasons() || {})) {
    if (!s || s.included === false) continue;
    const { format, num } = seasonKeyParts(key, s);
    for (const [name, rec] of Object.entries(s.players || {})) {
      if (!name || cast.includes(name)) continue;
      const score = (rec?.winner ? 100 : 0) + (rec?.finalist ? 20 : 0) + (rec?.placement ? Math.max(0, 20 - Number(rec.placement)) : 0);
      const where = `${format && SHOWS[format]?.name ? SHOWS[format].name : 'Season'} ${num}`;
      const had = seen.get(name);
      if (!had || score > had.score) seen.set(name, { name, score, where, won: !!rec?.winner });
    }
  }
  return [...seen.values()].sort((a, b) => b.score - a.score || a.name.localeCompare(b.name)).slice(0, count);
}

/**
 * The Wedgie, clique against clique. Returns { act, hoh } or null.
 * `teams` are the sorted cliques (the returnee is in none of them yet), `returnee` is
 * mysteryHouseguestOf's pick or null.
 */
export function runCliqueReturnees({ week = undefined, teams = [], returnee = null, house = [], rng = Math.random } = {}) {
  const live = teams.filter(t => (t.members || []).length);
  if (live.length < 2) return null;
  const players = live.flatMap(t => t.members);
  // hanging by your underwear from a rope, holding a toilet seat: endurance, grip and nerve
  const hold = Object.fromEntries(players.map(n => [n, Math.round((st(n, 'endurance') * 0.45 + st(n, 'physical') * 0.25 + st(n, 'temperament') * 0.3 + rng() * 4) * 10) / 10]));
  const order = players.slice().sort((a, b) => hold[b] - hold[a]);
  const last = order[0];
  const winning = live.find(t => t.members.includes(last));
  // the clique's runner-up is the other one still hanging at the end (BB11: Natalie AND Russell)
  const partner = order.find(n => n !== last && winning.members.includes(n)) || null;
  const others = live.filter(t => t !== winning);
  const alumni = supportingAlumni(house, others.length);
  const supporters = others.map((t, i) => ({ clique: t.name, name: alumni[i]?.name || null, where: alumni[i]?.where || null }));
  const act = {
    type: 'clique-returnees', week: week?.num || 1,
    order, hold, last, partner, winningClique: winning.name,
    returnee: returnee ? { name: returnee.n, won: !!returnee.won, where: returnee.where, clique: winning.name } : null,
    supporters,
    beats: [{ text: `${last}${partner ? ` and ${partner}` : ''} win The Wedgie for ${winning.name}.`, players: [last, partner].filter(Boolean), badgeText: 'THE WEDGIE', badgeClass: 'gold', part: 'won' }],
  };
  gs.popularity ||= {};
  gs.popularity[last] = (gs.popularity[last] || 0) + 0.6;
  if (returnee) {
    // the returnee joins the clique that won them their way in
    const t = (gs.bb?.teams || []).find(x => x.name === winning.name);
    if (t && !t.members.includes(returnee.n)) t.members.push(returnee.n);
    act.beats.push({ text: `${returnee.n} walks in as a houseguest, a member of ${winning.name}, and the first Head of Household.`, players: [returnee.n], badgeText: 'THE RETURNEE', badgeClass: 'gold', part: 'returnee' });
  }
  return { act, hoh: returnee ? returnee.n : last };
}

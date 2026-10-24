// ══════════════════════════════════════════════════════════════════════
// bb/temptation-premiere.js — premiere night of the Summer of Temptation
// ══════════════════════════════════════════════════════════════════════
//
// BB19, as the wiki tells it (user, 2026-10-24: the themes "have to be
// perfect 1:1 of the real show"):
//
//   "Immediately, the houseguests were tempted with $25,000, but Julie warned
//    them that every temptation comes with a consequence. After [seven of
//    them] pushed their buttons, Kevin was anonymously revealed to be the
//    fastest and thus accepted the cash temptation. In doing so, he released
//    the first curse onto the house, the entrance of Paul Abrahamian." Kevin
//   "was instructed to throw the first Head of Household competition."
//
//   The BB Swap: "Paul was granted the opportunity to save eight houseguests.
//    The remaining eight competed for safety, leaving three houseguests
//    nominated. The nominees then voted on whether their fate would be decided
//    by house votes or a competition; by a 2–1 vote, they chose a house vote.
//    By a vote of 8–3–2, Cameron was evicted, opening a spot for Paul."
//
// Ours plays exactly that, with the returnee cast from the franchise: the
// cast's most decorated veteran (bb/premiere-mystery.js mysteryHouseguestOf)
// is held out of the move-in and released by the button. A cast with no
// veteran still has the button and the thrown HOH, and no swap — an invented
// returnee would be the one thing this cannot do.
import { gs, players, seasonConfig } from '../core.js';
import { pStats } from '../players.js';
import { addBond, getBond } from '../bonds.js';
import { stableRng } from './knowledge.js';
import { mysteryHouseguestOf } from './premiere-mystery.js';

const NICE = new Set(['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat']);
const st = (n, k) => { try { return Number(pStats(n)?.[k]) || 5; } catch { return 5; } };
const archOf = n => (players || []).find(p => p.name === n)?.archetype || null;
const bond = (a, b) => { try { return getBond(a, b) || 0; } catch { return 0; } };
const pop = (n, d) => {
  if (seasonConfig?.popularityEnabled === false) return;
  gs.popularity ||= {};
  gs.popularity[n] = Math.round(((gs.popularity[n] || 0) + d) * 100) / 100;
};

export function runTemptationPremiere(week, house) {
  const everyone = (house || []).filter(Boolean);
  if (everyone.length < 8) return null;
  const r = stableRng('temptation-premiere', gs?.bb?.seasonSalt || 0, week.num);
  const guestPick = everyone.length >= 10 ? mysteryHouseguestOf(everyone) : null;
  const guest = guestPick?.n || null;
  const cast = everyone.filter(n => n !== guest);

  // ── the button ──
  // Who presses: the bold and the hungry, held back by caution and by
  // loyalty to people they met an hour ago. Money, not a scheme, so nice
  // archetypes may press too, just less often. The fastest presser takes it.
  const pressers = cast.filter(n => r() < Math.min(0.85, 0.12 + st(n, 'boldness') * 0.05 + (10 - st(n, 'loyalty')) * 0.02 - (NICE.has(archOf(n)) ? 0.08 : 0)));
  if (!pressers.length) pressers.push(cast.slice().sort((a, b) => st(b, 'boldness') - st(a, 'boldness'))[0]);
  const speed = n => st(n, 'physical') * 0.4 + st(n, 'intuition') * 0.4 + r() * 4;
  const taker = pressers.slice().sort((a, b) => speed(b) - speed(a))[0];
  pop(taker, -0.5);

  const act = {
    type: 'temptation-premiere', week: week.num,
    pressers: [...pressers], taker, money: 25000,
    returnee: guest ? { name: guest, won: !!guestPick.won, where: guestPick.where } : null,
    mustThrow: taker,
    beats: [],
  };

  if (!guest) return { act, evicted: null, returnee: null, mustThrow: taker };

  // ── the BB Swap ──
  // The returnee saves eight: the people who made the best first impression
  // on them, and the people best at being liked in an hour.
  const want = n => bond(guest, n) * 0.6 + st(n, 'social') * 0.35 + r() * 1.5;
  const saveCount = Math.min(8, Math.max(1, cast.length - 5));
  const saved = cast.slice().sort((a, b) => want(b) - want(a)).slice(0, saveCount);
  for (const n of saved) { try { addBond(n, guest, 0.8); } catch { /* */ } }
  // The rest compete for safety; the bottom three are nominated.
  const rest = cast.filter(n => !saved.includes(n));
  const score = n => st(n, 'physical') * 0.3 + st(n, 'endurance') * 0.25 + st(n, 'mental') * 0.25 + r() * 4;
  const scores = Object.fromEntries(rest.map(n => [n, Math.round(score(n) * 10) / 10]));
  const order = rest.slice().sort((a, b) => scores[b] - scores[a]);
  const nominees = order.slice(-3);
  for (const n of rest.filter(x => !saved.includes(x))) { try { addBond(n, guest, -0.6); } catch { /* left out */ } }

  // The nominees choose how they go: a house vote, or a competition. Each
  // wants the one they fancy their odds in.
  const wantsComp = n => (st(n, 'physical') + st(n, 'endurance')) / 2 > st(n, 'social') + (r() - 0.5) * 2;
  const choice = nominees.map(n => ({ name: n, pick: wantsComp(n) ? 'competition' : 'vote' }));
  const compVotes = choice.filter(c => c.pick === 'competition').length;
  const method = compVotes * 2 > nominees.length ? 'competition' : 'vote';

  let evicted, ballots = null, tally = null, final = null;
  if (method === 'vote') {
    // Everybody who is not on the block votes; the returnee has not joined yet.
    const voters = cast.filter(n => !nominees.includes(n));
    ballots = voters.map(v => {
      const w = nominees.map(t => ({ t, s: -bond(v, t) * 0.7 + (st(t, 'strategic') + st(t, 'physical')) * 0.08 + r() * 1.6 }));
      return { voter: v, evict: w.sort((a, b) => b.s - a.s)[0].t };
    });
    tally = Object.fromEntries(nominees.map(t => [t, ballots.filter(b => b.evict === t).length]));
    evicted = nominees.slice().sort((a, b) => tally[b] - tally[a] || scores[a] - scores[b])[0];
    for (const b of ballots) { try { addBond(b.evict, b.voter, -0.4); } catch { /* */ } }
  } else {
    final = Object.fromEntries(nominees.map(n => [n, Math.round(score(n) * 10) / 10]));
    evicted = nominees.slice().sort((a, b) => final[a] - final[b])[0];
  }
  pop(evicted, 1);

  Object.assign(act, { saved, safety: { scores, order }, nominees, choice, method, ballots, tally, final, evicted });
  return { act, evicted, returnee: guest, mustThrow: taker };
}

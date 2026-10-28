// ══════════════════════════════════════════════════════════════════════
// ss/production.js — the production secrets, playing
// ══════════════════════════════════════════════════════════════════════
//
// Twist family 3 (docs/superpowers/specs/2026-10-28-secret-story-production-secrets-design.md). The user,
// 2026-10-28: "we should have gameplay for more types of production secret, a ton, so we don't have much
// repetition, because these often come with secret gameplay". A production secret is a role: every week its
// holders get the role's job from the Voice, do it or fail it, are paid or not, and leave traces the hunters
// can follow. Pure: returns one event per live role a week; the adapter applies `effects` and `evidence`.

import { mint, burn, balance } from './kitty.js';
import { addEvidence, secretOf, showClue, nearMisses } from './hunt.js';

const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
export const MAX_A_WEEK = 3;

/** Which role a secret plays, from its catalogue id (js/ss/casting.js) or, for an old save, its words. */
export function roleOf(secret) {
  if (!secret) return null;
  // a production secret the user wrote plays like the role they chose on the cast screen
  if (secret.plays) return PLAYED.includes(secret.plays) ? secret.plays : null;
  const id = String(secret.poolId || secret.id || '');
  const m = /^prod-([a-z-]+)$/.exec(id);
  if (m) return m[1];
  const t = String(secret.text || '');
  if (/fake couple/i.test(t)) return 'fake-couple';
  if (/fake (siblings|brother)/i.test(t)) return 'fake-siblings';
  if (/double agent|accomplice/i.test(t)) return 'accomplice';
  return null;
}

/** The roles this engine plays (the Secret Box and the intruders are hidden groups; see hidden-groups.js). */
export const PLAYED = ['accomplice', 'fake-couple', 'public-couple', 'fake-siblings', 'public-family', 'enemies', 'chosen', 'tunnels', 'house-key', 'access-code', 'protector', 'saboteur', 'spy', 'oracle', 'guardians'];
/** The weekly jobs, for the cast screen's "Plays like" (`min`: how many holders the job needs). */
export const ROLE_JOBS = [
  { id: 'accomplice', label: "The Voice's accomplice: carries out the Voice's orders", min: 1 },
  { id: 'fake-couple', label: 'A fake couple: keeps a romance going for the house', min: 2 },
  { id: 'public-couple', label: "The public's couple: a romance the country chose", min: 2 },
  { id: 'fake-siblings', label: 'Fake siblings: act like family', min: 2 },
  { id: 'public-family', label: "The public's family: a family the country chose", min: 2 },
  { id: 'enemies', label: 'The worst of enemies: fight in public, allies in private', min: 2 },
  { id: 'chosen', label: "The chosen ones: the Voice's tips, and one immunity", min: 1 },
  { id: 'tunnels', label: 'The masters of the tunnels: listen through the walls', min: 1 },
  { id: 'house-key', label: 'The key: carries part of the secret of the house', min: 1 },
  { id: 'access-code', label: 'The access code: carries part of the secret of the house', min: 1 },
  { id: 'protector', label: "The couple's protector: keeps a real couple's secret safe", min: 1 },
  { id: 'saboteur', label: 'The saboteur: sends the hunters the wrong way', min: 1 },
  { id: 'spy', label: "The internet's spy: films private moments for the public", min: 1 },
  { id: 'oracle', label: 'The oracle: a hidden phone, and a lock to find', min: 1 },
  { id: 'guardians', label: 'The guardians of transparency: name a liar every week', min: 1 },
];

/**
 * The week's jobs. Returns [{ role, holders, ok, money, ...detail, effects: { bond, pub }, evidence }].
 * @param {any} state @param {any} ctx huntCtx @param {{ house?: string[] }} o
 */
export function productionWeek(state, ctx, { house = [] } = {}) {
  const rng = ctx.rng || Math.random;
  const wk = ctx.week ?? 0;
  if (wk < 1) return [];
  const S = (n, k) => Number(ctx.stat(n, k)) || 5;
  const B = (a, b) => Number(ctx.bond(a, b)) || 0;
  const out = [];
  const live = (state.secrets || []).filter(s => !s.found && PLAYED.includes(roleOf(s)) && (s.holders || []).some(h => house.includes(h)));
  // (a role works every other week at most, and no more than three a week: seven missions in one afternoon
  // was a wall of briefs on screen, read 2026-10-28. The longest-waiting go first.)
  const roles = live.filter(s => (s.lastJob == null || wk - s.lastJob >= 2) && (roleOf(s) !== 'protector' || coupleFor(state, s.holders[0], house)))
    .map(s => [s, (s.lastJob == null ? -99 : s.lastJob) + rng() * 1.5]).sort((x, y) => x[1] - y[1]).slice(0, MAX_A_WEEK).map(x => x[0]);
  for (const s of roles) {
    const role = roleOf(s);
    const holders = (s.holders || []).filter(h => house.includes(h));
    const [a, b] = holders;
    const others = house.filter(n => !holders.includes(n));
    // the sharpest outsider is the one who notices when it goes wrong
    const watcher = others.slice().sort((x, y) => (S(y, 'intuition') + rng() * 3) - (S(x, 'intuition') + rng() * 3))[0];
    const fx = { bond: [], pub: [] };
    const evidence = [];
    const trace = (strength = 0.18) => { if (watcher) evidence.push([watcher, a, strength]); };
    const pay = (n, amt, why) => mint(state, n, amt, why, wk);
    const skill = (n, ...ks) => ks.reduce((t, k) => t + S(n, k), 0) / ks.length;
    let ev = null;
    if (role === 'accomplice') {
      const ORDERS = [
        { id: 'false-lead', text: 'plant a false lead about somebody else\'s secret, and make the house believe it' },
        { id: 'wrong-buzz', text: 'convince a housemate to press the buzzer on the wrong person' },
        { id: 'steer', text: 'get the house talking about one name before the nominations' },
      ];
      const o = ORDERS[(s.orders = (s.orders || 0) + 1) % ORDERS.length];
      const target = others.sort((x, y) => B(a, x) - B(a, y))[0] || null;
      const ok = rng() < clamp(0.3 + skill(a, 'strategic', 'social') * 0.06, 0.15, 0.9);
      // the mark: the housemate the accomplice works on (the sharpest hunter, or for a nomination, the house)
      const mark = watcher && watcher !== target ? watcher : others.find(n => n !== target) || null;
      if (ok) {
        pay(a, 1000, `the Voice's order: ${o.id}`); fx.pub.push([a, 'game', 0.12, "carried out the Voice's orders"]);
        if (o.id === 'steer' && target) fx.bond.push([target, a, -0.3]);
        // a false lead that lands: the mark's theory about the target swings to a wrong secret (a wrong buzz waiting)
        const ts = target && secretOf(state, target);
        if (o.id !== 'steer' && ts && !ts.found && mark) { const wrong = nearMisses(ts)[0]; if (wrong) addEvidence(state, ctx, mark, target, { strength: 0.45, how: 'accomplice', toward: wrong }); }
      } else trace(0.22);
      ev = { role, holders, ok, order: o.id, orderText: o.text, target, mark, money: ok ? 1000 : 0, watcher: ok ? null : watcher };
    } else if (['fake-couple', 'public-couple', 'fake-siblings', 'public-family', 'enemies'].includes(role) && holders.length >= 2) {
      const ACT = { 'fake-couple': ['a kiss in the kitchen, in front of everybody', 'a date night by the pool', 'a fight and a big make-up'], 'public-couple': ['a kiss in the kitchen, in front of everybody', 'a date night by the pool', 'a fight and a big make-up'],
        'fake-siblings': ['a childhood story told together at dinner', 'defending each other in a row', 'an old family joke'], 'public-family': ['a family dinner, with the old family stories', 'a family argument about nothing', 'protecting the youngest'],
        enemies: ['a loud row in the living room', 'refusing to sit at the same table', 'a cold shoulder the whole house sees'] }[role];
      const act = ACT[(wk + hashS(a)) % ACT.length];
      const ok = rng() < clamp(0.35 + (skill(a, 'social', 'temperament') + skill(b, 'social', 'temperament')) * 0.04, 0.15, 0.92);
      if (ok) { pay(a, 1000, `kept the act going: ${role}`); pay(b, 1000, `kept the act going: ${role}`); fx.pub.push([a, 'arc', 0.12, 'kept the act going'], [b, 'arc', 0.12, 'kept the act going']); }
      else trace(0.25);
      if (role === 'enemies') fx.bond.push([a, b, 0.3]);
      ev = { role, holders, ok, act, money: ok ? 1000 : 0, watcher: ok ? null : watcher };
    } else if (role === 'chosen') {
      // a prediction from the Voice (who the house is about to nominate), and one immunity in the season
      // (never the same name two times running)
      const tip = others.filter(n => n !== s.lastTip).sort((x, y) => (S(x, 'social') - S(y, 'social')) + (rng() - 0.5) * 3)[0] || null;
      s.lastTip = tip;
      let immune = null;
      if (!s.immunityUsed && rng() < 0.35) { s.immunityUsed = wk; immune = a; (state.nextImmune ||= {}); (state.nextImmune[wk] ||= []).includes(a) || state.nextImmune[wk].push(a); }
      const ok = true;
      if (rng() < 0.3) trace(0.15);
      ev = { role, holders, ok, tip, immune, money: 0 };
    } else if (role === 'tunnels') {
      const heard = others.filter(n => secretOf(state, n) && !secretOf(state, n).found).sort(() => rng() - 0.5).slice(0, 2);
      for (const h of holders) for (const t of heard) addEvidence(state, ctx, h, t, { strength: 0.28, how: 'tunnels' });
      let life = null;
      if (!s.lifeUsed && wk >= 2 && rng() < 0.3 && !(state.forLife && !state.forLife.over)) {
        s.lifeUsed = wk;
        life = others.slice().sort((x, y) => B(a, x) - B(a, y))[0] || null;
        if (life) state.forLife = { who: life, by: a, from: wk, until: wk + 2, over: null };
      }
      const noise = rng() < 0.25;
      if (noise) trace(0.2);
      ev = { role, holders, ok: true, heard, life, noise, money: 0 };
    } else if (role === 'house-key' || role === 'access-code') {
      // a piece of the house's secret: a clue on it every week; if the house is close, they can sell it
      const hs = state.houseSecret;
      const clue = hs && !hs.solvedBy ? ((hs.clues || [])[(wk + 1) % Math.max(1, (hs.clues || []).length)] || null) : null;
      const sell = !!hs && !hs.solvedBy && rng() < clamp(S(a, 'strategic') * 0.04 - S(a, 'loyalty') * 0.02, 0, 0.25);
      if (sell) pay(a, 3000, 'sold a piece of the house\'s secret');
      if (rng() < 0.3) trace(0.15);
      ev = { role, holders, ok: true, clue, sell, money: sell ? 3000 : 0 };
    } else if (role === 'protector') {
      // the couple they shield: a REAL pair's secret (never another production role's act), still hidden
      const couple = coupleFor(state, a, house);
      if (!couple) continue;
      const ok = rng() < clamp(0.35 + skill(a, 'social', 'strategic') * 0.05, 0.15, 0.9);
      for (const n of others.filter(n => !(couple.holders || []).includes(n)).slice(0, 2)) if (ok && state.theories?.[n]?.[couple.holders[0]]) state.theories[n][couple.holders[0]].conf = Math.max(0, (Number(state.theories[n][couple.holders[0]].conf) || 0) - 0.15);
      if (ok) { pay(a, 1000, "kept the couple's secret safe"); for (const h of couple.holders) fx.bond.push([h, a, 0.8]); } else trace(0.2);
      ev = { role, holders, ok, couple: couple.holders.slice(), money: ok ? 1000 : 0, watcher: ok ? null : watcher };
    } else if (role === 'saboteur') {
      const victim = others.filter(n => secretOf(state, n) && !secretOf(state, n).found).sort(() => rng() - 0.5)[0];
      const fake = victim ? showClue(state, ctx, { holder: victim, how: 'sabotage', house, fake: true }) : null;
      const ok = !!fake;
      if (ok) pay(a, 1000, 'planted a false lead');
      if (rng() < 0.25) trace(0.22);
      ev = { role, holders, ok, victim, clue: fake?.clue || null, money: ok ? 1000 : 0 };
    } else if (role === 'spy') {
      // a private moment, filmed and handed to the country
      const subject = others.slice().sort(() => rng() - 0.5)[0];
      const caught = rng() < clamp(0.25 - S(a, 'strategic') * 0.015, 0.05, 0.3);
      if (subject) fx.pub.push([subject, 'seen', 0.25, 'was filmed in private by the spy'], [a, 'game', 0.1, "played the internet's spy"]);
      if (caught && subject) { fx.bond.push([subject, a, -1.5]); trace(0.3); }
      ev = { role, holders, ok: !caught, subject, caught, money: 0 };
    } else if (role === 'oracle') {
      // the hidden phone: one overheard conversation (a theory jumps); the lock, found one week
      const heard = others.filter(n => secretOf(state, n) && !secretOf(state, n).found).sort(() => rng() - 0.5)[0];
      if (heard) addEvidence(state, ctx, a, heard, { strength: 0.35, how: 'oracle' });
      const lock = !s.lockFound && rng() < 0.3;
      if (lock) { s.lockFound = wk; pay(a, 2000, "found the oracle's lock"); }
      ev = { role, holders, ok: true, heard, lock, money: lock ? 2000 : 0 };
    } else if (role === 'guardians') {
      // name a liar: the one whose theories about them are most wrong, or whose bond is worst
      const liar = others.slice().sort((x, y) => B(a, x) - B(a, y))[0];
      const right = !!liar && (S(liar, 'loyalty') < 5 || rng() < clamp(S(a, 'intuition') * 0.06, 0.1, 0.7));
      if (right) { const amt = Math.min(1500, balance(state, liar)); if (amt > 0) { burn(state, liar, amt, 'named a liar by the guardians', wk); pay(a, amt, 'named a liar'); } }
      else if (balance(state, a) >= 500) burn(state, a, 500, 'named the wrong liar', wk);
      if (liar) fx.bond.push([liar, a, right ? -1.5 : -2]);
      ev = { role, holders, ok: right, liar, money: right ? 1500 : -500 };
    }
    if (!ev) continue;
    s.lastJob = wk;
    // (a secret the user wrote keeps its own words on screen)
    out.push({ ...ev, text: s.text, custom: !!s.plays, effects: fx, evidence });
  }
  return out;
}
// the couple a protector shields: a REAL pair's secret (never another production role's act), still hidden
const coupleFor = (state, a, house) => (state.secrets || []).find(x => !x.found && x.source !== 'production' && (x.holders || []).length === 2
  && !(x.holders || []).includes(a) && (x.holders || []).every(h => house.includes(h))) || null;
const hashS = s => [...String(s)].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

// ══════════════════════════════════════════════════════════════════════
// pm/events.js — the hundred things that happen in a villa day
// ══════════════════════════════════════════════════════════════════════
//
// Every event has a CONSEQUENCE (bond, attraction, a secret, belief) — there
// are no cosmetic events. Whether an event AIRED is decided here, by how much
// television it is; only aired events write the public ledger (spec §8).
// The reader sees every event; unaired ones carry `aired: false`.
//
// The words live in pm/lines/* and are picked by pm/script.js AFTER the
// event has happened, on their own dice: prose renders, it never decides.
import { addBond, getBond } from '../bonds.js';
import { addRelationshipDimension } from '../relationships.js';
import { attr, nudgeAttraction, ickHit, compatible } from './chemistry.js';
import { recordAired, nudgeBelief, BETRAYAL } from './ledger.js';
import { romance, shown, revealTruth, friendship, believed } from './feelings.js';
import { closedness, betrayalWeight } from './ladder.js';
import { feel, jealousyHit, attachment, emo } from './emotions.js';
import { onYourSide, BLOOD } from './kin.js';
import { streamFor } from '../dr/rng.js';
import { girlCode, judgement } from './circle.js';
import { scriptFor, hutFor, moodOf, narratorFor } from './script.js';

export const PHASE_BUDGETS = { morning: 12, day: 40, event: 18, evening: 23 };
export const HUT_RATE = 0.25;
// Scenes whose beach hut is the point of them: always cut away.
const ALWAYS_HUT = new Set(['casa-miss']);

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const pick = (rng, arr) => (arr.length ? arr[Math.floor(rng() * arr.length)] : null);
function weighted(rng, entries) {
  const live = entries.filter(([, w]) => w > 0);
  let r = rng() * live.reduce((s, [, w]) => s + w, 0);
  for (const [v, w] of live) { r -= w; if (r <= 0) return v; }
  return live.length ? live[live.length - 1][0] : null;
}
const S = (state, n) => state.profiles[n].stats;

export function partnerOf(state, name) {
  const c = state.couples.find(x => x.includes(name));
  return c ? (c[0] === name ? c[1] : c[0]) : null;
}
const inCasa = (state, n) => state.split && state.casa.includes(n);
export function roomMates(state, name) {
  const here = inCasa(state, name);
  return state.villa.filter(n => n !== name && inCasa(state, n) === here);
}
const couplesInRoom = state => state.couples.filter(([a, b]) => inCasa(state, a) === inCasa(state, b));

// ── why two islanders argue ───────────────────────────────────────────
// Every reason is something that happened, weighted in proportion to how
// much of it there is. A partner's flirting only counts when it was done in
// front of the villa (a secret kiss is a secret); a steal, a vote or a
// telling fades with the episodes since.
const FLIRTS = new Set(['pull', 'kiss', 'head-turned', 'date', 'hideaway']);
function argumentReasons(s, a) {
  const out = [];
  const here = roomMates(s, a);
  const p = partnerOf(s, a);
  const since = e => 1 / (1 + Math.max(0, s.ep - (e.ep ?? s.ep)));
  if (p && here.includes(p)) {
    // Jealous: the partner flirting with somebody else today, openly.
    const seen = today(s).find(e => FLIRTS.has(e.kind) && !e.extra?.secret && e.players.includes(p)
      && !e.players.includes(a) && e.players.some(n => n !== p && here.includes(n)));
    if (seen) out.push({ cause: 'jealous', b: p, about: seen.players.find(n => n !== p), w: 3 });
    // A couple of a day has no "you always" in it yet (season 57's night one:
    // "You always save me a seat"): the rows of a couple wait for episode two.
    if (s.ep >= 2) {
      // One of them further in than the other.
      const gap = romance(a, p) - romance(p, a);
      if (gap > 1) out.push({ cause: 'mismatch', b: p, w: 0.6 * (gap - 1) });
      // Snapping from stress, at whoever is nearest: the partner.
      out.push({ cause: 'stress', b: p, w: 0.3 * emo(s, a).stress });
      // The small stuff, in the moment.
      out.push({ cause: 'bicker', b: p, w: 0.6 });
    }
  }
  // Envy: coupled with the one a fancies.
  const crush = here.filter(n => n !== p && (attr(s, a, n) ?? 0) >= 6).sort((x, y) => (attr(s, a, y) ?? 0) - (attr(s, a, x) ?? 0))[0];
  const holder = crush && partnerOf(s, crush);
  if (holder && holder !== a && here.includes(holder)) out.push({ cause: 'envy', b: holder, about: crush, w: 2 });
  // A rival: somebody after a's partner.
  if (p) {
    const eyeing = here.find(n => n !== p && (attr(s, n, p) ?? 0) >= 6 && (attr(s, n, p) ?? 0) > (attr(s, p, a) ?? 0) - 1);
    if (eyeing) out.push({ cause: 'rival', b: eyeing, about: p, w: 1.2 });
  }
  const past = s.history || [];
  // Stole my partner: a recoupling pick or a bombshell's steal.
  for (const e of past) {
    const took = e.kind === 'recouple-pick' && e.extra?.stole === a ? { b: e.players[0], x: e.players[1] }
      : e.kind === 'steal' && e.players[2] === a ? { b: e.players[0], x: e.players[1] } : null;
    if (took && here.includes(took.b)) out.push({ cause: 'stole', b: took.b, about: took.x, w: 2.5 * since(e) });
  }
  // Voted against me at the fire pit, and I'm still here.
  for (const e of past) {
    if (e.kind === 'ballot-reveal' && e.players[1] === a && here.includes(e.players[0])) out.push({ cause: 'voted', b: e.players[0], w: 1.5 * since(e) });
  }
  // Told on me: the gossip that took my secret to my partner, today.
  for (const e of today(s)) {
    if (e.kind === 'gossip' && e.players[2] === a && here.includes(e.players[0])) out.push({ cause: 'told', b: e.players[0], about: e.players[1], w: 3 });
  }
  // Two who just don't get on, over something in front of them.
  const cold = here.filter(n => n !== p).sort((x, y) => getBond(a, x) - getBond(a, y))[0];
  if (cold) out.push({ cause: 'clash', b: cold, w: (0.8 + Math.max(0, -getBond(a, cold)) / 3) * (s.ep === 1 ? 0.3 : 1) });
  return out;
}

// ── the day remembers itself ─────────────────────────────────────────
// A couple who rowed this morning does not have a cosy chat on the daybed at
// lunch (read in a played episode: a tender chat, "I can't do anything
// right", then "this feels different", all in one afternoon). After a row,
// warm scenes between the two are off for that part of the day and the next;
// after that, the scene they get is a making-up one (the `rowedToday` fact).
const PHASE_ORDER = ['morning', 'day', 'event', 'evening'];
export function today(state) {
  return (state._today || []).filter(e => e.ep === state.ep);
}
export function rowedToday(state, a, b) {
  return today(state).filter(e => e.kind === 'argument' && e.players.includes(a) && e.players.includes(b));
}
function cooling(state, a, b) {
  // The named challenge (pm/challenges.js) is the afternoon's event.
  const at = p => PHASE_ORDER.indexOf(p === 'challenge' ? 'event' : p);
  const now = at(state.phase);
  return rowedToday(state, a, b).some(e => now - at(e.phase) <= 1);
}
const warmCouples = state => couplesInRoom(state).filter(([a, b]) => !cooling(state, a, b));
const compatibleMates = (state, a) => roomMates(state, a).filter(b => attr(state, a, b) != null);
const openSecret = (state, n) => state.secrets.some(s => !s.known && (s.who === n || s.partner === n));

// ── the kinds ─────────────────────────────────────────────────────────
// cast(state, rng) → { players, kind? } | null. apply(state, ev, rng) → { pop, major }.
const pop1 = (who, approval, fame) => ({ [who]: { approval, fame } });
// Either of them walked in this episode: night one, or a bombshell's first
// day. Talking to everybody is what that day is FOR, so a pull weighs a
// quarter — with the public and as a secret (season 7: Theo, pulled twice on
// night one, was told on three times and ended the night at -28).
const DAY_ONE = 0.25;
const GOSSIP_PER_EPISODE = 3;
const metToday = (s, ...ns) => ns.some(n => n != null && (s.ledger?.firstEp?.[n] ?? s.ep) === s.ep);

// The roles a kind's scene talks ABOUT rather than includes (their index in
// ev.players): never the one who goes to the beach hut about it.
const HUT_ABSENT = { 'casa-miss': [1], debrief: [2], gossip: [2], advice: [2], 'triangle-case': [2], 'triangle-torn': [], 'lie-write': [2],
  'tower-q': [2], 'bombshell-react': [], 'movie-react': [], confession: [2] };

export const KINDS = {
  chat: {
    salience: 0.25,
    cast: (s, rng) => pick(rng, warmCouples(s)),
    apply: (s, ev) => {
      const [a, b] = ev.players;
      addBond(a, b, 0.2 + 0.03 * ((S(s, a).loyalty + S(s, b).loyalty) / 2));
      return { pop: { ...pop1(a, 0.3, 1), ...pop1(b, 0.3, 1) } };
    },
  },
  'deep-chat': {
    salience: 0.45,
    cast: (s, rng) => pick(rng, warmCouples(s).filter(([a, b]) =>
      ['love', 'settle-down', 'first-love'].includes(s.profiles[a].intent) || getBond(a, b) > 2)),
    apply: (s, ev) => {
      const [a, b] = ev.players;
      addBond(a, b, 0.5);
      return { pop: { ...pop1(a, 0.6, 1.2), ...pop1(b, 0.6, 1.2) } };
    },
  },
  kiss: {
    salience: 0.55,
    cast: (s, rng) => pick(rng, warmCouples(s)),
    apply: (s, ev) => {
      const [a, b] = ev.players;
      addBond(a, b, 0.3); nudgeAttraction(s, a, b, 0.2); nudgeAttraction(s, b, a, 0.2);
      if (ev.aired) nudgeBelief(s.ledger, a, b, 2);
      return { pop: { ...pop1(a, 0.4, 1), ...pop1(b, 0.4, 1) } };
    },
  },
  pull: {
    salience: 0.6,
    cast: (s, rng) => {
      // Somebody who has closed off does not go looking (spec §6.7).
      const a = weighted(rng, s.villa.filter(n => compatibleMates(s, n).length)
        .map(n => [n, S(s, n).boldness * (1 - 0.8 * closedness(s, n, partnerOf(s, n)))]));
      if (!a) return null;
      const b = weighted(rng, compatibleMates(s, a).filter(n => n !== partnerOf(s, a))
        .map(n => [n, attr(s, a, n)]));
      if (!b) return null;
      // A coupled islander can turn the pull down: that is a loyalty moment.
      const pb = partnerOf(s, b);
      if (pb && rng() < (S(s, b).loyalty / 10) * ((getBond(b, pb) + 10) / 20)) {
        return { players: [b, a], kind: 'loyalty' };
      }
      return { players: [a, b] };
    },
    apply: (s, ev, rng) => {
      const [a, b] = ev.players;
      const light = metToday(s, a, b) ? DAY_ONE : 1;
      // Turned down: the engine decides, from how much b fancies a — the
      // scene then says so. Before, half the pull lines had b say no while
      // the engine recorded a flirtation, and gossip later called it one.
      const rebuffed = rng() < Math.max(0, Math.min(0.7, 0.7 - 0.175 * (attr(s, b, a) ?? 0)));
      ev.extra.rebuffed = rebuffed;
      // HOW HOT IT RUNS (user: "how flirty are the chats — steamy, one-sided,
      // light? it should depend"): from how much each of them fancies the
      // other, no dice. One-sided: a is far keener, b humours it. Light:
      // neither is much into it. Steamy: both are. Flirty is everything else.
      const aa = attr(s, a, b) ?? 0, bb = attr(s, b, a) ?? 0;
      // Bands from the villa's own attractions (measured over ten seasons of
      // pulls: mutual attraction median 3.2, 90th percentile 4.9), so light
      // is about the bottom quarter, steamy the top tenth, flirty the middle.
      const heat = rebuffed ? 'cold' : aa - bb >= 2.5 && bb < 3 ? 'one-sided' : (aa + bb) / 2 >= 5 ? 'steamy' : (aa + bb) / 2 < 2.4 ? 'light' : 'flirty';
      ev.extra.heat = heat;
      const H = { cold: 0, 'one-sided': 0.3, light: 0.5, flirty: 1, steamy: 1.5 }[heat];
      if (rebuffed) nudgeAttraction(s, a, b, -0.1);
      else { nudgeAttraction(s, b, a, H * 0.3 * S(s, a).social / 10); nudgeAttraction(s, a, b, heat === 'one-sided' ? 0.2 : H * 0.1); }
      addBond(a, b, rebuffed ? -0.1 : 0.3);
      // A pull that goes further (user: "pull shouldn't be the only thing
      // creating secrets — a kiss…"): both have to fancy it, and the one who
      // pulled is held back by their own loyalty and how closed-off they are.
      const pa = partnerOf(s, a);
      const kissed = !rebuffed && rng() < light * 0.35 * { 'one-sided': 0.2, light: 0.3, flirty: 1, steamy: 1.6 }[heat] * ((attr(s, a, b) ?? 0) / 10) * ((attr(s, b, a) ?? 0) / 10)
        * (1 - 0.6 * S(s, a).loyalty / 10) * (1 - 0.4 * (pa ? closedness(s, a, pa) : 0));
      ev.extra.kissed = kissed;
      if (kissed) { nudgeAttraction(s, a, b, 0.4); nudgeAttraction(s, b, a, 0.4); }
      // A kiss weighs more than a chat (1.3 — see the measurement in git history).
      // …or no kiss, but a promise: plans for the outside with somebody else
      // (the show's "chats about life outside the villa" — emotional cheating).
      const promised = !kissed && !rebuffed && !!pa && rng() < light * 0.25 * ((attr(s, a, b) ?? 0) / 10) * ((attr(s, b, a) ?? 0) / 10)
        * (1 - 0.6 * S(s, a).loyalty / 10);
      ev.extra.promised = promised;
      const weight = kissed ? 1.3 : promised ? 1.15 : 1;
      // How much it is a secret follows how hot it ran: a light chat is
      // barely one, a steamy one is; one-sided, it is mostly a's, and a pull
      // b turned down is half a secret for a (it was a full one).
      const heatSev = kissed || promised ? 1 : { cold: 0.5, 'one-sided': 0.6, light: 0.4, flirty: 1, steamy: 1.4 }[heat];
      const bShare = heat === 'one-sided' && !kissed ? 0.3 : 0.7;
      const seenBy = heat === 'steamy' ? 0.4 : heat === 'light' ? 0.15 : 0.25;
      // Only a pull b went along with is b's secret; a made the move either way.
      for (const [x, y, sev0] of rebuffed ? [[a, b, 1]] : [[a, b, 1], [b, a, bShare]]) {
        const sev = sev0 * weight * heatSev;
        const p = partnerOf(s, x);
        if (!p || p === y) continue;
        const witnesses = roomMates(s, x).filter(n => n !== y && n !== p)
          .filter(() => rng() < seenBy);
        const secret = { id: `sec${s.secrets.length + 1}`, who: x, partner: p, with: y, kind: kissed ? 'kiss' : promised && x === a ? 'promise' : 'pull',
          severity: sev * light, ep: s.ep, witnesses, known: false, eventId: ev.id, casa: s.split };
        s.secrets.push(secret);
        if (ev.aired) nudgeBelief(s.ledger, x, p, -3);
        // Stepping out while you have closed off weighs on you.
        feel(s, x, 'guilt', 2 * sev * closedness(s, x, p));
        // The partner may simply see it happen.
        if (roomMates(s, x).includes(p) && rng() < 0.35) {
          secret.known = true;
          jealousyHit(s, p, x, y, 3 * sev, { confirmed: true });
          addRelationshipDimension(p, x, 'resentment', sev * betrayalWeight(s, p, x));
        }
        // Grafting on somebody else's couple costs you with their friends.
        const py = partnerOf(s, y);
        if (py && py !== x) girlCode(s, x, [y, py]);
      }
      return { pop: { ...pop1(a, partnerOf(s, a) ? -0.8 * light : 0.2, 1.5),
        ...pop1(b, rebuffed ? (partnerOf(s, b) ? 0.3 : 0) : partnerOf(s, b) ? -0.4 * light : 0.1, 1) } };
    },
  },
  // Casa Amor week: sharing a bed with a new arrival — the show's classic
  // (and sometimes more). Only while the villas are split; loyalty holds it back.
  'bed-share': {
    salience: 0.75,
    cast: (s, rng) => {
      if (!s.split) return null;
      const fresh = new Set(s.casaArrivals || []);
      const opts = [];
      for (const o of s.villa.filter(n => !fresh.has(n) && partnerOf(s, n))) {
        for (const c of roomMates(s, o).filter(n => fresh.has(n) && !partnerOf(s, n))) {
          const w = (attr(s, o, c) ?? 0) * (1 - 0.7 * S(s, o).loyalty / 10) * (1 - 0.25 * (s.casaMissed?.[o] || 0));
          if (w > 0) opts.push([[o, c], w]);
        }
      }
      return weighted(rng, opts);
    },
    apply: (s, ev, rng) => {
      const [o, c] = ev.players;
      const p = partnerOf(s, o);
      // How far it goes: the one who is coupled's pull, and whether the new one wants it too.
      const kissed = rng() < 0.55 * ((attr(s, o, c) ?? 0) / 10) * (0.4 + (attr(s, c, o) ?? 0) / 16);
      ev.extra.kissed = kissed;
      ev.extra.of = kissed ? 'kiss' : 'bed';
      nudgeAttraction(s, o, c, kissed ? 0.6 : 0.3); nudgeAttraction(s, c, o, 0.3);
      addBond(o, c, 0.4);
      if (p) {
        const sev = kissed ? 1.7 : 0.9;
        const witnesses = roomMates(s, o).filter(n => n !== c && n !== p).filter(() => rng() < 0.4);
        s.secrets.push({ id: `sec${s.secrets.length + 1}`, who: o, partner: p, with: c, kind: kissed ? 'kiss' : 'bed',
          severity: sev, ep: s.ep, witnesses, known: false, eventId: ev.id, casa: true });
        feel(s, o, 'guilt', 1.5 * sev * closedness(s, o, p));
      }
      return { pop: { ...pop1(o, p ? (kissed ? -1.4 : -0.7) : 0.2, 2), ...pop1(c, 0, 1.5) } };
    },
  },
  // Missing the one in the other villa (user: "do they miss each other in
  // Casa? depending on whether they actually like them, aren't actively
  // cheating, and don't have someone else occupying their thoughts"). Told to
  // a friend in the same villa; the partner is only `about`, never on stage.
  'casa-miss': {
    salience: 0.6,
    cast: (s, rng) => {
      if (!s.split) return null;
      const fresh = new Set(s.casaArrivals || []);
      const opts = [];
      for (const o of s.villa.filter(n => !fresh.has(n))) {
        const p = partnerOf(s, o);
        if (!p || roomMates(s, o).includes(p) || (s.casaMissed?.[o] || 0) >= 2) continue;
        // Already cheated this Casa: not pining. The cheating touches only the
        // one who did it until the other finds out (user): the partner at home
        // goes on missing them, right up to the photo.
        if (s.secrets.some(x => x.who === o && x.casa && x.with && x.ep >= (s.splitEp ?? 0))) continue;
        if (s.secrets.some(x => x.who === p && x.partner === o && x.casa && x.with && x.known && x.ep >= (s.splitEp ?? 0))) continue;
        const feels = romance(o, p) / 10;
        // Whoever else is on their mind, set against the partner.
        const toP = attr(s, o, p) ?? 0;
        const other = Math.max(0, ...roomMates(s, o).filter(n => n !== o).map(n => attr(s, o, n) ?? 0));
        const occupied = toP > 0 ? Math.min(1, other / toP) : 1;
        const w = feels * feels * (1 - 0.85 * occupied);
        if (w <= 0.02) continue;
        const g = s.profiles[o]?.gender;
        const friend = roomMates(s, o).filter(n => n !== o && !fresh.has(n) && s.profiles[n]?.gender === g)
          .sort((x, y) => getBond(o, y) - getBond(o, x))[0]
          || roomMates(s, o).filter(n => n !== o && !fresh.has(n)).sort((x, y) => getBond(o, y) - getBond(o, x))[0];
        if (friend) opts.push([[o, friend, p], w]);
      }
      const got = weighted(rng, opts);
      if (!got) return null;
      const [o, friend, p] = got;
      // Anxious, or unsure of them: the missing turns into wondering.
      const worry = attachment(s.profiles[o]).anxiety * 0.6 + (1 - emo(s, o).security / 10) * 0.6 + (rng() - 0.5) * 0.4 > 0.55;
      // …and the ones who feel it most, and hold it in least, cry (user:
      // "crying in the confessional because she missed her partner").
      const feels = romance(o, p) / 10, T = S(s, o).temperament / 10;
      const tears = rng() < feels * (0.3 + emo(s, o).loneliness / 10) * (1.2 - T) * 1.8 * (1 + 0.5 * (s.casaMissed?.[o] || 0));
      return { players: [o, friend], extra: { of: tears ? 'tears' : worry ? 'worries' : 'aches', about: p } };
    },
    apply: (s, ev) => {
      const [o, friend] = ev.players, p = ev.extra.about;
      (s.casaMissed ||= {})[o] = (s.casaMissed[o] || 0) + 1;
      feel(s, o, 'loneliness', 0.8);
      if (ev.extra.of === 'worries') feel(s, o, 'security', -0.6);
      if (ev.extra.of === 'tears') { feel(s, o, 'stress', 0.5); addBond(o, friend, 0.3); }
      // Absence, and the heart growing fonder: and Casa's pull a little weaker.
      nudgeAttraction(s, o, p, 0.3);
      addBond(o, friend, 0.3);
      return { pop: { ...pop1(o, ev.extra.of === 'tears' ? 1.2 : 0.8, ev.extra.of === 'tears' ? 1.5 : 1) } };
    },
  },
  // Moaning about your partner to a friend (user: "bad-mouthing your
  // partner"): said out loud, in front of a witness, so it can travel.
  vent: {
    salience: 0.55,
    cast: (s, rng) => {
      // Only about a partner of a while: day one has no "same chat every day".
      if (s.ep < 2) return null;
      const a = weighted(rng, s.villa.filter(n => partnerOf(s, n) && !metToday(s, n, partnerOf(s, n)))
        .map(n => [n, Math.max(0, 10 - romance(n, partnerOf(s, n))) + S(s, n).boldness / 3]));
      if (!a) return null;
      const g = s.profiles[a]?.gender;
      const b = roomMates(s, a).filter(n => n !== partnerOf(s, a) && s.profiles[n]?.gender === g)
        .sort((x, y) => getBond(a, y) - getBond(a, x))[0];
      return b ? { players: [a, b] } : null;
    },
    apply: (s, ev) => {
      const [a, b] = ev.players;
      const p = partnerOf(s, a);
      addBond(a, b, 0.3);
      if (p) s.secrets.push({ id: `sec${s.secrets.length + 1}`, who: a, partner: p, with: null, kind: 'said', said: true,
        severity: 0.5, ep: s.ep, witnesses: [b], known: false, eventId: ev.id, casa: !!s.split });
      return { pop: { ...pop1(a, -0.3, 1), ...pop1(b, 0, 0.5) } };
    },
  },
  loyalty: {
    salience: 0.6,
    cast: () => null,   // only ever reached through a rebuffed pull
    apply: (s, ev) => {
      const [a, b] = ev.players;
      const p = partnerOf(s, a);
      if (p) { addBond(a, p, 0.5); if (ev.aired) nudgeBelief(s.ledger, a, p, 4); }
      return { pop: { ...pop1(a, 1.2, 1), ...pop1(b, -0.2, 0.8) } };
    },
  },
  argument: {
    salience: 0.85,
    // WHY they argue is decided here, from what really happened, and the
    // lines are written per reason (user: "these arguments seem dumb and make
    // no sense"). With no reason recorded, every row had to invent one — "you
    // laughed when I fell over", "what you said last night" — that never
    // happened. `about` is the third person a row is about, named in the
    // lines but not in the scene.
    cast: (s, rng) => {
      const a = weighted(rng, s.villa.map(n => [n, (10 - S(s, n).temperament) + S(s, n).boldness / 2]));
      if (!a) return null;
      const why = argumentReasons(s, a);
      const got = weighted(rng, why.map(r => [r, r.w]));
      if (!got) return null;
      return { players: [a, got.b], extra: { cause: got.cause, ...(got.about ? { about: got.about } : {}) } };
    },
    apply: (s, ev) => {
      const [a, b] = ev.players;
      addBond(a, b, -0.6 - 0.04 * (10 - S(s, a).temperament));
      if (ev.aired && partnerOf(s, a) === b) nudgeBelief(s.ledger, a, b, -2);
      return { pop: { ...pop1(a, -1.0, 2), ...pop1(b, 0.3, 1.5) } };
    },
  },
  // ── the islanders who knew each other before (pm/kin.js) ────────────
  // Only cast when the season has relations; each is what the relation IS.
  // A sibling or best friend: a moment that is only theirs.
  'kin-heart': {
    salience: 0.5,
    cast: (s, rng) => {
      const pairs = kinPairs(s).filter(([a, b, k]) => onYourSide(k));
      const got = pick(rng, pairs);
      return got ? { players: [got[0], got[1]], extra: { of: kinGroup(got[2]) } } : null;
    },
    apply: (s, ev) => {
      const [a, b] = ev.players;
      addBond(a, b, 0.4);
      feel(s, a, 'stress', -0.4); feel(s, b, 'stress', -0.4);
      return { pop: { ...pop1(a, 0.3, 0.8), ...pop1(b, 0.3, 0.8) } };
    },
  },
  // Sizing up a sibling's (or best friend's) partner.
  'kin-vet': {
    salience: 0.7,
    cast: (s, rng) => {
      const opts = kinPairs(s).flatMap(([x, y, k]) => onYourSide(k) ? [[x, y], [y, x]] : [])
        .map(([k, sib]) => [k, sib, partnerOf(s, sib)]).filter(([k, sib, p]) => p && p !== k && roomMates(s, k).includes(p) && !onceFor(s, `vet:${k}>${p}`));
      const got = pick(rng, opts);
      if (!got) return null;
      const [k, sib, p] = got;
      // Approval is how the vetter already gets on with the partner, and how
      // much the partner plainly feels for their sibling.
      const approve = 0.3 * getBond(k, p) + 0.5 * romance(p, sib) + (rng() - 0.5) * 2 > 2.5;
      return { players: [k, p, sib], extra: { of: approve ? 'approve' : 'doubt' } };
    },
    apply: (s, ev) => {
      const [k, p, sib] = ev.players;
      markOnce(s, `vet:${k}>${p}`);
      if (ev.extra.of === 'approve') { addBond(k, p, 0.6); feel(s, sib, 'security', 0.5); }
      else { addBond(k, p, -0.8); addRelationshipDimension(sib, p, 'trust', -0.4); feel(s, sib, 'stress', 0.4); }
      return { pop: { ...pop1(k, 0.2, 1), ...pop1(p, ev.extra.of === 'approve' ? 0.3 : -0.2, 1) } };
    },
  },
  // Stepping in: the partner who was seen flirting today answers to the family.
  'kin-protect': {
    salience: 0.85,
    cast: (s, rng) => {
      const opts = kinPairs(s).flatMap(([x, y, k]) => onYourSide(k) ? [[x, y, k], [y, x, k]] : []).map(([k, sib, kin]) => {
        const p = partnerOf(s, sib);
        if (!p || p === k || !roomMates(s, k).includes(p)) return null;
        const seen = today(s).find(e => FLIRTS.has(e.kind) && !e.extra?.secret && e.players.includes(p) && !e.players.includes(sib)
          && e.players.some(n => n !== p && n !== k));
        const about = seen?.players.find(n => n !== p);
        return seen && !onceFor(s, `protect:${k}>${p}>${about}`) ? { players: [k, p, sib], extra: { of: kinGroup(kin), about } } : null;
      }).filter(Boolean);
      return pick(rng, opts);
    },
    apply: (s, ev) => {
      const [k, p, sib] = ev.players;
      markOnce(s, `protect:${k}>${p}>${ev.extra.about}`);
      addBond(k, p, -1.2 - 0.06 * (10 - S(s, k).temperament));
      jealousyHit(s, sib, p, ev.extra.about, 1);
      return { pop: { ...pop1(k, 0.4, 1.5), ...pop1(p, -0.5, 1) } };
    },
  },
  // Exes, in the same villa.
  'ex-awkward': {
    salience: 0.6,
    cast: (s, rng) => {
      const got = pick(rng, kinPairs(s).filter(([, , k]) => k === 'exes'));
      if (!got) return null;
      const [a, b] = got;
      // Exes back together are not "not quite over it" (season 101: coupled
      // since night one, and still getting the villa's side-eye scenes).
      if (partnerOf(s, a) === b) return { players: [a, b], extra: { of: 'together' } };
      const spark = (attr(s, a, b) ?? 0) + (attr(s, b, a) ?? 0) > 10;
      return { players: [a, b], extra: { of: spark ? 'spark' : 'cold' } };
    },
    apply: (s, ev) => {
      const [a, b] = ev.players;
      if (ev.extra.of === 'together') { addBond(a, b, 0.4); feel(s, a, 'security', 0.3); feel(s, b, 'security', 0.3); return { pop: { ...pop1(a, 0.3, 1), ...pop1(b, 0.3, 1) } }; }
      if (ev.extra.of === 'spark') { nudgeAttraction(s, a, b, 0.3); nudgeAttraction(s, b, a, 0.3); }
      else { addBond(a, b, -0.3); feel(s, a, 'stress', 0.3); }
      // Their partners notice.
      for (const [x, y] of [[a, b], [b, a]]) { const p = partnerOf(s, x); if (p && ev.extra.of === 'spark') jealousyHit(s, p, x, y, 1); }
      return { pop: { ...pop1(a, 0, 1.2), ...pop1(b, 0, 1.2) } };
    },
  },
  // Watching an ex with someone new.
  'ex-jealous': {
    salience: 0.75,
    cast: (s, rng) => {
      const opts = kinPairs(s).filter(([, , k]) => k === 'exes').flatMap(([x, y]) => [[x, y], [y, x]])
        .map(([a, ex]) => [a, ex, partnerOf(s, ex)]).filter(([a, ex, np]) => np && np !== a && (attr(s, a, ex) ?? 0) >= 4 && roomMates(s, a).includes(np) && !onceFor(s, `exj:${a}>${np}`));
      const got = pick(rng, opts);
      return got ? { players: got } : null;
    },
    apply: (s, ev) => {
      const [a, ex, np] = ev.players;
      markOnce(s, `exj:${a}>${np}`);
      jealousyHit(s, a, ex, np, 1.2);
      addBond(a, np, -0.5);
      return { pop: { ...pop1(a, -0.1, 1.2) } };
    },
  },
  friendship: {
    salience: 0.2,
    cast: (s, rng) => {
      const a = pick(rng, s.villa);
      // Villa friendships are mostly between people who don't fancy each
      // other (on a straight cast, the girls and the lads), and they grow:
      // somebody you already get on with is who you go and find. Read from
      // attraction, never from gender, so any cast works.
      const b = a && weighted(rng, roomMates(s, a).filter(n => n !== partnerOf(s, a))
        .map(n => [n, (attr(s, a, n) == null ? 3 : 1) * (1 + Math.max(0, getBond(a, n)) / 4)]));
      return b ? { players: [a, b] } : null;
    },
    apply: (s, ev) => {
      const [a, b] = ev.players;
      // A friendship deepens faster the closer the two already are: the
      // villa's bromances and best friends are made in a week, not a season.
      addBond(a, b, 0.4 + 0.06 * Math.max(0, getBond(a, b)));
      return { pop: { ...pop1(a, 0.2, 0.5), ...pop1(b, 0.2, 0.5) } };
    },
  },
  gossip: {
    salience: 0.8,
    cast: (s, rng) => {
      // A few tellings a night, not a dozen: season 7 ran 8-14 an episode,
      // each a confrontation, and the villa did nothing else. What is left
      // untold waits for tomorrow, or for the photos and Movie Night.
      if (s._gossipEp !== s.ep) { s._gossipEp = s.ep; s._gossipN = 0; }
      if (s._gossipN >= GOSSIP_PER_EPISODE) return null;
      const options = [];
      for (const sec of s.secrets.filter(x => !x.known)) {
        // Only news about a couple that still exists: season 11 told Amber
        // about Ryan three episodes after Ryan was dumped (with a hut from
        // Ryan, who was not there), and Priya about Jordan the same way.
        if (!s.villa.includes(sec.who) || partnerOf(s, sec.partner) !== sec.who) continue;
        for (const w of sec.witnesses) {
          if (!s.villa.includes(w) || !roomMates(s, w).includes(sec.partner)) continue;
          options.push([{ players: [w, sec.partner, sec.who], secret: sec.id },
            Math.max(0.1, getBond(w, sec.partner) - getBond(w, sec.who) + 1)]);
        }
      }
      return weighted(rng, options);
    },
    apply: (s, ev) => {
      const [w, p, x] = ev.players;
      s._gossipN = (s._gossipEp === s.ep ? s._gossipN || 0 : 0) + 1; s._gossipEp = s.ep;
      const sec = s.secrets.find(z => z.id === ev.extra.secret);
      // The news lands once: telling p about x tells p everything x has been
      // doing behind p's back so far, so the next islander has nothing new
      // to carry (season 7: Priya was told about Theo three times in a day,
      // each one a full major moment). The heaviest of it is what stings.
      const told = s.secrets.filter(z => !z.known && z.who === x && z.partner === p);
      for (const z of told) z.known = true;
      if (sec) sec.known = true;
      const sev = Math.max(sec?.severity || 0, ...told.map(z => z.severity)) || 1;
      addBond(x, p, -1.5 * sev); nudgeAttraction(s, p, x, -1.0 * sev); addBond(w, x, -0.5);
      // p now knows what x feels, and it lands by the rung p believed they were on.
      revealTruth(s, p, x);
      jealousyHit(s, p, x, sec?.with || x, 5 * sev, { confirmed: true });
      addRelationshipDimension(p, x, 'resentment', 1.2 * sev * betrayalWeight(s, p, x));
      // The messenger is judged by how much the exposed one liked them anyway.
      addRelationshipDimension(x, w, 'resentment', 0.8 * judgement(s, x, w));
      if (ev.aired && partnerOf(s, p) === x) nudgeBelief(s.ledger, x, p, -6);
      // Scaled by what x actually did: being pulled for a chat is not making
      // the move, and a day-one chat is barely anything. Only a full-weight
      // secret is a major moment — 9-11 a night, measured, when every telling was.
      return { pop: { ...pop1(w, 0.3, 1.5), ...pop1(p, 1.5 * Math.min(1, sev), 2), ...pop1(x, -BETRAYAL.exposed * Math.min(1, sev), 2) },
        major: sev >= 1 ? [p, x] : [] };
    },
  },
  comedy: {
    salience: 0.7,
    cast: (s, rng) => {
      const a = weighted(rng, s.villa.map(n => [n, Math.max(0, S(s, n).social + S(s, n).temperament - 9)]));
      // Whoever is nearest answers the joke: a conversation, not a one-liner
      // (every comedy scene aired as a single line, with nobody to talk to).
      const b = a && pick(rng, roomMates(s, a));
      return b ? { players: [a, b] } : null;
    },
    apply: (s, ev) => {
      const [a, b] = ev.players;
      addBond(a, b, 0.2);
      return { pop: { ...pop1(a, 1.0, 2), ...pop1(b, 0.1, 0.5) } };
    },
  },
  ick: {
    salience: 0.7,
    cast: (s, rng) => {
      const opts = couplesInRoom(s).flatMap(([a, b]) => [[[a, b], ickHit(s.profiles[a], s.profiles[b])],
        [[b, a], ickHit(s.profiles[b], s.profiles[a])]]);
      const pair = weighted(rng, opts.map(([p, w]) => [p, Math.max(0, w - 0.3)]));
      return pair ? { players: pair } : null;
    },
    apply: (s, ev) => {
      const [a, b] = ev.players;
      nudgeAttraction(s, a, b, -1.0); addBond(a, b, -0.3);
      return { pop: { ...pop1(a, 0.2, 1.5), ...pop1(b, 0, 0.5) } };
    },
  },
  'challenge-kiss': {
    salience: 0.8,
    cast: (s, rng) => {
      const a = pick(rng, s.villa.filter(n => compatibleMates(s, n).length));
      const b = a && weighted(rng, compatibleMates(s, a).filter(n => n !== partnerOf(s, a))
        .map(n => [n, attr(s, a, n)]));
      return b ? { players: [a, b] } : null;
    },
    apply: (s, ev) => {
      const [a, b] = ev.players;
      nudgeAttraction(s, b, a, 0.3);
      const p = partnerOf(s, a);
      if (p) addBond(a, p, -0.4 * (1 - S(s, p).temperament / 10));
      return { pop: { ...pop1(a, -0.2, 2), ...pop1(b, 0, 1.5) } };
    },
  },
  'challenge-win': {
    salience: 0.35,
    // One challenge, one winning couple: drawn once an episode and kept, so a
    // second "we won!" is never a different couple (season 7 night one crowned
    // two, one of them three times). A named challenge has its own win scene.
    cast: (s, rng) => {
      if (s._namedChallengeEp === s.ep) return null;
      if (s._chalWinEp !== s.ep) { s._chalWinEp = s.ep; s._chalWin = pick(rng, warmCouples(s)) || null; }
      const w = s._chalWin;
      return w && partnerOf(s, w[0]) === w[1] ? w : null;
    },
    apply: (s, ev) => {
      const [a, b] = ev.players;
      addBond(a, b, 0.2);
      return { pop: { ...pop1(a, 0.3, 1), ...pop1(b, 0.3, 1) } };
    },
  },
  // MOMENT KINDS: their effects are done by the caller (moments.js /
  // arrivals.js / casa.js / villa-day.js), which hands the ledger writes in
  // `extra.pop` and the major moments in `extra.majorPop`.
  ...Object.fromEntries(['entrance', 'date', 'steal', 'recouple-pick', 'dump-buildup',
    'dump-verdict', 'ballot-reveal', 'dump-reaction', 'dump-goodbye', 'dump-fallout',
    'casa-return', 'photos', 'declaration', 'final-result', 'envelope', 'walk', 'reveal',
    // the ladder, the feelings, the friendships and the villa's rituals
    'close-off', 'keeping-open', 'open-back-up', 'head-turned', 'exclusive-ask', 'official-ask',
    'ask-declined', 'love-said', 'love-hanging', 'hideaway', 'torch', 'jealous-confront',
    'jealous-sulk', 'jealous-retaliate', 'reassurance', 'overthinking', 'confession', 'advice',
    'heart-rate', 'snog-marry-pie', 'movie-night', 'double-standard', 'notes', 'families',
    'solidarity',
    // the dumping formats of Plan 4.5
    'dump-at-risk', 'dump-verdict-couple', 'dump-verdict-singles', 'group-entrance', 'final-recoupling', 'challenge-rules', 'date-text', 'date-picked', 'date-back',
    'final-date', 'journey-open', 'journey-clip', 'journey-react', 'journey-end', 'speech',
    'pair-text', 'kin-entrance', 'kin-goodbye', 'kin-walk', 'ex-text', 'ex-reveal', 'ex-partner', 'ex-confront',
    'dump-text', 'dump-nerves', 'dump-open', 'vote-safe', 'hideaway-text', 'hideaway-vote', 'hideaway-win', 'hideaway-snub', 'hideaway-morning',
    'recouple-text', 'recouple-nerves', 'recouple-open', 'recouple-single', 'casa-text', 'casa-goodbye', 'casa-explain',
    'final-open', 'reunion-open', 'reunion-winners', 'reunion-close', 'rule-open', 'game-kiss', 'tod-truth', 'dump-recap', 'dump-safe', 'dump-plea', 'dump-decide',
    // the arrivals of Plan 4.5 phase 2
    'stand-up', 'nobody-stands', 'stand-up-pick', 'save-setup', 'bombshell-save', 'public-match',
    'profile-pick', 'public-couple', 'ranking-couple', 'step-reveal', 'step-choose', 'step-back', 'icebreaker', 'kiss-pick', 'lady-luck-kiss', 'lady-luck-pick',
    // the one-offs of phase 3
    'return-entrance', 'return-ex', 'mission-brief', 'mission-dump', 'mission-return', 'sleepover-invite',
    'sleepover-choice', 'sleepover-night', 'immunity-win',
    // the named challenges of phase 4
    'challenge-text', 'receipt', 'look-who',
    // night one's opening
    'first-arrival', 'first-look', 'step-forward', 'step-last', 'host-open', 'host-first', 'intro', 'snogger-kiss', 'snogger-win', 'snogger-row', 'couple-goals', 'couple-goals-row',
    'knowing-me', 'knowing-row', 'talent-act', 'talent-win', 'talent-snub', 'baby-doll', 'sorts-podium', 'grafties-award', 'save-vote', 'save-tie', 'lie-write', 'lie-question', 'lie-row', 'blow-slip', 'blow-dare', 'lip-race', 'lip-watch', 'tower-q', 'course-run', 'course-pick', 'course-win', 'blind-run', 'sports-captains', 'sports-win', 'sports-sore', 'headline', 'triangle-torn', 'triangle-rivals', 'triangle-case', 'triangle-ultimatum', 'triangle-teams', 'triangle-choice', 'breakdown', 'comfort', 'no-show', 'blowup', 'pile-in', 'villa-divided', 'cold-shoulder', 'clear-the-air', 'apology', 'reunite', 'apology-rejected', 'casa-host', 'casa-react', 'casa-row', 'photo-text', 'photo-row', 'photo-split', 'movie-text', 'movie-seat', 'movie-clip', 'movie-react', 'movie-row', 'movie-split', 'arrival-chat', 'first-toast', 'debrief', 'bombshell-text', 'bombshell-guess', 'bombshell-react', 'top-couple-pick', 'couples-vote', 'ex-return', 'ex-ballot',
    // two after the same one, and the crush that isn't returned (pm/rivalry.js)
    'rival-shade', 'rival-play', 'code-call', 'rival-row', 'rival-step-back', 'rival-won', 'crush-confide', 'crush-watch', 'crush-move', 'crush-plea', 'crush-over',
    'camp-rally', 'camp-confront', 'camp-clash', 'camp-lobby', 'camp-split', 'camp-switch', 'camp-after',
    'feud-confront', 'feud-interrupt', 'feud-shade', 'feud-ick', 'feud-closure']
    .map(k => [k, { salience: 1, cast: () => null,
      apply: (s, ev) => ({ pop: ev.extra.pop || {}, major: ev.extra.majorPop || [] }) }])),
};

// ── how a conversation ends ───────────────────────────────────────────
// User: "a lot of discussions don't really finish". Each talking kind ends one
// way or another, and the ending does something: an argument that is made up
// gives back some of what it cost; one that ends in a walk-off costs more;
// gossip that is taken quietly leaves them lonely, angrily leaves them
// stressed, gratefully brings them closer to the one who told them.
const T = (s, n) => S(s, n).temperament ?? 5;
const ENDINGS = {
  chat: (s, ev) => {
    const [a, b] = ev.players;
    const r = (romance(a, b) + romance(b, a)) / 2;       // words only: the chat's own bond already moved
    // The day they met, nobody knows yet whether it is clicking.
    if (metToday(s, a, b)) return r >= 4 ? 'warm' : 'easy';
    return r >= 5 ? 'warm' : r >= 2.5 ? 'easy' : 'flat';
  },
  'deep-chat': (s, ev, rng) => {
    const [a, b] = ev.players;
    // In proportion to how much b keeps people out.
    if (rng() < 0.8 * attachment(s.profiles[b]).avoidance) { feel(s, a, 'security', -0.3); return 'guarded'; }
    addRelationshipDimension(a, b, 'trust', 0.3); addRelationshipDimension(b, a, 'trust', 0.3);
    return 'open';
  },
  // After the ick: the bold say it out loud, and it stings; the rest keep it
  // to themselves (lines/day/ick-close.js).
  ick: (s, ev, rng) => {
    const [a, b] = ev.players;
    const bold = (S(s, a).boldness ?? 5) / 10, kind = (S(s, a).temperament ?? 5) / 10;
    if (rng() < 0.15 + 0.5 * bold - 0.2 * kind) {
      addBond(b, a, -0.3); feel(s, b, 'security', -0.4);
      return 'said';
    }
    return 'kept';
  },
  // What a couple say after the kiss (lines/day/kiss-close.js): read off how
  // much they like each other, and whether it was their first. Draws nothing.
  kiss: (s, ev) => {
    const [a, b] = ev.players;
    const r = (romance(a, b) + romance(b, a)) / 2;
    if (r < 2.5) return 'off';
    if (ev.extra.firstKiss) return 'first';
    return r >= 5 ? 'warm' : 'easy';
  },
  friendship: (s, ev) => { addRelationshipDimension(ev.players[0], ev.players[1], 'trust', 0.2); return true; },
  pull: (s, ev) => ev.extra.rebuffed ? 'turned-down' : ev.extra.kissed ? 'kissed' : ev.extra.promised ? 'promised' : 'flirt',
  loyalty: () => true,
  argument: (s, ev, rng) => {
    const [a, b] = ev.players;
    const calm = (T(s, a) + T(s, b)) / 20, hot = (10 - Math.min(T(s, a), T(s, b))) / 10;
    const r = rng(), pm = 0.1 + 0.55 * calm, pw = 0.1 + 0.4 * hot;
    if (r < pm) { addBond(a, b, 0.4); return 'make-up'; }
    if (r < pm + pw) { addBond(a, b, -0.2); feel(s, a, 'stress', 0.4); feel(s, b, 'stress', 0.4); return 'walk-off'; }
    addRelationshipDimension(a, b, 'resentment', 0.3); addRelationshipDimension(b, a, 'resentment', 0.3);
    return 'simmer';
  },
  gossip: (s, ev, rng) => {
    const [w, p, x] = ev.players;
    const hot = (10 - T(s, p)) / 10 * 0.5 + (S(s, p).boldness ?? 5) / 10 * 0.3;
    const inward = attachment(s.profiles[p]).avoidance * 0.5 + (1 - (S(s, p).boldness ?? 5) / 10) * 0.3;
    const r = rng() * (hot + inward + 0.5);
    if (r < hot) { feel(s, p, 'stress', 0.6); addRelationshipDimension(p, x, 'resentment', 0.4); return 'angry'; }
    if (r < hot + inward) { feel(s, p, 'loneliness', 0.5); return 'quiet'; }
    addBond(p, w, 0.4);
    return 'thanks';
  },
};

// The relations' scenes, by the part of the day (pm/kin.js).
const KIN_PHASE_KINDS = {
  morning: [['kin-heart', 0.5]],
  day: [['kin-heart', 0.5], ['kin-vet', 0.8], ['kin-protect', 1], ['ex-awkward', 0.6], ['ex-jealous', 0.6]],
  evening: [['kin-heart', 0.4], ['kin-protect', 0.8], ['ex-jealous', 0.6]],
};
// Episodes a kind rests after it airs: 0 is every episode at most once.
const KIN_GAP = { 'kin-heart': 1, 'kin-vet': 0, 'kin-protect': 1, 'ex-awkward': 1, 'ex-jealous': 0 };
const KIN_KINDS = new Set(Object.keys(KIN_GAP));
// The most of a kind one episode's villa day holds, aired or not.
const EP_CAP = { argument: 3, ick: 3 };
// What only happens once between the same people: sizing up a partner, the
// ex's new partner, a flirt answered for.
const onceFor = (s, tag) => (s.kinOnce ||= []).includes(tag);
const markOnce = (s, tag) => { (s.kinOnce ||= []).push(tag); };
/** The pairs with a relation, both in the villa and in the same room. */
function kinPairs(s) {
  return Object.entries(s.kin || {}).map(([k, kin]) => [...k.split('|'), kin])
    .filter(([a, b]) => s.villa.includes(a) && s.villa.includes(b) && roomMates(s, a).includes(b));
}
const kinGroup = kin => (BLOOD.has(kin) ? 'family' : 'friends');

export const PHASE_KINDS = {
  // The small slots (a morning pull, an evening chat or joke) are there for
  // the lines written for them: a gate on a phase its kind never plays at is
  // a line nobody hears (tests/pm-lines.test.js found six).
  morning: [['chat', 4], ['kiss', 2], ['friendship', 3], ['comedy', 1], ['ick', 0.5], ['argument', 0.3], ['pull', 0.5]],
  day: [['chat', 3], ['deep-chat', 2], ['pull', 3], ['friendship', 3], ['gossip', 1.5],
    ['comedy', 1.5], ['argument', 0.6], ['ick', 0.8], ['vent', 0.15]],
  event: [['challenge-kiss', 3], ['challenge-win', 1], ['comedy', 1], ['argument', 0.3]],
  evening: [['kiss', 3], ['deep-chat', 2], ['pull', 2], ['argument', 0.9], ['gossip', 1.5], ['friendship', 1], ['chat', 0.5], ['comedy', 0.5],
    ['bed-share', 1.2], ['vent', 0.05]],
};

/** [romance, friendship, shown, believed] for every pair within `players`, as the episode snapshot keeps them. */
function feelingsAmong(state, players) {
  const out = {};
  const ps = [...new Set(players.filter(Boolean))].slice(0, 5);
  for (const a of ps) for (const b of ps) {
    if (a === b || !state.profiles[a] || !state.profiles[b]) continue;
    const f = friendship(a, b);
    if (!compatible(state, a, b) && Math.abs(f) < 1) continue;
    const r2 = v => Math.round(v * 100) / 100;
    out[`${a}→${b}`] = [r2(romance(a, b)), r2(f), r2(shown(state, a, b)), r2(believed(state, b, a))];
  }
  return out;
}
function changedFeelings(state, now) {
  if (state._relMark?.ep !== state.ep) state._relMark = { ep: state.ep, seen: {} };
  const seen = state._relMark.seen;
  let out = null;
  for (const [k, v] of Object.entries(now)) {
    const w = seen[k];
    if (!w || v.some((x, i) => Math.abs(x - w[i]) >= 0.01)) { (out ||= {})[k] = v; seen[k] = v; }
  }
  return out;
}

const NO_HUT = new Set(['final-date', 'journey-open', 'journey-clip', 'journey-react', 'journey-end', 'speech']);

/** Create one event: decide airing, apply it, attach a hut cutaway, write the ledger. */
export function makeEvent(state, rng, { phase, kind, players, extra = {}, aired = null, major = [] }) {
  const def = KINDS[kind];
  state.seq = (state.seq || 0) + 1;
  const heat = players.some(n => openSecret(state, n)) ? 0.1 : 0;
  const airP = clamp(0.2 + 0.6 * def.salience + heat, 0.1, 0.95);
  // A couple's first kiss is recorded as such, for the screens to mark (its
  // music, vp-pm/sound.js). Read from what happened; draws nothing.
  if (kind === 'kiss' && players.length >= 2) {
    const pair = e => e.kind === 'kiss' && e.players.includes(players[0]) && e.players.includes(players[1]);
    if (!(state.history || []).some(pair) && !today(state).some(pair)) extra = { ...extra, firstKiss: true };
  }
  const ev = { id: `${state.ep}-${state.seq}`, ep: state.ep, phase, kind, players: [...players],
    aired: aired == null ? rng() < airP : !!aired, major: [...major],
    hut: null, pop: {}, extra,
    // How everyone in it felt going in, so a later line can say "thanks for
    // yesterday" only when yesterday really happened (pm/script.js history).
    moods: Object.fromEntries(players.map(n => [n, moodOf(state, n)])) };
  // Kept for the rest of the day, so later scenes know what already happened.
  state._today = [...today(state), ev];
  const res = def.apply(state, ev, rng) || {};
  // Where the people in it stand with each other now: the relationships
  // panel moves scene by scene as the episode is watched (user: "I see people
  // kiss but in relationship is still nobody yet"). Against the last value
  // the screens were given for that pair this episode, not the moment before
  // the scene — a first look nudges attraction just before its scene is
  // made, a ceremony just after — so nothing a pair went through is lost.
  // Recorded, not decided: it draws nothing.
  const moved = changedFeelings(state, feelingsAmong(state, players));
  if (moved) ev.rel = moved;
  ev.pop = res.pop || {};
  // How the conversation ends, decided here with what it does — the words
  // follow (pm/script.js closed). Its own dice, so no other draw moves.
  const endOf = ENDINGS[kind];
  if (endOf) ev.extra.close = endOf(state, ev, streamFor(state.seed || 1, `close:${ev.id}`));
  ev.script = scriptFor(state, ev);
  for (const n of res.major || []) if (!ev.major.includes(n)) ev.major.push(n);
  // No beach hut in the middle of a couple watching their own film.
  if (players.length && !NO_HUT.has(kind) && (ALWAYS_HUT.has(kind) || rng() < HUT_RATE)) {
    // Only somebody who was THERE goes to the hut about it: the one a debrief
    // or a telling is about is not in the room (user, reading night one: "say
    // what out loud, when Mickey wasn't even the one talking").
    const absent = HUT_ABSENT[kind] || [];
    const present = players.filter((_, i) => !absent.includes(i));
    const who = pick(rng, present.length ? present : players);
    // A faker's hut gives them away too: the hut is the Feels layer (spec §6.5).
    const faking = players.some(o => o !== who && shown(state, who, o) - romance(who, o) >= 3);
    // Two-faced is what the speaker is hiding NOW: a mask, or a secret from
    // this episode or the last. Every hidden kiss from week one made every
    // hut two-faced by week five (80-97% of cutaways, measured).
    // Missing a partner is only two-faced over a real betrayal (a kiss, a bed),
    // not a moan about them to a friend or a chat somebody pulled them for.
    const fresh = state.secrets.some(x => !x.known && x.who === who && x.ep >= state.ep - 1 && (kind !== 'casa-miss' || (x.with && x.kind !== 'pull')));
    const stance = faking || fresh ? 'two-faced' : 'honest';
    const script = hutFor(state, ev, who, stance);
    // Nothing left to say this episode that hasn't been said: no cutaway.
    if (script) {
      ev.hut = { who, stance, script };
      const p = (ev.pop[who] ||= { approval: 0, fame: 0 });
      // Rarer and always about something real since the stance fix, so it
      // costs more: -0.5 left villains at 56% of seasons by ep 12.
      if (stance === 'two-faced') { p.approval -= 1.0; p.fame += 0.5; } else p.fame += 0.3;
    }
  }
  // The voiceover, over what the public just watched. No ledger effect.
  ev.narrator = narratorFor(state, ev);
  if (ev.aired) writeLedger(state, ev, false);
  return ev;
}

function writeLedger(state, ev, late) {
  for (const [who, p] of Object.entries(ev.pop)) {
    recordAired(state.ledger, { who, approval: p.approval || 0, fame: p.fame || 0,
      major: late || ev.major.includes(who) });
  }
}

/** A hidden event airs now (Movie Night, the photos, the reunion): a major moment. */
export function airLater(state, ev) {
  if (ev.aired) return;
  ev.aired = true;
  ev.airedLate = state.ep;
  // Airing late IS the major moment, so the event has to say so: the ledger
  // lifts its cap for everybody in it, and a row that did not record them
  // left a three-tier label jump with nothing on screen to explain it.
  for (const who of Object.keys(ev.pop)) if (!ev.major.includes(who)) ev.major.push(who);
  writeLedger(state, ev, true);
}

/** The villa's day: roughly PHASE_BUDGETS events, in phase order. */
// The same kind with the same people: once a part of the day, twice an
// episode. Season 7's night one had Chloe and Marcus kiss six times in one
// evening and Mia in eight comedy scenes — the cast was drawn fresh each time,
// with nothing to say who had just been on screen doing the same thing.
const PER_PHASE = 1, PER_EPISODE = 2;
export function generateEpisodeEvents(state, rng, budgets = PHASE_BUDGETS) {
  const out = [];
  if (state._castSeenEp !== state.ep) { state._castSeen = {}; state._castSeenEp = state.ep; }
  const seenEp = state._castSeen;
  for (const [phase, budget] of Object.entries(budgets)) {
    state.phase = phase;
    const seenPhase = {};
    // Casa nights are temptation nights: pulls weigh double while split.
    // The relations' own scenes join the day only in a season that has
    // relations: a cast without them plays exactly as it always did.
    const kinds = [...PHASE_KINDS[phase], ...(Object.keys(state.kin || {}).length ? KIN_PHASE_KINDS[phase] || [] : []),
      // …and the days after an ex walks in, when it is all anyone talks about.
      ...(Object.values(state.exArrived || {}).some(e => state.ep - e <= 2) ? [['ex-awkward', 2]] : []),
      // …and missing the other villa, only while it is the other villa.
      ...(state.split ? [['casa-miss', phase === 'evening' ? 2.4 : 1.4]] : [])]
      .map(([k, w]) => [k, k === 'pull' && state.split ? w * 2 : w]);
    let made = 0, tries = 0;
    // Eight tries a slot: the same-cast cap turns some draws away, and four
    // left the thinnest episode at 75 scenes (91 before the cap).
    while (made < budget && tries < budget * 8) {
      tries++;
      const kind = weighted(rng, kinds);
      const got = KINDS[kind].cast(state, rng);
      if (!got) continue;
      const players = Array.isArray(got) ? got : got.players;
      const realKind = Array.isArray(got) ? kind : (got.kind || kind);
      // Comedy is the joker's scene: whoever answers, it is the same islander on screen again.
      const key = realKind + '|' + (realKind === 'comedy' ? players[0] : [...players].sort().join('+'));
      if ((seenPhase[key] || 0) >= PER_PHASE || (seenEp[key] || 0) >= PER_EPISODE) continue;
      // A relation's scene, once an episode per kind (season 41 with four
      // relations drew 52 kin-protects and 50 kin-hearts from pools of five).
      // Once an episode per kind is still one sibling moment every night:
      // each kind then rests the episodes KIN_GAP gives it.
      // A villa day has a row or two in it, not ten (season 57: 7-13 an episode).
      if (EP_CAP[realKind] && (seenEp['#n' + realKind] || 0) >= EP_CAP[realKind]) continue;
      if (EP_CAP[realKind]) seenEp['#n' + realKind] = (seenEp['#n' + realKind] || 0) + 1;
      if (KIN_KINDS.has(realKind)) {
        const last = (state.kinLastEp ||= {})[realKind];
        const exFresh = realKind === 'ex-awkward' && players.some(n => state.ep - (state.exArrived?.[n] ?? -9) <= 2);
        if (last != null && state.ep - last <= (exFresh ? 0 : KIN_GAP[realKind])) continue;
        state.kinLastEp[realKind] = state.ep;
      }
      seenPhase[key] = (seenPhase[key] || 0) + 1;
      seenEp[key] = (seenEp[key] || 0) + 1;
      const extra = Array.isArray(got) ? {} : { secret: got.secret, ...(got.extra || {}) };
      out.push(makeEvent(state, rng, { phase, kind: realKind, players, extra }));
      made++;
    }
  }
  return out;
}

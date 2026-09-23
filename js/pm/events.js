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
import { attr, nudgeAttraction, ickHit } from './chemistry.js';
import { recordAired, nudgeBelief, BETRAYAL } from './ledger.js';
import { romance, shown, revealTruth } from './feelings.js';
import { closedness, betrayalWeight } from './ladder.js';
import { feel, jealousyHit } from './emotions.js';
import { girlCode, judgement } from './circle.js';
import { scriptFor, hutFor, moodOf, narratorFor } from './script.js';

export const PHASE_BUDGETS = { morning: 12, day: 40, event: 18, evening: 23 };
export const HUT_RATE = 0.25;

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
      if (rebuffed) nudgeAttraction(s, a, b, -0.1);
      else { nudgeAttraction(s, b, a, 0.3 * S(s, a).social / 10); nudgeAttraction(s, a, b, 0.1); }
      addBond(a, b, rebuffed ? -0.1 : 0.3);
      // A pull that goes further (user: "pull shouldn't be the only thing
      // creating secrets — a kiss…"): both have to fancy it, and the one who
      // pulled is held back by their own loyalty and how closed-off they are.
      const pa = partnerOf(s, a);
      const kissed = !rebuffed && rng() < light * 0.35 * ((attr(s, a, b) ?? 0) / 10) * ((attr(s, b, a) ?? 0) / 10)
        * (1 - 0.6 * S(s, a).loyalty / 10) * (1 - 0.4 * (pa ? closedness(s, a, pa) : 0));
      ev.extra.kissed = kissed;
      if (kissed) { nudgeAttraction(s, a, b, 0.4); nudgeAttraction(s, b, a, 0.4); }
      // A kiss weighs more than a chat — 1.3, not 1.6: at 1.6, with the
      // bad-mouthing, four-couple finals fell 97% → 93% (measured, each alone).
      const weight = kissed ? 1.3 : 1;
      // Only a pull b went along with is b's secret; a made the move either way.
      for (const [x, y, sev0] of rebuffed ? [[a, b, 1]] : [[a, b, 1], [b, a, 0.7]]) {
        const sev = sev0 * weight;
        const p = partnerOf(s, x);
        if (!p || p === y) continue;
        const witnesses = roomMates(s, x).filter(n => n !== y && n !== p)
          .filter(() => rng() < 0.25);
        const secret = { id: `sec${s.secrets.length + 1}`, who: x, partner: p, with: y, kind: kissed ? 'kiss' : 'pull',
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
          const w = (attr(s, o, c) ?? 0) * (1 - 0.7 * S(s, o).loyalty / 10);
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
    cast: (s, rng) => {
      const a = weighted(rng, s.villa.map(n => [n, (10 - S(s, n).temperament) + S(s, n).boldness / 2]));
      if (!a) return null;
      const p = partnerOf(s, a);
      const mates = roomMates(s, a);
      const b = p && mates.includes(p) && rng() < 0.7 ? p
        : mates.slice().sort((x, y) => getBond(a, x) - getBond(a, y))[0];
      return b ? { players: [a, b] } : null;
    },
    apply: (s, ev) => {
      const [a, b] = ev.players;
      addBond(a, b, -0.6 - 0.04 * (10 - S(s, a).temperament));
      if (ev.aired && partnerOf(s, a) === b) nudgeBelief(s.ledger, a, b, -2);
      return { pop: { ...pop1(a, -1.0, 2), ...pop1(b, 0.3, 1.5) } };
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
      addBond(a, b, 0.4);
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
      return a ? { players: [a] } : null;
    },
    apply: (s, ev, rng) => {
      const [a] = ev.players;
      const b = pick(rng, roomMates(s, a));
      if (b) addBond(a, b, 0.2);
      return { pop: pop1(a, 1.0, 2) };
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
    'dump-at-risk', 'dump-verdict-couple', 'dump-verdict-singles', 'group-entrance',
    // the arrivals of Plan 4.5 phase 2
    'stand-up', 'nobody-stands', 'stand-up-pick', 'save-setup', 'bombshell-save', 'public-match',
    'profile-pick', 'public-couple', 'ranking-couple',
    // the one-offs of phase 3
    'return-entrance', 'return-ex', 'mission-brief', 'mission-dump', 'mission-return', 'sleepover-invite',
    'sleepover-choice', 'sleepover-night', 'immunity-win',
    // the named challenges of phase 4
    'challenge-text', 'receipt', 'look-who',
    // night one's opening
    'first-arrival', 'first-look', 'step-forward', 'step-last', 'host-open', 'host-first', 'intro', 'snogger-kiss', 'snogger-win', 'snogger-row', 'couple-goals', 'couple-goals-row',
    'knowing-me', 'knowing-row', 'talent-act', 'talent-win', 'talent-snub', 'baby-doll', 'sorts-podium', 'grafties-award', 'save-vote', 'save-tie', 'blowup', 'pile-in', 'villa-divided', 'cold-shoulder', 'clear-the-air', 'apology', 'reunite', 'apology-rejected', 'casa-host', 'casa-react', 'casa-row', 'photo-text', 'photo-row', 'photo-split', 'movie-text', 'movie-seat', 'movie-clip', 'movie-react', 'movie-row', 'movie-split', 'arrival-chat', 'first-toast', 'debrief', 'bombshell-text', 'bombshell-guess', 'bombshell-react', 'top-couple-pick', 'couples-vote', 'ex-return', 'ex-ballot']
    .map(k => [k, { salience: 1, cast: () => null,
      apply: (s, ev) => ({ pop: ev.extra.pop || {}, major: ev.extra.majorPop || [] }) }])),
};

export const PHASE_KINDS = {
  // The small slots (a morning pull, an evening chat or joke) are there for
  // the lines written for them: a gate on a phase its kind never plays at is
  // a line nobody hears (tests/pm-lines.test.js found six).
  morning: [['chat', 4], ['kiss', 2], ['friendship', 3], ['comedy', 1], ['ick', 0.5], ['argument', 0.5], ['pull', 0.5]],
  day: [['chat', 3], ['deep-chat', 2], ['pull', 3], ['friendship', 3], ['gossip', 1.5],
    ['comedy', 1.5], ['argument', 1], ['ick', 0.8], ['vent', 0.15]],
  event: [['challenge-kiss', 3], ['challenge-win', 1], ['comedy', 1], ['argument', 0.5]],
  evening: [['kiss', 3], ['deep-chat', 2], ['pull', 2], ['argument', 1.5], ['gossip', 1.5], ['friendship', 1], ['chat', 0.5], ['comedy', 0.5],
    ['bed-share', 1.2], ['vent', 0.05]],
};

/** Create one event: decide airing, apply it, attach a hut cutaway, write the ledger. */
export function makeEvent(state, rng, { phase, kind, players, extra = {}, aired = null, major = [] }) {
  const def = KINDS[kind];
  state.seq = (state.seq || 0) + 1;
  const heat = players.some(n => openSecret(state, n)) ? 0.1 : 0;
  const airP = clamp(0.2 + 0.6 * def.salience + heat, 0.1, 0.95);
  const ev = { id: `${state.ep}-${state.seq}`, ep: state.ep, phase, kind, players: [...players],
    aired: aired == null ? rng() < airP : !!aired, major: [...major],
    hut: null, pop: {}, extra,
    // How everyone in it felt going in, so a later line can say "thanks for
    // yesterday" only when yesterday really happened (pm/script.js history).
    moods: Object.fromEntries(players.map(n => [n, moodOf(state, n)])) };
  // Kept for the rest of the day, so later scenes know what already happened.
  state._today = [...today(state), ev];
  const res = def.apply(state, ev, rng) || {};
  ev.pop = res.pop || {};
  ev.script = scriptFor(state, ev);
  for (const n of res.major || []) if (!ev.major.includes(n)) ev.major.push(n);
  if (players.length && rng() < HUT_RATE) {
    const who = pick(rng, players);
    // A faker's hut gives them away too: the hut is the Feels layer (spec §6.5).
    const faking = players.some(o => o !== who && shown(state, who, o) - romance(who, o) >= 3);
    // Two-faced is what the speaker is hiding NOW: a mask, or a secret from
    // this episode or the last. Every hidden kiss from week one made every
    // hut two-faced by week five (80-97% of cutaways, measured).
    const fresh = state.secrets.some(x => !x.known && x.who === who && x.ep >= state.ep - 1);
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
    const kinds = PHASE_KINDS[phase].map(([k, w]) => [k, k === 'pull' && state.split ? w * 2 : w]);
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
      const key = realKind + '|' + [...players].sort().join('+');
      if ((seenPhase[key] || 0) >= PER_PHASE || (seenEp[key] || 0) >= PER_EPISODE) continue;
      seenPhase[key] = (seenPhase[key] || 0) + 1;
      seenEp[key] = (seenEp[key] || 0) + 1;
      const extra = Array.isArray(got) ? {} : { secret: got.secret };
      out.push(makeEvent(state, rng, { phase, kind: realKind, players, extra }));
      made++;
    }
  }
  return out;
}

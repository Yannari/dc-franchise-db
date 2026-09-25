// ══════════════════════════════════════════════════════════════════════
// pm/arrivals.js — "Islanders, we have a bombshell"
// ══════════════════════════════════════════════════════════════════════
//
// ONE OF THE FILES ALLOWED TO READ THE PUBLIC LEDGER. A bombshell watched the
// aired episodes from home (spec §7), so their eyes-on list may use what
// aired — at arrival, and nowhere else. The islanders' families watched it
// too, which is the other read in here (`familyVerdict`). A steal from a
// couple the public loves costs the bombshell approval.
import { addBond } from '../bonds.js';
import { seedAttraction, attr, nudgeAttraction } from './chemistry.js';
import { noteArrival, readApproval, coupleScore, BETRAYAL } from './ledger.js';
import { makeEvent, partnerOf } from './events.js';
import { romance, friendship, schemeEligible } from './feelings.js';
import { closedness } from './ladder.js';
import { breakHeart, feel, jealousOf, jealousyHit } from './emotions.js';
import { addRelationshipDimension } from '../relationships.js';
import { streamFor } from '../dr/rng.js';
import { seedKinAttraction, kinFor, kinGroup, onYourSide } from './kin.js';

export function arriveIslander(state, name, { ep, seed, room = 'villa' }) {
  if (!state.villa.includes(name)) state.villa.push(name);
  if (room === 'casa' && !state.casa.includes(name)) state.casa.push(name);
  noteArrival(state.ledger, name, ep);
  seedAttraction(state, name, seed);
  // An ex, or a partner they came in with, is not a stranger (pm/kin.js).
  seedKinAttraction(state, name);
}

export function eyesOnFor(state, name) {
  const authored = (state.profiles[name].eyesOn || []).filter(n => n !== name && state.villa.includes(n));
  if (authored.length) return authored.slice(0, 3);
  return state.villa.filter(n => n !== name && attr(state, name, n) != null)
    .map(n => [n, attr(state, name, n) + readApproval(state.ledger, n) / 25])
    .sort((a, b) => b[1] - a[1]).slice(0, 3).map(([n]) => n);
}

export function arriveBombshell(state, name, { ep, seed, rng }) {
  // Who was already here, before the new face: they get the text, they guess,
  // and they watch the steps.
  const before = state.villa.filter(n => n !== name && !(state.split && state.casa.includes(n)));
  arriveIslander(state, name, { ep, seed });
  // An ex already in the villa (the Relationships tab): the night is theirs.
  const ex = kinFor(state, name).find(k => k.kin === 'exes' && before.includes(k.other))?.other || null;
  const eyesOn = ex ? exDates(state, rng, name, ex) : eyesOnFor(state, name);
  state.profiles[name].eyesOnResolved = eyesOn;
  // THE ENTRANCE, as the show plays it (user: "a bombshell arriving is a whole
  // scene with a narrator, suspense and animation like the real show"): the
  // text, the guessing, the new islander's own clip, the walk down the steps,
  // and the faces watching it.
  const events = bombshellBuildUp(state, rng, name, before, ex);
  events.push(makeEvent(state, rng, { phase: 'event', kind: 'entrance', players: [name],
    aired: true, major: [name], extra: { of: 'bombshell', pop: { [name]: { approval: 0.5, fame: 3 } } } }));
  const exNight = ex ? exReveal(state, rng, name, ex) : null;
  if (exNight) events.push(...exNight.now);
  events.push(...bombshellReactions(state, rng, name, before.filter(n => n !== ex)));
  events.push(...bombshellDates(state, rng, name, eyesOn.slice(0, 2), ex));
  // …and once everyone has gone to bed, the two of them.
  if (exNight) events.push(...exNight.later);
  return { eyesOn, events };
}

/**
 * THE DATES, as the show runs them (user: "there's no announcement of a
 * date, we just get pushed into it … no announcement of who the bombshell
 * chose and the reactions of the others"): the text that names who the new
 * arrival is taking out, the partners hearing it, the dates themselves, and
 * the partner asking how it went. Whether a date sparked is how much the one
 * taken out fancies the new arrival against their own partner; a spark
 * costs the couple trust, a date that went nowhere settles the partner.
 */
function bombshellDates(state, rng, name, dates, ex = null) {
  const out = [];
  if (!dates.length) return out;
  out.push(makeEvent(state, rng, { phase: 'event', kind: 'date-text', players: [name, ...dates], aired: true,
    extra: { of: dates.length === 1 ? 'one' : 'two', pop: { [name]: { approval: 0, fame: 0.8 } } } }));
  // The partners, as the names are read out.
  for (const t of dates) {
    const p = partnerOf(state, t);
    if (!p || p === name) continue;
    jealousOf(state, p, name, 0.8);
    feel(state, p, 'stress', 0.4);
    out.push(makeEvent(state, rng, { phase: 'event', kind: 'date-picked', players: [p, t, name], aired: true,
      extra: { pop: { [p]: { approval: 0.2, fame: 0.8 } } } }));
  }
  for (const t of dates) {
    addBond(name, t, 0.3 + 0.4 * ((attr(state, t, name) ?? 0) / 10));
    out.push(makeEvent(state, rng, { phase: 'event', kind: 'date', players: [name, t], aired: true,
      extra: { ...(t === ex ? { exes: true } : {}), pop: { [name]: { approval: 0.2, fame: 1.5 }, [t]: { approval: 0, fame: 1 } } } }));
  }
  // Back from the date: the partner asks.
  for (const t of dates) {
    const p = partnerOf(state, t);
    if (!p || p === name) continue;
    const keen = (attr(state, t, name) ?? 0) + (rng() - 0.5) > Math.max(romance(t, p), attr(state, t, p) ?? 0);
    if (keen) { jealousyHit(state, p, t, name, 1.5); addRelationshipDimension(p, t, 'trust', -0.3); }
    else feel(state, p, 'security', 0.4);
    out.push(makeEvent(state, rng, { phase: 'event', kind: 'date-back', players: [p, t, name], aired: true,
      extra: { of: keen ? 'keen' : 'loyal', ...(t === ex ? { exes: true } : {}), pop: { [t]: { approval: keen ? -0.3 : 0.3, fame: 0.8 } } } }));
  }
  return out;
}

/**
 * TWO WHO WALK IN TOGETHER (user: "do that twin twist bombshell"): a pair
 * the cast's Relationships tab says belong together — twins, siblings, best
 * friends — arrives as one entrance, the way Jess and Eve Gale did on UK 6:
 * "introduced as a pair, but technically separate contestants who would
 * separately couple up". One text for the two of them, both their tapes, the
 * walk down the steps side by side, the faces, and a date each (never the
 * same islander).
 */
export function arrivePair(state, names, { ep, seed, rng, kin }) {
  const before = state.villa.filter(n => !names.includes(n) && !(state.split && state.casa.includes(n)));
  for (const n of names) arriveIslander(state, n, { ep, seed });
  const eyes = names.map(n => {
    const e = eyesOnFor(state, n).filter(x => !names.includes(x));
    state.profiles[n].eyesOnResolved = e;
    return e;
  });
  const events = [];
  if (before.length) {
    const reader = pickOne(rng, before);
    const next = pickOne(rng, before.filter(n => n !== reader)) || null;
    events.push(makeEvent(state, rng, { phase: 'event', kind: 'pair-text', players: next ? [reader, next] : [reader], aired: true,
      extra: { pop: { [reader]: { approval: 0, fame: 0.5 } } } }));
  }
  for (const n of names) events.push(makeEvent(state, rng, { phase: 'event', kind: 'intro', players: [n], aired: true,
    extra: { parts: introParts(state, n, rng), pop: { [n]: { approval: 0.2, fame: 1 } } } }));
  events.push(makeEvent(state, rng, { phase: 'event', kind: 'kin-entrance', players: [...names], aired: true, major: [...names],
    extra: { of: kinGroup(kin), pop: Object.fromEntries(names.map(n => [n, { approval: 0.6, fame: 3.5 }])) } }));
  events.push(...bombshellReactions(state, rng, names[0], before));
  // A date each, and not the same islander twice.
  const first = eyes[0][0] || null;
  const second = eyes[1].find(x => x !== first) || null;
  if (first) events.push(...bombshellDates(state, rng, names[0], [first]));
  if (second) events.push(...bombshellDates(state, rng, names[1], [second]));
  return { events };
}

const pickOne = (rng, xs) => xs[Math.floor(rng() * xs.length)];
function bombshellBuildUp(state, rng, name, before, ex = null) {
  const out = [];
  if (!before.length) return out;
  // The text lands on one phone, read out to whoever is nearest. An ex's
  // text hints at it, and the ex is the one who goes quiet.
  const reader = pickOne(rng, before.filter(n => n !== ex)) || pickOne(rng, before);
  const next = ex && ex !== reader ? ex : pickOne(rng, before.filter(n => n !== reader)) || null;
  out.push(makeEvent(state, rng, { phase: 'event', kind: ex ? 'ex-text' : 'bombshell-text', players: next ? [reader, next] : [reader], aired: true,
    extra: { pop: { [reader]: { approval: 0, fame: 0.5 } } } }));
  // Who is it? A coupled islander worries; a single one hopes. The worry is
  // real: it is stress, and it is on camera.
  const coupled = before.filter(n => partnerOf(state, n)), single = before.filter(n => !partnerOf(state, n));
  const guessers = [pickOne(rng, coupled), pickOne(rng, single)].filter(Boolean);
  for (const a of guessers) {
    const b = partnerOf(state, a) || pickOne(rng, before.filter(n => n !== a));
    if (partnerOf(state, a)) feel(state, a, 'stress', 0.8 * (1 - (state.profiles[a].stats?.temperament ?? 5) / 20));
    out.push(makeEvent(state, rng, { phase: 'event', kind: 'bombshell-guess', players: b ? [a, b] : [a], aired: true,
      extra: { pop: { [a]: { approval: 0.1, fame: 0.8 } } } }));
  }
  // The new islander's own clip, as every islander's first night has one.
  out.push(makeEvent(state, rng, { phase: 'event', kind: 'intro', players: [name], aired: true,
    extra: { parts: introParts(state, name, rng), pop: { [name]: { approval: 0.2, fame: 1 } } } }));
  return out;
}
/**
 * AN EX WALKS IN (user: "how is an ex bombshell presented"). The ex already
 * in the villa sees who it is: how they take it is how much is left between
 * them. Their partner learns the two have history, on the lawn, and that
 * night the two exes have it out, or fall back into it.
 */
function exReveal(state, rng, name, ex) {
  const out = [], later = [];
  const p = partnerOf(state, ex);
  const left = (attr(state, ex, name) ?? 0) + (attr(state, name, ex) ?? 0);
  const spark = left + (rng() - 0.5) * 3 > 10;
  feel(state, ex, 'stress', 1.2 * (1 - (state.profiles[ex].stats?.temperament ?? 5) / 20));
  (state.exArrived ||= {})[ex] = state.ep;
  state.exArrived[name] = state.ep;
  out.push(makeEvent(state, rng, { phase: 'event', kind: 'ex-reveal', players: [ex, name], aired: true, major: [ex, name],
    extra: { of: spark ? 'spark' : 'cold', pop: { [ex]: { approval: 0.2, fame: 2.5 }, [name]: { approval: 0, fame: 2 } } } }));
  if (p && p !== name) {
    // Their partner, finding out on the lawn with everybody watching.
    feel(state, p, 'security', -0.9);
    jealousOf(state, p, name, spark ? 1.4 : 0.8);
    addRelationshipDimension(p, ex, 'trust', spark ? -0.5 : -0.2);
    out.push(makeEvent(state, rng, { phase: 'event', kind: 'ex-partner', players: [p, ex, name], aired: true, major: [p],
      extra: { of: spark ? 'spark' : 'cold', pop: { [p]: { approval: 0.4, fame: 1.5 } } } }));
  }
  // That night: what are you doing here?
  if (spark) {
    nudgeAttraction(state, ex, name, 0.4); nudgeAttraction(state, name, ex, 0.4);
    if (p && p !== name) jealousyHit(state, p, ex, name, 1);
  } else {
    addBond(ex, name, -0.6);
  }
  later.push(makeEvent(state, rng, { phase: 'event', kind: 'ex-confront', players: [ex, name], aired: true,
    extra: { of: spark ? 'spark' : 'cold', pop: { [ex]: { approval: 0, fame: 1.5 }, [name]: { approval: spark ? -0.2 : 0, fame: 1.5 } } } }));
  return { now: out, later };
}

/**
 * An ex bombshell's dates: still keen on the ex, they take the ex out; a
 * schemer who is over them takes the ex's partner out instead, which is the
 * stir (only a schemer: the franchise's gate). Otherwise, whoever they fancy.
 */
function exDates(state, rng, name, ex) {
  const eyes = eyesOnFor(state, name).filter(n => n !== ex);
  if ((attr(state, name, ex) ?? 0) >= 6) return [ex, ...eyes].slice(0, 3);
  const p = partnerOf(state, ex);
  const boldness = (state.profiles[name].stats?.boldness ?? 5) / 10;
  if (p && p !== name && schemeEligible(state.profiles[name]) && rng() < boldness) return [p, ...eyes.filter(n => n !== p)].slice(0, 3);
  return eyes;
}

/**
 * The faces on the lawn as the bombshell comes down. Whoever fancies them
 * most shows it — and when that islander is coupled, the partner sees it,
 * and it lands as jealousy (a consequence, not a caption). A coupled islander
 * whose partner is the one staring says so.
 */
function bombshellReactions(state, rng, name, before) {
  const out = [];
  const drawn = before.filter(n => attr(state, n, name) != null)
    .sort((x, y) => attr(state, y, name) - attr(state, x, name));
  const stunned = drawn[0];
  if (stunned) {
    nudgeAttraction(state, stunned, name, 0.4);
    const p = partnerOf(state, stunned);
    if (p) { jealousOf(state, p, name, 1.2); addBond(p, name, -0.3); }
    out.push(makeEvent(state, rng, { phase: 'event', kind: 'bombshell-react', players: p ? [stunned, name, p] : [stunned, name], aired: true,
      major: p ? [stunned] : [], extra: { of: 'stunned', pop: { [stunned]: { approval: p ? -0.4 : 0.2, fame: 1.5 } } } }));
    // The partner who saw it.
    if (p) {
      out.push(makeEvent(state, rng, { phase: 'event', kind: 'bombshell-react', players: [p, stunned, name], aired: true,
        extra: { of: 'worried', pop: { [p]: { approval: 0.3, fame: 1 } } } }));
    }
  }
  // Somebody the new face does nothing for, which is its own kind of news.
  const cool = drawn.length > 2 ? drawn[drawn.length - 1] : null;
  if (cool && cool !== stunned) {
    out.push(makeEvent(state, rng, { phase: 'event', kind: 'bombshell-react', players: [cool, name], aired: true,
      extra: { of: 'unbothered', pop: { [cool]: { approval: 0.1, fame: 0.5 } } } }));
  }
  return out;
}

export function bombshellSteal(state, name, { rng }) {
  const targets = (state.profiles[name].eyesOnResolved || eyesOnFor(state, name))
    .filter(t => partnerOf(state, t));
  if (!targets.length) return null;
  const stole = targets[0];
  const leftSingle = partnerOf(state, stole);
  const loved = Math.max(0, coupleScore(state.ledger, stole, leftSingle));
  state.couples = state.couples.filter(c => !c.includes(stole));
  state.couples.push([name, stole]);
  const ev = makeEvent(state, rng, { phase: 'event', kind: 'steal', players: [name, stole, leftSingle],
    aired: true, major: [name, stole, leftSingle],
    extra: { pop: { [name]: { approval: -(BETRAYAL.bombshellSteal + 0.05 * loved), fame: 3 },
      [stole]: { approval: 0, fame: 2 }, [leftSingle]: { approval: 1.5, fame: 2 } } } });
  return { stole, leftSingle, events: [ev] };
}

/** The villa splits. The moving gender goes to Casa; arrivals of that gender join the main villa. */
export function openCasa(state, casaNames, { ep, seed, rng, movingGender = 'f' }) {
  const movers = state.villa.filter(n => state.profiles[n].gender === movingGender);
  state.split = true;
  state.splitEp = state.ep;
  state.casa = [...movers];
  state.casaArrivals = [...casaNames];
  const events = [];
  // The first few walk in one at a time; a big Casa's rest arrive together,
  // one group per villa. Eleven single entrances from a handful of lines read
  // as the same scene six times (measured at a 40-islander cast).
  const SOLO = 4;
  const rest = { villa: [], casa: [] };
  // Each one walking in alone gets their intro tape first, like every other
  // new islander — on its own dice, so the rest of the night plays the same.
  const irng = streamFor(seed, `casa-intro:${ep}${state.epSalt || ''}`);
  casaNames.forEach((n, i) => {
    const room = state.profiles[n].gender === movingGender ? 'villa' : 'casa';
    arriveIslander(state, n, { ep, seed, room });
    if (i < SOLO) {
      events.push(makeEvent(state, irng, { phase: 'event', kind: 'intro', players: [n], aired: true,
        extra: { parts: introParts(state, n, irng), pop: { [n]: { approval: 0.2, fame: 1 } } } }));
      events.push(makeEvent(state, rng, { phase: 'event', kind: 'entrance', players: [n], aired: true,
        major: [n], extra: { pop: { [n]: { approval: 0.3, fame: 2 } } } }));
    } else rest[room].push(n);
  });
  for (const group of Object.values(rest)) {
    if (!group.length) continue;
    events.push(makeEvent(state, rng, { phase: 'event', kind: group.length > 1 ? 'group-entrance' : 'entrance',
      players: group, aired: true, major: [...group],
      extra: { pop: Object.fromEntries(group.map(n => [n, { approval: 0.3, fame: 1.5 }])) } }));
  }
  return events;
}

/**
 * What an islander's family thinks of their partner. Families watched the
 * AIRED show from home, like a bombshell did (spec §7), so they may read the
 * public ledger — and only here. -1..1.
 */
export function familyVerdict(state, name, partner) {
  const a = readApproval(state.ledger, partner) / 100;
  const belief = coupleScore(state.ledger, name, partner) / 100;
  return Math.max(-1, Math.min(1, 0.6 * a + 0.4 * belief));
}

// ── HOW A BOMBSHELL NIGHT CAN PLAY (Plan 4.5 phase 2) ─────────────────
// Each is one real format, read from the seasons named beside it, and each
// returns its scenes; the moment (pm/moments.js) dumps anyone it sends home.

// The islanders already there: two bombshells walking in on the same night do
// not stand up for, save or get coupled with each other (measured: the second
// stood for the first, who had just heard nobody stand).
const otherSide = (state, name, tonight = []) => state.villa.filter(n => n !== name && !tonight.includes(n) && attr(state, name, n) != null);

/** Take `pick` for `name`; whoever `pick` was with is left single. */
function coupleWith(state, name, pick) {
  const left = partnerOf(state, pick);
  state.couples = state.couples.filter(c => !c.includes(pick) && !c.includes(name));
  state.couples.push([name, pick]);
  if (left) breakHeart(state, left, pick, 5 * romance(left, pick) / 10);
  return left;
}

/**
 * STAND UP TO BE CHOSEN (UK 12 d24, US 7 d3, US 8 d3). The other side stands
 * if they are interested — in front of their partners — and the bombshell can
 * only choose one who stood. Nobody standing is its own kind of night.
 * Standing reads what the islander feels for the bombshell against how
 * closed off they are with the partner beside them, proportionally.
 */
export function standUp(state, name, { rng, tonight = [] }) {
  const events = [];
  const standers = [];
  for (const c of otherSide(state, name, tonight)) {
    const partner = partnerOf(state, c);
    const want = (attr(state, c, name) ?? 0) / 10;
    const hold = partner ? 0.35 + 0.65 * closedness(state, c, partner) : 0;
    const bold = state.profiles[c].stats.boldness / 10;
    const p = Math.max(0, Math.min(0.95, want * (0.5 + 0.5 * bold) - 0.6 * hold));
    if (rng() >= p) continue;
    standers.push(c);
    if (partner) {
      addBond(partner, c, -1.2 * (0.4 + closedness(state, partner, c)));
      breakHeart(state, partner, c, 1.5 * romance(partner, c) / 10);
    }
    events.push(makeEvent(state, rng, { phase: 'event', kind: 'stand-up', players: partner ? [c, name, partner] : [c, name],
      aired: true, major: partner ? [c] : [],
      extra: { pop: partner ? { [c]: { approval: -0.8, fame: 1.5 }, [partner]: { approval: 0.8, fame: 1 } }
        : { [c]: { approval: 0.1, fame: 0.8 } } } }));
  }
  if (!standers.length) {
    events.push(makeEvent(state, rng, { phase: 'event', kind: 'nobody-stands', players: [name], aired: true, major: [name],
      extra: { pop: { [name]: { approval: 0.8, fame: 2 } } } }));
    return { events, coupled: null };
  }
  const pick = standers.map(c => [c, (attr(state, name, c) ?? 0) + 2 * Math.max(0, friendship(name, c)) / 10 + (rng() - 0.5)])
    .sort((a, b) => b[1] - a[1])[0][0];
  const left = partnerOf(state, pick);
  const loved = left ? Math.max(0, coupleScore(state.ledger, pick, left)) : 0;
  events.push(makeEvent(state, rng, { phase: 'event', kind: 'stand-up-pick', players: left ? [name, pick, left] : [name, pick],
    aired: true, major: left ? [name, pick, left] : [name],
    extra: { stole: left || null, pop: { [name]: { approval: left ? -(BETRAYAL.bombshellSteal + 0.05 * loved) : 0.3, fame: 3 },
      [pick]: { approval: 0, fame: 2 }, ...(left ? { [left]: { approval: 1.5, fame: 2 } } : {}) } } }));
  coupleWith(state, name, pick);
  return { events, coupled: pick };
}

/**
 * THE BOMBSHELL SAVES ONE (UK 12 d9, US 6 d27, US 8 d10). The singles of the
 * other side are at risk; the bombshell dates them and keeps one. The rest
 * are dumped — unless the villa has nobody to spare, when they stay single.
 * Needs two singles to be a choice; with fewer the night is only dates.
 */
export function bombshellSaves(state, name, { rng, spare = true, tonight = [] }) {
  const singles = otherSide(state, name, tonight).filter(n => !partnerOf(state, n));
  if (singles.length < 2) return null;
  const events = [makeEvent(state, rng, { phase: 'event', kind: 'save-setup', players: singles.slice(0, 2), aired: true,
    major: [...singles], extra: { pop: Object.fromEntries(singles.map(n => [n, { approval: 0.3, fame: 1.5 }])) } })];
  for (const s of singles.slice(0, 3)) {
    addBond(name, s, 0.3 + 0.4 * ((attr(state, s, name) ?? 0) / 10));
    events.push(makeEvent(state, rng, { phase: 'event', kind: 'date', players: [name, s], aired: true,
      extra: { pop: { [name]: { approval: 0.2, fame: 1 }, [s]: { approval: 0.1, fame: 1 } } } }));
  }
  const pick = singles.map(s => [s, (attr(state, name, s) ?? 0) + 3 * Math.max(0, friendship(name, s)) / 10 + (rng() - 0.5)])
    .sort((a, b) => b[1] - a[1])[0][0];
  const rest = singles.filter(s => s !== pick);
  events.push(makeEvent(state, rng, { phase: 'event', kind: 'bombshell-save', players: [name, pick, rest[0]], aired: true,
    major: [name, pick], extra: { pop: { [name]: { approval: 0.3, fame: 2.5 }, [pick]: { approval: 0.5, fame: 2 } } } }));
  coupleWith(state, name, pick);
  return { events, saved: pick, dumped: spare ? rest : [] };
}

/**
 * THE PUBLIC COUPLES THE BOMBSHELL (US 7 d11, US 8 d10). Viewers voted for
 * who the new arrival should couple up with, so it reads what AIRED — whom the
 * public likes, and whom the bombshell was seen to fancy — and nothing the
 * islanders decided. Whoever the chosen islander was with is left single.
 */
export function publicMatch(state, name, { rng, tonight = [] }) {
  const pool = otherSide(state, name, tonight);
  if (!pool.length) return null;
  const pick = pool.map(c => [c, readApproval(state.ledger, c) / 25 + (attr(state, name, c) ?? 0) / 10 + (rng() - 0.5) * 0.6])
    .sort((a, b) => b[1] - a[1])[0][0];
  const left = partnerOf(state, pick);
  const events = [makeEvent(state, rng, { phase: 'event', kind: 'public-match', players: left ? [name, pick, left] : [name, pick],
    aired: true, major: left ? [name, pick, left] : [name, pick],
    extra: { stole: left || null, pop: { [name]: { approval: 0.2, fame: 2.5 }, [pick]: { approval: 0, fame: 2 },
      ...(left ? { [left]: { approval: 1.2, fame: 2 } } : {}) } } })];
  coupleWith(state, name, pick);
  return { events, coupled: pick };
}

/**
 * A RETURNING ISLANDER (UK 10: Molly back during Casa; UK 12: Blu and Megan
 * back for the last week). Producers bring back who the public want back, so
 * the choice reads what AIRED — approval — and the islander must have lived
 * in the villa (a Casa arrival who never coupled is not a comeback). They walk
 * back in single, with everything they left: their ex, and whoever voted them
 * out, are still in there.
 */
export function returnIslander(state, { ep, seed, rng }) {
  const gone = [...new Set((state.gone || []).map(x => x.name))]
    .filter(n => !state.villa.includes(n) && (state.gone.find(x => x.name === n).ep > (state.ledger.firstEp?.[n] ?? 0)));
  if (!gone.length) return null;
  // The side the villa is short of, as a bombshell would be.
  const count = g => state.villa.filter(n => state.profiles[n].gender === g).length;
  const need = count('f') === count('m') ? null : count('f') < count('m') ? 'f' : 'm';
  const pool = need ? gone.filter(n => state.profiles[n].gender === need) : gone;
  const pick = (pool.length ? pool : gone).map(n => [n, readApproval(state.ledger, n) / 20 + rng()])
    .sort((a, b) => b[1] - a[1])[0][0];
  arriveIslander(state, pick, { ep, seed });
  (state.returnedEp ||= {})[pick] = ep;
  const events = [makeEvent(state, rng, { phase: 'event', kind: 'return-entrance', players: [pick], aired: true, major: [pick],
    extra: { pop: { [pick]: { approval: 1, fame: 3 } } } })];
  // The ex they left behind, if the ex is still here — and who they are with now.
  const ex = state.leftBehind?.[pick];
  if (ex && state.villa.includes(ex)) {
    const now = partnerOf(state, ex);
    addBond(pick, ex, romance(pick, ex) > 3 ? 0.5 : -0.5);
    if (now) addBond(pick, now, -1);
    events.push(makeEvent(state, rng, { phase: 'event', kind: 'return-ex', players: now ? [pick, ex, now] : [pick, ex], aired: true,
      major: [pick, ex], extra: { stole: now || null, pop: { [pick]: { approval: 0.3, fame: 2 }, [ex]: { approval: 0, fame: 1.5 } } } }));
  }
  // Whoever voted them out has to face them.
  for (const v of (state.dumpedBy?.[pick] || []).filter(v => state.villa.includes(v))) addBond(pick, v, -0.6);
  for (const t2 of eyesOnFor(state, pick).slice(0, 2)) {
    addBond(pick, t2, 0.3 + 0.4 * ((attr(state, t2, pick) ?? 0) / 10));
    events.push(makeEvent(state, rng, { phase: 'event', kind: 'date', players: [pick, t2],
      extra: { pop: { [pick]: { approval: 0.2, fame: 1.5 }, [t2]: { approval: 0, fame: 1 } } } }));
  }
  return { name: pick, events };
}

/**
 * WHAT AN INTRODUCTION SAYS, from the islander's own profile (user: "what
 * are the presentations based off — archetype, country, looking for,
 * persona, type, icks, interests, eyes on, ex, stats?"). Three lines, the
 * way the real show's intro clips run: who they are and what they want
 * (intent, persona, archetype — and the stats, through the persona), their
 * type (a look they go for, or else the vibe), and one more thing — the
 * person they already have their eye on or the ex they hope stays away
 * when there is one, otherwise where they're from, an ick or an interest.
 * Names never: the villa does not know yet, and neither does the viewer.
 */
export function introParts(state, a, rng) {
  const p = state.profiles[a];
  const parts = [['intro', null]];
  // Any part of their type, not always the first: two islanders who both go
  // for tall should not both lead with it.
  const looks = p.type?.looks || [], vibes = p.type?.vibes || [];
  const pickOf = xs => xs[Math.floor(rng() * xs.length)];
  parts.push(looks.length && (!vibes.length || rng() < 0.6) ? ['intro-look', pickOf(looks)] : ['intro-vibe', pickOf(vibes) || 'funny']);
  // Somebody they already know is in the cast (the Relationships tab): the
  // tape says so, as twins' and best friends' tapes do.
  // Only somebody who is there: walking in tonight too ("going in with me"),
  // or already inside ("they have no idea I'm coming"). Never an ex who has
  // gone home (season 57: "My ex is going in too" weeks after she was dumped),
  // and never a bombshell who has not arrived yet.
  const firstEp = n => state.ledger?.firstEp?.[n];
  const known = kinFor(state, a).find(k => (onYourSide(k.kin) || k.kin === 'exes')
    && state.villa.includes(k.other) && firstEp(k.other) != null);
  if (known) {
    const inside = firstEp(known.other) < state.ep;
    parts.push(['intro-kin', kinGroup(known.kin) + (inside ? '-in' : '')]);
  }
  if (p.eyesOn?.length) parts.push(['intro-eyes', 'set']);
  else if (p.ex && !known) parts.push(['intro-ex', 'set']);
  else {
    // Where they're from only when it is THEIRS: the season's default voice is
    // everybody's, and on an American season every islander said "I'm American".
    const options = [['intro-from', p.dialect], ['intro-ick', p.icks?.[0]], ['intro-ick', p.icks?.[1]],
      ['intro-interest', p.interests?.[0]], ['intro-interest', p.interests?.[1]]]
      .filter(o => o[1]);
    parts.push(options[Math.floor(rng() * options.length)]);
  }
  return parts;
}

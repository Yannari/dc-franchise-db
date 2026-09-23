// ══════════════════════════════════════════════════════════════════════
// pm/moments.js — each episode's big moment, and the dumping scene
// ══════════════════════════════════════════════════════════════════════
//
// The dumping is its own scene in five PHASES (spec §10) — build-up, verdict
// (with the villa's ballots revealed), reaction, goodbye, fallout — each
// carrying as many events as the night produces. Every beat moves bonds, and
// a partner left behind can be heartbroken enough to walk out with them.
import { addBond, getBond } from '../bonds.js';
import { makeEvent, partnerOf, roomMates, airLater } from './events.js';
import { romance } from './feelings.js';
import { closedness } from './ladder.js';
import { breakHeart } from './emotions.js';
import { runRecoupling } from './recoupling.js';
import { publicVote, publicVoteIslanders, finalVote, splitOrSteal } from './public-vote.js';
import { villaDumping, topCouplePicks, saveOne, couplesVote, returningExes, exIslandersVote } from './villa-vote.js';
import { arriveBombshell, bombshellSteal, openCasa } from './arrivals.js';
import { stickOrTwist } from './casa.js';
import { closeEpisode, BETRAYAL } from './ledger.js';
import { FINAL_COUPLES } from './schedule.js';

const EXIT = 'dumped';

function removeFromVilla(state, names) {
  // Who has gone, and when: the ex-islanders who come back to vote are read
  // from here (villa-vote.js returningExes).
  for (const n of names) if (state.villa.includes(n) || state.casa.includes(n)) (state.gone ||= []).push({ name: n, ep: state.ep });
  state.villa = state.villa.filter(n => !names.includes(n));
  state.casa = state.casa.filter(n => !names.includes(n));
  state.couples = state.couples.filter(c => !c.some(n => names.includes(n)));
}

export function dumpingScene(state, rng, { atRisk = [], dumped, ballots = [], channel, decision = null }) {
  const events = [];
  const solidarityWalk = [];
  // Every phase knows which vote it came from, so Dior says the right thing.
  const ev = (kind, players, pop, major = []) => events.push(makeEvent(state, rng,
    { phase: 'dumping', kind, players, aired: true, major, extra: { pop, channel } }));
  const partners = Object.fromEntries(dumped.map(n => [n, partnerOf(state, n)]));
  // What the dumped will remember if they are ever asked back: who voted them
  // out, and the partner they left behind (villa-vote.js grudgeOf).
  for (const n of dumped) {
    (state.dumpedBy ||= {})[n] = ballots.filter(b => !b.save && (b.target === n || b.couple?.includes(n))).map(b => b.voter);
    if (partners[n]) (state.leftBehind ||= {})[n] = partners[n];
  }
  // 1. build-up: a couple at risk, or one islander on their own (save-one)
  for (const c of atRisk) ev(c.length === 1 ? 'dump-at-risk' : 'dump-buildup', c, Object.fromEntries(c.map(n => [n, { approval: 0, fame: 0.5 }])));
  // …then the decision, when somebody makes it in front of the villa
  if (decision) events.push(...decision());
  // 2. the ballots in front of everyone, THEN the verdict they add up to
  // (the verdict read first had Dior announcing a count nobody had cast).
  for (const b of ballots) {
    // A vote to SAVE (save-one): the saved islander owes the voter.
    if (b.save) {
      addBond(b.target, b.voter, 0.6);
      ev('save-vote', [b.voter, b.target], { [b.voter]: { approval: 0.1, fame: 0.8 } });
      continue;
    }
    // A ballot with its own scene (an ex-islander's) is shown whether or not
    // it carried: every ex stands up and says it. The ex is gone again by
    // morning, so only the one voted against carries the bond.
    if (b.kind) {
      addBond(b.target, b.voter, -0.8);
      events.push(makeEvent(state, rng, { phase: 'dumping', kind: b.kind, players: [b.voter, b.target], aired: true,
        extra: { channel, grudge: b.grudge || null, pop: { [b.voter]: { approval: 0, fame: 1 } } } }));
      continue;
    }
    if (!dumped.includes(b.target)) continue;
    // Decided in a scene of its own (the favourite couple's pick): the bond,
    // not a second reveal.
    if (b.silent) {
      for (const n of b.couple || [b.target]) addBond(n, b.voter, -0.8);
      continue;
    }
    addBond(b.target, b.voter, -0.8);
    const p = partners[b.target];
    if (p && p !== b.voter && !dumped.includes(p)) addBond(p, b.voter, -0.5);
    ev('ballot-reveal', [b.voter, b.target], { [b.voter]: { approval: -0.2, fame: 1 } });
  }
  // A couple dumped together hears it once, together; several singles left
  // over hear it once, as a group ("X is the only one still standing" over
  // five people standing was false, and five times over).
  const done = new Set();
  const lone = dumped.filter(n => !(partners[n] && dumped.includes(partners[n])));
  if (channel === 'recoupling' && lone.length > 1) {
    ev('dump-verdict-singles', lone, Object.fromEntries(lone.map(n => [n, { approval: 0, fame: 2 }])), lone);
    for (const n of lone) done.add(n);
  }
  for (const n of dumped) {
    if (done.has(n)) continue;
    const p = partners[n];
    if (p && dumped.includes(p)) {
      done.add(n); done.add(p);
      ev('dump-verdict-couple', [n, p], { [n]: { approval: 0, fame: 2 }, [p]: { approval: 0, fame: 2 } }, [n, p]);
    } else {
      done.add(n);
      ev('dump-verdict', [n], { [n]: { approval: 0, fame: 2 } }, [n]);
    }
  }
  // 3. reaction: the partner left behind, and the ones who cannot stay without them
  for (const n of dumped) {
    const p = partners[n];
    if (!p || dumped.includes(p)) continue;
    breakHeart(state, p, n, 5 * romance(p, n) / 10);
    ev('dump-reaction', [p, n], { [p]: { approval: 0.8 * Math.max(0, getBond(p, n)) / 10 + 0.3, fame: 1.5 } });
    const solidarity = (romance(p, n) / 10) ** 2 * (state.profiles[p].stats.loyalty / 10)
      * (0.3 + 0.7 * closedness(state, p, n));
    if (rng() < solidarity * 0.5) {
      solidarityWalk.push(p);
      ev('solidarity', [p, n], { [p]: { approval: 2.5, fame: 2 } }, [p]);
    }
  }
  // 4. goodbye: hugs from the friends — fewer each when many are going, or
  // a five-way dumping is twenty goodbyes from seven lines.
  const hugs = dumped.length > 2 ? 1 : dumped.length > 1 ? 2 : 3;
  for (const n of dumped) {
    const friends = roomMates(state, n).filter(m => getBond(n, m) > 1).slice(0, hugs);
    for (const f of friends) { addBond(n, f, 0.2); ev('dump-goodbye', [n, f], { [n]: { approval: 0.5, fame: 0.5 } }); }
    ev('dump-goodbye', [n], { [n]: { approval: 1.5, fame: 1 } });
  }
  removeFromVilla(state, [...dumped, ...solidarityWalk]);
  // 5. fallout: whoever is newly single panics
  for (const p of Object.values(partners)) {
    if (p && state.villa.includes(p) && !partnerOf(state, p)) ev('dump-fallout', [p], { [p]: { approval: 0.2, fame: 1 } });
  }
  return {
    events,
    exits: [
      ...dumped.map(name => ({ name, verb: EXIT, channel })),
      ...solidarityWalk.map(name => ({ name, verb: 'walked', channel: 'walk', cause: 'solidarity' })),
    ],
  };
}

function pickerGender(state) {
  const g = state.recouplings % 2 === 0 ? 'm' : 'f';
  state.recouplings++;
  return g;
}

function recoupleNight(state, rng, { dumpSingles, pace = 1.5 }) {
  const r = runRecoupling(state, { rng, pickerGender: pickerGender(state) });
  const events = r.picks.map(pk => makeEvent(state, rng, { phase: 'firepit', kind: 'recouple-pick',
    players: [pk.picker, pk.picked, ...(pk.stole ? [pk.stole] : [])], aired: true,
    major: pk.stole ? [pk.picker, pk.stole] : [],
    extra: { stole: pk.stole, reason: pk.reason, pop: { [pk.picker]: { approval: pk.stole ? -BETRAYAL.steal : 0.2, fame: 1 },
      ...(pk.stole ? { [pk.stole]: { approval: 1.5, fame: 2 } } : {}) } } }));
  for (const pk of r.picks) if (pk.stole) breakHeart(state, pk.stole, pk.picked, 5 * romance(pk.stole, pk.picked) / 10);
  state.couples = r.couples;
  if (!dumpSingles || !r.single.length) return { events, exits: [], ballots: r.ballots };
  // At most two go on a recoupling night, and only one once the villa is
  // down to ten: the real show leaves the rest single rather than emptying
  // the place a ceremony at a time. Measured: without the second cap, a
  // thin season arrived at the final with two couples instead of four.
  // …and the season's pace moves that: nobody goes when the villa has no one
  // to spare, and more go when a short season has more to lose (season.js).
  // Under half an islander a night to spare, the singles stay and try again;
  // under one, a night dumps one at most.
  const base = state.villa.length > 10 ? 2 : 1;
  const cap = pace < 0.5 ? 0 : pace < 1 ? 1 : Math.max(base, Math.ceil(pace - 0.5));
  if (!cap) return { events, exits: [], ballots: r.ballots };
  const dumped = r.single.slice(0, cap);
  const scene = dumpingScene(state, rng, { atRisk: [], dumped, ballots: [], channel: 'recoupling' });
  return { events: [...events, ...scene.events], exits: scene.exits, ballots: r.ballots };
}

/**
 * Bombshells are cast to the villa that exists: a dumping takes whichever
 * side was surplus, so the next arrival comes from the side that is short.
 * Without this the villa drifts out of balance and the singles can never
 * couple up again — the final ended with two couples and three singles.
 */
function arrivals(state, ctx, count) {
  const out = [];
  for (let i = 0; i < count && ctx.queues.bombshell.length; i++) {
    const need = ['f', 'm'].sort((a, b) =>
      state.villa.filter(n => state.profiles[n].gender === a).length
      - state.villa.filter(n => state.profiles[n].gender === b).length)[0];
    const idx = Math.max(0, ctx.queues.bombshell.findIndex(n => state.profiles[n].gender === need));
    const [name] = ctx.queues.bombshell.splice(idx, 1);
    out.push(...arriveBombshell(state, name, { ep: state.ep, seed: ctx.seed, rng: ctx.rng }).events);
  }
  return out;
}

// ── the dumping formats of Plan 4.5 ──────────────────────────────────
// Each reads its real-show night: who is at risk, who decides, and the scene
// where they decide it, before the verdict.

/** The public's favourite couple picks which bottom couple goes. */
function topCoupleNight(state, ctx, pv, top) {
  const tp = topCouplePicks(state, { bottom: pv.bottom, pickers: top, rng: ctx.rng });
  const decision = () => [makeEvent(state, ctx.rng, { phase: 'dumping', kind: 'top-couple-pick',
    players: [top[0], top[1], tp.dumped[0], tp.dumped[1]], aired: true, major: [...top],
    extra: { channel: 'top-couple', pop: Object.fromEntries(top.map(n => [n, { approval: -0.3, fame: 1.5 }])) } })];
  const ballots = tp.ballots.map(b => ({ ...b, silent: true }));
  const scene = dumpingScene(state, ctx.rng, { atRisk: pv.bottom, dumped: tp.dumped, ballots, channel: 'top-couple', decision });
  return { events: scene.events, exits: scene.exits, ballots: tp.ballots,
    extra: { shares: pv.shares, bottom: pv.bottom, deciders: [...top], dumpFormat: 'top-couple-picks' } };
}

/** The public's bottom boys (or girls); the other side saves one. */
function saveOneNight(state, ctx) {
  // The larger side is the one at risk, so the night evens the villa out.
  const count = g => state.villa.filter(n => state.profiles[n].gender === g).length;
  const side = count('f') === count('m') ? (ctx.rng() < 0.5 ? 'f' : 'm') : count('f') > count('m') ? 'f' : 'm';
  const pv = publicVoteIslanders(state, { rng: ctx.rng, gender: side, bottom: ctx.entry.bottom || 3 });
  const so = saveOne(state, { atRisk: pv.bottom, rng: ctx.rng });
  const scene = dumpingScene(state, ctx.rng, { atRisk: pv.bottom.map(n => [n]), dumped: so.dumped,
    ballots: so.ballots, channel: 'save' });
  return { events: scene.events, exits: scene.exits, ballots: so.ballots,
    extra: { islanderShares: pv.shares, bottom: pv.bottom.map(n => [n]), saved: so.saved, dumpFormat: 'save-one' } };
}

/** The single islanders face the public; the fewest votes go. */
function singlesVoteNight(state, ctx, singles, n) {
  const pv = publicVoteIslanders(state, { rng: ctx.rng, names: singles, bottom: singles.length });
  const dumped = pv.bottom.slice(0, n);
  const scene = dumpingScene(state, ctx.rng, { atRisk: singles.map(x => [x]), dumped, channel: 'public' });
  return { events: scene.events, exits: scene.exits, ballots: [],
    extra: { islanderShares: pv.shares, bottom: singles.map(x => [x]), dumpFormat: 'singles' } };
}

/** Each couple names the least compatible couple, in front of everyone. */
function coupleVoteScenes(state, rng, cv) {
  return cv.votes.map(v => {
    for (const x of v.couple) for (const y of v.target) addBond(y, x, -0.3);
    return makeEvent(state, rng, { phase: 'firepit', kind: 'couples-vote', players: [...v.couple, ...v.target], aired: true,
      extra: { pop: Object.fromEntries(v.couple.map(n => [n, { approval: 0, fame: 0.5 }])) } });
  });
}

/** No public vote at all: the villa names two couples, and the safe islanders pick. */
function couplesVoteNight(state, ctx) {
  const cv = couplesVote(state, { rng: ctx.rng, atRisk: ctx.entry.bottom || 2 });
  const named = coupleVoteScenes(state, ctx.rng, cv);
  const vd = villaDumping(state, { format: 'safe-pick-couple', bottom: cv.vulnerable, rng: ctx.rng });
  const scene = dumpingScene(state, ctx.rng, { atRisk: cv.vulnerable, dumped: vd.dumped, ballots: vd.ballots, channel: 'couples' });
  return { events: [...named, ...scene.events], exits: scene.exits, ballots: vd.ballots,
    extra: { bottom: cv.vulnerable, dumpFormat: 'couples-vote' } };
}

/** The semi-final the dumped islanders decide. */
function exIslandersNight(state, ctx, singles, over, exes) {
  const events = [];
  const exits = [];
  if (singles.length) {
    const s = dumpingScene(state, ctx.rng, { dumped: singles, channel: 'recoupling' });
    events.push(...s.events); exits.push(...s.exits);
  }
  const cv = couplesVote(state, { rng: ctx.rng, atRisk: Math.min(state.couples.length, over + 1) });
  events.push(...coupleVoteScenes(state, ctx.rng, cv));
  const exv = exIslandersVote(state, { exes, vulnerable: cv.vulnerable, rng: ctx.rng, dump: over });
  // One entrance for the group, led by the most recent: eight separate
  // arrivals from four lines read as the same scene twice (measured).
  const decision = () => [makeEvent(state, ctx.rng, { phase: 'dumping', kind: 'ex-return', players: [exes[0]],
    aired: true, extra: { channel: 'exes', pop: Object.fromEntries(exes.map(ex => [ex, { approval: 0, fame: 1 }])) } })];
  const scene = dumpingScene(state, ctx.rng, { atRisk: cv.vulnerable, dumped: exv.dumped,
    ballots: exv.ballots.map(b => ({ ...b, kind: 'ex-ballot' })), channel: 'exes', decision });
  events.push(...scene.events); exits.push(...scene.exits);
  return { events, exits, ballots: exv.ballots, extra: { bottom: cv.vulnerable, exes, dumpFormat: 'ex-islanders' } };
}

export const MOMENTS = {
  'first-coupling': (state, ctx) => {
    const first = recoupleNight(state, ctx.rng, { dumpSingles: false });
    const events = [...first.events, ...arrivals(state, ctx, ctx.entry.arrivals?.bombshell || 0)];
    for (const name of state.villa.filter(n => state.ledger.firstEp[n] === state.ep
      && state.profiles[n].role === 'bombshell')) {
      const st = bombshellSteal(state, name, { rng: ctx.rng });
      if (st) events.push(...st.events);
    }
    return { events, exits: [], ballots: first.ballots };
  },
  recoupling: (state, ctx) => {
    const pre = arrivals(state, ctx, ctx.entry.arrivals?.bombshell || 0);
    // The last recoupling is about who is with whom, not about emptying the
    // villa: the semi-final vote does that next week.
    const r = recoupleNight(state, ctx.rng, { dumpSingles: !ctx.entry.keepSingles, pace: ctx.pace });
    return { events: [...pre, ...r.events], exits: r.exits, ballots: r.ballots };
  },
  bombshell: (state, ctx) => ({ events: arrivals(state, ctx, ctx.entry.arrivals?.bombshell || 0), exits: [], ballots: [] }),
  'public-vote': (state, ctx) => {
    // A small villa can reach a vote night with two couples or fewer: a vote
    // would send one of the last couples home before the final. The night
    // plays without one, and the row says no format played.
    // And a villa already down to the final's four couples keeps them, as
    // does one with nobody to spare: a vote sends two or three home, so it
    // needs about one islander to spare a night. Letting a four-couple villa
    // vote because arrivals were still to come was measured, and it cost
    // four-couple finals (15 of 20 at the calibration cast, against 18).
    if (state.couples.length < 3 || state.couples.length <= FINAL_COUPLES || ctx.pace < 0.8) {
      // …unless the villa has single islanders to lose: then the singles face
      // the public (measured: at the calibration cast a quarter of second
      // votes met four couples and three or four singles, who then all went
      // at once at the semi-final).
      // Only the singles nobody is left to arrive for: a bombshell still to
      // come is somebody's partner (measured: dumping those cost the
      // 16-islander cast its four-couple finals, 18 of 20 down to 13).
      const singles = state.villa.filter(n => !partnerOf(state, n));
      const toCome = (ctx.queues?.bombshell?.length || 0) + (ctx.queues?.casa?.length || 0);
      const spare = Math.min(Math.round(ctx.pace), singles.length - toCome);
      if (spare > 0 && ctx.pace >= 0.8) return singlesVoteNight(state, ctx, singles, spare);
      return { events: [], exits: [], ballots: [], extra: { dumpFormat: null } };
    }
    const fmt = ctx.entry.dumpFormat;
    if (fmt === 'save-one') return saveOneNight(state, ctx);
    if (fmt === 'couples-vote') return couplesVoteNight(state, ctx);
    const pv = publicVote(state, { rng: ctx.rng, bottom: ctx.entry.bottom || 2 });
    if (fmt === 'top-couple-picks') {
      const top = [...pv.shares].sort((a, b) => b.share - a.share).map(s => s.couple).find(c => !pv.bottom.includes(c));
      if (top) return topCoupleNight(state, ctx, pv, top);
    }
    // A favourite couple is needed to pick; when every couple is in the
    // bottom there is none, and the public's own vote stands. The row says
    // which format PLAYED, never only the one that was drawn.
    const played = fmt === 'top-couple-picks' ? 'public' : fmt;
    const vd = villaDumping(state, { format: played, bottom: pv.bottom, rng: ctx.rng });
    const scene = dumpingScene(state, ctx.rng, { atRisk: pv.bottom, dumped: vd.dumped, ballots: vd.ballots,
      channel: played === 'public' ? 'public' : 'villa' });
    return { events: scene.events, exits: scene.exits, ballots: vd.ballots,
      extra: { shares: pv.shares, bottom: pv.bottom, dumpFormat: played } };
  },
  'casa-open': (state, ctx) => {
    const names = ctx.queues.casa.splice(0);
    return { events: names.length ? openCasa(state, names, { ep: state.ep, seed: ctx.seed, rng: ctx.rng }) : [],
      exits: [], ballots: [] };
  },
  'casa-nights': () => ({ events: [], exits: [], ballots: [] }),
  'stick-or-twist': (state, ctx) => {
    if (!state.split) return { events: [], exits: [], ballots: [] };
    const st = stickOrTwist(state, { rng: ctx.rng });
    const exits = st.dumped.map(name => ({ name, verb: EXIT, channel: 'casa' }));
    return { events: st.events, exits, ballots: st.ballots };
  },
  photos: (state, ctx) => {
    const events = [];
    // The photos are a scene, not an inbox: the worst half-dozen get shown.
    const shown = state.secrets.filter(x => x.casa && !x.known)
      .sort((a, b) => b.severity - a.severity).slice(0, 6);
    for (const sec of shown) {
      sec.known = true;
      sec.public = true;              // the whole villa saw the photos
      if (!state.villa.includes(sec.who) || !state.villa.includes(sec.partner)) continue;
      addBond(sec.who, sec.partner, -1.5 * sec.severity);
      const hidden = state.history.find(e => e.id === sec.eventId);
      if (hidden) airLater(state, hidden);
      events.push(makeEvent(state, ctx.rng, { phase: 'firepit', kind: 'photos', players: [sec.partner, sec.who],
        aired: true, major: [sec.partner, sec.who],
        extra: { secret: sec.id, pop: { [sec.partner]: { approval: 1.5, fame: 2 }, [sec.who]: { approval: -BETRAYAL.photos, fame: 2 } } } }));
    }
    return { events: [...events, ...arrivals(state, ctx, ctx.entry.arrivals?.bombshell || 0)], exits: [], ballots: [] };
  },
  'semi-final': (state, ctx) => {
    // Nobody goes to the final alone: anyone still single leaves, and the
    // couples are trimmed down to four — by the public, or by the islanders
    // the villa already dumped (UK 11 d55, UK 12 d56, UK 13 d46).
    const singles = state.villa.filter(n => !partnerOf(state, n));
    const over = state.couples.length - FINAL_COUPLES;
    const exes = ctx.entry.dumpFormat === 'ex-islanders' && over > 0 ? returningExes(state) : [];
    if (exes.length) return exIslandersNight(state, ctx, singles, over, exes);
    // The singles first, and in the words of a night nobody picked them:
    // "the public have voted" over somebody nobody voted on was false.
    const events = [], exits = [];
    if (singles.length) {
      const s = dumpingScene(state, ctx.rng, { dumped: singles, channel: 'recoupling' });
      events.push(...s.events); exits.push(...s.exits);
    }
    const pv = over > 0 ? publicVote(state, { rng: ctx.rng, bottom: over }) : null;
    if (pv) {
      const s = dumpingScene(state, ctx.rng, { atRisk: pv.bottom, dumped: pv.bottom.flat(), channel: 'public' });
      events.push(...s.events); exits.push(...s.exits);
    }
    // Four couples or fewer: nobody votes, so no format played (an ex-islander
    // night that was drawn and never happened must not claim it did).
    return { events, exits, ballots: [],
      extra: { shares: pv?.shares || null, bottom: pv?.bottom || null, dumpFormat: pv ? 'public' : null } };
  },
  final: (state, ctx) => {
    const events = state.couples.map(([a, b]) => makeEvent(state, ctx.rng, { phase: 'firepit', kind: 'declaration',
      players: [a, b], aired: true, extra: { pop: {
        [a]: { approval: 2 * romance(a, b) / 10, fame: 2 }, [b]: { approval: 2 * romance(b, a) / 10, fame: 2 } } } }));
    // Declarations count toward the vote: close the ledger before the country votes.
    closeEpisode(state.ledger, state.ep, ctx.popularity);
    ctx.closed = true;
    const final = finalVote(state, { rng: ctx.rng });
    const envelope = ctx.splitOrStealOn ? splitOrSteal(state, final[0].couple, { rng: ctx.rng }) : null;
    return { events, exits: [], ballots: [], extra: { final, envelope, shares: final.map(f => ({ couple: f.couple, share: f.share })) } };
  },
  reunion: (state, ctx) => {
    // What they didn't show you: the biggest hidden events, aired at last.
    const hidden = state.history.filter(e => !e.aired && e.kind !== 'loyalty')
      .map(e => [e, Object.values(e.pop).reduce((a, p) => a + Math.abs(p.approval || 0), 0)])
      .sort((a, b) => b[1] - a[1]).slice(0, 5).map(([e]) => e);
    const events = hidden.map(e => {
      const touched = Object.keys(e.pop);
      airLater(state, e);
      // The reveal names everyone the clip moves, so the row can explain the
      // approval it just cost them: a major moment nobody could see on the
      // screen is the "computed, drawn nowhere" bug class (§11.5 A).
      return makeEvent(state, ctx.rng, { phase: 'reunion', kind: 'reveal', players: e.players,
        aired: true, major: touched, extra: { revealed: e.id, pop: {} } });
    });
    return { events, exits: [], ballots: [], extra: { revealed: hidden.map(e => e.id) } };
  },
};

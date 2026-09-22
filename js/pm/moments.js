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
import { publicVote, finalVote, splitOrSteal } from './public-vote.js';
import { villaDumping } from './villa-vote.js';
import { arriveBombshell, bombshellSteal, openCasa } from './arrivals.js';
import { stickOrTwist } from './casa.js';
import { closeEpisode } from './ledger.js';
import { FINAL_COUPLES } from './schedule.js';

const EXIT = 'dumped';

function removeFromVilla(state, names) {
  state.villa = state.villa.filter(n => !names.includes(n));
  state.casa = state.casa.filter(n => !names.includes(n));
  state.couples = state.couples.filter(c => !c.some(n => names.includes(n)));
}

export function dumpingScene(state, rng, { atRisk = [], dumped, ballots = [], channel }) {
  const events = [];
  const solidarityWalk = [];
  // Every phase knows which vote it came from, so Dior says the right thing.
  const ev = (kind, players, pop, major = []) => events.push(makeEvent(state, rng,
    { phase: 'dumping', kind, players, aired: true, major, extra: { pop, channel } }));
  const partners = Object.fromEntries(dumped.map(n => [n, partnerOf(state, n)]));
  // 1. build-up
  for (const c of atRisk) ev('dump-buildup', c, Object.fromEntries(c.map(n => [n, { approval: 0, fame: 0.5 }])));
  // 2. verdict, and the ballots in front of everyone
  for (const n of dumped) ev('dump-verdict', [n], { [n]: { approval: 0, fame: 2 } }, [n]);
  for (const b of ballots) {
    if (!dumped.includes(b.target)) continue;
    addBond(b.target, b.voter, -0.8);
    const p = partners[b.target];
    if (p && p !== b.voter && !dumped.includes(p)) addBond(p, b.voter, -0.5);
    ev('ballot-reveal', [b.voter, b.target], { [b.voter]: { approval: -0.2, fame: 1 } });
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
  // 4. goodbye: hugs from the friends
  for (const n of dumped) {
    const friends = roomMates(state, n).filter(m => getBond(n, m) > 1).slice(0, 3);
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

function recoupleNight(state, rng, { dumpSingles }) {
  const r = runRecoupling(state, { rng, pickerGender: pickerGender(state) });
  const events = r.picks.map(pk => makeEvent(state, rng, { phase: 'firepit', kind: 'recouple-pick',
    players: [pk.picker, pk.picked, ...(pk.stole ? [pk.stole] : [])], aired: true,
    major: pk.stole ? [pk.picker, pk.stole] : [],
    extra: { stole: pk.stole, reason: pk.reason, pop: { [pk.picker]: { approval: pk.stole ? -1 : 0.2, fame: 1 },
      ...(pk.stole ? { [pk.stole]: { approval: 1.5, fame: 2 } } : {}) } } }));
  for (const pk of r.picks) if (pk.stole) breakHeart(state, pk.stole, pk.picked, 5 * romance(pk.stole, pk.picked) / 10);
  state.couples = r.couples;
  if (!dumpSingles || !r.single.length) return { events, exits: [], ballots: r.ballots };
  // At most two go on a recoupling night, and only one once the villa is
  // down to ten: the real show leaves the rest single rather than emptying
  // the place a ceremony at a time. Measured: without the second cap, a
  // thin season arrived at the final with two couples instead of four.
  const dumped = r.single.slice(0, state.villa.length > 10 ? 2 : 1);
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
    const r = recoupleNight(state, ctx.rng, { dumpSingles: !ctx.entry.keepSingles });
    return { events: [...pre, ...r.events], exits: r.exits, ballots: r.ballots };
  },
  bombshell: (state, ctx) => ({ events: arrivals(state, ctx, ctx.entry.arrivals?.bombshell || 0), exits: [], ballots: [] }),
  'public-vote': (state, ctx) => {
    const pv = publicVote(state, { rng: ctx.rng, bottom: ctx.entry.bottom || 2 });
    const vd = villaDumping(state, { format: ctx.entry.dumpFormat, bottom: pv.bottom, rng: ctx.rng });
    const scene = dumpingScene(state, ctx.rng, { atRisk: pv.bottom, dumped: vd.dumped, ballots: vd.ballots,
      channel: ctx.entry.dumpFormat === 'public' ? 'public' : 'villa' });
    return { events: scene.events, exits: scene.exits, ballots: vd.ballots, extra: { shares: pv.shares, bottom: pv.bottom } };
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
        extra: { secret: sec.id, pop: { [sec.partner]: { approval: 1.5, fame: 2 }, [sec.who]: { approval: -2.5, fame: 2 } } } }));
    }
    return { events: [...events, ...arrivals(state, ctx, ctx.entry.arrivals?.bombshell || 0)], exits: [], ballots: [] };
  },
  'semi-final': (state, ctx) => {
    // Nobody goes to the final alone: anyone still single leaves, and the
    // public trims the couples down to four.
    const singles = state.villa.filter(n => !partnerOf(state, n));
    const over = state.couples.length - FINAL_COUPLES;
    const pv = over > 0 ? publicVote(state, { rng: ctx.rng, bottom: over }) : null;
    const dumped = [...singles, ...(pv ? pv.bottom.flat() : [])];
    if (!dumped.length) return { events: [], exits: [], ballots: [] };
    const scene = dumpingScene(state, ctx.rng, { atRisk: pv?.bottom || [], dumped, channel: 'public' });
    return { events: scene.events, exits: scene.exits, ballots: [],
      extra: { shares: pv?.shares || null, bottom: pv?.bottom || null } };
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

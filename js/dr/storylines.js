// ══════════════════════════════════════════════════════════════════════
// dr/storylines.js — the season's arcs
// ══════════════════════════════════════════════════════════════════════
//
// An arc WANTS things, and what it wants reaches the week through exactly one
// door: `storylineNeed` feeds `hostBend`, which is bounded. Nothing in this
// file can send anybody home or hand anybody a win. It can lean, and the
// screen shows the lean beside the panel's own ranking — which is the entire
// reason "robbed" can exist as a thing the audience sees rather than a thing
// the engine asserts.
//
// The catalogue of fifteen families lives in js/dr/arcs.js; this file acts on
// it. Agendas are cast at the start, at most one per queen. Labels layer freely
// on top, because a real edit calls the same person a front-runner AND a
// fashion queen.
//
// Three families are EARNED and can never be cast: Performance is somebody who
// has actually survived two lip syncs, Robbed is somebody the host has actually
// bent down twice, and Shock is an elimination nobody saw coming. A season that
// hands those out at episode one decided its story before anybody performed.
import { craftMean, dragOf } from './queen.js';
import { ARC_FAMILIES, FAMILIES, isAgenda, pickVariant } from './arcs.js';

// The engine's arc ids ARE the family ids: js/dr/arcs.js is the catalogue and
// this file is what acts on it. Kept as an export because screens and tests
// read it, and because a flat list is the thing a guard wants to check against.
export const ARCS = FAMILIES;

/** At most one agenda per queen: two would double-count her in the bend. */
export function agendaHolders(storylines) {
  const held = new Set();
  for (const s of storylines) if (s.alive && isAgenda(s.arc)) for (const n of s.players) held.add(n);
  return held;
}

const VILLAINOUS = new Set(['villain', 'mastermind', 'schemer']);
/**
 * What being robbed actually is.
 *
 * NOT a count of rank places, which is what this used to be and which was
 * unreachable: the bend is deliberately gentle — `maxMove * BEND_STRENGTH` is
 * 1.0 and the bend itself is capped at 1.0 — so the host displaces a queen by
 * at most ONE place, ever. Measured over 3,249 placements: 90.9% did not move,
 * 4.6% moved up one, 4.6% moved down one, and nobody moved two. A threshold of
 * two places could never fire, and `robbed` was a dead arc for that reason.
 *
 * It was also the wrong measure. Being robbed is not "the host moved me two
 * slots" — it is "the panel loved me and he did not give it to me", which is a
 * fact about the CALL rather than about the ranking. So: topped the panel and
 * did not win, or the panel had her in its top three and she got no call at
 * all. Both are things an audience would shout at the screen about, and both
 * are visible on the track record chart the community actually reads.
 */
const SNUB_TOP = 3;
/** Surviving this many lip syncs makes you the one they send in to fight. */
const FIGHTS = 2;

/** The facts a variant test can read about a queen, as things stand now. */
function factsFor(name, cast, state, extra = {}) {
  const player = (cast || []).find(p => p && p.name === name) || null;
  const rec = state.record?.[name] || [];
  return {
    player,
    star: state.star?.[name] ?? 5,
    wins: rec.filter(r => r === 'WIN').length,
    highs: rec.filter(r => r === 'HIGH').length,
    safes: rec.filter(r => r === 'SAFE').length,
    fights: (state.lipsyncRecord?.[name] || []).filter(r => r === 'W').length,
    pop: state.popularity?.[name] ?? 0,
    finalist: (state.living || []).includes(name),
    ...extra,
  };
}

/**
 * Whether a label family applies to this queen at all.
 *
 * Labels are descriptions, so each has a threshold. Not everybody is a fashion
 * queen, and calling everybody one would make the word useless — the point of
 * a label is that it distinguishes her from the room.
 */
function labelFor(family, p, state) {
  const d = dragOf(p);
  const stat = k => {
    const n = Number(p?.stats?.[k]);
    return Number.isFinite(n) ? n : 5;
  };
  const facts = factsFor(p.name, [p], state);
  switch (family) {
    case 'fashion':
      // Either she is genuinely a look queen, or the aesthetic IS her act —
      // and in that case she still has to be able to walk.
      if (d.runway >= 8 || (['fashion', 'club-kid', 'art'].includes(d.style) && d.runway >= 6)) {
        return pickVariant('fashion', facts);
      }
      return null;
    case 'narrator':
      // The one the confessionals go to. Measured at three ORs this fired for
      // two thirds of a thirteen-queen cast, which makes the word useless: a
      // label has to distinguish her from the room. Now it wants a genuinely
      // outsized personality — a real comic, or somebody unusually loud AND
      // unguarded.
      if (d.comedy >= 9 || (stat('social') >= 8 && stat('temperament') <= 4)) {
        return pickVariant('narrator', facts);
      }
      return null;
    case 'pageant':
      if (d.style === 'pageant' || (d.runway >= 7 && d.design >= 7)) {
        return pickVariant('pageant', facts);
      }
      return null;
    case 'representation':
      // A story off the stage, which is loyalty to where she came from rather
      // than any craft stat — and somebody willing to talk about it.
      if (stat('loyalty') >= 8 && stat('social') >= 5) {
        return pickVariant('representation', facts);
      }
      return null;
    default:
      return null;
  }
}

/** Name the flavour of an arc from what is known right now. */
function resolveVariant(s, cast, state, extra = {}) {
  const v = pickVariant(s.arc, factsFor(s.players[0], cast, state, {
    beats: s.beats, pairBond: s.pairBond ?? 0, ...extra,
  }));
  if (v) {
    s.variantId = v.id;
    s.variantName = v.name;
  }
  return s;
}

export function assignStorylines({ cast, state, bond, rng }) {
  const names = cast.map(p => p.name);
  const star = n => state.star?.[n] ?? 5;
  const out = [];
  let seq = 0;
  // ONE SOLO AGENDA PER QUEEN. Two of them on the same person would count her
  // twice in the bend, which is the difference between a lean and a shove.
  // Cast order is priority order, so the front-runner is decided before the
  // villain and a queen can only be one of them.
  //
  // PAIR ARCS ARE EXEMPT, and that is not a loophole. A relationship arc is
  // about the pair rather than the person, and the villain is usually half the
  // season's rivalry — the user's own taxonomy files them under one family. So
  // blocking a rivalry because one of them is already the villain would throw
  // away the most natural story in the room. The pair arc asks for the least of
  // any agenda (0.15 against the front-runner's 0.5) and every want is clamped,
  // so the villain-in-a-rivalry is slightly better protected and nothing more.
  const spoken = new Set();
  const add = (arc, players, extra = {}) => {
    const solo = isAgenda(arc) && players.length === 1;
    if (solo && players.some(n => spoken.has(n))) return null;
    if (solo) for (const n of players) spoken.add(n);
    const s2 = {
      id: `${arc}-${++seq}`, arc, players, since: 1, beats: [], alive: true,
      variantId: null, variantName: null, ...extra,
    };
    out.push(s2);
    return s2;
  };

  /* Presence, not craft: the queen the edit would follow is the one who is
     both good and watchable, which is what star power is for.

     THIS IS A PREDICTION AND ONLY A PREDICTION. It is cast before anybody has
     performed, so it is the edit's guess at who the season is about, and the
     season is allowed to disagree with it -- `recordBeat` moves the arc when
     somebody else is plainly winning instead. Without that the label sat on
     whoever had the best stat line on day one for fourteen episodes while
     another queen won four maxis, which is not a front-runner, it is a
     forecast nobody updated. */
  const byPresence = [...cast].sort((a, b) =>
    (craftMean(b) * star(b.name)) - (craftMean(a) * star(a.name)));
  add('frontrunner', [byPresence[0].name]);

  // Low star, middling craft: somebody the room is not watching yet.
  const under = [...cast].filter(p => p.name !== byPresence[0].name)
    .sort((a, b) => (star(a.name) - craftMean(a) * 0.3) - (star(b.name) - craftMean(b) * 0.3))[0];
  if (under) add('underdog', [under.name]);

  const villain = [...cast].filter(p => VILLAINOUS.has(p.archetype))
    .sort((a, b) => (Number(b.stats?.boldness) || 5) - (Number(a.stats?.boldness) || 5))[0];
  if (villain) add('villain', [villain.name]);

  // The worst pair and the best pair in the room. The rivalry tie-breaks on
  // star power, because two queens nobody is watching is not a rivalry.
  let worst = null;
  let best = null;
  for (let i = 0; i < names.length; i++) {
    for (let j = i + 1; j < names.length; j++) {
      const a = names[i];
      const b = names[j];
      const v = bond(a, b);
      const heat = star(a) + star(b);
      if (v <= -5 && (!worst || v < worst.v || (v === worst.v && heat > worst.heat))) {
        worst = { a, b, v, heat };
      }
      if (v >= 5 && (!best || v > best.v)) best = { a, b, v };
    }
  }
  // Both pairs are the RELATIONSHIP family; the variant is what kind. A
  // rivalry and a friendship want opposite things from the same machinery, so
  // the variant carries the difference rather than two near-identical arcs.
  if (worst) add('relationship', [worst.a, worst.b].sort(), { pairBond: worst.v });
  if (best) add('relationship', [best.a, best.b].sort(), { pairBond: best.v });

  // Labels layer on top, because a real edit calls the same queen a
  // front-runner AND a fashion queen. Only agendas are exclusive.
  for (const p of cast) {
    for (const family of ['fashion', 'narrator', 'pageant', 'representation']) {
      const fam = labelFor(family, p, state);
      if (fam) add(family, [p.name], { variantId: fam.id, variantName: fam.name });
    }
  }

  // Every arc gets its flavour named now; recordBeat re-reads it as the season
  // gives it more to go on.
  for (const s of out) resolveVariant(s, cast, state);

  void rng;
  return out;
}

/** What each arc wants this week, as a bend input in [-1, 1]. */
export function storylineNeed(storylines, { living, episode, totalEpisodes, state }) {
  const need = Object.fromEntries(living.map(n => [n, 0]));
  const phase = totalEpisodes > 1 ? (episode - 1) / (totalEpisodes - 1) : 0;
  const bump = (n, v) => {
    if (n in need) need[n] = Math.max(-1, Math.min(1, need[n] + v));
  };

  for (const s of storylines) {
    if (!s.alive) continue;
    const [a, b] = s.players;
    switch (s.arc) {
      case 'frontrunner':
        // Up early, then one stumble in the middle third — and only one, so a
        // frontrunner who has already wobbled is not shoved again.
        if (phase < 0.35) bump(a, 0.5);
        else if (phase < 0.65 && !s.beats.some(x => x.kind === 'stumble')) bump(a, -0.35);
        break;
      case 'underdog': {
        // A win around 60% of the way in. The pressure falls away once she has
        // one, because the arc was never "keep winning" — it was "arrive".
        const won = (state.record?.[a] || []).includes('WIN');
        if (!won) bump(a, Math.max(0, 1 - Math.abs(phase - 0.6) * 3) * 0.7);
        break;
      }
      case 'villain':
        // Kept in the room while she is useful, and not protected after that.
        if (phase < 0.7) bump(a, 0.25);
        else bump(a, -0.2);
        break;
      case 'performance':
        // The one they send in to fight. The bend gives her the benefit of a
        // toss-up, because the audience expects her to survive one.
        bump(a, 0.4);
        break;
      case 'relationship':
        if (s.variantId === 'rivalry') {
          // Both in the same conversation: leaning both slightly up makes a
          // shared call likelier than one high and the other gone.
          bump(a, 0.15);
          bump(b, 0.15);
        } else if (phase < 0.75) {
          // Friends kept out of a lip sync against each other, until late —
          // when the show stops protecting anybody from that.
          bump(a, 0.1);
          bump(b, 0.1);
        }
        break;
      case 'redemption':
        bump(a, 0.3);
        break;
      default:
        // EVERY LABEL LANDS HERE AND ASKS FOR NOTHING. Robbed, fashion,
        // narrator, pageant, filler, weakness, representation, hero, shock:
        // descriptions of what she is, never requests. Fifteen families all
        // lobbying the bend would be fifteen thumbs on the scale, and the
        // season would stop being a contest.
        break;
    }
  }
  return need;
}

/* How well a record reads, for the front-runner comparison only.
   A LOCAL COPY OF THE IDEA IN `recordStrength`, deliberately: js/dr/season.js
   imports this file, so importing it back would be a cycle. It is used as a
   TIE-BREAK behind the win count and never as the decision, so the two
   drifting apart cannot change who the season says is in front. */
const RANK_POINTS = { WIN: 4, HIGH: 2, SAFE: 0, LOW: -1, BTM: -2, BTM2: -2, ELIM: -3 };
function recordRank(record = []) {
  const rated = (record || []).filter(r => r in RANK_POINTS);
  if (!rated.length) return 0;
  return rated.reduce((n, r) => n + RANK_POINTS[r], 0) / rated.length;
}

export function recordBeat(storylines, { episode, row, state, cast = null }) {
  const call = row.dr?.call || { win: [], high: [], low: [], bottom: [] };
  const bend = row.dr?.bend || [];
  const events = row.dr?.events || [];
  // Who gave something away this week. `hero`'s congeniality variant reads it,
  // and nothing else was counting it.
  const helps = (state._drHelps ||= {});
  for (const e of events) {
    if (e.type === 'help' && e.players?.[0]) helps[e.players[0]] = (helps[e.players[0]] || 0) + 1;
  }
  const out = storylines.map(s => ({ ...s, beats: [...s.beats], players: [...s.players] }));
  const find = arc => out.find(s => s.arc === arc);
  const beat = (s, kind, data = {}) => s.beats.push({ episode, kind, ...data });
  const inCall = n => [...(call.win || []), ...(call.high || []),
    ...(call.low || []), ...(call.atRisk || []), ...(call.bottom || [])].includes(n);

  /* ══ THE RECHECK ═══════════════════════════════════════════════════
     Every arc is re-asked, every week: IS THIS STILL TRUE?

     All of them were cast in episode one from stats and bonds — a forecast of
     the season the room looked capable of — and then never revisited. So the
     front-runner was whoever had the best stat line on day one, the underdog
     was still an underdog after winning four maxis, and a rivalry stayed a
     rivalry after the two of them made up in the werk room. The labels were
     true at cast and drifted for fourteen episodes, which is worse than
     having none: a screen that says "front-runner" beside a queen in the
     bottom two is actively lying to the reader.

     A label that stops being true either MOVES or is CLOSED, and it keeps its
     beats when it goes — the early favourite who fades is a story, not a
     mistake to hide.

     ── HOW MANY FRONT-RUNNERS ─────────────────────────────────────────
     More than one, and never more than THREE. A season does have two or three
     queens the edit is openly following by the merge, and forcing a single
     one made every other winner invisible. But four of fourteen is not a
     front-runner, it is a quarter of the cast wearing the label, and a word
     that describes a quarter of the room has stopped describing anybody.
     Three regardless of the finale's size: a top four still only has a
     handful the season is actually about, and the crown is decided on the
     night rather than by who was being followed. */
  const winsOf = n => (state.record?.[n] || []).filter(r => r === 'WIN').length;
  const recentWin = n => (state.record?.[n] || []).slice(-3).includes('WIN');
  const living = [...(state.living || [])];
  const topWins = living.length ? Math.max(...living.map(winsOf)) : 0;
  const FRONT_CAP = 3;

  /* Who reads as a front-runner tonight: two wins, or one win and level with
     the best in the room. A queen with no win is never one of them however
     good her stat line looked in episode one. */
  const isAhead = n => winsOf(n) >= 2 || (winsOf(n) >= 1 && winsOf(n) >= topWins);
  /* And who has stopped being one: two clear wins off the pace AND nothing in
     the last three weeks. Either alone is a bad month, not a fall. */
  const hasFallen = n => (topWins - winsOf(n)) >= 2 && !recentWin(n);

  /* ── A FLIPPED ARC IS STILL AN ARC SHE IS HOLDING ──
     This excluded `flipped`, and the exclusion looked reasonable: an
     overtaken favourite's story is over, so why should it block a new one.
     Because it does not stop being HERS. A flipped arc stays alive on
     purpose — it is what happened, and the screens read it — so the moment
     she was ahead again the block below opened a second frontrunner arc on
     top of the first, and the week after that a third. Measured on a played
     season: one queen holding five live solo agendas, every one of them
     counted separately in the host's bend.
     A queen who loses the lead and takes it back has ONE front-runner story
     with a comeback in the middle of it, which is also the better story. */
  const heldAgenda = () => new Set(out
    .filter(x => isAgenda(x.arc) && x.players.length === 1 && x.alive)
    .map(x => x.players[0]));

  const openArc = (arc, name, kind, extra = {}) => {
    out.push({
      id: `${arc}-${episode}-${name}`, arc, players: [name], since: episode,
      alive: true, variantId: null, variantName: null,
      beats: [{ episode, kind, ...extra }],
    });
  };

  for (const s of out) {
    const [a, b] = s.players;
    if (s.arc === 'frontrunner' && !s.flipped) {
      /* A RESOLVED ARC STOPS ACCRUING. Once she has been overtaken this story
         has ended, and a win afterwards belongs to the new arc the top-up
         pass gives her rather than to the one that already said she fell
         behind — otherwise the last thing written on a closed story is a beat
         from after it closed. */
      if ((call.win || []).includes(a)) beat(s, 'win');
      if ((call.bottom || []).includes(a)) beat(s, 'stumble');
      // She is not in front any more. The arc closes as a fade rather than
      // being deleted, because the fade is the interesting part.
      if (s.alive && !s.flipped && living.includes(a) && hasFallen(a)) {
        s.flipped = 'overtaken';
        /* THE COUNTS AT THE MOMENT, not at the end of the season. The rule is
           about the margin WHEN the label moves, and the only way to check it
           afterwards was to compare final win totals — which is a different
           statement, and a false one: a resolved arc stops accruing beats but
           she keeps competing, so a queen overtaken in week six with two wins
           to the new leader's three can finish on four and make a correct
           handover look like a broken one. It did: `expected 2 to be greater
           than or equal to 4`, on a season where nothing was wrong.
           Written on the beat, so the guard can ask the question the rule
           actually answers. */
        beat(s, 'overtaken', {
          by: living.filter(n => winsOf(n) === topWins)[0] || null,
          byWins: topWins, wins: winsOf(a),
        });
      }
    }
    if (s.arc === 'underdog') {
      if ((call.win || []).includes(a)) beat(s, 'breakthrough');
      /* AN UNDERDOG WHO IS WINNING IS NOT AN UNDERDOG. It is the arc paying
         off — the best thing that can happen to one — so it closes as
         `arrived` and the front-runner pass below is free to pick her up. */
      if (s.alive && !s.flipped && living.includes(a) && winsOf(a) >= 2) {
        s.flipped = 'arrived';
        beat(s, 'arrived');
      }
    }
    if (s.arc === 'villain') {
      // Redemption has to cost her something and be seen: she helped somebody
      // AND the panel put her up. Either alone is just a good week.
      const helped = events.some(e => e.type === 'help' && e.players?.[0] === a);
      const up = (call.win || []).includes(a) || (call.high || []).includes(a);
      if (helped && up) {
        s.flipped = 'redeemed';
        beat(s, 'redemption');
      } else {
        const bad = events.find(e =>
          ['sabotage', 'stole-a-bit', 'spotlight-hog', 'dump'].includes(e.type)
          && e.players?.[0] === a);
        if (bad) beat(s, 'villainy', { event: bad.type });
      }
    }
    if (s.arc === 'rivalry' && a && b && inCall(a) && inCall(b)) beat(s, 'collision');
    /* A RELATIONSHIP IS THE ONE ARC ITS OWN SUBJECT CAN END. It was cast off
       the bond in episode one and bonds move all season: two queens who made
       up in the werk room were still carrying a rivalry, and a friendship
       that curdled was still a friendship. The pair's live bond is on the row
       (`dr.bonds`), which is the same number every other screen reads. */
    if (s.arc === 'relationship' && a && b && s.alive && !s.flipped
        && living.includes(a) && living.includes(b)) {
      /* MEASURED AGAINST WHERE IT STARTED, not against zero. A rivalry cast
         at -8 that is now -3 has thawed by five points and is no longer the
         story it was, and waiting for it to cross into positive would mean
         waiting for something the engine almost never does. The absolute
         crossing still counts when it happens.
         `bonds` on the row lists only pairs at |v| >= 2, so a pair that is
         absent while both are still in the room has a bond near zero — which
         for a rivalry cast at -8 is the whole point. */
      const pair = (row.dr?.bonds || [])
        .find(([x, y]) => (x === a && y === b) || (x === b && y === a));
      const now = pair ? pair[2] : 0;
      const was = s.pairBond ?? 0;
      const wasRivalry = was <= -5;
      if (wasRivalry && (now >= 2 || now - was >= 5)) {
        s.flipped = 'reconciled';
        beat(s, 'made-up', { bond: now, from: was });
      }
      if (!wasRivalry && (now <= -4 || was - now >= 5)) {
        s.flipped = 'fallen-out';
        beat(s, 'fell-out', { bond: now, from: was });
      }
    }
    if (s.arc === 'sisters' && (call.bottom || []).includes(a) && (call.bottom || []).includes(b)) {
      beat(s, 'sisters-in-the-bottom');
    }
    // An arc whose people are gone is over. The beats stay: a dead arc is
    // still what happened, and the screens read it.
    if (s.players.some(n => (state.out || []).includes(n))) s.alive = false;
  }

  /* ── AND WHO IS IN FRONT NOW ──────────────────────────────────────
     Run after the loop above, so a queen whose underdog arc just closed as
     `arrived` is eligible tonight rather than next week. Up to the cap, best
     record first, and never onto a queen who already has a story of her own:
     a villain who is winning is a villain having a good season, and giving
     her a second agenda would count her twice in the host's bend. */
  {
    const held = heldAgenda();
    const already = new Set(out
      .filter(x => x.arc === 'frontrunner' && x.alive && !x.flipped).map(x => x.players[0]));
    /* SHE TAKES HER OWN STORY BACK. Before anybody new is considered, a
       queen whose front-runner arc was flipped and who is ahead again revives
       it rather than starting a second one. */
    for (const s of out) {
      if (s.arc !== 'frontrunner' || !s.alive || s.flipped !== 'overtaken') continue;
      const n = s.players[0];
      if (!living.includes(n) || !isAhead(n)) continue;
      s.flipped = null;
      beat(s, 'retook', {});
      already.add(n);
    }

    const room = FRONT_CAP - already.size;
    if (room > 0) {
      const candidates = living
        .filter(n => !already.has(n) && !held.has(n) && isAhead(n))
        .sort((x, y) => (winsOf(y) - winsOf(x)) || (recordRank(state.record?.[y]) - recordRank(state.record?.[x])));
      for (const n of candidates.slice(0, room)) openArc('frontrunner', n, 'took-over');
    }
  }

  /* Earned, never assigned: two lip syncs survived.

     AND SUBJECT TO THE SAME EXCLUSIVITY AS THE CAST ONES. `assignStorylines`
     enforces one solo agenda per queen at cast time, and states why: two of
     them on the same person counts her twice in the host's bend, which is the
     difference between a lean and a shove. This block pushed straight past
     that, so a villain who survived two lip syncs quietly became a villain
     AND a fighter and was weighted as both. Measured: 2 seasons in 20 had a
     queen holding two live agendas, every one of them `performance` on top of
     something else.

     She keeps the arc she already has, because it has beats behind it and
     this one would be starting from nothing. */
  if (!find('performance')) {
    const held = heldAgenda();
    const fighter = Object.entries(state.lipsyncRecord || {})
      .find(([n, r]) => (r || []).filter(x => x === 'W').length >= FIGHTS && !held.has(n));
    if (fighter) {
      out.push({
        id: 'performance-1', arc: 'performance', players: [fighter[0]], since: episode,
        beats: [{ episode, kind: 'earned' }], alive: true,
        variantId: null, variantName: null,
      });
    }
  }

  // Earned: snubbed twice. The count lives on `state` rather than here because
  // it has to survive a save.
  const downs = (state._drBendDowns ||= {});
  const won = new Set(call.win || []);
  const called = new Set([...(call.win || []), ...(call.high || []),
    ...(call.low || []), ...(call.atRisk || []), ...(call.bottom || [])]);
  for (const x of bend) {
    const toppedAndLost = x.panelRank === 1 && !won.has(x.name);
    const lovedAndIgnored = x.panelRank <= SNUB_TOP && !called.has(x.name);
    if (toppedAndLost || lovedAndIgnored) downs[x.name] = (downs[x.name] || 0) + 1;
  }
  if (!find('robbed')) {
    const robbed = Object.entries(downs).find(([, c]) => c >= 2);
    if (robbed) {
      out.push({
        id: 'robbed-1', arc: 'robbed', players: [robbed[0]], since: episode,
        beats: [{ episode, kind: 'earned' }], alive: true,
        variantId: null, variantName: null,
      });
    }
  }

  // ── EARNED LABELS ─────────────────────────────────────────────────
  //
  // The split that matters: fashion, pageant, narrator and representation are
  // who she IS and are cast at the start. Hero, weakness and filler are what
  // HAPPENED and cannot be known then — a queen is not a filler queen until
  // the season has failed to give her anything to do.
  const seasonSoFar = Object.keys(state.record || {});
  const already = f => out.some(s2 => s2.arc === f && s2.players.includes(f._n));
  for (const n of seasonSoFar) {
    if ((state.out || []).includes(n) && !(state.living || []).includes(n)) {
      // She has gone; her labels are whatever she earned before leaving.
    }
    const rec = state.record[n] || [];
    if (rec.length < 3) continue;
    const has = f => out.some(s2 => s2.arc === f && s2.players.includes(n));
    const helpCount = helps[n] || 0;
    const pop = state.popularity?.[n] ?? 0;
    const safes = rec.filter(r => r === 'SAFE').length;
    const lows = rec.filter(r => r === 'LOW' || r === 'BTM').length;

    // The room's favourite: she gave more than she took.
    if (!has('hero') && (helpCount >= 2 || pop >= 8)) {
      out.push({
        id: `hero-${n}`, arc: 'hero', players: [n], since: episode,
        beats: [{ episode, kind: 'earned' }], alive: true, variantId: null, variantName: null,
      });
    }
    // A season of being in trouble without ever being sent home.
    if (!has('weakness') && lows >= 3) {
      out.push({
        id: `weakness-${n}`, arc: 'weakness', players: [n], since: episode,
        beats: [{ episode, kind: 'earned' }], alive: true, variantId: null, variantName: null,
      });
    }
    // Nothing has ever happened to her. This is the hardest edit to write and
    // the most common one on television.
    if (!has('filler') && safes >= 4 && rec.filter(r => r === 'WIN' || r === 'HIGH').length === 0) {
      out.push({
        id: `filler-${n}`, arc: 'filler', players: [n], since: episode,
        beats: [{ episode, kind: 'earned' }], alive: true, variantId: null, variantName: null,
      });
    }
  }
  void already;

  // Re-read every flavour. A front-runner who has now won three times is a
  // Challenge Beast and was not one in episode two: the variant is a reading of
  // the season so far, so it is taken again every week rather than stamped once.
  //
  // THE ROSTER HAS TO BE THE REAL PLAYERS. Rebuilding it from the record's keys
  // gives objects with a name and nothing else, so `dragOf` returns fives for
  // everybody and every style test silently fails — measured, that collapsed
  // `fashion` to look-queen 4.55 times out of 4.55 and made ten variants
  // unreachable. A caller that passes no cast keeps the old flavour rather than
  // overwriting it with one read off a blank queen.
  const roster = cast || state.cast || null;
  if (roster) {
    // Facts a variant test needs that only this moment knows. `phase` is how
    // far through the season we are — a Winner's Edit is not a thing you can
    // be in episode two, by definition. `hasRival` is whether she is actually
    // in the season's rivalry, which is what separates a Rivalry Arc villain
    // from a plain one.
    const phase = state._drPhase ?? 0;
    const inRivalry = new Set(out
      .filter(s2 => s2.arc === 'relationship' && s2.variantId === 'rivalry')
      .flatMap(s2 => s2.players));
    for (const s2 of out) {
      resolveVariant(s2, roster, state, {
        phase, hasRival: inRivalry.has(s2.players[0]),
      });
    }
  }

  return out;
}

/**
 * The fan ledger, as a row can keep it.
 *
 * Beside `arcSummary` because it is the same job: `state` is ONE OBJECT for
 * the whole season and both of these are read per episode, so a row that
 * keeps the reference shows the finale's numbers on episode two and looks
 * perfectly correct on the last row, which is the row anybody checks.
 *
 * There are FOUR places that build a drag row -- an ordinary week, a
 * smackdown, the finale and the reunion -- and the first version of this was
 * written into one of them. That is the shape of this project's oldest
 * recurring bug (docs/ADDING-A-SHOW.md, and the `episodeHistory.push` note in
 * CLAUDE.md), so it is a function and not four copies of an expression.
 */
export function popSnapshot(state) {
  return Object.fromEntries(Object.entries((state && state.popularity) || {})
    .map(([n, v]) => [n, Math.round(v * 10) / 10]));
}

export function arcSummary(storylines) {
  return storylines.map(s => ({
    arc: s.arc, players: [...s.players], beats: s.beats.length,
    alive: !!s.alive, flipped: s.flipped || null,
    /* THE NAMED VERSION OF THE ARC, which the season document reads as
       `s.variantName || s.arc` and which this dropped -- so every episode
       exported the generic word and only the reunion, which kept the live
       objects, carried the specific one. Cheap to keep and it is what the
       arc is actually called. */
    variantName: s.variantName || null,
  }));
}

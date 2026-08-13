// ══════════════════════════════════════════════════════════════════════
// bb-events/hacker.js — three crimes, no suspect
// ══════════════════════════════════════════════════════════════════════
//
// The Hacker is the second twist in this house to get an event family of its
// own, and it needs one more than the first did. An Invisible HOH commits a
// single anonymous act on a single night. The Hacker commits THREE, on three
// different nights, and each leaves a different kind of witness:
//
//   the block hack   somebody came off, somebody went up, nobody signed it
//   the draw hack    a name walked into the veto that no chip accounts for
//   the vote hack    the count came up one short, in front of everybody
//
// So the room is not solving one mystery, it is solving three, and the three
// point in different directions. That is the whole reason a wrong answer is
// so easy here: every hack has an obvious beneficiary, and the obvious
// beneficiary is usually not the person who did it.
//
// Rules of the family, inherited from invisible.js: every event is gated on
// ctx.week.hacker existing; the text may show the real hacker DOING things —
// speculating, deflecting, sitting very still — but may never narrate them as
// the hacker; and every guess, right or wrong, carries consequences, because
// the misattribution IS the twist.
import { gs } from '../core.js';
import { pronouns } from '../players.js';
import {
  pStats, band, perceived, furthestFrom, closestTo, isVillainous,
} from './_read.js';

function _variant(list, ctx, ...salt) {
  const key = `${ctx?.week?.num || 0}|${ctx?.beat || 0}|${ctx?.act || ''}|${salt.join('|')}`;
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return list[hash % list.length];
}
function _pick(list, ctx, ...salt) {
  if (!list.length) return null;
  const key = `${ctx?.week?.num || 0}|${salt.join('|')}`;
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return list[hash % list.length];
}

const _others = (house, ...exclude) => house.filter(n => n && !exclude.includes(n));
const _hacked = ctx => ctx?.week?.hacker || null;
const _truth = ctx => ctx?.week?.hacker?.winner || null;   // casting only — never narrated
const _blockHack = ctx => ctx?.week?.hacker?.blockHack || null;
const _vetoHack = ctx => ctx?.week?.hacker?.vetoHack || null;
const _nominees = ctx => (ctx?.nominees || ctx?.week?.finalNominees || ctx?.week?.initialNominees || []).filter(Boolean);
const _hoh = ctx => (ctx?.week?.hohSecret ? null : (ctx?.hoh || ctx?.week?.hoh)) || null;

// Casting helpers shared by weight() and fire(). The scheduler treats a
// positive weight as a promise that the event WILL produce a beat — a null
// return after being picked throws — so every name fire() needs has to be
// proved available inside weight() first, using exactly the same call.
const _benefitCast = (house, ctx) => {
  const saved = _blockHack(ctx)?.down;
  if (!saved || !house.includes(saved)) return null;
  const reader = _others(house, saved).sort((a, b) => pStats(b).strategic - pStats(a).strategic)[0];
  return reader ? { saved, reader } : null;
};
const _huntCast = (house, ctx) => {
  const victim = _blockHack(ctx)?.up;
  if (!victim || !house.includes(victim)) return null;
  const entry = (ctx.week?.hackerGuesses || []).find(g => g.who === victim
    && house.includes(g.guess) && g.guess !== victim);
  return entry ? { victim, entry } : null;
};
const _disownCast = (house, ctx) => {
  const hoh = _hoh(ctx);
  const victim = _blockHack(ctx)?.up;
  return (hoh && victim && house.includes(hoh) && house.includes(victim) && hoh !== victim)
    ? { hoh, victim } : null;
};
const _seatCast = (house, ctx) => {
  const picked = _vetoHack(ctx)?.pick;
  if (!picked || !house.includes(picked)) return null;
  const watcher = _others(house, picked).sort((a, b) => pStats(b).intuition - pStats(a).intuition)[0];
  return watcher ? { picked, watcher } : null;
};
const _tableCast = (house, ctx) => {
  const pool = _others(house, ..._nominees(ctx));
  if (pool.length < 3) return null;
  const talkers = pool.slice(0, 4);
  const accused = _pick(pool.filter(n => !talkers.slice(0, 2).includes(n))
    .sort((a, b) => (perceived(talkers[0], a) ?? 0) - (perceived(talkers[0], b) ?? 0)).slice(0, 2),
  ctx, 'table');
  return accused ? { talkers, accused } : null;
};
const _alibiCast = (house, ctx) => {
  const pool = _others(house, ..._nominees(ctx));
  const a = _pick(pool, ctx, 'alibi-a');
  if (!a) return null;
  const b = closestTo(a, pool.filter(n => n !== a));
  return b ? { a, b } : null;
};
const _liarCast = (house, ctx) => {
  const pool = _others(house, ..._nominees(ctx)).filter(n => n !== _truth(ctx)
    && isVillainous(n) && pStats(n).boldness >= 6);
  const liar = _pick(pool, ctx, 'liar');
  if (!liar) return null;
  const audience = _pick(_others(house, liar, ..._nominees(ctx)), ctx, 'audience');
  return audience ? { liar, audience } : null;
};
const _performCast = (house, ctx) => {
  const truth = _truth(ctx);
  if (!truth || !house.includes(truth)) return null;
  const watcher = _others(house, truth, ..._nominees(ctx))
    .sort((a, b) => pStats(b).intuition - pStats(a).intuition)[0];
  return watcher ? { truth, watcher } : null;
};

/** Last week's record, for the consequences that outlive the week they happened in. */
function _lastWeek(ctx) {
  const weeks = gs?.bb?.weeks || [];
  const now = ctx?.week?.num || 0;
  for (let i = weeks.length - 1; i >= 0; i--) {
    const w = weeks[i];
    if (w && w.num < now && now - w.num <= 1 && w.hacker) return w;
  }
  return null;
}

const _missingCast = (house, ctx) => {
  const silenced = _lastWeek(ctx)?.hackerVote?.voter;
  if (!silenced || !house.includes(silenced)) return null;
  const counter = _others(house, silenced).sort((a, b) => pStats(b).mental - pStats(a).mental)[0];
  if (!counter) return null;
  const accused = furthestFrom(counter, _others(house, counter, silenced)) || silenced;
  return { silenced, counter, accused };
};
const _silencedCast = (house, ctx) => {
  const silenced = _lastWeek(ctx)?.hackerVote?.voter;
  if (!silenced || !house.includes(silenced)) return null;
  const confidant = closestTo(silenced, _others(house, silenced));
  return confidant ? { silenced, confidant } : null;
};

// ══════════════════════════════════════════════════════════════════════
// THE BLOCK HACK — somebody came off, somebody went up
// ══════════════════════════════════════════════════════════════════════

// ── who benefits ──────────────────────────────────────────────────────
//
// The sharpest read in the house is also the most dangerous one, because it is
// correct in form and wrong in fact: the person who came off the block is the
// person who gained, so the house turns on them. Unless the hacker saved
// themselves, that is an innocent taking the whole week's suspicion.
const benefitMath = {
  id: 'hacker-benefit-math',
  category: 'social',
  weight(house, ctx) {
    if (!_hacked(ctx) || ctx.act !== 'house') return 0;
    return _benefitCast(house, ctx) ? band(10, 14) : 0;
  },
  fire(house, ctx, api) {
    const cast = _benefitCast(house, ctx);
    if (!cast) return null;
    const { saved, reader } = cast;
    const rightForOnce = saved === _truth(ctx);
    const text = _variant([
      `${reader} does the only arithmetic available: one person walked off that block and did not have to campaign for it. "Work out who GAINED," ${reader} tells the kitchen, and every finger in the room rotates to point at ${saved}.`,
      `"Nobody hands out a favour like that for free." ${reader} lays it out — ${saved} came down, ${saved} owes somebody, or ${saved} did it themselves — and the second half of that sentence is the half the house keeps.`,
      `${reader} counts it on their fingers for anybody who will listen: the block changed, ${saved} is the reason it changed, and there is exactly one houseguest who benefits from pretending otherwise. ${saved} spends the afternoon being looked at.`,
      `The theory arrives fully formed and travels fast: ${saved} is the hacker, ${saved} saved ${pronouns(saved).ref}, and the whole anonymous business is a costume. ${rightForOnce ? `${saved} does not correct anybody.` : `${saved} did not do it, which turns out to be no defence at all.`}`,
    ], ctx, saved, reader);
    api.suspicion(reader, saved, 1.3);
    _others(house, saved, reader).slice(0, 2).forEach(n => api.suspicion(n, saved, 0.5));
    api.addBond(reader, saved, -0.5);
    try { api.remember(reader, saved, 'suspected-hacker', 1, { twist: 'bb-hacker', correct: rightForOnce }); } catch { /* texture */ }
    return { text, players: [reader, saved],
      badgeText: rightForOnce ? 'FOLLOW THE MONEY' : 'THE WRONG BENEFICIARY',
      badgeClass: rightForOnce ? 'gold' : 'red' };
  },
};

// ── the replacement hunts for a hand ──────────────────────────────────
const swappedInHunts = {
  id: 'hacker-swapped-in-hunts',
  category: 'social',
  weight(house, ctx) {
    if (!_hacked(ctx) || ctx.act !== 'house') return 0;
    return _huntCast(house, ctx) ? band(9, 13) : 0;
  },
  fire(house, ctx, api) {
    const cast = _huntCast(house, ctx);
    if (!cast) return null;
    const { victim, entry } = cast;
    const { guess, correct } = entry;
    const confidant = closestTo(victim, _others(house, victim, guess)) || null;
    const p = pronouns(victim);
    const text = _variant([
      `${victim} was not on that block an hour ago and is on it now, and the ceremony offered no name to be angry at. So ${p.sub} ${p.sub === 'they' ? 'pick' : 'picks'} one. ${confidant ? `${confidant} hears the entire case against ${guess}` : `The case against ${guess} gets built out loud`}, and it is built out of vibes and seating arrangements.`,
      `"Somebody in this house typed my name in." ${victim} says it to ${confidant || 'the room'} like a fact, then says ${guess}'s name like a second fact. Only one of those is one.`,
      `${victim} retraces the whole morning — who was missing, who came back quiet, who would not make eye contact — and the reconstruction lands on ${guess}. ${correct ? 'It happens to be right, and it will never be provable.' : 'It is wrong, and it will be treated as proven by tomorrow.'}`,
      `${victim} stops asking who did it and starts asking who to make pay for it, which is a much easier question. The answer is ${guess}.`,
    ], ctx, victim, guess);
    api.suspicion(victim, guess, 1.5);
    if (confidant) api.suspicion(confidant, guess, 0.5);
    api.addBond(victim, guess, -0.8);
    return { text, players: [victim, guess, confidant].filter(Boolean),
      badgeText: correct ? 'ON THE TRAIL' : 'A CONFIDENT WRONG ANSWER',
      badgeClass: correct ? 'gold' : 'red' };
  },
};

// ── the Head of Household defends a block that stopped being theirs ────
const hohDisowns = {
  id: 'hacker-hoh-disowns',
  category: 'ceremonies',
  weight(house, ctx) {
    if (!_hacked(ctx) || ctx.act !== 'house') return 0;
    return _disownCast(house, ctx) ? band(9, 13) : 0;
  },
  fire(house, ctx, api) {
    const cast = _disownCast(house, ctx);
    if (!cast) return null;
    const { hoh, victim } = cast;
    const p = pronouns(hoh);
    // A reign nobody believes is a reign that bought nothing.
    const believed = pStats(hoh).social >= 6 && perceived(victim, hoh) >= 0;
    const text = _variant([
      `"That was not me." ${hoh} has repeated it in every room with decreasing effect. ${victim} hears it again and ${believed ? 'mostly believes it, which still does not put ' + p.obj + ' back in charge of the block' : 'does not believe a word of it'}.`,
      `${hoh} spends the day explaining that the block on that wall is not the block ${p.sub} made. It is true, it is unprovable, and it makes ${p.obj} sound exactly like somebody covering for a move.`,
      `The one week ${hoh} had the power, somebody else used it. ${p.Sub} ${p.sub === 'they' ? 'try' : 'tries'} telling ${victim} so. ${believed ? `${victim} nods. ${victim} also stops treating ${hoh} as the person to negotiate with, because what would be the point.` : `${victim} hears an HOH disowning ${p.posAdj} own nominations, which is what an HOH would say either way.`}`,
      `${hoh} asks the room, genuinely, whether anybody actually saw ${p.obj} name ${victim}. Nobody did. Nobody can un-see the key on the wall either.`,
    ], ctx, hoh, victim);
    if (!believed) {
      api.addBond(victim, hoh, -0.6);
      try { api.remember(victim, hoh, 'renomination', 1, { twist: 'bb-hacker', disowned: true }); } catch { /* texture */ }
    }
    api.popDelta(hoh, believed ? 0 : -1);
    return { text, players: [hoh, victim],
      badgeText: believed ? 'A REIGN ON LOAN' : 'NOBODY BELIEVES THE KING',
      badgeClass: believed ? 'grey' : 'red' };
  },
};

// ══════════════════════════════════════════════════════════════════════
// THE DRAW HACK — the seat nobody drew a chip for
// ══════════════════════════════════════════════════════════════════════

const seatWitness = {
  id: 'hacker-seat-witness',
  category: 'social',
  weight(house, ctx) {
    if (!_hacked(ctx) || ctx.act !== 'house') return 0;
    return _seatCast(house, ctx) ? band(10, 14) : 0;
  },
  fire(house, ctx, api) {
    const cast = _seatCast(house, ctx);
    if (!cast) return null;
    const { picked, watcher } = cast;
    const selfPick = picked === _truth(ctx);
    const text = _variant([
      `The draw is the one hack the whole house watches happen. No chip, no name, no explanation — ${picked} simply walks into that veto competition. ${watcher} does not look at the bag. ${watcher} looks at ${picked}'s face.`,
      `"Who picked you?" It is the only question in the backyard, and ${picked} does not have an answer that helps. ${selfPick ? 'The true answer is standing in front of them.' : 'The true answer is somebody who never told ' + pronouns(picked).obj + ' either.'}`,
      `${picked} gets walked into the veto by a hand nobody can see, which the house immediately reads as a gift, which makes ${picked} somebody's ally — and everyone starts working out whose.`,
      `${watcher} points out the obvious to anybody nearby: ${picked} is now the only houseguest in this game we KNOW was chosen by the hacker. That is not proof of anything. It is the closest thing to evidence this week has produced.`,
    ], ctx, picked, watcher);
    api.suspicion(watcher, picked, selfPick ? 1.4 : 0.9);
    _others(house, picked, watcher).slice(0, 2).forEach(n => api.suspicion(n, picked, 0.4));
    // Being visibly favoured is screen time and a target at the same time.
    api.popDelta(picked, 1);
    return { text, players: [picked, watcher],
      badgeText: selfPick ? 'WALKED IN ALONE' : 'SOMEBODY WANTS THIS ONE PLAYING',
      badgeClass: selfPick ? 'gold' : 'blue' };
  },
};

// ══════════════════════════════════════════════════════════════════════
// THE VOTE HACK — the count that came up short (next week's problem)
// ══════════════════════════════════════════════════════════════════════

const missingVoteMath = {
  id: 'hacker-missing-vote',
  category: 'social',
  weight(house, ctx) {
    if (ctx.act !== 'house') return 0;
    return _missingCast(house, ctx) ? band(9, 13) : 0;
  },
  fire(house, ctx, api) {
    // The room can count. What it cannot do is work out WHOSE vote went
    // missing, because everybody has a reason to lie about how they voted.
    const cast = _missingCast(house, ctx);
    if (!cast) return null;
    const { silenced, counter, accused } = cast;
    const text = _variant([
      `${counter} has been counting Thursday's vote all week and it will not add up. More people claim they voted than votes were read. Somebody in this house is lying, and ${counter} has decided it is ${accused}.`,
      `"One of us didn't vote." ${counter} says it flatly, at the table, and watches which face moves. ${silenced === accused ? `${silenced}'s does, a little.` : `${accused}'s does, for entirely unrelated reasons, and that is the end of ${accused}'s week.`}`,
      `The house reruns the eviction out loud — who said what, who claimed what — and arrives at a number that is one short of the people in the room. ${counter} starts a list. ${accused} is at the top of it.`,
      `${counter} works out that a ballot went missing on Thursday and reaches the sensible conclusion: somebody was cancelled. Then the sensible part stops, and ${counter} decides ${accused} is the reason.`,
    ], ctx, silenced, accused);
    api.suspicion(counter, accused, 1.1);
    if (accused !== silenced) api.addBond(counter, accused, -0.4);
    return { text, players: [counter, accused, silenced].filter((n, i, a) => a.indexOf(n) === i),
      badgeText: accused === silenced ? 'ONE SHORT' : 'ONE SHORT, WRONG NAME',
      badgeClass: accused === silenced ? 'gold' : 'red' };
  },
};

const silencedVoterDilemma = {
  id: 'hacker-silenced-voter',
  category: 'social',
  weight(house, ctx) {
    if (ctx.act !== 'house') return 0;
    return _silencedCast(house, ctx) ? band(8, 12) : 0;
  },
  fire(house, ctx, api) {
    const cast = _silencedCast(house, ctx);
    if (!cast) return null;
    const { silenced, confidant } = cast;
    const st = pStats(silenced);
    // Saying it out loud buys sympathy and hands the house a fact. Keeping it
    // means carrying an accusation you cannot answer.
    const tells = st.boldness >= 6 || st.temperament <= 4;
    const p = pronouns(silenced);
    const text = tells ? _variant([
      `${silenced} tells ${confidant} the thing ${p.sub} ${p.sub === 'they' ? 'have' : 'has'} been sitting on since Thursday: ${p.posAdj} vote was cancelled. ${p.Sub} ${p.sub === 'they' ? 'were' : 'was'} told in private, told to say nothing, and made to sit there while the room voted around ${p.obj}.`,
      `"I didn't not vote. I was NOT ALLOWED to vote." ${silenced} finally says it, to ${confidant}, and the difference matters enormously to ${silenced} and not at all to the arithmetic.`,
      `${silenced} explains to ${confidant} exactly how it went: the summons, the instruction, the empty chair in the diary room, and the impossibility of proving one word of it.`,
      `${silenced} has spent five days being counted as a liar for a vote ${p.sub} never got to cast, and tonight ${p.sub} ${p.sub === 'they' ? 'hand' : 'hands'} ${confidant} the truth, mostly to stop carrying it alone.`,
    ], ctx, silenced, confidant) : _variant([
      `${silenced} says nothing about Thursday. Admitting the vote was cancelled means admitting somebody chose ${p.obj} to silence, and ${p.sub} ${p.sub === 'they' ? 'have' : 'has'} no idea who, which is the worst possible thing to be caught not knowing.`,
      `${confidant} asks ${silenced}, gently, how ${p.sub} voted. ${silenced} gives a number instead of an answer and changes the subject to slop.`,
      `${silenced} decides that a person who says "my vote was cancelled" is a person who sounds like they are inventing an excuse, and keeps the whole thing in ${p.posAdj} pocket for another week.`,
      `The safest thing ${silenced} can do with the truth is nothing, so ${p.sub} ${p.sub === 'they' ? 'do' : 'does'} nothing, and lets ${confidant} carry on believing whatever the room decided.`,
    ], ctx, silenced, confidant);
    if (tells) {
      api.addBond(silenced, confidant, 0.7);
      try { api.remember(confidant, silenced, 'told-me-the-truth', 1, { twist: 'bb-hacker' }); } catch { /* texture */ }
    } else {
      api.suspicion(confidant, silenced, 0.6);
    }
    return { text, players: [silenced, confidant],
      badgeText: tells ? 'THE VOTE THAT NEVER WAS' : 'CARRYING IT ALONE',
      badgeClass: tells ? 'blue' : 'grey' };
  },
};

// ══════════════════════════════════════════════════════════════════════
// THE ROOM — alibis, liars, and one person performing very hard
// ══════════════════════════════════════════════════════════════════════

const hackerTable = {
  id: 'hacker-round-table',
  category: 'social',
  weight(house, ctx) {
    if (!_hacked(ctx) || ctx.act !== 'house') return 0;
    return _tableCast(house, ctx) ? band(9, 14) : 0;
  },
  fire(house, ctx, api) {
    const cast = _tableCast(house, ctx);
    if (!cast) return null;
    const { talkers, accused } = cast;
    const right = accused === _truth(ctx);
    const text = _variant([
      `The house convenes the only committee it has: everybody on the sofas, everybody theorising, nobody with a single fact. Motive, opportunity, who was quiet at breakfast. By the second lap the name in the middle of the table is ${accused}.`,
      `${talkers[0]} runs the room through it — the block changed, the draw changed, and one person has been suspiciously relaxed about both. The room agrees the person is ${accused}, largely because the room needs the person to be somebody.`,
      `Three separate theories get merged into one confident theory, which is how confidence is usually manufactured. ${accused} is the load-bearing name, and ${right ? 'is sitting close enough to hear it' : 'has done nothing whatsoever'}.`,
      `${talkers[1] || talkers[0]} keeps saying "I'm not accusing anyone" in between accusing ${accused}. The distinction survives about four minutes.`,
    ], ctx, accused, talkers[0]);
    talkers.forEach(t => { if (t !== accused) api.suspicion(t, accused, 0.55); });
    return { text, players: [...talkers.slice(0, 3), accused].filter((n, i, a) => a.indexOf(n) === i),
      badgeText: right ? 'CLOSING IN' : 'THE WRONG SCENT',
      badgeClass: right ? 'gold' : 'grey' };
  },
};

const alibiTrade = {
  id: 'hacker-alibi-trade',
  category: 'social',
  weight(house, ctx) {
    if (!_hacked(ctx) || ctx.act !== 'house') return 0;
    return _alibiCast(house, ctx) ? band(6, 10) : 0;
  },
  fire(house, ctx, api) {
    const cast = _alibiCast(house, ctx);
    if (!cast) return null;
    const { a, b } = cast;
    const text = _variant([
      `${a} and ${b} establish, for the record and for each other, that neither left the room during the competition window. Their stories match because they compared them first, which makes the truth sound rehearsed.`,
      `"You know it wasn't me, right?" ${a} asks it, ${b} returns it, and within a minute they have a mutual alibi neither of them can actually verify.`,
      `${a} and ${b} agree to vouch for each other if the house comes asking. It is a small conspiracy in defence of nothing, and it will look enormous if anybody notices it.`,
      `${a} works out that being suspected is worse than being nominated, and recruits ${b} into saying so loudly and in unison.`,
    ], ctx, a, b);
    api.addBond(a, b, 0.5);
    return { text, players: [a, b], badgeText: 'THE ALIBI TRADE', badgeClass: 'blue' };
  },
};

const falseHacker = {
  id: 'hacker-false-claim',
  category: 'social',
  weight(house, ctx) {
    if (!_hacked(ctx) || ctx.act !== 'house') return 0;
    return _liarCast(house, ctx) ? band(6, 10) : 0;
  },
  fire(house, ctx, api) {
    const cast = _liarCast(house, ctx);
    if (!cast) return null;
    const { liar, audience } = cast;
    const p = pronouns(liar);
    const text = _variant([
      `${liar} does not claim it. ${p.Sub} ${p.sub === 'they' ? 'do' : 'does'} something better: ${p.sub} ${p.sub === 'they' ? 'decline' : 'declines'} to deny it, in front of ${audience}, with a shrug that costs nothing and buys a week of being handled carefully.`,
      `"Let's just say the block ended up how I wanted it." ${liar} says it to ${audience} in the storage room, and by dinner ${liar} is a houseguest people check with before making plans.`,
      `${liar} implies to ${audience} that the hack was ${p.posAdj} — never the words, only the shape of them — and takes on all the fear of a power ${p.sub} ${p.sub === 'they' ? 'do' : 'does'} not hold and none of the risk of holding it. Yet.`,
      `${liar} tells ${audience} to "watch the veto and think about who benefits". Nothing ${liar} predicts will happen. It will not matter; the legend is already moving faster than the facts.`,
    ], ctx, liar, audience);
    api.suspicion(audience, liar, 1.4);
    api.popDelta(liar, 1);
    try { api.remember(audience, liar, 'claimed-the-hack', 1, { twist: 'bb-hacker' }); } catch { /* texture */ }
    return { text, players: [liar, audience], badgeText: 'TAKING CREDIT', badgeClass: 'red' };
  },
};

const performedConfusion = {
  id: 'hacker-performed-confusion',
  category: 'social',
  weight(house, ctx) {
    if (!_hacked(ctx) || ctx.act !== 'house') return 0;
    return _performCast(house, ctx) ? band(8, 13) : 0;
  },
  fire(house, ctx, api) {
    const cast = _performCast(house, ctx);
    if (!cast) return null;
    const { truth, watcher } = cast;
    const st = pStats(truth);
    const overplayed = pStats(watcher).intuition >= 7 && st.strategic <= 6;
    const p = pronouns(truth);
    const text = overplayed ? _variant([
      `${truth} has a theory about the hack. Then a second theory. Then a timeline. ${watcher} listens to all of it and thinks: nobody baffled does this much homework.`,
      `${truth} is the loudest voice in the investigation, which ${watcher} notes is also the cheapest place to stand. ${p.Sub} ${p.sub === 'they' ? 'are' : 'is'} not standing there well.`,
      `${watcher} invents a detail — that the hacker had to confirm the swap twice — and watches ${truth} not react to something ${p.sub} would have had to react to. The stillness is the tell.`,
      `${truth} asks "but who do YOU think it was" for the fifth time today. ${watcher} stops answering and starts counting.`,
    ], ctx, truth, watcher) : _variant([
      `${truth} is exactly as annoyed about the hack as everybody else — no more, no less — and backs the room's favourite theory with real warmth. It is a flawless performance and nobody applauds.`,
      `Somebody asks ${truth} directly. ${p.Sub} ${p.sub === 'they' ? 'laugh' : 'laughs'}, ${p.sub === 'they' ? 'offer' : 'offers'} a suspect of ${p.posAdj} own, and the conversation goes past ${p.obj} like water past a stone.`,
      `${truth} spends the afternoon being visibly, publicly bad at solving a mystery ${p.sub} ${p.sub === 'they' ? 'are' : 'is'} the answer to.`,
      `${truth} complains about "whoever did this" with the specific irritation of somebody who has thought about how an innocent person would complain.`,
    ], ctx, truth, watcher);
    if (overplayed) {
      api.suspicion(watcher, truth, 1.6);
      try { api.remember(watcher, truth, 'suspected-hacker', 1, { twist: 'bb-hacker', correct: true }); } catch { /* texture */ }
    }
    return { text, players: [truth, watcher],
      badgeText: overplayed ? 'ONE NOTCH TOO LOUD' : 'FLAWLESS ALIBI',
      badgeClass: overplayed ? 'gold' : 'grey' };
  },
};

export const HACKER_EVENTS = [
  benefitMath, swappedInHunts, hohDisowns, seatWitness,
  missingVoteMath, silencedVoterDilemma,
  hackerTable, alibiTrade, falseHacker, performedConfusion,
];

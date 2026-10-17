// ══════════════════════════════════════════════════════════════════════
// ch/script/roles.js — who plays which part in a scene, and how it ended
// ══════════════════════════════════════════════════════════════════════
//
// The engine records a scene as { kind, who: [...], data }. A pool line is
// written for parts — a (speaks first), b, c, d — and an ENDING the engine
// already decided (manual §19.2: the engine decides, the words describe).
// This table turns one into the other, per kind, so a line for "the one who
// called out" never lands on the one who was called.
//
// Slots a line may name besides the parts: {target}, {alliance}, {game},
// {gone}, {show_a}, {show_b}, {need}. A slot is filled only from the scene's
// own data; a line whose slot is empty is never picked (write.js).
import { SHOWS, CHALLENGE_FORMAT } from '../../shows.js';

// what a daily's question called somebody (daily/more.js ASK, betrayal.js QUESTIONS), as a phrase
const CALLED = { snake: 'the biggest snake in the house', threat: 'the biggest threat in the house', fake: 'the fakest person here',
  'next-in': 'the next one going into the Arena', coattails: 'the one riding coattails', 'never-trust': "the one you'd never trust" };
const showName = slug => (slug && SHOWS[slug]?.name) || null;
const yes = (v, a, b) => (v ? a : b);
// Somebody at home (state.atHome): the partner's name for {home}, the first of the two who has one. A scene
// that is the same both ways round (a spark, a showmance, a date) puts the one spoken for first, so a line
// written for them is said by them (the user, 2026-10-16: Thom has a boyfriend outside, and a roof scene at
// three in the morning never mentioned him).
const homeOf = (st, a, b) => st.atHome?.[a]?.name || st.atHome?.[b]?.name || undefined;
function attachedFirst(sc, st, ending) {
  const [x, y] = sc.who;
  const [a, b] = st.atHome?.[y] && !st.atHome?.[x] ? [y, x] : [x, y];
  return { roles: { a, b }, ending, slots: { home: homeOf(st, a, b) } };
}
// a partner at home, by how serious it is (life stages: dating, public, living-together, engaged, married)
const HOME_STAGE = { married: 'married', engaged: 'engaged', 'living-together': 'together' };

// kind → (scene, state) → { roles: {a,b,c,d}, ending, slots }
const COUNT_WORD = ['None', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen', 'Twenty'];

// What a call-out at the bar is about (party.js nightDrama): said to the rival's face.
// a feud said as what it really is (cause.js GROUP): only talk is "talking about me"
const FEUD_BEEF = { vote: 'you stood up and said my name at the vote', callout: 'you called me out in front of everybody',
  ally: 'you sent my friend home', talk: "you've been talking about me behind my back",
  clash: "you've had it in for me since day one", dislike: "I don't like you, and I'm done pretending I do" };
const BEEF = { vote: 'you stood up and said my name at the vote', floater: "you've never been in the Arena once", feud: "you've been talking about me since day one" };

// The reason a name is said at the deliberation, true to the record (vote.js whyName): a sentence, the name in it.
// f: the record ({ arenaW, daily, topWeeks }), so a threat is argued with what the threat has actually done
const NUM = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
const num = k => NUM[k] || String(k);
const CASE = {
  easy: n => `${n} is the one any of us could beat in the Arena`,
  threat: (n, f = {}) => (f.arenaW >= 2 ? `${n} has won ${num(f.arenaW)} eliminations already, and nobody wants to be standing next to ${n} in the final`
    : f.daily >= 2 ? `${n} has won ${num(f.daily)} dailies, and if we don't stop ${n} now, we never will`
    : `${n} keeps winning, and nobody else in this division has`),
  ranked: (n, f = {}) => (f.topWeeks >= 2 ? `TJ has had ${n} at the top of his list ${num(f.topWeeks)} weeks running, and he's right`
    : `TJ put ${n} at the top of his list this morning, and he's right`),
  grudge: n => `${n} has been coming after people in this house since day one`,
  floater: n => `${n} hasn't done a single thing in this game except hide`,
  schemer: n => `${n} has been playing every side of this house`,
  trust: n => `I don't trust ${n}, and I don't think anybody here should`,
};

export const ROLES = {
  arrival: (sc, st) => {
    const r = sc.data.recognised?.[0];
    // two people who were something to each other before (season.js arrivalKin): a couple, or old friends
    if (r && sc.data.kin) return { roles: { a: r[0], b: r[1] }, ending: sc.data.kin === 'couple' ? 'couple' : 'oldfriends' };
    return r ? { roles: { a: r[0], b: r[1] }, ending: st.origin[r[0]] === CHALLENGE_FORMAT ? 'returning' : 'reunion', slots: { show_a: showName(st.origin[r[0]]) } }
      : { roles: { a: sc.who[0], b: sc.who[1] }, ending: 'strangers' };
  },
  'villa-reveal': sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: 'any' }),
  // a proposes, b is the name, c objects (with their own name when they have one), d backs a
  'house-debate': sc => ({ roles: { a: sc.who[0], b: sc.who[1], c: sc.who[2], d: sc.who[3] }, ending: sc.data.alt ? 'split' : 'one',
    slots: { alt: sc.data.alt, case: CASE[sc.data.why || 'trust'](sc.who[1], sc.data.whyFacts || {}), altcase: sc.data.alt ? CASE[sc.data.altWhy || 'trust'](sc.data.alt, sc.data.altFacts || {}) : undefined } }),
  // the day of the Arena: a (going in) thinks the pick through with b, naming two people it could be
  'pick-talk': sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: 'any', slots: { opt1: sc.data.options?.[0], opt2: sc.data.options?.[1] } }),
  // the people who might be picked, waiting; {target} is the one picking
  'pick-guess': sc => ({ roles: { a: sc.who[0], b: sc.who[1], c: sc.who[2] }, ending: 'any', slots: { target: sc.data.by } }),
  // the places
  'gym-training': sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: 'any' }),
  'pool-games': sc => ({ roles: { a: sc.who[0], b: sc.who[1], c: sc.who[2], d: sc.who[3] }, ending: sc.data.sore ? 'sore' : 'fun' }),
  'house-dinner': sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: sc.data.burnt ? 'burnt' : 'good' }),
  'beach-run': sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: sc.data.friendly ? 'friendly' : 'rivals' }),
  'sunset-talk': sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: sc.data.endgame ? 'endgame' : 'home' }),
  'bunk-whisper': sc => ({ roles: { a: sc.who[0], b: sc.who[1], c: sc.data.heard || undefined }, ending: sc.data.heard ? 'heard' : 'safe' }),
  'after-vote': sc => ({ roles: { a: sc.who[0], b: sc.who[1], c: sc.data.stung || undefined }, ending: sc.data.stung ? 'stung' : 'any', slots: { count: sc.data.count >= 2 ? COUNT_WORD[sc.data.count] || String(sc.data.count) : undefined } }),   // "One votes": a single vote has no count line
  daily: sc => ({ roles: { a: sc.data.winners[0], b: sc.data.winners[1], c: sc.data.last?.[0] }, ending: sc.data.mode,
    slots: { game: sc.data.dailyName } }),
  meeting: sc => {
    const r = sc.data.responses || {};
    const pick = ['refuses', 'false-yes', 'reluctant', 'yes'].map(x => Object.keys(r).find(k => r[k] === x)).find(Boolean);
    const ending = Object.values(r).includes('refuses') ? 'refusal' : Object.values(r).includes('reluctant') ? 'pushback'
      : Object.values(r).includes('false-yes') ? 'falseyes' : 'united';
    return { roles: { a: sc.data.organiser, b: pick, c: Object.keys(r).find(k => k !== sc.data.organiser && k !== pick) },
      ending, slots: { target: sc.data.target, alliance: sc.data.name, reason: sc.data.reasonKey } };
  },
  recruit: sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: sc.data.answer, slots: { target: sc.data.target } }),
  plea: sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: yes(sc.data.moved, 'moved', 'held') }),
  'leverage-threat': sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: sc.data.doubted ? 'doubted' : yes(sc.data.bluff, 'bluff', 'credible') }),
  'counter-pitch': sc => ({ roles: { a: sc.who[0], b: sc.data.alt, c: sc.who[2] }, ending: sc.data.moved?.length ? 'moved' : 'held' }),
  'spare-deal': sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: sc.data.answer }),
  'empty-threat': sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: 'any', slots: { target: sc.data.opponent } }),
  outing: sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: 'any', slots: { alliance: sc.data.name } }),
  volunteer: sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: yes(sc.who[1], 'targeted', 'open'), slots: { target: sc.who[1] } }),
  // {game}: the Arena game, when TJ said it before the call-out
  callout: sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: sc.data.reason, slots: { game: sc.data.gameName || undefined } }),
  // TJ tells the one voted in which game tomorrow is (season.js), before they pick
  'arena-reveal': sc => ({ roles: { a: sc.who[0] }, ending: 'any', slots: { game: sc.data.gameName } }),
  arena: sc => ({ roles: { a: sc.data.winner, b: sc.data.loser }, ending: sc.data.tj, slots: { game: sc.data.gameName } }),
  // b: somebody who voted them in (never a friend at the door: those are x and y)
  return: sc => { const nv = sc.data.voters ?? (sc.who.length - 1);
    return { roles: { a: sc.who[0], b: nv > 0 ? sc.who[1] : undefined },
    ending: sc.data.volunteered ? 'volunteered' : sc.data.calledOut ? 'calledout' : nv > 0 ? 'faced' : 'quiet',
    slots: { gone: sc.data.beat, alliance: sc.data.alliance || undefined, count: sc.data.wins >= 2 ? (COUNT_WORD[sc.data.wins] || String(sc.data.wins)).toLowerCase() : undefined } }; },
  // b is never a again: one relieved player alone gets the one-person scripts, not both halves of a
  // two-person exchange (season 777: "I slept better last night" / "Don't say that out loud", both Jake).
  'morning-after': sc => { const a = sc.data.hurt?.[0] || sc.who[0];
    return { roles: { a, b: [sc.data.hurt?.[1], ...(sc.data.relieved || [])].find(x => x && x !== a) },
    ending: sc.data.hurt?.length ? (sc.data.hurt.length > 1 ? 'mourning' : 'alone') : 'relief', slots: { gone: sc.data.gone, caller: sc.data.caller || undefined } }; },
  // the mean ones (cruel.js): a mocks b, c (a kind friend) steps in; a gloats at b, voted in
  mock: sc => ({ roles: { a: sc.who[0], b: sc.who[1], c: sc.who[2] }, ending: sc.data.defender ? 'defended' : 'alone', slots: { game: sc.data.daily || undefined } }),
  gloat: sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: 'any' }),
  // a: the one named in the daily, out loud; b: who named them (daily/named.js). {called}: what they were called
  'named-fallout': sc => ({ roles: { a: sc.who[0], b: sc.who[1] },
    ending: ['dish', 'cup'].includes(sc.data.q) ? 'picked' : sc.data.kind === 'betrayed' ? 'betrayed' : 'fires',
    slots: { called: CALLED[sc.data.q] || undefined, game: sc.data.daily || undefined } }),
  // a: the one going home; b, c: the friends who come down from the stand; d: who beat them (goodbye.js)
  'arena-goodbye': sc => ({ roles: { a: sc.data.loser, b: sc.data.friends?.[0], c: sc.data.friends?.[1], d: sc.data.winner },
    ending: sc.data.friends?.length ? 'friends' : 'alone', slots: { target: sc.data.shot || undefined } }),
  // a: the friend of the one who left; b: the one who sent them (fallout.js payback)
  payback: sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: sc.data.how === 'calledout' ? 'calledout' : 'voted', slots: { gone: sc.data.gone } }),
  quit: sc => ({ roles: { a: sc.who[0] }, ending: 'any' }),
  // quit.js: the signs, the friend first, the house
  wavering: sc => ({ roles: { a: sc.who[0], b: sc.data.heard || undefined }, ending: sc.data.heard ? 'heard' : 'alone' }),
  'quit-decide': sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: sc.data.stays ? 'stays' : 'goes' }),
  'quit-house': sc => ({ roles: { a: sc.who[0], b: sc.data.pleading?.[0], c: sc.data.pleading?.[1], d: sc.data.glad || undefined }, ending: sc.data.pleading?.length ? (sc.data.glad ? 'glad' : 'pleading') : (sc.data.glad ? 'gladonly' : 'quiet') }),
  medical: sc => ({ roles: { a: sc.who[0] }, ending: 'any' }),
  // medevac.js: the medic's exam (cleared: the scare; out: the end), and the house's goodbye
  'medical-exam': sc => ({ roles: { a: sc.who[0], b: sc.data.friend || undefined }, ending: sc.data.verdict, slots: { part: sc.data.part } }),
  'medical-house': sc => ({ roles: { a: sc.who[0], b: sc.data.friends?.[0], c: sc.data.friends?.[1], d: sc.data.relieved || undefined },
    ending: sc.data.friends?.length ? (sc.data.relieved ? 'relieved' : 'friends') : 'quiet', slots: { part: sc.data.part } }),
  // b: the one TJ is sending home, there to hear it (they leave the same day)
  // c: a witness TJ hears from first (dqDebate), when there was one
  disqualified: sc => ({ roles: { a: sc.who[1], b: sc.who[0], c: sc.data.witness || undefined }, ending: sc.data.witness ? 'hearing' : 'any', slots: { gone: sc.who[0] } }),
  // the night of the fight (party.js dqDebate): a the aggressor, b the one hit, c a friend defending a, d a
  // friend of b who saw it, x the one trying to calm it down. heated: shouting; calm: quiet and serious
  'dq-debate': sc => ({ roles: { a: sc.who[0], b: sc.who[1], c: sc.data.defenders?.[0], d: sc.data.accusers?.[0], x: sc.data.calmer || undefined },
    ending: sc.data.heated ? 'heated' : 'calm' }),
  'expelled-goodbye': sc => ({ roles: { a: sc.who[0], b: sc.who[1], c: sc.who[2] }, ending: !sc.who[1] ? 'alone' : sc.data.angry ? 'angry' : 'tears', slots: { target: sc.data.victim || undefined } }),
  'expelled-blame': sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: sc.data.heated ? 'heated' : 'calm', slots: { gone: sc.data.gone } }),
  'expelled-victim': sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: sc.data.relieved ? 'relieved' : 'shaken', slots: { gone: sc.data.gone } }),
  // TJ announces a double (season.js): a and b are the two most worried; {count} the number going in
  'tj-double': sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: sc.data.division === 'm' ? 'men' : sc.data.division === 'f' ? 'women' : 'any',
    slots: { count: (COUNT_WORD[sc.data.elims] || String(sc.data.elims)).toLowerCase() } }),
  'tj-house-meeting': sc => ({ roles: { a: sc.data.victim }, ending: 'any', slots: { gone: sc.data.gone } }),
  // ── the night out (party.js nightDrama) ──
  'party-slip': sc => ({ roles: { a: sc.who[0], b: sc.who[1], c: sc.data.caught || undefined }, ending: sc.data.self ? 'self' : sc.data.caught ? 'caught' : 'told',
    slots: { alliance: sc.data.alliance, target: sc.data.target || undefined } }),
  'party-deal': sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: 'any' }),
  'party-callout': sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: sc.data.firesBack ? 'firesback' : 'walks',
    slots: { beef: (sc.data.why === 'feud' && FEUD_BEEF[sc.data.causeType]) || BEEF[sc.data.why] || BEEF.feud } }),
  'party-tears': sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: sc.data.comforted ? 'comforted' : 'alone' }),
  // the drunk kiss (party.js): a kissed b. caught: c, a's partner, saw it at the club (blowup: it went off). cheat:
  // a's partner {target} is in the house and did not see. home: a has {home} waiting outside. single: neither is anyone's.
  'party-kiss': sc => ({ roles: { a: sc.who[0], b: sc.who[1], c: sc.data.caught ? sc.data.partner : undefined },
    ending: sc.data.caught ? (sc.data.blowup ? 'blowup' : 'caught') : sc.data.partner ? 'cheat' : sc.data.home ? 'home' : 'single',
    slots: { target: !sc.data.caught ? sc.data.partner || undefined : undefined, home: sc.data.home || undefined } }),
  // the morning after (party.js kissFallout): a was cheated on, b kissed a's partner c, d saw it and told a
  'kiss-fallout': sc => ({ roles: { a: sc.who[0], b: sc.who[1], c: sc.who[2], d: sc.who[3] }, ending: sc.data.ended ? 'breakup' : 'stays' }),
  // ── the stakes (stakes.js, redemption.js) ──
  'bank-taken': sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: 'any', slots: { amount: sc.data.amount } }),
  injury: sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: ['knock', 'knock', 'sprain', 'tear'][sc.data.sev] || 'knock', slots: { part: sc.data.part } }),
  'injury-healed': sc => ({ roles: { a: sc.who[0] }, ending: 'any', slots: { part: sc.data.part } }),
  'power-rankings': sc => ({ roles: { a: sc.data.top, b: sc.data.last, c: sc.data.drop || undefined, d: sc.data.rise || undefined }, ending: 'any',
    slots: { second: sc.data.order?.[1], target: sc.data.passer || undefined } }),
  'pass-earned': sc => ({ roles: { a: sc.who[0] }, ending: sc.data.first ? 'first' : 'again', slots: { token: sc.data.token } }),
  'pass-cut': sc => ({ roles: { a: sc.who[0] }, ending: sc.data.spared ? 'spared' : 'cut', slots: { token: sc.data.token } }),
  'bank-brag': sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: yes(sc.data.firesBack, 'firesback', 'takes'), slots: { amount: sc.data.amount } }),
  'money-talk': sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: 'any', slots: { target: sc.data.target, amount: sc.data.amount } }),
  'injury-care': sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: 'any', slots: { part: sc.data.part } }),
  'injury-target': sc => ({ roles: { a: sc.who[0], b: sc.who[1], c: sc.data.heard ? sc.data.target : undefined }, ending: yes(sc.data.heard, 'heard', 'quiet'),
    slots: { target: sc.data.target, part: sc.data.part } }),
  'ranking-beef': sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: yes(sc.data.laughs, 'laughs', 'war') }),
  'pass-panic': sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: yes(sc.data.plan, 'plan', 'worry'), slots: { token: sc.data.token } }),
  'pass-flex': sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: 'any', slots: { token: sc.data.token } }),
  'redemption-arrive': sc => ({ roles: { a: sc.who[0], b: sc.who[1], c: sc.who[2] }, ending: sc.data.company ? 'company' : 'alone', slots: { target: sc.data.by } }),
  'redemption-watch': sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: sc.who[1] ? 'together' : 'alone', slots: { target: sc.data.target || undefined } }),
  'redemption-feud': sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: 'any' }),
  'redemption-duel': sc => ({ roles: { a: sc.data.winner, b: sc.data.loser }, ending: sc.data.defending ? 'defended' : 'new', slots: { game: sc.data.gameName } }),
  // the one-episode twists (ep-twists.js)
  purge: sc => ({ roles: { a: sc.who[0], b: sc.data.friend || undefined }, ending: sc.data.friend ? 'friend' : 'alone', slots: { game: sc.data.daily || undefined } }),
  'return-arena': sc => ({ roles: { a: sc.data.winner, b: sc.data.loser, c: sc.data.by || undefined }, ending: 'any', slots: { game: sc.data.gameName || undefined } }),
  'return-walkin': sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: sc.data.by ? 'rival' : 'friend' }),
  'redemption-return': sc => ({ roles: { a: sc.who[0], b: sc.who[1], c: sc.who[2] }, ending: sc.data.voters ? 'revenge' : 'quiet', slots: { target: sc.data.by || undefined } }),
  'redemption-closed': sc => ({ roles: { a: sc.who[0] }, ending: 'any' }),
  // ── the house ──
  prank: sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: yes(sc.data.laughs, 'laughs', 'war') }),
  'kitchen-disaster': sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: yes(sc.data.saved, 'saved', 'alone') }),
  'gym-flex': sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: 'any' }),
  'hot-tub-truths': sc => {
    // the one who answers a confession is a friend in the tub, never the person it's about
    const on = sc.data.slip?.on;
    const [a, ...rest] = sc.who;
    const others = rest.filter(n => n !== on);
    return { roles: { a, b: others[0], c: others[1] }, ending: sc.data.slip?.kind || 'none', slots: { target: on } };
  },
  'tj-at-breakfast': sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: 'any' }),
  'bunk-war': sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: yes(sc.data.moved, 'moved', 'stuck') }),
  'show-banter': (sc, st) => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: yes(sc.data.ok, 'ok', 'sour'),
    slots: { show_a: showName(sc.data.a), show_b: showName(sc.data.b) } }),
  'rookie-hazing': sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: yes(sc.data.plays, 'plays', 'refuses') }),
  'kitchen-blowup': sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: 'any' }),
  receipts: sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: sc.data.owns ? 'owns' : sc.data.apology ? 'apology' : 'denies' }),
  'old-show-grudge': (sc, st) => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: yes(sc.data.settled, 'settled', 'reopened'),
    slots: { show_a: showName(st.origin[sc.who[0]]) } }),
  'trash-talk': sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: yes(sc.data.bites, 'bites', 'shrugs') }),
  'floater-callout': sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: yes(sc.data.firesBack, 'firesback', 'takes') }),
  'gossip-backfire': sc => ({ roles: { a: sc.who[0], b: sc.who[1], c: sc.who[2] }, ending: yes(sc.data.tells, 'told', 'kept') }),
  homesick: sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: yes(sc.data.comforted, 'comforted', 'alone') }),
  jealousy: sc => ({ roles: { a: sc.who[0], b: sc.who[1], c: sc.who[2] }, ending: yes(sc.data.blowup, 'blowup', 'quiet') }),
  // a flirts, b answers: never swapped. {home}: whoever of them is spoken for (facts attachedA / attachedB)
  flirt: (sc, st) => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: yes(sc.data.back, 'back', 'rebuffed'), slots: { home: homeOf(st, sc.who[0], sc.who[1]) } }),
  'beach-date': (sc, st) => attachedFirst(sc, st, 'any'),
  pda: sc => ({ roles: { a: sc.who[0], b: sc.who[1], c: sc.who[2] }, ending: 'any' }),
  // somebody at home (events.js home-*): {home} is the partner's name; in the gossip, c (the one spoken for) and d
  // (who they are with) are talked about, never in the room
  'home-talk': sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: HOME_STAGE[sc.data.stage] || 'dating', slots: { home: sc.data.home } }),
  'home-gossip': sc => ({ roles: { a: sc.who[0], b: sc.who[1], c: sc.who[2], d: sc.who[3] }, ending: yes(sc.data.couple, 'couple', 'flirting'), slots: { home: sc.data.home } }),
  'home-guilt': sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: sc.data.confess ? 'confess' : yes(sc.data.ends, 'ends', 'stays'), slots: { home: sc.data.home } }),
  'ex-in-the-house': sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: yes(sc.data.rekindle, 'rekindle', 'cold') }),
  overheard: sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: 'any' }),
  'ride-to-the-final': sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: 'any' }),
  'loyalty-test': sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: yes(sc.data.leaks, 'leaks', 'holds') }),
  'vet-mentors-rookie': sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: 'any' }),
  'scheme-lie': sc => ({ roles: { a: sc.who[0], b: sc.who[1], c: sc.who[2] }, ending: yes(sc.data.believed, 'believed', 'seen') }),
  // ── alliances, deals, romance ──
  'alliance-form': sc => ({ roles: { a: sc.data.leader, b: sc.who.find(x => x !== sc.data.leader), c: sc.who.filter(x => x !== sc.data.leader)[1] },
    ending: yes(sc.data.origin, 'sameshow', 'any'), slots: { alliance: sc.data.name } }),
  'alliance-grow': sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: 'any', slots: { alliance: sc.data.name } }),
  // a defector joining (alliances.js allianceShifts): a leads {alliance}, b walked out of {from} to join it
  'alliance-switch': sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: 'any', slots: { alliance: sc.data.name, from: sc.data.from } }),
  // two groups join (allianceShifts): a and b lead them; {alliance} is the name kept, {from} the one folded in,
  // {against} the bigger group they joined against; c, d any other members in the room
  'alliance-merge': sc => ({ roles: { a: sc.who[0], b: sc.who[1], c: sc.who[2], d: sc.who[3] }, ending: 'any',
    slots: { alliance: sc.data.name, from: sc.data.from, against: sc.data.against || undefined } }),
  'alliance-betrayal': sc => ({ roles: { a: sc.who[1], b: sc.who[0] }, ending: sc.data.how }),
  // {alliance} the group left; {target} the friend it was coming for (walked-friend); {to} where a defector went
  'alliance-leave': sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: sc.data.why,
    slots: { alliance: sc.data.name, target: sc.data.target || undefined, to: sc.data.to || undefined } }),
  'alliance-end': sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: sc.data.why, slots: { alliance: sc.data.name } }),
  'rookie-uprising': sc => ({ roles: { a: sc.who[0], b: sc.who[1], c: sc.who[2] }, ending: 'any' }),
  deal: sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: 'any' }),
  'deal-broken': sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: sc.data.how }),
  spark: (sc, st) => attachedFirst(sc, st, 'any'),
  showmance: (sc, st) => attachedFirst(sc, st, 'any'),
  breakup: sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: 'any' }),
  apology: sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: yes(sc.data.accepted, 'accepted', 'rejected') }),
  // {target}: who runs the house right now, when it is not a's own group (house.js psycheMoment: the power
  // alliance's leader), so "the person in charge" is a name and not a riddle
  psyche: sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: sc.data.need, slots: { need: sc.data.need, target: sc.data.boss || undefined } }),
  // ── the daily, partners, the night before ──
  'throw-caught': sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: 'any' }),
  throw: sc => ({ roles: { a: sc.who[0] }, ending: 'any' }),
  'daily-clutch': sc => ({ roles: { a: sc.who[0] }, ending: 'any' }),
  'daily-choke': sc => ({ roles: { a: sc.who[0] }, ending: 'any' }),
  'call-home': sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: 'any' }),
  'picked-last': sc => ({ roles: { a: sc.who[0], b: sc.data.by }, ending: 'any' }),
  'partner-blame': sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: 'any' }),
  'partner-carried': sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: 'any' }),
  'team-blame': sc => ({ roles: { a: sc.who[0], b: sc.who[1], c: sc.who[2] }, ending: yes(sc.who[2], 'defended', 'alone') }),
  'arena-eve-pep': sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: 'any' }),
  'arena-eve-alone': sc => ({ roles: { a: sc.who[0] }, ending: 'any' }),
  'arena-eve-confront': sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: sc.data.rattled === sc.who[1] ? 'rattled' : 'backfires' }),
  'vet-dismisses': sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: 'any' }),
  // the night out: the two who drank most lead it
  party: sc => {
    const top = Object.entries(sc.data.drink || {}).sort((x, y) => y[1] - x[1]).map(([n]) => n);
    return { roles: { a: top[0], b: top[1], c: top[2] }, ending: 'any' };
  },
  'partner-draw': sc => ({ roles: { a: sc.data.pairs?.[0]?.[0], b: sc.data.pairs?.[0]?.[1] }, ending: 'any' }),
  'partner-pick': sc => ({ roles: { a: sc.data.pairs?.[0]?.[0], b: sc.data.pairs?.[0]?.[1] }, ending: 'any' }),
  'meeting-spotted': (sc, st) => ({ roles: { a: sc.who[0], b: sc.data.present?.[0], c: sc.data.present?.[1] }, ending: 'any',
    slots: { alliance: st.alliances.find(x => x.id === sc.data.alliance)?.name } }),
  overnight: sc => ({ roles: { a: sc.who[0], b: sc.who[1], c: sc.who[2] }, ending: 'any' }),
  fight: sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: 'any' }),
  'fight-physical': sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: 'any' }),
  // ── the vote, read out loud (ceremony.js builds these scenes) ──
  'cer-open': sc => ({ roles: { a: sc.who[0] }, ending: sc.data.division === 'all' ? 'all' : sc.data.division }),
  ballot: sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: sc.data.why }),
  // a ballot that says why (vote.js reasonOf): the voter's own reason, out loud
  'ballot-why': sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: sc.data.reason }),
  'cer-result': sc => ({ roles: { a: sc.who[0] }, ending: sc.data.tie ? 'tie' : 'clear', slots: { count: [1, '1', 'one', 'One'].includes(sc.data.count) ? undefined : sc.data.count } }),   // ceremony.js passes a word
  // the Tribunal (format.js tribunal)
  'cer-nominees': sc => ({ roles: { a: sc.who[0], b: sc.who[1], c: sc.who[2] }, ending: 'any' }),
  'tribunal-pitch': sc => ({ roles: { a: sc.who[0], b: sc.who[1], c: sc.who[2] }, ending: sc.data.mode }),
  'tribunal-room': sc => ({ roles: { a: sc.who[0], b: sc.who[1], c: sc.who[2] }, ending: sc.data.split ? 'split' : 'agree', slots: { target: sc.data.chosen } }),
  'tribunal-verdict': sc => ({ roles: { a: sc.who[0], b: sc.who[1], c: sc.who[2] }, ending: 'any' }),
  // ── the arcs (story/arcs.js): words only, read from the record ──
  'arc-payback': sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: 'any' }),
  'arc-showdown': sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: 'any' }),
  'arc-beast': sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: 'any', slots: { target: sc.data.target } }),
  'arc-beast-feared': sc => ({ roles: { a: sc.who[0] }, ending: 'any', slots: { target: sc.data.target } }),
  'arc-giant-falls': sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: 'any', slots: { gone: sc.data.gone } }),
  'arc-underdog': sc => ({ roles: { a: sc.who[0] }, ending: sc.data.how }),
  'run-name': sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: sc.data.stage }),
  'run-snacks': sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: sc.data.stage }),
  'run-protein': sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: sc.data.stage }),
  'run-speech': sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: sc.data.stage }),
  'run-mirror': sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: sc.data.stage }),
  // ── the final ──
  'final-start': sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: 'any' }),
  'instant-elimination': sc => ({ roles: { a: sc.data.winner, b: sc.who.find(x => x !== sc.data.winner) }, ending: 'any' }),
  'overnight-sabotage': sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: sc.data.first ? 'first' : 'rest' }),
  'overnight-quit': sc => ({ roles: { a: sc.who[0] }, ending: 'any' }),
  'final-pact-help': sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: 'any' }),
  'final-pact-broken': sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: 'any' }),
  champions: sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: sc.who.length > 1 ? 'two' : 'one' }),
  // late arrivals (ep-twists.js): the newcomers walking in; somebody from the house sizing one up
  'late-arrival': sc => ({ roles: { a: sc.data.arrivals[0], b: sc.data.arrivals[1] }, ending: 'any' }),
  'late-sizeup': sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: 'any' }),
  // wishlist.js: a tells b who they would pick ({alt}) and who they never would ({target}); the one picked hears
  'arena-wishlist': sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: 'any', slots: { target: sc.data.avoid, alt: sc.data.pick } }),
  'wishlist-leak': sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: 'any', slots: { target: sc.data.avoid } }),
  // the champions looking back (final.js pathOf); {target}/{alt}: who a's/b's path was about (a partner, a friend)
  'champion-reflect': sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: sc.who.length > 1 ? 'two' : 'one',
    slots: { target: sc.data.ref || undefined, alt: sc.data.refB || undefined } }),
  // the final's moments (final.js): a checkpoint's first and last; talk at the fire; the podium; the runner-up and the champion; last words
  'final-cp': sc => ({ roles: { a: sc.data.first, b: sc.data.last }, ending: sc.data.id }),
  'overnight-talk': sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: sc.data.mood }),
  'final-podium': sc => ({ roles: { a: sc.who[0] }, ending: 'any' }),
  'final-congrats': sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: sc.data.gracious ? 'gracious' : 'bitter' }),
  'final-lastword': sc => ({ roles: { a: sc.who[0] }, ending: sc.data.when === 'instant' ? 'instant' : sc.data.place === 2 ? 'second' : 'finished' }),
};

export function rolesOf(scene, state) {
  const f = ROLES[scene.kind];
  if (!f) return null;
  const r = f(scene, state);
  // Drop empty parts, so a line for c is never picked for a two-person scene.
  for (const k of Object.keys(r.roles)) if (!r.roles[k]) delete r.roles[k];
  // Everybody else in the conversation, in order, as x, y and z (the user, 2026-10-15: "we have group
  // conversations, trio, duo, quatuor and more"). A turn marked { opt: 1 } is theirs to say when they are
  // there and is dropped when they are not, so one conversation plays as a duo, a trio or a four.
  // ...and never somebody the scene talks ABOUT (a slot: the caller, the target, the one who went home): Grett, the
  // {caller} of a morning-after, was drawn as a bystander and said "Grett is inside, by the way" (2026-10-17)
  r.slots ||= {};
  const taken = new Set([...Object.values(r.roles), ...Object.values(r.slots).filter(v => typeof v === 'string')]);
  const rest = [...(scene.who || []), ...(scene.data?.crowd || [])].filter(n => n && n !== 'TJ' && !taken.has(n));
  ['x', 'y', 'z'].forEach((k, i) => { if (rest[i] && !r.roles[k]) r.roles[k] = rest[i]; });
  for (const k of Object.keys(r.slots)) if (r.slots[k] == null) delete r.slots[k];
  return r;
}

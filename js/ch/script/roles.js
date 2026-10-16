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
import { SHOWS } from '../../shows.js';

// what a daily's question called somebody (daily/more.js ASK, betrayal.js QUESTIONS), as a phrase
const CALLED = { snake: 'the biggest snake in the house', threat: 'the biggest threat in the house', fake: 'the fakest person here',
  'next-in': 'the next one going into the Arena', coattails: 'the one riding coattails', 'never-trust': "the one you'd never trust" };
const showName = slug => (slug && SHOWS[slug]?.name) || null;
const yes = (v, a, b) => (v ? a : b);

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
    return r ? { roles: { a: r[0], b: r[1] }, ending: 'reunion', slots: { show_a: showName(st.origin[r[0]]) } }
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
  callout: sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: sc.data.reason }),
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
  disqualified: sc => ({ roles: { a: sc.who[1], b: sc.who[0] }, ending: 'any', slots: { gone: sc.who[0] } }),
  'expelled-goodbye': sc => ({ roles: { a: sc.who[0], b: sc.who[1], c: sc.who[2] }, ending: sc.data.angry ? 'angry' : 'tears', slots: { target: sc.data.victim || undefined } }),
  'expelled-blame': sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: sc.data.heated ? 'heated' : 'calm', slots: { gone: sc.data.gone } }),
  'expelled-victim': sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: sc.data.relieved ? 'relieved' : 'shaken', slots: { gone: sc.data.gone } }),
  'tj-house-meeting': sc => ({ roles: { a: sc.data.victim }, ending: 'any', slots: { gone: sc.data.gone } }),
  // ── the night out (party.js nightDrama) ──
  'party-slip': sc => ({ roles: { a: sc.who[0], b: sc.who[1], c: sc.data.caught || undefined }, ending: sc.data.self ? 'self' : sc.data.caught ? 'caught' : 'told',
    slots: { alliance: sc.data.alliance, target: sc.data.target || undefined } }),
  'party-deal': sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: 'any' }),
  'party-callout': sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: sc.data.firesBack ? 'firesback' : 'walks',
    slots: { beef: (sc.data.why === 'feud' && FEUD_BEEF[sc.data.causeType]) || BEEF[sc.data.why] || BEEF.feud } }),
  'party-tears': sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: sc.data.comforted ? 'comforted' : 'alone' }),
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
  flirt: sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: yes(sc.data.back, 'back', 'rebuffed') }),
  'beach-date': sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: 'any' }),
  pda: sc => ({ roles: { a: sc.who[0], b: sc.who[1], c: sc.who[2] }, ending: 'any' }),
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
  'alliance-betrayal': sc => ({ roles: { a: sc.who[1], b: sc.who[0] }, ending: sc.data.how }),
  'alliance-leave': sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: sc.data.why }),
  'alliance-end': sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: sc.data.why }),
  'rookie-uprising': sc => ({ roles: { a: sc.who[0], b: sc.who[1], c: sc.who[2] }, ending: 'any' }),
  deal: sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: 'any' }),
  'deal-broken': sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: sc.data.how }),
  spark: sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: 'any' }),
  showmance: sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: 'any' }),
  breakup: sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: 'any' }),
  apology: sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: yes(sc.data.accepted, 'accepted', 'rejected') }),
  psyche: sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: sc.data.need, slots: { need: sc.data.need } }),
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
  'overnight-sabotage': sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: 'any' }),
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
  const taken = new Set(Object.values(r.roles));
  const rest = [...(scene.who || []), ...(scene.data?.crowd || [])].filter(n => n && n !== 'TJ' && !taken.has(n));
  ['x', 'y', 'z'].forEach((k, i) => { if (rest[i] && !r.roles[k]) r.roles[k] = rest[i]; });
  r.slots ||= {};
  for (const k of Object.keys(r.slots)) if (r.slots[k] == null) delete r.slots[k];
  return r;
}

// ══════════════════════════════════════════════════════════════════════
// ch/script/ceremony.js — the vote, read out loud
// ══════════════════════════════════════════════════════════════════════
//
// On The Challenge the vote is not secret: TJ asks each player, in front of
// everybody, and they say the name and why. Every voter is shown (the user's
// rule for a reading: show every voter), and the reason is the engine's
// (vote.js: the plan, kept their word, their own read, a false yes, broke
// from the plan, changed their mind). The words are picked from the ballot
// pools with the voter as `a` and the name as `b`.
//
// Ballots carry their own bond at the vote (vote.js), so a reading replayed
// later never reads feelings from after it.
import { writeScene } from './write.js';
import { pronouns } from '../../players.js';
import { stableRng } from '../../script/rng.js';

// ── the room, between the ballots (the user, 2026-10-16: "why aren't they reacting to votes in real time, it's an
// open vote, it should be a drama machine: suspense, clashes, crying, betrayal") ──
// Read off the ballot the engine cast (vote.js): a friend saying your name, a name that was not the one promised,
// an enemy saying it, the count getting close. Words only; what it costs is the engine's (voteFallout).
const P = (n, k) => pronouns(n)?.[k] || ({ sub: 'they', obj: 'them', posAdj: 'their', ref: 'themself' })[k];
const REACT = {
  hurt: [
    (v, t) => [['beat', `${t} turns around on the sofa and stares at ${v}.`], ['say', t, `${v}? Seriously?`], ['say', v, "I'm sorry. I had to."]],
    (v, t) => [['say', t, `Wow. ${v}. Okay.`], ['beat', `${v} won't look at ${t}.`]],
    (v, t) => [['say', t, `You told me this morning I was safe.`], ['say', v, "Things changed."], ['say', t, "Yeah. You did."]],
    (v, t) => [['beat', `${t} laughs, but it isn't a happy laugh.`], ['say', t, `Of all people. You.`]],
  ],
  cry: [
    (v, t) => [['beat', `${t}'s eyes fill up. ${t} looks at the floor and doesn't say anything.`]],
    (v, t) => [['beat', `${t} wipes ${P(t, 'posAdj')} eyes with the back of ${P(t, 'posAdj')} hand.`], ['say', t, "I'm fine. Keep going."]],
  ],
  clash: [
    (v, t) => [['say', t, `Say it to my face, ${v}.`], ['say', v, "I just did."], ['say', t, "Then I'll see you in the Arena."]],
    (v, t) => [['say', t, `Of course it's you. You've wanted me gone since day one.`], ['say', v, "And I'm finally saying it."]],
    (v, t) => [['say', t, `Big words from somebody who's never won anything.`], ['say', v, "Keep talking. It'll make it easier."]],
    (v, t) => [['beat', `${t} stands up. TJ points back at the sofa, and ${t} sits down again.`], ['say', 'TJ', "Easy! Save it for the Arena!"]],
  ],
  shrug: [
    (v, t) => [['say', t, 'Sure. Why not.']],
    (v, t) => [['beat', `${t} just nods.`]],
    (v, t) => [['say', t, "That's fine. That's fine."]],
  ],
  offscript: [
    (v, t, x) => [['beat', `A gasp goes around the room. That is not the name ${v} gave anybody this morning.`], ['say', x || 'TJ', x ? `${v}! What are you doing?` : "Ohhh! Somebody's off script!"]],
    (v, t, x) => [['say', 'TJ', `Whoa. Did not see that one coming.`], ...(x ? [['say', x, `That's not what we said, ${v}.`], ['say', v, "I know what we said."]] : [])],
    (v, t, x) => [['beat', `Heads turn. Everybody in ${v}'s group looks at ${v} at once.`]],
  ],
  tie: [
    (a, b, n) => [['say', 'TJ', `That's ${n} for ${a} and ${n} for ${b}. Dead even! Who's next?`]],
    (a, b, n) => [['say', 'TJ', `Ooh, neck and neck. ${a}, ${b}, ${n} each. I love it.`]],
    (a, b, n) => [['beat', `It's ${n} each for ${a} and ${b}. Nobody in the room is breathing.`]],
  ],
  lead: [
    (a, n, left) => [['say', 'TJ', `That's ${n} for ${a}, and ${left} still to vote. It's not over yet.`]],
    (a, n, left) => [['beat', `${cap(n)} votes for ${a} now. ${a} has gone very still.`]],
  ],
  sealed: [
    (a, n) => [['say', 'TJ', `And that's ${n}. Nobody can catch that. ${a}, I'm sorry, buddy.`], ['beat', `${a} closes ${P(a, 'posAdj')} eyes.`]],
    (a, n) => [['beat', `That's the one. ${a} knows it before TJ says a word.`]],
  ],
};
const pickR = (key, seed, used) => {
  const list = REACT[key], rng = stableRng(seed, 'react');
  const order = list.map((f, i) => i).sort(() => rng() - 0.5);
  const i = order.find(k => !used.has(`${key}:${k}`));
  // every version already heard tonight: the room stays quiet rather than say it twice
  if (i == null) return () => [];
  used.add(`${key}:${i}`);
  return list[i];
};
const cap = t => t.charAt(0).toUpperCase() + t.slice(1);
const asLines = rows => rows.map(([kind, by, text]) => (kind === 'beat' ? { kind: 'beat', by: null, text: by } : { kind: 'say', by, text }));
const WORD = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
const w = n => WORD[n] || String(n);

const WHY = {
  'the plan': 'plan', 'kept their word': 'word', 'own read': 'own', 'false yes': 'falseyes',
  'broke from the plan': 'broke', 'changed their mind': 'changed',
};

function synthetic(state, ep, day, kind, who, data, bond) {
  return { id: `${kind}:${ep}:${who.join('>')}`, ep, day, kind, who, data, seenBy: state.cast, spot: 'deliberation',
    snap: { bond, house: data.house } };
}

export function writeVote(state, epRec, vote, day) {
  const out = [];
  const house = vote.ballots.length;
  const open = writeScene(state, synthetic(state, epRec.ep, day, 'cer-open', [vote.ballots[0]?.voter], { house, division: epRec.division }, 0));
  if (open) out.push({ kind: 'cer-open', script: open });
  // a reaction heard at the first vote of a double-elimination night is not heard again at the second
  const day0 = ((state.reactUsed ||= {})[day] ||= {});
  const run = {}, used = { has: k => !!day0[k], add: k => { day0[k] = 1; } };
  let sealed = false;
  const need = Math.floor(house / 2) + 1;
  vote.ballots.forEach((b, k) => {
    const own = (WHY[b.why] || 'own') === 'own' && b.reason;
    const sc = own ? synthetic(state, epRec.ep, day, 'ballot-why', [b.voter, b.target], { reason: b.reason, house }, b.bond)
      : synthetic(state, epRec.ep, day, 'ballot', [b.voter, b.target], { why: WHY[b.why] || 'own', flip: b.flip, house }, b.bond);
    let script = writeScene(state, sc) || (own ? writeScene(state, synthetic(state, epRec.ep, day, 'ballot', [b.voter, b.target], { why: 'own', house }, b.bond)) : null);
    run[b.target] = (run[b.target] || 0) + 1;
    // the room
    const seed = `${state.seed}|${epRec.ep}|${k}|${b.voter}`;
    const roll = stableRng(seed, 'r')();
    const rows = [];
    const t = b.target, v = b.voter, left = vote.ballots.length - k - 1;
    // off script: only somebody who broke from a plan they were part of, called out by somebody who stuck to it
    const stuck = b.asked && b.asked !== t ? vote.ballots.slice(0, k).find(x => x.target === b.asked && x.asked === b.asked && x.voter !== t)?.voter : null;
    if (b.flip && b.asked && b.asked !== t && (stuck || roll < 0.5)) rows.push(...pickR('offscript', seed, used)(v, t, stuck || null));
    else if (b.bond >= 2.5) { rows.push(...pickR('hurt', seed, used)(v, t)); if (b.bond >= 4 && roll < 0.6) rows.push(...pickR('cry', seed + 'c', used)(v, t)); }
    else if (b.bond <= -2 && roll < 0.75) rows.push(...pickR('clash', seed, used)(v, t));
    else if (roll < 0.12) rows.push(...pickR('shrug', seed, used)(v, t));
    // the count: close at the top, or decided
    const top = Object.entries(run).sort((x, y) => y[1] - x[1]);
    if (!sealed && top[0][1] >= need) { sealed = true; rows.push(...pickR('sealed', seed + 's', used)(top[0][0], w(top[0][1]))); }
    else if (!sealed && k >= 5 && top[1] && top[0][1] === top[1][1] && top[0][0] === t) rows.push(...pickR('tie', seed + 't', used)(top[0][0], top[1][0], w(top[0][1])));
    else if (!sealed && k >= 4 && top[0][0] === t && top[0][1] >= 3 && (k % 4 === 0) && left > 2) rows.push(...pickR('lead', seed + 'l', used)(t, w(top[0][1]), w(left)));
    if (rows.length && script) script = { ...script, lines: [...script.lines, ...asLines(rows)] };
    out.push({ kind: 'ballot', voter: b.voter, target: b.target, why: b.why, script });
  });
  const tally = Object.entries(vote.tally).sort((x, y) => y[1] - x[1]);
  const WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve',
    'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty', 'twenty-one', 'twenty-two', 'twenty-three'];
  const res = vote.tribunal
    ? writeScene(state, synthetic(state, epRec.ep, day, 'cer-nominees', vote.tribunal.nominees, { house, tribunal: vote.tribunal.tribunal }, 0))
    : writeScene(state, synthetic(state, epRec.ep, day, 'cer-result', [vote.votedIn],
      { count: WORDS[tally[0][1]] || String(tally[0][1]), tie: !!vote.tiebreak, house }, 0));
  if (res) out.push({ kind: 'cer-result', script: res });
  return out;
}

export { WHY };

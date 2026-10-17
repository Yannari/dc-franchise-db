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
import { writeScene, voicedLine } from './write.js';
import { pronouns } from '../../players.js';
import { stableRng } from '../../script/rng.js';

// ── the room, between the ballots (the user, 2026-10-16: "why aren't they reacting to votes in real time, it's an
// open vote, it should be a drama machine: suspense, clashes, crying, betrayal") ──
// Read off the ballot the engine cast (vote.js): a friend saying your name, a name that was not the one promised,
// an enemy saying it, the count getting close. Words only; what it costs is the engine's (voteFallout).
const P = (n, k) => pronouns(n)?.[k] || ({ sub: 'they', obj: 'them', posAdj: 'their', ref: 'themself' })[k];
// A spoken reaction can carry its variants by voice family (sharp, dry, loud, soft, odd): the 4th element of a row.
// They are resolved for the speaker as the pools' are (write.js voicedLine), so the room sounds like who is in it.
const S = (by, text, v) => ['say', by, text, v];
const REACT = {
  hurt: [
    (v, t) => [['beat', `${t} turns around on the sofa and stares at ${v}.`], S(t, `${v}? Seriously?`, {
      sharp: [`Really, ${v}? Interesting.`, `${v}. I'll remember that.`], dry: [`${v}. Huh.`, `Okay. ${v}. Noted, I guess.`],
      loud: [`${v}?! SERIOUSLY?!`, `Are you KIDDING me, ${v}?`], soft: [`${v}? I thought we were okay.`, `Oh. ${v}. Wow.`],
      odd: [`${v}? My ${v}? Rude.`, `Wait, ${v}? Did I hear that right?`] }),
      S(v, "I'm sorry. I had to.", { sharp: ["It was the right call. Sorry."], dry: ["It was a vote. I'm sorry."], loud: ["I had to! I'm sorry!"],
        soft: ["I'm so sorry. I really had to."], odd: ["Sorry! Please don't hate me forever. Maybe a week."] })],
    (v, t) => [S(t, `Wow. ${v}. Okay.`, { sharp: [`Noted, ${v}.`], dry: [`Okay. ${v}. Sure.`], loud: [`WOW, ${v}! Okay!`],
      soft: [`${v}... really?`], odd: [`Okay. ${v}. Cool cool cool.`] }), ['beat', `${v} won't look at ${t}.`]],
    (v, t) => [S(t, 'You told me this morning I was safe.', { sharp: ['This morning I was safe. Funny how that works.'], dry: ['This morning you told me I was safe.'],
      loud: ['You TOLD me I was SAFE!'], soft: ['You said I was safe. You told me this morning.'], odd: ['This morning I was safe. What happened between breakfast and now?'] }),
    S(v, 'Things changed.', { sharp: ['Things change. That\'s the game.'], dry: ['It changed.'], loud: ['Things CHANGED!'], soft: ['I know. Things changed. I\'m sorry.'], odd: ['Lunch happened. Things changed.'] }),
    S(t, 'Yeah. You did.', { sharp: ['You changed. That\'s the part I\'ll remember.'], dry: ['You did, yeah.'], loud: ['YOU changed!'], soft: ['Yeah. You did.'], odd: ['You sure did. Wow.'] })],
    (v, t) => [['beat', `${t} laughs, but it isn't a happy laugh.`], S(t, 'Of all people. You.', { sharp: ['You. Of course it\'s you.'], dry: ['You. Of all people.'],
      loud: ['YOU?! Of ALL people?!'], soft: ['You. I didn\'t think it would be you.'], odd: ['Of all the people in this room. You. Incredible.'] })],
  ],
  cry: [
    (v, t) => [['beat', `${t}'s eyes fill up. ${t} looks at the floor and doesn't say anything.`]],
    (v, t) => [['beat', `${t} wipes ${P(t, 'posAdj')} eyes with the back of ${P(t, 'posAdj')} hand.`], S(t, "I'm fine. Keep going.", {
      sharp: ["Don't stop for me. Keep going."], dry: ["I'm fine. Next."], loud: ["I'm FINE! Keep going!"], soft: ["Sorry. I'm okay. Keep going."], odd: ["Allergies. Big allergies. Keep going."] })],
  ],
  clash: [
    (v, t) => [S(t, `Say it to my face, ${v}.`, { sharp: [`Look at me when you say it, ${v}.`], dry: [`To my face, ${v}.`], loud: [`SAY IT TO MY FACE, ${v}!`],
      soft: [`At least look at me, ${v}.`], odd: [`Turn around and say it, ${v}. I'm right here. Hi.`] }),
    S(v, 'I just did.', { sharp: ['I just did. Want me to say it slower?'], dry: ['I did.'], loud: ['I JUST DID!'], soft: ['I just did. I\'m sorry.'], odd: ['I did! Did you miss it? I can wave.'] }),
    S(t, "Then I'll see you in the Arena.", { sharp: ["Then I'll see you in the Arena. Get ready."], dry: ["Then it's the Arena."], loud: ["THEN I'LL SEE YOU IN THE ARENA!"],
      soft: ["Then I guess I'll see you in the Arena."], odd: ["Then it's a date. The Arena. Wear something nice."] })],
    (v, t) => [S(t, "Of course it's you. You've wanted me gone since day one.", { sharp: ["Of course it's you. You've been waiting for this."], dry: ["Of course it's you."],
      loud: ["OF COURSE it's you! You've wanted me out since DAY ONE!"], soft: ["Of course it's you. You never liked me."], odd: ["Of course it's you. I could have bet money on it. My money's gone, but still."] }),
    S(v, "And I'm finally saying it.", { sharp: ["And now everybody knows it."], dry: ["And now I'm saying it."], loud: ["And I'm finally SAYING it!"], soft: ["I'm just being honest."], odd: ["And it feels great, honestly."] })],
    (v, t) => [S(t, "Big words from somebody who's never had to back them up.", { sharp: ["Big words. Let's see you back them up."], dry: ["Big words."],
      loud: ["BIG words from YOU!"], soft: ["That's a lot of talk."], odd: ["Big words. Huge. Enormous words."] }),
    S(v, "Keep talking. It'll make it easier.", { sharp: ["Keep talking. You're helping me."], dry: ["Keep going. It helps."], loud: ["KEEP TALKING!"],
      soft: ["You're making this easier, you know."], odd: ["Please keep talking. It's very motivating."] })],
    (v, t) => [['beat', `${t} stands up. TJ points back at the sofa, and ${t} sits down again.`], ['say', 'TJ', "Easy! Save it for the Arena!"]],
  ],
  shrug: [
    (v, t) => [S(t, 'Sure. Why not.', { sharp: ['Of course. Why not.'], dry: ['Sure.'], loud: ['Sure! Why NOT!'], soft: ['Okay. That\'s okay.'], odd: ['Sure. Love that for me.'] })],
    (v, t) => [['beat', `${t} just nods.`]],
    (v, t) => [S(t, "That's fine. That's fine.", { sharp: ["That's fine. I'll remember it."], dry: ["Fine."], loud: ["That's FINE!"], soft: ["It's okay. It's fine."], odd: ["That's fine. Everything is fine. I'm fine."] })],
  ],
  offscript: [
    (v, t, x) => [['beat', `A gasp goes around the room. That is not the name ${v} gave anybody this morning.`], x
      ? S(x, `${v}! What are you doing?`, { sharp: [`${v}. What was that?`], dry: [`${v}, what are you doing?`], loud: [`${v}! WHAT are you DOING?!`],
        soft: [`${v}? That's not what we said.`], odd: [`${v}! That's the wrong name! Is it? It's the wrong name!`] })
      : ['say', 'TJ', "Ohhh! Somebody's off script!"]],
    (v, t, x) => [['say', 'TJ', `Whoa. Did not see that one coming.`], ...(x ? [S(x, `That's not what we said, ${v}.`, { sharp: [`That's not the plan, ${v}.`],
      dry: [`That wasn't the name, ${v}.`], loud: [`That is NOT what we said, ${v}!`], soft: [`${v}... that's not what we agreed.`], odd: [`Did you forget the name, ${v}? It was a short name.`] }),
    S(v, 'I know what we said.', { sharp: ['I know exactly what we said.'], dry: ['I know.'], loud: ['I KNOW what we said!'], soft: ['I know. I\'m sorry. I couldn\'t.'], odd: ['I know! I changed it! Surprise!'] })] : [])],
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
  // a Pairs season: the count is for two people (`a` is "Brody and Hannah")
  sealedPair: [
    (a, n) => [['say', 'TJ', `And that's ${n}. Nobody's catching that. ${a}, I'm sorry, guys.`], ['beat', `${a} look at each other and don't say a word.`]],
    (a, n) => [['beat', `That's the one. ${a} know it before TJ opens his mouth.`]],
    (a, n) => [['say', 'TJ', `${cap(n)} votes. That's it, that's the number. ${a}, pack a bag. You're going in together.`]],
  ],
  leadPair: [
    (a, n, left) => [['say', 'TJ', `That's ${n} for ${a}, and ${left} still to vote. Don't get comfortable, either of you.`]],
    (a, n, left) => [['beat', `${cap(n)} votes for ${a} now. One of them grabs the other's hand.`]],
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
// a spoken reaction in the speaker's voice when it has one (the variants of a row), as the pools' lines are
const asLines = (rows, state, day, seed) => rows.map(([kind, by, text, v]) => {
  if (kind === 'beat') return { kind: 'beat', by: null, text: by };
  if (!v || by === 'TJ') return { kind: 'say', by, text };
  const said = voicedLine({ say: text, v }, by, { rng: stableRng(seed, `v|${by}`), ledger: state.lineLedger, day });
  return { kind: 'say', by, text: said.text, voice: said.tag };
});
const WORD = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen',
  'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty', 'twenty-one', 'twenty-two', 'twenty-three'];
const w = n => WORD[n] || String(n);

const WHY = {
  'the plan': 'plan', 'kept their word': 'word', 'own read': 'own', 'false yes': 'falseyes',
  'broke from the plan': 'broke', 'changed their mind': 'changed',
};

let voteTeam = null;   // the team whose vote writeVote is writing (a Teams season), or null
function synthetic(state, ep, day, kind, who, data, bond, partners = null) {
  // a Teams season's vote is one team's (teams.js): its lines read the '~teams' pools, where the house is the team.
  // The vote says so itself (vote.team): the episode is written after the season, when the teams may be long broken.
  const teams = voteTeam ? Object.fromEntries(who.filter(Boolean).map(n => [n, voteTeam])) : null;
  return { id: `${kind}:${ep}:${who.join('>')}`, ep, day, kind, who, data, seenBy: state.cast, spot: 'deliberation',
    snap: { bond, house: data.house, ...(partners ? { partners } : {}), ...(teams ? { teams } : {}) } };
}
// A Pairs season's ballot names a pair (vote.js: the target is the pair's representative, `named` the one the voter
// meant, `pair` both). The lines say both names ({b} and {pb}); the room reacts through the one the voter meant.
const pairOfBallot = b => (b.pair ? { named: b.named || b.target, partner: b.pair.find(x => x !== (b.named || b.target)) } : null);

export function writeVote(state, epRec, vote, day) {
  voteTeam = vote.team || null;
  try { return writeVoteOf(state, epRec, vote, day); } finally { voteTeam = null; }
}
function writeVoteOf(state, epRec, vote, day) {
  const out = [];
  const house = vote.ballots.length;
  // a Teams season's vote is the losing team's (teams.js): TJ opens it to that team; the winners voting their own in is rarer still
  const open = writeScene(state, synthetic(state, epRec.ep, day, 'cer-open', [vote.ballots[0]?.voter], { house, division: epRec.division,
    ...(vote.team ? { team: vote.team, teams: true, own: !!vote.winners } : {}) }, 0));
  if (open) out.push({ kind: 'cer-open', script: open });
  // a reaction heard at the first vote of a double-elimination night is not heard again at the second
  const day0 = ((state.reactUsed ||= {})[day] ||= {});
  const run = {}, used = { has: k => !!day0[k], add: k => { day0[k] = 1; } };
  let sealed = false;
  const need = Math.floor(house / 2) + 1;
  vote.ballots.forEach((b, k) => {
    const own = (WHY[b.why] || 'own') === 'own' && b.reason;
    const pb = pairOfBallot(b);
    const named = pb ? pb.named : b.target;
    const partners = pb && pb.partner ? { [pb.named]: pb.partner } : null;
    const sc = own ? synthetic(state, epRec.ep, day, 'ballot-why', [b.voter, named], { reason: b.reason, house, on: b.on || null }, b.bond, partners)
      : synthetic(state, epRec.ep, day, 'ballot', [b.voter, named], { why: WHY[b.why] || 'own', flip: b.flip, house }, b.bond, partners);
    let script = writeScene(state, sc) || (own ? writeScene(state, synthetic(state, epRec.ep, day, 'ballot', [b.voter, named], { why: 'own', house }, b.bond, partners)) : null);
    run[b.target] = (run[b.target] || 0) + 1;
    // the room
    const seed = `${state.seed}|${epRec.ep}|${k}|${b.voter}`;
    const roll = stableRng(seed, 'r')();
    const rows = [];
    // the one who hears it (in a Pairs season, the one the voter meant), and the name the count is read for
    const t = named, v = b.voter, left = vote.ballots.length - k - 1;
    const tally = n => (state.options?.pairs && vote.ballots.find(x => x.target === n)?.pair ? vote.ballots.find(x => x.target === n).pair.join(' and ') : n);
    // off script: only somebody who broke from a plan they were part of, called out by somebody who stuck to it
    const stuck = b.asked && b.asked !== t ? vote.ballots.slice(0, k).find(x => x.target === b.asked && x.asked === b.asked && x.voter !== t)?.voter : null;
    if (b.flip && b.asked && b.asked !== t && (stuck || roll < 0.5)) rows.push(...pickR('offscript', seed, used)(v, t, stuck || null));
    else if (b.bond >= 2.5) { rows.push(...pickR('hurt', seed, used)(v, t)); if (b.bond >= 4 && roll < 0.6) rows.push(...pickR('cry', seed + 'c', used)(v, t)); }
    else if (b.bond <= -2 && roll < 0.75) rows.push(...pickR('clash', seed, used)(v, t));
    else if (roll < 0.12) rows.push(...pickR('shrug', seed, used)(v, t));
    // the count: close at the top, or decided
    const top = Object.entries(run).sort((x, y) => y[1] - x[1]);
    if (!sealed && top[0][1] >= need) { sealed = true; rows.push(...pickR(pb ? 'sealedPair' : 'sealed', seed + 's', used)(tally(top[0][0]), w(top[0][1]))); }
    else if (!sealed && k >= 5 && top[1] && top[0][1] === top[1][1] && top[0][0] === b.target) rows.push(...pickR('tie', seed + 't', used)(tally(top[0][0]), tally(top[1][0]), w(top[0][1])));
    else if (!sealed && k >= 4 && top[0][0] === b.target && top[0][1] >= 3 && (k % 4 === 0) && left > 2) rows.push(...pickR(pb ? 'leadPair' : 'lead', seed + 'l', used)(tally(b.target), w(top[0][1]), w(left)));
    if (rows.length && script) script = { ...script, lines: [...script.lines, ...asLines(rows, state, day, seed)] };
    out.push({ kind: 'ballot', voter: b.voter, target: b.target, why: b.why, script });
  });
  const tally = Object.entries(vote.tally).sort((x, y) => y[1] - x[1]);
  const WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve',
    'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty', 'twenty-one', 'twenty-two', 'twenty-three'];
  // a Pairs season's nominees are pairs: each one's partner, from the ballots (a nominee nobody named: the pair as it stands)
  const nomPartners = state.options?.pairs ? Object.fromEntries(vote.tribunal?.nominees?.map(n => [n, vote.ballots.find(x => x.target === n)?.pair?.find(x => x !== n) || state.partnerOf?.[n]]).filter(([, p]) => p) || []) : null;
  const res = vote.tribunal
    ? writeScene(state, synthetic(state, epRec.ep, day, 'cer-nominees', vote.tribunal.nominees, { house, tribunal: vote.tribunal.tribunal }, 0, nomPartners))
    : writeScene(state, synthetic(state, epRec.ep, day, 'cer-result', [vote.votedIn],
      { count: WORDS[tally[0][1]] || String(tally[0][1]), tie: !!vote.tiebreak, house }, 0,
      vote.ballots.find(x => x.target === vote.votedIn)?.pair ? { [vote.votedIn]: vote.ballots.find(x => x.target === vote.votedIn).pair.find(x => x !== vote.votedIn) } : null));
  if (res) out.push({ kind: 'cer-result', script: res });
  return out;
}

export { WHY };

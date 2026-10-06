// ══════════════════════════════════════════════════════════════════════
// dr/data/wsg-lines.js — "Who should go home tonight, and why?", out loud
// ══════════════════════════════════════════════════════════════════════
//
// js/dr/critiques.js whoShouldGoHome decides every answer: who each queen
// names and WHY (the reason table measured off the fandom's 129 real
// answers). These are the words. The screen (js/vp-dr/wsg-stage.js) speaks
// them; Untucked (js/dr/stage.js runUntucked) throws them back.
//
//   WSG_ASK            the host asks; {a} is the queen being asked
//   WSG_ANSWER[reason] what she says after the name ({b} is who she named,
//                      written without the name: the screen puts "Gwen." first)
//   WSG_SELF           she names herself
//   WSG_REACT[tone]    the named queen answers back; {a} named, {b} the namer.
//                      friend: it hurt. rival: she expected it. neutral: noted.
//   WSG_REACT_THREAT   named as the biggest threat: she hears a compliment
//   WSG_SELF_REACT     the room, when a queen names herself ({a})
//   WSG_CLOSE          the host closes the question
//   WSG_QUOTE          Untucked: {a} throws {b}'s words back; {q} is the answer
//
// The pick is a hash of who, whom and the episode — never the season's dice,
// so adding words cannot move a result, and the stage and Untucked land on
// the same sentence without passing it around.

export const WSG_ASK = [
  '{a}. Who should go home tonight, and why?',
  '{a}, I want you to tell me who should go home tonight. And why.',
  '{a}. If you could choose, who goes home tonight?',
  'Now, {a}. Who should pack her bags tonight, and why?',
  '{a}, the floor is yours. Who should go home?',
  '{a}. One name. Who should go home tonight?',
  "Let\'s hear it, {a}. Who should go home, and why?",
  "{a}, you've heard the critiques. Who goes home tonight?",
  '{a}. Look down the line. Who should go home?',
  '{a}. Who should go home tonight, and tell me why.',
];

export const WSG_ANSWER = {
  challenge: [
    'Tonight her performance was the weakest on that stage, and everybody saw it.',
    'She had the whole week and she still did not deliver in the challenge.',
    'I love her, but tonight the challenge ate her alive.',
    'The challenge was the assignment, and she did not do the assignment.',
    'She was lost out there tonight. You could see it from the back row.',
    'Her performance tonight was not the level of this competition.',
  ],
  runway: [
    'That was not a runway look. That was a costume somebody forgot to finish.',
    'The category was clear, and she walked out in something else entirely.',
    'Her runway tonight was the weakest of the night. It is not even close.',
    'She came out on that runway looking like rehearsal, not the show.',
    'The look did not fit, the walk did not sell it, and the judges saw it.',
    'Tonight her runway told me she ran out of time and ideas.',
  ],
  season: [
    'Look at her track record. She has been coasting since day one.',
    'She has been in the bottom more than anybody left in this room.',
    'Week after week, she has not shown me why she is still here.',
    'Her track record speaks for itself. Mine does too.',
    'She has had chance after chance. At some point it has to be her.',
    'Nothing she has done this season says winner to me.',
  ],
  critiques: [
    'You heard the judges. I am only repeating what they told her.',
    'The critiques tonight said it all. I do not need to add anything.',
    'After what the panel just said to her, I think the answer is obvious.',
    'The judges were not kind tonight, and they were right.',
    'Every critique tonight pointed at her. I am just agreeing.',
    'The panel already made the case. I am only saying it out loud.',
  ],
  threat: [
    'Honestly? She is my biggest competition, and I want her gone.',
    'Because she is the one I would hate to face in the finale.',
    'She is the strongest queen here, and I came to win.',
    'It is a competition. She is the one standing between me and that crown.',
    'If she stays, she wins. I am not stupid.',
    'She is a threat, Mama. I am not going to pretend otherwise.',
    'I want her gone so I can finally have a chance at winning something.',
    'As long as she is here, the rest of us are fighting for second.',
    'Honestly? With her out of the way, that crown is mine.',
    'She wins everything. Send her home and give the rest of us a shot.',
    "I am not going to lie to you. She is the one I can't beat.",
    'Strategy, Mama. She is the frontrunner, and I want her out.',
  ],
  leader: [
    'She was our team leader, and the team failed. That is on her.',
    "She took the captain\'s job, and she should own how it went.",
    'She led us into the ground tonight. A leader takes the fall.',
    'We did what she told us to do. That is why we were in the bottom.',
    'She wanted to be in charge. Being in charge means this too.',
    'Our team never had a plan, and she was the one meant to have it.',
  ],
  immunity: [
    'I know she is safe tonight. I am naming her anyway, on principle.',
    'She has immunity, so this costs her nothing. I just want it said.',
    'She cannot go home, but if she could, it would be her.',
    'Immunity or not, she had the weakest week of anybody.',
    'She is protected tonight. She should not be.',
    'I am saying her name so the judges remember it next week.',
  ],
};

export const WSG_SELF = [
  'Me. I did not bring it tonight, and I know it.',
  'Honestly? Me. I let myself down this week.',
  'Me. Everybody else fought harder than I did.',
  'I have to say me. I would not keep me after tonight.',
  'It should be me. And it breaks my heart to say it.',
  'Me, Mama. I am not going to throw a sister under the bus for my week.',
];

export const WSG_REACT = {
  friend: [
    'Wow. Okay. I did not expect that from you, {b}.',
    'Of all people, {b}? Noted.',
    '{b}, really? After everything this week?',
    'I would never have said your name. Just so you know.',
    'Okay. That one hurts more than the critiques did.',
    'I thought we were friends, {b}. I guess I was wrong.',
    'I covered for you all week, {b}. Wow.',
    'You could have said anybody, {b}. Anybody.',
  ],
  rival: [
    'Of course she said my name. Shocker.',
    'Mm-hmm. I would have said hers too.',
    'That is cute, {b}. Truly. Very cute.',
    'She is scared of me, and now everybody knows it.',
    'Thank you, {b}. I will remember that.',
    'Say it again, {b}. Slower.',
    'Keep that same energy backstage, {b}.',
    'Bold of you, {b}, considering your week.',
  ],
  neutral: [
    'Okay. Fair enough, I guess.',
    'Noted, {b}. Noted.',
    'I hear it. I do not agree with it, but I hear it.',
    'That is her opinion, and she is entitled to it.',
    'I was not expecting my name. But okay.',
    'Fine. I will just have to prove her wrong.',
    "Interesting choice. We'll talk later.",
    'Okay, {b}. I heard you loud and clear.',
    "That's one opinion. The judges will have theirs.",
    'Alright. I guess I have something to prove now.',
  ],
};

// Named as the biggest threat: the backhanded compliment ({a} named, {b} the namer).
export const WSG_REACT_THREAT = [
  "So I'm the one to beat. Thank you for the compliment, {b}.",
  "She just told the whole panel I'm winning. I'll take it.",
  'Scared, {b}? You should be.',
  'If you have to say my name to win, you already lost.',
  'Funny. I never once thought about you, {b}.',
  "That's not a critique, that's a confession.",
];

export const WSG_SELF_REACT = [
  'Nobody on that stage moves. {a} said her own name.',
  "A sister reaches for {a}\'s hand. The host lets the moment sit.",
  'The whole line turns to look at {a}. Nobody expected that answer.',
  '{a} holds her chin up. The room goes completely quiet.',
  "Even the host pauses after {a}\'s answer.",
  'Somebody whispers "no" under her breath. {a} does not take it back.',
];

export const WSG_CLOSE = [
  'Thank you, ladies. The judges and I will now deliberate.',
  'Thank you, ladies. You may leave the stage while we deliberate.',
  'Well. That was illuminating. Ladies, you may leave the stage.',
  'Thank you for your honesty, ladies. Now, while you untuck backstage, the judges and I will deliberate.',
  'Interesting. Very interesting. Ladies, please leave the stage.',
  'Thank you, ladies. Now go backstage and talk about it. I know you will.',
];

export const WSG_QUOTE = [
  '{a} walks into the lounge and does not sit down. She looks straight at {b}. "{q} Your words, on the main stage. I heard every one of them."',
  '{a} has not even reached the couch. "{q} That is what you said about me, {b}. Say it again in here."',
  '{a} pours a drink and turns to {b}. "{q} You want to explain that one to my face?"',
  '"I just want to make sure I heard you right, {b}." {a} repeats it slowly. "{q}"',
  'The door has barely shut when {a} says it back to {b}, word for word: "{q}" The room goes quiet.',
  '{a} sits down across from {b}. "{q} I have been hearing that on a loop since we left the stage."',
];

/** A stable pick: who, whom and the episode — never the season's dice. */
export function wsgPick(list, ...keys) {
  if (!list || !list.length) return '';
  let h = 2166136261;
  for (const ch of keys.join('|')) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
  return list[(h >>> 0) % list.length];
}

/** The same stable pick, stepping past anything already said tonight. */
function pickFresh(list, used, ...keys) {
  if (!list || !list.length) return '';
  let h = 2166136261;
  for (const ch of keys.join('|')) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
  const start = (h >>> 0) % list.length;
  for (let i = 0; i < list.length; i++) {
    const line = list[(start + i) % list.length];
    if (!used.has(line)) { used.add(line); return line; }
  }
  return list[start];
}

/** How the named queen takes it: a friend's name hurts, a rival's she expected. */
export function wsgToneOf(bond) {
  return bond >= 3 ? 'friend' : bond <= -2 ? 'rival' : 'neutral';
}


const fillAB = (t, a, b) => String(t || '').replace(/\{a\}/g, a || '').replace(/\{b\}/g, b || '');

/**
 * The night as data, one entry per click: the host asks, she names, the
 * named queen answers back; then the board. `votes` is
 * js/dr/critiques.js's `{ voter: { target, reason, tone } }`. Pure: the
 * screen draws it, the scene's text is its transcript, the tests read it.
 */
export function wsgScript(votes, ep) {
  const out = [];
  const tally = {};
  // Nobody in one night says the same sentence twice, and nor does the host.
  const used = new Set();
  for (const [voter, v] of Object.entries(votes || {})) {
    const target = v?.target;
    if (!target) continue;
    const self = voter === target;
    out.push({ t: 'ask', voter, text: fillAB(pickFresh(WSG_ASK, used, 'ask', voter, ep), voter) });
    tally[target] = (tally[target] || 0) + 1;
    // `said`: the words after the name — what Untucked throws back.
    const said = self ? pickFresh(WSG_SELF, used, 'self', voter, ep)
      : pickFresh(WSG_ANSWER[v.reason] || WSG_ANSWER.season, used, 'ans', voter, target, ep);
    out.push({ t: 'name', voter, target, reason: self ? 'herself' : v.reason, self, said,
      text: self ? said : `${target}. ${said}`, tally: { ...tally } });
    const pool = self ? WSG_SELF_REACT : v.reason === 'threat' ? WSG_REACT_THREAT : (WSG_REACT[v.tone] || WSG_REACT.neutral);
    out.push({ t: 'react', voter, target, self, text: fillAB(pickFresh(pool, used, 'react', voter, target, ep), target, voter), tally: { ...tally } });
  }
  if (out.length) out.push({ t: 'board', tally: { ...tally }, text: wsgPick(WSG_CLOSE, 'close', ep) });
  return out;
}

/** What `voter` said about the queen she named, word for word (for Untucked). */
export function wsgSaidBy(votes, ep, voter) {
  return wsgScript(votes, ep).find(s => s.t === 'name' && s.voter === voter)?.said || '';
}

/** The transcript, for the text backlog: who said what, in order. */
export function wsgTranscript(votes, ep) {
  return wsgScript(votes, ep).map(s => s.t === 'ask' || s.t === 'board' ? `The host: "${s.text}"`
    : s.t === 'react' && s.self ? s.text
      : `${s.t === 'react' ? s.target : s.voter}: "${s.text}"`).join(String.fromCharCode(10));
}

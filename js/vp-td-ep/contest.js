// ══════════════════════════════════════════════════════════════════════
// vp-td-ep/contest.js — a head-to-head on the stage: the Redemption duel and the tiebreaker
// ══════════════════════════════════════════════════════════════════════
//
// PURE. The engine decided the contest (rescue-island.js simulateRIDuel: the challenge, every
// round and who took it; episode.js runTiebreakerChallenge: who won). This stages it: where the
// two stand on each venue's arena, how they move doing THAT challenge (sparks at a fire, a sway on
// a perch, a climb, a carry, a puzzle), what they say while they do it (to themselves, or to each
// other the way their relationship talks), and how each takes the round and the result.
// (The user, 2026-10-09: "they're not centred and too big, they need animation depending on the
// challenge, and reaction and dialogue too, to themselves or not".)

const hash = s => { let h = 2166136261; for (const c of String(s)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };
const pickBy = (arr, ...k) => arr[hash(k.join('|')) % arr.length];

// Where the contestants stand on each arena (feet, in the frame's fractions; h = height in % of the
// frame): two on the left and right of its middle, a third in the middle. Measured on the plates.
export const ARENA = {
  volcano: { h: 16, at: [[.4, .6], [.6, .6], [.5, .61]] },               // Soluna: the platform over the lava
  'challenge-zone': { h: 17, at: [[.3, .62], [.7, .62], [.5, .64]] },     // Wawanakwa: the two mats
  ceremony: { h: 20, at: [[.58, .82], [.74, .82], [.66, .84]] },          // the jet: the ceremony stage
  'bumper-arena': { h: 24, at: [[.36, .88], [.64, .88], [.5, .9]] },      // Stawaki: the arena floor
  'cage-stage': { h: 24, at: [[.37, .9], [.63, .9], [.5, .92]] },         // the film lot: in front of the cages
};
/** The places of a contest's people on its arena, or null when the arena has no measured floor. */
export function arenaPlaces(spot, who) {
  const A = ARENA[spot];
  if (!A) return null;
  const order = who.length === 3 ? [A.at[0], A.at[2], A.at[1]] : A.at;
  return Object.fromEntries(who.map((n, i) => { const [u, v] = order[i % order.length]; return [n, { u, v, s: A.h / 125, h: A.h, crowd: true }]; }));
}

// What the challenge physically is: the animation and the words both follow it.
const STYLE_OF = {
  'fire-making': 'fire', 'rope-chop': 'chop', 'log-roll': 'balance', 'climbing-wall': 'climb', 'endurance-hold': 'balance', 'water-carry': 'carry',
  'hand-on-idol': 'hold', 'slide-puzzle': 'puzzle', 'memory-sequence': 'puzzle',
  'Fire-Making': 'fire', Endurance: 'hold', Strength: 'push', 'Obstacle Course': 'race', Puzzle: 'puzzle',
};
export function contestStyle(idOrLabel, desc = '') {
  if (STYLE_OF[idOrLabel]) return STYLE_OF[idOrLabel];
  const t = `${idOrLabel} ${desc}`.toLowerCase();
  return /fire|flame|torch/.test(t) ? 'fire' : /chop|saw|cut/.test(t) ? 'chop' : /balanc|log|perch|beam/.test(t) ? 'balance' : /climb|wall|rope ladder/.test(t) ? 'climb'
    : /carry|bucket|haul|water/.test(t) ? 'carry' : /puzzle|memor|sequence|maze|riddle/.test(t) ? 'puzzle' : /push|pull|tug|wrestl|strength/.test(t) ? 'push'
    : /race|run|course|sprint|swim/.test(t) ? 'race' : 'hold';
}

// To themselves, doing it
const SELF = {
  fire: ['Come on, catch. Catch!', 'Gently. Breathe on it gently.', "No, no, no, don't go out on me.", 'There. There it is. Keep going.'],
  chop: ['One more swing. One more.', 'Come on, you stupid rope!', 'My arms are on fire. Keep going.', "It's fraying. It's fraying!"],
  balance: ["Don't look down. Don't look down.", 'Easy. Easy.', 'Feet still. Feet still.', 'I can stand here all day. I can.'],
  climb: ['Next hold. Just the next hold.', "Don't look down.", 'Almost there. Almost.', 'Come on, legs, push!'],
  carry: ['Stop leaking! Stop leaking!', 'Faster. Faster!', 'Half a bucket. Come on.', "Don't spill it. Don't spill it."],
  puzzle: ['That piece goes... no. There.', 'Think. Think.', 'Okay. Okay, I see it now.', "Where's the corner? Where's the corner?"],
  push: ['Hold! Hold it!', 'Not today!', 'Dig in. Dig in!', 'Come on!'],
  race: ['Go, go, go!', 'Move!', 'Almost there!', "Don't trip. Don't trip."],
  hold: ["Don't let go. Don't let go.", 'My hand is shaking. Ignore it.', 'Longer. I can go longer.', "I'm not moving. I'm not moving."],
};
// to each other: a rival needles, a friend pushes, the one behind answers
const NEEDLE = ['Getting tired over there, {x}?', "You can still quit, you know. Nobody would blame you.", "I can see you slowing down, {x}.", 'Is that the best you have?'];
const FRIEND = ["Keep going, {x}! I want to beat you at your best.", "Don't you dare give up on me, {x}.", "You've got this. Just not as much as me."];
const ANSWER = ['Worry about yourself.', "I'm not done!", "I've been worse off than this.", 'Watch me.'];
const ANSWER_FRIEND = ['Right back at you!', "Don't go easy on me.", "I wouldn't dream of it."];
// the round, taken and lost
const TAKE = ['Yes!', "That's one!", 'Come on!', 'Yes! Yes!'];
const DROP = ["No! That's fine. That's fine.", 'Okay. Next one.', "That's not over.", 'Ugh!'];
// the result
const WON = ["I'm still in this game!", "I'm not done yet!", 'Yes! I knew it!', "I told you. I'm not going anywhere."];
const LOST = ["That's it. That's the game for me.", 'I gave it everything I had.', "I can't believe it's over.", "Good game. I mean it."];
const LOST_BITTER = ['Of course. Of course it ends like this.', "I'm not shaking anyone's hand.", 'Enjoy it while it lasts.'];
const fillX = (t, x) => t.replace(/\{x\}/g, x);

/**
 * The talk during one round of a contest: the one behind talking to themselves, and the one ahead
 * either needling them (rivals), pushing them (friends) or saying nothing to them. bond(a, b): the
 * relationship as it stood. Returns say steps.
 */
export function contestTalk({ ahead, behind, style, bond = () => 0, key = '', focus = [] }) {
  const out = [];
  const b = ahead && behind ? bond(ahead, behind) : 0;
  out.push({ k: 'say', by: behind, text: pickBy(SELF[style] || SELF.hold, 'self', key, behind), focus, self: true });
  if (ahead && b <= -1) {
    out.push({ k: 'say', by: ahead, text: fillX(pickBy(NEEDLE, 'needle', key, ahead), behind), focus, loud: true });
    out.push({ k: 'say', by: behind, text: pickBy(ANSWER, 'answer', key, behind), focus });
  } else if (ahead && b >= 3) {
    out.push({ k: 'say', by: ahead, text: fillX(pickBy(FRIEND, 'friend', key, ahead), behind), focus });
    out.push({ k: 'say', by: behind, text: pickBy(ANSWER_FRIEND, 'answerf', key, behind), focus });
  } else if (ahead) out.push({ k: 'say', by: ahead, text: pickBy(SELF[style] || SELF.hold, 'self2', key, ahead), focus, self: true });
  return out;
}
/** A round taken: the winner's shout, the loser's answer, and the motion for both. */
export function roundTaken(winner, loser, key = '', focus = []) {
  return [
    { k: 'say', by: winner, text: pickBy(TAKE, 'take', key, winner), focus, loud: true, act: { kind: 'roundwin', who: [winner], lose: loser ? [loser] : [] } },
    ...(loser ? [{ k: 'say', by: loser, text: pickBy(DROP, 'drop', key, loser), focus }] : []),
  ];
}
/** The result: how the winner and the loser take it, and a handshake between two who get on. */
export function contestResult(winner, loser, { bond = () => 0, key = '', focus = [] } = {}) {
  const b = loser ? bond(winner, loser) : 0;
  const out = [{ k: 'say', by: winner, text: pickBy(WON, 'won', key, winner), focus: [winner], loud: true, act: { kind: 'roundwin', who: [winner], lose: loser ? [loser] : [] } }];
  if (loser) {
    out.push({ k: 'say', by: loser, text: pickBy(b <= -2 ? LOST_BITTER : LOST, 'lost', key, loser), focus: [loser], act: { kind: 'cry', who: b <= -2 ? [] : [loser] } });
    if (b >= 1) out.push({ k: 'beat', text: `${winner} walks over and offers ${loser} a hand. ${loser} takes it.`, focus, act: { kind: 'hug', who: [winner, loser] } });
  }
  return out;
}

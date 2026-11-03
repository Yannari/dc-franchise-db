// Tea Hills, second batch: more of each challenge moment, so a challenge eighteen teams go through doesn't
// play the same four scenes. Same rules as places/tea-hills.js: on the terraces, both pick only the top two leaves and
// the bud into wicker baskets on their backs, and the plantation's oldest picker tips each basket out and checks it;
// on the little steam train, both push from the back carriage to the front one (past passengers, goats, rice sacks and
// chickens) and step off at the Chill Zone's station.
import { V, mergePools } from '../_kit.js';

const TB = { taskId: 'tea-basket' };
const TT = { taskId: 'toy-train' };

const basket = {
  'task-start.any': [
    { id: 'tea2.tb-s1', when: TB, turns: [
      { beat: '{a} straps the basket on. It hangs off {a.posAdj} forehead by a band, and {a} immediately tips backwards.' },
      { by: 'a', say: "It's on my head. Why is it on my head?" },
      { by: 'b', say: "That's how they carry it. Lean forward." },
    ] },
    { id: 'tea2.tb-s2', when: TB, turns: [
      { by: 'b', say: "Pinch and snap. Not pull. If you pull, the stalk comes too." },
      { by: 'a', say: "Pinch and snap. Okay." },
      { by: 'b', say: "That's it." },
    ] },
    { id: 'tea2.tb-s3', when: TB, turns: [
      { beat: 'On the terrace above them, a picker fills her basket without looking at her hands, chatting to her friend the whole time.' },
      { by: 'a', say: "She's not even looking. She's having a whole conversation." },
      { by: 'b', say: "Don't watch her. Just pick." },
    ] },
    { id: 'tea2.tb-s4', when: TB, turns: [
      { by: 'a', say: "Which terrace? Top or bottom?" },
      { by: 'b', ...V("Top. Nobody's picked the top. They all start at the bottom.", "Top. Everyone starts at the bottom.", "Top.", "TOP! Nobody's picked the TOP!", "The top, I think, everyone else started at the bottom.", "The top. Where the untouched leaves are waiting for us.") },
      { by: 'a', say: "Because the top is so far up." },
    ] },
  ],
  'task-try.first-try': [
    { id: 'tea2.tb-f1', when: TB, turns: [
      { beat: 'The old picker tips their basket out onto a cloth, spreads the leaves with one hand, and finds nothing but bright green tips.' },
      { by: 'b', say: "Nothing wrong? Not one stalk?" },
      { beat: 'She folds up the cloth, nods, and hands over the tip.' },
    ] },
    { id: 'tea2.tb-f2', when: TB, turns: [
      { by: 'a', say: "I've been singing the whole time. It keeps my hands in rhythm." },
      { by: 'b', say: "The pickers are singing along." },
      { beat: 'The old picker hums the tune back at {a} as she checks the basket, and hands over the tip.' },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'tea2.tb-a1', when: TB, turns: [
      { by: 'b', say: "We keep picking the dark ones. Old leaves are dark. New ones are light, almost yellow." },
      { beat: 'Light leaves only, almost yellow, all the way up the terrace. The old picker tips the basket out and finally nods.' },
      { by: 'a', say: "The light ones! It worked!" },
    ] },
    { id: 'tea2.tb-a2', when: TB, turns: [
      { beat: 'Second basket. {a} walks along the row beside one of the pickers, matching her hands, bush for bush.' },
      { by: 'a', say: "Whatever she picks, I pick. Whatever she leaves, I leave." },
      { beat: 'The picker laughs, but the basket passes.' },
    ] },
  ],
  'task-try.struggling': [
    { id: 'tea2.tb-t1', when: TB, turns: [
      { by: 'a', say: "There's something crawling on my leaf." },
      { by: 'b', say: "Then don't pick that one." },
      { by: 'a', say: "There's something on every leaf!" },
    ] },
    { id: 'tea2.tb-t2', when: TB, turns: [
      { beat: '{b} looks into {b.posAdj} basket after twenty minutes of picking. The leaves barely cover the bottom.' },
      { by: 'b', say: "I've been picking for twenty minutes and there's nothing in it." },
      { by: 'a', say: "Keep going. It adds up." },
    ] },
  ],
  'attempt-fail.any': [
    { id: 'tea2.tb-x1', when: TB, turns: [
      { beat: 'The old picker tips their basket out. Two twigs and a sweet wrapper come out with the tea.' },
      { by: 'a', say: "The wrapper isn't ours! I swear!" },
      { by: 'b', say: "She doesn't care whose it is. Back up the terraces." },
    ] },
    { id: 'tea2.tb-x2', when: TB, turns: [
      { beat: '{a} carries the basket down the steep path, slips on a wet step, and sits down hard. Half the leaves go over the edge.' },
      { by: 'a', say: "No! The leaves!" },
      { by: 'b', say: "Back up. Pick them again." },
    ] },
  ],
  'task-done.any': [
    { id: 'tea2.tb-dn1', when: TB, turns: [
      { by: 'a', say: "My fingers are green. They smell like tea." },
      { by: 'b', say: "Put them in hot water. Make a cup." },
      { by: 'a', say: "Don't tempt me." },
    ] },
    { id: 'tea2.tb-dn2', when: TB, turns: [
      { beat: '{a} and {b} hand back the empty baskets and bow to the old picker. She bows back, a little lower.' },
      { by: 'b', say: "She bowed lower than us." },
      { by: 'a', say: "Come on. The train." },
    ] },
    { id: 'tea2.tb-dn3', when: TB, turns: [
      { by: 'b', say: "My legs are shaking from the terraces. Up, down, up, down." },
      { by: 'a', say: "Good thing the next bit's a train." },
      { by: 'b', say: "A train we have to walk the whole length of." },
    ] },
  ],
};

const train = {
  'task-start.any': [
    { id: 'tea2.tt-s1', when: TT, turns: [
      { beat: 'The little blue train chugs up to the platform so slowly that {a} and {b} could walk beside it, and climb onto the back.' },
      { by: 'a', say: "It's going slower than us. We could just walk to the station." },
      { by: 'b', say: "The front carriage, remember? Only the front carriage counts." },
    ] },
    { id: 'tea2.tt-s2', when: TT, turns: [
      { by: 'b', say: "I'll go first and say sorry. You come behind me and say thank you." },
      { by: 'a', say: "Okay. Sorry and thank you." },
      { by: 'b', say: "And mind the chickens." },
    ] },
    { id: 'tea2.tt-s3', when: TT, turns: [
      { beat: 'The door between the carriages is blocked by a sack of rice, and on the sack of rice sits an old man, asleep.' },
      { by: 'a', say: "Do we wake him?" },
      { by: 'b', say: "We go over him. Very gently." },
    ] },
    { id: 'tea2.tt-s4', when: TT, turns: [
      { by: 'a', say: "Hold my hand. If we get split up, I'll never find you." },
      { by: 'b', say: "It's a train. We can't get lost." },
      { by: 'a', say: "Hold my hand anyway." },
    ] },
  ],
  'task-try.first-try': [
    { id: 'tea2.tt-f1', when: TT, turns: [
      { beat: 'In every carriage they reach, the passengers shuffle aside with a smile and help them along to the next.' },
      { by: 'b', say: "They're helping us! Everybody's helping!" },
      { by: 'a', say: "Thank you! Thank you!" },
    ] },
    { id: 'tea2.tt-f2', when: TT, turns: [
      { by: 'a', say: "Front carriage. I can see the engine." },
      { beat: 'The train hisses into the station. {a} and {b} step off the front carriage onto the platform, first go.' },
      { by: 'b', say: "Right carriage, right station!" },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'tea2.tt-a1', when: TT, turns: [
      { by: 'b', say: "We keep getting stuck in the doorways. So we wait for the bends. Everybody leans on the bends." },
      { beat: 'On the next bend, the whole carriage leans one way, and {a} and {b} slip through the gap down the other side.' },
      { by: 'a', say: "The bends worked!" },
      { beat: 'Three bends later, they are in the front carriage as it pulls into the station.' },
    ] },
    { id: 'tea2.tt-a2', when: TT, turns: [
      { beat: 'On the second train, {a} offers to carry a woman\'s basket of chickens, and she leads them through three carriages like a guide.' },
      { by: 'a', say: "Helping her worked!" },
      { beat: 'At the front carriage, {a} hands back the chickens, and they step off at the right station.' },
    ] },
  ],
  'task-try.struggling': [
    { id: 'tea2.tt-t1', when: TT, turns: [
      { by: 'a', say: "There's a goat looking at me. It hasn't blinked since the last station." },
      { by: 'b', say: "Go past it." },
      { by: 'a', say: "It's standing in the only gap!" },
    ] },
    { id: 'tea2.tt-t2', when: TT, turns: [
      { beat: '{b} is wedged in the doorway between two carriages, half in one, half in the other, with a sack of rice on each side.' },
      { by: 'b', say: "I'm stuck in the doorway." },
      { by: 'a', say: "Then you're halfway to the next one! Keep squeezing!" },
    ] },
  ],
  'attempt-fail.any': [
    { id: 'tea2.tt-x1', when: TT, turns: [
      { beat: '{a} pushes past a man without saying please. He sighs, stands up, and steps firmly into the doorway. He isn\'t moving now.' },
      { by: 'b', say: "You forgot to say please!" },
      { by: 'a', say: "I was in a hurry! Okay. Off at the next stop, and next time, please." },
    ] },
    { id: 'tea2.tt-x2', when: TT, turns: [
      { beat: 'The train stops at a little station. Everyone around them gets off, and in the rush, so do {a} and {b}.' },
      { by: 'a', say: "Is this it? Why did we get off?" },
      { by: 'b', say: "Because everybody else did! Back up the line! Next train!" },
    ] },
  ],
  'task-done.any': [
    { id: 'tea2.tt-dn1', when: TT, turns: [
      { beat: '{a} and {b} step onto the platform. Behind them, the whole front carriage leans out of the windows to wave goodbye.' },
      { by: 'a', say: "We made friends! A whole carriage of friends!" },
      { by: 'b', say: "They were so nice." },
    ] },
    { id: 'tea2.tt-dn2', when: TT, turns: [
      { by: 'b', say: "There's a feather in your hair." },
      { by: 'a', say: "There are feathers everywhere." },
      { by: 'b', say: "I don't care. Come on." },
    ] },
    { id: 'tea2.tt-dn3', when: TT, turns: [
      { by: 'a', say: "Tea in the morning, train in the afternoon." },
      { by: 'b', say: "If this was a holiday, it would be a lovely one." },
      { by: 'a', say: "It would be lovelier with a seat." },
    ] },
  ],
};

export default mergePools(basket, train);

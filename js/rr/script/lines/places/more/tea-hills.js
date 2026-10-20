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
      { by: 'b', say: "That's how they carry it. Lean forward. Like you're walking into wind." },
    ] },
    { id: 'tea2.tb-s2', when: TB, turns: [
      { by: 'b', say: "Pinch and snap. Not pull. If you pull, the stalk comes too." },
      { by: 'a', say: "Pinch and snap. Like a crab." },
      { by: 'b', say: "Like a very polite crab." },
    ] },
    { id: 'tea2.tb-s3', when: TB, turns: [
      { beat: 'On the terrace above them, a picker fills her basket without looking at her hands, chatting to her friend the whole time.' },
      { by: 'a', say: "She's not even looking. She's having a whole conversation." },
      { by: 'b', say: "Don't watch her. You'll get sad. Pick." },
    ] },
    { id: 'tea2.tb-s4', when: TB, turns: [
      { by: 'a', say: "Which terrace? Top or bottom?" },
      { by: 'b', ...V("Top. Nobody's picked the top. They all start at the bottom.", "Top. Everyone starts at the bottom.", "Top.", "TOP! Nobody's picked the TOP!", "The top, I think, everyone else started at the bottom.", "The top. Where the untouched leaves are waiting for us.") },
      { by: 'a', say: "Everybody starts at the bottom because the top is up a mountain." },
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
      { by: 'b', say: "The pickers have been singing along." },
      { beat: 'The old picker hums the tune back at {a} as she checks the basket, and hands over the tip.' },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'tea2.tb-a1', when: TB, turns: [
      { by: 'b', say: "We keep picking the dark ones. Old leaves are dark. New ones are light, almost yellow." },
      { beat: 'Light leaves only, almost yellow, all the way up the terrace. The old picker tips the basket out and finally nods.' },
      { by: 'a', say: "Yellow-green! I'll know that colour forever!" },
    ] },
    { id: 'tea2.tb-a2', when: TB, turns: [
      { beat: 'Second basket. {a} walks along the row beside one of the pickers, matching her hands, bush for bush.' },
      { by: 'a', say: "Whatever she picks, I pick. Whatever she leaves, I leave." },
      { beat: 'The picker laughs at her shadow, but the basket passes.' },
    ] },
  ],
  'task-try.struggling': [
    { id: 'tea2.tb-t1', when: TB, turns: [
      { by: 'a', say: "There's something crawling on my leaf." },
      { by: 'b', say: "Then don't pick that one." },
      { by: 'a', say: "There's something crawling on every leaf!" },
    ] },
    { id: 'tea2.tb-t2', when: TB, turns: [
      { beat: '{b} looks into {b.posAdj} basket after twenty minutes of picking. The leaves barely cover the bottom.' },
      { by: 'b', say: "I've been picking for twenty minutes and it's a salad." },
      { by: 'a', say: "A small salad. For one person. On a diet." },
    ] },
  ],
  'attempt-fail.any': [
    { id: 'tea2.tb-x1', when: TB, turns: [
      { beat: 'The old picker tips their basket out. A ladybird, two twigs and a sweet wrapper come out with the tea.' },
      { by: 'a', say: "The wrapper isn't ours! I swear!" },
      { by: 'b', say: "She doesn't care whose it is. Back up the terraces." },
    ] },
    { id: 'tea2.tb-x2', when: TB, turns: [
      { beat: '{a} carries the basket down the steep path, slips on a wet step, and sits down hard. Half the leaves go over the edge.' },
      { by: 'a', say: "I've fed the hill." },
      { by: 'b', say: "Back up and pick it a second meal." },
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
      { by: 'b', say: "She out-bowed us." },
      { by: 'a', say: "She out-picked us, too. Train." },
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
      { by: 'a', say: "A sorry and a thank you. Like a manners sandwich." },
      { by: 'b', say: "Exactly. And mind the chickens." },
    ] },
    { id: 'tea2.tt-s3', when: TT, turns: [
      { beat: 'The door between the carriages is blocked by a sack of rice, and on the sack of rice sits an old man, asleep.' },
      { by: 'a', say: "Do we wake him?" },
      { by: 'b', say: "We go over him. Very gently. Like a cat." },
    ] },
    { id: 'tea2.tt-s4', when: TT, turns: [
      { by: 'a', say: "Hold my hand. If we get split up, I'll never find you." },
      { by: 'b', say: "It's a train. It only goes one way." },
      { by: 'a', say: "Hold my hand anyway." },
    ] },
  ],
  'task-try.first-try': [
    { id: 'tea2.tt-f1', when: TT, turns: [
      { beat: 'Every carriage they reach, the passengers shuffle aside with a smile and pass them along to the next, like a parcel.' },
      { by: 'b', say: "They're passing us forward! Hand to hand!" },
      { by: 'a', say: "We're crowd surfing a train!" },
    ] },
    { id: 'tea2.tt-f2', when: TT, turns: [
      { by: 'a', say: "Front carriage. I can see the engine. I can smell the engine." },
      { beat: 'The train hisses into the station. {a} and {b} step off the front carriage onto the platform, first go.' },
      { by: 'b', say: "Right carriage, right station! Nobody stepped on a chicken!" },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'tea2.tt-a1', when: TT, turns: [
      { by: 'b', say: "We keep getting stuck in the doorways. So we wait for the bends. Everybody leans on the bends." },
      { beat: 'On the next bend, the whole carriage leans one way, and {a} and {b} slip through the gap down the other side.' },
      { by: 'a', say: "Bends! We surfed the bends!" },
      { beat: 'Three bends later, they are in the front carriage as it pulls into the station.' },
    ] },
    { id: 'tea2.tt-a2', when: TT, turns: [
      { beat: 'On the second train, {a} offers to carry a woman\'s basket of chickens, and she leads them through three carriages like a guide.' },
      { by: 'a', say: "Carry something for someone, and they'll carry you." },
      { beat: 'At the front carriage, {a} hands back the chickens, and they step off at the right station.' },
    ] },
  ],
  'task-try.struggling': [
    { id: 'tea2.tt-t1', when: TT, turns: [
      { by: 'a', say: "There's a goat looking at me. It hasn't blinked since the last station." },
      { by: 'b', say: "Go past it." },
      { by: 'a', say: "It's standing in the only gap! It's guarding the gap!" },
    ] },
    { id: 'tea2.tt-t2', when: TT, turns: [
      { beat: '{b} is wedged in the doorway between two carriages, half in one, half in the other, with a sack of rice on each side.' },
      { by: 'b', say: "I'm in two carriages at once." },
      { by: 'a', say: "Then you're halfway to the next one! Keep squeezing!" },
    ] },
  ],
  'attempt-fail.any': [
    { id: 'tea2.tt-x1', when: TT, turns: [
      { beat: '{a} pushes past a man without saying please. He sighs, stands up, and steps firmly into the doorway. He isn\'t moving now.' },
      { by: 'b', say: "You forgot to say please!" },
      { by: 'a', say: "I was in a hurry! Off at the next stop and walk back. Next train, every please." },
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
      { by: 'b', say: "And one goat that will never forgive us." },
    ] },
    { id: 'tea2.tt-dn2', when: TT, turns: [
      { by: 'b', say: "There's a feather in your hair." },
      { by: 'a', say: "There's a feather in everything. My pockets. My shoes. My soul." },
      { by: 'b', say: "Walk in proudly. Feathers and all." },
    ] },
    { id: 'tea2.tt-dn3', when: TT, turns: [
      { by: 'a', say: "Tea in the morning, train in the afternoon." },
      { by: 'b', say: "If this was a holiday, it would be a lovely one." },
      { by: 'a', say: "It would be lovelier with a seat." },
    ] },
  ],
};

export default mergePools(basket, train);

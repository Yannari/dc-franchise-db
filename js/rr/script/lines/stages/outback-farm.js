// Outback Farm's challenge, stage by stage (js/rr/places/outback-farm.js `stages`; director.js stageBeats).
//   the rabbits  the-farmer -> into-wheat -> white-rabbit -> the-sack -> the-count   (All-In: ten in the sack, or the white one)
// Rabbits zigzag out of reach; a badly tied sack lets them out and the count starts again from what's still in it. The
// farmer is the place's own local.
const at = (taskId, stage) => ({ taskId, stage });
const by = (b, say) => ({ by: b, say });
const beat = s => ({ beat: s });

export default {
  'task-stage.ok': [
    { id: 'of.st.fa1', when: at('bunnies', 'the-farmer'), turns: [
      beat('At the farm gate, the farmer hands them an empty sack and points at the wheat field, which is twitching all over with rabbits.'),
      by('b', "They're everywhere. The whole field is moving."),
      by('a', "Ten of them. How hard can it be to catch ten bunnies?"),
    ] },
    { id: 'of.st.fa2', when: at('bunnies', 'the-farmer'), turns: [
      by('a', "There's a white one? And it's worth all ten?"),
      beat('The farmer nods, holds up one finger, and then all ten fingers.'),
      by('b', "Then we're catching the white one. Forget the other nine."),
    ] },
    { id: 'of.st.wh1', when: at('bunnies', 'into-wheat'), turns: [
      beat('They dive into the wheat, and the rabbits scatter in every direction, zigzagging through the stalks.'),
      by('a', "Got one! Got one! I've got... a handful of wheat."),
      by('b', "Corner them! Herd them towards me!"),
    ] },
    { id: 'of.st.wh2', when: at('bunnies', 'into-wheat'), turns: [
      by('b', "Low and slow. Like a cat."),
      beat('{b} creeps through the wheat on all fours, freezes, and pounces. When {b} stands up, there is a rabbit in each hand.'),
      by('b', "Two! I'm a cat! I'm the best cat!"),
    ] },
    { id: 'of.st.wh3', when: at('bunnies', 'into-wheat'), turns: [
      beat('{a} runs after one rabbit for so long, round and round in circles through the wheat, that it eventually just sits down, exhausted, and lets itself be picked up.'),
      by('a', "I wore it out. That's a strategy."),
      by('b', "That's not a strategy. That's just running in a circle for ten minutes."),
    ] },
    { id: 'of.st.wr1', when: at('bunnies', 'white-rabbit'), turns: [
      beat('Down by the water, sitting on the end of an old wooden jetty, is a little white rabbit, washing its ears.'),
      by('b', "There it is. The white one. Don't scare it."),
      by('a', "Here, bunny. Here, very valuable bunny."),
    ] },
    { id: 'of.st.wr2', when: at('bunnies', 'white-rabbit'), turns: [
      by('a', "It's on the jetty. It can't go anywhere but us."),
      beat('They creep out onto the jetty from both ends of the bank, and the white rabbit looks from one to the other, trapped.'),
      by('b', "Sorry, little one. You're worth too much."),
    ] },
    { id: 'of.st.sk1', when: at('bunnies', 'the-sack'), turns: [
      beat('{a} drops the rabbits into the sack one at a time, and {b} ties the top shut with a knot, and another knot, and another.'),
      by('b', "Nobody's getting out of that. That's a prison knot."),
      by('a', "We just escaped from... never mind. Count them."),
    ] },
    { id: 'of.st.sk2', when: at('bunnies', 'the-sack'), turns: [
      by('b', "The sack's wriggling. It's a wriggling sack."),
      by('a', "That means they're all in there. Hold it shut."),
      beat('{b} holds the top of the wriggling sack with both hands and won\'t let go for anything.'),
    ] },
    { id: 'of.st.ct1', when: at('bunnies', 'the-count'), turns: [
      beat('The farmer opens the sack a crack, peers in, counts on their fingers, and nods.'),
      by('a', "Ten? It's ten?"),
      beat('The farmer hands over the tip and lets the rabbits back out into the wheat, where they immediately start eating it again.'),
    ] },
    { id: 'of.st.ct2', when: at('bunnies', 'the-count'), turns: [
      by('b', "\"Glide over the valley to the Chill Zone.\" A glider!"),
      by('a', "I'm sure gliding is easier than rabbits. Everything is easier than rabbits."),
      beat('They brush the wheat out of their hair and run for the hill.'),
    ] },
  ],

  'task-stage.fail': [
    { id: 'of.sf.wh1', when: at('bunnies', 'into-wheat'), turns: [
      beat('{a} dives at a rabbit, misses, and lands face first in the dirt. The rabbit stops a metre away and looks back at {a.obj}.'),
      by('a', "It's laughing at me. I can tell."),
      by('b', "Get up! It's going!"),
    ] },
    { id: 'of.sf.wh2', when: at('bunnies', 'into-wheat'), turns: [
      by('b', "It went left! No, right! No, it went under you!"),
      beat('{a} spins round so many times chasing one rabbit that {a.sub} falls over in a dizzy heap.'),
      by('a', "Where am I? Is it still there?"),
    ] },
    { id: 'of.sf.wr1', when: at('bunnies', 'white-rabbit'), turns: [
      beat('{a} reaches for the white rabbit, and it hops neatly off the end of the jetty and swims away to the other bank.'),
      by('a', "It can swim! Since when can rabbits swim?"),
      by('b', "Since now, apparently. Back to the normal ones."),
    ] },
    { id: 'of.sf.wr2', when: at('bunnies', 'white-rabbit'), turns: [
      by('b', "Grab it!"),
      beat('They both grab at the same moment, bump heads, and the white rabbit hops away between their legs.'),
      by('a', "Ow. And it's gone. And my head hurts."),
    ] },
    { id: 'of.sf.sk1', when: at('bunnies', 'the-sack'), turns: [
      beat('{b} opens the sack to put one more rabbit in, and three rabbits hop straight back out.'),
      by('b', "No! Get back in! Get back in the sack!"),
      by('a', "Start counting again. From whatever's left."),
    ] },
    { id: 'of.sf.sk2', when: at('bunnies', 'the-sack'), turns: [
      by('a', "Why is the sack getting lighter?"),
      beat('There is a hole in the bottom of the sack. Rabbits are dropping out of it one by one, like sand out of an hourglass.'),
      by('b', "That's why they kept giving it to us so happily."),
    ] },
  ],
};

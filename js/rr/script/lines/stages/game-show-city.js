// Game Show City's challenge, stage by stage (js/rr/places/game-show-city.js `stages`; director.js stageBeats).
//   human pinball  padded-suit -> the-launch -> the-bumpers -> the-panda -> last-target -> five-lit
//   (All-In: one is the ball, one works the flippers, and they take turns)
// A ball that drains past the flippers or a timer that runs out means a new ball. The game show host is the place's own
// local; the man in the panda suit is the show's idea of help.
const at = (taskId, stage) => ({ taskId, stage });
const by = (b, say) => ({ by: b, say });
const beat = s => ({ beat: s });
const T = 'pinball';

export default {
  'task-stage.ok': [
    { id: 'gsc.st.ps1', when: at(T, 'padded-suit'), turns: [
      beat('Under the bright lights of the game show set, a crew member zips {a} into a huge round padded suit.'),
      by('a', "I look like a beach ball."),
      by('b', "You are a beach ball. That's the point. I'm on the flippers."),
    ] },
    { id: 'gsc.st.ps2', when: at(T, 'padded-suit'), turns: [
      by('b', "Can you move in that?"),
      by('a', "Not really. I can roll. That's about it."),
      beat('The crowd in the studio claps along to the music as {a} waddles to the plunger.'),
    ] },
    { id: 'gsc.st.ln1', when: at(T, 'the-launch'), turns: [
      beat('The plunger slams forward, and {a} goes flying up the table, spinning, screaming the whole way.'),
      by('b', "Go! Go! Hit something!"),
      by('a', "I'm hitting everything!"),
    ] },
    { id: 'gsc.st.ln2', when: at(T, 'the-launch'), turns: [
      by('a', "Wait, I'm not ready! I'm not..."),
      beat('{a} is launched anyway, and shoots off up the table like a cannonball.'),
      by('b', "Too late! You're the ball now!"),
    ] },
    { id: 'gsc.st.bm1', when: at(T, 'the-bumpers'), turns: [
      beat('{a} smacks into a bumper, bounces off, smacks into another one, and a target lights up with a loud ding.'),
      by('b', "One! That's one! Keep bouncing!"),
      by('a', "I don't have a choice!"),
    ] },
    { id: 'gsc.st.bm2', when: at(T, 'the-bumpers'), turns: [
      by('b', "Coming back down! Flipper!"),
      beat('{a} rolls back towards the flippers, and {b} smacks the button just in time and sends {a.obj} flying back up.'),
      by('a', "Warn me before you do that!"),
    ] },
    { id: 'gsc.st.pd1', when: at(T, 'the-panda'), turns: [
      beat('A man in a panda suit wanders onto the table and starts waving his arms, apparently to help.'),
      by('a', "Why is there a panda? Get off the table!"),
      by('b', "Bounce off him! He counts as a bumper!"),
    ] },
    { id: 'gsc.st.pd2', when: at(T, 'the-panda'), turns: [
      by('b', "Go round him! Round the panda!"),
      beat('{a} rolls neatly round the panda and straight into a target, which lights up.'),
      by('a', "Ha! Take that, panda!"),
    ] },
    { id: 'gsc.st.lt1', when: at(T, 'last-target'), turns: [
      beat('Four targets are lit. The timer is counting down. One target left, right at the top of the table.'),
      by('b', "Big flip! Here it comes!"),
      beat('{b} hits the flipper, {a} rockets up the table, and smashes into the last target.'),
    ] },
    { id: 'gsc.st.lt2', when: at(T, 'last-target'), turns: [
      by('a', "Which one's left? Which one?"),
      by('b', "Top left! The pink one!"),
      beat('{a} bounces off two bumpers and lands right on the pink target, which flashes and dings.'),
    ] },
    { id: 'gsc.st.fl1', when: at(T, 'five-lit'), turns: [
      beat('All five targets flash at once, the crowd goes wild, and confetti pours down from the ceiling.'),
      by('b', "Five! We did it!"),
      by('a', "Get me out of this suit. I'm so dizzy."),
    ] },
    { id: 'gsc.st.fl2', when: at(T, 'five-lit'), turns: [
      by('a', "Which way is up?"),
      by('b', "That way. Here's the tip."),
      beat('{a} wobbles out of the padded suit and grabs the tip.'),
    ] },
  ],

  'task-stage.fail': [
    { id: 'gsc.sf.ps1', when: at(T, 'padded-suit'), turns: [
      beat('{a} gets one leg into the padded suit, overbalances, and rolls away across the studio floor.'),
      by('b', "Come back! You're not on the table yet!"),
      by('a', "I can't stop! I'm round!"),
    ] },
    { id: 'gsc.sf.ps2', when: at(T, 'padded-suit'), turns: [
      by('b', "Is it on? Is it zipped?"),
      by('a', "My arm's stuck inside. I can't find the armhole."),
      beat('It takes the crew a whole minute to get {a} zipped in properly.'),
    ] },
    { id: 'gsc.sf.bm1', when: at(T, 'the-bumpers'), turns: [
      beat('{a} rolls straight down the middle, between the flippers, and drops out of the bottom of the table.'),
      by('b', "No! Drained! You drained!"),
      by('a', "You didn't flip! You didn't even flip!"),
    ] },
    { id: 'gsc.sf.bm2', when: at(T, 'the-bumpers'), turns: [
      by('b', "Flip! Now!"),
      beat('{b} hits the wrong flipper, and {a} rolls past the other one and drains.'),
      by('a', "Left! I was on the left!"),
    ] },
    { id: 'gsc.sf.pd1', when: at(T, 'the-panda'), turns: [
      beat('The panda steps right into {a}\'s path, and they collide in the middle of the table and both fall over.'),
      by('a', "Why are you here? What are you for?"),
      beat('The panda gives a thumbs-up and wanders off. {a} drains.'),
    ] },
    { id: 'gsc.sf.pd2', when: at(T, 'the-panda'), turns: [
      by('b', "Bounce off the panda!"),
      beat('{a} bounces off the panda, who is very soft, and rolls gently down between the flippers.'),
      by('a', "He's not a bumper! He's a cushion!"),
    ] },
    { id: 'gsc.sf.lt1', when: at(T, 'last-target'), turns: [
      beat('The buzzer goes. Time\'s up. Four targets lit, and one dark.'),
      by('b', "Four! We got four!"),
      by('a', "Four's not five. New ball."),
    ] },
    { id: 'gsc.sf.lt2', when: at(T, 'last-target'), turns: [
      by('a', "Flip me! Flip me up!"),
      beat('{b} flips, {a} flies up, misses the last target by a hand, and rolls all the way back down.'),
      by('b', "So close! Again!"),
    ] },
  ],
};

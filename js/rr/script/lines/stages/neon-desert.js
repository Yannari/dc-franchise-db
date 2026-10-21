// Neon Desert's Either/Or, stage by stage (js/rr/places/neon-desert.js `stages`; director.js stageBeats).
//   Buggy  the-remote -> first-flag -> the-dunes -> last-flag -> buggy-tip      (a on the remote, b riding and grabbing the flags)
//   Magic  into-cage -> the-levers -> lion-stirs -> vanished -> magic-tip       (a in the cage with the lion, b at the levers)
// A missed flag or the minute running out means another run; the wrong lever wakes the lion and the act starts again.
// The magician is the place's own local.
const at = (taskId, stage) => ({ taskId, stage });
const by = (b, say) => ({ by: b, say });
const beat = s => ({ beat: s });
const T = 'buggy-magic';

export default {
  'task-stage.ok': [
    // ── Buggy ──
    { id: 'nd.st.rm1', when: at(T, 'the-remote'), turns: [
      beat('Up in the wooden booth, {a} picks up the remote. Down on the sand, {b} climbs onto the buggy and grabs the roll bar.'),
      by('b', "You know how to drive one of these, right?"),
      by('a', "I had a remote car when I was ten. It's the same thing."),
      by('b', "It's not the same thing. I'm sitting on it."),
    ] },
    { id: 'nd.st.rm2', when: at(T, 'the-remote'), turns: [
      by('a', "Left is left, right is right. Easy."),
      by('b', "Just don't flip me."),
      beat('The buggy\'s engine whines, and it jerks forward across the sand with {b} hanging on.'),
    ] },
    { id: 'nd.st.ff1', when: at(T, 'first-flag'), turns: [
      beat('The buggy swings past the first pole, and {b} leans out and snatches the flag.'),
      by('b', "Got one! One down!"),
      by('a', "Two more! Hang on!"),
    ] },
    { id: 'nd.st.ff2', when: at(T, 'first-flag'), turns: [
      by('b', "Slower! Slower near the flag!"),
      beat('{a} slows the buggy right down beside the pole, and {b} plucks the flag off it.'),
      by('a', "See? I'm good at this."),
    ] },
    { id: 'nd.st.du1', when: at(T, 'the-dunes'), turns: [
      beat('The buggy flies over the top of a dune, all four wheels in the air, and lands with a thump.'),
      by('b', "Whoa! Warn me before you do that!"),
      by('a', "I didn't know it was going to do that either!"),
    ] },
    { id: 'nd.st.du2', when: at(T, 'the-dunes'), turns: [
      by('a', "Round the rock, then straight."),
      beat('The buggy skids round the rock in a spray of sand and straightens up for the next flag.'),
      by('b', "Nice. Keep it like that."),
    ] },
    { id: 'nd.st.lf1', when: at(T, 'last-flag'), turns: [
      beat('The clock on the booth ticks down: ten seconds, nine, eight. The last flag is just ahead.'),
      by('a', "Grab it! Grab it!"),
      beat('{b} stretches right out off the side of the buggy and pulls the flag off the pole.'),
    ] },
    { id: 'nd.st.lf2', when: at(T, 'last-flag'), turns: [
      by('b', "Three! That's three!"),
      by('a', "With time left? Tell me there was time left!"),
      beat('There were four seconds left.'),
    ] },
    { id: 'nd.st.bt1', when: at(T, 'buggy-tip'), turns: [
      beat('{b} hands in the three flags, and gets the tip back.'),
      by('a', "Was I a good driver?"),
      by('b', "You were a scary driver. But we won, so, fine."),
    ] },
    { id: 'nd.st.bt2', when: at(T, 'buggy-tip'), turns: [
      by('b', "Run to the theatre. Can you run?"),
      by('a', "I've been sitting in a booth. I can run."),
      beat('{b} is still shaking sand out of {b.posAdj} hair as they go.'),
    ] },

    // ── Magic ──
    { id: 'nd.st.ic1', when: at(T, 'into-cage'), turns: [
      beat('On the stage of the magic theatre, the magician opens a cage. Inside, a real lion is curled up, fast asleep.'),
      by('a', "I'm going in there? With that?"),
      by('b', "It's asleep. Just don't wake it up."),
    ] },
    { id: 'nd.st.ic2', when: at(T, 'into-cage'), turns: [
      by('b', "I'll be right here. At the levers."),
      beat('{a} steps into the cage, and the magician closes the door behind {a.obj} with a soft click.'),
      by('a', "Please hurry. Please, please hurry."),
    ] },
    { id: 'nd.st.lv1', when: at(T, 'the-levers'), turns: [
      beat('There are three levers on the side of the stage. The magician gestures at them and says nothing.'),
      by('b', "Which one? Left, middle, or right?"),
      by('a', "I don't know! Don't ask me! Pick one!"),
    ] },
    { id: 'nd.st.lv2', when: at(T, 'the-levers'), turns: [
      by('b', "The middle one's shinier. Someone's been using it."),
      beat('{b} pulls the middle lever. There is a puff of smoke, and the curtain drops over the cage.'),
      by('b', "Was that right? Are you still in there?"),
    ] },
    { id: 'nd.st.ls1', when: at(T, 'lion-stirs'), turns: [
      beat('In the cage, the lion\'s ear twitches. Then its tail. {a} doesn\'t breathe.'),
      by('a', "It's moving. It's moving."),
      by('b', "Stay still! Don't make a sound!"),
    ] },
    { id: 'nd.st.ls2', when: at(T, 'lion-stirs'), turns: [
      by('a', "It just yawned. Do lions yawn before they eat?"),
      by('b', "It's yawning because it's sleepy! That's good!"),
      beat('The lion rolls over and goes back to sleep.'),
    ] },
    { id: 'nd.st.vn1', when: at(T, 'vanished'), turns: [
      beat('The curtain lifts. The cage is empty except for the lion, still asleep. {a} is gone.'),
      by('b', "Where did you go?"),
      beat('{a} pops up at the back of the theatre, waving.'),
    ] },
    { id: 'nd.st.vn2', when: at(T, 'vanished'), turns: [
      by('a', "How did I do that? I don't even know how I did that."),
      by('b', "Magic. Don't think about it."),
      beat('The magician takes a bow, as if it was all their idea.'),
    ] },
    { id: 'nd.st.mt1', when: at(T, 'magic-tip'), turns: [
      beat('The magician pulls the tip out of {b}\'s ear and hands it over.'),
      by('b', "Okay, that's actually impressive."),
      by('a', "Read it. Let's go before the lion wakes up."),
    ] },
    { id: 'nd.st.mt2', when: at(T, 'magic-tip'), turns: [
      by('a', "I was in a cage with a lion."),
      by('b', "You were, and you didn't scream once."),
      by('a', "I screamed on the inside."),
    ] },
  ],

  'task-stage.fail': [
    // ── Buggy ──
    { id: 'nd.sf.ff1', when: at(T, 'first-flag'), turns: [
      beat('The buggy zooms past the first pole so fast that {b}\'s hand closes on air.'),
      by('b', "Slow down! I can't grab anything at that speed!"),
      by('a', "Sorry! The stick is really sensitive!"),
    ] },
    { id: 'nd.sf.ff2', when: at(T, 'first-flag'), turns: [
      by('b', "Closer! Get me closer to the pole!"),
      beat('{a} gets the buggy close to the pole. Too close. {b} gets the pole in the stomach.'),
      by('b', "Not that close!"),
    ] },
    { id: 'nd.sf.du1', when: at(T, 'the-dunes'), turns: [
      beat('The buggy hits soft sand at the bottom of a dune and digs itself in, wheels spinning.'),
      by('b', "We're stuck!"),
      by('a', "Rock it! Lean forward!"),
    ] },
    { id: 'nd.sf.du2', when: at(T, 'the-dunes'), turns: [
      by('a', "Hold on!"),
      beat('The buggy takes the dune too fast, tips over on its side, and {b} rolls off into the sand.'),
      by('b', "I'm fine! I'm fine! Is the buggy fine?"),
    ] },
    { id: 'nd.sf.lf1', when: at(T, 'last-flag'), turns: [
      beat('The buzzer goes. The minute is up. The last flag is still on its pole, a few feet away.'),
      by('b', "No! I was right there!"),
      by('a', "Back to the start. Again."),
    ] },
    { id: 'nd.sf.lf2', when: at(T, 'last-flag'), turns: [
      by('a', "Where are you going? The flag's on the left!"),
      by('b', "I'm not going anywhere! You're driving!"),
      beat('By the time they get turned round, the minute is over.'),
    ] },

    // ── Magic ──
    { id: 'nd.sf.ic1', when: at(T, 'into-cage'), turns: [
      beat('{a} puts one foot in the cage, and the lion lets out a long, rumbling snore. {a} takes the foot back out.'),
      by('a', "No. Not doing it."),
      by('b', "It's snoring! That means it's asleep!"),
    ] },
    { id: 'nd.sf.ic2', when: at(T, 'into-cage'), turns: [
      by('b', "Just get in. Quick."),
      by('a', "Can't we swap? You do the cage, I do the levers?"),
      beat('They argue about it for a whole minute while the lion sleeps.'),
    ] },
    { id: 'nd.sf.lv1', when: at(T, 'the-levers'), turns: [
      beat('{b} pulls the left lever. A trapdoor opens, and a bucket of confetti falls on the lion.'),
      by('a', "Wrong one! Wrong one!"),
      beat('The lion opens one eye. The magician sighs and resets the act.'),
    ] },
    { id: 'nd.sf.lv2', when: at(T, 'the-levers'), turns: [
      by('b', "This one. No, this one."),
      beat('{b} pulls the right lever. The lights go up full, bright and loud, and the lion wakes up.'),
      by('a', "Get me out! Get me out of here!"),
    ] },
    { id: 'nd.sf.ls1', when: at(T, 'lion-stirs'), turns: [
      beat('{a} sneezes. The lion\'s eyes snap open.'),
      by('a', "Sorry! Sorry! Bless me!"),
      beat('The magician opens the door fast, and they have to start the whole act again.'),
    ] },
    { id: 'nd.sf.ls2', when: at(T, 'lion-stirs'), turns: [
      by('b', "Hurry up! The lever's stuck!"),
      beat('The lion stands up, stretches, and looks straight at {a}. The magician whips the door open.'),
      by('a', "That's it. I'm done. Somebody else do the cage."),
    ] },
  ],
};

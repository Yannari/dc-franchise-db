// Ice River's challenges, stage by stage (js/rr/places/ice-river.js `stages`; director.js stageBeats): the moments a
// followed team lives through, in order, each passed ('ok') or where it went wrong ('fail').
//   the ice floes  first-floe -> mid-river -> last-jump -> far-bank
//   the sled       harness -> flags -> bear -> swap -> cliff
import { V } from '../places/_kit.js';

const at = (taskId, stage) => ({ taskId, stage });
const by = (b, say) => ({ by: b, say });
const beat = s => ({ beat: s });

export default {
  'task-stage.ok': [
    // ── the ice floes ──
    { id: 'icr.st.ff1', when: at('ice-floes', 'first-floe'), turns: [
      beat('{a} and {b} crouch at the edge of the bank. A floe the size of a kitchen table drifts towards them, slowly turning.'),
      by('a', "That one. Wait for it."),
      { by: 'b', ...V("I'm waiting. My feet are waiting. My feet are freezing while they wait.", "Waiting. Freezing.", "Waiting.", "I'm WAITING! My feet are FREEZING!", "I'm waiting... my feet are so cold.", "My feet have filed a complaint.") },
      by('a', "Now!"),
      beat('They jump together. The floe dips, wobbles, and holds.'),
      by('b', "We're on! We're on a piece of the river!"),
    ] },
    { id: 'icr.st.ff2', when: at('ice-floes', 'first-floe'), turns: [
      by('b', "How do you know which one will hold?"),
      by('a', "The thick ones are blue underneath. The thin ones are clear."),
      by('b', "Where did you learn that?"),
      by('a', "I just made it up. But it sounds right."),
      beat('{a} steps onto a blue one. It holds. {b} follows, arms out like a tightrope walker.'),
      by('b', "I can't believe that worked."),
    ] },
    { id: 'icr.st.ff3', when: at('ice-floes', 'first-floe'), turns: [
      beat('{a} tests the first floe with one boot, then the other, then gives it a little stamp.'),
      by('b', "Don't stamp on it!"),
      by('a', "I'm checking it!"),
      by('b', "Check it gently!"),
      beat('It holds. {a} waves {b} on with enormous confidence.'),
    ] },
    { id: 'icr.st.mr1', when: at('ice-floes', 'mid-river'), turns: [
      beat('In the middle of the river the floes are smaller, faster and very, very close to the water.'),
      by('a', "Left one! Then the long one! Then that one with the bird on it!"),
      by('b', "The bird's leaving! Why is the bird leaving?"),
      by('a', "Birds don't know anything! Jump!"),
      beat('They hop three floes in a row, and the bird watches from the sky, unconvinced.'),
    ] },
    { id: 'icr.st.mr2', when: at('ice-floes', 'mid-river'), turns: [
      by('b', "Halfway. We're halfway."),
      by('a', "Don't say halfway. Saying halfway is how you fall in."),
      by('b', "We're... some of the way."),
      beat('A floe knocks against theirs. They step across before either one can think about it.'),
      by('a', "Some of the way is much better."),
    ] },
    { id: 'icr.st.mr3', when: at('ice-floes', 'mid-river'), turns: [
      beat('{a} and {b} hold hands and hop floe to floe in perfect time, like the world\'s coldest dance routine.'),
      by('a', "One, two, jump. One, two, jump."),
      by('b', "Why are we counting?"),
      by('a', "Because if we stop counting, we start thinking."),
    ] },
    { id: 'icr.st.lj1', when: at('ice-floes', 'last-jump'), turns: [
      beat('One gap left: black water between the last floe and the far bank, much wider than all the others.'),
      by('b', "That's not a gap. That's a lake."),
      by('a', "Run up. Big jump. Don't look down."),
      beat('{a} jumps and lands on the bank on hands and knees. {b} jumps and lands on {a}.'),
      by('a', "Good landing. For you."),
    ] },
    { id: 'icr.st.lj2', when: at('ice-floes', 'last-jump'), turns: [
      by('a', "Last one. On three. One..."),
      beat('{b} has already jumped. {b} is on the bank.'),
      by('b', "Three! Come on!"),
      by('a', "That's not how three works!"),
      beat('{a} jumps anyway and makes it, just.'),
    ] },
    { id: 'icr.st.lj3', when: at('ice-floes', 'last-jump'), turns: [
      beat('The last floe is drifting away from the bank. Every second the jump gets longer.'),
      by('b', "Go now or we swim!"),
      by('a', "Going!"),
      beat('They both launch at once and hit the snow on the far bank in a heap.'),
      by('b', "Dry. Mostly dry. Some of me is dry."),
    ] },
    { id: 'icr.st.fb1', when: at('ice-floes', 'far-bank'), turns: [
      beat('On the far bank, {a} and {b} stand shivering, steaming slightly, looking back at the river.'),
      by('a', "I'd like to thank every floe that didn't sink."),
      by('b', "And the ones that did?"),
      by('a', "They know what they did."),
    ] },
    { id: 'icr.st.fb2', when: at('ice-floes', 'far-bank'), turns: [
      by('b', "Tip! There's the tip, on the post!"),
      beat('{a} grabs it with fingers too cold to open it. {b} opens it with teeth.'),
      by('b', "It says sled."),
      by('a', "A sled. Thank goodness. Something that isn't floating."),
    ] },
    { id: 'icr.st.fb3', when: at('ice-floes', 'far-bank'), turns: [
      beat('{a} and {b} high-five on the far bank. Their gloves freeze together for a second.'),
      by('a', "We're stuck."),
      by('b', "We're a team. Literally."),
      beat('They pull apart and run for the next tip.'),
    ] },
    // ── the sled ──
    { id: 'icr.st.hn1', when: at('sled', 'harness'), turns: [
      beat('At the start flag, a row of wooden sleds and leather harnesses lies in the snow.'),
      by('a', "Who pulls first?"),
      by('b', "You. You've got the bigger legs."),
      by('a', "That's not a compliment, is it?"),
      by('b', "It's a strategy."),
      beat('{a} buckles into the harness. {b} climbs on the sled and waves like royalty.'),
    ] },
    { id: 'icr.st.hn2', when: at('sled', 'harness'), turns: [
      by('b', "Is the harness on right?"),
      by('a', "It's either on right, or I'm wearing a sled as a hat."),
      beat('{b} turns {a} round by the shoulders. It was on backwards.'),
      by('a', "Okay. Now it's on right."),
    ] },
    { id: 'icr.st.hn3', when: at('sled', 'harness'), turns: [
      beat('{a} picks up the harness, looks at it, then looks at the endless white plain.'),
      by('a', "How far is the ice cliff?"),
      by('b', "Follow the red flags, it says. It doesn't say how many."),
      by('a', "That's the scariest thing a tip has ever said."),
    ] },
    { id: 'icr.st.fl1', when: at('sled', 'flags'), turns: [
      beat('The plain goes on forever. Every hundred metres, a little red flag sticks out of the snow.'),
      by('b', "Flag! Next flag, slightly left!"),
      by('a', "Every flag is slightly left!"),
      by('b', "Because we keep drifting right!"),
      beat('{a} leans into the harness and drags them back onto the line.'),
    ] },
    { id: 'icr.st.fl2', when: at('sled', 'flags'), turns: [
      by('a', "How many flags have we passed?"),
      by('b', "Eleven. Twelve. Thirteen, now."),
      by('a', "How many are there?"),
      by('b', "I can see about forty more."),
      beat('{a} makes a noise like a tired dog, and keeps pulling.'),
    ] },
    { id: 'icr.st.fl3', when: at('sled', 'flags'), turns: [
      beat('The sled hisses across the snow. Behind them, two neat lines in the white, and the footprints of {a} in between.'),
      by('b', "This is actually nice. Peaceful."),
      by('a', "For you! You're lying down!"),
      by('b', "I'm navigating! It's a mental job!"),
    ] },
    { id: 'icr.st.br1', when: at('sled', 'bear'), turns: [
      beat('Off to the side of the flags, a polar bear lifts its head from the snow and looks at them.'),
      by('b', "Don't stop. Don't look at it. Keep pulling."),
      by('a', "I'm not looking at it. It's looking at me."),
      beat('The bear sniffs, loses interest, and lies back down.'),
      by('b', "It's yawning. We bored it. Good."),
    ] },
    { id: 'icr.st.br2', when: at('sled', 'bear'), turns: [
      by('a', "Is that a rock or a bear?"),
      beat('The rock stands up.'),
      by('b', "Bear. It's a bear. Pull quietly."),
      by('a', "How do you pull quietly?"),
      beat('{a} tiptoes. In a harness. Pulling a sled. Somehow it works.'),
    ] },
    { id: 'icr.st.br3', when: at('sled', 'bear'), turns: [
      beat('The bear is walking alongside the flags now, slowly, like it wants to see who wins.'),
      by('b', "It's following us."),
      by('a', "It's following the flags. Same as us. It's a racer."),
      by('b', "Then we're beating a bear. Pull faster."),
    ] },
    { id: 'icr.st.sw1', when: at('sled', 'swap'), turns: [
      beat('{a} stops, bent double, breath steaming.'),
      by('a', "Swap. I'm done. My legs are soup."),
      by('b', "Frozen soup?"),
      by('a', "Get in the harness."),
      beat('They swap. {a} collapses onto the sled with a happy groan.'),
    ] },
    { id: 'icr.st.sw2', when: at('sled', 'swap'), turns: [
      by('b', "My turn. Get on."),
      by('a', "Are you sure? You don't have to."),
      by('b', "You're pulling at the speed of a glacier. Get on."),
      beat('{b} straps in and takes off so fast {a} nearly falls off the back.'),
    ] },
    { id: 'icr.st.sw3', when: at('sled', 'swap'), turns: [
      beat('{a} and {b} swap places without a word, the way people do who have been married to a sled for an hour.'),
      by('a', "Comfy back there?"),
      by('b', "It's like a cloud. A cold, wooden cloud."),
    ] },
    { id: 'icr.st.cl1', when: at('sled', 'cliff'), turns: [
      beat('The flags lead up a last white slope to the ice cliff, where a checkered banner flaps in the wind.'),
      by('b', "That's it! That's the cliff! We're there!"),
      by('a', "We're not there. There's a hill. There's always a hill."),
      beat('They drag the sled up the slope together, side by side, and reach the top.'),
    ] },
    { id: 'icr.st.cl2', when: at('sled', 'cliff'), turns: [
      by('a', "Last pull. Both of us. Grab the rope."),
      beat('They pull together up the last slope, the sled bumping behind them, the banner getting bigger.'),
      by('b', "I can see Don's mat!"),
      by('a', "I can see a chair! Is there a chair?"),
    ] },
    { id: 'icr.st.cl3', when: at('sled', 'cliff'), turns: [
      beat('At the top of the slope, the plain drops away into a frozen sea, and the Chill Zone sits right on the edge.'),
      by('b', "Whoa. Look at that."),
      by('a', "Don't look at that. Look at the mat. Walk to the mat."),
    ] },
  ],

  'task-stage.fail': [
    // ── the ice floes ──
    { id: 'icr.sf.ff1', when: at('ice-floes', 'first-floe'), turns: [
      beat('{a} jumps for the first floe. It isn\'t there any more. It drifted.'),
      beat('Splash.'),
      by('b', "Are you okay?"),
      by('a', "I'm in the river! I'm in the river, in the north! Of course I'm not okay!"),
      beat('{b} hauls {a} back onto the bank by the hood.'),
    ] },
    { id: 'icr.sf.ff2', when: at('ice-floes', 'first-floe'), turns: [
      by('a', "That one looks solid."),
      beat('{a} steps onto it. It is not solid. It folds in half like a sandwich.'),
      by('b', "That was slush. You stood on slush."),
      by('a', "It was solid-looking slush."),
    ] },
    { id: 'icr.sf.ff3', when: at('ice-floes', 'first-floe'), turns: [
      beat('{a} and {b} jump onto the same small floe at the same moment. It tips like a seesaw and drops them both in.'),
      by('b', "I said one at a time!"),
      by('a', "You said it after we jumped!"),
      beat('They swim back to the near bank, arguing the whole way.'),
    ] },
    { id: 'icr.sf.mr1', when: at('ice-floes', 'mid-river'), turns: [
      beat('In the middle of the river, the floe under {b} cracks straight down the middle.'),
      by('b', "It's breaking! It's breaking!"),
      by('a', "Jump to mine!"),
      beat('{b} jumps. {a}\'s floe tips. They both go in.'),
      by('a', "Back to the bank. Swim. Don't talk. Swim."),
    ] },
    { id: 'icr.sf.mr2', when: at('ice-floes', 'mid-river'), turns: [
      by('a', "This one! Quick!"),
      beat('{a} lands on a floe that immediately starts to sink, slowly, like a lift going down.'),
      by('a', "It's going down! Why is it going down?"),
      by('b', "Because you're on it!"),
      beat('{a} sinks with dignity, up to the neck, then swims back to the start.'),
    ] },
    { id: 'icr.sf.mr3', when: at('ice-floes', 'mid-river'), turns: [
      beat('Two floes drift apart under {a}, one foot on each, and the gap gets wider, and wider.'),
      by('a', "Help! I'm doing the splits! I can't do the splits!"),
      by('b', "Pick one! Pick a floe!"),
      beat('{a} picks the water. Splash. Back to the bank, dripping and furious.'),
    ] },
    { id: 'icr.sf.lj1', when: at('ice-floes', 'last-jump'), turns: [
      beat('{a} takes a run-up across the last floe and jumps for the far bank.'),
      beat('{a} lands a hand\'s width short, and slides slowly backwards into the river.'),
      by('b', "So close! You were so close!"),
      by('a', "Close is wet! Close is very, very wet!"),
    ] },
    { id: 'icr.sf.lj2', when: at('ice-floes', 'last-jump'), turns: [
      by('b', "The bank! Jump for the bank!"),
      beat('They jump together. {b} makes it. {a} doesn\'t.'),
      by('b', "You have to be on the bank too! Both of us!"),
      by('a', "I know the rules! I'm in the river, not deaf!"),
      beat('{a} swims all the way back to the near bank to start again. {b} has to go back too.'),
    ] },
    // ── the sled ──
    { id: 'icr.sf.fl1', when: at('sled', 'flags'), turns: [
      beat('{a} looks up from the harness. White in front. White behind. White to the left and right. No flags.'),
      by('a', "Where are the flags?"),
      by('b', "You were following them! I was lying down!"),
      by('a', "Navigating! You said you were navigating!"),
      beat('They turn the sled round and trudge back to the last flag they saw.'),
    ] },
    { id: 'icr.sf.fl2', when: at('sled', 'flags'), turns: [
      beat('The sled hits a hidden ridge, flips, and throws {b} into a snowdrift head first.'),
      by('a', "Are you alive?"),
      by('b', "I'm in a drift! I'm a snowman!"),
      by('a', "Back to the last flag. Rules are rules."),
    ] },
    { id: 'icr.sf.fl3', when: at('sled', 'flags'), turns: [
      by('b', "That flag's a different colour."),
      by('a', "It's red. They're all red."),
      by('b', "That one's a red jacket. On a pole. That's somebody's lost jacket."),
      beat('They have followed a jacket for ten minutes. They turn round.'),
    ] },
    { id: 'icr.sf.br1', when: at('sled', 'bear'), turns: [
      beat('The polar bear steps onto the trail between two flags, sniffs the air, and starts walking towards them.'),
      by('b', "Bear. Bear. Bear. Turn round."),
      by('a', "Which way is round?"),
      by('b', "Away from the bear!"),
      beat('{a} turns the sled and runs back the way they came, {b} clinging on, until the bear loses interest.'),
    ] },
    { id: 'icr.sf.br2', when: at('sled', 'bear'), turns: [
      by('a', "It's just sitting there. On the trail."),
      by('b', "We could go round."),
      by('a', "Going round means losing the flags."),
      beat('The bear yawns, showing a lot of teeth. They go round. They lose the flags. They go back to the last one.'),
    ] },
    { id: 'icr.sf.br3', when: at('sled', 'bear'), turns: [
      beat('The bear gets up, ambles over and sits on the sled\'s rope, like it\'s waiting for a ride.'),
      by('b', "It wants a turn."),
      by('a', "It can't have a turn! It's not on a team!"),
      beat('They wait, very still, until it wanders off. Then they start again from the last flag.'),
    ] },
    { id: 'icr.sf.sw1', when: at('sled', 'swap'), turns: [
      beat('{a} tries to swap places without stopping the sled. It doesn\'t go well.'),
      beat('The sled tips over sideways and both of them roll down a little slope into a drift.'),
      by('b', "Next time we stop. We stop to swap."),
      by('a', "I was saving time."),
      by('b', "You were saving time into a hole."),
    ] },
    { id: 'icr.sf.sw2', when: at('sled', 'swap'), turns: [
      by('b', "Your turn to pull."),
      by('a', "I pulled last time."),
      by('b', "You pulled for two flags!"),
      beat('The argument takes so long that they wander off the trail, and have to walk back to the last flag.'),
    ] },
    { id: 'icr.sf.cl1', when: at('sled', 'cliff'), turns: [
      beat('Halfway up the last slope, {a} slips. The rope goes slack, and the sled slides all the way back down with {b} on it.'),
      by('b', "Wheeee! No! Not wheee! Stop!"),
      by('a', "Sorry! Sorry! My foot went!"),
      beat('{a} walks back down to the bottom of the slope. They start the climb again.'),
    ] },
    { id: 'icr.sf.cl2', when: at('sled', 'cliff'), turns: [
      by('a', "Too steep. We can't drag it up there."),
      by('b', "Then we carry it."),
      beat('They lift the sled between them, take four steps up the slope, slip, and toboggan all the way back down.'),
      by('a', "That was fun, though."),
      by('b', "That was the opposite of progress."),
    ] },
  ],
};

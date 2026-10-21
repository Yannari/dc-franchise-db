// Marble Temple Hill's challenges, stage by stage (js/rr/places/marble-temple-hill.js `stages`; director.js stageBeats).
//   the hurdles    on-the-line -> first-hurdles -> last-stretch -> finish-line    (All-In: side by side)
//   the high jump  run-up -> the-leap -> the-mat                                  (Botch or Watch: a jumps, b watches)
//   Chariot        reins -> first-bend -> far-side -> full-lap                    (one drives, one holds on)
//   Wrestle        the-circle -> first-fall -> three-falls -> the-wreath          (one wrestles the champion)
// A knocked hurdle sends both back to the start; a knocked bar goes back up; a tipped chariot or a lost bout means another
// try. The games official is the place's own local.
const at = (taskId, stage) => ({ taskId, stage });
const by = (b, say) => ({ by: b, say });
const beat = s => ({ beat: s });
const G = 'ancient-games';

export default {
  'task-stage.ok': [
    // ── the hurdles ──
    { id: 'mth.st.ol1', when: at('hurdles', 'on-the-line'), turns: [
      beat('On the old marble track, ten hurdles stand in a row, and the stone starting line is worn smooth by thousands of years of feet.'),
      by('b', "People have been running here for thousands of years."),
      by('a', "Then we'd better not trip. On your marks."),
    ] },
    { id: 'mth.st.ol2', when: at('hurdles', 'on-the-line'), turns: [
      by('a', "Together. Same pace. Nobody gets ahead."),
      by('b', "Same pace. Got it."),
      beat('The official raises a flag, and drops it.'),
    ] },
    { id: 'mth.st.fh1', when: at('hurdles', 'first-hurdles'), turns: [
      beat('They run at the first hurdle side by side, jump together, and both clear it.'),
      by('a', "One! Keep going!"),
      by('b', "Nine more! Don't look at them all!"),
    ] },
    { id: 'mth.st.fh2', when: at('hurdles', 'first-hurdles'), turns: [
      by('b', "Lift your knees! High knees!"),
      beat('They hop over hurdle after hurdle, not pretty, but not a single one goes down.'),
      by('a', "Halfway! Keep it going!"),
    ] },
    { id: 'mth.st.ls1', when: at('hurdles', 'last-stretch'), turns: [
      beat('Over the last three hurdles, {b} starts to fade, and {a} slows down to keep them side by side.'),
      by('a', "Come on. With me. Last two."),
      by('b', "I'm with you. I'm with you."),
    ] },
    { id: 'mth.st.ls2', when: at('hurdles', 'last-stretch'), turns: [
      by('a', "Last one! Big jump!"),
      beat('They clear the last hurdle together and sprint for the line.'),
      by('b', "Together! Cross it together!"),
    ] },
    { id: 'mth.st.fl1', when: at('hurdles', 'finish-line'), turns: [
      beat('They cross the finish line side by side, and every hurdle behind them is still standing.'),
      by('b', "Clean! Every one!"),
      by('a', "Olympians. We're basically Olympians."),
    ] },
    { id: 'mth.st.fl2', when: at('hurdles', 'finish-line'), turns: [
      by('a', "High jump next. Who's jumping?"),
      by('b', "Not me. I've done enough jumping."),
      by('a', "Fine. I'll jump. Watch me."),
    ] },

    // ── the high jump ──
    { id: 'mth.st.ru1', when: at('high-jump', 'run-up'), turns: [
      beat('{a} stands at the end of the run-up, staring at a bar set higher than {a.posAdj} own head.'),
      by('b', "Any way you like! Backwards, forwards, anything!"),
      by('a', "I'm going with anything."),
    ] },
    { id: 'mth.st.ru2', when: at('high-jump', 'run-up'), turns: [
      by('a', "Run fast, jump high. That's the whole plan."),
      by('b', "It's a good plan. Go."),
      beat('{a} sprints at the bar.'),
    ] },
    { id: 'mth.st.lp1', when: at('high-jump', 'the-leap'), turns: [
      beat('{a} leaps, twists in the air, and arches backwards over the bar without touching it.'),
      by('b', "You did a proper flop! A real one!"),
      by('a', "I don't even know how I did that."),
    ] },
    { id: 'mth.st.lp2', when: at('high-jump', 'the-leap'), turns: [
      by('b', "Go! Up! Up!"),
      beat('{a} throws {a.ref} at the bar in a sort of flailing scissor kick, and somehow sails over it.'),
      by('a', "Did it stay up? Tell me it stayed up."),
    ] },
    { id: 'mth.st.mt1', when: at('high-jump', 'the-mat'), turns: [
      beat('{a} lands on the big soft mat with a whump. The bar wobbles, and stays.'),
      by('b', "It's still up! You cleared it!"),
      by('a', "I'm going to lie here for a second."),
    ] },
    { id: 'mth.st.mt2', when: at('high-jump', 'the-mat'), turns: [
      by('a', "Was that clean?"),
      by('b', "Clean. The official's nodding. Get up, we've got a tip."),
      beat('{a} rolls off the mat, still grinning.'),
    ] },

    // ── Chariot ──
    { id: 'mth.st.rn1', when: at(G, 'reins'), turns: [
      beat('Among the temple columns, a chariot waits behind two snorting horses. {a} takes the reins, and {b} climbs in the back.'),
      by('b', "Do you know how to drive this?"),
      by('a', "It's like a bike. A bike with two horses."),
    ] },
    { id: 'mth.st.rn2', when: at(G, 'reins'), turns: [
      by('a', "Hold on to the sides. Don't let go."),
      by('b', "I wasn't planning to."),
      beat('{a} flicks the reins, and the horses lurch forward.'),
    ] },
    { id: 'mth.st.fb1', when: at(G, 'first-bend'), turns: [
      beat('The chariot flies into the first bend, one wheel lifting off the sand, and slams back down.'),
      by('b', "Lean! Lean in!"),
      by('a', "I'm leaning! You lean too!"),
    ] },
    { id: 'mth.st.fb2', when: at(G, 'first-bend'), turns: [
      by('a', "Easy. Easy round the bend."),
      beat('{a} pulls the horses wide, and the chariot swings round the bend without a wobble.'),
      by('b', "Nice! Smooth! Keep it like that!"),
    ] },
    { id: 'mth.st.fs1', when: at(G, 'far-side'), turns: [
      beat('Down the far side, the horses gallop flat out, and the chariot rattles so hard it seems to be shaking itself apart.'),
      by('b', "Is the wheel okay? It's making a noise!"),
      by('a', "It's fine! Probably! Hold on!"),
    ] },
    { id: 'mth.st.fs2', when: at(G, 'far-side'), turns: [
      by('b', "Faster! We're nearly round!"),
      beat('They thunder down the last straight, dust flying behind them.'),
      by('a', "Nearly home! Hold on!"),
    ] },
    { id: 'mth.st.lp3', when: at(G, 'full-lap'), turns: [
      beat('The chariot crosses the line, the horses slow, and the official places a laurel wreath on {a}\'s head.'),
      by('b', "A full lap! In one piece!"),
      by('a', "I'm a champion. Look at my leaves."),
    ] },
    { id: 'mth.st.lp4', when: at(G, 'full-lap'), turns: [
      by('a', "Can we keep the horses?"),
      by('b', "No. Chill Zone. By the ruins. Go."),
      beat('{a} keeps the wreath on all the way to the ruins.'),
    ] },

    // ── Wrestle ──
    { id: 'mth.st.ci1', when: at(G, 'the-circle'), turns: [
      beat('In the sand circle stands the champion, enormous, oiled, and smiling in a way that isn\'t friendly.'),
      by('a', "I'm wrestling that?"),
      by('b', "Three falls out of five. You can do three."),
    ] },
    { id: 'mth.st.ci2', when: at(G, 'the-circle'), turns: [
      by('b', "Stay low. Use your weight."),
      by('a', "What weight? Look at the size of them."),
      beat('{a} steps into the circle anyway.'),
    ] },
    { id: 'mth.st.ff1', when: at(G, 'first-fall'), turns: [
      beat('The champion charges. {a} ducks, steps aside, and the champion tumbles out of the circle onto the sand.'),
      by('b', "One! That's one!"),
      by('a', "I didn't even do anything! They just fell!"),
    ] },
    { id: 'mth.st.ff2', when: at(G, 'first-fall'), turns: [
      by('b', "Grab the leg! The leg!"),
      beat('{a} grabs a leg and holds on, and the champion topples over like a tree.'),
      by('a', "I got one! I actually got one!"),
    ] },
    { id: 'mth.st.tf1', when: at(G, 'three-falls'), turns: [
      beat('Two falls to two. {a} and the champion circle each other, both breathing hard.'),
      by('b', "One more! Just one more!"),
      beat('{a} feints left, goes right, and pushes the champion out of the circle.'),
    ] },
    { id: 'mth.st.tf2', when: at(G, 'three-falls'), turns: [
      by('a', "Three. Was that three?"),
      by('b', "That was three! You beat the champion!"),
      beat('The champion sits up in the sand and starts to laugh.'),
    ] },
    { id: 'mth.st.wr1', when: at(G, 'the-wreath'), turns: [
      beat('The champion gets up, shakes {a}\'s hand, and places the laurel wreath on {a.posAdj} head.'),
      by('b', "You've got a crown! A leafy crown!"),
      by('a', "I'm never taking it off."),
    ] },
    { id: 'mth.st.wr2', when: at(G, 'the-wreath'), turns: [
      by('a', "Everything hurts. Everything."),
      by('b', "But you won. Chill Zone."),
      beat('{a} limps off with the wreath slipping over one eye.'),
    ] },
  ],

  'task-stage.fail': [
    // ── the hurdles ──
    { id: 'mth.sf.fh1', when: at('hurdles', 'first-hurdles'), turns: [
      beat('{b}\'s foot catches the third hurdle, and it clatters down onto the track.'),
      by('a', "Back to the start. Both of us."),
      by('b', "Sorry! My foot's bigger than I thought!"),
    ] },
    { id: 'mth.sf.fh2', when: at('hurdles', 'first-hurdles'), turns: [
      by('a', "Jump! Jump now!"),
      beat('{a} jumps too early, lands on the hurdle, and goes down with it.'),
      by('b', "Are you okay? Back to the line."),
    ] },
    { id: 'mth.sf.ls1', when: at('hurdles', 'last-stretch'), turns: [
      beat('{a} sprints over the last hurdles and crosses the line, then turns round. {b} is still three hurdles back.'),
      by('a', "Together! It has to be together!"),
      by('b', "Then wait for me!"),
    ] },
    { id: 'mth.sf.ls2', when: at('hurdles', 'last-stretch'), turns: [
      by('b', "I can't. My legs are done."),
      beat('{b} stops in front of the ninth hurdle, and they have to go back to the start.'),
      by('a', "It's okay. We'll go slower this time."),
    ] },

    // ── the high jump ──
    { id: 'mth.sf.ru1', when: at('high-jump', 'run-up'), turns: [
      beat('{a} sprints at the bar, gets right up to it, and stops dead.'),
      by('a', "It's higher up close. It's so much higher up close."),
      by('b', "Go back and try again. Don't stop this time."),
    ] },
    { id: 'mth.sf.ru2', when: at('high-jump', 'run-up'), turns: [
      by('b', "Why did you stop?"),
      by('a', "I lost count of my steps."),
      beat('{a} walks back to the start of the run-up.'),
    ] },
    { id: 'mth.sf.lp1', when: at('high-jump', 'the-leap'), turns: [
      beat('{a} leaps, gets most of the way over, and clips the bar with a heel. It drops onto the mat.'),
      by('b', "So close! Your heel got it!"),
      by('a', "Stupid heel. Put it back up."),
    ] },
    { id: 'mth.sf.lp2', when: at('high-jump', 'the-leap'), turns: [
      by('a', "Here I go!"),
      beat('{a} jumps straight into the bar, takes it down, and lands on the mat holding it.'),
      by('b', "That's not how it works."),
    ] },

    // ── Chariot ──
    { id: 'mth.sf.rn1', when: at(G, 'reins'), turns: [
      beat('{a} picks up the reins, and the horses start walking backwards.'),
      by('b', "Wrong way! Wrong way!"),
      by('a', "I didn't do anything! They did it on their own!"),
    ] },
    { id: 'mth.sf.rn2', when: at(G, 'reins'), turns: [
      by('b', "Why aren't we moving?"),
      beat('The horses look at {a}, look at each other, and stay exactly where they are.'),
      by('a', "Giddy up? Please?"),
    ] },
    { id: 'mth.sf.fb1', when: at(G, 'first-bend'), turns: [
      beat('The chariot takes the first bend far too fast, tips over on its side, and they both tumble into the sand.'),
      by('a', "Are you okay?"),
      by('b', "I've got sand in places I didn't know I had."),
    ] },
    { id: 'mth.sf.fb2', when: at(G, 'first-bend'), turns: [
      by('b', "Slow down for the corner!"),
      beat('{a} doesn\'t slow down, and the chariot skids sideways off the track into a column.'),
      by('b', "Are the horses okay? Are we okay?"),
    ] },
    { id: 'mth.sf.fs1', when: at(G, 'far-side'), turns: [
      beat('On the far side, one of the wheels wobbles, wobbles more, and rolls off on its own.'),
      by('b', "We lost a wheel!"),
      by('a', "Hold on! We're going to scrape!"),
    ] },
    { id: 'mth.sf.fs2', when: at(G, 'far-side'), turns: [
      by('a', "Why are they stopping?"),
      beat('The horses have stopped to eat grass by the track, and nothing {a} says will move them.'),
      by('b', "Another try. With better horses."),
    ] },

    // ── Wrestle ──
    { id: 'mth.sf.ci1', when: at(G, 'the-circle'), turns: [
      beat('{a} looks at the champion, looks at the sand, and steps straight back out of the circle.'),
      by('b', "That counts as a fall! You walked out!"),
      by('a', "Did it? Oh. That's bad."),
    ] },
    { id: 'mth.sf.ci2', when: at(G, 'the-circle'), turns: [
      by('a', "Can we just talk about this?"),
      beat('The champion does not want to talk about this.'),
      by('b', "Just go in there!"),
    ] },
    { id: 'mth.sf.ff1', when: at(G, 'first-fall'), turns: [
      beat('The champion picks {a} up, turns round once, and puts {a.obj} down gently outside the circle.'),
      by('a', "That was quite nice, actually."),
      by('b', "That was a fall! You lost a fall!"),
    ] },
    { id: 'mth.sf.ff2', when: at(G, 'first-fall'), turns: [
      by('b', "Low! Get low!"),
      beat('{a} gets low. The champion gets lower, and pins {a} flat on the sand.'),
      by('a', "That's two to them. Okay. Okay."),
    ] },
    { id: 'mth.sf.tf1', when: at(G, 'three-falls'), turns: [
      beat('Three falls to the champion. The bout is over, and {a} lies on the sand, staring at the sky.'),
      by('b', "We can try again. Do you want to try again?"),
      by('a', "Give me a minute. Give me a few minutes."),
    ] },
    { id: 'mth.sf.tf2', when: at(G, 'three-falls'), turns: [
      by('a', "Two each. Last one. Come on."),
      beat('The champion charges, and {a} goes flying out of the circle.'),
      by('b', "Another bout. Sorry."),
    ] },
  ],
};

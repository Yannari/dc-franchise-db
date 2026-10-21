// Snow Peaks' challenges, stage by stage (js/rr/places/snow-peaks.js `stages`; director.js stageBeats).
//   the sausage    the-meat -> the-grinder -> tie-off -> sausage-ride -> bottom-line   (All-In: grind it, ride it)
//   the slap dance lederhosen -> first-verse -> fast-part -> last-beat                 (Botch or Watch: a dances, b watches)
// A sausage that splits or a crash on the way down means climbing back up and grinding a new one; three misses in a song
// means the song again.
const at = (taskId, stage) => ({ taskId, stage });
const by = (b, say) => ({ by: b, say });
const beat = s => ({ beat: s });

export default {
  'task-stage.ok': [
    // ── the sausage ──
    { id: 'snp.st.mt1', when: at('sausage', 'the-meat'), turns: [
      beat('At the top of the slope there\'s a hand-cranked grinder and a mountain of raw meat beside it, steaming in the cold.'),
      by('b', "We're making a sausage. A giant one."),
      by('a', "And then we sit on it and ride it down the mountain."),
      by('b', "I know. I read the tip. I just didn't believe it."),
    ] },
    { id: 'snp.st.mt2', when: at('sausage', 'the-meat'), turns: [
      by('a', "You feed, I crank."),
      by('b', "Why do I have to touch the meat?"),
      by('a', "Because I called cranking first."),
    ] },
    { id: 'snp.st.gr1', when: at('sausage', 'the-grinder'), turns: [
      beat('{a} turns the crank, {b} pushes the meat in, and a long pink sausage starts to coil out onto the snow.'),
      by('b', "It's working! It's coming out!"),
      by('a', "Keep feeding it! Don't stop!"),
    ] },
    { id: 'snp.st.gr2', when: at('sausage', 'the-grinder'), turns: [
      by('a', "How long does it need to be?"),
      by('b', "Long enough for both of us to sit on."),
      beat('They keep going until the sausage stretches all the way across the snow.'),
    ] },
    { id: 'snp.st.to1', when: at('sausage', 'tie-off'), turns: [
      beat('{b} ties a knot in the end of the skin, very carefully, and they both step back to look at it.'),
      by('a', "That is the biggest sausage I've ever seen."),
      by('b', "And we have to sit on it. Come on."),
    ] },
    { id: 'snp.st.to2', when: at('sausage', 'tie-off'), turns: [
      by('b', "Tight knot. Double knot."),
      by('a', "Triple. I'm not having it burst halfway down."),
      beat('They drag the giant sausage to the edge of the slope.'),
    ] },
    { id: 'snp.st.sr1', when: at('sausage', 'sausage-ride'), turns: [
      beat('They sit on the sausage, push off, and it shoots down the snow like a sled.'),
      by('b', "Goat! There's a goat!"),
      by('a', "Lean left! Lean left!"),
      beat('They lean, and the sausage swerves round the goat with a hand to spare.'),
    ] },
    { id: 'snp.st.sr2', when: at('sausage', 'sausage-ride'), turns: [
      by('a', "This is the strangest thing I've ever done."),
      by('b', "And the fastest! Hold on!"),
      beat('The sausage flies down the slope, both of them holding on with their knees.'),
    ] },
    { id: 'snp.st.bl1', when: at('sausage', 'bottom-line'), turns: [
      beat('The sausage slides over the line at the bottom of the slope and stops in a pile of snow.'),
      by('b', "Still in one piece! Both of us and the sausage!"),
      by('a', "I'm never eating a sausage again."),
    ] },
    { id: 'snp.st.bl2', when: at('sausage', 'bottom-line'), turns: [
      by('a', "Read the tip."),
      by('b', "A slap dance. On dance pads that shock you."),
      by('a', "Of course it is."),
    ] },

    // ── the slap dance ──
    { id: 'snp.st.lh1', when: at('slap-dance', 'lederhosen'), turns: [
      beat('Somebody hands {a} a pair of leather shorts with braces and a little green hat with a feather.'),
      by('b', "Put them on. You'll look great."),
      by('a', "You're only saying that because you don't have to wear them."),
    ] },
    { id: 'snp.st.lh2', when: at('slap-dance', 'lederhosen'), turns: [
      by('a', "How do I look?"),
      by('b', "Like you were born on this mountain. Get on the pad."),
      beat('{a} steps onto the dance pad, and the arrows light up.'),
    ] },
    { id: 'snp.st.fv1', when: at('slap-dance', 'first-verse'), turns: [
      beat('The music starts. {a} stamps on the arrows, slaps both thighs, slaps one shoe, and stamps again.'),
      by('b', "You're doing it! You're in time!"),
      by('a', "Don't talk to me! I'm counting!"),
    ] },
    { id: 'snp.st.fv2', when: at('slap-dance', 'first-verse'), turns: [
      by('b', "Up, up, slap, down! Up, up, slap, down!"),
      beat('{a} hits every arrow on the first verse without a single buzz.'),
      by('a', "Did I get them all? I think I got them all!"),
    ] },
    { id: 'snp.st.fp1', when: at('slap-dance', 'fast-part'), turns: [
      beat('The music speeds up. The arrows come faster. {a} is a blur of stamps and slaps.'),
      by('b', "Faster! Keep up!"),
      by('a', "I am keeping up!"),
    ] },
    { id: 'snp.st.fp2', when: at('slap-dance', 'fast-part'), turns: [
      by('b', "Two misses! Only two! Careful!"),
      beat('{a} slows down, watches every arrow, and gets through the fast part without a third.'),
      by('b', "Yes! That's it! You're through it!"),
    ] },
    { id: 'snp.st.lb1', when: at('slap-dance', 'last-beat'), turns: [
      beat('The song ends with a big stamp and a yodel from the speakers. The screen flashes green.'),
      by('b', "You did it! You slap-danced!"),
      by('a', "My thighs are so red. I slapped them so hard."),
    ] },
    { id: 'snp.st.lb2', when: at('slap-dance', 'last-beat'), turns: [
      by('a', "Can I take the shorts off now?"),
      by('b', "After the Chill Zone. Run!"),
      beat('{a} runs for the slope in lederhosen.'),
    ] },
  ],

  'task-stage.fail': [
    // ── the sausage ──
    { id: 'snp.sf.gr1', when: at('sausage', 'the-grinder'), turns: [
      beat('{a} cranks too fast, and the skin splits open, and meat spills out onto the snow.'),
      by('b', "It burst! Slow down!"),
      by('a', "Sorry! We have to start a new one."),
    ] },
    { id: 'snp.sf.gr2', when: at('sausage', 'the-grinder'), turns: [
      by('b', "Why is it so short?"),
      by('a', "Because you stopped feeding it!"),
      beat('The sausage is about as long as an arm. They need a lot more meat.'),
    ] },
    { id: 'snp.sf.to1', when: at('sausage', 'tie-off'), turns: [
      beat('{b} pulls the knot tight, and the other end of the sausage bursts open with a sad little pop.'),
      by('a', "Not that tight!"),
      by('b', "You said triple knot!"),
    ] },
    { id: 'snp.sf.to2', when: at('sausage', 'tie-off'), turns: [
      by('a', "Did you tie it?"),
      by('b', "I thought you tied it."),
      beat('Nobody tied it. Half the sausage has already slid back out of the skin.'),
    ] },
    { id: 'snp.sf.sr1', when: at('sausage', 'sausage-ride'), turns: [
      beat('Halfway down the slope, a goat steps out, the sausage hits it, and they both go flying into the snow.'),
      by('a', "Are you okay?"),
      by('b', "I'm fine. The goat's fine. The sausage is not fine."),
    ] },
    { id: 'snp.sf.sr2', when: at('sausage', 'sausage-ride'), turns: [
      by('b', "Lean! Lean!"),
      beat('They lean the wrong way, the sausage rolls over, and they tumble off the back of it.'),
      by('a', "Back to the top. New sausage."),
    ] },

    // ── the slap dance ──
    { id: 'snp.sf.lh1', when: at('slap-dance', 'lederhosen'), turns: [
      beat('{a} holds the leather shorts up, looks at them, and hands them back.'),
      by('a', "No. I'm not wearing those."),
      by('b', "You have to! It's part of the challenge!"),
    ] },
    { id: 'snp.sf.lh2', when: at('slap-dance', 'lederhosen'), turns: [
      by('b', "They're on backwards."),
      by('a', "How can you tell?"),
      beat('{a} has to go and change them round, which takes a while.'),
    ] },
    { id: 'snp.sf.fv1', when: at('slap-dance', 'first-verse'), turns: [
      beat('{a} stamps on the wrong arrow, and the pad gives a sharp little buzz.'),
      by('a', "Ow! It actually shocked me!"),
      by('b', "That's one! Two more and you start again!"),
    ] },
    { id: 'snp.sf.fv2', when: at('slap-dance', 'first-verse'), turns: [
      by('b', "Left! Left!"),
      beat('{a} goes right. Buzz. Then left and right at once. Buzz.'),
      by('a', "Stop shouting directions! It's making it worse!"),
    ] },
    { id: 'snp.sf.fp1', when: at('slap-dance', 'fast-part'), turns: [
      beat('The music speeds up, {a} falls behind, and the pad buzzes three times in a row.'),
      by('a', "Ow, ow, ow!"),
      by('b', "That's three. From the top."),
    ] },
    { id: 'snp.sf.fp2', when: at('slap-dance', 'fast-part'), turns: [
      by('a', "It's too fast! Nobody can slap that fast!"),
      beat('{a} slaps a thigh, misses a stamp, and gets buzzed right off the pad.'),
      by('b', "Back on. The song's starting again."),
    ] },
  ],
};

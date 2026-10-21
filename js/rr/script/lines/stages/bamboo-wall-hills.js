// Bamboo Wall Hills' challenges, stage by stage (js/rr/places/bamboo-wall-hills.js `stages`; director.js stageBeats).
//   the wall         wall-start -> wall-steps -> tower-to-tower -> the-gong                  (All-In: both, before the gong)
//   the delicacies   the-bowl -> the-eggs -> the-scorpions -> the-soup -> bowl-empty         (Botch or Watch: a eats, b watches)
// Reaching the tower after the gong, or without the partner, means the start again; leaving anything in the bowl, or
// bringing it back up, means a new bowl. The monk with the gong and the cook are the place's own locals.
const at = (taskId, stage) => ({ taskId, stage });
const by = (b, say) => ({ by: b, say });
const beat = s => ({ beat: s });

export default {
  'task-stage.ok': [
    // ── the wall ──
    { id: 'bw.st.ws1', when: at('wall-race', 'wall-start'), turns: [
      beat('The wall snakes away over the hills, up one ridge and down the next, all the way to a watchtower in the distance.'),
      by('b', "We have to run to that tower? That one, way over there?"),
      by('a', "Before the gong. So let's not stand here looking at it."),
    ] },
    { id: 'bw.st.ws2', when: at('wall-race', 'wall-start'), turns: [
      by('a', "Same pace the whole way. Don't sprint the first bit."),
      by('b', "I always sprint the first bit."),
      by('a', "I know. That's why I said it."),
    ] },
    { id: 'bw.st.st1', when: at('wall-race', 'wall-steps'), turns: [
      beat('The steps get steeper and steeper, some of them up to their knees. They climb on hands and feet.'),
      by('b', "Who built steps this big? Giants?"),
      by('a', "Keep going. It goes down after this. I hope."),
    ] },
    { id: 'bw.st.st2', when: at('wall-race', 'wall-steps'), turns: [
      by('a', "Down's worse than up. Watch your feet."),
      beat('They half run, half slide down the far side, holding on to the wall.'),
      by('b', "My legs are shaking. Are your legs shaking?"),
    ] },
    { id: 'bw.st.tt1', when: at('wall-race', 'tower-to-tower'), turns: [
      beat('They run through one watchtower, out the other side, and on along the top of the wall towards the next.'),
      by('b', "How many towers is that?"),
      by('a', "Don't count. Counting makes it worse."),
    ] },
    { id: 'bw.st.tt2', when: at('wall-race', 'tower-to-tower'), turns: [
      by('a', "Grab my hand. We stay together."),
      beat('They run the flat stretch side by side, hand in hand.'),
      by('b', "I can see the last tower! I can see the monk!"),
    ] },
    { id: 'bw.st.gg1', when: at('wall-race', 'the-gong'), turns: [
      beat('They stagger into the last watchtower together. The monk lowers the gong stick, and nods.'),
      by('b', "Before the gong? We made it before the gong?"),
      beat('The monk hands over the tip without a word.'),
    ] },
    { id: 'bw.st.gg2', when: at('wall-race', 'the-gong'), turns: [
      by('a', "Run! Last bit! Run!"),
      beat('They dive through the door of the tower, and only then does the gong ring out over the hills.'),
      by('b', "Just in time. Just, just in time."),
    ] },

    // ── the delicacies ──
    { id: 'bw.st.bl1', when: at('delicacies', 'the-bowl'), turns: [
      beat('The cook sets down a big bowl. In it: black eggs, scorpions on sticks, a cloudy soup, and something the cook won\'t name.'),
      by('b', "What's that one?"),
      by('a', "Don't ask what it is. Asking makes it worse."),
    ] },
    { id: 'bw.st.bl2', when: at('delicacies', 'the-bowl'), turns: [
      by('a', "Every bite? The whole bowl?"),
      beat('The cook nods, folds their arms, and waits.'),
      by('b', "You've got this. Just don't look at it."),
    ] },
    { id: 'bw.st.eg1', when: at('delicacies', 'the-eggs'), turns: [
      beat('{a} picks up a thousand-year egg. It\'s black and see-through, like jelly.'),
      by('a', "It's wobbling. Why is it wobbling?"),
      beat('{a} pops it in {a.posAdj} mouth, chews twice, and swallows.'),
    ] },
    { id: 'bw.st.eg2', when: at('delicacies', 'the-eggs'), turns: [
      by('b', "How is it?"),
      by('a', "It tastes like an egg that's been waiting a long time to get me."),
      by('b', "Next one. Quick, before you think about it."),
    ] },
    { id: 'bw.st.sc1', when: at('delicacies', 'the-scorpions'), turns: [
      beat('{a} holds up a fried scorpion on a stick, looks it in the eye, and bites the whole thing off.'),
      by('b', "You did it! What's it like?"),
      by('a', "Crunchy. Very, very crunchy."),
    ] },
    { id: 'bw.st.sc2', when: at('delicacies', 'the-scorpions'), turns: [
      by('a', "Does the tail still sting? After it's cooked?"),
      by('b', "No. Probably not. Just eat it."),
      beat('{a} eats it, tail and all, with {a.posAdj} eyes shut.'),
    ] },
    { id: 'bw.st.sp1', when: at('delicacies', 'the-soup'), turns: [
      beat('{a} lifts the bowl and drinks the soup, things floating and all, in one long go.'),
      by('b', "Don't stop! Keep going!"),
      beat('{a} puts down the bowl and wipes {a.posAdj} mouth.'),
    ] },
    { id: 'bw.st.sp2', when: at('delicacies', 'the-soup'), turns: [
      by('a', "What's the thing at the bottom?"),
      by('b', "The cook won't say. I don't think you want to know."),
      beat('{a} eats it anyway, and doesn\'t ask again.'),
    ] },
    { id: 'bw.st.eb1', when: at('delicacies', 'bowl-empty'), turns: [
      beat('{a} turns the bowl upside down in front of the cook. Nothing falls out.'),
      by('b', "Empty! Every bite!"),
      beat('The cook looks into the bowl, smiles, and hands over the tip.'),
    ] },
    { id: 'bw.st.eb2', when: at('delicacies', 'bowl-empty'), turns: [
      by('a', "I need water. A lot of water."),
      by('b', "Chill Zone's at the end of the wall. There'll be water there."),
      by('a', "There had better be."),
    ] },
  ],

  'task-stage.fail': [
    // ── the wall ──
    { id: 'bw.sf.st1', when: at('wall-race', 'wall-steps'), turns: [
      beat('Halfway up the steepest stretch, {b} sits down on a step, red in the face and puffing hard.'),
      by('b', "I need a minute. Just one minute."),
      by('a', "We don't have a minute! The gong!"),
    ] },
    { id: 'bw.sf.st2', when: at('wall-race', 'wall-steps'), turns: [
      by('a', "Why are we going so slowly?"),
      by('b', "Because these steps are as tall as I am!"),
      beat('They stop, hands on knees, to catch their breath.'),
    ] },
    { id: 'bw.sf.tt1', when: at('wall-race', 'tower-to-tower'), turns: [
      beat('{a} sprints into the next tower, turns round, and {b} is nowhere to be seen.'),
      by('a', "Where did you go?"),
      by('b', "I'm back here! You left me back here!"),
    ] },
    { id: 'bw.sf.tt2', when: at('wall-race', 'tower-to-tower'), turns: [
      by('b', "Wait for me!"),
      beat('{a} doesn\'t hear, and runs on alone. Arriving without a partner doesn\'t count.'),
      by('a', "Sorry! Sorry! I thought you were right behind me!"),
    ] },
    { id: 'bw.sf.gg1', when: at('wall-race', 'the-gong'), turns: [
      beat('The last tower is in sight when the monk lifts the stick and strikes the gong. BONG.'),
      by('b', "No! We were so close!"),
      by('a', "Back to the start. The whole section again."),
    ] },
    { id: 'bw.sf.gg2', when: at('wall-race', 'the-gong'), turns: [
      by('a', "Nearly there! Nearly!"),
      beat('The gong rings out while they\'re still on the last flight of steps.'),
      by('b', "How does the monk know? How do they decide when?"),
    ] },

    // ── the delicacies ──
    { id: 'bw.sf.eg1', when: at('delicacies', 'the-eggs'), turns: [
      beat('{a} bites into the egg, freezes, and spits it straight back out into the bowl.'),
      by('a', "I can't. The smell. The smell got me."),
      by('b', "New bowl. You have to start again."),
    ] },
    { id: 'bw.sf.eg2', when: at('delicacies', 'the-eggs'), turns: [
      by('b', "Why are you holding it so far away?"),
      by('a', "Because it's looking at me."),
      beat('The egg slips off the chopsticks and rolls across the table.'),
    ] },
    { id: 'bw.sf.sc1', when: at('delicacies', 'the-scorpions'), turns: [
      beat('{a} bites the scorpion, gags, and runs to the edge of the wall.'),
      by('b', "Don't! Don't bring it back up!"),
      beat('{a} does. The cook calmly brings out a fresh bowl.'),
    ] },
    { id: 'bw.sf.sc2', when: at('delicacies', 'the-scorpions'), turns: [
      by('a', "It's stuck in my teeth. The leg's stuck in my teeth."),
      by('b', "Swallow! Just swallow!"),
      beat('{a} can\'t, and spits the whole thing out.'),
    ] },
    { id: 'bw.sf.sp1', when: at('delicacies', 'the-soup'), turns: [
      beat('{a} drinks most of the soup, then puts the bowl down with the unnamed thing still sitting at the bottom.'),
      by('a', "I'm not eating that. I'm not."),
      by('b', "Then it's a whole new bowl!"),
    ] },
    { id: 'bw.sf.sp2', when: at('delicacies', 'the-soup'), turns: [
      by('b', "You left a bit! There's a bit left!"),
      beat('The cook points at one tiny piece in the bottom of the bowl, takes it away, and brings a full one.'),
      by('a', "For one bit? One tiny bit?"),
    ] },
  ],
};

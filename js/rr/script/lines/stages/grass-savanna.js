// Grass Savanna's challenges, stage by stage (js/rr/places/grass-savanna.js `stages`; director.js stageBeats).
//   the plums    plum-trees -> plum-picking -> footballs -> full-basket            (All-In: a basket to the brim)
//   the gourds   gourd-row -> first-swings -> last-gourds -> ten-for-ten           (Botch or Watch: a swings, b watches)
//   the safari   the-tracks -> tall-grass -> sleepy-dart -> the-tag                (All-In: both track it)
// A ball that knocks the basket over spills the plums; a miss or a gourd that stays means the row goes back up; a missed
// dart, a spooked animal or the wrong animal means tracking it again. The elder and the ranger are the place's locals.
const at = (taskId, stage) => ({ taskId, stage });
const by = (b, say) => ({ by: b, say });
const beat = s => ({ beat: s });

export default {
  'task-stage.ok': [
    // ── the plums ──
    { id: 'gs.st.pt1', when: at('plums', 'plum-trees'), turns: [
      beat('Between the huts, the plum trees hang heavy with dark purple fruit. A group of children watch them, footballs at their feet.'),
      by('b', "Why are they smiling like that?"),
      by('a', "Don't look at them. Look at the plums."),
    ] },
    { id: 'gs.st.pt2', when: at('plums', 'plum-trees'), turns: [
      by('a', "Fill the basket. To the top."),
      by('b', "That's a big basket."),
      beat('They grab the basket and head for the nearest tree.'),
    ] },
    { id: 'gs.st.pp1', when: at('plums', 'plum-picking'), turns: [
      beat('{a} reaches up and pulls down a whole branch, and {b} picks it clean into the basket.'),
      by('b', "They're so ripe. They come off in your hand."),
      by('a', "Don't eat any. I can see you thinking about it."),
    ] },
    { id: 'gs.st.pp2', when: at('plums', 'plum-picking'), turns: [
      by('b', "Gently. Don't squash them."),
      beat('Handful by handful, the basket fills up.'),
      by('a', "Halfway. We're halfway."),
    ] },
    { id: 'gs.st.fb1', when: at('plums', 'footballs'), turns: [
      beat('A football whizzes past {a}\'s head, then another. The children are laughing.'),
      by('a', "Duck! Protect the basket!"),
      beat('{b} wraps both arms round the basket, and a ball bounces off {b.posAdj} back.'),
    ] },
    { id: 'gs.st.fb2', when: at('plums', 'footballs'), turns: [
      by('b', "Here comes another one!"),
      beat('{a} kicks the ball straight back, and the children cheer.'),
      by('a', "Keep picking! I'll handle the footballs!"),
    ] },
    { id: 'gs.st.fl1', when: at('plums', 'full-basket'), turns: [
      beat('They carry the basket over to the village elder, plums piled up over the brim.'),
      by('b', "It's full. Right to the top."),
      beat('The elder takes one plum off the top, bites it, nods, and hands over the tip.'),
    ] },
    { id: 'gs.st.fl2', when: at('plums', 'full-basket'), turns: [
      by('a', "Tip says gourds. And a cricket bat."),
      by('b', "I'm so glad to be leaving those children behind."),
      beat('A football bounces after them as they go.'),
    ] },

    // ── the gourds ──
    { id: 'gs.st.gr1', when: at('gourds', 'gourd-row'), turns: [
      beat('Ten wooden posts stand in a row, a hard round gourd balanced on top of each one.'),
      by('b', "One swing for each. No missing."),
      by('a', "Ten swings, ten gourds. How hard can it be?"),
    ] },
    { id: 'gs.st.gr2', when: at('gourds', 'gourd-row'), turns: [
      by('a', "This bat's flat. Why is it flat?"),
      by('b', "It's a cricket bat. Just swing it."),
      beat('{a} takes a couple of practice swings at the air.'),
    ] },
    { id: 'gs.st.fsw1', when: at('gourds', 'first-swings'), turns: [
      beat('{a} swings. The first gourd flies off its post and smashes on the ground. Then the second.'),
      by('b', "Yes! Two down!"),
      by('a', "Don't count out loud. You'll jinx it."),
    ] },
    { id: 'gs.st.fsw2', when: at('gourds', 'first-swings'), turns: [
      by('b', "Eyes on the gourd. Not on me."),
      beat('Crack. Crack. Crack. Three gourds go flying, one after the other.'),
      by('a', "I'm good at this! Why am I good at this?"),
    ] },
    { id: 'gs.st.lg1', when: at('gourds', 'last-gourds'), turns: [
      beat('Nine gourds lie smashed in the grass. {a} lines up the last one, and swings.'),
      by('b', "Don't miss now. Please don't miss now."),
      beat('The last gourd sails off its post and bursts on the ground.'),
    ] },
    { id: 'gs.st.lg2', when: at('gourds', 'last-gourds'), turns: [
      by('a', "Two left. Just two."),
      beat('{a} steadies {a.ref}, swings, swings again, and both gourds go flying.'),
      by('b', "That's ten! That's all ten!"),
    ] },
    { id: 'gs.st.tt1', when: at('gourds', 'ten-for-ten'), turns: [
      beat('Ten empty posts, ten smashed gourds. {a} drops the bat.'),
      by('b', "Ten for ten! You didn't miss once!"),
      by('a', "Tip. Grab the tip before I start bragging."),
    ] },
    { id: 'gs.st.tt2', when: at('gourds', 'ten-for-ten'), turns: [
      by('a', "Safari next. We have to find some animal."),
      by('b', "With a dart? Like a real ranger?"),
      by('a', "Like a real ranger."),
    ] },

    // ── the safari ──
    { id: 'gs.st.tk1', when: at('safari', 'the-tracks'), turns: [
      beat('In the mud, a line of hoof prints leads off towards the tall grass.'),
      by('a', "Hooves. Four of them. Something big."),
      by('b', "Follow them. Quietly."),
    ] },
    { id: 'gs.st.tk2', when: at('safari', 'the-tracks'), turns: [
      by('b', "The grass is broken over there. Something went through."),
      beat('The ranger whistles twice and points the same way.'),
      by('a', "See? We're natural trackers."),
    ] },
    { id: 'gs.st.tg1', when: at('safari', 'tall-grass'), turns: [
      beat('They creep through the tall grass on hands and knees. Ahead, black and white stripes show between the stalks.'),
      by('b', "A zebra. It's a zebra."),
      by('a', "Shh. Don't scare it. Closer."),
    ] },
    { id: 'gs.st.tg2', when: at('safari', 'tall-grass'), turns: [
      by('a', "Stop. It's looking this way."),
      beat('They freeze in the grass. After a long moment, the animal goes back to eating.'),
      by('b', "Okay. It didn't see us. Keep going."),
    ] },
    { id: 'gs.st.sd1', when: at('safari', 'sleepy-dart'), turns: [
      beat('{a} raises the blowpipe, takes a deep breath, and puffs. The dart lands right in the animal\'s rump.'),
      by('b', "Got it! You got it!"),
      beat('The animal yawns, wobbles, and lies down in the grass for a nap.'),
    ] },
    { id: 'gs.st.sd2', when: at('safari', 'sleepy-dart'), turns: [
      by('b', "Big breath. One puff."),
      beat('Fwip. The dart hits, and the animal\'s eyes slowly close.'),
      by('a', "Sweet dreams. Sorry about that."),
    ] },
    { id: 'gs.st.tag1', when: at('safari', 'the-tag'), turns: [
      beat('The ranger creeps up to the sleeping animal and clips a little tag onto its ear.'),
      by('b', "Is it okay? Is it just sleeping?"),
      beat('The ranger nods, gives a thumbs up, and hands over the tip.'),
    ] },
    { id: 'gs.st.tag2', when: at('safari', 'the-tag'), turns: [
      by('a', "Chill Zone. Out on the plain. Let's go before it wakes up."),
      by('b', "Bye. Sorry we shot you."),
      beat('They tiptoe away through the grass.'),
    ] },
  ],

  'task-stage.fail': [
    // ── the plums ──
    { id: 'gs.sf.pp1', when: at('plums', 'plum-picking'), turns: [
      beat('{b} grabs a handful of plums too hard, and they burst all over {b.posAdj} hands.'),
      by('b', "They're squashing! They're too ripe!"),
      by('a', "Gently! Like eggs! Pick them like eggs!"),
    ] },
    { id: 'gs.sf.pp2', when: at('plums', 'plum-picking'), turns: [
      by('a', "Why is the basket purple inside?"),
      by('b', "I may have squashed a few."),
      beat('They tip out the squashed ones and keep picking.'),
    ] },
    { id: 'gs.sf.fb1', when: at('plums', 'footballs'), turns: [
      beat('A football smacks straight into the basket and knocks it over. Plums roll everywhere.'),
      by('a', "No! No, no, no!"),
      by('b', "Pick them up! Every one of them!"),
    ] },
    { id: 'gs.sf.fb2', when: at('plums', 'footballs'), turns: [
      by('b', "Watch out!"),
      beat('{a} turns round just in time to take a ball in the stomach, and drops the whole basket.'),
      by('a', "Right in the plums. They went right for the plums."),
    ] },

    // ── the gourds ──
    { id: 'gs.sf.fsw1', when: at('gourds', 'first-swings'), turns: [
      beat('{a} swings hard, and misses the gourd completely. The bat whooshes through thin air.'),
      by('a', "It moved! The gourd moved!"),
      by('b', "Gourds don't move. Back to the start."),
    ] },
    { id: 'gs.sf.fsw2', when: at('gourds', 'first-swings'), turns: [
      by('b', "Too low! You hit the post!"),
      beat('The post rattles, the gourd stays where it is, and all the smashed gourds are set back up.'),
      by('a', "My arms are ringing. My whole arms."),
    ] },
    { id: 'gs.sf.lg1', when: at('gourds', 'last-gourds'), turns: [
      beat('Nine down. {a} swings at the tenth. It wobbles, spins round once, and stays on its post.'),
      by('a', "Fall! Fall off!"),
      by('b', "It's not falling. Start again. All ten."),
    ] },
    { id: 'gs.sf.lg2', when: at('gourds', 'last-gourds'), turns: [
      by('a', "One left. Easy."),
      beat('{a} swings too early, and the bat sails out of {a.posAdj} hands into the bushes.'),
      by('b', "That's a miss! Go and get the bat!"),
    ] },

    // ── the safari ──
    { id: 'gs.sf.tk1', when: at('safari', 'the-tracks'), turns: [
      beat('They follow the tracks for ages, right up to a very surprised family of warthogs.'),
      by('b', "That's not it. That's definitely not it."),
      by('a', "Back. Slowly. Back to the tracks."),
    ] },
    { id: 'gs.sf.tk2', when: at('safari', 'the-tracks'), turns: [
      by('a', "These are our footprints."),
      by('b', "We've been following ourselves? In a circle?"),
      beat('The ranger whistles, and points the other way.'),
    ] },
    { id: 'gs.sf.tg1', when: at('safari', 'tall-grass'), turns: [
      beat('{b} steps on a dry stick. CRACK. The animal\'s head shoots up, and it gallops off across the plain.'),
      by('a', "Why that stick? Out of all the sticks?"),
      by('b', "I didn't see it! It's grass! It's all grass!"),
    ] },
    { id: 'gs.sf.tg2', when: at('safari', 'tall-grass'), turns: [
      by('a', "Achoo!"),
      beat('The sneeze echoes across the savanna. The animal bolts.'),
      by('b', "You sneezed! On a safari!"),
    ] },
    { id: 'gs.sf.sd1', when: at('safari', 'sleepy-dart'), turns: [
      beat('{a} puffs into the blowpipe. The dart flops out of the end and lands at {a.posAdj} feet.'),
      by('b', "Harder! You have to blow harder!"),
      by('a', "That was hard! That was my hardest!"),
    ] },
    { id: 'gs.sf.sd2', when: at('safari', 'sleepy-dart'), turns: [
      by('b', "Now! Shoot now!"),
      beat('The dart flies just over the animal\'s back. It looks round, and trots off.'),
      by('a', "So close. Track it again."),
    ] },
  ],
};

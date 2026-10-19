// More of Don at the mat, in his real voice (docs/rr-writers-brief.md, 2026-10-19). Measured 2026-10-19: the
// distracted check-in aired 11 times a season from 2, wary of a scheming team 10 from 2, the penalty reveal 8 from 3, the
// last team going home 7 from 2. `bored` is Don caught busy (his phone, his makeup, a snack: the wiki's Don, caught
// doing his makeup when a team arrives too fast). Some send-offs are aimed at who the team is ("and out. That's match.").
import { V } from '../places/_kit.js';

const don = say => ({ by: 'don', say });
const out = (identity, line, reply, button) => ({ id: `vdm.out-${identity}`, when: { identity }, turns: [don(line), reply, button] });

export default {
  retire: [],
  pools: {
    'don-place.bored': [
      { id: 'vdm.z1', turns: [
        { beat: 'Don is halfway through his makeup when {a} and {b} arrive. He freezes, brush in hand.' },
        don("You're early! Why are you early? Did you skip something?"),
        { by: 'a', say: "We just went really fast." },
        don("Well, stop it. {team}, you're {placing}. Give me a minute with my face."),
      ] },
      { id: 'vdm.z2', turns: [
        { beat: 'Don is taking a selfie with the view behind him and doesn\'t notice them at first.' },
        { by: 'b', say: "Um. Don? We're here." },
        don("One sec. Lighting. There. {team}! {placing}! Want to be in the next one?"),
        { by: 'a', say: "Yes!" },
      ] },
      { id: 'vdm.z3', turns: [
        { beat: 'Don has his mouth full of sandwich when {a} and {b} step onto the mat.' },
        don("Mmf. {team}. Mmf. {placing}."),
        { by: 'b', say: "Is that a sandwich? Where did you get a sandwich?" },
        don("Hosts get sandwiches. Racers get water. That's the deal."),
      ] },
      { id: 'vdm.z4', turns: [
        { beat: 'Don is on the phone, deep in conversation, and waves them on to the mat without looking.' },
        don("No, the blue one. The blue one! Hold on. {team}, you're {placing}. Lovely. Back to the blue one."),
        { by: 'a', say: "Should we just... go and sit?" },
        { by: 'b', say: "I think we just go and sit." },
      ] },
      { id: 'vdm.z5', turns: [
        { beat: 'Don is lying back on a sun lounger next to the mat, sunglasses on.' },
        don("Is that... {team}? You're {placing}. I'm not getting up. The tan's at a crucial stage."),
        { by: 'a', say: "Fair enough." },
      ] },
      { id: 'vdm.z6', turns: [
        { beat: 'Don is having his hair touched up by a stylist when {a} and {b} run in.' },
        don("Don't look at me! I'm not ready! {team}, {placing}, now look away."),
        { by: 'b', say: "We've seen you without makeup, Don." },
        don("Nobody has seen me without makeup."),
      ] },
      { id: 'vdm.z7', turns: [
        { beat: 'Don is practising his serious face in a hand mirror.' },
        don("Hm? Oh. {team}. {placing}. Was that face serious enough?"),
        { by: 'a', say: "Very serious." },
        don("Thank you. I'm saving it for the elimination."),
      ] },
      { id: 'vdm.z8', turns: [
        { beat: 'Don is reading a magazine with his own face on the cover.' },
        don("{team}! You're {placing}. Have you seen this? Page twelve. Lovely photo."),
        { by: 'b', say: "Is that you?" },
        don("Who else would it be?"),
      ] },
    ],
    'don-place.scared-of-them': [
      { id: 'vdm.s1', turns: [
        { beat: '{a} and {b} step onto the mat. Don quietly moves his coffee out of reach.' },
        don("{team}! You're {placing}. Lovely to see you. From here."),
        { by: 'a', say: "Why did you move your coffee?" },
        don("No reason! Totally normal coffee move."),
      ] },
      { id: 'vdm.s2', turns: [
        don("{team}, you're {placing}. And I'd like to remind you there are cameras everywhere. Everywhere."),
        { by: 'b', ...V("Why are you telling us that?", "Why tell us?", "Why say that?", "Why are you TELLING us that?", "Why are you telling us that, exactly?", "Is that a threat or a fun fact?") },
        don("Just a fun fact! For no reason!"),
      ] },
      { id: 'vdm.s3', turns: [
        { beat: 'Two interns step up beside Don as {a} and {b} arrive.' },
        don("{team}, you're {placing}. These are my friends. They're just standing here. Being friends."),
        { by: 'a', say: "We're not going to do anything." },
        don("That's what the last team you were nice to said."),
      ] },
      { id: 'vdm.s4', turns: [
        don("{team}, {placing}. I've heard a lot about you two this leg."),
        { by: 'b', say: "Good things?" },
        don("Things! I've heard things! Please don't do any of them to me."),
      ] },
      { id: 'vdm.s5', turns: [
        { beat: 'Don announces their place from behind the Don Box, which he is using as a shield.' },
        don("{team}! {placing} place! Great job! Stay right there!"),
        { by: 'a', say: "Are you hiding behind the box?" },
        don("I'm leaning on the box. It's a lean."),
      ] },
      { id: 'vdm.s6', turns: [
        don("{team}, you're the {placing} team to arrive. I've hidden all the sharp objects."),
        { by: 'b', say: "That's a bit much." },
        don("And the snacks. Just in case. Go sit, please. Nice and far."),
      ] },
    ],
    'don-place.penalty-reveal': [
      { id: 'vdm.p1', turns: [
        don("{team}, you would be the {placing} team to arrive."),
        { by: 'a', say: "Would be? Why would be?" },
        don("Because there's a penalty! Over to the penalty spot, please. Don't worry, it's very comfortable. It's a rock."),
      ] },
      { id: 'vdm.p2', turns: [
        { beat: 'Don holds out a hand before they can step onto the mat.' },
        don("Ah ah ah! Not yet, {team}. Penalty first."),
        { by: 'b', ...V("What? Why?", "Why?", "What for?", "WHAT? WHY?", "What? What for?", "A penalty? On what charge?") },
        don("Because the tip said what it said, and you did what you did. Off you go!"),
      ] },
      { id: 'vdm.p3', turns: [
        don("{team}! You'd be {placing}, if it wasn't for one little thing."),
        { by: 'a', say: "Oh no. What little thing?" },
        don("A penalty! Not so little, actually. Go and wait it out with the sad people."),
      ] },
      { id: 'vdm.p4', turns: [
        don("{team}, before you celebrate, there's a penalty with your name on it."),
        { by: 'b', say: "We were so close." },
        don("You were! And now you're so close, and waiting. Tick tock!"),
      ] },
      { id: 'vdm.p5', turns: [
        { beat: 'Don is holding up a stopwatch when they arrive.' },
        don("{team}! Welcome to the penalty zone. It's like the Chill Zone, but sadder."),
        { by: 'a', say: "How long?" },
        don("Long enough to think about what you did. Start thinking!"),
      ] },
    ],
    'don-elim.accepts': [
      { id: 'vdm.e1', turns: [
        don("{team}, you're the last team to arrive."),
        { beat: 'Don lets the silence hang. {a} takes {b}\'s hand.' },
        don("I'm sorry. You've been eliminated from the Ridonculous Race."),
        { by: 'a', say: "We knew. We knew a while ago." },
        { by: 'b', say: "It was the best thing we've ever done, though." },
        don("It was a pleasure having you. Mostly. Okay, a lot of the time."),
      ] },
      { id: 'vdm.e2', turns: [
        don("{team}, I'm afraid you're the last team to arrive, and you've been eliminated."),
        { by: 'b', ...V("That's okay. That's okay. We did our best.", "It's okay. We did our best.", "Okay. We tried.", "That's OKAY! That's OKAY! We did our BEST!", "That's okay, honestly. We did our best.", "That's okay. Our best was simply not enough.") },
        { by: 'a', say: "Can we take a picture with the mat?" },
        don("You can take a picture with me. That's better than the mat."),
      ] },
      { id: 'vdm.e3', turns: [
        { beat: 'Don puts on his serious face. He\'s clearly been practising it.' },
        don("{team}. You are the last team to arrive."),
        { by: 'a', say: "We know. You did the face." },
        don("I did do the face. You've been eliminated. I'm sorry. The face is sorry too."),
      ] },
      { id: 'vdm.e4', turns: [
        don("{team}, you're the last team to arrive. And I'm sad to say, your race is over."),
        { by: 'b', say: "Are you actually sad?" },
        don("A little bit! You were one of the nice ones. I'll miss the nice ones. Briefly."),
        { by: 'a', say: "We'll take briefly." },
      ] },
      out('tennis-rivals', "{team}, you're the last team to arrive. You're out. And out. That's match.",
        { by: 'a', say: "Did you just do a tennis joke at us?" }, don("I've been saving that one since the first leg.")),
      out('ice-dancers', "{team}, you're the last team to arrive, and you've been eliminated. You can stop smiling now.",
        { by: 'b', say: "We can't. Our faces are stuck." }, don("Then I'll remember you exactly like that.")),
      out('goths', "{team}, you're last, and you're out. Try to look sad. For me.",
        { by: 'a', say: "This is our sad face." }, don("It's the same as your happy face!")),
      out('cheerleaders', "{team}, I'm sorry. You're the last team to arrive, and you've been eliminated.",
        { by: 'b', say: "Can we do one last cheer?" }, don("One. Short. Very short.")),
      out('magicians', "{team}, you're the last team to arrive, and you've been eliminated. Time to make yourselves disappear.",
        { by: 'a', say: "Is that a magic joke?" }, don("I had a whole bit. That was the best part.")),
      out('gamers', "{team}, you're the last team to arrive. Game over.",
        { by: 'b', say: "Can we continue? Insert coin?" }, don("No continues. No coins. Goodbye!")),
      out('chefs', "{team}, you're the last team to arrive, and you've been eliminated. Your race is... cooked.",
        { by: 'a', say: "Seriously?" }, don("I know. I'm very proud of that one.")),
      out('lawyers', "{team}, you're the last team to arrive, and you're out. And before you object: overruled.",
        { by: 'b', say: "We'd like to appeal." }, don("Appeal denied. Court is adjourned.")),
      out('influencers', "{team}, you're the last team to arrive. You've been eliminated. You can post about it now.",
        { by: 'a', say: "Can you say that again? We weren't filming." }, don("No. That was the take.")),
      out('surfers', "{team}, you're the last team to arrive, and you've been eliminated. Looks like you missed the wave.",
        { by: 'b', say: "That's harsh, dude." }, don("It's a little harsh. Catch you later!")),
      out('cowboys', "{team}, you're the last team to arrive. Looks like this is the end of the trail.",
        { by: 'a', say: "End of the trail. Yeah." }, don("Ride off into the sunset. It's that way.")),
      out('police-cadets', "{team}, you're the last team to arrive, and you've been eliminated. Case closed.",
        { by: 'b', say: "Did you write that?" }, don("I've got one for every team. Some are better than others.")),
    ],
    'don-elim.argues': [
      { id: 'vdm.a1', turns: [
        don("{team}, you're the last team to arrive, and you've been eliminated."),
        { by: 'a', say: "Hold on. Hold on. Was the clock right? Has anybody checked the clock?" },
        don("The clock is always right. The clock is my best friend."),
        { by: 'b', say: "Let it go. Please." },
      ] },
      { id: 'vdm.a2', turns: [
        don("{team}, last team to arrive. You're out."),
        { by: 'b', ...V("That other team had help! Somebody helped them!", "They had help!", "Somebody helped them!", "That OTHER team had HELP! Somebody HELPED them!", "That other team had help, though! Somebody helped them!", "They had assistance! Illegal, beautiful assistance!") },
        don("Maybe. But they were here first, and you weren't. Goodbye!"),
      ] },
      { id: 'vdm.a3', turns: [
        don("{team}, I'm sorry. You've been eliminated."),
        { by: 'a', say: "We want a recount." },
        don("There's nothing to count! You're last! It's one number!"),
        { by: 'b', say: "Come on. Let's just go." },
      ] },
    ],
    'don-elim.tantrum': [
      { id: 'vdm.t1', turns: [
        don("{team}, you're the last team to arrive, and you've been eliminated."),
        { by: 'a', ...V("This is a joke! This whole race is a joke!", "This is a joke!", "This is a joke.", "This is a JOKE! This WHOLE race is a JOKE!", "This is a joke! This entire race is a joke!", "This race is a farce! A circus! A circus with a mat!") },
        { beat: '{a} throws {a.posAdj} bag down. It lands on Don\'s foot.' },
        don("Ow! That's my foot! That's my good foot!"),
      ] },
      { id: 'vdm.t2', turns: [
        don("{team}, you've been eliminated."),
        { by: 'b', say: "No! No! We're not leaving! We're staying right here on this mat!" },
        { beat: '{b} sits down on the mat and folds {b.posAdj} arms.' },
        don("Okay. Security? Gently, please. Very gently."),
      ] },
    ],
    'don-fakeout.relief': [
      { id: 'vdm.r1', turns: [
        don("{team}, you're the last team to arrive..."),
        { beat: 'Don stares at them. They stare back. Someone\'s knees are shaking.' },
        don("...and I'm happy to tell you that this is a non-elimination leg! You're still in the race!"),
        { by: 'a', say: "Why would you do that to us? Why the pause?" },
        don("The pause is the best part!"),
      ] },
      { id: 'vdm.r2', turns: [
        don("{team}. Last team to arrive. Which means..."),
        { by: 'b', say: "Just say it. Please. Just say it." },
        don("Which means nothing! Non-elimination leg! You're safe!"),
        { by: 'a', ...V("I'm going to cry. I'm actually going to cry.", "I'm going to cry.", "I'll cry.", "I'm going to CRY! I'm ACTUALLY going to CRY!", "I'm going to cry, I'm actually going to cry.", "My tears are already on their way.") },
      ] },
      { id: 'vdm.r3', turns: [
        don("{team}, I have bad news, and good news. The bad news: you're last."),
        { by: 'a', say: "And the good news?" },
        don("Non-elimination leg! You get to keep racing!"),
        { by: 'b', say: "That's the best bad news I've ever had." },
      ] },
    ],
    'don-fakeout.fury': [
      { id: 'vdm.y1', turns: [
        don("{team}, you're the last team to arrive. And..."),
        { beat: 'Don checks his watch. Then his nails. Then his watch again.' },
        don("...it's a non-elimination leg!"),
        { by: 'a', say: "You checked your nails! In the middle! You checked your nails!" },
        don("They needed checking."),
      ] },
      { id: 'vdm.y2', turns: [
        don("{team}, I'm sorry to tell you..."),
        { by: 'b', say: "Here we go." },
        don("...that you'll have to keep racing, because this is a non-elimination leg!"),
        { by: 'b', ...V("You said sorry! You said 'I'm sorry to tell you'!", "You said sorry!", "You said you were sorry!", "You SAID sorry! You said 'I'm SORRY to tell you'!", "You said you were sorry to tell us!", "You apologised! For good news!") },
        don("I'm sorry you have to keep racing. It's very tiring."),
      ] },
    ],
  },
};

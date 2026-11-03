// More of the pools that repeated within a season: Don checking in the middle of the pack, confessionals about
// another team, a memory, a crush noticed by the partner, heckling, being caught spying, a row that escalates.
// Written again 2026-11-03 (the user: "they talk like a bad translation"): Don in his upbeat host voice (these had gone
// back to bored deadpan, "the beige of results", "I've already forgotten it"), the racers in plain speech.
const don = say => ({ by: 'don', say });
const MID = { matPlace: 'mid' };

export default {
  retire: [],
  pools: {
    'don-place.plain': [
      { id: 'vr.m1', when: MID, turns: [
        don("{team}, you're the {placing} team to arrive, right in the middle of the pack!"),
        { by: 'a', say: "The middle's good. We'll take the middle." },
        don("The middle is safe, and safe is good!"),
      ] },
      { id: 'vr.m2', when: MID, turns: [
        don("{team}, you're the {placing} team to arrive, so not first and not last."),
        { by: 'b', say: "Honestly, that's all we wanted." },
        don("Then you got exactly what you wanted. Congratulations!"),
      ] },
      { id: 'vr.m3', when: MID, turns: [
        don("{team}, you're the {placing} team to arrive! How are you feeling?"),
        { by: 'a', say: "Tired. So tired." },
        don("Well, get some rest, because tomorrow's going to be even harder!"),
      ] },
      { id: 'vr.m4', when: MID, turns: [
        don("{team}, you're the {placing} team to arrive, safe and sound!"),
        { by: 'b', say: "Oh, thank God. I really thought we were near the back." },
        don("Not even close, so go and sit down, because you've earned it."),
      ] },
      { id: 'vr.m5', when: MID, turns: [
        don("{team}, you're in {placing} place, and you're still in it!"),
        { by: 'a', say: "That's all we wanted to hear." },
        don("Then I'll keep saying it for as long as you keep making it!"),
      ] },
      { id: 'vr.m6', when: MID, turns: [
        don("{team}, you're the {placing} team to arrive."),
        { by: 'b', say: "How far behind the leaders are we?" },
        don("A little while, but you're well ahead of the teams still out there."),
      ] },
      { id: 'vr.m7', when: MID, turns: [
        don("{team}, you're the {placing} team to arrive, and you look exhausted."),
        { by: 'a', say: "We are exhausted." },
        don("Well, you made it, and that's what counts. Go get some water."),
      ] },
      { id: 'vr.m8', when: MID, turns: [
        don("{team}, you're in {placing} place, and that's a solid leg!"),
        { by: 'b', say: "It didn't feel solid. It felt like a mess." },
        don("From where I'm standing, a mess that got you {placing} is a good mess."),
      ] },
      { id: 'vr.m9', when: MID, turns: [
        don("{team}, you're the {placing} team to arrive!"),
        { by: 'a', say: "Is that good? I've lost track of everything." },
        don("It's good! You're safe, and there are teams still out there."),
      ] },
      { id: 'vr.m10', when: MID, turns: [
        { beat: '{a} and {b} jog onto the mat, look behind them, and see the next team coming round the corner.' },
        don("{team}, you're the {placing} team to arrive, and just in time, by the look of it!"),
        { by: 'b', say: "They were right behind us the whole way." },
        don("I know, and it made great television!"),
      ] },
      { id: 'vr.m11', when: MID, turns: [
        don("{team}, you're the {placing} team to arrive! Did you enjoy the leg?"),
        { by: 'a', say: "Some of it." },
        don("Which part?"),
        { by: 'b', say: "This part. The part where it's over." },
      ] },
      { id: 'vr.m12', when: MID, turns: [
        don("{team}, you're in {placing} place! Your families must be so proud."),
        { by: 'a', say: "I hope they're watching. I really hope they're watching." },
        don("Oh, they're watching, believe me. Everybody's watching!"),
      ] },
      { id: 'vr.m13', when: MID, turns: [
        don("{team}, you're the {placing} team to arrive! Drink some water and sit down before you fall down."),
        { by: 'b', say: "Is it that obvious?" },
        don("It's very obvious, so go on and sit!"),
      ] },
      { id: 'vr.m14', when: MID, turns: [
        don("{team}, you're in {placing} place, smack in the middle of the pack!"),
        { by: 'a', say: "We'll take the middle." },
        don("Everybody takes the middle, and the middle is where you're safe!"),
      ] },
      { id: 'vr.m15', when: MID, turns: [
        don("{team}, you're the {placing} team to arrive, which is not bad for a team that got lost!"),
        { by: 'a', say: "How do you know we got lost?" },
        don("Because everybody gets lost on this leg, so it was a safe bet."),
      ] },
      { id: 'vr.m16', when: MID, turns: [
        don("{team}, you're in {placing} place, and you made it!"),
        { by: 'b', say: "Some of us carried some of us." },
        { by: 'a', say: "And I said thank you. A lot." },
      ] },
      { id: 'vr.m17', when: MID, turns: [
        don("{team}, you're the {placing} team to arrive, and do you know what that means?"),
        { by: 'a', say: "We're safe?" },
        don("You're safe! Go on, go and celebrate!"),
      ] },
      { id: 'vr.m18', when: MID, turns: [
        don("{team}, you're in {placing} place, and I'd shake your hands, but you look like you've been rolling in dirt all day."),
        { by: 'b', say: "Honestly? We kind of have." },
        don("Then let's just wave instead!"),
      ] },
      { id: 'vr.m19', when: MID, turns: [
        don("{team}, you're {placing}! Right in the middle!"),
        { by: 'a', say: "Is that good?" },
        don("It's not last, and on this show, that's always good!"),
      ] },
      { id: 'vr.m20', when: MID, turns: [
        don("{team}, you're in {placing} place, and you've been steady all day."),
        { by: 'b', say: "Steady's our thing. We're not fast, but we're steady." },
        don("And steady is still in the race, so it's working!"),
      ] },
    ],
    'int-about-team.respect': [
      { id: 'vr.r1', when: { cause: 'small-talk' }, turns: [
        { by: 'a', conf: "I didn't expect to like {teamB}. You come in thinking everybody's the competition." },
        { by: 'b', conf: "And then they're just people." },
        { by: 'a', conf: "Really nice people. It makes it harder." },
      ] },
      { id: 'vr.r2', when: { cause: 'small-talk' }, turns: [
        { by: 'b', conf: "We talked to {teamB} for ten minutes, and I completely forgot we were racing." },
        { by: 'a', conf: "That's not good." },
        { by: 'b', conf: "I know. But I really liked talking to them." },
      ] },
      { id: 'vr.r3', when: { cause: 'share-info' }, turns: [
        { by: 'a', conf: "{teamB} didn't have to tell us that. They could have kept it to themselves." },
        { by: 'b', conf: "Most teams would have." },
        { by: 'a', conf: "So now we kind of owe them. I don't love owing people." },
      ] },
      { id: 'vr.r4', when: { cause: 'share-info' }, turns: [
        { by: 'b', conf: "Right now, {teamB} are the only team I actually trust." },
        { by: 'a', conf: "That's not saying a lot." },
        { by: 'b', conf: "It's saying a lot out here." },
      ] },
      { id: 'vr.r5', when: { cause: 'help-offer' }, turns: [
        { by: 'a', conf: "{teamB} stopped to help us. In a race. Who does that?" },
        { by: 'b', conf: "Nice people." },
        { by: 'a', conf: "Nice people don't usually win these things, though." },
        { by: 'b', conf: "Then I hope they get really far. They deserve it." },
      ] },
      { id: 'vr.r6', when: { cause: 'help-offer' }, turns: [
        { by: 'b', conf: "If we can't win this, I honestly hope {teamB} do." },
        { by: 'a', conf: "Don't say that on camera." },
        { by: 'b', conf: "I just did. And I meant it." },
      ] },
    ],
    'int-about-team.grudge': [
      { id: 'vr.g1', when: { cause: 'gloat' }, turns: [
        { by: 'a', conf: "{teamB} waved their tip in our faces. They actually waved it at us." },
        { by: 'b', conf: "It was so rude." },
        { by: 'a', conf: "I'm not going to forget that. Ever." },
      ] },
      { id: 'vr.g2', when: { cause: 'gloat' }, turns: [
        { by: 'b', conf: "I get gloating. Everybody gloats. But you do it after the mat, not halfway through." },
        { by: 'a', conf: "{teamB} don't care about that." },
        { by: 'b', conf: "Well, they should. It's going to come back on them." },
      ] },
      { id: 'vr.g3', when: { cause: 'trash-talk' }, turns: [
        { by: 'a', conf: "{teamB} think they can talk to people like that. They can't." },
        { by: 'b', conf: "They just did, though." },
        { by: 'a', conf: "Then they're about to find out what happens when they do." },
      ] },
      { id: 'vr.g4', when: { cause: 'trash-talk' }, turns: [
        { by: 'b', conf: "I wasn't going to say anything back. And then I did. A lot." },
        { by: 'a', conf: "You were great." },
        { by: 'b', conf: "I was a bit much. But honestly, they deserved it." },
      ] },
    ],
    'bond-moment.memory': [
      { id: 'vr.bm1', turns: [
        { by: 'a', say: "This line reminds me of the time we waited all night for concert tickets." },
        { by: 'b', say: "Oh my God. Eleven hours on the pavement." },
        { by: 'a', say: "And they sold out two people in front of us." },
        { by: 'b', say: "So we went home and played the album really loud instead." },
        { beat: 'They both start humming the same song.' },
        { by: 'a', say: "Still one of the best nights ever." },
      ] },
      { id: 'vr.bm2', turns: [
        { by: 'b', say: "You know what I was just thinking about?" },
        { by: 'a', say: "Food?" },
        { by: 'b', say: "No. The time you tried to teach me to drive." },
        { by: 'a', say: "You were fine." },
        { by: 'b', say: "I backed into a bin. You screamed so loud the neighbours came out." },
        { by: 'a', say: "Okay, I did scream. You were not fine." },
      ] },
      { id: 'vr.bm3', turns: [
        { by: 'a', say: "Remember the first trip we ever took together? The camping one?" },
        { by: 'b', say: "It rained for four days straight." },
        { by: 'a', say: "We played cards in the tent the whole time." },
        { by: 'b', say: "You cheated at every single game." },
        { by: 'a', say: "And you let me win anyway." },
        { beat: 'For a moment, the race feels very far away.' },
      ] },
      { id: 'vr.bm4', turns: [
        { by: 'b', say: "This is the furthest I've ever been from home." },
        { by: 'a', say: "Seriously?" },
        { by: 'b', say: "Seriously. Before this, I'd never even been on a plane." },
        { by: 'a', say: "And look at you now." },
        { by: 'b', say: "I know. I keep thinking about how proud my family would be." },
        { by: 'a', say: "They are proud. I promise." },
      ] },
      { id: 'vr.bm5', turns: [
        { by: 'a', say: "When this is over, I'm telling everybody about today." },
        { by: 'b', say: "Which part?" },
        { by: 'a', say: "The part where you laughed so hard you had to sit down on the pavement." },
        { by: 'b', say: "That was the best part." },
        { by: 'a', say: "It really was." },
        { beat: 'They walk on, a little closer than before.' },
      ] },
    ],
    'crush-noticed.radar': [
      { id: 'vr.cr1', turns: [
        { by: 'c', say: "Did you just fix your hair? We're in the middle of a race." },
        { by: 'a', say: "It was in my eyes." },
        { by: 'c', say: "It's been in your eyes all day. And then {b} walks past, and suddenly you fix it." },
        { by: 'a', say: "That's a coincidence." },
        { beat: '{b} walks past again. {a} fixes it again.' },
        { by: 'c', say: "Sure. A coincidence." },
      ] },
      { id: 'vr.cr2', turns: [
        { beat: '{a} offers to carry {b}\'s bag for a bit, even though {a.posAdj} own team is going the other way.' },
        { by: 'c', say: "Um, we're going this way." },
        { by: 'a', say: "I was just being helpful." },
        { by: 'c', say: "To somebody on another team. In the middle of a race." },
        { by: 'a', say: "It was a heavy bag!" },
        { by: 'c', say: "Uh-huh. Come on." },
      ] },
      { id: 'vr.cr3', turns: [
        { by: 'c', say: "You laugh at everything {b} says." },
        { by: 'a', say: "{b.Sub}'s funny." },
        { by: 'c', say: "Nobody is that funny." },
        { by: 'a', say: "{b.Sub} is kind of that funny." },
        { by: 'c', say: "Uh-huh." },
        { by: 'a', say: "Shh. Don't." },
      ] },
      { id: 'vr.cr4', turns: [
        { beat: '{a} is watching {b} across the way and doesn\'t notice {a.posAdj} partner waving a hand in front of {a.posAdj} face.' },
        { by: 'c', say: "Hello? Are you listening to me?" },
        { by: 'a', say: "What? Sorry. What?" },
        { by: 'c', say: "I said the tip says left. Three times." },
        { by: 'a', say: "Left. Yes. Okay. Left." },
        { by: 'c', say: "Oh my God. You have it so bad." },
      ] },
      { id: 'vr.cr5', turns: [
        { by: 'c', say: "If you like {b}, just say so." },
        { by: 'a', say: "I don't like {b}." },
        { by: 'c', say: "You've said {b.posAdj} name four times in the last ten minutes." },
        { by: 'a', say: "Have I?" },
        { by: 'c', say: "Yes. You have." },
        { by: 'a', say: "Okay, keep your voice down!" },
      ] },
    ],
    'watching-together.heckle': [
      { id: 'vr.wh1', turns: [
        { by: 'a', say: "Come on! Faster! You can go faster than that!" },
        { by: 'c', say: "That's kind of mean." },
        { by: 'a', say: "I'm motivating them." },
        { by: 'd', say: "You're yelling at them." },
        { beat: 'The racer out there speeds up. Nobody\'s sure if it was the yelling.' },
        { by: 'b', say: "See? It worked." },
      ] },
      { id: 'vr.wh2', turns: [
        { by: 'b', say: "Why are they doing it like that? That's not how you do it." },
        { by: 'd', say: "Nobody showed them. That's the problem." },
        { by: 'a', say: "Should we tell them?" },
        { by: 'c', say: "Absolutely not." },
        { by: 'b', say: "We're not helping. We're just watching." },
        { beat: 'The racer out there gets it wrong again, and everybody watching winces.' },
      ] },
      { id: 'vr.wh3', turns: [
        { by: 'a', say: "Oh, no. Oh, no, not like that." },
        { by: 'c', say: "Can you stop commentating?" },
        { by: 'a', say: "I can't help it." },
        { by: 'd', say: "Seriously, they can hear you." },
        { by: 'a', say: "Okay. Okay. I'll stop." },
        { beat: '{a} stops, for about ten seconds.' },
      ] },
      { id: 'vr.wh4', turns: [
        { by: 'd', say: "Do you think they can hear us?" },
        { by: 'b', say: "No way. They're too far away." },
        { by: 'a', say: "You're doing great! Keep going!" },
        { beat: 'The racer out there gives them a thumbs up.' },
        { by: 'c', say: "They can definitely hear us." },
        { by: 'b', say: "Okay. Then just say nice things." },
      ] },
    ],
    'spy.caught-spying': [
      { id: 'vr.sx1', turns: [
        { beat: '{a} and {b} are pretending to read a map right behind {c} and {d}.' },
        { by: 'd', say: "Can we help you?" },
        { by: 'a', say: "No. We're just reading our map." },
        { by: 'c', say: "You're spying on us." },
        { by: 'b', say: "We're not spying. We're standing here." },
        { by: 'd', say: "Then go and stand somewhere else." },
      ] },
      { id: 'vr.sx2', turns: [
        { by: 'c', say: "Why are you copying everything we do?" },
        { by: 'a', say: "We're not copying you." },
        { by: 'd', say: "You started on the left as soon as we started on the left." },
        { by: 'b', say: "That's a coincidence." },
        { by: 'c', say: "At exactly the same time?" },
        { by: 'a', say: "...Okay. Maybe a little bit." },
      ] },
      { id: 'vr.sx3', turns: [
        { beat: '{d} turns round suddenly. {a} and {b} both look away fast.' },
        { by: 'd', say: "What are you looking at?" },
        { by: 'a', say: "Nothing. Nothing." },
        { by: 'c', say: "You've been watching us for five minutes." },
        { by: 'b', say: "We were just waiting our turn." },
        { by: 'd', say: "Then wait over there." },
      ] },
    ],
    'trash-talk.escalates': [
      { id: 'vr.te1', turns: [
        { by: 'a', say: "Oh, look who finally showed up." },
        { by: 'c', say: "We've been right behind you." },
        { by: 'b', say: "Doing what? Losing?" },
        { by: 'd', say: "Better than whatever you two are doing." },
        { by: 'a', say: "We're winning. That's what we're doing." },
        { by: 'c', say: "Say that again at the mat." },
        { beat: 'Both teams turn their backs and walk off in opposite directions, still muttering.' },
      ] },
      { id: 'vr.te2', turns: [
        { by: 'c', say: "You pushed in." },
        { by: 'a', say: "There wasn't a line." },
        { by: 'd', say: "There was a line! We were the line!" },
        { by: 'b', say: "Then you should've been standing closer." },
        { by: 'c', say: "Are you serious right now?" },
        { by: 'a', say: "Bye!" },
      ] },
    ],
  },
};

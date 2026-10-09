// ══════════════════════════════════════════════════════════════════════
// td/story/lines/n-romance.js — romance, as whole scenes
// ══════════════════════════════════════════════════════════════════════
//
// Long versions of the engine's romance moments (td/script/lines/romance.js, romance2.js
// headers). Every pair passed romanticCompat before the engine fired the moment.
//   romance.flirt  a and b flirt, not a couple yet     romance.spark  a and b are a thing now
//   romance.moment.<couple|crush>  a's moment with b   romance.honeymoon  the glow (c watching)
//   romance.night.<kiss|never>  after-dark games      romance.jealous  a used to be b's person; now c is
//   romance.fade.<amicable|soured>  it ends            romance.rideordie  to the end together
//   romance.noticed  a watches couple b and c, counting votes
//   romance.target  a decides couple b and c must be split
//   romance.tri.tension  a watches b drift toward c    romance.tri.confront  a confronts b about c
//   romance.affair.form  a (with {target}) and b start something secret
//   cross.flirt  a (team {mine}) and b (team {theirs}) flirt across the line
// Ids: 'ns.'.

export default {
  'long.romance.flirt.any': [
    { id: 'ns.f1', place: 'water', turns: [
      { beat: "{a} and {b} are supposed to be getting water {here}. They've been gone a while." },
      { by: 'b', say: "You're splashing me on purpose.", v: { dry: "Is the splashing a strategy, or are you just bad at walking?", loud: "Hey! You're doing that on purpose!", teen: "Oh my god, stop splashing me. You're so annoying." } },
      { by: 'a', say: "That's a big accusation." },
      { by: 'b', say: "You've done it four times." },
      { by: 'a', say: "Five. You missed one." },
      { by: 'b', say: "You're so annoying." },
      { by: 'a', say: "You're smiling, though.", v: { flirty: "You keep saying that. You keep standing next to me, though.", anxious: "Is that a good annoying? Please say it's a good annoying." } },
      { by: 'b', say: "...Shut up." },
      { by: 'b', conf: "I am not here to fall for somebody. I'm here to win. I need {a} to stop being cute for like one day.", v: { anxious: "I know... I promised myself I wouldn't fall for anyone here, but I really like {a}. Oh, this is very bad.", competitive: "I keep telling myself to focus and win and not look at {a}, and then I look at {a}.", grown: "I'm too old to get a crush on a game show. And yet." } },
      { by: 'a', conf: "{b} laughed at all my jokes today, even the bad ones, especially the bad ones.", v: { flirty: "{b} laughed at every joke I made. I've still got it.", nerdy: "{b} laughed at my pun about mitochondria. Nobody laughs at that one." } },
    ] },
    { id: 'ns.f2', place: 'fire', turns: [
      { beat: "Everyone else has gone to bed. {a} and {b} are still at the fire {here}." },
      { by: 'a', say: "You're shivering.", v: { warm: "Hey, you're freezing. Come here.", flirty: "You're cold. I could help with that.", quiet: "...Cold?" } },
      { by: 'b', say: "I'm fine." },
      { by: 'a', say: "Here. Take my jacket." },
      { by: 'b', say: "Then you'll be cold." },
      { by: 'a', say: "I'll sit closer to the fire. And to you, if that's okay." },
      { by: 'b', say: "...It's okay." },
      { beat: "They sit there for a long time without saying much." },
      { by: 'b', conf: "Nothing happened, we just sat there, and it was the best night I've had since I got here.", v: { dry: "We sat by a fire and didn't talk. Most romantic thing that's ever happened to me.", emotional: "I think I'm falling for {a} over one night by a fire, and I'm in so much trouble." } },
    ] },
    { id: 'ns.f3', place: 'work', when: { voice: ['flirty', 'theatrical', 'proud', 'loud'] }, turns: [
      { beat: "{b} is trying to chop wood {here}. {a} leans against a tree and watches." },
      { by: 'b', say: "Are you going to help or just stand there?" },
      { by: 'a', say: "I'm helping. I'm supervising." },
      { by: 'b', say: "You're staring." },
      { by: 'a', say: "Can you blame me?" },
      { by: 'b', say: "Oh my gosh. Pick up an axe." },
      { by: 'a', say: "Only if you show me how. Up close." },
      { by: 'b', conf: "{a} is being so obvious, and it's working, and I hate that it's working." },
    ] },
    { id: 'ns.f4', place: 'aside', when: { voice: ['anxious', 'nerdy', 'earnest', 'ditzy'] }, turns: [
      { by: 'a', say: "Hi, um, I saved you some of the good berries. You know, the ones that aren't sour." },
      { by: 'b', say: "Aw. You didn't have to do that." },
      { by: 'a', say: "I wanted to. I mean, I just had extra. I mean, I didn't have extra, I picked them for you. Is that weird?" },
      { by: 'b', say: "It's a little weird. It's also really sweet." },
      { by: 'a', say: "Okay, good, sweet is good. I'm going to go now before I say something else." },
      { by: 'b', say: "You can stay." },
      { by: 'a', say: "...Oh. Okay, I'll stay." },
      { by: 'a', conf: "I've never been good at talking to people I like, but today I was okay, like medium, and medium is a big step for me." },
    ] },
    { id: 'ns.f5', place: 'public', when: { merged: true }, turns: [
      { by: 'b', say: "We were on different teams for so long. I never really talked to you.", v: { flirty: "Weird that we never talked before. Your loss, mostly.", anxious: "I never talked to you before. I was kind of scared of you, honestly." } },
      { by: 'a', say: "You were busy trying to beat me." },
      { by: 'b', say: "And you were busy being annoyingly good at challenges." },
      { by: 'a', say: "Was that a compliment?" },
      { by: 'b', say: "Don't let it go to your head." },
      { by: 'a', say: "Too late." },
      { by: 'b', conf: "I spent weeks thinking {a} was my enemy. Turns out {a} is just really, really fun to talk to. That's a problem.", v: { schemer: "{a} is charming, and that's either a threat or an opportunity, maybe both." } },
    ] },
  ],
  'long.romance.spark.any': [
    { id: 'ns.s1', place: 'secret', turns: [
      { beat: "{a} and {b} have snuck away to {place}." },
      { by: 'b', say: "Everyone's going to wonder where we are.", v: { anxious: "Everyone's going to notice we're gone, right? They'll totally notice.", flirty: "Let them wonder." } },
      { by: 'a', say: "Let them wonder." },
      { by: 'b', say: "So what is this? You and me?" },
      { by: 'a', say: "I don't know. I just know I want to be wherever you are." },
      { by: 'b', say: "That's a lot." },
      { by: 'a', say: "Too much?" },
      { by: 'b', say: "No. Not too much." },
      { beat: "{b} kisses {a}." },
      { by: 'a', conf: "I didn't come here to fall for anybody. That plan lasted about a week.", v: { dry: "My plan was no romance. My plan lasted six days.", teen: "I literally said I wasn't going to have a showmance. Whoops." } },
      { by: 'b', conf: "Everybody's going to say a showmance is a target, and they're right, but I don't care right now." },
    ] },
    { id: 'ns.s2', place: 'sleep', turns: [
      { beat: "The {quarters} at night. {a} and {b} are the only ones still awake, whispering." },
      { by: 'a', say: "Can I ask you something?", v: { anxious: "Can I ask you something? It's kind of scary.", flirty: "Can I ask you something? Don't laugh." } },
      { by: 'b', say: "You're going to anyway." },
      { by: 'a', say: "Is this a thing, you and me? Because I want it to be a thing." },
      { by: 'b', say: "It's been a thing since the dock." },
      { by: 'a', say: "Then why didn't you say?" },
      { by: 'b', say: "I wanted you to say it first." },
      { by: 'a', conf: "I'm smiling so much my face hurts. It's not official official, but it's official to me.", v: {"tough":"Okay, fine, it's a thing. Don't make it weird.","anxious":"I'm so happy and so scared. Is this a bad idea? It's probably a bad idea. I don't care."} },
    ] },
    { id: 'ns.s3', place: 'water', when: { merged: true }, turns: [
      { beat: "{a} and {b} are sitting {here}, shoulders touching." },
      { by: 'b', say: "People are going to target us. You know that.", v: { schemer: "We're a target now. A big one.", anxious: "Everyone's going to come for us. I'm scared." } },
      { by: 'a', say: "I know." },
      { by: 'b', say: "So should we stop?" },
      { by: 'a', say: "Do you want to?" },
      { by: 'b', say: "No." },
      { by: 'a', say: "Then we don't stop. We just get really good at this game." },
      { by: 'b', conf: "Being in a couple at the merge is stupid. Every strategy book would say so. I'm doing it anyway." },
    ] },
  ],
  'long.romance.moment.couple': [
    { id: 'ns.mc1', place: 'water', turns: [
      { beat: "Early. {a} and {b} have been sitting {here} since before anyone woke up." },
      { by: 'b', say: "We should go back. They'll say we're plotting.", v: { dry: "We should go back. Our absence is becoming a scandal.", anxious: "We should go back, right? People are definitely talking." } },
      { by: 'a', say: "We are plotting. We're plotting how long we can stay here." },
      { by: 'b', say: "That's not plotting, that's skipping chores." },
      { by: 'a', say: "Same thing." },
      { beat: "{a} kisses {b}'s cheek." },
      { by: 'b', say: "Okay. Five more minutes." },
      { by: 'b', conf: "Being with {a} is the only part of this place that doesn't feel like a fight.", v: { tough: "Everything here's a fight. Except {a}.", grown: "I've been around long enough to know this is rare. I'm keeping it." } },
    ] },
    { id: 'ns.mc2', place: 'eat', when: { third: true }, turns: [
      { beat: "{a} gives {b} the last of the food {here}. {c} watches." },
      { by: 'c', say: "Oh, come ON. That was mine.", v: { loud: "HEY! That was MINE!", dry: "Oh, of course. Love is when you give away my breakfast." } },
      { by: 'a', say: "Was it?" },
      { by: 'c', say: "I've been waiting for twenty minutes!" },
      { by: 'b', say: "I'll share." },
      { by: 'c', say: "You two are disgusting, and I mean that in the nicest way. Mostly." },
      { by: 'c', conf: "I'm happy for them. I'd be happier if they weren't so happy in front of my breakfast." },
    ] },
    { id: 'ns.mc3', place: 'aside', when: { lost: true }, turns: [
      { by: 'b', say: "Today was bad.", v: { blunt: "Today was terrible.", emotional: "Today was so bad. I'm scared for us." } },
      { by: 'a', say: "Today was really bad." },
      { by: 'b', say: "If it's one of us tonight..." },
      { by: 'a', say: "It's not going to be one of us." },
      { by: 'b', say: "You don't know that." },
      { by: 'a', say: "Then we work for it together, starting right now." },
      { by: 'a', conf: "Being in a showmance means when one of us is in danger, both of us are. I knew that. I didn't know it'd feel this bad." },
    ] },
  ],
  'long.romance.moment.crush': [
    { id: 'ns.mr1', place: 'aside', turns: [
      { beat: "{a} has been sneaking looks at {b} all morning. {b} finally notices." },
      { by: 'b', say: "Do I have something on my face?", v: { dry: "Is there something on my face, or am I just that interesting?", anxious: "Is something on my face? Oh no, is it bad?" } },
      { by: 'a', say: "What? No! No, your face is fine, your face is great, I mean..." },
      { by: 'b', say: "My face is great?" },
      { by: 'a', say: "I'm going to go stand in the lake now." },
      { by: 'a', conf: "I've liked {b} for days, and I think everybody knows except {b}, and now maybe {b} knows too.", v: { teen: "I've had a crush on {b} since basically day one. I'm so obvious." } },
    ] },
    { id: 'ns.mr2', place: 'work', turns: [
      { beat: "{a} has volunteered for every chore {b} has done today." },
      { by: 'b', say: "You know you don't have to help with everything.", v: { dry: "You realise you're helping with literally everything I do?", warm: "You're so sweet, but you don't have to help with everything." } },
      { by: 'a', say: "I like helping." },
      { by: 'b', say: "You hate helping. You said so on the first day." },
      { by: 'a', say: "...People change." },
      { by: 'b', say: "In three days?" },
      { by: 'a', conf: "Okay, fine, I don't like chores, I like doing chores next to {b}, and that's different." },
    ] },
  ],
  'long.romance.honeymoon.any': [
    { id: 'ns.h1', place: 'public', when: { third: true }, turns: [
      { beat: "{a} and {b} are sitting together {here}, laughing at something only they get." },
      { by: 'c', say: "You know everyone can see you, right?", v: { loud: "Uh, hello! We can all see you!", cruel: "Get a room. Actually, don't, we all share it." } },
      { by: 'a', say: "So?" },
      { by: 'c', say: "So it's like watching a commercial. For being in love." },
      { by: 'b', say: "You're just jealous." },
      { by: 'c', say: "I'm just eating." },
      { by: 'c', conf: "They're cute. They're also the easiest vote at the merge. I'm not going to be the one to tell them.", v: { warm: "They're so cute together. I hope nobody splits them up.", competitive: "A couple is two votes. That's all I see." } },
    ] },
    { id: 'ns.h2', place: 'aside', turns: [
      { by: 'a', say: "Can I tell you something embarrassing?", v: { anxious: "Okay, can I tell you something embarrassing? Just don't laugh.", dry: "I'm about to say something deeply uncool." } },
      { by: 'b', say: "Always." },
      { by: 'a', say: "This is the best part of my day, every day, just this." },
      { by: 'b', say: "Sitting on a log?" },
      { by: 'a', say: "Sitting on a log with you." },
      { by: 'b', say: "That's so cheesy." },
      { by: 'a', say: "You love it." },
      { by: 'b', say: "I love it." },
      { by: 'b', conf: "Out of everything that's happened here, {a} is what I'm going to remember." },
    ] },
  ],
  'long.romance.night.kiss': [
    { id: 'ns.k1', place: 'fire', turns: [
      { beat: "Late, {here}. Someone found an empty bottle. It spins, and stops on {a}. Then again, on {b}." },
      { by: 'b', say: "No. No way.", v: { loud: "NO. No way!", flirty: "Well, the bottle has spoken.", anxious: "Oh no. Oh no, no, no." } },
      { by: 'a', say: "Rules are rules." },
      { by: 'b', say: "There are no rules! We made this up ten minutes ago!" },
      { by: 'a', say: "Then I'm making a new rule." },
      { beat: "{a} leans over and kisses {b}. Everyone at the fire screams." },
      { by: 'b', say: "...Okay. Spin it again." },
      { by: 'b', conf: "It was a game. It was just a game. I'm going to be thinking about it all night.", v: { dry: "It was a game, and I'm totally fine. ...I'm not fine.", teen: "I literally can't stop thinking about it. It was just a game!" } },
    ] },
  ],
  'long.romance.night.never': [
    { id: 'ns.n1', place: 'fire', turns: [
      { beat: "Never have I ever, {here}. It's {a}'s turn." },
      { by: 'a', say: "Never have I ever... had a crush on someone in this camp." },
      { beat: "Nobody moves. Then {b} slowly puts a finger down." },
      { by: 'b', say: "Shut up. Everybody shut up." },
      { by: 'a', say: "Who is it?" },
      { by: 'b', say: "It's not a question game, it's never-have-I-ever. Next!" },
      { by: 'a', conf: "{b} looked right at me when {b} put that finger down, I'm almost sure, like ninety percent sure.", v: { nerdy: "I'm ninety percent sure {b} looked at me. Okay, eighty-five, but it's a strong eighty-five." } },
    ] },
  ],
  'long.romance.jealous.any': [
    { id: 'ns.j1', place: 'aside', when: { third: true }, turns: [
      { beat: "{b} and {c} are laughing together {here}. {a} watches from across camp." },
      { by: 'a', say: "You two look like you're having fun.", v: { dry: "Oh, don't let me interrupt. You two look very busy.", cruel: "Cute. Really cute." } },
      { by: 'b', say: "We are. Want to join?" },
      { by: 'a', say: "No, I'm good, I'm great, have fun." },
      { beat: "{a} walks off. {c} looks at {b}." },
      { by: 'c', say: "What was that?" },
      { by: 'b', say: "I have no idea." },
      { by: 'a', conf: "{b} used to sit with me every meal, every night, and now it's {c}. Fine. Totally fine.", v: { loud: "I'm not jealous, I'm just mad, and that's different!", cruel: "{c} can have {b}. {b} is going to find out what {c} is really like soon enough." } },
    ] },
    { id: 'ns.j2', place: 'public', when: { third: true, voice: ['loud', 'tough', 'blunt', 'chaotic'] }, turns: [
      { by: 'a', say: "Hey, {c}. That's my spot." },
      { by: 'c', say: "It's a log." },
      { by: 'a', say: "It's my spot on the log. Next to {b}." },
      { by: 'b', say: "{a}, come on. There's room." },
      { by: 'a', say: "There used to be room. Now there's {c}." },
      { by: 'c', conf: "I didn't know I'd stolen anything. Apparently I stole a whole person." },
    ] },
  ],
  'long.romance.fade.any': [
    { id: 'ns.d1', place: 'aside', turns: [
      { by: 'a', say: "Can we talk?", v: { quiet: "...We need to talk.", anxious: "Can we talk? I've been dreading this all day." } },
      { by: 'b', say: "That's never good." },
      { by: 'a', say: "I don't think this is working. Us." },
      { by: 'b', say: "...Yeah. I've been feeling it too." },
      { by: 'a', say: "I still like you. I just need to think about the game." },
      { by: 'b', say: "It's okay. Friends?" },
      { by: 'a', say: "Friends." },
      { by: 'b', conf: "It's over. It didn't explode or anything, it just kind of ran out, and I don't know if that's better or worse.", v: { emotional: "It's over. I'm going to cry a lot tonight.", calm: "It ended without a fight, it's just done, and that's okay." } },
    ] },
  ],
  'long.romance.fade.soured': [
    { id: 'ns.d2', place: 'public', turns: [
      { beat: "{a} and {b} walk past each other {here} without saying a word." },
      { by: 'c', say: "Are you two okay?", v: { warm: "Hey, are you two okay? Something feels off.", dry: "So, are we not doing the couple thing anymore?" } },
      { by: 'a', say: "Ask {b}." },
      { by: 'b', say: "There's nothing to ask. We're done." },
      { by: 'c', say: "Since when?" },
      { by: 'b', say: "Since about an hour ago." },
      { by: 'a', conf: "I thought {b} actually cared about me, but {b} just cared about having a vote, so, lesson learned.", v: { emotional: "I really thought it was real, and it wasn't, and that hurts so much.", cruel: "{b} used me, fine, so now I'll use my vote." } },
      { by: 'b', conf: "{a} wants me to feel bad, and I don't. Okay, I do, a little." },
    ] },
  ],
  'long.romance.rideordie.any': [
    { id: 'ns.r1', place: 'secret', turns: [
      { beat: "{a} and {b} are lying on the ground {here}, looking up." },
      { by: 'b', say: "If it comes down to me or you, what do you do?", v: { anxious: "If it ever comes down to you or me... what happens?", blunt: "You or me. What do you do?" } },
      { by: 'a', say: "It's not going to come down to me or you." },
      { by: 'b', say: "But if it does." },
      { by: 'a', say: "Then I make sure it's both of us, final two, and I don't care who else is left." },
      { by: 'b', say: "Promise?" },
      { by: 'a', say: "Promise." },
      { by: 'a', conf: "Everybody thinks the showmance is the weakness. We're going to show them it's the strongest alliance in the game." },
    ] },
  ],
  'long.romance.noticed.any': [
    { id: 'ns.o1', place: 'aside', turns: [
      { beat: "{a} watches {b} and {c} share a plate {here}." },
      { by: 'a', conf: "{b} and {c} are two votes that will never, ever split, and that's not cute, that's a problem." },
      { by: 'a', conf: "If I'm not in with one of them, I'm against both of them. I need to pick soon." },
    ] },
    { id: 'ns.o2', place: 'aside', when: { voice: ['schemer', 'calm', 'dry', 'competitive'] }, turns: [
      { by: 'a', conf: "Look at them. {b} and {c} haven't been more than three feet apart all day." },
      { by: 'a', conf: "Everyone thinks it's sweet, but I'm counting, and that's two votes right there, holding hands." },
    ] },
  ],
  'long.romance.target.any': [
    { id: 'ns.t1', place: 'aside', turns: [
      { beat: "{a} watches {b} and {c} {here}, whispering to each other again." },
      { by: 'a', conf: "{b} and {c} are a couple. A couple is two votes that go together every time." },
      { by: 'a', conf: "If we don't split them now, they walk to the end holding hands. So one of them goes. Soon." },
    ] },
    { id: 'ns.t2', place: 'aside', when: { voice: ['loud', 'tough', 'blunt'] }, turns: [
      { by: 'a', conf: "I'm sick of {b} and {c}. They act like the rest of us don't matter. Like we're the background to their love story." },
      { by: 'a', conf: "One of them is going home, and I don't even care which one, just one of them." },
    ] },
  ],
  'long.romance.tri.tension': [
    { id: 'ns.x1', place: 'aside', when: { third: true }, turns: [
      { beat: "{b} and {c} are talking {here}. Close. {a} watches." },
      { by: 'a', say: "{b}. Got a second?" },
      { by: 'b', say: "Sure. What's up?" },
      { by: 'a', say: "You and {c} have been talking a lot." },
      { by: 'b', say: "We're friends." },
      { by: 'a', say: "We were friends too. Before." },
      { by: 'b', say: "It's not like that." },
      { by: 'a', conf: "{b} says it's not like that. That's exactly what people say when it's like that." },
    ] },
  ],
  'long.romance.tri.confront': [
    { id: 'ns.x2', place: 'secret', when: { third: true }, turns: [
      { by: 'a', say: "I need you to be honest with me. Is something going on with you and {c}?" },
      { by: 'b', say: "Why are you asking me this?" },
      { by: 'a', say: "Because everyone's seen it. Everyone's seen how you look at {c}." },
      { by: 'b', say: "I don't know... maybe. I don't know." },
      { by: 'a', say: "That's a yes." },
      { by: 'b', say: "It's an I don't know!" },
      { by: 'a', say: "Then figure it out. Because I'm not waiting around while you decide." },
      { by: 'b', conf: "I like {a}. I like {c}. This is the worst thing that could have happened to me in this game." },
    ] },
  ],
  'long.romance.affair.form': [
    { id: 'ns.a1', place: 'secret', turns: [
      { beat: "{a} and {b} are alone at {place}. They shouldn't be." },
      { by: 'b', say: "What about {target}?" },
      { by: 'a', say: "I don't want to talk about {target} right now." },
      { by: 'b', say: "You have to, though. Eventually." },
      { by: 'a', say: "Eventually. Not now." },
      { beat: "{a} kisses {b}. {b} doesn't pull away." },
      { by: 'b', conf: "This is the worst idea I've ever had. And I've had a lot of bad ideas here." },
      { by: 'a', conf: "{target} can never find out, ever, and that's honestly all I've got for a plan." },
    ] },
  ],
  'long.cross.flirt.any': [
    { id: 'ns.cf1', place: 'public', turns: [
      { beat: "The {mine} and the {theirs} pass each other {here}. {a} slows down. So does {b}." },
      { by: 'b', say: "Shouldn't you be with your team?" },
      { by: 'a', say: "Shouldn't you?" },
      { by: 'b', say: "I'm being a spy." },
      { by: 'a', say: "You're a terrible spy. You're smiling." },
      { by: 'b', say: "So are you." },
      { by: 'b', conf: "The {mine} are the enemy and {a} is on the {mine}, and my brain knows that, but the rest of me hasn't caught up." },
    ] },
  ],
};

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
      { by: 'a', conf: "{b} laughed at all my jokes today, even the bad ones, especially the bad ones.", v: { flirty: "{b} laughed at every joke I made. I have still got it.", nerdy: "{b} laughed at my pun about mitochondria. Nobody laughs at that one." } },
    ] },
    { id: 'ns.f2', place: 'fire', turns: [
      { beat: "Everyone else has gone to bed. {a} and {b} are still up {here}." },
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
    { id: "nrs.f5", place: "public", when: {"merged":true}, turns: [
      {"by":"b","say":"It feels strange sitting here talking instead of worrying about the game."},
      {"by":"a","say":"We can worry about it if you prefer. I can look suspicious and lower my voice."},
      {"by":"b","say":"Please do not. I'm trying to enjoy the company."},
      {"by":"a","say":"Was that a compliment?"},
      {"by":"b","say":"Don't make me regret it before I finish."},
      {"by":"a","say":"Too late. I'm enjoying it."},
      {"by":"b","conf":"I wanted a normal conversation. Then {a} made me laugh, and I started caring much more about whether I sounded normal."}
    ] },
  ],
  'long.romance.spark.any': [
    { id: "nrs.s1", place: "secret", turns: [
      {"beat":"{a} and {b} step aside to talk {here}."},
      {"by":"b","say":"Everyone is going to wonder where we are."},
      {"by":"a","say":"We can go back. I just wanted to ask you something without an audience."},
      {"by":"b","say":"You can ask."},
      {"by":"a","say":"Do you want this to be a relationship? Because I do."},
      {"by":"b","say":"Yes. I wanted to hear you say it, though."},
      {"by":"a","say":"Was I that hard to read?"},
      {"by":"b","say":"No. I just wanted to hear it out loud."},
      {"beat":"{b} takes {a.posAdj} hand and kisses {a.obj}."},
      {"by":"a","conf":"I spent all day trying to think of something smooth to say. In the end I just asked. Turns out that works."},
      {"by":"b","conf":"There's going to be plenty of time for everyone else to have an opinion. For this minute, I just want to be happy with {a}."}
    ] },
    { id: "nrs.s2", place: "sleep", turns: [
      {"beat":"{a} and {b} speak quietly {here}."},
      {"by":"a","say":"Can I ask you something without you laughing?"},
      {"by":"b","say":"I can try. You look very serious."},
      {"by":"a","say":"Is this a thing, you and me? I want it to be."},
      {"by":"b","say":"Yes. I wanted to know whether you'd actually ask."},
      {"by":"a","say":"I could have spent a very long time working up to that."},
      {"by":"b","say":"I'm glad you did not. I'd rather spend the time with you."},
      {"by":"a","conf":"I got an actual yes. I'm trying to look composed about it. I don't think anyone is going to believe the composed part."}
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
    { id: "nrs.mr1", place: "aside", turns: [
      {"by":"b","say":"Were you going to say something, or are you just watching me think?"},
      {"by":"a","say":"I was going to ask if you wanted company."},
      {"by":"b","say":"You can ask that while standing a little closer."},
      {"by":"a","say":"Right. I was trying to make this less awkward."},
      {"by":"b","say":"How is that going?"},
      {"by":"a","say":"Terribly. Would you like company anyway?"},
      {"by":"b","say":"Yes. Come here before you talk yourself out of it."},
      {"by":"a","conf":"I wanted to look casual. I looked like I needed directions to a conversation. {b} still said yes, so I'm calling it a success."}
    ] },
    { id: "nrs.mr2", place: "work", turns: [
      {"beat":"{a} joins {b} for a chore {here}."},
      {"by":"b","say":"You don't have to help. I can manage this."},
      {"by":"a","say":"I know. I wanted to spend time with you."},
      {"by":"b","say":"That was surprisingly direct."},
      {"by":"a","say":"I can make up a complicated excuse if you'd prefer."},
      {"by":"b","say":"No. Stay. I liked the first answer."},
      {"by":"a","conf":"I nearly pretended I was just being helpful. Then I told the truth, and {b} asked me to stay. I'm going to think about that for a completely unreasonable amount of time."}
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
    { id: "nrs.k1", place: "fire", turns: [
      {"beat":"The bottle stops on {a}, then {b}. The group waits for a reaction."},
      {"by":"b","say":"Of course. The bottle has excellent comic timing."},
      {"by":"a","say":"Do you want to, or should we spin it again?"},
      {"by":"b","say":"I want to. I just needed a second to look cool about it."},
      {"by":"a","say":"Take your second. I need one too."},
      {"beat":"They lean toward each other and kiss. Cheers break the silence around them."},
      {"by":"b","say":"Okay. I'm definitely not looking cool now."},
      {"by":"b","conf":"{a} gave me a way to say no without making it embarrassing. That made saying yes feel very different. Now I have to stop smiling long enough to rejoin the game."}
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
    { id: "nrs.d2", place: "public", turns: [
      {"beat":"{a} and {b} keep their distance {here}. {c} notices."},
      {"by":"c","say":"Are you two okay?"},
      {"by":"a","say":"We're not together anymore."},
      {"by":"b","say":"I was going to tell people when I was ready."},
      {"by":"c","say":"You don't owe me the details."},
      {"by":"a","say":"Good, because I don't want to explain this in front of everyone."},
      {"by":"a","conf":"I'm hurt. I want a simple explanation that makes being hurt feel less humiliating, but I don't get to decide what {b} felt."},
      {"by":"b","conf":"We broke up, but we still have to live here with everybody watching. I just want some space before the questions start."}
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
    { id: "nrs.o1", place: "aside", turns: [
      {"beat":"{a} watches {b} and {c} sit close together {here}."},
      {"by":"a","conf":"{b} and {c} have a reason to protect each other. That doesn't mean they agree on every vote. I need to know where they actually stand before I treat them like one person."},
      {"by":"a","conf":"If I only speak to one of them, I might miss how the other one is thinking. I should have two conversations instead of making one convenient assumption."}
    ] },
    { id: "nrs.o2", place: "aside", when: {"voice":["schemer","calm","dry","competitive"]}, turns: [
      {"by":"a","conf":"{b} and {c} look comfortable together. I'm wondering how much they tell each other when the rest of us are not around."},
      {"by":"a","conf":"I can be friendly with them and still check whether their plans match. I'm not letting a cute conversation do my thinking for me."}
    ] },
  ],
  'long.romance.target.any': [
    { id: "nrs.t1", place: "aside", turns: [
      {"beat":"{a} watches {b} and {c} talk quietly {here}."},
      {"by":"a","conf":"I want {b} and {c} split up. Having someone here who cares about you gives you a reason to keep fighting when everyone else gets tired."},
      {"by":"a","conf":"Now I need an actual argument people will listen to. Being annoyed that they have each other isn't going to be enough."}
    ] },
    { id: "nrs.t2", place: "aside", when: {"voice":["loud","tough","blunt"]}, turns: [
      {"by":"a","conf":"Watching {b} and {c} together is getting under my skin. I want one of them out, and I know being irritated isn't enough to make it happen."},
      {"by":"a","conf":"I need to find out who else is worried about them. If nobody is, I have to make a better case instead of getting louder."}
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

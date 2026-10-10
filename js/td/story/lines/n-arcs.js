// ══════════════════════════════════════════════════════════════════════
// td/story/lines/n-arcs.js — stories that run across episodes (td/story/arcs.js casts and paces them)
// ══════════════════════════════════════════════════════════════════════
// The user, 2026-10-10, two more Disventure Camp episodes beside ours: "they have real continuous stories,
// multiple events, drama, revenge storyline, maybe romance storyline, friendship storyline". What those
// episodes do: Rosa carries Natalia's vote for weeks; Oliwia follows Ren everywhere until Ren needs air;
// Nura can't stand that Ren has a dream; Benji naps through the work and gets called out; Natalia teaches
// Fiore to talk to people; Ara fakes a showmance with Nura for the numbers. Each one is a scene an
// episode, and each next scene starts where the last one left off.
//
//   avenge   a's closest friend {friend} was voted out, and {rival} wrote the name
//            hurt (a with a friend b) · plan (a recruits b) · end.face (b is {rival}) | end.paid (a voted
//            {rival} out) | end.gone ({rival} went without a's help)
//   cling    a attaches to b; c is b's other friend
//            cling · smother (b to c, a turns up) · talk.kind | talk.snap
//   envy     a envies b, who is everything a is not right now; c is a's friend
//            snipe · confront · end.honest | end.worse
//   slack    b coasts while a does the work; c is a's friend
//            notice · callout · effort.tried | effort.not ({chal}: the engine's own order says which)
//   coach    a teaches b, who can't talk to people, to talk to c
//            offer · practice · done.made | done.awkward
//   fake     a plays a showmance with {mark} for the numbers; b is a's ally (b is {mark} on flirt)
//            plan · flirt · end.real | end.guilt | end.working
// Words only: the engine decided the bonds, the votes and the results, and each ending reads them.

export default {
  // ── revenge for a friend ──
  'arc.avenge.hurt.any': [
    { id: 'nav.h1', turns: [
      { beat: "{a} hasn't touched breakfast, and {a.posAdj} eyes keep going to {friend}'s empty spot by the fire." },
      { by: 'b', say: "You haven't said a word all morning. Talk to me." },
      { by: 'a', say: "{friend} was the one person here I'd have trusted with anything, and now {friend} is gone." },
      { by: 'b', say: "I know. I'm sorry, I really am." },
      { by: 'a', say: "And {rival} sat there at the vote and wrote that name like it was nothing. I watched {rival} do it." },
      { by: 'b', say: "Are you sure it was {rival}?" },
      { by: 'a', say: "I'm sure. I've never been more sure of anything out here." },
      { by: 'a', conf: "{friend} didn't deserve that. I can't bring {friend} back, but I can make sure {rival} doesn't get to forget it." },
    ] },
    { id: 'nav.h2', turns: [
      { by: 'a', say: "Can I tell you something, as long as you don't tell anybody?" },
      { by: 'b', say: "Of course. What's going on?" },
      { by: 'a', say: "I keep turning around to tell {friend} something, and then I remember, every single time." },
      { by: 'b', say: "That's going to take a while. You two were joined at the hip." },
      { by: 'a', say: "It's {rival} I can't stop thinking about, though. {rival} smiled at me this morning, like we're fine." },
      { by: 'b', say: "And you're not fine." },
      { by: 'a', say: "I'm not even close to fine." },
      { by: 'b', conf: "I've never seen {a} like this, because usually {a} lets things go. This one isn't going anywhere." },
    ] },
    { id: 'nav.h3', turns: [
      { beat: "{a} sits down hard next to {b}, holding something {friend} left behind." },
      { by: 'a', say: "{friend} left this. I don't even know what to do with it." },
      { by: 'b', say: "Keep it. Give it back after the show." },
      { by: 'a', say: "I'll give it back with the money, if I win. That would be the right ending." },
      { by: 'b', say: "And whoever wrote {friend}'s name?" },
      { by: 'a', say: "That was {rival}. And {rival} doesn't get an ending, {rival} gets to go home early, if I have anything to do with it." },
      { by: 'a', conf: "Everybody keeps saying it's just a game. It didn't feel like a game when they read {friend}'s name." },
    ] },
  ],
  'arc.avenge.plan.any': [
    { id: 'nav.p1', turns: [
      { by: 'a', say: "I need to know where you are on {rival}. I mean it, honestly." },
      { by: 'b', say: "Is this about {friend}?" },
      { by: 'a', say: "This is completely about {friend}, and I'm not going to pretend it isn't." },
      { by: 'b', say: "Revenge is a bad reason to vote somebody out, you know." },
      { by: 'a', say: "It's a bad reason on its own. But {rival} already showed us who {rival} is. I'm just the one saying it." },
      { by: 'b', say: "...Okay, I'm listening. I'm not promising anything, but I'm listening." },
      { by: 'a', conf: "I'm going to be patient. {rival} thinks I've moved on, and I want {rival} to keep thinking that right up until the end." },
    ] },
    { id: 'nav.p2', turns: [
      { by: 'b', say: "You've been watching {rival} all day. Everybody can see it." },
      { by: 'a', say: "Good. Let {rival} feel it." },
      { by: 'b', say: "That's not a plan, though. That's just staring." },
      { by: 'a', say: "The plan is simple. When the votes are there, my name for {rival} is the first one down, and I'd like yours to be the second." },
      { by: 'b', say: "And if the votes aren't there yet?" },
      { by: 'a', say: "Then I wait, smile at {rival}, and wait some more. I can wait a long time." },
      { by: 'b', conf: "{a} is scary when {a} is calm. I'd rather {a} yelled, honestly." },
    ] },
    { id: 'nav.p3', turns: [
      { by: 'a', say: "Is it just me, or is camp really quiet without {friend}?" },
      { by: 'b', say: "It's not just you. I keep expecting {friend} to walk out of the shelter." },
      { by: 'a', say: "Me too, every morning. And you know who's sleeping just fine?" },
      { by: 'b', say: "Let me guess, {rival}." },
      { by: 'a', say: "{rival}, like a baby, every night. I want one of those nights to be {rival}'s last one here." },
      { by: 'b', say: "I'm with you. Not for the revenge, but because {rival} would do it to me next." },
      { by: 'a', say: "I'll take it. I don't care why, as long as you're with me." },
      { by: 'a', conf: "{b} doesn't have to care about {friend} the way I do. {b} just has to write the right name." },
    ] },
  ],
  'arc.avenge.end.face': [
    { id: 'nav.f1', turns: [
      { beat: "{a} finds {b} alone, and doesn't bother with hello." },
      { by: 'a', say: "Why did you write {friend}'s name?" },
      { by: 'b', say: "Wow, okay. Good morning to you too." },
      { by: 'a', say: "Just answer me. You owe me that much." },
      { by: 'b', say: "{friend} was a threat, and that's all it was. It was never personal." },
      { by: 'a', say: "It was personal to me. You knew {friend} was my person out here, and you did it anyway." },
      { by: 'b', say: "That's the game. You'd have done the same thing to me." },
      { by: 'a', say: "Maybe. But I'd have looked you in the eye after, and you haven't looked at me once." },
      { by: 'b', conf: "{a} wants me to feel bad, and I do feel a little bad, but I'd still do it again." },
      { by: 'a', conf: "I wanted an apology. I got an excuse, so now I know exactly how this ends." },
    ] },
    { id: 'nav.f2', turns: [
      { by: 'b', say: "You've been weird with me for days. Can we just have it out?" },
      { by: 'a', say: "Fine. You voted out {friend}, and I haven't forgiven you, and I'm not going to." },
      { by: 'b', say: "I didn't think you even knew it was me." },
      { by: 'a', say: "Everybody knows it was you. You're not as quiet as you think you are." },
      { by: 'b', say: "So what now, you're coming after me?" },
      { by: 'a', say: "I'm not coming after you. I'm just not going to save you when someone else does." },
      { by: 'b', conf: "That was the coldest thing anybody's ever said to me, and {a} said it smiling." },
    ] },
  ],
  'arc.avenge.end.paid': [
    { id: 'nav.y1', turns: [
      { by: 'b', say: "So {rival}'s gone. How does it feel?" },
      { by: 'a', say: "I thought I'd feel amazing, and honestly, I mostly feel tired." },
      { by: 'b', say: "That's allowed, you know. You've been carrying it for a while." },
      { by: 'a', say: "I wrote {rival}'s name for {friend}, and I'd do it again. But it didn't bring {friend} back." },
      { by: 'b', say: "It was never going to." },
      { by: 'a', conf: "That one was for {friend}. Now I have to start playing for me again, and I'm not sure I remember how." },
    ] },
    { id: 'nav.y2', turns: [
      { by: 'a', say: "Did you see {rival}'s face when they read the last vote?" },
      { by: 'b', say: "I did. You looked very calm about it." },
      { by: 'a', say: "I was calm. I'd been waiting for that moment since {friend} left." },
      { by: 'b', say: "Is it done, then? Are you good now?" },
      { by: 'a', say: "It's done. I'm not sure good is the word, but it's done." },
      { by: 'a', conf: "{friend}, if you're watching this, that one was yours. I'll get the rest of them myself." },
    ] },
  ],
  'arc.avenge.end.gone': [
    { id: 'nav.n1', turns: [
      { by: 'b', say: "Well, {rival}'s gone, and you didn't even have to do anything." },
      { by: 'a', say: "That's the worst part. I spent days planning it, and somebody else got there first." },
      { by: 'b', say: "Does it matter who did it?" },
      { by: 'a', say: "It shouldn't, and it does. {rival} never knew it was coming from me." },
      { by: 'b', say: "Maybe that's a good thing. Now you don't have to be that person." },
      { by: 'a', conf: "I wanted {rival} to know it was for {friend}. Instead {rival} just went home, like anybody does. I don't know what to do with the anger now." },
    ] },
    { id: 'nav.n2', turns: [
      { by: 'a', say: "Is it terrible that I'm a little disappointed?" },
      { by: 'b', say: "That {rival} went home? Kind of, yeah." },
      { by: 'a', say: "Not that {rival} went. That it wasn't me who sent {rival} there." },
      { by: 'b', say: "{friend} wouldn't care who did it. You know that, right?" },
      { by: 'a', say: "...Yeah. {friend} would tell me to stop sulking and go win something." },
      { by: 'a', conf: "I'm letting it go. That's what {friend} would want, even if part of me still wanted to be the one." },
    ] },
  ],

  // ── the friend who won't let go ──
  'arc.cling.cling.any': [
    { id: 'ncl.c1', turns: [
      { beat: "{b} gets up to fetch water, and {a} is up and following before {b} has gone three steps." },
      { by: 'b', say: "I'm just getting water. You don't have to come." },
      { by: 'a', say: "I want to come! Two people can carry more water than one." },
      { by: 'b', say: "It's one bucket, though." },
      { by: 'a', say: "Then I'll carry the other side of the one bucket." },
      { by: 'b', conf: "{a} is sweet, and I like {a}, I really do. But I haven't been alone for more than a minute since we got here." },
      { by: 'a', conf: "{b} is my best friend out here. Maybe my best friend ever. I'm not letting anything happen to that." },
    ] },
    { id: 'ncl.c2', turns: [
      { by: 'a', say: "I saved you a spot next to me. And I saved you the good fish." },
      { by: 'b', say: "Oh. Thanks, you didn't have to do that." },
      { by: 'a', say: "I always will, every meal. That's what friends do." },
      { by: 'b', say: "Every meal? Even if I'm not hungry?" },
      { by: 'a', say: "Especially then. You have to keep your strength up for the challenges." },
      { by: 'b', conf: "{a} has been saving me food, a sleeping spot and a seat on the log, all of it, every single day. It's a lot of saving." },
    ] },
    { id: 'ncl.c3', turns: [
      { by: 'a', say: "Where were you? I looked everywhere for you." },
      { by: 'b', say: "I was in the outhouse, for about two minutes." },
      { by: 'a', say: "Two very long minutes. I thought something happened to you." },
      { by: 'b', say: "What would happen to me in an outhouse?" },
      { by: 'a', say: "This place is dangerous! There are bears, and there's whatever was in last night's stew." },
      { by: 'a', conf: "I know I worry too much. But everybody I get close to leaves eventually, and I'm not ready for {b} to be one of them." },
    ] },
  ],
  'arc.cling.smother.any': [
    { id: 'ncl.s1', turns: [
      { by: 'b', say: "Can I tell you something, as long as it doesn't get back to {a}?" },
      { by: 'c', say: "You need a break from {a}. I can tell from here." },
      { by: 'b', say: "I just need ten minutes where nobody's checking on me. That's all I want." },
      { by: 'c', say: "Have you told {a} that?" },
      { by: 'b', say: "How? {a} would be heartbroken, and I'd feel like a monster." },
      { beat: "{a} appears from behind the shelter, beaming." },
      { by: 'a', say: "There you are! What are we talking about?" },
      { by: 'c', conf: "{b} looked at me like a hostage. I'm not saying anything, but somebody's going to have to." },
    ] },
    { id: 'ncl.s2', turns: [
      { beat: "{b} has hidden behind the supply shed, and {c} finds {b} there first." },
      { by: 'c', say: "Are you hiding?" },
      { by: 'b', say: "I'm not hiding, I'm resting, out of sight, very quietly." },
      { by: 'c', say: "From {a}?" },
      { by: 'b', say: "I love {a}. I love {a} so much. And I need {a} to love me from a slightly further distance." },
      { by: 'a', say: "{b}, are you back there? I brought you a coconut!" },
      { by: 'b', say: "...I'm coming." },
      { by: 'b', conf: "It was a really good coconut. That's the problem, {a} is so nice about it, and I still can't breathe." },
    ] },
  ],
  'arc.cling.talk.kind': [
    { id: 'ncl.k1', turns: [
      { by: 'b', say: "Can we talk? It's nothing bad, I promise." },
      { by: 'a', say: "Nothing bad always means something bad." },
      { by: 'b', say: "It really doesn't. You're my favourite person here, and I need you to hear that part first." },
      { by: 'a', say: "...Okay. And the second part?" },
      { by: 'b', say: "The second part is that sometimes I need a little time on my own, and it's not because of you." },
      { by: 'a', say: "Oh, I didn't know I was doing that. I just didn't want you to go anywhere." },
      { by: 'b', say: "I'm not going anywhere, except to the beach for an hour, alone, and then I'll come back." },
      { by: 'a', conf: "It stung a little. But {b} said I was the favourite, and I'm holding on to that part." },
      { by: 'b', conf: "I thought {a} would cry. {a} hugged me instead, and then gave me space, and I've never loved {a} more." },
    ] },
    { id: 'ncl.k2', turns: [
      { by: 'a', say: "You've been kind of quiet with me. Did I do something?" },
      { by: 'b', say: "No, you didn't do anything wrong. You just do everything with me." },
      { by: 'a', say: "Is that bad?" },
      { by: 'b', say: "It's not bad, it's just a lot. And I think you'd like some of these other people too, if you gave them the chance." },
      { by: 'a', say: "What if they don't like me back?" },
      { by: 'b', say: "Then you come back to me, and I'll still be here. That's how it works." },
      { by: 'a', conf: "{b} isn't leaving me, {b} is just letting me go and make other friends. That's different, I think." },
    ] },
  ],
  'arc.cling.talk.snap': [
    { id: 'ncl.n1', turns: [
      { by: 'a', say: "I saved you a—" },
      { by: 'b', say: "Please, stop saving me things. Please, just for one day, stop." },
      { by: 'a', say: "...I was just trying to be nice." },
      { by: 'b', say: "I know you were, and that makes it worse! I can't even be annoyed without feeling awful." },
      { by: 'a', say: "Then I'll stop and leave you alone, since that's what you want, right?" },
      { by: 'b', say: "That's not what I— {a}, come back." },
      { by: 'b', conf: "I said it the worst possible way. Everything I said was true, and I still feel like I kicked a puppy." },
      { by: 'a', conf: "I've been here before. You hold on too tight, and people let go, and I should have known that by now." },
    ] },
    { id: 'ncl.n2', turns: [
      { by: 'b', say: "I need you to give me some space. I'm serious this time." },
      { by: 'a', say: "This time? Have you been trying to tell me before?" },
      { by: 'b', say: "For days. I've been literally hiding from you, {a}." },
      { by: 'a', say: "From me?" },
      { by: 'b', say: "From everyone, but mostly from you. I'm sorry, but it's true." },
      { by: 'a', say: "Okay, got it, I'll go sit somewhere else." },
      { by: 'a', conf: "It's fine, I'm fine. I'm going to go be fine somewhere {b} can't see me." },
    ] },
  ],

  // ── envy ──
  'arc.envy.snipe.any': [
    { id: 'nev.s1', turns: [
      { beat: "Everybody's gathered round {b}, laughing at a story. {a} watches from the edge, arms folded." },
      { by: 'a', say: "Must be nice, having everybody hang on every word you say." },
      { by: 'b', say: "Sorry, did you want to tell a story?" },
      { by: 'a', say: "No, no, you go ahead. You always do." },
      { by: 'c', say: "Okay, what was that about?" },
      { by: 'a', say: "Nothing. I'm just tired of watching the {b} show, that's all." },
      { by: 'c', conf: "{b} didn't do anything wrong. {a} is just really, really bothered by {b} existing." },
    ] },
    { id: 'nev.s2', turns: [
      { by: 'b', say: "I honestly can't wait to get home. I've got so many plans." },
      { by: 'a', say: "Of course you do. Some people get everything handed to them." },
      { by: 'b', say: "Handed to me? I worked for all of it." },
      { by: 'a', say: "Sure you did." },
      { by: 'c', say: "{a}, leave it." },
      { by: 'a', conf: "I don't hate {b}. I hate that {b} knows exactly what {b} wants, and I've been stuck in the same place for years." },
    ] },
    { id: 'nev.s3', turns: [
      { by: 'c', say: "Everybody loves {b} today. Did you hear about the fish?" },
      { by: 'a', say: "I heard about the fish, everybody heard about the fish. It's one fish." },
      { by: 'c', say: "It was a really big fish, though." },
      { by: 'a', say: "Next week, {b} will catch a whale, and everybody will throw {b} a parade." },
      { by: 'b', say: "Are you talking about me?" },
      { by: 'a', say: "Just about the fish. Congratulations on the fish." },
      { by: 'b', conf: "I don't know what I did to {a}. I've been nothing but nice, and every time I open my mouth, {a} looks like I've stolen something." },
    ] },
  ],
  'arc.envy.confront.any': [
    { id: 'nev.c1', turns: [
      { by: 'b', say: "Okay, what is your problem with me? Seriously." },
      { by: 'a', say: "I don't have a problem with you." },
      { by: 'b', say: "You roll your eyes every time I talk. You think I haven't noticed?" },
      { by: 'a', say: "Maybe you just talk a lot." },
      { by: 'b', say: "Or maybe you're jealous, and you won't say it." },
      { by: 'a', say: "Jealous of you? That's hilarious." },
      { by: 'a', conf: "It wasn't hilarious. It was right, and that's why I walked away." },
      { by: 'b', conf: "{a} didn't deny it. {a} just laughed and left, and I think that's the same thing." },
    ] },
    { id: 'nev.c2', turns: [
      { by: 'b', say: "Did I do something to you before the show, maybe? Because I honestly can't figure it out." },
      { by: 'a', say: "You didn't do anything, you're just very... you." },
      { by: 'b', say: "What does that even mean?" },
      { by: 'a', say: "It means everything works out for you, and it gets old watching it." },
      { by: 'b', say: "You have no idea what my life is like. None." },
      { by: 'a', say: "Then I guess we're even, because you don't know mine either." },
      { by: 'b', conf: "I thought it was something I said. It's not. It's something {a} is carrying, and I'm just the one standing closest to it." },
    ] },
  ],
  'arc.envy.end.honest': [
    { id: 'nev.h1', turns: [
      { by: 'a', say: "Can I say something without you being smug about it?" },
      { by: 'b', say: "I'll try my very hardest." },
      { by: 'a', say: "I've been awful to you, and it's because I'm jealous. You know what you want, and you go after it. I've never done that." },
      { by: 'b', say: "...Wow, okay. I didn't expect that." },
      { by: 'a', say: "Don't make it weird." },
      { by: 'b', say: "I won't. But for the record, I'm scared all the time too, I'm just loud about it." },
      { by: 'a', conf: "I thought saying it out loud would feel humiliating. It mostly felt like putting down something heavy." },
      { by: 'b', conf: "{a} apologised, sort of, in a very {a} way. I'll take it. I think we might actually be okay." },
    ] },
    { id: 'nev.h2', turns: [
      { by: 'b', say: "I keep thinking about what you said, about everything working out for me." },
      { by: 'a', say: "Forget it. I was being bitter." },
      { by: 'b', say: "No, you were being honest, and badly. There's a difference." },
      { by: 'a', say: "...I've been stuck for a long time, and you're not stuck, and it got to me. That's all it is." },
      { by: 'b', say: "Then let's get you unstuck after the show. I mean it, I'll help." },
      { by: 'a', conf: "I spent a week hating {b} for something {b} didn't do, and {b} just offered to help me. I need to sit down." },
    ] },
  ],
  'arc.envy.end.worse': [
    { id: 'nev.w1', turns: [
      { by: 'b', say: "Look, can we just call a truce? This is exhausting." },
      { by: 'a', say: "There's nothing to call a truce on. We're not fighting." },
      { by: 'b', say: "You've been sniping at me for a week." },
      { by: 'a', say: "And you've been the golden child for a week. We all have our hobbies." },
      { by: 'b', say: "Okay, I tried. Remember that I tried." },
      { by: 'b', conf: "I offered {a} an olive branch, and {a} snapped it in half. Fine. I'm done being nice about it." },
      { by: 'a', conf: "I know I'm being horrible. Knowing it doesn't make me stop, it just makes me feel worse while I do it." },
    ] },
    { id: 'nev.w2', turns: [
      { by: 'a', say: "Everyone thinks you're so wonderful. I just want to know what it is that I'm missing." },
      { by: 'b', say: "Maybe it's that I'm nice to people. You could try it sometime." },
      { by: 'a', say: "Oh, there it is. The real {b}." },
      { by: 'b', say: "No, that's the {b} you made, by poking at me every day until I bit back." },
      { by: 'b', conf: "I've never been mean to anybody on purpose out here. {a} is the first person who's made me want to." },
    ] },
  ],

  // ── the one who coasts ──
  'arc.slack.notice.any': [
    { id: 'nsl.n1', turns: [
      { beat: "{a} drags a log back to camp alone. {b} is asleep in the hammock, one arm hanging off the side." },
      { by: 'a', say: "Does {b} do anything? Like, ever?" },
      { by: 'c', say: "{b} put the lid on the water this morning. I saw it happen." },
      { by: 'a', say: "Wow, a lid. Somebody alert the host." },
      { by: 'b', say: "I can hear you, you know. I'm resting my eyes." },
      { by: 'a', say: "You've been resting your eyes since we got here!" },
      { by: 'a', conf: "I'm out here doing the work of two people, and one of those people is snoring in a hammock." },
    ] },
    { id: 'nsl.n2', turns: [
      { by: 'c', say: "Where's {b}? I thought {b} was on firewood with you." },
      { by: 'a', say: "{b} said {b} was going to find the good wood. That was two hours ago." },
      { beat: "{b} wanders back, empty-handed, eating berries." },
      { by: 'b', say: "There's no good wood, but I looked everywhere for it, very thoroughly." },
      { by: 'a', say: "You have purple all over your face." },
      { by: 'b', say: "...The berries were on the way to the wood." },
      { by: 'c', conf: "Honestly, I can't even be mad, because it was a beautiful excuse. {a} is very, very mad, though." },
    ] },
  ],
  'arc.slack.callout.any': [
    { id: 'nsl.c1', turns: [
      { by: 'a', say: "We need to talk. You do nothing around here, and everybody's noticed." },
      { by: 'b', say: "I do things! I'm doing a thing right now, I'm listening to you." },
      { by: 'a', say: "That's not a thing. You haven't carried a single log since day one." },
      { by: 'b', say: "I'm saving my energy for the challenges." },
      { by: 'a', say: "Great. Then today, at the challenge, I'd love to see some of it." },
      { by: 'b', conf: "Okay, {a} has a point, a small one. I'll try today, I suppose, but don't tell {a} I said that." },
      { by: 'a', conf: "If {b} doesn't pull {b.posAdj} weight today, I'm making it everybody's problem tonight." },
    ] },
    { id: 'nsl.c2', turns: [
      { by: 'a', say: "Be honest with me. Do you actually want to be here?" },
      { by: 'b', say: "Of course I want to be here. The food is free." },
      { by: 'a', say: "The food is terrible, and you only get it because the rest of us go and catch it." },
      { by: 'b', say: "And I'm very grateful. I say thank you every time." },
      { by: 'a', say: "Say it with your hands, for once. Show up today." },
      { by: 'b', conf: "Nobody's ever called me out like that before. It was kind of rude, and also, kind of fair." },
    ] },
  ],
  'arc.slack.effort.tried': [
    { id: 'nsl.t1', turns: [
      { by: 'a', say: "Okay, I'll say it, you were really good out there at {chal}." },
      { by: 'b', say: "I know. I was saving my energy, like I told you." },
      { by: 'a', say: "Don't push it. But yeah, you showed up." },
      { by: 'b', say: "Does that mean I can nap now?" },
      { by: 'a', say: "...You earned one nap. One." },
      { by: 'a', conf: "I didn't think {b} had it in {b.obj}. I was wrong, and I hate being wrong, but I'm glad this time." },
      { by: 'b', conf: "Turns out trying feels kind of good. Don't spread it around, though, because I have a reputation." },
    ] },
    { id: 'nsl.t2', turns: [
      { by: 'b', say: "So? Was that enough effort for you?" },
      { by: 'a', say: "Where has that been the whole time?" },
      { by: 'b', say: "In storage. I only bring it out on special occasions." },
      { by: 'a', say: "Every challenge is a special occasion. That's what they're for." },
      { by: 'b', say: "Okay, okay, I'll bring it out more. Maybe." },
      { by: 'a', conf: "{b} went from hammock to MVP in one afternoon. If {b} can keep that up, I'll never complain about anything again." },
    ] },
  ],
  'arc.slack.effort.not': [
    { id: 'nsl.x1', turns: [
      { by: 'b', say: "Before you say anything, I tried. I really did try." },
      { by: 'a', say: "I know you tried. I watched you try, and it still wasn't enough." },
      { by: 'b', say: "So what do you want me to do?" },
      { by: 'a', say: "Keep trying, every day, and not just today because I yelled at you." },
      { by: 'b', say: "...That's fair. That's annoyingly fair." },
      { by: 'a', conf: "At least {b} tried. I'd rather lose with somebody who tries than win with somebody who doesn't bother." },
    ] },
    { id: 'nsl.x2', turns: [
      { by: 'a', say: "Was that you trying at {chal}? Was that really it?" },
      { by: 'b', say: "That was me trying very hard, actually. I'm just not good at it." },
      { by: 'a', say: "Then why didn't you say that, instead of sleeping all week?" },
      { by: 'b', say: "Because sleeping is easier than being bad at things in front of everybody." },
      { by: 'b', conf: "I'd rather people think I'm lazy than think I'm useless. Lazy at least sounds like a choice." },
    ] },
  ],

  // ── learning to talk to people ──
  'arc.coach.offer.any': [
    { id: 'nco.o1', turns: [
      { by: 'a', say: "Can I ask you something? Why do you always sit on your own at dinner?" },
      { by: 'b', say: "I don't know what to say to people. So I don't say anything." },
      { by: 'a', say: "That's not a reason to sit alone, it's a skill problem, and skill problems can be fixed." },
      { by: 'b', say: "You can't teach somebody how to talk." },
      { by: 'a', say: "Watch me. Tomorrow, you're going to have one conversation with one person, and that's all." },
      { by: 'b', say: "One?" },
      { by: 'a', say: "One. And I'll be right there the whole time." },
      { by: 'b', conf: "I don't think it'll work. But {a} looked so sure, and nobody's ever been sure about me before." },
    ] },
    { id: 'nco.o2', turns: [
      { by: 'a', say: "Okay, it's a game, so you have to talk to people, or they'll vote you out for being a mystery." },
      { by: 'b', say: "I talk to people. I'm talking to you." },
      { by: 'a', say: "You're talking to me because I sat down next to you and didn't leave." },
      { by: 'b', say: "...That's true." },
      { by: 'a', say: "So let me help you. I'm good at this, and I'll give you lessons." },
      { by: 'b', say: "Lessons in talking." },
      { by: 'a', say: "Lessons in being the person people don't want to vote out. It's basically the same thing." },
      { by: 'a', conf: "{b} is sweet, funny and totally invisible. I can fix two of those things, and I can make everybody notice the other one." },
    ] },
  ],
  'arc.coach.practice.any': [
    { id: 'nco.p1', turns: [
      { by: 'a', say: "Okay, there's {c}. Go say something, anything at all." },
      { by: 'b', say: "What do I say?" },
      { by: 'a', say: "Ask about something you've seen {c} doing. People love talking about themselves." },
      { beat: "{b} walks over to {c}, very stiffly." },
      { by: 'b', say: "Hi, {c}, I noticed you... sit down a lot." },
      { by: 'c', say: "...Thanks? I guess I do sit down a lot." },
      { by: 'b', say: "It's a good sitting, though. Very relaxed." },
      { by: 'c', say: "Ha. Okay, you're kind of funny." },
      { by: 'b', conf: "{c} laughed! I don't know if it was at me or with me, but I'm counting it as with me." },
      { by: 'a', conf: "That was the worst opener I've ever heard, and it worked. I'm so proud I could cry." },
    ] },
    { id: 'nco.p2', turns: [
      { by: 'a', say: "Today's lesson is eye contact. Look at {c} when you talk." },
      { by: 'b', say: "That's terrifying." },
      { by: 'a', say: "Not the whole time, just some of the time. Go on." },
      { by: 'b', say: "Hey, {c}. Need help with the fire?" },
      { by: 'c', say: "Actually, yeah. Why are you staring at me like that?" },
      { by: 'b', say: "I was told to look at you. Is it too much? It feels like too much to me." },
      { by: 'c', say: "It's a little much. But I'll take the help." },
      { by: 'c', conf: "I'd never had a real conversation with {b} before today. It was weird, and also, I kind of liked it." },
    ] },
  ],
  'arc.coach.done.made': [
    { id: 'nco.m1', turns: [
      { by: 'a', say: "Look at you, sitting with people by the fire like a normal person." },
      { by: 'b', say: "I know! I talked to three whole people today!" },
      { by: 'a', say: "And nobody died." },
      { by: 'b', say: "Nobody died. One person even laughed at a joke I made on purpose." },
      { by: 'a', say: "On purpose! My student has graduated." },
      { by: 'b', conf: "I came here thinking I'd be the quiet one forever. Now people actually say hi to me. It's because of {a}." },
      { by: 'a', conf: "I helped {b} talk to people, and now {b} has friends here. It's the best move I've made all game, and it wasn't even a game move." },
    ] },
    { id: 'nco.m2', turns: [
      { by: 'b', say: "Somebody asked me to help with the shelter today, without me even offering first." },
      { by: 'a', say: "And what did you say?" },
      { by: 'b', say: "I said yes, and then we talked the whole time, about nothing at all. It was great." },
      { by: 'a', say: "Talking about nothing is the hardest thing there is, and you just did it." },
      { by: 'b', say: "I couldn't have, a week ago. You know that, right?" },
      { by: 'a', conf: "{b} doesn't need me any more. That's the whole point of teaching somebody, and it still makes me a little sad." },
    ] },
  ],
  'arc.coach.done.awkward': [
    { id: 'nco.w1', turns: [
      { by: 'b', say: "I don't think it worked. I still freeze up every time." },
      { by: 'a', say: "You talked to {c}, though. That's one more person than last week." },
      { by: 'b', say: "And then I said something weird about sitting, and it never recovered." },
      { by: 'a', say: "It's not a race. You're allowed to be slow at it." },
      { by: 'b', say: "At least I've got you. That's one person." },
      { by: 'a', say: "That's one person, and it's a good one." },
      { by: 'b', conf: "Maybe I'm not built to talk to everybody. But I talk to {a}, and out here that might be enough." },
    ] },
    { id: 'nco.w2', turns: [
      { by: 'a', say: "How did it go with {c} today? I saw you two by the water." },
      { by: 'b', say: "I asked {c} about home, like you said. Then I panicked and talked about fish for ten minutes." },
      { by: 'a', say: "Fish is a conversation. A strange one, but a conversation." },
      { by: 'b', say: "{c} looked like {c} wanted to swim away." },
      { by: 'a', say: "Next time, ask one question and then listen. You don't have to fill the quiet." },
      { by: 'b', conf: "I'm still bad at this. But I'm bad at it out loud now, instead of in my head, and {a} says that counts." },
    ] },
  ],

  // ── a showmance for the numbers ──
  'arc.fake.plan.any': [
    { id: 'nfk.p1', turns: [
      { by: 'a', say: "I've got a new strategy, and you're going to hate it." },
      { by: 'b', say: "I already hate it. What is it?" },
      { by: 'a', say: "{mark} likes me. Like, likes me likes me." },
      { by: 'b', say: "And?" },
      { by: 'a', say: "And somebody who's in love with you never writes your name down. It's the safest seat in the game." },
      { by: 'b', say: "That's cold, even for you." },
      { by: 'a', say: "It's not cold, it's strategy with flowers on it." },
      { by: 'a', conf: "I'm not proud of it. I'm also not going home because I was too proud to flirt." },
    ] },
    { id: 'nfk.p2', turns: [
      { by: 'b', say: "Why do you keep looking over at {mark}?" },
      { by: 'a', say: "Because {mark} keeps looking at me, and I'm thinking about how useful that is." },
      { by: 'b', say: "Useful. You mean romantically useful?" },
      { by: 'a', say: "I mean a showmance is a voting bloc of two that doesn't know it's a voting bloc." },
      { by: 'b', say: "That is the least romantic sentence I've ever heard." },
      { by: 'b', conf: "{a} is about to fake-date {mark} for the votes. I'm horrified, and I'm also staying very close, because I want to see how this goes." },
    ] },
  ],
  'arc.fake.flirt.any': [
    { id: 'nfk.f1', turns: [
      { by: 'a', say: "Has anyone told you you look good in this light?" },
      { by: 'b', say: "We're gutting fish right now." },
      { by: 'a', say: "Then imagine how good you'd look somewhere nice." },
      { by: 'b', say: "...Okay, that was smooth. Annoyingly smooth." },
      { by: 'a', say: "Sit with me tonight at the fire?" },
      { by: 'b', say: "Maybe, yes. Okay, yes." },
      { by: 'b', conf: "{a} has been really sweet to me lately. I don't want to read into it. I'm reading into it a lot." },
      { by: 'a', conf: "{b} said yes. I felt nothing. Okay, I felt a little something, but I'm choosing to ignore it." },
    ] },
    { id: 'nfk.f2', turns: [
      { beat: "{a} sits down beside {b} at the fire, close enough that their shoulders touch." },
      { by: 'a', say: "Cold?" },
      { by: 'b', say: "A little." },
      { by: 'a', say: "Here, take my jacket. I run hot, anyway." },
      { by: 'b', say: "You're going to freeze." },
      { by: 'a', say: "It's worth it to see you smile like that." },
      { by: 'a', conf: "The jacket was a very good move, but I'm actually freezing. Strategy is cold, literally." },
      { by: 'b', conf: "I think {a} likes me. I think I like {a}. I'm going to try very hard not to be stupid about it." },
    ] },
  ],
  'arc.fake.end.real': [
    { id: 'nfk.r1', turns: [
      { by: 'b', say: "So, how's the fake showmance going?" },
      { by: 'a', say: "Don't." },
      { by: 'b', say: "Oh no, oh no, no. You actually like {mark}!" },
      { by: 'a', say: "I said don't. It wasn't supposed to happen." },
      { by: 'b', say: "The great strategist, taken down by a jacket and a campfire." },
      { by: 'a', conf: "This was supposed to be the safest move in the game. Now I've got something to lose, and that's the opposite of safe." },
    ] },
    { id: 'nfk.r2', turns: [
      { by: 'a', conf: "Here's the thing nobody tells you about faking a showmance. If you do it well enough, you start believing it." },
      { by: 'b', say: "You're smiling at nothing again." },
      { by: 'a', say: "I'm not smiling, I'm thinking about strategy." },
      { by: 'b', say: "You're thinking about {mark}, and it's written all over your face." },
      { by: 'a', say: "...Fine. It's real now. Are you happy?" },
      { by: 'b', say: "I'm thrilled. And I'm also writing down that I called it." },
    ] },
  ],
  'arc.fake.end.guilt': [
    { id: 'nfk.g1', turns: [
      { by: 'a', say: "{mark} told me something today, something real, about home." },
      { by: 'b', say: "And?" },
      { by: 'a', say: "And I just sat there knowing I started all of this for the votes. I felt sick." },
      { by: 'b', say: "So stop. Tell {mark} the truth." },
      { by: 'a', say: "And lose {mark}'s vote, and probably {mark}, too? I can't." },
      { by: 'a', conf: "I thought I could keep my heart out of it. {mark} keeps being kind to me, and I keep feeling worse about it." },
    ] },
    { id: 'nfk.g2', turns: [
      { by: 'b', say: "You look awful. What happened?" },
      { by: 'a', say: "{mark} gave me half of {mark}'s food, just because I looked hungry." },
      { by: 'b', say: "That sounds like the plan working." },
      { by: 'a', say: "It is the plan working, and that's the problem. {mark} is genuinely good to me, and I'm lying to {mark} every day." },
      { by: 'b', say: "You could stop." },
      { by: 'a', conf: "I came here to be ruthless. Nobody warned me that {mark} would be so easy to like." },
    ] },
  ],
  'arc.fake.end.working': [
    { id: 'nfk.k1', turns: [
      { by: 'b', say: "Your little plan with {mark} seems to be going well." },
      { by: 'a', say: "Better than well. {mark} checks with me before every vote now." },
      { by: 'b', say: "And you don't feel anything about that?" },
      { by: 'a', say: "I feel safe. That's what I came here for." },
      { by: 'b', say: "That is a terrifying answer." },
      { by: 'a', conf: "{mark} would walk through fire for me. I'm trying very hard to make sure I never have to ask." },
      { by: 'b', conf: "I'm in an alliance with somebody who fake-dates people for votes. I should probably be more worried than I am." },
    ] },
    { id: 'nfk.k2', turns: [
      { by: 'a', say: "{mark} told me exactly who {mark} is voting for next, without me even asking." },
      { by: 'b', say: "So the showmance is paying off." },
      { by: 'a', say: "The showmance is the best idea I've had out here, and I've had some good ones." },
      { by: 'b', say: "Does {mark} have any idea?" },
      { by: 'a', say: "None. And it's going to stay that way, as long as you keep that face under control." },
      { by: 'b', conf: "Every time {mark} looks at {a} like that, I want to warn {mark}. Then I remember whose side I'm on." },
    ] },
  ],
};

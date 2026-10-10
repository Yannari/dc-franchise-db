// ══════════════════════════════════════════════════════════════════════
// td/story/lines/firstday.js — the first day: the team meets
// ══════════════════════════════════════════════════════════════════════
//
// director.js firstDay() / firstPair(). Written in the voice the user approved (2026-10-08):
// plain, specific, people answering each other; confessionals say what they think of a person.
// A line's `v` holds versions for how the speaker talks (td/story/voice.js); the speaker's
// strongest tag with a version is the one they say.
//   story.firstday.<start|swap>   a (the loudest), b, c, d meet. 'swap': a team just shuffled.
//   story.firstday.history.<hist> a and b knew each other before; c and d find out.
//     hist: siblings, family, cousins, couple, friends, knew, estranged, exes, exfriends
//     (cast setup), wronged / wronger / oldflame / oldcouple / oldrivals / oldallies (a past
//     season, {where}); {kinWord} is what b is to a ("sister", "boyfriend", "ex").
//   story.firstpair.<clicked|clashed>  a and b, from day one's real bonds
// Each venue's first hour is its own: the cabins (Wawanakwa), the trailers (the film lot), the
// jet (World Tour), building a shelter from nothing (Soluna), the team tents (Stawaki).

export default {
  'story.firstday.start': [
    { id: 'fd.c1', place: 'sleep', when: { venue: 'hosted-camp' }, turns: [
      { beat: "The {tribe} walk into their cabin for the first time. Nobody knows where to put their stuff." },
      { by: 'a', say: "I'm taking the bottom bunk by the window.",
        v: { bossy: "Okay, I'm taking the bottom bunk by the window, and I'm making a chore list.", ditzy: "Ooh, is this one mine? It's by the window, so I'm taking it." } },
      { by: 'b', say: "Did we all agree on that?", v: { dry: "Oh, good. We're doing that already." } },
      { by: 'a', say: "I'm agreeing on it now." },
      { by: 'c', say: "Can I at least have the one that isn't next to the door?",
        v: { anxious: "Is that a spider in the corner? Because I'm not sleeping by the corner.", food: "Does anybody have snacks? I packed snacks and they took my snacks." } },
      { by: 'd', say: "Sure, whatever, I'll take the one nobody wants.", v: { calm: "I'll sleep anywhere. I've slept on a bus." } },
      { by: 'b', conf: "{a} has been here five minutes and is already bossing people around. This is going to be a long summer.",
        v: { warm: "I like everybody so far. {a} is a lot, but I like everybody so far.", schemer: "{a} took charge in five minutes. Good. People who take charge early are the first ones everybody gets sick of." } },
    ] },
    { id: 'fd.c2', place: 'public', when: { venue: 'hosted-camp' }, turns: [
      { beat: "The {tribe} stand around in the middle of camp after Chris leaves. Nobody's sure what happens now." },
      { by: 'a', say: "Okay, hi, we should probably all, like, say who we are.",
        v: { loud: "Okay! Everybody listen up! Names, where you're from, and why you're gonna help us win!", warm: "Hi! Okay, I'm hugging everybody, is that okay? I'm hugging everybody." } },
      { by: 'c', say: "We said our names on the dock." },
      { by: 'a', say: "Yeah, and nobody was listening. I'm {a}." },
      { by: 'c', say: "{c}. Hi." },
      { by: 'd', say: "{d}.", v: { dry: "{d}. I'll be here all summer, apparently.", goofy: "{d}! And I can burp the whole alphabet, but not now. Later, probably." } },
      { by: 'b', say: "{b}. And for the record, I'm not here to make friends.", v: { warm: "{b}! And I'm so excited, I'm already so excited.", anxious: "Um, {b}. Sorry... hi." } },
      { by: 'a', conf: "First impressions? {d} is going to be funny, and {b} is going to be a problem.",
        v: { schemer: "Everyone's telling me exactly who they are on day one. I'm writing it all down. In my head." } },
    ] },
    { id: 'fd.c3', place: 'eat', when: { venue: 'hosted-camp' }, turns: [
      { beat: "First lunch in the mess hall. Chef drops a scoop of something on every tray." },
      { by: 'c', say: "What is this?", v: { food: "Okay, it's grey, but it's food. I can work with grey." } },
      { by: 'a', say: "I think it's supposed to be stew." },
      { by: 'd', say: "It's looking at me." },
      { by: 'b', say: "Just eat it. We need our energy for whatever Chris has planned.",
        v: { competitive: "Eat it. All of it. If the other team's eating this too, we're not losing to them on an empty stomach." } },
      { by: 'c', say: "You first." },
      { beat: "{b} takes a bite, chews, and keeps a straight face for about three seconds." },
      { by: 'd', conf: "Day one and I'd already trade my whole bag for a sandwich.", v: { food: "It's day one and I'd already trade everything I own for one decent sandwich.", grown: "Day one, and I already miss my kitchen more than I can say." } },
    ] },
    { id: 'fd.l1', place: 'sleep', when: { venue: 'film-lot' }, turns: [
      { beat: "The {tribe} get their trailer. It has two beds that fold out of the wall, and one of them is broken." },
      { by: 'a', say: "Okay, which one's broken?", v: { dry: "So which one of these is the broken one? There's always a broken one.", bossy: "Okay, which one's broken? Somebody check." } },
      { by: 'b', say: "That one. The spring's sticking out." },
      { by: 'c', say: "So who gets the floor?", v: { dry: "Great, a trailer. Very glamorous, very Hollywood." } },
      { by: 'a', say: "Whoever loses the next challenge, obviously.", v: { bossy: "We'll rotate, and I'll make a schedule. I'm going first, but there'll be a schedule." } },
      { by: 'd', say: "That's not how that works." },
      { by: 'a', say: "It is now." },
      { by: 'c', conf: "I thought being on a movie lot would be fun. It's mostly sharing a trailer with {a}." },
    ] },
    { id: 'fd.w1', place: 'public', when: { venue: 'world-tour' }, turns: [
      { beat: "The {tribe} find their seats in economy. The seats don't recline. One doesn't have a seatbelt." },
      { by: 'b', say: "Is this a real plane? Like, is it safe?", v: { anxious: "I'd like to go on record that I don't think this plane is safe." } },
      { by: 'a', say: "Probably. Mostly.", v: { calm: "It's fine, it's flown before. Probably." } },
      { by: 'c', say: "Who wants the window?" },
      { by: 'd', say: "Me. I'll be looking at the ground the whole time, hoping we don't hit it." },
      { by: 'a', say: "Okay, so we're all getting along. That's good." },
      { by: 'b', say: "We've been on the plane four minutes." },
      { by: 'd', conf: "Day one and I'm stuck in a middle seat between {a} and {c}. I'm going to know them very, very well by the end of this." },
    ] },
    { id: 'fd.s1', place: 'public', when: { venue: 'survival-island' }, turns: [
      { beat: "The {tribe} drop their bags on the beach. There's no shelter. There's a pot, a machete and a lot of trees." },
      { by: 'a', say: "Okay, we need a shelter before it gets dark, so who's done this before?",
        v: { bossy: "Okay, listen, it's shelter first, then fire, then water, so everybody take one, and I'll watch.", tough: "Somebody give me that machete." } },
      { by: 'c', say: "Done what? Lived on a beach?" },
      { by: 'b', say: "I've been camping. Once.", v: { nerdy: "I've read about this. You want a frame first, then you lay the leaves on top, overlapping, like shingles." } },
      { by: 'd', say: "That's more than me." },
      { by: 'a', say: "Great, so {b}'s in charge of the shelter, and I'll get wood." },
      { by: 'b', say: "Wait, when did I agree to that?" },
      { by: 'c', conf: "Day one and we're already arguing about sticks. If this is how it starts, I don't want to see how it ends." },
    ] },
    { id: 'fd.k1', place: 'sleep', when: { venue: 'carnival' }, turns: [
      { beat: "The {tribe} reach their campsite. There's a tent, still in its bag, and no instructions." },
      { by: 'a', say: "Okay. Who knows how to put up a tent?", v: { anxious: "Does anybody know how to put up a tent? Because I don't, at all.", bossy: "Okay, who's done a tent before? Step up." } },
      { by: 'b', say: "How hard can it be?", v: { dry: "It's a tent, people have been doing this for thousands of years, so how hard can it be?" } },
      { beat: "Twenty minutes later, the tent is up. Sort of. It leans." },
      { by: 'c', say: "Is it supposed to lean like that?" },
      { by: 'd', say: "It's leaning because somebody put that pole in upside down." },
      { by: 'b', say: "Somebody? You mean me, you can just say me." },
      { by: 'a', conf: "I don't know anybody on this team yet, but I already know who can't put up a tent.", v: { warm: "I don't really know anybody yet, but they're all trying, and that's sweet.", dry: "I don't know anybody here yet, but I already know who's useless with a tent." } },
    ] },
    { id: 'fd.g1', place: 'public', when: { fourth: true }, turns: [
      { beat: "The {tribe}'s first afternoon together. Everybody's being a little too polite." },
      { by: 'a', say: "Okay, so what does everybody do? Like, back home?", v: { warm: "So what does everybody do back home? I want to know everybody!", teen: "Okay, so what do you guys do? Like, are you all in school or what?", grown: "So what does everybody do for a living? I'm curious." } },
      { by: 'b', say: "Does it matter?", v: { warm: "Oh, I love this. Okay, you first.", dry: "I'm going to lie, so it doesn't really matter." } },
      { by: 'a', say: "It's called getting to know each other." },
      { by: 'c', say: "Honestly? Nothing that interesting.", v: { goofy: "I'm a professional napper. It's unpaid, but it's my passion.", nerdy: "Ask me something specific. I know a lot of facts about a lot of things." } },
      { by: 'd', say: "Cool. I'm still figuring it out.", v: { tough: "I don't really do the sharing thing.", flirty: "I'll tell you later. Just you." } },
      { by: 'a', say: "See? That wasn't so bad." },
      { by: 'b', conf: "{a} is trying really hard to be the team mom. I give it two days before everybody's sick of it.",
        v: { warm: "I already like {c}, and {d} is harder to read, but that's fine, it's day one." } },
    ] },
    { id: 'fd.g2', place: 'fire', when: { fourth: true }, turns: [
      { beat: "The first night. The {tribe} sit around the fire, still mostly strangers." },
      { by: 'c', say: "So what's everyone's game plan?", v: { schemer: "So, just out of curiosity, what's everybody's game plan?", loud: "Okay, game plans, everybody, go!", dry: "So, what's everyone's brilliant game plan?" } },
      { by: 'd', say: "We've been here like eight hours." },
      { by: 'c', say: "So? Some people have a plan the second they get off the boat." },
      { by: 'a', say: "My plan is to not go home first.", v: { schemer: "My plan is to be really nice to everybody until I know who I don't need.", earnest: "My plan is just to be myself and see what happens." } },
      { by: 'b', say: "That's not a plan, that's a hope." },
      { by: 'a', say: "Fine. What's yours?" },
      { by: 'b', say: "Not telling you on day one." },
      { by: 'd', conf: "Nobody here trusts anybody yet, which is smart, because I don't trust any of them either.", v: { warm: "Nobody trusts each other yet, which makes sense, but I really hope that changes.", anxious: "Nobody trusts anybody here, and honestly it's kind of making me nervous." } },
    ] },
  ],

  'story.firstday.swap': [
    { id: 'fd.sw1', place: 'public', turns: [
      { beat: "The new {tribe} stand around their camp. Half of them have never lived together." },
      { by: 'a', say: "So. This is weird.", v: { dry: "So, this is weird and I hate it.", anxious: "So, um, this is really weird, right?", loud: "Okay, this is SO weird!" } },
      { by: 'b', say: "Yeah. Yesterday you were the enemy.", v: { dry: "Welcome to the team. We have a pot and a lot of opinions." } },
      { by: 'a', say: "I'm still the enemy. I'm just the enemy who sleeps here now." },
      { by: 'c', say: "Can we not do this? We're a team now, like it or not." },
      { by: 'd', say: "I don't like it." },
      { by: 'b', conf: "The new people are going to stick together. They'd be stupid not to. So we have to stick together harder." },
      { by: 'a', conf: "I'm outnumbered on a team that doesn't trust me, so great, I have to make friends fast." },
    ] },
    { id: 'fd.sw2', place: 'sleep', turns: [
      { beat: "{a} drops a bag on an empty {bed}. Everyone already there watches." },
      { by: 'a', say: "Is this one taken?", v: { anxious: "Sorry, is this one taken? I can sit somewhere else.", tough: "This one taken? No? Good." } },
      { by: 'c', say: "It was my friend's. Before the swap.", v: { warm: "No, go ahead. Sorry, we're just still getting used to it." } },
      { by: 'a', say: "Oh. Sorry." },
      { by: 'b', say: "It's fine. Take it." },
      { by: 'a', conf: "Walking into somebody else's camp is the worst. They all have inside jokes, and they all know who they're voting for. And it's probably me." },
    ] },
  ],

  'story.firstday.history.siblings': [
    { id: 'fd.h1', place: 'public', turns: [
      { beat: "The {tribe} are doing introductions when {a} spots who else is on the team." },
      { by: 'a', say: "Oh, you have got to be kidding me.", v: { loud: "Oh, you have GOT to be kidding me!", dry: "Oh, wonderful, just wonderful.", warm: "Oh my gosh, no way!" } },
      { by: 'b', say: "Hi to you too." },
      { by: 'c', say: "Wait, do you two know each other?" },
      { by: 'a', say: "Yeah. That's my {kinWord}." },
      { by: 'd', say: "Oh, that's not good. For the rest of us, I mean." },
      { by: 'b', say: "Relax. We're not a team inside the team.", v: { schemer: "Relax. We fight way too much to work together." } },
      { by: 'a', say: "Speak for yourself." },
      { by: 'c', conf: "Two of them are family. On day one. That's two votes that go the same way, and everybody here just found out." },
      { by: 'a', conf: "I love my {kinWord}. I do. I just didn't come all the way out here to be somebody's {kinWord} again." },
    ] },
  ],
  'story.firstday.history.family': [
    { id: 'fd.h2', place: 'public', turns: [
      { by: 'c', say: "Hold on. You two came together?" },
      { by: 'a', say: "We're family. Yeah." },
      { by: 'd', say: "Nobody told us that." },
      { by: 'b', say: "We just told you that." },
      { by: 'd', say: "Before. Nobody told us before." },
      { by: 'a', say: "Look, we're both here to win. It's not like we're going to vote together every time." },
      { by: 'd', conf: "\"Not every time.\" So most of the time. Great." },
    ] },
  ],
  'story.firstday.history.cousins': [
    { id: 'fd.h3', place: 'public', turns: [
      { by: 'b', say: "{a}? What are you doing here?" },
      { by: 'a', say: "Same thing as you, apparently." },
      { by: 'c', say: "You know each other?" },
      { by: 'a', say: "Cousins. We don't really see each other much." },
      { by: 'b', say: "And now all summer." },
      { by: 'a', say: "And now all summer." },
      { by: 'c', conf: "They say they're not close. They also showed up on the same team. I'm keeping an eye on that." },
    ] },
  ],
  'story.firstday.history.couple': [
    { id: 'fd.h4', place: 'public', turns: [
      { beat: "The {tribe} are barely off the dock when {a} and {b} grab each other's hand without thinking." },
      { by: 'c', say: "Um. Are you two together?" },
      { by: 'b', say: "...Maybe." },
      { by: 'a', say: "Yes. {b}'s my {kinWord}." },
      { by: 'd', say: "Oh, come on. They put a couple on our team?" },
      { by: 'a', say: "We're not going to play as a couple." },
      { by: 'd', say: "You're holding hands right now." },
      { by: 'a', say: "...That's just habit." },
      { by: 'd', conf: "A couple. On day one. Everybody knows what you do with a couple in this game. I just hope it's not me who has to do it." },
      { by: 'b', conf: "We had a plan to keep it secret. That plan lasted about forty seconds." },
    ] },
  ],
  'story.firstday.history.friends': [
    { id: 'fd.h5', place: 'public', turns: [
      { by: 'a', say: "Okay, before anyone says anything, yes, {b} and I know each other." },
      { by: 'c', say: "Since when?" },
      { by: 'b', say: "Since forever. We're friends from before all this." },
      { by: 'd', say: "So you're basically an alliance already." },
      { by: 'a', say: "We're friends. It's different." },
      { by: 'd', say: "Is it, though?" },
      { by: 'b', conf: "Everybody's looking at me and {a} like we're a problem. We've been on this team for ten minutes." },
    ] },
  ],
  'story.firstday.history.knew': [
    { id: 'fd.h6', place: 'public', turns: [
      { by: 'b', say: "Wait. {a}?" },
      { by: 'a', say: "Oh, hey! Small world." },
      { by: 'c', say: "You know each other?" },
      { by: 'a', say: "Sort of. We used to see each other around, but not, like, friends." },
      { by: 'b', say: "Not, like, not friends either." },
      { by: 'c', conf: "They say they barely know each other. People always say that." },
    ] },
  ],
  'story.firstday.history.exes': [
    { id: 'fd.h7', place: 'public', turns: [
      { beat: "{a} sees {b} on the same team and stops walking." },
      { by: 'b', say: "Don't." },
      { by: 'a', say: "I didn't say anything." },
      { by: 'b', say: "You were going to." },
      { by: 'c', say: "Okay, what's going on here?" },
      { by: 'a', say: "{b}'s my ex.", v: { dry: "Nothing, just my ex on my team on TV. Totally normal day." } },
      { by: 'd', say: "Oh no." },
      { by: 'c', say: "Oh, this is going to be fun." },
      { by: 'b', conf: "Out of everybody who could be on my team, it's {a}. Out of everybody." },
      { by: 'a', conf: "It ended badly, and everybody's going to find out how badly, I just hope it's not this week." },
    ] },
  ],
  'story.firstday.history.estranged': [
    { id: 'fd.h8', place: 'public', turns: [
      { by: 'a', say: "You're here." },
      { by: 'b', say: "So are you." },
      { by: 'c', say: "Do you two... know each other?" },
      { by: 'a', say: "We're family. We don't talk." },
      { by: 'd', say: "Well, you're going to have to now." },
      { by: 'a', conf: "I haven't spoken to {b} in a long time. I didn't plan on starting on television." },
    ] },
  ],
  'story.firstday.history.exfriends': [
    { id: 'fd.h9', place: 'public', turns: [
      { by: 'b', say: "Of course you're here. Of course." },
      { by: 'a', say: "Nice to see you too." },
      { by: 'c', say: "History?" },
      { by: 'a', say: "We used to be best friends." },
      { by: 'b', say: "Used to." },
      { by: 'c', conf: "Two people who used to be best friends, on the same team. Somebody's going to get hurt." },
    ] },
  ],
  'story.firstday.history.wronged': [
    { id: 'fd.r1', place: 'public', turns: [
      { beat: "{a} spots {b} and goes very still." },
      { by: 'a', say: "Wow. You, again." },
      { by: 'b', say: "Hey, {a}. Long time." },
      { by: 'a', say: "Not long enough. You remember what you did to me on {where}, right?" },
      { by: 'b', say: "It was a game move." },
      { by: 'a', say: "It was my game you moved." },
      { by: 'c', say: "Okay, I want to hear this story." },
      { by: 'a', conf: "Last time, {b} smiled at me all day and wrote my name that night. I'm not getting fooled twice." },
      { by: 'b', conf: "{a} is still mad about {where}, and that's fine, because mad people are predictable." },
    ] },
  ],
  'story.firstday.history.wronger': [
    { id: 'fd.r2', place: 'public', turns: [
      { by: 'a', say: "Oh. Hey, {b}." },
      { by: 'b', say: "Don't \"hey\" me." },
      { by: 'a', say: "Still not over {where}, huh?" },
      { by: 'b', say: "You voted me out. With a smile." },
      { by: 'a', say: "I'd do it again. But I'd smile less." },
      { by: 'd', say: "Wow, okay, this team's off to a great start." },
      { by: 'a', conf: "{b} is never going to trust me. That's okay. I just need {b} to hate me less than {b} hates everyone else." },
    ] },
  ],
  'story.firstday.history.oldflame': [
    { id: 'fd.r3', place: 'public', turns: [
      { by: 'a', say: "Hi." },
      { by: 'b', say: "Hi." },
      { beat: "Nobody says anything for a second. Everybody else notices." },
      { by: 'c', say: "Okay, what was that?" },
      { by: 'a', say: "Nothing, we were a thing on {where}, and it didn't end well." },
      { by: 'b', say: "That's one way to put it." },
      { by: 'b', conf: "I thought I was over {a}. Then {a} said hi, and I'm apparently not." },
    ] },
  ],
  'story.firstday.history.oldcouple': [
    { id: 'fd.r4', place: 'public', turns: [
      { by: 'a', say: "Look who it is!" },
      { by: 'b', say: "Oh my gosh, hi!" },
      { beat: "They hug for a long time. The rest of the {tribe} watch." },
      { by: 'c', say: "So you two are...?" },
      { by: 'a', say: "We met on {where}. We're still together." },
      { by: 'd', say: "And you're on the same team. Great, love that for us." },
      { by: 'd', conf: "A couple who already did this once, together, on my team. Everybody knows how that ends. With one of them going home." },
    ] },
  ],
  'story.firstday.history.oldrivals': [
    { id: 'fd.r5', place: 'public', turns: [
      { by: 'a', say: "No. No way." },
      { by: 'b', say: "Yep. Me again." },
      { by: 'a', say: "They put you on my team? On purpose?" },
      { by: 'b', say: "I guess somebody thought it'd be funny." },
      { by: 'c', say: "You two know each other?" },
      { by: 'a', say: "From {where}. We couldn't stand each other." },
      { by: 'b', say: "Still can't." },
      { by: 'c', conf: "Day one, and two people on my team already hate each other. At least I know where not to sit." },
    ] },
  ],
  'story.firstday.history.oldallies': [
    { id: 'fd.r6', place: 'public', turns: [
      { by: 'a', say: "{b}! Get over here!" },
      { by: 'b', say: "I can't believe they put us together again." },
      { by: 'c', say: "Again?" },
      { by: 'a', say: "We were a team on {where}. Got pretty far, too." },
      { by: 'd', say: "So that's two people who already trust each other. Awesome, for you." },
      { by: 'b', conf: "Being on {a}'s team again is great. Everybody else knowing it is less great." },
    ] },
  ],

};

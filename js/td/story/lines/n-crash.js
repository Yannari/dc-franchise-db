// ══════════════════════════════════════════════════════════════════════
// td/story/lines/n-crash.js — the crashout, answered
// ══════════════════════════════════════════════════════════════════════
// td/story/tribal.js writeCrashReplies (header there). a is going home and has just said the line;
// b is who it named; c (and d) the room; h the host, who ends it. bVoted: 'boot' when b wrote a's
// name. Each scene escalates before the host steps in. Ids: 'ncr.'.

export default {
  // a named b as the one behind tonight, and b really ran it
  'crash.callout.right': [
    { id: 'ncr.r1', turns: [
      { by: 'b', say: "Yeah, it was me, and if you want an apology, you're not getting one.", v: { warm: "Yeah, it was me, and I'm sorry it had to be you. I really am.", anxious: "Okay, yes, it was me, but can we please not do this right now?", schemer: "Of course it was me. Who else here could have pulled it off?" } },
      { by: 'a', say: "You smiled at me at breakfast!" },
      { by: 'b', say: "I smile at everybody at breakfast. That's called manners." },
      { by: 'c', say: "Oh my gosh.", opt: true },
      { by: 'a', say: "You're going to lose this game, {b}. Everybody here just heard what you are." },
      { by: 'h', say: "Okay! As much as I am loving this, and I am loving this, {a}, it's time to go." },
    ] },
    { id: 'ncr.r2', turns: [
      { by: 'b', say: "You want to do this in front of everybody? Fine. You were never going to win, and everybody knew it but you.", v: { cruel: "You want to do this here? Okay, then nobody's going to miss you, and there, I said it.", warm: "I'm not going to fight with you on your way out. I'm sorry, okay?" } },
      { by: 'a', say: "Say that again." },
      { by: 'b', say: "I said what I said." },
      { by: 'a', say: "At least I didn't have to lie to every single person here to get this far." },
      { beat: "Half the fire turns to look at {b}." },
      { by: 'h', say: "Ooh, okay, I'm going to need a minute to process all of that. {a}, you need a minute to leave." },
    ] },
    { id: 'ncr.r3', when: { voice: ['calm', 'dry', 'schemer'] }, turns: [
      { by: 'b', say: "Are you finished?" },
      { by: 'a', say: "No, I'm not finished! You did this!" },
      { by: 'b', say: "I did. And you'd have done it to me if you'd thought of it first." },
      { by: 'a', say: "I would never have done this to you." },
      { by: 'b', say: "That's exactly why you're the one leaving." },
      { by: 'c', say: "That's cold. That's so cold.", opt: true },
      { by: 'h', say: "And on that very chilly note, {a}, grab your stuff." },
    ] },
    { id: 'ncr.r4', when: { voice: ['loud', 'tough', 'competitive'] }, turns: [
      { by: 'b', say: "Oh, don't you dare make this about me!", v: { tough: "Don't you point at me. You did this to yourself." } },
      { by: 'a', say: "It IS about you! It's always been about you!" },
      { by: 'b', say: "Then maybe you should've tried winning something!" },
      { by: 'a', say: "Maybe YOU should try telling the truth for once in your life!" },
      { beat: "Both of them are on their feet now. Nobody else moves." },
      { by: 'h', say: "Whoa, whoa, whoa, sit down! {a}, you're done, and everybody else, stay in your seats." },
    ] },
  ],
  // a named b, who wrote a's name, but {real} ran it (when real)
  'crash.callout.part': [
    { id: 'ncr.p1', turns: [
      { by: 'b', say: "Don't put this all on me. I wasn't the one running it." },
      { by: 'a', say: "Then who was?" },
      { beat: "{b} doesn't answer. {b} doesn't have to. {b}'s eyes go to {real} for half a second." },
      { by: 'a', say: "{real}? Are you seriously telling me it was {real}?" },
      { by: 'h', say: "Oh, this is going to make for a very fun morning at camp. {a}, it's time to go." },
    ] },
    { id: 'ncr.p2', turns: [
      { by: 'b', say: "Yeah, I wrote your name, but so did everybody else. I'm not special." },
      { by: 'a', say: "You're the one I trusted." },
      { by: 'b', say: "And I'm sorry about that part. I really am." },
      { by: 'a', say: "Sorry doesn't change anything." },
      { by: 'c', say: "Can we not do this right now?", opt: true },
      { by: 'h', say: "Actually, I'd love it if you did this right now, but rules are rules. {a}, let's go." },
    ] },
    { id: 'ncr.p3', when: { voice: ['schemer', 'calm', 'dry'] }, turns: [
      { by: 'b', say: "Give me a little more credit. I just went with the numbers." },
      { by: 'a', say: "So you're saying somebody else did all the work?" },
      { by: 'b', say: "I'm saying you're yelling at the wrong person." },
      { beat: "Across the fire, {real} is suddenly very interested in the flames." },
      { by: 'h', say: "Well, that's a mystery for another day. {a}, you've got a boat to catch." },
    ] },
  ],
  // a named b, but b never even wrote a's name
  'crash.callout.wrong': [
    { id: 'ncr.w1', turns: [
      { by: 'b', say: "Me? I didn't even vote for you!", v: { loud: "ME?! I didn't even WRITE your name!", anxious: "Me? No, no, no, I voted for somebody else, I swear!" } },
      { by: 'a', say: "Oh, come on." },
      { by: 'b', say: "I'm serious! Check the votes when they show them!" },
      { by: 'a', say: "Then who did this?" },
      { beat: "Nobody says a word." },
      { by: 'h', say: "And that silence is going to keep me warm all night. {a}, it's time to go." },
    ] },
    { id: 'ncr.w2', when: { real: true }, turns: [
      { by: 'b', say: "You've got the wrong person. I wasn't even on that vote." },
      { by: 'a', say: "You expect me to believe that?" },
      { by: 'b', say: "I don't care what you believe. Ask the people who actually wrote your name." },
      { beat: "{real} looks straight ahead and doesn't blink." },
      { by: 'c', say: "This is so awkward.", opt: true },
      { by: 'h', say: "Awkward is my favourite flavour. {a}, the dock of shame awaits." },
    ] },
    { id: 'ncr.w3', when: { voice: ['warm', 'earnest', 'emotional'] }, turns: [
      { by: 'b', say: "{a}, I didn't write your name. I promise you I didn't." },
      { by: 'a', say: "Then why does it feel like you did?" },
      { by: 'b', say: "Because you're hurt, and I'm the closest one. I get it." },
      { by: 'a', say: "...I'm sorry. I just don't know who to be mad at." },
      { by: 'h', say: "Aw, that was almost touching. {a}, it's time to go." },
    ] },
  ],
  // a outed b's alliance; c is in it too; d is not
  'crash.alliance.any': [
    { id: 'ncr.a1', turns: [
      { by: 'b', say: "Are you serious right now?", v: { loud: "Are you SERIOUS right now?!", calm: "That's a very interesting thing to say on your way out the door." } },
      { by: 'd', say: "Wait. Is that true?", opt: true },
      { by: 'c', say: "Don't listen to {a}. {a} is just bitter.", opt: true },
      { by: 'a', say: "Bitter? I'm the only one here who's finally telling the truth.", when: { third: true } },
      { by: 'a', say: "Go on, ask any of them. Watch their faces when you do.", when: { third: false } },
      { by: 'd', say: "I'm going to need everybody to stop talking to me tomorrow, I need to think.", opt: true },
      { by: 'h', say: "This is the best thing that's happened all season. {a}, thank you for your service, and goodbye." },
    ] },
    { id: 'ncr.a2', turns: [
      { beat: "{b} goes pale. {c} stares at the ground." },
      { by: 'b', say: "That's not... that's not what it is.", v: { tough: "That's a lie and you know it.", schemer: "Cute story. Is that everything?" } },
      { by: 'a', say: "Then what is it, {b}? Go on, tell everybody." },
      { by: 'd', say: "Yeah, {b}. Go on.", opt: true },
      { beat: "{b} opens {b.posAdj} mouth, then closes it again." },
      { by: 'h', say: "Oh, the camera got that, the camera definitely got that. {a}, it's time to go." },
    ] },
    { id: 'ncr.a3', turns: [
      { by: 'c', say: "Thanks a lot, {a}. Really mature.", opt: true },
      { by: 'a', say: "You voted me out! What did you think was going to happen?" },
      { by: 'b', say: "We thought you'd leave with a little dignity." },
      { by: 'a', say: "Dignity? From the people who lied to me for a week?" },
      { by: 'd', say: "A week? It's been going on for a week?", opt: true },
      { by: 'h', say: "Okay, I'm cutting this off before somebody throws a coconut. {a}, go." },
    ] },
  ],
  // a said b has an advantage; c is watching b
  'crash.idol.any': [
    { id: 'ncr.i1', turns: [
      { by: 'b', say: "I don't know what you're talking about.", v: { schemer: "That's a fun theory. Do you have any more?", anxious: "What? No, I don't have anything, I swear." } },
      { by: 'a', say: "Check {b}'s bag. Go on, check it." },
      { beat: "{c} looks at {b}'s bag. {b} moves it behind {b.posAdj} feet." },
      { by: 'b', say: "Stop looking at my bag." },
      { by: 'h', say: "Ooh, the plot thickens. {a}, your part of the plot is over, so let's go." },
    ] },
    { id: 'ncr.i2', turns: [
      { by: 'b', say: "Wow, okay, so we're throwing grenades on the way out." },
      { by: 'a', say: "It's not a grenade if it's true." },
      { by: 'c', say: "Is it true?", opt: true },
      { by: 'b', say: "I'm not answering that." },
      { by: 'c', say: "That's a yes.", opt: true },
      { by: 'h', say: "I love this game. {a}, you don't get to love it anymore, so it's time to go." },
    ] },
  ],
  // a's parting shot at the room; b is a's closest, c anyone
  'crash.exit.any': [
    { id: 'ncr.e1', turns: [
      { by: 'c', say: "Okay, bye!", v: { cruel: "Bye! Don't trip on the way out.", warm: "Take care of yourself, okay?" } },
      { by: 'a', say: "I'm serious. You're all going to remember tonight." },
      { by: 'b', say: "{a}, come on, don't go out like this.", when: { bVoted: 'other' } },
      { by: 'a', say: "Like what? Honest?" },
      { by: 'h', say: "Honest and loud, my two favourite things. {a}, it's time to go." },
    ] },
    { id: 'ncr.e2', turns: [
      { beat: "Nobody answers. A log in the fire cracks, and three people jump." },
      { by: 'b', say: "We're going to miss you, you know. Even like this.", when: { bLikesA: true } },
      { by: 'a', say: "Some of you will." },
      { by: 'c', say: "Some of us won't.", opt: true },
      { by: 'h', say: "And that's why we do this at night, because it's more dramatic. {a}, go." },
    ] },
  ],
};

// ══════════════════════════════════════════════════════════════════════
// td/story/lines/n-twist2.js — the journey, a returning player, a swap's goodbyes, the wager
// ══════════════════════════════════════════════════════════════════════
//
// td/story/twist.js, from what the engine decided:
//   twist.journey.meet.<any|deal>   the travellers (a, b, and c) meet; 'deal': they agree to keep
//                                   each other safe (the engine's mutual deal)
//   twist.journey.result.<safe|deal|advantage|lostvote>  a, to camera, on what the journey did
//   twist.return.arrive.<any|foe>   a comes back into the game; b is the closest person still in
//                                   it; 'foe': c wrote a's name the night a went home
//   twist.swap.split.any            a and b, close, are on different teams now ({mine}, {theirs})
//   twist.wager.<declined|won|lost> a, holding an idol, on the wager
// Ids: 'ni.'.

export default {
  'twist.journey.meet.any': [
    { id: 'ni.j1', turns: [
      { beat: "{a} and {b} are dropped off somewhere far from both camps." },
      { by: 'a', say: "Hi. So it's you and me, then.", v: { theatrical: "Hello, darling! Looks like it's the two of us.", loud: "Hey! It's you! Okay, this could be fun!" } },
      { by: 'b', say: "So what do you think this is?" },
      { by: 'a', say: "Something good, or something really bad." },
      { by: 'c', say: "Can we not say 'really bad' out loud? I'm nervous enough.", opt: true },
      { by: 'b', say: "Whatever it is, we're not telling our teams the whole story." },
      { by: 'a', say: "Agreed. What happens out here stays out here." },
      { by: 'b', conf: "{a} seems all right. Seeming all right is the most dangerous thing you can do here." },
    ] },
    { id: 'ni.j2', turns: [
      { by: 'b', say: "Did they tell you anything?" },
      { by: 'a', say: "Just to walk. So I walked." },
      { by: 'c', say: "My feet hurt, and nobody has told us a single thing. Great start.", opt: true },
      { by: 'b', say: "If this is a trick, I'm going to be so mad." },
      { by: 'a', say: "If it's a trick, at least we'll be mad together. That's basically bonding." },
    ] },
  ],
  'twist.journey.meet.deal': [
    { id: 'ni.jd1', turns: [
      { by: 'a', say: "Okay, what if we both just pick the safe option, so neither of us loses anything?" },
      { by: 'b', say: "Why would you offer that? What do you get out of it?" },
      { by: 'a', say: "I'm serious, we both go back safe and nobody risks a thing." },
      { by: 'c', say: "I'm in. Nobody loses anything, and nobody has to explain anything back at camp.", opt: true },
      { by: 'b', say: "...Fine. Safe. Both of us." },
      { by: 'b', conf: "We made a deal on the journey. Neither of us went for anything. Now I owe {a}, and {a} owes me." },
    ] },
  ],
  'twist.journey.result.safe': [
    { id: 'ni.r1', turns: [{ by: 'a', conf: "I came back with nothing, no advantage and nothing lost, and honestly? Nothing is fine." }] },
    { id: 'ni.r2', turns: [{ by: 'a', conf: "I played it safe on the journey. Some people will call that boring. I call it still being here." }] },
  ],
  'twist.journey.result.deal': [
    { id: 'ni.r3', turns: [{ by: 'a', conf: "We made a deal out there. We both played safe. That's a promise I'm going to remember at the merge." }] },
  ],
  'twist.journey.result.advantage': [
    { id: 'ni.r4', turns: [{ by: 'a', conf: "I came back with an advantage, and nobody at camp gets to know that, nobody." }] },
    { id: 'ni.r5', when: { voice: ['loud', 'theatrical', 'proud', 'competitive'] }, turns: [{ by: 'a', conf: "I took the risk and it paid off, and I want to scream, but I'm going to whisper instead." }] },
  ],
  'twist.journey.result.lostvote': [
    { id: 'ni.r6', turns: [{ by: 'a', conf: "I lost my vote, my actual vote, on a journey I didn't even ask to go on." }, { by: 'a', conf: "I want to scream, and I can't even do that, because then everybody would know." }] },
    { id: 'ni.r7', when: { voice: ['anxious', 'emotional', 'warm'] }, turns: [{ by: 'a', conf: "I gambled and I lost my vote. If they come for me now, I can't even vote back." }, { by: 'a', conf: "Now I just have to hope nobody finds out. Please, nobody find out." }] },
  ],

  'twist.return.arrive.any': [
    { id: 'ni.a1', turns: [
      { beat: "{a} walks back into camp. Everyone stops what they're doing." },
      { by: 'b', say: "No way! {a}!", v: { loud: "{a}!! NO WAY!", calm: "Well. Look who it is.", dry: "Oh, good. I was running out of people to talk to." } },
      { by: 'a', say: "Miss me?" },
      { by: 'b', say: "You have no idea." },
      { by: 'a', conf: "I got a second chance. I'm not wasting it on being nice to the people who sent me home." },
    ] },
    { id: 'ni.a2', turns: [
      { by: 'b', say: "No way. You're back?" },
      { by: 'a', say: "I'm back." },
      { by: 'b', say: "Good. It wasn't the same without you here." },
      { by: 'a', say: "Thanks. That actually means a lot right now." },
      { by: 'b', conf: "{a} coming back changes everything. Everyone who voted {a} out is about to get very nervous." },
    ] },
  ],
  'twist.return.arrive.foe': [
    { id: 'ni.af1', turns: [
      { beat: "{a} walks back into camp. {c} sees {a} first and goes very still." },
      { by: 'a', say: "Hi, {c}. Remember me?" },
      { by: 'c', say: "{a}! Wow. Hi. Welcome back. Big day." },
      { by: 'a', say: "It is. Enjoy the rest of it.", v: { cruel: "It is. For one of us.", warm: "It is. We should talk later. Properly." } },
      { by: 'b', say: "{a}! Get over here!" },
      { by: 'a', conf: "{c} wrote my name. {c} thought I was gone for good. I'm going to enjoy every second of this." },
    ] },
    { id: 'ni.af2', turns: [
      { by: 'b', say: "{a}! You're back!" },
      { by: 'a', say: "I'm back. And I've had a lot of time to think." },
      { by: 'c', say: "Welcome back. No hard feelings, right?" },
      { by: 'a', say: "Hard feelings? No. Just a very good memory." },
      { by: 'c', conf: "{a} looked at me like I was dinner. I need to fix this before tonight. Or I'm next." },
    ] },
  ],

  'twist.swap.split.any': [
    { id: 'ni.s1', turns: [
      { beat: "The new teams are called. {a} is on the {mine} now. {b} is on the {theirs}." },
      { by: 'a', say: "No. No, they can't split us up." },
      { by: 'b', say: "Hey. Look at me. You're going to be fine over there." },
      { by: 'a', say: "Don't you dare get voted out before I see you again." },
      { by: 'b', say: "We'll find each other at the merge." },
      { by: 'a', conf: "{b} is the only person here I trust completely. Now {b} is on the other team. I'm on my own." },
    ] },
    { id: 'ni.s2', turns: [
      { by: 'b', say: "Well. That's not good." },
      { by: 'a', say: "It's terrible. Who do I even talk to over there?" },
      { by: 'b', say: "Make friends fast, and don't trust any of them." },
      { by: 'a', say: "Make friends, trust nobody. Okay. I can do that. I think." },
      { by: 'b', conf: "{a} and I had a plan. The plan just got split down the middle." },
    ] },
  ],

  'twist.wager.declined': [
    { id: 'ni.w1', turns: [{ by: 'a', conf: "Bet my idol on a challenge? No thank you, I'm keeping what I've got." }] },
    { id: 'ni.w2', when: { voice: ['loud', 'competitive', 'proud'] }, turns: [{ by: 'a', conf: "I wanted to take it. I really did. But an idol in my pocket is worth more than a maybe." }] },
  ],
  'twist.wager.won': [
    { id: 'ni.w3', turns: [{ by: 'a', conf: "I bet my idol and I won. It's stronger now. Somebody is going to have a very bad night." }, { by: 'a', conf: "I want to tell everybody, and I can't tell anybody. Best feeling in the world." }] },
  ],
  'twist.wager.lost': [
    { id: 'ni.w4', turns: [{ by: 'a', conf: "I bet my idol and I lost it. I actually lost my idol." }, { by: 'a', conf: "I keep checking my pocket like it's going to be there. It isn't." }] },
  ],
};

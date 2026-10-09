// ══════════════════════════════════════════════════════════════════════
// td/story/lines/voices/batch3.js — the voice overhaul, batch 3
// ══════════════════════════════════════════════════════════════════════
// { entryId: { turnIndex: { tag: line } } }. Same meaning and facts as the line it varies.
// Voice-gated entries (when: { voice }) get variants for the tags that sit beside the gate.

export default {
  // thr.debt.1: thanking b for a warning
  'nth.d1': {
    0: { quiet: "I never said thank you for warning me. So, thank you.", theatrical: "I never properly thanked you for warning me, and I've been feeling terrible about it, so thank you.", kid: "I never said thank you for warning me. Thank you, really.", tough: "Look, I never said thanks for the warning, so thanks." },
    1: { warm: "You'd have done the same for me, I know you would.", dry: "You'd have done the same, probably. Let's go with probably.", kid: "You would've done it for me too." },
    3: { cruel: "Well, now you owe me one, and I'll be collecting.", schemer: "Then you owe me one. I'll let you know when.", warm: "You don't owe me anything. Okay, maybe a little.", goofy: "Now you owe me one. I accept payment in snacks." },
    5: { quiet: "{a} owes me now. I didn't do it for that, but I'll take it.", cruel: "{a} owes me now, and I'll make sure {a} remembers that.", warm: "I didn't warn {a} to get anything back. I just didn't want {a} to get hurt.", kid: "{a} says {a} owes me one now. That's kind of cool." },
  },
  // vt2.decoy (bossy, thinks they're coming)
  'ncx.d5': {
    1: { quiet: "Do we actually know they're coming for you?", warm: "Hey, slow down. Do we actually know they're coming for you?", dry: "Do we know they're coming for you, or do we just feel it very strongly?" },
    3: { quiet: "That's not knowing.", tough: "That's not knowing. That's guessing.", kid: "That's not the same as knowing." },
    5: { quiet: "{a} is sure it's {a} tonight, from a feeling. I didn't argue.", warm: "{a} is so sure it's {a} tonight, and I didn't have the heart to argue with how scared {a} looked.", cruel: "{a} is convinced, based on absolutely nothing. I'm not going to be the one who explains that." },
  },
  // long.friend.laugh.any: an impression of the host
  'ny.l1': {
    1: { quiet: "Okay, who's this? \"Campers, today's challenge is EXTREMELY dangerous!\"", theatrical: "Ladies and gentlemen, who am I? \"Campers, today's challenge is EXTREMELY dangerous!\"", kid: "Guess who I am! \"Campers, today's challenge is EXTREMELY dangerous!\"" },
    2: { dry: "Oh no, that's {host}. That's exactly {host}.", kid: "That's {host}! That's so {host}!", quiet: "That's {host}. Oh my god." },
    4: { theatrical: "I am not doing the hair thing. The hair thing is for special occasions only.", tough: "No. I'm not doing the hair thing." },
  },
  // vp2.pair (schemer planning ahead for the partner)
  'nvq.p1': {
    2: { kid: "Not since, like, day two.", dry: "Not since day two. I'm not sure they can be apart." },
    4: { warm: "It's kind of cute, though. They really like each other.", cruel: "It's nauseating, honestly.", kid: "But they're so cute together." },
    8: { warm: "{partner} is going to be heartbroken. I hate that.", kid: "{partner} is going to be so sad.", dry: "{partner} is going to take this really, really well. That's a joke." },
  },
  // vt2.decoy (counting, not enough)
  'nvu.d1': {
    1: { warm: "Hey, you've been out here for an hour. Are you okay?", kid: "You've been sitting out here forever.", dry: "You've been out here for an hour. The rocks are starting to miss you." },
    2: { quiet: "I keep counting my votes, and it keeps coming out the same.", nerdy: "I've counted my votes six different ways, and every way gives me the same number.", theatrical: "I've counted my votes over and over, and the universe keeps giving me the same cruel number." },
    4: { quiet: "Not enough.", theatrical: "Not. Enough.", kid: "Not enough. It's not enough." },
    7: { warm: "Then let me go talk to people. You stay here and breathe, okay?", tough: "Then I'll go get you some. You stay here and stop looking like you're about to cry.", kid: "Okay, I'll go talk to people for you. Stay here." },
  },
  // deep.win: nobody clapped
  'ndp.w1': {
    0: { quiet: "I won, and nobody clapped. Not one person.", theatrical: "I actually won, and when I turned around, the silence was deafening. Not one single person clapped.", kid: "I won, and then nobody clapped. Not even one person clapped for me.", warm: "I won, and I turned around expecting hugs, and nobody was clapping. That really hurt." },
    1: { quiet: "I think they're scared of me now, and that's fine. I'll just keep winning.", kid: "I think they're scared of me now. I don't like it, but I'm going to keep winning anyway.", theatrical: "So I'm the one they're afraid of now. If that's my role, I'll play it beautifully." },
  },
  // arc.spark.pair (they do everything together)
  'nl5.p1': {
    1: { kid: "Good morning! We already got the water!", dry: "Morning. The water's done, and you're welcome.", flirty: "Morning! We already did the water together, obviously." },
    3: { quiet: "Both of you? Together?", dry: "Both of you, together, again.", kid: "You did it together? Again?" },
    5: { quiet: "Yeah. I've noticed.", dry: "Yeah, I'm noticing that. Everybody's noticing that.", cruel: "Oh, I've noticed. Trust me." },
    6: { quiet: "{b} and {c} do everything together. I'd bet they vote together too.", kid: "{b} and {c} are always together. They probably vote together too, which is kind of scary.", nerdy: "{b} and {c} do chores together, eat together, and very probably vote together. Two votes I can never split." },
  },
  // vp2.pair (two votes holding hands)
  'nvu.p1': {
    1: { quiet: "I can't watch that.", dry: "I can't watch that. It's like a commercial.", cruel: "I physically can't watch that." },
    2: { warm: "Aw, it's cute.", kid: "It's cute, though.", quiet: "It's sweet." },
    6: { warm: "{partner} is going to be so hurt, and I'm going to feel terrible.", kid: "{partner} is going to hate us forever.", quiet: "{partner} will hate us." },
    8: { quiet: "I didn't come here to break hearts. It turns out that's part of it.", warm: "I didn't come out here to break anybody's heart, and I really hate that this is part of it.", cruel: "I didn't come out here to break hearts. It just turns out I'm very good at it.", kid: "I didn't come here to make people sad. But I guess that's part of the game." },
  },
  // vp.solo.case.pair
  'npl.sc4': {
    0: { anxious: "{target} and {partner} are a pair, and pairs get to the end. I'm splitting them up tonight, and I'm terrified about it.", warm: "I like {target} and {partner}, I really do, but pairs get to the end, so I have to split them up tonight.", cruel: "{target} and {partner} think they're walking to the end together. Tonight I'm ending that.", theatrical: "{target} and {partner}, the great love story of this island. Tonight, I'm writing the tragic ending." },
  },
  // deep.win (again)
  'ndp.w6': {
    0: { quiet: "I keep winning, and they keep looking at me like I did something wrong.", theatrical: "I keep winning, and every time, they look at me like I've committed a crime.", kid: "I keep winning, and everybody looks at me like I'm in trouble." },
    1: { quiet: "Maybe being good at this is the problem. I'm not stopping now.", kid: "Maybe you're not supposed to be good at this. I'm not going to stop, though.", anxious: "Maybe being good at this is the one thing you're not allowed to be out here, and now I'm scared, but I can't stop." },
  },
  // deep.win (tough, cruel)
  'ndp.w3': {
    0: { loud: "Did you see their faces? Not a single smile! They wanted me to lose so badly, and I beat every one of them anyway!", blunt: "Not one of them smiled. They wanted me to lose, and I beat every one of them anyway." },
  },
  // deep.win (warm, alone)
  'ndp.w2': {
    1: { quiet: "They weren't happy for me. I'm safe tonight, and I've never felt so alone.", kid: "They weren't happy for me at all. I'm safe tonight, but I feel really lonely.", goofy: "They weren't happy for me, they were doing maths. I'm safe, and I've never felt more alone, which is a weird combination." },
  },
  // long.conf.bigmove (anxious)
  'nl5.m2': {
    3: { quiet: "So I'm going to try something. My hands are shaking.", kid: "So I'm going to try something big. I'm really scared, and my hands are shaking.", theatrical: "So I'm going to try something, and I'm terrified, and my hands are actually shaking as I say this." },
    4: { emotional: "I just don't want to go home knowing I never even tried. I couldn't live with that.", earnest: "I just want to be able to look back and say I tried, whatever happens." },
  },
  // vote.doubt.holds (anxious)
  'ne.h4': {
    5: { quiet: "I'm writing {target}, and I hate it. I don't know what that says about me.", kid: "I'm writing {target}, and I really don't want to. I feel bad.", emotional: "I'm writing {target}, I hate it, and I'm doing it anyway. I don't even know who I am in this game anymore." },
  },
  // chal.won (b's line about the hero)
  'nc.w7': {
    3: { quiet: "And nobody whispering in the bushes all afternoon.", goofy: "Not having to vote, and no more whispering in the bushes. The bushes need a break." },
  },
};

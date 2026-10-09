// ══════════════════════════════════════════════════════════════════════
// td/story/lines/voices/batch1.js — the voice overhaul, batch 1: the scenes that air most
// ══════════════════════════════════════════════════════════════════════
// { entryId: { turnIndex: { tag: line } } } — merged into the pools by lines/index.js. The tags the
// pools had written least for (quiet, theatrical, nerdy, ditzy, chaotic, flirty, calm, earnest,
// goofy, warm, food, bossy, kid, adult), on the lines people actually hear. Same meaning, same
// facts, the speaker's own way of saying it.

export default {
  // psy.protect: a promised to keep {lastBoot} safe, and couldn't
  'nps.r1': {
    0: { quiet: "I told {lastBoot} I'd keep {lastBoot} safe. I don't say things like that much, so I meant it.", theatrical: "I swore it. Day two, I swore I'd keep {lastBoot} safe, like a knight, and I meant every word.", earnest: "I gave {lastBoot} my word on day two that I'd look out for {lastBoot}, and I don't break my word.", kid: "I promised {lastBoot} I'd look after {lastBoot}, like a real pinky promise, and I meant it.", warm: "I promised {lastBoot} I'd look after {lastBoot}, back on the second day, and I really, really meant it." },
    1: { quiet: "And last night I couldn't. I keep going over it in my head.", theatrical: "And last night I failed. I keep replaying it, every word, like a terrible movie I can't turn off.", nerdy: "And last night I couldn't. I've gone over every conversation from yesterday, and I still can't find where it went wrong.", kid: "And then last night I couldn't do it, and now {lastBoot}'s gone, and it's not fair.", calm: "And last night I couldn't. I'm trying to work out what I missed, so it doesn't happen again." },
  },
  // arc.warn.overheard: a overheard {pitcher} pushing {target}
  'nar.h2': {
    1: { quiet: "I heard {pitcher} say {target}'s name, and I'm not telling anybody until I've had time to think about it.", theatrical: "I heard it with my own two ears. {pitcher} wants {target} gone, and now I'm holding a secret that could blow this whole camp up.", nerdy: "{pitcher} wants {target} out. I heard it clearly. Now I have to work out who benefits if I tell, and who benefits if I don't.", ditzy: "Wait, so {pitcher} wants {target} gone? I'm pretty sure that's what I heard, and now I don't know what to do with it.", chaotic: "Oh, this is good. {pitcher} wants {target} out, I'm the only one who knows, and I could tell everybody or nobody depending on my mood.", kid: "I heard {pitcher} talking about getting {target} out. I wasn't supposed to hear that. I don't know who I should tell." },
  },
  // psy.prove: a wants to be taken seriously
  'nl4.v1': {
    0: { quiet: "Do people here think I matter?", theatrical: "Be honest with me. Do they take me seriously, or am I just the background extra in everybody's story?", kid: "Do the grown-ups here take me seriously? Like, at all?", goofy: "Real question. Do people here take me seriously, or am I the camp mascot?" },
    2: { quiet: "I'm always the last to find out about plans.", nerdy: "Because statistically, I'm the last person told about every plan. I've counted.", theatrical: "Because I'm always the last to know! Every plan, every whisper, I find out after everybody else!", kid: "Because nobody ever tells me the plan until it's already happening. It's like I'm the little sibling." },
    7: { quiet: "Everybody thinks I'm the nice, quiet one. I want them to be surprised.", theatrical: "Everybody back home thinks I'm the nice one. I want to go home as the plot twist.", kid: "Everybody thinks I'm just a kid. I want to show them I can play this game for real.", earnest: "People have always seen me as the nice one. I'd like, just once, to be the one who made the move that mattered." },
  },
  // vt2.safe: a has no idea; b, a friend, is writing a's name
  'nvt.f1': {
    1: { quiet: "This is nice. I'm not worried for once.", theatrical: "Isn't this lovely? For the first time all season, I'm not worried about anything at all!", food: "This is nice. I'm so relaxed tonight that I even saved half my rice for later.", kid: "This is so nice. I'm not even scared tonight, and that never happens to me.", flirty: "Isn't this nice? Just you, me, and nothing to worry about for once." },
    3: { quiet: "It's {wrote} tonight. You're on {wrote} too?", nerdy: "Everybody I asked said {wrote}, so by my count it's not even close. You're on {wrote}, right?", ditzy: "It's {wrote} tonight, right? Everybody said {wrote}, and I'm pretty sure you said {wrote} too.", kid: "It's {wrote} tonight, everybody said so. You promise you're writing {wrote} too?" },
    5: { quiet: "I'm glad we don't have to worry about each other.", theatrical: "I love that you and I never have to worry about each other, because that's really rare out here.", kid: "I'm really glad you're my friend here. I don't have to worry about you." },
  },
  // vt2.safe: a plans for tomorrow; b is writing a's name
  'nvt.f3': {
    0: { quiet: "After tonight, we should think about who's next.", bossy: "Right, so after tonight we need a list. Who's next, who's after that, all of it.", nerdy: "After tonight, I want to map out the next three votes. We should plan ahead.", kid: "After tonight, can we make a plan for who's next? I want to be in the plan this time." },
    2: { quiet: "Tonight's easy. It's {wrote}.", theatrical: "Tonight is a formality, darling. It's {wrote}, and everybody knows it.", ditzy: "Tonight's easy, it's {wrote}. At least, I'm pretty sure it's {wrote}." },
    4: { quiet: "That's not like you. Are you okay?", warm: "Hey, that's not like you. Are you okay? You know you can tell me anything.", kid: "Why are you being so grumpy? You're never grumpy." },
  },
  // deep.alone
  'ndp.a1': {
    0: { quiet: "I talk to everybody a little and nobody a lot, and I didn't even notice until today.", theatrical: "I am everybody's acquaintance and nobody's person. It's like being the friendly extra in someone else's movie.", kid: "I talk to everybody here, but nobody really picks me to hang out with. It's like recess all over again.", food: "I help with every meal, I eat with everybody, and I still don't think anybody would save me a seat." },
    1: { quiet: "That scares me. Nobody fights for somebody who belongs to nobody.", nerdy: "And statistically, the person with no close ally is the easiest vote at every tribal. I know the numbers. I'm the numbers.", kid: "And I'm scared, because if nobody picks me, nobody's going to stop them from picking me to go home." },
  },
  // vt2.sure: a is sure it's {wrote}
  'nl4.u1': {
    1: { quiet: "Tonight's easy. It's {wrote}.", theatrical: "Tonight is going to be easy. It's {wrote}, everybody knows it's {wrote}, it's practically written in the stars.", kid: "Tonight's easy! It's {wrote}, everybody says so.", flirty: "Relax, tonight's easy, it's {wrote}. Come and sit with me for a bit." },
    5: { quiet: "That's just a vote day. People go quiet.", nerdy: "That's normal for a vote day. People talk less when they're counting.", ditzy: "Oh, that's not weird, everybody's just quiet. I think they're tired." },
    9: { quiet: "{a} is so sure. I wish I could be that sure.", warm: "{a} is so sure about tonight, and I really hope {a} is right, because I'd hate to see {a} get hurt.", kid: "{a} is really sure about tonight. I hope {a} is right." },
  },
  // deep.swing: everybody wants a's vote
  'ndp.s3': {
    0: { quiet: "Everybody wants my vote tonight. I don't like being this important.", theatrical: "Tonight, everybody wants me. Every single person. I'm the most popular person on this island, and I hate it.", kid: "Everybody keeps asking me how I'm voting. I've never been this popular before, and it's kind of scary.", nerdy: "My vote decides tonight. I've run it four ways, and every way somebody hates me tomorrow." },
    1: { quiet: "It's all on one piece of paper. I'm trying not to think about it.", theatrical: "My entire game is riding on one tiny piece of paper, and I am completely, totally fine about it.", kid: "My whole game is one little piece of paper. I'm trying to be brave about it." },
  },
  // story.firstday.start
  'fd.g1': {
    7: { quiet: "{a} is trying to look after everybody. I don't know if people will like that for long.", theatrical: "{a} has appointed {a.ref} team mom on day one. I give it forty-eight hours before the revolt.", kid: "{a} is acting like everybody's mom already. It's kind of nice, actually." },
  },
  // story.firstpair.clicked: why'd you sign up
  'fp.c1': {
    1: { quiet: "So why are you here?", theatrical: "So tell me, what brought you to this beautiful disaster?", kid: "So why did you want to be on the show?", nerdy: "Out of curiosity, what's your reason for signing up?" },
    7: { quiet: "I've known {a} ten minutes, and I already trust {a} a little. That's strange for me.", theatrical: "Everybody warned me not to trust anyone out here. Ten minutes with {a}, and I'm already ignoring that advice completely.", kid: "Everybody said not to trust anybody here, but I already kind of trust {a}. Is that bad?", flirty: "Ten minutes with {a}, and we already get along like old friends. I'm going to have to be careful." },
  },
  // long.crowd.won.any
  'nl.w3': {
    7: { quiet: "We're safe tonight and the other team isn't, and I'm just really glad it's not us.", theatrical: "Somewhere across the island, the other team is picking a victim. Here, we're toasting. I could get used to this.", kid: "The other team has to vote somebody out and we don't! This is the best night ever.", food: "We won, we're safe, and I'm finally going to eat dinner without feeling sick about a vote." },
  },
  // story.firstpair.clashed: the bunk
  'fp.x2': {
    7: { quiet: "Day one, and {a} took my {bed}. I'll remember that.", theatrical: "Day one, and {a} has already stolen my {bed}. The war has begun.", kid: "{a} took my {bed} on the very first day. That's so mean.", bossy: "Day one and {a} took the {bed} I picked. That's not how this is going to work." },
  },
  // story.firstpair.clicked: help with that
  'fp.c2': {
    6: { quiet: "{b} is easy to be around. That's rare for me.", theatrical: "I've known {b} for an hour and I already feel like we've done a whole season together.", kid: "{b} is really nice to me. I think {b} could be my friend here.", flirty: "{b} is easy to be around, and I made {b} laugh twice. Day one is going well." },
  },
  // long.cross.friend.any
  'ny.f1': {
    7: { quiet: "{b} is on the other team, and I don't care, because I want {b} with me later.", theatrical: "{b} is on the enemy team, and I don't care one bit. When the walls come down, {b} stands with me.", kid: "{b} is on the other team, but {b} is my friend. I don't care what anybody says." },
  },
  // story.firstpair.clashed: watching for ten minutes
  'fp.x1': {
    6: { quiet: "{b} bothered me from the start. I didn't say anything, but I noticed.", theatrical: "{b} rubbed me the wrong way the moment we arrived, and I never forget a first impression.", kid: "{b} was kind of rude to me. I'm not going to say anything, but I didn't like it.", bossy: "{b} wasn't doing it right, and somebody had to say so. I'll keep saying so." },
  },
  // story.vote.swing.yes
  'nv.y6': {
    0: { quiet: "{target}, tonight. Yes or no?", theatrical: "One question, and I need it answered right now. Are you on {target} tonight, yes or no?", kid: "Are you voting {target} tonight? Please say yes.", bossy: "{target}, tonight. I need a yes, now." },
    5: { quiet: "That's {votes}. It's {target} tonight.", theatrical: "That's {votes}, and I can finally breathe! It's {target} tonight, and nothing can stop it.", kid: "That's {votes}! We did it, it's {target} tonight." },
  },
  // long.cross.friend.any (hanging out after)
  'nl6.y1': {
    3: { quiet: "When this is over, we should hang out.", theatrical: "When all of this is over, you and me, a real friendship. In the outside world.", kid: "When the show's over, can we still be friends? For real?" },
    8: { quiet: "{a} is on the other team, and I really like {a}. That'll be a problem later.", theatrical: "{a} is on the other team, and also one of my favourite people here. It's a tragedy waiting to happen.", kid: "{a} is on the other team, but {a} is one of my favourite people here. I hope we don't have to vote each other." },
  },
  // long.crowd.won.any (a carried it)
  'nl.w1': {
    8: { quiet: "We won because of me. That feels good, and it scares me a little.", theatrical: "We won, and I was the hero. I'm going to enjoy it tonight and worry about the target on my back tomorrow.", kid: "I helped us win, and everybody's being so nice to me. I really hope they stay this nice." },
  },
  // long.talk.approach.outside
  'nk.ao1': {
    3: { quiet: "Are you happy with your people?", nerdy: "Honest question: do you feel secure in your group?", kid: "Do you like the people you're with? Like, really like them?" },
    8: { quiet: "{a} wants out of {a.posAdj} group. I don't know yet if that's good for me.", theatrical: "{a} wants to jump ship, and I honestly can't tell yet if I'm the lifeboat or the trap.", kid: "{a} wants to be friends with me instead of {a.posAdj} group. I don't know if I should trust that." },
  },
  // long.crowd.dinner.any
  'nl.d2': {
    5: { food: "I can't eat. I'm too nervous, and I never can't eat.", kid: "I can't eat. My tummy feels weird.", quiet: "I'm not hungry. I'm too nervous." },
  },
  // story.chal.regroup
  'nbl.r1': {
    4: { quiet: "Last time we blamed somebody, we still lost. Maybe it's all of us.", nerdy: "We blamed one person last time and lost anyway. Logically, it's not one person. It's how we work together.", theatrical: "Last time, we found a villain and we still lost. So maybe the villain was all of us all along." },
    7: { quiet: "{a} didn't blow up this time, which is new, so maybe we're actually getting better.", kid: "{a} didn't yell at anybody this time! That's so much better." },
  },
  // arc.ally.formed (firewood)
  'nl4.a1': {
    1: { quiet: "Who do you trust here?", theatrical: "Honestly, out of everybody on this island, who do you actually trust?", kid: "Who do you trust here? Like, actually trust?", flirty: "Can I ask you something? Who do you trust here, besides me?" },
    8: { quiet: "We made an alliance in a pile of firewood, and nobody knows. That's how I like it.", theatrical: "An alliance, born in a firewood pile, completely secret. This is the beginning of something.", kid: "We made a secret alliance, and nobody knows about it except us. That's so cool." },
  },
  // story.vote.swing.no (shopping for a deal)
  'nw.n3': {
    6: { quiet: "{b} wants something I can't give tonight.", theatrical: "{b} is holding out for a better offer, and tonight, I've got nothing left to offer.", kid: "{b} wouldn't say yes. I didn't have anything to give back." },
  },
  // long.cross.flirt.any
  'ns.cf1': {
    6: { quiet: "{a} is on the other team. I know that, and I keep forgetting it anyway.", theatrical: "{a} is the enemy, and my heart did not get that memo. Not even a little.", flirty: "{a} is on the other team, and that's half the fun." },
  },
};

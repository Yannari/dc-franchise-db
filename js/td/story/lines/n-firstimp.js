// ══════════════════════════════════════════════════════════════════════
// td/story/lines/n-firstimp.js — First Impressions, as the people in it talk
// ══════════════════════════════════════════════════════════════════════
//
// td/story/twist.js writeFirstImpressions (twists.js executeFirstImpressions decides the votes).
// Day one: these people met an hour ago. Nobody has history, nobody has an alliance yet.
//   fi.huddle.<why>   before the vote: a (the boldest voter of {target}) says the name, b agrees
//                     (may be missing), c will not vote that way and hesitates (may be missing)
//   fi.booth.<why>    one voter, alone, writing {target} for their own read of them
//                     (enemy: bad vibe already; calculated: seems like a player; threat: strong;
//                     outsider: hasn't talked to anyone; gut: an instinct; loud: came in too hot;
//                     nothing: had to write somebody)
//   fi.read.any       h reads it: a ({target} of {tribe}) is the one voted out; b wrote a's name
//   fi.twist.any      h: a isn't going home, a is moving to {theirs}; a and b react
//   fi.welcome.any    a walks into {theirs}; b (its most social member) and c welcome a
//   fi.after.any      a, who wrote {target}'s name, to the camera after the twist
// Ids: 'nfi.'.

export default {
  'fi.huddle.any': [
    { id: 'nfi.h1', turns: [
      { by: 'a', say: "Okay, so I know we just met, but we have to pick somebody, right?", v: { bossy: "Okay, listen, we have to pick a name, so let's just pick one and be done.", anxious: "Okay, um, so we have to pick somebody, and I hate this, but we do." } },
      { by: 'b', say: "I mean, yeah. I don't really know anyone." },
      { by: 'a', say: "Honestly, I keep coming back to {target}." },
      { by: 'b', say: "Yeah, I could see that." },
      { by: 'c', opt: true, say: "Really? We've known {target} for like an hour.", v: { warm: "Aw, come on, {target} seems nice. We don't even know {target} yet.", dry: "Based on what, exactly? The way {target} carried a suitcase?" } },
      { by: 'a', opt: true, say: "That's kind of the point, {c}. An hour is all we've got." },
    ] },
    { id: 'nfi.h2', turns: [
      { beat: "A few of them drift over to the edge of the clearing, away from the rest." },
      { by: 'a', say: "Can I just say what we're all thinking? {target}." },
      { by: 'b', say: "Oh thank god, I thought it was just me." },
      { by: 'a', say: "It's not just you." },
      { by: 'c', opt: true, say: "I don't know, guys. I don't want my first move here to be ganging up on somebody." },
      { by: 'b', opt: true, say: "It's not ganging up, {c}, it's a vote, and somebody has to get it." },
    ] },
  ],
  'fi.huddle.enemy': [
    { id: 'nfi.he1', turns: [
      { by: 'a', say: "I don't care how this sounds, {target} and I are not going to get along.", v: { cruel: "I've known {target} for an hour and I already can't stand {target}.", warm: "I really tried with {target}, I did, but something just isn't clicking." } },
      { by: 'b', say: "What happened?" },
      { by: 'a', say: "Nothing happened, that's the thing. It's just a feeling, and it's a bad one." },
      { by: 'b', say: "Okay. I'll write {target} too." },
      { by: 'c', opt: true, say: "So we're voting on vibes now? That's the plan?" },
      { by: 'a', opt: true, say: "Vibes are all anybody has today, {c}." },
    ] },
  ],
  'fi.huddle.calculated': [
    { id: 'nfi.hc1', turns: [
      { by: 'a', say: "Has anybody else noticed how {target} watches everybody? Like, all the time?" },
      { by: 'b', say: "Yes! I thought I was being paranoid." },
      { by: 'a', say: "You're not. {target} has been asking everybody questions since the dock, and none of them were about us." },
      { by: 'b', say: "That's a player. We should get rid of {target} now, while we still can." },
      { by: 'c', opt: true, say: "Or {target} is just friendly. Some people ask questions because they're curious." },
      { by: 'a', opt: true, say: "Nobody's that curious on day one, {c}." },
    ] },
  ],
  'fi.huddle.threat': [
    { id: 'nfi.ht1', turns: [
      { by: 'a', say: "Okay, real talk. Who here wants to go up against {target} in a challenge?" },
      { by: 'b', say: "Not me. Did you see {target} carry those bags off the boat?" },
      { by: 'a', say: "Exactly. If {target} is on our side, great, but if {target} isn't, we're in trouble." },
      { by: 'b', say: "Then it's {target}." },
      { by: 'c', opt: true, say: "Wait, but don't we want strong people for challenges? We're on the same team right now." },
      { by: 'a', opt: true, say: "Right now, sure, {c}, but it won't stay that way forever." },
    ] },
  ],
  'fi.huddle.outsider': [
    { id: 'nfi.ho1', turns: [
      { by: 'a', say: "Has anybody actually talked to {target}? Like, at all?" },
      { by: 'b', say: "I said hi on the dock. That was it." },
      { by: 'a', say: "Same, and that's kind of why I'm thinking {target}. Nobody's going to be upset." },
      { by: 'b', say: "That's harsh, but you're not wrong." },
      { by: 'c', opt: true, say: "Maybe {target} is just shy. We could go and talk to {target}, you know." },
      { by: 'a', opt: true, say: "We could, {c}. Or we could just vote." },
    ] },
  ],
  'fi.huddle.loud': [
    { id: 'nfi.hl1', turns: [
      { by: 'a', say: "Okay, I'm just going to say it. {target} is a lot.", v: { dry: "So, {target}. Very... energetic. For someone who just got here." } },
      { by: 'b', say: "A LOT a lot. {target} hasn't stopped talking since the boat." },
      { by: 'a', say: "And if {target} is this loud on day one, imagine day twenty." },
      { by: 'b', say: "I don't want to imagine day twenty." },
      { by: 'c', opt: true, say: "I kind of like {target}, though. At least {target} isn't boring." },
      { by: 'b', opt: true, say: "Boring doesn't keep me up at night, {c}." },
    ] },
  ],
  'fi.huddle.gut': [
    { id: 'nfi.hg1', turns: [
      { by: 'a', say: "I can't explain it, but {target} isn't who {target} says {target} is.", v: { schemer: "Something about {target} doesn't add up, and I'd rather not wait to find out what." } },
      { by: 'b', say: "What do you mean?" },
      { by: 'a', say: "The story keeps changing. Little stuff, but it changes." },
      { by: 'b', say: "Huh. Okay, I'll take your word for it." },
      { by: 'c', opt: true, say: "That's a lot to decide off a couple of conversations." },
      { by: 'a', opt: true, say: "A couple of conversations is all we've had, {c}." },
    ] },
  ],

  'fi.booth.any': [
    { id: 'nfi.b1', turns: [{ by: 'a', conf: "I barely know anybody here, so I'm writing {target}, and I really hope I'm not wrong about this.", v: { anxious: "I don't know anybody, I don't know anything, and I'm writing {target}, and I'm sorry, {target}.", dry: "One hour of knowing people. Great system. {target}, I guess." } }] },
    { id: 'nfi.b2', turns: [{ by: 'a', conf: "It's {target}. That's the name everybody kept saying, so I'm going with the room.", v: { teen: "Okay, so everyone kept saying {target}, so, like, {target}. Sorry!", grown: "I'm going with the group on this one. {target}." } }] },
  ],
  'fi.booth.nothing': [
    { id: 'nfi.bn1', turns: [{ by: 'a', conf: "I don't have anything against {target}, I really don't, I just had to write somebody's name.", v: { warm: "{target}, if you're watching this, it's nothing personal, I promise, I just had to pick someone.", blunt: "No reason. I had to write a name. {target}." } }] },
    { id: 'nfi.bn2', turns: [{ by: 'a', conf: "This feels so random, but {target} is the only name I heard more than once today, so here we go." }] },
    { id: 'nfi.bn3', when: { voice: ['goofy', 'chaotic', 'ditzy'] }, turns: [{ by: 'a', conf: "I wrote {target}. Wait, how do you spell {target}? I think I spelled it right. Close enough." }] },
  ],
  'fi.booth.enemy': [
    { id: 'nfi.be1', turns: [{ by: 'a', conf: "{target} rubbed me the wrong way from the second we met, and I'm trusting that.", v: { cruel: "I'm not even going to pretend. I don't like {target}. Bye.", loud: "{target} has been getting on my nerves all day, so this one's easy." } }] },
    { id: 'nfi.be2', turns: [{ by: 'a', conf: "Me and {target} had one conversation, and it went badly, so honestly, I don't need a second one." }] },
    { id: 'nfi.be3', when: { voice: ['warm', 'earnest', 'emotional'] }, turns: [{ by: 'a', conf: "I feel bad saying it, but {target} and I just don't click, and I'd rather find that out now than at the merge." }] },
  ],
  'fi.booth.calculated': [
    { id: 'nfi.bc1', turns: [{ by: 'a', conf: "{target} was reading the room way too carefully for somebody who just got off a boat.", v: { schemer: "{target} is a player, I can tell, because I'm one too, and I don't want that kind of competition on my tribe." } }] },
    { id: 'nfi.bc2', turns: [{ by: 'a', conf: "Everybody else was unpacking, and {target} was making friends with every single person. That's a strategy, not a personality." }] },
    { id: 'nfi.bc3', when: { voice: ['anxious', 'earnest', 'warm'] }, turns: [{ by: 'a', conf: "{target} seems really nice, but almost too nice, you know? Like there's a plan behind it." }] },
  ],
  'fi.booth.threat': [
    { id: 'nfi.bt1', turns: [{ by: 'a', conf: "{target} is the strongest person here, and that's great until it isn't, so I'm writing {target} now.", v: { competitive: "If I'm going to win this, I can't have {target} around. Simple as that.", tough: "{target} is the only person here who could beat me in a challenge. So, {target}." } }] },
    { id: 'nfi.bt2', turns: [{ by: 'a', conf: "You can see it in the way {target} walks around camp, like {target} already knows {target} is going far. Not if I can help it." }] },
  ],
  'fi.booth.outsider': [
    { id: 'nfi.bo1', turns: [{ by: 'a', conf: "{target} hasn't really talked to anybody, so I'm going with {target}. It's not mean, it's just math.", v: { warm: "I feel bad, because {target} seems lonely, but I haven't even had a real conversation with {target}." } }] },
    { id: 'nfi.bo2', turns: [{ by: 'a', conf: "Nobody's jumped in to stand up for {target} today, and on day one, that's pretty much everything." }] },
  ],
  'fi.booth.gut': [
    { id: 'nfi.bg1', turns: [{ by: 'a', conf: "My gut is screaming {target}. I can't tell you why, but my gut is usually right.", v: { calm: "Something about {target} is off. I've learned to listen when I feel that." } }] },
    { id: 'nfi.bg2', turns: [{ by: 'a', conf: "{target} told me one thing on the dock and something else at lunch, and I noticed, so it's {target}." }] },
  ],
  'fi.booth.loud': [
    { id: 'nfi.bl1', turns: [{ by: 'a', conf: "{target} came in way too hot. The loudest person on day one never makes it far, and I'm helping that along.", v: { dry: "{target} talked the entire boat ride. The entire boat ride. {target}." } }] },
    { id: 'nfi.bl2', turns: [{ by: 'a', conf: "{target} is confident, and loud, and everybody's already looking at {target}, which makes it the easiest vote I'll ever cast." }] },
  ],

  'fi.read.any': [
    { id: 'nfi.r1', turns: [
      { by: 'h', say: "The votes are in. {a}, your tribe's first impression of you? Not great. You've been voted out." },
      { by: 'a', say: "Wait, what? Me? I've been here for one day!", v: { quiet: "...Oh.", tough: "Seriously? You don't even know me.", dry: "Wow. Okay. Day one. That's a record, right?", emotional: "No, no, no, I didn't even get a chance!" } },
      { by: 'b', opt: true, say: "Sorry. It's nothing personal.", v: { cruel: "Sorry, not sorry.", warm: "I'm really sorry, it was just a feeling." } },
      { by: 'a', opt: true, say: "It's my whole game. It's pretty personal." },
    ] },
    { id: 'nfi.r2', turns: [
      { by: 'h', say: "{a}. On gut instinct alone, {tribe} doesn't want you." },
      { beat: "{a} looks around at the faces that wrote {a.posAdj} name. Nobody looks back." },
      { by: 'a', say: "Okay. Cool. I'll remember that.", v: { anxious: "Okay, um, I guess I'll go pack then.", loud: "Unbelievable! You people don't even KNOW me!", schemer: "Interesting. I'll remember every single one of you." } },
    ] },
  ],
  'fi.twist.any': [
    { id: 'nfi.t1', turns: [
      { by: 'h', say: "But here's the thing about first impressions: they're not always right. {a}, you're not going home. You're moving to {theirs}." },
      { by: 'a', say: "Wait. I'm staying?", v: { loud: "WAIT. I'm STAYING?!", dry: "Oh. Well, that's a twist.", quiet: "...I'm staying?" } },
      { by: 'h', say: "You're staying, just not with them." },
      { by: 'b', opt: true, say: "Oh no.", v: { cruel: "Great, now {a}'s going to be on the other team, hating us.", anxious: "Oh no, oh no, {a} is going to be so mad at us." } },
      { by: 'a', say: "Have fun without me, {tribe}. Really. I mean that.", v: { warm: "Honestly? Thank you. I think I'll be happier over there anyway.", tough: "You just sent your enemy to the other side. Good luck with that." } },
    ] },
    { id: 'nfi.t2', turns: [
      { by: 'h', say: "Pick up your stuff, {a}. You're not leaving the game. You're joining {theirs}." },
      { beat: "The tribe that just voted {a} out goes very quiet." },
      { by: 'a', say: "So you all voted me out, and I'm not even gone. That's kind of amazing.", v: { emotional: "I thought I was going home. I literally thought I was going home." } },
      { by: 'b', opt: true, say: "Well, this is awkward." },
      { by: 'a', conf: "{tribe} decided they didn't want me before they even knew me, so fine. Now they get to lose to me.", v: { warm: "I got a second chance on day one. I'm not going to waste it on being angry.", anxious: "I'm safe, but I'm alone, and I don't know anybody over there either. Day one is really long." } },
    ] },
  ],
  'fi.welcome.any': [
    { id: 'nfi.w1', turns: [
      { beat: "{a} walks into the {theirs} camp with {a.posAdj} bag over one shoulder." },
      { by: 'b', say: "Hey! You're the new one? Come on in!", v: { dry: "So, you're our consolation prize. Welcome.", schemer: "Welcome. So, what did they say about us over there?", bossy: "Okay, new person, you're on firewood. Welcome." } },
      { by: 'a', say: "Hi. Yeah, my own tribe voted me out, so... hi." },
      { by: 'c', opt: true, say: "Their loss. Seriously." },
      { by: 'b', say: "Well, we didn't vote you out, so that's a start." },
      { by: 'a', conf: "These people didn't write my name. That already makes them better than {tribe}." },
    ] },
    { id: 'nfi.w2', turns: [
      { by: 'c', opt: true, say: "Wait, they voted you out on day one? What did you do?" },
      { by: 'a', say: "Nothing! I literally said hi to people. That's all I did." },
      { by: 'b', say: "Okay, well, you're with us now, and we're way nicer." },
      { by: 'a', say: "You'd better be." },
      { by: 'b', conf: "{a} got voted out by {tribe} and landed with us, so {a} has every reason in the world to be loyal to us. I like that." },
    ] },
  ],
  'fi.after.any': [
    { id: 'nfi.a1', turns: [{ by: 'a', conf: "We voted {target} out, and now {target} is on {theirs}, telling them everything about us. That went great.", v: { anxious: "Oh no. We sent {target} to the other team, and {target} knows exactly who voted for {target}. This is bad.", dry: "So we voted {target} out, and {target} just walked over to the other team. Very cool. Great work, everybody." } }] },
    { id: 'nfi.a2', turns: [{ by: 'a', conf: "I wrote {target}'s name, and {target} saw me do it. If we ever end up on the same side again, I'm in trouble.", v: { warm: "I feel awful. I wrote {target}'s name on a feeling, and now {target} is out there thinking I hate {target}.", schemer: "{target} on the other team isn't a bad thing for me. It's one less person over here I have to deal with." } }] },
  ],
};

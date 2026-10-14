// ══════════════════════════════════════════════════════════════════════
// td/story/lines/n-room.js — the room, when a blindside lands
// ══════════════════════════════════════════════════════════════════════
//
// td/story/tribal.js writeTribal: when a plan did not happen, everybody it touches reacts at the
// reading, one line each, while {b} ({lastBoot}) is still in the seat. Then two of them to camera.
//   room.hurt      a wrote another name and just lost their person ({b})
//   room.burned    a was on a plan that failed: they wrote {target}, and {target} is still here
//   room.relieved  a was that plan's target, and a is still here
//   room.pleased   a made it happen
//   after.burned / after.relieved   the same two, later, to the camera
// Ids: 'nx.r'.

export default {
  'room.hurt': [
    { id: 'nx.rh1', turns: [{ by: 'a', say: "No. No, no, no, {b}, I didn't know, I swear I didn't know.", v: { quiet: "...{b}?", tough: "Are you kidding me? Who did this?", dry: "Oh, great. Fantastic. Thanks, everybody." } }] },
    { id: 'nx.rh2', turns: [{ beat: "{a} turns around on the bench and stares at the people behind." }, { by: 'a', say: "Which one of you did this?", v: { anxious: "Wait, who... which one of you? Why didn't anybody tell me?", warm: "Why would you do this? {b} never did anything to any of you." } }] },
    { id: 'nx.rh3', when: { voice: ['emotional', 'warm', 'earnest', 'anxious'] }, turns: [{ by: 'a', say: "{b}, I'm so sorry, I'm so sorry, I wrote somebody else, I had no idea." }] },
    { id: 'nx.rh4', when: { voice: ['loud', 'tough', 'blunt', 'competitive'] }, turns: [{ by: 'a', say: "Okay, that's how it is? Fine. Everybody here just made a really big mistake." }] },
    { id: 'nx.rh5', when: { voice: ['schemer', 'calm', 'dry', 'quiet'] }, turns: [{ beat: "{a} doesn't say a word. {a.Sub} just looks down the row, one face at a time." }] },
    { id: 'nx.rh6', turns: [{ by: 'a', say: "{b}, I didn't... I didn't write your name, okay? I need you to know that.", v: { teen: "{b}, I didn't write your name, I swear, like, I didn't." } }] },
  ],
  'room.burned': [
    { id: 'nx.rb1', turns: [{ by: 'a', say: "Wait, what? It was supposed to be {target}.", v: { loud: "WHAT? It was supposed to be {target}!", quiet: "...That wasn't the plan.", dry: "Huh. So that's not what we agreed on." } }] },
    { id: 'nx.rb2', turns: [{ beat: "{a}'s head snaps toward the rest of the group." }, { by: 'a', say: "Somebody flipped. Somebody in this row flipped.", v: { anxious: "Somebody flipped, oh no, somebody flipped and I'm on the wrong side of it.", tough: "Somebody flipped, and I'm going to find out who." } }] },
    { id: 'nx.rb3', when: { voice: ['schemer', 'calm', 'dry', 'proud'] }, turns: [{ beat: "{a} keeps a straight face, but grips the edge of the bench." }, { by: 'a', say: "Interesting. Okay." }] },
    { id: 'nx.rb4', when: { voice: ['anxious', 'emotional', 'earnest'] }, turns: [{ by: 'a', say: "I wrote {target}. We all said {target}. What just happened?" }] },
    { id: 'nx.rb5', when: { voice: ['loud', 'tough', 'competitive', 'bossy'] }, turns: [{ by: 'a', say: "Are you serious right now? We had the numbers, we had {target}!" }] },
    { id: 'nx.rb6', turns: [{ by: 'a', say: "I'm sorry, I'm confused, I thought we were all voting {target}.", v: { ditzy: "Wait, I'm so confused, weren't we voting {target}? Did I miss something?" } }] },
    { id: 'nx.rb7', turns: [{ beat: "{a} turns and stares down the row, trying to work out who." }] },
    { id: 'nx.rb8', when: { voice: ['goofy', 'chaotic', 'teen'] }, turns: [{ by: 'a', say: "Okay, so who's going to explain what just happened? Anybody?" }] },
  ],
  'room.relieved': [
    { id: 'nx.rr1', turns: [{ beat: "{a} finally breathes out, slumping back on the bench." }, { by: 'a', say: "Oh my god.", v: { quiet: "...Okay.", dry: "Well. That's a relief.", loud: "OH MY GOD." } }] },
    { id: 'nx.rr2', when: { voice: ['emotional', 'warm', 'anxious', 'earnest'] }, turns: [{ by: 'a', say: "I'm sorry, {b}, I really am, I just thought it was going to be me." }] },
    { id: 'nx.rr3', when: { voice: ['schemer', 'cruel', 'proud', 'competitive'] }, turns: [{ beat: "{a} looks straight at the people who wrote {a.posAdj} name, and smiles." }] },
    { id: 'nx.rr4', turns: [{ beat: "{a} covers {a.posAdj} face with both hands." }, { by: 'a', say: "I can't believe I'm still here.", v: { teen: "I can't believe I'm still here, I literally can't.", tough: "Still here. Let's go." } }] },
    { id: 'nx.rr5', when: { voice: ['loud', 'theatrical', 'chaotic'] }, turns: [{ by: 'a', say: "Ha! Not me! Not me tonight!" }] },
    { id: 'nx.rr6', turns: [{ beat: "{a} lets out a long breath, the kind you hold all night without noticing." }] },
    { id: 'nx.rr7', when: { voice: ['dry', 'calm', 'schemer'] }, turns: [{ by: 'a', say: "Huh. Okay. I'll take it." }] },
    { id: 'nx.rr8', when: { voice: ['anxious', 'emotional', 'kid', 'teen'] }, turns: [{ by: 'a', say: "Wait, I'm staying? I'm actually staying?" }] },
    { id: 'nx.rr9', turns: [{ beat: "{a} grabs the hand of whoever is sitting next to {a.obj} and doesn't let go." }] },
  ],
  'room.pleased': [
    { id: 'nx.rp1', when: { nice: false }, turns: [{ beat: "{a} doesn't even try to hide the smile." }] },
    { id: 'nx.rp2', when: { nice: false, voice: ['schemer', 'calm', 'dry', 'proud'] }, turns: [{ beat: "{a} watches the faces down the row, one at a time, and says nothing." }] },
    { id: 'nx.rp3', when: { nice: true }, turns: [{ beat: "{a} looks down at {a.posAdj} hands and can't look at {b}." }] },
    { id: 'nx.rp4', when: { nice: true }, turns: [{ by: 'a', say: "I'm sorry, {b}, I really am.", v: { quiet: "...Sorry, {b}.", emotional: "I'm so sorry, {b}, please don't hate me." } }] },
    { id: 'nx.rp5', when: { nice: false, voice: ['cruel', 'loud', 'tough', 'competitive'] }, turns: [{ by: 'a', say: "Bye, {b}. Nothing personal.", v: { cruel: "Bye, {b}. And yeah, it's a little personal." } }] },
    { id: 'nx.rp6', turns: [{ beat: "{a} nods once, to nobody in particular." }] },
    { id: 'nx.rp7', when: { nice: false, voice: ['dry', 'calm', 'proud'] }, turns: [{ by: 'a', say: "Well. That went the way it was supposed to." }] },
    { id: 'nx.rp8', when: { nice: true }, turns: [{ beat: "{a} keeps {a.posAdj} eyes on the floor until {b} has gone." }] },
    { id: 'nx.rp9', turns: [{ beat: "{a} sits back and folds {a.posAdj} arms." }] },
  ],
  'after.burned': [
    { id: 'nx.ab1', turns: [{ by: 'a', conf: "We had {target}, we had the numbers, and somebody in my own group flipped, and now I'm on the outside and I don't even know who put me there." }] },
    { id: 'nx.ab2', when: { voice: ['schemer', 'calm', 'dry'] }, turns: [{ by: 'a', conf: "I walked in thinking it was {target}, and I was wrong, and I'm never wrong about votes, so somebody is a much better liar than I thought." }] },
    { id: 'nx.ab3', when: { voice: ['anxious', 'emotional', 'earnest', 'warm'] }, turns: [{ by: 'a', conf: "Everybody told me it was {target}, and I believed them, and now I don't know who I can believe anymore." }] },
    { id: 'nx.ab4', when: { voice: ['loud', 'tough', 'competitive', 'bossy'] }, turns: [{ by: 'a', conf: "Somebody went behind my back tonight. Fine. I'm going to find out who, and then they're next." }] },
    { id: 'nx.ab5', turns: [{ by: 'a', conf: "{target} is still here and {lastBoot} isn't, and that means my name is probably the next one on somebody's list." }] },
    { id: 'nx.ab6', turns: [{ by: 'a', conf: "I counted the votes three times before we walked in. Somebody lied to my face, and I have a pretty short list of who." }] },
    { id: 'nx.ab7', when: { voice: ['goofy', 'chaotic', 'teen', 'kid'] }, turns: [{ by: 'a', conf: "So that didn't work. At all. I'm going to need a minute. Maybe a whole day." }] },
  ],
  'after.relieved': [
    { id: 'nx.ar1', turns: [{ by: 'a', conf: "My name was out there tonight, I know it was, and somehow I'm still here, and I'm not wasting it." }] },
    { id: 'nx.ar2', when: { voice: ['schemer', 'calm', 'dry', 'proud'] }, turns: [{ by: 'a', conf: "They came for me tonight and missed, and now I know exactly who wrote my name." }] },
    { id: 'nx.ar3', when: { voice: ['anxious', 'emotional', 'earnest', 'warm'] }, turns: [{ by: 'a', conf: "I really thought I was going home tonight, I had my bag packed in my head and everything, so I'm going to sleep so well." }] },
    { id: 'nx.ar4', when: { voice: ['loud', 'tough', 'competitive', 'cruel'] }, turns: [{ by: 'a', conf: "They wrote my name and they still lost, so whoever they are, they'd better get used to losing." }] },
    { id: 'nx.ar5', turns: [{ by: 'a', conf: "I don't know who saved me tonight, but I owe them, and I'm going to find out who it was." }] },
    { id: 'nx.ar6', turns: [{ by: 'a', conf: "That was too close. I'm not doing that again. Tomorrow I'm finding out who wrote my name, and I'm making sure they don't get a second try." }] },
    { id: 'nx.ar7', when: { voice: ['goofy', 'chaotic', 'loud', 'teen'] }, turns: [{ by: 'a', conf: "I'm still here! Somebody tried to get rid of me, and it didn't work, and I'm going to be SO annoying about it tomorrow." }] },
    { id: 'nx.ar8', when: { voice: ['calm', 'quiet', 'earnest', 'warm'] }, turns: [{ by: 'a', conf: "I got lucky tonight. I know that. Lucky doesn't last, so tomorrow I have to actually do something." }] },
  ],
};

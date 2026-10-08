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
    { id: 'nx.rh5', when: { voice: ['schemer', 'calm', 'dry', 'quiet'] }, turns: [{ beat: "{a} doesn't say a word. {a} just looks down the row, one face at a time." }] },
    { id: 'nx.rh6', turns: [{ by: 'a', say: "{b}, I didn't... I didn't write your name, okay? I need you to know that.", v: { teen: "{b}, I didn't write your name, I swear, like, I didn't." } }] },
  ],
  'room.burned': [
    { id: 'nx.rb1', turns: [{ by: 'a', say: "Wait, what? It was supposed to be {target}.", v: { loud: "WHAT? It was supposed to be {target}!", quiet: "...That wasn't the plan.", dry: "Huh. So that's not what we agreed on." } }] },
    { id: 'nx.rb2', turns: [{ beat: "{a}'s head snaps toward the rest of the group." }, { by: 'a', say: "Somebody flipped. Somebody in this row flipped.", v: { anxious: "Somebody flipped, oh no, somebody flipped and I'm on the wrong side of it.", tough: "Somebody flipped, and I'm going to find out who." } }] },
    { id: 'nx.rb3', when: { voice: ['schemer', 'calm', 'dry', 'proud'] }, turns: [{ beat: "{a} keeps a straight face, but grips the edge of the bench." }, { by: 'a', say: "Interesting. Okay." }] },
    { id: 'nx.rb4', when: { voice: ['anxious', 'emotional', 'earnest'] }, turns: [{ by: 'a', say: "I wrote {target}. We all said {target}. What just happened?" }] },
    { id: 'nx.rb5', when: { voice: ['loud', 'tough', 'competitive', 'bossy'] }, turns: [{ by: 'a', say: "Are you serious right now? We had the numbers, we had {target}!" }] },
    { id: 'nx.rb6', turns: [{ by: 'a', say: "I'm sorry, I'm confused, I thought we were all voting {target}.", v: { ditzy: "Wait, I'm so confused, weren't we voting {target}? Did I miss something?" } }] },
  ],
  'room.relieved': [
    { id: 'nx.rr1', turns: [{ beat: "{a} finally breathes out, slumping back on the bench." }, { by: 'a', say: "Oh my god.", v: { quiet: "...Okay.", dry: "Well. That's a relief.", loud: "OH MY GOD." } }] },
    { id: 'nx.rr2', when: { voice: ['emotional', 'warm', 'anxious', 'earnest'] }, turns: [{ by: 'a', say: "I'm sorry, {b}, I really am, I just thought it was going to be me." }] },
    { id: 'nx.rr3', when: { voice: ['schemer', 'cruel', 'proud', 'competitive'] }, turns: [{ beat: "{a} looks straight at the people who wrote {a.posAdj} name, and smiles." }] },
    { id: 'nx.rr4', turns: [{ beat: "{a} covers {a.posAdj} face with both hands." }, { by: 'a', say: "I can't believe I'm still here.", v: { teen: "I can't believe I'm still here, I literally can't.", tough: "Still here. Let's go." } }] },
    { id: 'nx.rr5', when: { voice: ['loud', 'theatrical', 'chaotic'] }, turns: [{ by: 'a', say: "Ha! Not me! Not me tonight!" }] },
  ],
  'room.pleased': [
    { id: 'nx.rp1', when: { nice: false }, turns: [{ beat: "{a} doesn't even try to hide the smile." }] },
    { id: 'nx.rp2', when: { nice: false, voice: ['schemer', 'calm', 'dry', 'proud'] }, turns: [{ beat: "{a} watches the faces down the row, one at a time, and says nothing." }] },
    { id: 'nx.rp3', when: { nice: true }, turns: [{ beat: "{a} looks down at {a.posAdj} hands and can't look at {b}." }] },
    { id: 'nx.rp4', when: { nice: true }, turns: [{ by: 'a', say: "I'm sorry, {b}, I really am.", v: { quiet: "...Sorry, {b}.", emotional: "I'm so sorry, {b}, please don't hate me." } }] },
    { id: 'nx.rp5', when: { nice: false, voice: ['cruel', 'loud', 'tough', 'competitive'] }, turns: [{ by: 'a', say: "Bye, {b}. Nothing personal.", v: { cruel: "Bye, {b}. And yeah, it's a little personal." } }] },
    { id: 'nx.rp6', turns: [{ beat: "{a} nods once, to nobody in particular." }] },
  ],
  'after.burned': [
    { id: 'nx.ab1', turns: [{ by: 'a', conf: "We had {target}, we had the numbers, and somebody in my own group flipped, and now I'm on the outside and I don't even know who put me there." }] },
    { id: 'nx.ab2', when: { voice: ['schemer', 'calm', 'dry'] }, turns: [{ by: 'a', conf: "I walked in thinking it was {target}, and I was wrong, and I'm never wrong about votes, so somebody is a much better liar than I thought." }] },
    { id: 'nx.ab3', when: { voice: ['anxious', 'emotional', 'earnest', 'warm'] }, turns: [{ by: 'a', conf: "Everybody told me it was {target}, and I believed them, and now I don't know who I can believe anymore." }] },
    { id: 'nx.ab4', when: { voice: ['loud', 'tough', 'competitive', 'bossy'] }, turns: [{ by: 'a', conf: "Somebody went behind my back tonight. Fine. I'm going to find out who, and then they're next." }] },
    { id: 'nx.ab5', turns: [{ by: 'a', conf: "{target} is still here and {lastBoot} isn't, and that means my name is probably the next one on somebody's list." }] },
  ],
  'after.relieved': [
    { id: 'nx.ar1', turns: [{ by: 'a', conf: "My name was out there tonight, I know it was, and somehow I'm still here, and I'm not wasting it." }] },
    { id: 'nx.ar2', when: { voice: ['schemer', 'calm', 'dry', 'proud'] }, turns: [{ by: 'a', conf: "They came for me tonight and missed, and now I know exactly who wrote my name." }] },
    { id: 'nx.ar3', when: { voice: ['anxious', 'emotional', 'earnest', 'warm'] }, turns: [{ by: 'a', conf: "I really thought I was going home tonight, I had my bag packed in my head and everything, so I'm going to sleep so well." }] },
    { id: 'nx.ar4', when: { voice: ['loud', 'tough', 'competitive', 'cruel'] }, turns: [{ by: 'a', conf: "They wrote my name and they still lost, so whoever they are, they'd better get used to losing." }] },
    { id: 'nx.ar5', turns: [{ by: 'a', conf: "I don't know who saved me tonight, but I owe them, and I'm going to find out who it was." }] },
  ],
};

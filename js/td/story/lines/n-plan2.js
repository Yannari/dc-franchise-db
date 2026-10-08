// ══════════════════════════════════════════════════════════════════════
// td/story/lines/n-plan2.js — more beats for the strategy talk (n-plan.js has the header)
// ══════════════════════════════════════════════════════════════════════
// Ids: 'npm.'.

export default {
  'vp.open.duo': [
    { id: 'npm.o1', turns: [{ beat: "{a} hands {b} a bucket and nods toward the water, as if they were doing chores." }, { by: 'b', say: "We're not getting water, are we?", v: { dry: "I'm guessing this isn't really about water." } }, { by: 'a', say: "We are getting water, and while we're getting it, we're talking about tonight." }] },
    { id: 'npm.o2', turns: [{ by: 'a', say: "Hey. Before everybody starts asking everybody, I want us to be on the same page.", v: { warm: "Hey, can we talk before tonight? I don't want us going in blind.", competitive: "We need a plan before they make one for us." } }] },
    { id: 'npm.o3', turns: [{ by: 'b', say: "Please tell me you have a name, because I've been going in circles all day." }, { by: 'a', say: "I've got a name." }] },
  ],
  'vp.open.group': [
    { id: 'npm.og1', turns: [{ beat: "One by one, the group finds an excuse to wander off: firewood, the bathroom, a walk. They all end up in the same place." }, { by: 'c', say: "Smooth, everybody. Really smooth.", v: { goofy: "I said I was looking for my sock. I'm wearing both of them." } }, { by: 'a', say: "Okay, let's be quick." }] },
    { id: 'npm.og2', turns: [{ by: 'a', say: "Okay, we've got maybe five minutes before somebody comes looking. Let's do this.", v: { calm: "Alright. Let's keep this short and keep it quiet.", bossy: "Five minutes. I'll talk, you listen, then we vote." } }, { by: 'd', opt: true, say: "Can I just say I love that we have meetings now?" }] },
  ],
  'vp.case.coming': [
    { id: 'npm.cc1', when: { markMe: true }, turns: [
      { by: 'a', say: "Somebody just told me {target} is counting votes against me.", v: { loud: "Guess whose name {target} is throwing around? Mine! MINE!", dry: "Fun news: {target} wants me gone. So that's my afternoon ruined." } },
      { by: 'b', say: "Do you believe it?" },
      { by: 'a', say: "I believe it enough that I'm not waiting to find out the hard way." },
    ] },
    { id: 'npm.cc2', when: { markMe: false, markB: false }, turns: [
      { by: 'a', say: "Have you noticed {target} keeps pulling people aside? I finally found out why. They want {mark} gone.", v: { anxious: "Okay, so I found out {target}'s whole group is going after {mark}, and I can't let that happen." } },
      { by: 'b', say: "Does {mark} know?" },
      { by: 'a', say: "Not yet, and I'd rather fix it before {mark} has to worry about it." },
    ] },
    { id: 'npm.cc3', when: { markB: true }, turns: [
      { by: 'a', say: "Your name is out there, {b}. {target}'s group has been saying it all day." },
      { by: 'b', say: "You're kidding me.", v: { tough: "Oh, are they? Great. Let them try.", anxious: "Oh no. Oh no, no, no. What do we do?" } },
      { by: 'a', say: "We write {target}, and we make sure there are more of us than there are of them." },
    ] },
  ],
  'vp.case.sank': [
    { id: 'npm.cs1', turns: [
      { by: 'a', say: "Look, I like {target}. But we have to win the next one, and you saw what happened out there today.", v: { cruel: "{target} fell, dropped the thing, then fell again. I'm not voting for a sequel." } },
      { by: 'b', say: "{target} did kind of fall apart." },
      { by: 'a', say: "Completely. And if we keep losing, it's one of us next, not {target}." },
    ] },
  ],
  'vp.case.idol': [
    { id: 'npm.ci1', turns: [
      { by: 'a', say: "Has anybody else noticed {target} has stopped worrying about the vote? Like, completely?", v: { dry: "{target} has been very relaxed for somebody with nothing in their pocket." } },
      { by: 'b', say: "You think {target} has something." },
      { by: 'a', say: "I think {target} has an idol, and the only time to get rid of somebody with an idol is when they don't see it coming." },
    ] },
  ],
  'vp.case.pair': [
    { id: 'npm.cp1', turns: [
      { by: 'a', say: "If {target} and {partner} both make the merge together, we can't break them up. It has to be now.", v: { schemer: "{target} and {partner} are a voting bloc of two, and two is one too many." } },
      { by: 'b', say: "Why {target} and not {partner}?" },
      { by: 'a', say: "Because {partner} will be lost without {target}. The other way around, I'm not so sure." },
    ] },
  ],
  'vp.case.group': [
    { id: 'npm.cg1', turns: [
      { by: 'a', say: "{theirs} has been running this place since day one, and {target} is a big part of that.", v: { warm: "I don't have anything against {target}, I just know {target} would pick {theirs} over us every single time." } },
      { by: 'b', say: "So we start chipping away at them." },
      { by: 'a', say: "One at a time, starting with {target}." },
    ] },
  ],
  'vp.case.grudge': [
    { id: 'npm.cr1', turns: [
      { by: 'a', say: "Do you remember what {target} said to me yesterday? Because I do.", v: { tough: "{target} talked to me like I was nothing. That doesn't happen twice.", emotional: "{target} has been mean to me since we got here, and I'm tired of crying about it." } },
      { by: 'b', say: "That was pretty bad." },
      { by: 'a', say: "It was. And I'd rather vote with my gut than spend another week pretending it didn't happen." },
    ] },
  ],
  'vp.case.threat': [
    { id: 'npm.ct1', turns: [
      { by: 'a', say: "Can I tell you who scares me? {target}. Everybody loves {target}, and nobody is watching.", v: { goofy: "{target} is like a golden retriever that's secretly winning the game." } },
      { by: 'b', say: "{target} is pretty likeable." },
      { by: 'a', say: "That's what scares me. Likeable people win. We take {target} out while we still can." },
    ] },
  ],
  'vp.case.outsider': [
    { id: 'npm.co1', turns: [
      { by: 'a', say: "Nobody's really talked to {target} all week, and I think {target} knows it.", v: { warm: "I feel bad, I really do, but {target} hasn't let any of us in." } },
      { by: 'b', say: "So it's the easy vote." },
      { by: 'a', say: "It's the easy vote, and easy votes don't come back to bite you." },
    ] },
  ],
  'vp.case.numbers': [
    { id: 'npm.cn1', turns: [
      { by: 'a', say: "I've been through every name, and every other one breaks somebody's heart. {target} doesn't." },
      { by: 'b', say: "That's kind of cold." },
      { by: 'a', say: "It's kind of the game.", v: { warm: "I know, and I hate it. But it's the name that keeps the rest of us together." } },
    ] },
  ],
  'vp.push.alt': [
    { id: 'npm.pa1', turns: [{ by: 'b', say: "Honestly, I thought you were going to say {alt}." }] },
    { id: 'npm.pa2', turns: [{ by: 'b', say: "I'm in, but if we're picking names, I'd have gone with {alt}.", v: { cruel: "Fine, but {alt} is the one I'd pay to watch leave." } }] },
  ],
  'vp.answer.alt': [
    { id: 'npm.aa1', turns: [{ by: 'a', say: "{alt} isn't going anywhere. We'll get there. One at a time." }] },
  ],
  'vp.push.like': [
    { id: 'npm.pl1', turns: [{ by: 'b', say: "Ugh. {target} made me laugh so hard yesterday. This feels terrible." }] },
  ],
  'vp.answer.like': [
    { id: 'npm.al1', turns: [{ by: 'a', say: "It's supposed to feel terrible. If it didn't, I'd be worried about you." }] },
  ],
  'vp.push.sure': [
    { id: 'npm.ps1', turns: [{ by: 'b', say: "No argument from me.", v: { bossy: "Good, finally a name I don't have to argue with.", teen: "Yeah, okay, honestly I'm kind of relieved it's not someone else." } }] },
  ],
  'vp.answer.sure': [
    { id: 'npm.as1', turns: [{ by: 'a', say: "Then that's it. Nobody else hears about this until we're sitting down." }] },
  ],
  'vp.count.enough': [
    { id: 'npm.k1', turns: [{ by: 'a', say: "I counted three times. It's {votes}, and that's enough, unless somebody's lying to me.", v: { anxious: "I've counted like nine times. It's {votes}. I think. It's {votes}." } }] },
  ],
  'vp.count.all': [
    { id: 'npm.k2', turns: [{ by: 'a', say: "Everybody's on it. Literally everybody except {target}." }, { by: 'b', say: "That's going to be a quiet tribal.", v: { dry: "Poor {target}. That's going to be a long walk." } }] },
  ],
  'vp.close.duo': [
    { id: 'npm.x1', when: { shaky: true }, turns: [
      { by: 'b', say: "What about {shaky}? {shaky} was weird with me this morning." },
      { by: 'a', say: "I'll handle {shaky}. You just make sure you don't look nervous at dinner." },
    ] },
    { id: 'npm.x2', when: { cover: true }, turns: [
      { by: 'a', say: "Go and tell a couple of people you're thinking about {cover}. Not too hard, just enough." },
      { by: 'b', say: "So everybody thinks it's {cover}." },
      { by: 'a', say: "So {target} thinks it's {cover}." },
    ] },
    { id: 'npm.x3', turns: [
      { by: 'b', say: "And after tonight? What happens with us?" },
      { by: 'a', say: "After tonight we're two people who did this together. That counts for something." },
      { by: 'b', conf: "{a} talks about us like we're a team, and maybe we are. But I noticed {a} didn't promise me anything." },
    ] },
  ],
  'vp.close.group': [
    { id: 'npm.xg1', when: { cover: true }, turns: [
      { by: 'd', opt: true, say: "What if it's close and somebody plays an idol?" },
      { by: 'a', say: "Then we've got {cover} as the backup, and we stick together on that." },
      { by: 'b', conf: "{a} has a plan for everything tonight, which is great, but it means everybody here knows {a} is running it, including {target}'s friends." },
    ] },
    { id: 'npm.xg2', when: { shaky: true }, turns: [
      { by: 'c', conf: "{a} keeps saying it's {votes} votes, but I've seen {shaky} talking to the other side twice today. I'm not saying anything yet, but I'm watching." },
    ] },
  ],
};

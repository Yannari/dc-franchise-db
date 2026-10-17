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
  // a named alliance getting together (director.js voteTalk: the leader's alliance, with more of it on tonight's plan).
  // {group} is its name; the booth says "{group} wanted {target}", so the camp has to have shown them deciding it
  'vp.open.alliance': [
    { id: 'npm.ga1', when: { group: true }, turns: [{ beat: "{group} gets together {here}: {a}, {b}, {c} and nobody else." }, { by: 'a', say: "Okay, everybody. We need one name for tonight, and all of us write it.", v: { bossy: "{group}, listen up. One name tonight, all of us, and then we split up before anybody notices.", anxious: "Okay, so, {group}... we kind of need a name for tonight. Like, right now.", goofy: "I hereby call this meeting of {group} to order. Can somebody say 'seconded'?", warm: "Thanks for coming, guys. {group} sticks together tonight, so let's pick a name we can all live with." } }, { by: 'b', say: "Finally. I've been waiting all day for this.", v: { dry: "Okay. Who is it?" } }] },
    { id: 'npm.ga2', when: { group: true }, turns: [{ beat: "{b} and {c} drift away from camp one at a time and find {a} {here}. It's the first time all day that {group} has been in one place." }, { by: 'c', say: "So is this an official meeting, or are we just standing around?" }, { by: 'a', say: "It's official. Tonight's name, and nobody leaves until we agree on it." }] },
    { id: 'npm.ga3', when: { group: true }, turns: [{ beat: "{a} pulls {b} and {c} aside {here}. If {group} is going to vote as one tonight, they have to agree on who." }, { by: 'a', say: "This is exactly what {group} is for. One name, all of us, no surprises.", v: { schemer: "This is what {group} is for. Tonight, we use it." } }, { by: 'b', say: "So who is it?" }] },
  ],
  'vp.open.allianceDuo': [
    { id: 'npm.gd1', when: { group: true }, turns: [{ beat: "{a} catches {b} alone {here}." }, { by: 'a', say: "Quick meeting of {group}. It's a short one, there's only two of us.", v: { dry: "Emergency meeting of {group}. Attendance: you and me.", warm: "Hey, partner. {group} needs to talk about tonight." } }, { by: 'b', say: "Ha. Okay. Go on." }] },
    { id: 'npm.gd2', when: { group: true }, turns: [{ by: 'a', say: "Got a minute? It's about {group}, and it's about tonight.", v: { anxious: "Can we talk? It's about {group}. Well, about tonight." } }, { by: 'b', say: "Okay. I'm listening." }] },
  ],
  'vp.open.group': [
    { id: 'npm.og1', turns: [{ beat: "One by one, the group finds an excuse to wander off: firewood, the bathroom, a walk. They all end up in the same place." }, { by: 'c', say: "Smooth, everybody. Really smooth.", v: { goofy: "I said I was looking for my sock. I'm wearing both of them." } }, { by: 'a', say: "Okay, let's be quick." }] },
    { id: 'npm.og2', turns: [{ beat: "{b} and {c} slip away one at a time, so nobody notices, and find {a} {here}." }, { by: 'a', say: "Okay, we've got maybe five minutes before somebody comes looking. Let's do this.", v: { calm: "Alright. Let's keep this short and keep it quiet.", bossy: "Five minutes. I'll talk, you listen, then we vote." } }, { by: 'd', opt: true, say: "Can I just say I love that we have meetings now?" }] },
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
      { by: 'a', say: "If {target} and {partner} both make it to the end together, we can't break them up. It has to be now.", v: { schemer: "{target} and {partner} are a voting bloc of two, and two is one too many." } },
      { by: 'b', say: "Why {target} and not {partner}?" },
      { by: 'a', say: "Because {partner} will be lost without {target}. The other way around, I'm not so sure." },
    ] },
    // the pair came in together (season-ties.js): what they are to each other is the reason
    { id: 'npm.cp2', when: { pairTied: true, pairCouple: true }, turns: [
      { by: 'a', say: "{target} walked in here with {partner}. {partner} is {target.posAdj} {partnerIs}, and you can't out-bond that." },
      { by: 'b', say: "So we split them up." },
      { by: 'a', say: "Now, while we still can. Two people who'd take a bullet for each other are two votes we never get." },
    ] },
    { id: 'npm.cp3', when: { pairTied: true, pairCouple: true }, turns: [
      { by: 'a', say: "Everybody keeps forgetting {target} and {partner} are a real couple. They're not an alliance, they go home together." },
      { by: 'b', say: "And you want {target} gone first?" },
      { by: 'a', say: "{partner} without {target} is just a sad person with one vote. {target} without {partner} would be furious, and dangerous." },
    ] },
    { id: 'npm.cp4', when: { pairTied: true, pairFamily: true }, turns: [
      { by: 'a', say: "{partner} is {target.posAdj} {partnerIs}. Family. You can't make a deal stronger than that, so you don't try." },
      { by: 'b', say: "Why {target} and not {partner}?" },
      { by: 'a', say: "{target} is the one who'd go to war for {partner}. Take {target} out and {partner} is just one more vote." },
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
      { by: 'a', say: "I can't stand the way {target} talks to me. I'm done pretending I can.", v: { tough: "{target} talks to me like I'm nothing. I'm done putting up with it.", emotional: "{target} has been mean to me since we got here, and I'm tired of crying about it." } },
      { by: 'b', say: "Yeah. I've seen it." },
      { by: 'a', say: "Then you get it. I'd rather vote with my gut than spend another week pretending it doesn't bother me." },
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
    { id: 'npm.aa1', turns: [{ by: 'a', say: "{alt} can wait. We'll get there, one at a time." }] },
  ],
  'vp.push.like': [
    { id: 'npm.pl1', turns: [{ by: 'b', say: "Ugh. I really like {target}. This feels terrible." }] },
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
    { id: 'npm.x3', when: { alliance: false }, turns: [
      { by: 'b', say: "And after tonight? What happens with us?" },
      { by: 'a', say: "After tonight we're two people who did this together. That counts for something." },
      { by: 'b', conf: "{a} talks about us like we're a team, and maybe we are. But I noticed {a} didn't promise me anything." },
    ] },
  ],
  'vp.close.group': [
    { id: 'npm.xg1', when: { cover: true }, turns: [
      { by: 'b', say: "What if it's close and somebody plays an idol?" },
      { by: 'a', say: "Then we've got {cover} as the backup, and we stick together on that." },
      { by: 'b', conf: "{a} has a plan for everything tonight, which is great, but it means everybody here knows {a} is running it, including {target}'s friends." },
    ] },
    { id: 'npm.xg2', when: { shaky: true }, turns: [
      { by: 'c', conf: "{a} keeps saying it's {votes} votes, but I've seen {shaky} talking to the other side twice today. I'm not saying anything yet, but I'm watching." },
    ] },
  ],

  // ── a coach on the plan (the coaching twist: director.js votePlan, a night the tribe voted out its coach) ──
  // Every reason is one the ballots give (coaches.js coachVoteReason) and is true tonight: a coach has no vote and no
  // idol they can play, the coach's trainees lose what they were taught when the coach goes (coach-episode.js
  // revokeCoachTraining), and a coach still standing at the merge joins the game (promoteCoaches). Facts: coachPassed (a
  // was never trained), coachMine (a was), coachTrained (anybody was), coachBuilt (three or more were), protege ({protege}, a trainee not in the
  // scene), coachLiked (a likes the coach).
  'vp.case.coach': [
    { id: 'npm.ch1', when: { coachPassed: true }, turns: [
      { by: 'a', say: "{target} has been training people all game, and not once me. I'm not keeping a coach who picked everybody else.", v: { tough: "Every session, {target} picks somebody. Every session, it's not me. I'm done waiting.", calm: "{target} has made a lot of people here better. None of them were me. That's my answer." } },
      { by: 'b', say: "That sounds a little personal.", v: { dry: "Wow. Bitter much?" } },
      { by: 'a', say: "It's practical. Every session {target} runs makes somebody else harder to beat." },
    ] },
    { id: 'npm.ch2', when: { coachBuilt: true, protege: true }, turns: [
      { by: 'a', say: "Look at {protege}. Every session with {target}, {protege} gets a little harder to beat. That's {target}'s work." },
      { by: 'b', say: "So we go after {protege}?" },
      { by: 'a', say: "No. We go after the one who keeps making more of {protege}. Take out {target}, and everything {target} taught goes with {target}." },
    ] },
    { id: 'npm.ch3', when: { coachTrained: true }, turns: [
      { by: 'a', say: "Here's what nobody's thinking about. If {target} is still here at the merge, {target} stops being a coach and starts playing.", v: { schemer: "Everybody's forgetting the merge, when a coach who's still here gets to play, with us and against us." } },
      { by: 'b', say: "Against us." },
      { by: 'a', say: "Against us, with everybody {target} ever trained owing {target} a favour. Tonight is the cheapest {target} is ever going to be." },
    ] },
    { id: 'npm.ch4', turns: [
      { by: 'a', say: "{target} doesn't have a vote. Nobody out here loses an ally if {target} goes.", v: { blunt: "It's {target}, because there's no vote, no idol and no ally who comes after us. It's the easiest name all season." } },
      { by: 'b', say: "That feels kind of cold." },
      { by: 'a', say: "It's the one name tonight that doesn't send one of us home.", v: { warm: "I know. But it's the one name that keeps all of us here." } },
    ] },
    { id: 'npm.ch5', when: { coachLiked: true }, turns: [
      { by: 'a', say: "I like {target}, I really do, but that's not the point." },
      { by: 'b', say: "Then what's the point?" },
      { by: 'a', say: "{target} has no vote to lose, and nobody who comes back for revenge. We cut the coach, and all of us are still here tomorrow." },
    ] },
    { id: 'npm.ch6', when: { coachMine: true }, turns: [
      { by: 'a', say: "{target} trained me, I know, and I'm still writing the name." },
      { by: 'b', say: "You'll lose everything {target} taught you." },
      { by: 'a', say: "Some of it. But if {target} makes the merge, {target} is playing, and nobody here knows how I play better than {target}." },
    ] },
  ],
  'vp.solo.case.pair': [
    { id: 'npm.cps1', when: { pairTied: true, pairCouple: true }, turns: [{ by: 'a', conf: "{target} and {partner} came here as a couple. Nobody in this game is ever going to be as loyal to me as they are to each other, so one of them has to go." }] },
    { id: 'npm.cps2', when: { pairTied: true, pairFamily: true }, turns: [{ by: 'a', conf: "{partner} is {target.posAdj} {partnerIs}. I'd vote for my family every time too. That's exactly why {target} can't stay." }] },
  ],
  'vp.solo.case.coach': [
    { id: 'npm.chs1', when: { coachPassed: true }, turns: [{ by: 'a', conf: "{target} picked a favourite every single session, and it was never me. Tonight, I return the favour." }] },
    { id: 'npm.chs2', when: { coachTrained: true }, turns: [{ by: 'a', conf: "Coaches join the game at the merge. If {target} gets there, {target} walks in with everybody {target} ever trained owing {target} a favour. Not if I can help it." }] },
    { id: 'npm.chs3', turns: [{ by: 'a', conf: "{target} has no vote, no allies to lose, and nobody who'll come after us for it. It's the cheapest name we'll ever get.", v: { warm: "I feel bad. {target} has been good to this team. But a coach is the one name that costs none of us an ally." } }] },
    { id: 'npm.chs4', when: { coachMine: true }, turns: [{ by: 'a', conf: "{target} trained me, and if {target} goes, I lose some of that. I'm doing it anyway. A coach at the merge knows exactly how I play." }] },
  ],
};

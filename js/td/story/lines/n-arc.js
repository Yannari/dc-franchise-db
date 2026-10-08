// ══════════════════════════════════════════════════════════════════════
// td/story/lines/n-arc.js — the vote, told across the day
// ══════════════════════════════════════════════════════════════════════
//
// director.js arcBeats (header there). The spark plays BEFORE the challenge for most cases, so a
// pre-merge line there may not know about tonight's vote: it is somebody noticing something.
//   arc.spark.<case>  a (who will run the plan) notices b (who will be the target); c is b's partner
//                     (pair). threat / grudge / pair ({partner}) / group ({theirs}) / outsider / idol;
//                     sank plays after the challenge, and may talk about tonight
//   arc.warn.told     a tells b that {pitcher} is pushing {target} (self: that's b)
//   arc.warn.overheard  b (as a) overhears {pitcher} pushing {target} (self: that's a)
//   arc.adv.<why>     a about to play an advantage tonight; b a confidant, or the ally it's for (idolfor)
//   arc.ally.formed   a, b (c, d) form {group}
// Ids: 'nar.'.

export default {
  // ── the spark ──
  'arc.spark.threat': [
    { id: 'nar.t1', turns: [
      { beat: "{b} finishes the morning chores before anybody else is even up, and starts helping with everybody else's." },
      { by: 'a', say: "Does {b} ever stop?", v: { dry: "Is {b} trying to make the rest of us look bad, or is that just a bonus?" } },
      { by: 'b', say: "What? It needed doing." },
      { by: 'a', conf: "Everybody here loves {b}. {b} is good at challenges, {b} helps everybody, and {b} never seems tired. That's great for the team right now, and terrifying for me later." },
    ] },
    { id: 'nar.t2', turns: [
      { by: 'a', conf: "I've been watching {b} all week. {b} talks to everybody, wins everything, and somehow nobody sees it." },
      { by: 'a', conf: "If I'm the only one who sees it, then I'm the one who has to do something about it.", v: { anxious: "If nobody else sees it, then it's me against {b} at the end, and I'm not sure I win that.", competitive: "I don't lose to people like {b}. I just have to get rid of {b} before it matters." } },
    ] },
  ],
  'arc.spark.grudge': [
    { id: 'nar.g1', turns: [
      { beat: "{a} and {b} reach for the last of the water at the same time." },
      { by: 'b', say: "I had it first." },
      { by: 'a', say: "You always have it first, {b}. That's kind of the problem.", v: { tough: "Of course you did. You always do.", warm: "Okay. Take it. It's fine. It's totally fine." } },
      { by: 'b', say: "What's that supposed to mean?" },
      { by: 'a', conf: "It's not about the water. It's never about the water. {b} has been getting under my skin since the first day, and I'm done pretending it isn't." },
    ] },
    { id: 'nar.g2', turns: [
      { by: 'b', say: "You're doing it wrong, by the way.", v: { cruel: "Wow. You're really bad at this." } },
      { by: 'a', say: "Then do it yourself." },
      { by: 'b', say: "Maybe I will." },
      { beat: "{b} walks off. {a} stays put, gripping the rope much too hard." },
      { by: 'a', conf: "Every single day, {b} finds something I'm doing wrong. One day soon I'm going to return the favour, and it won't be about chores." },
    ] },
  ],
  'arc.spark.pair': [
    { id: 'nar.p1', turns: [
      { beat: "{b} and {c} wander off together again, laughing at something nobody else heard." },
      { by: 'a', conf: "That's the third time today {b} and {c} have gone off on their own. They eat together, they sleep next to each other, and I'd bet they vote together." },
      { by: 'a', conf: "Two votes that always go the same way. That's not a friendship anymore, that's a problem.", v: { warm: "I'm happy for them, I really am. I'm just also counting." } },
    ] },
    { id: 'nar.p2', turns: [
      { by: 'a', say: "Have you noticed {b} and {c} finish each other's sentences now?" },
      { by: 'b', opt: true, say: "We do not." },
      { by: 'c', opt: true, say: "We kind of do." },
      { by: 'a', conf: "It's cute until you realize it means two votes I'll never get. {b} and {c} are going to the end together unless somebody splits them up." },
    ] },
  ],
  'arc.spark.group': [
    { id: 'nar.r1', turns: [
      { beat: "{b} is sitting with the rest of {theirs}, heads close together. They stop talking the moment {a} walks past." },
      { by: 'a', say: "Don't let me interrupt anything." },
      { by: 'b', say: "You're not. We were just talking about lunch.", v: { schemer: "Nothing to interrupt. Sit down if you want." } },
      { by: 'a', conf: "Nobody stops talking about lunch when somebody walks past. {theirs} has a plan, and {b} is right in the middle of it." },
    ] },
  ],
  'arc.spark.outsider': [
    { id: 'nar.o1', turns: [
      { beat: "Everybody's sitting around the fire. {b} is a little way off, on {b.posAdj} own." },
      { by: 'a', say: "Hey, {b}, you can come sit with us, you know." },
      { by: 'b', say: "I'm good here. Thanks, though." },
      { by: 'a', conf: "I try with {b}, I do, but {b} doesn't want in, and out here, if you don't want in, sooner or later you end up out." },
    ] },
    { id: 'nar.o2', turns: [
      { by: 'a', say: "Has anybody actually talked to {b} today?" },
      { beat: "Nobody answers. {b} is down by the water, alone again." },
      { by: 'a', conf: "I don't think {b} is a bad person. I just don't think anybody here would notice if {b} was gone, and that's a dangerous thing to be out here." },
    ] },
    { id: 'nar.o3', turns: [
      { beat: "{b} hovers at the edge of the group while everybody laughs at a story {b} didn't hear." },
      { by: 'b', say: "What's funny?" },
      { by: 'a', say: "Oh, you had to be there." },
      { by: 'b', conf: "I always have to be there. I'm never there. I don't know how everybody got so close so fast.", v: { tough: "Fine. I didn't come here to make friends anyway.", warm: "I'm trying. I really am. I just keep missing the moment." } },
    ] },
    { id: 'nar.o4', turns: [
      { by: 'a', conf: "{b} goes off on {b.posAdj} own every chance {b} gets. I get it, some people need space. But space is how you end up with nobody in your corner." },
    ] },
  ],
  'arc.spark.idol': [
    { id: 'nar.i1', turns: [
      { beat: "{a} watches {b} come back from the trees, alone, for the second time this morning." },
      { by: 'a', say: "Where do you keep going?" },
      { by: 'b', say: "Bathroom. Is that allowed?", v: { calm: "For a walk. I like the quiet.", anxious: "Nowhere! Just, um, the bathroom." } },
      { by: 'a', conf: "Nobody needs the bathroom that much. {b} has been looking for something, and from the way {b} is smiling, I think {b} found it." },
    ] },
  ],
  'arc.spark.sank': [
    { id: 'nar.s1', turns: [
      { beat: "On the walk back from the challenge, {a} slows down until {a} is walking next to {b}." },
      { by: 'a', say: "Hey. You okay?" },
      { by: 'b', say: "I know it was me. You don't have to say it.", v: { tough: "If you're going to say it, just say it.", anxious: "Please don't say it. I already know." } },
      { by: 'a', say: "I wasn't going to say anything." },
      { by: 'a', conf: "I wasn't going to say anything to {b}. I was going to say it to everybody else, later, when {b} isn't around." },
    ] },
    { id: 'nar.s2', turns: [
      { by: 'a', conf: "We had that challenge. We had it, right up until {b} fell apart, and everybody saw it happen." },
      { by: 'a', conf: "I like {b}, but liking people doesn't win challenges, and we can't afford to lose another one.", v: { cruel: "I don't even like {b} that much, so this is going to be easy.", warm: "I feel terrible saying it, but if it's between {b} and somebody who can win, I know what I have to do." } },
    ] },
  ],

  // ── word gets around ──
  'arc.warn.told': [
    { id: 'nar.w1', when: { self: true }, turns: [
      { beat: "{a} finds {b} alone and checks nobody's within earshot." },
      { by: 'a', say: "I need to tell you something, and you can't tell anybody I told you." },
      { by: 'b', say: "Okay...?" },
      { by: 'a', say: "{pitcher} is going around saying your name. For tonight." },
      { by: 'b', say: "{pitcher}? Are you sure?", v: { tough: "{pitcher}. Of course it's {pitcher}.", emotional: "No. No, {pitcher} told me this morning we were good." } },
      { by: 'a', say: "I heard it myself. I'm sorry." },
      { by: 'b', conf: "{a} could have kept that to {a.ref}, and didn't. Now I know who's coming for me, and {pitcher} doesn't know that I know." },
    ] },
    { id: 'nar.w2', when: { self: true }, turns: [
      { by: 'a', say: "Can I be honest with you? Watch out for {pitcher}." },
      { by: 'b', say: "Why? What did {pitcher} say?" },
      { by: 'a', say: "Enough. I'll just say that your name came up, and it wasn't me who brought it up." },
      { by: 'b', say: "Thank you. Seriously." },
      { by: 'a', conf: "I told {b} because I want {b} to owe me one. And because I'd rather {pitcher} didn't get everything {pitcher} wants." },
    ] },
    { id: 'nar.w3', when: { self: false }, turns: [
      { by: 'a', say: "Just so you know, {pitcher} is trying to get votes on {target}." },
      { by: 'b', say: "{target}? Why {target}?" },
      { by: 'a', say: "I don't know yet. But {pitcher} asked me, and I said I'd think about it." },
      { by: 'b', say: "And are you?" },
      { by: 'a', say: "I'm telling you, aren't I?" },
      { by: 'b', conf: "So {pitcher} is moving on {target}, and now I know about it before half the camp does. That's worth something." },
    ] },
    { id: 'nar.w4', when: { self: true }, turns: [
      { by: 'a', say: "Hey. Walk with me for a second." },
      { by: 'b', say: "What's wrong?" },
      { by: 'a', say: "{pitcher} asked me to write your name tonight. I said I'd think about it." },
      { by: 'b', say: "And did you think about it?", v: { anxious: "And? What are you going to do?" } },
      { by: 'a', say: "I'm telling you, aren't I? Find somebody else for {pitcher} to go after, and fast." },
      { by: 'b', conf: "Two minutes ago I thought I was safe. Now I've got until tonight to turn this around." },
    ] },
    { id: 'nar.w5', when: { self: false }, turns: [
      { by: 'a', say: "Don't freak out, but {pitcher} is trying to get people on {target}." },
      { by: 'b', say: "Does {target} know?" },
      { by: 'a', say: "Not yet. I came to you first." },
      { by: 'b', conf: "{a} came to me with that before going to anybody else, which means either {a} trusts me, or {a} wants me to do something about it. Probably both." },
    ] },
  ],
  'arc.warn.overheard': [
    { id: 'nar.h1', when: { self: true }, turns: [
      { beat: "{a} is on the other side of the shelter when {pitcher}'s voice carries over, low and fast." },
      { beat: "{a} hears {a.posAdj} own name, twice, and freezes." },
      { by: 'a', conf: "I wasn't trying to listen. I just heard my name, and then I heard {pitcher} say 'tonight'. That's all I needed to hear.", v: { anxious: "I heard my name. I heard {pitcher} say my name and the word tonight, and I've been shaking ever since.", tough: "{pitcher} is coming for me. Fine. Now I'm coming for {pitcher}." } },
    ] },
    { id: 'nar.h2', when: { self: false }, turns: [
      { beat: "On the way back from the water, {a} catches {pitcher} mid-sentence with somebody behind the trees." },
      { by: 'a', conf: "{pitcher} wants {target} out. I heard it with my own ears. Now I have to decide who I tell, and whether I tell anybody at all." },
    ] },
  ],

  // ── why it comes out tonight ──
  'arc.adv.idol.warned': [
    { id: 'nar.a1', turns: [
      { by: 'a', conf: "{source} told me {pitcher} is getting votes on me tonight, and I believe it, because {pitcher} has barely looked at me all day." },
      { by: 'a', conf: "I've been holding onto this idol for a reason. Tonight is the reason.", v: { anxious: "I was saving it. I wanted to save it for the merge. But I can't go home with it in my bag." } },
    ] },
    { id: 'nar.a2', when: { pair: true }, turns: [
      { by: 'a', say: "{source} says {pitcher} is coming for me." },
      { by: 'b', say: "Then use it. That's what it's for." },
      { by: 'a', say: "If I use it and I'm wrong, everybody knows I had it." },
      { by: 'b', say: "If you don't use it and you're right, you're gone. Pick one." },
      { by: 'a', conf: "{b} is right. I'd rather be the person who wasted an idol than the person who went home holding one." },
    ] },
  ],
  'arc.adv.idol.tipped': [
    { id: 'nar.a3', when: { found: true }, turns: [
      { by: 'a', conf: "Somebody I trust pulled me aside today and told me to be careful tonight. That's all they said, and that's all they needed to say." },
      { by: 'a', conf: "I've got an idol. I've had it {found}. It's coming out tonight.", v: { calm: "I'll play it. Quietly. Then we'll see who looks surprised." } },
    ] },
    { id: 'nar.a4', when: { found: false }, turns: [
      { by: 'a', conf: "I got a warning today. Not much of one, but enough. I'm not taking any chances with the idol in my pocket." },
    ] },
  ],
  'arc.adv.idol.exposed': [
    { id: 'nar.a5', turns: [
      { by: 'a', conf: "People know I have an idol. I can tell from how they look at me, and from how nobody's asking me about tonight." },
      { by: 'a', conf: "If they know, they'll try to split the vote around it, so the safest thing I can do is play it before they get the chance." },
    ] },
  ],
  'arc.adv.idol.paranoid': [
    { id: 'nar.a6', when: { pair: true }, turns: [
      { by: 'a', say: "Be honest. Is it me tonight?" },
      { by: 'b', say: "I don't think so. Nobody's said your name to me." },
      { by: 'a', say: "Nobody's said anything to me at all, and that's what scares me." },
      { by: 'a', conf: "{b} says I'm fine. Everybody says I'm fine. I've heard that before, from people who went home the same night." },
    ] },
    { id: 'nar.a7', turns: [
      { by: 'a', conf: "Everybody's being too nice to me today. Way too nice. I've seen how that ends." },
      { by: 'a', conf: "I don't care if it's paranoid. I'm playing my idol tonight.", v: { dry: "Is it paranoid if they really are all out to get me? Asking for me." } },
    ] },
  ],
  'arc.adv.idol.desperate': [
    { id: 'nar.a8', turns: [
      { by: 'a', conf: "I'm on the bottom, I know I am. I've got nobody left, and nothing except this idol." },
      { by: 'a', conf: "If it's not tonight, it's the next one, so I'm not waiting to find out.", v: { tough: "They think I'm done. Let them think it." } },
    ] },
  ],
  'arc.adv.idol.read': [
    { id: 'nar.a9', turns: [
      { by: 'a', conf: "Nobody told me anything today, but I've been watching who talks to who, and I don't like what I'm seeing." },
      { by: 'a', conf: "My gut says tonight is the night to play it, and my gut has kept me alive this long." },
    ] },
  ],
  'arc.adv.idolfor': [
    { id: 'nar.f1', when: { pair: true }, turns: [
      { by: 'a', say: "I need to ask you something, and I need you to be honest. Do you think it's you tonight?" },
      { by: 'b', say: "I don't know. Maybe. Why?" },
      { by: 'a', say: "No reason." },
      { by: 'a', conf: "{b} has had my back since day one, and I've got an idol in my bag. If it comes down to it, I know who it's for." },
    ] },
  ],
  'arc.adv.extra': [
    { id: 'nar.e1', when: { target: true }, turns: [
      { by: 'a', conf: "I've got an Extra Vote, and tonight I'm using it, because I want {target} gone and I'm not leaving it to anybody else to get it right." },
      { by: 'a', conf: "One vote is a hope. Two votes is a plan.", v: { warm: "I hate using it on {target}, but if it saves somebody I care about, it's worth it." } },
    ] },
    { id: 'nar.e2', when: { target: true, pair: true }, turns: [
      { by: 'a', say: "Remember that thing I told you about? The extra vote?" },
      { by: 'b', say: "Yeah?" },
      { by: 'a', say: "It's {target} tonight. Both of them." },
      { by: 'b', say: "That's going to make it really obvious who wrote what." },
      { by: 'a', say: "I don't care who knows, as long as {target} goes home." },
    ] },
  ],
  'arc.adv.extrafor': [
    { id: 'nar.e3', when: { target: true }, turns: [
      { by: 'a', conf: "They're coming after somebody I care about tonight. My Extra Vote goes on {target}, and if that's not enough, at least I tried." },
    ] },
  ],
  'arc.adv.steal': [
    { id: 'nar.t3', when: { other: true }, turns: [
      { by: 'a', conf: "{other} isn't voting with us tonight, I'm sure of it. I've got a Vote Steal, so {other} doesn't get a vote, and we get an extra one." },
      { by: 'a', conf: "Taking someone's vote in front of everybody is going to make me enemies, so I'd better be right about this.", v: { cruel: "I can't wait to see {other}'s face." } },
    ] },
    { id: 'nar.t7', when: { other: true }, turns: [
      { by: 'a', conf: "I know which way {other} is voting tonight, and it isn't my way. So I'm taking {other}'s vote." },
      { by: 'a', conf: "{other} is going to be furious, and I'll deal with that tomorrow, because tonight it might be the vote that saves me." },
    ] },
  ],
  'arc.adv.block': [
    { id: 'nar.t4', turns: [
      { by: 'a', conf: "I've got a Vote Block, and somebody here is about to find out what it feels like to sit on their hands at tribal." },
    ] },
  ],
  'arc.adv.sole': [
    { id: 'nar.t5', turns: [
      { by: 'a', conf: "Tonight it's just me. Everybody else can vote however they want, and none of it is going to count." },
    ] },
  ],
  'arc.adv.safety': [
    { id: 'nar.t6', turns: [
      { by: 'a', conf: "I've got Safety Without Power. I don't know what's going to happen tonight, and I don't have to. I'm walking out before it does." },
    ] },
  ],

  // ── an alliance forms ──
  'arc.ally.formed': [
    { id: 'nar.l1', turns: [
      { beat: "{a} pulls {b} away from the others for a minute." },
      { by: 'a', say: "Okay, I'm just going to say it. I think we should stick together. Properly." },
      { by: 'b', say: "Like an alliance?" },
      { by: 'a', say: "Like an alliance. We vote together, we tell each other everything, and nobody goes behind anybody's back." },
      { by: 'c', opt: true, say: "I'm in. Do we get a name?" },
      { by: 'a', say: "{group}. I've been thinking about it." },
      { by: 'b', conf: "So now I'm in {group}. It sounds great, and I'm going to hold {a} to every word of it." },
    ] },
    { id: 'nar.l2', when: { third: false }, turns: [
      { by: 'b', say: "Can I ask you something? Who do you trust here?" },
      { by: 'a', say: "Honestly? You. Maybe only you." },
      { by: 'b', say: "Same. So let's make it official." },
      { by: 'a', say: "{group}. You and me, and whoever we decide to bring in." },
      { by: 'a', conf: "It's not about numbers yet. It's about having one person in here who won't lie to me." },
    ] },
    { id: 'nar.l3', when: { third: true }, turns: [
      { beat: "{a}, {b} and {c} end up on the same log after dinner, and nobody leaves." },
      { by: 'c', say: "Is it weird that you two are the only people here I actually like?" },
      { by: 'b', say: "Not weird. Same." },
      { by: 'a', say: "Then let's stop pretending we're not a team. We vote together from now on. {group}." },
      { by: 'c', say: "{group}. Okay. I like it.", v: { goofy: "{group}! We need a handshake. I'm making a handshake." } },
      { by: 'a', conf: "Three people who trust each other. Out here that's not a friendship, that's a majority waiting to happen." },
    ] },
    { id: 'nar.l4', turns: [
      { by: 'a', say: "Look, I'm not going to make a big speech. I think you and I see this game the same way." },
      { by: 'b', say: "I think so too. So what are you asking?" },
      { by: 'a', say: "I'm asking if you'll write the same name as me until it's just us left. {group}, if we need a name." },
      { by: 'b', say: "Deal. But if you lie to me even once, it's over.", v: { warm: "Deal. And I mean it, I'm not going anywhere.", schemer: "Deal. For now." } },
    ] },
    { id: 'nar.l5', when: { third: true }, turns: [
      { by: 'a', say: "Everybody else already has a group. If we don't make one, we're the leftovers." },
      { by: 'b', say: "So we make one." },
      { by: 'c', say: "Out of us? We barely know each other." },
      { by: 'a', say: "We know we're the ones nobody asked. That's enough to start with. {group}." },
      { by: 'b', conf: "{group} is three people who got left out, which isn't much, but it's three votes, and that's more than any of us had this morning." },
    ] },
  ],
};

// ══════════════════════════════════════════════════════════════════════
// td/story/lines/n-defend.js — somebody gives b a hard time, and later somebody stands up for b
// ══════════════════════════════════════════════════════════════════════
// The user, 2026-10-10, of "Why did you stick up for me back there?": "Wix never did that", then "I want
// something specific, but it needs a prior setup, that's how we know it's a good show with continuation".
// So a defence is two scenes. Earlier in the same stretch of the day, the setup (director.js inserts it): the
// critic needles the target in front of people, about something the game really produced ({charge}), and the
// one who'll defend them is there and says nothing yet. Later, the defence calls back to it by name.
//   story.defend.setup.<why>  a = the critic, b = the target, c = the one who'll defend b, d = a second critic
//   why: sank (b came last at {chal}, the team lost), votes (b had votes at the last vote), kit (b's own
//        thing, {thing}), lazy (nothing in the record: b isn't pulling weight, as the critic sees it)
// {charge} is a verb phrase that reads after "I", "you" or a name: "cost us the canoe race", "should be the
// next one to go", "won't stop going on about being a witch", "should be doing a lot more around here".

export default {
  'story.defend.setup.sank': [
    { id: 'ndf.s1', place: 'public', turns: [
      { beat: "{a} is telling everybody {here} exactly whose fault {chal} was, loud enough for {b} to hear." },
      { by: 'a', say: "I'm just saying, if {b} hadn't been so slow at {chal}, we'd have won it." },
      { by: 'd', opt: true, say: "It's true, though. Everybody saw it." },
      { by: 'b', say: "I was trying. You all saw me trying." },
      { by: 'a', say: "Trying isn't the same as winning, though, is it?" },
      { by: 'b', say: "Next time, I'll do better. Okay?" },
      { by: 'a', say: "There might not be a next time for you." },
      { beat: "{b} doesn't answer. Across camp, {c} has stopped to listen." },
      { by: 'b', conf: "Everybody heard {a} say it, and nobody said anything back. I just stood there and took it." },
    ] },
    { id: 'ndf.s2', place: 'public', turns: [
      { by: 'a', say: "Okay, can we talk about {chal}? Because somebody cost us that, and it wasn't me." },
      { by: 'b', say: "You can just say my name, you know." },
      { by: 'a', say: "Fine. {b} cost us {chal}. Happy?" },
      { by: 'd', opt: true, say: "Harsh, but not wrong." },
      { by: 'b', say: "I'm not happy, no." },
      { beat: "{c} looks up from the other side of camp, watching {a}, and says nothing. Yet." },
      { by: 'a', conf: "Somebody had to say it. {b} cost us {chal}, and I'm not pretending otherwise to be nice." },
    ] },
  ],
  'story.defend.setup.votes': [
    { id: 'ndf.v1', place: 'public', turns: [
      { beat: "{b} walks past {here}. {a} doesn't lower {a.posAdj} voice." },
      { by: 'a', say: "{b} already had votes last time. Let's not pretend {b} isn't next." },
      { by: 'd', opt: true, say: "Everybody's thinking it." },
      { by: 'b', say: "I can hear you, you know." },
      { by: 'a', say: "Good. Then you know where you stand." },
      { by: 'b', say: "Wow. You could at least wait until I'm out of earshot." },
      { beat: "{b} keeps walking. {c} watches {b} go, then looks at {a} for a long moment." },
      { by: 'b', conf: "{a} said it right in front of me, like I'm already gone. Maybe I am. I honestly can't tell." },
    ] },
    { id: 'ndf.v2', place: 'public', turns: [
      { by: 'a', say: "Honestly, {b} should be the next one to go. {b} had votes last time for a reason." },
      { by: 'b', say: "I'm sitting right here." },
      { by: 'a', say: "I know. I'm not saying anything I wouldn't say to your face." },
      { by: 'd', opt: true, say: "Neither am I, for the record." },
      { by: 'b', say: "That doesn't make it better." },
      { beat: "{c} has heard every word of it, and doesn't say any." },
      { by: 'a', conf: "{b} had votes last time. I'm just saying out loud what everybody already knows." },
    ] },
  ],
  'story.defend.setup.kit': [
    { id: 'ndf.k1', place: 'public', turns: [
      { beat: "{b} is talking about {thing} {here}, and {a} rolls {a.posAdj} eyes so hard that half the camp sees it." },
      { by: 'a', say: "Does {b} ever talk about anything else? Seriously, has anyone heard {b} talk about anything else?" },
      { by: 'd', opt: true, say: "Not once. Not one single time." },
      { by: 'b', say: "I was just answering a question." },
      { by: 'a', say: "Nobody asked the question. You asked yourself the question." },
      { by: 'b', say: "Okay. I'll stop talking, then." },
      { beat: "A couple of people laugh. {c} doesn't." },
      { by: 'b', conf: "{a} made fun of me in front of everybody, and people laughed. I'm going to stop talking about it, I guess." },
    ] },
    { id: 'ndf.k2', place: 'public', turns: [
      { by: 'a', say: "If I hear one more word about {thing}, I'm walking straight into a wall." },
      { by: 'b', say: "Then don't listen." },
      { by: 'a', say: "I can't not listen. You never stop." },
      { by: 'd', opt: true, say: "It's true, you really don't." },
      { by: 'b', say: "Fine. I'll stop." },
      { beat: "{b} goes quiet. {c}, who's been listening the whole time, is frowning at {a}." },
      { by: 'a', conf: "{b} won't stop going on about {thing}, and somebody had to say it. Everybody was thinking it." },
    ] },
  ],
  'story.defend.setup.lazy': [
    { id: 'ndf.l1', place: 'public', turns: [
      { beat: "{b} sits down for a minute {here}. {a} notices immediately." },
      { by: 'a', say: "Oh, sure, take a break. You've earned it, doing absolutely nothing." },
      { by: 'b', say: "I've been working all morning." },
      { by: 'a', say: "Where? Because I've been watching, and I didn't see it." },
      { by: 'd', opt: true, say: "I didn't see it either." },
      { by: 'b', say: "Then you weren't watching very hard." },
      { beat: "{c} saw {b} working all morning, and doesn't say so. Not yet." },
      { by: 'b', conf: "I've been working since we got up, and {a} just decided I haven't. I don't even know what I did to {a}." },
    ] },
    { id: 'ndf.l2', place: 'public', turns: [
      { by: 'a', say: "Some of us carry this team. And some of us are {b}." },
      { by: 'b', say: "What's that supposed to mean?" },
      { by: 'a', say: "It means {b} should be doing a lot more around here, and everybody knows it." },
      { by: 'd', opt: true, say: "Everybody does know it." },
      { by: 'b', say: "That's not true, and you know it isn't." },
      { beat: "{c} has stopped working to listen, and is looking at {a}." },
      { by: 'a', conf: "{b} should be doing more. If nobody else is going to say it, I will." },
    ] },
  ],
};

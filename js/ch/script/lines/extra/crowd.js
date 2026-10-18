// The scenes that happen in front of people, played in front of people (state.js CROWD_KINDS: two of the room
// join the scene as x and y). The user, 2026-10-16, of a payback said "in front of everybody" between two people
// alone: "it doesnt read well ... we need more 3+ people conversation". Every entry here needs a crowd (when:
// crowd), and x always has something to say; y is there when there is a second one (opt), and nothing after a
// line of y's answers y.
const C = { crowd: true };
export default {
  // ── payback: a lost a friend ({gone}); b is the one who sent them ──
  'payback.calledout': [
    { id: 'cw.pc1', when: C, turns: [
      { beat: 'Dinner. Everybody is at the long table when {a} stands up.' },
      { by: 'a', say: "I'm going to say this once, so everybody hears it. {b} didn't have to pick {gone}." },
      { by: 'b', say: "Sit down, {a}. Eat your food." },
      { by: 'x', say: "No, let {a} talk. I want to hear it." },
      { by: 'a', say: "{b} had a whole list of people to pick from, and {b} picked the one person in this house who never hurt anybody." },
      { by: 'b', say: "I picked the person I thought I could beat. That's what the Arena is." },
      { by: 'y', opt: 1, say: "Then why didn't you pick somebody who voted for you?" },
      { by: 'b', say: "Because I wanted to win. Is everybody done?" },
      { by: 'x', say: "I don't think {a} is done. I think {a} is just getting started." },
      { by: 'b', conf: "{a} turned dinner into a trial, and I was the only one on trial. The worst part is I could see people nodding." },
    ] },
    { id: 'cw.pc2', when: C, turns: [
      { beat: 'The house is around the fire pit. {b} sits down, and {a} gets up to leave.' },
      { by: 'b', say: "Really? You're walking away because I sat down?" },
      { by: 'a', say: "I can't sit next to you tonight. Not after {gone}." },
      { by: 'x', say: "Come on, both of you. {gone} wouldn't want this." },
      { by: 'a', say: "You don't get to tell me what {gone} would want. {gone} is on a plane because of {b}." },
      { by: 'b', say: "{gone} is on a plane because {gone} lost. I was in there too, remember?" },
      { by: 'y', opt: 1, say: "Okay, that was cold." },
      { by: 'a', say: "Enjoy the fire, {b}. I'll be inside, counting votes." },
      { by: 'x', conf: "I tried to keep the peace. Nobody wanted peace. {a} wanted everybody to see the walk-out, and everybody saw it." },
    ] },
  ],
  'payback.voted': [
    { id: 'cw.pv1', when: C, turns: [
      { beat: 'In the kitchen, {a} slams a cupboard shut hard enough that everybody turns around.' },
      { by: 'x', say: "Whoa. What did that cupboard do to you?" },
      { by: 'a', say: "Nothing. Ask {b} what {gone} did. Because {b} stood up and said {gone}'s name." },
      { by: 'b', say: "Along with half the house. I'm not the only one who voted." },
      { by: 'a', say: "I don't care about half the house. I care that you did it." },
      { by: 'y', opt: 1, say: "{b}, you really said {gone}'s name?" },
      { by: 'b', say: "Yes. It was a vote. Everybody in this kitchen has said somebody's name." },
      { by: 'x', say: "That doesn't make it sound better, {b}." },
      { by: 'a', conf: "I wanted everybody in that kitchen to know exactly who {b} is. Now they do." },
    ] },
    { id: 'cw.pv2', when: C, turns: [
      { beat: 'The house is eating dinner when {a} puts down a fork and looks across the table at {b}.' },
      { by: 'a', say: "I just want to say, in front of everybody, so there's no confusion." },
      { by: 'b', say: "Here we go." },
      { by: 'a', say: "{b} said {gone}'s name at the vote. {gone} trusted {b}. So I'm done trusting {b}." },
      { by: 'x', say: "Can we not do this at dinner?" },
      { by: 'a', say: "When else? Everybody's here. That's the point." },
      { by: 'y', opt: 1, say: "{gone} would hate this, you know." },
      { by: 'b', say: "Great. A speech. Anybody else want to go?" },
      { by: 'a', say: "Just remember who said what. I will." },
      { by: 'b', conf: "{a} wants a war at the dinner table. Fine. I've been in a war before, and I'm still here." },
    ] },
  ],
  // ── receipts: b said a's name at a vote ──
  'receipts.owns': [
    { id: 'cw.ro1', when: C, turns: [
      { beat: 'The deck is crowded when {a} walks straight up to {b}.' },
      { by: 'a', say: "You said my name. I want to hear you say it again, here." },
      { by: 'b', say: "Fine. I voted for you. I'd do it again." },
      { by: 'x', say: "Oh, wow." },
      { by: 'a', say: "At least you're honest about being a snake." },
      { by: 'b', say: "I'm honest about playing the game. Everybody on this deck has said somebody's name." },
      { by: 'y', opt: 1, say: "Don't drag the rest of us into it." },
      { by: 'x', say: "Yeah, this is between the two of you." },
      { by: 'a', conf: "{b} didn't even blink. Good. Now everybody on that deck knows {b} will say anybody's name." },
    ] },
  ],
  'receipts.denies': [
    { id: 'cw.rd1', when: C, turns: [
      { beat: 'Lunch by the pool. {a} sits down right across from {b}.' },
      { by: 'a', say: "So. You said my name at the vote." },
      { by: 'b', say: "Why is it me you're asking? Why not everybody else?" },
      { by: 'a', say: "Because I thought you were my friend." },
      { by: 'x', say: "Wait, you voted for {a}? I thought you two were close." },
      { by: 'b', say: "Can everybody stop looking at me? It was one vote. It's a game." },
      { by: 'y', opt: 1, say: "That's not really an answer." },
      { by: 'a', say: "It's all the answer I'm getting. Thanks, {b}." },
      { by: 'a', conf: "{b} couldn't even say why. In front of everybody, {b} just shrugged. That told me plenty." },
    ] },
  ],
  'receipts.apology': [
    { id: 'cw.ra1', when: C, turns: [
      { beat: 'Most of the house is in the common room when {a} comes in and stops in front of {b}.' },
      { by: 'a', say: "I know you said my name. I just want to know why." },
      { by: 'b', say: "I'm sorry. I really am. I didn't think it through, and I should have talked to you first." },
      { by: 'x', say: "At least {b} is saying sorry. Most people in here don't." },
      { by: 'a', say: "Everybody doesn't owe me what {b} owes me." },
      { by: 'b', say: "You're right. I'll make it up to you. I mean it." },
      { by: 'y', opt: 1, say: "Hug it out. Go on. We're all watching." },
      { by: 'a', conf: "{b} said sorry in front of the whole room. That costs something in here, so I'm going to believe it. For now." },
    ] },
  ],
  // ── kitchen-blowup ──
  'kitchen-blowup.any': [
    { id: 'cw.kb1', when: C, turns: [
      { beat: 'Breakfast. Six people, one stove, and {a} is standing in front of an empty egg carton.' },
      { by: 'a', say: "Who used the last of the eggs? There were twelve last night." },
      { by: 'b', say: "I was hungry. I'll get more when the shopping comes." },
      { by: 'a', say: "Twelve eggs, {b}! Twelve!" },
      { by: 'x', say: "I'm going to take my toast and go somewhere quieter." },
      { by: 'b', say: "It's food. It's not a vote. Calm down." },
      { by: 'y', opt: 1, say: "It's a little bit about the eggs, though. Twelve is a lot." },
      { by: 'a', say: "Thank you! Somebody gets it." },
      { by: 'x', conf: "Nobody in that kitchen was really fighting about eggs. Everybody's tired, everybody's scared of the vote, and the eggs were just there." },
    ] },
    { id: 'cw.kb2', when: C, turns: [
      { beat: 'The sink is full again. {a} points at it while the whole kitchen watches.' },
      { by: 'a', say: "Whose are these? Because they've been here since yesterday." },
      { by: 'b', say: "Some of them are mine. Most of them aren't." },
      { by: 'x', say: "None of them are mine, for the record." },
      { by: 'a', say: "Then {b} can start with the ones that are." },
      { by: 'b', say: "I'll do them after I eat. Is that allowed?" },
      { by: 'a', say: "You said that yesterday." },
      { by: 'y', opt: 1, say: "I'll dry if somebody washes. Can we just get it done?" },
      { by: 'b', conf: "I'm not getting yelled at over dishes in front of half the house. If {a} wants a fight, {a} can have one at the vote." },
    ] },
  ],
  // ── party-callout: a calls b out at the club ──
  'party-callout.firesback': [
    { id: 'cw.pf1', when: C, turns: [
      { beat: 'The music drops for a second, and {a} uses it.' },
      { by: 'a', say: "{b}! Since we're all here, tell everybody what your problem with me is." },
      { by: 'x', say: "Oh no. Not tonight. Please not tonight." },
      { by: 'b', say: "You really want to do this at the bar? Fine. My problem is you're all talk. Look at you right now." },
      { by: 'a', say: "All talk? Say that again when you're the one in the Arena." },
      { by: 'b', say: "If I'm ever in there, I'll say it to your face. I won't need a song playing." },
      { by: 'y', opt: 1, say: "Okay, that one landed." },
      { by: 'x', say: "Can somebody get them water? Both of them. Lots of water." },
      { by: 'b', conf: "{a} picked a fight in front of everybody and lost it in front of everybody. I didn't even have to try." },
    ] },
  ],
  'party-callout.walks': [
    { id: 'cw.pw1', when: C, turns: [
      { beat: 'At the bar, {a} turns around and points straight at {b}.' },
      { by: 'a', say: "You've been cold to me all week, and I want to know why. In front of everybody." },
      { by: 'x', say: "Here we go." },
      { by: 'b', say: "I'm not doing this here." },
      { by: 'a', say: "Why not? Everybody's here. Say it to my face for once." },
      { by: 'b', say: "Enjoy your night, {a}." },
      { beat: '{b} puts the drink down and walks out to the terrace.' },
      { by: 'y', opt: 1, say: "Well, that killed the mood." },
      { by: 'x', conf: "{a} wanted a scene and didn't get one. {b} walking away made {a} look worse than any comeback could." },
    ] },
  ],
  // ── fight: the cause line has already said why ──
  'fight.any': [
    { id: 'cw.f1', when: C, turns: [
      { by: 'a', say: "Say that again. Go on. Everybody's listening." },
      { by: 'b', say: "I'm not scared of you, {a}, and I'm not the only one." },
      { by: 'x', say: "Hey. Hey! Both of you, step back." },
      { by: 'a', say: "Stay out of it. This has been coming for a while." },
      { by: 'y', opt: 1, say: "Then let it out at the vote, not in here." },
      { by: 'b', say: "Listen to them, {a}. Go cool off." },
      { by: 'a', say: "I'm cool. I'm very cool. I'm just remembering every word." },
      { by: 'x', conf: "I got between them because somebody had to. Nobody thanked me. Both of them looked at me like I'd picked a side." },
    ] },
    { id: 'cw.f2', when: C, turns: [
      { beat: 'It starts as two voices and turns into the whole room watching.' },
      { by: 'b', say: "Every time I turn around, you're there with something to say." },
      { by: 'a', say: "Because you keep giving me things to say." },
      { by: 'x', say: "Can we please have one day without this?" },
      { by: 'b', say: "Tell {a}. I'm not the one who started it." },
      { by: 'a', say: "Neither of us is going to stop, so you might as well get comfortable." },
      { by: 'y', opt: 1, say: "Popcorn, anybody?" },
      { by: 'x', say: "Not funny. They're going to be like this all the way to the vote." },
      { by: 'b', conf: "The whole house watched us go at it, and I could see them picking sides. That's what scares me. Not {a}." },
    ] },
  ],
  'fight-physical.any': [
    { id: 'cw.fp1', when: C, turns: [
      { beat: '{a} shoves {b}, and {b} shoves back, and suddenly there are hands everywhere.' },
      { by: 'x', say: "STOP! Get off! Get OFF!" },
      { by: 'a', say: "Let go of me! I'm fine!" },
      { by: 'y', opt: 1, say: "You're not fine. Sit down." },
      { by: 'b', say: "Everybody saw that. Everybody saw {a} put hands on me first." },
      { by: 'x', say: "Everybody saw both of you. Nobody's taking sides on this one." },
      { by: 'a', conf: "I lost it, in front of everybody. Now everybody's waiting to see if TJ sends me home." },
    ] },
  ],
  // ── trash-talk: a talks at b ──
  'trash-talk.bites': [
    { id: 'cw.tb1', when: C, turns: [
      { beat: 'Half the house is lying around the pool when {a} starts.' },
      { by: 'a', say: "Hey, {b}. Do you actually think you can win this? I'm asking for everybody." },
      { by: 'x', say: "Ooh. Shots fired." },
      { by: 'b', say: "I'm still here, aren't I?" },
      { by: 'a', say: "So far. That runs out." },
      { by: 'y', opt: 1, say: "That's a little mean, {a}." },
      { by: 'b', say: "Whatever. Think what you want." },
      { beat: '{b} gets up and goes inside a minute later.' },
      { by: 'b', conf: "I acted like it didn't get to me. It got to me. Everybody by that pool heard it, and now everybody's thinking it." },
    ] },
  ],
  'trash-talk.shrugs': [
    { id: 'cw.ts1', when: C, turns: [
      { beat: 'In the middle of the villa, {a} says it loud enough for everybody to hear.' },
      { by: 'a', say: "{b}, you know you're the easiest name in this house, right?" },
      { by: 'b', say: "Then say it at the vote. I'll be right here." },
      { by: 'x', say: "That's the calmest anybody has ever been about that." },
      { by: 'a', say: "Calm now. Wait till it's your name." },
      { by: 'b', say: "Plenty of people have thought that. I'm still here." },
      { by: 'y', opt: 1, say: "Honestly, {a}, that didn't land." },
      { by: 'x', conf: "{a} wanted a reaction and got nothing. In front of everybody, {b} made {a} look like the nervous one." },
    ] },
  ],
  // ── outing: a tells the room about {alliance}; b runs it ──
  'outing.any': [
    { id: 'cw.o1', when: C, turns: [
      { beat: 'The whole house is in the common room when {a} stands up.' },
      { by: 'a', say: "I'm done keeping quiet. {alliance} is real, {b} runs it, and they've decided every vote for weeks." },
      { by: 'b', say: "That's a story. A desperate one." },
      { by: 'x', say: "Is it? Because I've been wondering why the same names keep coming up." },
      { by: 'b', say: "People vote the same way because they agree. That's all a vote is." },
      { by: 'y', opt: 1, say: "Then who's in it? If it's not real, it's an easy question." },
      { by: 'a', say: "Look at who just went quiet. That's your answer." },
      { by: 'x', say: "Okay. I'm going to need to think about my vote." },
      { by: 'b', conf: "{a} said the name of my alliance in a room full of people. I can deny it all I want. Half of them already believe it." },
    ] },
    { id: 'cw.o2', when: C, turns: [
      { beat: 'At dinner, {a} taps a glass with a fork until the table goes quiet.' },
      { by: 'a', say: "Quick question for the table. How many of you have been asked to vote with {alliance} this week?" },
      { by: 'x', say: "What's {alliance}?" },
      { by: 'a', say: "Ask {b}. {b} named it." },
      { by: 'b', say: "This is the most dramatic thing anybody has done with a fork." },
      { by: 'y', opt: 1, say: "You didn't say no, though." },
      { by: 'b', say: "I'm not saying anything. Eat your dinner." },
      { by: 'a', conf: "{b} wanted to laugh it off. Nobody at that table was laughing. Now every vote {alliance} makes, people will be watching." },
    ] },
  ],
  // ── floater-callout: a calls b a floater, in front of the room ──
  'floater-callout.firesback': [
    { id: 'cw.ff1', when: C, turns: [
      { beat: 'The house is on the sofas when {a} turns to {b}.' },
      { by: 'a', say: "Can somebody tell me what {b} has actually done this season? Anybody?" },
      { by: 'x', say: "That's a little harsh." },
      { by: 'b', say: "I've survived every vote you were part of. That's what I've done." },
      { by: 'a', say: "Surviving isn't playing." },
      { by: 'b', say: "Tell that to everybody you've watched go home while I'm still sitting here." },
      { by: 'y', opt: 1, say: "{b} has a point." },
      { by: 'b', conf: "{a} wanted the house to see me as a floater. I made sure they saw me answer back." },
    ] },
  ],
  'floater-callout.takes': [
    { id: 'cw.ft1', when: C, turns: [
      { beat: 'Over lunch, {a} says it loud enough for the whole table.' },
      { by: 'a', say: "Honestly, {b} is just along for the ride. Nobody's scared of {b}." },
      { by: 'x', say: "Wow. With {b} sitting right there." },
      { by: 'b', say: "It's fine. Say what you want." },
      { by: 'y', opt: 1, say: "You're really just going to take that?" },
      { by: 'b', say: "What am I supposed to do, argue about it at lunch?" },
      { by: 'b', conf: "Everybody at that table heard {a} call me a passenger, and I didn't say a word. Maybe that's the problem." },
    ] },
  ],
  // ── deal-broken: a broke the deal, b had it broken on ──
  'deal-broken.vote': [
    { id: 'cw.dv1', when: C, turns: [
      { beat: 'After the vote, by the pool, {b} goes straight for {a} with people still around.' },
      { by: 'b', say: "We had a deal. We shook on it. Everybody here heard you say my name anyway." },
      { by: 'a', say: "Things changed. I had to vote the way I voted." },
      { by: 'x', say: "You two had a deal? Since when?" },
      { by: 'b', say: "Long enough to matter. And {a} just showed everybody what a deal with {a} is worth." },
      { by: 'y', opt: 1, say: "Good to know." },
      { by: 'a', say: "Everybody can think what they want." },
      { by: 'a', conf: "I knew breaking that deal would cost me with {b}. I didn't think about the people standing around listening. That's going to cost me more." },
    ] },
  ],
  'deal-broken.callout': [
    { id: 'cw.dc1', when: C, turns: [
      { beat: 'Back at the villa, {b} stops {a} in front of everybody.' },
      { by: 'b', say: "You promised you'd never call me out. You looked me in the eye." },
      { by: 'a', say: "And then I was the one in the Arena, and I had to pick somebody I could beat." },
      { by: 'x', say: "So the promise only counted while it was easy." },
      { by: 'a', say: "Every promise in here only counts while it's easy." },
      { by: 'y', opt: 1, say: "Remind me never to make a deal with you." },
      { by: 'b', conf: "{a} said it out loud: promises only count while they're easy. Everybody in that room heard it, and nobody's going to forget." },
    ] },
  ],
  // ── leverage-threat: a tells b, in front of people, what happens if b votes a in ──
  'leverage-threat.credible': [
    { id: 'cw.lc1', when: C, turns: [
      { beat: 'In the kitchen, with the whole house getting dinner, {a} says it loud.' },
      { by: 'a', say: "Just so everybody knows. If I go in this week, I'm calling out {b}." },
      { by: 'b', say: "Why me?" },
      { by: 'a', say: "Because you're the one counting votes against me. I can see you doing it." },
      { by: 'x', say: "{a} isn't joking. Look at {a}'s face." },
      { by: 'y', opt: 1, say: "So if you vote {a} in, you're the one going into the Arena with {a}. Got it." },
      { by: 'b', conf: "{a} made sure everybody heard that. Now if I say {a}'s name, I'm the one who has to back it up in there." },
    ] },
  ],
  'leverage-threat.bluff': [
    { id: 'cw.lb1', when: C, turns: [
      { beat: '{a} waits until the room is full, then turns to {b}.' },
      { by: 'a', say: "Put me in the Arena this week, and I'm taking you with me." },
      { by: 'x', say: "Ooh. That's a promise." },
      { by: 'b', say: "Is it? You'd really pick me?" },
      { by: 'a', say: "Try me and find out." },
      { by: 'y', opt: 1, say: "I would not try {a}." },
      { by: 'a', conf: "Would I actually pick {b}? I have no idea. But now the whole room thinks I would, and that's all I need." },
    ] },
  ],
  'leverage-threat.doubted': [
    { id: 'cw.ld1', when: C, turns: [
      { beat: 'On the deck, in front of a few people, {a} squares up to {b}.' },
      { by: 'a', say: "Vote me in, and I'm calling you out. Remember that." },
      { by: 'b', say: "You don't scare me, {a}." },
      { by: 'x', say: "You say a lot of things, {a}." },
      { by: 'a', say: "That was different." },
      { by: 'y', opt: 1, say: "Is that a threat or a wish?" },
      { by: 'b', conf: "{a} tried to scare me in front of a room full of people. It didn't sound scary. It sounded scared." },
    ] },
  ],
  // ── vet-dismisses: a has done this before; b is new ──
  'vet-dismisses.any': [
    { id: 'cw.vd1', when: C, turns: [
      { beat: 'A few of them are on the loungers when {b} starts talking about the next daily.' },
      { by: 'b', say: "I think if we pair up right tomorrow, we can take it." },
      { by: 'a', say: "Listen to the rookie making plans. That's adorable." },
      { by: 'x', say: "Let {b} talk. It was a decent idea." },
      { by: 'a', say: "It's a decent idea for somebody who's never seen a daily go wrong." },
      { by: 'b', say: "Then tell me what goes wrong. Go on, teach me." },
      { by: 'y', opt: 1, say: "Yeah, teach us, oh wise one." },
      { by: 'b', conf: "{a} tried to make me look stupid in front of everybody. It backfired. Now the others think {a} is the one who's scared of me." },
    ] },
    { id: 'cw.vd2', when: { crowd: true, early: false }, turns: [
      { beat: 'At breakfast, {a} looks down the table at {b}.' },
      { by: 'a', say: "Enjoy it while it lasts. Rookies always do great the first week." },
      { by: 'b', say: "It's not the first week." },
      { by: 'x', say: "{b} has a point. We're a while in now." },
      { by: 'a', say: "You'll see. The house always comes for the new faces." },
      { by: 'y', opt: 1, say: "Maybe. Or maybe it comes for whoever talks the most at breakfast." },
      { by: 'a', conf: "I said it to put {b} in place. Everybody at that table heard me, and nobody laughed. That's a bad sign for me." },
    ] },
  ],
  // ── bank-brag: a's bank is {amount} ──
  'bank-brag.firesback': [
    { id: 'cw.bf1', when: C, turns: [
      { beat: 'Everybody is checking the bank board when {a} says it out loud.' },
      { by: 'a', say: "{amount}. Look at that. Who's buying drinks tonight? Me." },
      { by: 'b', say: "You know that number makes you the biggest target in the house, right?" },
      { by: 'x', say: "{b} isn't wrong. Everybody wants half of that." },
      { by: 'a', say: "Then come and take it." },
      { by: 'y', opt: 1, say: "Careful. Somebody might." },
      { by: 'b', conf: "{a} just told the whole house what you win by beating {a} in the Arena. I'll be the one to remind them at the vote." },
    ] },
  ],
  'bank-brag.takes': [
    { id: 'cw.bt1', when: C, turns: [
      { beat: 'At the bank board, {a} taps the number with a finger.' },
      { by: 'a', say: "{amount}. Not bad for a few weeks, right?" },
      { by: 'b', say: "Congratulations. Mine's a lot smaller." },
      { by: 'x', say: "Mine's basically zero, so thanks for that, {a}." },
      { by: 'a', say: "Win something, then. That's how it works." },
      { by: 'y', opt: 1, say: "Easy to say with that much in the bank." },
      { by: 'b', conf: "I didn't argue with {a}. There's no point arguing with a number. But I noticed how quiet the room got." },
    ] },
  ],
  // ── rookie-hazing: a (a vet) puts b (new) to work ──
  'rookie-hazing.plays': [
    { id: 'cw.rp1', when: C, turns: [
      { beat: 'The vets are on the sofas. {a} holds out an empty glass to {b}.' },
      { by: 'a', say: "Rookie. Refill. It's tradition." },
      { by: 'b', say: "Is it? Okay. Anybody else need anything while I'm up?" },
      { by: 'x', say: "Oh, I'll take one too, since you're offering." },
      { by: 'y', opt: 1, say: "Don't do it, {b}. They'll never stop." },
      { by: 'b', say: "It's a glass of water. I can survive a glass of water." },
      { by: 'b', conf: "Let them think I'm the rookie who fetches drinks. The ones who fetch drinks hear everything." },
    ] },
  ],
  'rookie-hazing.refuses': [
    { id: 'cw.rr1', when: C, turns: [
      { beat: 'In the kitchen, {a} points at the pile of pans and then at {b}.' },
      { by: 'a', say: "Rookie job. Have fun." },
      { by: 'b', say: "I did my share this morning. These are yours." },
      { by: 'x', say: "They are yours, {a}. I watched you make the pasta." },
      { by: 'a', say: "Whose side are you on?" },
      { by: 'y', opt: 1, say: "The side of whoever didn't make the mess." },
      { by: 'a', conf: "{b} said no in front of the whole kitchen, and the room took {b}'s side. That's not how this was supposed to go." },
    ] },
  ],
  // ── show-banter: a and b came from different shows ──
  'show-banter.ok': [
    { id: 'cw.sb1', when: C, turns: [
      { beat: 'Around the fire pit, somebody asks who had it hardest before they got here.' },
      { by: 'a', say: "{show_a}. Easy. You haven't lived until you've done a week of {show_a}." },
      { by: 'b', say: "Please. {show_b} would have broken you in two days." },
      { by: 'x', say: "Can we settle this with a vote? We're very good at votes here." },
      { by: 'a', say: "Fine. Hands up for {show_a}." },
      { by: 'y', opt: 1, say: "I'm abstaining. I've never seen either." },
      { by: 'b', conf: "It was the first night in a while nobody talked about the game. We just argued about old shows and laughed. I needed that." },
    ] },
  ],
  'show-banter.sour': [
    { id: 'cw.ss1', when: C, turns: [
      { beat: 'At dinner, {b} brings up {show_b}, and {a} rolls both eyes.' },
      { by: 'a', say: "Here we go. Another story from {show_b}." },
      { by: 'b', say: "At least my show had a challenge in it. What did you do on {show_a}, sit by a pool?" },
      { by: 'x', say: "Okay, it's getting personal." },
      { by: 'a', say: "It got personal when {b} started telling the same story for the tenth time." },
      { by: 'y', opt: 1, say: "It was the ninth time. I've been counting." },
      { by: 'b', conf: "{a} made fun of my show in front of the whole table. I don't care about the show. I care that everybody laughed." },
    ] },
  ],
  // ── bunk-war: a and b share a bunk room ──
  'bunk-war.moved': [
    { id: 'cw.bm1', when: C, turns: [
      { beat: 'Two in the morning. The bunk room is awake, and everybody knows why.' },
      { by: 'a', say: "{b}. You're snoring. Again. All of us are awake." },
      { by: 'x', say: "It's true. I've been counting ceiling tiles for an hour." },
      { by: 'b', say: "Fine! I'll sleep on the sofa. Happy?" },
      { by: 'y', opt: 1, say: "Very. Goodnight." },
      { beat: '{b} grabs a pillow and leaves.' },
      { by: 'b', conf: "I got kicked out of my own bed by a vote. A bunk room vote, but still. I'm going to remember who voted." },
    ] },
  ],
  'bunk-war.stuck': [
    { id: 'cw.bs1', when: C, turns: [
      { beat: 'Lights out. Somebody\'s clothes are all over the floor again, and {a} steps right on a belt buckle.' },
      { by: 'a', say: "{b}! Your stuff is everywhere!" },
      { by: 'b', say: "It's the middle of the night. Go to sleep." },
      { by: 'x', say: "Can we have this fight in the morning? Some of us have a daily tomorrow." },
      { by: 'a', say: "We all have a daily tomorrow!" },
      { by: 'y', opt: 1, say: "Then everybody go to SLEEP." },
      { by: 'x', conf: "Nobody moved anything, nobody went to sleep, and now all of us are tired and angry for the daily. Great." },
    ] },
  ],
  // ── prank: a pranked b ──
  'prank.laughs': [
    { id: 'cw.pl1', when: C, turns: [
      { beat: '{b} opens the fridge, and every single item in it has been wrapped in foil.' },
      { by: 'b', say: "Who did this? WHO did this?" },
      { by: 'x', say: "I've been dying to see your face for twenty minutes." },
      { by: 'a', say: "It's art, {b}. You're welcome." },
      { by: 'b', say: "This is the dumbest thing anybody has ever done. I love it." },
      { by: 'y', opt: 1, say: "The butter is wrapped twice. That's commitment." },
      { by: 'a', conf: "The whole kitchen was laughing. For five minutes nobody was thinking about the vote. That's worth a whole roll of foil." },
    ] },
  ],
  'prank.war': [
    { id: 'cw.pw2', when: C, turns: [
      { beat: '{b} comes out of the shower to find every towel in the villa gone.' },
      { by: 'b', say: "Very funny. Who has the towels?" },
      { by: 'x', say: "Wasn't me. I want that on the record." },
      { by: 'a', say: "Towels? What towels?" },
      { by: 'b', say: "Okay, {a}. Okay. You just started something." },
      { by: 'y', opt: 1, say: "Oh no. It's going to be a war." },
      { by: 'b', conf: "Everybody laughed at me standing there dripping. Fine. Let's see who's laughing when it's {a}'s turn." },
    ] },
  ],
  // ── ranking-beef: a resents b being above a in TJ's rankings ──
  'ranking-beef.laughs': [
    { id: 'cw.kl1', when: C, turns: [
      { beat: 'Right after the rankings, {a} catches {b} in front of the others.' },
      { by: 'a', say: "Above me? Really? TJ needs glasses." },
      { by: 'b', say: "Take it up with TJ. I just live here." },
      { by: 'x', say: "You're both below me, so I'm staying out of it." },
      { by: 'a', say: "Nobody asked you!" },
      { by: 'y', opt: 1, say: "It's a list. It changes every week." },
      { by: 'b', conf: "{a} was annoyed, but we were laughing by the end. It's a list. Next week it'll be somebody else's turn to be mad." },
    ] },
  ],
  'ranking-beef.war': [
    { id: 'cw.kw1', when: C, turns: [
      { beat: 'The rankings are still on the screen when {a} turns on {b}.' },
      { by: 'a', say: "What have you done that I haven't? Tell me. Everybody's listening." },
      { by: 'b', say: "Sounds like a you problem." },
      { by: 'x', say: "Guys, it's only TJ's list. Nobody's voting on it." },
      { by: 'a', say: "It's a target. TJ just put one on me and took one off {b}." },
      { by: 'y', opt: 1, say: "Then maybe stop yelling about it so loud." },
      { by: 'a', conf: "Everybody watched me lose my cool over a list. I know how that looked. I'm still right." },
    ] },
  ],
  // ── gym-flex: a and b in the gym, with an audience ──
  'gym-flex.any': [
    { id: 'cw.gf1', when: C, turns: [
      { beat: 'The gym is busy. {a} and {b} both go for the pull-up bar.' },
      { by: 'a', say: "After you. Actually, no. Watch this." },
      { by: 'b', say: "Twenty. Let's see you do twenty." },
      { by: 'x', say: "I'll count. One. Two. This is going to take a while." },
      { by: 'a', say: "Twenty-one. Your turn." },
      { by: 'y', opt: 1, say: "This is the most competitive pull-up contest in history." },
      { by: 'b', say: "Twenty-two. Next time count faster." },
      { by: 'x', conf: "They were showing off for each other, but they were also showing everybody in that gym exactly who to be scared of." },
    ] },
  ],
  // ── wishlist-leak: a heard b called a the easy pick ({target} is the one b fears) ──
  'wishlist-leak.any': [
    { id: 'cw.wl1', when: C, turns: [
      { beat: 'The house is on the deck when {a} walks out and says it to all of them.' },
      { by: 'a', say: "Fun fact, everybody. If {b} gets voted in, {b} is picking me. Because I'm the easy one." },
      { by: 'b', say: "Who told you that?" },
      { by: 'x', say: "So it's true?" },
      { by: 'a', say: "{b} won't touch {target}. Too scared. So {b} is coming for me instead." },
      { by: 'a', say: "Go ahead, {b}. Pick me. See how easy I am." },
      { by: 'y', opt: 1, say: "I would not want to be {b} right now." },
      { by: 'b', conf: "I said that in private. Somebody repeated it, and now it's on the deck in front of everybody. I know exactly who to stop trusting." },
    ] },
  ],
};

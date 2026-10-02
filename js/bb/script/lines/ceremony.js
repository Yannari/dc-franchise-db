// ══════════════════════════════════════════════════════════════════════
// bb/script/lines/ceremony.js — what people say at the week's ceremonies
// ══════════════════════════════════════════════════════════════════════
//
// Spec 2026-10-01 Phase 4. The format's own words ("This is the nomination
// ceremony", "By a vote of...") stay in the viewer; these are the houseguests'.
// Every ceremony was decided before a word was picked (bb/script/ceremony.js
// reads the act): who won, who went up, who came down, who went home.
//
// A key's '.any' pool is merged with each of its endings, so an ending's own
// lines carry what is particular to it and '.any' carries what fits them all.
//
// Roles, by family:
//   hoh.win        a  the new Head of Household
//   noms.speech    a  the HOH;  b  the target (or the first nominee);  c  the other nominee
//   noms.dr        a  a nominee;  b  the HOH who put them there
//   veto.win       a  the veto winner;  b  the HOH
//   veto.plea      a  a nominee;  b  the veto holder
//   veto.dr        a  the veto holder;  b  the nominee it is about
//   veto.renom     a  the replacement nominee;  b  whoever named them
//   evict.goodbye  a  the evicted houseguest;  b  the friend they hug last

export default {
  // ── winning Head of Household ─────────────────────────────────────
  'hoh.win.any': [
    { id: 'hw.a1', turns: [
      { by: 'a', say: 'Yes! Oh my god. Yes!' },
      { beat: 'The house claps. Some of it means it.' },
      { by: 'a', dr: 'For one week, nobody in this house can touch me. I intend to enjoy every second of it.' },
    ] },
    { id: 'hw.a2', turns: [
      { by: 'a', say: 'Okay. Okay! Breathe.' },
      { by: 'a', dr: "Everybody who ignored me in the kitchen is about to remember my name. Funny how that works." },
    ] },
    { id: 'hw.a3', turns: [
      { by: 'a', say: 'Head of Household. Somebody say it again.' },
      { beat: 'Nobody says it again.' },
      { by: 'a', dr: "I could see the faces. Half of them were happy for me and the other half were doing maths." },
    ] },
    { id: 'hw.a4', turns: [
      { by: 'a', say: 'I needed that. I really needed that.' },
      { by: 'a', dr: 'Now the hard part starts. Everyone is about to be my best friend, and I have to work out who means it.' },
    ] },
    { id: 'hw.a5', turns: [
      { beat: '{a} drops to the floor and lies there, arms out.' },
      { by: 'a', say: "I'm not getting up. Somebody bring me my key." },
      { by: 'a', dr: 'My legs are shaking, my heart is going a hundred miles an hour, and I have never been happier.' },
    ] },
    { id: 'hw.a6', turns: [
      { by: 'a', say: "Nobody panic. I'm a reasonable person." },
      { beat: 'Somebody laughs. It is not a relaxed laugh.' },
      { by: 'a', dr: 'I am a reasonable person. I am also going to nominate two of them on Saturday.' },
    ] },
    { id: 'hw.a7', turns: [
      { by: 'a', say: 'Thank you, thank you. Hugs are open. Deals are not. Yet.' },
      { by: 'a', dr: "By tonight there'll be a queue outside my door. I'm going to let every one of them talk, and I'm going to believe about half." },
    ] },
    { id: 'hw.a8', turns: [
      { by: 'a', say: 'Did that just happen? Tell me that just happened.' },
      { by: 'a', dr: 'I want to scream. I want to call home. I want to see which of them comes up those stairs first.' },
    ] },
    { id: 'hw.a9', turns: [
      { beat: '{a} hugs the nearest person, then the next one, then stops short of one person and offers a high five instead.' },
      { by: 'a', dr: 'I hugged the people I needed to hug. The rest got a high five. They know what that means.' },
    ] },
    { id: 'hw.a10', turns: [
      { by: 'a', say: "I'm going to be fair. I promise everyone, I'm going to be fair." },
      { by: 'a', dr: "Fair is a word you say when you've already decided and you want the house to sleep tonight." },
    ] },
    { id: 'hw.a11', when: { late: true }, turns: [
      { by: 'a', say: 'This late? Now? Yes!' },
      { by: 'a', dr: "This is the most important week I'll ever be Head of Household. Every name I put up from here is somebody who could sit on my jury." },
    ] },
    { id: 'hw.a12', when: { late: true }, turns: [
      { by: 'a', say: "One more week. I've bought myself one more week." },
      { by: 'a', dr: "With this few people left, safety is everything. I don't have to campaign, I don't have to beg. I just have to choose." },
    ] },
    { id: 'hw.a13', when: { villain: true }, turns: [
      { by: 'a', say: "Don't look so worried. Some of you, anyway." },
      { by: 'a', dr: "I've been nice for long enough. This week the house finds out what I actually think of them." },
    ] },
    { id: 'hw.a14', when: { nice: true }, turns: [
      { by: 'a', say: "I can't believe it. Guys, I can't believe it." },
      { by: 'a', dr: "I hate this part already. I'm going to have to look two people in the eye and put them on the block." },
    ] },
    { id: 'hw.a15', turns: [
      { by: 'a', say: "Somebody get me a towel. And the key. Mostly the key." },
      { by: 'a', dr: "That room upstairs is mine for a week. The bed, the snacks, the shower with actual pressure. And the nominations." },
    ] },
    { id: 'hw.a16', turns: [
      { by: 'a', say: "Is it real? Somebody pinch me. Not you. Somebody nice." },
      { by: 'a', dr: "I know exactly who just started being nervous. I watched their faces when they called my name." },
    ] },
    { id: 'hw.a17', turns: [
      { beat: '{a} punches the air, then remembers the cameras and tries to look humble.' },
      { by: 'a', dr: "Humble lasted about four seconds. I'm Head of Household. I'm allowed a little bit of a strut." },
    ] },
    { id: 'hw.a18', turns: [
      { by: 'a', say: "Group hug! Everybody! Even the people who look worried!" },
      { by: 'a', dr: "Especially the people who look worried. I want them close, where I can see them." },
    ] },
    { id: 'hw.rs1', when: { register: 'schemer' }, turns: [
      { by: 'a', say: "Oh, don't look so scared, everybody. I'm sure I'll be very fair." },
      { by: 'a', dr: "I already know who's going up. I knew before I'd stopped running. Now I get to watch them come up the stairs and beg." },
    ] },
    { id: 'hw.rs2', when: { register: 'schemer' }, turns: [
      { beat: '{a} smiles at the room, slowly, one face at a time.' },
      { by: 'a', dr: "Power suits me. I've always thought so. Now everybody else gets to find out." },
    ] },
    { id: 'hw.rf1', when: { register: 'fiery' }, turns: [
      { by: 'a', say: "YES! LET'S GO! WHO'S LAUGHING NOW?" },
      { by: 'a', dr: "Every single person who talked down to me this week, I hope you enjoyed it. Because the ride's over." },
    ] },
    { id: 'hw.rf2', when: { register: 'fiery' }, turns: [
      { by: 'a', say: "Don't come near me, I'm shaking! I'm SHAKING!" },
      { by: 'a', dr: "I've been angry all week. Now I've got the keys. That's a very dangerous combination, and I love it." },
    ] },
    { id: 'hw.ry1', when: { register: 'shy' }, turns: [
      { by: 'a', say: "Oh. Oh no. Wait, I won? Me?" },
      { by: 'a', dr: "I've kept my head down since I walked in, and that was the plan. Nobody's going to overlook me now." },
    ] },
    { id: 'hw.ry2', when: { register: 'shy' }, turns: [
      { beat: '{a} covers {a.posAdj} face with both hands while the house claps.' },
      { by: 'a', dr: "Everybody looking at me at once is my worst nightmare. And now they'll be looking at me all week." },
    ] },
    { id: 'hw.rw1', when: { register: 'sweet' }, turns: [
      { by: 'a', say: "I'm so sorry. I'm sorry! I'm so happy, but I'm sorry!" },
      { by: 'a', dr: "I want to celebrate, I really do. But in five days I have to hurt two people I like, and I can already feel it." },
    ] },
    { id: 'hw.rw2', when: { register: 'sweet' }, turns: [
      { by: 'a', say: "Everybody's coming up to see the room. Everybody. I mean it." },
      { by: 'a', dr: "Some people use the HOH room to scare the house. I'd rather use it to make friends. Mostly." },
    ] },
    { id: 'hw.rc1', when: { register: 'competitor' }, turns: [
      { by: 'a', say: "That's how you do it! Did everyone see my time?" },
      { by: 'a', dr: "People said I was all muscle and no plan. The plan was to win. Look at that." },
    ] },
    { id: 'hw.rc2', when: { register: 'competitor' }, turns: [
      { by: 'a', say: "I trained my whole life for this. Well. Not this exactly. But this!" },
      { by: 'a', dr: "Competitions are where I'm comfortable. The talking afterwards is the part I have to work at." },
    ] },
    { id: 'hw.rk1', when: { register: 'cool' }, turns: [
      { by: 'a', say: "Thanks, everyone. Really." },
      { by: 'a', dr: "I didn't scream. I didn't cry. I just watched who clapped first and who clapped last. That's the real information." },
    ] },
    { id: 'hw.rk2', when: { register: 'cool' }, turns: [
      { beat: '{a} smiles, nods, and says almost nothing.' },
      { by: 'a', dr: "The win is the easy part. The next five days are the game." },
    ] },
  ],
  'hoh.win.first': [
    { id: 'hw.f1', turns: [
      { by: 'a', say: 'My first one! My first Head of Household!' },
      { by: 'a', dr: "I've been sitting quiet, letting other people take the heat. Now it's my turn to hold the keys." },
    ] },
    { id: 'hw.f2', turns: [
      { by: 'a', say: 'Finally. Finally!' },
      { by: 'a', dr: 'I have watched other people run this house from that room upstairs. Tonight I get to see what it looks like from the bed.' },
    ] },
    { id: 'hw.f3', when: { early: true }, turns: [
      { by: 'a', say: 'Week one! I won week one!' },
      { by: 'a', dr: 'Nobody knows anybody yet. Whatever I do this week, the whole house will remember it as who I am.' },
    ] },
    { id: 'hw.f4', turns: [
      { by: 'a', say: "Oh, I'm going to cry. Don't let me cry." },
      { by: 'a', dr: "People had me down as someone who doesn't win things. I'd like them all to update their notes." },
    ] },
    { id: 'hw.f5', when: { early: false }, turns: [
      { by: 'a', say: 'About time, right? About time!' },
      { by: 'a', dr: "I've lost every competition so far. I was starting to think the house had stopped watching me. Good. They'll be watching now." },
    ] },
    { id: 'hw.f6', turns: [
      { by: 'a', say: "I've never won anything in my life. Not a raffle. Nothing." },
      { by: 'a', dr: 'And the first thing I ever win comes with a room, a camera and the power to send somebody home. No pressure.' },
    ] },
  ],
  'hoh.win.again': [
    { id: 'hw.g1', turns: [
      { by: 'a', say: "Back upstairs. Did you miss me?" },
      { by: 'a', dr: "Second time around, I know exactly how this goes. Everybody's nice to you on Thursday and nobody tells you the truth until Saturday." },
    ] },
    { id: 'hw.g2', turns: [
      { by: 'a', say: 'Again! Again, again, again!' },
      { by: 'a', dr: "Yes, I've got a target on my back for winning this. But the target's only a problem when you lose." },
    ] },
    { id: 'hw.g3', turns: [
      { beat: 'A few people clap. One of them does not bother pretending.' },
      { by: 'a', dr: "The more I win, the more they hate it. I can live with that. I can't live with packing my bag." },
    ] },
    { id: 'hw.g4', turns: [
      { by: 'a', say: "I know, I know. I'm sorry. Actually, I'm not sorry." },
      { by: 'a', dr: 'I already know what the room looks like. This time I want my nominations decided before I have even unpacked.' },
    ] },
    { id: 'hw.g5', turns: [
      { by: 'a', say: "Somebody had to win it. It might as well be me. Again." },
      { by: 'a', dr: "Last time I played it safe. This time I'm not playing safe." },
    ] },
    { id: 'hw.g6', turns: [
      { by: 'a', say: 'Two for me! Count them!' },
      { by: 'a', dr: 'People are going to call me a competition threat. They can call me that from the jury house.' },
    ] },
  ],
  'hoh.win.saved': [
    { id: 'hw.s1', turns: [
      { by: 'a', say: "Last week I was on the block. This week I've got the keys. Life is funny." },
      { by: 'a', dr: "I remember every name that was whispered about me last week. Every single one." },
    ] },
    { id: 'hw.s2', turns: [
      { by: 'a', say: 'From the block to the bed upstairs!' },
      { by: 'a', dr: "A few days ago I was writing my goodbye speech in my head. Now I get to write somebody else's." },
    ] },
    { id: 'hw.s3', turns: [
      { beat: '{a} looks straight across the room before the house has finished clapping.' },
      { by: 'a', dr: "They tried to send me home and they missed. That's the most dangerous thing you can do in this game." },
    ] },
    { id: 'hw.s4', turns: [
      { by: 'a', say: "Nobody's going to try that again, right? Right?" },
      { by: 'a', dr: "I didn't win this for power. I won it because I couldn't survive another week sitting in that chair." },
    ] },
    { id: 'hw.s5', turns: [
      { by: 'a', say: 'I am safe. I am safe!' },
      { by: 'a', dr: "Last week was the scariest week of my life. This one is going to be the scariest week of somebody else's." },
    ] },
    { id: 'hw.s6', turns: [
      { by: 'a', say: "You couldn't get rid of me. Now look." },
      { by: 'a', dr: "I'm not angry. I'm organised. There's a difference, and they'll learn it on Saturday." },
    ] },
  ],

  // ── the nomination speech, after the last key turns ─────────────────
  // b is the target and c the pawn; the HOH says so, the way the show's HOHs do.
  'noms.speech.pawn': [
    { id: 'ns.p1', turns: [
      { by: 'a', say: "{c}, you know we talked about this. You're up there as a pawn, and I'll stand by that." },
      { by: 'a', say: "{b}, I don't think this is a surprise. We've never been on the same page." },
    ] },
    { id: 'ns.p2', turns: [
      { by: 'a', say: "{c}, you're not my target. I needed somebody I trust up there, and you said yes." },
      { by: 'a', say: "{b}, I'll be honest with you. You are." },
    ] },
    { id: 'ns.p3', when: { band: ['cold', 'enemies'] }, turns: [
      { by: 'a', say: "{b}, I don't think we've had a real conversation since we walked through that door, and I think you're playing a game against me." },
      { by: 'a', say: "{c}, you're safe with me. Win the veto if you can, but you're not the one I want out." },
    ] },
    { id: 'ns.p4', turns: [
      { by: 'a', say: "This isn't personal, {c}. I needed somebody I trust sitting next to {b}." },
      { by: 'a', say: "{b}, it isn't personal for you either. It's strategic, and I think you'd have done the same to me." },
    ] },
    { id: 'ns.p5', when: { band: ['cold', 'enemies'] }, turns: [
      { by: 'a', say: "{b}, you've been campaigning against me since the day I walked in. I've heard all of it." },
      { by: 'a', say: "{c}, I'm sorry. You're the pawn. Nobody is coming after you this week." },
      { by: 'b', dr: 'A pawn. Sure. I have heard that word in this house before, and it never means what it says.' },
    ] },
    { id: 'ns.p6', turns: [
      { by: 'a', say: "{c}, I trust you. That's the only reason you're up there." },
      { by: 'a', say: "{b}, I don't. That's the reason you're up there." },
    ] },
    { id: 'ns.p7', when: { band: ['cold', 'enemies'] }, turns: [
      { by: 'a', say: "{b}, I tried to work with you, and every time I did, it came back to me through somebody else." },
      { by: 'a', say: "{c}, I need you to stay calm and trust me. I've got you." },
    ] },
    { id: 'ns.p8', turns: [
      { by: 'a', say: "One of you is up here because I asked a favour. The other one knows exactly why they're up here." },
      { beat: '{b} does not look at {a}. {c} does, and nods.' },
    ] },
    { id: 'ns.p9', when: { early: false }, turns: [
      { by: 'a', say: "{c}, thank you for taking a seat for me. I won't forget it." },
      { by: 'a', say: "{b}, I've watched you run this house from the couch for weeks. Somebody had to stop it." },
    ] },
    { id: 'ns.p10', turns: [
      { by: 'a', say: "{b}, I think you're one of the strongest players in this house, and that's why you're sitting there." },
      { by: 'a', say: "{c}, you're up as a pawn, nothing else. You have my word." },
      { by: 'c', dr: 'My word, my word. Everyone in this house is very generous with their word.' },
    ] },
    { id: 'ns.p11', turns: [
      { by: 'a', say: "{c}, we're good. You know we're good." },
      { by: 'a', say: "{b}, I'm not going to pretend with you. I'd like you to go home this week." },
      { by: 'b', dr: 'At least it was honest. I can work with honest. I can campaign against honest.' },
    ] },
    { id: 'ns.p12', when: { band: ['cold', 'enemies'], early: false }, turns: [
      { by: 'a', say: "{b}, you put my name out there last week. I heard about it before you'd finished the sentence." },
      { by: 'a', say: "{c}, you've got nothing to worry about. I needed a second chair." },
    ] },
    { id: 'ns.p13', when: { early: true }, turns: [
      { by: 'a', say: "{c}, I know you're a pawn and I know it's week one. Keep your head down and you'll be fine." },
      { by: 'a', say: "{b}, I just don't know you, and you haven't tried to let me." },
    ] },
    { id: 'ns.p14', when: { late: true }, turns: [
      { by: 'a', say: "{c}, there aren't many of us left, and I need someone up there I trust. That's you." },
      { by: 'a', say: "{b}, you're the one I can't beat at the end. I think you'd say the same about me." },
    ] },
  ],
  'noms.speech.target': [
    { id: 'ns.t1', turns: [
      { by: 'a', say: "{b}, I think you know why you're sitting there." },
      { by: 'a', say: "{c}, I'm sorry. I had to put two people up, and you were the one I knew least." },
    ] },
    { id: 'ns.t2', turns: [
      { by: 'a', say: "I don't think either of you is surprised." },
      { by: 'b', dr: 'Surprised? No. Thrilled? Also no.' },
    ] },
    { id: 'ns.t3', when: { band: ['cold', 'enemies'] }, turns: [
      { by: 'a', say: "{b}, you've been gunning for me. I've just done it first." },
      { by: 'a', say: "{c}, you've made it pretty clear where your loyalty is, and it isn't with me." },
    ] },
    { id: 'ns.t4', turns: [
      { by: 'a', say: "I'm not going to stand here and lie to anybody. I'd be fine with either of you leaving." },
      { by: 'c', dr: "Well. That's one way to do it." },
    ] },
    { id: 'ns.t5', turns: [
      { by: 'a', say: "{b}, you're a big threat in this game. I'd rather face you now than in a month." },
      { by: 'a', say: "{c}, it's a game move. Nothing more." },
    ] },
    { id: 'ns.t6', turns: [
      { by: 'a', say: "I'm not going to make a big speech. You know where you stand, and I know where I stand." },
    ] },
    { id: 'ns.t7', when: { band: ['cold', 'enemies'] }, turns: [
      { by: 'a', say: "{b}, everyone in this house has a story about you. I've heard most of them this week." },
      { by: 'b', dr: 'Funny. I could tell a few about {a}.' },
    ] },
    { id: 'ns.t8', turns: [
      { by: 'a', say: "{c}, I don't dislike you. I just don't trust you yet." },
      { by: 'a', say: "{b}, I don't dislike you either. But I'm not going to sleep easier until you're out of this house." },
    ] },
    { id: 'ns.t9', turns: [
      { by: 'a', say: "These were the hardest keys I've ever turned. That's the truth." },
      { by: 'c', dr: "Hard for who? {a.Sub} looked fine to me." },
    ] },
    { id: 'ns.t10', turns: [
      { by: 'a', say: "{b}, {c}, play hard for the veto. I'd expect nothing less." },
      { by: 'a', dr: "I want {b} out. If {c} wins the veto, I've got a second plan. If {b} wins it, I'm in trouble." },
    ] },
    { id: 'ns.t11', when: { late: true }, turns: [
      { by: 'a', say: "There's nobody left in this house I'd call easy to nominate. You two are the ones I'd least like to sit next to at the end." },
    ] },
    { id: 'ns.t12', when: { band: ['cold', 'enemies'], early: false }, turns: [
      { by: 'a', say: "{b}, you've had my name in your mouth for two weeks. Now I've got yours on this screen." },
    ] },
  ],
  'noms.speech.expendables': [
    { id: 'ns.e1', turns: [
      { by: 'a', say: "This isn't personal. I had to put two people up, and I went with the people I've connected with least." },
    ] },
    { id: 'ns.e2', turns: [
      { by: 'a', say: "I don't have a target this week. I want to be clear about that." },
      { by: 'a', say: "{b}, {c}, we just haven't talked much. That's all this is." },
      { by: 'b', dr: "No target. Right. Then why am I the one sitting in this chair?" },
    ] },
    { id: 'ns.e3', turns: [
      { by: 'a', say: "I'm not coming after either of you. I don't know either of you well enough to come after you." },
      { by: 'c', dr: "So I'm on the block for being polite and keeping to myself. Lesson learned." },
    ] },
    { id: 'ns.e4', turns: [
      { by: 'a', say: "I've got people I trust in this house, and you two just aren't there yet. I'm sorry." },
    ] },
    { id: 'ns.e5', turns: [
      { by: 'a', say: "I'm going to let the house decide this one. I'm not campaigning against anybody." },
      { by: 'a', dr: "If I'm honest, I don't care much which of them goes. That's why they're up there." },
    ] },
    { id: 'ns.e6', turns: [
      { by: 'a', say: "{b}, {c}, this is a numbers week. You weren't in my numbers." },
      { by: 'c', dr: "A numbers week. That's a nice way of saying I don't have friends." },
    ] },
    { id: 'ns.e7', turns: [
      { by: 'a', say: "Neither of you has done anything to me. That's the truth, and I hope you'll remember I said it." },
    ] },
    { id: 'ns.e8', turns: [
      { by: 'a', say: "Win the veto, both of you, if you can. I'll be cheering for whoever does." },
      { by: 'b', dr: '{a} put me up and then said "good luck". I am not sure what to do with that.' },
    ] },
  ],
  // The real target is not on the block, and the HOH does not say so.
  'noms.speech.backdoor': [
    { id: 'ns.b1', turns: [
      { by: 'a', say: "Neither of you is my target. I'll say it in front of everybody. Neither of you." },
      { by: 'a', dr: "My target is sitting on that couch, smiling, thinking they're safe. Let them think it." },
    ] },
    { id: 'ns.b2', turns: [
      { by: 'a', say: "{b}, {c}, you're both pawns this week. Nobody is going home from those seats if I can help it." },
      { by: 'a', dr: 'Now I need somebody else to come off the couch and onto that block. The veto is everything.' },
    ] },
    { id: 'ns.b3', turns: [
      { by: 'a', say: "I trust both of you. That's why you're the ones sitting there." },
      { beat: 'Across the room, somebody relaxes. {a} watches them do it.' },
    ] },
    { id: 'ns.b4', turns: [
      { by: 'a', say: "This week isn't about either of you. I just need you to sit tight for a few days." },
      { by: 'c', dr: "Sit tight. On the block. Easy for {a.obj} to say from upstairs." },
    ] },
    { id: 'ns.b5', turns: [
      { by: 'a', say: "{b}, {c}, we've talked about this. Play in the veto, and if either of you wins, use it." },
      { by: 'a', dr: 'If one of them comes down, I get to put up the person I actually want. That person has no idea.' },
    ] },
    { id: 'ns.b6', turns: [
      { by: 'a', say: "You're both safe with me, and I mean it. This is about the bigger picture." },
      { by: 'b', dr: "The bigger picture. {a} has a plan, and I'm part of it whether I like it or not. I hope it works, because I'm the one on the block." },
    ] },
    { id: 'ns.b7', turns: [
      { by: 'a', say: "Nobody at this table should panic yet. Things change this week." },
      { by: 'a', dr: "A backdoor only works if nobody sees the door. So I smile, and I wait for the veto." },
    ] },
    { id: 'ns.b8', turns: [
      { by: 'a', say: "{b}, {c}, I'm sorry. It's a game move, and you both know where I really stand." },
    ] },
  ],

  // ── a nominee in the Diary Room, after the ceremony ─────────────────
  'noms.dr.any': [
    { id: 'nd.a1', turns: [{ by: 'a', dr: 'Seeing my face come up on that screen was a punch in the stomach. I knew it was coming and it still hurt.' }] },
    { id: 'nd.a2', turns: [{ by: 'a', dr: "I'm on the block. Fine. The veto's in two days, and I've never wanted to win something so badly." }] },
    { id: 'nd.a3', turns: [{ by: 'a', dr: '{b} can call it strategy. From where I was sitting, it felt personal.' }] },
    { id: 'nd.a4', turns: [{ by: 'a', dr: "I smiled. I said \"no hard feelings\". I have a lot of hard feelings." }] },
    { id: 'nd.a5', turns: [{ by: 'a', dr: "The second that key turned, every conversation I've had in this house started replaying in my head. Which one put me here?" }] },
    { id: 'nd.a6', turns: [{ by: 'a', dr: "I'm not going home this week. I'm not. I'll win that veto with my teeth if I have to." }] },
    { id: 'nd.a7', turns: [{ by: 'a', dr: "My first thought was my family watching at home. My second thought was who's going to vote for me." }] },
    { id: 'nd.a8', turns: [{ by: 'a', dr: 'You can tell who\'s glad you\'re up there. They hug you a little too hard.' }] },
    { id: 'nd.a9', turns: [{ by: 'a', dr: "I need a majority to stay. Right now I can count one vote I'm sure of, and I'm not even sure of that one." }] },
    { id: 'nd.a10', turns: [{ by: 'a', dr: "I'm calm. I'm very calm. Please don't look at my hands." }] },
    { id: 'nd.a11', turns: [{ by: 'a', dr: "I came here to play, not to sit around and get comfortable. Being on the block is part of playing. I'll get off it." }] },
    { id: 'nd.a12', turns: [{ by: 'a', dr: "There's a chair in the living room with my name on it now. I'd like it to have somebody else's by Monday." }] },
    { id: 'nd.a13', when: { late: true }, turns: [{ by: 'a', dr: "This close to the end, every week on the block could be the one. I didn't get this far to leave now." }] },
    { id: 'nd.a14', when: { early: true }, turns: [{ by: 'a', dr: "Nominated in the first days. Nobody even knows me yet. I'm going to have to make them, fast." }] },
    { id: 'nd.a15', turns: [{ by: 'a', dr: "I keep looking at that screen and thinking it's a mistake. It's not a mistake. It's my face." }] },
    { id: 'nd.a16', turns: [{ by: 'a', dr: "The worst part isn't the block. It's the hug from {b} afterwards. Don't hug me. Just don't." }] },
    { id: 'nd.a17', turns: [{ by: 'a', dr: "I've got four days to change about six minds. I've done harder things. I think." }] },
    { id: 'nd.a18', turns: [{ by: 'a', dr: "Okay. Deep breath. Nobody wins this game without sitting in that chair at least once." }] },
    { id: 'nd.a19', turns: [{ by: 'a', dr: "{b} looked at everybody at that table except me. That told me everything." }] },
    { id: 'nd.a20', turns: [{ by: 'a', dr: "I'm going to be the nicest, most helpful, most charming person in this house for the next four days. And then I'm getting revenge." }] },
    { id: 'nd.a21', turns: [{ by: 'a', dr: "My name. On the screen. In front of everyone. I need a minute." }] },
    { id: 'nd.a22', turns: [{ by: 'a', dr: "Everyone keeps saying \"you'll be fine\". Nobody who's actually fine has ever been told they'll be fine." }] },
    { id: 'nd.rs1', when: { register: 'schemer' }, turns: [{ by: 'a', dr: "{b} thinks putting me up was a power move. It was a mistake. {b} just doesn't know it yet." }] },
    { id: 'nd.rs2', when: { register: 'schemer' }, turns: [{ by: 'a', dr: "Fine. I'm on the block. I've got four days and a list of everyone's secrets. Let's see who blinks first." }] },
    { id: 'nd.rf1', when: { register: 'fiery' }, turns: [{ by: 'a', dr: "I wanted to flip the table. I didn't. Somebody give me a medal for that." }] },
    { id: 'nd.rf2', when: { register: 'fiery' }, turns: [{ by: 'a', dr: "{b} put me up and then had the nerve to look sad about it? Don't look sad. Own it!" }] },
    { id: 'nd.ry1', when: { register: 'shy' }, turns: [{ by: 'a', dr: "I kept my head down so this wouldn't happen. Turns out keeping your head down just makes you easy to put up." }] },
    { id: 'nd.ry2', when: { register: 'shy' }, turns: [{ by: 'a', dr: "Now I have to go and talk to everybody. Talking to everybody is the thing I'm worst at. Brilliant." }] },
    { id: 'nd.rw1', when: { register: 'sweet' }, turns: [{ by: 'a', dr: "I've been nice to everyone in this house. Every single person. And it still got me here." }] },
    { id: 'nd.rw2', when: { register: 'sweet' }, turns: [{ by: 'a', dr: "I'm not angry with {b}. I'm hurt. Which is worse, honestly, because I can't even shout about it." }] },
    { id: 'nd.rc1', when: { register: 'competitor' }, turns: [{ by: 'a', dr: "On the block means one thing to me. Win the veto. That's it. That's the whole plan." }] },
    { id: 'nd.rc2', when: { register: 'competitor' }, turns: [{ by: 'a', dr: "{b} put up the person most likely to win the veto. Bold. Let's see how that works out." }] },
    { id: 'nd.rk1', when: { register: 'cool' }, turns: [{ by: 'a', dr: "I'm not going to panic. Panicking is how people go home from this chair. I'm going to count." }] },
    { id: 'nd.rk2', when: { register: 'cool' }, turns: [{ by: 'a', dr: "I saw this coming three days ago. That's why I already know who I'm talking to first." }] },
  ],
  'noms.dr.pawn': [
    { id: 'nd.p1', turns: [{ by: 'a', dr: "{b} says I'm a pawn. Every pawn in Big Brother history has heard that sentence. Some of them went home." }] },
    { id: 'nd.p2', turns: [{ by: 'a', dr: "I agreed to this. I said yes. I'd just like somebody to explain why it feels this bad when you agreed to it." }] },
    { id: 'nd.p3', turns: [{ by: 'a', dr: "I trust {b}. I trust {b.obj} about ninety percent. The other ten is going to keep me up tonight." }] },
    { id: 'nd.p4', turns: [{ by: 'a', dr: "Being a pawn is easy until the veto gets used. Then you're not a pawn. You're just a nominee." }] },
    { id: 'nd.p5', turns: [{ by: 'a', dr: "I took one for the team. Now the team had better take care of me." }] },
    { id: 'nd.p6', turns: [{ by: 'a', dr: "I'm a pawn. I'm a pawn. If I keep saying it, maybe the house will believe it too." }] },
  ],
  'noms.dr.target': [
    { id: 'nd.t1', turns: [{ by: 'a', dr: "{b} made it very clear I'm the target. Good. Now I know exactly who I'm fighting." }] },
    { id: 'nd.t2', turns: [{ by: 'a', dr: "I'm the target. I can feel it. People are already being careful about where they sit next to me." }] },
    { id: 'nd.t3', turns: [{ by: 'a', dr: "{b} wants me gone. I'm going to make this the longest week of {b.posAdj} life." }] },
    { id: 'nd.t4', turns: [{ by: 'a', dr: "When you're the target, the house stops talking to you like a person. You're already a goodbye speech." }] },
    { id: 'nd.t5', turns: [{ by: 'a', dr: "The other nominee gets the sympathy. I get the stares. That's how you know which one you are." }] },
    { id: 'nd.t6', turns: [{ by: 'a', dr: "If I win the veto, {b}'s whole week falls apart. That's the only thought in my head." }] },
  ],
  'noms.dr.blindsided': [
    { id: 'nd.b1', turns: [{ by: 'a', dr: "{b}? {b} did this? I was in that room every night. I was helping {b.obj} plan." }] },
    { id: 'nd.b2', turns: [{ by: 'a', dr: "I thought we were together. I thought we were a sure thing. Apparently I'm the only one who did." }] },
    { id: 'nd.b3', turns: [{ by: 'a', dr: "I didn't see it. I genuinely didn't see it. And that's the part that scares me most." }] },
    { id: 'nd.b4', turns: [{ by: 'a', dr: "{b} looked me in the eye this morning and told me I was safe. This morning." }] },
    { id: 'nd.b5', turns: [{ by: 'a', dr: "Of all the people in this house, {b} is the last one I thought would turn that key on me." }] },
    { id: 'nd.b6', turns: [{ by: 'a', dr: "I'm hurt. I'm not going to pretend I'm not. But hurt doesn't win vetoes, so I'll be hurt later." }] },
  ],

  // ── winning the Power of Veto ──────────────────────────────────────
  'veto.win.any': [
    { id: 'vw.a1', turns: [
      { by: 'a', say: 'That veto is mine!' },
      { by: 'a', dr: 'This little medal changes everything. Every person on that block is about to be very nice to me.' },
    ] },
    { id: 'vw.a2', turns: [
      { by: 'a', say: 'Power of Veto, baby!' },
      { by: 'a', dr: "Now I have to decide if I'm going to use it. And either way, somebody's going to be angry with me." },
    ] },
    { id: 'vw.a3', turns: [
      { by: 'a', say: 'I needed that one. I really did.' },
      { by: 'a', dr: 'I just became the most important person in the house for three days. I want to enjoy it before it gets complicated.' },
    ] },
    { id: 'vw.a4', turns: [
      { beat: '{a} holds the medallion up to the camera and kisses it.' },
      { by: 'a', dr: 'Everyone pretends the veto is just a necklace. It is the whole week, and it is around my neck.' },
    ] },
    { id: 'vw.a5', turns: [
      { by: 'a', say: 'Somebody hold me. I think my arms are going to fall off.' },
      { by: 'a', dr: "That's my safety this week. Whatever happens on Monday, I'm not on that block." },
    ] },
    { id: 'vw.a6', turns: [
      { by: 'a', say: 'Okay, everyone. Nobody talk to me about it tonight. Tomorrow.' },
      { by: 'a', dr: "By tomorrow, every person in the house is going to give me a reason. I'm going to need a notepad." },
    ] },
    { id: 'vw.a7', turns: [
      { by: 'a', say: "Yes! I'm not going anywhere this week." },
      { by: 'a', dr: "Some people play for the veto to save somebody. I played to save myself. Anything else is a bonus." },
    ] },
    { id: 'vw.a8', turns: [
      { by: 'a', say: 'Did everybody see that? Everybody saw that, right?' },
      { by: 'a', dr: "I'm going to be a target for winning it. I'd rather be a target with a veto than without one." },
    ] },
    { id: 'vw.a9', turns: [
      { beat: 'The two on the block both clap first. Nobody misses it.' },
      { by: 'a', dr: "Watching both nominees start smiling at me at the same time was hilarious. Nobody has ever liked me this much." },
    ] },
    { id: 'vw.a10', when: { late: true }, turns: [
      { by: 'a', say: 'This is the most important one I could have won. This one!' },
      { by: 'a', dr: 'This late in the game, the veto decides who sits in those two chairs. I just decided it.' },
    ] },
    { id: 'vw.a11', turns: [
      { by: 'a', say: "Mine! It's mine!" },
      { by: 'a', dr: "Every person in this house is about to want to have a quiet word with me. I'm going to enjoy every single one." },
    ] },
    { id: 'vw.a12', turns: [
      { beat: '{a} holds the medallion so tightly the knuckles go white.' },
      { by: 'a', dr: "I'm not letting go of this thing until the meeting. I'll sleep with it if I have to." },
    ] },
    { id: 'vw.a13', turns: [
      { by: 'a', say: "Somebody's week just got a lot more interesting." },
      { by: 'a', dr: "Use it, don't use it. Either way, I'm the most popular person in the house until Monday." },
    ] },
    { id: 'vw.a14', turns: [
      { by: 'a', say: "Okay. Okay. I need to sit down. Where's a chair?" },
      { by: 'a', dr: "I've never won anything that mattered this much. Now I have to decide what to do with it, and that's the scary part." },
    ] },
    { id: 'vw.rs1', when: { register: 'schemer' }, turns: [
      { by: 'a', say: "Well. Isn't this interesting." },
      { by: 'a', dr: "Everybody on that block is going to be my very best friend for three days. I'm going to let them." },
    ] },
    { id: 'vw.rs2', when: { register: 'schemer' }, turns: [
      { beat: '{a} spins the medallion on one finger, watching the nominees.' },
      { by: 'a', dr: "I don't need to use it to win this week. I just need everybody to think I might." },
    ] },
    { id: 'vw.rf1', when: { register: 'fiery' }, turns: [
      { by: 'a', say: "THAT'S MINE! NOBODY TOUCH IT!" },
      { by: 'a', dr: "Some people in this house wanted me to lose that very, very badly. I hope they're watching me wear it." },
    ] },
    { id: 'vw.rf2', when: { register: 'fiery' }, turns: [
      { by: 'a', say: "Told you! I TOLD you!" },
      { by: 'a', dr: "I don't know who I told. Everyone, probably. I'm right, though." },
    ] },
    { id: 'vw.ry1', when: { register: 'shy' }, turns: [
      { by: 'a', say: "Um. Did I... did I win?" },
      { by: 'a', dr: "I've never had anybody want something from me in here. Now everybody does. It's a lot." },
    ] },
    { id: 'vw.ry2', when: { register: 'shy' }, turns: [
      { beat: '{a} holds the medallion as if it might break.' },
      { by: 'a', dr: "I don't really like being the centre of attention. This necklace is very much the centre of attention." },
    ] },
    { id: 'vw.rw1', when: { register: 'sweet' }, turns: [
      { by: 'a', say: "I did it! Oh my gosh, I actually did it!" },
      { by: 'a', dr: "If I can use this to save somebody I care about, that's the best thing that could happen to me this week." },
    ] },
    { id: 'vw.rw2', when: { register: 'sweet' }, turns: [
      { by: 'a', say: "Guys, come here, everybody hug!" },
      { by: 'a', dr: "I know I should be thinking strategy. I'm thinking about whose face is going to light up if I use it." },
    ] },
    { id: 'vw.rc1', when: { register: 'competitor' }, turns: [
      { by: 'a', say: "Another one for the collection!" },
      { by: 'a', dr: "Put me in a competition and I'll win it. Put me in a conversation and I'll figure it out. Eventually." },
    ] },
    { id: 'vw.rc2', when: { register: 'competitor' }, turns: [
      { by: 'a', say: "Was that close? It didn't feel close." },
      { by: 'a', dr: "I love this part. Everybody stops pretending I'm not a threat." },
    ] },
    { id: 'vw.rk1', when: { register: 'cool' }, turns: [
      { by: 'a', say: "Good game, everybody." },
      { by: 'a', dr: "Using it, not using it, I don't decide tonight. I decide after I've heard every single person out." },
    ] },
    { id: 'vw.rk2', when: { register: 'cool' }, turns: [
      { beat: '{a} puts the medallion on without a word and walks inside.' },
      { by: 'a', dr: "The less excited I look, the less anybody can read what I'm going to do with it." },
    ] },
  ],
  'veto.win.self': [
    { id: 'vw.s1', turns: [
      { by: 'a', say: "I'm coming off the block! I'm coming off!" },
      { by: 'a', dr: '{b} put me up there. I just took myself down. That sound you hear is {b.posAdj} plan falling apart.' },
    ] },
    { id: 'vw.s2', turns: [
      { beat: '{a} looks over at {b} before even picking up the medallion.' },
      { by: 'a', dr: "{b} wanted me out this week. That's not going to happen now. And now {b} has to pick somebody else." },
    ] },
    { id: 'vw.s3', turns: [
      { by: 'a', say: 'Not this week! Not this week!' },
      { by: 'a', dr: "I've been on that block for three days and every one of them felt like a month. I'm done sitting in that chair." },
    ] },
    { id: 'vw.s4', turns: [
      { by: 'a', say: 'I told you. I told every single one of you.' },
      { by: 'a', dr: 'I was the target. Now I am safe and somebody on that couch is about to have a very bad Monday.' },
    ] },
    { id: 'vw.s5', turns: [
      { by: 'a', say: "Oh, I'm using it. I'm definitely using it." },
      { by: 'a', dr: "Who goes up in my place? Not my problem. That's {b.posAdj} problem now, and I hope it keeps {b.obj} awake." },
    ] },
    { id: 'vw.s6', turns: [
      { by: 'a', say: "{b}, I'm sorry. Actually, I'm not." },
      { beat: '{b} laughs, because the whole house is watching {b.obj}.' },
      { by: 'a', dr: "{b} laughed. I have never seen anybody less amused in my life." },
    ] },
  ],
  'veto.win.hoh': [
    { id: 'vw.h1', turns: [
      { by: 'a', say: 'Head of Household AND the veto. Nobody touches my nominations this week.' },
      { by: 'a', dr: 'This is a dream week. I picked the two, and now nobody can change them. Except me.' },
    ] },
    { id: 'vw.h2', turns: [
      { by: 'a', say: 'Sorry, everybody. My week, my rules.' },
      { by: 'a', dr: "The nominees were hoping somebody else would win this. Instead they got me, and I'm not saving anybody." },
    ] },
    { id: 'vw.h3', turns: [
      { beat: 'The two on the block look at each other. Both of them knew what this meant.' },
      { by: 'a', dr: "I've got total control this week. That feels amazing, and it also means everybody knows exactly who to blame." },
    ] },
    { id: 'vw.h4', turns: [
      { by: 'a', say: "Well, that's the week sorted." },
      { by: 'a', dr: 'I can keep my nominations the same, or I can make a big move. Either way, it is my move.' },
    ] },
    { id: 'vw.h5', turns: [
      { by: 'a', say: "I'm not going to lie. I wanted this one more than the first one." },
      { by: 'a', dr: 'Head of Household gets you a room. The veto gets you the whole week.' },
    ] },
    { id: 'vw.h6', turns: [
      { by: 'a', say: "Don't everybody look at me at once. I can feel it." },
      { by: 'a', dr: "Two comps in one week. The house is going to call me a beast, and they'd be right." },
    ] },
  ],

  // ── a nominee asks the veto holder, at the meeting ──────────────────
  'veto.plea.any': [
    { id: 'vp.a1', turns: [{ by: 'a', say: "I'm not going to beg. I'd just like to stay, and I think you know I'd return the favour." }] },
    { id: 'vp.a2', turns: [{ by: 'a', say: "Whatever you decide, I'll respect it. I just hope it's me." }] },
    { id: 'vp.a3', turns: [{ by: 'a', say: "{b}, I've been straight with you since day one. That's all I've got." }] },
    { id: 'vp.a4', turns: [{ by: 'a', say: "Use it on me and I'll owe you. You know I pay my debts in this house." }] },
    { id: 'vp.a5', turns: [{ by: 'a', say: "I know this is a hard spot to be in. I'd just like you to think about who'll be here for you next week." }] },
    { id: 'vp.a6', turns: [{ by: 'a', say: "I'm going to keep this short. I'd like to stay, and I'd like you to be the reason." }] },
    { id: 'vp.a7', turns: [{ by: 'a', say: "I don't want to put you in a bad position. But if you use it on me, I promise you won't regret it." }] },
    { id: 'vp.a8', turns: [{ by: 'a', say: "There's nothing I can say you don't already know. You know my game. Please use it on me." }] },
    { id: 'vp.a9', turns: [{ by: 'a', say: "I'll just say this. Pull me off, and I'm the safest vote you'll have next week." }] },
    { id: 'vp.a10', turns: [{ by: 'a', say: "Please. I'm asking. I don't ask for much in here." }] },
    { id: 'vp.a11', when: { late: true }, turns: [{ by: 'a', say: "{b}, there are so few of us left. Take me off, and I'll remember it all the way to the end." }] },
    { id: 'vp.a12', turns: [{ by: 'a', say: "Whatever happens, {b}, congratulations on the veto. You earned it. I'd love it if you used it on me." }] },
    { id: 'vp.rs1', when: { register: 'schemer' }, turns: [{ by: 'a', say: "Use it on me, {b}, and I'll make sure you never regret it. You know I keep track of my friends." }] },
    { id: 'vp.rs2', when: { register: 'schemer' }, turns: [{ by: 'a', say: "Think about who's going up if I come down. Now think about whether that helps you. I think it does." }] },
    { id: 'vp.rf1', when: { register: 'fiery' }, turns: [{ by: 'a', say: "I'm not going to stand here and grovel. Use it on me or don't, {b}, but don't pretend it's a hard choice." }] },
    { id: 'vp.rf2', when: { register: 'fiery' }, turns: [{ by: 'a', say: "I've been straight with you, maybe too straight. That's who I am. Take it or leave it." }] },
    { id: 'vp.ry1', when: { register: 'shy' }, turns: [{ by: 'a', say: "I'm not great at speeches. I'd just really like to stay, {b}. That's all." }] },
    { id: 'vp.ry2', when: { register: 'shy' }, turns: [{ by: 'a', say: "I know I haven't talked to you as much as other people have. I'd like the chance to." }] },
    { id: 'vp.rw1', when: { register: 'sweet' }, turns: [{ by: 'a', say: "Whatever you decide, I'll still be your friend tomorrow. I just hope I'm your friend who's off the block." }] },
    { id: 'vp.rw2', when: { register: 'sweet' }, turns: [{ by: 'a', say: "{b}, I love you to bits. Please, please use it on me." }] },
    { id: 'vp.rc1', when: { register: 'competitor' }, turns: [{ by: 'a', say: "Take me off and I'll win the next one for both of us. You've seen me compete." }] },
    { id: 'vp.rc2', when: { register: 'competitor' }, turns: [{ by: 'a', say: "I'd rather be beaten in a competition than voted out on a Thursday. Give me the chance to compete, {b}." }] },
    { id: 'vp.rk1', when: { register: 'cool' }, turns: [{ by: 'a', say: "Here's the maths, {b}. Pull me down and you gain an ally. Leave me up and you gain nothing." }] },
    { id: 'vp.rk2', when: { register: 'cool' }, turns: [{ by: 'a', say: "I won't waste your time. You already know what I'd do with another week. Use it on me." }] },
  ],
  'veto.plea.friends': [
    { id: 'vp.f1', turns: [{ by: 'a', say: "You know where I stand with you. Use it on me and I won't forget it." }] },
    { id: 'vp.f2', turns: [{ by: 'a', say: "{b}, we've been in this together from the start. I'm not going to make a speech. You know." }] },
    { id: 'vp.f3', turns: [{ by: 'a', say: "I'd do it for you. I'd do it in a heartbeat, and you know that." }] },
    { id: 'vp.f4', turns: [{ by: 'a', say: "{b}, you're my closest friend in here. I just need you to have my back this one time." }] },
    { id: 'vp.f5', turns: [{ by: 'a', say: "I'm not worried about you. I'm worried about the votes. Get me off this thing and we never have to count them." }] },
    { id: 'vp.f6', turns: [{ by: 'a', say: "We've talked about this every night. I trust you to do the right thing for both of us." }] },
    { id: 'vp.f7', turns: [{ by: 'a', say: "{b}, you know what I'd say. You've heard me say it in the bedroom fifty times." }] },
    { id: 'vp.f8', turns: [{ by: 'a', say: "I'm going to look you in the eye and ask, because I know I can. Please take me off." }] },
  ],
  'veto.plea.neutral': [
    { id: 'vp.n1', turns: [{ by: 'a', say: "{b}, we haven't always been close, but I've never come after you. I'd like that to count for something." }] },
    { id: 'vp.n2', turns: [{ by: 'a', say: "We haven't talked game much. Use it on me, and that changes tomorrow." }] },
    { id: 'vp.n3', turns: [{ by: 'a', say: "I know we're not best friends. I'm not asking you to be. I'm asking for a chance." }] },
    { id: 'vp.n4', turns: [{ by: 'a', say: "{b}, I've never said your name. Not once. Check with anybody in this house." }] },
    { id: 'vp.n5', turns: [{ by: 'a', say: "Save me and you get somebody in your corner who owes you. That's worth more than the medal." }] },
    { id: 'vp.n6', turns: [{ by: 'a', say: "I'll be honest with you, {b}. I'd like us to be closer, and this is a pretty good place to start." }] },
    { id: 'vp.n7', turns: [{ by: 'a', say: "We've kept out of each other's way so far. I think we'd work well together. Let's find out." }] },
    { id: 'vp.n8', turns: [{ by: 'a', say: "I'm not a threat to you. You know who is. It's not me." }] },
  ],
  'veto.plea.cold': [
    { id: 'vp.c1', turns: [{ by: 'a', say: "{b}, I know we've had our problems. I'm asking you to put them aside for one day." }] },
    { id: 'vp.c2', turns: [{ by: 'a', say: "I know you're not going to use it on me. I'm going to ask anyway, because I'd hate myself if I didn't." }] },
    { id: 'vp.c3', turns: [{ by: 'a', say: "We don't get on. Everyone knows it. That's exactly why saving me would be the biggest move in this house." }] },
    { id: 'vp.c4', turns: [{ by: 'a', say: "{b}, I've said things about you. You've said things about me. Let's start over, here, today." }] },
    { id: 'vp.c5', turns: [{ by: 'a', say: "I'm not going to stand here and pretend we're friends. But I don't think you want me gone as much as you think you do." }] },
    { id: 'vp.c6', turns: [{ by: 'a', say: "I'll keep it short, because I know you've already decided. Thanks for listening." }] },
    { id: 'vp.c7', turns: [{ by: 'a', say: "Use it on me, {b}, and you'll never hear another bad word about you from me. Ever." }] },
    { id: 'vp.c8', turns: [{ by: 'a', say: "{b}, I know where your vote is going. I'm asking you to surprise everybody." }] },
  ],

  // ── the veto holder in the Diary Room, before the meeting ───────────
  // b is who the decision is about: the nominee it saves, or the one it leaves.
  'veto.dr.use': [
    { id: 'vd.u1', turns: [{ by: 'a', dr: "I'm using the veto on {b}. I made a promise, and I'm not going to break it on camera." }] },
    { id: 'vd.u2', turns: [{ by: 'a', dr: "Pulling {b} off is going to make some people very angry. Good. Let them be angry." }] },
    { id: 'vd.u3', turns: [{ by: 'a', dr: "{b} has been there for me since the first night. Today I'm going to be there for {b.obj}." }] },
    { id: 'vd.u4', turns: [{ by: 'a', dr: "If I don't use it on {b}, {b.sub} might go home, and then I'm alone in here. I'm not doing that." }] },
    { id: 'vd.u5', turns: [{ by: 'a', dr: "Using it means somebody else goes up. I know who that's probably going to be, and I'm okay with it." }] },
    { id: 'vd.u6', turns: [{ by: 'a', dr: "This veto is my chance to change the week. Keeping things the same doesn't help my game. Saving {b} does." }] },
    { id: 'vd.u7', turns: [{ by: 'a', dr: "I've gone back and forth all night. I keep landing in the same place. {b} comes off." }] },
    { id: 'vd.u8', turns: [{ by: 'a', dr: "Everybody thinks I'm going to sit on it. They're about to find out I'm not as predictable as they think." }] },
    { id: 'vd.u9', turns: [{ by: 'a', dr: "{b} would do the same for me. I'm sure of that. Almost sure. Sure enough." }] },
    { id: 'vd.u10', turns: [{ by: 'a', dr: "If I leave {b} up there and {b} goes home, I'll never forgive myself. So {b} comes down." }] },
    { id: 'vd.u11', turns: [{ by: 'a', dr: "I've done the maths. Pulling {b} down gives us the votes. Leaving {b} up there doesn't." }] },
  ],
  'veto.dr.self': [
    { id: 'vd.s1', turns: [{ by: 'a', dr: "Easiest decision I'll ever make in this house. I'm taking myself off that block." }] },
    { id: 'vd.s2', turns: [{ by: 'a', dr: "Am I using the veto on myself? Is that a real question? Yes. Yes, I am." }] },
    { id: 'vd.s3', turns: [{ by: 'a', dr: "I get to sit in that chair one more time, say \"I've decided to use it on myself\", and watch the Head of Household's face." }] },
    { id: 'vd.s4', turns: [{ by: 'a', dr: "Tomorrow I'm off the block and somebody else is on it. Somebody who thought they were safe this week." }] },
    { id: 'vd.s5', turns: [{ by: 'a', dr: "I won this so I'd never have to rely on anyone else's vote. That's exactly what it's going to do." }] },
    { id: 'vd.s6', turns: [{ by: 'a', dr: "They put me up. I'm taking me down. That's the whole speech." }] },
  ],
  'veto.dr.keep': [
    { id: 'vd.k1', turns: [{ by: 'a', dr: "I'm not using it. If I pull somebody off, somebody else goes up, and that somebody might be my friend." }] },
    { id: 'vd.k2', turns: [{ by: 'a', dr: "{b} is going to ask me for this. I'm going to say no. I don't feel great about it." }] },
    { id: 'vd.k3', turns: [{ by: 'a', dr: "The nominations stay the same. I didn't make them, and I don't want my name attached to changing them." }] },
    { id: 'vd.k4', turns: [{ by: 'a', dr: "Using the veto makes you enemies. Keeping it makes you fewer of them. It stays in the box." }] },
    { id: 'vd.k5', turns: [{ by: 'a', dr: "If I use it on {b}, I'm the one who put the replacement in danger. I'm not taking that blood on my hands." }] },
    { id: 'vd.k6', turns: [{ by: 'a', dr: "{b} and I aren't close enough for me to take that risk. Maybe next week. Not this week." }] },
    { id: 'vd.k7', turns: [{ by: 'a', dr: "If I use it, somebody on that couch takes the seat, and every one of them has been nice to me this week. Nominations stay as they are." }] },
    { id: 'vd.k8', turns: [{ by: 'a', dr: "I'm going to let {b} make the speech, I'm going to nod, and I'm going to keep the veto right where it is." }] },
    { id: 'vd.k9', turns: [{ by: 'a', dr: "If I pull {b} down, I'm the one the house blames for whoever goes up. Not this week." }] },
    { id: 'vd.k10', turns: [{ by: 'a', dr: "The safest thing I can do is nothing. In this house, nothing is a move too." }] },
    { id: 'vd.k11', turns: [{ by: 'a', dr: "{b} has a good speech ready. I've heard it in my head all night. The answer's still no." }] },
  ],

  // ── the replacement nominee, in the Diary Room ─────────────────────
  'veto.renom.any': [
    { id: 'vr.a1', turns: [{ by: 'a', dr: "I was safe. I was on the couch. Then my name came out of {b.posAdj} mouth." }] },
    { id: 'vr.a2', turns: [{ by: 'a', dr: "The replacement nominee. That's the worst seat in the house, because the replacement is usually who they wanted all along." }] },
    { id: 'vr.a3', turns: [{ by: 'a', dr: "I had five minutes' warning. Five minutes. Everybody else had all week to campaign." }] },
    { id: 'vr.a4', turns: [{ by: 'a', dr: "Walking to that chair, I could hear everybody breathe out. Everybody who wasn't me." }] },
    { id: 'vr.a5', turns: [{ by: 'a', dr: "The veto was supposed to make this week calmer. It made it calmer for everybody except me." }] },
    { id: 'vr.a6', turns: [{ by: 'a', dr: "I sat down in that chair and smiled, because the cameras were on. Inside, I was already counting votes." }] },
  ],
  'veto.renom.blindsided': [
    { id: 'vr.b1', turns: [{ by: 'a', dr: "{b}? Of all people, {b}? I was helping {b.obj} plan this week." }] },
    { id: 'vr.b2', turns: [{ by: 'a', dr: "I trusted {b}. I'm sitting here trying to work out when exactly that stopped being true." }] },
    { id: 'vr.b3', turns: [{ by: 'a', dr: "I didn't see a single sign. Not one. {b} hugged me this morning." }] },
    { id: 'vr.b4', turns: [{ by: 'a', dr: "That was a backdoor. And I'm the one standing in the doorway." }] },
    { id: 'vr.b5', turns: [{ by: 'a', dr: "{b} said my name like it was nothing. Like we'd never had a single conversation." }] },
    { id: 'vr.b6', turns: [{ by: 'a', dr: "Okay. Okay. I've got four days to undo a plan I didn't even know existed." }] },
  ],
  'veto.renom.expected': [
    { id: 'vr.e1', turns: [{ by: 'a', dr: "I knew it was going to be me. The second that veto got used, I knew." }] },
    { id: 'vr.e2', turns: [{ by: 'a', dr: "{b} and I have never got on. I'd have been more surprised if it was anybody else." }] },
    { id: 'vr.e3', turns: [{ by: 'a', dr: "I saw it coming. I just hoped I was wrong. I'm hardly ever wrong about {b}." }] },
    { id: 'vr.e4', turns: [{ by: 'a', dr: "No surprise. I'd already planned my campaign in my head. Now I just have to run it." }] },
    { id: 'vr.e5', turns: [{ by: 'a', dr: "{b} has been looking at me all week like I'm a problem. Now {b} has made me one." }] },
    { id: 'vr.e6', turns: [{ by: 'a', dr: "Fine. I'm up. I've been fighting {b} for weeks anyway. Now it's out in the open." }] },
  ],

  // ── an eviction goodbye, after the result ─────────────────────────
  // b is the friend {a} hugs last.
  'evict.goodbye.any': [
    { id: 'eg.a1', turns: [
      { by: 'a', say: "It's okay. It's okay. Go win this thing." },
      { by: 'b', say: "I love you. I'll see you out there." },
    ] },
    { id: 'eg.a2', turns: [
      { by: 'a', say: "Don't cry, {b}. You'll set me off." },
      { by: 'b', say: 'Too late.' },
    ] },
    { id: 'eg.a3', turns: [
      { by: 'a', say: 'Thank you, everybody. Really. Thank you.' },
      { beat: '{a} saves the longest hug for {b}.' },
    ] },
    { id: 'eg.a4', turns: [
      { by: 'a', say: "{b}, you keep going. You hear me? You keep going." },
      { by: 'b', say: 'I will. I promise.' },
    ] },
    { id: 'eg.a5', turns: [
      { by: 'a', say: "No sad faces. I got to live in the Big Brother house. That's not nothing." },
    ] },
    { id: 'eg.a6', turns: [
      { by: 'b', say: "I'm so sorry." },
      { by: 'a', say: "Don't be. You didn't do this. Go get the people who did." },
    ] },
    { id: 'eg.a7', turns: [
      { by: 'a', say: "Somebody look after my plants. Well, plant. The one in the bedroom." },
      { by: 'b', say: "I'll water it every day." },
    ] },
    { id: 'eg.a8', turns: [
      { beat: '{a} picks up the bag. {b} does not let go straight away.' },
      { by: 'a', say: 'I have to go. They are going to drag me out.' },
    ] },
    { id: 'eg.a9', turns: [
      { by: 'a', say: "Love you all. Even the ones who voted me out. Maybe especially you." },
    ] },
    { id: 'eg.a10', when: { late: true }, turns: [
      { by: 'a', say: "I'll see most of you in the jury house. Bring snacks." },
      { by: 'b', say: 'Save me a seat.' },
    ] },
    { id: 'eg.a11', turns: [
      { by: 'a', say: "{b}, you're the best thing that happened to me in here. Don't let them get you next." },
    ] },
    { id: 'eg.a12', turns: [
      { by: 'a', say: "That's it. That's my game. I'm proud of it." },
      { beat: 'Nobody says anything. {b} squeezes {a.posAdj} hand.' },
    ] },
    { id: 'eg.rs1', when: { register: 'schemer' }, turns: [
      { by: 'a', say: "Well played. Truly. I'd have done the same thing." },
      { by: 'a', say: "{b}, watch them. All of them." },
    ] },
    { id: 'eg.rs2', when: { register: 'schemer' }, turns: [
      { beat: '{a} hugs the house goodbye, and whispers something in every ear.' },
      { by: 'b', say: "What did you say to everyone?" },
      { by: 'a', say: "Something different each time. Have fun." },
    ] },
    { id: 'eg.rf1', when: { register: 'fiery' }, turns: [
      { by: 'a', say: "Don't hug me if you voted me out. I mean it!" },
      { beat: 'About half the room steps back.' },
      { by: 'b', say: "I'm still hugging you." },
    ] },
    { id: 'eg.rf2', when: { register: 'fiery' }, turns: [
      { by: 'a', say: "Fine! I'm going! But I'm going LOUD!" },
      { by: 'b', say: "We'd expect nothing less." },
    ] },
    { id: 'eg.ry1', when: { register: 'shy' }, turns: [
      { by: 'a', say: "Um. Bye, everyone. Thanks for... yeah. Thanks." },
      { by: 'b', say: "Come here, you." },
    ] },
    { id: 'eg.ry2', when: { register: 'shy' }, turns: [
      { beat: '{a} gives a small wave from the hallway instead of a speech.' },
      { by: 'b', say: "That's it? No speech?" },
      { by: 'a', say: "That was the speech." },
    ] },
    { id: 'eg.rw1', when: { register: 'sweet' }, turns: [
      { by: 'a', say: "I love every single one of you. Even you. Especially you." },
      { by: 'b', say: "Stop it, you're going to make us all cry." },
      { by: 'a', say: "Good! Cry! It's healthy!" },
    ] },
    { id: 'eg.rw2', when: { register: 'sweet' }, turns: [
      { by: 'a', say: "No hard feelings. Honestly. Look after each other in here." },
      { by: 'b', say: "We will. I promise." },
    ] },
    { id: 'eg.rc1', when: { register: 'competitor' }, turns: [
      { by: 'a', say: "I'd have won the next one. You all know I would have." },
      { by: 'b', say: "That's exactly why you're leaving." },
      { by: 'a', say: "...Fair enough." },
    ] },
    { id: 'eg.rc2', when: { register: 'competitor' }, turns: [
      { by: 'a', say: "Somebody win an HOH for me. {b}, I'm looking at you." },
      { by: 'b', say: "I'll win one in your name." },
    ] },
    { id: 'eg.rk1', when: { register: 'cool' }, turns: [
      { by: 'a', say: "I knew the numbers. I just hoped they'd change. They didn't. Good game, everyone." },
    ] },
    { id: 'eg.rk2', when: { register: 'cool' }, turns: [
      { by: 'a', say: "It's a game. It was a good one. I'll see you all on the other side." },
      { beat: '{a} shakes hands down the line, calm to the last one.' },
    ] },
  ],
  'evict.goodbye.blindsided': [
    { id: 'eg.b1', turns: [
      { by: 'a', say: 'Wow. Okay. Wow.' },
      { by: 'b', say: 'I swear I had no idea.' },
      { by: 'a', say: "I believe you. I don't believe the rest of them." },
    ] },
    { id: 'eg.b2', turns: [
      { by: 'a', say: 'Somebody in this room lied to my face this morning. You know who you are.' },
      { beat: 'Nobody looks up from the floor.' },
    ] },
    { id: 'eg.b3', turns: [
      { by: 'a', say: "I counted the votes. I had them. I had them!" },
      { by: 'b', say: "You did. I don't know what happened." },
    ] },
    { id: 'eg.b4', turns: [
      { by: 'a', say: "Well played. I mean it. I didn't see it." },
      { by: 'a', say: "{b}, watch your back. That was not a one-off." },
    ] },
    { id: 'eg.b5', turns: [
      { beat: '{a} stands still for a second too long, looking at the house.' },
      { by: 'a', say: "I'm not angry. I'm just impressed. Mostly angry." },
    ] },
    { id: 'eg.b6', when: { late: true }, turns: [
      { by: 'a', say: 'Some of you are going to have a very awkward jury house. Just saying.' },
      { by: 'b', say: 'Go. Go before you say something.' },
    ] },
  ],
  'evict.goodbye.expected': [
    { id: 'eg.e1', turns: [
      { by: 'a', say: "I knew. It's fine. I knew." },
      { by: 'b', say: "I tried. I really tried." },
    ] },
    { id: 'eg.e2', turns: [
      { by: 'a', say: "No hard feelings, everyone. I'd have done the same thing." },
    ] },
    { id: 'eg.e3', turns: [
      { by: 'a', say: "I had my bag packed on Thursday. That's how sure I was." },
      { by: 'b', say: 'You still fought. Everyone saw it.' },
    ] },
    { id: 'eg.e4', turns: [
      { by: 'a', say: "I'm going to go hug the host and get a burger. Not in that order." },
    ] },
    { id: 'eg.e5', turns: [
      { by: 'a', say: "{b}, we gave it a go. That's all we could do." },
      { by: 'b', say: "I'll finish it for both of us." },
    ] },
    { id: 'eg.e6', turns: [
      { by: 'a', say: 'Go on, then. Get it over with. Group hug.' },
      { beat: 'The whole house piles in. {b} is in the middle of it.' },
    ] },
  ],
};

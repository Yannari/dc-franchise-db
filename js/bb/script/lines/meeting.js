// ══════════════════════════════════════════════════════════════════════
// bb/script/lines/meeting.js — a house meeting, in four parts (Phase 6)
// ══════════════════════════════════════════════════════════════════════
//
// Written by bb/script/meeting.js for house-life.js and reign.js. a called
// it; b is who it is about; c is somebody else in the room. All in the living
// room.
//
//   meeting.call      a calls everybody in                     scene
//   meeting.case      a makes the case                         lie | desperate | grudge | power
//   meeting.answer    b answers, or the room does              lands | backfires | silent | fizzles
//   meeting.verdict   how it ends                              lands | backfires | silent | fizzles

export default {
  'meeting.call.scene': [
    { id: 'mt.c1', turns: [{ by: 'a', say: "House meeting! Everyone in the living room. Now." }, { beat: 'Doors start opening all over the house.' }] },
    { id: 'mt.c2', turns: [{ by: 'a', say: "Everybody, living room, please." }, { beat: 'Conversations stop halfway through. The house files in.' }] },
    { id: 'mt.c3', turns: [{ beat: '{a} goes from room to room.' }, { by: 'a', say: "Living room. Everyone. Five minutes." }] },
    { id: 'mt.c4', turns: [{ by: 'a', say: "Can everyone come to the living room? It's important." }, { beat: 'Half the house thinks the meeting is about them.' }] },
    { id: 'mt.c5', turns: [{ beat: 'The house gathers. {b} takes the seat nearest the door.' }, { by: 'a', say: "Thanks for coming." }] },
    { id: 'mt.c6', turns: [{ by: 'a', say: "Sit down, everyone. This won't take long." }, { beat: 'It takes a long time.' }] },
  ],
  // the house coming in, before anybody says why (the user, 2026-10-06: "'Living room. Everyone.
  // Five minutes.' and straight into it: no time to breathe, no reaction, wait for what, what's
  // going on, a Diary Room"): people arriving, wondering, the one it is about feeling it coming
  'meeting.gather.scene': [
    { id: 'mt.ga1', when: { room: 'living-room' }, turns: [{ beat: 'One by one, the house drifts into the living room. Nobody sits down properly.' }, { by: 'c', say: "What is this about?" }, { by: 'a', say: "You'll see. Is everybody here?" }, { by: 'b', dr: "The second I heard 'house meeting', I knew. You always know when it's about you." }] },
    { id: 'mt.ga2', turns: [{ beat: 'Somebody turns the music off. People squeeze onto the sofas, still holding cups and plates.' }, { by: 'c', say: "Should I be worried?" }, { by: 'a', say: "Not you." }, { by: 'c', dr: "'Not you.' Which means somebody in this room should be very worried." }] },
    { id: 'mt.ga3', turns: [{ beat: 'The house files in. {b} takes the seat nearest the door.' }, { by: 'b', say: "This had better be good. I was in the shower." }, { by: 'a', say: "It's important. I promise." }, { by: 'a', dr: "I've been holding this in for days. Tonight the whole house hears it." }] },
    { id: 'mt.ga4', turns: [{ beat: 'Everybody arrives at once and then nobody speaks. {a} waits until the room is completely quiet.' }, { by: 'b', dr: "Everybody looked at {a}. Then half of them looked at me. That's when my stomach dropped." }] },
    { id: 'mt.ga5', turns: [{ beat: 'People wander in from all over the house, asking each other what is going on. Nobody knows.' }, { by: 'c', say: "Has somebody died? Why is everyone so serious?" }, { by: 'a', say: "Just sit down. Please." }, { by: 'c', dr: "In here, a house meeting means one thing. Somebody is about to get dragged in front of everybody." }] },
    { id: 'mt.ga6', when: { room: 'living-room' }, turns: [{ beat: 'The living room fills up. {b} sits down, catches {a}\'s eye, and looks away first.' }, { by: 'a', say: "Thanks for coming, everybody. This won't take long." }, { by: 'b', dr: "'This won't take long.' Nobody who has ever said that in this house has been telling the truth." }] },
    { id: 'mt.ga7', turns: [{ beat: 'The house gathers on the sofas. {a} stays standing.' }, { by: 'b', say: "Are you going to sit down?" }, { by: 'a', say: "No. I'd rather stand for this." }, { by: 'a', dr: "If I'm going to do this, I'm doing it standing up, where everybody can see me." }] },
    { id: 'mt.ga8', turns: [{ beat: 'Someone is still eating cereal. The spoon is the only sound in the room.' }, { by: 'a', say: "Okay. Is everybody here?" }, { by: 'b', say: "Everybody's here. Go on, then." }, { by: 'b', dr: "I could tell from {a}'s face exactly where this was going. I just didn't know how bad." }] },
  ],
  'meeting.case.lie': [
    { id: 'mt.l1', turns: [{ by: 'a', say: "Somebody in this room has been telling people I made deals I never made." }, { beat: '{a} turns to {b}.' }] },
    { id: 'mt.l2', turns: [{ by: 'a', say: "{b}, tell everyone what you've been saying about me. Go on. Say it again, here." }] },
    { id: 'mt.l3', turns: [{ by: 'a', say: "I've heard the same story from three different people. Every one of them got it from {b}." }] },
    { id: 'mt.l4', turns: [{ by: 'a', say: "Where did you hear that I offered a deal, {b}? Because I never did." }] },
    { id: 'mt.l5', turns: [{ by: 'a', say: "I'm not angry. I just want the truth. {b}, where did that story come from?" }] },
    { id: 'mt.l6', turns: [{ by: 'a', say: "Let's clear this up. {b} has been telling people something about me that isn't true." }] },
  ],
  'meeting.case.desperate': [
    { id: 'mt.d1', turns: [{ by: 'a', say: "I'm on the block. I've got nothing to lose. So let's talk about the promises people made me." }] },
    { id: 'mt.d2', turns: [{ by: 'a', say: "If I'm leaving, you all deserve to know what's been said in private." }] },
    { id: 'mt.d3', turns: [{ by: 'a', say: "If you've already decided, at least own it in front of me." }] },
    { id: 'mt.d4', turns: [{ by: 'a', say: "{b} promised me a vote. Didn't you, {b}?" }] },
    { id: 'mt.d5', turns: [{ by: 'a', say: "I'm done protecting conversations that never protected me." }] },
    { id: 'mt.d6', turns: [{ by: 'a', say: "Let's be honest for once. All of us. Starting with {b}." }] },
  ],
  'meeting.case.grudge': [
    { id: 'mt.g1', turns: [{ by: 'a', say: "I tried to keep this private. {b} didn't. So now we're doing it in front of everyone." }] },
    { id: 'mt.g2', turns: [{ by: 'a', say: "This is about respect. And it's about {b}." }] },
    { id: 'mt.g3', turns: [{ by: 'a', say: "Let me tell it from the start, {b}. Including the bit you keep leaving out." }] },
    { id: 'mt.g4', turns: [{ by: 'a', say: "I'm not attacking anyone. But {b} needs to hear this." }] },
    { id: 'mt.g5', turns: [{ by: 'a', say: "{b}, you've been talking about this all over the house. So let's talk about it here." }] },
    { id: 'mt.g6', turns: [{ by: 'a', say: "I've let it go for days. I'm not letting it go any more." }] },
  ],
  // a grudge that says what it is about (bb/script/meeting.js picks the family from the grievance)
  'meeting.case.grudge-house': [
    { id: 'mt.gh1', turns: [{ by: 'a', say: "{b}, I'm saying this once, in front of everybody. The dishes, the mess, the stuff left by the sink for two days. I'm done cleaning up after you." }] },
    { id: 'mt.gh2', turns: [{ by: 'a', say: "This is about the house. Some of us clean up. {b} doesn't, and every time somebody says something, {b} laughs it off." }] },
    { id: 'mt.gh3', turns: [{ by: 'a', say: "We all live here. {b} lives here like there's a cleaner coming in the morning. There isn't. It's me." }] },
    { id: 'mt.gh4', turns: [{ by: 'a', say: "This isn't a meeting about chores. It's a meeting about {b}, because {b} hasn't done one in days." }] },
    { id: 'mt.gh5', turns: [{ by: 'a', say: "Hands up if you've cleaned up after {b} this week." }, { beat: "Most of the room puts a hand up." }] },
    { id: 'mt.gh6', turns: [{ by: 'a', say: "{b}, there's a rota on the fridge with your name on it. You've never once done your day." }] },
  ],
  'meeting.case.grudge-humiliation': [
    { id: 'mt.gu1', turns: [{ by: 'a', say: "{b}, you made me look stupid in front of the whole house. So the whole house can hear what I've got to say back." }] },
    { id: 'mt.gu2', turns: [{ by: 'a', say: "Everybody heard what {b} said about me. I want {b} to say it again, here, to my face." }] },
    { id: 'mt.gu3', turns: [{ by: 'a', say: "{b} thinks it's funny to make me the joke of this house. Let's see how funny it is with me standing here." }] },
    { id: 'mt.gu4', turns: [{ by: 'a', say: "Every day it's a comment from {b}, and every day it's in front of people. So I'm saying this in front of people too." }] },
    { id: 'mt.gu5', turns: [{ by: 'a', say: "{b}, you laughed at me in front of the whole house. So the whole house can hear me now." }] },
    { id: 'mt.gu6', turns: [{ by: 'a', say: "I'm not here to cry. I'm here because {b} keeps making me look stupid, and I'm done letting it slide." }] },
  ],
  'meeting.case.grudge-lie': [
    { id: 'mt.gl1', turns: [{ by: 'a', say: "{b} has been telling people things about me that aren't true. I want to hear {b} say them with me in the room." }] },
    { id: 'mt.gl2', turns: [{ by: 'a', say: "{b}, you looked me in the eye and lied. I'd like everybody to know that before they believe a word you tell them." }] },
    { id: 'mt.gl3', turns: [{ by: 'a', say: "{b} has told three different people three different things about me. I'd like {b} to pick one. Here." }] },
    { id: 'mt.gl4', turns: [{ by: 'a', say: "Before anybody believes another word {b} says about me, I want {b} to say it to my face." }] },
    { id: 'mt.gl5', turns: [{ by: 'a', say: "{b}, you told people I'm coming after them. I'm not. So where did that come from?" }] },
    { id: 'mt.gl6', turns: [{ by: 'a', say: "I've checked every story {b} has told about me this week. Not one of them is true." }] },
  ],
  'meeting.case.grudge-betrayal': [
    { id: 'mt.gb1', turns: [{ by: 'a', say: "{b}, I trusted you. You went behind my back the first chance you got, and you're still acting like we're friends." }] },
    { id: 'mt.gb2', turns: [{ by: 'a', say: "Everybody here should know what {b} does to the people {b} works with. I found out the hard way." }] },
    { id: 'mt.gb3', turns: [{ by: 'a', say: "{b} sat with me every night and then went straight to the other side with everything I said." }] },
    { id: 'mt.gb4', turns: [{ by: 'a', say: "I'm not asking anybody to pick a side. I'm telling you what {b} did to me, so you know what {b} will do to you." }] },
    { id: 'mt.gb5', turns: [{ by: 'a', say: "{b}, you were the one person in here I'd have trusted with anything. Everybody should know how that went." }] },
    { id: 'mt.gb6', turns: [{ by: 'a', say: "I covered for {b}. More than once. And {b} sold me out the first chance there was." }] },
  ],
  'meeting.case.grudge-vote': [
    { id: 'mt.gv1', turns: [{ by: 'a', say: "{b} helped put me on that block. Fine, that's the game. Just don't sit in my kitchen telling people you had no choice." }] },
    { id: 'mt.gv2', turns: [{ by: 'a', say: "{b}, you voted the way you voted. Own it. Stop telling everybody it wasn't you." }] },
    { id: 'mt.gv3', turns: [{ by: 'a', say: "{b} told me I had a vote, and then wrote my name. I'd like {b} to explain that. Here." }] },
    { id: 'mt.gv4', turns: [{ by: 'a', say: "{b}, you put me in that chair. I've stayed quiet about it. I'm done being quiet." }] },
    { id: 'mt.gv5', turns: [{ by: 'a', say: "Everybody keeps telling me how {b} voted. I'd like to hear it from {b}." }] },
    { id: 'mt.gv6', turns: [{ by: 'a', say: "I sat on that block because of {b}, and I'm still here. I'd like {b} to look at me and say why." }] },
  ],
  'meeting.case.grudge-promise': [
    { id: 'mt.gp1', turns: [{ by: 'a', say: "{b}, you gave me your word, and you broke it. I want everybody here to know what your word is worth." }] },
    { id: 'mt.gp2', turns: [{ by: 'a', say: "We had a deal. I kept my side. {b} didn't, and I'm not keeping quiet about it any more." }] },
    { id: 'mt.gp3', turns: [{ by: 'a', say: "{b} made me a promise in private. I'm making it public, so everybody knows what a promise from {b} is worth." }] },
    { id: 'mt.gp4', turns: [{ by: 'a', say: "{b}, you shook my hand on it. Do you want to tell everybody what we shook on, or shall I?" }] },
    { id: 'mt.gp5', turns: [{ by: 'a', say: "I kept every promise I made to {b}. {b} kept none of the ones made to me." }] },
    { id: 'mt.gp6', turns: [{ by: 'a', say: "We had a deal. I'm not saying what it was. I'm saying {b} broke it, and I want {b} to own that." }] },
  ],
  'meeting.case.grudge-left-out': [
    { id: 'mt.go1', turns: [{ by: 'a', say: "There was a conversation about the vote. Everybody was in it except me. {b} made sure of that." }] },
    { id: 'mt.go2', turns: [{ by: 'a', say: "{b} keeps deciding things for this house without asking half of it. I'm half of it. I'm asking now." }] },
    { id: 'mt.go3', turns: [{ by: 'a', say: "Every plan in this house gets made in a room I'm not in. {b} makes sure of it." }] },
    { id: 'mt.go4', turns: [{ by: 'a', say: "{b}, why do I find out what this house is doing from the people who aren't even in on it?" }] },
    { id: 'mt.go5', turns: [{ by: 'a', say: "I live in this house too. {b} keeps forgetting that, so I'm reminding everybody at once." }] },
    { id: 'mt.go6', turns: [{ by: 'a', say: "Doors shut when I walk past. {b} is behind most of them. I'd like to know why." }] },
  ],
  'meeting.case.grudge-plan': [
    { id: 'mt.gn1', turns: [{ by: 'a', say: "{b}, I know you're planning to come after me. I'd rather talk about it now, with everybody listening." }] },
    { id: 'mt.gn2', turns: [{ by: 'a', say: "I heard my name in {b}'s plans. So let's hear the plan. Out loud. Go on." }] },
    { id: 'mt.gn3', turns: [{ by: 'a', say: "My name's been going round this house for days, and it started with {b}. I want to hear why." }] },
    { id: 'mt.gn4', turns: [{ by: 'a', say: "{b}, if you want me out, say it here. Not in the storage room." }] },
    { id: 'mt.gn5', turns: [{ by: 'a', say: "{b} has been counting votes against me all week. Go on, {b}. How many have you got?" }] },
    { id: 'mt.gn6', turns: [{ by: 'a', say: "I know I'm on {b}'s list. I'd rather everybody heard it from me than from {b}." }] },
  ],
  'meeting.case.grudge-friction': [
    { id: 'mt.gf1', turns: [{ by: 'a', say: "{b} and I can't be in a room together without it turning into a row. I'm sick of it, and I think everybody else is too." }] },
    { id: 'mt.gf2', turns: [{ by: 'a', say: "Every day it's something with {b}. The tone, the comments, the eye-rolls. I want it said in front of everybody, so it stops." }] },
    { id: 'mt.gf3', turns: [{ by: 'a', say: "{b} and I haven't had one normal conversation since we walked in. Not one. I'd like to know why." }] },
    { id: 'mt.gf4', turns: [{ by: 'a', say: "The sighing, the comments, the looks. {b}, I'm asking you to stop, in front of everybody, so you can't say I never asked." }] },
    { id: 'mt.gf5', turns: [{ by: 'a', say: "This isn't about a vote. It's about living with {b}, and I can't do it any more." }] },
    { id: 'mt.gf6', turns: [{ by: 'a', say: "Everybody here has watched {b} and me bicker for weeks. I want it to stop today." }] },
  ],
  'meeting.case.power': [
    { id: 'mt.p1', turns: [{ by: 'a', say: "This is not a dictatorship." }, { beat: 'It is the only line anybody will remember.' }] },
    { id: 'mt.p2', turns: [{ by: 'a', say: "I want to know where everyone stands. One at a time." }] },
    { id: 'mt.p3', turns: [{ by: 'a', say: "I'm the HOH, and I want honesty. Who's with me and who isn't?" }] },
    { id: 'mt.p4', turns: [{ by: 'a', say: "Nobody should take the nominations personally. But I want to hear from all of you." }] },
    { id: 'mt.p5', turns: [{ by: 'a', say: "I've called you all here because I'm tired of hearing things second-hand." }] },
    { id: 'mt.p6', turns: [{ by: 'a', say: "Let's clear the air. As HOH, I think I've earned that." }] },
  ],
  'meeting.answer.silent': [
    { id: 'mt.s1', turns: [{ by: 'b', say: "Anyone?" }, { beat: 'Nobody says anything.' }] },
    { id: 'mt.s2', turns: [{ by: 'a', say: "Come on. Somebody say it." }, { beat: 'Nobody says it.' }] },
    { id: 'mt.s3', turns: [{ by: 'b', say: "Does anyone else want to speak first?" }, { beat: 'Nobody does.' }] },
    { id: 'mt.s4', turns: [{ by: 'a', say: "You all said it to me in private!" }, { beat: 'Everyone suddenly remembers less.' }] },
    { id: 'mt.s5', when: { third: true }, turns: [{ by: 'c', dr: "I agreed with {a} in the bedroom. With {b} sitting right there? I said nothing." }] },
    { id: 'mt.s6', turns: [{ by: 'b', say: "I'm happy to answer. Who's asking?" }, { beat: 'The room stays silent.' }] },
  ],
  'meeting.answer.lands': [
    { id: 'mt.a1', turns: [{ by: 'b', say: "I never said that." }, { beat: 'Then {b} explains it again, slightly differently.' }] },
    { id: 'mt.a2', turns: [{ by: 'b', say: "Who else has a problem with me?" }, { beat: 'Two hands go up.' }] },
    { id: 'mt.a3', when: { third: true }, turns: [{ by: 'b', say: "That's not true." }, { by: 'c', say: "It is. You told me the same thing." }] },
    { id: 'mt.a4', turns: [{ by: 'b', say: "It was just game talk." }, { beat: 'Two people describe separate promises that back {a} up.' }] },
    { id: 'mt.a5', turns: [{ by: 'b', say: "I... okay. Maybe I said something like that." }] },
    { id: 'mt.a6', turns: [{ by: 'b', dr: "{a} came with receipts. I didn't see that coming." }] },
  ],
  'meeting.answer.backfires': [
    { id: 'mt.b1', turns: [{ by: 'b', say: "Are you finished?" }, { beat: 'Someone on the sofa mutters, "Let {b} answer."' }] },
    { id: 'mt.b2', turns: [{ by: 'b', say: "Can I answer now?" }, { beat: 'It gets the biggest reaction of the meeting.' }] },
    { id: 'mt.b3', turns: [{ by: 'b', say: "I wasn't even in the room when you say I said that. Ask anyone." }, { beat: 'People start checking {a}\'s story instead.' }] },
    { id: 'mt.b4', turns: [{ by: 'a', say: "And another thing. You've been doing this since day one." }, { by: 'b', say: "Now it's since day one? Five minutes ago it was this week." }, { beat: 'The room turns on {a}.' }] },
    { id: 'mt.b5', when: { third: true }, turns: [{ by: 'c', say: "Let {b} speak, {a}." }, { by: 'a', say: "I'm just saying..." }, { by: 'c', say: "We know what you're saying." }] },
    { id: 'mt.b6', turns: [{ by: 'b', dr: "I barely had to defend myself. {a} did all the damage alone." }] },
  ],
  'meeting.answer.fizzles': [
    { id: 'mt.f1', when: { third: true }, turns: [{ by: 'c', say: "Can we talk about the kitchen instead? It's disgusting." }, { beat: 'Enough people laugh that the meeting is over.' }] },
    { id: 'mt.f2', when: { third: true }, turns: [{ by: 'c', say: "Why didn't you just talk to {b} in private?" }, { beat: 'Several people nod.' }] },
    { id: 'mt.f3', turns: [{ by: 'b', say: "Fine. Noted." }, { beat: '{b} leaves. Everyone follows.' }] },
    { id: 'mt.f4', turns: [{ beat: 'Two side arguments start before {a} has finished.' }, { by: 'a', say: "Can everyone just... listen?" }] },
    { id: 'mt.f5', turns: [{ by: 'a', say: "So we all agree to communicate better?" }, { beat: 'Everybody nods. Nobody means it.' }] },
    { id: 'mt.f6', turns: [{ by: 'b', say: "I'm sorry if anyone was upset." }, { by: 'a', say: "That's not what this was about." }] },
  ],
  'meeting.verdict.lands': [
    { id: 'mt.vl1', turns: [{ beat: 'The meeting breaks up. Two people stop {b} at the door to ask why the story changed.' }, { by: 'a', dr: "That went exactly how I needed it to." }] },
    { id: 'mt.vl2', turns: [{ by: 'a', dr: "I didn't have to shout. The truth did the work." }] },
    { id: 'mt.vl3', turns: [{ by: 'b', dr: "I walked into that meeting fine. I walked out with a target on my back." }] },
    { id: 'mt.vl4', turns: [{ by: 'a', dr: "Everyone heard it from {b}'s own mouth. That's all I wanted." }] },
    { id: 'mt.vl5', turns: [{ beat: 'Nobody says the meeting is over. People just start leaving.' }, { by: 'b', dr: "That went badly. Really badly." }] },
    { id: 'mt.vl6', turns: [{ by: 'a', dr: "For once, the whole house saw what I've been seeing all week." }] },
  ],
  'meeting.verdict.backfires': [
    { id: 'mt.vb1', turns: [{ beat: 'People leave in pairs. Every pair is talking about {a}.' }, { by: 'a', dr: "That didn't go how I planned." }] },
    { id: 'mt.vb2', turns: [{ by: 'a', dr: "I wanted the room on my side. I lost the room." }] },
    { id: 'mt.vb3', turns: [{ by: 'b', dr: "{a} called a meeting about me and made it all about {a}." }] },
    { id: 'mt.vb4', turns: [{ by: 'b', dr: "I didn't have to say much. {a} said more than enough for both of us." }] },
    { id: 'mt.vb5', turns: [{ by: 'a', dr: "Note to self: never call a house meeting angry." }] },
    { id: 'mt.vb6', turns: [{ beat: 'The room empties. {a} is left standing on {a.posAdj} own.' }, { by: 'a', dr: "Well. That backfired." }] },
  ],
  'meeting.verdict.silent': [
    { id: 'mt.vs1', turns: [{ by: 'a', dr: "Nothing got decided. Except that nobody in this house will say {b}'s name out loud." }] },
    { id: 'mt.vs2', turns: [{ by: 'b', dr: "Nobody said a word against me. That tells everyone who runs this house." }] },
    { id: 'mt.vs3', turns: [{ by: 'a', dr: "Everyone backed me up in private. In the room, nobody." }] },
    { id: 'mt.vs4', turns: [{ by: 'a', dr: "I'll remember who stayed quiet today." }] },
    { id: 'mt.vs5', turns: [{ by: 'b', dr: "{a} wanted a trial. {a} got a room full of people looking at the floor." }] },
    { id: 'mt.vs6', turns: [{ beat: 'Everyone leaves without a word.' }, { by: 'a', dr: "So that's how it is." }] },
  ],
  'meeting.verdict.fizzles': [
    { id: 'mt.vf1', turns: [{ by: 'a', dr: "Everyone promised to do better. Nothing will change." }] },
    { id: 'mt.vf2', turns: [{ by: 'b', dr: "That meeting was about nothing. {a} and I didn't even look at each other." }] },
    { id: 'mt.vf3', turns: [{ by: 'a', dr: "I called a house meeting and we ended up talking about the dishes." }] },
    { id: 'mt.vf4', turns: [{ beat: '{a} and {b} leave through different doors.' }, { by: 'a', dr: "Well. At least I said it." }] },
    { id: 'mt.vf5', turns: [{ by: 'b', dr: "{a} made a speech. Everyone nodded. Everyone forgot it by dinner." }] },
    { id: 'mt.vf6', turns: [{ by: 'a', dr: "I don't know what I expected from that meeting. Not this." }] },
  ],
};

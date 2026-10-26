// ══════════════════════════════════════════════════════════════════════
// pm/talk/blowup.js — when it kicks off, and the days after (pm/blowup.js)
// ══════════════════════════════════════════════════════════════════════
//
// Rewritten 2026-10-22 (the user: "redo the 11%"). The old rows were six
// shouted lines; a real one builds: somebody walks over, says the thing,
// the other one defends, it gets worse, somebody says one thing too far.
//   blowup         [a, b]     a goes for b. `of` is the grievance:
//                    cheating  cause partner: b is a's partner and did it ·
//                              cause rival: b was the other one. `kissed`: it was a kiss.
//                    casa      cause partner: b came back from Casa with someone ·
//                              cause rival: b is who they came back with
//                    steal     b went after a's partner (a recoupling, an ex, a friend)
//                    told      b told the villa something about a
//                    vote      b's vote or choice sent somebody home
//                    jealousy  b keeps going after who a wants
//                    history   they have never got on
//   pile-in        [a, b, c]  a steps in on b's side, against c
//   villa-divided  [a, b]     the villa after the row between a and b
//   cold-shoulder  [a, b]     opposite camps, days later
//   clear-the-air  [a, b]     `of`: peace · still-angry
// The row may only say what is true (pm/blowup.js: "don't invent things"):
// no kiss unless `kissed`, no "my partner" unless `cause` says so.
import { build } from './build.js';

const BIG = { tiered: false };

export const BLOWUP = build('blowup', {
  ...BIG,
  plans: { featured: ['open', 'charge', 'defend', 'push', 'crack?', 'land'], short: ['open', 'defend', 'land'] },
  moves: {
    open: [
      { when: { of: 'cheating', cause: 'partner' }, stage: "The bedroom. {a} walks in, shuts the door, and the whole villa hears it shut.", turns: [
        ['a', "Sit down. No, actually, stand up. I want to see your face when you explain it."],
        ['b', "Can we not do this here?"],
        ['a', "Where would you like to do it? Because everyone already knows. Everyone knew before I did."],
      ] },
      { when: { of: 'cheating', cause: 'partner' }, stage: "By the fire pit, and {a} doesn't bother keeping {a.posAdj} voice down.", turns: [
        ['a', "Were you ever going to tell me? Honestly. Were you going to wait until we got home and hope I never watched it back?"],
        ['b', "That's not fair."],
      ] },
      { when: { of: 'cheating', cause: 'rival' }, stage: "The garden, and it starts the second they see each other.", turns: [
        ['a', "Have you got a minute? Because I've got a few things to say, and I'd rather say them now than at dinner."],
        ['b', "Go on, then."],
        ['a', "You knew they were with me. Every single person in this villa knew they were with me."],
      ] },
      { when: { of: 'cheating', cause: 'rival' }, stage: "The kitchen. It starts quiet, and it doesn't stay quiet.", turns: [
        ['a', "Can I have a word?"],
        ['b', "Here's fine."],
        ['a', "Here's fine. Right. Then I'll say it here, in front of everyone, since you clearly don't mind an audience."],
      ] },
      { when: { of: 'casa', cause: 'partner' }, stage: "The morning after Casa Amor. Nobody has slept, and {a} is the first one up.", turns: [
        ['a', "I want to know when you decided. Was it the first night? The second? Or did you know before you even walked out of here?"],
        ['b', "It wasn't like that."],
      ] },
      { when: { of: 'casa', cause: 'rival' }, stage: "By the pool, with {b} on a sunbed that used to be {a}'s.", turns: [
        ['a', "Comfy? Good. Because that's my towel, and that was my bed, and up until a few days ago, that was my person."],
        ['b', "I didn't take anything from you."],
      ] },
      { when: { of: 'steal', ago: 'days' }, stage: "Days after the recoupling, and it still hasn't gone away. By the bench, it finally comes out.", turns: [
        ['a', "Do you know what's worse than what you did? You've been walking round ever since like it never happened."],
        ['b', "It was a recoupling. You pick who you want. I'm not going to keep apologising for it."],
      ] },
      { when: { of: 'steal', ago: 'today' }, stage: "Straight after the recoupling, by the bench.", turns: [
        ['a', "You couldn't wait, could you? You couldn't even give it one more day."],
        ['b', "It's a recoupling. You pick who you want. That's the whole point."],
      ] },
      { when: { of: 'steal' }, stage: "{a} finds {b} on the terrace and sits down without being asked.", turns: [
        ['a', "Two days ago you were sitting right here telling me how happy I looked. Do you remember that?"],
        ['b', "I do."],
        ['a', "And then you went and did that."],
      ] },
      { when: { of: 'told' }, stage: "The daybeds, and it gets loud fast.", turns: [
        ['a', "Why would you say that? Why would you go and say that to everyone, before you'd even said one word to me?"],
        ['b', "Because it was true."],
      ] },
      { when: { of: 'told' }, stage: "{a} walks straight through the kitchen towards {b}, and the kitchen gets out of the way.", turns: [
        ['a', "I've just had three people come up to me and repeat something I said to you. In confidence. You. Not them."],
        ['b', "I didn't think it was a secret."],
      ] },
      { when: { of: 'vote' }, stage: "The terrace, the night after the dumping. One sunbed is empty.", turns: [
        ['a', "Look at that bed. That's the bed you emptied. I hope you're sleeping well."],
        ['b', "That's not fair, and you know it isn't."],
      ] },
      { when: { of: 'vote' }, stage: "{a} has been waiting all day, and doesn't wait any longer.", turns: [
        ['a', "Just tell me why. That's all I want. Tell me why you picked them to go, and not anyone else."],
        ['b', "I had to pick someone."],
      ] },
      { when: { of: 'jealousy' }, stage: "The lawn. {a} has been watching for an hour, and walks over.", turns: [
        ['a', "Can you stop? Honestly, can you just stop? Every time I turn round, you're there."],
        ['b', "I'm allowed to sit where I want."],
      ] },
      { when: { of: 'jealousy', taken: true }, stage: "The kitchen. {a}'s partner has just walked off laughing, and {b} is still smiling after them.", turns: [
        ['a', "What's so funny?"],
        ['b', "Nothing. We were just talking."],
        ['a', "You're always just talking. You're always just talking to the person I'm with."],
      ] },
      { when: { of: 'history' }, stage: "The kitchen, over nothing at all, and then over everything.", turns: [
        ['a', "Oh, here we go. You've got that face on again."],
        ['b', "What face?"],
        ['a', "That face. The one you've had on since the first week, every time I open my mouth."],
      ] },
      { when: { of: 'history' }, stage: "It starts over a sunbed, and it was never about the sunbed.", turns: [
        ['a', "I was sitting there."],
        ['b', "There's no name on it."],
        ['a', "There never is with you, is there? Nothing's ever yours, nothing's ever your fault."],
      ] },
    ],
    charge: [
      { when: { of: 'cheating', cause: 'partner', kissed: true }, turns: [
        ['a', "You kissed someone else. You kissed someone else, and then you came back to bed and kissed me like nothing had happened. Do you know how that feels? To find out that every kiss since then was a lie?"],
      ] },
      { when: { of: 'cheating', cause: 'partner', kissed: false }, turns: [
        ['a', "I don't even care exactly what it was. I care that you did it, and then you looked me in the eye every day, and you said nothing. You let me tell everyone how solid we were."],
      ] },
      { when: { of: 'cheating', cause: 'partner' }, turns: [
        ['a', "I defended you. When people said things, I defended you. I sat at that table and told them they didn't know you like I do. And they knew you better than I did."],
      ] },
      { when: { of: 'cheating', cause: 'rival', kissed: true }, turns: [
        ['a', "You kissed somebody who was coupled up. With me. And then you sat at breakfast and asked me to pass the juice. You smiled at me. Who does that?"],
      ] },
      { when: { of: 'cheating', cause: 'rival' }, turns: [
        ['a', "I'm not stupid. I know they did it too. I'll be having a word with them, believe me. But you knew. You knew, and you went ahead anyway, and then you were nice to me. That's the bit I can't get over."],
      ] },
      { when: { of: 'casa', cause: 'partner' }, turns: [
        ['a', "I sat in this villa every night, loyal, turning down people left, right and centre, telling everyone you'd come back on your own. I said it out loud. I said it on camera. And you walked down those steps holding someone's hand."],
      ] },
      { when: { of: 'casa', cause: 'rival' }, turns: [
        ['a', "You knew about me before you even met them. You knew there was somebody waiting back here. And you still went for it, every day, until they turned."],
      ] },
      { when: { of: 'steal' }, turns: [
        ['a', "You knew how I felt. I told you. I sat with you and told you how much I liked them, and you listened, and you nodded, and then you went after them. You used what I told you."],
      ] },
      { when: { of: 'told' }, turns: [
        ['a', "If you had a problem with me, you could have come to me. That's all I'd have asked. Instead I've got half the villa looking at me sideways, and I'm the last one to know why."],
      ] },
      { when: { of: 'vote' }, turns: [
        ['a', "They were my best friend in here. You knew that. Everyone knew that. And when it came to it, you didn't even hesitate. You said their name like it was nothing."],
      ] },
      { when: { of: 'jealousy' }, turns: [
        ['a', "It's not a coincidence any more. It's every day. The daybeds, the kitchen, the pool. Wherever they are, you are, and you've got that look on your face, and I'm meant to just watch it."],
      ] },
      { when: { of: 'history' }, turns: [
        ['a', "Since the day I walked in, you've had a problem with me. I've tried. I have honestly tried. I've made you tea. I've laughed at your jokes, which isn't easy. And you still look at me like I've done something."],
      ] },
    ],
    defend: [
      { when: { of: 'cheating', cause: 'partner' }, turns: [
        ['b', "I know. I know, alright? I know how bad it is. I've felt sick about it every single day. I was going to tell you."],
        ['a', "When? After the final? At the airport?"],
      ] },
      { when: { of: 'cheating', cause: 'partner' }, turns: [
        ['b', "It meant nothing. I swear on my life, it meant nothing. It was one stupid moment, and I've regretted it ever since."],
        ['a', "Then why did you hide it, if it meant nothing?"],
      ] },
      { when: { of: 'cheating', cause: 'rival' }, turns: [
        ['b', "I didn't owe you anything. I'm sorry, but I didn't. They're the one who was with you. Take it up with them."],
        ['a', "Oh, I will. But I'm starting with you."],
      ] },
      { when: { of: 'cheating', cause: 'rival' }, turns: [
        ['b', "They told me it wasn't serious with you. They said it was basically over. What was I supposed to do, ask for proof?"],
        ['a', "You could have asked me. I was right there. I'm always right there."],
      ] },
      { when: { of: 'casa', cause: 'partner' }, turns: [
        ['b', "I didn't plan it. I went in there certain. And then I met someone, and I couldn't pretend I didn't feel something. Would you rather I'd lied?"],
        ['a', "I'd rather you'd come back."],
      ] },
      { when: { of: 'casa', cause: 'rival' }, turns: [
        ['b', "I'm not going to apologise for how they feel about me. They made their own choice. I didn't drag anyone down those steps."],
        ['a', "No, you just made sure they wanted to walk down them with you."],
      ] },
      { when: { of: 'steal' }, turns: [
        ['b', "Nobody in here belongs to anybody. I followed my heart. I'm sorry it hurt you, I really am, but I'm not sorry I did it."],
        ['a', "You're not sorry. At least you've said it."],
      ] },
      { when: { of: 'told' }, turns: [
        ['b', "I didn't go round telling everyone. I told one person, because it was eating me up, and they told everyone else. That's not on me."],
        ['a', "It started with you. Everything started with you."],
      ] },
      { when: { of: 'vote' }, turns: [
        ['b', "Somebody had to go. It wasn't personal. It was the hardest thing I've done in here, and you're acting like I enjoyed it."],
        ['a', "Did you lose any sleep over it? Because I did."],
      ] },
      { when: { of: 'jealousy' }, turns: [
        ['b', "We're friends. We get on. I'm not going to stop talking to someone because it makes you feel insecure. That's your problem, not mine."],
        ['a', "Don't you dare call me insecure."],
      ] },
      { when: { of: 'history' }, turns: [
        ['b', "Every time something goes wrong in this villa, you come looking for me. Every time. Have you ever thought it might be you?"],
        ['a', "Oh, it's always me, isn't it?"],
      ] },
      { turns: [
        ['b', "You've already decided what happened. You decided before you walked over here. So what's the point of me saying anything?"],
        ['a', "The point is I want to hear you say it."],
      ] },
    ],
    push: [
      { when: { of: 'cheating', cause: 'partner' }, turns: [
        ['a', "Everyone saw it. Everyone. And you let me walk round this villa smiling."],
        ['b', "I didn't know how to tell you."],
        ['a', "You open your mouth, and you say it. That's how. It's not hard. It's only hard when you're a coward."],
        ['b', "Don't call me that."],
        ['a', "Then don't be one."],
      ] },
      { when: { of: 'cheating', cause: 'rival' }, turns: [
        ['b', "You're making me the villain because it's easier than being angry at them."],
        ['a', "Don't tell me who I'm angry at. I've got enough to go round."],
        ['b', "Clearly."],
      ] },
      { when: { of: 'steal' }, turns: [
        ['a', "You said we were friends."],
        ['b', "We are."],
        ['a', "No. We're not. Friends don't do that. I don't know what we are, but we're not that."],
      ] },
      { turns: [
        ['b', "Can you stop shouting? Everyone's looking."],
        ['a', "Let them look! Let them all look. I'm not the one who should be embarrassed here."],
        ['b', "You're making a scene."],
        ['a', "You made the scene. I'm just the one reading it out."],
      ] },
      { turns: [
        ['a', "Look at me. Look at me when I'm talking to you."],
        ['b', "I am looking at you."],
        ['a', "You're looking past me. You've been looking past me for days, and I'm only just working out why."],
      ] },
      { turns: [
        ['b', "I'm not doing this with you. Not like this."],
        ['a', "Not like what? Honest? Because this is the most honest this villa's been all week."],
        ['b', "Fine. You want honest? You've been impossible since the day you got here."],
      ] },
      { turns: [
        ['a', "Do you know what the worst bit is? I actually liked you. I thought you were one of the good ones."],
        ['b', "I am one of the good ones."],
        ['a', "Then the good ones in here are in trouble."],
      ] },
    ],
    crack: [
      { turns: [['b', "Maybe if you weren't so hard to be around, people wouldn't have to go behind your back."]], beat: "Even the people pretending not to listen stop pretending." },
      { turns: [['a', "You know what? You're welcome to each other. Honestly. You deserve each other."]], beat: "{a} turns and walks off, and leaves the door swinging." },
      { turns: [['a', "I hope it was worth it. I really hope, when you watch this back, you think it was worth it."]] },
      { turns: [['b', "Say what you want. You'll still be the one crying in the bathroom tonight."]], beat: "Somebody gasps. Somebody actually gasps." },
      { turns: [['a', "Don't talk to me. Don't sit near me. Don't make me a drink. I'm done."], ['b', "Fine by me."]] },
      { turns: [['b', "I'm sorry. I'm sorry. What else do you want me to say?"], ['a', "Nothing. There's nothing you could say now."]] },
    ],
    land: [
      { turns: [], beat: "Two of the others move between them, and nobody quite knows who they're protecting." },
      { turns: [], beat: "The whole garden has stopped pretending not to watch." },
      { turns: [], beat: "{a} storms off to the bathroom. Three people follow. Nobody follows {b}." },
      { turns: [], beat: "{b} sits down on the edge of the pool and doesn't say another word for an hour." },
      { turns: [], beat: "Somebody turns the music off. Nobody turns it back on." },
      { turns: [], beat: "It goes quiet, the kind of quiet that's louder than the shouting was." },
    ],
  },
});

export const PILE_IN = build('pile-in', {
  ...BIG,
  plans: { featured: ['step', 'push', 'land'], short: ['step', 'land'] },
  moves: {
    step: [
      { stage: "{a} gets up off the daybed and walks straight over.", turns: [
        ['a', "What's going on? Why is {b} upset?"],
        ['c', "Ask {b}."],
        ['a', "I'm asking you. You're the one doing the shouting."],
      ] },
      { turns: [
        ['a', "No. Leave {b} alone. You've said your piece, {c}. Everyone heard it. That's enough."],
        ['c', "This has got nothing to do with you."],
        ['a', "It does now."],
      ] },
      { turns: [
        ['a', "Everyone's thinking it, so I'll say it. {b} is right. I'm sorry, {c}, but {b} is right, and you know it."],
      ] },
      { turns: [
        ['a', "Can we all just calm down for a second? {b} hasn't done what you're saying. I was there. I was literally there."],
        ['c', "Of course you're on {b}'s side."],
      ] },
      { when: { known: true }, turns: [
        ['a', "You've been wanting a go at {b} all week, {c}. Don't stand there and pretend this is about tonight. It's not. It never is with you."],
      ] },
      { stage: "{a} puts {a.posAdj} drink down and stands up, and that's when everyone knows it's got serious.", turns: [
        ['a', "Right. I've sat here and listened to all of it, and I'm not sitting here any more."],
        ['c', "Here we go."],
      ] },
    ],
    push: [
      { turns: [
        ['c', "Stay out of it. Honestly. This is between me and {b}."],
        ['a', "Not while you're talking to {b} like that, it isn't. You don't get to talk to my friend like that. Not in front of me."],
      ] },
      { turns: [
        ['c', "Look at {b}! Look at what {b} did, and then tell me I'm the problem."],
        ['a', "I'm looking at you. And honestly, {c}, have a look at yourself right now. Have a good long look."],
      ] },
      { turns: [
        ['a', "I'm not picking sides. I'm just saying you're out of order."],
        ['c', "That is picking sides."],
        ['a', "Then fine. I've picked one."],
      ] },
      { turns: [
        ['a', "{b}, don't. Don't give {c.obj} the reaction. That's what {c} wants."],
        ['b', "I know."],
        ['a', "Then come with me. Come on. You don't have to stand here and listen to this."],
      ] },
      { turns: [
        ['c', "Oh, here comes the cavalry."],
        ['a', "Say it to me, then, {c}. Go on. Say it to me instead."],
        ['c', "This isn't about you."],
        ['a', "It is now."],
      ] },
    ],
    land: [
      { turns: [], beat: "{a} steps right in front of {b}. That splits the garden straight down the middle." },
      { turns: [], beat: "{a} leads {b} away, and {c} is left shouting at the pair of them across the lawn." },
      { turns: [], beat: "{c} stares at {a}, who has picked a side, and everyone saw which." },
      { turns: [], beat: "Two more islanders get up off the daybeds. It's not a fight between two people any more." },
    ],
  },
});

export const VILLA_DIVIDED = build('villa-divided', {
  ...BIG,
  plans: { featured: ['split', 'here', 'there', 'land'], short: ['split', 'land'] },
  moves: {
    split: [
      { stage: "An hour after the fight. Two huddles, at opposite ends of the garden, and {a} and {b} in the middle of one each.", turns: [] },
      { stage: "Dinner is two tables tonight. Nobody has said why. Nobody needs to.", turns: [] },
      { stage: "The terrace has gone one way and the kitchen has gone the other. {a} is on the terrace. {b} is in the kitchen.", turns: [] },
      { stage: "Lights out, and every bed in the villa is whispering about {a} and {b}.", turns: [] },
    ],
    // Two huddles, two ends of the garden: they talk to their own side, never to each other.
    here: [
      { turns: [['a', "I don't need anyone to agree with me. I just need people to stop pretending it didn't happen."]], beat: "At the other end of the garden, {b} has a huddle of {b.posAdj} own." },
      { turns: [['a', "Did you see how many of them went and sat with {b}? Fine. Now I know who my friends are."]], beat: "Across the lawn, {b} is saying something very similar about {a}." },
      { turns: [['a', "I'm not going to sit in a room with {b} and pretend everything's fine. I'm not built like that."]], beat: "Over in the kitchen, the other half of the villa is hearing {b}'s side." },
    ],
    there: [
      { turns: [['b', "Some people in this villa want a villain. Fine. I'll be the villain. I know what I did and what I didn't."]] },
      { turns: [['b', "{a} is going round recruiting. Let {a.obj}. I'm not asking anyone to pick a side."]] },
      { turns: [['b', "Everyone's being so careful round me, like one of us is going to go off again. I'm not. I'm done."]] },
    ],
    land: [
      { turns: [], beat: "Nobody crosses the lawn for the rest of the night." },
      { turns: [], beat: "Somebody puts the music on. Nobody dances." },
      { turns: [], beat: "The fight is over. Whatever this is has only just started." },
    ],
  },
});

export const COLD_SHOULDER = build('cold-shoulder', {
  plans: { featured: ['freeze', 'crack', 'land'], short: ['freeze', 'land'] },
  moves: {
    freeze: [
      { stage: "The kitchen, first thing. {a} says good morning to everyone except {b}.", turns: [
        ['b', "Morning to you too."],
        ['a', "Oh. Morning."],
      ] },
      { stage: "{a} and {b} reach for the kettle at the same time.", turns: [
        ['a', "Go on."],
        ['b', "No, you go."],
        ['a', "I said go on."],
      ] },
      { stage: "{a} sits down on the daybeds, and {b} gets up off them.", turns: [
        ['a', "Seriously? I've only just sat down."],
        ['b', "I was going anyway."],
      ] },
      { stage: "The kitchen goes quiet when {a} walks in and {b} is already there.", turns: [
        ['b', "I'll come back later."],
        ['a', "You don't have to leave every time I walk in a room."],
        ['b', "I know I don't."],
      ] },
      { stage: "Dinner. {a} and {b} are at opposite ends of the table, and the salt is in the middle.", turns: [
        ['a', "Can somebody pass the salt?"],
        ['b', "It's right in front of you."],
        ['a', "I was asking somebody else."],
      ] },
    ],
    crack: [
      { turns: [
        ['a', "Are we really not talking? Are we really going to do this for the rest of the summer?"],
        ['b', "You made your choice the other night. I'm just going along with it."],
      ] },
      { turns: [
        ['b', "I heard what you said about me, by the way. After. On the terrace."],
        ['a', "Then you heard the truth."],
        ['b', "Your version of it."],
      ] },
      { turns: [
        ['a', "This is so childish. We're grown adults walking round a villa avoiding each other."],
        ['b', "Then stop following me round it."],
      ] },
    ],
    land: [
      { turns: [], beat: "{b} looks straight through {a} and keeps walking." },
      { turns: [], beat: "Neither of them moves. Somebody else passes it, eventually." },
      { turns: [], beat: "{a} doesn't turn round. {b} doesn't expect {a.obj} to." },
    ],
  },
});

export const CLEAR_THE_AIR = build('clear-the-air', {
  ...BIG,
  plans: { featured: ['ask', 'say', 'answer', 'land'], short: ['ask', 'answer', 'land'] },
  moves: {
    ask: [
      { stage: "The daybeds, away from everyone, late.", turns: [
        ['a', "Can we talk? Properly. No shouting. I don't think either of us can do another day of this."],
        ['b', "Please. I'm exhausted."],
      ] },
      { stage: "{a} comes and finds {b} by the pool, with two cups of tea.", turns: [
        ['a', "Peace offering. It's only tea. Don't read into it."],
        ['b', "I'm reading into it."],
      ] },
      { stage: "The terrace. Both of them with arms folded, and everyone else suddenly busy inside.", turns: [
        ['a', "Right. Somebody's got to go first, so I'll go first."],
        ['b', "Go on, then."],
      ] },
    ],
    say: [
      { when: { of: 'peace' }, turns: [
        ['a', "I said things the other day I didn't mean. Some of them I did mean, I'm not going to lie. But not how I said them. Not in front of everyone like that."],
      ] },
      { when: { of: 'still-angry' }, turns: [
        ['a', "I'm not out here to say I was wrong. I want to be clear about that. I'm out here because I'm sick of the atmosphere, and so is everyone else."],
      ] },
      { turns: [
        ['a', "I've been walking round this villa for days with my jaw clenched. I'm tired of it. I don't even remember what it's like to just sit down without checking where you are first."],
      ] },
      { turns: [
        ['a', "I think we're more alike than either of us wants to admit. That's probably the whole problem, honestly. Two people who won't back down."],
      ] },
    ],
    answer: [
      { when: { of: 'peace' }, turns: [
        ['b', "So did I. Most of what I said, I didn't mean. Some of it, I'm sorry I even thought."],
        ['a', "Most of it?"],
        ['b', "Don't push it."],
        ['a', "Clean slate?"],
        ['b', "Clean-ish."],
      ] },
      { when: { of: 'peace' }, turns: [
        ['b', "I don't want to spend the rest of this fighting with you. Life's too short, and the summer's even shorter."],
        ['a', "Truce?"],
        ['b', "Truce."],
      ] },
      { when: { of: 'peace' }, turns: [
        ['b', "I'm sorry. Properly sorry. Not because everyone's watching. Because I'm sorry."],
        ['a', "Me too. Come here."],
      ] },
      { when: { of: 'still-angry' }, turns: [
        ['b', "Then say sorry."],
        ['a', "I'm not saying sorry for being right."],
        ['b', "Then I don't know what we're doing out here."],
      ] },
      { when: { of: 'still-angry' }, turns: [
        ['b', "Do you actually regret any of it? Honestly?"],
        ['a', "Honestly? No."],
        ['b', "Then why are we doing this?"],
      ] },
      { when: { of: 'still-angry' }, turns: [
        ['b', "I'll be civil. That's all I can do right now."],
        ['a', "Civil's fine."],
        ['b', "Civil's more than you've managed so far."],
      ] },
    ],
    land: [
      { when: { of: 'peace' }, turns: [], beat: "They hug, awkwardly, and then properly." },
      { when: { of: 'peace' }, turns: [], beat: "Somebody on the terrace actually claps, and they both tell them to shut up." },
      { when: { of: 'peace' }, turns: [], beat: "The whole villa breathes out." },
      { when: { of: 'still-angry' }, turns: [], beat: "{b} walks off first. {a} stays put, staring at the pool." },
      { when: { of: 'still-angry' }, turns: [], beat: "Neither of them budges an inch, and the tea goes cold." },
    ],
  },
});

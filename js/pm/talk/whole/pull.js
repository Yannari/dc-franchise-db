// pm/talk/whole/pull.js — {a} pulls {b} for a chat. One talk, start to finish
// (pm/script.js talkScript `whole`), in the speakers' own voices (whole/voice.js).
// Season read 2026-10-30: the stitched pull went from "does Jess know you're
// over here?" to "you've got a really nice smile" to "thank you for saying yes".
// The engine has decided how it ends (`end`: flirt · kissed · promised ·
// turned-down); the talk says it, and nothing else.
//   story    'graft': {b} is with {pb}, and this is the chase · 'spark': both single
//   taken    {a} has a partner ({pa}) · bTaken: {b} does ({pb})
//   fresh    {a} has only just walked in
import { say } from './voice.js';

const NONE = [undefined, null];
// A talk that lands but shows no kiss or promise (those have their own, `kissed` / `promised`).
const LANDS = ['flirt', 'kissed', 'promised'];

// How each ending finishes a talk, after the last line.
const KISS_BEATS = ["{a} leans in, and {b} doesn't pull away.", "{b} kisses {a} first, and then looks round to see who saw."];

export const PULL_WHOLE = { moves: { whole: [
  // ── the chase: {b} is with {pb}, {a} is single ──
  { when: { story: 'graft', bTaken: true, taken: false, end: 'turned-down', rebuffed: true }, stage: "{a} catches {b} on the way back from the kitchen.", turns: [
    ['a', "Can I talk to you for a minute? On our own?"],
    ['b', "Okay. What's up?"],
    say('a', "I like you. I've liked you for a while, and I know you're with {pb}. I just didn't want to get to the end of this and never say it.", {
      lad: "I'm just going to be straight with you. I like you. I know you're with {pb}. I'd rather say it than spend another week wondering.",
      nervy: "I've been trying to say this all week. I like you. I know you're with {pb}. Sorry. I just had to say it.",
      flirty: "I'm going to be honest, because I think you already know. I like you. A lot. {pb} or no {pb}.",
    }),
    say('b', "I'm glad you told me. But I'm with {pb}, and I'm happy. I'm not going to pretend there's a door open when there isn't.", {
      soft: "That's really sweet, and I'm sorry. I'm happy with {pb}. I don't want to lead you on.",
      sharp: "No. I'm with {pb}. I'm not doing this.",
      romantic: "I'm flattered. I really am. But I've found my person, and it's {pb}.",
    }),
    ['a', "Okay. I understand."],
    ['b', "I hope we can still be friends."],
    say('a', "Yeah. Of course we can.", { quiet: "Yeah. Of course." }),
  ], beat: "{a} walks back to the others, and doesn't look round." },

  { when: { story: 'graft', bTaken: true, taken: false, end: 'turned-down', rebuffed: true }, stage: "{a} finds {b} on the terrace and sits down beside {b.obj}.", turns: [
    ['a', "I need to ask you something, and I need an honest answer."],
    ['b', "Go on."],
    ['a', "Is there any part of you that's interested in me? Even a bit?"],
    say('b', "No. I'm sorry. You're lovely, but it's {pb} for me.", {
      soft: "I'm sorry. I don't feel that way. And I'd hate for you to keep hoping.",
      lad: "Honestly? No. Sorry. I'm with {pb}, and I'm happy. I'd rather tell you straight.",
    }),
    say('a', "That's fine. I needed to hear it.", {
      romantic: "Okay. It hurts, but I'd rather know.",
      lad: "Fair enough. At least I asked.",
    }),
  ], beat: "{b} squeezes {a.posAdj} arm, and goes back to find {pb}." },

  { when: { story: 'graft', bTaken: true, taken: false, end: 'flirt' }, stage: "{a} asks {b} for a chat, and they sit down on the swing seat.", turns: [
    say('a', "I wanted to talk to you properly. Not with everyone around.", { lad: "I've been wanting to get you on your own all day." }),
    ['b', "What about?"],
    ['a', "You. I like talking to you. I know you're with {pb}, but I can't help it."],
    say('b', "I like talking to you too. I'm not going to lie about that.", {
      flirty: "I like it too. More than I should, if I'm honest.",
      nervy: "I like talking to you too. That's the problem, isn't it?",
    }),
    ['a', "So what do we do?"],
    ['b', "Nothing. Not yet. I need to think about it."],
  ], beat: "They sit there a little longer than they need to." },

  { when: { story: 'graft', bTaken: true, taken: false, end: 'flirt' }, stage: "{a} and {b} end up on the daybeds on their own.", turns: [
    ['a', "Can I ask you something? How are things with {pb}? Honestly."],
    ['b', "Why do you want to know?"],
    say('a', "Because I like you. If it's going really well, I'll leave you alone. But if it isn't, I want you to know I'm here.", {
      lad: "Because I like you, and I'm not going to pretend I don't. If you're happy, I'll back off. Just tell me.",
    }),
    say('b', "It's fine. It's nice. I just don't know if it's what I want.", {
      sharp: "It's fine. Don't read anything into that.",
      nervy: "It's okay. I think. I don't know. I don't want to talk about {pb} with you.",
    }),
    ['a', "That's not a no."],
    ['b', "It's not a yes, either."],
  ], beat: "{b} smiles, and doesn't move away." },

  { when: { phase: 'evening', story: 'graft', bTaken: true, taken: false, end: 'kissed', kissed: true }, stage: "{a} and {b} are on their own at the end of the garden, as the sun goes down.", turns: [
    ['a', "I've wanted to talk to you on your own for days."],
    ['b', "I know. I've seen you looking."],
    say('a', "I can't stop thinking about you. I know you're with {pb}. I'm sorry. I just can't.", {
      lad: "I can't get you out of my head. I know you're with {pb}. I've tried. It's not working.",
      flirty: "I keep thinking about what it would be like to kiss you. Sorry. I know you're with {pb}.",
    }),
    say('b', "I've been thinking about you too. That's what scares me.", {
      soft: "Me too. And I feel so guilty, because of {pb}.",
    }),
    ['a', "Then don't think about {pb} for one minute."],
  ], beat: KISS_BEATS[0] },

  { when: { story: 'graft', bTaken: true, taken: false, end: 'promised', promised: true }, stage: "{a} and {b} are sitting on the steps by the pool.", turns: [
    ['a', "I'm not going to pretend. I like you, and I know you're with {pb}."],
    say('b', "I know you do. And I think I like you too.", {
      nervy: "I think I like you too. I don't know what to do about it.",
      sharp: "I'm not going to say I don't. But I'm not doing anything behind {pb}'s back.",
    }),
    ['a', "So what happens now?"],
    ['b', "I talk to {pb} first. I owe {pb.obj} that. And then we'll see."],
    ['a', "I can wait."],
  ], beat: "{b} goes inside to look for {pb}." },

  // ── both of them already coupled ──
  { when: { story: 'graft', bTaken: true, taken: true, end: 'turned-down', rebuffed: true }, stage: "{a} asks {b} for a word by the outdoor shower.", turns: [
    say('a', "I know I'm with {pa}, and you're with {pb}. But I can't keep pretending I don't feel something when I'm around you.", {
      lad: "I'm with {pa}, you're with {pb}, I know. But I'm not going to lie, there's something there. I feel it every time.",
    }),
    ['b', "Go back to {pa}. Please. You've got someone who likes you, and you're standing here with me."],
    ['a', "Is that a no?"],
    say('b', "It's a no. I'm not doing that to {pb}, and you shouldn't do it to {pa}.", {
      soft: "It's a no. I'm sorry. I couldn't hurt {pb} like that.",
    }),
  ], beat: "{a} nods, and walks back the long way round." },

  { when: { story: 'graft', bTaken: true, taken: true, end: LANDS, kissed: false, promised: false }, stage: "{a} and {b} end up alone by the fire pit.", turns: [
    ['a', "I know how this looks. I'm with {pa}, you're with {pb}, and I'm sitting here with you anyway."],
    ['b', "Then why are you?"],
    say('a', "Because I can't stop thinking about you. I care about {pa}. But I don't feel about {pa} the way I feel about you.", {
      romantic: "Because when I'm with you, I feel something I've never felt with {pa}. I didn't know it could feel like this.",
      lad: "Because I can't help it. {pa}'s great. But you're the one I want to talk to.",
    }),
    say('b', "This is such a mess. Two couples, and we're the ones sitting here making it worse.", {
      nervy: "We can't do this. Can we? I don't know. I don't know what we're doing.",
    }),
    ['a', "I know. Do you want me to go?"],
    ['b', "No. That's the problem."],
  ], beat: "They don't say anything else, and neither of them gets up." },

  // ── two singles, both looking ──
  { when: { story: 'spark', end: 'flirt' }, stage: "{a} finds {b} on the daybeds and sits down next to {b.obj}.", turns: [
    say('a', "Every time we're in the same conversation, I come away wishing it had gone on longer. So I thought I'd get you on your own.", {
      lad: "I've been meaning to get you on your own all day. Every time we talk, someone interrupts.",
      bestie: "Right. I'm stealing you. Every time we talk, somebody comes over, and I'm not having it.",
      nervy: "Sorry, is this okay? I've wanted to talk to you properly for ages.",
    }),
    say('b', "I'm glad you did. I was hoping you would.", { flirty: "Took you long enough.", quiet: "I'm glad. I was hoping." }),
    ['a', "So, are you looking at anyone in here?"],
    ['b', "Maybe. What about you?"],
    ['a', "Maybe."],
  ], beat: "They both laugh, and neither of them looks away." },

  { when: { story: 'spark', end: 'flirt' }, stage: "{a} and {b} are lying on the sunbeds next to each other.", turns: [
    ['a', "Can I be honest with you? We're both single, and I keep catching you looking at me. Am I making that up?"],
    say('b', "No. You're not making that up.", { sharp: "No. I'm not going to pretend you are.", soft: "No. I've been hoping you'd notice." }),
    ['a', "Good. I'd have been so embarrassed."],
    ['b', "So what now?"],
    ['a', "Now we spend some time together and see."],
  ], beat: "{b} moves {b.posAdj} sunbed a little closer." },

  { when: { phase: 'evening', story: 'spark', end: 'kissed', kissed: true }, stage: "{a} and {b} are on the roof terrace, the villa lit up below them.", turns: [
    ['a', "I've been trying to get you up here all night."],
    ['b', "Why?"],
    say('a', "Because I like you. And I wanted to tell you without anyone listening.", {
      lad: "Because I like you, and I wanted to tell you without the whole villa watching.",
      romantic: "Because I think about you all the time, and I wanted you to know.",
    }),
    say('b', "I like you too. I have since the first day.", { quiet: "Me too.", flirty: "I was wondering when you'd say it." }),
  ], beat: KISS_BEATS[1] },

  { when: { story: 'spark', end: 'kissed', kissed: true }, stage: "{a} and {b} are the last two still in the pool.", turns: [
    ['b', "Everyone's gone to get ready."],
    ['a', "Good. I wanted you on your own."],
    ['b', "Oh, did you?"],
    say('a', "I really like you. I don't know how to say it any better than that.", {
      lad: "I really like you. That's it. That's what I wanted to say.",
      nervy: "I really like you. Sorry. I've been practising that all day, and it still came out wrong.",
    }),
    ['b', "It came out fine."],
  ], beat: KISS_BEATS[0] },

  { when: { story: 'spark', end: 'promised', promised: true }, stage: "{a} and {b} are sitting on the swing seat.", turns: [
    ['a', "I think we should give this a real go. You and me."],
    say('b', "Are you sure? You're not just saying that because we're both single?", { soft: "I'd really like that. Do you mean it?" }),
    ['a', "I'm sure. I've wanted to say it for days."],
    ['b', "Then yes. Let's see where it goes."],
  ], beat: "{a} takes {b}'s hand, and they sit there until somebody calls them in." },

  { when: { story: 'spark', end: 'turned-down', rebuffed: true }, stage: "{a} asks {b} for a chat on the daybeds.", turns: [
    ['a', "I've been wanting to talk to you. I think there's something between us."],
    say('b', "I really like you. But as a friend. I'm sorry.", {
      soft: "I'm sorry. I love talking to you, but I don't feel it that way. I didn't want to lead you on.",
      sharp: "I don't see you like that. I'd rather say it now.",
    }),
    say('a', "Oh. Okay. I thought maybe.", { lad: "Fair enough. Can't blame me for trying." }),
    ['b', "I'm glad you said something, though."],
  ], beat: "{a} smiles, but it doesn't reach {a.posAdj} eyes." },

  // ── just getting to know somebody ──
  { when: { story: NONE, bTaken: false, taken: false, end: LANDS, kissed: false, promised: false }, stage: "{a} catches {b} on the way back from the kitchen.", turns: [
    ['a', "Have you got a minute? I've barely spoken to you since you got here."],
    ['b', "Go on, then."],
    ['a', "So what are you looking for in here?"],
    say('b', "Someone I can be myself with. Someone kind.", {
      flirty: "Someone who can keep up with me.",
      romantic: "The real thing. Someone I'm still with when this is all over.",
      lad: "Someone I can have a laugh with. That's it, really.",
    }),
    ['a', "That's what I want too."],
    ['b', "Is that why you came over?"],
    ['a', "Maybe."],
  ], beat: "{b} laughs, and they keep talking long after everyone else has wandered off." },

  { when: { story: NONE, bTaken: false, taken: false, end: 'turned-down', rebuffed: true }, stage: "{a} sits down next to {b} by the pool.", turns: [
    ['a', "I wanted to see if there's anything between us."],
    say('b', "You're really nice. I just don't feel it. Sorry.", { sharp: "I don't think so. Sorry. Better to say it now." }),
    ['a', "No, it's fine. Better to know."],
  ], beat: "{a} gets up, and goes to find someone else to sit with." },

  { when: { story: NONE, bTaken: true, end: 'turned-down', rebuffed: true }, stage: "{a} asks {b} for a chat by the fire pit.", turns: [
    ['a', "I know you're with {pb}. I just wanted to see if you were happy."],
    say('b', "I am. Really happy. Why?", { sharp: "I am. So whatever this is, don't." }),
    ['a', "No reason. I just wanted to check."],
    ['b', "It's {pb}. I'm not looking anywhere else."],
  ], beat: "{a} nods, and that's the end of it." },

  { when: { story: NONE, bTaken: true, end: LANDS, kissed: false, promised: false }, stage: "{a} and {b} sit down together on the swing seat.", turns: [
    ['a', "I know you're with {pb}. I just like talking to you."],
    say('b', "I like talking to you too. There's nothing wrong with that.", { flirty: "There's nothing wrong with talking. Is there?" }),
    ['a', "No. Nothing wrong at all."],
  ], beat: "They talk for longer than either of them meant to." },

  { when: { story: NONE, taken: true, bTaken: false, end: LANDS, kissed: false, promised: false }, stage: "{a} catches {b} on the way back from the shower.", turns: [
    ['a', "Have you got a second? I haven't really got to know you yet."],
    ['b', "Aren't you with {pa}?"],
    say('a', "I am. I'm just getting to know people. That's allowed.", {
      lad: "I am. It's just a chat. I'm allowed to have a chat.",
      player: "I am. But I like to know everyone in here.",
    }),
    ['b', "If you say so."],
  ], beat: "{b} sits down anyway." },

  // ── just walked in ──
  { when: { fresh: true, bTaken: true, end: LANDS, kissed: false, promised: false }, stage: "{a}, only just through the door, asks {b} for a chat.", turns: [
    say('a', "I'll be honest. Before I even walked in, you were the one I wanted to talk to.", {
      lad: "I'll be straight with you. I walked in, I saw you, and that was it.",
      flirty: "I came in here for you. I'm not going to pretend I didn't.",
    }),
    ['b', "I'm with {pb}, you know."],
    ['a', "Everyone's made very sure I know. I still wanted one conversation with you."],
    say('b', "One conversation. Go on, then.", { soft: "Okay. One conversation can't hurt." }),
  ], beat: "{b} sits down, and {pb} watches from across the garden." },

  { when: { fresh: true, bTaken: false, end: LANDS, kissed: false, promised: false }, stage: "{a}, only just through the door, sits down next to {b}.", turns: [
    ['a', "I'm going to get straight to it, because I haven't got long. You were the first person I noticed."],
    say('b', "Really? Me?", { flirty: "I noticed you noticing.", nervy: "Me? Are you sure?" }),
    ['a', "You. I want to get to know you."],
    ['b', "Then get to know me."],
  ], beat: "They talk until somebody shouts that dinner's ready." },
  // ── kisses the cases above don't cover ──
  { when: { phase: 'evening', story: 'graft', bTaken: true, taken: true, end: 'kissed', kissed: true }, stage: "{a} and {b} end up alone by the fire pit, after everyone has gone to bed.", turns: [
    ['a', "We shouldn't be out here."],
    ['b', "I know."],
    say('a', "I keep telling myself it's nothing. It's not nothing, is it?", { lad: "I keep telling myself it's nothing. It's not, though." }),
    ['b', "No. It's not."],
  ], beat: "{b} kisses {a}, and then they both look back at the villa, at the beds where {pa} and {pb} are asleep." },
  { when: { story: NONE, taken: false, bTaken: false, end: 'kissed', kissed: true }, stage: "{a} and {b} are sitting on the edge of the pool, feet in the water.", turns: [
    ['a', "I've really liked getting to know you today."],
    say('b', "Me too. I didn't expect to.", { flirty: "Me too. I've been waiting for you to do something about it." }),
    ['a', "Can I kiss you?"],
    ['b', "Yeah. You can."],
  ], beat: "{a} leans in, and when they pull apart, they're both smiling." },
  // ── more of the common ones (season read: one talk a situation repeated for the same two) ──
  { when: { story: 'graft', bTaken: true, taken: false, end: 'turned-down', rebuffed: true }, stage: "{a} waits until {b} is on {b.posAdj} own by the pool.", turns: [
    say('a', "I'm going to say this once, and then I'll leave you alone. I've got feelings for you.", {
      lad: "I'm going to say it once and then I'll shut up. I like you. A lot.",
      romantic: "I can't keep it in any longer. I've got feelings for you. Real ones.",
    }),
    ['b', "I'm with {pb}."],
    ['a', "I know. I'm not asking you to leave {pb}. I just needed you to know."],
    say('b', "Okay. Now I know. But nothing's going to happen. I'm sorry.", {
      soft: "Thank you for telling me. I'm sorry. Nothing's going to happen, and I don't want you to wait.",
      sharp: "Okay. And now you know my answer. It's no.",
    }),
  ], beat: "{a} nods, and goes back inside." },
  { when: { story: 'graft', bTaken: true, taken: false, end: 'turned-down', rebuffed: true }, stage: "{a} sits down next to {b} on the steps.", turns: [
    ['a', "Can I ask you something? Would you ever think about me? If things were different?"],
    say('b', "Things aren't different. I'm with {pb}, and I want to be.", {
      soft: "I'm sorry. I really like you as a person. But I'm with {pb}, and I want to stay with {pb.obj}.",
    }),
    ['a', "I had to ask."],
    ['b', "I know. And I'm glad you did, so you can stop wondering."],
  ], beat: "{a} sits there a moment longer, then gets up." },
  { when: { story: 'graft', bTaken: true, taken: false, end: 'flirt', kissed: false, promised: false }, stage: "{a} brings {b} a drink out on the terrace.", turns: [
    ['b', "What's this for?"],
    say('a', "An excuse to talk to you.", { lad: "An excuse, if I'm honest.", nervy: "Honestly? An excuse. I didn't know how else to come over." }),
    ['b', "You don't need an excuse."],
    ['a', "I do when you're with {pb}."],
    say('b', "{pb} isn't out here, though.", { soft: "I like talking to you. I'm not going to pretend I don't." }),
  ], beat: "{b} takes the drink, and moves along so {a} can sit down." },
  { when: { story: 'graft', bTaken: true, taken: false, end: 'flirt', kissed: false, promised: false }, stage: "{a} and {b} end up next to each other at the kitchen island.", turns: [
    ['a', "Can I be honest with you? I've been looking forward to this all day. Just talking to you."],
    say('b', "You shouldn't say things like that.", { flirty: "I know. I've seen you looking." }),
    ['a', "Why not?"],
    ['b', "Because I'm with {pb}, and because I like hearing it."],
  ], beat: "{b} looks round to check who's watching, and then smiles at {a} anyway." },
  { when: { story: 'graft', bTaken: true, taken: true, end: 'turned-down', rebuffed: true }, stage: "{a} catches {b} on the way to the dressing room.", turns: [
    ['a', "Have you got a second? I need to say something."],
    ['b', "If it's what I think it is, please don't."],
    ['a', "I like you. I know I'm with {pa}. I know you're with {pb}."],
    say('b', "Then you know why the answer's no. I'm happy. You should be, too.", {
      soft: "I'm sorry. I can't. And I think you should talk to {pa} about why you're saying this.",
      sharp: "No. And go and sort things out with {pa} before you say that to anyone else.",
    }),
  ], beat: "{b} walks into the dressing room, and {a} is left standing in the corridor." },
  { when: { story: 'graft', bTaken: true, taken: true, end: 'flirt', kissed: false, promised: false }, stage: "{a} and {b} are on the swing seat while their partners play pool volleyball.", turns: [
    ['a', "Can I tell you something? I look forward to seeing you every morning."],
    ['b', "You can't say that to me. You're with {pa}."],
    say('a', "I know. I'm saying it anyway. I'd rather be honest.", { lad: "I know. But it's true, and I'm not going to lie to you." }),
    say('b', "I look forward to it too. And I hate that I do.", { nervy: "Me too. And I feel sick about it." }),
  ], beat: "They both look at the pool, where {pa} and {pb} are laughing together, and stop talking." },
  { when: { story: 'spark', end: 'flirt', kissed: false, promised: false }, stage: "{a} sits down at the end of {b}'s sunbed.", turns: [
    say('a', "I've been waiting all day to get you on your own.", { lad: "Finally. I've been trying to get you on your own all day.", quiet: "Hi. Is it okay if I sit here?" }),
    ['b', "Well, you've got me now."],
    ['a', "What's your type? Honestly."],
    say('b', "Kind. Funny. Someone who actually listens.", { flirty: "You'll find out.", romantic: "Someone who makes me feel safe. That's all I want." }),
    ['a', "I can do all three."],
    ['b', "We'll see."],
  ], beat: "{b} is smiling when {a} leaves." },
  { when: { phase: 'evening', story: 'spark', end: 'kissed', kissed: true }, stage: "{a} and {b} are sitting on the daybed as the lights come on.", turns: [
    ['b', "You've been quiet tonight."],
    ['a', "I've been thinking."],
    ['b', "About what?"],
    say('a', "About you. Mostly about kissing you.", { nervy: "About you. Sorry. I'm really bad at this.", lad: "You, if I'm honest. And whether I'm allowed to kiss you." }),
    ['b', "Then why haven't you?"],
  ], beat: "{a} doesn't need asking twice." },
  { when: { phase: 'evening', story: NONE, bTaken: false, taken: false, end: 'flirt', kissed: false, promised: false }, stage: "{a} sits down next to {b} by the pool.", turns: [
    ['a', "We've not really talked yet. I wanted to fix that."],
    ['b', "Go on, then. Ask me something."],
    ['a', "What made you come in here?"],
    say('b', "I've been single for ages, and I'm tired of meeting people who aren't serious.", {
      flirty: "Honestly? I wanted to have fun. And maybe meet someone worth staying for.",
      quiet: "My friends made me apply. I'm glad they did.",
    }),
    ['a', "I'm serious."],
    ['b', "Good. Then keep talking."],
  ], beat: "They're still talking when the sun goes down." },
  { when: { story: NONE, bTaken: false, taken: false, end: 'turned-down', rebuffed: true }, stage: "{a} finds {b} on the daybeds.", turns: [
    ['a', "Can I be honest? I like you. I wanted to see if you felt the same."],
    say('b', "I think you're great. I just don't feel that way. I'm sorry.", { soft: "I'm really sorry. You're lovely, I just don't feel it." }),
    ['a', "That's okay. I'd rather know."],
    ['b', "Friends?"],
    ['a', "Friends."],
  ], beat: "{a} gives {b} a hug, and goes back to the others." },
  { when: { story: 'graft', bTaken: true, taken: false, end: 'kissed', kissed: true }, stage: "{a} and {b} end up behind the outdoor shower, out of sight of the pool.", turns: [
    ['b', "We can't be long. {pb} will wonder where I am."],
    say('a', "Then I'll be quick. I can't stop thinking about you.", { lad: "Then I'll be quick. I can't get you out of my head.", romantic: "Then I'll just say it. I think about you all the time." }),
    say('b', "Me too. I didn't want to, but I do.", { nervy: "Me too. And it's scaring me." }),
  ], beat: "{a} kisses {b}, quickly, and {b} goes back round the corner first." },
  // ── {a} is coupled, {b} is single: a chat that isn't part of a story ──
  { when: { story: NONE, taken: true, bTaken: false, end: LANDS, kissed: false, promised: false }, stage: "{a} sits down next to {b} on the daybeds.", turns: [
    ['a', "You've been on your own a lot today. Are you okay?"],
    say('b', "I'm fine. It's hard being single in here sometimes.", { nervy: "Not really. It's hard watching everyone else in couples.", sharp: "I'm fine. I don't need looking after." }),
    ['a', "It'll happen for you. Someone's going to walk through that door for you."],
    ['b', "You don't know that."],
    ['a', "I do. Look at me and {pa}. I didn't think it would happen either."],
  ], beat: "{b} smiles, a little, for the first time all afternoon." },
  { when: { story: NONE, taken: true, bTaken: false, end: LANDS, kissed: false, promised: false }, stage: "{a} brings {b} a drink by the pool.", turns: [
    ['b', "What's this for?"],
    ['a', "Nothing. I just realised we've never really talked."],
    say('b', "We haven't. You're always with {pa}.", { flirty: "We haven't. I thought you'd forgotten I existed." }),
    ['a', "I know. So tell me about you."],
    ['b', "What do you want to know?"],
    ['a', "Everything. Start with why you came in here."],
  ], beat: "They talk for an hour, and {pa} looks over more than once." },
  { when: { story: NONE, taken: true, bTaken: false, end: LANDS, kissed: false, promised: false }, stage: "{a} and {b} end up next to each other at the kitchen island.", turns: [
    ['a', "Can I ask you something? Who do you actually like in here?"],
    say('b', "Why do you want to know?", { sharp: "Why? So you can tell everyone?" }),
    ['a', "Because I want to help. You deserve someone."],
    ['b', "There might be someone. I'm not saying who yet."],
    ['a', "That's fair."],
  ], beat: "{b} looks over at the pool, and {a} tries to work out who {b.he}'s looking at." },
  { when: { story: NONE, taken: true, bTaken: false, end: 'turned-down', rebuffed: true }, stage: "{a} sits down next to {b} on the swing seat.", turns: [
    ['a', "Do you want some company?"],
    say('b', "Honestly? Not really. I'd rather be on my own for a bit.", { soft: "Thanks, but I think I just need a bit of time on my own." }),
    ['a', "Okay. I'll leave you to it."],
  ], beat: "{a} goes back to {pa}, and {b} stays where {b.he} is." },

  // ── {b} is coupled, not a story ──
  { when: { story: NONE, bTaken: true, end: LANDS, kissed: false, promised: false }, stage: "{a} catches {b} on the way out of the dressing room.", turns: [
    ['a', "Have you got a minute? I feel like we've never spoken properly."],
    ['b', "We haven't, have we? Go on, then."],
    ['a', "How's it going with {pb}?"],
    say('b', "Good. Really good. {pb} makes me happy.", { lad: "Good, yeah. {pb}'s great.", quiet: "Good. Really good." }),
    ['a', "I'm glad. You look happy."],
  ], beat: "They chat a while longer, and it's easy." },
  { when: { story: NONE, bTaken: true, end: 'turned-down', rebuffed: true }, stage: "{a} asks {b} for a chat on the daybeds.", turns: [
    ['a', "I just wanted to get to know you a bit better."],
    say('b', "I'm sorry, I don't think it's a good idea. {pb} wouldn't like it.", { sharp: "I'm with {pb}. I don't need to get to know anyone better." }),
    ['a', "It's just a chat."],
    ['b', "I know. I'd still rather not."],
  ], beat: "{a} nods, and goes back to the others." },
  // ── graft, {a} coupled, {b} single ──
  { when: { story: 'graft', taken: true, bTaken: false, end: LANDS, kissed: false, promised: false }, stage: "{a} sits down next to {b} on the swing seat.", turns: [
    ['a', "Can I talk to you? Just us."],
    ['b', "Shouldn't you be with {pa}?"],
    say('a', "Probably. But I wanted to talk to you.", { lad: "Probably, yeah. But I wanted to talk to you.", nervy: "I know. I just wanted to talk to you. Is that bad?" }),
    ['b', "About what?"],
    ['a', "About how much I like talking to you."],
    say('b', "You can't say things like that. You're in a couple.", { flirty: "I like talking to you too. But you're with {pa}, and I'm not stupid." }),
    ['a', "I know I am. I'm just being honest."],
  ], beat: "{b} doesn't get up, and {a} doesn't either." },
  { when: { story: 'graft', taken: true, bTaken: false, end: 'turned-down', rebuffed: true }, stage: "{a} sits down next to {b} on the swing seat.", turns: [
    ['a', "I'm going to be honest with you. I've been thinking about you a lot."],
    say('b', "You're with {pa}. I'm not going to be the reason you two fall apart.", { sharp: "You're with {pa}. Go and talk to {pa.obj}, not me.", soft: "That's really kind, but you're with {pa}. I don't want to get in the middle of that." }),
    ['a', "What if I wasn't with {pa}?"],
    ['b', "But you are."],
  ], beat: "{b} gets up and goes back inside, and {a} is left on the swing seat." },
] } };

// pm/talk/whole/chat.js — a couple, {a} and {b}, talking. One talk, start to
// finish (pm/script.js talkScript `whole`), in their own voices (whole/voice.js).
// Season read 2026-10-30: the stitched chat went from "I've missed you" to
// what the others were laughing at, to the outside, to a quick-fire quiz,
// to "nice is underrated" — and pulled them up off a sunbed while they were
// in the pool. The engine has decided how it went (`end`):
//   warm   it brought them closer · easy  comfortable, nothing new · flat  nothing there
//   rowedToday  they fought earlier: this is the making up (or not)
//   after       one of them did something earlier, with {x}
//   rung        how far along they are · justMet  their first day as a couple
import { say } from './voice.js';

const EARLY = ['coupled', 'cracking-on', 'open'];
const SERIOUS = ['closed-off', 'exclusive', 'official'];

export const CHAT_WHOLE = { moves: { whole: [
  // ── after a row ──
  { when: { phase: 'evening', rowedToday: true, end: 'warm' }, stage: "{a} finds {b} sitting on the edge of the bed.", turns: [
    ['a', "Can we talk about earlier?"],
    say('b', "I don't want to fight again.", { sharp: "If you're going to start again, I'm not doing it." }),
    say('a', "I don't either. I'm sorry. I was out of order.", {
      lad: "Neither do I. I'm sorry. I was out of order, and I know I was.",
      soft: "Me neither. I'm really sorry. I hate it when we're like this.",
    }),
    ['b', "I'm sorry too. I said things I didn't mean."],
    ['a', "Come here."],
  ], beat: "{b} leans into {a}, and they stay like that until the lights go out." },
  { when: { rowedToday: true, end: 'easy' }, stage: "{a} brings {b} a cup of tea on the terrace.", turns: [
    ['b', "Is this an apology?"],
    ['a', "It's a cup of tea. And an apology."],
    say('b', "Okay. I'll take both.", { sharp: "I'll take the tea. I'm still thinking about the apology." }),
    ['a', "I don't like it when we argue."],
    ['b', "Me neither. Let's just not do it again for a bit."],
  ], beat: "They sit and drink their tea, and things are nearly back to normal." },
  { when: { rowedToday: true, end: 'flat' }, stage: "{a} sits down next to {b} on the daybed. {b} doesn't move up.", turns: [
    ['a', "Are you still angry with me?"],
    say('b', "I'm not angry. I'm just tired of having the same argument.", { sharp: "Yes. I'm still angry." }),
    ['a', "I said I was sorry."],
    ['b', "I know you did. I just need a bit of time."],
  ], beat: "{a} waits for {b} to say something else. {b} doesn't." },
  { when: { phase: 'evening', rowedToday: true, end: ['warm', 'easy'] }, stage: "{a} and {b} are lying in the dark, the rest of the villa asleep.", turns: [
    ['b', "Are you awake?"],
    ['a', "Yeah."],
    ['b', "I hate going to sleep on an argument."],
    say('a', "Me too. I'm sorry about today.", { romantic: "So do I. I'm sorry. You're the last person I want to fight with." }),
    ['b', "I'm sorry too."],
  ], beat: "{b} reaches for {a.posAdj} hand under the covers." },

  // ── going well ──
  { when: { end: 'warm', rung: SERIOUS }, stage: "{a} and {b} are lying on the daybed, legs tangled together.", turns: [
    say('a', "Can I tell you something? I think I'm falling for you.", {
      romantic: "I think I'm falling in love with you. I've wanted to say it for days.",
      lad: "I'm just going to say it. I think I'm falling for you. Really falling.",
      dry: "I've been thinking about it, and I'm fairly sure I'm falling for you.",
      nervy: "I need to tell you something before I lose my nerve. I think I'm falling for you.",
    }),
    say('b', "I've been falling for you since the first week.", { quiet: "Me too.", sharp: "Good. Because I'm already there." }),
    ['a', "Really?"],
    ['b', "Really."],
  ], beat: "{a} kisses {b}, and neither of them cares who's watching." },
  { when: { phase: 'evening', end: 'warm', rung: SERIOUS }, stage: "{a} and {b} are sitting on the swing seat as the sun goes down.", turns: [
    ['b', "Do you ever think about what it'll be like on the outside? Just us, on a normal day?"],
    say('a', "All the time. I think we'd be really good at normal.", {
      romantic: "All the time. I think about meeting your family, and Sunday mornings, and all of it.",
      lad: "All the time. I can't wait to just take you out for dinner without cameras everywhere.",
    }),
    ['b', "Me too. I can't wait for a boring Tuesday with you."],
    ['a', "That's the nicest thing anyone's ever said to me."],
  ], beat: "They sit there holding hands until the lights come on." },
  { when: { end: 'warm', rung: EARLY }, stage: "{a} and {b} are lying on the sunbeds next to each other.", turns: [
    ['a', "I've had such a good day with you."],
    say('b', "Me too. I didn't expect it to be this easy.", { flirty: "Me too. You're very easy to be around.", nervy: "Me too. I keep waiting for something to go wrong." }),
    ['a', "Is that a good thing?"],
    ['b', "It's a very good thing."],
  ], beat: "{b} reaches across and takes {a.posAdj} hand." },
  { when: { end: 'warm', rung: EARLY }, stage: "{a} and {b} are in the pool, {a.posAdj} arms round {b}.", turns: [
    ['b', "I've barely seen you today."],
    ['a', "I know. I missed you."],
    say('b', "You saw me at breakfast.", { flirty: "Good. I like being missed." }),
    ['a', "I still missed you."],
  ], beat: "{b} laughs and kisses {a.obj}." },
  { when: { end: 'warm' }, stage: "{a} and {b} are lying on the daybed.", turns: [
    say('a', "What do you like about me? Honestly.", { nervy: "Can I ask you something? What do you actually like about me?" }),
    ['b', "You make me feel calm. Nobody's ever made me feel like that."],
    ['a', "Really?"],
    say('b', "Really. What about me?", { flirty: "Your turn. And it'd better be good." }),
    ['a', "You make me laugh. And you listen. Nobody listens like you do."],
  ], beat: "They lie there smiling at each other." },

  // ── comfortable ──
  { when: { end: 'easy' }, stage: "{a} and {b} are sharing a sunbed in the shade.", turns: [
    ['a', "This is nice. Just sitting here with you."],
    say('b', "It's my favourite part of the day.", { dry: "It's the only part of the day nobody's shouting." }),
    ['a', "Mine too."],
  ], beat: "They don't say much after that, and they don't need to." },
  { when: { phase: 'morning', end: 'easy' }, stage: "{a} and {b} are making breakfast together.", turns: [
    ['b', "How did you sleep?"],
    ['a', "Better than I have in ages. You?"],
    ['b', "Same. I think I'm getting used to you."],
    say('a', "Is that a good thing?", { flirty: "Only getting used to me?" }),
    ['b', "It's a good thing."],
  ], beat: "{a} hands {b} a plate, and they eat sitting on the kitchen counter." },
  { when: { end: 'easy' }, stage: "{a} and {b} are lying by the pool.", turns: [
    ['b', "What would you be doing right now, if you were at home?"],
    say('a', "Probably still in bed. Then out with my friends.", { lad: "Probably still in bed. Then out with the boys." }),
    ['b', "Do you miss it?"],
    ['a', "Sometimes. Not right now."],
  ], beat: "{b} smiles and closes {b.posAdj} eyes." },
  { when: { end: 'easy', weeks: true }, stage: "{a} and {b} are sitting on the terrace.", turns: [
    ['a', "Can you believe how long we've been together in here?"],
    ['b', "No. It feels like ages and no time at all."],
    ['a', "I'm glad it's you."],
    ['b', "I'm glad it's you too."],
  ], beat: "They sit there quietly, watching the villa below." },

  // ── nothing there ──
  { when: { end: 'flat' }, stage: "{a} and {b} are sitting on the daybed, a little apart.", turns: [
    ['a', "Is everything okay with us?"],
    say('b', "Yeah. Why?", { sharp: "Why do you keep asking me that?" }),
    ['a', "You've just been a bit distant today."],
    ['b', "I'm tired, that's all."],
  ], beat: "{a} doesn't believe it, but doesn't push." },
  { when: { end: 'flat' }, stage: "{a} sits down next to {b} at the kitchen table.", turns: [
    ['a', "I feel like we haven't really talked properly in days."],
    say('b', "We talk all the time.", { soft: "I know. I'm sorry. My head's been all over the place." }),
    ['a', "Not really. Not about us."],
    ['b', "What do you want to talk about?"],
    ['a', "I don't know. That's what worries me."],
  ], beat: "Neither of them says anything for a while." },
  { when: { end: 'flat' }, stage: "{a} and {b} are lying on the sunbeds.", turns: [
    say('a', "Do you think we're working?", { nervy: "Can I ask you something, and you won't be upset? Do you think we're working?" }),
    ['b', "I think so. Don't you?"],
    ['a', "I don't know. I want to feel more than I do."],
    ['b', "Oh."],
  ], beat: "{b} looks away, and the conversation stops there." },
  { when: { end: 'flat', gap: true }, stage: "{a} is talking to {b} on the swing seat. {b} keeps looking over at the pool.", turns: [
    ['a', "Are you even listening to me?"],
    ['b', "Sorry. Yeah. Go on."],
    ['a', "It doesn't matter."],
  ], beat: "{a} gets up, and {b} doesn't notice for a minute." },

  // ── after something earlier ──
  { when: { after: 'pull', afterBy: 'b', end: ['warm', 'easy'] }, stage: "{a} sits down next to {b} on the daybeds.", turns: [
    ['a', "I saw you go off with {x} earlier."],
    say('b', "It was just a chat. {x.He} wanted to get to know me. That's all.", {
      soft: "It was just a chat. I promise. I'd have told you if it was anything else.",
      sharp: "It was a chat. You're allowed to trust me.",
    }),
    ['a', "Okay. I believe you."],
    ['b', "Good. Because it's you I want."],
  ], beat: "{a} relaxes for the first time all afternoon." },
  { when: { after: 'pull', afterBy: 'b', end: 'flat' }, stage: "{a} is waiting on the bed when {b} comes in.", turns: [
    ['a', "How was your chat with {x}?"],
    ['b', "Fine. Why?"],
    ['a', "You were gone for ages."],
    say('b', "We were talking. That's all.", { sharp: "I'm not doing this. It was a chat." }),
    ['a', "If you say so."],
  ], beat: "{a} rolls over, and they go to sleep with a gap between them." },
  { when: { after: 'pull', afterBy: 'a', end: ['warm', 'easy'] }, stage: "{a} finds {b} by the pool.", turns: [
    ['a', "I want to tell you about my chat with {x} before you hear it from anyone else."],
    ['b', "Okay."],
    ['a', "{x.He} asked to get to know me. I told {x.obj} I'm with you, and that's where it ended."],
    say('b', "Thank you for telling me.", { romantic: "Thank you. That means more than you know." }),
  ], beat: "{b} squeezes {a.posAdj} hand." },
  { when: { after: 'date', afterBy: 'b' }, stage: "{a} is waiting by the steps when {b} gets back from the date.", turns: [
    ['a', "How was it?"],
    say('b', "It was nice. But I spent the whole time thinking about you.", {
      sharp: "It was a date. It was fine. It doesn't change anything.",
      romantic: "Honestly? I couldn't stop thinking about you the whole time.",
    }),
    ['a', "Really?"],
    ['b', "Really. I'm back now. That's what matters."],
  ], beat: "{a} hugs {b} like {b.he}'s been gone for a week." },
  { when: { after: 'knocked-back', afterBy: 'b' }, stage: "{a} sits down next to {b} on the swing seat.", turns: [
    ['a', "I heard {x} tried to pull you, and you said no."],
    say('b', "Of course I did. I'm with you.", { lad: "Of course I did. I'm with you. That's it." }),
    ['a', "I know. It's still nice to hear."],
  ], beat: "{a} rests {a.posAdj} head on {b}'s shoulder." },
  { when: { phase: 'evening', after: 'recoupling', afterBy: 'both' }, stage: "{a} and {b} are lying in bed after the recoupling.", turns: [
    ['b', "I was so nervous tonight."],
    ['a', "Why? You knew I'd pick you."],
    say('b', "I hoped you would. I didn't know.", { nervy: "I didn't know. I was shaking the whole time." }),
    ['a', "There was never anyone else."],
  ], beat: "{b} smiles in the dark." },

  // ── how {b} is ──
  { when: { bMood: 'jealous' }, stage: "{a} sits down next to {b}, who has gone quiet.", turns: [
    ['a', "What's wrong?"],
    say('b', "Nothing.", { sharp: "You know what's wrong." }),
    ['a', "It's not nothing. Talk to me."],
    ['b', "I just don't like seeing you laughing with other people. I know that sounds stupid."],
    ['a', "It doesn't sound stupid. But it's you I come back to. Every time."],
  ], beat: "{b} lets {a} take {b.posAdj} hand." },

  // ── their first day ──
  { when: { justMet: true }, stage: "{a} and {b} are sitting on the daybed, a little awkwardly.", turns: [
    ['a', "So. Here we are."],
    ['b', "Here we are."],
    say('a', "I'm glad it was you. I want you to know that.", { lad: "I'm {~buzzing} it was you, if I'm honest.", nervy: "I'm really glad it was you. Sorry. I'm nervous." }),
    ['b', "Me too. I was hoping it would be."],
  ], beat: "They both smile and look away at the same time." },
  { when: { justMet: true }, stage: "{a} and {b} are sitting on the edge of the pool.", turns: [
    ['b', "Tell me something about you that nobody else in here knows."],
    ['a', "I almost didn't come. I was too nervous."],
    ['b', "I'm glad you did."],
    ['a', "So am I. Now."],
  ], beat: "{b} leans against {a}, shoulder to shoulder." },
] } };

// pm/talk/whole/vent.js — {a} tells {b}, a friend, what's wrong with {pa}.
// One talk, start to finish (pm/script.js talkScript `whole`), in their own
// voices (whole/voice.js). The stitched vent opened on "Go on. Vent." and
// closed on "I'm in the top three.": here {a} says how {a.he} feels, {b} asks
// about THAT, and the advice answers it.
//   why     a doubt's real reason (pm/threads.js doubtReason), when there is one:
//           ick · eyes ({x}) · behind · cooling · triangle ({x}) · played
//   none    an everyday one (pm/events.js vent): bored · clingy · not listening
//           · not sure · rushed (myRung: closed off or further)
//   paKissed  {a} and {pa} have kissed
import { say } from './voice.js';

const T = { taken: true };

export const VENT_WHOLE = { moves: { whole: [
  // ── the ick ──
  { when: { ...T, why: 'ick' }, stage: "{a} sits down next to {b} on the daybed and lets out a long breath.", turns: [
    ['b', "What's wrong?"],
    say('a', "I've got the ick with {pa}. And I hate it, because I really liked {pa.obj}.", { bestie: "Babe. I've got the ick. With {pa}. Full ick.", lad: "I've got the ick, {~bro}. With {pa}. I don't know what to do." }),
    ['b', "What did {pa} do?"],
    ['a', "Nothing big. Something tiny. But now I notice everything, and I can't stop noticing."],
    ['b', "Do you think it'll go away?"],
    say('a', "I don't know. I want it to. It's not fair on {pa}.", { soft: "I hope so. {pa} doesn't deserve this." }),
    ['b', "Give it a couple of days. If it's still there, you'll have to be honest with {pa}."],
  ], beat: "{a} nods, and looks over at {pa} on the lawn." },
  { when: { ...T, why: 'ick', paKissed: true }, stage: "{a} and {b} are on their own in the dressing room.", turns: [
    ['a', "I went to kiss {pa} earlier, and I just didn't want to."],
    ['b', "What? You couldn't keep your hands off {pa} a few days ago."],
    ['a', "I know. That's why it's scaring me. Something switched off, and I don't know how to switch it back on."],
    say('b', "Has {pa} noticed?", { soft: "Oh, that's horrible. Does {pa} know something's wrong?" }),
    ['a', "I don't think so. And I feel awful every time {pa} smiles at me."],
  ], beat: "{b} puts an arm round {a}, and neither of them says anything for a while." },
  // ── eyes on somebody else ──
  { when: { ...T, why: 'eyes' }, stage: "{a} pulls {b} up to the roof terrace.", turns: [
    ['a', "You have to promise this doesn't go any further."],
    ['b', "I promise. What is it?"],
    say('a', "I can't stop thinking about {x}. I'm with {pa}, and I keep ending up wherever {x} is.", { lad: "I can't stop looking at {x}, {~bro}. I'm with {pa}, and my head's somewhere else.", romantic: "I think I've got feelings for {x}. And I'm with {pa}. I don't know what to do with that." }),
    ['b', "Since when?"],
    ['a', "A couple of days. And it's getting stronger, not weaker."],
    say('b', "Then you need to work out what you want before somebody gets hurt.", { sharp: "Then sort it out. {pa} deserves better than half of you." }),
    ['a', "I know. I just don't want it to be me who hurts {pa}."],
  ], beat: "{a} looks down at the lawn, where {x} and {pa} are both sitting." },
  { when: { ...T, why: 'eyes' }, stage: "{a} and {b} are doing the washing-up together.", turns: [
    ['a', "Can I tell you something? I feel terrible about it."],
    ['b', "Go on."],
    ['a', "Every time {x} talks to me, I forget {pa} is even in the room. And then I see {pa} looking at me, and I feel sick."],
    ['b', "Has anything happened with {x}?"],
    ['a', "No. Nothing. I swear. But I want it to, and that's bad enough."],
    say('b', "You can't stay in the middle forever. It'll come out.", { soft: "You're not a bad person for feeling it. But you can't hide it forever." }),
  ], beat: "{a} keeps washing the same plate, and doesn't answer." },
  // ── {pa} is further in ──
  { when: { ...T, why: 'behind' }, stage: "{a} and {b} are lying by the pool.", turns: [
    ['b', "You've been quiet all day."],
    ['a', "{pa} is so far ahead of me. {pa} is talking about meeting each other's families, and I just nod."],
    ['b', "And you're not there yet?"],
    say('a', "I don't know if I'll ever get there. And I can't tell {pa} that. It would crush {pa.obj}.", { nervy: "I don't know. I really don't know. And every day {pa} gets more sure, and I get more scared." }),
    ['b', "It's better to hear it now than in a month."],
    ['a', "I know. I just don't know how to say it kindly."],
  ], beat: "{a} watches {pa} wave from across the pool, and waves back." },
  { when: { ...T, why: 'behind', paKissed: true }, stage: "{a} and {b} are on their own in the dressing room.", turns: [
    ['a', "Last night {pa} said something really big to me. And I couldn't say it back."],
    ['b', "What did you do?"],
    ['a', "I kissed {pa}, so I didn't have to say anything. And {pa} didn't notice."],
    say('b', "That's a lot to carry on your own.", { soft: "Oh, that's so hard. For both of you." }),
    ['a', "I don't want to hurt {pa}. But I can't pretend to feel something I don't feel yet."],
  ], beat: "{b} squeezes {a}'s hand, and they sit there for a while." },
  // ── it's just fading ──
  { when: { ...T, why: 'cooling' }, stage: "{a} sits down next to {b} at the far end of the garden.", turns: [
    ['a', "I don't know what's wrong with me. {pa} is lovely. Nothing's happened. I just don't feel it like I did."],
    ['b', "When did it start?"],
    ['a', "I don't know. It's been fading for a few days. I keep waiting for it to come back."],
    say('b', "Maybe it's just the villa. Everyone dips.", { sharp: "Or maybe it's just not there. That's allowed too." }),
    ['a', "Maybe. But what if it isn't a dip? What if this is it?"],
    ['b', "Then you'll know soon. Don't force it."],
  ], beat: "{a} nods slowly, and looks back towards the villa." },
  { when: { ...T, why: 'cooling' }, stage: "{a} and {b} are on the swing seat.", turns: [
    say('a', "Me and {pa} are a bit flat. We have the same chat every day. It's nice, but nice isn't why I came in here.", { romantic: "I came in here for butterflies. And with {pa}, they've gone." }),
    ['b', "Have you told {pa} you feel like that?"],
    ['a', "No. I don't want to make it into a thing if it's just a bad week."],
    ['b', "Give it one more honest conversation. If nothing changes, you'll know."],
  ], beat: "{b} gives {a} a little push on the swing, and {a} manages a smile." },
  { when: { ...T, why: 'cooling' }, stage: "{a} and {b} are lying on the sunbeds.", turns: [
    ['a', "Do you ever look at someone and wait to feel something, and it just doesn't come?"],
    ['b', "Is this about {pa}?"],
    say('a', "Yes. I used to get excited when {pa} walked in. Now I just feel okay. Just okay.", { romantic: "I used to feel it every time {pa} walked in. Now I don't, and I miss it." }),
    ['b', "Okay isn't nothing. But it's not what you came in here for."],
    ['a', "No. It isn't."],
  ], beat: "They both stare up at the sky, and {a} doesn't say anything else." },
  { when: { ...T, why: 'cooling' }, stage: "{a} and {b} are in the kitchen, making lunch.", turns: [
    ['b', "You and {pa} have been quiet with each other."],
    ['a', "I know. I don't know what's happened. Nothing has happened. That's the problem."],
    ['b', "Do you still want to be with {pa}?"],
    say('a', "I think so. I don't know. Ask me tomorrow.", { nervy: "I don't know. I really don't. And that scares me." }),
  ], beat: "{b} doesn't push it, and they carry on making lunch." },
  { when: { ...T, why: 'eyes' }, stage: "{a} and {b} are on the swing seat, keeping their voices down.", turns: [
    ['a', "I keep catching myself looking at {x}. And then I feel awful, because {pa} is right there."],
    ['b', "Does {x} look back?"],
    ['a', "Sometimes. And that makes it so much worse."],
    say('b', "You need to decide before it decides for you.", { soft: "That's a horrible place to be. You need to be honest with yourself." }),
  ], beat: "{a} looks across the garden, and then makes {a.ref} look away." },
  { when: { ...T, why: 'behind' }, stage: "{a} and {b} are doing the washing-up together.", turns: [
    ['a', "{pa} told me {pa.he} is falling for me. And I just said thank you."],
    ['b', "Thank you?"],
    ['a', "I panicked. I'm not there yet, and I didn't want to lie."],
    say('b', "That's better than lying. But you'll have to talk about it properly.", { soft: "Oh no. That must have hurt {pa}, even if {pa.he} didn't show it." }),
  ], beat: "{a} puts down the plate, and goes to find {pa}." },
  // ── stuck between two ──
  { when: { ...T, why: 'triangle' }, stage: "{a} drags {b} into the dressing room and shuts the door.", turns: [
    say('a', "I'm stuck. I'm with {pa}, and I like {x}, and I don't know who I want.", { lad: "I'm in a mess, {~bro}. {pa} or {x}. I can't choose." }),
    ['b', "Do they know about each other?"],
    ['a', "Everyone knows. That's the worst part. Everyone's waiting for me to pick."],
    ['b', "Who do you think about when you're on your own?"],
    ['a', "That's the problem. It changes."],
  ], beat: "{b} doesn't have an answer, and {a} sits down on the bed." },
  // ── {pa} is playing a game ──
  { when: { ...T, why: 'played' }, stage: "{a} finds {b} on the roof terrace.", turns: [
    ['a', "I think {pa} is playing me. I think it's all for the cameras."],
    ['b', "What makes you say that?"],
    say('a', "Things {pa} says to me, and then things I've heard {pa} say to other people. They don't match.", { sharp: "Because I've heard {pa} say one thing to me and the opposite to everyone else." }),
    ['b', "That's horrible. Are you sure?"],
    ['a', "Sure enough to feel stupid for believing it."],
    say('b', "You're not stupid. You trusted someone. That's what you're meant to do in here.", { soft: "You're not stupid for trusting {pa}. That's on {pa}, not you." }),
  ], beat: "{a} wipes {a.posAdj} eyes quickly, before anyone downstairs can see." },
  // ── an everyday one ──
  { when: { ...T }, stage: "{a} and {b} are doing the washing-up together.", turns: [
    ['b', "You're scrubbing that pan very hard."],
    ['a', "I'm bored, and I feel awful for saying it. Me and {pa} have the same chat every day."],
    ['b', "Bored of {pa}, or bored of the villa?"],
    say('a', "I don't know. Maybe both. I want someone who surprises me.", { lad: "Both, {~bro}. I want someone who keeps me on my toes." }),
    ['b', "Have you told {pa}?"],
    ['a', "No. I don't want to hurt {pa.posAdj} feelings over nothing."],
  ], beat: "{a} puts the pan on the rack, and goes back out to {pa}." },
  { when: { ...T }, stage: "{a} sits down next to {b} on the daybed.", turns: [
    ['a', "Can I be honest? {pa} is a bit much at the moment."],
    ['b', "Much how?"],
    say('a', "{pa} follows me everywhere. I went to get a drink, and {pa} came with me. I can't breathe.", { sharp: "Every time I move, {pa} moves. I need some space." }),
    ['b', "Maybe {pa} is just nervous about losing you."],
    ['a', "Maybe. But I need {pa} to trust me a bit more."],
    ['b', "Then tell {pa} that. Kindly."],
  ], beat: "{a} nods, and goes to find {pa}." },
  { when: { ...T }, stage: "{a} and {b} are on their own in the dressing room.", turns: [
    ['a', "I don't think {pa} really listens to me."],
    ['b', "What do you mean?"],
    ['a', "I'll be telling a story, and I can see {pa} just waiting for me to finish so it's {pa.posAdj} turn."],
    say('b', "That would drive me mad.", { soft: "That's horrible. You want to feel heard." }),
    ['a', "It does drive me mad. And I don't know if it's something you can change in someone."],
  ], beat: "{b} doesn't have an answer, and they go back out together." },
  { when: { ...T }, stage: "{a} and {b} are lying by the pool.", turns: [
    ['a', "I like {pa}. I do. I just don't know if I like {pa} enough."],
    ['b', "Enough for what?"],
    ['a', "Enough to stay with {pa} when somebody new walks in. Everyone's decided we're a couple, and I'm not sure we are."],
    say('b', "You're allowed to not be sure.", { sharp: "Then don't pretend. It's not fair on either of you." }),
    ['a', "I know. I just wish I knew."],
  ], beat: "They lie there in the sun, not saying anything else." },
  { when: { ...T, myRung: ['closed-off', 'exclusive', 'official'] }, stage: "{a} and {b} are on the swing seat, keeping their voices down.", turns: [
    ['a', "I closed off with {pa}, and I meant it. But now I think I rushed it."],
    ['b', "What makes you think that?"],
    ['a', "Everyone else was doing it, and I panicked. I don't want to be with someone because it's easier."],
    say('b', "That's a big thing to admit.", { soft: "I'm glad you said it out loud. That's the first step." }),
    ['a', "Please don't repeat it. I need to work out what I feel first."],
  ], beat: "{b} promises, and {a} goes quiet." },
] } };

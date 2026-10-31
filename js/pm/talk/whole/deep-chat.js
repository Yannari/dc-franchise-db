// pm/talk/whole/deep-chat.js — a couple's real conversation: {a} asks the
// question that matters, and {b} answers it, or doesn't. One talk, start to
// finish (pm/script.js talkScript `whole`), in their own voices (whole/voice.js).
// `end` is the engine's (pm/events.js): open ({b} lets {a} in) or guarded ({b}
// keeps {a} out, in proportion to how much {b} keeps people out). No invented
// backstory (docs/pm-dialogue-style.md §3): what they feel, what they're scared
// of, what they want, never a sister or a divorce the character doesn't have.
import { say } from './voice.js';

const SERIOUS = ['closed-off', 'exclusive', 'official'];
const LOW = ['stressed', 'lonely', 'heartbroken', 'jealous'];

export const DEEP_CHAT_WHOLE = { moves: { whole: [
  // ── open: {b} lets {a} in ──
  { when: { end: 'open' }, stage: "{a} and {b} sit up on the terrace, away from everyone.", turns: [
    say('a', "Can I ask you something real? Why are you single? Before this, I mean.", {
      lad: "Can I ask you something? How is someone like you single?",
      nervy: "Can I ask you something? You don't have to answer. Why were you single, before this?",
    }),
    say('b', "Honestly? I've been hurt before, and I stopped letting people in.", {
      soft: "Honestly? I got hurt, and after that I found it really hard to trust anyone.",
      sharp: "Because I wasn't going to settle for someone who didn't really want me.",
      quiet: "I got hurt. I stopped trying after that.",
      lad: "Honestly, I wasn't ready. I was messing about. I didn't want anything serious.",
    }),
    ['a', "And now?"],
    say('b', "Now I'm sitting here telling you, so I suppose something's changed.", { romantic: "Now I'm here with you, and I want to let someone in again. I want it to be you." }),
    ['a', "I'm glad you told me."],
    ['b', "Me too. I don't say that to many people."],
  ], beat: "{a} takes {b}'s hand, and {b} doesn't let go." },
  { when: { end: 'open' }, stage: "{a} and {b} sit on the edge of the pool, feet in the water.", turns: [
    ['a', "What are you most scared of in here?"],
    say('b', "Getting attached to someone and watching them walk off with someone else.", {
      nervy: "Everything. Mostly that I'll fall for someone, and they'll pick someone else at the recoupling.",
      lad: "Honestly? Falling for someone and looking like an idiot in front of everyone.",
      sharp: "Trusting the wrong person. I've done it before.",
    }),
    ['a', "Is that why you hold back sometimes?"],
    ['b', "Yeah. I'm trying not to with you."],
    say('a', "You don't have to hold back with me. I'm not going anywhere.", { romantic: "I'm not going anywhere. I promise you." }),
  ], beat: "{b} leans into {a}, and they watch the water for a while." },
  { when: { end: 'open' }, stage: "{a} and {b} lie on the daybed, talking quietly.", turns: [
    ['a', "What do you actually want from all this? Not for the cameras. For you."],
    say('b', "Someone I can be myself with. Someone who'll still like me when I'm being annoying.", {
      romantic: "I want to fall in love. Properly. I want to leave here with someone I can't imagine my life without.",
      lad: "Someone to come home to. I know that sounds soft. I mean it.",
      quiet: "Someone who gets me.",
      flirty: "Someone who makes me laugh, and doesn't get bored of me.",
    }),
    ['a', "Have you found it?"],
    ['b', "I think I might be lying next to it."],
  ], beat: "{a} grins, and {b} hides {b.posAdj} face in {a.posAdj} shoulder." },
  { when: { end: 'open', known: true }, stage: "{a} and {b} sit up on the terrace, away from everyone.", turns: [
    ['a', "Can I ask what you'd tell your family about me?"],
    say('b', "That you're kind. That you make me feel calm, and I'm not a calm person.", {
      lad: "That you're the real deal. That I didn't see you coming.",
      soft: "That you're kind. That you look after me. That I feel safe with you.",
      sharp: "That you're the only person in here I trust. They'd know what that means.",
    }),
    ['a', "That's a lot."],
    ['b', "It's true. What would you tell yours?"],
    say('a', "That I've met someone I want them to meet.", { romantic: "That I've met someone I want them to meet. And that I'm happy. Really happy." }),
  ], beat: "{b} smiles, and doesn't say anything for a moment. {b.He} doesn't need to." },
  { when: { end: 'open', rung: SERIOUS }, stage: "{a} and {b} lie on the daybed, talking quietly.", turns: [
    ['a', "Do you ever think about what happens when we leave?"],
    say('b', "All the time. I think about waking up next to you somewhere that isn't here.", {
      lad: "All the time. I want to take you out somewhere normal. No cameras.",
      nervy: "All the time. And it scares me, because I really want it to work.",
      quiet: "Every day.",
    }),
    ['a', "Does it scare you?"],
    ['b', "A bit. In here, it's easy. Out there, it's real life."],
    say('a', "I want real life with you.", { sharp: "Then we'll make it work. I don't give up on things I want." }),
  ], beat: "{b} pulls {a} closer, and neither of them says anything else." },
  { when: { end: 'open', mood: LOW }, stage: "{a} finds {b} on the daybeds and sits down next to {b.obj}.", turns: [
    ['b', "Can I tell you something? I'm finding it hard in here today."],
    ['a', "What's going on?"],
    say('b', "I just miss home. I miss being able to go for a walk on my own and not have everyone watching.", {
      sharp: "Everything. Everyone's watching everyone. I'm tired.",
      nervy: "I don't know. I've just felt on edge all day. Like something bad is going to happen.",
    }),
    ['a', "You can be honest with me when it's hard. You don't have to be fine all the time."],
    ['b', "Thank you. I needed someone to say that."],
  ], beat: "{a} puts an arm round {b}, and {b} lets {a.obj}." },
  { when: { end: 'open', intent: ['love', 'settle-down', 'first-love'] }, stage: "{a} and {b} sit on the edge of the pool, feet in the water.", turns: [
    ['a', "Have you ever been in love?"],
    say('b', "I thought I had. Now I'm not so sure it was the real thing.", {
      romantic: "Once. Or I thought it was. Now I think it was practice.",
      quiet: "I don't think so. Not really.",
      sharp: "Once. It didn't end well. I don't talk about it much.",
    }),
    ['a', "What changed your mind?"],
    ['b', "Feeling something different. Recently."],
    ['a', "How recently?"],
    ['b', "You know how recently."],
  ], beat: "{a} bumps {b}'s shoulder with {a.posAdj} own, and {b} bumps it back." },
  { when: { end: 'open', after: 'pull', afterBy: 'b' }, stage: "{a} and {b} sit up on the terrace, away from everyone.", turns: [
    ['a', "Can I ask you about earlier? With {x}?"],
    say('b', "You can ask me anything. {x.He} wanted to get to know me. I said I'm with you.", { soft: "Of course. I'd rather you asked than worried. {x.He} wanted to get to know me, and I told {x.obj} I'm with you." }),
    ['a', "I believe you. I just get scared."],
    ['b', "Of what?"],
    ['a', "Of losing you. I've never felt like this about anyone in here."],
    say('b', "You're not going to lose me.", { romantic: "You're not going to lose me. I'm yours. I mean it." }),
  ], beat: "{b} holds {a.posAdj} face in {b.posAdj} hands and kisses {a.obj}." },
  { when: { end: 'open', after: 'pull', afterBy: 'a' }, stage: "{a} and {b} sit on the edge of the pool, feet in the water.", turns: [
    ['a', "I want to talk about earlier. With {x}. I don't want you hearing it wrong."],
    ['b', "Okay."],
    ['a', "{x} wanted to get to know me. I said I'm with you. That's it."],
    say('b', "Thank you for telling me. That means a lot.", { sharp: "Good. Because I'd have found out." }),
    ['a', "I'll always tell you. That's the deal."],
  ], beat: "{b} leans over and kisses {a} on the cheek." },
  { when: { end: 'open', rowedToday: true }, stage: "{a} and {b} sit together on the terrace after their fight.", turns: [
    ['a', "I don't want to fight with you. Can we just talk? Properly?"],
    ['b', "Okay."],
    ['a', "Why did it get so bad earlier?"],
    say('b', "Because I was scared. When I'm scared, I go on the attack. I'm sorry.", {
      soft: "Because I care what you think, and I panicked. I'm sorry.",
      sharp: "Because I don't like feeling like I'm being told off. But I shouldn't have shouted.",
    }),
    ['a', "I didn't know that about you."],
    ['b', "Now you do."],
  ], beat: "{a} reaches for {b}'s hand, and they sit like that until it gets dark." },

  // ── guarded: {b} keeps {a} out ──
  { when: { end: 'guarded' }, stage: "{a} and {b} sit up on the terrace, away from everyone.", turns: [
    ['a', "Can I ask you something? What do you miss most about home?"],
    say('b', "I don't really think about it. I'm here now.", { lad: "Nothing, {~bro}. I'm here now.", soft: "I'd rather not think about it, if that's okay. It makes me sad." }),
    ['a', "Nothing at all?"],
    ['b', "Not really. Why?"],
    ['a', "I'm not trying to pry. I just want to know you."],
    say('b', "You do know me. You know me in here.", { sharp: "You know me. That's enough for now." }),
  ], beat: "{a} nods, and lets it go. {a.He} doesn't look happy about it." },
  { when: { end: 'guarded' }, stage: "{a} and {b} sit on the edge of the pool, feet in the water.", turns: [
    ['a', "What are you scared of? In here, I mean."],
    say('b', "Nothing, really. I'm pretty chilled.", { lad: "Nothing, {~bro}. I'm easy. You know me.", sharp: "I don't really do scared." }),
    ['a', "Everyone's scared of something."],
    ['b', "Not me."],
    ['a', "Okay."],
  ], beat: "{a} looks at {b} for a moment, and then back at the water." },
  { when: { end: 'guarded' }, stage: "{a} and {b} lie on the daybed, talking quietly.", turns: [
    ['a', "Do you ever let anyone in? Like, properly in?"],
    ['b', "What do you mean?"],
    ['a', "I feel like I tell you everything, and I still don't really know what you're thinking."],
    say('b', "I'm just not a big talker about feelings. It doesn't mean they're not there.", {
      soft: "I'm sorry. I find it really hard. It's not you.",
      sharp: "I'm here, aren't I? That should tell you what I'm thinking.",
      quiet: "I'm trying.",
    }),
    ['a', "I just want to know I'm not on my own in this."],
    ['b', "You're not."],
  ], beat: "{a} waits for more. There isn't any more." },
  { when: { end: 'guarded', known: true }, stage: "{a} and {b} sit up on the terrace, away from everyone.", turns: [
    ['a', "We've been together a while now. Can I ask how you really feel about me?"],
    say('b', "I like you. You know I like you.", { lad: "I like you. Obviously. Why are you asking?", nervy: "Why? Has something happened?" }),
    ['a', "Like me, or more than that?"],
    ['b', "Can we not put a label on it yet?"],
    say('a', "Okay. Yeah. Sure.", { sharp: "I'm not asking for a label. I'm asking how you feel." }),
  ], beat: "{b} changes the subject. {a} lets {b.obj}." },
  { when: { end: 'guarded', rung: SERIOUS }, stage: "{a} and {b} lie on the daybed, talking quietly.", turns: [
    ['a', "Do you think about us on the outside?"],
    say('b', "I try not to think too far ahead. Anything can happen in here.", { lad: "One day at a time. That's how I do it." }),
    ['a', "But you want it to work? Out there?"],
    ['b', "Let's just enjoy this. Here. Now."],
  ], beat: "{a} looks up at the sky and doesn't say what {a.he} is thinking." },
  { when: { end: 'guarded', after: 'pull', afterBy: 'b' }, stage: "{a} and {b} sit on the edge of the pool, feet in the water.", turns: [
    ['a', "Can I ask about your chat with {x}?"],
    say('b', "It was nothing. Just a chat.", { sharp: "Why does everyone keep asking me about that?" }),
    ['a', "I'm not having a go. I just want to know what you talked about."],
    ['b', "Honestly, I don't even remember. Stuff."],
  ], beat: "{a} nods slowly. {b} pulls {b.posAdj} feet out of the water and gets up." },
  { when: { end: 'guarded', rowedToday: true }, stage: "{a} and {b} sit together on the terrace after their fight.", turns: [
    ['a', "Can we talk about why that happened?"],
    say('b', "I don't really want to go over it again.", { sharp: "It's done. I don't want to keep picking at it." }),
    ['a', "I'm not going over it. I want to understand you."],
    ['b', "There's nothing to understand. I was in a mood. It's done."],
  ], beat: "{a} lets it drop, but it doesn't feel done." },
  { when: { end: 'guarded', mood: LOW }, stage: "{a} finds {b} on the daybeds, staring at nothing.", turns: [
    ['a', "Are you okay? You've been quiet all day."],
    say('b', "I'm fine. Just tired.", { quiet: "Fine.", sharp: "I'm fine. Stop asking." }),
    ['a', "You can talk to me, you know."],
    ['b', "I know. There's nothing to talk about."],
  ], beat: "{a} sits down next to {b} anyway, and stays." },
] } };

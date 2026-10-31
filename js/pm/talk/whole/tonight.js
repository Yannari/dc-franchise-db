// pm/talk/whole/tonight.js — the day before the night (pm/threads.js
// tonightBeats), one talk start to finish (pm/script.js talkScript `whole`), in
// their own voices (whole/voice.js). Nobody knows yet how tonight goes.
//
// pick-chat [a, b, c?]  {a} talks to {b}, a friend, about the recoupling.
//   of: nobody ({a} is single; {c} the one {a} would go for) · torn (between
//   {pa} and {c}) · unsure (doubting {pa}, nobody else) · settled · last (the
//   final recoupling). side: which way {b} pushes (partner · other).
//   choosing: {a} does the picking tonight. final: every single goes home.
// vote-worry [a, b]  a couple, the night of a public vote: will the public keep
//   us? of: scared · calm.
import { say } from './voice.js';

const NOT_FINAL = [undefined, false];

export const PICK_CHAT_WHOLE = { moves: { whole: [
  // ── single, and {a} picks tonight ──
  { when: { of: 'nobody', choosing: true, cast: 3 }, stage: "{a} sits down next to {b} on the end of the bed.", turns: [
    ['b', "So. Tonight. Who are you picking?"],
    say('a', "{c}. I think. I want to pick {c}.", { lad: "{c}, {~bro}. It's got to be {c}.", nervy: "{c}. I think. Unless I lose my nerve." }),
    ['b', "Then pick {c}."],
    ['a', "What if {c.he} doesn't want me back?"],
    say('b', "Then you'll know. But you won't know if you don't try.", { soft: "Then at least you were brave. That's all you can do." }),
    ['a', "Okay. {c}. I'm doing it."],
  ], beat: "{a} looks over at {c} across the garden, and takes a deep breath." },
  { when: { of: 'nobody', choosing: true, cast: 3 }, stage: "{a} and {b} are floating in the pool, the only two in it.", turns: [
    ['a', "Nobody can hear us out here. I need to talk about tonight."],
    ['b', "Go on."],
    ['a', "I'm thinking about picking {c}. But we've barely talked."],
    say('b', "You've talked enough to want to. That's enough for a recoupling.", { sharp: "Then talk to {c} this afternoon. You've got hours." }),
    say('a', "What if I pick {c.obj}, and it goes nowhere?", { lad: "And if it goes nowhere, I look like an idiot." }),
    ['b', "Then you're no worse off than you are now."],
  ], beat: "{a} floats there for a while, thinking about it." },
  { when: { of: 'nobody', choosing: true, cast: 2 }, stage: "{a} sits down next to {b} on the sunbeds.", turns: [
    ['b', "Do you know who you're picking tonight?"],
    say('a', "No. That's the problem. There's nobody I really want.", { nervy: "No. And it's making me feel sick." }),
    ['b', "Then pick whoever you get on with best. It's not forever."],
    ['a', "It feels like forever when you're standing up there."],
    ['b', "I know. You'll be okay."],
  ], beat: "{a} doesn't look like {a.he} believes it." },
  // ── single, and {a} waits to be picked ──
  { when: { of: 'nobody', choosing: false, cast: 3 }, stage: "{a} and {b} are getting ready in the dressing room.", turns: [
    ['a', "I'm so scared about tonight."],
    ['b', "Why?"],
    say('a', "Because I want {c} to pick me, and I don't know if {c.he} will.", { bestie: "Because I want {c} to pick me, babe, and I've got no idea if {c.he} will.", romantic: "Because I really want it to be {c}. I want {c.obj} to stand up and say my name." }),
    ['b', "Have you told {c.obj} that?"],
    ['a', "Not in those words."],
    say('b', "Then tell {c.obj}. Today. Don't leave it to chance.", { soft: "Then go and talk to {c.obj}. What's the worst that can happen?" }),
  ], beat: "{a} looks at {a.posAdj} reflection, then puts the brush down and goes to find {c}." },
  { when: { of: 'nobody', choosing: false }, stage: "{a} and {b} are lying on the sunbeds, both pretending to read.", turns: [
    ['a', "What if nobody picks me tonight?"],
    ['b', "Someone will."],
    say('a', "You don't know that. I'm the one standing there at the end. Everyone's looking at me.", { lad: "You don't know that, {~bro}. I'll be standing there on my own.", nervy: "You don't know that. I can already feel it. Everyone looking at me." }),
    ['b', "And if it happens, it happens. You're not going anywhere without a fight."],
    ['a', "Thanks. I think."],
  ], beat: "{a} puts the book over {a.posAdj} face." },

  // ── torn: {pa} or {c} ──
  { when: { of: 'torn', side: 'partner', taken: true, cast: 3 }, stage: "{a} sits down next to {b} on the end of the bed.", turns: [
    ['a', "I don't know what to do tonight. {pa} or {c}."],
    ['b', "You're with {pa}."],
    say('a', "I know. But I keep thinking about {c}.", { lad: "I know, {~bro}. But {c}, man. I can't stop thinking about {c.obj}.", bestie: "I know, babe. But I keep thinking about {c}." }),
    say('b', "{pa} has been good to you. {c} is a feeling. Don't throw away something real for a feeling.", { sharp: "Don't be stupid. {pa} is the one who's been there for you." }),
    ['a', "And if the feeling doesn't go away?"],
    ['b', "Then you deal with it after tonight. Not at the fire pit."],
  ], beat: "{a} nods slowly. {a.He} doesn't look sure." },
  { when: { of: 'torn', side: 'other', taken: true, cast: 3 }, stage: "{a} and {b} are lying on the sunbeds.", turns: [
    ['a', "Can I tell you something? I don't know if I want to stay with {pa} tonight."],
    ['b', "Is it {c}?"],
    ['a', "Is it that obvious?"],
    say('b', "Everyone can see it. If you feel it, go for it. You'll regret it if you don't.", { soft: "A bit. And I think you should follow it. You look happier with {c}." }),
    say('a', "{pa} is going to hate me.", { romantic: "But {pa} doesn't deserve that. I hate hurting people." }),
    ['b', "{pa} would rather know now than in a week."],
  ], beat: "{a} looks over at {c}, and then at {pa}, and back again." },
  { when: { of: 'torn', side: 'partner', taken: true, cast: 3 }, stage: "{a} and {b} are floating in the pool, the only two in it.", turns: [
    ['a', "Can I tell you something? I don't know if I'm picking {pa} tonight."],
    ['b', "Because of {c}?"],
    say('a', "Because of {c}. I can't stop thinking about {c.obj}.", { nervy: "Because of {c}. I feel sick even saying it." }),
    say('b', "You've had one good chat with {c}. You've had weeks with {pa}.", { soft: "I get it. But {pa} really cares about you. I don't want you to lose that." }),
    ['a', "So you think I should stay?"],
    ['b', "I think you should stay until you're sure. You're not sure."],
  ], beat: "{a} lies back in the water and stares at the sky." },
  { when: { of: 'torn', side: 'partner', taken: true, cast: 3 }, stage: "{a} and {b} are getting ready in the dressing room.", turns: [
    ['b', "You've been quiet all day. Is it tonight?"],
    ['a', "I keep going back and forth. {pa}, then {c}, then {pa} again."],
    ['b', "Who makes you feel safe?"],
    ['a', "{pa}."],
    ['b', "And who makes you nervous?"],
    say('a', "{c}.", { romantic: "{c}. In a good way. I think." }),
    ['b', "Nervous fades. Safe doesn't."],
  ], beat: "{a} puts the brush down and looks at {a.posAdj} reflection for a long time." },
  { when: { of: 'torn', side: 'other', taken: true, cast: 3 }, stage: "{a} finds {b} on the swing seat.", turns: [
    ['a', "If I pick {c} tonight, will you still talk to me?"],
    ['b', "Of course I will. Is that what you're going to do?"],
    ['a', "I think so. I'm scared of what {pa} will say."],
    say('b', "{pa} will be hurt. But you can't stay with someone because you're scared of hurting them.", { lad: "{pa} will be {~gutted}. But you can't stay just to be nice, {~bro}." }),
    ['a', "I know. I just wish it wasn't like this."],
  ], beat: "{b} squeezes {a.posAdj} hand, and they sit there until someone calls them in." },
  { when: { of: 'torn', taken: true, cast: 3, tier: ['short', 'note'] }, stage: "{a} finds {b} in the kitchen.", turns: [
    ['a', "{pa} or {c}. I've got till tonight."],
    ['b', "Who do you think about when you go to sleep?"],
    ['a', "That's not fair."],
    ['b', "It's the only question that matters."],
  ], beat: "{a} doesn't answer. {a.He} doesn't need to." },

  // ── unsure about {pa}, nobody else ──
  { when: { of: 'unsure', taken: true }, stage: "{a} sits down next to {b} on the end of the bed.", turns: [
    ['a', "I don't know if I want to stay with {pa} tonight."],
    ['b', "Is there someone else?"],
    ['a', "No. That's the thing. There's nobody else. I just don't feel it with {pa}."],
    say('b', "Then staying might be the kindest thing. Until you know.", { sharp: "Then don't waste any more of {pa.posAdj} time." }),
    say('a', "Or it might be the easiest thing. That's not the same.", { nervy: "I don't know. I don't know anything any more." }),
  ], beat: "{b} doesn't have an answer to that." },

  // ── nobody single and no story: a couple talks about tonight ──
  { when: { of: 'settled', taken: true, final: NOT_FINAL }, stage: "{a} and {b} are getting ready in the dressing room.", turns: [
    ['b', "Are you worried about tonight?"],
    say('a', "Not really. I know who I'm picking. It's {pa}.", { lad: "Nah. It's {pa}. Simple as that.", nervy: "A bit. I know it's {pa}. I just get nervous at the fire pit." }),
    ['b', "Do you think {pa} feels the same?"],
    ['a', "I hope so. I think so."],
  ], beat: "{a} smiles at {a.posAdj} reflection." },
  { when: { of: 'settled', taken: true, final: NOT_FINAL }, stage: "{a} and {b} are lying on the sunbeds.", turns: [
    ['a', "Can I ask you something? Do you ever worry someone's going to pick {pa} tonight?"],
    ['b', "Do you?"],
    say('a', "A bit. Every time. Even when I know we're solid.", { sharp: "No. Anyone who tries it will regret it." }),
    ['b', "You're solid. Everyone can see it."],
  ], beat: "{a} looks over at {pa}, and feels a bit better." },
  { when: { of: 'last', taken: true }, stage: "{a} and {b} are sitting on the steps by the pool.", turns: [
    ['b', "This is it. The last recoupling."],
    ['a', "I know. I can't believe we're nearly at the end."],
    ['b', "Any doubts?"],
    say('a', "None. It's {pa}. It's been {pa} for a long time.", { romantic: "None. It's {pa}. I've known for ages.", lad: "None, {~bro}. {pa}. Done." }),
    ['b', "I'm really happy for you."],
  ], beat: "They sit there a little longer, looking at the villa." },
  { when: { of: ['nobody', 'torn', 'unsure'], final: true }, stage: "{a} and {b} are sitting on the steps by the pool.", turns: [
    ['a', "If I'm single after tonight, I go home."],
    ['b', "I know."],
    say('a', "I'm not ready to go home.", { lad: "I'm not ready to go, {~bro}. Not yet.", nervy: "I can't stop shaking. I don't want to go home." }),
    ['b', "Then make sure you're not single. Talk to people today."],
    ['a', "I'm trying."],
  ], beat: "{b} puts an arm round {a}, and neither of them says what they're both thinking." },
  { when: { of: 'nobody', choosing: false }, stage: "{a} and {b} are getting ready in the dressing room.", turns: [
    ['b', "You've done your hair three times."],
    ['a', "Because I'm nervous. I'm the one waiting to be picked tonight."],
    ['b', "You'll get picked."],
    say('a', "You don't know that. Nobody's said anything to me.", { nervy: "I keep thinking about standing there on my own at the end." }),
    ['b', "Then go and talk to someone. You've got hours."],
  ], beat: "{a} puts the brush down, and goes out to the garden." },

] } };

export const VOTE_WORRY_WHOLE = { moves: { whole: [
  { when: { of: 'scared' }, stage: "{a} and {b} are lying on the daybed together.", turns: [
    ['a', "Are you worried about tonight?"],
    say('b', "Yes. I don't know what people think of us out there.", { lad: "A bit, yeah. You never know what they're seeing out there.", nervy: "I've felt sick all day." }),
    ['a', "What if it's us?"],
    say('b', "Then it's us. At least we went together.", { romantic: "Then we leave together. I'd rather leave with you than stay without you.", sharp: "It won't be us. Stop thinking like that." }),
    ['a', "I'm not ready to leave."],
    ['b', "Me neither."],
  ], beat: "{a} holds {b}'s hand a little tighter." },
  { when: { of: 'scared' }, stage: "{a} and {b} sit on the edge of the pool.", turns: [
    ['b', "I keep thinking about the vote."],
    ['a', "Me too."],
    ['b', "Do you think they like us?"],
    say('a', "I hope so. I just hope they can see that this is real.", { lad: "I hope so. We're the real deal. They must see that.", quiet: "I don't know." }),
    ['b', "Whatever happens tonight, I'm glad it was you."],
  ], beat: "{a} kisses {b} on the forehead." },
  { when: { of: 'scared', newCouple: true }, stage: "{a} and {b} are lying on the daybed together.", turns: [
    ['a', "We've only just got together. What if they don't think we're real?"],
    ['b', "We know it's real. That's what matters."],
    say('a', "I just want more time with you.", { romantic: "I just want more time with you. We've barely started." }),
    ['b', "Then let's hope we get it."],
  ], beat: "They lie there in silence, both thinking about the vote." },
  { when: { of: 'calm' }, stage: "{a} and {b} are lying on the sunbeds.", turns: [
    ['a', "Are you nervous about tonight?"],
    say('b', "Not really. We've been ourselves. That's all we can do.", { lad: "Nah. We've just been us. That's all we can do.", sharp: "No. If they don't like us, that's up to them." }),
    ['a', "I wish I was as calm as you."],
    ['b', "Come here. Whatever happens, we're together."],
  ], beat: "{a} lies down next to {b}, and some of the worry goes out of {a.posAdj} shoulders." },
  { when: { of: 'calm' }, stage: "{a} and {b} sit on the edge of the pool.", turns: [
    ['b', "You're quiet."],
    ['a', "Just thinking about the vote."],
    ['b', "Don't. We can't control it."],
    say('a', "I know. I just really want to stay. With you.", { romantic: "I know. I just don't want this to end yet." }),
    ['b', "Then we stay. I've got a good feeling."],
  ], beat: "{a} rests {a.posAdj} head on {b}'s shoulder." },
  { when: { of: 'calm', rung: ['exclusive', 'official'] }, stage: "{a} and {b} are lying on the daybed together.", turns: [
    ['a', "Do you think about what happens if we go tonight?"],
    ['b', "A bit. But if we go, we go together. And then I get you on the outside."],
    say('a', "That's not the worst thing.", { lad: "When you put it like that, I'm not even worried." }),
    ['b', "It's not the worst thing at all."],
  ], beat: "{a} laughs, and {b} pulls {a.obj} in closer." },
  { when: { of: 'scared' }, stage: "{a} and {b} are sitting on the steps by the pool.", turns: [
    ['a', "Can I tell you something stupid? I've been practising what I'd say if we go."],
    ['b', "What would you say?"],
    say('a', "That I don't regret a second of it. Because I don't.", { lad: "That it was worth it. Every bit of it.", romantic: "That I came in here looking for you, and I found you." }),
    ['b', "Don't say it yet. Save it. We might not need it."],
  ], beat: "{b} pulls {a} in, and they watch the pool for a while." },
  { when: { of: 'scared' }, stage: "{a} and {b} are lying in the hammock together.", turns: [
    ['b', "What if the public think we're fake?"],
    ['a', "We're not fake."],
    ['b', "I know that. Do they?"],
    say('a', "They've seen everything. They've seen us at our worst. If they think we're fake, there's nothing we can do.", { nervy: "I don't know. I've been thinking about it all day. I feel sick." }),
    ['b', "I hate this part."],
  ], beat: "The hammock rocks, and neither of them says anything else." },
  { when: { of: 'calm' }, stage: "{a} and {b} are lying in the hammock together.", turns: [
    ['b', "Everyone's being really quiet today."],
    ['a', "It's the vote. Everyone's scared."],
    ['b', "Are you?"],
    say('a', "Not with you here.", { sharp: "No. I've stopped worrying about things I can't change.", quiet: "A bit." }),
  ], beat: "{b} smiles, and the hammock swings gently." },
  { when: { of: 'calm' }, stage: "{a} and {b} are sitting on the steps by the pool.", turns: [
    ['a', "If we go tonight, what's the first thing you want to do?"],
    say('b', "Eat something that isn't from that kitchen.", { romantic: "Take you somewhere with no cameras, and just talk." }),
    ['a', "That's it?"],
    ['b', "And then take you home to meet everyone."],
  ], beat: "{a} laughs, and leans into {b}." },

] } };

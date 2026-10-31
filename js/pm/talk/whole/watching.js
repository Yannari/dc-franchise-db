// pm/talk/whole/watching.js — {a} watches {c}, {a}'s partner, go off with {d},
// and {b} is beside {a.obj}. One talk, start to finish (pm/script.js talkScript
// `whole`), in {a}'s own voice (whole/voice.js). Nobody here knows what was
// said over there: they only see it, or {b} saw it (pm/threads.js graft beat 3).
//   of       sees · told ({b} tells {a})
//   chaser   {c} went over to {d}, not the other way round
//   heat     how it looked from across the garden: cold · one-sided · light · flirty · steamy
import { say } from './voice.js';

const SHORT = ['short', 'note'];

/** {a} has watched {c} go off with {d} before (talk/index.js WATCHING.facts). */
export function watchingFacts(state, ev) {
  const [a, , c, d] = ev.players;
  return { xAgain: [...(state.history || []), ...(state._today || [])].some(e => e !== ev && e.kind === 'watching' && e.aired
    && e.players[0] === a && e.players[2] === c && e.players[3] === d) };
}

export const WATCHING_WHOLE = { moves: { whole: [
  // ── {a} sees {d} take {c} off ──
  { when: { of: 'sees', chaser: false, heat: 'steamy' }, stage: "From the kitchen, {a} and {b} can see across the garden, where {c} and {d} are sitting very close together.", turns: [
    ['a', "Look at them. Look how close {d} is sitting."],
    ['b', "I'm looking."],
    say('a', "{c} hasn't looked over here once. Not once.", { lad: "Bro, {c} hasn't looked over here once.", bestie: "Babe. {c} hasn't looked over here once." }),
    ['b', "Do you want to go over there?"],
    ['a', "And say what? I'd look mad."],
    ['b', "You wouldn't. You're allowed to be upset."],
    say('a', "I'm going to wait, and see if {c} tells me about it.", {
      sharp: "I'm going to wait. And if {c} doesn't tell me about it, I'm going to ask.",
      nervy: "I feel sick. I'm going to wait. I just feel sick.",
      romantic: "I'm going to wait. I want {c} to come and tell me. I want to be able to trust {c.obj}.",
    }),
  ], beat: "{a} doesn't take {a.posAdj} eyes off them." },
  { when: { of: 'sees', chaser: false, heat: ['flirty', 'light'] }, stage: "{a} and {b} are on the daybeds when {d} walks over to {c} and says something. {c} gets up and follows {d} down the garden.", turns: [
    ['a', "Did you see that?"],
    ['b', "I saw."],
    ['a', "What does {d} want with {c}?"],
    say('b', "Probably just a chat. Everyone's chatting to everyone today.", { sharp: "You know what {d} wants." }),
    say('a', "{d} doesn't just chat. Not with someone who's in a couple.", { nervy: "I know it's probably nothing. I just hate it.", lad: "{d} doesn't just chat, bro. Come on." }),
    ['b', "Do you trust {c}?"],
    ['a', "I trust {c}. I don't trust {d}."],
  ], beat: "{a} picks at the cushion and keeps looking down the garden." },
  { when: { of: 'sees', chaser: false }, stage: "{a} is mid-sentence with {b}, then stops and stares at something over {b.posAdj} shoulder.", turns: [
    ['b', "What are you looking at?"],
    ['a', "{c}. With {d}. Over there."],
    ['b', "They're just talking."],
    ['a', "They've been just talking for twenty minutes."],
    say('b', "Does it bother you?", { lad: "Does it get to you, bro?" }),
    say('a', "Yes. I wish it didn't, but it does.", { quiet: "Yeah.", sharp: "Of course it does. Wouldn't it bother you?" }),
    ['b', "Then tell {c} that. Later, when it's just you two."],
  ], beat: "{a} nods, and tries to go back to what {a.he} was saying. {a.He} can't remember what it was." },
  { when: { of: 'sees', chaser: false, heat: ['cold', 'one-sided'] }, stage: "{a} and {b} are on the swing seat. Down the garden, {d} is talking at {c}, who is leaning away.", turns: [
    ['a', "{d} has got {c} cornered over there."],
    ['b', "{c} doesn't look like {c.he}'s enjoying it."],
    ['a', "No. That's the only reason I'm still sitting here."],
    ['b', "Do you want to go and get {c.obj}?"],
    say('a', "No. {c} can handle it. I just want to see what {c} does.", { lad: "Nah. Let's see what {c} does, bro.", sharp: "If {d} doesn't take the hint in a minute, I will." }),
  ], beat: "{a} watches until {c} looks back over, and then pretends {a.he} wasn't watching." },
  { when: { of: 'sees', chaser: false, tier: SHORT }, stage: "{a} and {b} are by the pool.", turns: [
    ['a', "Is that {c} with {d}?"],
    ['b', "Yeah."],
    ['a', "How long have they been there?"],
    ['b', "A while."],
  ], beat: "{a} goes quiet." },

  // ── {b} tells {a} ──
  { when: { of: 'told', chaser: false, heat: ['flirty', 'light', 'cold', 'one-sided'] }, stage: "{b} sits down next to {a} at the kitchen island.", turns: [
    ['b', "Can I tell you something? I don't want to stir anything."],
    ['a', "Go on."],
    ['b', "{d} took {c} off for a chat earlier. They were gone a while."],
    ['a', "How long's a while?"],
    ['b', "Long enough that I thought you should know."],
    say('a', "Thank you. I mean it. I'd rather know.", { sharp: "Right. Thanks. I'll ask {c} about it.", nervy: "Okay. Okay. Thank you. I think." }),
    ['b', "Don't go in angry."],
    ['a', "I won't. I just want to hear it from {c}."],
  ], beat: "{b} gives {a.posAdj} arm a squeeze before getting up." },
  { when: { of: 'told', chaser: false, heat: 'steamy' }, stage: "{b} finds {a} on the terrace.", turns: [
    ['a', "Why are you looking at me like that?"],
    ['b', "{c} was with {d} earlier. On the daybeds."],
    ['a', "Doing what?"],
    ['b', "Talking. I couldn't hear anything. But they were really close. I'm not going to lie to you."],
    say('a', "Okay. I'm not going to panic.", { nervy: "Great. Now I'm going to think about it all day.", sharp: "How close?", lad: "Right. Okay. Thanks for telling me, bro." }),
    ['b', "I'd want to know, if it was me."],
    ['a', "I know. I'm glad you told me."],
  ], beat: "{a} looks down the garden for {c}. {c} isn't there." },
  { when: { of: 'told', chaser: false, tier: SHORT }, stage: "{b} sits down next to {a}.", turns: [
    ['b', "Just so you know, {d} pulled {c} earlier."],
    ['a', "Thanks for telling me."],
  ], beat: "{a} doesn't say anything else." },

  // ── {c}, {a}'s partner, went over to {d} ──
  { when: { of: 'sees', chaser: true }, stage: "{a} and {b} are on the daybeds. {a} watches {c} walk across the garden to {d} and sit down next to {d.obj}.", turns: [
    ['a', "{c} just went over to {d}."],
    ['b', "Maybe it's nothing."],
    say('a', "{c} went to {d}. {d} didn't come to {c}. That's not nothing.", { lad: "Bro. {c} went to {d}. That's not nothing.", bestie: "Babe. {c} went over to {d}. That's not nothing." }),
    ['b', "Have you two been okay?"],
    say('a', "I thought we were. Now I don't know.", { romantic: "I thought we were good. I thought we were really good.", sharp: "Clearly not." }),
    ['b', "Talk to {c} later. Ask {c.obj} straight."],
    ['a', "I will."],
  ], beat: "{a} watches the two of them, and doesn't say another word." },
  { when: { of: 'sees', chaser: true, heat: 'steamy' }, stage: "From the kitchen, {a} and {b} watch {c} sit down next to {d}. {c} is laughing at everything {d} says.", turns: [
    ['a', "Look at {c}. I haven't seen {c.obj} laugh like that in days."],
    ['b', "Maybe {d} is just funny."],
    ['a', "{d} isn't that funny."],
    say('b', "What are you going to do?", { lad: "What are you going to do, bro?" }),
    say('a', "I don't know. Ask {c} what's going on, I suppose. And hope I like the answer.", { sharp: "Ask {c} what that was. And I want a straight answer.", nervy: "I don't know. I don't think I want to know." }),
  ], beat: "{a} puts the drink down without drinking any of it." },
  { when: { of: 'told', chaser: true }, stage: "{b} sits down next to {a} on the swing seat.", turns: [
    ['b', "I need to tell you something. {c} pulled {d} for a chat."],
    ['a', "{c} pulled {d}? Not the other way round?"],
    ['b', "No. {c} went over to {d}."],
    say('a', "I don't know what to say to that.", { sharp: "Then {c} can explain that to me.", romantic: "Why would {c} do that? I thought we were happy." }),
    ['b', "I'm sorry. I thought you'd want to know."],
    ['a', "I do. I'd rather hear it from you than find out last."],
  ], beat: "{a} sits very still, and the swing seat stops moving." },
  // ── again: {a} has watched this before ──
  { when: { of: 'sees', xAgain: true }, stage: "{a} and {b} are on the daybeds. Across the garden, {c} is with {d} again.", turns: [
    ['a', "Again. Look. They're together again."],
    ['b', "I saw."],
    say('a', "{c} told me there was nothing to worry about. And there {c.he} is.", { lad: "{c} told me it was nothing, bro. And there {c.he} is again.", bestie: "Babe, {c} told me it was nothing. Look at {c.obj}." }),
    ['b', "Maybe it really is just a chat."],
    say('a', "Twice is not just a chat.", { soft: "I want to believe that. I really do.", sharp: "Twice isn't a chat. Twice is a choice." }),
    ['b', "Then you need to talk to {c} again."],
    ['a', "I know. I'm just tired of having the same conversation."],
  ], beat: "{a} gets up and goes inside, so {a.he} doesn't have to watch." },
  { when: { of: 'sees', xAgain: true }, stage: "{a} and {b} are in the kitchen. {a} has gone quiet, looking out at the garden.", turns: [
    ['b', "Is that {c} and {d} again?"],
    ['a', "Yeah."],
    ['b', "How are you feeling?"],
    say('a', "Stupid. I believed {c} last time.", { nervy: "Sick. I've felt sick since I saw them.", lad: "Like an idiot, bro. I believed {c} last time." }),
    ['b', "You're not stupid for trusting someone."],
    ['a', "Then why do I feel it?"],
  ], beat: "{b} doesn't have an answer, and stays beside {a}." },
  { when: { of: 'told', xAgain: true }, stage: "{b} sits down next to {a} on the swing seat.", turns: [
    ['b', "I'm sorry to be the one telling you again. {c} was with {d} earlier."],
    ['a', "Again?"],
    ['b', "Again. I thought you'd want to know."],
    say('a', "I do. Thank you. I just don't know what to do with it any more.", { sharp: "Right. Then {c} and I need to have a real talk." }),
  ], beat: "{a} looks down at {a.posAdj} hands, and the swing seat stops moving." },
] } };

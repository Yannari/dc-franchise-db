// pm/talk/whole/group-chat.js — {a} tells the friends ({b}, {c}, {d}) what just
// happened with {x}. One talk, start to finish (pm/script.js talkScript
// `whole`), in their own voices (whole/voice.js). The stitched chat opened on
// "Give me a second to breathe", told it in a speech, and closed on "There are
// about four fish". Here {a} says what happened and how it feels, and the
// friends answer that. `subj` (pm/threads.js REACT):
//   pulled       {x} pulled {a}, who is with {pa}     tempted: {a} liked it
//   dodged       {a} asked {x} where {x.posAdj} head is, and got no answer (story: graft · doubt; none: the Tower)
//   honest       …and got the truth: {about} (graft), cooling off (doubt), a kiss (kissed)
//   turned       {x}, {a}'s partner, wants to get to know {about}
//   found-out    {a} was told what {x} did with {about} (sec: pull · kiss · promise)
//   row          {a} has had it out with {x} (xMine: {x} is {a}'s partner)
//   ended        {x} told {a} they're better as friends
//   shut-down    {x} told {a} to back off
//   knocked-back {a} asked {x} for more, and got "not yet"
//   named        {x} said {about}'s name at the Tower of Truths
//   celebrate    exclusive · official · love (of)
//   progress     {a} and {x} are getting serious; spark: {a} and {x}, both single, had a long chat
// {c} speaks only with cast 3+, {d} with cast 4.
import { say } from './voice.js';
import { romance } from '../../feelings.js';

const C = [3, 4];
// The two-person tellings are short scenes; a featured one has the friends in it.
const SHORT = ['short', 'note'];
const NONE = [undefined, null];
const AGAIN = new Set(['pulled', 'dodged', 'shut-down', 'knocked-back', 'row']);

/** What the chat needs to know about {a} and {x} (talk/index.js GROUP_CHAT.facts). */
export function groupChatFacts(state, ev) {
  const [a] = ev.players, x = ev.extra?.x;
  const c = (state.couples || []).find(p => p.includes(a));
  const mine = c ? (c[0] === a ? c[1] : c[0]) : null;
  return {
    xMine: !!x && x === mine,
    // Narration only: whether {a} enjoyed being pulled, in words.
    tempted: !!x && !!mine && x !== mine && romance(a, x) >= Math.max(3, romance(a, mine) - 1),
    // The same news about the same two, told before (season read: Chloe told
    // the girls "Theo likes me" on day 1 and again, as news, on day 15).
    xAgain: AGAIN.has(ev.extra?.subj) && [...(state.history || []), ...(state._today || [])].some(e => e !== ev && e.kind === 'group-chat'
      && e.aired && e.players[0] === a && e.extra?.x === x && e.extra?.subj === ev.extra?.subj),
  };
}

export const GROUP_CHAT_WHOLE = { moves: { whole: [
  // ── pulled: {x} pulled {a}, who is with {pa} ──
  { when: { subj: 'pulled', taken: true, tempted: false, split: false, cast: C }, stage: "{a} sits down on the daybeds, and the others turn round all at once.", turns: [
    ['b', "Well? What did {x} want?"],
    say('a', "{x} likes me. {x.He} said it straight out.", { lad: "Bro. {x} likes me. Just came out and said it.", bestie: "Babe. {x} likes me. Said it to my face." }),
    ['c', "And what did you say?"],
    say('a', "I said I'm with {pa}. I'm happy with {pa}.", { sharp: "I said no. I'm with {pa}. End of.", soft: "I said I'm with {pa}. I tried to be nice about it." }),
    ['b', "Good. Are you going to tell {pa}?"],
    ['a', "Yeah. Tonight. I don't want {pa} hearing it from someone else."],
  ], beat: "The others nod. Nobody argues with that." },
  { when: { subj: 'pulled', taken: true, tempted: false, cast: C }, stage: "{a} walks into the dressing room, and {b} puts the hairdryer down.", turns: [
    ['b', "Shut the door. Go on."],
    ['a', "{x} pulled me for a chat. I thought it was just going to be a get-to-know-you."],
    ['c', "And it wasn't?"],
    say('a', "No. {x.He} wants to see where it goes with me. I told {x.obj} I'm not interested.", {
      lad: "No, {~mate}. {x.He}'s after me. I told {x.obj} straight, I'm not interested.",
      nervy: "No. {x.He} wants to see where it goes. I didn't know where to look. I said I'm not interested.",
    }),
    ['b', "Do you think {x.he}'ll leave it there?"],
    ['a', "I hope so. I really don't want this getting back to {pa} wrong."],
  ], beat: "{b} says {pa} will hear it from {a} first, and {a} looks relieved." },
  { when: { subj: 'pulled', taken: true, tempted: true, split: false, cast: C }, stage: "{a} comes over to the kitchen island, where the others have been waiting.", turns: [
    ['b', "So? What did {x} want?"],
    ['a', "{x} likes me. And I didn't hate hearing it."],
    ['c', "What does that mean?"],
    say('a', "I don't know what it means. I'm with {pa}. But I was sitting there, and I liked talking to {x.obj}.", {
      lad: "I don't know, bro. I'm with {pa}. But I liked it. I liked talking to {x.obj}.",
      bestie: "I don't know, babe. I'm with {pa}. But I liked it, and I hate that I liked it.",
      romantic: "I don't know. I'm with {pa}, and I care about {pa.obj}. But something happened in that chat.",
    }),
    say('b', "You need to work out what you want before you do anything.", { sharp: "Then you need to be honest with {pa}. Today." }),
    ['a', "I know. I know I do."],
  ], beat: "{a} looks over at {pa}, across the garden, and doesn't say anything else." },
  { when: { subj: 'pulled', taken: true, tempted: true, cast: C }, stage: "{a} climbs onto the end of the bed, and the others gather round.", turns: [
    ['b', "You were gone ages with {x}."],
    ['a', "I know."],
    ['c', "And?"],
    say('a', "And {x.he} said {x.he} likes me. And I didn't stop {x.obj}.", { lad: "And {x.he} said {x.he} {~fancies} me. And I didn't exactly stop {x.obj}, did I?", quiet: "{x.He} likes me. I didn't say no." }),
    ['b', "Do you like {x.obj}?"],
    say('a', "I don't know. Maybe. That's the problem.", { bestie: "Maybe? I don't know! That's the whole problem!" }),
    ['d', "What about {pa}?"],
    ['a', "I know. Don't. I know."],
  ], beat: "Nobody says anything for a moment. {a} pulls a pillow onto {a.posAdj} lap." },
  { when: { subj: 'pulled', taken: true, cast: C }, stage: "{a} drops onto the beanbags next to {b}.", turns: [
    ['b', "Was that {x} I saw you with?"],
    ['a', "Yeah. {x.He} pulled me."],
    ['c', "What for?"],
    ['a', "To tell me {x.he} likes me. Even though I'm with {pa}. Even though everyone knows."],
    say('b', "That's bold.", { sharp: "That's out of order, is what that is.", lad: "That's bold, bro. Fair play to {x.obj}, but that's bold." }),
    ['a', "I know. I didn't know what to say."],
    ['c', "You say you're with {pa}. That's all you need to say."],
  ], beat: "{a} nods, but keeps looking over at {x}." },
  { when: { subj: 'pulled', taken: true, split: false, tier: SHORT }, stage: "{a} sits down next to {b} by the pool.", turns: [
    ['b', "You okay? You look funny."],
    ['a', "{x} just pulled me. Said {x.he} likes me."],
    ['b', "Oh. What about {pa}?"],
    say('a', "That's what I said. I'm with {pa}.", { lad: "That's what I said, {~mate}. I'm with {pa}." }),
    ['b', "Then you've done nothing wrong. Just tell {pa} before anyone else does."],
  ], beat: "{a} says {a.he} will, and gets up to find {pa}." },
  { when: { subj: 'pulled', taken: true, cast: 4 }, stage: "The others are lying on the daybeds when {a} comes back.", turns: [
    ['d', "There you are. We saw {x} take you off."],
    ['a', "{x} likes me. That's what that was."],
    ['b', "Did you know?"],
    ['a', "No. I had no idea. I thought we were just friends."],
    ['c', "How do you feel about it?"],
    say('a', "Awkward. I'm with {pa}. I don't want {pa} thinking I've been leading anyone on.", { soft: "Awful, honestly. I don't want {x} hurt, and I don't want {pa} upset." }),
    ['d', "You haven't. We've all seen you with {pa}."],
  ], beat: "{a} lets out a long breath, and lies back with the others." },

  // ── dodged: {a} asked, and {x} wouldn't say ──
  { when: { subj: 'dodged', story: ['graft', 'doubt'], cast: C }, stage: "{a} comes back from the roof terrace and sits down without a word. {b} moves closer.", turns: [
    ['b', "How did it go?"],
    ['a', "I asked {x} where {x.posAdj} head's at. Straight question."],
    ['c', "And?"],
    say('a', "And {x.he} talked for five minutes and didn't answer it.", { sharp: "Nothing. {x.He} talked and talked and said nothing.", lad: "Nothing, bro. Absolutely nothing. Just talked round it." }),
    ['b', "That's an answer in itself."],
    say('a', "I know. That's what's scaring me.", { quiet: "I know.", romantic: "I know. And I don't want it to be." }),
  ], beat: "{b} puts an arm round {a}." },
  { when: { subj: 'dodged', story: ['graft', 'doubt'], cast: C }, stage: "{a} walks into the dressing room and shuts the door. The others stop doing their hair.", turns: [
    ['b', "What's happened?"],
    ['a', "I asked {x} if everything's okay with us. {x.He} said it's fine."],
    ['c', "Well, that's good, isn't it?"],
    say('a', "No. It's how {x.he} said it. {x.He} couldn't even look at me.", { bestie: "No, babe. It's how {x.he} said it. Couldn't look me in the eye." }),
    ['b', "Do you think there's someone else?"],
    ['a', "I don't know. I don't know what to think."],
  ], beat: "The others look at each other. None of them want to say it." },
  { when: { subj: 'dodged', story: ['graft', 'doubt'], cast: C }, stage: "{a} finds the others out on the terrace.", turns: [
    ['b', "Did you talk to {x}?"],
    ['a', "I tried. Every time I asked, {x.he} changed the subject."],
    ['c', "To what?"],
    ['a', "To anything. The food. The weather. How tired {x.he} is."],
    say('b', "You deserve a straight answer.", { soft: "You deserve better than that. You really do.", lad: "You deserve a straight answer, {~mate}. Ask again." }),
    say('a', "I'm going to ask again tomorrow. And if {x.he} does it again, then I'll know.", { nervy: "I don't even know if I want to ask again. What if I don't like the answer?" }),
  ], beat: "{b} squeezes {a.posAdj} hand." },
  { when: { subj: 'dodged', story: ['graft', 'doubt'], tier: SHORT }, stage: "{a} sits down next to {b} on the swing seat.", turns: [
    ['b', "You don't look happy."],
    ['a', "I asked {x} how {x.he}'s feeling about us, and {x.he} said I'm overthinking it."],
    ['b', "Are you?"],
    say('a', "Maybe. But I wouldn't be overthinking it if {x.he} gave me a {~proper} answer.", { sharp: "No. I'm thinking exactly the right amount." }),
    ['b', "Then keep asking until {x.he} does."],
  ], beat: "{a} nods, and the swing seat creaks back and forth." },
  { when: { subj: 'dodged', story: NONE, cast: C }, stage: "After the game, {a} pulls the others into the dressing room.", turns: [
    ['b', "You saw that, then."],
    ['a', "Everyone saw that. {x} got asked a simple question about us and wouldn't answer it."],
    ['c', "Maybe {x.he} was embarrassed. In front of everyone."],
    say('a', "Embarrassed about what? If you're happy, you just say you're happy.", { lad: "Embarrassed about what, bro? If you're happy, you say so.", bestie: "Embarrassed? Babe, if you're happy you say it. It's not hard." }),
    ['b', "Talk to {x} on your own. See what {x.he} says then."],
  ], beat: "{a} looks at the door, then back at the others, and stays where {a.he} is for now." },
  { when: { subj: 'dodged', story: NONE, tier: SHORT }, stage: "{a} sits down next to {b} at the kitchen island.", turns: [
    ['a', "Did you see {x} dodge that question?"],
    ['b', "I did. I didn't want to say anything."],
    say('a', "In front of everyone. I felt stupid.", { sharp: "In front of everyone. I'm not having it." }),
    ['b', "You're not stupid. Ask {x} properly, on your own."],
  ], beat: "{a} looks over at {x}, who is laughing at something by the pool." },

  // ── honest: {a} asked, and {x} told the truth ──
  { when: { subj: 'honest', story: 'graft', kissed: false, hasWith: true, cast: C }, stage: "{a} comes back in and sits down on the end of the bed.", turns: [
    ['b', "Well?"],
    say('a', "{x} has feelings for {about}. {x.He} told me.", { lad: "{x} likes {about}, {~mate}. Said it to my face.", bestie: "{x} likes {about}. Babe, {x.he} actually said it." }),
    ['c', "Oh my God. Are you okay?"],
    say('a', "No. But at least I know. At least {x.he} didn't lie to me.", { soft: "Not really. But I'd rather know than keep guessing.", sharp: "I'm fine. I'm not going to cry over someone who doesn't want me." }),
    ['b', "What are you going to do?"],
    ['a', "I don't know yet. I just needed to say it out loud."],
  ], beat: "{c} puts a hand on {a.posAdj} shoulder, and leaves it there." },
  { when: { subj: 'honest', story: 'graft', kissed: false, hasWith: true, tier: SHORT }, stage: "{a} finds {b} by the pool.", turns: [
    ['a', "I asked {x}. {x.He} told me the truth. It's {about}."],
    ['b', "I'm so sorry."],
    say('a', "I knew. I think I knew before I asked.", { romantic: "I knew. I just didn't want it to be true." }),
    ['b', "That doesn't make it hurt less."],
    ['a', "No. It doesn't."],
  ], beat: "They sit together with their feet in the water, not talking." },
  { when: { subj: 'honest', story: 'graft', kissed: true, hasWith: true, cast: C }, stage: "{a} comes into the bedroom. {b} can see {a.posAdj} face and sits straight up.", turns: [
    ['b', "What's happened?"],
    ['a', "{x} kissed {about}."],
    ['c', "What? When?"],
    ['a', "I don't even know. I asked {x} if anything had happened, and {x.he} just said yes."],
    say('b', "I'm so angry for you.", { sharp: "Then {x} doesn't deserve another second of your time.", lad: "That's not on, bro. That's not on at all." }),
    say('a', "I'm not even angry yet. I just feel stupid.", { sharp: "I'm angry. I'm so angry I can't think." }),
  ], beat: "{b} wraps {a} in a hug, and the others close in." },
  { when: { subj: 'honest', story: 'graft', kissed: true, hasWith: true, tier: SHORT }, stage: "{a} sits down next to {b} on the steps.", turns: [
    ['a', "I asked {x} straight out. {x.He} kissed {about}."],
    ['b', "No."],
    ['a', "Yes. And {x.he} said sorry like that fixes it."],
    ['b', "It doesn't. You don't have to forgive {x} today."],
  ], beat: "{a} wipes {a.posAdj} eyes with the back of {a.posAdj} hand." },
  { when: { subj: 'honest', story: 'doubt', cast: C }, stage: "{a} sits down on the daybeds, and the others make room.", turns: [
    ['b', "How did it go with {x}?"],
    say('a', "{x} said {x.he}'s not feeling it like {x.he} was.", { lad: "{x}'s not feeling it any more, {~mate}. Said it straight.", bestie: "{x}'s gone off me, babe. {x.He} actually said it." }),
    ['c', "Did {x.he} say why?"],
    ['a', "No. Just that it's changed. And {x.he}'s sorry."],
    ['b', "At least {x.he} was honest."],
    say('a', "I know. It doesn't make it hurt any less.", { quiet: "Yeah.", romantic: "I know. I just thought we were going to be the ones who made it." }),
  ], beat: "The others sit with {a} for a long time." },
  { when: { subj: 'honest', story: 'doubt', tier: SHORT }, stage: "{a} finds {b} in the kitchen.", turns: [
    ['a', "I asked {x}. {x.He} told me. {x.He}'s not sure about us any more."],
    ['b', "Oh, no. Come here."],
    ['a', "I wanted to know. Now I know, and I wish I didn't."],
  ], beat: "{b} holds on to {a} for a long time." },
  { when: { subj: 'honest', story: NONE, cast: C }, stage: "{a} sits down with the others.", turns: [
    ['b', "Did you get an answer out of {x}?"],
    ['a', "I did. {x.He} was honest with me."],
    ['c', "And?"],
    ['a', "And it wasn't what I wanted to hear. I need a minute."],
  ], beat: "{b} rubs {a.posAdj} back, and nobody pushes." },

  // ── turned: {x}, {a}'s partner, wants {about} ──
  { when: { subj: 'turned', hasWith: true, cast: C }, stage: "{a} walks into the bedroom and sits down on the nearest bed.", turns: [
    ['b', "What's wrong?"],
    say('a', "{x} wants to get to know {about}. {x.He} just told me.", { lad: "{x} wants to go for {about}. Just told me, bro.", bestie: "{x} wants to get to know {about}. Babe, I can't." }),
    ['c', "While {x.he}'s with you?"],
    ['a', "While {x.he}'s with me. {x.He} said {x.he} wanted to be honest."],
    say('b', "Honest would have been not doing it.", { soft: "I'm so sorry. You don't deserve that." }),
    say('a', "I keep thinking about what I did wrong.", { sharp: "I'm not going to beg. If {x.he} wants {about}, {x.he} can have {about.obj}." }),
    ['c', "You didn't do anything wrong."],
  ], beat: "{a} lies back on the bed, and {b} lies down next to {a.obj}." },
  { when: { subj: 'turned', hasWith: true, tier: SHORT }, stage: "{a} sits down next to {b} on the daybeds.", turns: [
    ['a', "{x} wants to get to know {about}."],
    ['b', "What? When did this happen?"],
    ['a', "Just now. {x.He} sat me down and said it."],
    say('b', "How are you feeling?", { lad: "You alright, {~mate}?" }),
    say('a', "Like I've been punched.", { quiet: "Not good.", romantic: "Like everything I thought we had wasn't real." }),
  ], beat: "{b} doesn't say anything. {b.He} just stays." },
  { when: { subj: 'turned', cast: C }, stage: "{a} comes back to the others and doesn't sit down.", turns: [
    ['b', "What's happened?"],
    ['a', "{x} says {x.he}'s turning {x.posAdj} head. {x.He} wants to get to know someone else."],
    ['c', "Did {x.he} say who?"],
    ['a', "Does it matter? It's not me."],
  ], beat: "{b} gets up and hugs {a}, and the others follow." },

  // ── found-out: {a} was told what {x} did with {about} ──
  { when: { subj: 'found-out', sec: 'kiss', hasWith: true, cast: C }, stage: "{a} comes back from the garden with red eyes. {b} is up off the daybed straight away.", turns: [
    ['b', "What's happened?"],
    ['a', "{x} kissed {about}. Someone just told me."],
    ['c', "Are you serious?"],
    say('a', "Everyone knew. Everyone knew but me.", { sharp: "And everyone knew. I'm the last one in this villa to find out." }),
    ['b', "I didn't know. I promise I didn't."],
    say('a', "I know you didn't. I need to talk to {x}. I can't even look at {x.obj} right now.", { lad: "I know, bro. I'm going to talk to {x}. Not yet. I'm too angry." }),
  ], beat: "{b} keeps hold of {a.posAdj} hand." },
  { when: { subj: 'found-out', sec: 'promise', hasWith: true, cast: C }, stage: "{a} walks into the dressing room. The others stop talking.", turns: [
    ['a', "Did you know {x} has been making plans with {about}? For the outside?"],
    ['b', "No. What plans?"],
    ['a', "Meeting up. After all this. While {x.he}'s with me."],
    say('c', "That's so cold.", { sharp: "Then {x} has already made {x.posAdj} choice." }),
    say('a', "I've been planning the outside with {x}. {x.He}'s been planning it with someone else.", { romantic: "I was planning the outside with {x}. I thought we'd meet each other's families." }),
  ], beat: "Nobody knows what to say. {b} hugs {a}." },
  { when: { subj: 'found-out', sec: 'pull', hasWith: true, cast: C }, stage: "{a} sits down on the daybeds with the others.", turns: [
    ['a', "Apparently {x} has been having chats with {about}. Long ones."],
    ['b', "Who told you?"],
    ['a', "Doesn't matter. Is it true? Have you seen them?"],
    ['c', "I've seen them talking. I didn't think anything of it."],
    say('a', "Well, I'm thinking something of it.", { soft: "Maybe it's nothing. I don't know. It just hurts that I didn't hear it from {x}." }),
    ['b', "Talk to {x}. Don't let it sit."],
  ], beat: "{a} looks across the garden for {x}." },
  { when: { subj: 'found-out', hasWith: true, tier: SHORT }, stage: "{a} finds {b} in the bedroom.", turns: [
    ['a', "I've just been told about {x} and {about}."],
    ['b', "Oh no. I'm sorry."],
    say('a', "I trusted {x}. I really trusted {x.obj}.", { sharp: "I'm done. I'm actually done.", lad: "I trusted {x}, {~mate}. Properly trusted {x.obj}." }),
    ['b', "Talk to {x} before you decide anything."],
  ], beat: "{a} nods, but doesn't move." },
  { when: { subj: 'found-out', hasWith: false, cast: C }, stage: "{a} comes back in, and the others can tell straight away.", turns: [
    ['b', "What's happened?"],
    ['a', "I've just found out what {x} has been doing behind my back."],
    ['c', "Oh no. Are you okay?"],
    say('a', "No. I feel sick.", { sharp: "I'm fine. {x} won't be." }),
    ['b', "Sit down. We're here."],
  ], beat: "{a} sits, and {b} doesn't let go of {a.posAdj} hand." },

  // ── row: {a} has had it out with {x} ──
  { when: { subj: 'row', xMine: true, cast: C }, stage: "{a} storms into the dressing room. The others look up.", turns: [
    ['b', "We heard. Are you okay?"],
    say('a', "No. {x} wouldn't even let me finish a sentence.", { lad: "No, bro. {x} wouldn't let me get a word in.", bestie: "No, babe. {x} wouldn't let me finish one sentence." }),
    ['c', "What was it about?"],
    ['a', "I said I wanted to know where I stand. {x.He} said I'm being paranoid."],
    say('b', "You're not paranoid. You're allowed to ask.", { soft: "You're allowed to ask. That's what couples do." }),
    say('a', "Then why do I feel like I did something wrong?", { sharp: "I know I'm allowed. I'm just not sure I want to bother any more." }),
  ], beat: "{b} pulls {a} down onto the seat next to {b.obj}." },
  { when: { subj: 'row', xMine: true, cast: C }, stage: "{a} comes back to the daybeds and sits down hard.", turns: [
    ['b', "That got loud."],
    ['a', "I know. I didn't mean it to."],
    ['c', "Who started it?"],
    say('a', "Honestly? Both of us. I said something, {x} said something back, and it just went.", { sharp: "{x} did. And I finished it." }),
    ['b', "Do you want to make up?"],
    say('a', "Yes. I just don't want to be the one who goes first.", { romantic: "Of course I do. I hate fighting with {x}." }),
  ], beat: "{a} looks over at {x}, who is sitting alone on the terrace." },
  { when: { subj: 'row', xMine: true, tier: SHORT }, stage: "{a} sits down next to {b} on the swing seat.", turns: [
    ['b', "You and {x}?"],
    ['a', "Yeah. We've just had it out."],
    ['b', "Are you okay?"],
    say('a', "I will be. I just need everyone to leave me alone for an hour.", { lad: "I'm alright, {~mate}. I just need to cool off." }),
    ['b', "Except me."],
    ['a', "Except you."],
  ], beat: "They sit there together, and {a} slowly calms down." },
  { when: { subj: 'row', xMine: false, taken: true, cast: C }, stage: "{a} comes back to the others, still angry.", turns: [
    ['b', "What did {x} say?"],
    say('a', "That I should mind my own business.", { lad: "Told me to mind my own business, bro." }),
    ['c', "And will you?"],
    say('a', "No. Not when it's about me and {pa}.", { sharp: "Not a chance. Not when it's about {pa}." }),
    ['b', "Just be careful. You don't want to look like the bad one."],
  ], beat: "{a} nods, but {a.posAdj} jaw is still tight." },
  { when: { subj: 'row', xMine: false, tier: SHORT }, stage: "{a} sits down next to {b} by the pool.", turns: [
    ['a', "I've just had it out with {x}."],
    ['b', "How did it go?"],
    ['a', "Badly. {x.He} thinks I'm the problem."],
    ['b', "You're not. But don't let {x} get to you."],
  ], beat: "{a} lets out a breath, and puts {a.posAdj} feet in the water." },

  // ── ended: {x} said they're better as friends ──
  { when: { subj: 'ended', cast: C }, stage: "{a} walks into the bedroom and lies face down on the nearest bed. {b} sits on the edge of it.", turns: [
    ['b', "What happened?"],
    say('a', "{x} said we're better as friends.", { lad: "{x} friend-zoned me, bro. Just like that.", bestie: "{x} said we're better as friends. Babe. Friends." }),
    ['c', "Did you see it coming?"],
    say('a', "A bit. But I thought we'd talk about it. I didn't think {x.he}'d just end it.", { romantic: "No. I really thought it was going somewhere. I thought it was the real thing." }),
    ['b', "I'm so sorry."],
    say('a', "Don't be nice to me. I'll cry.", { sharp: "It's fine. If {x.he} doesn't want me, I'm not going to make {x.obj}." }),
  ], beat: "{b} lies down next to {a} anyway." },
  { when: { subj: 'ended', cast: C }, stage: "{a} comes back to the daybeds and sits down between {b} and {c}.", turns: [
    ['c', "How did it go?"],
    ['a', "It's done. Me and {x}. We're friends now, apparently."],
    ['b', "Are you okay?"],
    say('a', "I don't know yet. It doesn't feel real.", { quiet: "No." }),
    say('c', "Whatever you need, we're here.", { lad: "We've got you, {~mate}. Whatever you need." }),
    ['a', "I just need to sit here for a bit."],
  ], beat: "They sit with {a}. Nobody says anything else." },
  { when: { subj: 'ended', tier: SHORT }, stage: "{a} finds {b} on the terrace.", turns: [
    ['a', "{x} ended it. Said we're better as friends."],
    ['b', "Oh, no. How do you feel?"],
    say('a', "Sad. Mostly sad. I really liked {x.obj}.", { sharp: "Embarrassed. I liked {x.obj} more than {x.he} liked me." }),
    ['b', "I know you did."],
  ], beat: "{b} puts an arm round {a}." },

  // ── shut-down: {x} told {a} to back off ──
  { when: { subj: 'shut-down', cast: C }, stage: "{a} sits down on the daybeds. {b} hands {a.obj} a drink.", turns: [
    ['b', "How did it go with {x}?"],
    say('a', "{x} told me to back off. Nicely. But that's what it was.", { lad: "Knocked back, bro. Very politely knocked back.", bestie: "{x} told me to back off. Very nicely. Which is somehow worse." }),
    ['c', "I'm sorry."],
    say('a', "It's fine. {x.He}'s happy with {x.posAdj} couple. I had to try.", { romantic: "I really thought there was something there. I wouldn't have tried if I didn't." }),
    ['b', "At least now you know."],
    ['a', "Yeah. At least I know."],
  ], beat: "{a} drinks, and looks at the floor." },
  { when: { subj: 'shut-down', cast: C }, stage: "{a} comes back into the villa and sits on the kitchen counter.", turns: [
    ['b', "That was quick."],
    ['a', "{x} said {x.he}'s not interested. Asked me to stop pulling {x.obj}."],
    ['c', "Ouch."],
    say('a', "Yeah. I feel like an idiot.", { sharp: "Fine. I won't, then.", nervy: "I feel so stupid. Everyone saw me go over there." }),
    ['b', "You're not an idiot. You went for it. That takes guts."],
  ], beat: "{a} gives {b} a small smile." },
  { when: { subj: 'shut-down', tier: SHORT }, stage: "{a} sits down next to {b} on the swing seat.", turns: [
    ['b', "Well?"],
    ['a', "{x} said no. Said {x.he}'s happy where {x.he} is."],
    say('b', "Then {x.he}'s missing out.", { lad: "That's {x.posAdj} loss, {~mate}." }),
    ['a', "Doesn't feel like it."],
  ], beat: "{b} bumps {a.posAdj} shoulder with {b.posAdj} own." },
  { when: { subj: 'shut-down', cast: 4 }, stage: "{a} comes back to the others on the terrace.", turns: [
    ['d', "How did it go?"],
    ['a', "{x} doesn't want anything to happen. {x.He} was really clear."],
    ['b', "How are you feeling?"],
    say('a', "Embarrassed. I really liked {x.obj}.", { soft: "Sad. I didn't think I liked {x.obj} that much until {x.he} said no." }),
    ['c', "You'll be okay. Give it a day."],
  ], beat: "{a} nods, and the others start talking about something else, for {a.posAdj} sake." },

  // ── knocked-back: {a} asked {x} for more and got "not yet" ──
  { when: { subj: 'knocked-back', cast: C }, stage: "{a} sits down on the end of the bed. The others wait.", turns: [
    ['b', "Well? Did you ask?"],
    ['a', "I asked. {x} said not yet."],
    ['c', "Not yet isn't no."],
    say('a', "It feels like no. I was so sure {x.he} felt the same.", { lad: "Feels like no, bro. I thought we were on the same page.", romantic: "It feels like no. I was all in, and {x.he}'s not there yet." }),
    ['b', "Give {x.obj} time. Some people take longer."],
    say('a', "I know. I just feel stupid for asking.", { sharp: "I'm not waiting forever." }),
  ], beat: "{b} pulls {a} in for a hug." },
  { when: { subj: 'knocked-back', cast: C }, stage: "{a} comes back to the daybeds. {b} can tell from {a.posAdj} face.", turns: [
    ['b', "Oh no. What did {x} say?"],
    ['a', "{x.He} said {x.he} wants to take it slower."],
    ['c', "That's not the worst thing."],
    ['a', "It's not what I wanted, though."],
    say('b', "Did {x.he} say {x.he} still likes you?", { soft: "Did {x.he} say {x.he} still wants to be with you?" }),
    ['a', "Yeah. {x.He} said {x.he} just isn't there yet."],
    ['b', "Then {x.he}'s still in it. Just slower than you."],
  ], beat: "{a} nods, and tries to believe it." },
  { when: { subj: 'knocked-back', tier: SHORT }, stage: "{a} sits down next to {b} by the pool.", turns: [
    ['a', "I asked {x}. {x.He} said not yet."],
    ['b', "Oh, no. Are you okay?"],
    say('a', "I put myself out there. I don't know what else I can do.", { lad: "I'm alright, {~mate}. Bit {~gutted}." }),
    ['b', "Nothing. You've done your bit. It's up to {x} now."],
  ], beat: "{a} puts {a.posAdj} head on {b}'s shoulder." },

  // ── named: {x} said {about}'s name at the Tower ──
  { when: { subj: 'named', hasWith: true, cast: C }, stage: "{a} walks off from the game, and the others follow.", turns: [
    ['b', "Are you okay?"],
    say('a', "{x} said {about}. In front of everyone. I'm sitting right there, and {x.he} said {about}.", { lad: "{x} said {about}, bro. In front of the whole villa.", bestie: "Babe. {x} said {about}. With me sitting right there." }),
    ['c', "Maybe {x.he} panicked."],
    say('a', "You don't panic and say a name. That name was in {x.posAdj} head.", { soft: "Maybe. But it was still {about}'s name, not mine." }),
    ['b', "Talk to {x}. Make {x.obj} explain it."],
  ], beat: "{a} looks back towards the game, where {x} is pretending nothing happened." },
  { when: { subj: 'named', hasWith: true, tier: SHORT }, stage: "{a} sits down next to {b} on the steps.", turns: [
    ['a', "Did you hear what {x} said?"],
    ['b', "I heard."],
    ['a', "{about}. Of all the people in here."],
    ['b', "I'm sorry. That must have been horrible to hear."],
    say('a', "It was. And {x.he}'s acting like it was nothing.", { sharp: "It was. And {x}'s going to have to explain it." }),
  ], beat: "{b} puts a hand on {a.posAdj} knee." },
  { when: { subj: 'named', cast: C }, stage: "{a} comes back to the daybeds after the game.", turns: [
    ['b', "That was awkward."],
    ['a', "Awkward? {x} named someone else. While I'm sitting there."],
    ['c', "What are you going to say to {x.obj}?"],
    ['a', "I don't know yet. I need to calm down first."],
  ], beat: "{a} sits down, and the others close round." },

  // ── celebrate ──
  { when: { subj: 'celebrate', of: 'exclusive', cast: C }, stage: "{a} walks back to the daybeds, smiling, and the others sit up.", turns: [
    ['b', "What? What's happened?"],
    say('a', "{x} asked me to be exclusive. And I said yes.", { lad: "Me and {x}. Exclusive, bro.", bestie: "Babe. {x} asked me to be exclusive. I said yes!" }),
    ['c', "No way! I'm so happy for you!"],
    ['b', "How did {x.he} ask?"],
    say('a', "{x.He} just said {x.he} doesn't want to look at anyone else. And neither do I.", { romantic: "{x.He} held my hands and said {x.he} doesn't want anyone else. I nearly cried." }),
  ], beat: "The others scream and pile onto {a}." },
  { when: { subj: 'celebrate', of: 'official', cast: C }, stage: "{a} comes back into the villa, and the others can tell straight away.", turns: [
    ['b', "Tell me. Tell me now."],
    say('a', "Me and {x}. It's official.", { lad: "It's official, bro. Me and {x}.", bestie: "Babe. It's official. Me and {x}." }),
    ['c', "Stop it. Come here!"],
    ['a', "I didn't think I'd find anyone in here. And I have."],
    ['b', "You deserve it. You really do."],
  ], beat: "They grab {a} and don't let go." },
  { when: { subj: 'celebrate', of: 'love', cast: C }, stage: "{a} sits down on the bed with the others, still smiling.", turns: [
    ['b', "What's that face for?"],
    ['a', "{x} told me {x.he} loves me."],
    ['c', "No! Did you say it back?"],
    say('a', "I said it back. I meant it.", { romantic: "I said it back before {x.he}'d even finished. I've loved {x.obj} for days.", lad: "Of course I said it back. I meant it, too.", quiet: "Yeah. I did." }),
    ['b', "I'm actually going to cry."],
  ], beat: "{b} cries a bit, and {a} laughs at {b.obj}, and then cries too." },
  { when: { subj: 'celebrate', tier: SHORT }, stage: "{a} finds {b} in the kitchen.", turns: [
    ['a', "I've got something to tell you. Me and {x}."],
    ['b', "Did it happen?"],
    ['a', "It happened."],
    ['b', "I'm so happy for you. Come here."],
  ], beat: "{b} pulls {a} into a hug." },

  // ── progress: {a} and {x} are getting serious ──
  { when: { subj: 'progress', cast: C }, stage: "{a} sits down on the daybeds, and the others turn to look at {a.obj}.", turns: [
    ['b', "So. You and {x}."],
    ['a', "What about me and {x}?"],
    ['c', "Don't. We've all seen it. How's it going?"],
    say('a', "Really well. I really like {x.obj}.", { lad: "Good, bro. Really good. I like {x.obj}, man.", bestie: "Honestly? So good. I really, really like {x.obj}.", quiet: "Good. I like {x.obj} a lot." }),
    ['b', "Do you think {x.he} feels the same?"],
    say('a', "I think so. I hope so.", { romantic: "I know {x.he} does. I can feel it." }),
  ], beat: "{a} looks over at {x}, who looks straight back." },
  { when: { subj: 'progress', cast: C }, stage: "The others are getting ready in the dressing room when {a} comes in.", turns: [
    ['b', "Here {a.he} is. Where have you been?"],
    ['a', "With {x}. Just talking."],
    ['c', "Just talking for two hours?"],
    say('a', "Yes. It's easy with {x.obj}. I don't have to try.", { lad: "Yeah. It's just easy with {x.obj}, {~mate}.", nervy: "Yes! We just talk. It's nice. Stop looking at me like that." }),
    ['b', "That's how you know."],
  ], beat: "{a} goes red, and the others cheer." },
  { when: { subj: 'progress', tier: SHORT }, stage: "{b} sits down next to {a} at the kitchen island.", turns: [
    ['b', "Can I ask about you and {x}?"],
    ['a', "Go on."],
    ['b', "Are you falling for {x.obj}?"],
    say('a', "I think I am.", { sharp: "Maybe. Don't tell anyone.", romantic: "I think I already have." }),
  ], beat: "{b} grins, and promises not to tell anyone." },
  { when: { subj: 'progress', cast: 4 }, stage: "The others are lying on the daybeds when {a} comes back.", turns: [
    ['d', "There {a.he} is. Back from {x}."],
    ['a', "What? I'm allowed to spend time with my partner."],
    ['b', "We're not complaining. We're happy for you."],
    ['c', "Is it serious?"],
    say('a', "I think it's getting serious, yeah.", { lad: "Getting serious, yeah. I'm not going to lie." }),
  ], beat: "The others start chanting, and {a} hides behind a pillow." },

  // ── spark: {a} and {x}, both single ──
  { when: { subj: 'spark', cast: C }, stage: "{a} sits down on the daybed, and the others turn to look at {a.obj} all at once.", turns: [
    ['b', "So. You and {x}."],
    ['a', "We talked. That's all."],
    ['c', "For an hour?"],
    say('a', "Okay. I like {x.obj}. I don't know if it's going anywhere.", { lad: "Alright, I like {x.obj}. I'm not saying anything else.", bestie: "Okay, fine! I like {x.obj}. Happy?" }),
    ['b', "Does {x.he} like you?"],
    ['a', "I think so. We'll see at the recoupling."],
  ], beat: "The others go 'ooh', and {a} throws a cushion at them." },
  { when: { subj: 'spark', cast: C }, stage: "{a} comes back to the kitchen, and {b} is waiting.", turns: [
    ['b', "I saw you with {x}."],
    ['a', "Everyone saw me with {x}."],
    ['c', "Is it something?"],
    say('a', "It might be. I don't want to say too much and jinx it.", { romantic: "It feels like something. It really does." }),
  ], beat: "{b} and {c} look at each other and grin." },
  { when: { subj: 'spark', tier: SHORT }, stage: "{b} sits down next to {a} by the pool.", turns: [
    ['b', "You and {x} looked cosy."],
    ['a', "We were just chatting."],
    ['b', "Do you like {x.obj}?"],
    say('a', "Yeah. I think I do.", { quiet: "Maybe." }),
  ], beat: "{b} grins, and says nothing else about it, for now." },
  // ── again: the same news about the same two, told before ──
  { when: { subj: 'pulled', taken: true, tempted: false, xAgain: true, cast: C }, stage: "{a} sits down on the daybeds and puts {a.posAdj} head in {a.posAdj} hands.", turns: [
    ['a', "{x} pulled me again."],
    ['b', "Again? What did {x.he} say this time?"],
    say('a', "The same thing. That {x.he} likes me, and {x.he}'s not giving up.", { lad: "Same thing, bro. Likes me, not giving up." }),
    ['c', "What did you say?"],
    say('a', "That I'm with {pa}. Again. I don't know how many times I have to say it.", { sharp: "That I'm with {pa}, and {x.he} needs to stop. I'm done being nice about it." }),
    ['b', "Maybe {pa} needs to hear about it, so it's not just you saying no."],
  ], beat: "{a} nods slowly. {a.He} doesn't look happy about it." },
  { when: { subj: 'pulled', taken: true, tempted: true, xAgain: true, cast: C }, stage: "{a} comes back to the others and sits down without looking at anyone.", turns: [
    ['b', "That was {x} again, wasn't it?"],
    ['a', "Yeah."],
    ['c', "You didn't have to go."],
    say('a', "I know I didn't. And I went anyway.", { lad: "I know, bro. And I went anyway. What does that say?", bestie: "I know, babe. And I still went. What's wrong with me?" }),
    ['b', "It says you need to be honest with {pa}. And with yourself."],
    ['a', "I know. I just don't know what I'd say."],
  ], beat: "The others look at each other over {a.posAdj} head." },
  { when: { subj: 'pulled', taken: true, xAgain: true, tier: SHORT }, stage: "{a} sits down next to {b} on the swing seat.", turns: [
    ['b', "{x} again?"],
    ['a', "{x} again."],
    ['b', "What are you going to do about it?"],
    say('a', "I don't know. Tell {pa}, I suppose. Before this turns into something it isn't.", { nervy: "I don't know. Every time it happens, it gets harder to explain to {pa}." }),
  ], beat: "{b} doesn't say anything. {b.He} just nods." },
  { when: { subj: 'dodged', xAgain: true, cast: C }, stage: "{a} sits down with the others and lets out a long breath.", turns: [
    ['b', "Did you ask {x} again?"],
    ['a', "I asked again. Same thing. No answer."],
    ['c', "That's twice now."],
    say('a', "I know. I'm not asking a third time. If {x.he} can't tell me, I'll work it out myself.", { soft: "I know. I don't know what I'm doing wrong.", lad: "I know, bro. I'm not asking a third time." }),
  ], beat: "{b} puts an arm round {a}." },
  { when: { subj: 'dodged', xAgain: true, tier: SHORT }, stage: "{a} finds {b} in the kitchen.", turns: [
    ['a', "{x} did it again. I asked, and {x.he} changed the subject."],
    ['b', "I'm sorry. That's not fair on you."],
    ['a', "I think I already know the answer. {x.He} just doesn't want to say it."],
  ], beat: "{b} doesn't argue." },
  { when: { subj: 'shut-down', xAgain: true, cast: C }, stage: "{a} comes back to the daybeds, and the others can tell.", turns: [
    ['b', "You went back to {x}?"],
    ['a', "I know. I couldn't help it."],
    ['c', "And?"],
    ['a', "And {x.he} said no again. Even more clearly this time."],
    say('b', "You have to let it go now. For you, not for {x.obj}.", { lad: "You've got to leave it now, {~mate}. For your own sake." }),
    ['a', "I know. I will."],
  ], beat: "{a} doesn't look at {x} for the rest of the day." },
  { when: { subj: 'shut-down', xAgain: true, tier: SHORT }, stage: "{a} sits down next to {b}.", turns: [
    ['a', "{x} said no. Again."],
    ['b', "Oh, no. You tried again?"],
    ['a', "I thought something had changed. It hadn't."],
    ['b', "Then that's it. You know now."],
  ], beat: "{a} nods, and doesn't say anything else." },
  { when: { subj: 'knocked-back', xAgain: true, cast: C }, stage: "{a} sits down on the end of the bed.", turns: [
    ['b', "You asked {x} again?"],
    ['a', "I asked again. It's still not yet."],
    ['c', "How many times is {x.he} going to say that?"],
    say('a', "That's what I'm starting to wonder.", { romantic: "I keep thinking {x.he}'ll catch up with me. I don't know any more.", sharp: "I'm not asking a third time. {x.He} can ask me." }),
  ], beat: "{b} squeezes {a.posAdj} hand." },
  { when: { subj: 'knocked-back', xAgain: true, tier: SHORT }, stage: "{a} sits down next to {b} by the pool.", turns: [
    ['a', "Still not yet."],
    ['b', "From {x}? Again?"],
    ['a', "Again. I'm going to stop asking."],
  ], beat: "{b} puts an arm round {a}." },
  { when: { subj: 'row', xMine: true, xAgain: true, cast: C }, stage: "{a} comes back to the daybeds, and the others go quiet.", turns: [
    ['b', "Not again."],
    ['a', "Again."],
    ['c', "What was it about this time?"],
    say('a', "The same thing. It's always the same thing with us.", { lad: "Same thing, bro. It's always the same thing.", bestie: "Same thing, babe. It's always the same thing." }),
    ['b', "Can I say something? Maybe that's the problem."],
    ['a', "I know. I've been thinking that too."],
  ], beat: "{a} looks across at {x}. Neither of them moves." },
  { when: { subj: 'row', xMine: true, xAgain: true, tier: SHORT }, stage: "{a} sits down next to {b} on the steps.", turns: [
    ['a', "Me and {x} again."],
    ['b', "Another one?"],
    ['a', "Another one. I'm so tired of it."],
    ['b', "Do you still want to be with {x.obj}?"],
    say('a', "Yes. I think so. I just want it to be easy again.", { sharp: "I don't know any more. Honestly, I don't." }),
  ], beat: "{b} doesn't push." },
  { when: { subj: 'row', xMine: false, xAgain: true, cast: C }, stage: "{a} comes back to the others, shaking {a.posAdj} head.", turns: [
    ['b', "You and {x} again?"],
    ['a', "{x.He} just won't leave it."],
    ['c', "You could walk away next time."],
    say('a', "I could. I'm not going to.", { soft: "I know. I should. I'll try." }),
  ], beat: "The others look at each other." },
  { when: { subj: 'row', xMine: false, xAgain: true, tier: SHORT }, stage: "{a} sits down next to {b} by the pool.", turns: [
    ['a', "{x} and me. Again."],
    ['b', "Just stay away from {x.obj} for a bit."],
    ['a', "I'm trying. {x.He} keeps finding me."],
  ], beat: "{a} puts {a.posAdj} feet in the water to calm down." },
] } };

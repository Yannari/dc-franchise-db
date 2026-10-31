// pm/talk/whole/enemies.js — the islanders who can't stand each other
// (pm/enemies.js). One talk each, start to finish (pm/script.js talkScript
// `whole`), in their own voices (whole/voice.js). The stitched scenes had a dig
// and a comeback ("I didn't see you there. I never do, to be fair." "Then I met
// you."): a joke where the hurt should be. Here {a} says what it's about and
// how it made {a.obj} feel, and {b} answers that.
//   grudge  steal · vote · told · said · sided · rival (somebody, {x}, behind
//           hasWith) · fake · loud · moody · cocky (nothing happened)
//   enemy-snipe   [a, b, (c)]  of: bites · ignores
//   enemy-bitch   [a, b, c]    {a} on {c}, to {b}. heard: somebody overheard it
//   enemy-clash   [a, b, (c)]  of: walks · stays · pulled-apart ({c} steps in)
//   enemy-freeze  [a, b, c]    {a} freezes {b} out; {c} sees it
//   enemy-truce   [a, b]       of: peace · refused
import { say } from './voice.js';

const X = { hasWith: true };
const NAMED = ['steal', 'vote', 'sided', 'rival'];
const NOTHING = ['fake', 'loud', 'moody', 'cocky'];

// ── enemy-snipe: a dig in front of people, and whether {b} bites ──
// One opening per grudge; how {b} takes it is the second half.
function snipe(when, stage, dig, bites, ignores) {
  return [
    { when: { ...when, of: 'bites' }, stage, turns: [...dig, ...bites.turns], beat: bites.beat },
    { when: { ...when, of: 'ignores' }, stage, turns: [...dig, ...(ignores.turns || [])], beat: ignores.beat },
  ];
}
const SNIPE = [
  ...snipe({ grudge: 'steal', ...X }, "{b} and {x} walk past the sunbeds holding hands, and {a} watches them all the way.", [
    say('a', "Have a nice walk. I used to have nice walks with {x}, before you stood up and took {x.obj}.", { sharp: "Enjoy it. You had to take {x} off somebody else to get it." }),
  ], { turns: [
    ['b', "Are you still going on about that recoupling? It was days ago."],
    say('a', "It was days ago for you. I still have to watch you two every morning.", { soft: "It still hurts. That's all. I'm allowed to be hurt." }),
    ['b', "I picked who I wanted. I'm not going to keep saying sorry for it."],
  ], beat: "{b} walks on with {x}. {a} watches them go, and doesn't say anything else." },
  { turns: [], beat: "{b} keeps walking and doesn't answer. {x} looks back once, and then doesn't." }),
  ...snipe({ grudge: 'steal' }, "{b} is telling a story in the kitchen, and {a} cuts across it.", [
    ['a', "Tell them about the recoupling. The one where you took my partner in front of everyone."],
  ], { turns: [
    ['b', "Can we not do this in front of everyone?"],
    ['a', "You did it in front of everyone. I'm only talking about it."],
  ], beat: "The kitchen goes quiet. {b} puts the kettle down and leaves." },
  { turns: [['b', "Anyway. Like I was saying."]], beat: "{b} carries on with the story, and {a} goes outside." }),
  ...snipe({ grudge: 'vote', ...X }, "Somebody mentions {x} on the lawn, and {a} looks straight at {b}.", [
    say('a', "I miss {x}. Some of us didn't want {x.obj} to go.", { soft: "I really miss {x}. I don't think some people understand how much." }),
  ], { turns: [
    ['b', "Say what you mean. You think it's my fault."],
    ['a', "You voted {x.obj} out. So yes. I think it's a bit your fault."],
    ['b', "Everyone had to vote for somebody."],
  ], beat: "{a} gets up and goes inside. Nobody mentions {x} again." },
  { turns: [], beat: "{b} looks away and doesn't answer. Everyone else on the lawn finds something else to talk about." }),
  ...snipe({ grudge: 'told' }, "{b} leans in to whisper something to someone on the lawn.", [
    say('a', "Careful what you tell {b}. I told {b.obj} something once, and the whole villa knew it by dinner.", { sharp: "I wouldn't tell {b} anything. I learned that the hard way." }),
  ], { turns: [
    ['b', "Are you ever going to let that go?"],
    ['a', "When you say sorry for it. You haven't yet."],
  ], beat: "{b} goes red, and nobody on the lawn says a word." },
  { turns: [], beat: "{b} pretends not to hear, but stops whispering." }),
  ...snipe({ grudge: 'said' }, "{b} says hello to {a} by the pool, all smiles.", [
    say('a', "Don't. I know what you said about me. You don't have to be nice to my face.", { quiet: "Please don't. I heard what you said about me." }),
  ], { turns: [
    ['b', "I was angry when I said that. I didn't think you'd hear it."],
    ['a', "That doesn't make it better. That makes it worse."],
  ], beat: "{b} stands there for a second, then walks off." },
  { turns: [['b', "Okay."]], beat: "{b} goes and sits somewhere else, and {a} stares at the water." }),
  ...snipe({ grudge: 'sided', ...X }, "{b} offers to make {a} a drink.", [
    ['a', "No, thanks. Go and make one for {x}. You were on {x.posAdj} side when it mattered."],
  ], { turns: [
    ['b', "I wasn't on anyone's side. I just didn't think you were right."],
    ['a', "You didn't even ask me what happened."],
  ], beat: "{b} puts the glass down and walks away." },
  { turns: [], beat: "{b} shrugs and makes a drink for somebody else." }),
  ...snipe({ grudge: 'rival', ...X }, "{x} laughs at something {b} says, and {a} watches it happen.", [
    say('a', "Do you have to do that every time I'm about to go and talk to {x}?", { lad: "Every time, {~bro}. Every time I go to talk to {x}, there you are." }),
  ], { turns: [
    ['b', "I was here first. I'm allowed to talk to people."],
    ['a', "You know how I feel about {x}. Everyone knows. And you do it anyway."],
  ], beat: "{x} looks from one of them to the other, and goes to get a drink." },
  { turns: [], beat: "{b} doesn't even look round. {b} just keeps talking to {x}, and {a} walks off." }),
  ...snipe({ grudge: 'fake' }, "{b} is hugging everybody on the lawn, one after another.", [
    say('a', "Look at that. Lovely to everyone. I've heard what you say about them when they've gone.", { quiet: "I don't know how you hug people you talk about behind their backs." }),
  ], { turns: [
    ['b', "What's your problem with me? I've never said a word about you."],
    ['a', "Not to my face."],
  ], beat: "The hugging stops. A couple of people on the lawn look at {b} differently." },
  { turns: [], beat: "{b} smiles and carries on hugging people, and that annoys {a} even more." }),
  ...snipe({ grudge: 'loud' }, "{b} is telling a story at the top of {b.posAdj} voice, and {a} puts {a.posAdj} sunglasses on.", [
    say('a', "Can somebody else have a turn? We've heard about you all day.", { sharp: "Could you be a bit quieter? Some of us are trying to talk." }),
  ], { turns: [
    ['b', "Sorry for having something to say."],
    ['a', "You always have something to say. That's the problem. Nobody else gets a word in."],
  ], beat: "{b} finishes the story more quietly, and doesn't look at {a} once." },
  { turns: [], beat: "{b} just carries on, louder if anything, and {a} goes and lies down by the pool." }),
  ...snipe({ grudge: 'moody' }, "{b} comes out to the garden with a face like thunder.", [
    ['a', "Here we go. What's wrong today? I'm not tiptoeing round you again."],
  ], { turns: [
    ['b', "Nothing's wrong. Why do you always have to say something?"],
    ['a', "Because you put everyone on edge, and nobody else will tell you."],
  ], beat: "{b} goes straight back inside, and the garden goes quiet." },
  { turns: [], beat: "{b} sits down without a word. {a} rolls {a.posAdj} eyes at nobody in particular." }),
  ...snipe({ grudge: 'cocky' }, "{b} is going on about how well {b.posAdj} chat went last night.", [
    say('a', "We know. You've told us. You tell us every day how much everyone wants you.", { lad: "Nobody asked, {~bro}. Nobody ever asks." }),
  ], { turns: [
    ['b', "Are you jealous or something?"],
    ['a', "No. I'm tired of hearing it."],
  ], beat: "{b} laughs it off, but {b.he} doesn't finish the story." },
  { turns: [], beat: "{b} doesn't stop for a second. {a} gets up and goes inside." }),
  ...snipe({ grudge: 'fake' }, "{b} tells {a} {a.posAdj} hair looks nice.", [
    ['a', "Don't. You don't have to be nice to me. I know you don't mean it."],
  ], { turns: [
    ['b', "I did mean it. Why do you always think the worst of me?"],
    ['a', "Because I've heard what you say when I'm not there."],
  ], beat: "{b} walks off without another word." },
  { turns: [['b', "Fine. Forget I said anything."]], beat: "{b} turns back to the others, and {a} goes inside." }),
  ...snipe({ grudge: 'loud' }, "{b} bursts out laughing at the dinner table, and everyone jumps.", [
    say('a', "Do you have to be that loud? Every single time?", { quiet: "Could you be a bit quieter, please? I can't hear anyone else." }),
  ], { turns: [
    ['b', "Sorry for enjoying myself."],
    ['a', "Enjoy yourself. Just let other people talk as well."],
  ], beat: "The table goes quiet, and stays quiet." },
  { turns: [], beat: "{b} doesn't hear, or pretends not to, and {a} gives up." }),
  ...snipe({ grudge: 'moody' }, "{b} sighs loudly at the lunch table.", [
    ['a', "What is it this time? Go on. We're all waiting."],
  ], { turns: [
    ['b', "Can I not just sigh?"],
    ['a', "Not like that. Not every day."],
  ], beat: "{b} takes {b.posAdj} plate and goes and eats somewhere else." },
  { turns: [], beat: "{b} doesn't answer, and the table eats the rest of lunch in silence." }),
  ...snipe({ grudge: 'cocky' }, "{b} is checking {b.ref} out in the mirror by the pool.", [
    say('a', "You know nobody thinks you're as good as you think you are.", { lad: "Nobody thinks you're that good, {~bro}. Just you." }),
  ], { turns: [
    ['b', "What did I do to you?"],
    ['a', "Nothing. You just never stop going on about yourself."],
  ], beat: "{b} puts {b.posAdj} sunglasses back on and doesn't answer." },
  { turns: [], beat: "{b} just smiles at the mirror, and {a} walks off." }),
  // …the same day they fought: it isn't over.
  { when: { rowedToday: true, of: 'bites' }, stage: "{a} and {b} end up at the kitchen counter at the same time.", turns: [
    ['a', "Don't think I've forgotten what you said earlier."],
    ['b', "Neither have I. So let's not start again."],
    ['a', "I'm not starting anything. I'm just telling you I meant it."],
  ], beat: "They stand at opposite ends of the counter, not looking at each other." },
  { when: { rowedToday: true, of: 'ignores' }, stage: "{a} and {b} end up at the kitchen counter at the same time.", turns: [
    ['a', "Still not sorry, then?"],
  ], beat: "{b} picks up a glass of water and walks out without answering." },
];

// ── enemy-bitch: {a} on {c}, to {b}, behind {c}'s back ──
const OPENS = [
  "The dressing room. {a} shuts the door behind {b}, and checks the hallway first.",
  "{a} and {b} are on the swing seat, keeping their voices down.",
  "{a} pulls {b} over to the far end of the garden.",
];
const BITCH_END = {
  heard: [
    "Neither of them notices the bathroom door is open, or who is standing just behind it.",
    "Somebody on the other side of the wall has stopped what they were doing to listen.",
  ],
  quiet: [
    "{b} doesn't say anything, but {b.he} looks at {c} differently at dinner.",
    "They go back out to the others, and {a} smiles at {c} as if nothing was said.",
  ],
};
let bitchN = 0;
function bitch(when, turns) {
  const n = bitchN++;
  return [true, false].map(heard => ({ when: { ...when, heard }, stage: OPENS[n % OPENS.length], turns,
    beat: BITCH_END[heard ? 'heard' : 'quiet'][n % 2] }));
}
const BITCH = [
  ...bitch({ grudge: 'steal', ...X }, [
    say('a', "I can't even look at {c} any more. Every time I see {c.obj} with {x}, I think, that was me a week ago.", { soft: "It still hurts, seeing {c} with {x}. I keep thinking that should be me." }),
    ['b', "Have you told {c} how much it hurt?"],
    ['a', "What's the point? {c} got what {c.he} wanted."],
  ]),
  ...bitch({ grudge: 'steal' }, [
    ['a', "{c} took my partner at a recoupling, and now {c.he} wants to be friends with me. I can't do it."],
    ['b', "Maybe {c} feels bad about it."],
    ['a', "Then {c} can say so. I've been waiting for a sorry for days."],
  ]),
  ...bitch({ grudge: 'vote', ...X }, [
    ['a', "{c} voted {x} out, and then came and hugged me like we're friends. I haven't forgotten."],
    ['b', "Everyone had to vote for somebody."],
    say('a', "I know. But {c} didn't have to pick my best friend.", { soft: "I know. It just hurts that it was {x}." }),
  ]),
  ...bitch({ grudge: 'told' }, [
    say('a', "Don't tell {c} anything. I mean it. I told {c} one thing, and the whole villa knew by dinner.", { sharp: "Never tell {c} a secret. Ever." }),
    ['b', "Are you sure it was {c}?"],
    ['a', "I only told one person, so yes. I'm sure."],
  ]),
  ...bitch({ grudge: 'said' }, [
    ['a', "I keep thinking about what {c} said about me. How long has {c} felt like that, and smiled at me anyway?"],
    ['b', "Maybe {c} didn't mean it."],
    ['a', "Then why say it? I'll be polite to {c}. That's all I've got left."],
  ]),
  ...bitch({ grudge: 'sided', ...X }, [
    ['a', "When it all kicked off, {c} stood right next to {x} and didn't say a word to me. I thought we were friends."],
    ['b', "I think {c} just didn't want to get involved."],
    ['a', "{c} did get involved. Just not for me."],
  ]),
  ...bitch({ grudge: 'rival', ...X }, [
    say('a', "{c} knows I like {x}. Everyone knows. And every time I go over, {c} is already there.", { lad: "I'm telling you, {~bro}, {c} knows I'm into {x}. And {c} is always there first." }),
    ['b', "You don't think it's just a coincidence?"],
    ['a', "Not every single time."],
  ]),
  ...bitch({ grudge: 'fake' }, [
    ['a', "I don't trust {c}. I heard {c} call me boring two days ago, and this morning {c} asked how I was like {c.he} really cared."],
    ['b', "I've noticed {c} is different with different people."],
    ['a', "Thank you. I thought it was just me."],
  ]),
  ...bitch({ grudge: 'loud' }, [
    say('a', "I've tried with {c}. I really have. But every conversation ends up being about {c}.", { bestie: "Babe, I've tried. Every chat with {c} ends up being about {c}." }),
    ['b', "{c} is a lot. I'll give you that."],
    ['a', "I just want one conversation where I get to finish what I'm saying."],
  ]),
  ...bitch({ grudge: 'moody' }, [
    ['a', "I asked {c} if {c.he} wanted a drink, and {c.he} bit my head off. I'm not asking again."],
    ['b', "{c} has been in a mood for days."],
    ['a', "Then {c} can be in a mood on {c.posAdj} own. I'm tired of walking on eggshells."],
  ]),
  ...bitch({ grudge: 'cocky' }, [
    ['a', "{c} hasn't asked me one question about myself since I walked in. Not one. It's all about {c}."],
    ['b', "Have you tried talking to {c} on your own?"],
    ['a', "I have. I heard all about {c}."],
  ]),
];

// ── enemy-clash: it comes out properly ──
const CLASH_END = {
  walks: [
    { turns: [['a', "I'm done. I've said what I needed to say."]], beat: "{a} walks off before {b} can answer, and the dressing-room door slams." },
    { turns: [['b', "I'm not standing here for this."]], beat: "{b} walks away, and {a} is left shaking." },
  ],
  stays: [
    { turns: [], beat: "They stand there, a few feet apart, and neither of them is the first to move." },
    { turns: [['a', "I'm not going anywhere."], ['b', "Neither am I."]], beat: "Nobody else on the terrace says a word." },
  ],
  'pulled-apart': [
    { when: { cast: 3 }, turns: [['c', "Okay. Enough, both of you. This isn't helping."]], beat: "{c} steers {a} away by the arm, and {b} is left on {b.posAdj} own." },
    { when: { cast: 3 }, turns: [['c', "Come on. Come with me. Leave it for now."]], beat: "{c} walks {a} off to the roof terrace. {b} sits down and puts {b.posAdj} head in {b.posAdj} hands." },
  ],
};
let clashN = 0;
function clash(when, stage, turns) {
  const n = clashN++;
  return Object.entries(CLASH_END).map(([of, ends]) => {
    const t = ends[n % ends.length];
    return { when: { ...when, ...(t.when || {}), of }, stage, turns: [...turns, ...t.turns], beat: t.beat };
  });
}
const CLASH = [
  ...clash({ grudge: 'steal', ...X }, "It starts in the kitchen and ends up in the middle of the lawn.", [
    say('a', "You took {x} off me at a recoupling, in front of everyone, and you've never once said sorry.", { soft: "You took {x} from me in front of everyone. Do you know how that felt?" }),
    ['b', "It was a recoupling. I picked who I wanted. You'd have done the same."],
    ['a', "I would never have done it to someone I lived with. I'd have talked to them first."],
    ['b', "I didn't owe you a conversation."],
  ]),
  ...clash({ grudge: 'steal' }, "It starts at the pool and gets louder from there.", [
    ['a', "You stood up at that recoupling and took my partner. And you've smiled at me every day since like we're fine."],
    ['b', "What do you want me to do? Not smile at you?"],
    ['a', "I want you to say it was a horrible thing to do to me."],
    ['b', "It wasn't horrible. It was the game."],
  ]),
  ...clash({ grudge: 'vote', ...X }, "{a} finds {b} on the terrace, and doesn't sit down.", [
    ['a', "You voted {x} out. {x} was my best friend in here, and you sent {x.obj} home. And then you hugged me."],
    ['b', "I voted with my head. I'm not going to say sorry for that."],
    say('a', "I'm not asking you to say sorry. I'm asking you to stop pretending you care about me.", { soft: "I just wish you'd been honest with me about it." }),
    ['b', "I do care. That's why I hugged you."],
  ]),
  ...clash({ grudge: 'told' }, "{a} walks straight up to {b} on the lawn.", [
    ['a', "I told you something in confidence, and you told the whole villa. Why? What did you get out of it?"],
    ['b', "Somebody asked me straight out. I wasn't going to lie for you."],
    ['a', "So it's my fault now?"],
    ['b', "I didn't say that. I said I wasn't going to lie."],
  ]),
  ...clash({ grudge: 'said' }, "{a} has been holding it in all day, and now {a} doesn't hold it in any more.", [
    ['a', "I heard what you said about me. And then you sat next to me at dinner like nothing happened."],
    ['b', "I was angry. People say things when they're angry."],
    say('a', "Then be angry with me to my face. Like I'm doing now.", { quiet: "It really hurt. I thought you liked me." }),
    ['b', "Fine. I was angry with you. I still am."],
  ]),
  ...clash({ grudge: 'sided', ...X }, "{a} catches {b} by the fire pit, before anyone else is out.", [
    ['a', "When it all kicked off, you went straight to {x}. You didn't even ask me what happened."],
    ['b', "I didn't pick a side."],
    ['a', "You did. You just didn't pick mine."],
    ['b', "Because I didn't think you were right."],
  ]),
  ...clash({ grudge: 'rival', ...X }, "It boils over by the pool.", [
    say('a', "You know how I feel about {x}. I told you. And every time I go over there, you're already there.", { lad: "I told you I liked {x}, {~bro}. I told you. And you went straight over there." }),
    ['b', "You don't own anybody in here. If {x} wants to talk to me, {x} can talk to me."],
    ['a', "I'm not saying I own {x}. I'm saying you knew, and you didn't care."],
    ['b', "I like {x} too. I'm allowed to."],
  ]),
  ...clash({ grudge: 'fake' }, "It comes out on the daybeds, with half the villa listening.", [
    ['a', "You're nice to everyone's face, and then you say what you really think somewhere else. I've heard you."],
    ['b', "Where's this come from? I've never done anything to you."],
    ['a', "You called me boring. I heard you. And then you hugged me the next morning."],
    ['b', "I said one thing, once, when I was in a bad mood."],
  ]),
  ...clash({ grudge: 'loud' }, "It starts as a joke at dinner and stops being one.", [
    say('a', "Can I finish one sentence? Every time anyone talks, you talk over them. Every single day.", { sharp: "Let me finish. For once in this villa, let somebody else finish." }),
    ['b', "I'm just joining in. That's what people do."],
    ['a', "No. You take over. There's a difference, and everyone at this table knows it."],
    ['b', "Then everyone can tell me themselves."],
  ]),
  ...clash({ grudge: 'moody' }, "It starts over nothing, in the kitchen.", [
    ['a', "I'm not walking on eggshells round you any more. You snap at everyone, and we're all meant to act like it's fine."],
    ['b', "I've had a bad few days. Sorry I'm not smiling all the time."],
    ['a', "Nobody wants you smiling all the time. We want you to stop taking it out on us."],
    ['b', "I don't take it out on anyone."],
  ]),
  ...clash({ grudge: 'cocky' }, "It starts by the pool, and it gets loud fast.", [
    ['a', "You think you're better than everyone in here. You don't even try to hide it."],
    ['b', "I'm confident. That's not the same thing."],
    ['a', "You haven't asked me one thing about myself since you walked in."],
    ['b', "Maybe I haven't wanted to."],
  ]),
  // …the same two, having it out again (xAgain: they've clashed before, talk/index.js).
  ...clash({ xAgain: true }, "It starts again, the same as last time.", [
    say('a', "We've had this out before, and nothing's changed. You're still doing it.", { sharp: "I told you last time. You didn't listen then either." }),
    ['b', "And you're still going on about it. I thought we'd moved on."],
    ['a', "You moved on. I didn't."],
  ]),
  ...clash({ xAgain: true }, "{a} and {b} end up face to face by the pool, again.", [
    ['a', "I'm so tired of this. Every few days it's the same thing with you."],
    ['b', "Then stop starting it."],
    say('a', "I'm not the one starting it. I just don't stay quiet any more.", { soft: "I don't want to keep fighting with you. I just want it to stop." }),
  ]),
  // …the second time today.
  ...clash({ rowedToday: true, xAgain: [true, false] }, "It starts again, the second time today.", [
    ['a', "I thought we'd finished this earlier, but you're still going."],
    ['b', "You're the one who brought it up again."],
    ['a', "Because nothing got sorted. You just walked off."],
  ]),
];

// ── enemy-freeze: {a} freezes {b} out, and {c} sees it ──
const FREEZE_STAGES = [
  "{b} sits down at the lunch table, and {a} picks up {a.posAdj} plate and goes and eats by the pool.",
  "{b} asks if anybody wants a tea. Everyone says yes except {a}, who gets up and makes {a.posAdj} own.",
  "Everyone's getting ready in the dressing room, and {a} is chatting away to all of them. When {b} walks in, {a} goes quiet.",
  "{b} says hello to {a}. {a} says hello to the person standing next to {b}.",
];
let freezeN = 0;
const freeze = (when, turns, beat) => ({ when, stage: FREEZE_STAGES[freezeN++ % FREEZE_STAGES.length], turns, beat });
const FREEZE = [
  freeze({ grudge: 'steal' }, [
    ['c', "Are you two ever going to speak again?"],
    say('b', "Not until {a} gets over the recoupling. And I don't think that's happening.", { soft: "I hope so. I know {a} is hurt about the recoupling. I just don't know how to fix it." }),
  ], "{c} looks over at {a}, who is suddenly very busy with a hairbrush."),
  freeze({ grudge: 'vote' }, [
    ['c', "Did you see that?"],
    ['b', "It's about the vote. {a} hasn't spoken to me since."],
    ['c', "That was days ago."],
    ['b', "Tell that to {a}."],
  ], "{b} laughs it off, and then doesn't eat anything else."),
  freeze({ grudge: ['told', 'said'] }, [
    ['c', "What's going on with you and {a}?"],
    ['b', "I said something I shouldn't have, and it got back to {a}. Now {a} acts like I'm not here."],
    ['c', "Have you said sorry?"],
    ['b', "I've tried. {a} walks off before I get the chance."],
  ], "{b} looks over at {a}, and {a} looks the other way."),
  freeze({ grudge: ['sided', 'rival'] }, [
    ['c', "Are you two okay?"],
    ['b', "No. {a} decided I'm on the wrong side, and that was it."],
    ['c', "That's a shame. You used to get on."],
  ], "{c} looks over at {a}. {a} is suddenly very busy with a hairbrush."),
  freeze({ grudge: NOTHING }, [
    ['b', "What have I done? Honestly, has anyone got any idea what I've done?"],
    ['c', "I think you'd have to ask {a} that."],
    ['b', "I would, if {a} would look at me for more than a second."],
  ], "{b} laughs it off, and then doesn't eat anything else."),
  freeze({ grudge: NOTHING }, [
    ['c', "Did you see that?"],
    say('b', "I see it every day. I've stopped saying anything.", { soft: "I see it. I just don't know what I did wrong." }),
  ], "{c} gives {b}'s arm a squeeze, and {b} manages a smile."),
  freeze({ grudge: NOTHING }, [
    ['c', "Why won't {a} talk to you?"],
    ['b', "I wish I knew. I've asked. {a} just walks off."],
    ['c', "That's horrible. I'm sorry."],
  ], "{b} shrugs, and pretends it doesn't matter."),
  freeze({ grudge: NOTHING }, [
    ['b', "Did you see that? I said hello and got nothing."],
    say('c', "I saw. That was rude.", { soft: "I saw. Are you okay?" }),
    ['b', "I'm fine. I'm used to it now."],
  ], "{b} isn't fine, and {c} can tell."),
  freeze({ grudge: 'steal' }, [
    ['b', "I knew {a} was angry about the recoupling. I didn't think it would be like this."],
    ['c', "Give it time. It's still raw."],
  ], "{b} looks over at {a}, and {a} turns {a.posAdj} back."),
  freeze({ rowedToday: true }, [
    ['c', "Is this because of earlier?"],
    say('b', "Must be. {a} hasn't looked at me since.", { soft: "I think so. I hate it, but I don't know how to fix it." }),
  ], "{c} looks over at {a}, who is very busy with a hairbrush."),
];

// ── enemy-truce: they talk it out, or don't ──
const TRUCE_OPENS = [
  { stage: "{a} finds {b} on the terrace, and for once, doesn't look like {a} is about to start something.", turns: [['a', "Can we talk? Properly, without shouting."]] },
  { stage: "Late at night, {a} sits down on the other end of the daybed from {b}.", turns: [['a', "I'm not here to have a go. I promise."], ['b', "Okay. Go on."]] },
];
const TRUCE_ANSWERS = {
  peace: [
    { turns: [['b', "I haven't been easy either. Can we just start again?"], ['a', "I'd really like that."]], beat: "They hug, a bit awkwardly, and someone on the lawn actually claps." },
    { turns: [['b', "Thank you for saying that. Honestly. I didn't think you would."], ['a', "Neither did I. But I'm tired of being angry."]], beat: "By dinner, they're sitting next to each other, and nobody can quite believe it." },
  ],
  refused: [
    { turns: [['b', "I appreciate you coming over. I do. But I'm not ready to act like the last week didn't happen."], ['a', "Okay. That's fair."]], beat: "{a} nods, and goes back inside." },
    { turns: [['b', "You've been on at me for days, and now you want to be friends?"], ['a', "I mean it. I'm sorry."], ['b', "Maybe you are. I'm still not there yet."]], beat: "{a} leaves {b} on the terrace, and neither of them looks back." },
  ],
};
let truceN = 0;
function truce(when, said) {
  const n = truceN++;
  const open = TRUCE_OPENS[n % TRUCE_OPENS.length];
  return Object.entries(TRUCE_ANSWERS).map(([of, answers]) => {
    const t = answers[n % answers.length];
    return { when: { ...when, of }, stage: open.stage, turns: [...open.turns, ...said, ...t.turns], beat: t.beat };
  });
}
const TRUCE = [
  ...truce({ rowedToday: true }, [
    say('a', "I know we went at each other earlier. I don't want to go to bed like that.", { lad: "Look, {~bro}. Earlier got out of hand. I don't want to leave it like that." }),
  ]),
  ...truce({ grudge: 'steal' }, [
    say('a', "I've been angry with you since that recoupling. And I think it's because it hurt, not because you did it to hurt me.", { soft: "I've been so hurt since that recoupling, and I took it out on you." }),
  ]),
  ...truce({ grudge: 'vote' }, [
    ['a', "I know everyone had to vote for somebody. I just needed someone to blame, and it was easier if it was you."],
  ]),
  ...truce({ grudge: ['told', 'said'] }, [
    ['a', "I've been holding on to what happened, and it's making me miserable. I don't want to spend the rest of this hating somebody."],
  ]),
  ...truce({ grudge: ['rival', 'sided'] }, [
    ['a', "I've been horrible to you, and it's not really about you. It's about how I feel about everything else in here."],
  ]),
  ...truce({ grudge: NOTHING }, [
    say('a', "I think I decided I didn't like you before I'd even had a real conversation with you. That's not fair on you.", { lad: "Look, {~bro}. I judged you before I knew you. That's on me." }),
  ]),
];

export const ENEMY_SNIPE_WHOLE = { moves: { whole: SNIPE } };
export const ENEMY_BITCH_WHOLE = { moves: { whole: BITCH } };
export const ENEMY_CLASH_WHOLE = { moves: { whole: CLASH } };
export const ENEMY_FREEZE_WHOLE = { moves: { whole: FREEZE } };
export const ENEMY_TRUCE_WHOLE = { moves: { whole: TRUCE } };

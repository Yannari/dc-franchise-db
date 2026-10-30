// ══════════════════════════════════════════════════════════════════════
// pm/talk/stretch.js — after the fire pit: what the stretch's story came to
// ══════════════════════════════════════════════════════════════════════
//
// A story the stretch followed (pm/stretch.js) is answered by its fire pit.
// When the fire pit didn't show the answer itself — a vote night has no picks,
// and a couple who simply stayed together had no moment of their own — it is
// said here, after. `of`:
//   graft-stayed   [a, b, c]  {a} was chased by {c} all week and is still with {b}
//   graft-won      [a, b]     {a} went after {b}, and they are together now
//   graft-apart    [a, b, c]  {a} went after {c}; it's over, and {a} tells friend {b}
//   doubt-recommit [a, b]     {a} had been going off {b}; they're still together
//   doubt-ended    [a, b, c]  {c} had been going off {a}; it's over; {a} tells friend {b}
// SECRET_KEPT [a, b, c]: {a} knows what {c} did and still hasn't told {b}.
import { build } from './build.js';

export const STRETCH_ANSWER = build('stretch-answer', {
  tiered: false,
  plans: { featured: ['open', 'say', 'close'], short: ['say', 'close'] },
  moves: {
    open: [
      { when: { of: 'graft-stayed' }, stage: "The terrace, after the fire pit. {a} and {b} are the last two up.", turns: [
        ['b', "Can I say something?"],
        ['a', "Go on."],
      ] },
      { when: { of: 'graft-stayed' }, stage: "{b} is sitting on the end of the bed when {a} comes up from the fire pit.", turns: [
        ['a', "You're still up."],
        ['b', "I wasn't going to sleep until we'd talked."],
      ] },
      { when: { of: 'graft-won' }, stage: "The daybeds, late. {a} and {b} have been sitting together since the fire pit.", turns: [
        ['b', "So."],
        ['a', "So."],
      ] },
      { when: { of: 'graft-won' }, stage: "{a} brings two drinks over and sits down next to {b} by the pool.", turns: [
        ['a', "I didn't think tonight would end like this."],
        ['b', "Neither did I."],
      ] },
      { when: { of: 'graft-apart' }, stage: "The dressing room, after the fire pit. {a} is sitting on the floor with {a.posAdj} back against the bed.", turns: [
        ['b', "Do you want to talk about it?"],
        ['a', "Not really. Yes. I don't know."],
      ] },
      { when: { of: 'graft-apart' }, stage: "{b} finds {a} on the swing seat on {a.posAdj} own.", turns: [
        ['b', "Budge up."],
      ] },
      { when: { of: 'doubt-recommit' }, stage: "The bedroom, lights out. {a} and {b} are lying awake.", turns: [
        ['b', "Are you asleep?"],
        ['a', "No."],
      ] },
      { when: { of: 'doubt-recommit' }, stage: "{a} finds {b} on the terrace after the fire pit.", turns: [
        ['a', "Can we talk? Properly?"],
        ['b', "We've been talking all week. But go on."],
      ] },
      { when: { of: 'doubt-ended' }, stage: "{b} sits down next to {a} in the kitchen. {a} hasn't touched the tea in front of {a.obj}.", turns: [
        ['b', "That's gone cold."],
        ['a', "I know."],
      ] },
      { when: { of: 'doubt-ended' }, stage: "The dressing room. {a} is taking {a.posAdj} make-up off, and {b} is sitting on the counter.", turns: [
        ['b', "You can say it, you know."],
      ] },
    ],
    say: [
      // {a} stayed with {b}, with {c} after {a} all week
      { when: { of: 'graft-stayed' }, turns: [
        ['b', "I watched {c} go after you all week. Every day. And I didn't say much, because I didn't want to be the one who made a scene."],
        ['a', "I know you didn't. I saw that."],
        ['b', "So I need to hear it. Is it done?"],
        ['a', "It's done. It was done before tonight. {c} wanted something I didn't, and I said so."],
      ] },
      { when: { of: 'graft-stayed' }, turns: [
        ['b', "Tonight was the first time all week I wasn't looking over my shoulder for {c}."],
        ['a', "You didn't need to be looking. I'm with you."],
        ['b', "I know that now. I didn't know it on Tuesday."],
        ['a', "Then I should have said it on Tuesday. That's on me."],
      ] },
      { when: { of: 'graft-stayed', feels: 'strong' }, turns: [
        ['a', "I'm going to say this once, so you don't have to wonder. Whatever {c} said to me, and whatever it looked like, I never wanted to be anywhere else."],
        ['b', "It looked like a lot."],
        ['a', "It looked like a lot because {c} made it a lot. I just let {c} talk."],
        ['b', "Next time, don't let {c} talk."],
      ] },
      { when: { of: 'graft-stayed', feels: ['some', 'little'] }, turns: [
        ['a', "I'm not going to pretend I didn't think about it. {c} made me think. But I'm still here, and I'm here because I want to be."],
        ['b', "That's honest."],
        ['a', "You'd rather honest than nice, wouldn't you?"],
        ['b', "Today I'd have taken both."],
      ] },
      // {a} went after {b}, and they're together now
      { when: { of: 'graft-won' }, turns: [
        ['a', "I've been trying to get five minutes with you for about a week."],
        ['b', "You got more than five minutes."],
        ['a', "I'm not complaining. I just want to know this is what you want, and not just what happened."],
        ['b', "It's what I want. I wouldn't be sitting here otherwise."],
      ] },
      { when: { of: 'graft-won' }, turns: [
        ['b', "Everyone's going to say you went after someone who was taken."],
        ['a', "Everyone can say what they want. I didn't hide it. I told you, and I told everyone else."],
        ['b', "You did."],
        ['a', "So now we just have to make it worth it."],
      ] },
      // {a} went after {c}; it's over
      { when: { of: 'graft-apart' }, turns: [
        ['a', "I put everything into {c} this week. I knew it was a risk. I just didn't think it would end with me sitting here and {c} not even looking over."],
        ['b', "You went for it. That's more than most people in here do."],
        ['a', "It doesn't feel like more right now."],
        ['b', "It will. Not tonight, but it will."],
      ] },
      { when: { of: 'graft-apart' }, turns: [
        ['a', "I keep going over the chats with {c}. Looking for the bit where I got it wrong."],
        ['b', "Maybe you didn't get anything wrong. Maybe {c} just wasn't going to move."],
        ['a', "Then I wasted a whole week."],
        ['b', "You found out. That's not the same as wasting it."],
      ] },
      // {a} had been going off {b}; still together
      { when: { of: 'doubt-recommit' }, turns: [
        ['a', "I know I've been distant this week. I know you noticed. I'm not going to pretend I wasn't."],
        ['b', "I noticed. Everyone noticed."],
        ['a', "I got in my own head. Tonight, standing at the fire pit, I knew where I wanted to be, and it was with you."],
        ['b', "Then stay out of your head. Talk to me instead."],
      ] },
      { when: { of: 'doubt-recommit' }, turns: [
        ['b', "I need to know if this week was a blip, or if it's going to happen again."],
        ['a', "A blip. I hope. I'm not going to promise you I'll never have a bad day."],
        ['b', "I'm not asking for that. I'm asking you to tell me when it's a bad day, instead of going quiet for three."],
        ['a', "Okay. That I can do."],
      ] },
      // {c} had been going off {a}; over
      { when: { of: 'doubt-ended' }, turns: [
        ['a', "I could feel it all week. {c} going quiet. Sitting a bit further away. I kept telling myself it was nothing."],
        ['b', "You knew, though."],
        ['a', "I knew. I just wanted {c} to be the one to say it, and it never came."],
        ['b', "Then you're better off. Someone who can't say it to your face isn't someone you want."],
      ] },
      { when: { of: 'doubt-ended' }, turns: [
        ['a', "The worst bit is I asked {c} straight out, a few days ago, where {c.posAdj} head was at. And {c} said it was fine."],
        ['b', "It wasn't fine."],
        ['a', "No. It wasn't."],
        ['b', "That's on {c}, not on you."],
      ] },
    ],
    close: [
      { when: { of: 'graft-stayed' }, turns: [], beat: "{b} lies back, and {a} lies down next to {b.obj}. Neither of them mentions {c} again." },
      { when: { of: 'graft-stayed' }, turns: [['b', "Come here."]], beat: "They stay up talking long after the lights go out." },
      { when: { of: 'graft-won' }, turns: [], beat: "They clink glasses. Across the garden, a couple of the others are pretending not to watch." },
      { when: { of: 'graft-won' }, turns: [['b', "Don't make me regret it."], ['a', "I won't."]] },
      { when: { of: 'graft-apart' }, turns: [], beat: "{b} puts an arm round {a}, and they sit there until somebody shouts for them to come to bed." },
      { when: { of: 'graft-apart' }, turns: [['a', "Thanks for coming to find me."], ['b', "Always."]] },
      { when: { of: 'doubt-recommit' }, turns: [], beat: "{b} takes {a.posAdj} hand under the covers, and for the first time all week it doesn't feel awkward." },
      { when: { of: 'doubt-recommit' }, turns: [['b', "Goodnight, then."], ['a', "Goodnight."]], beat: "Neither of them goes to sleep for a while." },
      { when: { of: 'doubt-ended' }, turns: [], beat: "{b} gets up, makes a fresh tea, and puts it in front of {a} without saying anything." },
      { when: { of: 'doubt-ended' }, turns: [['a', "I'm going to be fine."], ['b', "I know you are. You can be not fine tonight, though."]] },
    ],
  },
});

// `sec`: what {c} did (events.js secrets: pull · kiss · promise · bed · said);
// {x} is who with (`hasWith`).
export const SECRET_KEPT = build('secret-kept', {
  tiered: false,
  facts: (state, ev) => ({ sec: ev.extra?.sec || null, hasWith: !!ev.extra?.with }),
  slots: (state, ev) => (ev.extra?.with ? { x: ev.extra.with } : {}),
  leads: ['sec'],
  plans: { featured: ['open', 'what', 'say'], short: ['what', 'say'] },
  moves: {
    open: [
      { stage: "After the fire pit, everyone else has gone to bed. {a} is still sitting on the daybeds on {a.posAdj} own.", turns: [] },
      { stage: "{a} is the last one in the kitchen, wiping down a counter that is already clean.", turns: [] },
      { stage: "{a} sits on the edge of the pool with {a.posAdj} feet in the water, looking up at the bedroom window.", turns: [] },
    ],
    // What {a} saw, said plainly, before the agonising.
    what: [
      { when: { sec: 'pull', hasWith: true }, turns: [['a', "I saw {c} go off with {x} for a chat. Not a quick one. A long one, sitting close, and {c} made sure {b} wasn't around for it."]] },
      { when: { sec: 'pull', hasWith: true }, turns: [['a', "{c} took {x} down the end of the garden while {b} was getting ready. I was there. I saw how they were sitting."]] },
      { when: { sec: 'kiss', hasWith: true }, turns: [['a', "I saw {c} kiss {x}. Not a peck. A real kiss, when they thought everyone was inside."]] },
      { when: { sec: 'kiss', hasWith: true }, turns: [['a', "{c} kissed {x}. I was right there. I don't think either of them saw me."]] },
      { when: { sec: 'bed', hasWith: true }, turns: [['a', "{c} and {x} ended up in the same bed the other night, and they were whispering for about an hour. I was in the next bed. I heard all of it."]] },
      { when: { sec: 'promise', hasWith: true }, turns: [['a', "I heard {c} make {x} a promise: if things went wrong with {b}, they'd be next. Like {b} was a placeholder."]] },
      { when: { sec: 'said' }, turns: [['a', "I heard what {c} said behind {b}'s back. Word for word. And it wasn't nice."]] },
      { when: { sec: 'said' }, turns: [['a', "{c} said something about {b} in the dressing room that I can't stop thinking about. {b} thinks they're solid. {c} doesn't talk like they are."]] },
      { turns: [['a', "I know something about {c} that {b} doesn't. Something {b} would want to know."]] },
    ],
    say: [
      { turns: [
        ['a', "I still haven't told {b}. I've had about ten chances. I keep thinking, if I say it, I'm the one who wrecks everything for {b}. If I don't, and {b} finds out I knew, I'm the one who lied."],
        ['a', "I watched {b} sit at the fire pit tonight like nothing was wrong. And {c} was sitting right there."],
      ] },
      { turns: [
        ['a', "Everyone keeps saying tell {b}, tell {b}. It's easy for them to say. They're not the ones who have to look at {b}'s face when it lands."],
        ['a', "But I can't sit on it much longer. Not with {c} acting like nothing happened."],
      ] },
      { turns: [
        ['a', "I nearly said it tonight. I had the words in my mouth. Then {b} laughed at something and I just couldn't."],
        ['a', "Tomorrow. It has to be tomorrow."],
      ] },
      { when: { feels: 'strong' }, turns: [
        ['a', "The thing is, I care about {b}. That's why it's so hard. If I didn't care, I'd have said it on day one and not thought twice."],
        ['a', "{c} knows I know. I can see it in how {c} looks at me."],
      ] },
    ],
  },
});

// ── the hook: the last thing before the credits (pm/stretch.js hookFor) ──
//   text-recouple / text-vote / text-bombshell  [a, b, c]  {a} reads a text about
//       tomorrow; {b} and {c} are the stretch's main story, and the camera finds them
//   story-graft   [a, b, c]  {a} in bed next to {b}, awake, with {c} across the room
//   story-doubt   [a, b]     {a} awake next to {b}, who is asleep
//   story-secret  [a, b, c]  {a} knows what {c} did, and watches {b} go to sleep
//   story-close   [a, b]     {a} and {b}, the happy story, whispering in the dark
export const HOOK = build('hook', {
  tiered: false,
  plans: { featured: ['set', 'turn'], short: ['set', 'turn'] },
  moves: {
    set: [
      { when: { of: ['text-recouple', 'text-vote', 'text-bombshell'] }, stage: "Everyone is getting ready for bed when {a}'s phone goes off.", turns: [['a', "I've got a text!"]] },
      { when: { of: ['text-recouple', 'text-vote', 'text-bombshell'] }, stage: "The lights are about to go out when a phone beeps on the dressing table.", turns: [['a', "Everyone, come here. I've got a text."]] },
      { when: { of: ['text-recouple', 'text-vote', 'text-bombshell'] }, stage: "Half the villa is already in bed. {a} sits up with {a.posAdj} phone lit up.", turns: [['a', "Nobody go to sleep. I've got a text."]] },
      { when: { of: 'story-graft' }, stage: "The bedroom, after the lights go out. {a} is lying next to {b}, wide awake.", turns: [] },
      { when: { of: 'story-graft' }, stage: "Everyone has gone quiet in the bedroom. {a} is lying very still next to {b}, eyes open.", turns: [] },
      { when: { of: 'story-doubt' }, stage: "The bedroom, late. {b} keeps drifting off. {a} is still staring at the ceiling.", turns: [] },
      { when: { of: 'story-doubt' }, stage: "{a} lies on {a.posAdj} side of the bed, as far from {b} as the bed allows.", turns: [] },
      { when: { of: 'story-secret' }, stage: "Lights out. {a} watches {b} climb into bed, laughing at something {c} just said.", turns: [] },
      { when: { of: 'story-secret' }, stage: "The bedroom is dark. Two beds along, {b} and {c} are whispering, and {a} can hear every word.", turns: [] },
      { when: { of: 'story-close' }, stage: "The bedroom, lights out. {a} and {b} are whispering under the covers.", turns: [] },
      { when: { of: 'couple-night' }, stage: "The bedroom, lights out. {a} and {b} are lying on their backs, looking at the ceiling.", turns: [] },
      { when: { of: 'couple-night' }, stage: "Everyone else is asleep. {a} and {b} are still whispering.", turns: [] },
    ],
    turn: [
      { when: { of: 'text-recouple' }, turns: [['a', "\"Islanders, tomorrow night there will be a recoupling. #ChooseWisely\""]], beat: "Nobody says anything. Across the room, {b} looks straight at {c}." },
      { when: { of: 'text-recouple' }, turns: [['a', "\"Islanders, there will be a recoupling tomorrow night. Anyone left single could be dumped. #SleepWell\""]], beat: "{b} and {c} both look at the floor at exactly the same moment." },
      { when: { of: 'text-recouple' }, turns: [['a', "\"Islanders, tomorrow night there will be a recoupling.\""], ['a', "That's it. That's all it says."]], beat: "Somebody laughs, nervously. {b} doesn't. {b} is looking at {c}." },
      { when: { of: 'text-recouple' }, turns: [['a', "\"Islanders, get some sleep. Tomorrow, there's a recoupling. #ItsAllChanging\""]], beat: "{c} rolls over to face the wall. {b} lies there with {b.posAdj} eyes open." },
      { when: { of: 'text-vote' }, turns: [['a', "\"Islanders, the public have been voting for their favourite couples. Tomorrow you'll find out who's at risk. #TheyveBeenWatching\""]], beat: "{b} glances at {c}. {c} is already looking." },
      { when: { of: 'text-vote' }, turns: [['a', "\"Islanders, the public vote closes tonight. #EverythingCounts\""]], beat: "Everyone goes quiet. {b} pulls the covers up and turns away from {c}." },
      { when: { of: 'text-bombshell' }, turns: [['a', "\"Islanders, get ready. Tomorrow, somebody new walks into the villa. #FreshFace\""]], beat: "The room goes off. In the middle of it, {b} is very quiet, and {c} notices." },
      { when: { of: 'text-bombshell' }, turns: [['a', "\"Islanders, tomorrow you'll be getting a new arrival. #WhoCouldItBe\""]], beat: "{c} laughs along with everyone. {b} doesn't." },
      { when: { of: 'text-bombshell' }, turns: [['a', "\"Islanders, somebody is on their way. Sleep tight. #NewArrival\""]], beat: "Everyone starts guessing at once. {b} lies back down without a word, and {c} watches {b.obj} do it." },
      { when: { of: 'text-vote' }, turns: [['a', "\"Islanders, tomorrow the public decide who's at risk. #MakeItCount\""]], beat: "{b} reaches for {c}'s hand in the dark, then thinks better of it." },
      { when: { of: 'story-graft' }, turns: [], beat: "Across the room, {c} is awake too. For a second they look at each other in the dark. Then {a} turns over to face {b}." },
      { when: { of: 'story-graft' }, turns: [['b', "Are you awake?"], ['a', "No."]], beat: "{a} lies there with {a.posAdj} eyes open, looking at the bed where {c} is sleeping." },
      { when: { of: 'story-graft' }, turns: [['a', "Goodnight."], ['b', "Goodnight."]], beat: "{a} closes {a.posAdj} eyes. On the other side of the room, {c} doesn't." },
      { when: { of: 'story-doubt' }, turns: [['b', "Are you okay?"], ['a', "Yeah. Go back to sleep."]], beat: "{a} doesn't sleep for a long time." },
      { when: { of: 'story-doubt' }, turns: [], beat: "{b} reaches over in {b.posAdj} sleep. {a} moves away, just a little." },
      { when: { of: 'story-secret' }, turns: [['a', "Tomorrow. I have to tell {b} tomorrow."]], beat: "{a} says it into the pillow, so quietly nobody hears." },
      { when: { of: 'story-secret' }, turns: [], beat: "{c} catches {a} looking, and smiles. {a} doesn't smile back." },
      { when: { of: 'story-close' }, turns: [['b', "Can I tell you something?"], ['a', "Go on."], ['b', "Tomorrow. I'll tell you tomorrow."]], beat: "{a} lies there grinning at the dark for a long time." },
      { when: { of: 'couple-night' }, turns: [['a', "Do you think we'll still be here at the end?"], ['b', "I don't know."], ['a', "That's not very reassuring."], ['b', "It's honest."]], beat: "Neither of them says anything else, and neither of them sleeps for a while." },
      { when: { of: 'couple-night' }, turns: [['b', "Can I ask you something?"], ['a', "Go on."], ['b', "If we went home tomorrow. Would you be heartbroken, or would you be relieved?"]], beat: "{a} takes a long time to answer. Long enough that {b} turns over." },
      { when: { of: 'couple-night', feels: 'strong' }, turns: [['a', "Whatever happens tomorrow, I'm glad it was you."], ['b', "Don't say it like that. Like it's the end."]] },
      { when: { of: 'story-close' }, turns: [['a', "I think I'm falling for you."], ['b', "Say that again. Tomorrow. In daylight."]] },
    ],
  },
});

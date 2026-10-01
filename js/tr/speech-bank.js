// ══════════════════════════════════════════════════════════════════════
// tr/speech-bank.js — what people say, in four voices
// ══════════════════════════════════════════════════════════════════════
//
// The lines a castle script asks for by purpose (`{say:comfort}`,
// `{cam:grief}`), written per register. See js/tr/speech.js for the format
// and js/tr/castle/voice.js for who talks in which register:
//
//   blunt    hotheads, villains, challenge beasts, chaos agents — says it
//            straight, swears a little, no cushioning
//   sharp    masterminds, schemers, perceptive players — reads the room out
//            loud, notices, plans
//   warm     heroes, social butterflies, loyal soldiers, showmancers — leads
//            with feeling, looks after people
//   guarded  floaters, goats, underdogs, wildcards — short answers, hedges,
//            keeps things back
//
// `traitor` is used for the speaker's own lines when they are a Traitor, and
// only where the knowledge differs: a Traitor to camera knows what they are.
//
// WRITING RULES, from the user and from reading the real show:
//   - Talk like people on the show talk: short, plain, colloquial British
//     English. "Someone's lying and I'm going to find out who." Contractions,
//     fragments, the odd "honestly" or "to be fair". No speeches.
//   - Answer the question that was asked. No riddles, no epigrams, no line
//     you have to decode.
//   - A line says only what the speaker could know.
//   - {x} is the argument the script passes (usually a name); {you} is the
//     other person speaking in the scene.
export const BANK = {
  // ── LOSS ──────────────────────────────────────────────────────────────
  // Reacting to {x} being murdered, said to somebody else in the room.
  'grief-open': {
    blunt: [
      "I can't believe they took {x}.",
      "That's rubbish. {x} didn't deserve that.",
      "{x}. Seriously. Of all people.",
      "I'm gutted. I actually liked {x}.",
      "Whoever did that is sat at this table eating toast. That's what gets me.",
      "I'm not sad, I'm angry. There's a difference.",
    ],
    sharp: [
      "{x}. That wasn't random. Somebody decided {x} was a problem.",
      "Why {x}, though? That's what I want to know.",
      "They didn't pick {x} by accident.",
      "{x} was onto something. I'd put money on it.",
      "Somebody wanted {x} gone before the next Round Table.",
      "It's a message, taking {x}. I just don't know who it's for yet.",
    ],
    warm: [
      "I keep expecting {x} to walk through that door.",
      "{x} was the first person who was properly kind to me in here.",
      "I just want to give {x} a hug and I can't.",
      "It feels wrong eating breakfast without {x}.",
      "{x} would've hated all of us being this upset. That's the thing.",
      "I didn't even say goodnight to {x} properly.",
    ],
    guarded: [
      "Yeah. {x}. I don't really know what to say.",
      "I'm alright. It's just weird, that's all.",
      "I didn't know {x} that well. It still gets you.",
      "I'm not going to cry at breakfast. Not yet.",
      "It's horrible. Let's just leave it there.",
      "I'd rather not think about it, honestly.",
    ],
  },
  // Looking after {you}, who has taken it badly.
  comfort: {
    blunt: [
      "Sit down. Eat something. It won't help, but do it anyway.",
      "Don't let them see you like this. That's exactly what they want.",
      "Come on. We'll find out who did it.",
      "It's rubbish. You're allowed to think it's rubbish.",
      "Oi. Look at me. You're alright.",
    ],
    sharp: [
      "Take a minute. Then have a look at who looked relieved this morning.",
      "They'll be watching how you take it. Just so you know.",
      "You were close to {x}. That makes you interesting to them now. Be careful.",
      "Cry if you need to. Just keep your eyes open while you do it.",
      "I know. Let's talk later, when there's fewer people about.",
    ],
    warm: [
      "Come here. You don't have to say anything.",
      "It's okay. I've got you.",
      "I know. I miss {x} too.",
      "We'll get through today together, alright?",
      "Do you want a tea? I'm making you a tea.",
    ],
    guarded: [
      "I'm here, if you want. Or I can go. Whatever helps.",
      "You don't have to talk about it.",
      "I'll sit with you. I won't make you talk.",
      "It's alright. Take your time.",
      "Do you want me to get you anything?",
    ],
  },
  // Answering somebody who has just been kind.
  'grief-reply': {
    blunt: [
      "I'm fine. I'm not fine. Whatever.",
      "Thanks. I just want to know who did it.",
      "Don't be nice to me, I'll start crying again.",
      "Cheers. I'll be alright in a bit.",
    ],
    sharp: [
      "I'm okay. I'm just thinking.",
      "Thanks. Don't worry, I'm watching.",
      "Honestly, I'm more annoyed than sad.",
      "I'll be fine. I just need to work out why.",
    ],
    warm: [
      "Thank you. Honestly, thank you.",
      "I just miss {x}. Sorry.",
      "Can you just stay here a minute?",
      "You're so kind. I needed that.",
    ],
    guarded: [
      "I'm okay. Really.",
      "Thanks. I'd rather not talk about it.",
      "Yeah. Cheers.",
      "It's fine. I'm fine.",
    ],
  },
  // Asking who gained from {x} being murdered.
  'who-benefits': {
    blunt: [
      "Who wanted {x} gone? Someone did. Say it.",
      "Somebody in here is pleased about this, and I want to know who.",
      "Right. Who was {x} getting close to?",
      "Whoever's happiest this morning, that's where I'm looking.",
    ],
    sharp: [
      "Who does it help, {x} being gone? Start there.",
      "Think about who {x} was talking to yesterday.",
      "They picked {x} for a reason. Work out the reason and you've got them.",
      "{x} was going to say something at the table. I'm sure of it.",
    ],
    warm: [
      "I don't even want to think about it like that yet. But why {x}?",
      "{x} didn't have an enemy in here. So why {x}?",
      "Who would even want to hurt {x}? I don't get it.",
      "Maybe {x} was just too nice. Maybe that's it.",
    ],
    guarded: [
      "I don't know. Maybe {x} was just easy to take.",
      "Could've been anyone, honestly. That's what scares me.",
      "I'm not guessing. Not out loud.",
      "Does it matter why? {x}'s gone either way.",
    ],
    traitor: [
      "Honestly? I think {x} was just an easy one. No threat to anyone.",
      "Who knows. I'd stop trying to find a reason in it.",
      "Maybe it's random. Maybe they just want us all doing this.",
      "Don't overthink it. That's what they want us to do.",
    ],
  },
  // To camera, about {x} having been murdered.
  'cam-grief': {
    blunt: [
      "Whoever did that to {x}, I'm coming for you. That's it.",
      "I'm angry. I'm not sad, I'm angry.",
      "They've taken the wrong person, because now I'm properly in this.",
      "{x} was a good one. And someone at that table knew it was coming.",
    ],
    sharp: [
      "Losing {x} tells me something. {x} was onto someone, or someone thought so.",
      "I'll grieve later. Right now I want to know who chose {x}.",
      "Every murder is a clue. You just have to be cold enough to read it.",
      "Whoever it was, they were scared of {x}. I want to know why.",
    ],
    warm: [
      "{x} was one of the good ones. I'm doing this for {x} now.",
      "I just keep thinking {x} went to bed not knowing.",
      "It breaks my heart. It genuinely does.",
      "I miss {x} already. That's stupid, isn't it? It's been one day.",
    ],
    guarded: [
      "I didn't cry at breakfast. I'll probably cry in the shower.",
      "It's a game. It doesn't feel like one this morning.",
      "I'm keeping my head down. That's all I can do.",
      "I'm just glad it wasn't me. Is that awful?",
    ],
    traitor: [
      "I had to sit there looking shocked. The worst bit is, I did feel something.",
      "People were hugging me about {x}. I hugged them back. What else can you do?",
      "I liked {x}. That's the hardest part of doing this.",
      "Everyone's looking for a reaction at breakfast, so you give them one.",
      "It was the right call. Doesn't mean I enjoyed breakfast.",
    ],
  },
  // To camera, about how many of them are left ({x} is the number, spelled).
  'cam-count': {
    blunt: [
      "There's {x} of us now. That goes fast.",
      "{x} left. I'm still here. That's all I care about.",
      "Every morning there's one less chair. I'm not being that chair.",
    ],
    sharp: [
      "{x} of us. I know who I'd trust out of that, and it's not many.",
      "Do the maths. {x} people, and at least one of them isn't what they say.",
      "The smaller the room gets, the harder it is to hide in it.",
    ],
    warm: [
      "{x} of us. I remember when this table was full.",
      "I just count the people I'd actually miss. It's most of them.",
      "Every chair that goes is someone I'd made friends with.",
    ],
    guarded: [
      "{x} left. I try not to count, but you can't help it.",
      "I'm still here. I don't really know how.",
      "I just keep my head down and get to the next morning.",
    ],
    traitor: [
      "{x} of us. Every one of them I've had to look in the eye.",
      "The room's getting smaller. That's good for me and bad for me.",
      "Fewer people means fewer places to hide. I know that better than anyone.",
    ],
  },
  // ── SUSPICION ─────────────────────────────────────────────────────────
  // Raising a suspicion about {x} with somebody.
  suspect: {
    blunt: [
      "I don't trust {x}. I haven't from day one.",
      "It's {x}. I'd put money on it.",
      "Something's off with {x}, and I'm not letting it go.",
      "{x} is lying to someone. I just don't know who yet.",
      "Watch {x} at the table tonight. Just watch.",
    ],
    sharp: [
      "Have you noticed {x} never gives an opinion first?",
      "{x} agrees with whoever spoke last. Every single time.",
      "I've been watching {x}. The story keeps changing slightly.",
      "{x} is very good at not being noticed. That's what bothers me.",
      "Who's {x} actually close to? Because I can't work it out.",
    ],
    warm: [
      "I really like {x}. I just can't shake a feeling.",
      "I don't want it to be {x}. But something doesn't sit right.",
      "Can I say something and you won't think I'm awful? {x}.",
      "I feel bad even saying it, but I'm not sure about {x}.",
    ],
    guarded: [
      "I'm not saying it's {x}. I'm just saying I'd look.",
      "{x}, maybe? I don't know. Don't quote me.",
      "I've got a name. I'm not sure I want to say it yet. It's {x}.",
      "I keep coming back to {x}. That's all.",
    ],
    traitor: [
      "I don't want to point fingers, but has anyone looked at {x}?",
      "Honestly, {x} has been a bit strange. Just saying.",
      "If I had to pick someone, it'd be {x}. Something's not right.",
      "{x} was very quick to change the subject yesterday.",
    ],
  },
  // Agreeing with a suspicion about {x}.
  'agree-suspect': {
    blunt: [
      "Thank God, I thought it was just me.",
      "Yes. Same. I've said it all week.",
      "Right, so it's not just me then.",
    ],
    sharp: [
      "I've had the same thought. I didn't want to say it first.",
      "That lines up with something I saw yesterday.",
      "Okay. Two of us now. That's worth something.",
    ],
    warm: [
      "I hate that I agree with you.",
      "I thought I was being paranoid. Honestly.",
      "Oh, I'm so glad you said it and not me.",
    ],
    guarded: [
      "Maybe. Yeah. I've wondered.",
      "I wouldn't disagree.",
      "Yeah. I'd keep an eye.",
    ],
  },
  // Disagreeing with a suspicion about {x}.
  'doubt-suspect': {
    blunt: [
      "Nah. Not {x}. You're barking up the wrong tree.",
      "{x}? Come off it.",
      "You've got that completely wrong, mate.",
    ],
    sharp: [
      "I don't think so. What have you actually got?",
      "That's a feeling, not a reason. Give me a reason.",
      "If it's {x}, why would they have done what they did yesterday?",
    ],
    warm: [
      "I really don't think it's {x}. I really don't.",
      "Oh, no. Not {x}. {x}'s lovely.",
      "Please don't go after {x}. I'd put my neck on the line for {x}.",
    ],
    guarded: [
      "I don't know about that.",
      "I'm not sure. I wouldn't say that at the table.",
      "Maybe. I just don't see it.",
    ],
  },
  // Asked where somebody was, or what they were doing.
  'ask-where': {
    blunt: [
      "Where were you last night, then?",
      "Go on then. Walk me through your evening.",
      "Where did you go after dinner? Straight up?",
    ],
    sharp: [
      "What time did you go up last night? Roughly.",
      "Who did you see on the stairs?",
      "You were the last one in the hall, weren't you?",
    ],
    warm: [
      "How was your night? You went up early, didn't you?",
      "Did you sleep alright? I heard doors going all night.",
      "Where did you get to last night? I was looking for you.",
    ],
    guarded: [
      "Were you up late last night?",
      "Did you hear anything? In the night?",
      "You went up before me, didn't you?",
    ],
  },
  // Answering it cleanly.
  'answer-clean': {
    blunt: [
      "Bed. I was knackered. Ask anyone.",
      "Straight up after dinner. I was asleep by eleven.",
      "I was in my room. Where else would I be?",
    ],
    sharp: [
      "Up at about half ten. I shared a room, ask them.",
      "I left the hall with two other people, so you can check.",
      "Honestly? Bed. Boring answer, but it's the true one.",
    ],
    warm: [
      "I was chatting in the kitchen till late, then bed. Why, what's happened?",
      "I went up with everyone. I was shattered.",
      "Bed, babe. I was out like a light.",
    ],
    guarded: [
      "Just bed.",
      "I went up early. Didn't hear anything.",
      "I was asleep. Sorry.",
    ],
  },
  // Answering it badly — too much, or not enough.
  'answer-shaky': {
    blunt: [
      "Why are you asking me? Ask them.",
      "I don't have to account for every minute, do I?",
      "I was around. What does it matter?",
    ],
    sharp: [
      "I went up about ten. Maybe half ten. No, it was ten. Why?",
      "I was in the library, then the kitchen, then — look, I was around.",
      "I don't remember exactly. Does anyone, honestly?",
    ],
    warm: [
      "I was — I think I was in the kitchen? Or upstairs. Sorry, it's all a blur.",
      "Oh, God, I don't know, I was all over the place last night.",
      "I was with people. I just can't remember who.",
    ],
    guarded: [
      "Upstairs. I think.",
      "I don't really remember.",
      "Around. Why?",
    ],
  },
  // Accused, answering to the accuser's face.
  deny: {
    blunt: [
      "I'm Faithful. Hundred percent. Say it to my face if you think otherwise.",
      "You've got the wrong person, and you'll find that out.",
      "Me? Are you having a laugh?",
      "I'm not a Traitor. End of.",
    ],
    sharp: [
      "Fine. Give me one thing I've done. One.",
      "If I was a Traitor, would I really be this obvious?",
      "You're looking at me because I'm easy. That's not the same thing.",
      "I'm Faithful. And whoever put this in your head, look at them.",
    ],
    warm: [
      "I'm Faithful. I swear on my life I'm Faithful.",
      "That really hurts, honestly. I'd never do that to you.",
      "Hand on heart, I'm not a Traitor.",
      "I get why you'd think it. But it's not me. It's really not.",
    ],
    guarded: [
      "It's not me.",
      "I'm Faithful. I don't know what else to say.",
      "I can't prove it. I just know I'm not.",
      "Think what you want. It isn't me.",
    ],
    traitor: [
      "I'm Faithful. One hundred percent.",
      "Honestly, I'd tell you. I'm not a Traitor.",
      "If you want to waste your vote on me, go ahead. You'll see.",
      "I'm Faithful, and I'll say it at the table if I have to.",
    ],
  },
  // ── TRUST ────────────────────────────────────────────────────────────
  // Checking you're still on the same side.
  'check-in': {
    blunt: [
      "We're still good, yeah?",
      "You and me, we're solid. Right?",
      "Straight question. Are you with me or not?",
    ],
    sharp: [
      "I need to know where your head's at before tonight.",
      "Are we still voting together, or has something changed?",
      "Has anyone been in your ear about me?",
    ],
    warm: [
      "Are we okay? I just need to hear it.",
      "You'd tell me if something had changed, wouldn't you?",
      "I trust you. You know that, right?",
    ],
    guarded: [
      "We're alright, aren't we?",
      "Nothing's changed, has it?",
      "Just checking. You and me.",
    ],
  },
  // A straight yes.
  'check-in-yes': {
    blunt: [
      "Course we are. Don't be daft.",
      "Solid. Always.",
      "Yes. Stop asking.",
    ],
    sharp: [
      "Nothing's changed. If it does, you'll hear it from me first.",
      "We're fine. Watch who's asking you that question, though.",
      "Yes. Same plan as before.",
    ],
    warm: [
      "Of course! Come here.",
      "Always. You're my person in here.",
      "Yes. I promise.",
    ],
    guarded: [
      "Yeah. We're fine.",
      "Yeah, course.",
      "Nothing's changed.",
    ],
  },
  // A yes that is not quite a yes.
  'check-in-hedge': {
    blunt: [
      "Yeah. Probably. Depends on tonight.",
      "Look, I'm not making promises in here. To anyone.",
      "We're fine. Mostly.",
    ],
    sharp: [
      "We're good. I'm just keeping my options open, like you should.",
      "Of course. Why, what have you heard?",
      "As long as nothing changes, yes.",
    ],
    warm: [
      "Of course! I mean — yeah. Why?",
      "Yeah, we're fine. I've just got a lot going on in my head.",
      "I think so? Are we not?",
    ],
    guarded: [
      "Yeah. I think so.",
      "Sure.",
      "Mm. Yeah.",
    ],
  },
};

// The confessionals the solo scenes close on, merged in. See the file.
import { SOLO_BANK } from './speech-bank-solo.js';
Object.assign(BANK, SOLO_BANK);

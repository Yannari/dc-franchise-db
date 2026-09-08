// ══════════════════════════════════════════════════════════════════════
// dr/data/untucked-events.js — backstage, while the judges argue
// ══════════════════════════════════════════════════════════════════════
//
// ── WHAT UNTUCKED ACTUALLY IS ─────────────────────────────────────────
//
// Checked rather than assumed. It is the queens' conversations backstage
// DURING the judges' post-critique deliberation — so it happens in the gap
// between being critiqued and being told the result, and nobody in the room
// knows yet who is going home. That timing is the whole engine of it: every
// scene here is people who have just been judged and do not yet know the
// verdict. The show's own description is "the backstage bitchiness, the
// catfights, the struggles, the tears, and the secrets".
//
// It follows that the triggers are the critiques. A queen who was told she was
// safe is bored and stung; a queen who was thrown under the bus on the main
// stage has been waiting the whole walk back to say something; the two who are
// about to lip sync are sitting in the same room as each other.
//
// ── THE SHAPE ─────────────────────────────────────────────────────────
//
// A POOL, like the werk room and unlike the main stage: scenes are drawn, most
// do not happen. Same schema as js/dr/data/werk-events.js, with one addition —
// `phase`, because Untucked has an arc inside it: they come off the stage, it
// escalates, and then they are called back.
//
//   phase   'arrival' — straight off the stage, still in the look
//           'middle'  — the long wait, where the fights happen
//           'late'    — before they are called back
//
// ── FOR THE WRITER ────────────────────────────────────────────────────
//
// Fill `lines`. Change nothing else. Same rules as the werk room, all enforced
// by tests: {a} and {b} placeholders and never a name, no {b} in a solo event,
// no real people, this show's vocabulary only, never quote a stat by number,
// four genuinely different variants each, prose rather than captions.
//
// THE REGISTER IS THE WERK ROOM'S, TURNED UP. Same people, no cameras they are
// pretending not to see, a drink in hand, and a verdict coming. Sharper, more
// honest, more likely to go too far. This is where somebody says the thing they
// have been holding all week.
import { dragOf } from '../queen.js';

export const UNTUCKED_PHASES = ['arrival', 'middle', 'late'];

const ev = o => ({ cast: 'solo', weight: 1, arcs: [], lines: [], phase: 'middle', ...o });

const st = (p, k) => {
  const n = Number(p?.stats?.[k]);
  return Number.isFinite(n) ? n : 5;
};

export const UNTUCKED_EVENTS = [
  // ══ ARRIVAL: OFF THE STAGE, INTO THE ROOM ════════════════════════════
  ev({
    id: 'first-through-the-door', phase: 'arrival', cast: 'solo', weight: 2,
    note: 'She is first into the room and says the first thing, which sets the temperature for everybody after her.',
    when: f => true, effects: { pop: { a: 1 } },
    lines: [
      "{a} gets through the door first and does not wait for anybody else to be in the room before she starts. \"Well,\" she says, to nobody, to the ceiling, to the whole night. It is not clear yet whether she is about to cry or about to start something. The others file in behind her and find out at the same time she does.",
      "The door goes and it is {a}, still in the full look, walking like the shoes have personally wronged her. She drops onto the couch sideways, exhales for about four seconds, and says \"that was a lot.\" Everybody who comes in after her agrees before they have even sat down.",
      "{a} is in the room before the rest of them and she has already poured something. She holds it up as the others come in, not quite a toast, more of an acknowledgement that they all just survived the same thing. Somebody laughs. Somebody does not.",
      "She does not say anything at all, which from {a} is the loudest possible entrance. She sits, arranges the skirt, and looks at the door with an expression that says she has some things to get to and is waiting for the audience to assemble.",
    ],
  }),
  ev({
    id: 'still-shaking', phase: 'arrival', cast: 'solo', weight: 2,
    note: 'The adrenaline has not gone anywhere and she cannot sit still.',
    when: f => st(f.a, 'temperament') <= 6, effects: { pop: { a: 1 } },
    lines: [
      "{a} is pacing. Not dramatically — just back and forth in front of the couch, in the heels, still in the look, running a hand over the back of her neck like she is trying to press the evening out of it. She has not sat down. She is not going to sit down for a while.",
      "The adrenaline is still in {a}'s hands. She picks up a glass and puts it down. She adjusts the wig. She starts a sentence and stops it. The queen next to her says \"breathe\" and {a} says \"I am breathing\" in a voice that suggests she has recently stopped.",
      "{a} laughs too loud at something that is not funny and everybody in the room hears the nerves underneath it. She crosses and uncrosses her legs three times. She checks the mirror. She checks the mirror again. Whatever happened on that stage is still happening inside her body.",
      "She is sitting but she is not sitting still. {a} is tapping the arm of the couch, bouncing one knee, and scanning the door like the results are going to walk through it personally. The other queens have settled. {a} has not. {a} may not settle for the rest of the night.",
    ],
  }),
  ev({
    id: 'pour-one-out', phase: 'arrival', cast: 'pair', weight: 2,
    note: 'One of them makes drinks for both and it is the first kind thing that has happened in an hour.',
    when: f => f.bond >= 0, effects: { bond: 1, pop: { a: 1 } },
    lines: [
      "{a} goes to the bar, makes two, and puts one in {b}'s hand without asking what she wants. {b} looks at it, looks at {a}, and says \"thank you\" in a voice that means more than the drink. It is the first thing that has not been a critique in about an hour.",
      "\"You need one of these.\" {a} pours for {b} before {b} has even found a seat. It is a small thing — ice, a pour, passing it across — but it is the first gentle thing anyone has done since they left the stage, and {b} takes it like a person who needed exactly this.",
      "{a} makes a drink for herself and then makes a second one and carries them both across the room. {b} takes it with both hands and says nothing for a second, and the nothing says everything. They clink. They drink. The night gets slightly easier from here.",
      "\"Sit down, I will get it.\" {a} is already at the bar before {b} can argue. She comes back with two glasses and a look that says they are in this together, at least for the next twenty minutes. {b} sips. {a} sits. The room is still sharp but this corner of it is not.",
    ],
  }),
  ev({
    id: 'out-of-the-shoes', phase: 'arrival', cast: 'pair', weight: 2,
    note: 'The look starts coming apart the second they sit down, and the conversation gets more honest with it.',
    when: f => true, effects: { bond: 0.5 },
    lines: [
      "The shoes come off first. {a} kicks them under the couch and {b} does the same and the conversation changes the second the heels are off — looser, realer, like the stage version of them is something they are physically stepping out of. {b} unclips something at the back and says \"that has been stabbing me since the walk.\"",
      "{b} pulls the wig off and sets it on the arm of the couch like she is putting down a weapon. {a} unpins something at the shoulder. The looks start coming apart and the guards come down with them, and what was a poised pair of queens on the stage three minutes ago is two tired people on a couch.",
      "{a} peels off the gloves and {b} unzips the back and they do it like they are shedding the stage, which they are. The more of the look comes off the more honest the conversation gets. By the time {a} is sitting there in the corset and the stockings she is saying things the runway version of her would never say.",
      "\"Get this off me.\" {b} turns so {a} can unzip the back of the dress and {a} does it without being asked twice. The look was beautiful on the stage. Off the stage it is a costume, and costumes come off, and when they come off the people inside them start talking like people instead of queens.",
    ],
  }),
  ev({
    id: 'what-did-she-mean', phase: 'arrival', cast: 'pair', weight: 2,
    note: 'They replay a specific thing a judge said and try to work out how bad it was.',
    when: f => true, effects: { bond: 0.5, pop: { a: 1 } },
    lines: [
      "\"What did she mean by 'it reads costume'?\" {a} asks, and {b} does not know, and they spend the next five minutes trying to decode a single sentence from a judge, turning it over and over like a coin they cannot read. The more they talk about it the less they agree on whether it was bad or very bad.",
      "{a} replays the judge's exact words and {b} says \"that is not what she said\" and {a} says \"that is exactly what she said\" and they go back and forth on the phrasing like it matters — and it does matter, because the difference between \"it did not work for me\" and \"it is not working\" is the difference between a bad night and a pattern.",
      "\"She said interesting,\" {a} says. \"What does interesting mean?\" {b} considers it. \"Interesting means they did not hate it but they are not going to save you with it.\" {a} looks at the ceiling. She knew that already. She was hoping {b} would say something different.",
      "{b} is trying to remember the exact critique and keeps getting the middle part wrong. {a} corrects her. They argue about the word \"elevated\" for about three minutes — did the judge mean she needed to elevate the concept or that she had elevated it — and by the end neither of them is sure, which is the worst possible outcome.",
    ],
  }),

  // ══ THE CRITIQUES, RELITIGATED ═══════════════════════════════════════
  ev({
    id: 'i-disagree', phase: 'middle', cast: 'solo', weight: 2,
    note: 'She does not accept the critique and says so, to a room that mostly agrees with the judges.',
    arcs: ['villain', 'frontrunner'], when: f => f.lastCall === 'LOW' || f.lastCall === 'BTM',
    effects: { pop: { a: -1 }, state: 'defiant' },
    lines: [
      "\"I do not agree.\" {a} says it to the room, not quietly. She lays out her case — what she was going for, why the judges did not see it, why that is their problem and not hers. The room listens. Most of them think the judges were right. {a} does not care what most of them think.",
      "{a} shakes her head through somebody else's recap of the critiques and finally says \"that is not what happened up there.\" She describes a completely different version of the evening, one where her performance was strong and the judges missed the reference, and she delivers it with the confidence of someone who either truly believes it or has decided to.",
      "\"They were wrong.\" {a} says it like a fact, not a feeling. She walks through the critique point by point and dismantles each one, and the room watches, and some of them are impressed and some of them think she is delusional, and {a} does not look like she is interested in finding out which.",
      "The room is being sympathetic and {a} does not want sympathy. \"I do not need you to feel bad for me, I need you to tell me I am right,\" she says, and nobody says she is right, and {a} takes that silence as proof that the judges got to them too.",
    ],
  }),
  ev({
    id: 'she-was-right', phase: 'middle', cast: 'solo', weight: 2,
    note: 'She agrees with the judges about herself, out loud, which nobody expects.',
    arcs: ['underdog', 'hero'], when: f => f.lastCall === 'LOW' || f.lastCall === 'BTM',
    effects: { pop: { a: 2 }, state: 'accepted' },
    lines: [
      "\"She was right,\" {a} says, meaning the judge, and the room does a double take because nobody expected her to say that. {a} lays out what she got wrong — specifically, without flinching — and the honesty of it silences the room. Somebody starts to comfort her and she waves it off. She does not need comfort. She needs to be better.",
      "{a} sits on the couch and says \"I earned that critique\" with the flat calm of someone who has already processed the whole thing on the walk backstage. The room waits for the but. There is no but. She agrees with the judges, openly, in front of everyone, and the maturity of it lands harder than any read.",
      "\"They saw exactly what I did,\" {a} says. \"I cannot be upset about them calling what I gave them.\" It is the least dramatic thing anyone has said all night and it is the most powerful, because a queen who can own a bad night in front of the room is a queen nobody forgets.",
      "Somebody tells {a} the judges were too harsh and {a} shakes her head. \"No. I would have said the same thing.\" She goes through her performance, names the exact moment it went wrong, and takes the critique on without deflecting any of it. The room goes quiet, not because it is sad but because it is watching someone grow up in real time.",
    ],
  }),
  ev({
    id: 'threw-me-under', phase: 'middle', cast: 'pair', weight: 3,
    note: '{a} confronts {b} for naming her on the main stage. This is the single most reliable Untucked fight.',
    arcs: ['relationship', 'villain'], when: f => f.namedOnStage,
    effects: { bond: -3, pop: { a: 1, b: -2 }, state: 'confronted' },
    lines: [
      "{a} does not sit down. \"You said my name up there.\" {b} starts to explain that it was not like that, and {a} lets her get about six words in before saying \"you said my name, in front of them, when they asked.\" The room has gone very quiet. Nobody is looking at their phone because nobody has one.",
      "It takes {a} four minutes to get to it and everybody in the room can feel it coming the entire time. When it lands it is not a shout. It is \"I would never have done that to you,\" said quite calmly, which is worse, and {b} does not have an answer that survives being said out loud.",
      "\"Can I ask you something?\" says {a}, in the voice that means it is not a question. {b} says sure. {a} asks her to repeat what she said on the stage. {b} repeats a much gentler version of it. {a} says \"that is not what you said,\" and the temperature in the room drops about ten degrees.",
      "{b} tries to get ahead of it — \"before you say anything\" — and {a} says \"no, you go ahead, finish it,\" and folds her arms. Whatever {b} had prepared on the walk backstage does not survive contact with {a} sitting there waiting for it.",
    ],
  }),
  ev({
    id: 'defends-herself', phase: 'middle', cast: 'pair', weight: 2,
    note: '{b} explains why she said it, and it is not a bad reason, which makes it worse.',
    when: f => f.namedOnStage, effects: { bond: 1, pop: { b: 1 } },
    lines: [
      "\"They asked me who should go home and I was not going to lie.\" {b} says it without apology, and the room watches {a} process it, and the thing is — {b} has a point. The judges ask who should go home tonight and why. Somebody has to answer. {b} answered honestly. {a} does not have to like it, but she cannot call it unfair.",
      "{b} does not back down. \"What was I supposed to do, say nobody?\" She walks {a} through the moment — the question, the spotlight, the three seconds she had to decide — and by the end of it the defence is better than the attack, which {a} did not expect and does not enjoy.",
      "\"I said what I saw,\" {b} says, and then she says what she saw, specifically, in detail, about {a}'s performance, and it is not mean but it is accurate, and accuracy is harder to fight than cruelty. {a} sits with it. The room sits with it. {b} does not apologise because she has nothing to apologise for.",
      "{b} explains her reasoning and it is calm and specific and that is the worst part — {a} wanted it to be malicious because malicious is easy to dismiss. Instead it is a queen who was put on the spot and gave a thoughtful answer, and the answer was {a}'s name, and {a} cannot argue with the thought behind it.",
    ],
  }),
  ev({
    id: 'the-room-takes-sides', phase: 'middle', cast: 'pair', weight: 2,
    note: 'A third queen weighs in on somebody else\'s argument and now it is her argument too.',
    arcs: ['narrator'], when: f => f.bond <= 2 && f.tension,
    effects: { bond: -1.5, pop: { a: -1 } },
    lines: [
      "{a} has been watching the argument for about three minutes and decides she has an opinion. She delivers it to both of them at once, equally, like a judge who was not asked. {b} turns on her. Now it is {a}'s fight too, and she was not prepared for that, and the room has three people talking at once.",
      "\"Can I say something?\" {a} says, and says it before anyone gives her permission. She takes {b}'s side, loudly, and the queen on the other side of the argument turns and says \"nobody asked you\" with enough venom that {a} flinches. She is in it now. She chose to be in it.",
      "{a} weighs in from the couch and the whole temperature shifts, because what was a fight between two is now a fight that has witnesses who are also participants. {b} says \"thank you\" and the other queen says \"stay out of it\" and {a} does not stay out of it.",
      "It is not {a}'s argument. It becomes {a}'s argument the moment she says \"well actually\" from the other end of the couch. {b} looks relieved to have backup. The queen she was arguing with looks furious to be outnumbered. {a} has taken a side and now she has to live on it.",
    ],
  }),
  ev({
    id: 'safe-and-invisible', phase: 'middle', cast: 'solo', weight: 2,
    note: 'She was called safe again and is realising that safe is not a compliment.',
    arcs: ['filler', 'weakness'], when: f => f.lastCall === 'SAFE',
    effects: { pop: { a: -1 }, state: 'restless' },
    lines: [
      "\"Safe,\" {a} says, like she is tasting the word and it has gone off. She was called safe on the main stage and sent to the back before the critiques even started, which means the judges had nothing to say to her, which means she is disappearing, which means safe is the most dangerous thing she could be.",
      "{a} watches the queens who were critiqued rehash their notes and realises she has nothing to rehash. She was safe. She was told to leave the stage. The judges did not have a single opinion about her and that is starting to feel less like survival and more like erasure.",
      "Somebody asks {a} how she feels about being safe and {a} says \"fine\" in a voice that means the opposite of fine. She is sitting backstage while the queens who were in the bottom get all the attention, including the sympathy, and she cannot even be upset about it because she was not good enough to be upset about.",
      "\"I would rather they told me I was terrible,\" {a} says, and she means it. At least terrible is a reaction. At least terrible means they looked at her. Safe means they did not look at her, and a queen who nobody looks at might as well not be on the stage at all.",
    ],
  }),
  ev({
    id: 'safe-and-relieved', phase: 'middle', cast: 'solo', weight: 2,
    note: 'She was safe and is perfectly happy about it, which some of the room finds infuriating.',
    when: f => f.lastCall === 'SAFE', effects: { pop: { a: 1 } },
    lines: [
      "\"Safe is fine with me,\" {a} says, and she means it completely, and the room cannot tell if that is healthy or if it is the attitude that keeps her in the middle. She pours a drink, puts her feet up, and watches the drama from the best seat in the room. She was not critiqued. She was not in danger. She is having a lovely evening.",
      "{a} is sitting on the couch with her shoes off, a drink in hand, watching two queens argue about who deserved the bottom, and she looks like a person watching a show about somebody else's problems. She was safe. She is aware that safe is not exciting. She is also aware that exciting tonight meant crying on the main stage.",
      "The room is full of queens processing bad news and {a} is not one of them. She was safe, she knows she was safe, and she has made peace with safe the way a person makes peace with a Tuesday — it is not memorable but it is also not a disaster. She sips her drink and lets the drama happen around her.",
      "\"I will take safe,\" {a} says, to a room that is mostly on fire. She means it. Some weeks you fight for the win and some weeks you survive, and tonight {a} survived, and she is not going to apologise for being comfortable about it. The queens in the bottom are looking at her like she is from a different show.",
    ],
  }),

  // ══ THE WINNER, AND HOW THAT LANDS ═══════════════════════════════════
  ev({
    id: 'congratulations-meant', phase: 'arrival', cast: 'pair', weight: 2,
    note: '{b} congratulates {a} on a strong night and absolutely means it.',
    arcs: ['hero'], when: f => (f.callA === 'WIN' || f.callA === 'HIGH') && f.bond >= 1,
    effects: { bond: 1.5, pop: { b: 1 } },
    lines: [
      "{b} hugs {a} before {a} has even sat down and says \"you deserved that\" into her shoulder, and she means it so completely that {a} starts crying, which she was not going to do. The hug lasts a long time. When they pull apart {b} says \"condragulations, bitch\" and they both laugh.",
      "\"I am so proud of you.\" {b} says it looking {a} in the eye and {a} can tell she means it because {b} is not performing — she is just happy, for {a}, genuinely, which is the rarest thing in a room full of queens who all want the same thing.",
      "{b} brings {a} a drink and says \"you ate that\" with enough conviction that {a} believes it. They sit together and {b} asks what the judges said, detail by detail, and listens like she is happy to hear the good news because the good news belongs to someone she cares about.",
      "{b} catches {a} backstage and says \"that was yours from the second you walked out\" and {a} says \"you think?\" and {b} says \"girl, nobody else was close\" and the warmth between them is the kind that competition usually burns off but has not, not yet, not between these two.",
    ],
  }),
  ev({
    id: 'congratulations-not-meant', phase: 'arrival', cast: 'pair', weight: 2,
    note: 'Same words, said with a smile, and everybody hears what is underneath.',
    arcs: ['villain'], when: f => (f.callA === 'WIN' || f.callA === 'HIGH') && f.bond <= 0,
    effects: { bond: -1, pop: { b: -1 } },
    lines: [
      "\"Good for you,\" {b} says, with a smile so perfect it could be in a commercial, and every queen in the room hears the knife underneath it. {a} says thank you. She heard it too. They both know that what {b} said and what {b} meant are two completely different sentences.",
      "{b} congratulates {a} and does it in front of the whole room, which makes it impossible to be anything but gracious about it, which is the point. The hug lasts exactly the right amount of time and not a second longer. {a} accepts it the way you accept a gift you know is not really a gift.",
      "\"Condragulations,\" {b} says, and the word lands with the exact inflection of someone who has practised saying it without venom and has almost succeeded. Almost. {a} smiles and says thank you and the room hears two queens being polite at each other, which is different from two queens being kind to each other.",
      "{b} raises a glass to {a} and says \"you killed it\" with a brightness that has effort in it, and the effort is the part that tells the room everything. {a} clinks. She knows. {b} knows she knows. They drink to a win that one of them is celebrating and the other one is surviving.",
    ],
  }),
  ev({
    id: 'winning-too-much', phase: 'middle', cast: 'pair', weight: 2,
    note: 'Somebody says out loud that {a} keeps winning, and it is not admiration.',
    arcs: ['frontrunner'], when: f => f.winsA >= 2,
    effects: { bond: -1, pop: { a: 1 } },
    lines: [
      "\"How many is that now?\" {b} asks, and counts on her fingers, and the counting is the read. {a} does not answer the question because the answer would make it worse. The room is watching a queen get told she is winning too much, which is a complaint that only makes sense inside these walls.",
      "{b} says \"must be nice\" in the space between sips and the sentence sits there for the rest of the night. {a} says nothing because there is nothing to say. She keeps winning. The room keeps noticing. The noticing has an edge now that it did not have two weeks ago.",
      "\"The judges love you,\" {b} says, and it is phrased as an observation and delivered as an accusation. {a} tries to deflect — \"I just showed up\" — and {b} says \"yeah, you showed up every week\" with enough weight that the compliment folds back on itself.",
      "{b} makes a joke about {a} getting a permanent spot on the judges' panel and two queens laugh and {a} laughs too, but the joke is a door and behind the door is resentment, and everybody in the room can hear the hinges. {a} stops laughing first.",
    ],
  }),
  ev({
    id: 'gracious-in-front', phase: 'middle', cast: 'solo', weight: 1,
    note: 'She had a great night and deliberately does not make the room about it.',
    arcs: ['hero', 'frontrunner'], when: f => f.lastCall === 'WIN' || f.lastCall === 'HIGH',
    effects: { pop: { a: 2 } },
    lines: [
      "{a} had a great night and is not making the room about it. She congratulates someone else first. She asks a queen in the bottom how she is feeling. She pours a drink for the table instead of toasting herself. The room notices that she is not doing the thing winners usually do, and it lands better than any victory speech.",
      "She could be gloating. She is not gloating. {a} is sitting in the corner nursing a drink, letting the conversation happen around other people, and when somebody brings up her win she says \"I got lucky this week\" with enough sincerity that the room believes it, or at least decides to.",
      "{a} changes the subject every time her name comes up in connection with the win. She steers the conversation toward the queens who need the room's attention more than she does, and the restraint of it — the discipline of not being loud about the best night of her run — is the most impressive thing she does all evening.",
      "The win is hers and she wears it lightly. {a} does not mention the judges, does not mention the critique, does not bring it up once. She asks the room about their nights instead, and the generosity of that — on a night where she has every right to be the loudest person here — makes the room like her more, not less.",
    ],
  }),

  // ══ THE TWO WHO ARE ABOUT TO FIGHT ═══════════════════════════════════
  ev({
    id: 'sitting-with-it', phase: 'middle', cast: 'solo', weight: 3,
    note: 'She knows she is lip syncing and has gone somewhere else in her head.',
    when: f => f.inBottom, effects: { pop: { a: 1 }, state: 'bracing' },
    lines: [
      "{a} is on the couch and she has gone somewhere else. Her body is in the room but her eyes are on the wall and nobody is speaking to her because everyone can see she is already in the lip sync in her head. She is rehearsing. She is running through songs she might get. She is doing the thing you do before a fight.",
      "The room is talking and {a} is not part of it. She is sitting with a drink she has not touched, doing the maths: what is the song, do I know it, what can I do, what am I wearing, can I move in this. The calculation is private and total and the only sign of it is that she has not blinked in about forty seconds.",
      "{a} has gone quiet in a way that changes the room. She is not crying, she is not performing, she is just sitting there with her hands in her lap and her jaw set, and the other queens are giving her space because the space is not for comfort — it is for whatever she needs to build between now and the stage.",
      "\"I am going to have to fight for it,\" {a} says, to nobody, like she is telling herself something she already knew but needed to hear out loud. She sits up straighter. She checks the shoes. She checks the range of movement in the dress. She is getting ready for the lip sync and the room watches her do it.",
    ],
  }),
  ev({
    id: 'both-of-us', phase: 'middle', cast: 'pair', weight: 3,
    note: 'The two who are about to lip sync against each other, being decent about it.',
    arcs: ['hero', 'relationship'], when: f => f.bothInBottom && f.bond >= 0,
    effects: { bond: 2, pop: { a: 1, b: 1 } },
    lines: [
      "{a} and {b} are sitting next to each other on the couch and neither of them wanted to be here and both of them are. {a} says \"I am not going to hold back\" and {b} says \"I do not want you to\" and they mean it and that is the saddest kind of respect — two people who like each other agreeing to fight.",
      "\"We are both in it,\" {a} says, and {b} nods, and they sit with that for a minute without filling the silence. They have been good to each other all season and now they are about to lip sync against each other and there is nothing to say about it that makes it easier. {a} squeezes {b}'s hand once. {b} squeezes back.",
      "{b} says \"one of us is going home tonight\" and {a} says \"I know\" and they look at each other with the particular misery of two queens who would rather fight literally anyone else. They do not hug. Hugging would make it feel like a goodbye, and neither of them is ready to say that yet.",
      "They are side by side, both in the bottom, and {a} says \"give them a show\" and {b} says \"you too\" and the decency of it — two queens who are about to try to end each other's run, being kind about it first — is the thing the room will remember longer than whoever wins.",
    ],
  }),
  ev({
    id: 'not-going-easy', phase: 'middle', cast: 'pair', weight: 2,
    note: 'The two about to lip sync, being anything but decent about it.',
    arcs: ['villain', 'relationship'], when: f => f.bothInBottom && f.bond <= 0,
    effects: { bond: -2, pop: { a: -1 } },
    lines: [
      "\"I am going to send you home,\" {a} says, looking at {b}, and it is not a read — it is a promise. {b} says nothing. The room says nothing. {a} sits back and the silence she leaves behind is the kind that does not have a joke at the end of it.",
      "{a} and {b} are on opposite ends of the couch and neither of them has spoken since they sat down, which is its own conversation. {a} looks at {b} once, a long look, the kind of look you give someone you intend to beat, and {b} looks back the same way. The lip sync has already started in this room.",
      "\"You know I can perform,\" {a} says, and it is aimed at {b}, and {b} says \"so can I\" with a flatness that is scarier than volume. They are not being decent about it. They are not pretending this is not personal. The room is watching two queens who do not like each other prepare to fight, and it is uncomfortable, and neither of them cares.",
      "{a} says \"may the best queen win\" and the way she says it makes it clear she thinks that queen is her. {b} smiles. The smile has nothing warm in it. They sit there, in the same room, about to lip sync against each other, and the air between them could cut glass.",
    ],
  }),
  ev({
    id: 'i-know-the-song', phase: 'late', cast: 'solo', weight: 2,
    note: 'She finds out what the song is and either that is very good news or it is not.',
    arcs: ['performance'], when: f => f.inBottom, effects: { pop: { a: 1 } },
    lines: [
      "Somebody tells {a} what the song is and her face changes. She knows it. She knows every word. She knows where the chorus hits and where the bridge drops and exactly what she is going to do on the second verse. \"I got this,\" she says, and the confidence is so sudden and so total that the room believes her.",
      "{a} hears the song title and closes her eyes and starts mouthing the words, right there on the couch, and every queen in the room can see the lip sync forming in her head — the moves, the moments, the build. She opens her eyes and she looks different. She looks like a queen who just found out the fight is on her turf.",
      "The song comes through and {a}'s face falls. She does not know it. She does not say she does not know it — she just goes very still and starts trying to remember the chorus from somewhere, anywhere, and the effort of the remembering is visible. The room sees it. The room does not say anything.",
      "{a} finds out what the song is and says \"oh\" in a voice that could mean anything. She starts humming it under her breath, testing whether she has it, and the hum comes and goes, which means she has some of it but not all of it. She has about ten minutes to find the rest.",
    ],
  }),
  ev({
    id: 'talk-me-through-it', phase: 'late', cast: 'pair', weight: 2,
    note: 'Somebody not in the bottom coaches somebody who is, minutes before she has to do it.',
    arcs: ['hero'], when: f => f.bInBottom && f.bond >= 2,
    effects: { bond: 2, pop: { a: 2 } },
    lines: [
      "{a} sits {b} down and walks her through it. \"Forget the choreo. Forget being perfect. Just feel the song and let them see you feeling it.\" She says it like a coach, not like a friend, because right now {b} does not need a friend — she needs someone who knows how to survive this.",
      "\"Look at me.\" {a} takes {b}'s hands and makes her breathe. \"You know the words. You know the song. All you have to do is get out there and remind them why you are here.\" {b} nods. She looks steadier. {a} does not let go of her hands until she looks like a queen who can walk onto a stage and fight.",
      "{a} goes through the song with {b} line by line, marking the moments — where to build, where to hold back, where to hit the turn. She is not in the bottom and she has nothing to gain from this. She is doing it because {b} needs it and because {a} is the kind of queen who helps.",
      "\"Show them something real,\" {a} says. \"Do not try to win. Try to make them feel something.\" {b} listens with the concentration of a person memorising a map, and {a} gives her one — the song, the shape of it, the moment to push. By the time they are called back {b} looks like somebody who has a plan.",
    ],
  }),

  // ══ THE EMOTIONAL FLOOR ══════════════════════════════════════════════
  ev({
    id: 'it-all-arrives', phase: 'middle', cast: 'solo', weight: 2,
    note: 'She has been holding it since the stage and stops holding it.',
    arcs: ['narrator', 'representation'], when: f => st(f.a, 'temperament') <= 5,
    effects: { pop: { a: 2 }, state: 'fragile' },
    lines: [
      "{a} has been holding it since the stage. She held it on the walk back. She held it through the first ten minutes. She is not holding it anymore. The tears come and they do not come gracefully — they come the way tears come when you have been fighting them — and the room lets her have it.",
      "It starts with a breath that goes wrong. {a} tries to say something and the sentence breaks in the middle and what comes out instead is all of it — the critique, the pressure, the weeks, the wanting it. She puts her hands over her face and the room goes still, not out of pity but out of recognition.",
      "{a} is fine and then she is not fine and the transition between those two things is about two seconds. She starts crying in the way people cry when they did not plan to, which is messier and more honest than the kind that comes with a warning. The makeup is going. She does not care about the makeup.",
      "\"I am okay,\" {a} says, and then immediately proves herself wrong by crying so hard she cannot finish the sentence she was going to use to explain why she is okay. She is not okay. Everybody can see she is not okay. The room does not try to fix it. The room sits with it.",
    ],
  }),
  ev({
    id: 'somebody-sits-down', phase: 'middle', cast: 'pair', weight: 3,
    note: '{a} goes to {b} without being asked. The room lets them have it.',
    arcs: ['hero'], when: f => f.bond >= 0, effects: { bond: 2, pop: { a: 2 } },
    lines: [
      "{a} does not say anything. She just gets up, crosses the room, and sits down next to {b}, close enough that their arms are touching. {b} does not look at her. {a} does not speak. She is just there, which is the only thing she can do and the only thing {b} needs.",
      "{a} sees {b} losing it from across the room and goes to her the way you go to someone you care about — no announcement, no fuss, just movement. She sits down, puts a hand on {b}'s back, and waits. {b} starts talking when she is ready. {a} does not rush her.",
      "Nobody asked {a} to go over there. She watches {b} for about thirty seconds, puts her drink down, and walks across the room and sits on the arm of the couch. She says \"I am here\" and means it literally — I am here, in this space, with you, for however long this takes.",
      "{a} brings a box of tissues and a drink and puts both within {b}'s reach without saying a word. She sits. {b} cries. {a} does not try to talk her out of it or through it. The room gives them the space, because the room knows what this looks like and knows not to interrupt it.",
    ],
  }),
  ev({
    id: 'why-im-here', phase: 'middle', cast: 'solo', weight: 2,
    note: 'She says what this actually means to her, and it is not about the crown.',
    arcs: ['representation', 'underdog'], when: f => true,
    effects: { pop: { a: 3 } },
    lines: [
      "Somebody asks {a} why she is here and she gives the real answer, not the one for the stage. It is about a kid in her town who saw her perform once and told her she was the first queen that kid had ever seen, and {a} said she would go as far as she could so that kid could see her go there. The room goes very quiet.",
      "\"I am not doing this for the crown,\" {a} says, and it sounds like a line until she explains what she is doing it for, which is specific and personal and involves a promise she made to someone she loves. The room does not know what to say because the room did not expect to be moved this hard on a night that started with a read.",
      "{a} talks about where she comes from, and not the polished version. The version where drag was the only thing that made sense, where this show was the thing she watched when nothing else was good, where being here is not a career move but the thing she has been working toward since she was young enough to know and scared enough to hide it.",
      "It comes out sideways — {a} is answering a question about the challenge and the answer turns into something bigger, something about what drag gave her when nothing else did, and by the end of the sentence the room is not a room full of queens backstage — it is a room full of people who all came from the same kind of somewhere.",
    ],
  }),
  ev({
    id: 'someone-at-home', phase: 'middle', cast: 'solo', weight: 1,
    note: 'She talks about a person who is not in the room.',
    arcs: ['representation'], when: f => st(f.a, 'loyalty') >= 6,
    effects: { pop: { a: 3 } },
    lines: [
      "{a} talks about someone at home — not the version she tells interviewers, the real version — and the room hears a queen describe a person she loves in a way that makes the whole night smaller. The challenge does not matter for about ninety seconds. The person {a} is talking about matters.",
      "\"She told me to go,\" {a} says, about someone who is not here, and the way she says it makes it clear that leaving was the hardest part. {a} describes the goodbye — specific, messy, real — and the room goes still because everyone in it left someone behind and nobody has said it this plainly.",
      "{a} brings up a name the room has never heard and tells them about a person who believed in her before she believed in herself. It is not a sad story. It is a grateful one, and the gratitude is so naked and so unperformed that the queen next to her puts a hand on her arm and lets it stay.",
      "\"I think about them every night,\" {a} says, and she does not specify who, and the room does not ask, and the weight of the unnamed person fills the space between the words. {a} has someone she is carrying with her through this, and the carrying shows.",
    ],
  }),
  ev({
    id: 'the-room-goes-soft', phase: 'middle', cast: 'pair', weight: 1,
    note: 'One honest thing turns the whole room from a fight into a group of people.',
    when: f => true, effects: { bond: 1.5, pop: { a: 1 } },
    lines: [
      "{a} says one honest thing and the whole room changes. It is not a big speech — it is a sentence, said quietly, about something real — and the fight that was building evaporates because nobody can go back to being sharp after hearing something that true.",
      "The room is tense and {a} says something that is not about the challenge, not about the critiques, not about any of it. She says something about why she is scared, and the fear is so recognisable that every queen in the room stops performing and starts being a person, and the room turns warm in the way rooms turn warm when the act drops.",
      "{a} breaks the tension by accident. She is not trying to. She just says a thing about herself that is so unguarded and so real that the queen who was about to argue puts her drink down and says \"yeah. Me too.\" And then another queen says it. And then the room is a different room.",
      "It takes one sentence. {a} says it — about missing someone, about being tired, about the weight of wanting something this badly — and the sentence does what an hour of arguing could not. The room softens. {b} touches her arm. Somebody pours another round. The fight is over and something kinder has replaced it.",
    ],
  }),

  // ══ TEETH ════════════════════════════════════════════════════════════
  ev({
    id: 'say-it-to-my-face', phase: 'middle', cast: 'pair', weight: 2,
    note: 'Something said in the werk room this week gets repeated back to her, verbatim.',
    arcs: ['villain', 'relationship'], when: f => f.bond <= -2,
    effects: { bond: -2.5, pop: { a: 1 } },
    lines: [
      "\"You said I was the weakest one in here.\" {a} repeats the sentence word for word, the one {b} said in the werkroom when she thought nobody would carry it back. {b}'s face changes. She did say it. She said it three days ago. She did not think it would come back with a receipt.",
      "{a} has been waiting for this. She quotes {b} back to herself — the exact words, the exact tone, practically the exact hand gesture — and {b} sits there hearing her own opinion returned to her in a room where she cannot deny it. \"Am I lying?\" {a} asks. {b} does not answer, because {b} is not lying.",
      "\"Tell her what you told me,\" {a} says, pointing at {b}, and {b} goes pale, because the thing she said in the werkroom about {a}'s talent was specific and unkind and she said it to the wrong person. The queen she told it to is watching from the couch. {b} has no cover.",
      "{a} repeats the werkroom conversation line by line, and {b} tries to stop her, and {a} does not stop. She delivers {b}'s own critique of her right back to {b}'s face, in front of the room, and the accuracy of the recall is devastating. \"That is what you said. That is exactly what you said.\" It is.",
    ],
  }),
  ev({
    id: 'who-should-go', phase: 'middle', cast: 'pair', weight: 2,
    note: 'Somebody says out loud who she thinks deserves to go home, and that queen is in the room.',
    arcs: ['villain'], when: f => f.canScheme,
    effects: { bond: -2, pop: { a: -2 } },
    lines: [
      "\"Who should go home?\" somebody asks, the same question the judges asked, and {a} answers it, here, backstage, with the queen she names sitting eight feet away. The name lands in the room like a dropped glass. {b} looks up. {a} does not look away.",
      "{a} says {b}'s name. Not on the main stage where it is expected, but here, backstage, unprompted, to a room full of queens who were not asking. {b} says \"are you serious\" and {a} says \"yes\" and the room divides in real time between the queens who think she is brave and the queens who think she is cruel.",
      "\"I think she should go.\" {a} says it about {b} while {b} is refilling a drink three feet from the couch, and the sentence reaches {b} at the same time as the glass reaches her lips. She puts the glass down very carefully. {a} does not backpedal. The room goes tight.",
      "{a} does not wait for the question. She announces it to the room — who she thinks should go home and exactly why — and the why is detailed, and the queen she is talking about is in the room, and the room holds its breath while {a} lays it out. {b} listens to the whole thing before saying a word, which takes a kind of strength {a} did not anticipate.",
    ],
  }),
  ev({
    id: 'the-read-lands', phase: 'middle', cast: 'pair', weight: 2,
    note: 'A joke that is genuinely funny and genuinely cruel, and the room cannot decide.',
    arcs: ['narrator', 'villain'], when: f => dragOf(f.a).comedy >= 7,
    effects: { bond: -1, pop: { a: 2 } },
    lines: [
      "{a} lands a read on {b} that is so funny two queens spit their drinks, and so mean that the laughter has a wince inside it. The joke is perfect. The cruelty is real. {b} laughs because what else can she do, but the laugh is armour and {a} knows it.",
      "The read is four words long and it takes the room about three seconds to process it and then everybody loses it at once. {a} delivers it deadpan, like she is ordering food, and {b}'s face goes through shock, then hurt, then the decision to laugh about it, all in the space of one breath. It was funny. It was also not kind.",
      "{a} says one sentence about {b} that is technically a joke and technically an assassination. The room cannot decide whether to laugh or gasp so it does both. {b} is laughing too, because queens laugh when they are read — it is the law — but the laughter does not quite reach her eyes.",
      "\"Girl —\" and then {a} says something about {b}'s performance tonight that is so brutally accurate it might be art. The room screams. {b} puts her face in her hands, half-laughing, half-dying. It is the best read anyone has landed all season and it is also the unkindest, and {a} does not look sorry about either part.",
    ],
  }),
  ev({
    id: 'told-to-stop', phase: 'middle', cast: 'pair', weight: 1,
    note: 'A third queen tells them both to stop, and one of them listens.',
    arcs: ['hero'], when: f => f.tension, effects: { bond: 1, pop: { a: 1 } },
    lines: [
      "\"Enough.\" {a} says it once, from the couch, and the word is loud enough and flat enough that both of them stop mid-sentence. She does not take a side. She says \"you are both better than this\" and the shame of that — being told by a third queen that the fight has gone beneath them — cools the room faster than any apology.",
      "{a} stands up between them and says \"not tonight\" with the energy of a person who has decided this is over. One of them opens her mouth and {a} says \"I said not tonight\" and the mouth closes. The room exhales. {a} sits back down like she did not just end a war.",
      "\"Can we stop?\" {a} says it without raising her voice, which is why it works. She is not yelling over them — she is asking, calmly, and the calm is more authoritative than volume. One of them nods. The other one takes a breath and picks up her drink. The argument is not resolved. It is just over, for now.",
      "{a} looks at both of them and says \"we are about to walk back out there, and this is not how we are walking back out.\" It is the most practical thing anyone has said all night and it works because it is true — the stage is waiting, and the stage does not care about their argument.",
    ],
  }),
  ev({
    id: 'walks-out', phase: 'middle', cast: 'solo', weight: 1,
    note: 'She leaves the room rather than say what she is about to say.',
    when: f => st(f.a, 'temperament') <= 4, effects: { pop: { a: 1 }, state: 'withdrew' },
    lines: [
      "{a} stands up, puts her glass down, and walks out of the room without saying a word. She does not slam anything. She does not announce it. She just leaves, and the door closing behind her is quieter and more devastating than anything she could have said.",
      "The sentence is halfway out of {a}'s mouth when she stops, closes her eyes, and decides not to say it. She stands, walks to the door, and goes through it, and the room watches her choose to leave over choosing to say the thing she was about to say, and everybody knows what the thing was.",
      "{a} can feel herself about to say something she will not be able to take back. She looks at the ceiling, breathes, and says \"I need a minute\" and leaves. The room lets her go. When she comes back she is calmer, which means whatever she was going to say is still in her body, just folded smaller.",
      "She does not explain it. {a} just gets up, mid-conversation, walks out through the door, and stands in the hallway for five minutes by herself. When she comes back she sits in a different seat and does not look at the person she was about to argue with. The relocation is the statement.",
    ],
  }),
  ev({
    id: 'the-apology', phase: 'late', cast: 'pair', weight: 2,
    note: 'Before they are called back, one of them fixes it.',
    arcs: ['hero', 'relationship'], when: f => f.bond <= -1,
    effects: { bond: 3, pop: { a: 2 }, state: 'mended' },
    lines: [
      "{a} crosses the room before they are called back and sits next to {b} and says \"I am sorry.\" Not \"I am sorry but.\" Not \"I am sorry if.\" Just the words, direct, and {b} takes a moment and nods and says \"okay\" and it is not perfect but it is a door opening instead of closing.",
      "\"I was wrong to say that.\" {a} says it quickly, like she has been working up to it, and then she says why she was wrong, specifically, which is the part that makes it real. {b} listens. {b} does not forgive her immediately, but the fact that {a} named the thing means there is something to forgive, which is better than pretending it did not happen.",
      "{a} pulls {b} aside before they walk back out and says \"what happened in here tonight was on me and I know it\" and {b} says \"it was on both of us\" and {a} says \"no, it was on me\" and the fact that she will not let {b} share the blame is the part that {b} will remember.",
      "\"We are about to go back out there and I do not want to go back out there with this between us.\" {a} says it plainly and {b} looks at her for a long time and then something in {b}'s face softens. They do not hug. {b} says \"thank you for saying that\" and they walk toward the door on better terms than they sat down on.",
    ],
  }),
  ev({
    id: 'no-apology', phase: 'late', cast: 'pair', weight: 1,
    note: 'It is not fixed, and they are about to have to stand next to each other.',
    arcs: ['villain'], when: f => f.bond <= -4,
    effects: { bond: -1, state: 'frost' },
    lines: [
      "{a} and {b} are sitting three chairs apart and neither of them has moved since it happened. The room has decided, collectively, not to broker a peace, because the room has seen {a}'s face and knows better. When somebody asks if they are alright {a} says \"I am fine\" in a tone that means \"do not\" and {b} says nothing at all, which is worse.",
      "The door to the stage is going to open any minute and {a} and {b} will have to walk through it side by side and smile. They both know this. Neither of them is practising the smile. {b} is reapplying lip liner with the focus of somebody defusing a device, and {a} is watching {b} in the mirror and not blinking.",
      "{a} picks up her drink, walks past {b} without looking at her, and sits down at the other end of the lounge. {b} watches her go and then turns back to the mirror. Somebody in the middle of the room exhales very slowly. Whatever that was, it is still that, and it is going to be that on the stage too.",
      "There is a version of this where {a} says something before they go back out and it is fine. This is not that version. {a} is staring at the wall and {b} is laughing too loudly at somebody else's joke and the room can feel both of them deciding, separately, that the other one started it.",
    ],
  }),

  // ══ CALLED BACK ══════════════════════════════════════════════════════
  ev({
    id: 'lipstick-check', phase: 'late', cast: 'pair', weight: 2,
    note: 'Everybody repairs their face at once, because they are going back out there.',
    when: f => true, effects: { bond: 0.5, pop: { a: 1 } },
    lines: [
      "{a} pulls a compact out of somewhere — nobody saw where — and starts fixing the damage. {b} leans over without being asked and says \"you have got a line here\" and touches her own cheek to show where. They have been arguing for twenty minutes but the face comes first. It always comes first.",
      "\"I look like I have been crying,\" {a} says, which is accurate because she has been crying. {b} hands her a wipe and says \"you look like you have been feeling things on television, which is what we are here for\" and {a} laughs and the laugh helps more than the wipe.",
      "{a} and {b} end up at the same mirror at the same time, fixing lips and lashes side by side, elbows almost touching. Neither acknowledges it. The ritual is bigger than whatever happened tonight — you do not go back on that stage without your face right, and you do not let anybody else go back without theirs right either.",
      "{b} says \"hold still\" and fixes something on {a}'s lash that {a} could not see. It takes four seconds. {a} says \"thank you\" and means it beyond the lash, and {b} says \"of course\" and means it beyond the lash too, and then they are both looking at the door because the door is about to open.",
    ],
  }),
  ev({
    id: 'called-back', phase: 'late', cast: 'solo', weight: 2,
    note: 'The call comes and the room changes back into competitors.',
    when: f => true, effects: { pop: { a: 1 }, state: 'sober' },
    lines: [
      "The call comes and {a} stands up before anybody else does. She tugs her dress down, rolls her shoulders back, and is somebody else before she reaches the door. The queen who was sitting on that couch five seconds ago, laughing too hard and picking at her nails — that queen does not exist on the main stage.",
      "\"That is us,\" somebody says, and {a} puts her drink down on the table with a click that is louder than it needs to be. The room rearranges itself. Heels go back on. Posture changes. {a} checks her reflection one last time and whatever she sees there, she decides it will do.",
      "{a} hears the call and her whole body changes — spine straighter, chin higher, eyes wider. She was slouched against the arm of the couch thirty seconds ago talking about absolutely nothing. Now she is a queen walking onto a stage, and the difference is not performance. The difference is that both versions are real and this is the one that gets judged.",
      "The door opens and {a} does not rush. She takes a breath, smooths the front of her outfit, and walks toward the stage like she has somewhere better to be and has chosen to be here instead. Whatever they decided in there, she is going to hear it standing up.",
    ],
  }),
  ev({
    id: 'one-last-look', phase: 'late', cast: 'pair', weight: 1,
    note: 'Two queens catch each other in the mirror on the way out and neither says anything.',
    when: f => f.bond >= 2, effects: { bond: 1 },
    lines: [
      "{a} and {b} catch each other in the mirror on the way to the door and hold the look for exactly one second longer than normal. Neither says anything. Neither needs to. Whatever is about to happen out there, that look said \"I see you\" and the rest is between them and the judges.",
      "The room is moving toward the door and {a} glances sideways and finds {b} already looking at her. {b} raises one eyebrow — not a question, not encouragement, just acknowledgement — and {a} nods once, and that is the entire conversation. It is enough.",
      "{a} is the last one through the door and {b} is holding it open. They do not speak. {b} tilts her head toward the stage as if to say \"after you\" and {a} walks past and {b} follows and the door closes behind them and whatever happened in this room stays in this room.",
      "On the way out {a} and {b} end up shoulder to shoulder in the doorway, and for a moment neither moves. {a} looks at {b} and {b} looks at {a} and there is something in both their faces that is too complicated to say out loud, so neither of them tries. They walk out together.",
    ],
  }),
  // ── FILLING THE LATE PHASE ───────────────────────────────────────────
  //
  // Added after the guard measured what was ELIGIBLE rather than what was
  // written: the run-up to being called back offered only two scenes on an
  // ordinary night, because almost everything late was gated on being in the
  // bottom. Every phase needs beats that can happen on any night at all.
  ev({
    id: 'the-waiting', phase: 'late', cast: 'solo', weight: 2,
    note: 'The deliberation is taking longer than usual and she is reading things into that.',
    when: f => true, effects: { pop: { a: 1 }, state: 'bracing' },
    lines: [
      "It has been a long time. {a} is pretending not to notice that it has been a long time. She picks up her drink, puts it down, picks it up again. \"They are arguing about us in there,\" she says to nobody in particular, and the fact that she says it out loud means she has been thinking it for a while.",
      "{a} is sitting very still on the couch, which is how you can tell she is not calm at all. When the deliberation runs long it means somebody on the panel disagrees with somebody else, and {a} knows this, and she is running through every critique she received trying to figure out which way the argument is going.",
      "\"How long has it been?\" {a} asks, and three queens check the clock at once, which means everybody is counting. {a} laughs at this and says \"okay so it is not just me\" and somebody says \"it is never just you\" and the room relaxes for exactly two seconds before going quiet again.",
      "The longer they wait the louder {a}'s knee bounces against the arm of the couch. She is not aware she is doing it. She is aware that a long deliberation means the call was close, and a close call means somebody she thought was safe is not, and that somebody might be her.",
    ],
  }),
  ev({
    id: 'guessing-the-verdict', phase: 'late', cast: 'pair', weight: 2,
    note: 'They try to call it between them, and one of them is confidently wrong.',
    when: f => true, effects: { bond: 0.5, pop: { a: 1 } },
    lines: [
      "\"I think I know who is in the bottom,\" {a} says, and names two queens with the confidence of somebody who has already decided and is just checking. {b} nods along and then says \"I think it is actually you\" with a smile that softens the blow but does not remove it. {a} laughs and says \"do not\" and they both look at the door.",
      "{a} and {b} are running through the critiques together, doing the maths. \"She got the note about the hem,\" {a} says, \"and you know what that means.\" {b} says \"I do not know what that means\" and {a} says \"it means the hem was wrong\" with an expression that says she thinks {b} should keep up.",
      "\"Who do you think won?\" {b} asks, and {a} answers immediately, wrongly, and with total conviction. {b} disagrees but does not say so, because {a} is already explaining her theory at a pace that does not leave room for disagreement, and {b} has decided to let the judges sort it out.",
      "{a} leans across to {b} and says \"I am going to tell you what is going to happen and you are going to tell me I am wrong and then it is going to happen exactly like I said.\" {b} says \"go on then\" and {a} lays out a prediction that accounts for everything except the one critique she did not hear, which is the one that mattered.",
    ],
  }),
  ev({
    id: 'good-luck-out-there', phase: 'late', cast: 'pair', weight: 2,
    note: 'Whatever has happened in this room, they are about to go and stand together.',
    when: f => true, effects: { bond: 1 },
    lines: [
      "{a} turns to {b} on the way to the door and says \"good luck out there\" and means it. Not the performative version, not the version with the smile that says \"but not too much luck.\" The real one. {b} says \"you too\" and squeezes her arm, and for a second they are just two people who both want the same impossible thing.",
      "\"Whatever happens,\" {a} says, and {b} finishes the sentence with \"we came here and we did it\" and {a} nods and they do not need to say anything else. They are about to stand on a stage and one of them might go and neither of them is pretending that is not true, which is its own kind of kindness.",
      "{b} catches {a} by the elbow near the door. \"Hey,\" she says, and {a} turns around. \"You were good tonight. Whatever they say.\" {a} blinks, twice, and then says \"so were you\" and the speed with which she says it suggests she was thinking it already and had not been planning to say it.",
      "{a} and {b} are putting themselves back together near the door and {a} says \"I hope it is not you\" quietly, like she does not want the room to hear. {b} says \"I hope it is not you either\" and they look at each other with the kind of honesty that only exists when you are about to walk into a verdict.",
    ],
  }),
  ev({
    id: 'putting-the-face-back', phase: 'late', cast: 'solo', weight: 2,
    note: 'She has cried it off and has about ninety seconds to be somebody else.',
    when: f => true, effects: { pop: { a: 1 } },
    lines: [
      "{a} has ninety seconds and a mirror and a bag of things that cost more than some people's rent. She works fast — concealer first, then powder, then the lip, then the lash — and by the time she is done you would not know she had been crying unless you looked at her eyes, which still have the redness that foundation cannot reach.",
      "She wipes everything off and starts again. There is no time to start again. {a} starts again anyway, because the face she had on was the face of somebody who had been told something she did not want to hear, and the face she needs is the face of somebody who can take it. She finishes with eleven seconds to spare.",
      "{a} is rebuilding her face the way a mechanic rebuilds an engine — systematic, fast, no wasted motion. Somebody offers to help and {a} says \"I have got it\" without looking up, because looking up would mean stopping and stopping would mean thinking about what she looks like right now, and she does not have time for that.",
      "The mirror shows the damage and {a} fixes it layer by layer with a focus that blocks out everything else in the room. Primer. Powder. Liner. She does not rush but she does not pause either, and when she clicks the compact shut and stands up she looks like a person who has not cried in years, which is a kind of drag all by itself.",
    ],
  }),
  ev({
    id: 'last-word', phase: 'late', cast: 'pair', weight: 1,
    note: 'One of them gets the final line in on the way out of the room.',
    arcs: ['villain', 'narrator'], when: f => f.bond <= 2,
    effects: { bond: -1, pop: { a: 1 } },
    lines: [
      "{a} is almost through the door when she turns around and says something to {b} that the rest of the room does not quite catch. {b} catches it. The look on {b}'s face says she caught every word, and {a} turns back and walks out without waiting for a response, which is the whole point of a last word.",
      "\"See you out there,\" {a} says to {b} on the way past, and the way she says it makes it sound less like a greeting and more like a weather forecast. {b} opens her mouth and then closes it, because {a} is already gone and the door is already closing and the moment to respond has been taken away on purpose.",
      "{a} leans close to {b}'s ear on the way to the door and says one sentence that nobody else hears. {b}'s jaw tightens. {a} keeps walking. Whatever she said, it was short enough to land before {b} could block it and long enough that {b} will be thinking about it on stage.",
      "The room is filing toward the door and {a} falls into step next to {b} and says something under her breath that makes {b} stop moving. {a} does not stop. She keeps walking, and by the time {b} has composed a reply {a} is already three steps ahead and not looking back.",
    ],
  }),
  /* ══ MORE OF THE ROOM, AND THE ROOM ITSELF ═══════════════════════════
     Forty-one events across three phases, all of them one queen or two, is a
     thin segment for the one room where the entire cast sits in shot at the
     same time — the draw runs out and the same scenes come round again.
     These add the third cast Untucked never had (`group`: {c} and sometimes
     {d} are the queens who are simply THERE) and widen all three phases.
     Placeholders: {a} and {b} are who it is about, {c} and {d} the couch. */

  // ── arrival: the door, the drinks, the first thing anybody says ──
  ev({
    id: 'straight-to-the-mirror', phase: 'arrival', cast: 'solo', weight: 1.2,
    note: 'She does not sit down. {a} goes straight to the mirror and starts '
      + 'fixing something that does not need fixing, because her hands need a '
      + 'job and the alternative is talking about what just happened.',
    when: f => f.lastCall === 'BTM2' || f.lastCall === 'LOW',
    effects: { pop: { a: 1 }, state: 'unspoken' },
    lines: [
      "{a} walks through the door and does not sit down. She goes straight to the mirror and starts blending under her eye like there is a crisis happening there, and there is not — the crisis is everywhere else and {a} is choosing foundation over feelings because her hands need something to do that is not shaking.",
      "Everybody finds the couch and {a} finds the mirror. She picks up a brush and starts fixing her contour, which was fine, because if she sits down somebody is going to ask her how she is feeling and the answer to that is a sound, not a sentence. The brush moves in circles and the room lets her have it.",
      "{a} is at the mirror before the door closes behind her, already wiping at a brow that does not need wiping, already touching up a highlight that was set three hours ago. The other queens pour drinks and settle in and {a} keeps her back to the room because turning around means making eye contact and eye contact means talking about it.",
      "The first thing {a} does is pick up a sponge and dab at nothing. Her mug is perfect and everybody knows it and she knows they know, but the mirror is the one place she can look without seeing somebody who wants to ask her what happened out there. She blends for four straight minutes and nobody interrupts.",
    ],
  }),
  ev({
    id: 'pouring-for-everybody', phase: 'arrival', cast: 'group', weight: 1.4,
    note: 'Somebody has to do it and {a} does it. She pours for {b} and {c} '
      + 'before she pours for herself, which is either kindness or a way of '
      + 'not sitting down yet, and the room takes it as kindness.',
    when: f => f.groupSize >= 3,
    effects: { bond: 1, pop: { a: 1 }, state: 'host-of-the-room' },
    lines: [
      "{a} pours for {b} first and then for {c} and then for herself last, which is the order of someone who was raised right or someone who is not ready to sit down, and the room reads it as generosity because generosity is the kinder interpretation. {b} takes the glass and says thank you and {c} takes the glass and says nothing, which is also a thank you.",
      "\"What do you want.\" {a} is already at the bottles before {b} and {c} have decided where to sit. She pours three drinks and carries two of them across the room with the balance of someone who has tended bar in heels, and the pouring is the first kind thing that happens backstage and {a} did it without being asked.",
      "{a} grabs three glasses and starts pouring before anybody asks because somebody has to do it and {a} would rather be the queen pouring than the queen sitting down and thinking about what just happened out there. {b} gets hers first, {c} gets hers second, and {a} finally sits down with her own and the sitting down is the hard part.",
      "The drinks appear because {a} made them — {b}'s with extra ice the way {b} takes it, {c}'s neat, her own last and largest — and the making of them bought {a} three minutes of not having to talk about the stage. She hands them out and finally sits and the room is a little softer for having something to hold.",
    ],
  }),
  ev({
    id: 'nobody-says-it', phase: 'arrival', cast: 'group', weight: 1.3,
    note: 'The obvious thing goes unsaid for a full minute. {a}, {b} and {c} '
      + 'all know who is in trouble and all three of them talk about the '
      + 'runway instead, and the avoidance is louder than the subject.',
    when: f => f.groupSize >= 3 && (f.inBottom || f.bInBottom),
    effects: { bond: 0.5, pop: { a: 1 }, state: 'avoidance' },
    lines: [
      "Everybody knows who is in trouble and nobody says it. {a} brings up the runway and {b} agrees the runway was strong and {c} says something about fabric choices, and the three of them build a conversation out of everything except the thing they are actually thinking about, and the gap where the real topic should be has its own weight in the room.",
      "{a} says \"those looks tonight\" and {b} says \"right?\" and {c} says something about a silhouette, and the three of them are talking about clothes like nobody on that stage just got dragged by three judges in a row. The avoidance is collaborative — all three of them are building the same wall around the same subject and nobody acknowledges the wall.",
      "\"Can we talk about the fabric {c} used?\" {a} says it and the room latches on because the alternative is talking about who is going home, and talking about who is going home means looking at the person who might be going home, and nobody is ready to do that yet. {b} agrees the fabric was gorgeous. {c} accepts the compliment. The real conversation waits.",
      "{a} and {b} and {c} are sitting in a circle discussing hemlines like hemlines are the most important thing in the world, and all three of them know hemlines are not the most important thing in the world, and the not-saying is a kindness that is also a cowardice and nobody can tell where one ends and the other starts.",
    ],
  }),
  ev({
    id: 'still-in-the-wig', phase: 'arrival', cast: 'solo', weight: 1.1,
    note: 'Everybody else is out of the shoes and {a} has not moved. She is '
      + 'still fully in it, sitting upright, as if taking any of it off would '
      + 'be admitting the night is over and she did not win it.',
    when: f => f.lastCall === 'HIGH' || f.lastCall === 'WIN',
    effects: { pop: { a: 1 }, state: 'holding-on' },
    lines: [
      "Everybody else has kicked off the heels and {a} is still fully beat, still in the wig, still sitting upright like she is about to walk a second runway. Taking any of it off would mean the night is over and she does not want the night to be over because she won it, or nearly won it, and the drag is the proof.",
      "{a} has not taken off a single thing. The corset is still cinched, the lashes are still on, the wig is still pinned, and the other queens are in robes and slides and {a} is sitting there in full regalia like a painting that refuses to come off the wall. Somebody asks if she wants to change and she says \"I am fine\" and she means it differently than they think.",
      "The shoes are still on and {a} is the only queen in the room who has not unzipped anything. She is holding onto the look the way you hold onto a good night — tightly, past the point where it is comfortable — because the moment she starts taking it apart the moment is over and {a} is not ready for the moment to be over.",
      "Every queen in the room has pulled a wig off except {a}, who is sitting cross-legged on the couch still in full drag like she is being photographed right now. The holding on is the tell — the queens who had the best night are always the last to let go of it, and {a} had a good night and is wearing it like armour she does not want to remove.",
    ],
  }),

  // ── middle: where it goes wrong ──
  ev({
    id: 'the-whole-room-turns', phase: 'middle', cast: 'group', weight: 1.5,
    note: 'It stops being between two people. {a} says something to {b} and '
      + '{c} agrees out loud, and the moment a third voice arrives it is not '
      + 'a disagreement any more, it is a side.',
    when: f => f.groupSize >= 3 && f.tension,
    effects: { bond: -2, pop: { a: -1, b: -1 }, state: 'pile-on' },
    lines: [
      "{a} says it to {b} and it might have stayed between them except {c} says \"she is right though\" out loud, and the out-loud is what changes it. A disagreement is two people and a side is three and the moment {c}'s voice arrived {b} could feel the room shift — not a conversation any more, a verdict.",
      "\"I have been thinking that too.\" {c} says it and {a} turns to {c} and nods and {b} watches the nod happen and the nod is the thing — the moment two queens agree in front of you about you, you are not in an argument, you are in a minority. {b} sits back and the sitting back is not agreement, it is retreat.",
      "{a} makes the point and {b} opens her mouth to answer and {c} cuts in with \"honestly\" — and everything after \"honestly\" is {c} agreeing with {a}, and {b} closes her mouth because the math just changed. One voice against hers was a fight. Two voices against hers is a room.",
      "It was between {a} and {b} until {c} leaned forward and said \"no, she has a point\" and then it was not between {a} and {b} any more. {b} looks at {c} with the face of someone who just learned something about where {c} stands, and {c} does not look away, which is brave, and {b} picks up her drink, which is all she can do.",
    ],
  }),
  ev({
    id: 'laughed-at-the-wrong-time', phase: 'middle', cast: 'group', weight: 1.2,
    note: '{c} laughs in the middle of something that was not funny to {b}, '
      + 'and now {c} is in it, and {c} did not say a word.',
    when: f => f.groupSize >= 3,
    effects: { bond: -1, pop: { c: -1 }, state: 'wrong-laugh' },
    lines: [
      "{a} is talking and {b} is telling her side of it and {c} laughs — not a big laugh, just a noise, a breath through the nose — and {b} stops talking and looks at {c} and {c}'s face says she knows it landed wrong. She did not say a word and she is now in the middle of something she was watching from the couch.",
      "The laugh comes from {c} and it comes at the wrong second — right when {b} is saying the thing that mattered most — and the room hears it and {b} hears it and {a} hears it and {c} immediately tries to turn it into a cough, which makes it worse. {c} was not even in this and now she is, and she got there by making one sound.",
      "{c} snorts during {b}'s sentence and the snort hangs in the air like a flare. {a} looks at {c}. {b} looks at {c}. {c} looks at the floor. Nobody asked {c} for an opinion and the laugh was louder than any opinion she could have given, and the problem with a laugh at the wrong time is that you cannot take it back — it already happened and everyone already heard what it meant.",
      "It is not funny and {c} laughs anyway — a short sharp thing that escapes before she can catch it — and {b} turns her whole body toward {c} and says \"what is funny\" in a voice that is not actually asking what is funny. {a} watches this happen and does not intervene because {c} put herself there and {c} is going to have to get herself out.",
    ],
  }),
  ev({
    id: 'holding-the-room', phase: 'middle', cast: 'group', weight: 1.2,
    note: '{a} has the floor and is genuinely holding it — a story, an '
      + 'impression, an account of something that happened years ago — and '
      + '{b} and {c} are laughing properly for the first time all week.',
    when: f => f.groupSize >= 3,
    effects: { bond: 1.5, pop: { a: 2 }, state: 'room-is-hers' },
    lines: [
      "{a} starts telling the story and by the second sentence {b} is leaning forward and {c} has stopped checking her phone and the room belongs to {a} now — fully, completely, the way a room belongs to a person who knows how to hold it. She does the voice, she does the face, she lands the punchline, and the laughter is real and loud and the first honest laughter anybody has had all week.",
      "\"Okay wait, wait, wait — \" {a} starts again from the top with the hand gestures and {b} is already crying laughing and {c} has her head on the armrest wheezing, and {a} has not even reached the good part yet. She is doing an impression of somebody none of them have met and it is so specific and so accurate that the room forgets they are on a show for three minutes.",
      "{a} has the floor and she is not giving it back. The story is about something that happened in the hotel and the telling of it is better than the thing itself — every beat lands, every pause earns a scream, {b} is doubled over and {c} is clapping with her hands over her mouth, and {a} rides it like a set at a club because she has done sets at clubs and this is the same muscle.",
      "Nobody asked {a} to perform but she is performing — standing up, using the whole couch as a stage, telling a story that has four acts and a twist ending — and {b} laughs so hard she spills her drink and {c} says \"stop, STOP\" but does not mean stop. {a} keeps going because the room is lighter than it has been in days and she is the reason and she knows it.",
    ],
  }),
  ev({
    id: 'that-is-not-what-i-said', phase: 'middle', cast: 'pair', weight: 1.3,
    note: '{b} repeats back what {a} said and it is not what {a} said, and '
      + 'the gap between the two versions is where the whole argument lives.',
    when: f => f.tension || f.namedOnStage,
    effects: { bond: -1.5, pop: { a: -1 }, state: 'misquoted' },
    lines: [
      "\"You said you did not care.\" {b} says it back to {a} and {a}'s face changes because that is not what {a} said — what {a} said was closer to \"I am not worried about it\" which is a completely different sentence, and the distance between the two sentences is where the whole argument is going to live for the next forty minutes.",
      "{b} repeats {a}'s words back and gets them wrong — not wildly wrong, wrong by one shade, the shade that changes the meaning — and {a} says \"that is not what I said\" and {b} says \"that is exactly what you said\" and neither of them is lying, exactly, but one of them is remembering a sentence that did not happen and the other one knows which.",
      "\"What I SAID was — \" {a} starts over because the version {b} just told the room is not the version {a} remembers and the gap between the two is small enough to be an accident and large enough to change whose fault it is. {b} looks certain. {a} looks certain. One of them is wrong and neither of them is going to be the one who admits it.",
      "{b} paraphrases and the paraphrase is a rewrite — {a}'s \"I did not love it\" becomes {b}'s \"she hated it\" — and {a} opens her hands and says \"those are two different things\" and {b} says \"girl, same thing\" and it is NOT the same thing and {a} knows it and the room is about to find out how much that difference matters to her.",
    ],
  }),
  ev({
    id: 'apology-not-accepted', phase: 'middle', cast: 'pair', weight: 1.1,
    note: '{a} apologises and {b} does not take it. Not rudely — she just '
      + 'does not take it, and the room watches an apology sit there.',
    when: f => f.bond <= -2,
    effects: { bond: -1, pop: { b: -1 }, state: 'refused' },
    lines: [
      "{a} says she is sorry and means it — the voice is right, the eyes are right, the whole body says sorry — and {b} looks at her and says \"okay\" in a tone that is not okay, and the apology sits on the floor between them like something nobody picks up. {b} is not being cruel. {b} is just not ready, and not-ready looks a lot like no.",
      "\"I want to apologise for what I said.\" {a} delivers it and {b} nods once and says \"I heard you\" and that is it — no hug, no \"it is fine,\" no reset. {a} stands there holding the apology she just gave and {b} takes a sip of her drink and the sip is the answer. The room watches an apology get received and not accepted and nobody knows where to look.",
      "{a} reaches out and {b} does not reach back. The sorry is real and {b} can see it is real and still does not take it, not because she is petty but because sorry does not undo the thing and {b} is not going to pretend it does. {a} sits back down and the distance between them is the same distance it was before the apology, and {a} can feel it.",
      "The apology comes and {b} says \"thank you for saying that\" which is the polite version of no. {a} hears the \"thank you\" and hears the full stop after it and knows the door she just knocked on did not open. {b} is not punishing her. {b} is just telling the truth, which is that sorry is a word and the word is not enough yet.",
    ],
  }),
  ev({
    id: 'defended-by-somebody', phase: 'middle', cast: 'group', weight: 1.3,
    note: '{b} is being got at and {c} — who has no stake in it and was not '
      + 'asked — says something in her defence. It changes the room and it '
      + 'costs {c} something with {a}.',
    when: f => f.groupSize >= 3 && f.tension,
    effects: { bond: 1.5, pop: { c: 2 }, state: 'defended' },
    lines: [
      "{a} is going after {b} and {c} — who was not in it, had no dog in it, was sitting on the other couch with a drink — leans forward and says \"that is not fair.\" Three words and the room changes direction. {a} looks at {c} with surprise because {c} was not supposed to be in this, and {b} looks at {c} with something closer to gratitude than anything else that has happened all night.",
      "Nobody asked {c} to say anything and {c} says it anyway — \"leave her alone\" — and {a} turns because a new voice means a new front and {c} is now standing in one she did not have to stand in. {b} goes quiet because somebody just took her side without being asked and the taking-her-side costs {c} something with {a} and {c} knows it costs her and says it anyway.",
      "{c} was watching from the edge of the couch and {a} was pressing {b} and {c} finally says \"she already said she is sorry, what more do you want\" and the room goes still. {a} did not expect a third voice. {b} did not expect a defender. {c} did not expect to be in this but she is in it now and the being-in-it changes {a}'s math.",
      "\"I am going to say something.\" {c} says it like a warning and then says the thing, which is that {a} is wrong about {b} and that somebody needed to say it and it might as well be her. {a} takes it badly because taking it well would mean agreeing, and {b} takes it with the quiet relief of a queen who was drowning and just got a hand from someone she did not think was watching.",
    ],
  }),
  ev({
    id: 'reading-the-room-wrong', phase: 'middle', cast: 'solo', weight: 1.1,
    note: '{a} makes a joke about the queen who is about to lip sync and it '
      + 'lands in total silence. She hears it land. There is no way back.',
    when: f => f.canScheme,
    effects: { pop: { a: -2 }, state: 'misjudged' },
    lines: [
      "{a} makes the joke about the queen who is about to lip sync and the joke lands in silence — total, airless, the kind of silence where you can hear the ice in someone's glass. {a} hears it land and her face does the thing where the smile stays but the eyes realise. There is no recovering from a joke that the room decided was not funny.",
      "\"Well, at least she will get to perform twice tonight.\" {a} says it and nobody laughs. Not a single sound. The room gives her the quiet that means you went too far and {a} can feel the too-far in her chest and tries to laugh at her own joke and the self-laugh makes it worse because now she is laughing alone in a room full of people who decided not to.",
      "{a} goes for the read and misses — the timing is wrong, the target is wrong, the room is not in the mood for it — and the silence after the punchline is the loudest thing that has happened all night. {a} picks up her glass and drinks from it because the alternative is standing in the silence she built and the silence is unbearable.",
      "The joke leaves {a}'s mouth and dies on arrival. The room does not laugh and does not pretend to laugh and {a} can feel the not-pretending, which is worse than being told it was not funny because at least being told gives you a response. The nothing is the response, and the nothing says everything, and {a} takes a long sip and does not try again.",
    ],
  }),
  ev({
    id: 'the-monitor', phase: 'middle', cast: 'group', weight: 1.4,
    note: 'They can hear the panel deliberating and nobody admits to '
      + 'listening. {a}, {b} and {c} are all facing away from the screen and '
      + 'all three of them have stopped talking.',
    when: f => f.groupSize >= 3,
    effects: { bond: 0.5, pop: { a: 1 }, state: 'listening' },
    lines: [
      "The screen is on and none of them are watching it and all of them are listening. {a} faces the wall. {b} faces the couch. {c} faces the ceiling. Every one of them has stopped talking at the same time and the stopped-talking is its own confession because if they were not listening they would still be having a conversation and they are not.",
      "{a} picks up a magazine and is not reading it. {b} examines her nails. {c} refills a drink that was already full. The panel is audible through the monitor and all three of them can hear names being said and none of them will admit to hearing names being said, and the pretending-not-to-listen is a group activity that requires total commitment from everyone in the room.",
      "Somebody's name comes through the monitor and {a} flinches and pretends the flinch was a stretch. {b} crosses her legs the other way. {c} puts her glass down gently. None of them look at the screen and all of them know what is being said on the screen and the knowing is written on every face in the room for anyone who bothered to look.",
      "The room goes quiet at exactly the same second, which is the second the judges' voices become audible from the monitor, and {a} and {b} and {c} all develop a sudden interest in things that are not the monitor — a hangnail, a stain on the couch, the label on a bottle — and the performance of not-listening is so coordinated it might as well be listening.",
    ],
  }),
  ev({
    id: 'called-out-for-the-edit', phase: 'middle', cast: 'pair', weight: 1.0,
    note: '{b} tells {a} she is playing to the camera, which is both true and '
      + 'the rudest thing you can say in this room, because everybody is.',
    when: f => f.canScheme && f.bond <= 1,
    effects: { bond: -1.5, pop: { a: -1 }, state: 'accused-of-editing' },
    lines: [
      "\"You are performing right now.\" {b} says it to {a} and the room goes quiet because that is the one thing you are not supposed to say out loud — everybody in this room is performing, all the time, and naming it is the rudest thing you can do. {a}'s face drops because being called out for the edit means {b} sees through the version of {a} that {a} built for the camera.",
      "{b} looks at {a} and says \"that was for the camera and we both know it\" and {a}'s whole body stiffens because {b} just said the unsayable. Every queen in this room is giving a performance and the contract is that nobody admits it, and {b} just tore the contract up in front of everyone. {a} says \"I do not know what you are talking about\" which is its own kind of performance.",
      "\"Girl, you are doing a confessional right now and we are not in the booth.\" {b} says it and {a} goes red — or would if the foundation allowed it — because the accusation is that the crying or the monologue or the reaction was not real, it was content, and the worst part is that {a} cannot deny it without it sounding like more content.",
      "{b} tells {a} she is playing it up and the telling is brutal because it is true and true is the hardest thing to defend against. {a} was giving a moment and {b} saw the giving and named it and naming it makes the moment worthless. {a} says \"everything I said was real\" and maybe it was, but {b} has made it impossible for the room to believe it now.",
    ],
  }),
  ev({
    id: 'not-your-turn', phase: 'middle', cast: 'group', weight: 1.1,
    note: '{a} is upset and {c} is more upset and louder about it, and the '
      + 'room quietly resents {c} for taking a moment that was not hers.',
    when: f => f.groupSize >= 3 && f.inBottom,
    effects: { bond: -1, pop: { c: -2 }, state: 'stolen-moment' },
    lines: [
      "{a} is upset and has earned being upset and {c} starts crying louder, which is the problem — {c}'s tears are bigger and {c}'s voice is louder and suddenly the room is comforting {c} instead of {a}, and {a} sits there watching her moment walk across the room to somebody else. {b} notices. {a} says nothing. The nothing says it.",
      "It was {a}'s turn to be held and {c} took it — not maliciously, but {c} is a louder griever and grief at volume wins the room. {a} wipes her eyes quietly while three queens surround {c} and {b} is the only one who looks at {a} and sees the thing that just happened, which is that {a}'s pain got outperformed.",
      "{c} makes it about herself and the room lets her because {c} is louder and louder gets the attention. {a} was the one in the bottom. {a} was the one the judges spoke to. But {c} is the one sobbing on the couch and the sobbing takes up all the air and {a} is left sitting in the corner of her own story with no audience. {b} catches her eye and the catching is the only acknowledgment {a} gets.",
      "\"I just feel SO — \" {c} launches into it and {a} watches her own moment become {c}'s moment in real time. {a} was in the bottom, {a} was shaking, {a} needed the room and the room went to {c} because {c} made noise and {a} did not. {b} stays near {a} but the nearness is not enough to undo the stealing, and the room quietly resents {c} for a taking nobody will name.",
    ],
  }),

  // ── late: the walk back out ──
  ev({
    id: 'fixing-her-face-for-her', phase: 'late', cast: 'pair', weight: 1.3,
    note: '{b} does {a}\'s makeup for her because {a} cannot do it herself '
      + 'right now, and neither of them says why, and it is the kindest thing '
      + 'that happens all night.',
    when: f => f.inBottom,
    effects: { bond: 2, pop: { b: 2 }, state: 'held-together' },
    lines: [
      "{a} cannot do her own face right now — the hands are shaking or the eyes will not stop — and {b} sits down next to her and picks up a brush and starts fixing {a}'s mascara without asking. Neither of them says why. {b} blends and buffs and {a} sits still and lets herself be held together by someone else's hands, and it is the kindest thing that happens all night.",
      "{b} sees {a} trying to fix her liner and failing and takes the pencil out of {a}'s hand gently and says \"let me\" and {a} lets her. {b} draws the line steady and clean and {a} closes her eyes and the closing is trust — trust that {b}'s hand is going to do what {a}'s hand could not, which is make her look like somebody who has not been crying for twenty minutes.",
      "{a}'s hands are shaking and {b} notices and does not mention the shaking. She just sits down and says \"close your eyes\" and starts doing {a}'s lashes for her, one at a time, carefully, the way you do somebody's lashes when you are trying to give them a minute of not-thinking. Neither of them names what this is. It does not need a name.",
      "\"Come here.\" {b} pulls {a} to the mirror and starts rebuilding her face — primer where the tears wrecked it, powder where the nose went red — and {a} sits in the chair and does not speak and {b} does not speak and the not-speaking is the point. The makeup is the excuse. The sitting still while somebody takes care of you is the real thing.",
    ],
  }),
  ev({
    id: 'the-group-hug', phase: 'late', cast: 'group', weight: 1.2,
    note: 'It is not performed. {a}, {b} and {c} end up holding onto each '
      + 'other by the door and none of them started it and none of them lets '
      + 'go first.',
    when: f => f.groupSize >= 3,
    effects: { bond: 2, pop: { a: 1 }, state: 'together' },
    lines: [
      "It is not staged. {a} stands up and {b} is already standing and {c} reaches for both of them and suddenly the three of them are holding on by the door and nobody started it and nobody is letting go first. The hug is tight and long and the tightness says everything the room could not say for the last hour — that they are scared and they are in this and they are holding each other up.",
      "{a} and {b} and {c} end up in a knot of arms by the doorway and none of them planned it. {a}'s head is on {b}'s shoulder and {c}'s arms are around both of them and the holding on is real — not a camera moment, not a wrap-up, just three people who have been through something together standing in a circle and not letting go because letting go means walking back out there.",
      "Somebody reaches and then somebody else reaches and then {a} and {b} and {c} are all in it — arms, foreheads, the whole thing — and the hug lasts longer than a performed hug lasts because nobody wants to be the one who breaks it. {a} squeezes and {b} squeezes back and {c} holds the outside and the three of them stand there until they are ready, which takes a while.",
      "The hug starts without a beginning — {a} turns to {b} and {c} is already there and the three of them close the gap at the same time, and the timing is the thing that makes it real. Nobody said \"bring it in.\" Nobody opened their arms. The holding just happened because the room had been hard and the holding was the opposite of hard and all three of them needed the opposite.",
    ],
  }),
  ev({
    id: 'unfinished-business', phase: 'late', cast: 'pair', weight: 1.2,
    note: 'They are called back and it is not resolved. {a} and {b} stand up '
      + 'to leave with the thing still sitting between them, and both of them '
      + 'know it is going to be there tomorrow.',
    when: f => f.tension,
    effects: { bond: -1, pop: { a: -1 }, state: 'unresolved' },
    lines: [
      "They are called back and {a} stands up and {b} stands up and neither of them says anything on the way to the door. The thing that was between them an hour ago is still between them — same size, same shape, no smaller for having been talked about — and both of them walk out knowing it will be there tomorrow morning when the cameras turn back on.",
      "{a} and {b} get the call and the fight is not done. The fight is exactly where they left it — mid-sentence, mid-grudge, the apology that was not offered and the apology that would not have been accepted — and {a} looks at {b} by the door and {b} does not look back, and the not-looking is the answer to every question {a} was thinking about asking.",
      "\"We should go.\" {a} says it and {b} nods and the nod is the only thing they have agreed on in an hour. They walk to the door side by side and the side-by-side is closer than either of them wants to be to the other and the unfinished thing walks out with them like a third person neither of them invited.",
      "{a} and {b} stand up at the same time and do not acknowledge the standing or each other. The conversation is not over — it is paused, the way you pause something you fully intend to come back to — and both of them know the pause is temporary and the stage is next and the thing will be here when they get back, unchanged and waiting.",
    ],
  }),
  ev({
    id: 'said-out-loud-at-last', phase: 'late', cast: 'group', weight: 1.1,
    note: 'On the way out somebody finally says the thing the whole room has '
      + 'been avoiding for an hour. {a} says it, {b} and {c} hear it, and '
      + 'there is no time left to do anything about it.',
    when: f => f.groupSize >= 3,
    effects: { bond: -1, pop: { a: 1 }, state: 'finally-said' },
    lines: [
      "On the way out {a} turns and says the thing — the thing the whole room has been circling for an hour, the thing everyone was thinking and nobody was willing to put into words — and {b} and {c} hear it and there is no time to respond because the door is open and the stage is waiting and the thing just sits there, said at last, with no resolution and no take-back.",
      "\"Somebody had to say it.\" {a} says it at the door and the it is the real thing, the honest thing, the thing that would have changed the whole conversation if anyone had been brave enough to say it an hour ago. {b} stops walking. {c} looks at {a}. There are three seconds before they walk out and in those three seconds nobody responds because what do you say to the truth when it arrives too late.",
      "{a} drops it on the way out like a grenade — the real opinion, the actual read, the thing the room agreed not to say — and {b} and {c} hear it hit and there is no time to pick it up. They walk out with it ringing in their ears and {a} walks out knowing she said it and the saying was brave and the timing was cowardly and both of those things are true at the same time.",
      "The door opens and {a} says it — finally, at the worst possible moment, with no runway left for a response — and {b}'s jaw drops and {c} exhales and {a} walks through the door without looking back because looking back would mean seeing the faces and the faces would mean having a conversation and there is no time for a conversation. The said thing follows all three of them onto the stage.",
    ],
  }),
  ev({
    id: 'she-goes-quiet', phase: 'late', cast: 'solo', weight: 1.2,
    note: '{a} has not spoken for twenty minutes and the room has not '
      + 'noticed, and the not-noticing is the part she will remember.',
    when: f => f.lastCall === 'SAFE',
    effects: { pop: { a: -1 }, state: 'overlooked' },
    lines: [
      "{a} has not said a word in twenty minutes and the room has not noticed because the room is busy with louder things — the fight, the crying, the queen who is telling a story — and {a} sits on the end of the couch with a drink she has not sipped and watches all of it happen without her. The not-noticing is the part she will carry home.",
      "The room is full of voices and {a} is not one of them. She went quiet somewhere between the second fight and the third drink and nobody registered the going-quiet because the loud queens stayed loud and {a}'s silence disappeared into the noise. She is right there — three feet from the couch, visible to everyone — and invisible in the way that only a safe queen in a room full of drama can be.",
      "{a} has been sitting in the same position for twenty minutes and has said exactly nothing and the nothing has gone undetected. The room talks around her, over her, past her, and {a} listens to all of it and contributes to none of it and the contribution of none is the thing — she was safe tonight, safe and forgettable, and the room is proving the forgettable part right now.",
      "Twenty minutes of silence from {a} and not one queen has looked over and said \"you okay?\" Not because they do not care but because {a} is safe and safe is invisible when the room has a bottom two to worry about. {a} finishes her drink alone in a full room, which is its own kind of loneliness, and the loneliness is what she will remember about this week.",
    ],
  }),
  ev({
    id: 'nothing-left-to-say', phase: 'late', cast: 'pair', weight: 1.0,
    note: '{a} and {b} are about to walk back out to find out which of them '
      + 'is leaving, and they look at each other, and neither of them says '
      + 'anything because there is nothing that would help.',
    when: f => f.bothInBottom,
    effects: { bond: 1.5, pop: { a: 1 }, state: 'before-the-song' },
    lines: [
      "{a} and {b} are about to walk out and one of them is not coming back and they both know it and neither of them says anything. They look at each other and the look holds for a long time — long enough to say what words would ruin — and then they stand up together and walk to the door together and the togetherness is the last thing they share before the song decides.",
      "There is nothing to say and {a} and {b} do not try to say it. They sit side by side and the side-by-side is honest in a way that talking would not be, because talking would mean one of them would have to pretend she is not scared and they are both scared and the pretending would be worse than the silence. {a} reaches over and squeezes {b}'s hand once and lets go.",
      "{a} looks at {b} and {b} looks at {a} and the looking is the whole conversation. One of them is going home and the other is staying and neither of them knows which is which and the not-knowing sits between them like a third person. They do not hug and they do not cry and they do not say \"good luck\" because good luck means one of them loses and they both already know that.",
      "The call comes and {a} and {b} stand up at the same time and there is a second where they face each other and the facing is everything — the fear, the respect, the understanding that what happens next is not personal even though it will feel personal — and neither of them says a word because there is no word that would make this moment smaller. They walk out in silence and the silence is enough.",
    ],
  }),

  /* ══ FAMILY, WHERE IT COSTS ══════════════════════════════════════════
     The werk room is where a family is a head start. Untucked is where the
     bill arrives: the two of them in the bottom together, or one of them
     watching the other be told she is going. See js/dr/family.js. */
  ev({
    id: 'both-of-us-down-here', phase: 'arrival', cast: 'pair', weight: 2.0,
    note: 'THE WORST NIGHT EITHER OF THEM WILL HAVE. {a} and {b} are family '
      + 'and they are both in the bottom, which means one of them is about to '
      + 'send the other home. Neither of them can say the useful thing '
      + 'because the useful thing is "I hope it is you".',
    arcs: ['bond'],
    when: f => f.sameFamily && f.bothInBottom,
    effects: { bond: 1, pop: { a: 2, b: 2 }, state: 'family-in-the-bottom' },
    lines: [],
  }),
  ev({
    id: 'she-defends-her-family', phase: 'middle', cast: 'group', weight: 1.6,
    note: '{c} says something about {b} and {a} — who is {b}\'s family — does '
      + 'not let it go, and the room finds out how much that bond is worth '
      + 'when it is tested in public rather than at a sewing machine.',
    arcs: ['rivalry'],
    when: f => f.sameFamily && f.groupSize >= 3,
    effects: { bond: -1.5, pop: { a: 2 }, state: 'family-defended' },
    lines: [],
  }),
  ev({
    id: 'you-are-not-my-mother-here', phase: 'middle', cast: 'pair', weight: 1.4,
    note: '{b} gives {a} a note the way she has given it for years and {a} '
      + 'says the thing she has been holding since the first day: this is not '
      + 'the bar and {b} is not her mother in this room.',
    arcs: ['rivalry'],
    when: f => f.relation === 'mother' && f.inBottom,
    effects: { bond: -2, pop: { a: 1 }, state: 'family-strain' },
    lines: [],
  }),
  ev({
    id: 'proud-of-you-anyway', phase: 'late', cast: 'pair', weight: 1.5,
    note: '{a} is family and says the thing families say before somebody goes '
      + 'out to lip sync for her life. It is not strategy and it is not for '
      + 'the camera, and it is the last private thing either of them gets.',
    arcs: ['bond'],
    when: f => f.sameFamily && (f.inBottom || f.bInBottom),
    effects: { bond: 2, pop: { a: 1 }, state: 'family-goodbye' },
    lines: [],
  }),

];

export const UNTUCKED_IDS = UNTUCKED_EVENTS.map(e => e.id);

/** What is still unwritten, so the gap is visible rather than silent. */
export function unwrittenUntuckedEvents() {
  return UNTUCKED_EVENTS.filter(e => !e.lines || e.lines.length < 4).map(e => e.id);
}

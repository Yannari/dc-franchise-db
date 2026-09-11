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
      "{a} gets through the door first. \"Well,\" she goes, to nobody, to the ceiling, to the whole night. Not clear yet if she is about to cry or about to start something. The others file in behind her and find out at the same time she does.",
      "The door goes and it is {a}, still in the full look, walking like the shoes have personally wronged her. Drops onto the couch sideways. Exhales for about four seconds. \"That was a lot.\" Everybody who comes in after her agrees before they have sat down.",
      "{a} is in the room before the rest of them and she has already poured something. Holds it up as the others come in — not a toast, just an acknowledgment that they all just survived the same thing. Somebody laughs. Somebody does not.",
      "She does not say anything at all, which from {a} is the loudest possible entrance. Sits down. Arranges the skirt. Looks at the door like she has some things to get to and is waiting for the audience to assemble.",
    ],
  }),
  ev({
    id: 'still-shaking', phase: 'arrival', cast: 'solo', weight: 2,
    note: 'The adrenaline has not gone anywhere and she cannot sit still.',
    when: f => st(f.a, 'temperament') <= 6, effects: { pop: { a: 1 } },
    lines: [
      "{a} is pacing. Not dramatically — just back and forth in front of the couch, heels still on, running a hand over the back of her neck. She has not sat down. She is not going to sit down for a while.",
      "The adrenaline is still in {a}'s hands. Picks up a glass, puts it down. Adjusts the wig. Starts a sentence and stops it. The queen next to her goes \"breathe\" and {a} goes \"I am breathing\" in a voice that says she recently stopped.",
      "{a} laughs too loud at something that is not funny and everybody hears the nerves underneath it. Crosses and uncrosses her legs three times. Checks the mirror. Checks the mirror again. Whatever happened on that stage is still happening inside her body.",
      "She is sitting but she is not sitting still. Tapping the arm of the couch, bouncing one knee, scanning the door like the results are going to walk through it personally. The other queens have settled. {a} has not.",
    ],
  }),
  ev({
    id: 'pour-one-out', phase: 'arrival', cast: 'pair', weight: 2,
    note: 'One of them makes drinks for both and it is the first kind thing that has happened in an hour.',
    when: f => f.bond >= 0, effects: { bond: 1, pop: { a: 1 } },
    lines: [
      "{a} goes to the bar, makes two, puts one in {b}'s hand without asking what she wants. {b} looks at it, looks at {a}, goes \"thank you\" in a voice that means more than the drink. First thing that has not been a critique in about an hour.",
      "\"You need one of these.\" {a} pours for {b} before {b} has even found a seat. Ice, a pour, passing it across. First gentle thing anyone has done since they left the stage. {b} takes it like a person who needed exactly this.",
      "{a} makes a drink for herself and then makes a second one and carries them both across the room. {b} takes it with both hands. Says nothing for a second. They clink. They drink. The night gets a little easier from here.",
      "\"Sit down, I will get it.\" {a} is already at the bar before {b} can argue. Comes back with two glasses. {b} sips. {a} sits. The room is still sharp but this corner of it is not.",
    ],
  }),
  ev({
    id: 'out-of-the-shoes', phase: 'arrival', cast: 'pair', weight: 2,
    note: 'The look starts coming apart the second they sit down, and the conversation gets more honest with it.',
    when: f => true, effects: { bond: 0.5 },
    lines: [
      "The shoes come off first. {a} kicks them under the couch. {b} does the same. The conversation changes the second the heels are off — looser, realer. {b} unclips something at the back. \"That has been stabbing me since the walk.\"",
      "{b} pulls the wig off and sets it on the arm of the couch like she is putting down a weapon. {a} unpins something at the shoulder. The looks come apart and the guards come down with them. What was two poised queens on stage three minutes ago is two tired people on a couch.",
      "{a} peels off the gloves. {b} unzips the back. The more the look comes off the more honest the conversation gets. By the time {a} is sitting there in the corset and the stockings she is saying things the runway version of her would never say.",
      "\"Get this off me.\" {b} turns so {a} can unzip the back. {a} does it without being asked twice. The look was beautiful on the stage. Off the stage it is a costume, and when it comes off the queens start talking like people.",
    ],
  }),
  ev({
    id: 'what-did-she-mean', phase: 'arrival', cast: 'pair', weight: 2,
    note: 'They replay a specific thing a judge said and try to work out how bad it was.',
    when: f => true, effects: { bond: 0.5, pop: { a: 1 } },
    lines: [
      "\"What did she mean by 'it reads costume'?\" {a} asks. {b} does not know. They spend the next five minutes trying to decode a single sentence from a judge. The more they talk about it the less they agree on whether it was bad or very bad.",
      "{a} replays the judge's exact words. {b} goes \"that is not what she said.\" {a} goes \"that is exactly what she said.\" They go back and forth on the phrasing because it DOES matter — \"it did not work for me\" and \"it is not working\" are two different sentences.",
      "\"She said interesting,\" {a} goes. \"What does interesting mean?\" {b} thinks about it. \"Interesting means they did not hate it but they are not going to save you with it.\" {a} looks at the ceiling. She knew that. She was hoping {b} would say something different.",
      "{b} is trying to remember the exact critique and keeps getting the middle part wrong. {a} corrects her. They argue about the word \"elevated\" for three minutes — did she mean elevate the concept or that she HAD elevated it. By the end neither of them is sure.",
    ],
  }),

  // ══ THE CRITIQUES, RELITIGATED ═══════════════════════════════════════
  ev({
    id: 'i-disagree', phase: 'middle', cast: 'solo', weight: 2,
    note: 'She does not accept the critique and says so, to a room that mostly agrees with the judges.',
    arcs: ['villain', 'frontrunner'], when: f => f.lastCall === 'LOW' || f.lastCall === 'BTM',
    effects: { pop: { a: -1 }, state: 'defiant' },
    lines: [
      "\"I do not agree.\" {a} says it to the room, not quietly. Lays out her case — what she was going for, why the judges did not see it, why that is their problem and not hers. Most of the room thinks the judges were right. {a} does not care.",
      "{a} shakes her head through somebody's recap and finally goes \"that is not what happened up there.\" Describes a whole different version of the evening where her performance was strong and the judges missed the reference. Delivers it with total confidence.",
      "\"They were wrong.\" {a} says it like a fact, not a feeling. Walks through the critique point by point and dismantles each one. The room watches. Some of them are impressed. Some of them think she is delusional. {a} does not look interested in finding out which.",
      "The room is being sympathetic and {a} does not want sympathy. \"I do not need you to feel bad for me, I need you to tell me I am right.\" Nobody says she is right. {a} takes the silence as proof the judges got to them too.",
    ],
  }),
  ev({
    id: 'she-was-right', phase: 'middle', cast: 'solo', weight: 2,
    note: 'She agrees with the judges about herself, out loud, which nobody expects.',
    arcs: ['underdog', 'hero'], when: f => f.lastCall === 'LOW' || f.lastCall === 'BTM',
    effects: { pop: { a: 2 }, state: 'accepted' },
    lines: [
      "\"She was right,\" {a} goes, meaning the judge. The room does a double take because nobody expected that. {a} lays out what she got wrong — specifically, no flinching. Somebody starts to comfort her. She waves it off. She does not need comfort. She needs to be better.",
      "{a} sits on the couch and goes \"I earned that critique.\" Flat calm. The room waits for the but. There is no but. She agrees with the judges, openly, in front of everyone.",
      "\"They saw exactly what I did. I cannot be upset about them calling what I gave them.\" {a} says it flat. Least dramatic thing anyone has said all night and the most powerful. A queen who can own a bad night in front of the room is a queen nobody forgets.",
      "Somebody tells {a} the judges were too harsh. {a} shakes her head. \"No. I would have said the same thing.\" Goes through her performance, names the exact moment it went wrong. Takes the critique without deflecting any of it.",
    ],
  }),
  ev({
    id: 'threw-me-under', phase: 'middle', cast: 'pair', weight: 3,
    note: '{a} confronts {b} for naming her on the main stage. This is the single most reliable Untucked fight.',
    arcs: ['relationship', 'villain'], when: f => f.namedOnStage,
    effects: { bond: -3, pop: { a: 1, b: -2 }, state: 'confronted' },
    lines: [
      "{a} does not sit down. \"You said my name up there.\" {b} starts to explain. {a} lets her get about six words in. \"You said my name. In front of them. When they asked.\" The room goes very quiet.",
      "It takes {a} four minutes to get to it and everybody can feel it coming. When it lands it is not a shout. It is \"I would never have done that to you,\" said calmly, which is worse. {b} does not have an answer that survives being said out loud.",
      "\"Can I ask you something?\" {a} says it in the voice that means it is not a question. {b} goes sure. {a} asks her to repeat what she said on the stage. {b} repeats a much gentler version. {a} goes \"that is not what you said.\" Temperature drops ten degrees.",
      "{b} tries to get ahead of it — \"before you say anything\" — and {a} goes \"no, you go ahead, finish it\" and folds her arms. Whatever {b} prepared on the walk backstage does not survive contact with {a} sitting there waiting for it.",
    ],
  }),
  ev({
    id: 'defends-herself', phase: 'middle', cast: 'pair', weight: 2,
    note: '{b} explains why she said it, and it is not a bad reason, which makes it worse.',
    when: f => f.namedOnStage, effects: { bond: 1, pop: { b: 1 } },
    lines: [
      "\"They asked me who should go home and I was not going to lie.\" {b} says it without apology. The thing is — {b} has a point. The judges asked. Somebody has to answer. {b} answered honestly. {a} does not have to like it but she cannot call it unfair.",
      "{b} does not back down. \"What was I supposed to do, say nobody?\" Walks {a} through the moment — the question, the spotlight, the three seconds to decide. By the end the defence is better than the attack. {a} did not expect that.",
      "\"I said what I saw.\" {b} says what she saw — specifically, in detail, about {a}'s performance. Not mean. Just accurate. Accuracy is harder to fight than cruelty. {b} does not apologise because she has nothing to apologise for.",
      "{b} explains her reasoning. It is calm. It is specific. That is the worst part — {a} wanted it to be malicious because malicious is easy to dismiss. Instead it is a thoughtful answer and the answer was {a}'s name.",
    ],
  }),
  /* ── WEIGHING IN AND BACKING UP ARE OPPOSITE SCENES ──
     These were one event with one `effects` block, and its four lines did not
     agree about what had happened. One of them has {b} turning ON {a}; the
     other three have {a} taking {b}'s SIDE against a queen at the far end of
     the couch — "{b} looks relieved to have backup", "{b} goes thank you".
     The single bond effect was -1.5 for all four, so three nights in four the
     badge said the pair had fallen out on a card describing one of them
     defending the other. Riot got -1.5 with Sharon Needles for having Sharon's
     back.
     A pool whose lines disagree about the outcome cannot share one effect. */
  ev({
    id: 'the-room-takes-sides', phase: 'middle', cast: 'pair', weight: 1,
    note: 'A third queen weighs in on somebody else\'s argument and both of them turn on her.',
    arcs: ['narrator'], when: f => f.bond <= 2 && f.tension,
    effects: { bond: -1.5, pop: { a: -1 } },
    lines: [
      "{a} has been watching the argument for three minutes and decides she has an opinion. Delivers it to both of them at once. {b} turns on her. Now it is {a}'s fight too and she was not prepared for that.",
      "{a} offers a take nobody asked for. {b} turns round slowly. \"I am sorry \u2014 are you in this?\" {a} opens her mouth. Closes it. The answer is yes now, whatever she says next.",
      "\"If I can be honest\u2014\" and {a} is already wrong, because the two of them stop arguing with each other to look at her instead. Nothing unites a room like an outsider with an opinion. {a} finishes the sentence into a silence she is going to remember.",
      "{a} tries to referee. Says something even-handed about both of them having a point. {b} takes it as a verdict and does not like the verdict. \"Do not do that. Do not do the calm voice.\" The calm voice was the only thing {a} had.",
    ],
  }),
  ev({
    id: 'takes-her-side', phase: 'middle', cast: 'pair', weight: 2,
    note: 'She jumps into somebody else\'s argument on her side, and picks up the enemy that comes with it.',
    arcs: ['narrator'], when: f => f.bond <= 2 && f.tension,
    /* SHE GAINED AN ALLY AND IT COST HER. The bond is with the queen she stood
       up for — that is the whole event. The audience mark stays negative
       because leaping into a fight that was not yours reads as mess however
       loyal the motive, and the queen on the other end is not in the pair, so
       there is nobody else to take a bond off. */
    effects: { bond: 1.5, pop: { a: -1 } },
    lines: [
      "\"Can I say something?\" {a} does not wait for permission. Takes {b}'s side, loudly. The queen on the other end goes \"nobody asked you\" with enough venom that {a} flinches. She is in it now. She chose to be in it.",
      "{a} weighs in from the couch. What was a fight between two is now a fight with an audience that is also a participant. {b} goes \"thank you.\" The other queen goes \"stay out of it.\" {a} does not stay out of it.",
      "It is not {a}'s argument. It becomes {a}'s argument the moment she goes \"well actually\" from the other end of the couch. {b} looks relieved to have backup. The other queen looks furious to be outnumbered. {a} has taken a side and now she has to live on it.",
      "\"She is right, though.\" {a} says it to the room rather than to either of them, which is the loudest way to say it. {b} does not thank her out loud. The look does that. Somewhere behind {a} a queen decides something about her that is going to last the rest of the season.",
    ],
  }),
  ev({
    id: 'safe-and-invisible', phase: 'middle', cast: 'solo', weight: 2,
    note: 'She was called safe again and is realising that safe is not a compliment.',
    arcs: ['filler', 'weakness'], when: f => f.lastCall === 'SAFE',
    effects: { pop: { a: -1 }, state: 'restless' },
    lines: [
      "\"Safe.\" {a} says it like she is tasting the word and it has gone off. She was sent to the back before the critiques even started. The judges had nothing to say to her. Safe is the most dangerous thing she could be.",
      "{a} watches the queens who were critiqued rehash their notes. She has nothing to rehash. She was safe. She was told to leave the stage. The judges did not have a single opinion about her and that is starting to feel less like survival and more like erasure.",
      "Somebody asks {a} how she feels about being safe. {a} goes \"fine\" in a voice that means the opposite. She is backstage while the bottom queens get all the attention, including the sympathy, and she cannot even be upset about it.",
      "\"I would rather they told me I was terrible,\" {a} goes, and she means it. At least terrible is a reaction. At least terrible means they looked at her. Safe means they did not look.",
    ],
  }),
  ev({
    id: 'safe-and-relieved', phase: 'middle', cast: 'solo', weight: 2,
    note: 'She was safe and is perfectly happy about it, which some of the room finds infuriating.',
    when: f => f.lastCall === 'SAFE', effects: { pop: { a: 1 } },
    lines: [
      "\"Safe is fine with me.\" {a} means it completely. Pours a drink, puts her feet up, watches the drama from the best seat in the room. She was not critiqued. She was not in danger. She is having a lovely evening.",
      "{a} is on the couch with her shoes off, drink in hand, watching two queens argue about who deserved the bottom. She looks like a person watching a show about somebody else's problems. She was safe. Exciting tonight meant crying on the main stage.",
      "The room is full of queens processing bad news and {a} is not one of them. She was safe. She has made peace with safe the way you make peace with a Tuesday — not memorable, not a disaster. Sips her drink. Lets the drama happen around her.",
      "\"I will take safe,\" {a} goes, to a room that is mostly on fire. She means it. Some weeks you fight for the win and some weeks you survive. Tonight {a} survived. The queens in the bottom are looking at her like she is from a different show.",
    ],
  }),

  // ══ THE WINNER, AND HOW THAT LANDS ═══════════════════════════════════
  ev({
    id: 'congratulations-meant', phase: 'arrival', cast: 'pair', weight: 2,
    note: '{b} congratulates {a} on a strong night and absolutely means it.',
    arcs: ['hero'], when: f => (f.callA === 'WIN' || f.callA === 'HIGH') && f.bond >= 1,
    effects: { bond: 1.5, pop: { b: 1 } },
    lines: [
      "{b} hugs {a} before {a} has even sat down. \"You deserved that.\" Means it so completely that {a} starts crying, which she was not going to do. When they pull apart {b} goes \"condragulations, bitch\" and they both laugh.",
      "\"I am so proud of you.\" {b} says it looking {a} in the eye. She is not performing — she is just happy, for {a}, genuinely. Rarest thing in a room full of queens who all want the same thing.",
      "{b} brings {a} a drink and goes \"you ate that\" with enough conviction that {a} believes it. They sit together. {b} asks what the judges said, detail by detail, and actually listens because the good news belongs to someone she cares about.",
      "{b} catches {a} backstage. \"That was yours from the second you walked out.\" {a} goes \"you think?\" {b} goes \"girl, nobody else was close.\" The warmth between them is the kind that competition usually burns off but has not. Not yet.",
    ],
  }),
  ev({
    id: 'congratulations-not-meant', phase: 'arrival', cast: 'pair', weight: 2,
    note: 'Same words, said with a smile, and everybody hears what is underneath.',
    arcs: ['villain'], when: f => (f.callA === 'WIN' || f.callA === 'HIGH') && f.bond <= 0,
    effects: { bond: -1, pop: { b: -1 } },
    lines: [
      "\"Good for you,\" {b} goes, with a smile so perfect it could be in a commercial. Every queen in the room hears the knife underneath it. {a} says thank you. She heard it too.",
      "{b} congratulates {a} and does it in front of the whole room, which makes it impossible to be anything but gracious. The hug lasts exactly the right amount of time and not a second longer. {a} accepts it the way you accept a gift you know is not a gift.",
      "\"Condragulations,\" {b} goes to {a}, and the word lands with the exact inflection of someone who has practised saying it without venom and has almost succeeded. Almost. The room hears two queens being polite at each other, which is different from two queens being kind.",
      "{b} raises a glass to {a}. \"You killed it.\" The brightness in her voice has effort in it and the effort tells the room everything. {a} clinks. She knows. {b} knows she knows.",
    ],
  }),
  ev({
    id: 'winning-too-much', phase: 'middle', cast: 'pair', weight: 2,
    note: 'Somebody says out loud that {a} keeps winning, and it is not admiration.',
    arcs: ['frontrunner'], when: f => f.winsA >= 2,
    effects: { bond: -1, pop: { a: 1 } },
    lines: [
      "\"How many is that now?\" {b} asks, and counts on her fingers. The counting is the read. {a} does not answer because the answer would make it worse.",
      "{b} goes \"must be nice\" in the space between sips and the sentence sits there for the rest of the night. {a} says nothing. She keeps winning. The room keeps noticing. The noticing has an edge now.",
      "\"The judges love you,\" {b} goes — phrased as an observation, delivered as an accusation. {a} tries to deflect. \"I just showed up.\" {b} goes \"yeah, you showed up every week\" and the compliment folds back on itself.",
      "{b} makes a joke about {a} getting a permanent spot on the panel. Two queens laugh. {a} laughs too. But the joke is a door and behind the door is resentment and everybody can hear the hinges. {a} stops laughing first.",
    ],
  }),
  ev({
    id: 'gracious-in-front', phase: 'middle', cast: 'solo', weight: 1,
    note: 'She had a great night and deliberately does not make the room about it.',
    arcs: ['hero', 'frontrunner'], when: f => f.lastCall === 'WIN' || f.lastCall === 'HIGH',
    effects: { pop: { a: 2 } },
    lines: [
      "{a} had a great night and is not making the room about it. Congratulates someone else first. Asks a queen in the bottom how she is feeling. Pours a drink for the table instead of toasting herself. The room notices.",
      "She could be gloating. She is not. {a} is sitting in the corner nursing a drink, letting the conversation happen around other people. Somebody brings up her win. She goes \"I got lucky this week\" with enough sincerity that the room believes it.",
      "{a} changes the subject every time her name comes up. Steers the conversation toward the queens who need the room's attention more than she does. The discipline of not being loud about the best night of her run is the most impressive thing she does all evening.",
      "The win is {a}'s and she wears it light. Does not mention the judges. Does not mention the critique. Asks the room about their nights instead. On a night where {a} has every right to be the loudest person here, she is the quietest.",
    ],
  }),

  // ══ THE TWO WHO ARE ABOUT TO FIGHT ═══════════════════════════════════
  ev({
    id: 'sitting-with-it', phase: 'middle', cast: 'solo', weight: 3,
    note: 'She knows she is lip syncing and has gone somewhere else in her head.',
    when: f => f.inBottom, effects: { pop: { a: 1 }, state: 'bracing' },
    lines: [
      "{a} is on the couch and she has gone somewhere else. Body in the room, eyes on the wall. Nobody is speaking to her because everyone can see she is already in the lip sync in her head. Running through songs. Doing the thing you do before a fight.",
      "The room is talking and {a} is not part of it. Sitting with a drink she has not touched, doing the maths — what is the song, do I know it, what can I do, can I move in this. She has not blinked in about forty seconds.",
      "{a} has gone quiet in a way that changes the room. Not crying. Not performing. Just sitting there with her hands in her lap and her jaw set. The other queens give her space because the space is not for comfort — it is for whatever she needs to build before the stage.",
      "\"I am going to have to fight for it,\" {a} goes, to nobody, like she is telling herself something she already knew. Sits up straighter. Checks the shoes. Checks the range of movement in the dress. She is getting ready.",
    ],
  }),
  ev({
    id: 'both-of-us', phase: 'middle', cast: 'pair', weight: 3,
    note: 'The two who are about to lip sync against each other, being decent about it.',
    arcs: ['hero', 'relationship'], when: f => f.bothInBottom && f.bond >= 0,
    effects: { bond: 2, pop: { a: 1, b: 1 } },
    lines: [
      "{a} and {b} are sitting next to each other. Neither of them wanted to be here. {a} goes \"I am not going to hold back.\" {b} goes \"I do not want you to.\" They mean it. Saddest kind of respect — two people who like each other agreeing to fight.",
      "\"We are both in it.\" {a} says it. {b} nods. They sit with that for a minute without filling the silence. Been good to each other all season and now they are about to lip sync against each other. {a} squeezes {b}'s hand once. {b} squeezes back.",
      "{b} goes \"one of us is going home tonight.\" {a} goes \"I know.\" They look at each other — two queens who would rather fight literally anyone else. They do not hug. Hugging would make it feel like a goodbye.",
      "Side by side, both in the bottom. {a} goes \"give them a show.\" {b} goes \"you too.\" Two queens about to try to end each other's run, being kind about it first. That is the thing the room remembers longer than whoever wins.",
    ],
  }),
  ev({
    id: 'not-going-easy', phase: 'middle', cast: 'pair', weight: 2,
    note: 'The two about to lip sync, being anything but decent about it.',
    arcs: ['villain', 'relationship'], when: f => f.bothInBottom && f.bond <= 0,
    effects: { bond: -2, pop: { a: -1 } },
    lines: [
      "\"I am going to send you home.\" {a} says it looking at {b}. Not a read — a promise. {b} says nothing. The room says nothing. {a} sits back and the silence does not have a joke at the end of it.",
      "{a} and {b} are on opposite ends of the couch. Neither has spoken since they sat down. {a} looks at {b} once — long look, the kind you give someone you intend to beat. {b} looks back the same way. The lip sync has already started in this room.",
      "\"You know I can perform,\" {a} goes, aimed at {b}. {b} goes \"so can I\" with a flatness that is scarier than volume. They are not being decent about it. Not pretending this is not personal. Neither of them cares that the room is watching.",
      "{a} goes \"may the best queen win\" and the way she says it makes it clear she thinks that queen is her. {b} smiles. Nothing warm in it. The air between them could cut glass.",
    ],
  }),
  ev({
    id: 'i-know-the-song', phase: 'late', cast: 'solo', weight: 2,
    note: 'She finds out what the song is and either that is very good news or it is not.',
    arcs: ['performance'], when: f => f.inBottom, effects: { pop: { a: 1 } },
    lines: [
      "Somebody tells {a} what the song is and her face changes. She knows it. Every word. Knows where the chorus hits, where the bridge drops, exactly what she is going to do on the second verse. \"I got this.\" The confidence is so sudden the room believes her.",
      "{a} hears the song title and closes her eyes and starts mouthing the words right there on the couch. Every queen can see the lip sync forming in her head. She opens her eyes and she looks different. She looks like a queen who just found out the fight is on her turf.",
      "The song comes through and {a}'s face falls. She does not know it. Goes very still. Starts trying to remember the chorus from somewhere — anywhere. The effort is visible. The room sees it. The room does not say anything.",
      "{a} finds out what the song is and goes \"oh\" in a voice that could mean anything. Starts humming it under her breath, testing whether she has it. The hum comes and goes. She has some of it but not all of it. She has about ten minutes to find the rest.",
    ],
  }),
  ev({
    id: 'talk-me-through-it', phase: 'late', cast: 'pair', weight: 2,
    note: 'Somebody not in the bottom coaches somebody who is, minutes before she has to do it.',
    arcs: ['hero'], when: f => f.bInBottom && f.bond >= 2,
    effects: { bond: 2, pop: { a: 2 } },
    lines: [
      "{a} sits {b} down. \"Forget the choreo. Forget being perfect. Just feel the song and let them see you feeling it.\" Says it like a coach, not a friend, because right now {b} does not need a friend — she needs someone who knows how to survive this.",
      "\"Look at me.\" {a} takes {b}'s hands and makes her breathe. \"You know the words. You know the song. Get out there and remind them why you are here.\" {b} nods. Looks steadier. {a} does not let go until {b} looks like a queen who can walk onto a stage and fight.",
      "{a} goes through the song with {b} line by line. Where to build, where to hold back, where to hit the turn. She is not in the bottom. She has nothing to gain from this. She is doing it because {b} needs it.",
      "\"Show them something real. Do not try to win. Try to make them feel something.\" {b} listens hard. {a} gives her the map — the song, the shape of it, the moment to push. By the time they are called back {b} looks like somebody who has a plan.",
    ],
  }),

  // ══ THE EMOTIONAL FLOOR ══════════════════════════════════════════════
  ev({
    id: 'it-all-arrives', phase: 'middle', cast: 'solo', weight: 2,
    note: 'She has been holding it since the stage and stops holding it.',
    arcs: ['narrator', 'representation'], when: f => st(f.a, 'temperament') <= 5,
    effects: { pop: { a: 2 }, state: 'fragile' },
    lines: [
      "{a} has been holding it since the stage. Held it on the walk back. Held it through the first ten minutes. She is not holding it anymore. The tears come the way tears come when you have been fighting them — messy, fast. The room lets her have it.",
      "It starts with a breath that goes wrong. {a} tries to say something and the sentence breaks in the middle. What comes out instead is all of it — the critique, the pressure, the weeks, the wanting it. She puts her hands over her face. The room goes still.",
      "{a} is fine and then she is not fine and the transition is about two seconds. Starts crying the way people cry when they did not plan to — messy, honest, no warning. The mug is going. She does not care about the mug.",
      "\"I am okay,\" {a} goes, and then immediately proves herself wrong by crying so hard she cannot finish the sentence. She is not okay. Everybody can see it. The room does not try to fix it. Just sits with it.",
    ],
  }),
  ev({
    id: 'somebody-sits-down', phase: 'middle', cast: 'pair', weight: 3,
    note: '{a} goes to {b} without being asked. The room lets them have it.',
    arcs: ['hero'], when: f => f.bond >= 0, effects: { bond: 2, pop: { a: 2 } },
    lines: [
      "{a} does not say anything. Gets up, crosses the room, sits down next to {b}. Close enough that their arms are touching. {b} does not look at her. {a} does not speak. She is just there.",
      "{a} sees {b} losing it from across the room and goes to her. No announcement, no fuss. Sits down, puts a hand on {b}'s back, and waits. {b} starts talking when she is ready. {a} does not rush her.",
      "Nobody asked {a} to go over there. She watches {b} for about thirty seconds, puts her drink down, walks across the room and sits on the arm of the couch. \"I am here.\" Means it literally.",
      "{a} brings a box of tissues and a drink and puts both within {b}'s reach without saying a word. Sits. {b} cries. {a} does not try to talk her out of it or through it. The room gives them the space.",
    ],
  }),
  ev({
    id: 'why-im-here', phase: 'middle', cast: 'solo', weight: 2,
    note: 'She says what this actually means to her, and it is not about the crown.',
    arcs: ['representation', 'underdog'], when: f => true,
    effects: { pop: { a: 3 } },
    lines: [
      "Somebody asks {a} why she is here and she gives the real answer. Not the stage version. It is about a kid in her town who saw her perform once and told her she was the first queen that kid had ever seen. {a} said she would go as far as she could so that kid could see her go there. The room goes quiet.",
      "\"I am not doing this for the crown.\" {a} says it and it sounds like a line until she explains what she IS doing it for — specific, personal, a promise she made to someone she loves. The room did not expect to be moved this hard on a night that started with a read.",
      "{a} talks about where she comes from. Not the polished version. The version where drag was the only thing that made sense, where this show was the thing she watched when nothing else was good. Being here is not a career move — it is the thing she has been working toward since she was young enough to know and scared enough to hide it.",
      "It comes out sideways — {a} is answering a question about the challenge and the answer turns into something bigger. What drag gave her when nothing else did. By the end of the sentence the room is not a room full of queens backstage — it is a room full of people who all came from the same kind of somewhere.",
    ],
  }),
  ev({
    id: 'someone-at-home', phase: 'middle', cast: 'solo', weight: 1,
    note: 'She talks about a person who is not in the room.',
    arcs: ['representation'], when: f => st(f.a, 'loyalty') >= 6,
    effects: { pop: { a: 3 } },
    lines: [
      "{a} talks about someone at home. Not the version she tells interviewers — the real version. The challenge does not matter for about ninety seconds. The person {a} is talking about matters.",
      "\"She told me to go,\" {a} goes, about someone who is not here. The way she says it makes it clear that leaving was the hardest part. Describes the goodbye — specific, messy, real. Everyone in this room left someone behind. Nobody has said it this plainly.",
      "{a} brings up a name the room has never heard. Tells them about a person who believed in her before she believed in herself. Not a sad story — a grateful one. The queen next to her puts a hand on her arm and lets it stay.",
      "\"I think about them every night,\" {a} goes, and she does not specify who. The room does not ask. {a} has someone she is carrying with her through this and the carrying shows.",
    ],
  }),
  ev({
    id: 'the-room-goes-soft', phase: 'middle', cast: 'pair', weight: 1,
    note: 'One honest thing turns the whole room from a fight into a group of people.',
    when: f => true, effects: { bond: 1.5, pop: { a: 1 } },
    lines: [
      "{a} says one honest thing and the whole room changes. Not a big speech — a sentence, said quietly, about something real. The fight that was building evaporates because nobody can go back to being sharp after hearing something that true.",
      "The room is tense and {a} says something that is not about the challenge, not about the critiques. Something about why she is scared. The fear is so recognisable that every queen in the room stops performing and starts being a person.",
      "{a} breaks the tension by accident. She is not trying to. Just says a thing about herself that is so unguarded that the queen who was about to argue puts her drink down and goes \"yeah. Me too.\" Another queen says it. The room is a different room.",
      "It takes one sentence. {a} says it — about missing someone, about being tired, about the weight of wanting something this badly. The sentence does what an hour of arguing could not. The room softens. {b} touches her arm. Somebody pours another round.",
    ],
  }),

  // ══ TEETH ════════════════════════════════════════════════════════════
  ev({
    id: 'say-it-to-my-face', phase: 'middle', cast: 'pair', weight: 2,
    note: 'Something said in the werk room this week gets repeated back to her, verbatim.',
    arcs: ['villain', 'relationship'], when: f => f.bond <= -2,
    effects: { bond: -2.5, pop: { a: 1 } },
    lines: [
      "\"You said I was the weakest one in here.\" {a} repeats it word for word. {b}'s face changes. She did say it. Three days ago. She did not think it would come back with a receipt.",
      "{a} has been waiting for this. Quotes {b} back to herself — exact words, exact tone, practically the exact hand gesture. {b} sits there hearing her own opinion returned to her in a room where she cannot deny it. \"Am I lying?\" {b} does not answer. {b} is not lying.",
      "\"Tell her what you told me,\" {a} goes, pointing at {b}. {b} goes pale. The thing she said in the werkroom about {a}'s talent was specific and unkind and she said it to the wrong person. The queen she told is watching from the couch. {b} has no cover.",
      "{a} repeats the werkroom conversation line by line. {b} tries to stop her. {a} does not stop. Delivers {b}'s own critique right back to {b}'s face in front of the room. \"That is what you said. That is exactly what you said.\" It is.",
    ],
  }),
  ev({
    id: 'who-should-go', phase: 'middle', cast: 'pair', weight: 2,
    note: 'Somebody says out loud who she thinks deserves to go home, and that queen is in the room.',
    arcs: ['villain'], when: f => f.canScheme,
    effects: { bond: -2, pop: { a: -2 } },
    lines: [
      "\"Who should go home?\" Somebody asks. {a} answers it — here, backstage, with the queen she names sitting eight feet away. {b} looks up. {a} does not look away.",
      "{a} says {b}'s name. Not on the main stage — here, backstage, unprompted. {b} goes \"are you serious.\" {a} goes \"yes.\" The room divides in real time between queens who think she is brave and queens who think she is cruel.",
      "\"I think she should go.\" {a} says it about {b} while {b} is refilling a drink three feet away. The sentence reaches {b} at the same time as the glass reaches her lips. She puts the glass down. {a} does not backpedal.",
      "{a} does not wait for the question. Announces it to the room — who she thinks should go home and exactly why. The queen she is talking about is in the room. {b} listens to the whole thing before saying a word. That takes strength {a} did not anticipate.",
    ],
  }),
  ev({
    id: 'the-read-lands', phase: 'middle', cast: 'pair', weight: 2,
    note: 'A joke that is genuinely funny and genuinely cruel, and the room cannot decide.',
    arcs: ['narrator', 'villain'], when: f => dragOf(f.a).comedy >= 7,
    effects: { bond: -1, pop: { a: 2 } },
    lines: [
      "{a} lands a read on {b} so funny two queens spit their drinks and so mean the laughter has a wince in it. The joke is perfect. The cruelty is real. {b} laughs because what else can she do, but the laugh is armour.",
      "The read is four words long. Takes the room three seconds to process it. Then everybody loses it at once. {a} delivers it deadpan, like she is ordering food. {b}'s face goes through shock, then hurt, then the decision to laugh. It was funny. It was also not kind.",
      "{a} says one sentence about {b} that is technically a joke and technically an assassination. The room cannot decide whether to laugh or gasp so it does both. {b} is laughing too — queens laugh when they are read, it is the law — but the laughter does not reach her eyes.",
      "\"Girl — \" and then {a} says something about {b}'s performance tonight that is so brutally accurate it might be art. The room SCREAMS. {b} puts her face in her hands, half laughing, half dying. Best read of the season and also the unkindest.",
    ],
  }),
  ev({
    id: 'told-to-stop', phase: 'middle', cast: 'pair', weight: 1,
    note: 'A third queen tells them both to stop, and one of them listens.',
    arcs: ['hero'], when: f => f.tension, effects: { bond: 1, pop: { a: 1 } },
    lines: [
      "\"Enough.\" {a} says it once from the couch and both of them stop mid-sentence. Does not take a side. \"You are both better than this.\" The shame of that cools the room faster than any apology.",
      "{a} stands up between them. \"Not tonight.\" One of them opens her mouth. {a} goes \"I said not tonight\" and the mouth closes. The room exhales. {a} sits back down like she did not just end a war.",
      "\"Can we stop?\" {a} says it without raising her voice, which is why it works. Not yelling over them — asking. One of them nods. The other one takes a breath and picks up her drink. Not resolved. Just over, for now.",
      "{a} looks at both of them. \"We are about to walk back out there, and this is not how we are walking back out.\" Most practical thing anyone has said all night. Works because it is true.",
    ],
  }),
  ev({
    id: 'walks-out', phase: 'middle', cast: 'solo', weight: 1,
    note: 'She leaves the room rather than say what she is about to say.',
    when: f => st(f.a, 'temperament') <= 4, effects: { pop: { a: 1 }, state: 'withdrew' },
    lines: [
      "{a} stands up, puts her glass down, walks out without saying a word. Does not slam anything. Does not announce it. Just leaves. The door closing behind her is quieter and more devastating than anything she could have said.",
      "The sentence is halfway out of {a}'s mouth when she stops. Closes her eyes. Decides not to say it. Stands, walks to the door, goes through it. Everybody knows what the thing was.",
      "{a} can feel herself about to say something she cannot take back. Looks at the ceiling, breathes. \"I need a minute.\" Leaves. When she comes back she is calmer, which means whatever she was going to say is still in her body, just folded smaller.",
      "She does not explain it. {a} just gets up mid-conversation, walks out, stands in the hallway for five minutes. Comes back, sits in a different seat, does not look at the person she was about to argue with. The relocation is the statement.",
    ],
  }),
  ev({
    id: 'the-apology', phase: 'late', cast: 'pair', weight: 2,
    note: 'Before they are called back, one of them fixes it.',
    arcs: ['hero', 'relationship'], when: f => f.bond <= -1,
    effects: { bond: 3, pop: { a: 2 }, state: 'mended' },
    lines: [
      "{a} crosses the room before they are called back. Sits next to {b}. \"I am sorry.\" Not \"sorry but.\" Not \"sorry if.\" Just the words. {b} takes a moment and nods. \"Okay.\" Not perfect, but a door opening instead of closing.",
      "\"I was wrong to say that.\" {a} says it quick, like she has been working up to it. Then says WHY she was wrong, specifically. That is the part that makes it real. {b} does not forgive her immediately but the fact that {a} named the thing means there is something to forgive.",
      "{a} pulls {b} aside before they walk back out. \"What happened in here tonight was on me and I know it.\" {b} goes \"it was on both of us.\" {a} goes \"no, it was on me.\" The fact that she will not let {b} share the blame is the part {b} will remember.",
      "\"I do not want to go back out there with this between us.\" {a} says it plain. {b} looks at her for a long time. Something in {b}'s face softens. They do not hug. {b} goes \"thank you for saying that\" and they walk toward the door on better terms than they sat down on.",
    ],
  }),
  ev({
    id: 'no-apology', phase: 'late', cast: 'pair', weight: 1,
    note: 'It is not fixed, and they are about to have to stand next to each other.',
    arcs: ['villain'], when: f => f.bond <= -4,
    effects: { bond: -1, state: 'frost' },
    lines: [
      "{a} and {b} are sitting three chairs apart. Neither has moved since it happened. Somebody asks if they are alright. {a} goes \"I am fine\" in a tone that means \"do not.\" {b} says nothing at all, which is worse.",
      "The door to the stage is going to open any minute and they will have to walk through it side by side and smile. Neither of them is practising the smile. {b} is reapplying lip liner with the focus of somebody defusing a device. {a} is watching {b} in the mirror. Not blinking.",
      "{a} picks up her drink, walks past {b} without looking at her, sits at the other end of the lounge. {b} watches her go. Turns back to the mirror. Whatever that was, it is still that, and it is going to be that on the stage too.",
      "There is a version of this where {a} says something before they go back out and it is fine. This is not that version. {a} is staring at the wall. {b} is laughing too loudly at somebody else's joke. The room can feel both of them deciding, separately, that the other one started it.",
    ],
  }),

  // ══ CALLED BACK ══════════════════════════════════════════════════════
  ev({
    id: 'lipstick-check', phase: 'late', cast: 'pair', weight: 2,
    note: 'Everybody repairs their face at once, because they are going back out there.',
    when: f => true, effects: { bond: 0.5, pop: { a: 1 } },
    lines: [
      "{a} pulls a compact out of somewhere — nobody saw where — and starts fixing the damage. {b} leans over. \"You have got a line here.\" Touches her own cheek to show where. They have been arguing for twenty minutes but the face comes first. Always.",
      "\"I look like I have been crying.\" Accurate, because she has been crying. {b} hands her a wipe. \"You look like you have been feeling things on television, which is what we are here for.\" {a} laughs. The laugh helps more than the wipe.",
      "{a} and {b} end up at the same mirror at the same time. Fixing lips and lashes side by side, elbows almost touching. Neither acknowledges it. You do not go back on that stage without your face right, and you do not let anybody else go back without theirs right either.",
      "{b} goes \"hold still\" and fixes something on {a}'s lash that {a} could not see. Takes four seconds. {a} goes \"thank you\" and means it beyond the lash. {b} goes \"of course\" and means it beyond the lash too.",
    ],
  }),
  ev({
    id: 'called-back', phase: 'late', cast: 'solo', weight: 2,
    note: 'The call comes and the room changes back into competitors.',
    when: f => true, effects: { pop: { a: 1 }, state: 'sober' },
    lines: [
      "The call comes and {a} stands up before anybody else. Tugs her dress down. Rolls her shoulders back. She is somebody else before she reaches the door. The queen on that couch five seconds ago does not exist on the main stage.",
      "\"That is us.\" {a} puts her drink down with a click that is louder than it needs to be. Heels go back on. Posture changes. {a} checks her reflection one last time and decides it will do.",
      "{a} hears the call and her whole body changes. Spine straighter, chin higher, eyes wider. She was slouched against the arm of the couch thirty seconds ago talking about nothing. Now she is a queen walking onto a stage. Both versions are real. This is the one that gets judged.",
      "The door opens and {a} does not rush. Takes a breath, smooths the front of her outfit, walks toward the stage. Whatever they decided in there, she is going to hear it standing up.",
    ],
  }),
  ev({
    id: 'one-last-look', phase: 'late', cast: 'pair', weight: 1,
    note: 'Two queens catch each other in the mirror on the way out and neither says anything.',
    when: f => f.bond >= 2, effects: { bond: 1 },
    lines: [
      "{a} and {b} catch each other in the mirror on the way to the door. Hold the look for one second longer than normal. Neither says anything. Neither needs to.",
      "The room is moving toward the door. {a} glances sideways and finds {b} already looking at her. {b} raises one eyebrow — not a question, just acknowledgement. {a} nods once. That is the entire conversation. It is enough.",
      "{a} is the last one through the door. {b} is holding it open. They do not speak. {b} tilts her head toward the stage — after you. {a} walks past. {b} follows. Whatever happened in this room stays in this room.",
      "On the way out {a} and {b} end up shoulder to shoulder in the doorway. For a moment neither moves. {a} looks at {b}. {b} looks at {a}. Something in both their faces that is too complicated to say out loud. They walk out together.",
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
      "It has been a long time. {a} is pretending not to notice. Picks up her drink, puts it down, picks it up again. \"They are arguing about us in there,\" she goes to nobody in particular.",
      "{a} is sitting very still on the couch. That is how you can tell she is not calm at all. When the deliberation runs long it means somebody on the panel disagrees. {a} is running through every critique trying to figure out which way the argument is going.",
      "\"How long has it been?\" {a} asks. Three queens check the clock at once, which means everybody is counting. {a} laughs — \"okay so it is not just me.\" Somebody goes \"it is never just you.\" The room relaxes for two seconds before going quiet again.",
      "The longer they wait the louder {a}'s knee bounces against the arm of the couch. She is not aware she is doing it. She IS aware that a long deliberation means the call was close, and a close call means somebody she thought was safe is not.",
    ],
  }),
  ev({
    id: 'guessing-the-verdict', phase: 'late', cast: 'pair', weight: 2,
    note: 'They try to call it between them, and one of them is confidently wrong.',
    when: f => true, effects: { bond: 0.5, pop: { a: 1 } },
    lines: [
      "\"I think I know who is in the bottom.\" {a} names two queens with total confidence. {b} nods along and then goes \"I think it is actually you\" with a smile that softens the blow but does not remove it. {a} laughs. \"Do not.\" They both look at the door.",
      "{a} and {b} are running through the critiques, doing the maths. \"She got the note about the hem,\" {a} goes, \"and you know what that means.\" {b} goes \"I do not know what that means.\" {a} goes \"it means the hem was wrong\" with an expression that says keep up.",
      "\"Who do you think won?\" {b} asks. {a} answers immediately, wrongly, and with total conviction. {b} disagrees but does not say so because {a} is already explaining her theory at a pace that does not leave room for disagreement.",
      "\"I am going to tell you what is going to happen and you are going to tell me I am wrong and then it is going to happen exactly like I said.\" {b} goes \"go on then.\" {a} lays out a prediction that accounts for everything except the one critique she did not hear — which is the one that mattered.",
    ],
  }),
  ev({
    id: 'good-luck-out-there', phase: 'late', cast: 'pair', weight: 2,
    note: 'Whatever has happened in this room, they are about to go and stand together.',
    when: f => true, effects: { bond: 1 },
    lines: [
      "{a} turns to {b} on the way to the door. \"Good luck out there.\" Means it. Not the performative version — the real one. {b} goes \"you too\" and squeezes her arm.",
      "\"Whatever happens — \" {a} starts. {b} finishes: \"we came here and we did it.\" {a} nods. They do not need to say anything else. One of them might go and neither is pretending that is not true.",
      "{b} catches {a} by the elbow near the door. \"Hey. You were good tonight. Whatever they say.\" {a} blinks twice and goes \"so were you\" fast enough that she was clearly thinking it already.",
      "{a} goes \"I hope it is not you\" quietly, like she does not want the room to hear. {b} goes \"I hope it is not you either.\" They look at each other with the kind of honesty that only exists when you are about to walk into a verdict.",
    ],
  }),
  ev({
    id: 'putting-the-face-back', phase: 'late', cast: 'solo', weight: 2,
    note: 'She has cried it off and has about ninety seconds to be somebody else.',
    when: f => true, effects: { pop: { a: 1 } },
    lines: [
      "{a} has ninety seconds and a mirror. Works fast — concealer first, then powder, then the lip, then the lash. By the time she is done you would not know she had been crying unless you looked at her eyes.",
      "She wipes everything off and starts again. There is no time to start again. {a} starts again anyway because the face she had on was the face of somebody who had been told bad news, and the face she needs is the face of somebody who can take it. Finishes with eleven seconds to spare.",
      "{a} is rebuilding her mug — systematic, fast, no wasted motion. Somebody offers to help. {a} goes \"I have got it\" without looking up because looking up would mean stopping and stopping would mean thinking about what she looks like right now.",
      "The mirror shows the damage and {a} fixes it layer by layer. Primer. Powder. Liner. When she clicks the compact shut and stands up she looks like a person who has not cried in years. That is a kind of drag all by itself.",
    ],
  }),
  ev({
    id: 'last-word', phase: 'late', cast: 'pair', weight: 1,
    note: 'One of them gets the final line in on the way out of the room.',
    arcs: ['villain', 'narrator'], when: f => f.bond <= 2,
    effects: { bond: -1, pop: { a: 1 } },
    lines: [
      "{a} is almost through the door when she turns around and says something to {b}. The room does not quite catch it. {b} catches it. {a} turns back and walks out without waiting for a response. That is the whole point of a last word.",
      "\"See you out there,\" {a} goes to {b} on the way past, and the way she says it sounds less like a greeting and more like a weather forecast. {b} opens her mouth. Closes it. {a} is already gone.",
      "{a} leans close to {b}'s ear on the way to the door. Says one sentence that nobody else hears. {b}'s jaw tightens. {a} keeps walking. Whatever she said, {b} will be thinking about it on stage.",
      "The room is filing toward the door. {a} falls into step next to {b} and says something under her breath that makes {b} stop moving. {a} does not stop. By the time {b} has composed a reply {a} is three steps ahead and not looking back.",
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
      "{a} walks through the door and does not sit down. Goes straight to the mirror and starts blending under her eye like there is a crisis there. There is not. Her hands need something to do that is not shaking.",
      "Everybody finds the couch. {a} finds the mirror. Picks up a brush and starts fixing her contour, which was fine. If she sits down somebody is going to ask how she is feeling and the answer is a sound, not a sentence.",
      "{a} is at the mirror before the door closes behind her. Already wiping at a brow that does not need wiping. The other queens pour drinks and settle in. {a} keeps her back to the room because turning around means eye contact and eye contact means talking about it.",
      "First thing {a} does is pick up a sponge and dab at nothing. Her mug is perfect and everybody knows it. But the mirror is the one place she can look without seeing somebody who wants to ask what happened out there. Blends for four straight minutes.",
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
      "{a} pours for {b} first, then {c}, then herself last. {b} takes the glass and goes thank you. {c} takes hers and says nothing, which is also a thank you.",
      "\"What do you want.\" {a} is already at the bottles before {b} and {c} have decided where to sit. Pours three and carries two across the room with the balance of someone who has tended bar in heels. First kind thing that happens backstage.",
      "{a} grabs three glasses and starts pouring before anybody asks. Somebody has to do it and {a} would rather be the queen pouring than the queen sitting down and thinking about what just happened. {b} gets hers first. {c} gets hers second. {a} finally sits with her own and the sitting down is the hard part.",
      "The drinks appear because {a} made them — {b}'s with extra ice the way {b} takes it, {c}'s neat, her own last and largest. The making of them bought {a} three minutes of not having to talk about the stage.",
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
      "Everybody knows who is in trouble and nobody says it. {a} brings up the runway. {b} agrees it was strong. {c} says something about fabric. The three of them build a conversation out of everything except the thing they are actually thinking about.",
      "{a} goes \"those looks tonight.\" {b} goes \"right?\" {c} says something about a silhouette. Three queens talking about clothes like nobody on that stage just got dragged by three judges in a row. The avoidance is collaborative.",
      "{a} goes \"Can we talk about the fabric {c} used?\" The room latches on because the alternative is talking about who is going home, and that means looking at the person who might be going. Nobody is ready for that yet. {b} agrees the fabric was gorgeous. {c} accepts the compliment. The real conversation waits.",
      "{a} and {b} and {c} are discussing hemlines like hemlines are the most important thing in the world. All three know they are not. The not-saying is a kindness that is also a cowardice and nobody can tell where one ends and the other starts.",
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
      "Everybody else has kicked off the heels and {a} is still fully beat, still in the wig, still sitting upright like she is about to walk a second runway. Taking any of it off would mean the night is over and she does not want it to be over.",
      "{a} has not taken off a single thing. Corset still cinched, lashes still on, wig still pinned. Other queens are in robes and slides. {a} is sitting there in full regalia like a painting that refuses to come off the wall. Somebody asks if she wants to change. \"I am fine.\"",
      "The shoes are still on. {a} is the only queen who has not unzipped anything. She is holding onto the look the way you hold onto a good night — tightly, past the point where it is comfortable. She is not ready for the moment to be over.",
      "Every queen in the room has pulled a wig off except {a}, who is sitting cross-legged on the couch in full drag like she is being photographed. The queens who had the best night are always the last to let go of it.",
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
      "{a} says it to {b} and it might have stayed between them. Then {c} goes \"she is right though\" — out loud, in front of everybody. That is when it stops being an argument. {b} can feel the room shift. Two against one is not a fight. It is a verdict.",
      "\"I have been thinking that too.\" {c} says it and {a} nods and {b} watches the nod happen. That nod is the thing. The moment two queens agree about you IN FRONT of you, you are not in an argument any more. You are outnumbered. {b} sits back. Not because she agrees. Because the math changed.",
      "{a} makes the point. {b} opens her mouth to answer. {c} cuts in with \"honestly\" — and everything after that is {c} siding with {a}. {b} closes her mouth. One voice against hers was a fight. Two voices is a room.",
      "It was between {a} and {b} until {c} goes \"no, she has a point.\" {b} looks at {c} like she just learned something about where {c} stands. {c} does not look away. {b} picks up her drink because that is all she can do.",
    ],
  }),
  ev({
    id: 'laughed-at-the-wrong-time', phase: 'middle', cast: 'group', weight: 1.2,
    note: '{c} laughs in the middle of something that was not funny to {b}, '
      + 'and now {c} is in it, and {c} did not say a word.',
    when: f => f.groupSize >= 3,
    effects: { bond: -1, pop: { c: -1 }, state: 'wrong-laugh' },
    lines: [
      "{b} is telling her side of it and {c} laughs. Not a big laugh — a breath through the nose. {b} stops talking. Looks at {c}. {a} watches the whole thing land. {c}'s face says she knows it landed wrong. Girl did not say a WORD and she is now in the middle of something she was watching from the couch.",
      "The laugh comes from {c} at the worst possible second — right when {b} is saying the thing that matters most. {a} clocks it immediately. {c} tries to turn it into a cough. Makes it worse. She was not even in this and now she is. One sound. That is all it took.",
      "{c} snorts during {b}'s sentence. {a} looks at {c}. {b} looks at {c}. {c} looks at the floor. Nobody asked her for an opinion. The laugh was louder than any opinion she could have given. You cannot take a laugh back — everybody already heard what it meant.",
      "It is not funny and {c} laughs anyway — a short sharp thing that escapes before she can catch it. {b} turns her whole body toward {c}. \"What is funny.\" Not a question. {a} does not intervene. {c} put herself there. {c} is going to have to get herself out.",
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
      "{a} starts telling a story and by the second sentence {b} is leaning forward and {c} has stopped checking her phone. She does the voice. She does the face. She lands the punchline. The laughter is REAL — loud, ugly, the first honest laugh anybody has had all week.",
      "\"Okay wait, wait, wait — \" {a} starts again from the top with the hand gestures. {b} is already crying laughing. {c} has her head on the armrest wheezing. {a} has not even reached the good part yet. She is doing an impression of somebody none of them have met and it is SO specific the room forgets they are on a show.",
      "{a} has the floor and she is not giving it back. The story is about something that happened in the hotel. Every beat lands. Every pause earns a scream. {b} is doubled over. {c} is clapping with her hands over her mouth. {a} rides it like a set at a club because she HAS done sets at clubs. Same muscle.",
      "Nobody asked {a} to perform but she is performing — standing up, using the whole couch as a stage, telling a story that has four acts and a twist ending. {b} laughs so hard she spills her drink. {c} goes \"stop, STOP\" but does not mean stop. The room is lighter than it has been in days and {a} is the reason.",
    ],
  }),
  ev({
    id: 'that-is-not-what-i-said', phase: 'middle', cast: 'pair', weight: 1.3,
    note: '{b} repeats back what {a} said and it is not what {a} said, and '
      + 'the gap between the two versions is where the whole argument lives.',
    when: f => f.tension || f.namedOnStage,
    effects: { bond: -1.5, pop: { a: -1 }, state: 'misquoted' },
    lines: [
      "\"You said you did not care.\" {b} says it back and {a}'s face changes. That is NOT what she said. What {a} said was \"I am not worried about it\" — completely different sentence. The distance between those two sentences is where the whole argument is going to live for the next forty minutes.",
      "{b} repeats {a}'s words back and gets them wrong. Not wildly wrong — wrong by one shade. The shade that changes the meaning. {a} goes \"that is not what I said.\" {b} goes \"that is exactly what you said.\" Neither of them is lying exactly. But one of them is remembering a sentence that did not happen.",
      "\"What I SAID was — \" {a} starts over because the version {b} just told the room is not the version {a} remembers. The gap is small enough to be an accident. Large enough to change whose fault it is. {b} looks certain. {a} looks certain. One of them is wrong and neither is going to admit it.",
      "{b} paraphrases and the paraphrase is a rewrite — {a}'s \"I did not love it\" becomes {b}'s \"she hated it.\" {a} opens her hands. \"Those are two different things.\" {b} goes \"girl, same thing.\" It is NOT the same thing. The room is about to find out how much that difference matters to {a}.",
    ],
  }),
  ev({
    id: 'apology-not-accepted', phase: 'middle', cast: 'pair', weight: 1.1,
    note: '{a} apologises and {b} does not take it. Not rudely — she just '
      + 'does not take it, and the room watches an apology sit there.',
    when: f => f.bond <= -2,
    effects: { bond: -1, pop: { b: -1 }, state: 'refused' },
    lines: [
      "{a} says she is sorry and means it. Voice is right, eyes are right, everything says sorry. {b} looks at her and goes \"okay\" in a tone that is not okay. The apology just sits there. {b} is not being cruel — she is just not ready. And not-ready looks a lot like no.",
      "\"I want to apologise for what I said.\" {a} delivers it. {b} nods once. \"I heard you.\" That is it. No hug. No \"it is fine.\" No reset. {b} takes a sip of her drink and the sip is the answer. The room watches an apology get received and not accepted and nobody knows where to look.",
      "{a} reaches out and {b} does not reach back. The sorry is real. {b} can see it is real. She still does not take it — not because she is petty but because sorry does not undo the thing. {a} sits back down. The distance between them is the same as before the apology.",
      "The apology comes and {b} goes \"thank you for saying that\" — the polite version of no. {a} hears the thank you and hears the full stop after it. The door she just knocked on did not open. {b} is not punishing her. Sorry is a word. The word is not enough yet.",
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
      "{a} is going after {b} and {c} — who was not in it, had no dog in it, was sitting on the other couch with a drink — leans forward and goes \"that is not fair.\" Three words. Room changes direction. {a} looks at {c} with surprise. {b} looks at {c} with something closer to gratitude than anything else that has happened all night.",
      "Nobody asked {c} to say anything. {c} says it anyway — \"leave her alone.\" {a} turns because a new voice means a new front. {c} is standing in something she did not have to stand in. {b} goes quiet because somebody just took her side without being asked. It costs {c} something with {a}. She knows it. Says it anyway.",
      "{c} was watching from the edge of the couch. {a} was pressing {b}. {c} finally goes \"she already said she is sorry, what more do you want.\" The room goes still. {a} did not expect a third voice. {b} did not expect a defender. {c} did not expect to be in this but she is in it now.",
      "\"I am going to say something.\" {c} says it like a warning and then says the thing — {a} is wrong about {b} and somebody needed to say it. {a} takes it badly because taking it well would mean agreeing. {b} takes it with the quiet relief of a queen who was drowning and just got a hand.",
    ],
  }),
  ev({
    id: 'reading-the-room-wrong', phase: 'middle', cast: 'solo', weight: 1.1,
    note: '{a} makes a joke about the queen who is about to lip sync and it '
      + 'lands in total silence. She hears it land. There is no way back.',
    when: f => f.canScheme,
    effects: { pop: { a: -2 }, state: 'misjudged' },
    lines: [
      "{a} makes a joke about the queen who is about to lip sync. It lands in total silence. The kind where you can hear the ice in somebody's glass. {a}'s smile stays but her eyes know. There is no recovering from a joke the room decided was not funny.",
      "\"Well, at least she will get to perform twice tonight.\" {a} says it and nobody laughs. Not a single sound. {a} tries to laugh at her own joke. The self-laugh makes it worse — now she is laughing alone in a room full of people who decided not to.",
      "{a} goes for the read and misses. Timing is wrong. Target is wrong. The room is not in the mood. The silence after the punchline is the loudest thing that has happened all night. {a} picks up her glass and drinks because the alternative is standing in the silence she built.",
      "The joke leaves {a}'s mouth and dies on arrival. The room does not laugh and does not pretend to laugh. The nothing IS the response. {a} takes a long sip and does not try again.",
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
      "The screen is on. None of them are watching it. All of them are listening. {a} faces the wall. {b} faces the couch. {c} faces the ceiling. Every one of them has stopped talking at the same time. If they were not listening they would still be having a conversation. They are not.",
      "{a} picks up a magazine and is not reading it. {b} examines her nails. {c} refills a drink that was already full. The panel is audible through the monitor. All three of them can hear names being said. None of them will admit it. The pretending-not-to-listen is a group activity and it requires total commitment.",
      "Somebody's name comes through the monitor and {a} flinches. Pretends the flinch was a stretch. {b} crosses her legs the other way. {c} puts her glass down gently. None of them look at the screen. All of them know what is being said. It is written on every face in the room.",
      "The room goes quiet at exactly the same second — the second the judges' voices become audible from the monitor. {a} and {b} and {c} all develop a sudden interest in things that are not the monitor. A hangnail. A stain on the couch. The label on a bottle. The performance of not-listening is so coordinated it might as well be listening.",
    ],
  }),
  ev({
    id: 'called-out-for-the-edit', phase: 'middle', cast: 'pair', weight: 1.0,
    note: '{b} tells {a} she is playing to the camera, which is both true and '
      + 'the rudest thing you can say in this room, because everybody is.',
    when: f => f.canScheme && f.bond <= 1,
    effects: { bond: -1.5, pop: { a: -1 }, state: 'accused-of-editing' },
    lines: [
      "\"You are performing right now.\" {b} says it and the room goes quiet. That is the one thing you are not supposed to say out loud. Everybody in this room is performing all the time. Naming it is the rudest thing you can do. {a}'s face drops. {b} sees through the version she built for the camera.",
      "{b} looks at {a} and goes \"that was for the camera and we both know it.\" {a}'s whole body stiffens. Every queen in this room is giving a performance and the contract is that nobody admits it. {b} just tore that contract up. {a} goes \"I do not know what you are talking about\" — which is its own kind of performance.",
      "\"Girl, you are doing a confessional right now and we are not in the booth.\" {b} says it and {a} goes red — or would if the foundation allowed it. The accusation is that the crying was not real. It was content. The worst part is {a} cannot deny it without it sounding like MORE content.",
      "{b} tells {a} she is playing it up. Brutal because it is true — and true is the hardest thing to defend against. {a} was giving a moment. {b} saw the giving and named it. Naming it makes the moment worthless. {a} goes \"everything I said was real.\" Maybe it was. {b} has made it impossible for the room to believe it now.",
    ],
  }),
  ev({
    id: 'not-your-turn', phase: 'middle', cast: 'group', weight: 1.1,
    note: '{a} is upset and {c} is more upset and louder about it, and the '
      + 'room quietly resents {c} for taking a moment that was not hers.',
    when: f => f.groupSize >= 3 && f.inBottom,
    effects: { bond: -1, pop: { c: -2 }, state: 'stolen-moment' },
    lines: [
      "{a} is upset and has earned being upset. Then {c} starts crying louder. {c}'s tears are bigger. {c}'s voice is louder. Suddenly the room is comforting {c} instead of {a}. {a} sits there watching her moment walk across the room to somebody else. {b} notices. {a} says nothing.",
      "It was {a}'s turn to be held and {c} took it. Not maliciously — {c} is just a louder griever. Grief at volume wins the room. {a} wipes her eyes quietly while three queens surround {c}. {b} is the only one who looks at {a} and sees what just happened. {a}'s pain got outperformed.",
      "{c} makes it about herself and the room lets her because louder gets the attention. {a} was the one in the bottom. {a} was the one the judges spoke to. But {c} is the one sobbing on the couch and the sobbing takes up all the air. {a} is left sitting in the corner of her own story. {b} catches her eye — the only acknowledgment she gets.",
      "\"I just feel SO — \" {c} launches into it. {a} watches her own moment become {c}'s moment in real time. {a} was in the bottom. {a} was shaking. {a} needed the room and the room went to {c} because {c} made noise and {a} did not. {b} stays near {a} but it is not enough to undo it.",
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
      "{a} cannot do her own mug right now. Hands are shaking. Eyes will not stop. {b} sits down next to her, picks up a brush, and starts fixing {a}'s mascara without asking. Neither of them says why. {a} sits still and lets herself be held together by someone else's hands. Kindest thing that happens all night.",
      "{b} sees {a} trying to fix her liner and failing. Takes the pencil out of her hand gently. \"Let me.\" {a} lets her. {b} draws the line steady and clean. {a} closes her eyes — trusting {b}'s hand to do what hers could not. Make her look like somebody who has not been crying for twenty minutes.",
      "{a}'s hands are shaking and {b} notices and does not mention it. She just sits down. \"Close your eyes.\" Starts doing {a}'s lashes for her, one at a time, carefully. Neither of them names what this is. It does not need a name.",
      "\"Come here.\" {b} pulls {a} to the mirror and starts rebuilding her face — primer where the tears wrecked it, powder where the nose went red. {a} sits in the chair and does not speak. {b} does not speak. The makeup is the excuse. The sitting still while somebody takes care of you is the real thing.",
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
      "It is not staged. {a} stands up. {b} is already standing. {c} reaches for both of them and suddenly the three of them are holding on by the door. Nobody started it. Nobody is letting go first. The hug is tight and long and says everything the room could not say for the last hour.",
      "{a} and {b} and {c} end up in a knot of arms by the doorway. None of them planned it. {a}'s head is on {b}'s shoulder. {c}'s arms are around both of them. Not a camera moment — just three people who have been through something standing in a circle and not letting go because letting go means walking back out there.",
      "Somebody reaches. Then somebody else reaches. Then {a} and {b} and {c} are all in it — arms, foreheads, the whole thing. The hug lasts longer than a performed hug because nobody wants to be the one who breaks it. {a} squeezes. {b} squeezes back. {c} holds the outside. They stand there until they are ready. Takes a while.",
      "The hug starts without a beginning — {a} turns to {b} and {c} is already there and the three of them close the gap at the same time. Nobody said \"bring it in.\" Nobody opened their arms. The holding just happened because the room had been hard and they all needed the opposite.",
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
      "They are called back. {a} stands up. {b} stands up. Neither of them says anything on the way to the door. The thing that was between them an hour ago is still between them. Same size. Same shape. No smaller for having been talked about. Both of them know it will be there tomorrow morning.",
      "{a} and {b} get the call and the fight is not done. It is exactly where they left it — mid-sentence, mid-grudge. {a} looks at {b} by the door. {b} does not look back. The not-looking is the answer to every question {a} was thinking about asking.",
      "\"We should go.\" {a} says it. {b} nods. The nod is the only thing they have agreed on in an hour. They walk to the door side by side — closer than either of them wants to be to the other. The unfinished thing walks out with them.",
      "{a} and {b} stand up at the same time. Do not acknowledge each other. The conversation is not over — it is paused. Both of them know the pause is temporary. The stage is next. The thing will be here when they get back. Unchanged. Waiting.",
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
      "On the way out {a} turns and says the thing. The thing the whole room has been circling for an hour. The thing everyone was thinking and nobody would put into words. {b} and {c} hear it. There is no time to respond. The door is open. The stage is waiting. It just sits there — said at last, with no take-back.",
      "\"Somebody had to say it.\" {a} says it at the door. The REAL thing — the honest thing that would have changed the whole conversation if anyone had been brave enough to say it an hour ago. {b} stops walking. {c} looks at {a}. Three seconds before they walk out. Nobody responds.",
      "{a} drops it on the way out — the real opinion, the actual read, the thing the room agreed not to say. {b} and {c} hear it hit. There is no time to pick it up. They walk out with it ringing in their ears. {a} knows the saying was brave and the timing was cowardly. Both true.",
      "The door opens and {a} says it. Finally. At the worst possible moment. No runway left for a response. {b}'s jaw drops. {c} exhales. {a} walks through the door without looking back because looking back would mean having a conversation and there is no time for one.",
    ],
  }),
  ev({
    id: 'she-goes-quiet', phase: 'late', cast: 'solo', weight: 1.2,
    note: '{a} has not spoken for twenty minutes and the room has not '
      + 'noticed, and the not-noticing is the part she will remember.',
    when: f => f.lastCall === 'SAFE',
    effects: { pop: { a: -1 }, state: 'overlooked' },
    lines: [
      "{a} has not said a word in twenty minutes and the room has not noticed. The room is busy with louder things — the fight, the crying, the queen telling a story. {a} sits on the end of the couch with a drink she has not sipped. Watches all of it happen without her. The not-noticing is the part she will carry home.",
      "The room is full of voices and {a} is not one of them. She went quiet somewhere between the second fight and the third drink. Nobody noticed because the loud queens stayed loud. She is right there — three feet from the couch, visible to everyone — and invisible the way only a safe queen in a room full of drama can be.",
      "{a} has been sitting in the same position for twenty minutes. Said exactly nothing. The room talks around her, over her, past her. She was safe tonight. Safe and forgettable. The room is proving the forgettable part right now.",
      "Twenty minutes of silence from {a} and not one queen has looked over and goes \"you okay?\" Not because they do not care — {a} is safe and safe is invisible when the room has a bottom two to worry about. {a} finishes her drink alone in a full room. That is its own kind of loneliness. That is what she will remember about this week.",
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
      "{a} and {b} are about to walk out. One of them is not coming back. They both know it. Neither says anything. They look at each other and the look holds for a long time — long enough to say what words would ruin. Then they stand up together and walk to the door together. The song decides the rest.",
      "There is nothing to say and {a} and {b} do not try to say it. They sit side by side. Talking would mean one of them would have to pretend she is not scared. They are both scared. {a} reaches over and squeezes {b}'s hand once. Lets go.",
      "{a} looks at {b}. {b} looks at {a}. The looking is the whole conversation. One of them is going home. The other is staying. Neither knows which is which. They do not hug. They do not cry. They do not say \"good luck\" because good luck means one of them loses.",
      "The call comes. {a} and {b} stand up at the same time. There is a second where they face each other — the fear, the respect, the understanding that what happens next is not personal even though it will feel personal. Neither says a word. They walk out in silence. The silence is enough.",
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
    lines: [
      "{a} and {b} are sitting next to each other and neither of them is talking. They are family and they are both in the bottom and one of them is about to send the other home. {a} looks at {b} once and {b} looks at the floor. The useful thing to say is \"I hope it is you\" and neither of them can say it.",
      "The room clears out and it is just {a} and {b}. Family. Both in the bottom. {b} goes \"this is the worst night I have ever had\" and {a} nods because it is the worst night she has ever had too. They cannot comfort each other because the comfort would be a lie — one of them is leaving and the other one is the reason.",
      "{a} and {b} are family and right now that makes it worse, not better. They sit on the same couch in silence. {a} reaches for {b}'s hand and holds it. Neither of them says good luck. Neither of them says I love you. The thing they are about to do to each other does not have words yet.",
      "Worst night either of them will have. {a} and {b} are family and they are both in the bottom and the lip sync is coming and one of them is going home. {b} starts to say something and stops. {a} starts to say something and stops. The stopping is the same — neither of them can say the honest thing out loud because the honest thing is too ugly to say to family.",
    ],
  }),
  ev({
    id: 'she-defends-her-family', phase: 'middle', cast: 'group', weight: 1.6,
    note: '{c} says something about {b} and {a} — who is {b}\'s family — does '
      + 'not let it go, and the room finds out how much that bond is worth '
      + 'when it is tested in public rather than at a sewing machine.',
    arcs: ['rivalry'],
    when: f => f.sameFamily && f.groupSize >= 3,
    effects: { bond: -1.5, pop: { a: 2 }, state: 'family-defended' },
    lines: [
      "{c} says something about {b} and {a} puts her drink down. That is {a}'s family. You do not talk about {a}'s family in front of {a}. \"Say that again.\" {a} says it once and {c} does not say it again. The room goes quiet because everybody just found out what that bond is worth when it is tested in public.",
      "{c} makes a comment about {b} and {a} — who was not even in the conversation — turns around and goes \"excuse me?\" Voice is different. Posture is different. That is her family {c} just came for. {b} watches {a} defend her and does not know where to look. {c} backs down because the energy coming off {a} right now is not worth fighting.",
      "{c} starts reading {b} and does not get far because {a} cuts in with \"you are talking about MY girl right now.\" Not loud. Just clear. {c} blinks. {b} goes quiet. The room finds out how much that family bond is worth when somebody tests it outside the werk room — and the answer is: everything.",
      "\"That is my sister you are talking about.\" {a} says it to {c} and the word sister lands like a wall. {c} was coming for {b} and did not factor in {a} and now {a} is between them. {b} sits behind {a} and does not speak because {a} is handling it. {c} picks up her drink and sits back because there is nothing left to say to someone whose family just showed up.",
    ],
  }),
  ev({
    id: 'you-are-not-my-mother-here', phase: 'middle', cast: 'pair', weight: 1.4,
    note: '{b} gives {a} a note the way she has given it for years and {a} '
      + 'says the thing she has been holding since the first day: this is not '
      + 'the bar and {b} is not her mother in this room.',
    arcs: ['rivalry'],
    when: f => f.relation === 'mother' && f.inBottom,
    effects: { bond: -2, pop: { a: 1 }, state: 'family-strain' },
    lines: [
      "{b} gives {a} a note — the same way she has given it for years, the same tone, the same \"listen to me\" energy — and {a} finally says the thing she has been holding since day one. \"You are not my mother in this room.\" {b}'s face drops. The room goes dead quiet. That is a line you do not uncross.",
      "{b} starts with \"baby, what I would do is — \" and {a} cuts her off. \"Stop. You are not my mother here. You are my competition.\" {b} sits back like she has been hit. {a} is shaking but she said it. The bar is one thing. This room is another. {a} needed {b} to hear the difference and now she has.",
      "\"I love you but I need you to stop.\" {a} says it to {b} and the stop is about the notes, the corrections, the mothering that follows {a} everywhere including onto a stage where {a} needs to be her OWN queen. {b} goes quiet. {a} goes quiet. The quiet between them is different from every quiet they have had before.",
      "{b} tells {a} what she should have done differently on stage and {a} snaps. \"This is not the bar. You are not giving me notes right now.\" {b} opens her mouth and closes it. {a} is in the bottom and scared and the last thing she needs is her drag mother telling her what she already knows. The room watches family become a challenge in real time.",
    ],
  }),
  ev({
    id: 'proud-of-you-anyway', phase: 'late', cast: 'pair', weight: 1.5,
    note: '{a} is family and says the thing families say before somebody goes '
      + 'out to lip sync for her life. It is not strategy and it is not for '
      + 'the camera, and it is the last private thing either of them gets.',
    arcs: ['bond'],
    when: f => f.sameFamily && (f.inBottom || f.bInBottom),
    effects: { bond: 2, pop: { a: 1 }, state: 'family-goodbye' },
    lines: [
      "{a} pulls {b} aside before they walk back out. Holds both her hands. \"I am proud of you. No matter what.\" {b} nods because if she opens her mouth she is going to cry and she cannot cry right now — she has to lip sync. {a} squeezes once and lets go. Last private thing either of them gets.",
      "{a} looks at {b} and goes \"you are going to kill that lip sync, you hear me?\" Not strategy. Not for the camera. Just family saying the thing family says before somebody goes out to fight for her life. {b} takes a breath. Nods. {a} hugs her tight and lets go and the letting go is the hardest part.",
      "\"Hey. Look at me.\" {a} turns {b}'s face toward hers. \"I am proud of you anyway. You hear me? Anyway.\" {b}'s eyes fill up. {a}'s eyes fill up. Neither of them lets it fall because falling means redoing the mug and there is no time. The last private thing either of them gets is a look that says everything the room would not understand.",
      "{a} grabs {b} by the shoulders. \"Whatever happens out there — you are my family and that does not change.\" {b} nods. Cannot talk. {a} fixes a piece of {b}'s wig that was out of place. The wig-fixing is the love — small, practical, the last thing she can do before the song starts and the decision is made.",
    ],
  }),

  /* ── MOVED FROM THE WERK ROOM, WHERE NOBODY DRINKS ──
     This was `slot: 'werk-elim-day'` and it was the only event in a hundred
     and seven that put a glass in somebody's hand in the work room. Measured
     the other way: twenty-eight of the sixty-five events in THIS file involve
     a drink. The lounge is where the drinking happens and the werk room is
     where the sewing does, so three queens pouring something read as Untucked
     to anybody watching — which is how it was reported.
     `late` because that is what the beat is: the end of the night, before
     they are called back, when the room already knows one of them is not
     coming back to it. Everybody is in this room — `runUntucked` is handed
     the whole living roster — so "one of us is going" is still true of the
     three of them and still unsaid, which is the whole event. */
  ev({
    id: 'last-drink-together', phase: 'late', cast: 'group', weight: 1.2,
    note: '{a}, {b} and {c} have a drink in a room that is about to be one '
      + 'smaller and all three of them are being careful not to say so.',
    when: f => f.groupSize >= 3,
    effects: { bond: 1, pop: { a: 1 }, state: 'last-drink' },
    lines: [
      "{a} pours three glasses. {b} takes hers. {c} takes hers. They stand in a circle that is going to be one person smaller by tomorrow and all three of them are being careful not to say that.",
      "\"One more drink before — \" {a} does not finish the sentence. {b} and {c} raise their glasses. The toast is vague and cheerful because the honest one would be too heavy. Somebody is leaving and all three know it.",
      "The three of them sit on the couch. {a} poured something. Nobody is drinking fast because fast means it is over. {b} tells a joke. {c} laughs too hard at it. {a} watches both of them like she is memorising the room.",
      "{a} and {b} and {c} share a drink. They clink glasses and somebody goes \"to us\" and the \"us\" has a shelf life and everyone knows it. Nobody says that part out loud.",
    ],
  }),
];

export const UNTUCKED_IDS = UNTUCKED_EVENTS.map(e => e.id);

/** What is still unwritten, so the gap is visible rather than silent. */
export function unwrittenUntuckedEvents() {
  return UNTUCKED_EVENTS.filter(e => !e.lines || e.lines.length < 4).map(e => e.id);
}

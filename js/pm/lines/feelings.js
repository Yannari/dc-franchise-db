// pm/lines/feelings.js — jealousy and what it does, reassurance, guilt coming
// out, a friend's advice (Plan 3, Task 3). Data only.
//
// Casts, from pm/villa-day.js:
//   torch              [a, b]    a still has feelings for b, who is off to the
//                                 hideaway with someone else. b does not speak.
//   jealous-confront   [a, b, c] a confronts partner b about c. "I saw you"
//                                 only when a did see it (`knowsB`).
//   jealous-sulk       [a]       a goes quiet; `noticed` if the partner saw.
//   jealous-retaliate  [a, b, c] a flirts with b in front of partner c, who
//                                 does not speak.
//   reassurance        [a, b]    a needs to hear it; b is the partner, and b's
//                                 answer is as warm as b really is (`feels`).
//   overthinking       [a]       a, alone with it. {pa} is the partner.
//   confession         [a, b]    a owns up to partner b.
//   advice             [a, b, c] a tells friend b what a thinks of b's partner
//                                 c (`verdict` good / bad / unsure).
//   double-standard    [a, b]    after Movie Night: a was judged harder than b.
const T = { taken: true };
import { MORE_FEELINGS } from './day/more-b.js';
export const FEELINGS = {
  torch: [
    { id: 'torch.01',
      stage: '{a} watches {b} walk to the hideaway with someone else.',
      turns: [['a', "Good for them. Honestly. Good for them."]],
      beat: '{a} goes to bed before anyone else.' },
    { id: 'torch.02',
      stage: 'Round the fire pit, after {b} has gone to the hideaway.',
      turns: [['a', "I'm fine. I just thought, for a bit, it might have been me."]] },
    { id: 'torch.03',
      stage: '{a} is still looking at the hideaway door long after it has shut.',
      turns: [['a', "…What? No. I'm just tired."]] },
    { id: 'torch.04', when: { persona: 'hopeless-romantic' },
      stage: 'In the dressing room, with the door shut.',
      turns: [['a', "I know I shouldn't still feel like this about {b}. I just do."]],
      beat: '{a} stays in there for a long time.' },
    { id: 'torch.05', when: { taken: true },
      stage: '{a} is on the daybed with {pa}, and keeps glancing at the hideaway.',
      turns: [['a', "Sorry. I'm here. I'm listening."]] },
    { id: 'torch.06',
      stage: 'By the pool, to nobody in particular.',
      turns: [['a', "It's fine. It was never going to be me. I knew that."]],
      beat: '{a} throws a stone into the pool, and watches it sink.' },
  ],
  'jealous-confront': [
    { id: 'jealous-confront.01', when: { knowsB: true },
      turns: [
        ['a', "I watched you do it. I'm not making it up."],
        ['b', 'It was a chat.'],
        ['a', "It was a chat with your hand on {c.posAdj} leg."],
        { by: 'b', vary: [
          { turns: [['b', 'Right, so you were counting.'], ['a', 'Apparently I was, {~yeah}.']] },
          { when: { mood: 'guilty' },
            turns: [['b', "…I'm sorry. It shouldn't have happened."]], beat: '{a} walks off before {b} can say any more.' },
          { when: { archetype: ['villain', 'mastermind', 'schemer'] },
            turns: [['b', "If you're going to watch me all day, maybe you've got the problem."]], beat: '{a} stares at {b.obj}, and then walks away.' },
        ] },
      ] },
    { id: 'jealous-confront.02',
      turns: [
        ['a', "What's going on with you and {c}?"],
        { by: 'b', vary: [
          { turns: [['b', 'Nothing. We get on. That\'s it.'], ['a', 'It doesn\'t look like nothing.'], ['b', "Then you're looking wrong."]],
            beat: '{a} goes quiet.' },
          { when: { attachment: 'secure' },
            turns: [['b', "Nothing. Come here. You don't need to worry about {c}."]], beat: '{a} lets {b.obj} pull {a.obj} in.' },
          { when: { mood: 'guilty' },
            turns: [['b', 'Why? Has someone said something?']], beat: '{a} notices that it isn\'t a no.' },
        ] },
      ] },
    { id: 'jealous-confront.03',
      stage: '{a} finds {b} in the kitchen.',
      turns: [
        ['a', "I'm not trying to start anything. I just need to ask. Do you like {c}?"],
        { by: 'b', vary: [
          { turns: [['b', 'As a friend. That\'s all.'], ['a', 'Okay.'], ['b', "I mean it."]] },
          { when: { feels: 'little' },
            turns: [['b', "I don't know what I like at the minute, to be honest."]], beat: '{a} puts the glass down and walks out.' },
        ] },
      ] },
    { id: 'jealous-confront.04', when: { knowsB: true },
      turns: [
        ['a', 'Everyone saw you with {c}. Everyone. Do you know how that made me look?'],
        ['b', 'This is about how it made you look?'],
        ['a', "It's about how it made me feel. And look. Both."],
      ] },
    { id: 'jealous-confront.05', when: { attachment: 'anxious' },
      turns: [
        ['a', "Are you going to leave me for {c}? Just tell me. I'd rather know."],
        { by: 'b', vary: [
          { turns: [['b', "No. Where is this coming from?"], ['a', "From watching you two all afternoon."]] },
          { when: { feels: 'strong' },
            turns: [['b', "No. Never. Look at me. No."]], beat: '{a} starts crying, and {b} holds on to {a.obj}.' },
        ] },
      ] },
    { id: 'jealous-confront.06', when: { archetype: 'hothead' },
      turns: [
        ['a', 'Why are you always with {c}? Every time I look up, there you are.'],
        ['b', "Keep your voice down."],
        ['a', "Why? So nobody hears?"],
      ],
      beat: 'Half the villa turns to look.' },
    { id: 'jealous-confront.07',
      turns: [
        ['a', "I don't like how close you and {c} are getting."],
        ['b', "Then say that. Don't just go cold on me all day."],
        ['a', "I'm saying it now."],
      ] },
    { id: 'jealous-confront.08', when: { rung: ['exclusive', 'official'] },
      turns: [
        ['a', "We're exclusive. You don't get to lie on a sunbed with {c} for two hours."],
        ['b', "We were talking."],
        ['a', "Then talk to me."],
      ] },
  ],
  'jealous-sulk': [
    { id: 'jealous-sulk.01', when: T,
      stage: '{a} is on {a.posAdj} own at the far end of the garden, while {pa} is laughing on the daybeds.',
      turns: [['a', "I'm fine. I just want some space."]] },
    { id: 'jealous-sulk.02', when: T,
      stage: 'At dinner, {a} gives one-word answers to everything {pa} says.',
      turns: [['a', "{~Yeah}. Fine. Whatever."]] },
    { id: 'jealous-sulk.03', when: { ...T, noticed: true },
      stage: '{pa} sits down next to {a}.',
      turns: [['a', "I don't want to talk about it."]],
      beat: "{pa} doesn't leave." },
    { id: 'jealous-sulk.04', when: { ...T, noticed: false },
      stage: '{a} goes to bed early. Nobody notices, including {pa}.',
      turns: [['a', '…Night, then.']] },
    { id: 'jealous-sulk.05', when: T,
      stage: '{a} is doing lengths in the pool, hard, while {pa} chats on the terrace.',
      turns: [['a', "I'm swimming. People swim."]] },
    { id: 'jealous-sulk.06', when: { ...T, attachment: 'avoidant' },
      stage: '{a} takes a pillow and a blanket out to the daybed on {a.posAdj} own.',
      turns: [['a', "It's too hot inside. That's all."]] },
  ],
  'jealous-retaliate': [
    { id: 'jealous-retaliate.01',
      stage: '{a} makes sure {c} is watching, then sits down right next to {b}.',
      turns: [
        ['a', "You're looking really good today, you know."],
        ['b', 'Am I? Thanks.'],
      ],
      beat: "Across the lawn, {c} puts {c.posAdj} drink down." },
    { id: 'jealous-retaliate.02',
      turns: [
        ['a', "Do you want to go for a swim? Just us?"],
        ['b', "…Sure. Why not."],
      ],
      beat: '{a} takes {b.posAdj} hand on the way to the pool, where {c} can see.' },
    { id: 'jealous-retaliate.03',
      stage: '{a} laughs, very loudly, at something {b} says.',
      turns: [['b', "It wasn't that funny."], ['a', "It was really funny."]],
      beat: '{c} looks over.' },
    { id: 'jealous-retaliate.04', when: { persona: 'game-player' },
      turns: [
        ['a', "Can I borrow you for ten minutes? I need to make a point."],
        ['b', 'To who?'],
        ['a', "You'll see."],
      ],
      beat: '{c} watches them go.' },
    { id: 'jealous-retaliate.05', when: { persona: 'messy' },
      stage: 'In front of the whole villa.',
      turns: [
        ['a', "{b}, you're honestly my type. I've never said that, have I?"],
        ['b', "…No, you haven't."],
      ],
      beat: 'Nobody looks at {c}.' },
    { id: 'jealous-retaliate.06',
      turns: [
        ['a', 'Sit with me at dinner?'],
        ['b', "Won't your partner mind?"],
        ['a', "Don't know. Don't care."],
      ],
      beat: '{c} ends up at the other end of the table.' },
  ],
  reassurance: [
    { id: 'reassurance.01',
      turns: [
        ['a', 'Are we alright?'],
        { by: 'b', vary: [
          { turns: [['b', "We're alright."], ['a', "Say it like you mean it and I'll drop it."],
            ['b', "We're alright. I'm not going anywhere. Go to sleep."]] },
          { when: { feels: 'little' },
            turns: [['b', "{~Yeah}. Of course. Why wouldn't we be?"]], beat: '{b} says it without looking up.' },
          { when: { attachment: 'avoidant' },
            turns: [['b', "Why do you keep asking me that?"], ['a', "Because I need to hear it."], ['b', "…We're alright."]] },
        ] },
      ] },
    { id: 'reassurance.02',
      turns: [
        ['a', "I got in my head today. About you and everyone else."],
        { by: 'b', vary: [
          { turns: [['b', "Then get out of your head and look at me. It's you. It's been you all along."]],
            beat: '{a} lets {b.obj} hold {a.posAdj} face for a moment.' },
          { when: { feels: 'some' },
            turns: [['b', "You don't need to worry. I'm with you, aren't I?"]], beat: '{a} nods.' },
        ] },
      ] },
    { id: 'reassurance.03',
      turns: [
        ['a', 'Do you still like me? The same as before?'],
        ['b', 'More than before.'],
        ['a', 'Really?'],
        ['b', "Really. What's brought this on?"],
      ] },
    { id: 'reassurance.04', when: { attachment: 'anxious' },
      turns: [
        ['a', "Sorry. I know I keep asking."],
        ['b', "Then I'll keep answering. I'm not going anywhere."],
      ],
      beat: '{a} leans into {b.obj}, and some of the tension goes out of {a.posAdj} shoulders.' },
    { id: 'reassurance.05',
      stage: 'In bed, with the lights off.',
      turns: [
        ['a', "Can you promise me something? If your head turns, you'll tell me first."],
        { by: 'b', vary: [
          { turns: [['b', 'I promise. But it\'s not going to.']] },
          { when: { mood: 'guilty' },
            turns: [['b', "…I promise."]], beat: "{b} lies awake for a long time after {a} falls asleep." },
        ] },
      ] },
    { id: 'reassurance.06',
      turns: [
        ['a', "I saw you laughing with the others, and I felt left out."],
        ['b', "You're never left out. Come and sit with us next time."],
        ['a', "I will."],
      ] },
    { id: 'reassurance.07', when: { rung: ['exclusive', 'official'] },
      turns: [
        ['a', "Are you sure about us?"],
        ['b', "I asked you to be exclusive. I don't do that for fun."],
      ],
      beat: '{a} laughs, and it sounds like relief.' },
    { id: 'reassurance.08',
      turns: [
        ['a', "I don't like feeling like this. All worried."],
        ['b', "Then tell me what you need, and I'll do it."],
        ['a', "Just this. Just sit here."],
      ] },
  ],
  overthinking: [
    { id: 'overthinking.01', when: T,
      stage: 'In the dressing room, {a} is going over it out loud.',
      turns: [['a', "{pa} said 'we'll see' about the recoupling. What does 'we'll see' mean?"]] },
    { id: 'overthinking.02', when: T,
      stage: '{a} is lying awake after the lights go off.',
      turns: [['a', "…Why did {pa} go quiet at dinner? Was that me?"]] },
    { id: 'overthinking.03', when: T,
      stage: 'On the daybeds, to the friend next to {a.obj}.',
      turns: [['a', "Do you think {pa} is going off me? Be honest. Actually, don't be honest."]] },
    { id: 'overthinking.04', when: T,
      stage: '{a} has been sitting with the same cup of tea for twenty minutes.',
      turns: [['a', "I'm fine. I'm just thinking. I'm always thinking."]] },
    { id: 'overthinking.05', when: { ...T, attachment: 'anxious' },
      stage: 'By the pool, {a} is counting on {a.posAdj} fingers.',
      turns: [['a', "{pa} has talked to the new one three times today. Three. Is three a lot?"]] },
    { id: 'overthinking.06', when: T,
      stage: 'In the kitchen, while everyone else is outside.',
      turns: [['a', "Everything was fine this morning. So why don't I feel fine?"]] },
  ],
  confession: [
    { id: 'confession.01',
      turns: [
        ['a', "I need to tell you something before you hear it from someone else."],
        ['b', "…Okay. What?"],
        ['a', "I got close to someone. When you weren't there. It shouldn't have happened."],
        { by: 'b', vary: [
          { turns: [['b', 'How close?'], ['a', 'Close enough that I had to tell you.']],
            beat: "{b} gets up. {a} doesn't try to stop {b.obj}." },
          { when: { archetype: 'hothead' },
            turns: [['b', 'Who with?']], beat: '{b} is already on {b.posAdj} feet.' },
          { when: { attachment: 'secure' },
            turns: [['b', "Thank you for telling me. I'm not okay with it. But thank you."]],
            beat: 'They sit in silence for a long time.' },
        ] },
      ] },
    { id: 'confession.02',
      turns: [
        ['a', "I can't keep it in any more. I kissed someone else."],
        { by: 'b', vary: [
          { turns: [['b', '…When?'], ['a', 'Does it matter?'], ['b', 'It matters to me.']] },
          { when: { attachment: 'anxious' },
            turns: [['b', "I knew something was wrong. I knew it."]], beat: '{b} starts crying, and {a} does too.' },
          { when: { attachment: 'avoidant' },
            turns: [['b', 'Right. Okay.']], beat: "{b} walks inside, and doesn't come back out that night." },
        ] },
      ] },
    { id: 'confession.03',
      stage: '{a} asks {b} to come to the terrace, away from everyone.',
      turns: [
        ['a', "I've been lying to you. Not in words. But I've been lying."],
        ['b', "About what?"],
        ['a', "About how I've been with someone else when you weren't looking."],
      ] },
    { id: 'confession.04', when: { persona: 'hopeless-romantic' },
      turns: [
        ['a', "I love you, and I've messed it up, and I need you to know both of those things."],
        ['b', "What have you done?"],
      ],
      beat: '{a} tells {b.obj}, and {b} listens to all of it without saying a word.' },
    { id: 'confession.05',
      turns: [
        ['a', "I'm not proud of this. Something happened. With someone else."],
        { by: 'b', vary: [
          { turns: [['b', "Why are you telling me now?"], ['a', "Because I couldn't look at you any more."]] },
          { when: { feels: 'little' },
            turns: [['b', "Honestly? I'm not even that surprised."]], beat: '{a} has nothing to say to that.' },
        ] },
      ] },
    { id: 'confession.06', when: { rung: ['exclusive', 'official'] },
      turns: [
        ['a', "We said we were exclusive. And I broke that. I'm sorry."],
        ['b', "You broke it. And you're telling me in the garden."],
        ['a', 'I didn\'t know where else to tell you.'],
      ] },
  ],
  advice: [
    { id: 'advice.01', when: { verdict: 'good' },
      turns: [
        ['a', "Can I say something? I really like you and {c}."],
        ['b', 'Yeah?'],
        ['a', "{c} looks at you like you're the only one in here. Don't overthink it."],
      ],
      beat: '{b} smiles, and looks over at {c}.' },
    { id: 'advice.02', when: { verdict: 'good' },
      turns: [
        ['b', "Be honest. Is {c} right for me?"],
        ['a', "Honestly? I think so. I've watched {c} with you. It's real."],
      ] },
    { id: 'advice.03', when: { verdict: 'bad' },
      turns: [
        ['a', "Can I be honest about {c}? As your friend?"],
        ['b', "…Go on."],
        ['a', "I don't trust {c}. I think you deserve someone who's sure about you."],
        { by: 'b', vary: [
          { turns: [['b', "I hear you. I'm not there yet."]], beat: '{b} goes quiet for the rest of the afternoon.' },
          { when: { loyal: true },
            turns: [['b', "You don't know {c} like I do."], ['a', "Maybe. Just be careful."]] },
        ] },
      ] },
    { id: 'advice.04', when: { verdict: 'bad' },
      turns: [
        ['b', "What do you really think of {c}?"],
        ['a', "Do you want the nice answer or the real one?"],
        ['b', 'The real one.'],
        ['a', "I think {c} is keeping options open, and you're not."],
      ] },
    { id: 'advice.05', when: { verdict: 'unsure' },
      turns: [
        ['b', "Do you think {c} and me will last?"],
        ['a', "I don't know {c} well enough yet. I know you, though. Go with what you feel."],
      ] },
    { id: 'advice.06', when: { verdict: 'unsure' },
      turns: [
        ['a', "How are things with {c}?"],
        ['b', 'Good. I think. I don\'t know.'],
        ['a', "Then ask. Don't sit there guessing. Just ask."],
      ],
      beat: '{b} nods, and looks over at {c}.' },
    { id: 'advice.07', when: { verdict: 'good', persona: 'girls-girl' },
      turns: [
        ['a', "If {c} ever hurts you, I'll deal with it. But I don't think {c} will."],
        ['b', "You really like {c}, don't you?"],
        ['a', "I like how you are with {c}. That's what matters."],
      ] },
    { id: 'advice.08', when: { verdict: 'bad', persona: 'messy' },
      stage: 'Loudly enough for a few people to hear.',
      turns: [
        ['a', "Babe, {c} is not it. Everyone can see it but you."],
        ['b', "Can you not do this here?"],
      ],
      beat: 'By dinner, {c} has heard about it.' },
    { id: 'advice.09', when: { verdict: 'good' },
      turns: [
        ['a', "I'll say this once. You and {c} are good together. Don't let anyone in here tell you otherwise."],
        ['b', "Has someone been saying otherwise?"],
        ['a', "Nobody who matters."],
      ] },
    { id: 'advice.10', when: { verdict: 'good' },
      turns: [
        ['b', "Am I mad to be this into {c} already?"],
        ['a', "No. {c} is into you too. Anyone can see it."],
      ],
      beat: '{b} smiles into {b.posAdj} drink.' },
    { id: 'advice.11', when: { verdict: 'bad' },
      turns: [
        ['a', "Does {c} ever ask how you are? Actually ask?"],
        ['b', "…Sometimes."],
        ['a', "That's what I thought."],
      ],
      beat: "{b} doesn't say anything, but {b} doesn't argue either." },
    { id: 'advice.12', when: { verdict: 'bad' },
      turns: [
        ['a', "I'm not going to tell you what to do. I just don't like how {c} talks to you."],
        ['b', "How does {c} talk to me?"],
        ['a', "Like you'll always be there. Like you're not a choice."],
      ] },
    { id: 'advice.13', when: { verdict: 'unsure' },
      turns: [
        ['b', "What do you make of {c}? Honestly."],
        ['a', "I can't read {c} yet. Can you?"],
        ['b', "…Not really."],
        ['a', "Then that's your answer for now. Give it time."],
      ] },
    { id: 'advice.14', when: { verdict: 'unsure' },
      turns: [
        ['a', "Are you happy with {c}? Not okay. Happy."],
        ['b', "I think so. Most of the time."],
        ['a', "Most of the time is a start."],
      ] },
  ],
  'double-standard': [
    { id: 'double-standard.01',
      turns: [
        ['a', "When it was {b} on that screen, everyone laughed. When it was me, I'm the worst person in here."],
        ['b', "That's not fair."],
        ['a', "No. It's not."],
      ] },
    { id: 'double-standard.02',
      turns: [
        ['a', "You did the same thing as me, and nobody's said a word to you."],
        { by: 'b', vary: [
          { turns: [['b', "I know. I'm not going to pretend that's fair."]] },
          { when: { archetype: ['villain', 'mastermind', 'schemer'] },
            turns: [['b', "Maybe people just like me more."]], beat: '{a} walks off before {a} says something {a} will regret.' },
        ] },
      ] },
    { id: 'double-standard.03',
      stage: 'After Movie Night, in the kitchen.',
      turns: [
        ['a', "Why is it different when you do it?"],
        ['b', "It isn't. People are just being nicer to me."],
        ['a', "And you're fine with that?"],
      ],
      beat: "{b} doesn't answer." },
    { id: 'double-standard.04',
      turns: [
        ['a', "I'm not saying what I did was right. I'm saying {b} did it too."],
      ],
      beat: 'The villa goes quiet, and some of them look at {b}.' },
  ],
};

// Second pools (lines/day/more-*.js): appended, so every kind has room not to repeat.
for (const [k, v] of Object.entries(MORE_FEELINGS)) FEELINGS[k] = [...(FEELINGS[k] || []), ...v];

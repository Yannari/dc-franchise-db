// ══════════════════════════════════════════════════════════════════════
// pm/talk/arcs.js — the storylines that run over several episodes (pm/arcs.js)
// ══════════════════════════════════════════════════════════════════════
//
// betray-see      [a, b, c]  a finds out friend b went for c (a's one). `of`: saw · told
// betray-confront [a, b, c]  a and b, about c. `of` is b's answer: sorry · defends · cold
// betray-end      [a, b]     the friendship. `of`: mended · over
// mugged-low      [a, b]     a to friend b: always the one left
// found-love      [a, b]     b finally picks a, and means it
// villa-happy     [a, b, c]  a is happy for friend b and c
// redeem-reflect  [a, b]     a admits it to b. `of`: sincere · for-show
// redeem-act      [a, b]     a says sorry to b, whom a wronged. `of`: accepted · refused
// redeem-doubt    [a, b, c]  a and b aren't sure c's change is real
// grass-talk      [a, b, c]  a and b about c, who tells everyone everything
// grass-frozen    [a, b]     a walks in and it goes quiet; friend b
// grass-confront  [a, b]     a, whom b told on, has it out. `of`: owns · sorry (b's answer)
// parents-named   [a, b, c]  c calls couple a and b the villa's mum and dad
// parents-advice  [a, b, c]  c comes to a and b. `of`: crush · feud · heartbreak · general
// parents-mediate [a, b, c]  a steps between b and c. `of`: works · fails
// parents-wobble  [a, b]     the villa parents row
// exw-stir        [a, b, c]  a to friend b about ex c, who has walked in. `of`: still · over
// exw-partner     [a, b, c]  a asks partner b about b's ex c
// exw-talk        [a, b]     exes a and b talk. `of`: spark · closure · row
// exw-back        [a, b]     a second chance
// Each names its thread first. The exes' past is only that they were together:
// nothing says where, or why it ended.
import { build } from './build.js';

const S = { tiered: false };
const two = (kind, moves, plans = { featured: Object.keys(moves), short: Object.keys(moves).slice(-2) }) => build(kind, { ...S, plans, moves });

export const BETRAY_SEE = two('betray-see', {
  find: [
    { when: { of: 'saw' }, stage: "{a} comes round the corner and sees {b} and {c} together on the swing seat, far too close.", turns: [] },
    { when: { of: 'told' }, stage: "Someone has told {a} about {b} and {c}. {a} is sitting very still on the end of the bed.", turns: [] },
  ],
  feel: [
    { turns: [
      ['a', "{b}. Of all the people in this villa. My friend. The one person I told everything about how I feel about {c}. And {b} goes and does that."],
    ] },
    { turns: [
      ['a', "I'm not even angry yet. I think I'm just shocked. I keep waiting for someone to tell me I've got it wrong."],
    ] },
  ],
  after: [
    { turns: [], beat: "{a} walks away before {b} sees {a.obj}." },
    { turns: [], beat: "{a} doesn't go down to dinner." },
  ],
});

export const BETRAY_CONFRONT = two('betray-confront', {
  open: [
    { stage: "{a} finds {b} in the dressing room and shuts the door.", turns: [['a', "We need to talk about {c}. Now."]] },
    { stage: "{a} sits down opposite {b} on the terrace. No smile.", turns: [['a', "I know about you and {c}."]] },
  ],
  say: [
    { turns: [
      ['a', "You were my friend. You knew how I felt about {c}. I sat on your bed and told you everything, and you went and did it anyway. How could you do that to me?"],
    ] },
  ],
  answer: [
    { when: { of: 'sorry' }, turns: [
      ['b', "I'm so sorry. I really am. I didn't plan it, and I hate that I hurt you. I should have come to you the second I felt something. I'll never forgive myself for not doing that."],
      ['a', "Then why didn't you?"],
      ['b', "Because I was scared of losing you. And now I have anyway."],
    ] },
    { when: { of: 'defends' }, turns: [
      ['b', "I'm not going to apologise for having feelings. {c} wasn't yours. We're all here to find someone, and I found someone. I'm sorry it was {c}, but I'm not sorry it happened."],
      ['a', "Wow."],
    ] },
    { when: { of: 'cold' }, turns: [
      ['b', "I don't really know what you want me to say. It happened. You'll get over it."],
      ['a', "I'll get over it?"],
      ['b', "Everyone does."],
    ] },
  ],
  land: [
    { turns: [], beat: "{a} walks out, and the door bangs behind {a.obj}." },
    { turns: [], beat: "Neither of them moves for a long time." },
  ],
});

export const BETRAY_END = two('betray-end', {
  talk: [
    { when: { of: 'mended' }, stage: "Days later, {a} sits down next to {b} on the daybed.", turns: [
      ['a', "I've missed you. I'm still hurt. But I've missed you more than I've been hurt, if that makes sense."],
      ['b', "It makes sense. I've missed you every single day."],
      ['a', "Can we start again?"],
      ['b', "Please."],
    ] },
    { when: { of: 'over' }, stage: "{a} walks past {b} by the pool without a word.", turns: [
      ['b', "Are we ever going to talk again?"],
      ['a', "I don't think so. I'm sorry. I can't trust you, and I'm not going to pretend I can."],
    ] },
  ],
  land: [
    { when: { of: 'mended' }, turns: [], beat: "They hug, and both of them cry a little." },
    { when: { of: 'over' }, turns: [], beat: "{a} keeps walking. {b} doesn't follow." },
  ],
});

export const MUGGED_LOW = two('mugged-low', {
  open: [
    { stage: "{a} sits on the edge of the pool, legs in the water, staring at nothing. {b} sits down next to {a.obj}.", turns: [['b', "Talk to me."]] },
  ],
  say: [
    { turns: [
      ['a', "It's always me, isn't it? Every time. I get close to someone, I let myself feel something, and then someone new walks in, and I'm the one left on the bench. I'm starting to think it's me. That there's something about me."],
      ['b', "There's nothing wrong with you. There's something wrong with the people who keep walking away."],
      ['a', "You have to say that."],
      ['b', "I don't have to say anything. I'm saying it because it's true."],
    ] },
    { turns: [
      ['a', "I'm so tired of being everybody's second choice. I've been {~mugged-off} more times in here than I have in my whole life."],
      ['b', "Then stop giving people chances they haven't earned. Make them work for you."],
    ] },
  ],
  land: [
    { turns: [], beat: "{b} puts an arm round {a}, and they sit there until it gets dark." },
  ],
});

export const FOUND_LOVE = two('found-love', {
  moment: [
    { stage: "{b} finds {a} on the terrace, and for once it's {b} who has something to say.", turns: [
      ['b', "I know you've been let down in here. Again and again. And I know you're scared it's going to happen again. So I want you to hear it from me, properly. I'm not going anywhere. I choose you. Not because it's easy. Because it's you."],
      ['a', "Are you sure? Because I can't do it again."],
      ['b', "I've never been more sure about anything."],
    ] },
  ],
  land: [
    { turns: [], beat: "{a} cries, and this time it's the good kind." },
  ],
});

export const VILLA_HAPPY = two('villa-happy', {
  say: [
    { stage: "{a} watches {b} and {c} laughing together on the swing seat, and grins.", turns: [
      ['a', "Look at them. Honestly, after everything {b} has been through in here, to see {b} that happy with {c}. It makes my whole day."],
    ] },
    { stage: "{a} grabs {b} for a hug by the pool.", turns: [
      ['a', "I'm so happy for you. You and {c}. I mean it. You deserve this more than anyone in here."],
      ['b', "Stop it. You'll make me cry."],
    ] },
  ],
  land: [
    { turns: [], beat: "{c} catches {a}'s eye across the garden and smiles." },
  ],
});

export const REDEEM_REFLECT = two('redeem-reflect', {
  say: [
    { when: { of: 'sincere' }, stage: "{a} sits with {b} on the terrace, very quiet.", turns: [
      ['a', "I've been thinking about how I've been in here. And I don't like it. I've been selfish, I've hurt people, and I told myself it was just the game. It wasn't. It was me. I want to be better."],
      ['b', "That's a big thing to admit."],
      ['a', "It's a big thing to have done."],
    ] },
    { when: { of: 'for-show' }, stage: "{a} sits with {b} by the pool, where plenty of people can hear.", turns: [
      ['a', "I just want everyone to know I've learned a lot about myself in here. I've grown. I'm a different person now."],
      ['b', "Have you, though?"],
      ['a', "What do you mean?"],
      ['b', "Just saying it doesn't make it true."],
    ] },
  ],
  land: [
    { turns: [], beat: "{b} isn't sure what to make of it." },
  ],
});

export const REDEEM_ACT = two('redeem-act', {
  say: [
    { stage: "{a} asks {b} for a chat, and for once doesn't know how to start.", turns: [
      ['a', "I owe you an apology. A real one, not one in front of everyone. I treated you badly, and you didn't deserve any of it. I'm sorry."],
    ] },
  ],
  answer: [
    { when: { of: 'accepted' }, turns: [
      ['b', "Thank you. That means more than you know. I'm not going to pretend it didn't hurt. But I accept it."],
      ['a', "Can we start again?"],
      ['b', "We can try."],
    ] },
    { when: { of: 'refused' }, turns: [
      ['b', "I appreciate you saying it. I do. But I'm not ready to forgive you. Not yet. Maybe not in here."],
      ['a', "I understand."],
    ] },
  ],
});

export const REDEEM_DOUBT = two('redeem-doubt', {
  say: [
    { stage: "{a} and {b} watch {c} helping in the kitchen, all smiles.", turns: [
      ['a', "Do you buy it? The whole new {c} thing?"],
      ['b', "Honestly? No. People don't change that fast. Not in a week."],
      ['a', "That's what I thought. It feels a bit convenient, with a vote coming up."],
      ['b', "Very convenient."],
    ] },
  ],
  land: [
    { turns: [], beat: "{c} waves at them from the kitchen. They both wave back, and keep watching." },
  ],
});

export const GRASS_TALK = two('grass-talk', {
  say: [
    { stage: "{a} and {b} keep their voices down on the daybed while {c} is in the shower.", turns: [
      ['a', "Can I tell you something, and it doesn't leave this daybed? I don't tell {c} anything anymore. Everything you say to {c} goes straight round the whole villa by dinner."],
      ['b', "I've noticed. I said something about my partner the other day, and three people asked me about it before lunch."],
      ['a', "Exactly. {c} just can't help it."],
    ] },
  ],
  land: [
    { turns: [], beat: "When {c} comes back, they both change the subject very fast." },
  ],
});

export const GRASS_FROZEN = two('grass-frozen', {
  moment: [
    { stage: "{a} walks into the dressing room, and the whole conversation stops dead.", turns: [
      ['a', "Don't stop on my account."],
      ['b', "We weren't talking about anything."],
      ['a', "Clearly."],
    ], beat: "{a} picks up a brush, puts it down, and walks back out." },
  ],
  after: [
    { turns: [['a', "Everyone goes quiet when I walk in now. Have you noticed?"], ['b', "I've noticed."], ['a', "That's what happens when you tell one secret, apparently."]] },
  ],
});

export const GRASS_CONFRONT = two('grass-confront', {
  open: [
    { stage: "{a} finds {b} by the pool.", turns: [['a', "You told everyone what I said. I trusted you, and you told everyone."]] },
  ],
  answer: [
    { when: { of: 'owns' }, turns: [
      ['b', "I did. And I'd do it again. If someone's being lied to in here, I'm not going to keep quiet about it to protect you."],
      ['a', "It wasn't yours to tell."],
      ['b', "It wasn't yours to hide, either."],
    ] },
    { when: { of: 'sorry' }, turns: [
      ['b', "You're right. I'm sorry. I should never have said anything. I got carried away, and I didn't think about what it would do to you."],
      ['a', "No. You didn't."],
    ] },
  ],
  land: [
    { turns: [], beat: "{a} walks off. {b} watches {a.obj} go, and doesn't call after {a.obj}." },
  ],
});

export const PARENTS_NAMED = two('parents-named', {
  moment: [
    { stage: "At dinner, {c} raises a glass to {a} and {b}.", turns: [
      ['c', "To the villa's {~mum} and dad. Honestly, you two are the only reason this place hasn't fallen apart. Every time someone's crying, one of you is there. Every time there's a fight, one of you sorts it out."],
      ['a', "Stop it."],
      ['b', "We're not that old."],
      ['c', "You're a bit that old."],
    ] },
  ],
  land: [
    { turns: [], beat: "The whole table cheers, and {a} and {b} pretend to be embarrassed." },
  ],
});

export const PARENTS_ADVICE = two('parents-advice', {
  ask: [
    { stage: "{c} comes and sits on the end of {a} and {b}'s daybed.", turns: [['c', "Can I ask you two something? You're the only ones in here I trust to tell me the truth."]] },
  ],
  advice: [
    { when: { of: 'crush' }, turns: [
      ['c', "I really like someone, and I don't know if I should say anything."],
      ['a', "Say something. Life's too short, and this villa's even shorter."],
      ['b', "But be ready for any answer. If you can handle the no, you're ready to ask."],
    ] },
    { when: { of: 'feud' }, turns: [
      ['c', "I can't keep falling out with people. It's exhausting. How do you two never fall out with anyone?"],
      ['b', "We do. We just say sorry quicker than everyone else."],
      ['a', "Pick your battles. Not every look across the kitchen needs a conversation."],
    ] },
    { when: { of: 'heartbreak' }, turns: [
      ['c', "How do you stop it hurting? Everyone keeps telling me it gets easier, and it isn't."],
      ['a', "It doesn't stop. It just gets quieter. One morning you'll wake up and it'll be the second thing you think about, not the first."],
      ['b', "And until then, you've got us."],
    ] },
    { when: { of: 'general' }, turns: [
      ['c', "How did you two know? That it was right?"],
      ['b', "Honestly? It was easy. Everything else in here is hard, and this wasn't."],
      ['a', "If you have to ask, wait. If you don't have to ask, you'll know."],
    ] },
  ],
  land: [
    { turns: [], beat: "{c} leaves looking a lot lighter." },
  ],
});

export const PARENTS_MEDIATE = two('parents-mediate', {
  step: [
    { stage: "{b} and {c} are going at it by the pool. {a} walks straight in between them.", turns: [
      ['a', "Right. Enough. Both of you. Sit down, take a breath, and talk to each other like adults, or go to opposite ends of the garden. Your choice."],
    ] },
  ],
  result: [
    { when: { of: 'works' }, turns: [
      ['b', "Fine. I'm sorry for shouting."],
      ['c', "I'm sorry too. It got out of hand."],
    ], beat: "{a} doesn't say anything, just nods, and leaves them to it." },
    { when: { of: 'fails' }, turns: [
      ['c', "Stay out of it. This has got nothing to do with you."],
      ['b', "For once, I agree with {c}."],
    ], beat: "{a} holds {a.posAdj} hands up and walks away." },
  ],
});

export const PARENTS_WOBBLE = two('parents-wobble', {
  row: [
    { stage: "The two everyone calls the villa's parents are fighting, and nobody knows what to do with themselves.", turns: [
      ['a', "You're always sorting out everyone else's problems. When do you ever have time for mine?"],
      ['b', "That's not fair. I'm always there for you."],
      ['a', "You're always there for everyone. That's the problem."],
    ] },
  ],
  land: [
    { turns: [], beat: "The rest of the villa looks at each other, lost. If those two can wobble, anyone can." },
  ],
});

export const EXW_STIR = two('exw-stir', {
  say: [
    { when: { of: 'still' }, stage: "{a} pulls {b} into the dressing room the second {c} walks in.", turns: [
      ['a', "Why is {c} here? Why now? I was fine. I was actually fine. And now {c} is walking around the pool like nothing ever happened, and my stomach is in knots."],
      ['b', "Do you still have feelings for {c}?"],
      ['a', "I don't know. That's the worst part. I don't know."],
    ] },
    { when: { of: 'over' }, stage: "{a} and {b} watch {c} come down the steps.", turns: [
      ['b', "Are you okay? That's your ex."],
      ['a', "I'm fine. Honestly. A few weeks ago I'd have been in bits. Now I just think, good luck to whoever {c} goes for."],
    ] },
  ],
  land: [
    { turns: [], beat: "Across the lawn, {c} catches {a}'s eye for a second." },
  ],
});

export const EXW_PARTNER = two('exw-partner', {
  ask: [
    { stage: "{a} sits down next to {b} on the daybed.", turns: [
      ['a', "Can I ask you about {c}? Because I need to know if I should be worried."],
      ['b', "You don't need to be worried. {c} is in the past."],
      ['a', "Is {c}, though? Because the way you looked when {c} walked in didn't look like the past."],
      ['b', "It was a shock. That's all it was."],
    ] },
  ],
  land: [
    { turns: [], beat: "{a} nods, but keeps glancing over at {c} for the rest of the night." },
  ],
});

export const EXW_TALK = two('exw-talk', {
  talk: [
    { when: { of: 'spark' }, stage: "{a} and {b} end up alone on the swing seat.", turns: [
      ['b', "So. This is weird."],
      ['a', "So weird. I didn't think I'd ever be sitting next to you again."],
      ['b', "Is it a bad weird?"],
      ['a', "That's what scares me. It's not."],
    ] },
    { when: { of: 'closure' }, stage: "{a} asks {b} for a chat by the fire pit.", turns: [
      ['a', "I think we need to say the things we never said. Not to start anything. Just so we can both move on properly."],
      ['b', "I'd like that. I've thought about what I'd say a hundred times."],
    ] },
    { when: { of: 'row' }, stage: "It starts quietly in the kitchen and doesn't stay quiet.", turns: [
      ['a', "You haven't changed at all, have you?"],
      ['b', "And you have? You're doing exactly what you used to do."],
      ['a', "Don't. Don't start bringing up the past in here."],
    ] },
  ],
  land: [
    { when: { of: 'spark' }, turns: [], beat: "They sit there a while longer than they should." },
    { when: { of: 'closure' }, turns: [], beat: "When they finish, they hug, and it feels like an ending." },
    { when: { of: 'row' }, turns: [], beat: "{b} storms out of the kitchen. Some things never change." },
  ],
});

export const EXW_BACK = two('exw-back', {
  talk: [
    { stage: "{a} and {b} sit together on the terrace, closer than they have been in a long time.", turns: [
      ['a', "Do you think we gave up too early? Last time?"],
      ['b', "Every single day."],
      ['a', "Then let's not give up this time."],
      ['b', "Are you sure?"],
      ['a', "I'm sure. Are you?"],
      ['b', "I think I always was."],
    ] },
  ],
  land: [
    { turns: [], beat: "They kiss, and half the villa has been waiting for it." },
  ],
});

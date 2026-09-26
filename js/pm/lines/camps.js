// pm/lines/camps.js — the villa taking sides in a rivalry (pm/rivalry.js
// stepCamp). Data only.
//
// Casts:
//   camp-rally    [a, b, c]     b rallies round a after rival c went for a
//   camp-confront [a, b, c]     a goes at b on friend c's behalf. `of`: hot · calm
//   camp-clash    [a, b, c, d]  a (d's side) and b (c's side) go at it over c and d
//   camp-lobby    [a, b, c]     a talks to b (the one in the middle) about c. `of`: for · against
//   camp-split    [a, b, c]     rivals a and b, over c: the villa divided, at dinner
//   camp-switch   [a, b, c]     a has come over to b's side, from c's
//   camp-after    [a, b, c]     c won; b is there for a. `of`: comfort · snipe (at c)
//
// {d} is named, never a speaker. What a side says is what the engine
// recorded — the dig, the row, the play — never an invented past.
export const CAMP_LINES = {
  'camp-rally': [
    { id: 'cmr.01', stage: '{b} finds {a} on the daybed and sits right down next to {a.obj}.', turns: [
      ['b', "Are you okay? I heard what {c} said."], ['a', "I'm fine. I'm just sick of it."],
      ['b', "You don't have to be fine. That was out of order."], ['a', "Thank you. Honestly."]], beat: '{b} puts an arm round {a}, and doesn\'t move for a long time.' },
    { id: 'cmr.02', stage: 'The dressing room. {b} shuts the door behind {a}.', turns: [
      ['b', "Right. Talk to me."], ['a', "I don't want to cause drama."],
      ['b', "You didn't cause it. {c} did."], ['a', "Everyone's going to think I'm the problem."], ['b', "Nobody thinks that. I've got you."]] },
    { id: 'cmr.03', stage: 'The others gather round {a} on the terrace, {b} first.', turns: [
      ['b', "We're all on your side, you know that?"], ['a', "Are you, though?"],
      ['b', "Every single one of us. {c} can say what {c} wants."], ['a', "I just want a quiet night."], ['b', "Then you'll have one. We'll make sure."]] },
    { id: 'cmr.04', stage: '{b} brings {a} a tea and sits on the end of the bed.', turns: [
      ['b', "Don't let {c} get in your head."], ['a', "It's too late for that."],
      ['b', "Then let me get {c} out of it. You're better than all this."], ['a', "You have to say that. You're my friend."], ['b', "I'm saying it because it's true."]] },
    { id: 'cmr.05', stage: 'By the pool, {b} catches {a} wiping {a.posAdj} eyes.', turns: [
      ['b', "Hey. Hey. Don't give {c} that."], ['a', "I'm not crying over {c}."],
      ['b', "Good. Because {c} isn't worth it."]], beat: "{b} stays with {a} until {a} is laughing again." },
    { id: 'cmr.06', stage: 'In the kitchen, {b} makes a point of standing with {a}.', turns: [
      ['a', "You don't have to take sides."], ['b', "I'm not taking sides. I'm taking yours."],
      ['a', "That's the same thing."], ['b', "Is it? Oh well."]], beat: 'From across the kitchen, {c} sees it.' },
  ],

  'camp-confront': [
    // hot
    { id: 'cmc.h.01', when: { of: 'hot' }, stage: '{a} walks straight across the lawn to {b}.', turns: [
      ['a', "Why are you coming for {c}?"], ['b', "This has nothing to do with you."],
      ['a', "It does when it's my friend."], ['b', "Then your friend can tell me."], ['a', "I'm telling you. Leave {c} alone."]],
      beat: 'Half the lawn has stopped to watch.' },
    { id: 'cmc.h.02', when: { of: 'hot' }, stage: 'In the kitchen, {a} puts {a.posAdj} glass down hard.', turns: [
      ['a', "You think you can just talk about {c} like that?"], ['b', "I'll talk how I want."],
      ['a', "Not about {c}, you won't."], ['b', "Who made you {c}'s bodyguard?"], ['a', "Somebody had to."]] },
    { id: 'cmc.h.03', when: { of: 'hot' }, stage: '{a} stands up at the fire pit.', turns: [
      ['a', "I'm sorry, but I'm saying it. The way you've treated {c} is disgusting."], ['b', "Disgusting? Calm down."],
      ['a', "Don't tell me to calm down."], ['b', "You're making a scene."], ['a', "You made it."]], beat: 'Nobody at the fire pit moves.' },
    { id: 'cmc.h.04', when: { of: 'hot' }, stage: '{a} follows {b} into the dressing room.', turns: [
      ['a', "Two-faced. That's what you are."], ['b', "Excuse me?"],
      ['a', "Nice to {c}'s face, and then this."], ['b', "You've only heard one side."], ['a', "One side's enough."]] },
    { id: 'cmc.h.05', when: { of: 'hot' }, stage: 'By the pool, {a} gets right in front of {b}.', turns: [
      ['a', "Say it to me. Go on. Say it to me what you said about {c}."], ['b', "I'm not doing this with you."],
      ['a', "Because you can't."], ['b', "Because it's not your business."]], beat: '{b} walks off. {a} shouts after {b.obj}.' },
    // calm
    { id: 'cmc.c.01', when: { of: 'calm' }, stage: '{a} asks {b} for a quiet word on the terrace.', turns: [
      ['a', "I'm not having a go. I just think you need to know {c} is really upset."], ['b', "That wasn't my intention."],
      ['a', "I know. But it's how it landed."], ['b', "Okay. I'll think about it."]] },
    { id: 'cmc.c.02', stage: 'On the swing seat, {a} sits down next to {b}.', when: { of: 'calm' }, turns: [
      ['a', "Can I be honest? I think you've been a bit harsh on {c}."], ['b', "Have I?"],
      ['a', "A bit. And {c} is one of my closest in here."], ['b', "I didn't know you two were that close."], ['a', "Well, now you do."]] },
    { id: 'cmc.c.03', when: { of: 'calm' }, stage: 'In the kitchen, {a} catches {b} alone.', turns: [
      ['a', "I don't want to get involved. But {c} is my friend."], ['b', "So you're on {c}'s side."],
      ['a', "I'm on nobody's side. I just don't like seeing {c} like this."], ['b', "Fair enough."]] },
    { id: 'cmc.c.04', when: { of: 'calm' }, stage: '{a} walks with {b} down to the pool.', turns: [
      ['a', "You and {c} need to sort this out."], ['b', "{c} started it."],
      ['a', "I don't care who started it. It's making the whole villa miserable."], ['b', "…Okay. I'll talk to {c}."]] },
  ],

  'camp-clash': [
    { id: 'cmk.01', stage: '{b} walks over before {a} has finished.', turns: [
      ['b', "Don't talk to {c} like that."], ['a', "Stay out of it."],
      ['b', "You didn't stay out of it. Why should I?"], ['a', "Because {d} is my friend."], ['b', "And {c} is mine."]],
      beat: 'Now it is four of them, and the whole villa is watching.' },
    { id: 'cmk.02', stage: 'It spills out onto the lawn, and {b} steps between them.', turns: [
      ['b', "Back off."], ['a', "Or what?"], ['b', "Or we're going to have a problem too."],
      ['a', "We've already got one."]], beat: 'Two of the others have to pull them apart.' },
    { id: 'cmk.03', stage: 'At dinner, {b} puts {b.posAdj} fork down.', turns: [
      ['b', "Can everyone stop ganging up on {c}?"], ['a', "Nobody's ganging up. {c} did this to {d}."],
      ['b', "{d} isn't innocent in this."], ['a', "Are you joking?"]], beat: 'The table splits down the middle.' },
    { id: 'cmk.04', stage: '{b} storms over from the daybeds.', turns: [
      ['b', "You've been stirring this all day."], ['a', "I've been looking after {d}."],
      ['b', "You've been making it worse."], ['a', "And you've been making excuses for {c}."]] },
    { id: 'cmk.05', stage: 'By the kitchen island, {a} and {b} are face to face.', turns: [
      ['a', "Why are you defending {c}?"], ['b', "Because you're only hearing {d}'s side."],
      ['a', "{d}'s side is the true side."], ['b', "There's always two sides."], ['a', "Not this time."]], beat: 'Neither of them moves.' },
  ],

  'camp-lobby': [
    // for: a sells b on a's friend c
    { id: 'cml.f.01', when: { of: 'for' }, stage: '{a} sits down next to {b} on the sunbeds.', turns: [
      ['a', "Can I say something about {c}?"], ['b', "Go on."],
      ['a', "{c} really likes you. {c} is really into you."], ['b', "Has {c} said that?"], ['a', "{c} doesn't stop saying it."]] },
    { id: 'cml.f.02', when: { of: 'for' }, stage: 'In the kitchen, {a} leans on the counter next to {b}.', turns: [
      ['a', "I'm not saying who you should pick."], ['b', "But you're about to."],
      ['a', "I'm just saying {c} is a good one. That's all."], ['b', "I'll bear it in mind."]] },
    { id: 'cml.f.03', when: { of: 'for' }, stage: '{a} pulls {b} aside by the pool.', turns: [
      ['a', "You know {c} would never mess you about."], ['b', "I know."],
      ['a', "Do you, though? Because it doesn't look like it."], ['b', "It's complicated."], ['a', "It isn't, really."]] },
    { id: 'cml.f.04', when: { of: 'for' }, stage: 'On the terrace, {a} catches {b} alone.', turns: [
      ['a', "I've known {c} since day one in here. {c} is the real deal."], ['b', "Why are you telling me this?"],
      ['a', "Because I don't want you to miss it."]] },
    // against: a talks b out of c (schemers only)
    { id: 'cml.a.01', when: { of: 'against' }, stage: '{a} sits down next to {b} and lowers {a.posAdj} voice.', turns: [
      ['a', "I'd just be careful with {c}. That's all I'm saying."], ['b', "Why?"],
      ['a', "I've heard things."], ['b', "What things?"], ['a', "Just be careful."]], beat: '{b} watches {c} for the rest of the night.' },
    { id: 'cml.a.02', when: { of: 'against' }, stage: 'In the dressing room, {a} does {b}\'s hair.', turns: [
      ['a', "Do you think {c} is being genuine with you?"], ['b', "I think so. Don't you?"],
      ['a', "I don't know. {c} is very good at saying the right thing."], ['b', "…Now I'm worried."]] },
    { id: 'cml.a.03', when: { of: 'against' }, stage: 'By the fire pit, {a} leans in to {b}.', turns: [
      ['a', "Can I be honest? I don't think {c} is here for you."], ['b', "Then who's {c} here for?"],
      ['a', "{c}."]], beat: '{b} goes quiet.' },
    { id: 'cml.a.04', when: { of: 'against' }, stage: '{a} walks {b} to the kitchen.', turns: [
      ['a', "You know {c} was saying something completely different to the others earlier."], ['b', "Like what?"],
      ['a', "I'm not going to repeat it. Just ask yourself why {c} is so keen all of a sudden."]] },
  ],

  'camp-split': [
    { id: 'cms.01', stage: 'Dinner. One end of the table sits with {a}, the other end with {b}.', turns: [
      ['c', "Can we just have a nice dinner? For once?"], ['a', "I'm having a lovely dinner."],
      ['b', "Me too. Lovely."]], beat: 'Nobody passes anything down the middle of the table.' },
    { id: 'cms.02', stage: 'The fire pit. {a}\'s friends are on one bench, {b}\'s on the other.', turns: [
      ['c', "This is horrible. Everyone's picked a side."], ['a', "I never asked anyone to."],
      ['b', "Neither did I."], ['c', "Well, they have."]] },
    { id: 'cms.03', stage: 'The garden goes quiet as {a} and {b} walk in from opposite ends.', turns: [
      ['c', "Is it always going to be like this now?"], ['a', "Ask {b}."], ['b', "Ask {a}."]],
      beat: 'The two groups stay at opposite ends of the garden all night.' },
    { id: 'cms.04', stage: 'Getting ready in the dressing room, the mirrors are split two ways.', turns: [
      ['a', "It's so tense in here."], ['b', "Wonder why."], ['a', "Don't start."],
      ['c', "Please. Both of you."]], beat: 'The whole room goes silent.' },
    { id: 'cms.05', stage: 'On the terrace, {c} ends up in the middle of both groups.', turns: [
      ['c', "I feel like I'm walking on eggshells."], ['a', "You don't have to."],
      ['b', "Just pick, and it'll all calm down."], ['c', "It's not that easy."]] },
  ],

  'camp-switch': [
    { id: 'cmw.01', stage: '{a} sits down next to {b}, in front of everyone.', turns: [
      ['b', "Oh. Hi."], ['a', "I've heard your side now. I get it."],
      ['b', "You were on {c}'s side."], ['a', "I was. I'm not now."]], beat: 'Across the garden, {c} sees it.' },
    { id: 'cmw.02', stage: '{c} catches {a} laughing with {b}.', turns: [
      ['c', "So that's where you are now?"], ['a', "I just want to hear both sides."],
      ['c', "You picked one."], ['a', "I picked the one that makes sense."]] },
    { id: 'cmw.03', stage: 'In the kitchen, {a} walks past {c} and goes to stand with {b}.', turns: [
      ['c', "Wow."], ['a', "Don't make it a thing."], ['c', "You made it a thing."]],
      beat: "{c} doesn't speak to {a} for the rest of the day." },
    { id: 'cmw.04', stage: '{a} finds {b} by the pool.', turns: [
      ['a', "I owe you an apology. I only listened to {c}."], ['b', "What changed?"],
      ['a', "I watched how {c} was with you. It didn't sit right."], ['b', "Thank you. That means a lot."]] },
  ],

  'camp-after': [
    // comfort
    { id: 'cma.c.01', when: { of: 'comfort' }, stage: 'After the recoupling, {b} gets to {a} first.', turns: [
      ['b', "Come here."], ['a', "I really thought it would be me."],
      ['b', "I know. {c} doesn't know what's been left on the table."], ['a', "Don't. I'll cry."], ['b', "Then cry. I'm here."]] },
    { id: 'cma.c.02', when: { of: 'comfort' }, stage: 'In the dressing room, {b} sits {a} down.', turns: [
      ['b', "You did nothing wrong."], ['a', "Then why wasn't it me?"],
      ['b', "Because the right one for you hasn't walked in yet."], ['a', "You have to say that."], ['b', "I don't have to say anything."]] },
    { id: 'cma.c.03', when: { of: 'comfort' }, stage: 'On the terrace, {b} brings {a} a drink.', turns: [
      ['b', "How are you doing?"], ['a', "Honestly? Embarrassed."],
      ['b', "Don't be. Everyone could see how much you liked them. That's nothing to be embarrassed about."]] },
    { id: 'cma.c.04', when: { of: 'comfort' }, stage: 'By the pool, {b} sits with {a} in silence for a while.', turns: [
      ['a', "Say something."], ['b', "Their loss."], ['a', "Is that it?"], ['b', "That's all it is."]], beat: '{a} laughs for the first time all night.' },
    // snipe: b has words for the winner
    { id: 'cma.s.01', when: { of: 'snipe' }, stage: 'After the recoupling, {b} walks past {c} on the way to {a}.', turns: [
      ['b', "Hope it was worth it."], ['c', "Sorry?"],
      ['b', "You heard."]], beat: '{b} sits down with {a} and doesn\'t look back.' },
    { id: 'cma.s.02', when: { of: 'snipe' }, stage: 'In the kitchen, {b} watches {c} celebrate.', turns: [
      ['b', "Enjoy it. You won't have it long."], ['c', "Is that a threat?"],
      ['b', "It's a prediction."], ['a', "Leave it. It's not worth it."]] },
    { id: 'cma.s.03', when: { of: 'snipe' }, stage: 'At the fire pit, {b} leans over to {a}, loud enough for {c}.', turns: [
      ['b', "Some people will do anything to get picked."], ['c', "Is that about me?"],
      ['b', "Did I say your name?"]], beat: '{a} tries very hard not to smile.' },
    { id: 'cma.s.04', when: { of: 'snipe' }, stage: '{b} blocks {c}\'s way on the terrace steps.', turns: [
      ['b', "I hope you know how much you hurt {a}."], ['c', "I didn't do anything. It wasn't my choice."],
      ['b', "You made sure it wasn't {a}."]] },
  ],
};

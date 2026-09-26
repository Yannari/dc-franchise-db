// pm/lines/game.js — the game player (pm/game.js). Data only.
//
//   game-plan      [a, b]     a tells friend b the plan. `of`: ally · shocked
//   game-latch     [a, b]     a works b, the one the villa likes
//   game-two-faced [a, b, c]  a says something about c to b, behind c's back
//   game-suspect   [a, b, c]  a tells b: c is playing a game
//   game-called    [a, b, c]  a calls b out in front of the villa; c is the one being played.
//                             `of`: denies · owns · turns
//   game-fallout   [a, b]     a (the one played) and b (the player), after. `of`: ends · stays · unsure
//   game-end       [a, b]     a the player, b the one played. `of`: real · amends · doubles-down
//
// From the show: Ron "latched on" to Lana "because everyone liked her" (Shaq,
// UK 9), and called it "outrageous"; Harriett's "careful with me" behind a
// back and "you're so great" to the face (UK 11).
export const GAME_LINES = {
  'game-plan': [
    { id: 'gpl.a.01', when: { of: 'ally' }, stage: 'The roof terrace, late. {a} and {b} are on their own.', turns: [
      ['a', "Can I be honest with you? I'm not here to fall in love."], ['b', "Go on."],
      ['a', "I'm here to get to the end. And I know exactly who gets me there."], ['b', "Who?"], ['a', "The one everyone loves."]] },
    { id: 'gpl.a.02', when: { of: 'ally' }, stage: 'In the dressing room, {a} lowers {a.posAdj} voice.', turns: [
      ['a', "If I couple up with the one the public likes, I'm safe every week."], ['b', "That's cold."],
      ['a', "That's smart."], ['b', "…It is quite smart."]] },
    { id: 'gpl.a.03', when: { of: 'ally' }, stage: 'By the pool, {a} and {b} watch the others.', turns: [
      ['b', "You don't actually like anyone in here, do you?"], ['a', "I like winning."],
      ['b', "Fair enough. I won't say anything."]] },
    { id: 'gpl.s.01', when: { of: 'shocked' }, stage: 'The roof terrace. {a} tells {b} something {b} doesn\'t want to hear.', turns: [
      ['a', "I'm going to go for whoever keeps me safe. Feelings can come later."], ['b', "You can't be serious."],
      ['a', "It's a game. Everyone's playing it."], ['b', "I'm not."]], beat: '{b} goes quiet, and stays quiet.' },
    { id: 'gpl.s.02', when: { of: 'shocked' }, stage: 'In the kitchen, {a} leans over to {b}.', turns: [
      ['a', "Just between us, I'm not that into anyone yet. I'm just being clever."], ['b', "Clever how?"],
      ['a', "Staying close to the right people."], ['b', "That doesn't sit right with me."]] },
    { id: 'gpl.s.03', when: { of: 'shocked' }, stage: 'On the daybed, {a} tells {b} the plan.', turns: [
      ['b', "So none of it's real?"], ['a', "It's real enough."],
      ['b', "That's not an answer."]], beat: '{b} watches {a} differently for the rest of the day.' },
  ],

  'game-latch': [
    { id: 'gla.01', stage: '{a} brings {b} breakfast in bed.', turns: [
      ['b', "What have I done to deserve this?"], ['a', "Nothing. You just deserve it."],
      ['b', "Stop. You're too much."], ['a', "I'm just being honest. You're the only one I want in here."]] },
    { id: 'gla.02', stage: 'On the swing seat, {a} takes {b}\'s hand.', turns: [
      ['a', "I've never felt like this about anyone this fast."], ['b', "Really?"],
      ['a', "Really. It's you. It's always been you."]], beat: '{b} lights up.' },
    { id: 'gla.03', stage: 'At the fire pit, {a} sits right next to {b} and doesn\'t leave all night.', turns: [
      ['b', "You're very attached tonight."], ['a', "I'm always attached to you."],
      ['b', "I'm not complaining."]] },
    { id: 'gla.04', stage: 'By the pool, {a} pulls {b} aside.', turns: [
      ['a', "Whatever anyone says about me, I'm here for you. Only you."], ['b', "Why would anyone say anything?"],
      ['a', "People talk. Just remember what I said."]] },
    { id: 'gla.05', stage: '{a} tells {b} in front of the others, loud enough to be heard.', turns: [
      ['a', "Everyone knows you're the best thing in this villa."], ['b', "You're embarrassing me."],
      ['a', "Good. You should hear it more."]] },
  ],

  'game-two-faced': [
    { id: 'gtf.01', stage: 'In the kitchen, {a} leans on the counter next to {b}.', turns: [
      ['a', "Honestly? {c} is a bit much for me."], ['b', "But you're always saying how much you like {c}."],
      ['a', "I like how much everyone likes {c}. That's different."], ['b', "Wow."]] },
    { id: 'gtf.02', stage: 'By the pool, {a} talks to {b} while {c} is in the shower.', turns: [
      ['a', "{c} needs to be careful with me."], ['b', "What does that mean?"],
      ['a', "Nothing. Forget I said it."]], beat: 'Later, {b} hears {a} tell {c} how great {c} is.' },
    { id: 'gtf.03', stage: 'In the dressing room, {a} and {b} are doing their hair.', turns: [
      ['b', "You and {c} seem really solid."], ['a', "We're fine. It's working."],
      ['b', "Working?"], ['a', "You know what I mean."], ['b', "I don't think I do."]] },
    { id: 'gtf.04', stage: 'On the daybeds, {a} says it to {b} under {a.posAdj} breath.', turns: [
      ['a', "If someone better walked in tomorrow, I'd be off."], ['b', "And {c}?"],
      ['a', "{c} would be fine."]], beat: '{b} looks over at {c}, who is waving at them.' },
    { id: 'gtf.05', stage: '{a} and {b} are on the terrace.', turns: [
      ['a', "It's nice being with someone the whole villa likes. Makes life easy."], ['b', "Is that why you're with {c}?"],
      ['a', "It's not the only reason."], ['b', "But it's a reason."]] },
  ],

  'game-suspect': [
    { id: 'gsu.01', stage: 'In the dressing room, {a} shuts the door and turns to {b}.', turns: [
      ['a', "Can I say something? I think {c} is playing a game."], ['b', "Why?"],
      ['a', "Because I've heard two completely different stories."], ['b', "I've thought it too."]] },
    { id: 'gsu.02', stage: 'On the sunbeds, {a} keeps {a.posAdj} voice down.', turns: [
      ['a', "{c} latched on to the one person everyone loves. Coincidence?"], ['b', "Maybe it's real."],
      ['a', "Maybe. I don't buy it."]] },
    { id: 'gsu.03', stage: 'By the fire pit, {a} watches {c} and says it to {b}.', turns: [
      ['a', "Watch how {c} acts when the cameras are on."], ['b', "What are you getting at?"],
      ['a', "Just watch."]], beat: '{b} watches. {b} starts to see it.' },
    { id: 'gsu.04', stage: 'In the kitchen, {a} and {b} wash up.', turns: [
      ['b', "Do you trust {c}?"], ['a', "Not as far as I can throw {c}."],
      ['b', "Me neither. Should we say something?"], ['a', "Not yet. But soon."]] },
    { id: 'gsu.05', stage: 'On the swing, {a} tells {b} what {a} heard.', turns: [
      ['a', "{c} told me one thing, and told someone else the opposite."], ['b', "About what?"],
      ['a', "About how {c} feels. That's what worries me."]] },
  ],

  'game-called': [
    // denies
    { id: 'gca.d.01', when: { of: 'denies' }, stage: 'At the fire pit, {a} stands up.', turns: [
      ['a', "I'm just going to say it. I think {b} is playing a game with {c}."], ['b', "That's outrageous."],
      ['a', "Is it?"], ['b', "Not a chance. I'd never do that."], ['c', "{b}? Look at me."]],
      beat: 'Every head at the fire pit turns to {c}.' },
    { id: 'gca.d.02', when: { of: 'denies' }, stage: 'In front of the whole terrace, {a} turns to {b}.', turns: [
      ['a', "You told me {c} was a bit much for you."], ['b', "I never said that."],
      ['a', "You said it to my face."], ['b', "You're twisting it."], ['c', "Did you say it or not?"]] },
    { id: 'gca.d.03', when: { of: 'denies' }, stage: 'The game is Never Have I Ever. {a} reads the card and looks straight at {b}.', turns: [
      ['a', "Never have I ever said one thing to someone's face and another behind their back. {b}?"],
      ['b', "Why are you looking at me?"], ['a', "You know why."], ['b', "This is ridiculous."]],
      beat: '{c} puts {c.posAdj} drink down.' },
    // owns
    { id: 'gca.o.01', when: { of: 'owns' }, stage: 'At the fire pit, {a} calls it.', turns: [
      ['a', "You're playing a game, {b}. Everyone can see it."], ['b', "Of course I'm playing a game. It's a game show."],
      ['c', "Are you joking?"], ['b', "I'm being honest. Isn't that what everyone wants?"]], beat: 'The fire pit goes completely silent.' },
    { id: 'gca.o.02', when: { of: 'owns' }, stage: 'On the lawn, in front of everyone, {a} says it.', turns: [
      ['a', "Admit it. You went for {c} because everyone likes {c}."], ['b', "And? I'm still here, aren't I?"],
      ['c', "Wow. Okay."]] },
    // turns: on the accuser
    { id: 'gca.t.01', when: { of: 'turns' }, stage: 'At the fire pit, {a} says it, and {b} is on {b.posAdj} feet at once.', turns: [
      ['a', "I think {b} is playing {c}."], ['b', "Says you? You've been stirring since day one."],
      ['a', "This isn't about me."], ['b', "It is now. Why are you so obsessed with my couple?"]], beat: 'Now the whole villa is arguing.' },
    { id: 'gca.t.02', when: { of: 'turns' }, stage: 'In the kitchen, {a} confronts {b} in front of the others.', turns: [
      ['a', "You're two-faced, and {c} deserves to know."], ['b', "You're jealous. That's all this is."],
      ['a', "Jealous of what?"], ['b', "Of what we've got."], ['c', "Stop. Both of you."]] },
  ],

  'game-fallout': [
    // ends
    { id: 'gfo.e.01', when: { of: 'ends' }, stage: '{a} finds {b} alone on the terrace.', turns: [
      ['a', "Was any of it real?"], ['b', "Some of it."],
      ['a', "Some of it. Right."], ['b', "Please don't do this."], ['a', "I'm not doing anything. You did."]],
      beat: '{a} walks away and doesn\'t look back.' },
    { id: 'gfo.e.02', when: { of: 'ends' }, stage: 'By the pool, {a} doesn\'t sit down.', turns: [
      ['a', "I defended you. To everyone."], ['b', "I know."],
      ['a', "And they were right the whole time."], ['b', "It's not as simple as that."], ['a', "It is for me."]] },
    { id: 'gfo.e.03', when: { of: 'ends' }, stage: 'In the bedroom, {a} takes {a.posAdj} pillow off their bed.', turns: [
      ['b', "Where are you going?"], ['a', "The daybed."], ['b', "Come on."],
      ['a', "I'm not sharing a bed with someone who was using me."]] },
    // stays
    { id: 'gfo.s.01', when: { of: 'stays' }, stage: 'On the swing, {a} sits with {b}.', turns: [
      ['a', "Tell me they're wrong."], ['b', "They're wrong."],
      ['a', "Okay. I believe you."]], beat: 'Across the garden, a few of the others exchange a look.' },
    { id: 'gfo.s.02', when: { of: 'stays' }, stage: '{a} goes to find {b} in the kitchen.', turns: [
      ['a', "I don't care what everyone's saying. I know what we've got."], ['b', "Thank you."],
      ['a', "Don't make me look stupid."], ['b', "I won't."]] },
    // unsure
    { id: 'gfo.u.01', when: { of: 'unsure' }, stage: 'On the daybed, {a} keeps a gap between them.', turns: [
      ['b', "Are we okay?"], ['a', "I don't know what to believe any more."],
      ['b', "Believe me."], ['a', "That's the problem. I did."]] },
    { id: 'gfo.u.02', when: { of: 'unsure' }, stage: 'By the fire pit, {a} can\'t look at {b}.', turns: [
      ['a', "I need some time."], ['b', "How much time?"], ['a', "I don't know. As long as it takes."]] },
  ],

  'game-end': [
    // real: the game stopped being a game
    { id: 'gen.r.01', when: { of: 'real' }, stage: '{a} asks {b} for a chat, away from everyone.', turns: [
      ['a', "I came in here with a plan. I'm not going to lie to you any more."], ['b', "Go on."],
      ['a', "Somewhere along the way it stopped being a plan. I actually fell for you."], ['b', "How am I meant to believe that?"],
      ['a', "Watch me. Every day until the end."]], beat: '{b} doesn\'t say yes. {b} doesn\'t walk away, either.' },
    { id: 'gen.r.02', when: { of: 'real' }, stage: 'On the terrace, {a} is shaking.', turns: [
      ['a', "It started as a game. It isn't one now."], ['b', "When did it change?"],
      ['a', "I don't know. I just know it did."]] },
    // amends
    { id: 'gen.a.01', when: { of: 'amends' }, stage: '{a} finds {b} by the pool.', turns: [
      ['a', "I'm sorry. I got it wrong, and I hurt you."], ['b', "You did."],
      ['a', "I'm not asking for anything. I just wanted you to hear it."], ['b', "…Thank you for saying it."]] },
    { id: 'gen.a.02', when: { of: 'amends' }, stage: 'At dinner, {a} stands up in front of everyone, {b} included.', turns: [
      ['a', "I owe a few people in here an apology. {b} most of all."], ['b', "Okay."],
      ['a', "I played it wrong. I'm going to be better."]], beat: 'Nobody claps. A few people nod.' },
    // doubles down
    { id: 'gen.d.01', when: { of: 'doubles-down' }, stage: 'On the lawn, {b} tries to talk to {a}.', turns: [
      ['b', "Do you even feel bad?"], ['a', "Honestly? No. I came here to win."],
      ['b', "At my expense."], ['a', "At anyone's."]], beat: '{b} walks away.' },
    { id: 'gen.d.02', stage: 'In the kitchen, {a} makes a coffee as if nothing happened.', when: { of: 'doubles-down' }, turns: [
      ['b', "You're really just carrying on?"], ['a', "What else would I do?"],
      ['b', "Say sorry, for a start."], ['a', "I'll say sorry when I've done something wrong."]] },
  ],
};

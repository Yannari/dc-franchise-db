// pm/lines/blowup.js — when it kicks off (pm/blowup.js). Data only.
//   blowup         [a, b]     a goes for b. `of`: cheating · steal · casa · told ·
//                             vote · jealousy · history
//   pile-in        [a, b, c]  a steps in on b's side, against c
//   villa-divided  [a, b]     the villa after the row between a and b
//   cold-shoulder  [a, b]     opposite camps, days later
//   clear-the-air  [a, b]     `of`: peace · still-angry
export const BLOWUP_LINES = {
  blowup: [
    // cheating: b was the other one, or the partner who did it
    { id: 'bu.c.01', when: { of: 'cheating', cause: 'rival' }, stage: 'The garden, and it starts the second they see each other.', turns: [
      ['a', "Did you know they were in a couple?"], ['b', "Everyone knew. So what?"], ['a', "So what? You looked me in the eye every day."],
      ['b', "I didn't owe you anything."], ['a', "You owed me the truth!"], ['b', "Take it up with them, not me."],
      ['a', "Oh, I will. But I'm starting with you."]], beat: 'The whole garden has stopped pretending not to watch.' },
    { id: 'bu.c.02', when: { of: 'cheating', cause: 'rival', kissed: true }, stage: 'The kitchen. It starts quiet, and it does not stay quiet.', turns: [
      ['a', "Can I have a word?"], ['b', "Here's fine."], ['a', "You kissed my partner."],
      ['b', "Your partner kissed me."], ['a', "Don't do that. Don't twist it."], ['b', "I'm not twisting anything. I'm telling you what happened."],
      ['a', "You smiled at me at breakfast the next morning!"], ['b', "What was I meant to do? Cry?"]], beat: 'Somebody takes the knives off the counter. Just in case.' },
    { id: 'bu.c.03', when: { of: 'cheating', cause: 'partner' }, turns: [
      ['a', "I'm so disappointed in you."], ['b', "It's not what you think."], ['a', "I saw it. We all saw it."],
      ['b', "It was one moment."], ['a', "One moment you kept secret for days."], ['b', "I was going to tell you."],
      ['a', "When? After the final?"]], beat: '{a} is shaking. {b} cannot look up.' },
    { id: 'bu.c.04', when: { of: 'cheating', cause: 'partner' }, stage: 'By the fire pit, loud enough for the terrace to hear.', turns: [
      ['a', "You don't get to be the victim here."], ['b', "I'm not being the victim."], ['a', "Then stop crying!"],
      ['b', "I'm crying because you're screaming at me!"], ['a', "I'm screaming because you went behind my back!"],
      ['b', "I didn't plan any of this."], ['a', "Nobody ever does."]] },
    { id: 'bu.c.05', when: { of: 'cheating', cause: 'rival' }, stage: 'The terrace, and the whole villa goes quiet to listen.', turns: [
      ['a', "You knew they had someone. You knew, and you didn't care."], ['b', "It's not my job to protect your couple."],
      ['a', "No. But it was your job not to be a snake about it."], ['b', "A snake? Seriously?"], ['a', "Seriously."]], beat: '{b} laughs, and nobody else does.' },
    { id: 'bu.k.04', when: { of: 'casa', cause: 'rival' }, stage: 'The morning after the Casa recoupling, by the pool.', turns: [
      ['a', "You walked in here and took the one person I had."], ['b', "I didn't take anyone. They chose."],
      ['a', "You knew about me before you even met them."], ['b', "And they still chose me."], ['a', "Enjoy it while it lasts."]], beat: 'Two of the others move between them.' },
    { id: 'bu.k.05', when: { of: 'casa', cause: 'rival' }, turns: [
      ['b', "I'm not going to apologise for how they feel about me."], ['a', "I'm not asking you to. I'm asking you to stop smirking at me."],
      ['b', "I'm not smirking."], ['a', "You're doing it right now!"]] },
    // steal
    { id: 'bu.s.01', when: { of: 'steal' }, stage: 'Straight after the recoupling, by the bench.', turns: [
      ['a', "You couldn't wait, could you?"], ['b', "It's a recoupling. You pick who you want."], ['a', "You picked MINE."],
      ['b', "They're not yours. Nobody in here is anybody's."], ['a', "You said we were friends."],
      ['b', "We are. This isn't about you."], ['a', "It's completely about me!"]], beat: 'Two islanders step between them.' },
    { id: 'bu.s.02', when: { of: 'steal' }, turns: [
      ['a', "Two days ago you were telling me how happy I looked."], ['b', "You did look happy."],
      ['a', "And then you stood up and took it."], ['b', "I followed my heart."], ['a', "Follow it somewhere else next time."]] },
    { id: 'bu.s.03', when: { of: 'steal' }, stage: 'The terrace, and the whole villa can hear.', turns: [
      ['b', "I'm not going to apologise for how I feel."], ['a', "I'm not asking you to. I'm asking why you smiled at me the whole time."],
      ['b', "Because I like you."], ['a', "You've got a funny way of showing it!"]] },
    // casa
    { id: 'bu.k.01', when: { of: 'casa', cause: 'partner' }, stage: 'The morning after Casa Amor, and nobody has slept.', turns: [
      ['a', "You walked in holding hands with someone and you can't even look at me."], ['b', "What do you want me to say?"],
      ['a', "Anything! Anything at all!"], ['b', "I'm sorry it happened like that."], ['a', "Like what? In front of everyone?"],
      ['b', "Yes."], ['a', "That's not an apology. That's just telling me what happened."]] },
    { id: 'bu.k.02', when: { of: 'casa', cause: 'partner' }, turns: [
      ['a', "I stayed loyal for you. Every single day."], ['b', "I never asked you to."],
      ['a', "You didn't have to! That's what being in a couple means!"], ['b', "Maybe we weren't as solid as you thought."],
      ['a', "Say that again. Say it to my face."]], beat: 'The fire pit goes completely silent.' },
    { id: 'bu.k.03', when: { of: 'casa', cause: 'partner' }, stage: 'The lawn, the new arrival hovering by the pool.', turns: [
      ['a', "A few days. A few days, and you're a different person."], ['b', "Or maybe this is who I've been all along."],
      ['a', "Then who have I been talking to for weeks?"], ['b', "I don't know. Someone you wanted me to be."]] },
    // told: b exposed a
    { id: 'bu.t.01', when: { of: 'told' }, stage: 'The daybeds, and it gets loud fast.', turns: [
      ['a', "Why couldn't you just come to me first?"], ['b', "Because they deserved to know."],
      ['a', "You didn't do it for them. You did it for you."], ['b', "That's not fair."],
      ['a', "You've been waiting for this since day one."], ['b', "I've been waiting for you to be honest since day one."]] },
    { id: 'bu.t.02', when: { of: 'told' }, turns: [
      ['a', "You just couldn't keep your mouth shut, could you?"], ['b', "I'm a friend. To them."],
      ['a', "And what am I?"], ['b', "Someone who should have kept their hands to themselves."]], beat: 'Half the villa gasps. The other half pretends not to.' },
    { id: 'bu.t.03', when: { of: 'told' }, stage: 'The kitchen, where it has been brewing all afternoon.', turns: [
      ['b', "I didn't make anything up."], ['a', "You didn't have to. You just made sure everyone heard."],
      ['b', "Would you rather they found out on a screen?"], ['a', "I'd rather you minded your own business!"]] },
    // vote
    { id: 'bu.v.01', when: { of: 'vote' }, turns: [
      ['a', "You voted them out. Look me in the eye and tell me why."], ['b', "It was a vote. Someone had to go."],
      ['a', "It didn't have to be them!"], ['b', "Would you rather it was me?"], ['a', "Right now? Honestly?"]], beat: 'Somebody steps in before the answer comes.' },
    { id: 'bu.v.02', when: { of: 'vote' }, stage: 'The terrace, straight after the dumping.', turns: [
      ['a', "You hugged them goodbye. You actually hugged them."], ['b', "I'm allowed to be sad."],
      ['a', "You sent them home!"], ['b', "I voted with my head. Not my heart."], ['a', "Clearly you haven't got one."]] },
    // jealousy
    { id: 'bu.j.01', when: { of: 'jealousy', taken: true }, stage: 'By the pool, after one look too many.', turns: [
      ['a', "Why are you always all over them?"], ['b', "I'm not all over anyone."], ['a', "You were sitting on their sunbed."],
      ['b', "It's a sunbed!"], ['a', "In here, it's never just a sunbed."], ['b', "Honestly, you need to calm down."],
      ['a', "Don't tell me to calm down."]] },
    { id: 'bu.j.02', when: { of: 'jealousy', bTaken: false }, turns: [
      ['a', "Keep your eyes on your own couple."], ['b', "I haven't got a couple."], ['a', "I know. And it shows."]], beat: 'That one lands, and everyone hears it land.' },
    { id: 'bu.j.03', when: { of: 'jealousy' }, stage: 'The dressing room, then the corridor, then the whole villa.', turns: [
      ['a', "I've watched you all week."], ['b', "Then you've been watching the wrong person."],
      ['a', "Every time they laugh, you're there."], ['b', "People laugh around me. I'm funny."], ['a', "You're not that funny."]] },
    // history
    { id: 'bu.h.01', when: { of: 'history' }, stage: 'It starts over nothing, again.', turns: [
      ['a', "You've had a problem with me since day one."], ['b', "I haven't got a problem with you."],
      ['a', "You roll your eyes every time I speak."], ['b', "Then stop saying things worth rolling my eyes at."],
      ['a', "See? That. That's exactly what I mean."]], beat: 'It goes on until somebody physically walks one of them away.' },
    { id: 'bu.h.02', when: { of: 'history' }, turns: [
      ['a', "I'm done being nice to you."], ['b', "When were you nice to me?"], ['a', "Every single day I've bitten my tongue."],
      ['b', "Well, don't let me stop you now."], ['a', "Oh, I won't."]], beat: 'Everyone at dinner puts their forks down.' },
    { id: 'bu.h.03', when: { of: 'history' }, stage: 'The fire pit, late, and it finally comes out.', turns: [
      ['b', "Just say it. Whatever it is, just say it."], ['a', "Fine. I don't trust you. I never have."],
      ['b', "Why?"], ['a', "Because you're one person to my face and another the second I walk off."],
      ['b', "That's rich, coming from you."]] },
  ],
  'pile-in': [
    { id: 'pi.01', turns: [['a', "No. Leave {b} alone. You're completely out of order, {c}."]], beat: '{a} steps right in front of {b}.' },
    { id: 'pi.02', turns: [['a', "{c}, walk away. Now."], ['c', "Stay out of it."], ['a', "No. I'm in it now."]] },
    { id: 'pi.03', turns: [['a', "Everyone's thinking it, so I'll say it. {b} is right."]], beat: 'That splits the room down the middle.' },
    { id: 'pi.04', turns: [['a', "I'm sorry, but I've got {b}'s back on this one."], ['c', "Of course you have."]] },
    { id: 'pi.05', turns: [['a', "Can we all just calm down? {b} hasn't done anything wrong."], ['c', "Are you joking?"]] },
    { id: 'pi.06', turns: [['a', "You don't get to talk to {b} like that. Not in front of me."]], beat: '{c} laughs, and {a} does not.' },
    { id: 'pi.07', turns: [['a', "Honestly, {c}, look at yourself right now."], ['c', "Look at myself? Look at {b}!"]] },
    { id: 'pi.08', turns: [['a', "I'm with {b}. I'm sorry, {c}. I am."]], beat: '{c} looks at {a} like {a} has just picked a side for good. {a} has.' },
    { id: 'pi.09', turns: [['a', "You've been wanting a go at {b} all week, {c}. Don't pretend this is about anything else."]] },
    { id: 'pi.10', turns: [['a', "{b}, come with me. Come on. You don't have to listen to this."]], beat: '{a} leads {b} away, and {c} is left shouting at nobody.' },
  ],
  'villa-divided': [
    { id: 'vd.01', turns: [['narrator', "And just like that, there are two villas in one. One on the terrace, one in the kitchen."]], beat: 'Nobody crosses the lawn for the rest of the night.' },
    { id: 'vd.02', turns: [['narrator', "Dinner tonight is two tables. Nobody has said why. Nobody needs to."]] },
    { id: 'vd.03', stage: 'The villa, an hour later. Two huddles, at opposite ends of the garden.', turns: [['narrator', "Every islander has picked a side. Some of them very loudly. Some of them by sitting down."]] },
    { id: 'vd.04', turns: [['narrator', "The row is over. The war, apparently, has just started."]], beat: 'Somebody puts the music on. Nobody dances.' },
    { id: 'vd.05', stage: 'Lights out, and every bed in the villa is whispering.', turns: [['narrator', "Two camps, one bedroom. Sleep well, everyone."]] },
  ],
  'cold-shoulder': [
    { id: 'cs2.01', turns: [['a', "Morning."]], beat: '{b} looks straight through {a} and keeps walking.' },
    { id: 'cs2.02', turns: [['a', "Can you pass the milk?"], ['b', "It's right there."]], beat: 'Neither of them moves for the milk.' },
    { id: 'cs2.03', stage: 'The kitchen goes quiet when {a} walks in and {b} is already there.', turns: [['b', "I'll come back later."]] },
    { id: 'cs2.04', turns: [['a', "Are we really not talking?"], ['b', "You made your choice the other night."]] },
    { id: 'cs2.05', stage: '{a} sits down on the daybeds, and {b} gets up.', turns: [['a', "Seriously?"]], beat: '{b} does not turn round.' },
    { id: 'cs2.06', turns: [['b', "I heard what you said about me, by the way."], ['a', "Then you heard the truth."]] },
  ],
  'clear-the-air': [
    { id: 'ca.p.01', when: { of: 'peace' }, stage: 'The daybeds, away from everyone.', turns: [
      ['a', "Can we talk? Properly, no shouting."], ['b', "Please. I'm exhausted."], ['a', "I said things I didn't mean."],
      ['b', "So did I. Most of them."], ['a', "Most?"], ['b', "Some of them I meant. But I'm sorry how I said them."]], beat: 'They hug, awkwardly, and then properly.' },
    { id: 'ca.p.02', when: { of: 'peace' }, turns: [
      ['a', "I don't want to spend the rest of this fighting with you."], ['b', "Me neither."],
      ['a', "Clean slate?"], ['b', "Clean-ish slate."]], beat: 'The whole kitchen breathes out.' },
    { id: 'ca.p.03', when: { of: 'peace' }, stage: 'By the pool, late.', turns: [
      ['b', "I think we're more alike than we want to admit."], ['a', "That's what scares me."],
      ['b', "Truce?"], ['a', "Truce."]], beat: 'They shake on it. Somebody on the terrace actually claps.' },
    { id: 'ca.a.01', when: { of: 'still-angry' }, turns: [
      ['a', "I wanted to clear the air."], ['b', "Then say sorry."], ['a', "I'm not saying sorry for being right."],
      ['b', "Then we've got nothing to talk about."]], beat: 'Neither of them budges an inch.' },
    { id: 'ca.a.02', when: { of: 'still-angry' }, turns: [
      ['b', "Do you actually regret any of it?"], ['a', "Honestly? No."], ['b', "Then why are we doing this?"]], beat: '{b} walks off first.' },
    { id: 'ca.a.03', when: { of: 'still-angry' }, stage: 'The terrace, both of them with arms folded.', turns: [
      ['a', "I'll be civil. That's all I can do."], ['b', "Civil's fine. Civil's more than you've managed so far."]] },
  ],
};

const K = (kind, more = {}) => ({ kind, ...more });
export const BLOWUP_HUT = {
  honest: [
    { id: 'hut.bu.h1', when: K('blowup', { role: 0 }), turns: [['a', "I'm not proud of the shouting. I'm not sorry for what I said."]] },
    { id: 'hut.bu.h2', when: K('blowup', { role: 1 }), turns: [['a', "I've never been spoken to like that in my life."]] },
    { id: 'hut.bu.h3', when: K('pile-in', { role: 0 }), turns: [['a', "I wasn't going to stand there and watch it. Not a chance."]] },
    { id: 'hut.bu.h4', when: K('clear-the-air', { of: 'peace' }), turns: [['a', "It feels like I can breathe in the villa again."]] },
    { id: 'hut.bu.h5', when: K('cold-shoulder', { role: 1 }), turns: [['a', "They picked a side. I'm just letting them live on it."]] },
  ],
  'two-faced': [
    { id: 'hut.bu.t1', when: K('clear-the-air', { of: 'peace', role: 0 }), turns: [['a', "We made up. For now. I haven't forgotten a single word."]] },
    { id: 'hut.bu.t2', when: K('pile-in', { role: 0 }), turns: [['a', "Honestly? I didn't care who was right. I cared who's still here next week."]] },
  ],
};

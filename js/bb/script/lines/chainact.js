// ══════════════════════════════════════════════════════════════════════
// bb/script/lines/chainact.js — the Chain of Safety, spoken (Phase 7)
// ══════════════════════════════════════════════════════════════════════
//
// What houseguests say while the chain runs (written by bb/script/ceremony.js)
// and in the house afterwards (chainfall.*, written by chainFallout). Big
// Brother's rules are the viewer's own lines.
//
//   chain.start     a holds the first link                          comp | hoh | again
//   chain.link      a names b                                       showmance | ally | rival | cold | early | mid | late
//   chain.passed    a was not picked by b (who a counted on)        scene
//   chain.last      a is the last link                             canada ({group} are left) | quebec (b is left)
//   chain.leftover  a was never picked                             canada ({group} with a) | quebec
//   chain.final     a wins the second safety competition           scene
//   chain.noms      a and b are the nominees                        scene
//   chain.again     a is nominated, and the chain runs again (DR)   scene
//   chainfall.confront  a confronts b, who passed a over            scene
//   chainfall.civil     a and b, too polite after the chain         scene
//   chainfall.nominee   a, nominated by nobody                      scene
//   chainfall.counting  a won safety instead of being picked        scene
//   chainfall.first     a was the first name b called               scene
//   chainfall.byone     a was the last name called                  scene

export default {
  'chain.start.comp': [
    { id: 'cz.c1', turns: [{ by: 'a', say: "I'm safe. And now I get to pick." }] },
    { id: 'cz.c2', turns: [{ by: 'a', dr: "Winning was the easy part. Now I have to say a name in front of everyone." }] },
    { id: 'cz.c3', turns: [{ by: 'a', say: "Okay. Okay. No pressure." }] },
    { id: 'cz.c4', turns: [{ by: 'a', dr: "Everyone's looking at me like I'm holding their week in my hand. I am." }] },
    { id: 'cz.c5', turns: [{ by: 'a', say: "Don't all look at me at once." }] },
    { id: 'cz.c6', turns: [{ by: 'a', dr: "Whoever I pick first, everyone will know they're my number one." }] },
  ],
  'chain.start.hoh': [
    { id: 'cz.h1', turns: [{ by: 'a', say: "No nominations this week. I just get to save one person. Fine." }] },
    { id: 'cz.h2', turns: [{ by: 'a', dr: "I won HOH and I don't even get to nominate. I get to pick a friend in front of everyone." }] },
    { id: 'cz.h3', turns: [{ by: 'a', say: "I'll make this quick." }] },
    { id: 'cz.h4', turns: [{ by: 'a', dr: "One name. Everyone will remember it. No pressure at all." }] },
    { id: 'cz.h5', turns: [{ by: 'a', say: "Everybody breathe. I know who it is." }] },
    { id: 'cz.h6', turns: [{ by: 'a', dr: "Being HOH this week means starting the chain. Whatever I do, half the room is going to hate it." }] },
  ],
  'chain.start.again': [
    { id: 'cz.a1', turns: [{ by: 'a', dr: "I was the last name called a minute ago. Now I go first. I remember the order." }] },
    { id: 'cz.a2', turns: [{ by: 'a', say: "Round two. I know exactly who didn't pick me." }] },
    { id: 'cz.a3', turns: [{ by: 'a', dr: "Saved last, picking first. That's a lot of power for somebody nobody wanted." }] },
    { id: 'cz.a4', turns: [{ by: 'a', say: "Everyone ready? Because I am." }] },
    { id: 'cz.a5', turns: [{ by: 'a', dr: "I've just watched everyone pick their friends. Now it's my turn." }] },
    { id: 'cz.a6', turns: [{ by: 'a', say: "Here we go again." }] },
  ],
  'chain.link.showmance': [
    { id: 'cz.s1', turns: [{ by: 'a', say: "{b}. Obviously." }, { beat: 'Half the room groans.' }] },
    { id: 'cz.s2', turns: [{ by: 'a', say: "{b}." }, { by: 'b', say: "Took you long enough." }] },
    { id: 'cz.s3', turns: [{ by: 'a', say: "Like anyone thought it would be someone else. {b}." }] },
    { id: 'cz.s4', turns: [{ by: 'a', say: "{b}, come here." }, { beat: 'Nobody in the room is surprised.' }] },
    { id: 'cz.s5', turns: [{ by: 'a', say: "{b}." }, { beat: 'Somebody at the end of the row says "shocking" in a flat voice.' }] },
    { id: 'cz.s6', turns: [{ by: 'a', say: "I'm not even going to pretend. {b}." }] },
    { id: 'cz.s7', turns: [{ by: 'a', say: "{b}." }, { by: 'b', say: "Smooth." }] },
    { id: 'cz.s8', turns: [{ by: 'a', dr: "Everyone knows about me and {b}. No point hiding it now." }, { by: 'a', say: "{b}." }] },
  ],
  'chain.link.ally': [
    { id: 'cz.l1', turns: [{ by: 'a', say: "{b}." }, { beat: 'Nobody needed to guess.' }] },
    { id: 'cz.l2', turns: [{ by: 'a', say: "{b}. You know why." }] },
    { id: 'cz.l3', turns: [{ by: 'a', say: "{b}, you're safe." }, { by: 'b', say: "Thank you." }] },
    { id: 'cz.l4', turns: [{ by: 'a', say: "{b}." }, { by: 'a', dr: "Everyone now knows {b} and I are working together. Fine." }] },
    { id: 'cz.l5', turns: [{ by: 'a', say: "{b}. Easy." }] },
    { id: 'cz.l6', turns: [{ by: 'a', say: "I'm picking {b}." }, { beat: 'Half the room had already guessed.' }] },
    { id: 'cz.l7', turns: [{ by: 'a', say: "{b}. Always {b}." }] },
    { id: 'cz.l8', turns: [{ by: 'a', say: "{b}." }, { by: 'b', say: "Knew you would." }] },
    { id: 'cz.l9', turns: [{ by: 'a', say: "{b}. We've been together since day one." }] },
    { id: 'cz.l10', turns: [{ by: 'a', say: "{b}." }, { by: 'b', dr: "Not a surprise to anyone, least of all me." }] },
    { id: 'cz.l11', turns: [{ by: 'a', say: "I'm keeping my word. {b}." }] },
    { id: 'cz.l12', turns: [{ by: 'a', say: "{b}." }, { by: 'b', say: "Owe you one." }] },
  ],
  'chain.link.rival': [
    { id: 'cz.r1', turns: [{ by: 'a', say: "{b}." }, { beat: 'People actually turn round to look.' }] },
    { id: 'cz.r2', turns: [{ by: 'a', say: "{b}." }, { by: 'b', say: "Me? Why?" }, { by: 'a', say: "You'll find out." }] },
    { id: 'cz.r3', turns: [{ by: 'a', say: "{b}. Don't make it weird." }] },
    { id: 'cz.r4', turns: [{ by: 'a', dr: "{b} and I can't stand each other. That's exactly why nobody will expect this." }, { by: 'a', say: "{b}." }] },
    { id: 'cz.r5', turns: [{ by: 'a', say: "{b}." }, { by: 'b', dr: "{a} wants something for this. I just don't know what yet." }] },
    { id: 'cz.r6', turns: [{ by: 'a', say: "This one's going to surprise people. {b}." }] },
  ],
  'chain.link.cold': [
    { id: 'cz.o1', turns: [{ by: 'a', say: "{b}." }, { by: 'b', say: "...Me?" }] },
    { id: 'cz.o2', turns: [{ by: 'a', say: "{b}." }, { by: 'b', dr: "{a} and I have barely spoken all season. I've no idea what that was about." }] },
    { id: 'cz.o3', turns: [{ by: 'a', say: "{b}. Nothing personal. Either way." }] },
    { id: 'cz.o4', turns: [{ by: 'a', dr: "If I pick {b}, nobody can say I owed anyone anything." }, { by: 'a', say: "{b}." }] },
    { id: 'cz.o5', turns: [{ by: 'a', say: "{b}." }, { beat: '{b} looks more surprised than anyone.' }] },
    { id: 'cz.o6', turns: [{ by: 'a', say: "Let's go with {b}." }] },
    { id: 'cz.o7', turns: [{ by: 'a', say: "{b}." }, { by: 'b', say: "Oh! Thanks." }] },
    { id: 'cz.o8', turns: [{ by: 'a', say: "{b}. Don't read anything into it." }] },
  ],
  'chain.link.early': [
    { id: 'cz.e1', turns: [{ by: 'a', say: "{b}." }, { beat: '{a} does not even look round the room first.' }] },
    { id: 'cz.e2', turns: [{ by: 'a', say: "{b}. Easy." }] },
    { id: 'cz.e3', turns: [{ by: 'a', say: "{b}, you're safe." }] },
    { id: 'cz.e4', turns: [{ by: 'a', say: "{b}." }, { by: 'b', say: "Thank you!" }] },
    { id: 'cz.e5', turns: [{ by: 'a', say: "First one's easy. {b}." }] },
    { id: 'cz.e6', turns: [{ by: 'a', say: "{b}." }, { by: 'b', say: "Oh, thank goodness." }] },
    { id: 'cz.e7', turns: [{ by: 'a', say: "I'm going with {b}." }] },
    { id: 'cz.e8', turns: [{ by: 'a', say: "{b}. No question." }] },
    { id: 'cz.e9', turns: [{ by: 'a', say: "{b}. I don't even need to think about it." }] },
    { id: 'cz.e10', turns: [{ by: 'a', say: "{b}." }, { by: 'b', say: "Yes!" }] },
    { id: 'cz.e11', turns: [{ by: 'a', say: "Straight away: {b}." }] },
    { id: 'cz.e12', turns: [{ by: 'a', say: "{b}, get up here." }] },
  ],
  'chain.link.mid': [
    { id: 'cz.m1', turns: [{ beat: '{a} looks down the row twice.' }, { by: 'a', say: "{b}." }] },
    { id: 'cz.m2', turns: [{ by: 'a', say: "Hmm. {b}." }] },
    { id: 'cz.m3', turns: [{ by: 'a', say: "{b}." }, { beat: 'Somebody further along the row lets out a breath.' }] },
    { id: 'cz.m4', turns: [{ by: 'a', say: "This is harder than it looks. {b}." }] },
    { id: 'cz.m5', turns: [{ by: 'a', say: "{b}." }, { by: 'b', say: "Thanks. Really." }] },
    { id: 'cz.m6', turns: [{ beat: 'The room goes quiet while {a} thinks.' }, { by: 'a', say: "{b}." }] },
    { id: 'cz.m7', turns: [{ by: 'a', say: "Sorry, everyone else. {b}." }] },
    { id: 'cz.m8', turns: [{ by: 'a', say: "{b}." }, { by: 'a', dr: "There are people left I like. I picked {b} anyway." }] },
    { id: 'cz.m9', turns: [{ by: 'a', say: "Give me a second." }, { beat: 'Everyone gives {a} a second.' }, { by: 'a', say: "{b}." }] },
    { id: 'cz.m10', turns: [{ by: 'a', say: "{b}." }, { by: 'b', say: "Thank you. I mean it." }] },
    { id: 'cz.m11', turns: [{ by: 'a', say: "Okay. {b}." }] },
    { id: 'cz.m12', turns: [{ by: 'a', say: "{b}." }, { beat: '{b} lets out a long breath.' }] },
  ],
  'chain.link.late': [
    { id: 'cz.t1', turns: [{ by: 'a', say: "{b}." }, { beat: 'Everyone still sitting down has just learned where they came on the list.' }] },
    { id: 'cz.t2', turns: [{ by: 'a', say: "I'm sorry. {b}." }] },
    { id: 'cz.t3', turns: [{ by: 'a', say: "{b}." }, { by: 'b', say: "Oh, finally." }] },
    { id: 'cz.t4', turns: [{ by: 'a', dr: "Not many left to choose from. Every name I don't say is going to hurt." }, { by: 'a', say: "{b}." }] },
    { id: 'cz.t5', turns: [{ by: 'a', say: "{b}." }, { beat: 'The people left stare at the floor.' }] },
    { id: 'cz.t6', turns: [{ by: 'a', say: "This is horrible. {b}." }] },
    { id: 'cz.t7', turns: [{ by: 'a', say: "{b}." }, { by: 'b', say: "Thank you. I really thought that was it." }] },
    { id: 'cz.t8', turns: [{ by: 'a', say: "{b}. I'm sorry to the rest of you." }] },
    { id: 'cz.t9', turns: [{ by: 'a', say: "{b}." }, { by: 'b', say: "Oh, thank you. Thank you." }] },
    { id: 'cz.t10', turns: [{ by: 'a', say: "I hate this part. {b}." }] },
    { id: 'cz.t11', turns: [{ by: 'a', say: "{b}." }, { beat: 'Nobody left in the row looks up.' }] },
    { id: 'cz.t12', turns: [{ by: 'a', say: "It has to be {b}." }] },
  ],
  'chain.passed.scene': [
    { id: 'cz.p1', turns: [{ by: 'a', dr: "I was waiting for {b} to say my name. It never came." }] },
    { id: 'cz.p2', turns: [{ by: 'a', dr: "{b} had one name to give and it wasn't mine. I'll remember how long {b} took." }] },
    { id: 'cz.p3', turns: [{ by: 'a', dr: "I was counting on {b}. I'm not any more." }] },
    { id: 'cz.p4', turns: [{ beat: '{a} had half stood up. {a} sits back down.' }, { by: 'a', dr: "That was embarrassing." }] },
    { id: 'cz.p5', turns: [{ by: 'a', say: "Fair enough." }, { by: 'a', dr: "It's not fair enough." }] },
    { id: 'cz.p6', turns: [{ by: 'a', dr: "{b} and I were close before tonight. Now I know how close." }] },
    { id: 'cz.p7', turns: [{ beat: '{a} smiles at {b}. It takes a second too long.' }, { by: 'a', dr: "I'm fine. I'm totally fine." }] },
    { id: 'cz.p8', turns: [{ by: 'a', dr: "{b} could have ended my week right there. {b} didn't." }] },
  ],
  'chain.last.canada': [
    { id: 'cz.k1', turns: [{ by: 'a', dr: "I'm safe, and it stops with me. I can't save any of the last three. They'll have to play for it." }] },
    { id: 'cz.k2', turns: [{ by: 'a', say: "I'd pick if I could. Sorry." }] },
    { id: 'cz.k3', turns: [{ by: 'a', dr: "I'm the last link. {group} have to fight it out themselves." }] },
    { id: 'cz.k4', turns: [{ by: 'a', say: "That's it? I don't get to pick?" }] },
    { id: 'cz.k5', turns: [{ by: 'a', dr: "Last name called. One place lower and I'd be with them." }] },
    { id: 'cz.k6', turns: [{ by: 'a', say: "Good luck. Really." }] },
  ],
  'chain.last.quebec': [
    { id: 'cz.q1', turns: [{ by: 'a', dr: "Only {b} is left. The chain stops with me rather than save {b}." }] },
    { id: 'cz.q2', turns: [{ by: 'a', say: "Sorry, {b}. It stops here." }] },
    { id: 'cz.q3', turns: [{ by: 'a', dr: "I'm holding the last link and the only name left is {b}. I don't get to give it." }] },
    { id: 'cz.q4', turns: [{ beat: '{a} looks at {b}.' }, { by: 'a', say: "I'm sorry." }] },
    { id: 'cz.q5', turns: [{ by: 'a', dr: "Last name called. Now I have to watch {b} sit there alone." }] },
    { id: 'cz.q6', turns: [{ by: 'a', say: "That's the chain, then." }] },
  ],
  'chain.leftover.canada': [
    { id: 'cz.v1', turns: [{ by: 'a', dr: "Not one person in this house said my name. Same for {group}." }] },
    { id: 'cz.v2', turns: [{ by: 'a', say: "So that's what everyone thinks of us." }] },
    { id: 'cz.v3', turns: [{ by: 'a', dr: "Every single person had a name to give. Not one of them gave it to me." }] },
    { id: 'cz.v4', turns: [{ by: 'a', say: "Well. At least we've got each other." }] },
    { id: 'cz.v5', turns: [{ by: 'a', dr: "The whole house went past me, one at a time, in front of each other." }] },
    { id: 'cz.v6', turns: [{ by: 'a', say: "Fine. I'll win it myself." }] },
  ],
  'chain.leftover.quebec': [
    { id: 'cz.w1', turns: [{ by: 'a', dr: "I'm the only person in this house nobody chose. Nobody." }] },
    { id: 'cz.w2', turns: [{ by: 'a', say: "Every single one of you." }] },
    { id: 'cz.w3', turns: [{ by: 'a', dr: "The whole room went all the way round and never got to me." }] },
    { id: 'cz.w4', turns: [{ by: 'a', say: "Great. Love that." }] },
    { id: 'cz.w5', turns: [{ by: 'a', dr: "No competition to win, nobody to share it with. Just me." }] },
    { id: 'cz.w6', turns: [{ by: 'a', dr: "Not one name in that chain was mine. I'll remember every one of them." }] },
  ],
  'chain.final.scene': [
    { id: 'cz.f1', turns: [{ by: 'a', say: "Yes! I'm safe!" }] },
    { id: 'cz.f2', turns: [{ by: 'a', dr: "Nobody picked me, so I picked myself." }] },
    { id: 'cz.f3', turns: [{ by: 'a', say: "Didn't need any of you after all." }] },
    { id: 'cz.f4', turns: [{ by: 'a', dr: "Everyone else got chosen. I had to win it. I'll remember that." }] },
    { id: 'cz.f5', turns: [{ by: 'a', say: "Oh, thank goodness." }] },
    { id: 'cz.f6', turns: [{ by: 'a', dr: "Safe. And I know exactly who didn't want me to be." }] },
  ],
  'chain.noms.scene': [
    { id: 'cz.n1', turns: [{ by: 'a', dr: "No HOH put me here. Everyone did, one at a time." }] },
    { id: 'cz.n2', turns: [{ by: 'a', say: "So it's me and {b}." }, { by: 'b', say: "Looks like it." }] },
    { id: 'cz.n3', turns: [{ by: 'a', dr: "There's nobody to blame. That's the worst part." }] },
    { id: 'cz.n4', turns: [{ by: 'b', dr: "{a} and I are on the block, and the whole house put us there." }] },
    { id: 'cz.n5', turns: [{ by: 'a', say: "No keys, no ceremony, and we're still nominated." }] },
    { id: 'cz.n6', turns: [{ by: 'a', dr: "I've got a week to talk round the people who just walked past me." }] },
  ],
  'chain.again.scene': [
    { id: 'cz.g1', turns: [{ by: 'a', dr: "I'm on the block. And now they get to do it all again for the other seat." }] },
    { id: 'cz.g2', turns: [{ by: 'a', dr: "I get to sit here and watch the whole thing again. Brilliant." }] },
    { id: 'cz.g3', turns: [{ by: 'a', dr: "Whoever's left this time has to face me. I hope it's someone I can beat." }] },
    { id: 'cz.g4', turns: [{ by: 'a', dr: "Round two. At least this time it's not about me." }] },
    { id: 'cz.g5', turns: [{ by: 'a', dr: "Nominated by nobody. Now let's see who joins me." }] },
    { id: 'cz.g6', turns: [{ by: 'a', dr: "I'll be watching every name this time. Every single one." }] },
  ],
  'chainfall.confront.scene': [
    { id: 'cw7.c1', turns: [{ by: 'a', say: "You had one name." }, { by: 'b', say: "It's about numbers—" }, { by: 'a', say: "Don't." }] },
    { id: 'cw7.c2', turns: [{ by: 'a', say: "I would have picked you." }, { beat: '{a} goes to bed.' }] },
    { id: 'cw7.c3', turns: [{ by: 'b', say: "Can I explain?" }, { by: 'a', say: "You already did. In front of everyone." }] },
    { id: 'cw7.c4', turns: [{ by: 'a', dr: "{b} has tried to explain the chain to me twice. The second time was worse." }] },
    { id: 'cw7.c5', turns: [{ by: 'a', say: "Now I know exactly where I am on your list." }, { by: 'b', say: "It's not like that." }, { by: 'a', say: "It's exactly like that." }] },
    { id: 'cw7.c6', turns: [{ by: 'b', dr: "{a} hasn't spoken to me since the chain. Everyone's noticed." }] },
  ],
  'chainfall.civil.scene': [
    { id: 'cw7.v1', turns: [{ by: 'a', say: "Pass the salt, please." }, { by: 'b', say: "Of course." }, { beat: 'They are very, very polite.' }] },
    { id: 'cw7.v2', turns: [{ by: 'a', dr: "{b} and I are being nice to each other. We're never nice to anyone." }] },
    { id: 'cw7.v3', turns: [{ by: 'b', say: "How are you?" }, { by: 'a', say: "Fine, thank you. You?" }, { by: 'b', say: "Fine." }] },
    { id: 'cw7.v4', turns: [{ by: 'b', dr: "{a} is being so polite to me. It's terrifying." }] },
    { id: 'cw7.v5', turns: [{ by: 'a', say: "No hard feelings about earlier." }, { by: 'b', say: "None at all." }, { by: 'a', dr: "Some hard feelings." }] },
    { id: 'cw7.v6', turns: [{ by: 'a', dr: "I'm smiling at {b} all evening. It's the only way I can stand being in the room." }] },
  ],
  'chainfall.nominee.scene': [
    { id: 'cw7.n1', turns: [{ by: 'a', dr: "Every person in this house had a name to give, and none of them said mine. There's no HOH to blame. It was all of them." }] },
    { id: 'cw7.n2', turns: [{ by: 'a', dr: "Who do I talk round? Everyone already said their names out loud." }] },
    { id: 'cw7.n3', turns: [{ by: 'a', say: "It wasn't personal, apparently." }, { by: 'a', dr: "What would count as personal, then?" }] },
    { id: 'cw7.n4', turns: [{ by: 'a', dr: "I can't name who put me on the block. It was everyone, one at a time." }] },
    { id: 'cw7.n5', turns: [{ by: 'a', dr: "I'm being extremely pleasant to everyone tonight. That's what I do instead of screaming." }] },
    { id: 'cw7.n6', turns: [{ by: 'a', say: "Every one of you." }, { beat: 'Nobody argues.' }] },
  ],
  'chainfall.counting.scene': [
    { id: 'cw7.u1', turns: [{ by: 'a', dr: "I'm safe, but I had to win it. Everyone else just got picked." }] },
    { id: 'cw7.u2', turns: [{ by: 'a', dr: "Nobody chose me. I know exactly what that means for next week." }] },
    { id: 'cw7.u3', turns: [{ by: 'a', say: "Safe. No thanks to any of you." }] },
    { id: 'cw7.u4', turns: [{ by: 'a', dr: "I won my way out. I'm still thinking about everyone who walked past me." }] },
    { id: 'cw7.u5', turns: [{ by: 'a', dr: "I'm safe this week. That's one week. Then what?" }] },
    { id: 'cw7.u6', turns: [{ by: 'a', dr: "Every name in that chain wasn't mine. I've got a list now." }] },
  ],
  'chainfall.first.scene': [
    { id: 'cw7.f1', turns: [{ by: 'a', dr: "{b} picked me first. Everyone keeps bringing it up. It's made me a target." }] },
    { id: 'cw7.f2', turns: [{ by: 'a', say: "Thanks for picking me first." }, { by: 'b', say: "Of course." }, { by: 'a', dr: "Now everyone thinks we're a pair." }] },
    { id: 'cw7.f3', turns: [{ by: 'a', dr: "First name called. It was kind. It also painted a target on my back." }] },
    { id: 'cw7.f4', turns: [{ by: 'b', dr: "I picked {a} first. Everyone now knows who my number one is." }] },
    { id: 'cw7.f5', turns: [{ by: 'a', say: "Everyone keeps calling me {b}'s favourite." }, { by: 'b', say: "Well, you are." }] },
    { id: 'cw7.f6', turns: [{ by: 'a', dr: "Being picked first feels great for about a minute." }] },
  ],
  'chainfall.byone.scene': [
    { id: 'cw7.b1', turns: [{ by: 'a', dr: "Last name called. One place lower and I'd have been sitting with them." }] },
    { id: 'cw7.b2', turns: [{ by: 'a', dr: "I'm safe by one name. I know exactly how close that was." }] },
    { id: 'cw7.b3', turns: [{ by: 'a', dr: "Picked last. That tells me everything about where I stand." }] },
    { id: 'cw7.b4', turns: [{ by: 'a', say: "I'm safe. Just." }] },
    { id: 'cw7.b5', turns: [{ by: 'a', dr: "Everyone picked their friends first. I was the leftover friend." }] },
    { id: 'cw7.b6', turns: [{ by: 'a', dr: "I was nearly one of them. I'm not going to forget that." }] },
  ],
};

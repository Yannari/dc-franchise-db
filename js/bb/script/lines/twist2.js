// ══════════════════════════════════════════════════════════════════════
// bb/script/lines/twist2.js — Cliques, Camp Director, Premiere Mystery (Phase 6)
// ══════════════════════════════════════════════════════════════════════
//
// The words for bb-events/cliques.js, camp-director.js and premiere-mystery.js
// (which also holds the secret power comp's anomaly).
//
//   clique.covered     a is safe because b, the HOH, is in a's clique        cold | warm
//   clique.heading     a, outside {clique}, reacts to b's clique being safe  patient | loud
//   clique.alone       the cliques are gone; b was a's clique-mate            kept | alone
//   director.needled   b asks a, the Camp Director, about the four names     smooth | flustered
//   director.survivor  a survived the Camp Director b's list                 settled | grudge (b is told; {target} is the director)
//   director.chair     a remembers {gone}, sent home off b's list            scene
//   premiere.rich      a watches b, who won the money on night one           circles | priced
//   premiere.four      a picked the four on night one; b asks about it       owns | ages
//   secret.anomaly     a asks how b's top score lost                          covers | cracks

export default {
  'clique.covered.cold': [
    { id: 'tq.c1', turns: [{ by: 'a', dr: "I'm safe this week because {b} is HOH. I didn't ask for that. I don't want to owe {b} anything." }] },
    { id: 'tq.c2', turns: [{ by: 'a', say: "I didn't ask you to protect me." }, { by: 'b', say: "You're welcome." }, { by: 'a', say: "That's not what I said." }] },
    { id: 'tq.c3', turns: [{ by: 'a', dr: "{b} is protecting me this week. If I had the power, I'd put {b} up. That's how much I hate this." }] },
    { id: 'tq.c4', turns: [{ by: 'a', say: "We're not a group! We just got put together!" }, { beat: 'Nobody had asked.' }] },
    { id: 'tq.c5', turns: [{ by: 'b', dr: "{a} is safe because of me and won't even look at me. Fine." }] },
    { id: 'tq.c6', turns: [{ by: 'a', dr: "Everyone thinks {b} and I are on the same side because of the twist. We're not." }] },
    { id: 'tq.c7', turns: [{ by: 'a', say: "Don't thank me for being safe. I didn't do anything." }, { by: 'b', say: "I wasn't going to thank you." }] },
    { id: 'tq.c8', turns: [{ by: 'a', dr: "Being safe because of {b} feels worse than being nominated." }] },
    { id: 'tq.c9', turns: [{ by: 'b', say: "You're welcome, by the way." }, { by: 'a', say: "For what? A twist?" }] },
    { id: 'tq.c10', turns: [{ by: 'a', dr: "Everyone thinks I owe {b} now. I don't. I didn't sign up for this group." }] },
  ],
  'clique.covered.warm': [
    { id: 'tq.w1', turns: [{ beat: '{a} makes {b} breakfast without being asked.' }, { by: 'a', say: "Thanks for the free week." }, { by: 'b', say: "Any time." }] },
    { id: 'tq.w2', turns: [{ by: 'a', dr: "I did nothing this week and I'm safe. I'm not going to pretend I'm upset about it." }] },
    { id: 'tq.w3', turns: [{ by: 'a', say: "Not one of us earned this." }, { by: 'b', say: "Shh. People can hear you." }] },
    { id: 'tq.w4', turns: [{ by: 'a', dr: "{b} won HOH and the whole group is safe. I'll take it." }] },
    { id: 'tq.w5', turns: [{ by: 'b', say: "Enjoying the week off?" }, { by: 'a', say: "Very much." }] },
    { id: 'tq.w6', turns: [{ by: 'a', dr: "Free weeks don't come often in here. I'm going to enjoy this one." }] },
    { id: 'tq.w7', turns: [{ by: 'a', say: "Another week off." }, { by: 'b', say: "Don't say it so loudly." }] },
    { id: 'tq.w8', turns: [{ by: 'a', dr: "My group is in charge again. I'm going to keep my head down and enjoy it." }] },
    { id: 'tq.w9', turns: [{ by: 'b', dr: "{a} is safe because of me this week. I hope {a} remembers that later." }] },
    { id: 'tq.w10', turns: [{ by: 'a', say: "Need anything this week? You've earned it." }, { by: 'b', say: "Just your vote, if it comes to it." }] },
  ],
  'clique.heading.patient': [
    { id: 'tq.p1', turns: [{ by: 'a', dr: "The block isn't decided by {b}. It's decided by which group is in charge. So I'll work out when it's my group's turn." }] },
    { id: 'tq.p2', turns: [{ by: 'a', dr: "I've stopped being annoyed about {clique}. Now I'm working out how to beat it." }] },
    { id: 'tq.p3', turns: [{ by: 'a', dr: "I've written down which weeks I can survive and which I can't. Finally, a plan." }] },
    { id: 'tq.p4', turns: [{ by: 'a', dr: "Every week, a different group is safe. I just need to be ready when it's ours." }] },
    { id: 'tq.p5', turns: [{ by: 'b', dr: "{a} has gone very quiet about the twist. That worries me more than shouting would." }] },
    { id: 'tq.p6', turns: [{ by: 'a', dr: "Getting angry at {b} won't help. Counting the weeks will." }] },
    { id: 'tq.p7', turns: [{ by: 'a', dr: "{clique} are safe again. Fine. I know which week is coming for them." }] },
    { id: 'tq.p8', turns: [{ by: 'a', dr: "I'm not wasting energy being angry about the groups. I'm saving it for when it counts." }] },
    { id: 'tq.p9', turns: [{ by: 'a', dr: "The twist will turn. When it does, I'll be ready." }] },
    { id: 'tq.p10', turns: [{ by: 'a', dr: "I've worked out the pattern. Now I just need to survive until my week." }] },
  ],
  'clique.heading.loud': [
    { id: 'tq.l1', turns: [{ by: 'a', say: "Half of them are safe, and only one of them won anything. How is that a game?" }, { beat: 'Nobody answers.' }] },
    { id: 'tq.l2', turns: [{ by: 'a', say: "{clique} again. Of course it's {clique}." }] },
    { id: 'tq.l3', turns: [{ by: 'a', dr: "It's not personal. It's the twist. I keep ending up on the wrong side of it and I'm sick of it." }] },
    { id: 'tq.l4', turns: [{ by: 'a', say: "Must be nice, being safe without winning anything." }, { by: 'b', say: "It is, actually." }] },
    { id: 'tq.l5', turns: [{ by: 'b', dr: "{a} says '{clique}' like it's a swear word. Now half the house does." }] },
    { id: 'tq.l6', turns: [{ by: 'a', dr: "My group never seems to get the week off. Funny, that." }] },
    { id: 'tq.l7', turns: [{ by: 'a', say: "Same people safe again." }, { by: 'b', say: "Luck of the draw." }, { by: 'a', say: "It's not luck. It's a twist." }] },
    { id: 'tq.l8', turns: [{ by: 'a', dr: "{clique} get a free week every time {b} wins. I'm tired of it." }] },
    { id: 'tq.l9', turns: [{ by: 'a', say: "Enjoy your free week, {b}." }, { by: 'b', say: "I will." }] },
    { id: 'tq.l10', turns: [{ by: 'a', dr: "Being in the wrong group in this house is like being nominated every week." }] },
  ],
  'clique.alone.kept': [
    { id: 'tq.k1', turns: [{ beat: '{a} and {b} sit together at breakfast out of habit.' }, { by: 'a', dr: "Nobody makes us do this any more. We just do." }] },
    { id: 'tq.k2', turns: [{ by: 'a', dr: "The groups are gone. I went looking for {b} anyway. That's new." }] },
    { id: 'tq.k3', turns: [{ by: 'b', say: "We were only ever put together." }, { by: 'a', say: "Yeah." }, { beat: '{a} does not move.' }] },
    { id: 'tq.k4', turns: [{ by: 'a', say: "So, are we still a team?" }, { by: 'b', say: "If we want to be." }, { by: 'a', say: "I want to be." }] },
    { id: 'tq.k5', turns: [{ by: 'b', dr: "The twist is over and {a} still sits with me. I didn't expect that." }] },
    { id: 'tq.k6', turns: [{ by: 'a', dr: "{b} and I didn't choose each other at the start. Now we have." }] },
  ],
  'clique.alone.alone': [
    { id: 'tq.a1', turns: [{ by: 'a', dr: "I've been safe so often, I forgot I could be nominated. Now I can. And I've got nobody to go to." }] },
    { id: 'tq.a2', turns: [{ by: 'a', dr: "I went looking for the people who covered me all season. We were never friends. Just in the same group." }] },
    { id: 'tq.a3', turns: [{ by: 'a', dr: "Nobody's coming after me yet. Nobody's coming to help me either." }] },
    { id: 'tq.a4', turns: [{ by: 'a', dr: "Without the groups, I've got no one. I should have made friends when I had the chance." }] },
    { id: 'tq.a5', turns: [{ by: 'a', dr: "The twist kept me safe. Now it's gone, and so is my safety." }] },
    { id: 'tq.a6', turns: [{ by: 'a', dr: "I need allies. Fast." }] },
  ],
  'director.needled.smooth': [
    { id: 'tq.n1', turns: [{ by: 'b', say: "So, those four names you picked." }, { by: 'a', say: "Somebody had to write a list. Would you rather it had been yours?" }, { beat: 'The table laughs.' }] },
    { id: 'tq.n2', turns: [{ by: 'a', say: "The job made me do it. You all voted me into the job." }, { by: 'b', dr: "{a} has a very good answer ready. Too good." }] },
    { id: 'tq.n3', turns: [{ by: 'b', dr: "I poked {a} about the list. {a} handled it perfectly. That worries me." }] },
    { id: 'tq.n4', turns: [{ by: 'a', dr: "I've been asked about the list ten times. I've got the answer down now." }] },
    { id: 'tq.n5', turns: [{ by: 'b', say: "No hard feelings about the list?" }, { by: 'a', say: "None on my side." }] },
    { id: 'tq.n6', turns: [{ by: 'a', dr: "Somebody had to pick. I picked. I'm not going to apologise for doing the job." }] },
  ],
  'director.needled.flustered': [
    { id: 'tq.f1', turns: [{ by: 'b', say: "Why those four?" }, { by: 'a', say: "Well, there were reasons. Lots of reasons. Different reasons." }, { by: 'b', dr: "By the third reason, nobody believed any of them." }] },
    { id: 'tq.f2', turns: [{ by: 'a', say: "I didn't ask for the job!" }, { by: 'b', say: "Nobody said you did." }, { by: 'a', dr: "That came out wrong." }] },
    { id: 'tq.f3', turns: [{ by: 'a', say: "It was basically random." }, { by: 'b', say: "I was standing right there. It wasn't." }] },
    { id: 'tq.f4', turns: [{ by: 'b', dr: "{a} can't explain that list. That tells me it was personal." }] },
    { id: 'tq.f5', turns: [{ by: 'a', dr: "Every time someone mentions the list, I make it worse." }] },
    { id: 'tq.f6', turns: [{ by: 'b', say: "You picked them, though." }, { by: 'a', say: "...I picked them." }] },
  ],
  'director.survivor.settled': [
    { id: 'tq.s1', turns: [{ by: 'a', say: "You did what the job made you do. I ran fast enough. We're fine." }, { by: 'b', say: "Really?" }, { by: 'a', say: "Really." }] },
    { id: 'tq.s2', turns: [{ beat: '{a} sits next to {b} at breakfast, where everyone can see.' }, { by: 'a', dr: "That's settled. Everyone should know it." }] },
    { id: 'tq.s3', turns: [{ by: 'a', say: "If I'd won that vote, I'd have named four people too." }, { by: 'b', dr: "I could have hugged {a}." }] },
    { id: 'tq.s4', turns: [{ by: 'b', dr: "{a} told me we're fine. I breathed properly for the first time all day." }] },
    { id: 'tq.s5', turns: [{ by: 'a', say: "No grudges." }, { by: 'b', say: "Thank you." }] },
    { id: 'tq.s6', turns: [{ by: 'a', dr: "{b} put me on that list. I survived. Holding a grudge won't help either of us." }] },
  ],
  'director.survivor.grudge': [
    { id: 'tq.g1', when: { intent: 'told' }, turns: [{ by: 'a', say: "{target} doesn't get to put me on that list and then get my vote. Ever." }, { by: 'b', say: "Noted." }] },
    { id: 'tq.g2', turns: [{ by: 'a', dr: "I'm being perfectly nice to {target}. I haven't forgiven anything." }] },
    { id: 'tq.g3', when: { intent: 'told' }, turns: [{ by: 'a', say: "I'm going to get {target} back for that list." }, { by: 'b', say: "When?" }, { by: 'a', say: "When it's cheap." }] },
    { id: 'tq.g4', turns: [{ by: 'a', dr: "I'm keeping that list in my back pocket. One day it'll be useful." }] },
    { id: 'tq.g5', when: { intent: 'told' }, turns: [{ by: 'b', dr: "{a} told me, just once, that {target} is a target. Once is how you tell someone a plan." }] },
    { id: 'tq.g6', turns: [{ by: 'a', dr: "I've told one person how I really feel about {target}. That's enough for now." }] },
  ],
  'director.chair.scene': [
    { id: 'tq.h1', turns: [{ beat: 'Someone sets one place too many at dinner.' }, { by: 'a', say: "That was {gone}'s seat." }, { beat: 'Nobody looks at {b}.' }] },
    { id: 'tq.h2', turns: [{ by: 'a', say: "To {gone}, who never even got a full week." }, { beat: '{b} raises a glass too. Refusing would be worse.' }] },
    { id: 'tq.h3', turns: [{ by: 'a', dr: "{gone} went home before the game had properly started. Everyone knows whose list it was." }] },
    { id: 'tq.h4', turns: [{ by: 'b', dr: "Every time someone mentions {gone}, people look at me." }] },
    { id: 'tq.h5', turns: [{ by: 'a', say: "I miss {gone}." }, { beat: 'The table goes quiet.' }] },
    { id: 'tq.h6', turns: [{ by: 'a', dr: "We tell funny stories about {gone}. Then the laughing stops, and everyone looks at {b}." }] },
  ],
  'premiere.rich.circles': [
    { id: 'tq.r1', turns: [{ by: 'a', dr: "{b} won ten thousand on night one and has slept like a baby ever since. People with targets don't sleep like that." }] },
    { id: 'tq.r2', turns: [{ by: 'a', say: "Ten grand should make a person nervous." }, { beat: '{b} hums while washing up.' }, { by: 'a', dr: "It doesn't add up." }] },
    { id: 'tq.r3', turns: [{ by: 'a', dr: "When people win money in here, they get more careful. {b} got less careful. Why?" }] },
    { id: 'tq.r4', turns: [{ by: 'a', dr: "I'm not watching the money. I'm watching how calm {b} is about it." }] },
    { id: 'tq.r5', turns: [{ by: 'a', say: "Aren't you worried that money makes you a target?" }, { by: 'b', say: "Not really." }, { by: 'a', dr: "{b} isn't worried about being a target with all that money. That's either very brave or very naive." }] },
    { id: 'tq.r6', turns: [{ by: 'a', dr: "Something about {b}'s mood doesn't make sense. I'm going to work it out." }] },
  ],
  'premiere.rich.priced': [
    { id: 'tq.q1', turns: [{ by: 'a', say: "That's a tenth of what {b} made on night one." }, { beat: 'Everyone laughs. Nobody is entirely joking.' }] },
    { id: 'tq.q2', turns: [{ by: 'a', say: "Can you afford the tea, {b}?" }, { beat: 'The kitchen laughs. {b} laughs loudest.' }] },
    { id: 'tq.q3', turns: [{ by: 'a', dr: "The first vote count anyone has done this season has {b}'s name at the top. Because of the money." }] },
    { id: 'tq.q4', turns: [{ by: 'b', dr: "Everyone keeps joking about my money. Every joke is a little bit serious." }] },
    { id: 'tq.q5', turns: [{ by: 'a', say: "Rich people buy the snacks." }, { by: 'b', say: "Very funny." }] },
    { id: 'tq.q6', turns: [{ by: 'a', dr: "{b} has a big target, and it's the size of a cheque." }] },
  ],
  'premiere.four.owns': [
    { id: 'tq.o1', turns: [{ by: 'b', say: "Enjoying being kingmaker?" }, { by: 'a', say: "Somebody had to hold that relic. Be glad it was somebody who likes you." }] },
    { id: 'tq.o2', turns: [{ by: 'a', say: "You'd have picked your four too." }, { by: 'b', say: "...Fair." }] },
    { id: 'tq.o3', turns: [{ by: 'b', dr: "{a} jokes about the four names all week. {a} has never once said they were random." }] },
    { id: 'tq.o4', turns: [{ by: 'a', dr: "I picked four people on night one. I'm not going to pretend I didn't." }] },
    { id: 'tq.o5', turns: [{ by: 'b', say: "Why those four?" }, { by: 'a', say: "Because I trusted them." }, { by: 'b', dr: "So now we know who {a} trusts." }] },
    { id: 'tq.o6', turns: [{ by: 'a', dr: "Owning a decision is better than explaining it." }] },
  ],
  'premiere.four.ages': [
    { id: 'tq.e1', turns: [{ by: 'a', dr: "I'm still explaining those four names. Nobody even asked me to." }] },
    { id: 'tq.e2', turns: [{ by: 'b', say: "What did it feel like, choosing who got to play for power?" }, { by: 'a', say: "Well, it's complicated..." }, { by: 'b', dr: "Ninety seconds later, it was still complicated." }] },
    { id: 'tq.e3', turns: [{ by: 'a', say: "It was practically alphabetical." }, { by: 'b', say: "We checked. It wasn't." }] },
    { id: 'tq.e4', turns: [{ by: 'b', dr: "Every time {a} explains the four names, the story changes." }] },
    { id: 'tq.e5', turns: [{ by: 'a', dr: "Picking those four names on night one keeps coming back to bite me." }] },
    { id: 'tq.e6', turns: [{ by: 'b', say: "Still on about the four names?" }, { by: 'a', say: "I'm not on about it!" }, { by: 'b', say: "You brought it up." }] },
  ],
  'secret.anomaly.covers': [
    { id: 'tq.v1', turns: [{ by: 'a', say: "Best score of the afternoon and you're not HOH?" }, { by: 'b', say: "Choked on the last bit, didn't I." }, { by: 'a', dr: "Good shrug. The maths still doesn't work." }] },
    { id: 'tq.v2', turns: [{ by: 'a', dr: "Top score, no crown. {b} laughs about the 'collapse'. The laugh comes half a second too fast." }] },
    { id: 'tq.v3', turns: [{ by: 'a', say: "Fastest in the house and somehow not HOH." }, { by: 'b', say: "Thanks!" }, { by: 'a', dr: "That wasn't a compliment." }] },
    { id: 'tq.v4', turns: [{ by: 'a', dr: "Something happened in that competition that I didn't see. {b} knows what." }] },
    { id: 'tq.v5', turns: [{ by: 'b', dr: "{a} keeps bringing up the scoreboard. I keep laughing. That's all I can do." }] },
    { id: 'tq.v6', turns: [{ by: 'a', dr: "{b} posted the best score and walked away with nothing. Nobody does that by accident." }] },
  ],
  'secret.anomaly.cracks': [
    { id: 'tq.x1', turns: [{ by: 'a', say: "How does the best score of the day lose?" }, { by: 'b', say: "Pressure, I suppose." }, { by: 'a', dr: "{b} didn't look pressured." }] },
    { id: 'tq.x2', turns: [{ by: 'a', dr: "I asked {b} about the comp. By the evening, I'd heard three different explanations." }] },
    { id: 'tq.x3', turns: [{ by: 'b', dr: "Every time someone mentions the comp, I change the subject. It's not working." }] },
    { id: 'tq.x4', turns: [{ by: 'a', say: "Talk me through the comp." }, { by: 'b', say: "Can we not?" }, { by: 'a', say: "Why not?" }] },
    { id: 'tq.x5', turns: [{ by: 'a', dr: "I don't know what I'm looking at with {b}. I know I'm looking at something." }] },
    { id: 'tq.x6', turns: [{ by: 'b', dr: "I can't explain what happened in that comp. Not without giving it away." }] },
  ],
};

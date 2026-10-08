// ══════════════════════════════════════════════════════════════════════
// td/story/lines/rewrite2.js — the short moments, rewritten (batch 2)
// ══════════════════════════════════════════════════════════════════════
//
// Same contract as rewrite1.js. Meanings from the td/script/lines headers:
//   friend.struggle.<empty|rivals|plain>  {a} and {b} get through something hard together
//   friend.lift.any / friend.rally.any    {a} lifts the camp / pulls it back together after a bad day
//   friend.solidarity.any  {a} has {b}'s back without saying so
//   friend.mentor.<spiral|rough>  {a} steadies {b}     friend.teach.<physical|strategic|mental>  {a} teaches {b}
//   throw.caught.bold  {a} tells {b}, to {b}'s face, that {b} threw the challenge
//   throw.caught.quiet {a}, alone, is sure {target} threw the challenge
//   credit.steal.any   {a} takes credit for {b}'s move at the last vote
//   credit.callout.any {a} calls {b} out for it
//   trade.info.<idol|plans|general>  {a} trades {b} information for trust ({holder}: who has the idol;
//                      {group}: {a}'s alliance)
//   deal.double.confront  {a} finds out {b} promised the same final two to someone else
//   deal.broken.confront  {b} wrote {a}'s name despite their final {size}; {a} says it
//   drama.explode.*    {a} unloads on {b}       drama.meltdown.*  {a} falls apart in front of camp
//   drama.intimidate.* {a} unnerves {b}         drama.prank.<well|badly>  {a} pranks {b}
//   romance.night.never  never-have-I-ever after dark    romance.affair.form  {a} (with {target}) and {b} start something
//   blame.loss.any     {a} blames {b} for the last challenge
//   goat.kept.*        {a} is being kept as the easy seat at the end, and doesn't see it ({b} does)
//   talk.checkin.any   {a} and {b}, allies, check they're still good
//   fallout.found.one  {a} found out {b} wrote {a}'s own name
//   hosted.raid.fun    after lights-out at the cabins, a night run (Wawanakwa only)

const C = (id, lines, when, place = 'confessional') => ({ id, place, ...(when ? { when } : {}), turns: lines.map(t => ({ by: 'a', conf: t })) });

export default {
  'long.friend.struggle.any': [
    { id: 'r2.s1', place: 'work', turns: [
      { beat: "{a} and {b} are the last two still going {here}. Everyone else gave up an hour ago." },
      { by: 'b', say: "I can't feel my arms." },
      { by: 'a', say: "Me neither. Keep going." },
      { by: 'b', say: "Why are we still doing this?" },
      { by: 'a', say: "Because if we stop, they win." },
      { by: 'b', say: "Who's they?" },
      { by: 'a', say: "I don't know. Everyone. Keep going." },
      { by: 'b', conf: "Today was miserable. I'd do it again, though. As long as it's with {a}." },
    ] },
    { id: 'r2.s2', place: 'aside', when: { band: ['cold', 'enemies'] }, turns: [
      { by: 'a', say: "Don't talk to me." },
      { by: 'b', say: "Wasn't going to." },
      { beat: "They sit {here} in silence for a long time. Neither of them leaves." },
      { by: 'b', say: "...That was a terrible day." },
      { by: 'a', say: "Yeah. It really was." },
      { by: 'a', conf: "I can't stand {b}. But today {b} was the only other person who understood how bad it was." },
    ] },
  ],
  'long.friend.lift.any': [
    { id: 'r2.l1', place: 'public', turns: [
      { beat: "The mood {here} is terrible. {a} decides that's not acceptable." },
      { by: 'a', say: "Okay, everybody up. We're doing something fun." },
      { by: 'b', say: "There is nothing fun here." },
      { by: 'a', say: "Then we'll make something fun. Contest. Best impression of {host}. Go." },
      { by: 'c', say: "...Fine. But I'm going first." },
      { beat: "Ten minutes later, the whole camp is laughing." },
      { by: 'b', conf: "I don't know how {a} does it. One minute we're all miserable, then {a} opens {a.posAdj} mouth and everyone's okay again." },
    ] },
  ],
  'long.friend.rally.any': [
    { id: 'r2.y1', place: 'fire', turns: [
      { by: 'a', say: "Can I say something? Everybody's walking around like we've already lost." },
      { by: 'b', say: "We kind of have been losing." },
      { by: 'a', say: "One bad day. We've all had worse. I've seen every person here do something amazing." },
      { by: 'c', say: "Even me?" },
      { by: 'a', say: "Even you. Yesterday. Don't make me list it." },
      { by: 'b', say: "...Okay. Fine. One bad day." },
      { by: 'c', conf: "That speech was cheesy. It also worked. I hate when cheesy works." },
    ] },
  ],
  'long.friend.solidarity.any': [
    { id: 'r2.o1', place: 'public', turns: [
      { beat: "Somebody makes a crack about {b} {here}. {a} doesn't laugh." },
      { by: 'a', say: "That's not funny." },
      { by: 'c', say: "It's a little funny." },
      { by: 'a', say: "No. It's not." },
      { beat: "The conversation moves on. {b} catches {a}'s eye and nods." },
      { by: 'b', conf: "{a} didn't make a big speech. {a} just didn't laugh. Out here, that's loyalty." },
    ] },
  ],
  'long.friend.mentor.any': [
    { id: 'r2.m1', place: 'aside', turns: [
      { by: 'b', say: "I'm going home. I know I'm going home." },
      { by: 'a', say: "Hey. Breathe. Look at me." },
      { by: 'b', say: "I can't—" },
      { by: 'a', say: "You can. In. Out. Again." },
      { by: 'a', say: "Okay. Now tell me who you've actually talked to today. Not who you're scared of. Who you've talked to." },
      { by: 'b', say: "...Like four people." },
      { by: 'a', say: "Four people is a lot more than nobody. Go talk to two more before dinner." },
      { by: 'b', conf: "{a} talked me down. I was ready to give up. Now I've got a plan. A small one. But a plan." },
    ] },
  ],
  'long.friend.teach.any': [
    { id: 'r2.t1', place: 'work', turns: [
      { by: 'a', say: "No, no. You're doing it the hard way. Watch." },
      { beat: "{a} shows {b} {here}. It takes twice as long as it should, because {b} keeps laughing." },
      { by: 'b', say: "Okay. Okay. Like that?" },
      { by: 'a', say: "Like that. See? Easy." },
      { by: 'b', say: "That was not easy." },
      { by: 'a', say: "It'll be easy next time." },
      { by: 'b', conf: "{a} didn't have to help me. Nobody else would have. I'm keeping track of that." },
    ] },
  ],
  'long.throw.caught.bold': [
    { id: 'r2.w1', place: 'aside', turns: [
      { by: 'a', say: "You threw it." },
      { by: 'b', say: "Excuse me?" },
      { by: 'a', say: "Today. You threw it. I watched you slow down at the end." },
      { by: 'b', say: "I was tired." },
      { by: 'a', say: "You were fine until you weren't. Right when it mattered." },
      { by: 'b', say: "That's a big accusation." },
      { by: 'a', say: "It's a big thing to do to your own team." },
      { by: 'b', conf: "{a} saw it. I have to deal with that before {a} tells everyone." },
      { by: 'a', conf: "I don't care why {b} did it. I care that {b} did it. And I'm not the only one who's going to know." },
    ] },
  ],
  'long.throw.caught.quiet': [
    C('r2.w2', ["Everyone thinks {target} just had a bad day. I don't.", "I watched the whole thing. {target} slowed down on purpose. I'm not saying anything yet. I'm saving it."]),
  ],
  'long.credit.steal.any': [
    { id: 'r2.c1', place: 'public', turns: [
      { by: 'a', say: "Honestly, last night only happened because I made it happen." },
      { by: 'c', say: "Really? I heard it was {b}'s idea." },
      { by: 'a', say: "{b} helped. I did the hard part." },
      { by: 'b', say: "Did you, though?" },
      { by: 'a', say: "Don't be modest. It doesn't suit you." },
      { by: 'b', conf: "That was my move. Mine. And {a} is walking around camp taking a bow for it." },
    ] },
  ],
  'long.credit.callout.any': [
    { id: 'r2.c2', place: 'public', turns: [
      { by: 'a', say: "Can we talk about how you've been telling everyone last night was your idea?" },
      { by: 'b', say: "It was kind of my idea." },
      { by: 'a', say: "It was MY idea. You just went along with it." },
      { by: 'b', say: "Does it matter whose idea it was?" },
      { by: 'a', say: "It matters when you're stealing it!" },
      { by: 'c', conf: "Two people fighting over who gets credit for voting someone out. That's this game in one sentence." },
    ] },
  ],
  'long.trade.info.idol': [
    { id: 'r2.i1', place: 'secret', turns: [
      { by: 'a', say: "I'm going to tell you something, and then you're going to owe me." },
      { by: 'b', say: "That's a weird way to start." },
      { by: 'a', say: "{holder} has an idol." },
      { by: 'b', say: "...How do you know?" },
      { by: 'a', say: "I know. That's all you need. Now you know too." },
      { by: 'b', say: "And what do you want for it?" },
      { by: 'a', say: "Your vote, the next time I need it." },
      { by: 'b', conf: "Information about an idol is worth more than the idol. {a} just paid me in it. Now I owe {a}." },
    ] },
  ],
  'long.trade.info.any': [
    { id: 'r2.i2', place: 'secret', turns: [
      { by: 'a', say: "Want to know something? Between us." },
      { by: 'b', say: "Always." },
      { by: 'a', say: "I'll tell you what I heard if you tell me what you heard." },
      { by: 'b', say: "That's fair. You first." },
      { by: 'a', say: "Nice try. Together. On three." },
      { beat: "They swap what they know {here}, low and fast." },
      { by: 'a', conf: "Half of what I gave {b} was true. All of what {b} gave me was. Good trade." },
    ] },
  ],
  'long.deal.double.confront': [
    { id: 'r2.d1', place: 'aside', turns: [
      { by: 'a', say: "So I'm not the only one, am I?" },
      { by: 'b', say: "The only one what?" },
      { by: 'a', say: "The only one you promised final two." },
      { by: 'b', say: "...Who told you that?" },
      { by: 'a', say: "Does it matter? You didn't say no." },
      { by: 'b', say: "It's complicated." },
      { by: 'a', say: "It's really not. We don't have a deal anymore." },
      { by: 'a', conf: "{b} made the same promise to two people. Now {b} has zero people. That's how maths works." },
    ] },
  ],
  'long.deal.broken.confront': [
    { id: 'r2.d2', place: 'aside', turns: [
      { by: 'a', say: "We had a deal. To the end. That's what you said." },
      { by: 'b', say: "I know what I said." },
      { by: 'a', say: "And then you wrote my name." },
      { by: 'b', say: "I had to. You'd have done the same." },
      { by: 'a', say: "No. I wouldn't have. That's the difference between us." },
      { by: 'a', conf: "I believed {b}. That's on me. It won't happen twice." },
    ] },
  ],
  'long.drama.explode.any': [
    { id: 'r2.e1', place: 'public', turns: [
      { by: 'a', say: "You know what? I'm DONE." },
      { by: 'b', say: "Done with what?" },
      { by: 'a', say: "With you! With all of it! You've been on my back since day one!" },
      { by: 'b', say: "I've barely said anything to you!" },
      { by: 'a', say: "That's worse! The way you look at me is worse!" },
      { beat: "Everybody {here} has stopped to watch." },
      { by: 'b', say: "You need help." },
      { by: 'a', say: "I need you to leave me ALONE!" },
      { by: 'b', conf: "I don't know what I did. I genuinely don't know what I did." },
      { by: 'a', conf: "Yeah, I lost it. It had been coming for a while. {b} was just standing in the wrong place when it came." },
    ] },
  ],
  'long.drama.meltdown.any': [
    { id: 'r2.n1', place: 'public', turns: [
      { beat: "It starts small {here}. Then it isn't small." },
      { by: 'a', say: "I'm fine. I'm totally fine. I'm—" },
      { by: 'b', say: "You're not fine." },
      { by: 'a', say: "I'm NOT fine! I'm tired, I'm hungry, everybody's lying to me, and I miss my bed!" },
      { by: 'b', say: "Okay. Okay. Come sit down." },
      { by: 'a', say: "I don't want to sit down!" },
      { beat: "{a} sits down anyway." },
      { by: 'a', conf: "I had a moment. Everybody saw it. I just have to hope people remember the rest of me too." },
    ] },
  ],
  'long.drama.intimidate.any': [
    { id: 'r2.m2', place: 'aside', turns: [
      { beat: "{a} sits down right next to {b} {here}, much too close, and says nothing for a while." },
      { by: 'b', say: "Can I help you?" },
      { by: 'a', say: "Just thinking." },
      { by: 'b', say: "About what?" },
      { by: 'a', say: "About how long you're going to last." },
      { by: 'b', say: "...That's not creepy at all." },
      { beat: "{a} gets up and walks off without another word." },
      { by: 'b', conf: "I'm not scared of {a}. I'm a little scared of {a}." },
    ] },
  ],
  'long.drama.prank.well': [
    { id: 'r2.p1', place: 'sleep', turns: [
      { beat: "Early. {a} has done something to {b}'s things in the {quarters}, and it's very quiet." },
      { by: 'b', say: "Who did this?!" },
      { by: 'a', say: "Did what?" },
      { by: 'b', say: "You know exactly what!" },
      { by: 'a', say: "I've been asleep the whole time." },
      { by: 'b', say: "You're fully dressed!" },
      { by: 'b', conf: "Fine. It was funny. A little. I'm still getting {a} back." },
    ] },
  ],
  'long.drama.prank.badly': [
    { id: 'r2.p2', place: 'public', turns: [
      { by: 'a', say: "It was a joke!" },
      { by: 'b', say: "Nobody's laughing, {a}!" },
      { by: 'a', say: "It was going to be funny! It just went a little wrong!" },
      { by: 'b', say: "A LITTLE?" },
      { beat: "Everyone {here} is very, very quiet." },
      { by: 'a', conf: "In my head it was hilarious. In real life it was a disaster. Note to self: real life is the one that counts." },
    ] },
  ],
  'long.romance.night.never': [
    { id: 'r2.v1', place: 'fire', turns: [
      { beat: "Late {here}. A game of never-have-I-ever has got out of hand." },
      { by: 'c', say: "Never have I ever had a crush on someone out here." },
      { beat: "{a} and {b} both put a finger down. At exactly the same time." },
      { by: 'c', say: "OHHHH." },
      { by: 'a', say: "It's a game! It doesn't mean anything!" },
      { by: 'b', say: "Yeah. Doesn't mean anything." },
      { beat: "Neither of them looks at the other for the rest of the night." },
      { by: 'c', conf: "Best game ever. I learned more in ten seconds than in two weeks." },
    ] },
  ],
  'long.romance.affair.form': [
    { id: 'r2.af1', place: 'secret', turns: [
      { beat: "{a} and {b}, alone {here}. They both know they shouldn't be." },
      { by: 'b', say: "What about {target}?" },
      { by: 'a', say: "Don't." },
      { by: 'b', say: "I'm just saying. If anyone sees us—" },
      { by: 'a', say: "Then nobody sees us." },
      { beat: "{b} doesn't argue. That's the answer." },
      { by: 'b', conf: "This is a terrible idea. I've known it was a terrible idea for days. Here we are." },
    ] },
  ],
  'long.blame.loss.any': [
    { id: 'r2.bl1', place: 'public', turns: [
      { by: 'a', say: "I'm just going to say it. That loss was on you." },
      { by: 'b', say: "On me? Everyone messed up!" },
      { by: 'a', say: "Some people messed up more." },
      { by: 'b', say: "You weren't exactly amazing either." },
      { by: 'a', say: "At least I wasn't the reason." },
      { by: 'b', conf: "Every time we lose, somebody needs a name. Today {a} picked mine." },
    ] },
  ],
  'long.goat.kept.any': [
    { id: 'r2.g1', place: 'aside', turns: [
      { by: 'a', say: "Everybody's being so nice to me lately." },
      { by: 'b', say: "Yeah? That's good." },
      { by: 'a', say: "I think it means I'm doing really well." },
      { by: 'b', say: "...Sure." },
      { by: 'b', conf: "Everybody's nice to {a} because everybody wants to sit next to {a} at the end. {a} thinks it's friendship. It's a seating plan." },
    ] },
  ],
  'long.talk.checkin.any': [
    { id: 'r2.k1', place: 'secret', turns: [
      { by: 'a', say: "Quick check. We're still good?" },
      { by: 'b', say: "We're still good." },
      { by: 'a', say: "Nobody's been in your ear?" },
      { by: 'b', say: "Everybody's been in my ear. Nobody's got through." },
      { by: 'a', say: "That's what I wanted to hear." },
      { by: 'b', conf: "{a} checks on me every day. Some people would find that annoying. I find it useful. It means {a} cares where my vote goes." },
    ] },
  ],
  'long.fallout.found.one': [
    { id: 'r2.ff1', place: 'aside', turns: [
      { by: 'a', say: "You wrote my name." },
      { by: 'b', say: "What? No." },
      { by: 'a', say: "Don't. I know." },
      { by: 'b', say: "...It wasn't personal." },
      { by: 'a', say: "It's my name. It's always personal." },
      { by: 'a', conf: "Now I know. And {b} knows I know. That's going to make every conversation from now on really interesting." },
    ] },
  ],
  'long.hosted.raid.fun': [
    { id: 'r2.hr1', place: 'sleep', when: { venue: 'hosted-camp' }, turns: [
      { beat: "After lights-out. {a} shakes {b} awake in the {quarters}." },
      { by: 'a', say: "Psst. Kitchen run. Now." },
      { by: 'b', say: "Are you insane? Chef will kill us." },
      { by: 'a', say: "Chef's asleep. I checked. Come on." },
      { beat: "Ten minutes later they're back, out of breath, holding a jar of something." },
      { by: 'b', say: "What even is this?" },
      { by: 'a', say: "No idea. It's ours, though." },
      { by: 'b', conf: "We stole a jar of mystery food from Chef in the middle of the night. Best night out here so far." },
    ] },
  ],
  'long.friend.laugh.any': [
    { id: 'r2.fl1', place: 'eat', turns: [
      { beat: "{a} tells a story at mealtime. It starts normal. It does not end normal." },
      { by: 'b', say: "Wait, wait, and then what?" },
      { by: 'a', say: "And then it went in the lake. The whole thing. With me holding it." },
      { by: 'c', say: "Stop. I can't breathe." },
      { by: 'a', say: "I'm not done!" },
      { by: 'b', conf: "{a} could make a funeral funny. Out here, that's a superpower." },
    ] },
  ],
  'long.friend.drift.any': [
    { id: 'r2.dr1', place: 'aside', when: { register: ['schemer', 'cool', 'competitor'] }, turns: [
      { by: 'b', say: "We haven't really talked in a while." },
      { by: 'a', say: "We talk." },
      { by: 'b', say: "We say hi. That's not talking." },
      { by: 'a', say: "Things are busy. It's the game." },
      { by: 'b', say: "Right. The game." },
      { by: 'a', conf: "Being close to {b} makes us look like a pair. Pairs get split. I'm not cutting {b} off. I'm just giving us some distance before somebody else does it for us." },
    ] },
  ],
  'long.drama.dig.any': [
    { id: 'r2.dg1', place: 'public', turns: [
      { by: 'a', say: "Oh, {b}'s helping today? Should I write the date down?" },
      { by: 'b', say: "Funny." },
      { by: 'a', say: "I'm just saying. It's a big moment for all of us." },
      { by: 'c', say: "{a}, come on." },
      { by: 'a', say: "What? I'm being supportive." },
      { by: 'b', conf: "{a} thinks being funny is the same as being nice. It isn't. Everybody's laughing, and everybody's also remembering." },
    ] },
  ],
  'long.drama.clash.any': [
    { id: 'r2.cl1', place: 'work', turns: [
      { by: 'a', say: "Okay, here's the plan for today." },
      { by: 'b', say: "We already have a plan. I made it this morning." },
      { by: 'a', say: "Well, now we have a better one." },
      { by: 'b', say: "Since when are you in charge?" },
      { by: 'a', say: "Since somebody had to be." },
      { by: 'c', say: "Can we just pick one? Please?" },
      { by: 'c', conf: "Every day, {a} and {b} fight about who's the boss. Every day, the rest of us do the work while they argue." },
    ] },
  ],
};

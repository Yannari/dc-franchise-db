// pm/lines/challenges-more.js — the scenes of pm/challenges-more.js. Data only.
//   blow-slip        [a, b]        lips touch mid-pass; they are not a couple
//   blow-dare        [a, b, (c)]   a dropped the card. `of`: kiss-other (b is who a
//                                  fancies, c a's partner) · kiss-partner (b) · forfeit
//   lip-race         [a, b]        a couple. `of`: win · row · laugh
//   lip-watch        [a, b, c]     a, who wants b, watches b win with c
//   tower-q          [a, b, (c)]   b pulled the block and asked a. `of`: other-honest
//                                  (c is who a would go for) · dodge · dodge-seen ·
//                                  rate-high · rate-mid · rate-low · ick · no-ick
//   course-run       [a]           `of`: strong · flop
//   course-pick      [a, b, (c)]   a rescues b. `of`: partner · other (c is a's partner) · single
//   course-win       [a, (b)]      the other side picked a; b is a's partner
//   blind-run        [a, b]        a guides, b is blindfolded. `of`: win · crash-row · crash-laugh
//   sports-captains  [a, b]        `of`: clash · banter
//   sports-win       [a, …]        a's team won
//   sports-sore      [a, (b)]      a takes the loss badly; b is a teammate
//   headline         [a, b, c, (d)] a reads a headline about c and soaks b
//                                  (b is c when `guessed`); d is c's partner.
//                                  `of`: pull · row · ick · love · clown · jealous
const T = (text, who = 'a') => [[who, text]];
export const MORE_CHALLENGE_LINES = {
  'challenge-text': [
    { id: 'challenge-text.truth-dare.1', when: { of: 'truth-dare' }, stage: 'A text arrives, and {a} reads it out.', turns: [['a', "Islanders, today it's time to play Truth or Dare. No secrets, no shame. #TruthOrDare"], ['a', "Oh, this is going to end so badly."]] },
    { id: 'challenge-text.truth-dare.2', when: { of: 'truth-dare' }, stage: 'A text arrives, and {a} reads it out.', turns: [['a', "Islanders, grab a card. You'll be telling the truth, or doing the dare. #NoHidingPlace"], ['a', "I'm picking dare. I'm always picking dare."]] },
    { id: 'challenge-text.suck-blow.1', when: { of: 'suck-blow' }, stage: 'A text arrives, and {a} reads it out.', turns: [['a', "Islanders, today you'll be passing a card from mouth to mouth. Drop it, and you'll have to do the dare on it. #SuckAndBlow"], ['a', "Oh no. Oh, this is going to go wrong."]] },
    { id: 'challenge-text.suck-blow.2', when: { of: 'suck-blow' }, stage: 'A text arrives, and {a} reads it out.', turns: [['a', "Islanders, today you'll be passing a card from mouth to mouth. Drop it, and you'll have to do the dare on it. #SuckAndBlow"], ['a', "Everyone brush your teeth. Now."]] },
    { id: 'challenge-text.lip-service.1', when: { of: 'lip-service' }, stage: 'A text arrives, and {a} reads it out.', turns: [['a', "Islanders, today you'll be making cocktails with your partner, using nothing but your mouths. #LipService"], ['a', "Using our mouths? For all of it?"]] },
    { id: 'challenge-text.lip-service.2', when: { of: 'lip-service' }, stage: 'A text arrives, and {a} reads it out.', turns: [['a', "Islanders, today you'll be making cocktails with your partner, using nothing but your mouths. #LipService"], ['a', "Right. Couples, get your game faces on."]] },
    { id: 'challenge-text.tower.1', when: { of: 'tower' }, stage: 'A text arrives, and {a} reads it out.', turns: [['a', "Islanders, every block in the tower has a question on it. Pull one out, and ask it to your partner. #TowerOfTruths"], ['a', "What kind of questions?"]], beat: 'Nobody answers {a}.' },
    { id: 'challenge-text.tower.2', when: { of: 'tower' }, stage: 'A text arrives, and {a} reads it out.', turns: [['a', "Islanders, every block in the tower has a question on it. Pull one out, and ask it to your partner. #TowerOfTruths"], ['a', "I'm scared of a block. That's where we are."]] },
    { id: 'challenge-text.lads-course.1', when: { of: 'lads-course' }, stage: 'A text arrives, and {a} reads it out.', turns: [['a', "Boys, today you'll be taking on an obstacle course, in costume, and rescuing the girl of your choice at the end. The girls will pick the winner. #LadsOnTour"], ['a', "The girl of your choice. Okay."]], beat: 'Every girl in the villa looks at her own partner.' },
    { id: 'challenge-text.lads-course.2', when: { of: 'lads-course' }, stage: 'A text arrives, and {a} reads it out.', turns: [['a', "Boys, today you'll be taking on an obstacle course, in costume, and rescuing the girl of your choice at the end. The girls will pick the winner. #LadsOnTour"], ['a', "In costume. What costume?"]] },
    { id: 'challenge-text.girls-course.1', when: { of: 'girls-course' }, stage: 'A text arrives, and {a} reads it out.', turns: [['a', "Girls, today you'll be taking on an obstacle course, in costume, and finishing with the boy of your choice. The boys will pick the winner. #GirlsOnTop"], ['a', "The boy of our choice? Oh, this is going to cause drama."]] },
    { id: 'challenge-text.girls-course.2', when: { of: 'girls-course' }, stage: 'A text arrives, and {a} reads it out.', turns: [['a', "Girls, today you'll be taking on an obstacle course, in costume, and finishing with the boy of your choice. The boys will pick the winner. #GirlsOnTop"], ['a', "I was born for this."]] },
    { id: 'challenge-text.blind-course.1', when: { of: 'blind-course' }, stage: 'A text arrives, and {a} reads it out.', turns: [['a', "Islanders, one of you will be blindfolded, and your partner will have to guide you round the course. #TrustMe"], ['a', "Do you trust me?"]] },
    { id: 'challenge-text.blind-course.2', when: { of: 'blind-course' }, stage: 'A text arrives, and {a} reads it out.', turns: [['a', "Islanders, one of you will be blindfolded, and your partner will have to guide you round the course. #TrustMe"], ['a', "This is a test, isn't it? This is a relationship test."]] },
    { id: 'challenge-text.sports-day.1', when: { of: 'sports-day' }, stage: 'A text arrives, and {a} reads it out.', turns: [['a', "Islanders, today is sports day. Split into two teams and get ready to race. #VillaSportsDay"], ['a', "Egg and spoon. I've been waiting my whole life."]] },
    { id: 'challenge-text.sports-day.2', when: { of: 'sports-day' }, stage: 'A text arrives, and {a} reads it out.', turns: [['a', "Islanders, today is sports day. Split into two teams and get ready to race. #VillaSportsDay"], ['a', "I'm very competitive. I'm apologising now."]] },
    { id: 'challenge-text.headlines.1', when: { of: 'headlines' }, stage: 'A text arrives, and {a} reads it out.', turns: [['a', "Islanders, the papers have been writing about you. Read the headline, and throw a drink at who you think it's about. #HoldTheFrontPage"], ['a', "The papers? What have they been saying?"]] },
    { id: 'challenge-text.headlines.2', when: { of: 'headlines' }, stage: 'A text arrives, and {a} reads it out.', turns: [['a', "Islanders, the papers have been writing about you. Read the headline, and throw a drink at who you think it's about. #HoldTheFrontPage"], ['a', "So we find out what the outside thinks of us. Great."]] },
  ],

  'blow-slip': [
    { id: 'bs.01', turns: T("Sorry! Sorry. That was an accident."), beat: 'It did not look like much of an accident, and the whole line saw it.' },
    { id: 'bs.02', stage: 'The card drops between {a} and {b}, and their lips meet anyway.', turns: [['a', "That doesn't count."], ['b', "Doesn't it?"]] },
    { id: 'bs.03', turns: [['b', "Were you even trying to pass it?"], ['a', "Of course I was."]], beat: 'Somebody further down the line coughs very loudly.' },
    { id: 'bs.04', stage: '{a} and {b} stay nose to nose a second longer than the card needs.', turns: [['a', "…Got it?"], ['b', "Got it."]] },
  ],
  'blow-dare': [
    { id: 'bd.o.01', when: { of: 'kiss-other', taken: true }, stage: '{a} drops the card and reads the dare out loud.', turns: [['a', "'Kiss the islander you {~fancy} most, other than your partner.'"], ['a', "Right. Sorry."]], beat: '{a} walks straight over to {b}. {c} watches every second of it.' },
    { id: 'bd.o.02', when: { of: 'kiss-other', taken: true }, turns: [['a', "Do I have to?"], ['b', "It's a dare. You have to."]], beat: 'It is a longer kiss than it needed to be. {c} does not clap.' },
    { id: 'bd.o.03', when: { of: 'kiss-other', taken: true }, stage: 'The dare: kiss the islander you like most, apart from your partner.', turns: [['a', "I didn't write the dares."]], beat: '{a} kisses {b}, and the villa goes "ooh". {c} stares at the floor.' },
    { id: 'bd.o.04', when: { of: 'kiss-other', taken: true }, turns: [['a', "I'm not choosing. I'm really not choosing."]], beat: '{a} chooses {b}. Quickly. Too quickly, from where {c} is sitting.' },
    { id: 'bd.o.05', when: { of: 'kiss-other', taken: false }, stage: '{a} drops the card and reads the dare out loud.', turns: [['a', "'Kiss the islander you {~fancy} most.'"], ['a', "Easy. I'm single."]], beat: '{a} walks straight over to {b}, and the villa screams.' },
    { id: 'bd.o.06', when: { of: 'kiss-other', taken: false }, turns: [['a', "Do I have to pick?"], ['b', "It's a dare."]], beat: '{a} kisses {b}, and nobody in the villa is surprised.' },
    { id: 'bd.p.01', when: { of: 'kiss-partner' }, stage: "The dare: kiss your partner like it's the first time.", turns: [['a', "Easy."]], beat: '{a} kisses {b}, and the villa cheers.' },
    { id: 'bd.p.02', when: { of: 'kiss-partner' }, turns: [['a', "Finally, a dare I actually want."], ['b', "Come here, then."]] },
    { id: 'bd.p.03', when: { of: 'kiss-partner' }, turns: [['b', "Is that the best you've got?"], ['a', "Give me a second go."]], beat: 'The second go gets a round of applause.' },
    { id: 'bd.f.01', when: { of: 'forfeit' }, stage: 'The dare: a full dance routine, no music.', turns: T("You all asked for this.") , beat: '{a} commits to every single move.' },
    { id: 'bd.f.02', when: { of: 'forfeit' }, stage: 'The dare: say one thing nobody in the villa knows about you.', turns: T("I've cried at every single wedding I've been to. Even ones I wasn't invited to."), beat: 'Nobody asks a follow-up question.' },
    { id: 'bd.f.03', when: { of: 'forfeit' }, stage: 'The dare: an impression of another islander.', turns: T("Guess who I am."), beat: 'Everyone gets it straight away, and the person it is laughs the loudest.' },
  ],
  'lip-race': [
    { id: 'lsv.w.01', when: { of: 'win' }, turns: [['a', "We won! We actually won!"], ['b', "Best team in here. I told you."]], beat: 'They celebrate with a kiss that has nothing to do with cocktails.' },
    { id: 'lsv.w.02', when: { of: 'win' }, turns: [['b', "How are we so good at that?"], ['a', "Practice."]], beat: 'The villa groans.' },
    { id: 'lsv.w.03', when: { of: 'win' }, stage: '{a} and {b} fill their glass first and raise it to the others.', turns: [['a', "Cheers, everyone."], ['b', "Better luck next time."]] },
    { id: 'lsv.l.01', when: { of: 'laugh' }, turns: [['a', "Most of that went down my top."], ['b', "Most of it went down mine."]], beat: 'They are laughing too hard to finish.' },
    { id: 'lsv.l.02', when: { of: 'laugh' }, turns: [['b', "We were so bad at that."], ['a', "The worst. By miles."], ['b', "Still fun, though."]] },
    { id: 'lsv.l.03', when: { of: 'laugh' }, stage: '{a} slips over for the third time and takes {b} down too.', turns: [['b', "Why are you like this?"], ['a', "You love it."]] },
    { id: 'lsv.r.01', when: { of: 'row' }, turns: [['a', "You keep going too fast."], ['b', "You keep dropping it."], ['a', "Because you keep going too fast!"]], beat: 'They finish last, and in silence.' },
    { id: 'lsv.r.02', when: { of: 'row' }, turns: [['b', "Just follow me."], ['a', "I am following you. You're going the wrong way."]], beat: 'Neither of them is laughing.' },
    { id: 'lsv.r.03', when: { of: 'row' }, turns: [['a', "That was embarrassing."], ['b', "For who?"], ['a', "For both of us."]] },
  ],
  'lip-watch': [
    { id: 'lw.01', stage: '{a} watches {b} and {c} win, and does not clap.', turns: [['a', "Good for them."]], beat: 'It does not sound like {a} means it.' },
    { id: 'lw.02', turns: [['a', "They didn't have to make it look that easy."]], beat: '{a} looks away before {b} can notice.' },
    { id: 'lw.03', stage: 'While everyone cheers for {b} and {c}, {a} gets up for a drink.', turns: [['a', "I'm fine. I'm just thirsty."]] },
  ],
  'tower-q': [
    { id: 'tq.oh.01', when: { of: 'other-honest' }, stage: '{b} pulls a block and reads it.', turns: [['b', "'Who would you go for in here, if you weren't with me?'"], ['a', "…Honestly? {c}."], ['b', "Right. Okay."]], beat: '{c} looks up from across the lawn.' },
    { id: 'tq.oh.02', when: { of: 'other-honest' }, turns: [['b', "Who would you pick if it wasn't me?"], ['a', "Do you want the truth?"], ['b', "That's the game."], ['a', "{c}."]], beat: 'The tower wobbles. So does {b}.' },
    { id: 'tq.oh.03', when: { of: 'other-honest' }, turns: [['b', "'Who else in here do you find attractive?'"], ['a', "I'm not going to lie. {c}."], ['b', "At least you said it."]] },
    { id: 'tq.d.01', when: { of: 'dodge' }, turns: [['b', "'Who would you go for in here, if you weren't with me?'"], ['a', "Nobody. It's you, obviously."], ['b', "Good answer."]] },
    { id: 'tq.d.02', when: { of: 'dodge' }, turns: [['b', "Who would you pick if it wasn't me?"], ['a', "That's a trick question. It's you."]], beat: '{b} smiles and moves on.' },
    { id: 'tq.ds.01', when: { of: 'dodge-seen' }, turns: [['b', "'Who would you go for in here, if you weren't with me?'"], ['a', "Nobody. You."], ['b', "You took a long time to say nobody."]] },
    { id: 'tq.ds.02', when: { of: 'dodge-seen' }, turns: [['b', "Who would you pick if it wasn't me?"], ['a', "No one."], ['b', "You looked somewhere before you said that."]], beat: '{a} has no answer to that.' },
    { id: 'tq.rh.01', when: { of: 'rate-high' }, turns: [['b', "'Out of ten, how happy are you with me?'"], ['a', "Nine. And that's only because I'm keeping one back for later."]] },
    { id: 'tq.rh.02', when: { of: 'rate-high' }, turns: [['b', "Out of ten, how happy are you?"], ['a', "Ten. Easy."], ['b', "You didn't even think about it."], ['a', "I didn't have to."]] },
    { id: 'tq.rm.01', when: { of: 'rate-mid' }, turns: [['b', "'Out of ten, how happy are you with me?'"], ['a', "Seven. Maybe a six. It's early."], ['b', "A six?"]] },
    { id: 'tq.rm.02', when: { of: 'rate-mid' }, turns: [['b', "How happy are you, out of ten?"], ['a', "Honestly? A solid six."], ['b', "I'll take a solid six. For now."]] },
    { id: 'tq.rl.01', when: { of: 'rate-low' }, turns: [['b', "'Out of ten, how happy are you with me?'"], ['a', "Four?"], ['b', "Four?"]], beat: 'The tower is not the only thing that falls over.' },
    { id: 'tq.rl.02', when: { of: 'rate-low' }, turns: [['b', "Out of ten?"], ['a', "Can I pass?"], ['b', "No."], ['a', "…Three."]] },
    { id: 'tq.i.01', when: { of: 'ick' }, turns: [['b', "'What's your ick about me?'"], ['a', "Do you really want to know?"], ['b', "Now I do."], ['a', "The way you eat cereal. It's loud."]], beat: '{b} is never eating cereal in front of {a} again.' },
    { id: 'tq.i.02', when: { of: 'ick' }, turns: [['b', "What's your ick?"], ['a', "When you check yourself out in every mirror."], ['b', "I don't do that."]], beat: '{b} checks {b.ref} out in the pool while saying it.' },
    { id: 'tq.n.01', when: { of: 'no-ick' }, turns: [['b', "'What's your ick about me?'"], ['a', "I haven't got one yet."], ['b', "Yet?"], ['a', "Give me time."]] },
    { id: 'tq.n.02', when: { of: 'no-ick' }, turns: [['b', "What's your ick?"], ['a', "Honestly, I can't think of one."]], beat: '{b} looks very pleased with {b.ref}.' },
  ],
  'course-run': [
    { id: 'cr.s.01', when: { of: 'strong' }, stage: '{a} flies round the course and does not miss a single obstacle.', turns: T("Is that it? I could go again.") },
    { id: 'cr.s.02', when: { of: 'strong' }, stage: '{a} finishes the course and still has the breath to show off.', turns: T("Did everyone get that? Should I do it again?") , beat: 'The judges are very much getting it.' },
    { id: 'cr.s.03', when: { of: 'strong' }, stage: 'The costume is ridiculous. {a} makes it work anyway.', turns: T("I'm not embarrassed. I'm a professional.") },
    { id: 'cr.f.01', when: { of: 'flop' }, stage: '{a} falls off the first obstacle, gets back on, and falls off again.', turns: T("It's the costume! I can't see in this.") , beat: 'The villa loves it.' },
    { id: 'cr.f.02', when: { of: 'flop' }, stage: '{a} gets stuck halfway through the course.', turns: T("I'm fine! I'm fine. Someone help me.") },
    { id: 'cr.f.03', when: { of: 'flop' }, stage: '{a} takes a wrong turn and ends up in the pool.', turns: T("That was the plan. That was always the plan.") },
  ],
  'course-pick': [
    { id: 'cp.p.01', when: { of: 'partner' }, stage: 'At the end of the course, {a} goes straight to {b}.', turns: [['a', "There was never anyone else."], ['b', "Good answer."]] },
    { id: 'cp.p.02', when: { of: 'partner' }, turns: [['b', "You picked me."], ['a', "Of course I picked you."]], beat: '{b} kisses {a} in front of everyone.' },
    { id: 'cp.p.03', when: { of: 'partner' }, stage: '{a} scoops {b} up and carries {b.obj} over the finish line.', turns: [['b', "Put me down!"], ['a', "Never."]] },
    { id: 'cp.o.01', when: { of: 'other' }, stage: '{a} runs straight past {c} and stops at {b}.', turns: [['a', "It's just a game."]], beat: '{c} is not smiling. At all.' },
    { id: 'cp.o.02', when: { of: 'other' }, turns: [['b', "Me? Are you sure?"], ['a', "It's for the challenge."]], beat: 'Everyone turns to look at {c}. {c} is looking at {a}.' },
    { id: 'cp.o.03', when: { of: 'other' }, stage: 'The whole villa gasps when {a} goes to {b} instead of {c}.', turns: [['c', "Wow. Okay."]], beat: '{a} does not look back at {c} for the rest of the challenge.' },
    { id: 'cp.s.01', when: { of: 'single' }, stage: '{a} is single, and goes straight for {b}.', turns: [['a', "I'm allowed. I'm single."], ['b', "I didn't say anything."]] },
    { id: 'cp.s.02', when: { of: 'single' }, turns: [['a', "I've wanted an excuse to do this all week."]], beat: '{a} kisses {b}, and the villa screams.' },
  ],
  'course-win': [
    { id: 'cw.01', turns: [['a', "I won? I actually won?"]], beat: 'The other side cheers. {a} takes a very long bow.' },
    { id: 'cw.02', when: { withB: true }, turns: [['b', "I voted for you, obviously."], ['a', "Obviously."]] },
    { id: 'cw.03', turns: [['a', "I'd like to thank the costume. I couldn't have done it without the costume."]] },
    { id: 'cw.04', when: { withB: true }, turns: [['b', "You were ridiculous."], ['a', "And I won. Say it."], ['b', "You won."]] },
  ],
  'blind-run': [
    { id: 'blc.w.01', when: { of: 'win' }, turns: [['a', "Left. Left. Stop. Now forward."], ['b', "I trust you."], ['a', "Keep going. You're nearly there."]], beat: 'They cross the line first, and {b} pulls the blindfold off grinning.' },
    { id: 'blc.w.02', when: { of: 'win' }, turns: [['b', "Did we win?"], ['a', "We won."], ['b', "I didn't see a single thing."], ['a', "You didn't need to."]] },
    { id: 'blc.w.03', when: { of: 'win' }, stage: '{b} does exactly what {a} says, every step.', turns: [['a', "We're a good team."], ['b', "We are."]] },
    { id: 'blc.cl.01', when: { of: 'crash-laugh' }, turns: [['a', "Right! Right! No, my right!"]], beat: '{b} walks straight into the pool. They are both crying with laughter.' },
    { id: 'blc.cl.02', when: { of: 'crash-laugh' }, turns: [['b', "Where am I?"], ['a', "Honestly? I don't know either."]], beat: 'They finish last, laughing the whole way.' },
    { id: 'blc.cl.03', when: { of: 'crash-laugh' }, turns: [['b', "You walked me into a hedge."], ['a', "It was a very small hedge."]] },
    { id: 'blc.cr.01', when: { of: 'crash-row' }, turns: [['b', "You're not even trying."], ['a', "You're not listening!"], ['b', "Because you're not making sense!"]], beat: '{b} pulls the blindfold off and walks the rest of the course.' },
    { id: 'blc.cr.02', when: { of: 'crash-row' }, turns: [['a', "Why would you go that way?"], ['b', "Because you told me to."], ['a', "I did not."]], beat: 'The rest of the villa decides not to get involved.' },
    { id: 'blc.cr.03', when: { of: 'crash-row' }, turns: [['b', "I don't trust you with this."], ['a', "With a game?"], ['b', "With anything, right now."]] },
  ],
  'sports-captains': [
    { id: 'sc.c.01', when: { of: 'clash' }, turns: [['a', "You're going down."], ['b', "Say that after the sack race."], ['a', "I'll say it now. You're going down."]], beat: 'The trash talk stops being a joke about halfway through.' },
    { id: 'sc.c.02', when: { of: 'clash' }, turns: [['b', "Your team cheated."], ['a', "We won. That's different."], ['b', "It's really not."]] },
    { id: 'sc.c.03', when: { of: 'clash' }, stage: '{a} and {b} both claim the tug of war, and neither will let go of the rope.', turns: [['a', "Let go."], ['b', "You let go."]] },
    { id: 'sc.b.01', when: { of: 'banter' }, turns: [['a', "Good luck. You'll need it."], ['b', "I'll save you a place on the podium. Second place."]], beat: 'They shake hands, laughing.' },
    { id: 'sc.b.02', when: { of: 'banter' }, turns: [['b', "My team's faster."], ['a', "Your team's louder. It's not the same."]] },
    { id: 'sc.b.03', when: { of: 'banter' }, turns: [['a', "Well played."], ['b', "Rematch?"], ['a', "Any time."]] },
  ],
  'sports-win': [
    { id: 'sw.01', turns: [['a', "Winners! We are the winners!"]], beat: '{a} leads a lap of honour round the pool.' },
    { id: 'sw.02', turns: [['a', "Best team. Never in doubt."], ['b', "It was a bit in doubt in the egg and spoon."]] },
    { id: 'sw.03', stage: '{a} holds the trophy, which is a painted coconut, above {a.posAdj} head.', turns: [['a', "This is going on my mantelpiece."]] },
  ],
  'sports-sore': [
    { id: 'ss.01', turns: [['a', "It was fixed."], ['b', "It was an egg and spoon race."], ['a', "Fixed."]], beat: '{a} sulks on the sunbed for an hour.' },
    { id: 'ss.02', turns: T("I don't care. It's just a game. I'm fine."), beat: '{a} is clearly not fine, and slams the fridge door.' },
    { id: 'ss.03', when: { withB: true }, turns: [['a', "If you hadn't dropped the egg—"], ['b', "Are you actually blaming me?"], ['a', "A bit."]] },
  ],
  headline: [
    // pull: what the country saw — coupled, and cosying up to someone else
    { id: 'hl.p.r.01', when: { of: 'pull', guessed: true }, stage: '{a} reads the headline out.', turns: [['a', "'Islander caught getting cosy with someone else while partner's back is turned.'"]], beat: '{a} throws the drink at {c}. Right first time. {d} goes very quiet.' },
    { id: 'hl.p.r.02', when: { of: 'pull', guessed: true }, turns: [['a', "'Loved-up islander not so loved-up after late-night chat.'"], ['c', "Why is everyone looking at me?"]], beat: 'The drink hits {c} before {c} has finished the sentence. {d} does not laugh.' },
    { id: 'hl.p.w.01', when: { of: 'pull', guessed: false }, turns: [['a', "'Islander caught getting cosy with someone else while partner's back is turned.'"], ['b', "Why me?"]], beat: '{b} is soaked, and furious. {c} laughs a bit too hard.' },
    { id: 'hl.p.w.02', when: { of: 'pull', guessed: false }, turns: [['a', "'Loved-up islander not so loved-up after late-night chat.'"]], beat: '{a} soaks {b}. It was not {b}. {c} keeps very still.' },
    // row
    { id: 'hl.r.r.01', when: { of: 'row', guessed: true }, turns: [['a', "'Villa hothead kicks off. Again.'"], ['c', "That's so unfair."]], beat: 'Nobody else thinks it is unfair. {c} is wearing the drink.' },
    { id: 'hl.r.w.01', when: { of: 'row', guessed: false }, turns: [['a', "'Villa hothead kicks off. Again.'"], ['b', "Me? I'm the calmest person in here!"]], beat: 'Everyone turns to look at {c}, who does not argue.' },
    // ick
    { id: 'hl.i.r.01', when: { of: 'ick', guessed: true }, turns: [['a', "'Islander goes off partner over the smallest thing.'"], ['c', "It wasn't small!"]], beat: 'The drink lands on {c}, and the villa howls.' },
    { id: 'hl.i.w.01', when: { of: 'ick', guessed: false }, turns: [['a', "'Islander goes off partner over the smallest thing.'"]], beat: '{a} soaks {b}. {c} pretends to be very interested in the sky.' },
    // love
    { id: 'hl.l.r.01', when: { of: 'love', guessed: true }, turns: [['a', "'Smitten islander can't stop saying the L word.'"], ['c', "I'm not sorry."]], beat: '{c} takes the drink with a grin.' },
    { id: 'hl.l.w.01', when: { of: 'love', guessed: false }, turns: [['a', "'Smitten islander can't stop saying the L word.'"], ['b', "I haven't said it to anyone!"], ['c', "It's me. Obviously it's me."]] },
    // clown
    { id: 'hl.c.r.01', when: { of: 'clown', guessed: true }, turns: [['a', "'Villa joker has the whole nation in stitches.'"], ['c', "The whole nation! Did you hear that?"]], beat: '{c} is soaked and delighted.' },
    { id: 'hl.c.w.01', when: { of: 'clown', guessed: false }, turns: [['a', "'Villa joker has the whole nation in stitches.'"], ['c', "Excuse me. That's clearly me."]], beat: '{b} is soaked, and not the joker.' },
    // jealous
    { id: 'hl.j.r.01', when: { of: 'jealous', guessed: true }, turns: [['a', "'Green-eyed islander can't handle partner chatting to anyone.'"], ['c', "I'm not jealous. I'm observant."]], beat: 'Drink. {c}. Direct hit.' },
    { id: 'hl.j.w.01', when: { of: 'jealous', guessed: false }, turns: [['a', "'Green-eyed islander can't handle partner chatting to anyone.'"], ['b', "I'm the least jealous person here."]], beat: 'Half the villa looks at {c}.' },
  ],
};

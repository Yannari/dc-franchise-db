// pm/lines/firepit.js — the night before a dumping's verdict (pm/moments.js
// fireBuildUp). Data only.
//
//   dump-text       [a, b]   the text that there is a dumping tonight. `of`: the format
//   dump-nerves     [a, b]   a couple waiting to go down to the fire pit
//   dump-open       []       the host arrives and says exactly how tonight works. `of`: the format
//   dump-recap      [a, b, c] the host on a moment since the last dumping. `of`: its kind, or intro; `ago`
//   dump-safe       [a, b]   a safe couple, read out. `nth`: first · next · last
//   dump-buildup    [a, b]   a couple at risk. `nth`: first · next · only
//   dump-plea       [a, b]   the at-risk make their case. `of`: couple · one
//   dump-decide     []       the host hands the decision over. `of`: the format
//
// The format is `of` (moments.js coupleFormatNight's `played`, or the channel):
// public · one-stays · safe-pick-couple · cross-gender · top-couple · save ·
// couples · exes. Nothing here says who is at risk before the host does.
const pub = of => ({ of });
// The nights the public ranked every couple, so the ones left are the fewest votes.
const RANKED = ['public', 'villa', 'top-couple'];
export const FIREPIT_LINES = {
  'dump-text': [
    { id: 'dt.01', stage: "{a}'s phone goes off, and the whole terrace goes quiet.", turns: [['a', "I got a text!"], ['a', "Islanders, tonight there will be a dumping. Please make your way to the fire pit. #PackYourBags"], ['b', "I feel sick."]] },
    { id: 'dt.02', when: { of: ['public', 'public-double', 'one-stays', 'safe-pick-couple', 'cross-gender', 'top-couple'] }, turns: [['a', "Islanders, the public have been voting for their favourite couple, and the results are in. Please gather at the fire pit. #ResultsNight"], ['b', "Oh, no. Oh, no, no, no."]] },
    { id: 'dt.03', stage: 'Everyone crowds round {a} and the phone.', turns: [['a', "Islanders, tonight somebody's time in the villa comes to an end. #FirePit"], ['b', "Why does it always say it like that?"]] },
    { id: 'dt.04', when: pub('couples'), turns: [['a', "Islanders, tonight you will decide which couples are the least compatible. Please make your way to the fire pit. #TheVillaDecides"], ['b', "We have to vote? Out loud?"]] },
    { id: 'dt.05', when: pub('save'), turns: [['a', "Islanders, the public have been voting for their favourite islander. Tonight, some of you will be at risk. #WhoWillBeSaved"], ['b', "Some of us? As in, not couples?"]] },
    { id: 'dt.06', when: pub('exes'), turns: [['a', "Islanders, tonight there is a dumping, and you have visitors. Please make your way to the fire pit. #BlastFromThePast"], ['b', "Visitors? What visitors?"]] },
    { id: 'dt.07', stage: '{a} reads it twice before reading it out.', turns: [['a', "Islanders, please get ready. Tonight, somebody will be leaving the villa. #ItsTime"]], beat: 'Nobody moves for a moment.' },
    { id: 'dt.08', when: pub('public-double'), turns: [['a', "Islanders, tonight TWO couples will be dumped from the island. Please make your way to the fire pit. #DoubleDumping"], ['b', "Two? Two couples?"]] },
    { id: 'dt.09', when: pub('singles'), turns: [['a', "Islanders, tonight every single islander is vulnerable. Please make your way to the fire pit. #SingleAndVulnerable"]], beat: 'Everyone who is single goes quiet.' },
  ],
  // A bombshell night's rule, said before it plays (moments.js arrivalRule).
  // {a} is the new arrival. `of`: stand-up · public-matches (the save has save-setup).
  'rule-open': [
    { id: 'rr.su1', when: { of: 'stand-up' }, stage: 'Everyone gathers at the fire pit.', turns: [['dior', "Islanders, {a} is going to couple up tonight. If you would like to get to know {a}, I want you to stand up. Now."]], beat: 'Nobody moves at first. Everyone is watching the benches.' },
    { id: 'rr.su2', when: { of: 'stand-up' }, turns: [['a', "I want to get to know some of you properly. So if you're interested in me, please stand up."], ['dior', "And {a} will choose from whoever is standing. Partners included."]], beat: 'A few couples stop holding hands.' },
    { id: 'rr.pm2', when: { of: 'public-matches' }, stage: 'A text arrives at the fire pit.', turns: [['dior', "It's not {a}'s choice tonight. It's yours at home. The public have picked {a}'s partner."]] },
  ],
  // The final vote's opening (moments.js final). `of`: envelope (Split or
  // Steal follows) · plain.
  'final-open': [
    { id: 'fo.1', stage: 'The final couples stand at the fire pit, hand in hand, for the last time.', turns: [['dior', "Islanders, this is it. The final."], ['dior', "The public have been voting for the couple they want to crown their Perfect Match. I have the results here, and I'll read them out from the bottom."]], beat: 'Somebody on the end is shaking.' },
    { id: 'fo.2', stage: 'The villa is lit up for the last night. The couples stand in a line, holding on to each other.', turns: [['dior', "Good evening, and welcome to the final."], ['dior', "Over the last few days, the public have been deciding who wins. Only one couple can take the title."]] },
    { id: 'fo.e', when: { of: 'envelope' }, stage: 'The final couples stand at the fire pit, hand in hand.', turns: [['dior', "Islanders, the public have voted, and tonight one couple will be crowned the winners."], ['dior', "And the winners will face one last decision, in an envelope."]], beat: 'Every couple squeezes hands a little tighter.' },
  ],
  // The last two couples (moments.js final): [a, b, c, d], a & b and c & d,
  // named in a fixed order that never gives the result away. {d} is named, never speaks.
  'final-two': [
    { id: 'ft.1', turns: [['dior', "Which leaves two couples."], ['dior', "{a} and {b}. {c} and {d}."], ['dior', "{a}, what would it mean to win this?"], ['a', "Everything. But I've already got what I came in for."], ['dior', "{c}?"], ['c', "Whatever happens tonight, I'm leaving with {d}."]], beat: 'The two couples look at each other along the line.' },
    { id: 'ft.2', stage: 'Only two couples are left standing at the front of the fire pit.', turns: [['dior', "Two couples left. In a moment, one of you will be crowned the winners."], ['dior', "{b}, how are you feeling?"], ['b', "Sick. Honestly, I feel sick."], ['dior', "{c}?"], ['c', "I just want to know. I can't take the waiting."]], beat: '{a} has not let go of {b.posAdj} hand.' },
    { id: 'ft.3', turns: [['dior', "{a} and {b}. {c} and {d}. You've come a long way to be standing here."], ['a', "Whatever happens, well done, you two."], ['c', "You too. You deserve it as much as we do."]], beat: 'The two couples hug across the gap, then step back into line.' },
    { id: 'ft.4', turns: [['narrator', "Two couples. All those recouplings and dumpings, and it comes down to this."], ['dior', "{b}, {c}, is there anything you want to say before I read it?"], ['b', "Just thank you to everyone who voted for us."], ['c', "Same. Thank you, everyone."]] },
  ],
  // The host holds the name. Nobody named: the pause is the whole scene.
  'final-drum': [
    { id: 'fd.1', stage: 'The host opens the card and takes a long look at it.', turns: [['dior', "I'm going to read out the couple in second place. The other couple will be your winners."], ['narrator', "Nobody at the fire pit is breathing."]] },
    { id: 'fd.2', stage: 'The music drops away. The host looks from one couple to the other.', turns: [['dior', "I'm going to read out your runners-up first. Which means the other couple are your winners."]], beat: 'Both couples grip each other a little tighter.' },
    { id: 'fd.3', turns: [['dior', "The public have voted."], ['dior', "And the couple in second place are…"]], beat: 'A long, long pause.' },
  ],
  // The winners' moment: [a, b] won, [c, d] the runners-up; {d} never speaks.
  // `of`: the shape of the winners' story (journey.js shapesOf), which the
  // narrator says, from what really happened between them.
  'final-winners': [
    { id: 'fw.en', when: { of: 'enemies' }, stage: 'Confetti comes down over the fire pit.', turns: [['narrator', "At the start, these two could not stand each other. Tonight, the country picked them over everyone."], ['a', "If you'd told me this in the first week, I'd have laughed."], ['b', "So would I. I'm glad I was wrong about you."], ['dior', "Congratulations, you two. You're this year's Perfect Match."]], beat: '{c} and {d} are the first ones over to hug them.' },
    { id: 'fw.sc', when: { of: 'second-chance' }, stage: 'Confetti comes down over the fire pit.', turns: [['narrator', "They were given a second chance, and they took it."], ['a', "We nearly lost this."], ['b', "We didn't, though. We're here."], ['dior', "Congratulations, {a} and {b}. You're this year's Perfect Match."]], beat: '{c} hugs them both, and {d} joins in.' },
    { id: 'fw.ud', when: { of: 'underdog' }, stage: 'Fireworks go up over the villa.', turns: [['narrator', "For a long time, nobody gave these two a chance. The public did."], ['a', "Nobody thought we'd get here."], ['b', "We did, though."], ['c', "Come here, you two. You deserve this."]], beat: 'The whole fire pit is on its feet.' },
    { id: 'fw.wb', when: { of: 'way-back' }, stage: 'Confetti comes down over the fire pit.', turns: [['narrator', "They broke up in this villa, and found their way back to each other. Now they've won it."], ['b', "I'm so glad we found our way back."], ['a', "So am I. I'm never letting that happen again."], ['dior', "Congratulations. You're this year's Perfect Match."]] },
    { id: 'fw.ff', when: { of: 'fought-for' }, stage: 'Fireworks go up over the villa.', turns: [['narrator', "Somebody tried to come between them, and they held on. Tonight, it paid off."], ['a', "I'd go through all of it again for you."], ['b', "You won't have to."], ['c', "Well done, both of you. Honestly."]], beat: '{c} and {d} hug them, and the other couples pile in.' },
    { id: 'fw.fh', when: { of: 'fell-harder' }, stage: 'Confetti comes down over the fire pit.', turns: [['narrator', "One of them fell first. The other one fell harder. And the public fell for both of them."], ['b', "I got there in the end."], ['a', "You did. And look where it got us."], ['dior', "Congratulations, you two. You're this year's Perfect Match."]] },
    { id: 'fw.rk', when: { of: 'rocky' }, stage: 'Fireworks go up over the villa.', turns: [['narrator', "It was never easy for these two. They argued, they made up, and they never gave up on each other."], ['a', "We had some bad days in here."], ['b', "And we got through every one of them."], ['dior', "Congratulations. You're this year's Perfect Match."]], beat: '{c} and {d} are the first ones over.' },
    { id: 'fw.sv', when: { of: 'survivors' }, stage: 'Confetti comes down over the fire pit.', turns: [['narrator', "They were at risk more than once. They survived every time, and now they've won."], ['a', "We were nearly dumped. More than once."], ['b', "And now look at us."], ['c', "You earned it. Well done."]] },
    { id: 'fw.hd', when: { of: 'held' }, stage: 'Fireworks go up over the villa.', turns: [['narrator', "Casa Amor tested them, and they both stayed loyal. Tonight, that paid off."], ['a', "I never doubted you. Not once."], ['b', "I never doubted you either."], ['dior', "Congratulations, {a} and {b}. You're this year's Perfect Match."]], beat: '{c} and {d} come over and hug them both.' },
    { id: 'fw.cm', when: { of: 'casa-made' }, stage: 'Confetti comes down over the fire pit.', turns: [['narrator', "They met halfway through, when Casa Amor turned the villa upside down. Now they've won the whole thing."], ['a', "Halfway through, and we still won it."], ['b', "I'd do every day of it again."], ['dior', "Congratulations. You're this year's Perfect Match."]] },
    { id: 'fw.lt', when: { of: 'late' }, stage: 'Fireworks go up over the villa.', turns: [['narrator', "They got together late, and they made every day count."], ['b', "We didn't have long in here together."], ['a', "Long enough. I knew."], ['c', "Come here. Well done, you two."]] },
    { id: 'fw.fr', when: { of: 'friends' }, stage: 'Confetti comes down over the fire pit.', turns: [['narrator', "They were friends first. Tonight, they're the winners."], ['a', "You were my best friend in here before anything else."], ['b', "I still am."], ['dior', "Congratulations, you two. You're this year's Perfect Match."]] },
    { id: 'fw.sb', when: { of: 'slow-burn' }, stage: 'Fireworks go up over the villa.', turns: [['narrator', "It took them a long time to get here. It was worth the wait."], ['b', "It took us ages, didn't it?"], ['a', "It did. I wouldn't change any of it."], ['dior', "Congratulations. You're this year's Perfect Match."]], beat: '{c} and {d} are the first ones over to hug them.' },
    { id: 'fw.st', when: { of: 'steady' }, stage: 'Confetti comes down over the fire pit.', turns: [['narrator', "From the start, these two were steady. The public loved them for it."], ['a', "Thank you, everyone. Thank you so much."], ['b', "I can't believe it's us."], ['c', "I can. Well done, both of you."]] },
    { id: 'fw.st2', when: { of: 'steady' }, stage: 'Fireworks go up over the villa.', turns: [['a', "I can't stop shaking."], ['b', "Me neither. We did it."], ['dior', "You did. Congratulations, you're this year's Perfect Match."], ['c', "Come here, you two."]], beat: '{c} and {d} hug them both, and the rest of the villa piles in.' },
  ],
  // The reunion (moments.js reunion): the welcome, the winners, the sign-off.
  'reunion-open': [
    { id: 'ru.o1', stage: 'A studio full of lights and a live audience. The islanders fill the sofas.', turns: [['dior', "Welcome to the Perfect Match reunion! Every islander from this season is here, and trust me, some of you are not going to enjoy tonight."]], beat: 'The audience cheers. A few islanders laugh nervously.' },
    { id: 'ru.o2', stage: 'The whole cast, together again for the first time since the villa.', turns: [['dior', "Good evening, and welcome back! We've got the couples, we've got the exes, and we've got the footage you never saw."]] },
  ],
  'reunion-winners': [
    { id: 'ru.w1', when: { of: 'together' }, turns: [['dior', "Let's start with our winners. {a}, {b}, how is life outside the villa?"], ['a', "Honestly? Better than in there. We don't have to share a bedroom with twenty people."], ['b', "Nineteen."]] },
    { id: 'ru.w2', when: { of: 'together' }, turns: [['dior', "{a} and {b}, our Perfect Match. Are you still going strong?"], ['b', "Stronger."], ['a', "We're looking at flats."]], beat: 'The studio cheers.' },
    { id: 'ru.w3', when: { of: 'apart' }, turns: [['dior', "{a}, {b}, our winners. I have to ask. How are things?"], ['a', "It's been a lot."], ['b', "We're taking it one day at a time."]], beat: 'The studio goes quiet for a second.' },
  ],
  'reunion-close': [
    { id: 'ru.c1', turns: [['dior', "That's all we have time for. Thank you to every one of our islanders, and to all of you for watching."], ['dior', "Goodnight, and see you in the villa next time."]] },
    { id: 'ru.c2', turns: [['dior', "What a season. Thank you for watching, and thank you to our islanders for letting us in. Goodnight!"]], beat: 'The whole studio is on its feet.' },
  ],
  // A recoupling's opening (moments.js recoupleBuildUp). `of` on the text is
  // who chooses (f · m); on the host's line, who chooses and the stake:
  // all (every single goes home) · risk (whoever is left single could go) ·
  // safe (whoever is left single stays, single and vulnerable).
  'recouple-text': [
    { id: 'rt.f1', when: { of: 'f' }, stage: "{a}'s phone goes off by the pool.", turns: [['a', "I got a text! Islanders, tonight there will be a recoupling. The girls will choose which boy they want to couple up with. #DecisionTime"], ['b', "Here we go again."]] },
    { id: 'rt.m1', when: { of: 'm' }, stage: "{a}'s phone goes off by the pool.", turns: [['a', "I got a text! Islanders, tonight there will be a recoupling. The boys will choose which girl they want to couple up with. #DecisionTime"], ['b', "Here we go again."]] },
    { id: 'rt.f2', when: { of: 'f' }, turns: [['a', "Islanders, please get ready for a recoupling. Tonight, the girls are choosing. #ChooseWisely"], ['b', "Why does my stomach hurt already?"]] },
    { id: 'rt.m2', when: { of: 'm' }, turns: [['a', "Islanders, please get ready for a recoupling. Tonight, the boys are choosing. #ChooseWisely"], ['b', "Why does my stomach hurt already?"]] },
    { id: 'rt.3', stage: 'Everyone crowds round {a} and the phone.', turns: [['a', "Islanders, it's time to recouple. Please gather at the fire pit. #WhoWillItBe"]], beat: 'Nobody looks at their partner.' },
  ],
  'recouple-nerves': [
    { id: 'rn.s1', when: { taken: false }, turns: [['a', "What if nobody picks me?"], ['b', "Somebody will."], ['a', "You don't know that."], ['b', "No. But I'd pick you, if it was me choosing."]] },
    { id: 'rn.s2', when: { taken: false }, stage: 'The dressing room. {a} has changed outfits three times.', turns: [['b', "You look amazing."], ['a', "I look single. That's what I look."]] },
    { id: 'rn.t1', when: { taken: true }, turns: [['a', "I don't know if {pa} is going to pick me tonight."], ['b', "Have you asked?"], ['a', "You can't ask. That's the whole point."]] },
    { id: 'rn.t2', when: { taken: true }, stage: '{a} is sitting on the edge of the daybed, dressed and ready, not moving.', turns: [['b', "Talk to me."], ['a', "I think tonight might be the night {pa} goes with someone else."]] },
  ],
  'recouple-open': [
    { id: 'ro.fr', when: { of: 'f-risk' }, stage: 'The islanders sit round the fire pit. The host walks down.', turns: [['dior', "Good evening, islanders! It's time for a recoupling."], ['dior', "Girls, one at a time, you'll stand up and tell us which boy you want to couple up with, and why."], ['dior', "Anyone left single at the end of tonight could be dumped from the island."]] },
    { id: 'ro.mr', when: { of: 'm-risk' }, stage: 'The islanders sit round the fire pit. The host walks down.', turns: [['dior', "Good evening, islanders! It's time for a recoupling."], ['dior', "Boys, one at a time, you'll stand up and tell us which girl you want to couple up with, and why."], ['dior', "Anyone left single at the end of tonight could be dumped from the island."]] },
    { id: 'ro.fs', when: { of: 'f-safe' }, stage: 'The islanders sit round the fire pit. The host walks down.', turns: [['dior', "Good evening, islanders! Tonight the girls are choosing."], ['dior', "One at a time, girls, tell us who you want to couple up with. Anyone left single tonight stays in the villa, but single, and very vulnerable."]] },
    { id: 'ro.ms', when: { of: 'm-safe' }, stage: 'The islanders sit round the fire pit. The host walks down.', turns: [['dior', "Good evening, islanders! Tonight the boys are choosing."], ['dior', "One at a time, boys, tell us who you want to couple up with. Anyone left single tonight stays in the villa, but single, and very vulnerable."]] },
    { id: 'ro.fa', when: { of: 'f-all' }, turns: [['dior', "Good evening, islanders. This is the final recoupling."], ['dior', "Girls, you'll choose who you want to couple up with. And anyone left single tonight will be dumped from the island. From here on, it's couples only."]], beat: 'Nobody on the benches moves.' },
    { id: 'ro.ma', when: { of: 'm-all' }, turns: [['dior', "Good evening, islanders. This is the final recoupling."], ['dior', "Boys, you'll choose who you want to couple up with. And anyone left single tonight will be dumped from the island. From here on, it's couples only."]], beat: 'Nobody on the benches moves.' },
  ],
  'recouple-single': [
    { id: 'rsg.1', stage: '{a} is the only one left standing.', turns: [['dior', "{a}, you're single tonight. You're not going anywhere, but you are very vulnerable."], ['a', "I'll take it. For now."]] },
    { id: 'rsg.2', stage: 'Every couple is on the bench, and {a} is standing alone.', turns: [['a', "Well. That's embarrassing."], ['dior', "You're staying, {a}. But you'll have to graft."]] },
  ],
  // Casa Amor opens (arrivals.js openCasa). `of` is the side that leaves.
  'casa-text': [
    { id: 'ct.f1', when: { of: 'f' }, stage: "{a}'s phone goes off in the dressing room.", turns: [['a', "Girls, pack your bags. You're going on a little trip. #CasaAmor"], ['b', "Casa. It's Casa. Oh my God, it's Casa."]] },
    { id: 'ct.m1', when: { of: 'm' }, stage: "{a}'s phone goes off on the terrace.", turns: [['a', "Boys, pack your bags. You're going on a little trip. #CasaAmor"], ['b', "Casa. It's Casa. Oh my God, it's Casa."]] },
    { id: 'ct.2', turns: [['a', "Islanders, it's time for Casa Amor. Some of you are leaving tonight. #PackYourBags"]], beat: 'The whole villa goes quiet.' },
  ],
  'casa-goodbye': [
    { id: 'cg.1', stage: '{a} and {b} hold on to each other by the gate.', turns: [['b', "Don't forget about me."], ['a', "As if I could."]] },
    { id: 'cg.2', turns: [['a', "Whatever happens over there, I'm coming back to you."], ['b', "Promise?"], ['a', "Promise."]], beat: '{b} watches the gate long after it shuts.' },
    { id: 'cg.3', stage: '{a} picks up a suitcase and turns back one last time.', turns: [['b', "Go. Before I don't let you."], ['a', "Behave yourself."], ['b', "You behave yourself."]] },
    { id: 'cg.4', turns: [['b', "Just be yourself over there. And not too much yourself."], ['a', "What does that mean?"], ['b', "You know what it means."]] },
  ],
  'casa-explain': [
    { id: 'ce.f', when: { of: 'f' }, turns: [['dior', "Islanders. The girls have gone to Casa Amor, a villa of their own, where new boys are waiting for them."], ['dior', "And here, new girls are about to walk in. For the next few days, every couple is tested. At the end of it, everyone chooses: stick with your partner, or twist and couple up with someone new."]] },
    { id: 'ce.m', when: { of: 'm' }, turns: [['dior', "Islanders. The boys have gone to Casa Amor, a villa of their own, where new girls are waiting for them."], ['dior', "And here, new boys are about to walk in. For the next few days, every couple is tested. At the end of it, everyone chooses: stick with your partner, or twist and couple up with someone new."]] },
  ],
  // A vote night with nobody to spare: the text, and the relief.
  'vote-safe': [
    { id: 'vs.01', stage: "{a}'s phone goes off at the fire pit.", turns: [['a', "Islanders, the public have been voting, and tonight, nobody will be dumped. #SafeForNow"], ['b', "Nobody? Say that again."]], beat: 'The whole villa cheers.' },
    { id: 'vs.02', turns: [['a', "I got a text! Islanders, the votes are in. You are all safe… for now. #EnjoyItWhileItLasts"], ['b', "For now. I hate 'for now'."]] },
    { id: 'vs.03', stage: 'Everyone gathers at the fire pit, holding hands, for a text that never comes to a dumping.', turns: [['a', "Islanders, the public have spoken, and tonight everybody stays. #BreatheOut"]], beat: 'Somebody lets out a breath.' },
    { id: 'vs.04', turns: [['a', "Islanders, tonight's results are in, and there will be no dumping. But the next one is closer than you think. #WatchThisSpace"], ['b', "Why do they always have to add the last bit?"]] },
  ],
  'dump-nerves': [
    { id: 'dn.01', stage: 'The dressing room. {a} is doing {a.posAdj} make-up slowly.', turns: [['b', "Are you scared?"], ['a', "Terrified. You?"], ['b', "I can't even think about it."]] },
    { id: 'dn.02', stage: '{a} and {b} sit on the edge of the bed, dressed and ready, and neither of them gets up.', turns: [['a', "Whatever happens down there, I'm glad it was you."], ['b', "Don't talk like we're going."]] },
    { id: 'dn.03', when: { channel: ['public', 'villa', 'top-couple', 'save'] }, turns: [['a', "Do you think the public like us?"], ['b', "I think they like you."], ['a', "That's not an answer."]] },
    { id: 'dn.04', stage: 'On the terrace, {a} holds {b.posAdj} hand a little too tight.', turns: [['b', "Breathe."], ['a', "I am breathing. I'm just breathing very fast."]] },
    { id: 'dn.05', turns: [['a', "I've got a bad feeling about tonight."], ['b', "You always have a bad feeling."], ['a', "And I'm always right."]] },
  ],
  'dump-open': [
    { id: 'do.pu1', when: pub('public'), stage: 'The islanders sit round the fire pit. The host walks in.', turns: [['dior', "Good evening, islanders!"], ['dior', "Over the last few days, the public have been voting for their favourite couple. The couple with the fewest votes will be dumped from the island tonight."], ['dior', "I'm going to read out the couples who are safe, one at a time."]] },
    { id: 'do.pu2', when: pub('public'), stage: 'Every couple on the benches holds hands as the host arrives.', turns: [['dior', "Good evening, everyone. The votes are in."], ['dior', "The couples the public have voted for the most are safe. The rest of you are at risk, and tonight the public alone decide who goes home."]] },
    { id: 'do.pd1', when: pub('public-double'), stage: 'The islanders sit round the fire pit. The host walks in.', turns: [['dior', "Good evening, islanders!"], ['dior', "The public have been voting for their favourite couple, and tonight, the two couples with the fewest votes will BOTH be dumped from the island."], ['dior', "I'll read out the couples who are safe first."]] },
    { id: 'do.si1', when: pub('singles'), stage: 'The islanders sit round the fire pit. The host walks in.', turns: [['dior', "Good evening, islanders!"], ['dior', "Tonight it's the single islanders who are at risk. The public have been voting for their favourite single, and the one with the fewest votes will be dumped from the island."]] },
    { id: 'do.os1', when: pub('one-stays'), stage: 'The host walks down to the fire pit.', turns: [['dior', "Good evening, islanders! Tonight is a little bit different."], ['dior', "The public have been voting for their favourite couple, and the couple with the fewest votes is at risk. But only one of them will be dumped."], ['dior', "Which one? That will be up to you. First, the couples who are safe."]] },
    { id: 'do.sp1', when: pub('safe-pick-couple'), stage: 'The host walks down to the fire pit.', turns: [['dior', "Good evening, islanders!"], ['dior', "The public have been voting for their favourite couple. The couples with the fewest votes are at risk of being dumped."], ['dior', "Then it will be down to the rest of you, the safe islanders, to vote which of those couples leaves the villa tonight. First: who is safe."]] },
    { id: 'do.sp2', when: pub('safe-pick-couple'), stage: 'The benches go silent as the host arrives.', turns: [['dior', "Hi, islanders. Here's how tonight works."], ['dior', "The public have been voting, and some of you are at risk. Once you know who, the safe islanders will vote, one by one, for the couple they want to dump."]] },
    { id: 'do.cg1', when: pub('cross-gender'), stage: 'The host walks down to the fire pit.', turns: [['dior', "Good evening, islanders!"], ['dior', "The public have been voting, and the couples with the fewest votes are at risk. But tonight, the girls will decide which of the boys at risk goes home, and the boys will decide which of the girls."], ['dior', "Let's find out who's safe."]] },
    { id: 'do.tc1', when: pub('top-couple'), stage: 'The host walks down to the fire pit.', turns: [['dior', "Good evening, islanders!"], ['dior', "The public have been voting for their favourite couple. The couples with the fewest votes are at risk."], ['dior', "And the couple with the MOST votes will decide which of those couples is dumped from the island. Let's start with who's safe."]] },
    { id: 'do.sv1', when: pub('save'), stage: 'The host walks down to the fire pit.', turns: [['dior', "Good evening, islanders!"], ['dior', "The public have been voting for their favourite islander, not their favourite couple. The ones with the fewest votes are at risk, on their own."], ['dior', "The other side will then vote to save one of them. Everyone who isn't saved will be dumped from the island."]] },
    { id: 'do.cv1', when: pub('couples'), stage: 'The host walks down to the fire pit.', turns: [['dior', "Good evening, islanders!"], ['dior', "Tonight, the vote is yours. Each couple will name the couple they think is the least compatible in the villa."], ['dior', "The couples with the most votes will be at risk, and the safe islanders will then decide who goes."]] },
    { id: 'do.ex1', when: pub('exes'), stage: 'The host walks down to the fire pit.', turns: [['dior', "Good evening, islanders!"], ['dior', "Tonight, you'll vote for the couples you think are the least compatible. The couples with the most votes will be at risk."], ['dior', "And the people deciding their fate won't be you. They'll be some familiar faces."]] },
  ],
  'dump-recap': [
    // The host goes back over what has happened since the last dumping, one
    // moment at a time, and asks about it (user: "talk about the last episode
    // before the last dumping, say what happened, stir the drama, that's her
    // job as a host"). `of`: the moment's kind; `ago`: today · yesterday · days;
    // `of: 'intro'` is her opening, with nobody named.
    { id: 'dr.in1', when: { of: 'intro' }, turns: [['dior', "Before we start, let's talk about what's been going on in here over the last few days."], ['dior', "Because a lot has been going on."]], beat: 'A few islanders look at each other.' },
    { id: 'dr.in2', when: { of: 'intro' }, turns: [['dior', "It's been a busy few days in the villa. I've been hearing all about it."]], beat: 'Nobody on the benches moves.' },
    { id: 'dr.in3', when: { of: 'intro' }, turns: [['dior', "Now, I know some of you have had quite a time since I was last here. Let's go through it."]] },

    { id: 'dr.st', when: { of: 'steal' }, turns: [['dior', "{b} and {c} were a couple the last time I was here. Now {b} is with {a}."], ['dior', "{c}, how are you feeling about that?"], ['c', "Honestly? Not great. But I'd rather know now."]], beat: "{a} doesn't look at {c}." },
    { id: 'dr.st2', when: { of: 'steal' }, turns: [['dior', "{b}, {c}, you were a couple the last time I was here. Now {b} is sitting next to {a}."], ['dior', "{b}, do you want to tell us what happened?"], ['b', "I followed my heart. I'm sorry it hurt {c}."], ['c', "You're not that sorry."]], beat: 'The benches go very quiet.' },
    { id: 'dr.st3', when: { of: 'steal' }, turns: [['dior', "{a}, you've already broken up a couple."], ['a', "I wanted {b}. I was honest about that from the start."], ['dior', "{c}, is that how you see it?"], ['c', "I see someone who didn't care who got hurt."]] },

    { id: 'dr.bl', when: { of: 'blowup', ago: 'today' }, turns: [['dior', "I hear things got a bit heated earlier. {a}, {b}, I think the whole villa heard you."], ['dior', "Are you two okay?"], ['a', "We're fine. We've talked about it."], ['b', "We're getting there."]], beat: "They don't sound like the same answer." },
    { id: 'dr.bl2', when: { of: 'blowup' }, turns: [['dior', "{a}, {b}. The two of you had the biggest row this villa has seen in days."], ['dior', "What was that about?"], ['a', "It was a bad day. We've both said sorry."], ['b', "I've said sorry. I'm still waiting to hear it back."]], beat: '{a} and {b} are sitting further apart than any other couple.' },
    { id: 'dr.bl3', when: { of: 'blowup' }, turns: [['dior', "{a}, {b}, the villa tells me you two were shouting at each other where everyone could hear."], ['dior', "Is that sorted, or is it still going on?"], ['b', "Ask {a}."], ['a', "It's sorted."]], beat: '{b} shakes {b.posAdj} head.' },
    { id: 'dr.bp', when: { of: 'blowup-apart', ago: 'today' }, turns: [['dior', "I hear things got heated today. {a}, {b}, the whole villa heard you."], ['dior', "{a}, what started it?"], ['a', "Ask {b}."], ['b', "I'm not the one who started shouting."]], beat: 'Somebody on the benches coughs.' },
    { id: 'dr.bp2', when: { of: 'blowup-apart' }, turns: [['dior', "{a} and {b}. The two of you have hardly said a kind word to each other in days."], ['dior', "Is there anything you want to say now, while everyone's here?"], ['b', "No. I think I said it all already."], ['a', "So did I."]], beat: 'The villa has picked sides, and it shows on the benches.' },
    { id: 'dr.bp3', when: { of: 'blowup-apart' }, turns: [['dior', "{a}, {b}, I'm told that row between you split the villa down the middle."], ['dior', "{b}, do you regret any of it?"], ['b', "Some of how I said it. Not what I said."], ['a', "That's not an apology."]] },

    { id: 'dr.ar', when: { of: 'argument', ago: 'today' }, turns: [['dior', "{a}, {b}, I hear you two had words today. I hope you've made up, because tonight you might need each other."], ['a', "We have."], ['dior', "{b}?"], ['b', "Mostly."]] },
    { id: 'dr.ar2', when: { of: 'argument' }, turns: [['dior', "{a}, {b}. You had words since I was last here. What about?"], ['a', "Nothing, really. It's done."], ['b', "It wasn't nothing."]], beat: '{a} turns to look at {b}, and {b} keeps looking at the host.' },
    { id: 'dr.ar3', when: { of: 'argument' }, turns: [['dior', "{a}, the villa tells me you and {b} haven't been getting on."], ['a', "We had one argument. Every couple does."], ['dior', "{b}, is it just the one?"], ['b', "It's the one everyone heard."]] },
    { id: 'dr.ap', when: { of: 'argument-apart' }, turns: [['dior', "{a}, {b}, I hear there were words between you two. I hope the air's been cleared."], ['a', "It's fine now."], ['b', "It's fine for tonight."]], beat: "{a} and {b} don't look at each other." },
    { id: 'dr.ap2', when: { of: 'argument-apart' }, turns: [['dior', "{a} and {b}. I hear you two have fallen out."], ['dior', "{a}, what happened?"], ['a', "We see things differently. That's all."], ['b', "That's one way of putting it."]] },

    { id: 'dr.sp', when: { of: 'photo-split' }, turns: [['dior', "{a}, {b}, I know it's been hard. You were a couple, and the photos changed that."], ['dior', "{a}, how are you doing?"], ['a', "I'm okay. I'm not going to pretend it didn't hurt."]], beat: '{b} looks at the floor.' },
    { id: 'dr.sp2', when: { of: 'photo-split' }, turns: [['dior', "{a}, {b}, those photos ended things between you."], ['dior', "{b}, is there anything you want to say to {a}?"], ['b', "Just sorry. I should have been honest before the photos were."], ['a', "Yes. You should have."]] },
    { id: 'dr.ms', when: { of: 'movie-split' }, turns: [['dior', "{a}, {b}, I know movie night was a hard thing to watch. I'm sorry."], ['dior', "{a}, have the two of you talked since?"], ['a', "A bit. It didn't go well."]], beat: '{b} nods.' },
    { id: 'dr.ms2', when: { of: 'movie-split' }, turns: [['dior', "{a}, {b}. One clip on movie night, and you're not a couple any more."], ['dior', "{b}, did you know what was coming?"], ['b', "I knew there might be something. I didn't think it would be that."], ['a', "Neither did I."]] },

    { id: 'dr.oa', when: { of: 'official-ask' }, turns: [['dior', "And I hear congratulations are in order. {a} and {b}, you're official!"], ['dior', "{b}, did you see it coming?"], ['b', "No. {a} kept it very quiet."], ['a', "I wanted it to be a surprise."]], beat: 'The villa cheers.' },
    { id: 'dr.oa2', when: { of: 'official-ask' }, turns: [['dior', "{a}, {b}, I hear you two have gone and made it official."], ['dior', "{a}, why now?"], ['a', "Because I'm sure. I didn't want to wait any longer."]], beat: '{b} squeezes {a.posAdj} hand, and a couple of the other islanders clap.' },
    { id: 'dr.ls', when: { of: 'love-said' }, turns: [['dior', "I hear the L word has been said in this villa. {a}, {b}, is that right?"], ['a', "It is."], ['dior', "{b}, how did that feel?"], ['b', "Like the best thing anyone's ever said to me."]], beat: '{b} goes bright red.' },
    { id: 'dr.ls2', when: { of: 'love-said' }, turns: [['dior', "{a}. I'm told you told {b} you love {b.obj}."], ['a', "I did. I meant it."], ['dior', "{b}, what did you make of it?"], ['b', "I'm still smiling about it."]], beat: 'A few islanders look at their own partners.' },

    { id: 'dr.en', when: { of: 'entrance', ago: 'today' }, turns: [['dior', "{a}, welcome to the villa. You've picked quite a night to arrive."], ['a', "Thank you. I think."]], beat: 'Nobody laughs.' },
    { id: 'dr.en2', when: { of: 'entrance', ago: ['yesterday', 'days'] }, turns: [['dior', "{a}, you've been here a little while now. Has anybody caught your eye?"], ['a', "Maybe. I'll let you know at the next recoupling."]], beat: 'Two couples on the benches move a little closer together.' },
    { id: 'dr.en3', when: { of: 'entrance' }, turns: [['dior', "{a}, how are you finding the villa so far?"], ['a', "Everyone's been lovely. Mostly."]], beat: 'A couple of islanders look away.' },

    { id: 'dr.ki', when: { of: 'kiss' }, turns: [['dior', "I've heard there's been some kissing in the villa. {a}, {b}, I'm looking at you."], ['a', "I don't know what you're talking about."], ['b', "Yes, you do."]], beat: 'Everybody laughs except {a} and {b}.' },
    { id: 'dr.ki2', when: { of: 'kiss' }, turns: [['dior', "{a}, {b}. The villa tells me the two of you can't keep your hands off each other."], ['b', "We're a couple. That's allowed."], ['dior', "It is. The villa just saw a lot of it."]], beat: 'The benches laugh.' },
  ],
  'dump-safe': [
    { id: 'ds.f1', when: { nth: 'first' }, turns: [['dior', "The first couple who are safe, and will stay in the villa tonight, is…"], ['dior', "…{a} and {b}."]], beat: '{a} and {b} let out a breath.' },
    { id: 'ds.f2', when: { nth: 'first' }, turns: [['dior', "The first couple safe tonight…"], ['dior', "…{a} and {b}."]], beat: '{b} hugs {a}.' },
    { id: 'ds.n1', when: { nth: 'next' }, turns: [['dior', "The next couple who are safe…"], ['dior', "…{a} and {b}."]] },
    { id: 'ds.n2', when: { nth: 'next' }, turns: [['dior', "Also safe tonight…"], ['dior', "…{a} and {b}."]], beat: '{a} closes {a.posAdj} eyes.' },
    { id: 'ds.n3', when: { nth: 'next' }, turns: [['dior', "Safe, and staying in the villa…"], ['dior', "…{a} and {b}."]] },
    { id: 'ds.l1', when: { nth: 'last' }, turns: [['dior', "And the final couple who are safe tonight is…"], ['dior', "…{a} and {b}."]], beat: 'Now everyone looks at who is left.' },
    { id: 'ds.l2', when: { nth: 'last' }, turns: [['dior', "The last couple who are safe…"], ['dior', "…{a} and {b}."]], beat: 'The benches go silent.' },
  ],
  'dump-buildup': [
    // A double dumping: said up front, then the couples named in turn.
    { id: 'dump-buildup.d1', when: { channel: 'public', going: 2, nth: 'first' },
      turns: [
        ['dior', "Which leaves two couples. The first of them, with the fewest votes of all, is…"],
        ['dior', "…{a} and {b}."],
      ],
      beat: '{a} and {b} stand up and walk to the front.' },
    { id: 'dump-buildup.d3', when: { channel: 'public', going: 2, nth: 'next' },
      turns: [['dior', "And the second couple is…"], ['dior', "…{a} and {b}."]],
      beat: '{a} lets out a breath and stands up.' },
    { id: 'dump-buildup.d4', when: { channel: 'public', going: 2, nth: 'next' },
      turns: [['dior', "The other couple with the fewest votes is {a} and {b}."]],
      beat: '{b} shuts {b.posAdj} eyes for a second.' },
    // Named after the safe couples: what is left standing.
    { id: 'db.f1', when: { channel: RANKED, nth: 'first' }, turns: [['dior', "Which means {a} and {b}, you are one of the couples at risk tonight."]], beat: '{a} and {b} stand up and walk to the front.' },
    { id: 'db.f2', when: { channel: RANKED, nth: 'first' }, turns: [['dior', "{a}. {b}. I'm sorry, but you received the fewest votes, and you are at risk."]], beat: '{b} takes {a.posAdj} hand.' },
    { id: 'db.n1', when: { channel: RANKED, nth: 'next' }, turns: [['dior', "And {a} and {b}, you are also at risk."]], beat: 'They stand beside the other couple, not looking at each other.' },
    { id: 'db.n2', when: { channel: RANKED, nth: 'next' }, turns: [['dior', "Also at risk tonight: {a} and {b}."]], beat: '{a} lets out a breath and stands up.' },
    { id: 'db.o1', when: { channel: RANKED, nth: 'only' }, turns: [['dior', "That leaves {a} and {b}."]], beat: 'Everybody else is looking at them now.' },
    { id: 'db.o2', when: { channel: RANKED, nth: 'only' }, turns: [['dior', "{a} and {b}. You are the only couple I haven't named."]], beat: '{b} grips {a.posAdj} hand.' },
    // Named by the villa, not the public.
    { id: 'db.c1', when: { channel: 'couples' }, turns: [['dior', "{a} and {b}. Your fellow islanders have voted you one of the least compatible couples in the villa, so you're at risk."]], beat: "{b} can't look at anyone." },
    { id: 'db.c2', when: { channel: 'couples' }, stage: 'The names are read out, and {a} and {b} stand up together.', turns: [['a', "I honestly didn't see that coming."], ['b', 'Me neither.']] },
    { id: 'db.e1', when: { channel: 'exes' }, turns: [['dior', "{a} and {b}. The islanders have voted you one of the least compatible couples, so you're at risk of being dumped."]] },
  ],
  'dump-plea': [
    { id: 'dpl.c1', when: pub('couple'), stage: '{a} and {b} stand at the front, holding hands.', turns: [['a', "We've come such a long way. Please, give us the chance to keep going."]] },
    { id: 'dpl.c2', when: pub('couple'), turns: [['b', "I know we're not the loudest couple in here, but what we've got is real."], ['a', "It really is."]] },
    { id: 'dpl.c3', when: pub('couple'), turns: [['a', "Whatever you decide, I just want to say I love every one of you."], ['b', "Mostly."]], beat: 'A nervous laugh goes round the benches.' },
    { id: 'dpl.c4', when: pub('couple'), turns: [['b', "I came in here to find someone, and I found them. Please don't send us home yet."]] },
    { id: 'dpl.o1', when: { of: 'one', taken: false }, turns: [['a', "I haven't found my person yet. I just need a bit more time."]] },
    { id: 'dpl.o3', when: { of: 'one', taken: false }, turns: [['a', "I know I'm single, and I know how that looks. But I haven't stopped trying."]] },
    { id: 'dpl.o4', when: { of: 'one', taken: true }, turns: [['a', "{pa} and I are only just getting started. Please don't make that the end of it."]] },
    { id: 'dpl.o5', when: { of: 'one', taken: true }, stage: '{a} looks straight at {pa} on the bench.', turns: [['a', "I've got something real with {pa}. I want the chance to see where it goes."]] },
    { id: 'dpl.o6', when: { of: 'one', taken: true }, turns: [['a', "I'm not ready to leave {pa}. That's all I've got."]] },
    { id: 'dpl.o2', when: pub('one'), stage: '{a} stands at the front, alone.', turns: [['a', "I've given this villa everything. I'd really love to stay."]] },
    { id: 'dpl.o7', when: pub('one'), turns: [['a', "Whatever you decide, thank you. I mean it. You've all been amazing."]] },
  ],
  'dump-decide': [
    { id: 'dd.sp', when: pub('safe-pick-couple'), turns: [['dior', "Safe islanders, it's time. One at a time, please stand up, tell us which of these couples you want to dump, and why."]] },
    { id: 'dd.os', when: pub('one-stays'), turns: [['dior', "Islanders, one of them stays and one of them goes. One at a time, tell us who you want to dump, and why."]] },
    { id: 'dd.cg', when: pub('cross-gender'), turns: [['dior', "Girls, you'll vote for the boy you want to dump. Boys, the girl. One at a time, please."]] },
    { id: 'dd.tc', when: pub('top-couple'), turns: [['dior', "Our favourite couple, the public's top couple: it's your decision now. Take a moment, talk it over, and tell us which couple you want to dump."]] },
    { id: 'dd.sv', when: pub('save'), turns: [['dior', "It's time to vote. One at a time, tell us which islander you want to save, and why. Whoever has the most votes stays."]] },
    { id: 'dd.cv', when: pub('couples'), turns: [['dior', "Safe islanders, it's over to you. Which of these couples do you want to dump? One at a time, please."]] },
    { id: 'dd.ex', when: pub('exes'), turns: [['dior', "These couples are at risk. And now, the people who will decide their fate…"]], beat: 'Every head turns to the villa doors.' },
  ],
};

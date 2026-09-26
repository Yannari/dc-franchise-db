// pm/lines/firepit.js — the night before a dumping's verdict (pm/moments.js
// fireBuildUp). Data only.
//
//   dump-text       [a, b]   the text that there is a dumping tonight. `of`: the format
//   dump-nerves     [a, b]   a couple waiting to go down to the fire pit
//   dump-open       []       the host arrives and says exactly how tonight works. `of`: the format
//   dump-recap      [a, b, c] the host on the day's biggest moment. `of`: its kind
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
    { id: 'fo.1', stage: 'The four couples stand at the fire pit, hand in hand, for the last time.', turns: [['dior', "Islanders, this is it. The final."], ['dior', "The public have been voting for the couple they want to crown their Perfect Match. I have the results here, and I'll read them out from fourth place."]], beat: 'Somebody on the end is shaking.' },
    { id: 'fo.2', stage: 'The villa is lit up for the last night. The couples stand in a line, holding on to each other.', turns: [['dior', "Good evening, and welcome to the final."], ['dior', "Over the last few days, the public have been deciding who wins. Only one couple can take the title."]] },
    { id: 'fo.e', when: { of: 'envelope' }, stage: 'The four couples stand at the fire pit, hand in hand.', turns: [['dior', "Islanders, the public have voted, and tonight one couple will be crowned the winners."], ['dior', "And the winners will face one last decision, in an envelope."]], beat: 'Every couple squeezes hands a little tighter.' },
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
    { id: 'dr.st', when: pub('steal'), turns: [['dior', "It's been quite a day. {a} walked in, and {b} and {c} are not a couple any more."]] },
    { id: 'dr.bl', when: pub('blowup'), turns: [['dior', "I hear things got a bit heated earlier. {a}, {b}, I think the whole villa heard you."]], beat: '{a} looks at the floor.' },
    { id: 'dr.ar', when: pub('argument'), turns: [['dior', "{a}, {b}, I hear you two had words today. I hope you've made up, because tonight you might need each other."]] },
    { id: 'dr.ap', when: pub('argument-apart'), turns: [['dior', "{a}, {b}, I hear there were words between you two today. I hope the air's been cleared."]], beat: "{a} and {b} don't look at each other." },
    { id: 'dr.bp', when: pub('blowup-apart'), turns: [['dior', "I hear things got heated today. {a}, {b}, the whole villa heard you."]], beat: 'Somebody on the benches coughs.' },
    { id: 'dr.sp', when: pub('photo-split'), turns: [['dior', "{a}, {b}, I know it's been a hard day. I'm sorry."]] },
    { id: 'dr.ms', when: pub('movie-split'), turns: [['dior', "{a}, {b}, I know that was a hard thing to watch. I'm sorry."]] },
    { id: 'dr.oa', when: pub('official-ask'), turns: [['dior', "And I hear congratulations are in order. {a} and {b}, you're official!"]], beat: 'The villa cheers.' },
    { id: 'dr.ls', when: pub('love-said'), turns: [['dior', "I hear the L word has been said in this villa. {a}, {b}, is that right?"]], beat: '{b} goes bright red.' },
    { id: 'dr.en', when: pub('entrance'), turns: [['dior', "{a}, welcome to the villa. You've picked quite a night to arrive."]] },
    { id: 'dr.ki', when: pub('kiss'), turns: [['dior', "I've heard there's been some kissing in the villa today. {a}, {b}, I'm looking at you."]], beat: 'Everybody laughs except {a} and {b}.' },
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

// ══════════════════════════════════════════════════════════════════════
// td/story/lines/n-arrival.js — episode one's arrivals
// ══════════════════════════════════════════════════════════════════════
//
// td/story/arrival.js writes each arrival from these. Parts: a (the one arriving), h (the host),
// b (someone already waiting, in arrive.meet). {landing} is where they step off ("the dock",
// "the beach"...). Facts: arch, returnee, returneeB (b came back too), strong/brainy/bold/charm/
// hot/calm (a's standout stat), age, hist (arrive.meet.history: what a and b were before).
//   arrive.host.<archetype>  the host introduces a (one or two lines, h only)
//   arrive.new.<archetype>   a first-timer's entrance: a and h
//   arrive.back.<archetype>  a returnee's entrance: a and h
//   arrive.meet.history.<hist>  a and b knew each other before ({kinWord}, {where})
//   arrive.meet.<fan|fan-of-them>  b, a first-timer, recognises returnee a / a recognises returnee b
//   arrive.meet.<chemistry>  tension, sizing-up, intimidation, attraction, dread, rivalry,
//                            predatory, encouragement, recognition, curiosity
// Ids: 'np.'.

const H = (id, when, line, v) => ({ id, ...(when ? { when } : {}), turns: [{ by: 'h', say: line, ...(v ? { v } : {}) }] });

const POOLS = {
  // ── the host's introduction ──
  'arrive.host.villain': [
    H('np.hv1', null, "Watch your backs, everybody. {a} just arrived."),
    H('np.hv2', null, "Here's {a}. I've read the application. I'm a little scared."),
    H('np.hv3', null, "Everybody, meet {a}. Don't turn your back on {a.obj}. I'm serious."),
  ],
  'arrive.host.mastermind': [
    H('np.hm1', null, "Here's {a}. I give it about ten minutes before {a} has a plan for every one of you."),
    H('np.hm2', null, "Next up, {a}. Smart, patient, and already counting votes. Welcome!"),
  ],
  'arrive.host.schemer': [
    H('np.hs1', null, "Give it up for {a}! Smile, wave, and keep an eye on your stuff."),
    H('np.hs2', null, "And here's {a}, who told our producers {a} is 'just here to make friends'. Sure."),
  ],
  'arrive.host.hothead': [
    H('np.hh1', null, "Here comes {a}! Somebody tell {a} the dock is not a fight. Yet."),
    H('np.hh2', null, "Everybody, this is {a}. Try not to make {a.obj} mad on the first day."),
  ],
  'arrive.host.challenge-beast': [
    H('np.hc1', null, "Here's {a}, who trained for this. Like, actually trained. Weird."),
    H('np.hc2', null, "And {a}! Look at the arms on this one. Every team is going to want {a.obj}."),
  ],
  'arrive.host.social-butterfly': [
    H('np.hb1', null, "Here's {a}! And {a} is already waving at people {a} hasn't met."),
    H('np.hb2', null, "Everybody, this is {a}. In about an hour {a} will be friends with all of you."),
  ],
  'arrive.host.loyal-soldier': [
    H('np.hl1', null, "Here's {a}. Reliable, hardworking, and way too nice for this show."),
    H('np.hl2', null, "Welcome {a}! The kind of person who'd take a bullet for a teammate. We'll test that."),
  ],
  'arrive.host.wildcard': [
    H('np.hw1', null, "Here's {a}. I have no idea what {a} is going to do. Neither does {a}."),
    H('np.hw2', null, "Everybody, meet {a}! Our producers wrote 'unpredictable' and then just a question mark."),
  ],
  'arrive.host.chaos-agent': [
    H('np.hx1', null, "And here's {a}. Our insurance company asked us not to cast {a}. We did anyway."),
    H('np.hx2', null, "Everybody, this is {a}. Hide anything flammable."),
  ],
  'arrive.host.floater': [
    H('np.hf1', null, "Here's {a}! You might not notice {a} at first. That's kind of the point."),
    H('np.hf2', null, "Next up, {a}! Easygoing, laid back, and very hard to vote out. Probably."),
  ],
  'arrive.host.underdog': [
    H('np.hu1', null, "Here's {a}! Nobody picked {a} to win. That's what makes it fun."),
    H('np.hu2', null, "Everybody, meet {a}! First time on a show like this, and it shows. In a good way."),
  ],
  'arrive.host.hero': [
    H('np.hr1', null, "Give it up for {a}! Finally, somebody the audience can actually root for."),
    H('np.hr2', null, "Here's {a}. Honest, brave, and about to find out what this place does to honest people."),
  ],
  'arrive.host.goat': [
    H('np.hg1', null, "Here's {a}! {a} is very excited to be here. Very excited. Too excited."),
    H('np.hg2', null, "Everybody, this is {a}. Be nice. Or don't. It's a game show."),
  ],
  'arrive.host.perceptive-player': [
    H('np.hp1', null, "Here's {a}, who's already watching every one of you. Don't mind {a.obj}."),
    H('np.hp2', null, "Everybody, meet {a}. Notices everything. Says almost nothing. Creepy. I love it."),
  ],
  'arrive.host.showmancer': [
    H('np.hn1', null, "Here's {a}! Fair warning, everybody: {a} is not just here for the money."),
    H('np.hn2', null, "And {a}! Somebody's going to fall for {a} this season. Maybe several somebodies."),
  ],
  'arrive.host.any': [
    H('np.ha1', null, "Next, {a}! Welcome to the show!"),
    H('np.ha2', null, "Everybody, this is {a}."),
    H('np.ha3', { strong: true }, "Here's {a}, who looks like {a} could carry half of you across a finish line."),
    H('np.ha4', { brainy: true }, "Here's {a}. Possibly the smartest person on this {landing}. Don't let it go to your head."),
    H('np.ha5', { bold: true }, "And {a}! Doesn't do subtle. Doesn't do quiet. Doesn't really do 'no'."),
    H('np.ha6', { charm: true }, "Here's {a}, and half of you already like {a.obj}. I can see it."),
    H('np.ha7', { hot: true }, "Here's {a}. Short fuse. Long memory. Welcome!"),
    H('np.ha8', { calm: true }, "Here's {a}, the calmest person I've ever put on this show. We'll fix that."),
    H('np.ha9', { age: 'teen' }, "Here's {a}! Youngest-looking person on {landing}, and I bet {a} doesn't care."),
    H('np.ha10', { age: 'older' }, "And {a}! Bringing some actual life experience to the show. Good luck with that."),
  ],

  // ── a first-timer's entrance ──
  'arrive.new.villain': [
    { id: 'np.nv1', turns: [
      { by: 'a', say: "Cute place. It's very... rustic.", v: { cruel: "So this is it? I've seen nicer garbage dumps." } },
      { by: 'h', say: "Glad you like it!" },
      { by: 'a', say: "I didn't say I liked it." },
      { by: 'a', conf: "I'm going to be honest, because nobody else here will be. I'm here to win. And I'll do whatever it takes." },
    ] },
    { id: 'np.nv2', turns: [
      { by: 'a', say: "So these are the other players?" },
      { by: 'h', say: "Your competition, yep." },
      { by: 'a', say: "Huh, okay, I was worried for nothing then." },
    ] },
  ],
  'arrive.new.mastermind': [
    { id: 'np.nm1', turns: [
      { by: 'a', say: "Hi. Nice to meet you." },
      { beat: "{a} shakes {host}'s hand and looks past it, at everyone already on {landing}." },
      { by: 'a', conf: "Two of them are already together. One is talking way too much. One is pretending not to be nervous. I've been here thirty seconds." },
    ] },
    { id: 'np.nm2', turns: [
      { by: 'h', say: "Any big strategy, {a}?" },
      { by: 'a', say: "Strategy? Me? No, I'm just happy to be here." },
      { by: 'a', conf: "Rule one: never tell the host your strategy. The host tells everybody." },
    ] },
  ],
  'arrive.new.schemer': [
    { id: 'np.ns1', turns: [
      { by: 'a', say: "Oh my gosh, hi everybody! I'm so excited!" },
      { by: 'h', say: "That's the spirit!" },
      { by: 'a', conf: "First impressions are everything, so I'm going to be nice and fun and nobody's problem, and then later I'll be everybody's problem." },
    ] },
    { id: 'np.ns2', turns: [
      { by: 'a', say: "Is it okay if I just stand at the back? I'm a little shy." },
      { by: 'h', say: "Sure. Whatever you want." },
      { by: 'a', conf: "I'm not shy. But shy people don't get voted out first." },
    ] },
  ],
  'arrive.new.hothead': [
    { id: 'np.nh1', turns: [
      { by: 'a', say: "Is this the place? This is the place?" },
      { by: 'h', say: "Welcome home!" },
      { by: 'a', say: "You said there'd be cabins! Real ones!", v: { tough: "That's not a cabin. That's a shed with feelings." } },
      { by: 'h', say: "I said there'd be shelter. That's shelter." },
      { by: 'a', move: 'angry' },
    ] },
    { id: 'np.nh2', turns: [
      { by: 'a', say: "Let's go! Where's the first challenge?" },
      { by: 'h', say: "Slow down. You just got here." },
      { by: 'a', say: "I don't do slow." },
      { by: 'a', conf: "People say I've got a temper, but I just call it energy." },
    ] },
  ],
  'arrive.new.challenge-beast': [
    { id: 'np.nc1', turns: [
      { by: 'a', say: "So when do we start?" },
      { by: 'h', say: "You just got here." },
      { by: 'a', say: "Right. So when do we start?" },
      { by: 'a', conf: "I've been training for months. Running, swimming, holding my breath. I'm ready for anything this show throws at me." },
    ] },
    { id: 'np.nc2', turns: [
      { beat: "{a} jumps off before the ride has even stopped and lands on {landing} like it's a finish line." },
      { by: 'h', say: "Show-off." },
      { by: 'a', say: "Just warming up." },
    ] },
  ],
  'arrive.new.social-butterfly': [
    { id: 'np.nb1', turns: [
      { by: 'a', say: "Hi, hi, hi everybody! Oh my gosh, I love your shoes!" },
      { by: 'h', say: "Okay, okay. Save some for the others." },
      { by: 'a', say: "There's plenty to go around!" },
      { by: 'a', conf: "I'm going to know everybody's name by dinner. Everybody's name, and their favourite food, and their biggest fear. Just, you know, as friends." },
    ] },
    { id: 'np.nb2', turns: [
      { by: 'a', say: "Hey, I'm {a}, and I'm a hugger, so is everybody okay with hugs?" },
      { by: 'h', say: "I'm not." },
      { by: 'a', say: "That's okay. I'll hug you later." },
    ] },
  ],
  'arrive.new.loyal-soldier': [
    { id: 'np.nl1', turns: [
      { by: 'a', say: "Hey. Thanks for having me." },
      { by: 'h', say: "Polite! I like that. It won't last, but I like it." },
      { by: 'a', say: "We'll see." },
      { by: 'a', conf: "My plan is simple. Find good people, stick with them, and never be the one who lets them down." },
    ] },
    { id: 'np.nl2', turns: [
      { by: 'a', say: "Does anybody need help with anything? Bags, anything?" },
      { by: 'h', say: "You're a contestant. You don't carry bags." },
      { by: 'a', say: "Oh, right, sorry, it's a habit." },
    ] },
  ],
  'arrive.new.wildcard': [
    { id: 'np.nw1', turns: [
      { by: 'a', say: "Is that a raccoon? I'm going to name it." },
      { by: 'h', say: "Please don't touch the wildlife." },
      { by: 'a', say: "Too late. Its name is Gerald." },
      { by: 'a', conf: "People keep asking what my strategy is. My strategy is Gerald." },
    ] },
    { id: 'np.nw2', turns: [
      { by: 'a', say: "Hello! I'm {a}, and I'm either going to win or lose spectacularly, there's no in between." },
      { by: 'h', say: "That's... a plan." },
      { by: 'a', say: "Is it? Great!" },
    ] },
  ],
  'arrive.new.chaos-agent': [
    { id: 'np.nx1', turns: [
      { beat: "{a} steps off and immediately knocks something over." },
      { by: 'a', say: "Was that important?" },
      { by: 'h', say: "It was a sign." },
      { by: 'a', say: "A sign of what?" },
      { by: 'h', say: "That we're in trouble." },
      { by: 'a', conf: "I'm going to make this season unforgettable, for good reasons and bad reasons, but mostly bad ones, because those are more fun." },
    ] },
    { id: 'np.nx2', turns: [
      { by: 'a', say: "Quick question. Are there any rules about fire?" },
      { by: 'h', say: "Why?" },
      { by: 'a', say: "No reason!" },
    ] },
  ],
  'arrive.new.floater': [
    { id: 'np.nf1', turns: [
      { by: 'a', say: "Hey. Cool place." },
      { by: 'h', say: "That's it? 'Cool place'?" },
      { by: 'a', say: "Yeah. Cool place." },
      { by: 'a', conf: "The loud ones go home first and the scary ones go home second, so I'm just going to be neither." },
    ] },
    { id: 'np.nf2', turns: [
      { beat: "{a} steps off and quietly finds a spot at the back of the group." },
      { by: 'h', say: "Hey! {a}! Say hi!" },
      { by: 'a', say: "Hi." },
      { by: 'h', say: "Riveting." },
    ] },
  ],
  'arrive.new.underdog': [
    { id: 'np.nu1', turns: [
      { by: 'a', say: "Wow, I'm actually here, I'm actually on the show." },
      { by: 'h', say: "You actually are." },
      { by: 'a', say: "My friends back home are never going to believe this." },
      { by: 'a', conf: "Everybody here looks stronger and cooler than me, which is good, because I want them to think that." },
    ] },
    { id: 'np.nu2', turns: [
      { beat: "{a} trips stepping onto {landing} and catches {a.ref} just in time." },
      { by: 'a', say: "I meant to do that." },
      { by: 'h', say: "Sure you did." },
      { by: 'a', conf: "Not the entrance I practised. I'll be better at everything else." },
    ] },
  ],
  'arrive.new.hero': [
    { id: 'np.nr1', turns: [
      { by: 'a', say: "Hey, everybody! This is going to be great." },
      { by: 'h', say: "Ready to compete?" },
      { by: 'a', say: "Ready to compete, and do it the right way." },
      { by: 'h', say: "Oh, that's adorable." },
      { by: 'a', conf: "I know people think nice guys finish last here. I'm going to prove them wrong." },
    ] },
    { id: 'np.nr2', turns: [
      { by: 'a', say: "Anybody need a hand? That bag looks heavy." },
      { by: 'h', say: "Look at this! Helping people on day one!" },
      { by: 'a', say: "It's just a bag." },
    ] },
  ],
  'arrive.new.goat': [
    { id: 'np.ng1', turns: [
      { by: 'a', say: "Oh my gosh, it's YOU! From the TV!" },
      { by: 'h', say: "It is me. From the TV." },
      { by: 'a', say: "Can I get a picture? Wait, I don't have my phone... can I get a picture later?" },
      { by: 'h', say: "No." },
      { by: 'a', conf: "I'm going to make so many friends here, because everybody seems so nice, especially the scary ones." },
    ] },
    { id: 'np.ng2', turns: [
      { by: 'a', say: "Is this where we sleep, outside? That's so fun!" },
      { by: 'h', say: "You'll change your mind tonight." },
      { by: 'a', say: "No way!" },
    ] },
  ],
  'arrive.new.perceptive-player': [
    { id: 'np.np1', turns: [
      { by: 'h', say: "Not much of a talker, {a}?" },
      { by: 'a', say: "I talk. I just listen first." },
      { by: 'a', conf: "Everybody's first five minutes tells you who they are. I'm not wasting mine talking." },
    ] },
  ],
  'arrive.new.showmancer': [
    { id: 'np.nn1', turns: [
      { by: 'a', say: "Hey everyone." },
      { beat: "{a} smiles at somebody on {landing}. Somebody smiles back." },
      { by: 'h', say: "Ten seconds. That's a record." },
      { by: 'a', say: "What? I said hey." },
      { by: 'a', conf: "I'm here to win. If I happen to meet somebody along the way, that's just a bonus." },
    ] },
  ],
  'arrive.new.any': [
    { id: 'np.na1', turns: [
      { by: 'a', say: "Hi! Wow, okay, this is real." },
      { by: 'h', say: "Very real. Welcome!" },
      { by: 'a', conf: "I've watched this show for years, so being here is weird. Good weird, mostly." },
    ] },
    { id: 'np.na2', turns: [
      { by: 'a', say: "So where do we sleep?" },
      { by: 'h', say: "Somewhere. You'll see." },
      { by: 'a', say: "That's not reassuring." },
      { by: 'h', say: "It's not supposed to be." },
    ] },
    { id: 'np.na3', when: { strong: true }, turns: [
      { by: 'a', say: "Where do you want this?" },
      { beat: "{a} is carrying {a.posAdj} bag and somebody else's. Easily." },
      { by: 'h', say: "Anywhere. Show-off." },
      { by: 'a', conf: "I'm strong and everybody can see that, which is good for challenges but bad for votes, so I need to make friends fast." },
    ] },
    { id: 'np.na4', when: { brainy: true }, turns: [
      { by: 'a', say: "Interesting. How many of us are there?" },
      { by: 'h', say: "You'll find out." },
      { by: 'a', say: "Even or odd matters for the teams, you know." },
      { by: 'h', say: "I didn't know, and I don't care." },
      { by: 'a', conf: "Everybody's looking at the scenery and I'm looking at the people, because the scenery isn't going to vote me out." },
    ] },
    { id: 'np.na5', when: { hot: true }, turns: [
      { by: 'a', say: "Who's in charge here? You?" },
      { by: 'h', say: "Me." },
      { by: 'a', say: "Then you're the one I complain to." },
      { by: 'h', say: "Please don't." },
    ] },
    { id: 'np.na6', when: { calm: true }, turns: [
      { by: 'a', say: "Nice day for it." },
      { by: 'h', say: "You're not nervous at all, are you?" },
      { by: 'a', say: "Should I be?" },
      { by: 'h', say: "Very." },
      { by: 'a', conf: "Everybody else is freaking out, and someone has to stay calm, so it might as well be me." },
    ] },
    { id: 'np.na7', when: { age: 'teen' }, turns: [
      { by: 'a', say: "This is so sick! Wait, is that the camp? That's the camp?" },
      { by: 'h', say: "That's the camp." },
      { by: 'a', say: "My mom is going to freak out when she sees this." },
    ] },
    { id: 'np.na8', when: { age: 'older' }, turns: [
      { by: 'a', say: "Hello, everyone, I'm {a}, and I think I'm a little older than most of you." },
      { by: 'h', say: "Just a little." },
      { by: 'a', say: "Don't worry. I'll keep up." },
      { by: 'a', conf: "They're all looking at me like I'm somebody's parent, which is fine, because parents always know when you're lying." },
    ] },
    { id: 'np.na9', when: { charm: true }, turns: [
      { by: 'a', say: "Hey! You must be the famous host." },
      { by: 'h', say: "Flattery. I like it." },
      { by: 'a', say: "I'm not flattering. Well, a little." },
      { by: 'a', conf: "If the host likes you, you get better edits. Everybody knows that." },
    ] },
    { id: 'np.na10', when: { bold: true }, turns: [
      { by: 'a', say: "So who here is the competition? Raise your hand." },
      { beat: "Nobody raises a hand." },
      { by: 'a', say: "Great. Then it's me." },
      { by: 'h', say: "Making friends already!" },
    ] },
  ],

  // ── a returnee comes back ──
  'arrive.back.any': [
    { id: 'np.ba1', turns: [
      { by: 'h', say: "Look who's back! {a}, how does it feel?" },
      { by: 'a', say: "Weird, but good weird, because I swore I'd never do this again." },
      { by: 'h', say: "They all say that." },
      { by: 'a', conf: "Last time I learned how this place works. This time I'm going to use it." },
    ] },
    { id: 'np.ba2', turns: [
      { by: 'a', say: "Back on {landing}. Same smell." },
      { by: 'h', say: "Missed it?" },
      { by: 'a', say: "Not even a little." },
      { by: 'a', conf: "Everybody new is looking at me like I'm famous, but I'm not famous, I'm a target." },
    ] },
    { id: 'np.ba3', when: { arch: ['villain', 'schemer', 'mastermind'] }, turns: [
      { by: 'h', say: "The audience did not want you back, {a}. Just so you know." },
      { by: 'a', say: "And yet, here I am." },
      { by: 'h', say: "And yet, here you are." },
      { by: 'a', conf: "Last time they didn't see me coming. This time they will. That just means I have to be better." },
    ] },
    { id: 'np.ba4', when: { arch: ['hero', 'loyal-soldier', 'underdog', 'social-butterfly'] }, turns: [
      { by: 'a', say: "Hey, everybody! I'm back!" },
      { by: 'h', say: "And the fans love {a}. Don't they?" },
      { by: 'a', say: "I hope so. I've got unfinished business." },
      { by: 'a', conf: "Last time I trusted the wrong people, and I'm still going to trust people, just better ones this time." },
    ] },
    { id: 'np.ba5', when: { arch: ['hothead', 'challenge-beast', 'chaos-agent'] }, turns: [
      { by: 'a', say: "I'm back, and I'm not going home early this time." },
      { by: 'h', say: "Lot of confidence for someone who went home early last time." },
      { by: 'a', say: "Exactly. That's why." },
      { by: 'a', conf: "I've had a long time to think about how I went out. I'm not doing that again." },
    ] },
    { id: 'np.ba6', when: { arch: ['floater', 'goat', 'wildcard', 'perceptive-player', 'showmancer'] }, turns: [
      { by: 'h', say: "{a}! Nobody expected you back." },
      { by: 'a', say: "Including me." },
      { by: 'h', say: "So why come back?" },
      { by: 'a', say: "Because last time nobody saw me coming. I want to find out if that works twice." },
    ] },
    { id: 'np.ba7', when: { voice: ['loud', 'theatrical', 'proud'] }, turns: [
      { by: 'a', say: "Did you miss me? Say you missed me." },
      { by: 'h', say: "I missed you." },
      { by: 'a', say: "I KNEW it!" },
      { by: 'a', conf: "I'm back, and I'm louder than ever. Somebody has to keep this show interesting." },
    ] },
    { id: 'np.ba8', when: { voice: ['calm', 'dry', 'schemer'] }, turns: [
      { by: 'a', say: "Hi. It's been a while." },
      { by: 'h', say: "Ready to do it all again?" },
      { by: 'a', say: "Ready to do it better." },
      { by: 'a', conf: "The new players don't know me, but the old ones do, and they're my real problem." },
    ] },
    { id: 'np.ba9', when: { voice: ['warm', 'anxious', 'emotional', 'earnest'] }, turns: [
      { by: 'a', say: "Oh wow, I'm shaking, is that normal?" },
      { by: 'h', say: "For you? Yes." },
      { by: 'a', say: "I can't believe they asked me back." },
      { by: 'a', conf: "I cried for a week after I went home last time. This time I want to cry because I won." },
    ] },
    { id: 'np.ba10', when: { voice: ['competitive', 'tough', 'bossy'] }, turns: [
      { by: 'a', say: "Where's the first challenge? Let's go." },
      { by: 'h', say: "Some things never change." },
      { by: 'a', say: "Some things shouldn't." },
    ] },
  ],

  // ── someone they already know ──
  'arrive.meet.history.siblings': [
    { id: 'np.ms1', turns: [
      { beat: "{a} steps off and sees {b} already waiting." },
      { by: 'a', say: "No, no way, are you serious?" },
      { by: 'b', say: "Surprise." },
      { by: 'a', say: "You told me you weren't applying!" },
      { by: 'b', say: "I lied, but I'm your {kinWord}, so I'm allowed to lie to you." },
      { by: 'a', conf: "I came here to get away from my family for a few weeks. My family came too." },
    ] },
  ],
  'arrive.meet.history.family': [
    { id: 'np.mf1', turns: [
      { by: 'a', say: "{b}? What are you doing here?" },
      { by: 'b', say: "Same thing as you, apparently." },
      { by: 'a', say: "My {kinWord}, on the same show as me. This is going to be so weird." },
      { by: 'b', conf: "Everybody's going to think we're a team, and maybe we are, we'll see." },
    ] },
  ],
  'arrive.meet.history.cousins': [
    { id: 'np.mc1', turns: [
      { by: 'b', say: "Oh, you've got to be kidding me." },
      { by: 'a', say: "Hey, {kinWord}!" },
      { by: 'b', say: "Don't call me that in front of people." },
      { by: 'a', conf: "{b} and I have been competing since we were kids. Birthday parties, board games, everything. This is just the biggest one yet." },
    ] },
  ],
  'arrive.meet.history.couple': [
    { id: 'np.mk1', turns: [
      { beat: "{a} sees {b} on {landing} and runs straight over." },
      { by: 'b', say: "You made it!" },
      { by: 'a', say: "We made it!" },
      { beat: "They hug. Everybody else watches, doing the maths." },
      { by: 'b', conf: "We decided to apply together. We knew we'd be a target. We decided we'd rather be a target together." },
    ] },
  ],
  'arrive.meet.history.friends': [
    { id: 'np.mr1', turns: [
      { by: 'a', say: "{b}! You actually did it!" },
      { by: 'b', say: "I told you I would!" },
      { by: 'a', say: "Okay, rule one. Nobody here finds out we know each other." },
      { by: 'b', say: "You just yelled my name across {landing}." },
      { by: 'a', say: "...Rule one starts now." },
    ] },
  ],
  'arrive.meet.history.knew': [
    { id: 'np.mn1', turns: [
      { by: 'b', say: "Wait. Don't I know you?" },
      { by: 'a', say: "Oh my gosh, yes, hi!" },
      { by: 'b', say: "Small world." },
      { by: 'a', say: "Very small. Smaller than I'd like." },
      { by: 'a', conf: "I know {b} a little from back home. Not well. Well enough that it's going to be weird." },
    ] },
  ],
  'arrive.meet.history.estranged': [
    { id: 'np.me1', turns: [
      { beat: "{a} sees {b} and stops walking." },
      { by: 'b', say: "Hi." },
      { by: 'a', say: "...Hi." },
      { beat: "Neither of them says anything else." },
      { by: 'a', conf: "{b} is my {kinWord}. We haven't really talked in a long time. I did not expect this to be the place we start again." },
    ] },
  ],
  'arrive.meet.history.exes': [
    { id: 'np.mx1', turns: [
      { by: 'a', say: "Oh, no." },
      { by: 'b', say: "Nice to see you too." },
      { by: 'a', say: "Of all the people. Of all the shows." },
      { by: 'b', say: "I could say the same thing." },
      { by: 'a', conf: "{b} and I used to date, and it ended badly, and now we're stuck here together for weeks. Fantastic." },
    ] },
  ],
  'arrive.meet.history.exfriends': [
    { id: 'np.mz1', turns: [
      { by: 'b', say: "Well. Look who it is." },
      { by: 'a', say: "{b}." },
      { by: 'b', say: "That's all I get? After everything?" },
      { by: 'a', say: "After everything, that's all you get." },
      { by: 'a', conf: "We used to be best friends, and then we weren't, and I'm not getting into it on day one." },
    ] },
  ],
  'arrive.meet.history.wronged': [
    { id: 'np.mw1', turns: [
      { beat: "{a} steps onto {landing} and the first face {a} sees is {b}'s." },
      { by: 'b', say: "Hey, {a}. Long time." },
      { by: 'a', say: "Not long enough." },
      { by: 'b', say: "Still mad about {where}?" },
      { by: 'a', say: "You wrote my name. So, yeah." },
      { by: 'a', conf: "{b} blindsided me {where}. I've been thinking about it ever since. I'm not here for revenge. Okay, I'm a little bit here for revenge." },
    ] },
  ],
  'arrive.meet.history.wronger': [
    { id: 'np.mg1', turns: [
      { by: 'a', say: "Oh. Hi, {b}." },
      { by: 'b', say: "Don't 'hi' me." },
      { by: 'a', say: "Still upset about {where}?" },
      { by: 'b', say: "What do you think?" },
      { by: 'a', conf: "I voted {b} out {where}, and it was the right move, but {b} doesn't see it that way, so I'm going to have to watch {b} really closely." },
    ] },
  ],
  'arrive.meet.history.oldflame': [
    { id: 'np.mo1', turns: [
      { by: 'b', say: "{a}." },
      { by: 'a', say: "{b}. You look good." },
      { by: 'b', say: "Don't." },
      { by: 'a', say: "Don't what?" },
      { by: 'b', say: "Don't do the thing where you're nice to me." },
      { by: 'b', conf: "{a} and I had a thing {where}. It didn't end well. Now {a} is here, smiling at me like nothing happened." },
    ] },
  ],
  'arrive.meet.history.oldcouple': [
    { id: 'np.mp1', turns: [
      { beat: "{a} spots {b} and grins." },
      { by: 'a', say: "Miss me?" },
      { by: 'b', say: "Every day." },
      { beat: "They kiss. Somebody new on {landing} goes, 'Wait, they're together?'" },
      { by: 'b', conf: "Everybody watched us {where}, so everybody knows we're a couple, and that makes us two targets. It's fine." },
    ] },
  ],
  'arrive.meet.history.oldrivals': [
    { id: 'np.mq1', turns: [
      { by: 'b', say: "Of course it's you." },
      { by: 'a', say: "Of course it's you." },
      { by: 'b', say: "Round two?" },
      { by: 'a', say: "Round two. I'm winning this one." },
      { by: 'b', conf: "{a} and I went at it {where} and it never got settled, so it's getting settled now." },
    ] },
  ],
  'arrive.meet.history.oldallies': [
    { id: 'np.ma1', turns: [
      { by: 'a', say: "{b}! Partner!" },
      { by: 'b', say: "Shh! Not so loud!" },
      { by: 'a', say: "Why?" },
      { by: 'b', say: "Because everyone saw us working together {where}. They're going to split us up before lunch." },
      { by: 'a', conf: "{b} is right, we were a team {where} and everybody knows it, so we need to look like strangers, which is going to be really hard." },
    ] },
  ],

  // ── a first-timer meets a returnee ──
  'arrive.meet.fan-of-them': [
    { id: 'np.fa1', turns: [
      { by: 'a', say: "Wait, you're {b}! You were on the show before!" },
      { by: 'b', say: "Hi. Yes." },
      { by: 'a', say: "I watched every episode. You were so good!" },
      { by: 'b', say: "I went home." },
      { by: 'a', say: "Still good!" },
      { by: 'b', conf: "Every new player here has seen me play. They know my moves. I don't know a single one of theirs." },
    ] },
    { id: 'np.fa2', turns: [
      { by: 'a', say: "Oh no. You're {b}." },
      { by: 'b', say: "Oh no?" },
      { by: 'a', say: "I've seen what you do to people." },
      { by: 'b', say: "That was a different season." },
      { by: 'a', say: "That's what people who do it again say." },
      { by: 'a', conf: "I'm not going to trust {b}, because I've seen the tapes, and everybody's seen the tapes." },
    ] },
  ],
  'arrive.meet.fan': [
    { id: 'np.fb1', turns: [
      { beat: "{b}, already on {landing}, goes very still as {a} steps off." },
      { by: 'b', say: "That's {a}. That's actually {a}." },
      { by: 'a', say: "Hey. Have we met?" },
      { by: 'b', say: "No... yes. I watched you, on TV. Sorry. Hi." },
      { by: 'a', conf: "The new ones all know who I am, which is great for my ego and terrible for my game." },
    ] },
  ],

  // ── archetype chemistry with someone already there ──
  'arrive.meet.tension': [
    { id: 'np.ct1', turns: [
      { beat: "{b} watches {a} step onto {landing} and folds {b.posAdj} arms." },
      { by: 'a', say: "Something wrong?" },
      { by: 'b', say: "Nope. Just looking." },
      { by: 'a', say: "Look somewhere else." },
      { by: 'b', conf: "I don't know {a} at all, and I already don't trust {a}, and my gut is usually right." },
    ] },
  ],
  'arrive.meet.sizing-up': [
    { id: 'np.cs1', turns: [
      { by: 'b', say: "So you're the nice one." },
      { by: 'a', say: "I'm just being friendly." },
      { by: 'b', say: "Mm-hm. We'll see how long that lasts." },
      { by: 'b', conf: "Nice people are the easiest to read and the hardest to vote out. I'll have to think about {a}." },
    ] },
  ],
  'arrive.meet.intimidation': [
    { id: 'np.ci1', turns: [
      { beat: "{a} drops {a.posAdj} bag on {landing} with a thud. {b} jumps." },
      { by: 'a', say: "What?" },
      { by: 'b', say: "Nothing! Nothing, hi, welcome." },
      { by: 'b', conf: "I'm going to stand on the other side of camp from {a}. Just for a while. Just until I know {a} won't throw me off {landing}." },
    ] },
  ],
  'arrive.meet.attraction': [
    { id: 'np.ca1', turns: [
      { beat: "{a} walks past {b}. They both look back at the same time." },
      { by: 'b', say: "Hi." },
      { by: 'a', say: "Hi." },
      { beat: "Neither of them says anything else, and neither of them looks away." },
      { by: 'b', conf: "I am not here to fall for anybody. I'm here to win. ...I need to stop looking at {a}." },
    ] },
  ],
  'arrive.meet.dread': [
    { id: 'np.cd1', turns: [
      { by: 'a', say: "Hey! Want to see a trick?" },
      { by: 'b', move: 'refuse' },
      { by: 'a', say: "I'll show you anyway." },
      { by: 'b', say: "Please don't." },
      { by: 'b', conf: "{a} has been here two minutes and I already have a headache. This is going to be a very long season." },
    ] },
  ],
  'arrive.meet.rivalry': [
    { id: 'np.cr1', turns: [
      { by: 'b', say: "You look like you work out." },
      { by: 'a', say: "Every day. You?" },
      { by: 'b', say: "Twice a day." },
      { by: 'a', say: "Cool. I'll beat you anyway." },
      { by: 'b', conf: "Finally, somebody who might actually be competition. This is going to be fun." },
    ] },
  ],
  'arrive.meet.predatory': [
    { id: 'np.cp1', turns: [
      { by: 'b', say: "Hi! You seem great, like really great." },
      { by: 'a', say: "Thanks! You seem great too!" },
      { by: 'b', say: "We should stick together." },
      { by: 'a', say: "I'd love that!" },
      { by: 'b', conf: "{a} is going to be very useful. {a} trusts everybody. I'm going to be the first person {a} trusts." },
    ] },
  ],
  'arrive.meet.encouragement': [
    { id: 'np.ce1', turns: [
      { by: 'b', say: "Hey. First time on something like this?" },
      { by: 'a', say: "Is it that obvious?" },
      { by: 'b', say: "A little, but don't worry, just stick with me and you'll be fine." },
      { by: 'a', say: "Really?" },
      { by: 'b', say: "Really." },
      { by: 'a', conf: "{b} was the first person here to be nice to me. I'm not going to forget that." },
    ] },
  ],
  'arrive.meet.recognition': [
    { id: 'np.cg1', turns: [
      { beat: "{a} and {b} look at each other for a little too long." },
      { by: 'b', say: "You're doing the thing." },
      { by: 'a', say: "What thing?" },
      { by: 'b', say: "Counting everybody. I'm doing it too." },
      { by: 'a', say: "...Then let's not do it at each other." },
      { by: 'b', conf: "{a} is really smart, so either we work together, or one of us goes home very early." },
    ] },
  ],
  'arrive.meet.curiosity': [
    { id: 'np.cc1', turns: [
      { by: 'b', say: "What's your deal?" },
      { by: 'a', say: "My deal?" },
      { by: 'b', say: "Everybody's got a deal, and I can usually tell in a minute, but I can't tell with you." },
      { by: 'a', say: "Good." },
      { by: 'b', conf: "I can read almost anybody, but I can't read {a} at all, and that bugs me, so I'm going to figure {a} out." },
    ] },
  ],
};

// One pool per part, not one per archetype (the user: arrivals "only use their archetype, not their
// voices, ages, stats"): an archetype's lines join '.any' gated on the archetype, beside the lines
// gated on a voice, an age band, a stat, a hometown or a job, so any of them can win (write.js puts
// the speaker's own voice first, then the more specific match)
const MEEK = ['loud', 'tough', 'blunt', 'cruel', 'proud', 'bossy', 'competitive'];
const meekIds = new Set(['np.nu1', 'np.nu2', 'np.ng1', 'np.ng2', 'np.nl2', 'np.nf2']);
const merged = {};
for (const [k, pool] of Object.entries(POOLS)) {
  const m = /^(arrive\.(?:host|new))\.([a-z-]+)$/.exec(k);
  const key = m && m[2] !== 'any' ? `${m[1]}.any` : k;
  const out = pool.map(e => {
    const when = { ...(e.when || {}), ...(m && m[2] !== 'any' ? { arch: m[2] } : {}), ...(meekIds.has(e.id) ? { notVoice: MEEK } : {}) };
    return Object.keys(when).length ? { ...e, when } : e;
  });
  merged[key] = [...(merged[key] || []), ...out];
}
export default merged;

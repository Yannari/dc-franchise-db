// pm/lines/kin.js — the islanders who knew each other before the villa (pm/kin.js). Data only.
//
//   pair-text     [a]           the text that two new arrivals are coming in, together
//   kin-entrance  [a, b]        the two walk in side by side. `of`: twins · family · friends
//   kin-heart     [a, b]        a moment that is only theirs. `of`: family · friends
//   kin-vet       [a, b, c]     a sizes up b, the partner of c (a's relative or friend). `of`: approve · doubt
//   kin-protect   [a, b, c]     a confronts b, c's partner, who was seen with {about} today. `of`: family · friends
//   ex-awkward    [a, b]        exes in the same villa. `of`: spark · cold
//   ex-jealous    [a, b, c]     a watches b, a's ex, coupled with c
//   kin-goodbye   [a, b]        a watches b, a's relative or friend, dumped. `of`: family · friends
//   kin-walk      [a, b]        a leaves the villa with b. `of`: family · friends
//   intro-kin     [a]           the intro tape says who they already know in here. `of`: twins · family · friends · ex
//
// Never a word for the relation that the tab did not give, and never a
// gendered one: "my twin", "family", "my best friend" — the tab says
// siblings, not sisters.
export const KIN_LINES = {
  // An ex walks in as a bombshell (arrivals.js exReveal).
  //   ex-text      [a, b]     the text hints at it; b is the ex already inside
  //   ex-reveal    [a, b]     a, inside, sees b walk in. `of`: spark · cold
  //   ex-partner   [a, b, c]  a finds out their partner b used to be with c
  //   ex-confront  [a, b]     that night, the two of them. `of`: spark · cold
  'ex-text': [
    { id: 'xt.01', stage: "{a}'s phone goes off.", turns: [['a', "Islanders, a new arrival is on the way, and one of you is about to get a blast from the past. #Awkward"], ['a', "Who's got a past?"]], beat: '{b} goes very quiet.' },
    { id: 'xt.02', turns: [['a', "I got a text! Islanders, tonight someone new walks in, and they're no stranger to one of you. #HistoryRepeats"], ['b', "What does that mean? What does that mean?"]] },
    { id: 'xt.03', stage: 'Everyone crowds round {a}.', turns: [['a', "Islanders, get ready for a familiar face. #YouAgain"]], beat: 'Nobody notices {b} put down {b.posAdj} drink.' },
    { id: 'xt.04', turns: [['a', "Islanders, your next bombshell knows one of you very well. Very, very well. #BlastFromThePast"], ['b', "Oh, I don't like that."]] },
  ],
  'ex-reveal': [
    { id: 'xr.c1', when: { of: 'cold' }, stage: '{a} sees who it is, and the smile drops.', turns: [['a', "No. No way."], ['b', "Hi, {a}. Long time."]], beat: 'The whole lawn turns to look at {a}.' },
    { id: 'xr.c2', when: { of: 'cold' }, turns: [['a', "You have got to be kidding me."], ['b', "Nice to see you too."]] },
    { id: 'xr.c3', when: { of: 'cold' }, stage: '{a} stands up, sits back down, and stands up again.', turns: [['a', "That's my ex. That is actually my ex."]] },
    { id: 'xr.c4', when: { of: 'cold' }, turns: [['b', "Surprise."], ['a', "What are you doing here?"], ['b', "Same as you. Looking for love."]] },
    { id: 'xr.s1', when: { of: 'spark' }, stage: '{a} goes bright red before {b} reaches the bottom of the steps.', turns: [['a', "Oh my God."], ['b', "Hello, you."]], beat: 'Nobody on the lawn misses how {a} is looking at {b}.' },
    { id: 'xr.s2', when: { of: 'spark' }, turns: [['a', "Everyone, this is my ex."], ['b', "Hi. I'm the ex."]], beat: 'They are both trying not to smile.' },
    { id: 'xr.s3', when: { of: 'spark' }, stage: '{a} puts both hands over {a.posAdj} face.', turns: [['a', "I can't believe you're here."], ['b', "Did you miss me?"]] },
  ],
  'ex-partner': [
    { id: 'xp.01', turns: [['a', "Wait. You two know each other?"], ['b', "We used to go out."], ['a', "And you didn't think to mention that?"]] },
    { id: 'xp.02', stage: '{a} looks from {b} to {c} and back again.', turns: [['a', "So that's your ex."], ['b', "It was a long time ago."], ['a', "It didn't look like a long time ago."]] },
    { id: 'xp.03', turns: [['a', "Is there anything else I should know? Anyone else about to walk in?"], ['b', "It's not a big deal."], ['a', "It's a big deal to me."]] },
    { id: 'xp.04', when: { of: 'spark' }, turns: [['a', "Why are you smiling like that?"], ['b', "I'm not smiling."], ['a', "You are. You're smiling at {c}."]] },
    { id: 'xp.05', when: { of: 'cold' }, turns: [['a', "Are you okay?"], ['b', "I'm fine. I just didn't expect to see {c} ever again."], ['a', "Well, I'm here. Remember that."]] },
  ],
  'ex-confront': [
    { id: 'xc.c1', when: { of: 'cold' }, stage: '{a} finds {b} by the pool, away from the others.', turns: [['a', "What are you actually doing here?"], ['b', "I didn't come in for you, if that's what you're asking."], ['a', "Good."]] },
    { id: 'xc.c2', when: { of: 'cold' }, turns: [['a', "Please don't make this weird."], ['b', "You made it weird when you ended it."], ['a', "We both ended it."]] },
    { id: 'xc.c3', when: { of: 'cold' }, turns: [['b', "Can we at least be civil?"], ['a', "Civil I can do. Friends, I'm not sure."]] },
    { id: 'xc.c4', when: { of: 'cold' }, stage: '{a} and {b} end up alone in the kitchen, which neither of them wanted.', turns: [['a', "Just stay out of my way."], ['b', "It's a villa. There's nowhere to go."]] },
    { id: 'xc.s1', when: { of: 'spark' }, stage: '{a} and {b} end up alone on the swing seat.', turns: [['b', "So. This is weird."], ['a', "So weird."], ['b', "You look happy, though."], ['a', "Don't do that."]] },
    { id: 'xc.s2', when: { of: 'spark' }, turns: [['a', "Why did you really come in?"], ['b', "Honestly? I don't know. Maybe to see if there was anything left."], ['a', "And?"], ['b', "Ask me in a week."]] },
    { id: 'xc.s3', when: { of: 'spark' }, turns: [['b', "Do you ever think we gave up too early?"], ['a', "Every single day. Now go away before somebody sees us."]] },
  ],
  // A bombshell taking their ex out (arrivals.js bombshellDates, `exes`).
  date: [
    { id: 'xd.01', when: { exes: true }, stage: 'The date is at a beach bar, and neither of them knows where to start.', turns: [['b', "So this is happening."], ['a', "I picked you. I wanted to talk properly."], ['b', "We've never been good at talking properly."]] },
    { id: 'xd.02', when: { exes: true }, turns: [['a', "This is the first time we've sat across a table since we broke up."], ['b', "Don't make it a thing."], ['a', "It's already a thing."]], beat: 'They are both laughing now.' },
    { id: 'xd.03', when: { exes: true }, stage: 'The date is on a boat, which leaves nowhere to storm off to.', turns: [['b', "Why me? Out of everyone in there."], ['a', "Because I needed to know if there's still something."], ['b', "And?"], ['a', "You tell me."]] },
    { id: 'xd.04', when: { exes: true }, turns: [['b', "Are you here to win me back?"], ['a', "I'm here to find out if I want to."]] },
  ],
  'date-back': [
    { id: 'xdb.k1', when: { exes: true, of: 'keen' }, turns: [['a', "So? How was the date with your ex?"], ['b', "It was fine."], ['a', "Just fine?"], ['b', "It was a lot of old stuff coming up."]] },
    { id: 'xdb.k2', when: { exes: true, of: 'keen' }, stage: '{a} is waiting on the daybed when {b} gets back.', turns: [['a', "You were gone ages."], ['b', "We had a lot to talk about."], ['a', "That's what I'm worried about."]] },
    { id: 'xdb.l1', when: { exes: true, of: 'loyal' }, turns: [['b', "It was good to clear the air with {c}. That's all it was."], ['a', "Promise?"], ['b', "It's over. It's been over for ages."]] },
    { id: 'xdb.l2', when: { exes: true, of: 'loyal' }, stage: '{b} comes straight back to {a}.', turns: [['b', "Now I know. There's nothing there any more."], ['a', "You needed a date to find that out?"], ['b', "I needed to be sure."]] },
  ],
  // Casa Amor: missing the one in the other villa, to a friend in this one.
  // `of`: aches (just misses them) · worries (and wonders what they're doing).
  'casa-miss': [
    { id: 'cm.a1', when: { of: 'aches' }, stage: '{a} is lying on a sunbed, staring at nothing.', turns: [['b', "You're thinking about {about} again."], ['a', "I can't help it. It's too quiet without them."]] },
    { id: 'cm.a2', when: { of: 'aches' }, turns: [['a', "Is it weird that I miss {about} already?"], ['b', "It hasn't been that long."], ['a', "I know. That's what's weird."]] },
    { id: 'cm.a3', when: { of: 'aches' }, stage: '{a} keeps looking at the empty side of the bed.', turns: [['a', "I didn't realise how used to {about} I'd got."], ['b', "That's a good sign, though."]] },
    { id: 'cm.a4', when: { of: 'aches' }, turns: [['b', "Anyone catching your eye in here?"], ['a', "Honestly? No. I just want {about} back."]], beat: '{b} smiles. That was the right answer.' },
    { id: 'cm.a5', when: { of: 'aches' }, stage: '{a} is making two coffees before remembering.', turns: [['a', "Oh. Force of habit."], ['b', "You've got it bad."], ['a', "I've got it really bad."]] },
    { id: 'cm.a6', when: { of: 'aches' }, turns: [['a', "The first thing I'm doing when this is over is running straight to {about}."], ['b', "Running?"], ['a', "Sprinting."]] },
    { id: 'cm.t1', when: { of: 'tears' }, stage: '{a} is crying quietly on the daybed, and {b} sits down beside them.', turns: [['b', "Hey. Come here."], ['a', "I just miss {about} so much."]], beat: '{b} holds on until it passes.' },
    { id: 'cm.t2', when: { of: 'tears' }, stage: "{b} finds {a} in the dressing room with mascara running.", turns: [['a', "I'm fine. I'm fine."], ['b', "You're not fine."], ['a', "I'm not. I want {about}."]] },
    { id: 'cm.t3', when: { of: 'tears' }, turns: [['a', "Sorry. I didn't think I'd cry."], ['b', "Don't be sorry. It means it's real."]], beat: '{a} wipes {a.posAdj} eyes and laughs at {a.ref}.' },
    { id: 'cm.t4', when: { of: 'tears' }, stage: "{a} starts to say {about}'s name and doesn't get to the end of it.", turns: [['b', "Let it out."], ['a', "I didn't know it would hurt like this."]] },
    { id: 'cm.w1', when: { of: 'worries' }, stage: '{a} has not touched breakfast.', turns: [['a', "What do you think {about} is doing right now?"], ['b', "Probably sitting there missing you."], ['a', "Or probably not."]] },
    { id: 'cm.w2', when: { of: 'worries' }, turns: [['a', "I'm being good in here. I just don't know if {about} is being good over there."], ['b', "You have to trust it."], ['a', "I'm trying."]] },
    { id: 'cm.w3', when: { of: 'worries' }, stage: '{a} hardly slept last night.', turns: [['a', "Do you think someone's turned {about}'s head?"], ['b', "Stop torturing yourself."], ['a', "I can't help it."]] },
    { id: 'cm.w4', when: { of: 'worries' }, turns: [['a', "The worst bit is not knowing."], ['b', "You'll know soon enough."], ['a', "That's what I'm scared of."]] },
    { id: 'cm.w5', when: { of: 'worries' }, stage: '{a} keeps glancing at the gate as if it might open.', turns: [['b', "They're not coming through there, you know."], ['a', "I know. I just want to know {about} still wants me."]] },
  ],
  'pair-text': [
    { id: 'pair-text.01', stage: '{a} reads the text out, and then reads it again.', turns: [['a', "Islanders, not one, but TWO new arrivals are about to walk in. #DoubleTrouble"]], beat: 'The whole villa goes quiet.' },
    { id: 'pair-text.02', stage: "{a}'s phone buzzes.", turns: [['a', "Two bombshells. Tonight. Together. As in, they know each other?"]] },
    { id: 'pair-text.03', stage: 'A text arrives at the fire pit.', turns: [['a', "Islanders, get ready. Two new islanders are on their way, and they're coming as a pair."]], beat: 'Somebody groans. Somebody else cheers.' },
  ],
  'kin-entrance': [
    { id: 'ke.t1', when: { of: 'twins' }, stage: '{a} and {b} walk down the steps side by side, and the villa does a double take.', turns: [['a', "Hi, everyone! Yes, we're twins."], ['b', "And no, you can't tell us apart."]] },
    { id: 'ke.t2', when: { of: 'twins' }, stage: 'Two of them. The same face, twice, at the top of the steps.', turns: [['b', "Surprise!"], ['a', "Double the trouble. Sorry in advance."]] },
    { id: 'ke.t3', when: { of: 'twins' }, stage: '{a} and {b} walk in holding hands, grinning the same grin.', turns: [['a', "We share everything."], ['b', "Except boys. We do not share boys."]] },
    { id: 'ke.f1', when: { of: 'family' }, stage: '{a} and {b} walk into the villa together.', turns: [['a', "Before anyone asks, yes, we're related."], ['b', "And yes, we will be keeping an eye on each other."]] },
    { id: 'ke.f2', when: { of: 'family' }, stage: 'Two new faces at the top of the steps, and a family resemblance nobody can miss.', turns: [['b', "Hi! We're family. Be nice."]] },
    { id: 'ke.fr1', when: { of: 'friends' }, stage: '{a} and {b} walk down the steps arm in arm.', turns: [['a', "We've been best friends for years."], ['b', "So if you upset one of us, you've upset both of us."]] },
    { id: 'ke.fr2', when: { of: 'friends' }, stage: '{a} and {b} arrive together, already laughing at something.', turns: [['b', "We applied together, and we got in together."], ['a', "Nobody's splitting us up."]] },
  ],
  'kin-heart': [
    { id: 'kh.f1', when: { of: 'family' }, turns: [['a', "Our {~mum} would be so proud of us right now."], ['b', "Our {~mum} would be mortified by half of what we've done."]], beat: 'They both laugh.' },
    { id: 'kh.f2', when: { of: 'family' }, stage: '{a} and {b} sit on the edge of the pool, feet in the water.', turns: [['b', "Are you actually happy in here?"], ['a', "I'm happier knowing you're here."]] },
    { id: 'kh.f3', when: { of: 'family' }, turns: [['a', "Whatever happens, we go home together at the end of this."], ['b', "Always."]] },
    { id: 'kh.f4', when: { of: 'family' }, stage: '{b} is doing {a.posAdj} hair on the terrace, like they have since they were kids.', turns: [['a', "Don't pull."], ['b', "I'm not pulling. You're just dramatic."]] },
    { id: 'kh.f5', when: { of: 'family' }, stage: '{a} and {b} are sharing a sunbed and one pair of sunglasses.', turns: [['b', "Give them back."], ['a', "You had them all morning."], ['b', "I had them for ten minutes."]] },
    { id: 'kh.f6', when: { of: 'family' }, turns: [['b', "Do you remember that holiday when you got stuck on the pedalo?"], ['a', "We said we'd never speak about that."], ['b', "I'm not speaking about it. I'm remembering it."]], beat: '{a} pushes {b} into the pool.' },
    { id: 'kh.f7', when: { of: 'family' }, stage: '{a} brings {b} a cup of tea without being asked.', turns: [['b', "How did you know?"], ['a', "I've been making your tea my whole life."]] },
    { id: 'kh.f8', when: { of: 'family' }, turns: [['a', "Be honest. Do I snore?"], ['b', "Like a tractor. You always have."]] },
    { id: 'kh.fr1', when: { of: 'friends' }, turns: [['a', "I'm so glad you're in here with me."], ['b', "Imagine doing this without each other."]] },
    { id: 'kh.fr2', when: { of: 'friends' }, stage: '{a} and {b} are the last two awake on the daybeds.', turns: [['b', "Tell me everything."], ['a', "Everything? That'll take all night."], ['b', "I've got all night."]] },
    { id: 'kh.fr3', when: { of: 'friends' }, turns: [['a', "You know me better than anyone in here."], ['b', "I know you better than anyone out there too."]] },
    { id: 'kh.fr4', when: { of: 'friends' }, stage: '{a} and {b} have a handshake, and it takes about a minute.', turns: [['b', "We made that up when we were fifteen."], ['a', "And we'll still be doing it when we're eighty."]] },
    { id: 'kh.fr5', when: { of: 'friends' }, turns: [['b', "If this all goes wrong, at least we'll have a story."], ['a', "We've already got about fifty stories."]] },
  ],
  'kin-vet': [
    { id: 'kv.a1', when: { of: 'approve' }, stage: '{a} pulls {b} aside for a chat about {c}.', turns: [['a', "So. You and {c}."], ['b', "Me and {c}."], ['a', "I've been watching. You're good for each other."]], beat: '{b} looks genuinely relieved.' },
    { id: 'kv.a2', when: { of: 'approve' }, turns: [['a', "I'll be honest, I wasn't sure about you at first."], ['b', "And now?"], ['a', "Now I think you're alright. Look after {c}."]] },
    { id: 'kv.a3', when: { of: 'approve' }, stage: '{a} sits down next to {b} with two drinks.', turns: [['a', "I'm going to ask you some questions about {c}, and you're going to answer them."], ['b', "Okay…"], ['a', "Relax. You've passed."]] },
    { id: 'kv.a4', when: { of: 'approve' }, turns: [['a', "I've never seen {c} smile like that."], ['b', "Like what?"], ['a', "Like that. Keep doing whatever you're doing."]] },
    { id: 'kv.a5', when: { of: 'approve' }, stage: '{a} gives {b} a slow nod across the kitchen.', turns: [['b', "What was that?"], ['a', "That was me saying you're alright."]] },
    { id: 'kv.d1', when: { of: 'doubt' }, stage: '{a} takes {b} to one side, away from {c}.', turns: [['a', "What are your intentions with {c}?"], ['b', "My intentions?"], ['a', "You heard me."]], beat: '{b} does not have a good answer ready.' },
    { id: 'kv.d2', when: { of: 'doubt' }, turns: [['a', "I know {c} better than anyone in here. And I'm not sure about you."], ['b', "That's not your decision."], ['a', "I know. I'm just telling you."]] },
    { id: 'kv.d3', when: { of: 'doubt' }, turns: [['a', "If you're messing {c} around, I'll know. I always know."], ['b', "I'm not messing anyone around."]] },
    { id: 'kv.d4', when: { of: 'doubt' }, stage: '{a} watches {b} and {c} on the daybed, arms folded.', turns: [['b', "Is there a problem?"], ['a', "Not yet."]] },
    { id: 'kv.d5', when: { of: 'doubt' }, turns: [['a', "Can I be honest with you?"], ['b', "Go on."], ['a', "I don't think you're taking {c} seriously. And {c} deserves somebody who does."]] },
    { id: 'kv.d6', when: { of: 'doubt' }, turns: [['a', "What do you actually like about {c}?"], ['b', "Loads of things."], ['a', "Name one."]], beat: 'The pause is a long one.' },
  ],
  'kin-protect': [
    { id: 'kp.f1', when: { of: 'family' }, stage: '{a} marches straight over to {b}.', turns: [['a', "I saw you with {about}. So did {c}."], ['b', "It was just a chat."], ['a', "Then have your chats somewhere my family can't see them."]] },
    { id: 'kp.f2', when: { of: 'family' }, turns: [['a', "That's my family you're messing about."], ['b', "I'm not messing anyone about."], ['a', "Then what was that with {about}?"]] },
    { id: 'kp.f3', when: { of: 'family' }, stage: '{a} finds {b} by the pool.', turns: [['a', "If you hurt {c}, you deal with me. I'm just saying."]], beat: '{b} does not argue.' },
    { id: 'kp.f4', when: { of: 'family' }, stage: '{a} sits down right between {b} and {about}.', turns: [['a', "Don't mind me."], ['b', "We were just talking."], ['a', "I know. I watched you. So did {c}."]] },
    { id: 'kp.f5', when: { of: 'family' }, turns: [['a', "We need to talk about {c}."], ['b', "What about {c}?"], ['a', "About how {c} felt watching you with {about} all afternoon."]] },
    { id: 'kp.f6', when: { of: 'family' }, stage: '{a} catches {b} on the way back from the kitchen.', turns: [['a', "You've got one chance with my family. Don't waste it on {about}."]] },
    { id: 'kp.fr1', when: { of: 'friends' }, turns: [['a', "{c} is my best friend. So I'm going to ask you once: what are you doing with {about}?"], ['b', "Nothing!"]] },
    { id: 'kp.fr2', when: { of: 'friends' }, stage: '{a} pulls {b} aside, and does not bother with a smile.', turns: [['a', "{c} deserves better than watching that."], ['b', "Watching what?"], ['a', "You and {about}. Don't pretend."]] },
    { id: 'kp.fr3', when: { of: 'friends' }, turns: [['a', "I'm not going to stand here and watch you make a fool of my best friend."], ['b', "I'm not making a fool of anyone."], ['a', "Tell that to {about}."]] },
  ],
  'ex-awkward': [
    { id: 'ea.s1', when: { of: 'spark' }, stage: '{a} and {b} end up alone in the kitchen.', turns: [['a', "This is weird, isn't it?"], ['b', "It's a bit weird."], ['a', "You look good, though."], ['b', "Don't start."]] },
    { id: 'ea.s2', when: { of: 'spark' }, turns: [['b', "Do you ever think about us?"], ['a', "Sometimes. Do you?"], ['b', "More than I should."]] },
    { id: 'ea.s3', when: { of: 'spark' }, stage: 'The whole villa notices {a} and {b} laughing together, the way exes do when they are not quite over it.', turns: [['a', "Old times."], ['b', "Old times."]] },
    { id: 'ea.t1', when: { of: 'together' }, turns: [['a', "Did you ever think we'd end up back here?"], ['b', "Honestly? Every time I said we were done."]] },
    { id: 'ea.t2', when: { of: 'together' }, stage: '{a} and {b} are the last two in the kitchen.', turns: [['b', "Last time, we'd have been arguing by now."], ['a', "We've grown up a bit."], ['b', "A bit."]] },
    { id: 'ea.t3', when: { of: 'together' }, turns: [['a', "Everyone keeps asking what's different this time."], ['b', "What do you tell them?"], ['a', "That we actually talk now."]] },
    { id: 'ea.t4', when: { of: 'together' }, stage: '{a} and {b} share a sunbed, and the villa pretends not to notice.', turns: [['b', "Second time lucky?"], ['a', "Don't jinx it."]] },
    { id: 'ea.c1', when: { of: 'cold' }, stage: '{a} and {b} reach for the same towel.', turns: [['a', "You take it."], ['b', "No, you take it. You always did."]], beat: 'Nobody takes the towel.' },
    { id: 'ea.c2', when: { of: 'cold' }, turns: [['b', "I didn't know you'd be here."], ['a', "Neither did I. Believe me."]] },
    { id: 'ea.c3', when: { of: 'cold' }, stage: '{a} walks into the kitchen, sees {b}, and walks straight back out.', turns: [['b', "Very mature."]] },
  ],
  'ex-jealous': [
    { id: 'ej.01', stage: '{a} watches {b} and {c} on the daybed.', turns: [['a', "I don't care. Honestly. I don't."]], beat: '{a} cares.' },
    { id: 'ej.02', turns: [['a', "{c}? Really? That's not even {b.posAdj} type."]] },
    { id: 'ej.03', stage: '{a} goes very quiet when {b} kisses {c} across the room.', turns: [['a', "Good for them."]], beat: "It doesn't sound like good for them." },
  ],
  'kin-goodbye': [
    { id: 'kg.f1', when: { of: 'family' }, stage: '{a} holds on to {b} for a long time.', turns: [['a', "I don't know how to do this without you."], ['b', "Yes, you do. Go and win it."]] },
    { id: 'kg.f2', when: { of: 'family' }, turns: [['b', "Look after yourself. Promise me."], ['a', "I promise. I'll see you at home."]], beat: '{a} cries into {b.posAdj} shoulder.' },
    { id: 'kg.f3', when: { of: 'family' }, stage: '{a} walks {b} all the way to the top of the steps.', turns: [['a', "Tell everyone at home I love them."], ['b', "Tell them yourself. You're winning this."]] },
    { id: 'kg.fr1', when: { of: 'friends' }, turns: [['a', "This isn't how it was meant to go."], ['b', "Stay for both of us."]] },
    { id: 'kg.fr2', when: { of: 'friends' }, stage: '{a} and {b} hug like they will never let go.', turns: [['b', "Don't forget me in here."], ['a', "As if I could."]] },
  ],
  'kin-walk': [
    { id: 'kw.f1', when: { of: 'family' }, stage: '{a} stands up before {b} has reached the steps.', turns: [['a', "I'm going with {b}."], ['b', "No. Stay."], ['a', "I'm not doing this without you."]], beat: 'The villa watches in silence as they walk out together.' },
    { id: 'kw.f2', when: { of: 'family' }, turns: [['a', "We came in together, and we're leaving together."]], beat: '{b} takes {a.posAdj} hand, and they go.' },
    { id: 'kw.fr1', when: { of: 'friends' }, turns: [['a', "If you're going, I'm going."], ['b', "You're mad."], ['a', "I know."]], beat: 'They leave arm in arm.' },
  ],
  'intro-kin': [
    { id: 'ik.t1', when: { of: 'twins' }, turns: [['a', "I'm not doing this alone. My twin is going in with me."]] },
    { id: 'ik.t2', when: { of: 'twins' }, turns: [['a', "People always ask if twins can feel what the other one's feeling. We're about to find out."]] },
    { id: 'ik.f1', when: { of: 'family' }, turns: [['a', "Someone from my family is going in too, which is either the best thing ever or a disaster."]] },
    { id: 'ik.f2', when: { of: 'family' }, turns: [['a', "Family comes first, even in there. Especially in there."]] },
    { id: 'ik.fr1', when: { of: 'friends' }, turns: [['a', "My best friend is going in as well. We've done everything together, so why not this?"]] },
    { id: 'ik.fr2', when: { of: 'friends' }, turns: [['a', "The good news is my best friend is going in with me. The bad news is they know all my secrets."]] },
    { id: 'ik.ti1', when: { of: 'twins-in' }, turns: [['a', "My twin has been in there for days, and has no idea I'm coming. I can't wait to see that face. Well, my face."]] },
    { id: 'ik.fi1', when: { of: 'family-in' }, turns: [['a', "Someone from my family is already in that villa, and they have no idea I'm about to walk in."]] },
    { id: 'ik.fi2', when: { of: 'family-in' }, turns: [['a', "I've been watching my family on the show from home. Now I get to go and embarrass them in person."]] },
    { id: 'ik.fr1i', when: { of: 'friends-in' }, turns: [['a', "My best friend is already in there. They're going to scream when they see me."]] },
    { id: 'ik.x1', when: { of: 'ex-in' }, turns: [['a', "There's someone in there who is going to be very surprised to see me."]] },
    { id: 'ik.x2', when: { of: 'ex-in' }, turns: [['a', "I know exactly who's in that villa. And one of them used to be mine."]] },
    { id: 'ik.x3', when: { of: 'ex-in' }, turns: [['a', "Let's just say I've got unfinished business in there. Or finished business. We'll see."]] },
    { id: 'ik.e1', when: { of: 'ex' }, turns: [['a', "Let's just say I know someone going in. I used to know them very well."]] },
    { id: 'ik.e2', when: { of: 'ex' }, turns: [['a', "My ex is going in too. I'm fine about it. I'm totally fine."]] },
  ],
};

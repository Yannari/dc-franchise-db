// ══════════════════════════════════════════════════════════════════════
// bb/script/lines/plan.js — the week's vote operation (Phase 6)
// ══════════════════════════════════════════════════════════════════════
//
// The words for bb-events/vote-plans.js. {target} is the person the plan
// wants out. Counts are words: {expected} (votes claimed), {majority}
// (needed), {gap}, {locked} (votes that can be relied on).
//
//   plan.seen         a notices b and c meeting in private                scene
//   plan.count        a, the organiser, counts with b                     short | holds; intent one | many (gap)
//   plan.report       a tells b that {source} pitched a on {target}       scene
//   plan.doubt        a doubts b's yes (washroom)                         lies | undecided
//   plan.dissent      b pushes back on a's plan                           refusing | conflicted
//   plan.swing        a works out a is the swing; {org1}, {org2}          both | one
//   plan.compete      a and b both count {swing}                          split ({targetA}, {targetB}) | same
//   plan.cocky        a, the organiser, is too sure; b is not             scene
//   plan.refusal      a said no to {org}'s plan and tells b (storage room)   scene
//   plan.press        a presses b, who lied, about {target}               smooth | shaky
//   plan.backdoor     a, the HOH, and the veto {target} drew into         won | drew; intent told (b is there)
//   plan.pawn         a, the HOH, and b, the pawn, against {target}       guilt | cold
//   plan.blame        a blames b before the vote                          scene
//   plan.flip         a breaks the vote {org} counted (Diary Room)        lied | changed
//   plan.regroup      a survived the vote b organised                     retaliates | polite

export default {
  'plan.seen.scene': [
    { id: 'ka.1', turns: [{ beat: '{b} leaves the room. A minute and a half later, {c} follows.' }, { by: 'a', dr: "That's exactly long enough to look like a coincidence. It's not a coincidence." }] },
    { id: 'ka.2', turns: [{ beat: '{a} walks into the bedroom. {b} and {c} stop talking mid-word.' }, { by: 'a', dr: "I didn't ask. They'd only lie, and then I'd know they lie." }] },
    { id: 'ka.3', turns: [{ by: 'a', dr: "{b} and {c} keep leaving rooms separately, always a couple of minutes apart. Nobody leaves a room that carefully unless the room matters." }] },
    { id: 'ka.4', turns: [{ by: 'a', dr: "Something is being decided this week. I don't know what. I know I wasn't invited." }] },
    { id: 'ka.5', turns: [{ beat: '{b} and {c} suddenly get very interested in the laundry when {a} walks in.' }, { by: 'a', say: "Don't let me stop you." }] },
    { id: 'ka.6', turns: [{ by: 'a', dr: "I've stopped watching who talks. I'm watching who leaves. {b} and {c} leave a lot." }] },
  ],
  'plan.count.short': [
    { id: 'kb.s1', turns: [{ by: 'a', say: "Let's count." }, { beat: '{a} counts on {a.posAdj} fingers.' }, { by: 'a', say: "That's {expected}. We need {majority}." }, { by: 'b', say: "Count again." }, { by: 'a', say: "I have. Twice." }] },
    { id: 'kb.s2', turns: [{ by: 'b', say: "How many have we got?" }, { by: 'a', say: "We've got {expected}." }, { by: 'b', say: "And we need?" }, { by: 'a', say: "We need {majority}." }, { by: 'b', say: "...Right." }] },
    { id: 'kb.s3', when: { intent: 'one' }, turns: [{ by: 'a', dr: "We're one vote short of getting {target} out. One. I need to find it." }] },
    { id: 'kb.s4', when: { intent: 'many' }, turns: [{ by: 'a', dr: "We're {gap} votes short on {target}. That's not a small gap." }] },
    { id: 'kb.s5', turns: [{ by: 'a', say: "We're fine." }, { beat: '{a} keeps counting.' }, { by: 'b', dr: "If we were fine, {a} would stop counting." }] },
    { id: 'kb.s6', turns: [{ by: 'a', say: "Who haven't we asked yet?" }, { by: 'b', say: "Nobody you'd trust." }, { by: 'a', say: "Then let's start with them." }] },
  ],
  'plan.count.holds': [
    { id: 'kb.h1', turns: [{ by: 'b', say: "Say them out loud. The names." }, { by: 'a', say: "Fine." }, { beat: '{a} goes through them, one by one.' }, { by: 'b', say: "Okay. That's enough." }] },
    { id: 'kb.h2', turns: [{ by: 'a', say: "We need {majority} votes to get {target} out, and we've got {expected}." }, { by: 'b', say: "Say it again." }, { by: 'a', say: "We've got {expected}." }] },
    { id: 'kb.h3', turns: [{ by: 'b', dr: "{a} has counted this so many times. So I counted it back. It holds. I still keep looking at the door." }] },
    { id: 'kb.h4', turns: [{ by: 'a', dr: "We've got the votes to send {target} home. I'm trying to believe it." }] },
    { id: 'kb.h5', turns: [{ by: 'b', say: "Are we sure?" }, { by: 'a', say: "As sure as anyone can be in here." }] },
    { id: 'kb.h6', turns: [{ by: 'a', say: "It's done. {target} goes." }, { by: 'b', say: "Don't say that until it's done." }] },
  ],
  'plan.report.scene': [
    { id: 'kc.1', turns: [{ by: 'a', say: "{source} got me on my own about {target}." }, { by: 'b', say: "What did you say?" }, { by: 'a', say: "Nothing." }, { by: 'b', dr: "Everybody says nothing." }] },
    { id: 'kc.2', turns: [{ by: 'a', say: "You should know who's doing the asking. It's {source}." }, { by: 'b', say: "Asking about what?" }, { by: 'a', say: "{target}." }] },
    { id: 'kc.3', turns: [{ by: 'a', dr: "I'm not betraying anyone. {source} asked me about {target}. I'm just telling {b} that {source} asked." }] },
    { id: 'kc.4', turns: [{ by: 'b', dr: "There's a plan, it's aimed at {target}, and {source} is walking it round the house. Only that last part is news." }] },
    { id: 'kc.5', turns: [{ by: 'a', say: "{source} has a plan for {target}." }, { by: 'b', say: "Of course {source} does." }] },
    { id: 'kc.6', turns: [{ by: 'b', say: "Who else has {source} talked to?" }, { by: 'a', say: "No idea. But I doubt it's just me." }] },
  ],
  'plan.doubt.lies': [
    { id: 'kd.l1', turns: [{ by: 'a', dr: "{b} agreed too fast. That's not evidence. It's all I've got." }] },
    { id: 'kd.l2', turns: [{ by: 'a', dr: "{b} keeps telling me {b} is with us before I've even asked. Why do I need reassuring that much?" }] },
    { id: 'kd.l3', turns: [{ by: 'a', say: "You're definitely voting {target} out?" }, { by: 'b', say: "Definitely." }, { by: 'a', dr: "Same answer. Same speed. That's what bothers me." }] },
    { id: 'kd.l4', turns: [{ by: 'a', dr: "I'm sure {b} is lying to me. I can't say why. So I'm saying nothing." }] },
    { id: 'kd.l5', turns: [{ by: 'a', dr: "{b} said yes about {target} straight away. Real decisions take longer than that." }] },
    { id: 'kd.l6', turns: [{ by: 'b', say: "We're good, right?" }, { by: 'a', say: "We're good." }, { by: 'a', dr: "Are we?" }] },
  ],
  'plan.doubt.undecided': [
    { id: 'kd.u1', turns: [{ by: 'a', dr: "{b} still hasn't actually said yes about {target}. I've started noticing what {b} says instead." }] },
    { id: 'kd.u2', turns: [{ by: 'a', say: "Where are you when we vote?" }, { by: 'b', say: "I'm with you guys, obviously." }, { by: 'a', dr: "That wasn't an answer." }] },
    { id: 'kd.u3', turns: [{ by: 'a', dr: "I counted the vote with {b}, then without {b}. The second number is the one I believe." }] },
    { id: 'kd.u4', turns: [{ by: 'a', dr: "Nobody has lied to me. {b} just hasn't promised anything in days. In here, that's the same thing." }] },
    { id: 'kd.u5', turns: [{ by: 'a', say: "So you're voting {target} out?" }, { by: 'b', say: "I'm leaning that way." }, { by: 'a', say: "Leaning." }] },
    { id: 'kd.u6', turns: [{ by: 'b', dr: "I haven't said yes. I haven't said no. That's on purpose." }] },
  ],
  'plan.dissent.refusing': [
    { id: 'ke.r1', turns: [{ by: 'b', say: "I'm not writing {target}'s name and I'm not going to pretend to think about it." }, { by: 'a', say: "Can you keep your voice down?" }] },
    { id: 'ke.r2', turns: [{ by: 'a', say: "Let me explain it again." }, { by: 'b', say: "You've explained it twice. Still no." }] },
    { id: 'ke.r3', turns: [{ by: 'b', say: "Nothing you say in this conversation is going to change my mind." }, { by: 'a', say: "So something else might?" }, { by: 'b', say: "Not this." }] },
    { id: 'ke.r4', turns: [{ by: 'b', dr: "{a} makes the decisions and then holds the meetings. I'm done pretending that's a group." }] },
    { id: 'ke.r5', turns: [{ by: 'a', dr: "{b} said no to my face. In front of the room. That's going to cost {b}." }] },
    { id: 'ke.r6', turns: [{ by: 'b', say: "Count me out." }, { by: 'a', say: "We need you." }, { by: 'b', say: "Then you should've asked me before you decided." }] },
  ],
  'plan.dissent.conflicted': [
    { id: 'ke.c1', turns: [{ by: 'b', say: "I'll vote with you. Just don't tell me it's the obvious move." }, { by: 'a', say: "Thanks." }, { by: 'b', dr: "That wasn't the tone I wanted." }] },
    { id: 'ke.c2', turns: [{ by: 'b', say: "You're asking, so I'll do it." }, { by: 'a', say: "That's all I need." }, { by: 'b', say: "It's not all I need." }] },
    { id: 'ke.c3', turns: [{ by: 'a', say: "{target} is the bigger threat." }, { by: 'b', say: "That's not what I'm arguing about." }, { by: 'a', say: "Then what are you arguing about?" }] },
    { id: 'ke.c4', turns: [{ by: 'a', dr: "{b} agreed and kept talking. That's how I know it wasn't really a yes." }] },
    { id: 'ke.c5', turns: [{ by: 'b', dr: "I'm going along with the vote on {target}. I don't like it. {a} knows I don't like it." }] },
    { id: 'ke.c6', turns: [{ by: 'b', say: "Fine. But this is the last time." }, { by: 'a', say: "Noted." }] },
  ],
  'plan.swing.both': [
    { id: 'kf.b1', turns: [{ by: 'a', dr: "{org1} needs my vote. {org2} needs my vote. For once, I'm the one everybody needs." }] },
    { id: 'kf.b2', turns: [{ by: 'a', dr: "Two different people have brought me coffee today. I didn't ask for either." }] },
    { id: 'kf.b3', turns: [{ by: 'a', dr: "They both need me. Saying that out loud feels very good." }] },
    { id: 'kf.b4', turns: [{ by: 'a', dr: "All season I've been told what the house is doing. This week the house needs me to tell it." }] },
    { id: 'kf.b5', turns: [{ by: 'a', dr: "{org1} and {org2} are counting the same vote. Mine. I'm going to enjoy this." }] },
    { id: 'kf.b6', turns: [{ by: 'a', dr: "I don't have to pick a side yet. Both sides are still trying to win me over." }] },
  ],
  'plan.swing.one': [
    { id: 'kf.o1', turns: [{ by: 'a', dr: "{org1}'s numbers don't work without me. I've finally noticed how carefully {org1} has been talking to me." }] },
    { id: 'kf.o2', turns: [{ by: 'a', dr: "I was asked about {target} and I never answered. Nobody has pushed me since. That tells me how much I'm worth." }] },
    { id: 'kf.o3', turns: [{ by: 'a', dr: "The room is one vote short, and everyone knows whose vote it is. Mine." }] },
    { id: 'kf.o4', turns: [{ by: 'a', dr: "I did {org1}'s maths for myself. I'm the vote they need." }] },
    { id: 'kf.o5', turns: [{ by: 'a', dr: "For the first time this season, my vote matters. I'm not giving it away cheap." }] },
    { id: 'kf.o6', turns: [{ by: 'a', dr: "Everyone's very nice to me this week. I wonder why." }] },
  ],
  'plan.compete.split': [
    { id: 'kg.s1', turns: [{ by: 'a', dr: "{swing} is on my count for {targetA}. I've just heard {b} has {swing} down for {targetB}. One of us is wrong." }] },
    { id: 'kg.s2', turns: [{ by: 'b', say: "We've got the votes." }, { by: 'a', say: "So have we." }, { beat: 'Nobody asks the obvious question.' }] },
    { id: 'kg.s3', turns: [{ by: 'a', say: "Have you got {swing}?" }, { by: 'b', say: "Yes. Have you?" }, { by: 'a', say: "Yes." }, { beat: 'They look at each other.' }] },
    { id: 'kg.s4', turns: [{ by: 'b', dr: "{a} and I can't both have {swing}. Somebody's been lied to. I hope it's {a}." }] },
    { id: 'kg.s5', turns: [{ by: 'a', dr: "Two rooms, two plans, and {swing} has promised both of them. That doesn't add up." }] },
    { id: 'kg.s6', turns: [{ by: 'b', dr: "I never asked if anyone else had counted {swing}. I should have." }] },
  ],
  'plan.compete.same': [
    { id: 'kg.m1', turns: [{ by: 'a', say: "{swing} is with us on {targetA}." }, { by: 'b', say: "Funny. {swing} said the same thing to me." }] },
    { id: 'kg.m2', turns: [{ by: 'a', dr: "{b} and I both think we recruited {swing}. Only one of us actually did." }] },
    { id: 'kg.m3', turns: [{ by: 'b', dr: "{a} just listed {swing} as one of {a.posAdj} votes. I said nothing. But I'm wondering what else our lists have in common." }] },
    { id: 'kg.m4', turns: [{ by: 'a', say: "We've got the numbers." }, { by: 'b', say: "So have we. The same numbers, I think." }] },
    { id: 'kg.m5', turns: [{ by: 'a', dr: "Our total looks right. So does {b}'s. I didn't ask how {b} got there." }] },
    { id: 'kg.m6', turns: [{ by: 'b', dr: "We're all voting {targetA} out. But {a} and I are both taking credit for {swing}." }] },
  ],
  'plan.cocky.scene': [
    { id: 'kh.1', turns: [{ by: 'a', say: "It's done. {target} is gone. We can stop talking about it." }, { by: 'b', dr: "{expected} people said yes. I'd only bet on {locked} of them." }] },
    { id: 'kh.2', turns: [{ by: 'a', say: "Right, next week..." }, { by: 'b', say: "We haven't finished this week." }] },
    { id: 'kh.3', turns: [{ by: 'b', say: "You're counting the maybes as votes." }, { by: 'a', say: "The maybes are votes." }, { by: 'b', dr: "No, they're not." }] },
    { id: 'kh.4', turns: [{ by: 'b', dr: "{a} is relaxed and I can't work out why. We can prove {locked}. We're hoping for {expected}." }] },
    { id: 'kh.5', turns: [{ by: 'a', dr: "We've got this. {target} goes home. I'm not worried." }] },
    { id: 'kh.6', turns: [{ by: 'b', dr: "People say yes in the hallway just to get past you. Some of {a}'s yeses are hallway yeses." }] },
  ],
  'plan.refusal.scene': [
    { id: 'ki.1', turns: [{ by: 'a', say: "I told them no. I'm telling you it happened." }, { by: 'b', say: "Told who?" }, { by: 'a', say: "{org}'s lot." }] },
    { id: 'ki.2', turns: [{ by: 'a', say: "There's a plan. It's {org}'s, and it's aimed at {target}." }, { by: 'b', say: "...Nobody told me." }, { by: 'a', say: "No. They weren't going to." }] },
    { id: 'ki.3', turns: [{ by: 'a', dr: "I said no to {org}'s plan. {b} is the first person who asked me about it, so I told {b} the truth." }] },
    { id: 'ki.4', turns: [{ by: 'a', say: "How many people do you think have been asked?" }, { by: 'b', say: "Two? Three?" }, { by: 'a', say: "More." }, { beat: '{b} stops making the sandwich.' }] },
    { id: 'ki.5', turns: [{ by: 'b', dr: "{org} is running a plan I'm not part of. I only know because {a} said no to it." }] },
    { id: 'ki.6', turns: [{ by: 'b', say: "Why are you telling me?" }, { by: 'a', say: "Because I didn't want any part of it. And you should know." }] },
  ],
  'plan.press.smooth': [
    { id: 'kj.s1', turns: [{ by: 'a', say: "Say the name." }, { by: 'b', say: "{target}." }, { by: 'a', say: "Okay." }, { by: 'a', dr: "There's nothing to ask after that." }] },
    { id: 'kj.s2', turns: [{ by: 'a', say: "Run it by me again." }, { beat: '{b} gives the same answer, at the same speed.' }, { by: 'a', dr: "Either that's the truth, or {b} has practised." }] },
    { id: 'kj.s3', turns: [{ by: 'b', say: "Who else is wobbling?" }, { by: 'a', say: "...Why?" }, { by: 'b', say: "Because I'm not." }, { by: 'a', dr: "By the end, I was the one being reassured." }] },
    { id: 'kj.s4', turns: [{ by: 'a', dr: "I had one question left. I didn't ask it. There's no polite way to say 'I think you're lying.'" }] },
    { id: 'kj.s5', turns: [{ by: 'a', say: "You're sure about {target}?" }, { by: 'b', say: "Completely sure. Are you?" }] },
    { id: 'kj.s6', turns: [{ by: 'b', dr: "{a} pushed me hard on {target}. I didn't blink. I think I'm fine." }] },
  ],
  'plan.press.shaky': [
    { id: 'kj.k1', turns: [{ by: 'a', say: "You're voting {target} out." }, { by: 'b', say: "Yes." }, { by: 'a', say: "Good." }, { beat: '{a} keeps standing there. {b} fills the silence.' }] },
    { id: 'kj.k2', turns: [{ by: 'a', say: "You're sure." }, { by: 'b', say: "I'm sure. Really sure. Definitely." }, { by: 'a', dr: "That's one 'sure' too many." }] },
    { id: 'kj.k3', turns: [{ by: 'a', say: "By the way, about the vote..." }, { beat: '{b} pauses a second too long.' }, { by: 'b', say: "{target}. Yes." }] },
    { id: 'kj.k4', turns: [{ by: 'a', dr: "{b} said the right thing. But {b}'s hands were doing something they weren't doing before." }] },
    { id: 'kj.k5', turns: [{ by: 'b', dr: "{a} asked me about the vote out of nowhere. I think I hesitated. I hope {a} didn't notice." }] },
    { id: 'kj.k6', turns: [{ by: 'a', dr: "{b}'s answer was right. The timing wasn't." }] },
  ],
  'plan.backdoor.won': [
    { id: 'kk.w1', turns: [{ by: 'a', dr: "The whole week was built around {target}. And {target} just won the veto." }] },
    { id: 'kk.w2', when: { intent: 'told' }, turns: [{ beat: '{a} shuts the bedroom door.' }, { by: 'b', say: "So..." }, { by: 'a', say: "So we can't touch {target}." }] },
    { id: 'kk.w3', turns: [{ by: 'a', dr: "I had to clap when {target} won. I've never clapped for anything less." }] },
    { id: 'kk.w4', when: { intent: 'told' }, turns: [{ by: 'b', say: "What now?" }, { by: 'a', say: "Now someone else goes on the block. And I've got to work out who." }] },
    { id: 'kk.w5', turns: [{ by: 'a', dr: "Days of planning, and {target} pulled one chip out of a bag and undid all of it." }] },
    { id: 'kk.w6', when: { intent: 'told' }, turns: [{ by: 'b', say: "Are you okay?" }, { by: 'a', say: "No. Ask me tomorrow." }] },
  ],
  'plan.backdoor.drew': [
    { id: 'kk.d1', turns: [{ by: 'a', dr: "{target} got picked to play in the veto. I spent the whole comp doing maths instead of watching." }] },
    { id: 'kk.d2', turns: [{ by: 'a', dr: "{target} lost the veto. The plan survives. I've never been so relieved." }] },
    { id: 'kk.d3', when: { intent: 'told' }, turns: [{ by: 'a', say: "That was close." }, { by: 'b', say: "How close?" }, { by: 'a', say: "One result away from falling apart." }] },
    { id: 'kk.d4', turns: [{ by: 'a', dr: "{target} has no idea why the room went quiet when {target}'s name came out of the bag." }] },
    { id: 'kk.d5', when: { intent: 'told' }, turns: [{ by: 'a', say: "We got away with it." }, { by: 'b', say: "You've said that twice." }, { by: 'a', say: "Because I can't believe it." }] },
    { id: 'kk.d6', turns: [{ by: 'a', dr: "If {target} had won that veto, this week would be over. {target} didn't. Breathe." }] },
  ],
  'plan.pawn.guilt': [
    { id: 'kl.g1', turns: [{ by: 'a', say: "You're fine." }, { by: 'b', say: "You said that before the ceremony." }, { by: 'a', say: "And it's still true." }, { by: 'a', dr: "I'm not sure it's still true." }] },
    { id: 'kl.g2', turns: [{ by: 'a', dr: "I asked {b} to be a pawn. I said it was a formality. Now nobody can tell me the votes are on {target}." }] },
    { id: 'kl.g3', turns: [{ by: 'a', dr: "I counted the room for {b}'s sake. Twice. I got a different answer each time." }] },
    { id: 'kl.g4', turns: [{ by: 'b', dr: "I've stopped asking {a} if I'm safe. I don't think {a} knows either." }] },
    { id: 'kl.g5', turns: [{ by: 'a', say: "I'll fix this." }, { by: 'b', say: "Can you?" }, { by: 'a', say: "...I'll try." }] },
    { id: 'kl.g6', turns: [{ by: 'a', dr: "I put {b} up as a pawn. If {b} goes home, that's on me." }] },
  ],
  'plan.pawn.cold': [
    { id: 'kl.c1', turns: [{ by: 'b', say: "Has anybody actually told you they're voting {target} out?" }, { by: 'a', say: "Yes. Lots of people." }, { by: 'b', say: "Name them." }] },
    { id: 'kl.c2', turns: [{ by: 'a', dr: "I need {b} calm for two more days. I'm not sure calm and safe are the same thing any more." }] },
    { id: 'kl.c3', turns: [{ by: 'a', say: "Stick with the plan. The numbers are there." }, { by: 'b', say: "Are they?" }, { by: 'a', say: "They're there." }] },
    { id: 'kl.c4', turns: [{ by: 'b', dr: "{a} put me in this chair with a speech about numbers. The numbers have changed. The speech hasn't." }] },
    { id: 'kl.c5', turns: [{ by: 'a', dr: "If I admit the votes have moved, I have to admit I put {b} in danger. So I'm not admitting it." }] },
    { id: 'kl.c6', turns: [{ by: 'b', say: "Be honest with me." }, { by: 'a', say: "I am being honest." }, { by: 'b', dr: "No, {a} isn't." }] },
  ],
  'plan.blame.scene': [
    { id: 'km.1', turns: [{ by: 'a', dr: "Nobody's voted yet, and I already know who to blame if it goes wrong. {b}." }] },
    { id: 'km.2', turns: [{ by: 'a', say: "{b} has been acting strange for two days." }, { beat: 'Nobody answers.' }, { by: 'a', dr: "Now it's on the record." }] },
    { id: 'km.3', turns: [{ by: 'a', dr: "If this goes sideways, it's {b}. I'm saying it now, quietly, to the right people." }] },
    { id: 'km.4', turns: [{ by: 'a', dr: "I've counted our side four times today and it still feels wrong. It's easier to blame {b} than the count." }] },
    { id: 'km.5', turns: [{ by: 'a', say: "If this falls apart, look at {b}." }, { beat: 'A couple of people nod.' }] },
    { id: 'km.6', turns: [{ by: 'b', dr: "I keep catching {a} looking at me. I haven't done anything." }] },
  ],
  'plan.flip.lied': [
    { id: 'kn.l1', turns: [{ by: 'a', dr: "I told {org} I was voting {target} out. I'm not. I haven't looked nervous all day. I'm proud of that." }] },
    { id: 'kn.l2', turns: [{ by: 'a', dr: "I decided no the moment {org} pitched it. I've spent the week making my yes look comfortable." }] },
    { id: 'kn.l3', turns: [{ by: 'a', dr: "{org} counted me. I let {org} do it. That's not the same as promising." }] },
    { id: 'kn.l4', turns: [{ by: 'a', dr: "The lie wasn't in what I said. It was in how easy I made it for {org} to stop asking." }] },
    { id: 'kn.l5', turns: [{ by: 'a', dr: "{org} thinks I'm voting {target} out. {org} is about to find out I'm not." }] },
    { id: 'kn.l6', turns: [{ by: 'a', dr: "Am I sorry? A bit. Am I changing my vote? No." }] },
  ],
  'plan.flip.changed': [
    { id: 'kn.c1', turns: [{ by: 'a', dr: "I agreed to vote {target} out before the campaigning. Then somebody made a better case." }] },
    { id: 'kn.c2', turns: [{ by: 'a', dr: "{org} put me in the count and never checked again. Things changed. I changed with them." }] },
    { id: 'kn.c3', turns: [{ by: 'a', dr: "I don't think of it as breaking a promise. The week changed. Nobody asked me to promise twice." }] },
    { id: 'kn.c4', turns: [{ by: 'a', dr: "My vote isn't going where {org} thinks. {org} will work it out tomorrow." }] },
    { id: 'kn.c5', turns: [{ by: 'a', dr: "It's one vote. {org} counted it as {org.pos}. It was always mine." }] },
    { id: 'kn.c6', turns: [{ by: 'a', dr: "I said yes to {org} earlier in the week. It's not earlier in the week any more." }] },
  ],
  'plan.regroup.retaliates': [
    { id: 'ko.r1', turns: [{ beat: '{a} makes toast for two and gives the second slice to {b}.' }, { by: 'a', say: "Morning!" }, { by: 'b', dr: "{a} knows. {a} definitely knows." }] },
    { id: 'ko.r2', turns: [{ by: 'a', say: "Close one last night, wasn't it?" }, { by: 'b', say: "What do you mean?" }, { by: 'a', say: "Coffee?" }] },
    { id: 'ko.r3', turns: [{ by: 'a', dr: "{b} tried to send me home and couldn't. Now I get to decide what happens next. I'm going to enjoy that." }] },
    { id: 'ko.r4', turns: [{ by: 'a', say: "Sleep well?" }, { by: 'b', say: "Fine." }, { by: 'a', say: "I slept great. Funny, that." }] },
    { id: 'ko.r5', turns: [{ by: 'b', dr: "{a} hasn't stopped smiling at me since the eviction. I'd prefer shouting." }] },
    { id: 'ko.r6', turns: [{ by: 'a', dr: "{b} counted the votes to evict me. {b} came up short. Now {b} is my target." }] },
  ],
  'plan.regroup.polite': [
    { id: 'ko.p1', turns: [{ by: 'b', dr: "{a} has been polite to me all morning. That's the scariest thing that's happened all week." }] },
    { id: 'ko.p2', turns: [{ by: 'a', dr: "Nobody told me, but I know the push came from {b}. I'm keeping that to myself. For now." }] },
    { id: 'ko.p3', turns: [{ by: 'b', dr: "I keep going wherever {a} isn't. {a} has noticed." }] },
    { id: 'ko.p4', turns: [{ by: 'a', say: "No hard feelings." }, { by: 'b', say: "No hard feelings." }, { by: 'a', dr: "Some hard feelings." }] },
    { id: 'ko.p5', turns: [{ by: 'a', dr: "I'm going to be nice to {b}. That way {b} never knows what I know." }] },
    { id: 'ko.p6', turns: [{ by: 'a', say: "Good morning, {b}." }, { by: 'b', say: "...Morning." }, { by: 'a', dr: "I'm watching {b}. {b} knows it." }] },
  ],
};

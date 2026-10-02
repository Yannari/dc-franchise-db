// ══════════════════════════════════════════════════════════════════════
// bb/script/lines/alliance.js — living inside an alliance (Phase 6)
// ══════════════════════════════════════════════════════════════════════
//
// The words for bb-events/alliance-life.js. Each event keeps its casting,
// weight and consequences. {alliance} is the group's name; {target} is the
// week's target when the record has one (a line that says it needs
// `when: { known: true }`).
//
//   alliance.missed    alliance-missed-meeting         the group decided without b; a ran it
//                      left-out
//   alliance.inner     alliance-inner-two              a and b settle things alone; c finds out second
//                      two
//   alliance.overlap   alliance-overlap-compares-notes a is in two groups; b runs {alliance}, c runs {alliance2}
//                      differ
//   alliance.holdout   alliance-unauthorized-vote-fear a will not promise the vote; b organises
//                      refuses
//   alliance.protect   alliance-side-deal-protected    a steers the group off b (a secret deal); c is sharp
//                      caught | steered
//   alliance.blame     alliance-wrong-blame            a pins a stray vote on b, who did not cast it
//                      wrong
//   alliance.slip      alliance-name-slips             a, an outsider, says the group's name; b is in it
//                      name

export default {
  // ── decided without you ─────────────────────────────────────────────
  'alliance.missed.left-out': [
    { id: 'am.l1', turns: [
      { by: 'b', say: "What did I miss?" },
      { by: 'a', say: "Nothing much. We sorted the vote." },
      { by: 'b', say: "Without me?" },
      { by: 'a', say: "You were in the shower. We were going to fill you in." },
      { by: 'b', dr: "\"Going to\". They didn't even think it needed explaining. That's the part that bothers me." },
    ] },
    { id: 'am.l2', when: { known: true }, turns: [
      { by: 'a', say: "So we're all on {target}. Good." },
      { by: 'b', say: "Since when?" },
      { by: 'a', say: "Since last night." },
      { by: 'b', say: "I was here last night." },
      { by: 'a', say: "...In the other room." },
    ] },
    { id: 'am.l3', when: { room: ['bedroom'] }, turns: [
      { beat: '{b} walks into the bedroom just as everybody else in {alliance} is walking out of it.' },
      { by: 'b', say: "Was that a meeting?" },
      { by: 'a', say: "No. Just chatting." },
      { by: 'b', dr: "Every single one of them, in one room, at the same time, \"just chatting\". Right." },
    ] },
    { id: 'am.l4', turns: [
      { by: 'b', say: "Why does everyone else already know the plan?" },
      { by: 'a', say: "It's not a plan, it's more of an idea." },
      { by: 'b', say: "An idea everyone agreed on. Except me, because nobody asked me." },
    ] },
    { id: 'am.l5', turns: [
      { by: 'a', say: "Don't take it personally. It just happened fast." },
      { by: 'b', say: "It's an alliance. Nothing's supposed to happen without me." },
      { by: 'a', say: "Next time. I promise." },
      { by: 'b', dr: "\"Next time\". I'll be watching who leaves the room first from now on." },
    ] },
    { id: 'am.l6', turns: [
      { by: 'b', dr: "I found out what {alliance} decided because somebody mentioned it and then stopped halfway. That's how I find things out now. By accident." },
    ] },
    { id: 'am.l7', turns: [
      { by: 'a', say: "It wasn't a meeting." },
      { by: 'b', say: "Everyone except me was in there." },
      { by: 'a', say: "That's a coincidence." },
      { by: 'b', say: "That's not a coincidence. That's a guest list." },
    ] },
    { id: 'am.l8', turns: [
      { by: 'b', dr: "I'm in {alliance}. I think. I'm starting to feel like the member they tell things to afterwards." },
    ] },
    { id: 'am.l9', when: { known: true }, turns: [
      { by: 'a', say: "You're fine with {target}, right?" },
      { by: 'b', say: "Am I being asked, or am I being told?" },
      { by: 'a', say: "...Asked. Obviously." },
      { by: 'b', dr: "Told. Obviously." },
    ] },
    { id: 'am.l10', turns: [
      { by: 'a', say: "We were going to come and get you." },
      { by: 'b', say: "I was ten feet away, in the hammock." },
      { by: 'a', say: "You looked comfortable." },
      { by: 'b', say: "I'd have got up." },
    ] },
    { id: 'am.l11', turns: [
      { by: 'b', dr: "Nobody lied to me. Nobody needed to. They just didn't think I needed to know. That's worse." },
    ] },
    { id: 'am.l12', when: { registerB: 'fiery' }, turns: [
      { by: 'b', say: "So I'm in this alliance for decoration?" },
      { by: 'a', say: "Keep your voice down." },
      { by: 'b', say: "Why? Everyone else already knows everything!" },
    ] },
    { id: 'am.l13', when: { registerB: 'cool' }, turns: [
      { by: 'b', dr: "Fine. They can meet without me. I'll start meeting without them. Two can play at that." },
    ] },
    { id: 'am.l14', when: { registerB: 'shy' }, turns: [
      { by: 'b', dr: "I didn't say anything. I never say anything. Maybe that's why they don't bother asking me." },
    ] },
    { id: 'am.l15', turns: [
      { by: 'b', say: "Anything I should know?" },
      { by: 'a', say: "Not really." },
      { by: 'b', dr: "\"Not really\" means yes, and it means nobody is going to tell me." },
    ] },
    { id: 'am.l16', turns: [
      { by: 'a', say: "Sorry, we should have waited for you." },
      { by: 'b', say: "Yes. You should have." },
      { by: 'a', say: "It won't happen again." },
      { by: 'b', say: "It's happened twice this week." },
    ] },
    { id: 'am.l17', turns: [
      { beat: '{b} walks in to find the conversation stop mid-sentence and restart, a little too brightly, about breakfast.' },
      { by: 'b', dr: "Nobody in this house has ever been that interested in breakfast." },
    ] },
    { id: 'am.l18', turns: [
      { by: 'b', say: "Am I still in {alliance}, or did that change too?" },
      { by: 'a', say: "Of course you're still in." },
      { by: 'b', say: "Then act like it. Wait for me." },
    ] },
    { id: 'am.l19', when: { registerB: 'sweet' }, turns: [
      { by: 'b', dr: "I don't want to make a fuss. I really don't. But it hurts being the last to know in my own alliance." },
    ] },
    { id: 'am.l20', when: { registerB: 'schemer' }, turns: [
      { by: 'b', dr: "They decided without me. Fine. Now I get to decide without them, and they won't see it coming." },
    ] },
  ],

  // ── the two inside the alliance ────────────────────────────────────
  'alliance.inner.two': [
    { id: 'ai.t1', when: { known: true }, turns: [
      { beat: '{a} and {b} come down the stairs together before anyone else is up.' },
      { by: 'a', say: "{c}, morning. So, {alliance} is going with {target} this week." },
      { by: 'c', say: "When did {alliance} decide that?" },
      { by: 'b', say: "Last night." },
      { by: 'c', dr: "Last night, where? I was in {alliance} last night too. Nobody asked me." },
    ] },
    { id: 'ai.t2', turns: [
      { by: 'c', say: "When did we agree on this?" },
      { by: 'b', say: "Last night." },
      { by: 'c', say: "Where?" },
      { by: 'a', say: "Does it matter?" },
      { by: 'c', dr: "It matters. It means there's a group inside the group, and I'm not in it." },
    ] },
    { id: 'ai.t3', turns: [
      { by: 'a', say: "We just talked it through so it'd be quicker." },
      { by: 'c', say: "Quicker than asking me?" },
      { by: 'a', say: "Quicker than asking everyone." },
      { by: 'c', dr: "{a} meant that kindly. I heard it the other way." },
    ] },
    { id: 'ai.t4', turns: [
      { by: 'c', dr: "There's {alliance}, and then there's {a} and {b}. They never have to explain anything to each other. The rest of us get the summary." },
    ] },
    { id: 'ai.t5', turns: [
      { by: 'a', say: "{b} and I think we should go a different way this week." },
      { by: 'c', say: "You and {b} think. Is anyone else allowed to think?" },
      { by: 'b', say: "Of course. Go on." },
      { by: 'c', say: "...It's fine. Whatever you two decided." },
    ] },
    { id: 'ai.t6', turns: [
      { beat: '{a} and {b} share a look across the table. {c} sees it, and sees that it was not meant to be seen.' },
      { by: 'c', dr: "I'm not being cut out. I'm just never one of the first two people told. That's a different thing. It still hurts." },
    ] },
    { id: 'ai.t7', turns: [
      { by: 'c', say: "Can I ask you something, {a}? Who's your number one in here?" },
      { by: 'a', say: "The whole group." },
      { by: 'c', say: "That's not a person." },
      { by: 'a', say: "...{b}. Probably." },
    ] },
    { id: 'ai.t8', turns: [
      { by: 'a', dr: "{b} and I decide. Then we tell the others. It's not personal, it's efficient." },
      { beat: 'Across the room, {c} is counting how many times this week that has happened.' },
    ] },
    { id: 'ai.t9', turns: [
      { by: 'b', say: "Don't worry, {c}, we'll talk it through with everyone." },
      { by: 'c', say: "After you've decided." },
      { by: 'b', say: "That's not fair." },
      { by: 'c', say: "Is it wrong, though?" },
    ] },
    { id: 'ai.t10', when: { register: 'schemer' }, turns: [
      { by: 'a', dr: "Every alliance needs a smaller alliance inside it. Mine is {b}. Everyone else in {alliance} is very useful and very replaceable." },
    ] },
    { id: 'ai.t11', turns: [
      { by: 'c', say: "Did you two already decide?" },
      { by: 'a', say: "We just talked about it." },
      { by: 'c', say: "That's what deciding is." },
    ] },
    { id: 'ai.t12', turns: [
      { by: 'b', say: "We wanted to run it past you." },
      { by: 'c', say: "Past me. After you'd agreed it." },
      { by: 'b', say: "We wanted your opinion." },
      { by: 'c', say: "My opinion is that I'd like to be asked first, for once." },
    ] },
    { id: 'ai.t13', turns: [
      { by: 'c', dr: "If {alliance} ever has to cut somebody, it'll be decided by {a} and {b}. And I know it won't be one of them." },
    ] },
    { id: 'ai.t14', when: { registerB: 'cool' }, turns: [
      { by: 'b', dr: "{a} and I run {alliance}. Everybody else is a vote. I don't say that out loud, obviously." },
    ] },
  ],

  // ── two alliances, two versions of the week ───────────────────────
  // a is in both. b runs {alliance}; c runs {alliance2}.
  'alliance.overlap.differ': [
    { id: 'ao.d1', turns: [
      { by: 'a', dr: "{b} explained the week to me in the pantry. Forty minutes later {c} explained the same week in the backyard. Same week. Different people at the bottom of it." },
    ] },
    { id: 'ao.d2', turns: [
      { by: 'b', say: "Same page?" },
      { by: 'a', say: "Same page." },
      { by: 'a', dr: "I've been on two pages since both groups formed. Today the two pages started arguing with each other." },
    ] },
    { id: 'ao.d3', turns: [
      { by: 'c', say: "So it's agreed. We protect the group." },
      { by: 'a', say: "Agreed." },
      { by: 'a', dr: "{b} told me the exact same thing an hour ago. Protect the group. Just not the same group." },
    ] },
    { id: 'ao.d4', when: { known: true }, turns: [
      { by: 'a', dr: "In {alliance}, {target} going is a win. In {alliance2}, {target} going is a disaster. I'm in both. I have no idea what face to make." },
    ] },
    { id: 'ao.d5', turns: [
      { by: 'a', say: "And {alliance2} thinks... I mean, I think..." },
      { by: 'b', say: "What did you just say?" },
      { by: 'a', say: "Nothing. Anyway. Who wants tea?" },
      { by: 'a', dr: "I nearly said the other group's name to the wrong group. I need to sleep more." },
    ] },
    { id: 'ao.d6', turns: [
      { by: 'a', dr: "Both stories are true. That's the problem. {b} and {c} both want to protect the group. They just mean different lists of people." },
    ] },
    { id: 'ao.d7', turns: [
      { by: 'c', say: "You've been quiet. Something on your mind?" },
      { by: 'a', say: "Just thinking about the vote." },
      { by: 'a', dr: "I was thinking that one of my two alliances has me at the bottom. I just haven't worked out which one yet." },
    ] },
    { id: 'ao.d8', turns: [
      { by: 'b', say: "You're with us, right? Not split?" },
      { by: 'a', say: "Why would I be split?" },
      { by: 'b', say: "No reason. Just checking." },
      { by: 'a', dr: "{b} has a reason. {b} always has a reason." },
    ] },
    { id: 'ao.d9', when: { register: 'schemer' }, turns: [
      { by: 'a', dr: "Two alliances, two sets of information, one me. When they compare notes, I'm in trouble. Until then, I'm the best-informed person in this house." },
    ] },
  ],

  // ── the one who won't say the name ─────────────────────────────────
  'alliance.holdout.refuses': [
    { id: 'ah.r1', turns: [
      { by: 'b', say: "Let's go round. Everybody say the name." },
      { beat: 'One by one, everybody does. Then it is {a}\'s turn.' },
      { by: 'a', say: "I'll vote with the house." },
      { by: 'b', say: "That's not a name." },
      { by: 'a', say: "It's an answer." },
    ] },
    { id: 'ah.r2', turns: [
      { by: 'a', say: "I'm not locking anything in before the vote." },
      { by: 'b', say: "We're an alliance. Locking it in is the whole point." },
      { by: 'a', say: "Then the whole point can wait until Thursday." },
      { beat: 'The temperature in the room drops about four degrees.' },
    ] },
    { id: 'ah.r3', turns: [
      { by: 'b', say: "Just tell us where your vote's going." },
      { by: 'a', say: "Probably the same way as yours." },
      { by: 'b', say: "\"Probably\"?" },
      { by: 'b', dr: "There is no version of the word \"probably\" that I like right now." },
    ] },
    { id: 'ah.r4', turns: [
      { by: 'a', say: "I want to hear both nominees out first." },
      { by: 'b', say: "Why? We know what we're doing." },
      { by: 'a', say: "You know what you're doing. I'm still deciding." },
      { by: 'b', dr: "The most reasonable sentence anybody's said all day, and it's got every one of us worried." },
    ] },
    { id: 'ah.r5', when: { known: true }, turns: [
      { by: 'b', say: "{target}. Yes or no?" },
      { by: 'a', say: "I'll tell you on Thursday." },
      { by: 'b', say: "We need to know now." },
      { by: 'a', say: "And I need to know on Thursday." },
    ] },
    { id: 'ah.r6', turns: [
      { by: 'b', say: "Nobody in {alliance} has ever refused to say the name before." },
      { by: 'a', say: "Nobody in {alliance} has ever been asked to promise it in writing before, either." },
      { by: 'b', say: "Nobody's asking for writing." },
      { by: 'a', say: "It feels like it." },
    ] },
    { id: 'ah.r7', turns: [
      { by: 'a', dr: "Everyone wants my vote locked up a week early. If I'm not allowed to change my mind, it's not my vote. It's theirs." },
    ] },
    { id: 'ah.r8', turns: [
      { by: 'b', say: "Is something going on we should know about?" },
      { by: 'a', say: "No. I just don't like being told." },
      { by: 'b', say: "We're not telling, we're asking." },
      { by: 'a', say: "Then I'm answering. Later." },
    ] },
  ],

  // ── a secret deal, quietly protected ───────────────────────────────
  // a has a deal with b (not in the room) and steers the group off b. c is the sharp one.
  'alliance.protect.caught': [
    { id: 'ap.c1', turns: [
      { by: 'c', say: "What about {b} as the backup?" },
      { by: 'a', say: "{b}? No. Nobody's scared of {b}. That's exactly why {b} is worth keeping around." },
      { by: 'c', dr: "That answer was ready before I'd finished the question. {a} has a reason to protect {b}, and it's not the one {a} just gave." },
    ] },
    { id: 'ap.c2', turns: [
      { by: 'c', dr: "Every time {b}'s name comes up, {a} has a better name. Every single time. That's not a coincidence any more." },
    ] },
    { id: 'ap.c3', turns: [
      { by: 'c', say: "You really don't want {b} going, do you?" },
      { by: 'a', say: "I just don't think it's the right move." },
      { by: 'c', say: "You never think it's the right move. Not once." },
      { by: 'a', say: "...{b} just isn't a threat." },
    ] },
    { id: 'ap.c4', turns: [
      { by: 'a', say: "Let's not waste a nomination on {b}." },
      { by: 'c', say: "Why are you so sure it'd be a waste?" },
      { by: 'a', say: "I just am." },
      { by: 'c', dr: "\"I just am\" is what people say when they can't say why. {a} has got a deal with {b}. I'd bet on it." },
    ] },
    { id: 'ap.c5', turns: [
      { by: 'c', dr: "{a} never argues against {b}. {a} just always has someone better. It's a small thing. I'm keeping it." },
    ] },
    { id: 'ap.c6', when: { register: 'schemer' }, turns: [
      { by: 'a', say: "{b}? Please. {b} couldn't win a game of cards." },
      { by: 'c', say: "Funny. You defend {b} more than you defend me." },
      { by: 'a', say: "That's not true." },
      { by: 'c', say: "Then nominate {b}." },
    ] },
    { id: 'ap.c7', turns: [
      { by: 'c', say: "Have you and {b} got something going on?" },
      { by: 'a', say: "What? No." },
      { by: 'c', say: "You answered that very fast." },
    ] },
  ],
  'alliance.protect.steered': [
    { id: 'ap.s1', turns: [
      { by: 'c', say: "What about {b}?" },
      { by: 'a', say: "Honestly? Waste of a vote. {b} isn't going to win anything." },
      { by: 'c', say: "Fair point." },
      { by: 'a', dr: "{b} and I have a deal. Nobody in this group knows it, and that's how it stays." },
    ] },
    { id: 'ap.s2', turns: [
      { by: 'a', say: "If we're picking a backup, I think there are better options than {b}." },
      { by: 'c', say: "Like who?" },
      { by: 'a', say: "Anyone with a comp win. {b} hasn't got one." },
      { by: 'c', say: "...True." },
    ] },
    { id: 'ap.s3', turns: [
      { by: 'a', dr: "I steer them off {b} the way you steer a car round a pothole. Smoothly, and without ever mentioning the pothole." },
    ] },
    { id: 'ap.s4', turns: [
      { by: 'c', say: "{b} would be an easy vote." },
      { by: 'a', say: "Easy, sure. Useful? I don't think so." },
      { by: 'c', say: "Go on." },
      { by: 'a', say: "Get rid of {b} now and the real threats all get a free week." },
    ] },
    { id: 'ap.s5', turns: [
      { by: 'a', say: "Agreed, {b} is the backup." },
      { beat: 'Ten minutes later, {a} has a better backup plan. Five minutes after that, a better one still.' },
      { by: 'a', dr: "I agreed. I didn't say I'd stop talking." },
    ] },
    { id: 'ap.s6', turns: [
      { by: 'a', dr: "Protecting someone in here is easy. You never say \"don't\". You just keep saying \"what about...\"." },
    ] },
    { id: 'ap.s7', turns: [
      { by: 'c', say: "Should {b} be on our list?" },
      { by: 'a', say: "Bottom of it, maybe. There's bigger fish." },
      { by: 'c', say: "Bigger fish. Okay." },
    ] },
  ],

  // ── a stray vote, blamed on the wrong person ───────────────────────
  // a accuses; b did not do it.
  'alliance.blame.wrong': [
    { id: 'ab.w1', turns: [
      { by: 'a', say: "Somebody in this group voted the other way." },
      { by: 'b', say: "It wasn't me." },
      { by: 'a', say: "Nobody said it was." },
      { by: 'b', say: "Everybody's looking at me like it was." },
    ] },
    { id: 'ab.w2', turns: [
      { by: 'b', say: "It wasn't me." },
      { by: 'a', say: "Okay." },
      { by: 'b', say: "It really wasn't me!" },
      { by: 'a', dr: "Once, calmly? Fine. Twice, louder? That's how guilty people sound." },
    ] },
    { id: 'ab.w3', turns: [
      { by: 'b', dr: "I didn't do it. And every single person in {alliance} has decided that I did. Nobody's angry with me. That's how I know." },
    ] },
    { id: 'ab.w4', turns: [
      { by: 'a', say: "We just want the truth." },
      { by: 'b', say: "The truth is I voted with you." },
      { by: 'a', say: "Then somebody else is lying." },
      { by: 'b', say: "Yes! Somebody else is lying! That's what I've been saying!" },
    ] },
    { id: 'ab.w5', turns: [
      { beat: '{a} stops talking every time {b} walks into the room. By the evening, the rest of {alliance} has started doing the same.' },
      { by: 'b', dr: "Nobody's accused me of anything. I've just been quietly found guilty." },
    ] },
    { id: 'ab.w6', turns: [
      { by: 'a', dr: "I haven't got proof it was {b}. I've got a feeling, and in here a feeling is usually enough." },
    ] },
    { id: 'ab.w7', turns: [
      { by: 'b', say: "Why does everyone think it was me?" },
      { by: 'a', say: "Because you were never really with us." },
      { by: 'b', say: "I've been with you since week one!" },
      { by: 'a', say: "Then who was it?" },
      { by: 'b', say: "I don't know! Not me!" },
    ] },
  ],

  // ── the alliance's name, said out loud ─────────────────────────────
  // a is outside the group; b is in it.
  'alliance.slip.name': [
    { id: 'an.n1', when: { room: ['kitchen'] }, turns: [
      { by: 'a', say: "Well, that's {alliance} for you, isn't it?" },
      { beat: '{b} keeps drying the same plate for a lot longer than the plate needs.' },
      { by: 'b', dr: "How does {a} know the name? Nobody outside the group is supposed to know there IS a name." },
    ] },
    { id: 'an.n2', turns: [
      { by: 'a', say: "Is {alliance} having another meeting tonight?" },
      { by: 'b', say: "Is who having what?" },
      { by: 'a', say: "Come on. Everyone knows." },
      { by: 'b', dr: "Everyone knows. Brilliant. Absolutely brilliant." },
    ] },
    { id: 'an.n3', turns: [
      { by: 'a', say: "What do you lot call yourselves? {alliance}, right?" },
      { by: 'b', say: "I don't know what you're talking about." },
      { by: 'a', say: "Sure you don't." },
    ] },
    { id: 'an.n4', when: { room: ['kitchen'] }, turns: [
      { by: 'a', say: "Pass the salt. Unless {alliance} needs it for a meeting." },
      { beat: 'Half the table laughs. The half that laughs is entirely people who are not in {alliance}.' },
    ] },
    { id: 'an.n5', turns: [
      { by: 'a', dr: "They think nobody knows about {alliance}. I've known for days. I just said it at breakfast to watch their faces." },
    ] },
    { id: 'an.n6', turns: [
      { by: 'a', say: "I'm not trying to start anything. I just think {alliance} is a funny name." },
      { by: 'b', say: "Never heard of it." },
      { by: 'a', say: "You went red." },
      { by: 'b', say: "It's warm in here." },
    ] },
    { id: 'an.n7', turns: [
      { by: 'b', dr: "{a} said our name out loud, casually, in front of everyone. If I react, I confirm it. If I don't, I confirm it. There's no good face to make." },
    ] },
    { id: 'an.n8', turns: [
      { by: 'a', say: "So who's in {alliance}? Just out of interest." },
      { by: 'b', say: "There's no such thing." },
      { by: 'a', say: "That's exactly what someone in it would say." },
    ] },
    { id: 'an.n9', when: { register: 'schemer' }, turns: [
      { by: 'a', dr: "I said {alliance} out loud on purpose. Now every one of them is wondering who leaked it. They'll do my work for me." },
    ] },
    { id: 'an.n10', turns: [
      { by: 'a', say: "Big {alliance} meeting tonight?" },
      { by: 'b', say: "I genuinely have no idea what you mean." },
      { by: 'b', dr: "I had an idea exactly what {a} meant. So did every other member of {alliance} at the table." },
    ] },
    { id: 'an.n11', turns: [
      { by: 'a', say: "Don't worry, I won't tell anyone about {alliance}." },
      { by: 'b', say: "There's nothing to tell." },
      { by: 'a', say: "Then I definitely won't tell anyone." },
    ] },
    { id: 'an.n12', turns: [
      { by: 'b', say: "Where did you hear that name?" },
      { by: 'a', say: "Around." },
      { by: 'b', say: "Around where?" },
      { by: 'a', say: "Around the house. You lot aren't as quiet as you think." },
    ] },
    { id: 'an.n13', turns: [
      { by: 'a', dr: "{alliance}. They gave themselves a name. Nobody who's going to win this game gives their alliance a name." },
    ] },
    { id: 'an.n14', turns: [
      { by: 'a', say: "Say hi to the rest of {alliance} for me." },
      { by: 'b', say: "I'll pass it on to... nobody. Because it doesn't exist." },
      { by: 'b', dr: "That was the worst denial I have ever given. I need to sit down." },
    ] },
    { id: 'an.n15', when: { register: 'fiery' }, turns: [
      { by: 'a', say: "Oh, come off it! Everyone knows about {alliance}! Stop pretending!" },
      { by: 'b', say: "Can you not shout that?" },
      { by: 'a', say: "Why? It's not a secret!" },
    ] },
  ],
};

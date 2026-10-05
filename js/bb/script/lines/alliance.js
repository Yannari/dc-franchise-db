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
      { by: 'b', say: "That's not a coincidence. You left me out on purpose." },
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
      { by: 'b', dr: "\"Not really\". So something happened, and nobody's going to tell me." },
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
      { beat: '{a} and {b} share a look across the table. {c} sees it.' },
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
      { beat: 'Across the room, {c} looks annoyed.' },
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
      { by: 'a', dr: "{b} told me the plan in the pantry. Then {c} told me a different plan in the backyard. They can't both be true." },
    ] },
    { id: 'ao.d2', turns: [
      { by: 'b', say: "Same page?" },
      { by: 'a', say: "Same page." },
      { by: 'a', dr: "I've been in both groups since they started. Today I found out they want different things." },
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
      { by: 'a', dr: "{b} and {c} both say they're protecting the group. They just don't mean the same people." },
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
      { beat: 'Nobody in the room says anything for a while.' },
    ] },
    { id: 'ah.r3', turns: [
      { by: 'b', say: "Just tell us where your vote's going." },
      { by: 'a', say: "Probably the same way as yours." },
      { by: 'b', say: "\"Probably\"?" },
      { by: 'b', dr: "\"Probably\" isn't good enough. Not this week." },
    ] },
    { id: 'ah.r4', turns: [
      { by: 'a', say: "I want to hear both nominees out first." },
      { by: 'b', say: "Why? We know what we're doing." },
      { by: 'a', say: "You know what you're doing. I'm still deciding." },
      { by: 'b', dr: "It sounds reasonable. But it's got all of us worried." },
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
      { by: 'c', dr: "{a} couldn't give me a reason. {a} has got a deal with {b}. I'd bet on it." },
    ] },
    { id: 'ap.c5', turns: [
      { by: 'c', dr: "{a} never argues against {b}. {a} just always has someone better. It's a small thing, but I'm going to remember it." },
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
      { by: 'a', dr: "Every time {b}'s name comes up, I change the subject. Nobody's noticed yet." },
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
      { by: 'a', dr: "Protecting someone is easy. I never argue. I just keep suggesting other names." },
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
      { by: 'a', dr: "{b} said it once, calmly. Then again, louder. That sounds guilty to me." },
    ] },
    { id: 'ab.w3', turns: [
      { by: 'b', dr: "I didn't do it. And every single person in {alliance} has decided that I did. Nobody's even angry with me. They've just decided." },
    ] },
    { id: 'ab.w4', turns: [
      { by: 'a', say: "We just want the truth." },
      { by: 'b', say: "The truth is I voted with you." },
      { by: 'a', say: "Then somebody else is lying." },
      { by: 'b', say: "Yes! Somebody else is lying! That's what I've been saying!" },
    ] },
    { id: 'ab.w5', turns: [
      { beat: '{a} stops talking every time {b} walks into the room. By the evening, the rest of {alliance} has started doing the same.' },
      { by: 'b', dr: "Nobody's actually accused me. They've all just decided it was me." },
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
      { beat: '{b} keeps drying the same plate and doesn\'t say a word.' },
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
      { beat: 'Half the table laughs. Everybody laughing is somebody who isn\'t in {alliance}.' },
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
      { by: 'b', dr: "{a} said our name out loud, casually, in front of everyone. I didn't know how to react. Anything I said would have given it away." },
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
      { by: 'b', dr: "I knew exactly what {a} meant. So did every other member of {alliance} at the table." },
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

  'alliance.formed.formed': [
    { id: 'af.f1', when: { room: ['bedroom'] }, turns: [
      { beat: 'One by one, {a}, {b} and the others drift into the bedroom and close the door.' },
      { by: 'a', say: "Okay. Are we doing this properly?" },
      { by: 'b', say: "We're doing it properly. We need a name." },
      { by: 'a', say: "{alliance}." },
      { by: 'b', say: "...Fine. {alliance}. Nobody outside this room hears it." },
    ] },
    { id: 'af.f2', turns: [
      { by: 'a', say: "Let's make it official. Us. An alliance." },
      { by: 'b', say: "Does it need a name?" },
      { by: 'a', say: "Everything needs a name. {alliance}." },
      { by: 'b', dr: "I've been in alliances before. This is the first one I believe in." },
    ] },
    { id: 'af.f3', turns: [
      { by: 'b', say: "Rules. Nobody makes a deal outside the group without telling the group." },
      { by: 'a', say: "Agreed." },
      { by: 'b', say: "And nobody says {alliance} out loud. Ever." },
      { by: 'a', say: "You just said it out loud." },
      { by: 'b', say: "That one doesn't count." },
    ] },
    { id: 'af.f4', when: { room: ['bedroom'] }, turns: [
      { by: 'a', say: "Leave one at a time. Don't make it obvious." },
      { beat: 'They leave the bedroom one at a time, at very obvious two-minute intervals.' },
    ] },
    { id: 'af.f5', turns: [
      { by: 'a', dr: "We named it {alliance}. Is it a bit much? Probably. Do I love it? Absolutely." },
    ] },
    { id: 'af.f6', when: { third: true }, turns: [
      { by: 'c', say: "So who's in charge?" },
      { by: 'a', say: "Nobody's in charge. We decide together." },
      { by: 'b', say: "That's what people say right before somebody's in charge." },
    ] },
    { id: 'af.f7', turns: [
      { by: 'b', say: "Hands in. For {alliance}." },
      { by: 'a', say: "We're doing hands in?" },
      { by: 'b', say: "We're doing hands in." },
      { beat: 'Hands go in. Somebody whispers "{alliance}", far too loudly.' },
    ] },
    { id: 'af.f8', when: { early: true }, turns: [
      { by: 'a', say: "It's early. That's exactly why we should do this now, before everybody else does." },
      { by: 'b', say: "Then let's be first. {alliance}." },
    ] },
  ],
  // Why an alliance forms, said before it is named. The ending is the reason the lifecycle
  // recorded (shared-strategy.js formationTriggers); a is the one who starts the talk.
  'alliance.why.strategic-pitch': [
    { id: 'aw.p1', when: { room: ['bedroom'] }, turns: [
      { by: 'a', say: "Can I grab you for a minute? Not out here." },
      { beat: '{a} shuts the bedroom door.' },
      { by: 'a', say: "I've talked to pretty much everyone now. You're the one I want to work with." },
      { by: 'b', say: "Why me?" },
      { by: 'a', say: "Because you were listening while everybody else was talking." },
    ] },
    { id: 'aw.p2', turns: [
      { by: 'a', say: "People are already pairing off. I can see it happening." },
      { by: 'b', say: "So can I." },
      { by: 'a', say: "I'd rather be in a group than be the one left out of all of them." },
      { by: 'b', say: "What are you asking?" },
      { by: 'a', say: "I'm asking you to be in mine." },
    ] },
    { id: 'aw.p3', when: { early: true }, turns: [
      { by: 'a', say: "Nobody knows anybody yet. That's exactly why we should decide now who we trust." },
      { by: 'b', say: "And you trust me?" },
      { by: 'a', say: "More than anybody else I've met so far." },
    ] },
    { id: 'aw.p4', when: { third: true, room: ['bedroom'] }, turns: [
      { beat: '{a} brings {b} and {c} into the bedroom, one at a time.' },
      { by: 'c', say: "What is this?" },
      { by: 'a', say: "The three people in this house I actually want to win with." },
    ] },
    { id: 'aw.p5', when: { early: false }, turns: [
      { by: 'a', say: "Everybody else has a group by now. We don't." },
      { by: 'b', say: "I know. I've been feeling it." },
      { by: 'a', say: "Then let's fix that." },
    ] },
    { id: 'aw.p6', turns: [
      { by: 'a', say: "I'm going to be straight with you, because I think you'd see through anything else." },
      { by: 'b', say: "Go on." },
      { by: 'a', say: "I want to work with you. Properly. Not a 'let's see how it goes'." },
    ] },
    { id: 'aw.p7', turns: [
      { by: 'b', say: "You've been watching everybody all day." },
      { by: 'a', say: "And you're the one I keep coming back to." },
      { by: 'b', say: "Is that a compliment or a pitch?" },
      { by: 'a', say: "Both." },
    ] },
  ],
  'alliance.why.close-pair': [
    { id: 'aw.c1', when: { early: true }, turns: [
      { by: 'a', say: "We've barely left each other's side since we walked in." },
      { by: 'b', say: "I noticed." },
      { by: 'a', say: "People are going to think we're working together anyway." },
      { by: 'b', say: "Then we might as well actually do it." },
    ] },
    { id: 'aw.c2', turns: [
      { by: 'a', say: "You're the only person in here I'd tell the truth to." },
      { by: 'b', say: "Same." },
      { by: 'a', say: "So let's stop pretending we're not a team." },
    ] },
    { id: 'aw.c3', when: { early: false }, turns: [
      { by: 'a', say: "Everyone already thinks we're working together." },
      { by: 'b', say: "We sort of are." },
      { by: 'a', say: "Then let's make it real." },
    ] },
    { id: 'aw.c4', turns: [
      { by: 'b', say: "If one of us goes up, the other one's going to be next anyway." },
      { by: 'a', say: "So we might as well protect each other on purpose." },
    ] },
    { id: 'aw.c5', turns: [
      { by: 'a', say: "Can I tell you something? You're the only person in here I actually like." },
      { by: 'b', say: "Same. Is that bad?" },
      { by: 'a', say: "It's only bad if we don't use it." },
    ] },
    { id: 'aw.c6', turns: [
      { by: 'a', dr: "{b} and I just get on. It's not strategy. But in this house, everything turns into strategy eventually." },
    ] },
  ],
  'alliance.why.shared-enemy': [
    { id: 'aw.e1', when: { known: true }, turns: [
      { by: 'a', say: "Can I be honest about {target}?" },
      { by: 'b', say: "Please." },
      { by: 'a', say: "I don't trust {target}." },
      { by: 'b', say: "Neither do I. Not even a little." },
      { by: 'a', say: "Then we should be looking out for each other." },
    ] },
    { id: 'aw.e2', when: { known: true }, turns: [
      { by: 'b', say: "What do you make of {target}?" },
      { by: 'a', say: "Honestly? I don't like {target}." },
      { by: 'b', say: "Oh, thank God. Me neither." },
    ] },
    { id: 'aw.e3', turns: [
      { by: 'a', say: "We want the same person gone. We both know who." },
      { by: 'b', say: "We do." },
      { by: 'a', say: "Then we're on the same side." },
    ] },
    { id: 'aw.e4', when: { known: true }, turns: [
      { by: 'a', say: "Am I the only one who thinks {target} is running this house?" },
      { by: 'b', say: "No. You're really not." },
    ] },
    { id: 'aw.e5', turns: [
      { by: 'b', say: "I keep ending up on the wrong side of the same person." },
      { by: 'a', say: "So do I. That makes us the right side." },
    ] },
    { id: 'aw.e6', turns: [
      { by: 'a', say: "We don't have to like each other much. We just have to want the same thing." },
      { by: 'b', say: "We do want the same thing." },
    ] },
  ],
  'alliance.why.survival-pact': [
    { id: 'aw.s1', turns: [
      { by: 'a', say: "Have you noticed nobody comes to talk to us?" },
      { by: 'b', say: "All day. I thought it was just me." },
      { by: 'a', say: "Then we talk to each other." },
    ] },
    { id: 'aw.s2', turns: [
      { by: 'a', say: "If they're picking people to get rid of, it's us two first." },
      { by: 'b', say: "I know." },
      { by: 'a', say: "So we stick together. Nobody else is going to stick with us." },
    ] },
    { id: 'aw.s3', turns: [
      { by: 'b', say: "Every group in this house has a name except ours." },
      { by: 'a', say: "Because we're not in one." },
      { by: 'b', say: "So let's be one." },
    ] },
    { id: 'aw.s4', turns: [
      { by: 'a', dr: "{b} and I are on the outside of everything in here. Two people on the outside is a start." },
    ] },
    { id: 'aw.s5', turns: [
      { by: 'a', say: "Nobody's going to save us." },
      { by: 'b', say: "Then we save each other." },
    ] },
    { id: 'aw.s6', turns: [
      { by: 'b', say: "When they need a name for the block, it's going to be one of us." },
      { by: 'a', say: "Unless there are two of us asking for votes instead of one." },
    ] },
  ],
  'alliance.why.shared-block': [
    { id: 'aw.b1', turns: [
      { by: 'a', say: "We sat on that block together." },
      { by: 'b', say: "And we're both still here." },
      { by: 'a', say: "Let's keep it that way." },
    ] },
    { id: 'aw.b2', turns: [
      { by: 'b', say: "Whoever put us up there thought we'd turn on each other." },
      { by: 'a', say: "We didn't." },
      { by: 'b', say: "So let's make them regret it." },
    ] },
    { id: 'aw.b3', turns: [
      { by: 'a', dr: "{b} and I sat next to each other on the block. You learn a lot about somebody in those chairs." },
    ] },
    { id: 'aw.b4', turns: [
      { by: 'b', say: "We both got told we were pawns." },
      { by: 'a', say: "Nobody's going to use us like that again." },
    ] },
    { id: 'aw.b5', turns: [
      { by: 'a', say: "You never once threw me under the bus up there." },
      { by: 'b', say: "Neither did you." },
      { by: 'a', say: "That's worth something in here." },
    ] },
    { id: 'aw.b6', turns: [
      { by: 'b', say: "Same chairs, same week, same people wanting us gone." },
      { by: 'a', say: "So same side." },
    ] },
  ],
  'alliance.why.genuine-deal': [
    { id: 'aw.d1', turns: [
      { by: 'a', say: "We already shook on it." },
      { by: 'b', say: "We did." },
      { by: 'a', say: "Then let's make it more than a handshake." },
    ] },
    { id: 'aw.d2', turns: [
      { by: 'b', say: "That deal we made. Did you mean it?" },
      { by: 'a', say: "Every word." },
      { by: 'b', say: "Me too. So let's build on it." },
    ] },
    { id: 'aw.d3', turns: [
      { by: 'a', dr: "{b} kept every promise so far. In this house, that makes {b} the most valuable person I know." },
    ] },
    { id: 'aw.d4', turns: [
      { by: 'b', say: "You haven't gone back on one thing you told me." },
      { by: 'a', say: "And I'm not going to start." },
    ] },
    { id: 'aw.d5', turns: [
      { by: 'a', say: "Our deal's held. Everybody else's has fallen apart." },
      { by: 'b', say: "So let's make it permanent." },
    ] },
    { id: 'aw.d6', turns: [
      { by: 'b', say: "I trust you. I didn't expect to say that in here." },
      { by: 'a', say: "Then let's do something with it." },
    ] },
  ],
  'alliance.formed.inner': [
    { id: 'af.i1', turns: [
      { by: 'a', say: "We're still in {alliance2}. Nothing changes there." },
      { by: 'b', say: "But between us?" },
      { by: 'a', say: "Between us, we protect each other first. Always." },
      { by: 'b', dr: "An alliance inside the alliance. We called it {alliance}. The others can never find out." },
    ] },
    { id: 'af.i2', turns: [
      { by: 'b', say: "If {alliance2} ever has to cut somebody..." },
      { by: 'a', say: "It won't be one of us." },
      { by: 'b', say: "Then we've got a deal." },
    ] },
    { id: 'af.i3', turns: [
      { by: 'a', dr: "{alliance2} is the big group. {alliance} is the one that really matters, and only we know about it." },
    ] },
    { id: 'af.i4', turns: [
      { by: 'b', say: "We go back out there and act completely normal." },
      { by: 'a', say: "I always act completely normal." },
      { by: 'b', say: "That's what worries me." },
    ] },
    { id: 'af.i5', turns: [
      { by: 'a', say: "Do you trust everyone in {alliance2}?" },
      { by: 'b', say: "Honestly? No." },
      { by: 'a', say: "Neither do I. So let's trust each other." },
    ] },
    { id: 'af.i6', when: { room: ['pantry'] }, turns: [
      { beat: '{a} and {b} come back from the storage room separately, two minutes apart, and rejoin the rest of {alliance2} as if nothing happened.' },
      { by: 'b', dr: "Something did happen. We made {alliance}." },
    ] },
  ],
  'alliance.recruited.joined': [
    { id: 'ar.j1', turns: [
      { by: 'b', say: "We'd like you in. With us. In {alliance}." },
      { by: 'a', say: "...Yes. Absolutely yes." },
      { by: 'a', say: "Who else knows about it?" },
      { by: 'b', say: "Nobody outside this room. That's the point." },
    ] },
    { id: 'ar.j2', turns: [
      { by: 'b', say: "There's a group. We think you belong in it." },
      { by: 'a', say: "Why me?" },
      { by: 'b', say: "Because you keep your mouth shut and you vote with your head." },
      { by: 'a', say: "I'll take that as a compliment." },
    ] },
    { id: 'ar.j3', turns: [
      { by: 'a', dr: "I've been invited into {alliance}. I've had my suspicions about them for days. Now I'm one of them." },
    ] },
    { id: 'ar.j4', turns: [
      { by: 'b', say: "Before we tell you anything, are you in?" },
      { by: 'a', say: "In what?" },
      { by: 'b', say: "In or out?" },
      { by: 'a', say: "...In." },
      { by: 'b', say: "Good. Welcome to {alliance}." },
    ] },
    { id: 'ar.j5', when: { third: true }, turns: [
      { by: 'c', say: "We wanted to talk to you before anyone else did." },
      { by: 'a', say: "About what?" },
      { by: 'b', say: "About joining us." },
      { by: 'a', dr: "I knew something was going on. I didn't think they'd want me in it." },
    ] },
    { id: 'ar.j6', turns: [
      { by: 'b', say: "We need one more vote, and we'd rather it was you." },
      { by: 'a', say: "Honest. I like it." },
      { by: 'b', say: "We're all honest in {alliance}." },
      { by: 'a', say: "I'll believe that when I see it." },
    ] },
    { id: 'ar.j7', turns: [
      { by: 'a', say: "So what happens now?" },
      { by: 'b', say: "Now you tell us everything you hear. And we do the same." },
      { by: 'a', say: "Everything?" },
      { by: 'b', say: "Everything." },
    ] },
    { id: 'ar.j8', turns: [
      { by: 'a', dr: "Being asked to join feels amazing. Then I started wondering who they asked before me." },
    ] },
    { id: 'ar.j9', when: { third: true }, turns: [
      { by: 'b', say: "We've talked about it, and we'd like you with us." },
      { by: 'c', say: "Properly with us. Not a maybe." },
      { by: 'a', say: "I don't do maybes." },
      { by: 'b', say: "Then you're in." },
    ] },
    { id: 'ar.j10', when: { early: false }, turns: [
      { by: 'a', say: "Why now? Why not two weeks ago?" },
      { by: 'b', say: "Two weeks ago we didn't need you." },
      { by: 'a', say: "...At least you're honest." },
    ] },
    { id: 'ar.j11', turns: [
      { by: 'b', say: "Here's the deal. We look after you. You look after us." },
      { by: 'a', say: "And if I say no?" },
      { by: 'b', say: "Then this conversation never happened." },
      { by: 'a', say: "...I'm saying yes." },
    ] },
    { id: 'ar.j12', when: { room: ['bedroom'] }, turns: [
      { beat: '{b} and the rest of {alliance} are sitting on the beds when {a} walks in. Nobody says anything for a second.' },
      { by: 'a', say: "Is this an intervention?" },
      { by: 'b', say: "It's an invitation." },
    ] },
    { id: 'ar.j13', when: { register: 'schemer' }, turns: [
      { by: 'a', dr: "They think they recruited me. I've been working my way into {alliance} for a week. But let them think it was their idea." },
    ] },
    { id: 'ar.j14', when: { register: 'shy' }, turns: [
      { by: 'a', say: "You want me? Really?" },
      { by: 'b', say: "Really." },
      { by: 'a', dr: "Nobody's ever picked me first for anything. I know I wasn't first here either. It still felt like it." },
    ] },
  ],
  // a is still in the alliance; b voted out one of its own ({target}).
  'alliance.betrayal.flipped': [
    { id: 'ab.f1', when: { known: true }, turns: [
      { by: 'a', say: "{alliance} had the numbers. So who voted {target} out?" },
      { by: 'b', say: "Don't look at me." },
      { by: 'a', say: "I'm looking at everybody. You're just the one looking away." },
    ] },
    { id: 'ab.f2', turns: [
      { by: 'a', say: "Where was your vote, {b}?" },
      { by: 'b', say: "Where do you think?" },
      { by: 'a', say: "I think it wasn't where you said it would be." },
    ] },
    { id: 'ab.f3', when: { known: true }, turns: [
      { by: 'a', dr: "{target} was one of us. One of us. And somebody in {alliance} wrote that name down. I know exactly who." },
    ] },
    { id: 'ab.f4', when: { room: ['living-room'] }, turns: [
      { beat: 'The moment the front door closes, the rest of {alliance} are comparing votes in the living room.' },
      { by: 'a', say: "That doesn't add up. Somebody went the other way." },
      { by: 'b', say: "Maybe somebody outside the group flipped." },
      { by: 'a', say: "Nobody outside the group could have changed that." },
    ] },
    { id: 'ab.f5', when: { known: true }, turns: [
      { by: 'b', say: "I had to. {target} was going to come after me." },
      { by: 'a', say: "{target} was in our alliance!" },
      { by: 'b', say: "And I'm still in it. That's the point." },
    ] },
    { id: 'ab.f6', turns: [
      { by: 'a', dr: "{b} flipped. Against {alliance}. Against us. I'm not even angry yet. I'm just shocked." },
    ] },
    { id: 'ab.f7', turns: [
      { by: 'a', say: "Just tell me why." },
      { by: 'b', say: "It was a game move." },
      { by: 'a', say: "Against your own alliance." },
      { by: 'b', say: "Especially against my own alliance. That's where the threats are." },
    ] },
    { id: 'ab.f8', when: { known: true }, turns: [
      { by: 'a', say: "Everyone in {alliance} said {target}'s name was safe." },
      { by: 'b', say: "Everyone said a lot of things." },
      { by: 'a', dr: "That's not a denial. That's {b} admitting it." },
    ] },
  ],
  // b voted out an ally; a is somebody in the alliance hearing the explanation.
  'alliance.repair.forgiven': [
    { id: 'aw.f1', when: { reason: 'apology' }, turns: [
      { by: 'b', say: "I was wrong. I voted against us and I'm sorry." },
      { by: 'a', say: "Why should we believe you?" },
      { by: 'b', say: "You shouldn't, yet. Let me earn it back." },
      { by: 'a', dr: "We're keeping {b}. Nobody's calling it trust. It's a second chance with conditions." },
    ] },
    { id: 'aw.f2', when: { reason: 'strategic-explanation' }, turns: [
      { by: 'b', say: "Look at the numbers. If I'd voted with you, we'd have lost two of us next week, not one." },
      { by: 'a', say: "...Walk me through it again." },
      { beat: '{b} explains it again. It still makes sense.' },
      { by: 'a', dr: "I hate that {b} was right. I'm keeping {b} anyway." },
    ] },
    { id: 'aw.f3', when: { reason: 'refusal' }, turns: [
      { by: 'b', say: "My vote was my game. I'm not going to explain it." },
      { by: 'a', say: "Then we'll just have to keep working with you and wonder." },
      { by: 'b', say: "That's fair." },
    ] },
    { id: 'aw.f4', when: { reason: 'denial' }, turns: [
      { by: 'b', say: "It wasn't me. I swear it wasn't me." },
      { by: 'a', say: "The numbers say otherwise." },
      { by: 'b', say: "Then the numbers are wrong." },
      { by: 'a', dr: "We're keeping {b}. Not because we believe the denial. Because we need the vote." },
    ] },
    { id: 'aw.f5', turns: [
      { by: 'a', say: "Okay. One more chance." },
      { by: 'b', say: "That's all I need." },
      { by: 'a', say: "One. Not two." },
    ] },
    { id: 'aw.f6', turns: [
      { by: 'a', dr: "{alliance} is keeping {b}. We talked for an hour. Nobody's saying the trust is back. We're saying we still need each other." },
    ] },
    { id: 'aw.f7', turns: [
      { by: 'b', say: "Are we okay?" },
      { by: 'a', say: "We're working together. Let's not call it okay yet." },
    ] },
  ],
  'alliance.repair.truce': [
    { id: 'aw.t1', when: { reason: 'apology' }, turns: [
      { by: 'b', say: "I'm sorry. I mean it." },
      { by: 'a', say: "Some of us believe you. Some of us don't." },
      { by: 'b', say: "Which are you?" },
      { by: 'a', say: "I'll tell you after the next vote." },
    ] },
    { id: 'aw.t2', when: { reason: 'strategic-explanation' }, turns: [
      { by: 'b', say: "It was the only move that kept the rest of us safe." },
      { by: 'a', say: "Maybe. You still made it without asking." },
      { by: 'b', say: "There wasn't time to ask." },
      { by: 'a', say: "There's always time to ask." },
    ] },
    { id: 'aw.t3', when: { reason: 'refusal' }, turns: [
      { by: 'b', say: "I'm not discussing my vote." },
      { by: 'a', say: "Then we work together until the next vote. And then we'll see." },
    ] },
    { id: 'aw.t4', when: { reason: 'denial' }, turns: [
      { by: 'b', say: "I didn't flip." },
      { by: 'a', say: "Somebody did." },
      { by: 'b', say: "Not me." },
      { by: 'a', dr: "Half of {alliance} believes {b}. I'm in the other half. We're working together for now. Just for now." },
    ] },
    { id: 'aw.t5', turns: [
      { by: 'a', say: "We'll work with you. Until the next vote." },
      { by: 'b', say: "And then?" },
      { by: 'a', say: "And then you show us where your vote goes." },
    ] },
    { id: 'aw.t6', turns: [
      { by: 'a', dr: "It's a truce, not peace. I give it until the next HOH." },
    ] },
    { id: 'aw.t7', turns: [
      { by: 'b', say: "So am I still in?" },
      { by: 'a', say: "You're in the group. You're not in the conversation." },
    ] },
  ],
  'alliance.repair.rejected': [
    { id: 'aw.r1', when: { reason: 'apology' }, turns: [
      { by: 'b', say: "I'm sorry. I really am." },
      { by: 'a', say: "Sorry doesn't bring them back." },
      { by: 'b', say: "I know." },
      { beat: 'The meeting ends with people leaving the room separately.' },
    ] },
    { id: 'aw.r2', when: { reason: 'strategic-explanation' }, turns: [
      { by: 'b', say: "Let me explain the numbers." },
      { by: 'a', say: "We don't need the numbers. We needed your vote." },
      { by: 'b', say: "It was the right move." },
      { by: 'a', say: "For you." },
    ] },
    { id: 'aw.r3', when: { reason: 'refusal' }, turns: [
      { by: 'b', say: "My vote is my business." },
      { by: 'a', say: "Then {alliance} is our business, and you're not in it." },
    ] },
    { id: 'aw.r4', when: { reason: 'denial' }, turns: [
      { by: 'b', say: "It wasn't me!" },
      { by: 'a', say: "The votes only add up one way, {b}." },
      { by: 'b', say: "Then count them again!" },
      { by: 'a', say: "We did. Three times." },
    ] },
    { id: 'aw.r5', turns: [
      { by: 'a', dr: "{b} talked for twenty minutes. I didn't hear a single thing that changed my mind. {alliance} is done with {b}." },
    ] },
    { id: 'aw.r6', turns: [
      { by: 'b', say: "So that's it? After everything?" },
      { by: 'a', say: "After everything, you voted against us. Yes. That's it." },
    ] },
    { id: 'aw.r7', turns: [
      { beat: 'Nobody says it out loud. They just stop saving {b} a seat.' },
      { by: 'b', dr: "I'm out of {alliance}. Nobody told me. I just noticed nobody saves me a seat any more." },
    ] },
  ],
  'alliance.collapsed.faded': [
    { id: 'ac.d1', turns: [
      { by: 'a', dr: "Nobody called a meeting to end {alliance}. We just stopped telling each other things. Then we stopped saying the name." },
    ] },
    { id: 'ac.d2', turns: [
      { by: 'a', say: "Are we still... a thing?" },
      { by: 'b', say: "Honestly? I don't think so." },
      { by: 'a', say: "Yeah. I don't think so either." },
    ] },
    { id: 'ac.d3', turns: [
      { by: 'a', dr: "{alliance} didn't blow up. It just faded. That's almost worse. There's nobody to be angry at." },
    ] },
    { id: 'ac.d4', turns: [
      { by: 'b', say: "When did we last have a meeting?" },
      { by: 'a', say: "I can't remember." },
      { by: 'b', say: "That's the answer, then." },
    ] },
    { id: 'ac.d5', turns: [
      { by: 'a', dr: "I said {alliance} out loud today without thinking, and it felt strange. It doesn't really exist any more." },
    ] },
    { id: 'ac.d6', turns: [
      { by: 'a', say: "Should we try to fix it?" },
      { by: 'b', say: "Fix what? We never agreed it was broken." },
      { by: 'a', say: "We never agreed anything any more." },
    ] },
  ],
  'alliance.collapsed.numbers': [
    { id: 'ac.n1', turns: [
      { by: 'a', dr: "{alliance} is me now. Just me. An alliance of one isn't an alliance. It's a person on their own." },
    ] },
    { id: 'ac.n2', turns: [
      { by: 'a', dr: "Everyone else in {alliance} has gone home. I'm the last one. I need new friends, and I need them by Thursday." },
    ] },
    { id: 'ac.n3', turns: [
      { beat: '{a} sits alone in the spot where {alliance} used to meet.' },
      { by: 'a', dr: "This was where we met. Now it's just a corner of a room." },
    ] },
    { id: 'ac.n4', turns: [
      { by: 'a', dr: "There aren't enough of us left for {alliance} to mean anything. So it doesn't. Time to start again." },
    ] },
    { id: 'ac.n5', turns: [
      { by: 'a', dr: "I'm the last one standing from {alliance}. That sounds heroic. It's actually just lonely." },
    ] },
    { id: 'ac.n6', turns: [
      { by: 'a', dr: "{alliance} didn't fall apart. Everyone just got evicted. You can't vote with an alliance of one." },
    ] },
  ],
};

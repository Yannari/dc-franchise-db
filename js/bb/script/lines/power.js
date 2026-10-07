// ══════════════════════════════════════════════════════════════════════
// bb/script/lines/power.js — the week's power, from both ends (Phase 6)
// ══════════════════════════════════════════════════════════════════════
//
// The words for bb-events/power.js. Each event keeps its casting, weight and
// consequences; the ENDING is what it decided first. (power-nom-campaign uses
// the campaign pools in campaign.js.)
//
//   power.block      power-block-pressure        the block gets to a, a nominee; b is the HOH
//                    anger | despair | focus
//   power.pawn       power-pawn-resents          a, the pawn; b the HOH; c the real target
//                    takes | resents
//   power.confront   power-ceremony-confrontation a, a nominee, asks b, the HOH, in front of everyone
//                    asks
//   power.traffic    power-hoh-traffic           the HOH room's visitors; a the HOH, b who never came
//                    snub | queue
//   power.weight     power-hoh-weight            a, the HOH, alone with the decision
//                    rattled | decided
//   power.promise    power-hoh-promise           a, the HOH, promises b safety
//                    real | cheap

export default {
  // ── the block gets to somebody ─────────────────────────────────────
  'power.block.anger': [
    { id: 'pb.a1', when: { room: ['kitchen'] }, turns: [
      { by: 'a', say: "\"We'll see.\" Everyone keeps saying \"we'll see\". I know what \"we'll see\" means!" },
      { beat: 'A cupboard door bangs shut. The kitchen goes very quiet.' },
    ] },
    { id: 'pb.a2', when: { hohB: true }, turns: [
      { by: 'a', say: "Say it to me, then. If I'm going home, say it to my face." },
      { by: 'b', say: "Nobody's said you're going home." },
      { by: 'a', say: "Nobody's said I'm staying, either." },
    ] },
    { id: 'pb.a3', turns: [
      { by: 'a', dr: "I've been polite since the ceremony. I've been polite for three days. I've run out of polite." },
    ] },
    { id: 'pb.a4', when: { room: ['kitchen'] }, turns: [
      { by: 'a', say: "Oh, don't stop talking on my account. I know it was about me." },
      { beat: 'Two people leave the room. The other two stay quiet.' },
    ] },
    { id: 'pb.a5', when: { hohB: true }, turns: [
      { by: 'a', say: "Funny how everyone's my friend until I'm on the block." },
      { by: 'b', say: "That's not fair." },
      { by: 'a', say: "Neither is this." },
    ] },
    { id: 'pb.a6', when: { hohB: true }, turns: [
      { by: 'a', dr: "{b} put me up and then asked if I was okay. I'm not okay. I'm sitting in a chair with my face on a screen." },
    ] },
    { id: 'pb.a7', when: { hohB: true }, turns: [
      { by: 'a', say: "I'm not going to sit here and smile while you all decide whether I get to stay." },
      { by: 'b', say: "Nobody's asking you to smile." },
      { by: 'a', say: "Good, because I'm not going to." },
    ] },
    { id: 'pb.a8', when: { register: 'fiery' }, turns: [
      { by: 'a', say: "You want a show? Fine! Here's your show!" },
      { beat: 'Nobody wants a scene, but they get one.' },
    ] },
    { id: 'pb.a9', turns: [{ by: 'a', dr: "Everybody wants me to be gracious about it. I'm not gracious. I'm on the block, and I'm furious." }] },
    { id: 'pb.a10', turns: [{ by: 'a', say: "Don't ask me if I'm okay. I'm on the block. Of course I'm not okay." }, { beat: 'The person who asked quietly backs out of the room.' }] },
    { id: 'pb.a11', turns: [{ by: 'a', dr: "I was calm at the ceremony. I've been calm for two days. Today the calm ran out, and I don't care who saw it." }] },
  ],
  'power.block.despair': [
    { id: 'pb.d1', turns: [
      { by: 'a', dr: "I started campaigning this morning and stopped halfway through a sentence. I just couldn't finish it." },
    ] },
    { id: 'pb.d2', when: { room: ['backyard'] }, turns: [
      { beat: '{a} sits alone in the backyard for most of an hour. Two people see. Neither of them goes out.' },
      { by: 'a', dr: "I don't need company. I need four votes." },
    ] },
    { id: 'pb.d3', turns: [
      { by: 'a', dr: "I keep saying thank you to people like it's goodbye. I don't mean to. It just comes out." },
    ] },
    { id: 'pb.d4', turns: [
      { by: 'a', dr: "Somebody asked if I was okay. I tried to say yes. Nothing came out." },
    ] },
    { id: 'pb.d5', turns: [
      { by: 'a', dr: "Everybody's being so nice to me. That's how I know they've already decided." },
    ] },
    { id: 'pb.d6', turns: [
      { beat: '{a} folds the same T-shirt three times and puts it back in the drawer unfolded.' },
      { by: 'a', dr: "I'm not packing. I'm just... organising. In case." },
    ] },
    { id: 'pb.d7', turns: [
      { by: 'a', dr: "I keep thinking about what I'll say on Thursday, and all I can think of is \"thank you\"." },
    ] },
    { id: 'pb.d8', when: { register: 'shy' }, turns: [
      { by: 'a', dr: "I was never very good at talking to people in here. Now it's the only thing that matters, and I'm frozen." },
    ] },
  ],
  'power.block.focus': [
    { id: 'pb.f1', turns: [
      { by: 'a', dr: "I need four votes. I know exactly whose. I'm starting at the top of the list." },
    ] },
    { id: 'pb.f2', when: { room: ['bedroom'] }, turns: [
      { beat: '{a} sits on the bed going through every name in the house, one at a time, quietly.' },
      { by: 'a', dr: "Being on the block has made everything very simple. Who's with me, who isn't, who can be moved." },
    ] },
    { id: 'pb.f3', when: { hohB: true }, turns: [
      { by: 'a', dr: "I'm not angry with {b}. Angry is a waste of four days. I'll be angry when I'm safe." },
    ] },
    { id: 'pb.f4', turns: [
      { by: 'a', dr: "The house expected me to fall apart. I didn't. I think that scares them more than shouting would have." },
    ] },
    { id: 'pb.f5', when: { hohB: true }, turns: [
      { by: 'a', dr: "{b} put me here. Fine. I'll get myself off it, and then {b} and I are going to have a very different week." },
    ] },
    { id: 'pb.f6', turns: [
      { by: 'a', dr: "I'm not panicking. I've got a plan, and I know who I need to talk to." },
    ] },
    { id: 'pb.f7', when: { register: 'cool' }, turns: [
      { by: 'a', dr: "I've counted. I'm two votes short. I can get two votes." },
    ] },
    { id: 'pb.f8', when: { register: 'competitor' }, turns: [
      { by: 'a', dr: "The veto is the only vote I need. Win that, and none of this matters." },
    ] },
  ],

  // ── the pawn ──────────────────────────────────────────────────────
  'power.pawn.takes': [
    { id: 'pw.t1', turns: [{ by: 'a', dr: "I said yes to being the pawn. I meant it. I'm also remembering exactly who asked, and how fast they said I'd be fine." }] },
    { id: 'pw.t2', turns: [{ by: 'a', say: "I get it. I'm the safe one." }, { by: 'a', dr: "I said it like it was nothing. It isn't nothing." }] },
    { id: 'pw.t3', when: { third: true }, turns: [{ by: 'a', dr: "I'm sitting next to {c}, and I keep thinking about what happens if one person changes their vote." }] },
    { id: 'pw.t4', turns: [{ by: 'a', dr: "{b} owes me now. I'm going to make sure {b} remembers that." }] },
    { id: 'pw.t5', turns: [{ by: 'b', say: "You know you're safe, right?" }, { by: 'a', say: "I know. I trust you." }, { by: 'a', dr: "I do trust {b}. I just trust the votes less." }] },
    { id: 'pw.t6', turns: [{ by: 'a', dr: "Being the pawn is a favour. {b} owes me now, and I won't let {b.obj} forget it." }] },
  ],
  'power.pawn.resents': [
    { id: 'pw.r1', turns: [{ by: 'a', dr: "I was told this was a formality. I've counted the votes twice now. It doesn't feel like a formality to me." }] },
    { id: 'pw.r2', turns: [{ by: 'a', say: "Pawns go home. Everybody knows pawns go home." }, { beat: 'Nobody in the room answers.' }] },
    { id: 'pw.r3', turns: [{ by: 'a', dr: "Being used like this stopped being funny by the second day." }] },
    { id: 'pw.r4', turns: [{ beat: '{a} smiles through the rest of the day, and stops the moment the camera is behind {a.obj}.' }, { by: 'a', dr: "I smile when {b} is around. I'm not happy about it." }] },
    { id: 'pw.r5', turns: [{ by: 'a', say: "Next time, ask somebody else to sit in the chair." }, { by: 'b', say: "You'll be fine." }, { by: 'a', say: "You keep saying that. It keeps not helping." }] },
    { id: 'pw.r6', turns: [{ by: 'a', dr: "If I go home as a pawn, {b} is the reason. I won't forget that from the jury house." }] },
  ],

  // ── a ceremony confrontation, in front of everybody ─────────────────
  'power.confront.asks': [
    { id: 'pc.a1', turns: [
      { beat: 'The room does not empty after the ceremony. {a} stays in the chair.' },
      { by: 'a', say: "Explain it, {b}. In front of everybody. Go on." },
      { by: 'b', say: "This isn't the place." },
      { by: 'a', say: "You made it the place." },
    ] },
    { id: 'pc.a2', turns: [
      { by: 'a', say: "You could have told me first." },
      { by: 'b', say: "I didn't want to make it worse." },
      { by: 'a', say: "This is worse." },
    ] },
    { id: 'pc.a3', turns: [
      { beat: '{b} gets three steps towards the stairs.' },
      { by: 'a', say: "{b}." },
      { beat: 'The whole room stops.' },
      { by: 'a', say: "Just one question. Why me?" },
    ] },
    { id: 'pc.a4', turns: [
      { by: 'a', say: "One question. That's all. Was it personal?" },
      { by: 'b', say: "It was a game move." },
      { by: 'a', say: "Then why can't you look at me?" },
    ] },
    { id: 'pc.a5', turns: [
      { by: 'a', say: "I just want everyone to know I found out at the same time as all of you." },
      { by: 'b', say: "That's not true." },
      { by: 'a', say: "Then when did you tell me?" },
      { beat: '{b} doesn\'t answer. Everyone else in the room pretends to be doing something else.' },
    ] },
    { id: 'pc.a6', turns: [
      { by: 'a', say: "We had a conversation two days ago. Do you remember what you said?" },
      { by: 'b', say: "Things changed." },
      { by: 'a', say: "Yeah. You did." },
    ] },
    { id: 'pc.a7', turns: [
      { by: 'b', say: "Can we talk about this upstairs?" },
      { by: 'a', say: "No. We'll talk about it here, where everybody can hear." },
      { by: 'b', dr: "{a} wanted an audience. {a} got one. I hope {a} likes how it goes." },
    ] },
    { id: 'pc.a8', turns: [
      { by: 'a', say: "I'm not going to shout. I just want an honest answer." },
      { by: 'b', say: "You're a threat. That's the honest answer." },
      { by: 'a', say: "Thank you. That's the first honest thing you've said all week." },
    ] },
    { id: 'pc.a9', when: { register: 'fiery' }, turns: [
      { by: 'a', say: "You put me up and then you hugged me! You HUGGED me!" },
      { by: 'b', say: "I was trying to be decent." },
      { by: 'a', say: "Decent people don't do both!" },
    ] },
    { id: 'pc.a10', when: { register: 'cool' }, turns: [
      { by: 'a', say: "I'd just like everyone here to remember who made this decision. That's all." },
      { beat: '{a} walks out. Nobody else moves.' },
    ] },
  ],

  // ── HOH room traffic ─────────────────────────────────────────────
  'power.traffic.snub': [
    { id: 'pt.s1', turns: [{ by: 'a', dr: "There's been a queue outside my door all afternoon. {b} isn't in it. I've noticed. Twice." }] },
    { id: 'pt.s2', turns: [{ by: 'a', dr: "Everybody's found a reason to come and sit on my bed. Everybody except {b}, who has suddenly got a lot of laundry." }] },
    { id: 'pt.s3', turns: [{ by: 'a', dr: "Everyone's been up to see me before dinner. Everyone except {b}. I've noticed." }] },
    { id: 'pt.s4', turns: [{ by: 'a', dr: "I'm not keeping a list of who came up. I'm just remembering. Very clearly. {b} didn't." }] },
    { id: 'pt.s5', turns: [{ beat: '{b} walks past the bottom of the HOH stairs and keeps going.' }, { by: 'a', dr: "Didn't even look up. Interesting." }] },
    { id: 'pt.s6', turns: [{ by: 'a', dr: "If you don't come and see the Head of Household, the Head of Household starts wondering why." }] },
  ],
  'power.traffic.queue': [
    { id: 'pt.q1', turns: [{ by: 'a', dr: "Everyone's found an excuse to come up today. Different conversations. Same question at the end: \"What are you thinking?\"" }] },
    { id: 'pt.q2', turns: [{ by: 'a', dr: "I learn more from the order they come up in than from anything they actually say." }] },
    { id: 'pt.q3', turns: [{ beat: 'The HOH door barely closes all afternoon.' }, { by: 'a', dr: "Congratulations, advice, promises. Nobody was offering me promises yesterday." }] },
    { id: 'pt.q4', turns: [{ by: 'a', dr: "I've had more friends today than in my whole first week. Funny, that." }] },
    { id: 'pt.q5', turns: [{ by: 'a', dr: "Every single person who came up today told me they're with me. I'm counting, and there aren't enough votes in this house for that to be true." }] },
    { id: 'pt.q6', turns: [{ beat: 'People come up the stairs in ones and twos, each of them very casual about it.' }, { by: 'a', dr: "Nobody's casual in here. Nobody." }] },
  ],

  // ── the HOH, alone with it ──────────────────────────────────────
  'power.weight.rattled': [
    { id: 'pg.r1', turns: [{ by: 'a', dr: "Best bed in the house, and I can't sleep in it. I keep going over the nominations and I can't settle on anything." }] },
    { id: 'pg.r2', turns: [{ beat: '{a} sits in the HOH room with the door open. Twice there are footsteps on the stairs. Nobody comes in.' }, { by: 'a', dr: "I wanted company. I also didn't. That's this week." }] },
    { id: 'pg.r3', turns: [{ by: 'a', dr: "I've practised saying the two names out loud. They don't sound any better the fourth time." }] },
    { id: 'pg.r4', turns: [{ by: 'a', dr: "Everybody downstairs thinks I'm safe. I am. I just didn't realise safe and comfortable were different things." }] },
    { id: 'pg.r5', turns: [{ by: 'a', dr: "Somebody is going to hate me on Saturday. Maybe two people. I keep trying to pick which two I can live with." }] },
    { id: 'pg.r6', turns: [{ by: 'a', dr: "I thought winning would be the hard part. Winning was easy. This is the hard part." }] },
  ],
  'power.weight.decided': [
    { id: 'pg.d1', turns: [{ by: 'a', dr: "I knew my two names about an hour after I won. Now I'm just working out how to sell them." }] },
    { id: 'pg.d2', turns: [{ by: 'a', dr: "I'm not writing anything down. There's nowhere in this house to hide a list. It's all in my head." }] },
    { id: 'pg.d3', turns: [{ by: 'a', dr: "Initial nominees, backup plan, what I do if the veto gets used. Done. Now I just have to look surprised when people ask." }] },
    { id: 'pg.d4', turns: [{ by: 'a', dr: "I went through every pair I could put up. I came back to the first two. That usually means they're the right two." }] },
    { id: 'pg.d5', turns: [{ beat: '{a} lies on the HOH bed, staring at the ceiling, completely calm.' }, { by: 'a', dr: "The decision is easy. Making the house accept it is the job." }] },
    { id: 'pg.d6', turns: [{ by: 'a', dr: "Everyone's coming up to tell me what to do. I let them. I've already done it." }] },
  ],

  // ── the HOH's promise ────────────────────────────────────────────
  'power.promise.real': [
    { id: 'pp.r1', turns: [{ by: 'a', say: "You're not going up. Not this week, not while I've got this." }, { by: 'b', say: "You mean that?" }, { by: 'a', say: "I mean it." }] },
    { id: 'pp.r2', turns: [{ by: 'a', say: "I'm telling you the plan before anyone else." }, { by: 'b', say: "Does that mean our deal's still real?" }, { by: 'a', say: "It's still real." }] },
    { id: 'pp.r3', turns: [{ by: 'a', say: "You're safe with me. That's it. That's the whole speech." }, { by: 'b', dr: "It wasn't a grand alliance. It was one sentence. It was enough." }] },
    { id: 'pp.r4', turns: [{ by: 'b', say: "I need a straight answer. Am I going up?" }, { by: 'a', say: "You're not going up. I promise." }, { by: 'b', say: "Thank you." }] },
    { id: 'pp.r5', turns: [{ by: 'a', say: "Whatever you hear this week, ignore it. You're safe." }, { by: 'b', say: "And if the veto gets used?" }, { by: 'a', say: "Still safe. I promise." }] },
    { id: 'pp.r6', turns: [{ by: 'a', dr: "{b} is the one person I'm not putting up whatever happens. I told {b.obj} so. I meant it." }] },
  ],
  'power.promise.cheap': [
    { id: 'pp.c1', turns: [{ by: 'b', say: "Am I safe?" }, { by: 'a', say: "You're fine." }, { by: 'a', dr: "I've said \"you're fine\" to two people today. Only one of them is going to stay fine." }] },
    { id: 'pp.c2', turns: [{ by: 'a', say: "You've got nothing to worry about." }, { by: 'b', say: "Really?" }, { by: 'a', say: "Really." }, { by: 'a', dr: "I haven't decided yet. But it buys me a quiet afternoon." }] },
    { id: 'pp.c3', turns: [{ by: 'b', dr: "I left the HOH room feeling completely safe. I'm not sure {a} has actually decided that." }] },
    { id: 'pp.c4', turns: [{ by: 'b', say: "Is my name being considered?" }, { by: 'a', say: "No. Absolutely not." }, { by: 'a', dr: "It was, about ten minutes ago. It might be again." }] },
    { id: 'pp.c5', turns: [{ by: 'a', say: "Don't worry about it." }, { by: 'b', say: "That's not a no." }, { by: 'a', say: "It's a \"don't worry about it\"." }] },
    { id: 'pp.c6', turns: [{ by: 'a', dr: "Promises are cheap up here. I hand them out like snacks. Some of them I'll even keep." }] },
  ],

  // ── the replacement, at the ceremony ── a replacement, b HOH
  'power.replaced.blindsided': [
    { id: 'pr.b1', turns: [{ by: 'a', dr: "{b} and I were close. I thought that made me safe. I sat down in that chair because there was nowhere else to sit." }] },
    { id: 'pr.b2', turns: [{ beat: '{a} stays standing beside the sofa for a second before taking the empty chair. Two people look away.' }, { by: 'a', dr: "I needed a second. Just one. To make sure I'd heard it right." }] },
    { id: 'pr.b3', turns: [{ beat: '{a} looks straight at {b} the whole way to the chair. {b} looks at the floor.' }, { by: 'a', dr: "{b} couldn't even look at me. That tells me everything I need to know." }] },
    { id: 'pr.b4', turns: [{ by: 'a', dr: "I walked into that ceremony thinking I was safe. I found out I wasn't standing up, in front of everyone." }] },
    { id: 'pr.b5', turns: [{ by: 'a', say: "Seriously, {b}?" }, { by: 'b', say: "I'm sorry. It had to be someone." }, { by: 'a', say: "It didn't have to be me." }] },
    { id: 'pr.b6', turns: [{ by: 'a', dr: "I trusted {b}. I'm sitting in the replacement chair working out exactly when that stopped being a good idea." }] },
  ],
  'power.replaced.expected': [
    { id: 'pr.e1', turns: [{ by: 'a', dr: "I knew it'd be me the moment the veto came off the wall. I've had a speech ready since this morning." }] },
    { id: 'pr.e2', turns: [{ beat: 'Nobody in the room is surprised, least of all {a}, who sits down like it is a job.' }, { by: 'a', dr: "I already knew it would be me. I'd been planning what to say for days." }] },
    { id: 'pr.e3', turns: [{ by: 'a', dr: "Walking to that chair, I was already working out who to talk to first. I'm not wasting a minute." }] },
    { id: 'pr.e4', turns: [{ by: 'a', say: "Fine. I expected that." }, { by: 'b', say: "It's nothing personal." }, { by: 'a', say: "It never is, with you." }] },
    { id: 'pr.e5', turns: [{ by: 'a', dr: "I'm not shocked. I'm annoyed I was right." }] },
    { id: 'pr.e6', turns: [{ by: 'a', dr: "{b} and I have never got on. This is just the week it became official." }] },
  ],

  // ── saved, and someone else went up ── a saved, b the replacement
  'power.saved-guilt.decent': [
    { id: 'ps.d1', turns: [{ by: 'a', say: "I know me coming off put you up there. I'm sorry." }, { by: 'b', say: "You didn't choose it." }, { by: 'a', say: "I know. I'm still sorry." }] },
    { id: 'ps.d2', turns: [{ by: 'a', dr: "I'm off the block. I should be celebrating. I can't, not while {b} is sitting in my chair." }] },
    { id: 'ps.d3', turns: [{ by: 'b', say: "I didn't ask for that." }, { by: 'a', say: "I know you didn't." }, { beat: 'Neither of them is sure the conversation helped.' }] },
    { id: 'ps.d4', turns: [{ by: 'a', say: "Whatever you need this week, I'll help. Votes, speeches, anything." }, { by: 'b', say: "That would've been more useful yesterday." }] },
    { id: 'ps.d5', turns: [{ by: 'a', dr: "Being saved feels great. Seeing {b} in my chair doesn't." }] },
    { id: 'ps.d6', turns: [{ by: 'a', say: "Can I sit with you for a bit?" }, { by: 'b', say: "You can sit. I'm not promising to talk." }] },
  ],
  'power.saved-guilt.cold': [
    { id: 'ps.c1', turns: [{ beat: '{a} is visibly relieved and does not hide it. {b} watches from the chair {a} just left.' }, { by: 'b', dr: "{a} could at least pretend to feel bad. Just for an afternoon." }] },
    { id: 'ps.c2', turns: [{ by: 'a', dr: "Do I feel bad that {b} went up? A bit. Do I feel worse than I'd feel on the block? Not even close." }] },
    { id: 'ps.c3', turns: [{ by: 'b', dr: "{a} hasn't said a single word to me since the ceremony. Not one. I know where I stand now." }] },
    { id: 'ps.c4', turns: [{ by: 'a', say: "Good game today, everyone!" }, { by: 'b', say: "Good game for some of us." }] },
    { id: 'ps.c5', turns: [{ by: 'b', dr: "I kept waiting for {a} to come and find me. By dinner, I'd stopped waiting." }] },
    { id: 'ps.c6', turns: [{ by: 'a', dr: "Somebody had to go up. Better {b} than me. I'm allowed to think that." }] },
  ],

  // ── the HOH door stays shut ── a HOH, b turned away
  'power.refused.shut': [
    { id: 'pf.s1', turns: [{ beat: '{b} knocks on the HOH door.' }, { by: 'a', say: "Now's not a good time." }, { beat: '{b} walks back down the stairs alone.' }] },
    { id: 'pf.s2', turns: [{ by: 'b', say: "Can I come in?" }, { by: 'a', say: "I'm sleeping." }, { by: 'b', dr: "{a} wasn't sleeping. We both knew it. {a} just didn't want to talk to me." }] },
    { id: 'pf.s3', turns: [{ by: 'a', dr: "It's the only door in this house that locks. Today I used it on {b}." }] },
    { id: 'pf.s4', turns: [{ beat: 'The house watches {b} come back down without having gone in. Nobody asks how it went.' }, { by: 'b', dr: "Everybody saw. That's the part that hurts." }] },
    { id: 'pf.s5', turns: [{ by: 'b', say: "Five minutes?" }, { by: 'a', say: "Maybe tomorrow." }, { by: 'b', say: "Tomorrow's nominations." }, { by: 'a', say: "...I know." }] },
    { id: 'pf.s6', turns: [{ by: 'a', dr: "I didn't open the door for {b}. I didn't need to. I already know what I'm doing with {b}." }] },
  ],

  // ── lobbying for the veto draw ── a HOH, b asker
  'power.draw-lobby.agrees': [
    { id: 'pl.a1', turns: [{ by: 'b', say: "If I get drawn, I'll use it however you want it used." }, { beat: '{a} doesn\'t say yes, but {a} doesn\'t say no either.' }] },
    { id: 'pl.a2', turns: [{ by: 'b', say: "Pick me if you get houseguest's choice. I'll keep your nominations exactly where they are." }, { by: 'a', say: "Deal." }] },
    { id: 'pl.a3', turns: [{ by: 'b', say: "I'm the safest pair of hands for that veto. You know it." }, { by: 'a', say: "I do know it." }, { by: 'b', dr: "We both knew what that meant. Neither of us said it." }] },
    { id: 'pl.a4', turns: [{ by: 'a', dr: "{b} wants in the veto, and {b} will play it my way. That's a good trade for a chip." }] },
    { id: 'pl.a5', turns: [{ by: 'b', say: "Put me in, and the veto stays in the box." }, { by: 'a', say: "Promise?" }, { by: 'b', say: "Promise." }] },
    { id: 'pl.a6', turns: [{ by: 'b', say: "I just want to help you keep your week the way you planned it." }, { by: 'a', say: "Then I'd like you in that draw." }] },
  ],
  'power.draw-lobby.declines': [
    { id: 'pl.d1', turns: [{ by: 'b', say: "Pick me if you can." }, { by: 'a', say: "I can't promise anything." }, { by: 'b', dr: "{a} wouldn't promise. That's a no." }] },
    { id: 'pl.d2', turns: [{ by: 'a', say: "If I get houseguest's choice, I'd rather pick somebody neutral." }, { by: 'b', say: "Neutral. Right. Not me, then." }, { by: 'b', dr: "I heard the word loud and clear. {a} doesn't trust me with the veto." }] },
    { id: 'pl.d3', turns: [{ by: 'b', say: "Would you pick me for houseguest's choice?" }, { by: 'a', say: "Let's see what happens." }, { beat: '{a} changes the subject.' }] },
    { id: 'pl.d4', turns: [{ by: 'a', dr: "{b} wants the veto very badly. That's exactly why {b} isn't getting near it." }] },
    { id: 'pl.d5', turns: [{ by: 'b', say: "I'd play for you." }, { by: 'a', say: "Would you?" }, { by: 'b', say: "...Yes." }, { by: 'a', dr: "{b} hesitated. I'm not picking {b}." }] },
    { id: 'pl.d6', turns: [{ by: 'b', say: "Just keep me in mind." }, { by: 'a', say: "I'll keep everyone in mind." }] },
  ],

  // ── the veto holder's promise ── a holder, b the nominee it is promised to, c the other nominee
  'power.veto-promise.means': [
    { id: 'pv.m1', turns: [{ by: 'a', say: "The veto's coming off the wall, and you're coming off with it." }, { by: 'b', say: "...Seriously?" }, { by: 'a', say: "Seriously." }] },
    { id: 'pv.m2', turns: [{ by: 'a', say: "You're getting off that block." }, { beat: '{b} takes a second to work out that {a} means it.' }] },
    { id: 'pv.m3', turns: [{ by: 'a', dr: "I told {b} before I told anyone else. I wanted {b} to know I meant it." }] },
    { id: 'pv.m4', turns: [{ by: 'b', say: "Are you going to use it?" }, { by: 'a', say: "On you. Yes." }, { by: 'b', say: "Thank you. I mean it. Thank you." }] },
    { id: 'pv.m5', turns: [{ by: 'a', say: "Stop campaigning. You don't need to. I've got you." }, { by: 'b', dr: "First good sleep I'll have had all week." }] },
    { id: 'pv.m6', turns: [{ by: 'a', dr: "{b} has had my back since the start. Today I've got the chance to have {b.posAdj}. Easy decision." }] },
  ],
  'power.veto-promise.hollow': [
    { id: 'pv.h1', turns: [{ by: 'a', say: "Don't worry. It's coming your way." }, { by: 'a', dr: "I haven't decided that at all. But {b} will stop campaigning now, and that's useful." }] },
    { id: 'pv.h2', turns: [{ by: 'a', say: "Don't stress about it. I've got you." }, { by: 'b', say: "You promise?" }, { by: 'a', say: "Promise." }, { by: 'a', dr: "That promise costs me nothing today. It'll cost {b} a lot on Thursday." }] },
    { id: 'pv.h3', turns: [{ by: 'b', dr: "{a} told me the veto's coming my way. So I stopped campaigning. I really hope that wasn't a mistake." }] },
    { id: 'pv.h4', turns: [{ by: 'a', say: "Relax. I'll take care of it." }, { by: 'a', dr: "\"I'll take care of it\" sounds nice. It doesn't mean I'll use it." }] },
    { id: 'pv.h5', turns: [{ by: 'b', say: "You're going to use it, right?" }, { by: 'a', say: "Trust me." }, { by: 'b', dr: "{a} said \"trust me\", not yes. I'm going to believe it anyway." }] },
    { id: 'pv.h6', turns: [{ by: 'a', dr: "If I tell {b} the veto's coming, {b} stops working the house. That helps me whether I use it or not." }] },
  ],

  // ── the HOH room opens ── a HOH, b and c (third) the first guests
  'power.reveal.holds': [
    { id: 'pe.h1', turns: [{ beat: 'The door opens and the house piles in behind {a}: the bed, the private shower, the basket of snacks.' }, { by: 'b', say: "There's a fridge. There's an actual fridge." }, { by: 'a', say: "Nobody touch the fridge." }] },
    { id: 'pe.h2', turns: [{ beat: '{a} reads the letter from home out loud, and gets all the way through it with only one wobble.' }, { by: 'b', say: "You did it. You didn't cry." }, { by: 'a', say: "Give me five minutes." }] },
    { id: 'pe.h3', turns: [{ by: 'a', say: "Photos first. Then letter. Then snacks." }, { beat: 'The photos go round the room. Everyone is very nice about them.' }] },
    { id: 'pe.h4', turns: [{ by: 'b', say: "Is that your family?" }, { by: 'a', say: "That's everyone I'm doing this for." }, { by: 'b', say: "No pressure, then." }] },
    { id: 'pe.h5', when: { third: true }, turns: [{ by: 'c', say: "Read us the letter!" }, { by: 'a', say: "Later. When it's just me." }, { by: 'b', say: "Respect." }] },
    { id: 'pe.h6', turns: [{ by: 'a', dr: "For twenty minutes, everyone up there was really happy for me. I'll remember that when they're voting." }] },
    { id: 'pe.h7', turns: [{ by: 'b', say: "How does it feel?" }, { by: 'a', say: "Like I should enjoy it while it lasts. So I'm going to." }] },
  ],
  'power.reveal.breaks': [
    { id: 'pe.b1', turns: [{ beat: '{a} finds the photos from home, and the room goes quiet the way it always does.' }, { by: 'a', say: "Sorry. Give me a minute." }, { by: 'b', say: "Take all the time you want." }] },
    { id: 'pe.b2', turns: [{ beat: '{a} gets four lines into the letter before having to stop.' }, { beat: 'Nobody says anything. {b} puts a hand on {a}\'s shoulder, and everyone else pretends to look at the photos.' }, { by: 'a', dr: "Four lines. I got four lines in. I'll read the rest when I'm on my own." }] },
    { id: 'pe.b3', turns: [{ by: 'a', say: "I'm fine. I'm fine. I'm not fine." }, { by: 'b', say: "You're not supposed to be fine. That's the whole point of the letter." }] },
    { id: 'pe.b4', turns: [{ by: 'a', dr: "I've been holding it together for days. One photo, and it was all over." }] },
    { id: 'pe.b5', when: { third: true }, turns: [{ by: 'c', say: "Do you want us to give you a minute?" }, { by: 'a', say: "No. Stay. Please." }, { beat: 'Nobody leaves.' }] },
    { id: 'pe.b6', turns: [{ beat: '{a} holds the letter for a long time without reading it.' }, { by: 'b', say: "You don't have to read it now." }, { by: 'a', say: "I know. I just want to hold it." }] },
    { id: 'pe.b7', turns: [{ by: 'a', dr: "Everyone thinks the HOH room is about power. It's not. It's about the photos." }] },
  ],

  // ── a guest who will not leave ── a HOH, b the guest
  'power.overstay.stays': [
    { id: 'po.s1', turns: [{ by: 'a', say: "Anyway. Goodnight." }, { by: 'b', say: "Night!" }, { beat: '{b} does not move.' }, { by: 'a', dr: "That was my second goodnight. {b} is still on the end of my bed." }] },
    { id: 'po.s2', turns: [{ by: 'a', dr: "It's three in the morning. I've stopped answering in sentences. {b} hasn't noticed." }] },
    { id: 'po.s3', turns: [{ by: 'a', say: "You can stay as long as you want." }, { by: 'b', say: "Great!" }, { beat: '{b} settles further into the bed.' }, { by: 'a', dr: "I meant the opposite. Clearly." }] },
    { id: 'po.s4', turns: [{ by: 'a', dr: "I wanted one night alone in a room with a door. {b} has been in it since eight o'clock." }] },
    { id: 'po.s5', turns: [{ beat: '{a} yawns very loudly. {b} yawns back, and keeps talking.' }, { by: 'a', dr: "Even my yawns aren't working. I'm going to have to say actual words." }] },
    { id: 'po.s6', turns: [{ by: 'a', say: "I'm going to sleep now." }, { by: 'b', say: "Me too, in a minute." }, { by: 'a', dr: "That minute lasted forty-five minutes." }] },
    { id: 'po.s7', turns: [{ by: 'b', say: "Is it okay if I just lie here? Your bed's so much better." }, { by: 'a', say: "...Sure." }, { by: 'a', dr: "It was not okay." }] },
    { id: 'po.s8', turns: [{ by: 'a', dr: "{b} can't read a room. That's useful to know about somebody in this game." }] },
  ],

  // ── a queue on the stairs ── a HOH, b and c in it
  'power.queue.queue': [
    { id: 'pq.q1', turns: [{ by: 'a', dr: "There's a queue on the stairs. Everyone wants five minutes. Everyone's five minutes is apparently the important one." }] },
    { id: 'pq.q2', turns: [{ beat: '{b} goes up, and comes back down looking pleased.' }, { by: 'a', dr: "{b} said the same three things everyone else has said. I've started counting how many of them name the same person." }] },
    { id: 'pq.q3', turns: [{ by: 'a', dr: "Nobody calls it a queue. But it's a queue, and the whole house is watching who joins it and in what order." }] },
    { id: 'pq.q4', turns: [{ by: 'a', dr: "I haven't left this room all afternoon. I haven't needed to. The house keeps coming to me." }] },
    { id: 'pq.q5', when: { third: true }, turns: [{ by: 'b', say: "Is {c} in there?" }, { by: 'a', say: "{c}'s just leaving." }, { by: 'b', say: "Then I'm next." }] },
    { id: 'pq.q6', turns: [{ by: 'b', say: "Got five minutes?" }, { by: 'a', say: "For you? Four." }] },
  ],

  // ── the last night in the HOH room ── a HOH
  'power.last-night.packs': [
    { id: 'pn.p1', turns: [{ by: 'a', dr: "I took the photos down before anyone asked me to. Whoever wins tomorrow will want the wall, and I'd rather not be watched doing it." }] },
    { id: 'pn.p2', turns: [{ by: 'a', dr: "Last night in the good bed, and I can't sleep in it. That's somehow funny." }] },
    { id: 'pn.p3', turns: [{ beat: '{a} sits alone in the HOH room with the lights low.' }, { by: 'a', dr: "Tomorrow I lose the only door in this house that locks. And I've annoyed at least two people this week." }] },
    { id: 'pn.p4', turns: [{ by: 'a', dr: "A week of everyone being nice to me is ending. I know exactly how much of it was real." }] },
    { id: 'pn.p5', turns: [{ beat: '{a} packs the snack basket away, slowly.' }, { by: 'a', dr: "Back downstairs tomorrow. Back to being one of the people who has to climb the stairs." }] },
    { id: 'pn.p6', turns: [{ by: 'a', dr: "I'd like this room back. Next time I'll know exactly what to do with it." }] },
  ],

  // ── counting who goes up ── a the watcher; b the favourite, c the HOH (neither in the room)
  'power.spy.counts': [
    { id: 'py.c1', turns: [{ by: 'a', dr: "{b} has been up those stairs four times today. I've been up none. I'm not counting. I'm just aware." }] },
    { id: 'py.c2', turns: [{ by: 'a', dr: "The door's closed behind {b} three times this week. I notice these things." }] },
    { id: 'py.c3', turns: [{ by: 'a', dr: "Nobody tells me anything. They don't have to. I can hear {b} laughing through the ceiling." }] },
    { id: 'py.c4', turns: [{ beat: '{a} sits on the stairs, pretending to read, watching who goes up.' }, { by: 'a', dr: "Tally so far: {b}, a lot. Everybody else, barely." }] },
    { id: 'py.c5', turns: [{ by: 'a', dr: "If {b} spent any more time in the HOH room, {b} would need to pay rent." }] },
    { id: 'py.c6', turns: [{ by: 'a', dr: "{c} and {b} are closer than they're letting on. Nobody visits a room that often just for the snacks." }] },
    { id: 'py.c7', turns: [{ by: 'a', dr: "Whoever {c} trusts, I want to know. Right now, every answer is {b}." }] },
    { id: 'py.c8', turns: [{ beat: 'From downstairs, {a} watches {b} climb the HOH stairs again.' }, { by: 'a', dr: "Again. That's a pattern, not a coincidence." }] },
    { id: 'py.c9', when: { register: 'schemer' }, turns: [{ by: 'a', dr: "Everyone thinks the HOH room is private. It's the most public room in the house. You just have to watch the stairs." }] },
    { id: 'py.c10', when: { register: 'cool' }, turns: [{ by: 'a', dr: "I've been keeping a tally of who goes up. By the end of the day, {b} is winning it by a distance." }] },
  ],

  // ── asking somebody to be the pawn ── a HOH, b the pawn
  'power.pawn-ask.willing': [
    { id: 'pk.w1', turns: [{ by: 'a', say: "I need you beside the target. You're not the one going home." }, { by: 'b', say: "Yes. Okay. Yes." }, { by: 'a', dr: "{b} said yes before I'd finished. I owe {b} a big favour now." }] },
    { id: 'pk.w2', turns: [{ by: 'a', say: "Would you be my pawn?" }, { by: 'b', say: "On one condition. If that ever changes, you tell me to my face." }, { by: 'a', say: "Deal." }] },
    { id: 'pk.w3', turns: [{ by: 'b', say: "I'll do it. For you." }, { by: 'a', say: "I won't forget it." }, { by: 'b', say: "Don't." }] },
    { id: 'pk.w4', turns: [{ by: 'b', dr: "I'm taking the chair as a favour to a friend. {a} owes me now." }] },
    { id: 'pk.w5', turns: [{ by: 'a', say: "You're the only person I trust to sit there." }, { by: 'b', say: "That's either a compliment or a curse." }, { by: 'a', say: "Both." }] },
    { id: 'pk.w6', turns: [{ by: 'b', say: "If I go home as a pawn, I'm haunting this room." }, { by: 'a', say: "You won't go home." }] },
  ],
  'power.pawn-ask.grudging': [
    { id: 'pk.g1', turns: [{ by: 'a', say: "I need someone to be the pawn." }, { by: 'b', say: "Pawns go home." }, { by: 'a', say: "Not this week." }, { by: 'b', say: "...Fine. Yes." }] },
    { id: 'pk.g2', turns: [{ by: 'b', say: "I'll do it. But I'm not happy about it." }, { by: 'a', say: "I know." }, { by: 'b', say: "And you'll owe me." }] },
    { id: 'pk.g3', turns: [{ by: 'b', dr: "I said yes. I didn't want to." }] },
    { id: 'pk.g4', turns: [{ by: 'b', say: "Do you know how many pawns have gone home in this game?" }, { by: 'a', say: "This one won't." }, { by: 'b', say: "That's what they all hear." }] },
    { id: 'pk.g5', turns: [{ by: 'b', say: "It's a yes. It's not a favour." }, { by: 'a', dr: "{b} said yes, but {b} wasn't happy about it. I need to remember that." }] },
    { id: 'pk.g6', turns: [{ by: 'b', say: "Somebody else said no first, didn't they?" }, { by: 'a', say: "...Yes." }, { by: 'b', say: "Great. I'm the backup pawn." }] },
  ],
  'power.pawn-ask.forced': [
    { id: 'pk.f1', turns: [{ by: 'b', say: "I already said no." }, { by: 'a', say: "I know." }, { by: 'b', dr: "{a} asked. I said no. I'm going up anyway. So it was never really a question." }] },
    { id: 'pk.f2', turns: [{ by: 'a', dr: "Nobody would volunteer for the chair. So I've stopped offering it." }] },
    { id: 'pk.f3', turns: [{ by: 'a', say: "You're going up as a pawn." }, { by: 'b', say: "I said no." }, { by: 'a', say: "I'm not asking any more." }] },
    { id: 'pk.f4', turns: [{ by: 'b', dr: "{a} didn't ask me. {a} told me. I won't forget that." }] },
    { id: 'pk.f5', turns: [{ by: 'b', say: "So my answer didn't count." }, { by: 'a', say: "I needed somebody." }, { by: 'b', say: "You needed me. That's different. Remember it." }] },
    { id: 'pk.f6', turns: [{ by: 'a', dr: "Everyone said no. I picked the person I thought could take it. {b} won't see it that way." }] },
  ],

  // ── the real plan ── a HOH, b ally, c the real target (not in the room)
  'power.backdoor.plan': [
    { id: 'pd.p1', turns: [{ by: 'a', say: "Those two were never the point." }, { by: 'b', say: "Then who is?" }, { by: 'a', say: "{c}. After the veto." }] },
    { id: 'pd.p2', turns: [{ by: 'a', say: "Veto comes down, somebody comes off, and {c} goes up without ever getting to play for it." }, { by: 'b', say: "That's cold." }, { by: 'a', say: "That's the plan." }] },
    { id: 'pd.p3', turns: [{ by: 'a', say: "If I'd put {c} up at nominations, {c} could have won the veto and walked straight off." }, { by: 'b', say: "So you waited." }, { by: 'a', say: "So I waited." }] },
    { id: 'pd.p4', turns: [{ by: 'b', say: "Why those two, then?" }, { by: 'a', say: "Because neither of them is the one I want." }, { by: 'b', dr: "{a} smiled when I asked. That's when I worked out the real name." }] },
    { id: 'pd.p5', turns: [{ by: 'a', say: "Nobody can know. Not even the nominees." }, { by: 'b', say: "Especially not {c}." }, { by: 'a', say: "Especially not {c}." }] },
    { id: 'pd.p6', turns: [{ by: 'a', dr: "A backdoor only works if it's a surprise. Now someone else knows. I hope I can trust {b}." }] },
  ],

  // ── the night before nominations ── a and b guessing; {target} their guess
  'power.nom-eve.right': [
    { id: 'pe2.r1', when: { known: true }, turns: [{ by: 'a', say: "It's {target}. It has to be {target}." }, { by: 'b', say: "You sound very sure." }, { by: 'a', say: "Watch." }] },
    { id: 'pe2.r2', when: { known: true }, turns: [{ by: 'a', say: "Run through it with me. Who's going up?" }, { by: 'b', say: "{target}, and whoever's the pawn." }, { by: 'a', dr: "We were right. Neither of us looked pleased about it." }] },
    { id: 'pe2.r3', turns: [{ by: 'a', say: "Am I going up?" }, { by: 'b', say: "No." }, { by: 'a', say: "How do you know?" }, { by: 'b', say: "I don't. But it's the only answer that lets us go to bed." }] },
    { id: 'pe2.r4', turns: [{ beat: '{a} and {b} sit at opposite ends of the couch, going through the house name by name.' }, { by: 'b', say: "That's everyone." }, { by: 'a', say: "Then we know. We just don't like it." }] },
    { id: 'pe2.r5', when: { known: true }, turns: [{ by: 'a', dr: "Everyone's going to act surprised tomorrow when {target} goes up. I'm not going to be one of them." }] },
    { id: 'pe2.r6', turns: [{ by: 'b', say: "Nobody's going to sleep tonight, are they?" }, { by: 'a', say: "Not a chance." }] },
  ],
  'power.nom-eve.wrong': [
    { id: 'pe2.w1', when: { known: true }, turns: [{ by: 'a', say: "It's {target}. It's got to be." }, { by: 'b', say: "I'm not so sure." }, { by: 'a', say: "Trust me." }] },
    { id: 'pe2.w2', when: { known: true }, turns: [{ by: 'a', say: "{target}'s going up. Guaranteed." }, { by: 'b', say: "And if it isn't?" }, { by: 'a', say: "Then I'll be very surprised." }] },
    { id: 'pe2.w3', turns: [{ by: 'a', say: "Am I going up?" }, { by: 'b', say: "No way." }, { by: 'a', say: "You're sure?" }, { by: 'b', say: "No. But I'm saying it anyway." }] },
    { id: 'pe2.w4', turns: [{ beat: '{a} counts on {a.posAdj} fingers everyone the HOH spoke to today, and keeps getting a different answer.' }, { by: 'b', say: "You've counted that four times." }, { by: 'a', say: "Because it keeps changing." }] },
    { id: 'pe2.w5', when: { known: true }, turns: [{ by: 'b', dr: "{a} is so sure it's {target}. I'm not. Tomorrow one of us gets to say \"I told you so\"." }] },
    { id: 'pe2.w6', turns: [{ by: 'b', say: "Do you ever get these right?" }, { by: 'a', say: "Sometimes." }, { by: 'b', say: "That's not reassuring." }] },
  ],

  // ── saved by their own hand ── a saved, b HOH
  'power.saved-self.saved': [
    { id: 'pz.s1', turns: [{ by: 'a', dr: "I took myself off the block. Nobody in this house can take that away from me. {b} had to find another name, and {b} knows I made that happen." }] },
    { id: 'pz.s2', turns: [{ by: 'a', dr: "I don't feel like celebrating. Hearing my name at that ceremony once was enough to show me how easily they'll say it again." }] },
    { id: 'pz.s3', turns: [{ by: 'a', say: "I didn't have a choice." }, { by: 'b', say: "Nobody said you did." }, { by: 'a', say: "I know. I just keep saying it." }] },
    { id: 'pz.s4', turns: [{ beat: 'The room goes quiet after the ceremony. Everyone knows somebody else has to go up now.' }, { by: 'a', dr: "Everyone's wondering who goes up now. At least it isn't me." }] },
    { id: 'pz.s5', turns: [{ by: 'a', dr: "Safe this week. Target next week. That's what saving yourself buys you. It's still worth it." }] },
    { id: 'pz.s6', turns: [{ by: 'b', dr: "{a} cost me a week. I won't forget it." }] },
  ],

  // ── the replacement reacts ── a replacement, b HOH, c the one who came off
  'power.replaced-reacts.angry': [
    { id: 'pa.a1', turns: [{ by: 'a', say: "Twenty minutes ago I was safe! Twenty minutes!" }, { by: 'b', say: "I know. I'm sorry." }, { by: 'a', say: "Sorry doesn't take me off the block, does it?" }] },
    { id: 'pa.a2', turns: [{ by: 'a', say: "Say it to me properly. Stand up and say it." }, { by: 'b', say: "It was the best move for my game." }, { by: 'a', say: "And worst for mine." }] },
    { id: 'pa.a3', when: { room: ['kitchen'] }, turns: [{ beat: '{a} slams a cupboard that did nothing wrong. Two people leave the room.' }, { by: 'a', dr: "I'm angry. I'm allowed to be angry. I'll be strategic tomorrow." }] },
    { id: 'pa.a4', turns: [{ by: 'a', dr: "{b} and I were close this week. Close people don't do this." }] },
    { id: 'pa.a5', turns: [{ by: 'a', say: "You couldn't even warn me?" }, { by: 'b', say: "There wasn't time." }, { by: 'a', say: "There's always time." }] },
    { id: 'pa.a6', when: { third: true }, turns: [{ by: 'a', dr: "{c} came off, and I went up. {c} hasn't said a word to me. I've noticed." }] },
  ],
  'power.replaced-reacts.crushed': [
    { id: 'pa.c1', turns: [{ by: 'a', say: "It's fine. Honestly. It's fine." }, { by: 'a', dr: "I've said \"it's fine\" four times in ten minutes. By the fourth I'd stopped believing it." }] },
    { id: 'pa.c2', turns: [{ beat: 'Nobody sees {a} for two hours. When {a} comes back, {a} has washed {a.posAdj} face and is being very pleasant to everybody.' }, { by: 'a', dr: "I needed two hours. Now I'm fine. I'm going to be fine. I'm saying it until it's true." }] },
    { id: 'pa.c3', turns: [{ beat: '{a} sits on the end of a bed and stays there. Somebody brings a plate of food. It goes cold.' }, { by: 'a', dr: "I'm not hungry. I'm not anything right now." }] },
    { id: 'pa.c4', turns: [{ by: 'a', dr: "I don't have the energy to be angry. I just want to sleep until Thursday." }] },
    { id: 'pa.c5', turns: [{ by: 'a', dr: "I thought this week was going to be easy. I really did." }] },
    { id: 'pa.c6', turns: [{ by: 'b', say: "Are you okay?" }, { by: 'a', say: "Do you actually want to know?" }, { by: 'b', say: "...Yes." }, { by: 'a', say: "Then no." }] },
  ],
  'power.replaced-reacts.cold': [
    { id: 'pa.k1', turns: [{ by: 'a', say: "Congratulations on the veto. Thanks for being straight with me, {b}." }, { by: 'a', dr: "I'm counting votes before the room's even emptied." }] },
    { id: 'pa.k2', turns: [{ by: 'a', dr: "Within the hour I'd spoken to four people. {b} thought I was the easy option. {b} might want to check that." }] },
    { id: 'pa.k3', turns: [{ by: 'a', say: "That's the game." }, { by: 'b', dr: "{a} meant it. That's worse for me than if {a} had shouted." }] },
    { id: 'pa.k4', turns: [{ by: 'a', dr: "I'm not wasting time being angry. I've got four days to campaign." }] },
    { id: 'pa.k5', turns: [{ by: 'a', dr: "{b} thinks I'm the easy option. I'm going to prove {b} wrong." }] },
    { id: 'pa.k6', turns: [{ beat: '{a} shakes {b}\'s hand after the ceremony, calmly, and walks straight out to start working the house.' }, { by: 'a', dr: "I shook {b}'s hand. Now I'm going to get myself off this block." }] },
  ],

  // ── the veto holder's fallout ── a holder, b HOH, c the one saved
  'power.veto-fallout.fallout': [
    { id: 'pf2.f1', turns: [{ by: 'b', say: "You could have told me first." }, { by: 'a', say: "I know." }, { beat: 'Neither of them knows what to say.' }] },
    { id: 'pf2.f2', turns: [{ by: 'a', dr: "{b} hasn't said a word about the veto. That's the problem. We're being extremely polite to each other, and the whole house can hear it." }] },
    { id: 'pf2.f3', turns: [{ by: 'a', dr: "I saved {c}. Now I live in a house where {b} knows exactly where I stand. I knew that would happen. I did it anyway." }] },
    { id: 'pf2.f4', turns: [{ by: 'b', dr: "{a} could have left my nominations alone. {a} didn't. Was that loyalty to {c}, or a warning to me? I'm going to find out." }] },
    { id: 'pf2.f5', turns: [{ by: 'b', say: "Was that about {c}, or about me?" }, { by: 'a', say: "It was about {c}." }, { by: 'b', say: "It didn't feel like it." }] },
    { id: 'pf2.f6', turns: [{ by: 'a', dr: "Using the veto makes you two people's hero and one person's enemy. The enemy is the Head of Household. Great." }] },
  ],

  // ── nobody is surprised ── a and b, watching
  'power.no-surprise.flat': [
    { id: 'pu.f1', turns: [{ by: 'a', say: "That's it?" }, { by: 'b', say: "That's it." }, { by: 'a', say: "Four minutes. I've had longer showers." }] },
    { id: 'pu.f2', turns: [{ by: 'a', dr: "Nothing changed at the veto meeting. Everyone expected that. Nobody said it, in case it sounded like gloating." }] },
    { id: 'pu.f3', turns: [{ by: 'b', say: "What happened at the ceremony?" }, { by: 'a', say: "Nothing." }, { by: 'b', say: "Right." }, { beat: '{b} goes straight back to what {b} was doing.' }] },
    { id: 'pu.f4', turns: [{ by: 'a', dr: "Same two names this morning, same two names tonight. This week was decided days ago." }] },
    { id: 'pu.f5', turns: [{ beat: 'Two people go straight back to bed after the ceremony.' }, { by: 'a', dr: "Nothing changed at that ceremony. Even I was bored, and it's my week on the line." }] },
    { id: 'pu.f6', turns: [{ by: 'a', say: "Well, that was predictable." }, { by: 'b', say: "Predictable is good. Predictable means nobody's coming for us." }] },
  ],

  // ── seeing the backdoor coming ── a the target, b HOH
  'power.fears-backdoor.sees': [
    { id: 'pfb.s1', turns: [{ by: 'a', dr: "Two names on the block, and neither of them is the real target. I think the real target is me." }] },
    { id: 'pfb.s2', turns: [{ by: 'a', say: "I just want to play in the veto. That's all." }, { by: 'a', dr: "I've said that to four people now. Nobody believed the fourth one." }] },
    { id: 'pfb.s3', turns: [{ by: 'a', dr: "If I win the veto, I can't be put up. That's all I need to do this week." }] },
    { id: 'pfb.s4', turns: [{ by: 'a', say: "Am I safe this week?" }, { by: 'b', say: "Of course you're safe." }, { by: 'a', dr: "Of course. So I'm lobbying for a veto chip anyway." }] },
    { id: 'pfb.s5', turns: [{ by: 'a', say: "If you pull houseguest's choice, think of me." }, { by: 'a', dr: "I'm not asking to play. I'm asking to survive." }] },
    { id: 'pfb.s6', turns: [{ by: 'a', dr: "{b} keeps smiling at me. I don't trust it." }] },
    { id: 'pfb.s7', when: { register: 'cool' }, turns: [{ by: 'a', dr: "The nominations don't make sense unless the real target isn't on the block. I'm not on the block. I think it's me." }] },
  ],
  // ── "pick me and I'll save you" ── a the seller, b the nominee
  'power.pick-me.bought': [
    { id: 'pm.b1', turns: [{ by: 'a', say: "If you pull houseguest's choice, pick me. I win that veto, and it comes down on you." }, { by: 'b', say: "You'd do that?" }, { by: 'a', say: "I'm offering, aren't I?" }] },
    { id: 'pm.b2', turns: [{ by: 'a', say: "You need somebody in that veto who wants you to stay. That's me." }, { by: 'b', say: "And what do you want for it?" }, { by: 'a', say: "Later. We'll talk about later later." }] },
    { id: 'pm.b3', turns: [{ by: 'b', dr: "{a} offered to play for me before anybody else thought of it. I've got no better offer, so I'm taking it." }] },
    { id: 'pm.b4', turns: [{ by: 'a', say: "Pick me. I'll take you down. Simple." }, { by: 'b', say: "Okay. If I get the chance, it's you." }] },
    { id: 'pm.b5', turns: [{ by: 'a', say: "I'm not going to pretend it's a favour. There's a price, later. But I'll get you off that block." }, { by: 'b', say: "...Deal." }] },
    { id: 'pm.b6', turns: [{ by: 'b', dr: "I'm going to pick {a} if I can. And then spend the rest of the week hoping {a} meant it." }] },
    { id: 'pm.b7', turns: [{ by: 'a', say: "Who else are you going to pick? Seriously. Who else is offering?" }, { by: 'b', say: "...Nobody." }, { by: 'a', say: "Exactly." }] },
  ],
  'power.pick-me.refused': [
    { id: 'pm.r1', turns: [{ by: 'a', say: "Pick me, and I'll save you." }, { by: 'b', say: "Thank you." }, { by: 'b', dr: "I said thank you. I didn't mean it. {a} hasn't done one thing all week to make me believe that." }] },
    { id: 'pm.r2', turns: [{ by: 'a', say: "Pick me and I'll get you off the block." }, { by: 'b', say: "I've heard you say that to someone else this week." }, { by: 'a', say: "...That was different." }] },
    { id: 'pm.r3', turns: [{ beat: '{a} spends ten minutes making the case for being the safest pair of hands in the veto.' }, { by: 'b', dr: "{a} talked for ten minutes. I'm picking somebody I've known longer than ten minutes." }] },
    { id: 'pm.r4', turns: [{ by: 'a', say: "You can trust me." }, { by: 'b', say: "That's exactly what someone I can't trust would say." }] },
    { id: 'pm.r5', turns: [{ by: 'a', say: "I'd use it on you. I swear." }, { by: 'b', say: "Why?" }, { by: 'a', say: "...Because I'm nice?" }, { by: 'b', say: "Try again." }] },
    { id: 'pm.r6', turns: [{ by: 'b', dr: "When somebody offers to save you before you've even asked, you have to wonder what they're really after." }] },
    { id: 'pm.r7', turns: [{ by: 'a', say: "I'm your best shot." }, { by: 'b', say: "You're a shot. I don't know about best." }] },
  ],
};

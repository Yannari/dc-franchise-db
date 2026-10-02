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
      { beat: 'Two people leave the room. The other two pretend to be very interested in the fridge.' },
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
      { beat: 'Nobody wants a show. They get one anyway.' },
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
      { by: 'a', dr: "I don't need company. I need four votes. Company is easier to find." },
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
      { by: 'a', dr: "Panic is for people with no plan. I've got a plan. It's got names on it." },
    ] },
    { id: 'pb.f7', when: { register: 'cool' }, turns: [
      { by: 'a', dr: "I've counted. I'm two votes short. Two votes is a conversation, not a crisis." },
    ] },
    { id: 'pb.f8', when: { register: 'competitor' }, turns: [
      { by: 'a', dr: "The veto is the only vote I need. Win that, and none of this matters." },
    ] },
  ],

  // ── the pawn ──────────────────────────────────────────────────────
  'power.pawn.takes': [
    { id: 'pw.t1', turns: [{ by: 'a', dr: "I said yes to being the pawn. I meant it. I'm also remembering exactly who asked, and how fast they said I'd be fine." }] },
    { id: 'pw.t2', turns: [{ by: 'a', say: "I get it. I'm the safe one." }, { by: 'a', dr: "I said that lightly. I don't feel it lightly." }] },
    { id: 'pw.t3', when: { third: true }, turns: [{ by: 'a', dr: "I'm sitting next to {c}, and I'm doing the maths on what happens if one vote wanders." }] },
    { id: 'pw.t4', turns: [{ by: 'a', dr: "{b} owes me now. I'm going to make sure {b} remembers that." }] },
    { id: 'pw.t5', turns: [{ by: 'b', say: "You know you're safe, right?" }, { by: 'a', say: "I know. I trust you." }, { by: 'a', dr: "I do trust {b}. I just trust the votes less." }] },
    { id: 'pw.t6', turns: [{ by: 'a', dr: "Being the pawn is a favour. Favours in this house get paid back. I'm keeping the receipt." }] },
  ],
  'power.pawn.resents': [
    { id: 'pw.r1', turns: [{ by: 'a', dr: "I was told this was a formality. I've counted the votes twice now. \"Formality\" is a very thin word." }] },
    { id: 'pw.r2', turns: [{ by: 'a', say: "Pawns go home. Everybody knows pawns go home." }, { beat: 'Nobody in the room answers.' }] },
    { id: 'pw.r3', turns: [{ by: 'a', dr: "Being used as furniture stopped being funny somewhere around the second day." }] },
    { id: 'pw.r4', turns: [{ beat: '{a} smiles through the rest of the day, and stops the moment the camera is behind {a.obj}.' }, { by: 'a', dr: "I smile for {b}. I don't smile for me." }] },
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
    { id: 'pt.s3', turns: [{ by: 'a', dr: "Four visits before dinner. {b} made none of them. That's a statement, whether {b} meant it as one or not." }] },
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
    { id: 'pg.r1', turns: [{ by: 'a', dr: "Best bed in the house, and I can't sleep in it. I keep doing the maths and it keeps coming out wrong." }] },
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
    { id: 'pp.r4', turns: [{ by: 'b', say: "I need a straight answer. Am I going up?" }, { by: 'a', say: "Your key isn't coming out of that box." }, { by: 'b', say: "Thank you." }] },
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
};

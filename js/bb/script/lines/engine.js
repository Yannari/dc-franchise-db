// ══════════════════════════════════════════════════════════════════════
// bb/script/lines/engine.js — beats the week engine builds itself (Phase 6)
// ══════════════════════════════════════════════════════════════════════
//
// Written through bb/script/inject.js scriptBeat from week.js.
//
//   engine.unseen     a flipped on {group}, undetected, and asks who did it     scene
//   engine.blame      a decides b flipped; b did not                            blamed | deflected ({source} steered a)
//   engine.bravado    a speaks first after a twist is announced                 paranoid | dread | power
//   engine.recalc     a, the strategist, says nothing and thinks                paranoid | dread (intent noveto) | power
//   engine.outsiders  a and b, the two least powerful, find each other         paranoid | dread | power
//   engine.block      a, the HOH, kept all of {group} off the block; b, c in it   scene
//   engine.declined   a, a nominee, does not campaign                           misread | safe | resigned

export default {
  'engine.unseen.scene': [
    { id: 'ea2.1', turns: [{ by: 'a', say: "Who flipped? Somebody in {group} flipped." }, { beat: 'Nobody answers.' }, { by: 'a', dr: "I asked twice, loudly. Nobody suspects the one asking." }] },
    { id: 'ea2.2', turns: [{ by: 'a', say: "We had the numbers. Somebody lied." }, { beat: 'Everyone looks at everyone else.' }] },
    { id: 'ea2.3', turns: [{ by: 'a', dr: "{group} came out of that vote one short. I know exactly which chair it came from. Nobody else does." }] },
    { id: 'ea2.4', turns: [{ by: 'a', say: "Let's count it again." }, { beat: 'The count still does not work.' }] },
    { id: 'ea2.5', turns: [{ by: 'a', dr: "That was the best move I've made all season, and nobody can ever know it was me." }] },
    { id: 'ea2.6', turns: [{ by: 'a', say: "Somebody in this room is a liar." }, { by: 'a', dr: "Yes. Me." }] },
  ],
  'engine.blame.blamed': [
    { id: 'eb2.b1', turns: [{ by: 'a', dr: "It was {b}. It has to be. {b} was always the one I wasn't sure about." }] },
    { id: 'eb2.b2', turns: [{ by: 'a', say: "Did you flip?" }, { by: 'b', say: "No!" }, { by: 'a', say: "Somebody did." }, { by: 'b', dr: "And it wasn't me." }] },
    { id: 'eb2.b3', turns: [{ by: 'b', dr: "{a} has decided I'm the one who flipped. I didn't. Now we're at war over nothing." }] },
    { id: 'eb2.b4', turns: [{ by: 'a', dr: "No proof, no confession. But {b} fits. That's enough for me." }] },
    { id: 'eb2.b5', turns: [{ by: 'a', say: "I know it was you." }, { by: 'b', say: "You don't know anything." }] },
    { id: 'eb2.b6', turns: [{ by: 'b', dr: "I voted with the group. Nobody believes me." }] },
  ],
  'engine.blame.deflected': [
    { id: 'eb2.d1', turns: [{ by: 'a', dr: "{source} walked me through the vote twice. The only name that fits is {b}." }] },
    { id: 'eb2.d2', turns: [{ by: 'a', dr: "{source} never actually accused {b}. I worked it out myself. I think." }] },
    { id: 'eb2.d3', turns: [{ by: 'b', dr: "Somebody has pointed everyone at me. I'd love to know who." }] },
    { id: 'eb2.d4', turns: [{ by: 'a', dr: "Every way I count it, I end up at {b}. {source} agrees." }] },
    { id: 'eb2.d5', turns: [{ by: 'a', say: "Just tell me the truth. Did you flip?" }, { by: 'b', say: "No!" }, { by: 'a', dr: "That's exactly what {source} said {b} would say." }] },
    { id: 'eb2.d6', turns: [{ by: 'b', dr: "I'm being blamed for a vote I didn't cast. Whoever did this to me is very good." }] },
  ],
  'engine.bravado.paranoid': [
    { id: 'ec2.p1', turns: [{ by: 'a', say: "Well. It's one of you." }, { beat: 'Half the room laughs. The other half does not.' }] },
    { id: 'ec2.p2', turns: [{ by: 'a', say: "Okay. Who is it? Hands up." }, { beat: 'Nobody puts a hand up.' }] },
    { id: 'ec2.p3', turns: [{ by: 'a', say: "It's not me. Just so everyone knows." }, { beat: 'That makes it worse.' }] },
    { id: 'ec2.p4', turns: [{ by: 'a', say: "So one of us is working against the rest of us." }, { beat: '{a} looks slowly along the sofas.' }] },
    { id: 'ec2.p5', turns: [{ by: 'a', say: "Great. Now nobody can trust anybody." }, { beat: 'Nobody argues.' }] },
    { id: 'ec2.p6', turns: [{ by: 'a', say: "I'm going to work out who it is. Watch me." }] },
  ],
  'engine.bravado.dread': [
    { id: 'ec2.d1', turns: [{ by: 'a', say: "So whoever wins that comp gets to end someone's game before dinner." }, { beat: 'Nobody laughs.' }] },
    { id: 'ec2.d2', turns: [{ by: 'a', say: "Well, that's terrifying." }, { beat: 'Nobody disagrees.' }] },
    { id: 'ec2.d3', turns: [{ by: 'a', say: "So there's no safety net this week." }, { beat: 'Nobody answers. Nobody is breathing properly.' }] },
    { id: 'ec2.d4', turns: [{ by: 'a', say: "Right. Nobody panic." }, { beat: 'Everyone panics.' }] },
    { id: 'ec2.d5', turns: [{ by: 'a', say: "This week could end anyone's game. Including mine." }] },
    { id: 'ec2.d6', turns: [{ by: 'a', say: "That rule doesn't give anyone anything. It just takes something away." }] },
  ],
  'engine.bravado.power': [
    { id: 'ec2.w1', turns: [{ by: 'a', say: "Good. I hope I win it." }, { beat: 'Half the room laughs. The other half takes note.' }] },
    { id: 'ec2.w2', turns: [{ by: 'a', say: "That's mine. I'm calling it now." }] },
    { id: 'ec2.w3', turns: [{ by: 'a', say: "Whoever gets that is going to run this house." }, { beat: 'Several people look at {a}.' }] },
    { id: 'ec2.w4', turns: [{ by: 'a', say: "Everyone else is scared of that twist. I'm excited." }] },
    { id: 'ec2.w5', turns: [{ by: 'a', say: "I want that." }, { beat: 'Nobody is surprised.' }] },
    { id: 'ec2.w6', turns: [{ by: 'a', say: "Finally. Something to play for." }] },
  ],
  'engine.recalc.paranoid': [
    { id: 'ed2.p1', turns: [{ by: 'a', dr: "There are {count} of us, and one of us is lying. I've got all season to find out who." }] },
    { id: 'ed2.p2', turns: [{ by: 'a', dr: "From now on, nobody in here gets believed about anything. Including me." }] },
    { id: 'ed2.p3', turns: [{ by: 'a', dr: "Who flinched when the rule was read? I saw two people." }] },
    { id: 'ed2.p4', turns: [{ by: 'a', dr: "Paranoia is going to do half the work for whoever this is." }] },
    { id: 'ed2.p5', turns: [{ beat: '{a} says nothing at all.' }, { by: 'a', dr: "I'm counting the room." }] },
    { id: 'ed2.p6', turns: [{ by: 'a', dr: "If I find out who it is, that's my biggest move of the season." }] },
  ],
  'engine.recalc.dread': [
    { id: 'ed2.d1', when: { intent: 'noveto' }, turns: [{ by: 'a', dr: "No time to talk anyone round this week. No veto to hide behind. Everything has to be done before that comp ends." }] },
    { id: 'ed2.d2', when: { intent: 'noveto' }, turns: [{ by: 'a', dr: "Whatever happens this week happens fast. I need a plan before the comp, not after." }] },
    { id: 'ed2.d3', when: { intent: 'noveto' }, turns: [{ by: 'a', dr: "No veto. Whoever goes on the block stays on the block." }] },
    { id: 'ed2.d4', turns: [{ by: 'a', dr: "The rule does the damage before anyone gets a say. By the time we can talk about it, it's already happened." }] },
    { id: 'ed2.d5', turns: [{ by: 'a', dr: "I can't stop this rule. I can only make sure it doesn't land on me." }] },
    { id: 'ed2.d6', turns: [{ by: 'a', dr: "Everyone's scared. Scared people make mistakes. I'm going to watch for them." }] },
  ],
  'engine.recalc.power': [
    { id: 'ed2.w1', turns: [{ beat: '{a} says nothing at all.' }, { by: 'a', dr: "I've already taken that rule apart and put it back together twice." }] },
    { id: 'ed2.w2', turns: [{ by: 'a', dr: "Who wins this matters more than the power itself. I need it to be someone I can work with." }] },
    { id: 'ed2.w3', turns: [{ by: 'a', dr: "Everyone's excited. I'm working out how this could be used against me." }] },
    { id: 'ed2.w4', turns: [{ by: 'a', dr: "A new power changes every plan I had. Back to the drawing board." }] },
    { id: 'ed2.w5', turns: [{ by: 'a', dr: "If I can't win it, I need to be close to whoever does." }] },
    { id: 'ed2.w6', turns: [{ by: 'a', dr: "I'm quiet in the room. In my head, I'm very busy." }] },
  ],
  'engine.outsiders.paranoid': [
    { id: 'ee2.p1', turns: [{ by: 'a', say: "It isn't you, is it?" }, { by: 'b', say: "No. It isn't you?" }, { by: 'a', say: "No." }, { beat: 'They decide to believe each other.' }] },
    { id: 'ee2.p2', turns: [{ beat: '{a} and {b} find each other before anyone else moves.' }, { by: 'b', dr: "We ruled each other out. On nothing." }] },
    { id: 'ee2.p3', turns: [{ by: 'a', dr: "{b} and I agreed, without saying it, that it's not either of us." }] },
    { id: 'ee2.p4', turns: [{ by: 'b', say: "We trust each other, right?" }, { by: 'a', say: "Right. Just us." }] },
    { id: 'ee2.p5', turns: [{ by: 'a', dr: "In a house where somebody is lying, you need one person you believe. I picked {b}." }] },
    { id: 'ee2.p6', turns: [{ by: 'b', dr: "{a} and I looked at each other and just knew. Not us." }] },
  ],
  'engine.outsiders.dread': [
    { id: 'ee2.d1', turns: [{ by: 'a', dr: "{b} and I did the same maths. Neither of us wins that comp. Neither of us has anyone upstairs to ask." }] },
    { id: 'ee2.d2', turns: [{ by: 'a', say: "What do we do?" }, { by: 'b', say: "Hope." }] },
    { id: 'ee2.d3', turns: [{ by: 'b', dr: "When the rule was read, {a} looked straight at me. We both knew we were in trouble." }] },
    { id: 'ee2.d4', turns: [{ by: 'a', say: "Stick with me this week?" }, { by: 'b', say: "Where else would I go?" }] },
    { id: 'ee2.d5', turns: [{ by: 'b', dr: "{a} and I have nothing to bargain with. At least we've got each other." }] },
    { id: 'ee2.d6', turns: [{ by: 'a', dr: "People like {b} and me never have a safety net. This week nobody does." }] },
  ],
  'engine.outsiders.power': [
    { id: 'ee2.w1', turns: [{ beat: '{a} and {b} trade a look across the sofas.' }, { by: 'a', dr: "Whatever this rule is for, it isn't for people like us." }] },
    { id: 'ee2.w2', turns: [{ by: 'b', say: "That power's not coming to us." }, { by: 'a', say: "No. It never does." }] },
    { id: 'ee2.w3', turns: [{ by: 'a', dr: "{b} and I sat next to each other all evening. Neither of us is winning that." }] },
    { id: 'ee2.w4', turns: [{ by: 'b', say: "Want to be useless together?" }, { by: 'a', say: "Always." }] },
    { id: 'ee2.w5', turns: [{ by: 'a', dr: "The people who'll win that power aren't sitting on our sofa." }] },
    { id: 'ee2.w6', turns: [{ by: 'b', dr: "{a} and I aren't strong enough to win it. We're smart enough to stick together." }] },
  ],
  'engine.block.scene': [
    { id: 'ef2.1', turns: [{ by: 'b', dr: "Every member of {group} is off the block. {a} looked after us. Everyone noticed." }] },
    { id: 'ef2.2', turns: [{ by: 'a', dr: "I didn't put anyone from {group} up. People will notice. I don't care." }] },
    { id: 'ef2.3', turns: [{ beat: 'Nobody says it out loud, but the block has a shape.' }, { by: 'b', dr: "None of {group} is up there. That's not an accident." }] },
    { id: 'ef2.4', turns: [{ by: 'b', say: "Thanks." }, { by: 'a', say: "For what?" }, { by: 'b', say: "You know what." }] },
    { id: 'ef2.5', turns: [{ by: 'a', dr: "Protecting {group} this week was the plan. Now everyone can see the plan." }] },
    { id: 'ef2.6', turns: [{ by: 'b', dr: "We're safe. But everyone outside {group} just watched {a} protect us. That's a target." }] },
  ],
  'engine.declined.misread': [
    { id: 'eg2.m1', turns: [{ by: 'a', dr: "I've counted. The votes are with me. I don't need to campaign." }, { beat: 'Nobody corrects {a}.' }] },
    { id: 'eg2.m2', turns: [{ by: 'a', dr: "Campaigning would only make me look worried. I'm not worried." }] },
    { id: 'eg2.m3', turns: [{ by: 'a', dr: "I've done the maths. I'm staying. No need to beg." }] },
    { id: 'eg2.m4', turns: [{ beat: '{a} spends the day relaxing instead of campaigning.' }, { by: 'a', dr: "Why would I campaign? I'm fine." }] },
    { id: 'eg2.m5', turns: [{ by: 'a', dr: "Everyone's been nice to me all week. That's my answer." }] },
    { id: 'eg2.m6', turns: [{ by: 'a', dr: "I'm not chasing votes I've already got." }] },
  ],
  'engine.declined.safe': [
    { id: 'eg2.s1', turns: [{ by: 'a', dr: "There's nothing to campaign about. Asking for votes I've already got just looks suspicious." }] },
    { id: 'eg2.s2', turns: [{ by: 'a', dr: "I'm not going round begging. That's what people do when they know something." }] },
    { id: 'eg2.s3', turns: [{ by: 'a', dr: "If I start campaigning, people will wonder why." }] },
    { id: 'eg2.s4', turns: [{ by: 'a', dr: "The less I do this week, the better." }] },
    { id: 'eg2.s5', turns: [{ by: 'a', dr: "I don't need to say anything. My game speaks for itself." }] },
    { id: 'eg2.s6', turns: [{ by: 'a', dr: "Staying quiet is the plan." }] },
  ],
  'engine.declined.resigned': [
    { id: 'eg2.r1', turns: [{ by: 'a', dr: "I know the numbers. Asking people won't change them." }] },
    { id: 'eg2.r2', turns: [{ by: 'a', dr: "I could go round asking. It won't change a single vote." }] },
    { id: 'eg2.r3', turns: [{ by: 'a', dr: "Either this is the smartest decision I make all season, or the last one." }] },
    { id: 'eg2.r4', turns: [{ by: 'a', dr: "I've decided not to beg. If I'm going, I'm going with my head up." }] },
    { id: 'eg2.r5', turns: [{ by: 'a', dr: "Everyone's made their minds up. I'd only be wasting their time." }] },
    { id: 'eg2.r6', turns: [{ by: 'a', dr: "I'm not campaigning. I'm saying goodbye properly instead, just in case." }] },
  ],
};

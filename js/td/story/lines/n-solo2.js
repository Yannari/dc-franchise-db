// ══════════════════════════════════════════════════════════════════════
// td/story/lines/n-solo2.js — second and third takes on the one-entry pools
// ══════════════════════════════════════════════════════════════════════
// Read in a played season (2026-10-09): the same "overheard" confessional twice in one evening, and the
// same pair-case reason from two voters in one episode. Each of these pools had one entry, so every
// voter with that reason said the identical sentence. Same placeholders, same facts, other words.

const c = (id, ...confs) => ({ id, turns: confs.map(conf => ({ by: 'a', conf })) });

export default {
  'arc.warn.overheard': [
    { id: 'nso.h3', when: { self: false }, turns: [
      { beat: "{a} is coming back with an armful of firewood when {pitcher}'s voice drifts out from behind the cabins, low and quick." },
      { beat: "{a} stops, listens for a second, and then keeps walking like nothing happened." },
      { by: 'a', conf: "{pitcher} is working on {target}. I only caught the end of it, but the end was enough, and now I know something {target} doesn't." },
    ] },
    { id: 'nso.h4', when: { self: false }, turns: [
      { beat: "{a} is lying down in the shade with {a.posAdj} eyes shut. {pitcher} walks right past, mid-pitch, and doesn't notice {a} is awake." },
      { by: 'a', conf: "{pitcher} thought I was asleep. I wasn't. It's {target} tonight, apparently, and I get to decide whether {target} finds that out." },
    ] },
    { id: 'nso.h5', when: { self: true }, turns: [
      { beat: "{a} is filling a water bottle when the conversation behind {a.obj} stops dead. {pitcher} has just noticed who is standing there." },
      { by: 'a', conf: "They went quiet the second they saw me, and you only go quiet like that when the person standing there is the person you were talking about." },
    ] },
  ],

  'vp.solo.case.sank': [
    c('nso.s1', "We'd have won that challenge if {target} had held it together. I like {target} fine, but I like winning more."),
    c('nso.s2', "Everybody saw what happened out there. I'm just writing down what we all watched {target} do."),
  ],
  'vp.solo.case.idol': [
    c('nso.i1', "{target} keeps disappearing into the woods and coming back calm, and calm people out here are holding something. I want them gone before they get to use it."),
    c('nso.i2', "If {target} has an idol, the worst thing we can do is wait. The best time to vote out an idol is while it's still in a pocket."),
  ],
  'vp.solo.case.pair': [
    c('nso.p1', "{target} and {partner} do everything together, and two votes that never split are more dangerous than one big threat."),
    c('nso.p2', "If I don't break up {target} and {partner} now, I'll be sitting next to them at the end, losing. So one of them goes, and it's {target}."),
    c('nso.p3', "Nobody wants to be the one who splits up {target} and {partner}, so I'll do it, and I'll feel bad about it later."),
  ],
  'vp.solo.case.group': [
    c('nso.g1', "{target} has {theirs} behind them, and I don't. Every one of them I take out makes the numbers a little less scary."),
    c('nso.g2', "This isn't personal. {theirs} has too many people, and {target} is the easiest one to pull out of it."),
  ],
  'vp.solo.case.grudge': [
    c('nso.d1', "I could pretend this is strategy, but it's not. {target} has been getting under my skin since day one, and I'm done putting up with it."),
    c('nso.d2', "{target} and I were never going to work. I'd rather end it tonight on my terms than wait for {target} to do it to me."),
  ],
  'vp.solo.case.threat': [
    c('nso.t1', "Everybody likes {target}, and everybody would vote for {target} at the end. That's exactly why {target} can't get there."),
    c('nso.t2', "I keep waiting for somebody else to say it, and nobody does, so I'm saying it: {target} is the biggest threat here, and the window to do something about it is closing."),
  ],
  'vp.solo.case.outsider': [
    c('nso.o1', "{target} doesn't really have anybody. It's a little sad, but it means nobody's going to be angry with me tomorrow."),
    c('nso.o2', "Writing {target} costs me nothing. No friends to upset, no alliance to answer to, and I get to keep everybody I actually like."),
  ],
  'vp.solo.case.numbers': [
    c('nso.n1', "Everybody I talked to today ended up on {target}, and I'm not going to be the one vote nobody can explain."),
    c('nso.n2', "The house has decided it's {target}. I'm not fighting the house tonight, I'm saving that for a night when it matters."),
  ],
  'vp.solo.case.isolate': [
    c('nso.l1', "Once {target} is gone, {keep} has nowhere else to go, and people with nowhere else to go are very, very loyal."),
  ],
  'vp.solo.case.pledge': [
    c('nso.e1', "{target} told me {protects} was off limits, and that's exactly when you know where the real alliance is. So that alliance loses somebody tonight."),
  ],

  'vp.solo.count.close': [
    { id: 'nso.k1', when: { otherMe: false }, turns: [{ by: 'a', conf: "It's not locked, though. There's a group on {other}, and it only takes one person to get cold feet for the whole night to flip." }] },
  ],
  'vp.solo.count.tight': [
    c('nso.k2', "I think we have it, but I've thought that before and been wrong. There's another plan going around, and I can't tell which one is bigger."),
  ],
  'vp.solo.count.all': [
    c('nso.k3', "Honestly, this one's done. Everybody's on the same name, and the only person who doesn't know it is {target}."),
  ],
  'vp.solo.count.enough': [
    c('nso.k4', "I count {votes} on it. It's not everybody, but it doesn't need to be everybody, it just needs to be enough."),
  ],
};

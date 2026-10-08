// ══════════════════════════════════════════════════════════════════════
// td/story/lines/n-plan.js — the plan, as a strategy talk, beat by beat
// ══════════════════════════════════════════════════════════════════════
//
// director.js planTalk builds the scene from these, each beat chosen from what is true tonight
// (header there). a runs the plan; b is with a; c and d are there in a group (may be missing).
// {target} is tonight's name. {votes}: how many are writing it. {others}: the ones writing it who
// aren't in this scene. Case data: {mark} (coming: who {target}'s side is after; fact markMe when
// that's a), {partner} (pair), {theirs} (group). Push data: {alt} (the name b would rather write).
// Count data: {other} and {them} (close: the other side's name and how many are on it).
// Ids: 'npl.'.

export default {
  // ── the pull-aside ──
  'vp.open.duo': [
    { id: 'npl.o1', turns: [{ beat: "{a} waits until {b} is alone {here}, then sits down right next to {b.obj}." }, { by: 'a', say: "Got a minute? It's about tonight.", v: { bossy: "Walk with me. We need to talk about tonight.", anxious: "Hey, um, can we talk about tonight really quickly?", loud: "Hey, you, come here, we need to talk about tonight!", dry: "So, tonight. Let's just get it over with." } }] },
    { id: 'npl.o2', turns: [{ by: 'a', say: "Okay, nobody's around. Let's figure out tonight.", v: { schemer: "Perfect, everybody's busy. Let's figure out tonight before they do.", goofy: "Okay, secret meeting, so act natural, and stop looking around like that!" } }] },
    { id: 'npl.o3', turns: [{ by: 'b', say: "You've been staring at me for like ten minutes. Just say it.", v: { calm: "You've got the look. Go on, who is it?" } }, { by: 'a', say: "Fine, but not here. Over there." }] },
  ],
  'vp.open.group': [
    { id: 'npl.og1', turns: [{ beat: "{a} rounds up {b}, {c} and the others and walks them away from camp." }, { by: 'a', say: "Okay, everybody close. We don't have long.", v: { bossy: "Circle up. Five minutes, then we split up so nobody notices.", anxious: "Okay, okay, everybody come closer, I don't want anybody hearing this.", loud: "HUDDLE! I mean, huddle, but quietly." } }] },
    { id: 'npl.og2', turns: [{ by: 'c', say: "Why are we all hiding behind the shed?", v: { dry: "Love that we're having our big secret meeting in the most obvious spot here." } }, { by: 'a', say: "Because we're picking a name, and I'd rather the name didn't hear it." }] },
    { id: 'npl.og3', turns: [{ by: 'a', say: "Is everybody here? Good, then nobody say anything until I'm done.", v: { warm: "Okay, thanks for coming, everybody. I'll be quick, I promise." } }, { by: 'b', say: "Okay, but make it quick, people are going to notice we're gone." }] },
  ],

  // ── the case: the name and the real reason ──
  'vp.case.coming': [
    { id: 'npl.cc1', when: { markMe: true }, turns: [
      { by: 'a', say: "{target} is putting my name out there. I heard it twice today.", v: { tough: "{target} wants me gone. So {target} goes first.", anxious: "So, I found out {target} is trying to get my name written down tonight, and I'm kind of freaking out.", schemer: "{target} made a move on me today. Not a good one, but a move." } },
      { by: 'b', say: "Wait, seriously? Who told you?" },
      { by: 'a', say: "Doesn't matter who told me. What matters is that {target} doesn't get the chance." },
    ] },
    { id: 'npl.cc2', when: { markMe: false, markB: false }, turns: [
      { by: 'a', say: "{target}'s group is coming after {mark} tonight. I'm not letting that happen.", v: { bossy: "They're going for {mark}, so we hit {target} first, and that's the end of the discussion.", warm: "They want {mark} out, and {mark} hasn't done anything to anybody, so no." } },
      { by: 'b', say: "{mark}? Why {mark}?" },
      { by: 'a', say: "Because {mark} is with us, and they know it. If we don't move tonight, we're one short tomorrow." },
    ] },
    { id: 'npl.cc3', when: { markB: true }, turns: [
      { by: 'a', say: "I need to tell you something, and you're not going to like it. {target}'s group is coming after you tonight.", v: { blunt: "They're voting you out tonight, {b}. {target}'s whole group.", anxious: "Okay, please don't panic, but I'm pretty sure {target}'s group is writing your name tonight." } },
      { by: 'b', say: "Me? What did I do?" },
      { by: 'a', say: "You're with me, that's what you did. So we get {target} before they get you." },
    ] },
  ],
  'vp.case.sank': [
    { id: 'npl.cs1', turns: [
      { by: 'a', say: "I think it has to be {target}. You saw the challenge.", v: { blunt: "{target} lost us the challenge. That's it, that's the reason.", warm: "I hate saying it, because {target} tried, but we lost that challenge because of {target}.", cruel: "I'm sorry, did anyone else watch {target} out there? Because I'm still recovering." } },
      { by: 'b', say: "It wasn't only {target}." },
      { by: 'a', say: "No, but it was mostly {target}, and if we keep {target}, it'll be {target} again next time." },
    ] },
    { id: 'npl.cs2', turns: [
      { by: 'a', say: "We need to win challenges, and {target} is the one slowing us down. I don't love it, but that's the vote.", v: { competitive: "I want to win, and {target} doesn't help us win, so it's easy.", dry: "We are not a strong team. Let's at least stop being the weakest team." } },
      { by: 'b', say: "So it's purely the challenges." },
      { by: 'a', say: "Purely the challenges. If {target} could carry a log, we wouldn't be talking." },
    ] },
  ],
  'vp.case.idol': [
    { id: 'npl.ci1', turns: [
      { by: 'a', say: "I'm pretty sure {target} found an idol.", v: { schemer: "{target} has an idol. I'd bet my bag on it.", anxious: "Okay, don't freak out, but I think {target} has an idol." } },
      { by: 'b', say: "How do you know?" },
      { by: 'a', say: "Because {target} went for a walk alone, came back way too calm, and hasn't let that bag out of sight since. If we wait, {target} plays it on one of us." },
    ] },
  ],
  'vp.case.pair': [
    { id: 'npl.cp1', turns: [
      { by: 'a', say: "{target} and {partner} are basically one person at this point. Wherever one goes, the other one goes.", v: { dry: "Have you ever seen {target} without {partner}? Because I haven't, not once.", goofy: "{target} and {partner} are so attached I think they share a toothbrush." } },
      { by: 'b', say: "So you want to split them up." },
      { by: 'a', say: "I want to split them up before they're two votes we can't stop. {target} is the one we can get." },
    ] },
  ],
  'vp.case.group': [
    { id: 'npl.cg1', turns: [
      { by: 'a', say: "{target} is with {theirs}. Every time I walk past, they stop talking.", v: { bossy: "{target} is {theirs} and we're not, and that's all anybody needs to know.", warm: "I like {target}, I do, but {target} is with {theirs}, and they're not with us." } },
      { by: 'b', say: "You're sure {target} is in that group?" },
      { by: 'a', say: "Sure enough. And every one of them we take out is one less vote they've got." },
    ] },
  ],
  'vp.case.grudge': [
    { id: 'npl.cr1', turns: [
      { by: 'a', say: "Honestly? I can't stand {target}, and I'm done pretending I can.", v: { calm: "I don't get along with {target}, and I'd rather not spend another week acting like I do.", loud: "If I have to listen to {target} for one more day, I'm going to lose it.", warm: "I've tried so hard with {target}, I really have, and it's just not working." } },
      { by: 'b', say: "That's not really a strategy." },
      { by: 'a', say: "It is when {target} feels the same way about me. One of us goes, and I'd prefer it was {target}." },
    ] },
  ],
  'vp.case.threat': [
    { id: 'npl.ct1', turns: [
      { by: 'a', say: "Think about the end. Who do you not want to be sitting next to?", v: { blunt: "{target} wins this whole thing if we let {target} get far. So we don't.", competitive: "{target} is the best player here after me. That's a problem." } },
      { by: 'b', say: "{target}." },
      { by: 'a', say: "Right. Everybody likes {target}, {target} is good at challenges, and {target} talks to everyone. That's a winner. We take the shot while we can." },
    ] },
    { id: 'npl.ct2', turns: [
      { by: 'a', say: "{target} is going to be really hard to get rid of later, so we do it now, while it's easy.", v: { schemer: "Nobody's thinking about {target} yet. That's exactly why it has to be tonight." } },
      { by: 'b', say: "{target} hasn't done anything wrong, though." },
      { by: 'a', say: "Not yet. That's the point." },
    ] },
  ],
  'vp.case.outsider': [
    { id: 'npl.co1', turns: [
      { by: 'a', say: "Who here is actually close to {target}? Be honest.", v: { dry: "Quick poll: who would cry if {target} went home tonight? Hands up." } },
      { by: 'b', say: "...Nobody, I guess." },
      { by: 'a', say: "Exactly. Nobody's going to be mad about {target}, so nobody's going to come after us for it." },
    ] },
  ],
  'vp.case.numbers': [
    { id: 'npl.cn1', turns: [
      { by: 'a', say: "I've asked around, and {target} is the only name that everybody's okay with.", v: { nerdy: "I did the math. {target} is the only name that gets past half.", bossy: "It's {target}. I already checked, it's the only name that works." } },
      { by: 'b', say: "Is that a good reason?" },
      { by: 'a', say: "It's the reason that doesn't send one of us home. That's good enough for me." },
    ] },
  ],

  // ── the pushback: b's own position ──
  'vp.push.like': [
    { id: 'npl.pl1', turns: [{ by: 'b', say: "I really like {target}, though. Like, actually like {target}.", v: { tough: "I don't hate {target}. That's all I'm saying.", emotional: "But {target} is kind of my friend here, and I really don't want to do this!" } }] },
    { id: 'npl.pl2', turns: [{ by: 'b', say: "Can I say something? {target} has been really good to me." }] },
  ],
  'vp.answer.like': [
    { id: 'npl.al1', turns: [{ by: 'a', say: "I know, and that's exactly why it's hard. But {target} isn't voting for you, {b}. I promise you that.", v: { warm: "I know you do, and I'm sorry. If there was another name that worked, I'd take it.", cruel: "Then you can write {target} a nice letter afterwards." } }] },
    { id: 'npl.al2', turns: [{ by: 'a', say: "Liking someone doesn't keep you safe here. If it did, we'd all still be here." }] },
  ],
  'vp.push.idol': [
    { id: 'npl.pi1', turns: [{ by: 'b', say: "What if {target} has an idol, though? Then we just wasted our votes.", v: { anxious: "What if {target} has an idol? Then it bounces onto one of us, and I'm not ready for that." } }] },
  ],
  'vp.answer.idol': [
    { id: 'npl.ai1', turns: [{ by: 'a', say: "Then we don't all put it on {target}. A couple of us write somebody else, just in case.", v: { schemer: "Then we split. Some on {target}, some on a backup. If an idol comes out, the backup goes home.", dry: "If {target} has one, then {target} has one. A split covers it, and we're not betting the night on a guess." } }] },
  ],
  'vp.push.pair': [
    { id: 'npl.pp1', turns: [{ by: 'b', say: "{partner} is going to lose it if we do this." }] },
  ],
  'vp.answer.pair': [
    { id: 'npl.ap1', turns: [{ by: 'a', say: "{partner} is going to lose it either way. I'd rather {partner} lose it alone than with {target} standing right there.", v: { calm: "{partner} will be upset. Upset people make mistakes, and we'll be ready." } }] },
  ],
  'vp.push.alt': [
    { id: 'npl.pa1', turns: [{ by: 'b', say: "Why not {alt}? I'd honestly rather it was {alt}.", v: { blunt: "I want {alt} out. Not {target}.", goofy: "Counteroffer: {alt}. Final offer: also {alt}." } }] },
    { id: 'npl.pa2', turns: [{ by: 'b', say: "I'll do it, but just so you know, {alt} is the one I really don't trust." }] },
  ],
  'vp.answer.alt': [
    { id: 'npl.aa1', turns: [{ by: 'a', say: "{alt} is next, I promise you. But tonight we only have the votes for {target}.", v: { bossy: "{alt} can wait. {target} can't.", warm: "I hear you, and I'm not saying no to {alt}. I'm saying not tonight." } }] },
    { id: 'npl.aa2', turns: [{ by: 'a', say: "If we go after {alt} tonight, half of these people walk. {target} keeps everybody together." }] },
  ],
  'vp.push.sure': [
    { id: 'npl.ps1', turns: [{ by: 'b', say: "Okay. Yeah, I can do {target}.", v: { quiet: "...Okay.", loud: "Done, easy, love it!", dry: "Sure. I didn't have plans tonight anyway." } }] },
    { id: 'npl.ps2', turns: [{ by: 'b', say: "Honestly, I was going to say {target} if you didn't." }] },
  ],
  'vp.answer.sure': [
    { id: 'npl.as1', turns: [{ by: 'a', say: "Good. Then keep it quiet and act normal.", v: { goofy: "Great, now act normal. No, not like that, less normal." } }] },
  ],

  // ── the count ──
  'vp.count.close': [
    { id: 'npl.k1', when: { otherMe: false, otherB: false }, turns: [
      { by: 'a', say: "Here's where we are: they're trying to get {them} people on {other}. We've got {votes} on {target}, if nobody flips." },
      { by: 'b', say: "That's close." },
      { by: 'a', say: "It's close, so nobody talks to anybody on that side tonight, okay? Not even to be nice.", v: { anxious: "It's way too close. I'm going to be sick until the votes are read.", competitive: "Close is fine. Close means we win by one." } },
    ] },
    { id: 'npl.k2', when: { others: true, otherMe: false, otherB: false }, turns: [
      { by: 'a', say: "Me, you and {others}, that's {votes}, and the other side has {them} on {other}." },
      { by: 'b', say: "And if one of ours flips?" },
      { by: 'a', say: "Then I find out who, and they're next." },
    ] },
    { id: 'npl.k6', when: { otherMe: true }, turns: [
      { by: 'a', say: "And yes, they're coming for me too. They've got {them} on my name, and we've got {votes} on {target}.", v: { tough: "They've got {them} votes on me and we've got {votes} on {target}, so let them try.", anxious: "They've got {them} people on my name, and we've got {votes} on {target}, so please, please let that be enough." } },
      { by: 'b', say: "So if anybody flips, you're gone." },
      { by: 'a', say: "So nobody flips." },
    ] },
    { id: 'npl.k7', when: { otherB: true }, turns: [
      { by: 'a', say: "They've got {them} on you, {b}. We've got {votes} on {target}, so as long as we hold, you're fine." },
      { by: 'b', say: "As long as we hold." },
      { by: 'a', say: "We'll hold." },
    ] },
  ],
  'vp.count.tight': [
    { id: 'npl.k8', when: { otherMe: false, otherB: false }, turns: [
      { by: 'a', say: "I'm not going to lie, it's tight. They're pushing {other} hard, and I think they might have the same numbers we do." },
      { by: 'b', say: "So what do we do?" },
      { by: 'a', say: "We find one more person before dinner, and we don't stop asking until we do." },
    ] },
    { id: 'npl.k9', when: { otherMe: true }, turns: [
      { by: 'a', say: "It's tight. They're pushing my name hard, and it might be even. I need one more person, or I'm the one going home." },
      { by: 'b', say: "Then let's go get one." },
    ] },
    { id: 'npl.k10', when: { otherB: true }, turns: [
      { by: 'a', say: "It's tight, {b}. They're pushing your name, and right now it might be even." },
      { by: 'b', say: "Great. Love that for me." },
      { by: 'a', say: "We'll get one more. I promise." },
    ] },
  ],
  'vp.count.all': [
    { id: 'npl.k3', turns: [
      { by: 'a', say: "And this one isn't close. It's everybody except {target}.", v: { dry: "Spoiler: this one isn't close." } },
      { by: 'b', say: "Does {target} know?" },
      { by: 'a', say: "Not a clue, and let's keep it that way." },
    ] },
  ],
  'vp.count.enough': [
    { id: 'npl.k4', when: { others: true }, turns: [{ by: 'a', say: "I've got {others} on it too. That's {votes}, and {votes} is enough." }] },
    { id: 'npl.k5', turns: [{ by: 'a', say: "That's {votes} of us. It's enough, as long as nobody does anything stupid.", v: { bossy: "That's {votes} votes, and nobody freelances, I mean it." } }] },
  ],

  // ── the button ──
  'vp.close.duo': [
    { id: 'npl.x1', when: { shaky: true }, turns: [
      { by: 'a', say: "The one I'm worried about is {shaky}. Can you sit with {shaky} at dinner and make sure {shaky} is still with us?", v: { bossy: "You're on {shaky}. Stick to {shaky} until we sit down, I don't care how.", anxious: "I'm really worried about {shaky}. Could you maybe check on {shaky}? Casually?" } },
      { by: 'b', say: "I'll talk to {shaky}. What if {shaky} is wobbling?" },
      { by: 'a', say: "Then come and get me, and don't make a big deal of it in front of anybody." },
    ] },
    { id: 'npl.x2', when: { cover: true }, turns: [
      { by: 'a', say: "If anybody asks you, we're voting {cover}. Say {cover}, nothing else." },
      { by: 'b', say: "And if {target} asks me straight out?" },
      { by: 'a', say: "Especially if {target} asks. Look {target} in the eye and say {cover}.", v: { warm: "I know, it's horrible. Just say {cover} and walk away.", schemer: "Then you smile and say {cover}. You'll be surprised how easy it is." } },
    ] },
    { id: 'npl.x3', when: { close: true }, turns: [
      { by: 'b', conf: "{a} could have gone to anybody with this, and {a} came to me, so I'm doing it. If {a} goes down, I go down with {a}, and I'm okay with that." },
    ] },
    { id: 'npl.x4', when: { close: false }, turns: [
      { by: 'b', conf: "I'm not doing this for {a}. I'm doing it because {target} is a bigger problem for me than {a} is, at least for now." },
    ] },
  ],
  'vp.close.group': [
    { id: 'npl.xg1', when: { shaky: true }, turns: [
      { by: 'a', say: "{c}, you go find {shaky} and stay with {shaky} until we leave. {b}, you're with me. Nobody walks back together." },
      { by: 'c', say: "Why me?", v: { goofy: "Why do I always get the babysitting job?" } },
      { by: 'a', say: "Because {shaky} likes you, and right now {shaky} is the one who could change their mind." },
    ] },
    { id: 'npl.xg2', when: { cover: true }, turns: [
      { by: 'c', say: "What do we say if {target} asks what's going on?" },
      { by: 'a', say: "{cover}. Every one of us says {cover}, and we all say it the same way." },
      { by: 'b', say: "{target} isn't stupid, though." },
      { by: 'a', say: "No, but {target} wants to believe it isn't {target}. Everybody does." },
    ] },
    { id: 'npl.xg3', turns: [
      { beat: "The group splits up one at a time, a minute apart." },
      { by: 'c', conf: "That was the first time the {votes} of us actually sat down together and planned something. If it works tonight, we're a real group. If it doesn't, we're just people who got caught behind a shed." },
    ] },
  ],

  // ── nobody to tell: a to the camera ──
  'vp.solo.case.coming': [
    { id: 'npl.sc0', when: { markMe: true }, turns: [{ by: 'a', conf: "{target} is trying to get my name written down tonight. I'm not making a big speech about it, I'm just making sure {target} goes first.", v: { anxious: "I found out {target} is coming for me tonight, and I'm too scared to say it out loud, so I'm just writing {target} and praying.", tough: "{target} wants me gone. Cute. {target} goes first." } }] },
    { id: 'npl.sc1', when: { markMe: false }, turns: [{ by: 'a', conf: "{target}'s side is coming for {mark} tonight. I'm not telling anybody how I know. I'm just writing {target}.", v: { anxious: "I heard {target}'s group is going after {mark}, and I'm too scared to tell anybody, so I'm just going to write {target} and hope." } }] },
  ],
  'vp.solo.case.sank': [
    { id: 'npl.sc2', turns: [{ by: 'a', conf: "I don't need a meeting for this one. {target} cost us the challenge, and everybody watched it happen." }] },
  ],
  'vp.solo.case.idol': [
    { id: 'npl.sc3', turns: [{ by: 'a', conf: "I'm fairly sure {target} is sitting on an idol, and I'd love to get it out of the game in {target}'s pocket." }] },
  ],
  'vp.solo.case.pair': [
    { id: 'npl.sc4', turns: [{ by: 'a', conf: "{target} and {partner} are a pair, and pairs get to the end, so I'm splitting them up tonight." }] },
  ],
  'vp.solo.case.group': [
    { id: 'npl.sc5', turns: [{ by: 'a', conf: "{target} is with {theirs}, and I'm not with {theirs}, so this is the easiest decision I'll make all week." }] },
  ],
  'vp.solo.case.grudge': [
    { id: 'npl.sc6', turns: [{ by: 'a', conf: "I don't have a big strategy tonight. I just don't like {target}, and {target} doesn't like me, so one of us has to go.", v: { calm: "{target} and I were never going to work. I'd rather end it on my terms." } }] },
  ],
  'vp.solo.case.threat': [
    { id: 'npl.sc7', turns: [{ by: 'a', conf: "If {target} makes it to the end, {target} wins. I'm not going to sit there and watch that happen.", v: { competitive: "{target} is the only one here I'm actually scared of, so it's {target}." } }] },
  ],
  'vp.solo.case.outsider': [
    { id: 'npl.sc8', turns: [{ by: 'a', conf: "Nobody here is close to {target}, so nobody's going to come after me for writing it. That's the whole plan." }] },
  ],
  'vp.solo.case.numbers': [
    { id: 'npl.sc9', turns: [{ by: 'a', conf: "I've been listening all day, and {target} is the name. I'm not going to fight it, I'm going to go with it.", v: { schemer: "Everyone thinks they chose {target} tonight, and that's fine, let them." } }] },
  ],
  'vp.solo.count.close': [
    { id: 'npl.sk1', when: { otherMe: false }, turns: [{ by: 'a', conf: "It's close, though. There's a whole other group on {other}, and if one person changes their mind, it's a different night." }] },
  ],
  'vp.solo.count.tight': [
    { id: 'npl.sk4', turns: [{ by: 'a', conf: "It's going to be tight. There's a whole other plan out there, and I honestly don't know who's got more people." }] },
  ],
  'vp.solo.count.all': [
    { id: 'npl.sk2', turns: [{ by: 'a', conf: "And this won't even be close. Everybody's writing it except {target}." }] },
  ],
  'vp.solo.count.enough': [
    { id: 'npl.sk3', turns: [{ by: 'a', conf: "It's {votes} votes, I'm pretty sure. That should be enough." }] },
  ],
};

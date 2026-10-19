// ══════════════════════════════════════════════════════════════════════
// ch/script/lines/pairs-vote.js — the vote week of a Pairs season
// ══════════════════════════════════════════════════════════════════════
//
// The same scenes as a solo season (vote.js, spine.js, campaign.js), with the pair as the unit: the house votes a
// PAIR in, a threat is "put us in and we take you", a plea is for two. write.js reads '<kind>~pairs.<ending>' INSTEAD
// of the solo pool in a Pairs season, so every ending a kind can have is here (an .any would join every ending).
// {pt} is the target's partner, {pa}/{pb}/{pc} the partners of a/b/c, as the scene happened.
//
// A pair is plural: "{b} and {pb} are", "them", "they". Ballots are short: most people say the pair and one sentence.

export default {
  // ── TJ opens the vote, and reads it ──────────────────────────────────
  'cer-open~pairs.all': [
    { id: 'pco~.1', turns: [{ by: 'tj', say: "Here we go, people! One pair, two names, said out loud. The pair with the most votes goes into the Arena together." }] },
    { id: 'pco~.2', turns: [{ by: 'tj', say: "Deliberation's over. Everybody names a pair. Not a person, a pair. Whoever gets the most is spending tomorrow in the Arena." }] },
    { id: 'pco~.3', turns: [{ by: 'tj', say: "I want pairs, I want reasons, and I want drama. Mostly drama. Who's going in?" }] },
    { id: 'pco~.4', turns: [{ by: 'tj', say: "Remember, people, you're not voting for one person this season. You're sending two home, or one pair back stronger. Choose carefully." }] },
  ],
  'cer-open~pairs.m': [
    { id: 'pcom~.1', turns: [{ by: 'tj', say: "Men's week! One of the guys' pairs is going into the Arena, and everybody gets a say. Let's hear it." }] },
    { id: 'pcom~.2', turns: [{ by: 'tj', say: "It's a men's vote, people. Name a pair of fellas, out loud, to my face. Let's go." }] },
  ],
  'cer-open~pairs.f': [
    { id: 'pcof~.1', turns: [{ by: 'tj', say: "Ladies' week! One of the women's pairs is going into the Arena, and the whole house decides which. Who's it gonna be?" }] },
    { id: 'pcof~.2', turns: [{ by: 'tj', say: "Women's vote, people! Name a pair of ladies, nice and loud. I love this part." }] },
  ],
  'cer-result~pairs.clear': [
    { id: 'pcr~.c1', turns: [{ by: 'tj', say: "That's {count} votes! {a} and {pa}, you're going into the Arena!" }] },
    { id: 'pcr~.c2', turns: [{ by: 'tj', say: "The house has spoken. {a}, {pa}, with {count} votes, you two are going in." }, { beat: '{a} and {pa} look at each other. Neither of them looks surprised.' }] },
    { id: 'pcr~.c3', turns: [{ by: 'tj', say: "{count} votes for {a} and {pa}. Nobody's catching that. Pack light, guys, the Arena's waiting." }] },
  ],
  'cer-result~pairs.tie': [
    { id: 'pcr~.t1', turns: [{ by: 'tj', say: "It's a tie! And the winners break it. They've picked... {a} and {pa}! You're going in!" }] },
    { id: 'pcr~.t2', turns: [{ by: 'tj', say: "Dead even! So it's up to the winning pair. They say {a} and {pa}. Sorry, you two." }] },
  ],

  // ── the ballots: a voter, the one they mean ({b}), and that one's partner ({pb}) ──
  'ballot~pairs.any': [
    { id: 'bpr.1', turns: [{ by: 'a', say: '{b} and {pb}.' }] },
    { id: 'bpr.2', turns: [{ by: 'a', say: "I'm voting for {b} and {pb}." }] },
    { id: 'bpr.3', turns: [{ by: 'a', say: "{b} and {pb}. Nothing personal." }] },
    { id: 'bpr.4', turns: [{ by: 'a', say: "I'm going to say {b} and {pb}." }] },
    { id: 'bpr.5', turns: [{ by: 'a', say: "{b} and {pb}, because I think it's their turn." }] },
    { id: 'bpr.6', turns: [{ by: 'a', say: "My vote is {b} and {pb}." }] },
    { id: 'bpr.7', turns: [{ by: 'a', say: "It's {b} and {pb} for me." }] },
    { id: 'bpr.8', turns: [{ by: 'a', say: "{b} and {pb}. I think we all saw this coming." }] },
    { id: 'bpr.9', turns: [{ by: 'a', say: "I'm going {b} and {pb}. Let's see what they can do in there." }] },
    { id: 'bpr.10', turns: [{ by: 'tj', say: '{a}?' }, { by: 'a', say: '{b} and {pb}.' }] },
    { id: 'bpr.11', turns: [{ by: 'tj', say: "{a}, my friend, which pair you got?" }, { by: 'a', say: "{b} and {pb}, TJ." }] },
    { id: 'bpr.12', turns: [{ by: 'tj', say: "{a}, your turn." }, { by: 'a', say: "I'm voting {b} and {pb}." }] },
    { id: 'bpr.13', turns: [{ by: 'a', say: "{b} and {pb}. Sorry, guys." }] },
    { id: 'bpr.14', turns: [{ by: 'a', say: "I'll say {b} and {pb}." }] },
    { id: 'bpr.15', turns: [{ by: 'a', say: "{b} and {pb}, and I'll stand by it." }] },
    { id: 'bpr.16', turns: [{ by: 'tj', say: "Who's it gonna be, {a}?" }, { by: 'a', say: "{b} and {pb}." }] },
    { id: 'bpr.17', turns: [{ by: 'a', say: "Honestly? {b} and {pb}." }] },
    { id: 'bpr.18', turns: [{ by: 'a', say: "{b} and {pb}. Good luck in there, both of you." }] },
    { id: 'bpr.19', turns: [{ by: 'a', say: "{pb} and {b}. I don't think anybody's surprised." }] },
    { id: 'bpr.20', turns: [{ by: 'a', say: "I'm putting up {b} and {pb}. Both of you, as a pair." }] },
    { id: 'bpr.21', when: { band: 'friends' }, turns: [{ by: 'a', say: "This one hurts, but... {b} and {pb}." }] },
    { id: 'bpr.22', when: { band: 'friends' }, turns: [{ by: 'a', say: "{b}. {pb}. I'm sorry. I'll explain later." }, { by: 'b', say: 'Wow.' }] },
    { id: 'bpr.23', when: { band: 'friends' }, turns: [{ by: 'a', say: "{b}, I love you, but you and {pb} are going in. I'm sorry." }] },
    { id: 'bpr.24', when: { band: 'enemies', early: false }, turns: [{ by: 'a', say: "{b} and {pb}. Obviously." }] },
    { id: 'bpr.25', when: { band: 'enemies', early: false }, turns: [{ by: 'a', say: "{b} and {pb}. And I'd do it every week if they let me." }] },
    { id: 'bpr.26', when: { band: 'cold', early: false }, turns: [{ by: 'a', say: "{b} and {pb}. We all know why." }] },
    { id: 'bpr.27', when: { register: 'fiery' }, turns: [{ by: 'a', say: "{b} and {pb}! Next question!" }] },
    { id: 'bpr.28', when: { register: 'shy' }, turns: [{ by: 'a', say: "Um... {b} and {pb}." }] },
    { id: 'bpr.29', when: { register: 'sweet' }, turns: [{ by: 'a', say: "I really like you two, but I'm voting for {b} and {pb}. I'm sorry." }] },
    { id: 'bpr.30', when: { register: 'cool' }, turns: [{ by: 'a', say: "{b} and {pb}. It's the right move." }] },
    { id: 'bpr.31', when: { register: 'competitor' }, turns: [{ by: 'a', say: "{b} and {pb}. If you want to stay, go win." }] },
    { id: 'bpr.32', when: { register: 'schemer' }, turns: [{ by: 'a', say: "{b} and {pb}. I'm sure you both understand." }] },
  ],
  'ballot~pairs.plan': [
    { id: 'bpp.1', turns: [{ by: 'a', say: "{b} and {pb}. I'm sticking with my people." }] },
    { id: 'bpp.2', turns: [{ by: 'a', say: "{b} and {pb}. I think we all know how this one's going." }] },
    { id: 'bpp.3', turns: [{ by: 'a', say: "{b} and {pb}. That's where my group is, and that's where I am." }] },
    { id: 'bpp.4', turns: [{ by: 'a', say: "{b} and {pb}." }, { by: 'a', conf: "I didn't pick {b} and {pb}. My alliance did. I just said it out loud." }] },
    { id: 'bpp.5', when: { band: 'friends' }, turns: [{ by: 'a', say: "{b}... {pb}... I'm sorry. My hands are kind of tied." }, { by: 'a', conf: "Voting for {b} was the worst thing I've done in here. I did it for the group." }] },
  ],
  'ballot~pairs.word': [
    { id: 'bpw.1', turns: [{ by: 'a', say: "{b} and {pb}. I gave my word to somebody, and I keep my word." }] },
    { id: 'bpw.2', turns: [{ by: 'a', say: "{b} and {pb}. I said I would, so I am." }] },
    { id: 'bpw.3', turns: [{ by: 'a', say: "{b} and {pb}. I made a promise." }] },
  ],
  'ballot~pairs.own': [
    { id: 'bpo.1', turns: [{ by: 'a', say: "{b} and {pb}. Nobody told me to. This one's all me." }] },
    { id: 'bpo.2', turns: [{ by: 'a', say: "{b} and {pb}. I'm voting with my gut." }] },
    { id: 'bpo.3', turns: [{ by: 'a', say: "{b} and {pb}, because I think they're the pair that beats me." }] },
    { id: 'bpo.4', turns: [{ by: 'a', say: "I'm not in anybody's group, so I'll just say it. {b} and {pb}." }] },
  ],
  'ballot~pairs.falseyes': [
    { id: 'bpf.1', turns: [{ by: 'a', say: "{b} and {pb}." }, { by: 'a', conf: "I told my group yes. I never said which yes. {b} and {pb} were always my vote." }] },
    { id: 'bpf.2', turns: [{ by: 'a', say: "I'm going {b} and {pb}." }, { beat: 'Somebody from {a}\'s group turns around fast.' }] },
  ],
  'ballot~pairs.broke': [
    { id: 'bpb.1', turns: [{ by: 'a', say: "{b} and {pb}. I know that's not what we said. I'm doing it anyway." }] },
    { id: 'bpb.2', turns: [{ by: 'a', say: "Sorry, everybody. {b} and {pb}." }, { by: 'a', conf: "My group wanted another pair. I couldn't make myself say it. So I said {b} and {pb}." }] },
  ],
  'ballot~pairs.changed': [
    { id: 'bpc.1', turns: [{ by: 'a', say: "I said one thing this morning. I'm saying another now. {b} and {pb}." }] },
    { id: 'bpc.2', turns: [{ by: 'a', say: "{b} and {pb}." }, { by: 'b', say: "That's not what you told me." }, { by: 'a', say: "I know." }] },
  ],
  // a ballot that says why: the voter's own reason, out loud, about the pair
  'ballot-why~pairs.threat': [
    { id: 'bpy.t1', when: { proven: true }, turns: [{ by: 'a', say: "{b} and {pb}. You two are winning too much, and somebody has to stop it now." }] },
    { id: 'bpy.t2', turns: [{ by: 'a', say: "{b} and {pb}. If they get to the final, none of us win. That's it." }] },
    { id: 'bpy.t3', turns: [{ by: 'a', say: "{b} and {pb}. You're the best pair in this house, and that's exactly the problem." }] },
    { id: 'bpy.t4', turns: [{ by: 'a', say: "{b} and {pb}. I'd rather face you two now than in the final." }] },
  ],
  'ballot-why~pairs.grudge': [
    { id: 'bpy.g1', turns: [{ by: 'a', say: "{b} and {pb}. {b} knows exactly why." }] },
    { id: 'bpy.g2', turns: [{ by: 'a', say: "{b} and {pb}. {b} came after me, so I'm coming after both of you." }] },
    { id: 'bpy.g3', turns: [{ by: 'a', say: "{b} and {pb}. Sorry, {pb}. This one's about {b}." }] },
    { id: 'bpy.g4', turns: [{ by: 'a', say: "{b} and {pb}. I haven't forgotten, {b}, and I'm not going to." }] },
  ],
  'ballot-why~pairs.easy': [
    { id: 'bpy.e1', turns: [{ by: 'a', say: "{b} and {pb}. Honestly, I think any pair in here beats you two." }] },
    { id: 'bpy.e2', turns: [{ by: 'a', say: "{b} and {pb}. It's the safest vote for the rest of us." }] },
    { id: 'bpy.e3', turns: [{ by: 'a', say: "{b} and {pb}. Nothing personal. I just think you go home." }] },
  ],
  'ballot-why~pairs.strategy': [
    { id: 'bpy.s1', turns: [{ by: 'a', say: "{b} and {pb}. Whatever happens in that Arena, it's good for me." }] },
    { id: 'bpy.s2', turns: [{ by: 'a', say: "{b} and {pb}. Win or lose, a pair I'm worried about goes home." }] },
    { id: 'bpy.s3', turns: [{ by: 'a', say: "{b} and {pb}. It's strategy. Don't take it personally." }] },
  ],
  'ballot-why~pairs.floater': [
    { id: 'bpy.f1', when: { neverIn: true }, turns: [{ by: 'a', say: "{b} and {pb}. You've never been in. It's your turn." }] },
    { id: 'bpy.f2', turns: [{ by: 'a', say: "{b} and {pb}. Everybody else has had to fight. Let's see you two do it." }] },
    { id: 'bpy.f3', when: { early: false }, turns: [{ by: 'a', say: "{b} and {pb}. You've been hiding all season, the pair of you." }] },
  ],
  'ballot-why~pairs.power': [
    { id: 'bpy.p1', turns: [{ by: 'a', say: "{b} and {pb}. Your group runs this house, and somebody has to break it up." }] },
    { id: 'bpy.p2', turns: [{ by: 'a', say: "{b} and {pb}. You've got too many friends in here. That's the reason." }] },
  ],
  'ballot-why~pairs.room': [
    { id: 'bpy.r1', turns: [{ by: 'a', say: "Looks like it's going {b} and {pb}. I'm not going to fight the room." }] },
    { id: 'bpy.r2', turns: [{ by: 'a', say: "{b} and {pb}. I heard the count. I'm not throwing my vote away." }] },
  ],
  'ballot-why~pairs.money': [
    { id: 'bpy.m1', when: { richest: true }, turns: [{ by: 'a', say: "{b} and {pb}. {b} has the biggest bank in here. Somebody needs to take half of it." }] },
    { id: 'bpy.m2', turns: [{ by: 'a', say: "{b} and {pb}. All that money makes you a target. Sorry." }] },
  ],

  // ── an alliance meets about a pair ───────────────────────────────────
  'meeting~pairs.united': [
    { id: 'mtp.u1', turns: [
      { beat: '{a} pulls the group onto the balcony and slides the door shut.' },
      { by: 'a', say: "Okay. I think it's {target} and {pt}. Is anybody going to fight me on that?",
        v: { dry: "Okay. {target} and {pt}. Somebody argue with me, so it feels like a real meeting.", loud: "It's {target} and {pt}. I've thought about it all day and I'm not changing my mind, so if you want to fight me on it, do it now.", soft: "Okay. I keep coming back to {target} and {pt}. Tell me if I'm being unfair." } },
      { by: 'b', say: "No. They make sense. I'm good with it." },
      { by: 'c', opt: 1, say: "Same. They're the pair I'm most worried about." },
      { by: 'a', say: "Then we all say {target} and {pt}, and nobody gets cute about it." },
      { by: 'b', say: "And if somebody's partner isn't in the group?" },
      { by: 'a', say: "Then you talk to your partner. That's two votes, not one." },
      { by: 'a', conf: "In a Pairs season, every vote comes with a second one attached. If I get the people in {alliance}, I get their partners too.",
        v: { sharp: "I'm not counting people this season, I'm counting pairs. Get one person in {alliance} and their partner comes too.", dry: "Nobody in this house votes alone this season. Everybody brings a plus-one, and I've invited the whole of {alliance}.", soft: "I'm asking people to trust {alliance} this week. If they say yes, their partners have to say yes too." } },
    ] },
    { id: 'mtp.u2', turns: [
      { by: 'a', say: "Everybody in. We've got about ten minutes before the others start wondering where we are." },
      { by: 'b', say: "Who are we thinking?" },
      { by: 'a', say: "{target} and {pt}. If we don't do it now, we're going to regret it.",
        v: { loud: "{target} and {pt}. We do it now, while we can, or we spend the rest of the season wishing we had.", dry: "{target} and {pt}. I'd rather do it now than explain at the final why we didn't.", soft: "{target} and {pt}. I don't love it, but if we don't do it now, I think we'll regret it." } },
      { by: 'b', say: "Done. I was hoping somebody would say it." },
      { by: 'c', opt: 1, say: "{pt} isn't going to like it." },
      { by: 'a', opt: 'c', say: "{pt} doesn't get a say. That's the point of a vote." },
      { by: 'b', conf: "{target} and {pt} look far too comfortable in here. Somebody has to make them work for it.",
        v: { sharp: "{target} and {pt} are too comfortable, and comfortable pairs end up in the final. Not this one.", dry: "{target} and {pt} walk around this villa like they've already won. Let's see how they walk around the Arena.", soft: "I've got nothing against {target} or {pt}. They just haven't had a hard day in here yet, and everybody else has." } },
    ] },
    { id: 'mtp.u3', turns: [
      { by: 'a', say: "We've got the numbers, so let's use them. {target} and {pt} go in.",
        v: { dry: "We've got the numbers. It would be rude not to use them. {target} and {pt}.", loud: "We have the numbers this week, and I'm not wasting them. {target} and {pt} go in.", soft: "We've got the numbers right now. I'd rather use them on {target} and {pt} than wait and lose them." } },
      { by: 'b', say: "I'm in. Should we tell anybody else?" },
      { by: 'a', say: "Only the pairs who'd vote that way anyway. Nobody who'd run to {target} with it." },
      { by: 'b', say: "And if {target} asks us straight out?" },
      { by: 'a', say: "Then we tell them we haven't decided. As far as they know, we haven't." },
      { by: 'a', conf: "Right now {alliance} has the numbers. That's great, right up until somebody else counts them.",
        v: { sharp: "{alliance} has the numbers this week. The minute the rest of the house works that out, we've got a target on us.", soft: "{alliance} has the numbers, and it feels good. I just know it won't feel like this forever." } },
    ] },
    { id: 'mtp.u4', when: { reason: 'grudge' }, turns: [
      { by: 'a', say: "I'm not going to pretend this one isn't personal. I want {target} gone, and that means {pt} too.",
        v: { loud: "This one's personal, and I'm not going to pretend it isn't. {target} goes, and if {pt} has to go too, fine.", dry: "I'll be honest, this one's personal. I just don't like {target}, and {pt} comes in the same box.", soft: "I know this is personal for me. I want {target} gone, and I'm sorry it means {pt} too." } },
      { by: 'b', say: "Personal is fine. It still has to make sense." },
      { by: 'a', say: "It makes sense. {target} is coming for one of us sooner or later, and {pt} goes wherever {target} goes." },
      { by: 'b', conf: "{a} has been waiting for this. I just hope we're not sending a whole pair home over one argument.",
        v: { sharp: "{a} wants this for personal reasons. I'll go along because it helps us too, but I'm not calling it strategy.", dry: "{a} has wanted this since the argument. The rest of us are just the people who agreed to help." } },
    ] },
  ],
  'meeting~pairs.pushback': [
    { id: 'mtp.p1', turns: [
      { by: 'a', say: "So we're all good with {target} and {pt}?" },
      { by: 'b', say: "I mean... I'll do it. I just don't love it." },
      { by: 'a', say: "What would you rather do?" },
      { by: 'b', say: "I don't know. I think there's a scarier pair, and we're scared to say it.",
        v: { sharp: "We're picking the easy pair. There's a scarier one, and nobody here wants to say it.", dry: "There's a scarier pair in this house, and we're all looking at the floor about it.", loud: "Because there's a scarier pair in this house, and we're all too scared to say it, me included." } },
      { by: 'a', say: "Then say it." },
      { by: 'b', say: "Not now. This week I'll go with you." },
      { by: 'b', conf: "I'll vote with them this week. But if {a} keeps making every call for the group, I'm going to start making my own.",
        v: { dry: "This week {a} picked and we all said yes. I'd love to know when we voted {a} in charge.", loud: "One more week of {a} deciding for all of us, and I'm doing my own thing. I mean it.", soft: "I don't want to start a fight in the group. But I need {a} to start asking us, not telling us." } },
    ] },
    { id: 'mtp.p2', turns: [
      { by: 'a', say: "{target} and {pt}. That's the plan." },
      { by: 'b', say: "{pt} hasn't done anything to any of us.",
        v: { soft: "I actually like {pt}. {pt} hasn't done anything to any of us.", dry: "{pt} hasn't done anything to anybody. {pt} barely says a word.", loud: "{pt} hasn't done one single thing to any of us, and you know it." } },
      { by: 'a', say: "{pt} is attached to {target}. That's what {pt} did." },
      { by: 'b', say: "That's a rough way to go home." },
      { by: 'a', say: "Nobody goes home an easy way in here." },
      { by: 'b', conf: "I'm fine sending {target} into the Arena. I just feel bad that {pt} has to go with {target.obj}.",
        v: { sharp: "{target} I can vote for all day. {pt} is just stuck with {target.obj}.", soft: "I'm okay with {target}. It's {pt} I keep thinking about. All {pt} did was get paired with {target.obj}." } },
    ] },
  ],
  'meeting~pairs.refusal': [
    { id: 'mtp.r1', turns: [
      { by: 'a', say: "It's {target} and {pt}. Everybody agreed?" },
      { by: 'b', say: "No. Not them. I'm not voting for them." },
      { by: 'a', say: "Why not?" },
      { by: 'b', say: "Because they've been good to me, and I'm not going to pretend they haven't.",
        v: { loud: "Because they've been good to me! I'm not pretending they haven't just because the group needs a name.", soft: "They've looked after me in here. I can't say their names. I just can't.", dry: "Because they're the only people in this house who've never lied to me. Strange thing to punish." } },
      { by: 'a', say: "So you're going to cost us the vote over a friendship." },
      { by: 'b', say: "I'm going to keep my word. You can do what you want with yours." },
      { by: 'a', conf: "One person saying no is two votes gone in this season. {b} just made this a lot harder.",
        v: { dry: "One no, and it's two votes gone, because {b} comes with a partner. Love that for us.", sharp: "{b} said no, and that's two votes, not one. Now I need to find two more by tomorrow.", soft: "I'm not angry with {b}. I just don't know where I find two more votes now." } },
      { by: 'b', conf: "Vote for whoever you want. I'm not putting {target} and {pt} in the Arena.",
        v: { loud: "I don't care who's mad at me. I'm not putting {target} and {pt} in the Arena.", soft: "I know they're upset with me. I'm still not putting {target} and {pt} in the Arena, not after how they've treated me." } },
    ] },
    { id: 'mtp.r2', turns: [
      { by: 'a', say: "We're going after {target} and {pt}." },
      { by: 'b', say: "Count me out." },
      { by: 'a', say: "Count you out of the vote, or out of the group?" },
      { by: 'b', say: "Out of this vote. Ask me about the group tomorrow." },
      { by: 'b', conf: "{alliance} doesn't get to decide everything. This week it doesn't get my vote.",
        v: { sharp: "{alliance} wants me to vote however I'm told. This week it isn't getting my vote.", dry: "Apparently {alliance} is the kind of group where one person decides. Nobody mentioned that when I joined.", soft: "I love the people in {alliance}. I just can't vote this way, and I'm not going to pretend I can." } },
    ] },
  ],
  'meeting~pairs.falseyes': [
    { id: 'mtp.f1', turns: [
      { by: 'a', say: "{target} and {pt}. Everybody's good?" },
      { by: 'b', say: "Totally. Whatever you need." },
      { by: 'a', say: "That was easy." },
      { by: 'b', conf: "I said yes. I'm not voting for {target} and {pt}. I'll deal with {a} after.",
        v: { dry: "I said yes because it's quicker than saying no. I'm not voting for {target} and {pt}.", sharp: "Yes was the easy answer. My real one is at the vote, and it isn't {target} and {pt}." } },
    ] },
    { id: 'mtp.f2', turns: [
      { by: 'a', say: "So we're all saying {target} and {pt}." },
      { by: 'b', say: "Yeah. Of course." },
      { by: 'c', opt: 1, say: "Yep." },
      { by: 'b', conf: "I nodded. That doesn't mean I'm voting for {target} and {pt}.",
        v: { dry: "Nodding is free. I'm not voting for {target} and {pt}.", soft: "I nodded because I didn't want an argument. I'm still not voting for {target} and {pt}." } },
    ] },
  ],
  'recruit~pairs.accepted': [
    { id: 'rcp.a1', turns: [
      { by: 'a', say: "Can I ask you something? Would you and {pb} vote with us this week?",
        v: { soft: "Can I ask you something? You can say no. Would you and {pb} vote with us this week?", dry: "Before you say no, hear me out. Would you and {pb} vote with us this week?" } },
      { by: 'b', say: "Depends who." },
      { by: 'a', say: "{target} and {pt}." },
      { by: 'b', say: "Yeah. We can do that." },
      { by: 'a', say: "Both of you?" },
      { by: 'b', say: "I'll talk to {pb}. {pb} will be fine." },
      { by: 'a', conf: "One conversation, two votes. In a Pairs season, that's the best deal in the house.",
        v: { dry: "I asked one person and got two votes. I should do this for a living.", odd: "I got two votes for the price of one. I feel like I've been shopping." } },
    ] },
    { id: 'rcp.a2', turns: [
      { by: 'a', say: "We want {target} and {pt}. Are you in?" },
      { by: 'b', say: "We were hoping somebody would come and ask." },
      { by: 'a', say: "Then we're on the same page." },
      { by: 'b', conf: "{a} came to me with the pair I already wanted. I didn't even have to pretend.",
        v: { dry: "{a} came to me with the pair I already wanted. I put on a whole thinking face for nothing.", soft: "I was so relieved when {a} said their names. I didn't have to talk anybody into anything." } },
    ] },
  ],
  'recruit~pairs.refused': [
    { id: 'rcp.r1', turns: [
      { by: 'a', say: "We're putting up {target} and {pt}. We could use you and {pb}." },
      { by: 'b', say: "Sorry. Not them." },
      { by: 'a', say: "Why not?" },
      { by: 'b', say: "Because we've got a deal with them, and we keep our deals." },
      { by: 'a', conf: "Two votes I thought I had, gone. {b} and {pb} are tighter with {target} than I realized.",
        v: { sharp: "{b} and {pb} have a deal with {target}. I didn't know that an hour ago. Now I do.", dry: "Two votes I was counting on, gone, because {b} and {pb} are friends with {target}. Good to know." } },
    ] },
  ],
  'recruit~pairs.hanging': [
    { id: 'rcp.h1', turns: [
      { by: 'a', say: "{target} and {pt}. Will you two vote with us?" },
      { by: 'b', say: "Let me talk to {pb} first." },
      { by: 'a', say: "Sure. Just don't take too long." },
      { by: 'b', conf: "I'm not giving away two votes without talking to my partner. That's how pairs fall apart.",
        v: { soft: "I'm not saying yes for my partner without asking first. I'd want the same.", dry: "I could say yes for both of us. Then I'd have to go home and explain it." } },
    ] },
  ],
  'recruit~pairs.false-yes': [
    { id: 'rcp.f1', turns: [
      { by: 'a', say: "Vote {target} and {pt} with us?" },
      { by: 'b', say: "Absolutely." },
      { by: 'b', conf: "Absolutely not. {target} and {pt} are friends of mine. {a} can find that out at the vote." },
    ] },
  ],
  'plea~pairs.moved': [
    { id: 'plp.m1', when: { early: false }, turns: [
      { by: 'a', say: "{b}, I need you. Please don't put me and {pa} in." },
      { by: 'b', say: "I don't know, {a}." },
      { by: 'a', say: "We've had your back since the first day. When everybody wanted you gone, we didn't say your name.",
        v: { soft: "We've looked after you since the first day. When everybody wanted you gone, we didn't say your name. Not once.", loud: "We had your back from the very first day! When the whole house wanted you gone, we didn't say your name once." } },
      { by: 'b', say: "I know. I know you didn't." },
      { by: 'a', say: "Then don't say ours." },
      { by: 'b', say: "Okay. Okay, I won't." },
      { by: 'b', conf: "{a} wasn't wrong. I owe {a} and {pa} that much.",
        v: { dry: "{a} reminded me what I owe {a} and {pa}. Annoyingly, {a} is right.", soft: "{a} and {pa} looked after me when nobody else did. I can't pay that back with my vote." } },
    ] },
    { id: 'plp.m2', turns: [
      { by: 'a', say: "Can I talk to you? It's about the vote." },
      { by: 'b', say: "I figured." },
      { by: 'a', say: "If you vote for us, {pa} goes home too. {pa} has never done a thing to you.",
        v: { soft: "If you vote for us, {pa} goes home too, and {pa} has only ever been nice to you." } },
      { by: 'b', say: "That's true." },
      { by: 'a', say: "So think about that." },
      { by: 'b', conf: "I could send {a} home and not feel bad. {pa}, I'd feel bad. That's the problem with pairs.",
        v: { dry: "Voting {a} out, I'd sleep fine. {pa}, I'd lie awake. Pairs are so unfair.", loud: "I'd send {a} home tomorrow and never think about it again. But {pa}? {pa} doesn't deserve that." } },
    ] },
  ],
  'plea~pairs.held': [
    { id: 'plp.h1', turns: [
      { by: 'a', say: "Please don't vote for me and {pa}." },
      { by: 'b', say: "I'm sorry. I've already decided." },
      { by: 'a', say: "Then why are you sorry?" },
      { by: 'b', say: "Because I like you. It just doesn't change the vote." },
      { by: 'a', conf: "I begged for two people, and I got nothing for either of us.",
        v: { soft: "I asked as nicely as I know how, for both of us. It didn't change a thing.", dry: "I begged for two people. I've never even begged for one." } },
    ] },
    { id: 'plp.h2', turns: [
      { by: 'a', say: "Is there anything I can say?" },
      { by: 'b', say: "No. You two are the pair. I'm sorry." },
      { by: 'a', conf: "I'm going to have to tell {pa} I tried and it didn't work. That's almost worse than the vote.",
        v: { soft: "Now I have to go and tell {pa} it didn't work. {pa} will be kind about it, and that's worse." } },
    ] },
  ],
  'leverage-threat~pairs.credible': [
    { id: 'ltp.c1', turns: [
      { by: 'a', say: "{b}. Say our names tomorrow, and you and {pb} are the pair we take in. I'm not joking.",
        v: { dry: "{b}. Say our names tomorrow, and I hope you and {pb} have been stretching.", sharp: "{b}. You and {pb} vote for us, you're the pair we pick. Simple." } },
      { by: 'b', say: "You think you can beat us?" },
      { by: 'a', say: "I think you don't want to find out." },
      { by: 'b', conf: "I'd love to call {a}'s bluff. The problem is I don't think {a} is bluffing.",
        v: { sharp: "I'd call {a}'s bluff if I thought it was one. It isn't.", dry: "I want to laugh at {a}. I'd laugh a lot harder if I thought {a} was bluffing." } },
    ] },
    { id: 'ltp.c2', turns: [
      { by: 'a', say: "Just so everybody knows: if {pa} and I go in, we're bringing {b} and {pb} with us." },
      { by: 'b', say: "Why us?" },
      { by: 'a', say: "Because you started this." },
      { by: 'b', conf: "Now everybody who votes for {a} knows they're sending me into the Arena. Great.",
        v: { dry: "So now a vote for {a} is a vote to send me into the Arena. Thanks, {a}.", loud: "{a} just dragged me into this in front of everybody! Now every vote for {a} puts me in there too." } },
    ] },
  ],
  'leverage-threat~pairs.bluff': [
    { id: 'ltp.b1', turns: [
      { by: 'a', say: "Vote us in and we take you and {pb}. I mean it." },
      { by: 'b', say: "Sure you do." },
      { by: 'a', conf: "Would we actually pick {b} and {pb}? I don't know. But {b} doesn't know either, and that's the point.",
        v: { dry: "Would we actually pick {b} and {pb}? No idea. I just like watching {b} wonder.", sharp: "I haven't decided who we'd pick. {b} doesn't know that, and that's the point." } },
    ] },
  ],
  'leverage-threat~pairs.doubted': [
    { id: 'ltp.d1', turns: [
      { by: 'a', say: "Say our names and we're taking you and {pb}." },
      { by: 'b', say: "You've been saying that to everybody all afternoon." },
      { by: 'a', say: "Because I mean it with everybody." },
      { by: 'b', say: "Then it doesn't mean much, does it?" },
      { by: 'b', conf: "{a} has threatened half the house today. You can only take one pair in, so I'm not losing any sleep.",
        v: { dry: "{a} has threatened half the house today. At this rate {a} is going to need about six Arenas.", sharp: "{a} can pick one pair. One. Everybody else {a} threatened today can relax, and I'm betting I'm one of them." } },
    ] },
  ],
  'counter-pitch~pairs.moved': [
    { id: 'cpp.m1', turns: [
      { by: 'a', say: "Before anybody says our names, think about {b} and {pb} for one second." },
      { by: 'b', say: "Wow. Here we go." },
      { by: 'a', say: "Everybody's looking at us. Nobody's looking at them, and they're the pair that wins this if we let them.",
        v: { loud: "Everybody's staring at us, and nobody's watching them! They're the pair that wins this whole thing if we let them.", soft: "I know everybody's looking at us. I'm just asking you to look at them too. They're the ones who could win this." } },
      { by: 'c', opt: 1, say: "{a}'s got a point." },
      { by: 'b', say: "{a} is trying to save {a.ref}." },
      { by: 'a', say: "I am. And I'm still right." },
      { by: 'c', opt: 1, conf: "I walked in with {a}'s pair in my head. Now I'm not sure." },
      { by: 'b', conf: "{a} threw me and {pb} under the bus to save {pa}. I get it. I'm not going to forget it.",
        v: { dry: "{a} saved {pa} by pointing at me and {pb}. Very loyal. To {pa}.", loud: "{a} threw me and {pb} under the bus in front of everybody! I'm not forgetting that, not ever." } },
    ] },
  ],
  'counter-pitch~pairs.held': [
    { id: 'cpp.h1', turns: [
      { by: 'a', say: "Why is nobody saying {b} and {pb}?" },
      { by: 'b', say: "Because it's you this week, {a}. Not us." },
      { by: 'c', opt: 1, say: "We know what you're doing, {a}." },
      { by: 'a', say: "I'm telling you something true." },
      { by: 'a', conf: "Nobody bit. They'd decided on {pa} and me before I opened my mouth.",
        v: { sharp: "Nobody moved. They'd decided on {pa} and me before I opened my mouth, and I knew it halfway through.", dry: "I made my case. The house had made its mind up about {pa} and me already. I was talking to a wall with ears." } },
    ] },
  ],
  'spare-deal~pairs.accepted': [
    { id: 'sdp.a1', turns: [
      { by: 'a', say: "Quick deal. You don't vote for us, and if we go in anyway, we don't pick you and {pb}." },
      { by: 'b', say: "That's it?" },
      { by: 'a', say: "That's it. Simple." },
      { by: 'b', say: "Deal." },
      { by: 'b', conf: "Taking ourselves off {a}'s list for one vote? That's cheap. I'll take it.",
        v: { dry: "One vote to get off {a}'s list? That's the cheapest thing anybody's sold me in here.", sharp: "One vote, and we're off {a}'s list. Easy." } },
    ] },
  ],
  'spare-deal~pairs.refused': [
    { id: 'sdp.r1', turns: [
      { by: 'a', say: "Keep us out of it, and we'll keep you and {pb} out of it." },
      { by: 'b', say: "No deals. Not this week." },
      { by: 'a', say: "You're going to regret that." },
      { by: 'b', conf: "If {a} wants to pick us, let {a} pick us. I'm not trading my vote to be safe.",
        v: { loud: "If {a} wants to pick us, let {a} pick us! I'm not buying my way out of the Arena.", soft: "I don't like making deals to stay safe. If {a} picks us, at least I'll know I played it straight." } },
    ] },
  ],
  'spare-deal~pairs.false': [
    { id: 'sdp.f1', turns: [
      { by: 'a', say: "Don't vote for us, and we won't pick you." },
      { by: 'b', say: "Deal. Of course." },
      { by: 'b', conf: "Of course I'm still voting for {a} and {pa}. If they go in and lose, the deal goes home with them." },
    ] },
  ],
  'house-debate~pairs.one': [
    { id: 'hdp.o1', turns: [
      { by: 'a', say: "Let's just say it. {b} and {pb}. {case}.",
        v: { loud: "Somebody has to say it, so I will. {b} and {pb}. {case}.", dry: "Since nobody else is going to say it out loud: {b} and {pb}. {case}." } },
      { by: 'b', say: "Oh, so we're doing this out loud now." },
      { by: 'd', opt: 1, say: "{a}'s right. Somebody had to say it." },
      { by: 'c', say: "I don't agree. {b} and {pb} have been honest with everybody in this room.",
        v: { soft: "I don't agree. {b} and {pb} have been honest with me from the start, and that should count for something." } },
      { by: 'a', say: "Honest doesn't win the final." },
      { by: 'b', say: "Neither does the whole house picking on one pair." },
      { by: 'a', conf: "Somebody has to say the name first. In a Pairs season, it's two names, and I'll say both.",
        v: { dry: "Somebody always has to say the names first. This season it's two names, so I said both and saved everybody the trouble." } },
      { by: 'b', conf: "{a} said our names in front of the whole house. We'll remember who agreed.",
        v: { loud: "{a} said our names in front of the whole house! Fine. Now I know exactly who nodded.", soft: "Hearing {a} say our names in front of everybody hurt. I watched who agreed, and I'm going to remember." } },
    ] },
    { id: 'hdp.o2', turns: [
      { by: 'a', say: "Is anybody going to pretend it's not {b} and {pb} this week?" },
      { by: 'c', say: "I will. I'm not voting for them." },
      { by: 'a', say: "Why not? {case}." },
      { by: 'c', say: "Because they've been straight with me, and I don't want them gone." },
      { by: 'd', opt: 1, say: "You don't have to want them gone. You just have to vote." },
      { by: 'b', say: "We're standing right here, you know." },
      { by: 'c', conf: "The room's going one way. I'm not going with it, and I'm fine with everybody knowing why.",
        v: { soft: "The room is going one way, and I'm not. I'd rather lose the vote than lie about why." } },
    ] },
  ],
  'house-debate~pairs.split': [
    { id: 'hdp.s1', turns: [
      { by: 'a', say: "I think it's {b} and {pb}. {case}." },
      { by: 'c', say: "I think it's {alt} and {palt}. {altcase}." },
      { by: 'b', say: "Great. So it's us or them." },
      { by: 'a', say: "It's whoever more people agree with." },
      { by: 'c', say: "Then let's see who more people agree with." },
      { by: 'd', opt: 1, say: "This is going to be a long night." },
      { by: 'c', conf: "The house just split right down the middle. Two pairs, one vote, and nobody's sure which way it goes.",
        v: { dry: "Half the house wants one pair and half wants the other. Tomorrow is going to be fun." } },
    ] },
  ],

  // ── the Tribunal in a Pairs season: the winning pair judges, three pairs plead ──
  'cer-nominees~pairs.any': [
    { id: 'tnp.1', turns: [
      { by: 'tj', say: "The votes are in. {a} and {pa}, {b} and {pb}, {c} and {pc}. Three pairs. Tomorrow you go before the Tribunal, and they decide which pair goes into the Arena." },
      { by: 'a', conf: "Being nominated is one thing. Now my partner and I have to convince people who don't owe us anything." },
    ] },
    { id: 'tnp.2', turns: [
      { by: 'tj', say: "Here are your nominees, people: {a} and {pa}, {b} and {pb}, and {c} and {pc}. Tribunal, one of these pairs is yours to send in." },
      { by: 'b', conf: "Three pairs, one spot in the Arena. We need to be the pair they don't pick." },
    ] },
  ],
  // a: the nominee pleading; b: the judge; c: the nominee argued against (case)
  'tribunal-pitch~pairs.plea': [
    { id: 'tpp.p1', turns: [
      { by: 'a', say: "{b}, I'm not here to make a speech. {pa} and I have been straight with you since day one." },
      { by: 'b', say: "I know you have." },
      { by: 'a', say: "Then don't send us in. That's all I'm asking, for both of us." },
      { by: 'b', say: "I hear you. I can't promise anything yet." },
      { by: 'a', say: "I'm not asking for a promise. I'm asking you to remember who's been on your side." },
      { by: 'b', conf: "{a} didn't beg, and that made it harder. I like {a} and {pa}. That's the problem.",
        v: { soft: "{a} didn't beg, and that made it harder. I like {a} and {pa}, and I don't want to be the one who sends them in.", dry: "{a} didn't even beg. It's very hard to say no to somebody who won't ask properly." } },
    ] },
    { id: 'tpp.p2', turns: [
      { by: 'a', say: "Can I talk to you as a person, not as the Tribunal?" },
      { by: 'b', say: "Go ahead." },
      { by: 'a', say: "{pa} and I are running on empty, and I don't think we'd come back from the Arena this week. We need one more week." },
      { by: 'b', say: "That's honest." },
      { by: 'b', conf: "Everybody else came in with a pitch. {a} just told me the truth about the two of them. That counts for something." },
    ] },
  ],
  'tribunal-pitch~pairs.threat': [
    { id: 'tpp.t2', turns: [
      { by: 'a', say: "Think about next week, {b}. You and your partner won't win the daily every time." },
      { by: 'b', say: "Meaning what?" },
      { by: 'a', say: "Meaning the pair you send in has two long memories. {pa}'s is even longer than mine." },
      { by: 'b', conf: "{a} just told the Tribunal to be careful. With two of them, that's twice as many people to be careful of." },
    ] },
    { id: 'tpp.t1', turns: [
      { by: 'a', say: "I'll keep this short. Send us in, and we'll win. And {pa} and I will remember who sent us." },
      { by: 'b', say: "Is that a threat?" },
      { by: 'a', say: "It's a fact. You won't be on the Tribunal forever." },
      { by: 'b', conf: "When {a} and {pa} say they'll come back for us, I believe them. That's what makes it a threat." },
    ] },
  ],
  'tribunal-pitch~pairs.deal': [
    { id: 'tpp.d2', turns: [
      { by: 'a', say: "You need numbers, {b}. We're two of them. Keep us, and you'll never hear our names next to yours at a vote." },
      { by: 'b', say: "And if we don't?" },
      { by: 'a', say: "Then you're giving two people a reason to come after you." },
      { by: 'b', conf: "{a} and {pa} made a good case for keeping them around. Every pair makes a good case. That's the problem." },
    ] },
    { id: 'tpp.d1', turns: [
      { by: 'a', say: "Here's what we're offering. Save us, and that's two votes with you, every week, until the final." },
      { by: 'b', say: "Two votes is a big promise." },
      { by: 'a', say: "And we keep our promises. Ask anybody about {pa}." },
      { by: 'b', conf: "Two guaranteed votes for the rest of the season is worth a lot. If {a} and {pa} mean it." },
    ] },
  ],
  'tribunal-pitch~pairs.case': [
    { id: 'tpp.c2', turns: [
      { by: 'a', say: "Before you decide, look at {c} and {pc}. They've never been in. Not once." },
      { by: 'c', say: "That's because we keep winning." },
      { by: 'a', say: "That's because everybody keeps protecting you." },
      { by: 'b', conf: "{a} has a point about {c} and {pc}. I just don't know if it's a better point than saving {a}." },
      { by: 'c', conf: "{a} pointed at us to get out of it. I get it. I'd have done the same, and I'll remember it anyway." },
    ] },
    { id: 'tpp.c1', turns: [
      { by: 'a', say: "I'm not going to talk about us. I'm going to talk about {c} and {pc}." },
      { by: 'c', say: "Here we go." },
      { by: 'a', say: "They've been playing both sides, and everybody in this room knows it." },
      { by: 'c', say: "That's not true, and you know it." },
      { by: 'b', conf: "{a} came in swinging at {c} and {pc}. Either {a} is right, or {a} is desperate. Maybe both." },
      { by: 'c', conf: "{a} threw us under the bus to save {a.ref} and {pa}. I'm not going to forget it." },
    ] },
  ],
  // a and b: the judges (the winning pair); {target}: the pair they send in
  'tribunal-room~pairs.agree': [
    { id: 'trp.a1', turns: [
      { by: 'a', say: "Okay. I think we both know which pair it is." },
      { by: 'b', say: "{target} and {pt}?" },
      { by: 'a', say: "{target} and {pt}." },
      { by: 'b', say: "Yeah. I'm there." },
      { by: 'a', conf: "It's never fun sending a pair in. But {target} and {pt} help us least by staying." },
    ] },
  ],
  'tribunal-room~pairs.split': [
    { id: 'trp.s1', turns: [
      { by: 'b', say: "I don't want {target} and {pt}. I think we're making a mistake." },
      { by: 'a', say: "Then give me a better pair." },
      { by: 'b', say: "I've been giving you a better pair this whole time." },
      { by: 'a', say: "And I'm telling you it's {target} and {pt}. We're partners. Back me up." },
      { by: 'b', say: "Fine. But this one's on you." },
      { by: 'b', conf: "My own partner outvoted me. When {target} asks, I'm going to tell the truth about who wanted it." },
    ] },
  ],
  // a: the judge who says it; b: the one sent in (with {pb}); c: a nominee spared
  'tribunal-verdict~pairs.any': [
    { id: 'tvp.1', turns: [
      { by: 'tj', say: "Tribunal, you've made your decision. Which pair is going into the Arena?" },
      { by: 'a', say: "{b} and {pb}." },
      { by: 'b', say: "Of course." },
      { by: 'c', opt: 1, conf: "I've never been so relieved to hear another pair's names." },
      { by: 'b', conf: "I'll remember both of the people on that Tribunal. Both of them." },
    ] },
    { id: 'tvp.2', turns: [
      { by: 'tj', say: "Tribunal! Give me a pair." },
      { by: 'a', say: "We're sending in {b} and {pb}. I'm sorry. It was the best move for us." },
      { by: 'b', say: "Best move for you. Got it." },
      { by: 'b', conf: "They think they made a safe choice. {pb} and I are going to make it the worst choice they ever made." },
    ] },
  ],

  // ── the daily, won by a pair, in a season of pairs: one pair is safe, and one pair is going in ──
  'daily~pairs.pairs': [
    { id: 'dyp.1', turns: [
      { by: 'tj', say: "{a} and {b}! You two just won {game}, and you are SAFE this week!" },
      { by: 'a', say: "Yes! Partner!" },
      { by: 'b', say: "We needed that. We really needed that." },
      { by: 'tj', say: "Everybody else, look at the pair next to you. One of these pairs is going into the Arena together." },
      { by: 'b', conf: "We're safe, both of us. Tomorrow we get to vote, and nobody gets to vote for us. I could cry.",
        v: { dry: "We're safe, both of us. Tomorrow I get to watch everybody else panic, which is my favourite thing.", loud: "We're safe, both of us! Tomorrow everybody else sweats, and we get to sit back and watch." } },
    ] },
    { id: 'dyp.2', turns: [
      { by: 'tj', say: "Pair of the day: {a} and {b}! Everybody else, start sweating, because one pair is going in." },
      { by: 'b', say: "Don't even talk to me right now. I'm so happy." },
      { by: 'c', conf: "My partner and I were a mess today. Now we have to go back and hope the house is mad at another pair." },
    ] },
    { id: 'dyp.3', turns: [
      { by: 'tj', say: "Okay, okay, OKAY! {a} and {b} take {game}! That's what a pair is supposed to look like, people!" },
      { by: 'a', say: "{b} was unbelievable out there." },
      { by: 'b', say: "We were. Both of us." },
      { by: 'a', conf: "Every pair in this house is going to be looking at us tonight. Winning makes you safe. It also makes you the pair to beat.",
        v: { dry: "Winning is lovely. Then you walk into the villa and every pair in there is doing maths about you.", soft: "I'm so proud of us. I just know every pair in this house is going to be looking at us tonight." } },
    ] },
    { id: 'dyp.4', turns: [
      { by: 'tj', say: "And the winners of {game}... {a} and {b}! You're immune, you two!" },
      { beat: '{a} and {b} jump on each other and fall over in the sand.' },
      { by: 'c', opt: 1, say: "Great. Now we're all in trouble." },
      { by: 'a', conf: "We can't be voted in this week. Now we get to decide which pair is." },
    ] },
  ],

  // ── the day of the Arena: the pair talks it through; the pairs who might be picked wait ──
  'pick-talk~pairs.any': [
    { id: 'ptk.1', turns: [
      { beat: '{a} and {b} walk down to the water so nobody can hear them.' },
      { by: 'a', say: "So. {opt1} and {popt1}, or {opt2} and {popt2}?" },
      { by: 'b', say: "{opt1} and {popt1} are stronger, but they're slow." },
      { by: 'a', say: "{opt2} and {popt2} hate each other. That's got to count for something." },
      { by: 'b', say: "It counts for a lot. A pair that can't talk can't win." },
      { by: 'a', say: "So we know?" },
      { by: 'b', say: "We'll know when TJ asks. Don't tell anybody." },
      { by: 'a', conf: "The only good thing about going in as a pair is you get to pick together. The bad thing is you have to agree.",
        v: { dry: "Going in as a pair, you get to pick together. Which means you also have to agree, which we never do." } },
    ] },
    { id: 'ptk.2', turns: [
      { beat: '{a} and {b} sit apart from the rest of the house, going over it one more time.' },
      { by: 'b', say: "I keep going back and forth." },
      { by: 'a', say: "Between who?" },
      { by: 'b', say: "{opt1} and {popt1}. Or {opt2} and {popt2}." },
      { by: 'a', say: "I'd take {opt2} and {popt2}." },
      { by: 'b', say: "And I'd take {opt1} and {popt1}. Great." },
      { by: 'a', say: "Let's sleep on it." },
      { by: 'b', say: "It's the middle of the day." },
      { by: 'a', say: "Then let's sleep on it fast." },
      { by: 'b', conf: "One of us is going to have to give in. I really hope it's {a}." },
    ] },
  ],
  'pick-guess~pairs.any': [
    { id: 'pgs.1', turns: [
      { by: 'a', say: "It's us. I know it's us." },
      { by: 'b', say: "It could be anybody." },
      { by: 'c', opt: 1, say: "It could be us." },
      { by: 'a', say: "Did you see how {target} looked at me at breakfast?" },
      { by: 'b', say: "{target} looks at everybody like that." },
      { by: 'x', opt: 1, say: "{pt} won't look at anybody. That's worse." },
      { by: 'a', conf: "Waiting for another pair to say your name is the longest day in this game." },
    ] },
    { id: 'pgs.2', turns: [
      { by: 'b', say: "If it's us, we're ready, right?" },
      { by: 'a', say: "We're ready." },
      { by: 'c', opt: 1, say: "You don't sound ready." },
      { by: 'a', say: "I'm ready on the inside." },
      { by: 'b', conf: "Two pairs could be going in with {target} and {pt}. One of them is us. The other one is sitting right next to us." },
    ] },
  ],
  'arena-eve-confront~pairs.rattled': [
    { id: 'aecp.r1', turns: [
      { by: 'a', say: "{b}. Just tell me. Is it us tomorrow?" },
      { by: 'b', say: "You'll find out at the Arena, like everybody else." },
      { by: 'a', say: "That means it's us." },
      { by: 'b', say: "It means you'll find out at the Arena." },
      { by: 'a', say: "Then tell {pb} we'll be ready." },
      { by: 'b', conf: "{a} came looking for a fight, and I'll admit it got to me. That's exactly what {a} wanted." },
    ] },
  ],
  'arena-eve-confront~pairs.backfires': [
    { id: 'aecp.b1', turns: [
      { by: 'a', say: "Are you and {pb} calling us out tomorrow? Just be honest." },
      { by: 'b', say: "I wasn't sure. Now I am." },
      { by: 'a', say: "Wait. What?" },
      { by: 'b', say: "Thanks for coming to check. See you in there." },
      { by: 'a', conf: "I went over there to find out if it was us. Now it's definitely us. Great job, me." },
    ] },
  ],
  'tj-double~pairs.any': [
    { id: 'tjdp.1', turns: [
      { by: 'tj', say: "Everybody in the common room! Now! Sit! Here's the thing, people. This week, TWO pairs are going into the Arena." },
      { by: 'a', say: "Two pairs?" },
      { by: 'tj', say: "Two pairs, two Arenas, and two pairs going home. Four people. Gone. Sleep well!" },
      { by: 'b', conf: "Four people leaving in one night. Every pair in here just got a lot more dangerous." },
    ] },
  ],
  'tj-double~pairs.men': [
    { id: 'tjdpm.1', turns: [
      { by: 'tj', say: "Fellas! Bad news. Two men's pairs are going into the Arena this week." },
      { by: 'a', say: "Two?" },
      { by: 'tj', say: "Two. Look at the pair next to you. They might be gone by Friday." },
      { by: 'a', conf: "Two of the guys' pairs gone in one week. That changes every vote in the house." },
    ] },
  ],
  'tj-double~pairs.women': [
    { id: 'tjdpw.1', turns: [
      { by: 'tj', say: "Ladies! Two women's pairs are going into the Arena this week." },
      { by: 'a', say: "Two pairs? Are you serious?" },
      { by: 'tj', say: "As serious as a man in a Hawaiian shirt can be." },
      { by: 'a', conf: "Half of us could be gone by the end of the week. Nobody's safe now." },
    ] },
  ],
};

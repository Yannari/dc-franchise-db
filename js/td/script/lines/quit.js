// ══════════════════════════════════════════════════════════════════════
// td/script/lines/quit.js — walking away, being left out, reading people, the bench, wake-up calls
// ══════════════════════════════════════════════════════════════════════
//
// alliance.quit.<reason> — {a} walks away from {group}, to the camera: 'betrayed'
//   (someone in it voted against {a}), 'split' (a swap put them on different
//   tribes), 'breakdown' (they stopped getting on), 'pivot' (the numbers moved),
//   'solo' (going it alone).
// alliance.dropped.any — right before the vote, {a} realises {group} has cut {a}
//   out of the plan. This camp votes tonight.
// intel.social.<idol|target|crack> — {a} reads people. 'idol': a long friendly
//   talk with {b}, and {a} works out {b} has an idol ({b} never knows);
//   'target': {target}'s name is floating; 'crack': {group} is cracking.
// sitout.<heat|again|politics|back>.any — {a} and the bench: sat out and
//   {tribe} lost; sat out again; the bench becoming a reason to vote {a} out;
//   back in the lineup.
// wake.call.<reason> — {a} finally sees the truth about {b}: low-loyalty-betrayal,
//   villain-manipulation, goat-keeping, alliance-blindspot, post-betrayal-denial,
//   showmance-blindspot, provider-entitlement, swap-loyalty-assumption, other.
// Ids: 'qt.'.
const C = (id, ...lines) => ({ id, turns: lines.map(l => ({ by: 'a', conf: l })) });
const Cw = (id, when, ...lines) => ({ id, when, turns: lines.map(l => ({ by: 'a', conf: l })) });

const QUIT_BETRAYED = [
  C('qt.b1', "Somebody in {group} voted against me. I know who. I'm not saying anything.", "But I'm done with {group}."),
  C('qt.b2', "I gave {group} everything. One of them wrote my name. So that's that."),
  C('qt.b3', "I'm not making a scene. I'm just quietly not part of {group} anymore."),
  Cw('qt.b4', { register: 'fiery' }, "{group} can keep its traitor. I'm out!"),
  C('qt.b5', "You don't get to vote for me and still call me your ally. I'm done with {group}."),
  Cw('qt.b6', { register: 'sweet' }, "I really thought {group} was my family out here. I was wrong."),
];
const QUIT_SPLIT = [
  C('qt.s1', "The swap put me on the other side from {group}. I can't wait around for them. I have to play where I am."),
  C('qt.s2', "{group} was great. But they're over there and I'm over here. I'm on my own now."),
  C('qt.s3', "Distance kills alliances. {group} is too far away to help me now."),
  C('qt.s4', "I'm not betraying {group}. I'm just surviving without them."),
  Cw('qt.s5', { register: 'schemer' }, "New tribe, new plan. {group} was useful on the old one. This is a different game now."),
  C('qt.s6', "I miss {group}. But missing them won't keep me here. New people will."),
];
const QUIT_BREAKDOWN = [
  C('qt.r1', "I stopped going to {group}'s little meetings. Nobody even noticed."),
  C('qt.r2', "{group} doesn't feel like a team anymore. We barely even talk."),
  C('qt.r3', "We don't get on anymore. No point pretending {group} still means anything."),
  C('qt.r4', "I'm done with {group}. Nobody told me to leave. I just stopped wanting to be there."),
  Cw('qt.r5', { register: 'fiery' }, "I can't stand half of {group} anymore. Why would I stay in it?"),
  C('qt.r6', "{group} fell apart for me a while ago. Today I'm just admitting it."),
];
const QUIT_PIVOT = [
  C('qt.p1', "{group} doesn't fit my plan anymore. I'll still be friendly. I just won't be loyal."),
  C('qt.p2', "The numbers changed. {group} isn't the winning side now. So I'm moving."),
  Cw('qt.p3', { register: 'schemer' }, "Alliances are tools. {group} has done its job. On to the next one."),
  C('qt.p4', "I like {group}. But liking people doesn't win games. I'm working around them now."),
  C('qt.p5', "I'm quietly moving away from {group}. By the time they notice, I'll be somewhere better."),
  Cw('qt.p6', { register: 'cool' }, "I ran the numbers. {group} gets me to fifth place at best. I want more than fifth."),
];
const QUIT_SOLO = [
  C('qt.o1', "{group} was holding me back. I'm better off on my own."),
  C('qt.o2', "No more {group}. No more checking in. Just me."),
  C('qt.o3', "Everyone thinks you need an alliance to win. I'm about to find out if that's true."),
  Cw('qt.o4', { register: 'fiery' }, "I don't need {group}. I don't need anybody!"),
  C('qt.o5', "I stepped back from {group}. No drama. I just want my game to be my own."),
  C('qt.o6', "{group} was more trouble than it was worth. I'm going solo."),
];
const DROPPED = [
  C('qt.d1', "Everyone in {group} stopped talking when I walked up. That tells me everything.", "I'm not in the plan tonight. Maybe I'm the plan."),
  C('qt.d2', "{group} made a decision about tonight. Without me. I found out by accident."),
  C('qt.d3', "Nobody from {group} has told me the plan for tonight. That's because there's a plan, and I'm not in it."),
  Cw('qt.d4', { register: 'fiery' }, "So {group} is cutting me out right before the vote? Nice. Really nice."),
  C('qt.d5', "I can feel it. {group} has moved on without me. Now I have a few hours to figure out what that means."),
  Cw('qt.d6', { register: 'cool' }, "{group} is avoiding me. Fine. I'll find my own votes for tonight."),
];

const INTEL_IDOL = [
  { id: 'qt.i1', turns: [
    { by: 'a', say: "So how are you holding up? Really?" },
    { by: 'b', say: "Honestly? Better than I expected. I feel pretty safe right now." },
    { by: 'a', say: "Oh yeah? Lucky you." },
    { by: 'a', conf: "Nobody feels safe out here unless they've got something in their pocket. {b} has an idol. I'd bet anything." },
  ] },
  { id: 'qt.i2', turns: [
    { by: 'b', say: "I'm not worried about the vote. At all." },
    { by: 'a', say: "Must be nice." },
    { by: 'a', conf: "{b} didn't tell me {b.sub} found an idol. {b} didn't have to. I could see it all over {b.posAdj} face." },
  ] },
  { id: 'qt.i3', turns: [
    { by: 'a', say: "You seemed really calm at the last vote." },
    { by: 'b', say: "Did I? I guess I just had a good feeling." },
    { by: 'a', conf: "A 'good feeling'. Sure. {b} has an idol. I'm sure of it now." },
  ] },
  { id: 'qt.i4', turns: [
    { beat: '{a} and {b} talk for a long time about nothing in particular.' },
    { by: 'b', say: "It's nice to just talk. Not about the game." },
    { by: 'a', say: "Totally." },
    { by: 'a', conf: "We talked for an hour. In that hour, {b} touched {b.posAdj} pocket six times. I know what's in there." },
  ] },
  { id: 'qt.i5', when: { register: 'schemer' }, turns: [
    { by: 'a', say: "You'd tell me if you found anything, right?" },
    { by: 'b', say: "Of course I would." },
    { by: 'a', conf: "{b} found something. Now I know, and {b} doesn't know I know. That's the best kind of information." },
  ] },
  { id: 'qt.i6', turns: [
    { by: 'b', say: "Why are you asking so many questions today?" },
    { by: 'a', say: "Just being friendly." },
    { by: 'a', conf: "Friendly questions get honest answers. {b}'s answers told me {b} has an idol." },
  ] },
];
const INTEL_TARGET = [
  C('qt.t1', "Nobody told me a thing. I just listened. And {target}'s name is everywhere."),
  C('qt.t2', "I didn't need to eavesdrop. I just paid attention. It's {target} next. I'd put money on it."),
  C('qt.t3', "Two people said {target}'s name at lunch without meaning to. That's how I know."),
  Cw('qt.t4', { register: 'cool' }, "It's all in who goes quiet when {target} walks up. And everyone's going quiet."),
  C('qt.t5', "I pieced it together. {target} is the target. I'm going to keep that to myself for now."),
  Cw('qt.t6', { register: 'schemer' }, "{target}'s name is floating. Good to know. Very good to know."),
];
const INTEL_CRACK = [
  C('qt.c1', "{group} is smiling at each other a lot today. Too much. Something's broken in there."),
  C('qt.c2', "Watch {group} at dinner. They don't sit together anymore. Nobody's said anything, but it's over."),
  C('qt.c3', "{group} is falling apart, and they haven't even noticed yet. I have."),
  Cw('qt.c4', { register: 'schemer' }, "{group} is cracking. That's my chance to pull somebody out of it."),
  C('qt.c5', "The trust in {group} is gone. I can see it from across camp."),
  C('qt.c6', "Nobody's admitting it, but {group} is finished. I'm filing that away for later."),
];
const SIT_HEAT = [
  C('qt.h1', "I sat out, and we lost. Everyone's looking at me like it's my fault. It isn't. Is it?"),
  C('qt.h2', "Sitting out while everyone else competes is the worst. If this goes wrong, guess who gets blamed."),
  C('qt.h3', "I didn't even compete today, and somehow I'm the one in trouble."),
  Cw('qt.h4', { register: 'fiery' }, "Don't look at me! I wasn't even out there!"),
  C('qt.h5', "We lost, and I was sitting on the sidelines. That's going to come up tonight. I just know it."),
  Cw('qt.h6', { register: 'shy' }, "I sat out because they asked me to. Now they're mad we lost. I don't know what to do."),
];
const SIT_AGAIN = [
  C('qt.a1', "Sat out again. That's twice now. People are noticing."),
  C('qt.a2', "I keep getting benched. I'm starting to think it's not a coincidence."),
  C('qt.a3', "Every time I sit out, it's another reason for someone to say my name."),
  Cw('qt.a4', { register: 'competitor' }, "I hate sitting out. I want to be out there. Why do they keep benching me?"),
  C('qt.a5', "I don't make a fuss about sitting out. Maybe I should."),
  C('qt.a6', "Two sit-outs. I need to start competing, or I'm going to start packing."),
];
const SIT_POLITICS = [
  C('qt.l1', "Somebody's going to say it eventually: why keep someone who doesn't compete? I'm that someone."),
  C('qt.l2', "My sit-outs are becoming a thing. And 'a thing' is how people get voted out."),
  C('qt.l3', "I keep sitting out. Now I'm hearing the word 'liability'. Not ideal."),
  Cw('qt.l4', { register: 'fiery' }, "If one more person calls me a liability, I'm going to compete in everything just to prove them wrong."),
  C('qt.l5', "I need to fix this bench situation. Fast. Before it becomes a vote situation."),
  C('qt.l6', "People are using my sit-outs against me. I can't even say they're wrong."),
];
const SIT_BACK = [
  C('qt.k1', "I'm back in the lineup. I'm not going to waste it."),
  C('qt.k2', "Sitting out last time was not my choice. Today I made sure everyone saw me compete."),
  C('qt.k3', "It felt so good to be back out there. The bench is not my favourite place."),
  Cw('qt.k4', { register: 'competitor' }, "Never benching me again. Did you see that? Never again."),
  C('qt.k5', "I competed today. I needed to. People were starting to forget I could."),
  C('qt.k6', "Back in the game. Literally. It's a good feeling."),
];

const WAKE = {
  'low-loyalty-betrayal': [
    C('qt.w1', "I keep replaying the last vote. The maths doesn't add up. And {b}'s name keeps coming back."),
    C('qt.w2', "Everyone else saw it weeks ago. I'm only seeing it now. {b} was never on my side."),
    C('qt.w3', "{b} won't look me in the eye anymore. That's when it clicked."),
    C('qt.w4', "I defended {b}. To everyone. And {b} was the one working against me the whole time."),
    Cw('qt.w5', { register: 'fiery' }, "{b}! It was {b} this whole time! How did I not see it?!"),
    C('qt.w6', "I trusted {b} completely. I'm going to have to stop doing that."),
  ],
  'villain-manipulation': [
    C('qt.v1', "I caught {b} in a lie today. A small one. But it changes everything."),
    C('qt.v2', "I watched {b} do to someone else exactly what {b} did to me. Now I see it."),
    C('qt.v3', "All that warmth from {b}? It was never real. I see that now."),
    C('qt.v4', "{b} played me. Really well, actually. But it's over now."),
    Cw('qt.v5', { register: 'cool' }, "{b} is very good at this. I just finally caught {b} doing it."),
    C('qt.v6', "I can't believe I fell for {b}'s act. I'm not falling for it again."),
  ],
  'goat-keeping': [
    C('qt.g1', "I overheard something I wasn't supposed to. {b} doesn't want me at the end because {b} likes me. {b} wants me there because {b} thinks I'm easy to beat."),
    C('qt.g2', "I asked {b} about the final three today. The pause before the answer told me everything."),
    C('qt.g3', "Somebody told me what {b} really thinks of me. I didn't believe it. Now I do."),
    C('qt.g4', "{b} has been keeping me around like a trophy. I'm not a trophy."),
    Cw('qt.g5', { register: 'fiery' }, "Easy to beat? ME? Oh, {b} is going to regret that."),
    C('qt.g6', "So I'm {b}'s easy final two. Good to know. Very good to know."),
  ],
  'alliance-blindspot': [
    C('qt.a7', "Everyone at dinner was looking at each other differently. The alliance moved without me. With {b}."),
    C('qt.a8', "I saw it too late. {b} and the others had a plan, and I wasn't in it."),
    C('qt.a9', "{b} has been nice to my face while the group moved around me. I see it now."),
    C('qt.a10', "I thought I was in the middle of everything. Turns out I was on the outside, and {b} knew."),
    Cw('qt.a11', { register: 'cool' }, "I counted the looks at dinner. {b} is on the inside. I'm not."),
    C('qt.a12', "How long has {b} known I was out? Days? I'm the last one to find out."),
  ],
  'post-betrayal-denial': [
    C('qt.p7', "I kept telling myself {b} didn't mean it. {b} meant it."),
    C('qt.p8', "I stopped sitting next to {b} today. I didn't announce it. I just stopped."),
    C('qt.p9', "I'm not going to forgive {b}. I'm going to stop pretending I already did."),
    C('qt.p10', "{b} betrayed me. I knew that. Today I finally felt it."),
    Cw('qt.p11', { register: 'sweet' }, "I wanted to believe the best about {b}. I can't anymore."),
    C('qt.p12', "The excuses I was making for {b}? I'm out of them."),
  ],
  'showmance-blindspot': [
    C('qt.s7', "I found out about {b}'s other alliance. The one I wasn't in. I feel so stupid."),
    C('qt.s8', "{b} and I sat apart today for the first time. Everyone noticed before we did."),
    C('qt.s9', "I thought {b} and I were a team in everything. Turns out not in the game."),
    C('qt.s10', "I was so busy liking {b} that I didn't see {b} playing a whole other game."),
    Cw('qt.s11', { register: 'fiery' }, "{b} has an alliance I didn't know about?! We're going to have a long talk."),
    C('qt.s12', "I trusted {b} with everything. {b} didn't trust me with this."),
  ],
  'provider-entitlement': [
    C('qt.e1', "I got votes. After everything I've done for this camp. That's not strategy. That's personal."),
    C('qt.e2', "I've been feeding everyone. {b} still wrote my name. I'm done providing."),
    C('qt.e3', "I thought working hard would keep me safe. {b} just proved me wrong."),
    C('qt.e4', "Nobody's getting extra fish from me tomorrow. Especially not {b}."),
    Cw('qt.e5', { register: 'fiery' }, "I do ALL the work around here and {b} wants me out?!"),
    C('qt.e6', "Turns out being useful isn't the same as being safe. {b} taught me that."),
  ],
  'swap-loyalty-assumption': [
    C('qt.y1', "I thought this new tribe was my tribe. {b} just showed me it never was."),
    C('qt.y2', "My name came up. Not as a target. Just as an option. I don't like that at all."),
    C('qt.y3', "{b} was friendly from day one of the swap. Friendly isn't the same as loyal."),
    C('qt.y4', "I'm the outsider here. {b} made that very clear today, without saying a word."),
    Cw('qt.y5', { register: 'schemer' }, "So {b} was never really with me. Fine. I wasn't really with {b} either."),
    C('qt.y6', "This tribe was never really mine. {b} was just waiting for me to leave."),
  ],
  'other': [
    C('qt.x1', "I finally see the truth about {b}. Took me long enough."),
    C('qt.x2', "Something clicked today about {b}. I can't unsee it."),
    C('qt.x3', "I had {b} all wrong. Completely wrong."),
    C('qt.x4', "{b} isn't who I thought {b} was. I'm adjusting."),
    C('qt.x5', "Today I stopped believing what {b} tells me."),
    C('qt.x6', "I've been wrong about {b} this whole time. Not anymore."),
  ],
};

export default {
  'alliance.quit.betrayed': QUIT_BETRAYED,
  'alliance.quit.split': QUIT_SPLIT,
  'alliance.quit.breakdown': QUIT_BREAKDOWN,
  'alliance.quit.pivot': QUIT_PIVOT,
  'alliance.quit.solo': QUIT_SOLO,
  'alliance.dropped.any': DROPPED,
  'intel.social.idol': INTEL_IDOL,
  'intel.social.target': INTEL_TARGET,
  'intel.social.crack': INTEL_CRACK,
  'sitout.heat.any': SIT_HEAT,
  'sitout.again.any': SIT_AGAIN,
  'sitout.politics.any': SIT_POLITICS,
  'sitout.back.any': SIT_BACK,
  ...Object.fromEntries(Object.entries(WAKE).map(([k, v]) => [`wake.call.${k}`, v])),
};

export const GUARANTEED = {
  ...Object.fromEntries(['betrayed', 'split', 'breakdown', 'pivot', 'solo'].map(e => [`alliance.quit.${e}`, ['group']])),
  'alliance.dropped.any': ['group', 'tribal'],
  'intel.social.crack': ['group'],
  'sitout.heat.any': ['tribal'],
};

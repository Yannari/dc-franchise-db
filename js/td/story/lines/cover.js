// ══════════════════════════════════════════════════════════════════════
// td/story/lines/cover.js — the camper the episode has not heard from yet
// ══════════════════════════════════════════════════════════════════════
//
// director.js coverScene(): nobody goes a whole episode without a word (the user,
// 2026-10-07). One confessional, from where they stand:
//   votes   they got votes at the last vote ({lastBoot} still went home)
//   allied  they are in a storyline about an alliance
//   thread  they are in some other storyline that has aired
//   quiet   nothing has happened to them on screen yet
// Only part a speaks. Lines gate on register / arch / phase / tribal / merged.

export default {
  'story.cover.votes': [
    { id: 'cv.v1', turns: [{ by: 'a', conf: "My name came up at the last vote. Not enough to send me home, but enough. Somebody out here has already thought about it, and that means they'll think about it again." }] },
    { id: 'cv.v2', when: { register: 'fiery' }, turns: [{ by: 'a', conf: "People wrote my name down. Cool. Great. I'd love to know who, so I can say thank you. To their face." }] },
    { id: 'cv.v3', when: { register: ['sweet', 'shy'] }, turns: [{ by: 'a', conf: "I keep trying to work out who voted for me. Everybody's been so nice. That's almost worse." }] },
    { id: 'cv.v4', when: { register: ['schemer', 'cool'] }, turns: [{ by: 'a', conf: "I got votes last time. Fine. It tells me who's scared of me, and now I know who to keep an eye on." }] },
    { id: 'cv.v5', when: { register: ['competitor', 'plain'] }, turns: [{ by: 'a', conf: "There were votes for me at the last one. I'm not going to cry about it. I'm going to win something so they can't do it again." }] },
    { id: 'cv.v6', when: { tribal: true, phase: 'post' }, turns: [{ by: 'a', conf: "I had votes last time and we lost again today. If I don't find a new name for people to write down before tonight, it's going to be mine." }] },
  ],
  'story.cover.allied': [
    { id: 'cv.a1', turns: [{ by: 'a', conf: "I've got people. I think. You never really know until you see the votes." }] },
    { id: 'cv.a2', when: { register: ['schemer', 'cool'] }, turns: [{ by: 'a', conf: "My alliance thinks I'm the loyal one. And I am. Until I'm not." }] },
    { id: 'cv.a3', when: { register: ['sweet', 'shy'] }, turns: [{ by: 'a', conf: "Being in an alliance is nice. I just hope I'm in it as much as they're in it with me." }] },
    { id: 'cv.a4', when: { register: 'fiery' }, turns: [{ by: 'a', conf: "If anybody in my alliance even thinks about flipping, they're going to hear about it. Loudly." }] },
    { id: 'cv.a5', when: { register: ['competitor', 'plain'] }, turns: [{ by: 'a', conf: "We've got the numbers right now. Right now. I don't want to get comfortable." }] },
    { id: 'cv.a6', when: { merged: true }, turns: [{ by: 'a', conf: "The merge changes everything. My alliance looked strong on our old team. Here it's just one group out of a lot of groups." }] },
  ],
  'story.cover.thread': [
    { id: 'cv.t1', turns: [{ by: 'a', conf: "There's a lot going on out here. I'm in the middle of some of it, and I'm trying to stay out of the rest." }] },
    { id: 'cv.t2', when: { register: 'fiery' }, turns: [{ by: 'a', conf: "Everybody here thinks I'm the problem. Fine. At least I'm interesting." }] },
    { id: 'cv.t3', when: { register: ['sweet', 'shy'] }, turns: [{ by: 'a', conf: "I didn't think I'd care this much. About the people, I mean. I thought it would just be a game." }] },
    { id: 'cv.t4', when: { register: ['schemer', 'cool'] }, turns: [{ by: 'a', conf: "Everyone's so busy with their own drama, they've stopped watching me. That's exactly how I like it." }] },
    { id: 'cv.t5', when: { register: ['competitor', 'plain'] }, turns: [{ by: 'a', conf: "I didn't come here to make friends or enemies. Somehow I've got both." }] },
  ],
  'story.cover.quiet': [
    { id: 'cv.q1', turns: [{ by: 'a', conf: "Nobody's really said my name yet. I think that's good? I'm going to go with good." }] },
    { id: 'cv.q2', when: { register: ['schemer', 'cool'] }, turns: [{ by: 'a', conf: "I haven't been in a single fight. Not one. People think that means I'm not playing. I'm playing." }] },
    { id: 'cv.q3', when: { register: ['sweet', 'shy'] }, turns: [{ by: 'a', conf: "I don't know if people forget I'm here, or if they're just being nice. Either way I'm still here." }] },
    { id: 'cv.q4', when: { register: 'fiery' }, turns: [{ by: 'a', conf: "I've been really chill so far. Like, really chill. Don't get used to it." }] },
    { id: 'cv.q5', when: { register: ['competitor', 'plain'] }, turns: [{ by: 'a', conf: "I keep my head down, I do the chores, and I show up for the challenges. I don't need to be on camera every five minutes." }] },
    { id: 'cv.q6', when: { phase: 'post', tribal: true }, turns: [{ by: 'a', conf: "Tonight's going to be bad for somebody. I'm just trying to make sure it isn't me without making it obvious that's what I'm doing." }] },
    { id: 'cv.q7', when: { phase: 'post', tribal: false }, turns: [{ by: 'a', conf: "No vote tonight for us. I'm going to sleep like a baby. A baby that's sleeping on a rock." }] },
    { id: 'cv.q8', when: { early: true }, turns: [{ by: 'a', conf: "It's still early. I'm figuring out who's who. Who talks too much, who doesn't talk enough. I'll make my move when I know." }] },
    { id: 'cv.q9', when: { merged: true }, turns: [{ by: 'a', conf: "Everybody's talking about the big players. Nobody's talking about me. Let's keep it that way a little longer." }] },
  ],
};

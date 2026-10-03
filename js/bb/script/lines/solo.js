// ══════════════════════════════════════════════════════════════════════
// bb/script/lines/solo.js — the morning after, with nobody to ask (Phase 6)
// ══════════════════════════════════════════════════════════════════════
//
// bb-events/fallout.js and reign.js each had one case with only one person in
// it, and wrote it as a sentence. These are those people, in the Diary Room.
//
//   fallout.noanswer  a cannot work out who voted {gone} out              scene
//   fallout.silence   a asks how people voted; nobody says                scene
//   fallout.alone     nobody voted to keep {gone}; a finds out            scene
//   reign.nobody      a, the HOH, has nobody in the alliance to test      scene

export default {
  'fallout.noanswer.scene': [
    { id: 'so.n1', turns: [{ by: 'a', dr: "I've spent all morning trying to work out who got rid of {gone}. I've got nothing." }] },
    { id: 'so.n2', turns: [{ by: 'a', dr: "Everyone says they voted to keep {gone}. The numbers say otherwise." }] },
    { id: 'so.n3', turns: [{ by: 'a', dr: "Somebody in this house lied to me about {gone}. I just can't tell who." }] },
    { id: 'so.n4', turns: [{ by: 'a', dr: "I keep counting the votes. It doesn't get me anywhere." }] },
    { id: 'so.n5', turns: [{ by: 'a', dr: "{gone} is gone and I don't know who to blame. That's worse than knowing." }] },
    { id: 'so.n6', turns: [{ by: 'a', dr: "I'll find out who did it. Maybe not today." }] },
  ],
  'fallout.silence.scene': [
    { id: 'so.s1', turns: [{ by: 'a', dr: "I asked how people voted. Nobody would say. That tells me something." }] },
    { id: 'so.s2', turns: [{ by: 'a', dr: "Usually someone owns up. Not this time. Everyone's suddenly very busy." }] },
    { id: 'so.s3', turns: [{ by: 'a', dr: "I asked about the vote at breakfast. The whole table went quiet." }] },
    { id: 'so.s4', turns: [{ by: 'a', dr: "Nobody's talking about {gone}'s vote. When nobody talks, everybody's guilty." }] },
    { id: 'so.s5', turns: [{ by: 'a', dr: "I'll ask again tomorrow. Someone will crack." }] },
    { id: 'so.s6', turns: [{ by: 'a', dr: "Silence is an answer in this house. I just don't like it." }] },
  ],
  'fallout.alone.scene': [
    { id: 'so.a1', turns: [{ by: 'a', dr: "Nobody voted to keep {gone}. Nobody. I was the only one who wanted {gone} here." }] },
    { id: 'so.a2', turns: [{ by: 'a', dr: "I've stopped asking who voted for {gone} to stay. The answer is no one." }] },
    { id: 'so.a3', turns: [{ by: 'a', dr: "{gone} didn't get a single vote. I'm on my own in here now." }] },
    { id: 'so.a4', turns: [{ by: 'a', dr: "Everyone in this house wanted {gone} out. So what do they think of me?" }] },
    { id: 'so.a5', turns: [{ by: 'a', dr: "I thought {gone} had friends in here. I was wrong." }] },
    { id: 'so.a6', turns: [{ by: 'a', dr: "Not one vote for {gone}. I need to rethink everything." }] },
  ],
  'reign.nobody.scene': [
    { id: 'so.r1', turns: [{ by: 'a', dr: "I wanted to test my alliance this week. There's nobody left in it to test." }] },
    { id: 'so.r2', turns: [{ by: 'a', dr: "I've got the key and nobody to share it with. That's a lonely way to be HOH." }] },
    { id: 'so.r3', turns: [{ by: 'a', dr: "No alliance to check on. Just me and the HOH room." }] },
    { id: 'so.r4', turns: [{ by: 'a', dr: "Everyone I'd trust with this week has gone home. I'll have to do it alone." }] },
    { id: 'so.r5', turns: [{ by: 'a', dr: "Nobody to test, nobody to ask. I'll make my own decisions this week." }] },
    { id: 'so.r6', turns: [{ by: 'a', dr: "Being HOH is easier when you have people. I don't, right now." }] },
  ],
};

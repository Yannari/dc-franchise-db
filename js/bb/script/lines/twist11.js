// ══════════════════════════════════════════════════════════════════════
// bb/script/lines/twist11.js — Pandora's Box (Phase 6)
// ══════════════════════════════════════════════════════════════════════
//
// The words for bb-events/pandora.js. What the HOH really took out of the box is
// never said; {claim} is the cover story ("a dollar", "a photo from home").
//
//   pan.price    a resents the lockdown b's box cost the house             scene
//   pan.test     b tests a's story about {claim}; c listens                holds | cracks; third
//   pan.compare  a and b agree they do not believe {holder}                 scene
//   pan.debate   would you open it? a would, b would not                    opened | shut ({holder} chose)
//   pan.watch    a waits for b to use whatever b took                       scene
//   pan.oversell a, the HOH, keeps bringing {claim} up to b                 scene
//   pan.closed   a left the box shut and tells b                            scene
//   pan.paying   a week later, a still brings up the box; b opened it       scene

export default {
  'pan.price.scene': [
    { id: 'pb11.p1', turns: [{ by: 'a', dr: "My whole week's washing is on the line on the wrong side of a locked door. And {b} got {claim}." }] },
    { id: 'pb11.p2', turns: [{ by: 'a', say: "We're locked out of the yard. For {claim}." }, { by: 'b', say: "I didn't know that would happen." }, { by: 'a', say: "For {claim}, {b}." }] },
    { id: 'pb11.p3', turns: [{ beat: 'The doors lock.' }, { by: 'a', dr: "{b} spent our week like it was {b}'s money." }] },
    { id: 'pb11.p4', turns: [{ by: 'a', dr: "I've been counting the hours of lockdown against {claim}. It's not a good trade." }] },
    { id: 'pb11.p5', turns: [{ by: 'b', dr: "{a} keeps bringing up the lockdown. Every time someone defends me, it gets worse." }] },
    { id: 'pb11.p6', turns: [{ by: 'a', say: "Was it worth it?" }, { by: 'b', say: "Ask me later." }] },
  ],
  'pan.test.holds': [
    { id: 'pb11.h1', turns: [{ by: 'b', say: "Tell me about the box again." }, { by: 'a', say: "Door, small room, {claim} on a table. That's it." }, { by: 'b', dr: "Same story, same details. I ran out of questions first." }] },
    { id: 'pb11.h2', turns: [{ by: 'b', say: "So it was just {claim}?" }, { by: 'a', say: "It was just {claim}." }, { by: 'b', dr: "{a} didn't add anything. That's why I believe it." }] },
    { id: 'pb11.h3', when: { third: true }, turns: [{ by: 'b', say: "The door was on the left, wasn't it?" }, { by: 'a', say: "No, the right." }, { by: 'c', dr: "{b} tried to trip {a} up. {a} didn't even notice." }] },
    { id: 'pb11.h4', turns: [{ by: 'a', dr: "Keep it boring. Tell it the same way every time. That's all there is to it." }] },
    { id: 'pb11.h5', turns: [{ by: 'b', dr: "I asked {a} about the box five different ways. Same answer every time." }] },
    { id: 'pb11.h6', turns: [{ by: 'b', say: "Bit of a letdown, {claim}." }, { by: 'a', say: "Tell me about it." }] },
  ],
  'pan.test.cracks': [
    { id: 'pb11.c1', turns: [{ by: 'b', say: "What did the room look like?" }, { by: 'a', say: "Blue walls. A lamp. A rug, a nice rug, and a little table, and..." }, { by: 'b', dr: "I asked one question. I got a catalogue." }] },
    { id: 'pb11.c2', turns: [{ by: 'a', say: "Like I said, it was {claim}. Just {claim}." }, { by: 'b', dr: "Nobody asked. We'd moved on. {a} hadn't." }] },
    { id: 'pb11.c3', turns: [{ by: 'b', say: "Show me it, then." }, { by: 'a', say: "Ha. Funny." }, { by: 'b', dr: "{a} didn't show me it." }] },
    { id: 'pb11.c4', when: { third: true }, turns: [{ by: 'c', dr: "I stopped listening to what {a} was saying and started counting how much of it there was." }] },
    { id: 'pb11.c5', turns: [{ by: 'b', dr: "{a} has a story about the box. It keeps getting longer." }] },
    { id: 'pb11.c6', turns: [{ by: 'b', say: "And that's all that was in there?" }, { by: 'a', say: "Why does everyone keep asking me that?" }] },
  ],
  'pan.compare.scene': [
    { id: 'pb11.m1', turns: [{ by: 'a', say: "Nobody locks a backyard over {claim}." }, { by: 'b', say: "That's what I said." }] },
    { id: 'pb11.m2', turns: [{ by: 'a', say: "You believe that?" }, { by: 'b', say: "Do you?" }, { beat: 'Neither of them does.' }] },
    { id: 'pb11.m3', turns: [{ by: 'a', say: "{holder} was in there for ages. Then the doors locked straight away." }, { by: 'b', say: "And {holder} came out smiling." }] },
    { id: 'pb11.m4', turns: [{ by: 'b', say: "Whatever {holder} got, it wasn't {claim}." }, { by: 'a', say: "No. It wasn't." }] },
    { id: 'pb11.m5', turns: [{ by: 'a', dr: "{b} and I don't know what {holder} got. We both know it was something." }] },
    { id: 'pb11.m6', turns: [{ by: 'b', dr: "{a} doesn't buy {holder}'s story either. Good. Two of us." }] },
  ],
  'pan.debate.opened': [
    { id: 'pb11.o1', turns: [{ by: 'a', say: "I'd have opened it in about four seconds." }, { by: 'b', say: "I wouldn't have opened it at all." }] },
    { id: 'pb11.o2', turns: [{ by: 'b', say: "A mystery door with a question mark on it is a trap." }, { by: 'a', say: "{holder} opened it and {holder} is fine." }] },
    { id: 'pb11.o3', turns: [{ by: 'a', say: "Would you open it?" }, { by: 'b', say: "Never." }, { by: 'a', say: "Boring." }] },
    { id: 'pb11.o4', turns: [{ by: 'b', dr: "{a} would open anything. That's good to know." }] },
    { id: 'pb11.o5', turns: [{ by: 'a', dr: "{b} is too careful. Careful people don't win this game." }] },
    { id: 'pb11.o6', turns: [{ by: 'a', say: "For anything?" }, { by: 'b', say: "For anything." }, { by: 'a', say: "Not even money?" }, { by: 'b', say: "Not even money." }] },
  ],
  'pan.debate.shut': [
    { id: 'pb11.s1', turns: [{ by: 'a', say: "I'd have opened it in about four seconds." }, { by: 'b', say: "{holder} left it shut. I'd have done the same." }] },
    { id: 'pb11.s2', turns: [{ by: 'a', say: "{holder} left it shut and got nothing." }, { by: 'b', say: "And lost nothing." }] },
    { id: 'pb11.s3', turns: [{ by: 'a', say: "Would you open it?" }, { by: 'b', say: "Never." }, { by: 'a', say: "Boring." }] },
    { id: 'pb11.s4', turns: [{ by: 'b', dr: "{a} would open anything. That's good to know." }] },
    { id: 'pb11.s5', turns: [{ by: 'a', dr: "{b} is too careful. Careful people don't win this game." }] },
    { id: 'pb11.s6', turns: [{ by: 'a', dr: "If that door had been for me, I'd have opened it. No question." }] },
  ],
  'pan.watch.scene': [
    { id: 'pb11.w1', turns: [{ by: 'a', dr: "I've stopped trying to work out what was in the box. I'm watching for when {b} has to use it." }] },
    { id: 'pb11.w2', turns: [{ by: 'a', dr: "The question isn't what {b} got. It's when {b} uses it, and what the week looks like after." }] },
    { id: 'pb11.w3', turns: [{ by: 'a', dr: "Whatever it is, it won't last forever. I'm watching {b} be careful." }] },
    { id: 'pb11.w4', turns: [{ by: 'b', dr: "{a} keeps watching me. Not my face. My hands. My pockets." }] },
    { id: 'pb11.w5', turns: [{ by: 'a', say: "Big week coming up, {b}?" }, { by: 'b', say: "No bigger than usual." }] },
    { id: 'pb11.w6', turns: [{ by: 'a', dr: "I counted the days since the door opened. Once. Then I stopped talking about it." }] },
  ],
  'pan.oversell.scene': [
    { id: 'pb11.v1', turns: [{ by: 'a', say: "I can't believe it was only {claim}." }, { by: 'b', dr: "That's the fourth time. I didn't ask once." }] },
    { id: 'pb11.v2', turns: [{ by: 'a', say: "I mean, what do you even do with {claim}?" }, { beat: '{b} laughs in the right place.' }, { by: 'b', dr: "And moves {a} up my list." }] },
    { id: 'pb11.v3', turns: [{ by: 'a', say: "Honestly, I was gutted." }, { by: 'b', dr: "{a} is performing being disappointed a bit too well. I wasn't suspicious an hour ago." }] },
    { id: 'pb11.v4', turns: [{ by: 'b', dr: "{a} keeps giving me details about the box I never asked for." }] },
    { id: 'pb11.v5', turns: [{ by: 'a', say: "You don't believe me, do you?" }, { by: 'b', say: "I didn't say anything." }, { by: 'a', say: "You were thinking it." }] },
    { id: 'pb11.v6', turns: [{ by: 'a', dr: "I think everyone believes me about the box. I'll mention it again to be sure." }] },
  ],
  'pan.closed.scene': [
    { id: 'pb11.k1', turns: [{ by: 'a', say: "There was a door with a question mark on it. I didn't open it." }, { by: 'b', say: "Good call." }] },
    { id: 'pb11.k2', turns: [{ by: 'a', say: "There was a whole thing in there. I didn't touch it." }, { by: 'b', dr: "{a} said that lightly. {a} is still thinking about it." }] },
    { id: 'pb11.k3', turns: [{ by: 'a', say: "I'm not thinking about the box." }, { by: 'b', say: "That's twice you've said that." }] },
    { id: 'pb11.k4', turns: [{ by: 'a', say: "I'll never know what was behind that door." }, { by: 'b', say: "Nobody else does either." }, { by: 'a', say: "That helps. A bit." }] },
    { id: 'pb11.k5', when: { intent: 'villain' }, turns: [{ by: 'b', say: "Very sensible." }, { by: 'b', dr: "Very soft. I'd have opened it." }] },
    { id: 'pb11.k6', when: { intent: 'kind' }, turns: [{ by: 'b', say: "You did the right thing." }, { by: 'a', say: "Did I?" }, { by: 'b', say: "I think so." }] },
  ],
  'pan.paying.scene': [
    { id: 'pb11.y1', turns: [{ by: 'a', dr: "Someone mentioned the lockdown and I was right back in it. A locked yard, for {claim}." }] },
    { id: 'pb11.y2', turns: [{ by: 'a', say: "Well, at least it's not {claim}." }, { beat: 'Everyone laughs. {b} laughs a beat late.' }] },
    { id: 'pb11.y3', turns: [{ by: 'a', dr: "The box is our joke now. When we say it, we mean we don't trust {b}." }] },
    { id: 'pb11.y4', turns: [{ by: 'b', dr: "I thought the box was last week's problem. {a} brought it up in front of four people." }] },
    { id: 'pb11.y5', turns: [{ by: 'a', say: "Remember the lockdown?" }, { by: 'b', say: "Here we go." }] },
    { id: 'pb11.y6', turns: [{ by: 'a', dr: "I'm not letting {b} forget that box. Not for a while." }] },
  ],
};

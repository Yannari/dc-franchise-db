// ══════════════════════════════════════════════════════════════════════
// td/story/lines/n-vt2.js — the people who think it's them (the suspense)
// ══════════════════════════════════════════════════════════════════════
//
// director.js voteTalk §4 (the user: "we need suspense, don't focus on one person on the chopping
// block"). Nobody here knows how the night ends.
//   vt2.scramble  a knows their name is out there ({pitcher} is pushing it; told: {teller} warned a),
//                 and goes after {wrote} instead; b is a's closest. bVoted: 'boot' when b is writing
//                 a's name tonight (b lies), 'other' when b isn't
//   vt2.safe      a has no idea; b, a friend, is writing a's name, and keeps it from a
//   vt2.decoy     a is sure it's a tonight (told: {teller} said so), and pushes {wrote}; b is a's friend.
//                 a will survive the night: nothing here may say otherwise
// Ids: 'nvt.'.

export default {
  'vt2.scramble': [
    { id: 'nvt.s1', when: { told: true }, turns: [
      { beat: "{a} finds {b} at the {quarters} and pulls {b.obj} round the back, out of sight." },
      { by: 'a', say: "{teller} just told me {pitcher} is getting votes on me." },
      { by: 'b', say: "On you? Are you sure?", v: { warm: "Oh no. Are you okay?" } },
      { by: 'a', say: "{teller} wouldn't make that up, so I need your vote on {wrote} tonight. Please." },
      { by: 'b', say: "{wrote}? Why {wrote}?" },
      { by: 'a', say: "Because {wrote} is the only name I think I can get enough people on, and if I don't get enough people on something, it's me." },
      { by: 'b', say: "Okay. Okay, I'll think about it.", when: { bVoted: 'boot' } },
      { by: 'b', say: "Okay, I'm with you. {wrote} it is.", when: { bVoted: 'other', bWrote: true } },
      { by: 'b', say: "I'm not writing your name, I can promise you that. Past that, let me think.", when: { bVoted: 'other', bWrote: false } },
      { by: 'a', say: "Don't think about it. Just do it." },
      { by: 'b', conf: "{a} looked me right in the eye and asked for my vote, and I said I'd think about it. I already know what I'm writing, and it isn't {wrote}.", when: { bVoted: 'boot' } },
      { by: 'b', conf: "I meant it. I'm writing {wrote}. I just don't know if two of us is going to be enough.", when: { bVoted: 'other', bWrote: true } },
      { by: 'b', conf: "I'm not going to write {a}'s name. I'm not going to write {wrote} either. {a} doesn't need to know that yet.", when: { bVoted: 'other', bWrote: false } },
    ] },
    { id: 'nvt.s2', turns: [
      { by: 'a', say: "Be honest with me. Is it me tonight?" },
      { by: 'b', say: "Why would you think that?", v: { anxious: "What? No! I mean, I don't think so. Why?" } },
      { by: 'a', say: "Because everybody's being really nice to me, and {pitcher} won't look at me." },
      { by: 'b', say: "{pitcher} doesn't look at anybody." },
      { by: 'a', say: "{pitcher} looked at me plenty yesterday." },
      { by: 'b', say: "Okay. So what do you want to do?" },
      { by: 'a', say: "{wrote}. If I can get enough people on {wrote}, it doesn't matter what {pitcher} is doing." },
      { by: 'b', say: "I'll write {wrote} with you.", when: { bVoted: 'other', bWrote: true } },
      { by: 'b', say: "I'm not writing you. I can promise you that much.", when: { bVoted: 'other', bWrote: false } },
      { by: 'b', say: "I'll see what I can do.", when: { bVoted: 'boot' } },
      { by: 'a', conf: "I've been here before. Everyone smiling, nobody saying anything. That's what it looks like right before you go home, and I'm not going home without a fight.", v: { anxious: "I keep telling myself I'm being paranoid, but I've been paranoid before, and I was right." } },
    ] },
    { id: 'nvt.s3', turns: [
      { beat: "{a} hasn't sat down all afternoon. {b} finally catches {a.obj} by the fire." },
      { by: 'b', say: "You're going to wear a hole in the ground." },
      { by: 'a', say: "I've talked to everybody, and everybody says {wrote}, and I don't believe a single one of them." },
      { by: 'b', say: "You believe me, though, right?" },
      { by: 'a', say: "I want to.", v: { tough: "I'll believe you when I see the votes.", emotional: "I want to. I really, really want to." } },
      { by: 'b', say: "That's not the same thing." },
      { by: 'a', say: "No. It's not." },
      { by: 'b', conf: "{a} knows something is wrong. {a} just doesn't know it's me.", when: { bVoted: 'boot' } },
      { by: 'b', conf: "{a} doesn't trust anybody now, not even me, and I'm one of the only people actually writing {wrote}.", when: { bVoted: 'other', bWrote: true } },
      { by: 'b', conf: "{a} doesn't trust anybody now, not even me. And I'm not writing {a}, but I'm not writing {wrote} either.", when: { bVoted: 'other', bWrote: false } },
    ] },
  ],
  'vt2.safe': [
    { id: 'nvt.f1', turns: [
      { beat: "{a} is lying in the sun, completely relaxed. {b} sits down next to {a.obj}." },
      { by: 'a', say: "Isn't this nice? For once, I'm not worried about anything." },
      { by: 'b', say: "That's great.", v: { warm: "I'm really glad.", quiet: "...Yeah." } },
      { by: 'a', say: "It's {wrote} tonight, everybody's said so. You're on {wrote}, right?" },
      { by: 'b', say: "Yeah. Of course." },
      { by: 'a', say: "I love that we never have to worry about each other." },
      { beat: "{b} looks out at the water and doesn't say anything." },
      { by: 'b', conf: "{a} just told me how much {a} trusts me, and in about three hours I'm writing {a}'s name. I've never felt this bad about something I know is right." },
    ] },
    { id: 'nvt.f2', turns: [
      { by: 'a', say: "Can I tell you something? I think I'm actually going to make the merge. Like, really make it." },
      { by: 'b', say: "Yeah?" },
      { by: 'a', say: "Yeah. Tonight's going to be {wrote}, and after that, nobody's got a reason to come for me." },
      { by: 'b', say: "That's a good feeling." },
      { by: 'a', say: "It's the best feeling. Thank you, by the way, for having my back." },
      { by: 'b', say: "Always." },
      { by: 'b', conf: "'Always.' I actually said 'always.' I'm a terrible person, and I'm still writing it." },
    ] },
    { id: 'nvt.f3', turns: [
      { by: 'a', say: "Okay, so after tonight, we should start thinking about who's next." },
      { by: 'b', say: "Let's just get through tonight first." },
      { by: 'a', say: "Tonight's easy. It's {wrote}." },
      { by: 'b', say: "Nothing's easy out here." },
      { by: 'a', say: "Wow. Optimistic. Who are you, and what have you done with my friend?" },
      { by: 'b', say: "Sorry. I'm just tired." },
      { by: 'b', conf: "{a} is making plans for tomorrow. {a} doesn't have a tomorrow, not here, and I can't say a word." },
    ] },
  ],
  'vt2.decoy': [
    { id: 'nvt.d1', when: { told: true }, turns: [
      { by: 'a', say: "{teller} says it's me tonight." },
      { by: 'b', say: "{teller} says a lot of things." },
      { by: 'a', say: "{teller} was right last time." },
      { by: 'b', say: "Okay. So what are you going to do?" },
      { by: 'a', say: "I'm going to get everybody I can onto {wrote}, and I'm going to start right now." },
      { by: 'b', say: "I'm on {wrote} with you.", when: { bVoted: 'other', bWrote: true } },
      { by: 'a', conf: "If I'm going home tonight, it won't be because I sat around waiting for it. I'm going down swinging, or not going down at all.", v: { anxious: "I can't stop shaking. If {teller} is right, this is my last night here." } },
    ] },
    { id: 'nvt.d2', turns: [
      { beat: "{a} has been pacing by the water for twenty minutes. {b} finally comes down." },
      { by: 'b', say: "You're making everybody nervous." },
      { by: 'a', say: "Good, because I'm nervous. Somebody's getting votes together, and every time I walk into a conversation, it stops." },
      { by: 'b', say: "That could be about anybody." },
      { by: 'a', say: "It could be, but it isn't. It's me." },
      { by: 'b', say: "So what's the plan?" },
      { by: 'a', say: "{wrote}. If {wrote} goes, whoever's coming for me loses their best vote.", when: { wroteIsBoot: true } },
      { by: 'a', say: "{wrote}. I just need enough people to see what I see.", when: { wroteIsBoot: false } },
      { by: 'b', conf: "{a} is completely convinced it's {a} tonight, and honestly, I'm not sure {a} is wrong." },
    ] },
    { id: 'nvt.d3', turns: [
      { by: 'a', say: "If it's me tonight, I want you to know I'm not mad at you." },
      { by: 'b', say: "Why would it be you?" },
      { by: 'a', say: "Because I've been here long enough to know what it feels like the day it's you." },
      { by: 'b', say: "Then let's make it somebody else." },
      { by: 'a', say: "{wrote}?" },
      { by: 'b', say: "{wrote}. I'll start asking around." },
      { by: 'a', conf: "I've got one friend and one name and about three hours. That's not a lot, but it's more than nothing." },
    ] },
  ],
};

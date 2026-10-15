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
    { id: 'nvt.s4', turns: [
      { by: 'a', say: "Be straight with me. Have you heard my name today?" },
      { by: 'b', say: "Not from anybody I'd believe." },
      { by: 'a', say: "That's not a no." },
      { by: 'b', say: "It's not a yes, either." },
      { by: 'a', say: "Right now I'll take anything that isn't a yes." },
      { by: 'a', conf: "{b} wouldn't look at me for very long. I'm going to go ahead and assume the worst." },
    ] },
    { id: 'nvt.s5', turns: [
      { by: 'a', say: "I need a number from you. How many people do you think are on me?" },
      { by: 'b', say: "Why would you ask me that?" },
      { by: 'a', say: "Because you'd know, and you'd tell me." },
      { by: 'b', say: "I don't know a number. I really don't." },
      { by: 'a', conf: "{b} said 'I don't know' way too fast. Everybody says it way too fast today." },
    ] },
    { id: 'nvt.s6', turns: [
      { beat: "{a} has asked three people the same question in the last hour. {b} is the fourth." },
      { by: 'a', say: "Am I in trouble tonight?" },
      { by: 'b', say: "You know you've asked everybody that, right?" },
      { by: 'a', say: "Because nobody's answered it." },
      { by: 'b', say: "Maybe that's your answer, then." },
      { by: 'a', conf: "Four people, four different ways of not answering. I'm going to spend the rest of the day finding a name that isn't mine." },
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
      { beat: "{b} looks away and doesn't say anything." },
      { by: 'b', conf: "{a} just told me how much {a} trusts me, and in about three hours I'm writing {a}'s name. I've never felt this bad about something I know is right." },
    ] },
    // (before the merge only: read 2026-10-13, Duncan sure he'd 'make the merge' on the merge episode itself)
    { id: 'nvt.f2', when: { merged: false }, turns: [
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
      // (b knows b's own ballot, never the result: read 2026-10-14, "doesn't have a tomorrow" for somebody who stayed)
      { by: 'b', conf: "{a} is making plans for tomorrow, and I'm writing {a.posAdj} name tonight. I can't say a word." },
    ] },
    // (more of them: read 2026-10-14, three versions for every night somebody goes home feeling safe, so each came back
    // two or three times a season)
    { id: 'nvt.f4', turns: [
      { by: 'a', say: "Do you want to sit together tonight? At the vote, I mean." },
      { by: 'b', say: "Sure. Why?" },
      { by: 'a', say: "I don't know. It's {wrote} tonight, and it's going to be awkward, and I'd rather be next to a friend." },
      { by: 'b', say: "Yeah. Okay. We'll sit together." },
      { by: 'a', conf: "Tonight's easy for once. I'm actually looking forward to a vote, which is a weird thing to say." },
      { by: 'b', conf: "{a} wants to sit next to me while I write {a.posAdj} name. I said yes. I didn't know what else to say." },
    ] },
    { id: 'nvt.f5', turns: [
      { by: 'a', say: "Be honest with me. Is there anything I should be worried about tonight?" },
      { by: 'b', say: "Like what?" },
      { by: 'a', say: "Like my name. Has anybody said my name?" },
      { by: 'b', say: "Not to me." },
      { by: 'a', say: "Okay. Good. Then it's {wrote}, like everybody said." },
      { by: 'b', conf: "Nobody said {a}'s name to me, because I'm one of the people saying it. I didn't lie. I just didn't tell the truth." },
    ] },
    { id: 'nvt.f6', turns: [
      { beat: "{a} hands {b} half of the last piece of fruit." },
      { by: 'a', say: "For tonight. We're going to need the energy to watch {wrote} pack." },
      { by: 'b', say: "Thanks. You didn't have to." },
      { by: 'a', say: "Of course I did. You've been the one person I can count on out here." },
      { beat: "{b} eats it without saying anything." },
      { by: 'b', conf: "{a} just shared food with me, out here, where nobody shares food. And I'm still writing {a.posAdj} name tonight." },
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
      { beat: "{a} has been pacing back and forth for twenty minutes. {b} finally goes over." },
      { by: 'b', say: "You're making everybody nervous." },
      { by: 'a', say: "Good, because I'm nervous. Somebody's getting votes together, and every time I walk into a conversation, it stops." },
      { by: 'b', say: "That could be about anybody." },
      { by: 'a', say: "It could be, but it isn't. It's me." },
      { by: 'b', say: "So what's the plan?" },
      { by: 'a', say: "{wrote}. If {wrote} goes, whoever's coming for me loses their best vote.", when: { wroteIsBoot: true } },
      { by: 'a', say: "{wrote}. I just need enough people to see what I see.", when: { wroteIsBoot: false } },
      { by: 'b', conf: "{a} is completely convinced it's {a.obj} tonight, and honestly, I'm not sure {a} is wrong." },
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

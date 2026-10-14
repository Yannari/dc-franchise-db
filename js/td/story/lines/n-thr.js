// ══════════════════════════════════════════════════════════════════════
// td/story/lines/n-thr.js — what people carry from one episode to the next
// ══════════════════════════════════════════════════════════════════════
// td/story/threads.js (header there). Before the challenge.
//   thr.grievance.*  b wrote a's name at a vote a survived (when {lastBoot} went home, if set), though
//                    they were close, and a knows. 1: a brings it up; 2: it's still between them;
//                    mend / war / fade: how it ends (the bond decided that)
//   thr.debt.*       b warned a (how 'warned') or played an idol for a ('idol'): a owes b
// ago: 'recent' (the last vote) or 'while' (a few votes back). Ids: 'nth.'.

export default {
  'thr.grievance.1': [
    { id: 'nth.g1', turns: [
      { beat: "{a} sits down next to {b} at the water's edge, closer than {b} expected." },
      { by: 'a', say: "Can I ask you something? Why did you write my name?" },
      { by: 'b', say: "What makes you think I did?" },
      { by: 'a', say: "We already had this conversation. Don't make me listen to you deny it now." },
      { by: 'b', say: "...It wasn't about you. It was a numbers thing.", v: { tough: "Because I had to. That's the game.", warm: "I'm so sorry. I didn't know how to bring it up again." } },
      { by: 'a', say: "I trusted you. That's what makes this so hard to get past." },
      { by: 'b', say: "I know you did." },
      { by: 'a', conf: "I trusted {b}, and {b} wrote my name anyway. I'm trying to stay calm, but I don't know how I'm supposed to trust {b} again." },
    ] },
    { id: 'nth.g2', turns: [
      { by: 'b', say: "Morning. Are we going to talk, or should I keep walking?" },
      { by: 'a', say: "Are you going to pretend you didn't vote for me?" },
      { by: 'b', say: "I was hoping we could talk about something else." },
      { by: 'a', say: "You wrote my name, {b}. I don't get to forget it just because you want to." },
      { beat: "{b} looks away before answering." },
      { by: 'b', say: "I thought we'd be able to get past it. I can see you're still hurt." },
      { by: 'a', say: "Then stop trying to rush me. I'm not ready to pretend we're fine." },
      { by: 'b', conf: "I thought I could write {a}'s name and still act normal afterward. Apparently not." },
    ] },
  ],
  'thr.grievance.2': [
    { id: 'nth.g3', turns: [
      { by: 'b', say: "Are you still mad at me?" },
      { by: 'a', say: "I'm not mad. I'm careful." },
      { by: 'b', say: "That's worse." },
      { by: 'a', say: "Yeah. It is." },
      { by: 'a', conf: "Every time {b} is nice to me now, I wonder what {b} wants. That's what one vote does. It makes every nice thing suspicious." },
    ] },
    { id: 'nth.g4', turns: [
      { beat: "{a} and {b} end up on the same chore, carrying water, in total silence." },
      { by: 'b', say: "We can't keep doing this forever, you know." },
      { by: 'a', say: "Doing what? We're getting water." },
      { by: 'b', say: "You know what I mean." },
      { by: 'a', say: "I'll talk to you when I trust you again. It's not today." },
      { by: 'b', conf: "One vote. One. And now I'm carrying a bucket next to somebody who won't look at me." },
    ] },
  ],
  'thr.grievance.mend': [
    { id: 'nth.g5', turns: [
      { by: 'a', say: "Hey. About that vote." },
      { by: 'b', say: "I'm sorry. I know you trusted me, and I let you down." },
      { by: 'a', say: "I still don't like it. But I don't want every conversation with you to be about that vote." },
      { by: 'b', say: "So we're okay?" },
      { by: 'a', say: "We're okay. Just don't do it again." },
      { by: 'b', say: "Deal." },
      { by: 'a', conf: "I'm tired of being angry every time I see {b}. I'm willing to try again, even if I still remember exactly how that vote felt." },
    ] },
  ],
  'thr.grievance.war': [
    { id: 'nth.g6', turns: [
      { by: 'b', say: "Are we ever going to get past this?" },
      { by: 'a', say: "No." },
      { by: 'b', say: "Just like that?" },
      { by: 'a', say: "You wrote my name. I've been waiting ever since to return the favour, and I think I'm going to get the chance soon." },
      { by: 'b', say: "Is that a threat?" },
      { by: 'a', say: "It's a promise.", v: { warm: "It's not a threat. It's just how it is now. I'm sorry it went this way." } },
      { by: 'b', conf: "{a} has been holding that vote over me for days, and now {a} wants revenge. Fine. Then I'm not waiting either." },
    ] },
  ],
  'thr.grievance.fade': [
    { id: 'nth.g7', turns: [
      { by: 'a', conf: "I've stopped thinking about the vote {b} cast against me. Mostly. Sometimes {b} says something nice and I remember it." },
      { by: 'a', conf: "I don't trust {b}, and I don't hate {b}. I think that's just where we're going to stay." },
    ] },
  ],

  'thr.debt.1': [
    // (more of them, read 2026-10-14: one or two versions aired in five or six episodes of one season)
    { id: 'nth.d7', when: { how: 'warned' }, turns: [
      { by: 'a', say: "Hey. You didn't have to warn me, and you did. Thank you." },
      { by: 'b', say: "Don't worry about it." },
      { by: 'a', say: "I'm going to worry about it. I owe you." },
      { by: 'b', say: "Fine. You owe me. I'll think of something." },
      { by: 'a', conf: "I hate owing people. But I'd rather owe {b} than be the one going home." },
    ] },
    { id: 'nth.d8', when: { how: 'warned' }, turns: [
      { by: 'b', say: "So. Are we going to talk about how I saved your game?" },
      { by: 'a', say: "Do we have to?" },
      { by: 'b', say: "No. I just like hearing you say thank you." },
      { by: 'a', say: "...Thank you." },
      { by: 'b', say: "There it is." },
      { by: 'b', conf: "I'm not going to cash it in yet. But {a} knows, and {a} knows that I know." },
    ] },
    { id: 'nth.d1', when: { how: 'warned' }, turns: [
      { by: 'a', say: "I never properly said thank you. For warning me." },
      { by: 'b', say: "You'd have done the same." },
      { by: 'a', say: "I don't know if I would have. That's what's bugging me." },
      { by: 'b', say: "Well, now you owe me one." },
      { by: 'a', say: "I know. I'm not going to forget it." },
      { by: 'b', conf: "{a} owes me now, and {a} knows it. I didn't warn {a} to get a favour. But I'll take the favour." },
    ] },
    { id: 'nth.d2', when: { how: 'idol' }, turns: [
      { by: 'a', say: "I still can't believe you played that idol for me." },
      { by: 'b', say: "Don't make it weird." },
      { by: 'a', say: "It's already weird. You saved my whole game. What do I even do with that?" },
      { by: 'b', say: "You stay loyal. That's all." },
      { by: 'a', conf: "{b} gave up an idol for me. If I ever write {b}'s name, I'll never be able to look at myself again." },
    ] },
  ],
  'thr.debt.2': [
    { id: 'nth.d3', turns: [
      { by: 'b', say: "You know I'm counting on you tonight, right? Whatever happens." },
      { by: 'a', say: "I know." },
      { by: 'b', say: "After what I did for you." },
      { by: 'a', say: "I know, I know. You don't have to keep reminding me." },
      { by: 'a', conf: "I'm grateful to {b}. I really am. I just didn't realise gratitude came with a bill." },
    ] },
  ],
  'thr.debt.mend': [
    { id: 'nth.d4', turns: [
      { by: 'a', say: "Hey. I'm with you. Whatever happens, you've got my vote." },
      { by: 'b', say: "You don't have to do that." },
      { by: 'a', say: "When my name was out there, you stuck your neck out for me. I'm not going to forget it." },
      { by: 'b', say: "I didn't do it so you'd owe me. I did it because it was the right thing to do." },
      { by: 'a', say: "I know you did. That's exactly why I'm not going to forget it." },
      { by: 'b', say: "Okay. Then I'll take it. Thank you." },
      { by: 'b', conf: "I helped {a} once, and now {a} would walk through fire for me. Best decision I've made in this game." },
    ] },
  ],
  'thr.debt.war': [
    { id: 'nth.d5', turns: [
      { by: 'b', say: "I saved you. You remember that, right?" },
      { by: 'a', say: "I remember. I also remember you've reminded me of it every day since." },
      { by: 'b', say: "So you're not with me." },
      { by: 'a', say: "I paid you back by not going after you. That's the most I can do." },
      { by: 'b', conf: "I helped {a}, and {a} has decided we're even. We are not even. Not even close." },
    ] },
  ],
  'thr.debt.fade': [
    { id: 'nth.d6', turns: [
      { by: 'a', conf: "{b} helped me a while back, and I still feel like I owe {b} something. I just don't know what, and {b} has never asked." },
    ] },
  ],
};

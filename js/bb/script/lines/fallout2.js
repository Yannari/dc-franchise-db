// ══════════════════════════════════════════════════════════════════════
// bb/script/lines/fallout2.js — the morning after: who kept me, and the votes that flipped
// ══════════════════════════════════════════════════════════════════════
//
// The words for bb-events/fallout.js 'fallout-kept-me' and 'fallout-flip-clash' (the user, 2026-10-29: Ivyna does not
// like Angelica, but Angelica is the one who kept her: "would it improve their relationship if ivyna knew that?";
// and after a week of broken promises, "do the votes cause clash?").
//
//   fallout.keptme     a the nominee who stayed, b a voter who kept them; {gone} went home instead
//                      thaw    they had no time for each other, and a believes it
//                      close   they were already close, and it is said out loud
//                      doubt   a does not believe b
//                      debt    b tells a so that a owes them
//   fallout.flipclash  a a houseguest who was told one name, b who said it and wrote {gone}
//                      caught  a has worked it out, and says so
//                      denied  b denies it, and a cannot prove it

export default {
  'fallout.keptme.thaw': [
    { id: 'fk.t1', turns: [
      { by: 'b', say: "I need to tell you something, and you're not going to like who it's from." },
      { by: 'a', say: "Go on." },
      { by: 'b', say: "I voted to keep you last night." },
      { by: 'a', say: "You? We haven't said ten words to each other all week." },
      { by: 'b', say: "I know. I still didn't want you gone." },
      { by: 'a', dr: "{b} kept me. {b}, of all people. I've spent all week thinking {b} was against me, and I was wrong." }] },
    { id: 'fk.t2', turns: [
      { beat: '{b} waits until the two of them are alone.' },
      { by: 'b', say: "For what it's worth, I voted {gone} out. Not you." },
      { by: 'a', say: "Why would you do that for me?" },
      { by: 'b', say: "Because I'd rather play against you than against {gone}." },
      { by: 'a', say: "That's honest, at least." },
      { by: 'a', dr: "I don't like {b}. I didn't think {b} liked me. {b} still kept me in this house, and I can't pretend that doesn't matter." }] },
    { id: 'fk.t3', turns: [
      { by: 'a', say: "Somebody told me you were one of the votes to keep me." },
      { by: 'b', say: "They told you right." },
      { by: 'a', say: "I've been rude to you since the first week." },
      { by: 'b', say: "You have. I voted for the game, not for whether we get on." },
      { by: 'a', dr: "{b} could have sent me home and didn't. I owe {b} a real conversation, at the very least." }] },
    { id: 'fk.t4', turns: [
      { by: 'b', say: "Can we stop pretending we hate each other for one minute?" },
      { by: 'a', say: "I don't pretend. I just don't trust you." },
      { by: 'b', say: "I kept you last night. Trust that." },
      { by: 'a', say: "...Thank you. I mean it." },
      { by: 'b', dr: "{a} needed to hear it from me. Now {a} knows where my vote went, and so do I." }] },
    { id: 'fk.t5', turns: [
      { by: 'a', say: "Did you vote {gone} out?" },
      { by: 'b', say: "I did." },
      { by: 'a', say: "So you kept me." },
      { by: 'b', say: "I kept you." },
      { by: 'a', say: "I had you down as a vote against me all week." },
      { by: 'a', dr: "I got {b} completely wrong. I'm going to have to rethink a lot of what I thought I knew about this house." }] },
    { id: 'fk.t6', turns: [
      { beat: "{a} sits down next to {b} for the first time all season." },
      { by: 'a', say: "I worked out the votes. You were one of mine." },
      { by: 'b', say: "I was." },
      { by: 'a', say: "Then I should probably stop talking about you behind your back." },
      { by: 'b', say: "That would be nice." },
      { by: 'a', dr: "{b} and I are never going to be best friends. But {b} kept me, and I'm not going to forget it." }] },
  ],
  'fallout.keptme.close': [
    { id: 'fk.c1', turns: [{ by: 'b', say: "I told you I had you." }, { by: 'a', say: "You did. I didn't believe anybody yesterday." }, { by: 'b', say: "Believe me next time." }, { by: 'a', dr: "{b} kept {b.posAdj} word. In this house that's the only thing I've got to hold on to." }] },
    { id: 'fk.c2', turns: [{ beat: '{a} hugs {b} for a long time in the hallway.' }, { by: 'a', say: "Thank you. I know what it cost you to vote against {gone}." }, { by: 'b', say: "It was always going to be you I kept." }, { by: 'b', dr: "{a} knows I kept that promise. Now I need {a} to keep the ones we made back." }] },
    { id: 'fk.c3', turns: [{ by: 'a', say: "You stuck with me." }, { by: 'b', say: "I said I would." }, { by: 'a', say: "People say a lot of things in here." }, { by: 'b', say: "I don't." }, { by: 'a', dr: "{b} voted to keep me and told me before I even asked. That's who I'm going to the end with." }] },
    { id: 'fk.c4', turns: [{ by: 'b', say: "How are you feeling?" }, { by: 'a', say: "Like I've been given my game back." }, { by: 'b', say: "Then let's not waste it." }, { by: 'a', dr: "{gone} is gone and I'm still here, partly because of {b}. We need to win the next HOH." }] },
    { id: 'fk.c5', turns: [{ by: 'a', say: "I went through it all last night. I knew one of the votes was yours." }, { by: 'b', say: "Of course it was mine." }, { by: 'a', say: "I needed to hear you say it." }, { by: 'b', dr: "{a} was scared last night. I could see it from the couch. I'm glad {a} doesn't have to be this morning." }] },
    { id: 'fk.c6', turns: [{ by: 'b', say: "I kept you. You'd have done the same." }, { by: 'a', say: "I would. You know I would." }, { by: 'b', say: "Then we're square." }, { by: 'a', dr: "{b} and I came through that vote together. Whatever comes next, we face it as a pair." }] },
  ],
  'fallout.keptme.doubt': [
    { id: 'fk.d1', turns: [{ by: 'b', say: "I voted to keep you." }, { by: 'a', say: "Everybody's voting to keep me this morning." }, { by: 'b', say: "I mean it." }, { by: 'a', say: "So did the last three people who told me that." }, { by: 'a', dr: "{b} says {b} kept me. The numbers say somebody did. I'm not taking {b}'s word for it until I've checked." }] },
    { id: 'fk.d2', turns: [{ by: 'b', say: "I just want you to know which way I went." }, { by: 'a', say: "And which way was that?" }, { by: 'b', say: "Your way." }, { by: 'a', say: "Half the house has told me that this morning." }, { by: 'a', dr: "Maybe {b} kept me. Maybe {b} is just making sure I think so. I can't tell yet." }] },
    { id: 'fk.d3', turns: [{ by: 'a', say: "Why are you telling me this?" }, { by: 'b', say: "Because it's true." }, { by: 'a', say: "Or because you want something." }, { by: 'b', say: "Both things can be true." }, { by: 'a', dr: "{b} wants credit for keeping me. If it's real, fine. If it isn't, I'll find out." }] },
    { id: 'fk.d4', turns: [{ by: 'b', say: "I was one of your votes." }, { by: 'a', say: "Prove it." }, { by: 'b', say: "How would I prove it?" }, { by: 'a', say: "Exactly." }, { by: 'b', dr: "I told {a} the truth and {a} didn't believe a word. That's what this house does to you." }] },
    { id: 'fk.d5', turns: [{ by: 'a', say: "You're the fourth person this morning to tell me you kept me." }, { by: 'b', say: "Then one of the others is lying." }, { by: 'a', say: "Or you are." }, { by: 'a', dr: "Everybody wants to be the one who kept me. Only some of them did, and I don't know which ones yet." }] },
    { id: 'fk.d6', turns: [{ by: 'b', say: "I need you to know I was with you." }, { by: 'a', say: "Okay." }, { by: 'b', say: "Just okay?" }, { by: 'a', say: "Just okay. I'll believe it when I see what you do next week." }, { by: 'a', dr: "Words are cheap the morning after a vote. I'm going to watch what {b} does, not what {b} says." }] },
  ],
  'fallout.keptme.debt': [
    { id: 'fk.b1', turns: [{ by: 'b', say: "I kept you last night. I'd like you to remember that." }, { by: 'a', say: "I'll remember it." }, { by: 'b', say: "Good. I might need it sooner than you think." }, { by: 'b', dr: "I didn't keep {a} out of kindness. I kept {a} because a vote I can call in later is worth more than {gone}." }] },
    { id: 'fk.b2', turns: [{ by: 'b', say: "You're still here because of me." }, { by: 'a', say: "Partly." }, { by: 'b', say: "Partly is enough. When I need a vote, I'm coming to you first." }, { by: 'a', dr: "{b} kept me, and {b} has already sent the bill." }] },
    { id: 'fk.b3', turns: [{ by: 'b', say: "I went against my own people to keep you." }, { by: 'a', say: "Why?" }, { by: 'b', say: "Because you're going to be useful to me." }, { by: 'a', say: "At least you're honest about it." }, { by: 'a', dr: "{b} kept me for {b}'s game, not mine. I can work with that, as long as I know it." }] },
    { id: 'fk.b4', turns: [{ by: 'b', say: "Next HOH, if you win it, I'm safe. That's fair, isn't it?" }, { by: 'a', say: "That's a lot to ask the morning after." }, { by: 'b', say: "I gave you a lot the night before." }, { by: 'b', dr: "I kept {a}, and now {a} owes me a week of safety. That's the trade, whether {a} likes it or not." }] },
    { id: 'fk.b5', turns: [{ by: 'b', say: "I could have sent you home." }, { by: 'a', say: "But you didn't." }, { by: 'b', say: "No. So you owe me one." }, { by: 'a', dr: "Nobody in here does anything for free. {b} kept me, and {b} is going to want it back." }] },
    { id: 'fk.b6', turns: [{ by: 'b', say: "Don't tell anyone I voted to keep you." }, { by: 'a', say: "Why not?" }, { by: 'b', say: "Because it's worth more to both of us if they don't know." }, { by: 'b', dr: "Nobody knows I kept {a}. That's a secret {a} and I share now, and secrets are the best kind of alliance." }] },
  ],
  'fallout.flipclash.caught': [
    { id: 'ff.c1', turns: [
      { by: 'a', say: "You told me {stated}. You looked me in the eye and said {stated}." },
      { by: 'b', say: "I know what I said." },
      { by: 'a', say: "And then you wrote {gone}." },
      { by: 'b', say: "I changed my mind in the Diary Room." },
      { by: 'a', say: "No. You changed it days ago and let me keep counting you." },
      { by: 'a', dr: "{b} is the reason {gone} is gone. {b} sat with us, counted with us, and then voted the other way." }] },
    { id: 'ff.c2', turns: [
      { beat: 'It starts at the breakfast table and the whole house stops eating.' },
      { by: 'a', say: "The numbers don't work unless it was you." },
      { by: 'b', say: "That's not proof." },
      { by: 'a', say: "It's maths. You were the only one I didn't double check." },
      { by: 'b', say: "Then maybe you should have." },
      { by: 'b', dr: "{a} worked it out. I knew someone would. I just hoped it would take longer than one night." }] },
    { id: 'ff.c3', turns: [
      { by: 'a', say: "We were supposed to be voting together." },
      { by: 'b', say: "We were. Until it stopped being good for me." },
      { by: 'a', say: "So you admit it." },
      { by: 'b', say: "I'm not going to stand here and lie to you twice." },
      { by: 'a', dr: "At least {b} said it to my face this time. It doesn't bring {gone} back." }] },
    { id: 'ff.c4', turns: [
      { by: 'a', say: "Everybody I trusted told me {stated}. Somebody lied." },
      { by: 'b', say: "And you think it's me." },
      { by: 'a', say: "I know it's you. You were the last person I spoke to before the vote, and you were too calm." },
      { by: 'b', say: "I'm always calm." },
      { by: 'a', dr: "{b} flipped. I can feel it, and the count agrees with me. {b} is the next name I want on the block." }] },
    { id: 'ff.c5', turns: [
      { beat: "{a} doesn't wait for privacy. It happens right there, in front of everyone." },
      { by: 'a', say: "You want to tell them, or should I?" },
      { by: 'b', say: "Tell them what?" },
      { by: 'a', say: "That you told us {stated} all week and voted {gone} out last night." },
      { by: 'b', say: "I voted for my game." },
      { by: 'b', dr: "{a} wanted the whole house to know I flipped. Fine. Now they also know I'm not afraid to." }] },
    { id: 'ff.c6', turns: [
      { by: 'a', say: "Was it your idea, or did someone get to you?" },
      { by: 'b', say: "Does it matter?" },
      { by: 'a', say: "It matters to me. I want to know who I'm actually fighting." },
      { by: 'b', say: "You're fighting me. That's all you need to know." },
      { by: 'a', dr: "{b} was supposed to be on our side. {b} wasn't, and now everybody on our side knows it." }] },
  ],
  'fallout.flipclash.denied': [
    { id: 'ff.d1', turns: [{ by: 'a', say: "Somebody flipped last night." }, { by: 'b', say: "It wasn't me." }, { by: 'a', say: "You said {stated}." }, { by: 'b', say: "And I voted {stated}. Ask anybody." }, { by: 'a', dr: "{b} swears it wasn't {b}. Somebody in this house is lying to me, and I can't tell who." }] },
    { id: 'ff.d2', turns: [{ by: 'a', say: "Just tell me the truth. Did you vote {gone} out?" }, { by: 'b', say: "No. I'm as upset about this as you are." }, { by: 'a', say: "You don't look upset." }, { by: 'b', say: "This is what upset looks like on me." }, { by: 'b', dr: "{a} came at me about the vote. I didn't blink. {a} has no proof, and I'm not giving any." }] },
    { id: 'ff.d3', turns: [{ by: 'a', say: "The count doesn't add up." }, { by: 'b', say: "Then look at the people who were quiet all week. Not me." }, { by: 'a', say: "I'm looking at everybody." }, { by: 'b', say: "Good. Keep looking." }, { by: 'a', dr: "{b} pointed me somewhere else very fast. Either {b} knows something, or {b} is the something." }] },
    { id: 'ff.d4', turns: [{ by: 'b', say: "I know what people are saying about me." }, { by: 'a', say: "Then tell me they're wrong." }, { by: 'b', say: "They're wrong. I voted {stated}, like I said I would." }, { by: 'a', say: "Okay." }, { by: 'a', dr: "I want to believe {b}. I'm going to watch {b} very closely this week anyway." }] },
    { id: 'ff.d5', turns: [{ by: 'a', say: "Somebody in our group voted the other way." }, { by: 'b', say: "And you think it was me? After everything?" }, { by: 'a', say: "I don't know what to think." }, { by: 'b', say: "Think about who gains from you being angry with me." }, { by: 'b', dr: "{a} suspects me. The best thing I can do now is make {a} suspect somebody else." }] },
    { id: 'ff.d6', turns: [{ by: 'a', say: "Look me in the eye and say you voted {stated}." }, { by: 'b', say: "I voted {stated}." }, { beat: '{a} holds the look for a long time.' }, { by: 'a', say: "Fine." }, { by: 'a', dr: "{b} didn't look away. Either {b} is telling the truth, or {b} is better at this than I thought." }] },
  ],
};

// pm/lines/hut-confront.js — the beach hut after having it out over a telling
// (pm/events.js haveItOut, talk/confront.js). Role 0 was told and asked; role 1
// was asked. {b} is the other one of the two, {c} the one who told. Gated on
// the engine's facts: `of` (role 1's answer), `verdict`, `believed`.
const K = (more = {}) => ({ kind: 'told-confront', withB: true, ...more });
// Going after the one who told (events.js callOutStirrer, talk/stirrer.js):
// role 0 did the going, role 1 told. {b} is the other one, {c} who was told.
const R = (more = {}) => ({ kind: 'stirrer-confront', withB: true, ...more });
const lines = (prefix, when, texts) => texts.map((t, i) => ({ id: `${prefix}${i + 1}`, when, turns: [['a', t]] }));

export const HUT_CONFRONT = {
  honest: [
    ...lines('hutc.r0.done.h', K({ role: 0, verdict: 'done' }), [
      "I'm done with {b}. I keep saying it out loud so I start believing it.",
      "I really thought {b} was different. I was wrong, and that's that.",
      "I'm not even crying about {b}. I'm crying about how stupid I feel.",
      "I walked away from {b}, and it was the hardest walk of my life. I'd do it again.",
    ]),
    ...lines('hutc.r0.warn.h', K({ role: 0, verdict: 'warning' }), [
      "{b} has got one chance. One. And I'm going to be watching.",
      "I want to trust {b} again. I'm just not there yet.",
      "I didn't end it. I don't know if that makes me brave or an idiot.",
    ]),
    ...lines('hutc.r0.forgive.h', K({ role: 0, verdict: 'forgive', believed: false }), [
      "Maybe I'm an idiot for forgiving {b}. I'd rather be an idiot than spend the rest of this wondering.",
      "We're okay. I think we're okay. I want us to be okay.",
      "{b} said sorry, and I believed it. I hope I'm right.",
    ]),
    ...lines('hutc.r0.believed.h', K({ role: 0, believed: true }), [
      "I believe {b}. I have to. The other option is that {b} looked me in the eye and lied.",
      "If {c} has made that up, then {c} and I have got a problem.",
      "Somebody's not telling me the truth. I've decided it isn't {b}.",
    ]),
    ...lines('hutc.r1.owns.h', K({ role: 1, of: 'owns' }), [
      "I told {b} the truth. That was the hardest conversation I've had in here.",
      "I deserved every word {b} said to me. Every single one.",
      "I could have lied. I didn't. I hope that counts for something.",
    ]),
    ...lines('hutc.r1.done.h', K({ role: 1, verdict: 'done' }), [
      "{b} is done with me. I did that. Nobody else did that.",
      "I've lost {b}, and I've only got myself to blame.",
    ]),
    ...lines('hutc.r1.forgive.h', K({ role: 1, verdict: 'forgive' }), [
      "{b} has given me another chance. I'm not wasting it.",
      "I don't know what I did to deserve {b}. I'm going to make sure I deserve {b.obj} from now on.",
    ]),
    ...lines('hutc.r1.warn.h', K({ role: 1, verdict: 'warning' }), [
      "I'm on thin ice with {b}. I'm going to be very, very careful from now on.",
      "{b} is watching me now. I don't blame {b.obj}. I'd watch me too.",
    ]),
    ...lines('huts.r0.them.h', R({ role: 0, side: 'them' }), [
      "What I do is between me and {c}. {b} needs to learn that.",
      "I had to say something to {b}. If I'd kept quiet, it would have happened again.",
      "I'm not proud of what I did. But {b} running to {c} with it? That's a different thing.",
      "I'm protecting what I've got with {c}. That's all that was.",
    ]),
    ...lines('huts.r0.partner.h', R({ role: 0, side: 'partner' }), [
      "I believe {c}. So {b} and I were always going to have words.",
      "{b} nearly cost me {c}. I wasn't going to let that go.",
      "Maybe {b} meant well. It doesn't change what it nearly did.",
    ]),
    ...lines('huts.r0.cleared.h', R({ role: 0, end: 'cleared' }), [
      "{b} said sorry, and I think {b} meant it. So that's that.",
      "We've cleared the air. I'm glad I went and said it.",
    ]),
    ...lines('huts.r0.feud.h', R({ role: 0, end: 'feud' }), [
      "{b} and I are done. I'm not wasting another word on {b}.",
      "I went over there to talk, and {b} wanted a fight. So now we've got one.",
      "I will not be sharing a sofa with {b} any time soon.",
    ]),
    ...lines('huts.r1.stands.h', R({ role: 1, of: 'stands' }), [
      "I told {c} the truth. I'm not going to say sorry for the truth.",
      "If {b} doesn't want people talking, {b} should stop giving them things to talk about.",
      "I'd do it again. I'd want someone to do it for me.",
    ]),
    ...lines('huts.r1.sorry.h', R({ role: 1, of: 'sorry' }), [
      "Maybe I should have gone to {b} first. I can see that now.",
      "I said sorry, and I meant it. I didn't want any of this.",
      "I thought I was being a good friend to {c}. I might have been a bad one to {b}.",
    ]),
    ...lines('huts.r1.back.h', R({ role: 1, of: 'back' }), [
      "{b} came at me, so I gave it straight back. What did {b} expect?",
      "I'm the one getting shouted at, for something {b} did. It's not fair, and I'm not going to pretend it is.",
    ]),
  ],
  'two-faced': [
    ...lines('hutc.r1.denied.t', K({ role: 1, of: 'denies', believed: true }), [
      "{b} believes me. Good. Let's keep it that way.",
      "I said it didn't happen. As far as {b} is concerned, it didn't.",
    ]),
    ...lines('hutc.r1.deny.t', K({ role: 1, of: 'denies', believed: false }), [
      "{b} doesn't believe me. Fine. Nobody can prove anything.",
      "I stuck to my story. I'm going to keep sticking to it. I don't have a choice now.",
    ]),
    ...lines('hutc.r1.blames.t', K({ role: 1, of: 'blames' }), [
      "If everyone's talking about {c}, nobody's talking about me. That works for me.",
      "Did I feel good, turning it on {c}? No. Did it work? A bit.",
    ]),
    ...lines('hutc.r1.small.t', K({ role: 1, of: 'small' }), [
      "I made it sound like nothing. It wasn't nothing. But it'll be nothing, if I say it enough times.",
      "{b} asked me one question, and I answered it. I didn't answer the other ones.",
    ]),
    ...lines('hutc.r1.t', K({ role: 1 }), [
      "I told {b} some of it. Some of it is plenty for now.",
      "I'm sorry {b} found out. I'm sorrier about what {b} hasn't found out yet.",
    ]),
    ...lines('huts.r1.denies.t', R({ role: 1, of: 'denies' }), [
      "Did I tell {c}? Maybe. Am I going to admit that to {b}? Absolutely not.",
      "{b} can't prove a thing. And I'm certainly not helping.",
    ]),
    ...lines('huts.r1.t', R({ role: 1 }), [
      "Information is the most useful thing in this villa. I'm not going to apologise for having it.",
      "{b} thinks this is about {c}. It's not. It's about me not wanting to be the one everyone talks about.",
    ]),
    ...lines('hutc.r0.t', K({ role: 0 }), [
      "I gave {b} a hard time about secrets. I know. I'm not exactly an open book myself.",
      "I had a go at {b} for keeping things from me. I'm keeping things from {b.obj} too. I know.",
    ]),
  ],
};

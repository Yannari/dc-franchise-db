// pm/lines/hut-confront.js — the beach hut after having it out over a telling
// (pm/events.js haveItOut, talk/confront.js). Role 0 was told and asked; role 1
// was asked. {b} is the other one of the two, {c} the one who told. Gated on
// the engine's facts: `of` (role 1's answer), `verdict`, `believed`.
const K = (more = {}) => ({ kind: 'told-confront', withB: true, ...more });
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
      "We're okay. I think we're okay. Ask me again in a few days.",
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
      "I don't know what I did to deserve {b}. Clearly not much, lately.",
    ]),
    ...lines('hutc.r1.warn.h', K({ role: 1, verdict: 'warning' }), [
      "I'm on thin ice with {b}. I'm going to be very, very careful from now on.",
      "{b} is watching me now. Fair enough. I'd watch me too.",
    ]),
  ],
  'two-faced': [
    ...lines('hutc.r1.denied.t', K({ role: 1, of: 'denies', believed: true }), [
      "{b} believes me. Good. Let's keep it that way.",
      "I said it didn't happen. As far as {b} is concerned, it didn't.",
    ]),
    ...lines('hutc.r1.deny.t', K({ role: 1, of: 'denies', believed: false }), [
      "{b} doesn't believe me. Fine. Nobody can prove anything.",
      "I stuck to my story. It's a good story. I'm sticking to it.",
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
    ...lines('hutc.r0.t', K({ role: 0 }), [
      "I gave {b} a hard time about secrets. I know. I'm not exactly an open book myself.",
      "It's funny, having a go at {b} for keeping things from me. Very funny.",
    ]),
  ],
};

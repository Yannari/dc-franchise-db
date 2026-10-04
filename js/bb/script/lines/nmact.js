// ══════════════════════════════════════════════════════════════════════
// bb/script/lines/nmact.js — the Nightmare Power, spoken (Phase 7)
// ══════════════════════════════════════════════════════════════════════
//
// The house is woken in the middle of the night, the nominations are voided,
// and the Head of Household has to name two new nominees on the spot
// (written by bb/script/ceremony.js). Nobody knows whose power it was, so
// nobody in these lines does either.
//
//   nmact.woken    a (the HOH) is woken with everybody else             scene
//   nmact.voided   a and b come off the block                          scene
//   nmact.redone   a, the HOH, names b and c on the spot                scene
//   nmact.blamed   a (new nominee) blames b (the HOH); c is the other   scene

export default {
  'nmact.woken.scene': [
    { id: 'nm7.w1', turns: [{ beat: 'Every light in the house comes on at once.' }, { by: 'a', say: "What time is it?" }] },
    { id: 'nm7.w2', turns: [{ beat: 'The whole house stumbles into the living room in pyjamas.' }, { by: 'a', say: "Is something wrong?" }] },
    { id: 'nm7.w3', turns: [{ by: 'a', say: "It's three in the morning. Why are we up?" }] },
  ],
  'nmact.voided.scene': [
    { id: 'nm7.v1', turns: [{ by: 'a', say: "Wait. We're off the block?" }, { by: 'b', say: "I think so? I'm still half asleep." }] },
    { id: 'nm7.v2', turns: [{ by: 'a', dr: "I went to bed nominated and woke up safe. I have no idea who did that." }] },
    { id: 'nm7.v3', turns: [{ by: 'b', say: "Somebody just saved us, and I don't know who to thank." }] },
  ],
  'nmact.redone.scene': [
    { id: 'nm7.r1', turns: [{ by: 'a', say: "I have to do this again? Now?" }, { by: 'a', say: "{b}. And {c}. I'm sorry." }] },
    { id: 'nm7.r2', turns: [{ by: 'a', dr: "I had a plan. Somebody tore it up at three in the morning, and I had about a minute to make a new one." }] },
    { id: 'nm7.r3', turns: [{ by: 'a', say: "This isn't what I wanted. {b} and {c}." }] },
  ],
  'nmact.blamed.scene': [
    { id: 'nm7.b1', turns: [{ by: 'a', say: "You put me up in the middle of the night?" }, { by: 'b', say: "I didn't want to! Somebody made me do it again!" }] },
    { id: 'nm7.b2', turns: [{ by: 'a', dr: "{b} said my name. That's all I know. That's all anyone will ever know." }] },
    { id: 'nm7.b3', turns: [{ by: 'a', say: "I was asleep and safe an hour ago." }, { by: 'c', say: "So was I." }] },
  ],
};

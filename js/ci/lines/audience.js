// ══════════════════════════════════════════════════════════════════════
// ci/lines/audience.js — the audience at home decides
// ══════════════════════════════════════════════════════════════════════
//
// formats.js audience-block / audience-immunity (an original twist). The
// share of the vote ({n}) comes from popularity (public.js), handed in.
//   alert.audience-*         the alert, read in an apartment (a, b)
//   audience.open.block      the host: the Influencers nominated a and b
//   audience.open.immunity   the host: the audience will make someone safe
//   audience.wait(.immunity) a, in their apartment, waiting on the result
//   audience.result.block    a saved with {n}%, b blocked
//   audience.result.immunity a immune with {n}%
//   audience.react.*         saved / blocked / immune / missed (b = the other)
//   block.announce.audience  the Circle names who the audience blocked (a = c = them)
const E = (key, list) => ({ [key]: list.map((x, i) => ({ id: `${key}.${String(i + 1).padStart(2, '0')}`, ...x })) });
const host = (t, extra = {}) => ({ turns: [{ by: 'host', say: t }], ...extra });
const say = (t, extra = {}) => ({ turns: [{ by: 'a', say: t }], ...extra });
const react = (t, extra = {}) => ({ turns: [{ by: 'a', react: t }], ...extra });

export const AUDIENCE_LINES = {
  ...E('alert.audience-block', [
    { turns: [{ by: 'a', react: "'Alert! Tonight the Influencers will not block anyone.' Wait, what?" }, { by: 'b', react: "'They will nominate two players. The audience at home will decide who stays.' Oh no. Oh, that's terrifying." }] },
    { turns: [{ by: 'a', react: "'The audience will decide tonight's blocking.' The AUDIENCE? The people watching us?" }, { by: 'b', say: "I hope they've been watching my good side." }] },
    { turns: [{ by: 'a', react: "The audience? So everything we've done in here counts. Everything." }, { by: 'b', react: "Every chat. Every lie. Oh my God." }] },
  ]),
  ...E('alert.audience-immunity', [
    { turns: [{ by: 'a', react: "'Alert! The audience at home will make one player immune tonight.' Me. Please let it be me." }, { by: 'b', react: "Influencers can't win it? Good. Finally something for the rest of us." }] },
    { turns: [{ by: 'a', react: "'The audience has been watching.' That's a scary sentence." }, { by: 'b', say: "If they like me, I'm safe. If they don't, I'm in trouble." }] },
    { turns: [{ by: 'a', react: "The audience picks who's safe? I've been nice to everyone. On camera. Mostly." }, { by: 'b', react: "Mostly. Okay. I'm nervous for you." }] },
  ]),
  ...E('audience.open.block', [
    host("The Influencers have put up {a} and {b}. Now it's out of their hands. The audience at home has voted to save one of them."),
    host("Two names went up from the Hangout tonight: {a} and {b}. Only one of them will still be in The Circle in a minute. The audience decides which."),
    host("{a}. {b}. Tonight the people watching at home hold the power. The votes are in."),
    host("The Influencers put {a} and {b} on the line. The audience has had its say, and it's not close to everyone's liking."),
  ]),
  ...E('audience.open.immunity', [
    host("Before the Influencers decide anything, the audience at home is about to make one player untouchable tonight."),
    host("The votes from home are in. One player is going into tonight's blocking with nothing to fear."),
    host("The audience has been watching every chat, every flirt, every lie. Now they get to protect their favorite."),
    host("Somebody in this building is about to find out the audience loves them. The Influencers can't win this one."),
  ]),
  ...E('audience.wait', [
    say("Please. Please. I've been myself in here. Mostly."),
    react("I can't watch. Circle, tell me when it's over. Okay, I'm watching.", { beat: '{a} has a pillow pressed to {a.posAdj} face.' }),
    say("Whatever happens, I hope my family is proud of how I played."),
    react("Come on, audience. You know me. You've seen everything."),
    say("If they've been watching, they know I'm a good person. Right? Right?"),
    react("I'm shaking. I am physically shaking."),
  ]),
  ...E('audience.wait.immunity', [
    say("Do they like me out there? I really hope they like me out there."),
    react("Pick me, pick me, pick me."),
    say("I don't even care about the game right now. I just want to know if the audience likes me."),
    react("Okay. Deep breath. It's just millions of people judging me.", { beat: '{a} sits very straight, staring at the screen.' }),
    say("Being safe tonight would change everything for me."),
  ]),
  ...E('audience.result.block', [
    host("With {n}% of the vote, the audience has saved {a}. {b}, you have been blocked from The Circle."),
    host("The audience at home has spoken. {a} is safe, with {n}% of the vote. {b}, your time in The Circle is over."),
    host("{n}%. That is how much of the audience wanted {a} to stay. {b}, I'm sorry. You have been blocked."),
    host("It's {a}. The audience saved {a} with {n}% of the vote, which means {b} has been blocked."),
  ]),
  ...E('audience.result.immunity', [
    host("With {n}% of the vote, the audience has made {a} immune tonight. {a} cannot be blocked."),
    host("The audience at home loves {a}: {n}% of the vote. {a} is safe tonight, whatever the Influencers want."),
    host("{a}, the audience has your back. {n}% of the vote, and you are safe at tonight's blocking."),
    host("And the most loved player in The Circle tonight is {a}, with {n}% of the vote. {a} is immune."),
  ]),
  ...E('audience.react.saved', [
    react("They saved me? THEY SAVED ME! I love you! I love everyone at home!", { beat: '{a} jumps up and down on the couch.' }),
    say("I'm still here. I can't believe I'm still here. I'm so sorry, {b}."),
    react("Thank you. Thank you. I will not waste this."),
    say("The audience saved me. Which means the Influencers wanted me gone. Noted."),
  ]),
  ...E('audience.react.blocked', [
    react("Wow. Okay. The audience didn't want me. That one stings."),
    say("I came in here to be myself. Maybe myself wasn't enough. That's okay."),
    react("It's fine. It's fine. It's not fine. But it will be."),
    say("Congratulations, {b}. Honestly. Play hard for both of us."),
  ]),
  ...E('audience.react.immune', [
    react("ME? The audience picked ME? Oh my God!", { beat: '{a} throws both hands in the air.' }),
    say("I'm immune. I'm immune! I can finally breathe tonight."),
    react("People at home like me! That's all I ever wanted!"),
    say("I'm safe. The Influencers can't touch me. That's a nice feeling."),
  ]),
  ...E('audience.react.missed', [
    say("So close. Okay. {b} deserves it. I guess."),
    react("I thought it was me! I really thought it was me."),
    say("Congrats, {b}. Now I'm one name closer to the bottom."),
    react("The audience loves {b}. Okay. Noted. For later."),
  ]),
  ...E('block.announce.audience', [
    host("The audience has decided. {a} has been blocked from The Circle."),
    host("By the vote of the audience at home, {a} is blocked."),
    host("The audience didn't save {a}. {a} has been blocked."),
  ]),
};

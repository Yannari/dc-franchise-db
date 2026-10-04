// ══════════════════════════════════════════════════════════════════════
// bb/script/lines/twist7.js — Care Package and the Coup (Phase 6)
// ══════════════════════════════════════════════════════════════════════
//
// The words for bb-events/care-package.js and coup.js.
//
//   care.favourite  a resents b, the audience's choice for the package       scene
//   care.passed     a has never been picked ({packages} so far); b is a friend   scene; intent told
//   care.costume    a is safe in the super-safety costume; b watches          scene
//   care.cohoh      a, the HOH, shares the week with b, the voted co-HOH      scene
//   care.silenced   b took a's vote by name ({other} lost theirs too)         scene; intent pair
//   care.money      a guesses b took the bribe money                          scene
//   coup.dethroned  a, the HOH, lost the week to b's coup; c is a friend      loud | quiet
//   coup.seated     b's coup put a on the block ({other} went up too)         scene; intent pair
//   coup.saved      b's coup took a off the block; c watches                  scene; third
//   coup.target     a sizes up b, who played the coup                         scene
//   coup.after      a week on, a plans against b, who played it               scene

export default {
  'care.favourite.scene': [
    { id: 'cp7.f1', turns: [{ by: 'a', dr: "I've spent {weeks} making sure everyone notices me. The box went to {b}." }] },
    { id: 'cp7.f2', turns: [{ by: 'a', say: "They don't see what I do in here." }, { by: 'b', say: "It's just a box." }, { by: 'a', say: "It's not just a box." }] },
    { id: 'cp7.f3', turns: [{ by: 'a', dr: "There's nobody to be angry with about it. So I'm angry with {b}." }] },
    { id: 'cp7.f4', turns: [{ by: 'a', dr: "The audience chose {b}. Not me. That's the part that hurts." }] },
    { id: 'cp7.f5', turns: [{ by: 'b', dr: "{a} has been off with me since the package. I didn't pick myself." }] },
    { id: 'cp7.f6', turns: [{ by: 'a', say: "Congratulations." }, { by: 'b', say: "Thanks." }, { by: 'a', dr: "I didn't mean that." }] },
  ],
  'care.passed.scene': [
    { id: 'cp7.p1', when: { intent: 'told' }, turns: [{ by: 'a', say: "That's {packages} packages and not one for me. Am I even on the show?" }, { by: 'b', say: "You're on the show." }] },
    { id: 'cp7.p2', turns: [{ by: 'a', dr: "I've been eligible every week and they've never picked me. That's about my edit, not my game." }] },
    { id: 'cp7.p3', when: { intent: 'told' }, turns: [{ by: 'a', say: "Maybe it's good. Nobody out there is watching me either." }, { by: 'b', say: "That's one way to look at it." }] },
    { id: 'cp7.p4', turns: [{ by: 'a', dr: "If the audience can't see me, the house can't either. I'm calling that a strategy." }] },
    { id: 'cp7.p5', turns: [{ by: 'a', dr: "Another package, another name that isn't mine." }] },
    { id: 'cp7.p6', when: { intent: 'told' }, turns: [{ by: 'b', say: "Next time." }, { by: 'a', say: "You said that last time." }] },
  ],
  'care.costume.scene': [
    { id: 'cp7.c1', turns: [{ by: 'b', dr: "{a} has to wear that thing all week. Every hour, it reminds us {a} can't be touched." }] },
    { id: 'cp7.c2', turns: [{ by: 'a', say: "Morning, everyone!" }, { beat: '{b} laughs.' }, { by: 'b', dr: "One less name we can put up. All week. And nobody in here decided that." }] },
    { id: 'cp7.c3', turns: [{ by: 'b', say: "You look ridiculous." }, { by: 'a', say: "I look ridiculous and safe." }] },
    { id: 'cp7.c4', turns: [{ by: 'b', dr: "The safest person in the house is dressed as a cartoon. That's harder to be around than the safety." }] },
    { id: 'cp7.c5', turns: [{ by: 'a', dr: "I'll wear anything if it means I can't be nominated." }] },
    { id: 'cp7.c6', turns: [{ by: 'a', say: "Ridiculous and safe." }, { by: 'b', say: "You've said that four times today." }] },
  ],
  'care.cohoh.scene': [
    { id: 'cp7.h1', turns: [{ by: 'a', dr: "I won a competition for this week. Now I'm sharing it with {b}, who won a popularity vote." }] },
    { id: 'cp7.h2', turns: [{ by: 'a', dr: "Half my block belongs to someone else now. The half I had a plan for." }] },
    { id: 'cp7.h3', turns: [{ by: 'a', say: "We're a team this week." }, { by: 'b', say: "We are." }, { by: 'a', dr: "I didn't ask for a team." }] },
    { id: 'cp7.h4', turns: [{ by: 'a', say: "I don't mind sharing. Really." }, { by: 'b', dr: "That's the third time {a} has said that." }] },
    { id: 'cp7.h5', turns: [{ by: 'b', dr: "{a} won HOH. I didn't do anything. Now we both have keys. {a} isn't happy." }] },
    { id: 'cp7.h6', turns: [{ by: 'a', dr: "{b} is safe and has a key and did nothing in this house to earn either." }] },
  ],
  'care.silenced.scene': [
    { id: 'cp7.s1', turns: [{ by: 'a', dr: "I couldn't vote, and I know exactly why. {b} said my name in front of everyone." }] },
    { id: 'cp7.s2', turns: [{ by: 'a', say: "You could have picked anybody." }, { by: 'b', say: "I know." }, { by: 'a', say: "And you picked me." }] },
    { id: 'cp7.s3', when: { intent: 'pair' }, turns: [{ by: 'a', dr: "{other} and I sat through the eviction without a vote between us. {b} wouldn't look at us." }] },
    { id: 'cp7.s4', turns: [{ by: 'a', dr: "There's no mystery here. I've got a name, witnesses, and no vote." }] },
    { id: 'cp7.s5', turns: [{ by: 'b', dr: "I had to take somebody's vote. {a} isn't going to forgive me for it." }] },
    { id: 'cp7.s6', turns: [{ by: 'a', say: "Why me?" }, { by: 'b', say: "It had to be someone." }] },
  ],
  'care.money.scene': [
    { id: 'cp7.m1', turns: [{ by: 'a', dr: "Five thousand dollars came into this house and nobody's seen where it went. I think it went to {b}." }] },
    { id: 'cp7.m2', turns: [{ by: 'a', say: "What would you take? Honestly. What's the number?" }, { by: 'b', say: "I wouldn't." }, { by: 'a', dr: "Everyone says that." }] },
    { id: 'cp7.m3', turns: [{ by: 'a', dr: "Since the eviction, I can't tell a normal vote from a bought one. I think {b}'s was bought." }] },
    { id: 'cp7.m4', turns: [{ by: 'a', say: "It's not about the money. It's about who takes it." }, { by: 'b', say: "Why are you looking at me?" }] },
    { id: 'cp7.m5', turns: [{ by: 'a', say: "Did you take it?" }, { by: 'b', say: "No." }, { by: 'a', dr: "I don't believe {b}." }] },
    { id: 'cp7.m6', turns: [{ by: 'b', dr: "{a} keeps asking me about the money. I'm not answering." }] },
  ],
  'coup.dethroned.loud': [
    { id: 'cu7.l1', turns: [{ by: 'a', dr: "I've still got the room, the key and the bed. I don't have one decision left to make with any of it." }] },
    { id: 'cu7.l2', turns: [{ by: 'a', say: "I won that competition!" }, { beat: 'Nobody argues. It just doesn\'t matter any more.' }] },
    { id: 'cu7.l3', when: { third: true }, turns: [{ by: 'a', say: "This was my week. I had a plan." }, { by: 'c', say: "I know." }, { by: 'a', say: "It was a good plan." }] },
    { id: 'cu7.l4', turns: [{ by: 'a', dr: "{b} took my week. I'm going to make sure everyone knows how I feel about that." }] },
    { id: 'cu7.l5', turns: [{ by: 'a', say: "Enjoy it, {b}." }, { by: 'b', say: "I will." }] },
    { id: 'cu7.l6', turns: [{ by: 'b', dr: "{a} is telling anyone who'll listen. I don't care. The block is mine now." }] },
  ],
  'coup.dethroned.quiet': [
    { id: 'cu7.q1', turns: [{ by: 'a', say: "Great move, {b}. Really." }, { beat: '{a} goes to bed early.' }] },
    { id: 'cu7.q2', turns: [{ by: 'a', dr: "I'm not making a scene. I'm working out who knew. That's a better use of being angry." }] },
    { id: 'cu7.q3', turns: [{ by: 'a', dr: "The room is mine for three more days. The week stopped being mine at the veto meeting." }] },
    { id: 'cu7.q4', when: { third: true }, turns: [{ by: 'c', say: "Are you okay?" }, { by: 'a', say: "I'm fine." }, { by: 'c', dr: "{a} is not fine." }] },
    { id: 'cu7.q5', turns: [{ by: 'b', dr: "{a} took it well. Too well. I'm a bit worried." }] },
    { id: 'cu7.q6', turns: [{ by: 'a', dr: "I'll get my chance. I can wait." }] },
  ],
  'coup.seated.scene': [
    { id: 'cu7.s1', turns: [{ by: 'a', dr: "I was safe. The ceremony was over. Now I'm on the block because {b} decided I should be." }] },
    { id: 'cu7.s2', turns: [{ by: 'a', say: "An hour ago I was fine." }, { beat: '{a} keeps coming back to the hour.' }] },
    { id: 'cu7.s3', when: { intent: 'pair' }, turns: [{ by: 'a', dr: "{other} and I are having the same conversation in different rooms. Neither of us saw this coming." }] },
    { id: 'cu7.s4', turns: [{ by: 'a', dr: "I've got three days to build a campaign from nothing. I'm starting tonight." }] },
    { id: 'cu7.s5', turns: [{ by: 'a', say: "Nobody voted for you to have that power." }, { by: 'b', say: "Nobody had to." }] },
    { id: 'cu7.s6', turns: [{ by: 'a', dr: "There's no vote to appeal to. There's nobody to negotiate with. Just {b}." }] },
  ],
  'coup.saved.scene': [
    { id: 'cu7.v1', turns: [{ by: 'a', dr: "{b} took me off the block in front of everyone. I owe {b} now. Everyone saw it." }] },
    { id: 'cu7.v2', turns: [{ by: 'a', say: "Thank you." }, { by: 'b', say: "You're welcome." }, { by: 'a', dr: "I'm avoiding {b} for the rest of the night. The next conversation will have a price." }] },
    { id: 'cu7.v3', turns: [{ by: 'a', say: "You didn't have to do that." }, { by: 'b', say: "I know." }, { by: 'a', dr: "We both know {b} did it for {b}." }] },
    { id: 'cu7.v4', when: { third: true }, turns: [{ by: 'c', dr: "{b} saved {a}. From now on, I count them as a pair." }] },
    { id: 'cu7.v5', when: { third: true }, turns: [{ by: 'c', say: "So you two are working together." }, { by: 'a', say: "No!" }, { by: 'c', say: "Sure." }] },
    { id: 'cu7.v6', turns: [{ by: 'a', dr: "I can deny a deal. I can't undo what everyone saw." }] },
  ],
  'coup.target.scene': [
    { id: 'cu7.t1', turns: [{ by: 'a', dr: "{b} had something nobody knew about, and used it. Was that the only thing {b} had?" }] },
    { id: 'cu7.t2', turns: [{ by: 'a', dr: "{b} used a secret power to take over the week. That's the reason {b} can't be allowed near the end." }] },
    { id: 'cu7.t3', turns: [{ by: 'a', say: "Great move." }, { by: 'b', say: "Thanks." }, { by: 'a', dr: "And that move is why {b} should go next." }] },
    { id: 'cu7.t4', turns: [{ by: 'a', dr: "I'm not scared of what {b} has left. I'm scared {b} was willing to do that in front of everyone." }] },
    { id: 'cu7.t5', turns: [{ by: 'b', dr: "I played the coup. Now I'm the biggest target in the house." }] },
    { id: 'cu7.t6', turns: [{ by: 'a', dr: "Anyone who can take over a week like that is a threat to win. Simple." }] },
  ],
  'coup.after.scene': [
    { id: 'cu7.a1', turns: [{ by: 'a', dr: "The house hasn't stopped talking about the coup. I have. I'm busy arranging what happens to {b}." }] },
    { id: 'cu7.a2', turns: [{ by: 'a', dr: "Every conversation about nominations starts and ends with {b}. Nobody says it's revenge. It's revenge." }] },
    { id: 'cu7.a3', turns: [{ by: 'a', dr: "I've counted who would vote to keep {b}. It's not a big number." }] },
    { id: 'cu7.a4', turns: [{ by: 'a', dr: "Nobody has forgotten who stood up at that veto meeting. I definitely haven't." }] },
    { id: 'cu7.a5', turns: [{ by: 'b', dr: "It's been a week. People are still talking about the coup. I know what that means." }] },
    { id: 'cu7.a6', turns: [{ by: 'a', say: "Still thinking about the coup?" }, { by: 'b', say: "Are you?" }, { by: 'a', say: "Every day." }] },
  ],
};

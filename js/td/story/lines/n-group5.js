// ══════════════════════════════════════════════════════════════════════
// td/story/lines/n-group5.js — more moments that draw a crowd
// ══════════════════════════════════════════════════════════════════════
//
// director.js PULL: an alliance welcomes the member it just recruited (c, d, e: the members in
// camp), friends gather round a friendship moment (c, d, e: friends of both a and b), a fight
// draws b's closest friends (c, d), who are on b's side. Lines past the third person are
// optional (opt: true) and play when that person is there. Ids: 'no.'.

const O = (by, say) => ({ by, say, opt: true });

export default {
  'long.recruit.join.any': [
    { id: 'no.j1', place: 'secret', when: { third: true }, turns: [
      { beat: "{a} brings {b} out to {place}. The rest of {group} is already waiting." },
      { by: 'b', say: "Oh. This is a meeting." },
      { by: 'a', say: "This is {group}. We want you in it." },
      { by: 'c', say: "We've been watching you. In a good way." },
      O('d', "Mostly a good way."),
      { by: 'b', say: "Why me?" },
      { by: 'a', say: "Because you work hard, you don't talk behind people's backs, and you've got nobody yet." },
      O('e', "And because we need one more vote. Let's be honest."),
      { by: 'c', say: "So? You in?" },
      { by: 'b', say: "...Yeah. I'm in." },
      { by: 'b', conf: "I walked out there thinking it was a talk. It was a whole alliance. That was either a welcome or an ambush. I chose welcome." },
    ] },
    { id: 'no.j2', place: 'secret', when: { third: true, voice: ['bossy', 'schemer', 'calm', 'competitive'] }, turns: [
      { by: 'a', say: "Sit down. Everybody, this is {b}. {b}, this is everybody." },
      { by: 'b', say: "Hi, everybody." },
      { by: 'c', say: "Rules first. We vote together. Every time." },
      O('d', "And nobody talks about this meeting. To anyone."),
      O('e', "Not even to your showmance. If you get one."),
      { by: 'b', say: "That's a lot of rules." },
      { by: 'a', say: "That's why we're still here." },
      { by: 'b', conf: "{group} has rules. Real ones. I've never been in anything this organised. It's a little scary. Mostly it's a relief." },
    ] },
  ],
  'long.friend.bond.any': [
    { id: 'no.b1', place: 'water', when: { third: true }, turns: [
      { beat: "{a}, {b} and the friends they share have taken over {here} for the afternoon." },
      { by: 'a', say: "Okay, nobody move. This is perfect." },
      { by: 'b', say: "We're just sitting here." },
      { by: 'c', say: "That's what makes it perfect." },
      O('d', "Can somebody pass the water? Without moving?"),
      O('e', "That's not possible." ),
      O('d', "Then I'll die of thirst. Happily."),
      { by: 'b', say: "I could stay like this all day." },
      { by: 'a', conf: "No plotting, no voting, just my people and a nice afternoon. I'm going to remember this when it gets ugly." },
    ] },
    { id: 'no.b2', place: 'fire', when: { third: true }, turns: [
      { by: 'c', say: "Okay, everybody. Most embarrassing thing that's happened to you here. Go." },
      { by: 'a', say: "I fell in the water. Twice." },
      { by: 'b', say: "I saw the second time. It was beautiful." },
      O('d', "I called {host} 'Mom'."),
      O('e', "You did WHAT?"),
      O('d', "It was early! I was tired!"),
      { by: 'c', say: "That's the best one. That's the winner." },
      { by: 'b', conf: "We laughed so hard somebody from the other end of camp told us to shut up. I'd do it again." },
    ] },
  ],
  'long.friend.goof.any': [
    { id: 'no.g1', place: 'public', when: { third: true }, turns: [
      { beat: "{a} has decided to teach everybody a dance {here}." },
      { by: 'a', say: "Five, six, seven, eight! Left, left, spin!" },
      { by: 'b', say: "Which left?" },
      { by: 'c', say: "There's only one left!" },
      O('d', "I spun the wrong way. I'm on the ground now."),
      O('e', "Can we start again? I wasn't ready."),
      { by: 'a', say: "From the top! Everybody!" },
      { beat: "It gets worse every time. Nobody stops." },
      { by: 'c', conf: "None of us can dance. We did it for an hour anyway. That's the most fun I've had here." },
    ] },
  ],
  'long.drama.fight.any': [
    { id: 'no.f1', place: 'public', when: { third: true }, turns: [
      { beat: "It starts small {here}. Then {b}'s friends hear it." },
      { by: 'a', say: "You've been slacking all day, and everybody knows it." },
      { by: 'b', say: "I've been working as hard as anybody!" },
      { by: 'c', say: "Whoa. What is your problem?" },
      O('d', "Yeah. {b} carried the water three times this morning. Where were you?"),
      { by: 'a', say: "Great. Now it's a whole fan club." },
      { by: 'c', say: "It's not a fan club. It's people who saw what happened." },
      O('d', "Back off, {a}."),
      { by: 'b', say: "It's fine. Let it go." },
      { by: 'a', conf: "I say one thing to {b} and suddenly I'm fighting three people. Noted. All of them noted." },
      { by: 'b', conf: "I didn't even have to defend myself. That's how you know who your friends are here." },
    ] },
    { id: 'no.f2', place: 'eat', when: { third: true, voice: ['loud', 'tough', 'blunt', 'cruel'] }, turns: [
      { by: 'a', say: "Can you chew a little louder? I don't think the other team heard you." },
      { by: 'b', say: "Seriously? Over food?" },
      { by: 'a', say: "Over everything. You're always too much." },
      { by: 'c', say: "You're the one who's too much. You've been picking on {b} since we got here." },
      O('d', "Every single day."),
      { by: 'a', say: "Oh, I'm sorry. I didn't know {b} needed bodyguards." },
      O('d', "Apparently {b} does. With you around." ),
      { by: 'c', conf: "Somebody had to say it. {a} picks on whoever's quiet. Not today." },
    ] },
  ],
};

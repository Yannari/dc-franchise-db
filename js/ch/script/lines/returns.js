// Coming back from the Arena, in the mood it really is (js/ch/house.js returnMood). Merged into every return
// (faced, called out, volunteered, quiet), so each line needs only the winner.
//   a = the winner; b = somebody who voted them in (optional); x, y = friends at the door (optional)
//   {gone} = the one they beat; {count} = their Arena wins (two or more); {alliance} = their group (alliance)
export default {
  'return.any': [
    // ── sad: they just sent a friend home ──
    { id: 'rm.sad1', when: { mood: 'sad' }, turns: [
      { beat: '{a} walks in slowly and does not look like somebody who just won.' },
      { by: 'x', opt: 1, say: "Hey. You did it. You're still here." },
      { by: 'a', opt: 'x', say: "I know. I just sent {gone} home. I don't feel like celebrating." },
      { by: 'b', opt: 1, say: "You had no choice. It was you or {gone}." },
      { by: 'a', opt: 'b', say: "And you're the reason it had to be one of us. Don't forget that." },
      { by: 'a', conf: "Everybody's waiting for me to celebrate. {gone} was my friend. I'm going to sit in the shower for a while." },
    ] },
    { id: 'rm.sad2', when: { mood: 'sad' }, turns: [
      { beat: '{a} comes through the door holding a bracelet that belonged to {gone}.' },
      { by: 'a', say: "{gone} told me to give everybody a hug. So. Hugs." },
      { by: 'x', opt: 1, say: "Come here." },
      { by: 'a', conf: "Beating a stranger is the game. Beating {gone} felt like losing anyway." },
    ] },
    // ── me against the house: three wins and counting ──
    { id: 'rm.hs1', when: { mood: 'house' }, turns: [
      { beat: 'The door opens. {a} again.' },
      { by: 'a', say: "Hi. Me again. That's {count} now, if anybody's keeping count." },
      { by: 'b', opt: 1, say: "Nobody's keeping count." },
      { by: 'a', opt: 'b', say: "I am. And every one of them started with somebody in this room saying my name." },
      { by: 'a', say: "So go ahead. Vote me in next week. I'll be back for breakfast." },
      { by: 'a', conf: "It's me against the whole house at this point. And so far, the whole house is losing." },
    ] },
    { id: 'rm.hs2', when: { mood: 'house' }, turns: [
      { beat: '{a} walks in and goes straight to the fridge as if nothing happened.' },
      { by: 'y', opt: 1, say: "Are you seriously just making a sandwich?" },
      { by: 'a', opt: 'y', say: "Winning makes me hungry. That's {count} times now. I'm very hungry." },
      { by: 'b', opt: 1, say: "You're unbelievable." },
      { by: 'a', opt: 'b', say: "I'm undefeated. It's different." },
      { by: 'a', conf: "They keep sending me in there like the next one will be different. It won't be. They're running out of people to send." },
    ] },
    { id: 'rm.hs3', when: { mood: 'house' }, turns: [
      { by: 'a', say: "Okay, everybody. Quick question. Who's next?" },
      { by: 'b', opt: 1, say: "Calm down." },
      { by: 'a', say: "No, really. I'd like to know who's next, so I can start training." },
      { by: 'a', conf: "{count} Arenas. Every time, they think they've finally got me. Every time, I'm back at dinner." },
    ] },
    { id: 'rm.hs4', when: { mood: 'house' }, turns: [
      { beat: 'Nobody gets up when {a} comes in. They have stopped being surprised.' },
      { by: 'a', say: "Wow. No welcome back? I'm hurt." },
      { by: 'y', opt: 1, say: "You'll get over it." },
      { by: 'a', opt: 'y', say: "I always do. That's the problem, isn't it? For all of you." },
      { by: 'a', conf: "They've sent me in {count} times. I've come back {count} times. At some point they have to start asking who's really running this house." },
    ] },
    // ── my alliance against the house ──
    { id: 'rm.al1', when: { mood: 'alliance' }, turns: [
      { beat: '{a} walks in, and the whole of {alliance} is on its feet.' },
      { by: 'x', opt: 1, say: "THAT'S HOW IT'S DONE! THAT'S HOW IT'S DONE!" },
      { by: 'a', say: "They tried. They tried again. {alliance} is still standing." },
      { by: 'b', opt: 1, say: "Enjoy it while it lasts." },
      { by: 'a', opt: 'b', say: "We will. All of us. Together." },
      { by: 'a', conf: "It's not me against the house anymore. It's {alliance} against the house, and we're winning." },
    ] },
    { id: 'rm.al2', when: { mood: 'alliance' }, turns: [
      { beat: '{alliance} meets {a} at the door like a team meeting a player off the field.' },
      { by: 'a', say: "Is everybody still with me?" },
      { by: 'x', opt: 1, say: "Everybody. Every single one." },
      { by: 'a', say: "Good. Because they're going to come at us again next week." },
      { by: 'a', conf: "The house thinks it can pick us off one at a time. It can't. They'll have to beat all of us." },
    ] },
    { id: 'rm.al3', when: { mood: 'alliance' }, turns: [
      { beat: 'The rest of {alliance} has saved {a} a seat in the middle of the couch.' },
      { by: 'x', opt: 1, say: "Sit. You've earned the good seat." },
      { by: 'a', opt: 'x', say: "I'll sit when we've decided who's next. Who voted for me?" },
      { by: 'y', opt: 1, say: "We've got a list." },
      { by: 'a', conf: "I didn't win that Arena on my own. I had {alliance} in the stand, and now the house has a problem." },
    ] },
    // ── revenge ──
    { id: 'rm.rv1', when: { mood: 'revenge' }, turns: [
      { beat: '{a} walks in and looks at every single face in the room before saying anything.' },
      { by: 'a', say: "I remember every name. Every one." },
      { by: 'b', opt: 1, say: "It was a vote, {a}." },
      { by: 'a', opt: 'b', say: "And this is what comes after a vote. Me." },
      { by: 'x', opt: 1, say: "Okay. Let's get you some water." },
      { by: 'a', conf: "I'm not here to make friends anymore. I'm here to send every one of them through that Arena, one at a time." },
    ] },
    { id: 'rm.rv3', when: { mood: 'revenge' }, turns: [
      { beat: '{a} walks in, drops a bag on the kitchen table and says nothing for a long moment.' },
      { by: 'a', say: "So. Who's first?" },
      { by: 'x', opt: 1, say: "First for what?" },
      { by: 'a', opt: 'x', say: "First to find out what it feels like." },
      { by: 'a', conf: "I spent the whole Arena thinking about the faces that said my name. I'm going to spend the rest of the season paying them back." },
    ] },
    { id: 'rm.rv4', when: { mood: 'revenge' }, turns: [
      { beat: 'The house goes quiet when {a} comes in.' },
      { by: 'a', say: "Don't stop on my account. Keep planning. I'd love to hear who's next." },
      { by: 'b', opt: 1, say: "Nobody's planning anything." },
      { by: 'a', opt: 'b', say: "That's what you said last time." },
      { by: 'a', conf: "I'm done being the one they talk about. From now on, I'm the one doing the talking." },
    ] },
    { id: 'rm.rv5', when: { mood: 'revenge' }, turns: [
      { by: 'a', say: "Remember this face. You'll be seeing it in the Arena." },
      { by: 'x', opt: 1, say: "Okay, maybe take a shower first." },
      { by: 'a', opt: 'x', say: "After. I want them to see the sand." },
      { by: 'a', conf: "They thought they were getting rid of me. All they did was give me a reason." },
    ] },
    // ── mockery ──
    { id: 'rm.mk1', when: { mood: 'mock' }, turns: [
      { beat: '{a} strolls in and takes a slow bow in the middle of the common room.' },
      { by: 'a', say: "Thank you, thank you. And a special thank you to everybody who voted for me. You made this possible." },
      { by: 'b', opt: 1, say: "You're enjoying this way too much." },
      { by: 'a', opt: 'b', say: "I'm enjoying it exactly the right amount." },
      { by: 'a', conf: "They wanted me gone. Now they have to watch me walk around like I own the place. Which, for now, I do." },
    ] },
    { id: 'rm.mk2', when: { mood: 'mock' }, turns: [
      { by: 'a', say: "Did everybody have a nice night? Get some sleep? Plan my funeral?" },
      { by: 'b', opt: 1, say: "Nobody was planning your funeral." },
      { by: 'a', opt: 'b', say: "That's a shame. You'd have wasted the effort." },
      { by: 'a', conf: "I love walking back in. The faces are the best part. Pure disappointment." },
    ] },
    // ── straight back to plotting ──
    { id: 'rm.st1', when: { mood: 'strategy' }, turns: [
      { beat: '{a} walks in, says nothing to anybody, and heads straight for the bunk room.' },
      { by: 'x', opt: 1, say: "Hey. You won. You're allowed to smile." },
      { by: 'a', opt: 'x', say: "I'll smile later. Right now I need to know who flipped and who didn't." },
      { by: 'a', conf: "Winning the Arena buys me a week. I'm not going to waste a single day of it celebrating." },
    ] },
    { id: 'rm.st2', when: { mood: 'strategy' }, turns: [
      { by: 'a', say: "Okay. Who's talking to who? What did I miss?" },
      { by: 'x', opt: 1, say: "You literally just walked in." },
      { by: 'a', opt: 'x', say: "And things happen fast in here. Talk." },
      { by: 'a', conf: "Everybody who voted for me thinks they're safe now that I'm back. That's their second mistake." },
    ] },
    // ── comedy ──
    { id: 'rm.cm1', when: { mood: 'comedy' }, turns: [
      { beat: '{a} bursts through the door with arms in the air.' },
      { by: 'a', say: "I'M ALIVE! Somebody tell my mom! Actually, don't, she's probably watching." },
      { by: 'x', opt: 1, say: "How did you even win that?" },
      { by: 'a', opt: 'x', say: "Honestly? No idea. I closed my eyes for most of it." },
      { by: 'a', conf: "Nobody expected me to win that. Including me. Especially me." },
    ] },
    { id: 'rm.cm2', when: { mood: 'comedy' }, turns: [
      { by: 'a', say: "I'm back, and I've decided I'm a warrior now. Please call me warrior." },
      { by: 'x', opt: 1, say: "We're not calling you warrior." },
      { by: 'a', opt: 'x', say: "Then I'll call myself warrior. Out loud. All the time." },
      { by: 'a', conf: "I won an elimination. I'm going to be insufferable for at least a week, and I've earned it." },
    ] },
    { id: 'rm.cm3', when: { mood: 'comedy' }, turns: [
      { beat: '{a} comes in limping dramatically, then stops limping the second everybody looks.' },
      { by: 'x', opt: 1, say: "Were you just faking a limp?" },
      { by: 'a', opt: 'x', say: "I was being brave. There's a difference." },
      { by: 'a', conf: "I won an elimination and I can't stop smiling. Somebody should probably stop me. Nobody will." },
    ] },
    // ── happy ──
    { id: 'rm.hp1', when: { mood: 'happy' }, turns: [
      { beat: '{a} comes through the door, grinning, still covered in sand.' },
      { by: 'x', opt: 1, say: "You did it! You actually did it!" },
      { by: 'a', opt: 'x', say: "I did it! I can't feel my arms, but I did it!" },
      { by: 'a', conf: "I've never been so happy to see this house, and I didn't even like it yesterday." },
    ] },
    { id: 'rm.hp2', when: { mood: 'happy' }, turns: [
      { by: 'a', say: "I'm back! Did anybody save me dinner?" },
      { by: 'x', opt: 1, say: "We saved you everything." },
      { by: 'a', conf: "Walking back into this house after an Arena is the best feeling in the game. I want to remember it." },
    ] },
    { id: 'rm.hp3', when: { mood: 'happy' }, turns: [
      { beat: '{a} comes in singing, badly, and does not care who hears.' },
      { by: 'x', opt: 1, say: "We heard you from the driveway." },
      { by: 'a', opt: 'x', say: "Good! I want the whole island to hear!" },
      { by: 'a', conf: "One day you're the name everybody says at the vote, the next you're back in your bunk. I love this stupid game." },
    ] },
    { id: 'rm.hp4', when: { mood: 'happy' }, turns: [
      { by: 'a', say: "Group hug! Everybody! I don't care who voted for me!" },
      { by: 'b', opt: 1, say: "Even me?" },
      { by: 'a', opt: 'b', say: "Even you. Tonight. Tomorrow we'll talk." },
      { by: 'a', conf: "I'm too happy to hold a grudge tonight. Ask me again in the morning." },
    ] },
    { id: 'rm.hp5', when: { mood: 'happy' }, turns: [
      { beat: '{a} walks in and goes straight to bed without a word, still smiling.' },
      { by: 'x', opt: 1, say: "Is that it? No speech?" },
      { by: 'a', opt: 'x', say: "My speech is that I'm still here. Goodnight." },
      { by: 'a', conf: "I don't need to say anything. Me walking back through that door says it for me." },
    ] },
  ],
  // the revenge that needs the voter in the room (the faced return always has one)
  'return.faced': [
    { id: 'rm.rv2', when: { mood: 'revenge' }, turns: [
      { by: 'b', say: "Congratulations. Seriously." },
      { by: 'a', say: "Don't. Don't you dare congratulate me." },
      { by: 'b', say: "I'm just trying to be decent." },
      { by: 'a', say: "You weren't decent at the vote. Don't start now." },
      { beat: 'Somebody steps between them before it goes any further.' },
      { by: 'a', conf: "I was nice to every one of them, and they still put me in there. Fine. Nice is over." },
    ] },
  ],
};

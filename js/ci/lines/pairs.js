// Two people, one profile, and what they are to each other (ci/shared.js
// RELATIONS, picked by the author). Data only. The roles speaking:
//   face / brain     whose photos the profile shows / who runs strategy
//   older / younger  by age
//   parent / kid     a parent and child (the older one is the parent)
// Slots: {a.face} {a.brain} {a.older} {a.younger} {a.parent} {a.kid} are
// first names; {a.parentWord} is Mom or Dad, {a.kidWord} son or daughter;
// {a.olderSib} "big brother"/"big sister", {a.youngerSib} "little brother"/
// "little sister". They talk to each other in their own apartment: nobody
// outside hears any of it.
//   shared.argue.faceWins.<kind> / brainWins.<kind>: who won the argument
//   over the message (a parent and child: parentWins / kidWins)
//   life.pair.<kind>: the two of them, alone in the apartment
//   meet.explain.shared.<kind>: telling the finalist (b) who they really are
//   goodbye.pair.<kind>: both of them on the goodbye video
const P = (key, list) => ({ [key]: list.map((x, i) => ({ id: `${key}.${String(i + 1).padStart(2, '0')}`, ...x })) });

export const PAIR_LINES = {
  // ── a couple ─────────────────────────────────────────────────────────
  ...P('shared.argue.faceWins.couple', [
    { turns: [{ by: 'brain', say: "Babe. No. Read it again." }, { by: 'face', say: "I read it. It's cute. I'm sending it." }], beat: '{a.brain} kisses {a.face} on the head anyway.' },
    { turns: [{ by: 'face', say: "Trust me on this one. Like you trusted me on the couch." }, { by: 'brain', say: "The couch was a mistake." }, { by: 'face', say: "The couch is beautiful. Sending." }] },
    { stage: '{a.face} holds the remote out of reach.', turns: [{ by: 'brain', say: "This is why we can't play board games." }, { by: 'face', say: "This is why we WIN board games." }] },
  ]),
  ...P('shared.argue.brainWins.couple', [
    { turns: [{ by: 'face', say: "Fine. Your version. But I'm making dinner tonight and you're eating it." }, { by: 'brain', say: "Deal. Send mine." }] },
    { turns: [{ by: 'brain', say: "Love you. Not sending that." }, { by: 'face', say: "You always do this." }, { by: 'brain', say: "And I'm always right." }] },
    { turns: [{ by: 'brain', say: "Remember who planned our whole first date?" }, { by: 'face', say: "...Fine. Send yours." }] },
  ]),
  ...P('life.pair.couple', [
    { turns: [{ by: 'face', say: "Is it weird that this feels like a vacation? Just us, nobody we know." }, { by: 'brain', say: "A vacation where everybody's trying to kick us out." }], beat: '{a.face} and {a.brain} share one blanket on the couch.' },
    { turns: [{ by: 'brain', say: "You're stealing the covers again." }, { by: 'face', say: "I'm borrowing them. Long term." }], beat: 'The two of them fight over the duvet like it is a ratings night.' },
    { turns: [{ by: 'face', say: "We've never spent this much time together without a phone." }, { by: 'brain', say: "And we still like each other. That's a good sign." }] },
  ]),
  ...P('meet.explain.shared.couple', [
    { turns: [{ by: 'face', say: "Surprise! There were two of us the whole time. We're together." }, { by: 'b', react: "Together? Like, TOGETHER together?" }, { by: 'brain', say: "Every single message was a couples' argument first." }] },
    { turns: [{ by: 'brain', say: "Hi. I'm the other half. Literally." }, { by: 'b', react: "Wait. You're a couple? This whole time?" }, { by: 'face', say: "This whole time. You should have seen us fighting over emojis." }] },
    { turns: [{ by: 'face', say: "We're a couple. We came in as one profile to see if we could survive it." }, { by: 'b', react: "And?" }, { by: 'brain', say: "We're still together. Barely." }] },
  ]),
  ...P('goodbye.pair.couple', [
    { turns: [{ by: 'face', video: "Hi everybody. Surprise. There's two of us." }, { by: 'brain', video: "We're a couple. We argued about every single message. We're still together. Miracle." }] },
    { turns: [{ by: 'brain', video: "So, it was us. Both of us. We're together." }, { by: 'face', video: "We loved you all. Even the ones who blocked us. Especially them." }] },
    { turns: [{ by: 'face', video: "Meet the other half of the profile." }, { by: 'brain', video: "Hi. Yes, we're a couple. No, we didn't agree on anything." }] },
  ]),
  // ── married ──────────────────────────────────────────────────────────
  ...P('shared.argue.faceWins.married', [
    { turns: [{ by: 'brain', say: "In sickness and in health. Not in this message." }, { by: 'face', say: "Too late. I said I do and I'm saying send." }] },
    { turns: [{ by: 'face', say: "I've been married to you long enough to know when you're wrong." }, { by: 'brain', say: "And I've been married to you long enough to know you'll send it anyway." }] },
    { stage: '{a.face} grabs the remote; {a.brain} sighs like it has happened for years.', turns: [{ by: 'brain', say: "Twenty years of this." }, { by: 'face', say: "And you'd do twenty more." }] },
  ]),
  ...P('shared.argue.brainWins.married', [
    { turns: [{ by: 'face', say: "Fine. But I'm telling your mother you made me." }, { by: 'brain', say: "Tell her. She knows I'm right." }] },
    { turns: [{ by: 'brain', say: "Honey. Put the remote down." }, { by: 'face', say: "...Yes, dear." }], beat: '{a.face} hands over the remote with great ceremony.' },
    { turns: [{ by: 'brain', say: "Who handles the bills at home?" }, { by: 'face', say: "You do." }, { by: 'brain', say: "Then I handle this." }] },
  ]),
  ...P('life.pair.married', [
    { turns: [{ by: 'brain', say: "This is the most time we've spent alone together since our honeymoon." }, { by: 'face', say: "And look at us. Spending it on a TV." }], beat: '{a.face} and {a.brain} slow dance in the kitchen for no reason.' },
    { turns: [{ by: 'face', say: "You still snore, you know." }, { by: 'brain', say: "You still love it." }] },
    { turns: [{ by: 'brain', say: "Who do you think is watering our plants right now?" }, { by: 'face', say: "Nobody. They're gone. We'll get new ones." }] },
  ]),
  ...P('meet.explain.shared.married', [
    { turns: [{ by: 'face', say: "We should explain. We're married." }, { by: 'b', react: "MARRIED? Both of you were that profile?" }, { by: 'brain', say: "Married, playing as one. Most romantic thing we've ever done. Also the worst." }] },
    { turns: [{ by: 'brain', say: "Hi. I'm the spouse." }, { by: 'b', react: "The spouse? I'm so confused. I love it." }, { by: 'face', say: "Every message you got, two married people argued over first." }] },
    { turns: [{ by: 'face', say: "This is my spouse. You'll never guess who typed what." }, { by: 'b', react: "Oh my God. You two are married?" }, { by: 'brain', say: "For better or worse. Mostly worse, in here." }] },
  ]),
  ...P('goodbye.pair.married', [
    { turns: [{ by: 'face', video: "Hi, Circle. Surprise: we're married. Both of us. One profile." }, { by: 'brain', video: "We fought about every emoji. Marriage is about compromise. We did not compromise." }] },
    { turns: [{ by: 'brain', video: "Meet my spouse. We played this together." }, { by: 'face', video: "And now we go home, where nobody is going to believe any of this." }] },
    { turns: [{ by: 'face', video: "So it was us. A married couple. Thanks for loving our weird little profile." }, { by: 'brain', video: "Now we have to go home and pretend we're normal." }] },
  ]),
  // ── siblings ─────────────────────────────────────────────────────────
  ...P('shared.argue.faceWins.siblings', [
    { turns: [{ by: 'brain', say: "You've been doing this since we were ten." }, { by: 'face', say: "And I've been right since we were ten." }], beat: '{a.brain} throws a pillow at {a.face}.' },
    { turns: [{ by: 'face', say: "I'm sending it. You can tell Mom." }, { by: 'brain', say: "I WILL tell Mom." }] },
    { stage: '{a.face} and {a.brain} wrestle for the remote like it is the last cookie.', turns: [{ by: 'face', say: "Got it. Sent." }, { by: 'brain', say: "I hate you. Love you. Hate you." }] },
  ]),
  ...P('shared.argue.brainWins.siblings', [
    { turns: [{ by: 'brain', say: "Remember the last time you didn't listen to me? The car?" }, { by: 'face', say: "...Fine. We don't talk about the car." }] },
    { turns: [{ by: 'face', say: "Why do you always get your way?" }, { by: 'brain', say: "Because I'm the smart one. Ask anybody." }], beat: '{a.face} pulls a face at the back of {a.brain}\'s head.' },
    { turns: [{ by: 'brain', say: "Give me the remote or I tell everybody what you did at Grandma's." }, { by: 'face', say: "You wouldn't." }, { by: 'brain', say: "Watch me." }] },
  ]),
  ...P('life.pair.siblings', [
    { turns: [{ by: 'younger', say: "This is like sharing a room again. You still take all the space." }, { by: 'older', say: "I'm older. I earned the space." }], beat: '{a.older} and {a.younger} argue over who gets the good side of the couch.' },
    { turns: [{ by: 'older', say: "Who ate the last of the ice cream?" }, { by: 'younger', say: "Not me. I don't know her. I've never met ice cream." }] },
    { turns: [{ by: 'younger', say: "Remember when we used to play spies at home?" }, { by: 'older', say: "We're literally doing it now. On TV." }], beat: 'The two of them laugh until one of them snorts.' },
  ]),
  ...P('meet.explain.shared.siblings', [
    { turns: [{ by: 'older', say: "Okay, the truth. This is my {a.youngerSib}." }, { by: 'b', react: "You're SIBLINGS? I can see it now. I can totally see it." }, { by: 'younger', say: "We fought about everything. Like always." }] },
    { turns: [{ by: 'younger', say: "Meet my {a.olderSib}. We played together." }, { by: 'b', react: "That's why the messages felt like two people!" }, { by: 'older', say: "Two people who share a bathroom and a grudge." }] },
    { turns: [{ by: 'face', say: "We're siblings! Surprise!" }, { by: 'b', react: "Wait, are you serious?" }, { by: 'brain', say: "Same parents, same eyebrows, very different opinions on emojis." }] },
  ]),
  ...P('goodbye.pair.siblings', [
    { turns: [{ by: 'older', video: "Hi, everybody. It was me and my {a.youngerSib} the whole time." }, { by: 'younger', video: "We fought every single day. Best time of our lives." }] },
    { turns: [{ by: 'younger', video: "Surprise, it's two of us. My {a.olderSib} did all the bossing." }, { by: 'older', video: "And I'd do it again. Love you all." }] },
    { turns: [{ by: 'face', video: "Siblings! One profile! Two opinions on everything!" }, { by: 'brain', video: "Mom, if you're watching, it was mostly my fault. Mostly." }] },
  ]),
  // ── twins ────────────────────────────────────────────────────────────
  ...P('shared.argue.faceWins.twins', [
    { turns: [{ by: 'face', say: "We're sending the—" }, { by: 'brain', say: "—fire emoji. Yeah. I know. I was gonna say it." }] },
    { turns: [{ by: 'brain', say: "You're thinking it too." }, { by: 'face', say: "Obviously. Send." }], beat: '{a.face} and {a.brain} nod at exactly the same time.' },
    { turns: [{ by: 'face', say: "Twin brain says send." }, { by: 'brain', say: "Twin brain is a little nervous but okay." }] },
  ]),
  ...P('shared.argue.brainWins.twins', [
    { turns: [{ by: 'brain', say: "No. I know what you're about to type. Don't." }, { by: 'face', say: "How did you know?" }, { by: 'brain', say: "Same brain. Different haircut." }] },
    { turns: [{ by: 'face', say: "Why do we never agree on the one thing that matters?" }, { by: 'brain', say: "We agree on everything else. This one's mine." }] },
    { turns: [{ by: 'brain', say: "Coin flip?" }, { by: 'face', say: "We'll both call heads. We always call heads." }, { by: 'brain', say: "Then I'm just deciding. Mine." }, { by: 'face', say: "That's not how a coin flip works!" }] },
  ]),
  ...P('life.pair.twins', [
    { turns: [{ by: 'face', say: "Is it weird that I can't tell which of us is talking to the Circle anymore?" }, { by: 'brain', say: "That's the point. That's why it's working." }] },
    { turns: [{ by: 'brain', say: "We are the same person in two bodies, and both bodies want pizza." }, { by: 'face', say: "Order two. Different toppings. For the drama." }], beat: '{a.face} and {a.brain} say "pizza" at the same time and both groan.' },
    { turns: [{ by: 'face', say: "Remember when we switched places in school?" }, { by: 'brain', say: "We are literally doing that to a whole building right now." }] },
  ]),
  ...P('meet.explain.shared.twins', [
    { turns: [{ by: 'face', say: "Surprise. There's two of us." }, { by: 'b', react: "TWINS? Oh my God, there's TWO of you!" }, { by: 'brain', say: "That's why the voice never slipped. We sound the same." }] },
    { turns: [{ by: 'brain', say: "Hi. I'm also the profile." }, { by: 'b', react: "I'm seeing double. Am I seeing double?" }, { by: 'face', say: "Twins. We've been doing this our whole lives." }] },
    { turns: [{ by: 'face', say: "We're twins. We played as one, because honestly, we basically are one." }, { by: 'b', react: "That's the most twin thing I've ever heard." }, { by: 'brain', say: "Thank you. We'll take that." }] },
  ]),
  ...P('goodbye.pair.twins', [
    { turns: [{ by: 'face', video: "Hi, everybody!" }, { by: 'brain', video: "Hi, everybody! Yes. There's two of us. Twins." }] },
    { turns: [{ by: 'brain', video: "Plot twist: twins." }, { by: 'face', video: "We said everything at the same time anyway, so honestly you were talking to one person." }] },
    { turns: [{ by: 'face', video: "It was me." }, { by: 'brain', video: "And me. Twins. We loved every second. Good luck, Circle." }] },
  ]),
  // ── a parent and child ───────────────────────────────────────────────
  ...P('shared.argue.parentWins.parent', [
    { turns: [{ by: 'kid', say: "Nobody talks like that, {a.parentWord}." }, { by: 'parent', say: "I gave you life. I can give a message a period." }], beat: '{a.kid} slumps into the couch, defeated.' },
    { turns: [{ by: 'parent', say: "My apartment, my rules. Okay, the Circle's apartment. Still my rules." }, { by: 'kid', say: "It's not even your apartment." }, { by: 'parent', say: "Sending." }] },
    { turns: [{ by: 'kid', say: "Please don't use that emoji. Please. I'm begging." }, { by: 'parent', say: "It's a nice emoji. It's smiling." }, { by: 'kid', say: "That's not what it means anymore." }] },
  ]),
  ...P('shared.argue.kidWins.parent', [
    { turns: [{ by: 'kid', say: "{a.parentWord}, trust me. I know how people text now." }, { by: 'parent', say: "Fine. But if it goes badly, I'm grounding you." }, { by: 'kid', say: "I'm an adult." }, { by: 'parent', say: "Still grounding you." }] },
    { turns: [{ by: 'parent', say: "Okay. Your way. Show me what the kids are doing." }, { by: 'kid', say: "No capital letters. No periods. Trust the process." }] },
    { turns: [{ by: 'kid', say: "Give me the remote. Remember the group chat at Thanksgiving?" }, { by: 'parent', say: "...Here. Take it." }], beat: '{a.parent} hands it over, muttering.' },
  ]),
  ...P('life.pair.parent', [
    { turns: [{ by: 'parent', say: "When did you get so good at this?" }, { by: 'kid', say: "I learned from the best." }, { by: 'parent', say: "Me?" }, { by: 'kid', say: "The internet. But also you." }] },
    { turns: [{ by: 'kid', say: "{a.parentWord}, you can't fold my clothes on national television." }, { by: 'parent', say: "Watch me." }], beat: '{a.parent} folds every shirt in the apartment, perfectly.' },
    { turns: [{ by: 'parent', say: "I didn't think I'd ever get this much time with you again. Grown up and everything." }, { by: 'kid', say: "Don't make me cry in the Circle." }], beat: 'They hug for a long time.' },
  ]),
  ...P('meet.explain.shared.parent', [
    { turns: [{ by: 'kid', say: "Okay. Big reveal. That's my {a.parentWord}." }, { by: 'b', react: "Your {a.parentWord}? I've been talking to your {a.parentWord} this whole time?" }, { by: 'parent', say: "And I enjoyed every minute." }] },
    { turns: [{ by: 'parent', say: "Hi. I'm the parent. I typed the polite ones." }, { by: 'b', react: "A parent and their kid? That's amazing!" }, { by: 'kid', say: "I typed the ones that sounded cool." }] },
    { turns: [{ by: 'parent', say: "We should tell you. This is my {a.kidWord}." }, { by: 'b', react: "A {a.kidWord} and a parent? That explains SO much." }, { by: 'kid', say: "Every single message, a negotiation." }] },
  ]),
  ...P('goodbye.pair.parent', [
    { turns: [{ by: 'kid', video: "Hi, everybody. Surprise. This is my {a.parentWord}." }, { by: 'parent', video: "Hi! I hope you all liked the polite messages. Those were me." }] },
    { turns: [{ by: 'parent', video: "My {a.kidWord} and I played this together. It was the best time I've had in years." }, { by: 'kid', video: "Don't get emotional. Okay, get a little emotional." }] },
    { turns: [{ by: 'kid', video: "We're a parent and kid. Yes. We fought about punctuation for days." }, { by: 'parent', video: "And I was right about the periods." }] },
  ]),
  // ── best friends ─────────────────────────────────────────────────────
  ...P('shared.argue.faceWins.friends', [
    { turns: [{ by: 'brain', say: "As your best friend, I'm telling you, don't." }, { by: 'face', say: "As your best friend, I'm telling you, watch this." }] },
    { turns: [{ by: 'face', say: "Ride or die, right?" }, { by: 'brain', say: "Ride or die. But mostly die if this goes wrong." }] },
    { stage: '{a.face} is already typing; {a.brain} covers both eyes.', turns: [{ by: 'brain', say: "I'm not looking. I can't look." }, { by: 'face', say: "Sent!" }] },
  ]),
  ...P('shared.argue.brainWins.friends', [
    { turns: [{ by: 'face', say: "Okay. You've never steered me wrong." }, { by: 'brain', say: "Except that one time." }, { by: 'face', say: "We agreed never to talk about that one time." }] },
    { turns: [{ by: 'brain', say: "Bestie. Hand me the remote." }, { by: 'face', say: "...Fine. But I'm picking the movie tonight." }] },
    { turns: [{ by: 'brain', say: "Remember college? Remember what happened when you sent the text?" }, { by: 'face', say: "Okay, okay. Your version." }] },
  ]),
  ...P('life.pair.friends', [
    { turns: [{ by: 'face', say: "This is the longest sleepover of our lives." }, { by: 'brain', say: "And somehow we haven't killed each other." }], beat: '{a.face} and {a.brain} build a blanket fort out of couch cushions.' },
    { turns: [{ by: 'brain', say: "If one of us gets blocked, we both get blocked. That's kind of romantic." }, { by: 'face', say: "That's the most best-friend thing you've ever said." }] },
    { turns: [{ by: 'face', say: "Truth or dare?" }, { by: 'brain', say: "We're in the Circle. Every day is a dare." }] },
  ]),
  ...P('meet.explain.shared.friends', [
    { turns: [{ by: 'face', say: "Okay, so. We're best friends. We played together." }, { by: 'b', react: "BEST FRIENDS? This whole time, two of you?" }, { by: 'brain', say: "Two of us, one couch, a lot of snacks." }] },
    { turns: [{ by: 'brain', say: "Hi! I'm the best friend." }, { by: 'b', react: "That's adorable. I'm actually kind of jealous." }, { by: 'face', say: "We've been friends since we were kids. This was our dream." }] },
    { turns: [{ by: 'face', say: "We're besties. We wanted to do this together or not at all." }, { by: 'b', react: "Together, then. That's so sweet." }] },
  ]),
  ...P('goodbye.pair.friends', [
    { turns: [{ by: 'face', video: "Hi, Circle! It was us. Best friends." }, { by: 'brain', video: "We did it together and we'd do it again. Love you guys." }] },
    { turns: [{ by: 'brain', video: "Meet my best friend. The other half of our profile." }, { by: 'face', video: "Best sleepover ever. Worst ratings ever. Good luck!" }] },
    { turns: [{ by: 'face', video: "Two best friends. One profile. Zero regrets." }, { by: 'brain', video: "Some regrets. A few. Mostly the emojis." }] },
  ]),
  // ── cousins ──────────────────────────────────────────────────────────
  ...P('shared.argue.faceWins.cousins', [
    { turns: [{ by: 'brain', say: "This is exactly what you did at the family reunion." }, { by: 'face', say: "And the family reunion LOVED it." }] },
    { turns: [{ by: 'face', say: "Grandma would send this." }, { by: 'brain', say: "Grandma would not send this." }, { by: 'face', say: "Grandma is sending this." }] },
    { stage: '{a.face} grabs the remote before {a.brain} can.', turns: [{ by: 'brain', say: "I'm telling everybody at Thanksgiving." }, { by: 'face', say: "Tell them. They'll be proud." }] },
  ]),
  ...P('shared.argue.brainWins.cousins', [
    { turns: [{ by: 'brain', say: "Remember who got us out of trouble every summer?" }, { by: 'face', say: "You did." }, { by: 'brain', say: "Then trust me now." }] },
    { turns: [{ by: 'face', say: "Fine. You were always the smart cousin." }, { by: 'brain', say: "I was always the only cousin who read the instructions." }] },
    { turns: [{ by: 'brain', say: "Hand it over. Family meeting. You lost." }, { by: 'face', say: "This isn't a family meeting." }, { by: 'brain', say: "Everything is a family meeting." }] },
  ]),
  ...P('life.pair.cousins', [
    { turns: [{ by: 'face', say: "This is like every summer at Grandma's, but with cameras." }, { by: 'brain', say: "And worse snacks." }], beat: '{a.face} and {a.brain} play cards on the floor like they are ten again.' },
    { turns: [{ by: 'brain', say: "The whole family is watching this. The WHOLE family." }, { by: 'face', say: "Our aunts have a group chat about us right now. I guarantee it." }] },
    { turns: [{ by: 'face', say: "Remember when we got stuck on the roof?" }, { by: 'brain', say: "We are not telling that story on TV." }] },
  ]),
  ...P('meet.explain.shared.cousins', [
    { turns: [{ by: 'face', say: "Okay, we're cousins. Surprise!" }, { by: 'b', react: "Cousins? That's so random. I love it." }, { by: 'brain', say: "Our grandma made us promise to do this together." }] },
    { turns: [{ by: 'brain', say: "Hi. Cousin. Other half of the profile." }, { by: 'b', react: "Oh my God, there's two of you and you're related?" }, { by: 'face', say: "Grew up together every summer. This felt like one more." }] },
    { turns: [{ by: 'face', say: "We're cousins, and this is the best family vacation we've ever had." }, { by: 'b', react: "Family vacation. In the Circle. You two are something else." }] },
  ]),
  ...P('goodbye.pair.cousins', [
    { turns: [{ by: 'face', video: "Hi, everybody! It was us. Cousins." }, { by: 'brain', video: "Hi, Grandma. Yes, we behaved. Mostly." }] },
    { turns: [{ by: 'brain', video: "Two cousins, one profile, a lot of arguing." }, { by: 'face', video: "We'll see you all at the next family reunion. Kidding. Good luck!" }] },
    { turns: [{ by: 'face', video: "Surprise! There's two of us, and we're related." }, { by: 'brain', video: "The whole family is watching. Hi, family." }] },
  ]),
};

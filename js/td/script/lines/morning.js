// ══════════════════════════════════════════════════════════════════════
// td/script/lines/morning.js — the finale's last morning at camp (finale.js
// generateFinaleCampOverride)
// ══════════════════════════════════════════════════════════════════════
//
//   morning.open.any     a and b wake up on the last day
//   morning.reflect.any  a looks back alone. reason: plotter (ran the numbers), people
//                        (made friends), champ (won challenges), survivor (dodged votes),
//                        loyal (kept promises), plain; restless (hot temper), cocky (bold)
//   morning.bond.any     a and b, the closest pair left. reason: close | truce
//   morning.rival.any    a and b, the worst pair left
//   morning.close.any    a and b walk out of camp for the last time
//
// Ids: 'mo.'.

const OPEN = [
  { id: 'mo.o1', turns: [
    { beat: 'Nobody relit the fire overnight. {a} pokes at the ashes anyway.' },
    { by: 'b', say: "Leave it. We're not coming back here." },
    { by: 'a', say: "I know. That's why I'm poking it." },
  ] },
  { id: 'mo.o2', turns: [
    { by: 'a', say: "Is it weird that it's so quiet?" },
    { by: 'b', say: "There's nobody left to be loud." },
    { by: 'a', conf: "I spent weeks wishing everyone would shut up. Now I miss them." },
  ] },
  { id: 'mo.o3', turns: [
    { by: 'b', say: "Last day." },
    { by: 'a', say: "Last day." },
    { beat: 'Neither of them gets up for a while.' },
    { by: 'b', conf: "One of us leaves with everything today. The other one leaves with a sunburn." },
  ] },
  { id: 'mo.o4', turns: [
    { by: 'a', say: "Did you sleep?" },
    { by: 'b', say: "Not even a little. You?" },
    { by: 'a', say: "I dreamt I lost. Twice." },
  ] },
  { id: 'mo.o5', turns: [
    { beat: 'Breakfast is whatever is left. {a} splits it with {b} without asking.' },
    { by: 'b', say: "You're being nice to me on the last day?" },
    { by: 'a', say: "It's free. Being nice is free today." },
  ] },
  { id: 'mo.o6', turns: [
    { by: 'b', say: "Look how many empty spots there are." },
    { by: 'a', say: "I remember who sat in every single one." },
    { by: 'b', conf: "We started with a full camp. Now it's us and a lot of empty space." },
  ] },
  { id: 'mo.o7', when: { band: 'enemies' }, turns: [
    { by: 'a', say: "Morning." },
    { by: 'b', say: "Don't." },
    { by: 'a', conf: "Even today. Even on the last day. Fine." },
  ] },
  { id: 'mo.o8', when: { band: 'friends' }, turns: [
    { by: 'a', say: "Promise me something. Whatever happens, we still talk after this." },
    { by: 'b', say: "Obviously. Who else would understand any of it?" },
  ] },
];

const REFLECT = [
  { id: 'mo.r1', turns: [
    { beat: '{a} sits alone by the cold fire.' },
    { by: 'a', conf: "I keep thinking about day one. I had no idea what I was doing. I still don't, a little. But I'm here." },
  ] },
  { id: 'mo.r2', turns: [
    { by: 'a', conf: "Everybody who left thought they had a plan. Some of them had good plans. I'm the one still standing, so I guess mine was better." },
  ] },
  { id: 'mo.r3', turns: [
    { beat: '{a} walks one slow lap around camp.' },
    { by: 'a', conf: "I'm saying goodbye to everything. The fire. The log I always sat on. The spot where I cried that one time. That spot especially." },
  ] },
  { id: 'mo.r4', turns: [
    { by: 'a', conf: "Today I find out if it was enough. Every vote, every challenge, every bad night. One more day." },
  ] },
  { id: 'mo.r5', turns: [
    { by: 'a', conf: "My stomach hurts. Is that nerves? Or is it the fish? Honestly, at this point, it could be the fish." },
  ] },
  { id: 'mo.r6', turns: [
    { beat: '{a} packs everything into one bag. It does not take long.' },
    { by: 'a', conf: "I came here with a full bag and a lot of opinions. I'm leaving with half a bag and even more opinions." },
  ] },
  // plotter — ran the numbers
  { id: 'mo.r7', when: { reason: 'plotter' }, turns: [
    { by: 'a', conf: "I went through every vote this morning. Every one. There isn't a boot in this game I didn't see coming or cause. I made this happen. Today I finish it." },
  ] },
  { id: 'mo.r8', when: { reason: 'plotter' }, turns: [
    { beat: '{a} draws lines in the dirt with a stick: names, arrows, crossed-out names.' },
    { by: 'a', conf: "This is the whole season. Every one of these crosses, I had a hand in. I'd like the jury to see it like this." },
  ] },
  { id: 'mo.r9', when: { reason: 'plotter' }, turns: [
    { by: 'a', conf: "People played with their hearts. I played with a plan. Today we find out which one wins." },
  ] },
  // people — made friends
  { id: 'mo.r10', when: { reason: 'people' }, turns: [
    { beat: '{a} walks past the fire where every real conversation happened.' },
    { by: 'a', conf: "I'm going to miss this place. Not the game. The people." },
  ] },
  { id: 'mo.r11', when: { reason: 'people' }, turns: [
    { by: 'a', conf: "I talked to every single person who played this game. I know their families' names. Their dogs' names. That has to count for something." },
  ] },
  { id: 'mo.r12', when: { reason: 'people' }, turns: [
    { by: 'a', conf: "Everybody who's on that jury, I made them laugh at least once. I hope they remember that part." },
  ] },
  // champ — won challenges
  { id: 'mo.r13', when: { reason: 'champ' }, turns: [
    { beat: '{a} stretches out sore arms and stares off toward the challenge course.' },
    { by: 'a', conf: "My wins got me here. One more. That's all I need. One more." },
  ] },
  { id: 'mo.r14', when: { reason: 'champ' }, turns: [
    { by: 'a', conf: "Every time they wanted me gone, I won the necklace. Every single time. They never got their shot." },
  ] },
  { id: 'mo.r15', when: { reason: 'champ' }, turns: [
    { by: 'a', conf: "I've got bruises on my bruises. Worth it. Every single one." },
  ] },
  // survivor — dodged vote after vote
  { id: 'mo.r16', when: { reason: 'survivor' }, turns: [
    { beat: '{a} looks at the empty spots around the fire.' },
    { by: 'a', conf: "They came for me again and again. They tried everything. I'm still here." },
  ] },
  { id: 'mo.r17', when: { reason: 'survivor' }, turns: [
    { by: 'a', conf: "I've had my name written down more times than anyone left. Write it again. I dare you." },
  ] },
  { id: 'mo.r18', when: { reason: 'survivor' }, turns: [
    { by: 'a', conf: "Nobody thought I'd last a week. I wrote down who said that. Most of them are on the jury now." },
  ] },
  // loyal — kept promises
  { id: 'mo.r19', when: { reason: 'loyal' }, turns: [
    { by: 'a', conf: "I kept my promises. Most of them. The ones that mattered." },
  ] },
  { id: 'mo.r20', when: { reason: 'loyal' }, turns: [
    { by: 'a', conf: "I can look every person on that jury in the eye. Not everybody left in this game can say that." },
  ] },
  { id: 'mo.r21', when: { reason: 'loyal' }, turns: [
    { by: 'a', conf: "I stuck with my people until there were no people left to stick with. My mom is going to be so proud. Or so mad. One of those." },
  ] },
  // plain — never thought they'd get here
  { id: 'mo.r22', when: { reason: 'plain' }, turns: [
    { by: 'a', conf: "I never thought I'd make it this far. But I did. And today I find out if it was enough." },
  ] },
  { id: 'mo.r23', when: { reason: 'plain' }, turns: [
    { by: 'a', conf: "Nobody saw me coming. Honestly? I didn't see me coming either." },
  ] },
  { id: 'mo.r24', when: { reason: 'plain' }, turns: [
    { by: 'a', conf: "I wasn't the strongest or the smartest. I was just still here every morning. Turns out that's a lot." },
  ] },
  // restless — a hot temper
  { id: 'mo.r25', when: { reason: 'restless' }, turns: [
    { beat: '{a} has been pacing since sunrise.' },
    { by: 'a', conf: "I can't just sit here. I need this to start. Where is everybody? Why is nobody hurrying?" },
  ] },
  { id: 'mo.r26', when: { reason: 'restless' }, turns: [
    { by: 'a', conf: "If one more person tells me to relax, I'm throwing them in the fire. The cold fire. It's the thought that counts." },
  ] },
  { id: 'mo.r27', when: { reason: 'restless' }, turns: [
    { by: 'a', conf: "I've been up since four. I've re-packed my bag three times. I'm FINE." },
  ] },
  // cocky — bold
  { id: 'mo.r28', when: { reason: 'cocky' }, turns: [
    { by: 'a', conf: "I outplayed all of them. The only question is whether the jury is honest enough to admit it." },
  ] },
  { id: 'mo.r29', when: { reason: 'cocky' }, turns: [
    { by: 'a', conf: "I already know what I'm going to buy with the money. Is that bad luck? I don't believe in luck." },
  ] },
  { id: 'mo.r30', when: { reason: 'cocky' }, turns: [
    { beat: '{a} is grinning at the sunrise like it owes {a.obj} money.' },
    { by: 'a', conf: "Big day. My day." },
  ] },
];

const BOND = [
  { id: 'mo.b1', turns: [
    { by: 'a', say: "Whatever happens today, we did this together." },
    { by: 'b', say: "We did." },
    { by: 'b', conf: "In a few hours, we're going to be trying to beat each other. Neither of us is going to bring that up." },
  ] },
  { id: 'mo.b2', turns: [
    { by: 'b', say: "Remember the first night? You told me I snored." },
    { by: 'a', say: "You DID snore." },
    { by: 'b', say: "I still do." },
    { by: 'a', say: "I know. I'm going to miss it." },
  ] },
  { id: 'mo.b3', turns: [
    { by: 'a', say: "If it's not me, I hope it's you." },
    { by: 'b', say: "Same. But I really hope it's me." },
    { by: 'a', say: "Yeah. Me too." },
  ] },
  { id: 'mo.b4', when: { reason: 'close' }, turns: [
    { beat: '{a} and {b} sit shoulder to shoulder and watch the sun come up.' },
    { by: 'a', say: "I couldn't have done this without you." },
    { by: 'b', say: "You could have. You'd have just been really bored." },
  ] },
  { id: 'mo.b5', when: { reason: 'close' }, turns: [
    { by: 'b', say: "Is it okay that I'm sad? We made it. Why am I sad?" },
    { by: 'a', say: "Because after today it's over. Come here." },
    { beat: '{a} pulls {b} into a hug and doesn\'t let go for a while.' },
  ] },
  { id: 'mo.b6', when: { reason: 'truce' }, turns: [
    { by: 'a', say: "We were never really allies, huh?" },
    { by: 'b', say: "Never really enemies, either." },
    { by: 'a', say: "Good luck today." },
    { by: 'b', say: "You too. I mean it." },
  ] },
  { id: 'mo.b7', when: { reason: 'truce' }, turns: [
    { by: 'b', say: "Want the last of the coconut?" },
    { by: 'a', say: "Are you trying to poison me?" },
    { by: 'b', say: "Not today." },
    { by: 'a', conf: "{b} and I never had a deal. We just never voted for each other. Out here, that's practically a friendship." },
  ] },
];

const RIVAL = [
  { id: 'mo.v1', turns: [
    { beat: '{a} and {b} eat on opposite sides of the fire. Neither looks up.' },
    { by: 'a', conf: "We haven't spoken in days. I don't plan on starting today." },
  ] },
  { id: 'mo.v2', turns: [
    { by: 'b', say: "Enjoy your last morning." },
    { by: 'a', say: "Funny. I was going to say that to you." },
  ] },
  { id: 'mo.v3', turns: [
    { by: 'a', say: "You know you can't beat me, right?" },
    { by: 'b', say: "You've said that every week. I'm still here." },
    { by: 'a', say: "Not after today." },
  ] },
  { id: 'mo.v4', turns: [
    { beat: '{a} catches {b}\'s eye across camp. Nobody says anything.' },
    { by: 'b', conf: "One of us is about to end the other one's game. For good. I hope it's me." },
  ] },
  { id: 'mo.v5', turns: [
    { by: 'b', say: "Did you take my bag?" },
    { by: 'a', say: "Why would I want your bag?" },
    { by: 'b', say: "Why would you do half the stuff you did?" },
  ] },
  { id: 'mo.v6', turns: [
    { by: 'a', conf: "The jury's going to have to pick between me and {b}. That should be easy. For them. And for me, watching." },
    { by: 'b', conf: "{a} thinks the jury loves {a.obj}. The jury voted {a.obj} out of their hearts weeks ago." },
  ] },
];

const CLOSE = [
  { id: 'mo.c1', turns: [
    { by: 'a', say: "That's it. That's the last camp." },
    { beat: '{a} pours water over what is left of the fire. The smoke goes straight up.' },
    { by: 'b', say: "Let's go." },
  ] },
  { id: 'mo.c2', turns: [
    { beat: 'They walk out of camp in single file.' },
    { by: 'b', say: "Don't look back." },
    { by: 'a', say: "I wasn't going to." },
    { beat: '{a} looks back.' },
  ] },
  { id: 'mo.c3', turns: [
    { by: 'a', say: "Last meal. Last conversation. Last everything." },
    { by: 'b', say: "Last time anybody makes me sleep on the ground." },
    { by: 'a', say: "That part I won't miss." },
  ] },
  { id: 'mo.c4', turns: [
    { by: 'b', say: "Everything we did here, it all comes down to the next few hours." },
    { by: 'a', say: "Then let's not keep it waiting." },
  ] },
  { id: 'mo.c5', turns: [
    { beat: '{a} picks up a torch and holds it a second longer than needed.' },
    { by: 'a', say: "It's time." },
    { by: 'b', say: "Yeah. It's time." },
  ] },
  { id: 'mo.c6', turns: [
    { by: 'a', say: "Should we say something? Like a speech?" },
    { by: 'b', say: "To who? The fire pit?" },
    { by: 'a', say: "Goodbye, fire pit." },
    { by: 'b', say: "...Goodbye, fire pit." },
  ] },
];

export default {
  'morning.open.any': OPEN, 'morning.reflect.any': REFLECT, 'morning.bond.any': BOND,
  'morning.rival.any': RIVAL, 'morning.close.any': CLOSE,
};

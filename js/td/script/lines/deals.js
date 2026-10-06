// ══════════════════════════════════════════════════════════════════════
// td/script/lines/deals.js — side deals (camp-events.js SIDE DEALS)
// ══════════════════════════════════════════════════════════════════════
//
// deal.side.genuine — {a} offers {b} a final {size}, and means it.
// deal.side.hollow  — {a} offers it and does not mean it. Only {a}'s
//                     confessional says so: {b} never hears it.
// {size} is 'two' or 'three'. A final three has no third yet, so "you and me"
// lines are final-two only. Ids: 'sd.'.
//
// The voice (spec §5.1): something going on under the scene, a real reason
// ({rival}, {threat}, {weak}, {friend}, {lastBoot} — only when the scene names
// one), pushback, attitude in the speaker's own plain words, real idioms, and a
// confessional that lands one thought.
const TWO = { size: 'two' }, THREE = { size: 'three' };

const GENUINE = [
  { id: 'sd.a1', when: TWO, turns: [
    { beat: '{b} is trying to nap in the shade. {a} sits down right next to {b.obj}.' },
    { by: 'a', say: "Are you awake? Good. Who are you taking to the end?" },
    { by: 'b', say: "I was asleep, actually. And I don't know. Nobody yet." },
    { by: 'a', say: "Wrong answer. Me. You're taking me." },
    { by: 'b', say: "Is that a question or an order?" },
    { by: 'a', say: "It's a deal. Final two. Yes or no?" },
    { by: 'b', say: "...Fine. Yes. Can I go back to sleep now?" },
  ] },
  { id: 'sd.a2', turns: [
    { beat: '{a} and {b} are out collecting firewood, and {a} keeps checking nobody followed them.' },
    { by: 'a', say: "Okay, nobody's coming. Can I be real with you?" },
    { by: 'b', say: "You're going to be real with me either way." },
    { by: 'a', say: "Everyone here is already pairing up. I don't want to be the last one picked." },
    { by: 'b', say: "So you picked me? Out of everyone?" },
    { by: 'a', say: "Out of everyone. Final {size}. We look out for each other." },
    { by: 'b', say: "Okay. But you're carrying the heavy ones." },
  ] },
  { id: 'sd.a3', when: { rival: true }, turns: [
    { by: 'a', say: "Has {rival} been giving you a hard time too, or is it just me?" },
    { by: 'b', say: "Mostly you, honestly. {rival} can't stand you." },
    { by: 'a', say: "The feeling's mutual. Which is why I need someone on my side." },
    { by: 'b', say: "And that's me?" },
    { by: 'a', say: "Final {size}. If {rival} comes after me, you've got my back. If anyone comes after you, I've got yours." },
    { by: 'b', say: "...Okay. You've got a deal." },
  ] },
  { id: 'sd.a4', when: { threat: true }, turns: [
    { by: 'a', say: "Have you seen {threat} in the challenges? It's like competing against a machine." },
    { by: 'b', say: "Yeah, it's a bit much." },
    { by: 'a', say: "At some point somebody has to take {threat} out, and I'd rather not do it alone." },
    { by: 'b', say: "Are you asking me to team up?" },
    { by: 'a', say: "Final {size}. We stick together, and when the time's right, we go for the big target." },
    { by: 'b', say: "Fine. But I'm not saying {threat}'s name first." },
  ] },
  { id: 'sd.a5', when: { lastBoot: true }, turns: [
    { by: 'b', say: "I still can't believe {lastBoot} is gone." },
    { by: 'a', say: "That's exactly my point. Nobody saw it coming. Next time it could be you. Or me." },
    { by: 'b', say: "Thanks. That's comforting." },
    { by: 'a', say: "Then let me make it better. Final {size}. We don't let it happen to each other." },
    { by: 'b', say: "You've been waiting all day to say that, haven't you?" },
    { by: 'a', say: "Since breakfast. Is that a yes?" },
    { by: 'b', say: "It's a yes." },
  ] },
  { id: 'sd.a6', when: { register: 'fiery' }, turns: [
    { by: 'a', say: "Okay, I'm terrible at sneaking around, so I'm just going to ask. Final {size}. You and me." },
    { by: 'b', say: "Shh! Are you trying to tell the whole camp?" },
    { by: 'a', say: "Oops. Sorry. Final {size}. Quietly." },
    { by: 'b', say: "You're a nightmare, you know that?" },
    { by: 'a', say: "Is that a yes?" },
    { by: 'b', say: "It's a yes. Just stop shouting." },
  ] },
  { id: 'sd.a7', when: { register: 'shy' }, turns: [
    { beat: '{a} hovers next to {b} for a while before saying anything.' },
    { by: 'b', say: "Are you okay? You've been standing there for a minute." },
    { by: 'a', say: "Sorry. I wanted to ask you something, and I didn't know how." },
    { by: 'b', say: "Just say it." },
    { by: 'a', say: "Would you ever want to make a deal? Like, a final {size}? You can say no." },
    { by: 'b', say: "I'm not going to say no. Of course I will." },
    { by: 'a', say: "Really? Okay. Wow. Okay." },
  ] },
  { id: 'sd.a8', when: { register: 'schemer' }, turns: [
    { by: 'a', say: "Let's be honest. Half the people here can barely tie their shoes." },
    { by: 'b', say: "That's a bit harsh." },
    { by: 'a', say: "Harsh, but true. You're one of the few who actually thinks. So do I." },
    { by: 'b', say: "And?" },
    { by: 'a', say: "And people who think should stick together. Final {size}." },
    { by: 'b', say: "And what happens when you decide you don't need me anymore?" },
    { by: 'a', say: "Then I'll let you know. Until then, we're a team." },
  ] },
  { id: 'sd.a9', when: { register: 'sweet' }, turns: [
    { by: 'a', say: "Can I tell you something? You're the only person here I'd actually want to be friends with after this." },
    { by: 'b', say: "Aww. Me too, honestly." },
    { by: 'a', say: "So let's make it official. Final {size}. Friends first, game second." },
    { by: 'b', say: "Friends first, game second. I like that." },
    { beat: '{a} pulls {b} into a hug.' },
  ] },
  { id: 'sd.a10', when: { band: 'neutral' }, turns: [
    { by: 'a', say: "We barely talk, do you realise that?" },
    { by: 'b', say: "I hadn't really noticed." },
    { by: 'a', say: "Neither has anyone else. That's what makes it perfect." },
    { by: 'b', say: "Makes what perfect?" },
    { by: 'a', say: "A final {size}. Nobody would ever put us together. They'll never see it coming." },
    { by: 'b', say: "That's actually kind of smart." },
    { by: 'a', say: "I have my moments." },
  ] },
  { id: 'sd.a11', when: { spot: 'dock' }, turns: [
    { beat: '{b} is fishing off the end of the dock. Nothing is biting. {a} sits down beside {b.obj}.' },
    { by: 'a', say: "Catch anything?" },
    { by: 'b', say: "A sock. Twice." },
    { by: 'a', say: "Well, I've got a better offer than a sock. Final {size}. You and me." },
    { by: 'b', say: "Why me?" },
    { by: 'a', say: "Because you're out here fishing for socks instead of plotting. I trust that." },
    { by: 'b', say: "...Okay. Deal." },
  ] },
  { id: 'sd.a12', when: { spot: 'mess-hall' }, turns: [
    { beat: '{a} slides a tray across the table to {b}.' },
    { by: 'b', say: "What's this?" },
    { by: 'a', say: "My pudding. Well, Chef calls it pudding." },
    { by: 'b', say: "Okay, now I'm suspicious. What do you want?" },
    { by: 'a', say: "A final {size}. And you can keep the pudding either way." },
    { by: 'b', say: "I'll take the deal. You can keep the pudding." },
  ] },
  { id: 'sd.a13', when: { ...THREE, friend: true }, turns: [
    { by: 'a', say: "Me, you and {friend}. Final three. Think about it." },
    { by: 'b', say: "Does {friend} know about this?" },
    { by: 'a', say: "Not yet. I wanted you first." },
    { by: 'b', say: "Why me first?" },
    { by: 'a', say: "Because if you say no, there's no point asking {friend}." },
    { by: 'b', say: "Fine. I'm in. You talk to {friend}." },
  ] },
  { id: 'sd.a14', when: THREE, turns: [
    { by: 'a', say: "I want a final three, and I want you in it." },
    { by: 'b', say: "Who's the third?" },
    { by: 'a', say: "I haven't decided yet. We'll pick together." },
    { by: 'b', say: "So it's a final three with two people in it." },
    { by: 'a', say: "For now. Are you in or not?" },
    { by: 'b', say: "I'm in. But I get a say on the third." },
  ] },
  { id: 'sd.a15', when: { weak: true, merged: false }, turns: [
    { by: 'a', say: "If we lose again, it's going to be {weak}, right?" },
    { by: 'b', say: "Probably. {weak} hasn't won us a single thing." },
    { by: 'a', say: "Right. But after {weak}, it gets messy. I don't want to be on the wrong side of messy." },
    { by: 'b', say: "So what do you want?" },
    { by: 'a', say: "A final {size}, with the two of us in it, whatever happens after {weak}." },
    { by: 'b', say: "Deal." },
  ] },
  { id: 'sd.a16', turns: [
    { beat: '{a} drops down next to {b} at the edge of camp.' },
    { by: 'a', say: "Can I ask you something without you making it weird?" },
    { by: 'b', say: "No promises." },
    { by: 'a', say: "If it came down to the end, would you want me there?" },
    { by: 'b', say: "...Maybe. Why?" },
    { by: 'a', say: "Because I'd want you there. Final {size}. Let's make it real." },
    { by: 'b', say: "Okay. Yeah. Let's make it real." },
  ] },
  { id: 'sd.a17', turns: [
    { by: 'b', say: "Why are you following me?" },
    { by: 'a', say: "I'm not following you. I'm walking in the same direction as you." },
    { by: 'b', say: "Right behind me." },
    { by: 'a', say: "Okay, fine. I want a final {size}. With you." },
    { by: 'b', say: "You could've just asked." },
    { by: 'a', say: "I'm asking now." },
    { by: 'b', say: "Then yes." },
  ] },
];

// {a} does not mean it. Only the confessional says so.
const HOLLOW = [
  { id: 'sd.h1', when: TWO, turns: [
    { beat: '{a} catches up with {b} on the walk back to camp.' },
    { by: 'a', say: "You and me. Final two. I've been thinking about it all day." },
    { by: 'b', say: "Seriously? All day?" },
    { by: 'a', say: "All day. You're the only one here I trust." },
    { by: 'b', say: "Okay. Yeah. Final two." },
    { by: 'a', conf: "I've thought about it for maybe five minutes. But I need {b}'s vote, and now I've got it." },
  ] },
  { id: 'sd.h2', turns: [
    { by: 'a', say: "I'll be honest. I'd trust you with my life out here." },
    { by: 'b', say: "That's a lot." },
    { by: 'a', say: "I mean it. Final {size}?" },
    { by: 'b', say: "...Okay. Final {size}." },
    { by: 'a', conf: "Would I trust {b} with my life? I wouldn't trust {b} with my toothbrush. But {b} doesn't need to know that." },
  ] },
  { id: 'sd.h3', when: { rival: true }, turns: [
    { by: 'a', say: "You know {rival} is out to get me, right?" },
    { by: 'b', say: "I've heard." },
    { by: 'a', say: "So I need someone I can count on. Final {size}. Please?" },
    { by: 'b', say: "Okay, okay. Final {size}." },
    { by: 'a', conf: "I don't need {b} to the end. I need {b} until {rival} is gone. After that, we'll see." },
  ] },
  { id: 'sd.h4', when: { register: 'schemer' }, turns: [
    { by: 'a', say: "Between you and me, you're the only person here with half a brain." },
    { by: 'b', say: "Wow. Thanks?" },
    { by: 'a', say: "It's a compliment. Final {size}. You and I run this place." },
    { by: 'b', say: "Fine. Final {size}." },
    { by: 'a', conf: "Half a brain is generous. But {b} said yes, and that's all I needed." },
  ] },
  { id: 'sd.h5', turns: [
    { by: 'b', say: "Wait, so we're actually doing this? A final {size}?" },
    { by: 'a', say: "We're actually doing this." },
    { by: 'b', say: "Promise?" },
    { by: 'a', say: "Promise." },
    { beat: '{b} grins and heads off.' },
    { by: 'a', conf: "I'll keep that promise right up until it gets in my way." },
  ] },
  { id: 'sd.h6', when: { band: 'friends' }, turns: [
    { by: 'b', say: "We're friends, right? Like, real friends?" },
    { by: 'a', say: "Of course we are. Final {size}. Friends to the end." },
    { by: 'b', say: "Friends to the end." },
    { by: 'a', conf: "I do like {b}. I just like the money more." },
  ] },
  { id: 'sd.h7', when: { threat: true }, turns: [
    { by: 'a', say: "We need to stop {threat} before {threat} wins this whole thing." },
    { by: 'b', say: "Agreed." },
    { by: 'a', say: "So let's be a team. Final {size}." },
    { by: 'b', say: "Done." },
    { by: 'a', conf: "{b} thinks this is about {threat}. It's about having one more vote in my pocket." },
  ] },
  { id: 'sd.h8', when: { early: true }, turns: [
    { by: 'b', say: "Isn't it a bit early for deals?" },
    { by: 'a', say: "It's never too early. The people who wait are the people who go home first." },
    { by: 'b', say: "Okay, that's actually scary." },
    { by: 'a', say: "So? Final {size}?" },
    { by: 'b', say: "Fine. Final {size}." },
    { by: 'a', conf: "I have no idea who I'm taking to the end. But I know who's voting with me at the next vote." },
  ] },
  { id: 'sd.h9', when: { register: 'sweet' }, turns: [
    { by: 'a', say: "I just feel like we really get each other, you know?" },
    { by: 'b', say: "Totally." },
    { by: 'a', say: "So, final {size}? I'd hate to do this without you." },
    { by: 'b', say: "Aww. Yes, obviously." },
    { by: 'a', conf: "Being nice works. I'm not proud of it, but it works." },
  ] },
  { id: 'sd.h10', turns: [
    { by: 'a', say: "Okay, I'll say it. I want you with me at the end." },
    { by: 'b', say: "Wait, really?" },
    { by: 'a', say: "Really. Final {size}. Shake on it." },
    { beat: 'They shake on it.' },
    { by: 'a', conf: "That's one more person who thinks they're my number one. It's getting crowded up there." },
  ] },
];

export default {
  'deal.side.genuine': GENUINE,
  'deal.side.hollow': HOLLOW,
};

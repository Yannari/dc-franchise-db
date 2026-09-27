// just-met-2 — more first-day scenes (see just-met.js): the day they met,
// when `justMet` leads. Night one plays about 14 turn-downs and 18 pulls
// (season 44, 24 islanders), and the first-day pools held 10 and 18: the same
// "You're the first person I wanted to talk to" three times in one night.
//   loyalty [a, b]  b pulls a, and a — coupled up tonight — says no
//   pull    [a, b]  a pulls b for a chat, the day they met
const J = { justMet: true };
// Only the first episodes: the lines that mean night one's coupling, not a
// bombshell's first day weeks in.
const E = { justMet: true, early: true };

export const JUST_MET_2 = {
  loyalty: [
    { id: 'jm2.ly.01', when: E, stage: '{b} catches {a} on the way back from the kitchen.', turns: [
      ['b', "Have you got five minutes?"], ['a', "Honestly, not tonight. I've literally just coupled up."],
      ['b', "Fair enough. Tomorrow?"], ['a', "Let's see how tomorrow goes."]] },
    { id: 'jm2.ly.02', when: E, turns: [
      ['b', "I was hoping you'd pick me at the fire pit."], ['a', "That's sweet. But I've picked, and I want to give it a go."],
      ['b', "No, I get it."]], beat: '{b} goes back to the others, still smiling.' },
    { id: 'jm2.ly.03', when: J, stage: '{b} sits down next to {a} on the daybed.', turns: [
      ['b', "So, what's your type?"], ['a', "I think my type is the person I'm coupled up with."],
      ['b', "That's a very safe answer."], ['a', "It's the only answer I'm giving tonight."]] },
    { id: 'jm2.ly.04', when: J, turns: [
      ['b', "Can I steal you for a chat?"], ['a', "I'd rather not, if that's okay. I don't want to upset anyone tonight."],
      ['b', "Okay. Respect."]] },
    { id: 'jm2.ly.05', when: J, stage: 'By the pool, {b} walks straight over to {a}.', turns: [
      ['b', "I've wanted to talk to you all day."], ['a', "You're talking to me now."],
      ['b', "Properly, though. Just us."], ['a', "I'm going to say no to just us. For now."]] },
    { id: 'jm2.ly.06', when: J, turns: [
      ['b', "Are you happy with who you picked?"], ['a', "Ask me in a week."],
      ['b', "So that's not a yes."], ['a', "It's not a no, either. And I'm not doing this tonight."]] },
    { id: 'jm2.ly.07', when: J, stage: '{b} offers {a} a drink.', turns: [
      ['a', "Thanks. What's this for?"], ['b', "Just wanted an excuse to come over."],
      ['a', "You don't need an excuse. But I'm going back to my partner after this."], ['b', "Understood."]] },
    { id: 'jm2.ly.08', when: E, turns: [
      ['b', "I'd have stepped forward for you, you know."], ['a', "I know. I saw."],
      ['b', "And?"], ['a', "And I've got a partner now. I'm going to be fair to them."]] },
    { id: 'jm2.ly.09', when: J, stage: 'In the kitchen, {b} leans on the counter next to {a}.', turns: [
      ['b', "If you weren't coupled up, would you talk to me?"], ['a', "Probably."],
      ['b', "Probably is good."], ['a', "Probably isn't tonight."]] },
    { id: 'jm2.ly.10', when: J, turns: [
      ['b', "Do you want to walk round the villa?"], ['a', "I've done the tour. I'm going to stay here."],
      ['b', "With your partner."], ['a', "With my partner."]] },
    { id: 'jm2.ly.11', when: J, stage: '{b} finds {a} on the terrace.', turns: [
      ['b', "I just wanted to say hi. Properly."], ['a', "Hi, properly. That's all you're getting tonight."],
      ['b', "I'll take it."]] },
    { id: 'jm2.ly.12', when: J, turns: [
      ['b', "Everyone's allowed to chat to everyone, aren't they?"], ['a', "They are. I'm just not going to."],
      ['b', "That's very loyal."], ['a', "I've only just met them. I'm still loyal."]] },
    { id: 'jm2.ly.13', when: J, stage: 'On the swing, {b} sits down at the other end.', turns: [
      ['b', "Can I ask you something?"], ['a', "If it's whether I'd pull you for a chat, it's not tonight."],
      ['b', "…That was the question."]], beat: 'They both laugh.' },
    { id: 'jm2.ly.14', when: J, turns: [
      ['b', "You seem like the most interesting person in here."], ['a', "That's kind. My partner seems quite interesting too."],
      ['b', "Point taken."]] },
  ],
  pull: [
    { id: 'jm2.pl.01', when: J, stage: '{a} waits until {b} is on {b.posAdj} own by the pool.', turns: [
      ['a', "Can I borrow you? I feel like everyone's had a go except me."], ['b', "Go on, then."],
      ['a', "So. First impressions of me?"], ['b', "Nervous. In a nice way."], ['a', "That's fair."]] },
    { id: 'jm2.pl.02', when: J, turns: [
      ['a', "I've been trying to get you on your own all day."], ['b', "You could have just asked."],
      ['a', "I'm asking now."], ['b', "Then yes."]] },
    { id: 'jm2.pl.03', when: J, stage: 'On the swing seat, the day they met.', turns: [
      ['a', "What made you come on here?"], ['b', "I'm rubbish at dating at home."],
      ['a', "Same. We might be rubbish at it together."], ['b', "That's the best offer I've had all day."]] },
    { id: 'jm2.pl.04', when: J, turns: [
      ['a', "Tell me three things about you. Quickly."], ['b', "I'm loud, I'm loyal, and I can't cook."],
      ['a', "Two out of three isn't bad."], ['b', "Which two?"], ['a', "I'll let you know."]] },
    { id: 'jm2.pl.05', when: J, stage: '{a} brings {b} a drink and sits down.', turns: [
      ['b', "Are you allowed to be doing this? You've got a partner."], ['a', "We've only just met. That's allowed."],
      ['b', "If you say so."]], beat: '{b} takes the drink anyway.' },
    { id: 'jm2.pl.06', when: E, turns: [
      ['a', "I'm going to be honest. You were my first pick, in my head."], ['b', "In your head?"],
      ['a', "My head didn't get a say at the fire pit."], ['b', "Well, it's got a say now."]] },
    { id: 'jm2.pl.07', when: J, stage: 'The terrace, just before dinner.', turns: [
      ['a', "What's your type, then? Honestly."], ['b', "Honestly? Someone who makes me laugh."],
      ['a', "I'm quite funny."], ['b', "You haven't said anything funny yet."], ['a', "I'm building up to it."]] },
    { id: 'jm2.pl.08', when: J, turns: [
      ['a', "Do you want to get to know each other a bit?"], ['b', "I'd like that."],
      ['a', "Where are you from, then?"], ['b', "I'll tell you if you tell me something embarrassing first."]] },
    { id: 'jm2.pl.09', when: J, stage: 'By the fire pit, later on.', turns: [
      ['a', "I didn't get to talk to you properly earlier."], ['b', "We're talking now."],
      ['a', "Is it too late?"], ['b', "We've only just met. Nothing's too late yet."]] },
    { id: 'jm2.pl.10', when: J, turns: [
      ['a', "So, how are you finding it?"], ['b', "Overwhelming. Everyone's so loud."],
      ['a', "I'll be quiet, then."], ['b', "Don't be too quiet."]] },
    { id: 'jm2.pl.11', when: J, stage: 'In the kitchen, {a} passes {b} a glass of water.', turns: [
      ['a', "You looked like you needed a break from everyone."], ['b', "I really did."],
      ['a', "I'll be your break, then."], ['b', "Smooth."]] },
    { id: 'jm2.pl.12', when: J, turns: [
      ['a', "Can I say something without it being weird?"], ['b', "That depends what it is."],
      ['a', "You've got a really nice laugh."], ['b', "That's not weird. That's nice."]] },
  ],
};

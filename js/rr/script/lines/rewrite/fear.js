// Fear at a task (the phobia) and the pep talk (scenes of 6 to 12 lines), about the thing they're afraid of (fearDoes:
// jump, drop, swim, creature...). phobia: a is the scared one. `panic-break`: the panic turns into a sprint and they're
// through it faster than anyone. `freezes`: they lose twenty minutes. `overcomes`: they do it, and they'll be talking
// about it for years. pep-talk: a gives it (the one leading), b needs it. `works`, `falls-flat`, `backfires`. Written
// again 2026-11-03 the way a frightened person and a partner actually talk (the user: "they talk like a bad
// translation"): no "my legs have left the race", no narrator saying b did, in fact, get older.
const PB = 'phobia.panic-break', FR = 'phobia.freezes', OV = 'phobia.overcomes';
const PW = 'pep-talk.works', PF = 'pep-talk.falls-flat', PX = 'pep-talk.backfires';
const T = (extra = {}) => ({ at: 'task', ...extra });

export default {
  retire: [PB, FR, OV, 'phobia.any', PW, PF, PX, 'pep-talk.any'],
  pools: {
    [FR]: [
      { id: 'fe.f-up1', when: T({ fearDoes: 'jump' }), turns: [
        { beat: '{a} gets to the edge, looks down once, and stops moving.' },
        { by: 'b', say: "Whenever you're ready. Take your time." },
        { by: 'a', say: "I'm not ready. I can't. My legs won't move." },
        { by: 'b', say: "Okay. Take a minute. Just one minute." },
        { beat: 'A minute passes. Then another. A team behind them goes past and jumps.' },
        { by: 'b', say: "Look, they did it. They're fine. They're waving." },
        { by: 'a', say: "I know. I know. I just can't make myself." },
        { beat: 'Twenty minutes after getting to the edge, {a} finally goes, with {a.posAdj} eyes shut the whole way.' },
      ] },
      { id: 'fe.f-wet1', when: T({ fearDoes: 'swim' }), turns: [
        { beat: '{a} is standing at the edge of the water, not moving.' },
        { by: 'a', say: "I can't see the bottom. Why can't I see the bottom?" },
        { by: 'b', say: "Because it's deep. You don't need to see the bottom. You just need to swim." },
        { by: 'a', say: "What if there's something down there?" },
        { by: 'b', say: "There's nothing down there. I promise." },
        { by: 'a', say: "You can't promise that." },
        { beat: 'It takes twenty more minutes, and {b} holding {a.posAdj} hand right to the edge, before {a} gets in.' },
      ] },
      { id: 'fe.f-dark1', when: T({ fearDoes: 'creature' }), turns: [
        { beat: '{a} takes one look at it, then one step back, then another.' },
        { by: 'a', say: "Nope. No. I'm not going anywhere near that." },
        { by: 'b', say: "It's not even looking at you." },
        { by: 'a', say: "I don't care. I can't. I really can't." },
        { by: 'b', say: "Okay. Do you want me to talk you through it?" },
        { by: 'a', say: "I want to go home." },
        { beat: 'Twenty minutes go by before {a} goes anywhere near it.' },
      ] },
      { id: 'fe.f-any1', turns: [
        { by: 'b', say: "You've got this. Just start. Just take the first step." },
        { by: 'a', say: "What if the first step is where it all goes wrong?" },
        { by: 'b', say: "Then I'll be right here." },
        { by: 'a', say: "You'll be right here watching me mess it up." },
        { by: 'b', say: "I'll be right here helping you. Come on." },
        { beat: 'Twenty minutes later, {a} takes the first step.' },
      ] },
      { id: 'fe.f-any2', turns: [
        { by: 'a', say: "Give me a second. I just need one second." },
        { by: 'b', say: "That's what you said a minute ago." },
        { by: 'a', say: "Then I need another one." },
        { beat: '{b} sits down. This is going to take a while.' },
        { by: 'b', say: "Okay. I'm right here. Whenever you're ready." },
        { beat: 'It takes twenty minutes.' },
      ] },
    ],
    [PB]: [
      { id: 'fe.p-up1', when: T({ fearDoes: ['jump', 'drop'] }), turns: [
        { beat: '{a} stares at the drop, breathing faster and faster.' },
        { by: 'b', say: "Breathe. Slowly. In through your nose." },
        { by: 'a', say: "If I think about it, I'll never do it. So I'm not thinking about it." },
        { beat: '{a} screams and goes, before {b} has even finished saying wait.' },
        { by: 'b', say: "Oh my God! That was so fast!" },
        { by: 'a', say: "I don't even remember doing it. Did I do it?" },
      ] },
      { id: 'fe.p-any1', turns: [
        { beat: '{a} has gone very pale.' },
        { by: 'a', say: "Okay. Okay okay okay okay." },
        { by: 'b', say: "Is that a good okay or a bad okay?" },
        { by: 'a', say: "It's a do-it-before-I-change-my-mind okay." },
        { beat: '{a} charges at it, yelling the whole time, and gets it done in one panicked rush.' },
        { by: 'b', say: "That was the scariest and the fastest thing I've ever seen." },
      ] },
      { id: 'fe.p-any2', turns: [
        { by: 'b', say: "Do you need a minute?" },
        { by: 'a', say: "No. If I take a minute, I'll take an hour. Out of the way." },
        { beat: '{a} goes at it screaming and doesn\'t stop screaming until it\'s done.' },
        { by: 'b', say: "You were screaming the whole time." },
        { by: 'a', say: "It helps! It helps!" },
        { by: 'b', say: "Okay. Scream more often." },
      ] },
    ],
    [OV]: [
      { id: 'fe.o-up1', when: T({ fearDoes: ['jump', 'drop', 'rail'] }), turns: [
        { beat: '{a} stands at the edge, shaking, then turns round to {b}.' },
        { by: 'a', say: "I've been scared of heights my whole life. My whole life, {b}." },
        { by: 'b', say: "I know. You can do this. I know you can." },
        { by: 'a', say: "Okay. Okay. Don't watch." },
        { beat: '{a} goes. Slowly, and shaking, but {a.sub} goes, and makes it.' },
        { by: 'a', say: "I did it. I actually did it. Oh my God." },
      ] },
      { id: 'fe.o-wet1', when: T({ fearDoes: 'swim' }), turns: [
        { beat: '{a} gets into the water one inch at a time.' },
        { by: 'b', say: "You're in! You're actually in the water!" },
        { by: 'a', say: "Don't make a big deal out of it or I'll get out." },
        { by: 'b', say: "Okay. I'm being totally normal about it." },
        { beat: '{b} is not being normal about it at all, and can\'t stop grinning.' },
        { by: 'a', say: "I can see you smiling." },
      ] },
      { id: 'fe.o-any1', turns: [
        { by: 'a', say: "If I don't do this now, I'll be scared of it forever. So I'm doing it." },
        { by: 'b', say: "Who are you right now?" },
        { by: 'a', say: "I don't know. Don't distract me." },
        { beat: '{a} does it. It isn\'t pretty, and it isn\'t fast, but it\'s done.' },
        { by: 'a', say: "I did it. I'm going to tell everybody about this." },
        { by: 'b', say: "You should. I'm so proud of you." },
      ] },
      { id: 'fe.o-any2', turns: [
        { by: 'b', say: "We can take the penalty. Honestly. Nobody would blame you." },
        { by: 'a', say: "I would blame me. For the rest of my life, I would blame me." },
        { beat: '{a} takes a long breath, and does it.' },
        { by: 'b', say: "You did it." },
        { by: 'a', say: "I did it. I need to sit down for a minute." },
        { by: 'b', say: "Sit down. You've earned it." },
      ] },
    ],
    [PW]: [
      { id: 'pt.w-task1', turns: [
        { beat: '{b} has got it wrong again and is sitting on the ground. {a} crouches down beside {b.obj}.' },
        { by: 'a', say: "Hey. Look at me. Do you know what went wrong that time?" },
        { by: 'b', say: "Everything?" },
        { by: 'a', say: "No. You rushed the end. Everything else was perfect. Do it again, slower at the end." },
        { by: 'b', say: "Slower at the end. Okay." },
        { beat: '{b} gets up, does it again, slower at the end, and it works.' },
        { by: 'b', say: "Why didn't you tell me that three tries ago?" },
      ] },
      { id: 'pt.w-fam1', when: T({ relFam: 'family' }), turns: [
        { by: 'a', say: "Remember when you learned to drive? You stalled it so many times." },
        { by: 'b', say: "Is this supposed to help?" },
        { by: 'a', say: "And then you got it, and you wouldn't let anybody else drive for a week." },
        { by: 'b', say: "...I remember that." },
        { by: 'a', say: "This is the same. You're about to get it. Go." },
        { beat: '{b} laughs, goes again, and gets it.' },
      ] },
      { id: 'pt.w-any1', turns: [
        { by: 'b', say: "I can't do it. I'm going to be the reason we go home." },
        { by: 'a', say: "You're not going to be the reason for anything. You're going to do it, and then we're going to run." },
        { by: 'b', say: "What if I mess it up again?" },
        { by: 'a', say: "Then you mess it up again, and you go again, and I'll still be right here." },
        { by: 'b', say: "Okay. Okay. One more time." },
        { beat: 'It works on the next try.' },
      ] },
    ],
    [PF]: [
      { id: 'pt.f-task1', turns: [
        { by: 'a', say: "Come on! Winners never quit, and quitters never win!" },
        { by: 'b', say: "Please don't do the poster thing." },
        { by: 'a', say: "I'm trying to help!" },
        { by: 'b', say: "I've done this six times. That's not helping." },
        { by: 'a', say: "Okay. What would help?" },
        { by: 'b', say: "Just be quiet for a minute." },
        { beat: '{a} stops talking. {b} gets it wrong again anyway.' },
      ] },
      { id: 'pt.f-any1', turns: [
        { by: 'a', say: "Think about the money. Think about a million dollars." },
        { by: 'b', say: "I'm thinking about how I can't do this." },
        { by: 'a', say: "Then think about the money harder." },
        { by: 'b', say: "That's not how it works." },
        { by: 'a', say: "Okay. Okay. Forget the money." },
        { beat: 'It doesn\'t help. {b} gets it wrong again.' },
      ] },
    ],
    [PX]: [
      { id: 'pt.x-task1', turns: [
        { by: 'a', say: "Come on. It's not hard. A kid could do this." },
        { by: 'b', say: "Then go find a kid and race with them." },
        { by: 'a', say: "That's not what I meant." },
        { by: 'b', say: "It's exactly what you said." },
        { beat: '{b} turns back to it with {b.posAdj} jaw set, and does it worse.' },
        { by: 'a', say: "Okay. I'm going to stand over here and be quiet." },
      ] },
      { id: 'pt.x-any1', turns: [
        { by: 'a', say: "You're doing amazing! You're doing so amazing! Just, maybe, do it differently!" },
        { by: 'b', say: "Differently how?" },
        { by: 'a', say: "Better?" },
        { by: 'b', say: "That's not helping! That's just telling me I'm bad at it!" },
        { beat: '{b} is now angry as well as stuck.' },
        { by: 'a', say: "Sorry. I'll stop talking." },
      ] },
    ],
  },
};

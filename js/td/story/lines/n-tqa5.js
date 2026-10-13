// ══════════════════════════════════════════════════════════════════════
// td/story/lines/n-tqa5.js — the questions at the vote: what the cameras saw today (n-tqa.js has the header)
// ══════════════════════════════════════════════════════════════════════
// The user, 2026-10-14: "the suspense, the shock at tribal". Two things the day airs now that the host never asked
// about (tribal.js tribalQA):
//   tqa.turned  somebody pitched turning on a friend, and the one pitched went and told the friend (camp-events.js
//               turnFriend, 'warned'): a is the friend, b made the pitch, c is the one who told. Everybody knows.
//   tqa.lied    somebody told a lie about a third person today (talk.lie, plot.lie) and it was believed: a was lied
//               to, b told it, c is who it was about. Nobody at the fire knows but b, so nothing here exposes it:
//               the host only asks where the cameras saw trouble, and the room plays it straight.
// Ids: 'ntq5.'.
export default {
  'tqa.turned.any': [
    { id: 'ntq5.t1', turns: [
      { by: 'h', say: "{a}, I hear somebody spent part of today trying to turn your friends against you." },
      { by: 'a', say: "Somebody did. {b} did. {c} told me everything." },
      { by: 'b', say: "I asked {c} a question. That's all it was." },
      { by: 'c', say: "It wasn't a question. It was a pitch, and it was about {a}." },
      { by: 'h', say: "{b}, anything you want to add?" },
      { by: 'b', say: "Only that I'd do it again. It's a game." },
    ] },
    { id: 'ntq5.t2', turns: [
      { by: 'h', say: "{c}, you've been sitting very close to {a} tonight. Any reason?" },
      { by: 'c', say: "Because somebody wanted me sitting a lot further away." },
      { by: 'a', say: "{b} wanted it. {c} said no, and came straight to me." },
      { by: 'b', say: "I didn't think {c} would run and tell." },
      { by: 'a', say: "That's the problem with going after my friends. They're my friends." },
    ] },
    { id: 'ntq5.t3', turns: [
      { by: 'h', say: "{b}, the cameras caught you making a pitch today. How did it go?" },
      { by: 'b', say: "Not the way I hoped." },
      { by: 'c', say: "It went straight to {a}, actually." },
      { by: 'a', say: "In about a minute." },
      { by: 'h', say: "So, {b}, who's on your side tonight?" },
      { by: 'b', say: "I guess we're about to find out." },
    ] },
    { id: 'ntq5.t4', turns: [
      { by: 'h', say: "{a}, how does it feel to find out somebody wants you gone?" },
      { by: 'a', say: "Honestly? Better than not knowing. Now I know who." },
      { by: 'b', say: "You don't know anything." },
      { by: 'a', say: "I know what you said to {c}. {c} told me word for word." },
      { by: 'c', say: "I did. Sorry, {b}. You asked the wrong person." },
    ] },
  ],
  'tqa.lied.any': [
    { id: 'ntq5.l1', turns: [
      { by: 'h', say: "{a}, quick one. Who here would you trust with your vote tonight?" },
      { by: 'a', say: "{b}. {b} has been honest with me when nobody else was." },
      { by: 'b', say: "I try to be." },
      { by: 'c', say: "That's interesting." },
      { by: 'h', say: "{c}, something to add?" },
      { by: 'c', say: "No. Just that honest is a funny word to use out here." },
    ] },
    { id: 'ntq5.l2', turns: [
      { by: 'h', say: "{a}, did anybody tell you something today that changed how you feel about somebody?" },
      { by: 'a', say: "Yeah. About {c}." },
      { by: 'c', say: "About me? What about me?" },
      { by: 'a', say: "I'm not getting into it here." },
      { by: 'b', say: "Probably smart." },
      { by: 'c', say: "Okay, so somebody's been saying things about me, and I'd really love to know who." },
    ] },
    { id: 'ntq5.l3', turns: [
      { by: 'h', say: "{c}, you look confused tonight." },
      { by: 'c', say: "Because {a} has been cold with me all day, and I don't know what I did." },
      { by: 'a', say: "You know what you did." },
      { by: 'c', say: "I really don't." },
      { beat: "{b} keeps looking at the fire." },
      { by: 'h', say: "Well. This is going to be fun to watch." },
    ] },
    { id: 'ntq5.l4', turns: [
      { by: 'h', say: "{b}, you've been busy today. Talking to a lot of people?" },
      { by: 'b', say: "Just being friendly." },
      { by: 'a', say: "{b} looked out for me today. That's more than I can say for some people." },
      { by: 'c', say: "Was that about me?" },
      { by: 'a', say: "If it fits." },
    ] },
  ],
};

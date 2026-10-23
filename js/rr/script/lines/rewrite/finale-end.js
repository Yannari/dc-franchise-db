// The finale's last words (the user, 2026-10-23: "last word at the finale is the winners then the losers then last
// words of the winner then the host don signing off"). After Don crowns the winners and names the runners-up, the
// winners have the last word on the stage (`winner-words`), and Don closes the season (`don-signoff`): nothing airs
// after him. {team} is the winners; a and b are the two of them.
const don = say => ({ by: 'don', say });

export default {
  retire: [],
  pools: {
    'winner-words.last-words': [
      { id: 'fe.w1', turns: [
        { beat: '{a} and {b} stand on the stage with the giant cheque between them, still out of breath.' },
        { by: 'a', say: "A million dollars. I keep saying it and it still doesn't sound real." },
        { by: 'b', say: "It's real. I've been holding the cheque for ten minutes and my arms are killing me." },
        { by: 'a', say: "Around the whole world, and we finished it together. That's the part I'm keeping." },
      ] },
      { id: 'fe.w2', turns: [
        { by: 'b', say: "Every time we nearly went home, one of us said keep going. Every single time." },
        { by: 'a', say: "Mostly it was you saying it." },
        { by: 'b', say: "Mostly it was me. But you listened, and that's why we're standing here." },
      ] },
      { id: 'fe.w3', turns: [
        { beat: '{a} looks out at the bleachers, at every team they raced against.' },
        { by: 'a', say: "Thank you, all of you. You made us run faster than we knew we could." },
        { by: 'b', say: "Some of you also made us run the wrong way." },
        { by: 'a', say: "And thank you for that too. We'd never have seen that much of the world otherwise." },
      ] },
      { id: 'fe.w4', turns: [
        { by: 'a', say: "Can I say something to everybody who told us we'd be out on the first leg?" },
        { by: 'b', say: "Keep it nice. We're on television." },
        { by: 'a', say: "We won. That's it. That's the whole message." },
      ] },
      { id: 'fe.w5', when: { relFam: 'romantic' }, turns: [
        { by: 'a', say: "We fought in airports, on boats, and halfway up a mountain." },
        { by: 'b', say: "And we're still together at the end of it, with a million dollars." },
        { by: 'a', say: "If we can survive this race, we can survive anything, including your driving." },
      ] },
      { id: 'fe.w6', when: { relFam: 'family' }, turns: [
        { by: 'b', say: "Wait until the family hears about this. They're going to want to come to every dinner now." },
        { by: 'a', say: "They're going to want to borrow money at every dinner now." },
        { by: 'b', say: "Then we'll eat in a different restaurant, a really nice one, because we can afford it." },
      ] },
      { id: 'fe.w7', when: { relFam: 'friends' }, turns: [
        { by: 'a', say: "We've been friends since we were kids, and this is the best thing we've ever done together." },
        { by: 'b', say: "Better than the treehouse?" },
        { by: 'a', say: "The treehouse fell down, so yes, it's better than the treehouse." },
      ] },
      { id: 'fe.w8', turns: [
        { beat: '{b} hasn\'t let go of {a}\'s hand since they stepped on the mat.' },
        { by: 'b', say: "I don't know what to say. I had a speech, and it's gone." },
        { by: 'a', say: "Then just say thank you, and let's go home." },
        { by: 'b', say: "Thank you! Now let's go home, the long way, in first class." },
      ] },
    ],
    'don-signoff.plain': [
      { id: 'fe.s1', turns: [
        { beat: 'Don steps to the front of the stage as the confetti comes down.' },
        don("{team} take home a million dollars, and everybody else takes home a story they'll be telling for years."),
        don("I'm Don, this has been the Ridonculous Race, and I'll see you next season, somewhere ridonculous!"),
      ] },
      { id: 'fe.s2', turns: [
        don("Around the world and across every kind of finish line, and in the end, only one team got to hold the cheque: {team}."),
        { beat: 'Behind him, the bleachers are still cheering.' },
        don("That's our race! I'm Don, and you've been watching the Ridonculous Race. Good night!"),
      ] },
      { id: 'fe.s3', turns: [
        don("Lost tips, wrong turns, broken hearts and a lot of very bad sleep, and through all of it, {team} came out on top."),
        { beat: 'Somewhere behind him, a runner-up is still lying flat on the mat.' },
        don("They're rich, I'm still gorgeous, and that's the end of the Ridonculous Race. See you next time!"),
      ] },
      { id: 'fe.s4', turns: [
        { beat: 'Don turns to the camera while the winners are still being hugged in the background.' },
        don("Every team out there started this race thinking it could win, and only {team} were right."),
        don("Thanks for racing with us. I'm Don, and this has been the Ridonculous Race!"),
      ] },
    ],
  },
};

// ══════════════════════════════════════════════════════════════════════
// ci/lines/prizes.js — "Please collect your prize from the door."
// ══════════════════════════════════════════════════════════════════════
//
// User (2026-10-01) asked whether game winners get something. On the show a
// win buys no power: the prize is a reward — a trophy at the door (US 2's
// golden quill, US 3's rap battle), sometimes a party for everyone. Here a
// judged contest's winner gets the trophy, and the room starts to watch them.
//   game.prize.trophy        a (the winner) at the door
//   game.prize.trophy.react  a (in the room) about b (the winner)
const E = (key, list) => ({ [key]: list.map((x, i) => ({ id: `${key}.${String(i + 1).padStart(2, '0')}`, ...x })) });

export const PRIZE_LINES = {
  ...E('game.prize.trophy', [
    { turns: [{ by: 'a', react: "'Please collect your prize from the door.' There's a PRIZE?" }], beat: '{a} sprints to the door and comes back holding a tiny gold trophy.' },
    { turns: [{ by: 'a', react: "A trophy! I won a trophy! This is going on my mantel. I don't have a mantel. I'm getting one." }] },
    { turns: [{ by: 'a', say: "I knew I was good at this. Now I have proof." }], beat: '{a} sets the trophy next to the screen, facing out.' },
    { turns: [{ by: 'a', react: "'Collect your prize from the door.' Oh my God. Oh my God!" }], beat: '{a} hugs the trophy like a newborn.' },
    { turns: [{ by: 'a', say: "Champion. Of The Circle. Of this one game. Still counts." }] },
  ]),
  ...E('game.prize.trophy.react', [
    { turns: [{ by: 'a', say: "Great. {b} won. Now everybody's going to love {b} even more." }] },
    { turns: [{ by: 'a', react: "{b} won? Hm. {b} is getting very popular." }] },
    { turns: [{ by: 'a', say: "Good for {b}. Also, I'm keeping an eye on {b}." }] },
    { turns: [{ by: 'a', react: "That should've been mine. Next time." }] },
    { turns: [{ by: 'a', say: "Winning is cute. Winning makes you a target too, {b}." }] },
  ]),
};

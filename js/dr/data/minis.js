// ══════════════════════════════════════════════════════════════════════
// dr/data/minis.js — the mini challenges, and what winning one buys
// ══════════════════════════════════════════════════════════════════════
//
// A mini is not a scoring event: nobody goes home for losing one, and it never
// touches the week's placement. It exists to hand somebody POWER over the
// maxi, which is where the drama is — a pick order decides who gets the good
// Snatch Game character, a captaincy decides who is on whose team, and both
// are decisions the room remembers.
//
// `buys` is what the win is worth:
//   pick-order  she chooses first when roles, characters or materials go out
//   captain     she picks a team, and whoever she leaves behind notices
//   first-pick  a single first choice, without reordering everybody else
//   prize       nothing structural; a reward, and a moment on screen
//
// `interaction` is what the mini actually IS, and it decides how js/dr/mini.js
// resolves it:
//   solo     everybody performs for the room — a stat roll, which is correct
//            for a photoshoot or a dance-off
//   targets  she does a bit ABOUT another queen, to her face. Lands or does
//            not, and either way the two of them feel it afterwards
//   pairs    the room splits and each queen's result depends partly on what
//            her partner did for her
//   vote     nobody performs: the host asks the room about itself and the
//            queens who answered with the MAJORITY take the round
//   guess    nobody performs: something belongs to one of them and the room
//            works out whose. There is a right answer and being right is the
//            only thing that scores

export const MINI_TYPES = [
  { id: 'reading', interaction: 'targets', name: 'Reading Is Fundamental', buys: 'pick-order',
    blend: { comedy: 0.8, acting: 0.2 },
    desc: 'The library is open. Each queen takes the room apart one at a time, and the sharpest read wins.' },
  { id: 'puppets', interaction: 'targets', name: 'Puppet Parody', buys: 'first-pick',
    blend: { comedy: 0.7, acting: 0.3 },
    desc: 'Each queen is handed a puppet of another queen and has to play her to her face.' },
  { id: 'quick-drag', interaction: 'solo', name: 'Quick Drag', buys: 'captain',
    blend: { design: 0.5, runway: 0.5 },
    desc: 'A full look, start to finish, against a clock that is far too short.' },
  { id: 'photoshoot', interaction: 'solo', name: 'Photoshoot Mini', buys: 'pick-order',
    blend: { runway: 0.7, acting: 0.3 },
    desc: 'One frame each, with something going wrong in shot on every take.' },
  { id: 'dance-off', interaction: 'solo', name: 'Werk Room Dance-Off', buys: 'captain',
    blend: { dance: 0.8, lipsync: 0.2 },
    desc: 'The music starts with no warning and the queens have eight counts to prove something.' },
  /* ── AND THE ONE THAT WAS NEVER A QUIZ ──
     Filed as `Herstory Quiz`, which promises trivia, and resolved as
     `targets`, which is one queen doing a bit ABOUT another. The pool that
     was actually written for it agrees with the interaction and not with the
     name: a question about {b}, scored on the funniest WRONG answer. So the
     name was the lie and the game was fine — renamed to what it is, and
     given a desc that says how it works, which the old one-liner did not. */
  { id: 'quiz', interaction: 'targets', name: 'Wrong Answers Only', buys: 'prize',
    blend: { comedy: 0.3, acting: 0.3, runway: 0.4 },
    desc: 'The host holds up a card about one of the queens in the room — '
      + 'where she is from, what she does for a living, what she was doing '
      + 'this time last year — and hands it to somebody else to answer. '
      + 'Knowing the answer is worth nothing. The points are for the wrong '
      + 'one: the queen being asked about is standing right there, and the '
      + 'invention has to be funny to the whole room and survive her face '
      + 'while it is being said. Answer it correctly and you get a polite '
      + 'nod and no points at all. The funniest liar wins.' },
  /* ── THE ONE WITH AN ANSWER IN IT ──
     The wiki files eleven of these under
     Guessing Challenge and they are all the same game: something belongs to
     one of them and the room works out whose.
     It is deliberately the mirror of Spill the T. That one has no right
     answer and pays you for agreeing with the room; this one has exactly
     one, so the room agreeing in a body is eight queens wrong together. What
     it scores is how well she knows the woman next to her — the bond does
     most of the work, which nothing else on this list rewards. See
     js/dr/data/guess.js. */
  { id: 'guess-who', interaction: 'guess', name: 'Guess Who', buys: 'prize',
    blend: { runway: 0.5, design: 0.5 },
    desc: 'Something belonging to one of the queens goes up on the screen — a '
      + 'wig, a shoe, a padding, a perfume, a baby photo, a work station an '
      + 'hour before the runway — and nobody is told whose it is. Every other '
      + 'queen writes down a name, the answers go up together, and then the '
      + 'owner is revealed and has to watch how many of her sisters had no '
      + 'idea. Guessing the queen everybody else guessed is worth nothing '
      + 'here: there is a right answer, and a room that agrees on the wrong '
      + 'one is simply a room that does not know her. Four items go up, and '
      + 'the queen who got the most of them right wins.' },
  /* ── THE ONE THAT IS NOT A PERFORMANCE ──
     Every other mini here asks whether she is good at something. This one
     asks whether she knows what the room thinks — the host puts a
     superlative to the room, everybody votes, and the queens who vote WITH
     THE MAJORITY take the round. That is the real show's rule and it makes
     `intuition` the stat that wins it, which nothing else on this list does.
     The `blend` is nominal and used only as a tiebreak; the score is how
     often she matched. See js/dr/mini.js and js/dr/data/spill.js. */
  { id: 'spill-the-t', interaction: 'vote', name: 'Spill the T', buys: 'pick-order',
    blend: { comedy: 0.5, acting: 0.5 },
    desc: 'The host puts a question about the room to the room — who is the '
      + 'biggest threat, who cracks first, who is the next one going home — and '
      + 'every queen votes for somebody other than herself. The answers are read '
      + 'out with the names attached, so a queen finds out what her sisters think '
      + 'of her before she has done anything that week. Guessing what YOU think '
      + 'is not the game: the round goes to whoever voted with the majority, so a '
      + 'queen who knows the room beats a queen who is merely right. Most rounds '
      + 'matched wins.' },
  { id: 'wig-swap', interaction: 'pairs', name: 'Wig Swap', buys: 'first-pick',
    blend: { design: 0.6, runway: 0.4 },
    desc: 'Every queen styles somebody else’s wig and then has to wear the one done for her.' },
];

export function miniById(id) {
  return MINI_TYPES.find(m => m.id === id) || null;
}

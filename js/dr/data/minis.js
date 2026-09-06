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

export const MINI_TYPES = [
  { id: 'reading', name: 'Reading Is Fundamental', buys: 'pick-order',
    blend: { comedy: 0.8, acting: 0.2 },
    desc: 'The library is open. Each queen takes the room apart one at a time, and the sharpest read wins.' },
  { id: 'puppets', name: 'Puppet Parody', buys: 'first-pick',
    blend: { comedy: 0.7, acting: 0.3 },
    desc: 'Each queen is handed a puppet of another queen and has to play her to her face.' },
  { id: 'quick-drag', name: 'Quick Drag', buys: 'captain',
    blend: { design: 0.5, runway: 0.5 },
    desc: 'A full look, start to finish, against a clock that is far too short.' },
  { id: 'photoshoot', name: 'Photoshoot Mini', buys: 'pick-order',
    blend: { runway: 0.7, acting: 0.3 },
    desc: 'One frame each, with something going wrong in shot on every take.' },
  { id: 'dance-off', name: 'Werk Room Dance-Off', buys: 'captain',
    blend: { dance: 0.8, lipsync: 0.2 },
    desc: 'The music starts with no warning and the queens have eight counts to prove something.' },
  { id: 'quiz', name: 'Herstory Quiz', buys: 'prize',
    blend: { comedy: 0.3, acting: 0.3, runway: 0.4 },
    desc: 'A quiz about the queens themselves, scored on how funny the wrong answers are.' },
  { id: 'wig-swap', name: 'Wig Swap', buys: 'first-pick',
    blend: { design: 0.6, runway: 0.4 },
    desc: 'Every queen styles somebody else’s wig and then has to wear the one done for her.' },
];

export function miniById(id) {
  return MINI_TYPES.find(m => m.id === id) || null;
}

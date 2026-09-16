// ══════════════════════════════════════════════════════════════════════
// dr/data/save-beats.js — what gets said when a save is on the table
// ══════════════════════════════════════════════════════════════════════
//
// Placeholders: {a} the queen the line is about, {h} the holder, {w} the
// maxi winner, {s} the saved queen, {c} {d} the two left to sing, {l} the
// lever, {n} how many levers were in play. Never a name typed in.
//
// Say what happened and move on. These lines sit on the most tense two
// minutes of the night; they are not the place for a metaphor.

export const SAVE_BEATS = {
  intro: {
    chocolate: [
      'Each queen gets a sealed chocolate bar with her face on the wrapper. One of them hides a golden ticket. Nobody opens hers unless she is sent home.',
      'Ru hands round the bars herself. "Keep them sealed. If you lose a lip sync, you will open yours on this stage. One of them is golden, and golden means you stay."',
      'A tray of chocolate bars, one per queen. One is gold inside. The rule is simple: hold on to it, and pray you never have to open it.',
    ],
    tank: [
      'There is a dunk tank on the main stage, with {n} levers in front of it and Michelle in the seat. Lose the lip sync and you pull one. The right lever sends Michelle into the water and sends you back to the werk room.',
      '"Meet the Badonka Dunk Tank." {n} levers, one of them live. Lose your lip sync, pick a lever, and hope the judge gets wet.',
    ],
    beaver: [
      'New rule this season: three queens will be named in the bottom every week, and the winner of the maxi challenge holds the Golden Beaver. She saves one of them before the song.',
      'Ru holds up a golden beaver. "Starting next week, the challenge winner uses this to save one of the bottom three. The other two lip sync."',
    ],
    baguette: [
      'The Golden Baguette: every week the maxi winner gets it, and can keep it or give it to any queen in the room. Whoever holds it saves one of the bottom three.',
      'Ru introduces the Golden Baguette. The winner decides who holds it. The holder decides who is saved. Two decisions, two chances to make an enemy.',
    ],
  },
  retire: [
    'The dunk tank is drained and wheeled off. From tonight, losing the lip sync means going home.',
    'Michelle climbs out of the tank for the last time. No more levers. The next queen to lose a lip sync is gone.',
  ],
  handoff: {
    gave: [
      '{w} walks the baguette over to {h} and puts it in her hands.',
      '{w} does not keep it. She gives the baguette to {h}.',
      '{w} picks {h}. The baguette changes hands, and so does the power.',
    ],
    kept: [
      '{w} keeps the baguette. She wants to make this call herself.',
      '{w} looks around the room and holds on to it. "I will decide."',
    ],
  },
  saveHold: {
    self: [
      '{h} is standing in the bottom three with the power in her hand. She saves herself.',
      '{h} does not hesitate: she uses it on herself and steps out of the bottom.',
    ],
    friend: [
      '{h} saves {s}. They have had each other\'s backs since day one.',
      '{h} looks at {s} first and does not look away. {s} is safe.',
    ],
    merit: [
      '{h} saves {s}. "She did not deserve to be up there tonight."',
      '{h} picks {s}, the one who was closest to being safe anyway.',
    ],
    strategy: [
      '{h} saves {s}, and leaves the stronger queens to fight it out.',
      '{h} saves {s}. It is a choice about who she would rather face later.',
    ],
  },
  saveLeft: [
    '{c} and {d} were not chosen. They lip sync for their lives.',
    'That leaves {c} and {d} on the stage, and neither of them is looking at {h}.',
  ],
  open: {
    plain: [
      '{a} unwraps her bar. Chocolate. Just chocolate.',
      '{a} tears the wrapper off. No gold. She puts it down on the stage.',
      '{a} opens it slowly, then all at once. Plain. She nods.',
    ],
    golden: [
      '{a} tears the wrapper and it is GOLD. Nobody is going home tonight.',
      '{a} opens her bar and the gold catches the lights. She stays.',
    ],
  },
  pull: {
    miss: [
      '{a} picks lever {l} and pulls. Michelle stays dry. {a} is going home.',
      'Lever {l}. Nothing happens. {a} closes her eyes.',
      '{a} goes for lever {l}. Click. Michelle waves at her from the seat.',
    ],
    hit: [
      '{a} pulls lever {l} and Michelle drops into the water. {a} stays.',
      'Lever {l}. SPLASH. Michelle comes up soaked and {a} is still in the race.',
    ],
  },
  aftermath: {
    savedLuck: [
      '{a} stays on the stage next to {w}, who won a lip sync that sent nobody home.',
      'Nobody sashays tonight. {w} won the song and gets no satisfaction from it.',
    ],
  },
};

/** Fill the placeholders. Unknown keys are left as they are, so a test can find them. */
export function fillSave(line, vars = {}) {
  return String(line || '').replace(/\{([a-z])\}/g, (m, k) =>
    (vars[k] != null ? String(vars[k]) : m));
}

export function pickSave(list, rng) {
  if (!Array.isArray(list) || !list.length) return '';
  return list[Math.floor(rng() * list.length)];
}

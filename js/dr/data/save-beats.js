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
      '"Meet the Badonka Dunk Tank." {n} levers, and somewhere in that row, the one that dunks her. Lose your lip sync, pick a lever, and hope the judge gets wet.',
    ],
    beaver: [
      'New rule this season: three queens will be named in the bottom every week, and the winner of the maxi challenge holds the Golden Beaver. She saves one of them before the song.',
      'Ru holds up a golden beaver. "Every week, the challenge winner uses this to save one of the bottom three. The other two lip sync."',
      'Panic in the werk room: the maxi winner will get to save one of the bottom three, every single week. Everybody suddenly needs new best friends.',
    ],
    baguette: [
      'The Golden Baguette: every week, the queen who went home the week before comes back with it and hands it to anyone still in the race. Whoever holds it saves one of the bottom three.',
      'Ru introduces the Golden Baguette. The last queen out decides who holds it, and the holder decides who is saved. Two decisions, two chances to make an enemy.',
    ],
  },
  retire: [
    'The dunk tank is drained and wheeled off. From tonight, losing the lip sync means going home.',
    'Michelle climbs out of the tank for the last time. No more levers. The next queen to lose a lip sync is gone.',
  ],
  /* {g} is last week's eliminated queen, back for one minute with the baguette. */
  handoff: {
    gave: [
      '{g} walks back onto the main stage holding the Golden Baguette. She gives it to {h}.',
      'The doors open and it is {g}, one week gone, carrying the baguette. She puts it in the hands of {h}.',
      '{g} is back just long enough to choose. The baguette goes to {h}.',
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
  saveHoldExtra: {
    plea: [
      '{h} saves {s}. Whatever {s} said backstage, it worked.',
      '{h} saves {s}, and {s} mouths "thank you" before the words are finished.',
    ],
    debt: [
      '{h} saves {s}. She owed her, and she knows it.',
      '{h} saves {s}, the queen who once did the same for her.',
    ],
  },
  saveLeft: [
    '{c} and {d} were not chosen. They lip sync for their lives.',
    'That leaves {c} and {d} on the stage, and neither of them is looking at {h}.',
  ],
  /* The tank's retirement is a mini challenge in the real show (S17 ep 10). */
  /* The host stops her before the goodbye. Its own beat, so the screen can
     hold on the bar (or the levers) for one click before anything opens. */
  ask: {
    chocolate: [
      '"{a}, before you sashay away... open your chocolate bar."',
      'Ru holds up a hand. "Not yet, {a}. You still have your bar. Open it."',
      '"{a}. The moment of truth. Unwrap your chocolate bar."',
    ],
    tank: [
      '"{a}, you lost the lip sync. But the tank is still full. Pick a lever."',
      'Ru points at the tank. "{a}, choose your lever. Choose wisely."',
      '"Before you go, {a}... Michelle is waiting. Pick a lever."',
    ],
  },
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

  /* ── THE CAMPAIGN ── {a} is the queen making the move, {b} the queen with
     the power (or, on a baguette night, the one the room expects to get it),
     {c} a third queen. */
  campaign: {
    open: {
      beaver: [
        'Backstage, the bottom three have one job: get to {b} before she walks back out there.',
        'Untucked goes quiet for about four seconds. Then everybody turns toward {b}.',
      ],
      baguette: [
        'Nobody knows who the baguette is going to. Everybody has a guess, and the guess is {b}.',
        'The bottom three spend Untucked being very, very nice to {b}, just in case.',
      ],
    },
    'honest-plea': [
      '{a} sits next to {b}. "I know I was bad tonight. I am asking anyway. Please."',
      '{a} does not dress it up. "I want to stay, and you are the only one who can do that."',
      '{a} takes {b} aside and tells her exactly why she deserves another week.',
    ],
    promise: [
      '{a} leans in. "Save me tonight and I will save you the second I get the chance."',
      '{a} offers {b} a deal: her vote of confidence now, a favour later. {b} does not say no.',
      '"You save me, I owe you. You know I pay my debts," {a} tells {b}.',
    ],
    'debt-called': [
      '{a} does not have to say much. "I saved you, {b}. Remember?"',
      '{a} reminds {b} who pulled her out of the bottom last time.',
      '"I was there for you," {a} says. {b} looks at the floor.',
    ],
    'cold-shoulder': [
      '{a} refuses to beg. "If {b} wants to send me to the lip sync, let her. I will win it."',
      '{a} sits on the far side of the lounge and does not look at {b} once.',
    ],
    breakdown: [
      '{a} starts crying before she has finished her first sentence to {b}.',
      '{a} tries to make her case to {b} and her voice gives out halfway through.',
    ],
    'throw-under': [
      '{a} tells {b} that {c} has been coasting for weeks. {c} hears every word.',
      '"Save whoever you want, just not {c}," {a} says, loudly enough for {c}.',
      '{a} pulls {b} aside and walks her through every mistake {c} made tonight.',
    ],
    backfired: [
      '{b} is not impressed. "You do not get saved by tearing her down, {a}."',
      '{b} goes quiet, and it is not a good quiet for {a}.',
    ],
    vouch: [
      '{a} is safe tonight, and spends Untucked telling {b} why {c} deserves it.',
      '"If you save anybody, save {c}," {a} tells {b}. "She has my back every single day."',
    ],
    torn: [
      '{a} has two friends in the bottom, {b} and {c}. She tells the room she feels sick.',
      '{a} looks from {b} to {c} and says she wishes this were somebody else\'s call.',
    ],
  },

  /* ── WHAT THE SAVE SETTLES ── */
  repaid: [
    '{h} saved {s}, the queen who once saved her. The debt is paid.',
    '"You were there for me," {h} says to {s}. Now they are even.',
  ],
  promiseKept: [
    '{h} made {s} a promise, and she kept it.',
    '{h} said she would save {s} if it ever came to this. She does.',
  ],
  promiseBroken: [
    '{h} promised {s} a save. Tonight she had the chance, and she did not take it.',
    '{s} looks at {h} and waits. {h} does not say her name.',
  ],
  grudge: [
    '{h} has not forgotten that {s} left her in the bottom. {s} is not saved.',
    '{h} remembers who passed her over. It shows.',
  ],
  /* Next week's cold open, after a promise was broken on the stage. {a} is the
     queen let down, {b} the one who broke it. */
  fallout: [
    '{a} walks into the werk room and goes straight for {b}. "You promised me."',
    'The room watches {a} confront {b} about last night. {b} does not have a good answer.',
    '{a} tells anyone who will listen that {b} is a liar. {b} is standing right there.',
  ],
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

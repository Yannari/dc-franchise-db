// ══════════════════════════════════════════════════════════════════════
// dr/data/save-beats.js — what gets said when a save is on the table
// ══════════════════════════════════════════════════════════════════════
//
// Placeholders: {a} the queen the line is about, {h} the holder, {w} the
// maxi winner, {s} the saved queen, {c} {d} the two left to sing, {l} the
// lever, {n} how many levers were in play, {k} the week's maxi challenge, {r}
// the runway category. Never a name typed in.
//
// A LINE THAT ASSUMES A KIND OF CHALLENGE SAYS SO: `{ fam: [...], line }`,
// with the families from js/dr/data/maxi-performance.js. "My look was
// finished" is a sewing week's sentence and nothing else's; on a comedy
// week it is an error. A plain string assumes nothing but that there was a
// runway, which there always is.
//
// Say what happened and move on. These lines sit on the most tense two
// minutes of the night; they are not the place for a metaphor.

const SEWING = ['design', 'ball', 'makeover'];
const COMEDY = ['snatch-game', 'improv', 'stand-up', 'roast'];
const ACTING = ['acting', 'commercial'];
const STAGE = ['girl-group', 'rusical', 'choreography', 'talent-show', 'rumix', 'music-video', 'singing'];

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
      '{h} saves {s}. The campaign worked.',
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

  /* ── THE CAMPAIGN ── in Untucked, after the call. {a} is the queen making
     the move, {b} the queen it is aimed at (the power, or on a baguette night
     the queen the room expects to get it), {c} a third queen, {n} a count. */
  campaign: {
    open: {
      beaver: [
        'The bottom three walk into Untucked and nobody sits down. Everybody is looking for {b}.',
        'Untucked goes quiet for about four seconds. Then everybody turns toward {b}.',
        '"Are there going to be alliances?" somebody asks as the door closes. Nobody answers. Everybody looks at {b}.',
      ],
      baguette: [
        'Nobody knows who the baguette is going to. Everybody has a guess, and the guess is {b}.',
        'The bottom three spend Untucked being very, very nice to {b}, just in case.',
      ],
    },
    // Round 1: the pitch, each with its reason.
    'honest-plea': [
      '{a} sits next to {b}. "I know I was bad tonight. I am asking anyway. Please."',
      '{a} does not dress it up. "I want to stay, and you are the only one who can make that happen."',
    ],
    'pitch-friend': [
      '{a} takes {b} by both hands. "We have had each other since day one. I need you now."',
      '"You know me," {a} tells {b}. "You know I would do it for you. Do it for me."',
      '{a} reminds {b} of every night they spent getting ready side by side. "That has to count for something."',
    ],
    'pitch-no-threat': [
      '{a} is honest about it. "Look at my record. I am not the one you need to worry about. They are."',
      '"Save me and you keep the easiest queen in the room," {a} tells {b}. "Think about it."',
      '{a} makes the strategic case: she is the one {b} can beat later. {b} does the maths.',
    ],
    'pitch-deserve': [
      '"I was the best of the three tonight, and the judges said so," {a} tells {b}. "{c} was not even close."',
      '{a} walks {b} through the critiques. "I was nearly safe. {c} was the bottom of the bottom."',
    ],
    'pitch-record': [
      '"I have {n} on my record," {a} says. "One bad night should not send me to the lip sync."',
      '{a} points at her record. "I have won this competition before. Save the queen who can win it again."',
    ],
    'pitch-lipsync-mercy': [
      '{a} is blunt. "Those two can lip sync. I cannot. If you send me out there, I am gone."',
      '"Be honest, {b}. Which of us survives that song? Not me," {a} says.',
    ],
    'pitch-noble': [
      '{a} surprises everybody. "Don\'t save me. Save one of them. I will win the lip sync."',
      '"I am not going to beg," {a} tells {b}. "Give me the song. I want it."',
    ],
    promise: [
      '{a} leans in. "Save me tonight and I will save you the second I get the chance."',
      '{a} offers {b} a deal: a save now, a save later. {b} does not say no.',
      '"You save me, I owe you. You know I pay my debts," {a} tells {b}.',
    ],
    'debt-called': [
      '{a} does not have to say much. "I saved you, {b}. Remember?"',
      '{a} reminds {b} who pulled her out of the bottom last time.',
    ],
    'cold-shoulder': [
      '{a} refuses to beg. "If {b} wants to send me to the lip sync, let her. I will win it."',
      '{a} sits on the far side of the lounge and does not look at {b} once.',
    ],
    breakdown: [
      '{a} starts crying before she has finished her first sentence to {b}.',
      '{a} tries to make her case to {b} and her voice gives out halfway through.',
    ],
    // Round 2: the pushback.
    'rebut-threat': [
      '"No threat? She has {n} on her record," {a} says, loud enough for {b}. {c} glares at her.',
      '{a} cuts in. "Do not let {c} tell you she is harmless. Look at her record."',
    ],
    'rebut-deserve': [
      '"You were not better than me tonight, {c}," {a} snaps. "Stop saying it."',
      '{a} will not let it go. "The judges hated your look too, {c}. Do not rewrite the critiques."',
    ],
    'expose-deal': [
      '{a} tells {b} that {c} is making deals. "Ask her what she promised you. Then ask her what she promised me."',
      '"She is offering saves she will never give," {a} says about {c}. {c} goes red.',
    ],
    'rebut-record': [
      '"Her record is exactly why you should not save her," {a} tells {b} about {c}.',
      '{a} leans over. "You save {c}, you are saving the queen who beats you in the finale."',
    ],
    'rebut-friend': [
      '"Friends? {c} has been friends with everyone this week," {a} tells {b}.',
      '{a} rolls her eyes at {c}. "Do not fall for the best-friend act, {b}."',
    ],
    'shouting-match': [
      '{a} and {c} are on their feet. It takes two queens to get them to sit back down.',
      'It starts with {a} saying one thing about {c} and ends with both of them shouting. {b} watches all of it.',
    ],
    'throw-under': [
      '{a} tells {b} that {c} has been coasting for weeks. {c} hears every word.',
      '"Save whoever you want, just not {c}," {a} says, loudly enough for {c} to hear.',
    ],
    backfired: [
      '{b} is not impressed. "You do not get saved by tearing her down, {a}."',
      '{b} goes quiet, and it is not a good quiet for {a}.',
    ],
    vouch: [
      '{a} is safe tonight, and spends Untucked telling {b} why {c} deserves it.',
      '"If you save anybody, save {c}," {a} tells {b}. "She has my back every single day."',
    ],
    stir: [
      '{a} whispers to {b} that {c} called her a fluke this morning. It is not clear that it is true.',
      '{a} makes sure {b} hears what {c} "said" about her last week.',
    ],
    'stir-caught': [
      '{a} tries to turn {b} against {c}. {b} sees straight through it. "Nice try."',
      '{b} cuts {a} off mid-story. "I know what you are doing, and it is not working."',
    ],
    // Round 3: the holder answers.
    'holder-stall': [
      '{a} holds up her hands. "I have not decided. Please stop asking me."',
      '"I need to think," {a} says, and walks to the bar so nobody can follow her.',
    ],
    'holder-hope': [
      '{a} squeezes {b}\'s hand. "Don\'t worry about it." {b} starts to breathe again.',
      '"You are going to be fine," {a} tells {b} quietly. Everybody else pretends not to hear.',
    ],
    'holder-snap': [
      '{a} has had enough. "{b}, stop. You are making this harder, not easier."',
      '"Pushing me is not going to work," {a} tells {b}, and turns her back on her.',
    ],
    'holder-question': [
      '{a} asks {b} and {c} the only question that matters: "Why should it be you?" {w} has the better answer, and everybody hears it.',
      '"Give me one reason," {a} says to {b} and {c}. The room goes quiet. {w} gives her three.',
    ],
    counter: [
      '"With respect, I did more in {k} than you did," {a} tells {c}, and turns straight back to {b}.',
      '"Everybody has a sad story, {c}," {a} says. "I had the better runway, and {r} was not an easy category."',
      { fam: SEWING, line: '{a} does not let {c} finish. "My look was finished. Yours was not. Save the queen who showed up."' },
      { fam: SEWING, line: '"You glued half of that dress, {c}," {a} says. "I built mine."' },
      { fam: COMEDY, line: '"At least I got laughs in {k}," {a} tells {c}. "You got silence."' },
      { fam: COMEDY, line: '{a} cuts {c} off. "You had one joke tonight. I had a set."' },
      { fam: ACTING, line: '"I knew my lines, {c}," {a} says. "You were reading yours off your face."' },
      { fam: STAGE, line: '"I hit every mark in {k}," {a} tells {c}. "You were a count behind all night."' },
      { fam: STAGE, line: '{a} does not let {c} finish. "I carried my part of {k}. You hid in the back row."' },
    ],
    'clap-back': [
      '{a} does not let it slide. "Say that to my face, {c}." {c} does.',
      '"Funny, coming from you," {a} fires back at {c}. Somebody gasps.',
      '{a} turns around slowly. "{c}, you were in the bottom too. Sit down."',
    ],
    torn: [
      '{a} has two friends in the bottom, {b} and {c}. She tells the room she feels sick.',
      '{a} looks from {b} to {c} and says she wishes this were somebody else\'s call.',
    ],
  },

  /* ── THE CEREMONY ── on the stage, after Untucked. {h} holds the power,
     {x} the queen she is speaking to, {s} the queen saved. The beaver lines
     are the host's own, as the wiki quotes them. */
  ceremony: {
    invoke: {
      beaver: [
        '"{h}, you\'ve earned the power of the Golden Beaver." A pause. "Heavy is the hand who holds the Beaver. Who do you want to save from the chomping block?"',
        '"Heavy is the hand who holds the Beaver," the host says. "{h}, you\'ve earned its power. Who do you want to save from the chomping block?"',
      ],
      baguette: [
        '"{h}, the Golden Baguette is in your hands," the host says. "One of these three queens leaves this stage safe tonight. Who will it be?"',
        'The host turns to {h}. "The baguette chose you. Now you choose."',
      ],
    },
    speech: {
      friend: [
        '"{x}, you know how much I love you. That is what makes this so hard."',
        '"{x}. You have been my person in this competition."',
      ],
      rival: [
        '"{x}, we have not always seen eye to eye, and I am not going to pretend we have."',
        '"{x}, you and I both know how we feel about each other."',
      ],
      threat: [
        '"{x}, you are one of the strongest queens here. You know what that means tonight."',
        '"{x}, you do not need me. You have proven that all season."',
      ],
      pleaded: [
        '"{x}, what you said to me back there stayed with me."',
        '"{x}, I heard you. I really did."',
      ],
      neutral: [
        '"{x}, tonight was not your night, and you know that."',
        '"{x}, I watched you on that stage and I know you have more."',
      ],
      self: [
        '"And then there is me," {h} says. "Standing in the bottom with the power in my hand."',
      ],
    },
    suspense: [
      '{h} takes a breath. "The queen I am saving tonight is..."',
      'The stage goes silent. {h} looks down the line one more time.',
      '"I have made my decision," {h} says, and then makes everybody wait for it.',
    ],
    hostReact: [
      '"Well I\'ll be damned! {s}, you are out of the woods this week."',
      '"{s}, you are out of the woods this week."',
    ],
    reaction: {
      saved: [
        '{s} lets out a breath she has been holding since the call and mouths "thank you" to {h}.',
        '{s} crosses the stage and throws her arms around {h}.',
        '{s} covers her face with both hands. She is safe.',
      ],
      savedSelf: [
        '{s} steps out of the line and does not look back at the other two.',
      ],
      hurt: [
        '{x} stares at {h}. She thought they were friends.',
        '{x} nods, but her jaw is tight. She did not expect this from {h}.',
      ],
      bitter: [
        '{x} laughs once, without smiling. "Of course."',
        '{x} rolls her eyes. She saw this coming a mile away.',
      ],
      hopeBroken: [
        '{x} turns to {h}. "You told me not to worry."',
        '"Don\'t worry about it," {x} repeats under her breath, looking straight at {h}.',
      ],
      stoic: [
        '{x} squares her shoulders. Fine. She will lip sync.',
        '{x} looks straight ahead and says nothing at all.',
      ],
    },
    confessional: {
      holder: {
        friend: ['"I was always going to save my girl. Anyone who says they would not is lying."'],
        merit: ['"I saved the queen who least deserved to be in the bottom. That is the only fair call."'],
        strategy: ['"This is a competition. I kept the one I can beat and sent the other two to fight each other."'],
        plea: ['"What {s} said back there got to me. I hope I do not regret it."'],
        debt: ['"{s} saved me once. I pay my debts. That is who I am."'],
        self: ['"I was not going home holding my own lifeline. Obviously I saved myself."'],
      },
      snubbed: [
        '"{h} made her choice. I will remember it when it is my turn."',
        '"Fine. I am about to show {h} exactly what she did not save."',
        '"I will not forget this. Not tonight, not next week."',
      ],
    },
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
  return String(saveLineText(line)).replace(/\{([a-z])\}/g, (m, k) =>
    (vars[k] != null ? String(vars[k]) : m));
}

/** The text of a line, whichever shape it was written in. */
export const saveLineText = l => (typeof l === 'string' ? l : (l && l.line) || '');

/** The lines this week's challenge can carry: plain ones, and ones for its family. */
export function linesFor(list, fam = null) {
  return (Array.isArray(list) ? list : []).filter(l => typeof l === 'string' || !l?.fam || (fam && l.fam.includes(fam)));
}

export function pickSave(list, rng, fam = null) {
  const usable = linesFor(list, fam);
  if (!usable.length) return '';
  return usable[Math.floor(rng() * usable.length)];
}

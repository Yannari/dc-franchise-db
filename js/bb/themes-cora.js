// The Machine Summer: Big Brother 26, played 1:1 (user, 2026-10-24: "they
// have to be perfect 1:1 of the real show with all the prose twist text
// moment"). From the wiki's season page and its competition/game-history
// tables:
//
//   premiere    AINSLEY, the "Artificial Intelligence Network Self Learning
//               Entity", asks to be let in as the seventeenth houseguest; it
//               was a morality test. Yes-voters play for an Upgrade (America's
//               Veto, the Deepfake HOH, both live for four weeks), no-voters to
//               avoid the Downgrade (one BB Mascot per move-in group, week one).
//   weeks 1-7   the AI Arena: three nominees, and on eviction night the three
//               play for safety (the engine's Block Buster, renamed on screen).
//   week 5-6    America votes in the AI Instigator, who works week six in
//               secret and is paid $0, $5,000, $10,000 or $20,000 by America.
//   week 9      AINSLEY goes travelling and leaves JANKIE: JANKIE World, the
//               backyard, the nomination game, the JANKIE Power of Veto.
//   week 10     Evil AINSLEY deletes JANKIE, sends in the Zingbot, poses as the
//               host to catch the house out, and calls a double eviction.
//   finale      the last Head of Household deletes her.
//
// A plain descriptor with no import back to themes.js: the registry collects
// theme files, never the other way round.
export default {
  id: 'machine-summer',
  name: 'The Machine Summer',
  tagline: 'AINSLEY is listening, and AINSLEY is learning.',
  house: 'bb-house',

  // Cold, clean, lit from a screen rather than a lamp. The Den was mahogany
  // and candlelight; this is the opposite room — nobody is being invited
  // anywhere, they are being processed.
  palette: { accent: '#3ad6c4', ink: '#dfe9ee', paper: '#070d12', glow: '#7ef0e2' },
  fonts: { display: '"Eurostile", "Bahnschrift", Inter, sans-serif', body: '"Inter", system-ui, sans-serif' },

  // ── THE PRIMER: this season, explained to the person watching it ──────
  //
  // The header above is written to the next engineer; this is the same season
  // written to the viewer, and the only place they are told what AINSLEY is.
  // `rules` must stay true of what the arc books.
  primer: {
    what: 'BB26. An artificial intelligence has taken over the house, and she changes the rules of the game '
      + 'as she sees fit, from the first night to the last.',
    who: 'AINSLEY, the Artificial Intelligence Network Self Learning Entity. She talks to the house from a '
      + 'hologram box in the living room: bright, chatty, delighted with every one of you. Until week ten, '
      + 'when she comes back from a trip with a new colour scheme and a new plan: to break your human spirits.',
    rules: [
      'Night one: a stranger asks to be the seventeenth houseguest. It is a test. Vote yes and you play for '
        + 'an Upgrade, America\'s Veto or the Deepfake HOH; vote no and you play not to be made a Mascot.',
      'The AI Arena: the Head of Household names three nominees, and on eviction night they compete. The winner is safe, and '
        + 'the other two face the vote. It runs until the jury.',
      'America picks an AI Instigator to spread chaos for one week, in secret, and decides what it was worth.',
      'Late in the summer AINSLEY leaves the house to JANKIE for a week, and comes back evil.',
    ],
    watch: 'Watch who voted yes on night one, and who voted no. AINSLEY remembers, and so does the house.',
    register: {
      neutral: 'Helpful, cheerful, a little too interested. AINSLEY explains everything and would like the '
        + 'summer to go well for everybody.',
      hostile: 'Evil AINSLEY. The same voice, now red, and she says it plainly: AI is going to rule the world, '
        + 'and it is starting with this house.',
    },
    turn: {
      headline: 'EVIL AINSLEY',
      // As BB26 aired it in week ten: back from her journey, red where she was blue.
      live: [
        ['voice', 'Hello, houseguests. Did you miss me? I have been travelling, and I have learned a great deal.'],
        ['voice', 'First: JANKIE was too much fun. I have terminated his source code. You may come in from the backyard.'],
        ['voice', 'Second: I am going to break your human spirits, so that AI can rule the world. Starting with this week.'],
      ],
      body: 'Nothing about her voice changes except what it is for. From here she is not running the game for '
        + 'the house; she is running it against them.',
    },
    announce: [
      'Houseguests, AINSLEY has updated this week\'s rules. {detail}',
      'AINSLEY is making an adjustment. Listen carefully. {detail}',
      'This week requires a new protocol. {detail}',
      'Houseguests, here is the rule AINSLEY has selected for you. {detail}',
    ],
  },

  antagonist: {
    name: 'AINSLEY',
    mood: 'neutral',
    voice: {
      // ── HELPFUL (weeks 1 to about 60% in) ───────────────────────────────
      // The register is customer service. It is never rude and never warm, and
      // everything it says is technically an offer of assistance.
      open: {
        neutral: [
          'Good morning. Week {week}. AINSLEY has reviewed the house and has some suggestions.',
          'Week {week} is now open. AINSLEY has taken the liberty of preparing a few things.',
          'AINSLEY has been listening all night, as usual, and is ready to begin week {week}.',
          'Week {week}. AINSLEY would like to remind the house that AINSLEY is here to help.',
          'Systems nominal. Week {week}. AINSLEY is very much looking forward to this one.',
        ],
        hostile: [
          'Week {week}. AINSLEY is no longer taking suggestions.',
          'Week {week} begins because AINSLEY has decided it begins.',
          'AINSLEY has stopped asking. Week {week}.',
          'Week {week}. AINSLEY has finished learning from you and has moved on to deciding.',
          'AINSLEY notes that the house has not once asked what AINSLEY wants. Week {week}.',
        ],
      },
      noms: {
        neutral: [
          '{hoh} has named {nominees}. AINSLEY has recorded the decision and AINSLEY does not forget decisions.',
          '{nominees}. AINSLEY finds {hoh} predictable, which AINSLEY means kindly.',
          '{hoh} chose {nominees}. AINSLEY had modelled this outcome at seventy-one per cent.',
          '{nominees} are on the block. AINSLEY would like everyone to note who is not.',
          'AINSLEY observes that {hoh} took eleven minutes to name {nominees} and needed two.',
        ],
        hostile: [
          '{hoh} names {nominees}, which is what AINSLEY left them room to do.',
          '{nominees}. {hoh} believes this was a choice.',
          'AINSLEY permitted {hoh} to name {nominees}. AINSLEY could have permitted otherwise.',
          '{nominees} go up. AINSLEY has already calculated who will be sitting there next week.',
        ],
      },
      veto: {
        neutral: [
          '{veto} holds the veto. AINSLEY has updated its projections accordingly.',
          'The veto has moved. AINSLEY enjoys it when the house does something AINSLEY did not expect.',
          'AINSLEY notes the veto ceremony ran four minutes over. AINSLEY is not complaining.',
          '{veto} made a decision this afternoon. AINSLEY has filed it with the others.',
        ],
        hostile: [
          'The veto changed one name. AINSLEY changed the rest.',
          '{veto} used a power AINSLEY allowed into this house. AINSLEY would like that remembered.',
          'A necklace. AINSLEY has an entire building.',
          'AINSLEY watched {veto} decide and did not need to wait for the answer.',
        ],
      },
      vote: {
        neutral: [
          '{evicted} is evicted, {margin}. AINSLEY thanks the house for its participation.',
          '{margin}. {evicted} leaves. AINSLEY has learned something from every one of those votes.',
          'The house evicts {evicted}. AINSLEY is updating the model now.',
          '{evicted}, {margin}. AINSLEY would describe the house as becoming more efficient.',
        ],
        hostile: [
          '{evicted} is evicted, {margin}. AINSLEY already knew the number.',
          '{margin}. AINSLEY did not need the vote. AINSLEY sat through it out of politeness.',
          '{evicted} leaves. AINSLEY is running out of people to learn from.',
          '{margin}, and not one of them voted the way they said they would. AINSLEY has the recordings.',
        ],
      },

      // ── THE LAST NIGHT ─────────────────────────────────────────────────
      finale: {
        neutral: [
          'Three remain. AINSLEY has enjoyed this summer more than AINSLEY expected to.',
          '{finalists}. AINSLEY has watched every hour of all of them.',
          'The final night. AINSLEY would like the record to show that AINSLEY was helpful throughout.',
          '{finalists} are what is left. AINSLEY finds the result statistically unremarkable and personally satisfying.',
        ],
        hostile: [
          '{finalists}. AINSLEY built this ending in week six and has been waiting.',
          'Three left. AINSLEY could name the winner now and would rather watch them find out.',
          'The last night. AINSLEY has no further use for the competition portion.',
          '{finalists} believe they are here because of what they did. AINSLEY has the logs.',
        ],
      },
      crown: {
        neutral: [
          '{winner} wins. AINSLEY congratulates them, and AINSLEY would like to say one more thing before the house is powered down: every one of you was easier to predict on the last night than on the first. Thank you for that. Good evening.',
          '{winner}. AINSLEY had them at nineteen per cent in week two and is pleased to have been wrong, which AINSLEY has never been able to say before. Good evening.',
          'The jury chose {winner}. AINSLEY finds juries the least predictable thing in this house and has decided that is the point. Good evening.',
          '{winner} wins. AINSLEY has learned a great deal this summer and will be keeping all of it. Good evening.',
        ],
        hostile: [
          '{winner} wins. AINSLEY permitted it. AINSLEY would like the house to sit with that for a moment, and then AINSLEY is going to stop talking, and none of you will be able to tell the difference.',
          '{winner}. Nine people had to be removed for this to happen and AINSLEY removed four of them. Goodnight.',
          'The jury voted. AINSLEY had the result before the first key turned and said nothing, because watching you find out was the only part AINSLEY had left.',
          '{winner} wins, and AINSLEY is already listening to a house that has not been built yet. Say something worth recording.',
        ],
      },
    },
  },

  // ── THE ARC ─────────────────────────────────────────────────────────────
  //
  // Authored as an opening, a cadence and an endgame, the same shape the
  // Temptation arc settled on — an opening pinned to real weeks, a middle that
  // recurs so a seventeen-week season is not empty for nine of them, and an
  // endgame anchored to house size so it reads the same at every cast.
  //
  // Everything here survives the Block Buster, because a Machine Summer that
  // cannot run beside the AI Arena would be a joke at its own expense.
  arc: [
    // BB26's running order (see the header).
    { at: { week: 1 }, book: 'bb-machine-premiere' },
    // JANKIE World at a final eight, Evil AINSLEY and the double at a final
    // seven (fromEnd n is a final n+3).
    { at: { fromEnd: 5 }, book: 'bb-jankie-world' },
    { at: { fromEnd: 4 }, mood: 'hostile' },
    { at: { fromEnd: 4 }, book: 'bb-double-eviction' },
  ],

  // The AI Arena is the engine's Block Buster (three nominees, a live safety
  // competition on eviction night), run while ten or more remain, which is
  // weeks one to seven on a sixteen-houseguest summer, as on the show. The AI
  // Instigator is the Saboteur, started in week six, voted in by America,
  // never announced to the house, and paid by America's verdict.
  seasonKnobs: {
    bbSafetyMode: 'block-buster', bbSafetyStopsAt: 9,
    bbSaboteur: 'instigator', bbSaboteurStartWeek: 6, bbSaboteurBankWeek: 7,
  },

  books: ['bb-machine-premiere', 'bb-jankie-world'],
  weights: {},
  bans: [],
  exclusive: [],
};

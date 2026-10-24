// High Roller's: Big Brother 23, played 1:1 (user, 2026-10-24: "they have to
// be perfect 1:1 of the real show with all the prose twist text moment").
// From the wiki's season page and its Teams, Wildcard, BB Bucks and Game
// History tables:
//
//   weeks 1-4   four teams of four (Kings, Queens, Jokers, Aces): captains won
//               their move-in group, drafted two men and two women, and only
//               the captains played for the first HOH, whose winner turned
//               down Double or Nothing. A Head of Household's team is safe.
//               Each week the three other teams send one player each to the
//               Wildcard Competition: safety, at the price of a punishment.
//   week 5      no teams, no twist.
//   weeks 6-8   the High Roller's Room at the final eleven, ten and nine.
//               America votes BB Bucks those weeks only (100 / 75 / 50), and
//               the room sells the Veto Derby (50), then the Chopping Block
//               Roulette (125), then the Coin of Destiny (250).
//   weeks 9-10  two double evictions, final eight to six, then six to four.
//
// The Pit Boss is ours: BB23 had no voice of its own, and every theme here has
// one. He works the floor; he never says "the house", because every other
// surface in this simulator uses that phrase for the roster.
export default {
  id: 'high-rollers',
  name: "High Roller's",
  tagline: 'The drinks are comped. Every move is counted.',
  house: 'bb-resort',

  // ── THE FLAG THAT MAKES ANY OF THIS HAPPEN ────────────────────────────
  //
  // `js/bb/week.js` gates the weekly payout on `currentTheme()?.economy ===
  // 'bb-bucks'` — on the theme DECLARING a currency, not on its id, so a
  // second money season later needs a field rather than an `||`. It is a
  // capability, and it is the single most load-bearing line in this file:
  // delete it and the theme still registers, still speaks, still paints, and
  // pays nobody, silently, with nothing thrown anywhere.
  economy: 'bb-bucks',
  // BB23's money: paid only while the room was open (a house of eleven to nine), at the
  // broadcast's own 100 / 75 / 50, against the broadcast's prices (the Coin was 250).
  payoutWindow: [9, 11],
  payoutAmounts: [100, 75, 50],
  coinPrice: 250,
  // The rail bets were this simulator's invention, not BB23's.
  railBets: false,

  // Brass on black lacquer — a card room after hours, lit from the table up.
  // Deliberately NOT green: felt would be the obvious read and A Summer of
  // Mystery already owns green, and two themes sharing a surface means the
  // reader cannot tell you which season you are watching from a glance at it.
  // Gold is also the honest colour here, because the season is about the
  // money and not about the game the money buys into.
  palette: { accent: '#c9a227', ink: '#f2e6c8', paper: '#0b0708', glow: '#f0d585' },
  fonts: {
    // A display face with weight in it — the lettering on the chips and the
    // door, not the lettering on the menu.
    display: '"Copperplate Gothic Bold", Copperplate, "Cinzel", Georgia, serif',
    body: '"Inter", system-ui, sans-serif',
  },

  // ── THE PRIMER: this season, explained to the person watching it ──────
  //
  // The header above is written to the next engineer. This is the same season
  // written to the viewer, and it is the only place anybody is told what a Pit
  // Boss is — which is the question that started this whole slice.
  //
  // TWO RULES FOR EDITING THIS BLOCK.
  //   1. `rules` must be TRUE of the engine, and every line below was checked
  //      against the module that implements it: `bb-bucks.js` (the tiers, paid
  //      weekly), `side-bet.js` (the stake and that the odds favour the floor),
  //      `high-rollers-room.js` (money leaves on ENTRY, one seat per game per
  //      season), `veto-derby.js`, `chopping-block-roulette.js`,
  //      `coin-of-destiny.js` (the price, and that the winner runs the WEEK)
  //      and `wildcard.js` (drawn not chosen, and who the bill goes to).
  //      EVERY CARD THIS THEME BOOKS MUST APPEAR HERE. An audit found three
  //      that did not — the wrapped boxes, which this arc books more often than
  //      anything else, the double eviction, and the fact that the chip
  //      standings are shown to the VIEWER and not to the room. A card the
  //      viewer meets with no explanation is the whole reason this block was
  //      written in the first place.
  //   2. NEVER write "the house" here. Every other surface in this simulator
  //      uses that phrase for the roster of houseguests, so this antagonist
  //      says the floor, the room, the edge. A test sweeps this whole block.
  primer: {
    // LEAD WITH WHAT THE MONEY BUYS. The first version of this paragraph said
    // there was "a back room that will sell you something", and a viewer got
    // most of the way through a season without working out what the money was
    // for. Name the purchase, the price and what it does, in that order,
    // before saying anything clever about audiences.
    what: 'BB23. The first four weeks are a team game: four teams of four, and the Head of Household\'s '
      + 'team is safe. Past the halfway mark a back room opens, and America\'s money buys power in it.',
    who: 'The Pit Boss works the floor for an owner that never shows itself, never plays, and never '
      + 'loses. He is a floor manager and he is delighted you came. He comps the drinks, he learns '
      + 'your name, and he has been counting since the moment you sat down.',
    rules: [
      'Night one: you move in four at a time, and the winner of each group\'s competition becomes a '
        + 'Team Captain who drafts three teammates. Only the captains play for the first Head of Household, '
        + 'and the winner is offered Double or Nothing.',
      'For four weeks, whoever wins Head of Household keeps their whole team safe, and the three other teams '
        + 'each send one player to the Wildcard: the winner may take safety, and a punishment with it.',
      'At the final eleven the High Roller\'s Room opens for three weeks. America votes BB Bucks every one '
        + 'of those weeks: 100 for its top three, 75 for the next three, 50 for everybody else.',
      'The room sells one game a week, and you pay on the way in, win or lose: the Veto Derby for 50, '
        + 'the Chopping Block Roulette for 125, the Coin of Destiny for 250. Each game can be played once.',
      'The Coin of Destiny\'s winner calls a coin toss in secret. Call it right and they are the Head of '
        + 'Household for the rest of the week, naming the nominations and the replacement, and nobody is ever '
        + 'told who. The Head of Household they took it from stays safe and competes again next week.',
      'Then two double evictions, back to back.',
    ],
    watch: 'Watch who the captains pick on night one, and who they leave for last. Then watch who saved '
      + 'their BB Bucks and who spent them, because the Coin costs more than anybody is paid in one week.',
    register: {
      neutral: 'Hospitality. The drinks are comped, the floor is glad you came, and it is counting.',
      hostile: 'Accounting. The comps have stopped and the markers are being called in.',
    },
    turn: {
      headline: 'THE COMPS HAVE STOPPED',
      body: 'Nothing about the floor gets louder. The generosity simply ends and the arithmetic starts: '
        + 'the party lighting goes off, the counting lights come on, and every courtesy you were '
        + 'extended turns out to have been a line in a ledger somebody kept.',
    },
    announce: [
      'The floor has changed the terms of this week. {detail}',
      'A new game has been chalked up at the rail. Read it before you play it. {detail}',
      'The Pit Boss would like the room to know the rule. {detail}',
      'Management has posted an amendment. {detail}',
    ],
  },

  antagonist: {
    name: 'The Pit Boss',
    mood: 'neutral',
    voice: {
      // ── HOSPITALITY (weeks 1 to a little past halfway) ──────────────────
      //
      // A floor manager who is genuinely delighted you are playing. The
      // register is warmth with arithmetic underneath it: the drinks are
      // comped, the chairs are yours, nobody is being threatened, and the
      // floor has been counting since you walked in. Everything it offers is
      // real. That is what makes it work.
      open: {
        neutral: [
          'Week {week}. The floor is open, the drinks are comped, and the room is very glad you came.',
          'Good evening. Week {week}. Everything in this room is on the floor tonight. Enjoy yourselves.',
          'Week {week}. The Pit Boss knows your names, your seats and your totals. Make yourselves comfortable.',
          'Week {week} begins. Play boldly. Winners are always welcome at this table.',
          'Welcome to Week {week}. The floor hopes you enjoy your stay. Your drinks are comped; your wagers are not.',
        ],
        hostile: [
          'Week {week}. The comps have stopped. The Pit Boss is working the room with a ledger now.',
          'Week {week}. The bar is closed, and every outstanding marker is due.',
          'Week {week}. The floor is done extending courtesies. From here on, only the numbers matter.',
          'Week {week}. The complimentary drinks are over. The accounting begins.',
          'Week {week}. The room kept a record of every risk you took. Now it is balancing the books.',
        ],
      },
      noms: {
        neutral: [
          '{hoh} has seated {nominees}. The floor has no opinion and an excellent memory.',
          '{nominees} take the two chairs. The Pit Boss would like it noted that the drinks remain comped for both.',
          '{hoh} names {nominees}, and the room paid attention to the pause before the second one.',
          '{nominees}. Two chairs, one eviction vote, and an audience already placing its bets.',
        ],
        hostile: [
          '{hoh} seats {nominees}. The floor has already priced both of them.',
          '{nominees} take the two chairs. The floor only cares which one is still seated after the vote.',
          '{hoh} may control the nominations, but nobody controls how the cards fall.',
          '{nominees}. The floor has run the numbers, and neither of them should feel comfortable.',
        ],
      },
      veto: {
        neutral: [
          '{veto} takes the veto, and the floor is genuinely delighted.',
          'The veto goes to {veto}. A very good night at this table. The Pit Boss enjoys a good night.',
          '{veto} wins the veto tonight. The prize is safety; the price is everyone seeing them win it.',
          'The veto belongs to {veto}. A small advantage can change the whole game.',
        ],
        hostile: [
          '{veto} holds the veto. It does not change the count, it only changes the order.',
          'The veto to {veto}. A player winning one hand has never once bothered a floor.',
          '{veto} won the veto. The floor has already added that victory to everyone else\'s calculations.',
          '{veto} has the necklace. Safety is valuable precisely because it never lasts.',
        ],
      },
      vote: {
        neutral: [
          '{evicted} leaves, {margin}. The floor settles their tab and wishes them very well.',
          '{margin}. {evicted} cashes out, and the game goes on.',
          '{evicted} is evicted by a vote of {margin}. Popular with the audience did not mean safe in the room.',
          '{margin}, and {evicted} goes. The Pit Boss thanks them for their custom and means it.',
        ],
        hostile: [
          '{evicted} is evicted, {margin}. That marker is settled.',
          '{margin}. {evicted} was owed and has been collected. The floor is not cruel. It is only exact.',
          '{evicted} goes, and the count did not need the vote to be close, so it was not.',
          '{margin}. {evicted} leaves, while the players responsible remain comfortably seated.',
        ],
      },

      // ── THE LAST NIGHT ────────────────────────────────────────────────
      finale: {
        neutral: [
          '{finalists}. Three players remain, and only one can leave with the grand prize.',
          'The last night on the floor. {finalists} are still seated, and the drinks are still comped for exactly one more hour.',
          '{finalists}. The audience showed its hand every week. These three were clever enough to read it.',
          'Three remain. They survived every wager, every vote and every shift in the odds.',
        ],
        hostile: [
          '{finalists}. Every marker in this room comes due tonight, and only one of them gets to be settled in their favour.',
          'The last night. {finalists} are what is left after the count, and the count was never on their side.',
          '{finalists}. The Pit Boss has the ledger open. Three names, one payout, and a lot of arithmetic in between.',
          'Three chairs remain. The edge was never theirs; they only borrowed it when they could.',
        ],
      },
      crown: {
        neutral: [
          '{winner} wins. The floor pays out, offers its congratulations and closes the table. Goodnight.',
          'The jury awards the game to {winner}. The audience revealed its favorites all season, and tonight the players have revealed theirs. Goodnight.',
          '{winner} takes the cheque. The Pit Boss would like it on the record that the drinks were always comped and always counted. Goodnight from the floor.',
          '{winner} wins, and the room is already being reset for people who have not arrived yet. Safe travels.',
        ],
        hostile: [
          '{winner} wins. The floor is settled, the markers are closed, and not one of you asked all summer who was paying for the drinks. Goodnight.',
          'The jury pays {winner}. The Pit Boss is content to let somebody else carry the cheque out — the edge never leaves the room. Goodnight.',
          '{winner}. Every week, the audience told you exactly whom it was watching. That information was never a gift; it was another wager. Goodnight.',
          '{winner} wins. The count is closed. The room is not, and it never has been.',
        ],
      },
    },
  },

  // ── THE ARC: THE TURN, AND THE THREE NIGHTS THE FLOOR SELLS ─────────────
  //
  // The turn first, because it needs no engine — it is a register change: the
  // comps stop and the markers get called in. It sits a little
  // past halfway, which is where the broadcast opened the back room — the
  // point in the season where the money stopped being a novelty and started
  // being a position.
  //
  // Both anchor forms, and whichever resolves EARLIER is the one that sets the
  // mood; the other is a no-op on a mood already set. Do the arithmetic before
  // reading these as a rule and a fallback, because it is the other way round:
  // `frac: 0.55` lands on `round(0.55 × weeks)` and `fromEnd: 8` lands on
  // `weeks - 7`, so a nine-week season turns at week 2 against week 5, and a
  // fourteen-week season at week 7 against week 8. `fromEnd` is at or ahead of
  // `frac` on every season up to sixteen weeks, which makes it the PRIMARY
  // anchor in practice; `frac` only takes over at seventeen weeks and beyond.
  //
  // That is the design landing right rather than a misfire. `fromEnd: 8` is a
  // HOUSE-SIZE anchor wearing a calendar's clothes — eight from the end is a
  // final eleven, and a final eleven is precisely the room the broadcast opened
  // the back room to. On a short season the turn arriving early is correct: the
  // house got small early, so the money got serious early. `frac` stays for the
  // long seasons, where eight-from-the-end would leave the floor novelty-warm
  // most of the way through a season that stopped being a novelty months ago.
  //
  // ── WHY THE WRAPPED BOXES ARE ON WEEK ONE AND NOT WEEK THREE ──────────
  //
  // `themeScheduleEntries` is a RUNNING ORDER: an act whose week resolves at or
  // before the act above it is dropped, not shifted. Prizes and Punishments is
  // the only fixed-week act here and every act under it is end-anchored, so the
  // gap between them is the cast size — and the gap closes on a small house. At
  // a cast of twelve the season is nine weeks and `fromEnd: 8` IS week two; at
  // thirteen it is week three. Booked on week three, the first room night is
  // dropped on both of those casts and the floor opens at a final ten having
  // silently skipped the final eleven. Measured, at every cast from twelve to
  // twenty: week 3 loses a room night on casts 12 and 13, week 2 loses one on
  // cast 12, week 1 loses none.
  //
  // Week one is also where it belongs. The boxes are the theme's thesis stated
  // before anybody has a reason to distrust it — a veto competition that stops
  // awarding the veto and starts asking what you actually came here for, on the
  // one night the answer is still allowed to be "the money". Everything the
  // room charges for later is that same question with a price on it.
  arc: [
    // BB23's running order (see the header).
    { at: { week: 1 }, book: 'bb-teams' },
    { at: { week: 1 }, alongside: true, book: 'bb-wildcard' },
    { every: 1, from: 2, untilWeek: 4, untilFromEnd: 8, book: 'bb-wildcard' },

    { at: { fromEnd: 8 }, mood: 'hostile' },
    { at: { fromEnd: 8 }, book: 'bb-high-rollers-room', options: { game: 'veto-derby' } },
    { at: { fromEnd: 7 }, book: 'bb-high-rollers-room', options: { game: 'chopping-block-roulette' } },
    { at: { fromEnd: 6 }, book: 'bb-coin-of-destiny' },
    { at: { fromEnd: 5 }, book: 'bb-double-eviction' },
    { at: { fromEnd: 3 }, book: 'bb-double-eviction' },
  ],

  // No Block Buster on BB23.
  seasonKnobs: { bbSafetyMode: 'off' },

  books: ['bb-teams', 'bb-wildcard', 'bb-high-rollers-room', 'bb-coin-of-destiny', 'bb-double-eviction'],
  weights: {},
  bans: [],
  exclusive: [],
};

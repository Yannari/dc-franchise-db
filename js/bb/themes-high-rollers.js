// High Roller's.
//
// BB23's High Roller's Room, taken seriously. On the broadcast it was a late
// addition: a back room that opened past the halfway mark, where houseguests
// spent BB Bucks on a roulette wheel for safety and for the right to name a
// third nominee. The room is the famous part. The room is NOT the part that
// makes a season.
//
// The part that makes a season is the MONEY, and it arrives long before the
// room does. Every week America voted a payout to the entire cast in tiers —
// the top three, the next three, and everybody else — and the totals CARRIED
// and were ANNOUNCED. That is the twist nobody talks about, and it is the one
// this simulator has been missing a shape for:
//
//   it is an audience signal the room can read.
//
// Every other season here keeps the audience outside the glass. Popularity
// moves, the edit notices, and the houseguests never find out. Here the vote
// is read out on the floor every week, so a player who is being watched
// LEARNS they are being watched, and so does everybody standing next to them.
// A top-tier week is a target painted by strangers. That single fact
// changes how a room reads itself, and it needed no new room to do it.
//
// The economy is still the spine. What sits on top of it now is the FLOOR: the
// room the money buys into (`js/bb/high-rollers-room.js`, opened three times at
// the canon final eleven, ten and nine), the Coin bought on its own buy-in, and
// the wrapped-box veto that asks the casino's own question out loud on night
// one. Every id in `books` has an engine behind it and a dispatch in
// `js/bb/week.js`; a theme that books a card with nothing behind it ships a
// week where the timeline says something happens and nothing does, which is
// what `books: []` was protecting against while the room was unbuilt.
//
// ── THE ANTAGONIST, AND WHY IT IS TWO THINGS ────────────────────────────
//
// The House is the thing that always wins and never speaks. The Pit Boss is
// its mouth, working the floor.
//
// That split is not a flourish, it is a hard mechanical requirement. Every
// other surface in this simulator — `summariseWeek`, the backlog, the VP, the
// vote prose — says "the house" to mean the ROSTER: the twelve people playing.
// An antagonist who says "the house always wins" writes a sentence that is
// ambiguous in its own transcript, and it is ambiguous in exactly the way that
// matters, because the roster is who the line would be about. So the Pit Boss
// never says it. It says THE FLOOR, THE ROOM, THE EDGE, THE COUNT. A test
// holds the whole voice pool to that.
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
    what: 'A season you can buy your way out of trouble in. Every week the audience pays every '
      + 'houseguest, and that money is yours to keep until you spend it. Late on, the floor opens and '
      + 'starts selling: a bet on somebody else\'s veto for 50, a spin for 125 that can take you off '
      + 'the block, and finally the Coin of Destiny for 165, which hands you somebody else\'s whole week '
      + 'without ever telling them you took it. A season earns less than that list costs, so nobody buys '
      + 'everything. Everything else follows from that: what a payout is worth, who can afford the room '
      + 'when it opens, and who gambled away the price of a seat in July.',
    who: 'The Pit Boss works the floor for an owner that never shows itself, never plays, and never '
      + 'loses. He is a floor manager and he is delighted you came. He comps the drinks, he learns '
      + 'your name, and he has been counting since the moment you sat down.',
    // ORDERED THE WAY THE SEASON HAPPENS, not by importance. A viewer reads
    // this once, before week one, and then meets these cards in this order: the
    // payout every week from the start, the early-weeks cards, the floor's menu
    // in the order the floor sells it, and the endgame. An earlier draft led
    // with the two newest cards and pushed the payout — which is the thing
    // everything else is priced against — into the middle of the list.
    rules: [
      'The audience pays every houseguest every week — the top three get the most, the next three a '
        + 'little less, everybody else the floor rate. The result is announced, so the room learns '
        + 'each week who the audience loves.',
      'Money carries over and is never taken away. Saving is a strategy, and so is spending early.',
      'Any week, anybody may stake 10 at the rail on who they think is going home. Get it right and '
        + 'the floor pays; get it wrong and it is gone. The odds are the floor\'s, so betting loses '
        + 'money on average — but it is the only thing to do with a wallet before the room opens.',
      'Some weeks three houseguests are DRAWN, at random, before nominations — the Head of Household is '
        + 'not in the hat and nobody else volunteers for it. They compete, and whoever wins is offered '
        + 'safety for the week at a price: a punishment. About a third of the time that punishment is '
        + 'billed to everybody ELSE instead of to the winner. Taking it is said out loud in front of the '
        + 'people who will be serving it; turning it down costs nothing at all, and says a great deal.',
      'Some veto competitions do not award the veto. They set the order in which people pick a wrapped '
        + 'box, and the veto is in exactly one of them — the rest hold cash, trips and punishments, and a '
        + 'later picker can steal what somebody has already opened. It is this season asking its own '
        + 'question with the money made literal: what did you actually come here for?',
      'Three times late in the season a back room opens, and it sells one game a night. The first '
        + 'night is the Veto Derby, at 50: guess a number, finish in the top six, and you earn the '
        + 'right to back one of the six veto players. Back the one who wins and you hold a veto of '
        + 'your own — and you spend it BEFORE they spend theirs, so a Head of Household can lose two '
        + 'nominees in one meeting and have to refill the block twice.',
      'The nights after that sell the spin, for 125. Win it and you take a houseguest off the block '
        + '— yourself, or somebody you want to keep — and then a wheel picks their replacement at '
        + 'random. The Head of Household loses control of their own week, and because nobody chose '
        + 'the replacement, nobody can pin it on you.',
      'One week further on, the floor sells the last and dearest thing it has: the Coin of Destiny, at '
        + '165. Everybody who pays plays for it, one wins, and that one is taken somewhere with no camera '
        + 'and asked to call a coin toss. Call it right and you do not merely take the nominations — you '
        + 'ARE the Head of Household for the rest of the week, and you name the replacement at the veto '
        + 'meeting too. The Head of Household you took it from stays safe and competes again next week. '
        + 'Call it wrong and you have paid, played and lost in front of everybody.',
      'Nobody is ever told who called the toss. The room watched the money change hands, so it knows the '
        + 'list of everyone who wanted the week — and it will never know which of them got it.',
      'You pay on the way IN, and the game can beat you. Losing does not refund the seat — you can '
        + 'pay in full, in front of everybody, and walk out with nothing.',
      'Each game may be played once per houseguest, for the whole season, and a season earns less '
        + 'than the menu costs. Buying in is a door you close behind you — and the cheap game comes '
        + 'first, on the one night most of the room can still afford to walk through it.',
      'Near the end, the floor closes two tables in one night: a double eviction, played at speed, with '
        + 'the whole week — competition, nominations, veto and vote — run in a single sitting. Nobody '
        + 'gets days to count anything.',
      'One asymmetry worth knowing, because it is the only place this screen tells you more than the '
        + 'players get: YOU are shown what everybody is holding, week by week. They are not. They saw '
        + 'each payout read out and they saw who walked to the table, and from that they have to guess '
        + 'the rest — so a houseguest who looks broke may simply have been quiet.',
    ],
    watch: 'Watch who the audience pays and who it does not, because that is public from week one. Then '
      + 'watch who spends and who saves — the menu costs more than a season earns, so nobody gets to '
      + 'buy everything, and every purchase is somebody deciding what they came here for.',
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
          '{veto} takes the veto, and the floor is delighted for them. Genuinely.',
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
          '{margin}. {evicted} cashes out, and the game continues without them.',
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
    // The wrapped-box veto. Already built and wired (`js/bb/week.js` dispatches
    // it; `js/bb-events/prize-exchange.js` remembers who took the cash).
    { at: { week: 1 }, book: 'bb-prizes-and-punishments' },

    // ── THE CADENCE, WHICH THIS ARC SHIPPED WITHOUT AND SHOULD NOT HAVE ──
    //
    // Every other theme carries one — Mystery `every: 3, from: 6`, CORA and
    // Temptation `every: 3, from: 5` — and the engine grew the feature for a
    // measured reason: a fixed list of acts leaves a seventeen-week season
    // empty for six to nine weeks. This arc was a fixed list of five, four of
    // them end-anchored, so they clumped against the finale and left week one
    // alone at the front. At a cast of twenty that was an EIGHT-week dead
    // stretch before anything happened, reported off a real timeline.
    //
    // The boxes are the right card to repeat, for the same reason they open the
    // season: they are the casino's question wearing a veto competition, and
    // they cost the house nothing to run. CORA already uses them as its cadence
    // card, so this is the established shape rather than a new one.
    //
    // `untilFromEnd: 9` stops the run BEFORE the room's first night at
    // `fromEnd: 8`. The running order drops an act that resolves at or before
    // the act above it, so a cadence that ran any later would start eating room
    // nights on the small casts — the exact failure the week-one note below
    // this records.
    { every: 3, from: 3, untilFromEnd: 9, book: 'bb-prizes-and-punishments' },

    // ── THE WILDCARD, AND WHY IT SHARES THE CADENCE WINDOW ────────────────
    //
    // The early weeks were the arc's thinnest stretch and the boxes were
    // carrying them alone. This is the other half of BB23's season and it fits
    // the floor exactly: a name comes out of a hat, and safety is sold at a
    // price somebody else might be made to pay. It is the theme's thesis with
    // no money in it, which is what makes it work in the weeks before anybody
    // has any.
    //
    // `every: 2` against the boxes' `every: 3` in the same window is deliberate
    // and it does NOT double-book: the scheduler fires at most one card a week
    // and pushes the loser late rather than dropping it. `untilFromEnd: 9`
    // matches the boxes so neither cadence can reach the room's first night at
    // `fromEnd: 8` — the silent-drop failure the note above this records.
    { every: 2, from: 2, untilFromEnd: 9, book: 'bb-wildcard' },

    { at: { frac: 0.55 }, mood: 'hostile' },
    { at: { fromEnd: 8 }, mood: 'hostile' },

    // ── THE ROOM, THREE NIGHTS, AT THE HOUSE SIZES THE BROADCAST USED ────
    //
    // `fromEnd` 8/7/6 is a final eleven, ten and nine — the run the room ran on
    // the broadcast, and the reason the mood turn shares the eight anchor. They
    // are written as three separate acts rather than a `every: 1` recurrence so
    // each one carries its own `atHouse` and `reanchorThemeArc` can correct all
    // three independently against the house that is really standing.
    //
    // Three consecutive end-anchored bookings is more than any other theme asks
    // of that machinery, and it fires AT MOST ONE card a week, so a night that
    // skips a house size (a double eviction the user books) pushes the run late
    // rather than dropping any of it — the three nights still happen, in order,
    // one house smaller each. Measured across casts twelve to twenty.
    //
    // Each night is cheap for the house to attend and expensive to lose: the
    // seat is burned per houseguest whatever the result, so the room empties out
    // as the run goes on, which is the shape it should have.
    { at: { fromEnd: 8 }, book: 'bb-high-rollers-room' },
    { at: { fromEnd: 7 }, book: 'bb-high-rollers-room' },
    { at: { fromEnd: 6 }, book: 'bb-high-rollers-room' },

    // The Coin, one week after the room closes: the floor's last product, sold
    // on its own buy-in rather than out of the room, and priced at 165 against
    // the same ledger the room bills. It is deliberately the week AFTER the
    // wheel's last night — anybody who spent 125 on a spin has put this out of
    // reach, which is the choice the whole economy exists to force.
    //
    // NOT canon's 250; the reason is written beside the constant in
    // `js/bb/coin-of-destiny.js`, and it is measured rather than argued.
    { at: { fromEnd: 5 }, book: 'bb-coin-of-destiny' },

    // ── THE FLOOR SETTLES UP ─────────────────────────────────────────────
    //
    // The arc used to stop dead here, four or more weeks short of the finale.
    // Mystery, CORA and Temptation all book something at `fromEnd: 4`, and a
    // double eviction is what the Pit Boss's hostile register has been
    // promising since the comps stopped: the floor closing two tables in one
    // night and calling in what it is owed.
    //
    // It sits AFTER the room's run rather than inside it. A double takes TWO,
    // so booked any earlier it would shift the three room nights down a house
    // size each and cost them their canon final eleven / ten / nine.
    { at: { fromEnd: 4 }, book: 'bb-double-eviction' },

    // ── AND THE LAST HAND ─────────────────────────────────────────────────
    //
    // The arc used to stop at the double, two or more weeks short of the
    // finale, while Mystery, CORA and Temptation all carry something to
    // `fromEnd: 2`. The boxes are the right card to close on and it is the same
    // reason they open the season: at a final five, choosing five thousand
    // dollars over the only thing that could have saved you is the most
    // expensive version of this theme's question that the game can stage.
    //
    // Booked AFTER the double in this array because the running order drops any
    // act resolving at or before the one above it.
    { at: { fromEnd: 2 }, book: 'bb-prizes-and-punishments' },
  ],

  // What the arc owns, and what it deliberately leaves alone:
  //   books    — the three above. `tests/bb-themes.test.js` holds every id in
  //              here to `TWIST_CATALOG`, and each has an engine and a dispatch.
  //   weights  — the season's identity is the payout, not a twist affinity.
  //              Weighting cards this theme does not own would make it a
  //              flavour of the base game rather than a season about money.
  //   bans     — the economy collides with nothing. It adds a number to a week
  //              that already ran; every other twist runs on top of it intact.
  //   exclusive— nothing here is exclusive: the payout is the theme, and it is
  //              gated by `economy` rather than by a card only this theme has.
  books: ['bb-prizes-and-punishments', 'bb-wildcard', 'bb-high-rollers-room',
    'bb-coin-of-destiny', 'bb-double-eviction'],
  weights: {},
  bans: [],
  exclusive: [],
};

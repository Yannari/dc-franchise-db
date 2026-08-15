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
// a hundred to three of them, seventy-five to three more, fifty to everybody
// else — and the totals CARRIED and were ANNOUNCED. That is the twist nobody
// talks about, and it is the one this simulator has been missing a shape for:
//
//   it is an audience signal the room can read.
//
// Every other season here keeps the audience outside the glass. Popularity
// moves, the edit notices, and the houseguests never find out. Here the vote
// is read out on the floor every week, so a player who is being watched
// LEARNS they are being watched, and so does everybody standing next to them.
// A hundred-dollar week is a target painted by strangers. That single fact
// changes how a room reads itself, and it needed no new room to do it.
//
// So this theme ships the economy and only the economy. `books: []` is not an
// oversight — the wheel, the third chair and the safety purchase are a later
// plan, and a theme that books a twist with no engine behind it ships a week
// where nothing happens and nobody can tell why.
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

  // ── THE ARC: THE MOOD TURN, AND NOTHING ELSE ────────────────────────────
  //
  // No bookings. On purpose, and see the header: the wheel and the third chair
  // are a later plan, and a theme that books a card with no engine behind it
  // ships a week where the timeline says something happens and nothing does.
  //
  // What IS here is the turn, which needs no engine because it is a register
  // change: the comps stop and the markers get called in. It sits a little
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
  arc: [
    { at: { frac: 0.55 }, mood: 'hostile' },
    { at: { fromEnd: 8 }, mood: 'hostile' },
  ],

  // Empty, all four, and each for its own reason:
  //   books    — nothing to book yet (above).
  //   weights  — the season's identity is the payout, not a twist affinity.
  //              Weighting cards this theme does not own would make it a
  //              flavour of the base game rather than a season about money.
  //   bans     — the economy collides with nothing. It adds a number to a week
  //              that already ran; every other twist runs on top of it intact.
  //   exclusive— nothing here is exclusive: the payout is the theme, and it is
  //              gated by `economy` rather than by a card only this theme has.
  books: [],
  weights: {},
  bans: [],
  exclusive: [],
};

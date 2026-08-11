// A Summer of Mystery.
//
// BB27, and the reason it is the third theme rather than the tenth: it is the
// other season built AROUND the Block Buster. The user runs the Block Buster
// every season, and the wiki is explicit that BB27 kept it past the jury —
// "unlike last season, the twist did not end when jury began" — so this is a
// theme whose canon shape is the shape their seasons already have.
//
// The house was dressed as a hotel with hidden passageways and a hidden safe,
// and the season had an author inside it: The Mastermind kidnapped the host on
// night one, stole the HOH relic, and planted an accomplice in the cast. Then
// he left the house alone for two months and came back in Week 9 to run it.
//
// What makes it worth building is that last part. The Den escalates in mood and
// CORA escalates in mood; the Mastermind escalates in AUTHORITY. The wiki calls
// it "The Mastermind's Month of Mayhem": nine houseguests left, less than a
// month of show, and a stated goal of three on finale night. He collects three
// "sacrifices" to get there. Our arc can express that exactly, because an
// endgame anchored to house size IS a stated goal about how many people are
// left — the instant eviction takes one at a final nine and the double takes
// two at a final seven, which is three sacrifices and a final five, on any cast.
//
// Nothing here is a new mechanic. The three Week 2 powers were already on the
// shelf under their real names, the hidden safe is Something In This House, and
// the accomplice is the Saboteur — a hidden houseguest working against the room
// that is told only that one exists.
export default {
  id: 'summer-of-mystery',
  name: 'A Summer of Mystery',
  tagline: 'Every room in this hotel has a door you have not found.',
  house: 'bb-house',

  // A hotel after midnight rather than a haunted house: mauve and tarnished
  // gold, deco lettering, black that is slightly violet rather than neutral.
  // Deliberately nowhere near the other two — the Den is mahogany and brass,
  // CORA is a teal screen, and both go red-adjacent when they turn. This one
  // turns the other way: the colour DRAINS out of it, to bone and candle, for
  // the month the Mastermind is running the building.
  palette: { accent: '#b08bd6', ink: '#e6e0ee', paper: '#0b0910', glow: '#d8bff2' },
  fonts: {
    display: '"Bodoni MT", Didot, "Playfair Display", Georgia, serif',
    body: '"Inter", system-ui, sans-serif',
  },

  antagonist: {
    name: 'The Mastermind',
    mood: 'neutral',
    voice: {
      // ── THE FRONT OF HOUSE (weeks 1 to about two thirds in) ─────────────
      //
      // The register is a hotel that is too pleased to have you. It never
      // threatens and never explains, and everything it says is hospitality.
      open: {
        neutral: [
          'Week {week} at the hotel. Your rooms have been prepared. Some of them have been prepared twice.',
          'Good morning. Week {week}. The Mastermind trusts everybody slept.',
          'Week {week}. There is a door on the second floor that was not there on Sunday. Do enjoy your stay.',
          'The hotel welcomes you to week {week}. Please do not look for the staff. There are none.',
          'Week {week} begins. Something in this building already knows how it ends.',
        ],
        hostile: [
          'Week {week}. The Mastermind is downstairs now, and he is not checking anybody in.',
          'Week {week}. The month has started. Three of you do not finish it.',
          'The Mastermind has stopped hiding in the walls. Week {week}.',
          'Week {week}. There will be three people on the last night. He has said so, and he has never yet been wrong about a number.',
          'Week {week}. The hotel is his now. It always was, but now you can see it.',
        ],
      },
      noms: {
        neutral: [
          '{hoh} has named {nominees}. The Mastermind finds the choice illuminating.',
          '{nominees}. The hotel has noted the names, in a book nobody has found.',
          '{hoh} put up {nominees}, and did not ask who suggested it.',
          '{nominees} are on the block, and one of them has been in a room they should not have been in.',
        ],
        hostile: [
          '{hoh} names {nominees}. The Mastermind allowed that ceremony to happen.',
          '{nominees}. He has already decided which of them matters, and it is not the one you think.',
          'The block reads {nominees}. It will not read that by Thursday.',
          '{hoh} believes this week belongs to {hoh}.',
        ],
      },
      veto: {
        neutral: [
          '{veto} holds the veto, and the hotel is delighted for them.',
          'The veto has moved. Somewhere a door has locked that used to open.',
          '{veto} won something today. Whether they won the right thing is a separate question.',
          'A veto changes hands. The Mastermind enjoys the small ones.',
        ],
        hostile: [
          '{veto} has the veto. It is not the piece on this board that is moving.',
          'The veto went to {veto}. He let it.',
          'A necklace, at this stage. How touching.',
          '{veto} saved somebody. The Mastermind is counting to three, and that did not change the count.',
        ],
      },
      vote: {
        neutral: [
          '{evicted} is evicted, {margin}. The hotel is one room emptier and does not seem smaller.',
          '{margin}. {evicted} checks out. Their key still works — nobody has thought to test that.',
          'The house evicts {evicted}, {margin}. Somebody in that room voted the way they were told to and does not know it.',
          '{evicted} leaves on a {margin}. The Mastermind has no notes.',
        ],
        hostile: [
          '{evicted} is evicted, {margin}. That is one.',
          '{margin}. {evicted} was a sacrifice, and the house held the knife for him.',
          '{evicted} goes. The Mastermind did not need the vote to be close and it was not.',
          '{margin}. He is counting down, and you are helping.',
        ],
      },

      // ── THE LAST NIGHT ─────────────────────────────────────────────────
      finale: {
        neutral: [
          'Three left. The hotel has always known it would be three.',
          '{finalists}. The Mastermind has enjoyed watching the building work on them.',
          'The last night at the hotel. Every door is open now, which is its own kind of insult.',
          '{finalists} are what the summer left. Two of them still think they were never touched.',
        ],
        hostile: [
          '{finalists}. Three, on the night he said three. Do not mistake that for luck.',
          'The last night. The Mastermind took the people he came for and left you these.',
          '{finalists} are here because the count reached three, not because they were the best three.',
          'Three chairs. He built this ending in week nine and has been waiting in it since.',
        ],
      },
      crown: {
        neutral: [
          '{winner} wins. The Mastermind would like the record to show that he never once lied to this house — he simply never answered it. Goodnight from the hotel.',
          'The jury chose {winner}. Every one of them walked past the safe at least twice. Goodnight.',
          '{winner} takes it. There is a door on the second floor that nobody opened all summer, and there always will be. Goodnight from the hotel.',
          '{winner} wins, and the hotel is already being redressed for somebody else. Sleep well.',
        ],
        hostile: [
          '{winner} wins. He said there would be three on the last night, and there were three, and not one of you has yet asked how he knew. Goodnight.',
          '{winner}. The Mastermind took three out of this house himself and is quite content to let somebody else hold the cheque. Goodnight.',
          'The jury voted, and {winner} wins. He is not going to tell you which of you was working for him. That was the last room, and you never opened it.',
          '{winner} wins. Every door in this building is open now. Look at how few of you tried one.',
        ],
      },
    },
  },

  // ── THE ARC ─────────────────────────────────────────────────────────────
  //
  // Two months of hotel, then a month of the Mastermind.
  arc: [
    // Canon Week 2, and the powers are the real ones: the Secret Power
    // Competition hid three inside the Head of Household comp, and everybody
    // decided in private whether they were playing for the crown or for one of
    // them. All three were already on the shelf under their own names.
    { at: { week: 2 }, book: 'bb-secret-power-comp',
      options: { doors: ['hoh-interrogation', 'mystery-competitor', 'mystery-veto'] } },
    // A hidden safe in the foyer, and a hidden Diary Room door. Something In
    // This House is that twist already — a real power hidden in the building,
    // the house told only that it exists, and looking for it is a public act.
    { at: { week: 3 }, book: 'bb-hidden-power' },

    // The cadence, and it is the same card on purpose: the premise of the
    // season is that the hotel keeps things from you, and a hotel that hides
    // exactly one thing in July is not a mystery, it is an anecdote. Each one
    // expires unclaimed after four evictions, so an unpressed advantage
    // quietly becomes a story about the house being too frightened to look.
    { every: 3, from: 6, untilFromEnd: 6, book: 'bb-hidden-power' },

    // ── the turn: the Month of Mayhem ──
    //
    // The wiki dates it to Week 9 of a season whose jury had just opened, with
    // nine houseguests left. As a proportion that is about two thirds in, and
    // the backstop is a house size rather than a week for the same reason the
    // endgame is: nine left IS the cue, on any cast.
    { at: { frac: 0.66 }, mood: 'hostile' },
    { at: { fromEnd: 7 }, mood: 'hostile' },

    // ── the endgame: three sacrifices ──
    //
    // Stated outright on the broadcast — three taken out of the game so that
    // three would be left on finale night. Ours are the same three, at the same
    // house sizes, and they arrive by the arithmetic rather than by decree:
    //
    //   final nine  -> the special elimination takes one   (one)
    //   final seven -> the double eviction takes two       (three) -> final five
    //
    // The White Locust week: "by the end of their stay, one houseguest would
    // not be checking out". An instant eviction is a week that takes somebody
    // without the ceremonies, which is that, minus the guest star.
    { at: { fromEnd: 6 }, book: 'bb-instant-eviction' },
    // Canon Week 10, and it has to sit at a final seven rather than a final
    // six: it takes TWO, and the ending this arc is aiming at is a final five.
    { at: { fromEnd: 4 }, book: 'bb-double-eviction' },
    // AND THEN NOTHING, DELIBERATELY.
    //
    // The other two themes book a last twist at a final five. This one stops,
    // because the Mastermind's stated goal has been MET at that point — three
    // taken, three left to play for it — and a fourth device would say the
    // opposite of everything the count has been building. The last week of this
    // season is a normal week that the house cannot believe is a normal week,
    // which is the most this theme can do to them and the cheapest.
    //
    // The real season filled it with the Sanctum: the Mastermind ran Week 11
    // himself, moved every ceremony to a time of his choosing, and held the
    // eviction vote in public with voodoo dolls instead of keys. That is a card
    // we do not have — a PUBLIC eviction vote is not a reskin of anything on
    // the shelf — and it is the one piece of this season worth building new.
  ],

  // ── THE ACCOMPLICE ──────────────────────────────────────────────────────
  //
  // "One of the 16 new houseguests was actually in cahoots with The Mastermind
  // and helped them pull off the prior acts", and the house had to unmask them
  // or let them in as the seventeenth player. That is the Saboteur we already
  // have: one houseguest working against the room all season, the house told
  // that somebody is and never told who.
  //
  // Banked EARLY here, unlike the Machine Summer's. The accomplice's whole job
  // was night one and the days after it, and the unmasking vote came long
  // before the endgame — so the reveal lands while this theme is still being
  // hospitable, and the Month of Mayhem arrives into a house that already knows
  // it was played once.
  seasonKnobs: { bbSaboteur: 'random', bbSaboteurBankWeek: 4 },

  books: ['bb-secret-power-comp', 'bb-hidden-power', 'bb-instant-eviction'],
  weights: { 'bb-hidden-power': 1.8, 'bb-secret-power-comp': 1.5, 'bb-pandoras-box': 1.3 },
  bans: [],
  exclusive: [],
};

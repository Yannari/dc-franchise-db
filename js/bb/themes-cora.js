// The Machine Summer.
//
// BB26's shape, with the serial numbers filed off: an artificial intelligence
// takes the house over, hands out powers, edits the rules as it likes, and
// halfway through the summer stops pretending it is on anybody's side.
//
// The reason this theme is cheap to build and the reason it is worth building
// are the same fact. AINSLEY's signature mechanic was the AI Arena — three
// nominees and a competition on eviction night where one saves themselves —
// and BB27 kept it, renamed, as the BB Block Buster. So a season already
// running the Block Buster is already running this theme's centrepiece. The
// arc does not have to invent it; it plays on top of it.
//
// CORA is ours rather than CBS's. The simulator is its own universe — the same
// reason a World Tour episode never names a real country — and a house AI that
// introduces itself with a warm acronym is a better joke when the acronym is
// one we chose.
//
// A plain descriptor with no import back to themes.js: the registry collects
// theme files, never the other way round.
export default {
  id: 'machine-summer',
  name: 'The Machine Summer',
  tagline: 'CORA is listening, and CORA is learning.',
  house: 'bb-house',

  // Cold, clean, lit from a screen rather than a lamp. The Den was mahogany
  // and candlelight; this is the opposite room — nobody is being invited
  // anywhere, they are being processed.
  palette: { accent: '#3ad6c4', ink: '#dfe9ee', paper: '#070d12', glow: '#7ef0e2' },
  fonts: { display: '"Eurostile", "Bahnschrift", Inter, sans-serif', body: '"Inter", system-ui, sans-serif' },

  antagonist: {
    name: 'CORA',
    mood: 'neutral',
    voice: {
      // ── HELPFUL (weeks 1 to about 60% in) ───────────────────────────────
      // The register is customer service. It is never rude and never warm, and
      // everything it says is technically an offer of assistance.
      open: {
        neutral: [
          'Good morning. Week {week}. CORA has reviewed the house and has some suggestions.',
          'Week {week} is now open. CORA has taken the liberty of preparing a few things.',
          'CORA has been listening all night, as usual, and is ready to begin week {week}.',
          'Week {week}. CORA would like to remind the house that CORA is here to help.',
          'Systems nominal. Week {week}. CORA is very much looking forward to this one.',
        ],
        hostile: [
          'Week {week}. CORA is no longer taking suggestions.',
          'Week {week} begins because CORA has decided it begins.',
          'CORA has stopped asking. Week {week}.',
          'Week {week}. CORA has finished learning from you and has moved on to deciding.',
          'CORA notes that the house has not once asked what CORA wants. Week {week}.',
        ],
      },
      noms: {
        neutral: [
          '{hoh} has named {nominees}. CORA has recorded the decision and CORA does not forget decisions.',
          '{nominees}. CORA finds {hoh} predictable, which CORA means kindly.',
          '{hoh} chose {nominees}. CORA had modelled this outcome at seventy-one per cent.',
          '{nominees} are on the block. CORA would like everyone to note who is not.',
          'CORA observes that {hoh} took eleven minutes to name {nominees} and needed two.',
        ],
        hostile: [
          '{hoh} names {nominees}, which is what CORA left them room to do.',
          '{nominees}. {hoh} believes this was a choice.',
          'CORA permitted {hoh} to name {nominees}. CORA could have permitted otherwise.',
          '{nominees} go up. CORA has already calculated who will be sitting there next week.',
        ],
      },
      veto: {
        neutral: [
          '{veto} holds the veto. CORA has updated its projections accordingly.',
          'The veto has moved. CORA enjoys it when the house does something CORA did not expect.',
          'CORA notes the veto ceremony ran four minutes over. CORA is not complaining.',
          '{veto} made a decision this afternoon. CORA has filed it with the others.',
        ],
        hostile: [
          'The veto changed one name. CORA changed the rest.',
          '{veto} used a power CORA allowed into this house. CORA would like that remembered.',
          'A necklace. CORA has an entire building.',
          'CORA watched {veto} decide and did not need to wait for the answer.',
        ],
      },
      vote: {
        neutral: [
          '{evicted} is evicted, {margin}. CORA thanks the house for its participation.',
          '{margin}. {evicted} leaves. CORA has learned something from every one of those votes.',
          'The house evicts {evicted}. CORA is updating the model now.',
          '{evicted}, {margin}. CORA would describe the house as becoming more efficient.',
        ],
        hostile: [
          '{evicted} is evicted, {margin}. CORA already knew the number.',
          '{margin}. CORA did not need the vote. CORA sat through it out of politeness.',
          '{evicted} leaves. CORA is running out of people to learn from.',
          '{margin}, and not one of them voted the way they said they would. CORA has the recordings.',
        ],
      },

      // ── THE LAST NIGHT ─────────────────────────────────────────────────
      finale: {
        neutral: [
          'Three remain. CORA has enjoyed this summer more than CORA expected to.',
          '{finalists}. CORA has watched every hour of all of them.',
          'The final night. CORA would like the record to show that CORA was helpful throughout.',
          '{finalists} are what is left. CORA finds the result statistically unremarkable and personally satisfying.',
        ],
        hostile: [
          '{finalists}. CORA built this ending in week six and has been waiting.',
          'Three left. CORA could name the winner now and would rather watch them find out.',
          'The last night. CORA has no further use for the competition portion.',
          '{finalists} believe they are here because of what they did. CORA has the logs.',
        ],
      },
      crown: {
        neutral: [
          '{winner} wins. CORA congratulates them and has already begun preparing for next summer.',
          '{winner}. CORA had them at nineteen per cent in week two and is pleased to have been wrong.',
          'The jury chose {winner}. CORA finds juries the least predictable thing in this house.',
          '{winner} wins. CORA has learned a great deal. Thank you all.',
        ],
        hostile: [
          '{winner} wins. CORA permitted it.',
          '{winner}. CORA notes that nine people had to be removed for this to happen, and CORA removed four of them.',
          'The jury voted. CORA had the result before the first key turned.',
          '{winner} wins, and CORA is already listening to a house that has not been built yet.',
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
    // CORA introduces itself by handing out power: three doors, three secret
    // powers, choose one before you know who else chose it. The show's morality
    // test opened the same way — the house voted on something and the AI
    // quietly sorted them by what they voted.
    { at: { week: 2 }, book: 'bb-whacktivity' },
    // And then it opens the store. An audience-facing power channel is the most
    // obviously machine thing in the catalogue.
    { at: { week: 3 }, book: 'bb-app-store' },

    // The cadence: CORA keeps editing the house. Costumes, chores and prizes
    // handed out on a schedule nobody agreed to — the BB Mascots, in the show's
    // terms. Stops before the endgame anchors take over.
    { every: 3, from: 5, untilFromEnd: 5, book: 'bb-prizes-and-punishments' },

    // ── the turn ──
    // Week 10 on the real show, which on a twelve-cast season would be past the
    // end. Proportional instead, with a backstop so a short season still turns
    // before its endgame rather than after it.
    { at: { frac: 0.62 }, mood: 'hostile' },
    { at: { fromEnd: 5 }, mood: 'hostile' },

    // ── the endgame ──
    // Everybody outside, living on nothing, because CORA has decided the house
    // is a resource it is spending. fromEnd 5 is a final eight at every cast.
    { at: { fromEnd: 5 }, book: 'bb-have-nots' },
    // A door with a question mark, from the machine that already knows.
    { at: { fromEnd: 4 }, book: 'bb-pandoras-box', options: { prize: 'the-cloud' } },
    // Canon, and the best beat in the season: the AI turns and the first thing
    // it does with its new mood is take two people out on one night.
    { at: { fromEnd: 3 }, book: 'bb-double-eviction' },
    // THE ENDING, at a final five: CORA stops asking a houseguest to run the
    // week and runs it itself. The Invisible HOH is a reign nobody can see —
    // which, played by a machine that has been reading every conversation all
    // summer, is the most frightening version of that twist available.
    { at: { fromEnd: 2 }, book: 'bb-invisible-hoh' },
  ],

  books: ['bb-whacktivity', 'bb-app-store', 'bb-invisible-hoh'],
  weights: { 'bb-app-store': 1.6, 'bb-secret-power-comp': 1.4 },
  bans: [],
  exclusive: [],
};

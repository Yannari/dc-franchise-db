// Summer Camp: Big Brother 21, played 1:1 (user, 2026-10-24: "they have to be
// perfect 1:1 of the real show with all the prose twist text moment"). From the
// wiki's season page, its Game History table and the twist pages:
//
//   night one   the house elects a Camp Director (Jackson), who banishes four to
//               Hit The Road; the slowest (David) is evicted on the spot
//   weeks 1-3   everybody picks one of three Whacktivities, once; one opens a
//               week: Nightmare, then Chaos, then Panic (Ovi, Jack, Christie)
//   weeks 1-4   Camp Comeback: the first four evicted stay in the house, the
//               night-one evictee walking back in to join them, and battle for
//               one place back when the fourth arrives (Cliff)
//   week 4 on   Have-Nots, in the old Camp Comeback room
//   week 7      America's Field Trip (voted in week six): safe, chicken suit,
//               third nominee
//   week 9      America's Prankster and Prank Week (the Zingbot came too)
//   week 10     a double eviction, final seven to five
//
// ── THE ANTAGONIST ────────────────────────────────────────────────────
//
// The Head Counsellor. Relentlessly, unbearably delighted. Everything is an
// activity, everybody is having a wonderful summer, and nothing that happens
// here is anybody's fault because it is all in good fun.
//
// The register turn is the whole design, and it is the only one of the five
// that gets QUIETER rather than louder. The other themes escalate into
// something: red, alert red, bone, a steel count room. This one escalates into
// ABSENCE — the whistle stops, the activities stop being announced, and the
// camp is just a set of buildings in the woods at night with nobody in charge.
// A children's summer camp with the adults removed is the oldest horror
// setting there is, and it needs no new vocabulary to arrive: the Counsellor
// simply stops saying things.
export default {
  id: 'summer-camp',
  name: 'Summer Camp',
  tagline: 'Everybody is having a wonderful summer.',
  house: 'bb-compound',

  // Pine, canvas and late sun; then the same palette with the sun taken out of
  // it. Deliberately warm where High Roller's is cold and Mystery is drained —
  // this is the only theme whose neutral register is genuinely pleasant, which
  // is what makes the hostile one work.
  palette: { accent: '#fcd34d', ink: '#f4ead2', paper: '#12100a', glow: '#fde68a' },
  fonts: {
    // Hand-lettered, like a sign somebody painted for the noticeboard.
    display: '"Cabin Sketch", "Chalkduster", "Bradley Hand", Georgia, serif',
    body: '"Inter", system-ui, sans-serif',
  },

  // ── THE PRIMER ────────────────────────────────────────────────────────
  //
  // Same two rules as every other theme's: every line must be TRUE of the
  // engine, and every card the arc books must appear here. The guard in
  // `tests/bb-wildcard.test.js` holds High Roller's to that; this block is
  // written to the same standard so it can be brought under the same test.
  primer: {
    what: 'A season that opens by taking somebody out before it has started. On the first night, '
      + 'before there is a Head of Household or a nomination or a vote, the houseguests elect one of '
      + 'their own as Camp Director — and that person immediately has to name four people for a '
      + 'competition in the backyard, where the slowest is evicted on the spot. Everything else follows '
      + 'from that opening: a house that has already lost somebody, three people who survived being '
      + 'named together, and one very popular houseguest who is now the reason all of it happened.',
    who: 'The Head Counsellor runs the camp and could not be more pleased that you are all here. '
      + 'Everything is an activity. Everybody is having a wonderful summer. Nothing that happens at '
      + 'this camp is anybody\'s fault, because it is all in good fun, and you will be told so warmly '
      + 'and often — right up until the announcements stop.',
    rules: [
      'Night one, before anything else: the houseguests elect a Camp Director. Nobody competes for it. '
        + 'It is a vote taken by people who have known each other for one afternoon.',
      'The Camp Director then banishes four houseguests to Hit The Road, named out loud, and those four '
        + 'race in the backyard. The slowest is evicted on the spot, before anybody is Head of Household.',
      'In the first week everybody picks one of three Whacktivities, and five play each. One opens a week: '
        + 'Nightmare (it voids a nomination ceremony in the middle of the night), then Chaos (redraw the veto '
        + 'players), then Panic (hold a veto that also names the replacement). Winners are told in private.',
      'The first four voted out do not go home. They move into Camp Comeback: a camper\'s uniform, a bad '
        + 'bed, no competitions, no vote, no nominations, and the people who evicted them in the next room. '
        + 'When the fourth arrives, the four play for one place back in the game.',
      'Week seven: America sends three houseguests on a Field Trip. The winner is safe, the runner-up '
        + 'wears a chicken suit for the week, and the loser is the third nominee.',
      'Then Prank Week: America votes for a Prankster, who pranks the camp all week and names the second '
        + 'nominee. Late in the summer, a double eviction.',
    ],
    watch: 'Watch the person the camp elected. They were chosen on night one for being the least '
      + 'frightening person in the building, and the job made them point at four people before anybody '
      + 'had learned anybody\'s name. Then watch the campers — the ones who were voted out and are '
      + 'still sitting in the room while it happens.',
    register: {
      neutral: 'Announcements. The whistle, the activity board, and a great deal of enthusiasm.',
      hostile: 'Silence. The announcements have stopped and nobody has said why.',
    },
    turn: {
      headline: 'THE ANNOUNCEMENTS HAVE STOPPED',
      body: 'No whistle this morning. Nothing on the activity board, and nobody comes to explain why. '
        + 'The camp is exactly as it was — the cabins, the yard, the lake — and there is simply no '
        + 'longer anybody cheerfully in charge of it. What is left is a set of buildings in the woods '
        + 'and the people who were already living in them.',
    },
    announce: [
      'Campers! Gather round, there is a new activity on the board. {detail}',
      'The Head Counsellor has an announcement, and it is a fun one. {detail}',
      'Everybody to the yard, please. There has been an addition to the programme. {detail}',
      'Attention campers. Something new has been pinned to the noticeboard. {detail}',
    ],
  },

  antagonist: {
    name: 'The Head Counsellor',
    mood: 'neutral',
    voice: {
      // ── THE WHISTLE (weeks one to a little past halfway) ────────────────
      //
      // Genuinely, exhaustingly cheerful. Nothing is a threat, everything is an
      // activity, and the enthusiasm never once cracks — which is what makes
      // the second register land, because it is not anger. It is absence.
      open: {
        neutral: [
          'Good morning campers! Week {week}, and what a beautiful day for it.',
          'Rise and shine! Week {week} at camp, and there is a full programme on the board.',
          'Morning, everybody! Week {week}. The Head Counsellor hopes you all slept well in those bunks.',
          'Week {week} begins! Big activity week, lots to get through, and the weather is on our side.',
          'Campers! Week {week}. Let us all try to make this the best week of the summer so far.',
        ],
        hostile: [
          'Week {week}. No announcement this morning. The board is blank and nobody has come to fill it.',
          'Week {week}. Nobody blew the whistle today. The camp is awake anyway.',
          'Week {week}. There is no programme. There has not been a programme for some time now.',
          'Week {week}. The yard is empty at the hour the yard is never empty.',
          'Week {week}. Nothing is announced. The buildings are all still standing exactly where they were.',
        ],
      },
      noms: {
        neutral: [
          '{hoh} has picked {nominees} for the special activity. Everybody give them a big hand!',
          '{nominees}, you are on the list this week! Chin up — it is all part of the fun.',
          '{hoh} names {nominees}, and the Head Counsellor is sure there were very good reasons.',
          '{nominees} are up on the board. Remember campers, somebody has to be.',
        ],
        hostile: [
          '{hoh} names {nominees}. Nobody claps. Nobody was going to.',
          '{nominees} go on the board. The board is the only thing anybody still updates.',
          '{hoh} has chosen {nominees}, in a camp where nobody is left to say whether that is allowed.',
          '{nominees}. Two names, written up, in a yard with no counsellor in it.',
        ],
      },
      veto: {
        neutral: [
          '{veto} wins the veto! Wonderful effort out there today, really wonderful.',
          'The veto goes to {veto} — what a competitor. Give yourselves a round of applause, campers.',
          '{veto} takes it! That is exactly the camp spirit the Head Counsellor likes to see.',
          'Veto to {veto}. A terrific afternoon, and everybody had a lovely time.',
        ],
        hostile: [
          '{veto} has the veto. Nobody announces it. Everybody knows.',
          'The veto belongs to {veto}, and the camp absorbs that the way it now absorbs everything.',
          '{veto} won something today. There was nobody there to hand it over.',
          '{veto} holds it. It changes the week and changes nothing about the quiet.',
        ],
      },
      vote: {
        neutral: [
          '{evicted} is going home, {margin}. Let us all thank {evicted} for being a wonderful camper!',
          '{margin}. Safe travels, {evicted} — the camp will not be the same without you.',
          '{evicted} leaves us by a vote of {margin}. Everybody wave!',
          '{margin}, and {evicted} packs the trunk. What a summer it has been.',
        ],
        hostile: [
          '{evicted} is evicted, {margin}. Nobody says goodbye over the tannoy, because nobody is on it.',
          '{margin}. {evicted} goes, and the cabin has one more empty bunk in it than it had.',
          '{evicted} leaves. The camp does not mark it. The camp has stopped marking things.',
          '{margin}. One fewer, in a place that was always going to end up empty.',
        ],
      },

      // ── THE LAST NIGHT ────────────────────────────────────────────────
      finale: {
        neutral: [
          '{finalists}! Our final three campers. What a summer you have all had.',
          'Three left! {finalists}, you have been an absolute credit to this camp.',
          '{finalists} are the last three standing. The Head Counsellor could not be prouder.',
          'Final three: {finalists}. Everybody made it to the end of the summer, more or less.',
        ],
        hostile: [
          '{finalists}. Three people, in a camp that stopped being run weeks ago.',
          'The last night. {finalists} are what is left, and nobody has announced that either.',
          '{finalists}. The buses come in the morning whether anybody blows a whistle or not.',
          'Three remain. The lake is exactly where it was on the first day, and so are they.',
        ],
      },
      crown: {
        neutral: [
          '{winner} wins! Camper of the summer, and thoroughly deserved. Safe home, everybody!',
          'The jury crowns {winner}! What a wonderful summer this has been. Same time next year, campers.',
          '{winner} takes it! Everybody give {winner} a big camp cheer, and mind the step on the way out.',
          '{winner} is our winner. Pack your trunks, campers — the summer is over. Goodnight!',
        ],
        hostile: [
          '{winner} wins. Nobody announces it. The people in the room know, and that is everybody left.',
          'The jury pays {winner}. The camp closes, the way it was always going to close. Goodnight.',
          '{winner}. The first night, this place was full and somebody was in charge of it. Goodnight.',
          '{winner} wins, and in the morning the cabins are empty and the board is still blank.',
        ],
      },
    },
  },

  // ── THE ARC ───────────────────────────────────────────────────────────
  //
  // Authored order IS chronological, and an act resolving at or before the one
  // above it is REFUSED rather than shifted — so the fixed week-one card leads
  // and everything end-anchored follows.
  arc: [
    // BB21's running order (see the header).
    { at: { week: 1 }, book: 'bb-camp-director' },
    { at: { week: 1 }, alongside: true, book: 'bb-camp-comeback' },
    { at: { week: 1 }, alongside: true, book: 'bb-whacktivity',
      options: { doors: ['nightmare-power', 'veto-redraw', 'diamond-veto'], open: 'nightmare-power' } },
    { at: { week: 2 }, book: 'bb-whacktivity',
      options: { doors: ['nightmare-power', 'veto-redraw', 'diamond-veto'], open: 'veto-redraw' } },
    { at: { week: 3 }, book: 'bb-whacktivity',
      options: { doors: ['nightmare-power', 'veto-redraw', 'diamond-veto'], open: 'diamond-veto' } },

    // The Head Counsellor goes quiet from the Field Trip on (a proportional anchor as the backstop on a long cast).
    { at: { frac: 0.55 }, mood: 'hostile' },
    { at: { fromEnd: 7 }, mood: 'hostile' },
    { at: { fromEnd: 7 }, book: 'bb-americas-field-trip' },
    { at: { fromEnd: 5 }, book: 'bb-americas-prankster' },
    { at: { fromEnd: 4 }, book: 'bb-double-eviction' },
  ],

  // Have-Nots from week four, as BB21 ran them; no Block Buster.
  seasonKnobs: { bbHaveNots: 'every-week', bbHaveNotsFrom: 4, bbSafetyMode: 'off' },

  books: ['bb-camp-director', 'bb-camp-comeback', 'bb-whacktivity', 'bb-americas-field-trip', 'bb-americas-prankster', 'bb-double-eviction'],
  weights: {},
  bans: [],
  exclusive: [],
};

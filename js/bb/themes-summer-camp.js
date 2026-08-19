// Summer Camp.
//
// BB21, and the cheapest theme on the list to build because almost all of it
// was already here: `whacktivity.js` and `camp-comeback.js` shipped long before
// this file, both registered, both with engines. What the season was missing
// was its NIGHT ONE — and that turned out to be the only part worth writing
// from scratch, because it is the only twist in this catalogue that hands out
// power by ELECTION (`js/bb/camp-director.js`).
//
// ── THE SPEC'S TABLE WAS WRONG, AND THIS IS THE CORRECTION ─────────────
//
// The design doc listed BB21 as "Camp Director, Whacktivity, Camp Comeback,
// Prank Week". There is no Prank Week in BB21. The wiki gives four twists and
// this arc books the three that are real plus the competition that carries the
// first eviction:
//
//   Camp Director   night one, the house ELECTS one, who banishes four
//   Hit The Road    those four battle; the slowest is evicted before the
//                   first crown (built into the Camp Director act)
//   Whacktivity     weeks 1-3, five to a room, one secret power
//   Camp Comeback   evictees keep living in the house, then battle to return
//
// All three canon doors are real now. The Chaos Power is `veto-redraw` and the
// Panic Power is `diamond-veto`, both of which predate this theme; the Nightmare
// Power was built for it (`js/bb/nightmare-power.js`) and is the first thing in
// this engine that can UNDO a ceremony which has already happened. The arc asks
// for those three BY NAME through the schedule entry rather than taking the
// shelf's default first three — a Summer Camp running somebody else's powers is
// a camp skin rather than the season.
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
        + 'It is a vote taken by people who have known each other for one afternoon, so it goes to '
        + 'whoever seems warmest and least dangerous.',
      'The Camp Director then banishes FOUR houseguests to Hit The Road — named out loud, in front of '
        + 'everybody — and those four run a scramble in the backyard. The slowest is evicted '
        + 'immediately, before a single Head of Household has been crowned. The three who survive walk '
        + 'back inside bound together, and none of them has to wonder whose idea it was.',
      'The three doors hold three different powers and they are not equal. One VOIDS a nomination '
        + 'ceremony that has already happened: the camp is woken in the middle of the night, the two '
        + 'nominees come down, and the Head of Household has to name two different people on the '
        + 'spot with the first two now untouchable. One forces the veto players to be drawn again. '
        + 'One hands the veto winner a second veto that also takes the replacement nomination away '
        + 'from the Head of Household. None of the three is ever traced back to whoever won it.',
      'For the first few weeks, five houseguests at a time choose one of three doors and compete '
        + 'behind it for a secret power. You pick your door before you know who else picked it, so the '
        + 'power everybody wants is the one you have to beat four people for — and only one room opens '
        + 'each week, so the quiet door might be the only one that plays. Winners are told in private '
        + 'and the camp is told nothing, but everybody saw who walked in.',
      'The houseguests voted out early do not go home. They move into Camp Comeback — a camper\'s '
        + 'uniform, a bad bed, and no competitions, no vote and no nominations — and go on living '
        + 'alongside the people who evicted them. A camper has total information, no stake and nothing '
        + 'to lose, which makes them the only honest person in the building. When the last one arrives, '
        + 'all of them play for a single place back in the game.',
      'Late in the summer there is a double eviction: a whole week — competition, nominations, '
        + 'veto and vote — run in one sitting, with two campers going home in a single night and '
        + 'nobody given a day to count anything.',
      'Nothing at this camp is announced as a punishment. It is an activity, and you are going to enjoy '
        + 'it.',
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
    // Night one, and the only place it can ever run: `runCampDirector` is
    // gated to week 1 in `js/bb/week.js` because the election is a read of a
    // house that does not know itself yet.
    { at: { week: 1 }, book: 'bb-camp-director' },

    // Weeks 1-3 on the broadcast, and the cadence is what keeps the early
    // season busy — the same job the wrapped boxes do on High Roller's.
    // `untilFromEnd: 8` stops it well before the endgame: a secret power won at
    // a final seven is a different, much later twist than the one BB21 ran.
    // ── THE FIRST DOOR, THEN THE CAMPERS, THEN THE REST OF THE DOORS ──
    //
    // Written as week 2, week 3, and a cadence from week 4, rather than as one
    // cadence with Camp Comeback dropped into the middle of it. A recurrence is
    // expanded IN FULL before the next act is considered, and an act landing at
    // or before the one above it is refused — so a cadence running 2, 4, 6 with
    // a week-3 act listed under it does not interleave. The week-3 act is
    // simply refused, on every cast size, with only a console warning to say
    // so. Camp Comeback was being dropped from its own theme exactly that way.
    //
    // Canon order anyway: Whacktivity ran from week one, and Camp Comeback
    // opened after the second eviction.
    { at: { week: 2 }, book: 'bb-whacktivity',
    options: { doors: ['nightmare-power', 'veto-redraw', 'diamond-veto'] } },

    // The campers. It runs across the first four evictions from wherever it
    // starts, so it goes down early and wants room to finish.
    { at: { week: 3 }, book: 'bb-camp-comeback' },

    // And the rest of the doors, from the week after the campers move in.
    { every: 2, from: 4, untilFromEnd: 8, book: 'bb-whacktivity',
    options: { doors: ['nightmare-power', 'veto-redraw', 'diamond-veto'] } },

    // The announcements stop. Both anchor forms, and the EARLIER one turns the
    // season — on every cast up to sixteen weeks that is `fromEnd`, which is a
    // house size wearing a calendar's clothes and is the right instinct here:
    // the camp goes quiet when the camp gets small.
    { at: { frac: 0.55 }, mood: 'hostile' },
    { at: { fromEnd: 7 }, mood: 'hostile' },

    // A double eviction late, and the closing card at `fromEnd: 2` so the last
    // fortnight is themed — the gap High Roller's shipped with and had to be
    // sent back for. A double takes TWO, so it sits at 4 to leave 2 reachable.
    { at: { fromEnd: 4 }, book: 'bb-double-eviction' },
    { at: { fromEnd: 2 }, book: 'bb-whacktivity',
    options: { doors: ['nightmare-power', 'veto-redraw', 'diamond-veto'] } },
  ],

  books: ['bb-camp-director', 'bb-whacktivity', 'bb-camp-comeback', 'bb-double-eviction'],
  // The camp likes its own competitions. Nothing here is exclusive and nothing
  // is banned: every one of these composes with an ordinary week.
  weights: { 'bb-whacktivity': 1.6, 'bb-camp-comeback': 1.3 },
  bans: [],
  exclusive: [],
};

// The Cliques.
//
// BB11, and the first theme built on `js/bb/teams.js` — the assigned-group
// facility that did not exist until this season needed it. Everything else in
// this engine is a group you joined. This is a group you were PUT IN.
//
// ── WHY THE SEASON IS ABOUT ONE RULE ──────────────────────────────────
//
// The wiki gives it in a single sentence: "should a member of their clique win
// Head of Household, they would be immune from eviction that week." Four safe
// instead of one, three of them for nothing. Every ceremony all season, a Head
// of Household sits down to build a block and finds the name they wanted
// protected by a heading somebody typed on night one — and the block they
// build instead is the season.
//
// The rest of the arc is BB11's own, and almost all of it we already owned:
// the Have/Have-Not competition that replaced the food comp, an audience grant
// in the middle weeks (the broadcast's Coup d'Etat was America voting somebody
// a game-changing power, which is precisely what the Care Package channel is),
// and Pandora's Box late.
//
// ── THE ANTAGONIST, AND THE ONE THING IT DOES ─────────────────────────
//
// The Yearbook. It is not a person and it is not in charge of anything — it
// simply files people, cheerfully and permanently, under headings they did not
// pick. Its register is the superlative: Most Likely To, Best Dressed, Class
// Clown. A caption is a small cruelty because it is REDUCTIVE and because it
// is forever, and this house has been captioned since the first night.
//
// ── AND THE TURN, WHICH IS UNLIKE THE OTHER FIVE ──────────────────────
//
// Every other theme's hostile register is a mood: the Den flares red, CORA
// flares red, Summer of Mystery drains to bone, High Roller's goes fluorescent
// and Summer Camp goes SILENT. This one is not a mood at all. It is a SYSTEM
// FAILING.
//
// When the cliques dissolve, the Yearbook loses the only thing it could do.
// The headings stop applying, the captions stop fitting, and a book whose
// entire function was sorting people is left holding a list of names it cannot
// file. So the second register is not crueller — it is UNCERTAIN, which from
// something this confident is much worse, and the skin breaks the grid rather
// than changing its colour.
export default {
  id: 'cliques',
  name: 'The Cliques',
  tagline: 'You have been sorted. It was not put to a vote.',
  house: 'bb-house',

  // Laminated institutional blue — a corridor noticeboard under fluorescent
  // light. Deliberately the coldest NEUTRAL on the shelf: every other theme's
  // ordinary register is warm or at least alive, and this one is a filing
  // system, which should feel like one from the first week rather than only
  // after it turns.
  palette: { accent: '#7dd3fc', ink: '#e6f2fb', paper: '#0a0f16', glow: '#bae6fd' },
  fonts: {
    // A yearbook headline face, and a body face that looks typed rather than
    // written — nobody hand-wrote anybody's caption.
    display: '"Trade Gothic Bold Condensed", "Oswald", "Haettenschweiler", Impact, sans-serif',
    body: '"Inter", system-ui, sans-serif',
  },

  // ── THE PRIMER ────────────────────────────────────────────────────────
  //
  // Same two rules as every theme's. Every line must be TRUE of the engine —
  // checked against `js/bb/teams.js` (the sorting, the immunity, the
  // dissolution at a house size) — and EVERY CARD THE ARC BOOKS MUST APPEAR
  // HERE. The guard in `tests/bb-camp-director.test.js` is the pattern; an
  // audit found three unexplained cards on High Roller's and this block is
  // written to survive the same check.
  primer: {
    what: 'A season decided by a list somebody typed before anybody had played a hand. On the first '
      + 'night the house is sorted into four cliques — the Athletes, the Brains, the Populars and '
      + 'the Off-Beats — by who these people already are. Nobody applies, nobody is asked, and '
      + 'nobody can leave. Then one rule does the rest of the work: whenever a houseguest wins Head '
      + 'of Household, their entire clique is safe. Four people instead of one, and three of them '
      + 'for nothing.',
    who: 'The Yearbook is not in charge of anything and cannot be argued with. It files people. It '
      + 'has a heading for each of you and a caption underneath, both decided early, and it is '
      + 'delighted with how well everybody fits — right up until the day they stop fitting.',
    rules: [
      'On night one the house is sorted into four cliques, by archetype rather than at random, so '
        + 'the groups read as what they are the moment you see them. There is no competition and no '
        + 'vote. Nobody may change clique and nobody may leave one.',
      'THE RULE: whenever a houseguest wins Head of Household, every member of their clique is '
        + 'immune from eviction that week. Four safe instead of one. Three of them did nothing at '
        + 'all to earn it, and the Head of Household will often find the name they actually wanted '
        + 'is one of the three.',
      'A clique is not an alliance and never becomes one by itself. It pulls a little on who you '
        + 'would rather not nominate, well below anybody you actually chose — so a houseguest can '
        + 'spend a season being protected by three people they cannot stand, which is its own kind '
        + 'of week.',
      'Some weeks the house competes to avoid being a Have-Not, and the losers take slop, cold '
        + 'water and the worst beds in the building for the week.',
      'In the middle of the season the audience hands one houseguest something the rest of the room '
        + 'does not get a say in — the game-changing grant this format has always used to break a '
        + 'house that has settled.',
      'Late on, the Head of Household is offered Pandora\'s Box: open it and take whatever is '
        + 'inside, knowing the house takes something too. Only the Head of Household can open it, '
        + 'and only the Head of Household finds out what it cost.',
      'Near the end there is a double eviction — a whole week run in one sitting, two people gone '
        + 'in a night, and nobody given a day to count anything.',
      'The cliques do not last the season. Once the house is small enough they dissolve, and the '
        + 'protection everybody has been quietly relying on is gone in a single night. That is the '
        + 'week you find out who made real friends and who was only ever in a category.',
    ],
    watch: 'Watch who is safe without earning it, week after week, and watch what that does to them '
      + 'by the time it stops. Somebody in this house is going to reach the final five having never '
      + 'once needed a friend, and then need one.',
    register: {
      neutral: 'Filing. Everybody has a heading, everybody has a caption, and both were decided early.',
      hostile: 'Nothing fits. The headings have stopped applying and the book has no other function.',
    },
    turn: {
      headline: 'THE HEADINGS STOP APPLYING',
      body: 'The cliques are over. There is no announcement worth making about it, because the only '
        + 'thing that changed is that a list stopped being true — and the Yearbook, which has never '
        + 'done anything in this house except sort people, is left holding a page of names with '
        + 'nowhere to put any of them.',
    },
    announce: [
      'A notice has gone up on the board. It is not subject to appeal. {detail}',
      'The Yearbook has an amendment for this week\'s page. {detail}',
      'Attention, everybody. There is a new heading. {detail}',
      'Filed under this week, and read out so that nobody can say they were not told. {detail}',
    ],
  },

  antagonist: {
    name: 'The Yearbook',
    mood: 'neutral',
    voice: {
      // ── FILING (while the headings still work) ──────────────────────────
      //
      // Cheerful, administrative, and reductive. It is never cruel on purpose;
      // it simply believes that a person can be summed up in four words, and
      // it has already done it to everybody in the building.
      open: {
        neutral: [
          'Week {week}. Everybody is exactly where they were put, which is the nicest thing that can be said about a Tuesday.',
          'Week {week}. The headings are holding. Four groups, four captions, no appeals received.',
          'Week {week} opens with the house arranged in the order it was filed in. Very tidy. Very legible.',
          'Week {week}. Nobody has changed clique, because nobody can. The Yearbook finds this reassuring.',
          'Week {week}. Everybody in this house has a heading over their name, and most of them have stopped noticing it.',
        ],
        hostile: [
          'Week {week}. The headings do not apply any more and the page has not been reprinted.',
          'Week {week}. There are names here and no groups to put them under. That has never happened before.',
          'Week {week}. The Yearbook has one job and this morning it does not have it.',
          'Week {week}. Everybody is in the same category now, which is not a category.',
          'Week {week}. The captions were all written in week one. Not one of them is still accurate.',
        ],
      },
      noms: {
        neutral: [
          '{hoh} names {nominees}. Note that neither of them shares a heading with {hoh}, because neither of them could.',
          '{nominees} take the two chairs. The Yearbook observes that this block was decided as much by the sorting as by anybody in it.',
          '{hoh} nominates {nominees} — from what was left after an entire clique was taken off the table.',
          '{nominees}. Filed this week under nominated. It is not a permanent heading, but it is not nothing either.',
        ],
        hostile: [
          '{hoh} names {nominees}, and for the first time all season the block was not shaped by a list.',
          '{nominees} go up. No heading protected either of them, because there are no headings.',
          '{hoh} chose {nominees} entirely on their own, which is new, and which shows.',
          '{nominees}. Two names and no category to explain either of them.',
        ],
      },
      veto: {
        neutral: [
          '{veto} wins the veto. Filed under achieves things, which was already the caption.',
          'The veto goes to {veto} — consistent with the heading, which the Yearbook always enjoys.',
          '{veto} takes it. Some people do exactly what their caption says they will, all season, without ever noticing.',
          'Veto to {veto}. Underline that one; it is going in the book.',
        ],
        hostile: [
          '{veto} wins the veto and it says nothing about {veto} at all any more.',
          'The veto goes to {veto}. There is no heading left for that to be consistent with.',
          '{veto} takes it. File it under — well. Under {veto}, presumably.',
          '{veto} holds the veto. The Yearbook has stopped drawing conclusions from things.',
        ],
      },
      vote: {
        neutral: [
          '{evicted} is evicted, {margin}. The heading remains; only the person under it has gone.',
          '{margin}. {evicted} leaves, and a clique that was four is three, and it still protects the three.',
          '{evicted} goes by {margin}. Their caption was written in week one and stands unamended.',
          '{margin}, and {evicted} is filed under evicted, which is the last heading anybody gets.',
        ],
        hostile: [
          '{evicted} is evicted, {margin}. Nothing was standing in front of them this week.',
          '{margin}. {evicted} goes, and there is no group to be sorry about it as a group.',
          '{evicted} leaves. Whatever they were sorted as stopped mattering some weeks ago.',
          '{margin}. One fewer name, and still no way to arrange the ones that are left.',
        ],
      },

      // ── THE LAST NIGHT ────────────────────────────────────────────────
      finale: {
        neutral: [
          '{finalists}. Three left, and between them they have been carried by headings for most of a season.',
          'The last night. {finalists} — and the Yearbook notes, with interest, which cliques are represented and which are not here at all.',
          '{finalists}. Somewhere in week one, a list decided a great deal of this.',
          'Three remain, from four groups nobody chose to be in.',
        ],
        hostile: [
          '{finalists}. Three names and no headings, which is how this was always going to end.',
          'The last night. {finalists} got here on their own for the final few weeks, which is more than the first few can say.',
          '{finalists}. The book closed on the sorting some time ago; these three kept going without it.',
          'Three chairs. Whatever anybody was filed under in week one is not what got them into one.',
        ],
      },
      crown: {
        neutral: [
          '{winner} wins. Filed, finally, under winner — the only heading in this book that was earned rather than assigned. Goodnight.',
          'The jury crowns {winner}. Every caption in here was written on night one, and exactly one of them turned out to be prophecy. Goodnight.',
          '{winner} takes it. The Yearbook is closed, the headings are retired, and somewhere a list from week one is quietly wrong about everybody. Goodnight.',
          '{winner} wins, and gets the last page to themselves. Everybody else shares a column.',
        ],
        hostile: [
          '{winner} wins. There is no heading for that and there does not need to be. Goodnight.',
          'The jury pays {winner}. This house spent half a season being sorted and the other half finding out it did not matter. Goodnight.',
          '{winner}. Somebody typed four headings on night one and not one of them predicted this. Goodnight.',
          '{winner} wins, and the book goes back on the shelf with most of it crossed out.',
        ],
      },
    },
  },

  // ── THE ARC ───────────────────────────────────────────────────────────
  //
  // BB11's own season, with our cards standing in where they genuinely are the
  // same thing. Authored order IS chronological and an act resolving at or
  // before its predecessor is REFUSED — and a cadence expands IN FULL before
  // the next act is considered, so every fixed act below sits after the
  // cadence's last possible emission. `untilFromEnd: 8` is what keeps that
  // true at casts 14 through 20; `tests/bb-theme-arcs.test.js` is the guard.
  arc: [
    // Night one. The whole season hangs off this one card.
    { at: { week: 1 }, book: 'bb-cliques' },

    // BB11 replaced the food competition with the Have/Have-Not competition,
    // and it ran all season. A cadence rather than a fixed week for the reason
    // every cadence here exists: a fixed list leaves a long season empty.
    { every: 3, from: 3, untilFromEnd: 8, book: 'bb-have-nots' },

    // ── THE AUDIENCE BREAKS THE HOUSE OPEN ────────────────────────────────
    //
    // BB11 ran the Coup d'Etat in week 4 — America voting one houseguest a
    // game-changing power. We have no Coup CARD (it is a power on the shelf),
    // and the Care Package IS this format's audience-grant channel, so it is
    // the honest stand-in rather than a near neighbour: same hand, same
    // secrecy, same job of breaking a house that has settled into its groups.
    { at: { fromEnd: 6 }, book: 'bb-care-package' },

    // ── THE TURN IS THE DISSOLUTION ───────────────────────────────────────
    //
    // `teams.js` dissolves the cliques when the house reaches eight, and
    // `fromEnd: 5` IS a house of eight — so the register changes on the same
    // night the headings stop applying, which is the only week this theme's
    // turn could honestly land on. Both anchor forms, because a `frac` alone
    // lands after the endgame has begun on a short season.
    { at: { frac: 0.62 }, mood: 'hostile' },
    { at: { fromEnd: 5 }, mood: 'hostile' },

    // BB11 opened Pandora's Box in weeks 8 and 9 — late, twice, and only ever
    // by the Head of Household.
    { at: { fromEnd: 5 }, book: 'bb-pandoras-box' },
    { at: { fromEnd: 4 }, book: 'bb-double-eviction' },
    // And one last box, so the endgame is not unthemed — the gap High Roller's
    // shipped with and had to be sent back for.
    { at: { fromEnd: 2 }, book: 'bb-pandoras-box' },
  ],

  books: ['bb-cliques', 'bb-have-nots', 'bb-care-package', 'bb-pandoras-box',
    'bb-double-eviction'],
  // The season's identity is the sorting, not an affinity for particular
  // cards, so nothing is weighted up and nothing is banned: every other twist
  // composes on top of a house that happens to be in four groups.
  weights: {},
  bans: [],
  exclusive: [],
};

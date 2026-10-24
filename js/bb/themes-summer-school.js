// Summer School: Big Brother 11, played 1:1 (user, 2026-10-24: "they have to be
// perfect 1:1 of the real show with all the prose twist text moment"). From the
// wiki's season page, its twists list and its week-by-week history:
//
//   night one   twelve sorted into four cliques (Athletes, Populars, Brains,
//               Off-Beats); four past houseguests back one clique each, and the
//               clique that wins the first HOH (The Wedgie) brings its returnee
//               in as a houseguest and the first Head of Household (Jessie)
//   weeks 1-3   a Head of Household's whole clique is immune; the cliques are
//               disbanded before the week-four crown
//   weekly      the Have/Have-Not competition
//   week 4      America votes somebody the Coup d'État (Jeff, used in week 5)
//   weeks 8-9   Pandora's Box, at a final five and a final four
//   (no double eviction: week six's two rounds were Chima's expulsion)
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
// Every other theme's hostile register is a mood: the Den flares red, AINSLEY
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
  // The THEME is a season; the CARD it books is `bb-cliques`. They are
  // deliberately named apart: every other theme id here is a season name
  // (summer-of-temptation, machine-summer, summer-camp) while the mechanic
  // keeps its own. Calling both of them "cliques" made the config read as
  // a theme sitting next to a twist with the same name.
  id: 'summer-school',
  name: 'Summer School',
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
      'On night one the house is sorted into four cliques: the Athletes, the Brains, the Populars and the '
        + 'Off-Beats. Nobody chooses a clique and nobody may leave one.',
      'Four past houseguests wait outside, one for each clique. The clique that wins the first Head of Household '
        + 'competition brings its returnee in, as a houseguest and as the first Head of Household.',
      'THE RULE: whenever somebody wins Head of Household, their whole clique is immune that week. The cliques '
        + 'last three weeks, and are disbanded before the fourth crown.',
      'Every week the house competes to avoid being a Have-Not: slop, cold showers and the worst beds in the '
        + 'building for whoever loses.',
      'In week four America votes to give one houseguest the Coup d\'État: at a veto meeting they may overthrow '
        + 'the Head of Household\'s nominations and name their own. Only they are told.',
      'At the final five and the final four, the Head of Household is offered Pandora\'s Box: open it and take '
        + 'whatever is inside, knowing the house may pay for it.',
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
          '{hoh} chose {nominees} with no help at all, which is new, and which shows.',
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
    // BB11's running order (see the header).
    { at: { week: 1 }, book: 'bb-cliques', options: { returnees: true } },
    { at: { week: 4 }, book: 'bb-americas-coup' },

    // The Yearbook loses its headings the week the cliques are disbanded.
    { at: { week: 4 }, mood: 'hostile' },

    { at: { fromEnd: 2 }, book: 'bb-pandoras-box' },
    { at: { fromEnd: 1 }, book: 'bb-pandoras-box' },
  ],

  // The Have/Have-Not competition, every week; no Block Buster.
  seasonKnobs: { bbHaveNots: 'every-week', bbSafetyMode: 'off' },

  books: ['bb-cliques', 'bb-americas-coup', 'bb-pandoras-box'],
  // The season's identity is the sorting, not an affinity for particular
  // cards, so nothing is weighted up and nothing is banned: every other twist
  // composes on top of a house that happens to be in four groups.
  weights: {},
  bans: [],
  exclusive: [],
};

// Secret Story: the classic French format, played as a Big Brother MODE (user,
// 2026-10-24: "end it with secret story theme ... 1:1 of the real show").
//
// A theme only in the sense that it dresses the season and gives it a voice:
// the knob `bbSecretStory: 'on'` is what changes the game (js/bb/secret-story.js
// and its hooks in js/bb/week.js and js/bb-finale.js):
//
//   night one   every housemate has a secret and a kitty; the house is told
//               there are secrets, never whose
//   every week  an immunity competition; Diary Room nominations, one sex
//               against the other; the buzzer; the PUBLIC evicts
//   finale      the public crowns the winner, who takes their kitty
//
// No Head of Household, no veto, no jury. The secrets are real where the roster
// has something real (a tie between two housemates, a past season), and a role
// handed out by The Voice where it does not (a fake couple, fake siblings, a
// mission): never invented biography.
//
// A plain descriptor with no import back to themes.js: the registry collects
// theme files, never the other way round.
export default {
  id: 'secret-story',
  name: 'Secret Story',
  tagline: 'Everybody in this house is hiding something.',
  house: 'bb-house',

  // Night-blue and a single gold: a house of locked doors, lit from one screen.
  palette: { accent: '#e0b84a', ink: '#eef0f8', paper: '#070914', glow: '#f2d27a' },
  fonts: {
    display: '"Cinzel", "Trajan Pro", Georgia, serif',
    body: '"Inter", system-ui, sans-serif',
  },

  primer: {
    what: 'Secret Story. Every housemate walks in carrying a secret and a kitty of $10,000. Find somebody '
      + 'else\'s secret and their money is yours. The house nominates in the confessional, '
      + 'and the public decides who leaves and who wins.',
    who: 'The Voice. Nobody has ever seen it. It speaks from every room at once, calls housemates to the confessional, '
      + 'sets the rules and enforces them, and it knows every secret in the building.',
    rules: [
      'Every housemate has a secret, and the house is told only that the secrets exist. Some are real, two people the '
        + 'roster says are related or together, somebody who has played this franchise before. The rest are roles The '
        + 'Voice hands out: a fake couple, fake siblings, a secret mission.',
      'Press the buzzer and name somebody\'s secret, staking $5,000 of your kitty. Right, and you take their whole '
        + 'kitty and the secret is out. Wrong, and your stake goes to the person you accused, in front of everybody.',
      'Every week there is an immunity competition. The winner cannot be nominated.',
      'In the confessional the house nominates: one week the women name two men, the next the men name two women. The '
        + 'two most named face the public.',
      'The public eliminates, and on the last night the public chooses the winner, who leaves with their kitty.',
    ],
    watch: 'Watch who presses the buzzer and who never does. A wrong buzz tells the whole house who you suspect, and the '
      + 'public is watching every bit as closely as you are.',
    register: {
      neutral: 'Formal, calm, all-knowing. The Voice sets the rules and never raises itself.',
      hostile: 'The same voice, closer. Late in the game The Voice starts saying out loud how much it knows.',
    },
    turn: {
      headline: 'THE VOICE KNOWS',
      body: 'Nothing about The Voice changes except how much of what it knows it is willing to say in front of the house.',
    },
    announce: [
      'This is The Voice. {detail}',
      'Housemates, The Voice has a new rule for you. {detail}',
      'The Voice asks everybody to gather in the living room. {detail}',
      'Listen carefully. {detail}',
    ],
  },

  antagonist: {
    name: 'The Voice',
    mood: 'neutral',
    voice: {
      open: {
        neutral: [
          'This is The Voice. Week {week} begins. Every secret in this house is still where it was last night.',
          'Good morning, housemates. Week {week}. The buzzer is in its usual place.',
          'This is The Voice. Week {week}. Some of you slept well. Not the ones with the best secrets.',
          'Week {week}. The Voice reminds you that a kitty does not grow by itself.',
        ],
        hostile: [
          'This is The Voice. Week {week}. The Voice knows exactly who in this house is lying, and so, nearly, do you.',
          'Week {week}. There are fewer secrets left than there are people. Do the arithmetic.',
          'This is The Voice. Week {week}. Somebody in this room is one guess away from losing everything.',
          'Week {week}. The Voice has stopped wondering who will press the buzzer next.',
        ],
      },
      noms: {
        neutral: [
          'The confessional has spoken. {nominees} will face the public.',
          '{nominees}. The house has chosen; the public will decide.',
          'This is The Voice. {nominees} are nominated. The lines are now open.',
          'The house named {nominees} in private. The country will name one of them in public.',
        ],
        hostile: [
          '{nominees}. The house has said in private what it would never say to your faces.',
          'This is The Voice. {nominees} are nominated, and the public has been watching you for weeks.',
          '{nominees} face the public. The Voice suggests you think about how you have looked.',
          'The confessional names {nominees}. The Voice heard every reason given.',
        ],
      },
      veto: {
        neutral: [
          'The Voice decides the rules, and the public decides the rest.',
          'Nobody can save you from the nominations but the public.',
          'The Voice reminds you that a nomination in this house is final.',
          'Nominations stand. They always stand.',
        ],
        hostile: [
          'Nominations stand, as they always have.',
          'There is no way out of a nomination but the public.',
          'The Voice has never once cancelled a nomination to be kind.',
          'Nothing is changing tonight. Only the public can change it.',
        ],
      },
      vote: {
        neutral: [
          'The public has chosen. {evicted} leaves the house.',
          '{evicted}, the public has voted, and you must leave. Your secret goes with you, or it already went.',
          'This is The Voice. {evicted} is eliminated by the public.',
          '{evicted} leaves. The kitty stays where it was.',
        ],
        hostile: [
          '{evicted} leaves. The public was never fooled.',
          'The country has spoken: {evicted}. The Voice was not surprised.',
          '{evicted}. One fewer secret in the house tonight.',
          'This is The Voice. {evicted} is eliminated, and the house is smaller and quieter for it.',
        ],
      },
      finale: {
        neutral: [
          'This is The Voice. {finalists}. One of you will leave with your kitty, chosen by the country.',
          'The last night. {finalists}. The lines are open for the final time.',
          '{finalists} remain. The Voice has kept every one of your secrets as long as it could.',
          'Final night. {finalists}, the public has been watching all summer.',
        ],
        hostile: [
          '{finalists}. The Voice knows what each of you hid, and so, tonight, will everybody.',
          'The last night. {finalists}. Nothing in this house stays secret forever.',
          '{finalists}. The country has already decided. You are about to find out.',
          'Final night. {finalists}. The Voice has watched every one of your days, and it will not forget them.',
        ],
      },
      crown: {
        neutral: [
          '{winner} wins Secret Story. The Voice thanks you all, and wishes you a quiet life with nothing to hide.',
          '{winner}. The public has chosen. Take your kitty, and take your secret home.',
          'This is The Voice, for the last time. {winner} wins. Good night.',
          '{winner} wins Secret Story. The Voice will be listening to the next house.',
        ],
        hostile: [
          '{winner} wins. The Voice knew it would end like this, and it will not say since when.',
          '{winner}. The public chose you over every secret in this house. Good night.',
          'This is The Voice. {winner} wins Secret Story, and every lie told this summer is now just a story.',
          '{winner} wins. The house is empty, and The Voice is quiet. For now.',
        ],
      },
    },
  },

  arc: [
    // The Voice turns closer for the last stretch.
    { at: { frac: 0.62 }, mood: 'hostile' },
    { at: { fromEnd: 5 }, mood: 'hostile' },
  ],

  // The mode itself, and nothing from Big Brother that the format does not have.
  seasonKnobs: { bbSecretStory: 'on', bbSafetyMode: 'off', bbHaveNots: 'off', bbSaboteur: 'off' },

  books: [],
  weights: {},
  bans: [],
  exclusive: [],
};

// Summer of Temptation (BB19).
//
// The house is offered things all summer and the offer is free, which is what
// makes accepting a decision rather than a trade. The season's own cruelty is
// that the consequence does not land on the person who accepted it.
//
// A plain descriptor with no import back to themes.js — see the note there on
// why registration must not be circular.
export default {
  id: 'summer-of-temptation',
  name: 'Summer of Temptation',
  tagline: 'Every week, an offer. Somebody else pays for it.',
  house: 'bb-house',
  palette: { accent: '#c02040', ink: '#f3e8ea', paper: '#1a0a0e', glow: '#ff4d6d' },
  fonts: { display: '"Cinzel", Georgia, serif', body: '"Inter", system-ui, sans-serif' },
  antagonist: {
    name: 'The Den',
    voice: { open: { neutral: ['The Den is open.'] } },
  },
  arc: [],
  books: [],
  weights: {},
  bans: [],
  exclusive: [],
};

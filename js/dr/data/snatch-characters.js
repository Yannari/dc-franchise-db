// ══════════════════════════════════════════════════════════════════════
// dr/data/snatch-characters.js — thirty people who do not exist
// ══════════════════════════════════════════════════════════════════════
//
// FICTIONAL ARCHETYPES, never real people. This universe has no celebrities
// outside its own reality shows, which is the same rule the World Tour
// challenges follow about countries: the moment a real name appears, the
// simulator stops being its own world.
//
// An archetype works better than a name here anyway. "The Ageless Diva" tells
// a queen what the bit IS, and two seasons can book it without repeating a
// performance, because the queen playing it is the variable.
//
// Fields:
//   difficulty  1 easy, 5 a tightrope. Subtracted from the craft she brings.
//   needs       which stat carries the impression — a broad comic shape or a
//               character she has to actually act.
//   style       the drag style it suits. A match is worth more than any other
//               single term in the taping: the bit fitting the queen is the
//               whole game.
export const SNATCH_CHARACTERS = [
  { id: 'the-diva', name: 'The Ageless Diva', difficulty: 2, needs: 'comedy', style: 'glamour' },
  { id: 'talk-host', name: 'The Daytime Talk Host', difficulty: 2, needs: 'comedy', style: 'comedy' },
  { id: 'scream-queen', name: 'The Scream Queen', difficulty: 3, needs: 'acting', style: 'spooky' },
  { id: 'pop-brat', name: 'The Pop Brat', difficulty: 1, needs: 'comedy', style: 'club-kid' },
  { id: 'grande-dame', name: 'The Grande Dame of the Stage', difficulty: 4, needs: 'acting', style: 'broadway' },
  { id: 'weather-girl', name: 'The Local Weather Girl', difficulty: 1, needs: 'comedy', style: 'camp' },
  { id: 'fitness-guru', name: 'The Fitness Guru', difficulty: 2, needs: 'comedy', style: 'dancer' },
  { id: 'socialite', name: 'The Hotel Heiress', difficulty: 2, needs: 'comedy', style: 'glamour' },
  { id: 'crime-author', name: 'The True Crime Author', difficulty: 4, needs: 'acting', style: 'spooky' },
  { id: 'soap-villainess', name: 'The Soap Villainess', difficulty: 3, needs: 'acting', style: 'camp' },
  { id: 'chat-panellist', name: 'The Chat Show Panellist', difficulty: 3, needs: 'comedy', style: 'comedy' },
  { id: 'country-legend', name: 'The Country Legend', difficulty: 2, needs: 'comedy', style: 'pageant' },
  { id: 'runway-editor', name: 'The Runway Editor', difficulty: 4, needs: 'acting', style: 'fashion' },
  { id: 'child-star', name: 'The Grown Child Star', difficulty: 3, needs: 'comedy', style: 'camp' },
  { id: 'psychic', name: 'The Television Psychic', difficulty: 2, needs: 'comedy', style: 'spooky' },
  { id: 'girl-group-lead', name: 'The Girl Group Lead', difficulty: 2, needs: 'comedy', style: 'club-kid' },
  { id: 'cookery-host', name: 'The Cookery Show Host', difficulty: 1, needs: 'comedy', style: 'camp' },
  { id: 'first-lady', name: 'The Former First Lady', difficulty: 5, needs: 'acting', style: 'pageant' },
  { id: 'rock-widow', name: 'The Rock Widow', difficulty: 4, needs: 'acting', style: 'art' },
  { id: 'infomercial', name: 'The Infomercial Queen', difficulty: 1, needs: 'comedy', style: 'comedy' },
  { id: 'ballet-master', name: 'The Ballet Mistress', difficulty: 4, needs: 'acting', style: 'dancer' },
  { id: 'reality-mom', name: 'The Reality Show Mother', difficulty: 2, needs: 'comedy', style: 'glamour' },
  { id: 'jazz-singer', name: 'The Jazz Singer', difficulty: 3, needs: 'acting', style: 'broadway' },
  { id: 'gossip-columnist', name: 'The Gossip Columnist', difficulty: 3, needs: 'comedy', style: 'fashion' },
  { id: 'silent-star', name: 'The Silent Film Star', difficulty: 5, needs: 'acting', style: 'art' },
  { id: 'aerobics-queen', name: 'The Aerobics Queen', difficulty: 1, needs: 'comedy', style: 'dancer' },
  { id: 'opera-diva', name: 'The Opera Diva', difficulty: 5, needs: 'acting', style: 'broadway' },
  { id: 'game-show-host', name: 'The Game Show Host', difficulty: 2, needs: 'comedy', style: 'comedy' },
  { id: 'pageant-coach', name: 'The Pageant Coach', difficulty: 2, needs: 'comedy', style: 'pageant' },
  { id: 'club-legend', name: 'The Nightclub Legend', difficulty: 3, needs: 'comedy', style: 'club-kid' },
];

export const characterById = id => SNATCH_CHARACTERS.find(c => c.id === id) || null;

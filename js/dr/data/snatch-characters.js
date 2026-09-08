// ══════════════════════════════════════════════════════════════════════
// dr/data/snatch-characters.js — who is on the desk
// ══════════════════════════════════════════════════════════════════════
//
// ── REAL PEOPLE, BY EXPLICIT DECISION ─────────────────────────────────
//
// This file used to hold thirty invented archetypes, under the same rule the
// World Tour challenges follow about countries: no real names, because the
// moment one appears the simulator stops being its own world.
//
// That rule is OVERRULED HERE AND ONLY HERE, on the author's instruction. The
// Snatch Game is the one challenge whose whole premise is impersonating
// somebody the audience already knows — an invented archetype tells you what
// the bit IS but never who she is doing, and "she did the Ageless Diva" is a
// description of a Snatch Game rather than a Snatch Game. Every other show in
// this repo keeps the rule; if that ever changes it should change on purpose,
// the way this did.
//
// The archetypes did not go away. They are the `archetype` field, so the shape
// each impression belongs to is still there and several real people now live
// inside each one.
//
// ── FIELDS ────────────────────────────────────────────────────────────
//
//   difficulty  1 easy, 5 a tightrope, and NOT a penalty — see the taping in
//               js/dr/chal/snatch-game.js. It sets how wide the night is: an
//               easy impression lands near her craft almost every time, a hard
//               one is either the best thing on that desk or the thing that
//               ends her week. Measured across 120 tapings: easy sd 0.98,
//               bombs 7%, shines 6%; hard sd 1.53, bombs 18%, shines 21%.
//   needs       which stat carries it, and it really does carry it — the
//               taping weights her comedy and her acting differently
//               depending on this. `comedy` is a broad, loud, quotable shape.
//               `acting` is somebody she has to inhabit, where a voice alone
//               will not save her.
//   style       the drag style it suits. A match is worth more than any other
//               single term in the taping: the bit fitting the queen is the
//               whole game.
//   archetype   the shape of the bit, kept from the version of this file that
//               had no names in it.
//
// WHAT MAKES ONE HARD IS NOT FAME. A hard impression is one where the obvious
// version is not funny: a low, dry, still person gives a queen nothing to hide
// behind, and somebody the whole audience can already do in their head has to
// beat their version of her.
export const SNATCH_CHARACTERS = [
  // ── THE DIVAS ──────────────────────────────────────────────────────
  { id: 'cher', name: 'Cher', archetype: 'the ageless diva', difficulty: 2, needs: 'comedy', style: 'glamour' },
  { id: 'dolly-parton', name: 'Dolly Parton', archetype: 'the ageless diva', difficulty: 2, needs: 'comedy', style: 'camp' },
  { id: 'tina-turner', name: 'Tina Turner', archetype: 'the ageless diva', difficulty: 3, needs: 'comedy', style: 'glamour' },
  { id: 'diana-ross', name: 'Diana Ross', archetype: 'the ageless diva', difficulty: 3, needs: 'acting', style: 'glamour' },
  { id: 'celine-dion', name: 'Céline Dion', archetype: 'the ageless diva', difficulty: 2, needs: 'comedy', style: 'camp' },
  { id: 'shania-twain', name: 'Shania Twain', archetype: 'the ageless diva', difficulty: 3, needs: 'comedy', style: 'pageant' },

  // ── THE POP GIRLS ──────────────────────────────────────────────────
  { id: 'britney-spears', name: 'Britney Spears', archetype: 'the pop brat', difficulty: 1, needs: 'comedy', style: 'club-kid' },
  { id: 'lady-gaga', name: 'Lady Gaga', archetype: 'the pop brat', difficulty: 3, needs: 'acting', style: 'art' },
  { id: 'madonna', name: 'Madonna', archetype: 'the pop brat', difficulty: 3, needs: 'acting', style: 'club-kid' },
  { id: 'cardi-b', name: 'Cardi B', archetype: 'the pop brat', difficulty: 1, needs: 'comedy', style: 'club-kid' },
  { id: 'nicki-minaj', name: 'Nicki Minaj', archetype: 'the pop brat', difficulty: 2, needs: 'comedy', style: 'club-kid' },
  { id: 'lana-del-rey', name: 'Lana Del Rey', archetype: 'the pop brat', difficulty: 4, needs: 'acting', style: 'art' },
  { id: 'bjork', name: 'Björk', archetype: 'the pop brat', difficulty: 4, needs: 'acting', style: 'art' },
  { id: 'sia', name: 'Sia', archetype: 'the pop brat', difficulty: 3, needs: 'comedy', style: 'art' },

  // ── THE TALK SHOW DESK ─────────────────────────────────────────────
  { id: 'oprah-winfrey', name: 'Oprah Winfrey', archetype: 'the daytime talk host', difficulty: 2, needs: 'comedy', style: 'glamour' },
  { id: 'ellen-degeneres', name: 'Ellen DeGeneres', archetype: 'the daytime talk host', difficulty: 3, needs: 'comedy', style: 'comedy' },
  { id: 'wendy-williams', name: 'Wendy Williams', archetype: 'the daytime talk host', difficulty: 1, needs: 'comedy', style: 'glamour' },
  { id: 'judge-judy', name: 'Judge Judy', archetype: 'the daytime talk host', difficulty: 2, needs: 'comedy', style: 'comedy' },
  { id: 'martha-stewart', name: 'Martha Stewart', archetype: 'the daytime talk host', difficulty: 3, needs: 'acting', style: 'fashion' },

  // ── THE COMEDIANS ──────────────────────────────────────────────────
  { id: 'joan-rivers', name: 'Joan Rivers', archetype: 'the insult comic', difficulty: 2, needs: 'comedy', style: 'comedy' },
  { id: 'roseanne-barr', name: 'Roseanne Barr', archetype: 'the insult comic', difficulty: 3, needs: 'comedy', style: 'comedy' },
  { id: 'phyllis-diller', name: 'Phyllis Diller', archetype: 'the insult comic', difficulty: 3, needs: 'comedy', style: 'camp' },
  { id: 'tiffany-haddish', name: 'Tiffany Haddish', archetype: 'the insult comic', difficulty: 2, needs: 'comedy', style: 'comedy' },
  { id: 'lucille-ball', name: 'Lucille Ball', archetype: 'the physical comic', difficulty: 3, needs: 'acting', style: 'comedy' },
  { id: 'carol-burnett', name: 'Carol Burnett', archetype: 'the physical comic', difficulty: 4, needs: 'acting', style: 'comedy' },

  // ── THE SCREEN LEGENDS ─────────────────────────────────────────────
  { id: 'bette-davis', name: 'Bette Davis', archetype: 'the grande dame', difficulty: 4, needs: 'acting', style: 'broadway' },
  { id: 'joan-crawford', name: 'Joan Crawford', archetype: 'the grande dame', difficulty: 4, needs: 'acting', style: 'broadway' },
  { id: 'liza-minnelli', name: 'Liza Minnelli', archetype: 'the grande dame', difficulty: 3, needs: 'comedy', style: 'broadway' },
  { id: 'judy-garland', name: 'Judy Garland', archetype: 'the grande dame', difficulty: 4, needs: 'acting', style: 'broadway' },
  { id: 'elizabeth-taylor', name: 'Elizabeth Taylor', archetype: 'the grande dame', difficulty: 4, needs: 'acting', style: 'glamour' },
  { id: 'maggie-smith', name: 'Maggie Smith', archetype: 'the grande dame', difficulty: 5, needs: 'acting', style: 'broadway' },
  { id: 'marilyn-monroe', name: 'Marilyn Monroe', archetype: 'the blonde bombshell', difficulty: 3, needs: 'acting', style: 'glamour' },
  { id: 'mae-west', name: 'Mae West', archetype: 'the blonde bombshell', difficulty: 3, needs: 'comedy', style: 'camp' },
  { id: 'anna-nicole-smith', name: 'Anna Nicole Smith', archetype: 'the blonde bombshell', difficulty: 2, needs: 'comedy', style: 'camp' },

  // ── THE FASHION DESK ───────────────────────────────────────────────
  { id: 'anna-wintour', name: 'Anna Wintour', archetype: 'the ice queen', difficulty: 5, needs: 'acting', style: 'fashion' },
  { id: 'donatella-versace', name: 'Donatella Versace', archetype: 'the ice queen', difficulty: 2, needs: 'comedy', style: 'fashion' },
  { id: 'grace-jones', name: 'Grace Jones', archetype: 'the ice queen', difficulty: 4, needs: 'acting', style: 'art' },
  { id: 'iris-apfel', name: 'Iris Apfel', archetype: 'the eccentric expert', difficulty: 3, needs: 'comedy', style: 'art' },
  { id: 'vivienne-westwood', name: 'Vivienne Westwood', archetype: 'the eccentric expert', difficulty: 4, needs: 'acting', style: 'art' },
  { id: 'julia-child', name: 'Julia Child', archetype: 'the eccentric expert', difficulty: 2, needs: 'comedy', style: 'camp' },

  // ── THE REALITY CIRCUS ─────────────────────────────────────────────
  { id: 'paris-hilton', name: 'Paris Hilton', archetype: 'the hotel heiress', difficulty: 1, needs: 'comedy', style: 'club-kid' },
  { id: 'kim-kardashian', name: 'Kim Kardashian', archetype: 'the hotel heiress', difficulty: 2, needs: 'comedy', style: 'glamour' },
  { id: 'kris-jenner', name: 'Kris Jenner', archetype: 'the momager', difficulty: 2, needs: 'comedy', style: 'glamour' },
  { id: 'dina-lohan', name: 'Dina Lohan', archetype: 'the momager', difficulty: 3, needs: 'comedy', style: 'camp' },
  { id: 'nene-leakes', name: 'NeNe Leakes', archetype: 'the reality villain', difficulty: 2, needs: 'comedy', style: 'glamour' },
  { id: 'teresa-giudice', name: 'Teresa Giudice', archetype: 'the reality villain', difficulty: 2, needs: 'comedy', style: 'camp' },
  { id: 'gordon-ramsay', name: 'Gordon Ramsay', archetype: 'the shouting chef', difficulty: 2, needs: 'comedy', style: 'comedy' },
  { id: 'guy-fieri', name: 'Guy Fieri', archetype: 'the shouting chef', difficulty: 2, needs: 'comedy', style: 'club-kid' },
  { id: 'nigella-lawson', name: 'Nigella Lawson', archetype: 'the shouting chef', difficulty: 4, needs: 'acting', style: 'glamour' },

  // ── THE STRANGE AND THE SPOOKY ─────────────────────────────────────
  { id: 'elvira', name: 'Elvira', archetype: 'the scream queen', difficulty: 2, needs: 'comedy', style: 'spooky' },
  { id: 'morticia-addams', name: 'Morticia Addams', archetype: 'the scream queen', difficulty: 3, needs: 'acting', style: 'spooky' },
  { id: 'siouxsie-sioux', name: 'Siouxsie Sioux', archetype: 'the scream queen', difficulty: 4, needs: 'acting', style: 'spooky' },
  { id: 'stevie-nicks', name: 'Stevie Nicks', archetype: 'the witchy one', difficulty: 3, needs: 'comedy', style: 'spooky' },
  { id: 'florence-welch', name: 'Florence Welch', archetype: 'the witchy one', difficulty: 4, needs: 'acting', style: 'art' },
  { id: 'anjelica-huston', name: 'Anjelica Huston', archetype: 'the witchy one', difficulty: 4, needs: 'acting', style: 'spooky' },
  { id: 'yoko-ono', name: 'Yoko Ono', archetype: 'the art monster', difficulty: 5, needs: 'acting', style: 'art' },
  { id: 'marina-abramovic', name: 'Marina Abramović', archetype: 'the art monster', difficulty: 5, needs: 'acting', style: 'art' },

  // ── THE STAGE AND THE DANCE FLOOR ──────────────────────────────────
  { id: 'barbra-streisand', name: 'Barbra Streisand', archetype: 'the broadway belter', difficulty: 4, needs: 'acting', style: 'broadway' },
  { id: 'patti-lupone', name: 'Patti LuPone', archetype: 'the broadway belter', difficulty: 4, needs: 'comedy', style: 'broadway' },
  { id: 'debbie-allen', name: 'Debbie Allen', archetype: 'the choreographer', difficulty: 3, needs: 'comedy', style: 'dancer' },
  { id: 'martha-graham', name: 'Martha Graham', archetype: 'the choreographer', difficulty: 5, needs: 'acting', style: 'dancer' },
  { id: 'jane-fonda', name: 'Jane Fonda', archetype: 'the aerobics queen', difficulty: 2, needs: 'comedy', style: 'dancer' },
  { id: 'richard-simmons', name: 'Richard Simmons', archetype: 'the aerobics queen', difficulty: 1, needs: 'comedy', style: 'camp' },

  // ── THE PODIUM ─────────────────────────────────────────────────────
  { id: 'jackie-kennedy', name: 'Jackie Kennedy', archetype: 'the first lady', difficulty: 4, needs: 'acting', style: 'pageant' },
  { id: 'michelle-obama', name: 'Michelle Obama', archetype: 'the first lady', difficulty: 4, needs: 'acting', style: 'pageant' },
  { id: 'imelda-marcos', name: 'Imelda Marcos', archetype: 'the first lady', difficulty: 3, needs: 'comedy', style: 'fashion' },
  { id: 'margaret-thatcher', name: 'Margaret Thatcher', archetype: 'the iron lady', difficulty: 4, needs: 'acting', style: 'pageant' },
  { id: 'queen-elizabeth', name: 'Queen Elizabeth II', archetype: 'the iron lady', difficulty: 3, needs: 'comedy', style: 'pageant' },
  { id: 'sarah-palin', name: 'Sarah Palin', archetype: 'the local weather girl', difficulty: 2, needs: 'comedy', style: 'pageant' },
  { id: 'kathie-lee-gifford', name: 'Kathie Lee Gifford', archetype: 'the local weather girl', difficulty: 2, needs: 'comedy', style: 'camp' },
  { id: 'vanna-white', name: 'Vanna White', archetype: 'the game show host', difficulty: 2, needs: 'comedy', style: 'pageant' },
  { id: 'bob-barker', name: 'Bob Barker', archetype: 'the game show host', difficulty: 3, needs: 'comedy', style: 'comedy' },
];

export const characterById = id => SNATCH_CHARACTERS.find(c => c.id === id) || null;

/** Everybody who belongs to one shape of bit. */
export const charactersByArchetype = a => SNATCH_CHARACTERS.filter(c => c.archetype === a);

/** The archetypes, in the order they first appear. */
export const SNATCH_ARCHETYPES = [...new Set(SNATCH_CHARACTERS.map(c => c.archetype))];

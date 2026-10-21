// Iron Tower City (LEGS.txt 04-IRON-TOWER-CITY), 1:1 with the real show's episode 3 (the wiki's "French is an Eiffel
// Language", and the episode's captions the user gave as the goal): a cab from the airport to the iron tower; Botch or
// Watch, the partner who didn't do the last one draws a caricature of the other until the local artist approves ("it's
// too realistic", "it needs at least four exaggerations"); the catacombs, a maze of bone-lined tunnels where teams follow
// their noses to the cheese wheels and the tip; one wheel each, ridden down the river as a raft to the Chill Zone at the
// great museum (twenty minutes for a team that didn't ride all the way: one ate its raft, one carried it).
export default {
  id: 'iron-tower-city', name: 'Iron Tower City', recap: 'drawing each other, getting lost in a cave full of bones and cheese, and sailing down the river on a wheel of it',
  region: 'old-coast', map: { x: 47, y: 27 },
  arrive: 'airport', local: ['taxi', 'foot', 'boat'],
  stretches: [
    { id: 'tower-cab', kind: 'travel', mode: 'taxi', base: 35, cost: 30, plate: 'boulevard, cabs', label: 'Cab to the iron tower' },
    { id: 'caricature', judge: true, called: 'the iron tower', kind: 'botch', types: ['hands', 'people'], base: 14, pass: 0.5, loopCost: 7, opens: 480, closes: 1200,
      teaser: 'Who can draw?', plate: 'base of the iron tower, park', label: 'Botch or Watch: draw me',
      // the artist's rules at the easel; the partner sits and poses; the sketch (too realistic: torn up); the four
      // exaggerations (only three: torn up); the artist laughs and hands over the tip. a draws, b sits.
      stages: [{ id: 'the-easel', share: 0.4, risk: 0 }, { id: 'the-pose', share: 0.4, risk: 0 }, { id: 'sketch', share: 1.5, risk: 1 },
        { id: 'four-things', share: 0.8, risk: 0.8 }, { id: 'artist-laughs', share: 0.3, risk: 0 }],
      desc: "At the foot of the iron tower, a local artist sits at an easel with paper and charcoal. The partner who didn't do the last Botch or Watch must draw a caricature of the other, who sits and poses, and the artist only approves a real caricature: at least four exaggerations, nothing flattering. A drawing that is too realistic, too polite or just plain bad is torn up, and the artist starts a fresh sheet. When the artist finally laughs, the team gets the next tip." },
    { id: 'catacomb-walk', kind: 'travel', mode: 'foot', base: 15, cost: 0, plate: 'stone steps down', label: 'Down to the catacombs' },
    { id: 'catacombs', called: 'the catacombs', kind: 'allin', types: ['search', 'nerve'], base: 30, pass: 0.45, loopCost: 15, opens: 420, closes: 1260,
      plate: 'catacombs, bone walls', label: 'All-In: follow your nose',
      // down the manhole in the park (a nervous partner freezes on the ladder); the bone-lined tunnels, following the
      // smell (lost: in circles past the same skull); a dead end (back the way they came); the cheese wheels; out by
      // the river with one wheel each
      stages: [{ id: 'manhole', share: 0.4, risk: 0.2 }, { id: 'tunnels', share: 1.5, risk: 0.8 }, { id: 'dead-end', share: 1, risk: 1 },
        { id: 'the-cheese', share: 0.6, risk: 0 }, { id: 'way-out', share: 0.4, risk: 0 }],
      desc: "Under the city, the catacombs are a maze of narrow tunnels lined with old bones and skulls. Both partners go in together, and the only clue is a smell: the next tip is hidden among a pile of strong, cave-aged cheese wheels, so teams must follow their noses to the right exit. A dead end means going back the way they came, and the tunnels all look the same, so teams lose time walking in circles past the same skull. The team that finds the cheese takes one wheel each and the tip." },
    { id: 'cheese-raft', kind: 'travel', mode: 'boat', base: 30, cost: 0, plate: 'river, cheese rafts', label: 'Sail the cheese to the museum',
      // the real leg: one team forgot their oars; one partner ate the raft (twenty minutes); the Tennis Rivals carried
      // theirs on foot and went home
      ride: true, mishaps: [['no-oars', 20], ['eats-the-raft', 15]], mishapRate: 0.14,
      refuse: { identities: ['tennis-rivals'], kind: 'carries-the-cheese', slow: 1.6 } },
    { id: 'mat', kind: 'mat', plate: 'museum courtyard, pyramid mat', label: 'The Chill Zone' },
  ],
};

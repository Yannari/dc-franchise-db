// Treasure Isles (LEGS.txt 26-TREASURE-ISLES), 1:1 with the real show's "Bahamarama": search the pirate museum for a
// treasure map with the race's logo on it (two teams fought over one map and one lost its grip); jet skis out to the
// islands (one partner couldn't steer, and the other took over); Botch or Watch, dive the underwater tunnels with the map
// and find the bag of gold doubloons before the tank runs dry (one racer was claustrophobic, one ditched her tank and held
// her breath); back to the harbour and the Chill Zone on the beach.
export default {
  id: 'treasure-isles', name: 'Treasure Isles', recap: 'hunting through a pirate museum for a map and diving for gold',
  region: 'ocean', map: { x: 28, y: 47 },
  arrive: 'airport', local: ['taxi', 'boat', 'foot'],
  stretches: [
    { id: 'museum-cab', kind: 'travel', mode: 'taxi', base: 20, cost: 20, plate: 'harbour road', label: 'Cab to the pirate museum' },
    { id: 'pirate-map', called: 'the pirate museum', kind: 'allin', types: ['search'], base: 20, pass: 0.5, loopCost: 10, opens: 540, closes: 1080,
      plate: 'pirate museum interior, map shop', label: 'All-In: X marks the map',
      // into the museum; unrolling map after map (a plain one: back on the pile); a tug-of-war over one map with another
      // team (lost it); the map with the logo and the tip
      stages: [{ id: 'the-museum', share: 0.3, risk: 0 }, { id: 'unroll-maps', share: 1.2, risk: 1 }, { id: 'tug-of-war', share: 0.4, risk: 0.4 },
        { id: 'logo-map', share: 0.2, risk: 0 }],
      desc: "The pirate museum is crammed with old chests, ship's wheels, waxwork pirates and hundreds of rolled-up maps. Somewhere among them are the treasure maps for the race, each one marked with the race's logo. Both partners search together, unrolling map after map; a plain old map is no use and goes back on the pile. The team that finds a map with the logo on it takes it, along with the tip, and runs for the jet skis." },
    { id: 'jet-ski', kind: 'travel', mode: 'boat', base: 30, cost: 0, plate: 'open sea, jet skis', label: 'Jet ski to the islands',
      // the real leg: one partner couldn't steer the jet ski, and they had to swap
      ride: true, mishaps: [['cant-steer', 20], ['runs-dry', 25]], mishapRate: 0.14 },
    { id: 'doubloons', called: 'the underwater tunnels', kind: 'botch', types: ['water', 'search'], base: 20, pass: 0.5, loopCost: 12,
      teaser: 'Who can hold their breath?', plate: 'underwater cave, doubloons', label: 'Botch or Watch: dive for gold',
      // the tank on at the dock (won't go in); down into the water; the tunnels by the map (a wrong turn, low on air: back
      // up for a fresh tank); the bag of doubloons; surfacing with it. a dives, b waits in the boat
      stages: [{ id: 'tank-on', share: 0.3, risk: 0.3 }, { id: 'going-under', share: 0.3, risk: 0 }, { id: 'the-tunnels', share: 1.2, risk: 1 },
        { id: 'the-gold', share: 0.5, risk: 0.4 }, { id: 'surface', share: 0.3, risk: 0 }],
      desc: "Whoever is holding the tip straps on a mask and an air tank and dives into a maze of underwater tunnels, following the treasure map to a bag of gold doubloons. The partner waits in the boat above and can only watch the bubbles. The tank only holds so much air, so a diver who takes a wrong turn and runs low has to come back up for a fresh tank and start again. Surfacing with the bag of doubloons earns the next tip." },
    { id: 'harbour-run', kind: 'travel', mode: 'foot', base: 15, cost: 0, plate: 'harbour beach', label: 'Back to the harbour' },
    { id: 'mat', kind: 'mat', plate: 'harbour beach', label: 'The Chill Zone' },
  ],
};

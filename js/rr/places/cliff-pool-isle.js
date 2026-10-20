// Cliff Pool Isle (LEGS.txt 37-CLIFF-POOL-ISLE), the World Tour's island waterfall-and-bobsled leg as the frames show it:
// a minibus round the coast; the partner who didn't do the last Botch or Watch dives off the top of the waterfall into the
// lagoon, finds a small treasure chest on the bottom and carries it back up the cliff path (Botch or Watch); then both
// ride the island's homemade bobsled track three times, and their three runs together have to beat the clock (All-In);
// the Chill Zone is by the resort pool.
export default {
  id: 'cliff-pool-isle', name: 'Cliff Pool Isle', recap: 'diving off a waterfall for treasure and bobsledding on a tropical island',
  region: 'ocean', map: { x: 26, y: 49 },
  // a place being built: playable when booked, never drawn or offered until its lines, plates and music are in
  draft: true,
  arrive: 'airport', local: ['bus', 'foot'],
  stretches: [
    { id: 'coast-minibus', kind: 'travel', mode: 'bus', base: 35, cost: 15, plate: 'coast road, palms', label: 'Minibus round the coast',
      mishaps: [['goat-on-the-bus', 20]], mishapRate: 0.1 },
    { id: 'falls-dive', called: 'the falls', kind: 'botch', types: ['heights', 'water'], base: 20, pass: 0.45, loopCost: 10,
      teaser: 'Who is a strong swimmer?', plate: 'cliff falls + lagoon', label: 'Botch or Watch: the waterfall dive',
      desc: "At the top of a tall waterfall, the partner who didn't do the last Botch or Watch jumps off the rocks into the deep green lagoon below. On the bottom are a dozen small wooden treasure chests, and they have to bring one up and carry it all the way back up the slippery cliff path to their partner at the top. A refused jump, an empty-handed dive or a chest dropped on the climb means going back to the edge. The other partner can only watch from the top. A chest set down at the top of the falls earns the next tip." },
    { id: 'bobsled', called: 'the bobsled track', kind: 'allin', types: ['nerve', 'strength'], base: 30, pass: 0.5, loopCost: 10, opens: 420, closes: 1200,
      plate: 'bobsled track', label: 'All-In: the bobsled',
      desc: "On a hillside above the beach, the islanders have built a bobsled track out of concrete and painted wood, and every team gets a sled. Both partners push it off the start, jump in and ride it down the twisting track, three times, and their three times added together have to beat the target on the board. Tipping over, jumping in too late or three runs that add up too slow means trying a fresh set of three. A total under the target earns the next tip." },
    { id: 'pool-walk', kind: 'travel', mode: 'foot', base: 15, cost: 0, plate: 'resort gardens', label: 'Walk to the resort' },
    { id: 'mat', kind: 'mat', plate: 'resort pool', label: 'The Chill Zone' },
  ],
};

// Badlands (LEGS.txt 47-BADLANDS), the World Tour's dinosaur-country leg as the frames show it: a pickup out into the
// hoodoos; both partners dig dinosaur bones out of the hard ground with picks and brushes and build them into a skeleton
// a palaeontologist will accept (All-In); then the partner who didn't do the last Botch or Watch digs for a buried oil
// barrel at the drilling site, guessing where to dig from the map (Botch or Watch); the Chill Zone is at the night
// campfire.
export default {
  id: 'badlands', name: 'Badlands', recap: 'digging up dinosaur bones and building a skeleton, then hunting for buried barrels',
  region: 'north', map: { x: 15, y: 27 },
  // a place being built: playable when booked, never drawn or offered until its lines, plates and music are in
  draft: true,
  arrive: 'airport', local: ['drive', 'foot'],
  stretches: [
    { id: 'hoodoo-pickup', kind: 'travel', mode: 'drive', base: 40, cost: 20, plate: 'badlands road, hoodoos', label: 'Pickup into the badlands',
      mishaps: [['flat-in-the-canyon', 20]], mishapRate: 0.1 },
    { id: 'dino', called: 'the dig site', kind: 'allin', types: ['search', 'brains'], base: 40, pass: 0.45, loopCost: 15, opens: 420, closes: 1200,
      plate: 'badlands plain + skeletons', label: 'All-In: build a dinosaur',
      desc: "Across the striped hills of the dig site, dinosaur bones lie just under the surface. Both partners dig them out with pickaxes and brushes, carry them to a frame, and assemble a whole skeleton, skull, spine, ribs, legs and tail, in the right places. The palaeontologist inspects it. A bone in the wrong place, a missing bone or a skeleton that collapses means more digging or rebuilding. A complete skeleton she approves earns the next tip." },
    { id: 'oil-barrel', called: 'the drill site', kind: 'botch', types: ['strength', 'search'], base: 20, pass: 0.4, loopCost: 10,
      teaser: 'Who can dig?', plate: 'dig pit', label: 'Botch or Watch: the buried barrel',
      desc: "Beside an old drilling rig, a patch of ground is staked out in a grid, and somewhere under it is a buried oil barrel with the team's name on it. The partner who didn't do the last Botch or Watch reads the old map, picks a square, and digs. An empty hole means filling it in and picking another square. The other partner can only watch from the rig. The barrel dug up and rolled out of the pit earns the next tip." },
    { id: 'mat', kind: 'mat', plate: 'campfire', label: 'The Chill Zone' },
  ],
};

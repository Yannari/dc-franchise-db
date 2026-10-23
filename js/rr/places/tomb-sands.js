// Tomb Sands (LEGS.txt 29-TOMB-SANDS), from World Tour's first leg (the wiki's "Walk Like an Egyptian", parts 1 and 2),
// adapted for pairs: "Pyramid Over/Under", climb over the great pyramid and slide down the far side, or go under it
// through the tomb (three doors, each with a symbol; a trap that drops scarabs; something wrapped like a mummy); across
// the dunes by camel to the great river; build a boat out of reed bundles and cross the river past the crocodiles; the
// Chill Zone at the foot of the pyramid on the far bank.
export default {
  id: 'tomb-sands', sacred: true, name: 'Tomb Sands', recap: 'climbing over a pyramid or crawling under it, and floating past crocodiles on a boat made of reeds',
  region: 'desert', map: { x: 56, y: 40 },
  arrive: 'airport', local: ['taxi', 'camel', 'boat', 'foot'],
  stretches: [
    { id: 'tomb-cab', kind: 'travel', mode: 'taxi', base: 30, cost: 20, plate: 'desert road', label: 'Cab to the pyramids' },
    { id: 'pyramid', called: 'the great pyramid', kind: 'either', opens: 420, closes: 1140, plate: 'great pyramid, tomb hall', label: 'Over or Under',
      desc: "At the great pyramid, a Don Box offers two ways to the far side. Over means climbing the giant stone steps all the way to the top and getting down the other side, where a slip sends you back to the bottom to climb again. Under means going through the tomb: three doorways, each marked with a different symbol, only one of them leading out, and the wrong one ends in a dead end, a trap or a room full of scarab beetles. The first team out on the far side takes the next tip.",
      sides: [
        // the foot of the pyramid; climbing the giant steps (a slip: back to the bottom); the top; down the far side (a
        // tumble); the far side
        { id: 'over', label: 'Over', types: ['heights', 'strength'], base: 35, pass: 0.7, loopCost: 15,
          stages: [{ id: 'pyramid-foot', share: 0.2, risk: 0 }, { id: 'the-steps', share: 1.3, risk: 1 }, { id: 'the-top', share: 0.3, risk: 0 },
            { id: 'down-the-side', share: 0.6, risk: 0.5 }, { id: 'over-tip', share: 0.2, risk: 0 }] },
        // into the tomb (won't go in); the three doors (the wrong one); the dart corridor (a trap); the scarab room; out
        { id: 'under', label: 'Under', types: ['nerve', 'search'], base: 25, pass: 0.5, loopCost: 12,
          stages: [{ id: 'tomb-door', share: 0.3, risk: 0.2 }, { id: 'three-doors', share: 0.8, risk: 1 }, { id: 'dart-trap', share: 0.6, risk: 0.6 },
            { id: 'scarab-room', share: 0.5, risk: 0.5 }, { id: 'way-out', share: 0.2, risk: 0 }] },
      ] },
    { id: 'tomb-camel', kind: 'travel', mode: 'camel', base: 40, cost: 10, plate: 'dunes, camels', label: 'Camel to the river',
      // the real leg: one team got a camel, one a goat, one a stick; teams spoke to their camel in "camel"
      ride: true, mishaps: [['camel-sits', 20], ['scarab-swarm', 15]], mishapRate: 0.13 },
    { id: 'reed-boat', called: 'the river', kind: 'allin', types: ['hands', 'water'], base: 30, pass: 0.5, loopCost: 15,
      plate: 'riverbank, reed bundles, crocodiles', label: 'All-In: a boat of reeds',
      // gathering reeds on the bank; tying the boat (it falls apart); out on the river (sinking: swim back, build again);
      // past the crocodiles; the far bank
      stages: [{ id: 'the-reeds', share: 0.5, risk: 0 }, { id: 'tie-it', share: 1, risk: 0.6 }, { id: 'cast-off', share: 0.8, risk: 1 },
        { id: 'the-crocs', share: 0.5, risk: 0.5 }, { id: 'far-bank', share: 0.2, risk: 0 }],
      desc: "On the riverbank lie piles of reed bundles and coils of rope. Both partners must tie the reeds together into a boat that floats, then paddle it across the great river to the far bank, where the crocodiles sun themselves in the shallows. A boat that comes apart or sinks halfway across sends the team swimming back, past the crocodiles, to build another. The team that lands on the far bank with both partners still in the boat runs to the Chill Zone." },
    { id: 'mat', kind: 'mat', plate: 'pyramid foot', label: 'The Chill Zone' },
  ],
};

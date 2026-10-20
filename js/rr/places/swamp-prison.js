// Swamp Prison (LEGS.txt 14-SWAMP-PRISON), 1:1 with the real show's "Shawshank Ridonc-tion": both partners are locked
// in an old prison cell and must find one of the ways out (a spoon and a soft wall, a guard who can be talked round, a
// key in the cell, the air vent); then build a raft from what's lying on the swamp bank and sail it to the Chill Zone
// on the dock.
export default {
  id: 'swamp-prison', name: 'Swamp Prison', recap: 'breaking out of jail with a spoon and sailing home on a raft made of junk',
  region: 'ocean', map: { x: 23, y: 40 },
  arrive: 'airport', local: ['taxi', 'boat', 'foot'],
  stretches: [
    { id: 'bayou-taxi', kind: 'travel', mode: 'taxi', base: 40, cost: 25, plate: 'swamp road', label: 'Taxi to the old prison',
      mishaps: [['alligator-on-the-road', 15]], mishapRate: 0.08 },
    { id: 'prison-cell', called: 'the prison', kind: 'allin', types: ['brains', 'search'], base: 30, pass: 0.5, loopCost: 12, opens: 420, closes: 1200,
      plate: 'prison cell', label: 'All-In: the great escape',
      desc: "In an abandoned prison, a guard locks both partners in a cell, and there are four ways out: dig through the soft wall with a spoon, talk the guard into opening the door, find the key hidden somewhere in the cell, or squeeze up through the air vent. Every way out takes time, and a wrong guess (a wall that's solid, a guard who isn't buying it, a vent that's a dead end) means starting on another. Once a team is out of the cell and out of the gate, the next tip is waiting on the fence." },
    { id: 'swamp-raft', called: 'the swamp bank', kind: 'allin', types: ['hands', 'water'], base: 35, pass: 0.55, loopCost: 15, opens: 420, closes: 1260,
      plate: 'swamp water', label: 'All-In: the raft',
      desc: "On the bank of the swamp lies a pile of junk: barrels, planks, rope and old doors. Both partners build a raft out of it, then sail it down the slow brown river through the cypress trees to the Chill Zone on the dock. A raft that sinks, comes apart or drifts into the reeds means swimming back to the bank and building again. The first team to step off its raft onto the dock checks in." },
    { id: 'mat', kind: 'mat', plate: 'swamp dock pavilion', label: 'The Chill Zone' },
  ],
};

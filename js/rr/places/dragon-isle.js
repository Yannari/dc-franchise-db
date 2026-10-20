// Dragon Isle (LEGS.txt 19-DRAGON-ISLE), 1:1 with the real show's "Got Venom": a boat to the island; under the stilt
// huts, collect a vial of drool from a giant monitor lizard with a stick and a sponge (All-In); find the one rug with
// the race's mark on it in a mountain of woven cloth in the jungle (All-In); a run to the Chill Zone on the hill at
// sunset.
export default {
  id: 'dragon-isle', name: 'Dragon Isle', recap: 'collecting dragon drool and digging through a mountain of rugs',
  region: 'far-east', map: { x: 82, y: 58 },
  // a place being built: playable when booked, never drawn or offered until its lines, plates and music are in
  draft: true,
  arrive: 'airport', local: ['boat', 'foot'],
  stretches: [
    { id: 'isle-boat', kind: 'travel', mode: 'boat', base: 40, cost: 20, plate: 'harbour, wooden boat', label: 'Boat to the island',
      mishaps: [['engine-cuts-out', 20]], mishapRate: 0.08 },
    { id: 'venom', called: 'the stilt huts', kind: 'allin', types: ['nerve', 'patience'], base: 25, pass: 0.5, loopCost: 10, opens: 420, closes: 1200,
      plate: 'lizards under the stilt huts', label: 'All-In: the dragon drool',
      desc: "Under the stilt huts of the village, giant monitor lizards lie in the shade, and both partners have to fill a small glass vial with their drool. One partner holds the lizard's attention with a long forked stick while the other creeps in with a sponge on a pole, dabs its lip and squeezes the drool into the vial. A lizard that wakes up, hisses or charges sends the team running, and a spilled vial means starting again. A full vial shown to the ranger earns the next tip." },
    { id: 'rugs', called: 'the cloth pile', kind: 'allin', types: ['search', 'patience'], base: 30, pass: 0.45, loopCost: 10, opens: 420, closes: 1260,
      plate: 'log pile in the jungle', label: 'All-In: the race rug',
      desc: "In a clearing in the jungle sits a mountain of hand-woven rugs, hundreds of them, every colour and every pattern. Somewhere in the pile is one rug woven with the race's own mark, and both partners have to dig through, unroll and check them one by one until they find it. Bringing the weaver the wrong rug means going back to the pile. The right rug, unrolled at the weaver's feet, earns the next tip." },
    { id: 'hill-run', kind: 'travel', mode: 'foot', base: 20, cost: 0, plate: 'jungle trail', label: 'Run up the hill' },
    { id: 'mat', kind: 'mat', plate: 'hill mat at sunset', label: 'The Chill Zone' },
  ],
};

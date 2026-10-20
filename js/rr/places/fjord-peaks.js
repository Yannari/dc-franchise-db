// Fjord Peaks (LEGS.txt 16-FJORD-PEAKS), 1:1 with the real show's "Maori or Less": a train through the mountains to the
// junction; an Either/Or at the gorge bridge, bungee off it and snatch a fish out of the river with bare hands at the
// bottom (Jump Down), or learn the islanders' traditional challenge dance and perform it for the elders (Jump Around);
// a race to the Chill Zone by the lake.
export default {
  id: 'fjord-peaks', name: 'Fjord Peaks', recap: 'bungee jumping for a fish or learning a war dance at the gorge',
  region: 'far-east', map: { x: 93, y: 80 },
  arrive: 'airport', local: ['train', 'foot'],
  stretches: [
    { id: 'junction-train', kind: 'travel', mode: 'train', base: 45, cost: 20, plate: 'station platform', label: 'Train to the junction',
      mishaps: [['sheep-on-the-line', 20]], mishapRate: 0.08 },
    { id: 'jump-dance', called: 'the gorge bridge', kind: 'either', opens: 420, closes: 1260, plate: 'bungee bridge + dance stage', label: 'Jump Down or Jump Around',
      desc: "At the old bridge over the gorge, a Don Box offers two ways to the next tip. Jump Down means one partner bungee jumps off the bridge and, at the very bottom of the drop, grabs a fish out of the river with bare hands before the cord yanks them back up. Jump Around means both partners learn the islanders' traditional challenge dance, the stamping, the chants, the faces, and perform it in front of the elders. A jump that comes up empty-handed means another jump, and a dance the elders don't accept means more practice, and teams may switch. A fish in hand or the elders' nod earns the next tip.",
      sides: [
        { id: 'jump', label: 'Jump Down', types: ['heights', 'nerve'], base: 15, pass: 0.4, loopCost: 10 },
        { id: 'dance', label: 'Jump Around', types: ['perform', 'patience'], base: 35, pass: 0.65, loopCost: 10 },
      ] },
    { id: 'lake-run', kind: 'travel', mode: 'foot', base: 20, cost: 0, plate: 'lakeside path', label: 'Run to the lake' },
    { id: 'mat', kind: 'mat', plate: 'lake mat', label: 'The Chill Zone' },
  ],
};

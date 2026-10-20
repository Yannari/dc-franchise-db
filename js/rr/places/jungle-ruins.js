// Jungle Ruins (LEGS.txt 34-JUNGLE-RUINS), the World Tour's rainforest-and-ruins leg as the frames show it: a canoe up
// the river; both partners race along the jungle trail over a stream full of piranhas and past giant caterpillars
// (All-In); at the foot of the mountain ruins, they find the one real golden idol among the fakes in the carved wall
// (All-In); the Chill Zone is at the top of the ruins.
export default {
  id: 'jungle-ruins', name: 'Jungle Ruins', recap: 'racing past piranhas and finding the one real golden idol in the ruins',
  region: 'ocean', map: { x: 24, y: 66 },
  arrive: 'airport', local: ['canoe', 'foot'],
  stretches: [
    { id: 'river-canoe', kind: 'travel', mode: 'canoe', base: 35, cost: 10, plate: 'jungle river, canoes', label: 'Canoe up the river',
      mishaps: [['canoe-tips', 20]], mishapRate: 0.1 },
    { id: 'jungle-trail', called: 'the jungle trail', kind: 'allin', types: ['nerve', 'search'], base: 30, pass: 0.55, loopCost: 10, opens: 360, closes: 1140,
      plate: 'jungle trail', label: 'All-In: the jungle trail',
      desc: "A narrow trail runs through the rainforest from the river to the ruins, marked with painted stones. Both partners follow it over a log across a stream full of piranhas, through vines and mud, and past giant hairy caterpillars that drop from the branches. Falling off the log, losing the painted stones or turning back from a caterpillar means going back to the last stone and finding the way again. Both partners reaching the foot of the ruins earns the next tip." },
    { id: 'golden-idol', called: 'the ruins', kind: 'allin', types: ['search', 'brains'], base: 30, pass: 0.4, loopCost: 10, opens: 360, closes: 1200,
      plate: 'ruins wall, carvings', label: 'All-In: the golden idol',
      desc: "In the carved stone wall at the foot of the ruins sit dozens of little golden idols in niches, and only one is real gold; the rest are painted clay. Both partners study the carvings around them for clues, pick one, and take it to the old guide, who scratches it with a coin. A fake means putting it back and choosing again. The real golden idol earns the next tip." },
    { id: 'ruin-climb', kind: 'travel', mode: 'foot', base: 20, cost: 0, plate: 'ruin steps', label: 'Climb the ruins' },
    { id: 'mat', kind: 'mat', plate: 'mountain ruins wide', label: 'The Chill Zone' },
  ],
};

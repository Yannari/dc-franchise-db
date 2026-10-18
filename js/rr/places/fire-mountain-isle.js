// Fire-Mountain Isle (LEGS.txt 48-FIRE-MOUNTAIN-ISLE; the leg mockup, mockup/mockup-rr-leg.html).
export default {
  id: 'fire-mountain-isle', name: 'Fire-Mountain Isle', region: 'ocean', map: { x: 3, y: 45 },
  arrive: 'airport', local: ['taxi', 'foot', 'boat'],
  stretches: [
    { id: 'jungle', kind: 'travel', mode: 'foot', base: 25, cost: 0, plate: 'jungle path', label: 'Into the jungle' },
    { id: 'lava-falls', kind: 'either', opens: 420, closes: 1170, plate: 'lava stepping stones + waterfall clearing', label: 'Lava or Falls',
      desc: 'Two ways to the far side of the island. Lava means hopping a line of stepping stones across a river of lava, fast but one slip sends you back to the bank to start again. Falls means rafting down the river channel, then climbing the slippery path behind the waterfall, slower but rarely fatal to your shoes. Teams may switch, and the first across finds the next Don Box in the clearing.',
      sides: [
        { id: 'lava', label: 'Lava', types: ['nerve'], base: 20, pass: 0.55, loopCost: 12 },
        { id: 'falls', label: 'Falls', types: ['heights', 'water'], base: 35, pass: 0.75, loopCost: 8 },
      ] },
    { id: 'lagoon', kind: 'botch', types: ['water'], base: 18, pass: 0.55, loopCost: 8, teaser: "Who's ready to get wet?", plate: 'lagoon, sea mine', label: 'Botch or Watch: the lagoon',
      desc: 'One partner swims across the lagoon to the next Don Box while the other watches from the shore and may only shout. An old sea mine floats in the middle and touching it means swimming back to the beach and starting over. The swimmer is through when they slap the Don Box on the far rocks and pull the tip.' },
    { id: 'statue', kind: 'allin', types: ['hands', 'strength'], base: 30, pass: 0.5, loopCost: 10, plate: 'log pile', label: 'All-In: the offering',
      desc: 'Both partners build a statue out of the logs and pineapples piled on the beach, then carry it up the volcano together and throw it into the crater as an offering. A statue that falls apart on the way up has to be rebuilt at the bottom, and the volcano only accepts one that arrives in one piece. The tip is waiting at the rim once the statue goes in.' },
    { id: 'climb', kind: 'travel', mode: 'foot', base: 30, cost: 0, plate: 'volcano path', label: 'The climb' },
    { id: 'mat', kind: 'mat', plate: 'volcano rim', label: 'The Chill Zone' },
  ],
};

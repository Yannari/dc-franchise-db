// Fire-Mountain Isle (LEGS.txt 48-FIRE-MOUNTAIN-ISLE; the leg mockup, mockup/mockup-rr-leg.html). From World Tour's
// island finale (the wiki's "Hawaiian Punch"): a dummy of wood and pineapples made to look like someone, hauled up the
// volcano past a river of lava and thrown into the crater; adapted here into a pair's statue of one of them.
export default {
  id: 'fire-mountain-isle', name: 'Fire-Mountain Isle', recap: 'hopping over lava, diving in the lagoon and carving logs into statues', region: 'ocean', map: { x: 3, y: 45 },
  arrive: 'airport', local: ['taxi', 'foot', 'boat'],
  stretches: [
    { id: 'jungle', kind: 'travel', mode: 'foot', base: 25, cost: 0, plate: 'jungle path', label: 'Into the jungle' },
    { id: 'lava-falls', called: 'the lava field', kind: 'either', opens: 420, closes: 1170, plate: 'lava stepping stones + waterfall clearing', label: 'Lava or Falls',
      desc: 'Two ways to the far side of the island. Lava means hopping a line of stepping stones across a river of lava, fast but one slip sends you back to the bank to start again. Falls means rafting down the river channel, then climbing the slippery path behind the waterfall, slower but rarely fatal to your shoes. Teams may switch, and the first across finds the next Don Box in the clearing.',
      sides: [
        // the bank of the lava river; the stepping stones (a slip: back to the bank); the clearing
        { id: 'lava', label: 'Lava', types: ['nerve'], base: 20, pass: 0.55, loopCost: 12,
          stages: [{ id: 'lava-bank', share: 0.2, risk: 0 }, { id: 'stepping-stones', share: 1, risk: 1 }, { id: 'lava-clearing', share: 0.2, risk: 0 }] },
        // the raft down the river channel (tipped over); the slippery path behind the waterfall (a slip); the clearing
        { id: 'falls', label: 'Falls', types: ['heights', 'water'], base: 35, pass: 0.75, loopCost: 8,
          stages: [{ id: 'river-raft', share: 1, risk: 0.6 }, { id: 'behind-the-falls', share: 0.8, risk: 0.6 }, { id: 'falls-clearing', share: 0.2, risk: 0 }] },
      ] },
    { id: 'lagoon', called: 'the lagoon', kind: 'botch', types: ['water'], base: 18, pass: 0.55, loopCost: 8, teaser: "Who's ready to get wet?", plate: 'lagoon, sea mine', label: 'Botch or Watch: the lagoon',
      // wading in from the beach; past the sea mine in the middle (touched it: back to the beach); the Don Box on the far
      // rocks. a swims, b watches from the shore
      stages: [{ id: 'lagoon-wade', share: 0.2, risk: 0 }, { id: 'the-mine', share: 1, risk: 1 }, { id: 'far-rocks', share: 0.4, risk: 0 }],
      desc: 'One partner swims across the lagoon to the next Don Box while the other watches from the shore and may only shout. An old sea mine floats in the middle and touching it means swimming back to the beach and starting over. The swimmer is through when they slap the Don Box on the far rocks and pull the tip.' },
    { id: 'statue', called: 'the log pile', kind: 'allin', types: ['hands', 'strength'], base: 30, pass: 0.5, loopCost: 10, plate: 'log pile', label: 'All-In: the offering',
      // the log pile; building the statue (it falls apart); carrying it up the volcano past the lava (dropped: rebuilt at
      // the bottom); into the crater
      stages: [{ id: 'log-pile', share: 0.2, risk: 0 }, { id: 'the-statue', share: 1, risk: 0.6 }, { id: 'up-the-volcano', share: 0.8, risk: 1 },
        { id: 'the-crater', share: 0.2, risk: 0 }],
      desc: 'Both partners build a statue out of the logs and pineapples piled on the beach, and it has to look like one of them: a pineapple head, log arms, a face carved with a shell. Then they carry it up the volcano path together, past a stream of lava, and throw it into the crater as an offering. A statue that falls apart on the way up has to be rebuilt at the bottom, and the volcano only accepts one that arrives in one piece. The tip is waiting at the rim once the statue goes in.' },
    { id: 'climb', kind: 'travel', mode: 'foot', base: 30, cost: 0, plate: 'volcano path', label: 'The climb' },
    { id: 'mat', kind: 'mat', plate: 'volcano rim', label: 'The Chill Zone' },
  ],
};

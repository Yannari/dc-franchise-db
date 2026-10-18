// Red Sand Desert (LEGS.txt 03-RED-SAND-DESERT; the real show's episode 2: the spices,
// the camels, the stew made from your own spices).
export default {
  id: 'red-sand-desert', name: 'Red Sand Desert', region: 'desert', map: { x: 48, y: 41 },
  arrive: 'airport', local: ['taxi', 'camel', 'foot'],
  stretches: [
    { id: 'taxi', kind: 'travel', mode: 'taxi', base: 30, cost: 25, plate: 'desert road', label: 'Taxi to the spice corner' },
    { id: 'spices', kind: 'allin', types: ['brains'], base: 15, pass: 0.55, loopCost: 8, opens: 480, closes: 1260, plate: 'spice market baskets', label: 'The spice is right',
      desc: 'A spice merchant has forty open baskets and the tip asks for the five that go into the old desert stew. Both partners must agree on all five and hand them over together; the merchant only says yes or no to the whole set, and a no sends them back to the baskets. Whatever five they finally hand over goes into the pot at the next stop, right or not.' },
    { id: 'camel', kind: 'travel', mode: 'camel', base: 40, cost: 10, capacity: 4, plate: 'open dunes', label: 'Camel across the dunes' },
    { id: 'stew', kind: 'botch', types: ['stomach'], base: 12, pass: 0.6, loopCost: 6, chain: { from: 'spices' }, teaser: "Who's got a cast-iron stomach?", plate: 'stew pot', label: 'Just stew it',
      desc: 'The chef cooks a bowl of stew with the spices the team chose at the market, and one partner has to eat every last drop while the other can only watch. The wrong spices make it hotter and slower to get down, and anything that comes back up means a fresh bowl. The bowl must be empty for the chef to hand over the tip.' },
    { id: 'run', kind: 'travel', mode: 'foot', base: 15, cost: 0, plate: 'desert path', label: 'Run to the Chill Zone' },
    { id: 'mat', kind: 'mat', plate: 'tent + mat', label: 'The Chill Zone' },
  ],
};

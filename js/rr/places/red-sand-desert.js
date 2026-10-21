// Red Sand Desert (LEGS.txt 03-RED-SAND-DESERT), 1:1 with the real show's episode 2 (the wiki's "None Down,
// Eighteen to Go - Part 2"): a cab to the spice corner; All-In "The spice is right", five spices with no judge,
// "ideally cumin, cinnamon, paprika, saffron and ginger"; a camel to a restaurant in the desert (one collapsed,
// the Vegans walked beside theirs); Botch or Watch, a stew cooked with the team's own spices; on foot to the
// Chill Zone.
export default {
  id: 'red-sand-desert', name: 'Red Sand Desert', recap: 'shopping for spices and cameling through the desert', region: 'desert', map: { x: 48, y: 41 },
  arrive: 'airport', local: ['taxi', 'camel', 'foot'],
  stretches: [
    { id: 'taxi', kind: 'travel', mode: 'taxi', base: 30, cost: 25, plate: 'desert road', label: 'Cab to the spice corner' },
    { id: 'spices', called: 'the spice corner', kind: 'allin', types: ['brains'], pick: { of: 5 }, base: 15, pass: 1, loopCost: 0, opens: 480, closes: 1260, plate: 'spice market baskets', label: 'The spice is right',
      // into the spice corner; up and down the stalls sniffing and guessing; the five chosen at the merchant's kiosk; paying,
      // five little bags and the tip. A wrong spice is grabbed while sniffing or at the kiosk (nobody tells them)
      stages: [{ id: 'the-alley', share: 0.5, risk: 0 }, { id: 'sniff', share: 1.2, risk: 0.6 }, { id: 'the-kiosk', share: 1, risk: 1 },
        { id: 'pay-up', share: 0.4, risk: 0 }],
      desc: "At the spice corner, a merchant's kiosk is stacked with dozens of open spice baskets, and the tip says to pick five, ideally cumin, cinnamon, paprika, saffron and ginger. Both partners choose together and buy their five; nobody checks them, so a team that knows its spices can be in and out in minutes while a team that doesn't is left sniffing jars and guessing. The trap comes later: the five go into the stew at the next stop, and every wrong spice makes that bowl harder to finish. The team leaves with its five little bags and the next tip." },
    { id: 'camel', kind: 'travel', mode: 'camel', base: 40, cost: 10, capacity: 4, plate: 'open dunes', label: 'Camel to the desert restaurant',
      // the real leg: a camel collapsed under Father & Son; the Vegans wouldn't ride and walked beside theirs
      ride: true, mishaps: [['camel-down', 30], ['camel-stops', 20]], mishapRate: 0.12,
      refuse: { identities: ['vegans'], kind: 'walks-beside', slow: 1.4 } },
    { id: 'stew', judge: true, called: 'the restaurant', kind: 'botch', types: ['stomach'], base: 12, pass: 0.6, loopCost: 6, chain: { from: 'spices', by: 'picks' }, teaser: "Who's got a cast-iron stomach?", plate: 'stew pot', label: 'Just stew it',
      // the chef cooks the five spices; the first spoonful; the middle of the bowl, where the heat builds (it comes back
      // up: a fresh bowl); the last drops; the empty bowl and the tip. The partner watches and can't help
      stages: [{ id: 'the-chef', share: 0.5, risk: 0 }, { id: 'first-spoon', share: 0.6, risk: 0.4 }, { id: 'half-bowl', share: 1.5, risk: 1 },
        { id: 'last-drop', share: 0.6, risk: 0.6 }, { id: 'empty-bowl', share: 0.3, risk: 0 }],
      desc: "At a restaurant in the middle of the desert, the team hands its five spices to the chef, who cooks them into a bowl of the local stew. One partner has to eat every last drop while the other can only watch and is not allowed to help. Every wrong spice makes the bowl hotter and harder to keep down, and anything that comes back up means a fresh bowl from the start. The chef hands over the tip once the bowl is empty, and the team runs on foot for the Chill Zone." },
    { id: 'run', kind: 'travel', mode: 'foot', base: 15, cost: 0, plate: 'desert path', label: 'Run to the Chill Zone' },
    { id: 'mat', kind: 'mat', plate: 'tent + mat', label: 'The Chill Zone' },
  ],
};

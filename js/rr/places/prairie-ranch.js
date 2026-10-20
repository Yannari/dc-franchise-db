// Prairie Ranch (LEGS.txt 17-PRAIRIE-RANCH), 1:1 with the real show's "Little Bull on the Prairie": a pickup out to the
// ranch; a whole pot of pork and beans on a table at the cliff top, eaten to the bottom where the tip is taped (All-In);
// whoever isn't holding the tip rides the mechanical bull in the barn for eight seconds (Botch or Watch); a run to the
// Chill Zone on the cliff.
export default {
  id: 'prairie-ranch', name: 'Prairie Ranch', recap: 'eating a whole pot of beans and riding a mechanical bull',
  region: 'north', map: { x: 18, y: 26 },
  // a place being built: playable when booked, never drawn or offered until its lines, plates and music are in
  draft: true,
  arrive: 'airport', local: ['drive', 'foot'],
  stretches: [
    { id: 'ranch-pickup', kind: 'travel', mode: 'drive', base: 40, cost: 20, plate: 'prairie road', label: 'Pickup to the ranch',
      mishaps: [['cattle-crossing', 20]], mishapRate: 0.1 },
    { id: 'beans', called: 'the cliff top', kind: 'allin', types: ['stomach', 'patience'], base: 25, pass: 0.55, loopCost: 10, opens: 420, closes: 1260,
      plate: 'cliff-top beans table', label: 'All-In: the pot of beans',
      desc: "On a long table at the top of the cliff sits a big iron pot for each team, filled to the brim with pork and beans. Both partners eat, spoon after spoon, until they reach the bottom of the pot, where the next tip is taped. Beans left in the pot, or beans brought back up, mean the cook tops it up again, and the spoon goes back in. A pot scraped clean to the tip earns the next clue." },
    { id: 'bull', called: 'the barn', kind: 'botch', types: ['strength', 'nerve'], base: 15, pass: 0.45, loopCost: 6,
      teaser: 'Who can hang on?', plate: 'barn interior', label: 'Botch or Watch: the mechanical bull',
      desc: "In the ranch barn stands a mechanical bull on a pile of hay, and the partner who isn't holding the tip climbs on. The cowboy at the controls starts it slow and speeds it up, bucking and spinning, and the rider has to stay on for a full eight seconds, one hand on the rope. Falling off before the timer reaches eight means climbing back on and starting again. The other partner can only watch from behind the rail. Eight seconds on the clock earns the next tip." },
    { id: 'cliff-run', kind: 'travel', mode: 'foot', base: 15, cost: 0, plate: 'ranch track', label: 'Run to the cliff' },
    { id: 'mat', kind: 'mat', plate: 'cliff-top mat', label: 'The Chill Zone' },
  ],
};

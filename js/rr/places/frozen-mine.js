// Frozen Mine (LEGS.txt 23-FROZEN-MINE), 1:1 with the real show's "How Deep Is Your Love": both partners sail an ice
// yacht across the frozen lake to the mine, in swimsuits (All-In); at the mine, one is lowered down a borehole into the
// cavern deep under the ice to find a red ball among the white ones while the other works the winch (Botch or Watch);
// the Chill Zone is in the sauna.
export default {
  id: 'frozen-mine', name: 'Frozen Mine', recap: 'ice sailing in swimsuits and going down the deepest hole on earth for a ball',
  region: 'north', map: { x: 56, y: 12 },
  // a place being built: playable when booked, never drawn or offered until its lines, plates and music are in
  draft: true,
  arrive: 'airport', local: ['taxi', 'foot'],
  stretches: [
    { id: 'lake-taxi', kind: 'travel', mode: 'taxi', base: 30, cost: 20, plate: 'snowy forest road', label: 'Taxi to the frozen lake',
      mishaps: [['reindeer-on-the-road', 20]], mishapRate: 0.1 },
    { id: 'ice-yacht', called: 'the frozen lake', kind: 'allin', types: ['nerve', 'hands'], base: 30, pass: 0.55, loopCost: 10, opens: 480, closes: 1140,
      plate: 'ice yachts on the lake', label: 'All-In: the ice yacht',
      desc: "On the frozen lake, every team gets an ice yacht, a sail on skates, and both partners have to change into swimsuits before they climb on. One steers, one works the sail, and they race it across the ice to the mine on the far shore. Tipping over, spinning out or sailing the wrong way means dragging the yacht back to the start and setting off again. The team that pulls up at the mine's gate, still in its swimsuits, gets the next tip." },
    { id: 'borehole', called: 'the mine', kind: 'botch', types: ['nerve', 'search'], base: 25, pass: 0.45, loopCost: 10,
      teaser: 'Who is not afraid of the dark?', plate: 'mine headframe + shaft', label: 'Botch or Watch: the borehole',
      desc: "At the old mine, a narrow borehole drops deep into a cavern under the ice. One partner is strapped into a harness and lowered down on a winch with a headlamp, and in the dark at the bottom they have to find the one red ball among hundreds of white ones. The other partner works the winch at the top and can only shout down the shaft. A white ball brought up means going back down for another look. The red ball, brought up to the surface, earns the next tip." },
    { id: 'sauna-run', kind: 'travel', mode: 'foot', base: 10, cost: 0, plate: 'snowy path, lights', label: 'Run to the sauna' },
    { id: 'mat', kind: 'mat', plate: 'sauna interior', label: 'The Chill Zone' },
  ],
};

// Home City: the starting line (Downloads/RidonculousRace-frames/LEGS.txt 02-HOME-CITY;
// the real show's first leg: the tower, Stairs or Scares, the zipline to the island airport).
export default {
  id: 'home-city', name: 'Home City', region: 'north', map: { x: 22, y: 31 },
  arrive: 'station', local: ['foot', 'taxi'], start: true,
  stretches: [
    { id: 'to-tower', kind: 'travel', mode: 'foot', base: 20, cost: 0, plate: 'station facade', label: 'Run to the tower' },
    { id: 'tower', kind: 'either', plate: 'stairwell + tower deck', label: 'Stairs or Sky-deck',
      desc: 'At the foot of the city tower a Don Box offers two ways to the top. Stairs means climbing all 144 flights on foot; Sky-deck means riding the slow elevator, two teams at a time, then clipping onto a rail and walking the whole outside deck in the wind. Legs give out on the stairs, nerves give out on the deck, and a team that freezes on the rail is sent back to the start of it. The first team to the top grabs the next tip.',
      sides: [
        { id: 'stairs', label: 'Stairs', types: ['strength'], base: 35, pass: 0.95, loopCost: 4 },
        { id: 'skydeck', label: 'Sky-deck', types: ['heights'], base: 25, pass: 0.6, loopCost: 10, capacity: 2 },
      ] },
    { id: 'zipline', kind: 'allin', types: ['heights'], base: 15, pass: 0.75, loopCost: 10, plate: 'zipline to island airport', label: 'Zipline to the airport',
      desc: 'Both partners clip onto a cable strung from the tower to the little island airport across the lake and slide down it, snatching the next tip from a pole halfway across. Miss the tip and the line drags you to the end anyway, and you climb back up for another run. Both partners must ride, and the team is through once the tip is in hand at the bottom.' },
    { id: 'mat', kind: 'mat', plate: 'airport curb', label: 'The Chill Zone' },
  ],
};

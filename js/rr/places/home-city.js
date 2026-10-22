// Home City: the starting line (Downloads/RidonculousRace-frames/LEGS.txt 02-HOME-CITY;
// the real show's first leg: the tower, Stairs or Scares, the zipline to the island airport).
export default {
  id: 'home-city', name: 'Home City', recap: 'racing up the city tower and ziplining over the lake', region: 'north', map: { x: 22, y: 31 },
  arrive: 'station', local: ['foot', 'taxi'], start: true,
  stretches: [
    { id: 'to-tower', kind: 'travel', mode: 'foot', base: 20, cost: 0, plate: 'station facade', label: 'Run to the tower' },
    { id: 'tower', called: 'the tower', kind: 'either', plate: 'stairwell + tower deck', label: 'Stairs or Sky-deck',
      desc: 'At the foot of the city tower a Don Box offers two ways to the top. Stairs means climbing all 144 flights on foot; Sky-deck means riding the slow elevator, two teams at a time, then clipping onto a rail and walking the whole outside deck in the wind. Legs give out on the stairs, nerves give out on the deck, and a team that freezes on the rail is sent back to the start of it. The first team to the top grabs the next tip.',
      sides: [
        // the stairwell door; the long middle, where legs give out (sit down, get going again); the last flights; the
        // top, where the tip is
        { id: 'stairs', label: 'Stairs', types: ['strength'], base: 35, pass: 0.95, loopCost: 4,
          stages: [{ id: 'stairwell', share: 0.6, risk: 0.2 }, { id: 'burn', share: 2, risk: 1 }, { id: 'last-flights', share: 1, risk: 0.5 },
            { id: 'stairs-top', share: 0.3, risk: 0 }] },
        // the slow elevator, two teams at a time; clipping onto the rail at the deck door; the walk round the outside
        // deck in the wind (freeze: back to the start of the rail); in through the far door to the tip
        { id: 'skydeck', label: 'Sky-deck', types: ['heights'], base: 25, pass: 0.7, loopCost: 10, capacity: 2,
          stages: [{ id: 'elevator', share: 1, risk: 0 }, { id: 'clip-on', share: 0.4, risk: 0.3 }, { id: 'rail', share: 2, risk: 1 },
            { id: 'deck-top', share: 0.3, risk: 0 }] },
      ] },
    { id: 'zipline', called: 'the zipline', kind: 'allin', types: ['heights'], base: 15, pass: 0.75, loopCost: 10, plate: 'zipline to island airport', label: 'Zipline to the airport',
      // clipping in at the top of the tower; the ride out over the lake; the tip on its pole halfway (miss it: the line
      // drags you to the end and you climb back up); the landing at the island airport
      stages: [{ id: 'clip-in', share: 0.5, risk: 0.2 }, { id: 'over-lake', share: 1.2, risk: 0.3 }, { id: 'grab-tip', share: 0.5, risk: 1 },
        { id: 'landing', share: 0.5, risk: 0 }],
      desc: 'Both partners clip onto a cable strung from the tower to the little island airport across the lake and slide down it, snatching the next tip from a pole halfway across. Miss the tip and the line drags you to the end anyway, and you climb back up for another run. Both partners must ride, and the team is through once the tip is in hand at the bottom.' },
    { id: 'mat', kind: 'mat', plate: 'airport curb', label: 'The Chill Zone' },
  ],
};

// Fjord Sea (LEGS.txt 42-FJORD-SEA), the World Tour's longship leg as the frames show it: both partners build a longship
// from the wrecks on the shore, flat-pack style, and sail it across the fjord (All-In); then the partner who didn't do
// the last Botch or Watch loads the ship's cannon with meatballs and hits the target floating out on the water (Botch or
// Watch); the Chill Zone is on the buoy.
export default {
  id: 'fjord-sea', name: 'Fjord Sea', recap: 'building a longship from a flat pack and firing meatballs from a cannon',
  region: 'north', map: { x: 52, y: 17 },
  arrive: 'airport', local: ['taxi', 'foot'],
  stretches: [
    { id: 'shore-taxi', kind: 'travel', mode: 'taxi', base: 30, cost: 20, plate: 'fjord road, red cabins', label: 'Taxi to the shore',
      mishaps: [['moose-on-the-road', 20]], mishapRate: 0.1 },
    { id: 'longship', called: 'the shore', kind: 'allin', types: ['hands', 'brains'], base: 40, pass: 0.5, loopCost: 15, opens: 420, closes: 1140,
      plate: 'longship wrecks', label: 'All-In: the longship',
      // the heap and its picture-only instructions; the hull (planks the wrong way round); the mast and the sail (it
      // falls, upside down); out across the fjord (it leaks: row back, rebuild); the far shore
      stages: [{ id: 'the-heap', share: 0.3, risk: 0 }, { id: 'the-hull', share: 1, risk: 0.6 }, { id: 'mast-and-sail', share: 0.6, risk: 0.6 },
        { id: 'the-crossing', share: 0.8, risk: 1 }, { id: 'far-shore', share: 0.2, risk: 0 }],
      desc: "On the stony shore lie the planks, oars, shields and striped sail of a longship, in a heap, with an instruction sheet that is nothing but pictures. Both partners have to build the ship, hull, mast and sail, and then row and sail it across the fjord to the far shore. A ship that leaks, a mast that falls or a sail put on upside down means rowing back and rebuilding. Both partners landing on the far shore in their own longship earns the next tip." },
    { id: 'meatball-cannon', called: 'the fjord', kind: 'botch', types: ['hands', 'brains'], base: 15, pass: 0.4, loopCost: 6,
      teaser: 'Who is good with a cannon?', plate: 'fjord water', label: 'Botch or Watch: the meatball cannon',
      // packing the cannon with meatballs; aiming at the floating target; the shot (short, wide: reload); the bullseye. a
      // fires, b watches
      stages: [{ id: 'load-up', share: 0.4, risk: 0.2 }, { id: 'take-aim', share: 0.4, risk: 0 }, { id: 'fire', share: 0.6, risk: 1 },
        { id: 'bullseye', share: 0.2, risk: 0 }],
      desc: "On the deck of the longship sits an old iron cannon and a pile of meatballs. The partner who didn't do the last Botch or Watch packs the cannon with meatballs, aims it and fires at a target floating out on the fjord. Every miss means reloading, re-aiming and firing again, and a meatball that falls short just feeds the fish. The other partner can only watch from the oars. A meatball through the middle of the target earns the next tip." },
    { id: 'buoy-row', kind: 'travel', mode: 'boat', base: 15, cost: 0, plate: 'fjord water', label: 'Row to the buoy' },
    { id: 'mat', kind: 'mat', plate: 'buoy finish', label: 'The Chill Zone' },
  ],
};

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
      desc: "On the stony shore lie the planks, oars, shields and striped sail of a longship, in a heap, with an instruction sheet that is nothing but pictures. Both partners have to build the ship, hull, mast and sail, and then row and sail it across the fjord to the far shore. A ship that leaks, a mast that falls or a sail put on upside down means rowing back and rebuilding. Both partners landing on the far shore in their own longship earns the next tip." },
    { id: 'meatball-cannon', called: 'the fjord', kind: 'botch', types: ['hands', 'brains'], base: 15, pass: 0.4, loopCost: 6,
      teaser: 'Who is good with a cannon?', plate: 'fjord water', label: 'Botch or Watch: the meatball cannon',
      desc: "On the deck of the longship sits an old iron cannon and a pile of meatballs. The partner who didn't do the last Botch or Watch packs the cannon with meatballs, aims it and fires at a target floating out on the fjord. Every miss means reloading, re-aiming and firing again, and a meatball that falls short just feeds the fish. The other partner can only watch from the oars. A meatball through the middle of the target earns the next tip." },
    { id: 'buoy-row', kind: 'travel', mode: 'boat', base: 15, cost: 0, plate: 'fjord water', label: 'Row to the buoy' },
    { id: 'mat', kind: 'mat', plate: 'buoy finish', label: 'The Chill Zone' },
  ],
};

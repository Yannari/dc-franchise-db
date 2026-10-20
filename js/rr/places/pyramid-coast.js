// Pyramid Coast (LEGS.txt 21-PYRAMID-COAST), 1:1 with the real show's "El Bunny Supremo" leg: at the chilli cart on the
// cliff top, one partner eats a mild, a hot or a fiery pepper and waves its flag, and the other has to jump into the sea
// from the ledge with the same flag (the hotter the pepper, the lower the jump) and swim back with a canteen of milk for
// the eater (All-In); then ride burros along the coast to the Chill Zone at the step pyramid.
export default {
  id: 'pyramid-coast', name: 'Pyramid Coast', recap: 'eating fiery peppers, cliff diving for milk and riding burros to a pyramid',
  region: 'north', map: { x: 16, y: 46 },
  // a place being built: playable when booked, never drawn or offered until its lines, plates and music are in
  draft: true,
  arrive: 'airport', local: ['taxi', 'burro', 'foot'],
  stretches: [
    { id: 'cliff-taxi', kind: 'travel', mode: 'taxi', base: 30, cost: 20, plate: 'coast road, cactus', label: 'Taxi to the cliffs',
      mishaps: [['goats-on-the-road', 20]], mishapRate: 0.08 },
    { id: 'pepper-cliff', called: 'the cliff top', kind: 'allin', types: ['stomach', 'heights'], base: 25, pass: 0.5, loopCost: 10, opens: 420, closes: 1260,
      plate: 'chilli cart + cliff top', label: 'All-In: the pepper and the jump',
      desc: "At a chilli cart on top of the sea cliffs, one partner picks a pepper, mild, hot or fiery, eats the whole thing and waves its coloured flag. The other partner climbs down to the ledge with that same colour and jumps into the sea: a mild pepper means the highest ledge, a fiery one the lowest. At the bottom they grab a canteen of milk and swim it back up to the eater. A pepper not finished, or a jump refused, means picking again. Milk delivered to a burning mouth earns the next tip." },
    { id: 'burro-ride', kind: 'travel', mode: 'burro', base: 40, cost: 0, plate: 'coast trail, burros', label: 'Ride the burros to the pyramid',
      mishaps: [['burro-sits-down', 25]], mishapRate: 0.12 },
    { id: 'mat', kind: 'mat', plate: 'step pyramid', label: 'The Chill Zone' },
  ],
};

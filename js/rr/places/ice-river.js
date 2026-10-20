// Ice River (LEGS.txt 31-ICE-RIVER), the World Tour's frozen north leg: a bush plane onto the snow; both partners hop
// across a river on floating, melting ice floes, one floe at a time, to the far bank (All-In); then one pulls the other
// across the snow plain on a sled to the Chill Zone on the ice cliff, with a polar bear somewhere out there (All-In).
export default {
  id: 'ice-river', name: 'Ice River', recap: 'hopping across melting ice floes and dragging a partner on a sled',
  region: 'north', map: { x: 9, y: 16 },
  // a place being built: playable when booked, never drawn or offered until its lines, plates and music are in
  draft: true,
  arrive: 'airport', local: ['plane', 'foot'],
  stretches: [
    { id: 'river-hop', kind: 'travel', mode: 'plane', base: 40, cost: 0, plate: 'snow airstrip', label: 'Bush plane to the river',
      mishaps: [['skis-stuck-in-snow', 20]], mishapRate: 0.1 },
    { id: 'ice-floes', called: 'the river', kind: 'allin', types: ['nerve', 'water'], base: 25, pass: 0.5, loopCost: 10, opens: 480, closes: 1140,
      plate: 'ice floes river', label: 'All-In: the ice floes',
      desc: "Across a wide, slow river, chunks of ice drift past, some as big as a car, some barely bigger than a door, all of them melting. Both partners have to cross from one bank to the other by jumping from floe to floe, choosing the ones that will hold them before they float away. A floe that tips, cracks or sinks drops them into the freezing water, and they swim back to the near bank and start again. Both partners standing on the far bank earns the next tip." },
    { id: 'sled', called: 'the snow plain', kind: 'allin', types: ['strength', 'patience'], base: 35, pass: 0.6, loopCost: 12, opens: 480, closes: 1140,
      plate: 'snow plain', label: 'All-In: the sled',
      desc: "On the open snow plain, each team gets a wooden sled. One partner climbs on, and the other grabs the harness and drags them across the snow, following the flags to the ice cliff. The partners can swap whenever the puller gives out. Tipping the sled, losing the flags, or running from the polar bear that sometimes wanders near the route means finding the last flag and pulling on from there. Both partners reaching the ice cliff with the sled checks the team in." },
    { id: 'mat', kind: 'mat', plate: 'ice cliff finish', label: 'The Chill Zone' },
  ],
};

// Ice River (LEGS.txt 31-ICE-RIVER), the World Tour's frozen north leg: a bush plane onto the snow; both partners hop
// across a river on floating, melting ice floes, one floe at a time, to the far bank (All-In); then one pulls the other
// across the snow plain on a sled to the Chill Zone on the ice cliff, with a polar bear somewhere out there (All-In).
export default {
  id: 'ice-river', name: 'Ice River', recap: 'hopping across melting ice floes and dragging a partner on a sled',
  region: 'north', map: { x: 9, y: 16 },
  arrive: 'airport', local: ['plane', 'foot'],
  stretches: [
    { id: 'river-hop', kind: 'travel', mode: 'plane', base: 40, cost: 0, plate: 'snow airstrip', label: 'Bush plane to the river',
      mishaps: [['skis-stuck-in-snow', 20]], mishapRate: 0.1 },
    { id: 'ice-floes', called: 'the river', kind: 'allin', types: ['nerve', 'water'], base: 25, pass: 0.5, loopCost: 10, opens: 480, closes: 1140,
      plate: 'ice floes river', label: 'All-In: the ice floes',
      // the crossing, as the show cuts it: waiting for the first big floe, the thin ones in the middle where it goes
      // wrong (a floe tips, cracks, sinks: the freezing water and the swim back), the last long jump, the far bank
      stages: [{ id: 'first-floe', share: 1, risk: 0.2 }, { id: 'mid-river', share: 2, risk: 1 }, { id: 'last-jump', share: 1, risk: 0.5 },
        { id: 'far-bank', share: 0.4, risk: 0 }],
      desc: "Across a wide, slow river, chunks of ice drift past, some as big as a car, some barely bigger than a door, all of them melting. Both partners have to cross from one bank to the other by jumping from floe to floe, choosing the ones that will hold them before they float away. A floe that tips, cracks or sinks drops them into the freezing water, and they swim back to the near bank and start again. Both partners standing on the far bank earns the next tip." },
    { id: 'sled', called: 'the snow plain', kind: 'allin', types: ['strength', 'patience'], base: 35, pass: 0.6, loopCost: 12, opens: 480, closes: 1140,
      plate: 'snow plain', label: 'All-In: the sled',
      // harness up at the start flag; the flag course across the plain (lose the flags: back to the last one); the bear
      // near the route (run from it: back to the last flag); the puller gives out and they swap (the sled tips); the
      // last pull up to the ice cliff
      stages: [{ id: 'harness', share: 0.6, risk: 0 }, { id: 'flags', share: 2, risk: 1 }, { id: 'bear', share: 1, risk: 0.8 },
        { id: 'swap', share: 0.6, risk: 0.2 }, { id: 'cliff', share: 1, risk: 0.3 }],
      desc: "On the open snow plain, each team gets a wooden sled. One partner climbs on, and the other grabs the harness and drags them across the snow, following the flags to the ice cliff. The partners can swap whenever the puller gives out. Tipping the sled, losing the flags, or running from the polar bear that sometimes wanders near the route means finding the last flag and pulling on from there. Both partners reaching the ice cliff with the sled checks the team in." },
    { id: 'mat', kind: 'mat', plate: 'ice cliff finish', label: 'The Chill Zone' },
  ],
};

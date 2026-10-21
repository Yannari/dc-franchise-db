// Lei Island (LEGS.txt 09-LEI-ISLAND), 1:1 with the real show's "Hawaiian Honeyruin": whoever didn't do the last Botch
// or Watch dives in the bay under the pier for a wedding ring thrown there by newlyweds and brings it back to the
// partner; both dress in grass skirts and leis and one carries the other across a bed of hot coals; a run to the Chill
// Zone at the tiki hut.
export default {
  id: 'lei-island', name: 'Lei Island', recap: 'diving for wedding rings and carrying each other over hot coals in grass skirts',
  region: 'ocean', map: { x: 6, y: 42 },
  arrive: 'airport', local: ['taxi', 'foot'],
  stretches: [
    { id: 'pier-taxi', kind: 'travel', mode: 'taxi', base: 30, cost: 20, plate: 'coast road, palms', label: 'Taxi to the pier',
      mishaps: [['flat-tyre', 20]], mishapRate: 0.08 },
    { id: 'ring-dive', called: 'the pier', kind: 'botch', types: ['water', 'search'], base: 15, pass: 0.5, loopCost: 10,
      teaser: 'Who can hold their breath?', plate: 'lagoon under the pier', label: 'Botch or Watch: the wedding ring',
      // on the old pier, looking down; the dive (back up for air too soon); the search of the sandy bottom (a shell, a
      // bottle cap: down again); the ring handed up (dropped back in); the tip. a dives, b shouts from the pier
      stages: [{ id: 'the-pier', share: 0.3, risk: 0 }, { id: 'dive-down', share: 0.6, risk: 0.4 }, { id: 'search-sand', share: 1.2, risk: 1 },
        { id: 'ring-up', share: 0.4, risk: 0.3 }, { id: 'ring-tip', share: 0.3, risk: 0 }],
      desc: "Under the old pier, the bay is famous for one thing: newlyweds throw their rings into it for luck. The partner who didn't do the last Botch or Watch dives down to the sandy bottom and searches for a wedding ring among the shells and the seaweed, while the other waits on the pier and may only shout directions. Come up with a shell, a bottle cap or nothing at all, and it's back down again. A real ring, handed up onto the pier, earns the next tip." },
    { id: 'fire-walk', judge: true, called: 'the fire walk', kind: 'allin', types: ['nerve', 'strength'], base: 20, pass: 0.55, loopCost: 10, opens: 420, closes: 1260,
      plate: 'jungle path (fire walk)', label: 'All-In: the fire walk',
      // grass skirts and leis (one falls off); the lift onto a back or into arms (can't); across the coals (a stop, a step
      // off, a drop: back to the start); the fire dancer at the far end
      stages: [{ id: 'grass-skirts', share: 0.6, risk: 0.2 }, { id: 'the-lift', share: 0.3, risk: 0.3 }, { id: 'the-coals', share: 1.3, risk: 1 },
        { id: 'fire-dancer', share: 0.3, risk: 0 }],
      desc: "In a clearing on the jungle path, both partners put on grass skirts and flower leis, and then one carries the other, piggyback or in both arms, all the way across a long bed of glowing hot coals. Stopping, stepping off the side or dropping the partner means going back to the start of the coals and carrying them across again. A local fire dancer waits at the far end, and a clean crossing in costume earns the next tip." },
    { id: 'hut-run', kind: 'travel', mode: 'foot', base: 15, cost: 0, plate: 'beach path', label: 'Run to the tiki hut' },
    { id: 'mat', kind: 'mat', plate: 'tiki hut', label: 'The Chill Zone' },
  ],
};

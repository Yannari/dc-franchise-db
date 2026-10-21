// Ice Floe (LEGS.txt 18-ICE-FLOE), 1:1 with the real show's "Lord of the Ring Toss": a small plane to a tundra airstrip;
// whoever didn't do the last Botch or Watch digs a ring out of the snow and tosses it onto a narwhal's tusk at the edge
// of the ice (Botch or Watch); both saw blocks of ice and build an igloo a local will sleep in (All-In); a run to the
// ice Chill Zone.
export default {
  id: 'ice-floe', name: 'Ice Floe', recap: 'ringing a narwhal and building an igloo at the top of the world',
  region: 'north', map: { x: 30, y: 6 },
  arrive: 'airport', local: ['plane', 'foot'],
  stretches: [
    { id: 'tundra-hop', kind: 'travel', mode: 'plane', base: 50, cost: 0, plate: 'tundra airstrip', label: 'Small plane to the tundra',
      mishaps: [['whiteout', 20]], mishapRate: 0.1 },
    { id: 'narwhal', called: 'the ice edge', kind: 'botch', types: ['search', 'hands'], base: 15, pass: 0.4, loopCost: 6,
      teaser: 'Who has the best aim?', plate: 'ice edge, open water', label: 'Botch or Watch: ring the narwhal',
      // digging in the snow for a ring (nothing there); behind the line, waiting for a tusk; the throw (it sinks: dig for
      // another); ringed. a throws, b watches
      stages: [{ id: 'dig-ring', share: 0.6, risk: 0.3 }, { id: 'the-line', share: 0.3, risk: 0 }, { id: 'the-throw', share: 1, risk: 1 },
        { id: 'ringed', share: 0.2, risk: 0 }],
      desc: "At the edge of the ice, where the sea is still open, a narwhal surfaces now and then with its long spiral tusk pointing at the sky. The partner who didn't do the last Botch or Watch digs through the snow until they find a ring, then throws it from behind the line and tries to land it over the tusk. A ring that misses sinks, so a miss means digging for another one. The other partner can only watch. A ring that lands on the tusk earns the next tip." },
    { id: 'igloo', called: 'the igloo village', kind: 'allin', types: ['hands', 'strength'], base: 40, pass: 0.55, loopCost: 15, opens: 420, closes: 1200,
      plate: 'igloo village', label: 'All-In: the igloo',
      // sawing blocks out of the snow (one cracks); the first ring (it slumps); closing the dome (it caves in); the local's
      // inspection, crawling in (a gap: build it again); the local stays inside
      stages: [{ id: 'saw-blocks', share: 1, risk: 0.4 }, { id: 'first-ring', share: 0.8, risk: 0.4 }, { id: 'the-dome', share: 1, risk: 1 },
        { id: 'local-test', share: 0.4, risk: 0.6 }, { id: 'igloo-tip', share: 0.2, risk: 0 }],
      desc: "In a village of igloos on the ice, both partners saw blocks out of the hard-packed snow and build their own igloo, ring by ring, each block leaning in a little more until the dome closes over the top. A local who has built a thousand of them inspects every one, and an igloo that sags, has a gap or falls in means pulling it down and building again. When the local crawls inside and stays, the team gets the next tip." },
    { id: 'floe-run', kind: 'travel', mode: 'foot', base: 15, cost: 0, plate: 'snow path', label: 'Run across the ice' },
    { id: 'mat', kind: 'mat', plate: 'ice Chill Zone', label: 'The Chill Zone' },
  ],
};

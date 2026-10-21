// Stilt River (LEGS.txt 22-STILT-RIVER), 1:1 with the real show's "Ca-Noodling" leg: a long-tail boat up the river to a
// village on stilts; teams arriving together join up as one Superteam and catch six catfish out of the muddy shallows
// with their bare hands (Superteam); then crawl through old trap-filled tunnels in the dark until they find the Don Box
// with the map out (All-In); a run to the Chill Zone on the temple path at sunset.
export default {
  id: 'stilt-river', name: 'Stilt River', recap: 'catching catfish with bare hands and crawling through booby-trapped tunnels',
  region: 'far-east', map: { x: 78, y: 50 },
  arrive: 'airport', local: ['boat', 'foot'],
  stretches: [
    { id: 'longtail-boat', kind: 'travel', mode: 'boat', base: 35, cost: 15, plate: 'river, stilt village', label: 'Long-tail boat up the river',
      mishaps: [['tangled-propeller', 20]], mishapRate: 0.1 },
    { id: 'catfish', called: 'the river bank', kind: 'superteam', types: ['water', 'strength'], base: 30, pass: 0.5, loopCost: 10, opens: 420, closes: 1200,
      plate: 'river bank', label: 'Superteam: the catfish',
      // wading into the shallows (slipping on the mud); feeling for them underwater (one slips away); into the basket (it
      // wriggles out and swims off); the fisherman counts six
      stages: [{ id: 'wade-in', share: 0.4, risk: 0.2 }, { id: 'feel-around', share: 1, risk: 0.6 }, { id: 'the-basket', share: 0.6, risk: 1 },
        { id: 'six-fish', share: 0.2, risk: 0 }],
      desc: "At the river bank below the stilt village, teams that arrive together are joined into one Superteam, and between them they have to catch six catfish from the muddy shallows with their bare hands, no nets, no rods. Every fish caught goes into the fisherman's basket, and a catfish that wriggles out of the basket swims away and has to be caught again. When the fisherman counts six in the basket, every team in the Superteam gets the next tip." },
    { id: 'tunnels', called: 'the tunnels', kind: 'allin', types: ['search', 'nerve'], base: 30, pass: 0.5, loopCost: 10, opens: 420, closes: 1260,
      plate: 'dark tunnel', label: 'All-In: the tunnels',
      // the tunnel mouth in the jungle (won't go in); the traps in the dark (sprung: back to the junction); the dead ends;
      // the Don Box with the map; out into daylight
      stages: [{ id: 'in-the-dark', share: 0.4, risk: 0.2 }, { id: 'the-traps', share: 1.2, risk: 1 }, { id: 'tunnel-ends', share: 0.8, risk: 0.6 },
        { id: 'map-box', share: 0.3, risk: 0 }, { id: 'daylight', share: 0.3, risk: 0 }],
      desc: "Under the jungle is a maze of narrow old tunnels, dark, low and full of harmless traps: trapdoors into mud, tripwires that drop sand, dead ends. Both partners crawl through with one torch between them until they find the Don Box holding the map to the way out. A wrong turn or a sprung trap sends them back to the last junction, and losing the torch means feeling the way in the dark. Out of the tunnels with the map earns the next tip." },
    { id: 'temple-run', kind: 'travel', mode: 'foot', base: 20, cost: 0, plate: 'jungle path', label: 'Run to the temple path' },
    { id: 'mat', kind: 'mat', plate: 'temple path at sunset', label: 'The Chill Zone' },
  ],
};

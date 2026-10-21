// Coast Palace (LEGS.txt 05-COAST-PALACE), 1:1 with the real show's "Mediterranean Homesick Blues": a train along
// the coast; whoever didn't do the last Botch or Watch takes the tip from a great white's dorsal fin; both partners
// build a sand replica of the palace, judged by a little surfer boy who takes it very seriously; a motorboat out to
// the Chill Zone in the harbour.
export default {
  id: 'coast-palace', name: 'Coast Palace', recap: 'pulling tips off a shark and building sand palaces for a very strict little surfer',
  region: 'old-coast', map: { x: 49, y: 33 },
  arrive: 'airport', local: ['train', 'taxi', 'foot', 'boat'],
  stretches: [
    { id: 'coast-train', kind: 'travel', mode: 'train', base: 50, cost: 20, plate: 'shoreline', label: 'Train along the coast',
      mishaps: [['wrong-carriage', 15]], mishapRate: 0.1 },
    { id: 'shark', called: 'the shark cage', kind: 'botch', types: ['water', 'nerve'], base: 15, pass: 0.5, loopCost: 10,
      teaser: "Who's scared of sharks?", plate: 'open sea, cliffs', label: "Botch or Watch: the shark's fin",
      // mask on and down the ladder (back up it in a panic); treading water while the fin circles; the pass (too early,
      // too late: wait for it to come round); back aboard with the tip. a goes in, b watches from the boat
      stages: [{ id: 'suit-up', share: 0.4, risk: 0.3 }, { id: 'in-the-water', share: 0.7, risk: 0.4 }, { id: 'the-pass', share: 1, risk: 1 },
        { id: 'back-aboard', share: 0.4, risk: 0 }],
      desc: "Off the cliffs, a boat takes each team out to open water where a great white circles with a travel tip clipped to its dorsal fin. The partner who didn't do the last Botch or Watch climbs down into the water and has to grab the tip off the fin as the shark swims past, while the other watches from the boat and can only shout. Grabbing too early, too late or panicking back up the ladder means waiting for the shark to come round again. The tip in hand, back on the boat, earns the next one." },
    { id: 'sand-palace', judge: true, called: 'the beach', kind: 'allin', types: ['hands', 'patience'], base: 35, pass: 0.5, loopCost: 15, opens: 420, closes: 1200,
      plate: 'sandcastle beach', label: 'All-In: the sand palace',
      // the plan scratched in the sand from the photo; the walls (they slump); the towers (one falls, a wave comes); the
      // surfer boy's verdict (rebuild what he points at); his nod and the tip
      stages: [{ id: 'the-plan', share: 0.3, risk: 0 }, { id: 'walls', share: 1, risk: 0.5 }, { id: 'towers', share: 1.2, risk: 0.8 },
        { id: 'the-verdict', share: 0.5, risk: 1 }, { id: 'the-nod', share: 0.3, risk: 0 }],
      desc: "On the beach below the palace, both partners build a sand replica of it from a photo: the towers, the walls, the gates and the gardens, all of it. A little local surfer boy judges every one, and he is very, very strict. A palace that's missing a tower, that slumps when it dries, or that a wave washes into, is a no, and the team rebuilds what he points at. When the boy finally nods, he hands over the next tip." },
    { id: 'motorboat', kind: 'travel', mode: 'boat', base: 25, cost: 30, plate: 'harbour, speedboats', label: 'Motorboat to the Chill Zone',
      mishaps: [['engine-cuts-out', 15]], mishapRate: 0.1 },
    { id: 'mat', kind: 'mat', plate: 'harbour pier', label: 'The Chill Zone' },
  ],
};

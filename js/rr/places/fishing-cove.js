// Fishing Cove (LEGS.txt 36-FISHING-COVE), the World Tour's fishing-village leg as the frames show it: both partners
// row a boat in from the open sea to the cove; in a fisherman's shack they take the local welcome rite, drink a glass of
// something that tastes like vinegar, repeat back what the old fisherman says in the cove's thick dialect, and kiss a
// cod on the lips (All-In); the Chill Zone is at the red shack on the beach.
export default {
  id: 'fishing-cove', name: 'Fishing Cove', recap: 'rowing ashore and kissing a cod to become an honorary local',
  region: 'north', map: { x: 31, y: 24 },
  // a place being built: playable when booked, never drawn or offered until its lines, plates and music are in
  draft: true,
  arrive: 'airport', local: ['rowboat', 'foot'],
  stretches: [
    { id: 'rowboat', kind: 'travel', mode: 'rowboat', base: 40, cost: 0, plate: 'open sea, rowboats', label: 'Row to the shore',
      mishaps: [['oar-overboard', 25]], mishapRate: 0.12 },
    { id: 'welcome-rite', called: 'the fisherman\'s shack', kind: 'allin', types: ['stomach', 'people'], base: 25, pass: 0.5, loopCost: 10, opens: 420, closes: 1260,
      plate: 'shack interior table', label: 'All-In: the welcome rite',
      desc: "In a little fisherman's shack by the water, the old fisherman sits at a table with a bottle, a glass and a very large, very dead cod. To be welcomed to the cove, both partners have to drink a full glass of something that tastes exactly like vinegar, repeat back, word for word, a sentence he says in the cove's thick local dialect, and then kiss the cod full on the lips. Spitting out the drink, getting a word wrong or pulling away from the fish means starting the rite again. When the fisherman declares them honorary locals, the team gets the next tip." },
    { id: 'beach-run', kind: 'travel', mode: 'foot', base: 10, cost: 0, plate: 'pebble beach', label: 'Run along the beach' },
    { id: 'mat', kind: 'mat', plate: 'red shack on the beach', label: 'The Chill Zone' },
  ],
};

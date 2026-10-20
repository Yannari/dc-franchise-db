// Stone Head Island (LEGS.txt 46-STONE-HEAD-ISLAND), the World Tour's giant-stone-heads leg as the frames show it: a
// jeep across the island; both partners search the rows of giant stone heads on the beach for three painted eggs hidden
// in and around them (All-In); then the partner who didn't do the last Botch or Watch climbs the rock spire and returns
// the eggs to the giant nest at the top, while the condor that owns it circles (Botch or Watch); the Chill Zone is on the
// grass dune.
export default {
  id: 'stone-head-island', name: 'Stone Head Island', recap: 'hunting painted eggs among giant stone heads and returning them to a condor',
  region: 'ocean', map: { x: 4, y: 66 },
  arrive: 'airport', local: ['drive', 'foot'],
  stretches: [
    { id: 'island-jeep', kind: 'travel', mode: 'drive', base: 30, cost: 15, plate: 'island track, grass', label: 'Jeep across the island',
      mishaps: [['wild-horses', 20]], mishapRate: 0.1 },
    { id: 'eggs', called: 'the stone heads', kind: 'allin', types: ['search', 'patience'], base: 30, pass: 0.5, loopCost: 10, opens: 420, closes: 1200,
      plate: 'stone heads on the beach', label: 'All-In: the painted eggs',
      desc: "Along the beach stand rows of giant stone heads, taller than a barn, staring out to sea. Hidden in the cracks, under the chins, behind the ears and buried in the sand around them are dozens of eggs, and only three are painted in the team's colour. Both partners search head by head, and put each one they find in a padded basket. A cracked egg, or an egg in another team's colour, means putting it back and searching again. Three unbroken eggs in their own colour earns the next tip." },
    { id: 'condor-nest', called: 'the rock spire', kind: 'botch', types: ['heights', 'nerve'], base: 20, pass: 0.45, loopCost: 10,
      teaser: 'Who can climb?', plate: 'rock spire + giant nest', label: 'Botch or Watch: the condor nest',
      desc: "On top of a tall rock spire sits a giant nest, and the three painted eggs belong in it. The partner who didn't do the last Botch or Watch climbs the spire with the eggs in a pouch, places them in the nest and climbs back down, while a huge condor circles overhead and swoops at anyone who takes too long. A cracked egg, a slip into the harness or a retreat from the condor means climbing down and starting again. The other partner can only watch from the bottom. Three eggs in the nest and both feet back on the ground earns the next tip." },
    { id: 'mat', kind: 'mat', plate: 'grass dune', label: 'The Chill Zone' },
  ],
};

// Great Falls (LEGS.txt 43-GREAT-FALLS), the World Tour's honeymoon-falls leg as the frames show it: both partners paddle
// a swan boat away from the roar of the falls to the landing; in an old theatre hall, the partner who didn't do the last
// Botch or Watch pulls a slot machine until it lands three hearts, then finds the one wedding dress on the rails that
// matches the picture (Botch or Watch); then both cross the falls on a tightrope with a balance pole (All-In); the Chill
// Zone is on the rim of the falls.
export default {
  id: 'great-falls', name: 'Great Falls', recap: 'paddling a swan boat, playing a wedding slot machine and walking a tightrope over the falls',
  region: 'north', map: { x: 25, y: 30 },
  arrive: 'airport', local: ['swan-boat', 'foot'],
  stretches: [
    { id: 'swan-boat', kind: 'travel', mode: 'swan-boat', base: 30, cost: 0, plate: 'falls, swan boats', label: 'Paddle the swan boat',
      mishaps: [['swan-boat-spins', 25]], mishapRate: 0.12 },
    { id: 'wedding-slots', called: 'the theatre hall', kind: 'botch', types: ['search', 'patience'], base: 20, pass: 0.45, loopCost: 8,
      teaser: 'Who is feeling lucky?', plate: 'old theatre hall', label: 'Botch or Watch: the wedding slot machine',
      // pulling the lever (anything but three hearts: pull again); three hearts and the printed picture; the rails of
      // dresses (the wrong one: back to the rails); the minister. a plays, b watches from the pews
      stages: [{ id: 'the-lever', share: 0.8, risk: 1 }, { id: 'three-hearts', share: 0.2, risk: 0 }, { id: 'the-rails', share: 0.8, risk: 0.8 },
        { id: 'the-minister', share: 0.2, risk: 0 }],
      desc: "In an old theatre hall turned into a wedding chapel, a giant slot machine stands by the stage. The partner who didn't do the last Botch or Watch pulls the lever until the reels land three hearts in a row, then searches the long rails of wedding dresses for the one that matches the picture the machine prints out. Anything but three hearts means pulling again, and the wrong dress means back to the rails. The other partner can only watch from the pews. The matching dress, held up for the chapel's minister, earns the next tip." },
    { id: 'tightrope', called: 'the falls', kind: 'allin', types: ['heights', 'nerve'], base: 25, pass: 0.5, loopCost: 10, opens: 480, closes: 1140,
      plate: 'tightrope over the falls', label: 'All-In: the tightrope',
      // clipped into the harness at the rim; the first steps out (wobbles); the middle in the spray (a fall into the
      // harness: winched back to the start); the far rim
      stages: [{ id: 'the-harness', share: 0.2, risk: 0 }, { id: 'first-steps', share: 0.5, risk: 0.5 }, { id: 'the-spray', share: 1, risk: 1 },
        { id: 'far-rim', share: 0.3, risk: 0 }],
      desc: "A tightrope stretches across the gorge above the roaring falls, spray drifting over it, with a safety harness clipped to a line above. Both partners walk it, one after the other, carrying a long balance pole. A fall into the harness means being winched back to the start and walking it again. Both partners standing on the far rim earns the next tip." },
    { id: 'mat', kind: 'mat', plate: 'falls rim, booths', label: 'The Chill Zone' },
  ],
};

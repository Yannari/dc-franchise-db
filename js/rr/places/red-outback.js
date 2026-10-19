// Red Outback (LEGS.txt 41-RED-OUTBACK), from World Tour's outback leg (the wiki's "Picnic at Hanging Dork"), adapted
// for pairs: catch one of the emus in the corral and ride it across the red plain to the hanging rock (a kangaroo kicked
// one racer flat, and another arrived in its pouch); Botch or Watch, bungee off the rock and grab a sheep from the pen
// below; shear sheep until one shows the team's brand (only a few carry one, and a bare sheep with no brand means
// another sheep); the Chill Zone at the camp on top of the rock.
export default {
  id: 'red-outback', name: 'Red Outback', recap: 'riding emus across the outback, bungee jumping for sheep and shearing them bald',
  region: 'ocean', map: { x: 86, y: 72 },
  arrive: 'airport', local: ['drive', 'foot'],
  stretches: [
    { id: 'outback-drive', kind: 'travel', mode: 'drive', base: 40, cost: 20, plate: 'red dirt road', label: 'Drive to the corral' },
    { id: 'emu-catch', called: 'the emu corral', kind: 'allin', types: ['hands', 'nerve'], base: 15, pass: 0.5, loopCost: 8, opens: 420, closes: 1140,
      plate: 'red plain, emu corral', label: 'All-In: catch your ride',
      desc: "In a dusty corral on the red plain, a flock of emus runs in circles, and every team needs one each. Both partners must catch an emu with a halter, get it calm, and climb on its back. Emus are fast, they kick, and they hate being caught, so a team that chases one into a corner usually ends up in the dirt, and an emu that bolts with its halter on has to be caught all over again. Once both partners are mounted, the team takes the tip for the hanging rock." },
    { id: 'emu-ride', kind: 'travel', mode: 'emu', base: 45, cost: 0, plate: 'red plain, the hanging rock', label: 'Emu to the hanging rock',
      // the real leg: an emu that wouldn't go where it was told, and a kangaroo that knocked a racer flat
      ride: true, mishaps: [['emu-throws', 20], ['kangaroo', 15]], mishapRate: 0.15 },
    { id: 'sheep-bungee', called: 'the hanging rock', kind: 'botch', types: ['heights', 'nerve'], base: 15, pass: 0.55, loopCost: 10,
      teaser: 'Who wants to take the plunge?', plate: 'cliff edge, bungee rope', label: 'Botch or Watch: grab a sheep',
      desc: "From a platform on the edge of the hanging rock, the partner who didn't do the last Botch or Watch makes a bungee jump towards the sheep pen far below. At the bottom of the drop they have a split second to grab a sheep and hold on as the rope pulls them back up. Come up empty-handed, or drop the sheep on the way, and it's back to the platform to jump again. A partner who comes back up with an armful of sheep hands it over for shearing." },
    { id: 'shearing', called: 'the shearing shed', kind: 'allin', types: ['hands', 'patience'], base: 20, pass: 0.4, loopCost: 12,
      plate: 'sheep pen, shearing shed', label: 'All-In: find the brand',
      desc: "In the shearing shed, both partners shear their sheep down to the skin with a pair of old clippers, looking for the race's brand. Only a few sheep carry it, so a sheep that comes out bald and blank means going back to the pen for another one and starting again. Sheep wriggle, kick and bleat the whole time. The team that finds the brand under the wool takes the tip to the Chill Zone at the top of the rock." },
    { id: 'mat', kind: 'mat', plate: 'cliff-top camp', label: 'The Chill Zone' },
  ],
};

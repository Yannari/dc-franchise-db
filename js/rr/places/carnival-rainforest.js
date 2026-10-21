// Carnival Rainforest (LEGS.txt 07-CARNIVAL-RAINFOREST), 1:1 with the real show's "Brazilian Pain Forest": whoever
// didn't do the last Botch or Watch takes the tip out of a mitten full of bullet ants; both cross a gorge any way they
// can (the vines) and search a mountain of coconuts for the one with the tip; both make a carnival costume, headpiece
// and tailpiece, for a local who has opinions; a hang glider down to the beach and the Chill Zone.
export default {
  id: 'carnival-rainforest', name: 'Carnival Rainforest', recap: 'putting a hand in a mitten of bullet ants, swinging over a gorge and dressing for carnival',
  region: 'ocean', map: { x: 33, y: 62 },
  arrive: 'airport', local: ['taxi', 'foot', 'glider'],
  stretches: [
    { id: 'ants', called: 'the forest floor', kind: 'botch', types: ['nerve', 'stomach'], base: 12, pass: 0.5, loopCost: 8,
      teaser: 'Who has a high pain threshold?', plate: 'forest floor', label: 'Botch or Watch: the ant mitten',
      // the mitten held out, crawling (won't put a hand in); the hand in, the stings (out empty); the tip fished out in one
      // piece (dropped back in); the swollen hand and the tip. a's hand, b watches
      stages: [{ id: 'the-mitten', share: 0.4, risk: 0.3 }, { id: 'hand-in', share: 1, risk: 1 }, { id: 'ant-tip', share: 0.4, risk: 0.4 },
        { id: 'swollen', share: 0.3, risk: 0 }],
      desc: "On the forest floor, a local holds out a woven mitten crawling with bullet ants, whose sting is the most painful of any insect. The partner who didn't do the last Botch or Watch puts a hand inside and feels for the travel tip at the bottom while the ants do what bullet ants do, and the other partner can only watch. Pull the hand out empty, and it goes back in. The tip out of the mitten, in one piece, earns the next one." },
    { id: 'gorge', called: 'the gorge', kind: 'allin', types: ['heights', 'search'], base: 25, pass: 0.55, loopCost: 12, opens: 420, closes: 1140,
      plate: 'gorge + coconut pile', label: 'All-In: over the gorge',
      // the edge of the gorge (frozen); the swing on the vine (a miss: into the river, back to the climb); the mountain of
      // coconuts (only milk); the right coconut
      stages: [{ id: 'gorge-edge', share: 0.4, risk: 0.2 }, { id: 'the-swing', share: 1.2, risk: 1 }, { id: 'coconut-pile', share: 1.2, risk: 0.7 },
        { id: 'the-coconut', share: 0.3, risk: 0 }],
      desc: "A deep gorge cuts across the trail, and teams have to get across by any means: most swing on the vines hanging over it, one at a time, and hope. A missed swing drops you into the river below and back to the start of the climb. On the far side waits a mountain of coconuts, and only one of them has the travel tip inside; both partners dig, shake and crack until they find it. The right coconut is the next tip." },
    { id: 'costume', judge: true, called: 'the costume tent', kind: 'allin', types: ['hands', 'perform'], base: 30, pass: 0.5, loopCost: 12, opens: 480, closes: 1260,
      plate: 'costume-making table in the jungle', label: 'All-In: carnival costume',
      // the feathers; the headpiece (it collapses); the tailpiece; the parade for the judge (it just stands there: more!);
      // the judge cheers
      stages: [{ id: 'feathers', share: 1, risk: 0.3 }, { id: 'headpiece', share: 1, risk: 0.6 }, { id: 'tailpiece', share: 0.8, risk: 0.3 },
        { id: 'the-parade', share: 0.6, risk: 1 }, { id: 'judge-cheers', share: 0.3, risk: 0 }],
      desc: "In a tent at the edge of the rainforest, both partners make a full carnival costume from feathers, sequins and wire: a towering headpiece for one and a sweeping tailpiece for the other. Then they parade it for a local carnival judge, who wants it big, bright and dancing. A costume that sags, sheds feathers or just sort of stands there gets sent back for more work. When the judge cheers, the next tip is theirs." },
    { id: 'glide', kind: 'travel', mode: 'glider', base: 20, cost: 0, plate: 'cliff edge + beach', label: 'Hang glide to the beach',
      mishaps: [['lands-in-the-sea', 15]], mishapRate: 0.1 },
    { id: 'mat', kind: 'mat', plate: 'beach', label: 'The Chill Zone' },
  ],
};

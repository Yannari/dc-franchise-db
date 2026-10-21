// Tea Hills (LEGS.txt 24-TEA-HILLS), 1:1 with the real show's "Darjeel With It": a jeep up into the tea plantation;
// both partners pick tea leaves on the terraces until a basket is full enough for the plantation's picker to accept it
// (All-In); then board the little steam train in the hills and push through every crowded carriage to the front one,
// to get off at the station where the Chill Zone is (All-In).
export default {
  id: 'tea-hills', name: 'Tea Hills', recap: 'picking tea on the terraces and fighting through a crowded steam train',
  region: 'far-east', map: { x: 71, y: 41 },
  arrive: 'airport', local: ['drive', 'foot'],
  stretches: [
    { id: 'hill-jeep', kind: 'travel', mode: 'drive', base: 45, cost: 20, plate: 'hill road, terraces', label: 'Jeep up the hill road',
      mishaps: [['landslide-on-the-road', 20]], mishapRate: 0.1 },
    { id: 'tea-basket', judge: true, called: 'the tea terraces', kind: 'allin', types: ['patience', 'hands'], base: 35, pass: 0.55, loopCost: 12, opens: 360, closes: 1080,
      plate: 'tea terraces', label: 'All-In: the tea basket',
      // baskets on at the terraces; picking the top two leaves and the bud (old leaves, stalks); filling it to the top (not
      // full); the old picker tips it out (rejected: back up the terraces); the tip
      stages: [{ id: 'baskets-on', share: 0.3, risk: 0 }, { id: 'picking', share: 1.2, risk: 0.6 }, { id: 'fill-up', share: 0.6, risk: 0.5 },
        { id: 'the-check', share: 0.4, risk: 1 }, { id: 'tea-tip', share: 0.2, risk: 0 }],
      desc: "On the steep green terraces of the plantation, both partners strap a wicker basket to their backs and pick tea by hand, only the top two leaves and the bud, the way the pickers do. When the basket is full they carry it down to the plantation's oldest picker, who tips it out and checks it. Old leaves, stalks, or a basket that isn't full means back up the terraces to pick more. A full basket of good leaves earns the next tip." },
    { id: 'toy-train', called: 'the steam train', kind: 'allin', types: ['people', 'strength'], base: 30, pass: 0.6, loopCost: 10, opens: 360, closes: 1200,
      plate: 'steam train in the hills', label: 'All-In: the front carriage',
      // catching the train at the platform (missed it); on at the back; squeezing through the packed carriages (stuck);
      // the front carriage and the right stop (the wrong one: walk back, next train); off at the station
      stages: [{ id: 'catch-train', share: 0.3, risk: 0.3 }, { id: 'back-carriage', share: 0.3, risk: 0 }, { id: 'squeeze-through', share: 1.2, risk: 1 },
        { id: 'front-carriage', share: 0.5, risk: 0.5 }, { id: 'off-train', share: 0.2, risk: 0 }],
      desc: "A little blue steam train winds slowly through the hills, every carriage packed with passengers, goats, sacks of rice and baskets of chickens. Both partners board at the back and have to work their way, carriage by carriage, to the very front one, because only the front carriage gets off at the right station. Squeezing past without a please, getting stuck, or getting off at the wrong stop means walking back to the line and catching the next train. Stepping off the front carriage at the Chill Zone's station checks the team in." },
    { id: 'mat', kind: 'mat', plate: 'station platform', label: 'The Chill Zone' },
  ],
};

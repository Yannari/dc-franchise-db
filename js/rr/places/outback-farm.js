// Outback Farm (LEGS.txt 15-OUTBACK-FARM), 1:1 with the real show's "Down and Outback": a ute to a farm overrun with
// rabbits; both partners catch ten of them in a sack before they wreck the wheat (one rare white rabbit is worth all
// ten); a glider over the valley to the Chill Zone on the mountain.
export default {
  id: 'outback-farm', name: 'Outback Farm', recap: 'chasing rabbits through the wheat and gliding over a valley',
  region: 'far-east', map: { x: 88, y: 72 },
  arrive: 'airport', local: ['drive', 'glider', 'foot'],
  stretches: [
    { id: 'ute-drive', kind: 'travel', mode: 'drive', base: 40, cost: 20, plate: 'dirt road, gum trees', label: 'Drive the ute to the farm',
      mishaps: [['kangaroo-in-the-road', 15]], mishapRate: 0.1 },
    { id: 'bunnies', judge: true, called: 'the farm', kind: 'allin', types: ['search', 'strength'], base: 30, pass: 0.5, loopCost: 10, opens: 360, closes: 1200,
      plate: 'wheat field, barn', label: 'All-In: the rabbits',
      // the farmer and the sack at the fence; into the wheat after them (they zigzag away); the white one, spotted down on
      // the jetty (it gets away); the sack (badly tied: they escape, count again); the farmer's count
      stages: [{ id: 'the-farmer', share: 0.3, risk: 0 }, { id: 'into-wheat', share: 1, risk: 0.6 }, { id: 'white-rabbit', share: 0.6, risk: 0.6 },
        { id: 'the-sack', share: 0.8, risk: 0.8 }, { id: 'the-count', share: 0.3, risk: 0 }],
      desc: "The farmer's wheat field is overrun with rabbits, and both partners have to catch ten of them and put them in a sack. Rabbits are fast, they zigzag, and they slip out of a badly tied sack, so a team that lets them escape counts again from the rabbits still in the bag. One rare white rabbit lives in the field, and catching it counts as all ten at once. When the farmer has counted ten in the sack, or seen the white one, he hands over the next tip." },
    { id: 'valley-glide', kind: 'travel', mode: 'glider', base: 25, cost: 0, plate: 'valley glider launch', label: 'Glide over the valley',
      mishaps: [['loses-the-thermal', 15]], mishapRate: 0.1 },
    { id: 'mat', kind: 'mat', plate: 'valley mat', label: 'The Chill Zone' },
  ],
};

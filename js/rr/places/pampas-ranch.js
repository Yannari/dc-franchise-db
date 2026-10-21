// Pampas Ranch (LEGS.txt 25-PAMPAS-RANCH), 1:1 with the real show's "Last Tango" and "Ice Dancers" legs: in the old city,
// both partners learn the national dance at a dance academy until the instructor accepts it (All-In); then out on the
// grasslands the partner who didn't do the last Botch or Watch rides a horse and brings down the team's emu with
// boleadoras, the weighted throwing ropes, without hurting it (Botch or Watch); the emu comes with them to the Chill
// Zone on the cliff.
export default {
  id: 'pampas-ranch', name: 'Pampas Ranch', recap: 'learning a sultry dance and catching an emu with throwing ropes',
  region: 'ocean', map: { x: 30, y: 82 },
  arrive: 'airport', local: ['taxi', 'horse', 'foot'],
  stretches: [
    { id: 'academy-taxi', kind: 'travel', mode: 'taxi', base: 25, cost: 20, plate: 'old city street', label: 'Taxi to the dance academy',
      mishaps: [['parade-in-the-street', 20]], mishapRate: 0.08 },
    { id: 'tango', judge: true, called: 'the dance academy', kind: 'allin', types: ['perform', 'patience'], base: 35, pass: 0.5, loopCost: 12, opens: 540, closes: 1380,
      plate: 'dance school', label: 'All-In: the dance',
      // the instructor shows them; practice at the barre (toes trodden on, a turn that ends in a heap); the whole
      // routine for her (the dip on the floor: she stops the music, more lessons); her verdict
      stages: [{ id: 'lesson', share: 1, risk: 0 }, { id: 'practice', share: 2, risk: 0.6 }, { id: 'routine', share: 2, risk: 1 },
        { id: 'verdict', share: 0.5, risk: 0 }],
      desc: "At an old dance academy with a wooden floor and a wall of mirrors, both partners learn the city's famous dance, the close embrace, the sharp turns, the leg flicks and the dramatic dip at the end. When they think they have it, they dance the whole routine for the instructor. A missed step, a stumble or a dip that ends on the floor means more lessons and another try. When the instructor finally claps, the team gets the next tip." },
    { id: 'emu', called: 'the grasslands', kind: 'botch', types: ['hands', 'nerve'], base: 25, pass: 0.4, loopCost: 10,
      teaser: 'Who can ride a horse?', plate: 'ranch fence', label: 'Botch or Watch: the emu',
      // the rancher shows the bolas (a practice swing that hits the swinger); riding out after the emu (a fall from the
      // horse); the throw (a miss, a tangle in the grass); leading it back (it bolts)
      stages: [{ id: 'bolas', share: 0.8, risk: 0.3 }, { id: 'ride-out', share: 1, risk: 0.5 }, { id: 'throw', share: 1.2, risk: 1 },
        { id: 'lead-back', share: 0.8, risk: 0.2 }],
      desc: "Out on the endless grasslands, a gaucho hands a set of boleadoras, three leather-covered weights tied together with rope, to the partner who didn't do the last Botch or Watch. They ride out on horseback after the team's emu, swing the boleadoras overhead and throw them so they wrap gently round its legs and bring it to a stop. A miss, a fall from the horse or a throw that tangles in the grass means riding back for the ropes and trying again. The other partner can only watch from the fence. A caught emu, led back to the gaucho, earns the next tip." },
    { id: 'emu-walk', kind: 'travel', mode: 'foot', base: 25, cost: 0, plate: 'grassland track', label: 'Walk the emu to the cliff',
      mishaps: [['emu-runs-off', 25]], mishapRate: 0.12 },
    { id: 'mat', kind: 'mat', plate: 'cliff mat', label: 'The Chill Zone' },
  ],
};

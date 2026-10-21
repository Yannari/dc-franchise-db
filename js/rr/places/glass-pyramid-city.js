// Glass Pyramid City (LEGS.txt 35-GLASS-PYRAMID-CITY), the World Tour's art-museum leg as the frames show it: a taxi to
// the great museum; both partners find the three pieces of a broken statue (head, body, legs) in the galleries and put
// it back together, while animals from a travelling show wander the halls (All-In); then the partner who didn't do the
// last Botch or Watch models a designer's outfit down the museum runway (Botch or Watch); the Chill Zone is at the glass
// pyramid at night.
export default {
  id: 'glass-pyramid-city', name: 'Glass Pyramid City', recap: 'rebuilding a broken statue in a museum and strutting a runway',
  region: 'old-coast', map: { x: 47, y: 29 },
  arrive: 'airport', local: ['taxi', 'foot'],
  stretches: [
    { id: 'museum-taxi', kind: 'travel', mode: 'taxi', base: 30, cost: 20, plate: 'boulevard, cafés', label: 'Taxi to the museum',
      mishaps: [['roundabout-loop', 20]], mishapRate: 0.1 },
    { id: 'broken-statue', called: 'the museum', kind: 'allin', types: ['search', 'brains'], base: 35, pass: 0.5, loopCost: 12, opens: 540, closes: 1260,
      plate: 'museum gallery', label: 'All-In: the broken statue',
      // the smashed statue by its plinth; searching the galleries for the pieces (a real exhibit: put it back); the bear
      // loose in the halls (chased off); fitting it together (upside down); the curator's nod
      stages: [{ id: 'the-plinth', share: 0.2, risk: 0 }, { id: 'galleries', share: 1.2, risk: 0.6 }, { id: 'the-bear', share: 0.4, risk: 0.4 },
        { id: 'fit-it', share: 0.6, risk: 1 }, { id: 'curator-nod', share: 0.2, risk: 0 }],
      desc: "Somewhere in the museum's long galleries are the three pieces of a broken marble statue, a head, a body and a pair of legs, hidden among the real exhibits. Both partners search the halls, carry each piece back to the empty plinth and fit the statue together, while a bear and other animals from a travelling show wander loose through the rooms. The wrong piece, a piece put on upside down, or a dropped head means more searching. When the curator agrees the statue is whole, the team gets the next tip." },
    { id: 'runway', called: 'the runway', kind: 'botch', types: ['perform', 'nerve'], base: 15, pass: 0.5, loopCost: 8,
      teaser: 'Who can strut?', plate: 'museum runway', label: 'Botch or Watch: the runway',
      // into the outfit backstage (it doesn't fit); down the runway (a wobble, a trip); the pose at the end (a giggle);
      // back up; the designer's applause. a walks, b watches from the side
      stages: [{ id: 'the-outfit', share: 0.4, risk: 0.3 }, { id: 'the-walk', share: 0.6, risk: 0.8 }, { id: 'the-pose', share: 0.3, risk: 1 },
        { id: 'walk-back', share: 0.4, risk: 0.4 }, { id: 'applause', share: 0.2, risk: 0 }],
      desc: "In the museum's grand hall, a fashion designer has built a runway between the statues, and the partner who didn't do the last Botch or Watch puts on one of her outfits, a towering, ridiculous creation, and walks it. They have to strut to the end, pose, turn and walk back without tripping, stopping or laughing. The designer watches from the front row and the other partner can only watch from the side. A wobble, a giggle or a fall means a new outfit and another walk. A walk the designer applauds earns the next tip." },
    { id: 'mat', kind: 'mat', plate: 'glass pyramid at night', label: 'The Chill Zone' },
  ],
};

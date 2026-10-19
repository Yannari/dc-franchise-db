// Savanna Falls (LEGS.txt 13-SAVANNA-FALLS), 1:1 with the real show's "My Way or Zimbabwe": drive a jeep to the great
// falls (one team went off-road and found a shortcut, one got lost); a raft over the falls and a team selfie with a
// waterproof camera on the way down, and a miss means carrying the raft back up; one partner takes a picture of the other
// with a white rhino in the national park (one charged a racer who insulted it, one chased a racer all the way to the
// mat); the Chill Zone in the village.
export default {
  id: 'savanna-falls', name: 'Savanna Falls', recap: 'going over a waterfall for a selfie and posing with a very cross rhino',
  region: 'desert', map: { x: 56, y: 63 },
  arrive: 'airport', local: ['drive', 'foot'],
  stretches: [
    { id: 'jeep', kind: 'travel', mode: 'drive', base: 45, cost: 20, plate: 'savanna track, jeep', label: 'Drive a jeep to the falls',
      mishaps: [['lost-in-the-bush', 25], ['stuck-in-mud', 20]], mishapRate: 0.16 },
    { id: 'falls-selfie', called: 'the falls', kind: 'allin', types: ['water', 'nerve'], base: 20, pass: 0.55, loopCost: 15, opens: 420, closes: 1080,
      plate: 'river above the falls, falls cliff', label: 'All-In: selfie over the edge',
      desc: "Above the great falls, each team climbs into a two-person raft with a waterproof camera and rides it over the edge. On the way down, both partners have to be in the shot: one clear team selfie, faces in frame, taken while they're falling. A blurry photo, a photo of one face, or a photo of nothing but spray means hauling the raft back up the path and going over again. A crew member checks the camera at the bottom, and a good selfie earns the next tip." },
    { id: 'rhino', called: 'the national park', kind: 'botch', types: ['nerve', 'people'], base: 15, pass: 0.55, loopCost: 10,
      teaser: 'Who wants a portrait?', plate: 'savanna waterhole, white rhino', label: 'Botch or Watch: say cheese',
      desc: "In the national park, a white rhino grazes near the waterhole. The partner who didn't do the last Botch or Watch must walk up close and pose beside the rhino while the other takes the picture from behind the ranger's line. Get too close, move too fast or say something rude, and the rhino charges, so the poser has to run for it and start again once it settles. A clear photo of partner and rhino together, both in frame, earns the next tip." },
    { id: 'village-run', kind: 'travel', mode: 'foot', base: 20, cost: 0, plate: 'savanna path', label: 'Run to the village',
      // the real leg: a rhino followed one racer all the way to the Chill Zone and threw him onto the mat
      mishaps: [['rhino-chase', 10]], mishapRate: 0.1 },
    { id: 'mat', kind: 'mat', plate: 'village huts', label: 'The Chill Zone' },
  ],
};

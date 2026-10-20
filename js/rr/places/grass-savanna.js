// Grass Savanna (LEGS.txt 45-GRASS-SAVANNA), the World Tour's safari leg as the frames show it: a jeep out onto the
// plains; in a village, both partners fill a basket with wild plums from the trees while the village children kick
// footballs at them (All-In); the partner who didn't do the last Botch or Watch smashes gourds off a row of posts with a
// cricket bat (Botch or Watch); then both track an animal through the tall grass and hit it with a sleepy-dart so the
// rangers can tag it (All-In); the Chill Zone is on the open plain.
export default {
  id: 'grass-savanna', name: 'Grass Savanna', recap: 'picking plums under fire, smashing gourds and tracking an animal through the tall grass',
  region: 'desert', map: { x: 59, y: 58 },
  arrive: 'airport', local: ['drive', 'foot'],
  stretches: [
    { id: 'safari-jeep', kind: 'travel', mode: 'drive', base: 40, cost: 20, plate: 'dirt track, acacias', label: 'Jeep onto the plains',
      mishaps: [['elephants-crossing', 20]], mishapRate: 0.1 },
    { id: 'plums', called: 'the village', kind: 'allin', types: ['search', 'nerve'], base: 25, pass: 0.55, loopCost: 10, opens: 420, closes: 1140,
      plate: 'huts, crate of berries', label: 'All-In: the plums',
      desc: "In the village, the plum trees are heavy with fruit, and both partners have to pick enough to fill a woven basket, while the village children, laughing, kick footballs at them from every direction. A ball that knocks the basket over spills the plums, and every plum on the ground has to be picked up or picked again. A basket filled to the brim and carried to the village elder earns the next tip." },
    { id: 'gourds', called: 'the gourd posts', kind: 'botch', types: ['hands', 'strength'], base: 15, pass: 0.45, loopCost: 6,
      teaser: 'Who can swing a bat?', plate: 'fruit on posts', label: 'Botch or Watch: the gourds',
      desc: "A row of ten wooden posts stands in a clearing, a hard round gourd balanced on each. The partner who didn't do the last Botch or Watch takes a cricket bat and has to smash every gourd off its post, one swing each, in order, without missing. A miss, or a gourd that wobbles but stays, means the gourds go back up and they start the row again. The other partner can only watch. Ten gourds smashed in ten swings earns the next tip." },
    { id: 'safari', called: 'the tall grass', kind: 'allin', types: ['search', 'nerve'], base: 35, pass: 0.45, loopCost: 12, opens: 420, closes: 1140,
      plate: 'tall grass', label: 'All-In: the safari',
      desc: "A ranger points both partners into the tall grass where a wild animal the rangers need to tag is hiding. Following tracks, broken stalks and the ranger's whistles, they have to creep close enough to hit it with a sleepy-dart from a blowpipe, so it naps long enough for the ranger to tag its ear. A missed dart, a spooked animal or creeping up on the wrong animal entirely means falling back and tracking it again. A tagged, sleeping animal earns the next tip." },
    { id: 'mat', kind: 'mat', plate: 'savanna open plain', label: 'The Chill Zone' },
  ],
};

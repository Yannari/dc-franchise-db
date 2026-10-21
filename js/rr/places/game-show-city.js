// Game Show City (LEGS.txt 30-GAME-SHOW-CITY), the World Tour's neon game-show leg as the frames show it: a bullet train
// into the city; on the set of a giant game show, both partners take turns as the ball on a human
// pinball table, bouncing off bumpers to light every target before the timer runs out, while a man in a panda suit
// "helps" (All-In). (LEGS: the candy commercial has no usable plate, so the leg is the pinball alone, as the plan says.)
export default {
  id: 'game-show-city', name: 'Game Show City', recap: 'being the ball on a giant pinball table on a game show set',
  region: 'far-east', map: { x: 87, y: 35 },
  arrive: 'airport', local: ['train', 'foot'],
  stretches: [
    { id: 'bullet-train', kind: 'travel', mode: 'train', base: 25, cost: 20, plate: 'bullet train platform', label: 'Bullet train into the city',
      mishaps: [['wrong-platform', 20]], mishapRate: 0.1 },
    { id: 'pinball', called: 'the game show set', kind: 'allin', types: ['nerve', 'strength'], base: 25, pass: 0.45, loopCost: 10, opens: 600, closes: 1380,
      plate: 'pinball table', label: 'All-In: human pinball',
      // the padded suit at the flippers (stuck in it); the launch; round the bumpers (drained past the flippers: a new
      // ball); the panda on the table; the last target before the timer (time: a new ball); five lit
      stages: [{ id: 'padded-suit', share: 0.3, risk: 0.2 }, { id: 'the-launch', share: 0.2, risk: 0 }, { id: 'the-bumpers', share: 1, risk: 0.6 },
        { id: 'the-panda', share: 0.5, risk: 0.5 }, { id: 'last-target', share: 0.6, risk: 1 }, { id: 'five-lit', share: 0.2, risk: 0 }],
      desc: "On the set of the loudest game show in the city, a pinball table the size of a tennis court tilts towards the flippers. Both partners take turns being the ball: strapped into a padded suit, launched from the plunger, they bounce off giant bumpers and have to light all five targets before the timer runs out, while the other partner works the flippers. A man in a panda suit wanders onto the table to 'help', which never helps. A ball that drains past the flippers, or a timer that runs out, means a new ball. Five lit targets earns the next tip." },
    { id: 'neon-run', kind: 'travel', mode: 'foot', base: 20, cost: 0, plate: 'neon crossing', label: 'Run through the neon crossing' },
    { id: 'mat', kind: 'mat', plate: 'game show stage', label: 'The Chill Zone' },
  ],
};

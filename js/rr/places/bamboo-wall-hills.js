// Bamboo Wall Hills (LEGS.txt 44-BAMBOO-WALL-HILLS), the World Tour's wall-race-and-banquet leg as the frames show it: a
// bus through the bamboo hills; both partners race the length of a section of the ancient wall, up and down its steps,
// before the monk at the end strikes the gong (All-In); then the partner who didn't do the last Botch or Watch eats a
// bowl of the hills' strangest delicacies, every bite (Botch or Watch); the Chill Zone is at the end of the wall.
export default {
  id: 'bamboo-wall-hills', sacred: true, name: 'Bamboo Wall Hills', recap: 'racing the ancient wall before the gong and eating a bowl of delicacies',
  region: 'far-east', map: { x: 81, y: 40 },
  arrive: 'airport', local: ['bus', 'foot'],
  stretches: [
    { id: 'bamboo-bus', kind: 'travel', mode: 'bus', base: 40, cost: 15, plate: 'bamboo forest road', label: 'Bus through the bamboo hills',
      mishaps: [['panda-in-the-road', 15]], mishapRate: 0.08 },
    { id: 'wall-race', called: 'the wall', kind: 'allin', types: ['strength', 'patience'], base: 35, pass: 0.55, loopCost: 12, opens: 360, closes: 1080,
      plate: 'wall walkway', label: 'All-In: the wall before the gong',
      // the start of the section; the steep steps up and down (out of breath); the run from tower to tower (one partner
      // left behind); the last tower before the gong (after it: back to the start)
      stages: [{ id: 'wall-start', share: 0.2, risk: 0 }, { id: 'wall-steps', share: 1, risk: 0.6 }, { id: 'tower-to-tower', share: 0.8, risk: 0.6 },
        { id: 'the-gong', share: 0.3, risk: 1 }],
      desc: "A section of the ancient wall snakes along the ridge of the hills, all steep stone steps up to one watchtower and down to the next. Both partners have to run the whole section, together, and reach the last watchtower before the monk standing there strikes the gong, on a timer only the monk knows. Reaching the tower after the gong, or arriving without the partner, means walking back to the start of the section and running it again. Both partners in the tower before the gong earns the next tip." },
    { id: 'delicacies', judge: true, called: 'the banquet table', kind: 'botch', types: ['stomach', 'nerve'], base: 15, pass: 0.45, loopCost: 6,
      teaser: 'Who will eat anything?', plate: 'eating table', label: 'Botch or Watch: the bowl of delicacies',
      // the bowl set down; the thousand-year eggs; the fried scorpions; the soup and the thing the cook won't name (left
      // any, or brought it back up: a new bowl); the empty bowl. a eats, b watches
      stages: [{ id: 'the-bowl', share: 0.2, risk: 0 }, { id: 'the-eggs', share: 0.5, risk: 0.5 }, { id: 'the-scorpions', share: 0.5, risk: 0.7 },
        { id: 'the-soup', share: 0.6, risk: 1 }, { id: 'bowl-empty', share: 0.2, risk: 0 }],
      desc: "At a long banquet table by the wall, a cook sets down a bowl of the hills' most unusual delicacies: thousand-year eggs, fried scorpions on sticks, a soup with things floating in it, and one item the cook won't name. The partner who didn't do the last Botch or Watch eats every bite in the bowl. Leaving anything, or bringing anything back up, means a new bowl. The other partner can only watch. An empty bowl, shown to the cook, earns the next tip." },
    { id: 'mat', kind: 'mat', plate: 'wall at sunrise', label: 'The Chill Zone' },
  ],
};

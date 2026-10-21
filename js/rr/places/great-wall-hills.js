// Great Wall Hills (LEGS.txt 11-GREAT-WALL-HILLS), 1:1 with the real show's "New Beijinging": a cab to the Don Box; a
// tandem skydive into the great stadium (the wind carried three teams off course); one partner skewers exotic animals
// (worms, scorpions, a seahorse) and the other eats them once they're deep-fried; Botch or Watch, the partner who didn't
// do the last one pulls the other by rickshaw to the wall (one broke down; one driver hit every bump on purpose); along
// the wall to the Chill Zone (three teams went the wrong way).
export default {
  id: 'great-wall-hills', name: 'Great Wall Hills', recap: 'jumping out of a plane into a stadium, eating things on sticks and pulling each other up a mountain in a rickshaw',
  region: 'far-east', map: { x: 79, y: 33 },
  arrive: 'airport', local: ['taxi', 'foot'],
  stretches: [
    { id: 'gwh-cab', kind: 'travel', mode: 'taxi', base: 35, cost: 25, plate: 'city road, cabs', label: 'Cab to the airfield' },
    { id: 'skydive', called: 'the airfield', kind: 'allin', types: ['heights', 'nerve'], base: 25, pass: 0.7, loopCost: 15, opens: 480, closes: 1140,
      plate: 'stadium field', label: 'All-In: drop in',
      // at the plane's open door (frozen there); the jump; the canopy open, steering for the stadium (the wind: off course,
      // down outside and running in); the landing on the field (a tumble); the tip at the centre of the field
      stages: [{ id: 'the-door', share: 0.4, risk: 0.4 }, { id: 'the-jump', share: 0.4, risk: 0 }, { id: 'the-drift', share: 1, risk: 1 },
        { id: 'the-landing', share: 0.5, risk: 0.3 }, { id: 'centre-tip', share: 0.3, risk: 0 }],
      desc: "At the airfield, each team is strapped to two instructors and taken up in a small prop plane, and both partners must make a tandem skydive into the great stadium below. The tip is waiting on the stadium field. The wind is the problem: a team that drifts off course lands in a park or a car park outside the stadium and has to run the rest of the way in, losing valuable time. The team that lands inside and reaches the centre of the field first takes the tip." },
    { id: 'skewers', called: 'the food stall', kind: 'allin', types: ['stomach', 'hands'], base: 18, pass: 0.55, loopCost: 8,
      plate: 'street food stall', label: 'All-In: on a stick',
      // the tray of creatures (one is still moving); threading them on skewers (one escapes); the fryer (burnt); eating the
      // set (it comes back up: a fresh set); the empty sticks
      stages: [{ id: 'the-tray', share: 0.4, risk: 0.2 }, { id: 'thread-em', share: 0.8, risk: 0.4 }, { id: 'the-fryer', share: 0.5, risk: 0.3 },
        { id: 'eat-em', share: 1.2, risk: 1 }, { id: 'empty-sticks', share: 0.3, risk: 0 }],
      desc: "At a street food stall, a tray holds the local delicacies: worms, scorpions, beetles and other creatures. One partner must thread a full set of them onto skewers and deep-fry them, and the other must eat every last one. Anything that comes back up, or any skewer left unfinished, means frying a fresh set. When the stallholder sees an empty set of sticks, the team gets the next tip." },
    { id: 'rickshaw', called: 'the rickshaw', kind: 'botch', types: ['strength'], base: 30, pass: 0.75, loopCost: 15,
      teaser: 'Who has the legs for it?', plate: 'mountain road', label: 'Botch or Watch: pull',
      // the rickshaw waiting; the climb (stalled on the slope); the broken road (a wheel off); the foot of the wall. a
      // pulls, b rides and may not get out to push
      stages: [{ id: 'pick-up', share: 0.3, risk: 0 }, { id: 'the-climb', share: 1.3, risk: 1 }, { id: 'the-bump', share: 0.8, risk: 0.8 },
        { id: 'the-wall', share: 0.3, risk: 0 }],
      desc: "The partner who didn't do the last Botch or Watch must pull the other in a rickshaw along the mountain road all the way to the foot of the wall. The road is steep and broken, so a rickshaw that hits a bad bump can throw a wheel and has to be fixed before the team can carry on, and the passenger is not allowed to get out and push. The team that reaches the wall with both partners and the rickshaw in one piece gets the next tip." },
    { id: 'wall-walk', kind: 'travel', mode: 'foot', base: 25, cost: 0, plate: 'the wall, watchtowers', label: 'Along the wall',
      // the real leg: three teams took the wrong direction along the wall
      mishaps: [['wrong-way', 25]], mishapRate: 0.2 },
    { id: 'mat', kind: 'mat', plate: 'terrace mat', label: 'The Chill Zone' },
  ],
};

// Skyline Finale (LEGS.txt 27-SKYLINE-FINALE), 1:1 with the real show's finale (the wiki's "A Million Ways to Lose a
// Million Dollars"): teams drive a taxi themselves from the airport to the skyscraper (a traffic jam, a crash, a flat
// tyre on the way); 86 flights of stairs to the observation deck for a briefcase and the tip; the midpoint Chill Zone in
// the park, where the last team is out; the boathouse (one team asked a candy-floss seller and went to the wrong one),
// a boat to the middle of the pond and the buoys holding the briefcase's combination; the run to the stage, where every
// eliminated team waits in the bleachers.
export default {
  id: 'skyline-finale', name: 'Skyline City', recap: 'the last race through the skyline city', region: 'north', map: { x: 26, y: 34 },
  arrive: 'airport', local: ['drive', 'foot', 'taxi'], finale: true,
  stretches: [
    { id: 'cab', kind: 'travel', mode: 'drive', base: 35, cost: 0, plate: 'airport curb, taxis', label: 'Drive yourselves into the city',
      mishaps: [['traffic-jam', 20], ['flat-tyre', 25]], mishapRate: 0.18 },
    { id: 'tower-stairs', called: 'the skyscraper', kind: 'allin', types: ['strength'], base: 30, pass: 0.85, loopCost: 5, opens: 540, closes: 1260, plate: 'fire escape stairs + tower window', label: 'The deck',
      // the lobby; the first flights (legs going: a rest on the stairs); the last flights (sat down: the team waits); the
      // deck and the briefcase with their name on it
      stages: [{ id: 'the-lobby', share: 0.2, risk: 0 }, { id: 'first-flights', share: 1, risk: 0.5 }, { id: 'last-flights', share: 1, risk: 1 },
        { id: 'the-briefcase', share: 0.3, risk: 0 }],
      desc: 'Teams climb eighty-six flights of the skyscraper on foot to the observation deck, where a briefcase with their name on it waits beside the tip. Both partners must reach the top, and a partner who stops to rest keeps the whole team on the stairs. The tip on the briefcase sends them down again and into the park.' },
    { id: 'park', kind: 'travel', mode: 'foot', base: 20, cost: 0, plate: 'park path', label: 'Into the park' },
    { id: 'midmat', kind: 'midmat', plate: 'park path, bronze mat', label: 'The midpoint Chill Zone' },
    { id: 'boathouse', kind: 'travel', mode: 'foot', base: 10, cost: 0, plate: 'park lake, boathouse', label: 'Find the boathouse',
      mishaps: [['wrong-boathouse', 15]], mishapRate: 0.2 },
    { id: 'buoys', called: 'the lake', kind: 'allin', types: ['search', 'water'], base: 25, pass: 0.4, loopCost: 8, plate: 'park lake, buoys', label: 'The buoys',
      // out from the boathouse dock; among the buoys (the wrong numbers); reading one up close; trying the lock (wrong
      // combination: row out again); the briefcase open
      stages: [{ id: 'row-out', share: 0.3, risk: 0.2 }, { id: 'buoy-hunt', share: 1, risk: 0.6 }, { id: 'read-number', share: 0.4, risk: 0.3 },
        { id: 'the-lock', share: 0.4, risk: 1 }, { id: 'case-open', share: 0.2, risk: 0 }],
      desc: 'Teams row to the middle of the park lake, where dozens of buoys bob with numbers on them, and search for the three that open the combination lock on their briefcase. A wrong combination means rowing out again to look for the buoys they missed. The open briefcase holds the way to the final Chill Zone.' },
    { id: 'footrace', called: 'the footrace', kind: 'route', types: ['strength'], base: 10, pass: 0.95, loopCost: 2, plate: 'park, the stage', label: 'The race to the stage',
      desc: 'With the briefcase open, both partners run the last stretch through the park to the stage, where every eliminated team is waiting in the bleachers. Nothing stops them but their own legs, and a partner who falls behind holds the team back, since both must step on. The first team onto the stage wins the race.' },
    { id: 'mat', kind: 'mat', plate: 'the stage', label: 'The finish' },
  ],
};

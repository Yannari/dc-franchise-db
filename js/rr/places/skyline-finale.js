// Skyline Finale (LEGS.txt 27-SKYLINE-FINALE; the real show's finale: drive a taxi to the
// skyscraper, the stairs to the deck, the midpoint Chill Zone in the park, the buoys, the race
// to the stage). The memory task is the Amazing Race's.
export default {
  id: 'skyline-finale', name: 'Skyline City', region: 'north', map: { x: 26, y: 34 },
  arrive: 'airport', local: ['drive', 'foot', 'taxi'], finale: true,
  stretches: [
    { id: 'cab', kind: 'travel', mode: 'drive', base: 35, cost: 0, plate: 'airport curb, taxis', label: 'Drive yourselves into the city' },
    { id: 'tower-stairs', kind: 'allin', types: ['strength'], base: 30, pass: 0.85, loopCost: 5, opens: 540, closes: 1260, plate: 'fire escape stairs + tower window', label: 'The deck',
      desc: 'Teams climb eighty-six flights of the skyscraper on foot to the observation deck, where a briefcase with their name on it waits beside the tip. Both partners must reach the top, and a partner who stops to rest keeps the whole team on the stairs. The tip on the briefcase sends them down again and into the park.' },
    { id: 'park', kind: 'travel', mode: 'foot', base: 20, cost: 0, plate: 'park path', label: 'Into the park' },
    { id: 'midmat', kind: 'midmat', plate: 'park path, bronze mat', label: 'The midpoint Chill Zone' },
    { id: 'memory', kind: 'allin', types: ['brains'], base: 20, pass: 0.45, loopCost: 10, plate: 'park lawn, the season board', label: 'Every leg, in order',
      desc: 'A board holds a picture from every place the race has visited, shuffled, and both partners must hang them back in the order the race went. One wrong picture and the judge sends them to start the row again. The tip comes when every picture hangs in the right place, first leg to last.' },
    { id: 'buoys', kind: 'allin', types: ['search', 'water'], base: 25, pass: 0.4, loopCost: 8, plate: 'park lake, buoys', label: 'The buoys',
      desc: 'Teams row to the middle of the park lake, where dozens of buoys bob with numbers on them, and search for the three that open the combination lock on their briefcase. A wrong combination means rowing out again to look for the buoys they missed. The open briefcase holds the way to the final Chill Zone.' },
    { id: 'footrace', kind: 'route', types: ['strength'], base: 10, pass: 0.95, loopCost: 2, plate: 'park, the stage', label: 'The race to the stage',
      desc: 'With the briefcase open, both partners run the last stretch through the park to the stage, where every eliminated team is waiting in the bleachers. Nothing stops them but their own legs, and a partner who falls behind holds the team back, since both must step on. The first team onto the stage wins the race.' },
    { id: 'mat', kind: 'mat', plate: 'the stage', label: 'The finish' },
  ],
};

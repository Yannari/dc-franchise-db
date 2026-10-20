// Twin Tower Bridge (LEGS.txt 38-TWIN-TOWER-BRIDGE), the World Tour's foggy-capital leg as the frames show it: a red
// double-decker bus from the bridge to the old fortress; both partners search the fortress, the cobbled lanes and the
// dungeon by lantern for the notes a masked kidnapper has left, until the clues tell them which royal guard is holding
// their tip (the guard will not move, smile or speak) (All-In); then the partner who didn't do the last Botch or Watch
// picks the one real crown jewel from the treasure table (Botch or Watch); the Chill Zone is on a foggy street.
export default {
  id: 'twin-tower-bridge', name: 'Twin Tower Bridge', recap: 'chasing a masked kidnapper through a fortress and picking the real crown jewel',
  region: 'old-coast', map: { x: 45, y: 25 },
  arrive: 'airport', local: ['bus', 'foot'],
  stretches: [
    { id: 'double-decker', kind: 'travel', mode: 'bus', base: 30, cost: 15, plate: 'double-decker bus, night street', label: 'Double-decker bus to the fortress',
      mishaps: [['stuck-in-traffic', 25]], mishapRate: 0.12 },
    { id: 'kidnapper', called: 'the fortress', kind: 'allin', types: ['search', 'brains'], base: 35, pass: 0.5, loopCost: 12, opens: 540, closes: 1320,
      plate: 'fortress + cobbled lane + dungeon', label: 'All-In: the masked kidnapper',
      desc: "Inside the old stone fortress, a masked kidnapper has left a trail of notes, each one a riddle pointing to the next hiding place: a cannon, a cobbled lane, a cell in the dungeon. Both partners follow the notes by lantern until the last one tells them which of the royal guards in tall fur hats is holding their tip. The guards will not move, speak or smile. Pick the wrong guard, or misread a note, and it's back to the last clue. The right guard, named and stood in front of, hands over the tip without a word." },
    { id: 'crown-jewel', called: 'the treasure table', kind: 'botch', types: ['brains', 'search'], base: 15, pass: 0.4, loopCost: 8,
      teaser: 'Who has an eye for sparkle?', plate: 'treasure table, chest', label: 'Botch or Watch: the crown jewel',
      desc: "On a velvet-covered table in the jewel vault sit twenty glittering crowns, rings and sceptres, and only one is a real crown jewel; the rest are glass and paint. The partner who didn't do the last Botch or Watch studies them, picks one, and hands it to the keeper of the jewels, who holds it up to the light. A fake means putting it back and choosing again. The other partner can only watch from the rope. The real crown jewel earns the next tip." },
    { id: 'fog-walk', kind: 'travel', mode: 'foot', base: 15, cost: 0, plate: 'cobbled street, fog', label: 'Walk into the fog' },
    { id: 'mat', kind: 'mat', plate: 'foggy street Chill Zone', label: 'The Chill Zone' },
  ],
};

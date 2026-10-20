// Marble Temple Hill (LEGS.txt 39-MARBLE-TEMPLE-HILL), the World Tour's ancient-games leg as the frames show it: both
// partners run the hurdles in the old stadium (All-In); the partner who didn't do the last Botch or Watch clears the high
// jump bar (Botch or Watch); then, among the temple columns, a choice of the ancient games, drive a horse-drawn chariot
// round the track, or wrestle the champion in the sand (Either/Or); the Chill Zone is at the finish line by the ruins.
export default {
  id: 'marble-temple-hill', name: 'Marble Temple Hill', recap: 'running hurdles, clearing a high jump and racing a chariot at the old games',
  region: 'old-coast', map: { x: 56, y: 36 },
  // a place being built: playable when booked, never drawn or offered until its lines, plates and music are in
  draft: true,
  arrive: 'airport', local: ['taxi', 'foot'],
  stretches: [
    { id: 'stadium-taxi', kind: 'travel', mode: 'taxi', base: 30, cost: 20, plate: 'marble hill road', label: 'Taxi to the old stadium',
      mishaps: [['narrow-street', 20]], mishapRate: 0.08 },
    { id: 'hurdles', called: 'the stadium', kind: 'allin', types: ['strength', 'nerve'], base: 20, pass: 0.55, loopCost: 8, opens: 420, closes: 1200,
      plate: 'hurdles track', label: 'All-In: the hurdles',
      desc: "In the old marble stadium, ten hurdles stand across a track that runners have used for thousands of years. Both partners run it together, side by side, and both have to clear every hurdle without knocking one down. A knocked hurdle, a fall, or a partner left behind means walking back to the start and running it again. Both partners over the finish line with every hurdle still standing earns the next tip." },
    { id: 'high-jump', called: 'the high jump', kind: 'botch', types: ['strength', 'nerve'], base: 15, pass: 0.4, loopCost: 6,
      teaser: 'Who can jump?', plate: 'high jump bar', label: 'Botch or Watch: the high jump',
      desc: "Beside the track, a bar is set higher than most people's heads above a big soft landing mat. The partner who didn't do the last Botch or Watch runs up, jumps, and has to clear the bar without touching it, any way they like: backwards, forwards or flailing. A knocked bar or a run-up that stops at the bar means the bar goes back up and they try again. The other partner can only watch. A clean jump earns the next tip." },
    { id: 'ancient-games', called: 'the temple columns', kind: 'either', opens: 420, closes: 1260, plate: 'temple columns', label: 'Chariot or Wrestle',
      desc: "Among the temple columns, a Don Box offers the ancient games. Chariot means one partner drives a two-horse chariot round the sandy track while the other holds on in the back, and they have to finish a full lap without tipping over or losing a wheel. Wrestle means one partner steps into a sand circle with the reigning champion and has to push them out, or pin them, three falls out of five. A tipped chariot or a lost bout means another try, and teams may switch. A full lap or three falls wins the laurel wreath and the next tip.",
      sides: [
        { id: 'chariot', label: 'Chariot', types: ['nerve', 'hands'], base: 20, pass: 0.5, loopCost: 8 },
        { id: 'wrestle', label: 'Wrestle', types: ['strength', 'nerve'], base: 15, pass: 0.4, loopCost: 6 },
      ] },
    { id: 'mat', kind: 'mat', plate: 'finish line by the ruins', label: 'The Chill Zone' },
  ],
};

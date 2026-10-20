// Neon Desert (LEGS.txt 20-NEON-DESERT), 1:1 with the real show's "Dude Buggies": a taxi out of the neon strip to the
// desert; an Either/Or, one partner steers a remote-control dune buggy round a course while the other, riding on it,
// grabs three flags inside a minute (Buggy), or one partner is locked in a cage with a lion and the other pulls the
// lever to make them vanish before it wakes, on the stage of a magic theatre (Magic); a run to the Chill Zone outside
// the theatre.
export default {
  id: 'neon-desert', name: 'Neon Desert', recap: 'racing toy dune buggies and vanishing out of a cage with a lion',
  region: 'north', map: { x: 14, y: 37 },
  arrive: 'airport', local: ['taxi', 'foot'],
  stretches: [
    { id: 'strip-taxi', kind: 'travel', mode: 'taxi', base: 30, cost: 25, plate: 'neon strip at dusk', label: 'Taxi off the strip',
      mishaps: [['wedding-chapel-traffic', 20]], mishapRate: 0.08 },
    { id: 'buggy-magic', called: 'the desert course', kind: 'either', opens: 480, closes: 1380, plate: 'desert course + magic theatre', label: 'Buggy or Magic',
      desc: "A Don Box at the edge of the desert offers two ways to the next tip. Buggy means one partner works the remote control of a dune buggy big enough to ride, steering it round a course of sand dunes while the other clings on and grabs three flags from their poles, all inside one minute. Magic means walking into the theatre, where a magician locks one partner in a cage with a sleeping lion and the other has to pull the right lever to make them vanish before it wakes. A missed flag or a minute gone means another run, a wrong lever means the lion wakes and the act starts again, and teams may switch. Three flags in a minute, or a clean vanish, earns the next tip.",
      sides: [
        { id: 'buggy', label: 'Buggy', types: ['hands', 'brains'], base: 20, pass: 0.45, loopCost: 6 },
        { id: 'magic', label: 'Magic', types: ['nerve', 'perform'], base: 25, pass: 0.5, loopCost: 10 },
      ] },
    { id: 'theatre-run', kind: 'travel', mode: 'foot', base: 10, cost: 0, plate: 'theatre forecourt', label: 'Run to the theatre doors' },
    { id: 'mat', kind: 'mat', plate: 'magic theatre wide', label: 'The Chill Zone' },
  ],
};

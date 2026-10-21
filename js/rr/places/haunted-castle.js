// Haunted Castle (LEGS.txt 08-HAUNTED-CASTLE), 1:1 with the real show's "A Tisket, a Casket, I'm Gonna Blow a
// Gasket": find the team's coffin in the castle, and whoever holds the tip pushes their partner in it to the graveyard,
// where a grave digger has the next tip; on horseback to the gym, where whoever didn't do the last Botch or Watch does
// a split on the beam and a somersault onto the vault until the coach approves; a run to the Chill Zone at night.
export default {
  id: 'haunted-castle', name: 'Haunted Castle', recap: 'pushing each other through a graveyard in coffins and doing the splits for a very hard-to-please coach',
  region: 'old-coast', map: { x: 54, y: 30 },
  arrive: 'airport', local: ['taxi', 'horse', 'foot'],
  stretches: [
    { id: 'castle-road', kind: 'travel', mode: 'taxi', base: 40, cost: 25, plate: 'castle road', label: 'Taxi to the castle',
      mishaps: [['fog-on-the-pass', 20]], mishapRate: 0.1 },
    { id: 'coffin', called: 'the coffin hall', kind: 'allin', types: ['strength', 'search'], base: 25, pass: 0.55, loopCost: 10, opens: 480, closes: 1260,
      plate: 'coffin hall + graveyard', label: 'All-In: the coffin',
      // the hall of coffins, theirs to find (the wrong one: someone's in it); the partner lies down in it; the push down the
      // hill (it tips, the lid comes off: back to the gate); the graveyard gate (the wrong path); the grave digger
      stages: [{ id: 'find-coffin', share: 1, risk: 0.5 }, { id: 'climb-in', share: 0.3, risk: 0.2 }, { id: 'the-push', share: 1.3, risk: 1 },
        { id: 'graveyard-gate', share: 0.4, risk: 0.3 }, { id: 'grave-digger', share: 0.3, risk: 0 }],
      desc: "Deep in the castle, a hall full of coffins waits, and each team has to find the one with their names on it. Whoever is holding the tip then pushes their partner, lying inside the coffin, out of the castle and down the hill to the graveyard. Tip the coffin over, lose the lid or take the wrong path, and it's back to the castle gate to start the push again. At the graveyard, a grave digger hands over the next tip once the coffin reaches its grave." },
    { id: 'ride', kind: 'travel', mode: 'horse', base: 30, cost: 0, plate: 'graveyard', label: 'On horseback to the gym',
      mishaps: [['horse-wanders-off', 20]], mishapRate: 0.12 },
    { id: 'gym', judge: true, called: 'the gym', kind: 'botch', types: ['perform', 'nerve'], base: 15, pass: 0.5, loopCost: 8,
      teaser: "Who's flexible?", plate: 'gymnastics hall', label: 'Botch or Watch: the routine',
      // the warm-up by the bench; the split on the beam (a wobble, a fall); the run and the somersault onto the vault (a
      // crash); the coach's nod. a performs, b watches from the bench
      stages: [{ id: 'warm-up', share: 0.4, risk: 0 }, { id: 'the-split', share: 1, risk: 1 }, { id: 'the-vault', share: 1, risk: 0.8 },
        { id: 'coach-nods', share: 0.3, risk: 0 }],
      desc: "In an old gymnastics hall, a stern local coach waits by a balance beam and a vaulting horse. The partner who didn't do the last Botch or Watch must hold a full split on the beam, then run and somersault onto the vault, while the other watches from the bench and may only cheer. A wobble, a fall or a half-hearted split, and the coach sends them back to the start of the routine. When the coach finally approves, the team runs for the Chill Zone." },
    { id: 'night-run', kind: 'travel', mode: 'foot', base: 15, cost: 0, plate: 'castle path at night', label: 'Run to the Chill Zone' },
    { id: 'mat', kind: 'mat', plate: 'night Chill Zone near the castle', label: 'The Chill Zone' },
  ],
};

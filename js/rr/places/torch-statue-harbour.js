// Torch Statue Harbour (LEGS.txt 32-TORCH-STATUE-HARBOUR), from World Tour's city leg (the wiki's "Broadway, Baby!"),
// adapted for pairs: a boat drops teams at the statue in the harbour; climb up inside the statue to the crown, where baby
// carriages hang on ropes, and ride one down; Botch or Watch, push your partner in the carriage through the sewer tunnels
// (something down there roars; it's an alligator); at the park pond, one partner fetches a giant apple out of the water
// using only their mouth, it goes in the carriage, and the team pushes it to the fountain (a snapping turtle bit
// somebody's shorts; one team took a carriage with a real baby in it and had to go back).
export default {
  id: 'torch-statue-harbour', name: 'Torch Statue Harbour', recap: 'climbing a giant statue for a baby carriage and pushing it through the sewers',
  region: 'north', map: { x: 29, y: 31 },
  arrive: 'airport', local: ['taxi', 'boat', 'foot'],
  stretches: [
    { id: 'harbour-boat', kind: 'travel', mode: 'boat', base: 20, cost: 15, plate: 'harbour dock', label: 'Boat to the statue' },
    { id: 'statue-climb', called: 'the statue', kind: 'allin', types: ['heights', 'strength'], base: 30, pass: 0.65, loopCost: 15, opens: 480, closes: 1140,
      plate: 'statue crown, carriage ropes', label: 'All-In: up to the crown',
      // at the statue's foot; the climb to the crown (back down a flight); hauling up a carriage (tangled); the ride down
      // the rope line (let go: back up to the crown); the landing by the boats
      stages: [{ id: 'statue-foot', share: 0.2, risk: 0 }, { id: 'the-climb', share: 1, risk: 0.5 }, { id: 'haul-carriage', share: 0.4, risk: 0.4 },
        { id: 'rope-ride', share: 0.5, risk: 1 }, { id: 'the-landing', share: 0.2, risk: 0 }],
      desc: "Inside the giant torch statue, a narrow spiral staircase climbs all the way to the crown, and out of the crown's windows hang baby carriages on ropes. Both partners must climb to the top, haul up a carriage, and ride it down the rope line to the boats at the statue's foot. A carriage that tangles, or a partner who lets go of the rope, means climbing back up to the crown for another try. The team that lands with its carriage takes the next tip." },
    { id: 'sewer', called: 'the sewers', kind: 'botch', types: ['strength', 'nerve'], base: 25, pass: 0.6, loopCost: 12,
      teaser: 'Who can push?', plate: 'sewer tunnel, alligator', label: 'Botch or Watch: down the drain',
      // into the drain at the harbour (won't go in); the dark tunnels (a wrong turn: a grate, push all the way back); the
      // thing in the water; the ladder up into the park. a pushes, b rides in the carriage
      stages: [{ id: 'into-drain', share: 0.3, risk: 0.3 }, { id: 'the-tunnels', share: 1, risk: 1 }, { id: 'the-gator', share: 0.5, risk: 0.5 },
        { id: 'the-ladder', share: 0.2, risk: 0 }],
      desc: "The partner who didn't do the last Botch or Watch must push the other, sitting in the baby carriage, through the dark sewer tunnels under the city to a ladder up into the park. The tunnels branch and smell, the water is ankle deep, and somewhere down there something big is moving. A wrong turn ends at a grate and means pushing all the way back, and the passenger must stay in the carriage the whole way. Climbing up into daylight at the park earns the next tip." },
    { id: 'big-apple', called: 'the park pond', kind: 'allin', types: ['water', 'patience'], base: 20, pass: 0.5, loopCost: 10,
      plate: 'park pond, giant apples', label: 'All-In: bob for it',
      // into the pond; the apple by mouth only (used hands: back in the pond); loading it into the carriage (dropped);
      // pushing it to the fountain (it rolls out); the fountain
      stages: [{ id: 'wade-in', share: 0.3, risk: 0.2 }, { id: 'mouth-only', share: 1, risk: 1 }, { id: 'load-up', share: 0.3, risk: 0.3 },
        { id: 'push-it', share: 0.6, risk: 0.5 }, { id: 'the-fountain', share: 0.2, risk: 0 }],
      desc: "Giant apples float in the park pond, each one bigger than a person's head. One partner wades in and must bring an apple to the bank using only their mouth, no hands at all, while the other loads it into the baby carriage. Then both push the carriage, apple and all, through the park to the fountain. An apple that's dropped on the way, or carried by hand, goes back in the pond to start again. The team that reaches the fountain with its apple in the carriage checks in." },
    { id: 'mat', kind: 'mat', plate: 'park fountain', label: 'The Chill Zone' },
  ],
};

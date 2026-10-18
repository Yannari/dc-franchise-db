// Family 11 of the catalogue: Don (docs/ridonculous-race-scenes.md §11). Dry, bored, a little
// mean, mostly interested in himself; never an announcer (research Part 2). {placing} is "first",
// "third"…; {team} the team's name.
export default {
  'don-place.any': [
    { id: 'dp.1', turns: [
      { beat: '{a} and {b} jump onto the mat together.' },
      { by: 'don', say: "{team}. You're the {placing} team to arrive." },
      { by: 'a', say: "We'll take it. We will absolutely take it." },
    ] },
    { id: 'dp.2', turns: [
      { beat: 'Don is checking his phone as they run up.' },
      { by: 'don', say: "Welcome to the Chill Zone. {team}, you're the {placing} team to arrive." },
      { by: 'b', say: "Is that good?" },
      { by: 'don', say: "It's {placing}. Do the math." },
    ] },
  ],
  'don-place.penalty-reveal': [
    { id: 'dp.p1', turns: [
      { by: 'don', say: "{team}, you're the {placing} team to arrive." },
      { by: 'a', say: "Yes!" },
      { by: 'don', say: "However." },
      { by: 'b', say: "No. No, no, no." },
      { by: 'don', say: "You picked up a penalty out there. Go stand over there until I say so." },
    ] },
    { id: 'dp.p2', turns: [
      { by: 'don', say: "You would be the {placing} team here." },
      { by: 'a', say: "Would be?" },
      { by: 'don', say: "There's a penalty. Wait it out. I'll be over here, not waiting with you." },
    ] },
  ],
};

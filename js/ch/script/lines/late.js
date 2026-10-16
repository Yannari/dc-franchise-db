// Late arrivals (js/ch/ep-twists.js lateArrival).
//   late-arrival  a, b = the newcomers (b optional: one division); x, y = the house watching them walk in
//   late-sizeup   a = somebody from the house sizing a newcomer up; b = the newcomer
export default {
  'late-arrival.any': [
    { id: 'la.1', turns: [
      { by: 'tj', say: "Good morning, everybody! Now, you've all gotten very comfortable in this house. Too comfortable. So I brought some friends." },
      { beat: 'The villa door opens. {a} walks in with a bag over one shoulder.' },
      { by: 'x', opt: 1, say: "No. No way." },
      { beat: 'Right behind: {b}.' },
      { by: 'tj', say: "Everybody, meet the newest players in the game. They're fresh, they're rested, and they want your spot." },
      { by: 'a', say: "Hi, everybody. Don't get up." },
      { by: 'y', opt: 1, conf: "We've been killing ourselves for weeks, and they walk in with clean clothes and a full night's sleep. That's not fair." },
      { by: 'a', conf: "Everybody in there already has their alliances and their deals. I don't need a seat at their table. I need to flip it." },
    ] },
    { id: 'la.2', turns: [
      { beat: 'TJ calls the house to the deck. Two people nobody expected are standing next to him.' },
      { by: 'tj', say: "The game just changed, people. Say hello to {a} and {b}. As of right now, they're in." },
      { by: 'x', opt: 1, say: "In? Like, in the game? Now?" },
      { by: 'tj', say: "In the game. Now. Have fun." },
      { by: 'b', opt: 1, say: "Nice to meet you all. I hope." },
      { by: 'a', conf: "I watched the first few weeks from home. I know who's running this house, and they have no idea I know." },
      { by: 'x', opt: 1, conf: "Two new people means two new votes nobody controls. Every alliance in that house just got nervous." },
    ] },
    { id: 'la.3', turns: [
      { beat: 'The house is at breakfast when the gate buzzes. Nobody is expecting anybody.' },
      { by: 'a', say: "Morning! Is there any coffee left?" },
      { by: 'x', opt: 1, say: "Who are you?" },
      { by: 'a', say: "The new problem. Nice to meet you." },
      { by: 'b', opt: 1, say: "And the other new problem." },
      { by: 'y', opt: 1, conf: "Fresh legs, no enemies, and no history with anybody. That's either the best or the worst thing that could happen to my game." },
      { by: 'a', conf: "They all look exhausted. Good. I'm not." },
    ] },
  ],
  'late-sizeup.any': [
    { id: 'ls.1', turns: [
      { beat: '{a} sits down across from {b} and takes a long look.' },
      { by: 'a', say: "So. Where do you think you fit in here?" },
      { by: 'b', say: "Wherever I want, I guess. I haven't picked a side yet." },
      { by: 'a', say: "Pick fast. In this house, if you don't pick a side, a side picks you. Usually for the vote." },
      { by: 'b', say: "Is that a threat or advice?" },
      { by: 'a', say: "Depends which side you pick." },
      { by: 'a', conf: "{b} is either a vote I can use or a name I can say. I'd like to know which by Thursday." },
    ] },
    { id: 'ls.2', turns: [
      { by: 'a', say: "Welcome to the house. Everybody's going to be very nice to you today." },
      { by: 'b', say: "That sounds good." },
      { by: 'a', say: "It's not. They're nice because they want your vote. Tomorrow they'll want something else." },
      { by: 'b', say: "And you? What do you want?" },
      { by: 'a', say: "Your vote. But I'm telling you that up front. That's the difference." },
      { by: 'b', conf: "Everybody in there is selling something. {a} at least says the price out loud." },
    ] },
    { id: 'ls.3', turns: [
      { beat: 'In the gym, {a} watches {b} lift for a full minute before saying anything.' },
      { by: 'a', say: "You look strong." },
      { by: 'b', say: "Thanks?" },
      { by: 'a', say: "It's not a compliment in here. Strong gets voted in." },
      { by: 'b', say: "Then I'll make sure I've got friends first." },
      { by: 'a', say: "Good luck. Everybody's friends are already taken." },
      { by: 'a', conf: "The new ones are the easiest votes in the house. Nobody owes them anything. That might be the only thing that saves the rest of us this week." },
    ] },
  ],
};

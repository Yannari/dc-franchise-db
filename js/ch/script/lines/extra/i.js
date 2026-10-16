// Two people who have done this show before together, meeting again on the airstrip (roles.js arrival: ending
// 'returning' when their old show is The Challenge itself; the reunion lines name the old show, and "we came from
// The Challenge together" cannot be said on The Challenge).
export default {
  'arrival.returning': [
    { id: 'ar.rt1', turns: [
      { beat: '{a} spots {b} on the airstrip and starts laughing before either of them says a word.' },
      { by: 'a', say: "No way. You came back too?" },
      { by: 'b', say: "Somebody has to finish what we started last time." },
      { by: 'a', say: "You said you'd never do this again." },
      { by: 'b', say: "I say a lot of things. You said it too." },
      { by: 'a', say: "I did. And here we are." },
      { by: 'a', conf: "{b} and I have history from our last season. Some of it good. I'm going to keep {b} close, and I'm going to keep my eyes open." },
    ] },
    { id: 'ar.rt2', turns: [
      { beat: '{a} and {b} hug the second they see each other. Everybody else on the airstrip notices.' },
      { by: 'b', say: "Please tell me we're doing this together again." },
      { by: 'a', say: "Obviously. Look around. Half these people have never done this before." },
      { by: 'b', say: "Then they don't know what's coming." },
      { by: 'a', say: "And we do. That's the whole advantage." },
      { by: 'b', conf: "{a} and I already know how this game works, and we know each other. The new people don't have either of those." },
    ] },
    { id: 'ar.rt3', turns: [
      { by: 'a', say: "{b}. I was hoping you'd be here." },
      { by: 'b', say: "Were you? Or were you hoping I wouldn't be?" },
      { by: 'a', say: "Little bit of both, honestly." },
      { by: 'b', say: "That's fair. Same." },
      { by: 'a', conf: "{b} knows how I play, and I know how {b} plays. That makes {b} the best ally in this house or the most dangerous person in it." },
    ] },
  ],
};

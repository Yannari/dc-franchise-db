// Ratings night (spec §8). Data only.
// rate.<reason>.top / .bottom: a is the voter ranking b first or last, and the
// line gives the SAME reason the ballot used (the term that decided it).
// result.<band>: a is revealed (b too, when two come up together).
export const RATINGS = {
  'ratings.open': [
    { id: 'ratings.open.01', turns: [
      { by: 'a', react: "'Alert!' Oh no. 'Players, it's time for the Ratings.' Already?" },
      { by: 'a', say: "Favorite to least favorite. This is like high school all over again." },
    ] },
    { id: 'ratings.open.02', turns: [
      { by: 'a', react: "'You must rank your fellow Players from favorite to least favorite.' I hate this part." },
    ], beat: '{a} sits on the edge of the couch.' },
    { id: 'ratings.open.03', turns: [
      { by: 'a', react: "'The top two will become Influencers.' Okay. Deep breath." },
      { by: 'a', say: "This is where it gets real. Everything I've said in here, it all comes down to this." },
    ] },
    { id: 'ratings.open.04', turns: [
      { by: 'a', react: "Ratings? Right now? I'm not even dressed." },
    ], beat: '{a} pulls on a hoodie as if it helps.' },
    { id: 'ratings.open.05', turns: [
      { by: 'a', react: "'Players, it's time to rate each other.' Of course it is." },
      { by: 'a', say: "Every nice message this week was for tonight. Let's see if it worked." },
    ] },
    { id: 'ratings.open.06', turns: [
      { by: 'a', react: "The Ratings. My stomach just dropped." },
    ], beat: '{a} turns the music off and sits down in front of the screen.' },
    { id: 'ratings.open.07', turns: [
      { by: 'a', react: "Okay, Circle. Let's rate some people." },
      { by: 'a', say: "This is the part where being nice stops being enough." },
    ] },
  ],
  'rate.affection.top': [
    { id: 'rate.affection.top.01', turns: [{ by: 'a', say: "Circle, put {b} in first position. I just like {b.obj}. {b.Sub}'s my person in here." }] },
    { id: 'rate.affection.top.02', turns: [{ by: 'a', say: "Number one is easy. {b}. Every time I talk to {b.obj} I feel better." }] },
    { id: 'rate.affection.top.03', turns: [{ by: 'a', say: "{b}, you're my first place. You've been good to me from day one." }] },
    { id: 'rate.affection.top.04', turns: [{ by: 'a', say: "First position, {b}. I didn't even have to think about it." }] },
    { id: 'rate.affection.top.05', when: { flirty: true }, turns: [{ by: 'a', say: "Is it the flirting? Maybe. {b} goes in first. Don't judge me." }] },
    { id: 'rate.affection.top.06', turns: [{ by: 'a', say: "{b}, first place. You make me laugh every single day." }] },
    { id: 'rate.affection.top.07', turns: [{ by: 'a', say: "Circle, please put {b} in first position. {b} feels like home in here." }] },
    { id: 'rate.affection.top.08', turns: [{ by: 'a', say: "I don't even have to think about it. {b} is my number one." }] },
    { id: 'rate.affection.top.09', turns: [{ by: 'a', say: "First place goes to {b}. {b} always checks on me." }] },
    { id: 'rate.affection.top.10', turns: [{ by: 'a', say: "{b} is first. Is it because {b} is sweet to me? Yes. Is that allowed? Also yes." }] },
  ],
  'rate.affection.bottom': [
    { id: 'rate.affection.bottom.01', turns: [{ by: 'a', say: "Last place is {b}. We just never clicked. Nothing personal." }] },
    { id: 'rate.affection.bottom.02', turns: [{ by: 'a', say: "{b}, I'm sorry. I don't know you, and what I do know, I don't love." }] },
    { id: 'rate.affection.bottom.03', turns: [{ by: 'a', say: "Circle, put {b} at the bottom. The vibe is just not there." }] },
    { id: 'rate.affection.bottom.04', turns: [{ by: 'a', say: "{b} is last. I tried. We just don't talk the same language." }] },
    { id: 'rate.affection.bottom.05', turns: [{ by: 'a', say: "Circle, put {b} in last position. There's nothing there for me." }] },
    { id: 'rate.affection.bottom.06', turns: [{ by: 'a', say: "Bottom of my list is {b}. {b} hasn't said ten words to me." }] },
  ],
  'rate.trust.top': [
    { id: 'rate.trust.top.01', turns: [{ by: 'a', say: "{b} is first. {b.Sub}'s the one person in here I actually trust." }] },
    { id: 'rate.trust.top.02', turns: [{ by: 'a', say: "First position, {b}. If {b.sub} told me the sky was green, I'd go outside and check." }] },
    { id: 'rate.trust.top.03', turns: [{ by: 'a', say: "Number one is {b}. {b.Sub} has never given me a reason to doubt {b.obj}." }] },
  ],
  'rate.trust.bottom': [
    { id: 'rate.trust.bottom.01', turns: [{ by: 'a', say: "Last place, {b}. I don't trust {b.obj}, and I'm not gonna pretend I do." }] },
    { id: 'rate.trust.bottom.02', turns: [{ by: 'a', say: "{b} goes at the bottom. Too many stories, and they don't match." }] },
    { id: 'rate.trust.bottom.03', turns: [{ by: 'a', say: "Circle, put {b} last. I just can't read {b.obj}." }] },
  ],
  'rate.obligation.top': [
    { id: 'rate.obligation.top.01', turns: [{ by: 'a', say: "{b} had my back. So {b} gets first. That's how I do it." }] },
    { id: 'rate.obligation.top.02', turns: [{ by: 'a', say: "I owe {b}. First position. We're even now." }] },
    { id: 'rate.obligation.top.03', turns: [{ by: 'a', say: "{b} looked out for me when nobody else did. First place." }] },
  ],
  'rate.obligation.bottom': [
    { id: 'rate.obligation.bottom.01', turns: [{ by: 'a', say: "I know I owe {b}. But last place is last place. I'm sorry." }] },
    { id: 'rate.obligation.bottom.02', turns: [{ by: 'a', say: "{b} at the bottom. That hurts, but it's a game." }] },
    { id: 'rate.obligation.bottom.03', turns: [{ by: 'a', say: "Circle, put {b} in last. I'll make it up to {b.obj}. Maybe." }] },
  ],
  'rate.pact.top': [
    { id: 'rate.pact.top.01', turns: [{ by: 'a', say: "{b} and I made a deal. I keep my word. First position, {b}." }] },
    { id: 'rate.pact.top.02', turns: [{ by: 'a', say: "A promise is a promise. {b} is my number one." }] },
    { id: 'rate.pact.top.03', turns: [{ by: 'a', say: "First place, {b}, like we said. I hope {b.sub} did the same." }] },
  ],
  'rate.pact.bottom': [
    { id: 'rate.pact.bottom.01', turns: [{ by: 'a', say: "I told {b} I'd put {b.obj} first. I'm putting {b.obj} last. That's the game." }] },
    { id: 'rate.pact.bottom.02', turns: [{ by: 'a', say: "{b} is last. Yes, we had a deal. No, I don't feel great about it." }] },
    { id: 'rate.pact.bottom.03', turns: [{ by: 'a', say: "Sorry, {b}. The deal's off. Last place." }] },
  ],
  'rate.protection.top': [
    { id: 'rate.protection.top.01', turns: [{ by: 'a', say: "If {b} is an Influencer, I'm safe. So {b} goes first. That's strategy." }] },
    { id: 'rate.protection.top.02', turns: [{ by: 'a', say: "First position, {b}. {b.Sub} likes me, and I need {b.obj} up top." }] },
    { id: 'rate.protection.top.03', turns: [{ by: 'a', say: "Put {b} first. I need at least one Influencer on my side tonight." }] },
  ],
  'rate.protection.bottom': [
    { id: 'rate.protection.bottom.01', turns: [{ by: 'a', say: "{b} wouldn't save me. So {b} doesn't get my help. Last place." }] },
    { id: 'rate.protection.bottom.02', turns: [{ by: 'a', say: "If {b} gets power, I'm gone. Bottom, {b}." }] },
    { id: 'rate.protection.bottom.03', turns: [{ by: 'a', say: "Last place for {b}. {b.Sub} would block me in a second." }] },
  ],
  'rate.threat.top': [
    { id: 'rate.threat.top.01', turns: [{ by: 'a', say: "Is {b} a threat? Yes. Am I putting {b.obj} first anyway? Also yes." }] },
    { id: 'rate.threat.top.02', turns: [{ by: 'a', say: "{b} is gonna be up there no matter what I do. Might as well be on {b.posAdj} good side. First." }] },
    { id: 'rate.threat.top.03', turns: [{ by: 'a', say: "Everybody's gonna gun for {b} eventually. It won't be me tonight. First place." }] },
    { id: 'rate.threat.top.04', turns: [{ by: 'a', say: "{b} is gonna go far, and I want to be close when {b} does. First." }] },
    { id: 'rate.threat.top.05', turns: [{ by: 'a', say: "{b} is the strongest player in here. I'd rather be on {b}'s side. First." }] },
    { id: 'rate.threat.top.06', turns: [{ by: 'a', say: "Everybody knows {b} is the one to beat. I'm putting {b} first and hoping {b} notices." }] },
  ],
  'rate.threat.bottom': [
    { id: 'rate.threat.bottom.01', turns: [{ by: 'a', say: "{b} is too popular. If I don't bring {b.obj} down now, I never will. Last place." }] },
    { id: 'rate.threat.bottom.02', turns: [{ by: 'a', say: "Nothing personal, {b}. You're a threat. Bottom." }] },
    { id: 'rate.threat.bottom.03', turns: [{ by: 'a', say: "Circle, put {b} in last position. Everybody loves {b.obj}, and that's exactly the problem." }] },
    { id: 'rate.threat.bottom.04', turns: [{ by: 'a', say: "{b} could win this whole thing. That's exactly why {b} is at the bottom." }] },
    { id: 'rate.threat.bottom.05', turns: [{ by: 'a', say: "I like {b}. I really do. But {b} is too strong. Last place." }] },
    { id: 'rate.threat.bottom.06', turns: [{ by: 'a', say: "Circle, put {b} in last position. Everybody else is gonna rank {b} high, so somebody has to rank {b} low." }] },
    { id: 'rate.threat.bottom.07', turns: [{ by: 'a', say: "{b} is playing the best game in here, and I'm not about to help. Last." }] },
    { id: 'rate.threat.bottom.08', turns: [{ by: 'a', say: "Last place, {b}. It's a compliment, trust me." }] },
  ],
  'rate.suspicion.top': [
    { id: 'rate.suspicion.top.01', turns: [{ by: 'a', say: "I have my doubts about {b}. But real or not, {b.sub}'s been good to me. First." }] },
    { id: 'rate.suspicion.top.02', turns: [{ by: 'a', say: "Maybe {b} is a catfish. Maybe I don't care. First place." }] },
    { id: 'rate.suspicion.top.03', turns: [{ by: 'a', say: "Something about {b} is off, but I still like {b.obj} best. First." }] },
  ],
  'rate.suspicion.bottom': [
    { id: 'rate.suspicion.bottom.01', turns: [{ by: 'a', say: "{b}, I just don't believe you. Last place." }] },
    { id: 'rate.suspicion.bottom.02', turns: [{ by: 'a', say: "My gut says {b} is a catfish. {b} goes at the bottom." }] },
    { id: 'rate.suspicion.bottom.03', turns: [{ by: 'a', say: "Too good to be true. Circle, put {b} in last position." }] },
    { id: 'rate.suspicion.bottom.04', turns: [{ by: 'a', say: "I don't think {b} is who {b.sub} says {b.sub} is. Last." }] },
    { id: 'rate.suspicion.bottom.05', turns: [{ by: 'a', say: "Last place, {b}. The pictures, the answers, none of it fits." }] },
    { id: 'rate.suspicion.bottom.06', turns: [{ by: 'a', say: "Circle, put {b} at the bottom. Whoever that is, it isn't {b}." }] },
  ],
  'rate.grudge.top': [
    { id: 'rate.grudge.top.01', turns: [{ by: 'a', say: "I'm still mad at {b}. But I'd be lying if I put {b.obj} anywhere else. First." }] },
    { id: 'rate.grudge.top.02', turns: [{ by: 'a', say: "{b} and I have had our issues. First place anyway. I'm the bigger person." }] },
    { id: 'rate.grudge.top.03', turns: [{ by: 'a', say: "We're not good right now, {b}. You're still my first. Don't make me regret it." }] },
  ],
  'rate.grudge.bottom': [
    { id: 'rate.grudge.bottom.01', turns: [{ by: 'a', say: "After what {b} did? Last place. Easiest decision I've made all week." }] },
    { id: 'rate.grudge.bottom.02', turns: [{ by: 'a', say: "{b}, you know what you did. Bottom." }] },
    { id: 'rate.grudge.bottom.03', turns: [{ by: 'a', say: "Circle, put {b} in last position. And I'd put {b.obj} lower if I could." }] },
  ],
  'rate.deserves.top': [
    { id: 'rate.deserves.top.01', turns: [{ by: 'a', say: "{b} has played this game better than anybody. First." }] },
    { id: 'rate.deserves.top.02', turns: [{ by: 'a', say: "Credit where it's due. {b} goes first." }] },
    { id: 'rate.deserves.top.03', turns: [{ by: 'a', say: "{b} earned it. First position." }] },
  ],
  'rate.deserves.bottom': [
    { id: 'rate.deserves.bottom.01', turns: [{ by: 'a', say: "{b} has been coasting. Last place." }] },
    { id: 'rate.deserves.bottom.02', turns: [{ by: 'a', say: "What has {b} actually done in here? Bottom." }] },
    { id: 'rate.deserves.bottom.03', turns: [{ by: 'a', say: "{b} goes last. I just haven't seen {b.obj} play." }] },
  ],
  'result.bottom': [
    { id: 'result.bottom.01', turns: [
      { by: 'a', react: "No. No, no, no. I'm at the bottom?" },
      { by: 'a', say: "I gotta be more active. I have to talk to more people." },
    ], beat: '{a} sinks back into the couch.' },
    { id: 'result.bottom.02', turns: [
      { by: 'a', react: "Last? Are you kidding me?" },
    ], beat: '{a} puts {a.posAdj} head in {a.posAdj} hands.' },
    { id: 'result.bottom.03', turns: [
      { by: 'a', react: "Okay. That hurts. That really hurts." },
      { by: 'a', say: "People are lying to my face. I just don't know which people yet." },
    ] },
    { id: 'result.bottom.04', turns: [
      { by: 'a', react: "Oh, that's me down there. Great. Love that." },
    ], beat: '{a} laughs, but not because anything is funny.' },
    { id: 'result.bottom.05', turns: [
      { by: 'a', react: "The bottom? What am I doing wrong?" },
    ] },
    { id: 'result.bottom.06', turns: [
      { by: 'a', react: "Wow. Okay. That's humbling." },
    ], beat: '{a} stares at the ceiling.' },
    { id: 'result.bottom.07', turns: [
      { by: 'a', react: "I'm not crying. I'm not crying." },
      { by: 'a', say: "Okay, I'm crying a little." },
    ] },
    { id: 'result.bottom.08', turns: [
      { by: 'a', react: "Down there? Me? After all those chats?" },
    ] },
    { id: 'result.bottom.09', turns: [
      { by: 'a', react: "Well. At least I know where I stand now." },
      { by: 'a', say: "Something has to change. Starting tomorrow." },
    ] },
  ],
  'result.middle': [
    { id: 'result.middle.01', turns: [
      { by: 'a', react: "The middle. That's perfect. Nobody comes for the middle." },
    ] },
    { id: 'result.middle.02', turns: [
      { by: 'a', react: "Okay. Not bad. I can work my way up from there." },
    ] },
    { id: 'result.middle.03', turns: [
      { by: 'a', react: "Middle of the pack. Safe and invisible. I'll take it." },
    ], beat: '{a} lets out a breath.' },
    { id: 'result.middle.04', turns: [
      { by: 'a', react: "I thought I'd be higher, honestly." },
      { by: 'a', say: "Somebody in here is smiling at me and ranking me low. I need to find out who." },
    ] },
  ],
  'result.top': [
    { id: 'result.top.01', turns: [
      { by: 'a', react: "Oh my God. So close. So close!" },
    ] },
    { id: 'result.top.02', turns: [
      { by: 'a', react: "Near the top. People actually like me in here." },
    ], beat: '{a} does a little dance in the kitchen.' },
    { id: 'result.top.03', turns: [
      { by: 'a', react: "Just missed it. That's fine. That's even better. No target." },
    ] },
    { id: 'result.top.04', turns: [
      { by: 'a', react: "Near the top and not an Influencer. Perfect. That's the sweet spot." },
    ] },
    { id: 'result.top.05', turns: [
      { by: 'a', react: "Yes! Okay! People like me!" },
    ], beat: '{a} throws a pillow in the air and catches it.' },
    { id: 'result.top.06', turns: [
      { by: 'a', react: "That high? Me?" },
      { by: 'a', say: "Somebody in here actually has my back. A few somebodies." },
    ] },
  ],
  'result.influencers': [
    { id: 'result.influencers.01', turns: [
      { by: 'a', react: "'As the most popular Players, you are now The Circle Influencers.' What? Me?" },
      { by: 'b', react: "I'm an Influencer? Oh my God. Now everyone's gonna come for me." },
    ] },
    { id: 'result.influencers.02', turns: [
      { by: 'a', react: "Top two! Top two!" },
      { by: 'b', react: "Okay. Okay. With great power comes great responsibility, I guess." },
    ], beat: 'In one apartment someone screams. In the other, someone sits down on the floor.' },
    { id: 'result.influencers.03', turns: [
      { by: 'a', react: "I'm an Influencer. I've hated influencers my whole life, and now I'm one." },
      { by: 'b', react: "'All other Players are at risk of being blocked.' Oh, this is heavy." },
    ] },
    { id: 'result.influencers.04', turns: [
      { by: 'a', react: "Me and {b}. Okay. I can work with {b}." },
      { by: 'b', react: "{a} and me. Oh, I hope we agree on this." },
    ] },
    { id: 'result.influencers.05', turns: [
      { by: 'a', react: "No way. No way! I'm an Influencer!" },
      { by: 'b', react: "Me too? Oh my God. Me too!" },
    ], beat: 'Two apartments scream at the same moment.' },
    { id: 'result.influencers.06', turns: [
      { by: 'a', react: "Okay. Power. I have power. Don't be weird about it." },
      { by: 'b', react: "Top two. Wow. Now I have to block somebody." },
    ] },
    { id: 'result.influencers.07', turns: [
      { by: 'a', react: "Influencer. Me. I'm calling my mom the second I get out of here." },
      { by: 'b', react: "Me and {a}. Okay. We can do this." },
    ] },
  ],
};

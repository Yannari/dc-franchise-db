// The morning Newsfeed: status updates, the people who read them, and likes.
// Data only. A status is a `post`; the reader's reaction is out loud.
export const FEED = {
  'status.steady': [
    { id: 'status.steady.01', turns: [
      { by: 'a', say: "Status update. Keep it positive. Keep it normal.", post: "Good morning Circle! New day, new vibes {e:sun} {t:GoodMorning}" },
    ] },
    { id: 'status.steady.02', turns: [
      { by: 'a', post: "Coffee first, Circle second {e:laugh} {t:CoffeeFirst}" },
    ], beat: '{a} takes a long sip of coffee.' },
    { id: 'status.steady.03', turns: [
      { by: 'a', say: "Something light. Nobody gets blocked for a breakfast post.", post: "Made pancakes and burned exactly one. Still counts {e:muscle}" },
    ] },
    { id: 'status.steady.04', turns: [
      { by: 'a', post: "Grateful to be here another day. Let's keep it real in here {e:heart} {t:KeepItReal}" },
    ] },
    { id: 'status.steady.05', turns: [
      { by: 'a', say: "They want a status. I'll give them a status.", post: "Just me in an apartment talking to a TV {e:laugh}" },
    ] },
    { id: 'status.steady.06', turns: [
      { by: 'a', post: "Workout done. Now I can eat whatever I want {e:muscle} {t:Balance}" },
    ], beat: '{a} eats a cookie while the post uploads.' },
  ],
  'status.low': [
    { id: 'status.low.01', turns: [
      { by: 'a', say: "I don't want to fake happy today.", post: "Not gonna lie, yesterday was a lot. Taking it one day at a time {e:pray}" },
    ] },
    { id: 'status.low.02', turns: [
      { by: 'a', post: "Woke up with a stomachache. Not sure if it's nerves or dinner {e:sad}" },
    ], beat: '{a} pulls the blanket up to {a.posAdj} chin.' },
    { id: 'status.low.03', when: { hurt: true }, turns: [
      { by: 'a', say: "They put me at the bottom. Fine. Watch me climb.", post: "First impressions don't matter, the real one does. Come talk to me {e:heart}" },
    ] },
    { id: 'status.low.04', turns: [
      { by: 'a', post: "Missing my family today. Sending love to everyone in here {e:heart} {t:Homesick}" },
    ], when: { mood: 'homesick' } },
    { id: 'status.low.05', turns: [
      { by: 'a', post: "Some days are harder than others. Today's one of those {e:cry}" },
    ] },
    { id: 'status.low.06', turns: [
      { by: 'a', say: "I'm so tired of being in my own head.", post: "Somebody message me, I'm talking to my plants again {e:sweat}" },
    ], when: { mood: 'lonely' } },
    { id: 'status.low.07', turns: [
      { by: 'a', post: "Rough night. But I'm still here {e:muscle}" },
    ] },
    { id: 'status.low.08', turns: [
      { by: 'a', say: "Honest post. People like honest.", post: "Not my best day, not gonna lie. Tomorrow's a new one {e:pray}" },
    ] },
    { id: 'status.low.09', turns: [
      { by: 'a', post: "Could really use a hug right now {e:hug}" },
    ], beat: '{a} hugs a pillow instead.' },
    { id: 'status.low.10', turns: [
      { by: 'a', post: "Trying to stay positive in here. Some days it's harder {e:sad}" },
    ] },
    { id: 'status.low.11', turns: [
      { by: 'a', post: "Note to self: drink water, stay kind, don't overthink {e:pray} {t:SelfCare}" },
    ] },
    { id: 'status.low.12', turns: [
      { by: 'a', post: "Anyone else feel like these walls are getting closer? Just me? {e:sweat}" },
    ] },
  ],
  'status.high': [
    { id: 'status.high.01', turns: [
      { by: 'a', say: "Feeling good. Let them see it.", post: "Woke up feeling like a million bucks. Let's go Circle!! {e:fire} {t:GoodVibesOnly}" },
    ] },
    { id: 'status.high.02', turns: [
      { by: 'a', post: "Still here, still smiling {e:smile} {t:StillStanding}" },
    ], beat: '{a} dances around the kitchen while the post uploads.' },
    { id: 'status.high.03', when: { influencer: true }, turns: [
      { by: 'a', say: "Don't gloat. Do not gloat.", post: "Humbled and grateful. Love you all {e:heart}" },
    ] },
    { id: 'status.high.04', turns: [
      { by: 'a', post: "Best day in here so far and it's not even noon {e:party}" },
    ] },
  ],
  'status.react': [
    { id: 'status.react.01', when: { friends: true }, turns: [
      { by: 'a', react: "Aw, look at {b}. I love that." },
    ] },
    { id: 'status.react.02', when: { rivals: true }, turns: [
      { by: 'a', react: "Oh, please. {b} is putting on a show." },
    ] },
    { id: 'status.react.03', turns: [
      { by: 'a', react: "Okay, that's cute. I'll give {b.obj} that." },
    ] },
    { id: 'status.react.04', turns: [
      { by: 'a', react: "Interesting. Very interesting. Circle, like {b}'s status." },
    ] },
    { id: 'status.react.05', turns: [
      { by: 'a', react: "Hm. What's {b} trying to say with that?" },
    ] },
    { id: 'status.react.06', when: { suspects: true }, turns: [
      { by: 'a', react: "That doesn't sound like a real person. That sounds like a greeting card." },
    ] },
    { id: 'status.react.07', turns: [
      { by: 'a', react: "Ha. Same, {b}. Same." },
    ] },
    { id: 'status.react.08', turns: [{ by: 'a', react: "{b} is always so positive. How?" }] },
    { id: 'status.react.09', turns: [{ by: 'a', react: "Circle, like {b}'s status. See? I'm nice." }] },
    { id: 'status.react.10', turns: [{ by: 'a', react: "Okay, {b}. We get it. You're having a great time." }] },
    { id: 'status.react.11', turns: [{ by: 'a', react: "That is the most {b} thing I've ever read." }] },
    { id: 'status.react.12', turns: [{ by: 'a', react: "Aw. I needed that today." }] },
    { id: 'status.react.13', turns: [{ by: 'a', react: "Circle, like it. No, wait. Unlike. No. Like it." }], beat: '{a} stares at the heart button for a while.' },
    { id: 'status.react.14', turns: [{ by: 'a', react: "Who posts this early? {b}, that's who." }] },
    { id: 'status.react.15', turns: [{ by: 'a', react: "Hm. Not sure how I feel about that one." }] },
    { id: 'status.react.16', turns: [{ by: 'a', react: "I love that for {b.obj}." }] },
    { id: 'status.react.17', turns: [{ by: 'a', react: "Ha! That got me." }], beat: '{a} laughs with a mouth full of cereal.' },
    { id: 'status.react.18', turns: [{ by: 'a', react: "Is that a dig at somebody? It feels like a dig." }] },
    { id: 'status.react.19', when: { friends: true }, turns: [{ by: 'a', react: "That's my {b}! Circle, like it." }] },
    { id: 'status.react.20', when: { rivals: true }, turns: [{ by: 'a', react: "Of course {b} posted that. Of course." }] },
    { id: 'status.react.21', turns: [{ by: 'a', react: "No one is that happy in the morning. No one." }] },
  ],
  'likes.most': [
    { id: 'likes.most.01', turns: [
      { by: 'a', react: "Wait. How many likes? Oh my God. People like me!" },
    ], beat: '{a} jumps up and down on the couch.' },
    { id: 'likes.most.02', turns: [
      { by: 'a', say: "I'm not gonna pretend that doesn't feel good. It feels really good." },
    ] },
    { id: 'likes.most.03', turns: [
      { by: 'a', react: "The most likes? Me? Okay, now I'm nervous. Everybody's gonna come for me." },
    ] },
    { id: 'likes.most.04', turns: [
      { by: 'a', react: "Circle, show me who liked it. I need names." },
    ], beat: '{a} leans in close to the screen.' },
    { id: 'likes.most.05', turns: [
      { by: 'a', react: "People liked it! People actually liked it!" },
    ] },
    { id: 'likes.most.06', turns: [
      { by: 'a', react: "The most likes. Okay. Don't let it go to your head." },
    ], beat: '{a} does a victory lap around the couch.' },
    { id: 'likes.most.07', turns: [
      { by: 'a', say: "The most likes means the most eyes on me. That's good and bad." },
    ] },
  ],
  'likes.none': [
    { id: 'likes.none.01', turns: [
      { by: 'a', react: "Zero? Nobody? Not one person?" },
    ], beat: '{a} stares at the number for a long time.' },
    { id: 'likes.none.02', turns: [
      { by: 'a', say: "Okay. That's a message. I need to talk to more people today." },
    ], beat: '{a} opens a new private chat right away.' },
    { id: 'likes.none.03', turns: [
      { by: 'a', react: "No likes. Cool. Cool, cool, cool." },
    ], beat: '{a} lies down on the floor.' },
  ],
};

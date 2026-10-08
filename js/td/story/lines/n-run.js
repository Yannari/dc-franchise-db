// ══════════════════════════════════════════════════════════════════════
// td/story/lines/n-run.js — the running gags (td/story/runners.js has the header)
// ══════════════════════════════════════════════════════════════════════
// run.<kind>.<1|2|3>: 1 sets it up, 2 calls it back (more than once), 3 pays it off. a owns the
// bit; b has to put up with it; c (may be missing) is there. Before the challenge. Ids: 'nrn.'.

export default {
  // ── hides snacks everywhere ──
  'run.food.1': [
    { id: 'nrn.f1', turns: [
      { beat: "{b} lifts up {a}'s sleeping bag to shake it out, and three crackers fall onto the floor." },
      { by: 'b', say: "Why are there crackers in your sleeping bag?" },
      { by: 'a', say: "Emergency crackers." },
      { by: 'b', say: "What's the emergency?" },
      { by: 'a', say: "Being hungry at night. It happens every night. It's a very regular emergency." },
      { by: 'a', conf: "I have food hidden in four places around this camp. Five, if you count my shoe, which I'd prefer you didn't." },
    ] },
  ],
  'run.food.2': [
    { id: 'nrn.f2', turns: [
      { by: 'c', opt: true, say: "Has anybody seen the last of the rice?" },
      { by: 'b', say: "Check {a}'s pockets." },
      { by: 'a', say: "That is so offensive." },
      { beat: "{a} turns out a pocket. A handful of rice falls out." },
      { by: 'a', say: "I don't know how that got there." },
      { by: 'b', conf: "{a} is like a squirrel. A very sweet squirrel who's going to get us all killed when the bears come." },
    ] },
    { id: 'nrn.f3', turns: [
      { by: 'b', say: "Why is there a banana in the tool box?" },
      { by: 'a', say: "Because nobody ever looks in the tool box." },
      { by: 'b', say: "I just looked in the tool box." },
      { by: 'a', say: "Well, now I need a new spot. Thanks a lot." },
      { by: 'a', conf: "Every time somebody finds one of my hiding places, a little part of me dies. And then I find a new hiding place." },
    ] },
  ],
  'run.food.3': [
    { id: 'nrn.f4', turns: [
      { beat: "Everybody's starving after a long day. {a} disappears behind the shelter and comes back with both arms full." },
      { by: 'a', say: "Okay. Nobody ask me where these came from." },
      { by: 'b', say: "Are those... the crackers? From the first week?" },
      { by: 'a', say: "Emergency crackers. This is the emergency." },
      { by: 'c', opt: true, say: "I take back everything I ever said about you." },
      { by: 'b', conf: "We've made fun of {a}'s snack stash for weeks, and tonight it fed the entire camp. I'm never laughing at a squirrel again." },
    ] },
  ],

  // ── gives everybody nicknames ──
  'run.nickname.1': [
    { id: 'nrn.n1', turns: [
      { by: 'a', say: "Morning, Captain Sunburn." },
      { by: 'b', say: "Who's Captain Sunburn?" },
      { by: 'a', say: "You. Look at your shoulders." },
      { by: 'b', say: "That's not a nickname, that's a medical condition." },
      { by: 'a', conf: "Everybody here gets a nickname. It's how I remember people. Also it's how I make sure they remember me." },
    ] },
  ],
  'run.nickname.2': [
    { id: 'nrn.n2', turns: [
      { by: 'a', say: "Hey, Sleepy. Hey, The Professor. Hey, Bandana." },
      { by: 'b', say: "Do you know anybody's actual name?" },
      { by: 'a', say: "I know all of them. I just like mine better." },
      { by: 'c', opt: true, say: "I've been Bandana for three days and I don't own a bandana." },
      { by: 'a', say: "You will." },
    ] },
    { id: 'nrn.n3', turns: [
      { by: 'b', say: "Okay, what's my nickname today?" },
      { by: 'a', say: "Today you're Thunderstorm." },
      { by: 'b', say: "Why Thunderstorm?" },
      { by: 'a', say: "Because of how you snore." },
      { by: 'b', conf: "{a} has called me nine different things this week. I've stopped answering to my own name. I think {a} has won." },
    ] },
  ],
  'run.nickname.3': [
    { id: 'nrn.n4', turns: [
      { beat: "{a} comes back from the water to find a piece of bark leaning against the shelter, with something written on it in charcoal." },
      { by: 'a', say: "'Nickname Machine'?" },
      { by: 'b', say: "We all voted. It was unanimous." },
      { by: 'a', say: "That's the best thing anybody's ever done for me." },
      { by: 'c', opt: true, say: "You're welcome, Nickname Machine." },
      { by: 'a', conf: "They gave me a nickname. The whole camp. I'm not crying, Captain Sunburn's crying." },
    ] },
  ],

  // ── can't keep a secret ──
  'run.secret.1': [
    { id: 'nrn.s1', turns: [
      { by: 'b', say: "Okay, I'm going to tell you something, and you can't tell anybody." },
      { by: 'a', say: "I would never." },
      { by: 'b', say: "I think there's a frog living in my shoe." },
      { by: 'a', say: "Oh my god." },
      { beat: "Two minutes later, {a} is telling everyone at the fire about the frog in {b}'s shoe." },
      { by: 'b', conf: "Nobody tell {a} anything. Not about frogs, not about votes, not about anything. I learned that the easy way, thank goodness." },
    ] },
  ],
  'run.secret.2': [
    { id: 'nrn.s2', turns: [
      { by: 'a', say: "I'm not supposed to say, but..." },
      { by: 'b', say: "Then don't say." },
      { by: 'a', say: "But it's so good!" },
      { by: 'b', say: "That's what you said about the frog." },
      { by: 'a', say: "The frog was good!" },
      { by: 'a', conf: "I can keep a secret. I just can't keep it for very long. Like, an hour. A good hour." },
    ] },
  ],
  'run.secret.3': [
    { id: 'nrn.s3', turns: [
      { by: 'b', say: "Wait. You knew about it this whole time, and you didn't tell anybody?" },
      { by: 'a', say: "Nobody." },
      { by: 'b', say: "You. You kept a secret." },
      { by: 'a', say: "I know! I've been dying! I've been biting my tongue so hard it hurts!" },
      { by: 'b', conf: "{a} kept a secret for two whole days. I don't know whether to be proud or terrified." },
    ] },
  ],

  // ── adopts an animal ──
  'run.pet.1': [
    { id: 'nrn.p1', turns: [
      { beat: "{a} walks into camp holding a crab in both hands like it's made of glass." },
      { by: 'a', say: "Everybody, this is Gerald." },
      { by: 'b', say: "That's a crab." },
      { by: 'a', say: "That's Gerald. Gerald is a crab. Both things are true." },
      { by: 'b', conf: "We don't have enough food, we don't have enough sleep, and now we have Gerald." },
    ] },
  ],
  'run.pet.2': [
    { id: 'nrn.p2', turns: [
      { by: 'a', say: "Has anybody seen Gerald?" },
      { by: 'b', say: "The crab? Last I saw, Gerald was walking very fast toward the ocean." },
      { by: 'a', say: "He wouldn't just leave." },
      { by: 'b', say: "He's a crab." },
      { by: 'a', conf: "Gerald always comes back. Gerald understands me. That's more than I can say for some people here." },
    ] },
    { id: 'nrn.p3', turns: [
      { by: 'c', opt: true, say: "Why is the crab sitting on my breakfast?" },
      { by: 'a', say: "Gerald likes you! That's a huge compliment." },
      { by: 'b', say: "That's not Gerald. That's a different crab." },
      { by: 'a', say: "...Then that's Gerald Two." },
    ] },
  ],
  'run.pet.3': [
    { id: 'nrn.p4', turns: [
      { beat: "On the beach, {a} sets Gerald down at the edge of the water." },
      { by: 'a', say: "You've been a good crab, Gerald. Go on. Be free." },
      { by: 'b', say: "Are you okay?" },
      { by: 'a', say: "I'm fine. I'm totally fine." },
      { by: 'b', conf: "We had a funeral for a crab that isn't dead. And I cried a little. Don't tell anybody." },
    ] },
  ],

  // ── a workout club nobody joined ──
  'run.fitness.1': [
    { id: 'nrn.w1', turns: [
      { beat: "Sunrise. {a} is doing push-ups in the middle of camp, counting very loudly." },
      { by: 'a', say: "Forty-one! Forty-two! Who's joining me?" },
      { by: 'b', say: "Nobody. It's six in the morning." },
      { by: 'a', say: "The best time! Forty-three!" },
      { by: 'a', conf: "I'm starting a workout club. It's going to get the whole team in shape, and we're never going to lose another challenge." },
    ] },
  ],
  'run.fitness.2': [
    { id: 'nrn.w2', turns: [
      { by: 'a', say: "Workout club in five minutes! Bring water!" },
      { by: 'b', say: "How many people came yesterday?" },
      { by: 'a', say: "...One. But it was a great one." },
      { by: 'b', say: "Was it you?" },
      { by: 'a', say: "It was me, and I was amazing." },
    ] },
  ],
  'run.fitness.3': [
    { id: 'nrn.w3', turns: [
      { beat: "Sunrise. {a} walks out of the shelter, and {b} is already there, stretching." },
      { by: 'a', say: "What are you doing?" },
      { by: 'b', say: "Don't make it a big deal." },
      { by: 'a', say: "Workout club! It's happening! Everybody, workout club is HAPPENING!" },
      { by: 'b', say: "I said don't make it a big deal!" },
      { by: 'b', conf: "{a} asked me every morning for weeks. I finally said yes, mostly so {a} would stop asking. Don't tell {a} I actually liked it." },
    ] },
  ],

  // ── narrates their own life ──
  'run.drama.1': [
    { id: 'nrn.d1', turns: [
      { by: 'a', say: "And so, our hero wakes, alone, in a strange and terrible land." },
      { by: 'b', say: "You're narrating again." },
      { by: 'a', say: "Our hero's tribe-mate is very rude." },
      { by: 'a', conf: "Everybody here thinks they're the main character. I'm just the only one saying it out loud." },
    ] },
  ],
  'run.drama.2': [
    { id: 'nrn.d2', turns: [
      { by: 'a', say: "Little did they know, the rice was undercooked." },
      { by: 'b', say: "We all know the rice is undercooked. You cooked it." },
      { by: 'a', say: "A shocking twist!" },
      { by: 'b', conf: "Living with {a} is like being stuck inside a nature documentary about one very dramatic animal." },
    ] },
  ],
  'run.drama.3': [
    { id: 'nrn.d3', turns: [
      { by: 'b', say: "And so, our hero finally made it this far, against all the odds." },
      { by: 'a', say: "Wait. Are you narrating me?" },
      { by: 'b', say: "Somebody had to. You've been doing it for everybody else for weeks." },
      { by: 'a', conf: "{b} narrated me. Me. I've never been the subject of a narration before. I'm so moved I could write a monologue about it." },
    ] },
  ],

  // ── can't stop talking about their job ──
  'run.job.1': [
    { id: 'nrn.j1', when: { job: true }, turns: [
      { by: 'b', say: "How do you know how to do that?" },
      { by: 'a', say: "Oh, back home I'm a {job}. You pick things up." },
      { by: 'b', say: "A {job} taught you to build a shelter?" },
      { by: 'a', say: "A {job} teaches you everything if you pay attention." },
      { by: 'b', conf: "I've learned more about being a {job} in three days than I ever wanted to know in my whole life." },
    ] },
  ],
  'run.job.2': [
    { id: 'nrn.j2', when: { job: true }, turns: [
      { by: 'a', say: "You know, this reminds me of something that happened at work once." },
      { by: 'b', say: "Everything reminds you of work." },
      { by: 'a', say: "Because being a {job} is basically this, but with better snacks." },
      { by: 'b', say: "Please don't tell the story about the photocopier again." },
    ] },
  ],
  'run.job.3': [
    { id: 'nrn.j3', when: { job: true }, turns: [
      { beat: "Something breaks at camp, and everybody, without a word, turns to look at {a}." },
      { by: 'a', say: "What?" },
      { by: 'b', say: "You're the {job}. Fix it." },
      { by: 'a', say: "I've been waiting my whole life for this moment." },
      { by: 'b', conf: "We teased {a} about being a {job} for weeks, and then the one time it mattered, it really did matter. I'll never hear the end of it." },
    ] },
  ],
};

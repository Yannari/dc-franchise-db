// ══════════════════════════════════════════════════════════════════════
// bb/story/lines/sstalk.js — a Secret Story house, talking (bb/story/sstalk.js)
// ══════════════════════════════════════════════════════════════════════
//
// Written from the real dailies (docs/research/secret-story-transcripts.md §2)
// and the user's rules for every line (2026-10-28: "fluid, more spoken writing,
// it's a dialogue"; the feedback index): whole exchanges where each line
// answers the one before, contractions, plain words, the subject always named,
// a confessional that says the feeling and its reason. No quips. No past the
// house may not have had yet ("weeks", "yesterday").
//
// Slots: {a} {b} {c} are people; {guess} is a secret as the guesser would say
// it (first person, so it is always quoted); {tell} is a habit, said after a
// name ("{c} {tell}.").

export default {
  // a tells b who they think c is
  'talk.ss.hunt.share': [
    { id: 'ss-hs.1', room: 'storage-room', turns: [
      { beat: '{a} pulls {b} into the pantry and pushes the door shut.' },
      { by: 'a', say: "Okay, I need to tell you something, and you can't laugh." },
      { by: 'b', say: 'Go on.' },
      { by: 'a', say: 'I think {c}\'s secret is "{guess}".' },
      { by: 'b', say: '{c}? Why {c}?' },
      { by: 'a', say: 'Little things. The way {c} changes the subject every time it comes up.' },
      { by: 'b', say: "Okay... I'm not saying you're wrong." },
      { by: 'b', dr: "And now I can't stop watching {c} either. Thanks, {a}." },
    ] },
    { id: 'ss-hs.2', room: 'bedroom', turns: [
      { beat: 'Lights out. {a} leans over to {b}\'s bed.' },
      { by: 'a', say: 'Are you awake?' },
      { by: 'b', say: 'I am now.' },
      { by: 'a', say: "I think I've worked out {c}'s secret." },
      { by: 'b', say: 'In the middle of the night?' },
      { by: 'a', say: '"{guess}". I\'d bet my kitty on it.' },
      { by: 'b', say: "Don't bet your kitty on anything yet. Sleep on it." },
      { by: 'a', dr: "{b} thinks I'm rushing it. Maybe I am. But I know what I saw." },
    ] },
    { id: 'ss-hs.3', room: 'backyard', turns: [
      { beat: 'By the pool, {a} sits down next to {b} and lowers their voice.' },
      { by: 'a', say: 'Can I run something past you? About {c}.' },
      { by: 'b', say: "About {c}'s secret?" },
      { by: 'a', say: 'Yeah. I think it\'s "{guess}".' },
      { by: 'b', say: 'Huh. That would actually explain a lot.' },
      { by: 'a', say: "Right? So don't say anything. If I'm right, I'm buzzing." },
      { by: 'b', dr: "If {a} buzzes and it's right, that's {a}'s money, not mine. I need to think about this." },
    ] },
    { id: 'ss-hs.4', room: 'kitchen', turns: [
      { beat: 'The kitchen. {b} is washing up and {a} is drying, very slowly.' },
      { by: 'b', say: "You've been staring at {c} all through lunch." },
      { by: 'a', say: "Because I think I know what {c}'s hiding." },
      { by: 'b', say: 'Go on, then.' },
      { by: 'a', say: '"{guess}".' },
      { by: 'b', say: 'No way. Really?' },
      { by: 'a', say: "Watch {c} at dinner tonight. You'll see it too." },
    ] },
  ],

  // a has noticed something c keeps doing
  'talk.ss.hunt.tell': [
    { id: 'ss-ht.1', turns: [
      { by: 'a', dr: "I've been watching {c}. {c} {tell}, every single time. That's not nothing." },
      { by: 'a', say: '{b}, do me a favour. Watch {c} later.' },
      { by: 'b', say: 'Watch what?' },
      { by: 'a', say: "Just watch. You'll see what I mean." },
      { by: 'b', say: "You're being really mysterious right now." },
      { by: 'a', say: "I'm being careful. There's a difference." },
    ] },
    { id: 'ss-ht.2', turns: [
      { by: 'b', say: 'What are you looking at?' },
      { by: 'a', say: '{c}.' },
      { by: 'b', say: 'What about {c}?' },
      { by: 'a', say: '{c} {tell}. Have you never noticed that?' },
      { by: 'b', say: '...Okay, now that you say it.' },
      { by: 'a', dr: "Everybody in here has a habit they can't hide. I think I've found {c}'s." },
    ] },
    { id: 'ss-ht.3', room: 'living-room', turns: [
      { beat: 'The living room. {a} is on the sofa, pretending to read, watching {c} across the room.' },
      { by: 'a', dr: '{c} {tell}. It could be nothing. But in this house, nothing is ever really nothing.' },
      { by: 'b', say: "You're doing the face again." },
      { by: 'a', say: "I'm not doing a face. I'm thinking." },
      { by: 'b', say: "You're thinking about {c}. Everybody can tell." },
      { by: 'a', say: 'Then I need to think more quietly.' },
    ] },
  ],

  // a fishes c, and is close: c is scared
  'talk.ss.hunt.fish.close': [
    { id: 'ss-hfc.1', turns: [
      { by: 'a', say: 'So, {c}. What did you do before all this?' },
      { by: 'c', say: 'Why? What have you heard?' },
      { by: 'a', say: "Nothing. I'm just making conversation." },
      { by: 'c', say: 'Right. Well, I worked. Like everybody.' },
      { by: 'a', say: 'Doing what?' },
      { by: 'c', dr: '{a} is getting way too close. I need {a} looking somewhere else, and fast.' },
    ] },
    { id: 'ss-hfc.2', turns: [
      { by: 'a', say: 'Can I ask you something a bit weird?' },
      { by: 'c', say: 'You can ask.' },
      { by: 'a', say: 'Has your secret got anything to do with "{guess}"?' },
      { by: 'c', say: "You know I can't answer that." },
      { by: 'a', say: "That's not a no." },
      { by: 'c', dr: "My heart was going so fast. {a} is right, and I can't let {a} work that out." },
    ] },
    { id: 'ss-hfc.3', room: 'kitchen', turns: [
      { beat: "Dinner. {a} turns to {c} in the middle of somebody else's story." },
      { by: 'a', say: '{c}, you never talk about home, do you?' },
      { by: 'c', say: "There's not much to say about home." },
      { by: 'a', say: "Everyone's got something to say about home." },
      { by: 'c', say: 'Well, I like hearing other people talk. Go on, tell me about yours.' },
      { by: 'c', dr: '{a} keeps circling me. Every day a little bit closer. I can feel it.' },
    ] },
  ],

  // a fishes c, and is wrong: c is delighted
  'talk.ss.hunt.fish.wrong': [
    { id: 'ss-hfw.1', turns: [
      { by: 'a', say: 'Can I ask you something a bit weird?' },
      { by: 'c', say: 'Go on.' },
      { by: 'a', say: 'Is your secret "{guess}"?' },
      { by: 'c', say: 'Wow. Is that really what you think?' },
      { by: 'a', say: 'Maybe.' },
      { by: 'c', dr: 'Honestly? Keep going, {a}. Keep going in exactly that direction.' },
    ] },
    { id: 'ss-hfw.2', turns: [
      { by: 'a', say: "I've worked you out, {c}." },
      { by: 'c', say: 'Oh, have you?' },
      { by: 'a', say: '"{guess}".' },
      { by: 'c', say: 'If you say so.' },
      { by: 'a', say: "You're not even denying it." },
      { by: 'c', dr: "It's nowhere near. It makes me laugh, because the further away {a} goes, the safer I am." },
    ] },
    { id: 'ss-hfw.3', turns: [
      { by: 'a', say: 'Tell me I\'m wrong. "{guess}".' },
      { by: 'c', say: "I'm not telling you anything." },
      { by: 'a', say: "See, that's exactly what someone hiding it would say." },
      { by: 'c', say: "It's also exactly what someone who isn't would say." },
      { by: 'a', say: "Hm. I'm still watching you." },
      { by: 'c', dr: "I'm not going to correct {a}. If {a} buzzes that, the five thousand comes straight to me." },
    ] },
  ],

  // the two who share a secret, alone for a minute
  'talk.ss.pair.check': [
    { id: 'ss-pc.1', room: 'storage-room', turns: [
      { beat: '{a} and {b} end up alone in the laundry for the first time all day.' },
      { by: 'a', say: 'Has anybody said anything to you?' },
      { by: 'b', say: "Someone asked me how long I've known you." },
      { by: 'a', say: 'What did you say?' },
      { by: 'b', say: 'That we met on the first night, like everybody else.' },
      { by: 'a', say: 'Good. We keep it that way.' },
      { by: 'b', dr: "It's so hard pretending not to know somebody you know this well." },
    ] },
    { id: 'ss-pc.2', turns: [
      { by: 'a', say: "Don't sit next to me at dinner tonight." },
      { by: 'b', say: 'I sat next to you once.' },
      { by: 'a', say: 'Once is enough. People are watching us.' },
      { by: 'b', say: "Okay. Okay. I'll sit at the other end." },
      { by: 'a', say: "And don't laugh at my jokes. You never laugh at anyone else's." },
      { by: 'a', dr: 'Every time I talk to {b}, I feel like the whole house is staring at us.' },
    ] },
    { id: 'ss-pc.3', room: 'backyard', turns: [
      { beat: 'Late at night by the pool, {a} and {b} talk without looking at each other.' },
      { by: 'a', say: 'Are you okay?' },
      { by: 'b', say: 'Not really. I miss being able to just talk to you.' },
      { by: 'a', say: "Not long now. We just hold on." },
      { by: 'b', say: "I know. I know. It's just hard." },
      { by: 'b', dr: 'Keeping my own secret is one thing. Keeping it with somebody else is twice as hard.' },
    ] },
  ],

  // the morning after somebody wrongly buzzed a (c pressed it)
  'talk.ss.buzz.wrong': [
    { id: 'ss-bw.1', turns: [
      { by: 'b', say: '{c} really thought that was your secret?' },
      { by: 'a', say: 'Apparently. Five thousand dollars, thank you very much.' },
      { by: 'b', say: "Are you okay, though? That must've been scary." },
      { by: 'a', say: "My heart stopped. But {c}'s nowhere near." },
      { by: 'b', say: "Then let {c} keep guessing." },
      { by: 'a', dr: "{c} has just shown the whole house they're coming for me. At least now I know." },
    ] },
    { id: 'ss-bw.2', turns: [
      { by: 'a', say: "I'm not even angry with {c}. I'm five thousand dollars richer." },
      { by: 'b', say: "You'd be angry if {c} had got it right." },
      { by: 'a', say: 'Yeah. Very.' },
      { by: 'b', say: 'So what are you going to do about {c}?' },
      { by: 'a', say: 'Nothing. Be nice. Let {c} feel stupid on their own.' },
      { by: 'b', dr: "{a} is laughing about it, but {a} hasn't stopped looking at {c} since." },
    ] },
    { id: 'ss-bw.3', room: 'kitchen', turns: [
      { beat: 'Breakfast. {c} walks in, and {a} smiles a bit too widely.' },
      { by: 'a', say: 'Morning, {c}! Sleep well?' },
      { by: 'b', say: "Don't." },
      { by: 'a', say: "What? I'm being friendly." },
      { by: 'b', say: "You're being friendly with {c}'s five thousand dollars." },
      { by: 'a', dr: "{c} buzzed me and got it wrong. I'm going to enjoy that for a while." },
    ] },
  ],

  // the morning after a's secret was found (c found it)
  'talk.ss.buzz.found': [
    { id: 'ss-bf.1', turns: [
      { by: 'b', say: 'Are you okay?' },
      { by: 'a', say: "No. All that time keeping it, and it's gone, and so is my money." },
      { by: 'b', say: "{c} didn't have to do it like that, in front of everyone." },
      { by: 'a', say: "That's the game. I just didn't think it would be {c}." },
      { by: 'b', say: "What are you going to do?" },
      { by: 'a', dr: "I'm not done. {c} has a secret too, and I've got nothing else to hide now." },
    ] },
    { id: 'ss-bf.2', turns: [
      { beat: '{a} is sitting on the bathroom floor. {b} sits down next to them.' },
      { by: 'b', say: "It's out now. You don't have to carry it any more." },
      { by: 'a', say: "I know. It's weird. I actually feel lighter." },
      { by: 'b', say: 'And {c}?' },
      { by: 'a', say: "{c} won this one. That's all it is." },
      { by: 'b', dr: "{a} says it's fine. {a} has said it's fine four times this morning." },
    ] },
    { id: 'ss-bf.3', room: 'backyard', turns: [
      { beat: 'The garden. {a} is doing lengths of the pool, hard. {b} waits at the edge.' },
      { by: 'b', say: "You're going to drown yourself." },
      { by: 'a', say: "I'm thinking." },
      { by: 'b', say: 'About {c}?' },
      { by: 'a', say: "About how {c} found it. I never said a word. Somebody must have." },
      { by: 'a', dr: "Either {c} is very clever, or somebody I trust talked. I need to know which." },
    ] },
  ],

  // a nominee's morning, and a friend rallying them
  // before the nominations: two allies find out they will both name c (bb/story/sstalk.js: from the real ballots)
  'talk.ss.noms.plan': [
    { id: 'ss-np.1', room: 'bathroom', turns: [
      { beat: '{a} turns on both taps in the bathroom. {b} slips in a second later and shuts the door.' },
      { by: 'a', say: "Quick, before anybody comes in. Who are you naming in the confessional?" },
      { by: 'b', say: "You go first." },
      { by: 'a', say: "{c}." },
      { by: 'b', say: "...Same." },
      { by: 'a', say: "Then that's the two of us on {c}." },
      { by: 'b', say: "And we never had this conversation." },
      { by: 'a', dr: "We're not allowed to talk about the nominations. So we don't. We just both happen to say {c}." },
    ] },
    { id: 'ss-np.2', room: 'backyard', turns: [
      { beat: 'By the pool, {a} and {b} lie on two loungers with their eyes shut, talking without moving their lips.' },
      { by: 'b', say: "So. The confessional." },
      { by: 'a', say: "Don't say it out loud." },
      { by: 'b', say: "I'm not saying anything. I'm just saying a name. {c}." },
      { by: 'a', say: "I was going to say {c} too." },
      { by: 'b', say: "Good. Then nobody had to talk anybody into anything." },
      { by: 'b', dr: "If {a} and I both say {c}, that's half the job done before the confessional even opens." },
    ] },
    { id: 'ss-np.3', room: 'bedroom', turns: [
      { beat: 'Lights out. {a} reaches across to {b}’s bed and taps the mattress.' },
      { by: 'a', say: "Are you awake?" },
      { by: 'b', say: "No." },
      { by: 'a', say: "I've made up my mind. {c}." },
      { by: 'b', say: "Me too. I made it up at dinner." },
      { by: 'a', say: "Then that's settled." },
      { by: 'b', say: "Go to sleep, {a}." },
      { by: 'a', dr: "You can't plan the nominations out loud in here. You just say a name in the dark and see if anybody says it back." },
    ] },
  ],

  // before the nominations: a wants b to name c, and b names somebody else
  'talk.ss.noms.push': [
    { id: 'ss-npu.1', room: 'kitchen', turns: [
      { by: 'a', say: "Can I ask you something? Who are you thinking of, for the nominations?" },
      { by: 'b', say: "You know we can't talk about that." },
      { by: 'a', say: "I'm not asking for a name. I'm just saying one. {c}. Think about it." },
      { by: 'b', say: "Why {c}?" },
      { by: 'a', say: "Because nobody ever watches {c}, and I think somebody should." },
      { by: 'b', say: "I'll think about it." },
      { by: 'b', dr: "I've already got my names, and {c} isn't one of them. {a} can push as much as {a} likes." },
    ] },
    { id: 'ss-npu.2', room: 'backyard', turns: [
      { beat: '{a} sits down next to {b} on the edge of the pool.' },
      { by: 'a', say: "If you wanted somebody gone this week, who would it be?" },
      { by: 'b', say: "Is this about the nominations? Because I'm not doing this." },
      { by: 'a', say: "Just say yes or no. {c}?" },
      { by: 'b', say: "No. Not {c}." },
      { by: 'a', say: "Why not?" },
      { by: 'b', say: "Because I've got my own reasons, and they're not about {c}." },
      { by: 'a', dr: "I thought {b} was with me on {c}. {b} isn't. I need somebody else before the confessional." },
    ] },
    { id: 'ss-npu.3', room: 'bathroom', turns: [
      { beat: 'In the bathroom, {a} turns on the taps so the microphones can’t hear.' },
      { by: 'a', say: "Put {c} up with me. Just this once." },
      { by: 'b', say: "Turn the water off, {a}. They hear everything anyway." },
      { by: 'a', say: "Is that a no?" },
      { by: 'b', say: "It's a no." },
      { by: 'b', dr: "Everybody wants you to do their nominations for them. I do my own." },
    ] },
  ],

  // before the nominations: the one the house will name most is scared, and b is honest: b is not naming a
  'talk.ss.noms.fear': [
    { id: 'ss-nf.1', room: 'bedroom', turns: [
      { beat: '{a} sits on the end of {b}’s bed and doesn’t say anything for a while.' },
      { by: 'a', say: "My name's going in this week. I can feel it." },
      { by: 'b', say: "Not from me, it isn't." },
      { by: 'a', say: "Promise?" },
      { by: 'b', say: "I promise. You're not one of my names." },
      { by: 'a', say: "Then who?" },
      { by: 'b', say: "I don't know. But not me." },
      { by: 'a', dr: "{b} looked me in the eye when {b} said it. In here, that's the most anybody can give you." },
    ] },
    { id: 'ss-nf.2', room: 'kitchen', turns: [
      { by: 'a', say: "Be honest with me. Am I in trouble this week?" },
      { by: 'b', say: "Why would you be in trouble?" },
      { by: 'a', say: "Because I can feel it. The way people look at me when I come in." },
      { by: 'b', say: "Well, it won't be me putting you up. I can tell you that much." },
      { by: 'a', say: "That's something." },
      { by: 'b', dr: "{a} is right to be scared. But my names are going somewhere else." },
    ] },
    { id: 'ss-nf.3', room: 'backyard', turns: [
      { by: 'a', say: "If I'm nominated, will you be all right?" },
      { by: 'b', say: "You won't be. And if you are, it won't be because of me." },
      { by: 'a', say: "You'd tell me if you were going to?" },
      { by: 'b', say: "I'd tell you. I'm not." },
      { by: 'a', say: "Okay. Thank you." },
      { by: 'a', dr: "I believe {b}. I have to believe somebody in this house." },
    ] },
  ],

  // before the nominations: the one the house will name most asks b, and b is going to name a: b lies
  'talk.ss.noms.lie': [
    { id: 'ss-nl.1', room: 'bedroom', turns: [
      { by: 'a', say: "You're not going to put me up, are you?" },
      { by: 'b', say: "Me? Never." },
      { by: 'a', say: "Okay. Good. I needed to hear that." },
      { by: 'b', say: "Get some sleep." },
      { by: 'b', dr: "I'm naming {a}. I'm not proud of it, but it's my game, and {a} is in my way." },
    ] },
    { id: 'ss-nl.2', room: 'kitchen', turns: [
      { by: 'a', say: "Just tell me I'm safe with you." },
      { by: 'b', say: "You're safe with me. Obviously." },
      { by: 'a', say: "Thank you. Everybody else is being so weird with me." },
      { by: 'b', say: "Ignore them." },
      { by: 'b', dr: "I said 'safe with me', and I'm about to say {a}'s name in the confessional. That's this game." },
    ] },
    { id: 'ss-nl.3', room: 'backyard', turns: [
      { beat: '{a} and {b} walk slow laps of the garden.' },
      { by: 'a', say: "If my name comes out at the nominations, I'll know it wasn't you, right?" },
      { by: 'b', say: "Right." },
      { by: 'a', say: "Sorry. I'm just nervous." },
      { by: 'b', say: "Don't be." },
      { by: 'b', dr: "It will be me. One of them, anyway. {a} will never know which, and that's the only reason I can do it." },
    ] },
  ],

  'talk.ss.noms.morning': [
    { id: 'ss-nm.1', room: 'bedroom', turns: [
      { beat: 'Morning. {a} is sitting on the edge of the bed, not moving.' },
      { by: 'b', say: 'Hey. Did you sleep at all?' },
      { by: 'a', say: 'Not really. I keep thinking about the public.' },
      { by: 'b', say: "You're staying. I know you are." },
      { by: 'a', say: "You can't know that." },
      { by: 'b', say: 'I believe it. You have to believe it too.' },
      { by: 'a', dr: "I'm nominated. When I woke up this morning, that was the first thing in my head." },
    ] },
    { id: 'ss-nm.2', room: 'kitchen', turns: [
      { by: 'b', say: 'Eat something.' },
      { by: 'a', say: "I can't." },
      { by: 'b', say: "You're not going anywhere, okay? People love you out there." },
      { by: 'a', say: "You don't know what they're seeing." },
      { by: 'b', say: "I know what I'm seeing. That's enough for me." },
      { by: 'b', dr: "{a} is my person in here. I'm not ready to do this without {a}." },
    ] },
    { id: 'ss-nm.3', turns: [
      { by: 'a', say: "If I go at the prime, promise me you'll keep going." },
      { by: 'b', say: "Stop it. You're not going." },
      { by: 'a', say: 'Just promise.' },
      { by: 'b', say: "Fine. I promise. But you're not going." },
      { by: 'a', say: 'Okay.' },
      { by: 'a', dr: "I said it like a joke. It wasn't a joke." },
    ] },
  ],

  // two allies whispering about the nominations: forbidden by the Voice
  'talk.ss.noms.whisper': [
    { id: 'ss-nw.1', turns: [
      { beat: '{a} and {b} sit with their backs to the cameras and talk very quietly.' },
      { by: 'b', say: 'Who did you put up?' },
      { by: 'a', say: "We're not allowed to talk about it." },
      { by: 'b', say: 'I know. Just tell me.' },
      { by: 'a', say: '{c}. Now stop asking.' },
      { by: 'a', dr: "We're not supposed to talk about the nominations. Everybody does, they just do it quietly." },
    ] },
    { id: 'ss-nw.2', turns: [
      { by: 'b', say: 'Did you name {c}? You can just nod.' },
      { by: 'a', say: "I'm not nodding. The Voice hears everything." },
      { by: 'b', say: "That's a yes." },
      { by: 'a', say: "It's a 'please stop talking'." },
      { by: 'b', say: 'Fine. Fine.' },
      { by: 'a', dr: "I'm not losing money to tell {b} something {b} has already guessed." },
    ] },
    { id: 'ss-nw.3', room: 'bedroom', turns: [
      { beat: 'The bedroom, lights off. {b} whispers across the gap between the beds.' },
      { by: 'b', say: 'Was it you who put {c} up?' },
      { by: 'a', say: 'Go to sleep.' },
      { by: 'b', say: "That means yes, doesn't it?" },
      { by: 'a', say: 'It means go to sleep.' },
      { by: 'a', dr: "{b} will work it out anyway. I'd just rather the Voice didn't hear me say it." },
    ] },
  ],

  // a nominee wondering what the public thinks
  'talk.ss.public': [
    { id: 'ss-pu.1', turns: [
      { by: 'a', say: 'Do you think they like me out there?' },
      { by: 'b', say: 'Who?' },
      { by: 'a', say: 'The public. The people actually voting.' },
      { by: 'b', say: "Of course they do. You're yourself in here." },
      { by: 'a', say: "That's what scares me." },
      { by: 'a', dr: "The house doesn't decide anything. The public does, and I've got no idea what they think of me." },
    ] },
    { id: 'ss-pu.2', room: 'backyard', turns: [
      { beat: 'On the loungers, {a} stares up at the studio lights.' },
      { by: 'a', say: "I'd give anything to watch one minute of what they're seeing." },
      { by: 'b', say: "You'd hate it. Nobody likes how they look on TV." },
      { by: 'a', say: "I'd still want to know." },
      { by: 'b', say: "They see what we see. Somebody nice who's terrified." },
      { by: 'b', dr: '{a} is acting fine, but {a} has asked me about the public three times today.' },
    ] },
    { id: 'ss-pu.3', room: 'kitchen', turns: [
      { beat: 'The kitchen. {a} is making tea for everybody, one mug at a time.' },
      { by: 'b', say: "You know making everyone tea won't change the vote, right?" },
      { by: 'a', say: "It's not for the vote. I'm just nervous." },
      { by: 'b', say: 'The public saw you this week. They saw who you are.' },
      { by: 'a', say: "That's the bit I'm worried about." },
      { by: 'a', dr: 'If they send me home, I want it to be for who I am, not because they never saw me.' },
    ] },
  ],

  // the richest, and why they keep quiet about it
  'talk.ss.kitty.rich': [
    { id: 'ss-kr.1', turns: [
      { by: 'b', say: 'How much have you got now?' },
      { by: 'a', say: 'Enough.' },
      { by: 'b', say: "That's not a number." },
      { by: 'a', say: "That's on purpose." },
      { by: 'b', say: 'Come on, I tell you everything.' },
      { by: 'a', dr: "When your kitty's big, everybody's hunting you. I'd rather they didn't know how big." },
    ] },
    { id: 'ss-kr.2', turns: [
      { by: 'b', say: "You know you've got the biggest kitty in here, right?" },
      { by: 'a', say: "Don't say it so loud." },
      { by: 'b', say: 'Everybody can see the board.' },
      { by: 'a', say: 'Seeing it is one thing. Talking about it all day is another.' },
      { by: 'b', say: "Okay, okay. I didn't say anything." },
      { by: 'a', dr: 'The more money I have, the more the house wants to find my secret. That kitty is a target.' },
    ] },
    { id: 'ss-kr.3', room: 'bedroom', turns: [
      { beat: '{a} is folding clothes. {b} sits on the end of the bed.' },
      { by: 'b', say: "If somebody buzzes you right, they get all of it." },
      { by: 'a', say: 'I know.' },
      { by: 'b', say: 'Does that not keep you up at night?' },
      { by: 'a', say: 'Every night.' },
      { by: 'a', dr: "I worked hard for every dollar of that kitty, and one buzz could take the lot." },
    ] },
  ],

  // the poorest, and the buzz they can't afford
  'talk.ss.kitty.poor': [
    { id: 'ss-kp.1', turns: [
      { by: 'a', say: "I've got almost nothing left. One wrong buzz and I'm done." },
      { by: 'b', say: "Then don't buzz until you're sure." },
      { by: 'a', say: "I'm never going to be sure." },
      { by: 'b', say: 'Then win the next game. Get some money back first.' },
      { by: 'a', say: "That's the plan. It's not a great plan." },
      { by: 'a', dr: "Everybody else can take a risk. I can't afford to be wrong even once." },
    ] },
    { id: 'ss-kp.2', turns: [
      { by: 'a', say: "Did you see the board? I'm at the bottom." },
      { by: 'b', say: 'Money moves in here. It moved for me twice already.' },
      { by: 'a', say: 'It only ever moves away from me.' },
      { by: 'b', say: "Then let it come back. There's a mission or a game every week." },
      { by: 'a', say: "I'll take anything the Voice gives me." },
      { by: 'b', dr: '{a} pretends not to care about the money. {a} checked the board twice before lunch.' },
    ] },
    { id: 'ss-kp.3', room: 'living-room', turns: [
      { beat: 'The living room. The kitty board glows on the screen. {a} sits right in front of it.' },
      { by: 'b', say: 'Stop staring at it.' },
      { by: 'a', say: "I'm not staring. I'm counting how far behind I am." },
      { by: 'b', say: "That's staring." },
      { by: 'a', say: 'Okay, it is.' },
      { by: 'a', dr: "If I'm going to win this, I need a secret. Somebody else's. I need that money." },
    ] },
  ],

  // two who trust each other
  'talk.ss.core': [
    { id: 'ss-co.1', turns: [
      { by: 'a', say: "You know you're in my core, right?" },
      { by: 'b', say: 'Your core?' },
      { by: 'a', say: "My people. The ones I'd take to the final with me." },
      { by: 'b', say: "Okay. Then you're in mine." },
      { by: 'a', say: "Good. That's settled." },
      { by: 'a', dr: "In here you need two or three people you'd trust with anything. {b} is one of mine, even if I'll never tell {b} my secret." },
    ] },
    { id: 'ss-co.2', turns: [
      { by: 'a', say: "If it comes down to it, it's you and me." },
      { by: 'b', say: 'You say that to everyone.' },
      { by: 'a', say: 'I say it to you.' },
      { by: 'b', say: 'Okay. I believe you.' },
      { by: 'a', say: 'Good. Because I mean it.' },
      { by: 'b', dr: '{a} means it. I think. In this house you never really know.' },
    ] },
    { id: 'ss-co.3', room: 'backyard', turns: [
      { beat: '{a} and {b} sit on the grass, away from everyone else.' },
      { by: 'b', say: "Do you ever think about what happens if one of us finds the other one's secret?" },
      { by: 'a', say: 'All the time.' },
      { by: 'b', say: 'And?' },
      { by: 'a', say: "I'd come and tell you first. Before I pressed anything." },
      { by: 'b', dr: "That's either the nicest thing anyone's said to me in here, or the cleverest." },
    ] },
  ],

  // the weight of keeping a secret
  'talk.ss.burden': [
    { id: 'ss-bu.1', turns: [
      { by: 'a', say: "Do you ever forget you've got a secret?" },
      { by: 'b', say: 'Never. Do you?' },
      { by: 'a', say: 'For about ten minutes in the pool this morning.' },
      { by: 'b', say: 'Lucky you.' },
      { by: 'a', say: 'Then somebody said the word "secret" and it all came back.' },
      { by: 'a', dr: "Every time somebody talks about secrets at dinner, I go quiet, and I'm scared the quiet is what gives me away." },
    ] },
    { id: 'ss-bu.2', room: 'bedroom', turns: [
      { beat: 'Late. {a} is lying awake, staring at the ceiling. {b} notices.' },
      { by: 'b', say: "Can't sleep?" },
      { by: 'a', say: 'Just thinking.' },
      { by: 'b', say: 'About home?' },
      { by: 'a', say: 'Something like that.' },
      { by: 'a', dr: "I can't tell {b} what I'm really thinking about, because it's my secret. That's the loneliest part of this game." },
    ] },
    { id: 'ss-bu.3', room: 'living-room', turns: [
      { beat: 'The living room. The house is guessing secrets out loud, as a game. {a} laughs along.' },
      { by: 'b', say: 'Your turn, {a}. Guess somebody.' },
      { by: 'a', say: "I'm terrible at this. I'll pass." },
      { by: 'b', say: "You can't pass." },
      { by: 'a', say: 'Watch me.' },
      { by: 'a', dr: "Every guess in that game was the wrong one about me, and I had to laugh like I didn't care." },
    ] },
  ],
};

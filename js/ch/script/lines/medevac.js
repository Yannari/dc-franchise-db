// A medevac as the moment it is (js/ch/medevac.js).
//   medical-exam   a = the one hurt; b = a friend at their side (optional); {part} = what is hurt
//                  cleared: the medic lets them keep going, with a warning; out: the medic has decided
//   medical-house  a = the one leaving; b, c = friends (c optional); d = somebody quietly relieved (relieved)
export default {
  'medical-exam.cleared': [
    { id: 'mx.c1', turns: [
      { beat: 'The medic presses on {a}\'s {part}. {a} grits {a.posAdj} teeth and says nothing.' },
      { by: 'b', opt: 1, say: "Is it bad? Just tell us if it's bad." },
      { by: 'a', say: "It's fine. Tell them it's fine." },
      { beat: 'The medic tapes it up and says {a} can keep going. One more bad landing, though, and that is the end of it.' },
      { by: 'a', say: "See? Fine." },
      { by: 'b', opt: 'b', say: "That's not what the medic said, and you know it." },
      { by: 'a', conf: "I heard the medic. One more bad landing. I'm just not going to have one." },
    ] },
    { id: 'mx.c2', turns: [
      { beat: '{a} limps to the medical tent, and the house watches {a} go.' },
      { by: 'a', say: "I can still compete. I'm telling you, I can still compete." },
      { beat: 'The medic takes a long time over the {part}, then clears {a} to carry on, for now.' },
      { by: 'b', opt: 1, say: "For now. Did you hear the for now?" },
      { by: 'a', opt: 'b', say: "I heard it. I'm choosing to ignore it." },
      { by: 'a', conf: "Everybody in that house just watched me limp. Tomorrow every one of them is going to think I'm the easy name." },
    ] },
    { id: 'mx.c3', turns: [
      { beat: 'Ice on the {part}, a medic on one side, and {a} staring at the floor.' },
      { by: 'a', say: "Just tell me I'm not going home." },
      { beat: 'The medic says {a} is not going home today. Rest it, ice it, and come back if it gets worse.' },
      { by: 'a', say: "Today. Okay. I'll take today." },
      { by: 'b', opt: 1, say: "I'll carry you to every meal if I have to." },
      { by: 'a', conf: "I'm still here. But I've never been more scared of a daily in my life." },
    ] },
  ],
  'medical-exam.out': [
    { id: 'mx.o1', turns: [
      { beat: 'The medic has been in with {a} for twenty minutes. Nobody in the house is talking.' },
      { by: 'a', say: "Don't. Don't say it. Please just tape it up." },
      { beat: 'The medic does not tape it up. The {part} is too bad to keep going.' },
      { by: 'b', opt: 1, say: "Hey. Hey, look at me. It's going to be okay." },
      { by: 'a', opt: 'b', say: "It's not okay. Nobody beat me. My own body did this." },
      { by: 'a', conf: "I trained for this for a year. A year. And it's over because of one landing." },
    ] },
    { id: 'mx.o2', turns: [
      { beat: '{a} is on the medical bench with the {part} wrapped, and the medic is shaking {a.posAdj} head.' },
      { by: 'a', say: "Give me a day. One day. It'll be better tomorrow." },
      { beat: 'It will not be better tomorrow. The medic says it out loud, and {a} puts {a.posAdj} face in {a.posAdj} hands.' },
      { by: 'b', opt: 1, say: "I'm right here. I'm not going anywhere." },
      { by: 'a', conf: "I can take losing. I can take getting voted in. I can't take this. I didn't even get to fight." },
    ] },
    { id: 'mx.o3', turns: [
      { beat: 'The medic has seen this {part} before. Last time it was a warning. This time it is not.' },
      { by: 'a', say: "It was getting better. I swear it was getting better." },
      { by: 'b', opt: 1, say: "You've been limping for days. We all saw it." },
      { by: 'a', opt: 'b', say: "I know. I just didn't want anybody to see it." },
      { by: 'a', conf: "I knew it was coming. I knew the second I felt it go again. I just kept hoping." },
    ] },
  ],
  'medical-house.friends': [
    { id: 'mh.f1', turns: [
      { beat: '{a} comes back to the villa on crutches to pack. The house goes completely quiet.' },
      { by: 'b', say: "This isn't fair. You didn't lose anything. You got hurt." },
      { by: 'a', say: "Same plane, though." },
      { by: 'c', opt: 1, say: "We're going to win this for you. I swear." },
      { by: 'a', opt: 'c', say: "Don't win it for me. Win it because you're good enough. Then call me." },
      { beat: 'Everybody takes a turn hugging {a}. Some of them take two.' },
      { by: 'b', conf: "{a} didn't get voted out. Nobody beat {a.obj}. A {part} did. I don't know how to be angry at a {part}." },
    ] },
    { id: 'mh.f2', turns: [
      { by: 'a', say: "Can somebody help me with my bag? I can't really carry anything." },
      { by: 'b', say: "I've got it. I've got everything." },
      { by: 'a', say: "Thank you. For all of it. Not just the bag." },
      { by: 'b', say: "Stop. You're going to make me cry, and then everybody's going to cry." },
      { by: 'c', opt: 1, say: "Too late. I'm already crying." },
      { by: 'a', conf: "I'm leaving with my head up. I'm also leaving on crutches. Both of those things are true." },
    ] },
  ],
  'medical-house.relieved': [
    { id: 'mh.r1', turns: [
      { beat: '{a} packs while the house sits around in silence.' },
      { by: 'b', say: "I'm so sorry. You were having the best season out of all of us." },
      { by: 'a', say: "Then somebody else gets to have it now." },
      { by: 'd', say: "Get better, okay? Seriously." },
      { by: 'b', conf: "{d} said the right words. But I saw {d}'s face when the medic came back. It wasn't sad." },
      { by: 'd', conf: "I feel bad for {a}. I do. But {a} was the biggest threat in this house, and now {a} isn't in it. I'd be lying if I said that doesn't help me." },
    ] },
    { id: 'mh.r2', turns: [
      { by: 'b', say: "I can't believe you're leaving like this." },
      { by: 'a', say: "Me neither. I keep waiting for somebody to tell me it's a joke." },
      { beat: 'At the other end of the room, {d} is already talking quietly to somebody about the vote.' },
      { by: 'b', say: "Unbelievable. {a}'s not even out of the door." },
      { by: 'a', say: "Let it go. It isn't worth it." },
      { by: 'b', conf: "{d} didn't even wait for the car to leave. I'll remember that when it's {d}'s name on the line." },
    ] },
  ],
  'medical-house.quiet': [
    { id: 'mh.q1', turns: [
      { beat: '{a} packs alone. A few people come to the door to say goodbye, and do not quite know what to say.' },
      { by: 'a', conf: "I didn't make a lot of close friends in here. I thought that would make leaving easier. It doesn't." },
      { by: 'a', conf: "I'll heal. And when I do, I want another shot at this. I'm not done with The Challenge. It's just done with me for now." },
    ] },
  ],
};

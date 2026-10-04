// ══════════════════════════════════════════════════════════════════════
// bb/script/lines/whact.js — the Whacktivity, spoken (Phase 7)
// ══════════════════════════════════════════════════════════════════════
//
// Three doors, three powers, and only one door opens (written by
// bb/script/ceremony.js). Picking a door is public: the whole house watches.
// Winning is private, so a winner only talks about it in the Diary Room.
// Power names stay out of these lines; Big Brother names the doors.
//
//   whact.picked    a walks to a door                          scene
//   whact.crowded   a sees how many others picked the same door  scene
//   whact.alone     a is the only one at the door that opened  scene
//   whact.shut      a picked a door that did not open          scene
//   whact.won       a won the power, in private                scene
//   whact.missed    a played alone and lost                    scene

export default {
  'whact.picked.scene': [
    { id: 'wh7.p1', turns: [{ by: 'a', dr: "I knew which door I wanted as soon as they read the rules." }] },
    { id: 'wh7.p2', turns: [{ by: 'a', dr: "Everyone just watched me walk to that door. Now they know what I want." }] },
    { id: 'wh7.p3', turns: [{ by: 'a', say: "This one. Definitely this one." }] },
    { id: 'wh7.p4', turns: [{ by: 'a', dr: "I picked the one I'd actually use. Not the one that sounds the coolest." }] },
    { id: 'wh7.p5', turns: [{ by: 'a', dr: "I didn't look back to see who followed me. I didn't want to know yet." }] },
    { id: 'wh7.p6', turns: [{ by: 'a', dr: "I stood in that hallway for ages. In the end I went with my gut." }] },
  ],
  'whact.crowded.scene': [
    { id: 'wh7.c1', turns: [{ by: 'a', say: "Seriously? All of you?" }] },
    { id: 'wh7.c2', turns: [{ by: 'a', dr: "I thought I was being clever. So did everyone else in this room." }] },
    { id: 'wh7.c3', turns: [{ by: 'a', dr: "Now I know exactly who else wants this. That's useful, even if I lose." }] },
    { id: 'wh7.c4', turns: [{ by: 'a', say: "Well, this is awkward." }, { beat: 'Nobody in the room laughs.' }] },
  ],
  'whact.alone.scene': [
    { id: 'wh7.a1', turns: [{ by: 'a', dr: "Nobody else picked my door. I still have to beat it, though." }] },
    { id: 'wh7.a2', turns: [{ by: 'a', say: "Just me? Okay. Let's do this." }] },
    { id: 'wh7.a3', turns: [{ by: 'a', dr: "Being on my own doesn't mean I win. It means if I lose, everyone knows I lost to nobody." }] },
  ],
  'whact.shut.scene': [
    { id: 'wh7.s1', turns: [{ by: 'a', dr: "My door didn't even open. I told the whole house what I wanted, and got nothing for it." }] },
    { id: 'wh7.s2', turns: [{ by: 'a', say: "That's it? It doesn't open?" }] },
    { id: 'wh7.s3', turns: [{ by: 'a', dr: "The HOH watched me pick that door. That's going to cost me, and I didn't even get to play." }] },
    { id: 'wh7.s4', turns: [{ by: 'a', dr: "I picked the wrong door. Not the wrong power. The wrong door." }] },
  ],
  'whact.won.scene': [
    { id: 'wh7.w1', turns: [{ by: 'a', dr: "I won. Nobody out there knows. I'm going to walk out looking like I lost." }] },
    { id: 'wh7.w2', turns: [{ by: 'a', dr: "They told me in a room with the door shut. I've never had to keep a straight face this hard." }] },
    { id: 'wh7.w3', turns: [{ by: 'a', dr: "I've got it. Everybody who was in there with me has no idea who won." }] },
    { id: 'wh7.w4', turns: [{ by: 'a', dr: "Best feeling in the world. And I can't tell anyone." }] },
  ],
  'whact.missed.scene': [
    { id: 'wh7.m1', turns: [{ by: 'a', dr: "I was the only one in there, and I still lost. That's embarrassing." }] },
    { id: 'wh7.m2', turns: [{ by: 'a', say: "I had it to myself and I blew it." }] },
    { id: 'wh7.m3', turns: [{ by: 'a', dr: "Everyone saw me go in alone, and everyone's going to see me come out with nothing." }] },
  ],
};

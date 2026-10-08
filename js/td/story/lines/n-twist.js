// ══════════════════════════════════════════════════════════════════════
// td/story/lines/n-twist.js — twists as conversations (td/story/twist.js)
// ══════════════════════════════════════════════════════════════════════
//
// The Summit (twists.js 'three-gifts'): one nominee per team.
//   twist.summit.meet.any     a, b (and c, d) — the nominees, each from a different team, meet
//   twist.summit.choose.<kit|clue|totem>  a, to camera: what they took and why (kit: for the
//                             team; clue: an edge, quietly; totem: for themselves)
//   twist.summit.back.<ending>  a comes back to camp; b, c (and d) are a's closest teammates.
//     kit: a brings the survival kit. found / empty: a took the idol clue and found the idol /
//     came up empty, and covers. totem: a took the totem and covers. totem-brag / totem-cold /
//     totem-slip: a took it and brags / doesn't care who knows / lets it slip when asked.
// {tribe} is a's team. Ids: 'nz.'.

const O = (by, say) => ({ by, say, opt: true });

export default {
  'twist.summit.meet.any': [
    { id: 'nz.m1', turns: [
      { beat: "A clearing far from every camp. {a} and {b} arrive from opposite sides." },
      { by: 'a', move: 'greet' },
      { by: 'b', say: "So you're the one they sent." },
      { by: 'a', say: "Somebody had to come. Why you?" },
      { by: 'b', say: "I volunteered. Mostly to get away from my team for an hour." },
      O('c', "Same. Mine's been fighting since breakfast."),
      O('d', "Mine haven't stopped talking about the vote."),
      { by: 'a', say: "So what's the catch?" },
      { by: 'b', say: "There's always a catch." },
      { by: 'b', conf: "{a} is nice, and nice is dangerous here, because you never know what nice is hiding." },
    ] },
    { id: 'nz.m2', turns: [
      { beat: "Three boxes on a table. {a} and {b} stare at them, not at each other." },
      { by: 'b', say: "Okay. What are you taking?" },
      { by: 'a', say: "Why would I tell you that?" },
      { by: 'b', say: "Because I'll tell you mine." },
      { by: 'a', move: 'suspicious' },
      O('c', "Nobody's telling anybody anything. Let's be honest."),
      { by: 'b', say: "Fine, then let's just say we all took the kit, for our teams." },
      { by: 'a', say: "Sure. We all took the kit." },
      { by: 'a', conf: "Everybody here is going to say they took the kit, and somebody here is lying. Maybe me." },
    ] },
    { id: 'nz.m3', when: { third: true }, turns: [
      { beat: "{a}, {b} and {c} meet at the summit. Each of them came from a different camp." },
      { by: 'c', say: "This is weird, right? Talking to the enemy." },
      { by: 'a', say: "You're not the enemy. Yet." },
      { by: 'b', say: "We could make a deal right here, and nobody would know." },
      { by: 'c', move: 'stall' },
      O('d', "A deal between four people from four teams? That's insane, I love it."),
      { by: 'a', say: "Let's just say if we're ever on the same side, we remember today." },
      { by: 'b', move: 'agree' },
      { by: 'c', conf: "We just made the vaguest deal in history. I still think it might matter at the merge." },
    ] },
  ],
  'twist.summit.choose.kit': [
    { id: 'nz.k4', turns: [
      { by: 'a', conf: "Everybody back at camp is hungry and cold. I'm not walking back in there with something in my pocket and nothing in my hands. Kit." },
    ] },
    { id: 'nz.k5', when: { voice: ['tough', 'blunt', 'earnest', 'bossy'] }, turns: [
      { by: 'a', conf: "Team first, that's the whole reason. I took the kit." },
    ] },
    { id: 'nz.k1', turns: [
      { by: 'a', conf: "The totem was right there, just for me." },
      { by: 'a', conf: "But my team's been sleeping in the rain. I'm taking the kit. I want to walk back into camp a hero, not a liar." },
    ] },
    { id: 'nz.k2', when: { voice: ['warm', 'earnest', 'emotional'] }, turns: [
      { by: 'a', conf: "I didn't even think about it, honestly, I took the kit for the team, because that's who I am." },
    ] },
    { id: 'nz.k3', when: { voice: ['schemer', 'calm', 'competitive'] }, turns: [
      { by: 'a', conf: "The totem helps me tonight. The kit helps me every night after, because the team owes me. Easy choice." },
    ] },
  ],
  'twist.summit.choose.clue': [
    { id: 'nz.c3', turns: [
      { by: 'a', conf: "The totem is too obvious, everybody would know, but a clue is quiet." },
      { by: 'a', conf: "Now I just have to find the thing before anybody notices I'm looking." },
    ] },
    { id: 'nz.c4', when: { voice: ['anxious', 'warm', 'earnest'] }, turns: [
      { by: 'a', conf: "I took the clue. I'm going to feel so guilty if I find something. I'm going to feel worse if I don't." },
    ] },
    { id: 'nz.c5', when: { voice: ['competitive', 'tough', 'proud'] }, turns: [
      { by: 'a', conf: "A clue means I get to go find it myself. I like that better than being handed something." },
    ] },
    { id: 'nz.c1', turns: [
      { by: 'a', conf: "I took the clue. Nobody needs to know that." },
      { by: 'a', conf: "If it leads to an idol, I'm the most dangerous person on my team. If it doesn't, nothing happened." },
    ] },
    { id: 'nz.c2', when: { voice: ['nerdy', 'schemer', 'calm', 'dry'] }, turns: [
      { by: 'a', conf: "The kit is a nice gesture and the totem puts a target on your back, so I took the clue, because I'll always take information." },
    ] },
  ],
  'twist.summit.choose.totem': [
    { id: 'nz.t4', turns: [
      { by: 'a', conf: "I keep hearing my name at camp, so the totem it is, and my team can be mad at me in person next week." },
    ] },
    { id: 'nz.t5', when: { voice: ['schemer', 'calm', 'dry'] }, turns: [
      { by: 'a', conf: "Nobody will ever know I took the totem, and that's the beauty of it." },
    ] },
    { id: 'nz.t1', turns: [
      { by: 'a', conf: "I took the totem. I'm not going to apologise for it." },
      { by: 'a', conf: "My team is going to be annoyed. My team can be annoyed. I'm still going to be here next week." },
    ] },
    { id: 'nz.t2', when: { voice: ['anxious', 'warm', 'emotional', 'earnest'] }, turns: [
      { by: 'a', conf: "I feel sick, I took the totem and I don't even know why, I just panicked." },
      { by: 'a', conf: "Now I have to go back there and look everyone in the eye." },
    ] },
    { id: 'nz.t3', when: { voice: ['cruel', 'proud', 'competitive', 'loud'] }, turns: [
      { by: 'a', conf: "The totem, obviously, I didn't come here to bring my team a cooking pot." },
    ] },
  ],

  'twist.summit.back.kit': [
    { id: 'nz.bk2', turns: [
      { by: 'b', say: "Is that a pot? Is that an actual pot?" },
      { by: 'a', say: "And flint. And a machete." },
      { by: 'c', move: 'excited' },
      O('d', "We're going to have hot food. Real hot food."),
      { by: 'b', move: 'thanks' },
      { by: 'a', conf: "Everybody hugged me. I've never been hugged by that many people who might vote me out." },
    ] },
    { id: 'nz.bk1', turns: [
      { beat: "{a} walks back into camp carrying a pot, a machete and flint." },
      { by: 'b', move: 'excited' },
      { by: 'c', say: "You brought us a kit? You actually brought us a kit?" },
      { by: 'a', say: "Of course I did. What did you think I'd bring?" },
      O('d', "Honestly? Nothing."),
      { by: 'b', move: 'impressed' },
      { by: 'c', conf: "{a} could have taken something just for {a.ref}, and {a} didn't, and I'm not going to forget that." },
    ] },
  ],
  'twist.summit.back.found': [
    { id: 'nz.bf2', turns: [
      { by: 'b', say: "You were gone a long time." },
      { by: 'a', say: "It was far. And they made us talk to each other for ages." },
      { by: 'c', say: "And you came back with nothing?" },
      { by: 'a', say: "Nothing. Sorry." },
      { by: 'c', move: 'dismiss' },
      { by: 'a', conf: "There's an idol in my bag. My team is mad I brought them nothing. Both of those are going to matter." },
    ] },
    { id: 'nz.bf1', turns: [
      { by: 'b', say: "So? What did you get?" },
      { by: 'a', say: "Nothing, it was a trick, just a talk and a really long walk." },
      { by: 'c', move: 'suspicious' },
      { by: 'a', say: "I swear. Nothing." },
      O('d', "That's weird. Why send someone just to talk?"),
      { by: 'a', conf: "I found an idol an hour after I got back. My team thinks I came home with nothing. Let them." },
    ] },
  ],
  'twist.summit.back.empty': [
    { id: 'nz.be2', turns: [
      { by: 'b', say: "So? What was it?" },
      { by: 'a', say: "Honestly? Nothing, I picked wrong." },
      { by: 'c', move: 'sad' },
      O('d', "So no supplies?"),
      { by: 'a', say: "No supplies. I'm sorry." },
      { by: 'b', move: 'reassure' },
      { by: 'a', conf: "I didn't even tell them it was a clue. Nothing came of it, so what's the point? Better they think I got unlucky." },
    ] },
    { id: 'nz.be1', turns: [
      { by: 'b', say: "Well? What happened?" },
      { by: 'a', say: "I took a clue and I looked, but I didn't find anything." },
      { by: 'c', say: "A clue? Not the kit?" },
      { by: 'a', say: "I thought I could find us something better." },
      { by: 'c', move: 'agree.reluctant' },
      O('d', "Next time, maybe bring a pot."),
      { by: 'a', conf: "I went for the big thing and came back with nothing. That's going to sting for a while." },
    ] },
  ],
  'twist.summit.back.totem': [
    { id: 'nz.bt2', turns: [
      { by: 'c', say: "You're back! Did you get anything good?" },
      { by: 'a', say: "Just a long talk with the other team. Weird day." },
      { by: 'b', say: "That's it?" },
      { by: 'a', say: "That's it." },
      { by: 'b', move: 'stall' },
      { by: 'a', conf: "If anybody finds out what's in my pocket, I'm done on this team. So nobody finds out." },
    ] },
    { id: 'nz.bt1', turns: [
      { by: 'b', say: "Hey! How'd it go?" },
      { by: 'a', say: "It was nothing, just a bunch of boxes, and they were all empty." },
      { by: 'c', say: "All of them?" },
      { by: 'a', say: "All of them." },
      { by: 'c', move: 'suspicious' },
      O('d', "That's so weird."),
      { by: 'a', conf: "I have an immunity totem in my pocket and I just told my team there was nothing there. I'm not proud. I'm safe." },
    ] },
  ],
  'twist.summit.back.totem-brag': [
    { id: 'nz.bb1', turns: [
      { by: 'b', say: "So what did you bring us?" },
      { by: 'a', say: "Me. I brought you me, safe, because I took the totem." },
      { by: 'c', move: 'angry' },
      { by: 'a', say: "Oh, come on. Any of you would have done the same thing." },
      { by: 'b', move: 'pushback' },
      O('d', "We've been sleeping in the rain for days!"),
      { by: 'c', conf: "{a} looked us right in the eye and bragged about it. I'll remember that at every vote from now on." },
    ] },
  ],
  'twist.summit.back.totem-cold': [
    { id: 'nz.bc1', turns: [
      { by: 'b', say: "You came back empty-handed?" },
      { by: 'a', say: "I took something for me. I'm not going to pretend I didn't." },
      { by: 'c', move: 'blame' },
      { by: 'a', move: 'dismiss' },
      { by: 'd', move: 'angry', opt: true },
      { by: 'b', conf: "{a} didn't even pretend to care. Honestly, that's worse than lying." },
    ] },
  ],
  'twist.summit.back.totem-slip': [
    { id: 'nz.bs1', turns: [
      { by: 'b', say: "What did you get? Be honest." },
      { by: 'a', say: "I... nothing. Okay, not nothing." },
      { by: 'c', say: "What does that mean?" },
      { by: 'a', say: "I took the totem. I'm sorry, I panicked." },
      { by: 'b', move: 'angry' },
      { by: 'a', move: 'apologize' },
      O('d', "Wow."),
      { by: 'a', conf: "I lasted about four minutes before I told them. I am the worst liar in the world." },
    ] },
  ],
};

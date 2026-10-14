// ══════════════════════════════════════════════════════════════════════
// td/story/lines/n-public.js — the people who saw it
// ══════════════════════════════════════════════════════════════════════
//
// director.js longScene: a fight or a blowup in front of camp, where only a and b spoke. a started
// it, b took it. c is the one nearby closer to b; d (may be missing) is closer to a.
//   public.react.defend   c steps in for b
//   public.react.excuse   c likes a and tries to smooth it over
//   public.react.awkward  c isn't on anybody's side and just wants it to stop
// Ids: 'npb.'.

export default {
  'public.react.defend': [
    // (more of them, read 2026-10-14: one or two versions aired in five or six episodes of one season)
    { id: 'npb.d3', when: { third: true }, turns: [
      { by: 'c', say: "Whoa, whoa. Where is this coming from, {a}?" },
      { by: 'a', say: "Stay out of it." },
      { by: 'c', say: "No. You don't get to talk to {b} like that and expect everybody to just sit here." },
      { by: 'c', conf: "{a} can be mad at me now. I'd rather that than watch {b} take it alone." },
    ] },
    { id: 'npb.d4', when: { third: true }, turns: [
      { by: 'c', say: "{a}, seriously? Back off." },
      { by: 'b', say: "It's fine, {c}." },
      { by: 'c', say: "It's not fine. Nobody gets to talk to you like that." },
      { by: 'b', conf: "I didn't ask {c} to step in. I'm really glad {c} did, though." },
    ] },
    { id: 'npb.d5', when: { third: true }, turns: [
      { beat: "{c} steps in between them." },
      { by: 'c', say: "Okay, that's enough. Both of you, go cool off." },
      { by: 'a', say: "I'm not the one who needs to cool off." },
      { by: 'c', say: "Then go anyway." },
      { by: 'c', conf: "Somebody had to break that up before it got worse, and apparently that somebody is me." },
    ] },
    { id: 'npb.d6', when: { third: true }, turns: [
      { by: 'c', say: "Leave {b} alone, {a}. You've made your point." },
      { by: 'a', say: "Have I?" },
      { by: 'c', say: "Everybody heard it. Trust me." },
      { by: 'c', conf: "I hate getting involved. But {a} was out of line, and everybody knew it." },
    ] },
    { id: 'npb.d1', turns: [
      { by: 'c', say: "Hey. That was really out of line, {a}.", v: { tough: "Say that to me, {a}. Go on.", warm: "{a}, come on, that was so mean.", dry: "Wow. Great, {a}. Really mature." } },
      { by: 'd', opt: true, say: "{c}, stay out of it." },
      { by: 'c', say: "No, I'm not staying out of it. {b} didn't do anything." },
      // (says only what c did: others in the scene may have spoken up too, read 2026-10-14)
      { by: 'c', conf: "I wasn't going to just sit there and let {a} talk to {b} like that. If that makes me a target, fine." },
    ] },
    { id: 'npb.d2', turns: [
      { beat: "{c} goes after {b} and sits down beside {b.obj}." },
      { by: 'c', say: "Hey. Don't let {a} get to you." },
      { by: 'b', say: "Too late." },
      { by: 'c', say: "Well, for what it's worth, I'm on your side." },
      { by: 'd', opt: true, conf: "{c} ran straight to {b}, and {a} saw it. That's two sides now, whether anybody wanted them or not." },
    ] },
  ],
  'public.react.excuse': [
    // (more of them, read 2026-10-14: one or two versions aired in five or six episodes of one season)
    { id: 'npb.e2', when: { third: true }, turns: [
      { by: 'c', say: "{a} didn't mean it like that. Right, {a}?" },
      { by: 'a', say: "...Sure." },
      { by: 'b', say: "That's not what it sounded like." },
      { by: 'c', say: "I know. Let's just leave it, okay?" },
      { by: 'c', conf: "I'm going to have a word with {a} later. Just not in front of everybody." },
    ] },
    { id: 'npb.e3', when: { third: true }, turns: [
      { by: 'c', say: "Everybody calm down. It's been a long day." },
      { by: 'b', say: "That doesn't make it okay." },
      { by: 'c', say: "I didn't say it was okay. I said it's been a long day." },
      { by: 'c', conf: "{a} is my friend, so I'm stuck sticking up for {a}, even when {a} makes it really hard." },
    ] },
    { id: 'npb.e4', when: { third: true }, turns: [
      { by: 'c', say: "Okay, can we not? {a} is just stressed." },
      { by: 'b', say: "We're all stressed." },
      { by: 'c', say: "I know. I'm stressed too. Can we just move on?" },
      { by: 'c', conf: "I covered for {a}, and I'm not sure {a} deserved it this time." },
    ] },
    { id: 'npb.e1', turns: [
      { by: 'c', say: "Okay, {a}'s just hungry and tired. We all are. Let's just drop it.", v: { anxious: "Okay, okay, everybody's tired, can we please, please just drop it?" } },
      { by: 'b', say: "That's not an excuse." },
      { by: 'c', say: "I know it isn't. I'm just trying to get through dinner." },
      { by: 'c', conf: "I like {a}, I do, but {a} makes it really hard to defend {a.obj} sometimes." },
    ] },
  ],
  'public.react.awkward': [
    // (more of them, read 2026-10-14: one or two versions aired in five or six episodes of one season)
    { id: 'npb.a3', when: { third: true }, turns: [
      { beat: "Everybody nearby suddenly gets very busy with something else." },
      { by: 'c', conf: "I picked up the same stick three times so I wouldn't have to look at either of them." },
    ] },
    { id: 'npb.a4', when: { third: true }, turns: [
      { by: 'c', say: "Should we... go?" },
      { by: 'd', opt: true, say: "We should definitely go." },
      { beat: "Nobody moves. Everybody wants to see how it ends." },
      { by: 'c', conf: "I said we should go. I did not go. I wanted to see how it ended." },
    ] },
    { id: 'npb.a1', turns: [
      { beat: "Nobody says anything. {c} suddenly finds the ground very interesting." },
      { by: 'c', say: "So... great weather today.", v: { dry: "Well. This is fun.", goofy: "Who wants to hear a joke? Nobody? Great, perfect timing." } },
      { by: 'd', opt: true, say: "Read the room, {c}." },
      { by: 'c', conf: "I'm not getting in the middle of {a} and {b}. That's how you end up with both of them mad at you." },
    ] },
    { id: 'npb.a2', turns: [
      { by: 'c', conf: "The whole camp heard that. Nobody's going to say anything to {a}'s face, but everybody's going to remember it at the vote." },
    ] },
  ],
};

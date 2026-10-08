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
    { id: 'npb.d1', turns: [
      { by: 'c', say: "Hey. That was really out of line, {a}.", v: { tough: "Say that to me, {a}. Go on.", warm: "{a}, come on, that was so mean.", dry: "Wow. Great, {a}. Really mature." } },
      { by: 'd', opt: true, say: "{c}, stay out of it." },
      { by: 'c', say: "No, I'm not staying out of it. {b} didn't do anything." },
      { by: 'c', conf: "Everybody sat there and let {a} say that to {b}, and I couldn't. If that makes me a target, fine." },
    ] },
    { id: 'npb.d2', turns: [
      { beat: "{c} goes after {b} and sits down beside {b.obj}." },
      { by: 'c', say: "Ignore {a}. Seriously, nobody thinks that about you." },
      { by: 'b', say: "{a} does." },
      { by: 'c', say: "{a} isn't everybody." },
      { by: 'd', opt: true, conf: "{c} ran straight to {b}, and {a} saw it. That's two sides now, whether anybody wanted them or not." },
    ] },
  ],
  'public.react.excuse': [
    { id: 'npb.e1', turns: [
      { by: 'c', say: "Okay, {a}'s just hungry and tired. We all are. Let's just drop it.", v: { anxious: "Okay, okay, everybody's tired, can we please, please just drop it?" } },
      { by: 'b', say: "That's not an excuse." },
      { by: 'c', say: "I know it isn't. I'm just trying to get through dinner." },
      { by: 'c', conf: "I like {a}, I do, but {a} makes it really hard to defend {a.obj} sometimes." },
    ] },
  ],
  'public.react.awkward': [
    { id: 'npb.a1', turns: [
      { beat: "Nobody says anything. {c} stares very hard at the food." },
      { by: 'c', say: "So... great weather today.", v: { dry: "Well. This is fun.", goofy: "Who wants to hear a joke? Nobody? Great, perfect timing." } },
      { by: 'd', opt: true, say: "Read the room, {c}." },
      { by: 'c', conf: "I'm not getting in the middle of {a} and {b}. That's how you end up with both of them mad at you." },
    ] },
    { id: 'npb.a2', turns: [
      { by: 'c', conf: "The whole camp heard that. Nobody's going to say anything to {a}'s face, but everybody's going to remember it at the vote." },
    ] },
  ],
};

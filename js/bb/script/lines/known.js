// ══════════════════════════════════════════════════════════════════════
// bb/script/lines/known.js — a power everybody knows about (Phase 6)
// ══════════════════════════════════════════════════════════════════════
//
// The words for bb-events/power-knowledge.js. a holds (or held) a public
// power; b reacts to it. {weeks} is how long it lasts ("two more weeks").
//
//   known.target   b wants a out before the power goes off             scene
//   known.wait     b would rather wait for it to expire                scene
//   known.flush    b wants to force a to use it; {target} is the bait   scene
//   known.spent    a used it; b still watches a for another one         scene

export default {
  'known.target.scene': [
    { id: 'gk.t1', turns: [{ by: 'b', dr: "{a} has a power, and everyone knows it. Every week {a} keeps it is a week it could go off." }] },
    { id: 'gk.t2', turns: [{ by: 'b', say: "We know {a} has it. That's the point. We can plan around it." }, { beat: 'A couple of people nod.' }] },
    { id: 'gk.t3', turns: [{ by: 'b', dr: "I'd rather use a nomination on {a} than spend the whole season wondering when that power lands." }] },
    { id: 'gk.t4', turns: [{ by: 'a', say: "I haven't even done anything." }, { by: 'b', say: "That's exactly why we should go now." }] },
    { id: 'gk.t5', turns: [{ by: 'a', dr: "Everyone knows I've got a power. It's put a huge target on my back." }] },
    { id: 'gk.t6', turns: [{ by: 'b', dr: "It's nothing personal against {a}. It's the power. But {a} will take it personally." }] },
  ],
  'known.wait.scene': [
    { id: 'gk.w1', turns: [{ by: 'b', dr: "{a}'s power runs out in {weeks}. Why waste a nomination? We just wait." }] },
    { id: 'gk.w2', turns: [{ by: 'b', say: "It expires. Everyone calm down." }, { by: 'a', dr: "{b} is right. I hate that {b} is right." }] },
    { id: 'gk.w3', turns: [{ by: 'b', dr: "Waiting it out only works if nobody panics for {weeks}. That's the hard part." }] },
    { id: 'gk.w4', turns: [{ by: 'a', dr: "{b} keeps counting down my power out loud. It's actually keeping me safe." }] },
    { id: 'gk.w5', turns: [{ by: 'b', say: "Don't touch {a}. The power dies on its own." }, { by: 'a', say: "Thanks. I think." }] },
    { id: 'gk.w6', turns: [{ by: 'b', dr: "Going after {a} costs us a week. Waiting costs nothing but patience." }] },
  ],
  'known.flush.scene': [
    { id: 'gk.f1', turns: [{ by: 'b', dr: "I don't want {a} gone this week. I want that power used up." }] },
    { id: 'gk.f2', turns: [{ by: 'b', dr: "Put {a} somewhere the only way out is to burn the power. Then next week, {a} is just like the rest of us." }] },
    { id: 'gk.f3', turns: [{ by: 'b', say: "We force it out of {a}." }, { beat: 'The idea sounds more like a plan every time {b} says it.' }] },
    { id: 'gk.f4', turns: [{ by: 'b', dr: "If we go after {target}, maybe {a} spends the power protecting {target}. Either way, it's gone." }] },
    { id: 'gk.f5', turns: [{ by: 'a', dr: "{b} wants me to waste my power. I can feel it. I'm not falling for it." }] },
    { id: 'gk.f6', turns: [{ by: 'b', say: "What would make you use it?" }, { by: 'a', say: "Wouldn't you like to know." }] },
  ],
  'known.spent.scene': [
    { id: 'gk.s1', turns: [{ by: 'b', dr: "{a} already used one power. Why would {a} only have one?" }] },
    { id: 'gk.s2', turns: [{ by: 'a', say: "I don't have anything else. I promise." }, { by: 'b', say: "That's what you'd say." }] },
    { id: 'gk.s3', turns: [{ by: 'b', dr: "I can't prove {a} has found something new. I can't stop thinking it, either." }] },
    { id: 'gk.s4', turns: [{ by: 'a', dr: "Using that power saved me for a week. Now everyone watches me like I've got another one." }] },
    { id: 'gk.s5', turns: [{ by: 'b', dr: "Once someone's had a power in here, you never fully trust that they're empty-handed." }] },
    { id: 'gk.s7', turns: [{ by: 'b', dr: "{a} keeps disappearing into the storage room. Last time {a} did that, {a} came out with a power." }] },
    { id: 'gk.s8', turns: [{ by: 'a', say: "Why do you keep looking at me like that?" }, { by: 'b', say: "Just wondering what you're hiding this time." }] },
    { id: 'gk.s9', turns: [{ by: 'a', dr: "I used my power. It's gone. Nobody believes me." }] },
    { id: 'gk.s10', turns: [{ by: 'b', dr: "{a} got lucky once. I'm not letting {a} get lucky twice without me noticing." }] },
    { id: 'gk.s11', turns: [{ by: 'b', say: "Turn out your pockets." }, { by: 'a', say: "Seriously?" }, { by: 'b', say: "Half seriously." }] },
    { id: 'gk.s12', turns: [{ by: 'a', dr: "Ever since I played that power, people stop talking when I walk in." }] },
    { id: 'gk.s6', turns: [{ by: 'b', say: "Found anything good lately?" }, { by: 'a', say: "No." }, { by: 'b', say: "Mm-hm." }] },
  ],
};

// pm/lines/answer.js — an opener from the old pools that ends on a question
// gets it answered before its ending (script.js sceneScript). `lastBy`: who
// asked it, so the answer comes from the other one. Data only.
//   answer-close  [a, b]  a short, honest answer
export const ANSWER = {
  'answer-close': [
    { id: "an.y.a1", when: { lastBy: "a", of: "yes" }, turns: [["b", "Yeah. I really do."]] },
    { id: "an.y.a2", when: { lastBy: "a", of: "yes" }, turns: [["b", "Yes. Obviously."], ["a", "Obviously?"], ["b", "Obviously."]] },
    { id: "an.y.a3", when: { lastBy: "a", of: "yes" }, turns: [["b", "More than I thought I would, if I'm honest."]] },
    { id: "an.y.a4", when: { lastBy: "a", of: "yes" }, turns: [["b", "I think so. I'd like to."]] },
    { id: "an.y.b1", when: { lastBy: "b", of: "yes" }, turns: [["a", "Yeah. I really do."]] },
    { id: "an.y.b2", when: { lastBy: "b", of: "yes" }, turns: [["a", "Yes. Obviously."], ["b", "Obviously?"], ["a", "Obviously."]] },
    { id: "an.y.b3", when: { lastBy: "b", of: "yes" }, turns: [["a", "More than I thought I would, if I'm honest."]] },
    { id: "an.y.b4", when: { lastBy: "b", of: "yes" }, turns: [["a", "I think so. I'd like to."]] },
    { id: "an.u.a1", when: { lastBy: "a", of: "unsure" }, turns: [["b", "I think so. Ask me again in a few days."]] },
    { id: "an.u.a2", when: { lastBy: "a", of: "unsure" }, turns: [["b", "I'm getting there."], ["a", "That's something."]] },
    { id: "an.u.b1", when: { lastBy: "b", of: "unsure" }, turns: [["a", "I think so. Ask me again in a few days."]] },
    { id: "an.u.b2", when: { lastBy: "b", of: "unsure" }, turns: [["a", "I'm getting there."], ["b", "That's something."]] },
    { id: "an.n.a1", when: { lastBy: "a", of: "no" }, turns: [["b", "Honestly? I'm not sure I do."], ["a", "Oh. Okay."]] },
    { id: "an.n.a2", when: { lastBy: "a", of: "no" }, turns: [["b", "I don't think so. Sorry."]] },
    { id: "an.n.b1", when: { lastBy: "b", of: "no" }, turns: [["a", "Honestly? I'm not sure I do."], ["b", "Oh. Okay."]] },
    { id: "an.n.b2", when: { lastBy: "b", of: "no" }, turns: [["a", "I don't think so. Sorry."]] },
    { id: "an.a.01", when: { lastBy: "a" }, turns: [["b", "Honestly? I don't know yet."]] },
    { id: "an.a.02", when: { lastBy: "a" }, turns: [["b", "…Can I think about that one?"], ["a", "Take your time."]] },
    { id: "an.a.03", when: { lastBy: "a" }, turns: [["b", "I'll tell you. Just not today."]] },
    { id: "an.b.01", when: { lastBy: "b" }, turns: [["a", "Honestly? I don't know yet."]] },
    { id: "an.b.02", when: { lastBy: "b" }, turns: [["a", "…Can I think about that one?"], ["b", "Take your time."]] },
    { id: "an.b.03", when: { lastBy: "b" }, turns: [["a", "I'll tell you. Just not today."]] },
  ],
};

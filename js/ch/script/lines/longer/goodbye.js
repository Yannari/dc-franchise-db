// ══════════════════════════════════════════════════════════════════════
// longer/goodbye.js — the Arena goodbye with nobody down from the stand, given room to land
// ══════════════════════════════════════════════════════════════════════
//
// The user, 2026-10-17: "the goodbyes are rather short, a little too short even" (the alone ones ran four to six
// lines while the song was still starting). a: the one going home; d: the winner, there at the gate when present;
// {target}: who a calls out on the way out (gb.a4). Every original turn once, in order.
export default {
  'gb.a1': [0,
    { by: 'd', opt: 1, say: "Good game, {a}." },
    { by: 'a', opt: 'd', say: "Yeah. Good game." },
    1,
    { by: 'tj', say: "Then take a second. Look around. You earned your spot in that Arena." },
    { by: 'a', say: "I know. It just doesn't feel like enough right now." },
    2, 3, 4],
  'gb.a2': [0, 1,
    { by: 'tj', say: "That's it? After everything?" },
    { by: 'a', say: "That's it. They know what they did. I don't need to say it out loud." },
    2,
    { beat: 'At the gate, {a} stops and looks back at the stand one last time.' },
    3,
    { by: 'a', conf: "I came here to prove something, and I'm leaving before I got the chance. That's the part I'll be thinking about on the plane." }],
  'gb.a3': [0, 1, 2, 3,
    { by: 'd', opt: 'd', say: "Deal." },
    { by: 'tj', say: "That's how you lose with class, people. Take notes." },
    4, 5],
  'gb.a4': [0, 1, 2,
    { by: 'a', say: "Ask {target} about it. I'm done talking." },
    3,
    { beat: '{a} walks out of the Arena without looking back.' },
    4],
  'gb.a5': [0, 1,
    { by: 'tj', say: "I believe you. Now get out of my Arena before you start kicking things." },
    { by: 'a', say: "I'm going. I'm not happy about it." },
    2, 3],
};

// A shared profile argues over a message before it is sent (spec §14.8).
// Data only. `face` and `brain` are the two people behind profile a — the one
// whose name and photos the profile shows, and the one running the strategy.
// They speak to each other in their own apartment; nobody outside hears it.
// `.faceWins`: the face's version is sent. `.brainWins`: the brain's is.
// The relationship between the two is never assumed (siblings, a parent and
// a child, a couple): only their names.
export const SHARED_LINES = {
  'shared.argue.faceWins': [
    { id: 'shared.argue.faceWins.01', stage: '{a.face} and {a.brain} lean over the same keyboard.', turns: [
      { by: 'brain', say: "Don't send that. You sound like you're nineteen." },
      { by: 'face', say: "It's my face on the profile. I'm sending it." },
    ], beat: '{a.brain} throws both hands up and sits back.' },
    { id: 'shared.argue.faceWins.02', stage: '{a.face} grabs the remote before {a.brain} can.', turns: [
      { by: 'face', say: "Trust me. People like fun. Fun wins." },
      { by: 'brain', say: "Fine. But when this blows up, it was you." },
    ] },
    { id: 'shared.argue.faceWins.03', turns: [
      { by: 'brain', say: "Can we at least take out the emoji?" },
      { by: 'face', say: "The emoji is the whole message." },
      { by: 'brain', say: "I'm not doing this with you." },
    ], beat: '{a.face} sends it anyway, grinning.' },
    { id: 'shared.argue.faceWins.04', stage: '{a.face} is already typing while {a.brain} is still talking.', turns: [
      { by: 'brain', say: "Wait, wait, wait. Read it back first." },
      { by: 'face', say: "Too late. It's gone." },
    ] },
    { id: 'shared.argue.faceWins.05', turns: [
      { by: 'face', say: "We've been careful all day. Let me have this one." },
      { by: 'brain', say: "One. You get one." },
    ] },
    { id: 'shared.argue.faceWins.06', when: { intent: 'flirt' }, stage: '{a.face} is smiling at the screen; {a.brain} is not.', turns: [
      { by: 'brain', say: "We are not flirting with the whole Circle." },
      { by: 'face', say: "Not the whole Circle. Just this one." },
    ], beat: '{a.brain} covers both eyes.' },
    { id: 'shared.argue.faceWins.07', when: { intent: 'flirt' }, turns: [
      { by: 'face', say: "Add a winky face." },
      { by: 'brain', say: "Absolutely not." },
      { by: 'face', say: "Circle, add a winky face." },
    ] },
  ],
  'shared.argue.brainWins': [
    { id: 'shared.argue.brainWins.01', stage: '{a.brain} has the notepad; {a.face} has the remote.', turns: [
      { by: 'face', say: "Just say hi. Keep it light." },
      { by: 'brain', say: "No. We say exactly this, word for word." },
    ], beat: '{a.face} rolls both eyes and reads it out anyway.' },
    { id: 'shared.argue.brainWins.02', turns: [
      { by: 'face', say: "That's so long. Nobody reads that much." },
      { by: 'brain', say: "They'll read it. And they'll remember who sent it." },
    ] },
    { id: 'shared.argue.brainWins.03', stage: '{a.face} and {a.brain} argue in whispers, as if the other apartments could hear.', turns: [
      { by: 'brain', say: "If we say that, they'll know it's two people." },
      { by: 'face', say: "Okay, okay. Your way." },
    ] },
    { id: 'shared.argue.brainWins.04', turns: [
      { by: 'face', say: "Can I at least put a heart on it?" },
      { by: 'brain', say: "No hearts. Hearts are how you get blocked." },
    ] },
    { id: 'shared.argue.brainWins.05', turns: [
      { by: 'brain', say: "Slow down. Every word matters in here." },
      { by: 'face', say: "Every word takes you twenty minutes." },
      { by: 'brain', say: "That's why we're still here." },
    ] },
    { id: 'shared.argue.brainWins.06', when: { intent: 'probe' }, stage: '{a.brain} taps the screen where the question will go.', turns: [
      { by: 'brain', say: "Ask about the hometown. A real person knows their hometown." },
      { by: 'face', say: "That's such a cop question." },
      { by: 'brain', say: "Good. Send it." },
    ] },
    { id: 'shared.argue.brainWins.07', when: { intent: 'pitch' }, turns: [
      { by: 'face', say: "Just ask them to put us first. Straight up." },
      { by: 'brain', say: "No. We make them think it was their idea." },
    ], beat: '{a.face} watches {a.brain} type, impressed and annoyed.' },
  ],
};

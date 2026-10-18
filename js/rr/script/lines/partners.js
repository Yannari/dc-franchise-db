// Family 1 of the catalogue: the partners (docs/ridonculous-race-scenes.md §1). a is the one the
// moment is about (the leader, for the moments a leader drives); b is the partner.
export default {
  // ── reading the tip ── (a reads; the ending says whether they got it)
  'tip-read.any': [
    { id: 'tr.1', turns: [
      { beat: '{a} rips the envelope open and reads it out loud.' },
      { by: 'a', say: "Okay. Okay, okay. I think I get it." },
      { by: 'b', say: "You think, or you get it?" },
      { by: 'a', say: "I get it. Come on." },
    ] },
    { id: 'tr.2', turns: [
      { by: 'b', say: "What does it say? What does it say?" },
      { by: 'a', say: "Let me read it. I can't read it with you breathing on it." },
      { by: 'b', say: "Read faster." },
      { by: 'a', say: "Got it. This way." },
    ] },
    { id: 'tr.3', turns: [
      { beat: '{a} reads the tip twice, lips moving.' },
      { by: 'b', say: "Well?" },
      { by: 'a', say: "It's not that bad. It's not good, but it's not that bad." },
      { by: 'b', say: "That's exactly what you said last time." },
    ] },
  ],
  'tip-read.puzzled': [
    { id: 'tr.p1', turns: [
      { by: 'a', say: "What does that even mean?" },
      { by: 'b', say: "Give it here." },
      { beat: '{b} takes the tip and squints at it.' },
      { by: 'b', say: "Yeah, no. I don't know either." },
    ] },
    { id: 'tr.p2', turns: [
      { by: 'a', say: "Read it again." },
      { by: 'b', say: "I've read it three times." },
      { by: 'a', say: "Then read it a fourth time, slower." },
    ] },
  ],
  'tip-read.misread': [
    { id: 'tr.m1', turns: [
      { by: 'a', say: "Easy. We go back to the dock." },
      { by: 'b', say: "Are you sure? I don't see the word dock anywhere." },
      { by: 'a', say: "Trust me. I know what it means." },
      { by: 'b', conf: "It did not say dock. I knew it did not say dock, and I followed {a} to the dock anyway." },
    ] },
    { id: 'tr.m2', turns: [
      { by: 'a', say: "It says to find the man in the red hat." },
      { by: 'b', say: "Where does it say red?" },
      { by: 'a', say: "Right there. Red." },
      { by: 'b', say: "That says 'ready'." },
    ] },
  ],
};

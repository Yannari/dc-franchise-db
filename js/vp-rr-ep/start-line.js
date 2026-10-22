// ══════════════════════════════════════════════════════════════════════
// vp-rr-ep/start-line.js — Don starts the race
// ══════════════════════════════════════════════════════════════════════
//
// The user, 2026-10-21: "a screen at the first leg where don start the race and we see in a wide shot all the teams
// playing and when he said idk GO or whatever they all start running". Leg one's opener is shot at the start line with
// every team on it (steps.js startLine); when the opener the leg drew doesn't end on the go, Don gives it here, and on
// that line the teams sprint off (stage.js exitAt). One a season, picked by the season's seed.
// Don's voice (feedback: upbeat, slick, short, whole sentences, the punchline last).
export const GO_LINES = [
  [{ beat: 'Don raises a starting pistol over his head.' }, { by: 'Don', say: 'Racers, on your marks. Get set. Go!' }],
  [{ beat: 'Don lifts an air horn and gives it one long blast.' }, { by: 'Don', say: "That's the start of the Ridonculous Race, so go!" }],
  [{ by: 'Don', say: "The clock starts the second I say go, and I'm saying it now. Go!" }],
  [{ beat: 'Don counts down on his fingers, and every team leans forward.' }, { by: 'Don', say: 'Three, two, one, go!' }],
  [{ by: 'Don', say: 'A million dollars is waiting at the end of this, so what are you all standing around for? Go!' }],
];

/** The go for a season: the steps it adds to the start line. */
export function goFor(seed) {
  const n = Math.abs(Math.round(Number(seed) || 0));
  // (the viewer's own words, like Don presenting the place: `viewer`, not a line the engine aired)
  return GO_LINES[n % GO_LINES.length].map(x => (x.by ? { by: 'Don', part: 'say', text: x.say, team: null, intel: {}, viewer: true } : { by: null, part: 'beat', text: x.beat, team: null, intel: {}, viewer: true }));
}

// the go: the line the teams run off on
export const GO = /\bgo\b/i;

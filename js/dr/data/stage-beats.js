// ══════════════════════════════════════════════════════════════════════
// dr/data/stage-beats.js — the main stage, beat by beat
// ══════════════════════════════════════════════════════════════════════
//
// ── WHY THIS IS A DIFFERENT SHAPE FROM werk-events.js ─────────────────
//
// The werk room is a POOL: scenes are drawn, some happen and most do not.
// The main stage is not. Every queen walks the runway, every queen on stage
// gets critiqued, the winner is always announced, somebody always goes home.
// These beats ALWAYS FIRE — what varies is which tier of line they use.
//
// So there is no eligibility here and nothing to draw. A beat family names the
// step it belongs to, whether it happens once or once per queen, and what
// decides the tier. The writer fills a pool per tier.
//
// Grounded in what the show actually does, checked rather than assumed:
// contestants present themed looks in a runway walk; the judges critique each
// contestant and then deliberate; the winner is told "condragulations"; the
// safe queens are dismissed to the back; the bottom two are told they are up
// for elimination and lip sync for their life; the eliminated queen writes a
// message on the werk room mirror in lipstick.
//
// ── FOR THE WRITER ────────────────────────────────────────────────────
//
// Fill the `lines` arrays. Change nothing else.
//
//   {a}  the queen this beat is about
//   {b}  the other queen — ONLY in a beat whose scope is 'pair'
//   {j}  the judge speaking — only where `speaker` is 'judge'
//
// Same rules as the werk room, all enforced by tests: no real people, this
// show's vocabulary only, never quote a stat by number, four variants minimum
// per tier, prose rather than captions.
//
// THE REGISTER IS DIFFERENT HERE. The werk room is intimate and funny; the
// main stage is performance and verdict. Judges are witty but land a real
// judgement. A queen receiving a critique is on camera and knows it. Keep the
// stage beats tighter and more declarative than the werk room's.

/** A tier of lines: what it is for, then the lines themselves. */
const tier = (id, note, lines = []) => ({ id, note, lines });

export const STAGE_BEATS = [
  // ══ THE MAIN STAGE OPENS ═════════════════════════════════════════════
  {
    id: 'entrance', step: 'main-stage', scope: 'once', speaker: 'host',
    note: 'The host opens the stage and names the runway category for the night.',
    tierBy: 'always',
    tiers: [
      tier('open', 'The stage opens and the category is announced.', [
        "The lights come up and the host is already standing there in full drag, which means the room is real now. \"The category is,\" she says, and the whole panel leans in, \"eleganza — and I mean it.\" Somewhere backstage twelve queens hear it and check their reflections one more time.",
        "Nobody has to be told to be quiet. The music drops out, the panel settles, and the host looks down the runway at an empty stage the way a person looks at a road they know something is coming down. \"Racers,\" she says. \"Start your engines.\"",
        "The panel is seated, the guest looks delighted to be there, and the host does the thing where she waits a beat too long on purpose. Then: the category, delivered like a dare. The first queen is already at the top of the runway with her shoulders back.",
        "It is the same words every week and it works every week. The stage is lit, the category is named, and the room changes temperature — because from this point on nothing that happened in the werk room counts for anything at all.",
      ]),
    ],
  },

  // ══ THE RUNWAY: ONE WALK PER QUEEN ═══════════════════════════════════
  {
    id: 'walk', step: 'runway', scope: 'per-queen', speaker: 'narrator',
    note: 'Her runway walk. One beat for every queen who walks, tiered by how the look landed.',
    tierBy: 'runway',
    tiers: [
      tier('stunning', 'A look that stops the panel. Top of the room.'),
      tier('strong', 'Genuinely good. She knows it and the walk shows it.'),
      tier('fine', 'It reads. Nothing more, nothing less.'),
      tier('weak', 'It does not work, and she can feel the panel not reacting.'),
      tier('disaster', 'It comes apart, literally or conceptually, in front of everybody.'),
    ],
  },
  {
    id: 'walk-fit', step: 'runway', scope: 'per-queen', speaker: 'narrator',
    note: 'A short note on whether the look actually answered the category. Fires only when the fit is notable either way.',
    tierBy: 'fit',
    tiers: [
      tier('on-theme', 'She understood the assignment exactly.'),
      tier('off-theme', 'A good look for a different night.'),
    ],
  },

  // ══ THE CRITIQUES: A JUDGE BEAT AND A REACTION, PER QUEEN ════════════
  {
    id: 'critique', step: 'critiques', scope: 'per-queen', speaker: 'judge',
    note: 'What a judge says to her, to her face. Tiered by where she actually placed.',
    tierBy: 'call',
    tiers: [
      tier('WIN', 'The judge is delighted and says so with a joke in it.'),
      tier('HIGH', 'Real praise with one small note attached.'),
      tier('SAFE', 'Brief. Pleasant. Forgettable, which is its own verdict.'),
      tier('LOW', 'Disappointed rather than angry. The worst kind.'),
      tier('BTM', 'A real critique, delivered kindly and landing hard.'),
    ],
  },
  {
    id: 'critique-reaction', step: 'critiques', scope: 'per-queen', speaker: 'narrator',
    note: 'How she takes it, standing there on the stage with the camera on her.',
    tierBy: 'reaction',
    tiers: [
      tier('joy', 'She cannot keep it off her face and does not try.'),
      tier('relief', 'She had prepared for worse and it shows.'),
      tier('idgaf', 'She takes it flat, and the flatness is the performance.'),
      tier('sadness', 'She holds it together for exactly as long as she has to.'),
      tier('crash-out', 'She does not hold it together.'),
    ],
  },
  {
    id: 'deliberation', step: 'critiques', scope: 'once', speaker: 'narrator',
    note: 'The queens are sent to the back and the panel argues about them. Fires once.',
    tierBy: 'split',
    tiers: [
      tier('agreed', 'The panel is of one mind and it does not take long.'),
      tier('split', 'The judges genuinely disagree, and it is close.'),
    ],
  },

  // ══ THE RESULTS ══════════════════════════════════════════════════════
  {
    id: 'result-win', step: 'results', scope: 'per-queen', speaker: 'host',
    note: 'The winner is told. The show has a word for this and uses it every time.',
    tierBy: 'always',
    tiers: [tier('win', 'Condragulations. She has won the week.')],
  },
  {
    id: 'result-safe', step: 'results', scope: 'once', speaker: 'host',
    note: 'The safe queens are dismissed to the back together, which is its own small humiliation.',
    tierBy: 'always',
    tiers: [tier('safe', 'You are safe. You may leave the stage.')],
  },
  {
    id: 'result-bottom', step: 'results', scope: 'per-queen', speaker: 'host',
    note: 'She is told she is up for elimination, one at a time.',
    tierBy: 'always',
    tiers: [tier('bottom', 'I am sorry, my dear. You are up for elimination.')],
  },

  // ══ THE LIP SYNC, BEAT BY BEAT ═══════════════════════════════════════
  {
    id: 'lipsync-intro', step: 'lipsync', scope: 'once', speaker: 'host',
    note: 'Two queens stand before the host. The last-chance speech and the song.',
    tierBy: 'always',
    tiers: [tier('intro', 'This is your last chance to impress me.')],
  },
  {
    id: 'lipsync-beat', step: 'lipsync', scope: 'per-queen', speaker: 'narrator',
    note: 'How she performs it. One beat per queen in the lip sync, tiered by her score.',
    tierBy: 'lipsync',
    tiers: [
      tier('legendary', 'A performance the season will be remembered for.'),
      tier('strong', 'She fights, and she is good at it.'),
      tier('trying', 'She is giving everything and it is not quite landing.'),
      tier('lost', 'She does not know the words and the room can tell.'),
    ],
  },
  {
    id: 'lipsync-stunt', step: 'lipsync', scope: 'per-queen', speaker: 'narrator',
    note: 'The stunt: the split, the reveal, the jump. Fires only when one is attempted.',
    tierBy: 'stunt',
    tiers: [
      tier('landed', 'She lands it and the room comes apart.'),
      tier('failed', 'She goes for it and it does not work.'),
    ],
  },
  {
    id: 'lipsync-call', step: 'lipsync', scope: 'once', speaker: 'host',
    note: 'The verdict. Shantay, sashay, or one of the rarer calls.',
    tierBy: 'call',
    tiers: [
      tier('shantay', 'One stays, one goes.'),
      tier('double-shantay', 'Both were too good to lose. Nobody goes home.'),
      tier('double-sashay', 'Both were bad enough that both go.'),
      tier('triple', 'Three of them fought and one of them loses.'),
    ],
  },

  // ══ THE EXIT ═════════════════════════════════════════════════════════
  {
    id: 'farewell', step: 'exit', scope: 'per-queen', speaker: 'narrator',
    note: 'What she says to the room on her way out.',
    tierBy: 'always',
    tiers: [tier('goodbye', 'The last thing she says to the queens still standing.')],
  },
  {
    id: 'mirror-message', step: 'exit', scope: 'per-queen', speaker: 'narrator',
    note: 'The lipstick message she leaves on the werk room mirror. A fixed ritual — it always happens.',
    tierBy: 'always',
    tiers: [tier('message', 'Written in lipstick, for whoever comes back in tomorrow.')],
  },
  {
    id: 'closing', step: 'exit', scope: 'once', speaker: 'host',
    note: 'The host closes the night on the queens who are left.',
    tierBy: 'always',
    tiers: [tier('close', 'If you cannot love yourself, how in the hell are you going to love somebody else?')],
  },
];

export const STAGE_IDS = STAGE_BEATS.map(b => b.id);

/** Every (beat, tier) pair still waiting on prose. */
export function unwrittenStageTiers() {
  const out = [];
  for (const b of STAGE_BEATS) {
    for (const t of b.tiers) {
      if (!t.lines || t.lines.length < 4) out.push(`${b.id}/${t.id}`);
    }
  }
  return out;
}

/** How many beats a stage of this shape produces, for the count guard. */
export function stageBeatCount({ walking = 0, onStage = 0, bottom = 0, exits = 0 }) {
  let n = 0;
  for (const b of STAGE_BEATS) {
    if (b.scope === 'once') { n += 1; continue; }
    if (b.step === 'runway') n += walking;
    else if (b.step === 'critiques') n += onStage;
    else if (b.step === 'lipsync') n += bottom;
    else if (b.step === 'exit') n += exits;
    else if (b.step === 'results') n += b.id === 'result-win' ? 1 : bottom;
  }
  return n;
}

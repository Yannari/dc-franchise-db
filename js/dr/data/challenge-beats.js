// ══════════════════════════════════════════════════════════════════════
// dr/data/challenge-beats.js — the announcement, the mini, the performance
// ══════════════════════════════════════════════════════════════════════
//
// The last four phases of the week that were still bare marker scenes: the
// host arriving to announce the challenge, the mini, the moment the room finds
// out how it is being divided, and the maxi performance itself.
//
// ── WHY THIS IS A SEPARATE FILE FROM stage-beats.js ───────────────────
//
// It is the same shape — always-fires beats with a tier chosen by the outcome,
// no eligibility and nothing drawn — and structurally the maxi performance
// belongs beside the runway walk. It is separate for a boring practical
// reason: stage-beats.js was out being written when this was added, and
// editing a file underneath somebody writing prose into it is how you lose an
// afternoon of their work to a merge. Two files, no collision.
//
// ── FOR THE WRITER ────────────────────────────────────────────────────
//
// Fill the `lines` arrays. Change nothing else.
//
//   {a}  the queen this beat is about
//   {c}  the challenge's name — only where `speaker` is 'host'
//
// Same rules as everywhere: no real people, this show's vocabulary only, never
// quote a stat by number, four genuinely different variants per tier, prose
// rather than captions.
//
// THE REGISTER. The host announcing a challenge is performing — big, arch,
// pleased with herself, and the queens are reacting in real time. The mini is
// fast and silly. The maxi performance is the one place the writing should
// take the queens' craft seriously: this is the thing they came to do.

const tier = (id, note, lines = []) => ({ id, note, lines });

export const CHALLENGE_BEATS = [
  // ══ THE HOST ARRIVES ═════════════════════════════════════════════════
  {
    id: 'host-arrives', step: 'maxi-announce', scope: 'once', speaker: 'host',
    note: 'The host walks into the werk room out of drag and the room stops what it is doing.',
    tierBy: 'always',
    tiers: [
      tier('arrival', 'She has news and is going to take her time with it.', [
        "The door goes and it is her, out of drag, in a suit that costs more than anybody's entire wardrobe, and thirteen queens stop mid-sentence like somebody hit a switch. She lets the silence run a second longer than it needs to. She always does. Then: \"Ladies.\"",
        "Nobody hears her come in. They just gradually notice, one at a time, that she is standing by the door watching them work with an expression of enormous private amusement. By the time the last queen clocks it, the room has gone from a workshop to an audience.",
        "\"Hello, hello, hello.\" Thirteen voices come back at once, ragged and delighted, and somebody at the back is already clapping for no reason at all. She waits for it to die down, which takes a while, because they know she is about to change the shape of their week.",
        "She comes in the way she always comes in — like the room was already hers and she has just been elsewhere for a while. Every queen straightens up without deciding to. Whatever anybody was arguing about ninety seconds ago is over.",
      ]),
    ],
  },
  {
    id: 'the-brief', step: 'maxi-announce', scope: 'once', speaker: 'host',
    note: 'She explains what the maxi challenge actually is, and names the runway category.',
    tierBy: 'always',
    tiers: [tier('brief', 'What they are doing this week, and what they are walking in.')],
  },
  {
    id: 'announce-reaction', step: 'maxi-announce', scope: 'per-queen', speaker: 'narrator',
    note: 'How the brief lands on her specifically. Fires for a few queens, not all.',
    tierBy: 'aptitude',
    tiers: [
      tier('delighted', 'This is her challenge and she cannot hide it.'),
      tier('braced', 'She can do this. She is not thrilled about it.'),
      tier('dreading', 'This is the week she was hoping would not come.'),
    ],
  },

  // ══ THE MINI ═════════════════════════════════════════════════════════
  {
    id: 'mini-announce', step: 'mini', scope: 'once', speaker: 'host',
    note: 'The mini is explained. Fast, silly, and worth something real.',
    tierBy: 'always',
    tiers: [tier('announce', 'A quick one, and what winning it buys.')],
  },
  {
    id: 'mini-attempt', step: 'mini', scope: 'per-queen', speaker: 'narrator',
    note: 'Her go at it. One beat per queen who attempts, tiered by how it went.',
    tierBy: 'mini',
    tiers: [
      tier('nailed', 'She is very good at this and everybody enjoys it.'),
      tier('decent', 'A solid effort that gets a laugh.'),
      tier('flat', 'It does not land and she knows before she has finished.'),
    ],
  },
  {
    id: 'mini-win', step: 'mini', scope: 'per-queen', speaker: 'host',
    note: 'The mini winner is named and told what she has won.',
    tierBy: 'always',
    tiers: [tier('win', 'She takes it, and the advantage that comes with it.')],
  },

  // ══ HOW THE ROOM IS DIVIDED ══════════════════════════════════════════
  {
    id: 'the-division', step: 'choice', scope: 'once', speaker: 'narrator',
    note: 'The room finds out how it is being split — teams, parts, characters, materials.',
    tierBy: 'assignment',
    tiers: [
      tier('draft', 'A pick order, and everybody can count.'),
      tier('captains', 'Two queens are handed the room and start choosing.'),
      tier('solo', 'Everybody is on their own this week.'),
    ],
  },
  {
    id: 'pick-reaction', step: 'choice', scope: 'per-queen', speaker: 'narrator',
    note: 'What she ends up with, and what her face does about it.',
    tierBy: 'pick',
    tiers: [
      tier('got-it', 'She got exactly what she wanted.'),
      tier('settled', 'Not her first choice. She is making it work.'),
      tier('left-over', 'She got what nobody else took.'),
      tier('picked-last', 'The room chose, and it chose her last.'),
    ],
  },

  // ══ THE PERFORMANCE ITSELF ═══════════════════════════════════════════
  {
    id: 'performance', step: 'maxi-perform', scope: 'per-queen', speaker: 'narrator',
    note: 'Her actual maxi challenge performance. One beat per queen, tiered by how she did. THIS IS THE THING THEY CAME TO DO — write it like it matters.',
    tierBy: 'perf',
    tiers: [
      tier('extraordinary', 'The performance the season is remembered for.'),
      tier('strong', 'She is good and she knows exactly how good.'),
      tier('competent', 'She does the job. Nothing catches fire.'),
      tier('struggling', 'It is not working and she is still in the middle of it.'),
      tier('collapse', 'It comes apart, on camera, with nowhere to go.'),
    ],
  },
  {
    id: 'performance-moment', step: 'maxi-perform', scope: 'per-queen', speaker: 'narrator',
    note: 'A single standout moment inside the performance. Fires only for a queen who had one.',
    tierBy: 'always',
    tiers: [tier('moment', 'The bit everybody will quote afterwards.')],
  },
];

export const CHALLENGE_IDS = CHALLENGE_BEATS.map(b => b.id);

export function unwrittenChallengeTiers() {
  const out = [];
  for (const b of CHALLENGE_BEATS) {
    for (const t of b.tiers) if (!t.lines || t.lines.length < 4) out.push(`${b.id}/${t.id}`);
  }
  return out;
}

/** How many beats this file adds to a night of the given shape. */
export function challengeBeatCount({ living = 0, reacting = 3, moments = 1, hasMini = true }) {
  let n = 2; // host-arrives, the-brief
  n += reacting;
  if (hasMini) n += 1 + living + 1;
  n += 1 + living; // the division, and a pick reaction each
  n += living + moments;
  return n;
}

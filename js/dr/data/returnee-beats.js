// ══════════════════════════════════════════════════════════════════════
// js/dr/data/returnee-beats.js — a queen who was sent home comes back
// ══════════════════════════════════════════════════════════════════════
//
// ── WHAT THIS IS ──────────────────────────────────────────────────────
//
// The Returning Queen twist. Somebody the show already eliminated walks
// back through the werk room door and back into the competition, keeping
// the record she made before she left.
//
// It is a different beat from the Lalaparuza smackdown, which brings the
// whole eliminated cast back for ONE NIGHT and changes no placement. This
// one changes everything: she is competing again, the room is one bigger,
// and every queen still in it just got further from the crown.
//
// ── WHY THE ROOM DOES NOT SIMPLY CHEER ────────────────────────────────
//
// It is the thing to get right and the thing a lazy version gets wrong. A
// returning queen is genuinely good news for her friends and genuinely bad
// news for everybody's odds, and most queens in that room feel both at once
// and can only show one. Somebody is thrilled. Somebody is thrilled in
// public. Somebody does the arithmetic before she does the hug.
//
// And it is bad news in a specific way: every queen still there survived a
// night this one did not, and the show has just decided that did not count.
//
// ── THE SHAPE ─────────────────────────────────────────────────────────
//
// Four beats, in order: the door goes, she is in the room, the room reacts,
// and the host explains the rule. They run at the very top of the episode,
// before the cold open — the return is the first thing that happens.
//
// ── FOR THE WRITER ────────────────────────────────────────────────────
//
// FILL lines. CHANGE NOTHING ELSE — not an id, not a tier, not a note. Every
// id is named by js/dr/season.js; a renamed one silently stops being drawn.
// An empty lines array is safe: an unwritten tier emits no scene rather than
// an empty card, so the file can be filled a beat at a time.
//
// THE RULES, all enforced by existing tests:
//
//   · Placeholders are {a} and {b} only. {a} is always the returning queen.
//     {b} is another queen and only exists where the note says so. Never a
//     real name, never an invented queen name.
//   · SIX variants minimum per tier. Genuinely different — a different
//     angle, a different detail, a different register.
//   · Prose, not captions. Several full sentences. Close third person,
//     specific, unsentimental.
//   · NEVER state a cast size or a count of queens. No "the other five", no
//     "eight queens left". tests/dr-prose-counts.test.js fails the build on
//     this and a return is exactly the moment prose wants to count.
//   · Never say "the house", even meaning an auditorium. It is Big Brother's
//     central noun and a Drag Race transcript carrying it reads as the wrong
//     show. Say the room, the werk room, the seats, out front.
//   · This show's words only. Queens, the werk room, the main stage, the
//     panel, sashay, lip sync, maxi and mini challenge. Never a houseguest,
//     a camper, a tribe, a jury, an eviction or a vote — THERE IS NO VOTE IN
//     THIS SHOW. The panel ranks and the host decides.
//   · No backticks anywhere in this file. This repo has been broken four
//     times by one inside a template literal.

const tier = (id, note, lines = []) => ({ id, note, lines });

export const RETURNEE_BEATS = [
  // ══ THE DOOR ═════════════════════════════════════════════════════════
  {
    id: 'return-door', step: 'return', scope: 'once', speaker: 'narrator',
    note: 'The door goes and nobody in the room knows who is behind it. No {a} '
      + '— she is not named until the next beat, and naming her here throws '
      + 'away the only surprise this twist has.',
    writerNote: 'Write the SECOND BEFORE. The room is doing what it does at '
      + 'the top of an episode and then something happens that is not on the '
      + 'schedule — a door, a noise, a producer where a producer should not '
      + 'be. Nobody has worked it out yet and one or two of them have started '
      + 'to. Do not name her, do not hint at which one she is.',
    tiers: [tier('door', 'Something is happening that is not on the schedule.', [])],
  },

  // ══ SHE IS IN THE ROOM ═══════════════════════════════════════════════
  {
    id: 'return-walk', step: 'return', scope: 'once', speaker: 'narrator',
    note: '{a} is the returning queen, walking back in.',
    writerNote: 'She has had days or weeks at home and has built the look '
      + 'that says so. Write the walk and the first thing she says, which on '
      + 'this show is almost never modest. Three tiers by how she went out, '
      + 'because that is what she is walking back in against: the early boot '
      + 'nobody has seen since the premiere, the queen cut in the middle of '
      + 'her run, and the one who left last week and never unpacked.',
    tiers: [
      tier('early', 'She went out early and has been waiting a long time.', []),
      tier('mid', 'She was cut mid-run, with things unfinished.', []),
      tier('late', 'She left last week. It is barely cold.', []),
    ],
  },

  // ══ THE ROOM ═════════════════════════════════════════════════════════
  {
    id: 'return-room', step: 'return', scope: 'once', speaker: 'narrator',
    note: 'The room reacting. {a} is the returning queen, {b} is the queen '
      + 'who reaches her first.',
    writerNote: 'THE BEAT THE WHOLE TWIST TURNS ON, and the one a lazy '
      + 'version gets wrong by making the room simply happy. It is good news '
      + 'for her friends and bad news for everybody odds, and most of them '
      + 'feel both and can only show one. Somebody is thrilled. Somebody is '
      + 'thrilled in public. Somebody does the arithmetic before she does the '
      + 'hug. And it is bad news in a specific way: every queen still standing '
      + 'survived a night this one did not, and the show has just decided '
      + 'that did not count. At least two of the six should sit with that.',
    tiers: [tier('room', 'Delighted and appalled, often in the same person.', [])],
  },

  // ══ THE RULE ═════════════════════════════════════════════════════════
  {
    id: 'return-rule', step: 'return', scope: 'once', speaker: 'host',
    note: 'The host explains what is now true. {a} is the returning queen.',
    writerNote: 'He says the rule out loud, because a twist nobody states is '
      + 'a twist nobody can be angry about: she is back in the competition, '
      + 'she keeps the record she made before she left, and she starts from '
      + 'tonight. Warm and completely unapologetic — this is his show and he '
      + 'has just done something to it. One of these should acknowledge, '
      + 'without apologising, that the room has every right to be furious.',
    tiers: [tier('rule', 'Back in, record intact, starting tonight.', [])],
  },
];

export const RETURNEE_IDS = RETURNEE_BEATS.map(b => b.id);

/** A tier with no lines written — the gap check and the writer's to-do list. */
export function unwrittenReturneeTiers() {
  const out = [];
  for (const b of RETURNEE_BEATS) {
    for (const t of b.tiers || []) if (!t.lines?.length) out.push(`${b.id}/${t.id}`);
  }
  return out;
}

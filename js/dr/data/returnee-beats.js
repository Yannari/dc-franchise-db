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
    tiers: [tier('door', 'Something is happening that is not on the schedule.', [
      'The werk room is doing what it does between challenges — mirrors, music, somebody practising in the corner — and then the door opens at an hour when no door should open.',
      'Somebody knocks, which never happens on a scheduled day, and the nearest queen turns toward the sound before she has decided whether she wants to see what is behind it.',
      'The werk room goes quiet the way a room goes quiet when it has not been told to, and for a second nobody moves because the thing that just happened was not on any call sheet.',
      'A door, at an odd hour, with no warning and no explanation from a producer, and the room is already dividing into queens who are curious and queens who are doing math.',
      'The conversation stops mid-sentence because the door has opened and nobody in the room was expecting it to, and the silence that follows is the kind that means something is about to change.',
      'Something is wrong with the schedule — a sound from the hallway, a door that should be locked, a producer\'s face that does not match a normal day — and the room notices before it understands.',
    ])],
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
      tier('early', 'She went out early and has been waiting a long time.', [
        '{a} walks through the door looking like a queen the competition has never seen, because the one it sent home was raw, and the one standing here has had weeks to become somebody else.',
        'The room goes silent, because {a} left so early that half the queens still competing have never shared a stage with her, and the look she is wearing is not the look she left in.',
        '{a} comes through the door dressed for a war she was not supposed to be in, and the first thing she says — loud, unapologetic, aimed at the whole room — makes it clear she has been rehearsing this entrance since the night she was sent home.',
        '{a} walks back into the werk room as if she has been counting the days, which she has, and the look is polished in the way only a queen with nothing to do but prepare can be.',
        'Nobody has thought about {a} since the premiere, and she is walking through the door dressed to make them regret that, with an entrance look that says more than her entire first run did.',
        '{a} steps into the room looking like a different queen — better paint, stronger silhouette, weeks of anger turned into preparation — and the confidence coming off her is the confidence of somebody who has already been eliminated and has nothing left to lose.',
      ]),
      tier('mid', 'She was cut mid-run, with things unfinished.', [
        '{a} walks through the door mid-stride, as if she never left, wearing the look she should have walked her last runway in and carrying the energy of somebody who was not finished.',
        'The room recognises {a} immediately — she was here long enough to be missed and left recently enough to be remembered — and the look on her face says she has unfinished business with every queen still standing.',
        '{a} comes back looking like the queen the competition was building before it cut her short, and the first thing she does is scan the room to see who is still here and who she has already outlasted.',
        '{a} steps through the door and the room reacts the way it reacts to somebody it has already had a relationship with — she was part of this, she had alliances here, she had a trajectory, and the show interrupted it.',
        'The entrance look is deliberate and the walk is practiced and {a} is clearly the same queen who left, only sharpened — the edges that were forming when she was cut have been filed to a point.',
        '{a} walks in with the energy of somebody who was in the middle of something when she was sent home, and the first thing out of her mouth makes it clear she intends to pick up exactly where she left off.',
      ]),
      tier('late', 'She left last week. It is barely cold.', [
        '{a} walks back into the werk room and the mirror she used last week still has her lipstick on the edge of it, because she left so recently the room has not finished adjusting to her absence.',
        'The door opens and {a} is standing there in the same look she would have worn tonight if she had never left, because she has had days, not weeks, and the anger has not cooled.',
        '{a} comes back and it is almost disorienting — she was here so recently that the rhythm of the room has not changed, and now she is standing in it again as if the elimination was a clerical error.',
        'It has been days. {a} walked out of this room days ago and she is walking back into it wearing the look she packed for tonight, which she had already pulled from her suitcase before the call came.',
        '{a} steps through the door looking like somebody who has not slept since she left, because she has not, and the fury of a recent elimination is the only fuel she is running on.',
        'The room has barely rearranged itself — her station was cleared two days ago — and {a} is back, in the same emotional state she left in, except now she is dressed for it.',
      ]),
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
    tiers: [tier('room', 'Delighted and appalled, often in the same person.', [
      '{b} reaches {a} first and the hug is real, but behind it the werk room is splitting — half the queens are smiling because they love her and half are smiling because they are on camera, and the arithmetic is the same for both.',
      '{b} screams and grabs {a} and for a second it is genuine, unfiltered joy, and then the room catches up and every queen in it is doing the same quiet calculation about what one more competitor means for her odds.',
      'The room erupts and {b} is the first one there, pulling {a} into an embrace that is one part relief and one part dread, and behind the hug somebody is already thinking about how many lip syncs are left and whether the math still works.',
      '{b} grabs {a} and the reaction is real — she missed her, she is glad — but somewhere in the back of the werk room a queen who survived the night {a} did not is standing very still and wondering what it was for.',
      'The hug between {a} and {b} is genuine, and the applause is genuine, and the panic behind both of them is also genuine, because every queen in this room clawed her way through a night this one did not and the show has just decided that does not matter.',
      '{b} reaches {a} first and holds on, and the embrace buys the rest of the room a few seconds to decide what their faces are doing, because the feeling is complicated — she is glad {a} is here and furious that the competition just got harder, and both of those are true at the same time.',
    ])],
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
    tiers: [tier('rule', 'Back in, record intact, starting tonight.', [
      '{a} is back in the competition, the host says, keeping every win and every placement she earned before she left, and competing from tonight as if the elimination never happened.',
      'The host makes it official: {a} is competing again, her record stands, and the main stage tonight includes her. He does not apologise for the disruption, because it is his show and he does not have to.',
      '{a} is back, the host announces, and the room is welcome to feel however it feels about that — she keeps her track record, she competes tonight, and the competition just got bigger.',
      'The host looks at the room and says what everybody already knows: {a} is competing again, starting tonight, record intact, no asterisk. He says it warmly and without a trace of apology.',
      '{a} is back in it, the host says, as casually as if this were always the plan, and the record she built before she left is still hers — every high, every low, every placement the panel gave her.',
      'The host explains the rule plainly: {a} returns to the competition with everything she earned, competes from tonight forward, and the room can take as long as it needs to adjust to a playing field that just changed.',
    ])],
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

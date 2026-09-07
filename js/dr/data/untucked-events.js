// ══════════════════════════════════════════════════════════════════════
// dr/data/untucked-events.js — backstage, while the judges argue
// ══════════════════════════════════════════════════════════════════════
//
// ── WHAT UNTUCKED ACTUALLY IS ─────────────────────────────────────────
//
// Checked rather than assumed. It is the queens' conversations backstage
// DURING the judges' post-critique deliberation — so it happens in the gap
// between being critiqued and being told the result, and nobody in the room
// knows yet who is going home. That timing is the whole engine of it: every
// scene here is people who have just been judged and do not yet know the
// verdict. The show's own description is "the backstage bitchiness, the
// catfights, the struggles, the tears, and the secrets".
//
// It follows that the triggers are the critiques. A queen who was told she was
// safe is bored and stung; a queen who was thrown under the bus on the main
// stage has been waiting the whole walk back to say something; the two who are
// about to lip sync are sitting in the same room as each other.
//
// ── THE SHAPE ─────────────────────────────────────────────────────────
//
// A POOL, like the werk room and unlike the main stage: scenes are drawn, most
// do not happen. Same schema as js/dr/data/werk-events.js, with one addition —
// `phase`, because Untucked has an arc inside it: they come off the stage, it
// escalates, and then they are called back.
//
//   phase   'arrival' — straight off the stage, still in the look
//           'middle'  — the long wait, where the fights happen
//           'late'    — before they are called back
//
// ── FOR THE WRITER ────────────────────────────────────────────────────
//
// Fill `lines`. Change nothing else. Same rules as the werk room, all enforced
// by tests: {a} and {b} placeholders and never a name, no {b} in a solo event,
// no real people, this show's vocabulary only, never quote a stat by number,
// four genuinely different variants each, prose rather than captions.
//
// THE REGISTER IS THE WERK ROOM'S, TURNED UP. Same people, no cameras they are
// pretending not to see, a drink in hand, and a verdict coming. Sharper, more
// honest, more likely to go too far. This is where somebody says the thing they
// have been holding all week.
import { dragOf } from '../queen.js';

export const UNTUCKED_PHASES = ['arrival', 'middle', 'late'];

const ev = o => ({ cast: 'solo', weight: 1, arcs: [], lines: [], phase: 'middle', ...o });

const st = (p, k) => {
  const n = Number(p?.stats?.[k]);
  return Number.isFinite(n) ? n : 5;
};

export const UNTUCKED_EVENTS = [
  // ══ ARRIVAL: OFF THE STAGE, INTO THE ROOM ════════════════════════════
  ev({
    id: 'first-through-the-door', phase: 'arrival', cast: 'solo', weight: 2,
    note: 'She is first into the room and says the first thing, which sets the temperature for everybody after her.',
    when: f => true, effects: { pop: { a: 1 } },
    lines: [
      "{a} gets through the door first and does not wait for anybody else to be in the room before she starts. \"Well,\" she says, to nobody, to the ceiling, to the whole night. It is not clear yet whether she is about to cry or about to start something. The others file in behind her and find out at the same time she does.",
      "The door goes and it is {a}, still in the full look, walking like the shoes have personally wronged her. She drops onto the couch sideways, exhales for about four seconds, and says \"that was a lot.\" Everybody who comes in after her agrees before they have even sat down.",
      "{a} is in the room before the rest of them and she has already poured something. She holds it up as the others come in, not quite a toast, more of an acknowledgement that they all just survived the same thing. Somebody laughs. Somebody does not.",
      "She does not say anything at all, which from {a} is the loudest possible entrance. She sits, arranges the skirt, and looks at the door with an expression that says she has some things to get to and is waiting for the audience to assemble.",
    ],
  }),
  ev({
    id: 'still-shaking', phase: 'arrival', cast: 'solo', weight: 2,
    note: 'The adrenaline has not gone anywhere and she cannot sit still.',
    when: f => st(f.a, 'temperament') <= 6, effects: { pop: { a: 1 } },
  }),
  ev({
    id: 'pour-one-out', phase: 'arrival', cast: 'pair', weight: 2,
    note: 'One of them makes drinks for both and it is the first kind thing that has happened in an hour.',
    when: f => f.bond >= 0, effects: { bond: 1, pop: { a: 1 } },
  }),
  ev({
    id: 'out-of-the-shoes', phase: 'arrival', cast: 'pair', weight: 2,
    note: 'The look starts coming apart the second they sit down, and the conversation gets more honest with it.',
    when: f => true, effects: { bond: 0.5 },
  }),
  ev({
    id: 'what-did-she-mean', phase: 'arrival', cast: 'pair', weight: 2,
    note: 'They replay a specific thing a judge said and try to work out how bad it was.',
    when: f => true, effects: { bond: 0.5, pop: { a: 1 } },
  }),

  // ══ THE CRITIQUES, RELITIGATED ═══════════════════════════════════════
  ev({
    id: 'i-disagree', phase: 'middle', cast: 'solo', weight: 2,
    note: 'She does not accept the critique and says so, to a room that mostly agrees with the judges.',
    arcs: ['villain', 'frontrunner'], when: f => f.lastCall === 'LOW' || f.lastCall === 'BTM',
    effects: { pop: { a: -1 }, state: 'defiant' },
  }),
  ev({
    id: 'she-was-right', phase: 'middle', cast: 'solo', weight: 2,
    note: 'She agrees with the judges about herself, out loud, which nobody expects.',
    arcs: ['underdog', 'hero'], when: f => f.lastCall === 'LOW' || f.lastCall === 'BTM',
    effects: { pop: { a: 2 }, state: 'accepted' },
  }),
  ev({
    id: 'threw-me-under', phase: 'middle', cast: 'pair', weight: 3,
    note: '{a} confronts {b} for naming her on the main stage. This is the single most reliable Untucked fight.',
    arcs: ['relationship', 'villain'], when: f => f.namedOnStage,
    effects: { bond: -3, pop: { a: 1, b: -2 }, state: 'confronted' },
    lines: [
      "{a} does not sit down. \"You said my name up there.\" {b} starts to explain that it was not like that, and {a} lets her get about six words in before saying \"you said my name, in front of them, when they asked.\" The room has gone very quiet. Nobody is looking at their phone because nobody has one.",
      "It takes {a} four minutes to get to it and everybody in the room can feel it coming the entire time. When it lands it is not a shout. It is \"I would never have done that to you,\" said quite calmly, which is worse, and {b} does not have an answer that survives being said out loud.",
      "\"Can I ask you something?\" says {a}, in the voice that means it is not a question. {b} says sure. {a} asks her to repeat what she said on the stage. {b} repeats a much gentler version of it. {a} says \"that is not what you said,\" and the temperature in the room drops about ten degrees.",
      "{b} tries to get ahead of it — \"before you say anything\" — and {a} says \"no, you go ahead, finish it,\" and folds her arms. Whatever {b} had prepared on the walk backstage does not survive contact with {a} sitting there waiting for it.",
    ],
  }),
  ev({
    id: 'defends-herself', phase: 'middle', cast: 'pair', weight: 2,
    note: '{b} explains why she said it, and it is not a bad reason, which makes it worse.',
    when: f => f.namedOnStage, effects: { bond: 1, pop: { b: 1 } },
  }),
  ev({
    id: 'the-room-takes-sides', phase: 'middle', cast: 'pair', weight: 2,
    note: 'A third queen weighs in on somebody else\'s argument and now it is her argument too.',
    arcs: ['narrator'], when: f => f.bond <= 2 && f.tension,
    effects: { bond: -1.5, pop: { a: -1 } },
  }),
  ev({
    id: 'safe-and-invisible', phase: 'middle', cast: 'solo', weight: 2,
    note: 'She was called safe again and is realising that safe is not a compliment.',
    arcs: ['filler', 'weakness'], when: f => f.lastCall === 'SAFE',
    effects: { pop: { a: -1 }, state: 'restless' },
  }),
  ev({
    id: 'safe-and-relieved', phase: 'middle', cast: 'solo', weight: 2,
    note: 'She was safe and is perfectly happy about it, which some of the room finds infuriating.',
    when: f => f.lastCall === 'SAFE', effects: { pop: { a: 1 } },
  }),

  // ══ THE WINNER, AND HOW THAT LANDS ═══════════════════════════════════
  ev({
    id: 'congratulations-meant', phase: 'arrival', cast: 'pair', weight: 2,
    note: '{b} congratulates {a} on a strong night and absolutely means it.',
    arcs: ['hero'], when: f => (f.callA === 'WIN' || f.callA === 'HIGH') && f.bond >= 1,
    effects: { bond: 1.5, pop: { b: 1 } },
  }),
  ev({
    id: 'congratulations-not-meant', phase: 'arrival', cast: 'pair', weight: 2,
    note: 'Same words, said with a smile, and everybody hears what is underneath.',
    arcs: ['villain'], when: f => (f.callA === 'WIN' || f.callA === 'HIGH') && f.bond <= 0,
    effects: { bond: -1, pop: { b: -1 } },
  }),
  ev({
    id: 'winning-too-much', phase: 'middle', cast: 'pair', weight: 2,
    note: 'Somebody says out loud that {a} keeps winning, and it is not admiration.',
    arcs: ['frontrunner'], when: f => f.winsA >= 2,
    effects: { bond: -1, pop: { a: 1 } },
  }),
  ev({
    id: 'gracious-in-front', phase: 'middle', cast: 'solo', weight: 1,
    note: 'She had a great night and deliberately does not make the room about it.',
    arcs: ['hero', 'frontrunner'], when: f => f.lastCall === 'WIN' || f.lastCall === 'HIGH',
    effects: { pop: { a: 2 } },
  }),

  // ══ THE TWO WHO ARE ABOUT TO FIGHT ═══════════════════════════════════
  ev({
    id: 'sitting-with-it', phase: 'middle', cast: 'solo', weight: 3,
    note: 'She knows she is lip syncing and has gone somewhere else in her head.',
    when: f => f.inBottom, effects: { pop: { a: 1 }, state: 'bracing' },
  }),
  ev({
    id: 'both-of-us', phase: 'middle', cast: 'pair', weight: 3,
    note: 'The two who are about to lip sync against each other, being decent about it.',
    arcs: ['hero', 'relationship'], when: f => f.bothInBottom && f.bond >= 0,
    effects: { bond: 2, pop: { a: 1, b: 1 } },
  }),
  ev({
    id: 'not-going-easy', phase: 'middle', cast: 'pair', weight: 2,
    note: 'The two about to lip sync, being anything but decent about it.',
    arcs: ['villain', 'relationship'], when: f => f.bothInBottom && f.bond <= 0,
    effects: { bond: -2, pop: { a: -1 } },
  }),
  ev({
    id: 'i-know-the-song', phase: 'late', cast: 'solo', weight: 2,
    note: 'She finds out what the song is and either that is very good news or it is not.',
    arcs: ['performance'], when: f => f.inBottom, effects: { pop: { a: 1 } },
  }),
  ev({
    id: 'talk-me-through-it', phase: 'late', cast: 'pair', weight: 2,
    note: 'Somebody not in the bottom coaches somebody who is, minutes before she has to do it.',
    arcs: ['hero'], when: f => f.bInBottom && f.bond >= 2,
    effects: { bond: 2, pop: { a: 2 } },
  }),

  // ══ THE EMOTIONAL FLOOR ══════════════════════════════════════════════
  ev({
    id: 'it-all-arrives', phase: 'middle', cast: 'solo', weight: 2,
    note: 'She has been holding it since the stage and stops holding it.',
    arcs: ['narrator', 'representation'], when: f => st(f.a, 'temperament') <= 5,
    effects: { pop: { a: 2 }, state: 'fragile' },
  }),
  ev({
    id: 'somebody-sits-down', phase: 'middle', cast: 'pair', weight: 3,
    note: '{a} goes to {b} without being asked. The room lets them have it.',
    arcs: ['hero'], when: f => f.bond >= 0, effects: { bond: 2, pop: { a: 2 } },
  }),
  ev({
    id: 'why-im-here', phase: 'middle', cast: 'solo', weight: 2,
    note: 'She says what this actually means to her, and it is not about the crown.',
    arcs: ['representation', 'underdog'], when: f => true,
    effects: { pop: { a: 3 } },
  }),
  ev({
    id: 'someone-at-home', phase: 'middle', cast: 'solo', weight: 1,
    note: 'She talks about a person who is not in the room.',
    arcs: ['representation'], when: f => st(f.a, 'loyalty') >= 6,
    effects: { pop: { a: 3 } },
  }),
  ev({
    id: 'the-room-goes-soft', phase: 'middle', cast: 'pair', weight: 1,
    note: 'One honest thing turns the whole room from a fight into a group of people.',
    when: f => true, effects: { bond: 1.5, pop: { a: 1 } },
  }),

  // ══ TEETH ════════════════════════════════════════════════════════════
  ev({
    id: 'say-it-to-my-face', phase: 'middle', cast: 'pair', weight: 2,
    note: 'Something said in the werk room this week gets repeated back to her, verbatim.',
    arcs: ['villain', 'relationship'], when: f => f.bond <= -2,
    effects: { bond: -2.5, pop: { a: 1 } },
  }),
  ev({
    id: 'who-should-go', phase: 'middle', cast: 'pair', weight: 2,
    note: 'Somebody says out loud who she thinks deserves to go home, and that queen is in the room.',
    arcs: ['villain'], when: f => f.canScheme,
    effects: { bond: -2, pop: { a: -2 } },
  }),
  ev({
    id: 'the-read-lands', phase: 'middle', cast: 'pair', weight: 2,
    note: 'A joke that is genuinely funny and genuinely cruel, and the room cannot decide.',
    arcs: ['narrator', 'villain'], when: f => dragOf(f.a).comedy >= 7,
    effects: { bond: -1, pop: { a: 2 } },
  }),
  ev({
    id: 'told-to-stop', phase: 'middle', cast: 'pair', weight: 1,
    note: 'A third queen tells them both to stop, and one of them listens.',
    arcs: ['hero'], when: f => f.tension, effects: { bond: 1, pop: { a: 1 } },
  }),
  ev({
    id: 'walks-out', phase: 'middle', cast: 'solo', weight: 1,
    note: 'She leaves the room rather than say what she is about to say.',
    when: f => st(f.a, 'temperament') <= 4, effects: { pop: { a: 1 }, state: 'withdrew' },
  }),
  ev({
    id: 'the-apology', phase: 'late', cast: 'pair', weight: 2,
    note: 'Before they are called back, one of them fixes it.',
    arcs: ['hero', 'relationship'], when: f => f.bond <= -1,
    effects: { bond: 3, pop: { a: 2 }, state: 'mended' },
  }),
  ev({
    id: 'no-apology', phase: 'late', cast: 'pair', weight: 1,
    note: 'It is not fixed, and they are about to have to stand next to each other.',
    arcs: ['villain'], when: f => f.bond <= -4,
    effects: { bond: -1, state: 'frost' },
  }),

  // ══ CALLED BACK ══════════════════════════════════════════════════════
  ev({
    id: 'lipstick-check', phase: 'late', cast: 'pair', weight: 2,
    note: 'Everybody repairs their face at once, because they are going back out there.',
    when: f => true, effects: { bond: 0.5, pop: { a: 1 } },
  }),
  ev({
    id: 'called-back', phase: 'late', cast: 'solo', weight: 2,
    note: 'The call comes and the room changes back into competitors.',
    when: f => true, effects: { pop: { a: 1 }, state: 'sober' },
  }),
  ev({
    id: 'one-last-look', phase: 'late', cast: 'pair', weight: 1,
    note: 'Two queens catch each other in the mirror on the way out and neither says anything.',
    when: f => f.bond >= 2, effects: { bond: 1 },
  }),
  // ── FILLING THE LATE PHASE ───────────────────────────────────────────
  //
  // Added after the guard measured what was ELIGIBLE rather than what was
  // written: the run-up to being called back offered only two scenes on an
  // ordinary night, because almost everything late was gated on being in the
  // bottom. Every phase needs beats that can happen on any night at all.
  ev({
    id: 'the-waiting', phase: 'late', cast: 'solo', weight: 2,
    note: 'The deliberation is taking longer than usual and she is reading things into that.',
    when: f => true, effects: { pop: { a: 1 }, state: 'bracing' },
  }),
  ev({
    id: 'guessing-the-verdict', phase: 'late', cast: 'pair', weight: 2,
    note: 'They try to call it between them, and one of them is confidently wrong.',
    when: f => true, effects: { bond: 0.5, pop: { a: 1 } },
  }),
  ev({
    id: 'good-luck-out-there', phase: 'late', cast: 'pair', weight: 2,
    note: 'Whatever has happened in this room, they are about to go and stand together.',
    when: f => true, effects: { bond: 1 },
  }),
  ev({
    id: 'putting-the-face-back', phase: 'late', cast: 'solo', weight: 2,
    note: 'She has cried it off and has about ninety seconds to be somebody else.',
    when: f => true, effects: { pop: { a: 1 } },
  }),
  ev({
    id: 'last-word', phase: 'late', cast: 'pair', weight: 1,
    note: 'One of them gets the final line in on the way out of the room.',
    arcs: ['villain', 'narrator'], when: f => f.bond <= 2,
    effects: { bond: -1, pop: { a: 1 } },
  }),
];

export const UNTUCKED_IDS = UNTUCKED_EVENTS.map(e => e.id);

/** What is still unwritten, so the gap is visible rather than silent. */
export function unwrittenUntuckedEvents() {
  return UNTUCKED_EVENTS.filter(e => !e.lines || e.lines.length < 4).map(e => e.id);
}

// ══════════════════════════════════════════════════════════════════════
// dr/data/confessional-lines.js — the piece to camera
// ══════════════════════════════════════════════════════════════════════
//
// A confessional is not a scene in the room. It is one queen, alone, telling
// the camera what she thought of something that just happened in front of
// her — and it is the only place in this show where somebody says the true
// version out loud.
//
// ── IT REACTS. THAT IS THE WHOLE DESIGN ──────────────────────────────
//
// Every line here follows another scene and is about it. `{a}` is the queen
// talking; `{b}` is the other queen in the scene she is talking about. A line
// that would read the same with no scene in front of it is not a confessional,
// it is a thought, and this show already has somewhere to put thoughts.
//
// ── THE TWO AXES, AND ONLY TWO ───────────────────────────────────────
//
// STANCE   did she do it, was it done to her, or did she watch it happen
// HEAT     did the scene bring them together or push them apart
//
// Six tiers from that, plus `alone` for a confessional following a scene with
// nobody else in it. Archetype is DELIBERATELY not an axis: it decides who
// gets picked to speak (js/dr/confessional.js), never which pool she speaks
// from. A third axis would quadruple the writing and halve how often any one
// line is seen, which is how the drag voice pools got thin the first time.
//
// ── WHAT A CONFESSIONAL MAY AND MAY NOT DO ───────────────────────────
//
// It moves her EDIT and never a bond. She is alone with a camera and nobody
// in the room heard it, so a confessional that changed how two queens felt
// about each other would be a relationship the queens themselves cannot
// account for. `sign` on the tier says which way the edit goes: a generous
// read plays well, a shady one is better television and worse for her.
//
// ── UNWRITTEN, ALL OF IT ─────────────────────────────────────────────
//
// Every pool below is empty on purpose. An empty tier emits NO SCENE (see
// js/dr/confessional.js), so the feature is inert rather than broken until
// somebody fills it — which is the same contract the stage and challenge
// beats use. docs/PROSE-PROMPT-dr-confessionals.md is the brief.

/** A tier of lines: what it is for, which way the edit moves, then the lines. */
const tier = (id, note, sign, lines = []) => ({ id, note, sign, lines });

export const CONFESSIONAL_TIERS = [
  tier('did-warm', 'She did the generous thing and is watching herself do it.', +1, [
    '"I did not have to do that." {a} looks at the camera. "I did it because it was the right thing to do and also because I am a good person and I would like that noted."',
    '"Look, if I help her and she does well, that is good for the room. If I help her and she still does badly — " {a} shrugs. "Then I tried, and everybody saw me try."',
    '"{b} needed it and I had it. That is the whole story." {a} pauses. "I am not saying I am a saint. I am saying I was right there and it cost me nothing."',
    '"Was that strategic? Girl, that was human. I saw somebody struggling and I helped. If that is strategy then I have been strategic my entire life and did not know it."',
    '"I could have walked past. I did not walk past." {a} adjusts her wig. "Write that down."',
    '"{b} looked like she was about to lose it and I just — I could not stand there and watch that happen. So yeah, I stepped in. Sue me for having a heart."',
  ]),
  tier('did-cold', 'She was the one who caused it, and the camera is the only '
    + 'place she will admit what she was doing.', -1, [
    '"Did I do that on purpose?" {a} looks at the camera. Long pause. "I am not going to answer that."',
    '"She was wide open. I saw the opening and I took it. That is not being mean, that is being aware." {a} half-smiles. "I said what I said."',
    '"I know what that looked like. It looked like exactly what it was." {a} leans back. "And I would do it again."',
    '"Was it shady? Yes. Did she deserve it? Also yes. Am I sorry?" {a} tilts her head. "I am going to let you sit with that one."',
    '"{b} thinks that just happened to her. Girl, that did not just happen to you. I have been planning that since Tuesday."',
    '"In the room I smiled. In here I am going to tell you the truth: I saw my shot and I took it and it landed exactly where I wanted it to land."',
  ]),
  tier('taken-warm', 'Somebody was good to her and she did not expect it.', +1, [
    '"{b} did not have to do that for me and she did it anyway." {a} blinks. "I am not crying. My lashes are heavy."',
    '"Nobody in this room has been that nice to me the entire time I have been here. And it was {b}, which — I did not see that coming."',
    '"She just — helped. No angle, no strategy, just helped." {a} shakes her head. "I forgot people do that."',
    '"{b} looked at my garment and instead of reading me she picked up a needle. That is the nicest thing anybody has done for me in this werkroom."',
    '"I have been in survival mode for three weeks and {b} just walked over and treated me like a person. I am going to remember that." {a} nods once.',
    '"She could have minded her business. She chose not to. And now I am in the confessional trying not to get emotional about somebody threading a needle for me."',
  ]),
  tier('taken-cold', 'It was done to her. She smiled in the room. She is not '
    + 'smiling here.', -1, [
    '"In the room I smiled. In here? No." {a} stares at the camera. "She knew what she was doing. We both know."',
    '"Girl, she is not going to see me upset. She is NOT. But am I upset? Yes. Do I have to sit here and pretend? Also yes. And THAT is the worst part."',
    '"{b} looked me in my FACE and did that." {a} is very still. "In front of everybody. Okay."',
    '"Do not tell me that was an accident. DO NOT. I know what accidental looks like and that? That was not it."',
    '"What am I going to do, cry? On camera? About HER?" {a} shakes her head. "No ma\'am. No."',
    '"She did that to me. In the werkroom. With witnesses." {a} takes a breath. "Cool. I am going to handle this like a lady and then I am going to win."',
  ]),
  tier('watched-warm', 'She watched two of them get closer and has a view about '
    + 'what that costs her.', +1, [
    '"Good for them." {a} pauses. "No, I mean it. Good for them." Another pause. "But I am watching."',
    '"{b} and her are getting real close real fast. Cute. Also an alliance I am not in, so — noted."',
    '"Oh, they are bonding now. That is adorable." {a} counts on her fingers. "That is also two people who are not going to pick me. I can do math."',
    '"Did you see that little moment? The helping each other? Precious." {a} looks at the camera. "I am keeping score."',
    '"Oh, so we are best friends now? Love that for them. LOVE that." {a} nods slowly. "Also know exactly whose back they are going to have and it is not mine."',
    '"Happy for them. Genuinely." {a} nods. "Also paying attention, because happy-for-them and stupid are two different things."',
  ]),
  tier('watched-cold', 'She watched it go wrong from across the room and enjoyed '
    + 'it more than she should have.', -1, [
    '"I should not have enjoyed that as much as I did." {a} presses her lips together. "But I did."',
    '"Girl, I was ACROSS the room and I heard every word and I am not going to pretend I was not entertained, because I was."',
    '"That was messy. That was SO messy." {a} grins. "And I had nothing to do with it, which is the best part. I just got to watch."',
    '"I was sewing. Minding my business. And then THAT happened three stations away and my whole day got better."',
    '"{b} walked into that. I saw it coming from the other side of the werkroom and {b} walked right into it." {a} shakes her head. "Some people do not read the room."',
    '"Was I supposed to stop it? I was not involved. I was right there not being involved and having the best time."',
  ]),
  tier('alone', 'The scene had nobody else in it. She is talking about her own '
    + 'week, prompted by what she just did.', -1, [
    '"Four times. Unpicked this seam four times." {a} holds up the fabric. "At this point the seam is right and I am wrong."',
    '"Girl, it is Tuesday and nobody has said a word to me since breakfast. Not for sympathy — just facts. Facts are facts." {a} looks at the camera.',
    '"Looked at my garment and thought: who told you you could sew." {a} pauses. "Nobody told me that. I told myself that. And I was LYING."',
    '"This is the week." {a} looks down. "You just know. The challenge drops and something in your stomach goes: girl, this is it."',
    '"Talking to myself at my station. Out loud. To FABRIC." {a} shakes her head. "That is where we are. Week five and I am having a conversation with tulle."',
    '"Woke up and the first thought was not even about the challenge. It was: am I still here. And then: for how long." {a} takes a breath. "And then you get up because what else are you going to do."',
  ]),
];

export const CONFESSIONAL_IDS = CONFESSIONAL_TIERS.map(t => t.id);

export function confessionalTier(id) {
  return CONFESSIONAL_TIERS.find(t => t.id === id) || null;
}

/** Which pools are still empty — the backlog, reported rather than hidden. */
export function unwrittenConfessionalTiers() {
  return CONFESSIONAL_TIERS.filter(t => !t.lines.length).map(t => t.id);
}

/**
 * A tier with fewer than four variants repeats inside a single season, which
 * is the actual bug — four is the floor everywhere in this show's prose.
 */
export function thinConfessionalTiers() {
  return CONFESSIONAL_TIERS.filter(t => t.lines.length && t.lines.length < 4)
    .map(t => `${t.id} (${t.lines.length})`);
}

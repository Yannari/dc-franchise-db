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
    '"She did not ask. That is why I did it." {a} shrugs. "If she had asked I probably would have said no. But she was just standing there struggling and I am not a monster."',
    '"My mother would kill me if I walked past that." {a} adjusts her wig. "Some things are not about the competition."',
    '"Do I like {b}? That is a whole other conversation. But she needed a hand and I had two of them, so." {a} looks at the camera. "Keep it moving."',
    '"I looked over and she had that face. You know the one." {a} pauses. "I was not about to let somebody cry in the werkroom. Not today."',
    '"It cost me ten minutes. Ten minutes and she is going to remember that for the rest of the season." {a} tilts her head. "That is a good trade."',
    '"I have been the girl with no help and no idea what to do next. I know what that feels like." {a} nods. "So yeah. I helped."',
  ]),
  tier('did-cold', 'She was the one who caused it, and the camera is the only '
    + 'place she will admit what she was doing.', -1, [
    '"Did I do that on purpose?" {a} looks at the camera. Long pause. "I am not going to answer that."',
    '"She was wide open. I saw the opening and I took it. That is not being mean, that is being aware." {a} half-smiles. "I said what I said."',
    '"I know what that looked like. It looked like exactly what it was." {a} leans back. "And I would do it again."',
    '"Was it shady? Yes. Did she deserve it? Also yes. Am I sorry?" {a} tilts her head. "I am going to let you sit with that one."',
    '"{b} thinks that just happened to her. Girl, that did not just happen to you. I have been planning that since Tuesday."',
    '"In the room I smiled. In here I am going to tell you the truth: I saw my shot and I took it and it landed exactly where I wanted it to land."',
    '"I did not start it. I finished it." {a} looks at the camera. "There is a difference and I need people to understand the difference."',
    '"The thing about being smart is nobody catches you." {a} examines her nails. "They will figure it out eventually. Just not today."',
    '"Am I proud of it? No. Would I do it again?" {a} pauses. "Yes. Without thinking."',
    '"I smiled at her the entire time. The ENTIRE time." {a} leans forward. "That is the part that should worry people."',
    '"She thinks we are fine. We are not fine." {a} tilts her head. "But she does not need to know that yet."',
    '"Somebody was going to do it. I just made sure it was me and not somebody who would be sloppy about it." {a} shrugs. "Precision."',
  ]),
  tier('taken-warm', 'Somebody was good to her and she did not expect it.', +1, [
    '"{b} did not have to do that for me and she did it anyway." {a} blinks. "I am not crying. My lashes are heavy."',
    '"Nobody in this room has been that nice to me the entire time I have been here. And it was {b}, which — I did not see that coming."',
    '"She just — helped. No angle, no strategy, just helped." {a} shakes her head. "I forgot people do that."',
    '"{b} looked at my garment and instead of reading me she picked up a needle. That is the nicest thing anybody has done for me in this werkroom."',
    '"I have been in survival mode for three weeks and {b} just walked over and treated me like a person. I am going to remember that." {a} nods once.',
    '"She could have minded her business. She chose not to. And now I am in the confessional trying not to get emotional about somebody threading a needle for me."',
    '"I did not ask for help. She just showed up." {a} looks down. "I hate that it meant that much to me but it did."',
    '"Nobody has ever —" {a} stops. Starts over. "She was kind to me for no reason. That should not make me emotional but here we are."',
    '"I had my guard up. ALL the way up. And {b} just walked through it like it was not there." {a} blinks. "Rude. And also the nicest thing."',
    '"She looked at my work and she did not judge it. She just picked up where I left off and kept going." {a} nods slowly. "I am going to owe her one and I am fine with that."',
    '"I was so ready for her to read me. I had my face prepared." {a} pauses. "And she just was nice. I did not have a face ready for that."',
    '"You forget people can just be decent in here. And then somebody is and it hits you like a truck." {a} shakes her head. "I need a minute."',
  ]),
  tier('taken-cold', 'It was done to her. She smiled in the room. She is not '
    + 'smiling here.', -1, [
    '"In the room I smiled. In here? No." {a} stares at the camera. "She knew what she was doing. We both know."',
    '"Girl, she is not going to see me upset. She is NOT. But am I upset? Yes. Do I have to sit here and pretend? Also yes. And THAT is the worst part."',
    '"{b} looked me in my FACE and did that." {a} is very still. "In front of everybody. Okay."',
    '"Do not tell me that was an accident. DO NOT. I know what accidental looks like and that? That was not it."',
    '"What am I going to do, cry? On camera? About HER?" {a} shakes her head. "No ma\'am. No."',
    '"She did that to me. In the werkroom. With witnesses." {a} takes a breath. "Cool. I am going to handle this like a lady and then I am going to win."',
    '"I am smiling right now, right?" {a} touches her own face. "Good. Because underneath this I am LIVID."',
    '"The worst part is I trusted her. Not a lot. But enough." {a} stares at the camera. "That is done now."',
    '"I am not going to give her the satisfaction. She wants me upset? She is going to get NOTHING." {a} sits perfectly still. "I will deal with this on my own time."',
    '"I replayed it three times in my head and it gets worse every time." {a} shakes her head. "She meant to do that. Every part of it."',
    '"Everybody saw. The whole werkroom saw and I had to stand there and take it." {a} takes a breath. "Noted."',
    '"She smiled at me after. SMILED." {a} leans back. "I am going to remember that smile for a very long time."',
  ]),
  tier('watched-warm', 'She watched two of them get closer and has a view about '
    + 'what that costs her.', +1, [
    '"Good for them." {a} pauses. "No, I mean it. Good for them." Another pause. "But I am watching."',
    '"{b} and her are getting real close real fast. Cute. Also an alliance I am not in, so — noted."',
    '"Oh, they are bonding now. That is adorable." {a} counts on her fingers. "That is also two people who are not going to pick me. I can do math."',
    '"Did you see that little moment? The helping each other? Precious." {a} looks at the camera. "I am keeping score."',
    '"Oh, so we are best friends now? Love that for them. LOVE that." {a} nods slowly. "Also know exactly whose back they are going to have and it is not mine."',
    '"Happy for them. Genuinely." {a} nods. "Also paying attention, because happy-for-them and stupid are two different things."',
    '"I am not jealous. I am AWARE." {a} holds up a finger. "Those are two very different things and I need the record to show that."',
    '"They have their little thing now. That is fine." {a} counts on her fingers. "That is also two people I cannot trust to be objective about each other."',
    '"I saw it before they did. The way {b} keeps ending up next to her." {a} raises an eyebrow. "Girl, that is not an accident. And neither am I."',
    '"Adorable. Genuinely adorable." {a} nods. "Also a problem for me personally but we do not need to get into that right now."',
    '"Oh they think I do not see it." {a} smiles. "I see EVERYTHING in this werkroom. I just do not always say it."',
    '"If they want to be best friends, fine. But best friends pick each other and I need somebody to pick ME." {a} looks at the camera. "So I am doing the math."',
  ]),
  tier('watched-cold', 'She watched it go wrong from across the room and enjoyed '
    + 'it more than she should have.', -1, [
    '"I should not have enjoyed that as much as I did." {a} presses her lips together. "But I did."',
    '"Girl, I was ACROSS the room and I heard every word and I am not going to pretend I was not entertained, because I was."',
    '"That was messy. That was SO messy." {a} grins. "And I had nothing to do with it, which is the best part. I just got to watch."',
    '"I was sewing. Minding my business. And then THAT happened three stations away and my whole day got better."',
    '"{b} walked into that. I saw it coming from the other side of the werkroom and {b} walked right into it." {a} shakes her head. "Some people do not read the room."',
    '"Was I supposed to stop it? I was not involved. I was right there not being involved and having the best time."',
    '"I tried to look away. I really did." {a} pauses. "I did not try very hard."',
    '"You could FEEL it go wrong. From across the room. The air changed." {a} presses her lips together. "Delicious."',
    '"I looked at the girl next to me and she looked at me and we both knew: do not get involved." {a} nods. "Best decision I made all week."',
    '"She had it coming. I am sorry but she had it COMING." {a} puts her hands up. "I did not say a word. I just watched."',
    '"I pretended to be busy. I was not busy. I was FASCINATED." {a} grins. "That was the most entertainment I have had since I got here."',
    '"Somebody should have stopped it." {a} pauses. "Not me. But somebody." {a} shrugs. "Nobody did."',
  ]),
  tier('alone', 'The scene had nobody else in it. She is talking about her own '
    + 'week, prompted by what she just did.', -1, [
    '"Four times. Unpicked this seam four times." {a} holds up the fabric. "At this point the seam is right and I am wrong."',
    '"Girl, it is Tuesday and nobody has said a word to me since breakfast. Not for sympathy — just facts. Facts are facts." {a} looks at the camera.',
    '"Looked at my garment and thought: who told you you could sew." {a} pauses. "Nobody told me that. I told myself that. And I was LYING."',
    '"This is the week." {a} looks down. "You just know. The challenge drops and something in your stomach goes: girl, this is it."',
    '"Talking to myself at my station. Out loud. To FABRIC." {a} shakes her head. "That is where we are. Week five and I am having a conversation with tulle."',
    '"Woke up and the first thought was not even about the challenge. It was: am I still here. And then: for how long." {a} takes a breath. "And then you get up because what else are you going to do."',
    '"I have been staring at this for forty-five minutes and it is not getting better." {a} puts down the fabric. "Which means I am making it worse. Which means I should stop. But I am not going to stop."',
    '"Quiet werkroom today. Too quiet." {a} looks around. "When nobody is talking that means everybody is confident and when everybody is confident I start worrying."',
    '"I practiced this in my hotel room. Forty times." {a} closes her eyes. "And right now I cannot remember a single word."',
    '"I keep looking at the clock. Why am I looking at the clock." {a} shakes her head. "More time just means more time to second-guess everything."',
    '"My garment is either the best thing I have made or the worst thing I have made and I genuinely cannot tell." {a} holds it up. "That should not be a mystery to the person who MADE it."',
    '"I walked in with a plan. A good plan. A GREAT plan." {a} pauses. "That plan died about an hour ago and now I am improvising."',
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

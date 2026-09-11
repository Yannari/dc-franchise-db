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

  /* ══ THE STAGED SURFACES ════════════════════════════════════════════
     The room's scenes are two queens and a bond. These four are not: a
     runway walk, a lip sync, a pick at the draft and a moment in the
     challenge are all ONE queen and a RESULT, so stance and heat are the
     wrong two questions and `did/taken/watched` has nothing to attach to.

     The axis here is `mine` or `hers` by `landed` or `missed`. The outcome
     is read from the scene's own number — `score` on a walk and a song,
     `perf` in the challenge, whether she lost the pick at the draft —
     against the median of that step, so it is the queen's standing on the
     night rather than a threshold somebody guessed.

     `{b}` EXISTS ONLY IN THE `hers` TIERS. A `mine` confessional is about
     her own walk and has nobody else in it, exactly like `alone` above.

     The surface supplies the vocabulary and that is why these are not one
     shared pool of four: "I thought the look was going to read" and "I
     watched her fight for her life" are not the same sentence with a noun
     swapped. Sixteen tiers, and each of them says something the other
     fifteen cannot.
     ═══════════════════════════════════════════════════════════════════ */
  tier('runway-mine-landed', 'It went well and it was hers: the look she walked.', +1, [
    '"I knew when I stepped out. The room went quiet. Not bad quiet — the kind where they are looking." {a} adjusts her collar. "That is the quiet I came here for."',
    '"I made this in two days. TWO DAYS." {a} runs her hand down the fabric. "And it looks like it took a month. That is called talent."',
    '"I felt it the second I hit the mark. Everything sat right, everything moved right." {a} looks at the camera. "Some nights you just know."',
    '"The category asked and I answered. Loudly." {a} turns slightly. "I did not come here to be safe. I came here to be remembered."',
    '"I saw their faces from the end of the runway. Every single one of them looking." {a} smiles. "Good."',
    '"This look is doing exactly what I told it to do." {a} pauses. "Which is rare, because usually my garments have their own plans."',
  ]),
  tier('runway-mine-missed', 'It did not go well and it was hers: the look she walked.', -1, [
    '"I knew on the walk out. The fabric moved wrong and I could feel it and there was nothing I could do about it up there." {a} shakes her head.',
    '"It looked better in the werkroom. Everything looks better in the werkroom." {a} takes a breath. "Under those lights it looked like exactly what it was."',
    '"I spent sixteen hours on this and it is reading like I spent two." {a} looks at the camera. "That is the worst feeling. When the work does not show."',
    '"The category said one thing. My look said another. And I knew it before I hit the end of the runway." {a} closes her eyes.',
    '"I could see the panel. They were not writing." {a} pauses. "When they are not writing that means they have already decided."',
    '"Something shifted on the walk out. A seam, a hem, something. And after that I was not wearing a look, I was managing a situation." {a} shrugs. "On a runway. In front of judges."',
  ]),
  tier('runway-hers-landed', 'It went well for somebody else: a look she watched somebody else walk.', +1, [
    '"{b} walked out and I thought: well. That is a problem." {a} nods slowly. "That look is better than mine and now everybody knows it."',
    '"She turned the corner and the room stopped talking. Just stopped." {a} looks at the camera. "When they stop for hers, that is a warning."',
    '"{b} did THAT. On THIS runway." {a} shakes her head. "I am not mad. I am recalculating."',
    '"I was feeling good about my look. And then {b} walked out and I was feeling good about hers." {a} pauses. "Which is not the same thing."',
    '"Credit where credit is due, that look was correct." {a} adjusts her earring. "I hate it. But it was correct."',
    '"The panel leaned forward. They do not lean forward for everybody." {a} watches. "They did not lean forward for me."',
  ]),
  tier('runway-hers-missed', 'It went badly for somebody else: a look she watched somebody else walk.', -1, [
    '"I saw it from backstage and I thought: girl, no." {a} presses her lips together. "The concept was there. The execution left."',
    '"{b} walked out and I held my face VERY still because what I wanted to do was react and what I needed to do was not." {a} pauses. "That is the kind of look where you do not make eye contact after."',
    '"That look said one thing: I ran out of time. And the runway is not the place to find that out." {a} shakes her head. "She found out."',
    '"There was a moment at the turn where {b} knew. I could see it." {a} tilts her head. "The confidence left her body and it did not come back."',
    '"I am not going to say what everybody was thinking. I am just going to say everybody was thinking it." {a} looks at the camera. "Including the judges."',
    '"GIRL." {a} closes her eyes and opens them. "That was a choice. And choices have consequences and those consequences are about to happen."',
  ]),
  tier('lipsync-mine-landed', 'It went well and it was hers: the song she performed.', +1, [
    '"I left everything on that stage. Every lyric, every move, everything." {a} takes a breath. "Whatever happens, nobody can say I did not fight."',
    '"Something took over. I do not even remember all of it." {a} wipes her forehead. "I just remember thinking: you are NOT going home tonight."',
    '"I hit the first beat and my body decided we were staying. My brain caught up around the chorus." {a} nods. "That is the best I have ever performed."',
    '"I looked at the host and the host was watching me. Not both of us. Me." {a} pauses. "That is how you know."',
    '"Halfway through I stopped being scared and started being angry and angry is better." {a} looks at the camera. "Angry knows every word."',
    '"I felt it land. You can feel it when the room picks a side." {a} exhales. "They picked mine."',
  ]),
  tier('lipsync-mine-missed', 'It did not go well and it was hers: the song she performed.', -1, [
    '"I blanked. Right in the middle of the chorus I just — went blank." {a} shakes her head. "You cannot get it back once it leaves."',
    '"My body was there. My mind was somewhere else the entire time." {a} takes a breath. "I could feel myself losing it and I could not stop it."',
    '"I knew the words. I KNEW the words. And then the music started and I did not know them anymore." {a} stares. "That is the worst part."',
    '"She was giving everything and I was giving — " {a} pauses long. "Not everything. And everybody could see the difference."',
    '"I stopped looking at the host halfway through. When you stop looking it is because you already know what you are going to see." {a} looks down.',
    '"I tried. I need that on record. I tried." {a} sits very still. "It was not enough."',
  ]),
  tier('lipsync-hers-landed', 'It went well for somebody else: a song she watched two of them fight over.', +1, [
    '"{b} went up there and I thought: she is staying. Before the first chorus I thought: she is staying." {a} nods. "I hate when you know that early."',
    '"I was in the back doing math. If she stays, if she goes. And then she started performing and the math was done." {a} looks at the camera. "She was undeniable."',
    '"{b} hit a move halfway through and the girl next to me grabbed my arm." {a} pauses. "That is when you know somebody just changed the conversation."',
    '"She fought for her LIFE up there." {a} shakes her head. "And the worst part is it was impressive. I wanted to root against her and I could not."',
    '"I have never seen {b} perform like that. She pulled something out that I did not know she had." {a} raises an eyebrow. "Now I have to account for that."',
    '"The room knew before the song was over." {a} nods slowly. "Including me and I did not want to know."',
  ]),
  tier('lipsync-hers-missed', 'It went badly for somebody else: a song she watched two of them fight over.', -1, [
    '"I watched {b} forget the words and I looked at the floor because I did not want anybody to see my face." {a} pauses. "My face was not appropriate."',
    '"She went up there without the song and it showed." {a} shakes her head. "You could feel the stage get smaller every verse."',
    '"{b} stopped performing and started surviving about thirty seconds in." {a} presses her lips together. "Those are two different things and the judges know the difference."',
    '"I was in the back watching and the girl next to me whispered: oh no." {a} nods. "Yeah. Oh no."',
    '"I have been up there. I know what it feels like to lose it in front of everybody." {a} pauses. "I also know what it looks like from back here, and it looks worse."',
    '"She tried. I will give her that." {a} tilts her head. "That is the most generous thing I can say about what just happened."',
  ]),
  tier('choice-mine-landed', 'It went well and it was hers: the slot or partner she got.', +1, [
    '"I got what I wanted. That does not happen in here." {a} nods. "I am holding this with both hands and not looking grateful because grateful looks weak."',
    '"The second that slot was open I took it. Did not hesitate." {a} looks at the camera. "Thinking is how you lose the good ones."',
    '"This is the one I wanted. And nobody else saw what I saw in it." {a} smiles. "Good."',
    '"I have a plan now. An actual plan. That slot and my plan are the same thing and nobody else knows that yet." {a} claps once.',
    '"She picked before me and she did not take it. She did NOT take it." {a} exhales. "I have never been so relieved and so quiet about it at the same time."',
    '"Everybody wants the flashy pick. I wanted the smart one." {a} nods. "And I got it. And nobody is worried about me. That is exactly where I want to be."',
  ]),
  tier('choice-mine-missed', 'It did not go well and it was hers: the slot or partner she got.', -1, [
    '"I got what was left. And what was left was — " {a} looks at the camera. "— what was left."',
    '"Every slot I wanted walked out the door before my name was called." {a} takes a breath. "This one is fine. I will make it fine."',
    '"Nobody wanted this one. Including me." {a} holds it up. "But here we are and I do not have a choice so I am going to make it work."',
    '"I had a top three. A top THREE. And all three of them went." {a} closes her eyes. "So now I am working with my fourth choice and pretending I am excited."',
    '"The pick order is a ranking. Nobody says it but everybody knows it." {a} shrugs. "I know where I stand."',
    '"I am smiling. This is my excited face." {a} is not smiling. "Thrilled."',
  ]),
  tier('choice-hers-landed', 'It went well for somebody else: a pick she watched somebody else take.', +1, [
    '"{b} took it. Right in front of me. And I smiled because that is what you do." {a} looks at the camera. "I am still smiling. See?"',
    '"I wanted that slot. I WANTED it. And {b} walked up and took it like it was hers." {a} nods. "Maybe it was. I am going to be upset about it quietly."',
    '"She did not even hesitate. Just picked it up and walked away." {a} watches. "I had a whole plan built around that slot."',
    '"{b} got the one everybody wanted and acted like it was nothing." {a} raises an eyebrow. "It was not nothing. She knows it was not nothing."',
    '"I watched {b} take that pick and my entire strategy for the week died on the spot." {a} shrugs. "New strategy."',
    '"Good for her." {a} pauses too long. "Genuinely. Good for her."',
  ]),
  tier('choice-hers-missed', 'It went badly for somebody else: a pick she watched somebody else take.', -1, [
    '"{b} got the last pick and her face — " {a} presses her lips together. "I am not going to describe her face because I am a lady."',
    '"I watched her pick up what was left and try to look happy about it." {a} tilts her head. "She was not happy about it. Nobody would be."',
    '"{b} got the scraps and she knows it and I know it and now we are all going to pretend." {a} nods. "Fun show."',
    '"She reached for it like she chose it. Girl, you did not choose it. It chose you by being the only thing left." {a} shrugs.',
    '"The order told the whole story. {b} was last." {a} pauses. "And last is last."',
    '"I felt bad for about three seconds and then I remembered where I am." {a} looks at the camera. "Three seconds is generous in this room."',
  ]),
  tier('maxipre-mine-landed', 'It went well and it was hers: the moment she had in the challenge.', +1, [
    '"I felt the room. They were WITH me." {a} exhales. "When the room is with you, you know. You just know."',
    '"It landed. I knew it landed because nobody moved." {a} looks at the camera. "When they are still it means they are watching and when they are watching it means it worked."',
    '"I took a risk. A big one. And it paid off and I could feel it pay off in real time." {a} nods. "That is the high. That is why you do this."',
    '"I did the thing I came here to do. On this stage, in this challenge, in front of those judges." {a} pauses. "Everything after this is extra."',
    '"Something clicked halfway through. And after that I was not thinking anymore. I was just in it." {a} snaps. "THAT is performing."',
    '"I have been waiting for that moment since I got here." {a} nods once. "And it went exactly the way I rehearsed it in my head."',
  ]),
  tier('maxipre-mine-missed', 'It did not go well and it was hers: the moment she had in the challenge.', -1, [
    '"It died. I could feel it die." {a} shakes her head. "The room was quiet and it was not the good kind of quiet."',
    '"I had it. I HAD it. And then somewhere in the middle it left and I was standing there with nothing." {a} stares. "In front of judges. With nothing."',
    '"The silence after was the loudest thing I have ever heard." {a} takes a breath. "Nobody laughed. Nobody reacted. They just waited for it to be over."',
    '"I knew it was not working and I kept going because what else do you do." {a} looks down. "You cannot stop mid-challenge and say: I know this is bad."',
    '"I saw the other girls\' faces. They were being kind about it." {a} pauses. "That is how you know. When they are kind."',
    '"I prepared for this. HOURS. And it did not matter because whatever I prepared is not what came out of my mouth." {a} closes her eyes.',
  ]),
  tier('maxipre-hers-landed', 'It went well for somebody else: a moment she watched somebody else have.', +1, [
    '"{b} had her moment and it was good and I am sitting here trying to figure out how to follow that." {a} looks at the camera. "Because I am next."',
    '"She did THAT. In the challenge. In front of everybody." {a} nods slowly. "I was not worried before. I am worried now."',
    '"{b} went up and delivered and now the bar is WHERE she left it." {a} gestures high. "Which is a problem for the rest of us."',
    '"I watched her and I thought: I cannot do what she just did. I can do something else. But I cannot do THAT." {a} pauses.',
    '"The judges were writing. Fast." {a} watches. "They write fast when they have something good to say. They were not writing that fast for me."',
    '"{b} found something in that challenge that the rest of us did not." {a} shakes her head. "And she knows it. You can see it in how she is standing."',
  ]),
  tier('maxipre-hers-missed', 'It went badly for somebody else: a moment she watched somebody else have.', -1, [
    '"I watched it happen and it was — " {a} inhales. "It was not good. I am going to leave it at that."',
    '"{b} lost the room. You could feel the exact second it went." {a} tilts her head. "And she kept going, which — brave. But also painful."',
    '"The joke did not land. And then the next one did not land. And then she stopped trying to be funny and started trying to survive." {a} nods. "Different energy."',
    '"I looked at the judges and one of them put down her pen." {a} pauses. "When they stop writing that is not a good sign for the person on stage."',
    '"{b} went up there with confidence and came back with questions." {a} presses her lips together. "That challenge did something to her."',
    '"She committed. I will say that. She committed to a choice and the choice was wrong but she COMMITTED." {a} shrugs. "Commitment is only a virtue when the thing is good."',
  ]),
];

export const CONFESSIONAL_IDS = CONFESSIONAL_TIERS.map(t => t.id);

/** The four surfaces whose scenes are one queen and a result, not a bond. */
export const STAGED_SURFACES = ['runway', 'lipsync', 'choice', 'maxipre'];

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

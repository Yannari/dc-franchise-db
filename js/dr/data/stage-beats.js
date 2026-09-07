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
      tier('stunning', 'A look that stops the panel. Top of the room.', [
        "{a} turns the corner and the panel goes quiet in the way that means something is working. The look is finished from the wig to the heel and the walk knows it — long strides, perfect timing, a turn at the end of the runway that lets every angle land. One of the judges leans forward. Nobody writes anything down. They are watching.",
        "The look arrives before {a} does. Whatever she built, she built it to be seen from the back of a theatre, and on this stage it fills the room. The silhouette, the movement, the way the fabric catches light — all of it says she understood the category and then went past it into something the category did not know it was asking for.",
        "{a} walks out and one of the judges puts a hand over their mouth. The look is not just good — it is specific, and the specificity is what separates it from everything else tonight. Every choice reads as a choice. The heel matches the era, the earring matches the neckline, and the walk matches all of it.",
        "There is a version of this runway where {a} walks out and gets polite nods. This is not that version. She comes around the corner and the look is so fully realised that the room stops being a panel and starts being an audience, and the difference is that an audience forgets to take notes.",
      ]),
      tier('strong', 'Genuinely good. She knows it and the walk shows it.', [
        "{a} walks out with the kind of confidence that comes from having checked the mirror one last time and liked what she saw. The look is clean, the proportions are right, and the walk has intention in it. She is not reinventing anything tonight but she is doing it well and the panel can see that.",
        "A solid walk from {a} — good posture, good timing, and a look that does exactly what it set out to do. She hits the end of the runway, pauses, turns, and walks back with the expression of somebody who knows she did not just embarrass herself. The judges nod. A nod is not a gasp, but a nod after twelve queens is worth something.",
        "{a} comes out in something that works. The fit is right, the accessories are deliberate, and the walk has rhythm to it. It is not the look that stops the panel in its tracks, but it is the look that a judge remembers when they are arguing about who was safe and who was high, and that distinction matters.",
        "The look is good. {a} knows it is good. She walks with the kind of ease that only exists when you are not worried about something falling off or riding up, and the panel reads that ease as authority. She does not need the loudest look in the room to have one of the best ones.",
      ]),
      tier('fine', 'It reads. Nothing more, nothing less.', [
        "{a} walks the runway and it reads. The look is there, the walk is competent, and nothing goes wrong. Nothing goes particularly right either. She turns at the end, walks back, and the judges make a note and move on. In a room where somebody else brought a showstopper, being fine is its own quiet verdict.",
        "It is a look. {a} walks it out and the panel watches and there is a brief, pleasant silence where everybody acknowledges that she is wearing something and it is not bad. The proportions are acceptable. The theme is addressed. She walks back and the next queen is already at the top of the runway.",
        "{a} presents a look that would be strong on a weaker night and unremarkable on this one. The walk is steady, the outfit fits, and she hits her mark. None of the judges lean in. None of them wince. She exists in the middle of the pack tonight and the middle of the pack is where verdicts are hardest to predict.",
        "A clean walk from {a}. The look answers the category without interrogating it — she did what was asked, did it competently, and left the runway having neither helped nor hurt herself. The judges will have to talk about somebody else to figure out where she lands tonight.",
      ]),
      tier('weak', 'It does not work, and she can feel the panel not reacting.', [
        "{a} walks out and the room is polite. That is the word for it — polite. The look has a concept but the concept did not translate to the body, and the walk slows toward the end in the way that means she can feel the panel not responding. She turns and goes back and the silence behind her is the loudest thing on the stage.",
        "Something about the look does not land. {a} knows it before she reaches the end of the runway — the proportions are off, or the colour is wrong for the lighting, or the idea was better in the werk room than it is under these spots. She finishes the walk but the confidence is gone from her stride by the second turn.",
        "{a} comes out and the look says one thing and the walk says another and neither of them says what the category asked for. She hits her mark, she poses, she turns, but the judges are already writing and writing at this point in the runway is not the kind of writing you want.",
        "It does not work. {a} can feel it not working as she walks — the drape is wrong, the reveal did not reveal, the boot is fighting the dress. She keeps her head up and finishes the walk because stopping is not an option, but the expression on her face when she turns is the expression of somebody who has already started preparing for the critique.",
      ]),
      tier('disaster', 'It comes apart, literally or conceptually, in front of everybody.', [
        "{a} walks out and something is already wrong. The hem is dragging. The wig is shifting. She reaches the end of the runway and makes the turn and a piece of the look detaches itself and lands on the stage and {a} looks down at it and then looks at the panel and the panel looks back and everybody knows what just happened.",
        "The look falls apart in real time. {a} is three steps into the walk when the structure gives way and what was supposed to be a silhouette becomes a pile of decisions that did not hold. She grabs at the shoulder, adjusts, keeps walking, but the damage is done and the judges saw all of it.",
        "{a} comes around the corner and the look is so far from the category that for a moment nobody is sure what they are seeing. It is not that it is ugly — it is that it does not appear to have been made for this runway, or possibly for this body, or possibly for this planet. One of the judges blinks. {a} walks the walk anyway. That part, at least, she can do.",
        "Something structural fails on the runway and {a} spends the rest of the walk holding her look together with one hand and her composure together with the other. She reaches the end, does not turn — turning would finish it — and walks straight back. The panel is silent in the way that means they are already composing the critique in their heads.",
      ]),
    ],
  },
  {
    id: 'walk-fit', step: 'runway', scope: 'per-queen', speaker: 'narrator',
    note: 'A short note on whether the look actually answered the category. Fires only when the fit is notable either way.',
    tierBy: 'fit',
    tiers: [
      tier('on-theme', 'She understood the assignment exactly.', [
        "The look answers the category so precisely that it feels like {a} was given the brief a week before everybody else. Every element — the reference, the silhouette, the accessory — points at the same idea, and the walk lands it. The assignment was understood and then some.",
        "{a} read the category, understood the category, and delivered the category back to the panel in a package that says \"this is what you meant.\" The judges do not need to squint or interpret. The look is the answer and the answer is correct.",
        "Whatever the category asked for, {a} brought it. Not an adjacent version, not a creative reinterpretation that requires a five-minute explanation — the thing itself, executed with the kind of clarity that makes the other queens on the stage look like they read a different brief.",
        "The look is so on-theme that it functions as a definition of the category. {a} walks the runway and the judges nod at each other because the nod means \"that is it, that is the one that understood.\" Everything else tonight will be measured against this read.",
      ]),
      tier('off-theme', 'A good look for a different night.', [
        "It is a good look. It is not this look. {a} walks the runway in something that would have been strong last week or next week but tonight the category asked for something specific and this is not it. The craft is there. The read is not.",
        "{a} comes out in something beautiful that has nothing to do with the category. The judges watch with the particular expression of people who can see the skill and cannot find the brief, and that gap between talent and assignment is where the critique is going to live tonight.",
        "The look is polished, the construction is clean, and it answers a question nobody asked. {a} walks the runway with confidence, which makes it worse — she clearly thinks she nailed it, and the panel is going to have to explain why the thing she nailed was not the thing they were looking for.",
        "A different runway, a different night, and {a} is in the top. Tonight she is wearing something that lives three postcodes away from the category, and the distance is going to cost her regardless of how well it is made.",
      ]),
    ],
  },

  // ══ THE CRITIQUES: A JUDGE BEAT AND A REACTION, PER QUEEN ════════════
  {
    id: 'critique', step: 'critiques', scope: 'per-queen', speaker: 'judge',
    note: 'What a judge says to her, to her face. Tiered by where she actually placed.',
    tierBy: 'call',
    tiers: [
      tier('WIN', 'The judge is delighted and says so with a joke in it.', [
        "\"I have one note,\" {j} says, and pauses long enough for {a} to brace, \"and the note is: more of that.\" The panel laughs. {a} laughs. {j} is not joking — the look, the performance, the runway, all of it landed, and the critique is a celebration disguised as a sentence.",
        "{j} leans back in the chair and says \"I do not know what to tell you that you do not already know.\" The panel agrees. The critique is short because there is nothing to fix — {a} understood the assignment, executed it at the highest level, and left {j} with nothing to do but confirm it.",
        "\"You came out on that stage,\" {j} says, \"and I forgot I was judging.\" It is the kind of compliment that sounds like hyperbole until you look at {j}'s face and see that it is not. {a} takes a breath. The critique is everything she came here to hear.",
        "\"The word I keep coming back to,\" {j} says, \"is intention. Every single choice on that stage was a choice, and every single choice was right.\" {j} smiles at {a} in a way that says the competition part of the evening is, for this moment, beside the point.",
      ]),
      tier('HIGH', 'Real praise with one small note attached.', [
        "\"I loved it,\" {j} says, and then adds the word \"almost\" and lets it sit there. The praise is real — the look was strong, the performance was present, the runway had life — but there is one thing, one small thing, and {j} names it precisely enough that {a} knows it is going to stay with her.",
        "{j} tells {a} what worked and the list is long and specific. Then {j} says \"but\" and the room shifts, because the \"but\" after that much praise means the note matters. It is a small note. {a} nods. She knows {j} is right and that is the worst part.",
        "\"You are so close,\" {j} says, and the way {j} says it makes clear that \"close\" is not a consolation prize — it is a location, and {a} can see the destination from where she is standing. The critique is generous and honest and {a} takes both of those things with her.",
        "The praise comes first and it is substantial — {j} goes through the look piece by piece and approves of nearly all of it. The \"nearly\" is a hemline, or a proportion, or a choice that read as safe when the rest of the look was brave, and {j} names it once and moves on.",
      ]),
      tier('SAFE', 'Brief. Pleasant. Forgettable, which is its own verdict.', [
        "{j} nods at {a} and says something pleasant that will not be remembered by anyone in the room by tomorrow morning. The look was fine. The walk was fine. The critique matches the performance — present, competent, and already fading from the conversation.",
        "\"You look good,\" {j} says, and the compliment is real but brief and {a} can feel the panel already thinking about the next queen. Being safe is not a punishment but it is not a story either, and {j}'s three sentences confirm that {a} is, tonight, part of the scenery.",
        "{j} gives {a} a nod and a sentence that amounts to \"nothing was wrong\" without quite reaching \"something was right.\" {a} smiles. The smile is the smile of somebody who knows that this critique will not be in the recap and has made peace with that.",
        "The critique is kind and efficient and over before {a} has time to react to it. {j} says what worked, does not say what did not — because nothing did not — and moves on. Safe is a temperature, not a verdict, and the temperature tonight is room.",
      ]),
      tier('LOW', 'Disappointed rather than angry. The worst kind.', [
        "{j} does not raise her voice. That is how {a} knows it is bad. \"I expected more from you,\" {j} says, and the sentence is worse than any specific note because it means {j} has been paying attention to what {a} can do and tonight {a} did not do it.",
        "\"You are better than this,\" {j} says quietly, and it is the quietness that hits. If {j} were angry {a} could argue. But {j} is disappointed, and disappointment from somebody who believed in you is the one thing you cannot defend against on this stage.",
        "{j} looks at {a} for a long time before speaking, and the pause is its own critique. When {j} finally talks, the words are careful and kind and they land like they weigh something. {a} nods through all of it. She does not interrupt because she knows {j} is right.",
        "The critique is short because {j} does not need many words. {j} names the problem — one problem, clearly — and then says \"I know you know\" and stops. {a} does know. The worst critiques are the ones you agree with before they finish the sentence.",
      ]),
      tier('BTM', 'A real critique, delivered kindly and landing hard.', [
        "{j} starts with \"I want to be honest with you\" and {a}'s face changes because that opening means whatever comes next is going to be true and true is going to hurt. {j} is kind about it — measured, specific, fair — and the kindness makes it worse because it removes the option of dismissing the critique as cruelty.",
        "\"This is hard to say,\" {j} begins, and then says it anyway, because that is the job. The look did not work. The performance did not save it. {j} walks through what went wrong with the precision of somebody who respects {a} too much to be vague, and {a} stands there and takes it and the taking is its own kind of bravery.",
        "{j} gives {a} the critique she does not want and does it with the kind of directness that only lands this hard when it comes from someone who is not trying to be cruel. Every note is specific. Every note is accurate. {a} can feel the stage getting smaller under her feet.",
        "The critique arrives without anger and without apology. {j} says what did not work and why it did not work and does not soften either of those things. {a} is standing very still, which is the standing-still of somebody who is listening hard because the alternative is falling apart, and falling apart is not something she can do in front of this panel.",
      ]),
    ],
  },
  {
    id: 'critique-reaction', step: 'critiques', scope: 'per-queen', speaker: 'narrator',
    note: 'How she takes it, standing there on the stage with the camera on her.',
    tierBy: 'reaction',
    tiers: [
      tier('joy', 'She cannot keep it off her face and does not try.', [
        "{a} does not try to hide it. The smile arrives before the critique finishes and it is the kind of smile that uses the entire face — eyes, cheeks, teeth, everything — because she has been told she is good at the thing she came here to do and there is no performance that covers that up.",
        "The joy is immediate and total and {a} does not edit it for the camera. She puts her hands over her mouth and then takes them down and then puts them back because she cannot decide what her face should be doing and has settled on all of it at once.",
        "{a} breaks into a grin that she clearly intended to be smaller. The grin wins. It takes over her whole face and stays there through the rest of the critique and the only thing keeping her on the ground is the heels, which are doing structural work tonight.",
        "{a} presses her palms together in front of her chest and her shoulders drop three inches because she has been holding them up near her ears since the critiques started and the verdict just released them. The relief and the joy arrive at the same time and she does not sort them out — she just stands there, beaming.",
      ]),
      tier('relief', 'She had prepared for worse and it shows.', [
        "{a} exhales. It is the exhale of somebody who has been breathing shallowly for the last ten minutes without noticing, and the depth of it says everything about what she thought was coming. She closes her eyes for one second, opens them, and nods. The nod is for herself.",
        "The critique lands better than {a} expected and you can see the moment the tension leaves her body — a slight drop in the shoulders, a loosening of the jaw, a blink that lasts a beat longer than normal. She was ready for something worse and the something worse did not arrive.",
        "{a} was bracing. She is not bracing anymore. The shift is small — a change in her posture, a breath she did not know she was holding — but the camera catches it and the panel catches it and everybody in the room knows that {a} just learned she is not going where she thought she was going tonight.",
        "There is a flicker of something on {a}'s face that is not quite a smile — it is the muscle memory of a smile suppressed because smiling feels premature. She settles for a nod that says \"thank you\" and \"I was terrified\" in equal measure.",
      ]),
      tier('idgaf', 'She takes it flat, and the flatness is the performance.', [
        "{a} takes the critique with an expression that gives the panel absolutely nothing. No smile, no frown, no nod, no flinch. She stands there and listens and when it is over she says \"thank you\" in a tone so neutral it could be a receipt printer. The judges look at each other. The flatness is louder than a reaction.",
        "The critique arrives and {a} receives it like weather. She does not argue, she does not agree, she does not react in any way that the panel can read. Whether this is composure or indifference or a wall she built on the walk to the stage is a question the judges will argue about later.",
        "{a} listens to the whole critique with the same expression she had before it started. One of the judges pauses, expecting something — a reaction, a question, a blink — and gets nothing. {a} has decided what this moment is worth to her and the decision, apparently, was: not much.",
        "Nothing moves on {a}'s face. The critique washes over her the way a weather forecast washes over somebody who has already decided to go outside regardless. She says \"I hear that\" and means it technically but not spiritually, and the panel knows this and moves on.",
      ]),
      tier('sadness', 'She holds it together for exactly as long as she has to.', [
        "{a} nods through it. She nods and she nods and the nodding is the thing that is keeping her face together, because as long as she is nodding she is agreeing and agreeing is a posture and a posture is not crying. She holds it. She holds it for exactly as long as the critique lasts and then she holds it a little longer because the camera is still on her.",
        "The critique lands and {a} takes a breath that catches halfway, and that catch is the only sign that the words are doing what the judges intended them to do. She presses her lips together and lifts her chin and looks straight at the panel because looking anywhere else would be admitting how much this hurts.",
        "{a} is very still. The kind of still that takes effort. The critique is fair and specific and lands precisely where it was aimed, and {a} absorbs it the way a person absorbs a wave they saw coming — feet planted, jaw set, eyes straight ahead, already counting the seconds until it passes.",
        "Her eyes are bright but nothing falls. {a} stands on the stage and listens to the critique and holds herself together with a precision that is, in its own way, a performance. The sadness is there — the panel can see it, the camera can see it — but she will not let it arrive until she is off this stage.",
      ]),
      tier('crash-out', 'She does not hold it together.', [
        "{a} does not make it through the critique. The first note lands and she is fine, and the second note lands and she is fine, and the third note is the one that opens the door and everything she has been holding comes through it. She puts her hand over her mouth but it is too late and the camera is right there.",
        "It starts with a trembling lip. Then the chin. Then the eyes fill and she blinks once, hard, and that is the blink that breaks it. {a} cries on the main stage and does not try to stop because trying to stop a thing that has already started is worse than letting it happen.",
        "The critique finishes and {a} says \"I understand\" and her voice cracks on the second word and the crack opens everything. She puts both hands over her face and her shoulders shake and the panel watches and there is a silence on the stage that is the silence of people who know they caused this and know it was their job to cause it.",
        "{a} holds it together through the first half of the critique and then {a} does not hold it together through the second half. The tears arrive without warning and without permission and {a} wipes them with the back of her hand and says \"sorry\" and then says \"I am not sorry\" and the correction is the bravest thing she has done tonight.",
      ]),
    ],
  },
  {
    id: 'deliberation', step: 'critiques', scope: 'once', speaker: 'narrator',
    note: 'The queens are sent to the back and the panel argues about them. Fires once.',
    tierBy: 'split',
    tiers: [
      tier('agreed', 'The panel is of one mind and it does not take long.', [
        "The queens are sent to the back and the panel barely argues. The winner was clear, the bottom was clear, and the middle sorted itself. The deliberation is three sentences and a nod and the judges are ready to bring them back before the queens have had time to fix their faces.",
        "The panel agrees and the agreement takes less time than the walk to the judge's table. Somebody won, somebody lost, and the path between those two facts was straight enough that the deliberation is a formality. The judges look at each other, confirm, and call them back.",
        "It is a quick night. The panel runs through the names and every name lands in the same place for every judge, which means there is nothing to argue about, which means the queens in the back are going to be called back sooner than they expect. The verdict was decided before the deliberation started.",
        "\"Are we in agreement?\" one of the judges says, and the other judges nod, and that is the deliberation. No argument, no debate, no second look at the notes. Tonight the performances sorted themselves and the panel's job was to confirm the order, not create it.",
      ]),
      tier('split', 'The judges genuinely disagree, and it is close.', [
        "The panel does not agree. One judge argues for the look, another argues for the performance, and a third is going back through her notes with the expression of somebody who has changed her mind twice and is about to change it a third time. The queens in the back can feel the deliberation running long. They are right to worry.",
        "It is close and the panel knows it is close and the closeness produces the kind of argument that sounds collegial and is not. Two judges want different queens in the bottom and both of them have a case and neither of them is backing down. The deliberation is going to take a while.",
        "\"I disagree.\" The word lands on the judge's table and the deliberation, which had been moving toward a conclusion, reverses direction entirely. One judge thinks the look saved the performance. Another judge thinks the performance buried the look. The queens in the back are fixing their faces and they are going to need the time.",
        "The judges are arguing. Not performing an argument for the camera — genuinely arguing, with notes and references and the kind of intensity that means somebody's placement is going to change in the next three minutes. It is close. The margin between safe and bottom is a hemline and a missed beat, and the panel cannot agree on which one mattered more.",
      ]),
    ],
  },

  // ══ THE RESULTS ══════════════════════════════════════════════════════
  {
    id: 'result-win', step: 'results', scope: 'per-queen', speaker: 'host',
    note: 'The winner is told. The show has a word for this and uses it every time.',
    tierBy: 'always',
    tiers: [tier('win', 'Condragulations. She has won the week.', [
      "\"Condragulations, {a}.\" The word fills the stage and {a} takes a breath so deep it moves her shoulders. She has won the week. The panel is smiling, the safe queens in the back are watching on the monitor, and for one moment — just one — {a} does not have to be competing. She is just good at this.",
      "\"Condragulations, {a}, you are the winner of this week's maxi challenge.\" {a} puts her hands together and mouths \"thank you\" and the gratitude is so genuine that it lands harder than the victory. She came to win and she won, and the winning feels like the beginning of something rather than the end of it.",
      "The word lands and {a}'s face does the thing where it tries to be professional and fails beautifully. \"Condragulations.\" She nods, she smiles, she says \"thank you\" and means it in a way that includes everyone who helped her get here and several people who did not. She has won the week and the week is hers.",
      "\"Condragulations, you are the winner of this week's maxi challenge.\" {a} closes her eyes for one second — just one — and when she opens them she is still standing on the same stage but the stage feels different now. She won. The judges saw what she brought and the judges said yes, and that yes is the one she came here for.",
    ])],
  },
  {
    id: 'result-safe', step: 'results', scope: 'once', speaker: 'host',
    note: 'The safe queens are dismissed to the back together, which is its own small humiliation.',
    tierBy: 'always',
    tiers: [tier('safe', 'You are safe. You may leave the stage.', [
      "\"You are safe.\" The words are delivered to the group and not to anyone in particular, which is the point. Being safe means you are neither the best nor the worst and tonight that is all you get. The safe queens nod and walk to the back and the stage belongs to whoever is left.",
      "\"You are safe. You may leave the stage.\" It is a dismissal delivered kindly and felt unkindly, because being told to go means the rest of the night is not about you. The safe queens file off the stage in the particular silence of people who wanted more and got exactly enough.",
      "The safe queens are sent to the back. Nobody argues. Nobody thanks the panel. They leave the stage with the posture of people who have been told they are not in danger and not in the spotlight and both of those things are true at the same time.",
      "\"You are safe.\" The sentence is three words and it means two things — you are not going, and you are not winning — and every queen who hears it decides for herself which half to carry. They walk to the back and the main stage shrinks to the queens who remain.",
    ])],
  },
  {
    id: 'result-bottom', step: 'results', scope: 'per-queen', speaker: 'host',
    note: 'She is told she is up for elimination, one at a time.',
    tierBy: 'always',
    tiers: [tier('bottom', 'I am sorry, my dear. You are up for elimination.', [
      "\"I am sorry, my dear, but you are up for elimination.\" The words arrive and {a} receives them standing straight with her chin up because she has been preparing for this moment since the critiques started and the preparation is the only thing between her and the floor.",
      "\"{a}, my dear, I am sorry to tell you that you are up for elimination.\" {a} nods. The nod is slow and deliberate and it means \"I heard you\" and possibly \"I expected this\" and almost certainly \"I am not going to let you see what this is doing to me right now.\"",
      "\"You are up for elimination.\" {a} blinks once. The blink is the only thing she gives the panel. She has been told she is fighting for her place tonight and the fight has already started — the posture straightens, the jaw sets, and the queen who was standing there a moment ago is replaced by the queen who is about to lip sync.",
      "The words land and {a} takes them with a stillness that is not calm but is close enough to pass for it on camera. She is up for elimination. She is going to have to perform for her place in this room, and whatever she was feeling three seconds ago has been filed away in favour of whatever she needs to feel to survive the next five minutes.",
    ])],
  },

  // ══ THE LIP SYNC, BEAT BY BEAT ═══════════════════════════════════════
  {
    id: 'lipsync-intro', step: 'lipsync', scope: 'once', speaker: 'host',
    note: 'Two queens stand before the host. The last-chance speech and the song.',
    tierBy: 'always',
    tiers: [tier('intro', 'This is your last chance to impress me.', [
      "\"Two queens stand before me.\" The room goes quiet in the way that means something is about to end for somebody. The host looks at both of them with an expression that is equal parts sympathy and expectation. \"This is your last chance to impress me and save yourself from elimination. The time has come for you to lip sync for your life. Good luck, and do not mess it up.\"",
      "The stage clears except for the two of them and the host names the song and the energy changes. This is not a critique anymore and it is not a runway. This is a fight set to music, and both queens know that whatever happened before this moment does not matter if they win the next three minutes.",
      "\"Prior to tonight, you were asked to prepare a lip sync performance.\" The host delivers the speech with the gravity it deserves, because this is the one part of the show that is not negotiable. Two queens, one song, one stays, one goes. The music starts and both of them take their positions.",
      "The host looks at both queens and says the words that mean somebody is about to go. The song is named. The positions are taken. The track drops in and for a moment — just a moment — both queens stand perfectly still, because the first beat of a lip sync belongs to nobody and both of them know it.",
    ])],
  },
  {
    id: 'lipsync-beat', step: 'lipsync', scope: 'per-queen', speaker: 'narrator',
    note: 'How she performs it. One beat per queen in the lip sync, tiered by her score.',
    tierBy: 'lipsync',
    tiers: [
      tier('legendary', 'A performance the season will be remembered for.', [
        "{a} owns the stage from the first beat and does not give it back. Every word is mouthed with the timing of somebody who has performed this song a hundred times in a mirror and is now performing it for the only audience that matters. The energy is not desperation — it is authority, and the authority fills the room.",
        "This is the lip sync the season will be remembered for. {a} performs with a ferocity that transcends the format — she is not fighting for her place, she is fighting to prove something larger than survival, and the proof is in every beat, every gesture, every moment where she makes the song hers.",
        "{a} comes alive in a way that makes the rest of the night feel like a warm-up. The lip sync is flawless — the words, the emotion, the movement, the connection to the song — all of it locked in and delivered at a level that makes one of the judges put down their pen because the pen is no longer relevant.",
        "From the first bar it is clear that {a} is not lip syncing. She is performing. The distinction is the difference between survival and art, and {a} is doing the second one with a commitment so total that the other queen on the stage becomes a backdrop.",
      ]),
      tier('strong', 'She fights, and she is good at it.', [
        "{a} fights. She knows the words, she hits the beats, she uses the stage, and the performance has the energy of somebody who has decided that going is not an option and has built the next three minutes around that decision. It is not the lip sync of the season but it is a lip sync that earns a place in the room.",
        "{a} delivers a solid lip sync — committed, prepared, and present for every beat of the song. She makes eye contact with the panel at the right moments, uses the floor, and gives the kind of performance that says \"I belong here and I am showing you why\" without ever looking desperate.",
        "The lip sync is good and {a} knows it is good. She performs with the confidence of somebody who prepared for this possibility and is now executing the preparation. The words are right, the energy is right, and the fight is visible in every line she mouths.",
        "{a} does not hold anything back. The performance is full-commitment, full-energy, and full of the kind of moments that make the judges lean in. She is fighting for her life and the fight is good enough that the outcome feels earned rather than inevitable.",
      ]),
      tier('trying', 'She is giving everything and it is not quite landing.', [
        "{a} is trying. The effort is visible in every movement — too much, sometimes, which is its own problem. She knows most of the words and fills in the gaps with energy, but the energy without the precision produces a performance that reads as spirited rather than skilled, and spirited does not always win.",
        "She is fighting but the fight is not landing. {a} moves across the stage with the intensity of somebody who knows this might be her last performance and cannot quite convert that knowledge into the kind of lip sync that changes a panel's mind. The emotion is real. The execution is not matching it.",
        "{a} gives everything she has and what she has tonight is not quite enough. The words slip in the second verse, the energy peaks too early, and by the final chorus she is running on commitment alone. Commitment is not nothing — the panel can see how much she wants this — but wanting is not the same as delivering.",
        "The lip sync starts strong and then {a} loses the thread somewhere in the middle — a wrong word, a beat she misreads — and spends the rest of the song trying to recover. The recovery is valiant but the stumble was visible and visible stumbles on this stage do not disappear with effort.",
      ]),
      tier('lost', 'She does not know the words and the room can tell.', [
        "{a} does not know the song. It is obvious from the first verse — the mouth is moving but the shapes are wrong and the timing is off and the performance has the energy of somebody who is pretending to swim in deep water. The panel watches with the particular patience of people who have already made their decision.",
        "The song starts and {a} starts and they are not in the same place at the same time. She mouths something that might be the lyrics and might be breathing and the distinction does not matter because the other queen on the stage knows every word and the comparison is doing all the work the panel needs it to do.",
        "{a} is on the stage and the song is on the stage and they are having two separate experiences. She tries to compensate with movement but movement without lyrics is choreography, and choreography without context is just walking around, and the judges can see all of this and are waiting for it to end.",
        "It is clear within the first ten seconds that {a} did not learn the words. She watches the other queen for cues, which is the one thing you cannot do in a lip sync without the panel noticing, and the panel notices, and the performance becomes a countdown rather than a contest.",
      ]),
    ],
  },
  {
    id: 'lipsync-stunt', step: 'lipsync', scope: 'per-queen', speaker: 'narrator',
    note: 'The stunt: the split, the reveal, the jump. Fires only when one is attempted.',
    tierBy: 'stunt',
    tiers: [
      tier('landed', 'She lands it and the room comes apart.', [
        "{a} goes for the split and lands it clean and the room erupts. The judges stand. The safe queens in the back are screaming at the monitor. The stunt was timed to the song and executed with the precision of somebody who has practised this in every dressing room she has ever been in, and the practice paid.",
        "The reveal happens mid-chorus and {a} tears away the outer layer and underneath is something the panel did not see coming. The room gasps. One of the judges says something that gets lost in the noise. The stunt was a gamble and the gamble paid and the energy on the stage just shifted permanently.",
        "{a} drops into a death drop so clean that the floor should send her a thank-you card. The timing is perfect — right on the beat, right at the peak of the song — and the impact shakes the stage and the judges and everything that was undecided about this lip sync.",
        "She kicks into a move that should not work in those heels and it works in those heels. The panel reacts before they can stop themselves — one of them slaps the table, another stands up — and {a} does not break character for even a second, which is the part that makes it legendary rather than lucky.",
      ]),
      tier('failed', 'She goes for it and it does not work.', [
        "{a} goes for the split and does not make it all the way down. The landing is awkward, the recovery is worse, and the three seconds she spends getting back up are three seconds where the other queen has the stage entirely to herself. The stunt was a gamble and the gamble did not pay.",
        "The reveal is supposed to be the moment. {a} reaches for the tear-away and it does not tear, and she pulls again and it tears in the wrong place, and the panel watches with the kind of silence that is worse than laughter. The stunt was the plan and the plan just failed on live television.",
        "{a} attempts a move that her body does not quite agree with tonight. The intention is clear — it was supposed to be a moment — but the execution lands somewhere between ambitious and unfortunate, and the gap between those two things is where the lip sync slips away from her.",
        "She goes for it. She should not have gone for it. The stunt misfires — a slip, a stumble, a beat lost to recovery — and the energy that was building collapses into the particular silence of a room that just watched someone bet everything on a single moment and lose.",
      ]),
    ],
  },
  {
    id: 'lipsync-call', step: 'lipsync', scope: 'once', speaker: 'host',
    note: 'The verdict. Shantay, sashay, or one of the rarer calls.',
    tierBy: 'call',
    tiers: [
      tier('shantay', 'One stays, one goes.', [
        "\"Shantay, you stay.\" The words go to one queen and the absence of them goes to the other. The queen who stays takes a breath that fills her entire body. The queen who does not receives the silence and nods and begins the walk that every queen in this room knows is coming for all of them eventually.",
        "The host looks at both of them and the decision is in the eyes before it is in the words. \"Shantay, you stay.\" One queen lives to fight another week. The other queen is already being hugged by the safe queens in the back, because the walk to the door starts here.",
        "\"Shantay, you stay.\" One queen presses her palms together and mouths \"thank you\" and the relief rewrites her entire face. The other queen straightens her back because she is about to walk off this stage and she is going to do it the way she came onto it — upright, in drag, and looking like somebody who was here.",
        "The call is made and the stage splits into two halves — the half where somebody stays and the half where somebody goes. \"Shantay, you stay\" is said once and means everything to the person who hears it and everything different to the person who does not.",
      ]),
      tier('double-shantay', 'Both were too good to lose. Nobody goes home.', [
        "The host pauses longer than usual and both queens are standing there expecting the worst and then: \"Shantay, you both stay.\" The stage erupts. Nobody goes. The lip sync was too good to end with a loss and the panel has decided that both of them earned another week, and the relief that hits both queens at the same time is visible from the back of the room.",
        "\"I have made my decision.\" The pause is long enough to stop time. \"Shantay, you both stay.\" Both queens stare at the host for a full second before the words land, and then they land all at once — the tears, the hug, the scream from the back where the safe queens are watching. Nobody is going tonight. Both of them were too good.",
        "Neither queen expected this. The host says the words and both of them look at each other and then at the host and then at each other again because a double save means the lip sync was something special and they both know it and the knowing is bigger than the relief.",
        "\"Shantay, you BOTH stay.\" The emphasis on \"both\" is where the room breaks open. Two queens who were fighting for their lives are suddenly not fighting anymore and the transition from combat to gratitude happens in real time on their faces and it is the most honest moment of the night.",
      ]),
      tier('double-sashay', 'Both were bad enough that both go.', [
        "The host does not say \"shantay.\" The host says something worse: neither of them will be staying. The stage goes cold. Both queens hear it at the same time and the shared devastation bonds them for exactly the length of time it takes to walk to the door together, which is longer than either of them expected.",
        "\"Neither of you will be staying.\" The words land on the stage like a verdict from a court that does not offer appeals. Both queens stand there. Neither argues. The lip sync was what it was and what it was, tonight, was not enough for either of them.",
        "It is the rarest call and neither queen was prepared for it. Both of them are going. The host delivers it with gravity and both queens nod because the nod is the only thing available to them — there is no argument to make when both performances failed to clear the bar.",
        "\"I am sorry, my dears, but neither of you has shown me enough to stay.\" The words settle over both queens at the same time. There is a shared glance — not quite solidarity, not quite blame — and then they both begin the walk that leads away from the stage and toward the door.",
      ]),
      tier('triple', 'Three of them fought and one of them loses.', [
        "Three queens stood on the stage and fought and one of them is going. The host names who stays — twice — and each \"shantay\" lands with relief for one and dread for the remaining. The queen who is left standing without a save closes her eyes for one second and then opens them and walks.",
        "A three-way lip sync is a war with three fronts and tonight one queen lost on all of them. The host calls two names and both of those names get to stay and the third name is never said, which is its own kind of verdict. The departing queen hugs the other two because the fight was real even if the result was not what she wanted.",
        "Three queens fought. Two of them stay. The one who does not is the one who knew, halfway through the song, that the stage was slipping away from her — and the knowing did not help, because knowing and fixing are not the same thing at the speed of a lip sync.",
        "\"Shantay, you stay.\" Twice. And then the silence that follows the second one is the silence where the third queen understands that the third call is not coming. She nods. She hugs the two who stayed. She walks to the back to say her goodbyes and the walk is steady, which is the most she can give the room right now.",
      ]),
    ],
  },

  // ══ THE EXIT ═════════════════════════════════════════════════════════
  {
    id: 'farewell', step: 'exit', scope: 'per-queen', speaker: 'narrator',
    note: 'What she says to the room on her way out.',
    tierBy: 'always',
    tiers: [tier('goodbye', 'The last thing she says to the queens still standing.', [
      "{a} hugs every queen in the room one at a time and does not rush any of them. Some of the hugs are long and some of them are longer and by the time she reaches the door she has said everything she needs to say without saying most of it out loud. The last thing she says to the room is \"do not forget me\" and she means it and nobody will.",
      "\"I had the time of my life,\" {a} says, and the sentence is a cliche and she knows it is a cliche and she says it anyway because sometimes the truest thing you can say is the thing everybody says. She waves. She turns. She walks toward the door with the posture of somebody who is already thinking about what comes next.",
      "{a} says goodbye with the kind of composure that costs everything. She tells the room she loves them and she tells them to fight and she tells one queen in particular something quiet that makes that queen cry, and then she walks to the door and does not look back because looking back is the thing that will break her.",
      "The goodbye is short because {a} does not trust herself with a long one. \"Thank you,\" she says to the room. \"All of you. Thank you.\" Then she turns and walks and the door closes behind her and the queens who are left stand in the silence she leaves behind.",
    ])],
  },
  {
    id: 'mirror-message', step: 'exit', scope: 'per-queen', speaker: 'narrator',
    note: 'The lipstick message she leaves on the werk room mirror. A fixed ritual — it always happens.',
    tierBy: 'always',
    tiers: [tier('message', 'Written in lipstick, for whoever comes back in tomorrow.', [
      "{a} picks up the lipstick and writes on the mirror and the message is short and the shortness is the point. A name. A heart. A word that means \"I was here and now I am not and whoever reads this tomorrow should know that I left it for them.\" She caps the lipstick, looks at what she wrote, and walks out.",
      "The lipstick message takes {a} less than a minute. She writes it quickly, in the handwriting of somebody who has already decided what she wants to say, and when she steps back the mirror holds the words the way a mirror holds everything — reversed, temporary, and meant for somebody else.",
      "{a} stands in front of the werk room mirror with a lipstick in her hand and writes the thing she has been thinking about since the verdict. It is not a speech. It is a sentence, maybe two, and the queens who walk in tomorrow morning will read it and know that {a} was here and that {a} wanted them to keep going.",
      "The message is written in red and it says what it needs to say and nothing more. {a} puts the cap back on, puts the lipstick down, and looks at the mirror one more time — her own reflection framed by the words she left behind — and then she turns and the werk room is empty.",
    ])],
  },
  {
    id: 'closing', step: 'exit', scope: 'once', speaker: 'host',
    note: 'The host closes the night on the queens who are left.',
    tierBy: 'always',
    tiers: [tier('close', 'If you cannot love yourself, how in the hell are you going to love somebody else?', [
      "The host looks at the queens who are left and says the thing she says every week, and it works every week. \"If you cannot love yourself, how in the hell are you going to love somebody else? Can I get an amen?\" The room says amen. The room always says amen. The night is over.",
      "\"Now, let the music play.\" The host closes the night with the words that mean the stage is done and the werk room is next, and the queens who survived walk off into whatever comes tomorrow. Somebody just left and the room is lighter by one voice and heavier by everything that voice said.",
      "The host delivers the closing and the queens respond and the ritual is the same as it has been every week. That is the comfort of it — the same words, the same amen, the same walk off the stage — and the comfort is real even when the night was hard, because the words mean you are still here to hear them.",
      "The closing words land the way they always do — familiar, earned, and aimed at a room full of people who needed to hear them tonight more than most nights. The queens say amen and the host smiles and the music plays and the stage empties one last time until next week, when all of this starts again with one fewer voice in the room.",
    ])],
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

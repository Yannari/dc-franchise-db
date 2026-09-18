// ══════════════════════════════════════════════════════════════════════
// dr/data/legacy-beats.js — the lipstick ceremony's lines
// ══════════════════════════════════════════════════════════════════════
//
// Its own file rather than js/dr/data/stage-beats.js, which is already ~1100
// lines with a guard suite walking all of it: a ritual only one season shape
// runs should be separable from the ones every season runs.
//
// `{h}` is the queen holding the lipstick, `{x}` the queen she names, `{p}`
// the bottom she chose out of. Names are filled at render time — never write
// one into a pool.
export const LEGACY_BEATS = {
  /* SHE GOES BACKSTAGE ALONE. Keyed by the reason js/dr/legacy.js actually
     returned, so the deliberation cannot argue for a different decision from
     the one the night recorded. */
  deliberate: {
    threat: [
      '{h} is not deliberating. {h} is confirming. There is a difference and it takes about four seconds.',
      'Backstage the counter is very quiet and {h} is doing arithmetic that has nothing to do with tonight.',
      '{h} holds one up to the light like she is checking it for something. She is not checking it for anything.',
      'The tube {h} wants is not the tube the room would pick, and {h} has known that since the critiques.',
      '{h} does the thing she does before a lip sync: one breath in, hold it, let it go. Then she reaches.',
      '{h} turns the two tubes over in her hands. One of these names is the only queen down there who could take this from her.',
      'Backstage, {h} is not thinking about tonight. She is thinking about the four weeks after it.',
      '{h} lines the lipsticks up on the counter and looks at them the way you look at a bill you have to pay.',
    ],
    panel: [
      '{h} is out of there in under a minute, which tells the crew everything it needs to know.',
      'There is nothing to weigh. {h} still stands there a moment, because walking straight back out looks like something.',
      '{h} reads the names twice. They say the same thing the second time.',
      '"Easiest one I will ever do," {h} says to the mirror, and then looks like she wishes she had not said it out loud.',
      '{h} picks up the obvious one and hates a little bit that it is obvious.',
      '{h} does not have to think for long. The panel said who the weakest of them was, out loud, twenty minutes ago.',
      '{h} weighs the tubes and finds the choice already made for her: the room ranked them, and she agrees with the room.',
      '"I’m not going to pretend this is hard," {h} says to the mirror. "They told us."',
    ],
    grudge: [
      'There is no deliberation. There is a woman picking up something she has been thinking about for weeks.',
      '{h} smiles at the counter. Nobody is in the room to see it, which is probably for the best.',
      '{h} takes her time, and the taking of time is the only part of this that is for anybody else.',
      'Somewhere on the other side of that wall, {x} already knows. {h} is counting on it.',
      '{h} does not weigh anything. She came backstage with the answer in her mouth.',
      '{h} has waited a long time to hold one of these with {x}’s name on the other end of it.',
      'Backstage, {h} is very calm, and that is the part that should worry {x}.',
      '{h} picks one up without looking at the other.',
    ],
    /* SHE DISAGREED WITH THE ROOM. The panel had somebody else last and she
       wrote this name anyway — which used to be labelled `panel` and
       explained with "they told us", about a queen the judges had ranked
       ABOVE the other one. */
    'own-read': [
      '{h} looks at the two tubes and does not think about the critiques at all. She was in that room. She has her own eyes.',
      '"The judges liked her more than they liked the other one," {h} says to the mirror. "I was standing next to both of them for a week."',
      '{h} knows this is going to be unpopular. She picks it up anyway.',
      '"Everybody is going to think I got it wrong." {h} shrugs at her own reflection. "Everybody can think that."',
      '{h} is not going to be the queen who does what she is told, and she has about forty seconds left to prove it.',
      'The panel ranked them. {h} ranks them differently, and tonight she is the one holding the lipstick.',
      '{h} takes the one the room would not have taken. It is not a mistake and it is not an accident.',
      '"This is going to cost me," {h} says, and picks it up anyway.',
    ],
    /* ── AND THE FOUR REASONS THAT USED TO COME OUT AS "THE PANEL SAID SO" ──
       Measured across forty seasons, 82% of ceremonies drew the `panel` pool,
       because the label only knew three terms and the other half of the score
       — fairness, a friend, her circle, a promise made in Untucked — had no
       name. These are that half. `s` is the queen she protected: the reason
       this name is on the tube is that the other one could not be. */
    turn: [
      '{h} is thinking about weeks that already happened, which is not how anybody else at that counter plays this.',
      '"It has to be somebody," {h} says to the mirror, and the mirror has heard that sentence from better liars.',
      '{h} lines the tubes up by how many times each name has been saved. It is not a long line and it is not a fair one.',
      'There is a queen down there who has had more lives than the rest of them put together, and {h} has decided to be the one who says so.',
      '{h} does not look conflicted. {h} looks like somebody doing a job nobody else would take.',
      '{h} counts it out on her fingers, which is not a nice thing to watch. Somebody has been carried through this before, and {h} has decided that stops tonight.',
      '"At some point it is just somebody’s turn," {h} says to the mirror, and the mirror does not argue with her.',
      '{h} is not thinking about who was worst tonight. She is thinking about who has already been handed one of these and walked away from it.',
    ],
    friend: [
      '{h} picks up {s}’s tube, puts it down, and does not pick it up again. That is the whole deliberation.',
      'One of those names {h} cannot physically write, and knowing that does not make the other one lighter.',
      '{h} stands there long past the point of deciding. She decided immediately. She is just not ready to walk out yet.',
      '"Do not make me do this," {h} says, to nobody, about somebody who is not in the room.',
      '{h} wipes her face carefully, because she is about to be looked at by everybody she knows.',
      '{h} looks at {s}’s name for a long time and then puts that tube down, and everything after that is just paperwork.',
      '"I could not do it to {s}," {h} says quietly, to nobody. "So it has to be the other one, and I have to live with that too."',
      'There was never a version of this where {h} wrote {s}’s name, and {h} knows it, and that is what makes the other tube feel so heavy.',
    ],
    bloc: [
      'The maths at that counter is very simple and {h} does not pretend otherwise.',
      '{h} does not even turn {s}’s tube around. Why would she.',
      '"Everybody is going to know," {h} says to the mirror. She does not sound like somebody who minds.',
      'There is one name at that counter {h} is protecting and it was decided long before tonight.',
      '{h} is backstage for ninety seconds and about eighty of them are for show.',
      '{h} does not pretend to deliberate. {s} is one of hers, and you do not end one of yours, and the rest of it follows from that.',
      '"People are going to say I protected {s}." {h} turns the other tube over. "People are going to be right."',
      '{h} weighs them the way you weigh something you have already decided: {s} is family in this competition and the other one is not.',
    ],
    plea: [
      '{h} is still in that lounge, a little, hearing somebody say please to her in front of the whole cast.',
      '"I said a thing," {h} tells the mirror. "Now I find out if I am somebody who says things."',
      '{h} weighs them and keeps landing on a conversation instead of a performance.',
      'Somebody asked her tonight. {h} has been in this competition long enough to know how rare that is and how much it costs to honour.',
      '{h} does not look at the tubes much. She is looking at her own face and asking it something.',
      '{h} keeps hearing {s} in that lounge. She asked for it to her face, and {h} said something back, and now {h} has to be the kind of queen who meant it.',
      '"{s} asked me," {h} says. "Nobody else asked me." It is a thin reason and it is the one she is going with.',
      '{h} gave her word in Untucked, quietly, in a room full of people pretending not to listen. This is what that costs.',
    ],
  },
  /* ── AND WHY, IN HER OWN VOICE ─────────────────────────────────────
     The ceremony narrated a decision and never explained one: the viewer
     watched a tube turn around and was told nothing about why that name and
     not the other one. This is her, to camera, after the fact, saying it.
     {x} is the queen whose name she wrote. {o} is the one she did not. */
  confessional: {
    threat: [
      '"Everybody is going to say {x} was not the worst tonight." {h} nods. "Correct. {x} was not the worst tonight. {x} is the one who beats me in six weeks. Next question."',
      '"I did not come back here to be fair. I came back here to WIN." {h} shrugs. "{o} cannot catch me. {x} could. Past tense. Love that for me."',
      '"You can spend this on the girl who had a bad night, or on the girl who is about to have a great season." {h} looks at the camera. "I can read a room AND a track record."',
      '"Was it personal? No. That is the part that should scare people." {h} sits back. "{x} was just better than she needed to be in front of me."',
      '"Girl, I am not sitting here pretending I did not do math." {h} counts on two fingers. "{o}. {x}. One of them is a problem later."',
      '"{x} has been coming for me since week one and she was GOOD at it." {h} raises an eyebrow. "So. Handled."',
      '"People are going to call me calculating." {h} laughs. "I was handed a weapon. What did they think I was going to do, cry?"',
      '"The worst part is I like her." {h} pauses. "That did not save her. It made it take longer."',
      '"Everybody in that bottom was safe from me except the one who could actually take this." {h} nods once. "{x} knew. She knew when they called her name."',
    ],
    panel: [
      '"The judges said it. Out loud. In front of everybody." {h} spreads her hands. "{x} was last. I am not going to sit here and pretend I know better than four people who do this for a living."',
      '"If I go against what the panel just said, I am making it about me." {h} shakes her head. "It is not about me. It is about {x} having the worst night."',
      '"People wanted me to play some big game with it." {h} laughs. "The room already did the work. The room said {x}. I went to bed."',
      '"Everybody keeps asking if it was hard." {h} looks at the camera. "It was not hard. That is the honest answer and nobody likes it."',
      '"I am not going to invent a reason to be interesting." {h} shrugs. "{x} was bottom. I sent bottom home. Thrilling television."',
      '"Could I have gone rogue? Sure." {h} tilts her head. "And then every girl in that room finds out I do not go with what is fair. No thank you."',
      '"The second they read the critiques I knew." {h} nods. "Everybody in that room knew. Do not act surprised on my behalf."',
      '"There is a version of me that plays that differently." {h} pauses. "She is not the one holding the lipstick tonight."',
      '"{x} is going to watch this back and know it was fair. That matters to me." A beat. "A little."',
    ],
    'own-read': [
      '"The judges had the other one lower. I know." {h} does not blink. "I was in that werk room all week and they were not."',
      '"Everybody is going to say I got that wrong." {h} shrugs. "Fine. I watched {x} work all week and I made a call."',
      '"I am not here to agree with the panel. I am here to win." {h} looks straight down the lens. "Those are different jobs."',
      '"On paper it should have been {o}." A beat. "I do not play this on paper."',
      '"You want me to explain it with the critiques and I cannot," {h} says. "It was not about the critiques. It was about who I have to beat."',
      '"People at home are going to be screaming at me." {h} laughs. "Scream. I am the one who won the song."',
    ],
    grudge: [
      '"There is history there. Everybody in that room knows there is history there." {h} does not blink. "{x} knew what this was the second they announced I won."',
      '"I am not going to insult anybody by pretending this was about tonight." {h} smiles, briefly. "Me and {x} have a thing. Tonight I was the one holding it."',
      '"{o} has never done a thing to me." A pause. "{x} has. I have a long memory and a short lipstick."',
      '"Girl, she knows what she did." {h} looks straight down the lens. "And now so does everybody watching."',
      '"People are going to say I made it personal." {h} nods slowly. "SHE made it personal. I just finally had the pen."',
      '"I waited a long time to be in this exact position." {h} exhales. "It was worth the wait. I am not going to lie about that either."',
    ],
    turn: [
      '"{x} has been in the bottom, and the bottom, and the bottom, and somebody keeps carrying her." {h} shakes her head. "I love her. It was her turn."',
      '"At some point somebody actually has to go home." {h} says it flat. "It cannot be {x} getting a pass every week while the rest of us fight for it."',
      '"How many times does one girl get saved?" {h} counts, and does not like the number. "That is what I thought."',
      '"{o} has not had her chances yet. {x} has had hers." A beat. "And hers. And hers."',
      '"I am not the villain for saying the quiet part." {h} looks at the camera. "Somebody has been getting carried and everybody in that room can name her."',
    ],
    friend: [
      '"I am going to be honest, because I will not be able to lie about it later." {h} looks down the lens. "{o} is my friend. I was never writing my friend’s name. So it is {x}, and {x} did nothing except stand next to somebody I love."',
      '"Could I make a case that {x} deserved it more?" {h} shrugs, and it costs her. "Probably. Could I write {o}? Never. Not tonight, not week ten."',
      '"Everybody keeps saying play the game, play the game." Her jaw sets. "{o} held my hand in that werk room when I had NOTHING. So I wrote {x}. I will take what comes."',
      '"I know what this looks like." {h} nods. "It looks exactly like what it is. I picked my person. I am not going to insult you by dressing it up."',
      '"There was no world where that was {o}." {h} is very still. "I knew it walking backstage. The rest was just choosing how long to stand there."',
      '"{x} is going to hate me and she is allowed." A pause. "I would hate me too. I would also do it again."',
      '"People play this game like it is only a game." {h} shakes her head. "I have to look {o} in the face tomorrow. That is not nothing to me."',
    ],
    bloc: [
      '"{o} is one of mine. That is not a secret and I am not making it one now." {h} sits back. "You do not end one of yours."',
      '"People are going to watch this and say I protected {o}, and that {x} paid for it." {h} nods slowly. "Yes. Both. And if {o} is holding it next week I expect the same."',
      '"There are a handful of us who actually look out for each other." {h} looks at the camera. "{o} is one. {x} never wanted to be."',
      '"Is it strategy? Is it loyalty?" {h} smiles. "Girl, in here those are the same word."',
      '"I did not build that little family for nothing." {h} shrugs. "Tonight it cost {x}. Some week it is going to cost me."',
    ],
    plea: [
      '"{o} asked me. To my face, in that lounge, in front of everybody." {h} exhales. "{x} did not. That is the whole story."',
      '"I gave {o} my word." {h} looks at the camera. "I could have gone out there and written her name instead of {x}’s and nobody could have done a thing. I would have known."',
      '"{x} spent Untucked telling the room she does not campaign." {h} raises an eyebrow. "Cool. {o} campaigned. One of those worked."',
      '"Somebody asked me for her life and I said something back." {h} pauses. "Then I had twenty minutes to find out if I meant it."',
      '"I am not going to be the girl who promises in the lounge and lies on the stage." {h} shakes her head. "You only get to do that once and then you are alone in here."',
    ],
  },
  /* ── THE SECOND BEFORE. She has chosen and nobody knows it yet, and that
     is the most television this ceremony has in it — it used to go straight
     from deliberating to the name, so the tube turned before anybody had time
     to want it not to. Says nothing about who: this beat runs one screen
     before the reveal and naming her here is the spoiler. */
  hold: [
    '{h} comes back out with her hand closed and does not open it, and the room reads that hand for ten straight seconds.',
    'The walk from the counter to the stage is about nine metres. It has never taken anybody that long before.',
    'Nobody in the bottom is breathing properly. {h} is breathing perfectly, which is its own kind of answer.',
    'Somebody says "oh my god" very quietly and the camera does not find out who.',
    '{h} takes her mark and looks at the three of them and does not let her face do anything at all.',
    'The music that plays under this is the same every week and it has never once felt this long.',
    '{h} picks one of them up. She does not show it to anybody. She walks back out with it closed in her hand and the room watches her do it.',
    'One tube leaves the counter. Which one is a fact that exists now, in that room, known to exactly one person.',
    '{h} comes back out and the lipstick is already in her hand and every queen on that stage is doing the same arithmetic and getting a different answer.',
    'She has made her decision. She has not made it out loud yet, and the difference between those two things is about ninety seconds long.',
    '{h} takes her place. The lipstick stays closed. Somebody in the bottom laughs, once, and it is not a laugh.',
  ],
  /* ── THE WALK BACK OUT, AND THE TUBE TURNED AROUND ──
     The eight long variants below came from `lipsync-legacy-choice` in
     js/dr/data/stage-beats.js, which was written when NOTHING narrated the
     legacy choice at all. It fired on the `lipsync` step -- and once the
     ceremony got its own screen after the song, that step came first, so the
     lip sync screen named the eliminated queen before the lipstick had turned
     around. Moved here rather than suppressed: the prose is the best on this
     screen, and a pool with no caller is how a written beat quietly dies. */
  reveal: [
    "{h} walks to the lipstick rack and the room holds its breath and she uncaps the tube and the name written on it is {x}. The room exhales. {x} closes her eyes for one second and opens them and the opening is a person who has just been told her season is over by somebody who was standing next to her an hour ago.",
    "\"I have made my decision.\" {h} turns the lipstick toward the room and the name on it reads {x}, and {x} nods once because the nod is the only response available to a queen who has just been named by another queen in front of everyone she has worked beside for weeks.",
    "The host asks {h} to reveal her choice and {h} holds up the lipstick and the name is {x}. The room does not gasp — the room goes quiet, which is worse. {x} stands still and the stillness is a queen processing a verdict that was written by someone who earned the right to write it.",
    "{h} says the name out loud — \"{x}\" — and the name fills the room. {x} takes it in and the taking-in happens behind her eyes where nobody can see it except the people who are watching closely, and tonight everybody is watching closely.",
    "The lipstick is uncapped and the name is {x} and {h} delivers it with the steadiness of a queen who made this decision before the song was over and has been carrying it since. {x} hears it and the hearing is the loudest quiet thing that has happened on this stage all night.",
    "{h} holds the power and the power has a name and the name is {x}. She says it clearly and without hesitation and the clarity is a kindness even if the verdict is not. {x} receives it standing up and the standing is its own statement.",
    "\"The queen I have chosen to leave tonight is {x}.\" {h} says it and the sentence ends and the room holds the ending. {x} presses her lips together and breathes out through her nose and the breath is a person deciding how to carry this in front of an audience.",
    "The host nods at {h} and {h} reveals the lipstick and {x} sees her own name on it and the seeing is a thing that takes longer than it should because the brain needs a moment to turn a name on a tube into a sentence about the rest of her season. {x} nods. The nod is enough.",
    '{h} walks back out with the lipstick closed in her fist, holds it up, and turns it around. It says {x}.',
    'The tube turns. {x}.',
    '{h} lets the room look at the back of her hand a moment longer than it needs, then shows it: {x}.',
    '{h} holds it out at arm’s length, and the name on it is {x}.',
  ],
  /* HOW THE ROOM TAKES IT. Nobody sang, so there is nothing to blame but her. */
  roomAnswer: [
    'Nobody says anything. That is what the room does now — it has learned that talking through this makes it worse.',
    'Two queens reach for each other without looking. The third one does not have anybody to reach for.',
    'The sound in that room is a lot of people deciding at once not to react, and failing at slightly different speeds.',
    'Somebody laughs. It is the wrong laugh, the kind that comes out sideways when the alternative is crying.',
    'The queens still standing there do the arithmetic on their own faces and every single one of them gets it wrong.',
    'A hand goes over a mouth. A shoulder drops. Nobody speaks, because what would you say.',
    'Nobody moves. There was no song to lose, so there is nothing to say about it.',
    'A sound goes through the room that is not quite a gasp — the bottom knew one of them was going and none of them knew which.',
    '{x} nods, once, like she had already worked it out.',
    'Somebody down the line breathes out. It carries.',
  ],
  /* HER LAST WORDS, AND WHY THEY ARE NOT `sashay-words`.
     That pool is written for a queen who just lip synced for her life and
     lost it. This queen performed nothing: she stood in a line and somebody
     else chose. It is a different exit and it needs its own voice. */
  lastWords: [
    '"Well." {x} laughs once. "That is one way to go out."',
    '"I would have written my own name before I wrote hers," {x} says. "That is the difference between us and I am fine with it."',
    '"Somebody had to." {x} shrugs. "It stings that it was her. It would have stung either way."',
    '"I do not get a song. That is the part I am going to think about on the flight." {x} nods. "Not the lipstick. The song."',
    '"Tell her I said congratulations," {x} says, and means about sixty per cent of it.',
    '"I came here to fight and I am leaving without a fight." {x} exhales. "That is the whole review."',
    '"I didn’t get to fight for it," {x} says. "That’s the part I’ll be chewing on."',
    '"{h} played it exactly the way I’d have played it," {x} says, and almost means it.',
    '"No song, no chance, no hard feelings," {x} says. Two of those are true.',
    '"I came back to prove something and I got sent home by somebody’s strategy," {x} says. "Put that on the poster."',
    '"She had to pick somebody," {x} says, with a shrug that costs her something.',
  ],
};

/* ── THE CAMPAIGN, IN THIS ERA'S WORDS ───────────────────────────────
   The save's campaign pools are reused for the legacy night's lobbying —
   pitch, pushback, answer, all the same moves — but a handful of them are
   written for a mechanic that does not run here. There is no save and no
   song for the bottom: she is asking not to be SENT HOME, and "one bad night
   shouldn't send me to the lip sync" describes a stage she will never stand
   on.

   Found by dumping a season and reading it, which is where every prose defect
   on this show has come from. Keyed by the same ids, so anything without an
   entry falls through to SAVE_BEATS unchanged.
   `{a}` is the queen pitching, `{b}` the queen she is working, `{c}` a rival,
   `{n}` her wins. */
export const LEGACY_CAMPAIGN = {
  'pitch-record': [
    '"I have {n} on my record," {a} says. "One bad night should not end my season."',
    '"Look at what I have done here," {a} says. "All of it, against one bad runway."',
  ],
  'pitch-no-threat': [
    '"Keep me and you keep the easiest queen in the room," {a} tells {b}. "Think about it."',
    '{a} makes the cold case. "I am not the one who beats you. You know which one is."',
  ],
  'pitch-friend': [
    '"We came in together," {a} says to {b}. "Do not make tonight the night that stops mattering."',
    '{a} does not make a case. She just stands next to {b} and lets the friendship do it.',
  ],
  'pitch-deserve': [
    '"I was the best of those three tonight and everybody in this room knows it," {a} says.',
    '"If you are keeping whoever did the best work," {a} says, "then this is not a hard one."',
  ],
  'pitch-my-turn': [
    '"You have held this before," {a} says to {b}. "You have never once held it over me."',
    '"Everybody in that bottom has had a break except me," {a} says.',
  ],
  promise: [
    '{a} leans in. "Keep me tonight and I will hand you this exact moment back."',
    '"You keep me," {a} says quietly to {b}, "and you have somebody in this room. That is worth more than the win."',
  ],
  'rebut-threat': [
    '{c} leans over. "You keep {a}, you are keeping the queen who beats you in the finale."',
    '"She is asking you to walk her to the crown," {c} says. "Politely."',
  ],
  'rebut-record': [
    '"{a} has a record," {c} says. "That is the reason to end her, not the reason to keep her."',
    '"Her résumé is the argument against her," {c} says. "Think about who you are sitting beside at the end."',
  ],
  /* THE ROOM'S OWN LOBBYING, which is half of this era's Untucked. */
  'lobby-against': [
    '{a} gets {b} on her own. "I am not in that bottom and I am telling you anyway: it has to be {c}."',
    '"You want my honest opinion?" {a} does not wait. "{c}. Tonight. While you can."',
    '{a} makes the case against {c} to {b} quietly, at the bar, with her back to the room.',
    '"Everybody is too polite to say it," {a} tells {b}. "{c} has been carried for three weeks."',
  ],
  'lobby-for': [
    '"Not {c}," {a} says to {b}. "Anybody but her. I am asking."',
    '{a} sits down next to {b} and spends four minutes on why {c} deserves another week. She does not mention herself once.',
    '"If it is {c} tonight I am going to take it personally," {a} tells {b}, smiling, not entirely joking.',
  ],
  /* AND THE ONE THAT ONLY EXISTS WITH TWO QUEENS HOLDING THE POWER. */
  'played-both': [
    '{b} and {c} compare notes and find out {a} told each of them something different. Neither of them says anything to her. Both of them remember.',
    '"She told you that?" {b} asks. {c} nods. {a} is across the room being charming at somebody else, and has no idea the two of them just spoke.',
    '{a} worked {b}, then worked {c}, and the two of them worked out she had worked them both. The room watches it land.',
  ],
  'debt-called': [
    '"I have carried you twice," {a} says to {b}. "I am asking once."',
    '{a} does not raise her voice. "You owe me this, and you know exactly what for."',
  ],
};

/** One line, names filled. */
export function legacyLine(pool, vars = {}, rng = Math.random, used = null) {
  const list = Array.isArray(pool) ? pool : [];
  if (!list.length) return '';
  /* ── WITHOUT REPLACEMENT, ACROSS THE WHOLE SEASON ──────────────────
     The ceremony runs ten times a season and two thirds of those nights draw
     the same tier, so a pool of eight was showing the reader the same
     sentence three times before the finale — reported as "it's repeating a
     lot". `used` is an array on the season state (a Set does not survive
     being saved): lines already spoken are skipped until the pool is
     exhausted, and then it starts again, which is the same contract the save
     campaign has had since it was written. */
    const fresh = Array.isArray(used) ? list.filter(l => !used.includes(l)) : list;
  const from = fresh.length ? fresh : list;
  if (from === list && Array.isArray(used)) {
    // Round two: forget the ones that belong to this pool and start over.
    for (const l of list) {
      const at = used.indexOf(l);
      if (at >= 0) used.splice(at, 1);
    }
  }
  const line = from[Math.floor(rng() * from.length) % from.length];
  if (Array.isArray(used)) used.push(line);
  return String(line).replace(/\{(\w+)\}/g, (m, k) => (vars[k] != null ? String(vars[k]) : m));
}

// ══════════════════════════════════════════════════════════════════════
//  THE ROOM ALREADY KNOWS EACH OTHER
// ══════════════════════════════════════════════════════════════════════
//
// The history beats: two queens out of the same season, meeting again in a
// room where one of them is going home tonight. `{a}` and `{b}` are the pair,
// `{s}` the season they shared.
//
// `sent-home` is written from the loser's side — she is the one carrying it —
// so `{a}` is the queen who beat her and `{b}` is the queen who went home.
export const HISTORY_BEATS = {
  // At the door, when she sees who else got the call.
  arrival: {
    friend: [
      '{b} sees {a} already at a station and the shriek is genuine. Season {s} put them in the same room for three months and they have not stopped since.',
      '{a} and {b} do not say hello so much as pick something up mid-sentence, four years later.',
      '"They cast us both again," {b} says to {a}, delighted and slightly afraid.',
    ],
    rival: [
      '{b} clocks {a} across the room and the temperature drops about four degrees. Season {s} did not end well for either of them.',
      '{a} says {b}’s name like a fact rather than a greeting. {b} returns it exactly.',
      'They hug. It is the kind of hug two people do because there are cameras.',
    ],
    /* SEVEN, because a room of real returnees produces a LOT of these -- on
       a cast pulled out of one stored season there can be five or six pairs
       with a lip sync between them, and a three-line pool ran the same
       sentence three times in one premiere. */
    'sent-home': [
      '{b} walks in, sees {a}, and the whole room watches her decide how to play it. {a} is the queen who beat her in the song that ended season {s}.',
      '"Well," {b} says to {a}, "you owe me a season." {a} laughs. {b} half meant it.',
      '{a} gets to {b} first. "I have thought about that lip sync every week since." "So have I," {b} says. "Differently."',
      '{b} hugs {a} for slightly too long and says, into her shoulder, "we are not doing that again."',
      '"There she is," {b} says, and {a} has the grace to look caught. Season {s} ended for one of them on a song they both remember.',
      '{a} starts to say something about season {s} and {b} holds up a hand. "Later. Let me get my face on first."',
      'The room clocks it before either of them does: {a} and {b}, and a lip sync between them that only one of them walked away from.',
    ],
    mates: [
      '{a} and {b} did season {s} together and pick up like colleagues who liked each other fine.',
      '"Season {s}," {b} says to {a}, shaking her head. "We were babies."',
      '{a} and {b} do the handshake they made up in season {s} and both of them are slightly embarrassed by it.',
      '"You look better than you did in season {s}," {a} tells {b}, which is a compliment with a whole season inside it.',
      '{b} and {a} spend the first ten minutes comparing what the two of them have been booked for since.',
    ],
  },
  // And in the werk room, once the season is under way.
  room: {
    friend: [
      '{a} and {b} work side by side without talking much, which is what two people who already know how the other one sews look like.',
      '"You are doing the thing you did in season {s}," {a} tells {b}. "The thing where you redo a good bodice." {b} puts the seam ripper down.',
    ],
    rival: [
      '{a} and {b} manage a whole hour at neighbouring stations without a word. The room notices the hour.',
      '"Do not do the face," {b} says, without looking up. {a} does the face.',
    ],
    'sent-home': [
      '{b} tells the room what that lip sync was actually like, from her side of it. {a} listens to the whole thing and does not defend herself, which is the right call.',
      '"I am not here to get her back," {b} says. "I am here to not be in that position again." Nobody in the room believes the first half.',
    ],
    mates: [
      '{a} and {b} do ten minutes on how much better the workroom smells this time.',
    ],
  },
};

// ══════════════════════════════════════════════════════════════════════
//  THE FORMAT, SAID OUT LOUD
// ══════════════════════════════════════════════════════════════════════
//
// A mode that never announces itself is a mode the viewer has to infer from a
// chart legend. The host says what season this is, what is different about it,
// and what it is worth — once, at the top, the way the show does.
// `{n}` is how many queens are in the room.
export const ALLSTARS_OPENING = {
  welcome: [
    '"Welcome," the host says, "to All Stars." He lets the room make its noise. "Every one of you has done this before. Every one of you left something on the table."',
    '"You have all walked through that door once already," the host says. "This time you know exactly what it costs."',
    '"{n} queens," the host says. "Not one of you is new. That is the whole idea."',
  ],
  rule: [
    '"The rules have changed, and you know they have. Each week the TOP two queens will lip sync for their legacy — and the winner of that song decides which of her sisters goes home."',
    '"Nobody down there will be singing for her life. The two queens at the TOP will sing, and the winner holds somebody’s season in her hand."',
    '"This season the power does not sit with me. It sits with whoever wins that song. Choose your friends accordingly."',
  ],
  prize: [
    '"The winner takes a place in the Drag Race Hall of Fame, and a cash prize of one hundred thousand dollars."',
    '"One of you leaves here in the Hall of Fame. The rest of you leave here having tried it twice."',
  ],
};

/* ── AN ENTRANCE THAT HAS DONE THIS BEFORE ───────────────────────────
   The flagship entrance pools are written for a queen walking into the werk
   room for the first time — "I genuinely can't believe I'm standing here",
   "I'm gonna try very hard not to cry" — and three queens in one All Stars
   premiere said the crying one. Nobody here is new. These replace the WALK
   line when the season is All Stars; the room's answer, the intro and the
   backstory all still come from the ordinary pools, because those are about
   who she is rather than whether she has been here.
   Keyed by how she carries it, which is the same attitude read the flagship
   entrance uses. */
export const AS_ENTRANCES = {
  cocky: [
    'Did you miss me? Wrong question. Did you think you were done with me?',
    'I have unfinished business and a better wig. In that order.',
    'Second time lucky, girls. And I do not believe in luck.',
    'They let me back in the building. That was their first mistake.',
  ],
  warm: [
    'I have been waiting four years to walk through that door again and I am not going to pretend otherwise.',
    'Same door. Different queen. Let us find out.',
    'Hello again! I know exactly how this goes and I am still terrified, which is new.',
  ],
  cool: [
    'I know what this room does to people. I am ready for it this time.',
    'Nothing about this is a surprise to me any more. That is the advantage.',
    'Last time I was polite. Take that as you like.',
  ],
  nervous: [
    'I said yes before they finished the sentence and I have been panicking ever since.',
    'I have done this once and somehow that makes it worse.',
    'Everybody here is good. That is the part nobody warns you about the second time.',
  ],
};

/* ── AND THE INTRODUCTION SHE GIVES ──────────────────────────────────
   The flagship intro pool is a first-timer's too — "I genuinely can't believe
   I'm standing here", "I'm gonna try very hard not to cry during this
   introduction" — and a queen on her second season saying it is the same bug
   as the entrance line, one paragraph later.
   `{a}` her name, `{years}` how long she has been doing drag, `{city}` and
   `{job}` her authored profile fields. A line naming a field she has not got
   is dropped rather than filled with a guess, the same as the flagship pool:
   see `usable` in js/dr/arrivals.js. */
export const AS_INTROS = {
  cocky: [
    "I'm {a}. {years} years in drag, one season already served, and I am not here to make up the numbers.",
    "{a}. You know the name. If you do not, you will by the third episode.",
    "I'm {a}, I've been doing this {years} years, and I came back for the one thing I did not get.",
  ],
  warm: [
    "I'm {a}, {years} years of drag, and I have wanted this second go so badly that it is faintly embarrassing.",
    "{a}. {years} years. I loved every horrible minute of it the first time and here I am again.",
    "I'm {a} and I have spent a long time thinking about what I would do differently. We are about to find out if any of it was true.",
  ],
  cool: [
    "{a}. {years} years. I have done this before, so you will forgive me if I am not wide-eyed about it.",
    "I'm {a}. I know how this room works now. That is the only thing that has changed.",
    "I'm {a}, {years} years in, and I am here to finish something.",
  ],
  nervous: [
    "I'm {a}, {years} years of drag, and knowing exactly what is coming has not helped as much as you would think.",
    "{a}. I said yes immediately and I have been quietly terrified ever since.",
    "I'm {a} and I have already done this once, which means I know precisely how much it is going to hurt.",
  ],
};

/* ══════════════════════════════════════════════════════════════════════
   THE OTHER LIPSTICK — next week's cold open
   ══════════════════════════════════════════════════════════════════════

   The queen who lost the song had a name in her head and never got to say
   it. The morning after, the room asks. She can open it or keep it shut, and
   both are a move: the queen who says "I would have sent you home" has told
   somebody still in that room exactly where she stands, and the queen who
   refuses has told them she has something worth refusing about.

   {h} is the runner-up, {x} the name she had, {w} the queen who actually held
   the lipstick, {g} the queen who went home.
*/
export const SHADOW_BEATS = {
  // The room brings it up. It always brings it up.
  ask: [
    'It takes eleven minutes. {h} is still doing her face when somebody finally asks what was in her hand.',
    '"Okay, nobody else is going to say it," somebody announces to the room, "so I will. {h}. Who did you have?"',
    'The question has been sitting in that room since the lights went down and it comes out over breakfast, badly.',
    '{h} knows it is coming. {h} has known since last night. She has had a lot of time to decide what her face is going to do.',
    'Somebody asks it as a joke, the way you ask a thing you actually want the answer to.',
    'Somebody says it before the coffee is poured. "So who did you have?" {h} does not look up, which is an answer in the shape of not answering.',
    'The werk room has one subject this morning and it is not the maxi challenge. Every queen in it wants to know what was in {h}’s hand.',
    '"I have been thinking about it all night," {h} says, to nobody in particular, and six heads turn at once.',
    '{w} asks her outright, because {w} can afford to. "Would you have done what I did?"',
  ],
  // She opens it — and it is the same name.
  same: [
    '"{x}," {h} says, and a couple of shoulders come down. "Same as her. We did not talk about it and we did not need to."',
    '"You are all waiting for drama and I do not have any for you." {h} shrugs. "I had {x} as well."',
    '"Honestly? The same." {h} looks at {w}. "You did the thing I was going to do. No notes."',
    '"{w} and I had the same name." {h} pauses. "That should probably worry the rest of you more than it does."',
    '"If it had been me, nothing changes." {h} says it plainly, and the room believes her, mostly.',
    '"Two of us, same name, no conversation." {h} raises an eyebrow. "That is not a coincidence, that is a bottom three."',
    '"Same as her." {h} shrugs. "{x}. It was not complicated and I am not going to pretend it was."',
    '"I had {x} too," {h} says, and the relief that goes round that room is audible. "{w} and I did not talk about it. We did not need to."',
    '"Honestly? {x}." {h} looks at {w}. "You did the thing I was going to do. I have no notes."',
  ],
  // She opens it — and it is somebody else. Somebody still standing there.
  different: [
    '"{x}," {h} says. {x} is four feet away with a wig in her hands. "You asked. I am not going to lie to you."',
    '"It would not have been {g}." The room goes quiet at the wrong speed. "It would have been {x}."',
    '"We are not going to like this conversation." {h} puts her brush down. "I had {x}."',
    '"Everybody keeps saying how close we all are." {h} half-smiles. "I had {x}’s name in my hand last night."',
    '"{w} played it her way. I would have played it mine." A beat. "Mine was {x}."',
    '"{x}." {h} says the name and the room stops moving, because {x} is sitting in it. "I am not going to lie to your face. That is who I had."',
    '"{w} had {g}." A pause. "I had {x}." {h} does not soften it and does not look away from her either.',
    '{h} takes her time. "It would have been {x}. You asked. I could have lied to you and I did not."',
    '"Everybody keeps saying we are all so close." {h} half-smiles. "I had {x}’s name in my hand last night. That is what this is."',
  ],
  // She keeps it shut.
  kept: [
    '"That is going in the bag with the lipstick," {h} says, and goes back to her mirror.',
    '"No." {h} smiles at the room. "Not because it is dramatic. Because it is mine."',
    '"Ask me at the reunion." {h} says it lightly. Four queens make a note to ask her at the reunion.',
    '"Why would I tell you that?" {h} laughs. "I am still IN this competition."',
    '{h} does not answer. She lets the question sit there until somebody else changes the subject for her, and everybody notices she let it.',
    '"I am going to keep that to myself." {h} says it pleasantly, which makes it worse. The room now knows there is something to keep.',
    '"Does it matter? I lost." {h} goes back to her mirror and the conversation goes with her, and nobody believes her.',
    '"You will find out if it ever happens again." {h} smiles at the room. Two queens stop smiling back.',
    '{h} shakes her head once. "That lipstick is in my bag and it is staying there."',
  ],
  // And what it does to the queen whose name it was.
  hit: [
    '{x} does not look up. {x} does not need to. The whole room is already looking at her.',
    '"Good to know," {x} says, in the voice you use when it is not good and you do know.',
    '{x} nods slowly, the way you nod at a piece of information you are going to be using later.',
    '"Okay!" {x} says, brightly, and the brightness is doing an enormous amount of work.',
    '{x} says nothing at all, which is somehow the loudest thing anybody has done this morning.',
    '{x} hears her name and does the thing you do, which is nod and keep your face still and file it somewhere you can reach later.',
    '"Noted," {x} says, and goes back to her sewing. She does not say anything else for a long time.',
    '{x} laughs. It is a real laugh and it is not a warm one. "At least I know."',
  ],
  // The room, after.
  room: [
    'The werk room finds something else to talk about, badly, and within a minute.',
    'Three separate conversations start at once and none of them are about that.',
    'Somebody puts music on. It does not help as much as they wanted it to.',
    'The room rearranges itself very slightly, and it does not rearrange back for the rest of the week.',
    'Everybody goes back to their stations. Everybody is thinking about the same sentence.',
    'Two queens look at each other across the room and have an entire conversation without moving their mouths.',
    'The morning goes on. It goes on differently.',
    'Somebody changes the subject, loudly, and everybody lets them.',
  ],
};

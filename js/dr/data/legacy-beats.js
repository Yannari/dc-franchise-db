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
      '{h} turns the two tubes over in her hands. One of these names is the only queen down there who could take this from her.',
      'Backstage, {h} is not thinking about tonight. She is thinking about the four weeks after it.',
      '{h} lines the lipsticks up on the counter and looks at them the way you look at a bill you have to pay.',
    ],
    panel: [
      '{h} does not have to think for long. The panel said who the weakest of them was, out loud, twenty minutes ago.',
      '{h} weighs the tubes and finds the choice already made for her: the room ranked them, and she agrees with the room.',
      '"I’m not going to pretend this is hard," {h} says to the mirror. "They told us."',
    ],
    grudge: [
      '{h} has waited a long time to hold one of these with {x}’s name on the other end of it.',
      'Backstage, {h} is very calm, and that is the part that should worry {x}.',
      '{h} picks one up without looking at the other.',
    ],
  },
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
export function legacyLine(pool, vars = {}, rng = Math.random) {
  const list = Array.isArray(pool) ? pool : [];
  if (!list.length) return '';
  const line = list[Math.floor(rng() * list.length) % list.length];
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

// ══════════════════════════════════════════════════════════════════════
// dr/data/cold-open-beats.js — the room, minutes after
// ══════════════════════════════════════════════════════════════════════
//
// The werk room MINUTES AFTER an elimination — still in drag, the station of
// whoever just left still warm. That is what this section is on this show and
// it has its own guard (tests/dr-cold-open-clock.test.js, written after
// fifteen of twenty-three events said "morning" and "coffee" over a room that
// had not been to bed). Nothing below may say morning, tomorrow, overnight or
// last night. The next day is `werk-morning`, one card later.
//
// It is a whole scene and it was one random event. What actually happens, in
// order: the room comes back in, somebody reads the lipstick message off the
// mirror out loud, the winner gets congratulated, the queens who were in the
// bottom say how they are about it, and whatever did not finish on that stage
// finishes here.
//
// ── THE MESSAGES ARE BUILT THE WAY THE REAL ONES ARE ─────────────────
//
// Read off the wiki's Farewell Messages pages (117 of them) rather than
// invented, because they have a shape and it is not "goodbye". Sorted by what
// the queen is actually doing with her last three feet of mirror:
//
//   WARM      "Love you all! Turn it out... Shangela"
//             "Stay kind. Stay gracious. Stay humble. I love you, darlings."
//   BLESSING  "Condragulations Raja. Mug4Dayz! Mariah" / "GING FOR THE WIN"
//   SHADE     "Girls: Stay humble... People go up... You'll be on the way
//             down!" / "HEATHER better win!"
//   JOKE      "Wear clown noses! Make fun of each other! Stay Plastic"
//             "hope you struggle cleaning this LOL"
//   ASIDE     a P.S. to ONE queen, which is the part the room reacts to:
//             "P.S. Fame – I used your lipstick, sorry :)"
//   DEFIANT   "Debbie Downer is gone. Sue Me!" / "This is only the beginning!"
//
// {a} is the queen who wrote it, {b} the queen it is aimed at (a friend, a
// rival, or the front-runner), and the sign-off is her own name, because
// every real one is signed.

/** The message on the glass, by what she was doing when she wrote it. */
export const MIRROR = {
  warm: [
    'LOVE YOU ALL! Now turn it out — {a}',
    'Stay kind. Stay gracious. Stay humble. I love you, darlings. xx {a}',
    'Sisters forever. Keep it foxy! Love your guts — {a} ♡',
    'You are ALL stars. Every one of you. Smooches, {a}',
    'Remember who you are and what you stand for. Stay fierce!! — {a}',
    'It has been the honour of my life. Go and be brilliant. {a} xoxo',
    'Thank you for the best weeks of my life. I mean that. — {a} ♡',
  ],
  blessing: [
    'CONDRAGULATIONS {b}. Go and finish it. — {a}',
    '{b} FOR THE WIN!!! (the rest of you, also good luck) xoxo {a}',
    'My money is on {b}. Sorry not sorry. Love you all — {a}',
    '{b}: you had better win this thing. I will be watching. {a} ♡',
    'P.S. GO {b}. — {a}',
  ],
  shade: [
    'Girls: stay humble. People go up... you will be on the way down. Kisses, {a}',
    '{b} better win. And she knows why. — {a}',
    'The real queen is not made inside these four walls. See you out there — {a}',
    'Some of you are here to compete and some of you are here to be seen. You know which. {a}',
    'Good luck, {b}. You are going to need it more than you think. xoxo {a}',
  ],
  joke: [
    'Wear clown noses! Make fun of each other! Stay plastic ♡ {a}',
    '{b} — I used your lipstick to write this. Sorry :) {a}',
    'Hope you struggle cleaning this off. LOL. Love you though — {a}',
    'WTF just happened?!? #GirlBye — {a}',
    'Do not be too messy without me. Actually — be exactly this messy. {a} xoxo',
    'I showed my ass a lot. Here is one more for the road. ♡ {a}',
  ],
  defiant: [
    'This is only the beginning. Watch me. — {a}',
    '{a} is gone. Sue me. ♡',
    'You did not see the half of what I can do. Your loss. — {a}',
    'I got a second chance once. Do not blow your first and only. xoxo {a}',
    'Everything happens for a reason. Big things are coming. — {a}',
  ],
};

export const COLD_BEATS = {
  /* THE ROOM COMES BACK IN. Her station is the first thing anybody sees. */
  arrive: [
    'The door opens on a room with one fewer station in it, and every queen in the doorway does the same small arithmetic.',
    'Somebody turns the lights on. Nobody says anything for a second, because there is a mirror at the far end with writing on it.',
    'They come in loud and then they see the empty chair and they come in quiet.',
    'The werk room does not look different. It feels completely different, and every queen walking into it clocks that within about four seconds.',
    '{a} is first through the door, and stops, because the mirror has been written on.',
    'It is always the same shape: one chair pushed in, one mirror written on, and everybody pretending to look at neither.',
  ],
  /* SOMEBODY READS IT OUT. This is the scene the format is built around. */
  read: [
    '{a} reads it out loud, because somebody has to and she is closest.',
    '"Everybody come here," {a} says. "She left us something." They gather at the mirror the way you gather at a mirror.',
    '{a} reads the message in the voice you use for a thing you do not entirely trust yourself to get through.',
    'They read it together, badly, three of them at once, which is somehow the right way to do it.',
    '{a} clears her throat and reads it, and the room listens like it is being told something important, because it is.',
  ],
  /* AND THE QUEEN IT WAS AIMED AT. */
  aimed: {
    warm: [
      '{b} puts her hand over her mouth. "She did not have to do that."',
      '{b} is crying before the sentence with her name in it is finished.',
      '"That is so her," {b} says, to nobody. She reads it again on her own, later.',
    ],
    sharp: [
      '{b} reads her own name on that mirror and does not say anything at all.',
      '"Okay," {b} says. "That is on a MIRROR. In LIPSTICK. For everybody."',
      '{b} laughs, once, without much in it. "She really thought about that on the way out."',
      '"Was that for me?" {b} asks. Nobody answers, which is the answer.',
    ],
  },
  /* CONDRAGULATIONS. The room does this properly, and then privately. */
  congrats: [
    'Somebody starts the clapping for {a} and the room joins in, and it is real.',
    '"Condragulations, {a}." The room says a version of it one at a time, some of them meaning it more than others.',
    '{a} gets hugged about nine times in ninety seconds and takes every one of them.',
    '"That win was not close," somebody tells {a}, "and you know it was not close."',
    'The first thing the room does is make a fuss of {a}, because whatever else is going on, she won.',
  ],
  winnerLine: {
    gracious: [
      '"I have not processed it. I am not going to process it standing here in these shoes," {a} says.',
      '"Everybody in that challenge was good," {a} says, and she is not being polite, she means it.',
      '{a} thanks everybody individually. It takes a while. Nobody minds.',
    ],
    hungry: [
      '"One down," {a} says, and the room laughs, and she was not entirely joking.',
      '"I needed that," {a} says. "I needed everybody in here to see me do that."',
      '{a} accepts the congratulations and then goes straight to her station, because there is another challenge coming.',
    ],
    guilty: [
      '{a} is quieter than a winner should be, and the reason is sitting in the empty chair at the end of the row.',
      '"It is a weird day to be happy," {a} says.',
      '{a} says thank you, and then says she does not want to talk about it much, and the room lets her have that.',
    ],
  },
  /* THE CHALLENGE ITSELF, which they are all still chewing on. */
  challenge: [
    'They spend twenty minutes on {m} and none of it is calm.',
    '"Can we talk about {m}," somebody says, and the room can, at length.',
    'Half of them are still doing bits from {m}. It is going to be like this all week.',
    '"I have never been that scared in my life," somebody says about {m}, and three queens say the same thing at once.',
    'The post-mortem on {m} takes longer than {m} did.',
  ],
  /* HOW THE BOTTOM IS THIS MORNING. Four ways, and they are not the same. */
  bottom: {
    sad: [
      '{a} is not really in the room. She is sitting at her station with her hands in her lap, still in the dress.',
      '"I keep going over it," {a} says. "The whole thing. On a loop. It has not stopped since I walked off that stage."',
      '{a} gets about four words out before she has to stop and take her lashes off.',
      '"I came here to show them what I can do," {a} says quietly, "and they have not seen it yet."',
      '{a} says she is fine. She is holding a lipstick she has not opened for ten minutes.',
    ],
    angry: [
      '"I am not going to sit here and pretend that was fair," {a} says, to the room, at volume.',
      '{a} is not sad. {a} is furious, and she is not hiding it, and the room can feel it from the door.',
      '"Somebody explain the critiques to me," {a} says, still in full drag. "Because they do not add up and I have been standing there doing the maths."',
      '"I did what they asked. I did EXACTLY what they asked." {a} slams a drawer. "So."',
      '{a} has decided the problem is everybody else, and she is not going to be quiet about it while she takes her face off.',
    ],
    fine: [
      '"Bottom two, still here." {a} shrugs. "That is a win where I am from."',
      '{a} is weirdly light about it. "I sang for my life and I am still in this competition. What am I going to complain about?"',
      '"It is done," {a} says. "I am not going to carry it into this week as well."',
      '{a} does her face, does her hair, and gets on with it. She has been in worse rooms than this one.',
    ],
    'dont-care': [
      '"Honestly?" {a} says. "I do not care. I am here for the next one."',
      '{a} will not discuss it. Not because she is upset — because it is over and she finds it boring.',
      '"They are going to love me eventually," {a} says. "I have got time."',
      'Somebody asks {a} how she is feeling. {a} asks whether anybody has a wipe.',
    ],
  },
  /* AND THE QUEENS WHO WERE FINE, WHICH IS ITS OWN PROBLEM. */
  safe: [
    '"I was safe," {a} says. "Again." She does not say it like good news.',
    '"Nobody remembers safe," {a} says, to her own reflection. "Nobody goes home and tells their mum they were safe."',
    '"I was not good enough to be talked about and not bad enough to be in trouble," {a} says. "So I was nothing."',
    '{a} watched somebody else get congratulated out there and it has done something to her that she is not going to say out loud.',
    '"This is the week," {a} announces, to nobody in particular. "I am not standing in the middle again."',
    '"Safe is the worst word in this building," {a} says, and about four queens make a noise of agreement.',
  ],
  /* WHATEVER DID NOT FINISH LAST NIGHT. */
  airing: [
    '{a} and {b} have not spoken since the lounge and everybody in the room knows exactly how long it has been.',
    '"Are we going to talk about it?" {a} asks {b}. "Or are we doing this all week?"',
    '{a} says the thing she has been holding since the runway, and {b} was waiting for it, and the room stops moving.',
    '"I am not angry," {b} tells {a}. "I am asking you a question." It is not just a question.',
    '{a} apologises to {b}. It lands about seventy per cent.',
    '{a} and {b} sort it out in the corner in about two minutes flat, which is what happens when both of them are tired.',
  ],
  /* THE ONE WHO SPENT THE LIPSTICK, ON A SEASON THAT HAS ONE. */
  holder: [
    '{a} walks back in knowing exactly what she just did, and so does everybody else.',
    'The room is polite to {a}. It is a particular kind of polite.',
    '"I would do it again," {a} says, before anybody has asked her anything.',
    'Somebody hugs {a} a beat too long and says nothing, and that is the whole conversation.',
  ],
};

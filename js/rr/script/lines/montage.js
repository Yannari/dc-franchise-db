// A big cast (director.js BIG_CAST): the teams with no story this leg, beyond the ten in full.
// mat-montage: Don checks one in, a line (a run of them airs as one segment, a line per team).
// task-montage: the clean runs of several such teams at one task, shown together ({teams} names them).
// Short on purpose: one to three turns. No {task}: it is the challenge's title, which can't sit inside a sentence.
const V = (say, sharp, dry, loud, soft, odd) => ({ say, v: { sharp, dry, loud, soft, odd } });

export default {
  'mat-montage.any': [
    { id: 'mm.1', turns: [{ by: 'don', say: "{team}, you're {placing}. Next." }] },
    { id: 'mm.2', turns: [{ by: 'don', say: "{team}. You're the {placing} team. Keep moving." }] },
    { id: 'mm.3', turns: [{ by: 'don', say: "{team}, {placing} place. Water's over there." }] },
    { id: 'mm.4', turns: [{ by: 'don', say: "And here's {team}, in {placing} place." }] },
    { id: 'mm.5', turns: [{ by: 'don', say: "{team}, you're {placing}. Off the mat, please." }] },
    { id: 'mm.6', turns: [{ by: 'don', say: "In {placing} place, {team}." }] },
    { id: 'mm.7', turns: [{ by: 'don', say: "{team}, you're the {placing} team to arrive. Don't stand on my mat all day." }] },
    { id: 'mm.8', turns: [{ by: 'don', say: "{team}, you're {placing}. Not bad. Not good either." }] },
    { id: 'mm.9', turns: [{ by: 'don', say: "Next up, {team}. You're {placing}." }] },
    { id: 'mm.10', turns: [{ by: 'don', say: "{team}, {placing} place. Go find some shade." }] },
    { id: 'mm.11', turns: [{ by: 'don', say: "{team}. That's {placing}. Somebody get these two a towel." }] },
    { id: 'mm.12', turns: [{ by: 'don', say: "{team}, you're {placing}, which is a fine place to be if you like the middle." }] },
    { id: 'mm.13', turns: [{ by: 'don', say: "{team}, {placing}. I'd clap, but I'm holding a sandwich." }] },
    { id: 'mm.14', turns: [{ by: 'don', say: "Welcome to the Chill Zone, {team}. You're {placing}." }] },
    // more of Don running down the middle of the pack (director.js check-in runs, any cast size, 2026-10-19)
    { id: 'mm.r1', turns: [{ by: 'don', say: "{team}, {placing}. Lovely. Next!" }] },
    { id: 'mm.r2', turns: [{ by: 'don', say: "Hold on, hold on... {team}, {placing}." }] },
    { id: 'mm.r3', turns: [{ by: 'don', say: "{team}! {placing}! Don't stop to chat, there's a queue." }] },
    { id: 'mm.r4', turns: [{ by: 'don', say: "And {team} make it {placing}." }] },
    { id: 'mm.r5', turns: [{ by: 'don', say: "{placing} place goes to {team}. Congratulations, I suppose." }] },
    { id: 'mm.r6', turns: [{ by: 'don', say: "{team}, you're {placing}. Hydrate." }] },
    { id: 'mm.r7', turns: [{ by: 'don', say: "{team}. {placing}. You look like you need a nap." }] },
    { id: 'mm.r8', turns: [{ by: 'don', say: "{placing}, {team}. Mind the step." }] },
    { id: 'mm.r9', turns: [{ by: 'don', say: "Coming in {placing}: {team}." }] },
    { id: 'mm.r10', turns: [{ by: 'don', say: "{team}, you're {placing}. I'll remember that. Probably." }] },
    { id: 'mm.r11', turns: [{ by: 'don', say: "{team}! You're {placing}. Smile for the camera. Not that one. That one." }] },
    { id: 'mm.r12', turns: [{ by: 'don', say: "{placing} place, {team}. Keep it moving, folks." }] },
    { id: 'mm.r13', turns: [{ by: 'don', say: "{team}, {placing}. You're blocking my light." }] },
    { id: 'mm.r14', turns: [{ by: 'don', say: "And it's {team} in {placing} place. Riveting." }] },
    { id: 'mm.r15', turns: [{ by: 'don', say: "{team}, {placing}! Somebody give them a chair." }] },
    { id: 'mm.r16', turns: [{ by: 'don', say: "{placing}, {team}. Don't trip on the way off." }] },
    { id: 'mm.r17', turns: [{ by: 'don', say: "Here come {team}. {placing}. Next!" }] },
    { id: 'mm.r18', turns: [{ by: 'don', say: "{team}, you're {placing}. Go and sit with the others." }] },
    { id: 'mm.r19', turns: [{ by: 'don', say: "{team}. {placing}. You're dripping on my mat." }] },
    { id: 'mm.r20', turns: [{ by: 'don', say: "{placing} place: {team}. Nobody faint." }] },
    { id: 'mm.r21', turns: [{ by: 'don', say: "{team}, {placing}. I've got a lot of teams to get through. Shoo." }] },
    { id: 'mm.r22', turns: [{ by: 'don', say: "{team}, you're {placing}. That's all I've got. Go." }] },
    { id: 'mm.15', turns: [
      { by: 'don', say: "{team}, you're {placing}." },
      { by: 'a', ...V("We'll take it.", "Fine. We'll take it.", "We'll take it.", "We'll TAKE it!", "Okay. We'll take it.", "We'll take it. Wrap it up for us.") },
    ] },
    { id: 'mm.16', turns: [
      { by: 'don', say: "{team}, {placing} place." },
      { by: 'b', ...V("Is that good?", "Is that good or not?", "Is that good?", "Is that GOOD?", "Is that... good?", "Is {placing} a good number?") },
      { by: 'don', say: "It's a place. Move along." },
    ] },
    { id: 'mm.17', turns: [
      { by: 'don', say: "{team}. You're the {placing} team to arrive." },
      { by: 'a', ...V("Can we sit down now?", "Can we sit now?", "Can we sit down?", "Can we PLEASE sit down now?", "Can we sit down now, please?", "Can we sit? My legs have filed a complaint.") },
      { by: 'don', say: "Anywhere that isn't my mat." },
    ] },
    { id: 'mm.18', turns: [
      { by: 'don', say: "{team}, you're {placing}." },
      { by: 'b', ...V("Better than we thought.", "Better than we thought.", "Better than we thought.", "That's BETTER than we thought!", "That's better than I thought, honestly.", "Better than we thought. Not as good as we dreamed.") },
    ] },
  ],

  'task-montage.any': [
    { id: 'tm.1', turns: [{ beat: '{teams} get through it on the first try.' }] },
    { id: 'tm.2', turns: [{ beat: '{teams} get it done without much fuss and run for their next tip.' }] },
    { id: 'tm.3', turns: [{ beat: 'One after another, {teams} finish and take their tips.' }] },
    { id: 'tm.4', turns: [{ beat: "{teams} don't need a second try." }] },
    { id: 'tm.5', turns: [{ beat: '{teams} are in and out before anybody else notices they were there.' }] },
    { id: 'tm.6', turns: [{ beat: 'It goes smoothly for {teams}.' }] },
    { id: 'tm.7', turns: [
      { beat: '{teams} all finish clean.' },
      { by: 'a', ...V("That's it? That was the whole thing?", "That's it? That was it?", "That's it?", "That's IT? That was the whole THING?", "Oh. That's it? That was the whole thing?", "That's it? I had a whole panic planned.") },
    ] },
    { id: 'tm.8', turns: [
      { beat: '{teams} get through it on the first go.' },
      { by: 'b', ...V("Don't say anything. Just run.", "Don't talk. Run.", "Don't say it. Run.", "Don't SAY anything! Just RUN!", "Don't jinx it. Let's just run.", "Don't speak. Words are bad luck. Run.") },
    ] },
    { id: 'tm.9', turns: [{ beat: 'Nobody has any trouble here: {teams} are through it in minutes.' }] },
    { id: 'tm.10', turns: [{ beat: '{teams} keep their heads down, get it done, and go.' }] },
  ],
};

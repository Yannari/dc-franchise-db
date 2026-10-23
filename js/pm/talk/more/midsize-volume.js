// pm/talk/more/midsize-volume.js — volume for the kinds with mid-size pools
// that a season still wore through (the user, 2026-10-22: "address the
// repeats by increasing the volume of the dialogue ALOT"): the vent, the
// debrief's room, the blowup's last rounds, the date's first minutes, the
// comfort and the dumped islander's walk out. Only movements whose lines carry
// no gate of their own: a moan is {a}'s feeling about {pa}, never a fact the
// engine didn't decide.
const R = (...turns) => ({ turns });
const W = (when, ...turns) => ({ when, turns });
const S = (stage, ...turns) => ({ stage, turns });
const BEAT = beat => ({ turns: [], beat });

export const VENT_VOLUME_2 = {
  moves: {
    open: [
      S("{a} sits down heavily on the end of {b}'s sunbed.", ['b', "That's a face."], ['a', "It's the only face I've got today."]),
      S("{a} finds {b} in the kitchen and leans on the counter.", ['a', "Have you got five minutes? I need to rant."], ['b', "I've got ten. Rant away."]),
      S("{a} pulls {b} over to the hammock.", ['b', "Are we hiding?"], ['a', "We're venting. Hiding's for later."]),
      S("{a} and {b} are lying by the pool, and {a} has been quiet for a while.", ['b', "Go on. Out with it."], ['a', "How did you know?"], ['b', "You've sighed nine times."]),
      S("{a} sits next to {b} on the stairs, chin on {a.posAdj} knees.", ['b', "Who is it this time?"], ['a', "You know who."]),
      S("{a} walks into the gym, where {b} is pretending to work out.", ['a', "Put that down. I need you."], ['b', "Thank God. I hate that thing."]),
    ],
    moan: [
      R(['a', "Sometimes I feel like I'm the one doing all the work with {pa}. The chats, the effort, the little things. I'm tired."]),
      R(['a', "{pa} is lovely. Everyone keeps telling me {pa} is lovely. I know {pa} is lovely. I just want to feel something more than lovely."]),
      R(['a', "I asked {pa} a simple question today and got a shrug. A shrug. I don't know what to do with a shrug."]),
      R(['a', "It's like we're in a couple on paper, and I'm not sure we're in one anywhere else."]),
      R(['a', "Every time I try to have a deep chat with {pa}, it turns into a joke. I like jokes. I don't want everything to be a joke."]),
      R(['a', "I just want {pa} to choose me. Not because it's easy. Because it's me."]),
      R(['a', "I feel like I'm always the one checking in. Are you okay? How are we doing? Nobody checks in on me."]),
      R(['a', "Maybe I'm being dramatic. But I'd rather be dramatic in here than silent at a recoupling."]),
    ],
    answer: [
      R(['b', "You're not being dramatic. You're being honest. They're different things."], ['a', "Are they?"], ['b', "Mostly."]),
      R(['b', "Do you want my advice, or do you just want me to agree with you?"], ['a', "Agree with me first. Then advice."]),
      R(['b', "Write down three things you love about {pa} and three things you don't. See which list is longer."], ['a', "That's very organised of you."]),
      R(['b', "I think you already know what you want to do. You just want someone to say it's okay."]),
      R(['b', "If a friend said all this to you, what would you tell them?"], ['a', "To have a chat with {pa}."], ['b', "There you go."]),
      R(['b', "It's allowed to be hard. It doesn't mean it's wrong."]),
    ],
    close: [
      BEAT("{a} gets up, stretches, and looks across the garden at {pa} for a long moment."),
      R(['a', "Don't say anything to anyone."], ['b', "I won't. Go on."]),
      BEAT("{b} gives {a} a hug, and {a} goes off to find {pa}, looking a bit braver."),
      R(['b', "Let me know how it goes."], ['a', "You'll be the first."]),
      BEAT("{a} stays put a little longer, working up to it."),
    ],
  },
};

export const DEBRIEF_VOLUME_2 = {
  moves: {
    open: [
      S("{Where}, {a} sits down and lets out a breath {a} has been holding all night.", ['b', "Well, that was a lot."], ['a', "That was everything."]),
      S("{Where}, {b} pats the space next to {b.obj}, and {a} drops into it.", ['b', "Debrief. Now."], ['a', "Give me one second to breathe."]),
      S("{Where}, {a} is still in {a.posAdj} going-out clothes and too tired to change.", ['b', "Talk to me."], ['a', "I don't know where to start."], ['b', "Start anywhere."]),
      S("{Where}, {a} and {b} sit close, voices low.", ['a', "Did tonight really just happen?"], ['b', "It really did."]),
    ],
    push: [
      R(['b', "Are you going to be okay tonight?"], ['a', "I'll be okay. Ask me again in the morning."]),
      R(['a', "What would you have done?"], ['b', "Honestly? Probably the same as you. Maybe louder."]),
      R(['b', "Promise me you won't lie awake thinking about it."], ['a', "I can't promise that."], ['b', "Try."]),
      R(['a', "Do you think people will think less of me after tonight?"], ['b', "No. The ones who matter won't."]),
    ],
    close: [
      BEAT("{a} rests {a.posAdj} head on {b}'s shoulder, and they sit like that for a while."),
      R(['b', "Tomorrow's a new day."], ['a', "Tomorrow's a new mess."]),
      BEAT("Somebody calls up for them to come to bed, and they ignore it for ten more minutes."),
      R(['a', "Same time tomorrow?"], ['b', "Hopefully not. One of these nights is enough."]),
    ],
  },
};

export const BLOWUP_VOLUME_2 = {
  moves: {
    push: [
      R(['a', "You don't even look sorry."], ['b', "Because I'm not going to stand here and grovel."], ['a', "Nobody's asking you to grovel. I'm asking you to care."]),
      R(['b', "You're blowing this way out of proportion."], ['a', "Am I? Ask anyone. Go on. Ask anyone in this garden."]),
      R(['a', "I trusted you. Do you understand that? I actually trusted you."], ['b', "And I never asked you to."]),
      R(['b', "Can we just talk about this later?"], ['a', "Later? You've had days. Later's gone."]),
    ],
    crack: [
      R(['a', "Don't you dare cry. Don't you dare make this about you."]),
      R(['b', "Everyone thinks you're so perfect. They should see you now."], ['a', "Let them. At least I'm honest."]),
      R(['a', "I'm going to say this once. Stay away from me."], ['b', "With pleasure."]),
    ],
    land: [
      BEAT("{a} walks off, and nobody knows whether to follow."),
      BEAT("{b} goes inside and slams the door, and the whole villa jumps."),
      BEAT("For a long time after, nobody says anything at all."),
      BEAT("The others drift away one by one, until it's just the empty daybeds."),
    ],
  },
};

export const DATE_VOLUME_2 = {
  moves: {
    open: [
      R(['b', "I nearly fell over on the way in."], ['a', "I saw. Very graceful."], ['b', "Thanks for noticing."]),
      R(['a', "Is it bad that I'm hungry already?"], ['b', "No. I've been thinking about the food since we left."]),
      R(['b', "Let's not talk about the villa. Just for an hour."], ['a', "Deal. What else is there?"], ['b', "Us."]),
      R(['a', "You clean up nicely."], ['b', "Thank you. I tried. I borrowed three things to get this outfit."]),
      R(['b', "This place is ridiculous."], ['a', "I know. I'm trying not to stare at it and ignore you."]),
      R(['a', "Okay. Ground rules. No talking about anyone else back there."], ['b', "Easy. I only want to talk about you."]),
    ],
    why: [
      R(['a', "Why you? Because you make me laugh, and I wanted to see if you could do it away from everyone."], ['b', "And?"], ['a', "So far, so good."]),
      R(['a', "Honestly? I just wanted an afternoon with you. No big reason. That's the reason."]),
      R(['a', "You're the one I keep wondering about. I thought I'd better stop wondering."], ['b', "And start asking?"]),
      W({ bTaken: true }, ['a', "I know you're with {pb}. I'm not here to start trouble. I just wanted to know you better."], ['b', "That's honest."]),
    ],
  },
};

export const COMFORT_VOLUME_2 = {
  moves: {
    find: [
      S("{a} finds {b} curled up on the hammock with a blanket over {b.posAdj} head.", ['a', "Is there someone under there?"], ['b', "No."], ['a', "Can I come under?"]),
      S("{a} finds {b} sitting in the dark kitchen, staring at a cup of tea.", ['a', "That's gone cold. Let me make you another."]),
      S("{a} sees {b} slip away from the group, and gives it a minute, then follows.", ['a', "I thought you might want company."], ['b', "I don't know what I want."]),
      S("{a} finds {b} by the pool, feet in the water, eyes red.", ['a', "Budge over."], ['b', "I'm a mess."], ['a', "I like messes."]),
    ],
    lift: [
      R(['a', "Want to hear the worst thing that's happened to me in here? It'll make you feel better."], ['b', "Go on."], ['a', "I walked into the glass door twice on day one. Twice."]),
      R(['a', "Shall we do a face mask? Nothing gets better without a face mask."], ['b', "That's not true."], ['a', "It's a little bit true."]),
      R(['a', "I'll do you a deal. You stop crying, I'll stop singing."], ['b', "You weren't singing."], ['a', "I'm about to start."]),
    ],
    close: [
      BEAT("{a} stays with {b} until {b} falls asleep."),
      R(['b', "I'm glad it was you who found me."], ['a', "So am I."]),
      BEAT("They go back to the others arm in arm, and nobody asks any questions."),
      BEAT("{a} makes {b} a fresh cup of tea, and sits with {b.obj} while {b} drinks it."),
    ],
  },
};

export const DUMP_GOODBYE_VOLUME = {
  moves: {
    steps: [
      { when: { withB: false }, stage: "{a} hugs everyone one by one, and leaves {a.posAdj} closest friends till last.", turns: [] },
      { when: { withB: false }, stage: "{a} stands at the gate with {a.posAdj} bags, looking back at the pool.", turns: [] },
      { when: { withB: false }, stage: "{a} takes one last look at the villa from the top of the steps.", turns: [] },
    ],
    leave: [
      { when: { withB: false }, turns: [], beat: "The gate closes, and the villa feels one person quieter." },
      { when: { withB: false }, turns: [], beat: "{a} waves until the very last second, then disappears." },
      { when: { withB: false }, turns: [], beat: "Somebody starts to clap, and the rest of the villa joins in as {a} walks away." },
    ],
  },
};

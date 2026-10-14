// ══════════════════════════════════════════════════════════════════════
// ch/script/lines/final.js — the two-day final
// ══════════════════════════════════════════════════════════════════════
//
// The final (js/ch/final.js): alliances end at the start line, the first
// checkpoint, the instant elimination, the overnight box (comfort for the
// fastest, extra tiles for their rivals), the ride-to-the-final pact paying
// out or breaking on the puzzle, and TJ crowning the champions.

export default {
  'final-start.any': [
    { id: 'fs.1', turns: [
      { by: 'tj', say: "Look at you! The last ones standing! Welcome to the final, my friends! Two days, no sleep, and somebody walks away a champion! LET'S GET WEIRD!" },
      { by: 'a', say: "I can't believe I'm actually here.", v: { loud: ['WE MADE IT! WE ACTUALLY MADE IT!'], sharp: ['Finally. Let\'s finish this.'], soft: ['I\'m shaking. I can\'t believe it.'] } },
      { by: 'a', conf: "Every alliance is over now. Everybody I worked with is somebody I have to beat.", v: { soft: ['I\'ve made real friends here. Now I have to try to beat them.'], sharp: ['No more friends. Just a finish line.'] } },
    ] },
    { id: 'fs.2', turns: [
      { by: 'tj', say: "This is it, champs! The final! No votes, no call-outs, no drama. Okay, a LITTLE drama. Mostly just pain!" },
      { by: 'b', say: "Let's go!", v: { loud: ['LET\'S GO!'], soft: ['Good luck, everybody. I mean it.'] } },
      { by: 'b', conf: "Every elimination, every vote, every night I couldn't sleep was for this.", v: { odd: ['I\'ve trained for this my whole life. Okay, my whole season.'] } },
    ] },
    { id: 'fs.3', turns: [
      { by: 'tj', say: "Here's the deal, people. You race, you suffer, you race some more. First across the line wins it all. Any questions? Don't care! GO!" },
      { by: 'a', conf: "I didn't come all this way to finish second.", v: { soft: ['Whatever happens, I\'m proud of myself.'] } },
    ] },
  ],
  'instant-elimination.any': [
    { id: 'ie.1', turns: [
      { by: 'tj', say: "Surprise! The two slowest from that checkpoint aren't done yet. Instant elimination, right here, right now! Loser goes home!" },
      { by: 'b', say: "Are you serious? Now?", v: { loud: ['RIGHT NOW?! Are you kidding me?!'] } },
      { beat: '{a} wins it. {b} drops to the ground.' },
      { by: 'tj', say: "{a}, you're still in this final! {b}, you came so far, buddy. I'm sorry. You're done." },
      { by: 'b', conf: "I made it to the final and went home before the first night. That's going to haunt me.", v: { sharp: ['I lost a sprint. A sprint. After everything.'], soft: ['I\'m still proud. I just wish it had gone differently.'] } },
    ] },
    { id: 'ie.2', turns: [
      { by: 'tj', say: "Instant elimination! Ring the bell first, you stay! Lose, and you're on the next boat!" },
      { by: 'a', conf: "Nobody told us about this. My heart was in my throat the whole time.", v: { loud: ['I\'m STILL HERE!'] } },
    ] },
    { id: 'ie.3', turns: [
      { by: 'tj', say: "{b}, the final ends here for you. You should be really proud of how far you got." },
      { by: 'b', say: "Thanks, TJ." },
      { by: 'a', conf: "I beat {b} to stay in the final. I'll feel bad about it later. Right now I've got a race to run.", v: { soft: ['I feel terrible for {b}. I really do.'] } },
    ] },
  ],
  'overnight.any': [
    { id: 'on.1', turns: [
      { by: 'tj', say: "Okay, champs! Tonight you don't sleep. You stay out here, on this mountain, until morning. Get comfy. Or don't. You can't." },
      { by: 'a', say: "It's freezing.", v: { loud: ['IT\'S FREEZING!'], soft: ['I can\'t feel my hands.'] } },
      { by: 'b', say: "Just talk to me. Keep each other awake.", v: { sharp: ['Stop complaining. Complaining makes it colder.'] } },
      { by: 'a', conf: "This is the part nobody sees on TV. Hours of nothing, in the cold, trying not to quit.", v: { odd: ['I\'m friends with a rock now. The rock gets it.'] } },
    ] },
    { id: 'on.2', turns: [
      { beat: 'Darkness, wind, and a small fire that nobody is allowed near.' },
      { by: 'a', conf: "Everything in my body is telling me to stop. I'm not stopping. Not now.", v: { soft: ['I keep thinking of home. That\'s what keeps me going.'] } },
    ] },
    { id: 'on.3', turns: [
      { by: 'c', say: "What time do you think it is?" },
      { by: 'a', say: "Don't ask that. Never ask that.", v: { odd: ['It\'s cold o\'clock.'] } },
    ] },
  ],
  'overnight-sabotage.any': [
    { id: 'os.1', turns: [
      { by: 'tj', say: "The faster you emptied your box, the comfier your night. And the first ones out get to dump extra tiles on somebody else. Choose wisely!" },
      { by: 'a', say: "Extra tiles go to {b}.", v: { sharp: ['{b}. Enjoy.'], loud: ['{b}! All of them! Every single one!'] } },
      { by: 'b', say: "Of course they do.", v: { loud: ['Are you SERIOUS?!'] } },
      { by: 'b', conf: "{a} made my night harder on purpose. I'm going to remember that at the finish line.", v: { soft: ['I didn\'t expect {a} to do that to me.'] } },
    ] },
    { id: 'os.2', turns: [
      { by: 'a', conf: "Giving {b} extra tiles wasn't personal. It was the final. Okay, it was a little personal.", v: { soft: ['I felt bad. For about a second.'] } },
    ] },
    { id: 'os.3', turns: [
      { by: 'b', conf: "{a} could have picked anyone and picked me. Fine. I'll empty every last tile and still beat {a}.", v: { loud: ['I\'ll empty EVERY tile!'] } },
    ] },
  ],
  'overnight-quit.any': [
    { id: 'oq.1', turns: [
      { by: 'a', say: "TJ. I'm done. I can't do it.", v: { soft: ['I\'m sorry. I can\'t do this anymore.'] } },
      { by: 'tj', say: "You're quitting? IN THE FINAL? Buddy. Buddy, no. Okay. Yes. You're out. I'm heartbroken and also kind of mad." },
      { by: 'a', conf: "I made it so far. I just couldn't make it through the night.", v: { sharp: ['I know what everyone will say. I don\'t care. My body was done.'] } },
    ] },
    { id: 'oq.2', turns: [
      { beat: '{a} stands up in the dark and walks toward the medic tent.' },
      { by: 'a', conf: "I'm done. I gave this game everything I had, and tonight I ran out.", v: { soft: ['I\'m so sorry to everybody who believed in me.'] } },
    ] },
    { id: 'oq.3', turns: [
      { by: 'tj', say: "And we've lost one. {a} has called it. One fewer champion-in-waiting, people!" },
    ] },
  ],
  'final-pact-help.any': [
    { id: 'ph.1', turns: [
      { beat: 'At the puzzle station, {a} leans over and points at one piece.' },
      { by: 'a', say: "That one. Go.", v: { soft: ['There, that one! You\'ve got it!'], loud: ['THAT ONE! GO GO GO!'] } },
      { by: 'b', conf: "{a} promised we'd get each other to the end. {a} meant it. I won't forget that.", v: { sharp: ['A deal kept. Rarest thing in this game.'], soft: ['I almost cried at the puzzle station.'] } },
    ] },
    { id: 'ph.2', turns: [
      { by: 'a', conf: "{b} and I aren't racing each other, so helping {b} costs me nothing. Keeping my word costs me nothing either.", v: { soft: ['I\'d help {b} even if it did cost me.'] } },
    ] },
    { id: 'ph.3', turns: [
      { by: 'b', say: "Thank you. Seriously." },
      { by: 'a', say: "Final. Like we said.", v: { loud: ['FINAL! Like we SAID!'] } },
    ] },
  ],
  'final-pact-broken.any': [
    { id: 'pb2.1', turns: [
      { by: 'b', say: "Are you going to help me or not?", v: { loud: ['HELLO?! A little help?!'] } },
      { by: 'a', say: "Sorry. Not today.", v: { sharp: ['Every person for themselves now.'], soft: ['I\'m sorry. I can\'t right now.'] } },
      { by: 'b', conf: "We had a deal. All the way to the end. Turns out the end was where {a} stopped caring.", v: { soft: ['I trusted {a} with everything. Even at the end.'] } },
    ] },
    { id: 'pb2.2', turns: [
      { by: 'a', conf: "I know we said we'd help each other. But at the final, I'm racing the clock, and the clock doesn't care about promises.", v: { soft: ['I feel awful. I\'m still doing it.'] } },
    ] },
    { id: 'pb2.3', turns: [
      { by: 'b', conf: "{a} walked right past me at the puzzle. I saw it. I'll always remember it.", v: { loud: ['{a} walked RIGHT PAST me!'] } },
    ] },
  ],
  'champions.any': [
    // a gender-blind season crowns one
    { id: 'cp.0', turns: [
      { by: 'tj', say: "After two days, no sleep, and one very long finish line, your champion of the Blue Lagoon... {a}!" },
      { by: 'a', say: "I did it! I really did it!", v: { loud: ['I DID IT! I REALLY DID IT!'], sharp: ['I said I would. I did.'], soft: ['I can\'t stop shaking. Thank you. Thank you.'] } },
      { by: 'a', conf: "Every person in that villa wanted this. I wanted it more.", v: { odd: ['I\'m going to frame my sweaty shirt.'] } },
    ] },
    { id: 'cp.1', turns: [
      { by: 'tj', say: "Ladies and gentlemen, after everything, your champions! {a}! {b}! I'm crying! I'm actually crying!" },
      { by: 'a', say: "I did it! I actually did it!", v: { loud: ['I DID IT! I ACTUALLY DID IT!'], sharp: ['I told everybody I would. Now they have to believe it.'], soft: ['I can\'t stop crying. I can\'t believe it.'] } },
      { by: 'b', say: "We did it!", v: { soft: ['Thank you. Thank you, everybody.'], sharp: ['Champion. Say it with me. Champion.'] } },
      { by: 'a', conf: "Every vote, every elimination, every night I thought about going home. It was all worth it.", v: { odd: ['I\'m going to sleep for a week. Then I\'m going to brag for a year.'] } },
    ] },
    { id: 'cp.2', turns: [
      { by: 'tj', say: "Two days, no sleep, and one finish line. {a} and {b}, you are the champions of the Blue Lagoon!" },
      { by: 'b', conf: "I came in with nothing guaranteed. I'm leaving as a champion.", v: { loud: ['CHAMPION! Somebody get me a microphone!'] } },
    ] },
    { id: 'cp.3', turns: [
      { by: 'tj', say: "Nobody outran you! Nobody outlasted you! {a}! {b}! Champions!" },
      { by: 'a', say: "Thank you, TJ!", v: { loud: ['I LOVE YOU, TJ!'] } },
    ] },
  ],
};

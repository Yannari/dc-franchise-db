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
      { by: 'a', conf: "Every alliance is over now. Everybody I worked with is somebody I have to beat.", v: { soft: ['I\'ve made real friends here. Now I have to try to beat them.'], sharp: ['No more friends now. I\'m here to win.'] } },
    ] },
    { id: 'fs.2', turns: [
      { by: 'tj', say: "This is it, champs! The final! No more votes, no more call-outs. Just you, the course and the clock!" },
      { by: 'b', say: "Let's go!", v: { loud: ['LET\'S GO!'], soft: ['Good luck, everybody. I mean it.'] } },
      { by: 'b', conf: "Every elimination, every vote, every night I couldn't sleep was for this.", v: { odd: ['I\'ve been waiting for this all season.'] } },
    ] },
    { id: 'fs.3', turns: [
      { by: 'tj', say: "Here's the deal, people. You race, you suffer, you race some more. First across the line wins it all. Any questions? Don't care! GO!" },
      { by: 'a', conf: "I didn't come all this way to finish second.", v: { soft: ['Whatever happens, I\'m proud of myself.'] } },
    ] },
    // written long from the start (the long cut, 2026-10-16): TJ explains the whole final before it starts
    { id: 'fs.4', turns: [
      { beat: 'The finalists line up on the field. TJ walks out in front of them with his arms wide open.' },
      { by: 'tj', say: "Look at you! The last ones standing! Welcome to the final of the Blue Lagoon!" },
      { by: 'tj', say: "Here's how it works. Two days. Five checkpoints. A night in between with no sleep." },
      { by: 'tj', say: "Every checkpoint gives points. First in your division gets the most, last gets the least. We add it all up at the end." },
      { by: 'a', say: "And the most points wins?" },
      { by: 'tj', say: "The most points wins. One man, one woman. Champions." },
      { by: 'b', say: "Let's go. I've been waiting all season for this." },
      { by: 'x', opt: 1, say: "Is anybody else's heart about to come out of their chest?" },
      { by: 'a', conf: "Every alliance is over now. Everybody I worked with is somebody I have to beat." },
    ] },
    { id: 'fs.5', turns: [
      { by: 'tj', say: "Good morning, finalists! Who's ready to suffer?" },
      { by: 'a', say: "Nobody's ready to suffer, TJ." },
      { by: 'tj', say: "Great answer! Five checkpoints. Points for every one. And one long cold night in the middle." },
      { by: 'tj', say: "And somewhere in there, there might be a surprise for the ones at the bottom of the board." },
      { by: 'b', say: "What kind of surprise?" },
      { by: 'tj', say: "The kind you don't want. Stay off the bottom." },
      { by: 'y', opt: 1, say: "Great. Love that." },
      { by: 'b', conf: "Every elimination, every vote, every night I couldn't sleep was for this." },
    ] },
    { id: 'fs.6', turns: [
      { beat: 'The finalists eye each other on the start line. Nobody is smiling.' },
      { by: 'a', say: "May the best one win." },
      { by: 'b', say: "Oh, the best one will." },
      { by: 'tj', say: "Love the energy! Here's the deal. Five checkpoints over two days, points for every one, most points wins." },
      { by: 'tj', say: "No votes. No call-outs. No alliances. Just you against everybody else." },
      { by: 'a', say: "Finally." },
      { by: 'a', conf: "I've waited all season to stop playing politics and just race. Now everybody finds out who's actually good." },
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
      { by: 'b', say: "Just talk to me. Keep each other awake.", v: { sharp: ['Stop thinking about it. It only makes it worse.'] } },
      { by: 'a', conf: "This is the part nobody sees on TV. Hours of nothing, in the cold, trying not to quit.", v: { odd: ['I\'ve been talking to a rock for an hour. I think I\'m losing it.'] } },
    ] },
    { id: 'on.2', turns: [
      { beat: 'It\'s dark and windy, and nobody has slept.' },
      { by: 'a', conf: "Everything in my body is telling me to stop. I'm not stopping. Not now.", v: { soft: ['I keep thinking of home. That\'s what keeps me going.'] } },
    ] },
    { id: 'on.3', turns: [
      { by: 'c', say: "What time do you think it is?" },
      { by: 'a', say: "Don't ask that. Never ask that.", v: { odd: ['It\'s late and it\'s cold. That\'s all I know.'] } },
    ] },
  ],
  // the first of the night has TJ explain the box; the rest do not explain it again (read 2026-10-16: TJ's rules
  // aired on the third, after two confessionals about tiles nobody had been told about)
  'overnight-sabotage.first': [
    { id: 'os.1', turns: [
      { by: 'tj', say: "The faster you emptied your box, the comfier your night. And the first ones out get to dump extra tiles on somebody else. Choose wisely!" },
      { by: 'a', say: "Extra tiles go to {b}.", v: { sharp: ['{b}. Enjoy.'], loud: ['{b}! All of them! Every single one!'] } },
      { by: 'b', say: "Of course they do.", v: { loud: ['Are you SERIOUS?!'] } },
      { by: 'b', conf: "{a} made my night harder on purpose. I'm going to remember that at the finish line.", v: { soft: ['I didn\'t expect {a} to do that to me.'] } },
    ] },
    { id: 'os.5', turns: [
      { by: 'tj', say: "Here's how tonight works. Every one of you has a box of tiles. Empty it, and you get something to sleep on. The first ones done get to give their extra tiles to somebody else." },
      { by: 'a', say: "Then {b} gets mine.", v: { sharp: ["{b}. Every last one."], loud: ["{b}! Have them ALL!"], soft: ["I'm sorry, {b}. They're going to you."] } },
      { by: 'b', say: "Of course it's me.", v: { loud: ["OF COURSE it's me!"], dry: ["Naturally it's me."] } },
      { by: 'b', conf: "{a} could have given those tiles to anybody. {a} picked me, and I know why." },
    ] },
  ],
  'overnight-sabotage.rest': [
    { id: 'os.4', turns: [
      { by: 'a', say: "Extra tiles go to {b}.", v: { sharp: ['{b}. Enjoy.'], loud: ['{b}! All of them! Every single one!'] } },
      { by: 'b', say: "Of course they do.", v: { loud: ['Are you SERIOUS?!'] } },
      { by: 'b', conf: "{a} made my night harder on purpose. I'm going to remember that at the finish line." },
    ] },
    { id: 'os.2', turns: [
      { by: 'a', conf: "Giving {b} extra tiles wasn't personal. It was the final. Okay, it was a little personal.", v: { soft: ['I gave {b} the extra tiles, and I felt bad. For about a second.'] } },
    ] },
    { id: 'os.3', turns: [
      { by: 'b', conf: "{a} could have picked anyone and picked me. Fine. I'll empty every last tile and still beat {a}.", v: { loud: ['{a} dumped the tiles on ME?! Fine! I\'ll empty EVERY tile!'] } },
    ] },
  ],
  // The overnight quit is a moment, with its reason (the user, 2026-10-18: "Sami just quit for seemingly no reason"):
  // a: quits; b: the closest friend out there, if any; c: the one who dumped tiles on a, if still in. final.js picks
  // the reason from the terms of the chance itself.
  'overnight-quit.body': [
    { id: 'oq.1', turns: [
      { beat: '{a} has stopped talking. {a} sits with both arms wrapped around {a.posAdj} knees, shaking.' },
      { by: 'b', opt: 1, say: "Hey. Talk to me. Are you okay?" },
      { by: 'a', say: "I can't feel my hands. I haven't been able to for an hour." },
      { by: 'b', opt: 1, say: "It's a few more hours. The sun comes up and it gets better." },
      { by: 'a', say: "I'm not going to make it to the sun." },
      { by: 'a', say: "TJ. I'm done. I can't do it." },
      { by: 'tj', say: "You're quitting? In the final? Buddy. Okay. If your body says you're done, you're done. You're out." },
      { by: 'a', conf: "I made it this far. I just couldn't make it through the night. My body stopped listening to me." },
    ] },
    { id: 'oq.2', turns: [
      { beat: '{a} tries to stand up, sways, and sits back down hard.' },
      { by: 'b', opt: 1, say: "Whoa. Sit. Just sit for a second." },
      { by: 'a', say: "I've been sitting. It's not getting better. It's getting worse." },
      { beat: '{a} stands up in the dark and walks toward the medic tent.' },
      { by: 'tj', say: "And we've lost one. {a} couldn't take the cold, and {a} is out of the final." },
      { by: 'a', conf: "I gave this game everything I had, and tonight I ran out. I'm not ashamed of that. I'm just sad." },
      { by: 'b', opt: 1, conf: "Watching {a} walk away hurt. I wanted to go with {a.obj}, and I can't. I have to finish this." },
    ] },
  ],
  'overnight-quit.home': [
    { id: 'oqh.1', turns: [
      { beat: '{a} is staring at the fire and has been for a long time.' },
      { by: 'b', opt: 1, say: "You've been quiet all night. What's going on?" },
      { by: 'a', say: "I keep thinking about home. About my family. I haven't talked to them in weeks." },
      { by: 'b', opt: 1, say: "One more day. Then you can call everybody." },
      { by: 'a', say: "I know. I just don't want it anymore. Not like this. I want to go home." },
      { by: 'tj', say: "Are you sure? You're one day from the end." },
      { by: 'a', say: "I'm sure. I'm sorry, TJ." },
      { by: 'a', conf: "Everybody's going to say I gave up the money. Maybe I did. Right now the people I love are worth more than a check." },
    ] },
    { id: 'oqh.2', turns: [
      { by: 'a', say: "Can I tell you something? I don't think I care about winning anymore." },
      { by: 'b', opt: 1, say: "You're tired. Everybody's tired." },
      { by: 'a', say: "It's not tired. I miss home so much it hurts. I've missed it for days." },
      { beat: '{a} gets up and walks over to TJ.' },
      { by: 'tj', say: "{a} is going home. Tonight. Out of the final." },
      { by: 'a', conf: "I'm not quitting on the game. I'm choosing my family. I'd make the same choice again." },
    ] },
  ],
  'overnight-quit.beaten': [
    { id: 'oqb.1', turns: [
      { by: 'a', say: "Be honest. Do I have any chance tomorrow?" },
      { by: 'b', opt: 1, say: "Of course you do. It's not over." },
      { by: 'a', say: "I'm behind. I've been behind all day. Everybody out here is faster than me." },
      { by: 'b', opt: 1, say: "Then you finish. Finishing still counts for something." },
      { by: 'a', say: "Not to me. I didn't come here to finish." },
      { by: 'tj', say: "And that's it for {a}. Out of the final, in the middle of the night." },
      { by: 'a', conf: "I knew around midnight I wasn't going to win. After that, every hour out here was just pain for nothing." },
    ] },
    { id: 'oqb.2', turns: [
      { beat: '{a} watches the others huddle together and does the maths.' },
      { by: 'a', say: "I'm too far behind. Even if I make it through tonight, I'm not catching anybody." },
      { by: 'b', opt: 1, say: "You don't know that. Tomorrow is a whole day." },
      { by: 'a', say: "I do know it. I've seen the points." },
      { by: 'tj', say: "{a} has decided to leave the final. I hate it, but it's {a.posAdj} call." },
      { by: 'a', conf: "I'd rather walk away on my own than crawl to a finish line at the back." },
    ] },
  ],
  'overnight-quit.tiles': [
    { id: 'oqt.1', turns: [
      { beat: '{a} is still digging through the box long after everybody else has finished.' },
      { by: 'a', say: "Why is there still so much in here? I've been at this for hours." },
      { by: 'c', opt: 1, say: "That's the final. Nothing personal." },
      { by: 'a', opt: 'c', say: "You put half of it in there, {c}. It's personal." },
      { by: 'b', opt: 1, say: "Leave it. Get warm. You'll finish it." },
      { by: 'a', say: "I won't. I'm frozen, and the box is still full of tiles. I'm done." },
      { by: 'tj', say: "And we've lost one. {a} is out of the final." },
      { by: 'a', conf: "They buried me in tiles and left me out in the cold. It worked. I hope it was worth it." },
    ] },
    { id: 'oqt.2', turns: [
      { beat: '{a} has a box of tiles in front of {a.obj} that is still half full.' },
      { by: 'b', opt: 1, say: "Do you want me to help you?" },
      { by: 'a', say: "You can't. That's the rule. I have to empty it myself." },
      { by: 'a', say: "And I can't feel my fingers anymore." },
      { by: 'tj', say: "{a} is out of the final. The box won." },
      { by: 'a', conf: "I wasn't beaten tonight. I was buried. There's a difference, and everybody out here knows it." },
      { by: 'c', opt: 1, conf: "I gave {a} the tiles because I wanted {a.obj} gone. I didn't think it would happen before morning." },
    ] },
  ],
  'final-pact-help.any': [
    { id: 'ph.1', turns: [
      { beat: 'At the puzzle station, {a} leans over and points at one piece.' },
      { by: 'a', say: "That one. Go.", v: { soft: ['There, that one! You\'ve got it!'], loud: ['THAT ONE! GO GO GO!'] } },
      { by: 'b', conf: "{a} promised we'd get each other to the end. {a} meant it. I won't forget that.", v: { sharp: ['{a} actually kept the deal. Nobody does that in this game.'], soft: ['I almost cried at the puzzle station.'] } },
    ] },
    { id: 'ph.2', turns: [
      { by: 'a', conf: "{b} and I aren't racing each other, so helping {b.obj} costs me nothing, and I keep my word.", v: { soft: ['I\'d help {b} even if it did cost me.'] } },
    ] },
    { id: 'ph.3', turns: [
      { by: 'b', say: "Thank you. Seriously." },
      { by: 'a', say: "Final. Like we said.", v: { loud: ['FINAL! Like we SAID!'] } },
    ] },
    // written long from the start (the long cut, 2026-10-16)
    { id: 'phx.1', turns: [
      { beat: 'On the climb, {b} slips. {a} stops and holds out a hand.' },
      { by: 'b', say: "Go! Don't wait for me!" },
      { by: 'a', say: "I said we'd do this together. Grab on." },
      { by: 'b', say: "You're losing time." },
      { by: 'a', say: "Then grab on faster." },
      { by: 'b', conf: "People make deals in this game every day and break them every night. {a} kept ours, in the final, when it cost something." },
    ] },
    { id: 'phx.2', turns: [
      { by: 'a', say: "How many pieces have you got left?" },
      { by: 'b', say: "Too many. I can't see it." },
      { by: 'a', say: "Corners first. Look at the corners." },
      { by: 'b', say: "Oh. Oh! Okay. Got it." },
      { by: 'a', conf: "I don't care if helping {b} costs me a minute. I gave my word, and the final is where your word means the most." },
    ] },
    { id: 'phx.3', turns: [
      { beat: '{a} finishes the station first, then turns around and jogs back to {b}.' },
      { by: 'b', say: "What are you doing? Go!" },
      { by: 'a', say: "We finish this one together, like we said." },
      { by: 'b', say: "You're crazy." },
      { by: 'a', say: "Probably. Come on." },
      { by: 'b', conf: "When I get home and people ask me who my real friend in there was, I'm going to say {a}." },
    ] },
  ],
  'final-pact-broken.any': [
    { id: 'pb2.1', turns: [
      { by: 'b', say: "Are you going to help me or not?", v: { loud: ['HELLO?! A little help?!'] } },
      { by: 'a', say: "Sorry. Not today.", v: { sharp: ['Every person for themselves now.'], soft: ['I\'m sorry. I can\'t right now.'] } },
      { by: 'b', conf: "We had a deal to help each other all the way. {a} dropped it as soon as it counted.", v: { soft: ['I trusted {a} with everything. Even at the end.'] } },
    ] },
    { id: 'pb2.2', turns: [
      { by: 'a', conf: "I know we said we'd help each other. But this is the final, and I have to look out for myself.", v: { soft: ['I feel awful. I\'m still doing it.'] } },
    ] },
    { id: 'pb2.3', turns: [
      { by: 'b', conf: "{a} walked right past me at the puzzle. I saw it. I'll always remember it.", v: { loud: ['{a} walked RIGHT PAST me!'] } },
    ] },
    // written long from the start (the long cut, 2026-10-16)
    { id: 'pbx.1', turns: [
      { beat: 'At the puzzle tables, {b} looks over at {a} and waits.' },
      { by: 'b', say: "Hey. The deal. Remember the deal?" },
      { by: 'a', say: "I remember." },
      { by: 'b', say: "So help me." },
      { by: 'a', say: "I can't. I'm not even done with mine." },
      { by: 'b', say: "You've got three pieces left. I can see them." },
      { by: 'b', conf: "We shook on it at a bar, at a pool, on a beach. Every time. And at the one moment it mattered, {a} looked away." },
    ] },
    { id: 'pbx.2', turns: [
      { by: 'a', conf: "I made {b} a promise. I meant it when I made it. But this is the final, and the money is real. I'm sorry." },
      { by: 'b', conf: "I kept waiting for {a} to turn round. {a} never did." },
    ] },
    { id: 'pbx.3', turns: [
      { by: 'b', say: "{a}! Corner piece! Please!" },
      { beat: '{a} finishes the frame and runs for the trail without looking back.' },
      { by: 'b', say: "Wow. Okay. Wow." },
      { by: 'b', conf: "That's the last time I make a deal with anybody in this game. Lesson learned, the expensive way." },
    ] },
  ],
  'champions.one': [
    { id: 'cp.0', turns: [
      { by: 'tj', say: "After two days, no sleep, and one very long finish line, your champion of the Blue Lagoon... {a}!" },
      { by: 'a', say: "I did it! I really did it!", v: { loud: ['I DID IT! I REALLY DID IT!'], sharp: ['I said I would. I did.'], soft: ['I can\'t stop shaking. Thank you. Thank you.'] } },
      { by: 'a', conf: "Every person in that villa wanted this. I wanted it more.", v: { odd: ['I\'m going to frame my sweaty shirt.'] } },
    ] },
    { id: 'cp.5', turns: [
      { by: 'tj', say: "I've counted it twice. I've counted it three times. The winner of the Blue Lagoon is... {a}!" },
      { by: 'a', say: "No way. No way!" },
      { by: 'tj', say: "Way! Champion! Get over here!" },
      { by: 'a', say: "I don't even know what to say." },
      { by: 'tj', say: "Say thank you and go take a nap. You earned it." },
      { by: 'a', conf: "Nobody picked me to win this. I picked me." },
    ] },
  ],
  'champions.two': [
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
    // written long from the start (the long cut, 2026-10-16)
    { id: 'cp.4', turns: [
      { beat: 'TJ stands at the finish arch with the totals in his hand. Nobody breathes.' },
      { by: 'tj', say: "Two days. Five checkpoints. The coldest night of your lives. And your champions of the Blue Lagoon are..." },
      { by: 'tj', say: "{a}! And {b}!" },
      { by: 'a', say: "Are you serious? Are you serious right now?" },
      { by: 'b', say: "We did it! We actually did it!" },
      { by: 'tj', say: "You are the champions! Come here, both of you!" },
      { by: 'a', conf: "I've dreamed about TJ saying my name at the end of a final. It's better than the dream." },
      { by: 'b', conf: "Every vote, every elimination, every night I thought about going home. It was all for this second." },
    ] },
  ],

  // ── the final, taking its time (final.js, 2026-10-16) ──
  'final-cp.cp1': [
    { id: 'fcp.1a', turns: [
      { by: 'tj', say: "{a} takes the Beach Haul! Ten points! {b}, buddy, you're bringing up the rear." },
      { by: 'a', say: "My arms are gone. Completely gone." },
      { by: 'b', say: "That bag split twice. Twice!" },
      { by: 'a', conf: "First checkpoint, first place. Now they all have to chase me." },
      { by: 'b', conf: "Last on the first one. It's a long final. I'm not done, I'm just behind." },
    ] },
    { id: 'fcp.1b', turns: [
      { by: 'tj', say: "Checkpoint one is in the books! {a} on top, and {b} at the bottom of the board." },
      { by: 'b', say: "I'll make it up on the next one." },
      { by: 'tj', say: "You'd better. The bottom of this board has a surprise coming." },
      { by: 'b', conf: "TJ said 'surprise' and smiled. TJ smiling is never good for anybody." },
    ] },
  ],
  'final-cp.cp2': [
    { id: 'fcp.2a', turns: [
      { by: 'tj', say: "{a} cleans every plate first! Ten points, and an iron stomach!" },
      { by: 'a', say: "Don't talk to me about food. Don't say the word food." },
      { by: 'b', say: "I can still taste it. I'm going to taste it forever." },
      { by: 'b', conf: "I've done hard things on this show. Nothing was as hard as that last plate." },
      { by: 'a', conf: "I just thought about home and swallowed. Don't ask me what it was. I don't want to know." },
    ] },
    { id: 'fcp.2b', turns: [
      { by: 'tj', say: "The Banquet is over! Some of you look green. {b}, you look very green." },
      { by: 'b', say: "I'm fine. I'm fine. Give me a second." },
      { by: 'a', say: "Breathe through your nose. It helps." },
      { by: 'a', conf: "Eating that was disgusting. Winning it was beautiful." },
    ] },
  ],
  'final-cp.cp3': [
    { id: 'fcp.3a', turns: [
      { by: 'tj', say: "{a} locks the frame first! On no sleep! That's a champion's brain right there." },
      { by: 'a', say: "I don't even know how I did that." },
      { by: 'b', say: "My frame won't lock. Why won't it lock?" },
      { by: 'tj', say: "Somewhere there's a piece in the wrong place, {b}. Find it." },
      { by: 'b', conf: "I looked at the same twelve pieces for an hour. One of them was upside down. One." },
    ] },
    { id: 'fcp.3b', turns: [
      { by: 'tj', say: "The Ridge Puzzle is done! {a} first, {b} last. Look at the board, people. It's getting tight." },
      { by: 'a', conf: "No sleep, and I solved it first. My brain was running on nothing and it still worked." },
      { by: 'b', conf: "That puzzle took everything I had left, and I still finished last on it." },
    ] },
  ],
  'final-cp.cp4': [
    { id: 'fcp.4a', turns: [
      { by: 'tj', say: "{a} touches the dock first! What a swim!" },
      { by: 'a', say: "Is it over? Tell me it's over." },
      { by: 'tj', say: "This part is over. One more to go." },
      { by: 'b', say: "I had to hold onto the buoy for a minute. My arms just stopped." },
      { by: 'b', conf: "I can't feel my shoulders. Tomorrow I'll care. Today I have one more checkpoint." },
    ] },
    { id: 'fcp.4b', turns: [
      { by: 'tj', say: "Everybody's out of the water! {b}, you made it. Barely, but you made it." },
      { by: 'b', say: "Barely counts." },
      { by: 'a', conf: "The lagoon tried to beat me. It didn't. One more leg and I can sleep for a month." },
    ] },
  ],
  'final-cp.cp5': [
    { id: 'fcp.5a', turns: [
      { by: 'a', say: "Is that it? Is that the finish?" },
      { by: 'tj', say: "That's it! You're done! You ran the whole final!" },
      { by: 'b', say: "I can't feel my legs. I can't feel anything." },
      { by: 'a', conf: "I crossed that line, and I didn't even know if I'd won. I just knew I didn't stop." },
    ] },
    { id: 'fcp.5b', turns: [
      { beat: 'One by one the finalists reach the arch and collapse on the grass.' },
      { by: 'tj', say: "Everybody's across! Now catch your breath, because I have the totals right here." },
      { by: 'b', conf: "Two days. No sleep. I gave this final everything. Whatever the number is, I'm proud of that." },
    ] },
  ],
  'overnight-talk.rivals': [
    { id: 'ot.r1', turns: [
      { beat: 'At the fire, {a} and {b} end up across from each other. Nobody else is talking.' },
      { by: 'a', say: "You know you're not winning this, right?" },
      { by: 'b', say: "Says the one who's been shaking for an hour." },
      { by: 'a', say: "It's cold. Everybody's shaking." },
      { by: 'b', say: "Not like you." },
      { by: 'a', say: "We'll see who's shaking at the finish line." },
      { by: 'b', conf: "{a} wants to get in my head the night before the end. Too late. {a} has been in my head all season. I'm used to it." },
    ] },
    { id: 'ot.r2', turns: [
      { by: 'a', say: "Can I say something honestly?" },
      { by: 'b', say: "That'd be a first." },
      { by: 'a', say: "I never liked you. Not from day one." },
      { by: 'b', say: "Feeling's mutual." },
      { by: 'a', say: "Good. Then nobody's going easy on anybody tomorrow." },
      { by: 'b', say: "Was anybody planning to?" },
      { by: 'a', conf: "The alliances are over. All that's left is who you can't stand, and I can't stand {b}." },
    ] },
    { id: 'ot.r3', turns: [
      { beat: '{b} throws a stick on the fire. {a} moves the blanket away from the sparks.' },
      { by: 'a', say: "Watch it." },
      { by: 'b', say: "Or what? You'll put tiles in my box again?" },
      { by: 'a', say: "Maybe I will." },
      { by: 'b', say: "Tomorrow I'm going to pass you on that mountain, and I'm going to wave." },
      { by: 'b', conf: "Petty? Yes. Will I do it? Absolutely." },
    ] },
  ],
  'overnight-talk.friends': [
    { id: 'ot.f1', turns: [
      { beat: '{a} and {b} share a blanket by the fire.' },
      { by: 'a', say: "Can you believe we're here? Day one, I thought I'd be gone in a week." },
      { by: 'b', say: "Me too. Now look at us. Freezing on a mountain." },
      { by: 'a', say: "Whatever happens tomorrow, I'm glad it was you in here." },
      { by: 'b', say: "Don't make me cry. My tears will freeze." },
      { by: 'a', say: "Then I'll just say it once. Thank you." },
      { by: 'b', conf: "Tomorrow we race each other. Tonight {a} is still my best friend in this game." },
    ] },
    { id: 'ot.f2', turns: [
      { by: 'b', say: "What's the first thing you'll eat when this is over?" },
      { by: 'a', say: "Pizza. A whole one. Maybe two." },
      { by: 'b', say: "I'm going to sleep for three days and then eat pizza." },
      { by: 'a', say: "Deal. Pizza on me." },
      { by: 'b', say: "Pizza on whoever wins." },
      { by: 'a', say: "Then pizza on me." },
      { by: 'a', conf: "Talking about pizza at four in the morning is the only thing keeping me sane." },
    ] },
    { id: 'ot.f3', turns: [
      { by: 'a', say: "Talk to me. Keep me awake." },
      { by: 'b', say: "About what?" },
      { by: 'a', say: "Anything. Home. Your dog. Anything." },
      { by: 'b', say: "Okay. My dog is called Biscuit, and Biscuit is the best dog in the world." },
      { by: 'a', say: "Tell me everything about Biscuit." },
      { beat: 'They talk about Biscuit until the sky starts to go grey.' },
      { by: 'a', conf: "I don't think I'd have made it through the night without {b}. Or without Biscuit." },
    ] },
  ],
  'overnight-talk.comedy': [
    { id: 'ot.c1', turns: [
      { beat: 'Three in the morning. {a} stands up and starts doing jumping jacks.' },
      { by: 'b', say: "What are you doing?" },
      { by: 'a', say: "Staying warm. Join me." },
      { by: 'b', say: "I'm not doing jumping jacks at three in the morning." },
      { by: 'a', say: "Then enjoy freezing." },
      { beat: 'Five minutes later, {b} is doing jumping jacks too.' },
      { by: 'b', conf: "I'm not proud of it. But I'm warm." },
    ] },
    { id: 'ot.c2', turns: [
      { by: 'a', say: "I've decided I'm going to talk to this rock until morning." },
      { by: 'b', say: "Does the rock talk back?" },
      { by: 'a', say: "The rock is a great listener." },
      { by: 'b', say: "Better than you." },
      { by: 'a', say: "The rock agrees with that." },
      { by: 'b', conf: "{a} has completely lost it out here, and honestly, it's the best entertainment I've had all season." },
    ] },
    { id: 'ot.c3', turns: [
      { by: 'a', say: "Okay, everybody, campfire song. I'll start." },
      { by: 'b', say: "Please don't." },
      { beat: '{a} sings anyway. It is very bad and very loud.' },
      { by: 'b', say: "Somebody quit so I can get off this mountain." },
      { by: 'a', conf: "Morale is part of the game. I sang for the team. Nobody thanked me." },
    ] },
  ],
  'final-podium.any': [
    { id: 'fpo.1', turns: [
      { by: 'tj', say: "Everybody, gather round. Two days, five checkpoints, one long night. I've added up every point." },
      { by: 'a', conf: "My heart was going faster at that moment than at any point on the whole mountain." },
    ] },
    { id: 'fpo.2', turns: [
      { by: 'tj', say: "Okay. Stand up, all of you. It's time to find out where you finished." },
      { by: 'a', conf: "You don't know the totals while you're running. You only know when TJ tells you." },
    ] },
  ],
  'final-congrats.gracious': [
    { id: 'fcg.g1', turns: [
      { by: 'a', say: "Come here. You earned that." },
      { by: 'b', say: "You pushed me the whole way. I wouldn't have won without you behind me." },
      { by: 'a', say: "Next time it's mine." },
      { by: 'b', say: "Next time I'll be waiting." },
      { by: 'a', conf: "Second hurts. But I lost to the best, and I can live with that." },
    ] },
    { id: 'fcg.g2', turns: [
      { beat: '{a} walks over and hugs {b} before anybody else can.' },
      { by: 'a', say: "Champion. Say it. It's yours." },
      { by: 'b', say: "I can't believe it." },
      { by: 'a', say: "Believe it. You were better today." },
      { by: 'b', conf: "{a} was the first person to hug me. That means more than {a} knows." },
    ] },
    { id: 'fcg.g3', turns: [
      { by: 'a', say: "I hate that you won." },
      { by: 'b', say: "I know." },
      { by: 'a', say: "And I'm really happy for you." },
      { by: 'b', say: "I know that too." },
      { by: 'a', conf: "I wanted it so badly. But if anybody was going to beat me, I'm glad it was {b}." },
    ] },
  ],
  'final-congrats.bitter': [
    { id: 'fcg.b1', turns: [
      { by: 'b', say: "Good race." },
      { by: 'a', say: "Yeah. Congrats." },
      { by: 'b', say: "You don't sound like you mean it." },
      { by: 'a', say: "Give me a minute. I'll mean it next year." },
      { by: 'a', conf: "I know I should be gracious. I'm not there yet. Ask me in a week." },
    ] },
    { id: 'fcg.b2', turns: [
      { beat: '{a} shakes {b}\'s hand and walks straight off to sit alone.' },
      { by: 'a', conf: "Everybody's celebrating {b}. I was right there. One checkpoint. One bad checkpoint, and it's {b} with the title instead of me." },
    ] },
    { id: 'fcg.b3', turns: [
      { by: 'a', say: "Enjoy it. You got lucky on the swim." },
      { by: 'b', say: "Luck doesn't run five checkpoints." },
      { by: 'a', say: "We'll see next time." },
      { by: 'b', conf: "{a} can't even say congratulations. That's fine. I've got the title. {a} has an excuse." },
    ] },
  ],
  'final-lastword.instant': [
    { id: 'flw.i1', turns: [
      { by: 'a', conf: "I made it to the final, and I'm going home before the first night. I'm going to replay that sprint for the rest of my life." },
    ] },
    { id: 'flw.i2', turns: [
      { by: 'a', conf: "Nobody warned us about an instant elimination. One sprint, and a whole season is over. I'm proud of how far I got. I'm sick about how it ended." },
    ] },
    { id: 'flw.i3', turns: [
      { by: 'a', conf: "I came here as somebody nobody expected to see in the final. I got there. That's something nobody can take back." },
    ] },
  ],
  'final-lastword.second': [
    { id: 'flw.s1', turns: [
      { by: 'a', conf: "Second place in the final of The Challenge. Two years ago I'd have cried happy tears. Right now I'm just crying." },
    ] },
    { id: 'flw.s2', turns: [
      { by: 'a', conf: "I was close enough to see it. That's what hurts. Second is the first one who didn't win." },
    ] },
    { id: 'flw.s3', turns: [
      { by: 'a', conf: "I'm going to go home, sleep for a week, and then start training for next time. I'm coming back for that title." },
    ] },
  ],
  'final-lastword.finished': [
    { id: 'flw.f1', turns: [
      { by: 'a', conf: "I didn't win, but I finished. Every checkpoint, every bite, the whole night on that mountain. Nobody can take that from me." },
    ] },
    { id: 'flw.f2', turns: [
      { by: 'a', conf: "I came here to win and I didn't. But I'm walking off this mountain a different person from the one who walked onto that plane." },
    ] },
    { id: 'flw.f3', turns: [
      { by: 'a', conf: "Not the result I wanted. But I ran a final. Most people who've done this show never get to say that." },
    ] },
    { id: 'flw.f4', turns: [
      { by: 'a', conf: "My body is broken and my heart is a little broken too. Give me a year. I'll be back." },
    ] },
  ],
};

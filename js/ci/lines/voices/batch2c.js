// Voice versions, batch 2c: reacting aloud to the blocking and to the goodbye videos (the user, 2026-10-19: out-loud
// lines first). Same rules as batch1.js. No brand names anywhere.
export const VOICES = [
  // ── safe, when somebody else is blocked ───────────────────────────────
  ['block.react.relief.m01', "Still here. Still here. Okay.", {
    hype: "STILL HERE! STILL HERE! Okay!", dry: "Still here. Still here. Okay. Breathing now.", blunt: "Still here. Good.",
    goofy: "Still here! Still here! Okay! My legs are jelly!", shy: "Still here. Oh, still here. Okay.", chill: "Still here. Still here. Okay.",
    catty: "Still here. Obviously.", diva: "Still here, darlings! The show goes on!", stoic: "Still here." }],
  ['block.react.relief.m02', "That was the worst minute of my life and I'm still standing.", {
    hype: "WORST minute of my LIFE and I'm STILL STANDING!", dry: "Worst minute of my life. Still standing. Barely.", blunt: "Worst minute ever. Still standing.",
    goofy: "Worst minute of my life! I'm still standing! On wobbly legs!", shy: "That was the worst minute of my life. I'm still here though.", chill: "Worst minute ever. Still standing.",
    catty: "Worst minute of my life. And I'm still standing. As expected.", diva: "The longest minute of my career, darling. Still standing.", stoic: "Worst minute. Still standing." }],
  ['block.react.relief.m03', "I'm safe. Oh, I'm so sorry, {b}.", {
    hype: "I'm SAFE! Oh, I'm SO sorry, {b}!", dry: "Safe. Sorry, {b}. Genuinely.", blunt: "I'm safe. Sorry, {b}.",
    goofy: "I'm safe! Oh no, {b}! I'm so sorry! I'll eat a cookie for you!", shy: "I'm safe. Oh, I'm so sorry, {b}.", chill: "I'm safe. Aw, so sorry, {b}.",
    catty: "I'm safe. Sorry, {b}. It happens.", diva: "I'm safe. Oh, {b}, darling, I'm so sorry.", stoic: "Safe. Sorry, {b}." }],
  ['block.react.relief.m04', "I'm okay. {b} isn't. I don't know how to feel.", {
    hype: "I'm OKAY! {b} isn't! I don't know how to FEEL!", dry: "I'm fine. {b} isn't. Feelings: complicated.", blunt: "I'm okay. {b} isn't. Mixed feelings.",
    goofy: "I'm okay! {b} isn't! My feelings are all tangled like headphone cords!", shy: "I'm okay. {b} isn't. I don't know how to feel.", chill: "I'm okay, {b}'s not. Weird feeling.",
    catty: "I'm okay. {b} isn't. I know exactly how to feel.", diva: "I survive, {b} falls, darling. Bittersweet.", stoic: "I'm okay. {b} isn't." }],
  ['block.react.relief.m05', "Not me. Tonight, not me.", {
    hype: "NOT ME! Tonight, NOT ME!", dry: "Not me. Not tonight. Tomorrow's another problem.", blunt: "Not me tonight.",
    goofy: "Not me! Tonight not me! Tomorrow maybe me! Who knows!", shy: "Not me. Not tonight.", chill: "Not me tonight, dude.",
    catty: "Not me. Never me.", diva: "Not tonight, darling. The star shines on.", stoic: "Not me tonight." }],
  ['block.react.relief.01', "Not me. Not me. Oh, thank God.", {
    hype: "NOT ME! NOT ME! Oh, thank GOD!", dry: "Not me. Not me. Thank God. I'm allowed one.", blunt: "Not me. Thank God.",
    goofy: "Not me! Not me! Oh, thank goodness! I'm doing a happy wiggle!", shy: "Not me. Not me. Oh, thank goodness.", chill: "Not me, not me. Phew.",
    catty: "Not me. Not me. Of course not me.", diva: "Not me! Oh, thank heavens, darling!", stoic: "Not me. Good." }],
  ['block.react.relief.02', "Poor {b}. But I'm still here.", {
    hype: "Poor {b}! But I'm STILL HERE!", dry: "Poor {b}. But I'm still here. Priorities.", blunt: "Poor {b}. I'm still here.",
    goofy: "Poor {b}! But I'm still here! I'll keep {b}'s spot warm!", shy: "Poor {b}. But I'm still here.", chill: "Poor {b}. But I'm still here.",
    catty: "Poor {b}. But I'm still here. That's what matters.", diva: "Poor {b}, darling. But I'm still on stage.", stoic: "Poor {b}. I'm still here." }],
  ['block.react.relief.03', "My heart was pounding so hard. {b}. Wow.", {
    hype: "My heart was POUNDING! {b}! WOW!", dry: "My heart was pounding. {b}. Wow. Okay.", blunt: "Heart was pounding. {b}. Wow.",
    goofy: "My heart was pounding like a drum solo! {b}! Wow!", shy: "My heart was pounding so hard. It's {b}. Wow.", chill: "Heart was pounding. {b}. Wow.",
    catty: "My heart was pounding. For nothing. It's {b}.", diva: "My heart was a drumroll, darling. And it's {b}.", stoic: "Heart pounding. {b}. Wow." }],
  ['block.react.relief.w01', "Oh my God. Okay. Okay. I'm still here.", {
    hype: "OH MY GOD! OKAY! I'm STILL HERE!", dry: "Oh my God. Okay. Still here. Somehow.", blunt: "Okay. Still here.",
    goofy: "Oh my gosh! Okay! Okay! I'm still here! Somebody pinch me! Gently!", shy: "Oh my gosh. Okay. I'm still here.", chill: "Oh man. Okay. Still here.",
    catty: "Oh my God. Okay. Still here. As I should be.", diva: "Oh my word, darling. Still here. Still glorious.", stoic: "Okay. Still here." }],
  ['block.react.relief.w02', "I'm safe. I'm so sorry, {b}. But I'm safe.", {
    hype: "I'm SAFE! So sorry, {b}! But I'm SAFE!", dry: "I'm safe. Sorry, {b}. But safe. Mostly I feel safe.", blunt: "I'm safe. Sorry, {b}.",
    goofy: "I'm safe! Sorry, {b}! But safe! I'll send {b} a postcard!", shy: "I'm safe. I'm so sorry, {b}. But I'm safe.", chill: "I'm safe. Sorry, {b}, man. But safe.",
    catty: "I'm safe. Sorry, {b}. Not very, but sorry.", diva: "I'm safe. My condolences, {b}, darling.", stoic: "Safe. Sorry, {b}." }],
  ['block.react.relief.w03', "{b}. Wow. I did not see that coming.", {
    hype: "{b}?! WOW! Did NOT see that coming!", dry: "{b}. Wow. Didn't see that coming. Nobody did, apparently.", blunt: "{b}. Didn't see that coming.",
    goofy: "{b}! Wow! Did not see that coming! Nobody saw that coming! Not even a fortune teller!", shy: "{b}. Wow. I didn't see that coming.", chill: "{b}? Whoa. Didn't see that coming, dude.",
    catty: "{b}. Wow. I did see that coming, actually.", diva: "{b}! A twist, darling! I did not see that coming.", stoic: "{b}. Didn't see it coming." }],
  ['block.react.relief.w04', "I feel bad for {b}. I also feel amazing. Is that bad?", {
    hype: "I feel BAD for {b}! I also feel AMAZING! Is that bad?!", dry: "Bad for {b}. Amazing for me. Is that bad. Probably.", blunt: "Bad for {b}. Great for me.",
    goofy: "I feel bad for {b}! I also feel amazing! Is that bad? It's a sandwich of feelings!", shy: "I feel bad for {b}. I also feel kind of amazing. Is that bad?", chill: "Feel bad for {b}. Also feel amazing. Is that bad?",
    catty: "I feel bad for {b}. I also feel amazing. No, it's not bad.", diva: "Sorrow for {b}, darling, and joy for me. Very operatic.", stoic: "Bad for {b}. Good for me." }],
  ['block.react.relief.w05', "Another week. Thank you, Circle. Thank you.", {
    hype: "ANOTHER WEEK! Thank you, Circle! THANK YOU!", dry: "Another week. Thanks, Circle. I'll try not to waste it.", blunt: "Another week. Thanks.",
    goofy: "Another week! Thank you, Circle! I'd hug you if you had arms!", shy: "Another week. Thank you, Circle. Thank you.", chill: "Another week. Thanks, Circle.",
    catty: "Another week. Thank you, Circle. You have taste.", diva: "Another week! Thank you, Circle, darling! My public!", stoic: "Another week. Thanks." }],
  ['block.react.relief.w06', "That was way too close.", {
    hype: "That was WAY too close!", dry: "That was too close. Far too close.", blunt: "Too close.",
    goofy: "That was way too close! Like a pigeon flying at your face!", shy: "That was way too close.", chill: "Way too close.",
    catty: "That was too close. Somebody's going to pay for that.", diva: "Far too close, darling. My nerves!", stoic: "Too close." }],
  ['block.react.relief.w07', "{b}? Oh, that's gonna shake up the whole building.", {
    hype: "{b}?! That's gonna SHAKE UP the whole building!", dry: "{b}. That's going to shake the whole building. Brace.", blunt: "{b}? That changes everything.",
    goofy: "{b}? That's gonna shake up the whole building! Like a snow globe!", shy: "{b}? Oh, that's going to change a lot.", chill: "{b}? That's gonna shake things up.",
    catty: "{b}? That's going to shake up the building. Good.", diva: "{b}? Darling, that's going to shake the whole production.", stoic: "{b}. That changes things." }],
  ['block.react.relief.w08', "I'm still in this. I'm still in this!", {
    hype: "I'm STILL IN THIS! I'M STILL IN THIS!", dry: "I'm still in this. I'm still in this. Huh.", blunt: "Still in this.",
    goofy: "I'm still in this! I'm still in this! Woo! Somebody throw confetti!", shy: "I'm still in this. I'm still in this.", chill: "Still in this. Still in it!",
    catty: "I'm still in this. Of course I'm still in this.", diva: "I'm still in this, darling! The star endures!", stoic: "Still in." }],
  ['block.react.relief.w09', "Not me. Poor {b}, though. Really.", {
    hype: "NOT ME! Poor {b}, though! Really!", dry: "Not me. Poor {b}. Really. I mean that.", blunt: "Not me. Poor {b}.",
    goofy: "Not me! Poor {b}, though! I'll name a plant after {b}!", shy: "Not me. Poor {b}, though. Really.", chill: "Not me. Poor {b}, though, dude.",
    catty: "Not me. Poor {b}. Well. Poor-ish.", diva: "Not me. Poor {b}, darling. Truly.", stoic: "Not me. Poor {b}." }],
  ['block.react.relief.w10', "Okay, breathe. You're safe. Breathe.", {
    hype: "Okay! BREATHE! You're SAFE! BREATHE!", dry: "Breathe. You're safe. Breathe. Remember how.", blunt: "Breathe. You're safe.",
    goofy: "Okay, breathe! You're safe! Breathe! In through the nose! Out through the snacks!", shy: "Okay. Breathe. You're safe. Breathe.", chill: "Breathe. You're safe. Breathe.",
    catty: "Breathe. You're safe. As you should be.", diva: "Breathe, darling. You're safe. Compose yourself.", stoic: "Breathe. Safe." }],
  // ── blocked yourself ──────────────────────────────────────────────────
  ['block.react.self.01', "Me? It's me?", {
    hype: "ME?! It's ME?!", dry: "Me. It's me. Of course.", blunt: "It's me?",
    goofy: "Me? It's me? Are you sure? Check again!", shy: "Me? It's me?", chill: "Me? Whoa. It's me?",
    catty: "Me? They chose me? Bold.", diva: "Me? The star? It's me?", stoic: "Me." }],
  ['block.react.self.02', "No. Oh, come on.", {
    hype: "NO! Oh, COME ON!", dry: "No. Oh, come on. Really.", blunt: "No. Come on.",
    goofy: "No! Oh, come on! Not fair! Do-over!", shy: "No. Oh, no.", chill: "No. Aw, come on, man.",
    catty: "No. Oh, come on. These people.", diva: "No! Oh, come ON, darling!", stoic: "No." }],
  ['block.react.self.03', "Wow. Okay. Okay. I get it. It's a game.", {
    hype: "WOW! Okay! OKAY! I get it! It's a GAME!", dry: "Wow. Okay. I get it. It's a game. A stupid game.", blunt: "Okay. It's a game. I get it.",
    goofy: "Wow! Okay! I get it! It's a game! Like checkers! But sadder!", shy: "Wow. Okay. I get it. It's a game.", chill: "Wow. Okay. I get it. It's a game.",
    catty: "Wow. Okay. I get it. It's a game. They're bad at it.", diva: "Wow. Okay, darling. It's a game. A cruel, cruel game.", stoic: "Okay. It's a game." }],
  ['block.react.self.04', "Are you serious? After everything?", {
    hype: "Are you SERIOUS?! After EVERYTHING?!", dry: "Are you serious. After everything. Cool.", blunt: "Seriously? After everything?",
    goofy: "Are you serious? After everything? After all the cookies I sent in spirit?", shy: "Are you serious? After everything?", chill: "Are you serious, man? After everything?",
    catty: "Are you serious? After everything I did for these people?", diva: "Are you serious? After everything I gave this show?", stoic: "After everything." }],
  ['block.react.self.05', "Wait. Me? No. No, no, no.", {
    hype: "WAIT! ME?! NO! NO, NO, NO!", dry: "Wait. Me. No. No, no, no. Yes, apparently.", blunt: "Me? No.",
    goofy: "Wait! Me? No! No, no, no! I'm not done! I haven't finished my yogurt!", shy: "Wait. Me? No. No, no, no.", chill: "Wait, me? No, no, no.",
    catty: "Wait. Me? No. That's a mistake.", diva: "Wait. Me? No, darling. No, no, no.", stoic: "Me. No." }],
  ['block.react.self.06', "Of course it's me. Of course it is.", {
    hype: "Of COURSE it's me! Of COURSE!", dry: "Of course it's me. Of course it is.", blunt: "Of course it's me.",
    goofy: "Of course it's me! Of course! My luck is a banana peel!", shy: "Of course it's me. Of course it is.", chill: "Of course it's me.",
    catty: "Of course it's me. Jealousy is a powerful thing.", diva: "Of course it's me, darling. They always come for the star.", stoic: "Of course." }],
  ['block.react.self.07', "Oh. Oh, wow. Okay.", {
    hype: "OH! Oh, WOW! Okay!", dry: "Oh. Wow. Okay.", blunt: "Oh. Okay.",
    goofy: "Oh! Oh, wow! Okay! My brain just did a cartwheel!", shy: "Oh. Oh, wow. Okay.", chill: "Oh. Whoa. Okay, dude.",
    catty: "Oh. Wow. Okay. Interesting choice.", diva: "Oh. Oh, darling. Wow.", stoic: "Okay." }],
  // ── a friend is blocked ───────────────────────────────────────────────
  ['block.react.friend.01', "No! Not {b}! {b} was my person in here!", {
    hype: "NO! NOT {b}! {b} was MY PERSON!", dry: "No. Not {b}. {b} was my person. Great.", blunt: "Not {b}. {b} was my person.",
    goofy: "No! Not {b}! {b} was my person! My snack buddy!", shy: "No. Not {b}. {b} was my person in here.", chill: "No, not {b}! {b} was my person!",
    catty: "Not {b}. {b} was the only one in here I liked.", diva: "No! Not {b}! My co-star, darling!", stoic: "Not {b}. My person." }],
  ['block.react.friend.02', "They took {b}. That's so cold.", {
    hype: "They took {b}?! That's SO COLD!", dry: "They took {b}. Cold. Very cold.", blunt: "They took {b}. Cold.",
    goofy: "They took {b}! That's so cold! Like ice cream in a freezer!", shy: "They took {b}. That's so cold.", chill: "They took {b}. That's cold.",
    catty: "They took {b}. Cold. I'll remember who did it.", diva: "They took {b}, darling. How cold. How cruel.", stoic: "They took {b}. Cold." }],
  ['block.react.friend.03', "Oh, {b}. I'm so sorry.", {
    hype: "Oh, {b}! I'm SO sorry!", dry: "Oh, {b}. I'm sorry. Really.", blunt: "{b}. Sorry.",
    goofy: "Oh, {b}! I'm so sorry! I'm sending you a virtual hug! It's a big one!", shy: "Oh, {b}. I'm so sorry.", chill: "Oh, {b}. So sorry.",
    catty: "Oh, {b}. I'm sorry. You deserved better than these people.", diva: "Oh, {b}, darling. I'm devastated.", stoic: "{b}. Sorry." }],
  ['block.react.friend.04', "{b}? No. Circle, that's not right. That can't be right.", {
    hype: "{b}?! NO! Circle, that can't be RIGHT!", dry: "{b}. No. Circle, that's not right. Recount.", blunt: "{b}? No. That's wrong.",
    goofy: "{b}? No! Circle, that's not right! Check the computer! Turn it off and on again!", shy: "{b}? No. That can't be right.", chill: "{b}? No way. That can't be right.",
    catty: "{b}? No. Circle, that's not right. Somebody made a mistake.", diva: "{b}? No, darling. That can't be the ending.", stoic: "{b}. That's wrong." }],
  ['block.react.friend.05', "I didn't even get to say goodbye to {b}.", {
    hype: "I didn't even get to say GOODBYE to {b}!", dry: "I didn't get to say goodbye to {b}. Typical.", blunt: "Didn't get to say goodbye to {b}.",
    goofy: "I didn't even get to say goodbye to {b}! I had a whole speech! With hand gestures!", shy: "I didn't even get to say goodbye to {b}.", chill: "Didn't even get to say bye to {b}.",
    catty: "I didn't even get to say goodbye to {b}. Rude of the Circle.", diva: "I didn't even get to say goodbye to {b}, darling. No farewell scene.", stoic: "Didn't say goodbye to {b}." }],
  ['block.react.friend.06', "That's my friend. That's my friend they just blocked.", {
    hype: "That's my FRIEND! They just blocked my FRIEND!", dry: "That's my friend. They blocked my friend. Okay.", blunt: "They blocked my friend.",
    goofy: "That's my friend! They blocked my friend! My friend friend!", shy: "That's my friend. They just blocked my friend.", chill: "That's my friend, dude. They blocked my friend.",
    catty: "That's my friend they just blocked. Noted. Very noted.", diva: "That's my friend, darling. They blocked my friend.", stoic: "My friend. Blocked." }],
  // ── a rival is blocked ────────────────────────────────────────────────
  ['block.react.rival.01', "{b}? Oh, bye!", {
    hype: "{b}?! BYE!", dry: "{b}. Bye. Don't let the door hit you.", blunt: "{b}. Bye.",
    goofy: "{b}? Bye! Bye-bye! Toodle-oo!", shy: "Oh. {b}. Bye.", chill: "{b}? Later, man.",
    catty: "{b}? Oh, bye! Bye!", diva: "{b}? Farewell, darling! Exit stage left!", stoic: "{b}. Bye." }],
  ['block.react.rival.02', "Well. I'm not gonna cry about that one.", {
    hype: "Well! I am NOT gonna cry about that one!", dry: "Well. Not crying about that one. Dry eyes.", blunt: "Not crying about that.",
    goofy: "Well! I'm not gonna cry about that one! Maybe a tiny happy tear!", shy: "Well. I'm not going to cry about that one.", chill: "Well, not gonna cry about that one.",
    catty: "Well. I'm not going to cry about that one. Not even a little.", diva: "Well, darling. No tears for that one.", stoic: "Not crying." }],
  ['block.react.rival.03', "{b}. Wow. I didn't even have to lift a finger.", {
    hype: "{b}! WOW! Didn't even lift a FINGER!", dry: "{b}. Wow. Didn't lift a finger. Efficient.", blunt: "{b}. Didn't even lift a finger.",
    goofy: "{b}! Wow! I didn't lift a finger! My fingers are resting! Good job, fingers!", shy: "{b}. Wow. I didn't even have to do anything.", chill: "{b}. Didn't even lift a finger.",
    catty: "{b}. Wow. I didn't even have to lift a finger. Lovely.", diva: "{b}. I didn't even lift a finger, darling. The universe provides.", stoic: "{b}. Didn't lift a finger." }],
  // ── blocked by the numbers ────────────────────────────────────────────
  ['block.react.numbers.01', "Nobody even chose. The numbers just did it.", {
    hype: "NOBODY even chose! The NUMBERS did it!", dry: "Nobody chose. The numbers did it. Math is cold.", blunt: "Nobody chose. Numbers did it.",
    goofy: "Nobody chose! The numbers did it! Numbers are so mean!", shy: "Nobody even chose. The numbers just did it.", chill: "Nobody chose. Just the numbers.",
    catty: "Nobody chose. The numbers did it. The numbers are smarter than most of us.", diva: "No one chose, darling. Fate wrote it.", stoic: "Numbers did it." }],
  ['block.react.numbers.02', "That is so cold. No Hangout, no speeches, just gone.", {
    hype: "That is SO cold! No Hangout! No speeches! Just GONE!", dry: "So cold. No Hangout, no speeches. Gone.", blunt: "Cold. No speeches. Gone.",
    goofy: "That's so cold! No Hangout! No speeches! Just poof! Like a magic trick!", shy: "That's so cold. No speeches. Just gone.", chill: "That's cold. No speeches. Just gone.",
    catty: "That's cold. No Hangout, no speeches. Efficient, I suppose.", diva: "So cold, darling! No farewell, no speech! Just gone!", stoic: "Cold. Just gone." }],
  ['block.react.numbers.03', "{b} didn't even get to plead. That's brutal.", {
    hype: "{b} didn't even get to PLEAD! BRUTAL!", dry: "{b} didn't get to plead. Brutal. Efficient, but brutal.", blunt: "{b} didn't get to plead. Brutal.",
    goofy: "{b} didn't even get to plead! That's brutal! Like losing at a game you didn't know you were playing!", shy: "{b} didn't even get to plead. That's brutal.", chill: "{b} didn't even get to plead, dude. Brutal.",
    catty: "{b} didn't even get to plead. Probably for the best.", diva: "{b} didn't even get a final monologue, darling. Brutal.", stoic: "No plea. Brutal." }],
  ['block.react.numbers.04', "So every rank I gave tonight actually mattered. Every one.", {
    hype: "Every rank I gave tonight MATTERED! EVERY ONE!", dry: "So every rank mattered. Every one. Great. No pressure.", blunt: "Every rank mattered.",
    goofy: "Every rank I gave mattered! Every one! Even the one I gave by accident!", shy: "So every rank I gave actually mattered. Every one.", chill: "Every rank mattered. Every one.",
    catty: "Every rank mattered. Good. I ranked well.", diva: "Every rank mattered, darling. My votes shaped the story.", stoic: "Every rank mattered." }],
  ['block.react.numbers.05', "We all did that. All of us. Together.", {
    hype: "We ALL did that! ALL of us! TOGETHER!", dry: "We all did that. Together. Like a book club, but sad.", blunt: "We all did that.",
    goofy: "We all did that! All of us! Together! Like a group project!", shy: "We all did that. All of us. Together.", chill: "We all did that. Together.",
    catty: "We all did that. Some of us more than others.", diva: "We all did that, darling. An ensemble decision.", stoic: "We all did that." }],
  ['block.react.numbers.06', "Last place, and that's it? Wow. Bye, {b}.", {
    hype: "Last place and that's IT?! WOW! Bye, {b}!", dry: "Last place and that's it. Wow. Bye, {b}.", blunt: "Last place. That's it. Bye, {b}.",
    goofy: "Last place and that's it? Wow! Bye, {b}! Bye-bye!", shy: "Last place, and that's it? Wow. Bye, {b}.", chill: "Last place and that's it? Wow. Bye, {b}.",
    catty: "Last place and that's it. Bye, {b}.", diva: "Last place, and curtain, darling. Bye, {b}.", stoic: "Last place. Bye, {b}." }],
  // ── the one nobody saved ──────────────────────────────────────────────
  ['block.react.unsaved.01', "Everybody got saved except {b}. That is so rough.", {
    hype: "EVERYBODY got saved except {b}! That is SO rough!", dry: "Everybody saved but {b}. Rough.", blunt: "Everyone saved but {b}. Rough.",
    goofy: "Everybody got saved except {b}! That's so rough! Like being picked last for dodgeball!", shy: "Everybody got saved except {b}. That's so rough.", chill: "Everybody saved but {b}. Rough.",
    catty: "Everybody got saved except {b}. Rough. Telling, but rough.", diva: "Everyone saved but {b}, darling. Tragic.", stoic: "Everyone but {b}. Rough." }],
  ['block.react.unsaved.02', "I watched {b}'s name sit there, save after save. I couldn't breathe for {b.obj}.", {
    hype: "I watched {b}'s name sit there, save after save! I couldn't BREATHE!", dry: "I watched {b}'s name sit there, save after save. Couldn't breathe for {b.obj}.", blunt: "Watched {b}'s name sit there. Couldn't breathe.",
    goofy: "I watched {b}'s name sit there, save after save! I held my breath so long I turned purple!", shy: "I watched {b}'s name sit there, save after save. I couldn't breathe for {b.obj}.", chill: "Watched {b}'s name sit there, man. Couldn't breathe for {b.obj}.",
    catty: "I watched {b}'s name sit there, save after save. Nobody wanted {b.obj}.", diva: "I watched {b}'s name sit there, darling, save after save. Unbearable.", stoic: "{b}'s name sat there. Couldn't breathe." }],
  ['block.react.unsaved.03', "Last one standing. The worst place to be standing.", {
    hype: "Last one STANDING! The WORST place to be standing!", dry: "Last one standing. Worst place to stand.", blunt: "Last one standing. Worst place.",
    goofy: "Last one standing! The worst place to be standing! Like the last cookie nobody wants!", shy: "Last one standing. The worst place to be.", chill: "Last one standing, dude. Worst spot.",
    catty: "Last one standing. The worst place to be standing. Somebody had to.", diva: "Last one standing, darling. The cruelest spotlight.", stoic: "Last one standing. Worst place." }],
  ['block.react.unsaved.04', "Every save was a choice not to save {b}. We all watched it happen.", {
    hype: "Every save was a choice NOT to save {b}! We ALL watched it!", dry: "Every save was a choice not to save {b}. We watched. All of us.", blunt: "Every save was a choice not to save {b}.",
    goofy: "Every save was a choice not to save {b}! We all watched it! Like a slow-motion movie!", shy: "Every save was a choice not to save {b}. We all watched it happen.", chill: "Every save was a choice not to save {b}. We all saw.",
    catty: "Every save was a choice not to save {b}. We all watched. Nobody objected.", diva: "Every save was a rejection of {b}, darling. In front of everyone.", stoic: "Every save was a choice. Not {b}." }],
  ['block.react.unsaved.05', "Poor {b}. Nobody picked {b.obj}. Not one person.", {
    hype: "Poor {b}! NOBODY picked {b.obj}! Not ONE person!", dry: "Poor {b}. Nobody picked {b.obj}. Not one person.", blunt: "Poor {b}. Nobody picked {b.obj}.",
    goofy: "Poor {b}! Nobody picked {b.obj}! Not one person! I would've picked {b.obj}! Maybe!", shy: "Poor {b}. Nobody picked {b.obj}. Not one person.", chill: "Poor {b}. Nobody picked {b.obj}.",
    catty: "Poor {b}. Nobody picked {b.obj}. Not one person. That says something.", diva: "Poor {b}, darling. Not a single admirer.", stoic: "Poor {b}. Nobody picked {b.obj}." }],
  // ── the blocking, guessed ─────────────────────────────────────────────
  ['block.react.guess.01', "Who did that? My money is on {b}. Something about {b} today.", {
    hype: "Who DID that?! My money's on {b}! Something about {b} today!", dry: "Who did that. My money's on {b}. Something about {b} today.", blunt: "Who did that? I'd bet on {b}.",
    goofy: "Who did that? My money's on {b}! Something about {b} today! A sneaky vibe!", shy: "Who did that? I think maybe {b}. Something about {b} today.", chill: "Who did that? My money's on {b}.",
    catty: "Who did that? My money's on {b}. {b} has that look today.", diva: "Who did that, darling? My money is on {b}. A villain's glow today.", stoic: "Who did that? {b}, I think." }],
  ['block.react.guess.02', "If I had to bet, I'd say {b} was one of them. But I have no idea.", {
    hype: "If I had to BET, I'd say {b}! But I have NO idea!", dry: "If I had to bet, {b}. But I have no idea. Don't hold me to it.", blunt: "I'd bet {b}. No idea, though.",
    goofy: "If I had to bet, I'd say {b}! But I have no idea! I'm terrible at bets!", shy: "If I had to guess, maybe {b}. But I really don't know.", chill: "If I had to bet, {b}. No idea though.",
    catty: "If I had to bet, {b}. I usually win my bets.", diva: "If I had to wager, darling, {b}. But who knows.", stoic: "Maybe {b}. No idea." }],
  ['block.react.guess.03', "Was it {b}? {b} has been way too quiet today.", {
    hype: "Was it {b}?! {b} has been WAY too quiet today!", dry: "Was it {b}. {b} has been too quiet today. Suspicious.", blunt: "Was it {b}? Too quiet today.",
    goofy: "Was it {b}? {b} has been way too quiet today! Like a mouse in a cheese shop!", shy: "Was it {b}? {b} has been really quiet today.", chill: "Was it {b}? {b}'s been too quiet.",
    catty: "Was it {b}? {b} has been suspiciously quiet today.", diva: "Was it {b}, darling? Far too quiet today.", stoic: "{b}? Too quiet today." }],
  ['block.react.guess.04', "I'm going to act like I know who it was. I do not know who it was.", {
    hype: "I'm gonna ACT like I know who it was! I do NOT know who it was!", dry: "I'll act like I know who it was. I do not. At all.", blunt: "I'll act like I know. I don't.",
    goofy: "I'm going to act like I know who it was! I don't! I'm a great actor though!", shy: "I'm going to pretend I know who it was. I really don't.", chill: "Gonna act like I know who it was, dude. I don't.",
    catty: "I'm going to act like I know who it was. I'll figure it out.", diva: "I'll act like I know, darling. I'm an excellent actor.", stoic: "No idea who it was." }],
  ['block.react.guess.05', "Somebody in here is pretending to be shocked right now.", {
    hype: "SOMEBODY in here is PRETENDING to be shocked right now!", dry: "Somebody in here is pretending to be shocked. Badly, I hope.", blunt: "Somebody's faking being shocked.",
    goofy: "Somebody in here is pretending to be shocked right now! Gasp! Like that!", shy: "Somebody in here is pretending to be shocked right now.", chill: "Somebody's faking being shocked right now.",
    catty: "Somebody in here is pretending to be shocked. I'll find out who.", diva: "Someone's performing shock, darling. Amateur.", stoic: "Someone's faking it." }],
  // ── before a goodbye video ────────────────────────────────────────────
  ['goodbye.guess.m01', "Here it is. {b}'s goodbye. I'm not ready.", {
    hype: "Here it is! {b}'s goodbye! I'm NOT READY!", dry: "Here it is. {b}'s goodbye. Not ready. Never am.", blunt: "{b}'s goodbye. Not ready.",
    goofy: "Here it is! {b}'s goodbye! I'm not ready! I need snacks first!", shy: "Here it is. {b}'s goodbye. I'm not ready.", chill: "Here it is, {b}'s goodbye. Not ready.",
    catty: "Here it is. {b}'s goodbye. I'm ready.", diva: "Here it is, darling. {b}'s farewell. I'm not ready.", stoic: "{b}'s goodbye. Here it is." }],
  ['goodbye.guess.m02', "Okay, {b}. No surprises. Please, no surprises.", {
    hype: "Okay, {b}! NO surprises! PLEASE!", dry: "Okay, {b}. No surprises. Please. I'm begging.", blunt: "No surprises, {b}.",
    goofy: "Okay, {b}! No surprises! Please! I hate surprises! Except cake!", shy: "Okay, {b}. No surprises. Please.", chill: "Okay, {b}. No surprises, man. Please.",
    catty: "Okay, {b}. No surprises. You don't have it in you.", diva: "No surprises, {b}, darling. Please.", stoic: "No surprises, {b}." }],
  ['goodbye.guess.m03', "I really hope {b} was real. I really do.", {
    hype: "I REALLY hope {b} was real! I really do!", dry: "I hope {b} was real. Really. For once I'm hoping.", blunt: "Hope {b} was real.",
    goofy: "I really hope {b} was real! Not a robot! Not a ghost! A real person!", shy: "I really hope {b} was real. I really do.", chill: "Really hope {b} was real.",
    catty: "I hope {b} was real. For {b}'s sake.", diva: "I hope {b} was genuine, darling. I really do.", stoic: "Hope {b} was real." }],
  ['goodbye.guess.m04', "Whatever {b} says, I'm going to hear it for days.", {
    hype: "Whatever {b} says, I'm gonna hear it for DAYS!", dry: "Whatever {b} says, I'll hear it for days. Great.", blunt: "I'll hear it for days.",
    goofy: "Whatever {b} says, I'll hear it for days! Like a song stuck in my head!", shy: "Whatever {b} says, I'll be thinking about it for days.", chill: "Whatever {b} says, I'll hear it for days.",
    catty: "Whatever {b} says, I'll hear about it for days. From everyone.", diva: "Whatever {b} says will echo for days, darling.", stoic: "I'll hear it for days." }],
  ['goodbye.guess.m05', "Moment of truth. Who was {b} really?", {
    hype: "MOMENT OF TRUTH! Who was {b} REALLY?!", dry: "Moment of truth. Who was {b}. Find out after this.", blunt: "Who was {b}, really?",
    goofy: "Moment of truth! Who was {b} really? A spy? A chef? A very good dog?", shy: "Moment of truth. Who was {b} really?", chill: "Moment of truth, dude. Who was {b}?",
    catty: "Moment of truth. Who was {b} really? I have guesses.", diva: "The reveal, darling! Who was {b} really?", stoic: "Who was {b}?" }],
  ['goodbye.guess.m06', "Play it. No, wait. Okay, play it.", {
    hype: "PLAY IT! No, WAIT! Okay, PLAY IT!", dry: "Play it. No. Wait. Fine. Play it.", blunt: "Play it.",
    goofy: "Play it! No, wait! Okay, play it! No! Yes! Play it!", shy: "Play it. No, wait. Okay. Play it.", chill: "Play it. Wait. Okay, play it.",
    catty: "Play it. No. Wait. Okay. Play it.", diva: "Play it! No! Wait! Darling, play it!", stoic: "Play it." }],
  ['goodbye.guess.m07', "I talked to {b} every single day. I think I'm going to cry.", {
    hype: "I talked to {b} EVERY day! I'm gonna CRY!", dry: "I talked to {b} every day. I might cry. Don't watch.", blunt: "Talked to {b} every day. Might cry.",
    goofy: "I talked to {b} every day! I'm going to cry! I'm getting the tissues! All of them!", shy: "I talked to {b} every day. I think I'm going to cry.", chill: "Talked to {b} every day. Gonna cry.",
    catty: "I talked to {b} every day. I won't cry. Much.", diva: "I spoke to {b} every day, darling. I shall weep.", stoic: "Talked every day. Might cry." }],
  ['goodbye.guess.m08', "If {b} calls me out in this video, I'm unplugging the TV.", {
    hype: "If {b} calls me OUT, I'm UNPLUGGING the TV!", dry: "If {b} calls me out, I'm unplugging the TV. Problem solved.", blunt: "If {b} calls me out, the TV's off.",
    goofy: "If {b} calls me out, I'm unplugging the TV! And hiding under a blanket!", shy: "If {b} says my name in this, I'm turning off the TV.", chill: "If {b} calls me out, I'm unplugging the TV.",
    catty: "If {b} calls me out, let {b}. Nobody will believe it.", diva: "If {b} calls me out, darling, I'm leaving the room.", stoic: "If {b} calls me out, TV's off." }],
  ['goodbye.guess.m09', "Let's find out if I was right about {b}.", {
    hype: "Let's find out if I was RIGHT about {b}!", dry: "Let's see if I was right about {b}. I usually am.", blunt: "Let's see if I was right.",
    goofy: "Let's find out if I was right about {b}! I bet I was! I'm almost never right!", shy: "Let's find out if I was right about {b}.", chill: "Let's see if I was right about {b}.",
    catty: "Let's find out if I was right about {b}. I was.", diva: "Let's see if my instincts were right, darling.", stoic: "Was I right about {b}?" }],
  ['goodbye.guess.m10', "Circle, play {b}'s message. Just get it over with.", {
    hype: "Circle, PLAY {b}'s message! Get it OVER with!", dry: "Circle, play {b}'s message. Let's get it over with.", blunt: "Circle, play it.",
    goofy: "Circle, play {b}'s message! Get it over with! Like a shot at the doctor!", shy: "Circle, play {b}'s message. Let's just get it over with.", chill: "Circle, play {b}'s message. Let's get it done.",
    catty: "Circle, play {b}'s message. Let's get it over with.", diva: "Circle, roll {b}'s message, darling. The final act.", stoic: "Play it." }],
  ['goodbye.guess.01', "'Players, {b} has left a goodbye message.' Here we go. Moment of truth.", {
    hype: "'Players, {b} has left a goodbye message.' HERE WE GO!", dry: "'{b} has left a goodbye message.' Here we go. Brace.", blunt: "{b} left a message. Here we go.",
    goofy: "'Players, {b} has left a goodbye message.' Here we go! Moment of truth! Drumroll!", shy: "'{b} has left a goodbye message.' Here we go.", chill: "'{b} left a goodbye message.' Here we go, dude.",
    catty: "'{b} has left a goodbye message.' Here we go. This should be fun.", diva: "'{b} has left a goodbye message.' The final scene, darling!", stoic: "{b} left a message. Here we go." }],
  ['goodbye.guess.02', "Okay, I'm calling it now. {b} is not who {b.sub} said {b.sub} was.", {
    hype: "I'm CALLING IT! {b} is NOT who {b.sub} said!", dry: "Calling it. {b} isn't who {b.sub} said. Write it down.", blunt: "{b} isn't who {b.sub} said.",
    goofy: "I'm calling it! {b} is not who {b.sub} said! {b.Sub}'s three kids in a trench coat!", shy: "I think {b} isn't who {b.sub} said {b.sub} was.", chill: "Calling it, man. {b}'s not who {b.sub} said.",
    catty: "I'm calling it. {b} is not who {b.sub} said {b.sub} was.", diva: "Calling it, darling. {b} was playing a role.", stoic: "{b} isn't who {b.sub} said." }],
  ['goodbye.guess.03', "I'm scared to press play. What if {b} says my name?", {
    hype: "I'm SCARED to press play! What if {b} says my NAME?!", dry: "Scared to press play. What if {b} says my name. Fantastic.", blunt: "What if {b} says my name?",
    goofy: "I'm scared to press play! What if {b} says my name? I'll hide in the fridge!", shy: "I'm scared to press play. What if {b} says my name?", chill: "Scared to press play. What if {b} says my name?",
    catty: "What if {b} says my name? Let {b} try.", diva: "What if {b} names me, darling? The scandal!", stoic: "What if {b} says my name?" }],
  ['goodbye.guess.04', "A goodbye message. Okay. Everybody find out together.", {
    hype: "A GOODBYE MESSAGE! Everybody find out TOGETHER!", dry: "A goodbye message. Okay. Everyone finds out together. Fun.", blunt: "Goodbye message. Everyone finds out together.",
    goofy: "A goodbye message! Everybody find out together! Group viewing! Popcorn for all!", shy: "A goodbye message. Okay. We all find out together.", chill: "Goodbye message. Everyone finds out together.",
    catty: "A goodbye message. Everyone finds out together. Let's see who flinches.", diva: "A goodbye message, darling! A shared premiere!", stoic: "Goodbye message. Together." }],
  ['goodbye.guess.05', "Real or catfish? Real. No, catfish. No. I have no idea.", {
    hype: "Real or catfish? REAL! No, CATFISH! I have NO IDEA!", dry: "Real or catfish. Real. No. Catfish. No idea.", blunt: "Real or catfish? No idea.",
    goofy: "Real or catfish? Real! No, catfish! No! A real catfish! I don't know!", shy: "Real or catfish? Real. No, catfish. I have no idea.", chill: "Real or catfish? No idea.",
    catty: "Real or catfish? Catfish. Probably. Definitely.", diva: "Real or catfish, darling? The suspense!", stoic: "Real or catfish. No idea." }],
  ['goodbye.guess.w01', "Please be who you said you were, {b}.", {
    hype: "PLEASE be who you said you were, {b}!", dry: "Please be who you said you were, {b}. For once, be real.", blunt: "Be who you said you were, {b}.",
    goofy: "Please be who you said you were, {b}! Please don't be a ghost!", shy: "Please be who you said you were, {b}.", chill: "Please be who you said you were, {b}.",
    catty: "Please be who you said you were, {b}. I'll be disappointed otherwise.", diva: "Please be who you said, {b}, darling.", stoic: "Be real, {b}." }],
  ['goodbye.guess.w02', "Here we go. The truth about {b}.", {
    hype: "HERE WE GO! The TRUTH about {b}!", dry: "Here we go. The truth about {b}. Finally.", blunt: "The truth about {b}.",
    goofy: "Here we go! The truth about {b}! Dun dun dun!", shy: "Here we go. The truth about {b}.", chill: "Here we go, dude. The truth about {b}.",
    catty: "Here we go. The truth about {b}. At last.", diva: "Here we go, darling. The truth about {b}.", stoic: "The truth about {b}." }],
  ['goodbye.guess.w03', "I'm so nervous. Why am I nervous? I'm not the one leaving.", {
    hype: "I'm SO nervous! WHY am I nervous?! I'm not leaving!", dry: "I'm nervous. Why. I'm not the one leaving.", blunt: "I'm nervous. I'm not even leaving.",
    goofy: "I'm so nervous! Why am I nervous? I'm not leaving! My stomach didn't get the memo!", shy: "I'm so nervous. Why am I nervous? I'm not the one leaving.", chill: "Why am I nervous? I'm not leaving.",
    catty: "I'm not nervous. Why would I be? I'm not the one leaving.", diva: "Why am I nervous, darling? I'm not the one exiting.", stoic: "Nervous. Not even leaving." }],
  ['goodbye.guess.w04', "{b} has a message for us. Of course {b} does.", {
    hype: "{b} has a MESSAGE for us! Of COURSE!", dry: "{b} has a message for us. Of course {b} does.", blunt: "{b} has a message. Of course.",
    goofy: "{b} has a message for us! Of course! Maybe it's a song!", shy: "{b} has a message for us. Of course.", chill: "{b}'s got a message. Of course.",
    catty: "{b} has a message for us. Of course {b} does.", diva: "{b} has a final word, darling. Naturally.", stoic: "{b}. A message. Of course." }],
  ['goodbye.guess.w05', "If {b} says my name in this, I'm hiding under the blanket.", {
    hype: "If {b} says my NAME, I'm hiding under the BLANKET!", dry: "If {b} says my name, I'm under the blanket. Permanently.", blunt: "If {b} says my name, I'm hiding.",
    goofy: "If {b} says my name, I'm hiding under the blanket! I'll be a blanket ghost!", shy: "If {b} says my name in this, I'm hiding under the blanket.", chill: "If {b} says my name, I'm under the blanket.",
    catty: "If {b} says my name, I'm not hiding. Let {b}.", diva: "If {b} names me, darling, I'll faint onto the couch.", stoic: "If {b} says my name, I hide." }],
  ['goodbye.guess.w06', "Real or fake. Real or fake. Come on, {b}.", {
    hype: "REAL OR FAKE! REAL OR FAKE! Come ON, {b}!", dry: "Real or fake. Real or fake. Come on, {b}.", blunt: "Real or fake, {b}?",
    goofy: "Real or fake! Real or fake! Come on, {b}! I'm on the edge of my couch!", shy: "Real or fake. Come on, {b}.", chill: "Real or fake? Come on, {b}.",
    catty: "Real or fake. Come on, {b}. Show us.", diva: "Real or fake, darling? Come on, {b}!", stoic: "Real or fake, {b}." }],
  ['goodbye.guess.w07', "Okay, Circle. Hit play before I lose my mind.", {
    hype: "Okay, Circle! HIT PLAY before I lose my MIND!", dry: "Circle. Play it. Before I lose what's left of my mind.", blunt: "Circle, play it.",
    goofy: "Okay, Circle! Hit play before I lose my mind! I've already lost a sock!", shy: "Okay, Circle. Please hit play before I lose my mind.", chill: "Okay, Circle. Hit play before I lose it, man.",
    catty: "Okay, Circle. Play it. I don't have all night.", diva: "Circle, roll it, darling, before I lose my mind!", stoic: "Play it." }],
  ['goodbye.guess.w08', "Whatever {b} says, everybody's gonna hear it at the same time.", {
    hype: "Whatever {b} says, EVERYBODY hears it at the SAME TIME!", dry: "Whatever {b} says, everyone hears it at once. Great.", blunt: "Everyone hears it at once.",
    goofy: "Whatever {b} says, everybody hears it at the same time! Like a choir!", shy: "Whatever {b} says, everyone will hear it at the same time.", chill: "Everyone's gonna hear it at once, dude.",
    catty: "Whatever {b} says, everyone hears it at the same time. Good.", diva: "Whatever {b} says, the whole audience hears it, darling.", stoic: "Everyone hears it at once." }],
  ['goodbye.guess.w09', "Whatever this is, {b} deserves to be heard. Play it.", {
    hype: "Whatever this is, {b} DESERVES to be heard! PLAY IT!", dry: "Whatever this is, {b} gets to be heard. Play it.", blunt: "{b} deserves to be heard. Play it.",
    goofy: "Whatever this is, {b} deserves to be heard! Play it! Loud! Okay, not too loud!", shy: "Whatever this is, {b} deserves to be heard. Play it.", chill: "{b} deserves to be heard. Play it.",
    catty: "Whatever this is, {b} gets to be heard. Play it.", diva: "{b} deserves a final monologue, darling. Play it.", stoic: "{b} gets heard. Play it." }],
  ['goodbye.guess.w10', "I have a feeling about this one. A bad feeling. Or a good one. A feeling.", {
    hype: "I have a FEELING about this one! Bad! Or good! A FEELING!", dry: "I have a feeling about this one. Bad. Or good. A feeling.", blunt: "I have a feeling about this one.",
    goofy: "I have a feeling about this one! A bad feeling! Or a good one! Or I'm hungry!", shy: "I have a feeling about this one. I don't know if it's good or bad.", chill: "I've got a feeling about this one.",
    catty: "I have a feeling about this one. A bad one. For somebody.", diva: "I have a feeling about this one, darling. A dramatic feeling.", stoic: "I have a feeling." }],
  // ── after a goodbye video ─────────────────────────────────────────────
  ['goodbye.react.surprised.m01', "Wow. Okay. I did not have that on my bingo card.", {
    hype: "WOW! Okay! Did NOT have that on my bingo card!", dry: "Wow. Okay. Not on my bingo card. Not even close.", blunt: "Didn't see that coming.",
    goofy: "Wow! Okay! That wasn't on my bingo card! I don't even have a bingo card!", shy: "Wow. Okay. I didn't expect that.", chill: "Whoa. Okay. Didn't see that coming.",
    catty: "Wow. Okay. I did not see that coming. Rare.", diva: "Wow, darling. Not in the script.", stoic: "Didn't expect that." }],
  ['goodbye.react.surprised.m02', "{b}, you really got me with that one.", {
    hype: "{b}! You REALLY got me with that one!", dry: "{b}, you got me with that one. Well played.", blunt: "{b}, you got me.",
    goofy: "{b}, you really got me with that one! Hook, line and sinker! Like a fish! A sad fish!", shy: "{b}, you really got me with that one.", chill: "{b}, you got me with that one.",
    catty: "{b}, you got me with that one. I'll allow it.", diva: "{b}, darling, you got me. A great exit.", stoic: "{b}. You got me." }],
  ['goodbye.react.surprised.m03', "I'm going to miss {b}. I didn't know how much until now.", {
    hype: "I'm gonna MISS {b}! Didn't know how much until NOW!", dry: "I'll miss {b}. Didn't know how much until now. Inconvenient.", blunt: "I'll miss {b}. More than I thought.",
    goofy: "I'm going to miss {b}! I didn't know how much until now! I'm sniffling into a pillow!", shy: "I'm going to miss {b}. I didn't know how much until now.", chill: "Gonna miss {b}. Didn't know how much.",
    catty: "I'll miss {b}. I didn't expect to. Annoying.", diva: "I'll miss {b}, darling. More than I knew.", stoic: "I'll miss {b}." }],
  ['goodbye.react.surprised.m04', "That's one less voice in Circle Chat. It's going to feel quiet.", {
    hype: "That's one less voice in Circle Chat! It's gonna feel SO quiet!", dry: "One less voice in Circle Chat. Quiet. Finally. No, too quiet.", blunt: "One less voice. It'll be quiet.",
    goofy: "One less voice in Circle Chat! It's gonna be so quiet! Like a library! A sad library!", shy: "That's one less voice in Circle Chat. It's going to feel quiet.", chill: "One less voice in the chat, dude. Gonna be quiet.",
    catty: "One less voice in Circle Chat. Some of us will survive.", diva: "One less voice in the chorus, darling. Quieter.", stoic: "One less voice." }],
  ['goodbye.react.surprised.m05', "{b} was the real deal. What a goodbye.", {
    hype: "{b} was the REAL DEAL! What a GOODBYE!", dry: "{b} was the real deal. What a goodbye. Respect.", blunt: "{b} was real. Good goodbye.",
    goofy: "{b} was the real deal! What a goodbye! Ten out of ten! Standing ovation from my couch!", shy: "{b} was the real deal. What a goodbye.", chill: "{b} was the real deal. What a goodbye.",
    catty: "{b} was the real deal. What a goodbye. I'm almost impressed.", diva: "{b} was the real deal, darling. What an exit.", stoic: "{b} was real. Good goodbye." }],
  ['goodbye.react.surprised.01', "Bye, {b}. That video got me.", {
    hype: "Bye, {b}! That video GOT me!", dry: "Bye, {b}. That video got me. A little.", blunt: "Bye, {b}. That got me.",
    goofy: "Bye, {b}! That video got me! Right in the feelings!", shy: "Bye, {b}. That video really got me.", chill: "Bye, {b}. That video got me.",
    catty: "Bye, {b}. That video got me. Don't tell anyone.", diva: "Farewell, {b}, darling. That video moved me.", stoic: "Bye, {b}. That got me." }],
  ['goodbye.react.surprised.02', "I can't believe {b} is gone already.", {
    hype: "I can't BELIEVE {b} is gone already!", dry: "{b} is gone already. Hard to believe. Easy to accept.", blunt: "{b}'s gone already.",
    goofy: "I can't believe {b} is gone already! It feels like {b} just got here! Like a pizza that's suddenly gone!", shy: "I can't believe {b} is gone already.", chill: "Can't believe {b}'s gone already, man.",
    catty: "I can't believe {b} is gone already. Actually, I can.", diva: "I can't believe {b} has exited already, darling.", stoic: "{b}'s gone already." }],
  ['goodbye.react.surprised.03', "Okay. That's one less person in here. Wow.", {
    hype: "Okay! One less person in here! WOW!", dry: "Okay. One less person in here. Wow.", blunt: "One less person.",
    goofy: "Okay! That's one less person in here! The building feels bigger!", shy: "Okay. That's one less person in here. Wow.", chill: "One less person in here. Wow.",
    catty: "Okay. One less person in here. More room for me.", diva: "One less player in the cast, darling.", stoic: "One less." }],
  ['goodbye.react.surprised.04', "A catfish? {b}? I had no idea. None.", {
    hype: "A CATFISH?! {b}?! I had NO idea!", dry: "A catfish. {b}. No idea. None. Embarrassing.", blunt: "{b} was a catfish? No idea.",
    goofy: "A catfish? {b}? I had no idea! I thought {b} was a regular fish!", shy: "A catfish? {b}? I had no idea.", chill: "A catfish? {b}? No idea.",
    catty: "A catfish? {b}? I had my suspicions. Okay, I didn't.", diva: "A catfish? {b}, darling? I had no idea!", stoic: "{b}. Catfish. No idea." }],
  ['goodbye.react.surprised.05', "Real. {b} was real the whole time. And I didn't believe a word.", {
    hype: "REAL! {b} was REAL the whole time! And I didn't believe a WORD!", dry: "Real. {b} was real. I didn't believe a word. Great work, me.", blunt: "{b} was real. I didn't believe it.",
    goofy: "Real! {b} was real the whole time! And I didn't believe a word! I feel so silly!", shy: "{b} was real the whole time. And I didn't believe {b.obj}.", chill: "{b} was real the whole time, dude. I didn't believe a word.",
    catty: "{b} was real. I didn't believe a word. Well. That's on {b}.", diva: "{b} was real, darling, and I doubted every word.", stoic: "{b} was real. I didn't believe it." }],
  ['goodbye.react.surprised.06', "Aw. That's really {b}. I'm gonna miss {b}.", {
    hype: "Aw! That's REALLY {b}! I'm gonna MISS {b}!", dry: "Aw. That's really {b}. I'll miss {b}. Quietly.", blunt: "That's really {b}. I'll miss {b}.",
    goofy: "Aw! That's really {b}! I'm gonna miss {b}! I'm hugging a cushion!", shy: "Aw. That's really {b}. I'm going to miss {b}.", chill: "Aw, that's really {b}. Gonna miss {b}.",
    catty: "Aw. That's really {b}. I'll miss {b}. A little.", diva: "Aw, it's really {b}, darling. I'll miss {b}.", stoic: "That's {b}. I'll miss {b}." }],
  ['goodbye.react.surprised.w01', "That was classy, {b}. Really classy.", {
    hype: "That was CLASSY, {b}! REALLY classy!", dry: "That was classy, {b}. Really. I'm surprised.", blunt: "Classy, {b}.",
    goofy: "That was classy, {b}! Really classy! Like a dinner party! With little forks!", shy: "That was really classy, {b}.", chill: "That was classy, {b}.",
    catty: "That was classy, {b}. More than I expected.", diva: "That was classy, darling. A graceful exit.", stoic: "Classy, {b}." }],
  ['goodbye.react.surprised.w02', "I did not expect to get emotional over that.", {
    hype: "I did NOT expect to get emotional over that!", dry: "Did not expect to get emotional. Rude.", blunt: "Didn't expect to get emotional.",
    goofy: "I did not expect to get emotional! I'm leaking! From the eyes!", shy: "I didn't expect to get emotional over that.", chill: "Didn't expect to get emotional.",
    catty: "I did not expect to get emotional. I'm not. It's allergies.", diva: "I did not expect to be moved, darling. I'm moved.", stoic: "Didn't expect that." }],
  ['goodbye.react.surprised.w03', "And just like that, {b} is gone.", {
    hype: "And JUST LIKE THAT, {b} is GONE!", dry: "And just like that, {b} is gone.", blunt: "Just like that. Gone.",
    goofy: "And just like that, {b} is gone! Poof! Like a magician's rabbit!", shy: "And just like that, {b} is gone.", chill: "And just like that, {b}'s gone.",
    catty: "And just like that, {b} is gone. Bye.", diva: "And just like that, darling, {b} is gone.", stoic: "Just like that. Gone." }],
  ['goodbye.react.surprised.w04', "That's the part nobody tells you. People actually leave.", {
    hype: "That's the part NOBODY tells you! People ACTUALLY leave!", dry: "That's the part nobody tells you. People leave.", blunt: "People actually leave.",
    goofy: "That's the part nobody tells you! People actually leave! I thought they'd stay forever!", shy: "That's the part nobody tells you. People actually leave.", chill: "That's the part nobody tells you. People leave.",
    catty: "That's the part nobody tells you. People leave. Some faster than others.", diva: "That's the part nobody tells you, darling. People exit.", stoic: "People actually leave." }],
  ['goodbye.react.surprised.w05', "Okay, {b}. I heard you. I heard all of it.", {
    hype: "Okay, {b}! I HEARD you! ALL of it!", dry: "Okay, {b}. I heard you. All of it.", blunt: "I heard you, {b}.",
    goofy: "Okay, {b}! I heard you! I heard all of it! I took notes! In my head!", shy: "Okay, {b}. I heard you. I heard all of it.", chill: "Okay, {b}. I heard you, dude.",
    catty: "Okay, {b}. I heard you. Every word.", diva: "I heard you, {b}, darling. Every word.", stoic: "I heard you, {b}." }],
  ['goodbye.react.surprised.w06', "It's so weird. {b} was right here yesterday.", {
    hype: "It's SO weird! {b} was RIGHT HERE yesterday!", dry: "It's weird. {b} was here yesterday.", blunt: "{b} was here yesterday. Weird.",
    goofy: "It's so weird! {b} was right here yesterday! Like when a sock disappears!", shy: "It's so weird. {b} was right here yesterday.", chill: "So weird, man. {b} was here yesterday.",
    catty: "It's weird. {b} was here yesterday. Not anymore.", diva: "So strange, darling. {b} was on stage yesterday.", stoic: "{b} was here yesterday." }],
  ['goodbye.react.guilty.01', "Oh, that hurts. That really hurts. I did that.", {
    hype: "OH, that HURTS! That REALLY hurts! I DID that!", dry: "Oh. That hurts. I did that. Great.", blunt: "That hurts. I did that.",
    goofy: "Oh, that hurts! That really hurts! I did that! I'm a monster! A small monster!", shy: "Oh, that hurts. That really hurts. I did that.", chill: "Oh, that hurts. I did that.",
    catty: "Oh, that hurts. I did that. I'd do it again.", diva: "Oh, that wounds me, darling. I did that.", stoic: "That hurts. I did that." }],
  ['goodbye.react.guilty.02', "Now I feel terrible. I really do.", {
    hype: "Now I feel TERRIBLE! I really do!", dry: "Now I feel terrible. Really. Rare for me.", blunt: "I feel terrible.",
    goofy: "Now I feel terrible! I really do! Like burnt toast!", shy: "Now I feel terrible. I really do.", chill: "Now I feel terrible.",
    catty: "Now I feel terrible. Almost.", diva: "Now I feel dreadful, darling. Truly.", stoic: "I feel terrible." }],
  ['goodbye.react.guilty.03', "I'm sorry, {b}. I really am.", {
    hype: "I'm SORRY, {b}! I really am!", dry: "I'm sorry, {b}. I really am.", blunt: "Sorry, {b}.",
    goofy: "I'm sorry, {b}! I really am! I'd bake you an apology cake!", shy: "I'm sorry, {b}. I really am.", chill: "Sorry, {b}. I really am.",
    catty: "I'm sorry, {b}. It was the game.", diva: "I'm sorry, {b}, darling. Truly.", stoic: "Sorry, {b}." }],
  ['goodbye.react.guilty.04', "Please don't hate me. Please don't hate me.", {
    hype: "Please DON'T hate me! PLEASE don't hate me!", dry: "Please don't hate me. Please. I'd hate me.", blunt: "Don't hate me.",
    goofy: "Please don't hate me! Please don't hate me! I'm very lovable! Ask my mom!", shy: "Please don't hate me. Please don't hate me.", chill: "Please don't hate me.",
    catty: "Please don't hate me. Or do. It was the right call.", diva: "Please don't hate me, darling. Please.", stoic: "Don't hate me." }],
  ['goodbye.react.guilty.05', "That was so classy. And I'm the one who blocked {b}. Great.", {
    hype: "That was SO classy! And I BLOCKED {b}! GREAT!", dry: "That was classy. And I blocked {b}. Great. Wonderful.", blunt: "Classy. And I blocked {b}.",
    goofy: "That was so classy! And I'm the one who blocked {b}! I'm the villain! With the twirly mustache!", shy: "That was so classy. And I'm the one who blocked {b}.", chill: "That was classy, dude. And I blocked {b}. Great.",
    catty: "That was so classy. And I blocked {b}. Still the right call.", diva: "So classy, darling. And I'm the villain who blocked {b}.", stoic: "Classy. And I blocked {b}." }],
  ['goodbye.react.guilty.06', "Okay. I made my choice. I have to live with it.", {
    hype: "Okay! I made my choice! I have to LIVE with it!", dry: "Okay. I made my choice. Living with it now.", blunt: "I made my choice.",
    goofy: "Okay! I made my choice! I have to live with it! Like a bad haircut!", shy: "Okay. I made my choice. I have to live with it.", chill: "I made my choice. Gotta live with it.",
    catty: "I made my choice. I'll live with it. Easily.", diva: "I made my choice, darling. I'll live with it. Dramatically.", stoic: "My choice. I live with it." }],
  ['goodbye.react.warned.01', "Me? {b} said my name? In front of everybody?", {
    hype: "ME?! {b} said my NAME?! In front of EVERYBODY?!", dry: "Me. {b} said my name. In front of everyone. Lovely.", blunt: "{b} said my name? In front of everyone?",
    goofy: "Me? {b} said my name? In front of everybody? I'm turning red! Like a tomato!", shy: "Me? {b} said my name? In front of everybody?", chill: "Me? {b} said my name? In front of everybody?",
    catty: "Me? {b} said my name? How desperate.", diva: "Me? {b} named me, darling? In front of everyone?", stoic: "{b} said my name." }],
  ['goodbye.react.warned.02', "Oh, come on! Why me?", {
    hype: "Oh, COME ON! WHY ME?!", dry: "Oh, come on. Why me.", blunt: "Why me?",
    goofy: "Oh, come on! Why me? Why is it always me? Okay, it's not always me!", shy: "Oh, come on. Why me?", chill: "Aw, come on. Why me?",
    catty: "Oh, come on. Why me? Jealous.", diva: "Oh, come ON, darling! Why me?", stoic: "Why me." }],
  ['goodbye.react.warned.03', "Wow. Okay. Thanks for that, {b}. Really helpful.", {
    hype: "WOW! Okay! Thanks for THAT, {b}! REALLY helpful!", dry: "Wow. Thanks for that, {b}. Really helpful. Truly.", blunt: "Thanks a lot, {b}.",
    goofy: "Wow! Okay! Thanks for that, {b}! Really helpful! Like a fork for soup!", shy: "Wow. Okay. Thanks for that, {b}.", chill: "Wow. Thanks for that, {b}.",
    catty: "Wow. Thanks for that, {b}. Really helpful. Petty, but helpful.", diva: "Thank you so much, {b}, darling. How helpful.", stoic: "Thanks, {b}." }],
  ['goodbye.react.warned.04', "Did {b} just say my name? On the way out the door?", {
    hype: "Did {b} just say my NAME?! On the way OUT?!", dry: "Did {b} just say my name. On the way out. Classy.", blunt: "{b} said my name on the way out?",
    goofy: "Did {b} just say my name? On the way out the door? While leaving? Rude!", shy: "Did {b} just say my name? On the way out?", chill: "Did {b} just say my name on the way out, man?",
    catty: "Did {b} just say my name on the way out the door? Classy.", diva: "{b} named me on the way out, darling? The audacity.", stoic: "{b} said my name. On the way out." }],
  ['goodbye.react.warned.05', "Oh, great. Now everybody's looking at me.", {
    hype: "Oh, GREAT! Now EVERYBODY'S looking at me!", dry: "Oh, great. Now everyone's looking at me.", blunt: "Great. Everyone's looking at me.",
    goofy: "Oh, great! Now everybody's looking at me! Through the screen! I can feel it!", shy: "Oh no. Now everybody's looking at me.", chill: "Oh, great. Everybody's looking at me now, dude.",
    catty: "Oh, great. Now everybody's looking at me. As usual.", diva: "Everyone's looking at me now, darling. As they should. But not like this.", stoic: "Everyone's looking at me." }],
  ['goodbye.react.warned.06', "Wow. On the way out the door? Really?", {
    hype: "WOW! On the way out the DOOR?! REALLY?!", dry: "Wow. On the way out the door. Really.", blunt: "On the way out? Really?",
    goofy: "Wow! On the way out the door? Really? That's like tripping someone at the finish line!", shy: "Wow. On the way out the door? Really?", chill: "On the way out the door? Really?",
    catty: "On the way out the door? How petty.", diva: "On the way out, darling? Really?", stoic: "On the way out. Really." }],
  ['goodbye.react.vindicated.01', "I knew it! I KNEW it!", {
    hype: "I KNEW IT! I KNEW IT!", dry: "I knew it. I knew it. Smug now.", blunt: "Knew it.",
    goofy: "I knew it! I knew it! I'm a genius! A genius in pajamas!", shy: "I knew it. I knew it.", chill: "I knew it! I knew it!",
    catty: "I knew it. Of course I knew it.", diva: "I knew it, darling! I KNEW it!", stoic: "Knew it." }],
  ['goodbye.react.vindicated.02', "Catfish! I called it! Did everybody hear me call it?", {
    hype: "CATFISH! I CALLED IT! Did EVERYBODY hear me?!", dry: "Catfish. Called it. Did everyone hear. No. Shame.", blunt: "Catfish. Called it.",
    goofy: "Catfish! I called it! Did everybody hear me? I said it to my plant! The plant heard!", shy: "Catfish. I called it. Did anyone hear me call it?", chill: "Catfish! Called it!",
    catty: "Catfish. I called it. Everyone should listen to me more.", diva: "Catfish! I called it, darling! Did everyone hear?", stoic: "Catfish. Called it." }],
  ['goodbye.react.vindicated.03', "My gut was right the whole time. Wow.", {
    hype: "My GUT was RIGHT the whole time! WOW!", dry: "My gut was right. Wow. Who knew.", blunt: "My gut was right.",
    goofy: "My gut was right the whole time! Wow! My gut is smarter than me!", shy: "My gut was right the whole time. Wow.", chill: "My gut was right the whole time.",
    catty: "My gut was right the whole time. As always.", diva: "My instincts were right, darling. As always.", stoic: "Gut was right." }],
];

// Voice versions, batch 7a: a new player arriving (aloud), and the private check-in and the fishing chat (typed, the
// way the voice types: batch4b.js). A question stays a question. No brand names anywhere.
export const VOICES = [
  // ── a new player arrives ──────────────────────────────────────────────
  ['arrival.react.01', "'A new Player has entered the Circle'? Now? Who is it?", {
    hype: "'A new Player has entered the Circle'?! NOW?! WHO is it?!", dry: "'A new Player has entered the Circle.' Now. Who is it.", blunt: "'A new Player has entered the Circle'? Who?",
    goofy: "'A new Player has entered the Circle'? Now? Who is it? Is it a dog? Please be a dog!", shy: "'A new Player has entered the Circle'? Now? Who is it?", chill: "'A new Player has entered the Circle'? Now? Who is it, dude?",
    catty: "'A new Player has entered the Circle'? Now? Who is it? This better be good.", diva: "'A new Player has entered the Circle'? Now, darling? Who is it?", stoic: "'A new Player has entered the Circle.' Who?" }],
  ['arrival.react.02', "A new player. Great. Just when I figured this place out.", {
    hype: "A NEW player?! GREAT! Just when I FIGURED this place OUT!", dry: "A new player. Great. Just when I figured this place out.", blunt: "New player. Just when I figured it out.",
    goofy: "A new player! Great! Just when I figured this place out! I didn't figure it out!", shy: "A new player. Okay. Just when I figured this place out.", chill: "New player, dude. Just when I figured this place out.",
    catty: "A new player. Great. Just when I had everyone figured out.", diva: "A new cast member, darling. Just when I'd learned my blocking.", stoic: "New player. Great." }],
  ['arrival.react.03', "Oh, {b} looks fun. Or {b} looks like a threat. One of the two.", {
    hype: "Oh, {b} looks FUN! Or {b} looks like a THREAT! One of the TWO!", dry: "{b} looks fun. Or a threat. One of the two.", blunt: "{b}. Fun or a threat.",
    goofy: "Oh, {b} looks fun! Or {b} looks like a threat! Or a fun threat! A threatening fun!", shy: "Oh, {b} looks fun. Or maybe a threat. One of the two.", chill: "{b} looks fun, dude. Or a threat. One of the two.",
    catty: "Oh, {b} looks fun. Or {b} looks like a threat. I'll decide which.", diva: "{b} looks fun, darling. Or dangerous. One of the two.", stoic: "{b}. Fun or threat." }],
  ['arrival.react.04', "New people are safe at the next blocking. So {b} is safe and I'm not. Great.", {
    hype: "New people are SAFE at the next blocking! So {b} is SAFE and I'm NOT! GREAT!", dry: "New people are safe at the next blocking. So {b} is safe. I'm not. Great.", blunt: "{b}'s safe. I'm not.",
    goofy: "New people are safe at the next blocking! So {b} is safe and I'm not! Great! Can I be new too?", shy: "New people are safe at the next blocking. So {b} is safe and I'm not.", chill: "New people are safe at the next blocking, dude. So {b}'s safe and I'm not.",
    catty: "New people are safe at the next blocking. So {b} is safe and I'm not. Fair.", diva: "{b} is safe at the next blocking, darling, and I am not. How unfair.", stoic: "{b}'s safe. I'm not." }],
  ['arrival.react.crush.01', "Oh. Oh, hello. Who are YOU?", {
    hype: "OH! Oh, HELLO! Who are YOU?!", dry: "Oh. Hello. Who are you.", blunt: "Hello. Who are you?",
    goofy: "Oh! Oh, hello! Who are YOU? Are you real? Are you a painting?", shy: "Oh. Oh. Hello. Who are you?", chill: "Oh. Hello there. Who are you, dude?",
    catty: "Oh. Hello. Who are you? I'm interested.", diva: "Oh, hello, darling. And who are YOU?", stoic: "Hello. Who are you?" }],
  ['arrival.react.crush.02', "Okay, {b} is cute. Like, actually cute. This changes things.", {
    hype: "Okay, {b} is CUTE! Like, ACTUALLY cute! This CHANGES things!", dry: "{b} is cute. Actually cute. That changes things. Unfortunately.", blunt: "{b}'s cute. That changes things.",
    goofy: "Okay, {b} is cute! Like, actually cute! This changes things! My heart did a cartwheel!", shy: "Okay, {b} is cute. Like, actually cute. This changes things.", chill: "{b}'s cute, dude. Actually cute. This changes things.",
    catty: "Okay, {b} is cute. Actually cute. That's inconvenient.", diva: "{b} is gorgeous, darling. This changes the plot.", stoic: "{b}'s cute. Changes things." }],
  ['arrival.react.crush.03', "{b}? I'm sorry, {b} can stay as long as {b.sub} wants.", {
    hype: "{b}?! I'm SORRY, {b} can stay as LONG as {b.sub} wants!", dry: "{b}. Sorry. {b} can stay as long as {b.sub} wants.", blunt: "{b} can stay.",
    goofy: "{b}? I'm sorry, {b} can stay as long as {b.sub} wants! Forever! Bring a toothbrush!", shy: "{b}? Um. {b} can stay as long as {b.sub} wants.", chill: "{b}? {b} can stay as long as {b.sub} wants, dude.",
    catty: "{b}? I'm sorry, {b} can stay as long as {b.sub} wants. Some of the others can go.", diva: "{b}, darling? {b} may stay as long as {b.sub} likes.", stoic: "{b} can stay." }],
  ['arrival.react.crush.04', "I came here to play a game. I did not come here to get a crush on {b}. And yet.", {
    hype: "I came here to PLAY A GAME! I did NOT come here to get a CRUSH on {b}! And YET!", dry: "I came here to play a game. Not to get a crush on {b}. And yet.", blunt: "Came to play. Not to crush on {b}. And yet.",
    goofy: "I came here to play a game! I did not come here to get a crush on {b}! And yet! Here we are! Blushing!", shy: "I came here to play a game. I didn't come here to get a crush on {b}. And yet.", chill: "Came here to play a game, dude. Not to crush on {b}. And yet.",
    catty: "I came here to play a game. Not to get a crush on {b}. And yet. Annoying.", diva: "I came to play, darling, not to fall for {b}. And yet.", stoic: "Came to play. Not for {b}. And yet." }],
  ['arrival.react.crush.05', "Somebody fan me. {b} just walked in.", {
    hype: "SOMEBODY FAN ME! {b} just WALKED IN!", dry: "Somebody fan me. {b} just walked in. Inconvenient.", blunt: "{b} walked in. Wow.",
    goofy: "Somebody fan me! {b} just walked in! I'm fanning myself with a pillow!", shy: "Somebody fan me. {b} just walked in.", chill: "Somebody fan me, dude. {b} just walked in.",
    catty: "Somebody fan me. {b} just walked in. Competition.", diva: "Fan me, darling! {b} has made an entrance!", stoic: "{b} walked in." }],
  ['arrival.react.threat.01', "{b} walks in fresh, with no enemies and no history. That's dangerous.", {
    hype: "{b} walks in FRESH, with NO enemies and NO history! That's DANGEROUS!", dry: "{b} walks in fresh. No enemies, no history. That's dangerous.", blunt: "{b}. No enemies. Dangerous.",
    goofy: "{b} walks in fresh, with no enemies and no history! That's dangerous! Like a brand new sock!", shy: "{b} walks in fresh, with no enemies and no history. That's dangerous.", chill: "{b} walks in fresh, dude. No enemies, no history. Dangerous.",
    catty: "{b} walks in fresh, with no enemies and no history. Not for long.", diva: "{b} enters fresh, darling. No enemies. No history. Dangerous.", stoic: "No enemies. No history. Dangerous." }],
  ['arrival.react.threat.02', "Everybody's going to love {b} for a week. I need to make sure it's only a week.", {
    hype: "EVERYBODY'S gonna love {b} for a WEEK! I need to make sure it's ONLY a week!", dry: "Everybody will love {b} for a week. I'll make sure it's only a week.", blunt: "They'll love {b} a week. Only a week.",
    goofy: "Everybody's going to love {b} for a week! I need to make sure it's only a week! Six days! Five!", shy: "Everybody's going to love {b} for a week. I need to make sure it's only a week.", chill: "Everyone's gonna love {b} for a week, dude. Only a week.",
    catty: "Everybody's going to love {b} for a week. I'll make sure it's only a week.", diva: "They'll adore {b} for a week, darling. I'll make sure that's all.", stoic: "A week. Only a week." }],
  ['arrival.react.threat.03', "Great. Another player. Another person who could rate me last.", {
    hype: "GREAT! ANOTHER player! Another person who could rate me LAST!", dry: "Great. Another player. Another person to rate me last.", blunt: "Another player. Another vote against me.",
    goofy: "Great! Another player! Another person who could rate me last! Or first! Probably last!", shy: "Great. Another player. Another person who could rate me last.", chill: "Another player, dude. Another person who could rate me last.",
    catty: "Great. Another player. Another person who could rate me last. They wouldn't dare.", diva: "Another player, darling. Another critic.", stoic: "Another player. Another vote." }],
  ['arrival.react.threat.04', "{b} is safe at the next blocking. That makes {b.obj} the most powerful person in here right now.", {
    hype: "{b} is SAFE at the next blocking! That makes {b.obj} the MOST POWERFUL person in here!", dry: "{b} is safe at the next blocking. That makes {b.obj} the most powerful person here. Fun.", blunt: "{b}'s safe. Most powerful in here.",
    goofy: "{b} is safe at the next blocking! That makes {b.obj} the most powerful person in here! Like a king! A new king!", shy: "{b} is safe at the next blocking. That makes {b.obj} the most powerful person in here right now.", chill: "{b}'s safe at the next blocking, dude. Most powerful person in here.",
    catty: "{b} is safe at the next blocking. That makes {b.obj} the most powerful person in here. For now.", diva: "{b} is safe, darling. The most powerful player here.", stoic: "{b}'s safe. Most powerful." }],
  ['arrival.react.threat.05', "I'll be nice to {b}. Very nice. Nice is how you keep a threat close.", {
    hype: "I'll be NICE to {b}! VERY nice! Nice is how you keep a threat CLOSE!", dry: "I'll be nice to {b}. Very nice. That's how you keep a threat close.", blunt: "I'll be nice to {b}. Keep the threat close.",
    goofy: "I'll be nice to {b}! Very nice! Nice is how you keep a threat close! Like a cat with a laser pointer!", shy: "I'll be nice to {b}. Very nice. That's how you keep a threat close.", chill: "I'll be nice to {b}, dude. Keep the threat close.",
    catty: "I'll be nice to {b}. Very nice. Nice is how you keep a threat close.", diva: "I'll be lovely to {b}, darling. Keep your threats close.", stoic: "Nice to {b}. Keep {b.obj} close." }],
  ['arrival.react.suspicious.01', "Hm. {b}. Something about that profile is too perfect.", {
    hype: "Hm! {b}! Something about that profile is TOO perfect!", dry: "Hm. {b}. That profile is too perfect.", blunt: "{b}'s profile is too perfect.",
    goofy: "Hm! {b}! Something about that profile is too perfect! Like a cake in a window!", shy: "Hm. {b}. Something about that profile seems too perfect.", chill: "{b}. That profile's too perfect, dude.",
    catty: "Hm. {b}. That profile is too perfect. Nobody's that perfect. Except me.", diva: "{b}, darling. That profile is far too perfect.", stoic: "{b}. Too perfect." }],
  ['arrival.react.suspicious.02', "Wait. Zoom in on that picture. Is that even real?", {
    hype: "WAIT! ZOOM IN on that picture! Is that even REAL?!", dry: "Wait. Zoom in. Is that even real.", blunt: "Zoom in. Is that real?",
    goofy: "Wait! Zoom in on that picture! Is that even real? Zoom more! Enhance!", shy: "Wait. Zoom in on that picture. Is that even real?", chill: "Wait, zoom in on that picture, dude. Is that real?",
    catty: "Wait. Zoom in on that picture. That is not real.", diva: "Zoom in, darling. Is that even real?", stoic: "Zoom in. Real?" }],
  ['arrival.react.suspicious.03', "New people always come in with a story. I want to know what {b}'s really is.", {
    hype: "New people ALWAYS come in with a story! I want to know what {b}'s REALLY is!", dry: "New people always come in with a story. I want to know {b}'s real one.", blunt: "{b} has a story. I want the real one.",
    goofy: "New people always come in with a story! I want to know what {b}'s really is! Is it a mystery novel?", shy: "New people always come in with a story. I want to know what {b}'s really is.", chill: "New people always come in with a story, dude. Want to know {b}'s real one.",
    catty: "New people always come in with a story. I want to know what {b}'s really is. I'll find out.", diva: "Every newcomer has a backstory, darling. I want {b}'s real one.", stoic: "{b}'s real story?" }],
  ['arrival.react.suspicious.04', "I'm not saying {b} is a catfish. I'm just not saying {b.sub} isn't.", {
    hype: "I'm NOT saying {b} is a catfish! I'm just NOT saying {b.sub} ISN'T!", dry: "Not saying {b} is a catfish. Not saying {b.sub} isn't.", blunt: "{b} might be a catfish.",
    goofy: "I'm not saying {b} is a catfish! I'm just not saying {b.sub} isn't! Glub glub!", shy: "I'm not saying {b} is a catfish. I'm just not saying {b.sub} isn't.", chill: "Not saying {b}'s a catfish, dude. Just not saying {b.sub} isn't.",
    catty: "I'm not saying {b} is a catfish. I'm just not saying {b.sub} isn't. Wink.", diva: "I'm not saying {b} is a catfish, darling. I'm not saying {b.sub} isn't.", stoic: "Maybe a catfish." }],
  ['arrival.react.suspicious.05', "That bio was written by a team. Nobody talks like that.", {
    hype: "That bio was written by a TEAM! NOBODY talks like that!", dry: "That bio was written by a team. Nobody talks like that.", blunt: "Nobody writes a bio like that.",
    goofy: "That bio was written by a team! Nobody talks like that! A team of poets! Tiny poets!", shy: "That bio sounds like it was written by a team. Nobody talks like that.", chill: "That bio was written by a team, dude. Nobody talks like that.",
    catty: "That bio was written by a team. Nobody talks like that. Nobody real.", diva: "That bio had writers, darling. Nobody talks like that.", stoic: "Nobody talks like that." }],
  ['arrival.react.ally.01', "A new face! Somebody who hasn't picked a side yet. I'm getting there first.", {
    hype: "A NEW FACE! Somebody who hasn't PICKED A SIDE yet! I'm getting there FIRST!", dry: "A new face. Hasn't picked a side yet. I'm getting there first.", blunt: "New face. No side yet. I'm first.",
    goofy: "A new face! Somebody who hasn't picked a side yet! I'm getting there first! Out of my way! Nobody's in my way!", shy: "A new face. Somebody who hasn't picked a side yet. I should get there first.", chill: "New face, dude. Hasn't picked a side. Getting there first.",
    catty: "A new face. Hasn't picked a side yet. I'm getting there first. Before the vultures.", diva: "A new face, darling! No side chosen yet. I'll get there first.", stoic: "New face. No side. Me first." }],
  ['arrival.react.ally.02', "Yes! Fresh energy! I love it. I'm messaging {b} immediately.", {
    hype: "YES! FRESH ENERGY! I LOVE it! I'm messaging {b} IMMEDIATELY!", dry: "Fresh energy. I love it. Messaging {b} now.", blunt: "Fresh energy. Messaging {b} now.",
    goofy: "Yes! Fresh energy! I love it! I'm messaging {b} immediately! With so many emojis!", shy: "Yes. Fresh energy. I love it. I'm going to message {b}.", chill: "Fresh energy, dude! Love it. Messaging {b} now.",
    catty: "Fresh energy. I love it. I'm messaging {b} immediately. First impressions matter.", diva: "Fresh energy, darling! I'm messaging {b} at once!", stoic: "Fresh energy. Messaging {b}." }],
  ['arrival.react.ally.03', "{b} doesn't know anybody. Which means {b} needs a friend. Hi. It's me.", {
    hype: "{b} doesn't KNOW anybody! Which means {b} NEEDS a friend! HI! It's ME!", dry: "{b} doesn't know anybody. Needs a friend. Hi. It's me.", blunt: "{b} needs a friend. Me.",
    goofy: "{b} doesn't know anybody! Which means {b} needs a friend! Hi! It's me! The friend!", shy: "{b} doesn't know anybody. Which means {b} needs a friend. Maybe me.", chill: "{b} doesn't know anybody, dude. Needs a friend. Hi. Me.",
    catty: "{b} doesn't know anybody. Which means {b} needs a friend. Hi. It's me. The right one.", diva: "{b} knows no one, darling. {b} needs a friend. Enter me.", stoic: "{b} needs a friend. Me." }],
  ['arrival.react.ally.04', "This is a chance. Get to {b} before the others get in {b.posAdj} ear.", {
    hype: "This is a CHANCE! Get to {b} BEFORE the others get in {b.posAdj} ear!", dry: "This is a chance. Get to {b} before the others get in {b.posAdj} ear.", blunt: "Get to {b} first.",
    goofy: "This is a chance! Get to {b} before the others get in {b.posAdj} ear! Whisper first! Whisper loud!", shy: "This is a chance. I should get to {b} before the others get in {b.posAdj} ear.", chill: "This is a chance, dude. Get to {b} before the others do.",
    catty: "This is a chance. Get to {b} before the others get in {b.posAdj} ear. They'll lie.", diva: "A chance, darling. Reach {b} before the others whisper in {b.posAdj} ear.", stoic: "Get to {b} first." }],
  ['arrival.react.ally.05', "{b} looks so nice. I hope we click.", {
    hype: "{b} looks SO nice! I HOPE we click!", dry: "{b} looks nice. Hope we click.", blunt: "{b} looks nice. Hope we click.",
    goofy: "{b} looks so nice! I hope we click! Click click! Like a seatbelt!", shy: "{b} looks so nice. I really hope we click.", chill: "{b} looks so nice, dude. Hope we click.",
    catty: "{b} looks so nice. I hope we click. I'm picky.", diva: "{b} looks lovely, darling. I hope we click.", stoic: "{b} looks nice." }],
  ['arrival.react.worried.01', "Great. The new person is safe and I'm still at the bottom. Love that for me.", {
    hype: "GREAT! The new person is SAFE and I'm STILL at the BOTTOM! LOVE that for me!", dry: "Great. New person's safe. I'm still at the bottom. Love that for me.", blunt: "New person's safe. I'm still at the bottom.",
    goofy: "Great! The new person is safe and I'm still at the bottom! Love that for me! I'll decorate the bottom!", shy: "Great. The new person is safe and I'm still at the bottom.", chill: "New person's safe and I'm still at the bottom, dude. Great.",
    catty: "Great. The new person is safe and I'm still at the bottom. Love that for me.", diva: "The new arrival is safe, darling, and I'm still at the bottom. Marvelous.", stoic: "New person's safe. I'm at the bottom." }],
  ['arrival.react.worried.02', "Another person to rate me. Just what I needed.", {
    hype: "ANOTHER person to rate me! JUST what I needed!", dry: "Another person to rate me. Just what I needed.", blunt: "Another rating against me.",
    goofy: "Another person to rate me! Just what I needed! I'll bake the new person cookies! Virtual cookies!", shy: "Another person to rate me. Just what I needed.", chill: "Another person to rate me, dude. Just what I needed.",
    catty: "Another person to rate me. Just what I needed. Another critic.", diva: "Another critic, darling. Just what I needed.", stoic: "Another rater." }],
  ['arrival.react.worried.03', "Every new player is one more vote I don't have.", {
    hype: "EVERY new player is ONE MORE vote I DON'T have!", dry: "Every new player is one more vote I don't have.", blunt: "One more vote I don't have.",
    goofy: "Every new player is one more vote I don't have! I'm running out of votes! Like a jar of jellybeans!", shy: "Every new player is one more vote I don't have.", chill: "Every new player's one more vote I don't have, dude.",
    catty: "Every new player is one more vote I don't have. Yet.", diva: "Every new arrival is one more vote I don't have, darling.", stoic: "One more vote I don't have." }],
  ['arrival.react.worried.04', "If {b} likes everybody else more than me, I'm done.", {
    hype: "If {b} likes EVERYBODY else more than ME, I'm DONE!", dry: "If {b} likes everybody else more than me, I'm done.", blunt: "{b} likes others more, I'm done.",
    goofy: "If {b} likes everybody else more than me, I'm done! Done like a pancake! A burnt one!", shy: "If {b} likes everybody else more than me, I'm done.", chill: "If {b} likes everyone else more than me, I'm done, dude.",
    catty: "If {b} likes everybody else more than me, I'm done. {b} won't, though.", diva: "If {b} prefers everyone else, darling, I'm finished.", stoic: "{b} likes others more, I'm done." }],
  ['arrival.react.worried.05', "Can the new person please just be nice to me? Please?", {
    hype: "Can the new person PLEASE just be NICE to me? PLEASE?!", dry: "Can the new person please just be nice to me. Please.", blunt: "New person, be nice to me.",
    goofy: "Can the new person please just be nice to me? Please? I'll be so nice back! The nicest!", shy: "Can the new person please just be nice to me? Please?", chill: "Can the new person just be nice to me, dude? Please?",
    catty: "Can the new person please just be nice to me? It would be smart of them.", diva: "Can the newcomer please be kind to me, darling? Please?", stoic: "Be nice to me." }],
  // ── a check-in, typed ─────────────────────────────────────────────────
  ['chat.checkin.warm.01', "Hey. How are you holding up after last night? {e:hug}", {
    hype: "HEY!! How are you HOLDING UP after last night?? {e:hug}", dry: "hey. how are you holding up after last night", blunt: "How are you after last night?",
    goofy: "Hey!! How are you holding up after last night? I'm holding up a snack {e:hug}", shy: "Hey. How are you holding up after last night? {e:hug}", chill: "hey. how you holding up after last night? {e:hug}",
    catty: "Hey. How are you holding up after last night? That was brutal {e:hug}", diva: "Darling. How are you holding up after last night? {e:hug}", stoic: "Holding up after last night?" }],
  ['chat.checkin.warm.02', "Just wanted to say I'm really glad you're still here {e:heart}", {
    hype: "Just wanted to say I'm SO glad you're STILL HERE {e:heart} {e:heart}", dry: "just wanted to say i'm really glad you're still here", blunt: "Glad you're still here",
    goofy: "Just wanted to say I'm really glad you're still here {e:heart} I'd be so bored without you", shy: "Just wanted to say I'm really glad you're still here {e:heart}", chill: "just wanted to say I'm really glad you're still here {e:heart}",
    catty: "Just wanted to say I'm really glad you're still here. One of the few I'm glad about {e:heart}", diva: "I'm so glad you're still here, darling {e:heart}", stoic: "Glad you're still here" }],
  ['chat.checkin.warm.03', "Being at the bottom sucks. You okay?", {
    hype: "Being at the BOTTOM sucks!! You OKAY??", dry: "being at the bottom sucks. you okay", blunt: "Bottom sucks. You okay?",
    goofy: "Being at the bottom sucks!! You okay? The bottom is a terrible neighborhood", shy: "Being at the bottom sucks. Are you okay?", chill: "being at the bottom sucks. you okay?",
    catty: "Being at the bottom sucks. You okay? They don't know what they're doing", diva: "The bottom is dreadful, darling. Are you okay?", stoic: "The bottom sucks. Okay?" }],
  ['chat.checkin.warm.04', "Morning! Just checking on you. Did you sleep at all?", {
    hype: "MORNING!! Just checking on you!! Did you SLEEP at all??", dry: "morning. just checking on you. did you sleep at all", blunt: "Morning. Did you sleep?",
    goofy: "Morning!! Just checking on you. Did you sleep at all? I slept like a starfish", shy: "Morning! Just checking on you. Did you sleep at all?", chill: "morning! just checking on you. did you sleep at all?",
    catty: "Morning. Just checking on you. Did you sleep at all? You'd be forgiven if not", diva: "Good morning, darling! Did you sleep at all?", stoic: "Morning. Sleep?" }],
  ['chat.checkin.warm.05', "Hey you. Saw the ratings. I just want you to know I've got you {e:heart}", {
    hype: "HEY YOU!! Saw the ratings. I just want you to KNOW I'VE GOT YOU {e:heart}", dry: "hey you. saw the ratings. i've got you", blunt: "Saw the ratings. I've got you",
    goofy: "Hey you!! Saw the ratings. I just want you to know I've got you {e:heart} Like a superhero. A sleepy one", shy: "Hey you. I saw the ratings. I just want you to know I've got you {e:heart}", chill: "hey you. saw the ratings. just want you to know I've got you {e:heart}",
    catty: "Hey you. Saw the ratings. I've got you. They don't {e:heart}", diva: "Hello, you. I saw the ratings, darling. I've got you {e:heart}", stoic: "Saw the ratings. I've got you" }],
  ['chat.checkin.warm.06', "How are you feeling this morning? For real", {
    hype: "How are you FEELING this morning?? FOR REAL!!", dry: "how are you feeling this morning. for real", blunt: "How do you feel? Really",
    goofy: "How are you feeling this morning? For real. Not 'fine'. Real feelings", shy: "How are you feeling this morning? For real", chill: "how you feeling this morning? for real",
    catty: "How are you feeling this morning? For real. Not the group chat answer", diva: "How do you truly feel this morning, darling?", stoic: "How are you? Really" }],
  ['chat.checkin.neutral.01', "Hey, you doing okay after last night?", {
    hype: "HEY!! You doing OKAY after last night??", dry: "hey. you doing okay after last night", blunt: "Okay after last night?",
    goofy: "Hey, you doing okay after last night? Last night was a lot. Like a whole soap opera", shy: "Hey, are you doing okay after last night?", chill: "hey, you doing okay after last night?",
    catty: "Hey, you doing okay after last night? That was something", diva: "Darling, are you okay after last night?", stoic: "Okay after last night?" }],
  ['chat.checkin.neutral.02', "Hope you're okay today {e:hug}", {
    hype: "HOPE you're okay today!! {e:hug} {e:heart}", dry: "hope you're okay today", blunt: "Hope you're okay",
    goofy: "Hope you're okay today {e:hug} Sending a virtual blanket", shy: "Hope you're okay today {e:hug}", chill: "hope you're okay today {e:hug}",
    catty: "Hope you're okay today {e:hug}", diva: "I do hope you're okay today, darling {e:hug}", stoic: "Hope you're okay" }],
  ['chat.checkin.neutral.03', "Hey, how are you feeling?", {
    hype: "HEY!! How are you FEELING??", dry: "hey. how are you feeling", blunt: "How do you feel?",
    goofy: "Hey, how are you feeling? On a scale from one to puppy?", shy: "Hey, how are you feeling?", chill: "hey, how you feeling?",
    catty: "Hey, how are you feeling? Honestly", diva: "Darling, how are you feeling?", stoic: "How are you?" }],
  ['chat.checkin.cold.01', "Hey, are you okay after the ratings?", {
    hype: "HEY!! Are you OKAY after the ratings??", dry: "hey. are you okay after the ratings", blunt: "Okay after the ratings?",
    goofy: "Hey, are you okay after the ratings? The ratings are mean. Like a grumpy cat", shy: "Hey, are you okay after the ratings?", chill: "hey, you okay after the ratings?",
    catty: "Hey, are you okay after the ratings? People can be harsh", diva: "Are you alright after the ratings, darling?", stoic: "Okay after the ratings?" }],
  ['chat.checkin.cold.02', "Checking in on you {e:hug}", {
    hype: "CHECKING IN on you!! {e:hug}", dry: "checking in on you", blunt: "Checking in",
    goofy: "Checking in on you {e:hug} Knock knock. It's me. The check-in", shy: "Just checking in on you {e:hug}", chill: "checking in on you {e:hug}",
    catty: "Checking in on you {e:hug}", diva: "Checking in on you, darling {e:hug}", stoic: "Checking in" }],
  ['chat.checkin.cold.03', "Hey. Rough day?", {
    hype: "HEY!! Rough day??", dry: "hey. rough day", blunt: "Rough day?",
    goofy: "Hey. Rough day? Mine was rough too. I dropped my toast", shy: "Hey. Rough day?", chill: "hey. rough day?",
    catty: "Hey. Rough day? Looked like it", diva: "Hello, darling. A rough day?", stoic: "Rough day?" }],
  // ── fishing for information, typed ────────────────────────────────────
  ['chat.pump.warm.01', "Okay spill. What was last night like for you?", {
    hype: "Okay SPILL!! What was last night LIKE for you??", dry: "ok spill. what was last night like for you", blunt: "Spill. How was last night?",
    goofy: "Okay spill!! What was last night like for you? Spill like a milkshake", shy: "Okay, spill. What was last night like for you?", chill: "ok spill. what was last night like for you?",
    catty: "Okay spill. What was last night like for you? Every detail", diva: "Spill, darling. What was last night like for you?", stoic: "Last night. Spill" }],
  ['chat.pump.warm.02', "Be honest with me. Is anybody coming after me?", {
    hype: "Be HONEST with me!! Is ANYBODY coming after me??", dry: "be honest with me. is anybody coming after me", blunt: "Is anyone coming for me?",
    goofy: "Be honest with me!! Is anybody coming after me? Like, with a net?", shy: "Be honest with me. Is anybody coming after me?", chill: "be honest with me. anybody coming after me?",
    catty: "Be honest with me. Is anybody coming after me? I want names", diva: "Be honest, darling. Is anyone coming after me?", stoic: "Anyone coming for me?" }],
  ['chat.pump.warm.03', "What's the word on me right now? You can be honest", {
    hype: "What's the WORD on me right now?? You can be HONEST!!", dry: "what's the word on me right now. you can be honest", blunt: "What are people saying about me?",
    goofy: "What's the word on me right now? You can be honest! Is the word 'snack'? It's probably snack", shy: "What's the word on me right now? You can be honest", chill: "what's the word on me right now? you can be honest",
    catty: "What's the word on me right now? You can be honest. I can take it", diva: "What's the word on me, darling? Be honest", stoic: "Word on me?" }],
  ['chat.pump.warm.04', "Okay I have to ask. Who do you think isn't real in here?", {
    hype: "Okay I HAVE to ask!! Who do you think ISN'T real in here?? {e:eyes}", dry: "ok i have to ask. who do you think isn't real in here", blunt: "Who's not real in here?",
    goofy: "Okay I have to ask!! Who do you think isn't real in here? Besides the plastic fruit", shy: "Okay, I have to ask. Who do you think isn't real in here?", chill: "ok I have to ask. who do you think isn't real in here?",
    catty: "Okay I have to ask. Who do you think isn't real in here? I have a list {e:eyes}", diva: "I must ask, darling. Who isn't real in here?", stoic: "Who's not real?" }],
  ['chat.pump.warm.05', "Who's close with who right now? I feel like I'm missing something", {
    hype: "WHO'S close with WHO right now?? I feel like I'm MISSING something", dry: "who's close with who right now. i feel like i'm missing something", blunt: "Who's close with who? I'm missing something",
    goofy: "Who's close with who right now? I feel like I'm missing something. Like a map. A friendship map", shy: "Who's close with who right now? I feel like I'm missing something", chill: "who's close with who right now? feel like I'm missing something",
    catty: "Who's close with who right now? I feel like I'm missing something. I hate missing things", diva: "Who's close with whom, darling? I'm missing something", stoic: "Who's close with who?" }],
  ['chat.pump.warm.06', "Okay be honest. What's everybody saying in here?", {
    hype: "Okay be HONEST!! What's EVERYBODY saying in here??", dry: "ok be honest. what's everybody saying in here", blunt: "What's everyone saying?",
    goofy: "Okay be honest!! What's everybody saying in here? I want the gossip. All of it. With sprinkles", shy: "Okay, be honest. What's everybody saying in here?", chill: "ok be honest. what's everybody saying in here?",
    catty: "Okay be honest. What's everybody saying in here? I want it all", diva: "Be honest, darling. What is everyone saying?", stoic: "What are they saying?" }],
  ['chat.pump.warm.07', "Real question. Am I safe right now?", {
    hype: "REAL QUESTION!! Am I SAFE right now??", dry: "real question. am i safe right now", blunt: "Am I safe?",
    goofy: "Real question!! Am I safe right now? Should I build a fort?", shy: "Real question. Am I safe right now?", chill: "real question. am I safe right now?",
    catty: "Real question. Am I safe right now? Don't sugarcoat it", diva: "A real question, darling. Am I safe?", stoic: "Am I safe?" }],
  ['chat.pump.neutral.01', "So what did you think of everything last night?", {
    hype: "So what did you THINK of EVERYTHING last night??", dry: "so what did you think of everything last night", blunt: "Thoughts on last night?",
    goofy: "So what did you think of everything last night? I'm still processing. Like a slow computer", shy: "So what did you think of everything last night?", chill: "so what'd you think of everything last night?",
    catty: "So what did you think of everything last night? Interesting, wasn't it?", diva: "What did you make of last night, darling?", stoic: "Last night. Thoughts?" }],
  ['chat.pump.neutral.02', "Did anyone say anything about me? Just curious", {
    hype: "Did ANYONE say ANYTHING about me?? Just CURIOUS!!", dry: "did anyone say anything about me. just curious", blunt: "Anyone talking about me?",
    goofy: "Did anyone say anything about me? Just curious! Totally casual! Very casual!", shy: "Did anyone say anything about me? Just curious", chill: "anyone say anything about me? just curious",
    catty: "Did anyone say anything about me? Just curious. Very curious", diva: "Has anyone mentioned me, darling? Just curious", stoic: "Anyone mention me?" }],
  ['chat.pump.neutral.03', "You seem to know what's going on in here. What's the vibe?", {
    hype: "You seem to KNOW what's going on in here!! What's the VIBE??", dry: "you seem to know what's going on in here. what's the vibe", blunt: "You know things. What's the vibe?",
    goofy: "You seem to know what's going on in here! What's the vibe? Is it a good vibe? A weird vibe?", shy: "You seem to know what's going on in here. What's the vibe?", chill: "you seem to know what's going on in here. what's the vibe?",
    catty: "You seem to know what's going on in here. What's the vibe? Tell me everything", diva: "You seem to know everything, darling. What's the vibe?", stoic: "What's the vibe?" }],
  ['chat.pump.neutral.04', "Okay, spill. Who are you closest with in here?", {
    hype: "Okay, SPILL!! Who are you CLOSEST with in here??", dry: "ok, spill. who are you closest with in here", blunt: "Who are you closest with?",
    goofy: "Okay, spill!! Who are you closest with in here? I'll guess. Is it the fridge?", shy: "Okay, spill. Who are you closest with in here?", chill: "ok, spill. who you closest with in here?",
    catty: "Okay, spill. Who are you closest with in here? Be honest", diva: "Spill, darling. Who are you closest with?", stoic: "Closest with?" }],
  ['chat.pump.neutral.05', "Have you heard anything interesting today?", {
    hype: "Have you heard ANYTHING interesting today??", dry: "have you heard anything interesting today", blunt: "Heard anything?",
    goofy: "Have you heard anything interesting today? I heard a pipe gurgle. That's all I've got", shy: "Have you heard anything interesting today?", chill: "heard anything interesting today?",
    catty: "Have you heard anything interesting today? I need something", diva: "Heard anything interesting today, darling?", stoic: "Heard anything?" }],
  ['chat.pump.neutral.06', "Who do you think is running this place right now?", {
    hype: "WHO do you think is RUNNING this place right now??", dry: "who do you think is running this place right now", blunt: "Who's running this place?",
    goofy: "Who do you think is running this place right now? Honestly, the Circle. It's very bossy", shy: "Who do you think is running this place right now?", chill: "who do you think's running this place right now?",
    catty: "Who do you think is running this place right now? Not who they think", diva: "Who's running this show, darling?", stoic: "Who's in charge?" }],
  ['chat.pump.cold.01', "So what happened last night? You can tell me", {
    hype: "So what HAPPENED last night?? You can TELL me!!", dry: "so what happened last night. you can tell me", blunt: "What happened last night?",
    goofy: "So what happened last night? You can tell me! I'm a vault! A leaky vault, but a vault", shy: "So what happened last night? You can tell me", chill: "so what happened last night? you can tell me",
    catty: "So what happened last night? You can tell me. I won't tell anyone. Much", diva: "What happened last night, darling? You can tell me", stoic: "What happened?" }],
  ['chat.pump.cold.02', "Anything I should know about? Anyone coming for me?", {
    hype: "ANYTHING I should know about?? ANYONE coming for me??", dry: "anything i should know about. anyone coming for me", blunt: "Anything I should know? Anyone after me?",
    goofy: "Anything I should know about? Anyone coming for me? With pitchforks? Tiny pitchforks?", shy: "Is there anything I should know about? Is anyone coming for me?", chill: "anything I should know about? anyone coming for me?",
    catty: "Anything I should know about? Anyone coming for me? They'd regret it", diva: "Anything I should know, darling? Anyone coming for me?", stoic: "Anyone after me?" }],
  ['chat.pump.cold.03', "Hey, did you hear anything interesting today?", {
    hype: "HEY!! Did you hear ANYTHING interesting today??", dry: "hey. did you hear anything interesting today", blunt: "Hear anything today?",
    goofy: "Hey, did you hear anything interesting today? I'm starving for news. And lunch", shy: "Hey, did you hear anything interesting today?", chill: "hey, hear anything interesting today?",
    catty: "Hey, did you hear anything interesting today? Anything at all?", diva: "Hello, darling. Heard anything interesting today?", stoic: "Hear anything?" }],
];

// Voice versions, batch 1 (the user, 2026-10-19: "voice versions on key lines"): closing a chat, the deep talk, and
// opening and keeping up Circle Chat. Each is [entry id, the key turn's text as written, { register: what they say }].
// The text is matched exactly (lines/index.js applyVoices): a line rewritten later fails the test loudly instead of
// a version drifting onto a turn it was never written for. Warm, formal and flirty keep the line as written.
export const VOICES = [
  // ── closing a chat, warm ──────────────────────────────────────────────
  ['chat.close.warm.01', "Okay I have to go but this was the best chat of my day", {
    hype: "Gotta go but that was the BEST chat of the whole day {e:fire}", dry: "I have to go. That was, annoyingly, the best part of my day",
    blunt: "Have to go. Best chat I've had today. That's a fact", goofy: "I have to go but this chat was better than the cereal I had for lunch, and that cereal was great",
    shy: "Um, I have to go. But this was really nice. The nicest part of today", chill: "Gotta bounce, dude. Best chat of my day though",
    catty: "I have to go. You were easily the least irritating person I talked to today", diva: "I must go, darling, but that was the highlight of my day. Possibly my week",
    stoic: "Have to go. Best talk today" }],
  ['chat.close.warm.02', "Talk later?", {
    hype: "Talk later?? Please say yes!!", dry: "Talk later. If you can bear it", blunt: "We're talking later. Yes?",
    goofy: "Talk later? I'll bring the imaginary snacks", shy: "Um, could we talk later? Only if you want", chill: "Catch you later, yeah?",
    catty: "Talk later. Don't get bored without me", diva: "Same time later, darling? I'll clear my schedule", stoic: "Later?" }],
  ['chat.close.warm.03', "I'm really glad we're friends in here", {
    hype: "I'm SO glad we're friends in here, seriously!!", dry: "For the record, I'm glad we're friends. Don't make it weird",
    blunt: "I'm glad we're friends. I don't say that to everyone", goofy: "We're friends now. It's official. I'm making us matching imaginary bracelets",
    shy: "I'm really glad we're friends. I didn't think I'd make any", chill: "Glad we're buds in here, dude. For real",
    catty: "I'm glad we're friends. You're one of the few in here worth it", diva: "Darling, our friendship is the best storyline of this season",
    stoic: "Glad we're friends" }],
  ['chat.close.warm.04', "Same time tomorrow? Lol", {
    hype: "SAME TIME TOMORROW! It's a standing date!", dry: "Same time tomorrow. I'll clear my very busy schedule of nothing",
    blunt: "Tomorrow. Same time. Deal?", goofy: "Same time tomorrow? I'll be here. I live here. I have nowhere else to be lol",
    shy: "Um, same time tomorrow? If that's okay", chill: "Same time tomorrow, yeah? Easy",
    catty: "Same time tomorrow. I'll pencil you in", diva: "Same time tomorrow, darling. Your appointment with the star is confirmed", stoic: "Tomorrow. Same time" }],
  ['chat.close.warm.05', "You always make me feel better", {
    hype: "You ALWAYS make me feel better! Every time!", dry: "Somehow you always make me feel better. It's suspicious",
    blunt: "You make me feel better. Every time. Thanks", goofy: "You make me feel better than a warm blanket fresh out of the dryer",
    shy: "You always make me feel better. I don't know how to say thank you enough", chill: "You always calm me down, dude. Appreciate it",
    catty: "You're the only one in here who makes me feel better. Don't let it go to your head", diva: "Darling, you're my remedy. My medicine. My standing ovation",
    stoic: "You help. Thank you" }],
  ['chat.close.warm.06', "Okay going before I tell you all my secrets", {
    hype: "Okay I'm going before I tell you EVERYTHING lol", dry: "Leaving before I overshare. Too late, probably",
    blunt: "I'm going. I've said too much already", goofy: "Leaving before I tell you about the time I got stuck in a waterslide",
    shy: "I should go before I say something embarrassing", chill: "Gotta go before I spill everything, dude",
    catty: "I'm going. You've heard enough of my secrets for one day", diva: "I must leave before I reveal my entire tragic backstory, darling",
    stoic: "Going. Before I say too much" }],
  ['chat.close.warm.07', "Thank you for this. Really", {
    hype: "Thank you for this!! Seriously, thank you!!", dry: "Thanks for this. I mean it, which is rare",
    blunt: "Thank you. That helped", goofy: "Thank you for this. I'd give you a trophy if I had one. I have a spoon. Here's a spoon",
    shy: "Thank you. Really. That meant a lot to me", chill: "Thanks for this, dude. Needed it",
    catty: "Thank you. Genuinely. Don't tell anyone I said that", diva: "Thank you, darling. You've given me a beautiful moment", stoic: "Thank you" }],
  ['chat.close.warm.08', "Okay, back to the madness {e:laugh}", {
    hype: "Back to the madness! Let's GO {e:laugh}", dry: "Back to the madness. Wish me luck", blunt: "Back to it. Later",
    goofy: "Back to the madness! I'm going to go talk to my toaster {e:laugh}", shy: "Okay, back to everything. Wish me luck",
    chill: "Back to the chaos, dude. Stay easy", catty: "Back to the circus. Pray for me", diva: "Back to the madness! The show must go on! {e:sparkle}",
    stoic: "Back to it" }],
  ['chat.close.warm.09', "This was exactly what I needed", {
    hype: "This was EXACTLY what I needed! Thank you!", dry: "That was what I needed. I won't admit it twice",
    blunt: "I needed that. Thanks", goofy: "This was exactly what I needed, like a nap but with words", shy: "This was exactly what I needed. I didn't know until now",
    chill: "That was exactly the vibe I needed, dude", catty: "That was exactly what I needed. A conversation with someone sane",
    diva: "Darling, that was exactly the intermission I needed", stoic: "Needed that" }],
  ['chat.close.warm.10', "Okay, I'm smiling at my screen like an idiot", {
    hype: "I'm SMILING at my screen like an idiot right now lol", dry: "I'm smiling at a screen. Gross. Your fault",
    blunt: "I'm smiling at my screen. That's on you", goofy: "I'm smiling so hard my face is going to get stuck like this {e:laugh}",
    shy: "Um, I'm smiling at my screen now. That's embarrassing", chill: "I'm grinning at the screen, dude. Good chat",
    catty: "I'm smiling at my screen, and I never smile at anything in here", diva: "I'm beaming at my screen, darling. Somebody get the cameras",
    stoic: "I'm smiling. That's rare" }],
  ['chat.close.warm.11', "Let's do this again soon", {
    hype: "We're doing this again SOON! That's a promise!", dry: "Let's do this again. Soon-ish", blunt: "We'll do this again. Soon",
    goofy: "Let's do this again soon! Same time, same channel, same pajamas", shy: "Could we do this again soon? I'd really like that",
    chill: "Let's do this again sometime, dude", catty: "We'll do this again. You're one of the few I'd say that to",
    diva: "An encore! We must have an encore, darling", stoic: "Again soon" }],
  ['chat.close.warm.12', "Okay I'm off. Love this chat", {
    hype: "I'm off! LOVE this chat!", dry: "I'm off. This chat was tolerable. High praise", blunt: "I'm off. Good chat",
    goofy: "I'm off! Love this chat more than I love dessert, and I REALLY love dessert", shy: "I'm going to go. I loved this chat",
    chill: "Alright, I'm out. Love this chat, dude", catty: "I'm off. This was the only good chat in here today",
    diva: "I'm off, darling! What a scene that was!", stoic: "Off. Good chat" }],
  ['chat.close.warm.13', "Thanks for always being real with me", {
    hype: "Thank you for ALWAYS being real with me!!", dry: "Thanks for being real with me. Nobody else in here is",
    blunt: "Thanks for being straight with me. I respect it", goofy: "Thanks for being real with me. Realer than the fake plant in my apartment",
    shy: "Thank you for always being honest with me. It helps", chill: "Thanks for keeping it real, dude",
    catty: "Thank you for being real. It's rarer in here than you'd think", diva: "Thank you for your honesty, darling. It's a rare gift in this production",
    stoic: "Thanks for being honest" }],
  ['chat.close.warm.14', "Okay, I'll leave you be", {
    hype: "Okay I'll leave you alone now! Bye!", dry: "I'll leave you in peace. Enjoy it", blunt: "I'll leave you to it",
    goofy: "I'll leave you be. Go do something fun. Like stare at the ceiling. That's what I'm doing",
    shy: "I'll leave you alone now. Sorry if I kept you", chill: "I'll let you chill, dude", catty: "I'll leave you be. Try not to miss me",
    diva: "I'll leave you be, darling. You need your rest. We all do", stoic: "I'll go" }],
  ['chat.close.warm.15', "Glad I messaged you", {
    hype: "SO glad I messaged you!!", dry: "Glad I messaged you. Good call, past me", blunt: "Glad I messaged you",
    goofy: "Glad I messaged you instead of my fridge. The fridge never answers",
    shy: "I'm glad I messaged you. I almost didn't", chill: "Glad I hit you up, dude",
    catty: "Glad I messaged you. The alternatives were dire", diva: "So glad I graced your inbox, darling", stoic: "Glad I did" }],
  // ── closing a chat, neutral ───────────────────────────────────────────
  ['chat.close.neutral.01', "Okay, talk soon", {
    hype: "Talk soon! Byeee!", dry: "Okay. Talk soon. Probably", blunt: "Talk soon", goofy: "Talk soon! Or later! Or soon-later!",
    shy: "Okay, um, talk soon", chill: "Talk soon, dude", catty: "Talk soon, I suppose", diva: "Until next time, darling", stoic: "Later" }],
  ['chat.close.neutral.02', "Anyway, I'll let you go", {
    hype: "Anyway! I'll let you go! Bye!", dry: "Anyway. I'll let you go. You're free", blunt: "I'll let you go",
    goofy: "Anyway, I'll let you go. Fly, little bird", shy: "I'll let you go now. Sorry for keeping you", chill: "Anyway, I'll let you get on with it",
    catty: "Anyway, I'm sure you have very important things to do", diva: "I'll release you now, darling", stoic: "Okay. Go" }],
  ['chat.close.neutral.03', "Alright, good chat", {
    hype: "Good chat! Great chat actually!", dry: "Good chat. Shockingly", blunt: "Good chat", goofy: "Good chat! Ten out of ten, would chat again",
    shy: "That was a good chat. Thank you", chill: "Good chat, dude", catty: "That was fine. Good chat", diva: "Good chat, darling. A solid performance", stoic: "Good talk" }],
  ['chat.close.neutral.04', "I'll let you get back to it", {
    hype: "I'll let you get back to it! Have a great one!", dry: "Back to your thrilling day you go", blunt: "Get back to it",
    goofy: "I'll let you get back to whatever you're doing. I assume it's eating", shy: "Okay, I'll let you get back to it. Bye",
    chill: "I'll let you get back to it, dude", catty: "I'll let you get back to whatever it is you do all day",
    diva: "Back to your scene, darling. I'll return to mine", stoic: "Back to it" }],
  ['chat.close.neutral.05', "Okay cool. Bye for now", {
    hype: "Cool cool! Bye for now!", dry: "Cool. Bye for now", blunt: "Okay. Bye", goofy: "Cool beans. Bye for now",
    shy: "Okay, cool. Um, bye", chill: "Cool, later dude", catty: "Lovely. Bye for now", diva: "Farewell for now, darling", stoic: "Bye" }],
  ['chat.close.neutral.06', "Anyway. Good talk", {
    hype: "Anyway! Great talk!", dry: "Anyway. Good talk. Truly riveting", blunt: "Good talk", goofy: "Anyway. Good talk. Big talk. Massive talk",
    shy: "Anyway, this was nice", chill: "Anyway, good talk, man", catty: "Anyway. That was a talk", diva: "Anyway. A charming little scene, darling", stoic: "Good talk" }],
  ['chat.close.neutral.07', "Alright, I'll check in later", {
    hype: "I'll check in later! Promise!", dry: "I'll check in later. Brace yourself", blunt: "I'll check in later",
    goofy: "I'll check in later! Like a hotel! Ding ding", shy: "I'll check in later, if that's okay", chill: "I'll check in later, dude",
    catty: "I'll check in later. Try to be interesting by then", diva: "I'll grace you with a check-in later, darling", stoic: "Later" }],
  ['chat.close.neutral.08', "Okay, gotta go do Circle things", {
    hype: "Gotta go do Circle things! Busy busy!", dry: "Off to do Circle things. Whatever those are", blunt: "Got stuff to do. Later",
    goofy: "Gotta go do very important Circle things. Like napping", shy: "I have to go do some Circle things. Bye",
    chill: "Gotta go do Circle stuff, dude", catty: "I have Circle things to attend to. Very important ones",
    diva: "Duty calls, darling. The Circle needs me", stoic: "Have to go" }],
  ['chat.close.neutral.09', "That's all I had. See you around", {
    hype: "That's all I had! See you around!", dry: "That's all I had. It wasn't much", blunt: "That's it. See you",
    goofy: "That's all I had! My brain is empty now, like a sad little bucket", shy: "That's all I wanted to say. See you around",
    chill: "That's all, dude. See you around", catty: "That's all. Don't miss me too much", diva: "That's my whole monologue, darling. Exit", stoic: "That's all" }],
  ['chat.close.neutral.10', "Okay, signing off", {
    hype: "Signing off! Peace!", dry: "Signing off. Dramatic, I know", blunt: "Signing off", goofy: "Signing off! Beep boop, robot noises",
    shy: "Okay, I'm signing off now", chill: "Signing off, dude. Easy", catty: "Signing off. You're welcome", diva: "And the star signs off! Goodnight, darling", stoic: "Off" }],
  ['chat.close.neutral.11', "I should probably go", {
    hype: "I should go! But this was fun!", dry: "I should probably go. Apparently that's a thing people do", blunt: "I'm going",
    goofy: "I should probably go. My couch is getting lonely", shy: "Um, I should probably go", chill: "I should probably bounce, dude",
    catty: "I really should go. Places to be. Not really", diva: "I must go, darling. My public awaits", stoic: "Going" }],
  // ── the deep talk ─────────────────────────────────────────────────────
  ['chat.deep.01', "Can I ask you something real? Why are you here? Like actually", {
    hype: "Real question! Why are you HERE? Like what's the actual reason!", dry: "Serious question, and I don't ask many. Why are you actually here",
    blunt: "Why are you here? The real answer", goofy: "Okay serious time, no jokes. Why are you here? I'm here because I wanted free snacks. Kidding. Mostly",
    shy: "Can I ask something personal? Why did you come here? You don't have to answer", chill: "Real talk, dude. Why'd you come here?",
    catty: "Tell me the real reason you're here. Not the one you tell everyone else", diva: "Darling, what brought you to this stage? Tell me your origin story",
    stoic: "Why are you here?" }],
  ['chat.deep.02', "What do you miss most from home?", {
    hype: "What do you miss MOST from home?? Go!", dry: "What do you miss from home. I miss my own couch. That's how low the bar is",
    blunt: "What do you miss from home?", goofy: "What do you miss from home? I miss my dog. And my other dog. And the snacks drawer",
    shy: "Um, what do you miss most from home?", chill: "What do you miss most from back home, man?",
    catty: "What do you miss from home? Besides people who aren't exhausting", diva: "What do you miss from home, darling? I miss my mirror. The good mirror",
    stoic: "What do you miss from home?" }],
  ['chat.deep.03', "Of course. It stays with me", {
    hype: "Of course! It stays with me, I promise!", dry: "Of course. I'm a vault. A boring vault", blunt: "It stays with me. Go",
    goofy: "Of course. My lips are sealed. Zip. Locked. I swallowed the key", shy: "Of course. I won't tell anyone, I promise",
    chill: "For sure, dude. Stays between us", catty: "Of course. I keep secrets. Unlike most people in here", diva: "Darling, my lips are sealed. Dramatically sealed",
    stoic: "It stays with me" }],
  ['chat.deep.04', "What would you do with the money if you won?", {
    hype: "What would you do with the money?? Dream BIG!", dry: "What would you do with the money. Be honest, not inspiring",
    blunt: "If you win, what's the money for?", goofy: "What would you do with the money? I'd buy a hot tub full of cheese. That's a joke. Probably",
    shy: "Can I ask what you'd do with the money? If you won?", chill: "What would you do with the cash if you won, dude?",
    catty: "What would you do with the money? And don't say charity, nobody believes that", diva: "What would you do with the prize, darling? I'd buy a fountain. Of myself",
    stoic: "The money. What's it for?" }],
  ['chat.deep.05', "Who's waiting for you at home?", {
    hype: "Who's waiting for you at home?? Tell me everything!", dry: "Who's waiting for you at home. Besides your laundry", blunt: "Who's waiting for you back home?",
    goofy: "Who's waiting for you at home? My goldfish is waiting for me. Bubbles. He's very patient",
    shy: "Is somebody waiting for you at home?", chill: "Who's waiting back home for you, man?", catty: "Who's waiting at home? Someone who actually likes you, I hope",
    diva: "Who awaits your triumphant return, darling?", stoic: "Who's waiting for you?" }],
  ['chat.deep.06', "Not weird. I feel it too", {
    hype: "Not weird at all! I feel it too!", dry: "Not weird. I feel it too. Gross, but true", blunt: "Not weird. Same",
    goofy: "Not weird! Weird would be if I said I feel it in my elbow. I feel it in my heart", shy: "It's not weird. I feel it too. I just didn't want to say",
    chill: "Nah, not weird, dude. I feel it too", catty: "It's not weird. I feel it too, and I don't feel things", diva: "Not weird, darling. Poetic. I feel it too", stoic: "Not weird. Same" }],
  ['chat.deep.07', "What's the hardest part of this for you?", {
    hype: "What's the HARDEST part for you? Be real!", dry: "What's the hardest part of this. For me it's the silence. And everyone",
    blunt: "What's the hardest part?", goofy: "What's the hardest part for you? Mine is not knowing what day it is. Is it Tuesday? It feels like a Tuesday",
    shy: "Can I ask what's hardest for you in here?", chill: "What's been the toughest part for you, dude?",
    catty: "What's the hardest part of this for you? Besides the company", diva: "What's your greatest struggle in here, darling? Mine is the lighting",
    stoic: "Hardest part for you?" }],
  ['chat.deep.08', "When this is over we're getting coffee. Real coffee. In person", {
    hype: "When this is over we're getting coffee! In PERSON! It's happening!", dry: "When this is over, coffee. In person. I'll even put on real clothes",
    blunt: "When we're out, coffee. In person. That's happening", goofy: "When this is over we're getting coffee. And a muffin. Maybe nine muffins",
    shy: "Um, when this is over, could we get coffee? In person?", chill: "When we're out, let's grab coffee, dude. For real",
    catty: "When this is over, coffee. I'll even let you pick the place", diva: "When this is over, darling, we're having coffee somewhere fabulous",
    stoic: "Coffee when we're out" }],
  ['chat.deep.09', "Talk to me. What's going on in that head?", {
    hype: "Talk to me! What's going on in there!", dry: "What's going on in your head. Take your time. I'm not going anywhere",
    blunt: "What's going on with you? Say it", goofy: "Talk to me! What's going on in that head? Is it soup? It's usually soup in mine",
    shy: "Are you okay? You can talk to me if you want", chill: "What's on your mind, dude? Talk to me",
    catty: "Something's bothering you. Tell me, I won't judge. Much", diva: "Speak, darling. What's the drama in that head of yours?", stoic: "What's on your mind?" }],
  ['chat.deep.10', "Okay, deep question. What's something people always get wrong about you?", {
    hype: "DEEP QUESTION! What do people always get wrong about you?!", dry: "Deep question. What do people get wrong about you. Mine: I'm not grumpy. I'm just tired",
    blunt: "What do people get wrong about you?", goofy: "Deep question! What do people get wrong about you? People think I'm silly. They're right. But also wrong",
    shy: "Can I ask a deep question? What do people get wrong about you?", chill: "Deep one, dude. What do people get wrong about you?",
    catty: "What do people always get wrong about you? I'm curious which mistake they make", diva: "Darling, what do the critics always get wrong about you?",
    stoic: "What do people get wrong about you?" }],
  // ── keeping up Circle Chat ────────────────────────────────────────────
  ['circle.more.m01', "Movie night in every apartment. What are we watching?", {
    hype: "MOVIE NIGHT! What are we watching?? I need answers!", dry: "Movie night. What are we watching. Please not a rom com",
    blunt: "Movie night. Pick something", goofy: "Movie night! I'm watching the microwave. It's a thriller", shy: "Um, is anyone watching a movie tonight?",
    chill: "Movie night, everyone. What's the vibe?", catty: "Movie night. Let's see whose taste is terrible", diva: "Movie night, darlings! I'll be watching my own highlight reel",
    stoic: "Movie night. What are we watching?" }],
  ['circle.more.m02', "Confession: I've talked to my TV more than to any of you", {
    hype: "Confession: I've talked to my TV more than ALL of you combined!", dry: "Confession: my TV and I are close now. It's a better listener than most",
    blunt: "I've talked to my TV more than to any of you. Fix that", goofy: "Confession: I've talked to my TV more than to any of you. It's very supportive",
    shy: "Um, confession, I've talked to my TV more than to anyone in here", chill: "Real talk, my TV's my best friend in here, dude",
    catty: "Confession: my TV is better company than some of you", diva: "Confession, darlings: my reflection and I have been rehearsing all day",
    stoic: "I talk to my TV more than to you all" }],
  ['circle.more.m03', "Who's the early bird in here? Be honest", {
    hype: "Who's the early bird?? I bet it's me!", dry: "Who's up early. Not me. Never me", blunt: "Who gets up early in here?",
    goofy: "Who's the early bird? I'm more of an early worm. Wait, that's bad for the worm", shy: "Is anyone else an early bird? Or just me?",
    chill: "Any early birds in here? I'm a sleep-in guy", catty: "Who's the early bird? Whoever it is, please stop", diva: "Who's the early bird? Stars sleep until noon, darlings",
    stoic: "Who's up early?" }],
  ['circle.more.m04', "Weirdest thing you've eaten in here so far. Go", {
    hype: "WEIRDEST thing you've eaten in here! GO!", dry: "Weirdest thing you've eaten in here. Mine: sadness. And toast",
    blunt: "Weirdest thing you've eaten here. Go", goofy: "Weirdest thing you've eaten? I had ketchup on a cracker. It was a mistake. I'd do it again",
    shy: "Um, what's the weirdest thing you've eaten in here?", chill: "What's the weirdest thing you've eaten in here, dude?",
    catty: "Weirdest thing you've eaten in here. Judging will happen", diva: "Darlings, the weirdest thing you've eaten in here? I've only eaten caviar. Pretend caviar",
    stoic: "Weirdest thing you've eaten here?" }],
  ['circle.more.m05', "If we all met at a party right now, who's on the dance floor first?", {
    hype: "PARTY QUESTION! Who's on the dance floor first?? Me! Obviously!", dry: "Party question. Who's dancing first. Not me. I'm by the snacks",
    blunt: "At a party, who's dancing first? Answer", goofy: "Party question! Who's dancing first? Me, but badly. Like a confused octopus",
    shy: "If we were at a party, who would dance first? Not me, haha", chill: "If we all hit a party, who's dancing first, dude?",
    catty: "If we were at a party, who's embarrassing themselves on the dance floor first?", diva: "At a party, darlings, who would take center stage? Trick question. Me",
    stoic: "Party. Who dances first?" }],
  ['circle.more.m06', "Rate your day out of ten. I'm a solid six", {
    hype: "Rate your day out of ten! I'm a TEN! Okay, an eight!", dry: "Rate your day out of ten. I'm a five. Generous", blunt: "Rate your day out of ten. Six for me",
    goofy: "Rate your day out of ten! I'm a six and a half. The half is a sandwich", shy: "Um, rate your day out of ten? I'm maybe a six",
    chill: "Rate your day out of ten. I'm a chill seven, dude", catty: "Rate your day out of ten. Mine would be higher without some of you",
    diva: "Rate your day, darlings! Mine is a standing ovation out of ten", stoic: "Rate your day. Six" }],
  ['circle.more.m07', "Okay who else sings to the Circle when nobody's listening", {
    hype: "WHO ELSE SINGS TO THE CIRCLE?? I'm doing it right now!", dry: "Who else sings to the Circle. I'm asking for a friend. The friend is me",
    blunt: "Who sings in here when nobody's listening? Be honest", goofy: "Who else sings to the Circle? I just did a whole musical for my lamp",
    shy: "Does anyone else sing when nobody's listening? Just me?", chill: "Who else sings in here when no one's around, dude?",
    catty: "Who sings to the Circle? Some of you should stop", diva: "Darlings, I sing to the Circle constantly. It's the only audience that deserves me",
    stoic: "Anyone else sing in here?" }],
  ['circle.more.m08', "Unpopular opinion time. Mine: breakfast for dinner is the best dinner", {
    hype: "UNPOPULAR OPINION TIME! Breakfast for dinner is the BEST!", dry: "Unpopular opinion: breakfast for dinner. Fight me. Gently",
    blunt: "Unpopular opinion. Breakfast for dinner is the best dinner. Fight me", goofy: "Unpopular opinion: breakfast for dinner, dinner for breakfast, dessert for everything",
    shy: "Um, unpopular opinion? Breakfast for dinner is really good", chill: "Unpopular opinion, dude: breakfast for dinner rules",
    catty: "Unpopular opinion: half of you are wrong about everything. Also, breakfast for dinner", diva: "Unpopular opinion, darlings: breakfast for dinner is the most glamorous dinner there is",
    stoic: "Breakfast for dinner. Best dinner" }],
  ['circle.more.m09', "What's everybody wearing right now? I'm in pajamas at 4pm", {
    hype: "What's everybody wearing?? I'm in pajamas and I'm THRIVING", dry: "What's everyone wearing. I'm in pajamas. It's afternoon. No regrets",
    blunt: "What's everyone wearing? Pajamas here", goofy: "What's everybody wearing? I'm in pajamas with dinosaurs on them. The dinosaurs are happy",
    shy: "Um, what's everyone wearing? I'm still in pajamas", chill: "What's everyone wearing? Pajamas all day, dude",
    catty: "What's everybody wearing? Please say not sweatpants. Again", diva: "What's everyone wearing, darlings? I'm in a full look. For nobody",
    stoic: "Pajamas. You?" }],
  ['circle.more.m10', "Shout out to whoever keeps the vibes good in here. You know who you are", {
    hype: "SHOUT OUT to whoever keeps the vibes good! You know who you are!", dry: "Shout out to whoever keeps the vibes good. Not me. Someone else",
    blunt: "Shout out to whoever keeps this place decent", goofy: "Shout out to the good vibes people! You're like the sprinkles on this donut",
    shy: "Um, thank you to whoever keeps the vibes good in here", chill: "Shout out to the good vibes crew, dude",
    catty: "Shout out to the good vibes people. You know who you are. So do I. It's a short list", diva: "A bouquet to whoever keeps the vibes good, darlings. Second only to me",
    stoic: "Thanks to whoever keeps things good" }],
  ['circle.more.01', "Okay but who's cooking tonight because it's not me lol", {
    hype: "Who's cooking tonight?? NOT ME lol!", dry: "Who's cooking tonight. Not me. Cereal is a meal", blunt: "Who's cooking? Not me",
    goofy: "Who's cooking tonight? Not me, I set fire to toast once. Okay, twice", shy: "Is anyone cooking tonight? I don't really know how",
    chill: "Who's cooking tonight, dude? Not me lol", catty: "Who's cooking tonight? Not me. I don't do kitchens", diva: "Who's cooking, darlings? Stars don't cook. Stars are cooked for",
    stoic: "Who's cooking?" }],
  ['circle.more.02', "Real talk, how is everybody holding up?", {
    hype: "Real talk! How is EVERYBODY holding up??", dry: "Real talk. How's everyone holding up. Honestly", blunt: "How's everyone holding up? Honest answers",
    goofy: "Real talk, how's everybody? I'm holding up like a very tired sock", shy: "Um, is everybody okay? Just checking",
    chill: "How's everybody holding up, dude?", catty: "How is everyone holding up? Some of you look rough in your pictures", diva: "Darlings, how are we all holding up? I'm magnificent, thank you",
    stoic: "Everyone holding up?" }],
  ['circle.more.03', "Shoutout to everybody still in here. We made it this far {e:clap}", {
    hype: "SHOUT OUT to everybody still in here! We MADE IT! {e:clap}", dry: "Shout out to everyone still in here. We survived. Somehow {e:clap}",
    blunt: "Everyone still in here: good job. Keep going {e:clap}", goofy: "Shout out to everyone still here! We made it! Somebody get balloons {e:clap}",
    shy: "Um, good job everyone, for making it this far {e:clap}", chill: "Props to everyone still here, dude {e:clap}",
    catty: "Congratulations to everyone still here. Even the ones who shouldn't be {e:clap}", diva: "A round of applause for everyone still standing, darlings {e:clap}",
    stoic: "We made it this far {e:clap}" }],
  ['circle.more.04', "Can we play a game in here? Two truths and a lie. Go", {
    hype: "GAME TIME! Two truths and a lie! GO!", dry: "Game. Two truths and a lie. I'll go last, as usual", blunt: "Two truths and a lie. Go",
    goofy: "Game time! Two truths and a lie! I'll start: I'm a dolphin, I love toast, I'm a dolphin", shy: "Could we maybe play two truths and a lie?",
    chill: "Two truths and a lie, everyone? Chill game", catty: "Two truths and a lie. This should tell us who's good at lying", diva: "Two truths and a lie, darlings! Finally, a game for actors",
    stoic: "Two truths and a lie. Go" }],
  ['circle.more.05', "Is it just me or is today dragging", {
    hype: "Is today DRAGGING or is it just me?!", dry: "Is today dragging. Or is time a lie", blunt: "Today is dragging",
    goofy: "Is today dragging? It's moving like a snail with a backpack", shy: "Is today really long, or is it just me?",
    chill: "Today's kinda slow, huh? It's fine though", catty: "Today is dragging. Much like this chat", diva: "Today is dragging, darlings. Where's the second act?",
    stoic: "Long day" }],
  ['circle.more.06', "What's everybody wearing right now, be honest", {
    hype: "What's everybody wearing?! Be honest!", dry: "What's everyone wearing. Be honest. I'll be judging", blunt: "What's everyone wearing? Honest answers",
    goofy: "What's everyone wearing? I'm wearing a blanket like a cape. I'm a superhero now", shy: "Um, what's everyone wearing? Just curious",
    chill: "What's everyone rocking right now?", catty: "What's everyone wearing? Be honest. Then let me judge", diva: "What's everyone wearing, darlings? I'm in sequins. Obviously",
    stoic: "What's everyone wearing?" }],
  ['circle.more.07', "Who else has been talking to their plants in here lol", {
    hype: "WHO ELSE is talking to their plants?! Mine's my best friend!", dry: "Who else talks to their plants. Mine gives great advice. Mostly silence",
    blunt: "Who talks to their plants in here? I do", goofy: "Who else talks to their plants? I named mine Gary. Gary is the only one who gets me",
    shy: "Does anyone else talk to their plants? Just me?", chill: "Anyone else chatting with their plants, dude?",
    catty: "Who else talks to their plants? Mine is better company than half of you", diva: "Who else talks to their plants, darlings? Mine are my audience",
    stoic: "I talk to my plant" }],
  ['circle.more.w01', "Is anybody else's apartment freezing or is it just me", {
    hype: "Is everyone else FREEZING or is it just me?!", dry: "Is anyone else's apartment freezing. Or is mine just like this", blunt: "My apartment is freezing. Yours?",
    goofy: "Is anyone else freezing? I'm wearing three socks. On one foot", shy: "Is anyone else cold? Or is it just me?",
    chill: "Anyone else's place freezing, dude?", catty: "Is anyone else freezing, or is it just the vibe in here", diva: "Is anyone else freezing, darlings? I'm a delicate flower",
    stoic: "Anyone else cold?" }],
  ['circle.more.w02', "What's everybody doing later {e:eyes}", {
    hype: "What's everybody doing LATER?! {e:eyes}", dry: "What's everyone doing later. I'm doing nothing. Again {e:eyes}", blunt: "What's everyone doing later? {e:eyes}",
    goofy: "What's everybody doing later? I'm going to stare at a wall. Very exciting {e:eyes}", shy: "What's everyone doing later? {e:eyes}",
    chill: "What's everyone up to later? {e:eyes}", catty: "What's everyone doing later? Not plotting, I hope {e:eyes}", diva: "What's everyone doing later, darlings? I have a fitting {e:eyes}",
    stoic: "Plans later? {e:eyes}" }],
  ['circle.more.w03', "Rate your day 1-10. Go", {
    hype: "Rate your day 1 to 10! GO GO GO!", dry: "Rate your day, 1 to 10. Mine is a solid meh", blunt: "Rate your day, 1 to 10. Go",
    goofy: "Rate your day 1 to 10! Mine is a potato. That's off the scale", shy: "Could everyone rate their day 1 to 10? Mine's a six",
    chill: "Rate your day 1 to 10. I'm a chill seven", catty: "Rate your day, 1 to 10. Be honest. I'll know", diva: "Rate your day, darlings, 1 to 10. Mine is a twelve",
    stoic: "Day, 1 to 10. Go" }],
  ['circle.more.w04', "Okay who's the early riser in here", {
    hype: "Who's the EARLY RISER?! Show yourselves!", dry: "Who's the early riser. I need to know who to resent", blunt: "Who gets up early in here?",
    goofy: "Who's the early riser? I rose early once. Never again", shy: "Um, is anyone an early riser?", chill: "Who's up early in here? Not me, dude",
    catty: "Who's the early riser? I need to know who to avoid", diva: "Who rises early, darlings? Stars need their beauty sleep", stoic: "Who's up early?" }],
  ['circle.more.w05', "Group workout tomorrow? Everybody in their own apartment lol", {
    hype: "GROUP WORKOUT TOMORROW! Everybody in! No excuses!", dry: "Group workout tomorrow. Everyone in their own apartment. I'll be watching. From bed",
    blunt: "Workout tomorrow. Everyone. Own apartments", goofy: "Group workout tomorrow! I'll be doing the noodle stretch. It's mostly lying down",
    shy: "Would anyone want to do a workout tomorrow? Each in our own place?", chill: "Group workout tomorrow? Low key though, dude",
    catty: "Group workout tomorrow. Some of you could use it", diva: "Group workout tomorrow, darlings! I'll lead. With choreography", stoic: "Workout tomorrow. Who's in?" }],
  ['circle.more.w06', "Does anybody else talk to the Circle like it's a person", {
    hype: "Does anyone else talk to the Circle like it's a PERSON?!", dry: "Does anyone else talk to the Circle like a person. It's a good listener. Never interrupts",
    blunt: "Who else talks to the Circle like it's a person?", goofy: "Does anyone else talk to the Circle like it's a person? I told it a joke. It didn't laugh",
    shy: "Does anyone else talk to the Circle like a person? Is that weird?", chill: "Anyone else chat with the Circle like it's a buddy, dude?",
    catty: "Who else talks to the Circle like a person? It's the only one in here with any sense", diva: "Who else talks to the Circle, darlings? It's my closest confidant",
    stoic: "Anyone else talk to the Circle?" }],
  ['circle.more.w07', "Just wanna say this group is weirdly wholesome", {
    hype: "Just gotta say this group is SO wholesome!", dry: "Just want to say this group is weirdly wholesome. It's unsettling", blunt: "This group is weirdly wholesome. I said it",
    goofy: "This group is so wholesome it's like a big warm bowl of soup", shy: "I just wanted to say this group is really nice",
    chill: "This group's got good vibes, dude. Wholesome", catty: "This group is weirdly wholesome. Give it a week", diva: "This group is wholesome, darlings. A heartwarming ensemble cast",
    stoic: "This group is good" }],
  ['circle.more.w08', "Okay real question. Pineapple on pizza. Yes or no", {
    hype: "REAL QUESTION! Pineapple on pizza! YES OR NO!", dry: "Real question. Pineapple on pizza. Choose wisely, your rating depends on it",
    blunt: "Pineapple on pizza. Yes or no. Choose", goofy: "Real question: pineapple on pizza? Yes. Also pizza on pineapple. Think about it",
    shy: "Um, pineapple on pizza? Yes or no?", chill: "Pineapple on pizza, dude? Yes or no?", catty: "Pineapple on pizza. This will tell me everything I need to know",
    diva: "Pineapple on pizza, darlings? A bold choice. I respect bold choices", stoic: "Pineapple on pizza?" }],
  // ── opening Circle Chat ───────────────────────────────────────────────
  ['circle.open.01', "Morning everyone! How's everybody doing?", {
    hype: "GOOD MORNING EVERYONE! How's everybody doing?!", dry: "Morning. How's everyone doing. Be honest, it's early", blunt: "Morning. How's everyone?",
    goofy: "Morning everyone! How's everybody doing? I just woke up with my face on a cracker", shy: "Um, good morning everyone. How is everybody?",
    chill: "Morning, everyone. How we doing?", catty: "Good morning, everyone. Let's see who's still pretending to be nice", diva: "Good morning, darlings! The star is awake!",
    stoic: "Morning" }],
  ['circle.open.02', "Okay who else is sick of their own cooking already {e:laugh}", {
    hype: "WHO ELSE is sick of their own cooking?! {e:laugh}", dry: "Who else is sick of their own cooking. My cooking is sick of me too {e:laugh}",
    blunt: "Who's sick of their own cooking? I am {e:laugh}", goofy: "Who else is sick of their own cooking? I made spaghetti and it looked at me {e:laugh}",
    shy: "Is anyone else tired of their own cooking? {e:laugh}", chill: "Anyone else tired of their own cooking, dude? {e:laugh}",
    catty: "Who else is sick of their own cooking? Or is it just those of us with standards {e:laugh}", diva: "Who else is sick of their own cooking, darlings? I need a private chef {e:laugh}",
    stoic: "Sick of my own cooking {e:laugh}" }],
  ['circle.open.03', "Can we just take a second and say we're all doing great in here {e:heart} {t:CircleFam}", {
    hype: "Can we just say we're ALL doing amazing in here {e:heart} {t:CircleFam}", dry: "Let's take a second and say we're all doing fine. Fine is good {e:heart} {t:CircleFam}",
    blunt: "We're all doing well in here. Say it {e:heart} {t:CircleFam}", goofy: "Can we all take a second and say we're doing great? Group hug, but with typing {e:heart} {t:CircleFam}",
    shy: "Um, can we say we're all doing great? I think we are {e:heart} {t:CircleFam}", chill: "Can we just say we're all doing great, dude {e:heart} {t:CircleFam}",
    catty: "Let's all take a moment to say we're doing great. Some of us more than others {e:heart} {t:CircleFam}", diva: "Darlings, let's take a moment to applaud ourselves {e:heart} {t:CircleFam}",
    stoic: "We're doing well {e:heart} {t:CircleFam}" }],
  ['circle.open.04', "Question for the group. Best thing you've done in here so far?", {
    hype: "QUESTION! Best thing you've done in here so far?! Go!", dry: "Question. Best thing you've done in here so far. Mine is a nap", blunt: "Best thing you've done in here so far? Go",
    goofy: "Question! Best thing you've done in here so far? I built a fort out of cushions. I live there now", shy: "Um, what's the best thing you've done in here so far?",
    chill: "Best thing you've done in here so far, everyone?", catty: "Best thing you've done in here so far? Besides annoying me", diva: "Best thing you've done in here so far, darlings? Mine is existing",
    stoic: "Best thing you've done in here?" }],
  ['circle.open.05', "Hey everyone! Hope you all slept better than me lol", {
    hype: "HEY EVERYONE! Hope you slept better than me lol!", dry: "Hey everyone. Hope you slept better than me. Low bar", blunt: "Hey. Hope you slept better than I did",
    goofy: "Hey everyone! Hope you slept better than me. I dreamed I was a sandwich lol", shy: "Hi everyone. I hope you slept better than me",
    chill: "Hey everyone. Hope you slept better than me, rough night", catty: "Hey everyone. Hope you slept well. Some of you clearly didn't", diva: "Hello, darlings! I hope you slept better than me. I had dramatic dreams",
    stoic: "Hey. Rough night" }],
  ['circle.open.06', "Is it just me or is everyone being SO nice in here?? {e:eyes}", {
    hype: "Is it just me or is everyone being SO NICE?? {e:eyes}", dry: "Is it just me or is everyone being suspiciously nice in here {e:eyes}",
    blunt: "Everyone's being too nice in here. Who's faking? {e:eyes}", goofy: "Is everyone being SO nice or did I wake up in a cartoon? {e:eyes}",
    shy: "Is it just me, or is everyone being really nice? {e:eyes}", chill: "Is everyone being super nice, or is it just me? {e:eyes}",
    catty: "Is it just me, or is everyone being SO nice? It won't last {e:eyes}", diva: "Everyone's being so nice, darlings. It's like a musical {e:eyes}",
    stoic: "Everyone's being nice. Too nice {e:eyes}" }],
  ['circle.open.m1', "Good morning Circle {e:sun} Who's actually awake?", {
    hype: "GOOD MORNING CIRCLE {e:sun} Who's AWAKE?!", dry: "Good morning, Circle {e:sun} Who's actually awake. Not me", blunt: "Morning {e:sun} Who's up?",
    goofy: "Good morning Circle {e:sun} Who's awake? I'm half awake. The other half is still in bed", shy: "Good morning {e:sun} Is anyone awake?",
    chill: "Morning, Circle {e:sun} Who's up?", catty: "Good morning {e:sun} Who's awake and who's pretending?", diva: "Good morning, darlings {e:sun} The star has risen",
    stoic: "Morning {e:sun} Who's up?" }],
  ['circle.open.m2', "Morning fam! Did anybody else dream about this place??", {
    hype: "MORNING FAM! Who else dreamed about this place?!", dry: "Morning. Did anyone else dream about this place. Because I did. Unfortunately",
    blunt: "Morning. Anyone else dream about this place?", goofy: "Morning fam! I dreamed the Circle was a giant donut. Anyone else?",
    shy: "Morning! Did anyone else dream about this place?", chill: "Morning, fam. Anyone else dream about this place?",
    catty: "Morning. Did anyone else dream about this place? Nightmare, mostly", diva: "Morning, darlings! I dreamed this place was my stage. It is",
    stoic: "Morning. Dreamed about this place" }],
  ['circle.open.m3', "Rise and shine everybody! New day, new chances {e:sparkle}", {
    hype: "RISE AND SHINE! New day, new chances! LET'S GO {e:sparkle}", dry: "Rise and shine. New day. Same apartment {e:sparkle}",
    blunt: "New day. New chances. Use them {e:sparkle}", goofy: "Rise and shine! New day! New chances! New socks! {e:sparkle}",
    shy: "Good morning everyone. New day {e:sparkle}", chill: "Rise and shine, everyone. Easy day ahead {e:sparkle}",
    catty: "Rise and shine. New day, new chances to disappoint me {e:sparkle}", diva: "Rise and shine, darlings! A new day for your star to shine {e:sparkle}",
    stoic: "New day {e:sparkle}" }],
  ['circle.open.m4', "Breakfast check. What's everybody eating?", {
    hype: "BREAKFAST CHECK! What's everybody eating?!", dry: "Breakfast check. I'm eating toast. The adventure continues", blunt: "Breakfast check. What are you eating?",
    goofy: "Breakfast check! I'm eating cereal out of a mug because I ran out of bowls", shy: "Um, what's everyone having for breakfast?",
    chill: "Breakfast check, everyone. What's on the menu?", catty: "Breakfast check. Let's see whose diet is a cry for help", diva: "Breakfast check, darlings! I'm having fruit, arranged beautifully",
    stoic: "Breakfast?" }],
  ['circle.open.m5', "Hi everyone {e:smile} How did we all sleep?", {
    hype: "HI EVERYONE {e:smile} How did we all sleep?!", dry: "Hi {e:smile} How'd everyone sleep. I slept. Barely", blunt: "Hi {e:smile} How'd everyone sleep?",
    goofy: "Hi everyone {e:smile} How did we sleep? I slept like a log. A log that kept waking up", shy: "Hi everyone {e:smile} Did you all sleep okay?",
    chill: "Hey everyone {e:smile} How'd we sleep?", catty: "Hi {e:smile} How did everyone sleep? Well, I hope. You'll need it", diva: "Hello, darlings {e:smile} How did we all sleep? I slept like royalty",
    stoic: "Hi {e:smile} Sleep okay?" }],
  ['circle.open.m6', "It's way too early for Circle Chat and I love it", {
    hype: "It's WAY too early for Circle Chat and I LOVE IT", dry: "It's too early for Circle Chat. And yet here I am", blunt: "Too early for this. I'm here anyway",
    goofy: "It's way too early for Circle Chat! My brain is still a pancake", shy: "It's really early for Circle Chat, but I'm happy to be here",
    chill: "Bit early for Circle Chat, but I'm here for it", catty: "It's far too early for Circle Chat. And yet some of you are already annoying", diva: "It's too early for Circle Chat, darlings, but the show must go on",
    stoic: "Early. I'm here" }],
  ['circle.open.e1', "Evening Circle! How was everybody's day?", {
    hype: "EVENING CIRCLE! How was everybody's DAY?!", dry: "Evening. How was everyone's day. Mine was a day", blunt: "Evening. How was your day?",
    goofy: "Evening Circle! How was everybody's day? Mine had a lot of snacks in it", shy: "Hi everyone. How was your day?",
    chill: "Evening, everyone. How was the day?", catty: "Evening. How was everybody's day? Some of you looked busy. Plotting, I assume", diva: "Good evening, darlings! How was your day? Mine was cinematic",
    stoic: "Evening. Good day?" }],
  ['circle.open.e2', "Okay who's already in bed?", {
    hype: "Who's ALREADY in bed?! It's party time!", dry: "Who's already in bed. Me. Obviously", blunt: "Who's in bed already?",
    goofy: "Who's already in bed? I'm in bed with a bowl of cereal. It's a whole situation", shy: "Is anyone already in bed? I am",
    chill: "Who's already in bed? I'm getting there, dude", catty: "Who's already in bed? The boring ones, I assume", diva: "Who's in bed already, darlings? The star never sleeps",
    stoic: "Who's in bed?" }],
  ['circle.open.e3', "Late night Circle Chat?? I'm here for it {e:eyes}", {
    hype: "LATE NIGHT CIRCLE CHAT! I'm SO here for it {e:eyes}", dry: "Late night Circle Chat. I'm here. Against my better judgment {e:eyes}",
    blunt: "Late night chat. I'm in {e:eyes}", goofy: "Late night Circle Chat! I'm here in my pajamas and a towel turban {e:eyes}",
    shy: "Late night chat? I'm here too {e:eyes}", chill: "Late night chat? I'm here for it, dude {e:eyes}",
    catty: "Late night Circle Chat. This is when people say what they really think {e:eyes}", diva: "Late night Circle Chat, darlings! The after-party {e:eyes}",
    stoic: "Late chat. I'm here {e:eyes}" }],
  ['circle.open.e4', "Dinner check. What did everybody make tonight?", {
    hype: "DINNER CHECK! What did everybody make?!", dry: "Dinner check. I made toast. Again", blunt: "Dinner check. What did you make?",
    goofy: "Dinner check! I made a sandwich with another sandwich inside it", shy: "What did everyone have for dinner tonight?",
    chill: "Dinner check, everyone. What'd you make?", catty: "Dinner check. Let's see who can actually cook", diva: "Dinner check, darlings! I had something exquisite. It was pasta",
    stoic: "Dinner?" }],
  ['circle.open.e5', "Long day in here. Sending love to everybody {e:heart}", {
    hype: "LONG day in here! Sending SO much love to everybody {e:heart}", dry: "Long day. Sending love. Don't get used to it {e:heart}",
    blunt: "Long day. Love to everyone {e:heart}", goofy: "Long day in here! Sending love and an imaginary pizza to everyone {e:heart}",
    shy: "Long day today. Sending love to everyone {e:heart}", chill: "Long one today, everyone. Sending love {e:heart}",
    catty: "Long day. Sending love to most of you {e:heart}", diva: "A long day, darlings. Sending love from my dressing room {e:heart}",
    stoic: "Long day. Love to all {e:heart}" }],
];
